// App 截图：iOS 27 / watchOS 27 模拟器 + App 自带的演示数据（人名、对话都是编的）。
// 这一版是 0.2.0 合进饭耳 main（8a16607）以后重拍的（10-16）：饭耳仓库 本地资料/website-020-20261015/ 下两个目录，
//   shots-020-1015-1614       商店模式（scripts/mac/sim-shots.sh --store）：大多数图从这里来
//   shots-020-demo-1015-1623  普通演示模式：只用了「小耳说过的话」（商店模式不加载小耳的演示卡片）
// 底部页签都是「今天 - 待办 - 小耳 - 设置」。
//   from   这张图是从哪拷来的（饭耳仓库 fanear/ 下的路径）
//   redo   以后哪次改版会改到这一屏、所以必须重拍；空数组 = 现在不用重拍
// 不收露出开发者自己配置的图（比如设置首页、大模型页写着开发者在用的模型名），也不收只有内测版才有的按钮（「现在找一句」「现在写总结」）。
import type { ImageMetadata } from 'astro';
import phoneAsr from '../assets/shots/phone-asr.png';
import phoneCare from '../assets/shots/phone-care.png';
import phoneChecklist from '../assets/shots/phone-checklist.png';
import phoneConsent from '../assets/shots/phone-consent.png';
import phoneConversation from '../assets/shots/phone-conversation.png';
import phoneIntro from '../assets/shots/phone-intro.jpg';
import phoneSearch from '../assets/shots/phone-search.png';
import phoneSetup from '../assets/shots/phone-setup.png';
import phoneShare from '../assets/shots/phone-share.png';
import phoneToday from '../assets/shots/phone-today.png';
import phoneTodoDeck from '../assets/shots/phone-todo-deck.png';
import phoneTodoList from '../assets/shots/phone-todo-list.png';
import phoneVoices from '../assets/shots/phone-voices.png';
import phoneWatchInstall from '../assets/shots/phone-watch-install.png';
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
	/** 以后哪次改版会改到这一屏 */
	redo: readonly string[];
}

const STORE = 'fanear/本地资料/website-020-20261015/shots-020-1015-1614';
const DEMO = 'fanear/本地资料/website-020-20261015/shots-020-demo-1015-1623';

