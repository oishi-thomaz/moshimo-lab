// 背景セット（夜のタワマン・部屋・廊下・浴室・トイレ・玄関・エレベーターホール・図解）
import { W, H, clamp, lerp, rng, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, tag, FONT, noise1 } from './core.js';

// ---------- 夜空と街 ----------
export function sky(g, { dark = 0, y0 = 0, h = H } = {}) {
  vgrad(g, -400, y0 - 400, W + 800, h + 800, [[0, mix('#1b2340', '#0a0d18', dark)], [0.55, mix('#2c3358', '#11152a', dark)], [1, mix('#4a4270', '#1a1830', dark)]]);
  const R = rng(11); for (let i = 0; i < 90; i++) circ(g, R() * (W + 400) - 200, y0 + R() * h * 0.6, R() * 2.2 + 0.4, `rgba(255,255,255,${(0.25 + R() * 0.5) * (0.4 + dark * 0.6)})`);
}
export function skyline(g, { y = 1500, dark = 0, seed = 3, scale = 1, color = '#1a2038', lit = '#ffd98a', density = 0.45, x0 = -300, x1 = W + 300 } = {}) {
  const R = rng(seed); let x = x0;
  while (x < x1) {
    const bw = (60 + R() * 120) * scale, bh = (120 + R() * 380) * scale;
    fillRR(g, x, y - bh, bw, bh + 600, 4, color);
    const cols = Math.max(1, Math.floor(bw / (22 * scale))), rows = Math.floor(bh / (30 * scale));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = R(); if (v > density) continue;
      const off = R() < dark; if (off) continue;
      g.fillStyle = rgba(lit, 0.55 + R() * 0.4); g.fillRect(x + 6 * scale + c * 22 * scale, y - bh + 12 * scale + r * 30 * scale, 10 * scale, 14 * scale);
    }
    x += bw + (6 + R() * 18) * scale;
  }
}

// ---------- タワマン（正面・やや見上げ） ----------
// floors 階分。lit(f, c) でその窓の明るさ（0..1）。hi = 光らせる階
export function tower(g, { cx = 540, base = 1700, top = 200, w = 300, wt = 240, floors = 45, dark = 0, hi = null, hiA = 1, emergency = 0, seed = 5, cols = 8, crown = true } = {}) {
  const R = rng(seed);
  const fh = (base - top) / floors;
  // 本体
  g.beginPath(); g.moveTo(cx - w / 2, base); g.lineTo(cx - wt / 2, top); g.lineTo(cx + wt / 2, top); g.lineTo(cx + w / 2, base); g.closePath();
  const gr = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); gr.addColorStop(0, mix('#39405e', '#1b1f30', dark)); gr.addColorStop(0.5, mix('#4a5275', '#22273a', dark)); gr.addColorStop(1, mix('#2a3048', '#141726', dark));
  g.fillStyle = gr; g.fill();
  for (let f = 0; f < floors; f++) {
    const yb = base - f * fh, yt = yb - fh, k = (base - (yb + yt) / 2) / (base - top);
    const ww = lerp(w, wt, k), xl = cx - ww / 2;
    line(g, xl + 4, yt, xl + ww - 4, yt, 2, rgba('#0c0f1a', 0.5));
    for (let c = 0; c < cols; c++) {
      const cw = ww / cols, wx = xl + c * cw + cw * 0.14, wy = yt + fh * 0.2, wwid = cw * 0.72, wh = fh * 0.62;
      const v = R();
      let a = v < 0.62 ? (0.45 + R() * 0.5) : 0.04;
      a *= 1 - clamp(dark * 1.2 - R() * 0.2);
      const isHi = hi != null && f + 1 === hi && (c === 3);
      if (isHi) a = hiA;
      g.fillStyle = a > 0.1 ? rgba(isHi ? '#ffe2a0' : (R() < 0.3 ? '#cfe3ff' : '#ffd98a'), a) : 'rgba(20,24,40,.9)';
      g.fillRect(wx, wy, wwid, wh);
      if (isHi && hiA > 0.2) glow(g, wx + wwid / 2, wy + wh / 2, 70, 'rgba(255,214,140,1)', 0.6 * hiA);
    }
    if (emergency > 0 && f % 3 === 1) circ(g, xl + 8, yt + fh / 2, 2.5, rgba('#7dffb0', 0.7 * emergency));
  }
  if (crown) { poly(g, [[cx - wt / 2, top], [cx - wt / 2 + 20, top - 40], [cx + wt / 2 - 20, top - 40], [cx + wt / 2, top]], mix('#2f3550', '#151827', dark)); circ(g, cx, top - 46, 7, rgba('#ff5040', 0.6 + 0.4 * Math.sin(Date.now() * 0) )); }
  return { fh, floorY: f => base - (f - 0.5) * fh };
}

