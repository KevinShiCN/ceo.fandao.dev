#!/usr/bin/env python3
"""构建产物检查（只用 Python 标准库）。

1. 站内链接和资源：HTML / CSS / SVG / RSS / sitemap / JS 里每个站内地址，都要对得上输出目录里的真实文件。
2. 外站资源：页面不许从别的网站加载任何东西（图片、脚本、样式、字体、iframe 等）。
   外站超链接（<a href>，包括脚本里拼出来的 <a href>）不算，只单独计数。
3. 站内搜索 Pagefind 自带的脚本（构建时生成在 pagefind/）照样逐个检查，其中几处字符串读过上下文、确认不下载东西，
   在 PAGEFIND_CHECKED 里逐条写明原因后放行，其余照常算外站资源或坏链。

用法：
    python3 scripts/check-build.py dist
    SITE_URL=https://example.com SITE_BASE=/some/path/ python3 scripts/check-build.py <预览输出目录>

站点和前缀读同一组环境变量 SITE_URL / SITE_BASE，默认值和 astro.config.mjs 一致。
有坏链、外站资源或说不清用途的脚本外链时，退出码为 1。
"""

from __future__ import annotations

import os
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

SITE_URL = os.environ.get('SITE_URL', 'https://ceo.fandao.dev')
SITE_BASE = os.environ.get('SITE_BASE', '/')
SITE = urlsplit(SITE_URL)
ORIGIN = f'{SITE.scheme}://{SITE.netloc}'

# 会让浏览器去下载东西的属性
RESOURCE_ATTRS = {
    'img': ('src', 'srcset'),
    'source': ('src', 'srcset'),
    'script': ('src',),
    'iframe': ('src',),
    'frame': ('src',),
    'video': ('src', 'poster'),
    'audio': ('src',),
    'track': ('src',),
    'embed': ('src',),
    'object': ('data',),
    'input': ('src',),
    'image': ('href', 'xlink:href'),
    'use': ('href', 'xlink:href'),
    'feimage': ('href', 'xlink:href'),
}
# <link rel> 里会触发下载或连接的类型（题目要求的 stylesheet / preload / icon，外加同类）
RESOURCE_RELS = {
    'stylesheet', 'preload', 'modulepreload', 'icon', 'shortcut', 'apple-touch-icon',
    'apple-touch-icon-precomposed', 'mask-icon', 'manifest', 'prefetch', 'preconnect', 'dns-prefetch',
}
NAV_ATTRS = {'a': ('href',), 'area': ('href',), 'form': ('action',)}
META_URL_KEYS = {'og:image', 'og:url', 'twitter:image', 'og:image:url', 'og:image:secure_url'}
SKIP_SCHEMES = ('mailto:', 'tel:', 'javascript:', 'data:', 'blob:', 'about:')

CSS_URL = re.compile(r'url\(\s*([\'"]?)(.*?)\1\s*\)', re.S)
# @import url(...) 已由 CSS_URL 覆盖，这里只抓 @import "..." 的写法
CSS_IMPORT = re.compile(r'@import\s+([\'"])(.*?)\1', re.I)
JS_HTTP = re.compile(r'https?://[^\s\'"`<>()\\]+')
JS_LOCAL_REF = re.compile(r'[\'"`](\.{0,2}/[^\'"`\s]+?\.(?:m?js|css|json|webp|png|jpe?g|gif|svg|avif|woff2?|ttf|xml))[\'"`]')
SVG_HREF = re.compile(r'\s(?:xlink:)?href\s*=\s*([\'"])(.*?)\1', re.S)
XML_URL = re.compile(r'<(?:link|loc|guid|url)\b[^>]*>\s*([^<\s]+)\s*</', re.I)

