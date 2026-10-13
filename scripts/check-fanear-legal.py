#!/usr/bin/env python3
"""饭耳官网条款两页的逐字比对（只用 Python 标准库）。

用法：
    python3 scripts/check-fanear-legal.py <构建目录> <legal.json> [--swift <fanear 仓库>/Sources/FanEarCore]

1. 从构建出来的 terms/index.html、privacy/index.html 里按 data-legal-* 标记逐段取出文字，
   跟 legal.json 逐段比：节标题、每段文字、是否加粗提示（notice）、使用前须知每条、版本行。
2. 给了 --swift 时，再用一套独立的写法（正则，不复用 legal.mjs 的解析器）直接从 LegalTexts.swift、
   Consent.swift 取原文，跟 legal.json 比一遍：防止解析器自己出错、两边一起错。
有任何一处不同就列出来，退出码 1。
"""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class LegalExtractor(HTMLParser):
    """按 data-legal-* 标记取文字；visually-hidden 里的「重点提示：」是读屏用的，不算原文。"""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.docs: dict[str, list[dict]] = {}
        self.points: list[dict] = []
        self.button_notice: str | None = None
        self.text = ''
        self._doc: str | None = None
        self._capture: tuple[str, ...] | None = None
        self._buf: list[str] = []
        self._depth = 0
        self._hidden_depth: int | None = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self._depth += 1
        if 'visually-hidden' in (a.get('class') or '').split() and self._capture:
            self._hidden_depth = self._depth
        if 'data-legal-doc' in a:
            self._doc = a['data-legal-doc']
            self.docs[self._doc] = []
        elif 'data-legal-heading' in a:
            self._start(('heading',))
        elif 'data-legal-para' in a:
            self._start(('para', a['data-legal-para']))
        elif 'data-legal-point' in a:
            self.points.append({'id': a['data-legal-point']})
        elif 'data-legal-field' in a:
            self._start(('field', a['data-legal-field']))

    def _start(self, what):
        self._capture = what
        self._buf = []
        self._capture_depth = self._depth

    def handle_endtag(self, tag):
        if self._hidden_depth == self._depth:
            self._hidden_depth = None
        if self._capture and self._depth == self._capture_depth:
            text = ''.join(self._buf).strip()
            kind = self._capture
            if kind[0] == 'heading':
                self.docs[self._doc].append({'heading': text, 'paragraphs': []})
            elif kind[0] == 'para':
                self.docs[self._doc][-1]['paragraphs'].append({'text': text, 'notice': kind[1] == 'notice'})
            elif kind[1] == 'buttonNotice':
                self.button_notice = text
            else:
                self.points[-1][kind[1]] = text
            self._capture = None
        self._depth -= 1

    def handle_data(self, data):
        self.text += data
        if self._capture and self._hidden_depth is None:
            self._buf.append(data)


def swift_strings(s: str) -> str:
    if '\\(' in s:
        raise ValueError('字符串里有插值')
    return re.sub(r'\\(.)', lambda m: {'n': '\n', 't': '\t'}.get(m.group(1), m.group(1)), s)


STR = r'"((?:[^"\\\n]|\\.)*)"'


