// 父のスマホ 第1話「通知」— 映像・効果音・BGM
// 手がかり（最終話で回収）：7:00ちょうどの通知／「あなた」だけ／父の返事「明日も、窓を開けておく」／交差点の白い花／パスコード＝私の誕生日
//   ／壁の家族写真と同じ構図の写真／カーテンのすき間の向かいの窓
import { W, H, clamp, lerp, inv, ease, easeOut, noise1, fillRR, circ, vgrad, glow, rgba, cam, text, tag } from '../../engine/core.js';
import { close, mood, speedLines } from '../../engine/noir.js';
import { photo } from '../../engine/futarisets.js';
import { Y, danchiRoom, danchiNight, msgList, passcode, crossing, coatPocket, entrancePhoto } from '../../engine/chichisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, FAMILY, RYOPHOTO, bg, slow, heads, subBand, phone, room, face, lockS, cover as coverBase, coverBack, coverFace, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

const AM = { lamp: 0.25, morning: 0.35 }; // 冬の朝7時の部屋
const nat = (g, lt, D, S, ids, o = {}) => face(g, lt, D, S, 'natsuki', ids, { back: g2 => { bg(g2, '#1a1c24', '#0c0d12'); glow(g2, 900, 500, 700, 'rgba(170,200,255,1)', 0.25); }, ...o });
const shock = (g, lt, D, o = {}) => { bg(g, '#14151c', '#0a0b10'); speedLines(g, 540, 760, { inner: 470, t: lt, color: 'rgba(255,230,170,.14)' }); g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) }); close(g, P.natsuki, { y: 660, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'left', phoneLight: true, ...o }); g.restore(); };
const O1 = { body: 'おはよう、あなた。', time: '7:00' };
const O2 = { body: '今日は寒いから、\nちゃんと上着を着てね。', time: '7:00' };
const ryoImg = (q, w, h) => entrancePhoto(q, w, h, { kid: 'ryo', P: RYOPHOTO, mom: false });
const famImg = (q, w, h) => entrancePhoto(q, w, h, { kid: 'natsuki', P: FAMILY });
// メッセージ：5年前の始まり（2週間分）／最近（父の返事）／死んだあと
const OLD = [{ d: '2021年12月6日' }, { text: 'おはよう、あなた。', time: '7:00' }, { text: '明日も、窓を開けておく', me: 1, time: '22:10' }, ...Array.from({ length: 14 }, (_, i) => [{ d: `2021年12月${7 + i}日` }, { text: 'おはよう、あなた。', time: '7:00' }, { text: '明日も、窓を開けておく', me: 1, time: `${21 + (i % 2)}:${String(10 + (i * 7) % 49).padStart(2, '0')}` }]).flat()];
const LAST = [{ d: '11月29日' }, { text: 'おはよう、あなた。', time: '7:00' }, { text: '明日も、窓を開けておく', me: 1, time: '22:02' }, { d: '11月30日' }, { text: 'おはよう、あなた。', time: '7:00' }, { text: '明日も、窓を開けておく', me: 1, time: '23:14' }, { d: '12月1日' }, { text: 'おはよう、あなた。', time: '7:00' }, { d: '12月2日' }, { text: 'おはよう、あなた。', time: '7:00' }, { d: '12月5日' }, { text: 'おはよう、あなた。', time: '7:00' }, { text: '今日は寒いから、\nちゃんと上着を着てね。', time: '7:00' }];
const digits = (lt, a = 0, step = 0.3) => Math.min(4, Math.floor(Math.max(0, lt - a) / step) + (lt > a ? 1 : 0));
const altar = (g, lt, D, o = {}) => room(g, lt, D, { x: 260, y: o.y ?? 1030, z0: o.z0 ?? 1.9, z1: o.z1 ?? 2.1, set: { ...AM, notify: o.notify ?? 1 } });
const twoPhotos = (g, lt) => { bg(g, '#1c1a16', '#0e0d0b'); const k = easeOut(inv(0, 0.5, lt)); photo(g, 290, 540, 400, 500, famImg, { rot: -0.06 }); photo(g, 790, 560, 400, 500, ryoImg, { rot: 0.06, a: k }); text(g, '壁の家族写真', 300, 850, { size: 36, color: '#2a2a2a', alpha: inv(0.3, 0.6, lt) }); text(g, 'ポケットの写真', 780, 868, { size: 36, color: '#2a2a2a', alpha: inv(0.5, 0.8, lt) * k }); };

