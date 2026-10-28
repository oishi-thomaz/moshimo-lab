// 「二人の息子」の場面：夜の実家の茶の間、電話の画面（通話中＋保留）、インターホン、詐欺グループの部屋
// 手がかり：黒いテレビの画面に佐和子だけ映らない／お茶に湯気がない／カレンダーが2年前／仏間の襖がいつも閉まっている／棚の小さなスピーカーの光
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, FONT, SERIF } from './core.js';
import { C, toneRect, toneFill } from './noir.js';

export const F = { green: '#36d27f', green2: '#6fe6a4', amber: '#ffb35a', wall: '#3a3330', wall2: '#2a2422', tatami: '#5f5a3e', wood: '#4a3526', wood2: '#33241a' };

// 壁の時計（h:m）
export function wallClock(g, x, y, r, h = 2, m = 13) {
  circ(g, x, y, r + 10, F.wood2); circ(g, x, y, r, '#e9e2d2');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(g, x + Math.sin(a) * r * 0.82, y - Math.cos(a) * r * 0.82, x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92, r * 0.05, '#3a3330'); }
  const am = m / 60 * Math.PI * 2, ah = (h % 12 + m / 60) / 12 * Math.PI * 2;
  line(g, x, y, x + Math.sin(ah) * r * 0.5, y - Math.cos(ah) * r * 0.5, r * 0.08, '#1a1614');
  line(g, x, y, x + Math.sin(am) * r * 0.78, y - Math.cos(am) * r * 0.78, r * 0.05, '#1a1614');
  circ(g, x, y, r * 0.07, '#1a1614');
}
// 日めくりではなく月のカレンダー（年月だけ大きく）
export function calendar(g, x, y, { label = '2024年10月' } = {}) {
  fillRR(g, x, y, 170, 220, 6, '#e8e1d2'); fillRR(g, x, y, 170, 50, 6, '#b8483e');
  text(g, label, x + 85, y + 26, { size: 24, color: '#fff', weight: 800 });
  g.save(); g.globalAlpha = 0.55; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) fillRR(g, x + 14 + c * 21, y + 70 + r * 28, 14, 14, 2, '#7a7064'); g.restore();
}
// 小さなスマートスピーカー（光の輪）
export function smartSpeaker(g, x, y, s = 1, { on = 0.4, t = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  fillRR(g, -34, -70, 68, 70, 14, '#2a2b30'); toneRect(g, -34, -60, 68, 56, 'rgba(255,255,255,.08)', 6, 1.2);
  ell(g, 0, -70, 34, 8, '#3a3b42');
  const a = on * (0.75 + 0.25 * Math.sin(t * 3));
  g.save(); g.globalAlpha = a; ell(g, 0, -70, 30, 6, F.green); g.restore();
  glow(g, 0, -70, 90, 'rgba(54,210,127,1)', 0.35 * a);
  g.restore();
}
// 茶の間（夜）。ring＝ちゃぶ台のスマホが鳴る、phone＝ちゃぶ台にスマホを置くか
export function chanoma(g, { t = 0, ring = 0, phone = 1, lamp = 0.55, speaker = 0.45, clock = [2, 13], tvGlow = 0 } = {}) {
  // 壁と天井
  vgrad(g, -300, -300, W + 600, 1500, [[0, '#211c1a'], [1, F.wall]]);
  toneRect(g, -300, -300, W + 600, 1500, 'rgba(0,0,0,.22)', 9, 2.0);
  // 長押（なげし）
  fillRR(g, -300, 300, W + 600, 26, 0, F.wood2);
  // 右：仏間の襖（閉まったまま）
  fillRR(g, 700, 330, 420, 950, 0, '#cfc4ad'); for (let i = 0; i < 2; i++) { g.lineWidth = 6; g.strokeStyle = F.wood2; g.strokeRect(704 + i * 208, 334, 204, 942); }
  g.save(); g.globalAlpha = 0.25; toneRect(g, 700, 330, 420, 950, 'rgba(60,40,20,.6)', 10, 2.4); g.restore();
  circ(g, 896, 820, 10, F.wood2); circ(g, 928, 820, 10, F.wood2);
  // 左：テレビ台と黒いテレビ（佐和子は映らない）
  fillRR(g, 30, 960, 420, 120, 6, F.wood); fillRR(g, 30, 1080, 420, 30, 0, F.wood2);
  fillRR(g, 50, 640, 380, 330, 10, '#0a0b0e'); fillRR(g, 64, 654, 352, 302, 6, '#121419');
  g.save(); rr(g, 64, 654, 352, 302, 6); g.clip(); // 画面にうっすら部屋が映る（ランプ・襖）。人の姿はない
  g.globalAlpha = 0.18; fillRR(g, 300, 660, 140, 300, 0, '#cfc4ad'); circ(g, 120, 760, 40, '#ffd9a0'); g.globalAlpha = 1;
  if (tvGlow) { g.globalAlpha = tvGlow; vgrad(g, 64, 654, 352, 302, [[0, '#5a7aa8'], [1, '#2a3a5a']]); }
  g.restore();
  // 棚の上：スマートスピーカー、写真立て（伏せてある）
  fillRR(g, 470, 860, 200, 24, 4, F.wood); smartSpeaker(g, 520, 860, 0.9, { on: speaker, t });
  fillRR(g, 590, 812, 56, 48, 4, F.wood2);
  // 時計とカレンダー
  wallClock(g, 300, 470, 70, clock[0], clock[1]);
  calendar(g, 480, 420, { label: '2024年10月' });
  // 畳
  vgrad(g, -300, 1100, W + 600, 1200, [[0, '#4f4a33'], [1, '#2c2a1e']]);
  g.save(); g.globalAlpha = 0.5; for (let i = -2; i < 8; i++) line(g, -300 + i * 260, 1100, -500 + i * 340, 2300, 4, '#2a2818'); g.restore();
  // ちゃぶ台
  ell(g, 540, 1560, 430, 120, 'rgba(0,0,0,.35)');
  ell(g, 540, 1470, 420, 110, F.wood); ell(g, 540, 1460, 410, 100, '#5a4130');
  line(g, 300, 1520, 300, 1640, 30, F.wood2); line(g, 780, 1520, 780, 1640, 30, F.wood2);
  // 湯のみ（湯気なし）
  fillRR(g, 680, 1395, 60, 60, 12, '#7a8a7a'); ell(g, 710, 1397, 30, 8, '#5a6a5a'); ell(g, 710, 1398, 24, 5, '#8a7a3a');
  // スマホ（鳴る）
  if (phone) {
    const sh = ring ? noise1(t * 40, 2) * 6 * ring : 0;
    g.save(); g.translate(470 + sh, 1440); g.rotate(-0.25);
    fillRR(g, -70, -40, 140, 80, 12, '#0e0f14'); fillRR(g, -64, -34, 128, 68, 9, ring ? '#d9f7e6' : '#1a2030');
    if (ring) { text(g, 'ハルト', 0, -6, { size: 22, color: '#0a3a20', weight: 900 }); text(g, '着信', 0, 18, { size: 16, color: '#1a6a40', weight: 800 }); }
    g.restore();
    if (ring) glow(g, 470, 1430, 360, 'rgba(120,240,170,1)', 0.45 * ring * (0.7 + 0.3 * Math.sin(t * 10)));
  }
  // ランプのあたたかい光
  glow(g, 160, 800, 520, 'rgba(255,190,120,1)', 0.22 * lamp);
}

// 2本の電話：上に「通話中 ハルト」、下から「ハルト から着信」のバナー。phase 0..1 でバナーが降りる
export function twoCalls(p, w, h, { t = 0, phase = 1, sec = 47, holdTop = false } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  // 通話中（1本目）
  const y1 = 220;
  p.save(); p.globalAlpha = holdTop ? 0.55 : 1;
  circ(p, w / 2, y1 + 110, 105, '#2f4a3c'); text(p, 'ハ', w / 2, y1 + 114, { size: 96, color: '#d6f5e3', weight: 900 });
  text(p, 'ハルト', w / 2, y1 + 300, { size: 64, color: '#fff' });
  text(p, holdTop ? '保留中' : `通話中　0:${String(sec).padStart(2, '0')}`, w / 2, y1 + 370, { size: 34, color: holdTop ? F.amber : F.green2, weight: 700 });
  p.restore();
  // ボタン類
  const cmp = h < 1300, bY = h - (cmp ? 215 : 420), hY = h - (cmp ? 70 : 170), br = cmp ? 48 : 62;
  for (let i = 0; i < 3; i++) { circ(p, w / 2 + (i - 1) * 190, bY, br, i === 2 ? 'rgba(54,210,127,.35)' : 'rgba(255,255,255,.12)'); }
  text(p, 'ミュート', w / 2 - 190, bY + br + 18, { size: 24, color: '#9ab', weight: 600 }); text(p, '保留', w / 2, bY + br + 18, { size: 24, color: '#9ab', weight: 600 }); text(p, 'スピーカー', w / 2 + 190, bY + br + 18, { size: 24, color: F.green2, weight: 800 });
  circ(p, w / 2, hY, cmp ? 54 : 70, '#ff3b4a'); fillRR(p, w / 2 - 28, hY - 8, 56, 16, 8, '#fff');
  // 2本目の着信バナー
  const by = lerp(-260, 40, easeOut(phase));
  p.save(); p.shadowColor = 'rgba(0,0,0,.6)'; p.shadowBlur = 40;
  fillRR(p, 30, by, w - 60, 220, 36, 'rgba(236,244,240,.97)'); p.shadowColor = 'transparent';
  circ(p, 110, by + 80, 48, '#2f4a3c'); text(p, 'ハ', 110, by + 82, { size: 46, color: '#d6f5e3', weight: 900 });
  text(p, 'ハルト', 180, by + 62, { size: 42, color: '#0b120e', align: 'left' });
  text(p, '着信　080-●●●●-2431', 180, by + 108, { size: 26, color: '#4a5a52', align: 'left', weight: 600 });
  fillRR(p, 60, by + 150, (w - 150) / 2, 52, 26, '#e14b4b'); text(p, '拒否', 60 + (w - 150) / 4, by + 177, { size: 28, color: '#fff' });
  fillRR(p, 90 + (w - 150) / 2, by + 150, (w - 150) / 2, 52, 26, F.green); text(p, '保留して応答', 90 + (w - 150) * 0.75, by + 177, { size: 28, color: '#fff' });
  p.restore();
  // 鳴っているリング
  if (phase > 0.9) { const k = (t * 1.3) % 1; p.save(); p.globalAlpha = (1 - k) * 0.6; p.lineWidth = 5; p.strokeStyle = F.green; rr(p, 30 - k * 20, by - k * 20, w - 60 + k * 40, 220 + k * 40, 36); p.stroke(); p.restore(); }
}

// 詐欺グループの部屋：ノートPCに声の波形、スマホ2台
export function scamRoom(g, { t = 0, phones = 2, wave = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0b0d12'], [1, '#05060a']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(255,255,255,.035)', 9, 1.8);
  // 机
  fillRR(g, -100, 1240, W + 200, 60, 0, '#1a1c22'); fillRR(g, -100, 1300, W + 200, 700, 0, '#0e0f13');
  // ノートPC
  poly(g, [[250, 1240], [830, 1240], [880, 1290], [200, 1290]], '#2a2c33');
  fillRR(g, 270, 860, 540, 380, 16, '#1d1f25'); fillRR(g, 290, 880, 500, 340, 8, '#0a1410');
  text(g, 'VOICE CLONE', 540, 920, { size: 30, color: F.green2, weight: 800, spacing: 6 });
  text(g, 'ハルト_声サンプル 0:31', 540, 965, { size: 26, color: '#8fb8a0', weight: 600 });
  g.save(); g.lineWidth = 5; g.strokeStyle = F.green; g.beginPath();
  for (let i = 0; i <= 100; i++) { const x = 310 + i * 4.6, a = Math.sin(i * 0.5 + t * 8) * noise1(i * 0.3 + t * 2, 4) * 70 * wave; i ? g.lineTo(x, 1090 + a) : g.moveTo(x, 1090 + a); }
  g.stroke(); g.restore();
  glow(g, 540, 1050, 520, 'rgba(54,210,127,1)', 0.25);
  // スマホ2台（どちらも「ハルト」として発信中）
  for (let i = 0; i < phones; i++) {
    const x = i ? 900 : 180, y = 1200;
    g.save(); g.translate(x, y); g.rotate(i ? 0.18 : -0.18);
    fillRR(g, -70, -130, 140, 260, 18, '#0e0f14'); fillRR(g, -62, -122, 124, 244, 12, '#123022');
    text(g, '発信中', 0, -60, { size: 22, color: F.green2, weight: 800 });
    text(g, 'ハルト', 0, -20, { size: 26, color: '#fff', weight: 900 });
    text(g, `回線${i + 1}`, 0, 30, { size: 20, color: '#8fb8a0', weight: 700 });
    g.restore();
    glow(g, x, y, 200, 'rgba(120,240,170,1)', 0.25);
  }
}

// 玄関の外（インターホンのカメラ映像）：夜の門灯の下に立つ制服の人
export function doorCam(g, w, h, { t = 0, draw } = {}) {
  vgrad(g, 0, 0, w, h, [[0, '#1a2428'], [1, '#0c1214']]);
  glow(g, w * 0.5, h * 0.12, w * 0.7, 'rgba(255,240,200,1)', 0.35);
  fillRR(g, 0, h * 0.82, w, h * 0.2, 0, '#2a3034');
  if (draw) draw(g, w, h);
  // 魚眼っぽいふち
  const gr = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  text(g, '02:31', w - 16, 22, { size: 20, color: 'rgba(255,255,255,.8)', align: 'right', weight: 700 });
}

// 2本の通話を並べた画面（どちらも「ハルト」）。active=1|2 で話している方を緑に、もう一方は保留
export function twoLines(p, w, h, { t = 0, active = 1, sec1 = 92, sec2 = 15, alarm = 0, label1 = '', label2 = '' } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  text(p, '通話 2件', w / 2, 120, { size: 36, color: '#9ab8a8', weight: 700 });
  const row = (i, y, on, sec, lab, rh = 330) => {
    const sh = alarm ? noise1(t * 40, i) * 10 * alarm : 0;
    p.save(); p.translate(sh, 0);
    fillRR(p, 40, y, w - 80, rh, 40, on ? 'rgba(54,210,127,.16)' : 'rgba(255,255,255,.06)');
    p.lineWidth = on ? 6 : 2; p.strokeStyle = on ? F.green : 'rgba(255,255,255,.12)'; rr(p, 40, y, w - 80, rh, 40); p.stroke();
    y -= (330 - rh) / 2;
    circ(p, 160, y + 165, 80, '#2f4a3c'); text(p, 'ハ', 160, y + 168, { size: 76, color: '#d6f5e3', weight: 900 });
    text(p, 'ハルト', 280, y + 120, { size: 64, color: '#fff', align: 'left' });
    text(p, on ? `通話中　${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}` : '保留中', 280, y + 195, { size: 34, color: on ? F.green2 : F.amber, align: 'left', weight: 700 });
    text(p, `回線${i}`, w - 80, y + 70, { size: 26, color: '#8fb8a0', align: 'right', weight: 700 });
    if (lab) text(p, lab, 280, y + 262, { size: 28, color: '#c9d6cf', align: 'left', weight: 600 });
    if (on) { p.save(); p.lineWidth = 4; p.strokeStyle = F.green; p.beginPath(); for (let k = 0; k <= 40; k++) { const x = 640 + k * 7, a = Math.sin(k * 0.7 + t * 10) * 26 * Math.abs(noise1(t * 3 + k * 0.2, i)); k ? p.lineTo(x, y + 165 + a) : p.moveTo(x, y + 165 + a); } p.stroke(); p.restore(); }
    p.restore();
  };
  const cmp = h < 1300, rh = cmp ? 260 : 330;
  row(1, cmp ? 140 : 260, active === 1, sec1 + t, label1, rh); row(2, cmp ? 425 : 640, active === 2, sec2 + t, label2, rh);
  const bY = h - (cmp ? 215 : 420), hY = h - (cmp ? 70 : 170), br = cmp ? 48 : 56;
  for (let i = 0; i < 2; i++) circ(p, w / 2 + (i - 1) * 190, bY, br, 'rgba(255,255,255,.12)');
  circ(p, w / 2 + 190, bY, br, 'rgba(54,210,127,.35)');
  text(p, 'ミュート', w / 2 - 190, bY + br + 18, { size: 24, color: '#9ab', weight: 600 }); text(p, '切り替え', w / 2, bY + br + 18, { size: 24, color: '#9ab', weight: 600 }); text(p, 'スピーカー', w / 2 + 190, bY + br + 18, { size: 24, color: F.green2, weight: 800 });
  circ(p, w / 2, hY, cmp ? 54 : 64, '#ff3b4a'); fillRR(p, w / 2 - 28, hY - 8, 56, 16, 8, '#fff');
}
// 発信の画面（かけ直し）。answer=false で「応答なし」
export function dialScreen(p, w, h, { t = 0, name = 'ハルト', num = '090-●●●●-7710', noAnswer = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#14221c'], [1, '#08100c']]);
  const ay = h < 1300 ? 290 : 470; circ(p, w / 2, ay, 120, '#2f4a3c'); text(p, 'ハ', w / 2, ay + 6, { size: 110, color: '#d6f5e3', weight: 900 });
  if (!noAnswer) { const k = (t * 1.1) % 1; p.save(); p.globalAlpha = 1 - k; p.lineWidth = 6; p.strokeStyle = F.green; p.beginPath(); p.arc(w / 2, ay, 130 + k * 130, 0, 7); p.stroke(); p.restore(); }
  text(p, name, w / 2, ay + 220, { size: 70, color: '#fff' }); text(p, num, w / 2, ay + 290, { size: 32, color: '#9ab8a8', weight: 600 });
  text(p, noAnswer ? '応答がありません' : '呼び出し中…', w / 2, ay + 370, { size: 38, color: noAnswer ? '#ff7a7a' : F.green2, weight: 700 });
  const hY = h - (h < 1300 ? 80 : 170); circ(p, w / 2, hY, 70, '#ff3b4a'); fillRR(p, w / 2 - 34, hY - 9, 68, 18, 9, '#fff');
}
// 着信履歴：毎晩21時に「ハルト」
export function callLog(p, w, h, { t = 0, rows = h < 1300 ? 5 : 9 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#121a16'], [1, '#08100c']]);
  text(p, '履歴', 70, 140, { size: 56, color: '#fff', align: 'left' });
  const days = ['昨日', '10月26日', '10月25日', '10月24日', '10月23日', '10月22日', '10月21日', '10月20日', '10月19日'];
  for (let i = 0; i < rows; i++) {
    const y = 230 + i * 128, a = Math.min(1, Math.max(0, (t - i * 0.12) * 3));
    p.save(); p.globalAlpha = a;
    circ(p, 120, y + 50, 40, '#2f4a3c'); text(p, 'ハ', 120, y + 52, { size: 38, color: '#d6f5e3', weight: 900 });
    text(p, 'ハルト', 190, y + 34, { size: 40, color: '#fff', align: 'left' }); text(p, '着信', 190, y + 78, { size: 26, color: F.green2, align: 'left', weight: 700 });
    text(p, '21:00', w - 70, y + 34, { size: 36, color: '#dfe', align: 'right', weight: 700 }); text(p, days[i], w - 70, y + 78, { size: 24, color: '#8a9a92', align: 'right', weight: 600 });
    line(p, 60, y + 115, w - 60, y + 115, 2, 'rgba(255,255,255,.08)');
    p.restore();
  }
}
// 声の波形を2つ並べる（同じ形）
export function twinWaves(g, { t = 0, a = 1 } = {}) {
  for (let i = 0; i < 2; i++) {
    const y = 620 + i * 460;
    fillRR(g, 80, y - 170, 920, 340, 30, 'rgba(10,20,16,.85)'); g.lineWidth = 3; g.strokeStyle = 'rgba(54,210,127,.5)'; rr(g, 80, y - 170, 920, 340, 30); g.stroke();
    text(g, `回線${i + 1}　ハルト`, 130, y - 120, { size: 34, color: F.green2, align: 'left', weight: 800 });
    g.save(); g.lineWidth = 6; g.strokeStyle = F.green; g.beginPath();
    for (let k = 0; k <= 160; k++) { const x = 120 + k * 5.25, v = Math.sin(k * 0.45 + t * 6) * noise1(k * 0.18 + t * 1.5, 7) * 110 * a; k ? g.lineTo(x, y + 20 + v) : g.moveTo(x, y + 20 + v); }
    g.stroke(); g.restore();
  }
}
// 写真立て（にっこり笑う若い男＝ハルト）や犬の写真を、紙焼きの写真として描く
export function photo(g, x, y, w, h, draw, { rot = 0, a = 1 } = {}) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; fillRR(g, -w / 2 - 24, -h / 2 - 24, w + 48, h + 110, 6, '#efe9dc'); g.shadowColor = 'transparent';
  g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.translate(-w / 2, -h / 2); draw(g, w, h); g.restore();
  g.restore();
}
// 柴犬（コテツ）
export function shiba(g, w, h) {
  vgrad(g, 0, 0, w, h, [[0, '#8fb3c9'], [1, '#d9c9a8']]);
  fillRR(g, 0, h * 0.72, w, h * 0.3, 0, '#7a9a5a');
  const cx = w * 0.5, cy = h * 0.55, r = w * 0.22;
  ell(g, cx, cy + r * 1.1, r * 1.1, r * 0.8, '#c9803a'); ell(g, cx, cy + r * 1.25, r * 0.6, r * 0.55, '#f3e6d0');
  poly(g, [[cx - r * 0.85, cy - r * 0.4], [cx - r * 0.55, cy - r * 1.2], [cx - r * 0.2, cy - r * 0.6]], '#c9803a');
  poly(g, [[cx + r * 0.85, cy - r * 0.4], [cx + r * 0.55, cy - r * 1.2], [cx + r * 0.2, cy - r * 0.6]], '#c9803a');
  ell(g, cx, cy, r, r * 0.88, '#c9803a'); ell(g, cx, cy + r * 0.35, r * 0.62, r * 0.48, '#f3e6d0');
  circ(g, cx - r * 0.38, cy - r * 0.1, r * 0.1, '#1a1210'); circ(g, cx + r * 0.38, cy - r * 0.1, r * 0.1, '#1a1210');
  ell(g, cx, cy + r * 0.2, r * 0.14, r * 0.1, '#1a1210');
  g.beginPath(); g.arc(cx, cy + r * 0.3, r * 0.2, Math.PI * 0.15, Math.PI * 0.85); g.lineWidth = r * 0.05; g.strokeStyle = '#1a1210'; g.stroke();
}
