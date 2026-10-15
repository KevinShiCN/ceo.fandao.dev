// 功能：首页「按页签走一遍」、功能页、首页「你的数据」都从这一份取，不按子串挑句子。
// 内容按 0.2.0（送审版本，饭耳仓库 docs/specs/fanear-020-release-20261015.md）写。
// 事实来源：饭耳仓库 本地资料/website-020-20261015/feature-inventory.md（取自 main eb49a72 = 0.1.48），
//   界面上的字照 App 源码原字（Apps/iOS、Sources/FanEarCore）。只在内测版有的功能、roadmap 里的一律不写。
// 0.2.0 已整体合进饭耳 main（8a16607，10-15）；每句按 main 的源码和界面原字核对过（10-16 sonnet 逐条核对）。
import type { ShotId } from './shots';

export interface Point {
	text: string;
	/** 首页「按页签走一遍」也写这一句（每节 2–4 句） */
	home?: boolean;
}

export interface Group {
	/** 页面锚点 */
	id: string;
	title: string;
	/** 首页「手机上」那一节的大标题（不写就用 title） */
	headline?: string;
	/** 一句话 */
	lead: string;
	points: readonly Point[];
	/** 配哪几张截图，第一张是首页用的 */
	shots: readonly ShotId[];
}

/** 「你的数据」：首页一节、功能页「数据和隐私」一组，同一份。措辞照 LegalTexts.swift 和事实底稿第五节第 6 条 */
export interface DataFact {
	title: string;
	text: string;
}

export const DATA_LEAD = '录音和文字存在你的手表和手机上。要转写、要整理时，手机直接发给你自己选的服务商。';

export const DATA: readonly DataFact[] = [
	{
		title: '不经过开发者的服务器',
		text: '饭耳没有服务器，没有账号系统，也没有统计和广告工具。开发者只收得到你自己在「设置 → 开发者调试专用 → 给开发者提 BUG」里导出、亲手发过来的那一份（连点设置最底下的版本号 5 下才出现）。',
	},
	{
		title: '用你自己的账号',
		text: '云端转写（火山引擎、腾讯云）和大模型，都填你自己的账号，钱直接付给服务商。密钥存在手机的钥匙串里。',
	},
	{
		title: '本机转写免费',
		text: '「苹果自带转写」和「SenseVoice」在手机上转，不联网、免费，效果一般，不分说话人。没配云端时先用它们。',
	},
	{
		title: '没人声的块不送云端',
		text: '手机先判断整块录音有没有人声，判定没人声的不送云端转写；判断不出来的照常送。想转也能点「还是转写」。',
	},
	{
		title: '录音默认留 30 天',
		text: '设置 → 更多 →「录音留存时间」里可以选 7、30、90 天，最多 5、10、20、50 GB（满了先删最早的），或一直留着。只删录音文件，文字、整理、待办、声纹都留着。',
	},
	{
		title: '彻底删除这一段',
		text: '对话页最下面「删除部分或整段」，选「彻底删除这一段」：录音、转写、整理、待办卡、声纹样本、搜索索引一起删，删了找不回，要确认三次。',
	},
	{
		title: '清空数据',
		text: '设置 → 更多 → 清空数据，要确认两次：「清空录音和历史」「清空录音和历史，声音留着」「回到第一次打开」。最后一个连全部设置（含大模型配置）、密钥、须知同意和下载的本机转写模型一起删。服务商那边已经收到的，饭耳清不掉。',
	},
	{
		title: '录别人之前，先取得对方同意',
		text: '身边人说的话会被一起录下、转成文字、发给你配置的服务商。录音前请告诉对方并取得同意；导出和分享图里有别人的原话，发出去前也先问对方。',
	},
];

/** 手表这一组的三句：首页手表三种样子旁边也用 */
const WATCH = {
	chunk: '每 15 分钟一块传到手机。手机确认收到之前，表上那一块不删。',
	// 自动接着录（本人 10-15「其实支持了自动恢复录制了」）：打断结束时手表上的饭耳在前台就自己续上，不在前台请手机拉起来
	// （Apps/Watch/RecorderController+AudioSession.swift handleInterruption；「用体能训练拉起来」默认开），
	// 手机拉不起来就发通知喊人（Apps/iOS/Transfer/AutoLaunchPlan.swift）。不写成保证一直录。
	interrupt: '被来电、Siri、闹钟打断，打断一结束就自己接着录；没接上时，手表和手机提醒你点一下。',
	battery: '电量低于 10% 又没在充电，先存好正在录的这一块再停。',
	stopped: '按了停就不录了，再点「开始录音」接着录。',
} as const;

