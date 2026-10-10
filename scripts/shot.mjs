// 本机预览截图：用 Chrome 无头模式 + CDP 设定视口（无头 Chrome 的窗口最窄只有 500px，手机宽度要靠 CDP）。
//
//   node scripts/shot.mjs <url> <输出.png> [--width 390] [--height 844] [--dpr 1] [--full] [--search <词>]
//
// --full：整页截图。先把视口拉到整页高度，等所有图片加载完再截，懒加载的图也能截到。
// --search：站内搜索。点首页的搜索框（别的页面先点顶栏「搜索」），像键盘输入一样打进这个词，
//   等结果出来再截图，输出里带上结果条数和各条标题。
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME_BIN ?? 'google-chrome';
const MAX_FULL_HEIGHT = 16000;

function parseArgs(argv) {
	const [url, out, ...rest] = argv;
	if (!url || !out) {
		throw new Error('用法：node scripts/shot.mjs <url> <输出.png> [--width 390] [--height 844] [--dpr 1] [--full] [--search <词>]');
	}
	const opts = { url, out, width: 390, height: 844, dpr: 1, full: false, search: '' };
	for (let i = 0; i < rest.length; i++) {
		const key = rest[i].replace(/^--/, '');
		if (key === 'full') opts.full = true;
		else if (key === 'search') opts.search = rest[++i] ?? '';
		else opts[key] = Number(rest[++i]);
	}
	return opts;
}

function launchChrome(profileDir) {
	const chrome = spawn(CHROME, [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--hide-scrollbars',
		'--remote-debugging-port=0',
		`--user-data-dir=${profileDir}`,
		'about:blank',
	]);
	const endpoint = new Promise((resolve, reject) => {
		let buffer = '';
		chrome.stderr.on('data', (chunk) => {
			buffer += chunk;
			const match = /DevTools listening on (ws:\/\/\S+)/.exec(buffer);
			if (match) resolve(match[1]);
		});
		chrome.on('exit', (code) => reject(new Error(`Chrome 提前退出，code=${code}\n${buffer.slice(-2000)}`)));
	});
	return { chrome, endpoint };
}

function connect(wsUrl) {
	const ws = new WebSocket(wsUrl);
	let nextId = 1;
	const pending = new Map();
	const listeners = new Set();
	ws.addEventListener('message', (event) => {
		const msg = JSON.parse(event.data);
		if (msg.id && pending.has(msg.id)) {
			const { resolve, reject } = pending.get(msg.id);
			pending.delete(msg.id);
			msg.error ? reject(new Error(`${msg.error.message} ${msg.error.data ?? ''}`)) : resolve(msg.result);
		} else {
			for (const fn of listeners) fn(msg);
		}
	});
	const send = (method, params = {}, sessionId) =>
		new Promise((resolve, reject) => {
			const id = nextId++;
			pending.set(id, { resolve, reject });
			ws.send(JSON.stringify({ id, method, params, sessionId }));
		});
	const waitFor = (method, sessionId, timeoutMs = 30000) =>
		new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error(`等待 ${method} 超时`)), timeoutMs);
			const fn = (msg) => {
				if (msg.method === method && msg.sessionId === sessionId) {
					clearTimeout(timer);
					listeners.delete(fn);
					resolve(msg.params);
				}
			};
			listeners.add(fn);
		});
	const opened = new Promise((resolve, reject) => {
		ws.addEventListener('open', resolve, { once: true });
		ws.addEventListener('error', reject, { once: true });
	});
	return { ws, send, waitFor, opened };
}

const WAIT_PAGE_READY = `(async () => {
	await document.fonts.ready;
	const imgs = [...document.images];
	imgs.forEach((img) => { img.loading = 'eager'; });
	await Promise.all(imgs.map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
	await Promise.all(imgs.map((img) => img.decode().catch(() => null)));
	await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
	const broken = imgs.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src);
	return JSON.stringify({ height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, broken });
})()`;

