import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, randPerson, poseWalk, walkAlong, makeQ } from '../lib.js';
import { porch, canopy, DOORSTEP, makeParcel, makeVan, makeCourier, carryPose, makePile, setPorchEnv } from '../scenes/delivery.js';
import { stage, makeLabel, makeCrowd, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも宅配便が止まったら？
// 数字：宅配便取扱個数 50億3,147万個（2024年度／国土交通省 令和6年度 宅配便・メール便取扱実績、2025年8月27日公表）
//       → 1日あたり 約1,378万個・1か月あたり 約4.2億個（365日・12か月で割った推計）
//       BtoC-EC市場規模 26.1兆円・物販系のEC化率 9.8%（2024年／経済産業省 令和6年度 電子商取引に関する市場調査、2025年8月26日公表）
//       2030年度に輸送能力の34.1%が不足する可能性（国土交通省 持続可能な物流の実現に向けた検討会 最終取りまとめ、2023年8月）
// 宅配会社は架空の もしも便（実在の会社の色・ロゴ・制服は使わない）

// ---------- porch props ----------
const stepParcels = [makeParcel(0.7, 0.45, 0.5), makeParcel(0.5, 0.35, 0.4), makeParcel(0.42, 0.28, 0.36)];
stepParcels[0].position.set(-0.25, 0.2, -1.15); stepParcels[0].rotation.y = 0.1;
stepParcels[1].position.set(0.45, 0.2, -1.1); stepParcels[1].rotation.y = -0.25;
stepParcels[2].position.set(-0.2, 0.65, -1.15); stepParcels[2].rotation.y = 0.3;
stepParcels.forEach(p => porch.add(p));
const stepSpark = makeSparkles(220, 0.12); porch.add(stepSpark.points);
stepSpark.init([[-0.25, 0.5, -1.15], [0.45, 0.4, -1.1], [-0.2, 0.8, -1.15]], 0.5, 1.4);
const van = makeVan(); van.position.set(-2.5, 0, 6.3); van.rotation.y = 0; porch.add(van);
const courier = makeCourier(4); porch.add(courier);
const held = makeParcel(0.55, 0.38, 0.42); porch.add(held);
const cq = makeQ(); porch.add(cq);
const resident = randPerson(rng(31), { long: true, skirt: false }); resident.position.set(0.15, 0.2, -1.55); resident.rotation.y = 0; porch.add(resident);
const phone = box(0.09, 0.17, 0.02, mat('#1f2430')); porch.add(phone);
const rq = makeQ(); porch.add(rq);
function holdBox(p, b) { // box in front of chest
  const fwd = new THREE.Vector3(Math.sin(p.rotation.y), 0, Math.cos(p.rotation.y));
  b.position.set(p.position.x + fwd.x * 0.42, p.position.y + 0.95, p.position.z + fwd.z * 0.42); b.rotation.y = p.rotation.y;
}
// street walkers carrying boxes (+1か月)
const walkers = [];
{
  const r = rng(808);
  for (let i = 0; i < 26; i++) {
    const p = randPerson(r); porch.add(p);
    const b = makeParcel(0.45 + r() * 0.25, 0.3 + r() * 0.2, 0.38 + r() * 0.12); porch.add(b);
    const dir = r() < 0.5 ? 1 : -1, z = dir > 0 ? 12.55 + (r() - .5) * 0.3 : 11.95 + (r() - .5) * 0.3;
    walkers.push({ p, b, dir, z, x0: (r() - .5) * 40, sp: 1.0 + r() * 0.5, ph: r() * 6 });
  }
}
function setWalkers(on, T = 0) {
  for (const w of walkers) {
    w.p.visible = w.b.visible = on; if (!on) continue;
    let x = ((w.x0 + T * w.sp * w.dir + 20) % 40 + 40) % 40 - 20;
    w.p.position.set(x, 0.12, w.z); w.p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    poseWalk(w.p, T * 7 + w.ph, 0.7); carryPose(w.p); holdBox(w.p, w.b);
  }
}
// cars on the road (one lane each way); busy in +1か月
const cars = [];
{
  const COLS = ['#d94b4b', '#3b6fb6', '#e7e3da', '#2d2f36', '#59606e', '#f2c14e'];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    const b = box(4, 0.9, 1.8, mat(COLS[i % COLS.length])); b.position.y = 0.75; g.add(b);
    const c = box(2.2, 0.7, 1.6, mat('#dfe6ee')); c.position.set(-0.2, 1.5, 0); g.add(c);
    for (const x of [-1.3, 1.3]) for (const s of [-1, 1]) { const w = box(0.7, 0.7, 0.25, mat('#1b1d22')); w.position.set(x, 0.35, s * 0.85); g.add(w); }
    porch.add(g); cars.push({ g, lane: i % 2 ? 9.8 : 6.3, dir: i % 2 ? -1 : 1, off: i * 11 });
  }
}
function setCars(on, T = 0, sp = 6) {
  for (const k of cars) {
    k.g.visible = on && cars.indexOf(k) < 5; if (!k.g.visible) continue;
    let x = ((T * sp + k.off) % 80 + 80) % 80 - 40; if (k.dir < 0) x = -x;
    k.g.position.set(x, 0, k.lane); k.g.rotation.y = k.dir > 0 ? 0 : Math.PI;
  }
}

