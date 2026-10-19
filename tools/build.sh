#!/usr/bin/env bash
# Build one finished video: render frames -> generate BGM -> mux -> out/<id>.mp4 + out/<id>.json
#   bash tools/build.sh 0001
set -euo pipefail
ID="${1:?video id}"
cd "$(dirname "$0")/.."
mkdir -p out
node tools/render.mjs --video "$ID" --meta "out/$ID.json"
MOOD=$(node -e "console.log(require('./out/$ID.json').mood||'tension')")
SEED=$(node -e "console.log(require('./out/$ID.json').seed||1)")
HITS=$(node -e "console.log((require('./out/$ID.json').hits||[]).join(','))")
RISERS=$(node -e "console.log((require('./out/$ID.json').risers||[]).join(','))")
DUR=$(node -e "console.log(require('./out/$ID.json').duration)")
node tools/render.mjs --video "$ID" --out "out/${ID}_video.mp4"
python3 tools/bgm.py --mood "$MOOD" --seed "$SEED" --duration "$DUR" --hits "$HITS" --risers "$RISERS" --out "out/${ID}_bgm.wav"
# ナレーション（GEMINI_API_KEY があるときだけ。無ければBGMだけ）
NARR=0
if node tools/narrate.mjs --meta "out/$ID.json" --out "out/${ID}_narr.wav"; then NARR=1; else
  rc=$?; if [ $rc -ne 2 ]; then echo "::warning::ナレーションの作成に失敗したので、ナレーションなしで作る ($rc)"; fi
fi
if [ $NARR = 1 ]; then
  # 声が出ている間はBGMを下げる（サイドチェイン）。声とBGMを混ぜて -15 LUFS にそろえる
  ffmpeg -v error -y -i "out/${ID}_video.mp4" -i "out/${ID}_bgm.wav" -i "out/${ID}_narr.wav" \
    -filter_complex "[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.6,asplit=2[v1][v2];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55[b];[b][v1]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=350[bd];[bd][v2]amix=inputs=2:normalize=0[m];[m]loudnorm=I=-15:TP=-1.5:LRA=9[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/${ID}.mp4"
else
  ffmpeg -v error -y -i "out/${ID}_video.mp4" -i "out/${ID}_bgm.wav" \
    -filter_complex "[1:a]loudnorm=I=-15:TP=-1.5:LRA=9[a]" -map 0:v -map "[a]" \
    -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/${ID}.mp4"
fi
# cover image for the approval message (first frame with the title)
ffmpeg -v error -y -ss 1.2 -i "out/${ID}.mp4" -frames:v 1 -q:v 3 "out/${ID}_cover.jpg"
rm -rf "out/${ID}_video.mp4" "out/${ID}_bgm.wav" "out/${ID}_narr.wav" "out/${ID}_narr"
echo "built out/${ID}.mp4"
