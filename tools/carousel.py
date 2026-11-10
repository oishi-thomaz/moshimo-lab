# もしもラボ：人気回をインスタのカルーセル（1080x1350・最大12枚）にする（2026/11/10〜）
# 文字だけの画像は作らない。どのページも動画の3Dの場面（文字なしで撮り直した絵）を全面に敷き、下に字幕を乗せる。1枚目は表紙（タイトルが主役）
#
#   python3 tools/carousel.py plan/carousel/0635.json            → out/carousel/0635/01.jpg 〜
#   （先に絵がなければ node tools/render.mjs --video 0635 --stills <秒,…> --glonly --outdir out/carousel/0635/raw を自動で回す）
#
# plan の形（Claude が回ごとに書く。字幕は動画の SUBS を元に、めくるだけで話がわかるように）：
# { "id": "0635", "series": "男と女のもしも", "title": ["もしも男にも", "生理が", "来たら？"], "sub": "会社が3日で変わった理由",
#   "cover": 13.5, "slides": [{ "t": 8.9, "text": "ある朝、日本中の男に生理が来た。|前の日まで言っていた。" }, …],
#   "end": { "t": 59.0, "ask": "生理の休み、|有給にするべき？", "source": "出典：…" } }
# 文字の | は改行。{…} で囲んだところは黄色（数字や決めの言葉）。囲まなくても数字は自動で黄色にする
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLACK = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
W, H = 1080, 1350
YEL = (255, 214, 70)
COL = {'沼が消えたら': (226, 52, 64), '図星': (226, 52, 64), '男と女のもしも': (250, 110, 160), '大人の本音': (150, 100, 60),
       '人体の限界': (52, 128, 230), '絶滅ボタン': (46, 170, 90), 'お財布のもしも': (240, 160, 30), 'ヤバい順': (130, 70, 200),
       '全員で同時に': (20, 160, 170), '社会の消えたら': (90, 100, 120), 'もしもラボ': (40, 40, 48)}
NUM = re.compile(r'(\d[\d,，.]*\s*(?:億円|万円|兆円|円|億|万|日目|日後|日|時間|分|秒|%|％|人|倍|年|か月|歳|回|本|件|位)?)')


def font(path, size):
    return ImageFont.truetype(path, size, index=0)


def stills(vid, times, raw):
    os.makedirs(raw, exist_ok=True)
    need = [t for t in times if not os.path.exists(os.path.join(raw, f'{vid}_t{t:06.2f}.jpg'))]
    if need:
        subprocess.run(['node', 'tools/render.mjs', '--video', vid, '--stills', ','.join(f'{t:.2f}' for t in need), '--glonly', '--outdir', raw], cwd=ROOT, check=True)
    return {t: Image.open(os.path.join(raw, f'{vid}_t{t:06.2f}.jpg')).convert('RGB') for t in times}


def crop45(im, focus='mid'):
    # 1080x1920 の絵から 1080x1350 を切り出す。細かいもの（人・文字の札）が一番多く入る高さを選ぶ。focus=low は表紙用（上に文字が乗るので、絵の主役を下寄りに）
    g = ImageOps.grayscale(im).resize((270, 480))
    px = g.load()
    rows = [sum(abs(px[x, y] - px[x - 1, y]) + abs(px[x, y] - px[x, y - 1]) for x in range(1, 270)) if y else 0 for y in range(480)]
    win = int(480 * H / 1920)
    best, by = -1, (480 - win) // 2
    for y0 in range(0, 480 - win + 1):
        seg = rows[y0:y0 + win]
        if focus == 'low':  # 表紙：上の45%（タイトルが乗る）はすっきり、下の55%に主役
            s = sum(seg[int(win * 0.45):]) - 1.6 * sum(seg[:int(win * 0.45)])
        else:
            s = sum(seg)
        if focus != 'low': s -= abs((y0 + win / 2) - 240) * 4  # 真ん中寄りを少し好む
        if s > best: best, by = s, y0
    y = int(by * 1920 / 480)
    return im.crop((0, y, 1080, y + H))


