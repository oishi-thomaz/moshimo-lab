// ドラレコ 第4話「買い手」— 映像・効果音・BGM
// 手がかり（最終話で回収）：灰原からの3万円の振り込み／配車センターの壁のモニター（久保）／ハルナの電話／7号車のルームミラーの目
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, mood } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { callUI } from '../../engine/chichisets.js';
import { D, camView, mirrorShot, mirrorEyes, dash, harunaPhoto, thread, lockD, taxiSide, sdCard, frontCam, avatar } from '../../engine/dorasets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, camS, shojiS, yukiS, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep04.script.js';

const NOW = { date: '2026/12/12' };
const UP = { woman: 'up', eyes: 'normal' };
const eyesIn = (o = {}) => mirrorEyes(P.yuki, o);
// 久保（配車センターの夜の係・50代）と、灰原（ミラーの中の目だけ）と、車内カメラに映った客たち
const KUBO = { hair: 'buzz', hairC: '#7a766e', top: '#3a4656', top2: '#2e3846', bottom: '#2a2e38', shoes: '#111', tall: 1.0, glasses: true };
const HAIB = { hair: 'parted', hairC: '#121014', top: '#141418', top2: '#0e0e12', bottom: '#1a1a1e', shoes: '#111', tall: 1.0 };
const CUST = [
  { hair: 'parted', hairC: '#2a2622', top: '#3a3e4a', top2: '#2e323c', bottom: '#2a2a30', shoes: '#111', tall: 1.0 },
  { hair: 'long', hairC: '#3a2a22', top: '#7a5a5a', top2: '#6a4a4a', bottom: '#2a2a30', shoes: '#ddd', tall: 0.95, female: true },
  { hair: 'messy', hairC: '#1a1a1e', top: '#4a5a4a', top2: '#3a4a3a', bottom: '#2a2a30', shoes: '#111', tall: 1.0 },
];
const haibara = { name: '灰原', av: '灰', col: '#3a3a44' };
const haruna = { name: 'ハルナ', av: 'ハ', col: '#b07a6a' };
const mayuC = { name: 'マユ', av: 'マ', col: '#b07a8a' };
// 灰原とのやりとり（2年分の振り込み）
const PAY = [{ d: '2024年' }, { text: '今週の分、受け取った', time: '2:10' }, { text: '30,000円 振り込みました', time: '2:11' }, { d: '2025年' }, { text: '金曜の、花屋の前の女', time: '1:02' }, { text: '30,000円 振り込みました', time: '1:03' }, { text: '金曜の分、受け取った', time: '1:40' }, { text: '30,000円 振り込みました', time: '1:41' }, { text: '金曜の分、受け取った', time: '1:38' }, { text: '30,000円 振り込みました', time: '1:39' }];
const MAYU = [{ d: '今日' }, { text: 'バイト終わった〜', time: '1:41' }, { t: 0.2, text: 'お父さんの会社の車が\n迎えに来てくれたよ', time: '1:52' }];
const MAYU2 = [...MAYU, { t: 0.3, text: '迎えに来た人、\nお父さんの知り合い\nなんだって', time: '1:52' }];
const MSG_M = { name: 'マユ', av: 'マ', col: '#b07a8a', body: 'お父さんの会社の車が迎えに来てくれたよ', time: '1:52' };
const MSG_H = { name: '灰原', av: '灰', col: '#3a3a44', body: '娘さん、いい子だな。', time: '1:53' };
const camSmall = (o = {}) => (g, w, h) => camView(g, 0, 0, w, h, { P, ...NOW, ...UP, look: 0, ...o });

