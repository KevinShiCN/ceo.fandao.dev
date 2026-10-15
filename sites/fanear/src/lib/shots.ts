// App 截图：iOS 27 / watchOS 27 模拟器 + App 自带的演示数据（人名、对话都是编的）。
// 这一版是 10-14、10-15 各条车道验收时截的现成图，先拿来做 0.2.0 改版的预览（10-15 会话 0a106ede 定）。
// 0.2.0 合进 main 以后，用饭耳仓库 scripts/mac/sim-shots.sh --store 按对外版重拍，逐张换掉：
//   from   这张图是从哪拷来的（饭耳仓库 fanear/ 或开发机 ops-evidence/ 下的路径）
//   redo   会被 0.2.0 哪几条改到、所以必须重拍；空数组 = 0.2.0 不改这一屏，但照样跟着重拍一遍
// 所有带底部页签的手机截图，页签现在写的是「今天 - 饭耳 - 待办 - 设置」，0.2.0（L10）改成「今天 - 待办 - 小耳 - 设置」，都要重拍。
// 不收露出开发者自己配置的图（比如设置首页、大模型页写着开发者在用的模型名），也不收只有内测版才有的按钮（「现在找一句」「现在写总结」）。
import type { ImageMetadata } from 'astro';
import phoneAsr from '../assets/shots/phone-asr.png';
import phoneCare from '../assets/shots/phone-care.png';
import phoneChecklist from '../assets/shots/phone-checklist.png';
import phoneConsent from '../assets/shots/phone-consent.jpg';
import phoneConversation from '../assets/shots/phone-conversation.png';
import phoneIntro from '../assets/shots/phone-intro.jpg';
import phoneSearch from '../assets/shots/phone-search.png';
import phoneSetup from '../assets/shots/phone-setup.png';
import phoneShare from '../assets/shots/phone-share.png';
import phoneToday from '../assets/shots/phone-today.png';
import phoneTodoDeck from '../assets/shots/phone-todo-deck.png';
import phoneTodoList from '../assets/shots/phone-todo-list.png';
import phoneVoices from '../assets/shots/phone-voices.png';
import phoneWatchInstall from '../assets/shots/phone-watch-install.jpg';
import watchInterrupted from '../assets/shots/watch-interrupted.png';
import watchRecording from '../assets/shots/watch-recording.png';
import watchStopped from '../assets/shots/watch-stopped.png';

export type Device = 'phone' | 'watch';

export interface Shot {
	src: ImageMetadata;
	device: Device;
	/** 截图下面的一行字：App 里这一屏叫什么 */
	caption: string;
	/** 读屏念的内容：写清屏幕上有什么 */
	alt: string;
	/** 来源路径（重拍时对照） */
	from: string;
	/** 会被 0.2.0 哪几条改到 */
	redo: readonly string[];
}

