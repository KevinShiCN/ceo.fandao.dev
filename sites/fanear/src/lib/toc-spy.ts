// 页内目录共用的几件事：读到哪一节、滚动时什么时候重算、手机上点开的目录怎么收起。
// 使用说明的步骤目录（components/Toc.astro）和更新记录的版本目录（components/VersionToc.astro）都用这里。

/** 屏幕从上往下 30% 那条线落在哪一节里，就算读到哪一节 */
const READ_LINE = 0.3;

export interface ReadingPosition {
	/** 读到第几节（从 0 数）；-1 是还没到第一节 */
	at: number;
	/** 这一节读了多少，0 到 1 */
	part: number;
}

/** 读到哪一节、这一节读了多少；滚到页底算全部读完 */
export function readingPosition(sections: readonly HTMLElement[]): ReadingPosition {
	const line = window.innerHeight * READ_LINE;
	let at = -1;
	let part = 0;
	sections.forEach((section, i) => {
		const box = section.getBoundingClientRect();
		if (box.top <= line) {
			at = i;
			part = Math.min(1, (line - box.top) / box.height);
		}
	});
	if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
		at = sections.length - 1;
		part = 1;
	}
	return { at, part };
}

/** 先算一次；之后滚动、改窗口大小、页面加载完时在下一帧重算，同一帧最多算一次 */
export function trackScroll(update: () => void): void {
	let queued = false;
	const schedule = () => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(() => {
			queued = false;
			update();
		});
	};
	window.addEventListener('scroll', schedule, { passive: true });
	window.addEventListener('resize', schedule);
	window.addEventListener('load', schedule);
	update();
}

/** 手机上点开的目录：点了哪一项就收起来；按 Esc、点目录外面也收起来 */
export function closeOnPick(bar: HTMLDetailsElement): void {
	bar.addEventListener('click', (event) => {
		if ((event.target as Element).closest('a')) bar.open = false;
	});
	bar.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape' || !bar.open) return;
		bar.open = false;
		bar.querySelector('summary')?.focus();
	});
	document.addEventListener('click', (event) => {
		if (bar.open && !bar.contains(event.target as Node)) bar.open = false;
	});
}
