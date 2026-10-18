#!/usr/bin/env python3
"""饭耳官网「自建服务接口说明」页的逐字比对（只用 Python 标准库）。

用法：
    python3 scripts/check-fanear-asr-doc.py <构建目录> <接口说明.md>

把 Markdown 原文拆成「一级/二级标题、段落、列表项、表格每个格子」一串文字，再从构建出来的
self-hosted-asr/index.html 里按同样的标签依次取出，两串逐项比。有任何一处不同（漏一段、多一段、
被改写）就列出来，退出码 1。
原文里用了这里不认的写法（粗体、链接、三级标题、代码块、嵌套列表等）时直接报错：宁可停下，
也不让页面悄悄少渲染一块。
"""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

TAGS = ('h1', 'h2', 'p', 'li', 'th', 'td')
UNSUPPORTED = re.compile(r'\*|\[|\]\(|<|^#{3,}\s|^```|^\s+[-*]\s|^>|^\d+\.\s')


def squash(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def from_markdown(source: str) -> list[tuple[str, str]]:
    items: list[tuple[str, str]] = []
    for number, raw in enumerate(source.splitlines(), 1):
        line = raw.rstrip()
        if not line:
            continue
        # 行内代码里的 * [ < 不算写法，先去掉再查
        if UNSUPPORTED.search(re.sub(r'`[^`]*`', '', line)):
            sys.exit(f'失败：接口说明第 {number} 行用了检查器不认的写法：{line[:60]}')
        if line.startswith('|'):
            cells = [squash(c.replace('\\|', '|')) for c in re.split(r'(?<!\\)\|', line.strip().strip('|'))]
            if all(re.fullmatch(r':?-{3,}:?', c) for c in cells):
                continue
            kind = 'td' if _in_table(items) else 'th'
            items.extend((kind, c.replace('`', '')) for c in cells)
        elif line.startswith('# '):
            items.append(('h1', line[2:].replace('`', '').strip()))
        elif line.startswith('## '):
            items.append(('h2', line[3:].replace('`', '').strip()))
        elif line.startswith('- '):
            items.append(('li', squash(line[2:]).replace('`', '')))
        else:
            items.append(('p', squash(line).replace('`', '')))
    return items


def _in_table(items: list[tuple[str, str]]) -> bool:
    """上一项是表格格子（th/td）就还在表里；表头行之后的行都是 td。"""
    return bool(items) and items[-1][0] in ('th', 'td')


class DocExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.items: list[tuple[str, str]] = []
        self._in_doc = 0
        self._tag: str | None = None
        self._buf: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == 'article' and 'doc' in (dict(attrs).get('class') or '').split():
            self._in_doc = 1
        elif self._in_doc and tag in TAGS:
            self._tag, self._buf = tag, []

    def handle_endtag(self, tag):
        if self._in_doc and tag == self._tag:
            self.items.append((tag, squash(''.join(self._buf))))
            self._tag = None
        elif tag == 'article' and self._in_doc:
            self._in_doc = 0

    def handle_data(self, data):
        if self._tag:
            self._buf.append(data)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        sys.exit(__doc__)
    dist, doc = Path(argv[0]), Path(argv[1])
    page = dist / 'self-hosted-asr' / 'index.html'
    if not page.is_file():
        sys.exit(f'失败：构建目录里没有 {page}')
    want = from_markdown(doc.read_text(encoding='utf-8'))
    parser = DocExtractor()
    parser.feed(page.read_text(encoding='utf-8'))
    got = parser.items
    bad = [(i, w, g) for i, (w, g) in enumerate(zip(want, got)) if w != g]
    for i, w, g in bad[:10]:
        print(f'  第 {i + 1} 项不同：\n    原文 {w}\n    页面 {g}')
    if len(want) != len(got):
        print(f'  项数不同：原文 {len(want)} 项，页面 {len(got)} 项')
    if bad or len(want) != len(got):
        print('自建服务接口说明页跟原文对不上')
        return 1
    count = lambda kind: sum(1 for k, _ in got if k == kind)
    print(f'自建服务接口说明页跟原文一致：标题 {count("h1") + count("h2")}、段落 {count("p")}、列表项 {count("li")}、表格格子 {count("th") + count("td")}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
