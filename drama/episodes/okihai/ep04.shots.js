// 置き配 第4話「送り主」— 映像・効果音・BGM
// 回収：点検口のずれ・赤い光（充電のランプ）／写真はどれも真上から／暗がりの赤い札＝合鍵の金庫の203
// 手がかり（最終話で回収）：待ち受けの若い男（ケン）／ドアスコープの戸川の手に赤い札の鍵
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, sfxText } from '../../engine/noir.js';
import { O, topPhoto, print, room203, ceiling, sakiLock, callView, editView, scope, chainDoor } from '../../engine/okihaisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, subBand, cover as coverBase, endCard, mioFace, mioShock, phoneShot, photoShot } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep04.script.js';

const D4 = { date: '2026.11.06', time: '3:12' };
const ceil = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 900, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); ceiling(g, { t: lt, gap: 0.25, ...o.set }); g.restore(); };
// 電話（サキ）を耳にあてるミオ
const onCall = (g, lt, D, S, o = {}) => { mioFace(g, lt, D, S, [], { night: 1, eyes: 'normal', brow: 0.4, look: 0.3, ...o }); g.save(); g.translate(820, 640); g.rotate(0.25); fillRR(g, -60, -150, 120, 300, 20, '#141620'); glow(g, 0, 0, 160, 'rgba(120,200,255,1)', 0.25); g.restore(); };
const editShot = (g, lt, D, b, o = {}) => phoneShot(g, lt, D, (p, w, h) => editView(p, w, h, { t: lt, bright: b, img: (q, w2, h2, bb) => topPhoto(q, w2, h2, { ...D4, bright: bb }) }), { y: o.y ?? 760, z0: o.z0 ?? 1.0, z1: o.z1 ?? 1.04, x: o.x });
// ドアスコープの戸川（赤い札の鍵を見せる）
const togawaScope = (g, lt, o = {}) => scope(g, { t: lt, draw: (q, cx, cy) => { close(q, P.togawa, { x: cx, y: cy + 40, s: 3.2, eyes: o.eyes || 'normal', mouth: o.mouth || 'smile', talk: o.talk || 0, lightFrom: 'left', glint: o.glint || 0 }); if (o.key) { ell(q, cx + 170, cy + 250, 48, 34, '#e8d3c0'); line(q, cx + 170, cy + 210, cx + 170, cy + 150, 6, '#c9ced4'); fillRR(q, cx + 150, cy + 80, 40, 70, 6, O.red); text(q, '203', cx + 170, cy + 115, { size: 18, color: '#fff', weight: 800 }); } } });

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 4, title: '送り主',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 650, z: 1.25 }); ceiling(g2, { open: 1, flash: 1, t: 0.1 }); g2.restore(); },
    face: g2 => close(g2, P.mio, { y: 1480, s: 2.9, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', lookY: -1, look: 0.2 }),
  });
}

