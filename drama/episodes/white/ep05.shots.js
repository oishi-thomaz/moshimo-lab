// ホワイト案件 第5話（最終話）「白と黒」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT, SERIF } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, panels, mood, subBand, crowIcon, chat } from '../../engine/noir.js';
import { nightSky, vanScene } from '../../engine/noirsets.js';
import { recPhone, careFront, pocketMoney, parkingLot, openHands, dawnWalk, otherRoom, lockScreen } from '../../engine/noirsets2.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep05.script.js';

const P = CAST2;
const dawnBg = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a3046'], [1, '#1a1420']]); glow(g, 540, 200, 700, 'rgba(255,200,170,1)', 0.25); };
const face = (g, who, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P[who], { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'right', ...o }); g.restore(); };
// 施設の前の4人（坂口は母の肩に手）
function standoff(g, lt, S, o = {}) {
  g.save(); cam(g, { x: 540, y: 1150, z: o.z ?? 1.15 }); careFront(g, { t: lt, dawn: o.dawn ?? 0.45 });
  figure(g, P.mom, { x: 470, y: 1520, s: 0.85, arms: [10, 0, 10, 0], eyes: 'wide', brow: -0.5, look: -0.2, ...(o.mom || {}) });
  if (!o.noSaka) figure(g, P.sakaguchi, { x: 640, y: 1515, s: 0.9, arms: [10, 0, 70, -80], eyes: 'narrow', mouth: 'line', brow: -0.3, look: -0.4, ...(o.saka || {}) });
  figure(g, P.miku, { x: 860, y: 1880, s: 1.25, turn: -0.4, look: -1, arms: [10, 0, 30, -90], phone: !!o.mikuPhone, brow: -0.5, ...(o.miku || {}) });
  figure(g, P.yuuma, { x: 230, y: 1900, s: 1.55, turn: 0.6, look: 1, arms: [10, 0, 10, 0], brow: -0.5, ...(o.yuuma || {}) });
  g.restore();
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 5, title: '白と黒',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1100, z: 1.1 }); careFront(g2, { dawn: 0.4 }); g2.restore(); },
    face: g2 => close(g2, P.yuuma, { y: 1560, s: 3.0, eyes: 'narrow', brow: -0.8, mouth: 'line', lightFrom: 'right' }),
    pill: { icon: '母', text: 'お母さんの目、見て言うて' },
  });
}

