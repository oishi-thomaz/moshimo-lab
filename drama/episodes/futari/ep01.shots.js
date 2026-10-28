// 二人の息子 第1話「着信」— 映像・効果音・BGM
// 手がかり（最終話で回収）：茶の間に人の姿がない／テレビの黒い画面に佐和子が映らない／スピーカーの光は佐和子が声に出して話すときだけ強くなる
//   ／カレンダーが2024年10月のまま／湯のみに湯気がない／スマホは最初からスピーカーのまま／毎晩21時の着信履歴
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, figure, mood, speedLines, sfxText } from '../../engine/noir.js';
import { phoneFrame, intercom } from '../../engine/sns.js';
import { F, chanoma, twoCalls, twoLines, dialScreen, callLog, twinWaves, photo, shiba, smartSpeaker, doorCam, wallClock } from '../../engine/futarisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, talking, bg, slow, heads, chip, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

const ramp = (lt, a, b, n0, n1) => lerp(n0, n1, easeOut(inv(a, b, lt)));
const dark = g => bg(g, '#141a17', '#090d0b');
// 佐和子のアップ。後ろの棚にスピーカー（声に出して話すときだけ光る）
const face = (g, lt, D, S, ids = [], o = {}) => {
  dark(g);
  const tk = talking(lt, S, ids);
  smartSpeaker(g, 190, 1180, 1.3, { on: 0.25 + tk * 0.9, t: lt });
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  close(g, P.sawako, { y: 780, s: 4.0, talk: tk * 0.5, lightFrom: 'left', phoneLight: true, ...o });
  g.restore();
};
const phone = (g, lt, D, draw, o = {}) => { bg(g); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.04) }); phoneFrame(g, 140, 80, 800, 1000, draw, { rot: o.rot || 0 }); g.restore(); };
const room = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 1100, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) }); chanoma(g, { t: lt, ...o.set }); g.restore(); };
const officer = t => (q, w, h) => figure(q, P.takagi, { x: w * 0.5, y: h * 1.25, s: 0.55, eyes: 'narrow', arms: [10, 0, 60, -110] });
const yen = (g, n, a = 1) => { g.save(); g.globalAlpha = a; text(g, '示談金', 540, 560, { size: 54, color: '#c9d6cf' }); text(g, `${Math.round(n / 10000)}万円`, 540, 720, { size: 190, color: F.green, weight: 900, stroke: '#05060a', sw: 18 }); g.restore(); };

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 1, title: '着信',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1100, z: 1.1 }); chanoma(g2, { ring: 1, t: 3 }); g2.restore(); },
    face: g2 => close(g2, P.sawako, { y: 1500, s: 3.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', phoneLight: true }),
  });
}

