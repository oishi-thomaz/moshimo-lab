// ドラレコ 第2話「回送」— 映像・効果音・BGM
// 手がかり（最終話までに回収）：外から使える会社の無線／本当の最後のLINE（いつもと違う角）／会社の人を名乗る黒い車の男／男のスマホに映る車内カメラ
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, mood } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { callUI } from '../../engine/chichisets.js';
import { D, camView, rearSeat, mirrorShot, mirrorEyes, behind, dash, harunaPhoto, thread, lockD, wagonSide } from '../../engine/dorasets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, camS, shojiS, yukiS, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep02.script.js';

const NOW = { date: '2026/12/12' };
const UP = { woman: 'up', eyes: 'normal' };
const PAST = { ...P, yuki: P.haruna }; // 1年前の映像（後ろの席にハルナ）
const eyesIn = (o = {}) => mirrorEyes(P.yuki, o);
const MSG1 = { name: '080-●●●●-0141', av: '？', body: '久しぶりだな、小野寺さん。', time: '0:44' };
const MSG2 = { name: '080-●●●●-0141', av: '？', body: '後ろの女、どこで降ろす？', time: '0:44' };
const LINE_H = [{ d: '2025年12月5日' }, { text: '今タクシー乗った', time: '0:41' }, { text: 'いつもの運転手さん', time: '0:42' }, { text: 'でも、なんか変', time: '0:47' }, { text: '無線で、私のこと話してる', time: '0:49' }];
const LAST = { text: '運転手さんが、\nいつもと違う角で\n降ろすって', time: '0:53' };
const camSmall = (o = {}) => (g, w, h) => camView(g, 0, 0, w, h, { P, ...NOW, ...o });
const office = { name: 'みなと台交通 夜間', av: 'み', col: '#3a5a7a' };
const mayuC = { name: 'マユ', av: 'マ', col: '#b07a8a' };
// マユの写真（大学の前で笑う）
const mayuPhoto = (q, w, h) => { vgrad(q, 0, 0, w, h, [[0, '#b8c8d8'], [1, '#e8ecf0']]); fillRR(q, 0, h * 0.5, w, h * 0.5, 0, '#c8bca8'); for (let i = 0; i < 4; i++) fillRR(q, w * 0.05 + i * w * 0.24, h * 0.12, w * 0.18, h * 0.34, 4, '#8a98a8'); close(q, P.mayu, { x: w * 0.5, y: h * 0.42, s: w / 470, eyes: 'normal', mouth: 'smile', lightFrom: 'left' }); };
// 男のスマホの中：今の6号車の車内カメラ（後ろの席にユキ、手前にショウジの後ろ頭）
const liveCam = lt => (q, w, h) => { vgrad(q, 0, 0, w, h, [[0, '#0e1016'], [1, '#07080b']]); camView(q, 0, h * 0.2, w, h * 0.56, { t: lt, P, ...UP, look: 0, date: '', clock: '00:59', label: '', car: '6号車' }); text(q, '● LIVE', w / 2, h * 0.12, { size: 30, color: D.rec, weight: 900 }); };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 2, title: '回送',
    back: g2 => { camView(g2, -333, 0, 1745, 1920, { t: 3, P, ...UP, look: 0, date: '', clock: '', label: '', car: '' }); },
    face: g2 => { fillRR(g2, 70, 1290, 380, 70, 35, 'rgba(0,0,0,.6)'); circ(g2, 112, 1325, 14, D.rec); text(g2, 'REC  00:52', 140, 1327, { size: 40, color: '#fff', align: 'left', weight: 800 }); },
  });
}

