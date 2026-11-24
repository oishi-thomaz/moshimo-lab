// 「ドラレコ」の場面：ドラレコの車内カメラの画面、運転席（横顔・ダッシュボード・メーター・無線機・サンバイザー）、
//   ルームミラー、後ろの席、夜の国道、コンビニの駐車場、黒いワゴン、スマホの画面（写真・メッセージ）
//   色は深夜の国道のナトリウム灯のオレンジと、ドラレコの画面の青白さ。差し色は車内カメラの REC の赤（D.rec）とメーターの緑
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, FONT, SERIF } from './core.js';
import { C, toneRect, toneFill, head, figure, close } from './noir.js';

export const D = { rec: '#ff3b3b', rec2: '#ff6a5a', sodium: '#ffb15a', meter: '#5dff9a', cab: '#0c0e13', cab2: '#15181f', seat: '#23262e', seat2: '#1a1c22', night: '#070a12', cam: '#c9d6dc' };

const R0 = rng(11);
const STARS = Array.from({ length: 40 }, () => [R0(), R0(), R0()]);

// ---------- 小物 ----------
export function avatar(g, x, y, r, ch, col = '#5a6a7a') { circ(g, x, y, r, col); text(g, ch, x, y + 2, { size: r * 0.95, color: '#fff', weight: 900 }); }
// 黒いワゴン（前から）。lights＝ヘッドライト
export function wagonFront(g, x, y, s = 1, { lights = 1, t = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  ell(g, 0, 170, 330, 30, 'rgba(0,0,0,.6)');
  fillRR(g, -300, -260, 600, 300, 70, '#0d0e12'); fillRR(g, -250, -230, 500, 170, 30, '#05060a');
  g.save(); g.globalAlpha = 0.18; poly(g, [[-230, -220], [-120, -220], [-200, -70], [-240, -70]], '#8a96a8'); g.restore();
  fillRR(g, -310, 20, 620, 150, 40, '#101116'); fillRR(g, -120, 60, 240, 60, 10, '#1a1c22');
  for (let i = 0; i < 4; i++) line(g, -110, 72 + i * 13, 110, 72 + i * 13, 4, '#26282e', 'butt');
  fillRR(g, -60, 130, 120, 36, 4, '#d8d8d0'); text(g, '・・-・・', 0, 148, { size: 20, color: '#2a2a2a' });
  for (const sx of [-1, 1]) { fillRR(g, sx * 240 - 55, 40, 110, 46, 16, lights ? '#fffbe8' : '#3a3a40'); }
  fillRR(g, -330, 160, 90, 50, 8, '#08090c'); fillRR(g, 240, 160, 90, 50, 8, '#08090c');
  g.restore();
  if (lights) { g.save(); g.globalCompositeOperation = 'lighter'; for (const sx of [-1, 1]) { glow(g, x + sx * 240 * s, y + 63 * s, 380 * s * lights, 'rgba(255,248,220,1)', 0.75 * lights); glow(g, x + sx * 240 * s, y + 63 * s, 120 * s, 'rgba(255,255,255,1)', 0.9 * lights); } g.restore(); }
}
// タクシー（横から）。sign＝フロントガラスの表示（'回送'|'空車'）
export function taxiSide(g, x, y, s = 1, { sign = '回送', doorOpen = 0, t = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  ell(g, 0, 120, 420, 30, 'rgba(0,0,0,.5)');
  fillRR(g, -400, -40, 800, 150, 46, '#2c3a52'); fillRR(g, -250, -190, 470, 170, 60, '#2a364c');
  fillRR(g, -225, -170, 200, 130, 18, '#141a24'); fillRR(g, -5, -170, 200, 130, 18, '#141a24');
  // 行灯（屋根の上）
  fillRR(g, -60, -236, 120, 50, 14, '#f2e9c8'); text(g, 'TAXI', 0, -210, { size: 26, color: '#2a3a52', weight: 900 });
  line(g, -400, 20, 400, 20, 6, '#e8c64a', 'butt');
  text(g, 'みなと台交通', -120, 66, { size: 30, color: '#e9edf3', weight: 800 });
  // フロントガラスの表示
  fillRR(g, 130, -150, 70, 42, 6, '#1a0606'); text(g, sign, 165, -128, { size: 22, color: sign === '回送' ? '#ff5a3a' : '#ff3a3a', weight: 900 });
  for (const wx of [-260, 260]) { circ(g, wx, 100, 66, '#121318'); circ(g, wx, 100, 30, '#7a7e86'); }
  fillRR(g, 380, -10, 30, 30, 8, '#fff4c8'); fillRR(g, -410, -10, 26, 30, 8, '#ff4040');
  if (doorOpen > 0) { g.save(); g.globalAlpha = doorOpen; fillRR(g, -215, -160, 180, 260, 10, '#0a0c12'); g.restore(); }
  g.restore();
}
// 缶コーヒー
export function canCoffee(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); fillRR(g, -26, -60, 52, 120, 8, '#6a3a22'); fillRR(g, -26, -60, 52, 16, 6, '#c9c9c9'); fillRR(g, -26, -10, 52, 30, 2, '#e9d9b0'); g.restore(); }

// ---------- ドラレコの車内カメラの画面 ----------
// x,y,w,h の枠の中に描く。woman＝'none'|'floor'（足もとに伏せて見上げる）|'peek'（座席から顔だけ）|'up'（座っている）
// P＝{ yuki, shoji } の人物、clock＝右上の時刻、rec＝REC の点、glitch 0..1
export function camView(g, x, y, w, h, { t = 0, woman = 'none', P = {}, clock = '00:41:07', date = '2026/12/12', rec = 1, look = 0, glitch = 0, label = 'CAM2 車内', car = '6号車', rise = 0, eyes = 'wide' } = {}) {
  g.save(); rr(g, x, y, w, h, 6); g.clip(); g.translate(x, y);
  const s = w / 1000; g.save(); g.scale(s, h / 1100);
  // 車内（暗い灰色）
  vgrad(g, 0, 0, 1000, 1100, [[0, '#2a2e32'], [1, '#16181b']]);
  // リアガラスと外の光
  poly(g, [[170, 40], [830, 40], [880, 250], [120, 250]], '#0c0e12');
  for (let i = 0; i < 5; i++) { const p = ((t * 0.4 + i / 5) % 1); const lx = lerp(950, 50, p); glow(g, lx, 150, 110, 'rgba(230,230,230,1)', 0.35 * Math.sin(p * Math.PI)); }
  // 天井の内張り
  vgrad(g, 0, 0, 1000, 50, [[0, '#3a3e42'], [1, '#2a2e32']]);
  // 後ろの座席（背もたれ・座面）
  fillRR(g, 60, 230, 880, 260, 60, '#3c4046'); for (let i = 0; i < 3; i++) fillRR(g, 130 + i * 280, 170, 180, 110, 40, '#44484e');
  line(g, 500, 260, 500, 480, 6, '#2e3236'); fillRR(g, 40, 450, 920, 130, 50, '#4a4e54');
  // 足もとの床（右の足もとは深い影）
  vgrad(g, 0, 570, 1000, 530, [[0, '#121416'], [1, '#0a0b0d']]);
  // 女
  const Y = P.yuki;
  if (Y && woman === 'up') { close(g, Y, { x: 700, y: 300, s: 1.25, eyes, brow: -0.3, mouth: 'line', look, lightFrom: 'left', t }); }
  if (Y && woman === 'floor') {
    // 足もとに横たわって、カメラを見上げる（顔・肩・座面のふちをつかむ手）
    g.save(); g.translate(0, -rise * 260);
    g.save(); g.translate(760, 820); g.rotate(-0.5); ell(g, 0, 0, 230, 90, Y.top); g.restore();
    g.save(); g.translate(680, 700); g.rotate(-0.18);
    head(g, Y, 0, 0, 96, { eyes, brow: -0.2, mouth: 'line', look, lookY: -0.6, lightFrom: 'left', t });
    g.restore();
    // 座面のふちにかけた指先
    for (let f = 0; f < 4; f++) ell(g, 560 + f * 16, 584, 8, 13, C.skin);
    g.restore();
  }
  if (Y && woman === 'peek') { g.save(); g.beginPath(); g.rect(0, 0, 1000, 580); g.clip(); head(g, Y, 690, 600, 92, { eyes, brow: -0.3, mouth: 'line', look, lightFrom: 'left', t }); g.restore(); }
  // 手前：運転席（左・ショウジの後ろ頭と肩）と助手席の背もたれ（右）
  fillRR(g, -60, 820, 420, 380, 60, '#1c1e22'); fillRR(g, 50, 760, 220, 110, 40, '#222428');
  if (P.shoji) { ell(g, 160, 1080, 230, 120, P.shoji.top); circ(g, 160, 930, 86, P.shoji.hairC); }
  fillRR(g, 800, 900, 320, 300, 60, '#1c1e22'); fillRR(g, 850, 850, 200, 100, 40, '#222428');
  g.restore();
  // 白黒にする（赤い REC は後から）
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#b8c8d0'; g.fillRect(0, 0, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(40,60,70,.35)'; g.fillRect(0, 0, w, h); g.restore();
  // 魚眼の周辺減光
  const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // 走査線とノイズ
  g.save(); g.globalAlpha = 0.12; for (let yy = 0; yy < h; yy += 6 * s + 2) { g.fillStyle = '#000'; g.fillRect(0, yy, w, 2); } g.restore();
  const R = rng(1 + Math.floor(t * 24)); g.save(); g.globalAlpha = 0.18; for (let i = 0; i < 260; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * w, R() * h, 3 * s + 1, 3 * s + 1); } g.restore();
  if (glitch > 0) { const R2 = rng(5 + Math.floor(t * 30)); g.save(); g.globalAlpha = glitch; for (let i = 0; i < 6; i++) { const yy = R2() * h, hh = 6 + R2() * 30; g.fillStyle = `rgba(${R2() < 0.5 ? '255,255,255' : '0,0,0'},.35)`; g.fillRect(0, yy, w, hh); } g.restore(); }
  // 文字
  const fs = Math.max(18, 40 * s);
  if (rec && (rec >= 1 ? Math.sin(t * 5) > -0.3 : true)) { circ(g, 46 * s + 8, 50 * s + 6, 15 * s + 3, D.rec); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 46 * s + 8, 50 * s + 6, 60 * s + 10, 'rgba(255,60,60,1)', 0.6); g.restore(); }
  text(g, 'REC', 80 * s + 14, 52 * s + 6, { size: fs, color: '#fff', align: 'left', weight: 800, stroke: '#000', sw: 4 });
  text(g, `${date}  ${clock}`, w - 30 * s - 6, 52 * s + 6, { size: fs * 0.9, color: '#f4f6f8', align: 'right', weight: 700, stroke: '#000', sw: 4 });
  text(g, label, 30 * s + 6, h - 40 * s - 6, { size: fs * 0.75, color: '#e4e8ea', align: 'left', weight: 700, stroke: '#000', sw: 4 });
  text(g, car, w - 30 * s - 6, h - 40 * s - 6, { size: fs * 0.75, color: '#e4e8ea', align: 'right', weight: 700, stroke: '#000', sw: 4 });
  g.restore();
}
// 画面いっぱいの車内カメラ（字幕の場所は下の黒）
export function camFull(g, o = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#050607'], [1, '#0a0b0d']]);
  camView(g, 40, 120, 1000, 1080, o);
  g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.12)'; rr(g, 40, 120, 1000, 1080, 6); g.stroke();
}

