// #拡散希望 第1話「特定」— 映像・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, cam, text, FONT } from '../../engine/core.js';
import { C, CAST2, figure, close, speedLines, sfxText, mood, subBand } from '../../engine/noir.js';
import { K, short, appIcon, avatar, postCard, bigCounter, trendList, phoneFrame, liveView, intercom, newsTV, callScreen } from '../../engine/sns.js';
import { akariRoom, viralPhoto, addrMap, frontDoor, aptExterior, backStreet, misakiRoom, sofaPhoto, morningSky } from '../../engine/kakusets.js';
import { runEpisode } from '../../engine/player.js';
import { talking, bg, slow, heads, cover as coverBase, endCard, chip } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

const P = CAST2;
const cool = g => vgrad(g, -300, -300, W + 600, H + 600, [[0, '#2a3242'], [1, '#161b26']]);
const warm = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#4a3c36'], [1, '#2a221e']]); glow(g, 540, 200, 700, 'rgba(255,210,160,1)', 0.2); };
const face = (g, who, lt, D, S, ids, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); close(g, P[who], { y: 760, s: 4.0, talk: talking(lt, S, ids) * 0.45, lightFrom: 'left', ...o }); g.restore(); };
const ramp = (lt, a, b, n0, n1) => lerp(n0, n1, easeOut(inv(a, b, lt)));
// 投稿：@正義の目
const eyePost = (g, y, txt, o = {}) => postCard(g, 60, y, 960, { name: '正義の目', handle: '@seigi_no_me', avatar: 'eye', text: txt, hot: true, time: o.time || '6時間', ...o });

// 鬼塚（インターホン越し・配信の映像）
function onizukaCam(g, w, h, t, { fish = 1, crowd = 1 } = {}) {
  morningSky(g, { y0: 0, h });
  fillRR(g, 0, h * 0.62, w, h * 0.4, 0, '#8a8a90');
  if (crowd) for (let i = 0; i < 6; i++) { const R = rng(i + 9); figure(g, { ...P.kento, top: ['#5a6070', '#7a6a5a', '#6a7a6a', '#4a5a7a', '#7a5a6a', '#5a5a5a'][i], hair: i % 2 ? 'parted' : 'messy' }, { x: w * (0.08 + i * 0.17), y: h * 1.02, s: w / 1080 * 0.9, phone: i % 2 === 0, arms: [10, 0, 40, -120], eyes: 'narrow', turn: (R() - 0.5) * 0.6, shadow: false }); }
  g.save(); g.translate(w * 0.5, h * 0.55); const s = w / 1080 * 3.0; g.scale(s / 4, s / 4); close(g, P.onizuka, { x: 0, y: 0, s: 4, mouth: 'open', talk: 0.5 + 0.5 * Math.abs(Math.sin(t * 12)), eyes: 'wide', brow: 0.5, lightFrom: 'left' }); g.restore();
  // 自撮り棒
  line(g, w * 0.85, h * 1.1, w * 0.72, h * 0.62, w * 0.012, '#111');
}

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 1, title: '特定',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1000, z: 1.05 }); akariRoom(g2, { t: 3 }); g2.restore(); },
    face: g2 => close(g2, P.akari, { y: 1560, s: 3.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', phoneLight: true }),
    pill: { text: '犯人はこの女 #拡散希望' },
  });
}

const notifs = ['あなたがメンションされました', 'あなたの写真が引用されました', 'あなたの名前がトレンド入りしました', '新しいメッセージ 24件', 'あなたがメンションされました', '知らない人から返信が届いています'];
const COMM1 = [['名無し', '早く出てこい'], ['ゆう', '顔出せよ'], ['特定班', '部屋の電気ついてる'], ['みー', '人殺し'], ['k_k', '鬼塚さん頑張って！'], ['正義マン', '通報した'], ['あやの', 'ほんまにこの人？'], ['名無し', '逃がすな'], ['しゅん', '家族も特定しよ'], ['ぽぽ', 'こわすぎ']];