export const SHOTS = {
	today: {
		src: phoneToday,
		device: 'phone',
		caption: '今天',
		alt: '手机上的「今天」：最上面一条「让饭耳更好用，已设好 4/7」；右上角绿点「录音正常」；深色横幅「4 张新抓的等你确认」和「去确认」按钮；下面是搜索框、饭耳 9:10 说的一句话「这周你只在太阳底下待了 40 分钟……明天中午出去走走？」，再往下是今天的时间条和「2 块没转成文字、1 块整理失败」旁边的「全部重试」。',
		from: 'fanear/本地资料/first-run-shots-20261015/phone-today.png',
		redo: ['L10 页签和「饭耳」说的话改叫小耳', 'L5 开始录音的反馈'],
	},
	todoDeck: {
		src: phoneTodoDeck,
		device: 'phone',
		caption: '待办',
		alt: '「待办」里的一张大卡：红标「过期 1 天」，「答应刘总」「把报价单发给刘总」，下面是昨天 16:04 和刘总吃饭时前后几句原话，「我：今天晚上我把报价单发你。」这句标黄；卡底是「补充」「做成图」。',
		from: 'fanear/本地资料/accept-020-20261015/todo-polish-020/before/phone-commitments.png',
		redo: ['L4 滑卡的字和第一次进待办的介绍', 'SB2「谁答应的」', 'L10 页签'],
	},
	todoList: {
		src: phoneTodoList,
		device: 'phone',
		caption: '清单',
		alt: '待办里的「清单」：上面分「我要做的 2」「等别人的 1」；「已过期」一件「把报价单发给刘总」，「没说日子」一件「下周带新米样品去刘总店里」，下次明早 8:30 提醒；最下面「已结束 2 张」可以展开。',
		from: 'ops-evidence/fanear-0132-feedback-20261015/shots-todo/phone-todo-list.png',
		redo: ['L4', 'L10 页签'],
	},
	care: {
		src: phoneCare,
		device: 'phone',
		caption: '饭耳说过的话',
		alt: '「饭耳说过的话」页：顶上一行「饭耳有 3 个小问题想问你」；今天上午 9:10 说了一句「这周你只在太阳底下待了 40 分钟，上个月一天就有 35 分钟。明天中午出去走走？」，下面的滑条写着「好，明天中午出去走走」；再下面是昨天 22:35 的总结和滑条「好的，我下次一定早睡」。',
		from: 'ops-evidence/fanear-0132-feedback-20261015/shots-todo/phone-care-notebook.png',
		redo: ['L10 页签和页标题改叫小耳', 'L9 每天的总结卡', 'L6 出错不写原因码'],
	},
	conversation: {
		src: phoneConversation,
		device: 'phone',
		caption: '一段对话',
		alt: '一段对话「10:30 和小陈开周会」：30 分钟、3 个人说话；「播放这一场」按钮；「说话人」里「我」有「听」「跳到」「不是我」，小陈和「声音 5」有「听」「跳到」「标记」，声音 5 旁边挂「可能是小林」；下面是这段时间的心率曲线，最高 90。',
		from: 'ops-evidence/fanear-0132-feedback-20261015/shots-voice/phone-conversation-multi.png',
		redo: ['L3 说话人', 'L8 点了听', 'L10 页签'],
	},
	voices: {
		src: phoneVoices,
		device: 'phone',
		caption: '认出的声音',
		alt: '设置里的「声音」：已识别 6 个；「我」累计 24 分钟、2 天；「老周 · 2 个声音」下面分第 1 个声音、第 2 个声音；还有小陈、王经理、刘总、张姐，各写累计说了多久、出现几天、第一次和最近一次。',
		from: 'ops-evidence/fanear-0132-feedback-20261015/shots-voice/phone-settings-voices.png',
		redo: ['L1 设置页分块', 'L3', 'L10 页签'],
	},
	search: {
		src: phoneSearch,
		device: 'phone',
		caption: '搜索',
		alt: '「搜索记录」搜「价格谈不拢」：上面一个「问饭耳」按钮；「2 段对话，3 句原话，其中 3 句意思相近」；14:00 和王经理通电话里，王经理那句「上回那批五常米，后厨说口感挺好，就是价钱还得再谈谈」标「意思相近」。',
		from: 'fanear/本地资料/tf-feedback-20261014/shots-SEM-ui/phone-search-meaning.png',
		redo: ['L10 页签（这张还是 10-14 的三个页签「今天 - 待确认 - 设置」）', '「问饭耳」可能随 L10 改名'],
	},
	asr: {
		src: phoneAsr,
		device: 'phone',
		caption: '转文字',
		alt: '设置里的「转文字」：火山引擎（收费、效果最佳，0.8 元/小时）正在用；腾讯云已配好，按钮「设为正在用」；苹果自带转写（不联网，免费、效果一般）；SenseVoice（下载到手机，不联网，免费、效果一般，约 163MB）。每家写着实测「每 100 个字约几个和火山转的不一样」。',
		from: 'fanear/本地资料/asr-apple-ui-20261015/phone-lasr-engines.png',
		redo: ['L1 设置页分块', 'L10 页签'],
	},
	share: {
		src: phoneShare,
		device: 'phone',
		caption: '分享这一场',
		alt: '「分享这一场」：预览是一张粉色的图，标题「新品包装定稿会」、一条说话人色条和几条要点；下面选版式（声纹条、杂志、极简）、比例（3:4、9:16、1:1）、配色；「隐去别人的名字」「带时间」都开着；底部「存到相册」「分享」。',
		from: 'fanear/交付页/fanear-share-cards-impl-20261015-shots/phone-share-panel-T6+粉1+3:4.png',
		redo: [],
	},
	intro: {
		src: phoneIntro,
		device: 'phone',
		caption: '第一次打开',
		alt: '第一次打开的介绍页：上面是干饭CEO 在稻田里的照片，左上角饭耳 LOGO；下面一段「我有 ADHD，答应的事转头就忘……」和心愿「我希望饭耳能让我们每一个孤独的个体，都能感受到被人关心到骨子里的感受。」；底部「下一步」。',
		from: 'fanear/交付页/fanear-0148-accept-shots-20261015/intro-top.jpg',
		redo: [],
	},
	consent: {
		src: phoneConsent,
		device: 'phone',
		caption: '使用前须知',
		alt: '「使用前须知」：4 条都要勾（用自己的账号、饭耳收不到数据、免费按现状提供、录别人之前先取得对方同意），可选一条（把健康数据发给我的大模型），底部「同意并开始使用」。',
		from: 'fanear/交付页/fanear-0148-accept-shots-20261015/consent-back.jpg',
		redo: [],
	},
	setup: {
		src: phoneSetup,
		device: 'phone',
		caption: '先录上',
		alt: '「先录上」：这 3 步做完，手表就开始录。第 1 步「配对 Apple Watch」已完成，第 2 步「手表上装好饭耳」带「看怎么装」按钮，第 3 步「在手表上打开饭耳」；底部「稍后再说」。',
		from: 'fanear/本地资料/first-run-shots-20261015/phone-setup-start-notinstalled.png',
		redo: [],
	},
	checklist: {
		src: phoneChecklist,
		device: 'phone',
		caption: '让饭耳更好用',
		alt: '「让饭耳更好用」：已设好 2/7；「录得稳」下面是停了自动接上（按钮「允许」）、加到常用表盘（「看怎么加」）、接不上时喊你（已设好）；「录得安心」下面是来消息照样震（已设好）、别人看不到你在录（「看怎么设」）；每项旁边可以点「不需要」。',
		from: 'fanear/本地资料/first-run-shots-20261015/phone-setup-guide.png',
		redo: [],
	},
	watchInstall: {
		src: phoneWatchInstall,
		device: 'phone',
		caption: '手表上还没装饭耳',
		alt: '整屏「手表上还没装饭耳，现在录不了」：照下面几步在 iPhone 的「Watch」App 里把饭耳装到手表上；第 1 步打开「Watch」App 点底部的「我的手表」，第 2 步往下滑到最底点「App」，每步配一张截图；底部「先不装」。',
		from: 'fanear/交付页/fanear-0148-accept-shots-20261015/watch-install.jpg',
		redo: [],
	},
	watchRecording: {
		src: watchRecording,
		device: 'watch',
		caption: '正在录',
		alt: '手表正在录：今天已录 6 小时 12 分，电量 63%，已传到手机 5 小时 30 分，还有 2 块等传到手机，下面是「停止录音」按钮。',
		from: 'fanear/本地资料/tf-feedback-20261014/shots-T3-merged/watch-recording.png',
		redo: [],
	},
	watchInterrupted: {
		src: watchInterrupted,
		device: 'watch',
		caption: '被打断',
		alt: '手表被打断后整块屏变蓝：14:32 被打断，录音停了，点一下继续；已录的都存好了，待传 2 块。',
		from: 'fanear/本地资料/tf-feedback-20261014/shots-E-nudge/watch-interrupted.png',
		redo: [],
	},
	watchStopped: {
		src: watchStopped,
		device: 'watch',
		caption: '自己停的',
		alt: '自己停了录音的手表：没在录，今天已录 6 小时 12 分，已传到手机 6 小时 12 分，14:32 你自己停的，下面是「开始录音」按钮。',
		from: 'fanear/本地资料/tf-feedback-20261014/shots-E/watch-synced.png',
		redo: [],
	},
} as const satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

// 0.2.0 待合：L10（页签改名合进去、截图重拍以后，这句的后半句删掉）
/** 截图旁边要说一次的事实 */
export const SHOTS_NOTE = '截图来自模拟器，人名和对话都是 App 自带的演示数据。底部页签还是现在的「今天 - 饭耳 - 待办 - 设置」，0.2.0 改成「今天 - 待办 - 小耳 - 设置」后重拍。';
