# タイトル当てクイズのカバー（表紙）1080x1920 を作る。2026/11/03 ゆうと決定の型（もしもラボのカバーと同じ作り）
# 上の札：この映画なに？（赤）／このドラマなに？（青）／この曲なに？（緑）。種類は META.title の この映画／このドラマ／この曲 で決める
# 大きい字：答えがわからない程度のキャッチコピー（plan/quiz-covers.json の text。| で改行、最後の行が黄色）
# 使い方：python3 tools/make_quiz_cover.py qNNN 絵.jpg 出力.jpg
#   絵は node tools/render.mjs --video qNNN --stills <plan/quiz-covers.json の t> --glonly --outdir out/cv_qNNN で撮る
import json, re, sys
from PIL import Image, ImageDraw, ImageFont
F = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
KIND = {'映画': ((226, 52, 64), 'この映画なに？'), 'ドラマ': ((52, 128, 230), 'このドラマなに？'), '曲': ((46, 170, 90), 'この曲なに？')}
def font(s): return ImageFont.truetype(F, s, index=0)
def kind(qid):
  src = open(f'engine/videos/{qid}.js', encoding='utf-8').read()
  m = re.search(r"title:\s*'この(映画|ドラマ|曲)", src)
  return m.group(1) if m else '映画'
def make(qid, still):
  lines = json.load(open('plan/quiz-covers.json', encoding='utf-8'))[qid]['text'].split('|')
  size = 164 if len(lines) < 4 else 140
  while max(font(size).getlength(x) for x in lines) > 960: size -= 4
  top = 478 + len(lines) * (size + 12); off = max(380, top - 430)
  src = Image.open(still).convert('RGB').resize((1080, 1920))
  bg = Image.new('RGB', (1080, 1920), (12, 12, 22)); bg.paste(src.crop((0, 0, 1080, 1920 - off)), (0, off))
  g = Image.new('L', (1080, 1920), 0); gd = ImageDraw.Draw(g)
  for y in range(1920): gd.line([(0, y), (1080, y)], fill=int(255 * max(0, min(1, (top + 70 - y) / 230))))
  bg = Image.composite(Image.new('RGB', (1080, 1920), (12, 12, 22)), bg, g); d = ImageDraw.Draw(bg)
  col, name = KIND[kind(qid)]; f = font(68); w = d.textlength(name, font=f)
  d.rounded_rectangle([540 - w / 2 - 48, 330, 540 + w / 2 + 48, 446], radius=58, fill=col); d.text((540, 386), name, font=f, fill=(255, 255, 255), anchor='mm')
  y = 478
  for i, s in enumerate(lines):
    d.text((540, y + size * 0.5), s, font=font(size), fill=(255, 214, 70) if i == len(lines) - 1 else (255, 255, 255), anchor='mm', stroke_width=14, stroke_fill=(0, 0, 0)); y += size + 12
  return bg
if __name__ == '__main__':
  qid, still, out = sys.argv[1:4]
  make(qid, still).save(out, quality=92, comment=b'moshimo-cover')  # 投稿サーバーは moshimo-cover が付いたカバーだけをインスタに付ける
  print('cover', qid, out)
