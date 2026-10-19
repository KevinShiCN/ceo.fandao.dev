// 首页「我」这一节：先介绍我，再介绍饭耳（10-15 本人：第一页「先介绍我再介绍饭耳」），跟 App 第一次打开的介绍页一致。
// INTRO 的句子一字不改照抄饭耳仓库 Sources/FanEarCore/AppIntro.swift（AppIntro.fanEar）；那里注明心愿、没有服务器、
// 小红书留言、「不一定非得选我」几句是本人原话。写法约束同 App：只写「免费」不写「永久」，不说能治疗、改善 ADHD，不承诺「不会忘」。
// WHY 是官网原有的「为什么做」，跟介绍页合成一节；「免费」只说一次（WHY.terms 第一条用 INTRO.about 原话）。
// 别家不写名字（10-19 本人：「避免官网的所有里面都不能提到竞品」），只用「某录音卡产品」「某录音APP」「某概念产品」这类说法；
// 本仓库公开，注释里也不写真名。
// 饭导：五常市华昌米业旗下品牌，给餐厅供应五常大米（fandao-brand Skill，2026-09-30 核实）；品牌名固定写「饭导五常大米」

export const INTRO = {
	author: '干饭CEO',
	authorTitle: '饭导五常大米品牌创始人',
	authorLine: '饭耳的作者，全平台可搜索',
	photoCredit: '摄影：大域老师',
	photoAlt: '干饭CEO 在稻田里',
	origin: {
		lead: '我有 ADHD，答应的事转头就忘。',
		body: '开会说好的事、答应朋友的事，过两天就想不起来。饭耳是我给自己做的。',
	},
	wish: '我希望饭耳能让我们每一个孤独的个体，都能感受到被人关心到骨子里的感受。',
	/** 四行：第一个逗号前那半句加粗（同 App） */
	points: [
		{ text: '手表戴着就在录，不用掏手机，也不用想着记。' },
		{ text: '你答应别人的、别人答应你的，它从对话里找出来，等你确认。' },
		{ text: '想找哪句话，搜人名、事情或「上周三」，直接跳到原话。' },
		{ text: '录音和文字存在你的手机上，转写和整理用你自己的账号，饭耳收不到。', note: '我没有服务器，你自己的数据丢了我真没办法了。' },
	],
	tagline: '首发就支持中文，我为中文自豪',
	/** 免费、小红书留言（放在下面 WHY.terms 的「免费」那条里） */
	about: '饭耳免费。我每天自己用，觉得值得加的功能，很快就加上。如果有想法，可以来小红书留言。',
	/** 最后两句，分两行 */
	close: ['同类 App 也都不错，不一定非得选我。', '饭耳没什么高深技术，AI 时代，我们都应该学会开发自己的 APP。'],
} as const;

/** 四行里加粗的那半句和剩下的 */
export function splitPoint(text: string): [string, string] {
	const cut = text.indexOf('，');
	return cut > 0 ? [text.slice(0, cut + 1), text.slice(cut + 1)] : [text, ''];
}

export interface Other {
	name: string;
	text: string;
}

export interface Term {
	title: string;
	text: string;
	/** 这一条下面放小店入口（电脑上二维码 + 链接，手机上只有链接） */
	shop?: boolean;
	/** 这一条下面放需求墙入口 */
	wish?: boolean;
}

export const WHY = {
	lead: '做饭耳之前，我用过、等过这几个：',
	others: [
		{ name: '某录音卡产品', text: '很好。可我不想再多带一个硬件，手上已经戴着 Apple Watch。' },
		{ name: '某录音APP', text: '也挺好，也用手表录。但开发太慢，我有 ADHD，受不了。' },
		{ name: '某概念产品', text: '我一直在等它上市，等不及了。' },
	] satisfies Other[],
	/** 四条规矩。「免费」那条就用介绍页的原话（INTRO.about），整节只说一次免费 */
	terms: [
		{ title: '免费', text: INTRO.about },
		{ title: '饭导五常大米', text: '做饭耳的我，平时在做饭导五常大米，给餐厅供米。', shop: true },
		{ title: '先照我的需要做', text: '功能按我自己每天要用的排。' },
		{ title: '你的需要也可以提', text: '需求墙上我都看；做不做、为什么，都会写出来。', wish: true },
	] satisfies Term[],
} as const;