// 配車センターの壁のモニター（車ごとの車内カメラ）。hi＝赤くする号車、zoom 0..1＝6号車に寄る
function center(g, lt, { hi = 0, ext = 0, kubo = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#06080c'], [1, '#0c0f16']]);
  fillRR(g, 30, 140, 1020, 900, 16, '#050607');
  for (let i = 0; i < 6; i++) {
    const cx = 50 + (i % 2) * 500, cy = 160 + Math.floor(i / 2) * 290, no = i + 1;
    g.save(); g.beginPath(); g.rect(cx, cy, 480, 270); g.clip();
    camView(g, cx, cy, 480, 270, { t: lt + i, P: { ...P, yuki: no === 6 ? P.yuki : CUST[i % 3] }, woman: no === 6 ? 'up' : (i % 2 ? 'up' : 'none'), eyes: 'normal', look: 0, date: '', clock: no === 6 ? '01:50' : '', label: '', car: `${no}号車` });
    g.restore();
    if (no === hi) { g.save(); g.lineWidth = 8; g.strokeStyle = rgba(D.rec, 0.6 + 0.4 * Math.sin(lt * 6)); g.strokeRect(cx, cy, 480, 270); g.restore(); }
  }
  text(g, 'みなと台交通　配車センター', 540, 100, { size: 40, color: '#c9ccd6', weight: 800 });
  if (ext > 0) { g.save(); g.globalAlpha = ext; fillRR(g, 610, 720, 420, 64, 32, D.rec); text(g, '● 外部に中継中', 820, 753, { size: 32, color: '#fff', weight: 800 }); g.restore(); }
  if (kubo > 0) { g.save(); g.globalAlpha = kubo; vgrad(g, 0, 520, W, 800, [[0, 'rgba(0,0,0,0)'], [0.4, 'rgba(0,0,0,.85)'], [1, 'rgba(0,0,0,.95)']]); close(g, KUBO, { x: 540, y: 820, s: 1.8, eyes: 'narrow', brow: -0.2, mouth: 'line', lightFrom: 'left', glint: 1 }); g.restore(); }
}
// 久保の社員証
function idCard(g, lt) {
  bg(g, '#0a0b10', '#14161c');
  g.save(); g.translate(540, 640); g.rotate(-0.04 + noise1(lt, 2) * 0.01);
  g.save(); g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 40; fillRR(g, -380, -260, 760, 520, 28, '#eef0f2'); g.restore();
  fillRR(g, -380, -260, 760, 110, 28, '#2c3a52'); text(g, 'みなと台交通', 0, -205, { size: 44, color: '#fff', weight: 900 });
  g.save(); g.beginPath(); g.rect(-340, -120, 260, 330); g.clip(); vgrad(g, -340, -120, 260, 330, [[0, '#a9b4c0'], [1, '#c9d0d8']]); close(g, KUBO, { x: -210, y: 10, s: 1.3, eyes: 'normal', brow: 0, mouth: 'line', lightFrom: 'left' }); g.restore();
  text(g, '配車センター', 150, -50, { size: 36, color: '#4a5060', weight: 700 });
  text(g, '久保', 150, 50, { size: 110, color: '#14161c', weight: 900 });
  text(g, '夜間 配車係', 150, 150, { size: 34, color: '#4a5060', weight: 700 });
  g.restore();
}
// マユの写真：7号車の後ろの席で笑うマユ。上にルームミラー、その中に運転席の男の目
function mayuCar(q, w, h, { eye = 1, t = 0 } = {}) {
  vgrad(q, 0, 0, w, h, [[0, '#1a1c24'], [1, '#0c0d12']]);
  fillRR(q, 0, h * 0.55, w, h * 0.45, 0, '#25282f');
  q.save(); q.globalCompositeOperation = 'lighter'; glow(q, w * 0.8, h * 0.25, w * 0.6, 'rgba(255,170,80,1)', 0.25); q.restore();
  close(q, P.mayu, { x: w * 0.42, y: h * 0.6, s: w / 420, eyes: 'normal', mouth: 'smile', lightFrom: 'right' });
  // ルームミラー
  const mw = w * 0.5, mh = h * 0.13, mx = w * 0.62, my = h * 0.1;
  fillRR(q, mx - mw / 2 - 8, my - mh / 2 - 8, mw + 16, mh + 16, 26, '#08090b');
  q.save(); q.beginPath(); q.rect(mx - mw / 2, my - mh / 2, mw, mh); q.clip(); q.translate(mx - mw / 2, my - mh / 2); mirrorEyes(HAIB, { eyes: 'narrow', brow: -0.5, t })(q, mw, mh);
  if (eye < 1) { q.fillStyle = `rgba(10,11,14,${1 - eye})`; q.fillRect(0, 0, mw, mh); }
  q.restore();
  text(q, '7号車', w * 0.14, h * 0.06, { size: w * 0.05, color: 'rgba(255,255,255,.7)', weight: 800 });
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 4, title: '買い手',
    back: g2 => { camView(g2, -333, 0, 1745, 1920, { t: 3, P, ...UP, look: 0, date: '', clock: '', label: '', car: '' }); },
    face: g2 => { fillRR(g2, 70, 1290, 380, 70, 35, 'rgba(0,0,0,.6)'); circ(g2, 112, 1325, 14, D.rec); text(g2, 'REC  01:50', 140, 1327, { size: 40, color: '#fff', align: 'left', weight: 800 }); fillRR(g2, 610, 1290, 400, 70, 35, D.rec); text(g2, '¥30,000', 810, 1327, { size: 44, color: '#fff', weight: 900 }); },
  });
}

