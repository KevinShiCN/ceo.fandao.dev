// 首页「为什么做」：10-13 本人定的宣传重点——别家都不错，但现在人人都能给自己做 App；饭耳免费，先照我的需要做。
// 规矩：只讲我自己的需要和选择，不评价别人的产品，不写「不支持」「开发太慢」这类说别人的话
// （《广告法》第十三条不得贬低他人商品；《反不正当竞争法》第十二条不得传播误导性信息）。
// 提到别家的事实和出处（2026-10-13 查）：
//   Plaud：要单独带的录音硬件（plaud.ai）；本人在用
//   Auday：也是 Apple Watch 全天录音的 App（auday.ai、App Store 页）；本人买过、录屏拆过（饭耳仓库本地资料 lane-I）
//   云玦：公开报道到 2026-08 仍说硬件没正式发布（woshipm.com/ai/6444287.html），10-13 没查到发售消息
export interface Other {
	name: string;
	text: string;
}

export interface Term {
	title: string;
	text: string;
}

export const WHY = {
	lead: '做饭耳之前，我用过、等过这几个：',
	others: [
		{ name: 'Plaud', text: '很好。可我不想再多带一个硬件，手上已经戴着 Apple Watch。' },
		{ name: 'Auday', text: '也很好，也用手表录。可我有 ADHD，想要的功能等不了别人排期。' },
		{ name: '云玦', text: '我一直在等它上市，等不及了。' },
	] satisfies Other[],
	turn: '大家都不错。只是现在人人都能给自己做 App 了，我就给自己做了一个。',
	terms: [
		{ title: '免费', text: '饭耳不收钱。转文字和整理对话用你自己的账号，费用由那家服务商收。' },
		{ title: '先照我的需要做', text: '功能按我自己每天要用的排。' },
		{ title: '你的需要也可以提', text: '我都看；做不做、为什么，都会写出来。' },
	] satisfies Term[],
} as const;
