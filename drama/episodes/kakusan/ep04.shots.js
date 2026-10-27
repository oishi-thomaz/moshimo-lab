// #拡散希望 第4話「生配信」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, mood, subBand } from '../../engine/noir.js';
import { K, short, avatar, postCard, bigCounter, phoneFrame, liveView, callScreen } from '../../engine/sns.js';
import { deleteScreen, photoView, selfiePhoto, carPhoto, warehouse, tiedChair, alleyFlash, confessPaper, acctScreen, albumScreen, chatScreen, streamEnd, nightSky } from '../../engine/kakusets2.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase, endCard, chip } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep04.script.js';

const P = CAST2;
const dark = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1814'], [1, '#0a0908']]); glow(g, 540, 120, 600, 'rgba(255,230,180,1)', 0.18); };
const night = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a2030'], [1, '#0d1018']]); glow(g, 800, 200, 600, 'rgba(255,210,150,1)', 0.08); };
const face = (g, who, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P[who], { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'left', ...o }); g.restore(); };
const ropes = g => { for (let i = 0; i < 2; i++) line(g, 120, 1330 + i * 60, 960, 1310 + i * 60, 18, '#c8b48a'); };
const tiedFace = (g, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P.akari, { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'left', ...o }); ropes(g); g.restore(); };
const ramp = (lt, a, b, n0, n1) => lerp(n0, n1, easeOut(inv(a, b, lt)));
const recapTag = (g, a = 1) => { g.save(); g.globalAlpha = a; fillRR(g, 60, 90, 230, 64, 32, 'rgba(10,12,18,.85)'); text(g, '前回', 175, 123, { size: 34, color: K.orange2 }); g.restore(); };
const onizukaCold = (g, lt, D, S, ids, o = {}) => { dark(g); face(g, 'onizuka', lt, D, S, ids, { eyes: 'narrow', brow: 0.9, mouth: 'line', lightFrom: 'left', ...o }); };
// 自白配信の映像：椅子にしばられたアカリ
function confessCam(g, w, h, t, { look = 0, talk = 0, paper = 1 } = {}) {
  g.save(); g.scale(w / 1080, h / 1920);
  warehouse(g, { t, lamp: 1, ring: 0.3 });
  g.save(); cam(g, { x: 540, y: 1150, z: 1.25 }); tiedChair(g, 540, 1700, 1.3, { look, eyes: look ? 'normal' : 'narrow', brow: look ? -0.2 : -0.6, talk, lookY: look ? 0 : 0.7 }); g.restore();
  if (paper) { g.save(); g.translate(540, 1380); g.rotate(-0.05); fillRR(g, -120, -80, 240, 160, 4, '#f2efe6'); for (let i = 0; i < 4; i++) line(g, -90, -40 + i * 28, 80, -40 + i * 28, 6, 'rgba(30,30,30,.5)'); g.restore(); }
  g.restore();
}
const C1 = [['名無し', '待ってました'], ['k_k', '早く吐け'], ['正義マン', '自白きた'], ['ゆう', '顔もっと映して'], ['みー', '鬼塚さん神'], ['ぽぽ', '泣いても無駄']];
const C2 = [['名無し', 'え？'], ['ゆう', 'どういうこと'], ['あやの', 'カメラ持ってる人って…'], ['k_k', '鬼塚？'], ['しゅん', 'マジで言ってる？'], ['みー', '鬼塚さん何か言って']];

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 4, title: '生配信',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1100, z: 1.0 }); warehouse(g2, { t: 3, ring: 0.3 }); g2.restore(); },
    face: g2 => { close(g2, P.akari, { y: 1560, s: 3.0, eyes: 'narrow', brow: -0.6, mouth: 'line', lightFrom: 'left' }); },
    pill: { text: '【生】通り魔の女 自白配信' },
  });
}

