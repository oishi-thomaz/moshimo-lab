import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma } from '../lib.js';
import { lineup, SLOTS, setSlot, lineupIdle, sea, setSea, micro, setMicro, makeCrow, makeRoach, makeBeeBig, makeCow } from '../scenes/creatures.js';
import { town, setTownEnv } from '../scenes/town.js';
import { room, setRoom, setLight, lamp } from '../scenes/room.js';
import { field, setFieldEnv, setFlowers, setFruit, groundM } from '../scenes/field.js';
import { space, earth, globeM, setEarthNight } from '../scenes/earth.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// 1つ消えたら、人類が一番ヤバい生き物はどれ？（カラス・ゴキブリ・ハチ・植物プランクトン・細菌）
// 方針：どれが消えても人類がすぐ全員死ぬわけではない → 「絶滅」とは言わず「一番ヤバい（暮らしが一番早く崩れる）」で言い切る。
//       メーターは数字ではなく影響の大きさの順位（ほぼゼロ／小／大／特大／危険）。各段の根拠は下の数字。
// 数字
//   カラスの農作物被害 12億8,700万円（農林水産省「全国の野生鳥獣による農作物被害状況（令和7年度）」。鳥類計 25億8,900万円）
//   ゴキブリ 世界に4,000種以上、屋内に侵入するのは1.0%未満、多くは森や草地で暮らし物質循環に貢献（鹿児島県立博物館「鹿児島の自然だより」第231号 2025年7月）
//   送粉：世界の主要な食用作物の約75%が送粉者の恩恵を受ける（IPBES 2016 送粉評価）
//         送粉者が100%いなくなると、死亡が年約142万人増、ビタミンA不足7,100万人・葉酸不足1億7,300万人増（Smith et al., The Lancet 2015）
//         米・小麦・トウモロコシは風媒（送粉者に頼らない）
//   海：地球の酸素の約半分は海で作られ、大部分はプランクトン（NOAA Ocean Service「How much oxygen comes from the ocean?」）
//       水産物は世界の動物性たんぱく質の15%（FAO 世界漁業・養殖業白書 2024）
//   細菌：消えても人間は数日〜数週間変化に気づかず、把握に約1週間。反芻家畜は共生微生物なしで飢える。植物は窒素を急速に失い枯れる。
//         人間の助けがなければ世界の光合成の大半は1年以内に止まる。社会の完全な崩壊は約1年以内と予測（Gilbert & Neufeld, PLOS Biology 2014「Life in a World without Microbes」）

const GREEN = '#7ff0c8', RED = '#ff5a4f', GOLD = '#ffe08a', BLUE = '#7fd4ff';
// when each creature vanishes / its meter rises (global seconds)
const VANISH = [7.0, 23.2, 39.6, 63.8, 84.0];
const RISE = [18.8, 35.0, 59.2, 79.4, 108.3];
const LEVEL = [0.04, 0.12, 0.55, 0.8, 1.06];
const WORD = ['ほぼゼロ', '小', '大', '特大', '危険'];
function lineupState(T) {
  for (let i = 0; i < 5; i++) {
    const show = T < VANISH[i] ? 1 : 0;
    const k = easeOut(clamp((T - RISE[i]) / (i === 4 ? 1.8 : 1.4)));
    setSlot(i, { show, meter: LEVEL[i] * k, word: k > 0.95 ? WORD[i] : '', glow: i === 4 && k > 0.9 ? 1 : 0, t: T });
  }
  lineupIdle(T);
}
const lineSpark = makeSparkles(260, 0.3); lineup.add(lineSpark.points);

