// 二人の息子 第3話「三人目」— 映像・効果音・BGM
// 手がかり（最終話で回収）：佐和子はインターホン越しにしか話さない／スピーカーは声に出して話すときだけ強く光る
//   ／「玄関までほんの10歩」の場面の茶の間に人の姿がない／黒田は暗がりで顔を見せない（第4話で顔が出る）
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag, darkness } from '../../engine/core.js';
import { close, figure, mood, speedLines, sfxText } from '../../engine/noir.js';
import { phoneFrame } from '../../engine/sns.js';
import { F, chanoma, twoLines, doorCam, smartSpeaker, scamRoom, lockApp } from '../../engine/futarisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep03.script.js';

const dark = g => bg(g, '#141a17', '#090d0b');
const hall = g => bg(g, '#1c1814', '#0e0c0a');
// 佐和子のアップ。後ろの棚にスピーカー（声に出して話すときだけ強く光る）
const face = (g, lt, D, S, ids = [], o = {}) => {
  dark(g);
  const tk = talking(lt, S, ids);
  smartSpeaker(g, 190, 1010, 1.3, { on: 0.25 + tk * 0.9, t: lt });
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  close(g, P.sawako, { y: 630, s: 4.0, talk: tk * 0.5, lightFrom: 'left', phoneLight: true, ...o });
  g.restore();
};
const shock = (g, lt, D, o = {}) => { dark(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(200,255,220,.16)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.sawako, { y: 680, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', phoneLight: true, ...o }); g.restore(); };
const phone = (g, lt, D, draw, o = {}) => { bg(g); g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.04) }); phoneFrame(g, 140, 80, 800, 1000, draw, { rot: o.rot || 0 }); g.restore(); };
const subBand = (g, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha = a; vgrad(g, 0, 1140, W, 330, [[0, 'rgba(6,9,8,0)'], [0.2, 'rgba(6,9,8,.92)'], [0.75, 'rgba(6,9,8,.92)'], [1, 'rgba(6,9,8,0)']]); g.restore(); };

