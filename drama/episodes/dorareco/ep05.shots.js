// ドラレコ 第5話（最終話）「ドラレコ」— 映像・効果音・BGM
// 作品の顔の車内カメラは、7号車（マユ・1:58）→ 灰原が見上げる → 6号車のショウジの顔（全車に中継）→ 夜明けの最後の映像 → 別の街の車（0:41）
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, rng, rr, fillRR, circ, vgrad, glow, rgba, cam, text, tag, poly } from '../../engine/core.js';
import { close, mood } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { callUI } from '../../engine/chichisets.js';
import { D, camView, mirrorShot, mirrorEyes, dash, harunaPhoto, thread, lockD, taxiSide, frontCam, driver } from '../../engine/dorasets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, camS, shojiS, yukiS, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep05.script.js';

const NOW = { date: '2026/12/12' };
// 灰原（7号車の運転席）・久保・車内カメラに映った客たち・数日後の別の街の客と運転手
const HAIB = { hair: 'parted', hairC: '#121014', top: '#141418', top2: '#0e0e12', bottom: '#1a1a1e', shoes: '#111', tall: 1.0 };
const KUBO = { hair: 'buzz', hairC: '#7a766e', top: '#3a4656', top2: '#2e3846', bottom: '#2a2e38', shoes: '#111', tall: 1.0, glasses: true };
const CUST = [
  { hair: 'parted', hairC: '#2a2622', top: '#3a3e4a', top2: '#2e323c', bottom: '#2a2a30', shoes: '#111', tall: 1.0 },
  { hair: 'long', hairC: '#3a2a22', top: '#7a5a5a', top2: '#6a4a4a', bottom: '#2a2a30', shoes: '#ddd', tall: 0.95, female: true },
  { hair: 'messy', hairC: '#1a1a1e', top: '#4a5a4a', top2: '#3a4a3a', bottom: '#2a2a30', shoes: '#111', tall: 1.0 },
];
const GIRL = { hair: 'long', hairC: '#2a1e1a', top: '#8a9ab0', top2: '#7a8aa0', bottom: '#2a2a30', shoes: '#ddd', tall: 0.93, female: true };
const DRV = { hair: 'messy', hairC: '#2e2a26', top: '#2a3a2e', top2: '#223026', bottom: '#2a2e38', shoes: '#111', tall: 1.0 };
const haruna = { name: 'ハルナ', av: 'ハ', col: '#b07a6a' };
const P7 = { ...P, yuki: P.mayu, shoji: HAIB };
const CAM7 = { ...NOW, P: P7, woman: 'up', eyes: 'normal', car: '7号車' };
const KEYMSG = [{ d: '今日' }, { text: '配車センターの\n久保のIDです', time: '1:56' }, { text: 'ID：MD-0417\nPW：・・・・・・・・', time: '1:56' }, { text: 'マユちゃんの車、\n7号車です', time: '1:57' }];
const MSG_B = { name: '番号非通知', av: '？', col: '#3a3a44', body: '後ろの客、1本3万円で。', time: '0:43' };

