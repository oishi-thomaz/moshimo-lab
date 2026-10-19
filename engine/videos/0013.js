import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, renderer } from '../lib.js';
import { room, setRoom, setLight, props } from '../scenes/room.js';
import { japan, ll, CITY, setDots, setMapEnv, makeRing } from '../scenes/japan.js';
import { stage, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも日本人全員が同時にトイレを流したら？
// 数字：総人口 1億2,265万人（総務省 人口推計 2026年9月1日概算）
//       トイレ1回の水 30年前13L→今は少ないもので3.8L（TOTO 公式「節水トイレ」）
//       全員分 3.8L×1億2,265万人≒約47万m³・13Lなら約159万m³（推計）、東京ドームの容積 約124万m³（東京ドーム公式）→約0.4杯／約1.3杯
//       下水処理水 約141.4億m³/年（国土交通省 日本の水資源の現況、2023年度）→1日あたり約3,900万m³（推計）
//       下水道処理人口普及率 82.2%（国土交通省、令和7年度末）

// ---------- toilet: swirl water ----------
const swirl = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.16, 24, 1, 0, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false })); swirl.renderOrder = 5;
swirl.rotation.x = -Math.PI / 2; swirl.position.set(0, 0.44, -2.95); swirl.scale.y = 1.35; room.add(swirl);
function flush(k) { // k: 0..1 lever pressed amount
  props.toiletLever.rotation.z = -0.6 * k;
}
// ---------- dome (generic, volume unit) ----------
const R = 6;
const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#f4f6f8', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
dome.scale.y = 0.55; dome.position.y = 0.3; stage.add(dome);
const domeRim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 6, 48), mat('#cfd6df')); domeRim.rotation.x = Math.PI / 2; domeRim.position.y = 0.35; stage.add(domeRim);
const waterM = new THREE.MeshLambertMaterial({ color: '#3f9be0', transparent: true, opacity: 0.85 });
renderer.localClippingEnabled = true;
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.3); waterM.clippingPlanes = [clip]; waterM.side = THREE.DoubleSide;
const water = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), waterM); water.scale.y = 0.55; water.position.y = 0.3; stage.add(water);
const waterTop = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshLambertMaterial({ color: '#5fb2ee', transparent: true, opacity: 0.9 })); waterTop.rotation.x = -Math.PI / 2; stage.add(waterTop);
function fillDome(frac) { // frac of the dome's volume (hemisphere scaled in y)
  const f = Math.min(1, frac); let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const x = (lo + hi) / 2; ((x - x * x * x / 3) / (2 / 3) < f) ? lo = x : hi = x; }
  const x = lo, H = R * 0.55 * 0.985, h = Math.max(0.001, x * H), rt = R * 0.985 * Math.sqrt(Math.max(0, 1 - x * x));
  clip.constant = 0.3 + h; water.visible = f > 0.001; waterTop.visible = f > 0.001 && f < 0.999; waterTop.position.y = 0.3 + h; waterTop.scale.setScalar(Math.max(0.001, rt));
}
const overflowRing = new THREE.Mesh(new THREE.RingGeometry(R * 1.0, R * 1.0 + 0.6, 48), new THREE.MeshBasicMaterial({ color: 0x3f9be0, transparent: true, opacity: 0, side: THREE.DoubleSide })); overflowRing.rotation.x = -Math.PI / 2; overflowRing.position.y = 0.32; stage.add(overflowRing);
const domeLab = makeLabel('東京ドーム（容積）', { sx: 3.0, size: 60 }); domeLab.position.set(1.2, R * 0.55 + 1.0, 0); stage.add(domeLab);
// ---------- map flows ----------
const plants = ['tokyo', 'osaka', 'nagoya', 'fukuoka', 'sapporo', 'sendai', 'hiroshima'].map(c => ll(...CITY[c]));
const ripples = plants.map(p => { const r = makeRing('#7fd4ff', 0.8); r.position.x = p.x; r.position.z = p.z; r.visible = false; return r; });
function ripple(u) { ripples.forEach((r, i) => { const k = (u * 2 + i * 0.13) % 1; r.visible = u > 0; r.scale.setScalar(1 + k * 6); r.material.opacity = 0.8 * (1 - k); }); }
function flowDots(t, k, sewerShare = 1) { // dots drift toward the nearest plant
  setDots((i, x, z, q) => {
    let best = plants[0], bd = 1e9; for (const p of plants) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } }
    const u = clamp(k * (0.6 + q * 0.6)); const inSewer = q < sewerShare;
    return { color: inSewer ? '#5fc1ff' : '#d8d8d8', y: inSewer ? Math.sin(t * 6 + q * 20) * 0.3 * k : 0, s: 1 };
  });
}

