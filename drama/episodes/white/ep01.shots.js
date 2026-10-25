// ホワイト案件 第1話「次の現場」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, back, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, cam, shake, text, FONT, SERIF } from '../../engine/core.js';
import { C, CAST2, figure, close, head, speedLines, sfxText, panels, mood, chat, timer, subBand, toneRect, crowIcon } from '../../engine/noir.js';
import { nightSky, street, house, dinnerPhoto, housePhoto, sisterPhoto, takumiPhoto, station, carFront, checkpoint, truckBack, genkan, stairsUp } from '../../engine/noirsets.js';
import { runEpisode } from '../../engine/player.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

CAST.Y.name = ''; CAST.X.name = '？？？'; CAST.K.name = ''; CAST.M.name = '';
const P = CAST2;
const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 14)); } return 0; };
const blink = (lt, k = 0) => ((lt + k * 1.3) % 3.1) < 0.1;
const bg = (g, a = '#06070c', b = '#0d1120') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
// ぼかした夜道（チャットの後ろ）
function blurStreet(g, t) {
  g.save(); g.filter = 'blur(14px) brightness(0.55)'; street(g, { t, lit2: 0, lit1: 0 }); g.restore();
}
// 免許証
function license(g, x, y, s, a = 1) {
  g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(-0.05); g.scale(s, s);
  fillRR(g, -300, -190, 600, 380, 24, '#dfe8e0'); fillRR(g, -300, -190, 600, 60, 24, '#5d8f6a'); g.fillStyle = '#5d8f6a'; g.fillRect(-300, -150, 600, 20);
  fillRR(g, 90, -100, 170, 220, 8, '#9aa3ad'); head(g, P.yuuma, 175, -10, 52, { eyes: 'dot' });
  text(g, '篠原 悠真', -110, -70, { size: 46, color: '#1a1d26', weight: 800 });
  for (let i = 0; i < 4; i++) fillRR(g, -270, -10 + i * 42, 320 - i * 40, 14, 6, '#a9b2a8');
  g.restore();
}
// 防犯カメラの画像
function cctv(g, w, h, t) {
  g.save(); g.scale(w / 1000, h / 700); g.filter = 'grayscale(1) contrast(1.3)';
  truckBack(g, { open: 1 }); g.filter = 'none';
  figure(g, P.yuuma, { x: 760, y: 1400, s: 1.6, arms: [40, -80, 40, -80], look: 0.6 });
  g.restore();
  g.save(); g.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
  g.font = '600 22px "Noto Sans CJK JP"'; g.fillStyle = '#fff'; g.fillText('CAM 02  10/22 14:07', 18, 34); circ(g, w - 30, 28, 9, '#ff2a40'); g.restore();
}

