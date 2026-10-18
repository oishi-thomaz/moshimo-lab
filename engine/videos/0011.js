import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, randPerson, poseWalk } from '../lib.js';
import { japan, ll, CITY, setDots, setMapEnv, makeRing, addPin, LAND_Y } from '../scenes/japan.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill } from '../city.js';
import { stage, makeCrowd } from '../scenes/stage.js';
import { look, cam, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも南海トラフ巨大地震が起きたら？（国の被害想定をもとに）
// 数字：内閣府 中央防災会議 南海トラフ巨大地震 被害想定（2025年3月）
//       震度7 10県149市町村、津波 最大約34m（高知県黒潮町・土佐清水市）、1m以上の津波が最短2分で到達
//       死者 最大約29.8万人（早期避難意識が低い場合）、全壊焼失 約235万棟、避難者 1週間後に最大約1,230万人
//       全員が早期に避難を始めると津波の死者は約7割減（内閣府 広報ぼうさい）
//       今後30年以内の発生確率 60〜90%程度以上／20〜50%（地震調査研究推進本部 2025年9月改訂）

function L(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }
const TROUGH = [[138.6, 34.1], [137.6, 33.6], [136.4, 33.2], [135.2, 32.9], [134.0, 32.6], [132.8, 32.1], [132.0, 31.4]];
const troughPts = TROUGH.map(p => ll(...p));
// glowing fault line
const faultM = new THREE.MeshBasicMaterial({ color: 0xff5040, transparent: true, opacity: 0 });
for (let i = 0; i < troughPts.length - 1; i++) { const a = troughPts[i], b = troughPts[i + 1]; const len = a.distanceTo(b); const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.3, 0.9), faultM); m.position.set((a.x + b.x) / 2, LAND_Y - 0.6, (a.z + b.z) / 2); m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); japan.add(m); }
const quakeRings = troughPts.filter((_, i) => i % 2 === 0).map(p => { const r = makeRing('#ff8a5a', 0.7); r.position.x = p.x; r.position.z = p.z; r.visible = false; return r; });
const waveRings = troughPts.map(p => { const r = makeRing('#7fd4ff', 0.8); r.position.x = p.x; r.position.z = p.z; r.position.y = LAND_Y - 0.9; r.visible = false; return r; });
function rings(arr, u, max) { arr.forEach((r, i) => { const k = clamp(u - i * 0.03); r.visible = k > 0 && k < 1; r.scale.setScalar(1 + k * max); r.material.opacity = 0.8 * (1 - k); }); }
const pin = addPin(133.0, 32.9, '#ff5b4f'); pin.visible = false;
const distT = (x, z) => Math.min(...troughPts.map(p => Math.hypot(p.x - x, p.z - z)));
function shake(k) { const s = (Math.sin(performance.now() * 0.05) + Math.sin(performance.now() * 0.071)) * 0.5; return k * s; }
let shakeT = 0; const jitter = (t, k) => [Math.sin(t * 53) * k + Math.sin(t * 31) * k * 0.6, Math.cos(t * 47) * k * 0.5];

// evacuation walkers
const gEvac = new THREE.Group(); city.add(gEvac); gEvac.visible = false;
const evac = [];
{ const r = rng(19); for (let i = 0; i < 26; i++) { const p = randPerson(r); gEvac.add(p); if (r() < 0.6) { const bag = box(0.3, 0.4, 0.18, mat('#c9b48a')); bag.position.set(0, 1.2, -0.2); p.add(bag); } evac.push({ p, z: 5.6 + r() * 2.8, x0: -9 + r() * 10, s: 0.75 + r() * 0.25, ph: r() * 6 }); } }
// shelter crowd (sitting)
const shelter = makeCrowd(70, 21, { w: 14, d: 8, x: 0, z: 1 });
shelter.people.forEach((p, i) => { p.position.y = -0.4; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms.forEach(a => a.rotation.x = -0.4); const bl = box(0.6, 0.06, 0.9, mat(['#9fb3d1', '#d1b39f', '#b3d19f'][i % 3])); bl.position.set(0, 0.42, 0.35); p.add(bl); });
function cityBase() { setEnv('day', new THREE.Vector3(0, 0, 2)); setStore(1); setStoreLights(0.3); setBurst(0); ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = false; }
function mapDots(heat, night) {
  setDots((i, x, z, q) => { const d = distT(x, z); const h = clamp(1 - (d - 4) / 30) * heat; return { color: h > 0.66 ? '#ff4a3a' : h > 0.33 ? '#ffa04a' : h > 0.05 ? '#ffe36e' : (night ? '#556070' : '#ffffff'), hide: night && i % 3 === 0 }; });
}

