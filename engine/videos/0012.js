import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, randPerson, makePerson, poseWalk, makeQ, SKIN, HAIR } from '../lib.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill, storeGlows } from '../city.js';
import { market, queues, shelfItems } from '../market.js';
import { room, setRoom, setLight, setClock, setScreen, props, lamp } from '../scenes/room.js';
import { lift, look, cam, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも世界からスマホが消えたら？
// 数字：スマホを持つ人 78.9%（総務省 令和7年通信利用動向調査）
//       平日のネット利用時間 全年代183.9分・10代228.3分・20代266.9分（総務省 情報通信政策研究所 令和7年度調査）
//       キャッシュレス決済比率 58.0%（経済産業省、2025年）
//       取り戻す時間 183.9分×365日≒約47日分（推計・平日平均で計算）

function L(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }
const scrM = new THREE.MeshBasicMaterial({ color: 0x9fd8ff });
function givePhone(p) { const ph = new THREE.Group(); const b = box(0.09, 0.16, 0.02, mat('#1b1d22')); ph.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.14), scrM); s.position.z = 0.012; ph.add(s); ph.position.set(0, -0.6, 0.12); ph.rotation.x = -1.0; p.userData.arms[1].add(ph); p.userData.phone = ph; return ph; }
function phonePose(p, on) { const A = p.userData.arms; if (on) { A[1].rotation.set(-1.25, 0, -0.35); p.userData.head.rotation.x = 0.45; } else { A[1].rotation.set(0, 0, 0); p.userData.head.rotation.x = 0; } p.userData.phone.visible = on; }
// ---------- street ----------
const gStreet = new THREE.Group(); city.add(gStreet); gStreet.visible = false;
const peds = [];
{ const r = rng(23); for (let i = 0; i < 18; i++) { const p = randPerson(r); gStreet.add(p); givePhone(p); const dir = r() < .5 ? 1 : -1; const q = makeQ(); gStreet.add(q); peds.push({ p, z: 5.8 + r() * 2.4, x0: -9 + r() * 18, dir, s: 0.5 + r() * 0.4, ph: r() * 6, q }); } }
const spark = makeSparkles(300, 0.08, 0x9fd8ff); city.add(spark.points);
function streetAt(t, tv) {
  for (const w of peds) {
    const stop = tv != null && t > tv;
    w.p.visible = true;
    const tt = stop ? tv : t;
    let x = w.x0 + w.dir * tt * w.s; x = ((x + 14) % 28 + 28) % 28 - 14;
    w.p.position.set(x, 0, w.z); w.p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    if (stop) { poseWalk(w.p, 0, 0); phonePose(w.p, false); w.p.userData.head.rotation.y = Math.sin((t - tv) * 1.6 + w.ph) * 0.7; w.p.userData.arms[1].rotation.x = -0.5; }
    else { poseWalk(w.p, t * 6 + w.ph, 0.6); phonePose(w.p, true); }
    const qa = stop ? clamp((t - tv - 0.6) / 0.3) : 0; w.q.visible = qa > 0 && w.ph > 2.5; w.q.position.set(w.p.position.x, 2.45, w.p.position.z); w.q.scale.setScalar(0.55 * easeBack(qa));
  }
}
// waiting person at the store (meet-up)
const waiter = makePerson({ skin: SKIN[2], hair: HAIR[1], shirt: '#e05a4f', pants: '#2b3346', long: true }); gStreet.add(waiter); givePhone(waiter);
const waitQ = makeQ(); gStreet.add(waitQ);
// ---------- market register without payment ----------
const REG = new THREE.Vector3(-3.5, 0, 1);
const buyer = makePerson({ skin: SKIN[0], hair: HAIR[2], shirt: '#3f8f6b', pants: '#3b3f4a' }); market.add(buyer); buyer.position.set(REG.x + 1.3, 0, REG.z + 0.2); buyer.rotation.y = -Math.PI / 2 - 0.3; givePhone(buyer);
const clerk = makePerson({ skin: SKIN[3], hair: HAIR[0], shirt: '#1fb3a1', pants: '#2b3346' }); market.add(clerk); clerk.position.set(REG.x - 1.0, 0, REG.z - 0.3); clerk.rotation.y = Math.PI / 2;
const payQ = makeQ(); market.add(payQ);
const payBoard = textSprite('スマホ決済できません', { w: 768, h: 128, size: 64, bg: '#ffffff', color: '#c0262d', sx: 3.2 }); payBoard.position.set(REG.x, 3.9, REG.z - 0.2); market.add(payBoard);
// ---------- living room: family reading ----------
const fam = [];
{ const r = rng(5); for (let i = 0; i < 3; i++) { const p = randPerson(r); room.add(p); p.position.set(-0.2 + i * 0.8, -0.4, 0.55); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); const book = box(0.3, 0.22, 0.04, mat(['#e46a5b', '#4f8fd1', '#f2c14e'][i])); book.position.set(0.16, 0.95, -0.32); book.rotation.x = 0.6; p.add(book); fam.push(p); } }