def tokens(text):
    # {…} と数字を黄色にした [(文字, 色)] の列。| は改行
    out = []
    for part in re.split(r'(\{[^}]*\})', text):
        if part.startswith('{') and part.endswith('}'):
            out.append((part[1:-1], YEL)); continue
        for p in NUM.split(part):
            if p: out.append((p, YEL if NUM.fullmatch(p) else (255, 255, 255)))
    return out


def wrap(text, f, maxw, d):
    # | で改行。長い行は 、。の後か、助詞の後で折る
    lines = []
    for raw in text.split('|'):
        cur = ''
        for ch in raw:
            if d.textlength((cur + ch).replace('{', '').replace('}', ''), font=f) > maxw and cur:
                cut = max(cur.rfind(c) for c in '、。がをにのはでとへも')
                if cut >= len(cur) * 0.5: lines.append(cur[:cut + 1]); cur = cur[cut + 1:] + ch
                else: lines.append(cur); cur = ch
            else: cur += ch
        if cur: lines.append(cur)
    # {…} が行をまたいだときは両方の行で閉じ直す
    fixed, open_ = [], False
    for ln in lines:
        s = ('{' if open_ else '') + ln
        open_ = s.count('{') > s.count('}')
        fixed.append(s + ('}' if open_ else ''))
    return fixed


def draw_rich(d, x, y, line, f, shadow=True):
    for txt, col in tokens(line):
        if shadow: d.text((x + 3, y + 4), txt, font=f, fill=(0, 0, 0, 170))
        d.text((x, y), txt, font=f, fill=col, stroke_width=3, stroke_fill=(0, 0, 0))
        x += d.textlength(txt, font=f)


def shade(base, top=0.0, bottom=0.52, strength=235):
    # 下（または上）から黒のグラデーション
    col = Image.new('L', (1, H), 0)
    p = col.load()
    for yy in range(H):
        a = 0
        if bottom and yy > H * (1 - bottom): a = int(strength * ((yy - H * (1 - bottom)) / (H * bottom)) ** 1.15)
        if top and yy < H * top: a = max(a, int(strength * ((H * top - yy) / (H * top)) ** 1.3))
        p[0, yy] = a
    ov = col.resize((W, H))
    blk = Image.new('RGB', (W, H), (8, 10, 16))
    return Image.composite(blk, base, ov)


def brand(d):
    f = font(BOLD, 28)
    d.text((W - 48, H - 44), 'もしもラボ', font=f, fill=(255, 255, 255, 150), anchor='rs')


def slide(img, text, n, total):
    im = shade(crop45(img), bottom=0.5)
    d = ImageDraw.Draw(im, 'RGBA')
    f = font(BLACK, 64)
    lines = wrap(text, f, W - 140, d)
    if len(lines) > 4: f = font(BLACK, 56); lines = wrap(text, f, W - 140, d)
    lh = int(f.size * 1.42)
    y = H - 120 - lh * len(lines)
    for ln in lines:
        draw_rich(d, 70, y, ln, f); y += lh
    brand(d)
    return im


