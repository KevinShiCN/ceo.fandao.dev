// 首页「这一天」：照 App 今天页的时间条画一天，用 App 自带的演示数据（饭耳仓库 Apps/iOS/App/DemoData.swift 的
// fill()、todayTalks()、cards()，Apps/iOS/Care/CareDemoData.swift）。人名、对话都是编的。
// 画法和图例原字照 Apps/iOS/Today/DaySummaryCard.swift（DayRibbonView、RibbonKey）、DayRibbon.swift：
//   底色是线色；对话按说得最多那人的颜色；没录到深墨实块；没转成文字斜纹；按计划不录纸白空格加细框；删掉的浅灰细斜纹；
//   刻度总长超过 6 小时每 2 小时一个，写「8点」这样。
// 演示数据里每块对话是谁说得最多没有直接写，这里的颜色按「我」蓝、当天第 1、2、3 个出现的人橙、绿、莓紫配，只为看得出是几个人。

export type Fill = 'me' | 'p1' | 'p2' | 'p3' | 'gap' | 'fail' | 'planned' | 'deleted';

export interface Segment {
	/** 开始、结束，「9:30」这样的钟点 */
	from: string;
	to: string;
	fill: Fill;
}

/** 时间条从几点画到几点 */
export const AXIS = { from: 8, to: 18 } as const;

/** 今天录到的：8:00–12:00、13:00–14:32（来电打断）、14:38–16:20（手表在充电）、16:26–17:50；12:00–13:00 按计划不录 */
export const SEGMENTS: readonly Segment[] = [
	{ from: '9:30', to: '9:45', fill: 'p1' }, // 和老周看样品
	{ from: '10:30', to: '11:00', fill: 'p2' }, // 和小陈开周会
	{ from: '11:45', to: '12:00', fill: 'fail' }, // 火山 15 分钟还没出结果
	{ from: '12:00', to: '13:00', fill: 'planned' },
	{ from: '14:00', to: '14:15', fill: 'me' }, // 和王经理通电话
	{ from: '14:32', to: '14:38', fill: 'gap' }, // 来电打断
	{ from: '15:38', to: '15:53', fill: 'fail' }, // 送火山失败：网络连不上
	{ from: '16:20', to: '16:26', fill: 'gap' }, // 手表在充电
	{ from: '16:41', to: '16:56', fill: 'p1' }, // 和老周对下批数量
	{ from: '17:11', to: '17:26', fill: 'p2' }, // 让小陈对仓库的账
	{ from: '17:26', to: '17:41', fill: 'p3' }, // 问张姐明天的米几点到
	{ from: '17:41', to: '17:50', fill: 'deleted' }, // 你删掉了这一段
];

/** 图例：原字照 RibbonKey */
export const LEGEND: readonly { fill: Fill | 'talk'; label: string }[] = [
	{ fill: 'talk', label: '对话' },
	{ fill: 'gap', label: '没录到' },
	{ fill: 'fail', label: '没转成文字' },
	{ fill: 'planned', label: '按计划不录' },
	{ fill: 'deleted', label: '删掉了' },
];

export interface Moment {
	at: string;
	/** 这一刻是什么 */
	kind: string;
	/** 原话或界面上写的字 */
	quote?: string;
	/** 后来怎样了 */
	then: string;
}

export const MOMENTS: readonly Moment[] = [
	// 0.2.0 待合：L10（饭耳说话时叫「小耳」）
	{
		at: '9:10',
		kind: '小耳说了一句',
		quote: '这周你只在太阳底下待了 40 分钟，上个月一天就有 35 分钟。明天中午出去走走？',
		then: '滑条上替你写好了回话：「好，明天中午出去走走」。',
	},
	{
		at: '9:30',
		kind: '和老周看样品',
		quote: '一样，样品我周五前给你寄到店里。',
		then: '找出一条别人答应你的：老周说周五前把样品寄到。',
	},
	{
		at: '12:00',
		kind: '按计划不录',
		then: '「录音时间」里这 1 小时涂成不录，手表待命，到点接着记。',
	},
	{
		at: '14:00',
		kind: '和王经理通电话',
		quote: '行，新米下来了，我周三前把新报价发你。',
		then: '找出一条你答应的：周三前把五常大米新报价发给王经理。',
	},
	{
		at: '14:32',
		kind: '来电打断',
		then: '打电话这 6 分钟没录。电话挂了自己接着录；没接上会提醒你。',
	},
	{
		at: '15:38',
		kind: '没转成文字',
		then: '网络连不上，这一块没送出去。点「全部重试」再转一次。',
	},
];

/** 「9:30」→ 在时间条上的位置（0–1） */
export function position(clock: string): number {
	const [h, m] = clock.split(':').map(Number);
	const at = h + m / 60;
	if (!(at >= AXIS.from && at <= AXIS.to)) throw new Error(`「${clock}」不在时间条 ${AXIS.from}–${AXIS.to} 点里`);
	return (at - AXIS.from) / (AXIS.to - AXIS.from);
}

/** 刻度：8点、10点……18点 */
export const TICKS = Array.from({ length: (AXIS.to - AXIS.from) / 2 + 1 }, (_, i) => AXIS.from + i * 2);
