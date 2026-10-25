// ホワイト案件 第1話「次の現場」— 映像・効果音・BGM（組み直し版：1場面1つのことを、ゆっくり見せる）
import { W, H, clamp, lerp, inv, ease, easeOut, back, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, cam, shake, text, FONT, SERIF } from '../../engine/core.js';
import { C, CAST2, figure, close, head, speedLines, sfxText, panels, mood, chat, subBand, toneRect, crowIcon } from '../../engine/noir.js';
import { street, house, station, carFront, truckBack, room1, rentNotice, jobPhone, vanScene, envelope, carePhoto, schoolPhoto, mapPhoto, housePhoto, altar } from '../../engine/noirsets.js';
import { runEpisode } from '../../engine/player.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

const P = CAST2;
const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
const bg = (g, a = '#06070c', b = '#0d1120') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
const slow = (lt, D, a = 1, b = 1.08) => lerp(a, b, ease(clamp(lt / Math.max(D, 0.1))));
// 免許証
function license(g, x, y, s) {
  g.save(); g.translate(x, y); g.rotate(-0.05); g.scale(s, s);
  fillRR(g, -300, -190, 600, 380, 24, '#dfe8e0'); fillRR(g, -300, -190, 600, 60, 24, '#5d8f6a'); g.fillStyle = '#5d8f6a'; g.fillRect(-300, -150, 600, 20);
  fillRR(g, 90, -100, 170, 220, 8, '#9aa3ad'); head(g, P.yuuma, 175, -10, 52, { eyes: 'dot' });
  text(g, '篠原 悠真', -110, -70, { size: 46, color: '#1a1d26', weight: 800 });
  for (let i = 0; i < 4; i++) fillRR(g, -270, -10 + i * 42, 320 - i * 40, 14, 6, '#a9b2a8');
  g.restore();
}
// 防犯カメラの画像
function cctv(g, w, h) {
  g.save(); g.scale(w / 1000, h / 700); g.filter = 'grayscale(1) contrast(1.3)'; g.save(); g.translate(0, -400); vanScene(g, { carry: 1 }); g.restore(); g.filter = 'none'; g.restore();
  g.save(); g.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
  g.font = '600 22px "Noto Sans CJK JP"'; g.fillStyle = '#fff'; g.fillText('CAM 02  10/22 17:41', 18, 34); circ(g, w - 30, 28, 9, '#ff2a40'); g.restore();
}
// 家の前（夜・1階は真っ暗・2階の窓だけ）
function homeNight(g, lt, { z = 1, y = 1050, yuuma = true, ring = 0, silhouette = 0 } = {}) {
  g.save(); cam(g, { x: 540, y, z }); street(g, { lit2: 1, lit1: 0, t: lt }); g.restore();
  if (ring > 0) { for (let i = 0; i < 2; i++) { const p = ((lt * 1.4 + i / 2) % 1); g.save(); g.globalAlpha = ring * (1 - p) * 0.7; g.lineWidth = 6; g.strokeStyle = '#cfe0ff'; g.beginPath(); g.arc(540 + (-200) * z, y - 110 * z + (1500 - 630 + 145 - y) * z, 80 + p * 200, 0, 7); g.stroke(); g.restore(); } }
  if (yuuma) figure(g, P.yuuma, { x: 860, y: 1960, s: 1.9, turn: -0.6, look: -1, lookY: -1, arms: [10, 0, 30, -100], shadow: false, gloves: true, brow: -1, phone: true });
}
const chip = (g, s, a) => { if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 70; fillRR(g, 540 - w / 2, 210, w, 80, 40, 'rgba(10,10,16,.85)'); g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.8); rr(g, 540 - w / 2, 210, w, 80, 40); g.stroke(); text(g, s, 540, 252, { size: 40, color: '#f1f3f8' }); g.restore(); };

