// 父のスマホ 第2話「もうひとつの家」— 映像・効果音・BGM
// 手がかり：向かいの4号棟405の窓（合図・人影）／リョウの合鍵とフード／母の車いす／母の「その子」
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, speedLines } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { doorInside } from '../../engine/noirsets2.js';
import { Y, danchiRoom, oppView, msgList, callUI, doorLock } from '../../engine/chichisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, room, face, lockS, talking, cover as coverBase, coverBack, coverFace, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep02.script.js';

const AM = { lamp: 0.3, morning: 0.45 };
const PM = { lamp: 1, morning: 0 };
const nat = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'natsuki', ids, { back: g2 => { bg(g2, o.night ? '#16140f' : '#1a1c24', o.night ? '#0b0a08' : '#0c0d12'); glow(g2, 900, 500, 700, o.night ? 'rgba(255,220,160,1)' : 'rgba(170,200,255,1)', 0.2); }, ...o });
const shock = (g, lt, D, o = {}) => { bg(g, '#14151c', '#0a0b10'); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,230,170,.14)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.natsuki, { y: 660, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', ...o }); g.restore(); };
const opp = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 700, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.08) }); oppView(g, { t: lt, ...o.set }); g.restore(); };
const ryo = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'ryo', ids, { back: g2 => { bg(g2, '#0e0d12', '#07070a'); glow(g2, 540, 380, 520, 'rgba(255,214,150,1)', 0.25); }, lightFrom: 'right', ...o });
const momPhoto = (q, w, h) => { vgrad(q, 0, 0, w, h, [[0, '#c9cdd2'], [1, '#9aa0a8']]); fillRR(q, w * 0.62, h * 0.1, w * 0.3, h * 0.4, 4, '#e8eef4'); close(q, P.taeko, { x: w / 2, y: h * 0.45, s: 1.9, eyes: 'narrow', mouth: 'line', lightFrom: 'right' }); };
const MOM = [{ d: '12月5日' }, { text: 'カズミって人、知ってる？\n向かいの、4号棟の。', me: 1, time: '21:12' }];
const A3 = [{ d: '2021年12月5日' }, { text: '夜9時、窓のあかりで、\n合図して。', time: '7:00' }, { text: '明日も、窓を開けておく', me: 1, time: '21:00' }, { d: '2021年12月6日' }, { text: 'おはよう、あなた。', time: '7:00' }];
const ryoDoor = (open, o = {}) => g => doorInside(g, { open, P: P.ryo, o: { eyes: 'narrow', brow: 0.4, mouth: 'line', ...o }, porch: 0.8 });

export function cover(g, lt = 9) {
  coverBase(g, lt, { no: 2, title: 'もうひとつの家', back: coverBack({ curtain: 1, lamp: 0.6, opp: { tLit: 1, sil: 1 } }), face: coverFace({ look: 0.8 }) });
}

