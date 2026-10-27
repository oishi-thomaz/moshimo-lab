// #拡散希望 第2話「潜伏先」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, mood, subBand } from '../../engine/noir.js';
import { K, short, avatar, postCard, phoneFrame, intercom } from '../../engine/sns.js';
import { viralPhoto, frontDoor, misakiRoom, sofaPhoto } from '../../engine/kakusets.js';
import { onizukaCam, chatScreen, recScreen, photoView, selfiePhoto, couplePhoto, crewPhoto, shelfClose, fireStairs, garage, carInside } from '../../engine/kakusets2.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase, endCard, chip } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep02.script.js';

const P = CAST2;
const cool = g => vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a3242'], [1, '#161b26']]);
const warm = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#4a3c36'], [1, '#2a221e']]); glow(g, 540, 200, 700, 'rgba(255,210,160,1)', 0.2); };
const dim = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#22262e'], [1, '#121418']]); glow(g, 300, 150, 600, 'rgba(210,235,245,1)', 0.12); };
const face = (g, who, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P[who], { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'left', ...o }); g.restore(); };
const nameCard = (g, a, n, sub) => { g.save(); g.globalAlpha = a; fillRR(g, 290, 330, 500, 130, 20, 'rgba(10,12,18,.88)'); text(g, n, 540, 380, { size: 48, color: '#fff' }); text(g, sub, 540, 432, { size: 30, color: '#c9ccd6' }); g.restore(); };
const recapTag = (g, a = 1) => { g.save(); g.globalAlpha = a; fillRR(g, 60, 90, 230, 64, 32, 'rgba(10,12,18,.85)'); text(g, '前回', 175, 123, { size: 34, color: K.orange2 }); g.restore(); };
const selfieView = (p, w, h) => photoView(p, w, h, { img: (q, iw, ih) => selfiePhoto(q, iw, ih) });

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 2, title: '潜伏先',
    back: g2 => { g2.save(); cam(g2, { x: 300, y: 700, z: 1.4 }); misakiRoom(g2, { t: 3, redDot: 1 }); g2.restore(); },
    face: g2 => close(g2, P.akari, { y: 1560, s: 3.0, eyes: 'wide', brow: -0.7, mouth: 'line', turn: -0.4, look: -1, lightFrom: 'left' }),
    pill: { text: '犯人の女、現在ここに潜伏中' },
  });
}

