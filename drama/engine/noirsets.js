// 「ホワイト案件」の背景：住宅街の家・リビング・駅・車内・検問・引越しトラック・妹の部屋・玄関・階段
import { W, H, clamp, lerp, inv, ease, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text } from './core.js';
import { C, toneRect, toneFill, CAST2, figure, head, close, crowIcon } from './noir.js';

// 夜空（星なし・街の明かりの照り返し）
export function nightSky(g, { y0 = -300, h = H + 600, warm = 0.2 } = {}) {
  vgrad(g, -400, y0, W + 800, h, [[0, '#05070e'], [0.6, '#0e1426'], [1, mix('#1a2140', '#3a2a35', warm)]]);
}

// 2階建ての家（正面）。cx,base=地面, s=大きさ
export function house(g, { cx = 540, base = 1500, s = 1, lit1 = 0, lit2 = 0, door = 0, plate = true, t = 0 } = {}) {
  g.save(); g.translate(cx, base); g.scale(s, s);
  const w = 760, h1 = 330, h2 = 300;
  // 壁
  fillRR(g, -w / 2, -h1 - h2, w, h1 + h2, 4, '#2a3048');
  g.save(); g.beginPath(); g.rect(w * 0.05, -h1 - h2, w * 0.45, h1 + h2); toneFill(g, 'rgba(0,0,0,.35)', 10, 2.6); g.restore();
  line(g, -w / 2, -h1, w / 2, -h1, 10, '#20263a', 'butt');
  // 屋根
  poly(g, [[-w / 2 - 50, -h1 - h2], [0, -h1 - h2 - 190], [w / 2 + 50, -h1 - h2]], '#151a2a');
  poly(g, [[-w / 2 - 50, -h1 - h2], [0, -h1 - h2 - 190], [0, -h1 - h2 - 170], [-w / 2 - 20, -h1 - h2 + 6]], '#1c2236');
  // 2階の窓（左＝俺の部屋）
  const win = (x, y, ww, hh, lit, warm = true) => {
    fillRR(g, x, y, ww, hh, 4, lit > 0 ? mix('#141a2c', warm ? '#ffd28a' : '#cfe0ff', lit) : '#0c101c');
    line(g, x + ww / 2, y, x + ww / 2, y + hh, 6, '#151a2a', 'butt'); g.lineWidth = 8; g.strokeStyle = '#151a2a'; g.strokeRect(x, y, ww, hh);
    if (lit > 0) { g.save(); g.setTransform(g.getTransform()); glow(g, x + ww / 2, y + hh / 2, ww * 1.1, warm ? 'rgba(255,200,120,1)' : 'rgba(180,210,255,1)', 0.45 * lit); g.restore(); }
  };
  win(-300, -h1 - h2 + 70, 200, 150, lit2);
  win(100, -h1 - h2 + 70, 200, 150, 0);
  // 1階の窓・ドア
  win(-320, -h1 + 70, 260, 170, lit1);
  fillRR(g, 90, -h1 + 50, 150, 280, 6, '#3a2c28'); // ドア
  if (door > 0) { fillRR(g, 90, -h1 + 50, 150 * (1 - door * 0.6), 280, 6, '#4a3832'); }
  circ(g, 215, -h1 + 200, 8, '#b9a27a');
  fillRR(g, 60, -h1 + 20, 210, 22, 4, '#151a2a'); // ひさし
  if (plate) { fillRR(g, 270, -h1 + 120, 90, 50, 6, '#d9d2c0'); text(g, '篠原', 315, -h1 + 146, { size: 30, color: '#2a2530', weight: 800 }); }
  // 塀と門
  fillRR(g, -w / 2 - 120, -70, w + 240, 70, 4, '#1d2232'); fillRR(g, 40, -110, 26, 110, 4, '#2a3048'); fillRR(g, 260, -110, 26, 110, 4, '#2a3048');
  // 玄関灯
  circ(g, 275, -h1 + 80, 12, door > 0 || lit1 > 0 ? '#ffd28a' : '#3a3a40');
  g.restore();
}

// 夜の住宅街（家の左右に電柱と家並み）
export function street(g, { t = 0, lit2 = 1, lit1 = 0, door = 0, s = 1, cy = 1500 } = {}) {
  nightSky(g);
  // 遠くの家並み
  for (let i = 0; i < 9; i++) { const R = rng(i * 7 + 2); const x = -200 + i * 170, hh = 200 + R() * 160; fillRR(g, x, cy - hh - 120, 150, hh + 200, 3, '#0d1220'); if (R() < 0.4) fillRR(g, x + 40, cy - hh - 60, 50, 36, 2, rgba('#ffd28a', 0.5)); }
  // 道路
  vgrad(g, -400, cy, W + 800, 600, [[0, '#14182a'], [1, '#07080e']]);
  // 電柱
  fillRR(g, 940, 200, 30, cy - 200 + 20, 4, '#0a0d16'); line(g, 900, 300, 1010, 300, 10, '#0a0d16', 'butt'); line(g, -100, 330, 1300, 280, 3, '#0a0d16');
  // 街灯の光
  glow(g, 900, 360, 380, 'rgba(200,215,255,1)', 0.18);
  house(g, { cx: 520, base: cy, s, lit1, lit2, door, t });
}

