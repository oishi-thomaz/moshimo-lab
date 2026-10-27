// 「#拡散希望」第2〜5話の背景と画面：隠しスマホ・自撮り写真・駐車場・警察署・港の倉庫・削除画面・共有アルバム ほか
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, FONT, SERIF } from './core.js';
import { C, toneRect, toneFill, CAST2, figure, head, close } from './noir.js';
import { K, short, avatar, appIcon } from './sns.js';
import { morningSky, misakiRoom, sofaPhoto } from './kakusets.js';

const P = CAST2;
// 1000x700 などの内側座標を、w×h いっぱいに覆うように置く
function fit(g, w, h, iw, ih, draw) { const s = Math.max(w / iw, h / ih); g.save(); g.translate((w - iw * s) / 2, (h - ih * s) / 2); g.scale(s, s); draw(); g.restore(); }
function grain(g, w, h, a = 0.12, seed = 5, n = 900) { const R = rng(seed); g.save(); g.globalAlpha = a; for (let i = 0; i < n; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * w, R() * h, 3, 3); } g.restore(); }
export const nightSky = (g, { y0 = -300, h = H + 600 } = {}) => vgrad(g, -400, y0, W + 800, h, [[0, '#0b1020'], [0.6, '#151c30'], [1, '#232a3c']]);

// ---------- 鬼塚の配信映像（インターホン・配信の中） ----------
export function onizukaCam(g, w, h, t, { crowd = 1, bg = 'day', point = 0, place = null } = {}) {
  if (bg === 'night') { nightSky(g, { y0: 0, h }); } else morningSky(g, { y0: 0, h });
  if (place === 'police') { fillRR(g, -20, h * 0.08, w * 0.75, h * 0.6, 4, '#a4a8ae'); for (let i = 0; i < 4; i++) fillRR(g, w * 0.05 + i * w * 0.17, h * 0.18, w * 0.12, h * 0.14, 3, '#5a6474'); fillRR(g, w * 0.08, h * 0.38, w * 0.5, h * 0.07, 3, '#1e2a44'); text(g, '駅前警察署', w * 0.33, h * 0.415, { size: w * 0.045, color: '#fff' }); }
  fillRR(g, 0, h * 0.62, w, h * 0.4, 0, bg === 'night' ? '#3a3e48' : '#8a8a90');
  if (crowd) for (let i = 0; i < 6; i++) { const R = rng(i + 9); figure(g, { ...P.kento, top: ['#5a6070', '#7a6a5a', '#6a7a6a', '#4a5a7a', '#7a5a6a', '#5a5a5a'][i], hair: i % 2 ? 'parted' : 'messy' }, { x: w * (0.08 + i * 0.17), y: h * 1.02, s: w / 1080 * 0.9, phone: i % 2 === 0, arms: [10, 0, 40, -120], eyes: 'narrow', turn: (R() - 0.5) * 0.6, shadow: false }); }
  g.save(); g.translate(w * 0.5, h * 0.55); const s = w / 1080 * 3.0; g.scale(s / 4, s / 4); close(g, P.onizuka, { x: 0, y: 0, s: 4, mouth: 'open', talk: 0.5 + 0.5 * Math.abs(Math.sin(t * 12)), eyes: 'wide', brow: 0.5, lightFrom: 'left' }); g.restore();
  if (point) { g.save(); g.globalAlpha = point; line(g, w * 0.62, h * 0.95, w * 0.9, h * 0.5, w * 0.05, P.onizuka.top2); circ(g, w * 0.9, h * 0.5, w * 0.03, C.skin); g.restore(); }
  line(g, w * 0.85, h * 1.1, w * 0.72, h * 0.62, w * 0.012, '#111');
}