const SHOTS = [
  // ── 冒頭：1フレーム目から車内カメラ（1:50）。後ろの席のユキ
  { at: 'cold', off: -0.3, finish: { vignette: 0.6 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...UP, look: 0, clock: '01:50:02', glitch: 0.5 * (1 - inv(0, 0.3, lt)), z0: 1.0, z1: 1.0 }); } },
  { at: 'k1', finish: { vignette: 0.6 }, draw(g, lt, D0) { camS(g, lt, D0, { ...NOW, ...UP, eyes: 'narrow', look: 0, clock: '01:50:03', t0: 0.3, cx: 660, cy: 640, z0: 1.05, z1: 1.35 }); } },
  { at: 'k2', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['k2'], { eyes: 'narrow', brow: 0.4, look: 0.1, z0: 1.05, z1: 1.15 }); mood(g, { dark: 0.12 }); } },
  { at: 'k3', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: 9, ...haibara, msgs: PAY, scroll: lerp(0, 420, ease(inv(0, D0, lt))) }), { z0: 1.0, z1: 1.06 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 1本3万円
  { at: 'a1', draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'narrow' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 250, 190, 580, 130, 20, 'rgba(10,12,18,.88)'); text(g, '小野寺ショウジ（48）', 540, 240, { size: 48, color: '#fff' }); text(g, 'タクシー運転手', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, [], { eyes: 'narrow', brow: -0.5, look: -0.3 }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 270, 150, 540, 130, 20, 'rgba(10,12,18,.88)'); text(g, '白石ユキ（31）', 540, 200, { size: 48, color: '#fff' }); text(g, 'ハルナの姉', 540, 252, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a3', finish: { vignette: 0.65 }, draw(g, lt, D0) { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#04060c'], [1, '#0c0e14']]); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 860, 360, 520, 'rgba(255,170,80,1)', 0.35); glow(g, 200, 420, 300, 'rgba(255,170,80,1)', 0.2); g.restore(); fillRR(g, -300, 980, W + 600, 1200, 0, '#0e0f13'); for (let i = 0; i < 5; i++) fillRR(g, 60 + i * 230, 520 - (i % 2) * 40, 180, 300, 4, i % 2 ? '#3a2a24' : '#24303e'); g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D0, 1.0, 1.06) }); taxiSide(g, 540, 940, 1.0, { sign: '回送', t: lt }); g.restore(); } },
  { at: 'a4', finish: { vignette: 0.6 }, draw(g, lt, D0) { bg(g, '#14161c', '#0a0b10'); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D0, 1.0, 1.05) }); photo(g, 540, 560, 600, 760, (q, w, h) => { vgrad(q, 0, 0, w, h, [[0, '#b8c8d8'], [1, '#e8ecf0']]); fillRR(q, 0, h * 0.5, w, h * 0.5, 0, '#c8bca8'); close(q, P.mayu, { x: w * 0.5, y: h * 0.42, s: w / 470, eyes: 'normal', mouth: 'smile', lightFrom: 'left' }); }, { rot: -0.03 }); g.restore(); mood(g, { desat: 0.4 }); tag(g, '娘　マユ', 540, 1020, { size: 38, bg: '#0b0d12', color: '#f4f6f8', alpha: inv(0.3, 0.6, lt) }); } },
  { at: 'a5', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'in', sub: '2年前　着信 2:04', ...haibara })); mood(g, { desat: 0.4 }); } },
  { at: 'a6', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 3, mode: 'talk', ...haibara }), { y: 700, z0: 1.15, z1: 1.25 }); subBand(g); mood(g, { desat: 0.4 }); } },
  { at: 'a7', finish: { vignette: 0.6 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); const n = Math.min(3, 1 + Math.floor(lt / Math.max(D0 / 3, 0.1))); for (let i = 0; i < n; i++) { const y = 90 + i * 380; g.save(); g.beginPath(); g.rect(60, y, 960, 350); g.clip(); camView(g, 60, y, 960, 350, { t: lt + i * 2, P: { ...P, yuki: CUST[i] }, woman: 'up', eyes: 'normal', look: [0.4, -0.3, 0.2][i], date: ['2025/03/14', '2025/06/27', '2025/10/03'][i], clock: ['23:12:40', '00:31:05', '01:48:22'][i], car: '6号車' }); g.restore(); const k = easeOut(inv(0.15, 0.45, lt - i * D0 / 3)); g.save(); g.globalAlpha = k; g.translate(880, y + 290); g.rotate(-0.12); fillRR(g, -120, -40, 240, 80, 12, D.rec); text(g, '¥30,000', 0, 2, { size: 44, color: '#fff', weight: 900 }); g.restore(); } } },
  { at: 'a8', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: 9, ...haibara, msgs: [...PAY, ...PAY.slice(4)], scroll: lerp(200, 1100, ease(inv(0, D0, lt))) }), { z0: 1.02, z1: 1.1 }); mood(g, { dark: 0.1 }); } },
  { at: 'a9', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['a9'], { eyes: 'wide', brow: 0.3, look: -0.8 }); } },
  { at: 'a10', finish: { vignette: 0.75 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, ['a10'], { eyes: 'narrow', brow: 0.6, look: -0.2, z0: 1.12, z1: 1.2 }); mood(g, { dark: 0.2 }); } },
  { at: 'a11', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.25, 1.38) }); mirrorShot(g, { t: lt, speed: 0, inner: eyesIn({ eyes: 'narrow', brow: 0.4 }) }); g.restore(); } },

  // ── 2. 見せていた男
  { at: 'b1', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['b1'], { eyes: 'narrow', brow: -0.5, look: -0.6 }); } },
  { at: 'b2', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 790, y: 470, z: slow(lt, D0, 1.5, 1.65) }); dash(g, { t: lt, screen: camSmall({ clock: '01:50:31', t: lt }) }); g.restore(); } },
  { at: 'b3', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D0, 1.0, 1.06) }); center(g, lt, { hi: 6, ext: inv(D0 * 0.4, D0 * 0.6, lt) }); g.restore(); } },
  { at: 'radio', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 900, z: slow(lt, D0, 1.0, 1.08) }); dash(g, { t: lt, radio: 1, screen: camSmall({ clock: '01:50:40', t: lt }) }); g.restore(); } },
  { at: 'b4', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 560, y: 1000, z: slow(lt, D0, 1.5, 1.7) }); dash(g, { t: lt, radio: 1 }); g.restore(); } },
  { at: 'b5', finish: { vignette: 0.65 }, draw(g, lt, D0, S) { shojiS(g, lt, D0, S, [], { eyes: 'wide', brow: -0.4, look: 0.3, z0: 1.05, z1: 1.12 }); } },
  { at: 'b6', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D0, 1.0, 1.08) }); center(g, lt + 3, { hi: 6, ext: 1, kubo: easeOut(inv(0, D0 * 0.6, lt)) }); g.restore(); mood(g, { desat: 0.3 }); } },
  { at: 'b7', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 640, z: slow(lt, D0, 1.0, 1.08) }); idCard(g, lt); g.restore(); } },
  { at: 'b8', finish: { vignette: 0.7 }, draw(g, lt, D0) { g.save(); cam(g, { x: 790, y: 960, z: slow(lt, D0, 1.3, 1.7) }); center(g, lt + 5, { hi: 6, ext: 1 }); g.restore(); mood(g, { dark: 0.12 }); } },

  // ── 後編の頭：久保の声だと分かって、マイクをつかむ
  { at: 'c1', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 860, y: 920, z: slow(lt, D0, 1.3, 1.55) }); dash(g, { t: lt, radio: 1 }); g.restore(); } },
  { at: 'c2', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['c2'], { eyes: 'wide', brow: -0.6, look: -0.9, z0: 1.15, z1: 1.2 }); } },
  { at: 'c3', finish: { vignette: 0.65 }, draw(g, lt, D0) { const blink = lt < D0 * 0.75 && (lt / (D0 * 0.25)) % 1 < 0.55 ? 1 : 0; g.save(); cam(g, { x: 480, y: 1080, z: slow(lt, D0, 1.8, 1.9) }); dash(g, { t: 0, radio: blink }); g.restore(); mood(g, { dark: inv(D0 * 0.75, D0, lt) * 0.3 }); } },

  // ── 3. 電話
  { at: 'ring', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'in', name: '非通知', av: '？', col: '#5a5e6a' })); } },
  { at: 'd2', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['d2'], { eyes: 'normal', brow: 0.4, look: 0.3, phoneLight: 1, z0: 1.16, z1: 1.22 }); } },
  { at: 'd3', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['d3'], { eyes: 'normal', brow: -0.2, look: -0.8, phoneLight: 1 }); } },
  { at: 'd4', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt, mode: 'talk', name: '非通知', av: '？', col: '#5a5e6a' }), { z0: 1.02, z1: 1.1 }); } },
  { at: 'd5', finish: { vignette: 0.6 }, draw(g, lt, D0) { bg(g, '#14161c', '#0a0b10'); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D0, 1.0, 1.08) }); photo(g, 540, 560, 560, 680, (q, w, h) => harunaPhoto(q, w, h, P.haruna), { rot: -0.03 }); g.restore(); tag(g, '白石ハルナ（26）', 540, 150, { size: 40, bg: '#0b0d12', color: '#f4f6f8', alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'd6', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#040506', '#08090b'); g.save(); cam(g, { x: 540, y: 630, z: slow(lt, D0, 1.0, 1.08) }); frontCam(g, 40, 80, 1000, 1100, { t: lt, clock: '00:53:58', walk: 0.6 + inv(0, D0, lt) * 0.4, lights: 1 }); g.restore(); mood(g, { desat: 0.3 }); } },
  { at: 'd7', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 5, mode: 'talk', ...haruna }), { z0: 1.02, z1: 1.08 }); } },
  { at: 'd8', draw(g, lt, D0, S) { yukiS(g, lt, D0, S, ['d8'], { eyes: 'narrow', brow: -0.4, look: -0.7 }); } },
  { at: 'd9', finish: { vignette: 0.7 }, draw(g, lt, D0) { bg(g, '#0a0b10', '#14161c'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 640, 700, 'rgba(255,170,80,1)', 0.18); g.restore(); g.save(); cam(g, { x: 540, y: 640, z: slow(lt, D0, 1.0, 1.1) }); sdCard(g, 540, 460, 1.3, { rot: -0.12 + noise1(lt, 2) * 0.02 }); g.restore(); subBand(g); } },
  { at: 'd10', finish: { vignette: 0.7 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => callUI(p, w, h, { t: lt + 12, mode: 'talk', ...haruna }), { y: 640, z0: 1.15, z1: 1.25 }); subBand(g); const pa = 0.5 + 0.5 * Math.sin(lt * 6); glow(g, 540, 960, 900, 'rgba(255,40,40,1)', 0.05 + 0.05 * pa); } },

  // ── 4. 引き
  { at: 'buzz', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D0, 1.0, 1.04) }); lockD(g, { t: lt, clock: '1:52', notifs: [{ t: 0.2, ...MSG_M }] }); g.restore(); } },
  { at: 'e2', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: lt + 0.2, ...mayuC, msgs: MAYU })); } },
  { at: 'e3', finish: { vignette: 0.6 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => thread(p, w, h, { t: lt, ...mayuC, msgs: MAYU2, hi: 3 }), { z0: 1.04, z1: 1.1 }); } },
  { at: 'e4', finish: { vignette: 0.65 }, draw(g, lt, D0) { bg(g, '#14161c', '#0a0b10'); const k = ease(inv(D0 * 0.3, D0, lt)); g.save(); cam(g, { x: lerp(540, 617, k), y: lerp(960, 300, k), z: lerp(1.0, 1.9, k) }); photo(g, 540, 600, 640, 900, (q, w, h) => mayuCar(q, w, h, { t: lt }), { rot: -0.02 }); g.restore(); } },
  { at: 'buzz2', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D0, 1.0, 1.04) }); lockD(g, { t: lt, clock: '1:53', notifs: [MSG_M, { t: 0.2, ...MSG_H }] }); g.restore(); } },
  { at: 'e5', finish: { vignette: 0.7 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D0, 1.15, 1.25) }); lockD(g, { t: 9, clock: '1:53', notifs: [MSG_M, MSG_H] }); g.restore(); subBand(g); } },
  { at: 'e6', finish: { vignette: 0.75 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 400, z: slow(lt, D0, 1.3, 1.5) }); mirrorShot(g, { t: lt, inner: mirrorEyes(HAIB, { eyes: 'narrow', brow: -0.6, t: lt }) }); g.restore(); text(g, '7号車', 540, 640, { size: 44, color: 'rgba(255,255,255,.75)', weight: 800 }); mood(g, { dark: inv(D0 - 0.8, D0, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'engine', dur: 9, vol: 0.2 },
  { at: 'cold', type: 'glitch', vol: 0.55 },
  { at: 'k1', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'k2', type: 'stab', vol: 0.5 },
  { at: 'k3', type: 'hit', vol: 0.7 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a3', type: 'carstop', vol: 0.4 },
  { at: 'a5', type: 'dial', vol: 0.45 },
  { at: 'a6', type: 'pickup', vol: 0.35 },
  { at: 'a7', type: 'tap3', vol: 0.4 },
  { at: 'a8', type: 'stab', vol: 0.5 },
  { at: 'a9', type: 'riser', vol: 0.4 },
  { at: 'a10', type: 'subdrop', vol: 0.6 },
  { at: 'b3', type: 'glitch', vol: 0.35 },
  { at: 'radio', type: 'glitch', vol: 0.5 },
  { at: 'radio', off: 0.2, type: 'pickup', vol: 0.5 },
  { at: 'b5', type: 'heartbeat', dur: 3, vol: 0.45 },
  { at: 'b7', type: 'hit', vol: 0.8 },
  { at: 'b8', type: 'subdrop', vol: 0.7 },
  { at: 'c1', type: 'glitch', vol: 0.35 },
  { at: 'c2', type: 'stab', vol: 0.5 },
  { at: 'c3', type: 'tap3', vol: 0.35 },
  { at: 'ring', type: 'dial', vol: 0.55 },
  { at: 'd4', type: 'pickup', vol: 0.35 },
  { at: 'd5', type: 'hit', vol: 0.8 },
  { at: 'd6', type: 'riser', vol: 0.4 },
  { at: 'd9', type: 'stab', vol: 0.5 },
  { at: 'd10', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'buzz', type: 'notif', vol: 0.6 },
  { at: 'e3', type: 'stab', vol: 0.45 },
  { at: 'e4', type: 'riser', vol: 0.5 },
  { at: 'buzz2', type: 'notif', vol: 0.6 },
  { at: 'e5', type: 'hit', vol: 0.8 },
  { at: 'e6:end', off: 0.3, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'a7', mood: 'suspense' },
  { at: 'a10', mood: 'silence' },
  { at: 'b1', mood: 'uneasy' },
  { at: 'radio', mood: 'suspense' },
  { at: 'b8', mood: 'silence' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'ring', mood: 'suspense' },
  { at: 'd5', mood: 'silence' },
  { at: 'd6', mood: 'uneasy' },
  { at: 'buzz', mood: 'tension' },
  { at: 'e4', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a3', '1:50　港の駐車場', 2.6], ['a4', '2年前', 2.4], ['d6', '1年前の金曜　0:54', 2.6]]) });
