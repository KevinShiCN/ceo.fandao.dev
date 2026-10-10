import { LINKS } from '../consts';
import { stripBase, withBase } from './url';

export interface NavItem {
	href: string;
	label: string;
	current: boolean;
}

/** 站内导航；current 用于 aria-current 和高亮 */
export function navItems(pathname: string): NavItem[] {
	const path = stripBase(pathname);
	return [
		{ href: withBase('/'), label: '文章', current: path === '/' || path.startsWith('/blog/') },
		{ href: withBase('/about/'), label: '关于', current: path.startsWith('/about') },
		{ href: LINKS.rss.href, label: LINKS.rss.label, current: false },
	];
}
