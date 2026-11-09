# ニュースアカウントの投稿画像（1080x1350・4:5）を作る
#   python3 tools/news/render.py out/news            … out/news/<id>/ を全部
#   python3 tools/news/render.py out/news/<id>       … 1本だけ
# 1枚目：写真＋見出し（2〜3行、最後の行が黄色）＋ブランドの札＋出典
# 2枚目から：写真＋話の続きの文字（1枚40〜80字で話が進む）。最後は オチ＋問いかけ＋フォロー（pages がない古い形は写真だけ）
# 小さすぎる写真・ほぼ同じ写真は使わない。使える写真がなければ meta.json に invalid を書く（送らない）
import json, os, sys, glob, re
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

KINSOKU = set('、。，．・：；？！ー」』）】〉》〕…‥ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ')
def wrap(text, f, width):
  out = []
  for para in str(text).split('\n'):
    line = ''
    toks = re.findall(r'[A-Za-z0-9.,%〜~\-]+|.', para)   # 数字や英単語の途中では改行しない
    for t in toks:
      if f.getlength(line + t) > width and line:
        if t in KINSOKU: line += t; continue   # 句読点などは行頭に置かない（ぶら下げ）
        out.append(line); line = t
      else: line += t
    out.append(line)
  return [l for l in out if l.strip()]

