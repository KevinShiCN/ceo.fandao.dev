// 饭耳两份条款（使用条款与免责声明、隐私说明）和「使用前须知」的解析器。
// 唯一来源是 fanear 仓库的 Sources/FanEarCore/LegalTexts.swift（正文）和 Consent.swift（版本号、更新日期），
// 跟 App 里显示的一字不差。同步命令用 scripts/fanear-legal.mjs 调这里，生成 src/data/legal.json；
// 官网的 /terms/、/privacy/ 只读那份 JSON，不在构建时碰 Swift。
//
// 只认 LegalTexts.swift 现在的写法，其余一律报错（带行号），宁可同步失败，也不让官网少一段或多一段：
//   static let points: [ConsentPoint] = [ ConsentPoint(id: "…", title: "…", detail: "…"), … ]
//   static let healthOption = ConsentPoint(id: "…", title: "…", detail: "…")
//   static let buttonNotice = "…"      static let agreementLine = "…"
//   static let terms / privacy = LegalDocument(id: "…", title: "…", sections: [ LegalSection("…", [ .plain("…") | .notice("…"), … ]), … ])
// 字符串只认普通双引号字符串（可带 \" \\ \n \t 转义）；字符串插值、多行字符串、用 + 拼接都报错。
// 写成 .mjs 是为了生成脚本和测试（scripts/fanear-legal.test.mjs）不经编译直接用。

/**
 * @typedef {{ id: string, title: string, detail: string }} LegalPoint
 * @typedef {{ text: string, notice: boolean }} LegalParagraph
 * @typedef {{ heading: string, paragraphs: LegalParagraph[] }} LegalSection
 * @typedef {{ id: string, title: string, sections: LegalSection[] }} LegalDocument
 * @typedef {{
 *   version: number, updatedOn: string,
 *   consent: { points: LegalPoint[], healthOption: LegalPoint, agreementLine: string, buttonNotice: string },
 *   terms: LegalDocument, privacy: LegalDocument,
 * }} Legal
 */

/** LegalTexts.swift 里必须有、也只能有这几个 static let */
const EXPECTED = ['points', 'healthOption', 'buttonNotice', 'agreementLine', 'terms', 'privacy'];
const ESCAPES = { '"': '"', '\\': '\\', n: '\n', t: '\t', "'": "'" };

class LegalParseError extends Error {}

/**
 * 把 Swift 源码切成记号：标识符、数字、字符串、标点。注释跳过。
 * @param {string} src
 * @param {string} file 报错时用的文件名
 */
function tokenize(src, file) {
	/** @type {{ kind: 'ident' | 'number' | 'string' | 'punct', value: string, line: number }[]} */
	const tokens = [];
	let i = 0;
	let line = 1;
	const fail = (msg) => {
		throw new LegalParseError(`${file} 第 ${line} 行：${msg}`);
	};
	while (i < src.length) {
		const c = src[i];
		if (c === '\n') {
			line++;
			i++;
		} else if (/\s/.test(c)) {
			i++;
		} else if (src.startsWith('//', i)) {
			while (i < src.length && src[i] !== '\n') i++;
		} else if (src.startsWith('/*', i)) {
			const end = src.indexOf('*/', i + 2);
			if (end < 0) fail('块注释没有结尾');
			line += src.slice(i, end).split('\n').length - 1;
			i = end + 2;
		} else if (src.startsWith('"""', i) || src.startsWith('#"', i)) {
			fail('不认多行字符串或原始字符串，请写成普通双引号字符串');
		} else if (c === '"') {
			const startLine = line;
			let value = '';
			i++;
			for (;;) {
				if (i >= src.length || src[i] === '\n') fail('字符串没有结尾');
				const ch = src[i];
				if (ch === '"') {
					i++;
					break;
				}
				if (ch === '\\') {
					const next = src[i + 1];
					if (next === '(') fail('不认字符串插值 \\(…)：官网要的是写死的原文');
					if (!(next in ESCAPES)) fail(`不认的转义 \\${next}`);
					value += ESCAPES[next];
					i += 2;
					continue;
				}
				value += ch;
				i++;
			}
			tokens.push({ kind: 'string', value, line: startLine });
		} else if (/[A-Za-z_]/.test(c)) {
			let j = i;
			while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
			tokens.push({ kind: 'ident', value: src.slice(i, j), line });
			i = j;
		} else if (/[0-9]/.test(c)) {
			let j = i;
			while (j < src.length && /[0-9]/.test(src[j])) j++;
			tokens.push({ kind: 'number', value: src.slice(i, j), line });
			i = j;
		} else {
			tokens.push({ kind: 'punct', value: c, line });
			i++;
		}
	}
	return tokens;
}

