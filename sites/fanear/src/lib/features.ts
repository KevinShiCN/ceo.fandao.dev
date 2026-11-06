// 首页「手表上」「手机上」「你的数据」用的字。
// 官网只写一句话的功能（本人北京 11-06：「降低功能的描述」「我们减少在官网的描述」「不讲技术」）：
// 不列设置项、按钮和操作步骤，不写参数、服务商和模型名，不写还没上 App Store 的功能。细节留在 App 里。
import type { ShotId } from './shots';

export interface Group {
	id: string;
	title: string;
	/** 首页「手机上」那一节的大标题（不写就用 title） */
	headline?: string;
	/** 一句话 */
	lead: string;
}

/** 「你的数据」：一段话加几行要点，全文看隐私说明 */
export const DATA_LEAD = '录音和文字存在你的手表和手机上，录音默认还存一份到你自己的 iCloud。要转写、要整理时，手机直接发给你自己选的服务商。';

export const DATA_POINTS: readonly string[] = ['不经过开发者的服务器', '用你自己的账号', '录别人之前，先取得对方同意'];

/** 首页「手表上」：手表的三种样子 */
export const WATCH_SHOTS: readonly ShotId[] = ['watchRecording', 'watchInterrupted', 'watchStopped'];

export const GROUPS: readonly Group[] = [
	{ id: 'watch', title: '手表', lead: '打开手表上的饭耳就开始录，不用掏手机，也不用想着记。' },
	{ id: 'today', title: '今天', headline: '今天录了什么，一页看完', lead: '今天录下的对话，按「一段时间一张卡」列出来。' },
	{ id: 'todo', title: '待办', headline: '答应的事，一张一张滑', lead: '饭耳从对话里找出你答应别人的、别人答应你的，一次一张大卡给你滑。' },
	{ id: 'xiaoer', title: '小耳', headline: '小耳偶尔跟你说一句', lead: '饭耳在 App 里跟你说话时叫「小耳」，存着它跟你说的话和每天的总结。' },
];

export function group(id: string): Group {
	const found = GROUPS.find((g) => g.id === id);
	if (!found) throw new Error(`功能分组「${id}」不在 src/lib/features.ts 里`);
	return found;
}