def page(im, text, brand, k, n, fy):
  # 上：写真（切り取る位置を回ごとに変える）／下：文字のパネル
  PH = 760
  photo = cover_crop(im, W, PH, fy)
  img = Image.new('RGB', (W, H), (14, 14, 20)); img.paste(photo, (0, 0))
  g = Image.new('L', (W, H), 0); gd = ImageDraw.Draw(g)
  for y in range(PH - 160, PH): gd.line([(0, y), (W, y)], fill=int(255 * (y - (PH - 160)) / 160))
  img = Image.composite(Image.new('RGB', (W, H), (14, 14, 20)), img, g)
  o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(o)
  pill(d, (48, 48), brand, font(BOLD, 30))
  size = 52
  while True:
    f = font(BOLD, size); ls = wrap(text, f, 940)
    if len(ls) * int(size * 1.55) <= 470 or size <= 40: break
    size -= 2
  lh = int(size * 1.55); top = PH + max(20, (520 - lh * len(ls)) // 2) - 10
  for i, l in enumerate(ls): d.text((70, top + i * lh), l, font=f, fill=(255, 255, 255))
  d.rectangle([70, PH - 6, 190, PH - 0], fill=YELLOW)
  d.text((W - 60, H - 52), f'{k}/{n}', font=font(BOLD, 28), fill=(255, 255, 255, 140), anchor='ra')
  return Image.alpha_composite(img.convert('RGBA'), o).convert('RGB')

def text_page(im, text, brand, k, n):
  # 写真が足りないページ：同じ写真をぼかして暗くした背景に、文字を大きく真ん中に
  img = cover_crop(im, W, H, 0.5).filter(ImageFilter.GaussianBlur(36))
  img = Image.blend(img, Image.new('RGB', (W, H), (10, 10, 16)), 0.7)
  o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(o)
  pill(d, (48, 48), brand, font(BOLD, 30))
  size = 60
  while True:
    f = font(BOLD, size); ls = wrap(text, f, 900)
    if len(ls) * int(size * 1.6) <= 700 or size <= 44: break
    size -= 2
  lh = int(size * 1.6); top = (H - lh * len(ls)) // 2
  d.rectangle([90, top - 60, 210, top - 52], fill=YELLOW)
  for i, l in enumerate(ls): d.text((90, top + i * lh), l, font=f, fill=(255, 255, 255))
  d.text((W - 60, H - 52), f'{k}/{n}', font=font(BOLD, 28), fill=(255, 255, 255, 140), anchor='ra')
  return Image.alpha_composite(img.convert('RGBA'), o).convert('RGB')

def end_page(im, punch, ask, brand, k, n):
  img = cover_crop(im, W, H, 0.5).filter(ImageFilter.GaussianBlur(28))
  img = Image.blend(img, Image.new('RGB', (W, H), (8, 8, 12)), 0.62)
  o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(o)
  y = 330
  if punch:
    f = font(BLACK, 64); ls = wrap(punch, f, 920)
    for l in ls: d.text((W / 2, y), l, font=f, fill=YELLOW, anchor='mm'); y += 90
    y += 60
  if ask:
    f = font(BOLD, 50); ls = wrap(ask, f, 900)
    for l in ls: d.text((W / 2, y), l, font=f, fill=(255, 255, 255), anchor='mm'); y += 76
    d.text((W / 2, y + 30), 'コメントで教えてください', font=font(BOLD, 34), fill=(255, 255, 255, 170), anchor='mm')
  d.rounded_rectangle([200, 1010, 880, 1120], radius=55, fill=YELLOW)
  d.text((W / 2, 1065), 'フォローで毎日 世界のへぇ', font=font(BLACK, 44), fill=(16, 18, 28), anchor='mm')
  d.text((W / 2, 1180), brand, font=font(BOLD, 34), fill=(255, 255, 255, 200), anchor='mm')
  d.text((W - 60, H - 52), f'{k}/{n}', font=font(BOLD, 28), fill=(255, 255, 255, 140), anchor='ra')
  return Image.alpha_composite(img.convert('RGBA'), o).convert('RGB')

def one(dirp):
  mp = os.path.join(dirp, 'meta.json')
  if not os.path.exists(mp): return
  meta = json.load(open(mp, encoding='utf-8'))
  ims, hs, src_no = [], [], []
  for no, fn in enumerate(meta.get('srcFiles', []), 1):
    im = load(os.path.join(dirp, fn))
    if im is None: continue
    h = ahash(im)
    if any(near(h, x) for x in hs): print('  同じ写真', fn); continue
    ims.append(im); hs.append(h); src_no.append(meta.get('srcOrder', list(range(1, 99)))[no - 1] if meta.get('srcOrder') else no)
  if not ims:
    meta['invalid'] = '使える写真がない'; json.dump(meta, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=2); print('×', meta['id'], '使える写真がない'); return
  # 1枚目に向く写真：横長すぎず大きいもの
  def good(im): r = im.width / im.height; return (0.55 < r < 1.6) * 2 + min(im.width, 2000) / 1000
  first = max(range(len(ims)), key=lambda i: good(ims[i]) - i * 1.5)
  if meta.get('coverImg') in src_no: first = src_no.index(meta['coverImg'])
  order = [first] + [i for i in range(len(ims)) if i != first]
  brand = meta.get('brand', '')
  slides = [cover(ims[first], meta['title'], brand, meta['source']['site'])]
  pages = [p for p in meta.get('pages', []) if str(p).strip()]
  if pages:
    # 2枚目から：写真＋話の続き（1枚ずつ話が進む）。写真は1枚1回だけ。足りないページは写真をぼかした背景に文字だけ
    n = 1 + len(pages) + 1
    rest = order[1:]   # 表紙に使っていない写真。1枚1回だけ使う
    # pageImg：ページごとに使う写真（candidates の imgs の何番目か。1から。0／なしは文字だけ）。指定があればそれに合わせ、ない回は順番に
    want = meta.get('pageImg') or []
    by_no = {no: i for i, no in enumerate(src_no)}
    used = {first}
    plan = []
    for k in range(len(pages)):
      w = want[k] if k < len(want) else None
      if w is not None:
        i = by_no.get(w)
        plan.append(i if i is not None and i not in used else None)
        if plan[-1] is not None: used.add(plan[-1])
      else: plan.append('auto')
    free = [i for i in rest if i not in used]
    for k, t in enumerate(pages):
      i = plan[k]
      if i == 'auto': i = free.pop(0) if free else None
      slides.append(page(ims[i], t, brand, k + 2, n, 0.35) if i is not None else text_page(ims[order[0]], t, brand, k + 2, n))
    slides.append(end_page(ims[order[-1]], meta.get('punch', ''), meta.get('ask', ''), brand, n, n))
  else:
    for i in order[:4]: slides.append(plain(ims[i], brand))
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