// ---------- 運転席まわり ----------
// 夜の国道（フロントガラスの向こう）。speed＝流れる速さ、wagon＝後ろではなく前方には出さない
export function nightRoad(g, { t = 0, speed = 1, y0 = 0, hz = 760 } = {}) {
  vgrad(g, -300, -300, W + 600, hz + 300, [[0, '#04060c'], [0.7, '#0e1220'], [1, '#2a1e1a']]);
  // 遠くの街の灯
  for (const [a, b, c] of STARS) { const x = a * 1500 - 200, y = hz - 40 - b * 160; fillRR(g, x, y, 4 + c * 6, 4 + c * 4, 1, rgba(D.sodium, 0.25 + c * 0.4)); }
  for (let i = 0; i < 8; i++) { const x = i * 160 - 60, hh = 60 + ((i * 53) % 90); fillRR(g, x, hz - hh, 120, hh, 2, '#0a0c14'); }
  // 道路
  poly(g, [[-300, H + 300], [W + 300, H + 300], [600, hz], [480, hz]], '#16161a');
  vgrad(g, -300, hz, W + 600, H, [[0, 'rgba(255,170,90,.10)'], [1, 'rgba(0,0,0,0)']]);
  // 白線（流れる）
  for (let i = 0; i < 7; i++) {
    const p = ((i / 7 + t * 0.55 * speed) % 1), k = p * p;
    const yy = lerp(hz, H + 200, k), wv = lerp(4, 70, k), hh = lerp(6, 200, k);
    fillRR(g, 540 - wv / 2 + lerp(0, -30, k), yy, wv, hh, 3, 'rgba(240,240,230,.75)');
  }
  for (const sd of [-1, 1]) { g.lineWidth = 6; g.strokeStyle = 'rgba(240,240,230,.5)'; g.beginPath(); g.moveTo(540 + sd * 50, hz); g.lineTo(540 + sd * 900, H + 200); g.stroke(); }
  // ナトリウム灯（左右に流れる）
  for (let i = 0; i < 5; i++) {
    const p = ((i / 5 + t * 0.45 * speed) % 1), k = p * p;
    for (const sd of [-1, 1]) {
      const x = 540 + sd * lerp(70, 1300, k), y = lerp(hz - 60, -400, k);
      line(g, x, y, x, lerp(hz, H, k), lerp(2, 26, k), '#05060a', 'butt');
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x - sd * lerp(4, 60, k), y, lerp(30, 420, k), 'rgba(255,170,80,1)', 0.65); g.restore();
    }
  }
}
// 黒いワゴン（ミラーの中・後ろ）。near 0..1
export function behind(g, w, h, { t = 0, near = 0.4, wagon = 1 } = {}) {
  vgrad(g, 0, 0, w, h, [[0, '#05070c'], [1, '#141218']]);
  const hz = h * 0.5;
  poly(g, [[0, h], [w, h], [w * 0.56, hz], [w * 0.44, hz]], '#121216');
  for (let i = 0; i < 4; i++) { const p = ((i / 4 + t * 0.4) % 1), k = 1 - p; for (const sd of [-1, 1]) { const x = w / 2 + sd * lerp(30, w * 0.9, k * k); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, lerp(hz - 20, -h * 0.3, k * k), lerp(20, 200, k * k), 'rgba(255,170,80,1)', 0.5); g.restore(); } }
  if (wagon) wagonFront(g, w / 2 + noise1(t * 0.7, 3) * w * 0.02, hz + h * 0.12 + near * h * 0.12, (0.18 + near * 0.35) * (w / 700), { lights: wagon, t });
}
// ルームミラー（上）＋フロントガラスの国道（下）。inner(g,w,h)＝ミラーの中身
export function mirrorShot(g, { t = 0, inner = null, speed = 1, mx = 540, my = 380, mw = 820, mh = 300 } = {}) {
  nightRoad(g, { t, speed });
  // フロントガラスの枠・天井
  g.fillStyle = D.cab; g.fillRect(-300, -300, W + 600, 380);
  poly(g, [[-300, 80], [40, 80], [-120, 1500], [-300, 1500]], D.cab); poly(g, [[W + 300, 80], [W - 40, 80], [W + 120, 1500], [W + 300, 1500]], D.cab);
  vgrad(g, -300, 1380, W + 600, 900, [[0, '#101218'], [1, '#05060a']]);
  // ミラーの腕
  line(g, mx, 0, mx, my - mh / 2, 34, '#14161c', 'butt');
  // ミラー
  g.save(); g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 40; fillRR(g, mx - mw / 2 - 18, my - mh / 2 - 18, mw + 36, mh + 36, 60, '#101114'); g.restore();
  g.save(); rr(g, mx - mw / 2, my - mh / 2, mw, mh, 46); g.clip(); g.translate(mx - mw / 2, my - mh / 2);
  if (inner) inner(g, mw, mh); else { g.fillStyle = '#0a0b10'; g.fillRect(0, 0, mw, mh); }
  // 映りこみ
  g.save(); g.globalAlpha = 0.08; poly(g, [[mw * 0.1, 0], [mw * 0.35, 0], [mw * 0.2, mh], [0, mh]], '#fff'); g.restore();
  g.restore();
}
// ミラーの中のユキの目（後ろの席から、まっすぐ）
export function mirrorEyes(P, o = {}) {
  return (g, w, h) => {
    vgrad(g, 0, 0, w, h, [[0, '#1a1c22'], [1, '#0e0f14']]);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, w * 0.2 + ((o.t || 0) * 120 % (w * 1.2)) - w * 0.1, h * 0.3, 260, 'rgba(255,170,80,1)', 0.25); g.restore();
    head(g, P, w * 0.5 + (o.dx || 0), h * 0.42, w * 0.33, { eyes: o.eyes || 'normal', brow: o.brow ?? -0.3, mouth: 'line', look: o.look || 0, lightFrom: 'left', ...o });
  };
}
// ダッシュボード：メーター（回送）・無線機・ドラレコのモニター。radio 0..1＝無線の赤いランプ、screen(g,w,h)＝モニターの中身
export function dash(g, { t = 0, radio = 0, screen = null, meter = '回送', fare = '' } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0b0d12'], [1, '#07080b']]);
  // 外の光（フロントガラスのすき間から）
  for (let i = 0; i < 3; i++) { const p = ((t * 0.5 + i / 3) % 1); g.save(); g.globalAlpha = Math.sin(p * Math.PI) * 0.22; g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,170,90,1)'; g.beginPath(); g.moveTo(-200, lerp(-200, 1400, p)); g.lineTo(W + 200, lerp(-500, 1100, p)); g.lineTo(W + 200, lerp(-300, 1300, p)); g.lineTo(-200, lerp(0, 1600, p)); g.fill(); g.restore(); }
  // ダッシュボードの面
  poly(g, [[-300, 700], [W + 300, 600], [W + 300, H + 300], [-300, H + 300]], '#121419'); toneRect(g, -300, 600, W + 600, 1500, 'rgba(255,255,255,.03)', 10, 2);
  // メーター（左）
  g.save(); g.translate(270, 820); g.rotate(-0.03);
  fillRR(g, -220, -110, 440, 220, 18, '#050607'); fillRR(g, -200, -92, 400, 184, 12, '#0b1410');
  text(g, meter, -120, -30, { size: 56, color: meter === '回送' ? '#ff6a3a' : D.meter, weight: 900 });
  text(g, fare || '----', 80, 30, { size: 70, color: D.meter, weight: 700, font: '"DejaVu Sans Mono", monospace' });
  text(g, '料金', 120, -48, { size: 26, color: 'rgba(93,255,154,.6)', weight: 700 });
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 270, 820, 300, 'rgba(93,255,154,1)', 0.12); g.restore();
  // 無線機（中央下）
  g.save(); g.translate(560, 1060);
  fillRR(g, -170, -70, 340, 140, 14, '#1a1c20'); fillRR(g, -150, -50, 180, 60, 6, '#2a3a2a'); text(g, 'CH 2', -60, -20, { size: 34, color: '#9fe8a0', weight: 800, font: '"DejaVu Sans Mono", monospace' });
  circ(g, 110, -20, 30, '#2a2c30'); for (let i = 0; i < 5; i++) line(g, 60 + i * 20, 40, 60 + i * 20, 56, 4, '#0a0b0d', 'butt');
  circ(g, -130, 40, 10, radio > 0 && Math.sin(t * 16) > -0.4 ? D.rec : '#3a1a1a');
  g.restore();
  if (radio > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 430, 1100, 160, 'rgba(255,60,60,1)', 0.5 * radio); g.restore(); }
  // マイク（コードつき）
  g.save(); g.lineWidth = 8; g.strokeStyle = '#08090b'; g.beginPath(); g.moveTo(700, 1090); g.bezierCurveTo(820, 1200, 860, 1000, 900, 930); g.stroke(); g.restore();
  fillRR(g, 860, 840, 100, 150, 30, '#16181c'); for (let i = 0; i < 4; i++) line(g, 880, 870 + i * 18, 940, 870 + i * 18, 4, '#0a0b0d', 'butt');
  // ドラレコのモニター（右上）
  g.save(); g.translate(790, 470); g.rotate(0.02);
  fillRR(g, -230, -150, 460, 300, 20, '#050607');
  if (screen) { g.save(); g.translate(-210, -130); screen(g, 420, 260); g.restore(); }
  g.restore();
}
// サンバイザー：裏に挟んだもの（card 0..1 でのぞく）と伸びる手（hand 0..1）
export function visor(g, { t = 0, hand = 0, card = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0a0b10'], [1, '#14161c']]);
  // フロントガラスの向こう（ぼけた街灯）
  for (let i = 0; i < 6; i++) { const p = ((t * 0.3 + i / 6) % 1); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lerp(1200, -200, p), 900 + (i % 2) * 120, 180, 'rgba(255,170,80,1)', 0.35); g.restore(); }
  // 天井と、下ろしたサンバイザー
  fillRR(g, -300, -300, W + 600, 560, 0, '#1a1c22');
  g.save(); g.translate(560, 420); g.rotate(-0.04);
  fillRR(g, -380, -150, 760, 300, 30, '#2a2c32'); toneRect(g, -380, -150, 760, 300, 'rgba(255,255,255,.04)', 8, 1.6);
  fillRR(g, -300, -110, 340, 210, 14, '#24262c'); g.lineWidth = 4; g.strokeStyle = '#3a3c44'; rr(g, -300, -110, 340, 210, 14); g.stroke();
  // 乗務員の写真入れ（ゴムバンド）
  line(g, -380, 70, 380, 70, 16, '#0e0f12', 'butt');
  // 裏に挟んだ小さなもの（SDカードは第3話。ここでは角だけ）
  if (card > 0) { g.save(); g.globalAlpha = card; poly(g, [[180, 150], [250, 150], [250, 200], [196, 200], [180, 184]], '#2a3a6a'); g.restore(); }
  g.restore();
  // 右手
  if (hand > 0) {
    const k = ease(clamp(hand)), hx = lerp(1150, 760, k), hy = lerp(1500, 680, k);
    line(g, 1300, 1900, hx + 80, hy + 160, 150, '#1e2a40');
    fillRR(g, hx + 30, hy + 80, 120, 70, 20, '#d8dce4');
    ell(g, hx, hy, 86, 64, C.skin, -0.6);
    for (let f = 0; f < 4; f++) line(g, hx - 30 + f * 18, hy - 40, hx - 46 + f * 26, hy - 130 + Math.abs(f - 1.5) * 16, 28, C.skin);
    line(g, hx - 60, hy + 10, hx - 120, hy - 40, 28, C.skin);
  }
}
// 運転席の横顔（助手席側から）。o＝close() に渡す表情
export function driver(g, P, { t = 0, talk = 0, speed = 1, ...o } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#080a10'], [1, '#101219']]);
  // 運転席側の窓（外の光が流れる）
  fillRR(g, 560, 160, 700, 620, 40, '#0a0d16');
  g.save(); rr(g, 560, 160, 700, 620, 40); g.clip();
  for (let i = 0; i < 5; i++) { const p = ((t * 0.5 * speed + i / 5) % 1); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lerp(1400, 400, p), 380 + (i % 3) * 90, 160, 'rgba(255,170,80,1)', 0.55); g.restore(); }
  g.restore();
  // ヘッドレスト・座席
  fillRR(g, 640, 360, 300, 260, 70, '#1e2026'); fillRR(g, 520, 700, 600, 900, 90, '#1a1c22');
  // 通りすぎる光が顔をなでる
  close(g, P, { x: 560, y: 700, s: 3.4, lightFrom: 'right', turn: 0.35, look: 0.5, talk, t, ...o });
  const p = (t * 0.5 * speed) % 1; g.save(); g.globalAlpha = Math.sin(p * Math.PI) * 0.28; g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,170,90,1)'; g.beginPath(); g.moveTo(lerp(1400, -400, p), 0); g.lineTo(lerp(1700, -100, p), 0); g.lineTo(lerp(1300, -500, p), H); g.lineTo(lerp(1000, -800, p), H); g.fill(); g.restore();
  // ハンドル（下）
  g.lineWidth = 46; g.strokeStyle = '#0a0b0e'; g.beginPath(); g.ellipse(700, 1420, 420, 170, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
}
// 後ろの席（運転席から振り返って）。who＝座っている人（P）、なければからっぽ
export function rearSeat(g, { t = 0, who = null, o = {}, speed = 1, dark = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0a0b10'], [1, '#121419']]);
  // リアガラスと後ろの光
  poly(g, [[110, 180], [970, 180], [1040, 560], [40, 560]], '#05070c');
  g.save(); g.beginPath(); g.moveTo(110, 180); g.lineTo(970, 180); g.lineTo(1040, 560); g.lineTo(40, 560); g.closePath(); g.clip();
  for (let i = 0; i < 4; i++) { const p = ((t * 0.4 * speed + i / 4) % 1); for (const sd of [-1, 1]) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540 + sd * lerp(30, 700, p * p), lerp(420, 80, p * p), lerp(20, 160, p), 'rgba(255,170,80,1)', 0.5); g.restore(); } }
  g.restore();
  fillRR(g, -300, -300, W + 600, 480, 0, '#16181d');
  // 背もたれ・座面
  fillRR(g, 0, 520, 1080, 640, 80, '#25282f'); toneRect(g, 0, 520, 1080, 640, 'rgba(0,0,0,.18)', 9, 2);
  for (let i = 0; i < 3; i++) fillRR(g, 90 + i * 330, 430, 240, 170, 50, '#2c2f36');
  line(g, 540, 600, 540, 1140, 6, '#1a1c21');
  fillRR(g, -40, 1080, 1160, 300, 70, '#2c2f36');
  if (who) close(g, who, { x: 720, y: 680, s: 2.9, lightFrom: 'left', t, ...o });
  // 手前の座席の背中（運転席・助手席）。足もとは見えない
  fillRR(g, -200, 1240, 700, 900, 100, '#121318'); fillRR(g, 580, 1240, 700, 900, 100, '#121318');
  vgrad(g, -300, 1200, W + 600, 900, [[0, 'rgba(0,0,0,0)'], [0.3, 'rgba(0,0,0,.6)'], [1, 'rgba(0,0,0,.9)']]);
  if (dark) { g.save(); g.globalAlpha = dark; g.fillStyle = '#000'; g.fillRect(-300, -300, W + 600, H + 600); g.restore(); }
}
// コンビニの駐車場（夜）。taxi＝止まっているタクシー、shadow 0..1＝後ろのドアに入っていく人影、shoji＝店から出てくる
export function konbini(g, { t = 0, shadow = 0, shoji = null, P = {} } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#04060c'], [1, '#0e1018']]);
  // 店（ガラス張り・白い光）。看板は架空の色
  fillRR(g, -100, 240, 1280, 620, 0, '#d8dee6');
  fillRR(g, -100, 180, 1280, 110, 0, '#2a6a5a'); fillRR(g, -100, 290, 1280, 18, 0, '#e8c64a');
  for (let i = 0; i < 6; i++) { fillRR(g, -60 + i * 210, 340, 190, 500, 4, '#f4f8fa'); for (let r = 0; r < 4; r++) fillRR(g, -40 + i * 210, 380 + r * 110, 150, 64, 4, ['#c9b8a0', '#a8c0d0', '#d0a8a8', '#b8d0a8'][(r + i) % 4]); }
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 600, 900, 'rgba(230,245,255,1)', 0.35); g.restore();
  // 駐車場
  vgrad(g, -300, 860, W + 600, 1100, [[0, '#2a2c32'], [1, '#101114']]);
  for (let i = 0; i < 5; i++) line(g, -100 + i * 300, 880, -300 + i * 380, 1900, 8, 'rgba(240,240,240,.4)', 'butt');
  vgrad(g, -300, 860, W + 600, 200, [[0, 'rgba(230,245,255,.25)'], [1, 'rgba(0,0,0,0)']]);
  if (shoji) figure(g, shoji, { x: 170, y: 960, s: 0.72, turn: 0.4, look: 0.6, arms: [6, 0, 20, -80], eyes: 'narrow', mouth: 'line', lightFrom: 'left' });
  taxiSide(g, 600, 1020, 1.05, { sign: '回送', doorOpen: shadow > 0 ? Math.min(1, shadow * 2) : 0, t });
  if (shadow > 0) { g.save(); g.globalAlpha = Math.min(1, shadow * 1.5) * (1 - inv(0.75, 1, shadow)); const y0 = lerp(1140, 1000, shadow); fillRR(g, 400, y0 - 280, 120, 300, 50, '#05060a'); circ(g, 460, y0 - 320, 50, '#05060a'); g.restore(); }
}

