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
IMPACTS=$(node -e "console.log((require('./out/$ID.json').impacts||[]).join(','))")
DUR=$(node -e "console.log(require('./out/$ID.json').duration)")
SFX=$(node -e "console.log((require('./out/$ID.json').sfx||[]).map(x=>x.join(':')).join(','))")
node tools/render.mjs --video "$ID" --out "out/${ID}_video.mp4"
python3 tools/bgm.py --mood "$MOOD" --seed "$SEED" --duration "$DUR" --hits "$HITS" --risers "$RISERS" --impacts "$IMPACTS" --sfx "$SFX" --sfx-out "out/${ID}_sfx.wav" --out "out/${ID}_bgm.wav"
# 強調の効果音（META.impacts）が無いときは無音のトラック
[ -f "out/${ID}_sfx.wav" ] || ffmpeg -v error -y -f lavfi -i anullsrc=r=44100:cl=stereo -t "$DUR" "out/${ID}_sfx.wav"
# ナレーション（GEMINI_API_KEY があるときだけ。無ければBGMだけ）
NARR=0
if node tools/narrate.mjs --meta "out/$ID.json" --out "out/${ID}_narr.wav"; then NARR=1; else
  rc=$?
  # 声の1日の上限（3）は声なしで作らずに止める。上限が戻ったら同じ番号でやり直す
  if [ $rc -eq 3 ]; then echo "::error::ナレーションの1日の上限に達したので書き出しを止める（声なしの動画は作らない）"; exit 1; fi
  if [ $rc -ne 2 ]; then echo "::warning::ナレーションの作成に失敗したので、ナレーションなしで作る ($rc)"; fi
fi
if [ $NARR = 1 ]; then
  # 声が出ている間はBGMを下げる（サイドチェイン）。声とBGMを混ぜて -15 LUFS にそろえる
  ffmpeg -v error -y -i "out/${ID}_video.mp4" -i "out/${ID}_bgm.wav" -i "out/${ID}_narr.wav" -i "out/${ID}_sfx.wav" \
    -filter_complex "[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.6,asplit=2[v1][v2];[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55[b];[b][v1]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=350[bd];[3:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.9[sx];[bd][v2][sx]amix=inputs=3:normalize=0[m];[m]loudnorm=I=-15:TP=-1.5:LRA=9[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/${ID}.mp4"
else
  ffmpeg -v error -y -i "out/${ID}_video.mp4" -i "out/${ID}_bgm.wav" -i "out/${ID}_sfx.wav" \
    -filter_complex "[1:a][2:a]amix=inputs=2:normalize=0[m];[m]loudnorm=I=-15:TP=-1.5:LRA=9[a]" -map 0:v -map "[a]" \
    -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/${ID}.mp4"
fi
# cover image（0秒目＝サムネイル。v2 の動画は0秒目がサムネになるように作っている）
if grep -q "v2: *true" "engine/videos/${ID}.js"; then CT=0; else CT=1.2; fi
ffmpeg -v error -y -ss $CT -i "out/${ID}.mp4" -frames:v 1 -q:v 3 "out/${ID}_cover.jpg"
# 2026/11/03 ゆうと：カバー（文字入りの表紙 1080x1920）を投稿の時に付ける。plan/covers/NNNN.jpg があればそれ、
# なければ plan/cover-lines.json（文字）と plan/cover-picks.json（場面の秒数）から作る。どちらもなければ上の0秒目のまま
if [ -f "plan/covers/${ID}.jpg" ]; then
  cp "plan/covers/${ID}.jpg" "out/${ID}_cover.jpg"; echo "cover: plan/covers/${ID}.jpg"
elif python3 -c "import json,sys;sys.exit(0 if '$ID' in json.load(open('plan/cover-lines.json')) and '$ID' in json.load(open('plan/cover-picks.json')) else 1)"; then
  T=$(python3 -c "import json;print(json.load(open('plan/cover-picks.json'))['$ID'])")
  node tools/render.mjs --video "$ID" --stills "$T" --glonly --outdir "out/cv_${ID}" >/dev/null \
    && python3 tools/make_covers.py --one "$ID" "$(ls out/cv_${ID}/*.jpg | head -1)" "out/${ID}_cover.jpg" \
    || echo "::warning::カバーが作れなかったので0秒目のまま"
  rm -rf "out/cv_${ID}"
elif [[ "$ID" == q* ]] && python3 -c "import json,sys;sys.exit(0 if '$ID' in json.load(open('plan/quiz-covers.json')) else 1)"; then
  # クイズ：plan/quiz-covers.json の文字（キャッチコピー）と場面の秒数から作る（tools/make_quiz_cover.py）
  T=$(python3 -c "import json;print(json.load(open('plan/quiz-covers.json'))['$ID']['t'])")
  node tools/render.mjs --video "$ID" --stills "$T" --glonly --outdir "out/cv_${ID}" >/dev/null \
    && python3 tools/make_quiz_cover.py "$ID" "$(ls out/cv_${ID}/*.jpg | head -1)" "out/${ID}_cover.jpg" \
    || echo "::warning::カバーが作れなかったので0秒目のまま"
  rm -rf "out/cv_${ID}"
else
  echo "::warning::カバーの文字（plan/cover-lines.json・クイズは plan/quiz-covers.json）か場面がないので0秒目のまま"
fi
rm -rf "out/${ID}_video.mp4" "out/${ID}_bgm.wav" "out/${ID}_narr.wav" "out/${ID}_narr" "out/${ID}_sfx.wav" out/${ID}_*_trim.wav
echo "built out/${ID}.mp4"
