#!/usr/bin/env python3
"""いつわ劇場 音まわり：声の並べ替え・効果音・BGM をすべて自前で作る（著作権フリー）

usage: python3 drama/tools/audio.py --meta out/drama/ep01.json --tts tts/tower_ep01 --out out/drama/ep01
  -> <out>_voice.wav / <out>_sfx.wav / <out>_bgm.wav
"""
import argparse, json, os, subprocess, wave, tempfile
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000


def bp(x, lo=None, hi=None, order=2):
    if lo and hi: sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype='band', output='sos')
    elif lo: sos = butter(order, lo / (SR / 2), btype='high', output='sos')
    else: sos = butter(order, hi / (SR / 2), btype='low', output='sos')
    return sosfilt(sos, x, axis=0)


def env(n, a=0.005, d=0.3, curve=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4)) ** curve
    return e


def noise(n, rng): return rng.standard_normal(n)
def brown(n, rng):
    x = np.cumsum(rng.standard_normal(n)); x = x - np.convolve(x, np.ones(4801) / 4801, mode='same'); return x / (np.abs(x).max() + 1e-9)
def sine(f, n, ph=0): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, (n,))) / SR + ph)
def st(x, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.41, x * r * 1.41], axis=1)
def norm(x, p=0.9): return x / (np.abs(x).max() + 1e-9) * p


def reverb(x, rng, sec=1.8, mix=0.3, lp=5000):
    n = int(sec * SR); t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t / (sec / 5))[:, None]; ir = bp(ir, hi=lp); ir /= np.sqrt((ir ** 2).sum(axis=0))
    if x.ndim == 1: x = st(x)
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1)
    return x * (1 - mix) + wet * mix * 2


# ---------------- 効果音 ----------------
def fx_hit(rng, e):
    n = int(2.5 * SR); t = np.arange(n) / SR
    body = sine(55 * np.exp(-t * 3) + 30, n) * env(n, 0.002, 0.7)
    sub = bp(noise(n, rng), hi=400) * env(n, 0.001, 0.25) * 0.6
    return reverb(st(norm(body + sub)), rng, 2.2, 0.35)
def fx_impact(rng, e):
    n = int(3.2 * SR); t = np.arange(n) / SR
    boom = sine(48 * np.exp(-t * 2) + 28, n) * env(n, 0.002, 1.1)
    crack = bp(noise(n, rng), 800, 6000) * env(n, 0.001, 0.08)
    metal = sum(sine(f, n) * env(n, 0.001, 0.9 + k * 0.3) / (k + 1) for k, f in enumerate([233, 311, 467, 622]))
    return reverb(st(norm(boom * 1.0 + crack * 0.5 + metal * 0.12)), rng, 3, 0.4)
def fx_stinger(rng, e):
    n = int(5 * SR); t = np.arange(n) / SR
    a = np.zeros((n, 2)); im = fx_impact(rng, e)[:n]; a[:len(im)] = im
    cl = sum(sine(f * (1 + 0.003 * np.sin(t * 5 + k)), n) for k, f in enumerate([92.5, 98, 138.6, 196, 207.7, 277.2]))
    cl = bp(cl, hi=2500) * env(n, 0.01, 2.2) * 0.25
    out = a + reverb(st(cl), rng, 3, 0.5)
    return out
def fx_wind(rng, e):
    n = int(e.get('dur', 6) * SR); t = np.arange(n) / SR
    x = bp(noise(n, rng), 200, 1200) * (0.5 + 0.5 * np.sin(t * 0.7) ** 2) + bp(noise(n, rng), 1500, 4000) * 0.15 * (0.5 + 0.5 * np.sin(t * 1.3 + 1))
    f = np.minimum(1, t / 1.5) * np.minimum(1, (t[-1] - t) / 1.5)
    return st(norm(x) * f * 0.6, 0.0)
