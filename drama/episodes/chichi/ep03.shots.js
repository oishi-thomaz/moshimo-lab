// 父のスマホ 第3話「向かいの窓」— 映像・効果音・BGM
// 手がかり：リョウの合鍵／2007年1月からの送金／家の車の写真（その冬に売られた）／祭壇から消えた位牌が向かいの窓に
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, speedLines } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { doorInside } from '../../engine/noirsets2.js';
import { Y, danchiRoom, oppView, msgList, callUI, passbook, passbookDrawer, carPhoto2, entrancePhoto } from '../../engine/chichisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, RYOPHOTO, bg, slow, heads, subBand, phone, room, face, lockS, talking, cover as coverBase, coverBack, coverFace, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep03.script.js';

const NIGHT = { lamp: 0.3, morning: 0 }; // 夜中（ろうそくの灯り）
const AM = { lamp: 0.25, morning: 0.35 };
const nat = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'natsuki', ids, { back: g2 => { bg(g2, '#16140f', '#0b0a08'); glow(g2, 200, 700, 700, 'rgba(255,200,130,1)', 0.18); }, ...o });
const shock = (g, lt, D, o = {}) => { bg(g, '#14151c', '#0a0b10'); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,230,170,.14)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.natsuki, { y: 660, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', ...o }); g.restore(); };
const ryo = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'ryo', ids, { back: g2 => { bg(g2, '#16140f', '#0b0a08'); glow(g2, 160, 760, 620, 'rgba(255,190,110,1)', 0.3); }, lightFrom: 'left', ...o });
const mom = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'taeko', ids, { back: g2 => { bg(g2, '#1a2230', '#0c1018'); fillRR(g2, 680, 240, 320, 420, 6, '#22304a'); fillRR(g2, 690, 250, 300, 400, 4, '#101826'); glow(g2, 840, 450, 400, 'rgba(150,180,230,1)', 0.15); }, lightFrom: 'right', phoneLight: true, ...o });
const opp = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 700, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.08) }); oppView(g, { t: lt, ...o.set }); g.restore(); };
const ryoImg = (q, w, h) => entrancePhoto(q, w, h, { kid: 'ryo', P: RYOPHOTO, mom: false });
// 祭壇の前に立つリョウ（ろうそくの灯り）
const ryoAltar = (g, lt, D, o = {}) => { room(g, lt, D, { x: o.x ?? 360, y: o.y ?? 900, z0: o.z0 ?? 1.15, z1: o.z1 ?? 1.25, set: { ...NIGHT, ihai: 1 }, }); g.save(); cam(g, { x: o.x ?? 360, y: o.y ?? 900, z: slow(lt, D, o.z0 ?? 1.15, o.z1 ?? 1.25) }); figure(g, P.ryo, { x: 560, y: 1560, s: 1.15, turn: -0.6, eyes: o.eyes || 'closed', mouth: 'line', lightFrom: 'left', arms: [10, -60, 10, -60] }); g.restore(); };
const ROWS = [['2007.01.25', '振込　ソウマ カズミ', '50,000'], ['2007.02.25', '振込　ソウマ カズミ', '50,000'], ['2007.03.25', '振込　ソウマ カズミ', '50,000'], ['2007.04.25', '振込　ソウマ カズミ', '50,000'], ['2007.05.25', '振込　ソウマ カズミ', '50,000'], ['2007.06.25', '振込　ソウマ カズミ', '50,000'], ['2007.07.25', '振込　ソウマ カズミ', '50,000'], ['2007.08.25', '振込　ソウマ カズミ', '50,000']];
const ROWS2 = [['2026.04.24', '振込　ソウマ カズミ', '50,000'], ['2026.05.25', '振込　ソウマ カズミ', '50,000'], ['2026.06.25', '振込　ソウマ カズミ', '50,000'], ['2026.07.24', '振込　ソウマ カズミ', '50,000'], ['2026.08.25', '振込　ソウマ カズミ', '50,000'], ['2026.09.25', '振込　ソウマ カズミ', '50,000'], ['2026.10.23', '振込　ソウマ カズミ', '50,000'], ['2026.11.25', '振込　ソウマ カズミ', '50,000']];
const MOMCALL = { name: '母', av: '母', col: '#5a6a7a' };