export function cover(g, lt = 9) {
  coverBase(g, lt, { no: 1, title: '通知', back: coverBack(), face: coverFace() });
}

const SHOTS = [
  // ── 冒頭：1フレーム目からロック画面「おはよう、あなた」
  { at: 'cold', off: -0.3, finish: { vignette: 0.55 }, draw(g, lt, D) { lockS(g, lt, D, { notifs: [{ t: -1, ...O1 }], z0: 1.06, z1: 1.06 }); } },
  { at: 'k1', finish: { vignette: 0.55 }, draw(g, lt, D) { lockS(g, lt, D, { notifs: [{ t: -1, ...O1 }], z0: 1.06, z1: 1.12 }); } },
  { at: 'k2', finish: { vignette: 0.7 }, draw(g, lt, D) { altar(g, lt, D, { z0: 1.9, z1: 1.7 }); } },
  { at: 'k3', finish: { vignette: 0.55 }, draw(g, lt, D) { lockS(g, lt, D, { notifs: [{ t: -1, ...O1 }, { t: 0.1, ...O2 }], z0: 1.0, z1: 1.05 }); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030405', '#08090c'); cover(g, lt); } },

  // ── 1. 私と父
  { at: 'a1', draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'normal', mouth: 'line' }); const a = inv(0.2, 0.5, lt); g.save(); g.globalAlpha = a; fillRR(g, 290, 190, 500, 130, 20, 'rgba(10,12,18,.88)'); text(g, '井上ナツキ（34）', 540, 240, { size: 48, color: '#fff' }); text(g, '会社員', 540, 292, { size: 30, color: '#c9c2b0' }); g.restore(); } },
  { at: 'a2', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.06) }); danchiNight(g, { t: lt, dawn: 0.45, litA: 1, litB: 0.3 }); g.restore(); } },
  { at: 'a3', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); photo(g, 540, 660, 600, 700, famImg, { rot: -0.03 + 0.02 * ease(inv(0, D, lt)) }); text(g, '父と母と、10歳の私', 540, 1078, { size: 40, color: '#2a2a2a', alpha: inv(0.3, 0.7, lt) }); } },
  { at: 'a4', finish: { vignette: 0.7 }, draw(g, lt, D) { lockS(g, lt, D, { date: '1月1日 金曜日', notifs: [{ t: -1, ...O1 }] }); mood(g, { desat: 0.7, dark: 0.15 }); tag(g, '5年前の正月', 540, 1120, { size: 40, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'a5', draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'narrow', brow: 0.5, mouth: 'line', look: -0.4 }); } },
  { at: 'a6', finish: { vignette: 0.65 }, draw(g, lt, D, S) { nat(g, lt, D, S, ['a6'], { eyes: 'narrow', brow: 0.7, z0: 1.06, z1: 1.14 }); } },

  // ── 2. パスコード
  { at: 'b1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => passcode(p, w, h, { n: digits(lt, 0.3), label: '0 6 0 7　父の誕生日' })); } },
  { at: 'wrong', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => passcode(p, w, h, { n: 4, wrong: inv(0, 0.8, lt), label: '違います' })); } },
  { at: 'b2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => passcode(p, w, h, { n: 0, wrong: 1, label: '違います' })); } },
  { at: 'b3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => passcode(p, w, h, { n: digits(lt, 0.8) })); } },
  { at: 'open', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => { passcode(p, w, h, { n: 4 }); p.save(); p.globalAlpha = inv(0.2, 0.7, lt); p.fillStyle = '#f4f6fa'; p.fillRect(0, 0, w, h); p.restore(); }); glow(g, 540, 580, 700, 'rgba(255,240,200,1)', 0.4 * inv(0.2, 0.7, lt)); } },
  { at: 'b4', finish: { vignette: 0.6 }, draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'normal', brow: -0.4, mouth: 'line', phoneLight: true, lookY: 0.6 }); } },

  // ── 3. 5年分の「おはよう」
  { at: 'c1', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { msgs: OLD, scroll: lerp(0, 600, ease(inv(0.3, D, lt))) })); tag(g, '5年前', 540, 1130, { size: 40, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.2, 0.5, lt) * (1 - inv(D - 0.4, D, lt)) }); } },
  { at: 'c2', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { msgs: OLD, scroll: lerp(600, 1400, ease(inv(0, D, lt))) }), { z0: 1.04, z1: 1.12 }); } },
  { at: 'c3', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { msgs: LAST, scroll: 0, hi: 1 }), { x: 470, y: 470, z0: 1.7, z1: 1.85 }); subBand(g); } },
  { at: 'c4', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { msgs: LAST, scroll: 0 })); } },
  { at: 'c5', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { t: lt + 9, msgs: LAST, scroll: 0, hi: 2 }), { x: 560, y: 530, z0: 1.6, z1: 1.75 }); subBand(g); } },
  { at: 'c6', draw(g, lt, D) { phone(g, lt, D, (p, w, h) => msgList(p, w, h, { t: lt + 9, msgs: LAST, scroll: lerp(0, 230, ease(inv(0, 1.2, lt))), hi: 5 })); } },

  // ── 4. 交差点と上着
  { at: 'd1', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 1000, z: slow(lt, D, 1.0, 1.06) }); crossing(g, { t: lt, dawn: 0.3, signal: 'red', flowers: 1 }); g.restore(); } },
  { at: 'd2', finish: { vignette: 0.65 }, draw(g, lt, D) { g.save(); cam(g, { x: 260, y: 1420, z: slow(lt, D, 2.2, 2.5) }); crossing(g, { t: lt, dawn: 0.3, signal: 'red', flowers: 1 }); g.restore(); subBand(g); } },
  { at: 'd3', draw(g, lt, D, S) { nat(g, lt, D, S, [], { eyes: 'normal', brow: -0.2, mouth: 'line', lookY: 1, look: -0.5 }); } },
  { at: 'd4', draw(g, lt, D) { room(g, lt, D, { x: 560, y: 640, z0: 1.6, z1: 1.9, set: { ...AM, notify: 0 } }); } },
  { at: 'd5', draw(g, lt, D) { g.save(); cam(g, { x: 400, y: 960, z: slow(lt, D, 1.0, 1.08) }); coatPocket(g, { t: lt, pull: 0 }); g.restore(); } },
  { at: 'pull', draw(g, lt, D) { g.save(); cam(g, { x: 400, y: 900, z: 1.08 }); coatPocket(g, { t: lt, pull: 0.55 * ease(inv(0, D, lt)), img: ryoImg }); g.restore(); } },

  // ── 5. 写真
  { at: 'e1', draw(g, lt, D) { g.save(); cam(g, { x: 400, y: 900, z: 1.08 }); coatPocket(g, { t: lt, pull: lerp(0.55, 1, ease(inv(0, D, lt))), img: ryoImg }); g.restore(); } },
  { at: 'e2', finish: { vignette: 0.6 }, draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); g.save(); cam(g, { x: lerp(540, 440, ease(inv(0, D, lt))), y: lerp(620, 690, ease(inv(0, D, lt))), z: lerp(1.0, 1.5, ease(inv(0, D, lt))) }); photo(g, 540, 580, 600, 700, ryoImg, { rot: 0.02 }); g.restore(); } },
  { at: 'e3', draw(g, lt, D) { bg(g, '#1c1a16', '#0e0d0b'); g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D, 1.0, 1.05) }); photo(g, 540, 600, 600, 700, ryoImg, { rot: 0.02 }); g.restore(); tag(g, '3号棟の入口', 540, 1110, { size: 38, bg: '#0b0d12', color: Y.amber2, alpha: inv(0.2, 0.5, lt) }); } },
  { at: 'e4', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 760, z: slow(lt, D, 1.0, 1.05) }); twoPhotos(g, lt); g.restore(); } },
  { at: 'e5', finish: { vignette: 0.65 }, draw(g, lt, D, S) { shock(g, lt, D, { mouth: 'open', brow: 0.3 }); } },

  // ── 6. 引き：「上着のポケット、見てくれた？」
  { at: 'buzz', finish: { vignette: 0.7 }, draw(g, lt, D) { const sh = noise1(lt * 40, 3) * 6; g.save(); g.translate(sh, 0); altar(g, lt, D, { y: 1080, z0: 1.8, z1: 1.9, notify: 0.6 + 0.4 * Math.abs(Math.sin(lt * 7)) }); g.restore(); } },
  { at: 'f1', finish: { vignette: 0.7 }, draw(g, lt, D) { altar(g, lt, D, { y: 1080, z0: 1.9, z1: 2.0, notify: 1 }); } },
  { at: 'f2', finish: { vignette: 0.6 }, draw(g, lt, D) { lockS(g, lt, D, { clock: '7:12', notifs: [{ t: 0.15, body: '上着のポケット、見てくれた？', time: '今' }], z0: 1.0, z1: 1.08 }); } },
  { at: 'f3', finish: { vignette: 0.7 }, draw(g, lt, D) { shock(g, lt, D, { look: 1, brow: -0.6 }); } },
  { at: 'f4', finish: { vignette: 0.75 }, draw(g, lt, D) { room(g, lt, D, { x: 840, y: 520, z0: 1.8, z1: 2.8, set: { ...AM, notify: 0, curtain: 0.3, opp: { tLit: 1, sil: 1, sway: 0.4 } } }); mood(g, { dark: inv(D - 0.8, D, lt) }); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];

const SFX = [
  { at: 'cold', type: 'notif', vol: 0.8 },
  { at: 'cold', type: 'hit', vol: 0.6 },
  { at: 'k2', type: 'heartbeat', dur: 3, vol: 0.5 },
  { at: 'k3', type: 'notif', vol: 0.7 },
  { at: 'title', type: 'impact', vol: 0.9 },
  { at: 'a1', type: 'roomtone', dur: 12, vol: 0.4 },
  { at: 'a4', type: 'glitch', vol: 0.3 },
  { at: 'a6', type: 'stab', vol: 0.4 },
  { at: 'b1', off: 0.3, type: 'tap3', vol: 0.5 },
  { at: 'wrong', type: 'stab', vol: 0.5 },
  { at: 'b3', off: 0.8, type: 'tap3', vol: 0.5 },
  { at: 'open', off: 0.2, type: 'unlock', vol: 0.7 },
  { at: 'c1', type: 'tap3', vol: 0.3 },
  { at: 'c5', type: 'ping', vol: 0.5 },
  { at: 'c6', type: 'heartbeat', dur: 2, vol: 0.4 },
  { at: 'd1', type: 'wind', dur: 6, vol: 0.3 },
  { at: 'd2', type: 'stab', vol: 0.4 },
  { at: 'd5', type: 'rustle', vol: 0.6 },
  { at: 'pull', type: 'rustle', vol: 0.7 },
  { at: 'e1', type: 'hit', vol: 0.6 },
  { at: 'e4', type: 'stab', vol: 0.7 },
  { at: 'e5', type: 'heartbeat', dur: 2.5, vol: 0.5 },
  { at: 'buzz', type: 'vibrate', dur: 1.0, vol: 0.7 },
  { at: 'f2', type: 'notif', vol: 0.8 },
  { at: 'f2', off: 0.2, type: 'hit', vol: 0.8 },
  { at: 'f3', type: 'riser', vol: 0.6 },
  { at: 'f4:end', off: 0.3, type: 'subdrop', vol: 0.7 },
  { at: 'end', off: 0.6, type: 'ping', vol: 0.5 },
];
const MUSIC = [
  { at: 'cold', mood: 'tension' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'uneasy' },
  { at: 'b1', mood: 'suspense' },
  { at: 'open', mood: 'silence' },
  { at: 'c1', mood: 'uneasy' },
  { at: 'd1', mood: 'suspense' },
  { at: 'pull', mood: 'tension' },
  { at: 'buzz', mood: 'silence' },
  { at: 'f2', mood: 'thriller' },
  { at: 'end', mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, post: heads([['a2', 'みどり台団地　3号棟405', 2.8], ['d1', '12月1日 7:00　団地の前の交差点', 2.8]]) });