// ---------- 32階の部屋（リビング） ----------
// power 1=点灯 0=停電, cityDark 外の街の暗さ, sofaX ソファの位置ずれ, lamp 揺れ
export function room(g, { power = 1, cityDark = 0, sofaX = 0, swing = 0, t = 0 } = {}) {
  // 壁
  vgrad(g, -200, 0, W + 400, 1500, [[0, mix('#efe3cf', '#2a2b3a', 1 - power)], [1, mix('#e2d2b8', '#22232f', 1 - power)]]);
  // 大きな窓
  const wx = 110, wy = 260, ww = 860, wh = 900;
  g.save(); rr(g, wx, wy, ww, wh, 6); g.clip();
  sky(g, { dark: cityDark, y0: wy, h: wh });
  // 海と橋の光
  vgrad(g, wx, wy + wh * 0.72, ww, wh * 0.3, [[0, '#141a33'], [1, '#0b0f20']]);
  skyline(g, { y: wy + wh * 0.74, dark: cityDark, seed: 21, scale: 0.75, color: '#1c2342', density: 0.5 });
  skyline(g, { y: wy + wh * 0.82, dark: cityDark, seed: 8, scale: 1.05, color: '#151a33', density: 0.42 });
  for (let i = 0; i < 40; i++) { const R = rng(i + 3); circ(g, wx + R() * ww, wy + wh * (0.86 + R() * 0.12), 2 + R() * 2, rgba('#ffcf7a', (0.6) * (1 - cityDark))); }
  g.restore();
  // 窓枠
  g.lineWidth = 16; g.strokeStyle = mix('#cfc3ad', '#3a3b48', 1 - power); rr(g, wx, wy, ww, wh, 6); g.stroke();
  line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, 12, mix('#cfc3ad', '#3a3b48', 1 - power), 'butt');
  // 窓の映り込み
  g.save(); g.globalAlpha = 0.07; poly(g, [[wx + 80, wy], [wx + 260, wy], [wx + 60, wy + wh], [wx - 120, wy + wh]], '#fff'); g.restore();
  // 床
  vgrad(g, -200, 1160, W + 400, 800, [[0, mix('#b8875c', '#2a2026', 1 - power)], [1, mix('#9a6c47', '#1d171c', 1 - power)]]);
  for (let i = 0; i < 9; i++) line(g, -200 + i * 170, 1160, -200 + i * 170 - 160, 1920, 2, rgba('#000000', 0.08));
  ell(g, 540, 1420, 470, 90, mix('#c7b59a', '#2c2832', 1 - power));
  // フロアランプ（揺れる）
  const lx = 900, ly = 1180;
  g.save(); g.translate(lx, ly); g.rotate(swing * 0.18);
  line(g, 0, 0, 0, -430, 8, '#3a3236'); poly(g, [[-55, -430], [55, -430], [35, -510], [-35, -510]], mix('#f5e6c4', '#3b3a40', 1 - power));
  if (power > 0.5) glow(g, 0, -440, 260, 'rgba(255,214,150,1)', 0.45 * power);
  g.restore(); ell(g, lx, ly + 4, 50, 10, '#3a3236');
  // 本棚（左）
  fillRR(g, -40, 700, 170, 500, 6, mix('#a07a55', '#2a2329', 1 - power));
  for (let r = 0; r < 4; r++) { line(g, -40, 820 + r * 110, 130, 820 + r * 110, 8, mix('#7e5c3e', '#211b21', 1 - power), 'butt'); for (let b = 0; b < 5; b++) fillRR(g, -20 + b * 28, 820 + r * 110 - 80 + (b % 2) * 10, 22, 76 - (b % 2) * 10, 3, mix(['#6f8fa8', '#d9a35b', '#a65d4f', '#5f7d6a', '#e9dcc4'][b], '#2a2a35', 1 - power)); }
  // ソファ
  const sx = 300 + sofaX;
  fillRR(g, sx - 230, 1150, 460, 170, 40, mix('#5b8a8a', '#1f2a31', 1 - power));
  fillRR(g, sx - 260, 1230, 520, 150, 46, mix('#6b9c9b', '#243039', 1 - power));
  fillRR(g, sx - 270, 1200, 80, 190, 36, mix('#4f7c7b', '#1b252c', 1 - power)); fillRR(g, sx + 190, 1200, 80, 190, 36, mix('#4f7c7b', '#1b252c', 1 - power));
  fillRR(g, sx - 120, 1190, 110, 80, 26, mix('#e9c46a', '#333038', 1 - power));
  for (const lx2 of [sx - 220, sx + 210]) line(g, lx2, 1380, lx2, 1405, 12, '#3a3236');
  return { wx, wy, ww, wh };
}

