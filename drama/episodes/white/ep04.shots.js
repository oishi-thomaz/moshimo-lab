// ホワイト案件 第4話「相棒」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, panels, mood, subBand, crowIcon, chat } from '../../engine/noir.js';
import { stairsUp, stairsDown, living, carFront, carePhoto } from '../../engine/noirsets.js';
import { bills, doorInside, lockTurn, tableKnock, mikuRoom, recPhone, roofEscape, runStreet, park, careFront, pocketMoney } from '../../engine/noirsets2.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep04.script.js';

const P = CAST2;
const warm = g => vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2226'], [1, '#141014']]);
const face = (g, who, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P[who], { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'left', ...o }); g.restore(); };
// 階段を上がっていく人影（背中）
function climber(g, k) {
  const y = lerp(1500, 700, k), s = lerp(1.3, 0.6, k);
  g.save(); g.translate(540, y); g.scale(s, s); g.globalAlpha = 0.95;
  fillRR(g, -80, -360, 160, 260, 60, '#0c0a0d'); fillRR(g, -60, -110, 50, 130, 14, '#0c0a0d'); fillRR(g, 10, -110 - Math.sin(k * 30) * 20, 50, 130, 14, '#0c0a0d'); circ(g, 0, -420, 58, '#0c0a0d');
  g.restore();
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 4, title: '相棒',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1100, z: 1.1 }); living(g2, { dim: 0.6 }); g2.restore(); },
    face: g2 => close(g2, P.jin, { y: 1560, s: 3.0, eyes: 'narrow', mouth: 'line', lightFrom: 'right', brow: -0.3 }),
    pill: { icon: '？', text: '3回叩いたら、逃げろ' },
  });
}

