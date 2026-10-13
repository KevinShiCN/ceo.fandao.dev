// 饭耳条款解析器的测试：node --test scripts/fanear-legal.test.mjs
// 解析器在 sites/fanear/src/lib/legal.mjs；格式一变就要报错，不能悄悄少一段。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LegalParseError, parseLegalSwift, versionLine } from '../sites/fanear/src/lib/legal.mjs';

const CONSENT = `public enum LegalTerms {
  /// 条款或隐私说明有实质改动时加一
  public static let version = 2
  public static let updatedOn = "2026-11-01"
}`;

// 跟 LegalTexts.swift 一样的写法，内容缩短
const TEXTS = `import Foundation

// 注释里的 .plain("不算") 不该被数进去
extension LegalTerms {
  public static let points: [ConsentPoint] = [
    ConsentPoint(
      id: "a",
      title: "第一条",
      detail:
        "说明，带「引号」和 \\"转义\\"。"
    ),
    ConsentPoint(id: "b", title: "第二条", detail: "说明二"),
  ]

  public static let healthOption = ConsentPoint(
    id: "share-health", title: "（可选）健康", detail: "可选说明")

  public static let buttonNotice = "点按钮即同意。"
  public static let agreementLine = "我已年满 18 周岁"

  public static let terms = LegalDocument(
    id: "terms", title: "使用条款",
    sections: [
      LegalSection(
        "一、谁",
        [
          .plain("普通段。"),
          .notice(
            "加粗段。"
          ),
        ]),
      LegalSection("二、别的", [.plain("只有一段")]),
    ])

  public static let privacy = LegalDocument(
    id: "privacy", title: "隐私说明",
    sections: [
      LegalSection("一、结论", [.notice("没有服务器。")])
    ])
}`;

test('正常写法：须知、两份条款、版本号都取对，段落顺序和加粗都保留', () => {
	const legal = parseLegalSwift(TEXTS, CONSENT);
	assert.equal(legal.version, 2);
	assert.equal(legal.updatedOn, '2026-11-01');
	assert.equal(versionLine(legal), '第 2 版 · 更新于 2026-11-01');
	assert.deepEqual(legal.consent.points, [
		{ id: 'a', title: '第一条', detail: '说明，带「引号」和 "转义"。' },
		{ id: 'b', title: '第二条', detail: '说明二' },
	]);
	assert.equal(legal.consent.healthOption.id, 'share-health');
	assert.equal(legal.consent.buttonNotice, '点按钮即同意。');
	assert.equal(legal.consent.agreementLine, '我已年满 18 周岁');
	assert.deepEqual(legal.terms.sections, [
		{
			heading: '一、谁',
			paragraphs: [
				{ text: '普通段。', notice: false },
				{ text: '加粗段。', notice: true },
			],
		},
		{ heading: '二、别的', paragraphs: [{ text: '只有一段', notice: false }] },
	]);
	assert.deepEqual(legal.privacy.sections, [{ heading: '一、结论', paragraphs: [{ text: '没有服务器。', notice: true }] }]);
});

const broken = (from, to) => {
	assert.ok(TEXTS.includes(from), `测试写错了：原文里没有 ${from}`);
	return TEXTS.replace(from, to);
};

test('格式变了一律报错，不悄悄少一段', async (t) => {
	const cases = [
		['用 + 拼字符串', '.plain("普通段。")', '.plain("普通" + "段。")'],
		['字符串插值', '"只有一段"', '"只有\\(n)段"'],
		['多行字符串', '"没有服务器。"', '"""\n没有服务器。\n"""'],
		['新的段落类型', '.plain("只有一段")', '.warning("只有一段")'],
		['段落用变量', '.plain("只有一段")', '.plain(someText)'],
		['节标题用变量', 'LegalSection("二、别的"', 'LegalSection(heading2'],
		['多了一个 static let', 'public static let agreementLine', 'public static let extraLine = "新内容"\n  public static let agreementLine'],
		['少了隐私说明', 'public static let privacy = LegalDocument(', 'public static let privacyDoc = LegalDocument('],
		['参数标签变了', 'ConsentPoint(id: "b", title:', 'ConsentPoint(id: "b", heading:'],
		['段落数组空了', 'LegalSection("二、别的", [.plain("只有一段")])', 'LegalSection("二、别的", [])'],
		['id 重复', 'ConsentPoint(id: "b"', 'ConsentPoint(id: "a"'],
	];
	for (const [name, from, to] of cases) {
		await t.test(name, () => assert.throws(() => parseLegalSwift(broken(from, to), CONSENT), LegalParseError));
	}
});

test('版本号缺了、写了两次或不是数字都报错', () => {
	assert.throws(() => parseLegalSwift(TEXTS, CONSENT.replace('public static let version = 2\n', '')), LegalParseError);
	assert.throws(
		() => parseLegalSwift(TEXTS, CONSENT.replace('public static let version = 2', 'public static let version = 2\n  public static let version = 3')),
		LegalParseError,
	);
	assert.throws(() => parseLegalSwift(TEXTS, CONSENT.replace('= 2', '= current')), LegalParseError);
	assert.throws(() => parseLegalSwift(TEXTS, 'enum Other {}'), LegalParseError);
});
