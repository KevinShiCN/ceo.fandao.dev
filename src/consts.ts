// 全站共用的身份和文案。改简介只改这里。
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
export const SITE_DESCRIPTION = `${AUTHOR.bio.join(' | ')}。X 和公众号发过的长文、完整提示词和交互网页都存在这里。`;

/** 首页一句话：这个站是干什么的 */
export const SITE_INTRO =
	'X 和公众号发过的长文存在这里，每篇标出原发链接。平台放不下的完整提示词、代码、交互网页，也放在这里。';

export const LINKS = {
	x: { label: 'X', handle: '@ganfanCEO', href: 'https://x.com/ganfanCEO' },
	/** 这几个平台不放链接，写「搜干饭CEO」（10-10 本人：抖音、小红书、视频号都可以搜索干饭 CEO） */
	search: { platforms: ['公众号', '抖音', '小红书', '视频号'], keyword: NAME },
	rss: { label: 'RSS', href: withBase('/rss.xml') },
} as const;

/** 不经过 Astro 路由、原样放在 public/ 下的独立网页 */
export const STANDALONE_PAGES = [
	{
		href: withBase('/matt/'),
		title: 'Matt Pocock 的 Skills 线路图',
		description: '38 个 Skill 怎么用出效果。中文交互网页，整理自 mattpocock/skills（MIT）。',
	},
] as const;
