import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 原发链接含中文路径（旧博客），用 URL 解析判断，不用正则 */
const httpUrl = z.string().refine((value) => {
	try {
		const { protocol } = new URL(value);
		return protocol === 'https:' || protocol === 'http:';
	} catch {
		return false;
	}
}, '必须是 http(s) 链接');

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z
			.object({
				title: z.string().min(1),
				description: z.string(),
				/** 旧文没有发布日期时写 2021-01-01，只用于排序，页面显示 dateLabel */
				pubDate: z.coerce.date(),
				updatedDate: z.coerce.date().optional(),
				heroImage: image().optional(),
				source: z.enum(['old-blog', 'x', 'wechat', 'both', 'site']),
				originalUrl: httpUrl.optional(),
				originalUrls: z.object({ x: httpUrl.optional(), wechat: httpUrl.optional() }).optional(),
				tags: z.array(z.string()).optional(),
				dateUnknown: z.boolean().optional(),
				/** 有它时页面只显示它（如「2021 年」「日期不明」），不显示具体日期 */
				dateLabel: z.string().min(1).optional(),
				/** 同一 pubDate 的旧文按它升序排（原网址里的序号） */
				originalOrder: z.number().optional(),
			})
			.superRefine((data, ctx) => {
				// 原发链接跟 source 对不上就直接报错，不让页面出现「原发于 X」却没有链接
				const need = (ok: unknown, message: string) => {
					if (!ok) ctx.addIssue({ code: 'custom', message });
				};
				if (data.source === 'x' || data.source === 'both') need(data.originalUrls?.x, `source=${data.source} 缺 originalUrls.x`);
				if (data.source === 'wechat' || data.source === 'both')
					need(data.originalUrls?.wechat, `source=${data.source} 缺 originalUrls.wechat`);
				if (data.source === 'old-blog') need(data.originalUrl, 'source=old-blog 缺 originalUrl');
				if (data.dateUnknown) need(data.dateLabel, 'dateUnknown=true 时必须写 dateLabel');
			}),
});

export const collections = { blog };
