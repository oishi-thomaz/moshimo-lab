#!/usr/bin/env bash
# TikTok に予約投稿する動画を用意する（Claude のクラウド環境で動かす）
#   bash tools/tiktok-prep.sh 0003,0034
# 1. vps ワークフロー（media）で VPS の動画を一時ブランチ media-tmp に置く
# 2. 取ってきて、Chrome の file_upload の上限（1回10MB未満）に収まるよう 9.2MB 以下に圧縮する（2パス・画質はほぼ変わらない）
# 3. /mnt/user-data/outputs/tiktok/NNNN.mp4 に置く（media-tmp は毎回上書きされる1コミットだけのブランチなので消さなくてよい）
# 90秒を超える動画は、9.2MB に収めると画質が落ちすぎるので作らない（ゆうとに手動投稿をお願いする）
set -euo pipefail
cd "$(dirname "$0")/.."
IDS="$1"
node tools/run.mjs media "$IDS"
git fetch -q origin media-tmp
OUT=/mnt/user-data/outputs/tiktok; mkdir -p "$OUT"
TMP=$(mktemp -d)
for id in $(echo "$IDS" | tr ',' ' '); do
  git show "origin/media-tmp:media/$id.mp4" > "$TMP/$id.mp4"
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/$id.mp4")
  if python3 -c "import sys; sys.exit(0 if float('$d') > 90 else 1)"; then echo "$id SKIP_LONG ${d}s"; continue; fi
  sz=$(stat -c%s "$TMP/$id.mp4")
  if [ "$sz" -lt 9400000 ]; then cp "$TMP/$id.mp4" "$OUT/$id.mp4"; echo "$id OK $sz"; continue; fi
  vb=$(python3 -c "print(int((9.2e6*8/$d - 128000)/1000))")
  ( cd "$TMP" && ffmpeg -v error -y -i "$id.mp4" -c:v libx264 -preset slow -tune animation -b:v ${vb}k -pass 1 -passlogfile "p$id" -an -f mp4 /dev/null \
    && ffmpeg -v error -y -i "$id.mp4" -c:v libx264 -preset slow -tune animation -b:v ${vb}k -pass 2 -passlogfile "p$id" -c:a aac -b:a 128k -movflags +faststart -pix_fmt yuv420p "$OUT/$id.mp4" )
  echo "$id OK $(stat -c%s "$OUT/$id.mp4")"
done

rm -rf "$TMP"