// ---------- 浴室 ----------
export function bath(g, { level = 0, stream = 0, t = 0, power = 1, drops = 0 } = {}) {
  const dk = 1 - power;
  g.fillStyle = mix('#e8edf0', '#272d36', dk); g.fillRect(-200, -200, W + 400, H + 400);
  for (let y = -200; y < H; y += 120) line(g, -200, y, W + 200, y, 3, mix('#d3dade', '#1f242c', dk), 'butt');
  for (let x = -200; x < W + 200; x += 120) line(g, x, -200, x, H, 3, mix('#d3dade', '#1f242c', dk), 'butt');
  // 蛇口
  const fx = 700, fy = 820;
  fillRR(g, fx - 30, fy - 200, 60, 200, 20, mix('#c7ced6', '#59606b', dk)); fillRR(g, fx - 150, fy - 30, 180, 50, 25, mix('#b6bec8', '#4e5560', dk));
  fillRR(g, fx - 60, fy - 230, 120, 40, 18, mix('#9aa3ad', '#434955', dk));
  // 水の流れ
  const tubTop = 1080, tubBot = 1500, wl = lerp(tubBot - 20, tubTop + 60, level);
  if (stream > 0) { g.save(); g.globalAlpha = 0.85; const sw = 26 * stream; for (let i = 0; i < 3; i++) line(g, fx - 130 + noise1(t * 8 + i, i) * 3 * stream, fy + 10, fx - 130 + noise1(t * 6 + i, i + 4) * 5, wl, sw * (1 - i * 0.3), rgba('#bfe6ff', 0.6)); g.restore(); }
  if (drops > 0) for (let i = 0; i < 3; i++) { const p = ((t * 1.3 + i / 3) % 1); if (p * 3 % 1 < drops) { const yy = lerp(fy + 20, wl, p * p); ell(g, fx - 130, yy, 9, 13, rgba('#bfe6ff', 0.9)); } }
  // 浴槽
  fillRR(g, 60, tubTop, 960, 520, 70, mix('#fbfbfb', '#3a404b', dk));
  fillRR(g, 100, tubTop + 30, 880, 450, 60, mix('#e4eaee', '#2b3039', dk));
  g.save(); rr(g, 100, tubTop + 30, 880, 450, 60); g.clip();
  vgrad(g, 100, wl, 880, tubBot - wl + 40, [[0, rgba('#9fd6f5', 0.75)], [1, rgba('#5aa7d6', 0.85)]]);
  for (let i = 0; i < 5; i++) { const rx = 220 + i * 170 + noise1(t + i, 9) * 20; ell(g, rx, wl + 4, 50, 5, 'rgba(255,255,255,.45)'); }
  g.restore();
  return { fx, fy, wl, tubTop, tubBot };
}