def fx_roomtone(rng, e):
    n = int(e.get('dur', 6) * SR); t = np.arange(n) / SR
    x = bp(noise(n, rng), 60, 400) * 0.4 + sine(50, n) * 0.05
    return st(norm(x) * np.minimum(1, t / 1) * np.minimum(1, (t[-1] - t) / 1) * 0.4)
def fx_alert(rng, e):
    n = int(e.get('dur', 1.6) * SR); t = np.arange(n) / SR
    tone = np.where((t * 4) % 1 < 0.5, sine(880, n), sine(1175, n))
    gate = ((t * 8) % 1 < 0.8).astype(float)
    vib = bp(noise(n, rng), 120, 300) * (np.sin(t * 2 * np.pi * 6) > 0) * 0.6
    return st(norm(tone * gate * 0.6 + vib) * 0.8)
def fx_quake(rng, e):
    dur = e.get('dur', 9); n = int(dur * SR); t = np.arange(n) / SR
    shape = np.minimum(1, t / 0.6) * (0.75 + 0.25 * np.sin(t * 1.3)) * np.minimum(1, (dur - t) / 2.5)
    rum = brown(n, rng) * 1.0 + bp(noise(n, rng), 30, 120) * 2
    rum = bp(rum, hi=160) * shape
    out = st(norm(rum))
    # 食器・家具のカタカタ
    for i in range(int(dur * 9)):
        s = rng.uniform(0.2, dur - 1.0); m = int(0.06 * SR); f = rng.uniform(1800, 5200)
        c = sine(f, m) * env(m, 0.0005, 0.012) + bp(noise(m, rng), 2000, 8000) * env(m, 0.0005, 0.008) * 0.6
        k = int(s * SR); g = shape[k] * rng.uniform(0.05, 0.16)
        out[k:k + m] += st(c * g, rng.uniform(-0.7, 0.7))[: len(out) - k]
    # きしみ
    for s in (1.5, 4.2, 6.6):
        if s > dur - 1: continue
        m = int(1.2 * SR); tt = np.arange(m) / SR
        cr = bp(np.sign(sine(90 + 40 * np.sin(tt * 3), m)) * 0.5 + noise(m, rng) * 0.2, 200, 1500) * env(m, 0.2, 0.5) * 0.25
        k = int(s * SR); out[k:k + m] += st(cr, rng.uniform(-0.5, 0.5))[: len(out) - k]
    return out
def fx_scrape(rng, e):
    n = int(e.get('dur', 1.2) * SR); t = np.arange(n) / SR
    x = bp(noise(n, rng), 300, 2500) * (0.6 + 0.4 * np.sin(t * 2 * np.pi * 23)) * np.minimum(1, t / 0.1) * np.minimum(1, (t[-1] - t) / 0.2)
    thud = sine(70, n) * env(n, 0.002, 0.15) * 0
    end = np.zeros(n); m = int(0.4 * SR); end[-m:] = sine(60, m) * env(m, 0.001, 0.12)
    return st(norm(x * 0.7 + end), 0.3)
def fx_powerdown(rng, e):
    n = int(2.0 * SR); t = np.arange(n) / SR
    hum = sine(120 * np.exp(-t * 1.2), n) * np.exp(-t * 1.5) * 0.5 + sine(60 * np.exp(-t * 1.2), n) * np.exp(-t * 1.5) * 0.4
    click = bp(noise(n, rng), 1000, 6000) * env(n, 0.0005, 0.01)
    thunk = sine(45, n) * env(n, 0.001, 0.25)
    return reverb(st(norm(hum + click * 0.8 + thunk)), rng, 1.5, 0.3)
def fx_clunk(rng, e):
    n = int(1.6 * SR); t = np.arange(n) / SR
    x = sine(70, n) * env(n, 0.001, 0.2) + bp(noise(n, rng), 200, 1200) * env(n, 0.001, 0.05) + sum(sine(f, n) * env(n, 0.001, 0.4) * 0.15 for f in (410, 655))
    return reverb(st(norm(x)), rng, 1.6, 0.35)