const SUBS = [
  [2.6, 6.0, 'いつもの街。<br>みんな下を向いている。'],
  [6.2, 10.1, '世界中から、スマホが消えた。'],
  [10.1, 14, '持っていた人は、<br>日本で約8割。'],
  [14.2, 18.1, '待ち合わせができない。'],
  [18.1, 22, 'ネットの時間は、<br>平日1日約3時間だった。'],
  [22.2, 26.1, 'スマホ決済も、<br>地図も、もうない。'],
  [26.1, 30, 'キャッシュレスは、<br>買い物の58%。'],
  [30.2, 34.6, '家族で本を開く夜。'],
  [34.6, 39, '20代は平日1日、<br>約4時間半ネットを使っていた。'],
  [39.2, 43.6, '寝る前の画面の光が消えた。'],
  [43.6, 47.8, '10代も、平日1日<br>約3時間48分。'],
  [48.1, 52.6, '結果：1年で約47日分の<br>時間が戻ってきた（推計）。'],
  [52.6, 55.4, 'でも、連絡とお金の手段も<br>いっしょに消えた。'],
  [55.6, 59.4, '今この動画を見ている<br>あなたの手の中にも。'],
];

function cityBase(env = 'day') { setEnv(env, new THREE.Vector3(0, 0, 2)); setStore(1); setStoreLights(env === 'day' ? 0.3 : 1); setBurst(0); ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = false; updateCars(0, false); }
const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function waiterAt(t, on, qT) { waiter.visible = true; waiter.position.set(13.2, 0, 7.4); waiter.rotation.y = 0.3 + Math.sin(t * 0.7) * 0.6; phonePose(waiter, on); waiter.userData.head.rotation.y = on ? 0 : Math.sin(t * 1.3) * 0.6; waitQ.visible = qT != null && t > qT; waitQ.position.set(13.2, 2.45, 7.4); waitQ.scale.setScalar(0.55 * easeBack(clamp((t - (qT ?? 0)) / 0.3))); }
function shot0(t, T) { // hook: heads down, countdown
  gStreet.visible = true; cityBase(); streetAt(T); spark.set(0); waiter.visible = false; waitQ.visible = false;
  const u = ease(t / 2.6);
  L(lerp(1.0, 0.5, u), 2.2, lerp(15, 14.2, u), 0, 2.6, 4, 55);
  el.title.style.opacity = 1;
  setHud('スマホが消えるまで', cd(6 - T), 1, { mono: true });
  return city;
}
function shot1(t, T) {
  gStreet.visible = true; cityBase(); streetAt(T); spark.set(0); waiter.visible = false; waitQ.visible = false;
  const u = ease(t / 3.5);
  L(lerp(-1.0, -0.5, u), 2.2, lerp(15.6, 15.0, u), 0, 2.6, 4, 55);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('スマホが消えるまで', cd(Math.max(0, 6 - T)), 1, { mono: true });
  return city;
}
function shot2(t, T) { // +1min phones vanish
  gStreet.visible = true; cityBase(); streetAt(T, 6.0); waiter.visible = false; waitQ.visible = false;
  if (!spark.ok) { spark.init(peds.map(w => [w.p.position.x + (w.dir > 0 ? 0.3 : -0.3), 1.25, w.p.position.z]), 0.2, 0.8); spark.ok = true; }
  spark.set(clamp(t / 1.2)); el.flash.style.opacity = 0.45 * Math.max(0, 1 - t / 0.3);
  const u = ease(t / 8);
  L(lerp(0.5, 1.5, u), lerp(2.2, 2.6, u), lerp(14.5, 15.5, u), 0, 2.6, 4, 55);
  hudTime('+1分');
  setTop('スマホを持っている人（2025年）', (countUp(t, 789) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot3(t, T) { // +1h waiting alone
  gStreet.visible = true; cityBase('dusk'); peds.forEach(w => w.p.visible = false); peds.forEach(w => w.q.visible = false); spark.set(0);
  waiterAt(t, false, 2.0);
  const u = ease(t / 8);
  L(lerp(12.2, 12.5, u), 1.5, lerp(12.6, 12.1, u), 12.7, 1.1, 7.4, 50);
  hudTime('+1時間');
  setTop('ネットの利用時間（平日・2025年度）', (countUp(t, 1839) / 10).toFixed(1) + '分', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot4(t, T) { // +1day can't pay
  lift(260);
  for (const q of queues) q.p.visible = false; for (const s of shelfItems) s.it.visible = true;
  phonePose(buyer, false); buyer.userData.head.rotation.y = Math.sin(t * 1.2) * 0.4; buyer.userData.arms[1].rotation.x = -0.4;
  payQ.visible = t > 1.5; payQ.position.set(buyer.position.x, 2.45, buyer.position.z); payQ.scale.setScalar(0.55 * easeBack(clamp((t - 1.5) / 0.3)));
  const u = ease(t / 8);
  L(REG.x + lerp(0.2, -0.3, u), 4.5, lerp(10.4, 9.8, u), REG.x - 0.5, 4.4, REG.z - 0.4, 50);
  hudTime('+1日');
  setTop('キャッシュレス決済の割合（2025年）', (countUp(t, 580) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return market;
}
function shot5(t, T) { // +1week family reading
  setRoom({ sets: ['living'] }); setLight('evening', { ceil: 0, hemi: 1.2 }); props.sleeper.visible = false;
  setScreen((g, w, h) => { g.fillStyle = '#16181d'; g.fillRect(0, 0, w, h); });
  fam.forEach((p, i) => { p.visible = true; p.userData.head.rotation.x = 0.35 + Math.sin(t * 0.6 + i) * 0.05; p.userData.arms.forEach(a => a.rotation.x = -1.0); });
  const u = ease(t / 9);
  L(lerp(0.9, 0.5, u), 2.2, lerp(-3.0, -3.2, u), 0.6, 1.2, 0.6, 62);
  hudTime('+1週間');
  setTop('20代のネット利用時間（平日・2025年度）', (countUp(t, 2669) / 10).toFixed(1) + '分', fade(t, 0.15, 9, 0.25));
  return room;
}
function shot6(t, T) { // +1month bedroom: asleep, dark
  fam.forEach(p => p.visible = false);
  setRoom({ sets: ['bed'] }); setLight('night', { ceil: 0, hemi: 0.75, lamp: 1.2 }); lamp.position.set(0.3, 1.2, -2.6); setClock('22:30', '#ff5b4f'); props.sleeper.visible = true; props.phone.visible = false;
  const u = ease(t / 8.6);
  L(lerp(3.2, 3.5, u), lerp(2.3, 2.6, u), lerp(0.4, 1.0, u), 1.4, 0.8, -2.3, 50);
  hudTime('+1か月');
  setTop('10代のネット利用時間（平日・2025年度）', (countUp(t, 2283) / 10).toFixed(1) + '分', fade(t, 0.15, 8.6, 0.25));
  return room;
}
function shot7(t, T) { // result: city aerial at dusk
  gStreet.visible = false; cityBase('dusk'); updateCars(T, true);
  for (const s of storeGlows) { s.gm.emissiveIntensity = 1; s.band.emissiveIntensity = 0.8; s.sp.material.opacity = 0.6; }
  const u = ease(t / 7.5);
  L(lerp(10, 40, u), lerp(35, 140, u), lerp(40, 140, u), 0, 0, lerp(-5, -25, u), 55);
  setTop('1年で戻ってくる時間（推計）', '約' + countUp(t, 47, 0.2, 1.2) + '日分', fade(t, 0.15, 7.5, 0.25), '#7ff0c8');
  return city;
}
function shot8(t, T) { // loop: heads down again
  gStreet.visible = true; cityBase(); streetAt(T - 55.6); spark.set(0); waiter.visible = false; waitQ.visible = false;
  const u = ease(t / 4);
  L(lerp(1.2, 1.0, u), 2.2, lerp(15.3, 15, u), 0, 2.6, 4, 55);
  setHud('スマホが消えるまで', '0:06.00', 1, { mono: true });
  return city;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, camera: cityCam,
  meta: {
    id: '0012',
    title: '世界からスマホが消えたら？',
    titleHtml: '世界からスマホが<br>消えたら？',
    mood: 'mystery', seed: 13, hits: [6.0, 48.1], risers: [6.0],
    caption: 'もしも世界からスマホが一瞬で消えたら？\n平日のネット利用は1日約3時間。待ち合わせ、キャッシュレス、寝る前の時間はどうなる？総務省・経済産業省のデータでシミュレーション。\n\n出典：総務省 令和7年通信利用動向調査、総務省 情報通信政策研究所 令和7年度情報通信メディアの利用時間と情報行動に関する調査、経済産業省 キャッシュレス決済比率（2025年）',
    hashtags: ['もしもラボ', 'スマホ', 'デジタルデトックス', 'スマホ依存', '雑学'],
    endStats: [['スマホを持つ人', '78.9%', '2025年'], ['平日のネット利用時間', '183.9分', '2025年度'], ['キャッシュレス決済の割合', '58.0%', '2025年'], ['1年で戻る時間（推計）', '約47日分', '平日平均×365日']],
    sources: '出典：総務省 通信利用動向調査（令和7年）・情報通信メディアの利用時間<br>と情報行動に関する調査（令和7年度）、経済産業省（2025年）',
  },
});
