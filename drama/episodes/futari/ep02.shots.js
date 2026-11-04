// 二人の息子 第2話「警察官」— 映像・効果音・BGM
// 手がかり（最終話で回収）：佐和子は玄関に行かずインターホン越しに話す／スピーカーは声に出して話すときだけ強く光る
//   ／茶の間のカレンダーは2024年10月のまま（「先週？」で寄る）／湯のみに湯気がない
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, speedLines } from '../../engine/noir.js';
import { phoneFrame, intercom } from '../../engine/sns.js';
import { F, chanoma, twoLines, dialScreen, doorCam, smartSpeaker } from '../../engine/futarisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep02.script.js';

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
const phone = (g, lt, D, draw, o = {}) => { bg(g); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.04) }); phoneFrame(g, 140, 80, 800, 1000, draw, { rot: o.rot || 0 }); g.restore(); };
const room = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1100, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); chanoma(g, { t: lt, clock: [2, 33], ...o.set }); g.restore(); };
const subBand = (g, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha = a; vgrad(g, 0, 1140, W, 330, [[0, 'rgba(6,9,8,0)'], [0.2, 'rgba(6,9,8,.92)'], [0.75, 'rgba(6,9,8,.92)'], [1, 'rgba(6,9,8,0)']]); g.restore(); };

