#!/usr/bin/env bash
# 发布饭耳官网 fanear.fandao.dev：把饭耳仓库的 CHANGELOG.md 同步进来，构建、检查、推送，再核对线上页面。
# 平时不直接跑这个：在饭耳仓库根目录跑 scripts/sync-website.sh，它会把下面几个参数填好。
#
#   fanear-publish.sh --blog <博客仓库> --changelog <CHANGELOG.md> --deny <私有词表> [--dry-run] [--ref <分支>]
#
# 做的事（任何一步失败就停，不推送）：
#   1. 从博客仓库 origin/main 新开一个临时 worktree（不碰你正在用的那份），装依赖
#   2. 把 CHANGELOG.md 原样复制到 sites/fanear/src/data/CHANGELOG.md
#   3. 构建；跑更新记录解析的测试、坏链和外站资源检查、公开仓库扫描（密钥、本机路径、私有词表）
#   4. CHANGELOG 有变化就在博客仓库提交，推 main（源码）
#   5. 把构建产物推到发布仓库（GitHub Pages 从它的 main 分支发布，绑 fanear.fandao.dev）
#   6. 等 GitHub Pages 发布完，打开线上的更新记录页，确认最新一条已经在上面
# --dry-run 只做 1–3 步，再把要推的改动列出来，不推送；发布仓库还没建时跳过第 5 步。
# --ref 换掉第 1 步的 origin/main（还没合进 main 的分支先试跑用），只能和 --dry-run 一起用。
set -euo pipefail

SITE_REPO=KevinShiCN/fanear.fandao.dev
SITE_URL=https://fanear.fandao.dev
BLOG=''
CHANGELOG=''
DENY="${PUBLIC_SCAN_DENY:-}"
DRY_RUN=0
REF=origin/main

while [ $# -gt 0 ]; do
	case "$1" in
		--blog) BLOG=$2; shift 2 ;;
		--changelog) CHANGELOG=$2; shift 2 ;;
		--deny) DENY=$2; shift 2 ;;
		--dry-run) DRY_RUN=1; shift ;;
		--ref) REF=$2; shift 2 ;;
		*) echo "不认识的参数：$1" >&2; exit 2 ;;
	esac
done

fail() { echo "失败：$*" >&2; exit 1; }
step() { echo; echo "== $*"; }
# 跑一条命令，输出记到日志；失败时把日志最后 30 行打出来
quiet() { "$@" >"$WORK/step.log" 2>&1 || { tail -30 "$WORK/step.log" >&2; fail "$*"; }; }

[ -n "$BLOG" ] && git -C "$BLOG" rev-parse --git-dir >/dev/null 2>&1 || fail "--blog 要给博客仓库的路径"
[ -f "$CHANGELOG" ] || fail "--changelog 要给 CHANGELOG.md 的路径，现在是「$CHANGELOG」"
# 发到公开仓库前必须带私有词表扫一遍（词表里是公司域名、服务器地址这类不能公开的东西）
[ -f "$DENY" ] || fail "--deny 要给私有词表的路径（或设 PUBLIC_SCAN_DENY），现在是「$DENY」"
[ "$REF" = origin/main ] || [ "$DRY_RUN" = 1 ] || fail "--ref 只能和 --dry-run 一起用：正式发布只从 origin/main 发"

BLOG=$(git -C "$BLOG" rev-parse --show-toplevel)
CHANGELOG=$(realpath "$CHANGELOG")
DENY=$(realpath "$DENY")
WORK="$BLOG/.worktrees/fanear-publish-$(date +%Y%m%d%H%M%S)"
cleanup() {
	git -C "$BLOG" worktree remove --force "$WORK/blog" >/dev/null 2>&1 || true
	rm -rf "$WORK"
}
trap cleanup EXIT

step "1/6 从 $REF 开临时 worktree"
git -C "$BLOG" fetch --quiet origin main
mkdir -p "$WORK"
git -C "$BLOG" worktree add --quiet --detach "$WORK/blog" "$REF"
cd "$WORK/blog"
echo "博客 main：$(git rev-parse --short HEAD)"
quiet npm ci --no-audit --no-fund

