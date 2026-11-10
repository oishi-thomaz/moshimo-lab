#!/usr/bin/env bash
# 仕上がった話を投稿サーバーへ送る（drama-out ブランチに置いて、drama-publish を動かす）
#   bash drama/publish/send.sh kakusan 2
#   NO_DISPATCH=1 で置くだけ（あとで drama-publish に 1001,1002 のようにまとめて渡す）
#   前編・後編に分けて送るとき：PART=1 CUT=72.4 bash drama/publish/send.sh okihai 1（前編＝0〜CUT秒、PART=2 で後編＝CUT秒〜最後）
#     番号は ID_BASE＋10×話数＋PART（置き配 第1話 前編＝4011・後編＝4012）。どちらも61秒以上でないと止まる。表紙は1話の表紙に 前編／後編 を足す
#   表紙だけ差し替えるとき：NO_DISPATCH=1 で置いてから drama-publish を cover_only=true で動かす（承認の状態は変えない）
set -euo pipefail
S="${1:?series}"; N="${2:?no}"; NN=$(printf %02d "$N")
cd "$(dirname "$0")/../.."
MP4="out/drama/${S}_ep${NN}.mp4"; COV="out/drama/${S}_ep${NN}_cover.jpg"
[ -f "$MP4" ] && [ -f "$COV" ] || { echo "動画か表紙がない：$MP4"; exit 1; }
PART="${PART:-}"
if [ -n "$PART" ]; then
  [ "$PART" = 1 ] || [ "$PART" = 2 ] || { echo "PART は 1 か 2"; exit 1; }
  CUT="${CUT:?前編・後編の切れ目の秒（CUT=72.4）}"
  SRC="$MP4"; MP4="out/drama/${S}_ep${NN}_p${PART}.mp4"; PCOV="out/drama/${S}_ep${NN}_p${PART}_cover.jpg"
  TOT=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
  if [ "$PART" = 1 ]; then RANGE=(-t "$CUT"); LEN="$CUT"; AF="afade=t=out:st=$(python3 -c "print(max(0,$CUT-0.12))"):d=0.12"
  else RANGE=(-ss "$CUT"); LEN=$(python3 -c "print($TOT-$CUT)"); AF="afade=t=in:st=0:d=0.08"; fi
  python3 -c "import sys;sys.exit(0 if $LEN>=61 else 1)" || { echo "61秒より短い（${LEN}秒）。CUT を見直す"; exit 1; }
  ffmpeg -v error -y -i "$SRC" "${RANGE[@]}" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -af "$AF" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$MP4"
  # 表紙：1話の表紙の右上に 前編／後編 の札
  python3 - "$COV" "$PCOV" "$PART" <<'PY'
import sys, glob
from PIL import Image, ImageDraw, ImageFont
src, dst, part = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert('RGB'); d = ImageDraw.Draw(im)
fs = [f for k in ('NotoSansCJK-Black', 'NotoSansCJK-Bold', 'SansCJK', 'CJK') for f in sorted(glob.glob('/usr/share/fonts/**/*' + k + '*', recursive=True))]
font = ImageFont.truetype(fs[0], 92, index=0) if fs else ImageFont.load_default()
t = '前編' if part == '1' else '後編'
w, h = d.textbbox((0, 0), t, font=font)[2:]
x, y = im.width - w - 110, 120
d.rounded_rectangle((x - 34, y - 22, x + w + 34, y + h + 34), 18, fill=(200, 30, 40))
d.text((x, y), t, font=font, fill=(255, 255, 255))
im.save(dst, quality=95)
PY
  COV="$PCOV"
fi
# 表紙に印を付ける（投稿サーバーは印のある表紙だけを インスタの cover_url・YouTube のサムネイルに使う。中身の絵はそのまま）
python3 -c 'import sys;from PIL import Image;p=sys.argv[1];im=Image.open(p);im.load();assert im.size==(1080,1920),im.size;(b"moshimo-cover" in open(p,"rb").read(4096)) or im.convert("RGB").save(p,quality=95,comment=b"moshimo-cover")' "$COV"
META=$(PART="$PART" node drama/publish/meta.mjs "$S" "$N" "$MP4")
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
git -C "$W" -c user.name="drama-bot" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" commit -qm "post $ID ${S} ep${NN}${PART:+ part$PART}" || true
git -C "$W" push -q origin drama-out
git worktree remove --force "$W"
if [ -z "${NO_DISPATCH:-}" ]; then
  gh api -X POST repos/oishi-thomaz/moshimo-lab/actions/workflows/drama-publish.yml/dispatches -f ref=main -f "inputs[id]=$ID"
  echo "送った：$ID（${S} 第${N}話${PART:+ PART$PART}）"
else echo "置いた：$ID（${S} 第${N}話${PART:+ PART$PART}）"; fi