// ── 玄関のカメラに映る人
const officer = (q, w, h, o = {}) => figure(q, P.takagi, { x: o.x ?? w * 0.5, y: h * 1.4, s: 0.55, eyes: o.eyes || 'narrow', mouth: o.mouth || 'line', talk: o.talk || 0, arms: o.arms || [10, 0, 60, -110], turn: o.turn || 0 });
// フードをかぶってうつむいた若い男（顔の上半分はフードの影）
function hooded(q, x, y, s, o = {}) {
  const P2 = { ...P.haruto }, k = o.lift || 0;
  const f = figure(q, P2, { x, y, s, eyes: k > 0.5 ? 'normal' : 'closed', mouth: o.mouth || 'line', talk: o.talk || 0, turn: o.turn ?? -0.15, arms: [8, 0, 8, 0], lightFrom: 'right' });
  const r = 44 * s * (P2.tall || 1), hx = x + (o.turn ?? -0.15) * 6 * s, hy = f.headY;
  q.save(); q.beginPath(); q.ellipse(hx, hy - r * 0.05, r * 1.25, r * 1.38, 0, 0, 7); q.ellipse(hx, hy + r * 0.2, r * 0.82, r * 0.98, 0, 0, 7); q.fillStyle = P2.top2; q.fill('evenodd'); q.restore();
  q.save(); q.beginPath(); q.ellipse(hx, hy + r * 0.2, r * 0.83, r * 0.99, 0, 0, 7); q.clip();
  const sh = lerp(0.42, 0.05, k); const gr = q.createLinearGradient(0, hy - r * 0.9, 0, hy + r * sh * 2.2 + r * 0.2);
  gr.addColorStop(0, 'rgba(4,6,8,.96)'); gr.addColorStop(0.8, 'rgba(4,6,8,.88)'); gr.addColorStop(1, 'rgba(4,6,8,0)');
  q.fillStyle = gr; q.fillRect(hx - r * 1.2, hy - r * 1.2, r * 2.4, r * (1.2 + sh * 2.2 + 0.2)); q.restore();
  return f;
}
// 手帳（どこの団体の印でもない、黒い革の手帳＋金のバッジ＋顔写真）
function badge(q, x, y, s, rot = 0) {
  q.save(); q.translate(x, y); q.rotate(rot); q.scale(s, s);
  q.shadowColor = 'rgba(0,0,0,.6)'; q.shadowBlur = 20; fillRR(q, -60, -90, 120, 180, 8, '#1b1512'); q.shadowColor = 'transparent';
  fillRR(q, -52, -82, 104, 76, 5, '#e8e2d4'); fillRR(q, -46, -76, 36, 46, 3, '#8fa0b0');
  circ(q, -28, -60, 10, '#e8d3c0'); fillRR(q, -40, -48, 24, 18, 4, '#1e2a44');
  for (let i = 0; i < 3; i++) fillRR(q, -2, -72 + i * 14, 48, 6, 3, '#9a9488');
  q.save(); q.translate(0, 42); q.beginPath(); q.moveTo(0, -36); q.lineTo(30, -24); q.lineTo(26, 14); q.lineTo(0, 34); q.lineTo(-26, 14); q.lineTo(-30, -24); q.closePath();
  const gg = q.createLinearGradient(0, -36, 0, 34); gg.addColorStop(0, '#f2d27a'); gg.addColorStop(1, '#a8812e'); q.fillStyle = gg; q.fill();
  circ(q, 0, 0, 12, '#c9a24a'); circ(q, 0, 0, 6, '#f6e3a2'); q.restore();
  q.restore();
}
// 玄関カメラを画面いっぱいのモニターで（y 260〜1000）
const MON = { x: 40, y: 260, w: 1000, h: 735 };
function monitor(g, lt, draw, o = {}) {
  const clock = o.clock || '02:31';
  hall(g);
  g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 630, z: o.z ?? 1, sx: o.sx || 0 });
  fillRR(g, MON.x - 24, MON.y - 24, MON.w + 48, MON.h + 100, 26, '#e9e6df');
  g.save(); rr(g, MON.x, MON.y, MON.w, MON.h, 10); g.clip(); g.translate(MON.x, MON.y); g.scale(MON.w / 340, MON.h / 250);
  doorCam(g, 340, 250, { t: lt, draw, clock }); g.restore();
  text(g, '録画中', MON.x + 70, MON.y + MON.h + 40, { size: 30, color: '#c0392b', weight: 800 });
  circ(g, MON.x + 20, MON.y + MON.h + 40, 9, Math.sin(lt * 6) > 0 ? '#e33' : '#822');
  text(g, '玄関', MON.x + MON.w - 40, MON.y + MON.h + 40, { size: 30, color: '#5a5a5a', weight: 800, align: 'right' });
  g.restore();
}
// 警察署との通話（上に保留中の「ハルト」が2本）
function stationCall(p, w, h, { t = 0, sec = 0, hold = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  for (let i = 0; i < 2; i++) { const y = 60 + i * 96; fillRR(p, 40, y, w - 80, 80, 24, 'rgba(255,255,255,.07)'); circ(p, 90, y + 40, 26, '#2f4a3c'); text(p, 'ハ', 90, y + 42, { size: 26, color: '#d6f5e3', weight: 900 }); text(p, 'ハルト', 136, y + 40, { size: 32, color: '#fff', align: 'left' }); text(p, '保留中', w - 70, y + 40, { size: 28, color: F.amber, align: 'right', weight: 700 }); }
  const ay = 420; circ(p, w / 2, ay, 110, '#2a3550'); text(p, '署', w / 2, ay + 6, { size: 100, color: '#dfe6f5', weight: 900 });
  text(p, '南町警察署', w / 2, ay + 190, { size: 62, color: '#fff' });
  text(p, hold ? '保留中…' : `通話中　0:${String(Math.floor(sec + t)).padStart(2, '0')}`, w / 2, ay + 260, { size: 36, color: hold ? F.amber : F.green2, weight: 700 });
  if (!hold) { p.save(); p.lineWidth = 5; p.strokeStyle = F.green; p.beginPath(); for (let k = 0; k <= 60; k++) { const x = w / 2 - 210 + k * 7, a = Math.sin(k * 0.6 + t * 10) * 24 * Math.abs(noise1(t * 3 + k * 0.2, 5)); k ? p.lineTo(x, ay + 330 + a) : p.moveTo(x, ay + 330 + a); } p.stroke(); p.restore(); }
  const hY = h - 80; circ(p, w / 2, hY, 54, '#ff3b4a'); fillRR(p, w / 2 - 28, hY - 8, 56, 16, 8, '#fff');
}
// 示談金 → 高木
function handOver(g, lt) {
  dark(g);
  const a = easeOut(inv(0, 0.35, lt)), b = easeOut(inv(0.9, 1.4, lt)), c = easeOut(inv(1.6, 2.1, lt));
  g.save(); g.globalAlpha = a; text(g, '示談金', 540, 300, { size: 50, color: '#c9d6cf' }); text(g, '300万円', 540, 440, { size: 170, color: F.green, weight: 900, stroke: '#05060a', sw: 18 }); g.restore();
  g.save(); g.globalAlpha = b; poly(g, [[505, 560], [575, 560], [575, 680], [625, 680], [540, 770], [455, 680], [505, 680]], '#c9d6cf'); g.restore();
  g.save(); g.globalAlpha = c; fillRR(g, 200, 820, 680, 300, 30, 'rgba(14,20,34,.92)'); g.lineWidth = 4; g.strokeStyle = 'rgba(160,180,220,.6)'; rr(g, 200, 820, 680, 300, 30); g.stroke();
  g.save(); g.beginPath(); g.rect(220, 840, 200, 260); g.clip(); vgrad(g, 220, 840, 200, 260, [[0, '#1a2428'], [1, '#0c1214']]); figure(g, P.takagi, { x: 320, y: 1340, s: 0.8, eyes: 'narrow' }); g.restore();
  text(g, '警察官', 640, 920, { size: 40, color: '#9fb0cc' }); text(g, '高木', 640, 1010, { size: 96, color: '#fff', weight: 900 }); g.restore();
}
// ハルトが3人（回線1・回線2・玄関）
function threeHaruto(g, lt) {
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
  glow(g, 880, 700, 420, 'rgba(255,80,60,1)', 0.18 * inv(0.5, 1, lt));
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 2, title: '警察官',
    back: g2 => monitor(g2, 3, (q, w, h) => { officer(q, w, h, { x: w * 0.5 }); }, { cy: 760, z: 1.15 }),
    face: g2 => close(g2, P.sawako, { y: 1500, s: 3.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', phoneLight: true, look: 0.6 }),
  });
}

const SHOTS = [
  // ── 冒頭：玄関の警察官（1フレーム目から制服の男）
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D) { monitor(g, lt, (q, w, h) => officer(q, w, h), { z: 1.08 }); } },
  { at: 't0', finish: { vignette: 0.6 }, draw(g, lt, D, S) { monitor(g, lt, (q, w, h) => officer(q, w, h, { talk: talking(lt, S, ['t0']) }), { z: slow(lt, D, 1.08, 1.2), cy: 560 }); } },
  { at: 'k1', finish: { vignette: 0.65 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 142, sec2: 92, alarm: 1 }), { z0: 1.1, z1: 1.16 }); mood(g, { red: 0.08 }); } },
  { at: 'k2', finish: { vignette: 0.65 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 143, sec2: 93, alarm: 1 }), { z0: 1.16, z1: 1.22 }); mood(g, { red: 0.08 }); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D) { dark(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(200,255,220,.16)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.sawako, { y: 680, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', phoneLight: true }); g.restore(); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030504', '#080b09'); cover(g, lt); } },
  { at: 'p1', draw(g, lt, D, S) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: lt < S.L('p1') + 2.3 ? 1 : 2, sec1: 145, sec2: 95, label1: '「人をはねた」', label2: '「それ、俺じゃない」' })); } },

  // ── 1. 警察官
  { at: 'a1', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 1000, z0: 1.12, z1: 1.0, set: { phone: 1, ring: 0, lamp: 0.3 } }); const k = easeOut(inv(0.4, 1.2, lt)); g.save(); g.globalAlpha = k; monitor(g, lt, (q, w, h) => officer(q, w, h, { arms: [8, 0, 8, 0] }), { clock: '02:32', z: lerp(0.8, 1.0, k) }); g.restore(); } },
  { at: 'a2', draw(g, lt, D, S) { monitor(g, lt, (q, w, h) => officer(q, w, h, { arms: [8, 0, 8, 0], talk: talking(lt, S, ['a2']) }), { clock: '02:32', z: slow(lt, D, 1.0, 1.12), cy: 600 }); } },
  { at: 'a2b', draw(g, lt, D) { const k = easeOut(inv(0.1, 0.8, lt)); monitor(g, lt, (q, w, h) => { officer(q, w, h, { arms: [8, 0, 8, 0] }); q.save(); q.globalAlpha = k; badge(q, w * 0.5, h * 0.52, lerp(0.9, 1.25, k), lerp(-0.2, -0.04, k)); q.restore(); }, { clock: '02:32', z: slow(lt, D, 1.05, 1.2), cy: 620 }); } },
  { at: 'a3', draw(g, lt, D, S) { face(g, lt, D, S, ['a3'], { eyes: 'normal', brow: 0.3, look: 0.5 }); } },
  { at: 'a4', draw(g, lt, D, S) { monitor(g, lt, (q, w, h) => officer(q, w, h, { arms: [8, 0, 8, 0], talk: talking(lt, S, ['a4', 'a5']) }), { clock: '02:32', z: slow(lt, D, 1.12, 1.3), cy: 520 }); } },
  { at: 'a5', draw(g, lt, D, S) { monitor(g, lt, (q, w, h) => officer(q, w, h, { arms: [8, 0, 8, 0], talk: talking(lt, S, ['a5']) }), { clock: '02:32', z: slow(lt, D, 1.3, 1.5), cy: 470 }); tag(g, '宮下ハルトさんの車', 540, 170, { size: 44, bg: '#0b120e', color: '#ff7a6a', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'a6', finish: { vignette: 0.7 }, draw(g, lt, D) { dark(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(200,255,220,.16)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.12) }); close(g, P.sawako, { y: 680, s: 4.0, eyes: 'wide', brow: -0.5, mouth: 'open', lightFrom: 'left', phoneLight: true }); g.restore(); } },

  // ── 2. 示談金を、警察官に
  { at: 'b1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 190, sec2: 140 })); } },
  { at: 'b2', draw(g, lt, D) { handOver(g, lt); } },
  { at: 'b3', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.5, mouth: 'line', look: 0.6 }); } },
  { at: 'b4', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 205, sec2: 155, alarm: 1 - inv(0, 1.2, lt) }), { z1: 1.08 }); } },
  { at: 'b5', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => { twoLines(p, w, h, { t: lt, active: lt < 1.6 ? 2 : 0, sec1: 210, sec2: 160 }); }); } },
  { at: 'dial', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => dialScreen(p, w, h, { t: lt, name: '南町警察署', num: '0●●-●●●-0110' })); } },

  // ── 3. 警察署
  { at: 'c1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, sec: 1 })); } },
  { at: 'c2', draw(g, lt, D, S) { face(g, lt, D, S, ['c2'], { eyes: 'normal', brow: 0.4, look: -0.4 }); } },
  { at: 'c3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, sec: 9 })); } },
  { at: 'hold', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, hold: 1 }), { z0: 1.04, z1: 1.1 }); } },
  { at: 'c4', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, sec: 24 }), { z0: 1.1, z1: 1.18 }); } },
  { at: 'c5', draw(g, lt, D) { monitor(g, lt, (q, w, h) => officer(q, w, h, { arms: [8, 0, 8, 0], eyes: 'narrow' }), { clock: '02:34', z: slow(lt, D, 1.2, 1.4), cy: 520 }); mood(g, { red: 0.1 * inv(0.5, 1.5, lt) }); } },
  { at: 'c6', finish: { vignette: 0.7 }, draw(g, lt, D) { monitor(g, lt, (q, w, h) => officer(q, w, h, { arms: [8, 0, 8, 0], eyes: 'narrow' }), { clock: '02:34', z: slow(lt, D, 1.4, 1.65), cy: 470 }); mood(g, { red: 0.14, desat: 0.3 }); tag(g, '偽物', 540, 170, { size: 56, bg: '#3a0c0c', color: '#ff7a6a', alpha: inv(D * 0.45, D * 0.45 + 0.3, lt) }); } },

  // ── 4. 先週も
  { at: 'd1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, sec: 33 })); } },
  { at: 'd2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, sec: 40 }), { z0: 1.04, z1: 1.1 }); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = ease(inv(0, D, lt)); g.save(); cam(g, { x: lerp(540, 565, k), y: lerp(800, 540, k), z: lerp(1.3, 2.6, k) }); chanoma(g, { t: lt, phone: 1, lamp: 0.3, clock: [2, 36] }); g.restore(); subBand(g, inv(0, 0.4, lt)); } },
  { at: 'd4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: lt > D - 0.4 ? 1 : 0, sec1: 230, sec2: 180, alarm: inv(D - 0.4, D, lt) })); } },
  { at: 'd5', finish: { vignette: 0.65 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 231, sec2: 181, label1: '弁護士を名乗る男', alarm: 1 - inv(0, 0.8, lt) }), { z0: 1.06, z1: 1.14 }); mood(g, { red: 0.08 }); } },

  // ── 5. 引き
  { at: 'knock', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 900, z0: 1.15, z1: 1.0, set: { phone: 1, ring: 0, lamp: 0.22, clock: [2, 37] } }); mood(g, { dark: 0.25 }); } },
  { at: 'e1', draw(g, lt, D, S) { monitor(g, lt, (q, w, h) => officer(q, w, h, { arms: [8, 0, 8, 0], talk: talking(lt, S, ['e1']), mouth: 'smile' }), { clock: '02:37', z: slow(lt, D, 1.1, 1.3), cy: 540 }); } },
  { at: 'e2', draw(g, lt, D) { const k = easeOut(inv(0.3, 2.4, lt)); monitor(g, lt, (q, w, h) => { officer(q, w, h, { x: lerp(w * 0.5, w * 0.32, k), arms: [8, 0, 40, -30] }); hooded(q, lerp(w + 70, w * 0.68, k), h * 1.42, 0.52); }, { clock: '02:37', z: 1.0 }); } },
  { at: 'e3', draw(g, lt, D) { monitor(g, lt, (q, w, h) => { officer(q, w, h, { x: w * 0.32, arms: [8, 0, 40, -30] }); hooded(q, w * 0.68, h * 1.42, 0.52); }, { clock: '02:37', z: slow(lt, D, 1.0, 1.6), cx: lerp(540, 690, ease(inv(0, D, lt))), cy: 560 }); } },
  { at: 'turn', noSubs: true, draw(g) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } },
  { at: 'e4', finish: { vignette: 0.75 }, draw(g, lt, D, S) { monitor(g, lt, (q, w, h) => { officer(q, w, h, { x: w * 0.32, arms: [8, 0, 40, -30] }); hooded(q, w * 0.68, h * 1.42, 0.52, { lift: 0.35 * inv(0, D, lt), talk: talking(lt, S, ['e4']) }); }, { clock: '02:37', z: 1.9, cx: 720, cy: 500, sx: noise1(lt * 20, 2) * 3 }); } },
  { at: 'e5', finish: { vignette: 0.7 }, draw(g, lt, D) { threeHaruto(g, lt); mood(g, { dark: inv(D - 0.7, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.9 },
  { at: 'cold', type: 'chime', vol: 0.6 },
  { at: 't0', off: 1.2, type: 'knock', vol: 0.6 },
  { at: 'k1', type: 'stab', vol: 0.7 },
  { at: 'k3', type: 'heartbeat', dur: 3, vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 9, vol: 0.4 },
  { at: 'a2b', type: 'shutter', vol: 0.4 },
  { at: 'a5', type: 'stab', vol: 0.6 },
  { at: 'a6', type: 'heartbeat', dur: 3, vol: 0.6 },
  { at: 'b2', off: 0.1, type: 'pop', vol: 0.5 },
  { at: 'b2', off: 1.7, type: 'stab', vol: 0.6 },
  { at: 'b5', type: 'tap3', vol: 0.4 },
  { at: 'dial', type: 'dial', dur: 1.6, vol: 0.6 },
  { at: 'c1', type: 'pickup', vol: 0.5 },
  { at: 'hold', type: 'clock', dur: 1.3, vol: 0.5 },
  { at: 'c4', type: 'hit', vol: 0.85 },
  { at: 'c6', type: 'stab', vol: 0.6 },
  { at: 'd1', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'd3', type: 'riser', vol: 0.5 },
  { at: 'd4:end', off: -0.3, type: 'glitch', vol: 0.5 },
  { at: 'd5:end', off: 0.1, type: 'hit', vol: 0.8 },
  { at: 'knock', type: 'knock', vol: 0.8 },
  { at: 'e2', type: 'scrape', vol: 0.4 },
  { at: 'e3', type: 'riser', vol: 0.6 },
  { at: 'turn', type: 'hit', vol: 0.8 },
  { at: 'e5', type: 'impact', vol: 0.8 },
  { at: 'e5:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'p1', mood: 'uneasy' },
  { at: 'a5', mood: 'tension' },
  { at: 'b1', mood: 'suspense' },
  { at: 'dial', mood: 'silence' },
  { at: 'c4', mood: 'tension' },
  { at: 'd1', mood: 'uneasy' },
  { at: 'd5', mood: 'thriller' },
  { at: 'knock', mood: 'silence' },
  { at: 'e2', mood: 'thriller' },
  { at: 'turn', mood: 'silence' },
  { at: 'e5', mood: 'tension' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a1', '2時32分　宮下家の玄関', 2.6]]) });