const SUBS = [
  [2.6, 6.0, 'これは、国が公表している<br>被害想定をもとにした話。'],
  [6.2, 10.1, '+0秒。静岡から九州の沖で、<br>巨大地震。'],
  [10.1, 14, '10県149の市町村で、<br>震度7の想定。'],
  [14.2, 18.1, '+2分。早い所では、<br>もう津波がとどく。'],
  [18.1, 22, '高い所では、<br>最大約34mの想定。'],
  [22.2, 26.1, '+10分。すぐ逃げた人が、<br>助かる。'],
  [26.1, 30, '全員がすぐ逃げれば、<br>津波の死者は約7割減る。'],
  [30.2, 34.6, '+1日。停電や断水が<br>広がる。'],
  [34.6, 39, '壊れたり焼けたりする建物は、<br>最大約235万棟。'],
  [39.2, 43.6, '+1週間。避難する人は<br>最大約1,230万人。'],
  [43.6, 47.8, '日本の、<br>約10人に1人。'],
  [48.1, 52.6, '結果：国の想定では、<br>死者は最大約29.8万人。'],
  [52.6, 55.4, 'でも早い避難と耐震化で、<br>大きく減らせる。'],
  [55.6, 59.4, '今後30年の発生確率は、<br>60〜90%程度以上とも。'],
];

