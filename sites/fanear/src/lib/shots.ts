// App 截图：iOS 27 / watchOS 27 模拟器 + App 自带的演示数据（人名、对话都是编的）。
// 这一版是按 0.3.0（饭耳 main 2d3b6514，505 构建）重拍的（10-17）：饭耳仓库 本地资料/website-030-20261017/ 下，
//   shots-030-store-public-1017        商店模式（scripts/mac/sim-shots.sh --store）：0.3.0 改到的手机图大多从这里来
//   shots-030-store-public-share-1017  同上，只拍「分享这一场」（FANEAR_SHOT_WAIT=25，等面板升到顶）
//   shots-030-demo-public-1017         普通演示模式：只用了「小耳说过的话」（商店模式不加载小耳的演示卡片）
//   shots-030-watch-1017               手表「正在录」（北京时间下午拍，表上时钟对得上演示里的时间）
//   拍的是本地截图分支 work/site-shots-030-20261017 的 b033a163：只把调试版的内测编译开关去掉（自建服务、环境和语气这类只在内测版有的东西就不出现），
//   App 代码和 2d3b6514 一样；分支用完删了。0.3.0 没改到的图（待办、搜索、介绍、先录上、装手表、手表被打断/自己停的）照旧用 10-16 那一版，
//   10-17 也照样拍了对过，除了日期、表上时钟和底部横条，没有别的不同。
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
const STORE_030 = 'fanear/本地资料/website-030-20261017/shots-030-store-public-1017';
const DEMO_030 = 'fanear/本地资料/website-030-20261017/shots-030-demo-public-1017';

