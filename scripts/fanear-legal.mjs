// 从饭耳 App 的条款源文件生成官网用的 sites/fanear/src/data/legal.json。
// 同步命令（scripts/fanear-publish.sh 第 2 步）调它；手动也能跑：
//   node scripts/fanear-legal.mjs <fanear 仓库>/Sources/FanEarCore [输出路径]
// 读该目录下的 LegalTexts.swift（正文）和 Consent.swift（版本号、更新日期）。格式看不懂就报错退出、不写文件。
// 输出固定格式（两格缩进、末尾换行），原文没变时再跑一次不会有差异。
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LegalParseError, parseLegalSwift } from '../sites/fanear/src/lib/legal.mjs';

const [dir, out = 'sites/fanear/src/data/legal.json'] = process.argv.slice(2);
if (!dir) {
	console.error('用法：node scripts/fanear-legal.mjs <fanear 仓库>/Sources/FanEarCore [输出路径]');
	process.exit(2);
}

try {
	const legal = parseLegalSwift(
		readFileSync(join(dir, 'LegalTexts.swift'), 'utf8'),
		readFileSync(join(dir, 'Consent.swift'), 'utf8'),
	);
	writeFileSync(out, `${JSON.stringify(legal, null, 2)}\n`);
	const paras = (doc) => doc.sections.reduce((n, s) => n + s.paragraphs.length, 0);
	console.log(
		`条款第 ${legal.version} 版（${legal.updatedOn}）：须知 ${legal.consent.points.length} 条 + 1 条可选；` +
			`${legal.terms.title} ${legal.terms.sections.length} 节 ${paras(legal.terms)} 段；` +
			`${legal.privacy.title} ${legal.privacy.sections.length} 节 ${paras(legal.privacy)} 段 → ${out}`,
	);
} catch (error) {
	if (error instanceof LegalParseError || error.code === 'ENOENT') {
		console.error(`失败：条款解析不了，不生成。${error.message}`);
		process.exit(1);
	}
	throw error;
}
