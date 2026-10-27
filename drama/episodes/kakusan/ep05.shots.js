// #拡散希望 第5話「#拡散希望」（最終話）— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, mood, subBand } from '../../engine/noir.js';
import { K, short, appIcon, avatar, postCard, bigCounter, trendList, phoneFrame, liveView } from '../../engine/sns.js';
import { akariRoom } from '../../engine/kakusets.js';
import { parkingLot } from '../../engine/noirsets2.js';
import { selfiePhoto, girlPhoto, warehouse, tiedChair, droppedPhone, sirenDoor, chatScreen, thumbOver, nightSky, acctScreen } from '../../engine/kakusets2.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase, endCard, chip } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep05.script.js';

const P = CAST2;
const dark = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a1814'], [1, '#0a0908']]); glow(g, 540, 120, 600, 'rgba(255,230,180,1)', 0.18); };
const night = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1a2030'], [1, '#0d1018']]); glow(g, 800, 200, 600, 'rgba(255,210,150,1)', 0.08); };
const morning = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#4a5466'], [1, '#2a303c']]); glow(g, 760, 260, 700, 'rgba(230,240,255,1)', 0.18); };
const face = (g, who, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P[who], { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'left', ...o }); g.restore(); };
const ramp = (lt, a, b, n0, n1) => lerp(n0, n1, easeOut(inv(a, b, lt)));
const recapTag = (g, a = 1) => { g.save(); g.globalAlpha = a; fillRR(g, 60, 90, 230, 64, 32, 'rgba(10,12,18,.85)'); text(g, '前回', 175, 123, { size: 34, color: K.orange2 }); g.restore(); };
const knife = (g, x, y, rot, s = 1, a = 0.6) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); line(g, 0, 140, 0, 0, 60, '#1a1a1e'); poly(g, [[-22, 0], [22, 0], [6, -330], [-2, -340]], '#dfe6ee'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -200, 160, 'rgba(230,240,255,1)', a); g.restore(); g.restore(); };
function confessCam(g, w, h, t, { talk = 0 } = {}) { g.save(); g.scale(w / 1080, h / 1920); warehouse(g, { t, lamp: 1, ring: 0.3 }); g.save(); cam(g, { x: 540, y: 1150, z: 1.25 }); tiedChair(g, 540, 1700, 1.3, { eyes: 'normal', brow: -0.2, talk }); g.restore(); g.restore(); }
const MISAKI_POST = 'これは事件の夜、23時12分に撮られた写真です。\n後ろに写っているのは、鬼塚レオ。#拡散希望';
const FLIP = [['名無し', 'これ、本物じゃないか'], ['ゆう', 'さっきの配信、本当だったんだ'], ['あやの', '鬼塚の顔、写ってる…'], ['k_k', '拡散します'], ['しゅん', '鬼塚が犯人？'], ['みー', '拡散希望'], ['正義マン', '警察まだ？'], ['ぽぽ', 'アカリさん無事？']];
const AFTER = [['名無し', '人違いだったのか'], ['k_k', 'まあ、まぎらわしい写真だったしな'], ['正義マン', '鬼塚信じてたのに'], ['ゆう', 'まあ仕方ないよね']];

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 5, title: '#拡散希望',
    back: g2 => { g2.save(); g2.translate(0, 300); girlPhoto(g2, 1080, 760, { circleA: 1 }); g2.restore(); },
    face: g2 => close(g2, P.akari, { y: 1560, s: 3.0, eyes: 'normal', brow: -0.4, mouth: 'line', lightFrom: 'right', phoneLight: true }),
    pill: { text: '鬼塚の妹はこの女 #拡散希望' },
  });
}

