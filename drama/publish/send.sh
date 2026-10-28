#!/usr/bin/env bash
# 仕上がった話を投稿サーバーへ送る（drama-out ブランチに置いて、drama-publish を動かす）
#   bash drama/publish/send.sh kakusan 2
set -euo pipefail
S="${1:?series}"; N="${2:?no}"; NN=$(printf %02d "$N")
cd "$(dirname "$0")/../.."
MP4="out/drama/${S}_ep${NN}.mp4"; COV="out/drama/${S}_ep${NN}_cover.jpg"
[ -f "$MP4" ] && [ -f "$COV" ] || { echo "動画か表紙がない：$MP4"; exit 1; }
META=$(node drama/publish/meta.mjs "$S" "$N" "$MP4")
ID=$(printf '%s' "$META" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).id))')
W=$(mktemp -d)
if git ls-remote --exit-code origin drama-out >/dev/null; then
  git fetch -q origin drama-out && git worktree add -q -f "$W" FETCH_HEAD && git -C "$W" checkout -q -B drama-out
else
  git worktree add -q --detach "$W" && git -C "$W" checkout -q --orphan drama-out && git -C "$W" rm -rfq . >/dev/null 2>&1 || true
fi
mkdir -p "$W/posts/$ID"
cp "$MP4" "$W/posts/$ID/$ID.mp4"; cp "$COV" "$W/posts/$ID/${ID}_cover.jpg"; printf '%s' "$META" > "$W/posts/$ID/$ID.json"
git -C "$W" add -A "posts/$ID"
git -C "$W" -c user.name="drama-bot" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" commit -qm "post $ID ${S} ep${NN}" || true
git -C "$W" push -q origin drama-out
git worktree remove --force "$W"
gh api -X POST repos/oishi-thomaz/moshimo-lab/actions/workflows/drama-publish.yml/dispatches -f ref=main -f "inputs[id]=$ID"
echo "送った：$ID（${S} 第${N}話）"
