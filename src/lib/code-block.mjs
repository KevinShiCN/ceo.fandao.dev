// Shiki 转换器：把每个代码块包成 .code-block，顶上放一个「复制」按钮。
// 按钮在构建时就写进 HTML（先隐藏），由 CodeCopy 脚本接管点击，所以不会有加载后插入造成的跳动。

/** 这些语言是成段的文字（多半是提示词），自动换行；其余是代码，保持原样、横向滚动。 */
const PROSE_LANGS = new Set(['text', 'txt', 'plaintext', 'plain', 'md', 'markdown']);

/** @param {string} tagName @param {Record<string, unknown>} properties @param {any[]} children */
const el = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });
const txt = (value) => ({ type: 'text', value });

/** @returns {import('shiki').ShikiTransformer} */
export function codeBlockTransformer() {
	return {
		name: 'ceo-code-block',
		root(root) {
			const pre = root.children.find((node) => node.type === 'element' && node.tagName === 'pre');
			if (!pre) return;
			const lang = String(this.options.lang ?? 'plaintext').toLowerCase();
			const wrap = PROSE_LANGS.has(lang);
			// 按钮和读屏提示不是正文：data-pagefind-ignore 让站内搜索不收这一行（见 src/lib/search-index.mjs）
			const head = el('div', { className: ['code-head'], dataPagefindIgnore: 'all' }, [
				el('button', { type: 'button', className: ['code-copy'], hidden: true }, [txt('复制')]),
				el('span', { className: ['code-status', 'visually-hidden'], role: 'status', ariaLive: 'polite' }),
			]);
			root.children = [
				el('div', { className: ['code-block'], dataLang: lang, dataWrap: wrap ? 'true' : 'false' }, [head, pre]),
			];
		},
	};
}