// 找到要点的地方：首页的搜索框，或者顶栏的「搜索」按钮
const FIND_SEARCH = `(() => {
	const target = document.querySelector('.search-inline [data-search-input]') ?? document.querySelector('[data-search-open]');
	if (!target) throw new Error('页面上没有搜索框，也没有顶栏「搜索」按钮');
	const r = target.getBoundingClientRect();
	return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2, kind: target.matches('input') ? 'inline' : 'dialog' });
})()`;

// 等搜索出结果（或明确没结果、出错），取状态文字、各条标题和横向是否溢出
const WAIT_SEARCH = `(async () => {
	const done = (text) => /^找到 \\d+ 篇$/.test(text) || text.startsWith('没找到') || text.includes('没加载出来');
	for (let i = 0; i < 150; i++) {
		const root = document.activeElement?.closest('[data-search]');
		const status = root?.querySelector('[data-search-status]')?.textContent ?? '';
		if (done(status)) {
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			const titles = [...root.querySelectorAll('.search-hit-title')].map((el) => el.textContent);
			const marks = root.querySelectorAll('.search-hit-excerpt mark').length;
			const panel = document.querySelector('dialog[open]');
			const overflowX = Math.max(
				document.documentElement.scrollWidth - document.documentElement.clientWidth,
				panel ? panel.scrollWidth - panel.clientWidth : 0,
			);
			return JSON.stringify({ status, titles, marks, overflowX });
		}
		await new Promise((r) => setTimeout(r, 100));
	}
	throw new Error('15 秒内没等到搜索结果');
})()`;

async function main() {
	const opts = parseArgs(process.argv.slice(2));
	const profileDir = await mkdtemp(join(tmpdir(), 'ceo-shot-'));
	const { chrome, endpoint } = launchChrome(profileDir);
	try {
		const cdp = connect(await endpoint);
		await cdp.opened;
		const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
		const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
		const metrics = (height) => ({
			width: opts.width,
			height,
			deviceScaleFactor: opts.dpr,
			mobile: opts.width < 768,
		});
		await cdp.send('Page.enable', {}, sessionId);
		await cdp.send('Emulation.setDeviceMetricsOverride', metrics(opts.height), sessionId);
		const loaded = cdp.waitFor('Page.loadEventFired', sessionId);
		await cdp.send('Page.navigate', { url: opts.url }, sessionId);
		await loaded;
		const evalJSON = async (expression) => {
			const { result, exceptionDetails } = await cdp.send(
				'Runtime.evaluate',
				{ expression, awaitPromise: true, returnByValue: true },
				sessionId,
			);
			if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
			return JSON.parse(result.value);
		};
		const evaluate = () => evalJSON(WAIT_PAGE_READY);
		let info = await evaluate();
		if (opts.full) {
			await cdp.send('Emulation.setDeviceMetricsOverride', metrics(Math.min(info.height, MAX_FULL_HEIGHT)), sessionId);
			info = await evaluate();
		}
		let search;
		if (opts.search) {
			const { x, y, kind } = await evalJSON(FIND_SEARCH);
			for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
				await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }, sessionId);
			}
			await cdp.send('Input.insertText', { text: opts.search }, sessionId);
			// 鼠标挪到右下角，免得停在某条结果上显示成悬停的颜色
			await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: opts.width - 1, y: opts.height - 1 }, sessionId);
			search = { query: opts.search, via: kind, ...(await evalJSON(WAIT_SEARCH)) };
		}
		const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
		await writeFile(opts.out, Buffer.from(shot.data, 'base64'));
		console.log(
			JSON.stringify({ out: opts.out, viewport: opts.width, pageHeight: info.height, scrollWidth: info.width, broken: info.broken, search }),
		);
		cdp.ws.close();
	} finally {
		const exited = chrome.exitCode !== null ? Promise.resolve() : new Promise((resolve) => chrome.once('exit', resolve));
		chrome.kill();
		await exited;
		await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}

await main();