/**
 * 一个只认上面几种写法的小解析器：值 = 字符串 | 数组 [值, …] | 调用 名字(标签: 值, …) | 成员调用 .名字(值)。
 * @param {ReturnType<typeof tokenize>} tokens
 * @param {number} pos 从哪个记号开始
 * @param {string} file
 */
function parseValueAt(tokens, pos, file) {
	let p = pos;
	const peek = () => tokens[p];
	const fail = (msg) => {
		const t = tokens[Math.min(p, tokens.length - 1)];
		throw new LegalParseError(`${file} 第 ${t?.line ?? '?'} 行：${msg}（看到的是「${t?.value ?? '文件结尾'}」）`);
	};
	const expect = (value) => {
		if (peek()?.value !== value || peek()?.kind === 'string') fail(`这里应该是「${value}」`);
		p++;
	};
	// 参数表：(标签: 值, 值, …)，允许末尾逗号
	const args = () => {
		expect('(');
		/** @type {{ label: string | null, value: unknown }[]} */
		const list = [];
		while (peek()?.value !== ')' || peek()?.kind === 'string') {
			let label = null;
			if (peek()?.kind === 'ident' && tokens[p + 1]?.value === ':') {
				label = peek().value;
				p += 2;
			}
			list.push({ label, value: value() });
			if (peek()?.value === ',' && peek()?.kind === 'punct') p++;
			else if (!(peek()?.value === ')' && peek()?.kind === 'punct')) fail('参数之间应该是逗号');
		}
		p++;
		return list;
	};
	const value = () => {
		const t = peek();
		if (!t) fail('意外到了文件结尾');
		let v;
		if (t.kind === 'string') {
			p++;
			v = t.value;
		} else if (t.kind === 'punct' && t.value === '[') {
			p++;
			v = [];
			while (!(peek()?.kind === 'punct' && peek().value === ']')) {
				v.push(value());
				if (peek()?.kind === 'punct' && peek().value === ',') p++;
				else if (!(peek()?.kind === 'punct' && peek().value === ']')) fail('数组元素之间应该是逗号');
			}
			p++;
		} else if (t.kind === 'punct' && t.value === '.') {
			p++;
			const name = peek();
			if (name?.kind !== 'ident') fail('「.」后面应该是名字');
			p++;
			v = { member: name.value, args: args(), line: t.line };
		} else if (t.kind === 'ident' && tokens[p + 1]?.value === '(') {
			p++;
			v = { call: t.value, args: args(), line: t.line };
		} else {
			fail('不认的写法');
		}
		// 值后面只能是逗号、右括号、右方括号或下一个声明；出现 + 之类说明在拼接字符串
		const after = peek();
		if (after?.kind === 'punct' && ![',', ')', ']', '}'].includes(after.value)) fail('不认值后面跟运算符（比如用 + 拼字符串）');
		return v;
	};
	const result = value();
	return { value: result, end: p };
}

/** @param {unknown} v @param {string} what */
function str(v, what) {
	if (typeof v !== 'string') throw new LegalParseError(`${what} 应该是一段写死的文字`);
	if (v.trim() === '') throw new LegalParseError(`${what} 是空的`);
	return v;
}

/**
 * 把调用的参数按标签取出来，标签和顺序都要对上。
 * @param {any} v @param {string} callee @param {(string | null)[]} labels @param {string} what
 */
