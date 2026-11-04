// 置き配 第1話「届いた」— 映像・効果音・BGM
// 手がかり（最終話で回収）：写真はどれも部屋の中の真上から・時刻3:12／天井の点検口が少しずれている（部屋の引きの絵だけ。誰も触れない）
//   ／写真の暗がりに赤い札がかすかに見える／前の住人あての郵便（「水野サ…」）／差出人の住所はこの部屋
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, sfxText } from '../../engine/noir.js';
import { O, cardboard, topPhoto, print, room203, doorFront, chainDoor, hand } from '../../engine/okihaisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, subBand, cover as coverBase, endCard, mioFace, mioShock, faceOf, phoneShot, photoShot, billShot, boxShot } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

const D3 = { date: '2026.11.05', time: '3:12' };
// 玄関の外（朝）。z＝寄り
const outside = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1100, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); doorFront(g, { t: lt, ...o.set }); g.restore(); };
// 部屋の引き
const room = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) }); room203(g, { t: lt, hatch: 0.07, ...o.set }); g.restore(); };
// 3日分の写真を並べる（n＝何枚目まで）
function three(g, lt, n, { hi = -1, arrow = 0 } = {}) {
  bg(g, '#14110e', '#0a0908');
  const ps = [{ mode: 'empty', date: '2026.11.02', time: '14:05' }, { mode: 'desk', date: '2026.11.03', time: '10:31' }, { ...D3 }];
  ps.forEach((p, i) => {
    const k = easeOut(clamp((n - i) * 1.0)); if (k <= 0) return;
    const y = 250 + i * 365, x = 620 + (i - 1) * 20;
    g.save(); g.globalAlpha = k * (hi >= 0 && hi !== i ? 0.45 : 1);
    print(g, x, y + (1 - k) * 60, 600, 320, (q, w, h) => topPhoto(q, w, h, { ...p, t: lt }), { rot: (i - 1) * 0.05 });
    g.restore();
    text(g, `${i + 1}日目`, 150, y, { size: 46, color: i === 2 ? O.red2 : '#e9e4da', alpha: k, weight: 900 });
  });
  if (arrow > 0) { g.save(); g.globalAlpha = arrow; g.lineWidth = 12; g.strokeStyle = O.red2; g.beginPath(); g.moveTo(1010, 260); g.lineTo(1010, 900); g.stroke(); poly(g, [[1010, 950], [975, 880], [1045, 880]], O.red2); g.restore(); }
}
// 机の上の郵便（前の住人あて。名前は半分隠れている）
function mail(g, lt, D) {
  bg(g, '#6a5440', '#4a3a2c'); toneDesk(g);
  g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D, 1.0, 1.08) });
  const env = (x, y, r, name, c = '#f1ece0') => { g.save(); g.translate(x, y); g.rotate(r); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 20; fillRR(g, -300, -170, 600, 340, 6, c); g.shadowColor = 'transparent'; fillRR(g, 170, -140, 90, 110, 4, '#c9b8a0'); hand(g, '白樺町3-8 コーポ白樺203', -250, -40, { size: 34, seed: 3 }); hand(g, name, -250, 50, { size: 60, seed: 5 }); g.restore(); };
  env(520, 560, -0.06, '水野サキ 様');
  env(760, 720, 0.08, 'お知らせ', '#e4ded2');
  g.restore();
}
const toneDesk = g => { g.save(); g.globalAlpha = 0.25; for (let i = 0; i < 14; i++) line(g, -300, i * 150, W + 300, i * 150 + 40, 3, '#3a2a1e'); g.restore(); };
// 電話の時計（夜中）
function nightClock(p, w, h, { t = 0, s = '3:10' } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#101a30'], [1, '#070b16']]);
  text(p, '11月5日', w / 2, h * 0.16, { size: 40, color: 'rgba(255,255,255,.75)', weight: 600 });
  text(p, s, w / 2, h * 0.3, { size: 210, color: '#f1f3f8', weight: 500 });
}
// ケン（配達員）が玄関の外に立つ。手に小さな段ボール
const kenAt = (S, lt, ids = [], o = {}) => q => {
  figure(q, P.ken, { x: o.x ?? 600, y: 1830, s: 1.4, mouth: o.mouth || 'smile', eyes: o.eyes || 'normal', talk: talking(lt, S, ids) * 0.6, arms: [40, -100, 40, -100], lightFrom: 'left', turn: o.turn ?? -0.1 });
  cardboard(q, o.x ?? 600, 1330, 0.42, { label: true });
};

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 1, title: '届いた',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1300, z: 1.25 }); doorFront(g2, {}); g2.restore(); },
    face: g2 => close(g2, P.mio, { y: 1480, s: 2.9, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', look: -0.4 }),
  });
}

