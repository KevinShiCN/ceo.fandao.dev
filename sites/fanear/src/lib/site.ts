// 全站共用的名字、状态和导航。改文案只改这里。
// 规矩：只写真事。App 现在的状态以 fanear 仓库的 CHANGELOG.md 为准（这里的状态句跟它的「未发布」写法对得上）。

export const SITE = {
	name: '饭耳',
	nameEn: 'FanEar',
	/** 浏览器标签和分享卡片上的站名 */
	title: '饭耳 FanEar',
	/** 一句话：它是什么 */
	tagline: '手表全天录音，把答应的事挑出来提醒你。',
	/** 首页首屏的大字（10-23 本人 AS1 C，他的原话） */
	slogan: '说出口的东西都不会漏了',
	/** 搜索结果和分享卡片的简介 */
	description:
		'我有 ADHD，饭耳是给自己做的：手表全天录音，把你答应别人的、别人答应你的挑出来，到点提醒。免费。',
} as const;

/** 小红书账号：跟 App 第一次打开最后一页的邀请语一致（饭耳仓库 Sources/FanEarCore/ShareInvite.swift：「@饭耳 FanEar」）。
 *  本人 10-15 GW2 A 确认：饭耳 FanEar。小红书不放链接，写账号名让人搜。 */
export const XHS = {
	name: '饭耳 FanEar',
	search: '小红书搜「饭耳 FanEar」',
} as const;

/** App 现在的状态。
 *  10-14 本人 XF7 A：当时 TestFlight 只给开发者自己，状态是「内测中，还没对外发布」。
 *  10-17 本人 Q6 A：TestFlight 外部测试开了（公开链接），链接只在小红书群里，官网不放（10-16：「TestFlight 不在官网，官网只是展示的」「小红书是主要地方」「然后小红书的主页群组拿 TestFlight 的方法才对」）。
 *  10-23 本人 AS7 A：10-22 晚中国大陆也上架了，「公开测试中」改掉。测试版还在发，进群的路照旧只写小红书。 */
export const STATUS = {
	/** 页头和首页上的短标签 */
	label: '已上架 App Store',
	/** 一句话说清现在能不能用（前面总跟着 label，见页脚、使用说明、常见问题） */
	text: '搜「饭耳」就能下载，免费。',
	/** 首页、页脚、使用说明的一句：测试版去哪拿（小红书只写这一行） */
	follow: `想先用测试版、提建议，去小红书「${XHS.name}」主页进群。`,
} as const;

export interface NavItem {
	path: `/${string}/`;
	label: string;
}

/** 页头导航（首页不在里面，点 LOGO 回首页） */
export const NAV: readonly NavItem[] = [
	{ path: '/features/', label: '功能' },
	{ path: '/guide/', label: '使用说明' },
	{ path: '/faq/', label: '常见问题' },
	{ path: '/changelog/', label: '更新记录' },
];

/** 页脚的两份条款。全文由另一个会话定稿（跟 App 里的一字不差），定稿前页面只写「定稿后放这里」 */
export const LEGAL: readonly NavItem[] = [
	{ path: '/terms/', label: '使用条款与免责声明' },
	{ path: '/privacy/', label: '隐私说明' },
];

/** 做饭耳的人在做什么，页脚每页都写（10-13 本人：「虽然是免费的，但是告诉他们我们是饭导五常大米，让用户可以去网点购买五常大米」）。
 *  条款里饭耳的提供方是个人开发者，所以写「作者在做饭导五常大米」，不写「饭导出品」。
 *  买米（10-13 本人：「发微信小店的连接，扫码打开」）：链接是微信小店后台「物料中心」里的店铺网页链接（9-15 dash 盘点小店时记下）。
 *  10-13 复核：电脑、iPhone 浏览器打开都是 200，标题「微信小店｜饭导五常大米」，页面自己唤起微信；微信里打开直接进小店。
 *  public/shop-qr.svg 是这个链接的二维码（segno，纠错 M），改链接要重新生成并扫一遍核对。 */
export const MAKER = {
	line: '饭耳免费。作者在做饭导五常大米，给餐厅供米。',
	shop: {
		url: 'https://store.weixin.qq.com/shop/b/rKLGUz4XqmFKlfA?entrance_id=h5',
		// 入口的字 10-15 本人改成「去买饭导五常大米」；10-16 改成「去送家人饭导五常大米～新米刚刚上市！」（～全角），和饭耳 0.2.3 设置页最上面那一行一致（本人 FW1 A）。
		label: '去送家人饭导五常大米～新米刚刚上市！',
		qr: '/shop-qr.svg',
		qrAlt: '微信扫码，进饭导五常大米的微信小店',
	},
} as const;

/** 需求墙（10-14 上线）：提需求、给别人的需求投票，做不做、为什么都写在上面。
 *  提需求和投票要用微信扫码关注「饭导五常大米」登录；只看不用登录。 */
export const WISH = {
	url: 'https://wish.fanear.fandao.dev',
	label: '去需求墙提需求',
} as const;

/** 作者的博客：饭耳官网的源码也在博客仓库里 */
export const AUTHOR = {
	name: '干饭CEO',
	blog: 'https://ceo.fandao.dev/',
} as const;