def fx_ticks(rng, e):
    n = int(e.get('dur', 2.5) * SR); out = np.zeros(n)
    k = 0.0; step = 0.12
    while k < e.get('dur', 2.5) - 0.05:
        m = int(0.03 * SR); s = int(k * SR); out[s:s + m] += sine(2200, m) * env(m, 0.0005, 0.006)
        k += step; step = max(0.045, step * 0.93)
    return st(out * 0.6)
def fx_stamp(rng, e):
    n = int(1 * SR); x = sine(90, n) * env(n, 0.001, 0.08) + bp(noise(n, rng), 300, 3000) * env(n, 0.0005, 0.03)
    return reverb(st(norm(x)), rng, 0.8, 0.2)
def water(rng, n, amt):
    x = bp(noise(n, rng), 400, 6000) * 0.6 + bp(noise(n, rng), 1500, 9000) * 0.4
    return x * amt
def fx_faucet(rng, e):
    n = int(e.get('dur', 4) * SR); t = np.arange(n) / SR
    amt = np.minimum(1, t / 0.3) * np.minimum(1, (t[-1] - t) / 0.6)
    squeak = np.zeros(n); m = int(0.25 * SR); squeak[:m] = sine(900 + 400 * np.arange(m) / m, m) * env(m, 0.01, 0.1) * 0.2
    return st(norm(water(rng, n, amt) + squeak) * 0.7)
def fx_sputter(rng, e):
    n = int(e.get('dur', 2) * SR); t = np.arange(n) / SR
    gate = (np.sin(t * 2 * np.pi * (3 + 6 * t)) > 0.3 - t * 0.4).astype(float) * np.exp(-t * 1.1)
    gate = np.convolve(gate, np.ones(400) / 400, mode='same')
    air = bp(noise(n, rng), 200, 900) * gate * 0.4
    return st(norm(water(rng, n, gate) + air) * 0.7)
def drip(rng, f=None):
    m = int(0.25 * SR); tt = np.arange(m) / SR; f = f or rng.uniform(900, 1500)
    return sine(f * (1 + 2.5 * np.exp(-tt * 40)), m) * env(m, 0.0008, 0.035)
def fx_drips(rng, e):
    dur = e.get('dur', 4); n = int(dur * SR); out = np.zeros((n, 2)); k = 0.1
    while k < dur - 0.3:
        s = int(k * SR); d = drip(rng); out[s:s + len(d)] += st(d * rng.uniform(0.4, 0.8), rng.uniform(-0.4, 0.4))[: n - s]; k += rng.uniform(0.35, 0.9)
    return reverb(out, rng, 1.2, 0.35)
def knock1(rng):
    m = int(0.35 * SR); tt = np.arange(m) / SR
    body = sum(sine(f, m) * np.exp(-tt * d) * a for f, d, a in ((130, 22, 1), (210, 30, 0.6), (510, 45, 0.3), (1340, 60, 0.12)))
    tick = bp(noise(m, rng), 800, 5000) * env(m, 0.0003, 0.006)
    return body + tick * 0.6
def fx_knock(rng, e):
    n = int(1.4 * SR); out = np.zeros(n)
    for i in range(e.get('n', 3)):
        s = int((0.05 + i * 0.27) * SR); k = knock1(rng) * (1 - i * 0.06); out[s:s + len(k)] += k[: n - s]
    return reverb(st(norm(out)), rng, 0.9, 0.25)
def fx_ding(rng, e):
    n = int(1.5 * SR); x = sine(1568, n) * env(n, 0.002, 0.5) * 0.6 + sine(2093, n) * env(n, 0.002, 0.3) * 0.3
    return reverb(st(x), rng, 1.5, 0.3)
def fx_splash(rng, e):
    n = int(1.5 * SR); t = np.arange(n) / SR
    x = bp(noise(n, rng), 300, 4000) * env(n, 0.01, 0.35) + sine(80, n) * env(n, 0.002, 0.1) * 0.5
    return reverb(st(norm(x) * 0.7), rng, 1, 0.3)