function porchBase(env = 'day', { parcels = false, vanOn = true } = {}) {
  setPorchEnv(env); canopy.visible = true; stepParcels.forEach(p => p.visible = parcels); stepSpark.set(0);
  van.visible = vanOn; van.userData.setHazard(false); van.userData.setDoor(0);
  courier.visible = false; held.visible = false; cq.visible = false;
  resident.visible = false; phone.visible = false; rq.visible = false;
  setWalkers(false); setCars(false);
}

// ---------- stage: pile + tiles + crowd ----------
const pile = makePile(stage, { cols: 14, rows: 8, layers: 9, size: 0.9, x: 0, z: -1 });
const pileLab = makeLabel('止まった荷物', { sx: 3.2, size: 60, bg: 'rgba(20,26,40,.75)' }); stage.add(pileLab);
const TILES = new THREE.Group(); stage.add(TILES);
const tiles = [];
{
  const on = new Set([44, 45, 54, 55, 34, 35, 64, 65, 43, 56]); // 10 tiles near the middle = ネット
  for (let i = 0; i < 100; i++) {
    const x = (i % 10 - 4.5) * 1.05, z = (Math.floor(i / 10) - 4.5) * 1.05;
    const isNet = on.has(i);
    const t = box(0.95, 0.25, 0.95, mat(isNet ? '#c89a62' : '#3f5f8f')); t.position.set(x, 0.42, z); TILES.add(t);
    tiles.push({ t, isNet, q: ((i * 37) % 100) / 100 });
  }
}
const netLab = makeLabel('ネットで買う', { sx: 3.0, size: 60, bg: 'rgba(200,154,98,.95)', color: '#2a1c0e' }); netLab.position.set(0, 2.2, 0); TILES.add(netLab);
const shopLab = makeLabel('お店で買う', { sx: 2.8, size: 60, bg: 'rgba(30,45,70,.85)' }); shopLab.position.set(0, 1.4, -5.8); TILES.add(shopLab);
const crowd = makeCrowd(36, 12, { w: 16, d: 3.2, x: 0, z: 6.5 });
const crowdBoxes = crowd.people.map(p => { const b = makeParcel(0.5, 0.34, 0.4); crowd.g.add(b); return b; });
function stageBase() {
  setStageColor('#14213a'); pile.setN(0); pile.mesh.visible = true; pileLab.visible = false;
  TILES.visible = false; crowd.g.visible = false;
}
function showCrowd(T, k = 1) {
  crowd.g.visible = true;
  crowd.people.forEach((p, i) => { p.rotation.y = 0; poseWalk(p, T * 6 + i, 0.5); carryPose(p); holdBox(p, crowdBoxes[i]); p.visible = crowdBoxes[i].visible = i / crowd.people.length < k; });
}

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの夕方の玄関。'],
  [6.2, 10.0, '日本中の宅配便が、<br>いっせいに止まった。'],
  [10.1, 14.0, '荷物は、トラックの中で<br>止まったまま。'],
  [14.2, 18.0, '1日で止まる荷物は…'],
  [18.1, 22.0, '約1,378万個（推計）'],
  [22.2, 26.0, 'ネットで買った物が、<br>何も届かない。'],
  [26.1, 30.0, 'ネット通販は、1年で<br>26.1兆円の市場。'],
  [30.2, 34.6, 'モノの買い物の<br>約1割がネット通販。'],
  [34.6, 39.0, 'その荷物が、<br>家まで来なくなった。'],
  [39.2, 43.6, '荷物は、自分で<br>取りに行くしかない。'],
  [43.6, 47.8, '止まった荷物は、1か月で<br>約4.2億個（推計）'],
  [48.1, 52.6, '結果：年50億個の荷物を、<br>自分で運ぶ暮らしになった。'],
  [52.6, 55.4, '現実でも2030年度、<br>輸送力34.1%不足の恐れ。'],
  [55.6, 59.4, '今月、荷物は<br>何個届いた？'],
];

