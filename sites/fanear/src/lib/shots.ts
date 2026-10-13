// App 截图：iOS 27 / watchOS 27 模拟器 + 演示数据（人名、对话都是编的），取自 fanear 仓库
// 交付页/sim-shots-20261013-final/。设置页那张没放：演示数据里的大模型地址是开发者自己的，换成中性的演示值后再补。
import type { ImageMetadata } from 'astro';
import phoneCommitments from '../assets/shots/phone-commitments.png';
import phoneConversation from '../assets/shots/phone-conversation.png';
import phoneToday from '../assets/shots/phone-today.png';
import watchInterrupted from '../assets/shots/watch-interrupted.png';
import watchRecording from '../assets/shots/watch-recording.png';
import watchStopped from '../assets/shots/watch-userStopped.png';

export type Device = 'phone' | 'watch';

export interface Shot {
	src: ImageMetadata;
	device: Device;
	/** 截图下面的一行字 */
	caption: string;
	/** 读屏念的内容：写清屏幕上有什么 */
	alt: string;
}

export const SHOTS = {
	today: {
		src: phoneToday,
		device: 'phone',
		caption: '今天',
		alt: '手机上的「今天」：最上面写今天录了 9 小时 38 分，断了 2 次共 12 分钟，37 块转写完、2 块失败、1 块还在转；下面是一天的时间条、3 件事等你确认和今天的对话列表。',
	},
	conversation: {
		src: phoneConversation,
		device: 'phone',
		caption: '一段对话',
		alt: '一段对话「16:00 和刘总吃饭」：上面是这段时间的心率曲线和谁在说的色条，下面逐句写刘总和我说的原话，我那句已进待办。',
	},
	commitments: {
		src: phoneCommitments,
		device: 'phone',
		caption: '待你确认',
		alt: '「待你确认」：我答应别人的 2 件、别人答应我的 1 件，每件写着到期日和原话，下面三个键：不是、补充、进待办。',
	},
	watchRecording: {
		src: watchRecording,
		device: 'watch',
		caption: '正在录',
		alt: '手表正在录：今天已录 6 小时 12 分，电量 63%，待传 2 块，下面是「停止录音」按钮。',
	},
	watchInterrupted: {
		src: watchInterrupted,
		device: 'watch',
		caption: '被打断',
		alt: '手表被打断后整块屏变蓝：14:32 被打断，录音停了，点一下继续；已录的都存好了，待传 2 块。',
	},
	watchStopped: {
		src: watchStopped,
		device: 'watch',
		caption: '自己停的',
		alt: '自己停了录音的手表：没在录，14:32 你自己停的，下面是「开始录音」按钮。',
	},
} as const satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

/** 截图旁边要说一次的事实 */
export const SHOTS_NOTE = '截图来自模拟器，人名和对话都是编的演示数据。';
