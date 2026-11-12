// 置き配 第2話「合鍵」— 映像・効果音・BGM
// 手がかり（最終話で回収）：赤い札の合鍵（203だけ1本ない）／戸川の眼鏡が光る／防犯カメラは戸川が見ている
//   ／長瀬が「管理人には」と言うとき廊下の奥を気にする／写真の暗がりの赤い札（かすか）
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, sfxText } from '../../engine/noir.js';
import { O, cardboard, topPhoto, print, room203, doorFront, secCam, keyCabinet, mailboxes } from '../../engine/okihaisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, subBand, cover as coverBase, endCard, mioFace, mioShock, faceOf, photoShot, billShot, boxShot } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep02.script.js';

const D4 = { date: '2026.11.06', time: '3:12' };
const outside = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1100, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); doorFront(g, { t: lt, ...o.set }); g.restore(); };
// 部屋に戸川とミオ（昼）
function roomTwo(g, lt, D, S, ids = [], o = {}) {
  g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) });
  room203(g, { t: lt, night: 0, hatch: 0.07 });
  figure(g, P.togawa, { x: 700, y: 1560, s: 1.12, eyes: 'normal', mouth: 'smile', talk: talking(lt, S, ids) * 0.6, turn: -0.3, arms: [10, 0, 40, -80], lightFrom: 'right' });
  figure(g, P.mio, { x: 340, y: 1570, s: 1.1, eyes: 'normal', brow: 0.4, turn: 0.3, look: 0.6, arms: [10, 0, 10, 0], lightFrom: 'left' });
  g.restore();
}
const togawa = (g, lt, D, S, ids = [], o = {}) => faceOf(g, lt, D, S, 'togawa', ids, { eyes: 'normal', mouth: 'smile', a: '#c9c6bd', b: '#8f8b82', ...o });
const nagase = (g, lt, D, S, ids = [], o = {}) => faceOf(g, lt, D, S, 'nagase', ids, { eyes: 'narrow', bags: true, brow: 0.2, a: '#b9bcbf', b: '#7f8286', look: -0.4, ...o });
// 事務所のモニターに防犯カメラ
function monitor(g, lt, D, draw, o = {}) {
  bg(g, '#1e2026', '#0e1014');
  g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 700, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  fillRR(g, 20, 300, 1040, 800, 20, '#0a0a0c'); g.save(); g.translate(40, 320); secCam(g, 1000, 750, { t: lt, draw }); g.restore();
  fillRR(g, 470, 1100, 140, 90, 0, '#141418'); fillRR(g, 340, 1190, 400, 24, 8, '#141418');
  g.restore();
}
// 箱を置く長瀬（防犯カメラの中、上から）。bend＝かがみ具合
const placing = (bend = 1) => q => figure(q, P.nagase, { x: 800, y: 660, s: 0.5, turn: 0.5, eyes: 'narrow', arms: [lerp(10, 25, bend), lerp(0, -40, bend), lerp(10, 25, bend), lerp(0, -40, bend)] });
const atNagaseDoor = (S, lt, ids = [], o = {}) => q => figure(q, P.nagase, { x: 560, y: 1830, s: 1.42, eyes: o.eyes || 'narrow', bags: true, brow: o.brow ?? 0.2, mouth: 'line', talk: talking(lt, S, ids) * 0.6, turn: o.turn ?? 0.3, look: o.look ?? -0.5, arms: [10, 0, 10, 0], lightFrom: 'left' });

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 2, title: '合鍵',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 700, z: 1.2 }); keyCabinet(g2, { missing: 1 }); g2.restore(); },
    face: g2 => close(g2, P.mio, { y: 1480, s: 2.9, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', look: 0.4 }),
  });
}

