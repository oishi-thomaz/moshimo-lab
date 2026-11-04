// 置き配 第3話「前の住人」— 映像・効果音・BGM
// 手がかり（最終話で回収）：1年前の写真の暗がりにも赤い札（かすか）／写真の裏の字はサキの字／点検口のすき間の赤い光（充電のランプ）
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, sfxText } from '../../engine/noir.js';
import { O, cardboard, topPhoto, print, room203, doorFront, mailboxes, ceiling, callView } from '../../engine/okihaisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, subBand, cover as coverBase, endCard, mioFace, mioShock, faceOf, phoneShot, photoShot, boxShot } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep03.script.js';

const SAKI = { who: 'saki', date: '2025.10.14', time: '3:12' };
const MIO = { date: '2026.11.06', time: '3:12' };
// 郵便受けの前：うしろに長瀬
function mailNagase(g, lt, D, S, ids = [], o = {}) {
  g.save(); cam(g, { x: 540, y: o.cy ?? 900, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) });
  mailboxes(g, { box: o.box ?? 0 });
  g.restore();
  if (o.nagase !== false) figure(g, P.nagase, { x: o.nx ?? 700, y: o.ny ?? 1990, s: 1.7, eyes: 'narrow', bags: true, mouth: 'line', talk: talking(lt, S, ids) * 0.6, turn: -0.3, look: -0.6, arms: o.arms || [10, 0, 50, -90], lightFrom: 'left' });
  if (o.hold) cardboard(g, (o.nx ?? 700) + 60, (o.ny ?? 1990) - 560, 0.5, {});
}
const nagase = (g, lt, D, S, ids = [], o = {}) => faceOf(g, lt, D, S, 'nagase', ids, { eyes: 'narrow', bags: true, brow: 0.2, a: '#b9bcbf', b: '#7f8286', look: -0.4, ...o });
// 2枚の写真を並べる
function pair(g, lt, D, o = {}) {
  bg(g, '#0e1220', '#070a12');
  g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.05) });
  print(g, 540, 380, 820, 520, (q, w, h) => topPhoto(q, w, h, { ...SAKI, t: lt }), { rot: -0.03 });
  print(g, 540, 1000, 820, 520, (q, w, h) => topPhoto(q, w, h, { ...MIO, t: lt }), { rot: 0.03 });
  if (o.arrows) { g.save(); g.globalAlpha = o.arrows; for (const y of [140, 760]) { g.lineWidth = 10; g.strokeStyle = '#ffd451'; g.beginPath(); g.moveTo(540, y - 80); g.lineTo(540, y + 10); g.stroke(); poly(g, [[540, y + 40], [510, y - 5], [570, y - 5]], '#ffd451'); } g.restore(); text(g, '真上から', 820, 140, { size: 44, color: '#ffd451', alpha: o.arrows }); }
  g.restore();
}
// ベッドのミオを上から（寝たまま天井を見上げる）
function lookUp(g, lt, D, o = {}) {
  bg(g, '#16223a', '#0a1020');
  g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  fillRR(g, 120, -100, 840, 2200, 20, '#3a4866'); fillRR(g, 180, 80, 720, 300, 60, '#56688c');
  close(g, { ...P.mio, top: '#3c4c70', top2: '#3c4c70' }, { y: 560, s: 3.4, eyes: o.eyes || 'wide', lookY: -1, brow: o.brow ?? 0.2, mouth: 'line', lightFrom: 'right' });
  fillRR(g, 100, 1050, 880, 1200, 50, '#3c4c70');
  g.restore();
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 3, title: '前の住人',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 900, z: 1.1 }); print(g2, 540, 640, 960, 720, (q, w, h) => topPhoto(q, w, h, SAKI)); g2.restore(); },
    face: g2 => close(g2, P.mio, { y: 1480, s: 2.9, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', phoneLight: true, look: -0.4 }),
  });
}

