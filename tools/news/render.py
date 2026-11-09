# ニュースアカウントの投稿画像（1080x1350・4:5）を作る
#   python3 tools/news/render.py out/news            … out/news/<id>/ を全部
#   python3 tools/news/render.py out/news/<id>       … 1本だけ
# 1枚目：写真＋見出し（2〜3行、最後の行が黄色）＋ブランドの札＋出典
# 2枚目から：写真を切らずに全体を見せる（背景はぼかした同じ写真）
# 小さすぎる写真・ほぼ同じ写真は使わない。使える写真がなければ meta.json に invalid を書く（送らない）
import json, os, sys, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageStat

W, H = 1080, 1350
BLACK = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
if not os.path.exists(BOLD): BOLD = BLACK
YELLOW = (255, 214, 64)
def font(path, s): return ImageFont.truetype(path, s, index=0)

def load(p):
  try:
    im = Image.open(p); im = ImageOps.exif_transpose(im).convert('RGB')
  except Exception as e:
    print('  読めない', p, e); return None
  if im.width < 500 or im.height < 380: print('  小さい', os.path.basename(p), im.size); return None
  r = im.width / im.height
  if r > 3 or r < 0.33: print('  細長い', os.path.basename(p), im.size); return None
  st = ImageStat.Stat(im.convert('L'))
  if st.stddev[0] < 12: print('  ほぼ無地', os.path.basename(p)); return None
  return im

def ahash(im):
  g = im.convert('L').resize((12, 12)); px = list(g.tobytes()); m = sum(px) / len(px)
  return [1 if x > m else 0 for x in px]
def near(a, b): return sum(x != y for x, y in zip(a, b)) < 14

def cover_crop(im, w, h, fy=0.38):
  s = max(w / im.width, h / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
  x = (im.width - w) // 2; y = int(max(0, min(im.height - h, (im.height - h) * fy)))
  return im.crop((x, y, x + w, y + h))

def contain(im):
  bg = cover_crop(im, W, H, 0.5).filter(ImageFilter.GaussianBlur(40))
  bg = Image.blend(bg, Image.new('RGB', (W, H), (8, 8, 12)), 0.45)
  s = min(W / im.width, H / im.height); fg = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
  bg.paste(fg, ((W - fg.width) // 2, (H - fg.height) // 2)); return bg

def gradient(img, top, bottom, a0=0, a1=235):
  g = Image.new('L', (W, H), 0); d = ImageDraw.Draw(g)
  for y in range(top, H):
    t = min(1, (y - top) / max(1, bottom - top)); d.line([(0, y), (W, y)], fill=int(a0 + (a1 - a0) * (t ** 1.4)))
  return Image.composite(Image.new('RGB', (W, H), (6, 6, 10)), img, g)

def pill(d, xy, text, f, fill=(0, 0, 0, 150), color=(255, 255, 255)):
  x, y = xy; tw = d.textlength(text, font=f); h = f.size + 22
  d.rounded_rectangle([x, y, x + tw + 44, y + h], radius=h // 2, fill=fill); d.text((x + 22, y + h / 2), text, font=f, fill=color, anchor='lm')

def cover(im, lines, brand, site):
  img = cover_crop(im, W, H, 0.35)
  n = len(lines); size = 96 if n <= 2 else 86
  while size > 54 and max(font(BLACK, size).getlength(s) for s in lines) > 960: size -= 2
  f = font(BLACK, size); lh = int(size * 1.22)
  bottom = 1236; top = bottom - lh * n
  img = gradient(img, max(300, top - 330), top + 40)
  o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(o)
  pill(d, (48, 48), brand, font(BOLD, 34))
  for i, s in enumerate(lines):
    y = top + i * lh + lh / 2
    col = YELLOW if i == n - 1 else (255, 255, 255)
    d.text((W / 2 + 3, y + 4), s, font=f, fill=(0, 0, 0, 170), anchor='mm')
    d.text((W / 2, y), s, font=f, fill=col, anchor='mm', stroke_width=3, stroke_fill=(0, 0, 0, 200))
  d.text((W / 2, 1292), f'出典 {site}', font=font(BOLD, 26), fill=(255, 255, 255, 170), anchor='mm')
  return Image.alpha_composite(img.convert('RGBA'), o).convert('RGB')

def plain(im, brand):
  img = contain(im).convert('RGBA'); o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(o)
  f = font(BOLD, 26); tw = d.textlength(brand, font=f)
  d.text((W - 36 - tw, H - 52), brand, font=f, fill=(255, 255, 255, 150))
  return Image.alpha_composite(img, o).convert('RGB')

def one(dirp):
  mp = os.path.join(dirp, 'meta.json')
  if not os.path.exists(mp): return
  meta = json.load(open(mp, encoding='utf-8'))
  ims, hs = [], []
  for fn in meta.get('srcFiles', []):
    im = load(os.path.join(dirp, fn))
    if im is None: continue
    h = ahash(im)
    if any(near(h, x) for x in hs): print('  同じ写真', fn); continue
    ims.append(im); hs.append(h)
  if not ims:
    meta['invalid'] = '使える写真がない'; json.dump(meta, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=2); print('×', meta['id'], '使える写真がない'); return
  # 1枚目に向く写真：横長すぎず大きいもの
  def good(im): r = im.width / im.height; return (0.55 < r < 1.6) * 2 + min(im.width, 2000) / 1000
  first = max(range(len(ims)), key=lambda i: good(ims[i]) - i * 1.5)
  order = [first] + [i for i in range(len(ims)) if i != first]
  slides = [cover(ims[first], meta['title'], meta.get('brand', ''), meta['source']['site'])]
  for i in order[:4]: slides.append(plain(ims[i], meta.get('brand', '')))
  names = []
  for k, s in enumerate(slides, 1):
    fn = f"{meta['id']}_{k}.jpg"; s.save(os.path.join(dirp, fn), 'JPEG', quality=90, optimize=True, progressive=False); names.append(fn)
  meta['slides'] = names; meta.pop('invalid', None)
  json.dump(meta, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
  print('○', meta['id'], len(names), '枚')

if __name__ == '__main__':
  p = sys.argv[1] if len(sys.argv) > 1 else 'out/news'
  dirs = [p] if os.path.exists(os.path.join(p, 'meta.json')) else sorted(glob.glob(os.path.join(p, '*/')))
  for d in dirs: one(d.rstrip('/'))
