import { type CollectionEntry, getCollection } from 'astro:content';
import { withBase } from './url';

export type Post = CollectionEntry<'blog'>;

export interface PostGroup {
	/** 年份（「2026」）或无法归年的标签（「日期不明」） */
	label: string;
	posts: Post[];
}

export interface SourceLink {
	label: string;
	href: string;
}

export interface SourceInfo {
	/** 列表里的短标签，如 ['X', '公众号'] */
	platforms: string[];
	/** 文章页的一句话，如「原发于 X 和公众号」 */
	summary: string;
	/** 原文链接；旧博客已关站，没有链接 */
	links: SourceLink[];
}

const YEAR_LABEL = /^(\d{4})\s*年$/;

/** 新的在前；同一天的旧文按原网址序号，再按文件名，保证每次构建顺序一致 */
function comparePosts(a: Post, b: Post): number {
	const byDate = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
	if (byDate !== 0) return byDate;
	const orderA = a.data.originalOrder ?? Number.POSITIVE_INFINITY;
	const orderB = b.data.originalOrder ?? Number.POSITIVE_INFINITY;
	if (orderA !== orderB) return orderA < orderB ? -1 : 1;
	return a.id.localeCompare(b.id);
}

export async function getSortedPosts(): Promise<Post[]> {
	const posts = await getCollection('blog');
	return posts.sort(comparePosts);
}

/** 文章归到哪一组：有 dateLabel 用它（「2021 年」归 2021），否则用发布年份 */
export function groupLabelOf(post: Post): string {
	const { dateLabel, pubDate } = post.data;
	if (dateLabel) {
		const match = YEAR_LABEL.exec(dateLabel.trim());
		return match ? match[1] : dateLabel.trim();
	}
	return String(pubDate.getUTCFullYear());
}

export function groupPosts(posts: Post[]): PostGroup[] {
	const groups = new Map<string, Post[]>();
	for (const post of posts) {
		const label = groupLabelOf(post);
		groups.set(label, [...(groups.get(label) ?? []), post]);
	}
	return [...groups].map(([label, items]) => ({ label, posts: items }));
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 列表里的日期：组名已写明年份，只显示月日。有 dateLabel 的文章，组名就是它（年份或「日期不明」），不再重复 */
export function listDateText(post: Post): string | null {
	const { dateLabel, pubDate } = post.data;
	if (dateLabel) return null;
	return `${pubDate.getUTCMonth() + 1}月${pubDate.getUTCDate()}日`;
}

/** 文章页的完整日期；有 dateLabel 时只显示它 */
export function fullDateText(post: Post): string {
	const { dateLabel, pubDate } = post.data;
	if (dateLabel) return dateLabel;
	return `${pubDate.getUTCFullYear()}年${pubDate.getUTCMonth() + 1}月${pubDate.getUTCDate()}日`;
}

/** <time datetime> 用；日期不可信（有 dateLabel）时不输出 */
export function isoDate(post: Post): string | null {
	if (post.data.dateLabel) return null;
	const d = post.data.pubDate;
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function updatedText(post: Post): string | null {
	const d = post.data.updatedDate;
	return d ? `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日` : null;
}

/** 原发信息。schema 已保证链接齐全，这里不再兜底 */
export function sourceInfo(post: Post): SourceInfo | null {
	const { source, originalUrls } = post.data;
	switch (source) {
		case 'x':
			return { platforms: ['X'], summary: '原发于 X', links: [{ label: 'X 原文', href: originalUrls!.x! }] };
		case 'wechat':
			return {
				platforms: ['公众号'],
				summary: '原发于公众号',
				links: [{ label: '公众号原文', href: originalUrls!.wechat! }],
			};
		case 'both':
			return {
				platforms: ['X', '公众号'],
				summary: '原发于 X 和公众号',
				links: [
					{ label: 'X 原文', href: originalUrls!.x! },
					{ label: '公众号原文', href: originalUrls!.wechat! },
				],
			};
		case 'old-blog':
			// 旧博客 10-10 已关站，不再链过去；front matter 的 originalUrl 只留作出处记录，不显示。
			// 搬过来的旧文都是 2021 年写的。
			return { platforms: ['旧博客'], summary: '原载于 2021 年的旧博客（已关闭）', links: [] };
		case 'site':
			return null;
	}
}

export const postHref = (post: Post) => withBase(`/blog/${post.id}/`);
