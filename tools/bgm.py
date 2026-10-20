#!/usr/bin/env python3
"""もしもラボ BGM generator — original, royalty-free music synthesized from scratch.

usage: python3 bgm.py --mood tension --seed 12 --duration 65 --hits 8.5,45.9 --out bgm.wav
moods: tension / calm / emotional / mystery / hopeful
"""
import argparse, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100

MOODS = {
    #            scale intervals (semitones from root)      progressions (scale degrees, 0-based)                 bpm       bright
    'tension':  dict(minor=True,  progs=[[0, 5, 2, 6], [0, 5, 6, 4], [0, 3, 5, 4]], bpm=(84, 96), bright=0.35, pulse=True,  arp=False, tick=True),
    'mystery':  dict(minor=True,  progs=[[0, 1, 0, 6], [0, 5, 1, 4], [0, 6, 5, 6]], bpm=(70, 80), bright=0.30, pulse=False, arp=True,  tick=False),
    'calm':     dict(minor=False, progs=[[0, 4, 5, 3], [0, 3, 4, 5], [3, 4, 2, 5]], bpm=(76, 88), bright=0.55, pulse=False, arp=True,  tick=False),
    'emotional':dict(minor=False, progs=[[5, 3, 0, 4], [0, 4, 5, 3], [3, 0, 4, 5]], bpm=(66, 76), bright=0.45, pulse=False, arp=True,  tick=False),
    'hopeful':  dict(minor=False, progs=[[0, 4, 5, 3], [3, 4, 0, 0], [0, 5, 3, 4]], bpm=(88, 100), bright=0.6, pulse=True,  arp=True,  tick=False),
}
MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lowpass(x, cutoff):
    sos = butter(2, cutoff / (SR / 2), btype='low', output='sos')
    return sosfilt(sos, x, axis=0)


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    na = min(na, n); nr = min(nr, n - na)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def pad_voice(f, n, rng, bright):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.08, 0.0, 0.08):           # detuned unison
        ff = f * 2 ** (det / 12)
        ph = rng.uniform(0, 2 * np.pi)
        for k in range(1, 7):                # soft saw
            out += np.sin(2 * np.pi * ff * k * t + ph * k) / (k ** (1.6 - bright))
    return out / 9


def pluck(f, n, decay, rng):
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) + 0.12 * np.sin(2 * np.pi * f * 3 * t)
    e = np.exp(-t / decay) * np.minimum(1, t / 0.004)
    return tone * e


def kick(n):
    t = np.arange(n) / SR
    f = 42 + 70 * np.exp(-t / 0.05)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.28)


def tick(n, rng):
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 5000)
    return hp * np.exp(-t / 0.018)


def boom(n, rng):
    t = np.arange(n) / SR
    f = 36 + 90 * np.exp(-t / 0.12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.4)
    nz = lowpass(rng.standard_normal(n), 900) * np.exp(-t / 0.35) * 0.6
    return s + nz


def riser(n, rng):
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    seg = SR // 20
    for i in range(0, n, seg):              # sweep cutoff upward
        c = 300 + 6000 * (i / n) ** 2
        out[i:i + seg] = lowpass(nz[i:i + seg + 2000], c)[:len(out[i:i + seg])]
    return out * (t / t[-1]) ** 2