// ---------- town: crows at the garbage spot ----------
const GSPOT = new THREE.Vector3(5.4, 0, 6.2);
const GARB = new THREE.Group(); GARB.position.copy(GSPOT); town.add(GARB);
{
  const r = rng(8);
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.42 + r() * 0.12, 10, 8), new THREE.MeshLambertMaterial({ color: r() < 0.5 ? '#e8eef2' : '#cfe0ec', transparent: true, opacity: 0.92 })); b.scale.y = 0.75; b.position.set((r() - 0.5) * 1.6, 0.32, (r() - 0.5) * 1.0); b.castShadow = true; GARB.add(b); }
  const net = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ color: '#2f8f5a', transparent: true, opacity: 0.35, side: THREE.DoubleSide })); net.rotation.x = -Math.PI / 2; net.position.set(0.9, 0.05, 0.9); GARB.add(net);
  const sign = box(0.06, 1.2, 0.06, mat('#8a8f99')); sign.position.set(-1.1, 0.6, -0.7); GARB.add(sign);
  const plate = box(0.7, 0.4, 0.04, mat('#2f6fb0')); plate.position.set(-1.1, 1.2, -0.68); GARB.add(plate);
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.12), mat(['#e0b04a', '#c9473c', '#f2f2f2'][i % 3])); s.position.set(0.6 + (r() - 0.5) * 1.6, 0.03, 0.9 + (r() - 0.5) * 1.0); s.rotation.y = r() * 3; GARB.add(s); }
}
const crows = [];
for (const [x, z, ry] of [[1.7, 1.3, 2.6], [2.4, 0.5, -2.4], [1.0, 2.0, 1.2], [2.6, 1.8, 3.6]]) { const c = makeCrow(); c.scale.setScalar(0.85); c.position.set(x, 0, z); c.rotation.y = ry; GARB.add(c); crows.push(c); }
const crowSpark = makeSparkles(200, 0.12); GARB.add(crowSpark.points); crowSpark.init(crows.map(c => [c.position.x, 0.5, c.position.z]), 0.4, 1.2);

// ---------- kitchen roaches ----------
const KR = []; for (let i = 0; i < 4; i++) { const r = makeRoach(); r.scale.setScalar(0.38); room.add(r); KR.push(r); }
const KPATH = [[-0.9, -2.95, 0.5, 0.12, 0.97, 1.6, 0], [-0.2, -1.7, 0.7, 0.35, 0.01, 1.2, 2], [-1.1, -2.1, 0.5, 0.3, 0.01, 1.5, 4], [0.4, -2.3, 0.4, 0.25, 0.01, 1.8, 1]];
function roachRun(r, t, [cx, cz, rx, rz, y, speed, phase]) {
  const a = phase + t * speed; const x = cx + Math.cos(a) * rx, z = cz + Math.sin(a) * rz;
  r.position.set(x, y, z); r.rotation.y = Math.atan2(-Math.cos(a) * rz, -Math.sin(a) * rx); r.userData.anim(t, 1);
}
const kSpark = makeSparkles(160, 0.06); room.add(kSpark.points); kSpark.init(KPATH.map(p => [p[0], p[4] + 0.05, p[1]]), 0.6, 0.6);
function roaches(t, vis) { KR.forEach((r, i) => { r.visible = vis; if (vis) roachRun(r, t, KPATH[i]); }); }

// ---------- field: bees, cows, leaf litter ----------
const BEES = []; for (let i = 0; i < 7; i++) { const b = makeBeeBig(); b.scale.setScalar(0.32); field.add(b); BEES.push(b); }
const beeSpark = makeSparkles(220, 0.1); field.add(beeSpark.points);
const BEEC = new THREE.Vector3(0, 0.9, 0);
function bees(t, vis) {
  BEES.forEach((b, i) => { b.visible = vis; if (!vis) return; const a = t * (0.8 + i * 0.07) + i * 0.9; b.position.set(BEEC.x + Math.cos(a) * (1 + (i % 3) * 0.5), BEEC.y + Math.sin(t * 2 + i) * 0.25, BEEC.z + Math.sin(a) * (0.9 + (i % 2) * 0.6)); b.rotation.y = -a; b.userData.anim(t + i); });
}
beeSpark.init(BEES.map((b, i) => [Math.cos(i * 0.9) * 1.2, 0.9, Math.sin(i * 0.9) * 1.1]), 0.6, 1);
const COWS = [];
for (const [x, z, ry] of [[3.2, 3.0, -0.5], [5.4, 4.6, -2.2], [1.6, 5.4, 0.6]]) { const c = makeCow(); c.position.set(x, 0, z); c.rotation.y = ry; c.traverse(o => { if (o.isMesh) o.castShadow = true; }); field.add(c); COWS.push(c); }
function cows(vis, down = 0, t = 0) { COWS.forEach((c, i) => { c.visible = vis; c.userData.setDown(clamp(down * 1.3 - i * 0.15)); c.userData.anim(t + i); }); }
const groundBase = groundM.color.clone();