const SHOTS = [
  // ── 前回
  { at: 'recap', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 960, z: slow(lt, 8, 1.05, 1.15) }); g.translate(-460, 260); sofaPhoto(g, 2000, 1400); g.restore();
    g.save(); g.globalAlpha = inv(S.L('r1') + 2.0, S.L('r1') + 2.4, lt); fillRR(g, 290, 330, 500, 120, 60, K.orange); text(g, '1分前に投稿', 540, 390, { size: 56, color: '#fff' }); g.restore();
    recapTag(g);
  } },
  { at: 'r2', finish: { vignette: 0.75 }, draw(g, lt, D, S) { const k = ease(clamp(lt / (D + 0.6))); g.save(); cam(g, { x: lerp(540, 220, k), y: lerp(1000, 420, k), z: lerp(1.0, 2.4, k) }); misakiRoom(g, { t: lt, redDot: 0.6 }); g.restore(); recapTag(g, 1 - inv(D - 0.3, D, lt)); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. 赤い光
  { at: 'a1', finish: { vignette: 0.7 }, draw(g, lt, D, S) { g.save(); cam(g, { x: 260, y: 360, z: slow(lt, D, 2.6, 3.4) }); misakiRoom(g, { t: lt, redDot: 0.6 }); g.restore(); } },
  { at: 'a2', finish: { vignette: 0.7 }, draw(g, lt, D, S) { shelfClose(g, { t: lt, hand: inv(0.6, D, lt) * 0.92, dot: 0.6 }); } },
  { at: 'a3', finish: { vignette: 0.65 }, draw(g, lt, D, S) { g.save(); cam(g, { x: 560, y: 760, z: slow(lt, D, 1.2, 1.35) }); shelfClose(g, { t: lt, hand: 1, pull: ease(inv(0.1, 1.2, lt)) * 0.15, dot: 1 }); g.restore(); } },
  { at: 'a4', finish: { vignette: 0.7 }, draw(g, lt, D, S) { warm(g); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.08) }); phoneFrame(g, 190, 220, 700, 1300, (p, w, h) => recScreen(p, w, h, { t: lt }), { rot: noise1(lt * 3, 2) * 0.03 }); g.restore(); mood(g, { red: 0.08 * inv(1.5, 3, lt) }); } },

  // ── 2. 健人のスマホ
  { at: 'b1', draw(g, lt, D, S) { warm(g); face(g, 'misaki', lt, D, S, ['b1'], { eyes: 'normal', brow: -0.2, mouth: 'line', lightFrom: 'left' }); } },
  { at: 'b2', draw(g, lt, D, S) { warm(g); face(g, 'akari', lt, D, S, ['b2'], { eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', turn: 0.3, look: 0.6 }); g.save(); g.translate(760, 1500); g.rotate(-0.2); fillRR(g, -90, -160, 180, 320, 24, '#0d0e12'); circ(g, -40, -110, 14, '#2a2c34'); g.restore(); } },
  { at: 'b3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { warm(g); face(g, 'misaki', lt, D, S, ['b3'], { eyes: 'wide', brow: -0.7, mouth: 'line', lightFrom: 'left', z1: 1.12 }); } },
  { at: 'b4', draw(g, lt, D, S) {
    warm(g); g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.0, 1.06) });
    g.save(); g.translate(540, 880); g.rotate(-0.03); fillRR(g, -430, -330, 860, 660, 10, '#f4f0e6'); g.save(); rr(g, -400, -300, 800, 560, 4); g.clip(); g.translate(-400, -300); couplePhoto(g, 800, 560); g.restore(); g.restore();
    g.restore(); nameCard(g, inv(0.3, 0.7, lt), '山内健人（26）', 'ミサキの彼氏');
    const a = inv(S.L('b4') + 2.2, S.L('b4') + 2.6, lt); g.save(); g.globalAlpha = a; g.translate(820, 1300); g.rotate(0.1); fillRR(g, -60, -30, 120, 60, 12, '#c9a24a'); circ(g, -60, 0, 40, '#c9a24a'); circ(g, -60, 0, 16, '#4a3c36'); g.restore();
  } },
  { at: 'b5', draw(g, lt, D, S) { warm(g); phoneFrame(g, 140, 200, 800, 1260, (p, w, h) => chatScreen(p, w, h, { name: '鬼塚さん', av: 'onizuka', t: lt, msgs: [{ text: 'カメラ、ちゃんと回ってるか？', t: -1, time: '11:40' }, { me: true, text: '回ってます', t: -1, time: '11:41' }, { text: 'あと5分で着く。\n女を、部屋から出すな。', t: S.L('b6') - S.L('b5') - 0.3, time: '12:04' }] })); } },
  { at: 'b7', finish: { vignette: 0.7 }, draw(g, lt, D, S) { warm(g); face(g, 'misaki', lt, D, S, ['b7'], { eyes: 'narrow', brow: -0.8, mouth: 'line', lightFrom: 'left' }); mood(g, { desat: 0.35 }); } },
  { at: 'b8', draw(g, lt, D, S) { bg(g); postCard(g, 60, 360, 960, { name: 'ジャスティス鬼塚', handle: '@justice_onizuka', avatar: 'onizuka', text: '今日の撮影も最高でした！\nカメラマンのケントくん、いつもありがとう', img: (p, w, h) => crewPhoto(p, w, h), rt: 1200, likes: 18000, views: 420000, time: '3日' }); g.save(); g.globalAlpha = inv(0.8, 1.2, lt); g.lineWidth = 10; g.strokeStyle = K.orange; g.beginPath(); g.ellipse(810, 860, 150, 200, 0, 0, 7); g.stroke(); g.restore(); } },

  // ── 3. 逃げる
  { at: 'bell', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 960, z: 1.0 }); frontDoor(g, { t: lt, pound: 0, shadows: 0 }); g.restore(); sfxText(g, 'ピンポーン', 540, 300, { size: 110, color: '#f4f6f8', alpha: inv(0.0, 0.2, lt), rot: -0.05 }); intercom(g, 540, 820, 1.4 * easeOut(inv(0.3, 0.7, lt)) + 0.01, { t: lt, ring: 1, video: (p, w, h) => onizukaCam(p, w, h, lt) }); } },
  { at: 'c1', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 960, z: 1.0 }); frontDoor(g, { t: lt, shadows: 0 }); g.restore(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H); intercom(g, 540, 760, 1.6, { t: lt, ring: 1, video: (p, w, h) => { onizukaCam(p, w, h, lt); p.save(); p.globalCompositeOperation = 'multiply'; vgrad(p, 0, 0, w, h, [[0, '#9ab'], [1, '#789']]); p.restore(); } }); text(g, 'エントランス', 540, 400, { size: 40, color: '#c9ccd6' }); } },
  { at: 'c2', draw(g, lt, D, S) { warm(g); face(g, 'misaki', lt, D, S, ['c2'], { eyes: 'wide', brow: -0.5, mouth: 'line', lightFrom: 'left', turn: 0.4, look: 1 }); speedLines(g, 540, 760, { inner: 520, t: lt, color: 'rgba(255,255,255,.18)' }); } },
  { at: 'c3', draw(g, lt, D, S) { g.save(); cam(g, { x: 700, y: 1000, z: 1.0 }); fireStairs(g, { t: lt + 0.6 }); g.restore(); } },
  { at: 'c4', finish: { vignette: 0.7 }, draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1100, z: slow(lt, D, 1.0, 1.08) }); garage(g, { t: lt }); g.restore(); } },
  { at: 'c5', finish: { vignette: 0.75 }, draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1150, z: 1.05 }); garage(g, { t: lt, pass: lt * 0.38 }); g.restore(); } },
  { at: 'c6', draw(g, lt, D, S) { carInside(g, { t: lt, akari: { eyes: 'wide', brow: -0.6 }, misaki: { eyes: 'narrow', brow: -0.3, turn: 0, look: 0.6, talk: talking(lt, S, ['c6']) * 0.4 } }); } },

  // ── 4. あの夜の写真
  { at: 'd1', draw(g, lt, D, S) { dim(g); face(g, 'misaki', lt, D, S, ['d1'], { eyes: 'closed', brow: -0.8, mouth: 'frown', lightFrom: 'left' }); } },
  { at: 'd1b', draw(g, lt, D, S) { carInside(g, { t: lt, akari: { turn: 0.5, look: 1, eyes: 'narrow', brow: -0.2, talk: talking(lt, S, ['d1b']) * 0.4 }, misaki: { eyes: 'closed', brow: -0.8, mouth: 'frown' } }); } },
  { at: 'd2', draw(g, lt, D, S) { dim(g); face(g, 'akari', lt, D, S, [], { eyes: 'narrow', brow: -0.7, mouth: 'line', lightFrom: 'right' }); } },
  { at: 'd3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { dim(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,255,255,.22)' }); face(g, 'akari', lt, D, S, [], { eyes: 'wide', brow: -0.2, mouth: 'open', lightFrom: 'right', z1: 1.12 }); } },
  { at: 'd4', draw(g, lt, D, S) {
    const k = ease(inv(0.2, 2.2, lt));
    g.save(); cam(g, { x: lerp(540, 680, k), y: lerp(960, 470, k), z: lerp(1.0, 2.0, k) }); g.translate(-460, 260); viralPhoto(g, 2000, 1400, { circleA: 0 }); g.restore();
    mood(g, { desat: 0.4 });
    g.save(); g.globalAlpha = inv(1.6, 2.1, lt); g.lineWidth = 8; g.strokeStyle = K.orange; g.setLineDash([18, 12]); g.beginPath(); g.arc(540, 960, 170, 0, 7); g.stroke(); g.restore();
  } },
  { at: 'd5', draw(g, lt, D, S) { dim(g); g.save(); g.globalAlpha = inv(0.1, 0.6, lt); phoneFrame(g, 140, 160, 800, 1360, selfieView); g.restore(); } },
  { at: 'e1', draw(g, lt, D, S) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.06) }); phoneFrame(g, 140, 160, 800, 1360, selfieView); g.restore(); } },
  { at: 'e2', finish: { vignette: 0.6 }, draw(g, lt, D, S) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const k = ease(inv(0.2, 2.4, lt)); g.save(); cam(g, { x: lerp(540, 760, k), y: lerp(960, 820, k), z: lerp(1.0, 2.6, k) }); phoneFrame(g, 140, 160, 800, 1360, selfieView); g.restore(); } },
  { at: 'e3', finish: { vignette: 0.7 }, draw(g, lt, D, S) {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.save(); cam(g, { x: 790, y: 760, z: slow(lt, D + 1, 3.2, 3.8) }); phoneFrame(g, 140, 160, 800, 1360, selfieView); g.restore();
    g.save(); g.globalAlpha = inv(0.8, 1.2, lt); g.lineWidth = 8; g.strokeStyle = K.orange; g.setLineDash([16, 10]); g.beginPath(); g.arc(560, 700, 150, 0, 7); g.stroke(); g.restore();
  } },
  { at: 'turn', finish: { vignette: 0.8 }, draw(g, lt, D, S) {
    // 暗がりの顔を「補正」していく
    g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
    const k = ease(clamp(lt / D));
    g.save(); g.globalAlpha = lerp(0.25, 0.85, k); cam(g, { x: 540, y: 800, z: lerp(1.25, 1.05, k) }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.8, mouth: 'line', lightFrom: 'left' }); g.restore();
    const R = rng(Math.floor(lt * 12)); g.save(); g.globalAlpha = lerp(0.45, 0.15, k); for (let i = 0; i < 1600; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * W, R() * H, 5, 5); } g.restore();
    text(g, '補正中…', 540, 280, { size: 40, color: K.orange2, alpha: 1 - k });
  } },
  { at: 'e4', finish: { vignette: 0.8 }, draw(g, lt, D, S) {
    g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = 0.9; cam(g, { x: 540, y: 800, z: slow(lt, D, 1.05, 1.16) }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'narrow', brow: 0.8, mouth: 'line', lightFrom: 'left' }); g.restore();
    const R = rng(Math.floor(lt * 12)); g.save(); g.globalAlpha = 0.12; for (let i = 0; i < 1600; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * W, R() * H, 5, 5); } g.restore();
    mood(g, { red: 0.15 * inv(S.Le('e4') - 1.2, S.Le('e4'), lt) });
    if (lt > S.Le('e4') + 0.5) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const post = heads([['a1', '昼前　ミサキの部屋', 2.2], ['c4', '地下駐車場', 2.0]]);

