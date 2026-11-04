// 父のスマホ 第5話（最終話）「おはよう」— 映像・効果音・BGM
// 回収：20年目の朝7時の交差点／車いすの母／へこんだ家の車／7:00の「おはよう、あなた」／カズミの窓と、花を置く父／パスコード＝私の誕生日（家族写真）
//   ／はじめての返事。最後は12月8日の朝7時、私のスマホに知らない番号（末尾1207）から「おはよう、ナツキ」、向かいの窓で上がる手
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, speedLines } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { Y, crossing, crossingDown, wheelchair, kazumiRoom, oppView, msgList, carPhoto2, entrancePhoto, danchiRoom } from '../../engine/chichisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, FAMILY, bg, slow, heads, subBand, phone, room, face, lockS, talking, cover as coverBase, coverFace, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep05.script.js';

const DAWN = 0.45;
const dawnBg = g2 => { vgrad(g2, -300, -300, W + 600, H + 600, [[0, '#4a5a7c'], [1, '#2a2e3a']]); glow(g2, 900, 300, 900, 'rgba(255,220,180,1)', 0.25); };
const nat = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'natsuki', ids, { back: dawnBg, lightFrom: 'right', ...o });
const mom = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'taeko', ids, { back: dawnBg, lightFrom: 'right', ...o });
const kaz = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'kazumi', ids, { back: dawnBg, lightFrom: 'right', ...o });
const ryo = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'ryo', ids, { back: dawnBg, lightFrom: 'right', ...o });
const shock = (g, lt, D, o = {}) => { dawnBg(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,240,220,.16)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.natsuki, { y: 660, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', ...o }); g.restore(); };
// 交差点：車いすの母とリョウ。kaz＝向こう側の歩道のカズミ
const scene = (g, lt, D, o = {}) => {
  g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1000, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06), ...(o.shake ? { sx: noise1(lt * 30, 2) * o.shake } : {}) });
  crossing(g, { t: lt, dawn: o.dawn ?? DAWN, signal: o.signal || 'red', truck: o.truck ?? -1, flowers: o.flowers ?? 0 });
  if (o.kaz) figure(g, P.kazumi, { x: 860, y: 1100, s: 0.55, lightFrom: 'left', eyes: 'narrow', alpha: o.kaz });
  if (o.ryo !== false) figure(g, P.ryo, { x: 760, y: 1760, s: 1.35, lightFrom: 'right', eyes: 'narrow', mouth: 'line', turn: -0.5, arms: [10, -10, 50, -80] });
  wheelchair(g, P.taeko, { x: 560, y: 1730, s: 1.15, eyes: 'narrow', brow: -0.3, mouth: 'line', lightFrom: 'right' });
  if (o.nat) figure(g, P.natsuki, { x: 140, y: 1840, s: 1.4, lightFrom: 'right', eyes: 'wide', mouth: 'open', turn: 0.6, alpha: o.nat });
  g.restore();
};
const kroom = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) }); kazumiRoom(g, { t: lt, P, ...o.set }); g.restore(); };
const famImg = (q, w, h) => entrancePhoto(q, w, h, { kid: 'natsuki', P: FAMILY });
const NOTE = [{ d: '12月7日' }, { text: 'おはよう、あなた。', time: '7:00' }];
const REPLY = [...NOTE, { text: 'おはようございます。\n明日も、窓を開けておきます。', me: 1, time: '7:06' }];
const UNKNOWN = { name: '090-●●●●-1207', av: '？', col: '#5a5e68' };

export function cover(g, lt = 9) {
  coverBase(g, lt, { no: 5, title: 'おはよう', back: g2 => { g2.save(); cam(g2, { x: 540, y: 1000, z: 1.05 }); crossing(g2, { t: 3, dawn: DAWN, signal: 'red', flowers: 1 }); g2.restore(); }, face: coverFace({ eyes: 'normal', brow: -0.2, phoneLight: false }) });
}

