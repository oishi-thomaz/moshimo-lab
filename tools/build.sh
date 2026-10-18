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
ffmpeg -v error -y -i "out/${ID}_video.mp4" -i "out/${ID}_bgm.wav" \
  -filter_complex "[1:a]loudnorm=I=-15:TP=-1.5:LRA=9[a]" -map 0:v -map "[a]" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/${ID}.mp4"
# cover image for the approval message (first frame with the title)
ffmpeg -v error -y -ss 1.2 -i "out/${ID}.mp4" -frames:v 1 -q:v 3 "out/${ID}_cover.jpg"
rm -f "out/${ID}_video.mp4" "out/${ID}_bgm.wav"
echo "built out/${ID}.mp4"
