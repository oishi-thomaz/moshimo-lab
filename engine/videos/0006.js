import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, randPerson, poseWalk, walkAlong, SKIN, HAIR, makeQ } from '../lib.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, storeGlows, updateCars, parked, winMats, bulbM, slLights, setBurst, ghost, ghostScr, ghostFill } from '../city.js';
import { room, setRoom, setLight, setClock, props, glow, lamp } from '../scenes/room.js';
import { look, cam, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも日本中の電気が1週間止まったら？
// 数字：世帯数 6,174万7,140世帯（総務省 住民基本台帳 2026年1月1日）
//       2018年 北海道胆振東部地震のブラックアウト 最大停電 約295万戸（内閣府）、ほぼ全域に供給できるまで約45時間（経済産業省 電力レジリエンスWG）
//       停電による断水 43,509戸（総務省 2018年）、停電でポンプが止まると断水・マンション等に住む都民 約900万人（東京都防災「マンション防災」）

// city uses its own camera object: copy ours into it when drawing the city
function cityLook(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }
const bulbOn = new THREE.Color(0xfff2cf), bulbOff = new THREE.Color(0x30333a);
function power(k) { // 1 = normal, 0 = blackout
  for (const m of winMats) m.emissiveIntensity = m.emissiveIntensity * k;
  bulbM.color.copy(bulbOff).lerp(bulbOn, k);
  slLights.forEach(l => l.intensity *= k);
  setStoreLights(k);
  for (const s of storeGlows) { s.gm.emissiveIntensity = k; s.band.emissiveIntensity = k * 0.8; s.sp.material.opacity = k * 0.9; }
}
function cityBase(env, k, focus = new THREE.Vector3(0, 0, 2)) { setEnv(env, focus); setStore(1); setBurst(0); ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = true; power(k); }

// people near the store
function group() { const g = new THREE.Group(); city.add(g); g.visible = false; return g; }
const gStreet = group(); const walkers = [];
{ const r = rng(12); for (let i = 0; i < 10; i++) { const p = randPerson(r); gStreet.add(p); const dir = i % 2 ? 1 : -1; walkers.push({ p, z: 6.4 + r() * 1.4, x0: dir * (-4 - r() * 8), dir, s: 1.0 + r() * 0.4, q: makeQ(), ph: r() * 6 }); gStreet.add(walkers[i].q); } }
function streetWalk(t, stop) {
  for (const w of walkers) {
    const tt = Math.min(t, stop ?? 99);
    w.p.position.set(w.x0 + w.dir * tt * w.s * 1.2, 0, w.z); w.p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    if (stop != null && t > stop) { poseWalk(w.p, 0, 0); w.p.userData.head.rotation.y = Math.sin((t - stop) * 1.6 + w.ph) * 0.7; }
    else poseWalk(w.p, t * 7.5 + w.ph);
    const qa = stop != null ? clamp((t - stop - 0.4) / 0.3) : 0;
    w.q.visible = qa > 0; w.q.position.set(w.p.position.x, 2.45, w.p.position.z); w.q.scale.setScalar(0.6 * easeBack(qa));
  }
}
const gLine = group(); const liners = [];
{
  const r = rng(40);
  const tank = box(1.6, 1.4, 1.2, mat('#3f86c8')); tank.position.set(-6.5, 0.85, 6.9); gLine.add(tank);
  const tap = box(0.2, 0.2, 0.4, mat('#c0c6cc')); tap.position.set(-5.7, 0.7, 6.9); gLine.add(tap);
  const sign = box(1.8, 0.6, 0.1, mat('#ffffff')); sign.position.set(-6.5, 2.0, 7.55); gLine.add(sign);
  for (let i = 0; i < 22; i++) { const p = randPerson(r); gLine.add(p); p.position.set(-4.8 + i * 0.85, 0, 7.0 + (r() - .5) * 0.25); p.rotation.y = -Math.PI / 2 + (r() - .5) * 0.3; const jug = box(0.25, 0.35, 0.18, mat('#e9f2ff')); jug.position.set(0, -0.68, 0.05); p.userData.arms[0].add(jug); liners.push({ p, ph: r() * 6 }); }
}
// indoor hero
const hero = makePerson({ skin: SKIN[0], hair: HAIR[3], shirt: '#3f8f6b', pants: '#2b3346', long: true }); room.add(hero);
const phone = box(0.08, 0.15, 0.015, mat('#1b1d22')); hero.userData.arms[1].add(phone); phone.position.set(0, -0.68, 0.1);
const heroQ = makeQ(); room.add(heroQ);
const fridgeDoor = box(1.0, 2.1, 0.06, mat('#f3f4f6')); fridgeDoor.geometry.translate(-0.5, 0, 0); room.add(fridgeDoor);
const fridgeIn = box(0.9, 1.9, 0.05, mat('#9aa3ad')); fridgeIn.position.set(2.6, 1.05, -2.58); room.add(fridgeIn);
const foods = []; { const cols = ['#e46a5b', '#f2c14e', '#5fb38a', '#e9e4da', '#f08a4b']; for (let i = 0; i < 9; i++) { const f = box(0.22, 0.18, 0.2, mat(cols[i % 5])); f.position.set(2.3 + (i % 3) * 0.28, 0.5 + Math.floor(i / 3) * 0.5, -2.5); room.add(f); foods.push(f); } }
function indoorReset() { fridgeDoor.visible = fridgeIn.visible = false; foods.forEach(f => f.visible = false); heroQ.visible = false; hero.visible = true; props.sleeper.visible = false; }
function heroQAt(t, t0) { heroQ.visible = t > t0; heroQ.position.set(hero.position.x, 2.1, hero.position.z); heroQ.scale.setScalar(0.6 * easeBack(clamp((t - t0) / 0.3))); }

const SUBS = [
  [2.6, 6.0, 'いつもの夕方。<br>電気は、あって当たり前。'],
  [6.2, 10.1, '街灯も、家の明かりも消えた。'],
  [10.1, 14, '日本の約6,175万世帯が、<br>真っ暗に。'],
  [14.2, 18.1, 'スマホの電池が<br>気になり始める。'],
  [18.1, 22, '2018年の北海道では、<br>約295万戸が一斉に停電した。'],
  [22.2, 26.1, '冷蔵庫の中身が傷み始める。'],
  [26.1, 30, '北海道でも、ほぼ戻るまで<br>約45時間かかった。'],
  [30.2, 34.6, '蛇口をひねっても、<br>水が出ない。'],
  [34.6, 39, '水をくみ上げるポンプも、<br>電気で動いている。'],
  [39.2, 43.6, '給水所に長い列。'],
  [43.6, 47.8, '東京だけで約900万人が、<br>マンションなどに住む。'],
  [48.1, 52.6, '結果：6,175万世帯の生活が、<br>1週間止まった。'],
  [52.6, 55.4, '2018年の北海道では、<br>それが本当に起きた。'],
  [55.6, 59.4, '停電1週間、<br>あなたが一番困るのは？'],
];

function shot0(t, T) { // hook: skyline goes dark at 1.0
  gStreet.visible = gLine.visible = false;
  const tv = 1.0; cityBase('night', 1, new THREE.Vector3(0, 0, 0)); if (t >= tv) power(0); updateCars(T + 3, true);
  el.flash.style.opacity = t >= tv ? 0.35 * Math.max(0, 1 - (t - tv) / 0.25) : 0;
  const u = ease(t / 2.6);
  cityLook(lerp(30, 34, u), lerp(70, 72, u), lerp(85, 88, u), -5, 0, -20, 55);
  el.title.style.opacity = 1;
  setHud('電気が届く世帯', t < tv ? '6,175万' : comma(6175 * (1 - easeOut((t - tv) / 0.6))) + '万', 1, { color: t < tv ? '#fff' : '#ff6b6b' });
  return city;
}
function shot1(t, T) { // everyday dusk street
  gStreet.visible = true; gLine.visible = false; cityBase('dusk', 1); updateCars(T + 3, true); streetWalk(t + 2);
  const u = ease(t / 3.5);
  cityLook(0, lerp(1.9, 2.1, u), lerp(17.4, 16.6, u), 0, 2.6, -1, 60);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  return city;
}
function shot2(t, T) { // +1min dark street, people stop
  gStreet.visible = true; gLine.visible = false; cityBase('night', 0); updateCars(T + 3, true); streetWalk(t + 5.5, 6.0);
  const u = ease(t / 8);
  cityLook(lerp(-0.5, 0.5, u), lerp(2.2, 2.4, u), lerp(17.4, 16.4, u), 0, 2.4, 1, 60);
  hudTime('+1分');
  setTop('日本の世帯数（2026年1月）', comma(countUp(t, 6175)) + '万世帯', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot3(t, T) { // +1h bedroom, phone glow
  indoorReset(); setRoom({ sets: ['bed'] }); setLight('dark', { ceil: 0, hemi: 0.6, glow: 0.9, glowPos: [0.5, 1.3, -0.3] }); setClock('', '#000'); props.clock.visible = false;
  hero.position.set(0.3, 0, -1.0); hero.rotation.set(0, 0.25, 0);
  hero.userData.legs.forEach(l => l.rotation.x = 0); hero.userData.arms[1].rotation.set(-1.3, 0, -0.3); hero.userData.arms[0].rotation.set(0, 0, 0); hero.userData.head.rotation.set(0.35, 0, 0);
  const u = ease(t / 8);
  cityLook(lerp(1.6, 1.2, u), 1.9, lerp(2.4, 1.8, u), 0.2, 1.55, -1.1, 50);
  hudTime('+1時間');
  setTop('北海道で停電した戸数（2018年）', '約' + comma(countUp(t, 295)) + '万戸', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t, T) { // +1day kitchen, fridge open & warm
  indoorReset(); props.clock.visible = true; setRoom({ sets: ['kitchen'] }); setLight('day', { ceil: 0, hemi: 0.9 });
  fridgeDoor.visible = fridgeIn.visible = true; foods.forEach(f => f.visible = true);
  fridgeDoor.position.set(3.1, 1.05, -2.6); fridgeDoor.rotation.y = 1.7 * easeOut(clamp(t / 1.2));
  hero.position.set(1.75, 0, -1.75); hero.rotation.set(0, Math.PI * 0.8, 0); hero.userData.arms[1].rotation.set(-1.2, 0, 0); hero.userData.head.rotation.set(0.1, Math.sin(t) * 0.3, 0);
  heroQAt(t, 2.0);
  const u = ease(t / 8);
  cityLook(lerp(-0.5, -0.1, u), 2.1, lerp(2.6, 2.2, u), 1.9, 1.3, -2.3, 50);
  hudTime('+1日');
  setTop('北海道でほぼ全域に戻るまで（2018年）', '約' + countUp(t, 45) + '時間', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot5(t, T) { // +3days tap gives no water
  indoorReset(); setRoom({ sets: ['kitchen'] }); setLight('evening', { ceil: 0, hemi: 0.9 });
  hero.position.set(-1.2, 0, -2.3); hero.rotation.set(0, Math.PI, 0); hero.userData.arms[1].rotation.set(-1.4, 0, 0.2); hero.userData.arms[0].rotation.set(-0.2, 0, 0); hero.userData.head.rotation.set(0.25, Math.sin(t * 1.2) * 0.25, 0);
  heroQAt(t, 2.2);
  const u = ease(t / 9);
  cityLook(lerp(1.4, 1.1, u), 2.1, lerp(1.0, 0.6, u), -1.4, 1.25, -2.7, 50);
  hudTime('+3日');
  setTop('停電で断水した家（2018年 北海道）', comma(countUp(t, 43509)) + '戸', fade(t, 0.15, 9, 0.25));
  return room;
}
function shot6(t, T) { // +1week water line
  gStreet.visible = false; gLine.visible = true; cityBase('dusk', 0); updateCars(0, false);
  liners.forEach((l, i) => { poseWalk(l.p, 0, 0); l.p.userData.head.rotation.y = Math.sin(t * 1.2 + l.ph) * 0.4; });
  const u = ease(t / 8.6);
  parked[0].visible = parked[1].visible = false;
  cityLook(lerp(22, 20, u), lerp(4.2, 3.8, u), lerp(12.5, 12, u), -5, 0.6, 6.8, 50);
  hudTime('+1週間');
  setTop('マンションなどに住む都民', '約' + comma(countUp(t, 900)) + '万人', fade(t, 0.15, 8.6, 0.25));
  return city;
}
function shot7(t, T) { // result: lights come back from the center
  gStreet.visible = gLine.visible = false; cityBase('night', 1, new THREE.Vector3(0, 0, 0)); updateCars(T, true);
  const R = lerp(0, 160, easeOut(t / 4.5));
  for (const m of winMats) m.emissiveIntensity = clamp(R / 120);
  for (const s of storeGlows) { const a = clamp((R - s.d) / 12); s.gm.emissiveIntensity = a; s.band.emissiveIntensity = a * 0.8; s.sp.material.opacity = a * 0.9; }
  const u = ease(t / 7.5);
  cityLook(lerp(10, 40, u), lerp(35, 140, u), lerp(40, 140, u), 0, 0, lerp(-5, -25, u), 55);
  setTop('止まっていた世帯（推計）', '約' + comma(countUp(t, 6175, 0.2, 1.4)) + '万世帯', fade(t, 0.15, 7.5, 0.25));
  return city;
}
function shot8(t, T) { // loop: skyline lit like the opening
  gStreet.visible = gLine.visible = false; cityBase('night', 1, new THREE.Vector3(0, 0, 0)); updateCars(T, true);
  const u = ease(t / 4);
  cityLook(lerp(28, 30, u), lerp(69, 70, u), lerp(83, 85, u), -5, 0, -20, 55);
  setHud('電気が届く世帯', '6,175万', 1);
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
    id: '0006',
    title: '日本中の電気が1週間止まったら？',
    titleHtml: '日本中の電気が<br>1週間止まったら？',
    mood: 'tension', seed: 6, hits: [1.0, 48.1], risers: [1.0],
    ask: '停電1週間、一番困るのは何？',
    caption: 'もしも日本中の電気が1週間止まったら？\n街の明かり、スマホ、冷蔵庫、そしてマンションの水まで。2018年に北海道で実際に起きたブラックアウト（約295万戸）のデータをもとにシミュレーション。\n\n停電1週間、一番困るのは何？ コメントで教えて。\n\n出典：内閣府 平成30年北海道胆振東部地震に係る被害状況等、経済産業省 電力レジリエンスWG 中間取りまとめ、総務省 住民基本台帳に基づく世帯数（2026年1月）、東京都防災「マンション防災」',
    hashtags: ['もしもラボ', '停電', 'ブラックアウト', '防災', '雑学'],
    endStats: [['日本の世帯数', '約6,175万世帯', '2026年1月'], ['北海道の停電', '約295万戸', '2018年'], ['ほぼ全域に戻るまで', '約45時間', '2018年'], ['停電による断水', '43,509戸', '2018年']],
    sources: '出典：内閣府、経済産業省 電力レジリエンスWG、総務省（住民基本台帳・<br>通信放送の被害状況）、東京都防災「マンション防災」',
  },
});