def impact(rng):
    """強調用の効果音（数字のドン！）：低いドロップ＋アタックのノイズ＋金属のキン。BGMとは別トラックで、ナレーションで下げない"""
    n = int(2.4 * SR); t = np.arange(n) / SR
    f = 30 + 110 * np.exp(-t * 5.0)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    noise = rng.standard_normal(n) * np.exp(-t * 40)
    sos = butter(2, [300 / (SR / 2), 5000 / (SR / 2)], btype='band', output='sos')
    crack = sosfilt(sos, noise)
    ring = sum(np.sin(2 * np.pi * fr * t + rng.random() * 6) * a for fr, a in [(2794, 0.5), (4186, 0.35), (5274, 0.25), (6645, 0.15)]) * np.exp(-t * 4.5)
    sig = 0.9 * sub + 0.55 * crack + 0.22 * ring
    sig[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    return sig / (np.abs(sig).max() or 1)


# ---------- 場面の効果音（META.sfx = [[秒, 種類, 値], ...]）。強調の効果音と同じトラックに入れる ----------
def _env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    k = int(a * SR)
    if k: e[:k] *= np.linspace(0, 1, k)
    return e


def _band(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype='band', output='sos')
    return sosfilt(sos, x)


def sfx_poof(rng):
    """消える音：ふわっと空気が抜けるノイズ＋上がっていくキラキラ"""
    n = int(1.4 * SR); t = np.arange(n) / SR
    air = _band(rng.standard_normal(n), 900, 7000) * _env(n, 0.01, 0.18)
    sw = np.sin(2 * np.pi * np.cumsum(400 + 1800 * (t / t[-1]) ** 0.6) / SR) * _env(n, 0.005, 0.12) * 0.35
    ch = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-(t - d0).clip(0) * 6) * (t > d0) for f, d0 in [(1568, 0.05), (2093, 0.11), (2637, 0.17), (3136, 0.23)]) * 0.18
    sig = air * 0.8 + sw + ch
    return sig / (np.abs(sig).max() or 1)


def sfx_whoosh(rng):
    n = int(0.9 * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n); out = np.zeros(n); seg = SR // 40
    for i in range(0, n, seg):
        c = 250 + 3500 * np.sin(np.pi * i / n) ** 2
        out[i:i + seg] = _band(nz[i:i + seg + 800], max(80, c * 0.5), c * 1.5)[:len(out[i:i + seg])]
    sig = out * np.sin(np.pi * t / t[-1]) ** 2
    return sig / (np.abs(sig).max() or 1)


def sfx_meter(rng, level=0.5):
    """メーターが上がる音：レベルに合わせて高く・長く上がるスイープ＋最後にピン（高いほど不穏）"""
    dur = 0.35 + 1.3 * level; n = int((dur + 0.9) * SR); t = np.arange(n) / SR
    f0 = 180; f1 = 180 * 2 ** (0.4 + 2.2 * level)
    f = np.where(t < dur, f0 + (f1 - f0) * (t / dur) ** 1.5, f1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.where(t < dur, 0.4 + 0.6 * t / dur, np.exp(-(t - dur) * 8))
    ping_f = f1 * (1.0 if level < 0.6 else 1.06)
    ping = (np.sin(2 * np.pi * ping_f * t) + 0.5 * np.sin(2 * np.pi * ping_f * 2.01 * t)) * np.exp(-(t - dur).clip(0) * 5) * (t > dur)
    sig = tone * 0.5 + ping * (0.5 + 0.4 * level)
    return sig / (np.abs(sig).max() or 1)


def sfx_alarm(rng):
    n = int(2.0 * SR); t = np.arange(n) / SR
    f = np.where((t * 4).astype(int) % 2 == 0, 880, 622)
    sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    sig = lowpass_np(sq, 3500) * np.clip(1 - (t - 1.6).clip(0) * 2.5, 0, 1)
    return sig / (np.abs(sig).max() or 1)


def lowpass_np(x, c):
    sos = butter(2, c / (SR / 2), output='sos'); return sosfilt(sos, x)


def sfx_bubble(rng):
    n = int(1.6 * SR); out = np.zeros(n)
    for k in range(9):
        s0 = int(rng.random() * 1.2 * SR); m = int(0.12 * SR); t = np.arange(m) / SR
        f = (300 + rng.random() * 500) * (1 + 3 * t / t[-1])
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)
        out[s0:s0 + m] += b[:len(out[s0:s0 + m])] * (0.5 + rng.random() * 0.5)
    return out / (np.abs(out).max() or 1)


