// 二人の息子 第4話「空き家」— 映像・効果音・BGM
// 手がかり（最終話で回収）：消えたテレビに佐和子だけ映らない（空の座布団）／高木は茶の間を素通りする
//   ／仏間の襖の奥に仏壇と遺影（顔はガラスの反射で見えない＝最終話で見せる）／スピーカーは声に出して話すときだけ強く光る
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, ell, poly, line, rr, vgrad, glow, rgba, cam, text, tag, darkness } from '../../engine/core.js';
import { close, figure, mood, speedLines, sfxText } from '../../engine/noir.js';
import { phoneFrame } from '../../engine/sns.js';
import { F, chanoma, doorCam, smartSpeaker, scamRoom, lockApp, butsuma } from '../../engine/futarisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep04.script.js';

const dark = g => bg(g, '#141a17', '#090d0b');
const hall = g => bg(g, '#1c1814', '#0e0c0a');
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
const room = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1100, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); chanoma(g, { t: lt, clock: [2, 46], ...o.set }); if (o.then) o.then(g); g.restore(); };

// ── 玄関のカメラ
const officer = (q, w, h, o = {}) => figure(q, P.takagi, { x: o.x ?? w * 0.5, y: o.y ?? h * 1.4, s: 0.55, eyes: o.eyes || 'narrow', mouth: o.mouth || 'line', talk: o.talk || 0, arms: o.arms || [10, 0, 60, -110], turn: o.turn || 0 });
const harutoCam = (o = {}) => (q, w, h) => {
  const x = w * 0.5 + (o.dx || 0);
  q.save(); if (o.down) { q.translate(x, 150); q.rotate(-0.35 * o.down); q.translate(-x, -150); q.translate(0, 40 * o.down); }
  ell(q, x, 112, 70, 78, P.haruto.top2);
  close(q, P.haruto, { x, y: 112, s: 0.8, eyes: o.eyes || 'normal', brow: o.brow ?? 0.4, mouth: o.mouth || 'line', talk: o.talk || 0, lightFrom: 'right', look: o.look || 0 });
  q.restore();
  if (o.hand) { const hx = x - 60, hy = 200 + (o.down || 0) * 20; line(q, -20, 40, hx - 20, hy - 10, 30, P.takagi.top2); ell(q, hx, hy, 36, 22, '#e8cdb4'); }
};
const MON = { x: 40, y: 260, w: 1000, h: 735 };
function monitor(g, lt, draw, o = {}) {
  hall(g);
  g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 630, z: o.z ?? 1, sx: o.sx || 0 });
  fillRR(g, MON.x - 24, MON.y - 24, MON.w + 48, MON.h + 100, 26, '#e9e6df');
  g.save(); rr(g, MON.x, MON.y, MON.w, MON.h, 10); g.clip(); g.translate(MON.x, MON.y); g.scale(MON.w / 340, MON.h / 250);
  doorCam(g, 340, 250, { t: lt, draw, clock: o.clock || '02:47' }); g.restore();
  text(g, '録画中', MON.x + 70, MON.y + MON.h + 40, { size: 30, color: '#c0392b', weight: 800 });
  circ(g, MON.x + 20, MON.y + MON.h + 40, 9, Math.sin(lt * 6) > 0 ? '#e33' : '#822');
  text(g, '玄関', MON.x + MON.w - 40, MON.y + MON.h + 40, { size: 30, color: '#5a5a5a', weight: 800, align: 'right' });
  g.restore();
}
// 警察署との通話
function stationCall(p, w, h, { t = 0, sec = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  const ay = 330; circ(p, w / 2, ay, 110, '#2a3550'); text(p, '署', w / 2, ay + 6, { size: 100, color: '#dfe6f5', weight: 900 });
  text(p, '南町警察署', w / 2, ay + 190, { size: 62, color: '#fff' });
  text(p, `通話中　0:${String(Math.floor(sec + t)).padStart(2, '0')}`, w / 2, ay + 260, { size: 36, color: F.green2, weight: 700 });
  p.save(); p.lineWidth = 5; p.strokeStyle = F.green; p.beginPath(); for (let k = 0; k <= 60; k++) { const x = w / 2 - 210 + k * 7, a = Math.sin(k * 0.6 + t * 10) * 24 * Math.abs(noise1(t * 3 + k * 0.2, 5)); k ? p.lineTo(x, ay + 340 + a) : p.moveTo(x, ay + 340 + a); } p.stroke(); p.restore();
  const hY = h - 80; circ(p, w / 2, hY, 54, '#ff3b4a'); fillRR(p, w / 2 - 28, hY - 8, 56, 16, 8, '#fff');
}
function dialStation(p, w, h, { t = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  const ay = 330; circ(p, w / 2, ay, 110, '#2a3550'); text(p, '署', w / 2, ay + 6, { size: 100, color: '#dfe6f5', weight: 900 });
  const k = (t * 1.1) % 1; p.save(); p.globalAlpha = 1 - k; p.lineWidth = 6; p.strokeStyle = F.green; p.beginPath(); p.arc(w / 2, ay, 120 + k * 130, 0, 7); p.stroke(); p.restore();
  text(p, '南町警察署', w / 2, ay + 190, { size: 62, color: '#fff' }); text(p, '呼び出し中…', w / 2, ay + 260, { size: 38, color: F.green2, weight: 700 });
  const hY = h - 80; circ(p, w / 2, hY, 54, '#ff3b4a'); fillRR(p, w / 2 - 28, hY - 8, 56, 16, 8, '#fff');
}
// 空き家（近所の人の話）：雨戸の閉まった家の外観を、警察の報告書のメモ風に
function emptyHouse(g, lt) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0b0f14'], [1, '#141a20']]);
  const a = easeOut(inv(0, 0.5, lt));
  g.save(); g.globalAlpha = a;
  fillRR(g, 140, 300, 800, 760, 10, '#e9e3d6'); fillRR(g, 140, 300, 800, 90, 10, '#2a3550');
  text(g, '巡回の記録', 540, 346, { size: 40, color: '#fff', weight: 800 });
  // 家の絵（雨戸が閉まり、郵便受けにチラシ）
  g.save(); g.beginPath(); g.rect(180, 420, 720, 420); g.clip();
  vgrad(g, 180, 420, 720, 420, [[0, '#1a2030'], [1, '#2a3040']]);
  poly(g, [[300, 600], [540, 470], [780, 600]], '#3a2e2a'); fillRR(g, 320, 600, 440, 240, 0, '#8a8478');
  for (const x of [350, 560]) { fillRR(g, x, 640, 170, 110, 2, '#5a5650'); for (let i = 0; i < 6; i++) line(g, x, 650 + i * 17, x + 170, 650 + i * 17, 2, '#4a4640'); }
  fillRR(g, 500, 760, 80, 80, 2, '#3a2c28'); fillRR(g, 640, 770, 60, 40, 3, '#9a9488'); fillRR(g, 646, 760, 48, 16, 2, '#e8e2d4');
  g.restore();
  const rows = ['先週　通報により訪問', '応答なし・人の気配なし', '近所の話：2年前から空き家'];
  rows.forEach((s, i) => text(g, s, 200, 900 + i * 54, { size: 36, color: i === 2 ? '#c0392b' : '#2a2a33', align: 'left', weight: 800, alpha: easeOut(inv(0.4 + i * 0.35, 0.7 + i * 0.35, lt)) }));
  g.restore();
}
// 消えたテレビの黒い画面（茶の間が映る。座布団は空）
function tvReflect(g, lt, D, { pulse = 0 } = {}) {
  bg(g, '#0a0c0b', '#060807');
  g.save(); cam(g, { x: 540, y: 860, z: slow(lt, D, 1.0, 1.06) });
  fillRR(g, 50, 260, 980, 760, 18, '#0a0b0e'); fillRR(g, 74, 284, 932, 712, 8, '#101216');
  g.save(); rr(g, 74, 284, 932, 712, 8); g.clip(); g.globalAlpha = 0.6;
  // 左右反転した茶の間：左に襖、右にランプ、奥に時計、手前にちゃぶ台と湯のみ、空の座布団
  fillRR(g, 74, 340, 260, 560, 0, '#cfc4ad'); g.lineWidth = 4; g.strokeStyle = '#3a2a1e'; g.strokeRect(80, 344, 124, 552); g.strokeRect(206, 344, 124, 552);
  circ(g, 520, 420, 44, '#e9e2d2'); fillRR(g, 640, 380, 100, 130, 4, '#e8e1d2'); fillRR(g, 640, 380, 100, 30, 4, '#b8483e');
  glow(g, 880, 520, 260, 'rgba(255,200,140,1)', 0.8); circ(g, 880, 520, 40, '#ffd9a0');
  ell(g, 560, 880, 300, 70, '#5a4130'); fillRR(g, 380, 820, 44, 44, 8, '#7a8a7a');
  fillRR(g, 470, 930, 190, 70, 14, '#6a4a6a');
  g.restore();
  // ガラスの反射のすじ
  g.save(); g.globalAlpha = 0.08; poly(g, [[120, 284], [300, 284], [120, 700]], '#fff'); g.restore();
  if (pulse > 0) { const k = (lt * 0.9) % 1; g.save(); g.globalAlpha = pulse * (1 - k) * 0.7; g.lineWidth = 6; g.strokeStyle = '#ff7a6a'; g.beginPath(); g.ellipse(565, 965, 120 + k * 80, 50 + k * 30, 0, 0, 7); g.stroke(); g.restore(); }
  g.restore();
  fillRR(g, 200, 1060, 680, 60, 8, '#2a1d14');
}
// 黒田の顔（ノートPCの光で下から照らされる）
function kuroFace(g, lt, D, S, ids = [], o = {}) {
  const tk = talking(lt, S, ids);
  g.save(); cam(g, { x: 540, y: 1100, z: 1.5 }); scamRoom(g, { t: lt, wave: 0.3 + tk }); g.restore();
  mood(g, { dark: 0.55 });
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  close(g, P.kuroda, { y: 640, s: 3.4, eyes: o.eyes || 'narrow', brow: o.brow ?? 0.5, mouth: o.mouth || 'smile', talk: tk * 0.5, lightFrom: 'right', look: o.look || 0 });
  g.restore();
  glow(g, 540, 1300, 700, 'rgba(54,210,127,1)', 0.22);
}
// 茶の間を歩く高木（懐中電灯）。k＝0..1 で左から右（仏間の襖）へ
function walkThrough(g, lt, k, { stop = 0 } = {}) {
  g.save(); chanoma(g, { t: lt, clock: [2, 48], lamp: 0.08, speaker: 0.35 });
  const x = lerp(-120, 760, ease(k));
  const fg = figure(g, P.takagi, { x, y: 1380, s: 1.25, eyes: 'narrow', walk: stop ? null : lt * 1.6, arms: [10, 0, 80, -20], lightFrom: 'left', turn: 0.4 });
  // 懐中電灯
  const [fx, fy] = fg.hr;
  g.save(); g.translate(fx - 10, fy); g.rotate(-0.05); fillRR(g, -6, -14, 70, 28, 8, '#2a2c33'); fillRR(g, 56, -18, 18, 36, 6, '#d9d6cc'); g.restore();
  g.restore();
  const hx = fg.hr[0] - 130, hy = fg.hr[1] - 40;
  darkness(g, 0.88, '#030405', [{ x: hx + 260, y: hy + 40, r: 360, a: 1, core: 0.5, color: 'rgba(255,240,210,1)', glow: 0.2 }, { x, y: 800, r: 260, a: 0.55 }, { x: 520, y: 800, r: 120, a: 0.5 }]);
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 4, title: '空き家',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1000, z: 1.15 }); chanoma(g2, { t: 3, lamp: 0.2, phone: 1 }); g2.restore(); mood(g2, { dark: 0.3 }); },
    face: g2 => close(g2, P.sawako, { y: 1500, s: 3.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', phoneLight: true, look: -0.6 }),
  });
}