def fx_rustle(rng, e):
    n = int(e.get('dur', 1) * SR); t = np.arange(n) / SR
    g = np.abs(bp(noise(n, rng), hi=12)) ; g = g / (g.max() + 1e-9)
    x = bp(noise(n, rng), 2500, 10000) * g * np.minimum(1, t / 0.05) * np.minimum(1, (t[-1] - t) / 0.2)
    return st(norm(x) * 0.6, -0.2)
def fx_tear(rng, e):
    dur = e.get('dur', 1.5); n = int(dur * SR); out = np.zeros(n)
    k = 0.05
    while k < dur - 0.3:
        m = int(rng.uniform(0.12, 0.25) * SR); s = int(k * SR); tt = np.arange(m) / SR
        x = bp(noise(m, rng), 1500, 8000) * (np.abs(np.sin(tt * 2 * np.pi * 70)) ** 2) * np.sin(np.pi * tt / tt[-1])
        out[s:s + m] += x[: n - s]; k += rng.uniform(0.25, 0.45)
    return st(norm(out) * 0.6, 0.2)
def fx_chime(rng, e):
    n = int(2.4 * SR); out = np.zeros(n)
    for i, f in enumerate([659.3, 523.3]):
        s = int(i * 0.55 * SR); m = n - s; tt = np.arange(m) / SR
        b = (sine(f, m) + 0.4 * sine(f * 2, m) + 0.15 * sine(f * 3.01, m)) * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.004)
        out[s:] += b
    return reverb(st(norm(out) * 0.7), rng, 2.4, 0.45)
def fx_flushes(rng, e):
    dur = e.get('dur', 3.5); n = int(dur * SR); out = np.zeros((n, 2))
    for i in range(10):
        s = rng.uniform(0, dur - 1.2); m = int(1.1 * SR); tt = np.arange(m) / SR
        x = bp(noise(m, rng), 200, 2500) * np.sin(np.pi * tt / tt[-1]) * rng.uniform(0.15, 0.4)
        k = int(s * SR); out[k:k + m] += st(x, rng.uniform(-0.8, 0.8))[: n - k]
    return reverb(bp(out, hi=2500), rng, 1.6, 0.4)
def fx_chain(rng, e):
    n = int(1.0 * SR); out = np.zeros(n)
    for i in range(14):
        s = int(rng.uniform(0, 0.55) * SR); m = int(0.12 * SR); f = rng.uniform(3000, 7000)
        out[s:s + m] += (sine(f, m) + sine(f * 1.37, m) * 0.6) * env(m, 0.0003, 0.02) * rng.uniform(0.3, 1)
    return reverb(st(norm(out) * 0.6), rng, 0.7, 0.2)
def fx_heartbeat(rng, e):
    dur = e.get('dur', 3.5); n = int(dur * SR); out = np.zeros(n); k = 0.0
    while k < dur - 0.4:
        for off, a in ((0, 1), (0.24, 0.7)):
            m = int(0.25 * SR); tt = np.arange(m) / SR; s = int((k + off) * SR)
            b = sine(52, m) * np.exp(-tt * 18) * a
            out[s:s + m] += b[: n - s]
        k += 0.82
    return st(norm(bp(out, hi=200)) * 0.9)
def fx_steps(rng, e):
    dur = e.get('dur', 1.8); n = int(dur * SR); out = np.zeros(n); k = 0.05; i = 0
    while k < dur - 0.2:
        m = int(0.2 * SR); tt = np.arange(m) / SR
        st_ = (sine(90, m) * np.exp(-tt * 35) + bp(noise(m, rng), 400, 3000) * np.exp(-tt * 60) * 0.4) * (1 - k / dur * 0.85)
        s = int(k * SR); out[s:s + m] += st_[: n - s]; k += 0.42; i += 1
    return reverb(st(norm(out) * 0.7, 0.5), rng, 1.6, 0.45)
def fx_zapoff(rng, e):
    n = int(0.9 * SR); t = np.arange(n) / SR
    x = sine(300 * np.exp(-t * 5) + 40, n) * np.exp(-t * 4) * 0.6 + bp(noise(n, rng), 2000, 7000) * env(n, 0.0005, 0.02)
    return st(norm(x) * 0.6)

