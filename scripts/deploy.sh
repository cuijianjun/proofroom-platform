#!/usr/bin/env bash
# ProofRoom 一键部署（在本地 Mac 执行）
#
#   ./scripts/deploy.sh                 全流程：推 GitHub -> 同步代码 -> 装依赖 -> 迁移 -> 构建 -> 重启 -> 健康检查
#   ./scripts/deploy.sh --restart-only  只重启服务（不改代码、不构建、不推送）
#   ./scripts/deploy.sh --dry-run       只看会同步哪些文件，不实际部署
#   ./scripts/deploy.sh --skip-git      跳过 GitHub 推送（网络不通时用）
#   ./scripts/deploy.sh --help
#
# 密码：环境变量 PROOFROOM_DEPLOY_PASS，未设置则用内置值。
# Git：推送到 origin 当前分支，可用 PROOFROOM_GIT_REMOTE / PROOFROOM_GIT_BRANCH 覆盖。
set -uo pipefail

HOST="${PROOFROOM_HOST:-116.204.39.233}"
USER_NAME="${PROOFROOM_USER:-root}"
REMOTE_DIR="${PROOFROOM_DIR:-/mnt/sdc/proofroom}"
PASS="${PROOFROOM_DEPLOY_PASS:-Cjs15313217736}"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

MODE="deploy"
SKIP_GIT=0
for arg in "$@"; do
  case "$arg" in
    --restart-only) MODE="restart-only" ;;
    --dry-run)      MODE="dry-run" ;;
    --skip-git)     SKIP_GIT=1 ;;
    -h|--help)      sed -n '2,11p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "未知参数: $arg"; exit 2 ;;
  esac
done

C_OK=$'\033[32m'; C_ERR=$'\033[31m'; C_B=$'\033[1m'; C_0=$'\033[0m'
say(){ printf '%s==>%s %s\n' "$C_B" "$C_0" "$*"; }
die(){ printf '%s✗ %s%s\n' "$C_ERR" "$*" "$C_0"; exit 1; }

command -v expect >/dev/null || die "本机缺少 expect"
command -v rsync  >/dev/null || die "本机缺少 rsync"

TMPD="$(mktemp -d /tmp/proofroom-deploy.XXXXXX)"
trap 'rm -rf "$TMPD"' EXIT
SSH_EXP="$TMPD/ssh.exp"
RSYNC_EXP="$TMPD/rsync.exp"

cat > "$SSH_EXP" <<'EXP'
set timeout -1
set cmd  [lindex $argv 0]
set pass [lindex $argv 1]
set host [lindex $argv 2]
log_user 1
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -o PubkeyAuthentication=no -o PreferredAuthentications=password \
  -o ConnectTimeout=20 -o ServerAliveInterval=30 \
  $host $cmd
expect {
  -re "(?i)password:" { send "$pass\r"; exp_continue }
  eof
}
catch wait result
exit [lindex $result 3]
EXP

cat > "$RSYNC_EXP" <<'EXP'
set timeout -1
set extra [lindex $argv 0]
if {$extra eq "NONE"} { set extra "" }
if {$extra eq "DRY"}  { set extra [list -n] }
set src   [lindex $argv 1]
set dst   [lindex $argv 2]
set pass  [lindex $argv 3]
log_user 1
spawn rsync {*}$extra -az --delete --checksum --itemize-changes \
  --exclude=node_modules --exclude=.next --exclude=.next-* \
  --exclude=dist --exclude=logs --exclude=.git --exclude=.env --exclude=.local \
  --exclude=.deploy-backup \
  --exclude=upstream --exclude=playwright-report --exclude=test-results \
  --exclude=tsconfig.tsbuildinfo --exclude=.DS_Store --exclude=._* --exclude=*.tgz \
  -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PubkeyAuthentication=no -o PreferredAuthentications=password -o ConnectTimeout=20" \
  $src $dst
expect {
  -re "(?i)password:" { send "$pass\r"; exp_continue }
  eof
}
catch wait result
exit [lindex $result 3]
EXP

ssh_run(){ expect -f "$SSH_EXP" "$1" "$PASS" "${USER_NAME}@${HOST}"; }
rsync_up(){ expect -f "$RSYNC_EXP" "${1:-NONE}" "$LOCAL_DIR/" "${USER_NAME}@${HOST}:${REMOTE_DIR}/" "$PASS"; }

cd "$LOCAL_DIR" || die "进不去项目目录"
[ -f package-lock.json ] || die "不在项目根目录？"

# ---------- 只重启 ----------
if [ "$MODE" = "restart-only" ]; then
  say "只重启服务（不构建）"
  ssh_run "systemctl restart proofroom-api proofroom-worker; sleep 2; systemctl restart proofroom-web; sleep 4; systemctl is-active proofroom-api proofroom-worker proofroom-web | tr '\n' ' '; echo; curl -fsS --max-time 5 http://127.0.0.1:18182/api/v1/health; echo"
  exit $?
fi

# ---------- 同步 ----------
say "目标 ${USER_NAME}@${HOST}:${REMOTE_DIR}"
if [ "$MODE" = "dry-run" ]; then
  say "dry-run：下列为将同步的差异（>f 修改，>f++++ 新增，*deleting 删除）"
  rsync_up DRY || true
  say "dry-run 结束"
  exit 0
fi

# ---------- 先推 GitHub ----------
if [ "$SKIP_GIT" = "1" ]; then
  say "跳过 GitHub 推送（--skip-git）"
elif git rev-parse --git-dir >/dev/null 2>&1; then
  say "推送到 GitHub"
  if [ -n "$(git status --porcelain)" ]; then
    git add -A || die "git add 失败"
    git commit -q -m "chore: 部署前自动提交 $(date '+%Y-%m-%d %H:%M:%S')" || die "git commit 失败"
    printf '   已提交 %s\n' "$(git log -1 --pretty='%h %s')"
  else
    printf '   工作区干净，无新提交\n'
  fi
  GIT_REMOTE="${PROOFROOM_GIT_REMOTE:-origin}"
  # 默认跟随上游分支（如 origin/main -> main），无上游则用当前分支名
  GIT_BRANCH="${PROOFROOM_GIT_BRANCH:-$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null | sed 's|^[^/]*/||')}"
  [ -n "$GIT_BRANCH" ] || GIT_BRANCH="$(git branch --show-current)"
  [ -n "$GIT_BRANCH" ] || die "当前处于 detached HEAD，请用 PROOFROOM_GIT_BRANCH 指定分支"
  git push "$GIT_REMOTE" "HEAD:$GIT_BRANCH" || die "GitHub 推送失败（网络不通可用 --skip-git）"
  printf '   已推送 %s/%s @ %s\n' "$GIT_REMOTE" "$GIT_BRANCH" "$(git rev-parse --short HEAD)"
else
  say "不是 git 仓库，跳过 GitHub 推送"
fi

say "同步源码（增量；排除 node_modules/.env/.next/dist/logs）"
rsync_up || die "代码同步失败"

say "远程构建 + 迁移 + 重启"
ssh_run "bash ${REMOTE_DIR}/scripts/deploy-remote.sh"
rc=$?
if [ $rc -ne 0 ]; then
  die "远程部署失败（退出码 $rc），详见 ${REMOTE_DIR}/logs/deploy-*.log"
fi
printf '\n%s部署完成%s\n' "$C_OK" "$C_0"
