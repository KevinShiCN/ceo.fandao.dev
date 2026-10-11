// 全站共用的身份和文案。改简介只改这里。
import { TOOL_PAGES } from './lib/tools.mjs';
import { withBase } from './lib/url';

const NAME = '干饭CEO';
const TAG = 'AI · FDE下乡';

export const AUTHOR = {
	name: NAME,
	/** 账号名括号里的部分（2026-09-23 定） */
	tag: TAG,
	fullName: `${NAME}（${TAG}）`,
	/** 与各平台简介一致（2026-09-20 定稿），按顺序显示 */
	bio: ['饭导创始人', '原天美项目经理', '卖大米，用 AI 重做公司', '单日消耗百亿 Token'],
	avatarAlt: '干饭CEO 在稻田里，手握刻着「干饭CEO」的大木勺',
} as const;

export const SITE_TITLE = AUTHOR.fullName;
export const SITE_DESCRIPTION = `${AUTHOR.bio.join(' | ')}。X 和公众号发过的长文、完整提示词存在这里；交互讲解页都在工具库，拿来就能用。`;

/** 首页一句话：这个站是干什么的 */
export const SITE_INTRO =
	'X 和公众号发过的长文存在这里，每篇标出原发链接。平台放不下的完整提示词、代码也放在这里。交互讲解页都在工具库，可以自己查，也能直接转发给别人。';

export const LINKS = {
	x: { label: 'X', handle: '@ganfanCEO', href: 'https://x.com/ganfanCEO' },
	/** 这几个平台不放链接，写「搜干饭CEO」（10-10 本人：抖音、小红书、视频号都可以搜索干饭 CEO） */
	search: { platforms: ['公众号', '抖音', '小红书', '视频号'], keyword: NAME },
	rss: { label: 'RSS', href: withBase('/rss.xml') },
} as const;

/** 工具库页（/tools/）标题下的一句，也是这一页的简介 */
export const TOOLS_INTRO = '拿来就能用的交互讲解页：自己查，也能直接转发给别人。';

/** 工具库：原样放在 public/ 下的独立网页，清单在 src/lib/tools.mjs（sitemap 也从那里取），这里加上部署前缀 */
export const TOOLS = TOOL_PAGES.map(({ path, title, description }) => ({ href: withBase(path), title, description }));