function callArgs(v, callee, labels, what) {
	if (!v || typeof v !== 'object' || v.call !== callee) throw new LegalParseError(`${what} 应该是 ${callee}(…)`);
	const got = v.args.map((a) => a.label);
	if (JSON.stringify(got) !== JSON.stringify(labels)) {
		throw new LegalParseError(`${what}（第 ${v.line} 行）的参数应该是 ${JSON.stringify(labels)}，实际是 ${JSON.stringify(got)}`);
	}
	return v.args.map((a) => a.value);
}

/** @returns {LegalPoint} */
function point(v, what) {
	const [id, title, detail] = callArgs(v, 'ConsentPoint', ['id', 'title', 'detail'], what);
	return { id: str(id, `${what} 的 id`), title: str(title, `${what} 的 title`), detail: str(detail, `${what} 的 detail`) };
}

/** @returns {LegalDocument} */
function legalDocument(v, what) {
	const [id, title, sections] = callArgs(v, 'LegalDocument', ['id', 'title', 'sections'], what);
	if (!Array.isArray(sections) || sections.length === 0) throw new LegalParseError(`${what} 的 sections 应该是不空的数组`);
	return {
		id: str(id, `${what} 的 id`),
		title: str(title, `${what} 的 title`),
		sections: sections.map((s, i) => {
			const [heading, paragraphs] = callArgs(s, 'LegalSection', [null, null], `${what} 第 ${i + 1} 节`);
			if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
				throw new LegalParseError(`${what} 第 ${i + 1} 节的段落应该是不空的数组`);
			}
			return {
				heading: str(heading, `${what} 第 ${i + 1} 节的标题`),
				paragraphs: paragraphs.map((para, k) => {
					const where = `${what} 第 ${i + 1} 节第 ${k + 1} 段`;
					if (!para || typeof para !== 'object' || !['plain', 'notice'].includes(para.member)) {
						throw new LegalParseError(`${where} 应该是 .plain("…") 或 .notice("…")`);
					}
					if (para.args.length !== 1 || para.args[0].label !== null) throw new LegalParseError(`${where} 应该只有一段文字`);
					return { text: str(para.args[0].value, where), notice: para.member === 'notice' };
				}),
			};
		}),
	};
}

/**
 * 找 static let 名字 =（可带类型标注），返回等号后面的记号位置。
 * @param {ReturnType<typeof tokenize>} tokens
 */
function staticLets(tokens) {
	/** @type {Map<string, number>} */
	const found = new Map();
	for (let i = 0; i + 2 < tokens.length; i++) {
		if (tokens[i].kind === 'ident' && tokens[i].value === 'static' && tokens[i + 1].value === 'let' && tokens[i + 2].kind === 'ident') {
			const name = tokens[i + 2].value;
			let j = i + 3;
			while (j < tokens.length && !(tokens[j].kind === 'punct' && tokens[j].value === '=')) {
				if (tokens[j].kind === 'string' || (tokens[j].kind === 'ident' && tokens[j].value === 'static')) break;
				j++;
			}
			if (tokens[j]?.value !== '=' || tokens[j]?.kind !== 'punct') {
				throw new LegalParseError(`static let ${name}（第 ${tokens[i].line} 行）后面没找到等号`);
			}
			if (found.has(name)) throw new LegalParseError(`static let ${name} 出现了两次`);
			found.set(name, j + 1);
		}
	}
	return found;
}

/**
 * @param {string} textsSrc LegalTexts.swift 全文
 * @param {string} consentSrc Consent.swift 全文（取 LegalTerms.version 和 updatedOn）
 * @returns {Legal}
 */
