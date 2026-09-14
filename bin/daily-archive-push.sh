#!/usr/bin/env bash
# intel-archive-push 每日归档提交推送（方案A，2026-09-14 用户授权）
# 设计约束：本脚本整体作为一条 path-only allowlist 条目免审执行（agent: frontend-architect），
# 因此对外的命令文本必须逐日稳定——日期、文件数等一切变量一律在脚本内部计算。
# 协议：stdout 仅输出一行结果（NOOP / COMMIT ... | PUSHED ... / FAILED: ...），
# git 原生输出全部走 stderr 供排障；exit 0=成功或无变更，1=提交前失败，2=已提交但推送失败。
set -u -o pipefail
REPO="/home/by-admin/tech-intel"
cd "$REPO" || { echo "FAILED: cd $REPO"; exit 1; }

CHANGED=$(git status --porcelain)
if [ -z "$CHANGED" ]; then
  echo "NOOP"
  exit 0
fi
N=$(printf '%s\n' "$CHANGED" | wc -l | tr -d ' ')

if ! git add -A 1>&2; then
  echo "FAILED: git add (exit=$?)"
  exit 1
fi
TODAY=$(date +%F)
if ! git commit -m "intel: archive update ${TODAY}" -m "Co-authored-by: wenbiyou <30649008+wenbiyou@users.noreply.github.com>" 1>&2; then
  echo "FAILED: git commit"
  exit 1
fi
SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)

if ! git push 1>&2; then
  echo "FAILED: git push (本地提交 ${SHORT} 已保留未发布)"
  exit 2
fi
echo "COMMIT ${SHORT} | PUSHED | ${N} 文件"
