// 工具库清单：原样放在 public/ 下的独立网页（不经过 Astro 路由）。这是唯一来源：
//   - /tools/ 页和首页「工具库」区块用的 TOOLS（src/consts.ts，地址加上部署前缀）
//   - sitemap 手动登记的地址（astro.config.mjs）
// 加一个工具：网页放 public/<目录>/index.html，再在这里加一项。
// 写成 .mjs 是因为 astro.config.mjs 也要读它；src/consts.ts 用到 import.meta.env，配置文件里读不了。

/**
 * @typedef {object} ToolPage
 * @property {`/${string}/`} path 站内路径，以 / 开头和结尾，不带部署前缀
 * @property {string} title
 * @property {string} description
 */

/** @type {readonly ToolPage[]} */
export const TOOL_PAGES = [
	{
		path: '/matt/',
		title: 'Matt Pocock 的 Skills 线路图',
		description: '38 个 Skill 怎么用出效果。中文交互网页，整理自 mattpocock/skills（MIT）。',
	},
	{
		path: '/claude-api/',
		title: 'Claude Code 的 claude-api Skill',
		description:
			'8 个子命令怎么用：换模型、审提示词、建评测、省钱、托管 Agent。中文交互网页，整理自 Claude Code 内置的 claude-api Skill（Anthropic）。',
	},
];
