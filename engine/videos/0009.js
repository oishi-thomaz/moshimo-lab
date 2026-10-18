import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, poseWalk, makeQ, SKIN, HAIR, SHIRT, PANTS } from '../lib.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill } from '../city.js';
import { room, setRoom, setLight, props } from '../scenes/room.js';
import { japan, setDots, setMapEnv } from '../scenes/japan.js';
import { look, cam, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも日本から女性が全員消えたら？
// 数字：総人口 1億2,265万人・男性5,968万人・女性6,297万人（総務省 人口推計 2026年9月1日概算）
//       就業看護師 1,363,142人のうち女性1,245,074人＝91.3%（厚生労働省 令和6年衛生行政報告例）
//       訪問介護員の女性の割合 83.0%（介護労働安定センター 令和7年度介護労働実態調査・回答者）
//       6歳未満の子がいる夫婦の家事関連時間 妻7時間28分・夫1時間54分（総務省 令和3年社会生活基本調査）
//       出生数 671,270人（厚生労働省 令和7年人口動態統計 確定数）

function L(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }
const pick = (r, a) => a[Math.floor(r() * a.length)];
function man(r, extra = {}) { return makePerson({ skin: pick(r, SKIN), hair: pick(r, HAIR), shirt: pick(r, SHIRT), pants: pick(r, PANTS), scale: 0.98 + r() * 0.1, ...extra }); }
function woman(r, extra = {}) { return makePerson({ skin: pick(r, SKIN), hair: pick(r, HAIR), shirt: pick(r, SHIRT), pants: pick(r, PANTS), long: true, skirt: r() < 0.5, scale: 0.92 + r() * 0.08, ...extra }); }

// ---------- street ----------
const gStreet = new THREE.Group(); city.add(gStreet); gStreet.visible = false;
const peds = [];
{ const r = rng(14); for (let i = 0; i < 20; i++) { const f = i % 2 === 0; const p = f ? woman(r) : man(r); gStreet.add(p); const dir = r() < .5 ? 1 : -1; const q = makeQ(); gStreet.add(q); peds.push({ p, f, z: 5.8 + r() * 2.4, x0: -9 + r() * 18, dir, s: 0.8 + r() * 0.5, ph: r() * 6, q }); } }
const streetSpark = makeSparkles(400, 0.16); city.add(streetSpark.points);
function streetAt(t, tv) {
  for (const w of peds) {
    const tt = tv != null ? Math.min(t, tv + 0.3) : t;
    let x = w.x0 + w.dir * tt * w.s; x = ((x + 14) % 28 + 28) % 28 - 14;
    w.p.position.set(x, 0, w.z); w.p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const gone = tv != null && w.f && t >= tv; w.p.visible = !gone;
    if (tv != null && t > tv + 0.3) { poseWalk(w.p, 0, 0); w.p.userData.head.rotation.y = Math.sin((t - tv) * 1.7 + w.ph) * 0.8; } else poseWalk(w.p, t * 7 + w.ph);
    const qa = tv != null && !w.f ? clamp((t - tv - 0.8) / 0.3) : 0; w.q.visible = qa > 0; w.q.position.set(w.p.position.x, 2.45, w.p.position.z); w.q.scale.setScalar(0.55 * easeBack(qa));
  }
}
// ---------- hospital ward ----------
const gWard = new THREE.Group(); room.add(gWard);
const nurses = [];
{
  const r = rng(30);
  for (let i = 0; i < 3; i++) { const x = -2.6 + i * 2.6; const pt = man(r, { shirt: '#c9dbe8', pants: '#c9dbe8' }); pt.rotation.x = -Math.PI / 2; pt.position.set(x, 0.74, -1.25); gWard.add(pt); }
  for (let i = 0; i < 3; i++) { const n = woman(r, { shirt: '#f2a7b8', pants: '#f2a7b8', skirt: false }); n.position.set(-1.3 + i * 2.6, 0, -1.0 + (i % 2) * 0.4); n.rotation.y = i % 2 ? -0.6 : 0.6; gWard.add(n); nurses.push(n); }
}
const wardSpark = makeSparkles(200, 0.06); room.add(wardSpark.points); wardSpark.init(nurses.map(n => [n.position.x, 1.2, n.position.z]), 0.6, 1);
// ---------- living room: elderly man waiting ----------
const gCare = new THREE.Group(); room.add(gCare);
const elder = makePerson({ skin: SKIN[1], hair: '#c8c8c8', shirt: '#8a7a6a', pants: '#4a4f5c' }); gCare.add(elder);
elder.position.set(0.6, -0.4, 0.55); elder.rotation.y = Math.PI; elder.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2);
const careQ = makeQ(); gCare.add(careQ);
// ---------- kitchen: father with a baby ----------
const gKitchen = new THREE.Group(); room.add(gKitchen);
const dad = makePerson({ skin: SKIN[2], hair: HAIR[0], shirt: '#4fa3d1', pants: '#2b3346' }); gKitchen.add(dad); dad.position.set(0.3, 0, -2.1); dad.rotation.y = 0.5;
const baby = makePerson({ skin: SKIN[3], hair: HAIR[4], shirt: '#ffe066', pants: '#ffe066', scale: 0.42 }); dad.add(baby); baby.position.set(-0.32, 1.05, 0.34); baby.rotation.set(0, 0, -Math.PI / 2);
dad.userData.arms.forEach(a => a.rotation.x = -1.0);
const dadQ = makeQ(); gKitchen.add(dadQ);
const kid = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#e05a4f', pants: '#3b3f4a', scale: 0.6 }); gKitchen.add(kid); kid.position.set(-1.2, 0, -1.4);
// ---------- nursery: empty cribs ----------
const gNursery = new THREE.Group(); room.add(gNursery);
for (let i = 0; i < 8; i++) { const x = -2.7 + (i % 4) * 1.8, z = -2.8 + Math.floor(i / 4) * 1.6; const c = box(1.0, 0.45, 0.65, new THREE.MeshLambertMaterial({ color: '#dff1ff', transparent: true, opacity: 0.75 })); c.position.set(x, 0.85, z); gNursery.add(c); const st = box(0.9, 0.62, 0.55, mat('#e9ecef')); st.position.set(x, 0.31, z); gNursery.add(st); const bl = box(0.8, 0.06, 0.5, mat(i % 2 ? '#ffd6e0' : '#d6e8ff')); bl.position.set(x, 0.66, z); gNursery.add(bl); }
function roomGroups(g) { for (const x of [gWard, gCare, gKitchen, gNursery]) x.visible = x === g; props.sleeper.visible = false; }
function cityBase() { setEnv('day', new THREE.Vector3(0, 0, 2)); setStore(1); setStoreLights(0.3); setBurst(0); ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = false; updateCars(0, false); }
const qAt = (q, p, t, t0, y = 2.25) => { q.visible = t > t0; q.position.set(p.position.x, y, p.position.z); q.scale.setScalar(0.55 * easeBack(clamp((t - t0) / 0.3))); };

