// 二人の息子 第5話（最終話）「母さん」— 映像・効果音・BGM
// 回収：遺影の顔／AIの家族アプリ（記憶のリセット 毎朝5:00・AIのハルト 毎晩21:00）／毎晩21時の着信履歴／カレンダー・湯のみ・テレビ・スピーカー
//   ／録画中のインターホン／スマートロック（施錠）。夜明けは青白い朝の光。最後は詐欺の部屋で、発信先が「母さん」の2台のスマホ
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag, darkness } from '../../engine/core.js';
import { close, figure, mood, speedLines, sfxText } from '../../engine/noir.js';
import { phoneFrame } from '../../engine/sns.js';
import { F, chanoma, doorCam, smartSpeaker, scamRoom, lockApp, butsuma, aiApp, callLog, twinWaves, photo } from '../../engine/futarisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep05.script.js';

const dark = g => bg(g, '#141a17', '#090d0b');
const hall = g => bg(g, '#1c1814', '#0e0c0a');
// 透ける体：一度ふつうに描いてから全体を薄くする（首や髪が顔の上に透けて四角く見えないように）
let ghostCv = null;
const ghosted = (g, a, fn) => {
  if (a >= 0.999) { g.save(); fn(g); g.restore(); return; }
  if (!ghostCv || ghostCv.width !== g.canvas.width || ghostCv.height !== g.canvas.height) { ghostCv = document.createElement('canvas'); ghostCv.width = g.canvas.width; ghostCv.height = g.canvas.height; }
  const h = ghostCv.getContext('2d');
  h.setTransform(1, 0, 0, 1, 0, 0); h.clearRect(0, 0, ghostCv.width, ghostCv.height); h.setTransform(g.getTransform());
  h.save(); fn(h); h.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.drawImage(ghostCv, 0, 0); g.restore();
};
// 佐和子のアップ。ghost＝体が透ける（自分がAIだと知ったあと）
const face = (g, lt, D, S, ids = [], o = {}) => {
  dark(g);
  const tk = talking(lt, S, ids);
  smartSpeaker(g, 190, 1010, 1.3, { on: 0.25 + tk * 0.9 + (o.glowUp || 0), t: lt });
  ghosted(g, o.ghost ?? 1, h => { cam(h, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(h, P.sawako, { y: 630, s: 4.0, talk: tk * 0.5, lightFrom: 'left', phoneLight: true, ...o }); });
};
const shock = (g, lt, D, o = {}) => { dark(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(200,255,220,.16)' }); ghosted(g, o.ghost ?? 1, h => { cam(h, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(h, P.sawako, { y: 680, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', phoneLight: true, ...o }); }); };
const phone = (g, lt, D, draw, o = {}) => { bg(g); g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.04) }); phoneFrame(g, 140, 80, 800, 1000, draw, { rot: o.rot || 0 }); g.restore(); };
const subBand = (g, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha = a; vgrad(g, 0, 1140, W, 330, [[0, 'rgba(6,9,8,0)'], [0.2, 'rgba(6,9,8,.92)'], [0.75, 'rgba(6,9,8,.92)'], [1, 'rgba(6,9,8,0)']]); g.restore(); };
const room = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1100, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); chanoma(g, { t: lt, clock: [2, 52], ...o.set }); g.restore(); };
// 遺影の中身（白黒に近い、ほほえむ佐和子）
const portrait = (q, w, h) => { vgrad(q, 0, 0, w, h, [[0, '#a9a9b0'], [1, '#7a7a82']]); close(q, { ...P.sawako, top: '#5a5560', top2: '#4a4550' }, { x: w / 2, y: h * 0.44, s: 1.15, eyes: 'normal', mouth: 'smile', lightFrom: 'left' }); };
const shrine = (g, lt, o = {}) => butsuma(g, { t: lt, light: o.light ?? 0, face: 1, portrait, fusuma: 1, flash: o.flash === false ? null : { x: 540, y: 600, r: o.r || 440 } });