const SHOTS = [
  // ── 0秒：暗闇に通知 → 「次の現場」
  { at: 'notif', noSubs: false, draw(g, lt, D, S) {
    bg(g, '#030305', '#07080e');
    const k = easeOut(inv(0, 0.35, lt));
    // ロック画面の通知
    g.save(); g.translate(0, (1 - k) * -200); g.globalAlpha = k;
    fillRR(g, 90, 360, 900, 170, 40, 'rgba(30,34,48,.92)'); crowIcon(g, 180, 445, 46);
    text(g, 'カラス', 260, 410, { size: 34, color: '#9aa5bb', align: 'left', weight: 800 }); text(g, 'いま', 950, 410, { size: 26, color: '#6a7385', align: 'right', weight: 500 });
    text(g, '次の現場', 260, 470, { size: 50, color: '#fff', align: 'left', weight: 800 });
    g.restore();
    glow(g, 540, 445, 600, 'rgba(255,40,60,1)', 0.12 * k);
  } },
  // ── 実家の写真
  { at: 'o2', off: -0.15, draw(g, lt, D, S) {
    blurStreet(g, lt);
    const msgs = [{ t: -5, from: 'karasu', text: '次の現場' }, { t: 0, from: 'karasu', img: housePhoto, h: 470 }];
    const z = lerp(1, 1.12, ease(clamp(lt / D)));
    g.save(); cam(g, { x: 540, y: 700, z }); chat(g, msgs, lt, { y: 200, h: 940 }); g.restore();
    // 表札に赤い丸
    const a = inv(0.4, 0.8, lt); if (a > 0) { g.save(); g.globalAlpha = a; g.lineWidth = 8; g.strokeStyle = C.red; g.beginPath(); g.ellipse(540 + 248 * z * 0.66 - 30, 700 + (870 - 700) * z, 70, 46, 0, 0, 7); g.stroke(); g.restore(); }
  } },
  // ── リビングの写真（家の中から）
  { at: 'o3', off: -0.25, draw(g, lt, D, S) {
    bg(g);
    const k = easeOut(clamp(lt / 0.3));
    g.save(); g.translate(540, 760); g.scale(lerp(0.8, 1, k) * lerp(1, 1.08, lt / D), lerp(0.8, 1, k) * lerp(1, 1.08, lt / D)); g.rotate(-0.02);
    fillRR(g, -470, -340, 940, 680, 16, '#e9e4da'); g.save(); rr(g, -455, -325, 910, 650, 10); g.clip(); g.translate(-455, -325); dinnerPhoto(g, 910, 650, lt); g.restore();
    g.restore();
    // ドアの縁を示す
    const a = inv(0.7, 1.1, lt); if (a > 0) { g.save(); g.globalAlpha = a; g.setLineDash([16, 12]); g.lineWidth = 6; g.strokeStyle = C.red; g.strokeRect(85, 430, 120, 650); g.setLineDash([]); g.restore(); sfxText(g, '…中？', 300, 360, { size: 70, rot: -0.08, alpha: a, color: '#f4f1ea' }); }
    mood(g, { red: 0.1 * inv(0.5, 1.5, lt) });
  } },
  // ── 母からのLINE
  { at: 'o4', off: -0.2, draw(g, lt, D, S) {
    blurStreet(g, lt);
    chat(g, [{ t: 0, from: 'mom', text: 'ユウマ、帰ってきてるん？\n2階で物音するけど' }], lt, { title: '母', y: 300, h: 640 });
  } },
  // ── 俺は帰ってへん
  { at: 'o5', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0d18');
    const z = lerp(1.0, 1.15, easeOut(clamp(lt / 0.4)));
    g.save(); cam(g, { x: 540, y: 820, z }); close(g, P.yuuma, { y: 760, s: 4.2, eyes: 'wide', brow: -1, mouth: 'line', talk: talking(lt, S, ['o5']) * 0.4, phoneLight: true, sweat: lt }); g.restore();
    speedLines(g, 540, 700, { inner: 520, t: lt, color: 'rgba(240,240,250,.7)' });
    sfxText(g, 'ドクン', 820, 260, { size: 110, alpha: inv(0.05, 0.2, lt) * (1 - inv(1.2, 1.6, lt)), shake: 6, t: lt });
    mood(g, { desat: 0.4 });
  } },
  // ── 21時までに来い
  { at: 'o6', draw(g, lt, D, S) {
    blurStreet(g, lt);
    chat(g, [{ t: -3, from: 'karasu', img: housePhoto, h: 330 }, { t: 0.05, from: 'karasu', text: '21時までに来い' }, { t: 1.2, from: 'karasu', text: '金庫の番号は、お前が知ってる' }], lt, { y: 200, h: 900 });
    mood(g, { red: 0.12 * inv(1.2, 2.5, lt) });
  } },
  // ── タイトル
  { at: 'title', noSubs: true, finish: { vignette: 0.7, grainA: 0.12 }, draw(g, lt, D, S) {
    bg(g, '#030305', '#08090e');
    const a = easeOut(inv(0, 0.25, lt));
    // 赤いひっかき傷
    g.save(); g.globalAlpha = a; for (let i = 0; i < 3; i++) { const y = 700 + i * 46; poly(g, [[180 + i * 30, y + 30], [900 - i * 20, y - 40], [905 - i * 20, y - 28], [185 + i * 30, y + 44]], C.red); } g.restore();
    const gl = lt < 0.4 ? noise1(lt * 60, 3) * 14 : 0;
    text(g, 'ホワイト案件', 540 + gl, 760, { size: 150, color: '#f4f1ea', font: SERIF, weight: 700, alpha: a, spacing: 6 });
    if (lt < 0.4) text(g, 'ホワイト案件', 540 - gl, 760, { size: 150, color: rgba('#ff2a40', 0.5), font: SERIF, weight: 700, alpha: a, spacing: 6 });
    const b = easeOut(inv(0.4, 0.8, lt));
    text(g, '第1話　次の現場', 540, 920, { size: 52, color: '#c9ccd6', alpha: b, weight: 800 });
    text(g, '全5話', 540, 600, { size: 32, color: '#8a8f9c', alpha: b, weight: 800, spacing: 10 });
  } },
  // ── 3日前（回想：色抜け）
  { at: 'b1', draw(g, lt, D, S) {
    panels(g, [
      { x: 60, y: 160, w: 960, h: 560, rot: -0.01, slide: easeOut(clamp(lt / 0.3)), from: 'left', draw(p, w, h) { vgrad(p, 0, 0, w, h, [[0, '#d9d4c8'], [1, '#bdb6a6']]); fillRR(p, 80, 60, w - 160, h - 120, 30, '#f4f1ea'); text(p, '【急募】引越しスタッフ', w / 2, 150, { size: 52, color: '#2a2530' }); text(p, '日給 15,000円', w / 2, 260, { size: 84, color: '#2a2530' }); text(p, '即日払い・未経験OK', w / 2, 360, { size: 40, color: '#5a5560' }); fillRR(p, w / 2 - 150, 410, 300, 70, 35, '#5d8f6a'); text(p, '応募する', w / 2, 446, { size: 36, color: '#fff' }); } },
      { x: 60, y: 760, w: 960, h: 560, rot: 0.01, alpha: inv(0.9, 1.1, lt), slide: easeOut(inv(0.9, 1.2, lt)), from: 'right', draw(p, w, h) { p.save(); p.scale(w / 1080, h / 1500); p.translate(0, -150); truckBack(p, { open: 0 }); figure(p, P.yuuma, { x: 760, y: 1400, s: 1.4, arms: [150, 30, 150, 30], look: -0.4 }); p.restore(); } },
    ]);
    mood(g, { desat: 0.75 });
    text(g, '3日前', 540, 110, { size: 40, color: '#f4f1ea', weight: 800 });
  } },
  { at: 'b2', draw(g, lt, D, S) {
    const op = easeOut(inv(0.2, 0.7, lt));
    g.save(); cam(g, { x: 540, y: 1100, z: lerp(1.2, 1.5, ease(clamp(lt / D))) }); truckBack(g, { open: op }); g.restore();
    if (lt > 0.6) speedLines(g, 540, 820, { inner: 420, t: lt, color: 'rgba(255,255,255,.6)' });
    sfxText(g, '!?', 800, 330, { size: 160, alpha: inv(0.6, 0.8, lt), color: C.red, shake: 4, t: lt });
    mood(g, { desat: 0.7 });
  } },
  { at: 'b3', draw(g, lt, D, S) {
    bg(g, '#141416', '#0a0a0c');
    chat(g, [{ t: 0, from: 'karasu', img: cctv, h: 520 }, { t: 0.5, from: 'karasu', text: 'お前の顔、カメラに残ってるで' }, { t: 1.6, from: 'karasu', text: 'もう共犯や' }], lt, { y: 200, h: 920 });
    mood(g, { desat: 0.6, red: 0.08 * inv(1.6, 2.2, lt) });
  } },
  { at: 'b4', draw(g, lt, D, S) {
    bg(g, '#141416', '#0a0a0c');
    // カメラの画面で免許証を撮られる
    fillRR(g, 120, 220, 840, 1000, 40, '#050506');
    license(g, 540, 700, 1.25);
    g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,.8)'; for (const [x, y, sx, sy] of [[180, 300, 1, 1], [900, 300, -1, 1], [180, 1100, 1, -1], [900, 1100, -1, -1]]) { line(g, x, y, x + sx * 60, y, 6, 'rgba(255,255,255,.8)'); line(g, x, y, x, y + sy * 60, 6, 'rgba(255,255,255,.8)'); }
    circ(g, 540, 1150, 46, '#f4f1ea'); circ(g, 540, 1150, 38, '#050506'); circ(g, 540, 1150, 32, '#f4f1ea');
    const fl = S.L('b4') + 0.9; if (lt > fl && lt < fl + 0.15) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 0, W, H); }
    mood(g, { desat: 0.6 });
  } },
  // ── 今：既読がつかない
  { at: 'c1', draw(g, lt, D, S) {
    blurStreet(g, lt);
    chat(g, [{ t: -5, from: 'mom', text: 'ユウマ、帰ってきてるん？\n2階で物音するけど' }, { t: 0.4, from: 'me', text: '2階に行くな', read: false }, { t: 1.0, from: 'me', text: '母さん？', read: false }], lt, { title: '母', y: 200, h: 900 });
    if (lt > S.L('c2')) { const a = inv(S.L('c2'), S.L('c2') + 0.3, lt); g.save(); g.globalAlpha = a; g.lineWidth = 6; g.strokeStyle = C.red; g.beginPath(); g.arc(860, 985, 70, 0, 7); g.stroke(); g.restore(); sfxText(g, '既読…', 760, 1120, { size: 60, rot: 0.05, alpha: a, color: '#f4f1ea' }); }
  } },
  // ── 110 → カラスが先回り
  { at: 'c3', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0d16');
    fillRR(g, 170, 180, 740, 1040, 50, '#0d1019');
    const typed = lt > S.L('c3') + 1.0 ? '11' : lt > S.L('c3') + 0.6 ? '1' : '';
    text(g, typed, 540, 330, { size: 110, color: '#fff', weight: 500, font: '"Noto Sans CJK JP"' });
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    keys.forEach((k, i) => { const x = 340 + (i % 3) * 200, y = 520 + Math.floor(i / 3) * 170; const hit = k === '1' && ((lt > S.L('c3') + 0.6 && lt < S.L('c3') + 0.75) || (lt > S.L('c3') + 1.0 && lt < S.L('c3') + 1.15)); circ(g, x, y, 70, hit ? '#5a6480' : '#1d2230'); text(g, k, x, y + 2, { size: 56, color: '#fff', weight: 500, font: '"Noto Sans CJK JP"' }); });
    // カラスの通知が割り込む
    const cut = S.L('cut110');
    if (lt > cut) {
      if (lt < cut + 0.3) { g.save(); g.globalAlpha = 0.6; for (let i = 0; i < 8; i++) { const R = rng(i + Math.floor(lt * 30)); g.fillStyle = R() < 0.5 ? '#ff2a40' : '#2affee'; g.fillRect(0, R() * H, W, 10 + R() * 40); } g.restore(); }
      const k = easeOut(inv(cut, cut + 0.25, lt));
      g.save(); g.translate(0, (1 - k) * -300); fillRR(g, 90, 240, 900, 230, 40, 'rgba(24,26,36,.97)'); g.lineWidth = 4; g.strokeStyle = C.red; rr(g, 90, 240, 900, 230, 40); g.stroke(); crowIcon(g, 180, 340, 46);
      text(g, 'カラス', 260, 300, { size: 32, color: '#9aa5bb', align: 'left' }); text(g, '通報したら、', 260, 360, { size: 46, color: '#fff', align: 'left' }); text(g, '2階のやつが降りる', 260, 420, { size: 46, color: '#fff', align: 'left' }); g.restore();
      mood(g, { red: 0.15 * k });
    }
  } },
  { at: 'c5', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0d16');
    g.save(); cam(g, { x: 540, y: 800, z: lerp(1.05, 1.15, lt / D), ...shake(lt, 4) }); close(g, P.yuuma, { y: 760, s: 4.2, eyes: 'wide', brow: -1, mouth: 'open', talk: talking(lt, S, ['c5']) * 0.6, phoneLight: true, look: 0.4, lookY: 1, sweat: lt }); g.restore();
    // 周りを見回すと、どこにでも目
    const a = inv(1.0, 1.6, lt); if (a > 0) { for (let i = 0; i < 7; i++) { const R = rng(i + 9); const x = R() * W, y = 150 + R() * 400; g.save(); g.globalAlpha = a * 0.7; ell(g, x, y, 40, 16, '#f4f1ea'); circ(g, x, y, 9, '#0a0a0e'); g.restore(); } }
    mood(g, { desat: 0.5 });
  } },
  // ── 電車が止まる
  { at: 'd1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 900, z: lerp(1.0, 1.06, lt / D) }); station(g, { t: lt });
    figure(g, P.yuuma, { x: 540, y: 1560, s: 1.5, turn: 0.2, arms: [10, 0, 30, -110], phone: true, brow: -1, eyes: 'wide', look: -0.5, lookY: -1 }); g.restore();
  } },
  // ── ヘッドライト → ジン
  { at: 'car', draw(g, lt, D, S) {
    street(g, { lit2: 0.2 });
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, 0, W, H);
    const k = easeOut(clamp(lt / 0.5));
    glow(g, 330, 1300, 500 * k + 100, 'rgba(255,255,240,1)', 0.8 * k); glow(g, 750, 1300, 500 * k + 100, 'rgba(255,255,240,1)', 0.8 * k);
    g.fillStyle = `rgba(255,255,255,${0.35 * k})`; g.fillRect(0, 0, W, H);
  } },
  { at: 'd2', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0d0e14');
    glow(g, 900, 300, 700, 'rgba(255,190,110,1)', 0.15);
    g.save(); cam(g, { x: 540, y: 800, z: lerp(1.1, 1.0, easeOut(clamp(lt / 0.4))) }); close(g, P.jin, { y: 780, s: 4.0, eyes: 'narrow', brow: 0.8, mouth: 'line', talk: talking(lt, S, ['d2']) * 0.5, look: 0.5, lightFrom: 'right' }); g.restore();
    // 車の窓枠
    g.lineWidth = 120; g.strokeStyle = '#030305'; g.strokeRect(-40, 120, W + 80, 1450);
  } },
  { at: 'd3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); carFront(g, { t: lt, jin: { talk: talking(lt, S, ['d3']), eyes: 'narrow', brow: 0.6, look: 0.6 }, yuuma: { eyes: 'wide', brow: -1, look: -0.6, gloves: lt > 0.8 } }); g.restore();
  } },
  { at: 'd4', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    for (let i = 0; i < 3; i++) { const p = ((lt * 0.55 + i / 3) % 1); g.save(); g.globalAlpha = Math.sin(p * Math.PI) * 0.25; g.fillStyle = 'rgba(255,190,110,1)'; g.fillRect(0, lerp(-200, 2100, p), W, 160); g.restore(); }
    g.save(); cam(g, { x: 540, y: 800, z: lerp(1.0, 1.12, ease(lt / D)) }); close(g, P.jin, { y: 760, s: 4.1, eyes: 'narrow', brow: 0.4, talk: talking(lt, S, ['d4']) * 0.5, look: 0.2, lightFrom: 'right', turn: 0.2 }); g.restore();
    mood(g, { red: 0.1 * inv(S.L('d4') + 1.2, S.L('d4') + 2.0, lt) });
  } },
  { at: 'd5', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    // ハンドルを叩く手（タトゥー）
    g.lineWidth = 70; g.strokeStyle = '#0d0e14'; g.beginPath(); g.ellipse(540, 1250, 520, 240, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    const taps = [S.Le('d5') - 1.9, S.Le('d5') - 1.5, S.Le('d5') - 1.1].map(x => Math.max(0.3, x));
    const up = taps.some(x => lt > x - 0.15 && lt < x) ? 1 : 0;
    g.save(); g.translate(560, 1010 - up * 50);
    fillRR(g, -90, -60, 180, 120, 50, C.skin); for (let i = 0; i < 4; i++) fillRR(g, -80 + i * 42, -100, 36, 70, 18, C.skin); line(g, -60, 20, 50, -10, 6, '#2a2a3a'); line(g, -40, 40, 60, 10, 4, '#2a2a3a');
    fillRR(g, -110, 40, 220, 400, 60, '#141519'); g.restore();
    taps.forEach((x, i) => sfxText(g, 'コン', 300 + i * 240, 700 - i * 40, { size: 90, alpha: inv(x, x + 0.05, lt) * (1 - inv(x + 0.6, x + 0.9, lt)), color: '#f4f1ea', rot: -0.1 + i * 0.1 }));
  } },
  { at: 'd6', draw(g, lt, D, S) {
    panels(g, [
      { x: 40, y: 160, w: 1000, h: 520, draw(p, w, h) { vgrad(p, 0, 0, w, h, [[0, '#0b0c12'], [1, '#05060a']]); p.save(); p.translate(w / 2 + noise1(lt * 40, 1) * 6, h / 2 + noise1(lt * 40, 2) * 4); fillRR(p, -150, -90, 300, 180, 70, C.skin); for (let i = 0; i < 4; i++) fillRR(p, -130 + i * 68, -150, 56, 110, 28, C.skin); line(p, -90, 30, 80, -20, 8, '#2a2a3a'); p.restore(); sfxText(p, 'ブルッ', w - 180, 110, { size: 70, color: '#f4f1ea', alpha: 1, rot: 0.1 }); } },
      { x: 40, y: 720, w: 1000, h: 420, alpha: inv(0.5, 0.7, lt), draw(p, w, h) { vgrad(p, 0, 0, w, h, [[0, '#0b0c12'], [1, '#05060a']]); close(p, P.yuuma, { x: w / 2, y: h * 0.85, s: 3.4, eyes: 'wide', look: -1, brow: -0.8, lightFrom: 'left' }); } },
    ]);
  } },
  // ── 検問
  { at: 'siren', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: 1.0, ...shake(lt, 6) }); carFront(g, { t: lt, red: 1, jin: { eyes: 'narrow', brow: 0.8 }, yuuma: { eyes: 'wide', brow: -1, gloves: true } }); g.restore();
    if (lt > S.L('e1')) { speedLines(g, 540, 800, { inner: 480, t: lt, color: 'rgba(255,60,80,.6)' }); sfxText(g, '検問', 540, 420, { size: 160, alpha: inv(S.L('e1'), S.L('e1') + 0.15, lt), shake: 5, t: lt }); }
  } },
  { at: 'e2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: lerp(1.0, 1.05, lt / D) }); checkpoint(g, { t: lt, lean: ease(clamp(lt / 0.6)) }); g.restore();
  } },
  { at: 'e3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: 1.05 }); carFront(g, { t: lt, red: 0.6, jin: { talk: talking(lt, S, ['e3']), eyes: 'narrow', look: 1, turn: 0.5, smile: 1 }, yuuma: { eyes: 'wide', brow: -1, gloves: true, look: 0.8, sweat: lt } }); g.restore();
  } },
  { at: 'e4', draw(g, lt, D, S) {
    bg(g, '#04050a', '#0a0b12');
    // 膝の上の手袋に懐中電灯
    fillRR(g, 100, 900, 880, 600, 120, P.yuuma.bottom);
    for (const x of [400, 680]) { fillRR(g, x - 90, 980, 180, 150, 70, '#18181d'); for (let i = 0; i < 4; i++) fillRR(g, x - 80 + i * 42, 940, 36, 90, 18, '#18181d'); }
    const sweep = lerp(-300, 0, easeOut(clamp(lt / 0.5)));
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(540 + sweep, 1050, 10, 540 + sweep, 1050, 420); gr.addColorStop(0, 'rgba(255,250,230,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 500, W, 1100); g.restore();
    sfxText(g, 'ドクン', 540, 500, { size: 140, alpha: inv(0.3, 0.45, lt) * (1 - inv(1.5, 1.9, lt)), shake: 8, t: lt });
    mood(g, { red: 0.12 });
  } },
  { at: 'e5', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: 1.05 }); checkpoint(g, { t: lt, lean: 1 - ease(inv(0.4, D, lt)), beam: 1 - inv(0.3, 1.0, lt) }); g.restore();
    mood(g, { dark: 0.2 * inv(0.5, D, lt) });
  } },
  // ── 母「ミクが2階見に行くって」
  { at: 'f1', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    chat(g, [{ t: -5, from: 'me', text: '2階に行くな', read: false }, { t: -4, from: 'me', text: '母さん？', read: false }, { t: 0, from: 'mom', text: 'ミクが、2階見に行くって' }], lt, { title: '母', y: 200, h: 900 });
  } },
  { at: 'f2', draw(g, lt, D, S) {
    const sh = shake(lt, lt < 0.6 ? 14 : 3);
    bg(g, '#0a0306', '#14060a');
    g.save(); cam(g, { x: 540, y: 820, z: 1.08, ...sh }); close(g, P.yuuma, { y: 780, s: 4.3, eyes: 'wide', brow: -1, mouth: 'open', talk: talking(lt, S, ['f2']), phoneLight: true }); g.restore();
    speedLines(g, 540, 760, { inner: 520, t: lt, color: 'rgba(255,60,80,.7)' });
    mood(g, { red: 0.15 });
  } },
  { at: 'f3', off: -0.2, draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    chat(g, [{ t: 0, from: 'karasu', img: sisterPhoto, h: 520 }, { t: 0.6, from: 'karasu', text: '来たら、何もせえへん' }], lt, { y: 200, h: 920 });
    mood(g, { red: 0.1 * inv(0.2, 1.0, lt) });
  } },
  { at: 'f4', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    const f5 = S.L('f5');
    if (lt < f5 - 0.1) chat(g, [{ t: 0.2, from: 'me', text: '先輩、助けてください', read: true }], lt, { title: 'タクミ先輩', y: 200, h: 900, typing: [0.9, 99] });
    else {
      chat(g, [{ t: f5 - 0.1, from: 'karasu', img: takumiPhoto, h: 500 }, { t: f5 + 0.4, from: 'karasu', text: 'タクミくんなら、ここにおるで' }], lt, { y: 200, h: 920 });
      if (lt < f5 + 0.15) { g.fillStyle = 'rgba(255,40,60,.35)'; g.fillRect(0, 0, W, H); }
    }
  } },
  { at: 'f6', draw(g, lt, D, S) {
    // 回想：笑う先輩に赤い×
    bg(g, '#1a1a1c', '#0e0e10');
    g.save(); g.translate(540, 760); g.rotate(-0.03); fillRR(g, -420, -420, 840, 840, 10, '#e9e4da'); g.save(); rr(g, -400, -400, 800, 800, 4); g.clip();
    vgrad(g, -400, -400, 800, 800, [[0, '#9a958a'], [1, '#6f6a60']]); close(g, P.takumi, { x: 0, y: 30, s: 3.2, mouth: 'smile', eyes: 'narrow', brow: 0.2 }); g.restore(); g.restore();
    text(g, 'ええバイトあるで', 540, 260, { size: 54, color: '#2a2530' });
    mood(g, { desat: 0.8 });
    const a = inv(S.L('f6') + 1.0, S.L('f6') + 1.3, lt); if (a > 0) { g.save(); g.globalAlpha = a; line(g, 200, 400, 880, 1120, 30, C.red); line(g, 880, 400, 200, 1120, 30, C.red); g.restore(); }
  } },
  // ── 実家 20:58
  { at: 'g1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: lerp(1050, 900, ease(clamp(lt / D))), z: lerp(1.0, 1.15, ease(clamp(lt / D))) }); street(g, { lit2: 1, lit1: 0, t: lt }); g.restore();
    figure(g, P.yuuma, { x: 540, y: 1900, s: 2.0, turn: 0, arms: [10, 0, 10, 0], shadow: false, alpha: 0.95, gloves: true });
    mood(g, { desat: 0.2 });
  } },
  { at: 'g2', draw(g, lt, D, S) {
    const z = lerp(1.6, 2.4, ease(clamp(lt / D)));
    g.save(); cam(g, { x: 540 - 200, y: 1500 - 330 - 300 + 75, z }); street(g, { lit2: 1 + 0.15 * Math.sin(lt * 9), lit1: 0, t: lt }); g.restore();
    // カーテンに人影
    const a = inv(1.0, 1.6, lt); if (a > 0) { g.save(); g.globalAlpha = a * 0.75; ell(g, 560, 900, 60, 70, '#1a0f0a'); fillRR(g, 470, 950, 180, 500, 70, '#1a0f0a'); g.restore(); }
    mood(g, { red: 0.08 * a });
  } },
  { at: 'door', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    // ドアノブに手袋の手
    fillRR(g, 200, 200, 680, 1400, 8, '#2a201c'); fillRR(g, 230, 230, 620, 1340, 6, '#33271f');
    const turn = ease(inv(0.1, 0.4, lt));
    g.save(); g.translate(720, 900); g.rotate(turn * 0.5); fillRR(g, -20, -20, 200, 40, 20, '#b9a27a'); circ(g, 0, 0, 40, '#9a8462'); g.restore();
    g.save(); g.translate(760, 930 + turn * 20); fillRR(g, -60, -40, 160, 110, 50, '#18181d'); for (let i = 0; i < 4; i++) fillRR(g, -50 + i * 38, -90, 32, 70, 16, '#18181d'); g.restore();
    sfxText(g, 'カチャ', 460, 600, { size: 100, alpha: inv(0.35, 0.45, lt), color: '#f4f1ea', rot: -0.1 });
  } },
  { at: 'g3', draw(g, lt, D, S) {
    bg(g, '#030305', '#07080c');
    const op = easeOut(clamp(lt / 1.2));
    // ドアが内側へ開いて、中は真っ暗
    fillRR(g, 260, 260, 560, 1240, 6, '#000');
    g.save(); g.translate(260, 260); g.scale(1 - op * 0.75, 1); fillRR(g, 0, 0, 560, 1240, 6, '#2a201c'); g.restore();
    glow(g, 540, 300, 300, 'rgba(255,200,130,1)', 0.08 * op);
    mood(g, { desat: 0.3 });
  } },
  { at: 'g4', draw(g, lt, D, S) {
    g.save(); cam(g, { x: lerp(560, 860, ease(clamp(lt / 1.4))), y: 1380, z: lerp(1.3, 1.9, ease(clamp(lt / D))) }); genkan(g, { t: lt, light: 1 }); g.restore();
    const a = inv(1.2, 1.6, lt); if (a > 0) sfxText(g, '？', 760, 520, { size: 200, alpha: a, color: C.red, rot: 0.1 });
  } },
  { at: 'g5', draw(g, lt, D, S) {
    bg(g, '#030305', '#08090e');
    g.save(); cam(g, { x: 540, y: 820, z: lerp(1.0, 1.06, lt / D) }); close(g, P.yuuma, { y: 780, s: 4.1, eyes: 'wide', brow: -1, talk: talking(lt, S, ['g5']) * 0.3, phoneLight: true, turn: 0.3, look: 0.6 }); g.restore();
    // 耳にスマホ
    fillRR(g, 760, 600, 90, 200, 16, '#0e0f14'); glow(g, 805, 700, 240, 'rgba(170,200,255,1)', 0.3);
  } },
  { at: 'ring', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 900, z: lerp(1.0, 1.25, ease(clamp(lt / (D + 2)))) }); stairsUp(g, { t: lt, ring: 1 }); g.restore();
    sfxText(g, '♪', 760 + noise1(lt * 3, 1) * 20, 360, { size: 90, alpha: 0.8, color: '#cfe0ff', rot: 0.1 });
  } },
  { at: 'g6', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 700, z: lerp(1.25, 1.45, ease(clamp(lt / D))) }); stairsUp(g, { t: lt, ring: 1, shadow: inv(0.8, 1.4, lt) }); g.restore();
  } },
  { at: 'pickup', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 650, z: 1.5 }); stairsUp(g, { t: lt, ring: 0, shadow: 1 }); g.restore();
    if (lt > 0.1 && lt < 0.25) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H); }
    mood(g, { dark: 0.25 });
  } },
  { at: 'g7', finish: { vignette: 0.8 }, draw(g, lt, D, S) {
    bg(g, '#030305', '#07080c');
    const z = lerp(1.0, 1.35, ease(clamp(lt / D)));
    g.save(); cam(g, { x: 540, y: 760, z }); close(g, P.yuuma, { y: 780, s: 4.2, eyes: 'wide', brow: -1, mouth: 'open', phoneLight: true }); g.restore();
    speedLines(g, 540, 700, { inner: 560, t: lt, color: 'rgba(255,40,60,.65)' });
    mood(g, { red: 0.25 * inv(0.2, 1.2, lt) });
    if (lt > S.Le('g7') + 0.4) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  } },
  // ── エンドカード
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt, D, S) {
    bg(g, '#030305', '#08090e');
    const a = easeOut(inv(0.1, 0.5, lt));
    text(g, 'ホワイト案件', 540, 470, { size: 64, color: '#8a8f9c', font: SERIF, weight: 700, alpha: a, spacing: 4 });
    text(g, '第1話「次の現場」終', 540, 560, { size: 42, color: '#c9ccd6', alpha: a });
    const b = easeOut(inv(0.6, 1.1, lt));
    poly(g, [[300, 650], [780, 630], [782, 640], [302, 662]], rgba(C.red, b));
    text(g, '次回', 540, 730, { size: 40, color: C.red, alpha: b });
    text(g, '第2話　おかえり', 540, 840, { size: 96, color: '#f4f1ea', font: SERIF, weight: 700, alpha: b, spacing: 4 });
    const c = easeOut(inv(1.5, 2.0, lt));
    g.save(); g.globalAlpha = c; fillRR(g, 540 - 330, 960, 660, 90, 45, C.red); text(g, EPISODE.ask, 540, 1006, { size: 38, color: '#fff' }); g.restore();
    const d = easeOut(inv(2.2, 2.6, lt));
    text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f1ea', alpha: d, spacing: 8 });
    text(g, 'フォローして続きを待ってて', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
  } },
];