export const SHOTS = {
	today: {
		src: phoneToday,
		device: 'phone',
		caption: '今天',
		alt: '手机上的「今天」：最上面一条深色横条「让饭耳更好用，已设好 5/8，还差 3 项」和「继续设置」；下面 10月17日 周六，旁边能翻前一天后一天，还有一个「…」，右上角放大镜和绿点「录音正常」；一条灰底的「健康」：心率变异性今天 44 毫秒，在平时范围里；深色横幅「1 件今天要做，另有 2 张新卡等你滑」和「去处理」；一张卡写着「今天 32 块转写完，2 块失败，1 块还在转，1 块你删掉了」，下面是 8 点到 18 点的时间条，再下面「2 块没转成文字、1 块整理失败」旁边是「全部重试」；最后是「今天 2 个时段」，15:38 那一段没转成文字，写着原因「网络连不上」，带「重试」「复制排错提示词」「去设置」。',
		from: `${STORE_030}/phone-today.png`,
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
		alt: '待办里的「清单」：上面分「我要做的 2」「等别人的 1」；「已过期」一件「把报价单发给刘总」，「没说日子」一件「下周带新米样品去刘总店里」，下次明早 8:30 提醒；再下面「已结束 3 张」可以展开，最下面一行「小耳没放进来的 3 条」。',
		from: `${STORE_030}/phone-todo-list.png`,
		redo: [],
	},
	care: {
		src: phoneCare,
		device: 'phone',
		caption: '小耳说过的话',
		alt: '「小耳说过的话」页：顶上一行「小耳有 1 个小问题想问你」；「今天」一栏写着上午 9:10 说了一句、傍晚 18:05 出错了：大模型返回 503、今天的总结 23:10 左右到；第一张卡是小耳今天 9:10 说的「这周你只在太阳底下待了 40 分钟，上个月一天就有 35 分钟。明天中午出去走走？」，下面的滑条写着「好，明天中午出去走走」；第二张是昨天 22:35 的总结，整封写在卡上：「今天录音 14 小时 8 分钟，你和 3 个人聊了 1 小时 52 分钟……晚安。」，下面一句能点了听的原话「先按你们的来，有问题算我的」，再下面「明天别忘了：给张姐回电话」。',
		from: `${DEMO_030}/phone-care-notebook.png`,
		redo: [],
	},
	conversation: {
		src: phoneConversation,
		device: 'phone',
		caption: '一个时段',
		alt: '一个时段的页面：顶上分「重点」「转写」「总结」，现在在「转写」；先是「大纲」，列着 09:30 和老周看样品、10:30 和小陈开周会；下面是转写，「和老周看样品 · 09:30–09:45」，每句上面一行小灰字写几点几分几秒、谁说的（我、老周、说话人 1），正在放的那句「闻着挺香，价钱跟上回一样吗？」底下有一道浅灰；有的句子下面写着「已抓成一件，在滑卡里等你滑」「已进待办」；往下到「和小陈开周会」，有一行「你在手表上标了重点 · 10:32:00」；底部页签上方飘着一条小播放条：暂停键、09:32:41、和老周看样品，右边一个放大键。',
		from: `${STORE_030}/phone-episode-player.png`,
		redo: [],
	},
	voices: {
		src: phoneVoices,
		device: 'phone',
		caption: '认出的声音',
		alt: '设置里的「声音」：已识别 5 个，每个名字前面一个颜色点；「我」累计 26 分钟、2 天；「老周 · 2 个声音」下面分第 1 个声音、第 2 个声音；还有小陈、王经理、老姑，各写累计说了多久、出现几天、第一次和最近一次；最下面是「未识别 · 1 个」。',
		from: `${STORE_030}/phone-settings-voices.png`,
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
		alt: '设置里的「语音转文字」：火山引擎（收费、效果最佳，标准版 0.8 元/小时）正在用；腾讯云、阿里云百炼（千问语音识别）都已配好，各有一个「设为正在用」；苹果自带转写（不联网，免费、效果一般）；SenseVoice（下载到手机，不联网，免费、效果一般，约 163MB）。每家写着实测「每 100 个字约几个和火山转的不一样」。',
		from: `${STORE_030}/phone-lasr-engines.png`,
		redo: [],
	},
	share: {
		src: phoneShare,
		device: 'phone',
		caption: '分享这一场',
		alt: '「分享这一场」：预览是一张粉色的图，标题「新品包装定稿会」、一条声纹色条、谁说了多久（我 · 18 分，说话人 2 · 14 分……）和几条要点，图底写着「饭耳 · 你的 AI 全天助理」和官网地址；下面选版式（声纹条、杂志、极简）、比例（3:4、9:16、1:1）、配色；「隐去别人的名字」「带时间」都开着；底部「存到相册」「分享」。',
		from: 'fanear/本地资料/website-030-20261017/shots-030-store-public-share-1017/phone-share-panel.png',
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
		alt: '「使用前须知」（第 11 版，更新于 2026-10-17）：4 条都要勾（转文字、整理对话用的都是你自己的账号；饭耳收不到也不存任何用户数据；免费、按现状提供；录别人之前先取得对方同意），每条可以展开说明；可选一条（整理对话、找一句关照、写每天的总结时，把健康数据发给我的大模型）；底部「同意并开始使用」。',
		from: `${STORE_030}/phone-onboarding.png`,
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
		alt: '「让饭耳更好用」：已设好 4/8；「录得稳」下面是停了自动接上（按钮「允许」）、手机在后台也能叫手表（已设好）、加到常用表盘（「看怎么加」）、接不上时喊你（已设好）；「录得安心」下面是来消息照样震（已设好）；每项旁边可以点「不需要」；底部「稍后再设」。',
		from: `${STORE_030}/phone-setup-guide.png`,
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
		alt: '手表正在录：今天已录 6 小时 12 分，电量 63%，已传到手机 5 小时 30 分，待传 2 块、等连上手机；最下面左边一个大的「标重点」，右边一个窄的停止键。',
		// 表上的时钟是拍摄时的北京时间（watchOS 模拟器改不了时钟）：10-17 14:51 重拍，对得上这一天下午的演示
		from: 'fanear/本地资料/website-030-20261017/shots-030-watch-1017/watch-recording.png',
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
		from: 'fanear/本地资料/website-030-20261017/shots-030-watch-1017/watch-synced.png（10-17 北京 14:52 拍；旧图表上是 13:26，跟「14:32 你自己停的」对不上）',
		redo: [],
	},
} as const satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

/** 截图旁边要说一次的事实 */
export const SHOTS_NOTE = '截图来自模拟器，人名和对话都是 App 自带的演示数据。';