/** 首页「手表上」：三张手表截图各配一句，最后一句放在下面 */
export const WATCH_STATES: readonly { shot: ShotId; text: string }[] = [
	{ shot: 'watchRecording', text: WATCH.chunk },
	{ shot: 'watchInterrupted', text: WATCH.interrupt },
	{ shot: 'watchStopped', text: WATCH.stopped },
];
export const WATCH_FOOT = WATCH.battery;

export const GROUPS: readonly Group[] = [
	{
		id: 'watch',
		title: '手表',
		lead: '打开手表上的饭耳就开始录，不用掏手机，也不用想着记。',
		points: [
			{ text: WATCH.chunk, home: true },
			{ text: WATCH.interrupt, home: true },
			{ text: WATCH.battery, home: true },
			{ text: '设置里「录音自动启停」（今天页手表按钮里叫「录音时间」）按 15 分钟一格涂录或不录。白天的空档手表待命，到点接着记；每天最长那段不录的时间（一般是夜里）手表真停，第二天到点震一下。' },
			{ text: '编辑表盘时选「饭耳」›「录音状态」，表盘上就写着「正在录」「没在录」「待命」「不录时段」。' },
		],
		shots: ['watchRecording', 'watchInterrupted', 'watchStopped'],
	},
	{
		id: 'today',
		title: '今天',
		headline: '今天录了什么，一页看完',
		lead: '今天录下的对话，按「一段时间一张卡」列出来，卡上最多写 4 件事。',
		points: [
			{ text: '时间条上，彩色是对话，黑块是没录到，斜纹是没转成文字，白格是按计划不录。', home: true },
			{ text: '右上角的手表按钮直接写状态：绿点「录音正常」；红的就是要你处理。点进去能看「今天的中断记录」。', home: true },
			{ text: '没转成文字、整理失败的录音，点「全部重试」一次重来。', home: true },
			{ text: '顶上写「N 件今天要做」，点「去处理」就到待办。' },
			{ text: '最下面一行是心率变异性（HRV），点进去看天、周、月的趋势。' },
		],
		shots: ['today'],
	},
	{
		id: 'todo',
		title: '待办',
		headline: '答应的事，一张一张滑',
		lead: '饭耳从对话里找出你答应别人的、别人答应你的，一次一张大卡给你滑。',
		points: [
			{ text: '卡上写这句话前后几句原文、谁说的、哪天几点说的。点一下卡，听这一句。', home: true },
			{ text: '右滑是「做完了 / 不用做」，左滑是「要做 · 稍后提醒」。滑错了点撤销。', home: true },
			{ text: '左滑的到点再拿给你看；同一张第 3 次左滑，问你下次什么时候提醒。' },
			{ text: '右上角「清单」分「我要做的」「等别人的」，按已过期、今天、明天、以后、没说日子排。已结束的 48 小时内能捞回来。', home: true },
		],
		shots: ['todoDeck', 'todoList'],
	},
	{
		id: 'xiaoer',
		title: '小耳',
		headline: '小耳偶尔跟你说一句',
		lead: '饭耳在 App 里跟你说话时叫「小耳」。底部「小耳」页签存着它跟你说的话和每天的总结。',
		points: [
			{ text: '偶尔跟你说一句你没留意的事，每天最多一句。比如：「这周你只在太阳底下待了 40 分钟，上个月一天就有 35 分钟。明天中午出去走走？」', home: true },
			{ text: '睡前半小时，在今天页写好「今天的总结」，以前的都存在「小耳」页签。', home: true },
			{ text: '卡下面的滑条上是替你写好的回话，滑到底就收下。', home: true },
			{ text: '「这个声音是谁」这类小问题收成一行「小耳有 N 个小问题想问你」，放在这一页顶上，点开一个个答。听错的字不再问你，自动改好。' },
			{ text: '用你正在用的大模型写，没配大模型就没有。健康数据只在你同意以后才发给它。' },
		],
		shots: ['care'],
	},
	{
		id: 'conversation',
		title: '对话',
		lead: '一段对话分三栏：转写、重点、总结。底下一直有播放器，能 1×、1.25×、1.5×、2× 倍速、前后跳 15 秒，放的时候转写跟着往下走。',
		points: [
			{ text: '你的声音先靠声纹认；还没记住你的声音时，同一段录音里最响的多半是你。' },
			{ text: '每句话的声音特征在手机上算，只存在手机上。常出现的声音（累计满 10 分钟、出现在 3 天以上）会问你一次「这个声音是谁？」' },
			{ text: '没名字的声音一直叫同一个编号「声音 N」；被人叫过称呼的，旁边挂「可能是小林」，点开听几句，选是或不是。' },
			{ text: '认错了：转写页签顶上有一行「说话的人：…」，点开每人一行「听」「跳到」「标记」，你那一行是「不是我」；也能长按一句选「标记说话人」。标记时边打字边搜名字，默认这一场他说的都标。改完那一段自动重新整理，你改过的一直算数。' },
			{ text: '点任意一句，从那句开始往下放；正在放的那句再点一下暂停。同一段时间你的心率画在「总结」页签里。' },
			{ text: '转写听错的字，大模型标出来的那一句自动改好；改过的旁边写着「已改字」，点开能看原来听成什么、听这句，也能改回去。' },
		],
		shots: ['conversation', 'voices'],
	},
	{
		id: 'search',
		title: '搜索',
		lead: '搜人名、事情，或者「上周三」这样的日子。结果按天列出命中的那句话，点一下跳过去。',
		points: [
			{ text: '可以试试「报价」「上周三 报价」「昨天说好的事」。' },
			{ text: '按意思也能搜：搜「价格谈不拢」能找到「你们报价太高了」，标「意思相近」。用的是装在手机上的模型，不联网。' },
			{ text: '「问小耳」用你配的大模型回答，带出处：哪天几点的原话。选了 iPhone 自带模型时用不了。' },
		],
		shots: ['search'],
	},
	{
		id: 'export',
		title: '导出和分享',
		lead: '导出的文件只在手机上生成。设置 → 更多 → 导出，对话页右上角也有「导出」。',
		points: [
			{ text: '三个用途：「备份全部」「给 AI 或导进笔记」「发纪要」。也可以自定义，自己勾 Markdown、PDF、JSON、TXT、CSV、字幕 SRT 和录音。' },
			{ text: '「发纪要」是一份 PDF：日期、时段、参与的人、要点、待办和原文。' },
			{ text: '可以关掉这一页，导出在后台接着做，好了会告诉你。' },
			{ text: '一句关照、每天的总结、一场对话、一条待办、一句原话，都能做成图分享：17 个版式、10 套配色，3:4、9:16、1:1，默认隐去别人的名字。截屏以后还会弹「帮你排好版了」。' },
		],
		shots: ['share'],
	},
	{
		id: 'models',
		title: '转文字和大模型',
		headline: '转文字和大模型，你自己选',
		lead: '设置里的「语音转文字」和「AI大模型」。转文字有云端两家、手机本机两种；大模型用你自己的账号。',
		points: [
			{ text: '云端：火山引擎（标「收费、效果最佳」，0.8 元/小时）、腾讯云。用你自己的账号，分得清谁在说话。', home: true },
			{ text: '本机：「苹果自带转写」「SenseVoice」，不联网、免费，效果一般，不分说话人。没配好云端时先用本机。', home: true },
			{ text: '配好以后只用「正在用」那一家，连不上不会自动换别家。' },
			{ text: '云端出错时先隔一会儿自己重试，再查是不是服务商的问题；服务商没问题，就请你「发给开发者」，只带日志。' },
			{ text: '大模型按供应商添加：国内有 DeepSeek、通义千问、豆包、Kimi、智谱 GLM，海外有 OpenAI、Anthropic、Google、Meta、OpenRouter，也能自定义。接口格式四种：「Responses」「OpenAI 兼容」「Claude 兼容」「Gemini 原生」。', home: true },
			{ text: '也可以选「iPhone 自带模型」：只出标题和要点，不抓承诺、不认人。' },
		],
		shots: ['asr'],
	},
	{
		id: 'data',
		title: '数据和隐私',
		lead: DATA_LEAD,
		points: DATA.map((fact) => ({ text: `${fact.title}：${fact.text}` })),
		shots: [],
	},
];

export function group(id: string): Group {
	const found = GROUPS.find((g) => g.id === id);
	if (!found) throw new Error(`功能分组「${id}」不在 src/lib/features.ts 里`);
	return found;
}

/** 首页写的几句 */
export function homePoints(g: Group): string[] {
	const picked = g.points.filter((p) => p.home).map((p) => p.text);
	if (picked.length < 2 || picked.length > 4) throw new Error(`功能分组「${g.id}」首页要 2–4 句，现在 ${picked.length} 句`);
	return picked;
}