const SUBS = [
  [2.6, 6.0, 'いつもの昼の街。<br>男の人と、女の人。'],
  [6.2, 10.1, '+1分。日本の女性<br>6,297万人が消えた。'],
  [10.1, 14, '人口の、<br>半分以上。'],
  [14.2, 18.1, '+1時間。病院から<br>看護師の9割が消えた。'],
  [18.1, 22, '124万人以上の看護師が、<br>いない。'],
  [22.2, 26.1, '+1日。介護の現場も<br>人が足りない。'],
  [26.1, 30, '訪問介護の8割以上を、<br>女性が担っていた。'],
  [30.2, 34.6, '+1週間。家事と育児が<br>一気にのしかかる。'],
  [34.6, 39, '子育て中の妻は1日約7時間半、<br>夫は約2時間だった。'],
  [39.2, 43.6, '+1年。生まれる赤ちゃんは<br>0人。'],
  [43.6, 47.8, '前の年は、<br>67万1,270人だった。'],
  [48.1, 52.6, '結果：人口は半分以下になり、<br>病院と介護から止まった。'],
  [52.6, 55.4, '実は今も、子育て中の家事は<br>妻が夫の約4倍。'],
  [55.6, 59.4, 'あなたの毎日も、<br>だれかの手で回っている。'],
];