const SHOTS = [
  // ── 前回のあらすじ
  { at: 'recap', draw(g, lt, D, S) { standoff(g, lt, S, { z: lerp(1.1, 1.18, clamp(lt / D)) }); mood(g, { desat: 0.4 }); } },
  { at: 'r2', finish: { vignette: 0.6 }, draw(g, lt, D, S) {
    const sw = S.L('r2') + (S.Le('r2') - S.L('r2')) * 0.42;
    if (lt < sw) { dawnBg(g); face(g, 'mom', lt, D, S, ['r2'], { eyes: 'wide', brow: -0.7, mouth: 'line' }); }
    else { pocketMoney(g, { t: lt, k: 1 }); mood(g, { red: 0.15 }); }
  } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt, D, S) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. 坂口の作り話
  { at: 'a0', draw(g, lt, D, S) { standoff(g, lt, S, { saka: { talk: talking(lt, S, ['a1']) * 0.4, brow: 0.4, eyes: 'narrow' } }); } },
  { at: 'a2', draw(g, lt, D, S) { dawnBg(g); face(g, 'sakaguchi', lt, D, S, ['a2'], { eyes: 'narrow', brow: 0.6, mouth: 'line', glint: 0.3 }); } },
  { at: 'a3', draw(g, lt, D, S) {
    const sw = S.L('a3') + (S.Le('a3') - S.L('a3')) * 0.3;
    if (lt < sw) { bg(g, '#14161c', '#0a0b0e'); face(g, 'yuuma', lt, D, S, [], { eyes: 'wide', brow: -0.8, mouth: 'grit' }); }
    else { g.save(); cam(g, { x: 560, y: 960, z: lerp(1.0, 1.15, ease(inv(sw, D, lt))) }); pocketMoney(g, { t: lt, k: 1 }); g.restore(); mood(g, { desat: 0.5 }); }
  } },
  { at: 'a4', draw(g, lt, D, S) { dawnBg(g); face(g, 'mom', lt, D, S, ['a4'], { eyes: 'narrow', brow: -0.8, mouth: 'line', z1: 1.12 }); } },

  // ── 2. 自分の罪
  { at: 'b1', draw(g, lt, D, S) { bg(g, '#1a1416', '#0c0a0b'); glow(g, 540, 200, 700, 'rgba(255,200,170,1)', 0.18); face(g, 'yuuma', lt, D, S, [], { eyes: 'narrow', brow: -0.9, mouth: 'line' }); } },
  { at: 'b2', draw(g, lt, D, S) {
    dawnBg(g);
    g.save(); g.globalAlpha = 0.35 * inv(S.L('b2') + 2.0, S.L('b2') + 2.6, lt); g.translate(540, 330); fillRR(g, -320, -200, 640, 400, 8, '#f4f1ea'); g.beginPath(); g.rect(-310, -190, 620, 380); g.clip(); g.translate(-310, -190); g.scale(620 / 1080, 380 / 1500); g.translate(0, -300); vanScene(g, { t: lt, carry: 1 }); g.restore();
    face(g, 'yuuma', lt, D, S, ['b2'], { eyes: 'narrow', brow: -0.5, mouth: 'line', z0: 1.04, z1: 1.1 });
    const y = 830 + ((lt * 50) % 140); g.save(); g.globalAlpha = inv(1.5, 2.0, lt) * 0.9; ell(g, 450, y, 11, 18, '#bfe0ff'); g.restore();
  } },
  { at: 'b3', draw(g, lt, D, S) { standoff(g, lt, S, { z: 1.2, yuuma: { arms: [10, 0, 100, -40], mouth: 'line', brow: -0.9, eyes: 'narrow' }, saka: { eyes: 'narrow', mouth: 'smile' } }); } },
  { at: 'b4', draw(g, lt, D, S) { dawnBg(g); face(g, 'sakaguchi', lt, D, S, ['b4'], { eyes: 'narrow', mouth: 'smile', glint: 0.5 }); } },

  // ── 3. 録音
  { at: 'c1', draw(g, lt, D, S) { dawnBg(g); face(g, 'miku', lt, D, S, ['c1'], { eyes: 'narrow', brow: -0.8, mouth: 'line', z0: 1.1, z1: 1.16 }); } },
  { at: 'c2', draw(g, lt, D, S) { bg(g, '#1a1420', '#0c0a10'); recPhone(g, 540, 820, 1.15, { t: lt, rec: 0, play: lt > S.L('c2') + 0.8 ? 1 : 0, sec: lt > S.L('c2') + 0.8 ? lt - S.L('c2') - 0.8 : 0 }); if (lt > S.L('c2') + 0.7 && lt < S.L('c2') + 1.0) circ(g, 540, 1070, 90, 'rgba(255,255,255,.35)'); } },
  { at: 'c3', finish: { vignette: 0.65 }, draw(g, lt, D, S) { bg(g, '#1a1420', '#0c0a10'); recPhone(g, 540, 820, 1.15, { t: lt, rec: 0, play: 1, sec: lt + 1.5 }); mood(g, { red: 0.15 }); } },
  { at: 'c4', draw(g, lt, D, S) { dawnBg(g); face(g, 'sakaguchi', lt, D, S, [], { eyes: lt < 0.8 ? 'narrow' : 'wide', mouth: lt < 0.8 ? 'smile' : 'line', brow: lt < 0.8 ? 0 : -0.3 }); } },
  { at: 'c5', finish: { vignette: 0.75 }, draw(g, lt, D, S) { bg(g, '#100608', '#050304'); face(g, 'sakaguchi', lt, D, S, ['c5'], { eyes: 'narrow', brow: -1, mouth: 'line', glint: 0.8, z1: 1.14 }); mood(g, { red: 0.28 }); } },
  { at: 'c6', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1150, z: 1.0 }); parkingLot(g, { t: lt, dawn: 0.45 }); g.restore();
    const k = easeOut(clamp(lt / D)); figure(g, P.sakaguchi, { x: lerp(100, 700, k), y: lerp(1900, 1520, k), s: lerp(1.4, 0.9, k), walk: lt * 2.2, turn: 0.6, arms: [40, -40, 60, -50], mouth: 'grit', brow: -1 });
  } },

  // ── 4. 赤い光
  { at: 'd1', draw(g, lt, D, S) {
    const s0 = S.L('siren');
    g.save(); cam(g, { x: 540, y: 1150, z: slow(lt, D, 1.0, 1.06) }); parkingLot(g, { t: lt, dawn: 0.45, car: easeOut(clamp(lt / 0.6)), siren: easeOut(inv(S.L('d1') + 2.2, S.L('d1') + 3.0, lt)), patrol: easeOut(inv(s0, s0 + 1.0, lt)) }); g.restore();
  } },
  { at: 'd2', draw(g, lt, D, S) {
    bg(g, '#0b0d16', '#05060a'); const rot = Math.sin(lt * 9) * 0.5 + 0.5; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 900, 300, 900, 'rgba(255,30,50,1)', 0.35 * rot); glow(g, 150, 380, 700, 'rgba(255,30,50,1)', 0.2 * (1 - rot)); g.restore();
    figure(g, P.officer, { x: 540, y: 1950, s: 1.9, arms: [10, 0, 40, -100], turn: 0.1, lightFrom: 'right', mouth: 'line', talk: talking(lt, S, ['d2']) * 0.4, eyes: 'narrow' });
  } },
  { at: 'd3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1300, z: 1.1 }); parkingLot(g, { t: lt, dawn: 0.5, siren: 0.6, patrol: 1 }); g.restore();
    const k = easeOut(inv(0.4, 1.6, lt)); figure(g, P.jin, { x: lerp(900, 760, k), y: 1880, s: 1.4, turn: -0.4, look: -0.6, arms: [10, 0, 10, 0], eyes: 'narrow', mouth: 'line', lightFrom: 'left' });
  } },
  { at: 'd4', draw(g, lt, D, S) { dawnBg(g); face(g, 'jin', lt, D, S, ['d4', 'd5'], { eyes: 'narrow', mouth: lt > S.L('d5') + 0.3 ? 'smile' : 'line', lightFrom: 'left', brow: 0.2 }); const rot = Math.sin(lt * 9) * 0.5 + 0.5; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 1000, 600, 600, 'rgba(255,30,50,1)', 0.18 * rot); g.restore(); } },

  // ── 5. ユウマの選択
  { at: 'e1', draw(g, lt, D, S) { openHands(g, { t: lt, dawn: 0.55 }); } },
  { at: 'e2', draw(g, lt, D, S) { dawnBg(g); face(g, 'yuuma', lt, D, S, [], { eyes: 'narrow', brow: -0.6, mouth: 'line', lookY: 0.8 }); } },
  { at: 'e3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1250, z: 1.1 }); parkingLot(g, { t: lt, dawn: 0.6, siren: 0.35, patrol: 1 }); g.restore();
    figure(g, P.officer, { x: 760, y: 1800, s: 1.25, turn: -0.4, look: -0.6, arms: [10, 0, 10, 0] });
    figure(g, P.yuuma, { x: 330, y: 1860, s: 1.35, turn: 0.5, look: 0.8, arms: [10, 0, 10, 0], eyes: 'narrow', brow: -0.4, talk: talking(lt, S, ['e3']) * 0.35 });
  } },
  { at: 'e4', draw(g, lt, D, S) { dawnBg(g); glow(g, 540, 300, 800, 'rgba(255,210,170,1)', 0.25); face(g, 'mom', lt, D, S, ['e4'], { eyes: 'closed', brow: -0.6, mouth: 'smile', z1: 1.1 }); const y = 840 + ((lt * 50) % 140); g.save(); g.globalAlpha = 0.9; ell(g, 440, y, 11, 18, '#bfe0ff'); ell(g, 640, y + 40, 11, 18, '#bfe0ff'); g.restore(); } },
  { at: 'e5', finish: { vignette: 0.45 }, draw(g, lt, D, S) { dawnWalk(g, { t: lt, k: ease(clamp(lt / (D + 1))) }); } },

  // ── 6. カラスは一羽じゃない
  { at: 'f1', draw(g, lt, D, S) {
    nightSky(g, { warm: 0.05 });
    const R = rng(11); for (let i = 0; i < 14; i++) { const x = 80 + R() * 920, y = 250 + R() * 850, r = 26 + R() * 40, t0 = i * 0.18; g.save(); g.globalAlpha = inv(t0, t0 + 0.3, lt) * 0.9; crowIcon(g, x + Math.sin(lt + i) * 8, y, r); g.restore(); }
    g.save(); g.globalAlpha = 1 - inv(0, 0.8, lt); crowIcon(g, 540, 700, 200); g.restore();
  } },
  { at: 'f2', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1100, z: slow(lt, D + 2, 1.0, 1.12) }); otherRoom(g, { t: lt, on: lt > S.L('f2') + 1.2 ? 1 : 0 }); g.restore(); } },
  { at: 'phone', draw(g, lt, D, S) {
    lockScreen(g, { t: lt, notifs: [{ t: 0.3, app: 'かんたん日払いバイト', title: '【ホワイト案件】日給10万', body: '即日払い・荷物を運ぶだけ' }, { t: S.L('x1') - 0.3, crow: true, app: 'メッセージ', title: 'カラス', body: '明日、空いてる？' }] });
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) {
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#030305'], [1, '#08090e']]);
    const a = easeOut(inv(0.1, 0.6, lt));
    text(g, 'ホワイト案件', 540, 560, { size: 110, color: '#f4f1ea', font: SERIF, weight: 700, alpha: a, spacing: 6 });
    text(g, '完', 540, 760, { size: 150, color: C.red, font: SERIF, weight: 700, alpha: easeOut(inv(0.6, 1.1, lt)) });
    text(g, 'この物語はフィクションです', 540, 960, { size: 32, color: '#8a8f9c', alpha: easeOut(inv(1.2, 1.6, lt)), weight: 500 });
    const d = easeOut(inv(1.8, 2.3, lt));
    text(g, SERIES.account, 540, 1180, { size: 56, color: '#f4f1ea', alpha: d, spacing: 8 });
    text(g, '次の作品も、フォローして待ってて', 540, 1250, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
  } },
];