# Pagefind 1.5.2 的 pagefind.js 和 pagefind-worker.js 里，被上面的规则当成外站地址或站内文件的字符串。
# 2026-10-10 逐个读了上下文，都不会让浏览器去下载东西，所以放行；只认这两个文件里的这几个原样字符串。
# Pagefind 升级后字符串一变，就会重新报出来，再逐个看。
PAGEFIND_SCRIPTS = ('pagefind/pagefind.js', 'pagefind/pagefind-worker.js')
PAGEFIND_CHECKED = {
    'https://example.com${anchored_url}': (
        '拼结果里小标题的锚点：把站内路径接在假域名后面交给 new URL() 设 hash，'
        '紧接着 .replace(/^https:\\/\\/example.com/, "") 去掉假域名，不发请求'
    ),
    'https://example.com${normalized}': (
        '给结果地址加高亮参数（highlightParam，本站没开）时同样借假域名解析，'
        '紧接着 .replace(/^https:\\/\\/example\\.com/, "") 去掉，不发请求'
    ),
    './pagefind_web_bg.js': 'wasm-bindgen 生成的 WebAssembly 导入对象的键名（模块名），不是文件地址，不下载',
}


def doc_url(out_dir: Path, file: Path) -> str:
    """文件在站点上的地址：.../index.html 按目录地址算（和静态服务器一致）"""
    rel = file.relative_to(out_dir).as_posix()
    if rel == 'index.html':
        rel = ''
    elif rel.endswith('/index.html'):
        rel = rel[: -len('index.html')]
    return f'{ORIGIN}{SITE_BASE}{rel}'


def parse_srcset(value: str) -> list[str]:
    return [part.strip().split()[0] for part in value.split(',') if part.strip()]


class Report:
    def __init__(self) -> None:
        self.internal: list[tuple[str, str, str]] = []  # (来源文件, 原地址, 结果)
        self.broken: list[tuple[str, str, str]] = []
        self.external_resources: list[tuple[str, str, str]] = []
        self.external_links: list[tuple[str, str]] = []
        self.js_urls: list[tuple[str, str, str]] = []  # (文件, 地址, 分类)
        self.checked: list[tuple[str, str]] = []  # (文件, 字符串)：Pagefind 脚本里逐条核对过、放行的


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[str, str, str]] = []  # (种类 resource/nav/link-other/meta, 标签, 地址)
        self.styles: list[str] = []
        self.scripts: list[tuple[str, str]] = []  # (type, 内容)
        self._in: str | None = None
        self._script_type = ''
        self._buf: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = {k: (v or '') for k, v in attrs}
        for attr in RESOURCE_ATTRS.get(tag, ()):
            if attr in a:
                urls = parse_srcset(a[attr]) if attr == 'srcset' else [a[attr]]
                self.refs += [('resource', f'{tag}[{attr}]', u) for u in urls]
        for attr in NAV_ATTRS.get(tag, ()):
            if attr in a:
                self.refs.append(('nav', f'{tag}[{attr}]', a[attr]))
        if tag == 'link' and 'href' in a:
            rels = set(a.get('rel', '').lower().split())
            kind = 'resource' if rels & RESOURCE_RELS else 'link-other'
            self.refs.append((kind, f'link[rel={a.get("rel", "")}]', a['href']))
            if 'imagesrcset' in a:
                self.refs += [('resource', 'link[imagesrcset]', u) for u in parse_srcset(a['imagesrcset'])]
        if tag == 'meta':
            key = (a.get('property') or a.get('name') or '').lower()
            if key in META_URL_KEYS and a.get('content'):
                self.refs.append(('meta', f'meta[{key}]', a['content']))
        if 'style' in a:
            self.styles.append(a['style'])
        if tag in ('script', 'style'):
            self._in = tag
            self._script_type = a.get('type', '').lower()
            self._buf = []

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag in ('script', 'style'):
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if self._in and tag == self._in:
            text = ''.join(self._buf)
            if tag == 'style':
                self.styles.append(text)
            else:
                self.scripts.append((self._script_type, text))
            self._in = None

    def handle_data(self, data):
        if self._in:
            self._buf.append(data)