const SHOTS = [
  // ── 前回
  { at: 'recap', draw(g, lt, D, S) { dark(g); phoneFrame(g, 190, 180, 700, 1260, (p, w, h) => deleteScreen(p, w, h, { k: 0.3 + clamp(lt / 3) * 0.7, img: (q, iw, ih) => selfiePhoto(q, iw, ih) })); recapTag(g); } },
  { at: 'r2', finish: { vignette: 0.85 }, draw(g, lt, D, S) { dark(g); g.save(); cam(g, { x: 640, y: 780, z: slow(lt, D, 1.3, 1.4) }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.9, mouth: 'line', lightFrom: 'left', turn: 0.5, look: 0.8 }); g.restore(); mood(g, { red: 0.14 }); recapTag(g, 1 - inv(D - 0.3, D, lt)); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. カメラの外の鬼塚
  { at: 'a1', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1150, z: slow(lt, D, 1.0, 1.1) }); warehouse(g, { t: lt }); tiedChair(g, 540, 1700, 1.3, { eyes: 'narrow', brow: -0.7, look: 0.5 }); g.restore(); } },
  { at: 'a2', draw(g, lt, D, S) { const k = ease(inv(0.8, 2.4, lt)); dark(g); face(g, 'onizuka', lt, D, S, [], { eyes: k < 0.5 ? 'wide' : 'narrow', brow: lerp(0.4, 0.9, k), mouth: k < 0.5 ? 'smile' : 'line' }); g.save(); g.globalAlpha = 1 - k; fillRR(g, 60, 300, 120, 56, 10, K.red); text(g, 'LIVE', 120, 329, { size: 32, color: '#fff', weight: 900 }); g.restore(); } },
  { at: 'a3', finish: { vignette: 0.75 }, draw(g, lt, D, S) { onizukaCold(g, lt, D, S, ['a3'], { z1: 1.12 }); } },
  { at: 'a4', draw(g, lt, D, S) { dark(g); tiedFace(g, lt, D, S, ['a4'], { eyes: 'wide', brow: -0.8, mouth: 'line' }); } },
  { at: 'a5', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1260, z: 1.0 }); alleyFlash(g, { t: lt, k: ease(inv(1.2, 2.4, lt)) }); g.restore(); mood(g, { desat: 0.5 }); chip(g, 'あの夜', inv(0.1, 0.4, lt)); } },
  { at: 'a6', draw(g, lt, D, S) { onizukaCold(g, lt, D, S, ['a6'], { turn: 0.3, look: 0.6 }); } },
  { at: 'a7', draw(g, lt, D, S) { dark(g); phoneFrame(g, 190, 220, 700, 1200, (p, w, h) => acctScreen(p, w, h, { t: lt })); } },
  { at: 'a8', draw(g, lt, D, S) { onizukaCold(g, lt, D, S, ['a8'], { z1: 1.1 }); } },
  { at: 'a9', draw(g, lt, D, S) { dark(g); confessPaper(g, { t: lt }); } },
  { at: 'a10', finish: { vignette: 0.8 }, draw(g, lt, D, S) { onizukaCold(g, lt, D, S, ['a10'], { z0: 1.1, z1: 1.22, turn: 0.3 }); g.save(); g.translate(800, 1460); g.rotate(-0.15); phoneFrame(g, -150, -260, 300, 520, (p, w, h) => { p.fillStyle = '#000'; p.fillRect(0, 0, w, h); p.save(); p.translate(0, 120); carPhoto(p, w, 250); p.restore(); }); g.restore(); } },
  { at: 'a11', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1150, z: 1.0 }); warehouse(g, { t: lt }); tiedChair(g, 380, 1700, 1.15, { eyes: 'narrow', brow: -0.7, turn: 0.5, look: 1 }); figure(g, P.kento, { x: 880, y: 1600, s: 1.05, turn: -0.5, look: -1, lookY: 0.8, arms: [10, 0, 10, 0], eyes: 'narrow', brow: -0.8, mouth: 'frown' }); g.restore(); } },

  // ── 2. ミサキ
  { at: 'b1', draw(g, lt, D, S) { night(g); face(g, 'misaki', lt, D, S, ['b1'], { eyes: 'normal', brow: -0.7, mouth: 'line', phoneLight: true, lightFrom: 'right' }); chip(g, '同じ頃　港の近く', inv(0.1, 0.4, lt) * (1 - inv(2.2, 2.6, lt))); } },
  { at: 'b2', finish: { vignette: 0.7 }, draw(g, lt, D, S) { night(g); const sw = S.L('b2') + (S.Le('b2') - S.L('b2')) * 0.55; face(g, 'misaki', lt, D, S, ['b2'], { eyes: lt < sw ? 'narrow' : 'wide', brow: lt < sw ? -0.8 : -0.2, mouth: 'line', phoneLight: true, lightFrom: 'right' }); } },
  { at: 'b3', draw(g, lt, D, S) { night(g); phoneFrame(g, 160, 200, 760, 1240, (p, w, h) => albumScreen(p, w, h, { t: lt, selfie: (q, iw, ih) => selfiePhoto(q, iw, ih) })); } },
  { at: 'b4', draw(g, lt, D, S) { night(g); g.save(); cam(g, { x: lerp(540, 360, ease(inv(0.3, 1.6, lt))), y: lerp(960, 560, ease(inv(0.3, 1.6, lt))), z: lerp(1.0, 1.8, ease(inv(0.3, 1.6, lt))) }); phoneFrame(g, 160, 200, 760, 1240, (p, w, h) => albumScreen(p, w, h, { t: lt, hi: inv(0.2, 0.5, lt), selfie: (q, iw, ih) => selfiePhoto(q, iw, ih) })); g.restore(); } },
  { at: 'b4b', draw(g, lt, D, S) { night(g); face(g, 'misaki', lt, D, S, ['b4b'], { eyes: 'narrow', brow: -0.9, mouth: 'frown', phoneLight: true, lightFrom: 'right' }); } },
  { at: 'b5', draw(g, lt, D, S) { night(g); phoneFrame(g, 140, 200, 800, 1260, (p, w, h) => chatScreen(p, w, h, { name: '健人', av: 2, t: lt, msgs: [{ text: '港の第3倉庫。\nアカリさんは、ここにいる。\n警察を呼んでくれ。', t: 0.2, time: '23:08' }] })); } },
  { at: 'b6', draw(g, lt, D, S) { night(g); phoneFrame(g, 190, 200, 700, 1300, (p, w, h) => callScreen(p, w, h, { t: lt, name: '110', mode: lt < 0.8 ? 'calling' : 'on', sub: '通話中', av: 5 })); } },

  // ── 3. 自白配信
  { at: 'live', draw(g, lt, D, S) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const k = easeOut(inv(0.2, 0.6, lt)); g.save(); g.translate(540, 900); g.scale(lerp(1.4, 1, k), lerp(1.4, 1, k)); g.globalAlpha = k; fillRR(g, -200, -80, 400, 160, 24, K.red); text(g, 'LIVE', 0, 2, { size: 110, color: '#fff', weight: 900 }); g.restore(); text(g, '配信を開始しました', 540, 1060, { size: 40, color: '#c9ccd6', alpha: k }); } },
  { at: 'c1', draw(g, lt, D, S) { dark(g); phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt, viewers: ramp(lt, 0, D + 6, 90000, 160000), title: 'ジャスティス鬼塚【生】通り魔の女、自白配信', video: (q, vw, vh) => confessCam(q, vw, vh, lt), comments: C1.map(([n, s], i) => ({ t: 0.4 + i * 0.45, name: n, text: s, av: i + 2 })) })); } },
  { at: 'c2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: 1.0 }); warehouse(g, { t: lt, ring: 0.2 }); tiedChair(g, 640, 1500, 0.8, { eyes: 'narrow', brow: -0.6 }); g.restore();
    // 手前：背中を向けた鬼塚がスマホを構える
    g.save(); fillRR(g, -120, 1360, 760, 700, 300, P.onizuka.top2); circ(g, 240, 1250, 190, '#e0c4a8'); g.beginPath(); g.arc(240, 1230, 200, Math.PI, 2 * Math.PI); g.fillStyle = P.onizuka.capC; g.fill(); fillRR(g, 30, 1215, 420, 40, 20, P.onizuka.capC);
    line(g, 520, 1500, 640, 1060, 80, P.onizuka.top2); g.translate(650, 940); g.rotate(0.08); fillRR(g, -90, -150, 180, 300, 20, '#0b0c10'); g.save(); rr(g, -80, -140, 160, 280, 14); g.clip(); g.translate(-80, -140); confessCam(g, 160, 280, lt); g.restore(); fillRR(g, -70, -130, 64, 30, 6, K.red); text(g, 'LIVE', -38, -115, { size: 18, color: '#fff' }); g.restore();
    g.save(); g.globalAlpha = inv(S.L('c2') + 2.0, S.L('c2') + 2.4, lt); g.lineWidth = 8; g.strokeStyle = K.orange; g.setLineDash([16, 10]); rr(g, 550, 780, 200, 330, 26); g.stroke(); g.restore();
  } },
  { at: 'c3', draw(g, lt, D, S) { bg(g, '#120806', '#060304'); bigCounter(g, 540, 560, ramp(lt, 0, 2.0, 160000, 200000), { label: '同時視聴', size: 170 }); const R = rng(14); for (let i = 0; i < 18; i++) { const t0 = 0.5 + i * 0.15, a = inv(t0, t0 + 0.2, lt); if (a <= 0) continue; text(g, C1[i % C1.length][1], 220 + R() * 640, 820 + R() * 380, { size: 30 + R() * 20, color: i % 5 === 0 ? K.orange : '#e9edf3', alpha: a * 0.85 }); } } },
  { at: 'c4', draw(g, lt, D, S) { dark(g); phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt + 3, viewers: 200000, title: 'ジャスティス鬼塚【生】通り魔の女、自白配信', video: (q, vw, vh) => confessCam(q, vw, vh, lt, { talk: talking(lt, S, ['c4']) * 0.4 }), comments: C1.map(([n, s], i) => ({ t: i * 0.45, name: n, text: s, av: i + 2 })) })); } },
  { at: 'c5', finish: { vignette: 0.75 }, draw(g, lt, D, S) { dark(g); const k = inv(D * 0.45, D * 0.6, lt); tiedFace(g, lt, D, S, [], { eyes: k < 0.5 ? 'narrow' : 'normal', brow: lerp(-0.9, -0.3, k), mouth: 'line', lookY: lerp(0.7, 0, k), z1: 1.12 }); } },
  { at: 'c5b', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: 1.05 }); warehouse(g, { t: lt, ring: 0.15 });
    figure(g, P.kento, { x: 760, y: 1560, s: 1.05, arms: [10, 0, 10, 0], eyes: 'narrow', brow: -0.4, mouth: 'line', lookY: Math.max(0, Math.sin((lt - 1.0) * 4)) * 0.8 * inv(1.0, 1.2, lt) * (1 - inv(2.6, 2.8, lt)) });
    const k = figure(g, P.onizuka, { x: 400, y: 1640, s: 1.3, arms: [10, 0, 150, -30], eyes: 'narrow', mouth: 'smile', brow: 0.4 });
    fillRR(g, k.hr[0] - 40, k.hr[1] - 130, 80, 140, 12, '#0b0c10'); circ(g, k.hr[0] - 10, k.hr[1] - 110, 10, '#2a2c34');
    g.restore();
    g.save(); g.globalAlpha = inv(0.8, 1.2, lt); g.lineWidth = 8; g.strokeStyle = K.orange; g.setLineDash([16, 10]); g.beginPath(); g.ellipse(790, 820, 140, 170, 0, 0, 7); g.stroke(); g.restore();
  } },
  { at: 'c6', draw(g, lt, D, S) { dark(g); phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt, viewers: ramp(lt, 0, D + 4, 200000, 230000), title: 'ジャスティス鬼塚【生】通り魔の女、自白配信', video: (q, vw, vh) => confessCam(q, vw, vh, lt, { look: 1, talk: talking(lt, S, ['c6']) * 0.4, paper: 0 }), comments: C2.slice(0, 4).map(([n, s], i) => ({ t: 1.6 + i * 0.5, name: n, text: s, av: i + 2 })) })); } },
  { at: 'c7', finish: { vignette: 0.7 }, draw(g, lt, D, S) { dark(g); g.save(); cam(g, { x: 540, y: 840, z: slow(lt, D, 1.0, 1.12) }); phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt + 3.6, viewers: ramp(lt, 0, D + 3, 230000, 260000), title: 'ジャスティス鬼塚【生】通り魔の女、自白配信', video: (q, vw, vh) => confessCam(q, vw, vh, lt, { look: 1, talk: talking(lt, S, ['c7']) * 0.4, paper: 0 }), comments: C2.map(([n, s], i) => ({ t: i * 0.6, name: n, text: s, av: i + 2 })) })); g.restore(); } },
  { at: 'turn', finish: { vignette: 0.85 }, draw(g, lt, D, S) {
    dark(g); const k = ease(clamp(lt / D));
    g.save(); cam(g, { x: 540, y: 820, z: lerp(1.0, 1.1, k) }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'narrow', brow: 1, mouth: 'grit', lightFrom: 'left' }); g.restore();
    g.save(); g.translate(lerp(900, 760, k), lerp(1900, 1350, k)); g.rotate(-0.6); line(g, 0, 140, 0, 0, 60, '#1a1a1e'); poly(g, [[-22, 0], [22, 0], [6, -330], [-2, -340]], '#dfe6ee'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -200, 140, 'rgba(230,240,255,1)', 0.6 * k); g.restore(); g.restore();
  } },
  { at: 'c8', draw(g, lt, D, S) {
    const cut = S.L('c8') + 1.4;
    if (lt < cut) { dark(g); g.save(); cam(g, { x: 700, y: 1300, z: 1.4 }); g.translate(760, 1350); g.rotate(-0.6); line(g, 0, 140, 0, 0, 60, '#1a1a1e'); poly(g, [[-22, 0], [22, 0], [6, -330], [-2, -340]], '#dfe6ee'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -200, 160, 'rgba(230,240,255,1)', 0.7); g.restore(); g.restore(); mood(g, { red: 0.2 }); }
    else { const R = rng(Math.floor(lt * 30)); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); if (lt < cut + 0.35) for (let i = 0; i < 30; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.5)' : 'rgba(255,60,60,.4)'; g.fillRect(0, R() * H, W, 4 + R() * 30); } else phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => streamEnd(p, w, h)); }
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const post = heads([['a1', '午後11時　港の倉庫', 2.2]]);

const SFX = [
  { at: 'recap', type: 'zapoff', vol: 0.5 },
  { at: 'r2', type: 'heartbeat', dur: 2.6, vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 40, vol: 0.3 },
  { at: 'a1', off: 0.4, type: 'creak', vol: 0.5 },
  { at: 'a2', off: 0.6, type: 'zapoff', vol: 0.5 },
  { at: 'a3', type: 'subdrop', vol: 0.6 },
  { at: 'a5', type: 'wind', dur: 5, vol: 0.3 },
  { at: 'a5', off: 2.0, type: 'stab', vol: 0.6 },
  { at: 'a7', off: 0.6, type: 'tap3', vol: 0.4 },
  { at: 'a7:end', off: -0.8, type: 'stinger', vol: 0.6 },
  { at: 'a9', type: 'rustle', vol: 0.6 },
  { at: 'a10', type: 'heartbeat', dur: 4, vol: 0.5 },
  { at: 'b1', type: 'roomtone', dur: 26, vol: 0.25 },
  { at: 'b2:end', off: -0.6, type: 'riser', vol: 0.4 },
  { at: 'b4', off: 0.3, type: 'ping', vol: 0.6 },
  { at: 'b5', off: 0.1, type: 'notif', vol: 0.8 },
  { at: 'b6', type: 'dial', vol: 0.5 },
  { at: 'live', type: 'ping', vol: 0.7 },
  { at: 'live', off: 0.1, type: 'stab', vol: 0.6 },
  { at: 'c3', type: 'pingstorm', dur: 3.0, vol: 0.5 },
  { at: 'c5', type: 'heartbeat', dur: 6, vol: 0.6 },
  { at: 'c6', off: 0.8, type: 'hit', vol: 0.7 },
  { at: 'c7', type: 'pingstorm', dur: 4, vol: 0.4 },
  { at: 'turn', type: 'scrape', vol: 0.6 },
  { at: 'turn', type: 'heartbeat', dur: 3.2, vol: 0.7 },
  { at: 'c8', off: 1.4, type: 'glitch', vol: 0.9 },
  { at: 'c8', off: 1.75, type: 'zapoff', vol: 0.8 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'recap', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'dread' },
  { at: 'a5', mood: 'flash' },
  { at: 'a6', mood: 'dread' },
  { at: 'b1', mood: 'uneasy' },
  { at: 'b4', mood: 'suspense' },
  { at: 'live', mood: 'silence' },
  { at: 'c1', mood: 'tension' },
  { at: 'c5', mood: 'suspense' },
  { at: 'c6', mood: 'thriller' },
  { at: 'turn', mood: 'silence' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
