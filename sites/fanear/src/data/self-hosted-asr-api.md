# 饭耳「自建服务」转写接口说明

饭耳按 OpenAI 的语音转文字接口 `POST /v1/audio/transcriptions` 对接你自己的转写服务。服务端用什么软件、什么模型都行，请求和返回按下面来就能接。

## 饭耳发什么

- 地址：设置里填到 `/v1` 为止，比如 `https://asr.example.com/v1`，饭耳在后面接 `/audio/transcriptions`。公网地址只收带正规证书的 https；家里或公司局域网地址（10/8、172.16/12、192.168/16、fd00::/8、`.local`）可以用 http。
- 一块录音（通常 15 分钟）发一次 `POST`，`multipart/form-data`，同步等结果，最多等 600 秒。没有异步任务、没有流式。「测试连接」测出只回文字的服务不整块发，切成小段一段发一次（见「只回文字的服务」）。
- 填了密钥才带 `Authorization: Bearer <密钥>`；没填就不带。

| 表单字段 | 值 |
|---|---|
| `file` | 文件名 `audio.m4a`，`Content-Type: audio/mp4`（AAC 单声道；默认原样，15 分钟约 7MB，不压缩） |
| `model` | 设置里填的模型名 |
| `response_format` | 「分说话人」关：`verbose_json`；开：`diarized_json`；只回文字的服务切小段送时用测试连接测出的那种（一般是 `json`） |
| `temperature` | `0` |
| `chunking_strategy` | 只在整块送 `diarized_json` 时发，值 `auto`（OpenAI 的分人模型超过 30 秒必须带）；切小段送不发 |

不发 `language`、`prompt`、`timestamp_granularities`、`stream`。服务不认识的字段请忽略，不要报错（OpenAI 也是忽略的，2026-10-18 实测）。

## 饭耳要什么返回

HTTP 200，一个 JSON 对象。饭耳只读下表几样；`task`、`language`、`duration`、`usage`、`id`、`type`、`words` 等有没有都行。

| 字段 | 要求 |
|---|---|
| `segments` | 有就整块送：数组，一句一项；没人说话回 `[]`。没有就按只回文字的服务切小段送（见下） |
| `segments[].start`、`segments[].end` | 有 `segments` 时必须有，数字，单位秒，从这块录音开头算；0 ≤ start ≤ end ≤ 14400 |
| `segments[].text` | 有 `segments` 时必须有，字符串 |
| `segments[].speaker` | 可选；字符串（`"A"`、`"SPEAKER_00"`、`"S01"`）或整数（`0`、`1`）都行；没有就按不分说话人显示 |
| `text` | 只回文字的服务必须有（整段文字）；有 `segments` 时只用来分清「没人说话」和「有字没有每句时间」 |

- `verbose_json` 和 `diarized_json` 按同一张表读：开着「分说话人」时回带 `speaker` 的 `verbose_json` 也行；关着时服务自己带了 `speaker` 也照样用。
- 说话人标签只在这一块里有效：饭耳按出现顺序编成第 1、2、3 个人；跨块是不是同一个人由饭耳自己的声纹判断，服务不用管，也不用跨块保持一致。
- 分段没有长度和条数限制，按时间先后排。建议一句一段（几秒到二三十秒）：饭耳里点一句话会从那句开头播放，一整块只回一段也能转，但只能从头播放。
- 某一句的 start、end 缺了或超出范围，这一块整块算失败，不会只丢那一句。

## 只回文字的服务

只回整段文字、没有每句时间的服务也能接：返回里没有 `segments`、或 `segments` 空着却有 `text`，或者不认 `verbose_json`、`diarized_json` 但认 `json`。

- 在设置里点「测试连接」时饭耳测出来并记住；换了地址、模型或「分说话人」开关，会重新测。
- 以后每块：用手机自带的声音识别找出哪里有人说话，在停顿处切成最长约 30 秒的小段，没人说话的部分不发；每段发一次，`response_format` 用测出来的那种（一般是 `json`），不带 `chunking_strategy`。
- 返回只要顶层的 `text`（字符串）。饭耳按句末标点（。！？!?）分句、按字数估每句的时间（点一句播放会差一两秒），说话的人由手机按声音认。
- 一块要发二三十到四十次请求（15 分钟），服务要撑得住连着来的请求。

## 出错时

- 回非 200 的状态码，最好带 OpenAI 格式的错误体 `{"error":{"message":"…","type":"…","code":"…"}}`，饭耳把 code 和 message 放进出错详情。
- 不认要的 `response_format` 时回 400 或 422，正文里写出 `response_format` 或格式名：饭耳会提示「关掉/打开『分说话人』再试」。
- 没测过就只回整段文字（没有 `segments`，或 `segments` 空着却有 `text`）：饭耳提示「这个服务只回文字，没有每句时间」，点「测试连接」重测后改切小段送；这块不会当成没人说话。
- 「测试连接」发一句约 6 秒的合成语音（m4a，不是录音）：回了带时间的 `segments` 就整块送；回了文字没有每句时间、或 400/422 不认这个格式，再用 `response_format=json` 发一次，回了文字就记成只回文字；最后不带密钥发一次，也回 200 会提示「服务没设密码」。

## 已核对的服务（2026-10-18）

「实测」是真调了接口；「源码」「文档」是看了对方的代码或官方文档，没有真调。

| 服务 | 「分说话人」关 | 「分说话人」开 | 依据 |
|---|---|---|---|
| OpenAI `whisper-1` | 能用（不分人） | 400，关掉即可 | 实测 |
| OpenAI `gpt-4o-transcribe-diarize` | 400，要打开 | 能用，speaker 是 A、B | 实测 |
| OpenAI `gpt-4o-transcribe`、`gpt-4o-mini-transcribe` | 只回文字：切小段送 | 只回文字：切小段送 | 实测只回文字；切小段送没真调 |
| vLLM + Whisper | 能用；解码时长上限默认 600 秒，要调到 900 以上 | 不支持 | 源码 |
| vLLM + MOSS-Transcribe-Diarize | 不支持 | 能用，speaker 是 S01… | 源码 |
| vLLM + Qwen3-ASR | 只回文字：切小段送 | 只回文字：切小段送 | 源码 |
| speaches（原 faster-whisper-server） | 能用 | 422 | 源码 |
| LocalAI（2026-05 以后的版本） | 能用；更早的版本时间是纳秒，用不了 | 400 | 源码 |
| whisper.cpp server（加 `--request-path /v1 --inference-path /audio/transcriptions --convert`） | 能用 | 只回文字：切小段送，或关掉 | 源码 |
| WhisperLiveKit（加 `--diarization`） | 能用 | 能用 | 源码 |
| FunASR 官方 openai_api server | 能用 | 只回文字：切小段送，或关掉 | 源码 |
| Groq | 能用 | 不支持 | 文档 |
| Together AI | 能用（不分人；它的说话人要另传 `diarize=true`，饭耳不发） | 不支持 | 文档 |
| Mistral Voxtral | 多半只回文字（要另传 `timestamp_granularities=segment` 才有分句，饭耳不发）：切小段送 | 同左 | 文档 |
| 硅基流动 SiliconFlow | 只回文字：切小段送 | 只回文字：切小段送 | 文档 |

不是这个接口的服务接不上：ElevenLabs、Deepgram、AssemblyAI，以及 whisper-asr-webservice（`/asr`）。阿里云百炼、火山引擎、腾讯云饭耳已经单独接好，不走这里。