const SHOTS = [
  // ── 冒頭：点検口を開ける
  { at: 'cold', off: -0.3, finish: { vignette: 0.65 }, draw(g, lt, D) { ceil(g, lt, D, { z0: 1.0, z1: 1.0, set: { blink: 1, hand: 1, flash: 0.6 } }); } },
  { at: 'k1', finish: { vignette: 0.65 }, draw(g, lt, D) { ceil(g, lt, D, { set: { blink: 1, hand: 1, flash: 0.6, open: inv(D * 0.6, D, lt) * 0.3 } }); subBand(g); } },
  { at: 'open', finish: { vignette: 0.7 }, draw(g, lt, D) { ceil(g, lt, D, { z0: 1.06, z1: 1.2, set: { blink: 1, hand: 1, flash: 1, open: lerp(0.3, 1, ease(inv(0, 0.7, lt))) } }); } },
  { at: 'k2', finish: { vignette: 0.7 }, draw(g, lt, D) { ceil(g, lt, D, { x: 510, y: 780, z0: 1.5, z1: 1.7, set: { blink: 1, open: 1, flash: 1 } }); subBand(g); } },
  { at: 'k3', finish: { vignette: 0.75 }, draw(g, lt, D) { ceil(g, lt, D, { x: 480, y: 580, z0: 2.6, z1: 3.2, set: { blink: 1, open: 1, flash: 1 } }); subBand(g); mood(g, { red: 0.06 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#050608', '#0a0b0e'); cover(g, lt); } },

  // ── 1. 天井のスマホ
  { at: 'a1', finish: { vignette: 0.7 }, draw(g, lt, D) { ceil(g, lt, D, { x: 640, y: 700, z0: 1.4, z1: 1.5, set: { blink: 1, open: 1, flash: 1 } }); subBand(g); } },
  { at: 'a2', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => sakiLock(p, w, h, { t: lt })); subBand(g); } },
  { at: 'a3', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => sakiLock(p, w, h, { t: lt }), { x: 420, y: 980, z0: 1.5, z1: 1.65 }); subBand(g); } },
  { at: 'ring', finish: { vignette: 0.6 }, draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => sakiLock(p, w, h, { t: lt, call: inv(0, 0.3, lt) }), { rot: noise1(lt * 40, 2) * 0.02 }); } },
  { at: 'a4', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => sakiLock(p, w, h, { t: lt, call: 1 }), { rot: noise1(lt * 40, 2) * 0.015 }); subBand(g); } },

  // ── 2. 送り主
  { at: 'b1', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt, name: '090-●●●●-0314', av: '？', sub: '通話中' }), { y: 820 }); subBand(g); } },
  { at: 'b2', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt + 4, name: '水野サキ', av: 'サ', sub: '通話中' }), { y: 820, z0: 1.04, z1: 1.08 }); subBand(g); tag(g, '前の住人　水野サキ（27）', 540, 140, { size: 42, bg: '#14161c', color: '#e9e4da', alpha: inv(0.4, 0.7, lt) }); } },
  { at: 'b3', draw(g, lt, D, S) { onCall(g, lt, D, S, { eyes: 'narrow', brow: 0.7, talk: talking(lt, S, ['b3']) * 0.5 }); } },
  { at: 'b4', draw(g, lt, D, S) { onCall(g, lt, D, S, { eyes: 'wide', brow: 0.4, z0: 1.05, z1: 1.1 }); } },

  { at: 'b5', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 640, y: 960, z: slow(lt, D, 1.0, 1.06) }); room203(g, { t: lt, night: 1, hatch: 0.07, mio: null }); figure(g, P.saki, { x: 360, y: 1780, s: 1.3, eyes: 'narrow', brow: 0.5, lookY: -1, look: 0.6, arms: [10, 0, 10, 0], lightFrom: 'right' }); g.restore(); mood(g, { desat: 0.6 }); tag(g, '1年前', 540, 180, { size: 44, bg: '#14161c', color: '#ffd451', alpha: inv(0.2, 0.5, lt) }); subBand(g); } },
  // ── 3. 動いたときだけ
  { at: 'c1', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 700, y: 760, z: slow(lt, D, 1.2, 1.3) }); room203(g, { t: lt, night: 1, hatchOpen: 1, chair: 1 }); g.restore(); subBand(g); } },
  { at: 'c2', draw(g, lt, D) { photoShot(g, lt, D, { ...D4, bright: 0 }, { z0: 1.0, z1: 1.06 }); subBand(g); } },
  { at: 'c3', draw(g, lt, D) { photoShot(g, lt, D, { ...D4, bright: 0 }, { fx: 674, fy: 715, z0: 1.3, z1: 1.45 }); subBand(g); } },
  { at: 'c4', draw(g, lt, D, S) { onCall(g, lt, D, S, { eyes: 'narrow', brow: 0.4, look: -0.3 }); } },

  // ── 4. 暗がりの男
  { at: 'd1', draw(g, lt, D) { editShot(g, lt, D, 0.15 * inv(0, D, lt)); subBand(g); } },
  { at: 'bright', finish: { vignette: 0.6 }, draw(g, lt, D) { editShot(g, lt, D, lerp(0.15, 1, ease(inv(0, D * 0.9, lt))), { z0: 1.04, z1: 1.1 }); } },
  { at: 'd2', finish: { vignette: 0.7 }, draw(g, lt, D) { photoShot(g, lt, D, { ...D4, bright: 1 }, { fx: 300, fy: 900, z0: 1.4, z1: 1.7 }); subBand(g); mood(g, { red: 0.08 * inv(0, D, lt) }); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D) { photoShot(g, lt, D, { ...D4, bright: 1 }, { fx: 480, fy: 780, z0: 2.4, z1: 2.8 }); subBand(g); } },
  { at: 'd4', draw(g, lt, D, S) { onCall(g, lt, D, S, { eyes: 'wide', brow: -0.4, mouth: 'line' }); } },
  { at: 'd5', finish: { vignette: 0.65 }, draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt + 60, name: '水野サキ', av: 'サ', sub: '通話中', col: '#ff7a6a' }), { y: 820, z0: 1.1, z1: 1.2 }); subBand(g); } },

  { at: 'd6', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.04) }); room203(g, { t: lt, night: 1, hatchOpen: 1, chair: 1, mio: { x: 420, y: 1790, s: 1.32, eyes: 'wide', brow: -0.3, turn: -0.4, look: -0.8, arms: [20, -60, 10, 0] } }); g.restore(); subBand(g); } },
  // ── 5. 引き
  { at: 'lock', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 560, y: 900, z: slow(lt, D, 1.3, 1.4) }); chainDoor(g, { gap: 0, chain: 0, lock: 1 - ease(inv(0.2, 1.0, lt)), t: lt }); g.restore(); sfxText(g, 'カチャ', 800, 420, { size: 110, color: '#f4f1ea', alpha: inv(0.6, 0.8, lt), rot: 0.1 }); } },
  { at: 'e1', draw(g, lt, D, S) { mioShock(g, lt, D, { night: 1, look: 0.6 }); } },
  { at: 'e2', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D, 1.0, 2.2) }); chainDoor(g, { gap: 0, chain: 0, lock: 0 }); g.restore(); subBand(g); } },
  { at: 'scope', finish: { vignette: 0.7 }, draw(g, lt) { togawaScope(g, lt, { mouth: 'line' }); } },
  { at: 'e3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { togawaScope(g, lt, { mouth: 'smile', talk: talking(lt, S, ['e3']) * 0.6, key: 1, glint: 0.4 }); } },
  { at: 'e4', finish: { vignette: 0.8 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.12) }); togawaScope(g, lt, { mouth: 'smile', key: 1, glint: 0.7 }); g.restore(); mood(g, { red: 0.1 * inv(0, D, lt), dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'creak', vol: 0.6 },
  { at: 'open', type: 'scrape', vol: 0.6 },
  { at: 'k2', type: 'hit', vol: 0.8 },
  { at: 'k3', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 10, vol: 0.3 },
  { at: 'ring', type: 'vibrate', vol: 0.7 },
  { at: 'a4', type: 'ringtone', vol: 0.5 },
  { at: 'b1', type: 'pickup', vol: 0.5 },
  { at: 'b4', type: 'stab', vol: 0.6 },
  { at: 'c2', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'bright', type: 'riser', vol: 0.6 },
  { at: 'd2', type: 'hit', vol: 0.9 },
  { at: 'd3', type: 'stab', vol: 0.6 },
  { at: 'lock', type: 'unlock', vol: 0.8 },
  { at: 'e1', type: 'heartbeat', dur: 4, vol: 0.5 },
  { at: 'scope', type: 'riser', vol: 0.5 },
  { at: 'e3', type: 'stab', vol: 0.6 },
  { at: 'e4:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'ring', mood: 'silence' },
  { at: 'b1', mood: 'suspense' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'bright', mood: 'silence' },
  { at: 'd2', mood: 'tension' },
  { at: 'lock', mood: 'silence' },
  { at: 'e1', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a1', '11月6日　23時41分　203号室', 2.6]]) });
