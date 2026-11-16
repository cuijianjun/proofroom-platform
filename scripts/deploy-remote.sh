#!/usr/bin/env bash
# ProofRoom 服务器端部署脚本（由 scripts/deploy.sh 通过 SSH 调用，也可在服务器上单独执行）
#
# 顺序：依赖 -> 数据库迁移 -> 构建 api/worker -> 构建 web(影子目录) -> 切换 -> 重启 -> 健康检查
# 设计原则：构建全部成功后才会动线上目录与进程；任何一步失败立即退出，线上保持原状。
set -uo pipefail

APP="${PROOFROOM_DIR:-/mnt/sdc/proofroom}"
cd "$APP" || { echo "进不去 $APP"; exit 1; }
export PATH=/usr/local/lib/node22/bin:$PATH
export NO_COLOR=1
export NODE_ENV=production

STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$APP/logs"
LOG="$APP/logs/deploy-$STAMP.log"
# 所有输出同时落盘，便于失败后排查
exec > >(tee -a "$LOG") 2>&1

C_B=$'\033[1m'; C_R=$'\033[31m'; C_G=$'\033[32m'; C_0=$'\033[0m'
step(){ printf '\n%s==> %s%s\n' "$C_B" "$*" "$C_0"; }
ok(){   printf '%s  ✓ %s%s\n' "$C_G" "$*" "$C_0"; }
fail(){ printf '\n%s✗ %s%s\n' "$C_R" "$*" "$C_0"; printf '详细日志：%s\n' "$LOG"; exit 1; }
trap 'fail "部署中断（第 $LINENO 行）"' ERR

START=$(date +%s)

# ---------- 0. 预检 ----------
step "预检"
[ -f .env ] || fail ".env 缺失"
[ -f scripts/build-service.mjs ] || fail "仓库不完整（缺 scripts/build-service.mjs）"
NODE_V=$(node -v)
case "$NODE_V" in v22*) ok "node $NODE_V";; *) fail "node 版本不是 v22（当前 $NODE_V）";; esac
pg_isready -h 127.0.0.1 -p 18432 -q && ok "PostgreSQL 18432 可连" || fail "PostgreSQL 18432 连不上"

# 依赖库有变化才重装
LOCK=package-lock.json
MARK=node_modules/.package-lock.json
NEED_INSTALL=0
if [ ! -f "$MARK" ] || [ "$LOCK" -nt "$MARK" ]; then NEED_INSTALL=1; fi
[ "${PROOFROOM_SKIP_INSTALL:-0}" = "1" ] && NEED_INSTALL=0

# ---------- 1. 依赖 ----------
if [ "$NEED_INSTALL" = "1" ]; then
  step "安装依赖（package-lock.json 有变化）"
  npm ci --registry=https://registry.npmmirror.com --no-audit --no-fund || fail "npm ci 失败"
  ok "依赖安装完成"
else
  step "依赖无变化，跳过 npm ci"
fi

# ---------- 2. 数据库迁移 ----------
step "数据库迁移"
node --env-file=.env --import tsx packages/db/migrate.ts || fail "数据库迁移失败"
ok "迁移完成"

# ---------- 3. 备份当前产物（用于手工回滚） ----------
BK="$APP/.deploy-backup/$STAMP"
mkdir -p "$BK"
for d in apps/api/dist apps/worker/dist apps/web/.next; do
  if [ -d "$d" ]; then
    cp -a "$d" "$BK/$(echo "$d" | tr '/' '_')" 2>/dev/null || true
  fi
done
ok "旧产物备份到 $BK"

# ---------- 4. 构建 api / worker ----------
step "构建 api"
node scripts/build-service.mjs api || fail "api 构建失败"
ok "apps/api/dist/main.mjs"

step "构建 worker"
node scripts/build-service.mjs worker || fail "worker 构建失败"
ok "apps/worker/dist/main.mjs"

# ---------- 5. 构建 web（影子目录，不碰正在服务的 .next） ----------
step "构建 web（输出到 .next-new）"
rm -rf apps/web/.next-new
( cd apps/web && PROOFROOM_WEB_DIST=.next-new node "$APP/node_modules/next/dist/bin/next" build ) || fail "web 构建失败"
[ -f apps/web/.next-new/BUILD_ID ] || fail "web 构建产物不完整（缺 BUILD_ID）"
ok "next build 完成"

step "切换 web 产物"
rm -rf apps/web/.next-old
if [ -d apps/web/.next ]; then mv apps/web/.next apps/web/.next-old; fi
mv apps/web/.next-new apps/web/.next
ok "已切换到新构建"

# ---------- 6. 重启 ----------
step "重启服务"
systemctl restart proofroom-api || fail "proofroom-api 重启失败"
sleep 2
systemctl restart proofroom-worker || fail "proofroom-worker 重启失败"
systemctl restart proofroom-web  || fail "proofroom-web 重启失败"
sleep 3
for s in proofroom-api proofroom-worker proofroom-web; do
  st=$(systemctl is-active "$s")
  [ "$st" = "active" ] && ok "$s active" || fail "$s 状态为 $st"
done

# ---------- 7. 健康检查 ----------
step "健康检查"
API_OK=0
for _ in $(seq 1 20); do
  if curl -fsS --max-time 3 http://127.0.0.1:18182/api/v1/health 2>/dev/null | grep -q '"status":"ok"'; then API_OK=1; break; fi
  sleep 1
done
[ "$API_OK" = "1" ] || { tail -20 logs/api.log; fail "API 健康检查失败"; }
ok "API /api/v1/health = ok"

WEB_OK=0
for _ in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:18180/ 2>/dev/null)
  if [ "$code" = "200" ]; then WEB_OK=1; break; fi
  sleep 1
done
[ "$WEB_OK" = "1" ] || { tail -20 logs/web.log; fail "WEB 首页返回 $code"; }
ok "WEB 首页 200"

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 https://sy.barenkeji.com/ 2>/dev/null)
[ "$code" = "200" ] && ok "公网 https://sy.barenkeji.com 200" || printf '  ! 公网返回 %s（本机正常则可能是 DNS/证书问题）\n' "$code"

# ---------- 8. 收尾 ----------
rm -rf apps/web/.next-old
# 只保留最近 5 份产物备份
ls -1dt "$APP"/.deploy-backup/*/ 2>/dev/null | tail -n +6 | xargs -r rm -rf || true

END=$(date +%s)
printf '\n%s部署成功%s  耗时 %ss   日志 %s\n' "$C_G" "$C_0" "$((END-START))" "$LOG"
