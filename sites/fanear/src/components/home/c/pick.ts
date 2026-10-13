// 第 C 版首页从功能清单里取一项、取其中一句。按 id 和关键词找，找不到就构建报错，
// 免得功能清单改了以后首页悄悄配错句子。
import { FEATURES, type Feature } from '../../../lib/features';

export function feature(id: string): Feature {
	const found = FEATURES.find((f) => f.id === id);
	if (!found) throw new Error(`首页 C 版要的功能「${id}」不在 src/lib/features.ts 里`);
	return found;
}

/** 这一项里含 keyword 的那一句 */
export function point(f: Feature, keyword: string): string {
	const found = f.points.find((p) => p.includes(keyword));
	if (!found) throw new Error(`功能「${f.id}」里找不到含「${keyword}」的那一句`);
	return found;
}
