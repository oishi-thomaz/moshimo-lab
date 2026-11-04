// 父のスマホ 第4話「交差点」— 映像・効果音・BGM
// 手がかり：窓辺の夫の写真と父の位牌／窓の真下の交差点／古い新聞（ひき逃げ・車は逃走）／ボイスメモ（12月1日 0:14）と奥の母の声
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, speedLines } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { Y, kazumiRoom, crossingDown, crossing, oldNews, door405, memoScreen, callUI, passbook, danchiNight, shinPortrait } from '../../engine/chichisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, face, lockS, talking, cover as coverBase, coverBack, coverFace, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep04.script.js';

const warm = g2 => { bg(g2, '#2a221c', '#120e0b'); glow(g2, 820, 560, 700, 'rgba(255,220,170,1)', 0.2); };
const nat = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'natsuki', ids, { back: warm, ...o });
const kaz = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'kazumi', ids, { back: g2 => { bg(g2, '#2a2620', '#121010'); fillRR(g2, 640, 220, 380, 520, 6, '#3a4a64'); glow(g2, 830, 480, 500, 'rgba(190,210,240,1)', 0.25); }, lightFrom: 'right', ...o });
const ryo = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'ryo', ids, { back: warm, lightFrom: 'right', ...o });
const shock = (g, lt, D, o = {}) => { bg(g, '#14151c', '#0a0b10'); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,230,170,.14)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.natsuki, { y: 660, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', ...o }); g.restore(); };
const kroom = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) }); kazumiRoom(g, { t: lt, P, ...o.set }); if (o.draw) o.draw(g); g.restore(); };
const shinImg = (q, w, h) => shinPortrait(q, w, h, P.shin);
const memo = (g, lt, D, o = {}) => phone(g, lt, D, (p, w, h) => memoScreen(p, w, h, { t: lt, ...o }), o.cam || {});
const PB = [['2007.01.25', '振込　ソウマ カズミ', '50,000'], ['2007.02.25', '振込　ソウマ カズミ', '50,000'], ['2007.03.25', '振込　ソウマ カズミ', '50,000'], ['2007.04.25', '振込　ソウマ カズミ', '50,000'], ['2007.05.25', '振込　ソウマ カズミ', '50,000'], ['2007.06.25', '振込　ソウマ カズミ', '50,000'], ['2007.07.25', '振込　ソウマ カズミ', '50,000'], ['2007.08.25', '振込　ソウマ カズミ', '50,000']];
const STAFF = { name: 'みどり台ケアホーム', av: '施', col: '#4a7a6a' };

export function cover(g, lt = 9) {
  coverBase(g, lt, { no: 4, title: '交差点', back: g2 => { g2.save(); cam(g2, { x: 540, y: 1000, z: 1.05 }); crossing(g2, { t: 3, dawn: 0.35, signal: 'red', flowers: 1 }); g2.restore(); }, face: coverFace({ eyes: 'normal', brow: 0.3 }) });
}