// ---------- トイレ ----------
export function toilet(g, { bag = 0, paper = 0, power = 1, t = 0 } = {}) {
  const dk = 1 - power;
  g.fillStyle = mix('#ece6dc', '#262830', dk); g.fillRect(-200, -200, W + 400, H + 400);
  vgrad(g, -200, 1240, W + 400, 700, [[0, mix('#c9bfae', '#1f2026', dk)], [1, mix('#b4aa98', '#18191e', dk)]]);
  // タンク
  fillRR(g, 330, 560, 420, 330, 40, mix('#fbfbfb', '#3c414b', dk));
  fillRR(g, 640, 600, 70, 26, 13, mix('#c9d0d8', '#565d68', dk)); // レバー
  // 便器
  fillRR(g, 400, 880, 280, 130, 30, mix('#f4f4f4', '#363b44', dk));
  ell(g, 540, 1040, 250, 110, mix('#fbfbfb', '#3c414b', dk));
  ell(g, 540, 1040, 190, 72, mix('#d9e3ea', '#2a2f37', dk));
  fillRR(g, 420, 1050, 240, 260, 60, mix('#f6f6f6', '#383d46', dk));
  if (bag > 0) {
    g.save(); g.globalAlpha = bag;
    ell(g, 540, 1040, 262, 120, rgba('#3b3f48', 0.92));
    for (let i = 0; i < 7; i++) line(g, 330 + i * 60, 990 + (i % 2) * 20, 360 + i * 55, 1120, 3, 'rgba(255,255,255,.12)');
    ell(g, 540, 1040, 175, 62, '#2c3038');
    g.restore();
  }
  if (paper > 0) { const R = rng(4); for (let i = 0; i < 26 * paper; i++) { g.save(); g.translate(400 + R() * 280, 1000 + R() * 70); g.rotate(R() * 3); fillRR(g, -26, -16, 52, 32, 3, R() < 0.5 ? '#e9e4d6' : '#d8d2c0'); line(g, -18, -6, 18, -6, 2, '#a9a394'); g.restore(); } }
}

