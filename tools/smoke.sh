#!/usr/bin/env bash
# 書き出しの事前チェック（本番より軽い）：動画ごとに META・静止画・BGM/効果音・ナレーションのつなぎ（ダミー音）まで通す
#   bash tools/smoke.sh 0037 0601      （番号なし＝在庫のうち、まだ書き出していない次の10本）
# 1本でも落ちたら終了コード1。落ちた番号と最後のエラーを out/smoke/report.txt に書く
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/smoke; : > out/smoke/report.txt
IDS="$*"
if [ -z "$IDS" ]; then
  IDS=$(node -e "
const fs=require('fs');const r=f=>(fs.existsSync(f)?fs.readFileSync(f,'utf8'):'').split(/\r?\n/).map(s=>s.trim()).filter(s=>/^\d{4}$/.test(s));
const done=new Set(r('state/rendered.txt'));console.log(r('plan/queue.txt').filter(i=>!done.has(i)&&fs.existsSync('engine/videos/'+i+'.js')).slice(0,10).join(' '))")
fi
FAIL=0
for ID in $IDS; do
  D=out/smoke/$ID; mkdir -p "$D"; LOG=$D/log.txt
  (
    set -e
    node tools/render.mjs --video "$ID" --meta "$D/$ID.json"
    DUR=$(node -e "console.log(require('./$D/$ID.json').duration)")
    node tools/render.mjs --video "$ID" --stills "0,1,$(node -e "console.log(($DUR/2).toFixed(1))"),$(node -e "console.log(($DUR-1).toFixed(1))")" --outdir "$D"
    M="./$D/$ID.json"
    python3 tools/bgm.py --mood "$(node -e "console.log(require('$M').mood||'tension')")" --seed "$(node -e "console.log(require('$M').seed||1)")" --duration "$DUR" \
      --hits "$(node -e "console.log((require('$M').hits||[]).join(','))")" --risers "$(node -e "console.log((require('$M').risers||[]).join(','))")" \
      --impacts "$(node -e "console.log((require('$M').impacts||[]).join(','))")" --sfx "$(node -e "console.log((require('$M').sfx||[]).map(x=>x.join(':')).join(','))")" \
      --sfx-out "$D/sfx.wav" --out "$D/bgm.wav"
    MOCK_TTS=1 node tools/narrate.mjs --meta "$D/$ID.json" --out "$D/narr.wav"
  ) > "$LOG" 2>&1
  if [ $? -eq 0 ]; then echo "ok   $ID"; else FAIL=1; ERR=$(grep -E "Error|error|EXC|Traceback|失敗" "$LOG" | tail -3 | tr '\n' ' '); echo "FAIL $ID $ERR" | tee -a out/smoke/report.txt; fi
done
exit $FAIL