const SHOTS = [
  // ── 前回のあらすじ
  { at: 'recap', draw(g, lt, D, S) {
    if (lt < D * 0.55) { g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); doorInside(g, { t: lt, open: 0.15 }); figure(g, P.jin, { x: 540, y: 1640, s: 1.6, arms: [10, 0, 10, 0], eyes: 'narrow', mouth: 'line', lightFrom: 'right' }); g.restore(); }
    else lockTurn(g, { t: lt, k: easeOut(inv(D * 0.6, D * 0.85, lt)) });
    mood(g, { desat: 0.4 });
  } },
  { at: 'r2', finish: { vignette: 0.7 }, draw(g, lt, D, S) { bg(g, '#0e0a0c', '#050405'); face(g, 'jin', lt, D, S, ['r2'], { eyes: 'narrow', mouth: 'line', lightFrom: 'right', z1: 1.12 }); mood(g, { red: 0.18 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt, D, S) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. 運ばれる前に
  { at: 'a0', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 560, y: 1150, z: slow(lt, D + 2, 1.0, 1.05) }); living(g, { t: lt, dim: 0.3 });
    figure(g, P.sakaguchi, { x: 280, y: 1600, s: 1.2, turn: 0.5, look: 1, arms: [10, 0, 50, -40], eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['a1']) * 0.4, lightFrom: 'left' });
    g.save(); g.translate(250, 1250); fillRR(g, -90, -60, 180, 150, 20, '#14161c'); bills(g, 0, -60, 0.4, 0.1); g.restore();
    figure(g, P.jin, { x: 640, y: 1610, s: 1.2, turn: -0.2, arms: [10, 0, 10, 0], eyes: 'narrow', mouth: 'line', talk: talking(lt, S, ['a2']) * 0.4 });
    figure(g, P.yuuma, { x: 880, y: 1600, s: 1.1, turn: -0.4, look: -1, arms: [10, 0, 10, 0], eyes: 'wide', brow: -0.7 }); g.restore();
  } },
  { at: 'a3', draw(g, lt, D, S) {
    // 腕をつかむジンの手（震えている）
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1416'], [1, '#0c0a0b']]);
    g.save(); g.translate(0, 0); g.rotate(-0.15); fillRR(g, -200, 620, 1500, 330, 150, P.yuuma.top2); g.restore();
    const sh = lt > S.L('a3') + 1.6 ? 7 : 1.5, dx = noise1(lt * 30, 1) * sh, dy = noise1(lt * 30, 2) * sh;
    g.save(); g.translate(560 + dx, 760 + dy);
    fillRR(g, 150, -120, 900, 260, 120, P.jin.top2);
    ell(g, 60, 0, 170, 140, C.skin); for (let i = 0; i < 4; i++) fillRR(g, -170 + i * 10, -110 + i * 62, 200, 54, 27, C.skin);
    line(g, 80, -40, 200, 10, 8, '#2a2a3a'); line(g, 100, 30, 210, 70, 8, '#2a2a3a');
    g.restore();
    if (lt > S.L('a3') + 1.6) sfxText(g, 'ブルッ', 820, 480, { size: 100, color: '#f4f1ea', rot: 0.1, shake: 5, t: lt });
  } },
  { at: 'a4', finish: { vignette: 0.7 }, draw(g, lt, D, S) { bg(g, '#100608', '#050304'); face(g, 'sakaguchi', lt, D, S, ['a4'], { eyes: 'narrow', mouth: 'smile', glint: 0.7, lightFrom: 'right', z1: 1.14 }); mood(g, { red: 0.22 * inv(0.5, D, lt) }); } },
  { at: 'a5', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.05, 1.15) }); stairsUp(g, { t: lt }); climber(g, ease(clamp(lt / (D + 0.3)))); g.restore(); text(g, 'ミクの部屋', 540, 220, { size: 40, color: '#f4f1ea', alpha: 0.8 }); } },

  // ── 2. 3回の合図
  { at: 'b1', draw(g, lt, D, S) {
    const k0 = S.L('knock'); let hit = 0;
    for (let i = 0; i < 3; i++) { const t0 = k0 + i * 0.55; const d = lt - t0; if (d > -0.18 && d < 0.18) hit = Math.max(hit, 1 - Math.abs(d) / 0.18); }
    if (lt < k0 - 0.2) hit = 0;
    g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.08) }); tableKnock(g, { t: lt, hit }); g.restore();
    for (let i = 0; i < 3; i++) { const t0 = k0 + i * 0.55; sfxText(g, 'コン', 260 + i * 280, 420 + i * 40, { size: 110, color: '#f4f1ea', alpha: inv(t0, t0 + 0.08, lt), rot: -0.1 + i * 0.1 }); }
  } },
  { at: 'b2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: 1.05 }); carFront(g, { t: lt, jin: { eyes: 'narrow', mouth: 'line' } }); g.restore(); mood(g, { desat: 0.8 });
    g.save(); g.globalAlpha = inv(0.6, 1.0, lt); fillRR(g, 140, 300, 800, 200, 30, 'rgba(10,10,16,.9)'); g.lineWidth = 4; g.strokeStyle = C.red; rr(g, 140, 300, 800, 200, 30); g.stroke();
    text(g, 'ヤバなったら、俺が3回叩く', 540, 370, { size: 46, color: '#fff' }); text(g, 'そしたら、何も考えんと逃げろ', 540, 440, { size: 40, color: '#c9ccd6' }); g.restore();
    text(g, '数時間前　ジンの車', 540, 230, { size: 34, color: '#8a8f9c' });
  } },
  { at: 'b3', draw(g, lt, D, S) { bg(g, '#0e0c10', '#060507'); face(g, 'jin', lt, D, S, ['b3'], { eyes: 'narrow', mouth: 'line', lightFrom: 'left', look: 0.6, z0: 1.15, z1: 1.22 }); } },
  { at: 'b4', draw(g, lt, D, S) { bg(g, '#14161c', '#0a0b0e'); face(g, 'yuuma', lt, D, S, ['b4'], { eyes: 'wide', brow: -0.5, mouth: 'line', look: -0.5 }); } },
  { at: 'b5', draw(g, lt, D, S) { bg(g, '#0e0c10', '#060507'); face(g, 'jin', lt, D, S, ['b5'], { eyes: 'narrow', brow: -0.6, mouth: 'line', lightFrom: 'left', lookY: 0.6, z1: 1.12 }); } },

  // ── 3. ジンの芝居
  { at: 'c1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); doorInside(g, { t: lt, open: easeOut(clamp(lt / 0.5)) });
    figure(g, P.jin, { x: 540, y: 1700, s: 1.7, turn: 0, arms: [60, -40, 60, -40], eyes: 'wide', mouth: 'open', talk: talking(lt, S, ['c2']) * 0.8, lightFrom: 'right' }); g.restore();
  } },
  { at: 'c2', draw(g, lt, D, S) { bg(g, '#16141a', '#08070a'); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,255,255,.4)' }); face(g, 'jin', lt, D, S, ['c2'], { eyes: 'wide', brow: 0.4, mouth: 'open' }); sfxText(g, '！', 880, 300, { size: 180, color: C.red }); } },
  { at: 'c3', draw(g, lt, D, S) {
    if (lt < D * 0.55) { g.save(); cam(g, { x: 540, y: 960, z: 1.0 }); stairsDown(g, { t: lt * 2, k: ease(clamp(lt / (D * 0.55))) * 0.9, P: P.sakaguchi, o: { eyes: 'wide', mouth: 'open', brow: 0.6 } }); g.restore(); }
    else { g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); doorInside(g, { t: lt, open: 1, porch: 0.8 }); g.restore(); const k = easeOut(inv(D * 0.55, D, lt)); figure(g, P.sakaguchi, { x: 540, y: lerp(1650, 1450, k), s: lerp(1.4, 0.7, k), walk: lt * 2, alpha: 1 - k * 0.6, arms: [40, -40, 40, -40] }); }
  } },
  { at: 'c4', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 700, z: lerp(1.0, 1.6, easeOut(clamp(lt / D))) }); stairsUp(g, { t: lt }); g.restore(); speedLines(g, 540, 600, { inner: 420, t: lt, color: 'rgba(255,255,255,.25)' }); } },

  // ── 4. 起きていたミク
  { at: 'd1', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D, 1.0, 1.08) }); mikuRoom(g, { t: lt }); g.restore(); } },
  { at: 'd2', draw(g, lt, D, S) { bg(g, '#0e1220', '#06070c'); face(g, 'miku', lt, D, S, ['d2'], { eyes: 'wide', brow: -0.6, mouth: 'line', phoneLight: true, lightFrom: 'right' }); } },
  { at: 'd3', draw(g, lt, D, S) { bg(g, '#06070c', '#0b0d16'); recPhone(g, 540, 800, 1.15, { t: lt, rec: 1, sec: 2843 + lt }); } },
  { at: 'd4', draw(g, lt, D, S) {
    bg(g, '#0e1220', '#06070c'); face(g, 'miku', lt, D, S, ['d4'], { eyes: 'narrow', brow: -0.8, mouth: 'line', phoneLight: true, lookY: 0.6 });
    // 床の下から声（波紋）
    for (let i = 0; i < 3; i++) { const p = ((lt * 0.6 + i / 3) % 1); g.save(); g.globalAlpha = (1 - p) * 0.35; g.lineWidth = 6; g.strokeStyle = C.red; g.beginPath(); g.ellipse(540, 1700, 200 + p * 500, 40 + p * 100, 0, 0, 7); g.stroke(); g.restore(); }
  } },
  { at: 'd5', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1050, z: slow(lt, D, 1.15, 1.25) }); roofEscape(g, { t: lt, k: clamp((lt - S.L('d5') - 0.8) / (D - 0.8)) }); g.restore(); } },

  // ── 5. 夜の住宅街
  { at: 'e1', draw(g, lt, D, S) { runStreet(g, { t: lt }); } },
  { at: 'e2', draw(g, lt, D, S) {
    const sw = S.L('e2') + (S.Le('e2') - S.L('e2')) * 0.5;
    if (lt < sw) runStreet(g, { t: lt + 3, lights: easeOut(clamp(lt / sw)) });
    else park(g, { t: lt, sweep: 1 });
  } },
  { at: 'e3', draw(g, lt, D, S) { park(g, { t: lt, sweep: 0 }); const v = noise1(lt * 60, 2) * 6; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 560 + v, 1180, 200, 'rgba(140,170,255,1)', 0.5); g.restore(); sfxText(g, 'ヴヴッ', 800, 760, { size: 90, color: '#f4f1ea', alpha: inv(0.1, 0.3, lt), rot: 0.1, shake: 4, t: lt }); } },
  { at: 'e4', draw(g, lt, D, S) { bg(g, '#05060a', '#0b0c12'); chat(g, [{ t: S.L('e4'), from: 'karasu', text: '逃げても無駄や。' }, { t: S.L('e4') + 1.6, from: 'karasu', text: 'お前の行くとこなんか、ひとつしかないやろ' }], lt, { y: 330, h: 720 }); } },
  { at: 'e5', draw(g, lt, D, S) {
    bg(g, '#101420', '#070910'); face(g, 'yuuma', lt, D, S, ['e5'], { eyes: 'narrow', brow: -0.9, mouth: 'line', lightFrom: 'right' });
    const a = inv(S.L('e5') + 1.2, S.L('e5') + 1.6, lt);
    g.save(); g.globalAlpha = a; g.translate(560, 330); g.rotate(0.04); fillRR(g, -310, -190, 620, 400, 8, '#f4f1ea'); g.save(); g.beginPath(); g.rect(-300, -180, 600, 380); g.clip(); g.translate(-300, -180); carePhoto(g, 600, 380); g.restore(); g.restore();
  } },

  // ── 6. 先回り
  { at: 'f1', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D, 1.0, 1.06) }); careFront(g, { t: lt, dawn: 0.3 }); g.restore(); } },
  { at: 'f2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1150, z: slow(lt, D + 4, 1.1, 1.2) }); careFront(g, { t: lt, dawn: 0.35 });
    figure(g, P.mom, { x: 540, y: 1520, s: 0.85, arms: [10, 0, 10, 0], eyes: 'wide', look: 0.3, brow: -0.3 });
    if (lt > S.L('f4') + 0.6) figure(g, P.sakaguchi, { x: lerp(560, 700, easeOut(inv(S.L('f4') + 0.6, S.L('f4') + 1.6, lt))), y: 1515, s: 0.9, arms: [10, 0, 10, 0], eyes: 'narrow', mouth: 'smile', alpha: inv(S.L('f4') + 0.6, S.L('f4') + 1.0, lt) });
    figure(g, P.yuuma, { x: 230, y: 1900, s: 1.6, turn: 0.6, look: 1, arms: [20, -30, 70, -60], mouth: lt > S.L('f3') && lt < S.Le('f3') ? 'open' : 'line', brow: -0.4 });
    g.restore();
    if (lt > S.L('f4') + 0.8) mood(g, { red: 0.15 * inv(S.L('f4') + 0.8, S.Le('f4'), lt) });
  } },
  { at: 'f5', draw(g, lt, D, S) {
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a3046'], [1, '#1a1420']]); glow(g, 540, 200, 700, 'rgba(255,200,170,1)', 0.25);
    face(g, 'sakaguchi', lt, D, S, ['f5'], { eyes: 'narrow', brow: -0.4, mouth: 'line', glint: 0.5, lightFrom: 'right' });
  } },
  { at: 'f6', finish: { vignette: 0.6 }, draw(g, lt, D, S) {
    const sw = S.L('f6') + (S.Le('f6') - S.L('f6')) * 0.42;
    if (lt < sw) { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a3046'], [1, '#1a1420']]); face(g, 'mom', lt, D, S, ['f6'], { eyes: 'wide', brow: -0.7, mouth: 'line', lightFrom: 'right' }); }
    else { g.save(); cam(g, { x: 560, y: 960, z: lerp(1.0, 1.2, easeOut(inv(sw, D, lt))) }); pocketMoney(g, { t: lt, k: 1 }); g.restore(); mood(g, { red: 0.2 * inv(sw, sw + 1, lt) }); }
    if (lt > S.Le('f6') + 0.6) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const post = heads([['recap', '前回のあらすじ', 3.0], ['a0', 'その夜　実家のリビング', 2.4], ['f1', '午前5時　オカンの職場', 2.6]]);

const SFX = [
  { at: 'recap', off: 0.2, type: 'steps', dur: 1.2, vol: 0.5 },
  { at: 'r2', off: -0.6, type: 'clunk', vol: 0.9 },
  { at: 'r2', type: 'stab', vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a0', type: 'roomtone', dur: 40, vol: 0.35 },
  { at: 'a1', off: 0.3, type: 'rustle', dur: 0.8, vol: 0.5 },
  { at: 'a3', type: 'heartbeat', dur: 3.0, vol: 0.5 },
  { at: 'a4', off: 0.8, type: 'subdrop', vol: 0.5 },
  { at: 'a5', type: 'creak', vol: 0.5 },
  { at: 'a5', off: 0.4, type: 'steps', dur: 2.6, vol: 0.5 },
  { at: 'knock', type: 'knock', vol: 1.0 },
  { at: 'knock', off: 0.55, type: 'knock', vol: 1.0 },
  { at: 'knock', off: 1.1, type: 'knock', vol: 1.0 },
  { at: 'b2', type: 'riser', dur: 1.6, vol: 0.3 },
  { at: 'b5', off: 0.6, type: 'stinger', vol: 0.4 },
  { at: 'c1', type: 'creak', vol: 0.7 },
  { at: 'c2', type: 'hit', vol: 0.6 },
  { at: 'c3', type: 'steps', dur: 2.4, vol: 0.8 },
  { at: 'c4', type: 'steps', dur: 1.6, vol: 0.7 },
  { at: 'd1', off: 0.2, type: 'creak', vol: 0.5 },
  { at: 'd3', off: 0.2, type: 'pop', vol: 0.5 },
  { at: 'd5', off: 0.8, type: 'steps', dur: 2.0, vol: 0.5 },
  { at: 'e1', type: 'steps', dur: 4.0, vol: 0.6 },
  { at: 'e1', type: 'heartbeat', dur: 4.0, vol: 0.4 },
  { at: 'e2', type: 'engine', dur: 4.0, vol: 0.6 },
  { at: 'e3', type: 'vibrate', dur: 1.6, vol: 0.9 },
  { at: 'e4', type: 'notif', vol: 0.7 },
  { at: 'e4', off: 1.6, type: 'notif', vol: 0.7 },
  { at: 'f1', type: 'wind', dur: 6, vol: 0.3 },
  { at: 'f3', off: -0.2, type: 'steps', dur: 1.2, vol: 0.6 },
  { at: 'f4', off: 0.6, type: 'stab', vol: 0.7 },
  { at: 'f6', off: 1.4, type: 'heartbeat', dur: 3.0, vol: 0.6 },
  { at: 'f6:end', off: 0.6, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'notif', vol: 0.6 },
];
const MUSIC = [
  { at: 'recap', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'a0', mood: 'dread' },
  { at: 'b1', mood: 'silence' },
  { at: 'b2', mood: 'mystery' },
  { at: 'c1', mood: 'thriller' },
  { at: 'd1', mood: 'uneasy' },
  { at: 'd5', mood: 'thriller' },
  { at: 'e3', mood: 'tension' },
  { at: 'f1', mood: 'calm' },
  { at: 'f4', mood: 'silence' },
  { at: 'f5', mood: 'dread' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