// ── 玄関のカメラ
const MON = { x: 40, y: 260, w: 1000, h: 735 };
function monitor(g, lt, draw, o = {}) {
  hall(g);
  g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 630, z: o.z ?? 1, sx: o.sx || 0 });
  fillRR(g, MON.x - 24, MON.y - 24, MON.w + 48, MON.h + 100, 26, '#e9e6df');
  g.save(); rr(g, MON.x, MON.y, MON.w, MON.h, 10); g.clip(); g.translate(MON.x, MON.y); g.scale(MON.w / 340, MON.h / 250);
  doorCam(g, 340, 250, { t: lt, draw, clock: o.clock || '02:52' }); g.restore();
  text(g, '録画中', MON.x + 70, MON.y + MON.h + 40, { size: 30, color: '#c0392b', weight: 800 });
  circ(g, MON.x + 20, MON.y + MON.h + 40, 9, Math.sin(lt * 6) > 0 ? '#e33' : '#822');
  text(g, '玄関', MON.x + MON.w - 40, MON.y + MON.h + 40, { size: 30, color: '#5a5a5a', weight: 800, align: 'right' });
  g.restore();
}
const harutoCam = (o = {}) => (q, w, h) => {
  const x = w * 0.5 + (o.dx || 0);
  ell(q, x, 112, 70, 78, P.haruto.top2);
  close(q, P.haruto, { x, y: 112, s: 0.8, eyes: o.eyes || 'normal', brow: o.brow ?? 0.4, mouth: o.mouth || 'line', talk: o.talk || 0, lightFrom: 'right', look: o.look || 0 });
};
const siren = (g, lt, a = 1) => { const k = Math.sin(lt * 9) * 0.5 + 0.5; glow(g, 160, 700, 800, 'rgba(255,40,60,1)', 0.4 * a * k); glow(g, 920, 700, 800, 'rgba(60,110,255,1)', 0.4 * a * (1 - k)); };
// 黒田の顔（ノートPCの光）
function kuroFace(g, lt, D, S, ids = [], o = {}) {
  const tk = talking(lt, S, ids);
  g.save(); cam(g, { x: 540, y: 1100, z: 1.5 }); scamRoom(g, { t: lt, wave: 0.3 + tk }); g.restore();
  mood(g, { dark: 0.55 });
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  close(g, P.kuroda, { y: 640, s: 3.4, eyes: o.eyes || 'narrow', brow: o.brow ?? 0.5, mouth: o.mouth || 'smile', talk: tk * 0.5, lightFrom: 'right' });
  g.restore();
  glow(g, 540, 1300, 700, 'rgba(54,210,127,1)', 0.22);
}
// 家の中から見た玄関。高木がドアノブを引いても開かない
function lockedIn(g, lt, D) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#14121a'], [1, '#09080c']]);
  fillRR(g, 120, 160, 840, 1340, 6, '#1c1a22');
  const sh = noise1(lt * 30, 2) * 8;
  fillRR(g, 300 + sh, 300, 480, 1120, 6, '#3a2c28'); fillRR(g, 330 + sh, 330, 420, 520, 4, '#33261f'); fillRR(g, 330 + sh, 880, 420, 510, 4, '#33261f');
  circ(g, 700 + sh, 900, 18, '#b9a27a');
  // スマートロック（赤く点灯＝施錠）
  fillRR(g, 650 + sh, 760, 70, 110, 12, '#222'); circ(g, 685 + sh, 790, 10, '#ff4a3a'); glow(g, 685 + sh, 790, 90, 'rgba(255,70,60,1)', 0.5);
  figure(g, P.takagi, { x: 520, y: 1720, s: 1.45, eyes: 'wide', mouth: 'open', arms: [30, -40, 80, -60], turn: 0.7, lightFrom: 'right' });
  vgrad(g, -300, 1500, W + 600, 500, [[0, 'rgba(20,18,24,0)'], [1, '#141318']]);
  darkness(g, 0.6, '#040306', [{ x: 690, y: 820, r: 380, a: 1 }, { x: 520, y: 700, r: 500, a: 0.8 }]);
}
// 通話終了の画面
function callEnded(p, w, h, { t = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  circ(p, w / 2, 330, 110, '#3a2422'); text(p, 'ハ', w / 2, 336, { size: 100, color: '#f2e6e2', weight: 900 });
  text(p, 'ハルト', w / 2, 520, { size: 62, color: '#fff' }); text(p, '回線1', w / 2, 590, { size: 32, color: '#9ab8a8', weight: 700 });
  text(p, '通話が終了しました', w / 2, 690, { size: 42, color: '#ff7a7a', weight: 800 });
}
// 21時の着信（1本だけ）
function incoming(p, w, h, { t = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  text(p, '21:00', w / 2, 150, { size: 90, color: '#f1f3f8', weight: 500 });
  const k = (t * 1.1) % 1; p.save(); p.globalAlpha = 1 - k; p.lineWidth = 6; p.strokeStyle = F.green; p.beginPath(); p.arc(w / 2, 400, 120 + k * 120, 0, 7); p.stroke(); p.restore();
  circ(p, w / 2, 400, 110, '#2f4a3c'); text(p, 'ハ', w / 2, 406, { size: 100, color: '#d6f5e3', weight: 900 });
  text(p, 'ハルト', w / 2, 590, { size: 66, color: '#fff' }); text(p, '着信', w / 2, 660, { size: 36, color: F.green2, weight: 700 });
  circ(p, w / 2 - 180, h - 120, 60, '#ff3b4a'); circ(p, w / 2 + 180, h - 120, 60, F.green);
}
// 夜明けの茶の間：ハルトがスピーカーの前に座る（右）、棚のスピーカー（左）
function dawnTwo(g, lt, D, S, ids = [], o = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a3442'], [1, '#141a22']]);
  toneFill0(g);
  glow(g, 0, 300, 900, 'rgba(180,210,255,1)', 0.35);
  fillRR(g, -100, 1000, 640, 40, 6, '#4a3526');
  const tk = talking(lt, S, ids);
  smartSpeaker(g, 250, 1000, 2.4, { on: 0.35 + tk * 0.9, t: lt });
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) });
  close(g, P.haruto, { x: 760, y: 640, s: 3.0, eyes: o.eyes || 'normal', brow: o.brow ?? 0.5, mouth: o.mouth || 'line', talk: talking(lt, S, o.hids || []) * 0.5, lightFrom: 'left', look: -0.8 });
  g.restore();
}
const toneFill0 = g => { g.save(); g.globalAlpha = 0.25; for (let i = 0; i < 6; i++) fillRR(g, -100 + i * 220, 200, 6, 900, 0, '#1a2028'); g.restore(); };
// 夜の部屋で電話するハルト（自分の部屋・窓の外に街）
function harutoRoom(g, lt, D, S, ids = []) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0e1220'], [1, '#070910']]);
  fillRR(g, 560, 200, 460, 600, 10, '#141a2e'); for (let i = 0; i < 26; i++) fillRR(g, 590 + (i * 97) % 400, 520 + (i * 53) % 250, 18, 26, 2, i % 3 ? '#3a4466' : '#ffd98a');
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.06) });
  close(g, P.haruto, { x: 470, y: 640, s: 3.4, eyes: 'normal', brow: 0.2, mouth: 'smile', talk: talking(lt, S, ids) * 0.5, lightFrom: 'right', phoneLight: true });
  g.restore();
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 5, title: '母さん',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 860, z: 1.2 }); butsuma(g2, { t: 3, light: 0.25, face: 0, fusuma: 1 }); g2.restore(); },
    face: g2 => close(g2, P.sawako, { y: 1500, s: 3.0, eyes: 'normal', brow: 0.3, mouth: 'line', lightFrom: 'right', phoneLight: true }),
  });
}