def sfx_buzz(rng):
    n = int(1.1 * SR); t = np.arange(n) / SR
    f = 230 + 12 * np.sin(2 * np.pi * 6 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    sig = lowpass_np(saw, 2200) * (0.6 + 0.4 * np.sin(2 * np.pi * 21 * t)) * np.sin(np.pi * t / t[-1])
    return sig / (np.abs(sig).max() or 1)


def sfx_caw(rng):
    """カラスの声っぽい「カァ」2回（合成）"""
    out = np.zeros(int(1.1 * SR))
    for s0 in (0.0, 0.5):
        n = int(0.32 * SR); t = np.arange(n) / SR
        f = 520 - 120 * t / t[-1]
        saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
        v = _band(saw + 0.3 * rng.standard_normal(n), 700, 2600) * np.sin(np.pi * t / t[-1]) ** 0.6
        i = int(s0 * SR); out[i:i + n] += v
    return out / (np.abs(out).max() or 1)


def sfx_skitter(rng):
    n = int(0.9 * SR); out = np.zeros(n)
    for k in range(40):
        i = int(rng.random() * 0.8 * SR); m = int(0.008 * SR)
        out[i:i + m] += _band(rng.standard_normal(m), 2500, 9000)[:len(out[i:i + m])] * (0.4 + rng.random() * 0.6)
    return out / (np.abs(out).max() or 1)


def sfx_drone(rng):
    n = int(4.0 * SR); t = np.arange(n) / SR
    sig = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 58.3 * t) + 0.3 * np.sin(2 * np.pi * 110.5 * t)) * np.sin(np.pi * t / t[-1]) ** 0.7
    return sig / (np.abs(sig).max() or 1)


SFX = {'poof': (sfx_poof, 0.7), 'whoosh': (sfx_whoosh, 0.45), 'meter': (sfx_meter, 0.55), 'alarm': (sfx_alarm, 0.22), 'bubble': (sfx_bubble, 0.35),
       'buzz': (sfx_buzz, 0.3), 'caw': (sfx_caw, 0.4), 'skitter': (sfx_skitter, 0.35), 'drone': (sfx_drone, 0.55)}


def reverb(x, rng, seconds=2.6, mix=0.32):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t / (seconds / 5))[:, None]
    ir = lowpass(ir, 6000)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1)
    return x * (1 - mix) + wet * mix * 2.2


def place(buf, sig, start, gain=1.0, pan=0.0):
    s = int(start * SR)
    if s >= len(buf): return
    e = min(len(buf), s + len(sig))
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[s:e, 0] += sig[:e - s] * gain * l
    buf[s:e, 1] += sig[:e - s] * gain * r