// ── 玄関のカメラに映る人（第2話と同じ）
const officer = (q, w, h, o = {}) => figure(q, P.takagi, { x: o.x ?? w * 0.5, y: h * 1.4, s: 0.55, eyes: o.eyes || 'narrow', mouth: o.mouth || 'line', talk: o.talk || 0, arms: o.arms || [10, 0, 60, -110], turn: o.turn || 0 });
function hooded(q, x, y, s, o = {}) {
  const P2 = { ...P.haruto }, k = o.lift || 0;
  const f = figure(q, P2, { x, y, s, eyes: k > 0.5 ? 'normal' : 'closed', mouth: o.mouth || 'line', talk: o.talk || 0, turn: o.turn ?? -0.15, arms: [8, 0, 8, 0], lightFrom: 'right' });
  const r = 44 * s * (P2.tall || 1), hx = x + (o.turn ?? -0.15) * 6 * s, hy = f.headY;
  q.save(); q.beginPath(); q.ellipse(hx, hy - r * 0.05, r * 1.25, r * 1.38, 0, 0, 7); q.ellipse(hx, hy + r * 0.2, r * 0.82, r * 0.98, 0, 0, 7); q.fillStyle = P2.top2; q.fill('evenodd'); q.restore();
  q.save(); q.beginPath(); q.ellipse(hx, hy + r * 0.2, r * 0.83, r * 0.99, 0, 0, 7); q.clip();
  const sh = lerp(0.42, 0.05, k); const gr = q.createLinearGradient(0, hy - r * 0.9, 0, hy + r * sh * 2.2 + r * 0.2);
  gr.addColorStop(0, `rgba(4,6,8,${0.96 * (1 - k)})`); gr.addColorStop(0.8, `rgba(4,6,8,${0.88 * (1 - k)})`); gr.addColorStop(1, 'rgba(4,6,8,0)');
  q.fillStyle = gr; q.fillRect(hx - r * 1.2, hy - r * 1.2, r * 2.4, r * (1.2 + sh * 2.2 + 0.2)); q.restore();
  return f;
}
// 玄関の2人（高木が左、フードのハルトが右）
const pair = (o = {}) => (q, w, h) => { officer(q, w, h, { x: w * 0.32, arms: o.arms || [8, 0, 40, -30], mouth: o.mouth, talk: o.otalk || 0 }); hooded(q, w * 0.68, h * 1.42, 0.52, { lift: o.lift || 0, talk: o.htalk || 0 }); };
// フードを下ろしたハルトの顔（インターホンの寄り）
const harutoCam = (o = {}) => (q, w, h) => {
  const x = w * 0.5 + (o.dx || 0);
  ell(q, x, 112, 70, 78, P.haruto.top2);
  close(q, P.haruto, { x, y: 112, s: 0.8, eyes: o.eyes || 'normal', brow: o.brow ?? 0.4, mouth: o.mouth || 'line', talk: o.talk || 0, lightFrom: 'right', look: o.look || 0 });
  if (o.hand) { // 高木の手（肩をつかむ／口をふさぐ）
    const hy = o.hand === 'mouth' ? 150 : 215, hx = o.hand === 'mouth' ? x + 6 : x - 70;
    line(q, -20, 250, hx - 30, hy + 10, 30, P.takagi.top2); ell(q, hx, hy, 34, 22, '#e8cdb4');
  }
};
// 玄関カメラを画面いっぱいのモニターで（y 260〜1000）
const MON = { x: 40, y: 260, w: 1000, h: 735 };
function monitor(g, lt, draw, o = {}) {
  hall(g);
  g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 630, z: o.z ?? 1, sx: o.sx || 0 });
  fillRR(g, MON.x - 24, MON.y - 24, MON.w + 48, MON.h + 100, 26, '#e9e6df');
  g.save(); rr(g, MON.x, MON.y, MON.w, MON.h, 10); g.clip(); g.translate(MON.x, MON.y); g.scale(MON.w / 340, MON.h / 250);
  doorCam(g, 340, 250, { t: lt, draw, clock: o.clock || '02:38' }); g.restore();
  text(g, '録画中', MON.x + 70, MON.y + MON.h + 40, { size: 30, color: '#c0392b', weight: 800 });
  circ(g, MON.x + 20, MON.y + MON.h + 40, 9, Math.sin(lt * 6) > 0 ? '#e33' : '#822');
  text(g, '玄関', MON.x + MON.w - 40, MON.y + MON.h + 40, { size: 30, color: '#5a5a5a', weight: 800, align: 'right' });
  g.restore();
}
// ハルトが3人（回線1・回線2・玄関）。hi＝光らせる札（2＝回線2と玄関を線で結ぶ）
function threeHaruto(g, lt, { link = 0 } = {}) {
  dark(g);
  const lab = [['回線1', F.green2], ['回線2', F.green2], ['玄関', '#ff7a6a']];
  lab.forEach(([s, col], i) => {
    const k = easeOut(inv(i * 0.25, i * 0.25 + 0.35, lt)), x = 200 + i * 340, y = 700 + (1 - k) * 60;
    g.save(); g.globalAlpha = k; fillRR(g, x - 150, y - 260, 300, 520, 34, i === 2 ? 'rgba(60,14,12,.9)' : 'rgba(14,34,26,.9)');
    g.lineWidth = 5; g.strokeStyle = i === 2 ? '#ff5a4f' : F.green; rr(g, x - 150, y - 260, 300, 520, 34); g.stroke();
    circ(g, x, y - 90, 80, i === 2 ? '#4a2422' : '#2f4a3c'); text(g, i === 2 ? '？' : 'ハ', x, y - 86, { size: 76, color: '#f2e6e2', weight: 900 });
    text(g, 'ハルト', x, y + 60, { size: 54, color: '#fff' }); text(g, s, x, y + 130, { size: 34, color: col, weight: 800 });
    g.restore();
  });
  if (link > 0) { g.save(); g.globalAlpha = link; g.lineWidth = 10; g.strokeStyle = '#ffd451'; g.setLineDash([24, 16]); g.beginPath(); g.moveTo(540, 430); g.quadraticCurveTo(710, 300, 880, 430); g.stroke(); g.restore(); text(g, '同じ人？', 710, 290, { size: 44, color: '#ffd451', alpha: link }); }
}
// 声の波形が、ハルト（緑）から知らない男（赤）に変わる。k＝0..1
function voiceMorph(g, lt, k, { label = true } = {}) {
  dark(g);
  const col = k < 0.5 ? F.green : '#ff5a4f';
  fillRR(g, 70, 380, 940, 620, 34, 'rgba(10,16,14,.9)'); g.lineWidth = 4; g.strokeStyle = rgba(col, 0.6); rr(g, 70, 380, 940, 620, 34); g.stroke();
  const gl = k > 0.05 && k < 0.95 ? noise1(lt * 40, 2) * 18 : 0;
  text(g, '回線1', 130, 450, { size: 36, color: '#9ab8a8', align: 'left', weight: 800 });
  if (label) text(g, k < 0.5 ? 'ハルト' : '知らない男', 540 + gl, 540, { size: 74, color: k < 0.5 ? '#fff' : '#ff7a6a', weight: 900 });
  g.save(); g.lineWidth = 7; g.strokeStyle = col; g.beginPath();
  for (let i = 0; i <= 160; i++) {
    const x = 110 + i * 5.4, hi = Math.sin(i * 0.5 + lt * 8) * noise1(i * 0.2 + lt * 2, 4) * 120, lo = Math.sin(i * 0.18 + lt * 4) * noise1(i * 0.1 + lt, 9) * 150;
    const v = lerp(hi, lo, k) + (k > 0.05 && k < 0.95 ? noise1(i * 3 + lt * 50, 1) * 60 : 0);
    i ? g.lineTo(x, 800 + v + gl) : g.moveTo(x, 800 + v + gl);
  }
  g.stroke(); g.restore();
  glow(g, 540, 780, 520, k < 0.5 ? 'rgba(54,210,127,1)' : 'rgba(255,70,60,1)', 0.2);
}
// 詐欺グループの部屋。黒田は暗がりで、顔は見えない（ノートPCの光だけ）
const KUROSIL = { ...P.kuroda, top: '#0a0b0e', top2: '#08090b' };
function kuroRoom(g, lt, D, S, ids = [], o = {}) {
  const tk = talking(lt, S, ids);
  g.save(); cam(g, { x: 540, y: o.cy ?? 1000, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.08) });
  scamRoom(g, { t: lt, wave: 0.3 + tk, back: q => {
    const f = figure(q, KUROSIL, { x: 540, y: 1600, s: 1.8, eyes: 'narrow', mouth: o.mouth || 'line', talk: tk * 0.6, arms: [20, -40, 20, -40], lightFrom: 'left' });
    // 顔の上半分は影（ノートPCの光が下から当たるだけ）
    const r = 44 * 1.8 * 1.06; q.save(); q.beginPath(); q.ellipse(540, f.headY, r * 1.0, r * 1.15, 0, 0, 7); q.clip();
    const gr = q.createLinearGradient(0, f.headY - r * 1.2, 0, f.headY + r * 1.1); gr.addColorStop(0, 'rgba(2,2,4,.97)'); gr.addColorStop(0.55, 'rgba(2,2,4,.82)'); gr.addColorStop(1, 'rgba(2,2,4,.35)');
    q.fillStyle = gr; q.fillRect(540 - r * 1.2, f.headY - r * 1.3, r * 2.4, r * 2.6); q.restore();
  } });
  g.restore();
  darkness(g, 0.78, '#030305', [{ x: 540, y: 1100, r: 620, a: 0.9 }, { x: 540, y: 640, r: 420, a: 0.45 }, { x: 180, y: 1300, r: 200, a: 0.7 }, { x: 900, y: 1300, r: 200, a: 0.7 }]);
  subBand(g, 1);
}
const room = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1100, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); chanoma(g, { t: lt, clock: [2, 41], ...o.set }); g.restore(); };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 3, title: '三人目',
    back: g2 => monitor(g2, 3, pair({ lift: 0.2 }), { cy: 760, z: 1.15 }),
    face: g2 => close(g2, P.sawako, { y: 1500, s: 3.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', phoneLight: true, look: 0.6 }),
  });
}

