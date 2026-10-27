// ホワイト案件 第3話「カラスの巣」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, panels, mood, subBand, crowIcon } from '../../engine/noir.js';
import { street, stairsUp, altar, living, buzzPhone, dinnerPhoto, carePhoto, vanScene } from '../../engine/noirsets.js';
import { bills, crowPhone, safeDial, safeOpen, handsMoney, pocketCall, doorInside, lockTurn, pocketMoney } from '../../engine/noirsets2.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep03.script.js';

const P = CAST2;
const warm = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2226'], [1, '#141014']]); };
const sakaClose = (g, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P.sakaguchi, { y: 760, s: 4.0, eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ids) * 0.5, lightFrom: 'left', ...o }); g.restore(); };
const yuuClose = (g, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.06) }); close(g, P.yuuma, { y: 760, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', talk: talking(lt, S, ids) * 0.4, lightFrom: 'left', ...o }); g.restore(); };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 3, title: 'カラスの巣',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1100, z: 1.1 }); living(g2, { dim: 0.6 }); g2.restore(); },
    face: g2 => close(g2, P.sakaguchi, { y: 1560, s: 3.0, eyes: 'narrow', mouth: 'smile', glint: 0.8, lightFrom: 'right' }),
    pill: { icon: 'crow', text: 'カラスはな、俺や' },
  });
}