// 車内カメラに顔が正面から映る画面（灰原が見上げる・ショウジが話す）。枠の中は縦横同じ比率で描く
function camFace(g, x, y, w, h, who, { t = 0, clock = '01:58:40', date = NOW.date, car = '6号車', label = 'CAM2 車内', fs0 = 1.0, fy = 560, s = 2.0, glitch = 0, rec = 1, dawn = 0, ...face } = {}) {
  g.save(); rr(g, x, y, w, h, 6); g.clip(); g.translate(x, y);
  const sc = w / 1000; g.save(); g.translate(0, (h - 1100 * sc) / 2); g.scale(sc, sc);
  vgrad(g, 0, -400, 1000, 1900, [[0, '#2a2e32'], [1, '#141619']]);
  // フロントガラスと外の光（夜明けは白く）
  poly(g, [[60, -300], [940, -300], [1000, 260], [0, 260]], dawn ? rgba('#c8d4dc', 0.6 * dawn) : '#0c0e12');
  for (let i = 0; i < 4; i++) { const p = ((t * 0.4 + i / 4) % 1); glow(g, lerp(950, 50, p), 120, 130, 'rgba(230,230,230,1)', 0.3 * Math.sin(p * Math.PI) * (1 - dawn)); }
  fillRR(g, 260, 260, 480, 520, 120, '#33373c');
  close(g, who, { x: 500, y: fy, s, lightFrom: 'left', t, ...face });
  g.restore();
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#b8c8d0'; g.fillRect(0, 0, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(40,60,70,.35)'; g.fillRect(0, 0, w, h); g.restore();
  const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.save(); g.globalAlpha = 0.12; for (let yy = 0; yy < h; yy += 6 * sc + 2) { g.fillStyle = '#000'; g.fillRect(0, yy, w, 2); } g.restore();
  const R = rng(7 + Math.floor(t * 24)); g.save(); g.globalAlpha = 0.18; for (let i = 0; i < 220; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * w, R() * h, 3 * sc + 1, 3 * sc + 1); } g.restore();
  if (glitch > 0) { const R2 = rng(5 + Math.floor(t * 30)); g.save(); g.globalAlpha = glitch; for (let i = 0; i < 6; i++) { const yy = R2() * h, hh = 6 + R2() * 30; g.fillStyle = `rgba(${R2() < 0.5 ? '255,255,255' : '0,0,0'},.35)`; g.fillRect(0, yy, w, hh); } g.restore(); }
  const fs = Math.max(18, 40 * sc) * fs0;
  if (rec && Math.sin(t * 5) > -0.3) { circ(g, 46 * sc + 8, 50 * sc + 6, 15 * sc + 3, D.rec); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 46 * sc + 8, 50 * sc + 6, 60 * sc + 10, 'rgba(255,60,60,1)', 0.6); g.restore(); }
  text(g, 'REC', 80 * sc + 14, 52 * sc + 6, { size: fs, color: '#fff', align: 'left', weight: 800, stroke: '#000', sw: 4 });
  if (date || clock) text(g, `${date}  ${clock}`, w - 30 * sc - 6, 52 * sc + 6, { size: fs * 0.9, color: '#f4f6f8', align: 'right', weight: 700, stroke: '#000', sw: 4 });
  if (label) text(g, label, 30 * sc + 6, h - 40 * sc - 6, { size: fs * 0.75, color: '#e4e8ea', align: 'left', weight: 700, stroke: '#000', sw: 4 });
  text(g, car, w - 30 * sc - 6, h - 40 * sc - 6, { size: fs * 0.75, color: '#e4e8ea', align: 'right', weight: 700, stroke: '#000', sw: 4 });
  g.restore();
}
// 画面いっぱいの camFace（字幕より上）
// 顔が字幕（y=1262）より十分上（画面の y≒720）に来るように、寄りに合わせてカメラの中心をずらす
const faceS = (g, lt, D0, who, o = {}) => { bg(g, '#040506', '#08090b'); const z = slow(lt, D0, o.z0 ?? 1.0, o.z1 ?? 1.06); g.save(); cam(g, { x: 540, y: -70 + (o.fy ?? 560) + 240 / z, z }); camFace(g, 40, 80, 1000, 800, who, { t: lt + (o.t0 || 0), ...o }); g.restore(); };
// 赤い札（中継中など）
function badge(g, s, x, y, a = 1, size = 34) { if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 ${size}px "Noto Sans CJK JP", sans-serif`; const w = g.measureText(s).width + 60; fillRR(g, x - w / 2, y - size * 0.95, w, size * 1.9, size * 0.95, D.rec); text(g, s, x, y, { size, color: '#fff', weight: 800 }); g.restore(); }
// 7号車の車内カメラ（後ろの席にマユ、手前に運転席の灰原の後ろ頭）
const cam7 = (g, lt, D0, o = {}) => camS(g, lt, D0, { ...CAM7, look: 0.3, ...o });
// 全部の車のモニター。k 0..1＝ショウジの顔に切り替わっていく、hi＝赤くする号車
function grid(g, lt, { k = 0, hi = 0, ext = 0, title = 'みなと台交通　全車のモニター' } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#06080c'], [1, '#0c0f16']]);
  fillRR(g, 30, 140, 1020, 900, 16, '#050607');
  for (let i = 0; i < 6; i++) {
    const cx = 50 + (i % 2) * 500, cy = 160 + Math.floor(i / 2) * 290, no = i + 1;
    g.save(); g.beginPath(); g.rect(cx, cy, 480, 270); g.clip();
    if (k * 6 > i) camFace(g, cx, cy, 480, 270, P.shoji, { t: lt + i, clock: '01:59', date: '', car: `${no}号車`, label: '', s: 2.4, fy: 540, eyes: 'narrow', brow: 0.3, mouth: 'line', talk: 0.3 + 0.3 * Math.abs(Math.sin(lt * 9 + i)), fs0: 1.2 });
    else camView(g, cx, cy, 480, 270, { t: lt + i, P: { ...P, yuki: no === 6 ? P.yuki : no === 7 ? P.mayu : CUST[i % 3] }, woman: i % 2 ? 'up' : 'none', eyes: 'normal', look: 0, date: '', clock: '', label: '', car: `${no}号車` });
    g.restore();
    if (no === hi) { g.save(); g.lineWidth = 8; g.strokeStyle = rgba(D.rec, 0.6 + 0.4 * Math.sin(lt * 6)); g.strokeRect(cx, cy, 480, 270); g.restore(); }
  }
  text(g, title, 540, 100, { size: 40, color: '#c9ccd6', weight: 800 });
  badge(g, '● 全車・警察に中継中', 540, 1110, ext, 36);
}
// 久保の社員証
function idCard(g, lt) {
  bg(g, '#0a0b10', '#14161c');
  g.save(); g.translate(540, 640); g.rotate(-0.04 + noise1(lt, 2) * 0.01);
  g.save(); g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 40; fillRR(g, -380, -260, 760, 520, 28, '#eef0f2'); g.restore();
  fillRR(g, -380, -260, 760, 110, 28, '#2c3a52'); text(g, 'みなと台交通', 0, -205, { size: 44, color: '#fff', weight: 900 });
  g.save(); g.beginPath(); g.rect(-340, -120, 260, 330); g.clip(); vgrad(g, -340, -120, 260, 330, [[0, '#a9b4c0'], [1, '#c9d0d8']]); close(g, KUBO, { x: -210, y: 10, s: 1.3, eyes: 'normal', brow: 0, mouth: 'line', lightFrom: 'left' }); g.restore();
  text(g, '配車センター', 150, -50, { size: 36, color: '#4a5060', weight: 700 });
  text(g, '久保', 150, 50, { size: 110, color: '#14161c', weight: 900 });
  text(g, '夜間 配車係', 150, 150, { size: 34, color: '#4a5060', weight: 700 });
  g.restore();
}
// 角の影（frontCam の枠 40,80,1000,1100 の中。lx,ly＝枠の中の位置、sc＝大きさ）
function figureShadow(g, lx, ly, sc, a = 1) { if (a <= 0) return; g.save(); g.globalAlpha = a; g.translate(40 + lx, 80 + ly); g.scale(sc, sc); fillRR(g, -50, -230, 100, 230, 40, '#050506'); circ(g, 0, -270, 46, '#050506'); fillRR(g, -40, -10, 30, 150, 12, '#050506'); fillRR(g, 10, -10, 30, 150, 12, '#050506'); g.restore(); }
// 夜明けの空と街
function dawnBg(g, lt, k = 1) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mixc('#0a1020', '#2a3e5e', k)], [0.45, mixc('#141a2a', '#c98a6a', k)], [0.62, mixc('#0e1018', '#f0c48a', k)], [1, '#0a0b10']]);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 760, 980, 700, 'rgba(255,190,120,1)', 0.35 * k); g.restore();
  for (let i = 0; i < 9; i++) { const x = i * 130 - 60, hh = 120 + ((i * 61) % 160); fillRR(g, x, 980 - hh, 120, hh, 2, '#0b0d14'); }
  fillRR(g, -300, 980, W + 600, 1200, 0, '#101218');
}
const mixc = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join(''); };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 5, title: 'ドラレコ',
    back: g2 => { camView(g2, -333, 0, 1745, 1920, { t: 3, ...CAM7, look: 0.3, date: '', clock: '', label: '', car: '' }); },
    face: g2 => { fillRR(g2, 70, 1290, 380, 70, 35, 'rgba(0,0,0,.6)'); circ(g2, 112, 1325, 14, D.rec); text(g2, 'REC  01:58', 140, 1327, { size: 40, color: '#fff', align: 'left', weight: 800 }); fillRR(g2, 690, 1290, 320, 70, 35, D.rec); text(g2, '7号車', 850, 1327, { size: 44, color: '#fff', weight: 900 }); },
  });
}

const SHOTS = [
  // ── 冒頭：1フレーム目から7号車の車内カメラ（1:58）。後ろの席にマユ
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D0) { cam7(g, lt, D0, { clock: '01:58:02', glitch: 0.5 * (1 - inv(0, 0.3, lt)), z0: 1.0, z1: 1.0 }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D0) { cam7(g, lt, D0, { clock: '01:58:03', t0: 0.3, cx: 600, cy: 700, z0: 1.0, z1: 1.2 }); } },
  { at: 'k2', finish: { vignette: 0.6 }, draw(g, lt, D0) { cam7(g, lt, D0, { clock: '01:58:09', eyes: 'wide', look: -0.4, t0: 4, cx: 660, cy: 620, z0: 1.3, z1: 1.45 }); } },
  { at: 'k3', finish: { vignette: 0.75 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.3, 1.5) }); mirrorShot(g, { t: lt, inner: mirrorEyes(HAIB, { eyes: 'narrow', brow: -0.6, t: lt }) }); g.restore(); text(g, '7号車', 540, 640, { size: 44, color: 'rgba(255,255,255,.75)', weight: 800 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 見ている
  { at: 'a1', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 250, 190, 580, 130, 20, 'rgba(10,12,18,.88)'); text(g, '小野寺ショウジ（48）', 540, 240, { size: 48, color: '#fff' }); text(g, 'タクシー運転手', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a2', finish: { vignette: 0.6 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); const n = Math.min(3, 1 + Math.floor(lt / Math.max(D0 / 3, 0.1))); for (let i = 0; i < n; i++) { const y = 90 + i * 380; g.save(); g.beginPath(); g.rect(60, y, 960, 350); g.clip(); camView(g, 60, y, 960, 350, { t: lt + i * 2, P: { ...P, yuki: i === 2 ? P.haruna : CUST[i] }, woman: 'up', eyes: 'normal', look: [0.4, -0.3, 0.2][i], date: ['2025/03/14', '2025/06/27', '2025/12/05'][i], clock: ['23:12:40', '00:31:05', '00:41:07'][i], car: '6号車' }); g.restore(); const k = easeOut(inv(0.15, 0.45, lt - i * D0 / 3)); g.save(); g.globalAlpha = k; g.translate(880, y + 290); g.rotate(-0.12); fillRR(g, -120, -40, 240, 80, 12, D.rec); text(g, '¥30,000', 0, 2, { size: 44, color: '#fff', weight: 900 }); g.restore(); } } },
  { at: 'a3', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: lt + 0.2, ...haruna, msgs: KEYMSG.map((m, i) => ({ ...m, t: i < 2 ? 0 : i === 2 ? 0.4 : D0 * 0.6 })) }), { z0: 1.0, z1: 1.06 }); } },
  { at: 'a4', finish: { vignette: 0.6 }, draw(g, lt, D0) { const k = ease(inv(0, D0 * 0.7, lt)); g.save(); cam(g, { x: lerp(560, 790, k), y: lerp(800, 470, k), z: lerp(1.0, 2.1, k) }); dash(g, { t: lt, screen: (q, w, h) => camView(q, 0, 0, w, h, { ...CAM7, t: lt, look: 0.3, clock: '01:58:31', label: '' }) }); g.restore(); } },
  { at: 'a5', finish: { vignette: 0.65 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['a5'], { eyes: 'wide', brow: -0.5, look: 0.2, phoneLight: 1, z0: 1.05, z1: 1.12 }); } },
  { at: 'ring', finish: { vignette: 0.6 }, draw(g, lt, D0) { cam7(g, lt, D0, { clock: '01:58:44', look: 0.5, t0: 8, cx: 640, cy: 700, z0: 1.15, z1: 1.2 }); const pa = 0.5 + 0.5 * Math.sin(lt * 14); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 690, 790, 160, 'rgba(170,200,255,1)', 0.35 + 0.3 * pa); g.restore(); } },
  { at: 'a6', finish: { vignette: 0.6 }, draw(g, lt, D0) { cam7(g, lt, D0, { clock: '01:58:46', look: 0.6, t0: 9, cx: 660, cy: 640, z0: 1.25, z1: 1.35 }); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 690, 780, 160, 'rgba(170,200,255,1)', 0.4); g.restore(); } },
  { at: 'a7', finish: { vignette: 0.75 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.35, 1.5) }); mirrorShot(g, { t: lt, inner: mirrorEyes(HAIB, { eyes: 'narrow', brow: -0.4, look: 0.3, t: lt }) }); g.restore(); text(g, '7号車', 540, 640, { size: 44, color: 'rgba(255,255,255,.75)', weight: 800 }); mood(g, { dark: 0.1 }); } },

  // ── 2. 見上げる目
  { at: 'b1', finish: { vignette: 0.65 }, draw(g, lt, D0) { const k = ease(inv(0.2, D0 * 0.8, lt)); faceS(g, lt, D0, HAIB, { car: '7号車', clock: '01:58:52', eyes: 'narrow', brow: -0.4, mouth: 'line', lookY: lerp(0.8, 0, k), turn: lerp(0.4, 0, k), fy: lerp(760, 580, k), z0: 1.0, z1: 1.08 }); } },
  { at: 'b2', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { faceS(g, lt, D0, HAIB, { car: '7号車', clock: '01:58:56', eyes: 'narrow', brow: -0.5, mouth: 'smile', talk: 0.5 * (lt < D0 - 0.3 ? Math.abs(Math.sin(lt * 13)) : 0), s: 2.3, z0: 1.05, z1: 1.15, t0: 4 }); } },
  { at: 'b3', finish: { vignette: 0.7 }, draw(g, lt, D0) { faceS(g, lt, D0, HAIB, { car: '7号車', clock: '01:59:01', eyes: 'narrow', brow: -0.6, mouth: 'smile', talk: 0.5 * (lt < D0 - 0.3 ? Math.abs(Math.sin(lt * 13)) : 0), glitch: 0.2, s: 2.6, z0: 1.1, z1: 1.2, t0: 8 }); badge(g, '1本 ¥30,000', 540, 150, easeOut(inv(0.3, 0.7, lt)), 44); } },
  { at: 'b4', finish: { vignette: 0.75 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'wide', brow: -0.5, look: 0.2, z0: 1.1, z1: 1.2 }); mood(g, { dark: 0.15 }); } },

  // ── 3. 全部を話す
  { at: 'c1', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['c1'], { eyes: 'narrow', brow: -0.5, look: -0.6 }); } },
  { at: 'c2', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D0, 1.0, 1.06) }); grid(g, lt, { k: 0, hi: 6 }); g.restore(); } },
  { at: 'c3', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D0, 1.06, 1.1) }); grid(g, lt, { k: inv(0.2, D0 * 0.8, lt), ext: inv(D0 * 0.5, D0 * 0.7, lt) }); g.restore(); } },
  { at: 'c4', finish: { vignette: 0.6 }, draw(g, lt, D0, S) { faceS(g, lt, D0, P.shoji, { clock: '01:59:20', eyes: 'normal', brow: 0.3, mouth: 'line', talk: 0.5 * (lt < D0 - 0.3 ? Math.abs(Math.sin(lt * 12)) : 0), z0: 1.0, z1: 1.08 }); badge(g, '● 全車・警察に中継中', 540, 150, 1, 34); } },
  { at: 'c5', finish: { vignette: 0.65 }, draw(g, lt, D0) { faceS(g, lt, D0, P.shoji, { clock: '01:59:26', eyes: 'narrow', brow: 0.5, mouth: 'line', talk: 0.5 * (lt < D0 - 0.3 ? Math.abs(Math.sin(lt * 12)) : 0), s: 2.3, z0: 1.05, z1: 1.12, t0: 4 }); badge(g, '● 全車・警察に中継中', 540, 150, 1, 34); } },
  { at: 'c6', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D0, 1.0, 1.06) }); idCard(g, lt); g.restore(); badge(g, '● 全車・警察に中継中', 540, 150, 1, 34); } },
  { at: 'c7', finish: { vignette: 0.75 }, draw(g, lt, D0) { faceS(g, lt, D0, P.shoji, { clock: '01:59:41', eyes: 'narrow', brow: 0.6, mouth: 'line', talk: 0.5 * (lt < D0 * 0.6 ? Math.abs(Math.sin(lt * 12)) : 0), s: 2.7, z0: 1.1, z1: 1.22, t0: 9 }); mood(g, { dark: inv(D0 * 0.6, D0, lt) * 0.4 }); } },

  // ── 後編の頭：その声は7号車のスピーカーからも
  { at: 'd1', finish: { vignette: 0.6 }, draw(g, lt, D0) { const k = ease(inv(0, D0 * 0.7, lt)); g.save(); cam(g, { x: lerp(790, 640, k), y: lerp(470, 760, k), z: lerp(2.0, 1.1, k) }); dash(g, { t: lt, meter: '賃走', fare: '2,380', radio: 1, screen: (q, w, h) => camFace(q, 0, 0, w, h, P.shoji, { t: lt, clock: '01:59', date: '', label: '', car: '6号車', s: 2.4, fy: 540, eyes: 'narrow', brow: 0.5, mouth: 'line', talk: 0.4 * Math.abs(Math.sin(lt * 12)), fs0: 1.2 }) }); g.restore(); text(g, '7号車', 540, 250, { size: 44, color: 'rgba(255,255,255,.8)', weight: 800, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'd2', finish: { vignette: 0.6 }, draw(g, lt, D0) { cam7(g, lt, D0, { clock: '01:59:48', eyes: 'wide', look: -0.2, t0: 12, cx: 660, cy: 620, z0: 1.35, z1: 1.5 }); } },
  { at: 'radio', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 900, z: slow(lt, D0, 1.0, 1.08) }); dash(g, { t: lt, radio: 1 }); g.restore(); } },
  { at: 'd3', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560 + noise1(lt * 8, 2) * 8, y: 1000, z: slow(lt, D0, 1.5, 1.75) }); dash(g, { t: lt, radio: 1 }); g.restore(); } },
  { at: 'd4', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D0, 1.0, 1.12) }); grid(g, lt + 4, { k: 1, ext: 1 }); g.restore(); } },
  { at: 'd5', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: 540, y: 630, z: slow(lt, D0, 1.0, 1.08) }); frontCam(g, 40, 80, 1000, 1100, { t: lt, date: NOW.date, clock: '02:00:12', car: '7号車', stop: inv(0, D0 * 0.8, lt), lights: 0 }); g.restore(); } },
  { at: 'd6', finish: { vignette: 0.75 }, draw(g, lt, D0) { faceS(g, lt, D0, HAIB, { car: '7号車', clock: '02:00:18', eyes: 'narrow', brow: -0.8, mouth: 'frown', glitch: 0.35, s: 2.6, z0: 1.1, z1: 1.18, t0: 12 }); } },
  { at: 'd7', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: 540, y: 630, z: slow(lt, D0, 1.0, 1.1) }); frontCam(g, 40, 80, 1000, 1100, { t: lt, date: NOW.date, clock: '02:00:21', car: '7号車', walk: 0.1 + inv(0, D0, lt) * 0.8, lights: 0 }); g.restore(); } },
  { at: 'corner', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: 540, y: 600, z: slow(lt, D0, 1.1, 1.2) }); frontCam(g, 40, 80, 1000, 1100, { t: lt, date: NOW.date, clock: '02:00:25', car: '7号車', walk: 0.9, lights: 0 }); figureShadow(g, 420, 610, 0.55, inv(0, D0, lt)); g.restore(); } },
  { at: 'd8', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 40, mode: 'talk', ...haruna }), { z0: 1.02, z1: 1.08 }); } },
  { at: 'd9', finish: { vignette: 0.6 }, draw(g, lt, D0) { bg(g, '#14161c', '#0a0b10'); const k = ease(inv(0, D0 * 0.5, lt)); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D0, 1.0, 1.06) }); g.save(); g.globalAlpha = 1 - k; frontCam(g, 40, 80, 1000, 1100, { t: lt, date: NOW.date, clock: '02:00:27', car: '7号車', walk: 1, lights: 0 }); figureShadow(g, 455, 610, 0.55); g.restore(); g.save(); g.globalAlpha = k; photo(g, 540, 560, 560, 680, (q, w, h) => harunaPhoto(q, w, h, P.haruna), { rot: -0.03 }); g.restore(); g.restore(); tag(g, '白石ハルナ（26）', 540, 150, { size: 40, bg: '#0b0d12', color: '#f4f6f8', alpha: k }); } },
  { at: 'd10', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['d10'], { eyes: 'narrow', brow: 0.5, look: -0.4, z0: 1.16, z1: 1.24 }); mood(g, { dark: 0.08 }); } },

  // ── 4. 夜明け
  { at: 'e1', finish: { vignette: 0.55 }, draw(g, lt, D0) { dawnBg(g, lt, 0.4 + inv(0, D0, lt) * 0.5); g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D0, 1.0, 1.05) }); taxiSide(g, 540, 880, 1.0, { sign: '回送', t: 0 }); g.restore(); text(g, '警察署', 860, 700, { size: 40, color: 'rgba(255,255,255,.7)', weight: 800 }); } },
  { at: 'e2', finish: { vignette: 0.6 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['e2'], { eyes: 'closed', brow: 0.6, look: -0.4, speed: 0, z0: 1.05, z1: 1.1 }); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 900, 400, 700, 'rgba(255,190,130,1)', 0.18); g.restore(); } },
  { at: 'e3', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['e3'], { eyes: 'normal', brow: 0.3, look: -0.5, z0: 1.12, z1: 1.18 }); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 300, 300, 600, 'rgba(255,190,130,1)', 0.15); g.restore(); } },
  { at: 'e4', finish: { vignette: 0.7 }, draw(g, lt, D0) { faceS(g, lt, D0, P.shoji, { clock: '05:42:10', dawn: 0.8, eyes: 'normal', brow: 0.3, mouth: 'line', z0: 1.0, z1: 1.2, rec: lt < D0 * 0.75 ? 1 : 0 }); g.save(); g.globalAlpha = inv(D0 * 0.75, D0, lt); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.restore(); } },

  // ── 5. 数日後、別の街のタクシー（0:41）
  { at: 'later', noSubs: true, draw(g, lt) { bg(g, '#030405', '#07080a'); } },
  { at: 'f1', finish: { vignette: 0.6 }, draw(g, lt, D0) { camS(g, lt, D0, { date: '2026/12/18', clock: '00:41:07', car: '12号車', P: { ...P, yuki: GIRL, shoji: DRV }, woman: 'up', eyes: 'normal', look: 0.2, z0: 1.0, z1: 1.12, cx: 600, cy: 700 }); } },
  { at: 'f2', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D0, 1.0, 1.06) }); driver(g, DRV, { t: lt, talk: 0.5 * (lt < D0 - 0.2 ? Math.abs(Math.sin(lt * 13)) : 0), eyes: 'narrow', mouth: 'smile', brow: -0.2 }); g.restore(); } },
  { at: 'buzz', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D0, 1.0, 1.04) }); lockD(g, { t: lt, date: '12月18日 金曜日', clock: '0:43', notifs: [{ t: 0.2, ...MSG_B }] }); g.restore(); } },
  { at: 'f3', finish: { vignette: 0.7 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 640, z: slow(lt, D0, 1.0, 1.08) }); lockD(g, { t: 9, date: '12月18日 金曜日', clock: '0:43', notifs: [MSG_B] }); g.restore(); mood(g, { dark: inv(D0 - 0.8, D0, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'engine', dur: 9, vol: 0.2 },
  { at: 'cold', type: 'glitch', vol: 0.55 },
  { at: 'k1', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'k2', type: 'stab', vol: 0.5 },
  { at: 'k3', type: 'hit', vol: 0.75 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a2', type: 'tap3', vol: 0.4 },
  { at: 'a3', type: 'notif', vol: 0.45 },
  { at: 'a4', type: 'glitch', vol: 0.35 },
  { at: 'a5', type: 'dial', vol: 0.4 },
  { at: 'ring', type: 'dial', vol: 0.55 },
  { at: 'a7', type: 'stab', vol: 0.55 },
  { at: 'b1', type: 'riser', vol: 0.45 },
  { at: 'b2', type: 'hit', vol: 0.8 },
  { at: 'b3', type: 'glitch', vol: 0.4 },
  { at: 'b4', type: 'subdrop', vol: 0.7 },
  { at: 'c2', type: 'glitch', vol: 0.35 },
  { at: 'c3', type: 'riser', vol: 0.45 },
  { at: 'c4', type: 'heartbeat', dur: 4, vol: 0.4 },
  { at: 'c6', type: 'stab', vol: 0.5 },
  { at: 'c7', type: 'hit', vol: 0.85 },
  { at: 'c7:end', off: 0.2, type: 'subdrop', vol: 0.6 },
  { at: 'd1', type: 'glitch', vol: 0.35 },
  { at: 'd2', type: 'stab', vol: 0.45 },
  { at: 'radio', type: 'glitch', vol: 0.5 },
  { at: 'radio', off: 0.2, type: 'pickup', vol: 0.5 },
  { at: 'd4', type: 'riser', vol: 0.4 },
  { at: 'd5', type: 'carstop', vol: 0.5 },
  { at: 'd6', type: 'stab', vol: 0.55 },
  { at: 'd7', type: 'heartbeat', dur: 3, vol: 0.55 },
  { at: 'corner', type: 'riser', vol: 0.45 },
  { at: 'd9', type: 'hit', vol: 0.8 },
  { at: 'e4:end', off: -0.4, type: 'subdrop', vol: 0.5 },
  { at: 'f1', type: 'engine', dur: 6, vol: 0.18 },
  { at: 'buzz', type: 'notif', vol: 0.6 },
  { at: 'f3', type: 'hit', vol: 0.8 },
  { at: 'f3:end', off: 0.3, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'ring', mood: 'suspense' },
  { at: 'b2', mood: 'thriller' },
  { at: 'b4', mood: 'silence' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'c4', mood: 'suspense' },
  { at: 'c7', mood: 'silence' },
  { at: 'd1', mood: 'tension' },
  { at: 'd5', mood: 'thriller' },
  { at: 'd9', mood: 'silence' },
  { at: 'd10', mood: 'ending' },
  { at: 'later', mood: 'silence' },
  { at: 'f1', mood: 'uneasy' },
  { at: 'f3', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a4', '1:58　7号車の車内カメラ', 2.6], ['e1', '夜明け', 2.4], ['later', '数日後　別の街', 2.8]]) });