export function parseLegalSwift(textsSrc, consentSrc) {
	const tokens = tokenize(textsSrc, 'LegalTexts.swift');
	const lets = staticLets(tokens);
	const names = [...lets.keys()];
	const missing = EXPECTED.filter((n) => !lets.has(n));
	const extra = names.filter((n) => !EXPECTED.includes(n));
	if (missing.length || extra.length) {
		throw new LegalParseError(
			`LegalTexts.swift 的 static let 跟官网认的不一样：缺 ${JSON.stringify(missing)}，多 ${JSON.stringify(extra)}。` +
				'App 里加了新的条款内容，先改官网解析器和页面再同步',
		);
	}
	/** @type {Record<string, unknown>} */
	const raw = {};
	for (const name of EXPECTED) raw[name] = parseValueAt(tokens, /** @type {number} */ (lets.get(name)), 'LegalTexts.swift').value;

	if (!Array.isArray(raw.points) || raw.points.length === 0) throw new LegalParseError('points 应该是不空的数组');
	const points = raw.points.map((v, i) => point(v, `使用前须知第 ${i + 1} 条`));
	const ids = points.map((p) => p.id);
	if (new Set(ids).size !== ids.length) throw new LegalParseError(`使用前须知的 id 有重复：${ids.join(', ')}`);

	// 段落数核对：源码里 .plain( / .notice( / ConsentPoint( / LegalSection( 出现的次数，要跟解析出来的一样多
	const count = (pred) => tokens.filter((t, i) => pred(t, i)).length;
	const isMember = (name) => (t, i) => t.kind === 'punct' && t.value === '.' && tokens[i + 1]?.value === name && tokens[i + 2]?.value === '(';
	const isCall = (name) => (t, i) => t.kind === 'ident' && t.value === name && tokens[i + 1]?.value === '(';
	const legal = {
		version: 0,
		updatedOn: '',
		consent: {
			points,
			healthOption: point(raw.healthOption, '健康数据可选项'),
			agreementLine: str(raw.agreementLine, 'agreementLine'),
			buttonNotice: str(raw.buttonNotice, 'buttonNotice'),
		},
		terms: legalDocument(raw.terms, '使用条款'),
		privacy: legalDocument(raw.privacy, '隐私说明'),
	};
	const docs = [legal.terms, legal.privacy];
	const paras = docs.flatMap((d) => d.sections.flatMap((s) => s.paragraphs));
	const checks = [
		['.plain(', count(isMember('plain')), paras.filter((p) => !p.notice).length],
		['.notice(', count(isMember('notice')), paras.filter((p) => p.notice).length],
		['LegalSection(', count(isCall('LegalSection')), docs.reduce((n, d) => n + d.sections.length, 0)],
		['ConsentPoint(', count(isCall('ConsentPoint')), points.length + 1],
		['LegalDocument(', count(isCall('LegalDocument')), docs.length],
	];
	for (const [what, inSource, parsed] of checks) {
		if (inSource !== parsed) throw new LegalParseError(`LegalTexts.swift 里有 ${inSource} 个 ${what}，解析出来 ${parsed} 个，对不上`);
	}

	const { version, updatedOn } = parseLegalVersion(consentSrc);
	return { ...legal, version, updatedOn };
}

/**
 * 从 Consent.swift 的 enum LegalTerms 里取版本号和更新日期。
 * @param {string} src
 */
export function parseLegalVersion(src) {
	const start = src.indexOf('public enum LegalTerms {');
	if (start < 0) throw new LegalParseError('Consent.swift 里没找到 public enum LegalTerms');
	const body = src.slice(start);
	const versions = [...body.matchAll(/^\s*public static let version = (\d+)\s*$/gm)];
	const dates = [...body.matchAll(/^\s*public static let updatedOn = "(\d{4}-\d{2}-\d{2})"\s*$/gm)];
	if (versions.length !== 1) throw new LegalParseError(`Consent.swift 的 LegalTerms 里应该正好有一行 version = 数字，找到 ${versions.length} 行`);
	if (dates.length !== 1) throw new LegalParseError(`Consent.swift 的 LegalTerms 里应该正好有一行 updatedOn = "年-月-日"，找到 ${dates.length} 行`);
	const version = Number(versions[0][1]);
	if (!(version >= 1)) throw new LegalParseError(`LegalTerms.version 应该从 1 起，现在是 ${versions[0][1]}`);
	return { version, updatedOn: dates[0][1] };
}

/** 跟 App 须知页、条款页顶上那行一样：「第 1 版 · 更新于 2026-10-13」 */
export function versionLine(legal) {
	return `第 ${legal.version} 版 · 更新于 ${legal.updatedOn}`;
}

export { LegalParseError };
