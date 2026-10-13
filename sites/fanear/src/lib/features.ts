// 功能清单：首页和「功能」页共用一份。
// 每句都要能在 fanear 仓库里找到依据（CHANGELOG.md、docs/specs/ 或 App 界面上的字），写的是 0.1.0（开发中）已经做进去的。
import type { ShotId } from './shots';

export interface Feature {
	/** 页面锚点 */
	id: string;
	title: string;
	/** 一句话 */
	lead: string;
	/** 展开的几条细节 */
	points: readonly string[];
	/** 配哪张截图 */
	shot?: ShotId;
}

export const FEATURES: readonly Feature[] = [
	{
		id: 'record',
		title: '手表全天录',
		lead: '打开手表上的饭耳就开始录，你不按停，它就一直录下去。',
		points: [
			'每 15 分钟一块传到手机。手机收到了，表上那一块才删。',
			'被来电、Siri、闹钟打断时，手表震一下、发一条通知，点一下接着录。',
			'电量低于 10% 时，先存好正在录的这一块再停。',
		],
		shot: 'watchRecording',
	},
	{
		id: 'transcribe',
		title: '转成文字，分清谁在说',
		lead: '手机收到录音，先把声音调响，再转成文字：谁说的、几点说的、什么语气。',
		points: [
			'转文字用火山引擎的录音文件识别，账号是你自己的。',
			'认不出名字的人，先叫「说话人 1」「说话人 2」。',
		],
		shot: 'conversation',
	},
	{
		id: 'organize',
		title: '整理对话，认出「我」',
		lead: '每段对话配一个标题、一句话要点，写清谁在说话。',
		points: [
			'整理用的是你自己填的大模型。',
			'离手表最近、声音最响的人多半是你：饭耳量每个人的音量，先认出「我」。',
			'认错了就点「这句是谁说的」改。你改过的一直算数，重新整理也不会改回去。',
		],
		shot: 'conversation',
	},
	{
		id: 'commitments',
		title: '答应的事，等你点一下',
		lead: '从对话里挑出「我答应别人的」「别人答应我的」，每件事你点一下就定。',
		points: [
			'三个键：不是、补充、进待办。',
			'点了「不是」，5 秒内能撤销。',
			'24 小时没回，自动进待办。',
		],
		shot: 'commitments',
	},
	{
		id: 'today',
		title: '今天一眼看完',
		lead: '今天录了多久、断了几次、几块没转成文字，最上面一句话说清。',
		points: [
			'时间条上，彩色是对话，黑块是没录到，斜纹是没转成文字。',
			'没转成文字的那几块，点「重试」再转一次。',
		],
		shot: 'today',
	},
	{
		id: 'health',
		title: '心率和对话对上',
		lead: '允许读健康数据以后，每段对话上面画着同一段时间你的心率。',
		points: [
			'整理对话时，同一段时间的健康数据一起交给大模型。',
			'手机锁着时读不到健康数据，这一段等你解锁再整理，不会少带心率。',
		],
		shot: 'conversation',
	},
	{
		id: 'own-account',
		title: '用你自己的账号',
		lead: '转文字和大模型都填你自己的账号，手机直接调用，不经过我们的服务器。',
		points: [
			'密钥存在手机的钥匙串里。',
			'原始录音默认留 7 天，转好的文字一直留在手机上；天数可以在设置里改。',
		],
	},
];