// 夕飯のリビング（ドアの隙間から撮った写真）
export function dinnerPhoto(g, w, h, t = 0) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#4a3a30'], [1, '#2a211c']]);
  // 照明
  glow(g, 520, 120, 520, 'rgba(255,210,150,1)', 0.55); line(g, 520, 0, 520, 90, 4, '#1a1410'); poly(g, [[470, 90], [570, 90], [550, 130], [490, 130]], '#e9c88f');
  // テーブル
  fillRR(g, 220, 420, 620, 60, 10, '#6a4a32'); fillRR(g, 240, 480, 30, 220, 4, '#4a3324'); fillRR(g, 790, 480, 30, 220, 4, '#4a3324');
  // 母と妹（背中寄り・横顔）
  figure(g, CAST2.mom, { x: 380, y: 760, s: 0.9, turn: 0.4, arms: [20, -60, 10, -80], shadow: false, look: 0.5 });
  figure(g, CAST2.miku, { x: 680, y: 760, s: 0.85, turn: -0.4, arms: [10, -80, 20, -60], shadow: false, look: -0.5, mouth: 'smile' });
  for (const x of [330, 520, 700]) ell(g, x, 420, 50, 14, '#e9e4da');
  // ドアの縁（家の中から覗き撮り）
  vgrad(g, 0, 0, 160, 700, [[0, '#050506'], [1, '#0b0b0e']]); g.fillStyle = 'rgba(0,0,0,.85)'; g.fillRect(0, 0, 110, 700);
  fillRR(g, 110, 0, 18, 700, 2, '#2a1f1a');
  toneRect(g, 0, 0, 1000, 700, 'rgba(0,0,0,.18)', 8, 1.8);
  // 撮影時刻
  g.font = '500 30px "Noto Sans CJK JP"'; g.fillStyle = 'rgba(255,255,255,.75)'; g.textAlign = 'right'; g.fillText('19:31', 970, 670);
  g.restore();
}
// 実家の外観写真（チャット用）
export function housePhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700); g.save(); g.beginPath(); g.rect(0, 0, 1000, 700); g.clip();
  g.translate(-40, -560); g.scale(1, 1);
  street(g, { cy: 1230, s: 0.95, lit2: 0.3, lit1: 0.9 });
  g.restore();
  g.font = '500 30px "Noto Sans CJK JP"'; g.fillStyle = 'rgba(255,255,255,.75)'; g.textAlign = 'right'; g.fillText('19:30', 970, 670);
  g.restore();
}
// 妹の部屋（入口から背中を撮った写真）
export function sisterPhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#1e2234'], [1, '#121522']]);
  glow(g, 640, 300, 420, 'rgba(255,230,180,1)', 0.5);
  fillRR(g, 380, 380, 520, 40, 6, '#5a4632'); fillRR(g, 400, 420, 24, 280, 3, '#3a2c20');
  line(g, 700, 380, 760, 250, 8, '#2a2a30'); poly(g, [[730, 250], [800, 250], [790, 220], [740, 220]], '#e9e4da');
  // 背中
  g.save(); g.translate(560, 720); fillRR(g, -120, -330, 240, 340, 60, CAST2.miku.top); line(g, 0, -330, 0, 0, 6, '#e9e9e9');
  circ(g, 0, -380, 78, CAST2.miku.hairC); g.save(); g.translate(50, -420); g.rotate(0.5); ell(g, 0, 40, 22, 60, CAST2.miku.hairC); g.restore(); g.restore();
  // ドアの縁
  g.fillStyle = 'rgba(0,0,0,.88)'; g.fillRect(0, 0, 150, 700); g.fillRect(880, 0, 120, 700);
  toneRect(g, 0, 0, 1000, 700, 'rgba(0,0,0,.18)', 8, 1.8);
  g.font = '500 30px "Noto Sans CJK JP"'; g.fillStyle = 'rgba(255,255,255,.75)'; g.textAlign = 'right'; g.fillText('20:21', 860, 670);
  g.restore();
}
// 先輩のスマホがテーブルに置かれた写真
export function takumiPhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#2a2420'], [1, '#191512']]);
  for (let i = 0; i < 6; i++) line(g, 0, 100 + i * 120, 1000, 80 + i * 120, 2, 'rgba(0,0,0,.25)');
  g.save(); g.translate(500, 350); g.rotate(-0.25);
  fillRR(g, -130, -240, 260, 480, 30, '#0d0e12'); fillRR(g, -115, -225, 230, 450, 22, '#1d2a44');
  g.font = '500 70px "Noto Sans CJK JP"'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('20:33', 0, -120);
  fillRR(g, -100, -40, 200, 90, 16, 'rgba(255,255,255,.18)'); g.font = '800 24px "M PLUS Rounded 1c"'; g.fillText('ユウマ', 0, -10); g.font = '500 22px "Noto Sans CJK JP"'; g.fillText('先輩、助けてください', 0, 22);
  line(g, -60, -200, 40, 120, 2, 'rgba(255,255,255,.35)'); line(g, 40, 120, 90, 200, 2, 'rgba(255,255,255,.35)');
  g.restore();
  toneRect(g, 0, 0, 1000, 700, 'rgba(0,0,0,.15)', 8, 1.8);
  g.restore();
}

