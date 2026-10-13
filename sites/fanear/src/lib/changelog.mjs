// 饭耳更新记录的解析器。来源是 fanear 仓库的 CHANGELOG.md（唯一来源），同步命令原样复制到
// src/data/CHANGELOG.md；官网「更新记录」页和同步脚本都用这里解析。
// 写成 .mjs 是为了同步脚本和测试（scripts/fanear-changelog.test.mjs）不经编译直接用。
//
// 认的格式（跟 CHANGELOG.md 现在的写法一致）：
//   # 标题、开头的说明 ——给写更新记录的人看的，不进页面
//   ## 未发布 / ## 已发布 ——两个分组都要有，别的分组名报错
//   ### 0.1.0（说明）   ——版本号开头，括号里的话原样显示
//   - 2026-10-13 一条更新 ——日期可以不写；折行时续行缩进两个空格
//   （还没有）          ——分组里还没有版本时写这一句
// 看不懂的行一律报错（带行号），不悄悄丢掉：宁可同步失败，也不让官网少一条。

/**
 * @typedef {{ date: string | null, text: string }} ChangelogItem
 * @typedef {{ version: string, note: string, anchor: string, items: ChangelogItem[] }} ChangelogVersion
 * @typedef {{ unreleased: ChangelogVersion[], released: ChangelogVersion[] }} Changelog
 */

const SECTIONS = /** @type {const} */ ({ 未发布: 'unreleased', 已发布: 'released' });
const EMPTY_MARK = /^[（(]还没有[）)]$/;
const VERSION_HEADING = /^(\d+\.\d+(?:\.\d+)?)\s*(.*)$/;
const DATED_ITEM = /^(\d{4}-\d{2}-\d{2})\s+(.+)$/;
const CJK = /[　-〿㐀-鿿＀-￯]/;

/**
 * @param {string} markdown CHANGELOG.md 全文
 * @returns {Changelog}
 */
export function parseChangelog(markdown) {
	/** @type {Changelog} */
	const log = { unreleased: [], released: [] };
	/** @type {Record<string, { line: number, empty: boolean }>} */
	const seen = {};
	/** @type {'unreleased' | 'released' | null} */
	let section = null;
	/** @type {ChangelogVersion | null} */
	let version = null;
	/** @type {Map<string, number>} 版本号 -> 第几行，查重用 */
	const versionLines = new Map();

	const fail = (/** @type {number} */ n, /** @type {string} */ why) => {
		throw new Error(`更新记录格式不对：第 ${n} 行，${why}`);
	};
	const closeVersion = () => {
		if (version && version.items.length === 0) {
			throw new Error(`更新记录格式不对：版本 ${version.version} 下面没有条目`);
		}
		version = null;
	};

	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	lines.forEach((raw, index) => {
		const n = index + 1;
		const line = raw.trim();
		if (raw.startsWith('## ')) {
			closeVersion();
			const name = line.slice(3).trim();
			if (!(name in SECTIONS)) fail(n, `不认识的分组「${name}」：只能是「未发布」「已发布」`);
			if (name in seen) fail(n, `「${name}」分组写了两次`);
			section = SECTIONS[/** @type {keyof typeof SECTIONS} */ (name)];
			seen[name] = { line: n, empty: false };
			return;
		}
		// 第一个分组之前是标题和给写的人看的说明，不进页面
		if (section === null || line === '') return;
		const current = seen[section === 'unreleased' ? '未发布' : '已发布'];

		if (raw.startsWith('### ')) {
			closeVersion();
			if (current.empty) fail(n, '这个分组已经写了「（还没有）」，有版本了就把那一句删掉');
			const match = VERSION_HEADING.exec(line.slice(4).trim());
			if (!match) fail(n, `版本标题要以版本号开头（如 0.1.0），现在是「${line}」`);
			const [, number, rest] = /** @type {RegExpExecArray} */ (match);
			if (versionLines.has(number)) {
				fail(n, `版本 ${number} 写了两次（第 ${versionLines.get(number)} 行也有）`);
			}
			versionLines.set(number, n);
			version = { version: number, note: stripParens(rest), anchor: `v${number.replaceAll('.', '-')}`, items: [] };
			log[section].push(version);
			return;
		}
		if (EMPTY_MARK.test(line)) {
			if (log[section].length > 0) fail(n, '分组里已经有版本了，不能再写「（还没有）」');
			current.empty = true;
			return;
		}
		if (raw.startsWith('- ')) {
			if (!version) fail(n, `条目要写在版本标题（### 0.1.0）下面：「${line}」`);
			const text = raw.slice(2).trim();
			const dated = DATED_ITEM.exec(text);
			/** @type {ChangelogVersion} */ (version).items.push(
				dated ? { date: dated[1], text: dated[2].trim() } : { date: null, text },
			);
			return;
		}
		if (/^\s{2,}\S/.test(raw) && version && version.items.length > 0) {
			const item = version.items[version.items.length - 1];
			item.text = joinWrapped(item.text, line);
			return;
		}
		fail(n, `看不懂「${line}」：版本下面只写「- 日期 说明」这样的条目`);
	});
	closeVersion();

	for (const name of /** @type {const} */ (['未发布', '已发布'])) {
		if (!(name in seen)) throw new Error(`更新记录格式不对：少了「## ${name}」分组（没有版本时写「（还没有）」）`);
	}
	return log;
}

/** 「（说明）」去掉外面一层括号；没有括号就原样 */
function stripParens(/** @type {string} */ text) {
	const match = /^[（(](.*)[）)]$/.exec(text.trim());
	return (match ? match[1] : text).trim();
}

/** 折行的续行接回去：两边都是中文就直接接上，否则隔一个空格 */
function joinWrapped(/** @type {string} */ head, /** @type {string} */ tail) {
	return CJK.test(head.slice(-1)) && CJK.test(tail[0]) ? head + tail : `${head} ${tail}`;
}