// ---------- earth tint ----------
const globeBase = globeM.color.clone();

const SUBS = [
  [2.6, 6.4, '5つの生き物から、<br>1つだけ消してみる。'],
  [6.6, 10.5, 'まずはカラス。<br>ゴミをあさる嫌われ者。'],
  [10.6, 14.5, '畑を荒らす被害は、<br>年12.9億円。'],
  [14.6, 18.4, '消えたら、その被害が<br>なくなるだけ。'],
  [18.6, 22.6, 'ダメージはほぼゼロ。<br>むしろ得をする。'],
  [22.8, 26.7, '次はゴキブリ。<br>台所から一斉に消えた。'],
  [26.8, 30.6, '4,000種以上いて、<br>家に入るのは1%未満。'],
  [30.8, 34.6, 'ほとんどは森で、<br>落ち葉を土に返している。'],
  [34.8, 38.8, '森の掃除は遅れるけど、<br>人間の暮らしは変わらない。'],
  [39.0, 42.9, '3つ目はハチ。<br>花粉を運ぶ働き者。'],
  [43.0, 46.9, '食べ物になる作物の<br>約75%が頼っている。'],
  [47.0, 50.8, '果物や野菜が減り、<br>栄養が足りなくなる。'],
  [51.0, 54.9, '死ぬ人が年に<br>約142万人増える。'],
  [55.0, 58.8, 'でも米や小麦は、<br>風で受粉する。'],
  [59.0, 63.0, 'ダメージは大きいけど、<br>人類は生き残る。'],
  [63.2, 67.1, '4つ目は植物プランクトン。<br>海に漂う小さな植物。'],
  [67.2, 71.1, '地球の酸素の約半分は、<br>海で作られている。'],
  [71.2, 75.1, '魚のエサが消え、<br>海の食べ物が減っていく。'],
  [75.2, 79.0, '魚や貝は、動物性<br>たんぱく質の15%。'],
  [79.2, 83.2, '海は止まるけど、<br>陸の食べ物は残る。'],
  [83.4, 87.3, '最後は細菌。<br>目に見えない生き物。'],
  [87.4, 91.3, '消えても、人間は<br>1週間ほど気づかない。'],
  [91.4, 95.3, '牛は胃の細菌がいないと、<br>草を消化できず飢える。'],
  [95.4, 99.3, '植物は窒素が取れず、<br>枯れていく。'],
  [99.4, 103.3, '1年以内に、世界の<br>光合成の大半が止まる。'],
  [103.4, 107.8, '社会はおよそ1年で、<br>完全に崩壊する。'],
  [108.1, 113.8, '結果：一番ヤバいのは細菌。<br>約1年で人類の社会が崩壊。'],
  [113.9, 116.1, '嫌われ者の2匹は、<br>消えても平気だった。'],
  [116.2, 119.4, 'あなたは何が1位だと<br>思ってた？'],
];