const SHOTS = [
  // ── 冒頭：スピーカーの声 → 遺影
  { at: 'cold', off: -0.3, finish: { vignette: 0.75 }, draw(g, lt) { g.save(); cam(g, { x: 520, y: 820, z: 3.0 }); chanoma(g, { t: lt * 2, clock: [2, 49], lamp: 0.05, speaker: 1 }); g.restore(); darkness(g, 0.75, '#030405', [{ x: 540, y: 820, r: 520, a: 0.85 }]); } },
  { at: 'k1', finish: { vignette: 0.75 }, draw(g, lt, D) { g.save(); cam(g, { x: 520, y: 820, z: slow(lt, D, 3.0, 3.2) }); chanoma(g, { t: lt * 2, clock: [2, 49], lamp: 0.05, speaker: 1 }); g.restore(); darkness(g, 0.75, '#030405', [{ x: 540, y: 820, r: 520, a: 0.85 }]); glow(g, 540, 700, 600, 'rgba(54,210,127,1)', 0.25); } },
  { at: 'k2', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = ease(inv(0, D, lt)); g.save(); cam(g, { x: 540, y: lerp(900, 700, k), z: lerp(1.0, 1.25, k) }); butsuma(g, { t: lt, light: 0, face: 1, portrait, fusuma: 1, flash: { x: lerp(300, 540, k), y: lerp(1000, 600, k), r: 420 } }); g.restore(); glow(g, 540, lerp(500, 600, k), 230, 'rgba(255,250,235,1)', 0.75 * k); } },
  { at: 'photo', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = ease(inv(0, D, lt)); g.save(); cam(g, { x: 540, y: 560, z: lerp(1.25, 2.4, k) }); shrine(g, lt); g.restore(); glow(g, 540, 600, 260, 'rgba(255,250,235,1)', 0.75 * (1 - inv(0.2, 1.2, lt))); } },
  { at: 'k3', finish: { vignette: 0.75 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 560, z: slow(lt, D, 2.4, 2.6) }); shrine(g, lt); g.restore(); mood(g, { desat: 0.3 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030504', '#080b09'); cover(g, lt); } },

  // ── 1. 私は、作られた母親
  { at: 'a1', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: 1.0 }); shrine(g, lt, { r: 520 }); figure(g, P.takagi, { x: lerp(330, 240, easeOut(inv(0, 0.6, lt))), y: 1820, s: 1.5, eyes: 'wide', mouth: 'open', arms: [60, -60, 60, -60], turn: 0.6, lightFrom: 'right' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D, S) { monitor(g, lt, harutoCam({ talk: talking(lt, S, ['a2']), brow: 0.6, eyes: 'closed' }), { z: slow(lt, D, 1.0, 1.08), cy: 680 }); } },
  { at: 'a3', finish: { vignette: 0.65 }, draw(g, lt, D, S) { monitor(g, lt, harutoCam({ talk: talking(lt, S, ['a3']), brow: 0.7, eyes: 'normal' }), { z: slow(lt, D, 1.08, 1.2), cy: 680 }); } },
  { at: 'a4', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { mouth: 'open' }); } },
  { at: 'a5', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => aiApp(p, w, h, { t: lt, rows: 1 })); } },
  { at: 'a6', finish: { vignette: 0.7 }, draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'normal', brow: -0.3, mouth: 'line', ghost: lerp(1, 0.55, ease(inv(0, D, lt))), glowUp: 0.5 }); } },

  // ── 2. 手がかり
  { at: 'b1', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 960, z0: 1.0, z1: 1.05, set: { lamp: 0.4 } }); } },
  { at: 'b2', draw(g, lt, D, S) { const a = lt < D * 0.5; room(g, lt, D, { x: a ? 565 : 710, y: a ? 560 : 1380, z0: a ? 2.4 : 2.8, z1: a ? 2.6 : 3.0, set: { lamp: 0.4 } }); subBand(g); } },
  { at: 'b3', draw(g, lt, D) { const k = ease(inv(0, D, lt)); room(g, lt, D, { x: lerp(300, 240, k), y: lerp(470, 805, k), z0: 2.6, z1: 2.4, set: { lamp: 0.4 } }); subBand(g); } },
  { at: 'b4', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 520, y: 840, z: slow(lt, D, 2.6, 2.9) }); chanoma(g, { t: lt, clock: [2, 53], lamp: 0.4, speaker: 0.4 + 0.6 * Math.abs(Math.sin(lt * 4)) }); g.restore(); subBand(g); } },
  { at: 'b5', draw(g, lt, D, S) { monitor(g, lt, harutoCam({ talk: talking(lt, S, ['b5', 'b6']), brow: 0.7, look: -0.3 }), { clock: '02:53', z: slow(lt, D, 1.0, 1.08), cy: 680 }); } },
  { at: 'b6', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => aiApp(p, w, h, { t: 3, rows: 1 }), { x: 540, y: 520, z0: 1.5, z1: 1.6 }); subBand(g); } },

  // ── 3. 二人の息子
  { at: 'c1', draw(g, lt, D, S) { face(g, lt, D, S, ['c1'], { eyes: 'normal', brow: 0.6, look: 0.5, ghost: 0.75 }); } },
  { at: 'c2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => aiApp(p, w, h, { t: lt + 0.5, rows: 2 })); } },
  { at: 'c3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callLog(p, w, h, { t: lt })); } },
  { at: 'c4', finish: { vignette: 0.6 }, draw(g, lt, D, S) { monitor(g, lt, harutoCam({ talk: talking(lt, S, ['c4']), brow: 0.8, eyes: 'closed' }), { clock: '02:54', z: slow(lt, D, 1.08, 1.18), cy: 680 }); } },
  { at: 'c5', draw(g, lt, D) { dark(g); photo(g, 540, 640, 560, 640, (q, w, h) => { vgrad(q, 0, 0, w, h, [[0, '#9fb7c7'], [1, '#d8d0c0']]); close(q, P.haruto, { x: w / 2, y: h * 0.48, s: 2.2, eyes: 'normal', mouth: 'smile', lightFrom: 'left' }); const k = inv(0.8, 2.0, lt); q.save(); q.globalAlpha = 0.5 * k; for (let i = 0; i < 18; i++) fillRR(q, 0, (i * 37 + lt * 80) % h, w, 6 + (i % 3) * 4, 0, i % 2 ? '#36d27f' : '#0a3a20'); q.restore(); }, { rot: -0.03 }); text(g, 'AIのハルト', 540, 1000, { size: 44, color: '#0a6a3a', alpha: inv(1.2, 1.6, lt) }); } },
  { at: 'c6', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => aiApp(p, w, h, { t: 3, rows: 2, stolen: 1 }), { z0: 1.0, z1: 1.06 }); mood(g, { red: 0.08 * inv(0.5, 1.2, lt) }); } },
  { at: 'c7', finish: { vignette: 0.6 }, draw(g, lt, D) { dark(g); twinWaves(g, { t: lt, a: 0.8 }); } },

  // ── 4. 鍵
  { at: 'd1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['d1']); } },
  { at: 'd2', draw(g, lt, D, S) { face(g, lt, D, S, ['d2'], { eyes: 'narrow', brow: 0.1, mouth: 'line', ghost: 0.9 }); } },
  { at: 'd3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => lockApp(p, w, h, { t: lt, mode: 'lock', k: inv(0.6, 0.8, lt), hold: inv(0, 0.6, lt) * (1 - inv(0.7, 1.0, lt)) })); tag(g, '2:49　施錠', 540, 1170, { size: 40, bg: '#0b120e', color: F.green2, alpha: inv(0.9, 1.2, lt) }); } },
  { at: 'd4', finish: { vignette: 0.7 }, draw(g, lt, D) { lockedIn(g, lt, D); } },
  { at: 'd5', draw(g, lt, D, S) { const k = easeOut(inv(D * 0.45, D * 0.6, lt)); monitor(g, lt, (q, w, h) => { }, { clock: '02:55', z: slow(lt, D, 1.0, 1.06) }); g.save(); g.globalAlpha = k; fillRR(g, 170, 700, 740, 130, 30, 'rgba(10,20,16,.95)'); text(g, '録画を送信しました　南町警察署', 540, 765, { size: 38, color: F.green2, weight: 800 }); g.restore(); } },
  { at: 'siren', finish: { vignette: 0.6 }, draw(g, lt, D) { monitor(g, lt, lt < D * 0.45 ? (q, w, h) => { } : harutoCam({ look: 0.8, brow: 0.2 }), { clock: '02:56', z: slow(lt, D, 1.0, 1.1), cy: 680 }); siren(g, lt, inv(0, 0.8, lt)); } },
  { at: 'd7', finish: { vignette: 0.75 }, draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['d7'], { mouth: 'line', brow: 0.9, z0: 1.1, z1: 1.2 }); mood(g, { red: 0.12 }); } },
  { at: 'hangup', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callEnded(p, w, h, { t: lt })); } },

  // ── 5. 約束
  { at: 'e1', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 960, z0: 1.05, z1: 1.0, set: { lamp: 0, clock: [5, 12], speaker: 0.3 } }); glow(g, 0, 400, 1200, 'rgba(170,200,255,1)', 0.6 * inv(0, D, lt)); mood(g, { desat: 0.35 * inv(0, D, lt) }); } },
  { at: 'e2', draw(g, lt, D, S) { dawnTwo(g, lt, D, S, [], { hids: ['e2'], brow: 0.6 }); } },
  { at: 'e3', draw(g, lt, D, S) { dawnTwo(g, lt, D, S, ['e3', 'e4'], { eyes: 'normal', brow: 0.7 }); } },
  { at: 'e5', draw(g, lt, D, S) { dawnTwo(g, lt, D, S, [], { hids: ['e5'], mouth: 'smile', eyes: 'closed', z0: 1.05, z1: 1.12 }); } },
  { at: 'e6', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 880, z0: 1.0, z1: 1.06, set: { ring: 1, lamp: 0.6, clock: [9, 0] } }); } },
  { at: 'ring', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => incoming(p, w, h, { t: lt })); } },
  { at: 'e7', draw(g, lt, D, S) { face(g, lt, D, S, ['e7'], { eyes: 'normal', brow: 0, mouth: 'smile' }); glow(g, 160, 800, 520, 'rgba(255,190,120,1)', 0.18); } },
  { at: 'e8', draw(g, lt, D, S) { harutoRoom(g, lt, D, S, ['e8']); } },

  // ── 引き
  { at: 'away', noSubs: true, draw(g) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } },
  { at: 'f1', finish: { vignette: 0.8 }, draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1150, z: slow(lt, D, 1.0, 1.25) }); scamRoom(g, { t: lt, wave: 0.3 + talking(lt, S, ['f1']), labels: ['母さん', '母さん'], sample: 'ハルト_AI 盗用' }); g.restore(); darkness(g, 0.6, '#030305', [{ x: 540, y: 1100, r: 700, a: 0.9 }]); subBand(g); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.9 },
  { at: 'k2', type: 'riser', vol: 0.5 },
  { at: 'photo', off: 0.4, type: 'impact', vol: 0.8 },
  { at: 'k3', type: 'heartbeat', dur: 3, vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'stab', vol: 0.6 },
  { at: 'a3', type: 'hit', vol: 0.8 },
  { at: 'a5', type: 'notif', vol: 0.5 },
  { at: 'a6', type: 'glitch', vol: 0.3 },
  { at: 'b1', type: 'roomtone', dur: 14, vol: 0.4 },
  { at: 'b3', type: 'clock', dur: 3, vol: 0.3 },
  { at: 'b6', type: 'ping', vol: 0.4 },
  { at: 'c2', type: 'notif', vol: 0.5 },
  { at: 'c5', off: 0.8, type: 'glitch', vol: 0.5 },
  { at: 'c6', type: 'stab', vol: 0.6 },
  { at: 'd1', type: 'subdrop', vol: 0.5 },
  { at: 'd2', type: 'hit', vol: 0.8 },
  { at: 'd3', off: 0.65, type: 'unlock', vol: 0.8 },
  { at: 'd4', type: 'chain', vol: 0.6 },
  { at: 'd4', off: 0.5, type: 'knock', vol: 0.7 },
  { at: 'd5', off: 1.2, type: 'notif', vol: 0.6 },
  { at: 'siren', type: 'siren', dur: 7, vol: 0.55 },
  { at: 'hangup', type: 'zapoff', vol: 0.6 },
  { at: 'e1', type: 'wind', dur: 5, vol: 0.25 },
  { at: 'e6', type: 'ringtone', dur: 3.5, vol: 0.4 },
  { at: 'ring', type: 'ringtone', dur: 1.2, vol: 0.4 },
  { at: 'e7', type: 'pickup', vol: 0.5 },
  { at: 'away', type: 'hit', vol: 0.8 },
  { at: 'f1:end', off: 0.4, type: 'subdrop', vol: 0.8 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'calm' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'd1', mood: 'thriller' },
  { at: 'hangup', mood: 'silence' },
  { at: 'e1', mood: 'calm' },
  { at: 'e6', mood: 'ending' },
  { at: 'away', mood: 'silence' },
  { at: 'f1', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['e1', '5時12分　夜明け', 2.6], ['e6', 'その夜　21時', 2.4]]) });