const SHOTS = [
  // ── 冒頭：郵便受け、うしろに長瀬
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D, S) { mailNagase(g, lt, D, S, [], { box: 1, nagase: false, cy: 720, z0: 2.6, z1: 2.6 }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D, S) { mailNagase(g, lt, D, S, ['k1'], { box: 1, cy: 760, z0: 1.6, z1: 1.7 }); subBand(g); } },
  { at: 'k2', draw(g, lt, D, S) { nagase(g, lt, D, S, [], { eyes: 'normal', look: 0, z0: 1.05, z1: 1.15 }); } },
  { at: 'k3', draw(g, lt, D, S) { mioShock(g, lt, D, { night: 0 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#050608', '#0a0b0e'); cover(g, lt); } },

  // ── 1. 頼まれていた
  { at: 'a1', draw(g, lt, D, S) { nagase(g, lt, D, S, ['a1']); } },
  { at: 'a2', draw(g, lt, D, S) { nagase(g, lt, D, S, ['a2'], { look: 0.8, brow: 0.5, z0: 1.05, z1: 1.1 }); } },
  { at: 'a3', draw(g, lt, D, S) { mioFace(g, lt, D, S, ['a3'], { night: 0, eyes: 'wide', brow: 0.5, look: 0.5 }); } },
  { at: 'a4', draw(g, lt, D, S) { mailNagase(g, lt, D, S, ['a4'], { box: 0, cy: 900, nx: 560, hold: 1, arms: [10, 0, 60, -100] }); subBand(g); } },
  { at: 'a5', finish: { vignette: 0.6 }, draw(g, lt, D, S) { nagase(g, lt, D, S, ['a5'], { eyes: 'normal', look: 0.3, brow: 0.6, z0: 1.1, z1: 1.2 }); mood(g, { red: 0.05 }); } },

  // ── 2. 1年前の写真
  { at: 'b1', draw(g, lt, D) { boxShot(g, lt, D, { open: inv(0, D, lt), night: 1 }); subBand(g); } },
  { at: 'photo', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = easeOut(inv(0, 0.6, lt)); bg(g, '#14110e', '#0a0908'); g.save(); cam(g, { x: 540, y: 960, z: lerp(0.6, 1.0, k), r: lerp(-0.3, 0, k) }); print(g, 540, 640, 960, 720, (q, w, h) => topPhoto(q, w, h, { ...SAKI, t: lt })); g.restore(); } },
  { at: 'b2', draw(g, lt, D) { photoShot(g, lt, D, SAKI, { z0: 1.0, z1: 1.05 }); subBand(g); } },
  { at: 'b3', finish: { vignette: 0.7 }, draw(g, lt, D) { photoShot(g, lt, D, SAKI, { fx: 674, fy: 715, z0: 1.3, z1: 1.7 }); subBand(g); } },
  { at: 'b4', finish: { vignette: 0.7 }, draw(g, lt, D) { photoShot(g, lt, D, SAKI, { fx: 950, fy: 1110, z0: 1.7, z1: 1.9 }); } },
  { at: 'b5', draw(g, lt, D) { bg(g, '#14110e', '#0a0908'); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.08) }); print(g, 540, 640, 960, 720, null, { back: true, note: '水野サキ', rot: 0.02 }); g.restore(); subBand(g); } },
  { at: 'b6', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 1, eyes: 'wide', brow: -0.4, mouth: 'line', look: 0.3 }); } },

  // ── 3. 引っ越していない
  { at: 'c1', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt, name: '管理会社 本社', sub: '発信中', av: '管', col: '#9aa5bb' }), { y: 820 }); subBand(g); } },
  { at: 'dial', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt, name: '管理会社 本社', sub: '呼び出し中', av: '管', col: '#9aa5bb' }), { y: 820, z0: 1.02, z1: 1.04 }); } },
  { at: 'c2', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt, name: '管理会社 本社', sub: '通話中', av: '管' }), { y: 820, z0: 1.04, z1: 1.08 }); subBand(g); } },
  { at: 'c3', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 1, eyes: 'narrow', brow: 0.6, mouth: 'line', look: -0.3 }); } },
  { at: 'c4', draw(g, lt, D, S) { mioFace(g, lt, D, S, ['c4'], { night: 1, eyes: 'wide', brow: 0.6, look: 0.2 }); } },
  { at: 'c5', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt + 40, name: '管理会社 本社', sub: '通話中', av: '管' }), { y: 820, z0: 1.08, z1: 1.15 }); subBand(g); } },
  { at: 'c6', finish: { vignette: 0.7 }, draw(g, lt, D) { mioShock(g, lt, D, { night: 1 }); mood(g, { red: 0.08 }); } },

  // ── 4. 同じ角度
  { at: 'd1', draw(g, lt, D) { pair(g, lt, D); subBand(g); } },
  { at: 'd2', draw(g, lt, D) { pair(g, lt, D, { arrows: easeOut(inv(0.3, 1.0, lt)) }); subBand(g); } },
  { at: 'd3', draw(g, lt, D) { g.save(); cam(g, { x: 640, y: 900, z: slow(lt, D, 1.1, 1.2) }); room203(g, { t: lt, night: 1, hatch: 0.07, bedMio: 2 }); g.restore(); subBand(g); } },
  { at: 'd4', draw(g, lt, D) { lookUp(g, lt, D, { eyes: 'normal' }); subBand(g); } },
  { at: 'look', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = ease(inv(0, D, lt)); g.save(); cam(g, { x: lerp(640, 720, k), y: lerp(900, 300, k), z: lerp(1.2, 2.2, k) }); room203(g, { t: lt, night: 1, hatch: 0.07 + 0.08 * k, bedMio: 2 }); g.restore(); } },

  // ── 5. 引き
  { at: 'e1', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.08) }); ceiling(g, { t: lt, gap: 0.25, blink: 0 }); g.restore(); subBand(g); } },
  { at: 'gap', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 300, y: 900, z: lerp(1.08, 1.8, ease(inv(0, D, lt))) }); ceiling(g, { t: lt, gap: 0.25, blink: 0 }); g.restore(); } },
  { at: 'e2', finish: { vignette: 0.75 }, draw(g, lt, D) { g.save(); cam(g, { x: 300, y: 900, z: slow(lt, D, 1.8, 1.9) }); ceiling(g, { t: lt, gap: 0.25, blink: inv(0.2, 0.6, lt) }); g.restore(); subBand(g); } },
  { at: 'e3', finish: { vignette: 0.8 }, draw(g, lt, D) { g.save(); cam(g, { x: 260, y: 900, z: slow(lt, D, 1.9, 2.4) }); ceiling(g, { t: lt + 0.3, gap: 0.25, blink: 1 }); g.restore(); subBand(g); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.8 },
  { at: 'k2', type: 'stab', vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a2', type: 'heartbeat', dur: 2.5, vol: 0.4 },
  { at: 'a5', type: 'subdrop', vol: 0.5 },
  { at: 'b1', type: 'boxopen', vol: 0.6 },
  { at: 'photo', type: 'impact', vol: 0.8 },
  { at: 'b3', type: 'stab', vol: 0.7 },
  { at: 'b5', type: 'rustle', vol: 0.5 },
  { at: 'dial', type: 'dial', vol: 0.5 },
  { at: 'c5', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'c6', type: 'hit', vol: 0.8 },
  { at: 'd1', type: 'roomtone', dur: 12, vol: 0.3 },
  { at: 'look', type: 'riser', vol: 0.6 },
  { at: 'e1', type: 'stab', vol: 0.6 },
  { at: 'e2', type: 'heartbeat', dur: 2, vol: 0.5 },
  { at: 'e3', type: 'hit', vol: 0.85 },
  { at: 'e3:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'suspense' },
  { at: 'photo', mood: 'silence' },
  { at: 'b3', mood: 'tension' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'c6', mood: 'tension' },
  { at: 'd1', mood: 'suspense' },
  { at: 'look', mood: 'silence' },
  { at: 'e1', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['b1', '11月6日　夜　203号室', 2.4]]) });
