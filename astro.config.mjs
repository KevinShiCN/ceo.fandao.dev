// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { codeBlockTransformer } from './src/lib/code-block.mjs';
import { searchIndex } from './src/lib/search-index.mjs';
import { TOOL_PAGES } from './src/lib/tools.mjs';

// 正式站：https://ceo.fandao.dev 的根路径。
// 预览构建放在别的网站的子路径下时，用环境变量换掉站点和前缀，例如：
//   SITE_URL=https://example.com SITE_BASE=/some/path/ astro build --outDir <目录>
// 站内链接都经 src/lib/url.ts 加前缀，换了前缀不用改页面。
const SITE_URL = process.env.SITE_URL ?? 'https://ceo.fandao.dev';
const SITE_BASE = process.env.SITE_BASE ?? '/';
if (!SITE_BASE.startsWith('/') || !SITE_BASE.endsWith('/')) {
	throw new Error(`SITE_BASE 要以 / 开头、以 / 结尾，现在是「${SITE_BASE}」`);
}
const siteRoot = new URL(SITE_BASE, SITE_URL);

export default defineConfig({
	site: SITE_URL,
	base: SITE_BASE,
	output: 'static',
	integrations: [
		mdx(),
		// public/ 下的独立网页（工具库里的工具）不经过 Astro 路由，手动登记进 sitemap；清单和 /tools/ 页同一份
		sitemap({ customPages: TOOL_PAGES.map((tool) => new URL(tool.path.slice(1), siteRoot).href) }),
		// 构建完在输出目录里建站内搜索索引（pagefind/），换了 --outDir 也跟着走
		searchIndex(),
	],
	image: {
		layout: 'constrained',
		breakpoints: [640, 960, 1280, 1920],
	},
	markdown: {
		// 正文要和发布版一字不差：关掉智能标点，否则 "引号" 会被换成弯引号、--- 会被换成破折号
		processor: satteri({ features: { smartPunctuation: false } }),
		shikiConfig: {
			themes: { light: 'github-light' },
			defaultColor: false,
			transformers: [codeBlockTransformer()],
		},
	},
});
