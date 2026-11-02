#!/usr/bin/env python3
# チラつき検出（Zファイティングなど）：連続3コマ A,B,C で「A と C はほぼ同じなのに B だけ違う」画素の割合を測る
#   python3 tools/flicker.py out/flick/0622   （0622_tXX.XX.jpg を時刻順に3枚ずつ）
import sys, glob, re
from PIL import Image, ImageChops
import numpy as np
d = sys.argv[1]; th = float(sys.argv[2]) if len(sys.argv) > 2 else 0.004
fs = sorted(glob.glob(d + '/*_t*.jpg'), key=lambda f: float(re.search(r'_t([\d.]+)\.jpg', f).group(1)))
bad = []
for i in range(0, len(fs) - 2, 3):
    a, b, c = [np.asarray(Image.open(f).convert('L').resize((540, 960)), dtype=np.int16) for f in fs[i:i + 3]]
    ac = np.abs(a - c); ab = np.abs(a - b); bc = np.abs(b - c)
    m = (ac < 10) & (ab > 40) & (bc > 40)
    m[860:, :] = False  # 字幕の出入りは除く…ではなく下の帯（字幕）を除外
    r = m.mean()
    t = float(re.search(r'_t([\d.]+)\.jpg', fs[i]).group(1))
    if r > th: bad.append((t, r))
    print(f'{t:6.2f}s  {r*100:.3f}%' + ('  ← チラつき' if r > th else ''))
n = len(fs) // 3
if n < 20: print(f'NG 撮れたコマが少なすぎる（{n}組）'); sys.exit(1)  # 撮影に失敗しても素通りしないように
print('NG' if bad else 'OK', ' '.join(f'{t:.1f}s' for t, _ in bad))
sys.exit(1 if bad else 0)