def check_ref(report: Report, out_dir: Path, source: str, base_url: str, ref: str, kind: str) -> None:
    ref = ref.strip()
    if not ref or ref.startswith('#') or ref.lower().startswith(SKIP_SCHEMES):
        return
    absolute = urljoin(base_url, ref)
    parts = urlsplit(absolute)
    if parts.scheme not in ('http', 'https'):
        return
    if parts.netloc != SITE.netloc:
        if kind == 'resource':
            report.external_resources.append((source, kind, ref))
        elif kind == 'nav':
            report.external_links.append((source, ref))
        return
    path = parts.path
    if not (path + '/').startswith(SITE_BASE):
        report.broken.append((source, ref, f'不在部署前缀 {SITE_BASE} 下'))
        return
    rel = unquote(path[len(SITE_BASE):]) if len(path) >= len(SITE_BASE) else ''
    target = out_dir / rel
    if rel == '' or rel.endswith('/'):
        target = target / 'index.html'
    if target.is_file():
        report.internal.append((source, ref, 'ok'))
    elif (target / 'index.html').is_file():
        report.broken.append((source, ref, '指向目录但缺末尾斜杠'))
    else:
        report.broken.append((source, ref, f'找不到文件 {target.relative_to(out_dir)}'))


def check_css(report: Report, out_dir: Path, source: str, base_url: str, css: str) -> None:
    for _, url in CSS_URL.findall(css):
        check_ref(report, out_dir, source, base_url, url, 'resource')
    for _, url in CSS_IMPORT.findall(css):
        check_ref(report, out_dir, source, base_url, url, 'resource')


def pagefind_checked(report: Report, source: str, text: str) -> bool:
    """Pagefind 脚本里核对过的字符串：记下来，不再按地址检查"""
    if source in PAGEFIND_SCRIPTS and text in PAGEFIND_CHECKED:
        report.checked.append((source, text))
        return True
    return False


def classify_js_urls(report: Report, source: str, scripts: list[tuple[str, str]]) -> None:
    """脚本里的 http(s)：只有拼成 <a href> 的才算外站超链接，其余一律记为外站资源。"""
    code = '\n'.join(text for kind, text in scripts if kind != 'application/json')
    for kind, text in scripts:
        if kind == 'application/json':
            # 数据块不执行；字段里的地址要看脚本怎么用：只被当作 href 用才算超链接
            for match in JS_HTTP.finditer(text):
                key = json_key_of(text, match.start())
                as_href = bool(key) and re.search(rf'href\s*[:=]\s*[\w.$\[\]\'"]*\b{re.escape(key)}\b', code)
                label = f'JSON 数据字段 {key}，脚本里作 <a href>' if as_href else f'JSON 数据字段 {key}，用途不明'
                report.js_urls.append((source, match.group(), label))
            continue
        for match in JS_HTTP.finditer(text):
            if pagefind_checked(report, source, match.group()):
                continue
            before = text[max(0, match.start() - 40) : match.start()]
            as_href = re.search(r'href\s*[:=]\s*[\'"`]?$', before)
            report.js_urls.append((source, match.group(), '脚本拼 <a href>' if as_href else '用途不明'))


def json_key_of(text: str, pos: int) -> str | None:
    match = re.search(r'"([\w$-]+)"\s*:\s*"$', text[max(0, pos - 80) : pos])
    return match.group(1) if match else None


