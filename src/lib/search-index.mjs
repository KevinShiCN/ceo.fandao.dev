// 站内搜索的索引（Pagefind）。挂在 Astro 构建结束的钩子上，在实际输出目录里生成 pagefind/，
// 所以 npm run build 和换了输出目录的预览构建（astro build --outDir <目录>）都会建索引，不会漏。
// 只在浏览器里搜，不用服务器；搜索界面见 src/components/Search.astro。
//
// 收哪些页、收页里哪部分，由页面上的 data-pagefind-* 属性决定：
//   - 文章正文（Post.astro 的 .prose，标题作为 title 元数据）和关于页（about.astro）标了 data-pagefind-body；
//     没标的页面一律不收：首页、404、public/ 下的 /matt/。
//   - 代码块的「复制」按钮标了 data-pagefind-ignore（code-block.mjs）。导航、页脚、本文目录在 data-pagefind-body 外面。
// 页面是 <html lang="zh-CN">，Pagefind 按中文分词。npm 包调用的是 pagefind_extended（带中文分词），见 node_modules/pagefind/lib/service.js。
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';

/** 搜索界面是自己写的，只用 pagefind.js；Pagefind 附带的这几套现成界面和高亮脚本没有页面加载，不发布 */
const UNUSED_FILES = [
	'pagefind-ui.js',
	'pagefind-ui.css',
	'pagefind-modular-ui.js',
	'pagefind-modular-ui.css',
	'pagefind-component-ui.js',
	'pagefind-component-ui.css',
	'pagefind-highlight.js',
];

/** @param {string} step @param {string[]} errors */
function failOn(step, errors) {
	if (errors.length > 0) throw new Error(`站内搜索索引：${step}出错：${errors.join('；')}`);
}

/** @returns {import('astro').AstroIntegration} */
export function searchIndex() {
	return {
		name: 'ceo-search-index',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const siteDir = fileURLToPath(dir);
				const bundleDir = join(siteDir, 'pagefind');
				// 上次构建留下的索引先删掉，免得旧文件混进来
				await rm(bundleDir, { recursive: true, force: true });
				try {
					const { index, errors } = await pagefind.createIndex();
					failOn('启动 Pagefind ', errors);
					if (!index) throw new Error('站内搜索索引：Pagefind 没有返回索引对象');
					// added.page_count 是读过的 HTML 文件数（含没标 data-pagefind-body、不收的页面）
					const added = await index.addDirectory({ path: siteDir });
					failOn('读页面', added.errors);
					const written = await index.writeFiles({ outputPath: bundleDir });
					failOn('写索引文件', written.errors);
					await Promise.all(UNUSED_FILES.map((name) => rm(join(bundleDir, name), { force: true })));
					// 真正收进索引的页数和语言，以 Pagefind 写出的 pagefind-entry.json 为准
					const entry = JSON.parse(await readFile(join(bundleDir, 'pagefind-entry.json'), 'utf-8'));
					const languages = Object.entries(entry.languages).map(([lang, info]) => `${lang} ${info.page_count} 页`);
					const indexed = Object.values(entry.languages).reduce((sum, info) => sum + info.page_count, 0);
					if (indexed === 0) {
						throw new Error('站内搜索索引：一页都没收进来，检查文章页和关于页的 data-pagefind-body');
					}
					logger.info(`站内搜索索引：读了 ${added.page_count} 个页面，收进 ${indexed} 页（${languages.join('，')}），写到 ${bundleDir}`);
				} finally {
					await pagefind.close();
				}
			},
		},
	};
}