const SFX = [
  { at: 'recap', type: 'stab', vol: 0.5 },
  { at: 'r2', type: 'heartbeat', dur: 2.4, vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 14, vol: 0.3 },
  { at: 'a1', type: 'faucet', dur: 22, vol: 0.15 },
  { at: 'a2', off: 0.6, type: 'rustle', vol: 0.6 },
  { at: 'a3', off: 0.2, type: 'scrape', vol: 0.5 },
  { at: 'a4', off: 0.3, type: 'stinger', vol: 0.6 },
  { at: 'b1', off: -0.5, type: 'creak', vol: 0.5 },
  { at: 'b3', type: 'subdrop', vol: 0.6 },
  { at: 'b6', off: -0.3, type: 'notif', vol: 0.8 },
  { at: 'b8', type: 'stab', vol: 0.7 },
  { at: 'bell', type: 'chime', vol: 0.9 },
  { at: 'bell', off: 0.3, type: 'crowd', dur: 12, vol: 0.4 },
  { at: 'c2', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'c3', type: 'steps', dur: 4, vol: 0.7 },
  { at: 'c4', type: 'roomtone', dur: 30, vol: 0.35 },
  { at: 'c5', type: 'steps', dur: 4, vol: 0.4 },
  { at: 'c5', type: 'heartbeat', dur: 4, vol: 0.5 },
  { at: 'd3', type: 'riser', vol: 0.5 },
  { at: 'd4', off: 1.6, type: 'ping', vol: 0.5 },
  { at: 'd5', off: 0.2, type: 'pop', vol: 0.6 },
  { at: 'e2', type: 'ticks', dur: 2.4, vol: 0.4 },
  { at: 'e3', off: 0.8, type: 'stinger', vol: 0.7 },
  { at: 'turn', type: 'glitch', vol: 0.6 },
  { at: 'turn', type: 'heartbeat', dur: 3.2, vol: 0.7 },
  { at: 'e4:end', off: 0.5, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'recap', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b5', mood: 'dread' },
  { at: 'bell', mood: 'thriller' },
  { at: 'c6', mood: 'silence' },
  { at: 'd1', mood: 'calm' },
  { at: 'd3', mood: 'suspense' },
  { at: 'e2', mood: 'dread' },
  { at: 'turn', mood: 'silence' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