export const SHOTS = {
	today: {
		src: phoneToday,
		device: 'phone',
		caption: '今天',
		alt: '手机上的「今天」：最上面一条深色横条「让饭耳更好用，已设好 4/7，还差 3 项」和「继续设置」；下面 10月16日 周五，右上角绿点「录音正常」；深色横幅「1 件今天要做，另有 2 张新卡等你滑」和「去处理」；一张卡写着「今天 32 块转写完，2 块失败，1 块还在转，1 块你删掉了」，下面是 8 点到 18 点的时间条，再下面「2 块没转成文字、1 块整理失败」旁边是「全部重试」；最后是「今天 2 个时段」，15:38 那一段没转成文字，写着原因「网络连不上」，带「重试」「复制排错提示词」「去设置」。',
		from: `${STORE}/phone-today.png`,
		redo: [],
	},
	todoDeck: {
		src: phoneTodoDeck,
		device: 'phone',
		caption: '待办',
		alt: '「待办」里的一张大卡：红标「过期 1 天」，「答应刘总」「把报价单发给刘总」，下面是昨天 16:04 和刘总吃饭时前后几句原话，「我：今天晚上我把报价单发你。」这句标黄，下面一行「点卡片听这一句」；卡底是「补充」「分享」；右上角「清单 3」。',
		from: `${STORE}/phone-commitments.png`,
		redo: [],
	},
	todoList: {
		src: phoneTodoList,
		device: 'phone',
		caption: '清单',
		alt: '待办里的「清单」：上面分「我要做的 2」「等别人的 1」；「已过期」一件「把报价单发给刘总」，「没说日子」一件「下周带新米样品去刘总店里」，下次明早 8:30 提醒；再下面「已结束 2 张」可以展开，最下面一行「小耳没放进来的 3 条」。',
		from: `${STORE}/phone-todo-list.png`,
		redo: [],
	},
	care: {
		src: phoneCare,
		device: 'phone',
		caption: '小耳说过的话',
		alt: '「小耳说过的话」页：顶上一行「小耳有 1 个小问题想问你」；「今天」一栏写着上午 9:10 说了一句、傍晚 18:05 出错了：大模型返回 503、今天的总结 23:10 左右到；第一张卡是小耳今天 9:10 说的「这周你只在太阳底下待了 40 分钟，上个月一天就有 35 分钟。明天中午出去走走？」，下面的滑条写着「好，明天中午出去走走」；第二张是昨天 22:35 的总结，整封写在卡上：「佳文：今天录音 14 小时 8 分钟，你和 3 个人聊了 1 小时 52 分钟……晚安。」，下面一句能点了听的原话「先按你们的来，有问题算我的」。',
		from: `${DEMO}/phone-care-notebook.png`,
		redo: [],
	},
	conversation: {
		src: phoneConversation,
		device: 'phone',
		caption: '一段对话',
		alt: '一段对话的页面：上面分「转写」「重点」「总结」三栏，现在在「转写」；一句一行，每句写几点说的，左边一道颜色条是谁说的：10:31「配送这边，周三上午能出两车，下午那车得等司机回来。」下面写着「已抓成一件，在滑卡里等你滑」，10:33 这句正在放「王经理那边周三一定要到，先排他。」，没认出是谁的句子旁边有「标记说话人」；10:39 一条状态「说到对账时小陈有点发怔」；最下面是播放器：进度 3:32 / 30:00，「1x」、往回 15 秒、暂停、往前 15 秒。',
		from: `${STORE}/phone-conversation-player.png`,
		redo: [],
	},
	voices: {
		src: phoneVoices,
		device: 'phone',
		caption: '认出的声音',
		alt: '设置里的「声音」：已识别 5 个；「我」累计 24 分钟、2 天；「老周 · 2 个声音」下面分第 1 个声音、第 2 个声音；还有小陈、王经理、老姑，各写累计说了多久、出现几天、第一次和最近一次；最下面是「未识别 · 1 个」。',
		from: `${STORE}/phone-settings-voices.png`,
		redo: [],
	},
	search: {
		src: phoneSearch,
		device: 'phone',
		caption: '搜索',
		alt: '「搜索记录」搜「价格谈不拢」：上面一个「问小耳」按钮，旁边写「把这句话当问题，小耳读原话回答，带出处」；「2 段对话，3 句原话，都是意思相近」；14:00 和王经理通电话里，王经理那句「上回那批五常米，后厨说口感挺好，就是价钱还得再谈谈」标「意思相近」，每句右边一个「听」；下面还有 09:30 和老周看样品时老周问的「闻着挺香，价钱跟上回一样吗？」。',
		from: `${STORE}/phone-search-meaning.png`,
		redo: [],
	},
	asr: {
		src: phoneAsr,
		device: 'phone',
		caption: '语音转文字',
		alt: '设置里的「语音转文字」：火山引擎（收费、效果最佳，标准版 0.8 元/小时）正在用；腾讯云已配好，按钮「设为正在用」；苹果自带转写（不联网，免费、效果一般）；SenseVoice（下载到手机，不联网，免费、效果一般，约 163MB）。每家写着实测「每 100 个字约几个和火山转的不一样」。',
		from: `${STORE}/phone-lasr-engines.png`,
		redo: [],
	},
	share: {
		src: phoneShare,
		device: 'phone',
		caption: '分享这一场',
		alt: '「分享这一场」：预览是一张粉色的图，标题「新品包装定稿会」、一条声纹色条和几条要点；下面选版式（声纹条、杂志、极简）、比例（3:4、9:16、1:1）、配色；「隐去别人的名字」「带时间」都开着；底部「存到相册」「分享」。',
		from: `${STORE}/phone-share-panel.png`,
		redo: [],
	},
	intro: {
		src: phoneIntro,
		device: 'phone',
		caption: '第一次打开',
		alt: '第一次打开的介绍页：上面是干饭CEO 在稻田里的照片，左上角饭耳 LOGO，照片上写着「干饭CEO，饭导五常大米品牌创始人，饭耳的作者」；下面一段「我有 ADHD，答应的事转头就忘……」和心愿「我希望饭耳能让我们每一个孤独的个体，都能感受到被人关心到骨子里的感受。」，再下面两条：手表戴着就在录；你答应别人的、别人答应你的，它从对话里找出来等你确认；底部「下一步」。',
		from: `${STORE}/phone-onboarding-intro.png`,
		redo: [],
	},
	consent: {
		src: phoneConsent,
		device: 'phone',
		caption: '使用前须知',
		alt: '「使用前须知」（第 10 版）：4 条都要勾（转文字、整理对话用的都是你自己的账号；饭耳收不到也不存任何用户数据；免费、按现状提供；录别人之前先取得对方同意），每条可以展开说明；可选一条（整理对话、找一句关照、写每天的总结时，把健康数据发给我的大模型）；底部「同意并开始使用」。',
		from: `${STORE}/phone-onboarding.png`,
		redo: [],
	},
	setup: {
		src: phoneSetup,
		device: 'phone',
		caption: '先录上',
		alt: '「先录上」：这 3 步做完，手表就开始录。第 1 步「配对 Apple Watch」已完成，第 2 步「手表上装好饭耳」带「看怎么装」按钮，第 3 步「在手表上打开饭耳」；底部「稍后再说」。',
		from: `${STORE}/phone-setup-start-notinstalled.png`,
		redo: [],
	},
	checklist: {
		src: phoneChecklist,
		device: 'phone',
		caption: '让饭耳更好用',
		alt: '「让饭耳更好用」：已设好 2/7；「录得稳」下面是停了自动接上（按钮「允许」）、加到常用表盘（「看怎么加」）、接不上时喊你（已设好）；「录得安心」下面是来消息照样震（已设好）、别人看不到你在录（「看怎么设」）；每项旁边可以点「不需要」；底部「稍后再设」。',
		from: `${STORE}/phone-setup-guide.png`,
		redo: [],
	},
	watchInstall: {
		src: phoneWatchInstall,
		device: 'phone',
		caption: '手表上还没装饭耳',
		alt: '整屏「手表上还没装饭耳，现在录不了」：照下面几步在 iPhone 的「Watch」App 里把饭耳装到手表上，装好这一页会自己收起；第 1 步打开「Watch」App 点底部的「我的手表」，第 2 步往下滑到最底点「App」，每步配一张截图；底部「先不装」。',
		from: `${STORE}/phone-watch-install-notinstalled.png`,
		redo: [],
	},
	watchRecording: {
		src: watchRecording,
		device: 'watch',
		caption: '正在录',
		alt: '手表正在录：今天已录 6 小时 12 分，电量 63%，已传到手机 5 小时 30 分，待传 2 块、等连上手机，下面是「停止录音」按钮。',
		// 表上的时钟是拍摄时的北京时间（watchOS 模拟器改不了时钟）：10-16 14:53 重拍，对得上这一天下午的演示
		from: 'fanear/本地资料/website-020-20261015/shots-watch-1016-1450/watch-recording.png',
		redo: [],
	},
	watchInterrupted: {
		src: watchInterrupted,
		device: 'watch',
		caption: '被打断',
		alt: '手表被打断后整块屏变蓝：14:32 被打断，录音停了，点一下继续；已录的都存好了，待传 2 块。',
		from: 'fanear/本地资料/tf-feedback-20261014/shots-E-nudge/watch-interrupted.png（旧图，核对过 main 8a16607 界面一致，时钟对得上「14:32」）',
		redo: [],
	},
	watchStopped: {
		src: watchStopped,
		device: 'watch',
		caption: '自己停的',
		alt: '自己停了录音的手表：没在录，今天已录 6 小时 12 分，已传到手机 6 小时 12 分，14:32 你自己停的，下面是「开始录音」按钮。',
		from: 'fanear/本地资料/tf-feedback-20261014/shots-E/watch-synced.png（旧图，核对过 main 8a16607 界面一致，时钟对得上「14:32」）',
		redo: [],
	},
} as const satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

/** 截图旁边要说一次的事实 */
export const SHOTS_NOTE = '截图来自模拟器，人名和对话都是 App 自带的演示数据。';