const SHOTS = [
  // ── 冒頭：「上着のポケット、見てくれた？」→ 窓
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { clock: '7:12', notifs: [{ t: -1, body: '上着のポケット、見てくれた？', time: '今' }], z0: 1.06, z1: 1.06 }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { clock: '7:12', notifs: [{ t: -1, body: '上着のポケット、見てくれた？', time: '今' }], z0: 1.06, z1: 1.12 }); } },
  { at: 'k2', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { look: lerp(-1, 1, ease(inv(0, D, lt))) }); } },
  { at: 'k3', draw(g, lt, D) { room(g, lt, D, { x: 840, y: 620, z0: 1.2, z1: 1.5, set: { ...AM, curtain: 0 } }); } },
  { at: 'curtain', draw(g, lt, D) { room(g, lt, D, { x: 840, y: 620, z0: 1.5, z1: 1.6, set: { ...AM, curtain: ease(inv(0.1, 1.1, lt)), opp: { sil: 0.8, sway: 0.5 } } }); } },
  { at: 'k4', finish: { vignette: 0.6 }, draw(g, lt, D) { opp(g, lt, D, { y: 680, z0: 1.0, z1: 1.5, set: { dawn: 0.7, sway: Math.max(0, Math.sin(lt * 3)) * (1 - inv(1.5, 3, lt)), sil: 0.5 * (1 - inv(0.5, 2.0, lt)) } }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 窓の合図
  { at: 'a1', draw(g, lt, D) { opp(g, lt, D, { y: 700, z0: 1.5, z1: 1.9, set: { dawn: 0.75 } }); tag(g, '4号棟405', 540, 1110, { size: 40, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'a2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { msgs: A3, scroll: lerp(200, 0, ease(inv(0, D, lt))) })); } },
  { at: 'a3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { t: lt + 9, msgs: A3, hi: 1 }), { x: 430, y: 420, z0: 1.6, z1: 1.75 }); subBand(g); } },
  { at: 'a4', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 900, z0: 1.0, z1: 1.05, set: { lamp: Math.sin(lt * 5) > 0 ? 1 : 0.15, curtain: 1, opp: { tLit: 0.3 } } }); tag(g, '毎晩 21:00', 540, 1110, { size: 40, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'a5', draw(g, lt, D, S) { nat(g, lt, D, S, [], { night: 1, eyes: 'narrow', brow: 0.2, mouth: 'line', look: 0.6 }); } },
  { at: 'blink', finish: { vignette: 0.6 }, draw(g, lt, D) {
    if (lt < 1.2) { const on = (lt < 0.25 || (lt > 0.5 && lt < 0.75)) ? 0.12 : 1; room(g, lt, D, { x: 840, y: 620, z0: 1.4, z1: 1.4, set: { lamp: on, curtain: 1, opp: { tLit: 0 } } }); }
    else { const k = lt - 1.2, on = (k < 0.25 || (k > 0.5 && k < 0.75)) ? 1 : 0; opp(g, lt, D, { y: 680, z0: 1.6, z1: 1.7, set: { tLit: on, dawn: 0 } }); }
  } },
  { at: 'a6', finish: { vignette: 0.6 }, draw(g, lt, D) { opp(g, lt, D, { y: 660, z0: 1.7, z1: 2.1, set: { tLit: 1, sil: ease(inv(0.3, 1.2, lt)), dawn: 0 } }); } },

  // ── 2. 電話
  { at: 'b1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'call' })); } },
  { at: 'dial', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt + 2, mode: 'call' })); } },
  { at: 'b2', finish: { vignette: 0.65 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'talk' }), { z0: 1.04, z1: 1.1 }); } },
  { at: 'b3', finish: { vignette: 0.6 }, draw(g, lt, D) { opp(g, lt, D, { y: 660, z0: 2.1, z1: 2.3, set: { tLit: 1, sil: 1, dawn: 0 } }); } },
  { at: 'b4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt + 4, mode: 'talk' })); } },
  { at: 'b5', draw(g, lt, D, S) { nat(g, lt, D, S, ['b5'], { night: 1, eyes: 'normal', brow: 0.3, phoneLight: true }); } },
  { at: 'b6', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { brow: 0.2, phoneLight: true }); } },
  { at: 'b7', finish: { vignette: 0.7 }, draw(g, lt, D) { const sh = noise1(lt * 30, 2) * 6 * (1 - inv(0, 1.5, lt)); g.save(); g.translate(sh, 0); phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt + 9, mode: 'talk' }), { z0: 1.06, z1: 1.12 }); g.restore(); mood(g, { red: 0.08 }); } },
  { at: 'hangup', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'end' })); } },
  { at: 'b8', draw(g, lt, D) { opp(g, lt, D, { y: 660, z0: 1.6, z1: 1.5, set: { tLit: 1 - inv(0.3, 0.5, lt), sil: 1 - inv(0.2, 0.5, lt), dawn: 0 } }); } },

  // ── 3. 母
  { at: 'c1', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); photo(g, 540, 600, 560, 640, momPhoto, { rot: -0.03 + 0.02 * ease(inv(0, D, lt)) }); text(g, '母・タエコ（63）', 540, 990, { size: 42, color: '#2a2a2a', alpha: inv(0.3, 0.7, lt) }); } },
  { at: 'c2', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); g.save(); cam(g, { x: 540, y: 560, z: slow(lt, D, 1.1, 1.3) }); photo(g, 540, 600, 560, 640, momPhoto, { rot: -0.01 }); g.restore(); } },
  { at: 'c3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { name: '母', av: '母', msgs: MOM.slice(0, 1) })); } },
  { at: 'c4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { t: lt * 1.5, name: '母', av: '母', msgs: [MOM[0], { ...MOM[1], t: 0.3 }] }), { z0: 1.04, z1: 1.1 }); } },

  // ── 4. 合鍵
  { at: 'night', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 900, z0: 1.0, z1: 1.03, set: { lamp: 0.15, curtain: 0, opp: { tLit: 0 } } }); tag(g, '23:40', 540, 1110, { size: 44, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.1, 0.4, lt) }); } },
  { at: 'd1', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.06) }); doorInside(g, { open: 0 }); g.restore(); } },
  { at: 'lock', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 720, z: 1.15 }); doorLock(g, { t: lt, k: ease(inv(0.2, 1.2, lt)) }); g.restore(); } },
  { at: 'd2', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 720, z: slow(lt, D, 1.15, 1.3) }); doorLock(g, { t: lt, k: 1 }); g.restore(); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { nat(g, lt, D, S, [], { night: 1, eyes: 'wide', brow: -0.5, mouth: 'line', look: -0.8 }); } },
  { at: 'door', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: 1.0 }); ryoDoor(ease(inv(0.1, 1.2, lt)))(g); g.restore(); } },
  { at: 'd4', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 860, z: slow(lt, D, 1.0, 1.12) }); ryoDoor(1)(g); g.restore(); } },
  { at: 'd5', draw(g, lt, D, S) { ryo(g, lt, D, S, ['d5'], { eyes: 'narrow', brow: 0.4, mouth: 'line', look: -0.3 }); } },
  { at: 'd6', finish: { vignette: 0.65 }, draw(g, lt, D, S) { nat(g, lt, D, S, [], { night: 1, eyes: 'wide', brow: -0.4 }); } },
  { at: 'd7', draw(g, lt, D, S) { nat(g, lt, D, S, ['d7'], { night: 1, eyes: 'normal', brow: 0.6 }); } },
  { at: 'e1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['e1'], { eyes: 'normal', brow: 0.1, mouth: 'line', z0: 1.04, z1: 1.14 }); } },
  { at: 'e2', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, {}); } },

  // ── 5. 引き：母から
  { at: 'buzz', finish: { vignette: 0.6 }, draw(g, lt, D) { const sh = noise1(lt * 40, 3) * 8; g.save(); g.translate(sh, 0); lockS(g, lt, D, { own: true, date: '12月5日 土曜日', clock: '23:41', notifs: [{ t: 0.1, name: '母', av: '母', col: '#5a6a7a', body: 'その子に、会わないで。', time: '今' }] }); g.restore(); } },
  { at: 'e3', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { own: true, date: '12月5日 土曜日', clock: '23:41', notifs: [{ t: -1, name: '母', av: '母', col: '#5a6a7a', body: 'その子に、会わないで。', time: '今' }] }); } },
  { at: 'e4', finish: { vignette: 0.65 }, draw(g, lt, D) { lockS(g, lt, D, { own: true, date: '12月5日 土曜日', clock: '23:41', notifs: [{ t: -1, name: '母', av: '母', col: '#5a6a7a', body: 'その子に、会わないで。', time: '今' }], z0: 1.0, z1: 1.12 }); mood(g, { red: 0.06 * inv(0, 1, lt) }); } },
  { at: 'e5', finish: { vignette: 0.75 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.12, 1.4) }); ryoDoor(1, { eyes: 'normal', brow: 0.2 })(g); g.restore(); mood(g, { dark: 0.15 + inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'notif', vol: 0.8 },
  { at: 'cold', type: 'hit', vol: 0.6 },
  { at: 'k2', type: 'heartbeat', dur: 2.5, vol: 0.6 },
  { at: 'curtain', type: 'rustle', vol: 0.7 },
  { at: 'k4', type: 'stab', vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'wind', dur: 5, vol: 0.25 },
  { at: 'a3', type: 'ping', vol: 0.4 },
  { at: 'a4', type: 'clunk', vol: 0.4 },
  { at: 'blink', type: 'clunk', vol: 0.5 },
  { at: 'blink', off: 0.5, type: 'clunk', vol: 0.5 },
  { at: 'blink', off: 1.2, type: 'heartbeat', dur: 1.5, vol: 0.5 },
  { at: 'a6', type: 'stab', vol: 0.7 },
  { at: 'b1', type: 'tap3', vol: 0.4 },
  { at: 'dial', type: 'dial', dur: 1.8, vol: 0.6 },
  { at: 'b2', type: 'pickup', vol: 0.5 },
  { at: 'b3', type: 'hit', vol: 0.6 },
  { at: 'b7', type: 'stab', vol: 0.6 },
  { at: 'hangup', type: 'zapoff', vol: 0.5 },
  { at: 'c1', type: 'roomtone', dur: 10, vol: 0.35 },
  { at: 'c4', type: 'tap3', vol: 0.4 },
  { at: 'c4', off: 1.2, type: 'pop', vol: 0.4 },
  { at: 'night', type: 'clock', dur: 2.5, vol: 0.35 },
  { at: 'd1', type: 'chain', vol: 0.4 },
  { at: 'lock', off: 0.2, type: 'scrape', vol: 0.5 },
  { at: 'lock', off: 1.1, type: 'unlock', vol: 0.9 },
  { at: 'd2', type: 'heartbeat', dur: 3, vol: 0.6 },
  { at: 'door', type: 'creak', vol: 0.8 },
  { at: 'd4', type: 'hit', vol: 0.6 },
  { at: 'e1', type: 'stab', vol: 0.6 },
  { at: 'buzz', type: 'vibrate', dur: 0.9, vol: 0.7 },
  { at: 'buzz', off: 0.1, type: 'notif', vol: 0.8 },
  { at: 'e4', type: 'hit', vol: 0.8 },
  { at: 'e5', type: 'riser', vol: 0.5 },
  { at: 'e5:end', off: 0.4, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'blink', mood: 'silence' },
  { at: 'a6', mood: 'suspense' },
  { at: 'b2', mood: 'tension' },
  { at: 'hangup', mood: 'silence' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'night', mood: 'silence' },
  { at: 'lock', mood: 'thriller' },
  { at: 'd5', mood: 'suspense' },
  { at: 'buzz', mood: 'silence' },
  { at: 'e4', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a5', '12月5日 21:00', 2.4]]) });
