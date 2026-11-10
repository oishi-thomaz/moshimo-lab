# なにこれ通信：リールの映像（1080x1920・音なし）を作る。reel.mjs から呼ぶ
#   python3 tools/news/reel_compose.py <out/news/<id>> <timeline.json> <video.mp4>
# 画面（2026/11/10）：
#   上　：見出し（ずっと出す。スクロール中の人にも何の話かわかる）＋ブランドの札
#   中央：写真（横いっぱい・ゆっくり寄る／流れる）。後ろは同じ写真のぼかし
#   下　：ナレーションの字幕（声に合わせて切り替え。数字と決めの言葉は黄色）
#   一番下の約300px はインスタのボタンや説明文がかぶるので何も置かない
# 文字だけの画面は作らない（どの瞬間も写真が見えている）
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

W, H, FPS = 1080, 1920, 30
BLACK = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
YEL = (255, 214, 64)
NUM = re.compile(r'(\d[\d,，.]*\s*(?:億円|万円|兆円|円|億|万|日目|日後|日間|日|時間|分|秒|%|％|人|倍|年|か月|歳|回|本|件|位|キロ|km|メートル|m)?)')
PH_Y, PH_H = 640, 760          # 写真の帯
SUB_Y = 1440                    # 字幕の上端


def font(p, s): return ImageFont.truetype(p, s, index=0)


def load(dirp, name):
    im = Image.open(os.path.join(dirp, name)); return ImageOps.exif_transpose(im).convert('RGB')


def fill(im, w, h, fy=0.4):
    s = max(w / im.width, h / im.height); im = im.resize((max(w, round(im.width * s)), max(h, round(im.height * s))), Image.LANCZOS)
    x = (im.width - w) // 2; y = int((im.height - h) * fy)
    return im.crop((x, y, x + w, y + h))


def wrap(text, f, maxw, d):
    out, cur = [], ''
    for ch in text:
        if d.textlength(cur + ch, font=f) > maxw and cur:
            cut = max(cur.rfind(c) for c in '、。がをにのはでとへも')
            if cut >= len(cur) * 0.55: out.append(cur[:cut + 1]); cur = cur[cut + 1:] + ch
            else: out.append(cur); cur = ch
        else: cur += ch
    if cur: out.append(cur)
    return out


def chunks(text, maxlen=30):
    # 字幕の1枚＝2行（30字くらい）まで。。と、で区切る
    parts = [p for p in re.split(r'(?<=[。！？])', text) if p.strip()]
    out = []
    for p in parts:
        while len(p) > maxlen:
            cut = max(p.rfind('、', 0, maxlen), p.rfind('。', 0, maxlen))
            if cut < 8: cut = maxlen - 1
            out.append(p[:cut + 1]); p = p[cut + 1:]
        if p: out.append(p)
    # 短すぎるかけらは前とくっつける
    merged = []
    for c in out:
        if merged and (len(c) < 7 or len(merged[-1]) < 7) and len(merged[-1]) + len(c) <= maxlen + 6: merged[-1] += c
        else: merged.append(c)
    return merged


def rich(d, x, y, line, f, center=False, base=(255, 255, 255)):
    toks = [(p, YEL if NUM.fullmatch(p) else base) for p in NUM.split(line) if p]
    if center: x = x - sum(d.textlength(t, font=f) for t, _ in toks) / 2
    for t, c in toks:
        d.text((x, y), t, font=f, fill=c, stroke_width=6, stroke_fill=(0, 0, 0)); x += d.textlength(t, font=f)


def header(title, brand):
    # 上の見出し（透明のPNG）
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    fb = font(BOLD, 34); bw = d.textlength(brand, font=fb)
    d.rounded_rectangle([60, 120, 60 + bw + 44, 180], radius=30, fill=(255, 214, 64, 255))
    d.text((60 + 22, 150), brand, font=fb, fill=(20, 20, 26), anchor='lm')
    size = 84
    while size > 56 and max(d.textlength(s, font=font(BLACK, size)) for s in title) > W - 120: size -= 2
    f = font(BLACK, size); y = 220
    for i, s in enumerate(title):
        d.text((W / 2, y + size / 2), s, font=f, fill=YEL if i == len(title) - 1 else (255, 255, 255), anchor='mm', stroke_width=8, stroke_fill=(0, 0, 0))
        y += int(size * 1.22)
    return im


def subtitle(text, big=False):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = font(BLACK, 70 if big else 62)
    lines = wrap(text, f, W - 140, d)[:3]
    lh = int(f.size * 1.36); y = SUB_Y
    for ln in lines:
        rich(d, W / 2, y, ln, f, center=True, base=YEL if big else (255, 255, 255)); y += lh
    return im


def main(dirp, tlp, outp):
    tl = json.load(open(tlp))
    photos = [load(dirp, n) for n in tl['photos']]
    total = tl['total']; nf = int(round(total * FPS))
    head = header(tl['title'], tl.get('brand', 'なにこれ通信'))
    # 写真ごとの背景（ぼかし）と、帯に入れる大きめの写真
    bgs = [fill(p, W, H, 0.5).filter(ImageFilter.GaussianBlur(36)) for p in photos]
    bgs = [Image.blend(b, Image.new('RGB', (W, H), (8, 8, 12)), 0.5) for b in bgs]
    bigs = [fill(p, int(W * 1.12), int(PH_H * 1.12), 0.4) for p in photos]
    # 字幕の表（時刻→画像）
    subs = []
    for seg in tl['segs']:
        if seg.get('sub') is False: continue
        cs = chunks(seg['text']) if not seg.get('big') else [seg['text']]
        tot = sum(len(c) for c in cs) or 1; t = seg['vstart']
        for c in cs:
            dd = seg['vdur'] * len(c) / tot
            subs.append((t - 0.05, t + dd, subtitle(c, seg.get('big'))))
            t += dd
    # 次の字幕までは前の字幕を出したまま（ちらつかない）
    for i in range(len(subs) - 1): subs[i] = (subs[i][0], subs[i + 1][0], subs[i][2])
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                             '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', outp], stdin=subprocess.PIPE)
    mask = Image.new('L', (W, PH_H), 0); ImageDraw.Draw(mask).rounded_rectangle([40, 0, W - 41, PH_H - 1], radius=28, fill=255)
    for k in range(nf):
        t = k / FPS
        seg = next((s for s in tl['segs'] if s['start'] <= t < s['start'] + s['dur']), tl['segs'][-1])
        pi = seg['photo']; u = min(1.0, max(0.0, (t - seg['start']) / max(0.1, seg['dur'])))
        frame = bgs[pi].copy()
        big = bigs[pi]; z = 1.0 + 0.10 * u if seg['move'] == 'in' else 1.10 - 0.10 * u  # 寄る／引く
        cw, ch = int(big.width / z * 0.893), int(big.height / z * 0.893)
        pan = {'L': (0.2 + 0.6 * u), 'R': (0.8 - 0.6 * u)}.get(seg.get('pan'), 0.5)
        x0 = int((big.width - cw) * pan); y0 = int((big.height - ch) * 0.45)
        ph = big.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, PH_H), Image.BILINEAR)
        frame.paste(ph, (0, PH_Y), mask)
        frame.paste(head, (0, 0), head)
        for a, b, im in subs:
            if a <= t < b: frame.paste(im, (0, 0), im); break
        proc.stdin.write(frame.tobytes())
    proc.stdin.close(); proc.wait()
    if proc.returncode: sys.exit('ffmpeg で失敗')


if __name__ == '__main__':
    main(*sys.argv[1:4])
