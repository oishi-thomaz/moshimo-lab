// 「ホワイト案件」第3〜5話の場面：金庫・札束・ポケットの電話・玄関のドア・鍵・合図・妹の部屋・録音・屋根・夜道・公園・介護施設・駐車場とパトカー・別の誰かの部屋
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text } from './core.js';
import { C, toneRect, toneFill, CAST2, figure, head, close, crowIcon, sfxText } from './noir.js';
import { nightSky, house } from './noirsets.js';

// ---------- 小物 ----------
// 札束（帯つき）。x,y=中心、s=大きさ
export function bills(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  for (let i = 3; i >= 0; i--) fillRR(g, -120 + i * 2, -52 - i * 6, 240, 104, 6, i ? '#b9bfa4' : '#d6dcc0');
  line(g, -100, -30, 100, -30, 2, 'rgba(60,70,50,.35)'); line(g, -100, 20, 100, 20, 2, 'rgba(60,70,50,.35)');
  circ(g, -60, -4, 26, 'rgba(90,100,80,.35)');
  fillRR(g, -18, -58, 36, 116, 3, '#f1ece0'); line(g, -18, -58, -18, 58, 2, 'rgba(0,0,0,.15)');
  g.restore();
}
// スマホ（カラスのアプリ・メッセージ1件）。x,y=中心、s=大きさ
export function crowPhone(g, x, y, s = 1, { rot = 0, from = 'ユウマ', msg = '', shown = 1, glowA = 0.15 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  fillRR(g, -230, -440, 460, 880, 50, '#0d0e12'); fillRR(g, -210, -420, 420, 840, 38, '#141927');
  glow(g, 0, 0, 500, 'rgba(120,150,255,1)', glowA);
  crowIcon(g, 0, -260, 60); text(g, 'カラス', 0, -170, { size: 40, color: '#e9edf5', weight: 800 });
  if (msg) {
    g.save(); g.globalAlpha *= shown; fillRR(g, -190, -100, 380, 260, 26, '#1c1f2b'); g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.9); rr(g, -190, -100, 380, 260, 26); g.stroke();
    text(g, from, -160, -60, { size: 30, color: '#9aa5bb', align: 'left', weight: 800 });
    msg.split('\n').forEach((s2, i) => text(g, s2, -160, -10 + i * 50, { size: 36, color: '#fff', align: 'left', weight: 800 }));
    g.restore();
  }
  g.restore();
}

