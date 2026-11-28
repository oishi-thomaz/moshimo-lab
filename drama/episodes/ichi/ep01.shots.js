// 位置情報 第1話「二台目」— 映像・効果音・BGM
// 手がかり（最終話までに回収）：2台目の通知はオフ／登録 2026年8月2日／3丁目14番（戸田）の雨戸／ソウタが玄関を見る／黄色い帽子
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag, rr } from '../../engine/core.js';
import { mood } from '../../engine/noir.js';
import { living, nightSky } from '../../engine/noirsets.js';
import { I, HOME, T14, ROUTE, along, mapApp, deviceList, historyList, lockI, randoseru, kidFig, home, intercomI, hallKid } from '../../engine/ichisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, heads, subBand, phone, map, ayaS, sotaS, talking, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

// 地図の点：1台目（ランドセル・自宅）と2台目（3丁目）
const D1 = { x: HOME.x, y: HOME.y - 6, name: 'ソウタ', col: I.me, ph: 0.5 };
const D2 = { x: T14.x, y: T14.y, name: 'ソウタ', col: I.dot };
const ARR = { title: 'ソウタ が 到着しました', body: 'みどり町3丁目14番', time: '15:40' };
const SHEET = { title: 'ソウタ', sub: 'みどり町3丁目14番 付近', time: '15:40', note: '到着しました' };
const V_T14 = { x: 330, y: 360, z: 1.7 };
const V_ALL = { x: 470, y: 700, z: 1.05 };
const livingBack = g => { living(g, { dim: 0.2 }); vgrad(g, -300, -300, W + 600, H + 600, [[0, 'rgba(10,8,8,.35)'], [1, 'rgba(10,8,8,.6)']]); };
const nightBack = g => { vgrad(g, -300, -300, W + 600, H + 600, [[0, '#0e1220'], [1, '#05060a']]); glow(g, 900, 300, 700, 'rgba(160,190,255,1)', 0.12); };
// パスワードの入力（機器の追加）
function pwPrompt(p, w, h, { t = 0 } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#f4f5f7'], [1, '#eceef2']]);
  fillRR(p, 0, 0, w, 150, 0, '#fff'); text(p, '‹', 40, 92, { size: 64, color: I.app, weight: 500 }); text(p, '機器を追加', w / 2, 92, { size: 40, color: '#1a1d24', weight: 900 });
  text(p, 'パスワードを入力してください', w / 2, 300, { size: 40, color: '#14161c', weight: 900 });
  text(p, 'このアカウントの持ち主のパスワード', w / 2, 360, { size: 28, color: '#6a707c', weight: 700 });
  fillRR(p, 70, 430, w - 140, 120, 24, '#fff'); p.lineWidth = 4; p.strokeStyle = I.dot; rr(p, 70, 430, w - 140, 120, 24); p.stroke();
  const n = Math.min(10, Math.floor(t * 6)); for (let i = 0; i < n; i++) circ(p, 130 + i * 62, 490, 14, '#14161c');
  if (Math.sin(t * 8) > 0) fillRR(p, 130 + n * 62 - 20, 462, 4, 56, 2, I.app);
  fillRR(p, 70, 610, w - 140, 120, 60, I.app); text(p, '登録する', w / 2, 670, { size: 40, color: '#fff', weight: 900 });
}
// インターホンの中：夜の玄関に立つ黄色い帽子の男の子（up＝顔を上げる）
const doorKid = (up = 0, z = 1) => (g, w, h) => { g.save(); g.translate(w / 2, h * 0.98); g.scale(z, z); g.translate(-w / 2, -h * 0.98); kidFig(g, P.haruto, { x: w / 2, y: h * 0.98, s: 0.95, cap: true, bag: false, eyes: up > 0.5 ? 'wide' : 'normal', down: 1 - up, look: 0 }); g.restore(); };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 1, title: '二台目',
    back: g2 => { g2.save(); g2.translate(-60, 0); mapApp(g2, 1200, 1920, { t: 3, view: { x: 420, y: 700, z: 1.2 }, dots: [D1, D2], labels: true, hiT14: 1 }); g2.restore(); },
    face: g2 => { fillRR(g2, 120, 1290, 840, 84, 42, 'rgba(0,0,0,.62)'); circ(g2, 170, 1332, 16, I.dot); text(g2, '15:40　ソウタ　みどり町3丁目14番', 200, 1334, { size: 38, color: '#fff', align: 'left', weight: 800 }); },
  });
}