const SHOTS = [
  // ── 前回
  { at: 'recap', draw(g, lt, D, S) { dark(g); phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt, viewers: 230000, title: 'ジャスティス鬼塚【生】通り魔の女、自白配信', video: (q, vw, vh) => confessCam(q, vw, vh, lt, { talk: talking(lt, S, ['r1']) * 0.4 }), comments: [['名無し', 'え？'], ['k_k', '鬼塚？']].map(([n, s], i) => ({ t: 0.6 + i * 0.6, name: n, text: s, av: i + 2 })) })); recapTag(g); } },
  { at: 'r2', finish: { vignette: 0.85 }, draw(g, lt, D, S) { dark(g); g.save(); cam(g, { x: 540, y: 820, z: 1.1 }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'narrow', brow: 1, mouth: 'grit', lightFrom: 'left' }); g.restore(); knife(g, 760, 1350, -0.6); mood(g, { red: 0.15 }); recapTag(g, 1 - inv(D - 0.3, D, lt)); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. 配信が切れた理由
  { at: 'a1', finish: { vignette: 0.8 }, draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: 1.15 }); warehouse(g, { t: lt }); const k = figure(g, P.onizuka, { x: 540, y: 1750, s: 1.6, arms: [20, -20, 170, -10], eyes: 'narrow', brow: 1, mouth: 'grit' }); knife(g, k.hr[0], k.hr[1] - 20, 0.2, 0.7, 0.8); g.restore(); mood(g, { red: 0.12 }); } },
  { at: 'a2', draw(g, lt, D, S) { dark(g); speedLines(g, 540, 760, { inner: 420, t: lt, color: 'rgba(255,255,255,.3)' }); face(g, 'kento', lt, D, S, ['a2'], { eyes: 'wide', brow: -0.9, mouth: 'open', z0: 1.1, z1: 1.2 }); } },
  { at: 'a3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: 1.1 + noise1(lt * 20, 2) * 0.02 }); warehouse(g, { t: lt });
    const k = ease(inv(0, 0.5, lt));
    figure(g, P.onizuka, { x: lerp(540, 470, k), y: 1750, s: 1.5, turn: 0.5, look: 1, arms: [60, -40, 140, -30], eyes: 'wide', brow: 0.8, mouth: 'grit' });
    figure(g, P.kento, { x: lerp(1100, 680, k), y: 1740, s: 1.5, turn: -0.6, look: -1, arms: [100, -20, 110, -30], eyes: 'narrow', brow: -0.9, mouth: 'grit' });
    g.restore(); speedLines(g, 600, 900, { inner: 380, t: lt, color: 'rgba(255,255,255,.25)' });
    sfxText(g, 'ドンッ', 760, 420, { size: 140, color: K.orange, alpha: inv(0.4, 0.5, lt), rot: 0.1, shake: 6, t: lt });
  } },
  { at: 'a3b', draw(g, lt, D, S) { dark(g); g.save(); cam(g, { x: 540 + noise1(lt * 30, 1) * 14, y: 800, z: 1.15 }); close(g, P.onizuka, { y: 760, s: 4.0, eyes: 'wide', brow: 1, mouth: 'grit', talk: talking(lt, S, ['a3b']) * 0.5, lightFrom: 'left', turn: 0.5 }); g.restore(); mood(g, { red: 0.12 }); } },
  { at: 'a4', draw(g, lt, D, S) { droppedPhone(g, { t: lt }); } },

  // ── 2. #拡散希望
  { at: 'b1', draw(g, lt, D, S) { night(g); face(g, 'misaki', lt, D, S, [], { eyes: 'narrow', brow: -0.6, mouth: 'line', phoneLight: true, lightFrom: 'right' }); g.save(); g.translate(540, 1500); fillRR(g, -180, -60, 360, 120, 20, '#0d0e12'); g.restore(); } },
  { at: 'b2', draw(g, lt, D, S) { night(g); postCard(g, 60, 280, 960, { name: 'ミサキ', handle: '@misaki_s', avatar: 4, text: MISAKI_POST, img: (p, w, h) => selfiePhoto(p, w, h), imgH: 500, rt: ramp(lt, 0.4, D + 4, 10, 52000), likes: ramp(lt, 0.4, D + 4, 20, 90000), views: ramp(lt, 0.4, D + 4, 300, 2400000), time: 'たった今' }); } },
  { at: 'b2b', draw(g, lt, D, S) { bg(g); for (let i = 0; i < 3; i++) { const a = inv(0.2 + i * 0.7, 0.4 + i * 0.7, lt); if (a <= 0) continue; g.save(); g.globalAlpha = a; postCard(g, 60 + (i % 2) * 20, 240 + i * 300, 940, { name: FLIP[i][0], handle: '@' + ['nanashi', 'yu_u', 'ayano', 'k_k'][i], avatar: i + 2, text: FLIP[i][1], rt: 2000 + i * 900, likes: 9000 + i * 1200, views: 300000, time: '1分' }); g.restore(); } } },
  { at: 'b3', draw(g, lt, D, S) {
    bg(g, '#1a0c06', '#0a0504'); const n = ramp(lt, 0, D + 1, 52000, 1200000);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 540, 820, 900, 'rgba(255,106,43,1)', 0.15 + 0.25 * inv(0, D, lt)); g.restore();
    bigCounter(g, 540, 820, n, { size: 200 });
    const R = rng(21); for (let i = 0; i < 20; i++) { const t0 = 0.4 + i * 0.18, a = inv(t0, t0 + 0.2, lt); if (a <= 0) continue; text(g, FLIP[i % FLIP.length][1], 200 + R() * 680, 1020 + R() * 120 + (i % 2) * 0, { size: 28 + R() * 14, color: '#f4e4da', alpha: a * 0.8 }); }
  } },
  { at: 'storm', draw(g, lt, D, S) { bg(g); trendList(g, 60, 320, 960, [{ name: '#拡散希望', n: 1200000, hot: true, t: 0.1 }, { name: '鬼塚レオ', n: 840000, t: 0.4 }, { name: '通り魔 真犯人', n: 520000, t: 0.7 }, { name: '自白配信', n: 310000, t: 1.0 }], lt); } },

  // ── 3. 逮捕
  { at: 'c1', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); sirenDoor(g, { t: lt, k: ease(inv(0.3, 2.0, lt)) }); g.restore(); } },
  { at: 'c2', draw(g, lt, D, S) { dark(g); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 200, 600, 500, 'rgba(255,40,40,1)', 0.15 * (0.5 + 0.5 * Math.sin(lt * 7))); glow(g, 900, 600, 500, 'rgba(60,110,255,1)', 0.15 * (0.5 + 0.5 * Math.sin(lt * 7 + 3))); g.restore(); face(g, 'makabe', lt, D, S, ['c2'], { eyes: 'narrow', brow: 0.2, mouth: 'line' }); } },
  { at: 'c3', draw(g, lt, D, S) { dark(g); face(g, 'onizuka', lt, D, S, ['c3'], { eyes: 'narrow', brow: 0.6, mouth: 'smile', turn: 0.3, look: 0.6 }); } },
  { at: 'c4', draw(g, lt, D, S) { dark(g); face(g, 'makabe', lt, D, S, ['c4', 'c5'], { eyes: 'narrow', brow: 0.3, mouth: 'line', turn: -0.2, look: -0.4 }); } },
  { at: 'c5', draw(g, lt, D, S) {
    const sw = S.L('c5') + (S.Le('c5') - S.L('c5')) * 0.4;
    if (lt < sw) { dark(g); face(g, 'makabe', lt, D, S, ['c5'], { eyes: 'narrow', brow: 0.3, mouth: 'line', turn: -0.2, look: -0.4 }); g.save(); g.translate(800, 960); g.rotate(0.08); phoneFrame(g, -150, -260, 300, 520, (p, w, h) => { p.save(); p.scale(0.62, 0.62); acctScreen(p, w / 0.62, h / 0.62, { t: 9 }); p.restore(); }); g.restore(); }
    else { dark(g); face(g, 'onizuka', lt, D, S, [], { eyes: 'wide', brow: -0.2, mouth: 'line', sweat: lt * 1.5 }); }
  } },
  { at: 'c6', draw(g, lt, D, S) {
    const sw = S.L('c6') + (S.Le('c6') - S.L('c6')) * 0.35;
    dark(g);
    if (lt < sw) face(g, 'makabe', lt, D, S, ['c6'], { eyes: 'normal', brow: -0.1, mouth: 'line', turn: 0.4, look: 1 });
    else face(g, 'akari', lt, D, S, [], { eyes: 'wide', brow: -0.3, mouth: 'line', lightFrom: 'left' });
  } },
  { at: 'c7', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1050, z: 1.0 }); warehouse(g, { t: lt }); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 900, 900, 600, 'rgba(255,240,220,1)', 0.25); g.restore(); figure(g, P.misaki, { x: lerp(1100, 660, ease(clamp(lt / 1.6))), y: 1700, s: 1.35, walk: lt * 2, turn: -0.6, look: -1, arms: [60, -30, 80, -40], eyes: 'wide', brow: -0.6, mouth: 'open', talk: talking(lt, S, ['c7']) * 0.5 }); figure(g, P.akari, { x: 360, y: 1700, s: 1.3, turn: 0.5, look: 1, arms: [20, 0, 40, -20], eyes: 'wide', brow: -0.4 }); g.restore(); } },
  { at: 'c8', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 900, z: slow(lt, D, 1.4, 1.5) }); warehouse(g, { t: lt }); glow(g, 540, 900, 500, 'rgba(255,230,190,1)', 0.15);
    figure(g, P.akari, { x: 480, y: 1700, s: 1.35, turn: 0.4, look: 1, arms: [60, -110, 80, -120], eyes: 'closed', brow: -0.6, mouth: 'frown' });
    figure(g, P.misaki, { x: 610, y: 1700, s: 1.35, turn: -0.5, look: -1, arms: [80, -120, 60, -110], eyes: 'closed', brow: -0.9, mouth: 'open' });
    g.restore();
  } },
  { at: 'c9', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); parkingLot(g, { t: lt, siren: 1, patrol: 1, dawn: 0.2 }); figure(g, P.kento, { x: lerp(300, 520, ease(clamp(lt / D))), y: 1640, s: 1.0, walk: lt * 1.0, turn: 0.4, look: 1, lookY: 0.7, arms: [10, 0, 10, 0], eyes: 'narrow', brow: -0.7, mouth: 'line' }); g.restore(); } },

  // ── 4. その後
  { at: 'd1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D + 3, 1.0, 1.05) });
    phoneFrame(g, 140, 160, 800, 1580, (p, w, h) => {
      vgrad(p, 0, 0, w, h, [[0, '#2a3446'], [1, '#141a26']]); text(p, '9:15', w / 2, 230, { size: 170, color: '#f1f3f8', weight: 500 });
      const L = ['新しいフォロワー 2,400人', 'あなたがメンションされました', '取材のお願い', 'あなたの写真が引用されました'];
      const n = Math.min(L.length, Math.floor(lt * 2.5));
      for (let i = 0; i < n; i++) { const y = 330 + i * 135; fillRR(p, 30, y, w - 60, 120, 30, 'rgba(240,244,255,.14)'); appIcon(p, 90, y + 60, 34); text(p, L[(n - 1 - i) % L.length], 150, y + 60, { size: 30, color: '#fff', align: 'left', weight: 800 }); }
    }); g.restore();
  } },
  { at: 'd1b', draw(g, lt, D, S) { morning(g); phoneFrame(g, 140, 200, 800, 1260, (p, w, h) => chatScreen(p, w, h, { name: 'cafe hitotoki 店長', av: 'cafe', t: lt, msgs: [{ text: 'アカリちゃん、戻っておいで。\nみんな待ってるよ。', t: 0.3, time: '9:20' }] })); } },
  { at: 'd2', draw(g, lt, D, S) { bg(g); for (let i = 0; i < 3; i++) { const a = inv(0.2 + i * 0.9, 0.4 + i * 0.9, lt); if (a <= 0) continue; g.save(); g.globalAlpha = a; postCard(g, 60, 240 + i * 300, 960, { name: AFTER[i][0], handle: '@' + ['nanashi', 'k_k', 'seigiman', 'yu_u'][i], avatar: i + 2, text: AFTER[i][1], rt: 20 + i * 10, likes: 100 + i * 40, views: 3000, time: '3日' }); g.restore(); } } },
  { at: 'd3', draw(g, lt, D, S) {
    bg(g);
    for (let i = 0; i < 5; i++) { const y = 260 + i * 200, k = inv(0.3 + i * 0.35, 0.6 + i * 0.35, lt); fillRR(g, 60, y, 960, 170, 26, K.card);
      if (k < 1) { g.save(); g.globalAlpha = 1 - k; avatar(g, i + 2, 130, y + 85, 38); text(g, ['人殺し', '犯人雇ってた店はここです', '顔出せよ', '家族も特定しよ', '逃がすな'][i], 190, y + 85, { size: 40, color: K.text, align: 'left' }); g.restore(); }
      g.save(); g.globalAlpha = k; text(g, 'この投稿は削除されました', 540, y + 85, { size: 34, color: K.sub, weight: 500 }); g.restore(); }
  } },
  { at: 'd4', draw(g, lt, D, S) { morning(g); face(g, 'akari', lt, D, S, [], { eyes: 'narrow', brow: -0.3, mouth: 'line', phoneLight: true, lightFrom: 'right' }); } },
  { at: 'd5', draw(g, lt, D, S) { bg(g); postCard(g, 60, 300, 960, { name: '特定班のまる', handle: '@tokutei_maru', avatar: 3, text: '鬼塚の妹は、この女。#拡散希望', img: (p, w, h) => girlPhoto(p, w, h, { circleA: inv(0.6, 1.0, lt) }), imgH: 560, rt: ramp(lt, 0.2, D + 3, 800, 31000), likes: ramp(lt, 0.2, D + 3, 1200, 52000), views: ramp(lt, 0.2, D + 3, 30000, 1500000), hot: true, time: '5分' }); } },
  { at: 'd6', finish: { vignette: 0.7 }, draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D + 2, 1.6, 1.9) }); g.translate(-460, 260); girlPhoto(g, 2000, 1400, { circleA: 1 }); g.restore(); } },
  { at: 'd7', draw(g, lt, D, S) { thumbOver(g, { t: lt, near: ease(inv(0.3, D, lt)) * 0.85 }); } },
  { at: 'turn', finish: { vignette: 0.75 }, draw(g, lt, D, S) { thumbOver(g, { t: lt * 2, near: 0.85 + 0.03 * Math.sin(lt * 3) }); } },
  { at: 'd8', finish: { vignette: 0.8 }, draw(g, lt, D, S) {
    morning(g); face(g, 'akari', lt, D, S, [], { eyes: 'normal', brow: -0.2, mouth: 'line', lightFrom: 'right', z0: 1.08, z1: 1.2 });
    if (lt > S.Le('d8') + 0.6) { g.fillStyle = `rgba(0,0,0,${inv(S.Le('d8') + 0.6, S.Le('d8') + 1.2, lt)})`; g.fillRect(0, 0, W, H); }
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const post = heads([['b1', 'その頃　ミサキ', 2.0], ['d1', '3日後', 2.0]]);

const SFX = [
  { at: 'recap', type: 'hit', vol: 0.5 },
  { at: 'r2', type: 'scrape', vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'heartbeat', dur: 2, vol: 0.7 },
  { at: 'a2', type: 'stab', vol: 0.7 },
  { at: 'a3', off: 0.4, type: 'hit', vol: 0.9 },
  { at: 'a3', off: 0.5, type: 'impact', vol: 0.7 },
  { at: 'a4', type: 'clunk', vol: 0.7 },
  { at: 'a4', off: 0.2, type: 'glitch', vol: 0.5 },
  { at: 'b1', type: 'tap3', vol: 0.5 },
  { at: 'b2', off: 0.3, type: 'pop', vol: 0.6 },
  { at: 'b2b', type: 'pingstorm', dur: 3.0, vol: 0.5 },
  { at: 'b3', type: 'pingstorm', dur: 5.0, vol: 0.8 },
  { at: 'b3', type: 'riser', vol: 0.5 },
  { at: 'storm', type: 'impact', vol: 0.6 },
  { at: 'c1', type: 'siren', dur: 9, vol: 0.6 },
  { at: 'c1', off: 0.8, type: 'steps', dur: 2, vol: 0.5 },
  { at: 'c5', type: 'stab', vol: 0.5 },
  { at: 'c7', type: 'steps', dur: 1.5, vol: 0.6 },
  { at: 'c9', type: 'siren', dur: 5, vol: 0.3 },
  { at: 'd1', type: 'pingstorm', dur: 2.5, vol: 0.5 },
  { at: 'd1b', off: 0.3, type: 'notif', vol: 0.6 },
  { at: 'd3', type: 'zapoff', vol: 0.3 },
  { at: 'd5', off: 0.6, type: 'stab', vol: 0.7 },
  { at: 'd6', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'turn', type: 'heartbeat', dur: 3.4, vol: 0.7 },
  { at: 'd8:end', off: 0.9, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'recap', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'thriller' },
  { at: 'a4', mood: 'silence' },
  { at: 'b1', mood: 'suspense' },
  { at: 'b3', mood: 'tension' },
  { at: 'c1', mood: 'suspense' },
  { at: 'c7', mood: 'calm' },
  { at: 'd1', mood: 'uneasy' },
  { at: 'd5', mood: 'dread' },
  { at: 'turn', mood: 'silence' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