// ---------- 第3話 ----------
// 金庫のダイヤルのアップ（turn=回った量）
export function safeDial(g, { t = 0, turn = 0, open = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2e36'], [1, '#14161c']]);
  fillRR(g, 60, 260, 960, 1200, 30, '#3a3e48'); fillRR(g, 100, 300, 880, 1120, 20, '#4a4f5a');
  toneRect(g, 100, 300, 880, 1120, 'rgba(0,0,0,.18)', 10, 2.4);
  g.save(); g.translate(540, 760); circ(g, 0, 0, 280, '#2a2e36'); circ(g, 0, 0, 230, '#5a606a');
  g.rotate(turn * Math.PI * 2);
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, L = i % 5 ? 20 : 40; line(g, Math.cos(a) * (220 - L), Math.sin(a) * (220 - L), Math.cos(a) * 220, Math.sin(a) * 220, i % 5 ? 4 : 7, '#d9dde2'); }
  circ(g, 0, 0, 120, '#3a3e48'); line(g, 0, -110, 0, 110, 40, '#2a2e36'); g.restore();
  poly(g, [[540, 450], [520, 410], [560, 410]], C.red);
  // ハンドル
  fillRR(g, 780, 700, 120, 120, 20, '#9aa0aa'); line(g, 840, 760, 840 + Math.cos(-open * 1.4) * 120, 760 + Math.sin(-open * 1.4) * 120, 30, '#c9ced4');
  // 指（坂口の手）
  g.save(); g.translate(540 + Math.cos(turn * 6.28 - 0.6) * 140, 760 + Math.sin(turn * 6.28 - 0.6) * 140); ell(g, 0, 0, 70, 46, C.skin, turn * 6.28); ell(g, 60, 30, 60, 90, '#b9a88c', turn * 6.28); g.restore();
}
// 開いた金庫と札束（open=扉の開き）
export function safeOpen(g, { t = 0, open = 1, glowA = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1416'], [1, '#0c0a0b']]);
  fillRR(g, 140, 300, 800, 860, 24, '#3a3e48');
  fillRR(g, 190, 350, 700, 760, 10, '#0a0b0e');
  // 中の札束
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) bills(g, 365 + c * 350, 470 + r * 170, 1.2, (rng(r * 3 + c)() - 0.5) * 0.04);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 700, 600, 'rgba(255,220,150,1)', 0.18 * glowA); g.restore();
  // 扉
  const w = 700 * (1 - open * 0.88);
  fillRR(g, 190, 350, w, 760, 10, '#4a4f5a'); if (w > 120) { circ(g, 190 + w / 2, 730, Math.min(120, w * 0.25), '#2a2e36'); }
  line(g, 190 + w, 350, 190 + w, 1110, 8, '#2a2e36');
}
// 素手で札束を握らされる（手のアップ）。k<1 のあいだ坂口の手が上から押しつける
export function handsMoney(g, { t = 0, k = 1, shake2 = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1416'], [1, '#0c0a0b']]);
  glow(g, 540, 300, 700, 'rgba(255,200,140,1)', 0.18);
  const sx = noise1(t * 20, 1) * shake2, sy = noise1(t * 20, 2) * shake2;
  g.save(); g.translate(sx, sy);
  // 袖（ユウマのパーカー）が下から
  for (const sd of [-1, 1]) { g.save(); g.translate(540 + sd * 300, 960); g.rotate(sd * -0.35); fillRR(g, -120, 0, 240, 1100, 100, CAST2.yuuma.top2); g.restore(); }
  bills(g, 540, 860, 2.1, -0.05);
  // 手：手のひらは札束の横、指は札束の上にかかる
  for (const sd of [-1, 1]) {
    g.save(); g.translate(540 + sd * 250, 900); g.scale(sd, 1);
    ell(g, 30, 40, 95, 120, C.skin, -0.2); // 手のひら
    ell(g, -40, 90, 34, 70, C.skinS, 0.7); // 親指
    for (let i = 0; i < 4; i++) { g.save(); g.translate(-10 - i * 4, -40 + i * 46); g.rotate(-0.15); fillRR(g, -120, -20, 130, 40, 20, C.skin); line(g, -100, -6, -60, -6, 3, 'rgba(120,80,70,.35)'); g.restore(); }
    g.restore();
  }
  g.restore();
  // 坂口の手（右上から手首をつかむ）
  if (k < 1) {
    g.save(); g.globalAlpha = 1 - k; g.translate(lerp(820, 1000, k), lerp(760, 560, k)); g.rotate(-0.7);
    fillRR(g, -90, -620, 180, 600, 70, CAST2.sakaguchi.top2); ell(g, 0, -10, 105, 85, C.skin);
    for (let i = 0; i < 4; i++) fillRR(g, -80 + i * 42, 40, 36, 110, 18, C.skin);
    g.restore();
  }
}
// ポケットの中でこっそり電話（パーカーのポケット＋紙＋発信中の画面）
export function pocketCall(g, { t = 0, k = 0, calling = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2e333f'], [1, '#1a1d26']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.25)', 10, 2.6);
  // ポケットの口
  g.save(); g.beginPath(); g.moveTo(80, 520); g.quadraticCurveTo(540, 440, 1000, 520); g.lineTo(1000, 1500); g.lineTo(80, 1500); g.closePath(); g.fillStyle = '#16181f'; g.fill(); g.restore();
  line(g, 80, 520, 1000, 520, 10, '#4a505e');
  // 紙（ジンの番号）
  g.save(); g.translate(lerp(380, 360, k), lerp(760, 700, k)); g.rotate(-0.18); fillRR(g, -200, -70, 400, 140, 8, '#f1ece0'); text(g, '090-XXXX-XXXX', 0, 2, { size: 44, color: '#2a2530', weight: 800 }); g.restore();
  // スマホ（発信中）
  g.save(); g.translate(660, 960); g.rotate(0.08);
  fillRR(g, -170, -320, 340, 640, 40, '#0d0e12'); fillRR(g, -155, -305, 310, 610, 30, calling ? '#123a24' : '#050608');
  if (calling) {
    glow(g, 0, 0, 380, 'rgba(90,220,140,1)', 0.18);
    text(g, '発信中…', 0, -180, { size: 40, color: '#e9f5ee', weight: 800 }); text(g, '090-XXXX-XXXX', 0, -110, { size: 30, color: '#bfe3cc', weight: 800 });
    const p = (t * 1.2) % 1; g.save(); g.globalAlpha = 1 - p; g.lineWidth = 6; g.strokeStyle = '#7ce0a0'; g.beginPath(); g.arc(0, 60, 60 + p * 90, 0, 7); g.stroke(); g.restore();
    circ(g, 0, 60, 56, '#e3263b'); fillRR(g, -28, 52, 56, 16, 8, '#fff');
  }
  g.restore();
  // 指
  ell(g, lerp(560, 600, k), 1200, 70, 120, C.skin, 0.4);
}
// 玄関（中から見たドア）。open=開き具合、P=立っている人
export function doorInside(g, { t = 0, open = 0, P = null, o = {}, porch = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0e0d12'], [1, '#07070a']]);
  // 壁
  fillRR(g, 120, 200, 840, 1300, 6, '#1c1a22'); toneRect(g, 120, 200, 840, 1300, 'rgba(0,0,0,.25)', 10, 2.4);
  // ドア枠と外の暗がり
  fillRR(g, 300, 330, 480, 1100, 4, '#0a0c14');
  if (open > 0) {
    g.save(); rr(g, 300, 330, 480, 1100, 4); g.clip();
    nightSky(g, { y0: 330, h: 1100 });
    glow(g, 540, 380, 420, 'rgba(255,214,150,1)', 0.45 * porch);
    if (P) figure(g, P, { x: 540, y: 1430, s: 1.35, lightFrom: 'left', ...o });
    g.restore();
  }
  // ドア本体（手前に開く）
  const dw = 480 * (1 - open);
  fillRR(g, 300, 330, Math.max(8, dw), 1100, 4, '#3a2c28'); if (dw > 60) circ(g, 300 + dw - 40, 900, 14, '#b9a27a');
  // たたきと革靴
  vgrad(g, -300, 1430, W + 600, 600, [[0, '#2c2a33'], [1, '#141318']]);
  line(g, -300, 1430, W + 300, 1430, 10, '#2a2730', 'butt');
}
// サムターン（鍵）を回す手のアップ（k=回り具合）。刺青＝ジンの手
export function lockTurn(g, { t = 0, k = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a2c28'], [1, '#241a17']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.2)', 10, 2.4);
  fillRR(g, 360, 420, 360, 760, 40, '#8a8e96'); fillRR(g, 390, 450, 300, 700, 30, '#a9aeb6');
  const a = lerp(0, Math.PI / 2, ease(k));
  g.save(); g.translate(540, 800); circ(g, 0, 0, 110, '#6a6e76'); g.rotate(a); fillRR(g, -26, -130, 52, 260, 20, '#c9ced4'); g.restore();
  // 袖（左下から）と手
  g.save(); g.translate(540, 800); g.rotate(a * 0.7);
  g.save(); g.rotate(0.6); fillRR(g, -120, 120, 240, 900, 90, CAST2.jin.top2); g.restore();
  ell(g, -40, 150, 120, 95, C.skin, 0.5);                // 手の甲
  line(g, -90, 160, -10, 210, 7, '#2a2a3a'); line(g, -70, 120, 10, 160, 7, '#2a2a3a'); // 刺青
  fillRR(g, -60, -40, 60, 150, 30, C.skin);               // 親指（つまみの左）
  fillRR(g, 20, -10, 60, 140, 30, C.skin);                // 人差し指（つまみの右）
  g.restore();
  if (k > 0.95) sfxText(g, 'カチャ', 820, 380, { size: 110, color: '#f4f1ea', rot: 0.1 });
}

// ---------- 第4話 ----------
// テーブルを叩く拳（n=何回目まで叩いたか、hit=今の叩き 0..1）
export function tableKnock(g, { t = 0, hit = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a201a'], [1, '#140f0c']]);
  fillRR(g, -100, 1000, 1280, 600, 10, '#6a4a32'); toneRect(g, -100, 1000, 1280, 600, 'rgba(0,0,0,.25)', 10, 2.4);
  for (let i = 0; i < 4; i++) line(g, -100, 1080 + i * 120, 1180, 1060 + i * 120, 3, 'rgba(0,0,0,.2)');
  const y = lerp(720, 960, hit);
  g.save(); g.translate(540, y);
  fillRR(g, -90, -700, 180, 640, 70, CAST2.jin.top2); ell(g, 0, -10, 130, 100, C.skin); for (let i = 0; i < 4; i++) ell(g, -75 + i * 50, 50, 30, 40, C.skinS);
  line(g, -60, -120, 40, -80, 6, '#2a2a3a'); line(g, -50, -160, 50, -130, 6, '#2a2a3a');
  g.restore();
  if (hit > 0.92) { g.save(); g.globalAlpha = 0.7; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI; line(g, 540 + Math.cos(a) * 170, 1050 - Math.sin(a) * 90, 540 + Math.cos(a) * 260, 1050 - Math.sin(a) * 140, 6, '#f4f1ea'); } g.restore(); }
}
// 妹の部屋（暗い部屋・ベッドの上でスマホを握るミク）
export function mikuRoom(g, { t = 0, door = 1, phone = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#141826'], [1, '#0a0c14']]);
  // 窓とカーテン
  fillRR(g, 620, 260, 360, 520, 6, '#0b1020'); fillRR(g, 600, 240, 110, 560, 10, '#3a4468'); fillRR(g, 890, 240, 110, 560, 10, '#3a4468');
  glow(g, 800, 500, 300, 'rgba(160,190,255,1)', 0.12);
  // ベッド
  vgrad(g, -300, 1300, W + 600, 700, [[0, '#1e2232'], [1, '#0e1018']]);
  fillRR(g, 80, 1120, 920, 260, 30, '#2e3b63'); fillRR(g, 120, 1080, 260, 90, 36, '#d9d4c8');
  // ミク（座って、スマホの光で下から照らされる）
  figure(g, CAST2.miku, { x: 560, y: 1460, s: 1.15, arms: [30, -110, 30, -110], phone: phone > 0, eyes: 'wide', brow: -0.6, mouth: 'line', look: -0.2, lightFrom: 'right' });
  // 入口のドア枠（手前）
  if (door) { g.fillStyle = 'rgba(0,0,0,.85)'; g.fillRect(-300, -300, 200, H + 600); g.fillRect(980, -300, 400, H + 600); fillRR(g, -100, -300, 30, H + 600, 2, '#2a1f1a'); }
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.12)', 9, 2);
}
// 録音アプリの画面（rec=録音中、play=再生中、sec=表示時間）
export function recPhone(g, x, y, s = 1, { t = 0, rec = 1, play = 0, sec = 0, rot = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  fillRR(g, -230, -440, 460, 880, 50, '#0d0e12'); fillRR(g, -210, -420, 420, 840, 38, '#0b0c10');
  text(g, 'ボイスメモ', 0, -350, { size: 34, color: '#9aa5bb', weight: 800 });
  const ss2 = Math.floor(sec), str = `${String(Math.floor(ss2 / 3600)).padStart(2, '0')}:${String(Math.floor(ss2 / 60) % 60).padStart(2, '0')}:${String(ss2 % 60).padStart(2, '0')}`;
  text(g, str, 0, -240, { size: 72, color: '#f1f3f8', weight: 800 });
  // 波形
  for (let i = 0; i < 34; i++) { const a = Math.abs(noise1(i * 0.7 + t * (rec || play ? 6 : 0), 3)) * 120 + 8; fillRR(g, -190 + i * 11.4, -20 - a / 2, 6, a, 3, play ? '#4a8ef0' : C.red); }
  // ボタン
  if (play) { circ(g, 0, 250, 70, '#2a2e3a'); poly(g, [[-18, 220], [-18, 280], [32, 250]], '#f1f3f8'); }
  else { circ(g, 0, 250, 74, '#f1f3f8'); const p = 0.5 + 0.5 * Math.sin(t * 5); circ(g, 0, 250, 56, rgba(C.red, 0.7 + 0.3 * p)); }
  if (rec && !play) { const p = 0.5 + 0.5 * Math.sin(t * 5); circ(g, -70, -150, 14, rgba(C.red, p)); text(g, '録音中', -45, -150, { size: 34, color: C.red, align: 'left', weight: 800 }); }
  if (play) text(g, '再生中', 0, -150, { size: 34, color: '#4a8ef0', weight: 800 });
  g.restore();
}
// 窓から1階の屋根に降りる2人（家の正面・2階の窓が開いて明かり）
export function roofEscape(g, { t = 0, k = 0 } = {}) {
  nightSky(g);
  vgrad(g, -400, 1500, W + 800, 600, [[0, '#14182a'], [1, '#07080e']]);
  house(g, { cx: 540, base: 1500, s: 1.15, lit2: 1, lit1: 0 });
  // 2階の窓（右）から出て、1階の屋根（ひさしの高さ）を走る
  const x = lerp(700, 300, ease(k)), y = 1500 - 330 * 1.15 + 6;
  figure(g, CAST2.yuuma, { x, y, s: 0.48, walk: t * 1.6, turn: -0.5, arms: [40, -20, 60, -30], shadow: false });
  figure(g, CAST2.miku, { x: x + 90, y, s: 0.44, walk: t * 1.6 + 0.3, turn: -0.5, arms: [60, -30, 30, -10], shadow: false });
  line(g, -400, y + 4, W + 400, y + 4, 8, '#151a2a', 'butt');
}
// 夜道を走る2人（街灯が流れる）＋後ろの車のライト
export function runStreet(g, { t = 0, lights = 0 } = {}) {
  nightSky(g);
  for (let i = 0; i < 7; i++) { const R = rng(i * 5 + 1); const x = ((i * 260 - t * 220) % 1820 + 1820) % 1820 - 400, hh = 380 + R() * 220; fillRR(g, x, 1300 - hh, 230, hh + 200, 3, '#0d1220'); if (R() < 0.5) fillRR(g, x + 70, 1300 - hh + 60, 60, 44, 2, rgba('#ffd28a', 0.4)); }
  vgrad(g, -400, 1300, W + 800, 700, [[0, '#14182a'], [1, '#07080e']]);
  for (let i = 0; i < 3; i++) { const x = ((i * 600 - t * 420) % 1800 + 1800) % 1800 - 300; fillRR(g, x, 300, 22, 1020, 4, '#0a0d16'); glow(g, x + 10, 330, 300, 'rgba(200,215,255,1)', 0.16); }
  if (lights > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 1100, 1260, 700, 'rgba(255,250,220,1)', 0.55 * lights); glow(g, 1100, 1260, 220, 'rgba(255,255,255,1)', 0.8 * lights); g.restore(); }
  figure(g, CAST2.yuuma, { x: 470, y: 1640, s: 1.05, walk: t * 1.8, turn: -0.6, look: -1, arms: [60, -40, 30, 20], brow: -0.6, mouth: 'open' });
  figure(g, CAST2.miku, { x: 640, y: 1660, s: 0.95, walk: t * 1.8 + 0.4, turn: -0.6, look: -1, arms: [-20, 0, 60, -40], brow: -0.6, mouth: 'open', shoes: '#e8d3c0' });
}
// 公園の遊具の陰（ドーム型の遊具・2人が隠れる）
export function park(g, { t = 0, sweep = 0 } = {}) {
  nightSky(g, { warm: 0.05 });
  vgrad(g, -400, 1250, W + 800, 800, [[0, '#121624'], [1, '#07080e']]);
  // 遠くの街灯
  fillRR(g, 900, 380, 18, 880, 4, '#0a0d16'); glow(g, 910, 400, 320, 'rgba(200,215,255,1)', 0.18);
  // ライトがなめる
  if (sweep > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * sweep; const x = lerp(-300, 1400, (t * 0.5) % 1); const gr = g.createRadialGradient(x, 1100, 10, x, 1100, 500); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-300, 500, W + 600, 1200); g.restore(); }
  // 2人（ドームの陰でしゃがむ）
  figure(g, CAST2.yuuma, { x: 470, y: 1500, s: 0.95, turn: 0.5, look: 1, arms: [70, -120, 60, -110], brow: -0.7, eyes: 'wide', phone: true });
  figure(g, CAST2.miku, { x: 640, y: 1510, s: 0.85, turn: 0.5, look: 1, arms: [80, -120, 20, -40], brow: -0.7, eyes: 'wide' });
  // ドーム型の遊具（手前）
  g.save(); g.beginPath(); g.ellipse(540, 1560, 560, 420, 0, Math.PI, 0); g.closePath(); g.fillStyle = '#2a3048'; g.fill(); g.clip();
  toneRect(g, -100, 1100, 1300, 500, 'rgba(0,0,0,.35)', 10, 2.6);
  for (let i = 0; i < 6; i++) circ(g, 140 + i * 160, 1380 + (i % 2) * 70, 36, '#1a1f30');
  g.restore();
  ell(g, 540, 1560, 600, 40, '#0b0d16');
}
// 介護施設の入口（夜明け前）
export function careFront(g, { t = 0, dawn = 0.3 } = {}) {
  vgrad(g, -300, -300, W + 600, 1700, [[0, mix('#0b0f1e', '#2a3352', dawn)], [0.7, mix('#141a30', '#6a5a70', dawn)], [1, mix('#1a2036', '#b07a68', dawn)]]);
  fillRR(g, -60, 420, 1200, 1080, 6, '#c9c2b4'); toneRect(g, -60, 420, 1200, 1080, 'rgba(0,0,0,.4)', 10, 2.6);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) fillRR(g, 20 + c * 220, 500 + r * 220, 140, 130, 4, (r + c) % 3 ? '#3a4458' : rgba('#ffe0a8', 0.75));
  // 看板
  fillRR(g, 300, 930, 480, 70, 8, '#5d8f6a'); text(g, '介護施設 ひだまり', 540, 966, { size: 40, color: '#fff', weight: 800 });
  // 自動ドア（明かり）
  fillRR(g, 360, 1040, 360, 460, 6, '#e9f0f5'); line(g, 540, 1040, 540, 1500, 6, '#9aa5b0', 'butt');
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 1260, 500, 'rgba(230,240,255,1)', 0.35); g.restore();
  vgrad(g, -300, 1500, W + 600, 600, [[0, '#3a3a44'], [1, '#14141a']]);
}
// パーカーのポケットからはみ出す札束（アップ）
export function pocketMoney(g, { t = 0, k = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2e333f'], [1, '#1a1d26']]);
  fillRR(g, -100, 200, 1280, 1600, 60, CAST2.yuuma.top); toneRect(g, -100, 200, 1280, 1600, 'rgba(0,0,0,.3)', 10, 2.6);
  line(g, 520, 200, 520, 600, 8, '#d9d9d9'); line(g, 600, 200, 600, 640, 8, '#d9d9d9');
  // ポケット
  g.save(); g.beginPath(); g.moveTo(140, 900); g.quadraticCurveTo(540, 820, 940, 900); g.lineTo(980, 1400); g.lineTo(100, 1400); g.closePath(); g.fillStyle = CAST2.yuuma.top2; g.fill(); g.restore();
  bills(g, lerp(560, 600, k), lerp(980, 900, k), 1.6, -0.35);
  g.save(); g.beginPath(); g.moveTo(100, 980); g.quadraticCurveTo(540, 900, 980, 980); g.lineTo(980, 1400); g.lineTo(100, 1400); g.closePath(); g.fillStyle = CAST2.yuuma.top2; g.fill(); g.restore();
  line(g, 100, 980, 980, 980, 8, '#4a505e');
  glow(g, 580, 900, 260, 'rgba(255,240,200,1)', 0.12);
}

// ---------- 第5話 ----------
// 駐車場（夜明け）。siren=赤色灯の強さ、car=坂口の車のライト
export function parkingLot(g, { t = 0, siren = 0, car = 0, dawn = 0.45, patrol = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, 1500, [[0, mix('#0b0f1e', '#3a4062', dawn)], [0.8, mix('#141a30', '#9a7a78', dawn)], [1, mix('#1a2036', '#d09a78', dawn)]]);
  fillRR(g, -60, 700, 1200, 520, 6, '#8a8478'); toneRect(g, -60, 700, 1200, 520, 'rgba(0,0,0,.5)', 10, 2.6);
  vgrad(g, -300, 1200, W + 600, 900, [[0, '#3a3a44'], [1, '#141418']]);
  for (let i = 0; i < 5; i++) line(g, 60 + i * 250, 1260, 0 + i * 280, 1900, 8, 'rgba(240,240,240,.35)', 'butt');
  // 坂口の車
  g.save(); g.translate(540, 1500);
  fillRR(g, -380, -260, 760, 240, 50, '#22252e'); fillRR(g, -260, -400, 520, 180, 50, '#1a1c24'); fillRR(g, -230, -380, 460, 130, 30, '#0b0c10');
  circ(g, -230, -20, 70, '#08090c'); circ(g, 230, -20, 70, '#08090c');
  if (car > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, -300, -150, 260, 'rgba(255,250,220,1)', 0.7 * car); glow(g, 300, -150, 260, 'rgba(255,250,220,1)', 0.7 * car); g.restore(); }
  g.restore();
  // パトカー（左右から）
  if (patrol > 0) for (const sd of [-1, 1]) { g.save(); g.translate(540 + sd * lerp(1100, 640, ease(patrol)), 1700); g.scale(sd, 1); fillRR(g, -300, -220, 600, 200, 40, '#f1f1f1'); fillRR(g, -300, -120, 600, 100, 30, '#14161c'); fillRR(g, -120, -300, 240, 100, 30, '#1a1c24'); fillRR(g, -80, -330, 160, 34, 10, C.red); circ(g, -200, -20, 56, '#08090c'); circ(g, 200, -20, 56, '#08090c'); g.restore(); }
  if (siren > 0) { const rot = Math.sin(t * 9) * 0.5 + 0.5; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 120, 1300, 900, 'rgba(255,30,50,1)', 0.45 * siren * rot); glow(g, 960, 1300, 900, 'rgba(255,30,50,1)', 0.45 * siren * (1 - rot)); g.restore(); }
}
// 自分の手を見る（両手のアップ・夜明けの光）
export function openHands(g, { t = 0, dawn = 0.6 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#141a30', '#b07a68', dawn)], [1, '#1a1416']]);
  glow(g, 540, 200, 900, 'rgba(255,200,150,1)', 0.25 * dawn);
  fillRR(g, -120, 1100, 560, 500, 160, CAST2.yuuma.top2); fillRR(g, 640, 1100, 560, 500, 160, CAST2.yuuma.top2);
  for (const sd of [-1, 1]) {
    g.save(); g.translate(540 + sd * 230, 860); g.scale(sd, 1); g.rotate(-0.25);
    ell(g, 0, 0, 170, 200, C.skin); for (let i = 0; i < 4; i++) ell(g, -110 + i * 70, -230 + Math.abs(i - 1.5) * 20, 34, 90, C.skin);
    ell(g, 170, -40, 40, 100, C.skin, 0.8);
    line(g, -90, 30, 60, -40, 4, 'rgba(120,80,70,.4)'); line(g, -80, 90, 80, 40, 4, 'rgba(120,80,70,.4)');
    g.restore();
  }
}
// 夜が明ける（パトカーへ歩く家族を後ろから＝シルエット）
export function dawnWalk(g, { t = 0, k = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, 1500, [[0, '#2a3352'], [0.6, '#b07a68'], [1, '#f0b880']]);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 1180, 700, 'rgba(255,210,150,1)', 0.6); g.restore();
  vgrad(g, -300, 1200, W + 600, 900, [[0, '#4a3a3a'], [1, '#1a1416']]);
  const sil = (x, y, s, w = 1) => { g.save(); g.translate(x, y); g.scale(s, s); fillRR(g, -60 * w, -330, 120 * w, 230, 50, '#120d0e'); fillRR(g, -45, -110, 36, 120, 10, '#120d0e'); fillRR(g, 9, -110, 36, 120, 10, '#120d0e'); circ(g, 0, -380, 48, '#120d0e'); g.restore(); };
  const y = lerp(1700, 1560, k), s = lerp(1.3, 1.0, k);
  sil(400, y, s * 0.95); sil(560, y + 10, s, 1.05); sil(700, y + 20, s * 0.85);
  // 母と息子は手をつなぐ
  line(g, 440, y - 230 * s, 520, y - 230 * s, 16 * s, '#120d0e');
}
// 別の誰かの部屋（ベッドで光るスマホの通知）
export function otherRoom(g, { t = 0, on = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0a0c16'], [1, '#05060a']]);
  fillRR(g, 680, 220, 320, 460, 6, '#0b1020'); for (let i = 0; i < 10; i++) { const R = rng(i + 31); fillRR(g, 700 + R() * 280, 460 + R() * 200, 10, 14, 1, rgba('#ffd28a', 0.5)); }
  vgrad(g, -300, 1150, W + 600, 900, [[0, '#1a1e2c'], [1, '#0c0e16']]);
  fillRR(g, -100, 1100, 1280, 500, 40, '#2a2e3e'); fillRR(g, 40, 1060, 320, 100, 40, '#cfcac0');
  if (on) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 1260, 420, 'rgba(150,180,255,1)', 0.35); g.restore(); }
  g.save(); g.translate(540, 1250); g.rotate(-0.12); fillRR(g, -90, -40, 180, 80, 14, '#0d0e12'); fillRR(g, -82, -32, 164, 64, 10, on ? '#2a3f78' : '#050608'); g.restore();
}
// ロック画面の通知（notifs=[{t,app,title,body,crow}]）
export function lockScreen(g, { t = 0, notifs = [], clock = '3:12' } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a2448'], [1, '#0a0e1e']]);
  glow(g, 540, 500, 700, 'rgba(120,150,255,1)', 0.15);
  text(g, '10月27日 火曜日', 540, 300, { size: 40, color: 'rgba(255,255,255,.8)', weight: 500 });
  text(g, clock, 540, 440, { size: 200, color: '#f1f3f8', weight: 500 });
  let y = 700;
  for (const n of notifs) {
    const a = easeOut(clamp((t - n.t) / 0.3)); if (a <= 0) continue;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * -40);
    fillRR(g, 70, y, 940, 200, 40, 'rgba(240,244,255,.16)');
    if (n.crow) crowIcon(g, 150, y + 70, 40); else { circ(g, 150, y + 70, 40, '#5d8f6a'); text(g, '求', 150, y + 72, { size: 40, color: '#fff' }); }
    text(g, n.app, 210, y + 56, { size: 30, color: 'rgba(255,255,255,.75)', align: 'left', weight: 500 });
    text(g, n.title, 210, y + 108, { size: 42, color: '#fff', align: 'left', weight: 800 });
    if (n.body) text(g, n.body, 210, y + 158, { size: 34, color: 'rgba(255,255,255,.85)', align: 'left', weight: 500 });
    g.restore(); y += 230;
  }
}