def cover(img, plan):
    im = shade(crop45(img, 'low'), top=0.62, bottom=0.3, strength=240)
    d = ImageDraw.Draw(im, 'RGBA')
    name = plan.get('series', 'もしもラボ'); col = COL.get(name, COL['もしもラボ'])
    fp = font(BLACK, 46); w = d.textlength(name, font=fp)
    d.rounded_rectangle([W / 2 - w / 2 - 38, 92, W / 2 + w / 2 + 38, 172], radius=40, fill=col)
    d.text((W / 2, 132), name, font=fp, fill=(255, 255, 255), anchor='mm')
    lines = plan['title']; y = 210
    for i, ln in enumerate(lines):
        size = 140
        while d.textlength(ln, font=font(BLACK, size)) > W - 90: size -= 6
        f = font(BLACK, size)
        d.text((W / 2, y + size / 2), ln, font=f, fill=YEL if i == len(lines) - 1 else (255, 255, 255), anchor='mm', stroke_width=14, stroke_fill=(0, 0, 0))
        y += size + 14
    if plan.get('sub'):  # 副題は下に（主役の顔にかぶらないように）
        fs = font(BLACK, 52); s = plan['sub']; sw = d.textlength(s, font=fs); yb = H - 190
        d.rounded_rectangle([W / 2 - sw / 2 - 34, yb - 46, W / 2 + sw / 2 + 34, yb + 46], radius=14, fill=(255, 255, 255, 240))
        d.text((W / 2, yb), s, font=fs, fill=(20, 20, 26), anchor='mm')
    # めくる案内
    fh = font(BOLD, 34); hint = 'めくって結末まで →'
    d.text((W - 56, H - 56), hint, font=fh, fill=(255, 255, 255), anchor='rs', stroke_width=4, stroke_fill=(0, 0, 0))
    return im


def ending(img, plan, n, total):
    e = plan['end']
    im = crop45(img).filter(ImageFilter.GaussianBlur(10))
    im = shade(im, top=0.0, bottom=1.0, strength=150)
    sharp = crop45(img)
    # 絵は真ん中に枠つきで残す（文字だけのページにしない）
    card = sharp.resize((760, 950)).crop((0, 170, 760, 690))
    m = Image.new('L', card.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, card.size[0] - 1, card.size[1] - 1], radius=36, fill=255)
    im.paste(card, ((W - 760) // 2, 330), m)
    d = ImageDraw.Draw(im, 'RGBA')
    f = font(BLACK, 78); y = 110
    for ln in e['ask'].split('|'):
        d.text((W / 2, y + 40), ln, font=f, fill=(255, 255, 255), anchor='mm', stroke_width=10, stroke_fill=(0, 0, 0)); y += 98
    fb = font(BLACK, 58)
    d.rounded_rectangle([170, 900, W - 170, 1000], radius=50, fill=YEL)
    d.text((W / 2, 950), 'コメントで教えて', font=fb, fill=(20, 20, 26), anchor='mm')
    fs = font(BOLD, 34)
    d.text((W / 2, 1075), '保存して、友だちにも聞いてみて', font=fs, fill=(255, 255, 255), anchor='mm')
    if e.get('source'):
        fz = font(BOLD, 24); src = e['source']
        lines = wrap(src, fz, W - 140, d)
        yy = H - 60 - 34 * len(lines)
        for ln in lines: d.text((W / 2, yy), ln.replace('{', '').replace('}', ''), font=fz, fill=(220, 220, 228), anchor='mm'); yy += 34
    return im


def main(path):
    plan = json.load(open(path))
    vid = plan['id']; out = os.path.join(ROOT, 'out', 'carousel', vid); raw = os.path.join(out, 'raw')
    times = sorted({float(plan['cover'])} | {float(s['t']) for s in plan['slides']} | {float(plan['end']['t'])})
    img = stills(vid, times, raw)
    total = 2 + len(plan['slides'])
    if total > 20: sys.exit('20枚まで')
    pages = [cover(img[float(plan['cover'])], plan)]
    for i, s in enumerate(plan['slides']): pages.append(slide(img[float(s['t'])], s['text'], i + 2, total))
    pages.append(ending(img[float(plan['end']['t'])], plan, total, total))
    for f in os.listdir(out):
        if f.endswith('.jpg'): os.remove(os.path.join(out, f))
    for i, p in enumerate(pages): p.save(os.path.join(out, f'{i + 1:02d}.jpg'), quality=90)
    print(f'{vid}: {len(pages)}枚 → {out}')


if __name__ == '__main__':
    main(sys.argv[1])