const SHOTS = [
  // ── 冒頭：拡散
  { at: 'cold', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D + 3, 1.0, 1.05) });
    phoneFrame(g, 140, 160, 800, 1580, (p, w, h) => {
      vgrad(p, 0, 0, w, h, [[0, '#1a2234'], [1, '#0b0f1a']]);
      text(p, '7:02', w / 2, 230, { size: 170, color: '#f1f3f8', weight: 500 });
      const n = Math.min(notifs.length * 4, Math.floor(Math.pow(lt * 2.6, 1.5)));
      for (let i = 0; i < Math.min(n, 4); i++) { const k = n - 1 - i, y = 330 + i * 135; fillRR(p, 30, y, w - 60, 120, 30, 'rgba(240,244,255,.14)'); appIcon(p, 90, y + 60, 34); text(p, notifs[k % notifs.length], 150, y + 45, { size: 30, color: '#fff', align: 'left', weight: 800 }); text(p, 'たった今', w - 50, y + 45, { size: 24, color: 'rgba(255,255,255,.6)', align: 'right', weight: 500 }); text(p, `@seigi_no_me さんの投稿で ${short(300 + k * 1700)}件`, 150, y + 85, { size: 24, color: 'rgba(255,255,255,.75)', align: 'left', weight: 500 }); }
      if (n > 4) { fillRR(p, w / 2 - 170, 880, 340, 72, 36, K.orange); text(p, `ほか ${short(n * 37)}件`, w / 2, 916, { size: 36, color: '#fff' }); }
    }, { rot: noise1(lt * 30, 1) * 0.01 });
    g.restore();
  } },
  { at: 'o2', draw(g, lt, D, S) {
    bg(g);
    const rt = ramp(lt, 0.2, D + 1.2, 3200, 52000);
    eyePost(g, 360, '昨夜の駅前通り魔、犯人はこの女。\n#拡散希望', { img: (p, w, h) => viralPhoto(p, w, h, { circleA: inv(0.6, 1.0, lt) }), rt, likes: rt * 1.6, views: rt * 38 });
    bigCounter(g, 540, 300, rt, { alpha: inv(0.4, 0.8, lt), size: 110 });
  } },
  { at: 'o3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { cool(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,255,255,.25)' }); face(g, 'akari', lt, D, S, [], { eyes: 'wide', brow: -0.5, mouth: 'open', phoneLight: true, z1: 1.14 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030305', '#08090e'); cover(g, lt); } },

  // ── 1. 私は誰で、何があったか
  { at: 'a1', draw(g, lt, D, S) {
    cool(g); face(g, 'akari', lt, D, S, [], { eyes: 'narrow', brow: -0.3, mouth: 'line', phoneLight: true });
    const a = inv(0.3, 0.7, lt) * (1 - inv(D - 0.4, D, lt)); g.save(); g.globalAlpha = a; fillRR(g, 290, 330, 500, 130, 20, 'rgba(10,12,18,.88)'); text(g, '瀬戸アカリ（24）', 540, 380, { size: 48, color: '#fff' }); text(g, '駅前のカフェ店員', 540, 432, { size: 30, color: '#c9ccd6' }); g.restore();
  } },
  { at: 'a2', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.06) }); g.translate(-460, 260); viralPhoto(g, 2000, 1400, { circleA: 0 }); g.restore(); mood(g, { desat: 0.5 }); chip(g, '昨日　23時12分', inv(0.2, 0.5, lt)); } },
  { at: 'a3', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1000, z: 1.0 }); akariRoom(g, { t: lt, phone: 0 }); g.restore(); newsTV(g, 90, 420, 900, { t: lt, head: '駅前で男性刺され重体', sub: '刃物を持った人物が逃走' }); } },
  { at: 'a4', draw(g, lt, D, S) {
    // 掲げたスマホに寄る（第2話の伏線）
    const k = ease(inv(0.2, 2.2, lt));
    g.save(); cam(g, { x: lerp(540, 680, k), y: lerp(960, 470, k), z: lerp(1.0, 2.0, k) }); g.translate(-460, 260); viralPhoto(g, 2000, 1400, { circleA: 0 }); g.restore();
    mood(g, { desat: 0.4 });
    g.save(); g.globalAlpha = inv(2.0, 2.5, lt); g.lineWidth = 8; g.strokeStyle = K.orange; g.setLineDash([18, 12]); g.beginPath(); g.arc(540, 960, 170, 0, 7); g.stroke(); g.restore();
  } },

  // ── 2. 特定
  { at: 'b1', draw(g, lt, D, S) {
    bg(g); chip(g, '拡散から1時間', 1);
    postCard(g, 60, 360, 960, { name: '特定班のまる', handle: '@tokutei_maru', avatar: 3, text: '名前は瀬戸アカリ。駅前のカフェの店員。\nこのアカウント本人だろ', rt: ramp(lt, 0.3, D + 4, 400, 18000), likes: ramp(lt, 0.3, D + 4, 600, 30000), views: ramp(lt, 0.3, D + 4, 9000, 900000), time: '5時間',
      img: (p, w, h) => { vgrad(p, 0, 0, w, h, [[0, '#e9ecef'], [1, '#dfe3e8']]); avatar(p, 1, 110, h / 2, 70); text(p, 'アカリ', 210, h / 2 - 30, { size: 44, color: '#111', align: 'left' }); text(p, '@akari_cafe_0812', 210, h / 2 + 24, { size: 30, color: '#667', align: 'left', weight: 500 }); text(p, 'カフェ店員／ラテアート練習中', 210, h / 2 + 74, { size: 28, color: '#334', align: 'left', weight: 500 }); }, imgH: 300 });
  } },
  { at: 'b3', draw(g, lt, D, S) {
    bg(g); chip(g, '拡散から2時間', 1);
    const h1 = postCard(g, 60, 340, 960, { name: 'cafe hitotoki 駅前店', handle: '@hitotoki_ekimae', avatar: 'cafe', text: '本日は臨時休業とさせていただきます。', rt: 900, likes: 300, views: 120000, time: '4時間' });
    const R = ['従業員の管理どうなってんの', '犯人雇ってた店はここです'];
    R.forEach((s, i) => { const a = inv(0.4 + i * 0.8, 0.7 + i * 0.8, lt); if (a <= 0) return; g.save(); g.globalAlpha = a; postCard(g, 110, 340 + h1 + 20 + i * 195, 910, { name: ['名無し', 'ken'][i], handle: ['@nanashi', '@ken_k'][i], avatar: i + 2, text: s, rt: 50 + i * 30, likes: 200 + i * 90, views: 9000, time: '3時間' }); g.restore(); });
    sfxText(g, '炎上', 860, 300, { size: 120, color: K.orange, alpha: inv(1.0, 1.3, lt), rot: 0.1 });
  } },
  { at: 'b4', draw(g, lt, D, S) { bg(g, '#05060a', '#0b0d14'); chip(g, '拡散から3時間', 1); bigCounter(g, 540, 820, ramp(lt, 0, D + 3, 52000, 98000), { size: 160 }); } },
  { at: 'b5', draw(g, lt, D, S) { bg(g); eyePost(g, 340, '住所特定しました。\n〇〇ハイツ 203号室 #拡散希望', { img: (p, w, h) => addrMap(p, w, h), rt: ramp(lt, 0.2, D + 2, 1200, 31000), likes: 20000, views: 1500000, time: '3時間' }); } },
  { at: 'b6', finish: { vignette: 0.7 }, draw(g, lt, D, S) { cool(g); face(g, 'akari', lt, D, S, [], { eyes: 'wide', brow: -0.8, mouth: 'line', turn: 0.5, look: 1, z1: 1.12 }); mood(g, { red: 0.12 }); } },

  // ── 3. 家の前の配信者
  { at: 'bell', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 960, z: 1.0 }); frontDoor(g, { t: lt, pound: inv(0.4, 0.6, lt) }); g.restore();
    sfxText(g, 'ピンポーン', 540, 300, { size: 110, color: '#f4f6f8', alpha: inv(0.0, 0.2, lt), rot: -0.05 });
    sfxText(g, 'ドンドンドン', 760, 1150, { size: 90, color: K.orange, alpha: inv(0.5, 0.7, lt), rot: 0.08, shake: 6, t: lt });
  } },
  { at: 'c1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 960, z: 1.0 }); frontDoor(g, { t: lt, pound: 0.3 }); g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H);
    intercom(g, 540, 760, 1.6, { t: lt, ring: 1, video: (p, w, h) => { onizukaCam(p, w, h, lt); p.save(); p.globalCompositeOperation = 'multiply'; vgrad(p, 0, 0, w, h, [[0, '#9ab'], [1, '#789']]); p.restore(); } });
  } },
  { at: 'c2', draw(g, lt, D, S) {
    cool(g);
    phoneFrame(g, 110, 200, 860, 1180, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt, viewers: ramp(lt, 0, D + 6, 41000, 80000), video: (q, vw, vh) => onizukaCam(q, vw, vh, lt), comments: COMM1.slice(0, 5).map(([n, s], i) => ({ t: 0.3 + i * 0.5, name: n, text: s, av: i + 2 })) }));
    const a = inv(S.L('c2') + 1.6, S.L('c2') + 2.0, lt); g.save(); g.globalAlpha = a; fillRR(g, 260, 1410, 560, 60, 30, K.orange); text(g, 'フォロワー 80万人', 540, 1441, { size: 32, color: '#fff' }); g.restore();
  } },
  { at: 'c3', draw(g, lt, D, S) { cool(g); phoneFrame(g, 60, 160, 960, 1300, (p, w, h) => liveView(p, 0, 0, w, h, { t: lt + 3, viewers: ramp(lt, 0, D + 4, 80000, 110000), video: (q, vw, vh) => onizukaCam(q, vw, vh, lt, { crowd: 1 }), comments: COMM1.map(([n, s], i) => ({ t: 3 + i * 0.35, name: n, text: s, av: i + 2 })) })); } },
  { at: 'c4', finish: { vignette: 0.7 }, draw(g, lt, D, S) {
    bg(g, '#120806', '#060304');
    const v = ramp(lt, 0, 1.6, 110000, 120000);
    bigCounter(g, 540, 400, v, { label: '同時視聴', size: 140 });
    const R = rng(4); for (let i = 0; i < 26; i++) { const s = COMM1[i % COMM1.length][1], t0 = 0.3 + i * 0.12; const a = inv(t0, t0 + 0.2, lt); if (a <= 0) continue; const x = 230 + R() * 620, y = 640 + R() * 480; text(g, s, x, y, { size: 30 + R() * 22, color: i % 5 === 0 ? K.orange : '#e9edf3', alpha: a * 0.9, weight: 800 }); }
    mood(g, { red: 0.12 });
  } },

  // ── 4. 警察
  { at: 'd1', draw(g, lt, D, S) { cool(g); phoneFrame(g, 190, 200, 700, 1300, (p, w, h) => callScreen(p, w, h, { t: lt, name: '駅前警察署', mode: lt < S.L('d2') ? 'calling' : 'on', sub: `通話中 00:${String(Math.floor(Math.max(0, lt - S.L('d2')))).padStart(2, '0')}`, av: 5 })); } },
  { at: 'd4', finish: { vignette: 0.7 }, draw(g, lt, D, S) { cool(g); face(g, 'akari', lt, D, S, [], { eyes: 'wide', brow: -0.9, mouth: 'line', sweat: lt * 2, z1: 1.12 }); mood(g, { desat: 0.6 }); } },

  // ── 5. 逃げる
  { at: 'e1', draw(g, lt, D, S) { const sw = S.L('e1') + (S.Le('e1') - S.L('e1')) * 0.38; if (lt < sw) { cool(g); face(g, 'akari', lt, D, S, [], { eyes: 'narrow', brow: -0.9, mouth: 'grit' }); } else { g.save(); cam(g, { x: 560, y: 1000, z: 1.0 }); aptExterior(g, { t: lt, k: clamp((lt - sw - 0.3) / 1.2) }); g.restore(); } } },
  { at: 'e2', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 1150, z: 1.0 }); backStreet(g, { t: lt + 2 }); g.restore(); } },
  { at: 'e3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1300, z: slow(lt, D, 1.1, 1.25) }); backStreet(g, { t: lt, run: 0 }); g.restore();
    for (const [x, y] of [[180, 980], [860, 960], [700, 1100]]) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, 160, 'rgba(255,140,80,1)', 0.35 + 0.15 * Math.sin(lt * 5 + x)); g.restore(); }
  } },
  { at: 'e4', draw(g, lt, D, S) { morningSky(g); g.fillStyle = 'rgba(20,24,34,.6)'; g.fillRect(0, 0, W, H); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.06) }); close(g, P.akari, { y: 760, s: 4.0, eyes: 'narrow', brow: -0.6, mouth: 'line', phoneLight: true, lightFrom: 'right' }); const r = 264; fillRR(g, 540 - r * 0.72, 760 + r * 0.24, r * 1.44, r * 0.66, r * 0.3, '#e9ecef'); line(g, 540 - r * 0.72, 760 + r * 0.4, 540 - r * 0.95, 760 + r * 0.15, 6, '#c9ccd2'); line(g, 540 + r * 0.72, 760 + r * 0.4, 540 + r * 0.95, 760 + r * 0.15, 6, '#c9ccd2'); g.restore(); } },
  { at: 'e5', draw(g, lt, D, S) { cool(g); phoneFrame(g, 190, 200, 700, 1300, (p, w, h) => callScreen(p, w, h, { t: lt, name: 'ミサキ', mode: 'on', sub: `通話中 00:0${Math.min(9, Math.floor(lt))}`, av: 1 })); } },

  // ── 6. 親友の部屋
  { at: 'f1', draw(g, lt, D, S) {
    const sw = S.L('f1') + (S.Le('f1') - S.L('f1')) * 0.35;
    if (lt < sw) { warm(g); face(g, 'misaki', lt, D, S, [], { eyes: 'narrow', mouth: 'smile', lightFrom: 'left' }); g.save(); g.globalAlpha = inv(0.2, 0.5, lt); fillRR(g, 290, 330, 500, 130, 20, 'rgba(10,12,18,.88)'); text(g, '坂本ミサキ（24）', 540, 380, { size: 48, color: '#fff' }); text(g, '高校からの親友', 540, 432, { size: 30, color: '#c9ccd6' }); g.restore(); }
    else { g.save(); cam(g, { x: 540, y: 1150, z: 1.0 }); misakiRoom(g, { t: lt }); figure(g, P.akari, { x: 470, y: 1560, s: 1.1, turn: 0.3, arms: [20, -120, 20, -120], eyes: 'closed', brow: -0.8, mouth: 'frown' }); figure(g, P.misaki, { x: 640, y: 1560, s: 1.1, turn: -0.4, look: -1, arms: [10, 0, 100, -60], eyes: 'narrow', brow: -0.4, mouth: 'line' }); g.restore(); }
  } },
  { at: 'f2', draw(g, lt, D, S) { warm(g); face(g, 'misaki', lt, D, S, ['f2', 'f3'], { eyes: 'narrow', mouth: 'smile', brow: -0.2 }); } },
  { at: 'f3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: 1.0 }); misakiRoom(g, { t: lt, redDot: inv(1.2, 1.4, lt) * (1 - inv(1.9, 2.1, lt)) });
    figure(g, P.akari, { x: 520, y: 1480, s: 1.05, turn: 0.2, arms: [20, -110, 20, -110], eyes: 'narrow', brow: -0.4 }); fillRR(g, 220, 1160, 660, 170, 56, '#9aaab4');
    figure(g, P.misaki, { x: lerp(700, 900, ease(clamp(lt / D))), y: 1600, s: 1.15, walk: lt * 1.2, turn: 0.6, look: 1, arms: [10, 0, 10, 0], mouth: 'smile', talk: talking(lt, S, ['f3']) * 0.4 }); g.restore();
  } },
  { at: 'f4', draw(g, lt, D, S) { warm(g); face(g, 'akari', lt, D, S, [], { eyes: 'closed', brow: -0.3, mouth: 'line', lightFrom: 'left' }); } },

  // ── 7. 引き
  { at: 'g1', draw(g, lt, D, S) { warm(g); const v = noise1(lt * 60, 2) * 8; face(g, 'akari', lt, D, S, [], { eyes: lt < 0.4 ? 'closed' : 'wide', brow: -0.4, mouth: 'line', phoneLight: true, lightFrom: 'right', x: 540 + v * 0.2 }); sfxText(g, 'ヴヴッ', 820, 1160, { size: 90, color: '#f4f6f8', alpha: inv(0.1, 0.3, lt), rot: 0.1, shake: 4, t: lt }); } },
  { at: 'g2', draw(g, lt, D, S) { bg(g); eyePost(g, 360, '犯人の女、現在ここに潜伏中。\n#拡散希望', { img: (p, w, h) => sofaPhoto(p, w, h), rt: ramp(lt, 0.2, D + 6, 40, 9000), likes: ramp(lt, 0.2, D + 6, 60, 15000), views: ramp(lt, 0.2, D + 6, 2000, 400000), time: '1分' }); } },
  { at: 'g3', draw(g, lt, D, S) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D + 3, 1.0, 1.1) }); g.translate(-460, 260); sofaPhoto(g, 2000, 1400); g.restore(); mood(g, { red: 0.08 }); } },
  { at: 'g4', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D + 3, 1.1, 1.2) }); g.translate(-460, 260); sofaPhoto(g, 2000, 1400); g.restore();
    const a = inv(S.L('g4') + 2.2, S.L('g4') + 2.6, lt); g.save(); g.globalAlpha = a; fillRR(g, 290, 330, 500, 120, 60, K.orange); text(g, '1分前に投稿', 540, 390, { size: 56, color: '#fff' }); g.restore();
  } },
  { at: 'turn', finish: { vignette: 0.75 }, draw(g, lt, D, S) {
    // ソファから振り返る：本棚の上で赤い光
    const k = ease(clamp(lt / D));
    g.save(); cam(g, { x: lerp(540, 200, k), y: lerp(1000, 420, k), z: lerp(1.0, 2.6, k) }); misakiRoom(g, { t: lt, redDot: 0.6, bath: 1 }); g.restore();
  } },
  { at: 'g5', finish: { vignette: 0.8 }, draw(g, lt, D, S) {
    warm(g); face(g, 'akari', lt, D, S, [], { eyes: 'wide', brow: -1, mouth: 'line', turn: -0.5, look: -1, lookY: -0.4, z1: 1.16 });
    mood(g, { red: 0.2 * inv(0, 1, lt) });
    if (lt > S.Le('g5') + 0.5) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  } },
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const post = heads([['a3', '同じ朝　自分の部屋', 2.2], ['c1', '拡散から4時間', 2.2], ['f1', '昼前　ミサキの部屋', 2.4]]);