const post = heads([['recap', '前回のあらすじ', 3.0], ['a0', '午前5時　介護施設の前', 2.4], ['f2', '同じ夜　どこかの部屋', 2.6]]);

const SFX = [
  { at: 'recap', type: 'wind', dur: 6, vol: 0.3 },
  { at: 'r2', off: 1.4, type: 'heartbeat', dur: 2.4, vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a0', type: 'wind', dur: 20, vol: 0.25 },
  { at: 'a3', off: 1.4, type: 'stab', vol: 0.5 },
  { at: 'b2', off: 0.3, type: 'heartbeat', dur: 3.0, vol: 0.4 },
  { at: 'b3', off: 1.5, type: 'hit', vol: 0.6 },
  { at: 'b4', off: 0.2, type: 'subdrop', vol: 0.4 },
  { at: 'c2', off: 0.75, type: 'pop', vol: 0.8 },
  { at: 'c3', off: -0.1, type: 'glitch', vol: 0.4 },
  { at: 'c4', off: 0.5, type: 'stinger', vol: 0.7 },
  { at: 'c5', type: 'subdrop', vol: 0.7 },
  { at: 'c6', type: 'steps', dur: 2.4, vol: 0.8 },
  { at: 'd1', off: 0.2, type: 'engine', dur: 3.5, vol: 0.7 },
  { at: 'siren', off: -0.6, type: 'siren', dur: 8, vol: 0.8 },
  { at: 'siren', type: 'carstop', vol: 0.8 },
  { at: 'd3', off: 0.2, type: 'creak', vol: 0.4 },
  { at: 'd3', off: 0.4, type: 'steps', dur: 1.2, vol: 0.5 },
  { at: 'e1', type: 'wind', dur: 8, vol: 0.25 },
  { at: 'f1', type: 'riser', dur: 2.4, vol: 0.35 },
  { at: 'phone', off: 0.3, type: 'vibrate', dur: 1.0, vol: 0.8 },
  { at: 'x1', off: -0.3, type: 'notif', vol: 0.8 },
  { at: 'x1:end', off: 0.6, type: 'impact', vol: 0.9 },
];
const MUSIC = [
  { at: 'recap', mood: 'uneasy' },
  { at: 'title', mood: 'silence' },
  { at: 'a0', mood: 'uneasy' },
  { at: 'b1', mood: 'calm' },
  { at: 'b4', mood: 'dread' },
  { at: 'c2', mood: 'silence' },
  { at: 'c4', mood: 'tension' },
  { at: 'd1', mood: 'thriller' },
  { at: 'e1', mood: 'calm' },
  { at: 'f1', mood: 'mystery' },
  { at: 'phone', mood: 'silence' },
  { at: 'end', off: 0.6, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
