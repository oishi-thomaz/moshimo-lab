#!/usr/bin/env bash
# チラつき（Zファイティングなど）の検査：1秒ごとに連続5コマを撮って tools/flicker.py で調べる
#   bash tools/flicker.sh 0622 0623     1本でもチラつきがあれば終了コード1
# 3D（canvas）だけを写す（--glonly）。数字のカウントアップや字幕の切り替わりはチラつきではないので見ない
set -uo pipefail
cd "$(dirname "$0")/.."
FAIL=0
for ID in "$@"; do
  D=out/flick/$ID; rm -rf "$D"; mkdir -p "$D"
  DUR=$(node tools/render.mjs --video "$ID" --meta "$D/m.json" >/dev/null 2>&1; node -e "console.log(Math.floor(require('./$D/m.json').duration - 4.2))")
  T=$(python3 -c "print(','.join(f'{i+0.35+d/30:.3f}' for i in range($DUR) for d in range(5)))")
  node tools/render.mjs --video "$ID" --stills "$T" --outdir "$D" --glonly >/dev/null 2>&1 || { echo "FLICKER-ERR $ID"; FAIL=1; continue; }
  if python3 tools/flicker.py "$D" > "$D/report.txt"; then echo "ok   $ID"; else FAIL=1; echo "FLICKER $ID $(tail -1 "$D/report.txt")"; fi
done
exit $FAIL
