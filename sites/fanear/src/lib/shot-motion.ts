// 首页「手机上」两张截图上的滑动动效（10-15 本人看定稿预览：待办「要增加左滑右滑的动效，代表简单的、快速管理」，
// 小耳「也要补充滑动的动效，滑动收起这一张卡片」）。画法见 components/ShotMotion.astro 和 styles/shot-motion.css。
// 动作照 App 真实做法（饭耳仓库）：
//   待办：Apps/iOS/Commitments/TodoDeckCard.swift 的 TodoSwipeTint（染色）、TodoDeck.swift（倾斜）、
//         TodoDeckPage.swift（后面那张跟着拖动长回原尺寸）、TodoGuideScenes.swift 的 TodoGuideSwipeScene（节奏）
//   小耳：Apps/iOS/Care/SlideToConfirm.swift（滑条）、CareNotebookView.swift（收下后这张离开、下面的顶上来）
//
// 下面的坐标都是截图上的点：截图 1320×2868 像素 = 440×956 点 @3x，页面上跟着手机宽度等比缩放（容器单位）。
// 待办量自饭耳 main 8a16607 重拍的截图（10-16）；小耳量自 0.3.0（饭耳 2d3b6514）重拍的截图（10-17），见 lib/shots.ts。
// 以后换截图要重量：卡片、滑条、页签栏的位置，待办的下一张要重裁，小耳下面补画的那一截（第二张的下半截、「以前的」）要照新图重排。
// 小耳下面那一截可以对着同一次拍的 care-notebook-past（滚到「以前的」那屏）量：两屏「先按你们的来」那行差 633.33 点（每次拍滚到的位置不一样，要重量）。
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

export const TODO_MOTION = {
	/** 最上面那张卡，连 1.5 点深墨边；圆角 22（TodoDeckCard） */
	card: { x: 16, y: 122, w: 408, h: 717 },
	/** 拖着走的那块比卡四边各多裁一点，边框外沿的半透明像素不被剪掉（不然静止时边会细一像素） */
	drag: { x: 15, y: 121, w: 410, h: 719 },
	radius: 22,
	/** 飞走以后顶上来的那张：App 演示数据里真正的下一张「小陈说周五前把对账单发来」，只裁边框以内（边框由样式画，
	 *  main 上后面的卡也是 1.5 点深墨边）。像素取自同一次重拍的「右滑走一张以后」那屏（nextFrom），
	 *  那屏顶上有一条「做完了 / 不用做，不再提醒 · 还剩 2 张 · 撤销」提示条盖住了卡顶 60 点：
	 *  这一截（卡顶到「小陈答应的」那行上半）取自 10-15 todo-polish-020 拍的同一张卡（同一版排法，提示条以下两张逐像素一样），
	 *  只把到期徽标从「明天」换成重拍那天该显示的「今天到期」（10-16 周五 4 点拍，演示数据到期「周五 12 点」，
	 *  TodoDayText.badge 当天到期写「今天到期」、浅黄底）：这枚徽标是用 Noto Sans CJK 粗体画上去的，不是截图像素 */
	next: todoNextCard as ImageMetadata,
	nextFrom: 'fanear/本地资料/website-020-20261015/shots-020-1015-1614/phone-todo-swipe-done.png 裁 (53,371)-(1267,2512) 像素；卡顶 (48,366)-(1272,558) 取自 fanear/本地资料/accept-020-20261015/todo-polish-020/after/phone-todo-swipe-out.png',
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
	/** 第一张（「好，明天中午出去走走」那张，卡 326.33–513.67），连周围一点白边 */
	card: { x: 0, y: 310, w: 440, h: 204 },
	/** 第二张的上沿减第一张的上沿：收下以后下面整体往上挪这么多 */
	shift: 201.33,
	/** 下面那一截（第二张、「以前的」）从这里开始；到 seam 为止用截图像素 */
	below: 514,
	/** 截图像素用到这一行为止：第二张「明天别忘了：给张姐回电话」那行下面的空白（864.67–872.33），再往下有页签栏挡着，
	 *  接着画第二张的下半截和「以前的」 */
	seam: 868,
	/** 滑条（SlideToConfirm：高 56、滑块 48、内边 4、圆角 14/12） */
	track: { x: 40, y: 439.67, w: 360, h: 56 },
	knob: { x: 44, y: 443.67, w: 48, h: 48 },
	/** 滑块能走多远 = 滑轨宽 − 滑块 − 内边×2 */
	travel: 304,
	/** 滑条上的字：小耳替你想的回话（CareDemoData.note 的 reply） */
	reply: '好，明天中午出去走走',
	/** 底部页签栏（玻璃胶囊），一直盖在最上面 */
	tabBar: { x: 20, y: 872, w: 400, h: 64 },
} as const;