const SHOTS = [
  // ── 前回のあらすじ
  { at: 'recap', draw(g, lt, D, S) { buzzPhone(g, { t: lt, on: 1, shown: 1, msg: '全部、警察に話す。\nもう、お前の言う\nことは聞かへん' }); mood(g, { desat: 0.4 }); } },
  { at: 'r2', finish: { vignette: 0.7 }, draw(g, lt, D, S) { bg(g, '#100608', '#050304'); sakaClose(g, lt, D, S, ['r2'], { glint: 0.8, lightFrom: 'right', z1: 1.15 }); mood(g, { red: 0.22 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt, D, S) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. カラスの正体
  { at: 'a0', draw(g, lt, D, S) {
    warm(g); glow(g, 300, 260, 600, 'rgba(255,200,140,1)', 0.2);
    g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D, 1.0, 1.05) }); close(g, P.sakaguchi, { y: 520, s: 3.0, eyes: 'narrow', mouth: 'smile', lightFrom: 'left' }); g.restore();
    const k = easeOut(inv(0.5, 1.6, lt));
    crowPhone(g, lerp(700, 300, k), lerp(1300, 900, k), 0.45, { rot: lerp(0.3, -0.06, k), msg: '全部、警察に話す。\nもう、お前の言う\nことは聞かへん', glowA: 0.25 });
  } },
  { at: 'a2', finish: { vignette: 0.75 }, draw(g, lt, D, S) {
    bg(g, '#120608', '#050304');
    g.save(); g.globalAlpha = 0.18 * inv(0.3, 1.2, lt); crowIcon(g, 540, 760, 620); g.restore();
    sakaClose(g, lt, D, S, ['a2'], { glint: 0.6 + 0.3 * Math.sin(lt * 2), z0: 1.05, z1: 1.18 });
    mood(g, { red: 0.25 * inv(S.L('a2') + 0.6, S.L('a2') + 1.2, lt) });
  } },
  { at: 'a3', draw(g, lt, D, S) {
    bg(g, '#14161c', '#0a0b0e'); speedLines(g, 540, 760, { inner: 460, t: lt, color: 'rgba(255,255,255,.35)' });
    yuuClose(g, lt, D, S, ['a3'], { sweat: lt * 2 });
    mood(g, { desat: 0.7 });
  } },
  { at: 'a4', draw(g, lt, D, S) {
    panels(g, [
      { x: 40, y: 300, w: 1000, h: 400, slide: easeOut(clamp(lt / 0.4)), from: 'left', draw(p, w, h) { dinnerPhoto(p, w, h, lt); } },
      { x: 40, y: 740, w: 1000, h: 400, alpha: inv(S.L('a4') + 1.2, S.L('a4') + 1.5, lt), slide: easeOut(inv(S.L('a4') + 1.2, S.L('a4') + 1.6, lt)), from: 'right', draw(p, w, h) { carePhoto(p, w, h); } },
    ]);
    sfxText(g, 'この家から', 780, 270, { size: 80, color: C.red, alpha: inv(S.L('a4') + 2.4, S.L('a4') + 2.7, lt), rot: -0.06 });
    mood(g, { red: 0.1 });
  } },

  // ── 2. なぜ息子にやらせたのか
  { at: 'b1', draw(g, lt, D, S) { bg(g, '#1a1416', '#0c0a0b'); yuuClose(g, lt, D, S, ['b1'], { eyes: 'narrow', brow: -1, mouth: 'grit' }); } },
  { at: 'b2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: lerp(900, 1150, ease(clamp(lt / D))), z: 1.05 }); altar(g, { t: lt }); g.restore();
    const a = inv(S.L('b2') + 0.3, S.L('b2') + 0.7, lt);
    g.save(); g.globalAlpha = a; fillRR(g, 300, 330, 480, 90, 45, 'rgba(10,10,16,.85)'); g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.8); rr(g, 300, 330, 480, 90, 45); g.stroke(); text(g, 'オトンの保険金', 540, 377, { size: 44, color: '#fff' }); g.restore();
  } },
  { at: 'b3', draw(g, lt, D, S) { warm(g); sakaClose(g, lt, D, S, ['b3'], { z1: 1.12, glint: inv(S.Le('b3') - 0.6, S.Le('b3'), lt) * 0.7 }); mood(g, { red: 0.12 * inv(0, D, lt) }); } },
  { at: 'b4', draw(g, lt, D, S) { bg(g, '#101218', '#08090c'); yuuClose(g, lt, D, S, ['b4'], { eyes: 'dot', brow: -0.8, sweat: lt * 2 }); mood(g, { desat: 0.5 }); } },

  // ── 3. 逃げ道をふさがれる
  { at: 'c1', draw(g, lt, D, S) {
    bg(g, '#0b0d16', '#05060a');
    g.save(); g.translate(540, 820); fillRR(g, -300, -560, 600, 1120, 60, '#0d0f14'); fillRR(g, -280, -540, 560, 1080, 46, '#14171f');
    const n = Math.min(3, Math.floor(clamp((lt - 0.6) / 1.4) * 3.99));
    text(g, '110'.slice(0, n) || ' ', 0, -380, { size: 110, color: '#f1f3f8', weight: 600 });
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];
    keys.forEach((k, i) => { if (!k) return; const x = (i % 3 - 1) * 170, y = -170 + Math.floor(i / 3) * 150; circ(g, x, y, 62, '#232836'); text(g, k, x, y + 2, { size: 54, color: '#f1f3f8', weight: 600 }); });
    circ(g, 0, 440, 70, '#2fbf5f'); g.restore();
    // 止まった指
    const fy = lerp(1500, 1300, easeOut(clamp(lt / 1.4))) + (lt > S.L('c1') + 2.2 ? noise1(lt * 20, 1) * 6 : 0);
    ell(g, 560, fy, 60, 110, C.skin, 0.2);
  } },
  { at: 'c2', draw(g, lt, D, S) {
    warm(g); g.save(); cam(g, { x: 540, y: 700, z: 1.0 }); close(g, P.sakaguchi, { y: 520, s: 3.0, eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['c2']) * 0.5, lightFrom: 'left' }); g.restore();
    const k = easeOut(inv(S.L('c2') + 1.2, S.L('c2') + 1.8, lt));
    g.save(); g.translate(lerp(760, 540, k), lerp(1500, 920, k)); g.rotate(lerp(0.3, -0.04, k));
    fillRR(g, -250, -300, 500, 600, 40, '#0d0e12'); g.save(); rr(g, -230, -280, 460, 560, 30); g.clip(); g.translate(-230, -280); g.scale(460 / 1080, 560 / 1300); g.translate(0, -400); vanScene(g, { t: lt, carry: 1 }); g.restore();
    fillRR(g, -230, 200, 460, 80, 0, 'rgba(0,0,0,.6)'); text(g, 'CAM 03　17:42', 0, 240, { size: 30, color: '#fff', weight: 600 });
    g.restore();
  } },
  { at: 'c3', draw(g, lt, D, S) { bg(g, '#100608', '#050304'); sakaClose(g, lt, D, S, ['c3'], { z1: 1.14, glint: 0.4 }); mood(g, { red: 0.2 * inv(S.L('c3') + 1.0, S.Le('c3'), lt) }); } },
  { at: 'c4', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D, 1.2, 1.4) }); stairsUp(g, { t: lt }); g.restore(); text(g, 'ミクの部屋', 540, 300, { size: 40, color: '#f4f1ea', alpha: inv(0.4, 0.8, lt) }); } },

  // ── 4. 金庫が開く
  { at: 'd1', draw(g, lt, D, S) {
    const tu = lt < S.L('dial') ? lt * 0.12 : 0.12 * S.L('dial') + Math.sin((lt - S.L('dial')) * 3) * 0.25;
    const op = easeOut(inv(S.L('dial') + 1.3, S.L('dial') + 1.9, lt));
    g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D, 1.0, 1.1) }); safeDial(g, { t: lt, turn: tu, open: op }); g.restore();
    if (lt > S.L('dial') + 1.4) sfxText(g, 'ガチャ', 800, 380, { size: 120, color: '#f4f1ea', rot: 0.08 });
  } },
  { at: 'd2', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D, 1.0, 1.08) }); safeOpen(g, { t: lt, open: easeOut(clamp(lt / 1.0)) }); g.restore(); if (lt > 0.8) speedLines(g, 540, 700, { inner: 560, t: lt, color: 'rgba(255,240,200,.25)' }); } },
  { at: 'd3', draw(g, lt, D, S) { warm(g); sakaClose(g, lt, D, S, ['d3', 'd4'], { look: 0.3, lookY: 0.4 }); } },
  { at: 'd4', draw(g, lt, D, S) { handsMoney(g, { t: lt, k: easeOut(inv(S.L('d4') + 1.5, S.Le('d4'), lt)) }); sfxText(g, '指紋', 820, 380, { size: 100, color: C.red, alpha: inv(S.L('d4') + 0.4, S.L('d4') + 0.7, lt), rot: 0.08 }); } },
  { at: 'd5', draw(g, lt, D, S) { handsMoney(g, { t: lt, k: 1, shake2: 6 }); mood(g, { desat: 0.3 }); } },
  { at: 'd6', draw(g, lt, D, S) { pocketMoney(g, { t: lt, k: easeOut(clamp(lt / 1.2)) }); } },

  // ── 5. 最後の望み
  { at: 'e1', draw(g, lt, D, S) { pocketCall(g, { t: lt, k: easeOut(clamp(lt / 1.0)), calling: 0 }); } },
  { at: 'e2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 560, y: 1150, z: 1.0 }); living(g, { t: lt, dim: 0.3 });
    figure(g, P.sakaguchi, { x: 330, y: 1600, s: 1.2, turn: 0.6, look: 0.3, lookY: 0.6, arms: [40, -60, 40, -60], eyes: 'narrow', mouth: 'smile', lightFrom: 'left' });
    for (let i = 0; i < 6; i++) bills(g, 380 + (i % 3) * 100, 1330 - Math.floor(i / 3) * 14, 0.35, (i % 2 - 0.5) * 0.2);
    figure(g, P.yuuma, { x: 800, y: 1600, s: 1.15, turn: -0.4, look: -0.8, arms: [10, 0, 60, -20], brow: -0.6, eyes: 'wide' }); g.restore();
    if (lt > S.L('e2') + 1.8) { g.save(); const a = inv(S.L('e2') + 1.8, S.L('e2') + 2.1, lt); g.globalAlpha = a; fillRR(g, 620, 360, 400, 380, 30, 'rgba(10,10,16,.9)'); g.restore(); g.save(); g.beginPath(); g.rect(620, 360, 400, 380); g.clip(); g.translate(620, 360); g.scale(400 / 1080, 380 / 1300); g.translate(0, -300); g.globalAlpha = a; pocketCall(g, { t: lt, k: 1, calling: 1 }); g.restore(); }
  } },
  { at: 'e3', draw(g, lt, D, S) { bg(g, '#101218', '#08090c'); yuuClose(g, lt, D, S, ['e3'], { eyes: 'closed', brow: -1, sweat: lt * 2 }); } },
  { at: 'wait', draw(g, lt, D, S) {
    bg(g, '#05060a', '#08090e');
    const sec = Math.floor(lerp(0, 180, clamp(lt / (D + 2.5))));
    text(g, `0${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, 540, 760, { size: 160, color: '#f1f3f8', weight: 600 });
    text(g, '通話中', 540, 600, { size: 44, color: '#7ce0a0' });
  } },
  { at: 'e4', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.05) }); doorInside(g, { t: lt, open: 0 }); g.restore(); sfxText(g, 'ピンポーン', 540, 300, { size: 110, color: '#f4f1ea', alpha: inv(S.L('e4') + 1.1, S.L('e4') + 1.3, lt), rot: -0.05 }); } },
  { at: 'e5', draw(g, lt, D, S) { warm(g); sakaClose(g, lt, D, S, ['e5'], { mouth: 'line', turn: 0.5, look: 1 }); } },
  { at: 'e6', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.08) }); doorInside(g, { t: lt, open: easeOut(clamp(lt / 1.2)), P: P.jin, o: { eyes: 'narrow', mouth: 'line', arms: [10, 0, 10, 0] } }); g.restore(); } },

  // ── 6. 鍵
  { at: 'f1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D, 1.0, 1.08) }); doorInside(g, { t: lt, open: lerp(1, 0, easeOut(inv(0.8, 2.0, lt))), porch: 0.6 });
    figure(g, P.jin, { x: 540, y: 1640, s: 1.6, turn: 0, arms: [10, 0, 10, 0], eyes: 'narrow', mouth: 'line', lightFrom: 'right', look: 0.6 }); g.restore();
  } },
  { at: 'lock', draw(g, lt, D, S) { lockTurn(g, { t: lt, k: easeOut(inv(0.1, 0.6, lt)) }); } },
  { at: 'f2', finish: { vignette: 0.7 }, draw(g, lt, D, S) {
    bg(g, '#0e0a0c', '#050405');
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.jin, { y: 760, s: 4.0, eyes: 'narrow', mouth: 'line', talk: talking(lt, S, ['f2']) * 0.4, lightFrom: 'right', look: 0.4 }); g.restore();
    mood(g, { red: 0.18 * inv(S.L('f2'), S.L('f2') + 0.8, lt) });
  } },
  { at: 'f3', draw(g, lt, D, S) { bg(g, '#100608', '#050304'); sakaClose(g, lt, D, S, ['f3'], { glint: 0.7, lightFrom: 'right' }); mood(g, { red: 0.2 }); } },
  { at: 'f4', finish: { vignette: 0.8 }, draw(g, lt, D, S) {
    // 床から見上げる：並んで見下ろす二人
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1012'], [1, '#050304']]);
    glow(g, 540, 120, 700, 'rgba(255,200,140,1)', 0.25);
    g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.06) });
    figure(g, P.sakaguchi, { x: 320, y: 2150, s: 3.0, look: 0.3, lookY: 1, eyes: 'narrow', mouth: 'smile', glint: 0.7, lightFrom: 'right' });
    figure(g, P.jin, { x: 780, y: 2170, s: 2.8, look: -0.3, lookY: 1, eyes: 'narrow', mouth: 'line', lightFrom: 'left' });
    g.restore();
    mood(g, { red: 0.28 * inv(0, 1.2, lt) });
    if (lt > S.Le('f4') + 0.4) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const post = heads([['recap', '前回のあらすじ', 3.0], ['a0', 'その夜　実家のリビング', 2.4], ['wait', '3分後', 1.4]]);

const SFX = [
  { at: 'recap', type: 'vibrate', dur: 2.2, vol: 0.7 },
  { at: 'r2', type: 'stab', vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a0', type: 'roomtone', dur: 30, vol: 0.35 },
  { at: 'a2', off: 0.1, type: 'subdrop', vol: 0.8 },
  { at: 'a2', off: 0.9, type: 'stab', vol: 0.7 },
  { at: 'a3', type: 'heartbeat', dur: 3.0, vol: 0.6 },
  { at: 'a4', type: 'shutter', vol: 0.5 },
  { at: 'a4', off: 1.2, type: 'shutter', vol: 0.5 },
  { at: 'b3', off: 0.5, type: 'riser', dur: 2.5, vol: 0.3 },
  { at: 'c1', off: 0.6, type: 'tap3', vol: 0.5 },
  { at: 'c2', off: 1.2, type: 'pop', vol: 0.5 },
  { at: 'c4', type: 'subdrop', vol: 0.4 },
  { at: 'd1', type: 'ticks', dur: 3.0, vol: 0.6 },
  { at: 'dial', off: 1.35, type: 'unlock', vol: 0.9 },
  { at: 'd2', off: 0.1, type: 'creak', vol: 0.6 },
  { at: 'd2', off: 0.8, type: 'stinger', vol: 0.5 },
  { at: 'd4', off: 0.4, type: 'rustle', dur: 0.8, vol: 0.6 },
  { at: 'd5', type: 'heartbeat', dur: 3.0, vol: 0.5 },
  { at: 'd6', type: 'rustle', dur: 0.8, vol: 0.5 },
  { at: 'e1', off: 0.3, type: 'rustle', dur: 0.6, vol: 0.5 },
  { at: 'e2', off: 1.8, type: 'dial', vol: 0.4 },
  { at: 'e3', type: 'heartbeat', dur: 2.4, vol: 0.6 },
  { at: 'wait', type: 'clock', dur: 1.4, vol: 0.5 },
  { at: 'e4', off: 1.1, type: 'chime', vol: 0.8 },
  { at: 'e6', type: 'creak', vol: 0.6 },
  { at: 'f1', off: 0.4, type: 'steps', dur: 1.5, vol: 0.5 },
  { at: 'lock', off: 0.5, type: 'clunk', vol: 1.0 },
  { at: 'f2', off: 0.1, type: 'stab', vol: 0.7 },
  { at: 'f4', type: 'heartbeat', dur: 3.0, vol: 0.6 },
  { at: 'f4:end', off: 0.4, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'notif', vol: 0.6 },
];
const MUSIC = [
  { at: 'recap', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'a0', mood: 'suspense' },
  { at: 'b1', mood: 'dread' },
  { at: 'c1', mood: 'tension' },
  { at: 'd1', mood: 'silence' },
  { at: 'd3', mood: 'dread' },
  { at: 'e1', mood: 'suspense' },
  { at: 'wait', mood: 'silence' },
  { at: 'e6', mood: 'calm' },
  { at: 'f1', mood: 'silence' },
  { at: 'f2', mood: 'dread' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
