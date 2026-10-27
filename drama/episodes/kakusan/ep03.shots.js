// #拡散希望 第3話「証拠」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, mood, subBand } from '../../engine/noir.js';
import { K, short, avatar, postCard, bigCounter, phoneFrame, liveView, callScreen } from '../../engine/sns.js';
import { onizukaCam, deleteScreen, photoView, selfiePhoto, carPhoto, carInside, nightDrive, policeFront, nightPort, warehouse, nightSky } from '../../engine/kakusets2.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase, endCard, chip } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep03.script.js';

const P = CAST2;
const night = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a2030'], [1, '#0d1018']]); glow(g, 800, 200, 600, 'rgba(255,210,150,1)', 0.08); };
const face = (g, who, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P[who], { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'left', ...o }); g.restore(); };
const ramp = (lt, a, b, n0, n1) => lerp(n0, n1, easeOut(inv(a, b, lt)));
const recapTag = (g, a = 1) => { g.save(); g.globalAlpha = a; fillRR(g, 60, 90, 230, 64, 32, 'rgba(10,12,18,.85)'); text(g, '前回', 175, 123, { size: 34, color: K.orange2 }); g.restore(); };
const selfieView = (p, w, h) => photoView(p, w, h, { img: (q, iw, ih) => selfiePhoto(q, iw, ih) });
const eyePost = (g, y, txt, o = {}) => postCard(g, 60, y, 960, { name: '正義の目', handle: '@seigi_no_me', avatar: 'eye', text: txt, hot: true, time: o.time || '1分', ...o });
const AKARI_POST = '私は犯人ではありません。\n後ろに写っている人が、本当の犯人です。';
const akariPost = (g, y, o = {}) => postCard(g, 60, y, 960, { name: 'アカリ', handle: '@akari_cafe_0812', avatar: 1, text: AKARI_POST, img: (p, w, h) => selfiePhoto(p, w, h), imgH: 520, time: 'たった今', ...o });
// 電話の向こうの健人（暗い場所・画面の端にオレンジの袖＝鬼塚がそばにいる）
function kentoCall(g, lt, D, S, ids, o = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#16181e'], [1, '#0a0b0e']]); glow(g, 300, 300, 500, 'rgba(255,230,180,1)', 0.12);
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.06) });
  close(g, P.kento, { y: 760, s: 4.0, eyes: 'narrow', brow: -0.7, mouth: 'line', lightFrom: 'left', turn: -0.2, look: -0.6, talk: talking(lt, S, ids) * 0.4, sweat: lt * 1.5, ...o });
  fillRR(g, 760, 560, 110, 230, 30, '#0d0e12');
  g.restore();
  // 画面の右端に、オレンジの袖と手がほんの少し
  g.save(); line(g, 1250, 1500, 900, 1310, 130, P.onizuka.top2); ell(g, 860, 1290, 70, 48, C.skin, -0.3); for (let f = 0; f < 4; f++) line(g, 830, 1265 + f * 18, 760, 1280 + f * 22, 22, C.skin); g.restore();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, H);
}
// 倉庫で取り押さえる鬼塚（配信の映像）
function captureCam(g, w, h, t) {
  g.save(); g.scale(w / 1080, h / 1920); warehouse(g, { t, lamp: 1, ring: 0.25 });
  figure(g, P.akari, { x: 600, y: 1650, s: 1.35, turn: 0.4, look: 1, arms: [60, -40, 30, -20], eyes: 'wide', brow: -0.8, mouth: 'grit' });
  const k = figure(g, P.onizuka, { x: 420, y: 1660, s: 1.45, turn: 0.5, look: -1, arms: [80, -40, 100, -60], eyes: 'wide', mouth: 'open', talk: 0.5 + 0.5 * Math.abs(Math.sin(t * 11)), brow: 0.6 });
  g.restore();
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 3, title: '証拠',
    back: g2 => { g2.save(); cam(g2, { x: 760, y: 860, z: 1.6 }); g2.translate(140, 160); selfiePhoto(g2, 800, 1100); g2.restore(); },
    face: g2 => close(g2, P.akari, { y: 1560, s: 3.0, eyes: 'narrow', brow: -0.8, mouth: 'line', lightFrom: 'right', phoneLight: true }),
    pill: { text: '画像は加工 #拡散希望' },
  });
}

