// 「#拡散希望」の背景：アカリの部屋・玄関・マンションの外・裏通り・ミサキの部屋・拡散された写真
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text } from './core.js';
import { C, toneRect, toneFill, CAST2, figure, head, close } from './noir.js';
import { K } from './sns.js';

const P = CAST2;
// 朝の冷たい空
export function morningSky(g, { y0 = -300, h = H + 600 } = {}) { vgrad(g, -400, y0, W + 800, h, [[0, '#7d8ea6'], [0.6, '#b4bfcc'], [1, '#d6d9dc']]); }

// アカリの部屋（朝・カーテン越しの光・ベッドで光るスマホ）
export function akariRoom(g, { t = 0, phone = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a4456'], [1, '#232a38']]);
  fillRR(g, 600, 200, 400, 560, 6, '#a9b6c8'); fillRR(g, 560, 180, 120, 600, 10, '#5a6a84'); fillRR(g, 920, 180, 120, 600, 10, '#5a6a84');
  glow(g, 800, 480, 520, 'rgba(210,225,245,1)', 0.25);
  vgrad(g, -300, 1250, W + 600, 800, [[0, '#3a3a44'], [1, '#22222a']]);
  fillRR(g, 80, 1080, 940, 300, 30, '#4a5a7a'); fillRR(g, 120, 1030, 300, 110, 46, '#e3e0d8');
  if (phone) { g.save(); g.translate(600, 1150); g.rotate(-0.12 + noise1(t * 40, 1) * 0.02); fillRR(g, -90, -40, 180, 80, 14, '#0d0e12'); fillRR(g, -82, -32, 164, 64, 10, '#ffe7d8'); g.restore(); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 600, 1150, 300, 'rgba(255,140,80,1)', 0.35 + 0.15 * Math.sin(t * 9)); g.restore(); }
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.12)', 9, 2);
}
// 拡散された写真（夜道、スマホを掲げて歩くアカリ・画質が荒い・赤丸）
export function viralPhoto(g, w, h, { circleA = 1 } = {}) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#141a26'], [1, '#2a2a30']]);
  for (let i = 0; i < 5; i++) fillRR(g, -40 + i * 230, 120 + (i % 2) * 40, 200, 400, 4, '#0e121c');
  glow(g, 780, 120, 360, 'rgba(255,220,160,1)', 0.35); fillRR(g, 770, 100, 18, 600, 3, '#0a0c12');
  vgrad(g, 0, 520, 1000, 180, [[0, '#2a2c34'], [1, '#18181e']]);
  // アカリ（後ろ寄りの斜め、右手にスマホを掲げる）
  figure(g, P.akari, { x: 470, y: 690, s: 0.9, turn: -0.4, look: 0.6, arms: [10, 0, 160, -40], phone: true, shadow: false, lightFrom: 'right' });
  // 画質の荒さ
  const R = rng(5); g.globalAlpha = 0.12; for (let i = 0; i < 900; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * 1000, R() * 700, 3, 3); } g.globalAlpha = 1;
  if (circleA > 0) { g.save(); g.globalAlpha = circleA; g.lineWidth = 12; g.strokeStyle = '#ff2a2a'; g.beginPath(); g.ellipse(470, 420, 150, 260, 0.05, 0, 7); g.stroke(); g.restore(); }
  g.font = '500 30px "Noto Sans CJK JP"'; g.fillStyle = 'rgba(255,255,255,.8)'; g.textAlign = 'right'; g.fillText('23:12', 970, 670);
  g.restore();
}
// 地図（ピンがアカリのアパート）
export function addrMap(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  g.fillStyle = '#e6e8ea'; g.fillRect(0, 0, 1000, 700);
  for (let i = 0; i < 9; i++) { line(g, i * 130 - 40, 0, i * 130 + 30, 700, 22, '#fff', 'butt'); line(g, 0, i * 95 - 10, 1000, i * 95 + 30, 16, '#fff', 'butt'); }
  fillRR(g, 80, 80, 220, 180, 20, '#cfe3c8');
  g.save(); g.translate(560, 330); poly(g, [[0, 0], [-34, -60], [34, -60]], K.orange); circ(g, 0, -80, 44, K.orange); circ(g, 0, -80, 16, '#fff'); g.restore();
  fillRR(g, 340, 400, 440, 120, 16, '#fff'); g.font = '800 34px "M PLUS Rounded 1c"'; g.fillStyle = '#2a2530'; g.textAlign = 'center'; g.fillText('〇〇ハイツ 203', 560, 450); g.font = '500 24px "Noto Sans CJK JP"'; g.fillText('駅から徒歩8分', 560, 492);
  g.restore();
}
// 玄関（内側から）：叩かれて揺れるドア・ドアスコープ・チェーン・ドアの下の影
export function frontDoor(g, { t = 0, pound = 0, shadows = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2e38'], [1, '#14161c']]);
  fillRR(g, 120, 200, 840, 1300, 6, '#3a3e4a'); toneRect(g, 120, 200, 840, 1300, 'rgba(0,0,0,.25)', 10, 2.4);
  const sh = pound > 0 ? noise1(t * 40, 2) * 10 * pound : 0;
  g.save(); g.translate(sh, 0);
  fillRR(g, 300, 330, 480, 1100, 4, '#6a6e78'); line(g, 300, 330, 300, 1430, 8, '#2a2e36', 'butt');
  circ(g, 540, 640, 16, '#1a1c22'); circ(g, 540, 640, 7, '#5a5e66'); // ドアスコープ
  fillRR(g, 700, 840, 40, 120, 12, '#b9bcc2'); // ノブ
  // チェーン
  g.lineWidth = 8; g.strokeStyle = '#9a9ea6'; g.beginPath(); g.moveTo(690, 760); g.quadraticCurveTo(620, 820, 560, 770); g.stroke();
  g.restore();
  // ドアの下のすき間から光と足の影
  fillRR(g, 300, 1426, 480, 10, 2, 'rgba(255,240,210,.8)');
  if (shadows) for (let i = 0; i < 4; i++) { const x = 340 + i * 110 + noise1(t * 0.8 + i, i) * 20; fillRR(g, x, 1424, 50, 14, 4, '#05060a'); }
  vgrad(g, -300, 1436, W + 600, 600, [[0, '#3a3a44'], [1, '#18181e']]);
}
// マンションの外：ベランダから隣の非常階段へ
export function aptExterior(g, { t = 0, k = 0 } = {}) {
  morningSky(g);
  fillRR(g, -100, 260, 760, 1800, 6, '#c9c4ba'); toneRect(g, -100, 260, 760, 1800, 'rgba(0,0,0,.18)', 10, 2.4);
  for (let r = 0; r < 4; r++) { const y = 380 + r * 380; fillRR(g, -60, y, 640, 260, 4, '#5a6474'); fillRR(g, -80, y + 220, 680, 30, 4, '#8a8e96'); for (let i = 0; i < 9; i++) line(g, -60 + i * 80, y + 120, -60 + i * 80, y + 220, 6, '#8a8e96', 'butt'); }
  // 隣の建物の非常階段
  fillRR(g, 760, 200, 500, 1900, 6, '#9aa0a8');
  for (let i = 0; i < 12; i++) { const y = 260 + i * 150; line(g, 720, y + 120, 1100, y, 10, '#4a4e56'); line(g, 720, y + 120, 1100, y + 120, 6, '#5a5e66', 'butt'); }
  line(g, 720, 200, 720, 2000, 10, '#4a4e56', 'butt');
  // 跳ぶアカリ（2階のベランダから）
  const x = lerp(470, 820, ease(k)), y = lerp(1000, 1010, k) - Math.sin(k * Math.PI) * 120;
  figure(g, P.akari, { x, y, s: 0.75, turn: 0.6, look: 1, arms: [70, -40, 120, -60], eyes: 'wide', mouth: 'grit', shadow: false });
}
// 裏通り：スマホを見る人たち、フードの人影
export function backStreet(g, { t = 0, run = 1 } = {}) {
  morningSky(g);
  for (let i = 0; i < 4; i++) { const x = -200 + i * 360; fillRR(g, x, 260, 330, 1400, 6, mix('#8a909a', '#a4a8b0', i % 2)); toneRect(g, x, 260, 330, 1400, 'rgba(0,0,0,.2)', 10, 2.4); for (let r = 0; r < 5; r++) fillRR(g, x + 60, 360 + r * 240, 200, 130, 4, '#5a6474'); }
  vgrad(g, -300, 1560, W + 600, 600, [[0, '#7a7a80'], [1, '#4a4a50']]);
  // 通行人（スマホに顔を照らされている）
  const ppl = [[120, 1720, 1.0, 3], [880, 1700, 1.05, 4], [700, 1640, 0.8, 2]];
  for (const [x, y, s, c] of ppl) figure(g, { ...P.kento, top: ['#5a6070', '#7a6a5a', '#6a7a6a', '#4a5a7a', '#7a5a6a'][c], hair: c % 2 ? 'parted' : 'messy' }, { x, y, s, turn: c % 2 ? 0.3 : -0.3, phone: true, arms: [10, 0, 40, -110], look: 0, lookY: 1, eyes: 'narrow' });
  // アカリ（フードをかぶって走る）
  if (run) figure(g, { ...P.akari, hair: 'bob' }, { x: lerp(-100, 1200, (t * 0.12) % 1), y: 1820, s: 1.2, walk: t * 1.8, turn: 0.6, look: 1, arms: [60, -40, -30, 30], eyes: 'narrow', brow: -0.7 });
}
// ミサキの部屋（あたたかい照明・ソファ・本棚・浴室のドア）
export function misakiRoom(g, { t = 0, redDot = 0, bath = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#5a4a44'], [1, '#3a302c']]);
  glow(g, 540, 300, 700, 'rgba(255,214,160,1)', 0.25);
  // 本棚（左上）
  fillRR(g, 40, 280, 300, 760, 8, '#6a4a32'); for (let r = 0; r < 4; r++) { fillRR(g, 56, 300 + r * 185, 268, 160, 4, '#3a2a1e'); for (let i = 0; i < 6; i++) fillRR(g, 66 + i * 42, 320 + r * 185 + (i % 3) * 10, 32, 140 - (i % 3) * 10, 3, ['#8a5a4a', '#4a6a8a', '#d9c8a4', '#6a8a5a', '#a4a4b4', '#8a6aa4'][(i + r) % 6]); }
  if (redDot > 0 && (redDot >= 1 || Math.sin(t * 6) > 0)) { circ(g, 260, 340, 7, '#ff2a2a'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 260, 340, 40, 'rgba(255,40,40,1)', 0.6 * redDot); g.restore(); }
  // 浴室のドア（右）
  fillRR(g, 820, 380, 220, 700, 6, '#d9d2c4'); if (bath) { g.save(); g.globalCompositeOperation = 'lighter'; fillRR(g, 830, 390, 30, 680, 4, 'rgba(255,240,210,.5)'); g.restore(); }
  // 床とラグ
  vgrad(g, -300, 1160, W + 600, 800, [[0, '#7a6450'], [1, '#4a3a2c']]); ell(g, 540, 1460, 520, 140, '#b4a48c');
  // ソファ（こちら向き）
  fillRR(g, 260, 1000, 580, 200, 50, '#8a9aa4'); fillRR(g, 220, 1160, 660, 170, 56, '#9aaab4');
  fillRR(g, 560, 1100, 110, 90, 30, '#e8d8b4');
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.1)', 9, 2);
}
// 投稿された写真：ミサキの部屋のソファに座るアカリを、本棚の上から斜め後ろに撮ったもの
export function sofaPhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#5a4a44'], [1, '#3a302c']]);
  glow(g, 700, 80, 500, 'rgba(255,214,160,1)', 0.3);
  // テレビ台とテレビ（奥）
  fillRR(g, 560, 160, 360, 210, 8, '#14161c'); fillRR(g, 520, 370, 440, 60, 6, '#6a4a32');
  vgrad(g, 0, 430, 1000, 270, [[0, '#7a6450'], [1, '#4a3a2c']]);
  // ソファの背もたれ（手前）とアカリの頭と肩（後ろ姿）
  fillRR(g, 60, 470, 860, 260, 60, '#8a9aa4');
  g.save(); g.translate(430, 470);
  fillRR(g, -150, -40, 300, 200, 90, P.akari.top2); // 肩・フード
  circ(g, 0, -110, 110, P.akari.hairC); fillRR(g, -112, -130, 224, 150, 60, P.akari.hairC); // 後頭部（ボブ）
  g.restore();
  // 手に持ったスマホの光
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 560, 440, 120, 'rgba(255,170,120,1)', 0.5); g.restore();
  // 上からの画角（本棚の縁）
  g.fillStyle = 'rgba(40,24,16,.9)'; g.fillRect(0, 0, 1000, 40); g.fillRect(0, 0, 60, 700);
  toneRect(g, 0, 0, 1000, 700, 'rgba(0,0,0,.12)', 8, 1.8);
  g.font = '500 30px "Noto Sans CJK JP"'; g.fillStyle = 'rgba(255,255,255,.85)'; g.textAlign = 'right'; g.fillText('11:47', 970, 670);
  g.restore();
}
