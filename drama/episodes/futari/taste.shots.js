// 二人の息子 — 映像テイスト確認用
import { W, H, lerp, inv, ease, easeOut, noise1, fillRR, vgrad, glow, cam, text } from '../../engine/core.js';
import { close, figure, mood } from '../../engine/noir.js';
import { phoneFrame, intercom } from '../../engine/sns.js';
import { F, chanoma, twoCalls, scamRoom, doorCam } from '../../engine/futarisets.js';
import { runEpisode } from '../../engine/player.js';
import { P, bg, slow, cover as coverBase, endCard } from './common.js';
import { SERIES, EPISODE, CAST, LINES } from './taste.script.js';

export function cover(g, lt = 9) {
  coverBase(g, lt, {
    no: 1, title: '着信',
    back: g2 => { g2.save(); cam(g2, { x: 540, y: 1100, z: 1.1 }); chanoma(g2, { ring: 1, t: 3 }); g2.restore(); },
    face: g2 => close(g2, P.sawako, { y: 1500, s: 3.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: 'right', phoneLight: true }),
  });
}
const SHOTS = [
  { at: 'a1', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 1100, z: slow(lt, D, 1.0, 1.08) }); chanoma(g, { t: lt, ring: 1 }); g.restore(); } },
  { at: 'a2', finish: { vignette: 0.65 }, draw(g, lt, D) { bg(g, '#141a17', '#0a0e0c'); g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D, 1.0, 1.06) }); close(g, P.sawako, { y: 780, s: 4.0, eyes: 'wide', brow: -0.5, mouth: 'open', phoneLight: true, lightFrom: 'left' }); g.restore(); } },
  { at: 'a3', draw(g, lt, D) { bg(g); g.save(); cam(g, { x: 540, y: 960, z: slow(lt, D, 1.0, 1.04) }); phoneFrame(g, 140, 140, 800, 1600, (p, w, h) => twoCalls(p, w, h, { t: lt, phase: inv(0.2, 0.8, lt) })); g.restore(); } },
  { at: 'a4', draw(g, lt, D) { bg(g, '#1c1814', '#0e0c0a'); intercom(g, 540, 760, 1.7, { t: lt, ring: 1, video: (p, w, h) => doorCam(p, w, h, { t: lt, draw: (q, w2, h2) => figure(q, P.takagi, { x: w2 * 0.5, y: h2 * 1.25, s: 0.55, eyes: 'narrow', arms: [10, 0, 60, -110] }) }) }); } },
  { at: 'a5', draw(g, lt, D) { g.save(); cam(g, { x: 540, y: 1100, z: slow(lt, D, 1.0, 1.06) }); scamRoom(g, { t: lt }); figure(g, P.kuroda, { x: 540, y: 2050, s: 1.4, eyes: 'narrow', mouth: 'smile', lightFrom: 'left' }); g.restore(); } },
  { at: 'title', noSubs: true, finish: { vignette: 0.55, grainA: 0.1 }, draw(g, lt) { bg(g, '#030504', '#080b09'); cover(g, lt); } },
  { at: 'end', noSubs: true, draw(g, lt) { endCard(g, lt, { SERIES, EPISODE }); } },
];
runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS });
