// ドラレコ 第1話「後部座席」— 映像・効果音・BGM
// 手がかり（最終話までに回収）：0時41分／サンバイザーの裏に伸びる右手／回送のメーターと無線／ハルナの最後のLINE／黒いワゴン／1年前と同じ番号
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag, shake } from '../../engine/core.js';
import { close, head, mood, speedLines } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { D, camView, konbini, rearSeat, mirrorShot, mirrorEyes, behind, dash, visor, harunaPhoto, thread, lockD } from '../../engine/dorasets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, camS, shojiS, yukiS, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

const NOW = { date: '2026/12/12' };
const FLOOR = { woman: 'floor', eyes: 'wide' };
const PAST = { ...P, yuki: P.haruna }; // 1年前の映像（後ろの席にハルナ）
// ルームミラーの中：ユキの目
const eyesIn = (o = {}) => mirrorEyes(P.yuki, o);
// ミラーの中：足もとから起き上がるユキ（k 0..1）
const riseIn = k => (g, w, h) => { vgrad(g, 0, 0, w, h, [[0, '#1a1c22'], [1, '#0e0f14']]); fillRR(g, 0, h * 0.55, w, h * 0.5, 30, '#25282f'); head(g, P.yuki, w * 0.56, lerp(h * 1.3, h * 0.62, ease(k)), w * 0.33, { eyes: 'wide', brow: -0.3, mouth: 'line', look: -0.2, lightFrom: 'left' }); };
const MSG1 = { name: '080-●●●●-0141', av: '？', body: '久しぶりだな、小野寺さん。', time: '0:44' };
const MSG2 = { name: '080-●●●●-0141', av: '？', body: '後ろの女、どこで降ろす？', time: '0:44' };
const OLD = [{ d: '2025年12月5日' }, { text: '今夜も、頼む', time: '0:38' }, { text: 'わかりました', me: 1, time: '0:39' }, { d: '今日' }, { text: '久しぶりだな、小野寺さん。', time: '0:44' }, { text: '後ろの女、どこで降ろす？', time: '0:44' }];
const LINE_H = [{ d: '2025年12月5日' }, { text: '今タクシー乗った', time: '0:41' }, { text: 'いつもの運転手さん', time: '0:42' }, { text: 'でも、なんか変', time: '0:47' }, { text: '無線で、私のこと話してる', time: '0:49' }];
const camSmall = (o = {}) => (g, w, h) => camView(g, 0, 0, w, h, { P, ...NOW, ...o });

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 1, title: '後部座席',
    back: g2 => { camView(g2, -333, 0, 1745, 1920, { t: 3, P, ...NOW, ...FLOOR, clock: '00:41:07' }); },
    face: g2 => { fillRR(g2, 70, 1290, 380, 70, 35, 'rgba(0,0,0,.6)'); circ(g2, 112, 1325, 14, D.rec); text(g2, 'REC  00:41', 140, 1327, { size: 40, color: '#fff', align: 'left', weight: 800 }); },
  });
}

