// 首页「手机上」两张截图上的滑动动效（10-15 本人看定稿预览：待办「要增加左滑右滑的动效，代表简单的、快速管理」，
// 小耳「也要补充滑动的动效，滑动收起这一张卡片」）。画法见 components/ShotMotion.astro 和 styles/shot-motion.css。
// 动作照 App 真实做法（饭耳仓库）：
//   待办：Apps/iOS/Commitments/TodoDeckCard.swift 的 TodoSwipeTint（染色）、TodoDeck.swift（倾斜）、
//         TodoDeckPage.swift（后面那张跟着拖动长回原尺寸）、TodoGuideScenes.swift 的 TodoGuideSwipeScene（节奏）
//   小耳：Apps/iOS/Care/SlideToConfirm.swift（滑条）、CareNotebookView.swift（收下后这张离开、下面的顶上来）
//
// 下面的坐标都是截图上的点：截图 1320×2868 像素 = 440×956 点 @3x，页面上跟着手机宽度等比缩放（容器单位）。
// 0.2.0 合完重拍截图后要重量：卡片、滑条、页签栏的位置，和小耳下面「以前的」几张的字、行。
import type { ImageMetadata } from 'astro';
import todoNextCard from '../assets/shots/phone-todo-deck-next.png';
import type { ShotId } from './shots';

/** 截图上的一块：x、y 是左上角，单位都是点 */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** 「以前的」瀑布流里一张小卡（CareFeed.swift 的 CareFeedTile） */
export interface CareTile {
	x: number;
	/** 卡的上沿 */
	top: number;
	/** 卡的下沿 */
	bottom: number;
	/** 顶上一行：时间，或「哪天的总结」 */
	meta: string;
	/** 那句话，按 App 里的折行一行一项 */
	lines: readonly string[];
	/** 「你回：……」后面那句 */
	reply: string;
}

// 0.2.0 待合：L4（滑卡「做完了 / 不用做」「要做」和整张染色只在 todo-polish-020 分支上）
export const TODO_MOTION = {
	/** 最上面那张卡，连 1.5 点深墨边；圆角 22（TodoDeckCard） */
	card: { x: 16, y: 122, w: 408, h: 717 },
	/** 拖着走的那块比卡四边各多裁一点，边框外沿的半透明像素不被剪掉（不然静止时边会细一像素） */
	drag: { x: 15, y: 121, w: 410, h: 719 },
	radius: 22,
	/** 飞走以后顶上来的那张：App 演示数据里真正的下一张「小陈说周五前把对账单发来」。
	 *  像素裁自同一台模拟器、同一份演示数据拍的「滑走一张以后」那屏，只裁边框以内（边框由样式画：在后面时浅灰、顶上来变深墨） */
	next: todoNextCard as ImageMetadata,
	nextFrom: 'fanear/本地资料/accept-020-20261015/todo-polish-020/after/phone-todo-swipe-out.png，裁 (53,371)-(1267,2512) 像素',
	/** 裁图在卡里往里缩多少点（5 像素 = 1.67 点） */
	nextInset: 5 / 3,
	/** 手指按在卡上哪儿（相对卡左上角） */
	touch: { x: 204, y: 590 },
	/** 染色那块：图标、大字、小字的中心高度（相对卡顶，量自 App 拖到一半的截图） */
	label: { icon: 337, title: 401, detail: 441 },
} as const;

/** 拖多远算过线、手指拖到哪、飞到哪（点）：TodoBoard.swift horizontalCommit = 96，引导动画拖 105、飞 620 */
export const TODO_COMMIT = 96;

export const CARE_MOTION = {
	/** 第一张（「好，明天中午出去走走」那张），连周围一点白边 */
	card: { x: 0, y: 312, w: 440, h: 200 },
	/** 第二张的上沿减第一张的上沿：收下以后下面整体往上挪这么多 */
	shift: 200,
	/** 下面那一截（第二张、「以前的」）从这里开始；到 seam 为止用截图像素 */
	below: 512,
	/** 截图像素用到这一行为止：两列字都在行间空白里，再往下有页签栏挡着，接 App 演示数据画的「以前的」 */
	seam: 858,
	/** 滑条（SlideToConfirm：高 56、滑块 48、内边 4、圆角 14/12） */
	track: { x: 40.33, y: 438.67, w: 359.33, h: 56 },
	knob: { x: 44.33, y: 442.67, w: 48, h: 48 },
	/** 滑块能走多远 = 滑轨宽 − 滑块 − 内边×2 */
	travel: 303.33,
	/** 滑条上的字：饭耳替你想的回话（CareDemoData.note 的 reply） */
	reply: '好，明天中午出去走走',
	/** 底部页签栏（玻璃胶囊），一直盖在最上面 */
	tabBar: { x: 20, y: 872, w: 400, h: 64 },
} as const;

// 「以前的」瀑布流，从截图量的位置往下接着排（CareFeed.swift：两列，每列宽 193，列间 10，卡内边 12，圆角 14；
// 字：顶上一行 13 点半粗、那句话 15 点行距 21、「你回」13 点半粗）。
// 字取自 App 演示数据 Apps/iOS/Care/CareDemoData.swift 的 older()；分到哪列照 CareMasonry.split，和截图上露出的一致。
// 截图里看得到的几行（seam 以上）照截图的折行；看不到的折行是按卡宽估的。
export const CARE_TILES: readonly CareTile[] = [
	{
		x: 22,
		top: 762,
		bottom: 935,
		meta: '昨天 18:20',
		lines: ['上午你说「腰又有点酸」，', '这 3 天你每天只走了', '3000 多步，平时一天有', '8000 步。晚上出去走', '一圈？'],
		reply: '好，吃完饭就去',
	},
	{
		x: 22,
		top: 945,
		bottom: 1076,
		meta: '10月11日的总结',
		lines: ['今天你一共录了 11 小', '时，说话最多的是上午那', '场例会，48 分钟。'],
		// 这份总结没写回话，滑过的就是兜底的「晚安」（FanEarCore Care.swift DailyLetter.defaultReply）
		reply: '晚安',
	},
	{
		x: 225,
		top: 762,
		bottom: 893.33,
		meta: '10月13日的总结',
		lines: ['中午你出去走了 25 分钟，', '晒到了这周最多的一次', '太阳。'],
		reply: '晚安小耳',
	},
	{
		x: 225,
		top: 903.33,
		bottom: 1055,
		meta: '10月12日 9:30',
		lines: ['这周你的静息心率平均', '58，上周是 62。睡得多', '了半小时，身体看得出', '来。'],
		reply: '好，继续保持',
	},
	{
		x: 225,
		top: 1065,
		bottom: 1196,
		meta: '10月10日 9:05',
		lines: ['你今年走了 132 万步，', '差不多从广州走到北京。', '以后我常在。'],
		// 见面那句没写回话，兜底「知道了」（CareNote.defaultReply）
		reply: '知道了',
	},
];

/** 哪几张截图有动效 */
export const MOTION_SHOTS: readonly ShotId[] = ['todoDeck', 'care'];