// 駅のホーム（発車標に遅延）
export function station(g, { t = 0, delay = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0b0f1c'], [1, '#05060b']]);
  // 屋根の照明
  for (let i = 0; i < 5; i++) { fillRR(g, 60 + i * 220, 150, 160, 18, 6, '#dfe8ff'); glow(g, 140 + i * 220, 170, 220, 'rgba(200,220,255,1)', 0.18); }
  // 発車標
  fillRR(g, 140, 300, 800, 300, 14, '#05070b'); g.lineWidth = 6; g.strokeStyle = '#2a2f3a'; g.strokeRect(140, 300, 800, 300);
  const fl = Math.floor(t * 2) % 2;
  text(g, '各停　なんば', 300, 380, { size: 50, color: '#ffb84a', weight: 800 }); text(g, '20:14', 750, 380, { size: 50, color: '#ffb84a', weight: 800 });
  text(g, delay ? (fl ? '運転見合わせ' : '遅れ　約40分') : '', 540, 500, { size: 66, color: '#ff4a4a', weight: 800 });
  // ホームの端
  vgrad(g, -300, 1500, W + 600, 500, [[0, '#2a2f3a'], [1, '#14171e']]); line(g, -300, 1500, W + 300, 1500, 14, '#e8d24a', 'butt');
  // 人影
  for (let i = 0; i < 6; i++) { const R = rng(i + 4); const x = 80 + i * 180 + R() * 40; g.globalAlpha = 0.5; fillRR(g, x, 1180 + R() * 40, 70, 330, 30, '#0c0e14'); circ(g, x + 35, 1150 + R() * 40, 34, '#0c0e14'); g.globalAlpha = 1; }
}

// 車内（フロントガラス越しに2人）。lights=流れる街灯
export function carFront(g, { t = 0, red = 0, jin = {}, yuuma = {} } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#06070c'], [1, '#0b0e18']]);
  // 流れる街灯の光
  for (let i = 0; i < 4; i++) { const p = ((t * 0.55 + i / 4) % 1); const y = lerp(-300, 2200, p); g.save(); g.globalAlpha = Math.sin(p * Math.PI) * 0.35; g.fillStyle = 'rgba(255,190,110,1)'; g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y - 300); g.lineTo(W + 200, y - 120); g.lineTo(-200, y + 180); g.fill(); g.restore(); }
  if (red > 0) { g.save(); g.globalAlpha = red * (0.4 + 0.4 * Math.sin(t * 10)); g.fillStyle = '#ff1f35'; g.globalCompositeOperation = 'lighter'; g.fillRect(-300, -300, W + 600, H + 600); g.restore(); }
  // 2人（運転席＝画面左がジン）
  figure(g, CAST2.jin, { x: 300, y: 1560, s: 1.2, arms: [30, -70, 40, -80], turn: 0.3, lightFrom: 'left', ...jin });
  figure(g, CAST2.yuuma, { x: 790, y: 1560, s: 1.15, arms: [10, -60, 20, -70], turn: -0.3, lightFrom: 'right', ...yuuma });
  // ハンドル
  g.lineWidth = 26; g.strokeStyle = '#0a0b10'; g.beginPath(); g.ellipse(300, 1050, 200, 70, 0, 0, 7); g.stroke();
  // ダッシュボードとフロントガラスの枠
  vgrad(g, -300, 1100, W + 600, 900, [[0, '#0d0f16'], [1, '#05060a']]);
  g.lineWidth = 60; g.strokeStyle = '#05060a'; g.beginPath(); g.moveTo(-60, 1100); g.lineTo(60, 180); g.lineTo(W - 60, 180); g.lineTo(W + 60, 1100); g.stroke();
  line(g, 540, 180, 540, 260, 22, '#05060a'); fillRR(g, 470, 250, 140, 50, 10, '#0d0f16');
  toneRect(g, -300, 1100, W + 600, 900, 'rgba(255,255,255,.05)', 10, 2);
}
// 検問：助手席の窓から外の警官
export function checkpoint(g, { t = 0, lean = 0, beam = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#07080e'], [1, '#0d1020']]);
  const rot = (Math.sin(t * 7) * 0.5 + 0.5);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 900, 300, 900, 'rgba(255,30,50,1)', 0.35 * rot); glow(g, 150, 380, 700, 'rgba(255,30,50,1)', 0.18 * (1 - rot)); g.restore();
  // 警官
  figure(g, CAST2.officer, { x: 560 + lean * 40, y: 1900, s: 1.9, arms: [10, 0, 40, -100], turn: -0.2, lightFrom: 'right', look: -0.4 });
  // 懐中電灯の光
  if (beam > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * beam; const gr = g.createRadialGradient(760, 980, 10, 520, 1350, 700); gr.addColorStop(0, 'rgba(255,250,230,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(760, 960); g.lineTo(120, 1700); g.lineTo(900, 1800); g.closePath(); g.fill(); g.restore(); }
  // 窓枠
  g.lineWidth = 70; g.strokeStyle = '#030305'; g.strokeRect(20, 160, W - 40, 1500);
  vgrad(g, -300, 1640, W + 600, 600, [[0, '#08090e'], [1, '#030305']]);
}
// 引越しトラックの荷台（回想・色抜け）
export function truckBack(g, { open = 0, t = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2a2e'], [1, '#141416']]);
  fillRR(g, 60, 260, 960, 1200, 10, '#1b1b1e'); fillRR(g, 90, 290, 900, 1140, 6, '#2e2e33');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = 140 + c * 280, y = 360 + r * 300; fillRR(g, x, y, 250, 270, 6, '#8a7a62'); line(g, x, y + 40, x + 250, y + 40, 6, '#c9b892', 'butt'); }
  // 開いた箱
  const x = 380, y = 1000;
  fillRR(g, x - 40, y, 400, 330, 8, '#9a8a70');
  if (open > 0) { for (let i = 0; i < 12; i++) { const R = rng(i + 3); g.save(); g.translate(x + 10 + (i % 4) * 85, y + 30 + Math.floor(i / 4) * 80 - open * 20); g.rotate((R() - 0.5) * 0.2); fillRR(g, 0, 0, 80, 50, 4, '#c8cdb0'); fillRR(g, 30, 0, 18, 50, 2, '#e9e4da'); g.restore(); } }
  poly(g, [[x - 40, y], [x + 360, y], [x + 420, y - 140 * open], [x - 100, y - 140 * open]], '#a8987c');
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.2)', 9, 2);
}
// 玄関（中から見たドア＋靴）
export function genkan(g, { t = 0, door = 0, light = 0.6 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0c0e16'], [1, '#05060a']]);
  // 床（たたき）
  vgrad(g, -300, 1250, W + 600, 700, [[0, '#2c2a33'], [1, '#18171c']]);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * light; const gr0 = g.createRadialGradient(700, 1460, 20, 700, 1460, 520); gr0.addColorStop(0, 'rgba(220,235,255,1)'); gr0.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr0; g.fillRect(100, 1000, 1000, 900); g.restore();
  line(g, -300, 1250, W + 300, 1250, 10, '#2a2730', 'butt');
  // 靴
  const shoe = (x, y, c, wd = 120, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); ell(g, 0, 0, wd / 2, 26, c); fillRR(g, -wd / 2 + 10, -30, wd * 0.55, 34, 14, c); g.restore(); };
  shoe(260, 1420, '#d8d0c4', 100, -0.1); shoe(380, 1440, '#d8d0c4', 100, 0.05); // 妹のスニーカー
  shoe(560, 1400, '#7a6a5a', 110, 0.08); // 母のサンダル
  // 見覚えのない男物の革靴
  shoe(800, 1500, '#140f0c', 150, -0.06); shoe(930, 1520, '#140f0c', 150, 0.04);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 860, 1500, 260 * light, 'rgba(160,190,255,1)', 0.25 * light); g.restore();
}
// 階段を見上げる（2階のドアの隙間から光）
export function stairsUp(g, { t = 0, ring = 0, shadow = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#06070c'], [1, '#0a0c14']]);
  // 階段
  for (let i = 0; i < 12; i++) { const y = 1800 - i * 115, x0 = 160 + i * 18, x1 = 920 - i * 18; fillRR(g, x0, y - 30, x1 - x0, 30, 2, mix('#4a4252', '#221e28', i / 12)); fillRR(g, x0, y, x1 - x0, 85, 2, mix('#2e2834', '#141218', i / 12)); }
  // 2階のドア
  fillRR(g, 400, 250, 300, 380, 6, '#100f14');
  const gap = 0.5 + 0.5 * noise1(t * 0.5, 4);
  g.save(); g.globalCompositeOperation = 'lighter'; fillRR(g, 680, 250, 14 + gap * 6, 380, 2, 'rgba(255,214,150,.9)'); glow(g, 690, 440, 380, 'rgba(255,200,130,1)', 0.35); g.restore();
  // ドアの下の影（誰かの足）
  if (shadow > 0) { g.save(); g.globalAlpha = shadow; fillRR(g, 470, 620, 60, 16, 4, '#000'); fillRR(g, 570, 620, 60, 16, 4, '#000'); g.restore(); }
  if (ring > 0) { const p = (t * 1.6) % 1; g.save(); g.globalAlpha = ring * (1 - p) * 0.6; g.lineWidth = 6; g.strokeStyle = '#cfe0ff'; g.beginPath(); g.arc(550, 440, 120 + p * 260, 0, 7); g.stroke(); g.restore(); }
}

// ===== 組み直し版で使う場面 =====
// ユウマの部屋（ワンルーム・夜）
export function room1(g, { t = 0, morning = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#1a1f30', '#5a6070', morning)], [1, mix('#10131e', '#3a3e4a', morning)]]);
  // 窓
  fillRR(g, 620, 260, 360, 520, 6, mix('#0a0e1c', '#c9d6e8', morning)); line(g, 800, 260, 800, 780, 10, '#151a2a', 'butt'); g.lineWidth = 14; g.strokeStyle = '#151a2a'; g.strokeRect(620, 260, 360, 520);
  if (!morning) for (let i = 0; i < 14; i++) { const R = rng(i + 7); fillRR(g, 640 + R() * 320, 560 + R() * 200, 10, 14, 1, rgba('#ffd28a', 0.6)); }
  // 床
  vgrad(g, -300, 1300, W + 600, 800, [[0, mix('#2a2420', '#6a5a48', morning)], [1, mix('#17130f', '#3a3026', morning)]]);
  // ベッド
  fillRR(g, 560, 1120, 560, 220, 20, mix('#2b3550', '#6a7a9a', morning)); fillRR(g, 600, 1080, 200, 80, 30, mix('#d9d4c8', '#f0ece4', morning));
  // 机とノートPC
  fillRR(g, -40, 1060, 560, 30, 6, '#3a2c20'); fillRR(g, 0, 1090, 24, 300, 4, '#2a2018'); fillRR(g, 450, 1090, 24, 300, 4, '#2a2018');
  fillRR(g, 120, 900, 260, 160, 8, '#1a1c22'); fillRR(g, 135, 912, 230, 136, 4, morning ? '#2a3040' : '#8fb4ff'); fillRR(g, 90, 1050, 320, 14, 4, '#2a2c34');
  if (!morning) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 250, 980, 420, 'rgba(140,180,255,1)', 0.35); g.restore(); }
  // 封筒（督促）
  g.save(); g.translate(400, 1052); g.rotate(-0.15); fillRR(g, -60, -18, 120, 30, 3, '#e9e4da'); fillRR(g, -20, -16, 40, 10, 2, C.red); g.restore();
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.12)', 9, 2);
}
// 家賃の督促状（アップ）
export function rentNotice(g, { t = 0, stamp = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2420'], [1, '#17130f']]);
  g.save(); g.translate(540, 860); g.rotate(-0.04);
  fillRR(g, -380, -520, 760, 1040, 6, '#ece7dc');
  text(g, '家賃お支払いのお願い', 0, -400, { size: 54, color: '#2a2530', weight: 800 });
  for (let i = 0; i < 6; i++) fillRR(g, -300, -300 + i * 50, 600 - (i % 3) * 80, 16, 6, '#cfc8b8');
  fillRR(g, -300, 40, 600, 150, 8, '#f6f1e6'); g.lineWidth = 3; g.strokeStyle = '#a9a294'; g.strokeRect(-300, 40, 600, 150);
  text(g, '未払い　2か月分', 0, 90, { size: 48, color: '#2a2530', weight: 800 }); text(g, '134,000円', 0, 150, { size: 54, color: C.red, weight: 800 });
  if (stamp > 0) { g.save(); g.globalAlpha = stamp; g.translate(200, 330); g.rotate(-0.2); g.scale(lerp(1.6, 1, stamp), lerp(1.6, 1, stamp)); g.lineWidth = 12; g.strokeStyle = C.red; rr(g, -130, -70, 260, 140, 18); g.stroke(); text(g, '督促', 0, 4, { size: 86, color: C.red, weight: 900 }); g.restore(); }
  g.restore();
}
// スマホの求人画面
export function jobPhone(g, { t = 0, tap = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0b0d16'], [1, '#05060a']]);
  fillRR(g, 170, 200, 740, 1240, 60, '#0d0f14'); fillRR(g, 190, 220, 700, 1200, 46, '#f2f0ea');
  fillRR(g, 190, 220, 700, 120, 46, '#5d8f6a'); g.fillStyle = '#5d8f6a'; g.fillRect(190, 300, 700, 40);
  text(g, 'かんたん日払いバイト', 540, 285, { size: 40, color: '#fff' });
  fillRR(g, 230, 380, 620, 300, 20, '#d9e4d4'); g.save(); g.translate(540, 560); fillRR(g, -140, -60, 280, 130, 10, '#e9dcc0'); line(g, -140, -20, 140, -20, 6, '#c9b892', 'butt'); fillRR(g, -200, 30, 90, 60, 6, '#e9dcc0'); fillRR(g, 120, 20, 70, 70, 6, '#e9dcc0'); g.restore();
  text(g, '【急募】引越しスタッフ', 540, 740, { size: 50, color: '#2a2530' });
  text(g, '日給 15,000円', 540, 840, { size: 84, color: '#2a2530' });
  text(g, '日払い・未経験OK・即日', 540, 930, { size: 38, color: '#5a5560' });
  text(g, '荷物を運ぶだけのカンタン作業です', 540, 1000, { size: 32, color: '#7a7570' });
  fillRR(g, 300, 1120, 480, 120, 60, tap > 0.5 ? '#3d6f4a' : '#5d8f6a'); text(g, '応募する', 540, 1182, { size: 50, color: '#fff' });
  if (tap > 0) { g.save(); g.globalAlpha = Math.sin(tap * Math.PI); circ(g, 600, 1190, 70 * tap + 20, 'rgba(255,255,255,.35)'); g.restore(); }
}
// マンション前のワゴン車（夕方）
export function vanScene(g, { t = 0, jin = {}, yuuma = {}, carry = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, 1700, [[0, '#3a3550'], [0.6, '#6a5060'], [1, '#8a6a60']]);
  // マンション
  fillRR(g, -100, 200, 700, 1300, 6, '#4a4658'); for (let r = 0; r < 9; r++) for (let c = 0; c < 4; c++) fillRR(g, -60 + c * 160, 260 + r * 130, 110, 80, 4, (r + c) % 3 ? '#2e2c3a' : rgba('#ffd28a', 0.6));
  fillRR(g, 120, 1280, 240, 220, 6, '#2a2836');
  vgrad(g, -300, 1500, W + 600, 600, [[0, '#2a2830'], [1, '#141318']]);
  // ワゴン車（白・ロゴなし）
  g.save(); g.translate(760, 1500);
  fillRR(g, -300, -420, 560, 360, 30, '#d9dce2'); fillRR(g, -320, -200, 640, 160, 20, '#c9ccd4'); fillRR(g, 120, -400, 120, 140, 10, '#3a4458');
  circ(g, -190, -40, 62, '#141318'); circ(g, 170, -40, 62, '#141318'); circ(g, -190, -40, 26, '#8a8c92'); circ(g, 170, -40, 26, '#8a8c92');
  fillRR(g, -300, -380, 260, 300, 10, '#2a2c34'); // 開いたスライドドアの中
  for (let i = 0; i < 3; i++) fillRR(g, -280 + i * 80, -200 - (i % 2) * 70, 75, 65, 4, '#9a8a70');
  g.restore();
  figure(g, CAST2.jin, { x: 330, y: 1640, s: 1.15, turn: 0.3, arms: [10, 0, 20, 0], lightFrom: 'right', ...jin });
  figure(g, CAST2.yuuma, { x: 600, y: 1660, s: 1.1, turn: -0.3, arms: carry ? [120, 40, 120, 40] : [8, 0, 8, 0], ...yuuma });
  if (carry) { g.save(); g.translate(600, 1180); fillRR(g, -90, -60, 180, 120, 6, '#9a8a70'); line(g, -90, -20, 90, -20, 6, '#c9b892', 'butt'); g.restore(); }
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.12)', 9, 2);
}
// 封筒を渡す手
export function envelope(g, { t = 0, k = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a3040'], [1, '#1a1620']]);
  g.save(); g.translate(lerp(900, 560, k), 860); g.rotate(-0.12);
  fillRR(g, -230, -140, 460, 280, 10, '#e9e0c8'); poly(g, [[-230, -140], [0, 10], [230, -140]], '#d9cfb4');
  text(g, '今日の分', 0, 70, { size: 46, color: '#5a4a3a' });
  g.restore();
  // 手（ジンの手・刺青）
  g.save(); g.translate(lerp(1080, 760, k), 960); fillRR(g, -60, -50, 200, 100, 50, C.skin); line(g, 0, 10, 90, -10, 5, '#2a2a3a'); fillRR(g, 100, -60, 300, 120, 40, '#141519'); g.restore();
}
// 写真（介護施設の前のオカン・望遠）
export function carePhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#a9b4c0'], [1, '#7a8692']]);
  fillRR(g, 120, 120, 760, 480, 6, '#e3ddd0'); for (let c = 0; c < 5; c++) fillRR(g, 170 + c * 140, 180, 90, 90, 4, '#9ab0c4');
  fillRR(g, 420, 360, 160, 240, 4, '#7a6a5a'); fillRR(g, 300, 300, 400, 50, 6, '#5d8f6a'); g.font = '800 34px "M PLUS Rounded 1c"'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('介護施設 ひだまり', 500, 335);
  figure(g, CAST2.mom, { x: 640, y: 700, s: 0.75, turn: -0.3, arms: [10, 0, 30, -60], shadow: false, mouth: 'smile', look: -0.6 });
  // 望遠の枠とぼけ
  g.fillStyle = 'rgba(20,30,20,.55)'; g.fillRect(0, 0, 90, 700); g.fillRect(0, 0, 1000, 60);
  toneRect(g, 0, 0, 1000, 700, 'rgba(0,0,0,.15)', 8, 1.8);
  g.font = '500 30px "Noto Sans CJK JP"'; g.fillStyle = 'rgba(255,255,255,.8)'; g.textAlign = 'right'; g.fillText('8:12', 970, 670);
  g.restore();
}
// 写真（中学の校門の妹）
export function schoolPhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#b9c6d4'], [1, '#8a98a6']]);
  fillRR(g, 0, 420, 1000, 280, 0, '#6a6a6e');
  fillRR(g, 60, 220, 60, 420, 4, '#c9c4b8'); fillRR(g, 880, 220, 60, 420, 4, '#c9c4b8'); fillRR(g, 40, 300, 30, 80, 2, '#e9e4da');
  g.font = '800 26px "Noto Sans CJK JP"'; g.fillStyle = '#2a2530'; g.save(); g.translate(55, 340); g.rotate(Math.PI / 2); g.fillText('市立中学校', -60, 0); g.restore();
  fillRR(g, 200, 140, 600, 260, 6, '#e3ddd0'); for (let c = 0; c < 6; c++) fillRR(g, 230 + c * 95, 180, 70, 60, 4, '#9ab0c4');
  figure(g, CAST2.miku, { x: 520, y: 720, s: 0.8, turn: 0.2, arms: [10, 0, 10, 0], shadow: false, look: 0.4 });
  g.fillStyle = 'rgba(20,30,20,.5)'; g.fillRect(910, 0, 90, 700);
  toneRect(g, 0, 0, 1000, 700, 'rgba(0,0,0,.15)', 8, 1.8);
  g.font = '500 30px "Noto Sans CJK JP"'; g.fillStyle = 'rgba(255,255,255,.8)'; g.textAlign = 'right'; g.fillText('8:05', 880, 670);
  g.restore();
}
// 地図（ピンが実家に刺さる）
export function mapPhoto(g, w, h, t = 0) {
  g.save(); g.scale(w / 1000, h / 700);
  g.fillStyle = '#e8e6df'; g.fillRect(0, 0, 1000, 700);
  for (let i = 0; i < 9; i++) { line(g, i * 130 - 40, 0, i * 130 + 60, 700, 22, '#ffffff', 'butt'); line(g, 0, i * 100 - 20, 1000, i * 100 + 20, 16, '#ffffff', 'butt'); }
  fillRR(g, 620, 80, 260, 200, 20, '#cfe3c8'); fillRR(g, 80, 420, 200, 180, 20, '#cfe3c8');
  g.save(); g.translate(500, 330); poly(g, [[0, 0], [-34, -60], [34, -60]], C.red); circ(g, 0, -80, 44, C.red); circ(g, 0, -80, 16, '#fff'); g.restore();
  fillRR(g, 300, 400, 400, 120, 16, '#ffffff'); g.font = '800 34px "M PLUS Rounded 1c"'; g.fillStyle = '#2a2530'; g.textAlign = 'center'; g.fillText('篠原', 500, 450); g.font = '500 24px "Noto Sans CJK JP"'; g.fillText('大阪府○○市△△町 2-14', 500, 492);
  g.restore();
}
// 仏壇と金庫（オトンの写真）
export function altar(g, { t = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1416'], [1, '#0c0a0b']]);
  fillRR(g, 240, 240, 600, 760, 10, '#3a2418'); fillRR(g, 270, 270, 540, 700, 6, '#2a1a12');
  glow(g, 380, 500, 160, 'rgba(255,190,110,1)', 0.35); glow(g, 700, 500, 160, 'rgba(255,190,110,1)', 0.35);
  fillRR(g, 450, 360, 180, 230, 6, '#d9cfb4'); fillRR(g, 465, 375, 150, 200, 4, '#8a8a8e');
  head(g, { hair: 'parted', hairC: '#2a2420', tall: 1 }, 540, 465, 52, { mouth: 'smile', eyes: 'narrow' });
  for (const x of [380, 700]) { fillRR(g, x - 8, 520, 16, 70, 4, '#f4f1ea'); ell(g, x, 512, 8, 16, '#ffcf8a'); }
  // 金庫
  fillRR(g, 330, 1060, 420, 360, 16, '#3a3e48'); fillRR(g, 360, 1090, 360, 300, 10, '#4a4f5a'); circ(g, 540, 1240, 70, '#2a2e36'); circ(g, 540, 1240, 54, '#5a606a');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(g, 540 + Math.cos(a) * 44, 1240 + Math.sin(a) * 44, 540 + Math.cos(a) * 54, 1240 + Math.sin(a) * 54, 3, '#c9ced4'); }
  fillRR(g, 640, 1220, 50, 40, 6, '#9aa0aa');
}

