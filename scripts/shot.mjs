// 本机预览截图：用 Chrome 无头模式 + CDP 设定视口（无头 Chrome 的窗口最窄只有 500px，手机宽度要靠 CDP）。
//
//   node scripts/shot.mjs <url> <输出.png> [--width 390] [--height 844] [--dpr 1] [--full]
//
// --full：整页截图。先把视口拉到整页高度，等所有图片加载完再截，懒加载的图也能截到。
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME_BIN ?? 'google-chrome';
const MAX_FULL_HEIGHT = 16000;

function parseArgs(argv) {
	const [url, out, ...rest] = argv;
	if (!url || !out) throw new Error('用法：node scripts/shot.mjs <url> <输出.png> [--width 390] [--height 844] [--dpr 1] [--full]');
	const opts = { url, out, width: 390, height: 844, dpr: 1, full: false };
	for (let i = 0; i < rest.length; i++) {
		const key = rest[i].replace(/^--/, '');
		if (key === 'full') opts.full = true;
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
		const evaluate = async () =>
			JSON.parse(
				(await cdp.send('Runtime.evaluate', { expression: WAIT_PAGE_READY, awaitPromise: true, returnByValue: true }, sessionId))
					.result.value,
			);
		let info = await evaluate();
		if (opts.full) {
			await cdp.send('Emulation.setDeviceMetricsOverride', metrics(Math.min(info.height, MAX_FULL_HEIGHT)), sessionId);
			info = await evaluate();
		}
		const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
		await writeFile(opts.out, Buffer.from(shot.data, 'base64'));
		console.log(JSON.stringify({ out: opts.out, viewport: opts.width, pageHeight: info.height, scrollWidth: info.width, broken: info.broken }));
		cdp.ws.close();
	} finally {
		const exited = chrome.exitCode !== null ? Promise.resolve() : new Promise((resolve) => chrome.once('exit', resolve));
		chrome.kill();
		await exited;
		await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}

await main();