const SHOTS = [
  // ── 冒頭：1フレーム目から車内カメラ。後ろの席に座っている女（乗せていない）
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...UP, look: 0, clock: '00:52:04', glitch: 0.5 * (1 - inv(0, 0.3, lt)), z0: 1.0, z1: 1.0 }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...UP, look: 0, clock: '00:52:04', t0: 0.3, cx: 660, cy: 640, z0: 1.05, z1: 1.35 }); } },
  { at: 'radio', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 900, z: slow(lt, D0, 1.0, 1.08) }); dash(g, { t: lt, radio: 1, screen: camSmall({ ...UP, clock: '00:52:10', t: lt }) }); g.restore(); } },
  { at: 'k2', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 1000, z: slow(lt, D0, 1.5, 1.7) }); dash(g, { t: lt, radio: 1 }); g.restore(); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...UP, look: 0, clock: '00:52:17', t0: 3, cx: 540, cy: 960, z0: 1.0, z1: 1.0 }); const pa = 0.5 + 0.5 * Math.sin(lt * 6); g.save(); g.lineWidth = 8; g.strokeStyle = rgba(D.rec, 0.5 + 0.5 * pa); g.beginPath(); g.arc(94, 136, 36 + pa * 14, 0, 7); g.stroke(); g.restore(); glow(g, 540, 960, 900, 'rgba(255,40,40,1)', 0.06 + 0.05 * pa); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 返事をしない
  { at: 'a1', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 250, 190, 580, 130, 20, 'rgba(10,12,18,.88)'); text(g, '小野寺ショウジ（48）', 540, 240, { size: 48, color: '#fff' }); text(g, 'タクシー運転手', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, [], { eyes: 'normal', brow: -0.4, look: -0.3 }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 270, 150, 540, 130, 20, 'rgba(10,12,18,.88)'); text(g, '白石ユキ（31）', 540, 200, { size: 48, color: '#fff' }); text(g, 'ハルナの姉', 540, 252, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a3', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D0, 1.0, 1.06) }); lockD(g, { t: 9, clock: '0:52', notifs: [MSG1, MSG2] }); g.restore(); } },
  { at: 'a4', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.25, 1.35) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'normal', brow: -0.6 }) }); g.restore(); } },
  { at: 'a5', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['a5'], { eyes: 'narrow', look: 1, brow: 0.3 }); } },
  { at: 'a6', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['a6'], { eyes: 'narrow', brow: -0.5 }); } },

  // ── 2. 夜間当番
  { at: 'dial', draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'call', ...office })); } },
  { at: 'b1', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['b1'], { eyes: 'narrow', look: 0.6 }); } },
  { at: 'b2', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 3, mode: 'talk', ...office }), { z0: 1.02, z1: 1.1 }); } },
  { at: 'b3', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 7, mode: 'talk', ...office }), { y: 700, z0: 1.15, z1: 1.25 }); subBand(g); } },
  { at: 'b4', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.25, 1.35) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'normal', brow: -0.6, dx: Math.sin(lt * 7) * 40 * (1 - inv(D0 * 0.6, D0, lt)) }) }); g.restore(); } },
  { at: 'b5', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['b5'], { eyes: 'narrow', look: 0.8, brow: 0.4 }); } },
  { at: 'b6', finish: { vignette: 0.7 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 1000, z: slow(lt, D0, 1.5, 1.75) }); dash(g, { t: lt, radio: 0 }); g.restore(); mood(g, { dark: 0.15 }); } },
  { at: 'b7', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['b7'], { eyes: 'narrow', brow: -0.5 }); } },
  { at: 'b8', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: 600, y: 760, z: slow(lt, D0, 1.05, 1.2) }); camView(g, 40, 80, 1000, 1100, { t: lt, P: PAST, woman: 'up', eyes: 'wide', look: -0.6, date: '2025/12/05', clock: '00:49:12' }); g.restore(); mood(g, { desat: 0.3 }); } },

  // ── 3. 本当の最後のLINE
  { at: 'c1', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['c1'], { eyes: 'normal', brow: -0.4, look: -0.7 }); } },
  { at: 'c2', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['c2'], { eyes: 'narrow', look: 1, brow: 0.3 }); } },
  { at: 'c3', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.3, 1.45) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'narrow', brow: -0.6 }) }); g.restore(); } },
  { at: 'c4', draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: 9, name: 'ハルナ', av: 'ハ', col: '#b07a6a', msgs: LINE_H })); } },
  { at: 'c5', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: lt + 9, name: 'ハルナ', av: 'ハ', col: '#b07a6a', msgs: [...LINE_H, { t: 9.3, ...LAST }], hi: 5 }), { x: 520, y: 860, z0: 1.25, z1: 1.32 }); subBand(g); } },
  { at: 'c6', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'wide', brow: -0.5, z0: 1.05, z1: 1.16 }); mood(g, { dark: 0.12 }); } },

  // ── 後編の頭：1年前の暗い角
  { at: 'c7', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D0, 1.0, 1.05) }); camView(g, 40, 80, 1000, 1100, { t: lt * 0.2, P: PAST, woman: 'up', eyes: 'normal', look: 0.6, date: '2025/12/05', clock: '00:53:40' }); g.restore(); mood(g, { desat: 0.3 }); } },
  { at: 'c8', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['c8'], { eyes: 'narrow', brow: -0.5 }); } },
  { at: 'c9', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['c9'], { eyes: 'narrow', look: 1, brow: 0.3 }); } },
  { at: 'c10', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow', brow: 0.6, look: 0.2, z0: 1.1, z1: 1.22 }); mood(g, { dark: 0.15 }); } },

  // ── 4. マユ
  { at: 'd1', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['d1'], { eyes: 'normal', brow: -0.3, look: -0.6 }); } },
  { at: 'ring', draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'call', ...mayuC })); } },
  { at: 'd2', draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 1, mode: 'talk', ...mayuC }), { z0: 1.02, z1: 1.08 }); } },
  { at: 'd3', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['d3'], { eyes: 'wide', look: 0.6, brow: -0.3 }); } },
  { at: 'd4', draw(g, lt, D0) { bg(g, '#14161c', '#0a0b10'); g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D0, 1.0, 1.05) }); photo(g, 540, 540, 560, 680, mayuPhoto, { rot: 0.03 }); g.restore(); tag(g, '小野寺マユ（19）　大学2年', 540, 150, { size: 40, bg: '#0b0d12', color: '#f4f6f8', alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'd5', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 9, mode: 'talk', ...mayuC }), { y: 700, z0: 1.1, z1: 1.2 }); subBand(g); } },
  { at: 'd7', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 420, z: slow(lt, D0, 1.15, 1.3) }); mirrorShot(g, { t: lt, inner: (q, w, h) => behind(q, w, h, { t: lt, near: lerp(0.4, 0.8, inv(0, D0, lt)) }) }); g.restore(); } },
  { at: 'd8', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'wide', brow: -0.6, z0: 1.08, z1: 1.2 }); mood(g, { dark: 0.12 }); } },

  // ── 5. 引き
  { at: 'e1', finish: { vignette: 0.6 }, draw(g, lt, D0) { const k = easeOut(inv(0, D0 * 0.8, lt)); g.save(); g.translate(lerp(420, 0, k), 0); wagonSide(g, { t: lt }); g.restore(); } },
  { at: 'e2', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D0, 1.0, 1.06) }); wagonSide(g, { t: lt + 3, down: inv(0, D0, lt) }); g.restore(); } },
  { at: 'e3', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 640, z: slow(lt, D0, 1.06, 1.16) }); wagonSide(g, { t: lt + 6, down: 1, raise: inv(0, D0 * 0.8, lt), screen: liveCam(lt) }); g.restore(); } },
  { at: 'e4', finish: { vignette: 0.75 }, draw(g, lt, D0) { g.save(); cam(g, { x: 509, y: 850, z: slow(lt, D0, 1.7, 2.0) }); wagonSide(g, { t: lt + 9, down: 1, raise: 1, screen: liveCam(lt + 3) }); g.restore(); subBand(g); mood(g, { dark: inv(D0 - 0.8, D0, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'engine', dur: 9, vol: 0.35 },
  { at: 'cold', type: 'glitch', vol: 0.5 },
  { at: 'k1', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'radio', type: 'glitch', vol: 0.5 },
  { at: 'radio', off: 0.2, type: 'pickup', vol: 0.5 },
  { at: 'k3', type: 'stab', vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'engine', dur: 22, vol: 0.3 },
  { at: 'a3', type: 'notif', vol: 0.4 },
  { at: 'a4', type: 'stab', vol: 0.45 },
  { at: 'dial', type: 'dial', vol: 0.5 },
  { at: 'b1', type: 'engine', dur: 30, vol: 0.26 },
  { at: 'b2', type: 'hit', vol: 0.6 },
  { at: 'b4', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'b6', type: 'subdrop', vol: 0.6 },
  { at: 'b8', type: 'glitch', vol: 0.35 },
  { at: 'c1', type: 'engine', dur: 28, vol: 0.26 },
  { at: 'c3', type: 'stab', vol: 0.5 },
  { at: 'c4', type: 'tap3', vol: 0.3 },
  { at: 'c5', off: 0.3, type: 'notif', vol: 0.6 },
  { at: 'c5', type: 'riser', vol: 0.4 },
  { at: 'c6', type: 'subdrop', vol: 0.7 },
  { at: 'c7', type: 'glitch', vol: 0.35 },
  { at: 'c7', off: 1.5, type: 'carstop', vol: 0.4 },
  { at: 'c10', type: 'stab', vol: 0.6 },
  { at: 'd1', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'ring', type: 'dial', vol: 0.5 },
  { at: 'd2', type: 'pickup', vol: 0.4 },
  { at: 'd4', type: 'stab', vol: 0.5 },
  { at: 'd7', type: 'engine', dur: 5, vol: 0.4 },
  { at: 'd7', type: 'riser', vol: 0.4 },
  { at: 'd8', type: 'subdrop', vol: 0.6 },
  { at: 'e1', type: 'engine', dur: 14, vol: 0.45 },
  { at: 'e2', type: 'creak', vol: 0.4 },
  { at: 'e3', type: 'riser', vol: 0.6 },
  { at: 'e4', type: 'hit', vol: 0.8 },
  { at: 'e4:end', off: 0.3, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'dial', mood: 'suspense' },
  { at: 'b6', mood: 'tension' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'c5', mood: 'suspense' },
  { at: 'c6', mood: 'silence' },
  { at: 'c7', mood: 'uneasy' },
  { at: 'ring', mood: 'suspense' },
  { at: 'd7', mood: 'tension' },
  { at: 'e1', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a3', '0:52　国道', 2.6], ['c7', '1年前の金曜　0:53', 2.6]]) });