const SHOTS = [
  // ── 冒頭：いきなり2本の電話（1フレーム目から「ハルト」が2つ鳴っている）
  { at: 'cold', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 48, sec2: 0, alarm: 1 }), { z0: 1.06, z1: 1.06 }); mood(g, { red: 0.12 }); } },
  { at: 'h1', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 48, sec2: 0, alarm: 1 }), { z0: 1.06, z1: 1.12 }); mood(g, { red: 0.12 * (1 - inv(0, 0.6, lt)) }); } },
  { at: 'h2', finish: { vignette: 0.6 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 50, sec2: 2, alarm: 1 }), { z0: 1.12, z1: 1.18 }); } },
  { at: 'h3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { dark(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(200,255,220,.16)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.sawako, { y: 780, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', phoneLight: true }); g.restore(); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030504', '#080b09'); cover(g, lt); } },
  // ── 最初の1本
  { at: 'o1', draw(g, lt, D) { const k = ease(inv(0, D, lt)); g.save(); cam(g, { x: lerp(300, 470, k), y: lerp(470, 1430, k), z: lerp(2.2, 2.2, k) }); chanoma(g, { t: lt, ring: 1 }); g.restore(); } },
  { at: 'o2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoCalls(p, w, h, { t: lt, phase: 0, sec: Math.floor(lt) })); } },
  { at: 'o3', finish: { vignette: 0.7 }, draw(g, lt, D, S) { dark(g); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(200,255,220,.18)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.14) }); close(g, P.sawako, { y: 780, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'open', lightFrom: 'left', phoneLight: true }); g.restore(); } },

  // ── 1. 私と息子
  { at: 'a1', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'normal', mouth: 'line' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 290, 330, 500, 130, 20, 'rgba(8,12,10,.88)'); text(g, '宮下佐和子（58）', 540, 380, { size: 48, color: '#fff' }); text(g, '郊外の一軒家', 540, 432, { size: 30, color: '#b9c9c0' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 960, z0: 1.0, z1: 1.04, set: { phone: 0, ring: 0, lamp: 0.4 } }); } },
  { at: 'a3', draw(g, lt, D) { dark(g); photo(g, 540, 700, 560, 640, (q, w, h) => { vgrad(q, 0, 0, w, h, [[0, '#9fb7c7'], [1, '#d8d0c0']]); close(q, P.haruto, { x: w / 2, y: h * 0.48, s: 2.2, eyes: 'normal', mouth: 'smile', lightFrom: 'left' }); }, { rot: -0.04 + 0.02 * ease(inv(0, D, lt)) }); text(g, 'ハルト（29）', 540, 1080, { size: 44, color: '#2a2a2a', alpha: inv(0.3, 0.7, lt) }); } },
  { at: 'a4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => callLog(p, w, h, { t: lt })); } },

  // ── 2. 示談金
  { at: 'b1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoCalls(p, w, h, { t: lt, phase: 0, sec: 21 + Math.floor(lt) })); } },
  { at: 'b2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoCalls(p, w, h, { t: lt, phase: 0, sec: 29 + Math.floor(lt) })); tag(g, '弁護士を名乗る男', 540, 1420, { size: 40, bg: '#0b120e', color: F.green2, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'b3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoCalls(p, w, h, { t: lt, phase: 0, sec: 33 + Math.floor(lt) }), { z1: 1.08 }); } },
  { at: 'b4', draw(g, lt, D) { dark(g); yen(g, ramp(lt, 0.1, 1.0, 0, 3000000), inv(0, 0.2, lt)); } },
  { at: 'b5', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.3, mouth: 'line' }); } },
  { at: 'b6', draw(g, lt, D, S) { face(g, lt, D, S, ['b6'], { eyes: 'normal', brow: 0.2 }); } },
  { at: 'wait', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoCalls(p, w, h, { t: lt, phase: inv(0.2, 0.8, lt), sec: 47 })); } },

  // ── 3. もう1本
  { at: 'c1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoCalls(p, w, h, { t: lt + 1, phase: 1, sec: 47 })); } },
  { at: 'c2', draw(g, lt, D) { const k = ease(inv(0, D + 1.3, lt)); bg(g); g.save(); cam(g, { x: lerp(540, 470, k), y: lerp(960, 280, k), z: lerp(1.0, 2.0, k) }); phoneFrame(g, 140, 80, 800, 1000, (p, w, h) => twoCalls(p, w, h, { t: lt + 1, phase: 1, sec: 47 })); g.restore(); } },
  { at: 'name', finish: { vignette: 0.6 }, draw(g, lt, D) { bg(g); g.save(); cam(g, { x: 470, y: 280, z: lerp(2.0, 2.3, ease(inv(0, D, lt))), ...{ sx: noise1(lt * 30, 1) * 6 * (1 - inv(0, 0.5, lt)) } }); phoneFrame(g, 140, 80, 800, 1000, (p, w, h) => twoCalls(p, w, h, { t: lt + 1, phase: 1, sec: 47 })); g.restore(); } },
  { at: 'c3', finish: { vignette: 0.6 }, draw(g, lt, D) { bg(g); g.save(); cam(g, { x: 470, y: 280, z: 2.3 }); phoneFrame(g, 140, 80, 800, 1000, (p, w, h) => twoCalls(p, w, h, { t: lt + 1, phase: 1, sec: 47 })); g.restore(); } },
  { at: 'c4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 49, sec2: 0, alarm: 1 - inv(0, 0.8, lt) })); } },
  { at: 'c5', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 49, sec2: 4 })); } },

  // ── 4. どっちが本物
  { at: 'd1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 55, sec2: 9 })); } },
  { at: 'd2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 60, sec2: 12 })); } },
  { at: 'd3', draw(g, lt, D) { dark(g); twinWaves(g, { t: lt }); } },
  { at: 'd4', draw(g, lt, D, S) { face(g, lt, D, S, [], { eyes: 'narrow', brow: 0.4, mouth: 'line', look: -0.6 }); } },
  { at: 'd5', draw(g, lt, D, S) { face(g, lt, D, S, ['d5'], { eyes: 'normal', brow: 0.3 }); } },
  { at: 'd6', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 75, sec2: 27, label1: '「コテツだろ」' })); } },
  { at: 'd7', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 78, sec2: 30, label1: '「コテツだろ」', label2: '「コテツ。茶色い柴犬の」' })); } },
  { at: 'd8', draw(g, lt, D) { dark(g); photo(g, 540, 700, 560, 560, shiba, { rot: 0.05 - 0.03 * ease(inv(0, D, lt)) }); text(g, 'コテツ', 540, 1032, { size: 46, color: '#2a2a2a', alpha: inv(0.2, 0.6, lt) }); } },
  { at: 'd9', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 84, sec2: 36 })); } },
  { at: 'd10', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => dialScreen(p, w, h, { t: lt })); } },
  { at: 'd11', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => dialScreen(p, w, h, { t: lt + 3, noAnswer: inv(1.6, 1.7, lt) })); } },
  { at: 'd12', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 101, sec2: 51, label1: '弁護士を名乗る男' }), { z1: 1.08 }); } },

  // ── 5. 引き
  { at: 'bell', draw(g, lt, D) { room(g, lt, D, { x: 540, y: 900, z0: 1.15, z1: 1.0, set: { phone: 1, ring: 0, lamp: 0.25 } }); mood(g, { dark: 0.2 }); } },
  { at: 'e1', draw(g, lt, D) { bg(g, '#1c1814', '#0e0c0a'); intercom(g, 540, 640, 1.7, { t: lt, ring: 1, video: (p, w, h) => doorCam(p, w, h, { t: lt, draw: officer(lt) }) }); } },
  { at: 'e2', draw(g, lt, D) { bg(g, '#1c1814', '#0e0c0a'); g.save(); cam(g, { x: 500, y: 600, z: slow(lt, D, 1.2, 1.45) }); intercom(g, 540, 640, 1.7, { t: lt, ring: 0, video: (p, w, h) => doorCam(p, w, h, { t: lt, draw: officer(lt) }) }); g.restore(); } },
  { at: 'e4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 140, sec2: 90, alarm: 1 })); mood(g, { red: 0.08 }); } },
  { at: 'turn', noSubs: true, draw(g, lt) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } },
  { at: 'e5', finish: { vignette: 0.7 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 2, sec1: 141, sec2: 91, alarm: 1 }), { z0: 1.12, z1: 1.18 }); } },
  { at: 'e6', finish: { vignette: 0.7 }, draw(g, lt, D) { phone(g, lt, D, (p, w, h) => twoLines(p, w, h, { t: lt, active: 1, sec1: 142, sec2: 92, alarm: 1 }), { z0: 1.18, z1: 1.26 }); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'hit', vol: 0.9 },
  { at: 'cold', type: 'ringtone', dur: 6.5, vol: 0.35 },
  { at: 'h2', type: 'stab', vol: 0.7 },
  { at: 'h3', type: 'heartbeat', dur: 3, vol: 0.7 },
  { at: 'o1', type: 'roomtone', dur: 9, vol: 0.4 },
  { at: 'o1', type: 'vibrate', dur: 3.0, vol: 0.6 },
  { at: 'o2', type: 'pickup', vol: 0.6 },
  { at: 'o2:end', off: 0.1, type: 'hit', vol: 0.8 },
  { at: 'o3', type: 'heartbeat', dur: 2, vol: 0.6 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a4', type: 'tap3', vol: 0.4 },
  { at: 'b4', type: 'stab', vol: 0.7 },
  { at: 'wait', type: 'ping', vol: 0.7 },
  { at: 'wait', off: 0.6, type: 'ping', vol: 0.7 },
  { at: 'c1', type: 'ringtone', dur: 3.5, vol: 0.45 },
  { at: 'name', type: 'hit', vol: 0.9 },
  { at: 'name', off: 0.1, type: 'impact', vol: 0.7 },
  { at: 'c4', type: 'pickup', vol: 0.5 },
  { at: 'd3', type: 'glitch', vol: 0.35 },
  { at: 'd8', type: 'stab', vol: 0.6 },
  { at: 'd10', type: 'tap3', vol: 0.4 },
  { at: 'dial', type: 'dial', dur: 2.6, vol: 0.6 },
  { at: 'd11', type: 'dial', dur: 1.6, vol: 0.5 },
  { at: 'd12', type: 'heartbeat', dur: 3, vol: 0.4 },
  { at: 'bell', type: 'chime', vol: 0.8 },
  { at: 'e1', type: 'chime', vol: 0.6 },
  { at: 'e3', type: 'knock', vol: 0.6 },
  { at: 'e4', type: 'riser', vol: 0.6 },
  { at: 'turn', type: 'hit', vol: 0.8 },
  { at: 'e6:end', off: 0.5, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'thriller' },
  { at: 'o1', mood: 'silence' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'suspense' },
  { at: 'wait', mood: 'silence' },
  { at: 'c4', mood: 'thriller' },
  { at: 'd4', mood: 'suspense' },
  { at: 'd8', mood: 'tension' },
  { at: 'bell', mood: 'silence' },
  { at: 'e4', mood: 'thriller' },
  { at: 'turn', mood: 'silence' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a2', '2時13分　宮下家の茶の間', 2.6]]) });
