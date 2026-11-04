// 「父のスマホ」の場面：団地の6畳（後飾りの祭壇・父の上着・窓）、向かいの4号棟、ロック画面・メッセージ・パスコード・通帳・ボイスメモ、
//   カズミの部屋、朝の交差点、車いす、古い新聞。色は団地の黄みがかった蛍光灯と冬の朝の青、差し色は通知の白と送金の黄
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, darkness, FONT, SERIF } from './core.js';
import { C, toneRect, toneFill, head, figure } from './noir.js';

export const Y = { amber: '#f2c14e', amber2: '#ffd97a', blue: '#9fb4d8', night: '#0b1224', wall: '#8f866e', wall2: '#6f6752', tatami: '#6a6440', cloth: '#ece8dc', wood: '#5a4130', wood2: '#3a2a1e', concrete: '#7a7a74' };

// ---------- 小物 ----------
// 白木の位牌（後飾り）
export function ihai(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  fillRR(g, -34, 60, 68, 22, 3, '#c9b88e'); fillRR(g, -26, -70, 52, 132, 4, '#e2d3ac'); poly(g, [[-26, -70], [0, -92], [26, -70]], '#e2d3ac');
  g.save(); g.globalAlpha = 0.75; for (let i = 0; i < 5; i++) fillRR(g, -5, -52 + i * 22, 10, 14, 2, '#2a2420'); g.restore();
  g.restore();
}
// ろうそく（flame 0..1）
export function candle(g, x, y, t = 0, s = 1, flame = 1) {
  fillRR(g, x - 9 * s, y - 70 * s, 18 * s, 70 * s, 4 * s, '#f4f1ea');
  if (flame > 0) { const f = 1 + noise1(t * 8, x) * 0.15; ell(g, x, y - 84 * s, 7 * s, 16 * s * f, '#ffcf6a'); ell(g, x, y - 80 * s, 3.5 * s, 8 * s, '#fff6d8'); glow(g, x, y - 84 * s, 150 * s, 'rgba(255,190,100,1)', 0.45 * flame); }
}
// 小さなスマホ（上から見たところ）。on 0..1 で画面が光る
export function smallPhone(g, x, y, rot = 0, { on = 0, s = 1, label = 'カズミ', t = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  fillRR(g, -46, -86, 92, 172, 14, '#0d0e12');
  fillRR(g, -40, -80, 80, 160, 10, on > 0 ? mix('#141a2a', '#e8ecf4', on * 0.85) : '#141821');
  if (on > 0.3) { g.save(); g.globalAlpha = on; text(g, '7:00', 0, -46, { size: 22, color: '#1a2030', weight: 900 }); fillRR(g, -34, -18, 68, 40, 8, 'rgba(30,40,60,.18)'); text(g, label, 0, -6, { size: 13, color: '#1a2030', weight: 900 }); fillRR(g, -26, 6, 52, 5, 2, 'rgba(30,40,60,.4)'); g.restore(); }
  g.restore();
  if (on > 0) glow(g, x, y, 300 * s, 'rgba(220,230,255,1)', 0.45 * on);
}

// ---------- 写真の中身 ----------
// 3号棟の入口の前で撮った写真。kid＝'natsuki'|'ryo'、old＝父の白髪、mom＝母も写る
export function entrancePhoto(g, w, h, { kid = 'natsuki', P = {}, mom = true } = {}) {
  const day = kid === 'natsuki';
  vgrad(g, 0, 0, w, h, day ? [[0, '#a9c3d6'], [1, '#e6dcc6']] : [[0, '#c8b9a0'], [1, '#e9dcc2']]);
  // 団地の入口（コンクリートの壁・3号棟の札・植えこみ）
  fillRR(g, 0, h * 0.08, w, h * 0.66, 0, day ? '#c9c4b6' : '#bdb6a6');
  for (let i = 0; i < 4; i++) fillRR(g, w * 0.06 + i * w * 0.24, h * 0.14, w * 0.16, h * 0.12, 2, '#8a96a2');
  fillRR(g, w * 0.36, h * 0.34, w * 0.28, h * 0.4, 2, '#5a5e64'); fillRR(g, w * 0.4, h * 0.38, w * 0.2, h * 0.36, 2, '#3a3e44');
  fillRR(g, w * 0.66, h * 0.36, w * 0.14, h * 0.08, 3, '#f4f1ea'); text(g, '3号棟', w * 0.73, h * 0.4, { size: w * 0.045, color: '#2a2a2a', weight: 900 });
  vgrad(g, 0, h * 0.74, w, h * 0.26, [[0, '#9a9488'], [1, '#7a756a']]);
  ell(g, w * 0.1, h * 0.72, w * 0.16, h * 0.07, '#5a7a4a'); ell(g, w * 0.92, h * 0.72, w * 0.16, h * 0.07, '#5a7a4a');
  const s = w / 560;
  if (mom && P.mom) figure(g, P.mom, { x: w * 0.2, y: h * 0.98, s: 0.62 * s, eyes: 'narrow', mouth: 'smile', lightFrom: 'left', arms: [8, 0, 8, 0] });
  if (P.child) figure(g, P.child, { x: w * 0.44, y: h * 0.98, s: 0.62 * s, eyes: 'narrow', mouth: 'smile', lightFrom: 'left', arms: [20, -30, 20, -30] });
  if (P.dad) figure(g, P.dad, { x: w * 0.66, y: h * 0.98, s: 0.62 * s, eyes: 'narrow', mouth: 'smile', lightFrom: 'left', arms: [8, 0, -40, -50] });
  // 古い写真の色あせ
  g.save(); g.globalAlpha = day ? 0.12 : 0.18; g.fillStyle = '#e8c890'; g.fillRect(0, 0, w, h); g.restore();
}
// 遺影の中身（父・白髪・メガネ）
export function dadPortrait(g, w, h, P) {
  vgrad(g, 0, 0, w, h, [[0, '#b5b5ba'], [1, '#85858c']]);
  head(g, P, w / 2, h * 0.46, w * 0.27, { eyes: 'narrow', mouth: 'smile', lightFrom: 'left' });
  g.beginPath(); g.moveTo(w * 0.05, h); g.quadraticCurveTo(w * 0.1, h * 0.8, w * 0.35, h * 0.76); g.lineTo(w * 0.65, h * 0.76); g.quadraticCurveTo(w * 0.9, h * 0.8, w * 0.95, h); g.closePath(); g.fillStyle = '#3a3a42'; g.fill();
}
// 若い男の写真（カズミの夫・シンイチ）
export function shinPortrait(g, w, h, P) {
  vgrad(g, 0, 0, w, h, [[0, '#c9c0a8'], [1, '#9a9078']]);
  head(g, P, w / 2, h * 0.46, w * 0.27, { eyes: 'normal', mouth: 'smile', lightFrom: 'left' });
  g.beginPath(); g.moveTo(w * 0.05, h); g.quadraticCurveTo(w * 0.1, h * 0.8, w * 0.35, h * 0.76); g.lineTo(w * 0.65, h * 0.76); g.quadraticCurveTo(w * 0.9, h * 0.8, w * 0.95, h); g.closePath(); g.fillStyle = P.top || '#3a4a5a'; g.fill();
}
// 黒い額の写真立て
export function frame(g, x, y, w, h, draw, { ribbon = false } = {}) {
  fillRR(g, x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, 4, '#141010');
  g.save(); g.beginPath(); g.rect(x - w / 2, y - h / 2, w, h); g.clip(); g.translate(x - w / 2, y - h / 2); draw(g, w, h); g.restore();
  if (ribbon) { poly(g, [[x - w / 2 - 12, y - h / 2 - 12], [x - w / 2 + 34, y - h / 2 - 12], [x - w / 2 - 12, y - h / 2 + 34]], '#050505'); poly(g, [[x + w / 2 + 12, y - h / 2 - 12], [x + w / 2 - 34, y - h / 2 - 12], [x + w / 2 + 12, y - h / 2 + 34]], '#050505'); }
}

// ---------- 向かいの4号棟 ----------
// 窓の並び：5列×5階。target＝4階の真ん中（x=540, y=640）
const COLS = [-20, 260, 540, 820, 1100], ROWS = [400, 640, 880, 1120, 1360];
export const OPP = { x: 540, y: 640 };
// lit＝あかりのついた窓 [[col,row],...]、tLit＝4階の真ん中のあかり 0..1、sil＝人影、ihai＝窓辺の位牌、sway＝カーテンの揺れ、dawn 0..1、frame＝こちらの窓枠
export function oppView(g, { t = 0, dawn = 0, lit = [[0, 3], [3, 1], [1, 4], [4, 2]], tLit = 0, sil = 0, ihai: ih = 0, sway = 0, frame: fr = 1, wave = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#070b18', '#5a6a8c', dawn)], [0.5, mix('#0e1428', '#a8a8b4', dawn)], [1, mix('#141a2a', '#d6c4b0', dawn)]]);
  // 棟（コンクリート）
  const wallC = mix('#24262c', '#8a8a86', dawn);
  fillRR(g, -300, 230, W + 600, 1340, 0, wallC); toneRect(g, -300, 230, W + 600, 1340, 'rgba(0,0,0,.18)', 10, 2.2);
  fillRR(g, -300, 210, W + 600, 30, 0, mix('#1a1c22', '#6a6a66', dawn));
  text(g, '4', 990, 300, { size: 70, color: mix('#3a3c42', '#5a5a56', dawn), weight: 900 });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const x = COLS[c], y = ROWS[r], target = c === 2 && r === 1;
    const on = target ? tLit : lit.some(([a, b]) => a === c && b === r) ? 1 : 0;
    fillRR(g, x - 110, y - 90, 220, 160, 4, mix('#0b0d12', '#3a4050', dawn * 0.6));
    if (on > 0) { g.save(); g.globalAlpha = on; vgrad(g, x - 106, y - 86, 212, 152, [[0, '#ffe2a8'], [1, '#e8b870']]); g.restore(); glow(g, x, y, 220, 'rgba(255,210,140,1)', 0.25 * on * (1 - dawn * 0.7)); }
    // カーテン
    const sw = target ? sway : 0;
    g.save(); g.globalAlpha = 0.8; fillRR(g, x - 106, y - 86, 46 + sw * 30, 152, 2, on > 0 ? '#c9a070' : mix('#15171d', '#4a4e58', dawn)); fillRR(g, x + 60 - sw * 10, y - 86, 46 + sw * 10, 152, 2, on > 0 ? '#c9a070' : mix('#15171d', '#4a4e58', dawn)); g.restore();
    // ベランダの手すり
    fillRR(g, x - 130, y + 76, 260, 64, 2, mix('#2e3036', '#9a9a94', dawn)); for (let i = 0; i < 9; i++) line(g, x - 120 + i * 30, y + 80, x - 120 + i * 30, y + 136, 3, mix('#1a1c20', '#6a6a66', dawn));
  }
  // 4階の真ん中の窓：人影・位牌
  if (sil > 0) {
    g.save(); g.globalAlpha = sil; g.beginPath(); g.rect(OPP.x - 106, OPP.y - 86, 212, 152); g.clip();
    const hx = OPP.x + 10, hy = OPP.y - 20;
    ell(g, hx, hy, 30, 36, '#1a1210'); ell(g, hx, hy + 80, 70, 50, '#1a1210');
    if (wave) { const a = Math.sin(t * 6) * 0.35 * wave; g.save(); g.translate(hx + 50, hy + 50); g.rotate(-0.9 + a); fillRR(g, -10, -80, 20, 80, 10, '#1a1210'); circ(g, 0, -82, 13, '#1a1210'); g.restore(); }
    g.restore();
  }
  if (ih > 0) { g.save(); g.globalAlpha = ih; ihai(g, OPP.x - 40, OPP.y + 10, 0.55); candle(g, OPP.x + 30, OPP.y + 52, t, 0.6, 1); g.restore(); }
  // 中庭（植えこみ・街灯）
  vgrad(g, -300, 1570, W + 600, 700, [[0, mix('#0c1018', '#6a6a60', dawn)], [1, mix('#06080c', '#4a4a44', dawn)]]);
  for (const [x, r] of [[80, 120], [300, 90], [760, 110], [1000, 130]]) ell(g, x, 1600, r, r * 0.6, mix('#0a120c', '#3a4a34', dawn));
  line(g, 560, 1590, 560, 1300, 10, '#1a1c22'); circ(g, 560, 1295, 16, '#fff0c8'); glow(g, 560, 1300, 240, 'rgba(255,230,170,1)', 0.35 * (1 - dawn));
  // こちらの窓枠（アルミサッシ）と、ガラスの映りこみ
  if (fr) {
    fillRR(g, -300, -300, 340, H + 600, 0, '#1a1814'); fillRR(g, W - 40, -300, 340, H + 600, 0, '#1a1814');
    fillRR(g, -300, -300, W + 600, 130, 0, '#1a1814'); fillRR(g, -300, 1720, W + 600, 500, 0, '#1a1814');
    fillRR(g, 30, -170, 20, 1900, 0, '#a9acb0'); fillRR(g, W - 50, -170, 20, 1900, 0, '#a9acb0'); fillRR(g, 30, -170, W - 60, 20, 0, '#a9acb0'); fillRR(g, 30, 1700, W - 60, 20, 0, '#a9acb0');
    fillRR(g, 292, -170, 16, 1890, 0, '#9a9da2');
    g.save(); g.globalAlpha = 0.06; poly(g, [[60, -150], [300, -150], [80, 900], [60, 900]], '#ffffff'); g.restore();
  }
}

// ---------- 団地の6畳 ----------
// morning 0..1（朝の青）、lamp＝蛍光灯、curtain 0 閉→1 開、ihai 1 祭壇に位牌、coat 1 上着がかかっている、notify 0..1 祭壇のスマホが光る
export function danchiRoom(g, { t = 0, morning = 0, lamp = 1, curtain = 0, ihai: ih = 1, coat = 1, notify = 0, P = {}, opp = {}, phone = 1 } = {}) {
  const wa = mix(mix('#4a4436', '#8f866e', lamp), '#6a7288', morning * 0.5);
  vgrad(g, -300, -300, W + 600, 1500, [[0, mix(mix('#2a2620', '#a39a80', lamp), '#7a8298', morning * 0.5)], [1, wa]]);
  toneRect(g, -300, -300, W + 600, 1500, 'rgba(0,0,0,.14)', 10, 2.0);
  fillRR(g, -300, 290, W + 600, 26, 0, Y.wood2);
  // 窓（向かいの棟が見える）
  const wx = 650, wy = 340, ww = 380, wh = 560;
  fillRR(g, wx - 16, wy - 16, ww + 32, wh + 32, 4, '#b9b6ae');
  g.save(); rr(g, wx, wy, ww, wh, 2); g.clip(); g.translate(wx, wy); g.scale(ww / W, wh / 1400); g.translate(0, -250);
  oppView(g, { t, dawn: morning * 0.8, frame: 0, ...opp }); g.restore();
  fillRR(g, wx + ww / 2 - 6, wy, 12, wh, 0, '#a9acb0');
  // カーテン（古いベージュ）
  const cw = lerp(ww / 2 + 40, 60, clamp(curtain));
  for (const sd of [0, 1]) {
    const x0 = sd ? wx + ww + 20 - cw : wx - 20;
    fillRR(g, x0, wy - 30, cw, wh + 70, 4, mix('#7a6a4c', '#a8987a', lamp * 0.6));
    g.save(); g.globalAlpha = 0.25; for (let i = 1; i < 5; i++) line(g, x0 + cw * i / 5, wy - 30, x0 + cw * i / 5, wy + wh + 40, 4, '#3a3020'); g.restore();
  }
  fillRR(g, wx - 40, wy - 44, ww + 80, 16, 4, '#8a8a8a');
  // 父の上着（ハンガー）
  if (coat) {
    g.save(); g.translate(20, 0);
    line(g, 530, 316, 530, 352, 4, '#9a9a9a'); poly(g, [[470, 380], [530, 350], [590, 380]], '#9a9a9a');
    g.beginPath(); g.moveTo(468, 380); g.lineTo(592, 380); g.lineTo(604, 860); g.lineTo(456, 860); g.closePath(); g.fillStyle = '#2c3240'; g.fill();
    g.save(); g.clip(); toneRect(g, 456, 380, 150, 480, 'rgba(0,0,0,.3)', 9, 2.2); g.restore();
    poly(g, [[530, 382], [500, 380], [520, 520]], '#1e222c'); poly(g, [[530, 382], [560, 380], [540, 520]], '#1e222c');
    fillRR(g, 476, 700, 50, 10, 3, '#1e222c'); fillRR(g, 536, 700, 50, 10, 3, '#1e222c');
    g.restore();
  }
  // 壁の家族写真（3号棟の入口の前）
  fillRR(g, 30, 360, 150, 116, 4, Y.wood); g.save(); g.beginPath(); g.rect(40, 370, 130, 96); g.clip(); g.translate(40, 370); entrancePhoto(g, 130, 96, { kid: 'natsuki', P: P.family || {} }); g.restore();
  // 後飾りの祭壇（白い布の2段）
  fillRR(g, 60, 900, 400, 290, 4, Y.cloth); fillRR(g, 110, 720, 300, 190, 4, '#f4f1ea');
  g.save(); g.globalAlpha = 0.18; for (let i = 0; i < 8; i++) line(g, 80 + i * 50, 910, 80 + i * 50, 1185, 3, '#9a9480'); g.restore();
  frame(g, 260, 590, 150, 190, (q, w, h) => dadPortrait(q, w, h, P.dad || { hair: 'parted', hairC: '#9a958e', glasses: true }), { ribbon: true });
  if (ih) ihai(g, 175, 810, 0.95);
  fillRR(g, 300, 760, 90, 110, 6, '#f4f1ea'); g.lineWidth = 3; g.strokeStyle = '#d8d2c2'; rr(g, 300, 760, 90, 110, 6); g.stroke(); line(g, 345, 760, 345, 870, 3, '#d8d2c2');
  candle(g, 110, 1000, t, 0.9, lamp > 0.3 ? 0 : 1); candle(g, 410, 1000, t, 0.9, lamp > 0.3 ? 0 : 1);
  ell(g, 260, 990, 46, 16, '#6a6a6a'); ell(g, 260, 984, 40, 10, '#8a8a8a'); line(g, 260, 984, 262, 930, 2, '#d8d0c0');
  for (const sd of [-1, 1]) { line(g, 260 + sd * 120, 990, 260 + sd * 140, 930, 3, '#3a5a2a'); circ(g, 260 + sd * 142, 924, 14, '#f4f1ea'); circ(g, 260 + sd * 126, 940, 10, '#f4f1ea'); }
  if (phone) smallPhone(g, 260, 1100, -0.08, { on: notify, s: 0.7, t });
  // 畳
  vgrad(g, -300, 1190, W + 600, 1100, [[0, mix('#4a4630', Y.tatami, lamp * 0.7)], [1, '#2a2818']]);
  g.save(); g.globalAlpha = 0.45; for (let i = -2; i < 8; i++) line(g, -300 + i * 260, 1190, -500 + i * 340, 2300, 4, '#2a2818'); g.restore();
  // ちゃぶ台
  ell(g, 700, 1610, 360, 90, 'rgba(0,0,0,.3)'); ell(g, 700, 1530, 350, 90, Y.wood); ell(g, 700, 1520, 340, 82, '#6a4c36');
  line(g, 500, 1570, 500, 1680, 26, Y.wood2); line(g, 900, 1570, 900, 1680, 26, Y.wood2);
  // 蛍光灯
  glow(g, 540, 80, 900, 'rgba(255,240,200,1)', 0.25 * lamp);
  if (morning > 0) glow(g, 820, 600, 800, 'rgba(170,200,255,1)', 0.3 * morning);
  if (lamp < 0.5) darkness(g, 0.6 * (1 - lamp * 2) * (1 - morning * 0.6), '#05060a', [{ x: 260, y: 900, r: 520, a: 0.9 }, { x: 820, y: 620, r: 420, a: 0.7 }, ...(notify > 0 ? [{ x: 260, y: 1100, r: 420, a: notify }] : [])]);
}

// ---------- 夜の団地の外観（3号棟と4号棟が中庭をはさんで向かい合う） ----------
export function danchiNight(g, { t = 0, dawn = 0, litA = 1, litB = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#060a16', '#4a5a7c', dawn)], [1, mix('#141a2c', '#c9b8a8', dawn)]]);
  const R = rng(5); for (let i = 0; i < 40; i++) circ(g, R() * W, R() * 400, 1.5, `rgba(255,255,255,${0.4 * (1 - dawn)})`);
  const block = (x0, y0, w, h, label, hi, hiOn) => {
    poly(g, [[x0, y0], [x0 + w, y0 + 40], [x0 + w, y0 + h + 40], [x0, y0 + h]], mix('#1c1e24', '#7a7a76', dawn));
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const x = x0 + 30 + c * (w - 40) / 6, y = y0 + 50 + r * (h - 80) / 5 + c * 40 / 6, on = hi && hi[0] === c && hi[1] === r ? hiOn : ((c * 7 + r * 3) % 5 === 0 ? 0.6 : 0);
      fillRR(g, x, y, (w - 40) / 6 - 18, (h - 80) / 5 - 34, 2, on > 0 ? `rgba(255,214,150,${on})` : mix('#0a0c10', '#3a3e48', dawn));
    }
    text(g, label, x0 + w - 60, y0 + 90, { size: 54, color: mix('#3a3c44', '#4a4a46', dawn), weight: 900 });
  };
  block(-80, 520, 560, 900, '3', [3, 1], litA);
  block(600, 640, 560, 900, '4', [2, 1], litB);
  vgrad(g, -300, 1440, W + 600, 800, [[0, mix('#0a0e16', '#5a5a52', dawn)], [1, '#06080c']]);
  line(g, 540, 1600, 540, 1300, 8, '#1a1c22'); circ(g, 540, 1296, 14, '#fff0c8'); glow(g, 540, 1300, 260, 'rgba(255,230,170,1)', 0.4 * (1 - dawn));
}

// ---------- スマホの画面 ----------
const AV = (p, x, y, r, s, col = '#6a5a4a') => { circ(p, x, y, r, col); text(p, s, x, y + r * 0.06, { size: r * 1.0, color: '#fff', weight: 900 }); };
// ロック画面（全画面）。notifs=[{t,name,body,time,av}]。date＝'12月5日 土曜日'
export function lock(g, { t = 0, date = '12月5日 土曜日', clock = '7:00', notifs = [], dim = 0, glowA = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#121a30'], [0.6, '#0c1222'], [1, '#070a14']]);
  // 壁紙：夜明けの窓の写真（父が撮った向かいの棟）
  g.save(); g.globalAlpha = 0.14; oppView(g, { t, dawn: 0.3, frame: 0, tLit: 0, lit: [] }); g.restore();
  vgrad(g, -300, -300, W + 600, H + 600, [[0, 'rgba(8,12,24,.55)'], [1, 'rgba(8,12,24,.8)']]);
  text(g, date, 540, 200, { size: 42, color: 'rgba(255,255,255,.85)', weight: 500 });
  text(g, clock, 540, 330, { size: 190, color: '#f4f6fa', weight: 500 });
  let y = 480;
  for (const n of notifs) {
    const a = easeOut(clamp((t - (n.t || 0)) / 0.3)); if (a <= 0) continue;
    const lines = String(n.body || '').split('\n'), hh = 140 + lines.length * 56;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * -40);
    fillRR(g, 60, y, 960, hh, 44, 'rgba(236,240,250,.17)');
    AV(g, 145, y + 80, 46, n.av || 'カ', n.col || '#7a6250');
    text(g, 'メッセージ', 215, y + 58, { size: 30, color: 'rgba(255,255,255,.7)', align: 'left', weight: 500 });
    text(g, n.time || '今', 980, y + 58, { size: 30, color: 'rgba(255,255,255,.6)', align: 'right', weight: 500 });
    text(g, n.name || 'カズミ', 215, y + 108, { size: 46, color: '#fff', align: 'left', weight: 800 });
    lines.forEach((s, i) => text(g, s, 215, y + 166 + i * 56, { size: 42, color: 'rgba(255,255,255,.92)', align: 'left', weight: 600 }));
    g.restore(); y += hh + 26;
  }
  if (glowA && notifs.length) glow(g, 540, 720, 700, 'rgba(200,215,255,1)', 0.12 * glowA);
  if (dim) { g.save(); g.globalAlpha = dim; g.fillStyle = '#000'; g.fillRect(-300, -300, W + 600, H + 600); g.restore(); }
}
// メッセージの画面（電話の枠の中）。msgs=[{d:'日付'}|{text,me,time}]、scroll＝上にずらす量
export function msgList(p, w, h, { t = 9, name = 'カズミ', msgs = [], scroll = 0, hi = -1, av = 'カ' } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14161c'], [1, '#0c0d12']]);
  let y = 190 - scroll;
  msgs.forEach((m, i) => {
    const a = clamp((t - (m.t || 0)) / 0.25); if (a <= 0) return;
    p.save(); p.globalAlpha = a;
    if (m.d) { p.font = `800 26px ${FONT}`; const dw = p.measureText(m.d).width + 40; fillRR(p, w / 2 - dw / 2, y, dw, 44, 22, 'rgba(255,255,255,.1)'); text(p, m.d, w / 2, y + 23, { size: 26, color: '#a9aebb', weight: 700 }); p.restore(); y += 70; return; }
    p.font = `800 38px ${FONT}`;
    const lines = String(m.text).split('\n'), bw = Math.min(w - 170, Math.max(...lines.map(s => p.measureText(s).width)) + 56), bh = lines.length * 52 + 36;
    const x = m.me ? w - 30 - bw : 100;
    if (!m.me) AV(p, 56, y + 34, 30, av, '#7a6250');
    if (i === hi) { p.save(); p.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5); fillRR(p, x - 10, y - 10, bw + 20, bh + 20, 34, Y.amber); p.restore(); }
    fillRR(p, x, y, bw, bh, 28, m.me ? Y.amber : '#e9e6df');
    lines.forEach((s, k) => text(p, s, x + 28, y + 42 + k * 52, { size: 38, color: '#14161c', align: 'left' }));
    if (m.time) text(p, m.time, m.me ? x - 12 : x + bw + 12, y + bh - 14, { size: 24, color: '#8a90a0', align: m.me ? 'right' : 'left', weight: 600 });
    p.restore(); y += bh + 24;
  });
  // ヘッダー（上に重ねる）
  fillRR(p, 0, 0, w, 160, 0, '#1c1f28'); text(p, '‹', 40, 96, { size: 64, color: Y.amber, weight: 500 });
  AV(p, 130, 92, 38, av, '#7a6250'); text(p, name, 190, 92, { size: 44, color: '#fff', align: 'left' });
}
// パスコードの画面。n＝入力した桁数、wrong 0..1（震えて赤）、label＝下の小さな文字
export function passcode(p, w, h, { t = 0, n = 0, wrong = 0, label = '' } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#1a2238'], [1, '#0b0f1c']]);
  const sh = wrong > 0 && wrong < 1 ? Math.sin(wrong * 40) * 26 * (1 - wrong) : 0;
  text(p, 'パスコードを入力', w / 2, 150, { size: 40, color: '#fff', weight: 700 });
  for (let i = 0; i < 4; i++) { const x = w / 2 - 105 + i * 70 + sh; p.lineWidth = 4; p.strokeStyle = wrong > 0 && wrong < 1 ? '#ff7a7a' : '#fff'; p.beginPath(); p.arc(x, 240, 16, 0, 7); p.stroke(); if (i < n) circ(p, x, 240, 16, wrong > 0 && wrong < 1 ? '#ff7a7a' : '#fff'); }
  if (label) text(p, label, w / 2, 310, { size: 30, color: wrong > 0 ? '#ff9a8a' : Y.amber2, weight: 700 });
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''], kr = 66, top = h < 1300 ? 410 : 480, gap = h < 1300 ? 150 : 170;
  keys.forEach((k, i) => { if (!k) return; const x = w / 2 + ((i % 3) - 1) * 190, y = top + Math.floor(i / 3) * gap; circ(p, x, y, kr, 'rgba(255,255,255,.14)'); text(p, k, x, y + 2, { size: 60, color: '#fff', weight: 500 }); });
}
// 通話の画面。mode＝'call'（呼び出し）|'talk'（通話中）|'in'（着信）|'end'
export function callUI(p, w, h, { t = 0, name = 'カズミ', sub = '', mode = 'talk', av = 'カ', col = '#7a6250' } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#1a1e2a'], [1, '#0b0d14']]);
  const ay = h < 1300 ? 280 : 420;
  if (mode === 'call' || mode === 'in') { const k = (t * 1.1) % 1; p.save(); p.globalAlpha = 1 - k; p.lineWidth = 6; p.strokeStyle = Y.amber; p.beginPath(); p.arc(w / 2, ay, 120 + k * 130, 0, 7); p.stroke(); p.restore(); }
  AV(p, w / 2, ay, 112, av, col);
  text(p, name, w / 2, ay + 200, { size: 64, color: '#fff' });
  const sb = sub || (mode === 'call' ? '呼び出し中…' : mode === 'in' ? '着信' : mode === 'end' ? '通話終了' : `通話中　0:${String(Math.floor(t) % 60).padStart(2, '0')}`);
  text(p, sb, w / 2, ay + 275, { size: 34, color: mode === 'end' ? '#ff8a7a' : Y.amber2, weight: 700 });
  const hY = h - (h < 1300 ? 110 : 170);
  if (mode === 'in') { circ(p, w / 2 - 170, hY, 62, '#ff3b4a'); circ(p, w / 2 + 170, hY, 62, '#36c26f'); }
  else if (mode !== 'end') { circ(p, w / 2, hY, 66, '#ff3b4a'); fillRR(p, w / 2 - 30, hY - 8, 60, 16, 8, '#fff'); }
}
// ボイスメモの画面。play 0..1（再生位置）
export function memoScreen(p, w, h, { t = 0, play = 0, playing = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#15161c'], [1, '#0b0c10']]);
  text(p, 'ボイスメモ', 50, 110, { size: 52, color: '#fff', align: 'left' });
  const rows = [['新規録音 12', '12月1日　0:14', '2:31'], ['新規録音 11', '11月24日', '0:48'], ['新規録音 10', '11月10日', '1:12']];
  rows.forEach(([a, b, c], i) => {
    const y = 180 + (i ? 330 + i * 120 : 0);
    if (i === 0) {
      fillRR(p, 24, y, w - 48, 310, 28, 'rgba(255,255,255,.07)');
      text(p, a, 60, y + 56, { size: 40, color: '#fff', align: 'left' }); text(p, b, 60, y + 104, { size: 28, color: Y.amber2, align: 'left', weight: 700 });
      p.save(); p.lineWidth = 5; p.lineCap = 'round';
      for (let k = 0; k < 60; k++) { const x = 60 + k * ((w - 120) / 60), amp = (8 + 50 * Math.abs(noise1(k * 0.5, 3))) * (k / 60 < play ? 1 : 0.6); p.strokeStyle = k / 60 < play ? Y.amber : 'rgba(255,255,255,.35)'; p.beginPath(); p.moveTo(x, y + 190 - amp); p.lineTo(x, y + 190 + amp); p.stroke(); }
      p.restore();
      line(p, 60 + (w - 120) * play, y + 130, 60 + (w - 120) * play, y + 250, 4, '#fff');
      circ(p, w / 2, y + 280, 0.1, '#fff');
      if (playing) { fillRR(p, w / 2 - 22, y + 262, 14, 40, 3, '#fff'); fillRR(p, w / 2 + 8, y + 262, 14, 40, 3, '#fff'); } else poly(p, [[w / 2 - 14, y + 260], [w / 2 + 22, y + 282], [w / 2 - 14, y + 304]], '#fff');
    } else {
      text(p, a, 60, y + 40, { size: 36, color: '#cfd2da', align: 'left', weight: 700 }); text(p, b, 60, y + 84, { size: 26, color: '#8a90a0', align: 'left', weight: 600 });
      text(p, c, w - 60, y + 60, { size: 28, color: '#8a90a0', align: 'right', weight: 600 }); line(p, 50, y + 110, w - 50, y + 110, 2, 'rgba(255,255,255,.08)');
    }
  });
}

// ---------- 通帳 ----------
// rows=[[日付,摘要,金額]]、hi＝黄色のマーカー 0..1（上から順に引く）
export function passbook(g, { t = 0, rows = [], hi = 0, title = '普通預金' } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a241c'], [1, '#14110c']]);
  g.save(); g.translate(540, 600); g.rotate(-0.03);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 50; fillRR(g, -470, -480, 940, 960, 10, '#efe9d6'); g.shadowColor = 'transparent';
  fillRR(g, -470, -480, 940, 110, 10, '#5a7088'); text(g, title, -420, -425, { size: 46, color: '#fff', align: 'left', weight: 800 }); text(g, '井上 タツオ 様', 420, -425, { size: 36, color: '#fff', align: 'right', weight: 700 });
  const cx = [-430, -180, 160, 420];
  ['年月日', 'お取引内容', 'お支払金額'].forEach((s, i) => text(g, s, i === 2 ? 420 : cx[i], -330, { size: 30, color: '#5a6a7a', align: i === 2 ? 'right' : 'left', weight: 700 }));
  line(g, -450, -300, 450, -300, 3, '#9aa8b4');
  rows.forEach(([d, s, a], i) => {
    const y = -250 + i * 92;
    const k = clamp(hi * rows.length - i);
    if (k > 0) { g.save(); g.globalAlpha = 0.55; fillRR(g, -450, y - 30, 900 * k, 60, 8, Y.amber); g.restore(); }
    text(g, d, cx[0], y, { size: 36, color: '#2a2e36', align: 'left', weight: 700 });
    text(g, s, cx[1], y, { size: 36, color: '#2a2e36', align: 'left', weight: 700 });
    text(g, a, 420, y, { size: 38, color: '#2a2e36', align: 'right', weight: 800 });
    line(g, -450, y + 46, 450, y + 46, 1.5, '#c9d0d6');
  });
  g.restore();
}

// ---------- 古い新聞の記事 ----------
export function oldNews(g, { t = 0, k = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1c1a18'], [1, '#0e0d0c']]);
  g.save(); g.translate(540, 680); g.rotate(0.025);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; fillRR(g, -440, -460, 880, 900, 4, '#e6dcc4'); g.shadowColor = 'transparent';
  text(g, '2006年（平成18年）12月8日', -400, -410, { size: 28, color: '#5a5040', align: 'left', weight: 700 });
  line(g, -420, -380, 420, -380, 3, '#5a5040');
  g.font = `900 72px ${SERIF}`;
  text(g, '団地前でひき逃げ', 0, -300, { size: 78, color: '#141210', weight: 900, font: SERIF });
  text(g, '自転車の男性死亡', 0, -200, { size: 70, color: '#141210', weight: 900, font: SERIF });
  text(g, 'みどり台　車は逃走', 0, -110, { size: 40, color: '#2a2620', weight: 700, font: SERIF });
  g.save(); g.globalAlpha = 0.6; for (let c = 0; c < 2; c++) for (let r = 0; r < 9; r++) fillRR(g, -400 + c * 420, -40 + r * 44, 380 - (r === 8 ? 140 : 0), 18, 3, '#7a7060'); g.restore();
  fillRR(g, -400, 360, 220, 30, 3, '#3a3428');
  g.restore();
}

// ---------- 上着のポケット（手が写真を引き出す） ----------
export function coatPocket(g, { t = 0, pull = 0, img = null } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2c3240'], [1, '#1a1e28']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.25)', 9, 2.2);
  line(g, 700, -300, 660, 2200, 8, '#1a1e28');
  for (let i = 0; i < 4; i++) circ(g, 750, 160 + i * 380, 22, '#14161c');
  const py = lerp(1000, 560, ease(clamp(pull)));
  // 写真（ポケットの口より上だけ見える）
  if (pull > 0) {
    g.save(); g.beginPath(); g.rect(-300, -300, W + 600, 1100); g.clip();
    g.save(); g.translate(400, py); g.rotate(-0.1 + 0.08 * pull);
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 30; fillRR(g, -170, -230, 340, 460, 6, '#efe9dc'); g.shadowColor = 'transparent';
    if (img) { g.save(); g.beginPath(); g.rect(-150, -210, 300, 360); g.clip(); g.translate(-150, -210); img(g, 300, 360); g.restore(); }
    g.restore(); g.restore();
  }
  // ポケット（口と縫い目）
  fillRR(g, 130, 800, 540, 440, 24, '#272d3a'); toneRect(g, 130, 800, 540, 440, 'rgba(0,0,0,.25)', 9, 2.2);
  fillRR(g, 120, 780, 560, 70, 14, '#20252f'); g.save(); g.setLineDash([14, 12]); g.lineWidth = 4; g.strokeStyle = '#3a4252'; rr(g, 146, 860, 508, 360, 18); g.stroke(); g.restore();
  // 手（右から写真の端をつまむ）
  if (pull > 0) {
    const hx = 560, hy = py + 120;
    line(g, W + 300, hy + 420, hx + 40, hy + 30, 130, '#3a3a44');
    ell(g, hx, hy, 64, 54, C.skin, -0.5); fillRR(g, hx - 80, hy - 30, 70, 34, 16, C.skin);
  }
}

// ---------- 玄関の鍵（ひとりでに回る） ----------
export function doorLock(g, { t = 0, k = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#4a4e56'], [1, '#2a2d33']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.18)', 10, 2.2);
  fillRR(g, 380, 300, 320, 860, 30, '#8a8e96'); fillRR(g, 404, 324, 272, 812, 24, '#a9aeb6');
  // ドアノブ
  fillRR(g, 430, 820, 260, 70, 34, '#c9ced4'); circ(g, 470, 855, 46, '#b9bec6');
  // サムターン
  const a = lerp(0, -Math.PI / 2, ease(k));
  g.save(); g.translate(540, 560); circ(g, 0, 0, 100, '#6a6e76'); g.rotate(a); fillRR(g, -24, -120, 48, 240, 20, '#d9dde2'); g.restore();
  circ(g, 540, 1020, 30, '#3a3e46'); fillRR(g, 534, 1000, 12, 40, 4, '#1a1c20');
}

// ---------- カズミの部屋（4号棟405） ----------
// 窓の下に交差点、窓辺に夫の写真と父の位牌
export function kazumiRoom(g, { t = 0, dawn = 0, P = {}, ihai: ih = 1, candleOn = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, 1500, [[0, mix('#2a2420', '#5a5868', dawn)], [1, mix('#5a4c3c', '#7a7684', dawn)]]);
  toneRect(g, -300, -300, W + 600, 1500, 'rgba(0,0,0,.18)', 10, 2.0);
  // 窓（見下ろす交差点）
  const wx = 470, wy = 260, ww = 560, wh = 640;
  fillRR(g, wx - 16, wy - 16, ww + 32, wh + 32, 4, '#b9b6ae');
  g.save(); rr(g, wx, wy, ww, wh, 2); g.clip(); g.translate(wx, wy); g.scale(ww / W, wh / H);
  crossingDown(g, { t, dawn }); g.restore();
  fillRR(g, wx + ww / 2 - 6, wy, 12, wh, 0, '#a9acb0');
  fillRR(g, wx - 30, wy + wh + 10, ww + 60, 40, 4, '#c9c2b0');
  // 窓辺：夫の写真・父の位牌・ろうそく
  frame(g, 600, 836, 120, 150, (q, w, h) => shinPortrait(q, w, h, P.shin || { hair: 'messy', hairC: '#1a1a1a' }));
  if (ih) ihai(g, 760, 856, 0.8);
  candle(g, 880, 906, t, 0.8, candleOn);
  // 左：たんす
  fillRR(g, 40, 560, 360, 640, 6, '#5a4434'); for (let i = 0; i < 4; i++) { fillRR(g, 60, 590 + i * 150, 320, 130, 4, '#6a5240'); fillRR(g, 200, 645 + i * 150, 40, 12, 4, '#c9b48a'); }
  // 床
  vgrad(g, -300, 1200, W + 600, 1100, [[0, mix('#4a3c30', '#5a5660', dawn)], [1, '#221a14']]);
  glow(g, 540, 100, 900, 'rgba(255,230,190,1)', 0.18 * (1 - dawn));
}
// 4階から見下ろした交差点（カズミの窓の中）
export function crossingDown(g, { t = 0, dawn = 0, man = 0 } = {}) {
  vgrad(g, 0, 0, W, H, [[0, mix('#1a2030', '#8a96aa', dawn)], [1, mix('#10141e', '#6a7080', dawn)]]);
  // 道路（斜めの十字）
  poly(g, [[-200, 900], [W + 200, 600], [W + 200, 1100], [-200, 1400]], mix('#22252c', '#55575c', dawn));
  poly(g, [[300, -200], [700, -200], [860, H + 200], [380, H + 200]], mix('#22252c', '#55575c', dawn));
  for (let i = 0; i < 7; i++) { const y = 1010 + i * 22, x = 360 + i * 70; poly(g, [[x, y - 120], [x + 40, y - 130], [x + 70, y + 160], [x + 30, y + 170]], mix('#9a9a96', '#e6e6e0', dawn)); }
  // 歩道と花
  line(g, 300, 800, 270, 1300, 10, '#9a9a96'); circ(g, 290, 1040, 22, '#f4f1ea'); circ(g, 270, 1060, 16, '#f4f1ea');
  // 信号
  line(g, 240, 700, 240, 1000, 10, '#3a3c40'); fillRR(g, 210, 660, 60, 90, 8, '#1a1c20'); circ(g, 240, 690, 14, '#ff5a4a'); glow(g, 240, 690, 90, 'rgba(255,90,74,1)', 0.4);
  if (man) figure(g, { hair: 'parted', hairC: '#8a8580', top: '#3a3e48', top2: '#2e323a', bottom: '#2a2a30', shoes: '#111', tall: 1 }, { x: 300, y: 1080, s: 0.5, lightFrom: 'left' });
}

// ---------- 朝の交差点（道路の高さから） ----------
// signal＝'red'|'green'、truck＝トラックの位置 0..1（-1 で出さない）、flowers＝ガードレールの白い花
export function crossing(g, { t = 0, dawn = 0.5, signal = 'red', truck = -1, flowers = 1, blink = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, 1200, [[0, mix('#101830', '#7a8cae', dawn)], [1, mix('#2a3048', '#e2c8b0', dawn)]]);
  // 奥の団地（3号棟・4号棟）
  for (const [x0, lab] of [[-120, '3'], [600, '4']]) {
    fillRR(g, x0, 420, 600, 640, 0, mix('#1a1c24', '#8a8c92', dawn));
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) fillRR(g, x0 + 30 + c * 95, 450 + r * 120, 60, 70, 2, (c + r * 2 + x0) % 7 === 0 ? 'rgba(255,214,150,.8)' : mix('#0a0c10', '#5a5e68', dawn));
    text(g, lab, x0 + 540, 480, { size: 50, color: mix('#3a3c44', '#5a5a56', dawn), weight: 900 });
  }
  // 歩道（奥）・道路・横断歩道
  fillRR(g, -300, 1060, W + 600, 50, 0, mix('#3a3a3c', '#9a9690', dawn));
  vgrad(g, -300, 1110, W + 600, 440, [[0, mix('#24262c', '#5a5c62', dawn)], [1, mix('#1a1c20', '#46484e', dawn)]]);
  for (let i = 0; i < 9; i++) { const x = 300 + i * 56; poly(g, [[x, 1120], [x + 30, 1120], [x + 20 + (i - 4) * 18, 1540], [x - 20 + (i - 4) * 18, 1540]], mix('#8a8a86', '#e6e4de', dawn)); }
  line(g, -300, 1330, W + 300, 1330, 6, mix('#7a6a2a', '#d8c060', dawn), 'butt');
  // トラック
  if (truck >= 0) {
    const x = lerp(-900, W + 900, truck);
    fillRR(g, x - 420, 900, 620, 380, 10, '#d8dade'); fillRR(g, x + 200, 1000, 220, 280, 16, '#3a5a8a'); fillRR(g, x + 260, 1030, 130, 100, 8, '#9ab8d8');
    for (const wx of [x - 300, x - 100, x + 310]) { circ(g, wx, 1290, 56, '#141414'); circ(g, wx, 1290, 24, '#6a6a6a'); }
    glow(g, x + 420, 1200, 300, 'rgba(255,240,200,1)', 0.5);
    g.save(); g.globalAlpha = 0.3; for (let i = 0; i < 6; i++) line(g, x - 520 - i * 60, 950 + i * 50, x - 860 - i * 60, 950 + i * 50, 6, '#cfd6e0'); g.restore();
  }
  // 手前の歩道
  vgrad(g, -300, 1550, W + 600, 700, [[0, mix('#3a3a3e', '#a8a49c', dawn)], [1, mix('#1c1c20', '#6a6660', dawn)]]);
  line(g, -300, 1550, W + 300, 1550, 14, mix('#5a5a5c', '#c9c4ba', dawn), 'butt');
  // ガードレール・信号・花
  for (let i = 0; i < 2; i++) { const y = 1480 + i * 40; line(g, 640, y, W + 300, y, 18, mix('#8a8e94', '#e0e2e6', dawn), 'butt'); }
  for (const x of [680, 900]) line(g, x, 1470, x, 1580, 14, mix('#8a8e94', '#e0e2e6', dawn));
  line(g, 160, 820, 160, 1600, 18, '#3a3c40');
  fillRR(g, 110, 820, 100, 200, 12, '#1a1c20');
  const on = blink ? (Math.sin(t * 8) > 0 ? 1 : 0.2) : 1;
  if (signal === 'red') { fillRR(g, 125, 840, 70, 70, 10, `rgba(255,80,70,${on})`); glow(g, 160, 875, 180, 'rgba(255,80,70,1)', 0.45 * on); fillRR(g, 125, 930, 70, 70, 10, '#20301f'); }
  else { fillRR(g, 125, 840, 70, 70, 10, '#301f1f'); fillRR(g, 125, 930, 70, 70, 10, `rgba(80,230,140,${on})`); glow(g, 160, 965, 180, 'rgba(80,230,140,1)', 0.45 * on); }
  if (flowers) { const fx = 230, fy = 1590; line(g, fx - 20, fy, fx - 40, fy - 90, 4, '#3a5a2a'); line(g, fx + 10, fy, fx + 20, fy - 100, 4, '#3a5a2a'); line(g, fx, fy, fx, fy - 110, 4, '#3a5a2a'); for (const [dx, dy] of [[-42, -96], [22, -104], [0, -116], [-20, -84], [14, -88]]) circ(g, fx + dx, fy + dy, 16, '#f4f1ea'); fillRR(g, fx - 34, fy - 40, 68, 46, 8, 'rgba(240,236,226,.6)'); }
  if (dawn > 0.3) glow(g, 900, 300, 900, 'rgba(255,220,180,1)', 0.25 * dawn);
}

// ---------- 車いすに座る人（足元 x,y） ----------
export function wheelchair(g, P, { x = 540, y = 1700, s = 1, ...o } = {}) {
  const r = 44 * s;
  // 後ろの大きな車輪
  g.save(); g.lineWidth = 12 * s; g.strokeStyle = '#2a2c30'; g.beginPath(); g.arc(x + 40 * s, y - 120 * s, 120 * s, 0, 7); g.stroke();
  g.lineWidth = 4 * s; g.strokeStyle = '#9aa0a8'; g.beginPath(); g.arc(x + 40 * s, y - 120 * s, 104 * s, 0, 7); g.stroke();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line(g, x + 40 * s, y - 120 * s, x + 40 * s + Math.cos(a) * 104 * s, y - 120 * s + Math.sin(a) * 104 * s, 2 * s, '#7a8088'); }
  g.restore();
  circ(g, x - 120 * s, y - 30 * s, 30 * s, '#2a2c30');
  // 座面・背もたれ・押し手
  fillRR(g, x - 110 * s, y - 200 * s, 190 * s, 26 * s, 6 * s, '#3a3e48');
  line(g, x + 70 * s, y - 200 * s, x + 90 * s, y - 440 * s, 12 * s, '#8a9098'); line(g, x + 90 * s, y - 440 * s, x + 150 * s, y - 446 * s, 14 * s, '#2a2c30');
  // 体（座った姿）：脚・胴・腕・頭
  line(g, x - 60 * s, y - 196 * s, x - 150 * s, y - 196 * s, 42 * s, P.bottom, 'butt'); line(g, x - 150 * s, y - 196 * s, x - 150 * s, y - 40 * s, 38 * s, P.bottom, 'butt'); ell(g, x - 140 * s, y - 34 * s, 30 * s, 12 * s, P.shoes || '#ccc');
  g.beginPath(); g.moveTo(x - 70 * s, y - 190 * s); g.lineTo(x + 60 * s, y - 190 * s); g.lineTo(x + 50 * s, y - 420 * s); g.quadraticCurveTo(x - 10 * s, y - 440 * s, x - 70 * s, y - 420 * s); g.closePath(); g.fillStyle = P.top; g.fill();
  g.save(); g.clip(); g.beginPath(); g.rect(x - 10 * s, y - 450 * s, 90 * s, 270 * s); toneFill(g, 'rgba(0,0,0,.4)', 9, 2.4); g.restore();
  line(g, x - 50 * s, y - 400 * s, x - 70 * s, y - 280 * s, 30 * s, P.top2); line(g, x - 70 * s, y - 280 * s, x - 130 * s, y - 230 * s, 28 * s, P.top2); circ(g, x - 134 * s, y - 228 * s, 16 * s, C.skin);
  // ひざかけ
  fillRR(g, x - 170 * s, y - 230 * s, 160 * s, 140 * s, 20 * s, o.blanket || '#8a6a5a');
  head(g, P, x - 6 * s, y - 470 * s - r * 0.9, r, o);
}

// ---------- 第3話から ----------
// 家の車の写真（3号棟の前の駐車場・昼）。dent＝前のへこみ（最終話）
export function carPhoto2(g, w, h, { dent = 0 } = {}) {
  vgrad(g, 0, 0, w, h, [[0, '#a9c3d6'], [1, '#e6dcc6']]);
  fillRR(g, 0, h * 0.1, w, h * 0.5, 0, '#c9c4b6'); for (let i = 0; i < 5; i++) fillRR(g, w * 0.04 + i * w * 0.2, h * 0.16, w * 0.13, h * 0.1, 2, '#8a96a2');
  vgrad(g, 0, h * 0.6, w, h * 0.4, [[0, '#8a8680'], [1, '#6a665e']]);
  const s = w / 600, x = w * 0.5, y = h * 0.8;
  g.save(); g.translate(x, y); g.scale(s, s);
  ell(g, 0, 18, 270, 22, 'rgba(0,0,0,.3)');
  fillRR(g, -260, -100, 520, 100, 40, '#8a2a2e'); poly(g, [[-150, -100], [-90, -190], [110, -190], [180, -100]], '#8a2a2e');
  poly(g, [[-130, -104], [-82, -178], [0, -178], [0, -104]], '#bcd0e0'); poly(g, [[14, -104], [14, -178], [100, -178], [160, -104]], '#bcd0e0');
  for (const wx of [-160, 160]) { circ(g, wx, 0, 46, '#1a1a1a'); circ(g, wx, 0, 20, '#9a9a9a'); }
  fillRR(g, 230, -70, 30, 20, 6, '#ffe8a8');
  if (dent) { g.save(); g.globalAlpha = dent; ell(g, 236, -40, 26, 30, 'rgba(30,10,10,.45)'); line(g, 220, -60, 250, -20, 3, '#3a1414'); g.restore(); }
  g.restore();
  g.save(); g.globalAlpha = 0.14; g.fillStyle = '#e8c890'; g.fillRect(0, 0, w, h); g.restore();
}
// たんすの引き出しの中の通帳の束
export function passbookDrawer(g, { t = 0, open = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a2a1e'], [1, '#1e160f']]);
  fillRR(g, 90, 520, 900, 700, 10, '#5a4434'); fillRR(g, 120, 550, 840, 640, 6, '#2a1e16');
  for (let i = 0; i < 9; i++) { const x = 170 + (i % 5) * 150, y = 640 + Math.floor(i / 5) * 230 + (i % 2) * 14; g.save(); g.translate(x + 60, y + 90); g.rotate((i % 3 - 1) * 0.05); fillRR(g, -60, -90, 120, 180, 6, i % 2 ? '#4a6a8a' : '#5a7a98'); fillRR(g, -60, -90, 120, 34, 6, '#3a5272'); text(g, '通帳', 0, 10, { size: 26, color: '#e8eef4', weight: 800 }); g.restore(); }
  line(g, 170, 980, 900, 980, 6, '#c9b48a'); // 輪ゴムの束
  fillRR(g, 60, 1220, 960, 70, 8, '#4a3626'); fillRR(g, 470, 1240, 140, 20, 8, '#c9b48a');
}
