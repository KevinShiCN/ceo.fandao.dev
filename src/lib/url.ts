// 站内地址统一从这里拼。正式站部署在根路径 /；预览构建会放在别的网站的子路径下（SITE_BASE），
// 所有站内链接和 public/ 下的文件都要带上这个前缀才打得开。图片、CSS、JS 由 Astro 自己加前缀。

/** 不带末尾斜杠的前缀：根路径部署时是空字符串 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** 站内路径加上部署前缀。path 必须以 / 开头，如 withBase('/about/') */
export function withBase(path: `/${string}`): string {
	return `${BASE}${path}`;
}

/** 当前页面去掉部署前缀后的路径，用于判断导航高亮 */
export function stripBase(pathname: string): string {
	if (!BASE) return pathname;
	if (pathname === BASE) return '/';
	return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname;
}