const SUBS = [
  [2.6, 6.0, '家のトイレ。<br>毎日なにげなく流す水。'],
  [6.2, 10.1, '日本中で、いっせいにジャー！'],
  [10.1, 14, '1億2,265万人が、<br>同時に流した。'],
  [14.2, 18.1, '今のトイレは、<br>少ないもので1回3.8L。'],
  [18.1, 22, '全員分で、<br>約47万m³（推計）。'],
  [22.2, 26.1, '東京ドームでくらべると…'],
  [26.1, 30, '約0.4杯分。'],
  [30.2, 34.6, '水は下水処理場へ向かう。'],
  [34.6, 39, 'それでも1日に流れる下水の<br>約1%ほど（推計）。'],
  [39.2, 43.6, '下水道を使う人は<br>全体の82.2%。'],
  [43.6, 47.8, 'ほかに、浄化槽なども<br>使われている。'],
  [48.1, 53.8, '結果：東京ドーム0.4杯分。<br>下水1日分の約1%で済んだ。'],
  [53.9, 56.1, '30年前のトイレなら、<br>約3.4倍の水だった。'],
  [56.2, 59.4, '東京ドーム0.4杯分、<br>多い？少ない？'],
];

const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function toiletRoom() { setRoom({ sets: ['toilet'] }); setLight('day', { ceil: 6, hemi: 1.0 }); props.sleeper.visible = false; }
function shot0(t, T) { // hook: lever close-up, countdown
  toiletRoom(); flush(0); swirl.material.opacity = 0;
  const u = ease(t / 2.6);
  look(lerp(0.55, 0.45, u), 1.5, lerp(-0.7, -0.9, u), -0.05, 0.8, -3.1, 50);
  el.title.style.opacity = 1;
  setHud('全員同時に流すまで', cd(6 - T), 1, { mono: true });
  return room;
}
function shot1(t, T) {
  toiletRoom(); flush(0); swirl.material.opacity = 0;
  const u = ease(t / 3.5);
  look(0, lerp(1.7, 1.6, u), lerp(-0.3, -0.6, u), 0, 0.7, -3.0, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('全員同時に流すまで', cd(Math.max(0, 6 - T)), 1, { mono: true });
  return room;
}
function shot2(t, T) { // +0s flush
  toiletRoom(); flush(t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.6) / 0.3));
  swirl.material.opacity = clamp(t / 0.3) * clamp(1 - (t - 4) / 1.5) * 0.9; swirl.rotation.z = -t * 9;
  props.toiletWater.material.emissiveIntensity = 0.3 + 0.3 * Math.abs(Math.sin(t * 8)) * clamp(1 - t / 4);
  const u = ease(t / 8);
  look(lerp(0.35, 0.15, u), lerp(1.75, 1.9, u), lerp(-1.7, -1.4, u), -0.15, 0.4, -3.0, 50);
  hudTime('+0秒');
  setTop('日本の総人口（2026年9月）', (() => { const v = countUp(t, 12265); return `${Math.floor(v / 10000)}億${comma(v % 10000)}万人`; })(), fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t, T) { // +1s map lights up blue
  setMapEnv('day'); flowDots(t, clamp(t / 2)); ripple(0);
  const u = ease(t / 8);
  look(lerp(-8, -4, u), lerp(300, 280, u), lerp(95, 85, u), -4, 0, -30, 50);
  hudTime('+1秒');
  setTop('今のトイレ1回の水（少ないもの）', (countUp(t, 38) / 10).toFixed(1) + 'L', fade(t, 0.15, 8, 0.25));
  return japan;
}
function shot4(t, T) { // +1min dome fills to 0.38
  lift(260);
  fillDome(0.38 * easeOut(clamp((t - 0.5) / 4))); overflowRing.material.opacity = 0; domeLab.visible = true;
  const u = ease(t / 8);
  look(lerp(-3, 3, u), lerp(4.6, 4.2, u), lerp(21, 20, u), 0, 2.4, 0, 50);
  hudTime('+1分');
  setTop('東京ドームにすると（推計）', '約' + (countUp(t, 4) / 10).toFixed(1) + '杯', fade(t, 0.15, 8, 0.25));
  return stage;
}
function shot5(t, T) { // +5min flow to plants
  setMapEnv('dusk'); flowDots(t, 1); ripple(t / 9);
  const tk = ll(...CITY.osaka); const u = ease(t / 9);
  look(tk.x + lerp(20, 0, u), lerp(120, 90, u), tk.z + lerp(70, 55, u), tk.x + 10, 0, tk.z - 6, 50);
  hudTime('+5分');
  setTop('1日に処理される下水（推計・2023年度）', '約' + comma(countUp(t, 3900)) + '万m³', fade(t, 0.15, 9, 0.25));
  return japan;
}
function shot6(t, T) { // +30min sewer coverage
  setMapEnv('day'); flowDots(t, 0.6, 0.822); ripple(0);
  const u = ease(t / 8.6);
  look(lerp(-6, -10, u), lerp(285, 300, u), lerp(88, 95, u), -4, 0, -30, 50);
  hudTime('+30分');
  setTop('下水道を使う人の割合（2025年度末）', (countUp(t, 822) / 10).toFixed(1) + '%', fade(t, 0.15, 8.6, 0.25));
  return japan;
}
function shot7(t, T) { // result: dome at 0.38, then the 13L comparison overflows
  lift(260);
  domeLab.visible = true;
  const k = t < 4.4 ? 0.38 : lerp(0.38, 1.0, easeOut(clamp((t - 4.4) / 1.4)));
  fillDome(k); overflowRing.material.opacity = t > 5.6 ? 0.7 * clamp((t - 5.6) / 0.4) : 0; overflowRing.scale.setScalar(1 + clamp((t - 5.6) / 1.5) * 0.4);
  const u = ease(t / 7.5);
  look(lerp(3, 0, u), lerp(4.4, 6, u), lerp(20, 23, u), 0, 2.4, 0, 50);
  if (t < 5.8) setTop('全員で1回流した水（推計）', '約' + countUp(t, 47, 0.2, 1.2) + '万m³', fade(t, 0.15, 5.8, 0.2));
  else setTop('30年前の13Lトイレなら（推計）', '約' + countUp(t - 5.8, 159, 0.1, 1.0) + '万m³', fade(t, 5.8, 7.5, 0.2), '#7fd4ff');
  return stage;
}
function shot8(t, T) { // loop
  toiletRoom(); flush(0); swirl.material.opacity = 0;
  const u = ease(t / 4);
  look(lerp(0.6, 0.55, u), 1.5, lerp(-0.6, -0.7, u), -0.05, 0.8, -3.1, 50);
  setHud('全員同時に流すまで', '0:06.00', 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0013',
    title: '日本人全員が同時にトイレを流したら？',
    titleHtml: '日本人全員が同時に<br>トイレを流したら？',
    mood: 'mystery', seed: 14, hits: [6.0, 48.1], risers: [6.0],
    ask: '東京ドーム0.4杯分、多い？少ない？',
    caption: 'もしも日本人1億2,265万人が同時にトイレを流したら？\n今のトイレは1回3.8L。全員分で約47万m³、東京ドーム約0.4杯分の水が一気に下水へ（推計）。\n\n結果：下水処理場に1日に流れる量の約1%で済んだ。30年前の13Lトイレなら約3.4倍、東京ドーム約1.3杯分。節水トイレが日本を救っていた。国交省とメーカー公表値で計算してみた。\n\n東京ドーム0.4杯分、多い？少ない？ コメントで教えて。\n\n出典：総務省 人口推計（2026年9月概算）、TOTO「節水トイレ」、東京ドーム公式（容積）、国土交通省 日本の水資源の現況・下水道処理人口普及率（令和7年度末）',
    hashtags: ['もしもラボ', 'トイレ', '全員同時', '東京ドーム', '雑学'],
    endStats: [['今のトイレ1回の水', '3.8L〜', 'メーカー公表'], ['全員で1回流すと（推計）', '約47万m³', '東京ドーム約0.4杯'], ['1日に処理される下水（推計）', '約3,900万m³', '2023年度'], ['下水道の普及率', '82.2%', '2025年度末']],
    sources: '出典：総務省 人口推計、TOTO 節水トイレ、東京ドーム公式、<br>国土交通省 日本の水資源の現況・下水道処理人口普及率',
  },
});