// 第二张（昨天的总结，整封写在卡上，CareFeed.CareWaitingCard + CareCards.CareLetterText）：0.3.0 卡上不再单写一行「佳文：」，
// 整封往上收了 28.33 点，截图上露到「明天别忘了：给张姐回电话」那行（849.67–863.67，已在截图像素里，不用再画），
// 下半截在页签栏底下：滑条、卡底。滑条和卡底跟第一张一模一样，直接借第一张那一截像素（从滑轨上沿上 2 点到卡底）挪下来，
// 只把滑条上的字换成这一封的回话。位置都量自同一次拍的 care-notebook-past（换算到这一屏 +633.33）：
// 滑轨上沿 880.33、卡底 954.67、「以前的」、两张小卡约 1002–1175；后两样在页面上实测比 App 高 1–1.7 点，按实测各往下挪了一点。
export const CARE_LETTER_TAIL = {
	/** 卡身左右两道竖边：截图上「明天别忘了」那行下面 865–872 这一截只有白底和两道边，竖着拉长接到借来的滑条上 */
	band: { from: 865, h: 7, to: 866 },
	/** 「明天别忘了：给张姐回电话」0.3.0 截图上已经露出来了（基线约 862），这里不再补画，字留空 */
	todo: { x: 40, baseline: 862, text: '' },
	/** 借第一张的：从 y 437.67 起、到卡底 514，挪到 878.33（滑轨上沿 880.33 上 2 点） */
	borrow: { from: 437.67, to: 878.33, h: 76.33 },
	reply: '好的，我下次一定早睡',
	/** 「以前的」：13 点半粗；基线按页面上实测对齐 App（care-notebook-past 换算后字底 985.33） */
	pastLabel: { x: 22, baseline: 985.9 },
} as const;

// 「以前的」瀑布流（CareFeed.swift：两列，每列宽 193，列间 10，卡内边 12，圆角 14；
// 字：顶上一行 13 点半粗、那句话 15 点行距 21、「你回」13 点半粗；总结写全部几段，最多 5 行，放不下末尾「…」）。
// 字取自 App 演示数据 Apps/iOS/Care/CareDemoData.swift 的 older()；分到哪列照 CareMasonry.split 算：
// 截图拍于 10 月 17 日（北京时间），按 older() 的 days 偏移：左列 昨天 18:20、10月13日的总结，右列 10月15日的总结、10月14日 9:30、10月12日 9:05
// （同一次拍的 care-notebook-past 里看得到）。挪上来以后屏幕上只露得到两列的第一张，所以只画这两张；字和折行照 care-notebook-past 抄。
export const CARE_TILES: readonly CareTile[] = [
	{
		x: 22,
		top: 1003,
		bottom: 1176,
		meta: '昨天 18:20',
		lines: ['上午你说「腰又有点酸」，', '这 3 天你每天只走了', '3000 多步，平时一天有', '8000 步。晚上出去走', '一圈？'],
		reply: '好，吃完饭就去',
	},
	{
		x: 225,
		top: 1003,
		bottom: 1176,
		meta: '10月15日的总结',
		lines: ['中午你出去走了 25 分钟，', '晒到了这周最多的一次', '太阳。', '晚上你说「今天效率挺', '高」，6 场对话里有 4 场…'],
		reply: '晚安小耳',
	},
];

/** 哪几张截图有动效 */
export const MOTION_SHOTS: readonly ShotId[] = ['todoDeck', 'care'];
