// 置き配 第5話（最終話）「置き配」— 映像・効果音・BGM
// 回収：1年前の動画（顔を上げてカメラを見る戸川・赤い札の鍵）／チェーン／廊下のケンと長瀬と箱／待ち受けの若い男＝帽子をとったケン
//   ／夜明けの廊下でサキと会う。最後は新しい部屋（105）の前の段ボールと、見覚えのない字の伝票
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, sfxText, speedLines } from '../../engine/noir.js';
import { O, cardboard, topPhoto, print, doorFront, chainDoor, sakiLock, callView } from '../../engine/okihaisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, subBand, cover as coverBase, endCard, mioFace, mioShock, faceOf, phoneShot, photoShot, billShot, boxShot } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep05.script.js';

const OLD = { who: 'saki', date: '2025.10.14', time: '3:12', bright: 0.85, manFace: 1 };
// チェーンのすき間の戸川（目と眼鏡）。cutter＝工具
const gapWho = (o = {}) => (q, x, y, w, h) => {
  close(q, P.togawa, { x: x + (o.dx ?? 70), y: 640, s: 2.6, eyes: o.eyes || 'narrow', mouth: o.mouth || 'line', talk: o.talk || 0, lightFrom: 'left', glint: o.glint || 0 });
  if (o.cutter) { q.save(); q.translate(x + 40, 660); q.rotate(-0.4); fillRR(q, -20, 0, 40, 300, 10, '#c43a2a'); fillRR(q, 10, 0, 40, 300, 10, '#c43a2a'); fillRR(q, -10, -80, 40, 90, 6, '#9aa0a8'); q.restore(); }
};
const chain = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 600, y: o.y ?? 900, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06), sx: o.sx || 0 }); chainDoor(g, { t: lt, gap: o.gap ?? 1, chain: 1, cut: o.cut || 0, who: o.who === false ? null : gapWho(o.w || {}) }); g.restore(); };
// 1年前の動画の再生画面
function video(p, w, h, { t = 0, play = 1 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#0b0c10'], [1, '#08090c']]);
  const vh = w * 0.75; p.save(); p.translate(0, 200); p.beginPath(); p.rect(0, 0, w, vh); p.clip(); topPhoto(p, w, vh, { ...OLD, stamp: false }); p.restore();
  text(p, 'REC  2025/10/14  03:12:0' + Math.min(9, Math.floor(t)), 30, 230, { size: 30, color: '#ffb36a', align: 'left', weight: 800, stroke: 'rgba(0,0,0,.6)', sw: 4 });
  const y = 200 + vh + 80; fillRR(p, 50, y, w - 100, 10, 5, '#3a3e48'); fillRR(p, 50, y, (w - 100) * clamp(0.1 + t * 0.05), 10, 5, '#ff5a5f');
  text(p, '1年前の動画', w / 2, 120, { size: 40, color: '#fff', weight: 800 });
  circ(p, w / 2, y + 140, 60, 'rgba(255,255,255,.12)'); fillRR(p, w / 2 - 24, y + 115, 16, 50, 4, '#fff'); fillRR(p, w / 2 + 8, y + 115, 16, 50, 4, '#fff');
}
// 廊下：戸川・ケン・長瀬（夜、サイレン）
function hallNight(g, lt, D, S, o = {}) {
  g.save(); cam(g, { x: 540, y: o.cy ?? 1150, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) });
  doorFront(g, { t: lt, night: 1, box: 0, neighbor: true, people: q => {
    figure(q, P.togawa, { x: 470, y: 1840, s: 1.36, eyes: o.teyes || 'wide', brow: -0.4, mouth: 'line', talk: talking(lt, S, ['c4']) * 0.5, turn: 0.4, look: 0.8, arms: [20, -30, 30, -40], lightFrom: 'right' });
    figure(q, P.nagase, { x: 120, y: 1860, s: 1.38, eyes: 'narrow', bags: true, turn: 0.3, look: 0.6, lightFrom: 'right' });
    figure(q, P.ken, { x: 860, y: 1860, s: 1.4, eyes: 'normal', mouth: 'line', talk: talking(lt, S, ['c1', 'c3', 'c5']) * 0.6, turn: -0.4, look: -0.7, arms: [40, -100, 40, -100], lightFrom: 'left' });
    cardboard(q, 860, 1350, 0.45, {});
  } });
  g.restore();
  if (o.siren) { const k = Math.sin(lt * 9) * 0.5 + 0.5; glow(g, 0, 900, 900, 'rgba(255,40,60,1)', 0.35 * o.siren * k); glow(g, 1080, 900, 900, 'rgba(60,110,255,1)', 0.35 * o.siren * (1 - k)); }
}
// 夜明けの廊下：サキ・ミオ・ケン（帽子なし）
function dawn(g, lt, D, S, o = {}) {
  g.save(); cam(g, { x: 540, y: o.cy ?? 1150, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) });
  doorFront(g, { t: lt, morning: 1, dawn: 1, box: 0, people: q => {
    figure(q, P.mio, { x: 240, y: 1840, s: 1.34, eyes: 'normal', mouth: o.mm || 'line', talk: talking(lt, S, ['d4']) * 0.6, turn: 0.4, look: 0.7, lightFrom: 'left' });
    figure(q, P.saki, { x: 620, y: 1840, s: 1.34, eyes: 'normal', mouth: 'smile', talk: talking(lt, S, ['d2', 'd3']) * 0.6, turn: -0.3, look: -0.7, arms: [10, 0, 10, 0], lightFrom: 'left' });
    figure(q, P.kenBare, { x: 900, y: 1860, s: 1.38, eyes: 'normal', mouth: 'smile', talk: talking(lt, S, ['d5']) * 0.6, turn: -0.4, look: -0.8, lightFrom: 'left' });
  } });
  g.restore();
}
const NEW = { plate: '105', doorC: '#7a5a44', neighbor: false };
const newDoor = (g, lt, D, o = {}) => { g.save(); cam(g, { x: 540, y: o.y ?? 1200, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); doorFront(g, { t: lt, ...NEW, ...o.set }); g.restore(); };
const BILL = { to: '相沢ミオ', toAddr: '桜台2-14 メゾン桜台 105', fromAddr: '', fromName: 'この部屋の、前の住人より', item: '', date: '12月7日', style: 'b' };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 5, title: '置き配',
    back: g2 => { g2.save(); cam(g2, { x: 600, y: 900, z: 1.15 }); chainDoor(g2, { gap: 1, chain: 1, who: gapWho({ glint: 0.6 }) }); g2.restore(); },
    face: g2 => close(g2, P.mio, { y: 1480, s: 2.9, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', look: 0.6 }),
  });
}