step "2/6 复制 CHANGELOG.md"
cp "$CHANGELOG" sites/fanear/src/data/CHANGELOG.md
LATEST=$(node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { parseChangelog } from './sites/fanear/src/lib/changelog.mjs';
const log = parseChangelog(readFileSync('sites/fanear/src/data/CHANGELOG.md', 'utf8'));
const v = log.unreleased[0] ?? log.released[0];
if (!v) throw new Error('更新记录里一个版本都没有');
console.log(JSON.stringify({ version: v.version, text: v.items[0].text }));
")
VERSION=$(node -e "console.log(JSON.parse(process.argv[1]).version)" "$LATEST")
echo "最新版本 $VERSION；改动 $(git status --short sites/fanear/src/data/CHANGELOG.md | wc -l) 个文件"

step "3/6 构建和检查"
quiet npm run fanear:build
npm run --silent fanear:check | grep -E '^ℹ (pass|fail)|坏链|外站资源|需要处理'
python3 scripts/check-public.py --deny "$DENY" sites/fanear scripts

step "4/6 提交源码"
if git diff --quiet -- sites/fanear/src/data/CHANGELOG.md; then
	echo "CHANGELOG 跟博客仓库里的一样，不用提交"
	BLOG_PUSH=0
else
	git add sites/fanear/src/data/CHANGELOG.md
	git commit --quiet -m "docs(fanear): 同步更新记录（$VERSION）"
	echo "提交 $(git rev-parse --short HEAD)"
	BLOG_PUSH=1
fi
SOURCE=$(git rev-parse HEAD)

step "5/6 准备发布仓库"
SITE_PUSH=0
if ! gh repo view "$SITE_REPO" --json name >/dev/null 2>&1; then
	[ "$DRY_RUN" = 1 ] || fail "发布仓库 $SITE_REPO 不存在（官网还没上线？）"
	echo "发布仓库 $SITE_REPO 还没建，跳过"
else
	# 刚建的空仓库 clone 下来没有分支，第一次提交就是 main
	git clone --quiet --depth 1 "https://github.com/$SITE_REPO.git" "$WORK/site" 2>/dev/null
	find "$WORK/site" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
	cp -R sites/fanear/dist/. "$WORK/site/"
	git -C "$WORK/site" add -A
	if git -C "$WORK/site" diff --cached --quiet; then
		echo "构建产物跟线上一样，不用发布"
	else
		git -C "$WORK/site" commit --quiet -m "deploy: 构建自 ceo.fandao.dev main ${SOURCE:0:7}（更新记录 $VERSION）"
		git -C "$WORK/site" show --stat --format='发布提交 %h %s' HEAD | tail -4
		SITE_PUSH=1
	fi
fi

if [ "$DRY_RUN" = 1 ]; then
	step "--dry-run：到这里为止，没有推送"
	echo "要推：博客 main $([ $BLOG_PUSH = 1 ] && echo 有新提交 || echo 不用推)；发布仓库 $([ $SITE_PUSH = 1 ] && echo 有新提交 || echo 不用推)"
	exit 0
fi

if [ "$BLOG_PUSH" = 1 ]; then
	git push --quiet origin HEAD:main
	echo "博客 main 已推送"
fi
if [ "$SITE_PUSH" = 1 ]; then
	git -C "$WORK/site" push --quiet origin HEAD:main
	echo "发布仓库已推送"
fi

step "6/6 核对线上"
python3 - "$SITE_REPO" "$SITE_URL/changelog/" "$LATEST" <<'PY'
import html, json, subprocess, sys, time, urllib.request

repo, url, latest = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
deadline = time.time() + 600
while True:
    status = subprocess.run(
        ['gh', 'api', f'repos/{repo}/pages/builds/latest', '--jq', '.status'],
        capture_output=True, text=True,
    ).stdout.strip()
    if status == 'errored':
        sys.exit('失败：GitHub Pages 发布出错，去发布仓库的 Actions 页看原因')
    if status == 'built':
        try:
            req = urllib.request.Request(f'{url}?t={int(time.time())}', headers={'Cache-Control': 'no-cache'})
            page = html.unescape(urllib.request.urlopen(req, timeout=30).read().decode('utf-8'))
        except OSError as error:
            page = ''
            print(f'  打不开 {url}：{error}，等一会儿再试')
        if latest['text'] in page:
            print(f'线上已更新：{url} 有 {latest["version"]} 的最新一条')
            break
    if time.time() > deadline:
        sys.exit(f'失败：等了 10 分钟，线上更新记录页还没有最新一条（Pages 状态：{status or "查不到"}）')
    time.sleep(15)
PY