// ---------- スマホの中の画面 ----------
// チャット（相手の名前・吹き出し）
export function chatScreen(g, w, h, { name = '', av = 'onizuka', msgs = [], t = 9 } = {}) {
  vgrad(g, 0, 0, w, h, [[0, '#121822'], [1, '#0b0f16']]);
  fillRR(g, 0, 0, w, 190, 0, '#18202c'); avatar(g, av, 90, 120, 40); text(g, name, 150, 120, { size: 44, color: '#fff', align: 'left' });
  let y = 260;
  for (const m of msgs) {
    const a = clamp((t - (m.t || 0)) / 0.25); if (a <= 0) continue;
    g.save(); g.globalAlpha = a; g.font = `800 42px ${FONT}`;
    const lines = String(m.text).split('\n'), bw = Math.min(w - 160, Math.max(...lines.map(s => g.measureText(s).width)) + 60), bh = lines.length * 58 + 40;
    const x = m.me ? w - 40 - bw : 40; fillRR(g, x, y, bw, bh, 30, m.me ? K.orange : '#2a3342');
    lines.forEach((s, i) => text(g, s, x + 30, y + 48 + i * 58, { size: 42, color: '#fff', align: 'left' }));
    if (m.time) text(g, m.time, m.me ? x - 14 : x + bw + 14, y + bh - 18, { size: 24, color: K.sub, align: m.me ? 'right' : 'left', weight: 500 });
    g.restore(); y += bh + 30;
  }
}
// カメラの録画画面（ソファを撮っている）
export function recScreen(g, w, h, { t = 0 } = {}) {
  fit(g, w, h, 700, 1000, () => { g.save(); g.translate(-150, 150); sofaPhoto(g, 1000, 700); g.restore(); vgrad(g, 0, 0, 700, 150, [[0, '#000'], [1, '#000']]); vgrad(g, 0, 850, 700, 150, [[0, '#000'], [1, '#000']]); });
  if (Math.sin(t * 5) > -0.3) circ(g, 70, 110, 16, K.red);
  const s = 8000 + Math.floor(t); text(g, `REC  0${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, 100, 112, { size: 34, color: '#fff', align: 'left' });
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.6)'; for (const [x, y, sx, sy] of [[40, 200, 1, 1], [w - 40, 200, -1, 1], [40, h - 240, 1, -1], [w - 40, h - 240, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * 60); g.lineTo(x, y); g.lineTo(x + sx * 60, y); g.stroke(); }
  circ(g, w / 2, h - 110, 52, '#fff'); fillRR(g, w / 2 - 26, h - 136, 52, 52, 10, K.red);
}
// 写真の表示画面（日時と共有アルバム）
export function photoView(g, w, h, { img, date = '10月26日 23:12', shared = 'アカリとミサキ' } = {}) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  text(g, date, w / 2, 110, { size: 36, color: '#fff' });
  g.save(); rr(g, 0, 170, w, h - 340, 0); g.clip(); g.translate(0, 170); img(g, w, h - 340); g.restore();
  if (shared) { fillRR(g, w / 2 - 230, h - 140, 460, 70, 35, 'rgba(255,255,255,.14)'); text(g, `共有アルバム：${shared}`, w / 2, h - 105, { size: 30, color: '#fff', weight: 700 }); }
}
// 写真の一覧（共有アルバム）
export function albumScreen(g, w, h, { t = 9, hi = 0, title = 'アカリとミサキ', selfie } = {}) {
  vgrad(g, 0, 0, w, h, [[0, '#f4f4f6'], [1, '#e9e9ee']]);
  text(g, '共有アルバム', 50, 110, { size: 30, color: '#667', align: 'left', weight: 600 });
  text(g, title, 50, 170, { size: 56, color: '#111', align: 'left' });
  const cols = 3, gap = 8, cw = (w - gap * (cols + 1)) / cols;
  const cs = ['#c9b8a4', '#a4b4c9', '#b4c9a4', '#d9c0a8', '#9aa4b4', '#c4a4b4', '#a8c4c0', '#c0b0a0'];
  for (let i = 0; i < 12; i++) {
    const x = gap + (i % cols) * (cw + gap), y = 240 + Math.floor(i / cols) * (cw + gap);
    g.save(); rr(g, x, y, cw, cw, 6); g.clip();
    if (i === 0 && selfie) { g.translate(x, y); selfie(g, cw, cw); g.translate(-x, -y); }
    else { fillRR(g, x, y, cw, cw, 0, cs[i % cs.length]); circ(g, x + cw * 0.5, y + cw * 0.45, cw * 0.18, 'rgba(255,255,255,.5)'); }
    g.restore();
  }
  if (hi > 0) { const x = gap, y = 240; g.save(); g.globalAlpha = hi; g.lineWidth = 10; g.strokeStyle = K.orange; rr(g, x - 4, y - 4, cw + 8, cw + 8, 10); g.stroke(); fillRR(g, x + 12, y + cw - 56, 130, 44, 22, 'rgba(0,0,0,.7)'); text(g, '23:12', x + 77, y + cw - 34, { size: 28, color: '#fff' }); g.restore(); }
}
// 写真を消す画面
export function deleteScreen(g, w, h, { k = 0, img } = {}) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  if (k < 1) { g.save(); g.globalAlpha = 1 - clamp((k - 0.6) / 0.3); rr(g, 0, 170, w, h - 340, 0); g.clip(); g.translate(0, 170); img(g, w, h - 340); g.restore(); }
  if (k > 0.05 && k < 0.6) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, w, h); fillRR(g, 60, h / 2 - 170, w - 120, 340, 30, '#2a2f38'); text(g, 'この写真を削除しますか？', w / 2, h / 2 - 80, { size: 40, color: '#fff' }); line(g, 60, h / 2 + 10, w - 60, h / 2 + 10, 2, '#454b56', 'butt'); text(g, '削除', w / 2, h / 2 + 90, { size: 46, color: K.red }); }
  if (k >= 0.6) { const a = clamp((k - 0.6) / 0.2); g.save(); g.globalAlpha = a; fillRR(g, 80, h / 2 - 60, w - 160, 120, 60, 'rgba(255,255,255,.12)'); text(g, '写真を削除しました', w / 2, h / 2, { size: 42, color: '#fff' }); g.restore(); }
}
// アカウントの切り替え（ジャスティス鬼塚／正義の目）
export function acctScreen(g, w, h, { t = 9 } = {}) {
  vgrad(g, 0, 0, w, h, [[0, '#121822'], [1, '#0b0f16']]);
  text(g, 'アカウントを切り替え', w / 2, 120, { size: 40, color: '#fff' });
  const rows = [['onizuka', 'ジャスティス鬼塚', '@justice_onizuka'], ['eye', '正義の目', '@seigi_no_me']];
  rows.forEach(([av, n, hd], i) => { const y = 260 + i * 200, a = clamp((t - i * 0.6) / 0.3); g.save(); g.globalAlpha = a; fillRR(g, 30, y, w - 60, 170, 26, i ? 'rgba(255,106,43,.16)' : '#18202c'); if (i) { g.lineWidth = 4; g.strokeStyle = K.orange; rr(g, 30, y, w - 60, 170, 26); g.stroke(); } avatar(g, av, 110, y + 85, 50); text(g, n, 190, y + 66, { size: 42, color: '#fff', align: 'left' }); text(g, hd, 190, y + 116, { size: 28, color: K.sub, align: 'left', weight: 500 }); if (i) { circ(g, w - 90, y + 85, 24, K.orange); line(g, w - 102, y + 85, w - 92, y + 96, 6, '#fff'); line(g, w - 92, y + 96, w - 76, y + 74, 6, '#fff'); } g.restore(); });
}
// 配信終了の画面
export function streamEnd(g, w, h, { a = 1 } = {}) { g.save(); g.globalAlpha = a; g.fillStyle = '#000'; g.fillRect(0, 0, w, h); text(g, '配信が終了しました', w / 2, h / 2 - 20, { size: Math.min(56, w * 0.06), color: '#f4f6f8' }); text(g, 'LIVE', w / 2, h / 2 + 60, { size: 30, color: '#555c68' }); g.restore(); }

// ---------- 写真 ----------
// あの夜の自撮り（900x1200）。笑うアカリ、右奥の路地に刃物を持った男
export function selfiePhoto(g, w, h, { reveal = 0 } = {}) {
  fit(g, w, h, 900, 1200, () => {
    vgrad(g, 0, 0, 900, 1200, [[0, '#0c1018'], [1, '#1c1e26']]);
    glow(g, 160, 120, 420, 'rgba(255,220,160,1)', 0.45); fillRR(g, 150, 100, 16, 900, 3, '#07090e');
    // 建物と路地
    fillRR(g, 300, 160, 230, 760, 4, '#151a26'); fillRR(g, 760, 140, 220, 800, 4, '#151a26');
    vgrad(g, 530, 200, 230, 720, [[0, '#06070b'], [1, '#0d0f15']]);
    for (let i = 0; i < 4; i++) fillRR(g, 330 + (i % 2) * 110, 220 + Math.floor(i / 2) * 200, 70, 110, 3, '#2a3040');
    vgrad(g, 0, 900, 900, 300, [[0, '#24262e'], [1, '#14151a']]);
    // 路地の男（鬼塚）：暗く、帽子に小さなオレンジ、手元に光る刃物
    g.save(); g.globalAlpha = 0.85; figure(g, { ...P.onizuka, top: mix('#e8572a', '#1a1c22', 0.62), top2: mix('#c9461f', '#121318', 0.62), bottom: '#0c0d10', shoes: '#3a3a3a' }, { x: 645, y: 900, s: 0.62, turn: -0.3, look: -0.6, arms: [8, 0, 30, -60], eyes: 'narrow', brow: 0.6, shadow: false }); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; line(g, 680, 690, 712, 652, 6, 'rgba(230,240,255,.9)'); glow(g, 698, 668, 50, 'rgba(220,235,255,1)', 0.5 + reveal * 0.3); g.restore();
    // アカリ（自撮り・笑顔）
    close(g, P.akari, { x: 260, y: 720, s: 1.75, mouth: 'smile', eyes: 'narrow', brow: 0.2, lightFrom: 'right', phoneLight: true });
    grain(g, 900, 1200, 0.1, 7, 1400);
  });
}
// 拡散された別の写真（知らない女の子）
export function girlPhoto(g, w, h, { circleA = 1 } = {}) {
  g.save(); g.scale(w / 1000, h / 700);
  morningSky(g, { y0: 0, h: 700 }); g.save(); g.scale(1000 / W, 1); g.restore();
  fillRR(g, 0, 0, 1000, 700, 0, 'rgba(200,205,215,.5)');
  for (let i = 0; i < 4; i++) fillRR(g, -40 + i * 280, 100, 240, 460, 4, mix('#9aa0aa', '#b4b8c0', i % 2));
  vgrad(g, 0, 520, 1000, 180, [[0, '#8a8a90'], [1, '#6a6a70']]);
  figure(g, { ...P.misaki, hair: 'pony', hairC: '#1e1a1c', top: '#e4e0e8', top2: '#d0ccd4', bottom: '#3a4a6a' }, { x: 520, y: 690, s: 0.9, turn: 0.3, look: 0.4, arms: [10, 0, 10, 0], eyes: 'narrow', shadow: false });
  grain(g, 1000, 700, 0.1, 11);
  if (circleA > 0) { g.save(); g.globalAlpha = circleA; g.lineWidth = 12; g.strokeStyle = '#ff2a2a'; g.beginPath(); g.ellipse(520, 400, 150, 260, -0.05, 0, 7); g.stroke(); g.restore(); }
  g.restore();
}
// 健人とミサキの写真
export function couplePhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#f0d8b8'], [1, '#d8b898']]); glow(g, 500, 120, 500, 'rgba(255,240,210,1)', 0.5);
  figure(g, P.kento, { x: 380, y: 760, s: 0.95, turn: 0.3, look: 0.4, arms: [10, 0, 60, -40], mouth: 'smile', eyes: 'narrow', shadow: false });
  figure(g, P.misaki, { x: 620, y: 760, s: 0.95, turn: -0.3, look: -0.4, arms: [60, -40, 10, 0], mouth: 'smile', eyes: 'narrow', shadow: false });
  g.restore();
}
// 撮影現場の写真：ポーズをとる鬼塚と、カメラを構える健人
export function crewPhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  morningSky(g, { y0: 0, h: 700 }); fillRR(g, 0, 0, 1000, 700, 0, 'rgba(160,170,190,.35)'); vgrad(g, 0, 520, 1000, 180, [[0, '#8a8a90'], [1, '#6a6a70']]);
  figure(g, P.onizuka, { x: 330, y: 700, s: 0.95, turn: 0.4, look: 1, arms: [40, -60, 120, -150], mouth: 'open', eyes: 'wide', brow: 0.5, shadow: false });
  const k = figure(g, P.kento, { x: 720, y: 700, s: 0.95, turn: -0.5, look: -1, arms: [70, -80, 70, -80], eyes: 'narrow', shadow: false });
  g.save(); g.translate(640, 330); fillRR(g, -70, -40, 120, 80, 10, '#15161a'); circ(g, -70, 0, 34, '#2a2c32'); circ(g, -70, 0, 20, '#0a0b0e'); fillRR(g, -20, -62, 40, 22, 4, '#15161a'); g.restore();
  grain(g, 1000, 700, 0.06, 3, 600);
  g.restore();
}
// 白い軽自動車の写真（@正義の目の投稿）
export function carPhoto(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700);
  vgrad(g, 0, 0, 1000, 700, [[0, '#1a2030'], [1, '#2a2e38']]); for (let i = 0; i < 6; i++) glow(g, 100 + i * 170, 120, 90, 'rgba(255,220,160,1)', 0.35);
  vgrad(g, 0, 300, 1000, 400, [[0, '#3a3c44'], [1, '#22242a']]); for (let i = 0; i < 5; i++) fillRR(g, 60 + i * 200, 520, 110, 14, 4, 'rgba(255,255,255,.5)');
  carBack(g, 500, 470, 1.1);
  grain(g, 1000, 700, 0.12, 21);
  g.restore();
}
// 白い軽自動車（後ろ）
export function carBack(g, x, y, s = 1, { lights = 1 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  ell(g, 0, 150, 260, 26, 'rgba(0,0,0,.45)');
  fillRR(g, -230, -40, 460, 190, 40, '#e8e8ea'); fillRR(g, -190, -170, 380, 150, 46, '#dcdcde'); fillRR(g, -160, -150, 320, 110, 24, '#2a3240');
  fillRR(g, -220, 40, 70, 34, 10, lights ? '#ff3a3a' : '#7a2a2a'); fillRR(g, 150, 40, 70, 34, 10, lights ? '#ff3a3a' : '#7a2a2a');
  fillRR(g, -60, 70, 120, 44, 6, '#f4f4f4'); text(g, '・ 12-34', 0, 92, { size: 26, color: '#2a2a2a' });
  fillRR(g, -230, 140, 90, 30, 6, '#1a1a1e'); fillRR(g, 140, 140, 90, 30, 6, '#1a1a1e');
  if (lights) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, -185, 57, 80, 'rgba(255,40,40,1)', 0.4); glow(g, 185, 57, 80, 'rgba(255,40,40,1)', 0.4); g.restore(); }
  g.restore();
}

// ---------- 場所 ----------
// 本棚のアップ：本のすき間のスマホ（赤い光）と伸びる手
export function shelfClose(g, { t = 0, hand = 0, pull = 0, dot = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#4a3a30'], [1, '#2a2018']]);
  fillRR(g, -60, 180, 1200, 1500, 8, '#6a4a32');
  const cols = ['#8a5a4a', '#4a6a8a', '#d9c8a4', '#6a8a5a', '#a4a4b4', '#8a6aa4', '#b4845a'];
  for (let r = 0; r < 3; r++) { const y0 = 240 + r * 480; fillRR(g, -40, y0, 1160, 430, 4, '#3a2a1e'); let x = -20; let i = r * 3; while (x < 1100) { const bw = 70 + ((i * 37) % 50), bh = 330 + ((i * 53) % 80); if (r === 0 && x > 380 && x < 640) { x = 660; continue; } fillRR(g, x, y0 + 430 - bh, bw - 8, bh, 4, cols[i % cols.length]); line(g, x + 12, y0 + 430 - bh + 40, x + bw - 20, y0 + 430 - bh + 40, 6, 'rgba(255,255,255,.25)', 'butt'); x += bw; i++; } }
  // すき間のスマホ（横倒し、カメラがこちら）
  g.save(); g.translate(520 + pull * 40, 560 + pull * 420); g.rotate(pull * 0.3);
  fillRR(g, -110, -60, 220, 120, 18, '#0d0e12'); circ(g, 70, -20, 18, '#2a2c34'); circ(g, 70, -20, 9, '#0a0b0e');
  if (dot && (dot >= 1 || Math.sin(t * 6) > 0)) { circ(g, 30, -30, 8, '#ff2a2a'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 30, -30, 70, 'rgba(255,40,40,1)', 0.7); g.restore(); }
  g.restore();
  // 手
  if (hand > 0) { const hx = lerp(1300, 640 + pull * 40, ease(clamp(hand))), hy = lerp(1500, 640 + pull * 420, ease(clamp(hand))); line(g, 1400, 1900, hx + 60, hy + 80, 120, P.akari.top2); ell(g, hx, hy, 80, 60, C.skin, -0.5); for (let f = 0; f < 4; f++) line(g, hx - 30, hy - 30 + f * 22, hx - 100, hy - 50 + f * 26, 26, C.skin); }
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.12)', 9, 2);
}
// 非常階段を駆け下りる2人（昼）
export function fireStairs(g, { t = 0 } = {}) {
  morningSky(g);
  fillRR(g, -100, 200, 520, 1900, 6, '#c9c4ba'); toneRect(g, -100, 200, 520, 1900, 'rgba(0,0,0,.15)', 10, 2.4);
  for (let i = 0; i < 9; i++) { const y = 240 + i * 200, d = i % 2; line(g, d ? 1000 : 440, y, d ? 440 : 1000, y + 200, 16, '#5a5e66'); line(g, 440, y + 200, 1000, y + 200, 10, '#7a7e86', 'butt'); for (let k = 0; k < 6; k++) line(g, 440 + k * 112, y + 200, 440 + k * 112, y + 140, 5, '#7a7e86', 'butt'); }
  line(g, 440, 100, 440, 2100, 10, '#4a4e56', 'butt'); line(g, 1000, 100, 1000, 2100, 10, '#4a4e56', 'butt');
  const k = (t * 0.35) % 1, y = lerp(560, 1400, k), x = lerp(560, 900, (k * 2) % 1);
  figure(g, P.misaki, { x: x + 90, y: y + 190, s: 0.75, walk: t * 2, turn: 0.5, look: 1, arms: [40, -20, 70, -40], eyes: 'wide', mouth: 'grit', shadow: false });
  figure(g, P.akari, { x, y: y + 160, s: 0.75, walk: t * 2 + 0.5, turn: 0.5, look: 1, arms: [40, -20, 90, -60], eyes: 'wide', brow: -0.6, mouth: 'grit', shadow: false });
}
// 地下駐車場：柱と蛍光灯、白い軽自動車、スマホを掲げて歩く人たち
export function garage(g, { t = 0, pass = 0, heads = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2e34'], [1, '#16181c']]);
  for (let i = 0; i < 3; i++) { fillRR(g, 120 + i * 360, 300, 240, 16, 6, '#e8f0f4'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 240 + i * 360, 320, 260, 'rgba(210,235,245,1)', 0.25 + (i === 1 ? 0.08 * Math.max(0, Math.sin(t * 30)) : 0)); g.restore(); }
  fillRR(g, 40, 300, 150, 1300, 4, '#5a5e64'); fillRR(g, 890, 300, 150, 1300, 4, '#5a5e64'); text(g, 'B2', 115, 700, { size: 70, color: '#e8d84a' });
  vgrad(g, -300, 1200, W + 600, 900, [[0, '#3a3c42'], [1, '#22242a']]); for (let i = 0; i < 4; i++) line(g, 100 + i * 300, 1250, -80 + i * 420, 1900, 8, 'rgba(240,240,240,.35)', 'butt');
  // 車（前から）
  g.save(); g.translate(540, 1200);
  ell(g, 0, 280, 380, 40, 'rgba(0,0,0,.5)'); fillRR(g, -340, 40, 680, 230, 50, '#e8e8ea'); fillRR(g, -280, -160, 560, 230, 60, '#dcdcde'); fillRR(g, -240, -130, 480, 170, 30, '#1e2430');
  if (heads) { circ(g, -90, 30, 54, P.akari.hairC); circ(g, 100, 30, 56, P.misaki.hairC); }
  fillRR(g, -320, 120, 110, 50, 16, '#f4f0d8'); fillRR(g, 210, 120, 110, 50, 16, '#f4f0d8'); fillRR(g, -110, 170, 220, 50, 8, '#2a2a30');
  g.restore();
  // 通り過ぎる人たち（スマホを掲げる）
  if (pass > 0) for (let i = 0; i < 4; i++) { const x = lerp(-200, 1300, ((pass * 0.6) + i * 0.22) % 1.2); figure(g, { ...P.kento, top: ['#5a6070', '#7a6a5a', '#6a7a6a', '#4a5a7a'][i], hair: i % 2 ? 'parted' : 'messy' }, { x, y: 1700 + (i % 2) * 40, s: 1.2, walk: t * 1.5 + i, turn: 0.5, look: 1, phone: true, arms: [10, 0, 40, -120], eyes: 'narrow' }); }
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.12)', 9, 2);
}
// 車の中：フロントガラス越しの2人（運転席ミサキ・助手席アカリ）の胸から上
export function carInside(g, { t = 0, outside = 'garage', akari = {}, misaki = {}, drive = 0 } = {}) {
  if (outside === 'night') { nightSky(g); for (let i = 0; i < 6; i++) { const x = ((i * 300 - t * 500 * drive) % 1800 + 1800) % 1800 - 300; glow(g, x, 380, 180, 'rgba(255,210,150,1)', 0.45); } }
  else { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2e34'], [1, '#16181c']]); fillRR(g, 160, 300, 260, 14, 6, '#e8f0f4'); glow(g, 290, 320, 300, 'rgba(210,235,245,1)', 0.22); fillRR(g, 700, 260, 120, 900, 4, '#3a3e44'); }
  // 座席のヘッドレスト
  fillRR(g, 170, 560, 300, 260, 60, '#1c1e24'); fillRR(g, 610, 560, 300, 260, 60, '#1c1e24');
  close(g, P.akari, { x: 320, y: 930, s: 2.4, eyes: 'narrow', brow: -0.5, mouth: 'line', lightFrom: 'left', turn: 0.3, look: 0.4, ...akari });
  close(g, P.misaki, { x: 760, y: 930, s: 2.4, eyes: 'narrow', brow: -0.4, mouth: 'line', lightFrom: 'right', turn: -0.3, look: -0.4, ...misaki });
  // フロントガラスの枠・ダッシュボード・ハンドル
  g.fillStyle = '#0a0b0e'; g.fillRect(-300, -300, W + 600, 440); poly(g, [[-300, 140], [90, 140], [-40, 1400], [-300, 1400]], '#0a0b0e'); poly(g, [[W + 300, 140], [W - 90, 140], [W + 40, 1400], [W + 300, 1400]], '#0a0b0e');
  fillRR(g, -300, 1240, W + 600, 900, 50, '#15161b'); line(g, -300, 1250, W + 300, 1250, 6, '#2a2c32', 'butt');
  g.lineWidth = 34; g.strokeStyle = '#22242a'; g.beginPath(); g.ellipse(760, 1300, 230, 120, 0, Math.PI, 2 * Math.PI); g.stroke();
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 700, 760, 'rgba(160,190,230,1)', 0.07); g.restore();
}
// 夜の道を走る白い車（横から）
export function nightDrive(g, { t = 0, fast = 0 } = {}) {
  nightSky(g);
  for (let i = 0; i < 8; i++) { const x = ((i * 260 - t * (600 + fast * 900)) % 2100 + 2100) % 2100 - 400; fillRR(g, x, 420, 18, 900, 3, '#0a0c12'); glow(g, x + 9, 420, 220, 'rgba(255,214,150,1)', 0.45); }
  for (let i = 0; i < 6; i++) { const x = ((i * 380 - t * 300) % 2300 + 2300) % 2300 - 600; fillRR(g, x, 700, 300, 700, 4, '#141826'); for (let r = 0; r < 5; r++) fillRR(g, x + 40, 760 + r * 120, 80, 60, 3, (r + i) % 3 ? '#2a3040' : '#d8b870'); }
  vgrad(g, -300, 1320, W + 600, 800, [[0, '#2a2c34'], [1, '#121318']]);
  for (let i = 0; i < 8; i++) { const x = ((i * 300 - t * (1400 + fast * 1500)) % 2400 + 2400) % 2400 - 600; fillRR(g, x, 1560, 160, 16, 4, 'rgba(255,255,255,.5)'); }
  // 車（横）
  const bob = Math.sin(t * 20) * 3;
  g.save(); g.translate(540, 1420 + bob);
  ell(g, 0, 110, 380, 26, 'rgba(0,0,0,.5)');
  fillRR(g, -360, -60, 720, 160, 50, '#e8e8ea'); fillRR(g, -240, -200, 400, 160, 60, '#dcdcde'); fillRR(g, -210, -175, 160, 110, 20, '#1e2430'); fillRR(g, -30, -175, 160, 110, 20, '#1e2430');
  circ(g, -130, -120, 34, P.misaki.hairC); circ(g, 60, -120, 34, P.akari.hairC);
  for (const wx of [-220, 220]) { circ(g, wx, 100, 64, '#141418'); circ(g, wx, 100, 30, '#8a8e96'); }
  fillRR(g, 320, -20, 40, 30, 10, '#fff4c8'); g.save(); g.globalCompositeOperation = 'lighter'; poly(g, [[360, -20], [900, -120], [900, 120], [360, 10]], 'rgba(255,240,200,.18)'); g.restore();
  g.restore();
  if (fast) { g.save(); g.globalAlpha = fast * 0.5; for (let i = 0; i < 14; i++) { const y = 900 + i * 60, x = ((i * 337 - t * 3000) % 1600 + 1600) % 1600 - 300; line(g, x, y, x + 300, y, 4, 'rgba(255,255,255,.6)'); } g.restore(); }
}
// 警察署の前：配信者と人だかり（夜）
export function policeFront(g, { t = 0 } = {}) {
  nightSky(g);
  fillRR(g, -60, 300, 1200, 1100, 6, '#7a7e86'); toneRect(g, -60, 300, 1200, 1100, 'rgba(0,0,0,.22)', 10, 2.4);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) fillRR(g, 30 + i * 210, 380 + r * 220, 150, 130, 4, (r + i) % 3 ? '#e8d8a0' : '#3a4250');
  fillRR(g, 220, 1050, 640, 90, 6, '#1e2a44'); text(g, '駅前警察署', 540, 1096, { size: 56, color: '#fff' });
  circ(g, 950, 1000, 26, '#ff3a3a'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 950, 1000, 120, 'rgba(255,60,60,1)', 0.5); g.restore();
  vgrad(g, -300, 1400, W + 600, 700, [[0, '#3a3c44'], [1, '#1a1b20']]);
  for (let i = 0; i < 7; i++) { const R = rng(i + 30); figure(g, { ...P.kento, top: ['#5a6070', '#7a6a5a', '#6a7a6a', '#4a5a7a', '#7a5a6a', '#5a5a5a', '#6a6a7a'][i], hair: i % 2 ? 'parted' : 'messy' }, { x: 80 + i * 150 + (R() - 0.5) * 30, y: 1760 + (i % 2) * 50, s: 0.95, phone: true, arms: [10, 0, 40, -120], eyes: 'narrow', turn: (R() - 0.5) * 0.6 }); }
  const k = figure(g, P.onizuka, { x: 540, y: 1700, s: 1.15, turn: -0.2, look: 0, arms: [30, -40, 150, -40], mouth: 'open', talk: 0.5 + 0.5 * Math.abs(Math.sin(t * 10)), eyes: 'wide', brow: 0.5 });
  line(g, k.hr[0], k.hr[1], k.hr[0] + 120, k.hr[1] - 300, 10, '#111'); fillRR(g, k.hr[0] + 80, k.hr[1] - 380, 90, 150, 14, '#0d0e12'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, k.hr[0] + 125, k.hr[1] - 305, 160, 'rgba(255,255,255,1)', 0.35); g.restore();
}
// 夜の港：コンテナ・クレーン・倉庫、フードのアカリ
export function nightPort(g, { t = 0, k = 0, walker = 1 } = {}) {
  nightSky(g); glow(g, 820, 360, 200, 'rgba(230,235,255,1)', 0.25); circ(g, 820, 360, 50, '#e8ecf4');
  line(g, 140, 300, 140, 1300, 22, '#2a3040', 'butt'); line(g, 140, 340, 620, 340, 18, '#2a3040', 'butt'); line(g, 140, 340, 420, 120, 12, '#2a3040'); circ(g, 600, 360, 12, '#ff3a3a');
  vgrad(g, -300, 1000, W + 600, 300, [[0, '#0e1420'], [1, '#141c2c']]); for (let i = 0; i < 12; i++) line(g, (i * 97 + t * 20) % 1200 - 60, 1060 + (i % 4) * 50, (i * 97 + t * 20) % 1200 + 40, 1060 + (i % 4) * 50, 3, 'rgba(180,200,240,.25)');
  // 倉庫
  fillRR(g, 420, 860, 700, 520, 4, '#3a3e48'); poly(g, [[400, 870], [770, 760], [1140, 870]], '#2e3240'); text(g, '3', 770, 960, { size: 110, color: '#e8d84a' });
  fillRR(g, 640, 1100, 260, 280, 4, '#1a1c22'); fillRR(g, 680, 1120, 30, 260, 2, 'rgba(255,220,160,.6)'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 700, 1250, 200, 'rgba(255,214,150,1)', 0.3); g.restore();
  // コンテナ
  for (let i = 0; i < 3; i++) fillRR(g, -60 + i * 160, 1080 - i * 30, 150, 300 + i * 30, 4, ['#6a3a2e', '#2e4a6a', '#5a5a3a'][i]);
  vgrad(g, -300, 1380, W + 600, 700, [[0, '#2a2c34'], [1, '#121318']]);
  if (walker) figure(g, P.akari, { x: lerp(260, 600, k), y: 1720, s: 1.15, walk: t * 1.2, turn: 0.4, look: 1, arms: [20, -20, 20, -20], eyes: 'narrow', brow: -0.5, mouth: 'line' });
  for (let i = 0; i < 5; i++) glow(g, 100 + i * 230, 1400, 70, 'rgba(255,200,140,1)', 0.15);
}
// 倉庫の中：上からの裸電球、奥は暗い
export function warehouse(g, { t = 0, lamp = 1, ring = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#14161c'], [1, '#0a0b0e']]);
  for (let i = 0; i < 6; i++) line(g, -100 + i * 260, 100, -100 + i * 260, 1500, 14, '#1c1f26', 'butt');
  for (let i = 0; i < 4; i++) fillRR(g, -40 + i * 300, 980 - (i % 2) * 60, 240, 420 + (i % 2) * 60, 4, ['#2a2620', '#22262c', '#2a2420', '#20242a'][i]);
  vgrad(g, -300, 1380, W + 600, 800, [[0, '#2a2a2e'], [1, '#141416']]);
  line(g, 540, -300, 540, 420, 4, '#0a0a0a'); circ(g, 540, 440, 26, '#fff4d0');
  g.save(); g.globalCompositeOperation = 'lighter'; const fl = 0.9 + 0.1 * Math.sin(t * 37) * Math.sin(t * 13); poly(g, [[540, 440], [80, 1900], [1000, 1900]], `rgba(255,230,180,${0.07 * lamp * fl})`); glow(g, 540, 440, 300, 'rgba(255,230,180,1)', 0.35 * lamp * fl); ell(g, 540, 1640, 460, 120, `rgba(255,220,170,${0.12 * lamp})`); g.restore();
  if (ring) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 900, 900, 'rgba(255,255,255,1)', 0.6 * ring); g.restore(); }
}
// 椅子にしばられたアカリ
export function tiedChair(g, x, y, s = 1, o = {}) {
  g.save();
  fillRR(g, x - 120 * s, y - 470 * s, 240 * s, 30 * s, 6 * s, '#3a3026'); line(g, x - 110 * s, y - 470 * s, x - 110 * s, y, 18 * s, '#3a3026'); line(g, x + 110 * s, y - 470 * s, x + 110 * s, y, 18 * s, '#3a3026'); fillRR(g, x - 130 * s, y - 280 * s, 260 * s, 30 * s, 6 * s, '#4a3e32');
  figure(g, P.akari, { x, y: y + 10 * s, s: s * 0.95, arms: [24, 30, 24, 30], eyes: 'narrow', brow: -0.6, mouth: 'line', ...o });
  for (let i = 0; i < 3; i++) line(g, x - 90 * s, y - (420 - i * 40) * s, x + 90 * s, y - (410 - i * 40) * s, 7 * s, '#c8b48a');
  g.restore();
}
// あの夜の路地（回想）：言い争う2つの影
export function alleyFlash(g, { t = 0, k = 0 } = {}) {
  nightSky(g); glow(g, 200, 200, 400, 'rgba(255,220,160,1)', 0.35);
  fillRR(g, -60, 200, 420, 1500, 4, '#151a26'); fillRR(g, 720, 200, 420, 1500, 4, '#151a26'); vgrad(g, 360, 200, 360, 1500, [[0, '#07080c'], [1, '#0e1016']]);
  vgrad(g, -300, 1500, W + 600, 700, [[0, '#24262e'], [1, '#14151a']]);
  const dark = c => mix(c, '#0c0d12', 0.55);
  figure(g, { ...P.takumi, top: dark('#b8b2a6'), top2: dark('#a49e92'), bottom: '#0c0d10' }, { x: 640 + k * 20, y: 1620, s: 1.1, turn: -0.5, look: -1, arms: [20, -30, 60, -90], eyes: 'wide', mouth: 'open', shadow: false });
  figure(g, { ...P.onizuka, top: dark(P.onizuka.top), top2: dark(P.onizuka.top2), bottom: '#0c0d10' }, { x: 440, y: 1640, s: 1.2, turn: 0.5, look: 1, arms: [20, -20, 100, -90 + k * 40], eyes: 'narrow', brow: 0.7, mouth: 'grit', shadow: false });
  g.save(); g.globalCompositeOperation = 'lighter'; line(g, 560, 1140 - k * 40, 610, 1090 - k * 40, 8, 'rgba(230,240,255,.9)'); glow(g, 585, 1115 - k * 40, 60, 'rgba(220,235,255,1)', 0.5); g.restore();
  grain(g, W, H, 0.08, 9, 1500);
}
// 自白文の紙
export function confessPaper(g, { t = 0, k = 1 } = {}) {
  g.save(); g.translate(540, 880); g.rotate(-0.04 + noise1(t * 20, 4) * 0.006);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; fillRR(g, -360, -480, 720, 960, 6, '#f2efe6'); g.shadowColor = 'transparent';
  const L = ['私、瀬戸アカリは', '10月26日の夜', '駅前の路地で', '男性を刺しました。', '', '私がやりました。'];
  L.forEach((s, i) => { const a = clamp((t * 2.4 - i) * k); text(g, s, -290, -360 + i * 110, { size: 56, color: i === 5 ? '#b0201a' : '#1a1a1e', align: 'left', alpha: a, font: SERIF, weight: 700 }); });
  g.restore();
}
// 床に落ちて割れたスマホ（配信が切れた）
export function droppedPhone(g, { t = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1a1e'], [1, '#0c0c0e']]); toneRect(g, -300, -300, W + 600, H + 600, 'rgba(255,255,255,.04)', 8, 2);
  g.save(); g.translate(540, 960); g.rotate(0.35);
  fillRR(g, -230, -440, 460, 880, 50, '#0b0c10'); fillRR(g, -210, -420, 420, 840, 36, '#000'); text(g, '配信が終了しました', 0, -10, { size: 36, color: '#c9ccd6' });
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-60, -200); g.lineTo(-140, -360); g.moveTo(-60, -200); g.lineTo(120, -300); g.moveTo(-60, -200); g.lineTo(40, 100); g.lineTo(-100, 300); g.moveTo(-60, -200); g.lineTo(-200, -80); g.stroke();
  g.restore();
}
// 赤と青の回転灯が入ってくる倉庫の入口
export function sirenDoor(g, { t = 0, k = 1, makabe = 1 } = {}) {
  warehouse(g, { t, lamp: 0.5 });
  fillRR(g, 300, 600, 480, 820, 4, '#0c0e14');
  const r = 0.5 + 0.5 * Math.sin(t * 7), b = 0.5 + 0.5 * Math.sin(t * 7 + Math.PI);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 420, 900, 520, 'rgba(255,40,40,1)', 0.5 * r * k); glow(g, 680, 900, 520, 'rgba(60,110,255,1)', 0.5 * b * k); g.restore();
  if (makabe) figure(g, { ...P.makabe, top: '#1a1e26', top2: '#14181e' }, { x: 540, y: 1400, s: 1.25 * lerp(0.85, 1, ease(k)), turn: 0, look: 0, arms: [10, 0, 10, 0], eyes: 'narrow', brow: 0.2, mouth: 'line' });
}
// 親指が拡散ボタンの上で止まる
export function thumbOver(g, { t = 0, near = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0d1117'], [1, '#151b25']]);
  fillRR(g, 40, 620, 1000, 260, 30, K.card);
  const items = [['返信', '2,140', K.sub], ['拡散', '3.1万', K.orange], ['いいね', '5.2万', K.sub]];
  items.forEach(([l, n, c], i) => { const x = 110 + i * 330; if (i === 1) { fillRR(g, x - 40, 670, 300, 160, 80, rgba(K.orange, 0.15 + 0.1 * near)); g.lineWidth = 4; g.strokeStyle = K.orange; rr(g, x - 40, 670, 300, 160, 80); g.stroke(); } text(g, l, x + 40, 750, { size: 52, color: c, align: 'left' }); text(g, n, x + 40, 810, { size: 34, color: c, align: 'left', weight: 600 }); });
  // 親指
  const tr = noise1(t * 9, 3) * 6, y = lerp(1350, 980, ease(clamp(near))) + tr;
  g.save(); g.translate(560 + tr * 0.5, y); g.rotate(-0.12);
  fillRR(g, -110, 0, 220, 900, 100, C.skin); ell(g, 0, 60, 70, 60, '#f2d8cc'); toneRect(g, 40, 0, 80, 900, 'rgba(0,0,0,.2)', 8, 2);
  g.restore();
}
