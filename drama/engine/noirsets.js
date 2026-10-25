// 「ホワイト案件」の背景：住宅街の家・リビング・駅・車内・検問・引越しトラック・妹の部屋・玄関・階段
import { W, H, clamp, lerp, inv, ease, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text } from './core.js';
import { C, toneRect, toneFill, CAST2, figure, head } from './noir.js';

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
  vgrad(g, -300, 1250, W + 600, 700, [[0, '#1d1c22'], [1, '#0d0d10']]);
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
  for (let i = 0; i < 12; i++) { const y = 1800 - i * 115, x0 = 160 + i * 18, x1 = 920 - i * 18; fillRR(g, x0, y - 30, x1 - x0, 30, 2, mix('#2a2430', '#141218', i / 12)); fillRR(g, x0, y, x1 - x0, 85, 2, mix('#1c1820', '#0c0b0f', i / 12)); }
  // 2階のドア
  fillRR(g, 400, 250, 300, 380, 6, '#100f14');
  const gap = 0.5 + 0.5 * noise1(t * 0.5, 4);
  g.save(); g.globalCompositeOperation = 'lighter'; fillRR(g, 680, 250, 14 + gap * 6, 380, 2, 'rgba(255,214,150,.9)'); glow(g, 690, 440, 380, 'rgba(255,200,130,1)', 0.35); g.restore();
  // ドアの下の影（誰かの足）
  if (shadow > 0) { g.save(); g.globalAlpha = shadow; fillRR(g, 470, 620, 60, 16, 4, '#000'); fillRR(g, 570, 620, 60, 16, 4, '#000'); g.restore(); }
  if (ring > 0) { const p = (t * 1.6) % 1; g.save(); g.globalAlpha = ring * (1 - p) * 0.6; g.lineWidth = 6; g.strokeStyle = '#cfe0ff'; g.beginPath(); g.arc(550, 440, 120 + p * 260, 0, 7); g.stroke(); g.restore(); }
}