// タイマー：物語の時間を画面の時間に割り当てる（キー＝行ID、値＝残り秒）
const TIMER_KEYS = [['o6', 5400], ['b1', 5395], ['c1', 5160], ['d1', 3880], ['car', 3560], ['siren', 2620], ['f1', 2280], ['f4', 1610], ['g1', 120]];
function post(g, t, { at }) {
  const ks = TIMER_KEYS.map(([id, v]) => [at(id), v]);
  const start = ks[0][0], hide = [[at('title'), at('c1')], [at('end'), 999]];
  if (t < start + 0.6 || hide.some(([a, b]) => t >= a && t < b)) return;
  let v = ks[ks.length - 1][1];
  for (let i = 0; i < ks.length - 1; i++) if (t >= ks[i][0] && t < ks[i + 1][0]) { const [t0, v0] = ks[i], [t1, v1] = ks[i + 1]; const k = (t - t0) / (t1 - t0); v = v0 + (v1 - v0) * k; }
  if (t >= ks[ks.length - 1][0]) v = Math.max(0, ks[ks.length - 1][1] - (t - ks[ks.length - 1][0]) * 1.0);
  const a = Math.min(1, (t - start - 0.6) / 0.3);
  timer(g, v, { alpha: a, t });
}

const SFX = [
  { at: 'notif', type: 'notif', vol: 1.0 },
  { at: 'notif', type: 'subdrop', vol: 0.6 },
  { at: 'o2', off: -0.15, type: 'pop', vol: 0.6 },
  { at: 'o2', off: 0.4, type: 'stab', vol: 0.55 },
  { at: 'o3', off: -0.25, type: 'pop', vol: 0.6 },
  { at: 'o3', off: 0.6, type: 'riser', dur: 1.2, vol: 0.5 },
  { at: 'o4', off: -0.2, type: 'notif', vol: 0.55 },
  { at: 'o5', type: 'heartbeat', dur: 1.8, vol: 0.9 },
  { at: 'o5', type: 'hit', vol: 0.6 },
  { at: 'o6', type: 'notif', vol: 0.8 },
  { at: 'o6', off: 1.0, type: 'clock', dur: 3.0, rate: 1.0, vol: 0.8 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'title', type: 'glitch', dur: 0.35, vol: 0.6 },
  { at: 'b2', off: 0.2, type: 'boxopen', vol: 0.8 },
  { at: 'b2', off: 0.6, type: 'stab', vol: 0.5 },
  { at: 'b3', type: 'notif', vol: 0.6 },
  { at: 'b4', off: 0.9, type: 'shutter', vol: 0.9 },
  { at: 'c1', off: 0.4, type: 'pop', vol: 0.5 },
  { at: 'c1', off: 1.0, type: 'pop', vol: 0.5 },
  { at: 'c1', type: 'clock', dur: 5, rate: 1.0, vol: 0.5 },
  { at: 'c3', off: 0.6, type: 'dial', n: 2, vol: 0.7 },
  { at: 'cut110', type: 'glitch', dur: 0.3, vol: 0.8 },
  { at: 'cut110', off: 0.1, type: 'notif', vol: 1.0 },
  { at: 'c5', type: 'heartbeat', dur: 2.5, vol: 0.7 },
  { at: 'd1', type: 'announce', dur: 3, vol: 0.6 },
  { at: 'car', type: 'carstop', vol: 0.9 },
  { at: 'd3', type: 'engine', dur: 14, vol: 0.55 },
  { at: 'd5', off: 0, type: 'clock', dur: 2, rate: 0.9, vol: 0.3 },
  { at: 'd6', type: 'heartbeat', dur: 2, vol: 0.5 },
  { at: 'siren', type: 'siren', dur: 2.8, vol: 0.8 },
  { at: 'e1', type: 'stab', vol: 0.6 },
  { at: 'e4', type: 'heartbeat', dur: 2.6, vol: 1.0 },
  { at: 'e5', off: 0.6, type: 'engine', dur: 3, vol: 0.4 },
  { at: 'f1', type: 'notif', vol: 0.6 },
  { at: 'f2', type: 'hit', vol: 0.7 },
  { at: 'f3', off: -0.2, type: 'notif', vol: 0.8 },
  { at: 'f4', off: 0.2, type: 'pop', vol: 0.5 },
  { at: 'f5', off: -0.1, type: 'notif', vol: 0.9 },
  { at: 'f5', off: -0.1, type: 'stab', vol: 0.6 },
  { at: 'g1', type: 'clock', dur: 6, rate: 0.8, rate2: 0.35, vol: 0.7 },
  { at: 'g2', off: 1.0, type: 'subdrop', vol: 0.6 },
  { at: 'door', off: 0.35, type: 'unlock', vol: 0.9 },
  { at: 'g3', type: 'creak', vol: 0.8 },
  { at: 'g4', off: 1.2, type: 'stab', vol: 0.4 },
  { at: 'g5', off: 0.6, type: 'dial', n: 1, vol: 0.4 },
  { at: 'ring', type: 'ringtone', dur: 4.6, vol: 0.9 },
  { at: 'pickup', off: 0.1, type: 'pickup', vol: 0.9 },
  { at: 'g7', off: -0.05, type: 'riser', dur: 0.8, vol: 0.4 },
  { at: 'g7:end', off: 0.35, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'notif', vol: 0.7 },
];
const MUSIC = [
  { at: 'notif', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'b1', mood: 'flash' },
  { at: 'c1', mood: 'thriller' },
  { at: 'siren', mood: 'silence' },
  { at: 'f1', mood: 'thriller' },
  { at: 'g1', mood: 'suspense' },
  { at: 'ring', mood: 'silence' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.18 });