def from_swift(folder: Path) -> dict:
    """独立于 legal.mjs 的第二套取法：正则直接扫 Swift 源码。"""
    src = (folder / 'LegalTexts.swift').read_text(encoding='utf-8')
    consent = (folder / 'Consent.swift').read_text(encoding='utf-8')
    points = [
        {'id': swift_strings(i), 'title': swift_strings(t), 'detail': swift_strings(d)}
        for i, t, d in re.findall(rf'ConsentPoint\(\s*id:\s*{STR},\s*title:\s*{STR},\s*detail:\s*{STR}\s*\)', src)
    ]

    def doc(name: str) -> dict:
        start = src.index(f'static let {name} = LegalDocument(')
        nxt = src.find('static let ', start + 10)
        body = src[start : nxt if nxt > 0 else len(src)]
        doc_id, title = re.search(rf'LegalDocument\(\s*id:\s*{STR},\s*title:\s*{STR}', body).groups()
        sections = []
        for m in re.finditer(rf'LegalSection\(\s*{STR},\s*\[', body):
            sections.append({'heading': swift_strings(m.group(1)), 'start': m.end()})
        for i, section in enumerate(sections):
            end = sections[i + 1]['start'] if i + 1 < len(sections) else len(body)
            chunk = body[section.pop('start') : end]
            section['paragraphs'] = [
                {'text': swift_strings(t), 'notice': k == 'notice'} for k, t in re.findall(rf'\.(plain|notice)\(\s*{STR}\s*\)', chunk)
            ]
        return {'id': swift_strings(doc_id), 'title': swift_strings(title), 'sections': sections}

    return {
        'version': int(re.search(r'public static let version = (\d+)', consent).group(1)),
        'updatedOn': re.search(r'public static let updatedOn = "([^"]+)"', consent).group(1),
        'consent': {
            'points': [p for p in points if p['id'] != 'share-health'],
            'healthOption': next(p for p in points if p['id'] == 'share-health'),
            'agreementLine': swift_strings(re.search(rf'agreementLine = {STR}', src).group(1)),
            'buttonNotice': swift_strings(re.search(rf'buttonNotice = {STR}', src).group(1)),
        },
        'terms': doc('terms'),
        'privacy': doc('privacy'),
    }


def compare(name: str, want, got, problems: list[str]) -> None:
    if want != got:
        problems.append(f'{name}：\n    应该是 {json.dumps(want, ensure_ascii=False)[:300]}\n    实际是 {json.dumps(got, ensure_ascii=False)[:300]}')


def check_page(dist: Path, legal: dict, doc_id: str, problems: list[str]) -> int:
    page = dist / doc_id / 'index.html'
    parser = LegalExtractor()
    parser.feed(page.read_text(encoding='utf-8'))
    doc = legal[doc_id]
    got = parser.docs.get(doc_id)
    if got is None:
        problems.append(f'{page}：没找到 data-legal-doc="{doc_id}"')
        return 0
    compare(f'{doc_id} 节数', len(doc['sections']), len(got), problems)
    for i, (want_s, got_s) in enumerate(zip(doc['sections'], got), 1):
        compare(f'{doc_id} 第 {i} 节标题', want_s['heading'], got_s['heading'], problems)
        compare(f'{doc_id} 第 {i} 节段数', len(want_s['paragraphs']), len(got_s['paragraphs']), problems)
        for k, (wp, gp) in enumerate(zip(want_s['paragraphs'], got_s['paragraphs']), 1):
            compare(f'{doc_id} 第 {i} 节第 {k} 段', wp, gp, problems)
    line = f'第 {legal["version"]} 版 · 更新于 {legal["updatedOn"]}'
    if line not in parser.text:
        problems.append(f'{doc_id}：页面上没有版本行「{line}」')
    if doc_id == 'terms':
        c = legal['consent']
        want_points = [*c['points'], c['healthOption'], {'id': 'agreement', 'title': c['agreementLine']}]
        compare('使用前须知', want_points, parser.points, problems)
        compare('按钮旁那句', c['buttonNotice'], parser.button_notice, problems)
    return sum(len(s['paragraphs']) for s in got)


def main() -> int:
    args = sys.argv[1:]
    swift = None
    if '--swift' in args:
        i = args.index('--swift')
        swift = Path(args[i + 1])
        del args[i : i + 2]
    if len(args) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    dist, legal_path = Path(args[0]), Path(args[1])
    legal = json.loads(legal_path.read_text(encoding='utf-8'))
    problems: list[str] = []
    if swift is not None:
        compare('legal.json 跟 Swift 原文（独立正则取法）', from_swift(swift), legal, problems)
    counts = {doc_id: check_page(dist, legal, doc_id, problems) for doc_id in ('terms', 'privacy')}
    if problems:
        print('条款比对：有不一致，需要处理')
        for p in problems:
            print(f'  - {p}')
        return 1
    print(
        f'条款比对：一致。第 {legal["version"]} 版；/terms/ {counts["terms"]} 段 + 须知 {len(legal["consent"]["points"]) + 2} 条，'
        f'/privacy/ {counts["privacy"]} 段，每段文字和加粗提示都跟 legal.json 一样'
        + ('；legal.json 跟 Swift 原文也一样' if swift else '')
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
