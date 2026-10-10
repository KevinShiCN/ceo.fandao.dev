// 本文目录：从渲染好的正文 HTML 里取二、三级小标题。
// 不用 Astro render() 给的 headings：它的文字把小标题里的 <br> 直接删掉，两行粘成一个词
// （群辉 NAS 那篇「内存： 4G<br>DSM 版本」会变成「4GDSM 版本」）。从渲染结果取，目录跟正文显示的一致。

export interface TocItem {
	/** 2 或 3 */
	depth: number;
	/** 小标题的 id，目录链接跳到 #id。id 由 Astro 按标题文字生成，只有字母、数字、汉字和连字符 */
	id: string;
	/** 小标题文字的 HTML：<br> 换成空格，其余标签去掉，字符实体照原样 */
	html: string;
}

const HEADING = /<h([23])\s[^>]*?\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;

export function tocItems(bodyHtml: string): TocItem[] {
	return [...bodyHtml.matchAll(HEADING)].map(([, depth, id, inner]) => ({
		depth: Number(depth),
		id,
		html: inner
			.replace(/<br\s*\/?>/gi, ' ')
			.replace(/<[^>]+>/g, '')
			.replace(/\s+/g, ' ')
			.trim(),
	}));
}