// ===== 第2話で使う場面 =====
// 実家のリビング（夜・間接照明）
export function living(g, { t = 0, dim = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#3a2e2a', '#1a1416', dim)], [1, mix('#241c1a', '#0e0b0c', dim)]]);
  // 壁と窓（カーテン）
  fillRR(g, 640, 300, 360, 520, 6, '#141626'); fillRR(g, 620, 280, 120, 560, 10, '#6a5040'); fillRR(g, 900, 280, 120, 560, 10, '#6a5040');
  // 照明
  glow(g, 300, 380, 520, 'rgba(255,200,140,1)', 0.35 * (1 - dim)); fillRR(g, 260, 330, 80, 50, 20, '#e9c88f');
  // テレビ台とテレビ（消えてる）
  fillRR(g, 40, 820, 420, 260, 8, '#0c0c10'); fillRR(g, 20, 1080, 460, 80, 6, '#4a3424');
  // 床・ラグ
  vgrad(g, -300, 1160, W + 600, 800, [[0, '#4a3a2c'], [1, '#2a2018']]); ell(g, 540, 1450, 520, 140, '#5a4a3e');
  // ソファ
  fillRR(g, 560, 1080, 520, 160, 40, '#5a4a5a'); fillRR(g, 530, 1180, 580, 140, 46, '#6a5a6a');
  // ローテーブルと湯のみ
  fillRR(g, 260, 1360, 560, 40, 10, '#6a4a32'); fillRR(g, 290, 1400, 24, 120, 4, '#4a3324'); fillRR(g, 766, 1400, 24, 120, 4, '#4a3324');
  for (const x of [420, 640]) { fillRR(g, x - 28, 1300, 56, 62, 10, '#d9d2c4'); ell(g, x, 1302, 28, 8, '#b8a888'); }
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.12)', 9, 2);
}
// 階段を見上げる（上から男が降りてくる）
export function stairsDown(g, { t = 0, k = 0, P, o = {} } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0e0c10'], [1, '#1a1618']]);
  for (let i = 0; i < 12; i++) { const y = 1800 - i * 115, x0 = 160 + i * 18, x1 = 920 - i * 18; fillRR(g, x0, y - 30, x1 - x0, 30, 2, mix('#4a4252', '#221e28', i / 12)); fillRR(g, x0, y, x1 - x0, 85, 2, mix('#2e2834', '#141218', i / 12)); }
  glow(g, 540, 300, 500, 'rgba(255,200,130,1)', 0.3);
  const y = lerp(560, 1500, k), s = lerp(0.8, 1.6, k);
  figure(g, P, { x: 540, y, s, walk: k < 1 ? t * 1.2 : null, arms: [10, 0, 30, -60], ...o });
}
// 車の窓ごしのジン（外から）
export function carWindow(g, { t = 0, jin = {}, paper = 0 } = {}) {
  nightSky(g);
  vgrad(g, -300, 900, W + 600, 1200, [[0, '#14182a'], [1, '#07080e']]);
  // 車体
  fillRR(g, -120, 520, 1320, 1100, 80, '#1c1e24'); fillRR(g, 60, 600, 960, 640, 40, '#0b0c10');
  g.save(); rr(g, 60, 600, 960, 640, 40); g.clip(); vgrad(g, 60, 600, 960, 640, [[0, '#1a1c26'], [1, '#0c0d12']]); close(g, CAST2.jin, { x: 540, y: 880, s: 3.2, lightFrom: 'left', ...jin }); g.restore();
  g.lineWidth = 8; g.strokeStyle = '#2a2c34'; rr(g, 60, 600, 960, 640, 40); g.stroke();
  glow(g, 900, 300, 400, 'rgba(200,215,255,1)', 0.15);
  if (paper > 0) { g.save(); g.translate(lerp(540, 600, paper), lerp(1200, 1320, paper)); g.rotate(-0.1); fillRR(g, -170, -60, 340, 120, 6, '#f1ece0'); text(g, '090-XXXX-XXXX', 0, 2, { size: 40, color: '#2a2530', weight: 800 }); g.restore(); }
}
// テーブルの上で震えるスマホ（カラスの画面）
export function buzzPhone(g, { t = 0, on = 0, shown = 0, msg = '' } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a201a'], [1, '#140f0c']]);
  for (let i = 0; i < 6; i++) line(g, 0, 300 + i * 260, W, 260 + i * 260, 3, 'rgba(0,0,0,.18)');
  const vib = on ? noise1(t * 60, 2) * 10 : 0;
  g.save(); g.translate(540 + vib, 860); g.rotate(-0.08 + (on ? noise1(t * 50, 5) * 0.02 : 0));
  fillRR(g, -230, -440, 460, 880, 50, '#0d0e12');
  fillRR(g, -210, -420, 420, 840, 38, on ? '#141927' : '#050608');
  if (on) {
    glow(g, 0, 0, 500, 'rgba(120,150,255,1)', 0.12);
    crowIcon(g, 0, -260, 60); text(g, 'カラス', 0, -170, { size: 40, color: '#e9edf5', weight: 800 });
    g.save(); g.globalAlpha = shown; fillRR(g, -190, -100, 380, 260, 26, '#1c1f2b'); g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.9); rr(g, -190, -100, 380, 260, 26); g.stroke();
    text(g, 'ユウマ', -160, -60, { size: 30, color: '#9aa5bb', align: 'left', weight: 800 });
    const lines = msg.split('\n'); lines.forEach((s, i) => text(g, s, -160, -10 + i * 50, { size: 36, color: '#fff', align: 'left', weight: 800 }));
    g.restore();
  }
  g.restore();
}