// 表紙（プロフィールの一覧で読めるように、3:4の中央に大きく）
export function cover(g, lt = 9, epNo = 1, epTitle = '次の現場') {
  const k = easeOut(inv(0, 0.3, lt)), gl = lt < 0.35 ? noise1(lt * 60, 3) * 16 : 0;
  g.save(); cam(g, { x: 520, y: 1000, z: 1.25 }); street(g, { lit2: 1.2, lit1: 0 }); g.restore();
  vgrad(g, 0, 0, W, H, [[0, 'rgba(3,3,6,.9)'], [0.3, 'rgba(3,3,6,.45)'], [0.6, 'rgba(3,3,6,.35)'], [1, 'rgba(3,3,6,.9)']]);
  glow(g, 540, 820, 760, 'rgba(220,20,40,1)', 0.28 * k);
  g.save(); g.globalAlpha = k; close(g, P.yuuma, { y: 1560, s: 3.0, eyes: 'wide', brow: -1, mouth: 'open', phoneLight: true }); g.restore();
  vgrad(g, 0, 1250, W, 200, [[0, 'rgba(3,3,6,.6)'], [1, 'rgba(3,3,6,0)']]);
  g.save(); g.globalAlpha = k; fillRR(g, 190, 330, 700, 110, 34, 'rgba(24,26,36,.95)'); g.lineWidth = 4; g.strokeStyle = C.red; rr(g, 190, 330, 700, 110, 34); g.stroke(); crowIcon(g, 255, 385, 34);
  text(g, 'カラス：次の現場や', 315, 387, { size: 42, color: '#fff', align: 'left' }); g.restore();
  const ts = (gx, col) => { g.save(); g.font = `700 160px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.letterSpacing = '4px'; g.globalAlpha = k; g.lineWidth = 18; g.strokeStyle = '#05060a'; g.strokeText('ホワイト案件', gx, 600); g.fillStyle = col; g.fillText('ホワイト案件', gx, 600); g.restore(); };
  if (gl) ts(540 - gl, rgba('#ff2a40', 0.6));
  ts(540 + gl, '#f4f1ea');
  const b = easeOut(inv(0.15, 0.5, lt)), sc = lerp(1.3, 1, back(b));
  g.save(); g.translate(540, 870); g.scale(sc, sc); g.globalAlpha = b;
  g.font = `900 300px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 30; g.strokeStyle = '#05060a'; g.strokeText(`第${epNo}話`, 0, 0); g.fillStyle = C.red; g.fillText(`第${epNo}話`, 0, 0); g.restore();
  const c = easeOut(inv(0.35, 0.7, lt));
  g.save(); g.globalAlpha = c; fillRR(g, 540 - 320, 1060, 640, 116, 14, '#f4f1ea'); text(g, epTitle, 540, 1120, { size: 82, color: '#0a0a0e', weight: 800 });
  fillRR(g, 540 - 90, 1196, 180, 52, 26, C.red); text(g, '全5話', 540, 1223, { size: 32, color: '#fff', weight: 800, spacing: 6 }); g.restore();
}

const SHOTS = [
  // ── 1. 今夜、実家の前
  { at: 'open', draw(g, lt, D, S) {
    homeNight(g, lt, { z: slow(lt, S.L('a2'), 1.0, 1.05) });
    chat(g, [{ t: S.L('a1') - 0.15, from: 'karasu', text: '着いたな。中に入れ。' }], lt, { y: 330, h: 380, title: 'カラス' });
    mood(g, { desat: 0.15 });
  } },
  { at: 'a2', draw(g, lt, D, S) {
    const z = slow(lt, D + 3, 1.2, 1.5);
    g.save(); cam(g, { x: 560, y: 1000, z }); street(g, { lit2: 1, lit1: 0, t: lt }); g.restore();
  } },
  { at: 'a3', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0d18');
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.08) }); close(g, P.yuuma, { y: 760, s: 4.0, eyes: 'narrow', brow: -0.8, talk: 0, phoneLight: true, look: -0.3 }); g.restore();
    // 手袋の手を上げる
    g.save(); g.translate(820, 1180 - easeOut(clamp(lt / 0.8)) * 160); fillRR(g, -80, -60, 160, 120, 50, '#18181d'); for (let i = 0; i < 4; i++) fillRR(g, -70 + i * 36, -110, 30, 80, 15, '#18181d'); g.restore();
  } },
  { at: 'a4', draw(g, lt, D, S) {
    // 巻き戻し → 3日前
    const k = ease(clamp(lt / D));
    g.save(); cam(g, { x: 540, y: 1000, z: lerp(1.0, 0.85, k), r: -k * 0.08 }); street(g, { lit2: 1, lit1: 0 }); g.restore();
    for (let i = 0; i < 6; i++) { const R = rng(i + Math.floor(lt * 20)); g.fillStyle = `rgba(255,255,255,${0.05 + R() * 0.08})`; g.fillRect(0, R() * H, W, 4 + R() * 20); }
    mood(g, { desat: 0.6 * k });
    const a = inv(S.Le('a4') - 1.2, S.Le('a4') - 0.6, lt); if (a > 0) sfxText(g, '3日前', 540, 700, { size: 150, rot: -0.05, color: '#f4f1ea', alpha: a });
  } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt, D, S) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 2. ユウマの部屋
  { at: 'b1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D, 1.0, 1.05) }); room1(g, { t: lt });
    figure(g, P.yuuma, { x: 300, y: 1560, s: 1.3, turn: 0.4, arms: [20, -70, 30, -80], look: 0.4, lookY: 0.6, brow: -0.4 }); g.restore();
    g.save(); g.globalAlpha = inv(0.3, 0.7, lt); fillRR(g, 300, 330, 480, 150, 20, 'rgba(10,10,16,.85)'); text(g, '篠原ユウマ（21）', 540, 385, { size: 50, color: '#fff' }); text(g, '大学3年・一人暮らし', 540, 445, { size: 32, color: '#c9ccd6' }); g.restore();
  } },
  { at: 'b2', draw(g, lt, D, S) {
    bg(g, '#2a2420', '#17130f');
    // 机の上の家族写真
    g.save(); g.translate(540, 760); g.rotate(-0.03); fillRR(g, -380, -330, 760, 660, 14, '#5a4632'); fillRR(g, -350, -300, 700, 600, 6, '#d9cdb6');
    g.save(); rr(g, -350, -300, 700, 600, 6); g.clip(); vgrad(g, -350, -300, 700, 600, [[0, '#9ab0c4'], [1, '#c9b892']]);
    figure(g, P.mom, { x: -120, y: 420, s: 1.0, mouth: 'smile', eyes: 'narrow', arms: [10, 0, 40, -40], shadow: false });
    figure(g, P.miku, { x: 150, y: 420, s: 0.95, mouth: 'smile', arms: [-30, 0, 10, 0], shadow: false });
    g.restore(); g.restore();
    const a = inv(0.4, 0.8, lt); tag2(g, 'オカン（介護の夜勤）', 330, 1150, a); tag2(g, '妹・ミク（中3）', 740, 1150, inv(1.4, 1.8, lt));
  } },
  { at: 'b3', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.08) }); rentNotice(g, { t: lt, stamp: easeOut(inv(S.L('b3') + 1.0, S.L('b3') + 1.3, lt)) }); g.restore(); } },
  { at: 'b4', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D, 1.0, 1.06) }); jobPhone(g, { t: lt, tap: inv(S.L('b6'), S.L('b6') + 0.6, lt) }); g.restore(); } },

  // ── 3. 引越しの現場
  { at: 'van', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1100, z: slow(lt, D, 1.0, 1.05) }); vanScene(g, { t: lt, jin: { talk: talking(lt, S, ['c1']), eyes: 'narrow', look: 0.6 }, yuuma: { look: -0.6, mouth: 'line' } }); g.restore(); text(g, 'その日の夕方', 540, 250, { size: 40, color: '#f4f1ea', alpha: inv(0.2, 0.6, lt) * (1 - inv(2.6, 3.0, lt)) }); } },
  { at: 'c2', draw(g, lt, D, S) { g.save(); cam(g, { x: 600, y: 1150, z: slow(lt, D, 1.1, 1.15) }); vanScene(g, { t: lt, carry: 1, jin: { look: 0.8, eyes: 'narrow' }, yuuma: { walk: lt * 1.2, look: 0.2 } }); g.restore(); } },
  { at: 'c3', draw(g, lt, D, S) { envelope(g, { t: lt, k: easeOut(clamp(lt / 0.8)) }); } },
  { at: 'drop', draw(g, lt, D, S) {
    const op = easeOut(inv(0.15, 0.6, lt));
    g.save(); cam(g, { x: 540, y: 1100, z: lerp(1.2, 1.45, ease(clamp(lt / (D + 2)))), ...shake(lt, lt < 0.4 ? 10 : 0) }); truckBack(g, { open: op }); g.restore();
    if (lt > 0.5) speedLines(g, 540, 820, { inner: 440, t: lt, color: 'rgba(255,255,255,.55)' });
    if (lt > S.L('c5')) sfxText(g, '札束…!?', 540, 360, { size: 120, color: C.red, alpha: inv(S.Le('c5') - 0.8, S.Le('c5') - 0.5, lt), rot: -0.06 });
  } },
  { at: 'c6', draw(g, lt, D, S) {
    bg(g, '#0a0a0e', '#14141a'); glow(g, 300, 400, 600, 'rgba(255,170,110,1)', 0.12);
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.12) }); close(g, P.jin, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.8, talk: talking(lt, S, ['c6']) * 0.4, look: 0.3, lightFrom: 'left' }); g.restore();
    mood(g, { red: 0.08 * inv(0.5, 1.5, lt) });
  } },

  // ── 4. 帰り道
  { at: 'ping1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1050, z: 1.0 }); street(g, { lit2: 0, lit1: 0.3, t: lt }); g.restore();
    figure(g, P.yuuma, { x: 540, y: 1700, s: 1.6, arms: [10, 0, 30, -110], phone: true, look: 0, lookY: 1, walk: lt < S.L('d1') ? lt * 1.2 : null });
    text(g, 'その帰り道', 540, 250, { size: 40, color: '#f4f1ea', alpha: inv(0.1, 0.5, lt) * (1 - inv(2.5, 2.9, lt)) });
  } },
  { at: 'd2', off: -0.2, draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    chat(g, [{ t: 0, from: 'karasu', img: cctv, h: 440 }, { t: S.L('d2') + 0.05, from: 'karasu', text: 'お前が今日運んだんはな、年寄りから騙し取った金や' }, { t: S.L('d3'), from: 'karasu', text: 'もう共犯やで。逃げられへんで' }, { t: S.L('d4'), from: 'karasu', text: '免許証の写真、送ってこい。送らんかったら、警察行きやで' }], lt, { y: 330, h: 880 });
    mood(g, { red: 0.08 * inv(S.L('d3'), S.L('d3') + 1, lt) });
  } },
  { at: 'd5', draw(g, lt, D, S) {
    bg(g, '#141416', '#0a0a0c');
    fillRR(g, 120, 260, 840, 980, 40, '#050506'); license(g, 540, 720, 1.2);
    for (const [x, y, sx, sy] of [[180, 330, 1, 1], [900, 330, -1, 1], [180, 1110, 1, -1], [900, 1110, -1, -1]]) { line(g, x, y, x + sx * 60, y, 6, 'rgba(255,255,255,.8)'); line(g, x, y, x, y + sy * 60, 6, 'rgba(255,255,255,.8)'); }
    circ(g, 540, 1160, 46, '#f4f1ea'); circ(g, 540, 1160, 38, '#050506'); circ(g, 540, 1160, 32, '#f4f1ea');
    const fl = 1.2; if (lt > fl && lt < fl + 0.15) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 0, W, H); }
    if (lt > fl + 0.3) { g.save(); g.globalAlpha = inv(fl + 0.3, fl + 0.6, lt); fillRR(g, 330, 1260 - 120, 420, 80, 40, '#2f6bd8'); text(g, '送信しました', 540, 1180, { size: 36, color: '#fff' }); g.restore(); }
  } },
  { at: 'd6', draw(g, lt, D, S) {
    bg(g, '#030305', '#08090e');
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.yuuma, { y: 760, s: 4.0, eyes: 'closed', brow: -1, mouth: 'frown', phoneLight: true }); g.restore();
    mood(g, { desat: 0.5 });
  } },

  // ── 5. 3日後
  { at: 'e1', draw(g, lt, D, S) {
    bg(g, '#0b0d16', '#05060a');
    fillRR(g, 170, 300, 740, 900, 50, '#0d1019'); crowIcon(g, 540, 520, 90); text(g, 'カラス', 540, 660, { size: 50, color: '#fff' });
    const tap = inv(S.L('e1') + 0.6, S.L('e1') + 0.9, lt);
    fillRR(g, 290, 800, 500, 110, 55, tap > 0.5 ? '#7a1420' : C.red); text(g, tap > 0.5 ? 'ブロックしました' : 'ブロックする', 540, 856, { size: 44, color: '#fff' });
    if (tap > 0) { g.save(); g.globalAlpha = Math.sin(tap * Math.PI); circ(g, 600, 860, 60 * tap + 20, 'rgba(255,255,255,.4)'); g.restore(); }
  } },
  { at: 'days', draw(g, lt, D, S) { bg(g, '#030305', '#08090e'); sfxText(g, '3日後', 540, 860, { size: 150, rot: -0.04, color: '#f4f1ea', alpha: easeOut(clamp(lt / 0.3)) }); } },
  { at: 'e2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 700, y: 1100, z: slow(lt, D, 1.0, 1.06) }); room1(g, { t: lt, morning: 1 });
    figure(g, P.yuuma, { x: 760, y: 1520, s: 1.3, turn: -0.2, arms: [10, 0, 30, -110], phone: true, eyes: 'wide', look: 0.2, lookY: 1 }); g.restore();
    const a = easeOut(inv(S.L('e2') + 0.8, S.L('e2') + 1.1, lt)); g.save(); g.translate(0, (1 - a) * -200); g.globalAlpha = a; fillRR(g, 90, 300, 900, 150, 40, 'rgba(30,34,48,.95)'); text(g, '080-XXXX-XXXX', 160, 350, { size: 34, color: '#9aa5bb', align: 'left' }); text(g, '写真が送信されました', 160, 405, { size: 44, color: '#fff', align: 'left' }); g.restore();
  } },
  { at: 'e3', off: -0.2, draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    chat(g, [{ t: 0, from: 'karasu', img: carePhoto, h: 560 }], lt, { y: 330, h: 880, title: '080-XXXX-XXXX' });
  } },
  { at: 'e4', off: -0.2, draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    chat(g, [{ t: -9, from: 'karasu', img: carePhoto, h: 300 }, { t: 0, from: 'karasu', img: schoolPhoto, h: 440 }, { t: S.L('e4') + 0.1, from: 'karasu', text: 'ミクちゃん、中3やな。かわいい妹やんけ' }, { t: S.L('e5'), from: 'karasu', text: 'ブロックして、逃げれると思たんか' }], lt, { y: 330, h: 880, title: '080-XXXX-XXXX' });
    mood(g, { red: 0.1 * inv(S.L('e5'), S.L('e5') + 1, lt) });
  } },
  { at: 'e6', off: -0.2, draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    chat(g, [{ t: -9, from: 'karasu', text: 'ブロックして、逃げれると思たんか' }, { t: 0.15, from: 'karasu', text: '次の仕事や。今夜、この家の金庫の中身を持ってこい' }, { t: S.L('e6') + 1.6, from: 'karasu', img: mapPhoto, h: 440 }, { t: S.L('e7'), from: 'karasu', text: '番号は、お前が知っとるやろ' }], lt, { y: 330, h: 880, title: '080-XXXX-XXXX' });
  } },
  { at: 'e8', draw(g, lt, D, S) {
    panels(g, [
      { x: 40, y: 200, w: 1000, h: 560, draw(p, w, h) { p.save(); p.translate(0, -80); mapPhoto(p, w, h * 1.25, lt); p.restore(); } },
      { x: 40, y: 800, w: 1000, h: 380, alpha: inv(0.4, 0.6, lt), draw(p, w, h) { vgrad(p, 0, 0, w, h, [[0, '#2a2e3a'], [1, '#14161e']]); close(p, P.yuuma, { x: w / 2, y: h * 0.55, s: 2.4, eyes: 'wide', brow: -1, mouth: 'open', lightFrom: 'left' }); } },
    ]);
    if (lt > 0.6) speedLines(g, 540, 990, { inner: 380, t: lt, color: 'rgba(255,60,80,.35)' });
  } },
  { at: 'e9', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: lerp(700, 1150, ease(clamp(lt / D))), z: 1.1 }); altar(g, { t: lt }); g.restore(); mood(g, { desat: 0.25 }); } },

  // ── 6. ジンの車
  { at: 'car', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); carFront(g, { t: lt, jin: { eyes: 'narrow', look: 0.2 }, yuuma: { look: -0.4, brow: -0.6, gloves: true } }); g.restore(); text(g, 'その夜', 540, 250, { size: 40, color: '#f4f1ea', alpha: inv(0.1, 0.5, lt) * (1 - inv(3.2, 3.6, lt)) }); } },
  { at: 'f2', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    for (let i = 0; i < 3; i++) { const p = ((lt * 0.4 + i / 3) % 1); g.save(); g.globalAlpha = Math.sin(p * Math.PI) * 0.22; g.fillStyle = 'rgba(255,190,110,1)'; g.fillRect(0, lerp(-200, 2100, p), W, 160); g.restore(); }
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.jin, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.4, talk: talking(lt, S, ['f2', 'f3']) * 0.5, look: 0.2, lightFrom: 'right', turn: 0.2 }); g.restore();
  } },
  { at: 'f4', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    g.lineWidth = 70; g.strokeStyle = '#0d0e14'; g.beginPath(); g.ellipse(540, 1250, 520, 240, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    const t0 = S.L('f4') + 1.2, taps = [t0, t0 + 0.4, t0 + 0.8];
    const up = taps.some(x => lt > x - 0.15 && lt < x) ? 1 : 0;
    g.save(); g.translate(560, 1010 - up * 50); fillRR(g, -90, -60, 180, 120, 50, C.skin); for (let i = 0; i < 4; i++) fillRR(g, -80 + i * 42, -100, 36, 70, 18, C.skin); line(g, -60, 20, 50, -10, 6, '#2a2a3a'); fillRR(g, -110, 40, 220, 400, 60, '#141519'); g.restore();
    taps.forEach((x, i) => sfxText(g, 'コン', 300 + i * 240, 700 - i * 40, { size: 90, alpha: inv(x, x + 0.05, lt) * (1 - inv(x + 0.8, x + 1.1, lt)), color: '#f4f1ea', rot: -0.1 + i * 0.1 }));
  } },
  { at: 'f5', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D + 1.3, 1.0, 1.1) }); carFront(g, { t: lt, jin: { eyes: 'narrow', look: 0, brow: 0.2 }, yuuma: { look: -1, brow: -0.6, gloves: true, talk: talking(lt, S, ['f5']) * 0.5 } }); g.restore(); } },
  { at: 'silent', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.05, 1.15) }); close(g, P.jin, { y: 760, s: 4.0, eyes: 'narrow', brow: 0, mouth: 'line', look: 0.6, lightFrom: 'right', turn: 0.4 }); g.restore();
    sfxText(g, '……', 820, 360, { size: 100, color: '#f4f1ea', alpha: inv(0.3, 0.6, lt), rot: 0 });
  } },

  // ── 7. 実家の前に戻る
  { at: 'g1', draw(g, lt, D, S) { homeNight(g, lt, { z: slow(lt, D, 1.0, 1.04) }); mood(g, { desat: 0.15 }); } },
  { at: 'g2', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0d18');
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.08) }); close(g, P.yuuma, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.8, mouth: 'grit', phoneLight: true }); g.restore();
  } },
  { at: 'g3', draw(g, lt, D, S) {
    bg(g, '#030305', '#08090e');
    g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D, 1.0, 1.04) }); close(g, P.yuuma, { y: 780, s: 4.0, eyes: 'wide', brow: -0.6, phoneLight: true, turn: 0.3, look: 0.6 }); g.restore();
    fillRR(g, 760, 600, 90, 200, 16, '#0e0f14'); glow(g, 805, 700, 240, 'rgba(170,200,255,1)', 0.3);
  } },
  { at: 'ring', draw(g, lt, D, S) { homeNight(g, lt, { z: slow(lt, D + 3, 1.0, 1.25), y: lerp(1050, 950, ease(clamp(lt / (D + 3)))), ring: 1 }); } },
  { at: 'g5', draw(g, lt, D, S) {
    const z = slow(lt, D, 1.6, 2.1);
    g.save(); cam(g, { x: 540 - 200, y: 1500 - 330 - 300 + 75, z }); street(g, { lit2: 1, lit1: 0, t: lt }); g.restore();
    for (let i = 0; i < 2; i++) { const p = ((lt * 1.4 + i / 2) % 1); g.save(); g.globalAlpha = (1 - p) * 0.7; g.lineWidth = 6; g.strokeStyle = '#cfe0ff'; g.beginPath(); g.arc(540, 960, 160 + p * 300, 0, 7); g.stroke(); g.restore(); }
  } },
  { at: 'pickup', draw(g, lt, D, S) {
    const z = 2.1;
    g.save(); cam(g, { x: 540 - 200, y: 1500 - 330 - 300 + 75, z }); street(g, { lit2: 1, lit1: 0, t: lt }); g.restore();
    // 窓に、電話を耳に当てた人影
    const a = easeOut(inv(0.2, 0.8, lt));
    g.save(); g.globalAlpha = a * 0.85; ell(g, 560, 860, 70, 84, '#140c08'); fillRR(g, 450, 920, 220, 600, 80, '#140c08'); fillRR(g, 610, 800, 40, 110, 14, '#140c08'); g.restore();
  } },
  { at: 'g6', finish: { vignette: 0.75 }, draw(g, lt, D, S) {
    const z = lerp(2.1, 2.5, ease(clamp(lt / D)));
    g.save(); cam(g, { x: 540 - 200, y: 1500 - 330 - 300 + 75, z }); street(g, { lit2: 1, lit1: 0, t: lt }); g.restore();
    g.save(); g.globalAlpha = 0.9; ell(g, 560, 860, 70 * z / 2.1, 84 * z / 2.1, '#140c08'); fillRR(g, 450, 920, 220, 600, 80, '#140c08'); fillRR(g, 610, 800, 40, 110, 14, '#140c08'); g.restore();
    mood(g, { red: 0.2 * inv(0.3, 1.5, lt) });
  } },
  { at: 'g7', finish: { vignette: 0.8 }, draw(g, lt, D, S) {
    bg(g, '#030305', '#07080c');
    g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D, 1.0, 1.3) }); close(g, P.yuuma, { y: 780, s: 4.2, eyes: 'wide', brow: -1, mouth: 'open', phoneLight: true }); g.restore();
    speedLines(g, 540, 700, { inner: 560, t: lt, color: 'rgba(255,40,60,.6)' });
    mood(g, { red: 0.22 });
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
function tag2(g, s, x, y, a) { if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 38px ${FONT}`; const w = g.measureText(s).width + 50; fillRR(g, x - w / 2, y - 34, w, 68, 34, 'rgba(10,10,16,.85)'); text(g, s, x, y, { size: 38, color: '#fff' }); g.restore(); }

// 場面の見出し（いつ・どこ）
const HEADS = [['open', '今夜　実家の前', 2.6], ['b1', '3日前', 2.4], ['e2', '3日後の朝', 2.2], ['g1', 'そして、今', 2.2]];
function post(g, t, { at }) { for (const [id, s, d] of HEADS) { const t0 = at(id); chip(g, s, Math.min(inv(t0, t0 + 0.3, t), 1 - inv(t0 + d, t0 + d + 0.4, t))); } }

const SFX = [
  { at: 'open', type: 'notif', vol: 0.9 },
  { at: 'open', type: 'subdrop', vol: 0.5 },
  { at: 'a3', off: 0.2, type: 'heartbeat', dur: 3.0, vol: 0.6 },
  { at: 'a4', type: 'riser', dur: 1.2, vol: 0.4 },
  { at: 'a4', off: 0.3, type: 'glitch', dur: 0.4, vol: 0.4 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'b3', off: 1.0, type: 'stamp', vol: 0.8 },
  { at: 'b6', type: 'pop', vol: 0.6 },
  { at: 'van', type: 'carstop', vol: 0.6 },
  { at: 'c2', type: 'steps', dur: 2.0, vol: 0.4 },
  { at: 'drop', type: 'boxopen', vol: 1.0 },
  { at: 'drop', off: 0.5, type: 'stab', vol: 0.6 },
  { at: 'c6', type: 'subdrop', vol: 0.6 },
  { at: 'ping1', off: 0.3, type: 'notif', vol: 0.9 },
  { at: 'd2', off: -0.2, type: 'pop', vol: 0.5 },
  { at: 'd3', type: 'pop', vol: 0.5 },
  { at: 'd4', type: 'pop', vol: 0.5 },
  { at: 'd5', off: 1.2, type: 'shutter', vol: 0.9 },
  { at: 'd5', off: 1.5, type: 'pop', vol: 0.5 },
  { at: 'e1', off: 0.7, type: 'pop', vol: 0.6 },
  { at: 'days', type: 'riser', dur: 0.8, vol: 0.4 },
  { at: 'e2', off: 0.8, type: 'notif', vol: 0.9 },
  { at: 'e3', off: -0.2, type: 'pop', vol: 0.5 },
  { at: 'e4', off: -0.2, type: 'pop', vol: 0.5 },
  { at: 'e5', type: 'pop', vol: 0.5 },
  { at: 'e6', type: 'pop', vol: 0.5 },
  { at: 'e7', type: 'pop', vol: 0.5 },
  { at: 'e8', type: 'stab', vol: 0.7 },
  { at: 'e8', type: 'heartbeat', dur: 3.0, vol: 0.6 },
  { at: 'car', type: 'engine', dur: 22, vol: 0.45 },
  { at: 'f4', off: 1.2, type: 'tap3', vol: 0.9 },
  { at: 'silent', type: 'heartbeat', dur: 1.3, vol: 0.4 },
  { at: 'g3', off: 0.5, type: 'dial', n: 1, vol: 0.5 },
  { at: 'ring', type: 'ringtone', dur: 4.8, vol: 0.9 },
  { at: 'pickup', off: 0.15, type: 'pickup', vol: 0.9 },
  { at: 'g6', off: -0.05, type: 'riser', dur: 0.8, vol: 0.3 },
  { at: 'g7', type: 'stab', vol: 0.7 },
  { at: 'g7:end', off: 0.4, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'notif', vol: 0.6 },
];
const MUSIC = [
  { at: 'open', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'b1', mood: 'flash' },
  { at: 'drop', mood: 'silence' },
  { at: 'ping1', mood: 'suspense' },
  { at: 'e1', mood: 'silence' },
  { at: 'e2', mood: 'dread' },
  { at: 'car', mood: 'thriller' },
  { at: 'silent', mood: 'silence' },
  { at: 'g1', mood: 'suspense' },
  { at: 'ring', mood: 'silence' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