// ---------- 内廊下（横から） ----------
export function corridor(g, { power = 1, emergency = 1, doors = ['3201', '3202', '3203', '3204'], x0 = 0, stairs = true } = {}) {
  const dk = 1 - power;
  vgrad(g, -400, -200, W + 800, 1480, [[0, mix('#d9cdb8', '#1a1c26', dk)], [1, mix('#cbbda4', '#15171f', dk)]]);
  vgrad(g, -400, 1280, W + 800, 700, [[0, mix('#6d5d55', '#121219', dk)], [1, mix('#5a4c45', '#0d0d12', dk)]]);
  line(g, -400, 1280, W + 400, 1280, 10, mix('#8a7a6a', '#0a0a10', dk), 'butt');
  doors.forEach((n, i) => {
    const dx = x0 + 60 + i * 470;
    fillRR(g, dx, 640, 300, 640, 8, mix('#5c6f86', '#232a36', dk));
    fillRR(g, dx + 20, 660, 260, 600, 6, mix('#677b93', '#283040', dk));
    fillRR(g, dx + 230, 960, 40, 16, 6, mix('#c9ced4', '#5a606a', dk));
    circ(g, dx + 150, 820, 7, mix('#2a2f38', '#0a0c10', dk));
    fillRR(g, dx + 95, 580, 110, 44, 8, mix('#f2ede4', '#3a3c46', dk));
    text(g, n, dx + 150, 603, { size: 30, color: mix('#3a3a44', '#9aa0aa', dk) });
    if (power > 0.3) glow(g, dx + 385, 560, 120, 'rgba(255,220,160,1)', 0.35 * power);
    fillRR(g, dx + 370, 540, 30, 40, 6, mix('#f5e2b8', '#30323a', dk));
  });
  if (stairs) {
    const sx = x0 + 60 + doors.length * 470;
    fillRR(g, sx, 640, 300, 640, 8, mix('#8d969e', '#2a2e36', dk)); fillRR(g, sx + 110, 900, 80, 70, 6, mix('#bcc4cc', '#3c414a', dk));
    fillRR(g, sx + 60, 560, 180, 56, 8, '#2f9e5a'); text(g, '非常階段', sx + 150, 589, { size: 30, color: '#fff' });
    if (emergency > 0) glow(g, sx + 150, 588, 140, 'rgba(90,255,150,1)', 0.35 * emergency * (dk));
  }
}

// ---------- 玄関（内側からドアを見る） ----------
export function doorInside(g, { chain = 1, shakeX = 0, power = 0, light = 1 } = {}) {
  const dk = 1 - power;
  g.fillStyle = mix('#d8ccb7', '#1b1c25', dk); g.fillRect(-300, -300, W + 600, H + 600);
  vgrad(g, -300, 1480, W + 600, 600, [[0, mix('#9b8c7c', '#16161c', dk)], [1, mix('#86786a', '#101015', dk)]]);
  g.save(); g.translate(shakeX, 0);
  fillRR(g, 230, 300, 620, 1200, 10, mix('#56677c', '#262d3a', dk));
  fillRR(g, 260, 330, 560, 1140, 8, mix('#617389', '#2b3342', dk));
  // ドアスコープ
  circ(g, 540, 640, 22, '#1d2129'); circ(g, 540, 640, 12, '#4a5568');
  // ハンドル
  fillRR(g, 710, 900, 110, 34, 14, mix('#cfd5dc', '#6b727c', dk)); circ(g, 725, 917, 26, mix('#b9c0c8', '#5f6670', dk));
  // 鍵
  fillRR(g, 700, 790, 60, 80, 10, mix('#bfc6ce', '#5d646e', dk)); circ(g, 730, 830, 12, '#3a3f48');
  // チェーン
  const cx1 = 760, cy1 = 760, cx2 = 900, cy2 = 770;
  fillRR(g, 885, 740, 40, 70, 8, mix('#b9c0c8', '#5c626b', dk));
  if (chain > 0) { for (let i = 0; i < 9; i++) { const k = i / 8; const x = lerp(cx1, cx2, k), y = lerp(cy1, cy2, k) + Math.sin(k * Math.PI) * 26; g.lineWidth = 5; g.strokeStyle = '#c9ced4'; g.beginPath(); g.ellipse(x, y, 10, 6, (i % 2) * 1.4, 0, 7); g.stroke(); } }
  g.restore();
}