// ---------- shots ----------
function lineCam(t, d, i = null) {
  const u = ease(t / d);
  if (i === null) look(lerp(-2.9, -2.4, u), lerp(3.3, 3.1, u), lerp(9.8, 9.2, u), 0.2, 1.3, -0.6, 50);
  else { const x = [-2.2, -1.1, 0, 1.1, 2.2][i]; look(lerp(x * 0.7, x * 0.55, u), lerp(2.7, 2.6, u), lerp(8.6, 8.0, u), x, 1.55, -0.5, 50); }
}
function shot0(t, T) { lift(320); lineupState(T); lineCam(t, 2.5); el.title.style.opacity = 1; return lineup; }
function shot1(t, T) { lift(320); lineupState(T); lineCam(t + 2.5, 6.4); el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5); return lineup; }
function meterShot(i) {
  return function (t, T) {
    lift(400); lineupState(T); lineCam(t, 4.2, i);
    lineSpark.set(0);
    setTop(`${['カラス', 'ゴキブリ', 'ハチ', '植物プランクトン', '細菌'][i]}が消えたら・人類へのダメージ`, WORD[i], fade(t, 0.5, 4.2, 0.25), i < 2 ? GREEN : i < 4 ? GOLD : RED);
    return lineup;
  };
}
function shotCrow(t, T) {
  setTownEnv('day'); lift(260);
  const gone = T >= VANISH[0];
  crows.forEach((c, i) => { c.visible = !gone; c.userData.anim(T + i * 0.7, 1); });
  crowSpark.set(clamp((T - VANISH[0]) / 1.4));
  const u = ease(t / 12);
  look(GSPOT.x + lerp(5.2, 4.6, u), lerp(1.8, 1.6, u), GSPOT.z + lerp(4.4, 3.8, u), GSPOT.x + 1.5, 0.45, GSPOT.z + 1.1, 50);
  if (t < 4.2) setTop('消えた生き物', 'カラス', fade(t, 0.15, 4.2, 0.2));
  else if (t < 8.2) setTop('カラスの農作物被害（令和7年度）', countUp(t - 4.2, 129, 0.1, 1.2) / 10 + '億円', fade(t, 4.2, 8.2, 0.2), GOLD);
  else setTop('カラスが消えたら・なくなる被害', '年12.9億円', fade(t, 8.2, 12, 0.2), GREEN);
  return town;
}
function shotKitchen(t, T) {
  setRoom({ sets: ['kitchen'] }); setLight('day', { ceil: 4, hemi: 1.0 }); lift(240);
  const gone = T >= VANISH[1]; roaches(T, !gone); kSpark.set(clamp((T - VANISH[1]) / 1.2));
  const u = ease(t / 8);
  look(lerp(0.4, 0.2, u), lerp(1.25, 1.15, u), lerp(0.2, -0.2, u), -0.5, 0.1, -2.3, 52);
  if (t < 4.1) setTop('消えた生き物', 'ゴキブリ', fade(t, 0.15, 4.1, 0.2));
  else setTop('世界のゴキブリの種類', countUp(t - 4.1, 4000, 0.1, 1.2).toLocaleString('en-US') + '種以上', fade(t, 4.1, 8, 0.2), GOLD);
  return room;
}
function shotForest(t, T) {
  setFieldEnv('dusk'); setFlowers(1); setFruit(1); bees(T, false); cows(false); groundM.color.copy(groundBase); lift(240);
  const u = ease(t / 4);
  look(lerp(-16, -15, u), lerp(1.6, 1.5, u), lerp(2.0, 1.2, u), -10, 1.2, -6, 50);
  setTop('家に入ってくるゴキブリ', '1%未満', fade(t, 0.15, 4, 0.2), GREEN);
  return field;
}
function shotBees(t, T) {
  setFieldEnv('day'); setFlowers(1); cows(false); groundM.color.copy(groundBase); lift(240);
  const gone = T >= VANISH[2]; bees(T, !gone); beeSpark.set(clamp((T - VANISH[2]) / 1.4));
  setFruit(1 - 0.7 * easeOut(clamp((t - 4) / 7)));
  const u = ease(t / 12);
  look(lerp(2.6, 3.4, u), lerp(1.4, 2.2, u), lerp(3.4, 4.6, u), 0, 0.7, 0, 50);
  if (t < 4.2) setTop('消えた生き物', 'ハチ', fade(t, 0.15, 4.2, 0.2));
  else if (t < 8.2) setTop('花粉を運んでもらう食用作物（IPBES）', '約' + countUp(t - 4.2, 75, 0.1, 1.2) + '%', fade(t, 4.2, 8.2, 0.2), GOLD);
  else setTop('実らなくなる果物と野菜', '減っていく', fade(t, 8.2, 12, 0.2), RED);
  return field;
}
function shotHarvest(t, T) {
  setFieldEnv('day'); setFlowers(0.7); setFruit(0.3); bees(T, false); cows(false); groundM.color.copy(groundBase); lift(240);
  const u = ease(t / 8);
  look(lerp(-4, -2, u), lerp(3.0, 3.4, u), lerp(4, 6, u), -8, 1.2, -6, 50);
  if (t < 4.2) setTop('増える死者（1年・The Lancet 2015）', '約' + countUp(t, 142, 0.2, 1.4) + '万人', fade(t, 0.15, 4.2, 0.2), RED);
  else setTop('風で受粉する主食', '米・小麦・トウモロコシ', fade(t, 4.2, 8, 0.2), GREEN);
  return field;
}
function shotSea(t, T) {
  lift(240);
  const pk = T < VANISH[3] ? 1 : 1 - easeOut(clamp((T - VANISH[3]) / 1.0));
  setSea({ plankton: pk, fish: 1 - 0.85 * easeOut(clamp((t - 6) / 9)), murk: clamp((t - 2) / 10) * 0.6, t: T });
  const u = ease(t / 16);
  look(lerp(0, -1, u), lerp(0.6, 0.2, u), lerp(6, 4.5, u), 0, 0.2, -6, 55);
  if (t < 4.1) setTop('消えた生き物', '植物プランクトン', fade(t, 0.15, 4.1, 0.2));
  else if (t < 8.1) setTop('海で作られる酸素（NOAA）', '地球の約半分', fade(t, 4.1, 8.1, 0.2), BLUE);
  else if (t < 12.1) setTop('魚のエサ', 'なくなる', fade(t, 8.1, 12.1, 0.2), RED);
  else setTop('魚や貝（世界の動物性たんぱく質・FAO）', countUp(t - 12.1, 15, 0.1, 1.0) + '%', fade(t, 12.1, 16, 0.2), GOLD);
  return sea;
}
function shotMicro(t, T) {
  lift(240);
  const k = T < VANISH[4] ? 1 : 1 - easeOut(clamp((T - VANISH[4]) / 1.2));
  setMicro({ bugs: k, t: T });
  const u = ease(t / 8);
  look(0, 0, lerp(11, 9.5, u), 0, 0, 0, 50);
  if (t < 4.1) setTop('消えた生き物', '細菌', fade(t, 0.15, 4.1, 0.2));
  else setTop('人間が異変に気づくまで', '約1週間', fade(t, 4.1, 8, 0.2), GOLD);
  return micro;
}
function shotCows(t, T) {
  setFieldEnv('gray'); bees(T, false); setFruit(0);
  const w = easeOut(clamp(t / 7));
  setFlowers(1 - 0.85 * w); groundM.color.copy(groundBase).lerp(new THREE.Color('#9a8a5a'), w);
  cows(true, clamp((t - 0.5) / 3.5), T); lift(240);
  const u = ease(t / 8);
  look(lerp(8, 7, u), lerp(2.4, 2.2, u), lerp(9, 8, u), 3, 0.8, 3.6, 50);
  if (t < 4.1) setTop('胃の細菌がいない牛', '草を消化できない', fade(t, 0.15, 4.1, 0.2), RED);
  else setTop('窒素が取れない植物', '枯れていく', fade(t, 4.1, 8, 0.2), RED);
  return field;
}
function shotEarth(t, T) {
  lift(200);
  const k = easeOut(clamp(t / 6));
  globeM.color.copy(globeBase).lerp(new THREE.Color('#8a6d4a'), k * 0.8);
  setEarthNight(clamp((t - 4) / 4) * 0.5);
  earth.rotation.y = 2.4 + t * 0.06;
  look(0, 3, lerp(34, 30, ease(t / 8.6)), 0, 1.5, 0, 50);
  if (t < 4.2) setTop('世界の光合成の大半が止まる', '1年以内', fade(t, 0.15, 4.2, 0.2), RED);
  else setTop('社会の完全な崩壊（PLOS Biology 2014）', '約1年', fade(t, 4.2, 8.6, 0.2), RED);
  return space;
}
function shotResult(t, T) {
  lift(320); lineupState(T); lineCam(t, 8);
  lineSpark.set(0);
  if (t < 5.8) setTop('人類が一番ヤバい生き物', '細菌', fade(t, 0.3, 5.8, 0.2), RED);
  else setTop('人類の社会が崩壊するまで', '約1年', fade(t, 5.8, 8, 0.2), RED);
  return lineup;
}
function shotLoop(t, T) { lift(320); lineupState(T); lineCam(t, 3.7); return lineup; }
function resetEarth() { globeM.color.copy(globeBase); setEarthNight(0); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6.4, f: shot1 },
  { a: 6.4, b: 18.4, f: shotCrow }, { a: 18.4, b: 22.6, f: meterShot(0) },
  { a: 22.6, b: 30.6, f: shotKitchen }, { a: 30.6, b: 34.6, f: shotForest }, { a: 34.6, b: 38.8, f: meterShot(1) },
  { a: 38.8, b: 50.8, f: shotBees }, { a: 50.8, b: 58.8, f: shotHarvest }, { a: 58.8, b: 63.0, f: meterShot(2) },
  { a: 63.0, b: 79.0, f: shotSea }, { a: 79.0, b: 83.2, f: meterShot(3) },
  { a: 83.2, b: 91.2, f: shotMicro }, { a: 91.2, b: 99.2, f: shotCows }, { a: 99.2, b: 107.8, f: shotEarth },
  { a: 107.8, b: 115.8, f: shotResult }, { a: 115.8, b: 119.5, f: shotLoop }, { a: 119.5, b: 124.5, f: endCard },
];
void resetEarth;
runStory({
  shots, subs: SUBS, duration: 124.5,
  meta: {
    id: '0035',
    series: 'ヤバい順',
    title: '1つ消えたら、人類が一番ヤバい生き物はどれ？',
    titleHtml: '<span style="font-size:.84em">1つ消えたら、人類が</span><br>一番ヤバい生き物は？',
    mood: 'mystery', seed: 35, hits: [83.4, 108.1], risers: [83.2, 107.8],
    impacts: [10.6, 43.0, 51.0, 67.2, 99.4, 108.1],
    sfx: [[0.3, 'whoosh'], [6.5, 'caw'], [7.0, 'poof'], [18.8, 'meter', 0.04], [22.7, 'skitter'], [23.2, 'poof'], [35.0, 'meter', 0.12],
      [38.9, 'buzz'], [39.6, 'poof'], [59.2, 'meter', 0.55], [63.1, 'bubble'], [63.8, 'poof'], [70.5, 'bubble'], [79.4, 'meter', 0.8],
      [84.0, 'poof'], [91.3, 'drone'], [108.3, 'meter', 1.0], [110.2, 'alarm']],
    ask: 'あなたは何が1位だと思ってた？',
    narr: { '12.9億円': '12.9億円', '4,000種': '4000種', '1%未満': '1パーセント未満', '約75%': '約75パーセント', '15%': '15パーセント', '142万人': '142万人' },
    caption: 'もしもカラス、ゴキブリ、ハチ、植物プランクトン、細菌のうち1つだけが消えたら、人類が一番ヤバいのはどれ？\n\nカラス：農作物を荒らす被害は年12.9億円。消えても困らず、むしろ被害がなくなる。\nゴキブリ：世界に4,000種以上いて、家に入るのは1%未満。多くは森で物質循環を支えている。人間の暮らしはほぼ変わらない。\nハチ：食用作物の約75%が花粉を運ぶ生き物に頼る。花粉を運ぶ生き物が全部いなくなると、栄養不足などで死ぬ人が年に約142万人増える試算。でも米・小麦・トウモロコシは風で受粉するので、人類は生き残る。\n植物プランクトン：地球の酸素の約半分は海で作られ、その大部分はプランクトン。魚のエサがなくなり、海の食べ物（世界の動物性たんぱく質の15%）が減っていく。\n細菌：人間は1週間ほど気づかない。牛は胃の細菌がいないと草を消化できず飢え、植物は窒素が取れず枯れる。1年以内に世界の光合成の大半が止まり、社会は約1年で完全に崩壊すると予測されている。\n\n結果：一番ヤバいのは、目に見えない細菌。\n※どれが消えても、人類がすぐ全員いなくなるわけではありません。研究の予測や試算をもとにした比較です。\n\nあなたは何が1位だと思ってた？ コメントで教えて。\n\n出典：農林水産省 全国の野生鳥獣による農作物被害状況（令和7年度）、鹿児島県立博物館「鹿児島の自然だより」第231号（2025年）、IPBES 送粉評価（2016年）、Smith et al. The Lancet（2015年）、NOAA Ocean Service、FAO 世界漁業・養殖業白書（2024年）、Gilbert & Neufeld, PLOS Biology（2014年）',
    hashtags: ['もしもラボ', '生き物', '雑学', '生態系', '細菌'],
    endStats: [['カラス', 'ほぼゼロ', '被害12.9億円が消えるだけ'], ['ゴキブリ', '小', '家に入るのは1%未満'], ['ハチ', '大', '死者が年約142万人増'], ['植物プランクトン', '特大', '海の食べ物が減る'], ['細菌', '危険', '約1年で社会が崩壊']],
    sources: '出典：農林水産省（令和7年度）、鹿児島県立博物館、IPBES（2016）、<br>The Lancet（2015）、NOAA、FAO（2024）、PLOS Biology（2014）',
  },
});
