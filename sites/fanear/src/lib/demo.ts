// 演示用的一天：跟 App 演示数据（fanear 仓库 Apps/iOS/App/DemoData.swift）和截图里的那一天一致，
// 人名和对话都是编的。页面上画时间条、引原话时只从这里取，数字彼此对得上：
//   三段录音 8:00–14:32（来电打断）、14:38–16:20（手表在充电）、16:26–17:50，共 9 小时 38 分，断 2 次共 12 分钟；
//   15 分钟一块共 40 块：37 块转写完，11:45 和 15:38 两块没转成文字，17:41 那块还在转。

/** 颜色：「我」是蓝；别人按当天出现的先后橙、绿、莓紫；gap 没录到；fail 没转成文字 */
export type Fill = 'me' | 'p1' | 'p2' | 'p3' | 'gap' | 'fail';

export interface Span {
	/** 'HH:MM' */
	from: string;
	to: string;
	fill: Fill;
}

export const DAY = {
	date: '10月13日 周二',
	axis: { from: '08:00', to: '18:00' },
	ticks: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
	summary: '今天录了 9 小时 38 分，断了 2 次共 12 分钟；37 块转写完，2 块失败，1 块还在转。',
	/** 时间条：有对话的块按说得最多那个人的颜色（跟 App 的 DayRibbon 同一个画法） */
	ribbon: [
		{ from: '09:30', to: '09:45', fill: 'me' },
		{ from: '11:45', to: '12:00', fill: 'fail' },
		{ from: '14:00', to: '14:15', fill: 'p2' },
		{ from: '14:32', to: '14:38', fill: 'gap' },
		{ from: '15:38', to: '15:53', fill: 'fail' },
		{ from: '16:20', to: '16:26', fill: 'gap' },
		{ from: '16:41', to: '16:56', fill: 'p1' },
		{ from: '17:11', to: '17:26', fill: 'p1' },
		{ from: '17:26', to: '17:41', fill: 'p1' },
	] satisfies Span[],
	/** 时间条上要标出来的几件事 */
	events: [
		{ at: '09:30', fill: 'me', title: '和老周看样品', note: '老周说周五前把样品寄到' },
		{ at: '11:45', fill: 'fail', title: '没转成文字', note: '转文字 15 分钟还没出结果，点重试' },
		{ at: '14:00', fill: 'p2', title: '和王经理通电话', note: '我答应周三前发新报价' },
		{ at: '14:32', fill: 'gap', title: '没录到 6 分钟', note: '来电打断，手表震了一下' },
		{ at: '16:20', fill: 'gap', title: '没录到 6 分钟', note: '手表在充电' },
		{ at: '16:41', fill: 'p1', title: '和老周对下批数量', note: '我答应周五前给准数' },
	] satisfies { at: string; fill: Fill; title: string; note: string }[],
} as const;

/** 14:00 和王经理通电话：逐句（秒数从这块录音开头算），说话人 3 还没认出是谁 */
export const CALL = {
	title: '14:00 和王经理通电话',
	gist: '周三前要新报价，十斤装也要一份',
	/** 跟 App 一段对话页的副标题一样：这块录音多长、几个人说话 */
	subtitle: '15 分钟，3 个人说话',
	people: [
		{ name: '我', fill: 'me' },
		{ name: '王经理', fill: 'p2' },
		{ name: '说话人 3', fill: 'p3' },
	] satisfies { name: string; fill: Fill }[],
	lines: [
		{ from: 20, to: 40, who: 0, time: '14:00', text: '喂，王经理，你说。' },
		{ from: 45, to: 160, who: 1, time: '14:00', text: '上回那批五常米，后厨说口感挺好，就是价钱还得再谈谈。' },
		{ from: 170, to: 260, who: 0, time: '14:02', text: '行，新米下来了，我周三前把新报价发你。', card: true },
		{ from: 270, to: 380, who: 1, time: '14:04', text: '周三一定要到啊，周四我们就报预算了。', emotion: '生气' },
		{ from: 390, to: 420, who: 2, time: '14:06', text: '十斤装的也要一份报价。' },
		{ from: 430, to: 540, who: 0, time: '14:07', text: '好，十斤装和二十五斤装我都报。' },
		{ from: 550, to: 700, who: 1, time: '14:09', text: '还有上次那几袋压坏了，你们配送得注意。', emotion: '生气' },
		{ from: 710, to: 830, who: 0, time: '14:11', text: '这个我跟库房说，下次加一层纸箱。' },
	] satisfies {
		from: number;
		to: number;
		who: number;
		time: string;
		text: string;
		card?: boolean;
		emotion?: string;
	}[],
	/** 从这段里抓出来、等你确认的那件事 */
	card: {
		kind: '我答应别人的',
		to: '王经理',
		summary: '周三前把五常大米新报价发给王经理',
		due: '周三',
		quote: '行，新米下来了，我周三前把新报价发你。',
	},
} as const;

/** 'HH:MM' 换成从零点起的分钟数 */
export function minutes(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return h * 60 + m;
}

/** 在时间轴上的位置（0~100，百分比） */
export function percentOf(hhmm: string, axis: { from: string; to: string } = DAY.axis): number {
	const start = minutes(axis.from);
	return ((minutes(hhmm) - start) / (minutes(axis.to) - start)) * 100;
}
