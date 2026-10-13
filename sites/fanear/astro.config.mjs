// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// 饭耳官网 https://fanear.fandao.dev（根路径）。
// 源码放在博客仓库的 sites/fanear/，跟博客共用依赖和检查脚本；构建产物推到单独的仓库发布
// （GitHub Pages 一个仓库只能绑一个自定义域名，博客仓库已经绑了 ceo.fandao.dev）。
//   npm run fanear:build         构建到 sites/fanear/dist/
// 预览构建放在别的网站的子路径下时，用环境变量换站点和前缀（同博客），站内链接都经 src/lib/url.ts 加前缀：
//   SITE_URL=https://example.com SITE_BASE=/some/path/ npm run fanear:build -- --outDir <目录>
// 几个构建同时跑（比如几版首页一起出预览）时，FANEAR_CACHE_DIR 给每个构建单独的缓存目录，免得互相覆盖
// （相对 sites/fanear，如 FANEAR_CACHE_DIR=.cache-b）。
const SITE_URL = process.env.SITE_URL ?? 'https://fanear.fandao.dev';
const SITE_BASE = process.env.SITE_BASE ?? '/';
if (!SITE_BASE.startsWith('/') || !SITE_BASE.endsWith('/')) {
	throw new Error(`SITE_BASE 要以 / 开头、以 / 结尾，现在是「${SITE_BASE}」`);
}

export default defineConfig({
	site: SITE_URL,
	base: SITE_BASE,
	output: 'static',
	trailingSlash: 'always',
	...(process.env.FANEAR_CACHE_DIR ? { cacheDir: process.env.FANEAR_CACHE_DIR } : {}),
	integrations: [sitemap()],
	image: {
		layout: 'constrained',
		breakpoints: [320, 480, 640, 960, 1320],
	},
});