FX = {k[3:]: v for k, v in globals().items() if k.startswith('fx_')}


# ---------------- BGM（区間ごとの雰囲気） ----------------
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def pad(freqs, n, rng, bright=0.3, detune=0.1):
    t = np.arange(n) / SR; out = np.zeros(n)
    for f in freqs:
        for d in (-detune, 0, detune):
            ff = f * 2 ** (d / 12); ph = rng.uniform(0, 6.28)
            for k in range(1, 6): out += np.sin(2 * np.pi * ff * k * t + ph * k) / (k ** (1.8 - bright))
    return bp(out, hi=600 + 2500 * bright) / (len(freqs) * 3)
def pluck(f, n, decay=0.8):
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)) * np.exp(-t / decay) * np.minimum(1, t / 0.003)

def mood_track(mood, dur, rng):
    n = int(dur * SR); out = np.zeros((n, 2)); t = np.arange(n) / SR
    if mood == 'silence': return out
    root = 45  # A2
    if mood in ('dread', 'suspense'):
        dr = pad([hz(root - 12), hz(root - 5), hz(root + 1)], n, rng, 0.15, 0.15) * (0.7 + 0.3 * np.sin(t * 0.4))
        out += st(dr * 1.0)
        if mood == 'suspense':
            # 心拍のようなパルス＋高い不協和音
            k = 0.0
            while k < dur:
                m = int(0.3 * SR); tt = np.arange(m) / SR; s = int(k * SR)
                p = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 14) * 0.8; out[s:s + m] += st(p)[: n - s]
                k += 0.75
            hi = (np.sin(2 * np.pi * hz(root + 36) * t) + np.sin(2 * np.pi * hz(root + 37) * t)) * 0.03 * np.minimum(1, t / 4)
            out += st(hi, 0.3)
    if mood == 'tension':
        dr = pad([hz(root - 12), hz(root - 9), hz(root - 5)], n, rng, 0.3) * 0.8
        out += st(dr)
        k = 0.0; step = 60 / 96 / 2; i = 0
        while k < dur:
            m = int(0.18 * SR); tt = np.arange(m) / SR; s = int(k * SR)
            f = hz(root - 12 + (0 if i % 8 < 6 else 3))
            p = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 12) * (0.9 if i % 2 == 0 else 0.5)
            out[s:s + m] += st(p)[: n - s]
            if i % 4 == 2:
                tk = bp(rng.standard_normal(m), 4000, 9000) * np.exp(-tt * 80) * 0.15; out[s:s + m] += st(tk, 0.4)[: n - s]
            k += step; i += 1
    if mood in ('calm', 'ending', 'uneasy', 'mystery'):
        if mood == 'calm': prog = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 64]]; br = 0.45
        elif mood == 'ending': prog = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]]; br = 0.3
        elif mood == 'uneasy': prog = [[57, 60, 63], [56, 59, 63], [57, 60, 63], [53, 56, 60]]; br = 0.25
        else: prog = [[57, 60, 64], [58, 61, 65], [57, 60, 64], [55, 58, 62]]; br = 0.25
        cl = 3.2 if mood != 'calm' else 2.6
        k = 0.0; ci = 0
        while k < dur:
            ch = prog[ci % len(prog)]; m = int((cl + 1.5) * SR); s = int(k * SR)
            pd = pad([hz(x - 12) for x in ch], m, rng, br) * np.minimum(1, np.arange(m) / SR / 0.8) * np.minimum(1, (m / SR - np.arange(m) / SR) / 1.5)
            out[s:s + m] += st(pd * 0.9)[: n - s]
            # ピアノっぽいアルペジオ
            notes = ch + [ch[0] + 12]
            steps = 4 if mood != 'calm' else 6
            for j in range(steps):
                if mood != 'calm' and rng.random() < 0.25: continue
                f = hz(notes[(j * 2) % len(notes)] + (12 if mood == 'calm' else 0))
                pm = int(2.2 * SR); ps = s + int(j * cl / steps * SR)
                if ps < n: out[ps:ps + pm] += st(pluck(f, pm, 1.0 if mood != 'calm' else 0.7) * 0.18, rng.uniform(-0.5, 0.5))[: n - ps]
            k += cl; ci += 1
    return reverb(out, rng, 2.8, 0.4)


