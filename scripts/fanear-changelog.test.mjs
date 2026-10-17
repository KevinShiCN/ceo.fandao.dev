// 饭耳更新记录解析器的测试：node --test scripts/fanear-changelog.test.mjs
// 解析器在 sites/fanear/src/lib/changelog.mjs，官网的「更新记录」页和同步脚本都用它。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dateText, isDeveloperOnly, noteLabel, parseChangelog, versionDate } from '../sites/fanear/src/lib/changelog.mjs';

const NOW = `# 饭耳 FanEar 更新记录

每发一个新版本先在这里写好。写给用户看。

## 未发布

### 0.1.0（开发中，只在自己的手机上装机测试）
- 2026-10-13 界面换成「声纹」设计。
- 2026-10-12 手表全天录音，按 15 分钟一块传到手机。

## 已发布

（还没有）
`;

test('现在这份：未发布 1 个版本 2 条，已发布为空，开头的说明不进页面', () => {
	const log = parseChangelog(NOW);
	assert.equal(log.unreleased.length, 1);
	assert.deepEqual(log.released, []);
	const [v] = log.unreleased;
	assert.equal(v.version, '0.1.0');
	assert.equal(v.note, '开发中，只在自己的手机上装机测试');
	assert.equal(v.anchor, 'v0-1-0');
	assert.deepEqual(v.items, [
		{ date: '2026-10-13', text: '界面换成「声纹」设计。' },
		{ date: '2026-10-12', text: '手表全天录音，按 15 分钟一块传到手机。' },
	]);
	assert.ok(!JSON.stringify(log).includes('写给用户看'));
});

test('发版以后：两个分组都有版本，各自保持文件里的顺序', () => {
	const md = NOW.replace('（还没有）', '### 0.1.0（2026-10-20 上 TestFlight）\n- 2026-10-20 第一版。\n').replace(
		'### 0.1.0（开发中，只在自己的手机上装机测试）\n- 2026-10-13 界面换成「声纹」设计。\n- 2026-10-12 手表全天录音，按 15 分钟一块传到手机。\n',
		'### 0.2.0（开发中）\n- 2026-10-25 加深色模式。\n',
	);
	const log = parseChangelog(md);
	assert.deepEqual(
		log.unreleased.map((v) => v.version),
		['0.2.0'],
	);
	assert.deepEqual(
		log.released.map((v) => [v.version, v.note]),
		[['0.1.0', '2026-10-20 上 TestFlight']],
	);
});

test('没写日期的条目照样收下，日期为空', () => {
	const log = parseChangelog(NOW.replace('- 2026-10-12 手表', '- 手表'));
	assert.deepEqual(log.unreleased[0].items[1], { date: null, text: '手表全天录音，按 15 分钟一块传到手机。' });
});

test('条目折行：续行接到上一条后面，中文之间不加空格', () => {
	const log = parseChangelog(NOW.replace('设计。\n', '设计，\n  手表三种状态。\n'));
	assert.equal(log.unreleased[0].items[0].text, '界面换成「声纹」设计，手表三种状态。');
});

test('Windows 换行也认', () => {
	assert.equal(parseChangelog(NOW.replaceAll('\n', '\r\n')).unreleased[0].items.length, 2);
});

test('不认识的分组直接报错，写明行号', () => {
	assert.throws(() => parseChangelog(NOW.replace('## 已发布', '## 计划')), /第 11 行.*计划/);
});

test('少了「已发布」分组报错', () => {
	assert.throws(() => parseChangelog(NOW.replace(/## 已发布[\s\S]*$/, '')), /已发布/);
});

test('版本标题不是版本号开头报错', () => {
	assert.throws(() => parseChangelog(NOW.replace('### 0.1.0', '### 第一版')), /第 7 行.*版本号/);
});

test('版本下面看不懂的行报错，不悄悄丢掉', () => {
	assert.throws(() => parseChangelog(NOW.replace('- 2026-10-12', '这一行不是条目\n- 2026-10-12')), /第 9 行.*这一行不是条目/);
});

test('版本下面一条都没有报错', () => {
	assert.throws(
		() => parseChangelog(NOW.replace(/- 2026-10-13[^\n]*\n- 2026-10-12[^\n]*\n/, '')),
		/0\.1\.0.*没有条目/,
	);
});

test('同一个版本号出现两次报错', () => {
	const md = NOW.replace('（还没有）', '### 0.1.0（2026-10-20 上 TestFlight）\n- 2026-10-20 第一版。\n');
	assert.throws(() => parseChangelog(md), /0\.1\.0.*两次/);
});

test('分组里已经有版本还写「还没有」报错', () => {
	assert.throws(() => parseChangelog(NOW.replace('## 已发布\n', '## 已发布\n\n### 0.0.1（试装）\n- 试装。\n')), /还没有/);
});

test('目录里的短说明：括号里第一个逗号、分号前那一截；只写了日期就不要', () => {
	assert.equal(noteLabel('自用内测，2026-10-15'), '自用内测');
	assert.equal(noteLabel('饭耳 Beta，2026-10-16'), '饭耳 Beta');
	assert.equal(noteLabel('内测中，还没对外发布；TestFlight 内测只装在开发者自己的手机上'), '内测中');
	assert.equal(noteLabel('自用内测'), '自用内测');
	assert.equal(noteLabel('2026-10-17'), '');
	assert.equal(noteLabel(''), '');
});

test('版本的日期：标题里写了就用标题的，没写用条目里最晚的一天', () => {
	const item = (/** @type {string | null} */ date) => ({ date, text: '一条' });
	const v = (/** @type {string} */ note, /** @type {(string | null)[]} */ dates) => ({ version: '0.1.0', note, anchor: 'v0-1-0', items: dates.map(item) });
	assert.equal(versionDate(v('对外版，2026-10-17', ['2026-10-16'])), '2026-10-17');
	assert.equal(versionDate(v('自用内测', ['2026-10-13', '2026-10-14', null])), '2026-10-14');
	assert.equal(versionDate(v('', [null])), null);
	assert.equal(dateText('2026-10-07'), '10月7日');
});

test('只有开发者那一版才有的条目：只认开头的几种写法', () => {
	const only = (/** @type {string} */ text) => isDeveloperOnly({ date: null, text });
	assert.ok(only('自用内测版「环境和语气」改标「实验」'));
	assert.ok(only('饭耳 Beta：设置 › 转文字里多了「自建服务」'));
	assert.ok(only('饭耳 Beta 实验：送云端转写前先剪掉静音'));
	assert.ok(only('开发版改成单独的 App「饭耳 Beta」'));
	assert.ok(only('（只在开发者自测的版本里）「给开发者」导出多一份'));
	assert.ok(!only('转文字加第三家：阿里云百炼'));
	assert.ok(!only('点「让手表接着记」时直接告诉你；（只在开发者自测的版本里）会从手机把饭耳叫起来'), '中间才提到的不算');
});
