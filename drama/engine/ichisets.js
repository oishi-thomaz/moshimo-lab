// 位置情報（ichi）の部品：見守りアプリの地図・登録機器・移動の記録・ロック画面・ランドセルとタグ・
// 子ども（黄色い帽子）・家（表札つき・雨戸）・夜のインターホン
// 地図の座標は MAP（0..1000 × 0..1400）の上で決める。自宅＝HOME、3丁目14番＝T14
import { W, H, clamp, lerp, inv, ease, easeOut, rng, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, FONT } from './core.js';
import { head } from './noir.js';
import { house as houseBase } from './noirsets.js';

export const I = { dot: '#ff4a3d', dot2: '#ff7a52', app: '#1fb89a', app2: '#13907a', me: '#3a7bd5', land: '#eceae4', block: '#fbfaf7', road: '#ffffff', road2: '#f4d78a', park: '#cfe5c0', river: '#b9d6ea', night: '#1b2130', nblock: '#262d3e', nroad: '#3a4256', cap: '#f2c418' };
export const HOME = { x: 640, y: 980 };
export const T14 = { x: 300, y: 430 };
export const SCHOOL = { x: 760, y: 560 };
// 2台目の夜の道（3丁目14番 → 角 → うちの玄関）
export const ROUTE = [[300, 430], [300, 610], [470, 610], [470, 840], [640, 840], [640, 980]];
export function along(pts, k) {
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let r = clamp(k) * L;
  for (let i = 0; i < seg.length; i++) { if (r <= seg[i]) { const f = r / seg[i]; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } r -= seg[i]; }
  return pts[pts.length - 1];
}

// ---------- アプリのアイコン（足あと） ----------
export function appIcon(g, x, y, r, c = I.app) {
  fillRR(g, x - r, y - r, r * 2, r * 2, r * 0.45, c);
  for (const [dx, dy, s] of [[-0.28, 0.18, 1], [0.26, -0.2, 0.9]]) {
    ell(g, x + dx * r, y + dy * r, r * 0.2 * s, r * 0.3 * s, '#fff');
    for (let i = 0; i < 3; i++) circ(g, x + dx * r + (i - 1) * r * 0.13 * s, y + dy * r - r * 0.4 * s, r * 0.065 * s, '#fff');
  }
}