def build_music(meta, rng):
    dur = meta['duration']; n = int(dur * SR); out = np.zeros((n, 2))
    cues = sorted(meta['music'], key=lambda c: c['t'])
    for i, c in enumerate(cues):
        a = c['t']; b = cues[i + 1]['t'] if i + 1 < len(cues) else dur
        if c['mood'] == 'silence' or b - a < 0.3: continue
        seg = mood_track(c['mood'], b - a + 1.2, np.random.default_rng(hash(c['mood']) % 1000 + i))
        m = len(seg); fi, fo = int(0.25 * SR), int(0.9 * SR)
        seg[:fi] *= np.linspace(0, 1, fi)[:, None]
        cut = int((b - a) * SR)
        if cut < m:
            fo = min(fo, m - cut); seg[cut:cut + fo] *= np.linspace(1, 0, fo)[:, None]; seg[cut + fo:] = 0
        s = int(a * SR); out[s:s + m] += seg[: n - s] * c.get('vol', 1)
    return norm(out, 0.8)


def build_sfx(meta, rng):
    dur = meta['duration']; n = int(dur * SR); out = np.zeros((n, 2))
    for e in meta['sfx']:
        f = FX.get(e['type'])
        if not f: print('  ! unknown sfx', e['type']); continue
        x = f(np.random.default_rng(abs(hash(e['type'] + str(e['t']))) % 10000), e)
        if x.ndim == 1: x = st(x)
        s = int(e['t'] * SR)
        if s >= n: continue
        out[s:s + len(x)] += x[: n - s] * e.get('vol', 1)
    return out


VOICE_FX = {
    'child': 'asetrate=48000*1.16,aresample=48000,atempo=0.862',
    'pa': 'highpass=f=320,lowpass=f=3600,acompressor=threshold=0.1:ratio=4,aecho=0.8:0.6:45|90:0.35|0.22,volume=0.95',
    'door': 'lowpass=f=1700,highpass=f=110,aecho=0.7:0.55:22:0.3,volume=0.9',
    'far': 'lowpass=f=2300,aecho=0.8:0.85:110|190:0.5|0.35,volume=0.55',
}


def read_wav(path, filt):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if filt: cmd += ['-af', filt]
    cmd += ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).astype(np.float64)


def build_voice(meta, tts_dir):
    dur = meta['duration']; n = int(dur * SR); out = np.zeros(n)
    tempo = meta.get('tempo', 1)
    for L in meta['lines']:
        p = os.path.join(tts_dir, L['id'] + '.wav')
        if not os.path.exists(p): print('  ! no voice', L['id']); continue
        filt = []
        if tempo > 1.001: filt.append(f'atempo={tempo:.4f}')
        if L.get('fx') in VOICE_FX: filt.append(VOICE_FX[L['fx']])
        x = read_wav(p, ','.join(filt))
        s = int(L['t0'] * SR); out[s:s + len(x)] += x[: n - s]
    return out


def write(path, x):
    if x.ndim == 1: x = st(x) / 1.41
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--meta'); ap.add_argument('--tts'); ap.add_argument('--out'); a = ap.parse_args()
    meta = json.load(open(a.meta)); rng = np.random.default_rng(1)
    write(a.out + '_sfx.wav', norm(build_sfx(meta, rng), 0.95))
    write(a.out + '_bgm.wav', build_music(meta, rng))
    if a.tts: write(a.out + '_voice.wav', norm(build_voice(meta, a.tts), 0.95))
    print('audio ->', a.out + '_{voice,sfx,bgm}.wav')