const SHOTS = [
  // ── 冒頭：玄関のフードの男（1フレーム目から）
  { at: 'cold', off: -0.3, finish: { vignette: 0.7 }, draw(g, lt) { monitor(g, lt, pair({ lift: 0.3 }), { z: 1.9, cx: 720, cy: 500 }); } },
  { at: 'k1', finish: { vignette: 0.75 }, draw(g, lt, D, S) { monitor(g, lt, pair({ lift: 0.3 + 0.05 * inv(0, D, lt), htalk: talking(lt, S, ['k1']) }), { z: slow(lt, D, 1.9, 2.1), cx: 720, cy: 500, sx: noise1(lt * 20, 2) * 3 }); } },
  { at: 'k2', finish: { vignette: 0.7 }, draw(g, lt) { threeHaruto(g, lt); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030504', '#080b09'); cover(g, lt); } },

  // ── 1. 回線2の向こうの音
  { at: 'a1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 260, sec2: 210, label2: '「開けちゃダメだ」' })); } },
  { at: 'a2', draw(g, lt, D, S) { face(g, lt, D, S, ['a2'], { eyes: 'normal', brow: 0.4, look: 0.5 }); } },
  { at: 'silence', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 266, sec2: 216, flat: 1 }), { z0: 1.0, z1: 1.06 }); } },
  { at: 'a3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 268, sec2: 218, flat: 1 }), { x: 540, y: 900, z0: 1.3, z1: 1.45 }); subBand(g); } },
  { at: 'a4', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.3, mouth: 'line', look: -0.6 }); } },
  { at: 'chime', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 275, sec2: 225, flat: 1 }), { x: 540, y: 820, z0: 1.45, z1: 1.5 }); for (let i = 0; i < 3; i++) { const k = ((lt * 1.2 + i / 3) % 1); g.save(); g.globalAlpha = (1 - k) * 0.7; g.lineWidth = 8; g.strokeStyle = '#ffd451'; g.beginPath(); g.arc(700, 760, 120 + k * 320, 0, 7); g.stroke(); g.restore(); } sfxText(g, 'ピンポーン', 540, 1480, { size: 110, color: '#ffd451', alpha: inv(0, 0.15, lt), rot: -0.06 }); } },
  { at: 'a5', finish: { vignette: 0.6 }, draw(g, lt, D) { monitor(g, lt, pair({}), { clock: '02:38', z: slow(lt, D, 1.0, 1.1) }); tag(g, 'ピンポーン', 540, 170, { size: 44, bg: '#2a220a', color: '#ffd451', alpha: inv(0.1, 0.4, lt) }); } },
  { at: 'a6', finish: { vignette: 0.65 }, draw(g, lt, D) { threeHaruto(g, lt + 2, { link: easeOut(inv(0.6, 1.4, lt)) }); } },

  // ── 2. フードの下の顔
  { at: 'b1', draw(g, lt, D, S) { face(g, lt, D, S, ['b1'], { eyes: 'normal', brow: 0.5, look: 0.6 }); } },
  { at: 'b2', draw(g, lt, D, S) { monitor(g, lt, pair({ arms: [8, 0, 70, -60], otalk: talking(lt, S, ['b2']), mouth: 'smile' }), { clock: '02:39', z: slow(lt, D, 1.0, 1.3), cx: 620, cy: 560 }); } },
  { at: 'hood', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = easeOut(inv(0.1, 0.9, lt)); monitor(g, lt, pair({ arms: [8, 0, 90, -80], lift: k }), { clock: '02:39', z: lerp(1.3, 1.9, k), cx: lerp(620, 720, k), cy: lerp(560, 500, k) }); } },
  { at: 'b3', finish: { vignette: 0.65 }, draw(g, lt, D) { monitor(g, lt, harutoCam({ eyes: 'normal', brow: 0.5 }), { clock: '02:39', z: slow(lt, D, 1.0, 1.08), cy: 680 }); tag(g, '宮下ハルト（29）', 540, 170, { size: 44, bg: '#0b120e', color: F.green2, alpha: inv(0.4, 0.8, lt) }); } },
  { at: 'b4', draw(g, lt, D, S) { monitor(g, lt, harutoCam({ talk: talking(lt, S, ['b4']), brow: 0.6, look: -0.3 }), { clock: '02:39', z: slow(lt, D, 1.08, 1.16), cy: 670 }); } },
  { at: 'b5', draw(g, lt, D, S) { monitor(g, lt, harutoCam({ talk: talking(lt, S, ['b5']), brow: 0.5 }), { clock: '02:40', z: slow(lt, D, 1.16, 1.24), cy: 660 }); } },
  { at: 'b5b', draw(g, lt, D, S) { face(g, lt, D, S, ['b5b'], { eyes: 'wide', brow: 0.6, look: 0.6 }); } },
  { at: 'b5c', draw(g, lt, D, S) { monitor(g, lt, harutoCam({ talk: talking(lt, S, ['b5c']), brow: 0.3, eyes: 'normal' }), { clock: '02:40', z: slow(lt, D, 1.24, 1.32), cy: 640 }); } },
  { at: 'b6', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 330, sec2: 280, label1: '泣いているハルト' }), { z1: 1.08 }); mood(g, { red: 0.08 * inv(0.5, D, lt) }); } },

  // ── 3. 声が変わる
  { at: 'c1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 336, sec2: 286, label1: '「俺が本物なんだよ」' }), { z0: 1.08, z1: 1.14 }); } },
  { at: 'glitch', finish: { vignette: 0.6 }, draw(g, lt, D) { voiceMorph(g, lt, inv(0.1, D, lt)); } },
  { at: 'c2', draw(g, lt, D) { voiceMorph(g, lt, 1); } },
  { at: 'c3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { kuroRoom(g, lt, D, S, ['c3']); } },
  { at: 'c4', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { mouth: 'open' }); mood(g, { red: 0.1 }); } },
  { at: 'c5', finish: { vignette: 0.7 }, draw(g, lt, D, S) { kuroRoom(g, lt, D, S, ['c5'], { mouth: 'smile', z0: 1.08, z1: 1.16, cy: 980 }); tag(g, '黒田', 540, 170, { size: 46, bg: '#2a0c0c', color: '#ff7a6a', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'c6', draw(g, lt, D) { bg(g, '#0b0d12', '#05060a'); g.save(); cam(g, { x: 540, y: 1040, z: slow(lt, D, 1.7, 1.85) }); scamRoom(g, { t: lt, wave: 1 }); g.restore(); subBand(g); } },

  // ── 4. 本当の狙い
  { at: 'c7', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.6, mouth: 'line', look: -0.5 }); } },
  { at: 'd1', draw(g, lt, D, S) { monitor(g, lt, pair({ arms: [8, 0, 70, -40], lift: 1 }), { clock: '02:40', z: slow(lt, D, 1.0, 1.15) }); } },
  { at: 'd2', finish: { vignette: 0.65 }, draw(g, lt, D) { monitor(g, lt, harutoCam({ hand: 'shoulder', eyes: 'closed', brow: 0.8, mouth: 'line' }), { clock: '02:40', z: slow(lt, D, 1.0, 1.1), cy: 670, sx: noise1(lt * 18, 4) * 4 }); mood(g, { red: 0.08 }); } },
  { at: 'd3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => lockApp(p, w, h, { t: lt, k: 0 }), { z0: 1.0, z1: 1.06 }); } },
  { at: 'd3b', finish: { vignette: 0.7 }, draw(g, lt, D, S) { monitor(g, lt, harutoCam({ hand: 'shoulder', eyes: 'closed', brow: 0.8 }), { clock: '02:41', z: slow(lt, D, 1.1, 1.2), cy: 660 }); mood(g, { red: 0.12 * inv(0, D, lt) }); } },
  { at: 'd4', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.5, mouth: 'line', look: 0.4 }); } },
  { at: 'd5', finish: { vignette: 0.7 }, draw(g, lt, D, S) { monitor(g, lt, harutoCam({ hand: 'shoulder', mouth: 'open', talk: talking(lt, S, ['d5']), brow: 0.7 }), { clock: '02:41', z: slow(lt, D, 1.1, 1.25), cy: 670, sx: noise1(lt * 25, 3) * 5 }); } },
  { at: 'cut', finish: { vignette: 0.75 }, draw(g, lt) { monitor(g, lt, harutoCam({ hand: 'mouth', eyes: 'wide', brow: 0.8 }), { clock: '02:41', z: 1.25, cy: 670, sx: noise1(lt * 30, 5) * 10 * (1 - inv(0, 0.6, lt)) }); mood(g, { red: 0.12 }); } },
  { at: 'd6', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'normal', brow: 0.4, mouth: 'line', look: 0.6 }); } },

  // ── 5. 引き
  { at: 'e1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { kuroRoom(g, lt, D, S, ['e1'], { z0: 1.0, z1: 1.05 }); } },
  { at: 'e2', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 1000, z0: 1.0, z1: 1.08, set: { phone: 1, lamp: 0.35, speaker: 0.4 } }); } },
  { at: 'pause', draw(g, lt, D) { room(g, lt, D, { x: 560, y: 1100, z0: 1.08, z1: 1.14, set: { phone: 1, lamp: 0.3, speaker: 0.4 } }); mood(g, { dark: 0.15 }); } },
  { at: 'e3', finish: { vignette: 0.8 }, draw(g, lt, D, S) { kuroRoom(g, lt, D, S, ['e3'], { mouth: 'smile', z0: 1.7, z1: 1.95, cy: 600 }); mood(g, { red: 0.12 * inv(0, D, lt) }); } },
  { at: 'e4', finish: { vignette: 0.75 }, draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'wide', brow: -0.5, mouth: 'line', z0: 1.0, z1: 1.1 }); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.9 },
  { at: 'k2', type: 'impact', vol: 0.7 },
  { at: 'k3', type: 'heartbeat', dur: 3, vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 10, vol: 0.4 },
  { at: 'silence', type: 'heartbeat', dur: 1.4, vol: 0.4 },
  { at: 'chime', type: 'chime', vol: 0.5 },
  { at: 'a5', type: 'stab', vol: 0.7 },
  { at: 'a6', off: 0.6, type: 'hit', vol: 0.7 },
  { at: 'b2', type: 'rustle', vol: 0.5 },
  { at: 'hood', type: 'riser', vol: 0.6 },
  { at: 'b3', type: 'hit', vol: 0.85 },
  { at: 'glitch', type: 'glitch', vol: 0.7 },
  { at: 'c3', type: 'subdrop', vol: 0.6 },
  { at: 'c4', type: 'stab', vol: 0.7 },
  { at: 'd2', type: 'scrape', vol: 0.4 },
  { at: 'd3', type: 'tap3', vol: 0.4 },
  { at: 'd3:end', type: 'stab', vol: 0.5 },
  { at: 'cut', type: 'hit', vol: 0.8 },
  { at: 'e2', type: 'clock', dur: 2.6, vol: 0.4 },
  { at: 'e3', type: 'riser', vol: 0.6 },
  { at: 'e3:end', type: 'hit', vol: 0.85 },
  { at: 'e4:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'silence', mood: 'silence' },
  { at: 'a5', mood: 'tension' },
  { at: 'b1', mood: 'suspense' },
  { at: 'b3', mood: 'uneasy' },
  { at: 'glitch', mood: 'silence' },
  { at: 'c3', mood: 'thriller' },
  { at: 'd3', mood: 'tension' },
  { at: 'cut', mood: 'silence' },
  { at: 'd6', mood: 'uneasy' },
  { at: 'pause', mood: 'silence' },
  { at: 'e3', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a2', '2時38分　宮下家の茶の間', 2.6]]) });