const SHOTS = [
  // ── 冒頭：前の住人あての箱を開ける
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D) { boxShot(g, lt, D, { open: 0.2 + inv(0, 0.3, lt) * 0.8, to: '水野サキ 様', z0: 1.0, z1: 1.0 }); } },
  { at: 'k1', finish: { vignette: 0.65 }, draw(g, lt, D) { photoShot(g, lt, D, D4, { fx: 674, fy: 715, z0: 1.0, z1: 1.45 }); subBand(g); } },
  { at: 'k2', finish: { vignette: 0.7 }, draw(g, lt, D) { photoShot(g, lt, D, D4, { fx: 950, fy: 1110, z0: 1.7, z1: 1.9 }); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D) { mioShock(g, lt, D, { night: 0 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#050608', '#0a0b0e'); cover(g, lt); } },

  // ── 1. 戸川
  { at: 'a1', draw(g, lt, D, S) { outside(g, lt, D, { y: 1150, set: { box: 0, people: q => figure(q, P.togawa, { x: 560, y: 1830, s: 1.4, eyes: 'normal', mouth: 'smile', arms: [10, 0, 40, -60], lightFrom: 'left' }) } }); subBand(g); } },
  { at: 'a2', draw(g, lt, D, S) { togawa(g, lt, D, S, ['a2'], { brow: 0.3 }); tag(g, '管理会社　戸川（56）', 540, 220, { size: 42, bg: '#14161c', color: '#e9e4da', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'a3', draw(g, lt, D, S) { mioFace(g, lt, D, S, ['a3'], { night: 0, eyes: 'normal', brow: 0.5, look: 0.5 }); } },
  { at: 'a4', draw(g, lt, D, S) { roomTwo(g, lt, D, S, ['a4']); subBand(g); } },

  // ── 2. 合鍵の金庫
  { at: 'b1', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.05) }); keyCabinet(g, { open: inv(0, 0.8, lt), t: lt }); g.restore(); subBand(g); } },
  { at: 'keys', draw(g, lt, D) { g.save(); cam(g, { x: lerp(540, 820, ease(inv(0, D, lt))), y: lerp(960, 800, ease(inv(0, D, lt))), z: lerp(1.05, 2.0, ease(inv(0, D, lt))) }); keyCabinet(g, {}); g.restore(); } },
  { at: 'b2', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 820, y: 800, z: slow(lt, D, 2.0, 2.15) }); keyCabinet(g, { missing: inv(0.2, 0.6, lt) }); g.restore(); subBand(g); } },
  { at: 'b3', draw(g, lt, D, S) { togawa(g, lt, D, S, ['b3'], { mouth: 'line', eyes: 'narrow', glint: inv(0.6, 1.2, lt) * 0.8, look: -0.5 }); } },
  { at: 'b4', draw(g, lt, D, S) { togawa(g, lt, D, S, ['b4'], { mouth: 'smile', z0: 1.04, z1: 1.1 }); } },
  { at: 'b5', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 0, eyes: 'narrow', brow: 0.6, mouth: 'line', look: -0.4 }); } },

  // ── 3. 防犯カメラ
  { at: 'c1', draw(g, lt, D, S) { monitor(g, lt, D, null, { z0: 1.0, z1: 1.03 }); subBand(g); } },
  { at: 'c2', draw(g, lt, D) { monitor(g, lt, D, null, { z0: 1.03, z1: 1.08 }); subBand(g); } },
  { at: 'cam', finish: { vignette: 0.6 }, draw(g, lt, D) { monitor(g, lt, D, placing(ease(inv(0, D, lt))), { z0: 1.08, z1: 1.2 }); } },
  { at: 'c3', finish: { vignette: 0.6 }, draw(g, lt, D) { monitor(g, lt, D, placing(1), { cx: 820, cy: 760, z0: 1.6, z1: 1.8 }); subBand(g); } },
  { at: 'c4', draw(g, lt, D, S) { togawa(g, lt, D, S, ['c4'], { mouth: 'line', eyes: 'normal', glint: 0.5, look: 0.5, back: g2 => bg(g2, '#2a3040', '#141820') }); } },
  { at: 'c5', draw(g, lt, D) { outside(g, lt, D, { x: 420, y: 1100, z0: 1.0, z1: 1.05, set: { box: 0, plate: '202', neighbor: false, doorC: '#6a7480' } }); subBand(g); } },
  { at: 'c6', finish: { vignette: 0.65 }, draw(g, lt, D) { monitor(g, lt, D, placing(1), { cx: 760, cy: 720, z0: 1.4, z1: 1.55 }); mood(g, { red: 0.06 }); subBand(g); } },

  // ── 4. 隣の男
  { at: 'door', draw(g, lt, D) { outside(g, lt, D, { y: 1150, set: { box: 0, plate: '202', neighbor: false, doorC: '#6a7480', people: atNagaseDoor({ L: () => 0, Le: () => 0 }, lt, [], { look: 0 }) } }); sfxText(g, 'ガチャ', 820, 320, { size: 100, color: '#f4f1ea', alpha: inv(0, 0.15, lt), rot: 0.08 }); } },
  { at: 'd1', draw(g, lt, D, S) { outside(g, lt, D, { y: 1150, set: { box: 0, plate: '202', neighbor: false, doorC: '#6a7480', people: atNagaseDoor(S, lt) } }); subBand(g); } },
  { at: 'd2', draw(g, lt, D, S) { mioFace(g, lt, D, S, ['d2'], { night: 0, eyes: 'normal', brow: 0.6, look: 0.6 }); } },
  { at: 'd3', draw(g, lt, D, S) { nagase(g, lt, D, S, ['d3']); tag(g, '隣の202号室　長瀬（34）', 540, 220, { size: 42, bg: '#14161c', color: '#e9e4da', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'd4', draw(g, lt, D, S) { nagase(g, lt, D, S, ['d4'], { look: 0.2, eyes: 'normal', z0: 1.05, z1: 1.12 }); } },
  { at: 'd5', draw(g, lt, D, S) { mioFace(g, lt, D, S, ['d5'], { night: 0, eyes: 'wide', brow: 0.5, look: 0.6 }); } },
  { at: 'd6', finish: { vignette: 0.6 }, draw(g, lt, D, S) { nagase(g, lt, D, S, ['d6'], { look: lt < D * 0.5 ? 0.9 : 0.1, eyes: 'normal', brow: 0.6, z0: 1.1, z1: 1.2 }); mood(g, { red: 0.05 }); } },
  { at: 'd6b', draw(g, lt, D, S) { mioFace(g, lt, D, S, ['d6b'], { night: 0, eyes: 'normal', brow: 0.6, look: 0.6 }); } },
  { at: 'shut', draw(g, lt, D) { outside(g, lt, D, { y: 1150, set: { box: 0, plate: '202', neighbor: false, doorC: '#6a7480' } }); sfxText(g, 'バタン', 540, 600, { size: 140, color: '#f4f1ea', alpha: inv(0, 0.1, lt), rot: -0.06 }); } },
  { at: 'd7', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 0, eyes: 'narrow', brow: 0.4, mouth: 'line', look: 0.7 }); } },

  { at: 'd8', finish: { vignette: 0.6 }, draw(g, lt, D) { outside(g, lt, D, { x: 540, y: 1000, z0: 1.05, z1: 1.15, set: { box: 0, plate: '202', neighbor: false, doorC: '#6a7480' } }); subBand(g); } },

  // ── 5. 引き
  { at: 'e1', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 0.95, 1.0) }); mailboxes(g, { box: 1, t: lt }); g.restore(); subBand(g); } },
  { at: 'e2', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D, 1.0, 1.5) }); mailboxes(g, { box: 1, t: lt }); g.restore(); subBand(g); } },
  { at: 'mail', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 740, z: lerp(1.5, 2.6, ease(inv(0, D, lt))) }); mailboxes(g, { box: 1 }); g.restore(); } },
  { at: 'e3', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 720, z: slow(lt, D, 2.6, 2.8) }); mailboxes(g, { box: 1 }); g.restore(); subBand(g); } },
  { at: 'e4', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 720, z: 2.8 }); mailboxes(g, { box: 1, hi: inv(0, 0.6, lt) }); g.restore(); subBand(g); } },
  { at: 'e5', finish: { vignette: 0.75 }, draw(g, lt, D) { mioShock(g, lt, D, { night: 0 }); mood(g, { red: 0.1 * inv(0, D, lt), dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'boxopen', vol: 0.7 },
  { at: 'k1', type: 'hit', vol: 0.7 },
  { at: 'k3', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'steps', vol: 0.4 },
  { at: 'b1', type: 'creak', vol: 0.5 },
  { at: 'keys', type: 'chain', vol: 0.4 },
  { at: 'b2', type: 'stab', vol: 0.7 },
  { at: 'b5', type: 'heartbeat', dur: 2, vol: 0.4 },
  { at: 'c1', type: 'tap3', vol: 0.4 },
  { at: 'cam', type: 'glitch', vol: 0.4 },
  { at: 'c3', type: 'hit', vol: 0.8 },
  { at: 'door', type: 'unlock', vol: 0.6 },
  { at: 'd4', type: 'stab', vol: 0.6 },
  { at: 'shut', type: 'clunk', vol: 0.8 },
  { at: 'e1', type: 'steps', vol: 0.4 },
  { at: 'mail', type: 'riser', vol: 0.6 },
  { at: 'e4', type: 'hit', vol: 0.85 },
  { at: 'e5:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'calm' },
  { at: 'b1', mood: 'uneasy' },
  { at: 'b2', mood: 'suspense' },
  { at: 'cam', mood: 'silence' },
  { at: 'c3', mood: 'tension' },
  { at: 'door', mood: 'silence' },
  { at: 'd1', mood: 'suspense' },
  { at: 'shut', mood: 'silence' },
  { at: 'e1', mood: 'uneasy' },
  { at: 'mail', mood: 'silence' },
  { at: 'e4', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a1', '11月6日　朝　コーポ白樺', 2.6], ['b1', '管理会社の事務所', 2.4], ['d1', '昼　2階の廊下', 2.4]]) });