const hookCam = (t) => { const u = ease(t / 2.5); look(lerp(1.2, 0.9, u), 1.5, lerp(6.6, 6.0, u), 0, 1.1, -1.5, 50); };
function shot0(t, T) { // hook: parcels on the step vanish at 1.2s
  lift(170);
  porchBase('dusk', { parcels: T < 1.2, vanOn: false }); canopy.visible = false;
  stepSpark.set(clamp((T - 1.2) / 1.1));
  hookCam(t);
  el.title.style.opacity = 1;
  setTop('1日に届く宅配便（2024年度・推計）', '約' + comma(countUp(t, 1378, 0.0, 1.0)) + '万個', 1);
  return porch;
}
function shot1(t, T) { // daily: courier carries a parcel from the van to the door
  porchBase('dusk', { parcels: false });
  courier.visible = held.visible = true;
  van.userData.setDoor(clamp(t / 0.6));
  walkAlong(courier, [[-3.6, 5.2, 0], [-1.2, 4.0, 1.2], [0, 1.6, 2.6], [0, -0.3, 3.5]], t, 7);
  carryPose(courier); holdBox(courier, held);
  const u = ease(t / 3.5);
  look(lerp(4.5, 4.0, u), lerp(3.6, 3.3, u), lerp(10.5, 9.5, u), -0.8, 0.9, 1.5, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return porch;
}
function shot2(t, T) { // +1分: stopped. hazards, courier stands with ?
  lift(340);
  porchBase('dusk', { parcels: false });
  van.userData.setDoor(0); van.userData.setHazard(Math.floor(T * 2.5) % 2 === 0);
  courier.visible = true; courier.position.set(0.9, 0.12, 3.9); courier.rotation.y = -2.4; poseWalk(courier, 0, 0); carryPose(courier, 0);
  cq.visible = t > 0.4; cq.position.set(0.9, 2.55, 3.9); cq.material.opacity = clamp((t - 0.4) / 0.3);
  const u = ease(t / 8);
  look(lerp(7.4, 7.8, u), lerp(3.4, 3.6, u), lerp(0.2, -0.3, u), -1.2, 1.2, 5.6, 50);
  hudTime('+1分');
  setTop('1年に運ばれる宅配便（2024年度）', (() => { const v = countUp(t, 503147, 0.3, 1.6); return `${Math.floor(v / 10000)}億${comma(v % 10000)}万個`; })(), fade(t, 0.15, 8, 0.25));
  return porch;
}
function shot3(t, T) { // +1日: pile grows
  lift(330);
  stageBase(); pile.setN(1008 * easeOut(clamp((t - 0.3) / 4.5)));
  pileLab.visible = true; pileLab.position.set(0, pile.height(pile.mesh.count) + 1.2, -1);
  const u = ease(t / 8);
  look(lerp(-4, 4, u), lerp(10, 11, u), lerp(23, 22, u), 0, 3.0, -1, 50);
  hudTime('+1日');
  setTop('1日に止まる荷物（2024年度・推計）', '約' + comma(countUp(t, 1378, 0.3, 1.6)) + '万個', fade(t, 0.15, 8, 0.25));
  return stage;
}
function shot4(t, T) { // +3日: resident waits at the door with a phone
  lift(320);
  porchBase('night', { parcels: false, vanOn: false });
  resident.visible = phone.visible = true; poseWalk(resident, 0, 0);
  resident.userData.arms[1].rotation.x = -1.1; resident.userData.head.rotation.x = 0.35;
  phone.position.set(0.42, 1.45, -1.1); phone.rotation.x = -0.5;
  rq.visible = t > 0.6; rq.position.set(0.15, 2.65, -1.55); rq.material.opacity = clamp((t - 0.6) / 0.3);
  const u = ease(t / 8);
  look(lerp(1.4, 0.8, u), lerp(2.2, 2.0, u), lerp(4.6, 4.0, u), 0, 1.3, -1.5, 50);
  hudTime('+3日');
  setTop('ネット通販の市場規模（2024年）', (countUp(t, 261, 0.3, 1.4) / 10).toFixed(1) + '兆円', fade(t, 0.15, 8, 0.25));
  return porch;
}
function shot5(t, T) { // +1週間: 100 tiles, 10 are net
  lift(300);
  stageBase(); TILES.visible = true;
  tiles.forEach(o => { const k = easeOut(clamp((t - 0.2 - o.q * 1.2) / 0.5)); o.t.scale.set(1, Math.max(0.01, k), 1); o.t.position.y = 0.3 + 0.125 * k + (o.isNet ? 0.6 * easeOut(clamp((t - 2.2) / 0.8)) : 0); });
  netLab.visible = t > 2.6; shopLab.visible = false;
  const u = ease(t / 8.8);
  look(lerp(0, 1.5, u), lerp(19, 18, u), lerp(10, 9.5, u), 0, 0, -0.3, 50);
  hudTime('+1週間');
  setTop('モノの買い物のうちネット通販（2024年）', (countUp(t, 98, 0.4, 1.6) / 10).toFixed(1) + '%', fade(t, 0.15, 8.8, 0.25));
  return stage;
}
function shot6(t, T) { // +1か月: people carry boxes along the street
  lift(260);
  porchBase('day', { parcels: false, vanOn: false });
  setWalkers(true, T); setCars(true, T, 3.5);
  const u = ease(t / 8.8);
  look(lerp(-3, 3, u), 17, -3, lerp(-3, 3, u), 0, 12, 50);
  hudTime('+1か月');
  setTop('1か月で止まる荷物（2024年度・推計）', '約' + (countUp(t, 42, 0.3, 1.4) / 10).toFixed(1) + '億個', fade(t, 0.15, 8.8, 0.25));
  return porch;
}
function shot7(t, T) { // result: huge pile + crowd carrying boxes
  lift(330);
  stageBase(); pile.setN(pile.max); pileLab.visible = false; showCrowd(T, 1);
  const u = ease(t / 7.5);
  look(lerp(3, -2, u), lerp(8, 9, u), lerp(22, 23, u), 0, 3.0, 0, 50);
  if (t < 4.5) setTop('1年に運ばれる宅配便（2024年度）', (() => { const v = countUp(t, 503147, 0.2, 1.4); return `${Math.floor(v / 10000)}億${comma(v % 10000)}万個`; })(), fade(t, 0.15, 4.5, 0.2));
  else setTop('2030年度に足りなくなるおそれの輸送力（国の試算）', (countUp(t - 4.5, 341, 0.1, 1.0) / 10).toFixed(1) + '%', fade(t, 4.5, 7.5, 0.2), '#ff8a7a');
  return stage;
}
function shot8(t, T) { // loop: the step stays empty
  lift(170);
  porchBase('dusk', { parcels: false, vanOn: false }); canopy.visible = false;
  hookCam(t * 0.5);
  return porch;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0030',
    title: '宅配便が止まったら？',
    titleHtml: '宅配便が<br>止まったら？',
    mood: 'mystery', seed: 30, hits: [1.2, 6.0, 48.1], risers: [6.0],
    ask: '今月、荷物は何個届いた？',
    caption: 'もしも日本中の宅配便が止まったら？\n宅配便は1年で50億3,147万個（2024年度）。1日あたり約1,378万個の荷物が止まり、ネット通販26.1兆円の買い物が家に届かなくなる（推計）。国の統計で計算してみた。\n\n今月、荷物は何個届いた？ コメントで教えて。\n\n出典：国土交通省 令和6年度 宅配便・メール便取扱実績、経済産業省 令和6年度 電子商取引に関する市場調査、国土交通省 持続可能な物流の実現に向けた検討会 最終取りまとめ（2023年8月）',
    hashtags: ['もしもラボ', '宅配便', '物流2024年問題', 'ネット通販', '雑学'],
    endStats: [['宅配便の取扱個数', '50億3,147万個', '2024年度'], ['1日あたり（推計）', '約1,378万個', '2024年度'], ['ネット通販の市場', '26.1兆円', '2024年'], ['2030年度の輸送力不足', '34.1%', '国の試算']],
    sources: '出典：国土交通省 宅配便・メール便取扱実績（令和6年度）、<br>経済産業省 電子商取引に関する市場調査（令和6年度）、<br>国土交通省 持続可能な物流の実現に向けた検討会',
    narr: { '50億3,147万個': '50億3147万個', '1,378万個': '1378万個', '2030年度': 'にせんさんじゅう年度', '34.1%': 'さんじゅうよんてんいちパーセント', '4.2億個': 'よんてんにおくこ' },
  },
});
