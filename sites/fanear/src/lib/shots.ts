// App 截图：iOS 27 / watchOS 27 模拟器 + App 自带的演示数据（人名、对话都是编的）。
// 官网只放首页那几张（本人北京 11-06：「降低功能的描述」「不讲技术」）；读屏文字只说这是哪一屏，不逐字描述屏幕内容。
import type { ImageMetadata } from 'astro';
import phoneCare from '../assets/shots/phone-care.png';
import phoneToday from '../assets/shots/phone-today.png';
import phoneTodoDeck from '../assets/shots/phone-todo-deck.png';
import watchInterrupted from '../assets/shots/watch-interrupted.png';
import watchRecording from '../assets/shots/watch-recording.png';
import watchStopped from '../assets/shots/watch-stopped.png';

export type Device = 'phone' | 'watch';

export interface Shot {
	src: ImageMetadata;
	device: Device;
	/** 截图下面的一行字：App 里这一屏叫什么 */
	caption: string;
	/** 读屏念的内容 */
	alt: string;
}

export const SHOTS = {
	today: {
		src: phoneToday,
		device: 'phone',
		caption: '今天',
		alt: '手机上的「今天」页（演示数据）',
	},
	todoDeck: {
		src: phoneTodoDeck,
		device: 'phone',
		caption: '待办',
		alt: '「待办」里的一张大卡（演示数据）',
	},
	care: {
		src: phoneCare,
		device: 'phone',
		caption: '小耳说过的话',
		alt: '「小耳说过的话」页（演示数据）',
	},
	watchRecording: {
		src: watchRecording,
		device: 'watch',
		caption: '正在录',
		alt: '手表正在录音',
	},
	watchInterrupted: {
		src: watchInterrupted,
		device: 'watch',
		caption: '被打断',
		alt: '手表录音被打断',
	},
	watchStopped: {
		src: watchStopped,
		device: 'watch',
		caption: '自己停的',
		alt: '手表停了录音',
	},
} as const satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

/** 截图旁边要说一次的事实 */
export const SHOTS_NOTE = '截图来自模拟器，人名和对话都是 App 自带的演示数据。';
