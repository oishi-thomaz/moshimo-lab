// ドラレコ 第3話「金曜日」— 映像・効果音・BGM
// 手がかり（最終話までに回収）：サンバイザーの裏のSDカード／1年前の映像の中のハルナ（つけてくる車）／着信 灰原／前のカメラに映る角の黒いワゴン／カメラの向こうで見ている男
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { mood } from '../../engine/noir.js';
import { callUI } from '../../engine/chichisets.js';
import { D, camView, mirrorShot, mirrorEyes, dash, lockD, visor, nightRoad, sdCard, frontCam, playMark } from '../../engine/dorasets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, camS, shojiS, yukiS, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep03.script.js';

const NOW = { date: '2026/12/12' };
const PAST = { ...P, yuki: P.haruna }; // 1年前の映像（後ろの席にハルナ）
const OLD = { P: PAST, woman: 'up', date: '2025/12/05' };
const UP = { woman: 'up', eyes: 'normal' };
const eyesIn = (o = {}) => mirrorEyes(P.yuki, o);
const haibara = { name: '灰原', av: '灰', col: '#3a3a44' };
const MSG = { name: '灰原', av: '灰', body: 'そのカード、まだ持ってたのか。', time: '1:24' };
// 1年前の映像を画面いっぱいに（再生バーつき）
const oldCam = (g, lt, D0, o = {}, p = 0.1, ph = 0) => {
  bg(g, '#040506', '#08090b');
  g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 960, z: slow(lt, D0, o.z0 ?? 1.0, o.z1 ?? 1.05) });
  camView(g, 40, 80, 1000, 1100, { ...OLD, eyes: 'normal', ...o, t: lt + (o.t0 || 0) });
  // 運転席のスマホの光（手前左、ショウジの頭の横）
  if (ph > 0) { const f = 0.6 + 0.4 * Math.sin(lt * 14); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 290, 960, 200, 'rgba(200,220,255,1)', 0.5 * f * ph); g.restore(); }
  playMark(g, 40, 80, 1000, 1100, { p }); g.restore();
};
// モニターの中の1年前の映像
const oldSmall = (o = {}) => (g, w, h) => { camView(g, 0, 0, w, h, { ...OLD, eyes: 'normal', ...o }); playMark(g, 0, 0, w, h, { p: o.p ?? 0.05 }); };
// 前のカメラ（画面いっぱい）
const frontS = (g, lt, D0, o = {}) => { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 630, z: slow(lt, D0, o.z0 ?? 1.0, o.z1 ?? 1.05) }); frontCam(g, 40, 80, 1000, 1100, { t: lt + (o.t0 || 0), ...o }); playMark(g, 40, 80, 1000, 1100, { p: o.p ?? 0.8, label: '▶ 再生中　20251205_004107.MP4　CAM1' }); g.restore(); };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 3, title: '金曜日',
    back: g2 => { camView(g2, -333, 0, 1745, 1920, { t: 3, ...OLD, eyes: 'normal', look: 0.4, date: '', clock: '', label: '', car: '' }); },
    face: g2 => { fillRR(g2, 70, 1290, 470, 70, 35, 'rgba(0,0,0,.6)'); text(g2, '▶  2025/12/05  0:41', 100, 1327, { size: 40, color: '#fff', align: 'left', weight: 800 }); },
  });
}