export function cover(g, lt = 9) {
  coverBase(g, lt, { no: 3, title: '向かいの窓', back: coverBack({ curtain: 1, lamp: 0.25, ihai: 0, opp: { tLit: 1, sil: 1, ihai: 1 } }), face: coverFace({ look: 0.8 }) });
}

const SHOTS = [
  // ── 冒頭：玄関のリョウ → 母のメッセージ
  { at: 'cold', off: -0.3, finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 800, z: 1.3 }); doorInside(g, { open: 1, P: P.ryo, o: { eyes: 'normal', brow: 0.1 }, porch: 0.8 }); g.restore(); } },
  { at: 'k1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['k1'], { eyes: 'normal', brow: 0.1, mouth: 'line', back: g2 => { bg(g2, '#0e0d12', '#07070a'); glow(g2, 540, 380, 520, 'rgba(255,214,150,1)', 0.25); }, lightFrom: 'right' }); } },
  { at: 'k2', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { own: true, clock: '23:41', notifs: [{ t: -1, name: '母', av: '母', col: '#5a6a7a', body: 'その子に、会わないで。', time: '今' }] }); } },
  { at: 'k3', finish: { vignette: 0.65 }, draw(g, lt, D) { ryoAltar(g, lt, D, { x: 420, y: 900, z0: 1.0, z1: 1.12, eyes: 'narrow' }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 息子
  { at: 'a1', finish: { vignette: 0.65 }, draw(g, lt, D) { room(g, lt, D, { x: 260, y: 980, z0: 1.7, z1: 1.9, set: { ...NIGHT } }); } },
  { at: 'a2', draw(g, lt, D, S) { ryo(g, lt, D, S, ['a2'], { eyes: 'closed', brow: -0.4, mouth: 'line', look: -0.6 }); } },
  { at: 'a3', draw(g, lt, D, S) { nat(g, lt, D, S, ['a3'], { eyes: 'narrow', brow: 0.6 }); } },
  { at: 'a4', finish: { vignette: 0.65 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['a4'], { eyes: 'narrow', brow: 0.3, mouth: 'line', z0: 1.04, z1: 1.12 }); } },
  { at: 'a5', draw(g, lt, D, S) { ryo(g, lt, D, S, ['a5'], { eyes: 'normal', brow: -0.4, mouth: 'line', lookY: 0.8 }); } },

  // ── 2. リョウの話
  { at: 'b1', draw(g, lt, D, S) { ryo(g, lt, D, S, ['b1'], { eyes: 'normal', brow: 0, mouth: 'line' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 290, 190, 500, 130, 20, 'rgba(10,12,18,.88)'); text(g, '相馬リョウ（19）', 540, 240, { size: 48, color: '#fff' }); text(g, '大学生　4号棟405', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'b2', draw(g, lt, D) { opp(g, lt, D, { y: 680, z0: 1.4, z1: 1.6, set: { tLit: 1, dawn: 0 } }); } },
  { at: 'b3', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D, 1.0, 1.08) }); photo(g, 540, 600, 600, 700, ryoImg, { rot: 0.02 }); g.restore(); } },
  { at: 'b4', draw(g, lt, D, S) { ryo(g, lt, D, S, ['b4'], { eyes: 'narrow', brow: -0.2, mouth: 'smile' }); } },
  { at: 'b5', finish: { vignette: 0.6 }, draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'normal', brow: -0.5, mouth: 'line', lookY: 0.6 }); } },
  { at: 'b6', finish: { vignette: 0.7 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['b6'], { eyes: 'narrow', brow: 0.8, mouth: 'grit', z0: 1.04, z1: 1.14 }); mood(g, { red: 0.06 }); } },
  { at: 'leave', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: 1.0 }); doorInside(g, { open: 1 - ease(inv(0.1, 0.6, lt)), porch: 0.6 }); g.restore(); } },

  // ── 3. 母は知っていた
  { at: 'c1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'call', ...MOMCALL })); } },
  { at: 'dial', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt + 1, mode: 'call', ...MOMCALL })); } },
  { at: 'c2', draw(g, lt, D, S) { mom(g, lt, D, S, ['c2'], { eyes: 'narrow', brow: -0.3, mouth: 'line' }); const a = inv(0.2, 0.5, lt) * (1 - inv(D - 0.3, D, lt)); g.save(); g.globalAlpha = a; fillRR(g, 290, 190, 500, 130, 20, 'rgba(10,12,18,.88)'); text(g, '母・タエコ（63）', 540, 240, { size: 48, color: '#fff' }); text(g, '去年から施設に', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'c3', draw(g, lt, D, S) { nat(g, lt, D, S, ['c3'], { eyes: 'normal', brow: 0.4, phoneLight: true }); } },
  { at: 'c4', finish: { vignette: 0.65 }, draw(g, lt, D, S) { mom(g, lt, D, S, ['c4'], { eyes: 'closed', brow: -0.5, mouth: 'line', z0: 1.04, z1: 1.12 }); } },
  { at: 'c5', draw(g, lt, D, S) { mom(g, lt, D, S, ['c5'], { eyes: 'narrow', brow: -0.4, mouth: 'line', lookY: 0.6 }); } },
  { at: 'c6', draw(g, lt, D, S) { nat(g, lt, D, S, ['c6'], { eyes: 'wide', brow: 0.4, phoneLight: true }); } },
  { at: 'c7', finish: { vignette: 0.7 }, draw(g, lt, D, S) { mom(g, lt, D, S, ['c7'], { eyes: 'closed', brow: -0.7, mouth: 'line', z0: 1.08, z1: 1.16 }); } },
  { at: 'hangup', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'end', ...MOMCALL })); } },

  // ── 4. 通帳
  { at: 'd1', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 880, z: slow(lt, D, 1.0, 1.1) }); passbookDrawer(g, { t: lt }); g.restore(); } },
  { at: 'd2', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.05) }); passbook(g, { t: lt, rows: ROWS, hi: ease(inv(0.3, D, lt)) }); g.restore(); tag(g, 'いちばん古い通帳', 540, 110, { size: 38, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'd3', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.05) }); passbook(g, { t: lt, rows: ROWS2, hi: 1, title: '普通預金　20冊目' }); g.restore(); const a = easeOut(inv(0.4, 0.9, lt)); g.save(); g.globalAlpha = a; fillRR(g, 240, 1040, 600, 120, 24, 'rgba(10,12,18,.9)'); text(g, '20年　240回', 540, 1102, { size: 64, color: Y.amber, weight: 900 }); g.restore(); } },
  { at: 'd4', finish: { vignette: 0.65 }, draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'narrow', brow: 0.5, mouth: 'line', look: -0.4 }); } },
  { at: 'd5', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); photo(g, 540, 600, 640, 520, carPhoto2, { rot: -0.03 + 0.02 * ease(inv(0, D, lt)) }); text(g, '2006年の秋　うちの車', 540, 932, { size: 38, color: '#2a2a2a', alpha: inv(0.3, 0.7, lt) }); } },
  { at: 'd6', finish: { vignette: 0.65 }, draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); g.save(); cam(g, { x: 540, y: 600, z: slow(lt, D, 1.05, 1.25) }); photo(g, 540, 600, 640, 520, carPhoto2, { rot: -0.01 }); g.restore(); mood(g, { desat: 0.4 * inv(0, D, lt) }); } },

  // ── 5. 位牌
  { at: 'morning', draw(g, lt, D) { lockS(g, lt, D, { date: '12月6日 日曜日', notifs: [{ t: 0.3, body: 'おはよう、あなた。\nお線香、あげてくれた？', time: '7:00' }] }); } },
  { at: 'e1', draw(g, lt, D) { lockS(g, lt, D, { date: '12月6日 日曜日', notifs: [{ t: -1, body: 'おはよう、あなた。\nお線香、あげてくれた？', time: '7:00' }] }); } },
  { at: 'e2', finish: { vignette: 0.55 }, draw(g, lt, D) { lockS(g, lt, D, { date: '12月6日 日曜日', notifs: [{ t: -1, body: 'おはよう、あなた。\nお線香、あげてくれた？', time: '7:00' }], z0: 1.04, z1: 1.12 }); } },
  { at: 'e3', draw(g, lt, D) { room(g, lt, D, { x: 300, y: 1000, z0: 1.2, z1: 1.5, set: { ...AM, ihai: 0 } }); } },
  { at: 'e4', finish: { vignette: 0.7 }, draw(g, lt, D) { room(g, lt, D, { x: 200, y: 900, z0: 2.4, z1: 2.8, set: { ...AM, ihai: 0 } }); const a = inv(0.3, 0.6, lt); g.save(); cam(g, { x: 200, y: 900, z: slow(lt, D, 2.4, 2.8) }); g.globalAlpha = a * 0.85; g.setLineDash([8, 6]); g.lineWidth = 3; g.strokeStyle = Y.amber; g.strokeRect(132, 712, 86, 184); g.restore(); } },
  { at: 'e5', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { brow: 0.3 }); } },

  // ── 6. 引き
  { at: 'window', finish: { vignette: 0.65 }, draw(g, lt, D) { room(g, lt, D, { x: 840, y: 600, z0: 1.3, z1: 1.6, set: { ...AM, ihai: 0, curtain: ease(inv(0, 1.0, lt)), opp: { tLit: 0.5, ihai: 1, sil: 0.8 } } }); } },
  { at: 'f1', finish: { vignette: 0.65 }, draw(g, lt, D) { opp(g, lt, D, { y: 660, z0: 1.6, z1: 2.2, set: { dawn: 0.3, tLit: 0.5, ihai: 1, sil: 0 } }); } },
  { at: 'f2', finish: { vignette: 0.7 }, draw(g, lt, D) { opp(g, lt, D, { y: 650, z0: 2.4, z1: 2.8, set: { dawn: 0.3, tLit: 0.5, ihai: 1, sil: ease(inv(0.8, 2.0, lt)) } }); } },
  { at: 'buzz', finish: { vignette: 0.6 }, draw(g, lt, D) { const sh = noise1(lt * 40, 3) * 8; g.save(); g.translate(sh, 0); lockS(g, lt, D, { date: '12月6日 日曜日', clock: '7:04', notifs: [{ t: 0.1, body: 'ひとりで、来て。', time: '今' }] }); g.restore(); } },
  { at: 'f3', finish: { vignette: 0.7 }, draw(g, lt, D) { lockS(g, lt, D, { date: '12月6日 日曜日', clock: '7:04', notifs: [{ t: -1, body: 'ひとりで、来て。', time: '今' }], z0: 1.0, z1: 1.12 }); mood(g, { red: 0.05, dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.7 },
  { at: 'k2', type: 'notif', vol: 0.7 },
  { at: 'k3', type: 'steps', dur: 1.5, vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 14, vol: 0.35 },
  { at: 'a1', off: 0.4, type: 'ding', vol: 0.4 },
  { at: 'a4', type: 'stab', vol: 0.6 },
  { at: 'a5', type: 'heartbeat', dur: 2, vol: 0.4 },
  { at: 'b2', type: 'hit', vol: 0.5 },
  { at: 'b6', type: 'stab', vol: 0.6 },
  { at: 'leave', off: 0.5, type: 'hit', vol: 0.8 },
  { at: 'dial', type: 'dial', dur: 1.4, vol: 0.6 },
  { at: 'c2', type: 'pickup', vol: 0.5 },
  { at: 'c4', type: 'hit', vol: 0.7 },
  { at: 'c7', type: 'heartbeat', dur: 2, vol: 0.4 },
  { at: 'hangup', type: 'zapoff', vol: 0.5 },
  { at: 'd1', type: 'scrape', vol: 0.5 },
  { at: 'd2', type: 'rustle', vol: 0.5 },
  { at: 'd3', off: 0.4, type: 'stab', vol: 0.7 },
  { at: 'd6', type: 'riser', vol: 0.4 },
  { at: 'morning', off: 0.3, type: 'notif', vol: 0.8 },
  { at: 'e3', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'e4', type: 'hit', vol: 0.8 },
  { at: 'window', type: 'rustle', vol: 0.6 },
  { at: 'f1', type: 'stab', vol: 0.6 },
  { at: 'f2', off: 0.8, type: 'riser', vol: 0.5 },
  { at: 'buzz', type: 'vibrate', dur: 0.9, vol: 0.7 },
  { at: 'buzz', off: 0.1, type: 'notif', vol: 0.8 },
  { at: 'f3', type: 'hit', vol: 0.8 },
  { at: 'f3:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'calm' },
  { at: 'b6', mood: 'tension' },
  { at: 'leave', mood: 'silence' },
  { at: 'c2', mood: 'uneasy' },
  { at: 'hangup', mood: 'silence' },
  { at: 'd1', mood: 'suspense' },
  { at: 'morning', mood: 'silence' },
  { at: 'e3', mood: 'tension' },
  { at: 'window', mood: 'thriller' },
  { at: 'buzz', mood: 'silence' },
  { at: 'f3', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['d1', '父のたんす', 2.2]]) });
