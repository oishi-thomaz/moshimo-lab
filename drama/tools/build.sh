#!/usr/bin/env bash
# いつわ劇場：1話を仕上げる（声は先に drama-tts で作って tts/<name>/ に置いておく）
#   bash drama/tools/build.sh tower/ep01 tts/tower_ep01 out/drama/tower_ep01
set -euo pipefail
EP="${1:?ep}"; TTS="${2:?tts dir}"; OUT="${3:?out prefix}"
cd "$(dirname "$0")/../.."
mkdir -p "$(dirname "$OUT")"
# 前の話の声をそのまま使う行があればコピーする
node drama/tools/reuse.mjs --script "drama/episodes/${EP}.script.js" --tts "$TTS"
node drama/tools/render.mjs --ep "$EP" --tts "$TTS/index.json" --meta "${OUT}.json"
python3 drama/tools/audio.py --meta "${OUT}.json" --tts "$TTS" --out "$OUT"
node drama/tools/render.mjs --ep "$EP" --tts "$TTS/index.json" --out "${OUT}_video.mp4"
# 声が出ている間はBGMを下げる。全体を -14 LUFS にそろえる
ffmpeg -v error -y -i "${OUT}_video.mp4" -i "${OUT}_voice.wav" -i "${OUT}_bgm.wav" -i "${OUT}_sfx.wav" \
  -filter_complex "[1:a]volume=1.0,asplit=2[v1][v2];[2:a]volume=0.32[b];[b][v1]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=400[bd];[3:a]volume=0.55[sx];[v2][bd][sx]amix=inputs=3:normalize=0[m];[m]loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "${OUT}.mp4"
ffmpeg -v error -y -ss "${COVER_T:-0.4}" -i "${OUT}.mp4" -frames:v 1 -q:v 3 "${OUT}_cover.jpg"
echo "built ${OUT}.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUT}.mp4")s)"