// ---------- 地図 ----------
// p は phoneFrame の中（w×h）。view={x,y,z}＝地図のどこを中心に、何倍で見るか
// dots=[{x,y,name,ch,col,pulse,a}]、trail=[[x,y]...]（点線の通り道）、trailK＝どこまで描くか、night＝夜の地図
// sheet={title,sub,time,col}＝下のカード、banner={title,body,time}＝上から降りる通知
export function mapApp(p, w, h, { t = 0, view = { x: 500, y: 700, z: 1 }, dots = [], trail = null, trailK = 1, night = 0, sheet = null, banner = null, bannerT = 0, labels = true, homeA = 1, hiT14 = 0 } = {}) {
  const z = view.z * (w / 1000) * 1.0;
  const land = mix(I.land, I.night, night), blk = mix(I.block, I.nblock, night), rd = mix(I.road, I.nroad, night);
  p.save(); p.fillStyle = land; p.fillRect(0, 0, w, h);
  p.save(); p.translate(w / 2, h / 2); p.scale(z, z); p.translate(-view.x, -view.y);
  // 川と公園
  p.save(); p.beginPath(); p.moveTo(-400, 1230); p.bezierCurveTo(200, 1150, 600, 1300, 1400, 1180); p.lineTo(1400, 1300); p.bezierCurveTo(600, 1420, 200, 1270, -400, 1350); p.closePath(); p.fillStyle = mix(I.river, '#22324a', night); p.fill(); p.restore();
  fillRR(p, 820, 760, 260, 200, 18, mix(I.park, '#24382c', night));
  // 区画（道に囲まれた街区）
  const xs = [-400, 90, 210, 390, 560, 720, 900, 1400], ys = [-400, 160, 340, 520, 700, 900, 1060, 1180];
  const R = rng(7);
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x0 = xs[i] + 18, y0 = ys[j] + 18, x1 = xs[i + 1] - 18, y1 = ys[j + 1] - 18;
    if (x1 - x0 < 20 || y1 - y0 < 20) continue;
    if (x0 < 1080 && x1 > 820 && y0 < 960 && y1 > 760) continue;
    fillRR(p, x0, y0, x1 - x0, y1 - y0, 10, blk);
    // 家の四角
    p.fillStyle = mix('#e6e2d8', '#30384b', night);
    for (let k = 0; k < 4; k++) { const bx = x0 + 10 + R() * Math.max(1, x1 - x0 - 70), by = y0 + 10 + R() * Math.max(1, y1 - y0 - 60); p.fillRect(bx, by, 40 + R() * 20, 32 + R() * 18); }
  }
  // 学校
  fillRR(p, 728, 538, 154, 144, 12, mix('#f1e3c8', '#3a3a30', night));
  // 道（太い通り）
  p.lineCap = 'butt';
  for (const x of [90, 210, 390, 560, 720, 900]) line(p, x, -400, x, 1180, 36, rd);
  for (const y of [160, 340, 520, 700, 900, 1060]) line(p, -400, y, 1400, y, 36, rd);
  line(p, 470, 520, 470, 900, 22, rd); line(p, 300, 340, 300, 700, 22, rd); line(p, 560, 840, 720, 840, 22, rd); line(p, 390, 610, 560, 610, 22, rd); line(p, 640, 840, 640, 1060, 22, rd);
  line(p, -400, 700, 1400, 700, 44, mix(I.road2, '#5a5236', night));
  if (labels) {
    const lc = night ? 'rgba(210,220,240,.55)' : 'rgba(90,96,110,.75)';
    text(p, 'みどり町3丁目', 240, 250, { size: 30, color: lc, weight: 800 });
    text(p, 'みどり町2丁目', 640, 430, { size: 30, color: lc, weight: 800 });
    text(p, 'みどり町1丁目', 470, 1000, { size: 30, color: lc, weight: 800 });
    text(p, 'みどり小', 805, 610, { size: 28, color: night ? 'rgba(230,220,190,.6)' : '#8a7a5a', weight: 800 });
    text(p, 'みどり公園', 950, 860, { size: 26, color: night ? 'rgba(180,220,180,.5)' : '#5a7a4a', weight: 800 });
  }
  // 3丁目14番（強調）
  if (hiT14 > 0) { p.save(); p.globalAlpha = hiT14; p.lineWidth = 6; p.strokeStyle = I.dot; p.setLineDash([14, 10]); p.strokeRect(T14.x - 60, T14.y - 52, 120, 104); p.restore(); }
  // 自宅
  if (homeA > 0) {
    p.save(); p.globalAlpha = homeA; const hx = HOME.x, hy = HOME.y;
    circ(p, hx, hy, 40, rgba(I.me, 0.22)); circ(p, hx, hy, 26, '#fff'); poly(p, [[hx - 16, hy - 1], [hx, hy - 15], [hx + 16, hy - 1]], I.me); fillRR(p, hx - 11, hy - 2, 22, 15, 2, I.me);
    if (labels) { p.font = `800 26px ${FONT}`; fillRR(p, hx - 44, hy + 34, 88, 40, 20, '#fff'); text(p, '自宅', hx, hy + 55, { size: 26, color: I.me }); }
    p.restore();
  }
  // 通り道
  if (trail && trailK > 0) {
    p.save(); p.lineWidth = 10; p.strokeStyle = rgba(I.dot, 0.85); p.setLineDash([2, 18]); p.lineCap = 'round';
    p.beginPath(); p.moveTo(trail[0][0], trail[0][1]);
    const steps = 80; for (let i = 1; i <= steps; i++) { const [x, y] = along(trail, (i / steps) * trailK); p.lineTo(x, y); }
    p.stroke(); p.restore();
  }
  // 点
  for (const d of dots) {
    const a = d.a ?? 1; if (a <= 0) continue;
    p.save(); p.globalAlpha = a; const col = d.col || I.dot, pu = d.pulse ?? 1;
    if (pu) { const k = (t * 0.9 + (d.ph || 0)) % 1; circ(p, d.x, d.y, 30 + k * 70, rgba(col, 0.35 * (1 - k))); }
    circ(p, d.x, d.y, 34, '#fff'); circ(p, d.x, d.y, 28, col); text(p, d.ch || 'ソ', d.x, d.y + 1, { size: 30, color: '#fff', weight: 900 });
    if (d.name) { p.font = `800 28px ${FONT}`; const nw = p.measureText(d.name).width + 34; fillRR(p, d.x - nw / 2, d.y - 92, nw, 46, 23, '#fff'); p.lineWidth = 3; p.strokeStyle = col; rr(p, d.x - nw / 2, d.y - 92, nw, 46, 23); p.stroke(); text(p, d.name, d.x, d.y - 68, { size: 28, color: '#222' }); }
    p.restore();
  }
  p.restore();
  // 上のバー
  fillRR(p, 0, 0, w, 150, 0, night ? '#11151f' : '#ffffff');
  appIcon(p, 70, 92, 32);
  text(p, 'あしあと', 122, 92, { size: 40, color: night ? '#e9edf4' : '#1a1d24', align: 'left', weight: 900 });
  text(p, '見守り中', w - 40, 92, { size: 28, color: I.app, align: 'right', weight: 800 });
  // 下のカード
  if (sheet) {
    const sh = 250, y0 = h - sh; fillRR(p, 0, y0, w, sh + 40, 40, night ? '#141925' : '#ffffff');
    fillRR(p, w / 2 - 40, y0 + 18, 80, 8, 4, night ? '#3a4152' : '#d6d6d6');
    circ(p, 82, y0 + 104, 42, sheet.col || I.dot); text(p, sheet.ch || 'ソ', 82, y0 + 105, { size: 40, color: '#fff', weight: 900 });
    text(p, sheet.title || '', 146, y0 + 86, { size: 44, color: night ? '#fff' : '#14161c', align: 'left', weight: 900 });
    text(p, sheet.sub || '', 146, y0 + 140, { size: 32, color: night ? '#b8c0d0' : '#5a606c', align: 'left', weight: 700 });
    if (sheet.time) text(p, sheet.time, w - 40, y0 + 86, { size: 30, color: night ? '#9aa3b4' : '#8a909c', align: 'right', weight: 700 });
    if (sheet.note) text(p, sheet.note, 146, y0 + 194, { size: 28, color: sheet.noteC || I.dot, align: 'left', weight: 800 });
  }
  // 通知のバナー
  if (banner) {
    const a = easeOut(clamp((t - bannerT) / 0.35)); if (a > 0) {
      p.save(); p.globalAlpha = a; p.translate(0, (1 - a) * -60);
      fillRR(p, 24, 170, w - 48, 170, 34, 'rgba(250,250,252,.97)'); p.lineWidth = 2; p.strokeStyle = 'rgba(0,0,0,.08)'; rr(p, 24, 170, w - 48, 170, 34); p.stroke();
      appIcon(p, 84, 228, 26);
      text(p, 'あしあと', 124, 228, { size: 26, color: '#6a707c', align: 'left', weight: 700 });
      text(p, banner.time || '今', w - 56, 228, { size: 26, color: '#8a909c', align: 'right', weight: 700 });
      text(p, banner.title || '', 60, 280, { size: 36, color: '#14161c', align: 'left', weight: 900 });
      if (banner.body) text(p, banner.body, 60, 320, { size: 28, color: '#3a3f4a', align: 'left', weight: 700 });
      p.restore();
    }
  }
  p.restore();
}