const SHOTS = [
  // ── 冒頭：ドアが開き、チェーンが止める
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D) { chain(g, lt, D, { gap: 0.3, who: false }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D) { chain(g, lt, D, { gap: lerp(0.3, 0.8, ease(inv(0, D, lt))), who: false }); subBand(g); } },
  { at: 'chain', finish: { vignette: 0.65 }, draw(g, lt, D) { const k = inv(0, 0.25, lt); chain(g, lt, D, { gap: lerp(0.8, 1, k), sx: noise1(lt * 40, 2) * 14 * (1 - inv(0.2, 0.7, lt)), w: { eyes: 'narrow' } }); sfxText(g, 'ガチャン', 300, 420, { size: 120, color: '#f4f1ea', alpha: inv(0.1, 0.2, lt), rot: -0.1 }); } },
  { at: 'k2', finish: { vignette: 0.65 }, draw(g, lt, D) { chain(g, lt, D, { x: 760, y: 700, z0: 1.4, z1: 1.55, w: { eyes: 'narrow' } }); subBand(g); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { chain(g, lt, D, { x: 800, y: 700, z0: 1.7, z1: 1.9, w: { eyes: 'normal', mouth: 'smile', talk: talking(lt, S, ['k3']) * 0.6, glint: 0.4 } }); subBand(g); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#050608', '#0a0b0e'); cover(g, lt); } },

  // ── 1. 1年前の動画
  { at: 'a1', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt + 70, name: '水野サキ', av: 'サ', sub: '通話中' }), { y: 820 }); subBand(g); } },
  { at: 'a2', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 1, eyes: 'wide', brow: 0.5, lookY: 1 }); } },
  { at: 'play', finish: { vignette: 0.6 }, draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => video(p, w, h, { t: lt }), { y: 760 }); } },
  { at: 'a3', finish: { vignette: 0.6 }, draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => video(p, w, h, { t: 1 + lt }), { y: 760, x: 620, z0: 1.05, z1: 1.2 }); subBand(g); } },
  { at: 'a4', finish: { vignette: 0.7 }, draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => video(p, w, h, { t: 4 + lt }), { x: 380, y: 760, z0: 1.8, z1: 2.1 }); subBand(g); mood(g, { red: 0.08 }); } },
  { at: 'a5', finish: { vignette: 0.75 }, draw(g, lt, D, S) { faceOf(g, lt, D, S, 'togawa', ['a5'], { eyes: 'narrow', mouth: 'line', lookY: -1, glint: 0.3, back: g2 => bg(g2, '#141c30', '#070b14') }); mood(g, { desat: 0.5 }); tag(g, '1年前　3時12分', 540, 180, { size: 42, bg: '#14161c', color: '#ffb36a', alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'a6', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => callView(p, w, h, { t: lt + 80, name: '水野サキ', av: 'サ', sub: '通話中' }), { y: 820, z0: 1.04, z1: 1.08 }); subBand(g); } },
  { at: 'a7', draw(g, lt, D, S) { mioFace(g, lt, D, S, [], { night: 1, eyes: 'normal', brow: 0.6, mouth: 'line' }); } },

  // ── 2. チェーン
  { at: 'b1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { chain(g, lt, D, { x: 800, y: 700, z0: 1.9, z1: 2.1, w: { eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['b1']) * 0.6, glint: 0.6 } }); subBand(g); } },
  { at: 'cutter', finish: { vignette: 0.7 }, draw(g, lt, D) { chain(g, lt, D, { x: 760, y: 700, z0: 1.5, z1: 1.6, sx: noise1(lt * 30, 3) * 6, w: { cutter: 1, eyes: 'narrow' } }); } },
  { at: 'b2', finish: { vignette: 0.7 }, draw(g, lt, D) { chain(g, lt, D, { x: 760, y: 700, z0: 1.6, z1: 1.8, sx: noise1(lt * 30, 3) * 8, w: { cutter: 1, eyes: 'narrow' } }); subBand(g); } },
  { at: 'b3', draw(g, lt, D) { mioShock(g, lt, D, { night: 1 }); mood(g, { red: 0.1 }); } },
  { at: 'snap', finish: { vignette: 0.75 }, draw(g, lt, D) { chain(g, lt, D, { x: 760, y: 700, z0: 1.6, z1: 1.6, cut: 1, sx: noise1(lt * 50, 3) * 20 * (1 - inv(0, 0.5, lt)), w: { cutter: 1, eyes: 'wide' } }); sfxText(g, 'バチン', 540, 420, { size: 130, color: O.red2, alpha: inv(0, 0.1, lt), rot: 0.08 }); } },

  // ── 3. お届け物
  { at: 'c1', finish: { vignette: 0.6 }, draw(g, lt, D, S) { hallNight(g, lt, D, S, { teyes: 'narrow' }); subBand(g); } },
  { at: 'c2', finish: { vignette: 0.6 }, draw(g, lt, D, S) { hallNight(g, lt, D, S, { z0: 1.05, z1: 1.1 }); subBand(g); } },
  { at: 'c3', finish: { vignette: 0.6 }, draw(g, lt, D, S) { faceOf(g, lt, D, S, 'ken', ['c3'], { eyes: 'narrow', mouth: 'line', brow: 0.5, back: g2 => bg(g2, '#2a2e3a', '#14161c') }); } },
  { at: 'siren', finish: { vignette: 0.55 }, draw(g, lt, D, S) { hallNight(g, lt, D, S, { siren: inv(0, 0.6, lt), z0: 1.1, z1: 1.15 }); } },
  { at: 'c4', finish: { vignette: 0.6 }, draw(g, lt, D, S) { faceOf(g, lt, D, S, 'togawa', ['c4'], { eyes: 'wide', mouth: 'grit', brow: -0.6, back: g2 => bg(g2, '#2a2e3a', '#14161c') }); const k = Math.sin(lt * 9) * 0.5 + 0.5; glow(g, 0, 800, 900, 'rgba(255,40,60,1)', 0.3 * k); glow(g, 1080, 800, 900, 'rgba(60,110,255,1)', 0.3 * (1 - k)); } },
  { at: 'c5', finish: { vignette: 0.6 }, draw(g, lt, D, S) { faceOf(g, lt, D, S, 'ken', ['c5'], { eyes: 'normal', mouth: 'line', brow: 0.6, z0: 1.05, z1: 1.15, back: g2 => bg(g2, '#2a2e3a', '#14161c') }); const k = Math.sin(lt * 9) * 0.5 + 0.5; glow(g, 0, 800, 900, 'rgba(255,40,60,1)', 0.25 * k); glow(g, 1080, 800, 900, 'rgba(60,110,255,1)', 0.25 * (1 - k)); } },
  { at: 'c6', draw(g, lt, D) { phoneShot(g, lt, D, (p, w, h) => sakiLock(p, w, h, { t: lt }), { x: lerp(540, 680, ease(inv(0, D, lt))), y: lerp(960, 1000, ease(inv(0, D, lt))), z0: 1.0, z1: 1.6 }); subBand(g); } },

  // ── 4. 夜明け
  { at: 'd1', finish: { vignette: 0.45 }, draw(g, lt, D, S) { dawn(g, lt, D, S); subBand(g); } },
  { at: 'd2', finish: { vignette: 0.45 }, draw(g, lt, D, S) { faceOf(g, lt, D, S, 'saki', ['d2'], { eyes: 'normal', mouth: 'smile', brow: 0.3, a: '#e6d6c8', b: '#b8a898' }); tag(g, '水野サキ（27）', 540, 220, { size: 42, bg: '#14161c', color: '#e9e4da', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'd3', finish: { vignette: 0.45 }, draw(g, lt, D, S) { faceOf(g, lt, D, S, 'saki', ['d3'], { eyes: 'normal', mouth: 'line', brow: 0.6, z0: 1.05, z1: 1.12, a: '#e6d6c8', b: '#b8a898' }); } },
  { at: 'd4', finish: { vignette: 0.45 }, draw(g, lt, D, S) { mioFace(g, lt, D, S, ['d4'], { night: 0, eyes: 'normal', mouth: 'smile', brow: 0.2 }); } },
  { at: 'd5', finish: { vignette: 0.45 }, draw(g, lt, D, S) { dawn(g, lt, D, S, { mm: 'smile', z0: 1.05, z1: 1.12 }); subBand(g); } },

  // ── 5. 新しい部屋の前の箱
  { at: 'e1', finish: { vignette: 0.5 }, draw(g, lt, D) { newDoor(g, lt, D, { set: { box: 0 } }); subBand(g); tag(g, '1か月後', 540, 220, { size: 44, bg: '#14161c', color: '#ffd451', alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'e2', finish: { vignette: 0.5 }, draw(g, lt, D) { newDoor(g, lt, D, { set: { box: 0 }, z0: 1.06, z1: 1.12 }); subBand(g); } },
  { at: 'box', finish: { vignette: 0.6 }, draw(g, lt, D) { newDoor(g, lt, D, { y: 1350, z0: 1.2, z1: 1.5, set: { box: 1 } }); } },
  { at: 'e3', finish: { vignette: 0.6 }, draw(g, lt, D) { newDoor(g, lt, D, { y: 1380, z0: 1.5, z1: 1.7, set: { box: 1 } }); subBand(g); } },
  { at: 'e4', finish: { vignette: 0.65 }, draw(g, lt, D) { billShot(g, lt, D, { ...BILL, fromName: '' }, { fy: 762, z0: 1.3, z1: 1.4 }); subBand(g); } },
  { at: 'e5', finish: { vignette: 0.65 }, draw(g, lt, D) { billShot(g, lt, D, { ...BILL, fromName: '' }, { fx: 540, fy: 960, z0: 1.15, z1: 1.2 }); subBand(g); } },
  { at: 'label', finish: { vignette: 0.7 }, draw(g, lt, D) { billShot(g, lt, D, { ...BILL, hi: 'from', hiK: inv(0.5, 1.1, lt) }, { fx: 540, fy: 960, z0: 1.2, z1: 1.25 }); } },
  { at: 'e6', finish: { vignette: 0.8 }, draw(g, lt, D) { billShot(g, lt, D, { ...BILL, hi: 'from' }, { fx: 540, fy: 950, z0: 1.22, z1: 1.3 }); subBand(g); mood(g, { red: 0.08 * inv(0, D, lt), dark: inv(D - 0.9, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'unlock', vol: 0.7 },
  { at: 'chain', type: 'chain', vol: 0.9 },
  { at: 'chain', off: 0.05, type: 'hit', vol: 0.8 },
  { at: 'k3', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'play', type: 'ping', vol: 0.4 },
  { at: 'a4', type: 'hit', vol: 0.85 },
  { at: 'a5', type: 'subdrop', vol: 0.6 },
  { at: 'cutter', type: 'scrape', vol: 0.7 },
  { at: 'b2', type: 'scrape', vol: 0.6 },
  { at: 'snap', type: 'clunk', vol: 0.9 },
  { at: 'c1', type: 'stab', vol: 0.6 },
  { at: 'siren', type: 'siren', dur: 8, vol: 0.5 },
  { at: 'c5', type: 'hit', vol: 0.7 },
  { at: 'd1', type: 'wind', dur: 6, vol: 0.25 },
  { at: 'e2', type: 'creak', vol: 0.5 },
  { at: 'box', type: 'impact', vol: 0.6 },
  { at: 'label', type: 'riser', vol: 0.6 },
  { at: 'e6', type: 'hit', vol: 0.85 },
  { at: 'e6:end', off: 0.6, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'suspense' },
  { at: 'a4', mood: 'tension' },
  { at: 'b1', mood: 'thriller' },
  { at: 'snap', mood: 'silence' },
  { at: 'c1', mood: 'tension' },
  { at: 'c5', mood: 'flash' },
  { at: 'd1', mood: 'calm' },
  { at: 'e1', mood: 'ending' },
  { at: 'box', mood: 'silence' },
  { at: 'e4', mood: 'uneasy' },
  { at: 'label', mood: 'silence' },
  { at: 'e6', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a1', '11月6日　23時52分　203号室', 2.4], ['d1', '11月7日　朝', 2.2]]) });