const SHOTS = [
  // ── 冒頭：「ひとりで、来て。」→ 405のドアが開く
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { date: '12月6日 日曜日', clock: '7:04', notifs: [{ t: -1, body: 'ひとりで、来て。', time: '今' }], z0: 1.06, z1: 1.06 }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { date: '12月6日 日曜日', clock: '7:04', notifs: [{ t: -1, body: 'ひとりで、来て。', time: '今' }], z0: 1.06, z1: 1.12 }); } },
  { at: 'k2', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.12) }); door405(g, { t: lt, open: 0, dawn: 0.3 }); g.restore(); } },
  { at: 'door', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: 1.12 }); door405(g, { t: lt, open: ease(inv(0.2, 1.2, lt)), dawn: 0.3, P: P.kazumi, o: { eyes: 'narrow', mouth: 'line' } }); g.restore(); } },
  { at: 'k3', draw(g, lt, D, S) { kaz(g, lt, D, S, ['k3'], { eyes: 'narrow', brow: -0.2, mouth: 'smile' }); const a = inv(0.4, 0.7, lt); g.save(); g.globalAlpha = a; fillRR(g, 290, 190, 500, 130, 20, 'rgba(10,12,18,.88)'); text(g, '相馬カズミ（52）', 540, 240, { size: 48, color: '#fff' }); text(g, '4号棟405', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'k4', finish: { vignette: 0.65 }, draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'wide', brow: -0.3, mouth: 'line' }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 窓辺の写真
  { at: 'a1', draw(g, lt, D) { kroom(g, lt, D, { x: 740, y: 820, z0: 1.4, z1: 1.8, set: { dawn: 0.35 } }); } },
  { at: 'a2', finish: { vignette: 0.6 }, draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); photo(g, 540, 600, 480, 600, shinImg, { rot: -0.02 + 0.02 * ease(inv(0, D, lt)) }); text(g, '相馬シンイチ（当時31）', 540, 968, { size: 38, color: '#2a2a2a', alpha: inv(0.3, 0.7, lt) }); } },
  { at: 'a3', draw(g, lt, D, S) { kaz(g, lt, D, S, ['a3'], { eyes: 'narrow', brow: -0.4, mouth: 'line', look: 0.7 }); } },
  { at: 'a4', finish: { vignette: 0.65 }, draw(g, lt, D, S) { kaz(g, lt, D, S, ['a4'], { eyes: 'closed', brow: -0.5, mouth: 'line', z0: 1.05, z1: 1.12 }); } },
  { at: 'a5', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D, 1.0, 1.15) }); oldNews(g, { t: lt }); g.restore(); } },

  // ── 2. 毎朝7時の花
  { at: 'b1', draw(g, lt, D) { kroom(g, lt, D, { x: 750, y: 600, z0: 1.4, z1: 1.9, set: { dawn: 0.35 } }); } },
  { at: 'b2', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 400, y: 900, z: slow(lt, D, 1.2, 1.45) }); crossingDown(g, { t: lt, dawn: 0.35, man: 1 }); g.restore(); mood(g, { desat: 0.35 }); tag(g, '毎朝 7:00', 540, 1030, { size: 40, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'b4', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 260, y: 1420, z: slow(lt, D, 2.0, 2.3) }); crossing(g, { t: lt, dawn: 0.3, signal: 'red', flowers: 1 }); g.restore(); subBand(g); } },

  // ── 3. 名乗り出た父
  { at: 'c1', draw(g, lt, D, S) { kaz(g, lt, D, S, ['c1'], { eyes: 'narrow', brow: -0.2, mouth: 'line' }); } },
  { at: 'c2', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 880, z: slow(lt, D, 1.05, 1.15) }); door405(g, { t: lt, open: 1, P: P.dadYoung, o: { eyes: 'closed', brow: -0.6, mouth: 'line', lookY: 1, arms: [4, 0, 4, 0] } }); g.restore(); mood(g, { desat: 0.55 }); tag(g, '2007年1月', 540, 1030, { size: 40, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'c3', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { mouth: 'open' }); } },
  { at: 'c4', draw(g, lt, D, S) { kaz(g, lt, D, S, ['c4'], { eyes: 'narrow', brow: -0.4, mouth: 'line', look: -0.3 }); } },
  { at: 'c5', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.06) }); passbook(g, { t: lt, rows: PB, hi: 1 }); g.restore(); } },
  { at: 'c6', draw(g, lt, D, S) { nat(g, lt, D, S, ['c6'], { eyes: 'normal', brow: 0.5 }); } },
  { at: 'c7', finish: { vignette: 0.65 }, draw(g, lt, D, S) { kaz(g, lt, D, S, ['c7'], { eyes: 'narrow', brow: -0.5, mouth: 'line', look: 0.9, z0: 1.04, z1: 1.1 }); } },

  // ── 4. リョウ
  { at: 'creak', finish: { vignette: 0.65 }, draw(g, lt, D) { kroom(g, lt, D, { x: 540, y: 960, z0: 1.0, z1: 1.04, set: { dawn: 0.35 }, draw: g2 => figure(g2, P.ryo, { x: 220, y: 1700, s: 1.35, eyes: 'wide', mouth: 'open', lightFrom: 'right', alpha: inv(0.1, 0.6, lt) }) }); } },
  { at: 'd1', finish: { vignette: 0.65 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['d1'], { eyes: 'wide', brow: -0.5, mouth: 'open' }); } },
  { at: 'd2', draw(g, lt, D) { kroom(g, lt, D, { x: 540, y: 960, z0: 1.04, z1: 1.08, set: { dawn: 0.35 }, draw: g2 => { figure(g2, P.ryo, { x: 220, y: 1700, s: 1.35, eyes: 'wide', mouth: 'line', lightFrom: 'right' }); figure(g2, P.kazumi, { x: 820, y: 1680, s: 1.3, eyes: 'narrow', mouth: 'line', turn: -0.6, lightFrom: 'left' }); } }); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['d3'], { eyes: 'wide', brow: -0.7, mouth: 'line', z0: 1.04, z1: 1.12 }); } },
  { at: 'd5', finish: { vignette: 0.7 }, draw(g, lt, D, S) { const sh = noise1(lt * 30, 4) * 8; g.save(); g.translate(sh, 0); ryo(g, lt, D, S, ['d5'], { eyes: 'narrow', brow: 0.9, mouth: 'grit', z0: 1.08, z1: 1.18 }); g.restore(); mood(g, { red: 0.08 }); } },
  { at: 'grab', finish: { vignette: 0.7 }, draw(g, lt, D) { bg(g, '#14151c', '#0a0b10'); speedLines(g, 540, 700, { inner: 380, t: lt, color: 'rgba(255,230,170,.2)' }); g.save(); g.translate(540, 700); g.rotate(lerp(-0.6, 0.1, easeOut(inv(0, 0.5, lt)))); g.scale(lerp(0.6, 1, easeOut(inv(0, 0.5, lt))), lerp(0.6, 1, easeOut(inv(0, 0.5, lt)))); fillRR(g, -170, -320, 340, 640, 40, '#0b0c10'); fillRR(g, -156, -306, 312, 612, 30, '#1a1e2a'); g.restore(); } },

  // ── 5. ボイスメモ
  { at: 'e1', draw(g, lt, D) { memo(g, lt, D, { play: 0 }); } },
  { at: 'play', draw(g, lt, D) { memo(g, lt, D, { play: 0.02, playing: 1, cam: { x: 540, y: 520, z0: 1.3, z1: 1.4 } }); subBand(g); } },
  { at: 'e2', draw(g, lt, D) { memo(g, lt, D, { play: lerp(0.05, 0.3, inv(0, D, lt)), playing: 1, cam: { x: 540, y: 520, z0: 1.4, z1: 1.5 } }); subBand(g); } },
  { at: 'e3', finish: { vignette: 0.65 }, draw(g, lt, D) { memo(g, lt, D, { play: lerp(0.3, 0.7, inv(0, D, lt)), playing: 1, cam: { x: 540, y: 520, z0: 1.5, z1: 1.6 } }); subBand(g); } },
  { at: 'e4', finish: { vignette: 0.75 }, draw(g, lt, D) { memo(g, lt, D, { play: lerp(0.7, 0.85, inv(0, D, lt)), playing: 1, cam: { x: 540, y: 520, z0: 1.6, z1: 1.8 } }); subBand(g); mood(g, { red: 0.06 }); } },
  { at: 'e5', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { brow: 0.2 }); } },
  { at: 'e6', finish: { vignette: 0.7 }, draw(g, lt, D, S) { ryo(g, lt, D, S, ['e6'], { eyes: 'narrow', brow: 0.6, mouth: 'line', look: 0.6 }); } },
  { at: 'run', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: 1.0 }); door405(g, { t: lt, open: 1 - ease(inv(0.3, 0.9, lt)), dawn: 0.3 }); g.restore(); } },

  // ── 6. 引き
  { at: 'dawn', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.04) }); danchiNight(g, { t: lt, dawn: 0.3, litA: 1, litB: 1 }); g.restore(); } },
  { at: 'f2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'talk', ...STAFF })); } },
  { at: 'f3', finish: { vignette: 0.65 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callUI(p, w, h, { t: lt + 6, mode: 'talk', ...STAFF }), { z0: 1.04, z1: 1.1 }); mood(g, { red: 0.05 }); } },
  { at: 'f4', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D, 1.0, 1.12) }); crossing(g, { t: lt, dawn: 0.3, signal: 'red', flowers: 0, blink: 1 }); g.restore(); const a = easeOut(inv(0.3, 0.7, lt)); g.save(); g.globalAlpha = a; fillRR(g, 300, 150, 480, 190, 30, 'rgba(10,12,18,.88)'); text(g, '6:52', 540, 250, { size: 130, color: Y.amber, weight: 900 }); g.restore(); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'notif', vol: 0.8 },
  { at: 'cold', type: 'hit', vol: 0.6 },
  { at: 'k2', type: 'steps', dur: 2, vol: 0.5 },
  { at: 'door', type: 'creak', vol: 0.7 },
  { at: 'k3', type: 'stab', vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 12, vol: 0.35 },
  { at: 'a3', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'a4', type: 'carstop', vol: 0.6 },
  { at: 'a5', type: 'hit', vol: 0.7 },
  { at: 'b2', type: 'wind', dur: 6, vol: 0.25 },
  { at: 'b4', type: 'stab', vol: 0.6 },
  { at: 'c2', type: 'hit', vol: 0.9 },
  { at: 'c3', type: 'heartbeat', dur: 2.5, vol: 0.6 },
  { at: 'c5', type: 'rustle', vol: 0.4 },
  { at: 'creak', type: 'creak', vol: 0.7 },
  { at: 'd1', type: 'stab', vol: 0.6 },
  { at: 'd5', type: 'hit', vol: 0.7 },
  { at: 'grab', type: 'scrape', vol: 0.6 },
  { at: 'play', type: 'tap3', vol: 0.4 },
  { at: 'e3', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'e4', type: 'glitch', vol: 0.3 },
  { at: 'e5', type: 'hit', vol: 0.8 },
  { at: 'run', type: 'steps', dur: 1.2, vol: 0.7 },
  { at: 'run', off: 0.8, type: 'hit', vol: 0.6 },
  { at: 'dawn', type: 'ringtone', dur: 2.5, vol: 0.45 },
  { at: 'f2', type: 'pickup', vol: 0.5 },
  { at: 'f3', type: 'stab', vol: 0.6 },
  { at: 'f4', type: 'clock', dur: 4, vol: 0.5 },
  { at: 'f4:end', off: 0.4, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'c1', mood: 'suspense' },
  { at: 'c2', mood: 'tension' },
  { at: 'creak', mood: 'silence' },
  { at: 'd3', mood: 'tension' },
  { at: 'play', mood: 'silence' },
  { at: 'e5', mood: 'thriller' },
  { at: 'f2', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['dawn', '12月7日 夜明け', 2.4]]) });