// ---------- 登録している機器 ----------
// hi＝光らせる行（0/1）、k2＝2台目の行が出る割合
export function deviceList(p, w, h, { t = 9, hi = -1, k2 = 1, count = 1 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#f4f5f7'], [1, '#eceef2']]);
  fillRR(p, 0, 0, w, 150, 0, '#fff'); text(p, '‹', 40, 92, { size: 64, color: I.app, weight: 500 }); text(p, '設定', w / 2, 92, { size: 40, color: '#1a1d24', weight: 900 });
  text(p, '登録している機器', 50, 230, { size: 34, color: '#6a707c', align: 'left', weight: 800 });
  const big = count > 0;
  if (big) { p.save(); p.globalAlpha = clamp(count); text(p, '2台', w - 50, 230, { size: 52, color: I.dot, align: 'right', weight: 900 }); p.restore(); }
  const rows = [
    { name: 'ソウタ', sub: 'ランドセルのタグ', sub2: '電池 82%　・　自宅', date: '登録 2025年4月6日', bell: '通知 オン' },
    { name: 'ソウタ', sub: 'タグ', sub2: '電池 41%　・　みどり町3丁目', date: '登録 2026年8月2日', bell: '通知 オフ' },
  ];
  rows.forEach((r, i) => {
    const a = i === 1 ? k2 : 1; if (a <= 0) return;
    const y = 290 + i * 330; p.save(); p.globalAlpha = a;
    if (i === hi) { p.save(); p.globalAlpha = a * (0.45 + 0.25 * Math.sin(t * 5)); fillRR(p, 24, y - 14, w - 48, 298, 34, I.dot); p.restore(); }
    fillRR(p, 40, y, w - 80, 270, 28, '#fff');
    fillRR(p, 76, y + 50, 120, 120, 30, '#f2f2f0'); fillRR(p, 98, y + 72, 76, 76, 20, '#fafafa'); p.lineWidth = 4; p.strokeStyle = '#c9c9c4'; rr(p, 98, y + 72, 76, 76, 20); p.stroke(); circ(p, 136, y + 110, 9, i === 1 ? I.dot : I.app);
    text(p, r.name, 232, y + 70, { size: 48, color: '#14161c', align: 'left', weight: 900 });
    text(p, r.sub, 232, y + 126, { size: 30, color: '#5a606c', align: 'left', weight: 700 });
    text(p, r.sub2, 232, y + 172, { size: 28, color: i === 1 ? I.dot : '#5a606c', align: 'left', weight: 800 });
    text(p, r.date, 232, y + 226, { size: 26, color: '#8a909c', align: 'left', weight: 700 });
    text(p, r.bell, w - 70, y + 70, { size: 26, color: i === 1 ? '#8a909c' : I.app, align: 'right', weight: 800 });
    p.restore();
  });
  fillRR(p, 40, 970, w - 80, 110, 28, '#fff'); text(p, '＋ 機器を追加（パスワードが必要です）', w / 2, 1025, { size: 30, color: I.app, weight: 800 });
}

// ---------- 移動の記録（毎晩2時） ----------
// rows＝表示する行数（下から増える）、hi＝光らせる行、count＝右上の「41日」
export function historyList(p, w, h, { t = 9, rows = 6, hi = -1, count = 0, scroll = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#f4f5f7'], [1, '#eceef2']]);
  const D = ['12月3日', '12月2日', '12月1日', '11月30日', '11月29日', '11月28日', '11月27日', '11月26日'];
  const T0 = ['2:01', '2:03', '1:59', '2:02', '2:00', '2:04', '2:01', '2:02'];
  let y = 280 - scroll;
  for (let i = 0; i < Math.min(rows, D.length); i++) {
    const a = clamp(rows - i); if (a <= 0) break;
    p.save(); p.globalAlpha = a;
    if (i === hi) { p.save(); p.globalAlpha = a * (0.45 + 0.25 * Math.sin(t * 5)); fillRR(p, 24, y - 12, w - 48, 194, 30, I.dot); p.restore(); }
    fillRR(p, 40, y, w - 80, 170, 26, '#fff');
    text(p, D[i], 70, y + 46, { size: 30, color: '#14161c', align: 'left', weight: 900 });
    // 3つの点：3丁目 → 自宅前 → 3丁目
    const xs = [150, 450, 750];
    line(p, xs[0], y + 110, xs[2], y + 110, 6, '#e0e0dc');
    const lb = [['3丁目を出発', T0[i]], ['自宅の前　10分', ''], ['3丁目に戻る', '']];
    xs.forEach((x, k) => { circ(p, x, y + 110, 16, k === 1 ? I.dot : '#9aa0aa'); text(p, lb[k][0], x, y + 148, { size: 24, color: k === 1 ? I.dot : '#5a606c', weight: 800 }); });
    text(p, T0[i], xs[0], y + 76, { size: 26, color: '#14161c', weight: 900 });
    text(p, '午前', 240, y + 46, { size: 26, color: '#8a909c', align: 'left', weight: 700 });
    p.restore(); y += 196;
  }
  fillRR(p, 0, 0, w, 220, 0, '#fff'); text(p, '‹', 40, 92, { size: 64, color: I.app, weight: 500 });
  circ(p, 150, 92, 30, I.dot); text(p, 'ソ', 150, 93, { size: 30, color: '#fff', weight: 900 }); text(p, 'ソウタ（2台目）', 196, 92, { size: 38, color: '#1a1d24', align: 'left', weight: 900 });
  text(p, '移動の記録', 50, 180, { size: 30, color: '#6a707c', align: 'left', weight: 800 });
  if (count > 0) {
    p.save(); p.globalAlpha = clamp(count); const n = Math.round(lerp(1, 41, ease(clamp(count))));
    text(p, `${n}日`, w - 50, 170, { size: 64, color: I.dot, align: 'right', weight: 900 }); p.restore();
  }
}

// ---------- ロック画面（アプリの通知） ----------
// notifs=[{t,title,body,time}]
export function lockI(g, { t = 0, date = '12月4日 金曜日', clock = '1:58', notifs = [], dim = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#1c2232', '#07080c', dim)], [0.6, '#0d1018'], [1, '#06070a']]);
  text(g, date, 540, 200, { size: 42, color: 'rgba(255,255,255,.85)', weight: 500 });
  text(g, clock, 540, 330, { size: 190, color: '#f4f6fa', weight: 500 });
  let y = 500;
  for (const n of notifs) {
    const a = easeOut(clamp((t - (n.t || 0)) / 0.3)); if (a <= 0) continue;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * -40);
    fillRR(g, 60, y, 960, 220, 44, 'rgba(236,240,250,.17)');
    appIcon(g, 140, y + 70, 34);
    text(g, 'あしあと', 196, y + 70, { size: 30, color: 'rgba(255,255,255,.7)', align: 'left', weight: 600 });
    text(g, n.time || '今', 980, y + 70, { size: 30, color: 'rgba(255,255,255,.6)', align: 'right', weight: 500 });
    text(g, n.title || '', 100, y + 134, { size: 44, color: '#fff', align: 'left', weight: 900 });
    if (n.body) text(g, n.body, 100, y + 186, { size: 36, color: 'rgba(255,255,255,.88)', align: 'left', weight: 600 });
    g.restore(); y += 246;
  }
  if (notifs.length) glow(g, 540, 640, 700, 'rgba(255,170,150,1)', 0.08);
}

// ---------- ランドセルとタグ ----------
// open 0..1＝ふたを開ける、tag 0..1＝内ポケットのタグが光る、hand 0..1＝手がタグをつまむ
export function randoseru(g, { t = 0, open = 1, tag = 1, hand = 0, light = 1, name = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#3a2e28', '#1a1412', 1 - light)], [1, mix('#2a201c', '#0e0a09', 1 - light)]]);
  // 床（フローリング）
  vgrad(g, -300, 1250, W + 600, 900, [[0, '#5a4432'], [1, '#3a2a1e']]);
  for (let i = 0; i < 8; i++) line(g, -300 + i * 220, 1250, -600 + i * 300, 2200, 3, 'rgba(0,0,0,.15)');
  const bx = 190, by = 520, bw = 700, bh = 800, RED = '#a8212a', RED2 = '#861820';
  ell(g, 540, 1330, 420, 50, 'rgba(0,0,0,.35)');
  // 本体
  fillRR(g, bx, by, bw, bh, 90, RED); fillRR(g, bx + 30, by + 30, bw - 60, bh - 60, 70, RED2);
  // 中（開いた口）
  const o = ease(clamp(open));
  fillRR(g, bx + 40, by + 20, bw - 80, 140 + o * 120, 40, '#2a1012');
  // 教科書の背
  const bk = ['#4a7ab8', '#e2b23a', '#5aa86a', '#d9d4c8', '#c85a4a'];
  bk.forEach((c, i) => fillRR(g, bx + 80 + i * 92, by + 60 - o * 60, 78, 220, 8, c));
  // 内ポケットとタグ
  fillRR(g, bx + 520, by + 100, 120, 160, 16, '#6a1418');
  const tx = bx + 580, ty = by + 150 - o * 50;
  fillRR(g, tx - 48, ty - 48, 96, 96, 26, '#f3f2ee'); g.lineWidth = 4; g.strokeStyle = '#c9c7c0'; rr(g, tx - 48, ty - 48, 96, 96, 26); g.stroke();
  appIcon(g, tx, ty - 6, 22, '#c9c7c0');
  if (tag > 0) { const b = 0.5 + 0.5 * Math.sin(t * 6); circ(g, tx + 28, ty + 28, 8, mix('#2a5a3a', '#4dff9a', b * tag)); glow(g, tx + 28, ty + 28, 50, 'rgba(80,255,150,1)', 0.5 * b * tag); }
  // ふた（下に開いて垂れる）
  g.save(); g.translate(540, by + 20); g.scale(1, lerp(1, -0.25, o));
  fillRR(g, -bw / 2 - 6, 0, bw + 12, 700, 90, RED); fillRR(g, -bw / 2 + 30, 30, bw - 60, 640, 70, '#b62832');
  circ(g, 0, 560, 40, '#d9b45a'); circ(g, 0, 560, 26, '#a8862f');
  g.restore();
  // 名札
  if (o > 0.5 && name) { g.save(); g.globalAlpha = (o - 0.5) * 2; fillRR(g, bx + 120, by + 300, 300, 110, 12, '#fff'); text(g, '3年2組', bx + 270, by + 332, { size: 26, color: '#5a606c', weight: 700 }); text(g, 'みやした そうた', bx + 270, by + 376, { size: 36, color: '#14161c', weight: 900 }); g.restore(); }
  // 手
  if (hand > 0) {
    const hx = lerp(1100, tx + 40, ease(hand)), hy = lerp(300, ty + 10, ease(hand));
    g.save(); g.translate(hx, hy); g.rotate(-0.5);
    fillRR(g, 0, -40, 520, 90, 40, '#7a8a96'); fillRR(g, -30, -50, 120, 110, 44, '#e9c7a8'); fillRR(g, -60, -40, 60, 34, 16, '#e9c7a8'); fillRR(g, -50, 4, 50, 30, 14, '#ddb898');
    g.restore();
  }
}

// ---------- 子ども ----------
// 小さな子の顔のアップ（close より頭を大きく、肩を細く）。cap＝黄色い通学帽
export function kid(g, P, { x = 540, y = 760, s = 3.2, cap = false, ...o } = {}) {
  const r = 66 * s;
  g.save();
  g.beginPath(); g.moveTo(x - r * 1.6, y + r * 3.2); g.quadraticCurveTo(x - r * 1.5, y + r * 1.3, x - r * 0.45, y + r * 1.05); g.lineTo(x + r * 0.45, y + r * 1.05); g.quadraticCurveTo(x + r * 1.5, y + r * 1.3, x + r * 1.6, y + r * 3.2); g.closePath(); g.fillStyle = P.top; g.fill();
  if (P.collar) { poly(g, [[x - r * 0.45, y + r * 1.05], [x, y + r * 1.4], [x + r * 0.45, y + r * 1.05]], P.collar); }
  head(g, P, x, y, r, o);
  if (P.cheek || o.cheek) { for (const sd of [-1, 1]) circ(g, x + sd * r * 0.55, y + r * 0.42, r * 0.14, 'rgba(240,120,120,.28)'); }
  if (cap) capOn(g, x, y, r);
  g.restore();
}
export function capOn(g, x, y, r) {
  g.beginPath(); g.ellipse(x, y - r * 0.42, r * 1.08, r * 0.86, 0, Math.PI, 0); g.closePath(); g.fillStyle = I.cap; g.fill();
  g.beginPath(); g.ellipse(x, y - r * 0.4, r * 1.3, r * 0.2, 0, 0, Math.PI); g.fillStyle = '#d9ab10'; g.fill();
  line(g, x - r * 1.0, y - r * 0.55, x + r * 1.0, y - r * 0.55, r * 0.06, '#d9ab10');
}
// 全身の小さな子（足もと x,y）。cap＝黄色い帽子、bag＝ランドセル、hood＝顔を伏せる
export function kidFig(g, P, { x = 540, y = 1500, s = 1, cap = true, bag = false, look = 0, eyes = 'normal', mouth = 'line', down = 0 } = {}) {
  const r = 46 * s;
  g.save();
  ell(g, x, y + 4 * s, 70 * s, 10 * s, 'rgba(0,0,0,.35)');
  for (const sd of [-1, 1]) { fillRR(g, x + sd * 22 * s - 15 * s, y - 150 * s, 30 * s, 150 * s, 10 * s, P.bottom); ell(g, x + sd * 22 * s + 4 * s, y - 6 * s, 22 * s, 10 * s, P.shoes); }
  if (bag) fillRR(g, x - 70 * s, y - 330 * s, 140 * s, 170 * s, 30 * s, '#a8212a');
  fillRR(g, x - 62 * s, y - 300 * s, 124 * s, 170 * s, 36 * s, P.top);
  for (const sd of [-1, 1]) { fillRR(g, x + sd * 68 * s - 14 * s, y - 290 * s, 28 * s, 140 * s, 14 * s, P.top2); circ(g, x + sd * 68 * s, y - 146 * s, 14 * s, '#e9c7a8'); }
  const hy = y - 300 * s - r * 0.9 + down * r * 0.3;
  head(g, P, x, hy, r, { look, eyes, mouth, lookY: down });
  if (cap) capOn(g, x, hy, r);
  g.restore();
}

// ---------- 家（表札・雨戸） ----------
// name＝表札、shut＝雨戸を閉める（0..1）、weeds＝庭の草、lit1/lit2＝窓の明かり
export function home(g, { cx = 540, base = 1500, s = 1, lit1 = 0, lit2 = 0, name = '宮下', shut = 0, weeds = 0, t = 0, door = 0 } = {}) {
  houseBase(g, { cx, base, s, lit1, lit2, door, plate: false, t });
  g.save(); g.translate(cx, base); g.scale(s, s);
  const h1 = 330, h2 = 300;
  if (shut > 0) {
    const sh = (x, y, w, hh) => { const k = clamp(shut); fillRR(g, x - 6, y - 6, w + 12, (hh + 12) * k, 4, '#4a4e58'); for (let i = 0; i < (hh * k) / 18; i++) line(g, x - 6, y + i * 18, x + w + 6, y + i * 18, 3, 'rgba(0,0,0,.35)'); };
    sh(-300, -h1 - h2 + 70, 200, 150); sh(100, -h1 - h2 + 70, 200, 150); sh(-320, -h1 + 70, 260, 170);
  }
  if (weeds > 0) { const R = rng(3); for (let i = 0; i < 40; i++) { const x = -420 + R() * 840, hh = (20 + R() * 50) * weeds; poly(g, [[x - 8, 0], [x + (R() - 0.5) * 20, -hh], [x + 8, 0]], 'rgba(60,80,50,.9)'); } }
  if (name) { fillRR(g, 270, -h1 + 120, 110, 56, 6, '#d9d2c0'); g.lineWidth = 3; g.strokeStyle = '#6a604a'; rr(g, 270, -h1 + 120, 110, 56, 6); g.stroke(); text(g, name, 325, -h1 + 149, { size: 32, color: '#2a241a', weight: 900, font: '"Noto Serif CJK JP", serif' }); }
  g.restore();
}

// ---------- 夜のインターホン ----------
// video(g,w,h)＝カメラの中、ring＝呼び出し中、clock＝右上の時刻
export function intercomI(g, { t = 0, ring = 0, video = null, clock = '01:59', light = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#14161c'], [1, '#08090c']]);
  // 壁（夜の廊下）
  fillRR(g, 90, 170, 900, 1000, 40, mix('#2a2a2e', '#c9c4b8', 0.12 * light));
  const x = 140, y = 230, w = 800, h = 560;
  fillRR(g, x - 20, y - 20, w + 40, h + 300, 36, '#e8e4dc');
  fillRR(g, x, y, w, h, 14, '#06070a');
  g.save(); rr(g, x + 12, y + 12, w - 24, h - 24, 8); g.clip(); g.translate(x + 12, y + 12);
  const vw = w - 24, vh = h - 24;
  vgrad(g, 0, 0, vw, vh, [[0, '#2a3434'], [1, '#0d1314']]);
  glow(g, vw * 0.5, vh * 0.05, vw * 0.7, 'rgba(255,240,200,1)', 0.4);
  fillRR(g, 0, vh * 0.84, vw, vh * 0.2, 0, '#2c3236');
  if (video) video(g, vw, vh);
  const gr = g.createRadialGradient(vw / 2, vh / 2, vw * 0.3, vw / 2, vh / 2, vw * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
  // 走査線
  g.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < vh; i += 6) g.fillRect(0, i, vw, 2);
  text(g, clock, vw - 20, 34, { size: 30, color: 'rgba(255,255,255,.85)', align: 'right', weight: 800 });
  text(g, '玄関', 24, 34, { size: 30, color: 'rgba(255,255,255,.85)', align: 'left', weight: 800 });
  g.restore();
  // ボタン
  const by = y + h + 70;
  [['通話', 330], ['録画', 540], ['終了', 750]].forEach(([s, bx], i) => { fillRR(g, bx - 80, by, 160, 110, 22, '#d6d1c6'); text(g, s, bx, by + 56, { size: 32, color: '#4a4a4a', weight: 800 }); });
  if (ring > 0) { const on = Math.sin(t * 10) > 0; fillRR(g, 250, by - 40, 160, 16, 8, on ? I.dot : '#a9a49a'); if (on) glow(g, 330, by - 32, 120, 'rgba(255,80,60,1)', 0.5); }
}

// ---------- 夜の廊下の奥（息子が立っている） ----------
// k＝戸の開き、P＝子ども
export function hallKid(g, P, { t = 0, k = 1, o = {} } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0c0e14'], [1, '#06070a']]);
  // 廊下
  poly(g, [[0, 1920], [360, 1100], [720, 1100], [1080, 1920]], '#1a1714');
  poly(g, [[0, 0], [360, 300], [360, 1100], [0, 1920]], '#12141a');
  poly(g, [[1080, 0], [720, 300], [720, 1100], [1080, 1920]], '#14161c');
  fillRR(g, 360, 300, 360, 800, 0, '#0a0b10');
  // 子ども部屋の戸（少し開いて、中の常夜灯）
  const dw = 360 * clamp(k) * 0.55;
  fillRR(g, 360, 300, dw, 800, 0, '#3a3024'); glow(g, 360 + dw / 2, 700, 300, 'rgba(255,190,110,1)', 0.35 * k);
  g.save(); rr(g, 360, 300, dw + 200, 800, 0); g.clip();
  kidFig(g, P, { x: 470, y: 1100, s: 1.25, cap: false, eyes: 'normal', mouth: 'line', ...o });
  g.restore();
  fillRR(g, 360 + dw, 300, 360 - dw, 800, 0, '#2a2620'); circ(g, 360 + dw + 40, 720, 12, '#8a7a5a');
}
