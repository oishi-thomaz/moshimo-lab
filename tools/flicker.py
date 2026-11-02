#!/usr/bin/env python3
# チラつき検出（Zファイティングなど）：連続5コマ x0..x4 で
#   「x0・x2・x4 はほぼ同じ、x1 と x3 もほぼ同じなのに、その2つが違う」＝ 2つの面のあいだを行ったり来たりする画素の割合を測る
# 速く動く細い物（風で飛ぶ粒・広がる輪）や数字のカウントアップは行ったり来たりしないので数えない（2026/11/02：3コマ版はこれを誤検出していた）
#   python3 tools/flicker.py out/flick/0622 [しきい値]   （0622_tXX.XX.jpg を時刻順に5枚ずつ。tools/flicker.sh が作る）
# しきい値 0.001：Zファイティング対策前のエンジンの 0622 は最大2.35%・0532 は最大0.47% で NG、風の粒の 0036 は最大0.09%・輪の 0160 は0.02%で OK
import sys, glob, re
from PIL import Image
import numpy as np
d = sys.argv[1]; th = float(sys.argv[2]) if len(sys.argv) > 2 else 0.001
N = 5
fs = sorted(glob.glob(d + '/*_t*.jpg'), key=lambda f: float(re.search(r'_t([\d.]+)\.jpg', f).group(1)))
L = lambda f: np.asarray(Image.open(f).convert('L').resize((540, 960)), dtype=np.int16)
same = lambda p, q, k=10: np.abs(p - q) < k
diff = lambda p, q: np.abs(p - q) > 40
bad = []
for i in range(0, len(fs) - N + 1, N):
    x = [L(f) for f in fs[i:i + N]]
    m = same(x[0], x[2]) & same(x[2], x[4]) & diff(x[1], x[0]) & diff(x[1], x[2]) & diff(x[3], x[2]) & diff(x[3], x[4]) & same(x[1], x[3], 20)
    r = m.mean()
    t = float(re.search(r'_t([\d.]+)\.jpg', fs[i]).group(1))
    if r > th: bad.append((t, r))
    print(f'{t:6.2f}s  {r*100:.3f}%' + ('  ← チラつき' if r > th else ''))
n = len(fs) // 3
if n < 20: print(f'NG 撮れたコマが少なすぎる（{n}組）'); sys.exit(1)  # 撮影に失敗しても素通りしないように
print('NG' if bad else 'OK', ' '.join(f'{t:.1f}s' for t, _ in bad))
sys.exit(1 if bad else 0)
