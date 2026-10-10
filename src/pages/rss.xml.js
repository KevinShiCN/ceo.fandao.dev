import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getSortedPosts, postHref } from '../lib/posts';

export async function GET(context) {
	const posts = await getSortedPosts();
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		// 频道链接指向站点首页；部署在子路径下时要带上前缀。文章链接已由 postHref 带好前缀
		site: new URL(import.meta.env.BASE_URL, context.site),
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			link: postHref(post),
			// 旧文的 pubDate 只用于排序（原网页没有日期），不写进订阅，免得阅读器显示一个假日期
			pubDate: post.data.dateLabel ? undefined : post.data.pubDate,
		})),
		customData: '<language>zh-CN</language>',
	});
}