// ---------- スマホの画面 ----------
// ハルナの写真（花屋の前で笑う）
export function harunaPhoto(g, w, h, P) {
  vgrad(g, 0, 0, w, h, [[0, '#d8c6b0'], [1, '#efe4d2']]);
  // 花屋の店先（花のバケツ・軒）
  fillRR(g, 0, 0, w, h * 0.16, 0, '#3a5a4a'); text(g, 'FLOWER', w * 0.5, h * 0.08, { size: w * 0.07, color: '#f4efe4', weight: 800, spacing: 6 });
  const cols = ['#e06a7a', '#f2c14e', '#f4f1ea', '#c86ad0', '#ff8a5a', '#7ac0e0'];
  for (let i = 0; i < 7; i++) { const x = w * 0.04 + i * w * 0.14; fillRR(g, x, h * 0.66, w * 0.11, h * 0.16, 6, '#6a7078'); for (let k = 0; k < 6; k++) circ(g, x + w * 0.02 + (k % 3) * w * 0.035, h * 0.62 + Math.floor(k / 3) * h * 0.04, w * 0.024, cols[(i + k) % cols.length]); }
  close(g, P, { x: w * 0.5, y: h * 0.4, s: w / 470, eyes: 'normal', mouth: 'smile', lightFrom: 'left' });
  vgrad(g, 0, h * 0.82, w, h * 0.18, [[0, '#8a7a6a'], [1, '#6a5a4a']]);
}
// メッセージの一覧（電話の枠の中）。msgs=[{d}|{text,me,time}]
export function thread(p, w, h, { t = 9, name = '', msgs = [], scroll = 0, hi = -1, av = '？', col = '#5a6a7a', me = '#3a8a5a' } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14161c'], [1, '#0c0d12']]);
  let y = 190 - scroll;
  msgs.forEach((m, i) => {
    const a = clamp((t - (m.t || 0)) / 0.25); if (a <= 0) return;
    p.save(); p.globalAlpha = a;
    if (m.d) { p.font = `800 26px ${FONT}`; const dw = p.measureText(m.d).width + 40; fillRR(p, w / 2 - dw / 2, y, dw, 44, 22, 'rgba(255,255,255,.1)'); text(p, m.d, w / 2, y + 23, { size: 26, color: '#a9aebb', weight: 700 }); p.restore(); y += 70; return; }
    p.font = `800 38px ${FONT}`;
    const lines = String(m.text).split('\n'), bw = Math.min(w - 170, Math.max(...lines.map(s => p.measureText(s).width)) + 56), bh = lines.length * 52 + 36;
    const x = m.me ? w - 30 - bw : 100;
    if (!m.me) avatar(p, 56, y + 34, 30, av, col);
    if (i === hi) { p.save(); p.globalAlpha = 0.4 + 0.25 * Math.sin(t * 5); fillRR(p, x - 10, y - 10, bw + 20, bh + 20, 34, D.rec); p.restore(); }
    fillRR(p, x, y, bw, bh, 28, m.me ? me : '#e9e6df');
    lines.forEach((s, k) => text(p, s, x + 28, y + 42 + k * 52, { size: 38, color: m.me ? '#fff' : '#14161c', align: 'left' }));
    if (m.time) text(p, m.time, m.me ? x - 12 : x + bw + 12, y + bh - 14, { size: 24, color: '#8a90a0', align: m.me ? 'right' : 'left', weight: 600 });
    p.restore(); y += bh + 24;
  });
  fillRR(p, 0, 0, w, 160, 0, '#1c1f28'); text(p, '‹', 40, 96, { size: 64, color: '#9fb4d8', weight: 500 });
  avatar(p, 130, 92, 38, av, col); text(p, name, 190, 92, { size: name.length > 9 ? 36 : 44, color: '#fff', align: 'left' });
}
// ロック画面（ショウジのスマホ）。notifs=[{t,name,body,time,av}]
export function lockD(g, { t = 0, date = '12月12日 土曜日', clock = '0:44', notifs = [] } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1e26'], [0.6, '#0e1016'], [1, '#07080b']]);
  text(g, date, 540, 200, { size: 42, color: 'rgba(255,255,255,.85)', weight: 500 });
  text(g, clock, 540, 330, { size: 190, color: '#f4f6fa', weight: 500 });
  let y = 480;
  for (const n of notifs) {
    const a = easeOut(clamp((t - (n.t || 0)) / 0.3)); if (a <= 0) continue;
    const lines = String(n.body || '').split('\n'), hh = 140 + lines.length * 56;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * -40);
    fillRR(g, 60, y, 960, hh, 44, 'rgba(236,240,250,.17)');
    avatar(g, 145, y + 80, 46, n.av || '？', n.col || '#5a5e6a');
    text(g, 'メッセージ', 215, y + 58, { size: 30, color: 'rgba(255,255,255,.7)', align: 'left', weight: 500 });
    text(g, n.time || '今', 980, y + 58, { size: 30, color: 'rgba(255,255,255,.6)', align: 'right', weight: 500 });
    text(g, n.name || '', 215, y + 108, { size: 44, color: '#fff', align: 'left', weight: 800 });
    lines.forEach((s, i) => text(g, s, 215, y + 166 + i * 56, { size: 42, color: 'rgba(255,255,255,.92)', align: 'left', weight: 600 }));
    g.restore(); y += hh + 26;
  }
  if (notifs.length) glow(g, 540, 720, 700, 'rgba(255,200,200,1)', 0.1);
}