const PRAISE = [['k_k', '鬼塚さん最高！'], ['正義マン', '英雄すぎる'], ['名無し', '警察より有能'], ['ゆう', 'ナイス確保！'], ['みー', 'さすが鬼塚'], ['あやの', '泣いた'], ['しゅん', 'これが正義'], ['ぽぽ', '顔さらせ'], ['特定班', '一生出てくんな'], ['名無し', '鬼塚さんに感謝']];
const BASH = ['どうせ加工だろ', '鬼塚さんに罪を着せるとか最低', 'AI画像乙', '犯人が何言ってんの', '通報しました', 'まだ逃げてんの？', '往生際わるすぎ', '自首しろ'];

const SHOTS = [
  // ── 前回
  { at: 'recap', finish: { vignette: 0.7 }, draw(g, lt, D, S) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.save(); cam(g, { x: 790, y: 760, z: slow(lt, 4, 3.2, 3.6) }); phoneFrame(g, 140, 160, 800, 1360, selfieView); g.restore(); recapTag(g); } },
  { at: 'r2', finish: { vignette: 0.8 }, draw(g, lt, D, S) { g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H); g.save(); g.globalAlpha = 0.9; cam(g, { x: 540, y: 800, z: slow(lt, D, 1.05, 1.14) }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.8, mouth: 'line', lightFrom: 'left' }); g.restore(); recapTag(g, 1 - inv(D - 0.3, D, lt)); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. 証拠を出す
  { at: 'a0', draw(g, lt, D, S) {
    night(g); phoneFrame(g, 110, 220, 860, 1180, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt, viewers: 120000, video: (q, vw, vh) => onizukaCam(q, vw, vh, lt) }));
    const a = inv(S.L('a0') + 2.4, S.L('a0') + 2.8, lt); g.save(); g.globalAlpha = a; g.lineWidth = 8; g.strokeStyle = K.orange; rr(g, 120, 316, 840, 72, 14); g.stroke(); g.restore();
    text(g, '今朝の配信', 540, 170, { size: 36, color: '#c9ccd6' });
  } },
  { at: 'a1', draw(g, lt, D, S) { night(g); face(g, 'akari', lt, D, S, [], { eyes: 'narrow', brow: -0.9, mouth: 'line', lightFrom: 'right', phoneLight: true }); } },
  { at: 'a2', draw(g, lt, D, S) { night(g); const n = Math.floor(AKARI_POST.length * clamp((lt - 0.2) / Math.max(0.5, D - 0.4))); postCard(g, 60, 300, 960, { name: 'アカリ', handle: '@akari_cafe_0812', avatar: 1, text: AKARI_POST.slice(0, n) + (Math.sin(lt * 8) > 0 ? '｜' : ''), img: (p, w, h) => selfiePhoto(p, w, h), imgH: 520, time: '下書き' }); } },
  { at: 'a3', draw(g, lt, D, S) { night(g); akariPost(g, 300, { rt: ramp(lt, 0.4, D + 3, 0, 120), likes: ramp(lt, 0.4, D + 3, 0, 40), views: ramp(lt, 0.4, D + 3, 0, 9000) }); } },
  { at: 'a4', draw(g, lt, D, S) { night(g); face(g, 'akari', lt, D, S, [], { eyes: 'normal', brow: -0.4, mouth: 'line', lightFrom: 'right', phoneLight: true }); } },
  { at: 'a5', draw(g, lt, D, S) {
    bg(g, '#120806', '#060304');
    for (let i = 0; i < 3; i++) { const a = inv(0.2 + i * 0.6, 0.4 + i * 0.6, lt); if (a <= 0) continue; g.save(); g.globalAlpha = a; postCard(g, 60 + i * 20, 260 + i * 270, 940, { name: ['名無し', 'k_k', '正義マン'][i], handle: ['@nanashi', '@k_k', '@seigiman'][i], avatar: i + 2, text: BASH[i], rt: 300 + i * 200, likes: 2000 + i * 900, views: 40000, time: '1分' }); g.restore(); }
    const R = rng(8); for (let i = 0; i < 22; i++) { const t0 = 2.0 + i * 0.12, a = inv(t0, t0 + 0.2, lt); if (a <= 0) continue; text(g, BASH[i % BASH.length], 200 + R() * 680, 1060 + R() * 520, { size: 30 + R() * 20, color: i % 4 === 0 ? K.orange : '#e9edf3', alpha: a * 0.9 }); }
  } },
  { at: 'a6', finish: { vignette: 0.75 }, draw(g, lt, D, S) { night(g); face(g, 'akari', lt, D, S, [], { eyes: 'narrow', brow: -1, mouth: 'frown', lightFrom: 'right', phoneLight: true, z1: 1.12 }); mood(g, { red: 0.14 * inv(0.5, 2.5, lt) }); } },

  // ── 2. 警察へ
  { at: 'b1', draw(g, lt, D, S) { carInside(g, { t: lt, outside: 'night', drive: 1, akari: { eyes: 'narrow', brow: -0.7 }, misaki: { eyes: 'normal', brow: -0.4, turn: -0.4, look: -0.8, talk: talking(lt, S, ['b1']) * 0.4 } }); } },
  { at: 'b2', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1200, z: 1.0 }); nightDrive(g, { t: lt }); g.restore(); } },
  { at: 'b3', draw(g, lt, D, S) { night(g); const v = noise1(lt * 50, 2) * 6; face(g, 'akari', lt, D, S, [], { eyes: 'wide', brow: -0.5, mouth: 'line', lightFrom: 'right', phoneLight: true, x: 540 + v }); } },
  { at: 'b4', draw(g, lt, D, S) { night(g); eyePost(g, 340, '犯人の女、駅前警察署に向かっている模様。\n白い軽自動車。#拡散希望', { img: (p, w, h) => carPhoto(p, w, h), imgH: 460, rt: ramp(lt, 0.2, D + 3, 200, 8000), likes: ramp(lt, 0.2, D + 3, 400, 12000), views: ramp(lt, 0.2, D + 3, 9000, 300000) }); } },
  { at: 'b5', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1150, z: slow(lt, D + 2, 1.0, 1.08) }); policeFront(g, { t: lt }); g.restore(); } },
  { at: 'b5b', draw(g, lt, D, S) { night(g); phoneFrame(g, 110, 200, 860, 1180, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt, viewers: ramp(lt, 0, D + 2, 150000, 170000), title: 'ジャスティス鬼塚【生】通り魔の女、警察署に来るか!?', video: (q, vw, vh) => onizukaCam(q, vw, vh, lt, { bg: 'night', place: 'police', point: inv(0.2, 0.5, lt) }), comments: [['名無し', 'きたあああ'], ['ゆう', '白い軽だ！'], ['k_k', '逃がすな'], ['みー', '鬼塚さん走って']].map(([n, s], i) => ({ t: 0.4 + i * 0.4, name: n, text: s, av: i + 2 })) })); } },
  { at: 'b5c', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1200, z: 1.0 }); nightDrive(g, { t: lt, fast: 1 }); g.restore(); } },
  { at: 'b6', finish: { vignette: 0.7 }, draw(g, lt, D, S) { night(g); face(g, 'misaki', lt, D, S, ['b6'], { eyes: 'wide', brow: -0.8, mouth: 'line', lightFrom: 'left' }); } },

  // ── 3. 健人からの電話
  { at: 'c1', draw(g, lt, D, S) { night(g); phoneFrame(g, 190, 200, 700, 1300, (p, w, h) => callScreen(p, w, h, { t: lt, name: '健人', mode: lt < S.Le('c1') ? 'calling' : 'on', sub: '通話中', av: 2 }), { rot: noise1(lt * 30, 4) * 0.02 * (lt < S.Le('c1') ? 1 : 0) }); } },
  { at: 'c2', draw(g, lt, D, S) { kentoCall(g, lt, D, S, ['c2']); } },
  { at: 'c3', draw(g, lt, D, S) { carInside(g, { t: lt, outside: 'night', akari: { eyes: 'wide', brow: -0.6, turn: 0.4, look: 0.8 }, misaki: { eyes: 'wide', brow: -0.7, mouth: 'line' } }); } },
  { at: 'c4', draw(g, lt, D, S) { kentoCall(g, lt, D, S, ['c4'], { look: 0 }); } },
  { at: 'c5', draw(g, lt, D, S) { kentoCall(g, lt, D, S, ['c5'], { look: -0.8, brow: -0.9 }); } },
  { at: 'c6', draw(g, lt, D, S) { night(g); face(g, 'akari', lt, D, S, [], { eyes: 'narrow', brow: -0.6, mouth: 'line', lightFrom: 'right' }); } },
  { at: 'c7', draw(g, lt, D, S) { carInside(g, { t: lt, outside: 'night', akari: { eyes: 'narrow', brow: -0.3, turn: 0.6, look: 1, talk: talking(lt, S, ['c7']) * 0.4 }, misaki: { eyes: 'narrow', brow: -0.8, mouth: 'frown', turn: -0.5, look: -1 } }); } },

  // ── 4. 倉庫
  { at: 'd1', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1100, z: 1.0 }); nightPort(g, { t: lt, k: clamp(lt / (D + 2)) }); g.restore(); } },
  { at: 'd2', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1100, z: slow(lt, D, 1.0, 1.06) }); warehouse(g, { t: lt }); figure(g, P.kento, { x: 540, y: 1640, s: 1.3, arms: [10, 0, 10, 0], eyes: 'narrow', brow: -0.6, mouth: 'line', look: -0.4 }); g.restore(); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a2620'], [1, '#121110']]); glow(g, 540, 200, 600, 'rgba(255,230,180,1)', 0.2); face(g, 'kento', lt, D, S, ['d3'], { eyes: 'narrow', brow: -0.9, mouth: 'frown', turn: -0.5, look: -1, lookY: 0.6 }); } },
  { at: 'd4', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: 1.0 }); warehouse(g, { t: lt, ring: easeOut(inv(0.6, 1.4, lt)) });
    figure(g, P.kento, { x: 640, y: 1640, s: 1.3, arms: [10, 0, 10, 0], eyes: 'narrow', brow: -0.6, mouth: 'line', turn: 0.3, look: 1 });
    g.save(); g.globalAlpha = inv(0.8, 1.6, lt); figure(g, { ...P.onizuka }, { x: 400, y: 1600, s: 1.35, arms: [10, 0, 150, -40], eyes: 'wide', mouth: 'smile', brow: 0.4 }); g.restore();
    g.restore(); sfxText(g, 'パッ', 540, 420, { size: 130, color: '#fff', alpha: inv(0.6, 0.8, lt) * (1 - inv(1.6, 2.0, lt)), rot: -0.08 });
  } },
  { at: 'd5', draw(g, lt, D, S) { night(g); phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt, viewers: ramp(lt, 0, D + 2, 120000, 200000), title: 'ジャスティス鬼塚【生】通り魔の女、ついに確保！', video: (q, vw, vh) => captureCam(q, vw, vh, lt), comments: PRAISE.slice(0, 6).map(([n, s], i) => ({ t: 0.6 + i * 0.4, name: n, text: s, av: i + 2 })) }), { rot: noise1(lt * 8, 3) * 0.015 }); } },
  { at: 'd6', draw(g, lt, D, S) {
    bg(g, '#120806', '#060304'); bigCounter(g, 540, 400, ramp(lt, 0, 1.6, 190000, 200000), { label: '同時視聴', size: 140 });
    const R = rng(12); for (let i = 0; i < 26; i++) { const t0 = 0.3 + i * 0.13, a = inv(t0, t0 + 0.2, lt); if (a <= 0) continue; text(g, PRAISE[i % PRAISE.length][1], 220 + R() * 640, 640 + R() * 480, { size: 30 + R() * 22, color: i % 5 === 0 ? K.orange : '#e9edf3', alpha: a * 0.9 }); }
  } },
  { at: 'e1', draw(g, lt, D, S) { night(g); g.save(); cam(g, { x: 540, y: 900, z: 1.0 }); phoneFrame(g, 190, 180, 700, 1260, (p, w, h) => deleteScreen(p, w, h, { k: clamp((lt - S.L('e1') - 1.6) / 1.6), img: (q, iw, ih) => selfiePhoto(q, iw, ih), ask: '投稿と写真を削除しますか？', done: '投稿と写真を削除しました' })); line(g, 1200, 1900, 860, 1470, 120, P.onizuka.top2); circ(g, 840, 1450, 54, C.skin); g.restore(); } },
  { at: 'turn', finish: { vignette: 0.8 }, draw(g, lt, D, S) { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1814'], [1, '#0a0908']]); glow(g, 540, 120, 600, 'rgba(255,230,180,1)', 0.18); const k = ease(clamp(lt / D)); g.save(); cam(g, { x: lerp(540, 600, k), y: 800, z: lerp(1.0, 1.25, k) }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: k < 0.5 ? 'wide' : 'narrow', brow: lerp(0.3, 0.9, k), mouth: k < 0.4 ? 'smile' : 'line', lightFrom: 'left', turn: 0.4 * k }); g.restore(); } },
  { at: 'e2', finish: { vignette: 0.85 }, draw(g, lt, D, S) {
    vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1814'], [1, '#0a0908']]);
    g.save(); cam(g, { x: 640, y: 780, z: slow(lt, D, 1.3, 1.42) }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.9, mouth: 'line', lightFrom: 'left', turn: 0.5, look: 0.8, talk: talking(lt, S, ['e2']) * 0.3 }); g.restore();
    mood(g, { red: 0.16 });
    if (lt > S.Le('e2') + 0.5) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const post = heads([['a1', '午後2時　ミサキの車', 2.2], ['b2', '午後8時', 1.8], ['d1', '午後10時　港の倉庫', 2.4]]);

const SFX = [
  { at: 'recap', type: 'stinger', vol: 0.5 },
  { at: 'r2', type: 'heartbeat', dur: 2.6, vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a0', off: 2.4, type: 'ping', vol: 0.5 },
  { at: 'a2', type: 'tap3', vol: 0.5 },
  { at: 'a3', off: 0.3, type: 'pop', vol: 0.6 },
  { at: 'a5', type: 'pingstorm', dur: 4.0, vol: 0.7 },
  { at: 'a6', type: 'subdrop', vol: 0.7 },
  { at: 'b1', type: 'engine', dur: 14, vol: 0.35 },
  { at: 'b4', off: -0.2, type: 'notif', vol: 0.7 },
  { at: 'b5', type: 'crowd', dur: 9, vol: 0.45 },
  { at: 'b5c', type: 'carstop', vol: 0.6 },
  { at: 'b5c', type: 'engine', dur: 3, vol: 0.5 },
  { at: 'b6', type: 'heartbeat', dur: 2.6, vol: 0.5 },
  { at: 'c1', type: 'ringtone', dur: 2.2, vol: 0.6 },
  { at: 'c1:end', off: -0.1, type: 'pickup', vol: 0.6 },
  { at: 'c2', type: 'roomtone', dur: 22, vol: 0.25 },
  { at: 'c6', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'd1', type: 'wind', dur: 8, vol: 0.35 },
  { at: 'd1', type: 'steps', dur: 3, vol: 0.5 },
  { at: 'd2', type: 'creak', vol: 0.5 },
  { at: 'd4', off: 0.6, type: 'hit', vol: 0.7 },
  { at: 'd5', type: 'crowd', dur: 6, vol: 0.3 },
  { at: 'd5', off: 0.1, type: 'stab', vol: 0.8 },
  { at: 'd6', type: 'pingstorm', dur: 3.4, vol: 0.6 },
  { at: 'e1', off: 1.4, type: 'tap3', vol: 0.4 },
  { at: 'e1:end', off: -0.6, type: 'zapoff', vol: 0.6 },
  { at: 'turn', type: 'heartbeat', dur: 3.2, vol: 0.7 },
  { at: 'e2:end', off: 0.5, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'recap', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'a0', mood: 'suspense' },
  { at: 'a5', mood: 'tension' },
  { at: 'b1', mood: 'uneasy' },
  { at: 'b4', mood: 'thriller' },
  { at: 'c1', mood: 'silence' },
  { at: 'c2', mood: 'dread' },
  { at: 'd1', mood: 'suspense' },
  { at: 'd5', mood: 'tension' },
  { at: 'e1', mood: 'dread' },
  { at: 'turn', mood: 'silence' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