const SHOTS = [
  // ── 冒頭：黒田の一言と、10歩の廊下
  { at: 'cold', off: -0.3, finish: { vignette: 0.75 }, draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['k1'], { z0: 1.12, z1: 1.18 }); mood(g, { dark: 0.35 }); } },
  { at: 'k1', finish: { vignette: 0.75 }, draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['k1'], { z0: 1.12, z1: 1.2 }); mood(g, { dark: 0.35 * (1 - inv(0, 0.6, lt)) }); } },
  { at: 'k2', draw(g, lt, D) { const k = ease(inv(0, D, lt)); room(g, lt, D, { x: lerp(540, 150, k), y: 900, z0: 1.15, z1: 1.35, set: { lamp: 0.3 } }); } },
  { at: 'k3', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { look: -0.7 }); } },
  { at: 'k4', finish: { vignette: 0.7 }, draw(g, lt, D) { room(g, lt, D, { x: 180, y: 900, z0: 1.35, z1: 1.5, set: { lamp: 0.25 } }); mood(g, { dark: 0.15 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030504', '#080b09'); cover(g, lt); } },

  // ── 1. 空き家
  { at: 'a1', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'normal', brow: 0.5, mouth: 'line', look: 0.4 }); } },
  { at: 'dial', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => dialStation(p, w, h, { t: lt })); } },
  { at: 'a2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, sec: 1 })); } },
  { at: 'a3', draw(g, lt, D, S) { face(g, lt, D, S, ['a3'], { eyes: 'wide', brow: 0.6 }); } },
  { at: 'a4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => stationCall(p, w, h, { t: lt, sec: 9 }), { z0: 1.02, z1: 1.06 }); } },
  { at: 'a5', draw(g, lt, D) { emptyHouse(g, lt); } },
  { at: 'a7', finish: { vignette: 0.6 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.15, 1.25) }); emptyHouse(g, lt + 3); g.restore(); tag(g, '2年前から空き家', 540, 1460, { size: 54, bg: '#3a0c0c', color: '#ff7a6a', alpha: inv(D * 0.4, D * 0.4 + 0.3, lt) }); } },
  { at: 'a8', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { mouth: 'open' }); } },

  // ── 2. 黒い画面
  { at: 'b1', draw(g, lt, D) { const k = ease(inv(0, D, lt)); room(g, lt, D, { x: lerp(820, 300, k), y: 1000, z0: 1.3, z1: 1.3, set: { lamp: 0.45 } }); } },
  { at: 'b2', draw(g, lt, D) { room(g, lt, D, { x: 560, y: 1250, z0: 1.25, z1: 1.4, set: { lamp: 0.45 } }); } },
  { at: 'b3', draw(g, lt, D) { const k = ease(inv(0, D + 1.5, lt)); room(g, lt, D, { x: lerp(300, 240, k), y: lerp(900, 805, k), z0: 1.6, z1: 2.4, set: { lamp: 0.45 } }); subBand(g, inv(0, 0.4, lt)); } },
  { at: 'tv', finish: { vignette: 0.6 }, draw(g, lt, D) { tvReflect(g, lt, D); } },
  { at: 'b4', finish: { vignette: 0.65 }, draw(g, lt, D) { tvReflect(g, lt + 1.5, D + 1.5, { pulse: inv(0.6, 1.2, lt) }); tag(g, '私が座っている場所', 565, 1120, { size: 36, bg: '#2a0c0c', color: '#ff7a6a', alpha: inv(1.0, 1.4, lt) }); } },
  { at: 'b5', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { mouth: 'line', brow: -0.4 }); mood(g, { desat: 0.4 * inv(0, D, lt) }); } },

  // ── 3. 黒田の顔
  { at: 'c1', finish: { vignette: 0.65 }, draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['c1']); tag(g, '黒田', 540, 170, { size: 46, bg: '#2a0c0c', color: '#ff7a6a', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'c2', draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['c2'], { z0: 1.06, z1: 1.12 }); } },
  { at: 'c3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['c3'], { z0: 1.12, z1: 1.22, eyes: 'normal' }); mood(g, { red: 0.08 }); } },
  { at: 'c4', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.6, mouth: 'line', look: 0.5 }); } },
  { at: 'c5', draw(g, lt, D) { const k = easeOut(inv(0.2, 1.4, lt)); g.save(); cam(g, { x: lerp(540, 960, k), y: lerp(900, 1170, k), z: lerp(1.0, 2.2, k) }); butsuma(g, { t: lt, light: 0.7, face: 0, fusuma: 1, flash: { x: lerp(540, 960, k), y: 1000, r: 420 } }); g.restore(); subBand(g, k); } },
  { at: 'c6', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'normal', brow: 0.5, mouth: 'line', look: -0.5 }); } },

  // ── 4. 鍵を開ける
  { at: 'd1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { monitor(g, lt, harutoCam({ hand: 1, mouth: 'open', talk: talking(lt, S, ['d1']), brow: 0.7 }), { z: slow(lt, D, 1.1, 1.22), cy: 670, sx: noise1(lt * 25, 3) * 5 }); } },
  { at: 'd2', finish: { vignette: 0.7 }, draw(g, lt, D) { monitor(g, lt, harutoCam({ hand: 1, down: inv(0, D, lt), eyes: 'closed', brow: 0.8 }), { z: 1.22, cy: 670, sx: noise1(lt * 30, 5) * 8 }); mood(g, { red: 0.1 }); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D) { monitor(g, lt, (q, w, h) => { harutoCam({ hand: 1, down: 1, eyes: 'closed', brow: 0.8 })(q, w, h); }, { z: slow(lt, D, 1.22, 1.3), cy: 690 }); mood(g, { red: 0.12 }); } },
  { at: 'd4', finish: { vignette: 0.7 }, draw(g, lt, D, S) { kuroFace(g, lt, D, S, ['d4'], { z0: 1.15, z1: 1.25, mouth: 'line' }); mood(g, { red: 0.1 }); } },
  { at: 'd5', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.2, mouth: 'line', z0: 1.04, z1: 1.12 }); } },
  { at: 'd6', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => lockApp(p, w, h, { t: lt, k: 0, hold: inv(0.2, D, lt) })); } },
  { at: 'unlock', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => lockApp(p, w, h, { t: lt, k: inv(0.1, 0.25, lt), hold: 1 - inv(0.2, 0.5, lt) }), { z0: 1.04, z1: 1.1 }); sfxText(g, 'カチャ', 540, 1400, { size: 120, color: '#ff7a6a', alpha: inv(0.1, 0.2, lt), rot: -0.08 }); } },

  // ── 5. 引き
  { at: 'e1', finish: { vignette: 0.7 }, draw(g, lt, D) { walkThrough(g, lt, 0.05 * inv(0, D, lt)); } },
  { at: 'steps', finish: { vignette: 0.7 }, draw(g, lt, D) { walkThrough(g, lt, lerp(0.05, 0.55, inv(0, D, lt))); } },
  { at: 'e2', finish: { vignette: 0.7 }, draw(g, lt, D) { walkThrough(g, lt, lerp(0.55, 1, inv(0, D * 0.8, lt)), { stop: lt > D * 0.8 }); } },
  { at: 'fusuma', finish: { vignette: 0.7 }, draw(g, lt, D) { butsuma(g, { t: lt, light: 0, face: 0, fusuma: ease(inv(0.1, D, lt)), flash: { x: 540, y: 700, r: 380 } }); } },
  { at: 'e3', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = ease(inv(0, D, lt)); butsuma(g, { t: lt, light: 0, face: 0, fusuma: 1, flash: { x: lerp(380, 560, k), y: lerp(900, 600, k), r: 400 } }); } },
  { at: 'e4', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 640, z: slow(lt, D, 1.1, 1.3) }); butsuma(g, { t: lt, light: 0, face: 0, fusuma: 1, flash: { x: 540, y: 600, r: 420 } }); g.restore(); glarePhoto(g, lt); subBand(g, 0.8); } },
  { at: 'e5', finish: { vignette: 0.7 }, draw(g, lt, D) { const k = ease(inv(0, D, lt)); g.save(); cam(g, { x: 520, y: lerp(900, 830, k), z: lerp(1.6, 3.0, k) }); chanoma(g, { t: lt, clock: [2, 49], lamp: 0.05, speaker: 0.35 + 0.65 * inv(D * 0.6, D, lt) }); g.restore(); darkness(g, 0.75, '#030405', [{ x: 540, y: 820, r: 500, a: 0.8 }]); } },
  { at: 'glow', finish: { vignette: 0.7 }, draw(g, lt, D) { g.save(); cam(g, { x: 520, y: 820, z: 3.0 }); chanoma(g, { t: lt, clock: [2, 49], lamp: 0.05, speaker: 1 }); g.restore(); darkness(g, 0.75, '#030405', [{ x: 540, y: 820, r: 520, a: 0.85 }]); } },
  { at: 'e6', finish: { vignette: 0.75 }, draw(g, lt, D) { g.save(); cam(g, { x: 520, y: 820, z: slow(lt, D, 3.0, 3.3) }); chanoma(g, { t: lt * 2, clock: [2, 49], lamp: 0.05, speaker: 1 }); g.restore(); darkness(g, 0.75, '#030405', [{ x: 540, y: 820, r: 520, a: 0.85 }]); glow(g, 540, 700, 600, 'rgba(54,210,127,1)', 0.25 * (0.7 + 0.3 * Math.sin(lt * 8))); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];
// 遺影のガラスに懐中電灯が反射して、顔は見えない
function glarePhoto(g, lt) { glow(g, 560, 560, 220, 'rgba(255,250,235,1)', 0.75 + 0.1 * Math.sin(lt * 5)); }

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.9 },
  { at: 'k3', type: 'heartbeat', dur: 3, vol: 0.6 },
  { at: 'k4', type: 'clock', dur: 3, vol: 0.4 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'tap3', vol: 0.4 },
  { at: 'dial', type: 'dial', dur: 1.4, vol: 0.6 },
  { at: 'a2', type: 'pickup', vol: 0.5 },
  { at: 'a5', type: 'rustle', vol: 0.4 },
  { at: 'a7', type: 'stab', vol: 0.7 },
  { at: 'a8', type: 'hit', vol: 0.85 },
  { at: 'b1', type: 'roomtone', dur: 12, vol: 0.4 },
  { at: 'tv', type: 'riser', vol: 0.5 },
  { at: 'b4', type: 'hit', vol: 0.85 },
  { at: 'b5', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'c1', type: 'subdrop', vol: 0.6 },
  { at: 'c3', type: 'stab', vol: 0.7 },
  { at: 'c5', type: 'creak', vol: 0.4 },
  { at: 'd1', type: 'stab', vol: 0.6 },
  { at: 'd2', type: 'hit', vol: 0.8 },
  { at: 'd4', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'd6', type: 'riser', vol: 0.5 },
  { at: 'unlock', off: 0.1, type: 'unlock', vol: 0.8 },
  { at: 'e1', type: 'creak', vol: 0.6 },
  { at: 'steps', type: 'steps', dur: 3.4, vol: 0.6 },
  { at: 'fusuma', type: 'scrape', vol: 0.6 },
  { at: 'e3', type: 'stab', vol: 0.6 },
  { at: 'glow', type: 'ping', vol: 0.5 },
  { at: 'e6:end', off: 0.4, type: 'subdrop', vol: 0.8 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'suspense' },
  { at: 'a7', mood: 'tension' },
  { at: 'b1', mood: 'uneasy' },
  { at: 'tv', mood: 'silence' },
  { at: 'b4', mood: 'tension' },
  { at: 'c1', mood: 'thriller' },
  { at: 'd5', mood: 'suspense' },
  { at: 'unlock', mood: 'silence' },
  { at: 'e1', mood: 'uneasy' },
  { at: 'fusuma', mood: 'tension' },
  { at: 'glow', mood: 'silence' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a1', '2時44分　宮下家の茶の間', 2.6]]) });