const SHOTS = [
  // ── 冒頭：1フレーム目から見守りアプリの地図。息子の点が知らない家に
  { at: 'cold', off: -0.3, finish: { vignette: 0.5 }, draw(g, lt, D0) { map(g, lt, D0, { view: V_T14, dots: [D2], banner: ARR, bannerT: -1, sheet: SHEET, hiT14: 1 }, { y: 900, z0: 1.12, z1: 1.12 }); } },
  { at: 'k1', finish: { vignette: 0.5 }, draw(g, lt, D0) { map(g, lt, D0, { view: { ...V_T14, z: lerp(1.7, 2.1, ease(clamp(lt / D0))) }, dots: [D2], banner: ARR, bannerT: -1, sheet: SHEET, hiT14: 1 }, { y: 900, z0: 1.12, z1: 1.16 }); } },
  { at: 'turn', finish: { vignette: 0.55 }, draw(g, lt, D0, S) { ayaS(g, lt, D0, S, [], { back: livingBack, eyes: 'wide', brow: -0.5, look: 0.8, z0: 1.08, z1: 1.12 }); } },
  { at: 'k2', draw(g, lt, D0, S) { g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D0, 1.0, 1.04) }); living(g, {}); const tk = talking(lt, S, ['k2']); kidFig(g, P.sota, { x: 330, y: 1420, s: 1.5, cap: false, eyes: 'normal', mouth: tk > 0.4 ? 'open' : 'smile' }); g.restore(); } },
  { at: 'k3', finish: { vignette: 0.6 }, draw(g, lt, D0, S) { ayaS(g, lt, D0, S, [], { back: livingBack, eyes: 'wide', brow: -0.6, look: -0.4, z0: 1.12, z1: 1.2 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 知らない住所
  { at: 'a1', draw(g, lt, D0, S) { ayaS(g, lt, D0, S, [], { back: livingBack, eyes: 'normal', brow: 0 }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 250, 190, 580, 130, 20, 'rgba(10,12,18,.88)'); text(g, '宮下アヤ（37）', 540, 240, { size: 48, color: '#fff' }); text(g, '夫は名古屋に単身赴任中', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D0, 1.0, 1.25) }); randoseru(g, { t: lt, open: 1, tag: 1 }); g.restore(); } },
  { at: 'a3', draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D0, 1.0, 1.04) }); lockI(g, { t: lt, date: '12月3日 木曜日', clock: '15:40', notifs: [{ t: 0.2, title: 'ソウタ が 学校を出ました', body: 'みどり小学校', time: '15:21' }, { t: D0 * 0.45, title: 'ソウタ が 到着しました', body: '自宅', time: '昨日' }] }); g.restore(); } },
  { at: 'a4', finish: { vignette: 0.55 }, draw(g, lt, D0) { map(g, lt, D0, { view: V_T14, dots: [D2], banner: ARR, bannerT: 0.2, sheet: SHEET, hiT14: inv(0.6, 1.0, lt) }, { y: 900, z0: 1.05, z1: 1.12 }); } },
  { at: 'a5', draw(g, lt, D0, S) { ayaS(g, lt, D0, S, ['a5'], { back: livingBack, eyes: 'normal', brow: -0.1, mouth: 'smile', look: 0.6 }); } },
  { at: 'a6', draw(g, lt, D0, S) { sotaS(g, lt, D0, S, ['a6'], { eyes: 'normal', mouth: 'smile', look: -0.4 }); } },
  { at: 'a7', draw(g, lt, D0) { g.save(); cam(g, { x: 760, y: 680, z: slow(lt, D0, 1.3, 1.5) }); randoseru(g, { t: lt, open: 1, tag: 1, name: 0, hand: inv(0, D0 * 0.6, lt) }); g.restore(); } },
  { at: 'a8', finish: { vignette: 0.6 }, draw(g, lt, D0) { map(g, lt, D0, { view: { x: lerp(560, 330, ease(clamp(lt / D0))), y: lerp(880, 520, ease(clamp(lt / D0))), z: 1.5 }, dots: [D1, D2], sheet: { ...SHEET, time: '16:12', note: '15:40から 動いていません' }, hiT14: 1 }); } },

  // ── 2. 2台目
  { at: 'b1', draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => deviceList(p, w, h, { t: lt, k2: 0, count: 0 })); } },
  { at: 'b2', finish: { vignette: 0.55 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => deviceList(p, w, h, { t: lt, k2: inv(0.1, 0.5, lt), count: inv(0.3, 0.7, lt) }), { x: 700, y: 520, z0: 1.3, z1: 1.4 }); subBand(g, 0.8); } },
  { at: 'b3', finish: { vignette: 0.55 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => deviceList(p, w, h, { t: lt, hi: lt > D0 * 0.4 ? 1 : 0 }), { x: 540, y: lerp(560, 800, ease(inv(D0 * 0.3, D0 * 0.6, lt))), z0: 1.3, z1: 1.4 }); subBand(g, 0.8); } },
  { at: 'b4', finish: { vignette: 0.65 }, draw(g, lt, D0, S) { ayaS(g, lt, D0, S, [], { back: livingBack, eyes: 'wide', brow: -0.5, phoneLight: true, z0: 1.05, z1: 1.15 }); } },
  { at: 'b5', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => pwPrompt(p, w, h, { t: lt }), { x: 540, y: 640, z0: 1.15, z1: 1.25 }); subBand(g); } },

  // ── 後編の頭：もう1人のソウタ（地図に同じ名前の点が2つ）
  { at: 'c0', finish: { vignette: 0.55 }, draw(g, lt, D0) { map(g, lt, D0, { view: V_ALL, dots: [{ ...D1, a: 1 }, { ...D2, a: inv(0.2, 0.6, lt) }], sheet: { title: 'ソウタ　ソウタ', sub: '自宅　・　みどり町3丁目14番', time: '2台', col: I.dot, note: '同じ名前の機器が2台' }, hiT14: inv(0.6, 1.0, lt) }, { z0: 1.0, z1: 1.06 }); } },

  // ── 3. 41日
  { at: 'c1', draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => historyList(p, w, h, { t: lt, rows: lerp(0, 4, inv(0.1, D0 * 0.9, lt)) })); } },
  { at: 'c2', finish: { vignette: 0.6 }, draw(g, lt, D0) { const k = ease(inv(0.2, D0 - 0.2, lt)), [x, y] = along(ROUTE, k); map(g, lt, D0, { night: 1, view: { x: 470, y: 700, z: 1.25 }, dots: [{ ...D2, x, y, pulse: 0 }], trail: ROUTE, trailK: k, sheet: { title: 'ソウタ（2台目）', sub: '移動中', time: '午前2:01', col: I.dot } }); } },
  { at: 'c3', finish: { vignette: 0.6 }, draw(g, lt, D0) { const back = ease(inv(D0 * 0.55, D0, lt)), [x, y] = along(ROUTE, 1 - back); map(g, lt, D0, { night: 1, view: { x: 600, y: 900, z: 1.7 }, dots: [{ ...D2, x, y }], trail: ROUTE, trailK: 1, sheet: { title: 'ソウタ（2台目）', sub: back > 0 ? '3丁目へ移動中' : '自宅の前', time: back > 0 ? '午前2:24' : '午前2:13', col: I.dot, note: back > 0 ? '' : '10分 止まっています' } }); } },
  { at: 'c4', finish: { vignette: 0.65 }, draw(g, lt, D0) { phone(g, lt, D0, (p, w, h) => historyList(p, w, h, { t: lt, rows: 5, hi: 0, count: inv(0.1, D0 * 0.8, lt), scroll: 0 }), { x: 640, y: 420, z0: 1.3, z1: 1.45 }); subBand(g); } },
  { at: 'c5', draw(g, lt, D0, S) { ayaS(g, lt, D0, S, ['c5'], { back: livingBack, eyes: 'normal', brow: -0.4, look: 0.6 }); } },
  { at: 'c6', draw(g, lt, D0, S) { sotaS(g, lt, D0, S, ['c6'], { eyes: 'narrow', mouth: 'line', look: -1, brow: 0.3 }); } },
  { at: 'c7', finish: { vignette: 0.6 }, draw(g, lt, D0) { nightSky(g); g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D0, 1.0, 1.08) }); home(g, { base: 1230, name: '戸田', shut: 1, weeds: 1, lit1: 0, lit2: 0 }); g.restore(); tag(g, 'みどり町3丁目14番', 540, 200, { size: 40, bg: '#0b0d12', color: '#f4f6f8', alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'c8', finish: { vignette: 0.6 }, draw(g, lt, D0, S) { sotaS(g, lt, D0, S, [], { eyes: 'normal', mouth: 'line', look: lerp(-1, 1, ease(inv(0.3, 1.2, lt))), brow: 0.2, z0: 1.05, z1: 1.15 }); } },

  // ── 4. 引き：午前1時58分
  { at: 'night', finish: { vignette: 0.7 }, draw(g, lt) { lockI(g, { t: lt, clock: '1:58', dim: 0.4, notifs: [] }); } },
  { at: 'd1', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 700, z: slow(lt, D0, 1.0, 1.05) }); lockI(g, { t: lt, clock: '1:58', dim: 0.4, notifs: [{ t: 0.5, title: 'ソウタ が 移動を始めました', body: 'みどり町3丁目14番から', time: '1:58' }] }); g.restore(); } },
  { at: 'd2', finish: { vignette: 0.6 }, draw(g, lt, D0) { const k = 0.12 * ease(clamp(lt / D0)), [x, y] = along(ROUTE, k); map(g, lt, D0, { night: 1, view: { x: 360, y: 560, z: 1.8 }, dots: [{ ...D2, x, y }], trail: ROUTE, trailK: k, sheet: { title: 'ソウタ', sub: '移動中', time: '1:58', col: I.dot } }); } },
  { at: 'd3', finish: { vignette: 0.6 }, draw(g, lt, D0) { const k = lerp(0.12, 0.92, ease(clamp(lt / D0))), [x, y] = along(ROUTE, k); map(g, lt, D0, { night: 1, view: { x: lerp(360, 600, k), y: lerp(560, 900, k), z: 1.6 }, dots: [{ ...D2, x, y }], trail: ROUTE, trailK: k, sheet: { title: 'ソウタ', sub: '移動中', time: '2:09', col: I.dot } }); } },
  { at: 'd4', finish: { vignette: 0.7 }, draw(g, lt, D0) { map(g, lt, D0, { night: 1, view: { x: HOME.x, y: HOME.y, z: lerp(1.8, 2.6, ease(clamp(lt / D0))) }, dots: [{ ...D2, x: HOME.x, y: HOME.y }], sheet: { title: 'ソウタ', sub: '自宅', time: '2:11', col: I.dot, note: '到着しました' } }); } },
  { at: 'bell', finish: { vignette: 0.65 }, draw(g, lt, D0) { const sx = noise1(lt * 40, 3) * 6; g.save(); g.translate(sx, 0); intercomI(g, { t: lt, ring: 1, clock: '02:11', video: doorKid(0) }); g.restore(); glow(g, 540, 600, 800, 'rgba(255,255,255,1)', 0.08 * Math.abs(Math.sin(lt * 7))); } },
  { at: 'd5', finish: { vignette: 0.6 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 520, z: slow(lt, D0, 1.15, 1.3) }); intercomI(g, { t: lt, ring: 1, clock: '02:11', video: doorKid(0, 1.1) }); g.restore(); subBand(g, 0.7); } },
  { at: 'd6', finish: { vignette: 0.65 }, draw(g, lt, D0) { g.save(); cam(g, { x: 540, y: 430, z: slow(lt, D0, 1.45, 1.65) }); intercomI(g, { t: lt, ring: 0, clock: '02:11', video: doorKid(inv(0, 0.6, lt), 1.35) }); g.restore(); subBand(g); } },
  { at: 'd7', finish: { vignette: 0.7 }, draw(g, lt, D0, S) { ayaS(g, lt, D0, S, [], { back: nightBack, bgA: '#0e1220', bgB: '#05060a', eyes: 'wide', brow: -0.5, look: lerp(0, -1, ease(inv(D0 * 0.5, D0, lt))), phoneLight: true, z0: 1.05, z1: 1.12 }); } },
  { at: 'd8', finish: { vignette: 0.75 }, draw(g, lt, D0, S) { g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D0, 1.0, 1.12) }); hallKid(g, P.sota, { t: lt, k: 1, o: { eyes: 'wide', mouth: talking(lt, S, ['d8']) > 0.4 ? 'open' : 'line', look: 0.3 } }); g.restore(); mood(g, { dark: inv(D0 + 0.2, D0 + 0.9, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'notif', vol: 0.8 },
  { at: 'cold', type: 'hit', vol: 0.5 },
  { at: 'k1', type: 'heartbeat', dur: 3, vol: 0.45 },
  { at: 'turn', type: 'stab', vol: 0.6 },
  { at: 'k3', type: 'subdrop', vol: 0.5 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a2', type: 'rustle', vol: 0.4 },
  { at: 'a3', off: 0.2, type: 'notif', vol: 0.5 },
  { at: 'a4', off: 0.2, type: 'notif', vol: 0.7 },
  { at: 'a4', off: 0.8, type: 'stab', vol: 0.5 },
  { at: 'a7', type: 'rustle', vol: 0.5 },
  { at: 'a8', type: 'heartbeat', dur: 3, vol: 0.45 },
  { at: 'b1', type: 'tap3', vol: 0.35 },
  { at: 'b2', off: 0.3, type: 'hit', vol: 0.6 },
  { at: 'b3', type: 'stab', vol: 0.5 },
  { at: 'b5', type: 'riser', vol: 0.4 },
  { at: 'b5:end', off: 0.2, type: 'subdrop', vol: 0.6 },
  { at: 'c0', type: 'glitch', vol: 0.35 },
  { at: 'c0', off: 0.3, type: 'hit', vol: 0.5 },
  { at: 'c1', type: 'tap3', vol: 0.35 },
  { at: 'c2', type: 'ticks', dur: 4, vol: 0.3 },
  { at: 'c3', type: 'heartbeat', dur: 3, vol: 0.45 },
  { at: 'c4', type: 'stab', vol: 0.6 },
  { at: 'c7', type: 'wind', dur: 4, vol: 0.4 },
  { at: 'c8', type: 'creak', vol: 0.35 },
  { at: 'night', type: 'clock', vol: 0.4 },
  { at: 'd1', off: 0.5, type: 'notif', vol: 0.8 },
  { at: 'd2', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'd3', type: 'riser', vol: 0.45 },
  { at: 'd4', type: 'hit', vol: 0.7 },
  { at: 'bell', type: 'chime', vol: 0.9 },
  { at: 'd6', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'd7', type: 'riser', vol: 0.5 },
  { at: 'd8', type: 'stab', vol: 0.7 },
  { at: 'd8:end', off: 0.3, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'suspense' },
  { at: 'b5', mood: 'silence' },
  { at: 'c0', mood: 'uneasy' },
  { at: 'c2', mood: 'suspense' },
  { at: 'c5', mood: 'uneasy' },
  { at: 'night', mood: 'silence' },
  { at: 'd2', mood: 'tension' },
  { at: 'bell', mood: 'silence' },
  { at: 'd6', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a5', '12月3日（木）夕方', 2.6]]) });