const SHOTS = [
  // ── 冒頭：1フレーム目から1年前の映像。後ろの席に、消えたはずのハルナ
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:41:07', glitch: 0.6 * (1 - inv(0, 0.3, lt)), z0: 1.0, z1: 1.0 }, 0.02); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:41:07', t0: 0.3, look: 0.4, cx: 660, cy: 560, z0: 1.05, z1: 1.3 }, 0.03); } },
  { at: 'k2', finish: { vignette: 0.65 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:44:52', t0: 4, eyes: 'wide', look: 0.6, cx: 700, cy: 480, z0: 1.4, z1: 1.55 }, 0.1); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D0) { g.save(); cam(g, { x: 790, y: 470, z: slow(lt, D0, 1.6, 1.85) }); dash(g, { t: lt, screen: oldSmall({ t: lt, clock: '00:44:55', p: 0.12 }) }); g.restore(); mood(g, { dark: 0.1 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. サンバイザーの裏
  { at: 'a1', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 250, 190, 580, 130, 20, 'rgba(10,12,18,.88)'); text(g, '小野寺ショウジ（48）', 540, 240, { size: 48, color: '#fff' }); text(g, 'タクシー運転手', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, [], { eyes: 'normal', brow: -0.4, look: -0.3 }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 270, 150, 540, 130, 20, 'rgba(10,12,18,.88)'); text(g, '白石ユキ（31）', 540, 200, { size: 48, color: '#fff' }); text(g, 'ハルナの姉', 540, 252, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a3', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D0, 1.0, 1.06) }); nightRoad(g, { t: lt, speed: 0.8 }); g.restore(); const k = inv(0, D0 * 0.7, lt); g.save(); g.globalCompositeOperation = 'lighter'; for (const sx of [-1, 1]) glow(g, 540 + sx * 22 * (1 - k), 740, 40 * (1 - k) + 8, 'rgba(255,40,40,1)', 0.8 * (1 - k)); g.restore(); } },
  { at: 'a4', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['a4'], { eyes: 'narrow', brow: -0.5 }); } },
  { at: 'a5', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.25, 1.38) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'narrow', brow: -0.6 }) }); g.restore(); } },
  { at: 'a6', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 600, y: 520, z: slow(lt, D0, 1.0, 1.08) }); visor(g, { t: lt, hand: 0.7 * ease(inv(0, D0 * 0.9, lt)) }); g.restore(); subBand(g); } },
  { at: 'a7', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 760, y: 560, z: slow(lt, D0, 1.3, 1.6) }); visor(g, { t: lt + 3, hand: 0.7, card: inv(0, D0 * 0.6, lt) }); g.restore(); subBand(g); } },
  { at: 'a8', finish: { vignette: 0.7 }, draw(g, lt, D0) { bg(g, '#0a0b10', '#14161c'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 640, 700, 'rgba(255,170,80,1)', 0.18); g.restore(); g.save(); cam(g, { x: 540, y: 640, z: slow(lt, D0, 1.0, 1.1) }); sdCard(g, 540, lerp(620, 540, easeOut(inv(0, 0.8, lt))), 1.3, { rot: -0.12 + noise1(lt, 2) * 0.02 }); g.restore(); } },
  { at: 'a9', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['a9'], { eyes: 'narrow', brow: -0.5, look: -0.7 }); } },

  // ── 2. 1年前の金曜
  { at: 'insert', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 790, y: 470, z: slow(lt, D0, 1.5, 1.6) }); dash(g, { t: lt, screen: oldSmall({ t: lt, clock: '00:41:07', p: 0, glitch: 1 - inv(0, D0, lt) }) }); g.restore(); } },
  { at: 'b1', finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:41:' + String(7 + Math.floor(lt)).padStart(2, '0'), look: 0.3, z0: 1.0, z1: 1.05 }, 0.02 + lt * 0.003); } },
  { at: 'b2', finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:41:20', t0: 2, look: 0.6, cx: 700, cy: 500, z0: 1.3, z1: 1.4 }, 0.04); } },
  { at: 'b3', finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:44:31', t0: 6, look: 0.6, cx: 700, cy: 470, z0: 1.5, z1: 1.6 }, 0.1); } },
  { at: 'b4', finish: { vignette: 0.65 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:44:49', t0: 8, eyes: 'wide', look: -0.6 + 1.2 * ease(inv(D0 * 0.5, D0 * 0.8, lt)), cx: 640, cy: 420, z0: 1.3, z1: 1.45 }, 0.11); } },
  { at: 'b5', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['b5'], { eyes: 'normal', brow: 0.4, look: -0.8 }); } },
  { at: 'ring', finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:52:16', t0: 12, look: 0.5, z0: 1.0, z1: 1.04 }, 0.45, 1); } },
  { at: 'b6', finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:52:18', t0: 13, look: 0.6, cx: 470, cy: 900, z0: 1.05, z1: 1.12 }, 0.46, 1); subBand(g); } },
  { at: 'b7', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'in', sub: '1年前の金曜　着信 0:52', ...haibara }), { z0: 1.02, z1: 1.1 }); mood(g, { desat: 0.35 }); } },
  { at: 'b8', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'wide', brow: -0.5, z0: 1.05, z1: 1.18 }); mood(g, { dark: 0.15 }); } },

  // ── 後編の頭：1年前、2回目のコールで出た
  { at: 'c1', finish: { vignette: 0.65 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:52:21', t0: 14, look: 0.6, z0: 1.0, z1: 1.06 }, 0.47, 1 - inv(D0 * 0.6, D0, lt) * 0.6); } },
  { at: 'c2', finish: { vignette: 0.7 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:52:24', t0: 17, look: 0.8, cx: 480, cy: 900, z0: 1.06, z1: 1.1 }, 0.48, 0.7); subBand(g); } },
  { at: 'c3', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['c3'], { eyes: 'wide', brow: -0.6, z0: 1.15, z1: 1.2 }); } },
  { at: 'c4', finish: { vignette: 0.6 }, draw(g, lt, D0) { oldCam(g, lt, D0, { clock: '00:53:36', t0: 20, look: 0.9, cx: 700, cy: 500, z0: 1.3, z1: 1.4 }, 0.7); } },
  { at: 'c5', finish: { vignette: 0.6 }, draw(g, lt, D0) { frontS(g, lt, D0, { clock: '00:53:39', stop: inv(0, D0 * 0.8, lt), p: 0.72 }); } },
  { at: 'c6', finish: { vignette: 0.65 }, draw(g, lt, D0) { frontS(g, lt, D0, { clock: '00:53:48', walk: inv(0, D0, lt) * 0.6, lights: ease(inv(D0 * 0.55, D0 * 0.7, lt)), z0: 1.0, z1: 1.1, p: 0.75 }); } },
  { at: 'c7', finish: { vignette: 0.7 }, draw(g, lt, D0) { frontS(g, lt, D0, { clock: '00:53:53', t0: 3, walk: 0.6 + inv(0, D0, lt) * 0.2, lights: 1, cx: 520, cy: 520, z0: 1.4, z1: 1.7, p: 0.78 }); } },
  { at: 'c8', finish: { vignette: 0.75 }, draw(g, lt, D0) { const k = inv(D0 * 0.3, D0 * 0.4, lt); if (k < 1) frontS(g, lt, D0, { clock: '00:53:58', t0: 5, walk: 0.8, lights: 1, cx: 520, cy: 520, z0: 1.7, z1: 1.7, p: 0.8 }); else { bg(g, '#020203', '#050506'); text(g, '■ 録画停止', 540, 560, { size: 64, color: '#f4f6f8', weight: 800 }); text(g, '2025/12/05  00:53:58', 540, 650, { size: 40, color: '#a9aebb', weight: 700 }); } } },

  // ── 3. 見ている男
  { at: 'd1', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['d1'], { eyes: 'wide', brow: 0.2, look: -0.7 }); } },
  { at: 'd2', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow', brow: 0.5, look: 0.1, z0: 1.08, z1: 1.18 }); mood(g, { dark: 0.15 }); } },
  { at: 'buzz', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D0, 1.0, 1.04) }); lockD(g, { t: lt, clock: '1:24', notifs: [{ t: 0.2, ...MSG }] }); g.restore(); } },
  { at: 'd3', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D0, 1.0, 1.06) }); lockD(g, { t: 9, clock: '1:24', notifs: [MSG] }); g.restore(); } },
  { at: 'd4', finish: { vignette: 0.7 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...UP, look: 0, clock: '01:24:10', z0: 1.0, z1: 1.0 }); const pa = 0.5 + 0.5 * Math.sin(lt * 6); g.save(); g.lineWidth = 8; g.strokeStyle = rgba(D.rec, 0.5 + 0.5 * pa); g.beginPath(); g.arc(94, 136, 36 + pa * 14, 0, 7); g.stroke(); g.restore(); glow(g, 540, 960, 900, 'rgba(255,40,40,1)', 0.06 + 0.05 * pa); } },

  // ── 4. 引き
  { at: 'e1', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.3, 1.4) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'normal', brow: -0.5 }) }); g.restore(); } },
  { at: 'e2', finish: { vignette: 0.75 }, draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['e2'], { eyes: 'wide', brow: -0.6, look: -0.8, z0: 1.2, z1: 1.4 }); mood(g, { dark: inv(D0 - 0.8, D0, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'engine', dur: 9, vol: 0.3 },
  { at: 'cold', type: 'glitch', vol: 0.55 },
  { at: 'k1', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'k3', type: 'stab', vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'engine', dur: 26, vol: 0.28 },
  { at: 'a5', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'a7', type: 'creak', vol: 0.4 },
  { at: 'a8', type: 'hit', vol: 0.7 },
  { at: 'insert', type: 'tap3', vol: 0.4 },
  { at: 'insert', off: 0.3, type: 'glitch', vol: 0.4 },
  { at: 'b1', type: 'engine', dur: 22, vol: 0.24 },
  { at: 'b3', type: 'stab', vol: 0.45 },
  { at: 'b4', type: 'riser', vol: 0.4 },
  { at: 'ring', type: 'dial', vol: 0.55 },
  { at: 'b7', type: 'hit', vol: 0.7 },
  { at: 'b8', type: 'subdrop', vol: 0.7 },
  { at: 'c1', type: 'glitch', vol: 0.35 },
  { at: 'c1', type: 'engine', dur: 20, vol: 0.24 },
  { at: 'c2', type: 'pickup', vol: 0.35 },
  { at: 'c3', type: 'stab', vol: 0.5 },
  { at: 'c5', off: 0.6, type: 'carstop', vol: 0.45 },
  { at: 'c6', type: 'riser', vol: 0.5 },
  { at: 'c7', type: 'hit', vol: 0.8 },
  { at: 'c8', off: 0.9, type: 'glitch', vol: 0.5 },
  { at: 'c8', off: 1.0, type: 'subdrop', vol: 0.6 },
  { at: 'd1', type: 'engine', dur: 14, vol: 0.26 },
  { at: 'buzz', type: 'notif', vol: 0.6 },
  { at: 'd3', type: 'stab', vol: 0.5 },
  { at: 'd4', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'e1', type: 'riser', vol: 0.5 },
  { at: 'e2', type: 'hit', vol: 0.8 },
  { at: 'e2:end', off: 0.3, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'a8', mood: 'suspense' },
  { at: 'b1', mood: 'uneasy' },
  { at: 'ring', mood: 'suspense' },
  { at: 'b8', mood: 'silence' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'c6', mood: 'tension' },
  { at: 'c8', mood: 'silence' },
  { at: 'd1', mood: 'suspense' },
  { at: 'e1', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a3', '1:20　国道', 2.6], ['b1', '1年前の金曜　0:41', 2.6], ['c5', '1年前の金曜　0:53', 2.6]]) });