const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function shot0(t, T) { // hook: countdown over the map
  setMapEnv('day'); setDots((i, x, z, q) => ({ color: i % 2 ? '#7fb6ff' : '#ff9ab8' }));
  const u = ease(t / 2.6);
  L(lerp(-8, -4, u), lerp(300, 285, u), lerp(95, 85, u), -4, 0, -30, 50);
  el.title.style.opacity = 1;
  setHud('女性が消えるまで', cd(6 - T), 1, { mono: true });
  return japan;
}
function shot1(t, T) { // everyday street
  gStreet.visible = true; cityBase(); streetAt(T); streetSpark.set(0);
  const u = ease(t / 3.5);
  L(lerp(-1, 0, u), lerp(2.3, 2.4, u), lerp(18, 17, u), 0, 2.9, 2, 58);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('女性が消えるまで', cd(Math.max(0, 6 - T)), 1, { mono: true });
  return city;
}
function shot2(t, T) { // +1min women vanish
  gStreet.visible = true; cityBase(); streetAt(T, 6.0);
  if (!streetSpark.ok) { streetSpark.init(peds.filter(w => w.f).map(w => [w.p.position.x, 1.2, w.p.position.z]), 0.8, 1.4); streetSpark.ok = true; }
  streetSpark.set(clamp(t / 1.4)); el.flash.style.opacity = 0.5 * Math.max(0, 1 - t / 0.3);
  const u = ease(t / 8);
  L(lerp(0, 1, u), lerp(2.4, 2.8, u), lerp(17, 16, u), 0, 2.9, 2, 58);
  hudTime('+1分');
  setTop('日本の女性人口（2026年9月）', comma(countUp(t, 6297)) + '万人', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot3(t, T) { // +1h ward, nurses vanish
  roomGroups(gWard); setRoom({ sets: ['ward'] }); setLight('day', { ceil: 0, hemi: 1.25 });
  const tv = 0.8; nurses.forEach(n => n.visible = t < tv); wardSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  const u = ease(t / 8);
  L(lerp(-0.6, 0.6, u), 2.7, lerp(6.4, 5.8, u), 0.3, 1.5, -2.2, 55);
  hudTime('+1時間');
  setTop('看護師に占める女性（2024年末）', (countUp(t, 913) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t, T) { // +1day elderly waiting alone
  roomGroups(gCare); setRoom({ sets: ['living'] }); setLight('evening', { ceil: 0, hemi: 1.2 });
  elder.userData.head.rotation.y = Math.sin(t * 0.8) * 0.5; qAt(careQ, elder, t, 2.5, 1.9);
  const u = ease(t / 8);
  L(lerp(1.5, 1.8, u), 1.9, lerp(-2.4, -2.8, u), 0.5, 1.3, 0.6, 50);
  hudTime('+1日');
  setTop('訪問介護員の女性の割合（2025年度調査）', (countUp(t, 830) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot5(t, T) { // +1week dad with baby in the kitchen
  roomGroups(gKitchen); setRoom({ sets: ['kitchen'] }); setLight('day', { ceil: 0, hemi: 1.0 });
  dad.rotation.y = 0.5 + Math.sin(t * 0.9) * 0.4; baby.rotation.z = -Math.PI / 2 + Math.sin(t * 3) * 0.1; kid.rotation.y = Math.sin(t * 1.3) * 0.8; qAt(dadQ, dad, t, 3.0);
  const u = ease(t / 9);
  L(lerp(0.2, -0.3, u), 2.0, lerp(3.0, 2.4, u), -0.3, 1.2, -2.0, 52);
  hudTime('+1週間');
  setTop('子育て中の妻の家事・育児（2021年）', '1日' + Math.floor(countUp(t, 448) / 60) + '時間' + (countUp(t, 448) % 60) + '分', fade(t, 0.15, 9, 0.25));
  return room;
}
function shot6(t, T) { // +1year nursery empty
  roomGroups(gNursery); setRoom({ sets: [] , floor: 'tile', wall: '#f6efe9' }); setLight('day', { ceil: 0, hemi: 1.25 });
  const u = ease(t / 8.6);
  L(lerp(-0.5, 0.5, u), 3.0, lerp(4.0, 3.2, u), 0, 0.7, -2.0, 52);
  hudTime('+1年');
  const v = t < 4.4 ? Math.round(671270 * (1 - easeOut(clamp((t - 0.6) / 2.4)))) : 671270;
  setTop(t < 4.4 ? 'この1年に生まれた赤ちゃん' : '前の年に生まれた赤ちゃん（2025年）', comma(t < 4.4 ? v : countUp(t - 4.4, 671270, 0.1, 1.2)) + '人', fade(t, 0.15, 8.6, 0.25), t < 4.4 ? '#ff8a7a' : '#fff');
  return room;
}
function shot7(t, T) { // result: night map, half the dots
  setMapEnv('night'); setDots((i, x, z, q) => ({ hide: i % 2 === 0, color: '#7fb6ff' }));
  const u = ease(t / 7.5);
  L(lerp(0, -6, u), lerp(240, 300, u), lerp(80, 95, u), -4, 0, -30, 50);
  setTop('残った人口（2026年9月の男性人口）', comma(countUp(t, 5968, 0.2, 1.2)) + '万人', fade(t, 0.15, 7.5, 0.25));
  return japan;
}
function shot8(t, T) { // loop
  setMapEnv('day'); setDots((i, x, z, q) => ({ color: i % 2 ? '#7fb6ff' : '#ff9ab8' }));
  const u = ease(t / 4);
  L(lerp(-10, -8, u), lerp(306, 300, u), lerp(98, 95, u), -4, 0, -30, 50);
  setHud('女性が消えるまで', '0:06.00', 1, { mono: true });
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
    id: '0009',
    title: '日本から女性が全員消えたら？',
    titleHtml: '日本から女性が<br>全員消えたら？',
    mood: 'mystery', seed: 10, hits: [6.0, 48.1], risers: [6.0],
    caption: 'もしも日本から女性6,297万人が一瞬で消えたら？\n看護師の91.3%、訪問介護員の83.0%が女性。病院、介護、家事と育児、そして出生数はどうなるのか。公式統計でシミュレーション。\n\n出典：総務省 人口推計（2026年9月概算）・令和3年社会生活基本調査、厚生労働省 令和6年衛生行政報告例・令和7年人口動態統計（確定数）、介護労働安定センター 令和7年度介護労働実態調査',
    hashtags: ['もしもラボ', 'もしもシリーズ', '看護師', '少子化', '雑学'],
    endStats: [['日本の女性人口', '6,297万人', '2026年9月'], ['看護師に占める女性', '91.3%', '2024年末'], ['訪問介護員の女性（調査）', '83.0%', '2025年度'], ['出生数', '671,270人', '2025年']],
    sources: '出典：総務省 人口推計・社会生活基本調査、厚生労働省 衛生行政報告例・<br>人口動態統計、介護労働安定センター 介護労働実態調査',
  },
});