const SHOTS = [
  // ── 冒頭：1フレーム目から車内カメラ。足もとから見上げる女
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...FLOOR, clock: '00:41:07', z0: 1.0, z1: 1.0 }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...FLOOR, clock: '00:41:07', cx: 640, cy: 760, z0: 1.05, z1: 1.3 }); } },
  { at: 'turn', finish: { vignette: 0.6 }, draw(g, lt, D0) { const k = easeOut(inv(0, 0.5, lt)); g.save(); g.translate(lerp(-600, 0, k), 0); rearSeat(g, { t: lt }); g.restore(); if (k < 1) { g.save(); g.globalAlpha = (1 - k) * 0.6; for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, i * 96, W, 30); } g.restore(); } } },
  { at: 'k2', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D0, 1.0, 1.06) }); rearSeat(g, { t: lt }); g.restore(); } },
  { at: 'k3', finish: { vignette: 0.65 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...FLOOR, clock: '00:41:12', t0: 2, cx: 720, cy: 780, z0: 1.3, z1: 1.6 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 足もと
  { at: 'a1', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 250, 190, 580, 130, 20, 'rgba(10,12,18,.88)'); text(g, '小野寺ショウジ（48）', 540, 240, { size: 48, color: '#fff' }); text(g, 'タクシー運転手', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D0, 1.0, 1.05) }); konbini(g, { t: lt, shoji: P.shoji, shadow: inv(D0 * 0.35, D0 * 0.95, lt), P }); g.restore(); } },
  { at: 'a3', draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...FLOOR, clock: '00:41:15', t0: 4, z0: 1.0, z1: 1.04 }); const a = inv(0.4, 0.8, lt); g.save(); g.globalAlpha = a; g.lineWidth = 6; g.strokeStyle = D.rec; g.setLineDash([18, 12]); g.beginPath(); g.ellipse(750, 820, 250, 170, -0.3, 0, 7); g.stroke(); g.restore(); } },
  { at: 'a4', finish: { vignette: 0.7 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...FLOOR, clock: '00:41:19', t0: 6, cx: 720, cy: 790, z0: 1.6, z1: 1.9 }); } },
  { at: 'rise', finish: { vignette: 0.6 }, draw(g, lt, D0) { mirrorShot(g, { t: lt, inner: riseIn(inv(0, D0, lt)) }); } },
  { at: 'a5', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 600, z: slow(lt, D0, 1.15, 1.25) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'normal', brow: -0.5 }) }); g.restore(); } },
  { at: 'a6', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['a6'], { eyes: 'normal', brow: 0.4 }); } },
  { at: 'a7', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['a7'], { eyes: 'normal', brow: -0.4 }); } },
  { at: 'a8', finish: { vignette: 0.65 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'wide', brow: -0.5, z0: 1.05, z1: 1.14 }); } },

  // ── 2. 1年前の今夜
  { at: 'b1', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['b1'], { eyes: 'narrow', brow: -0.5 }); } },
  { at: 'b2', draw(g, lt, D0) { bg(g, '#14161c', '#0a0b10'); g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D0, 1.0, 1.05) }); photo(g, 540, 540, 560, 680, (q, w, h) => harunaPhoto(q, w, h, P.haruna), { rot: -0.03 }); g.restore(); tag(g, '白石ハルナ（26）', 540, 150, { size: 40, bg: '#0b0d12', color: '#f4f6f8', alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'b3', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['b3'], { eyes: 'narrow', brow: -0.2, look: -0.3, z0: 1.16, z1: 1.24 }); } },
  { at: 'b4', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.25, 1.4) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'normal', brow: -0.6, look: 0 }) }); g.restore(); } },
  { at: 'b5', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['b5'], { eyes: 'narrow', look: 1, brow: 0.3 }); } },
  { at: 'b6', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow', brow: 0.6, look: 0.2, z0: 1.1, z1: 1.22 }); mood(g, { dark: 0.15 }); } },

  // ── 3. 1年前の常連（後編の頭）・消えた映像
  { at: 'c0', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D0, 1.0, 1.05) }); camView(g, 40, 80, 1000, 1100, { t: lt, P: PAST, woman: 'up', eyes: 'normal', date: '2025/12/05', clock: '00:41:03', look: 0.3 }); g.restore(); mood(g, { desat: 0.3 }); } },
  { at: 'c1', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['c1'], { eyes: 'normal', brow: -0.3 }); } },
  { at: 'c2', draw(g, lt, D0) { g.save(); cam(g, { x: 790, y: 520, z: slow(lt, D0, 1.6, 1.8) }); dash(g, { t: lt, screen: camSmall({ woman: 'up', clock: '00:46:30', t: lt }) }); g.restore(); subBand(g); } },
  { at: 'c3', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.3, 1.45) }); mirrorShot(g, { t: lt, inner: eyesIn({ eyes: 'normal', brow: -0.6 }) }); g.restore(); } },
  { at: 'c4', draw(g, lt, D0) { g.save(); cam(g, { x: 660, y: 620, z: slow(lt, D0, 1.2, 1.28) }); visor(g, { t: lt, hand: Math.min(0.82, inv(0, D0 * 0.7, lt)), card: 0 }); g.restore(); } },
  { at: 'c5', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['c5'], { eyes: 'narrow', look: 1 }); } },

  // ── 4. 回送の無線
  { at: 'radio', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 900, z: slow(lt, D0, 1.0, 1.1) }); dash(g, { t: lt, radio: 1, screen: camSmall({ woman: 'up', clock: '00:47:02', t: lt }) }); g.restore(); } },
  { at: 'd1', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 1000, z: slow(lt, D0, 1.5, 1.7) }); dash(g, { t: lt, radio: 1 }); g.restore(); } },
  { at: 'd2', draw(g, lt, D0) { g.save(); cam(g, { x: 270, y: 800, z: slow(lt, D0, 1.7, 1.9) }); dash(g, { t: lt, radio: 0 }); g.restore(); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, woman: 'up', eyes: 'normal', look: 0, clock: '00:47:10', t0: 3, cx: 540, cy: 960, z0: 1.0, z1: 1.0 }); const pa = 0.5 + 0.5 * Math.sin(lt * 6); g.save(); g.lineWidth = 8; g.strokeStyle = rgba(D.rec, 0.5 + 0.5 * pa); g.beginPath(); g.arc(94, 136, 36 + pa * 14, 0, 7); g.stroke(); g.restore(); glow(g, 540, 960, 900, 'rgba(255,40,40,1)', 0.06 + 0.05 * pa); } },
  { at: 'd4', draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: 9, name: 'ハルナ', av: 'ハ', col: '#b07a6a', msgs: LINE_H })); } },
  { at: 'd5', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: lt + 9, name: 'ハルナ', av: 'ハ', col: '#b07a6a', msgs: LINE_H, hi: 4 }), { x: 520, y: 834, z0: 1.5, z1: 1.6 }); subBand(g); } },

  // ── 5. 引き
  { at: 'e1', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 420, z: slow(lt, D0, 1.15, 1.3) }); mirrorShot(g, { t: lt, inner: (q, w, h) => behind(q, w, h, { t: lt, near: lerp(0.2, 0.6, inv(0, D0, lt)) }) }); g.restore(); } },
  { at: 'buzz', finish: { vignette: 0.7 }, draw(g, lt, D0) { const sx = noise1(lt * 40, 3) * 8; g.save(); g.translate(sx, 0); g.save(); cam(g, { x: 540, y: 800, z: 1.0 }); lockD(g, { t: lt, notifs: [] }); g.restore(); g.restore(); glow(g, 540, 700, 800, 'rgba(255,255,255,1)', 0.15 * Math.abs(Math.sin(lt * 7))); } },
  { at: 'e2', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D0, 1.0, 1.04) }); lockD(g, { t: lt, notifs: [{ t: 0.3, ...MSG1 }] }); g.restore(); } },
  { at: 'e3', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D0, 1.05, 1.15) }); lockD(g, { t: 9, notifs: [MSG1] }); g.restore(); } },
  { at: 'e4', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D0, 1.05, 1.12) }); lockD(g, { t: lt, notifs: [{ t: -1, ...MSG1 }, { t: 0.1, ...MSG2 }] }); g.restore(); } },
  { at: 'e5', finish: { vignette: 0.75 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: lt + 9, name: '080-●●●●-0141', msgs: OLD, hi: 1 }), { x: 520, y: 420, z0: 1.4, z1: 1.7 }); subBand(g); mood(g, { dark: inv(D0 - 0.8, D0, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'engine', dur: 9, vol: 0.35 },
  { at: 'cold', type: 'hit', vol: 0.6 },
  { at: 'k1', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'turn', type: 'stab', vol: 0.7 },
  { at: 'k3', type: 'glitch', vol: 0.4 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'engine', dur: 14, vol: 0.3 },
  { at: 'a2', type: 'ping', vol: 0.3 },
  { at: 'a2', off: 2.5, type: 'creak', vol: 0.5 },
  { at: 'a4', type: 'stab', vol: 0.6 },
  { at: 'rise', type: 'rustle', vol: 0.7 },
  { at: 'a5', type: 'hit', vol: 0.5 },
  { at: 'a7', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'a8', type: 'stab', vol: 0.5 },
  { at: 'b1', type: 'engine', dur: 20, vol: 0.28 },
  { at: 'b2', type: 'tap3', vol: 0.3 },
  { at: 'b4', type: 'heartbeat', dur: 3, vol: 0.45 },
  { at: 'b6', type: 'subdrop', vol: 0.6 },
  { at: 'c0', type: 'glitch', vol: 0.35 },
  { at: 'c1', type: 'engine', dur: 18, vol: 0.28 },
  { at: 'c3', type: 'stab', vol: 0.5 },
  { at: 'c4', type: 'rustle', vol: 0.4 },
  { at: 'radio', type: 'glitch', vol: 0.5 },
  { at: 'radio', off: 0.3, type: 'pickup', vol: 0.5 },
  { at: 'd2', type: 'stab', vol: 0.5 },
  { at: 'd3', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'd4', type: 'tap3', vol: 0.3 },
  { at: 'd5', type: 'hit', vol: 0.6 },
  { at: 'e1', type: 'engine', dur: 5, vol: 0.4 },
  { at: 'e1', type: 'riser', vol: 0.4 },
  { at: 'buzz', type: 'vibrate', dur: 0.9, vol: 0.7 },
  { at: 'e2', off: 0.3, type: 'notif', vol: 0.8 },
  { at: 'e3', type: 'hit', vol: 0.8 },
  { at: 'e4', type: 'notif', vol: 0.7 },
  { at: 'e5', type: 'riser', vol: 0.6 },
  { at: 'e5:end', off: 0.3, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'rise', mood: 'suspense' },
  { at: 'b1', mood: 'uneasy' },
  { at: 'b6', mood: 'silence' },
  { at: 'c0', mood: 'uneasy' },
  { at: 'radio', mood: 'suspense' },
  { at: 'e1', mood: 'tension' },
  { at: 'buzz', mood: 'silence' },
  { at: 'e3', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a2', '0:31　国道沿いのコンビニ', 2.8], ['c0', '1年前の金曜　0:41', 2.6]]) });
