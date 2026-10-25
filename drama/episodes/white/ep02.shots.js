// ホワイト案件 第2話「おかえり」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, back, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, cam, shake, text, FONT, SERIF } from '../../engine/core.js';
import { C, CAST2, figure, close, head, speedLines, sfxText, panels, mood, chat, subBand, toneRect, crowIcon } from '../../engine/noir.js';
import { street, house, genkan, stairsUp, altar, mapPhoto, living, stairsDown, carWindow, buzzPhone } from '../../engine/noirsets.js';
import { runEpisode } from '../../engine/player.js';
import { SERIES, EPISODE, CAST, LINES } from './ep02.script.js';

const P = CAST2;
const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
const bg = (g, a = '#06070c', b = '#0d1120') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
const slow = (lt, D, a = 1, b = 1.08) => lerp(a, b, ease(clamp(lt / Math.max(D, 0.1))));
const chip = (g, s, a) => { if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 70; fillRR(g, 540 - w / 2, 210, w, 80, 40, 'rgba(10,10,16,.85)'); g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.8); rr(g, 540 - w / 2, 210, w, 80, 40); g.stroke(); text(g, s, 540, 252, { size: 40, color: '#f1f3f8' }); g.restore(); };
// 2階の窓の人影（第1話のラスト）
function windowFigure(g, lt, z = 2.1, a = 1) {
  g.save(); cam(g, { x: 540 - 200, y: 1500 - 330 - 300 + 75, z }); street(g, { lit2: 1, lit1: 0, t: lt }); g.restore();
  g.save(); g.globalAlpha = 0.9 * a; ell(g, 560, 860, 70 * z / 2.1, 84 * z / 2.1, '#140c08'); fillRR(g, 450, 920, 220, 600, 80, '#140c08'); fillRR(g, 610, 800, 40, 110, 14, '#140c08'); g.restore();
}