// ---------- エレベーターホール ----------
export function elevatorHall(g, { t = 0, power = 0 } = {}) {
  const dk = 1 - power;
  vgrad(g, -300, -300, W + 600, 1700, [[0, mix('#cbc3b5', '#1d1f28', dk)], [1, mix('#b9b0a0', '#16171e', dk)]]);
  vgrad(g, -300, 1360, W + 600, 700, [[0, mix('#5f5953', '#131318', dk)], [1, '#0c0c10']]);
  for (const ex of [110, 590]) {
    fillRR(g, ex - 20, 560, 420, 820, 10, mix('#8d949c', '#2c3038', dk));
    fillRR(g, ex, 600, 185, 780, 4, mix('#aab2bb', '#383d46', dk)); fillRR(g, ex + 195, 600, 185, 780, 4, mix('#aab2bb', '#383d46', dk));
    fillRR(g, ex + 90, 430, 200, 100, 14, '#0c0f14');
    const blink = Math.floor(t * 2.2) % 2 === 0;
    text(g, blink ? '停止中' : '点検待ち', ex + 190, 482, { size: 40, color: '#ff6a4a' });
  }
  fillRR(g, 495, 860, 70, 150, 12, mix('#9aa2ab', '#30353e', dk)); circ(g, 530, 905, 16, '#3a3f48'); circ(g, 530, 965, 16, '#3a3f48');
}

// ---------- 館内放送スピーカー ----------
export function speaker(g, { t = 0, on = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2c38'], [1, '#14151d']]);
  for (let i = 0; i < 4; i++) line(g, -300, 300 + i * 420, W + 300, 300 + i * 420, 4, 'rgba(255,255,255,.04)', 'butt');
  circ(g, 540, 700, 230, '#d8d8d2'); circ(g, 540, 700, 200, '#c4c4bd');
  for (let a = 0; a < 6; a++) for (let r = 1; r < 5; r++) { const an = a * Math.PI / 3 + r * 0.3; circ(g, 540 + Math.cos(an) * r * 40, 700 + Math.sin(an) * r * 40, 9, '#6b6b66'); }
  circ(g, 540, 700, 12, '#6b6b66');
  if (on > 0) for (let i = 0; i < 3; i++) { const p = ((t * 0.9 + i / 3) % 1); g.save(); g.globalAlpha = (1 - p) * 0.6 * on; g.lineWidth = 8; g.strokeStyle = '#ffd451'; g.beginPath(); g.arc(540, 700, 250 + p * 330, 0, Math.PI * 2); g.stroke(); g.restore(); }
  glow(g, 540, 700, 600, 'rgba(110,255,170,1)', 0.08);
}

// ---------- 図解の紙 ----------
export function paper(g, { color = '#efe6d4' } = {}) {
  g.fillStyle = color; g.fillRect(-300, -300, W + 600, H + 600);
  for (let x = -300; x < W + 300; x += 60) line(g, x, -300, x, H + 300, 1.5, 'rgba(120,100,70,.12)', 'butt');
  for (let y = -300; y < H + 300; y += 60) line(g, -300, y, W + 300, y, 1.5, 'rgba(120,100,70,.12)', 'butt');
}
// タワマンの断面図（左右対称のシンプルなビル）。floors 階、highlight で目立たせる階
export function section(g, { cx = 540, top = 260, bot = 1500, w = 420, floors = 15, label = null, hi = null, hiColor = '#ffd451', bend = 0, tint = '#f7f1e4' } = {}) {
  const fh = (bot - top) / floors;
  for (let f = 0; f < floors; f++) {
    const y = bot - (f + 1) * fh, k = (f + 0.5) / floors, dx = Math.sin(k * Math.PI / 2) * bend * k;
    fillRR(g, cx - w / 2 + dx, y + 3, w, fh - 6, 6, f + 1 === hi ? hiColor : tint);
    g.lineWidth = 3; g.strokeStyle = '#6b5e4a'; rr(g, cx - w / 2 + dx, y + 3, w, fh - 6, 6); g.stroke();
    for (let c = 0; c < 4; c++) fillRR(g, cx - w / 2 + dx + 30 + c * (w - 60) / 4, y + fh * 0.3, (w - 60) / 4 - 20, fh * 0.35, 4, f + 1 === hi ? '#fff3c4' : '#cfd9e0');
  }
  fillRR(g, cx - w / 2 - 40, bot, w + 80, 26, 6, '#6b5e4a');
  return { fh, y: f => bot - (f - 0.5) * fh };
}