def generate(mood, seed, duration, hits=(), risers=(), impacts=()):
    M = MOODS[mood]
    rng = np.random.default_rng(seed)
    root = 45 + int(rng.integers(0, 12))       # A2..G#3
    scale = MINOR if M['minor'] else MAJOR
    prog = M['progs'][int(rng.integers(0, len(M['progs'])))]
    bpm = float(rng.uniform(*M['bpm']))
    beat = 60 / bpm
    bar = beat * 4
    chord_len = bar * 2
    n = int(duration * SR)
    buf = np.zeros((n, 2))

    def deg(d, octave=0):
        return root + scale[d % 7] + 12 * (d // 7 + octave)

    t0 = 0.0; ci = 0
    while t0 < duration:
        d = prog[ci % len(prog)]
        notes = [deg(d, 1), deg(d + 2, 1), deg(d + 4, 1)]
        if rng.random() < 0.5: notes.append(deg(d + 6, 1))   # 7th colour
        cn = int((chord_len + 1.2) * SR)
        pad = sum(pad_voice(hz(m), cn, rng, M['bright']) for m in notes) / len(notes)
        pad = lowpass(pad, 900 + 2200 * M['bright']) * env_adsr(cn, 0.9, 1.2)
        place(buf, pad, t0, 0.32, pan=float(rng.uniform(-.3, .3)))
        bass = np.sin(2 * np.pi * hz(deg(d, -1)) * np.arange(cn) / SR) * env_adsr(cn, 0.3, 0.9)
        place(buf, bass, t0, 0.22)
        if M['arp']:
            pattern = [0, 2, 4, 7, 4, 2]
            steps = int(chord_len / (beat / 2))
            for s in range(steps):
                if rng.random() < 0.18: continue
                k = pattern[s % len(pattern)]
                m = deg(d + k, 2)
                place(buf, pluck(hz(m), int(1.6 * SR), 0.45, rng), t0 + s * beat / 2, 0.09, pan=float(rng.uniform(-.6, .6)))
        t0 += chord_len; ci += 1

    if M['pulse']:
        b = 0.0
        while b < duration:
            place(buf, kick(int(0.6 * SR)), b, 0.30)
            b += beat
    if M['tick']:
        b = beat / 2
        while b < duration:
            place(buf, tick(int(0.1 * SR), rng), b, 0.05, pan=0.3)
            b += beat / 2

    buf = reverb(buf, rng)
    for h in hits:
        place(buf, boom(int(3.0 * SR), rng), h, 0.55)
    for rz in risers:
        ln = 1.6
        place(buf, riser(int(ln * SR), rng), max(0, rz - ln), 0.10)

    # 強調の直前に一瞬だけ音楽を引く（ためを作る）
    for im in impacts:
        a, b = int(max(0, im - 0.35) * SR), int(min(duration, im + 0.6) * SR)
        if b > a:
            env = np.ones(b - a); k = int(0.35 * SR); env[:min(k, b - a)] = np.linspace(1, 0.25, min(k, b - a)); env[min(k, b - a):] = np.linspace(0.25, 1, b - a - min(k, b - a))
            buf[a:b] *= env[:, None]

    # duck music around hits so they punch
    fade_in, fade_out = int(1.0 * SR), int(2.5 * SR)
    buf[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    buf[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
    buf = np.tanh(buf * 1.2) / np.tanh(1.2)
    peak = np.abs(buf).max() or 1
    buf = buf / peak * 0.89
    return buf


def write_wav(path, buf):
    data = (np.clip(buf, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--mood', default='tension', choices=list(MOODS))
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--duration', type=float, default=65)
    ap.add_argument('--hits', default='')
    ap.add_argument('--risers', default='')
    ap.add_argument('--impacts', default='')
    ap.add_argument('--sfx-out', default='')
    ap.add_argument('--sfx', default='', help='秒:種類[:値],... 例 7.0:poof,18.8:meter:0.04')
    ap.add_argument('--out', default='bgm.wav')
    a = ap.parse_args()
    f = lambda s: [float(x) for x in s.split(',') if x.strip()]
    write_wav(a.out, generate(a.mood, a.seed, a.duration, f(a.hits), f(a.risers), f(a.impacts)))
    cues = [c.split(':') for c in a.sfx.split(',') if c.strip()]
    if a.sfx_out and (f(a.impacts) or cues):
        rng = np.random.default_rng(a.seed + 99)
        sfx = np.zeros((int(a.duration * SR) + 5 * SR, 2))
        for im in f(a.impacts):
            place(sfx, impact(rng), im, 0.9)
        for c in cues:
            fn, gain = SFX[c[1]]
            sig = fn(rng, float(c[2])) if len(c) > 2 else fn(rng)
            if c[1] == 'meter' and len(c) > 2: gain *= 0.55 + 0.6 * float(c[2])
            place(sfx, sig, float(c[0]), gain, pan=float(rng.uniform(-0.25, 0.25)))
        sfx = reverb(sfx, rng, seconds=1.2, mix=0.18)
        write_wav(a.sfx_out, np.clip(sfx[:int(a.duration * SR)], -1, 1))
    print('wrote', a.out)