export function cover(g, lt = 9) {
  const k = easeOut(inv(0, 0.3, lt)), gl = lt < 0.35 ? noise1(lt * 60, 3) * 16 : 0;
  g.save(); cam(g, { x: 520, y: 1000, z: 1.25 }); street(g, { lit2: 1.2, lit1: 0 }); g.restore();
  vgrad(g, 0, 0, W, H, [[0, 'rgba(3,3,6,.9)'], [0.3, 'rgba(3,3,6,.45)'], [0.6, 'rgba(3,3,6,.35)'], [1, 'rgba(3,3,6,.9)']]);
  glow(g, 540, 820, 760, 'rgba(220,20,40,1)', 0.28 * k);
  g.save(); g.globalAlpha = k; close(g, P.sakaguchi, { y: 1560, s: 3.0, eyes: 'narrow', mouth: 'smile', glint: 0.6, lightFrom: 'left' }); g.restore();
  vgrad(g, 0, 1250, W, 200, [[0, 'rgba(3,3,6,.6)'], [1, 'rgba(3,3,6,0)']]);
  g.save(); g.globalAlpha = k; fillRR(g, 190, 330, 700, 110, 34, 'rgba(24,26,36,.95)'); g.lineWidth = 4; g.strokeStyle = C.red; rr(g, 190, 330, 700, 110, 34); g.stroke(); circ(g, 255, 385, 34, '#2a2e3a'); text(g, '？', 255, 387, { size: 40, color: '#fff' });
  text(g, '…おかえり、ユウマくん', 315, 387, { size: 42, color: '#fff', align: 'left' }); g.restore();
  const ts = (gx, col) => { g.save(); g.font = `700 160px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.letterSpacing = '4px'; g.globalAlpha = k; g.lineWidth = 18; g.strokeStyle = '#05060a'; g.strokeText('ホワイト案件', gx, 600); g.fillStyle = col; g.fillText('ホワイト案件', gx, 600); g.restore(); };
  if (gl) ts(540 - gl, rgba('#ff2a40', 0.6));
  ts(540 + gl, '#f4f1ea');
  const b = easeOut(inv(0.15, 0.5, lt)), sc = lerp(1.3, 1, back(b));
  g.save(); g.translate(540, 870); g.scale(sc, sc); g.globalAlpha = b;
  g.font = `900 300px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 30; g.strokeStyle = '#05060a'; g.strokeText('第2話', 0, 0); g.fillStyle = C.red; g.fillText('第2話', 0, 0); g.restore();
  const c = easeOut(inv(0.35, 0.7, lt));
  g.save(); g.globalAlpha = c; fillRR(g, 540 - 320, 1060, 640, 116, 14, '#f4f1ea'); text(g, 'おかえり', 540, 1120, { size: 82, color: '#0a0a0e', weight: 800 });
  fillRR(g, 540 - 90, 1196, 180, 52, 26, C.red); text(g, '全5話', 540, 1223, { size: 32, color: '#fff', weight: 800, spacing: 6 }); g.restore();
}

const SHOTS = [
  // ── 前回のあらすじ
  { at: 'recap', draw(g, lt, D, S) {
    panels(g, [
      { x: 40, y: 330, w: 1000, h: 420, slide: easeOut(clamp(lt / 0.4)), from: 'left', draw(p, w, h) { p.save(); p.translate(-40, -900); street(p, { lit2: 1, lit1: 0 }); figure(p, P.yuuma, { x: 860, y: 1700, s: 1.6, turn: -0.6, look: -1, gloves: true, phone: true }); p.restore(); } },
      { x: 40, y: 790, w: 480, h: 400, alpha: inv(S.L('r1') + 1.6, S.L('r1') + 1.9, lt), draw(p, w, h) { mapPhoto(p, w, h, lt); } },
      { x: 560, y: 790, w: 480, h: 400, alpha: inv(S.L('r1') + 3.0, S.L('r1') + 3.3, lt), draw(p, w, h) { p.save(); p.scale(w / 1080, h / 1080); p.translate(0, -300); altar(p, {}); p.restore(); } },
    ]);
    mood(g, { desat: 0.5 });
  } },
  { at: 'r2', draw(g, lt, D, S) { windowFigure(g, lt, lerp(1.9, 2.2, ease(clamp(lt / (D + 2))))); mood(g, { desat: 0.3 }); } },
  { at: 'r3', finish: { vignette: 0.75 }, draw(g, lt, D, S) { windowFigure(g, lt, lerp(2.2, 2.5, ease(clamp(lt / D)))); mood(g, { red: 0.2 * inv(0.2, 1.2, lt) }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt, D, S) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. 降りてきた男
  { at: 'door', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D + 3, 1.0, 1.06) }); stairsDown(g, { t: lt, k: ease(clamp((lt - 0.2) / (D + 2.5))) * 0.55, P: P.sakaguchi, o: { eyes: 'narrow', mouth: 'smile', lightFrom: 'left' } }); g.restore();
  } },
  { at: 'a2', draw(g, lt, D, S) {
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2226'], [1, '#141014']]); glow(g, 540, 300, 600, 'rgba(255,200,140,1)', 0.2);
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.05) }); close(g, P.sakaguchi, { y: 760, s: 4.0, eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['a2']) * 0.5, lightFrom: 'left', brow: -0.3 }); g.restore();
    g.save(); g.globalAlpha = inv(0.6, 1.0, lt) * (1 - inv(D - 0.4, D, lt)); fillRR(g, 300, 330, 480, 130, 20, 'rgba(10,10,16,.85)'); text(g, '坂口（52）', 540, 380, { size: 48, color: '#fff' }); text(g, 'オカンの恋人', 540, 432, { size: 30, color: '#c9ccd6' }); g.restore();
  } },
  { at: 'a3', draw(g, lt, D, S) {
    bg(g, '#141416', '#0a0a0c');
    chat(g, [{ t: -5, from: 'mom', text: '今度、ユウマに会わせたい人がおるねん' }, { t: -4, from: 'mom', text: 'やさしい人やで' }], lt, { title: '母', y: 330, h: 640 });
    text(g, '2週間前', 540, 1010, { size: 34, color: '#8a8f9c', alpha: 1 });
    mood(g, { desat: 0.6 });
  } },
  { at: 'a4', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1150, z: slow(lt, D, 1.05, 1.1) }); genkan(g, { t: lt, light: 0.8 }); g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H);
    figure(g, P.sakaguchi, { x: 540, y: 1560, s: 1.25, arms: [10, 0, 40, -110], phone: true, mouth: 'smile', talk: talking(lt, S, ['a4']) * 0.5, eyes: 'narrow', lightFrom: 'left' });
  } },
  { at: 'a5', draw(g, lt, D, S) {
    bg(g, '#1a1416', '#0c0a0b');
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.06) }); close(g, P.yuuma, { y: 760, s: 4.0, eyes: lt > 1.2 ? 'closed' : 'dot', brow: -0.4, mouth: 'line', lightFrom: 'left' }); g.restore();
    sfxText(g, 'ふぅ…', 820, 380, { size: 80, color: '#f4f1ea', alpha: inv(1.3, 1.6, lt), rot: 0.06 });
  } },

  // ── 2. 全部話す
  { at: 'b1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 560, y: 1150, z: slow(lt, D + 3, 1.0, 1.06) }); living(g, { t: lt });
    figure(g, P.yuuma, { x: 720, y: 1560, s: 1.15, turn: -0.4, arms: [30, -80, 30, -80], look: -0.6, brow: -0.6, talk: talking(lt, S, ['b2']) * 0.3 });
    figure(g, P.sakaguchi, { x: 300, y: 1600, s: 1.2, turn: 0.4, arms: [20, -70, 20, -70], look: 0.7, eyes: 'narrow', mouth: 'line', lightFrom: 'left' }); g.restore();
    // 話した中身
    const items = [['闇バイト', S.L('b2') + 0.2], ['カラス', S.L('b2') + 1.8], ['実家の金庫', S.L('b2') + 3.2]];
    items.forEach(([s, t0], i) => { const a = inv(t0, t0 + 0.3, lt); if (a > 0) { g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 60; fillRR(g, 540 - w / 2, 360 + i * 100, w, 76, 38, 'rgba(10,10,16,.85)'); g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.8); rr(g, 540 - w / 2, 360 + i * 100, w, 76, 38); g.stroke(); text(g, s, 540, 400 + i * 100, { size: 40, color: '#fff' }); g.restore(); } });
  } },
  { at: 'b3', draw(g, lt, D, S) {
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2226'], [1, '#141014']]); glow(g, 300, 300, 600, 'rgba(255,200,140,1)', 0.25);
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.08) }); close(g, P.sakaguchi, { y: 760, s: 4.0, eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['b3', 'b4', 'b5']) * 0.5, lightFrom: 'left', brow: -0.5 }); g.restore();
  } },
  { at: 'b6', draw(g, lt, D, S) {
    bg(g, '#1a1416', '#0c0a0b'); glow(g, 300, 300, 600, 'rgba(255,200,140,1)', 0.18);
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.08) }); close(g, P.yuuma, { y: 760, s: 4.0, eyes: 'narrow', brow: -1, mouth: 'frown', lightFrom: 'left' }); g.restore();
    // 涙
    const y = 820 + ((lt * 60) % 120); g.save(); g.globalAlpha = inv(0.5, 1.0, lt); ell(g, 450, y, 10, 16, '#bfe0ff'); g.restore();
  } },

  // ── 3. 外のジン
  { at: 'c1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: slow(lt, D, 1.0, 1.05) }); street(g, { lit2: 0.6, lit1: 0.8, t: lt }); g.restore();
    // 道ばたの車（ライトは消えてる）
    g.save(); g.translate(200, 1720); fillRR(g, -260, -220, 640, 200, 40, '#14161c'); fillRR(g, -170, -320, 420, 140, 40, '#1c1e24'); fillRR(g, -140, -300, 360, 100, 20, '#0b0c10'); circ(g, -150, -20, 56, '#08090c'); circ(g, 260, -20, 56, '#08090c'); g.restore();
    figure(g, P.yuuma, { x: 760, y: 1800, s: 1.4, turn: -0.6, look: -1, arms: [10, 0, 10, 0] });
  } },
  { at: 'c2', draw(g, lt, D, S) { carWindow(g, { t: lt, jin: { eyes: 'narrow', brow: lt < S.L('c3') ? 0.4 : 0, talk: talking(lt, S, ['c3', 'c4', 'c5']) * 0.5, look: 0.5 }, paper: easeOut(inv(S.L('c4') + 0.3, S.L('c4') + 1.0, lt)) }); mood(g, { red: 0.08 * inv(S.L('c5'), S.L('c5') + 1, lt) }); } },
  { at: 'c6', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: 1.0 }); street(g, { lit2: 0.6, lit1: 0.8, t: lt }); g.restore();
    const x = lerp(200, -700, easeIn2(clamp(lt / D)));
    g.save(); g.translate(x, 1720); fillRR(g, -260, -220, 640, 200, 40, '#14161c'); fillRR(g, -170, -320, 420, 140, 40, '#1c1e24'); circ(g, -150, -20, 56, '#08090c'); circ(g, 260, -20, 56, '#08090c'); glow(g, -260, -140, 200, 'rgba(255,40,40,1)', 0.6); g.restore();
    figure(g, P.yuuma, { x: 760, y: 1800, s: 1.4, turn: -0.8, look: -1, arms: [10, 0, 30, -100] });
    // 握った紙
  } },

  // ── 4. 金庫
  { at: 'd1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: 1.0 }); living(g, { t: lt });
    figure(g, P.sakaguchi, { x: 380, y: 1600, s: 1.25, turn: 0.2, arms: [10, 0, 20, 0], eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['d1']) * 0.5, lightFrom: 'left' });
    figure(g, P.yuuma, { x: 760, y: 1600, s: 1.2, turn: -0.4, look: -0.8, arms: [10, 0, 10, 0] }); g.restore();
  } },
  { at: 'd2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: lerp(900, 1180, ease(clamp(lt / D))), z: 1.1 }); altar(g, { t: lt });
    // 扉を開ける手
    const op = easeOut(inv(0.4, 1.2, lt));
    g.save(); g.translate(330, 1060); g.scale(1 - op * 0.85, 1); fillRR(g, 0, 0, 420, 360, 10, '#3a2418'); g.restore();
    g.restore();
    sfxText(g, '迷わず', 780, 420, { size: 90, color: C.red, alpha: inv(S.L('d2') + 1.2, S.L('d2') + 1.5, lt), rot: -0.08 });
  } },
  { at: 'd3', draw(g, lt, D, S) {
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2226'], [1, '#141014']]);
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.06) }); close(g, P.sakaguchi, { y: 760, s: 4.0, eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['d3']) * 0.5, lightFrom: 'left', turn: 0.2, look: 0.4 }); g.restore();
  } },
  { at: 'd4', draw(g, lt, D, S) {
    bg(g, '#1a1416', '#0c0a0b');
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.04) }); close(g, P.yuuma, { y: 760, s: 4.0, eyes: 'dot', brow: -0.2, mouth: 'line', talk: talking(lt, S, ['d4']) * 0.4, lightFrom: 'left', look: -0.4 }); g.restore();
  } },
  { at: 'd5', draw(g, lt, D, S) {
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2226'], [1, '#141014']]);
    g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D + 3, 1.0, 1.1) }); close(g, P.sakaguchi, { y: 760, s: 4.0, eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['d5']) * 0.5, lightFrom: 'left', glint: inv(S.Le('d5') - 0.5, S.Le('d5'), lt) * 0.6 }); g.restore();
  } },
  { at: 'd6', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D, 1.2, 1.4) }); stairsUp(g, { t: lt, ring: 0 }); g.restore();
    text(g, 'ミクの部屋', 540, 300, { size: 40, color: '#f4f1ea', alpha: inv(0.6, 1.0, lt) });
  } },

  // ── 5. カラスに送る
  { at: 'e1', draw(g, lt, D, S) {
    bg(g, '#05060a', '#0b0c12');
    const typed = '全部、警察に話す。もう、お前の言うことは聞かへん';
    const n = Math.floor(clamp((lt - S.L('e2')) / Math.max(0.1, S.Le('e2') - S.L('e2'))) * typed.length);
    const sent = lt > S.L('send') + 0.2;
    chat(g, [{ t: -9, from: 'karasu', text: '次の仕事や。今夜、この家の金庫の中身を持ってこい' }, { t: -8, from: 'karasu', text: '番号は、お前が知っとるやろ' }, ...(sent ? [{ t: S.L('send') + 0.2, from: 'me', text: typed, read: lt > S.L('send') + 1.1 }] : [])], lt, { y: 330, h: 720 });
    if (!sent) { fillRR(g, 90, 1080, 900, 110, 30, '#1c2030'); text(g, typed.slice(0, n) + (Math.sin(lt * 8) > 0 ? '｜' : ''), 120, 1135, { size: 36, color: '#fff', align: 'left' }); }
  } },

  // ── 6. 震えるスマホ
  { at: 'f1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1300, z: slow(lt, D, 1.4, 1.5) }); living(g, { t: lt }); g.restore();
    // テーブルの上のスマホ（画面が光って震える）
    const vib = noise1(lt * 60, 2) * 8;
    g.save(); g.translate(540 + vib, 1280); g.rotate(-0.1); fillRR(g, -90, -40, 180, 80, 16, '#0d0e12'); fillRR(g, -80, -32, 160, 64, 10, '#1d2a44'); glow(g, 0, 0, 220, 'rgba(140,170,255,1)', 0.4); g.restore();
    sfxText(g, 'ヴヴッ', 760, 900, { size: 90, color: '#f4f1ea', alpha: inv(0.1, 0.3, lt), rot: 0.1, shake: 4, t: lt });
  } },
  { at: 'f2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1350, z: 1.0 }); living(g, { t: lt });
    figure(g, P.sakaguchi, { x: 300, y: 1600, s: 1.2, turn: 0.4, arms: [20, -70, 20, -70], look: 0.7, eyes: 'narrow', mouth: 'smile', lightFrom: 'left' });
    figure(g, P.yuuma, { x: 760, y: 1600, s: 1.15, turn: -0.4, arms: [10, 0, 30, -110], phone: true, look: -0.8, lookY: 1 }); g.restore();
    const vib = noise1(lt * 60, 2) * 6; g.save(); g.translate(470 + vib, 1140); fillRR(g, -40, -18, 80, 36, 8, '#1d2a44'); glow(g, 0, 0, 120, 'rgba(140,170,255,1)', 0.5); g.restore();
    g.save(); g.globalAlpha = inv(0.4, 0.8, lt); g.lineWidth = 6; g.strokeStyle = C.red; g.beginPath(); g.arc(470, 1140, 80, 0, 7); g.stroke(); g.restore();
  } },
  { at: 'f3', draw(g, lt, D, S) {
    buzzPhone(g, { t: lt, on: 1, shown: easeOut(inv(0.3, 0.9, lt)), msg: '全部、警察に話す。\nもう、お前の言う\nことは聞かへん' });
    if (lt > S.L('f3') + 1.8) speedLines(g, 540, 860, { inner: 520, t: lt, color: 'rgba(255,40,60,.5)' });
  } },
  { at: 'reveal', finish: { vignette: 0.7 }, draw(g, lt, D, S) {
    bg(g, '#100608', '#050304');
    g.save(); cam(g, { x: 540, y: 800, z: lerp(1.0, 1.25, ease(clamp(lt / (D + 3)))) }); close(g, P.sakaguchi, { y: 760, s: 4.2, eyes: 'narrow', mouth: 'smile', talk: talking(lt, S, ['f4']) * 0.4, lightFrom: 'right', glint: 0.7 + 0.3 * Math.sin(lt * 2) }); g.restore();
    mood(g, { red: 0.25 * inv(0.0, 1.5, lt) });
    if (lt > S.Le('f4') + 0.5) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  } },
  // ── エンドカード
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt, D, S) {
    bg(g, '#030305', '#08090e');
    const a = easeOut(inv(0.1, 0.5, lt));
    text(g, 'ホワイト案件', 540, 470, { size: 64, color: '#8a8f9c', font: SERIF, weight: 700, alpha: a, spacing: 4 });
    text(g, '第2話「おかえり」終', 540, 560, { size: 42, color: '#c9ccd6', alpha: a });
    const b = easeOut(inv(0.6, 1.1, lt));
    poly(g, [[300, 650], [780, 630], [782, 640], [302, 662]], rgba(C.red, b));
    text(g, '次回', 540, 730, { size: 40, color: C.red, alpha: b });
    text(g, '第3話　カラスの巣', 540, 840, { size: 92, color: '#f4f1ea', font: SERIF, weight: 700, alpha: b, spacing: 4 });
    const c = easeOut(inv(1.5, 2.0, lt));
    g.save(); g.globalAlpha = c; fillRR(g, 540 - 330, 960, 660, 90, 45, C.red); text(g, EPISODE.ask, 540, 1006, { size: 38, color: '#fff' }); g.restore();
    const d = easeOut(inv(2.2, 2.6, lt));
    text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f1ea', alpha: d, spacing: 8 });
    text(g, 'フォローして続きを待ってて', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
  } },
];
function easeIn2(k) { return k * k; }