const SHOTS = [
  // ── 冒頭：玄関の箱を開ける
  { at: 'cold', off: -0.3, finish: { vignette: 0.55 }, draw(g, lt, D) { outside(g, lt, D, { y: 1350, z0: 1.4, z1: 1.45 }); } },
  { at: 'k1', finish: { vignette: 0.55 }, draw(g, lt, D) { outside(g, lt, D, { y: 1380, z0: 1.45, z1: 1.75 }); subBand(g); } },
  { at: 'k2', finish: { vignette: 0.6 }, draw(g, lt, D) { boxShot(g, lt, D, { open: inv(0, D * 0.7, lt) }); subBand(g); } },
  { at: 'photo', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = easeOut(inv(0, 0.6, lt)); bg(g, '#14110e', '#0a0908'); g.save(); cam(g, { x: 540, y: 640, z: lerp(0.6, 1.0, k), r: lerp(0.3, 0, k) }); print(g, 540, 640, 960, 720, (q, w, h) => topPhoto(q, w, h, { ...D3, t: lt })); g.restore(); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D) { photoShot(g, lt, D, D3, { fx: 674, fy: 715, z0: 1.4, z1: 1.65 }); subBand(g); } },
  { at: 'k4', finish: { vignette: 0.7 }, draw(g, lt, D) { photoShot(g, lt, D, D3, { fx: 950, fy: 1110, z0: 1.7, z1: 1.95 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#050608', '#0a0b0e'); cover(g, lt); } },

  // ── 1. 3日目の箱
  { at: 'a1', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 0, eyes: 'normal', brow: 0.3, look: -0.3 }); } },
  { at: 'a2', draw(g, lt, D) { room(g, lt, D, { set: { night: 0, mio: { x: 330, y: 1760, s: 1.3, eyes: 'normal', turn: 0.2, arms: [10, 0, 30, -60] } } }); subBand(g); } },
  { at: 'a2b', draw(g, lt, D) { mail(g, lt, D); subBand(g); } },
  { at: 'a3', draw(g, lt, D) { outside(g, lt, D, { y: 1300, z0: 1.2, z1: 1.3 }); subBand(g); } },
  { at: 'a4', draw(g, lt, D) { three(g, lt * 2.5, 1); subBand(g); } },
  { at: 'a5', draw(g, lt, D) { three(g, 1 + lt * 2.5, 2, { hi: 1 }); subBand(g); } },
  { at: 'a6', draw(g, lt, D) { three(g, 2 + lt * 2.5, 3, { hi: lt > 1.2 ? -1 : 2, arrow: easeOut(inv(D * 0.55, D * 0.8, lt)) }); subBand(g); } },

  // ── 2. カメラはない
  { at: 'b1', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 0, eyes: 'wide', brow: -0.4, mouth: 'line', look: 0.6 }); } },
  { at: 'b2', draw(g, lt, D) { const x = lerp(320, 820, ease(inv(0, D, lt))); room(g, lt, D, { x, y: 820, z0: 1.5, z1: 1.5, set: { night: 0 } }); subBand(g); } },
  { at: 'search', draw(g, lt, D) { room(g, lt, D, { x: 260, y: 1000, z0: 1.6, z1: 1.7, set: { night: 0 } }); tag(g, 'カメラ　なし', 540, 240, { size: 46, bg: '#1a1a20', color: '#ffd451', alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'b3', draw(g, lt, D) { room(g, lt, D, { y: 1000, z0: 1.0, z1: 1.04, set: { night: 0, mio: { x: 420, y: 1790, s: 1.32, eyes: 'wide', brow: -0.3, turn: -0.3, arms: [20, -20, 20, -20] } } }); subBand(g); } },
  { at: 'b4', finish: { vignette: 0.55 }, draw(g, lt, D) { g.save(); cam(g, { x: 560, y: 900, z: slow(lt, D, 1.3, 1.45) }); chainDoor(g, { gap: 0, chain: 0, lock: 1, t: lt }); g.restore(); tag(g, '施錠中', 540, 240, { size: 44, bg: '#1a1a20', color: '#9ff0c0', alpha: inv(0.3, 0.6, lt) }); subBand(g); } },
  { at: 'b5', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 0, eyes: 'narrow', brow: 0.5, mouth: 'line', look: -0.5, z1: 1.1 }); } },

  // ── 3. 送り主
  { at: 'bell', draw(g, lt, D) { outside(g, lt, D, { y: 1150, z0: 1.0, z1: 1.02, set: { box: 0, people: kenAt({ L: () => 0, Le: () => 0 }, lt) } }); sfxText(g, 'ピンポーン', 540, 300, { size: 100, color: '#ffd451', alpha: inv(0, 0.15, lt), rot: -0.05 }); } },
  { at: 'c1', draw(g, lt, D, S) { outside(g, lt, D, { y: 1150, z0: 1.02, z1: 1.08, set: { box: 0, people: kenAt(S, lt, ['c1']) } }); subBand(g); } },
  { at: 'c2', draw(g, lt, D, S) { faceOf(g, lt, D, S, 'ken', [], { mouth: 'smile', eyes: 'normal', brow: 0.2, a: '#d9dcde', b: '#a9acb0' }); tag(g, '配達員　ケン（24）', 540, 220, { size: 42, bg: '#14161c', color: '#cfe0ff', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'c3', draw(g, lt, D, S) { mioFace(g, lt, D, S, ['c3'], { night: 0, eyes: 'normal', brow: 0.5, look: 0.5 }); } },
  { at: 'c4', draw(g, lt, D, S) { faceOf(g, lt, D, S, 'ken', ['c4'], { eyes: 'narrow', lookY: 1, look: -0.2, a: '#d9dcde', b: '#a9acb0' }); } },
  { at: 'c5', draw(g, lt, D) { billShot(g, lt, D, { hi: 'from', hiK: inv(0.5, 1.3, lt), date: '11月5日' }, { z0: 1.0, z1: 1.1 }); subBand(g); } },
  { at: 'c6', draw(g, lt, D) { billShot(g, lt, D, { hi: 'from', date: '11月5日' }, { fx: 560, fy: 917, z0: 1.5, z1: 1.65 }); subBand(g); mood(g, { red: 0.06 * inv(0, D, lt) }); } },
  { at: 'c7', draw(g, lt, D, S) { faceOf(g, lt, D, S, 'ken', ['c7'], { eyes: 'normal', mouth: 'line', brow: 0.1, look: 0, z0: 1.05, z1: 1.18, a: '#c9ccce', b: '#8a8d92' }); } },
  { at: 'c8', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 0, eyes: 'narrow', brow: 0.6, mouth: 'line', look: -0.6 }); } },

  // ── 4. 眠らない夜
  { at: 'd1', finish: { vignette: 0.6 }, draw(g, lt, D) { room(g, lt, D, { x: 640, y: 1000, z0: 1.25, z1: 1.35, set: { night: 1, bedMio: 2 } }); subBand(g); } },
  { at: 'd2', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 1, eyes: 'narrow', brow: 0.4, mouth: 'line', look: 0.3 }); } },
  { at: 'd3', finish: { vignette: 0.6 }, draw(g, lt, D) { const s = lt < D * 0.3 ? '2:00' : lt < D * 0.6 ? '3:00' : '3:10'; phoneShot(g, lt, D, (p, w, h) => nightClock(p, w, h, { t: lt, s }), { y: 820, z0: 1.0, z1: 1.05 }); subBand(g); } },
  { at: 'clock', finish: { vignette: 0.75 }, draw(g, lt, D) { room(g, lt, D, { x: 640, y: 900, z0: 1.1, z1: 1.18, set: { night: 1, bedMio: 1 } }); mood(g, { dark: 0.25 + 0.5 * inv(0.4, D, lt) }); } },
  { at: 'd4', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 0, eyes: lt < 0.4 ? 'closed' : 'wide', brow: -0.3, mouth: 'open', look: 0.2 }); } },

  // ── 5. 引き
  { at: 'e1', finish: { vignette: 0.55 }, draw(g, lt, D) { outside(g, lt, D, { y: 1300, z0: 1.15, z1: 1.35 }); subBand(g); } },
  { at: 'e2', draw(g, lt, D) { boxShot(g, lt, D, { to: '', z0: 1.4, z1: 1.6, cy: 1000 }); subBand(g); } },
  { at: 'label', finish: { vignette: 0.65 }, draw(g, lt, D) { billShot(g, lt, D, { to: '', date: '11月6日' }, { fy: 762, z0: 1.3, z1: 1.35 }); } },
  { at: 'e3', finish: { vignette: 0.65 }, draw(g, lt, D) { billShot(g, lt, D, { to: '水野サキ', hi: 'to', hiK: inv(0.6, 1.4, lt), date: '11月6日' }, { fy: 740, z0: 1.35, z1: 1.5 }); subBand(g); } },
  { at: 'e4', finish: { vignette: 0.75 }, draw(g, lt, D) { mioShock(g, lt, D, { night: 0 }); mood(g, { red: 0.1 * inv(0, D, lt), dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.8 },
  { at: 'k2', type: 'boxopen', vol: 0.7 },
  { at: 'photo', type: 'impact', vol: 0.8 },
  { at: 'k4', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 12, vol: 0.35 },
  { at: 'a4', type: 'shutter', vol: 0.4 },
  { at: 'a5', type: 'shutter', vol: 0.4 },
  { at: 'a6', off: 0.4, type: 'shutter', vol: 0.5 },
  { at: 'b2', type: 'rustle', vol: 0.5 },
  { at: 'b4', type: 'unlock', vol: 0.4 },
  { at: 'bell', type: 'chime', vol: 0.5 },
  { at: 'c5', type: 'stab', vol: 0.6 },
  { at: 'c7', type: 'subdrop', vol: 0.5 },
  { at: 'd1', type: 'roomtone', dur: 14, vol: 0.3 },
  { at: 'd3', type: 'clock', dur: 4, vol: 0.4 },
  { at: 'clock', type: 'heartbeat', dur: 1.4, vol: 0.5 },
  { at: 'd4', type: 'hit', vol: 0.7 },
  { at: 'e2', type: 'boxopen', vol: 0.4 },
  { at: 'label', type: 'riser', vol: 0.6 },
  { at: 'e3', type: 'hit', vol: 0.85 },
  { at: 'e4:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'suspense' },
  { at: 'bell', mood: 'silence' },
  { at: 'c1', mood: 'calm' },
  { at: 'c5', mood: 'tension' },
  { at: 'd1', mood: 'uneasy' },
  { at: 'clock', mood: 'silence' },
  { at: 'e1', mood: 'suspense' },
  { at: 'label', mood: 'silence' },
  { at: 'e3', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a1', '11月5日　朝　コーポ白樺 203号室', 2.8]]) });