function mapCam(t, a, b, dur, shakeK = 0) { const u = ease(t / dur); const [jx, jz] = jitter(t, shakeK); L(lerp(a[0], b[0], u) + jx, lerp(a[1], b[1], u), lerp(a[2], b[2], u) + jz, lerp(a[3], b[3], u) + jx, 0, lerp(a[4], b[4], u) + jz, 50); }
function shot0(t, T) { // hook: big number, the map begins to shake at 1.2
  setMapEnv('day'); mapDots(0, false); faultM.opacity = t > 1.2 ? 0.9 : 0; rings(quakeRings, 0, 1); rings(waveRings, 0, 1); pin.visible = false;
  rings(quakeRings, t > 1.2 ? (t - 1.2) / 1.5 : 0, 40);
  mapCam(t, [-14, 170, 40, -14, -20], [-14, 160, 36, -14, -20], 2.6, t > 1.2 ? 1.2 : 0);
  el.title.style.opacity = 1;
  setHud('最大想定の死者', '約29.8万人', 1, { color: '#ff8a7a' });
  return japan;
}
function shot1(t, T) { // calm everyday street
  gEvac.visible = false; cityBase(); updateCars(T, true);
  const u = ease(t / 3.5);
  L(lerp(-1, 0, u), 2.3, lerp(18, 17, u), 0, 2.9, 2, 58);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  return city;
}
function shot2(t, T) { // +0s fault ruptures, shaking spreads
  setMapEnv('day'); faultM.opacity = 0.9; mapDots(clamp(t / 3), false); rings(quakeRings, clamp(t / 3.5), 45); rings(waveRings, 0, 1); pin.visible = false;
  mapCam(t, [-14, 175, 45, -14, -18], [-16, 150, 40, -16, -16], 8, Math.max(0, 1.4 - t * 0.18));
  hudTime('+0秒');
  setTop('震度7になる市町村（2025年想定）', countUp(t, 149) + '市町村', fade(t, 0.15, 8, 0.25));
  return japan;
}
function shot3(t, T) { // +2min tsunami rings reach the coast
  setMapEnv('day'); faultM.opacity = 0.6; mapDots(0.7, false); rings(quakeRings, 0, 1); rings(waveRings, clamp(t / 6), 26);
  pin.visible = t > 4; const kc = ll(133.0, 32.9);
  mapCam(t, [-25, 95, 25, kc.x, kc.z - 10], [-22, 80, 20, kc.x, kc.z - 8], 8);
  hudTime('+2分');
  if (t < 4.0) setTop('1m以上の津波がとどくまで（最短）', countUp(t, 2) + '分', fade(t, 0.15, 4.0, 0.2));
  else setTop('最大の津波の高さ（高知県・想定）', '約' + countUp(t - 4, 34) + 'm', fade(t, 4.0, 8, 0.2));
  return japan;
}
function shot4(t, T) { // +10min people evacuate calmly
  gEvac.visible = true; cityBase(); updateCars(0, false);
  for (const e of evac) { const x = e.x0 + t * e.s; e.p.position.set(x, 0, e.z); e.p.rotation.y = Math.PI / 2; poseWalk(e.p, t * 8 + e.ph, 1.1); }
  const u = ease(t / 8);
  L(lerp(8, 13, u), lerp(2.6, 2.8, u), lerp(16, 15, u), lerp(-2, 3, u), 1.8, 6.5, 55);
  hudTime('+10分');
  setTop('全員がすぐ避難すると津波の死者', '約' + countUp(t, 7) + '割減', fade(t, 0.15, 8, 0.25), '#7ff0c8');
  return city;
}
function shot5(t, T) { // +1 day night map, outages
  setMapEnv('night'); faultM.opacity = 0.25; mapDots(0.6, true); rings(quakeRings, 0, 1); rings(waveRings, 0, 1); pin.visible = false;
  mapCam(t, [-10, 190, 50, -12, -15], [-6, 200, 55, -10, -15], 9);
  hudTime('+1日');
  setTop('全壊・焼失する建物（最大・2025年想定）', '約' + comma(countUp(t, 235)) + '万棟', fade(t, 0.15, 9, 0.25));
  return japan;
}
function shot6(t, T) { // +1 week shelter
  shelter.g.visible = true; shelter.people.forEach((p, i) => p.userData.head.rotation.y = Math.sin(t * 0.8 + i) * 0.3);
  const u = ease(t / 8.6);
  L(lerp(-3, 3, u), lerp(7, 6, u), lerp(16, 15, u), 0, 1.2, 0, 50);
  hudTime('+1週間');
  setTop('避難する人（1週間後・最大）', '約' + comma(countUp(t, 1230)) + '万人', fade(t, 0.15, 8.6, 0.25));
  return stage;
}
function shot7(t, T) { // result: calm overview
  setMapEnv('dusk'); faultM.opacity = 0.4; mapDots(0.5, false); rings(quakeRings, 0, 1); rings(waveRings, 0, 1); pin.visible = false;
  mapCam(t, [-10, 200, 60, -10, -20], [-6, 260, 80, -6, -25], 7.5);
  setTop('国の想定する死者（最大）', '約' + (countUp(t, 298, 0.2, 1.2) / 10).toFixed(1) + '万人', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return japan;
}
function shot8(t, T) { // loop: like the opening map
  setMapEnv('day'); mapDots(0, false); faultM.opacity = 0; rings(quakeRings, 0, 1); rings(waveRings, 0, 1); pin.visible = false;
  mapCam(t, [-14, 172, 41, -14, -20], [-14, 170, 40, -14, -20], 4);
  setHud('最大想定の死者', '約29.8万人', 1, { color: '#ff8a7a' });
  setTop('今後30年以内の発生確率（地震本部）', '60〜90%程度以上', fade(t, 0.15, 4, 0.25));
  return japan;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, camera: cityCam,
  meta: {
    id: '0011',
    title: '南海トラフ巨大地震が起きたら？',
    titleHtml: '南海トラフ巨大地震が<br>起きたら？',
    mood: 'calm', seed: 12, hits: [1.2, 6.2], risers: [1.2],
    caption: 'もしも南海トラフ巨大地震が起きたら？\n国（内閣府）が2025年3月に公表した被害想定をもとに、地震から1週間を淡々とシミュレーション。死者は最大約29.8万人の想定ですが、全員がすぐに避難を始めれば津波の死者は約7割減るとされています。\n\n出典：内閣府 中央防災会議 南海トラフ巨大地震の被害想定（2025年3月）・広報ぼうさい、地震調査研究推進本部（2025年9月）',
    hashtags: ['もしもラボ', '南海トラフ', '防災', '地震', '備え'],
    endStats: [['震度7の市町村', '10県149市町村', '2025年想定'], ['最大の津波', '約34m', '2025年想定'], ['避難者（1週間後・最大）', '約1,230万人', '2025年想定'], ['死者（最大）', '約29.8万人', '2025年想定']],
    sources: '出典：内閣府 中央防災会議 南海トラフ巨大地震の被害想定（2025年3月）、<br>内閣府 広報ぼうさい、地震調査研究推進本部（2025年9月）',
  },
});