// ---------- 第2話〜 ----------
// 運転席の窓の外、右の車線に並んだ黒いワゴン（横から）。down 0..1＝ワゴンの窓が下りる、raise 0..1＝男がスマホをかざす、
// screen(g,w,h)＝男のスマホの中身。男の顔は影だけ（スマホの光で、あごと手だけが見える）。全部 字幕（y=1262）より上
export function wagonSide(g, { t = 0, down = 0, raise = 0, screen = null } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#04060c'], [1, '#0b0d14']]);
  // 外の夜（流れるナトリウム灯）
  g.save(); rr(g, 60, 150, 960, 1000, 50); g.clip();
  vgrad(g, 0, 150, W, 1000, [[0, '#070a14'], [1, '#141016']]);
  for (let i = 0; i < 5; i++) { const p = ((t * 0.35 + i / 5) % 1); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lerp(1300, -250, p), 230 + (i % 2) * 40, 200, 'rgba(255,170,80,1)', 0.55); g.restore(); }
  // ワゴンの車体（少しゆれる）
  const by = 330 + noise1(t * 0.9, 7) * 6;
  fillRR(g, -80, by, 1240, 900, 60, '#15171d');
  vgrad(g, -80, by, 1240, 160, [[0, 'rgba(255,170,90,.32)'], [1, 'rgba(0,0,0,0)']]);
  // 車体に流れる街灯の映りこみ
  for (let i = 0; i < 3; i++) { const p = ((t * 0.35 + i / 3) % 1); g.save(); g.globalAlpha = 0.22 * Math.sin(p * Math.PI); g.globalCompositeOperation = 'lighter'; poly(g, [[lerp(1300, -300, p), by], [lerp(1400, -200, p), by], [lerp(1200, -400, p), by + 900], [lerp(1100, -500, p), by + 900]], 'rgba(255,170,90,1)'); g.restore(); }
  line(g, -80, by + 640, 1160, by + 640, 6, '#2a2c34', 'butt');
  fillRR(g, 820, by + 600, 110, 26, 12, '#3a3c44'); // ドアの取っ手
  g.lineWidth = 5; g.strokeStyle = '#262830'; g.beginPath(); g.moveTo(80, by + 40); g.lineTo(80, by + 900); g.stroke();
  // ワゴンの窓（スモーク）。下りると中の暗がり
  const wx = 150, wy = by + 70, ww = 780, wh = 460;
  fillRR(g, wx - 14, wy - 14, ww + 28, wh + 28, 36, '#25272e'); fillRR(g, wx, wy, ww, wh, 30, '#030305');
  g.save(); rr(g, wx, wy, ww, wh, 30); g.clip();
  // 中の男（影だけ）
  const hx = wx + ww * 0.56, hy = wy + wh * 0.42;
  ell(g, hx, hy + 330, 300, 220, '#07070a'); ell(g, hx, hy, 105, 125, '#09090c');
  g.save(); g.lineWidth = 5; g.strokeStyle = 'rgba(255,170,90,.35)'; g.beginPath(); g.ellipse(hx, hy, 105, 125, 0, -2.6, -0.9); g.stroke(); g.beginPath(); g.ellipse(hx, hy + 330, 300, 220, 0, -2.4, -1.6); g.stroke(); g.restore();
  // スマホ（かざす）
  const k = easeOut(clamp(raise)), px = lerp(hx + 40, wx + ww * 0.3, k), py = lerp(wy + wh + 200, wy + wh * 0.18, k), pw = 250, ph = 440;
  if (raise > 0) {
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, px + pw / 2, py + ph / 2, 420, 'rgba(160,190,230,1)', 0.28 * k); g.restore();
    // スマホの光があごと手に当たる
    g.save(); g.globalAlpha = 0.5 * k; ell(g, hx - 20, hy + 90, 70, 34, 'rgba(120,140,170,.6)'); g.restore();
    fillRR(g, px - 12, py - 12, pw + 24, ph + 24, 30, '#08090c');
    g.save(); rr(g, px, py, pw, ph, 20); g.clip(); g.translate(px, py); if (screen) screen(g, pw, ph); else { g.fillStyle = '#9fb4d8'; g.fillRect(0, 0, pw, ph); } g.restore();
  }
  g.restore();
  // スモークガラス（上から down の分だけ下がる）
  const gh = wh * (1 - ease(clamp(down)));
  if (gh > 0) { g.save(); rr(g, wx, wy, ww, wh, 30); g.clip(); vgrad(g, wx, wy + wh - gh, ww, gh, [[0, '#1c1f28'], [1, '#0e1016']]); for (let i = 0; i < 3; i++) { const p = ((t * 0.35 + i / 3) % 1); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lerp(1100, -100, p), wy + wh * 0.4, 160, 'rgba(255,170,80,1)', 0.3); g.restore(); } g.globalAlpha = 0.12; poly(g, [[wx + 60, wy + wh - gh], [wx + 240, wy + wh - gh], [wx + 120, wy + wh], [wx - 60, wy + wh]], '#fff'); g.restore(); line(g, wx + 10, wy + wh - gh, wx + ww - 10, wy + wh - gh, 6, '#2a2c34', 'butt'); }
  g.restore();
  // こちらの窓枠（運転席の内側）
  g.lineWidth = 50; g.strokeStyle = D.cab; rr(g, 35, 125, 1010, 1050, 70); g.stroke();
  fillRR(g, -300, 1170, W + 600, 1100, 0, '#08090c');
  vgrad(g, -300, 1100, W + 600, 160, [[0, 'rgba(8,9,12,0)'], [1, 'rgba(8,9,12,1)']]);
}

// ---------- 第3話〜 ----------
// SDカード（指先でつまむ）。x,y＝カードの中心、s＝大きさ、label＝手書きのラベル
export function sdCard(g, x, y, s = 1, { rot = -0.12, label = '12/5', hand = 1 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  poly(g, [[-120, -160], [80, -160], [120, -120], [120, 160], [-120, 160]], '#1d2c58'); g.restore();
  poly(g, [[-120, -160], [80, -160], [120, -120], [120, 160], [-120, 160]], '#1d2c58');
  for (let i = 0; i < 8; i++) fillRR(g, -100 + i * 25, -150, 16, 46, 3, '#d9b860');
  fillRR(g, -96, -70, 192, 120, 8, '#e9ecf2'); text(g, 'SD', -30, -14, { size: 70, color: '#1d2c58', weight: 900 }); text(g, '32GB', 52, 20, { size: 30, color: '#1d2c58', weight: 800 });
  // 手書きのラベル（マスキングテープ）
  fillRR(g, -104, 74, 208, 66, 4, '#e8dcb8'); text(g, label, 0, 108, { size: 44, color: '#2a2218', weight: 700, font: SERIF });
  g.restore();
  if (hand) {
    g.save(); g.translate(x, y); g.rotate(rot);
    ell(g, -40, 250 * s, 120 * s, 70 * s, C.skin, 0.2); ell(g, 60 * s, 200 * s, 60 * s, 40 * s, C.skin, -0.5);
    line(g, -150 * s, 420 * s, -60 * s, 270 * s, 150 * s, '#1e2a40');
    g.restore();
  }
}
// ドラレコの前のカメラ（フロントガラスの向こうの道）。白黒の録画の画面
// lights 0..1＝角の暗がりで黒いワゴンのヘッドライトがつく、walk 0..1＝降りた女が角のほうへ歩く（後ろ姿の影）、stop 0..1＝車が止まる
export function frontCam(g, x, y, w, h, { t = 0, lights = 0, walk = 0, stop = 1, date = '2025/12/05', clock = '00:53:41', label = 'CAM1 前方', car = '6号車', rec = 1 } = {}) {
  g.save(); rr(g, x, y, w, h, 6); g.clip(); g.translate(x, y);
  const s = w / 1000; g.save(); g.scale(s, h / 1100);
  vgrad(g, 0, 0, 1000, 1100, [[0, '#08090b'], [0.5, '#16181b'], [1, '#2a2c2e']]);
  const hz = 470;
  // 住宅の黒い影と、ぽつんと街灯
  for (let i = 0; i < 6; i++) { const bx = i < 3 ? i * 120 - 40 : 640 + (i - 3) * 130, bh = 120 + ((i * 37) % 80); fillRR(g, bx, hz - bh, 140, bh, 2, '#0b0c0e'); if (i % 2) fillRR(g, bx + 40, hz - bh + 30, 24, 20, 2, 'rgba(255,220,160,.35)'); }
  line(g, 300, 120, 300, hz + 20, 8, '#050506', 'butt'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 300, 130, 220, 'rgba(255,240,220,1)', 0.35); g.restore();
  // 道（奥で左に曲がる角）
  poly(g, [[-100, 1100], [1100, 1100], [600, hz], [420, hz]], '#1c1d20');
  poly(g, [[420, hz], [600, hz], [560, hz - 30], [180, hz - 30]], '#18191c');
  for (let i = 0; i < 5; i++) { const k = (i / 5); const yy = lerp(hz + 10, 1100, k * k), wv = lerp(4, 40, k * k), hh = lerp(8, 120, k * k); fillRR(g, 510 - wv / 2, yy, wv, hh, 3, 'rgba(230,230,230,.5)'); }
  // ヘッドライトが道を照らす
  const lt = clamp(lights);
  if (lt > 0) { g.save(); g.globalAlpha = lt * 0.5; poly(g, [[440, hz - 10], [640, hz - 10], [1000, 1100], [0, 1100]], 'rgba(255,250,230,.5)'); g.restore(); }
  // 角の暗がりに黒いワゴン（こちら向き）
  g.save(); g.globalAlpha = 0.35 + 0.65 * lt; wagonFront(g, 470, hz - 20, 0.42, { lights: lt, t }); g.restore();
  // 降りた女の後ろ姿（ヘッドライトの中で影になる）
  if (walk > 0) {
    const k = ease(clamp(walk)), fx = lerp(560, 500, k), fy = lerp(900, 620, k), sc = lerp(1, 0.55, k);
    g.save(); g.translate(fx, fy); g.scale(sc, sc);
    fillRR(g, -50, -230, 100, 230, 40, '#050506'); circ(g, 0, -270, 46, '#050506'); fillRR(g, -40, -10, 30, 150, 12, '#050506'); fillRR(g, 10, -10, 30, 150, 12, '#050506');
    if (lt > 0) { g.save(); g.globalAlpha = lt * 0.6; g.lineWidth = 6; g.strokeStyle = 'rgba(255,250,230,1)'; g.beginPath(); g.arc(0, -270, 48, -2.8, -0.3); g.stroke(); g.restore(); }
    g.restore();
  }
  // ボンネットの先（手前）
  vgrad(g, 0, 980, 1000, 120, [[0, 'rgba(10,11,13,0)'], [1, 'rgba(10,11,13,1)']]);
  g.restore();
  // 白黒・周辺減光・走査線・ノイズ（車内カメラと同じ）
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#b8c8d0'; g.fillRect(0, 0, w, h); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(40,60,70,.35)'; g.fillRect(0, 0, w, h); g.restore();
  const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.save(); g.globalAlpha = 0.12; for (let yy = 0; yy < h; yy += 6 * s + 2) { g.fillStyle = '#000'; g.fillRect(0, yy, w, 2); } g.restore();
  const R = rng(3 + Math.floor(t * 24)); g.save(); g.globalAlpha = 0.18; for (let i = 0; i < 260; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * w, R() * h, 3 * s + 1, 3 * s + 1); } g.restore();
  const fs = Math.max(18, 40 * s);
  if (rec && Math.sin(t * 5) > -0.3) { circ(g, 46 * s + 8, 50 * s + 6, 15 * s + 3, D.rec); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 46 * s + 8, 50 * s + 6, 60 * s + 10, 'rgba(255,60,60,1)', 0.6); g.restore(); }
  text(g, 'REC', 80 * s + 14, 52 * s + 6, { size: fs, color: '#fff', align: 'left', weight: 800, stroke: '#000', sw: 4 });
  text(g, `${date}  ${clock}`, w - 30 * s - 6, 52 * s + 6, { size: fs * 0.9, color: '#f4f6f8', align: 'right', weight: 700, stroke: '#000', sw: 4 });
  text(g, label, 30 * s + 6, h - 40 * s - 6, { size: fs * 0.75, color: '#e4e8ea', align: 'left', weight: 700, stroke: '#000', sw: 4 });
  text(g, `${car}  ${stop >= 1 ? '0' : Math.round(lerp(18, 0, clamp(stop)))} km/h`, w - 30 * s - 6, h - 40 * s - 6, { size: fs * 0.75, color: '#e4e8ea', align: 'right', weight: 700, stroke: '#000', sw: 4 });
  g.restore();
}
// 再生中の印（▶ PLAY と、下の再生バー）。録画の画面の上に重ねる
export function playMark(g, x, y, w, h, { p = 0.3, label = '▶ 再生中　20251205_004107.MP4' } = {}) {
  const y0 = y + h - h * 0.13;
  fillRR(g, x, y0, w, h * 0.065, 0, 'rgba(0,0,0,.55)');
  text(g, label, x + 24, y0 + h * 0.022, { size: Math.max(18, w * 0.026), color: '#fff', align: 'left', weight: 700 });
  fillRR(g, x + 24, y0 + h * 0.045, w - 48, 8, 4, 'rgba(255,255,255,.25)'); fillRR(g, x + 24, y0 + h * 0.045, (w - 48) * clamp(p), 8, 4, D.rec);
}