const SFX = [
  { at: 'cold', type: 'pingstorm', dur: 4.2, vol: 0.9 },
  { at: 'o2', type: 'stab', vol: 0.6 },
  { at: 'o2', off: 0.6, type: 'ping', vol: 0.5 },
  { at: 'o3', type: 'subdrop', vol: 0.8 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a2', type: 'wind', dur: 5, vol: 0.25 },
  { at: 'a3', type: 'roomtone', dur: 8, vol: 0.3 },
  { at: 'a4', off: 1.8, type: 'stinger', vol: 0.4 },
  { at: 'b1', type: 'pingstorm', dur: 2.0, vol: 0.5 },
  { at: 'b3', type: 'pingstorm', dur: 3.0, vol: 0.5 },
  { at: 'b3', off: 1.0, type: 'hit', vol: 0.5 },
  { at: 'b4', type: 'heartbeat', dur: 2.4, vol: 0.5 },
  { at: 'b5', type: 'ping', vol: 0.6 },
  { at: 'b6', type: 'subdrop', vol: 0.7 },
  { at: 'bell', type: 'chime', vol: 0.9 },
  { at: 'bell', off: 0.5, type: 'pound', n: 4, vol: 1.0 },
  { at: 'bell', off: 0.3, type: 'crowd', dur: 26, vol: 0.45 },
  { at: 'c3', off: 0.5, type: 'pound', n: 3, vol: 0.7 },
  { at: 'c4', type: 'pingstorm', dur: 3.0, vol: 0.6 },
  { at: 'd1', off: 0.4, type: 'dial', vol: 0.5 },
  { at: 'd4', type: 'heartbeat', dur: 2.8, vol: 0.6 },
  { at: 'e1', off: 2.0, type: 'steps', dur: 1.0, vol: 0.6 },
  { at: 'e2', type: 'steps', dur: 4.0, vol: 0.6 },
  { at: 'e2', type: 'wind', dur: 9, vol: 0.25 },
  { at: 'e5', off: -0.4, type: 'pickup', vol: 0.6 },
  { at: 'f1', type: 'roomtone', dur: 18, vol: 0.3 },
  { at: 'f3', off: 1.5, type: 'faucet', dur: 40, vol: 0.2 },
  { at: 'g1', type: 'vibrate', dur: 1.4, vol: 0.9 },
  { at: 'g2', type: 'ping', vol: 0.6 },
  { at: 'g3', off: 0.4, type: 'stinger', vol: 0.6 },
  { at: 'g4', off: 2.2, type: 'stab', vol: 0.7 },
  { at: 'turn', type: 'heartbeat', dur: 3.4, vol: 0.7 },
  { at: 'g5:end', off: 0.5, type: 'impact', vol: 1.0 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'thriller' },
  { at: 'b6', mood: 'silence' },
  { at: 'c1', mood: 'tension' },
  { at: 'd1', mood: 'dread' },
  { at: 'e1', mood: 'thriller' },
  { at: 'f1', mood: 'calm' },
  { at: 'g1', mood: 'silence' },
  { at: 'g3', mood: 'dread' },
  { at: 'end', off: 0.8, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post, subDraw: subBand, defGap: 0.35 });