const SHOTS = [
  // ── 冒頭：交差点の車いす
  { at: 'cold', off: -0.3, finish: { vignette: 0.55 }, draw(g, lt, D) { scene(g, lt, D, { z0: 1.0, z1: 1.0, truck: 0.35 }); } },
  { at: 'k1', finish: { vignette: 0.55 }, draw(g, lt, D) { scene(g, lt, D, { truck: lerp(0.36, 0.95, inv(0, D, lt)) }); } },
  { at: 'k2', finish: { vignette: 0.6 }, draw(g, lt, D) { scene(g, lt, D, { x: 640, y: 1100, z0: 1.3, z1: 1.45, truck: lerp(0.1, 0.6, inv(0, D, lt)) }); } },
  { at: 'k3', finish: { vignette: 0.65 }, draw(g, lt, D, S) { shock(g, lt, D, { mouth: 'open', brow: 0.4 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 頼んだのは母
  { at: 'a1', finish: { vignette: 0.6 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['a1'], { eyes: 'narrow', brow: 0.7, mouth: 'line', look: -0.6 }); } },
  { at: 'a3', draw(g, lt, D, S) { mom(g, lt, D, S, ['a3'], { eyes: 'normal', brow: -0.5, mouth: 'line', look: -0.6 }); } },
  { at: 'a4', draw(g, lt, D, S) { ryo(g, lt, D, S, ['a4'], { eyes: 'normal', brow: 0.2, mouth: 'line', look: 0.4 }); } },
  { at: 'a5', draw(g, lt, D, S) { mom(g, lt, D, S, ['a5'], { eyes: 'narrow', brow: -0.4, mouth: 'line' }); } },

  // ── 2. 運転していたのは
  { at: 'b1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { mom(g, lt, D, S, ['b1'], { eyes: 'closed', brow: -0.6, mouth: 'line', z0: 1.04, z1: 1.14 }); } },
  { at: 'b2', finish: { vignette: 0.65 }, draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.2) }); photo(g, 540, 560, 640, 520, (q, w, h) => carPhoto2(q, w, h, { dent: 1 }), { rot: -0.02 }); g.restore(); mood(g, { desat: 0.5 }); tag(g, '2006年12月7日', 540, 1030, { size: 40, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'b3', draw(g, lt, D, S) { mom(g, lt, D, S, ['b3'], { eyes: 'narrow', brow: -0.7, mouth: 'line', lookY: 0.6 }); } },
  { at: 'b4', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); photo(g, 540, 600, 640, 520, carPhoto2, { rot: 0.02 }); } },
  { at: 'b5', finish: { vignette: 0.65 }, draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'normal', brow: -0.5, mouth: 'line', lookY: 0.5 }); } },

  // ── 3. 7時
  { at: 'seven', finish: { vignette: 0.6 }, draw(g, lt, D) { const sh = noise1(lt * 40, 3) * 8; g.save(); g.translate(sh, 0); lockS(g, lt, D, { date: '12月7日 月曜日', notifs: [{ t: 0.1, body: 'おはよう、あなた。', time: '7:00' }] }); g.restore(); } },
  { at: 'c1', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { date: '12月7日 月曜日', notifs: [{ t: -1, body: 'おはよう、あなた。', time: '7:00' }], z0: 1.0, z1: 1.06 }); } },
  { at: 'c2', finish: { vignette: 0.55 }, draw(g, lt, D) { scene(g, lt, D, { x: 760, y: 1120, z0: 1.4, z1: 1.55, kaz: inv(0, 0.6, lt), signal: 'green' }); } },
  { at: 'c3', finish: { vignette: 0.6 }, draw(g, lt, D, S) { kaz(g, lt, D, S, ['c3'], { eyes: 'narrow', brow: -0.2, mouth: 'line' }); } },
  { at: 'c4', draw(g, lt, D) { g.save(); cam(g, { x: 400, y: 1000, z: slow(lt, D, 1.3, 1.45) }); crossingDown(g, { t: lt, dawn: 0.25, car: lerp(0.35, 0.7, inv(0, D, lt)) }); g.restore(); mood(g, { desat: 0.6 }); tag(g, '20年前　カズミの窓から', 540, 160, { size: 38, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'c5', draw(g, lt, D, S) { kaz(g, lt, D, S, ['c5'], { eyes: 'narrow', brow: -0.4, mouth: 'line', look: -0.4 }); } },
  { at: 'c6', draw(g, lt, D, S) { nat(g, lt, D, S, ['c6'], { eyes: 'normal', brow: -0.3 }); } },
  { at: 'c7', draw(g, lt, D) { kroom(g, lt, D, { x: 740, y: 790, z0: 1.3, z1: 1.45, set: { dawn: 0.5, candleOn: 0 } }); mood(g, { desat: 0.4 }); } },
  { at: 'c8', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 400, y: 900, z: slow(lt, D, 1.2, 1.4) }); crossingDown(g, { t: lt, dawn: 0.45, man: 1 }); g.restore(); mood(g, { desat: 0.3 }); } },
  { at: 'c9', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { t: lt + 9, msgs: NOTE, hi: 1 }), { x: 430, y: 420, z0: 1.6, z1: 1.75 }); subBand(g); } },
  { at: 'c10', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 260, y: 1420, z: slow(lt, D, 2.0, 2.3) }); crossing(g, { t: lt, dawn: DAWN, signal: 'green', flowers: 1 }); g.restore(); subBand(g); } },
  { at: 'c11', finish: { vignette: 0.65 }, draw(g, lt, D, S) { kaz(g, lt, D, S, ['c11'], { eyes: 'normal', brow: 0.1, mouth: 'line', z0: 1.04, z1: 1.12 }); } },

  // ── 4. 返事
  { at: 'd1', draw(g, lt, D, S) { ryo(g, lt, D, S, ['d1'], { eyes: 'narrow', brow: -0.3, mouth: 'line', look: -0.7 }); } },
  { at: 'd2', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); g.save(); cam(g, { x: lerp(540, 590, ease(inv(0, D, lt))), y: lerp(700, 720, ease(inv(0, D, lt))), z: lerp(1.0, 1.4, ease(inv(0, D, lt))) }); photo(g, 540, 560, 600, 700, famImg, { rot: -0.02 }); g.restore(); } },
  { at: 'd3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { t: 9, msgs: NOTE })); } },
  { at: 'd4', finish: { vignette: 0.55 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { t: 9, msgs: lt < 0.6 ? NOTE : REPLY }), { z0: 1.0, z1: 1.06 }); glow(g, 540, 600, 700, 'rgba(255,214,150,1)', 0.18 * inv(0.6, 1.4, lt)); } },

  // ── 5. 終わり
  { at: 'next', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 900, z0: 1.0, z1: 1.03, set: { lamp: 0.2, morning: 0.6, curtain: 0.2, phone: 0 } }); tag(g, '12月8日 7:00', 540, 1030, { size: 44, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.1, 0.4, lt) }); } },
  { at: 'e1', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { own: true, date: '12月8日 火曜日', notifs: [{ t: 0.2, ...UNKNOWN, body: 'おはよう、ナツキ。\n明日も、窓を開けておいて。', time: '7:00' }] }); } },
  { at: 'e2', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { own: true, date: '12月8日 火曜日', notifs: [{ t: -1, ...UNKNOWN, body: 'おはよう、ナツキ。\n明日も、窓を開けておいて。', time: '7:00' }], z0: 1.04, z1: 1.12 }); } },
  { at: 'window', finish: { vignette: 0.6 }, draw(g, lt, D) { room(g, lt, D, { x: 840, y: 600, z0: 1.3, z1: 1.6, set: { lamp: 0.2, morning: 0.6, curtain: ease(inv(0, 1.0, lt)) * 0.8 + 0.2, phone: 0, opp: { tLit: 1, sil: 1 } } }); } },
  { at: 'e3', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 660, z: slow(lt, D, 1.8, 2.3) }); oppView(g, { t: lt, dawn: 0.5, tLit: 1, sil: 1, wave: ease(inv(0.2, 0.8, lt)) }); g.restore(); } },
  { at: 'e4', finish: { vignette: 0.75 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 660, z: slow(lt, D, 2.3, 2.9) }); oppView(g, { t: lt, dawn: 0.5, tLit: 1, sil: 1, wave: 1 - inv(D - 1.2, D - 0.4, lt) }); g.restore(); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'engine', dur: 3, vol: 0.6 },
  { at: 'cold', type: 'hit', vol: 0.6 },
  { at: 'k1', type: 'steps', dur: 2.5, vol: 0.6 },
  { at: 'k3', type: 'stab', vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'wind', dur: 8, vol: 0.3 },
  { at: 'a3', type: 'hit', vol: 0.6 },
  { at: 'b1', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'b1:end', type: 'hit', vol: 0.9 },
  { at: 'b2', type: 'carstop', vol: 0.5 },
  { at: 'b5', type: 'riser', vol: 0.4 },
  { at: 'seven', type: 'vibrate', dur: 0.9, vol: 0.7 },
  { at: 'seven', off: 0.1, type: 'notif', vol: 0.8 },
  { at: 'c2', type: 'ticks', dur: 3, vol: 0.4 },
  { at: 'c3', type: 'stab', vol: 0.7 },
  { at: 'c4', type: 'carstop', vol: 0.4 },
  { at: 'c5', type: 'hit', vol: 0.6 },
  { at: 'c9', type: 'ping', vol: 0.5 },
  { at: 'd2', type: 'roomtone', dur: 8, vol: 0.3 },
  { at: 'd4', type: 'tap3', vol: 0.4 },
  { at: 'd4', off: 0.6, type: 'pop', vol: 0.5 },
  { at: 'next', type: 'clock', dur: 2, vol: 0.3 },
  { at: 'e1', off: 0.2, type: 'notif', vol: 0.8 },
  { at: 'e2', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'window', type: 'rustle', vol: 0.6 },
  { at: 'e3', type: 'stab', vol: 0.6 },
  { at: 'e4:end', off: 0.4, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'tension' },
  { at: 'b1', mood: 'silence' },
  { at: 'b2', mood: 'uneasy' },
  { at: 'seven', mood: 'silence' },
  { at: 'c3', mood: 'suspense' },
  { at: 'c7', mood: 'calm' },
  { at: 'c11', mood: 'uneasy' },
  { at: 'd2', mood: 'ending' },
  { at: 'next', mood: 'silence' },
  { at: 'e1', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['k1', '12月7日　20年目の朝', 2.6]]) });
