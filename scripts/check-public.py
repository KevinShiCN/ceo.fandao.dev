#!/usr/bin/env python3
"""推送前的公开仓库扫描（只用 Python 标准库）。博客仓库和饭耳官网的发布仓库都是公开的：
不许出现密钥、本机路径、内网地址，以及私有词表里的公司域名、服务器地址。

用法：
    python3 scripts/check-public.py [--deny <私有词表>] <目录或文件> [...]

私有词表一行一个正则（# 开头是注释），放在任何仓库之外；也可以用环境变量 PUBLIC_SCAN_DENY 给路径。
词表本身不能进公开仓库，所以这里只写通用规则。
逐个文件按字节读（图片、字体也扫，防止元数据里带路径），命中就列出文件、行号和打了码的片段。
有命中时退出码为 1；给了词表路径却读不到，退出码为 2。node_modules、.git、预览目录和构建缓存不扫。
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

SKIP_DIRS = {'node_modules', '.git', '.astro', '.preview'}
SKIP_PREFIXES = ('.cache-',)

# 规则写法要避开「规则原文匹配到自己」：比如本机路径要求 /home/ 后面紧跟字母，原文里那里是 [。
RULES: list[tuple[str, re.Pattern[bytes]]] = [
    ('私钥', re.compile(rb'-----BEGIN [A-Z ]*PRIVATE KEY-----')),
    ('GitHub 令牌', re.compile(rb'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})')),
    ('API 密钥 sk-', re.compile(rb'\bsk-[A-Za-z0-9_-]{20,}')),
    ('AWS 密钥', re.compile(rb'\bAKIA[0-9A-Z]{16}\b')),
    ('Google 密钥', re.compile(rb'\bAIza[0-9A-Za-z_-]{35}\b')),
    ('Slack 令牌', re.compile(rb'\bxox[abprs]-[A-Za-z0-9-]{10,}')),
    ('JWT', re.compile(rb'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}')),
    (
        '写死的密钥',
        re.compile(
            rb'(?i)\b(?:api[_-]?key|secret|password|passwd|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*[\'"][^\'"\s]{12,}[\'"]'
        ),
    ),
    ('本机路径', re.compile(rb'(?:/home/[a-z][a-z0-9_-]*/|/Users/[A-Za-z][A-Za-z0-9._-]*/|[A-Za-z]:[\\/]+Users[\\/]|\\\\ws[l])')),
    ('内网地址', re.compile(rb'\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b')),
]


def load_deny(path: str) -> list[tuple[str, re.Pattern[bytes]]]:
    rules = []
    for n, line in enumerate(Path(path).read_text(encoding='utf-8').splitlines(), 1):
        line = line.strip()
        if line and not line.startswith('#'):
            rules.append((f'私有词表第 {n} 行', re.compile(line.encode('utf-8'), re.I)))
    return rules


def files_under(paths: list[str]) -> list[Path]:
    result: list[Path] = []
    for raw in paths:
        path = Path(raw)
        if not path.exists():
            raise SystemExit(f'找不到 {raw}')
        if path.is_file():
            result.append(path)
            continue
        for file in sorted(path.rglob('*')):
            parts = file.relative_to(path).parts
            if any(p in SKIP_DIRS or p.startswith(SKIP_PREFIXES) for p in parts):
                continue
            if file.is_file():
                result.append(file)
    return result


def mask(snippet: bytes) -> str:
    text = snippet.decode('utf-8', errors='replace')
    return text if len(text) <= 12 else f'{text[:6]}…{text[-3:]}'


def main(argv: list[str]) -> int:
    deny_path = os.environ.get('PUBLIC_SCAN_DENY')
    if argv[:1] == ['--deny']:
        if len(argv) < 2:
            print(__doc__)
            return 2
        deny_path, argv = argv[1], argv[2:]
    if not argv:
        print(__doc__)
        return 2
    rules = list(RULES)
    if deny_path:
        try:
            rules += load_deny(deny_path)
        except OSError as error:
            print(f'[check-public] 读不到私有词表 {deny_path}：{error}')
            return 2
    files = files_under(argv)
    hits: list[tuple[Path, int, str, str]] = []
    for file in files:
        data = file.read_bytes()
        for name, pattern in rules:
            for match in pattern.finditer(data):
                line = data.count(b'\n', 0, match.start()) + 1
                hits.append((file, line, name, mask(match.group())))
    extra = f'，另加私有词表 {len(rules) - len(RULES)} 条' if deny_path else '，没给私有词表'
    print(f'[check-public] 扫了 {len(files)} 个文件（通用规则 {len(RULES)} 条{extra}），命中 {len(hits)} 处')
    for file, line, name, snippet in hits[:50]:
        print(f'    {name}：{file}:{line}  {snippet}')
    return 1 if hits else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