const HEADS = [['recap', '前回のあらすじ', 3.0], ['door', 'その夜　実家', 2.2]];
function post(g, t, { at }) { for (const [id, s, d] of HEADS) { const t0 = at(id); chip(g, s, Math.min(inv(t0, t0 + 0.3, t), 1 - inv(t0 + d, t0 + d + 0.4, t))); } }

const SFX = [
  { at: 'recap', type: 'riser', dur: 1.0, vol: 0.3 },
  { at: 'r3', off: -0.3, type: 'pickup', vol: 0.7 },
  { at: 'r3', type: 'stab', vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'door', type: 'creak', vol: 0.7 },
  { at: 'door', off: 0.4, type: 'steps', dur: 3.0, vol: 0.6 },
  { at: 'a3', type: 'pop', vol: 0.4 },
  { at: 'b1', type: 'roomtone', dur: 20, vol: 0.4 },
  { at: 'b2', off: 0.2, type: 'pop', vol: 0.4 },
  { at: 'b2', off: 1.8, type: 'pop', vol: 0.4 },
  { at: 'b2', off: 3.2, type: 'pop', vol: 0.4 },
  { at: 'c1', type: 'engine', dur: 14, vol: 0.4 },
  { at: 'c4', off: 0.3, type: 'rustle', dur: 0.6, vol: 0.5 },
  { at: 'c6', type: 'carstop', vol: 0.5 },
  { at: 'd2', off: 0.4, type: 'creak', vol: 0.6 },
  { at: 'd2', off: 1.2, type: 'stab', vol: 0.4 },
  { at: 'd4', type: 'heartbeat', dur: 2.0, vol: 0.5 },
  { at: 'd6', type: 'subdrop', vol: 0.5 },
  { at: 'send', off: 0.2, type: 'pop', vol: 0.7 },
  { at: 'f1', type: 'vibrate', dur: 2.4, vol: 1.0 },
  { at: 'f2', type: 'vibrate', dur: 2.0, vol: 0.7 },
  { at: 'f3', off: 0.3, type: 'stab', vol: 0.8 },
  { at: 'f3', type: 'heartbeat', dur: 3.5, vol: 0.7 },
  { at: 'f4:end', off: 0.5, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'notif', vol: 0.6 },
];
const MUSIC = [
  { at: 'recap', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'door', mood: 'uneasy' },
  { at: 'c1', mood: 'suspense' },
  { at: 'd1', mood: 'uneasy' },
  { at: 'd6', mood: 'dread' },
  { at: 'send', mood: 'silence' },
  { at: 'f3', mood: 'suspense' },
  { at: 'reveal', mood: 'silence' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
