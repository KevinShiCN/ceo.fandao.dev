#!/usr/bin/env python3
"""正文一字不差检查（只用 Python 标准库）。

把 src/content/blog 每篇 Markdown 的正文，和构建出来的文章页正文逐字对比，抓渲染过程改掉的字：
智能标点把 "引号" 换成弯引号、--- 换成破折号，HTML 标签吞字，Markdown 语法写坏吃掉文字等。

对比方法：两边都去掉 ASCII 标点和空白（这些多半是 Markdown 语法本身），剩下的文字、数字、
中文标点、全角符号必须完全一样。图片说明（alt）不在正文里，不比；代码块照原样比。
页面上加的「复制」按钮不算正文，不比。

用法：
    python3 scripts/check-text.py dist
"""

from __future__ import annotations

import html
import re
import string
import sys
from html.parser import HTMLParser
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent.parent / 'src/content/blog'
DROP = set(string.punctuation) | set(string.whitespace)
SKIP_CLASSES = {'code-head'}
FENCE = re.compile(r'^\s*(`{3,}|~{3,})')
CODE_SPAN = re.compile(r'(`+)(.+?)\1', re.S)


def normalize(text: str) -> str:
    return ''.join(ch for ch in text if ch not in DROP)


def visible_inline(line: str) -> str:
    """一行 Markdown（代码块以外）里读者看得到的字"""
    spans: list[str] = []

    def keep_code(match: re.Match) -> str:
        spans.append(match.group(2))
        return f'\x00{len(spans) - 1}\x00'

    line = CODE_SPAN.sub(keep_code, line)
    line = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', line)  # 图片：alt 不算正文
    line = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', line)  # 链接只留文字
    line = re.sub(r'<((?:https?|mailto):[^>\s]+)>', r'\1', line)  # 尖括号自动链接显示地址本身
    line = re.sub(r'</?[A-Za-z][^>]*>', '', line)  # 行内 HTML 标签
    line = re.sub(r'^\s*(?:[-*+]|\d+[.)])\s+', '', line)  # 列表符号和序号
    line = html.unescape(line)
    return re.sub(r'\x00(\d+)\x00', lambda m: spans[int(m.group(1))], line)


def source_text(md: str) -> str:
    match = re.match(r'^---\n.*?\n---\n', md, re.S)
    body = md[match.end():] if match else md
    out: list[str] = []
    fence: str | None = None
    for line in body.split('\n'):
        marker = FENCE.match(line)
        if marker:
            if fence is None:
                fence = marker.group(1)
                continue
            if marker.group(1)[0] == fence[0] and len(marker.group(1)) >= len(fence):
                fence = None
                continue
        out.append(line if fence else visible_inline(line))
    return '\n'.join(out)


class ProseText(HTMLParser):
    """取 <div class="prose"> 里的文字，跳过按钮、提示、脚本"""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.depth = 0  # 在 .prose 里的元素层数
        self.skip = 0  # 在要跳过的子树里的层数
        self.parts: list[str] = []

    VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'col', 'embed', 'track'}

    def handle_starttag(self, tag, attrs):
        classes = set((dict(attrs).get('class') or '').split())
        if self.depth == 0:
            if tag == 'div' and 'prose' in classes:
                self.depth = 1
            return
        if tag in self.VOID:
            return
        self.depth += 1
        if self.skip:
            self.skip += 1
        elif classes & SKIP_CLASSES or tag in ('script', 'style', 'button'):
            self.skip = 1

    def handle_endtag(self, tag):
        if self.depth == 0 or tag in self.VOID:
            return
        self.depth -= 1
        if self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if self.depth and not self.skip:
            self.parts.append(data)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    out_dir = Path(sys.argv[1])
    problems = 0
    files = sorted(CONTENT_DIR.glob('*.md'))
    for md_file in files:
        page = out_dir / 'blog' / md_file.stem / 'index.html'
        if not page.is_file():
            print(f'  缺页面 {page}')
            problems += 1
            continue
        want = normalize(source_text(md_file.read_text(encoding='utf-8')))
        parser = ProseText()
        parser.feed(page.read_text(encoding='utf-8'))
        got = normalize(''.join(parser.parts))
        if want == got:
            print(f'  一致 {md_file.stem}（{len(want)} 字）')
            continue
        problems += 1
        i = 0
        while i < min(len(want), len(got)) and want[i] == got[i]:
            i += 1
        print(f'  不一致 {md_file.stem}：第 {i} 字起 原文「{want[max(0, i - 15):i + 25]}」 页面「{got[max(0, i - 15):i + 25]}」')
    print(f'[check-text] {len(files)} 篇，不一致 {problems}')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