def check_js_local_refs(report: Report, out_dir: Path, source: str, base_url: str, code: str) -> None:
    for ref in JS_LOCAL_REF.findall(code):
        if not pagefind_checked(report, source, ref):
            check_ref(report, out_dir, source, base_url, ref, 'resource')


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    out_dir = Path(sys.argv[1]).resolve()
    if not out_dir.is_dir():
        print(f'找不到输出目录 {out_dir}')
        return 2
    report = Report()
    kinds = Counter()
    for file in sorted(p for p in out_dir.rglob('*') if p.is_file()):
        source = file.relative_to(out_dir).as_posix()
        base_url = doc_url(out_dir, file)
        suffix = file.suffix.lower()
        if suffix == '.html':
            kinds['HTML'] += 1
            parser = PageParser()
            parser.feed(file.read_text(encoding='utf-8'))
            parser.close()
            for kind, _tag, url in parser.refs:
                check_ref(report, out_dir, source, base_url, url, 'resource' if kind == 'resource' else 'nav' if kind == 'nav' else 'other')
            for css in parser.styles:
                check_css(report, out_dir, source, base_url, css)
            classify_js_urls(report, source, parser.scripts)
            for kind, text in parser.scripts:
                if kind != 'application/json':
                    check_js_local_refs(report, out_dir, source, base_url, text)
        elif suffix == '.css':
            kinds['CSS'] += 1
            check_css(report, out_dir, source, base_url, file.read_text(encoding='utf-8'))
        elif suffix in ('.js', '.mjs'):
            kinds['JS'] += 1
            code = file.read_text(encoding='utf-8')
            classify_js_urls(report, source, [('', code)])
            check_js_local_refs(report, out_dir, source, base_url, code)
        elif suffix == '.svg':
            kinds['SVG'] += 1
            text = file.read_text(encoding='utf-8')
            for _, url in SVG_HREF.findall(text):
                check_ref(report, out_dir, source, base_url, url, 'resource')
            check_css(report, out_dir, source, base_url, text)
        elif suffix == '.xml':
            kinds['XML'] += 1
            text = file.read_text(encoding='utf-8')
            for url in XML_URL.findall(text):
                check_ref(report, out_dir, source, base_url, url, 'other')
        else:
            kinds['其他'] += 1

    js_bad = [item for item in report.js_urls if '用途不明' in item[2]]
    print(f'[check-build] 目录 {out_dir}')
    print(f'  站点 {ORIGIN}  部署前缀 {SITE_BASE}')
    print('  文件：' + '，'.join(f'{k} {v}' for k, v in kinds.items()))
    print(f'  站内引用：{len(report.internal) + len(report.broken)} 处（{len({r for _, r, _ in report.internal})} 个不同地址），坏链 {len(report.broken)}')
    for source, ref, why in report.broken[:30]:
        print(f'    坏链 {source} -> {ref}（{why}）')
    print(f'  外站资源：{len(report.external_resources)}')
    for source, kind, ref in report.external_resources[:30]:
        print(f'    外站资源 {source} -> {ref}')
    print(f'  外站超链接 <a href>（不算）：{len(report.external_links)} 处，{len({r for _, r in report.external_links})} 个地址')
    js_kinds = Counter(label.split('，')[0] if label.startswith('JSON') else label for _, _, label in report.js_urls)
    print(f'  脚本里的 http(s)：{len(report.js_urls)} 处（' + '，'.join(f'{k} {v}' for k, v in js_kinds.items()) + '）' if report.js_urls else '  脚本里的 http(s)：0')
    for source, url, label in report.js_urls:
        if '用途不明' in label:
            print(f'    用途不明 {source} -> {url}')
    print(f'  Pagefind 脚本里逐条核对后放行的字符串：{len(report.checked)} 处')
    for source, text in report.checked:
        print(f'    {source}：{text}（{PAGEFIND_CHECKED[text]}）')
    unseen = sorted(set(PAGEFIND_CHECKED) - {text for _, text in report.checked})
    if unseen:
        print(f'    放行清单里这些没在构建产物里出现，Pagefind 可能升级了，清单该更新：{"、".join(unseen)}')
    print(f'  需要处理：坏链 {len(report.broken)}，外站资源 {len(report.external_resources)}，脚本里用途不明的外链 {len(js_bad)}')
    return 1 if report.broken or report.external_resources or js_bad else 0


if __name__ == '__main__':
    sys.exit(main())
