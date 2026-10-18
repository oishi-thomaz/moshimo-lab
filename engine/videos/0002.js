import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, comma } from '../lib.js';
import { room, setRoom, setLight, setClock, props, lamp } from '../scenes/room.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { field, setFieldEnv, makeBug, fish, setFlowers } from '../scenes/field.js';
import { look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界中の蚊が絶滅したら？
// 数字：蚊 3,729種（Mosquito Taxonomic Inventory 2024年11月）、マラリア 患者2億8,200万人・死者61万人（WHO World Malaria Report 2025, 2024年）、
//       デング熱 報告1,443万件（WHO WER 2025, 2024年）、虫などが運ぶ病気の死者 年70万人以上（WHO ファクトシート 2024年）

// ---------- bedroom mosquito ----------
const mos = makeBug('mosquito'); mos.scale.setScalar(0.9); room.add(mos);
const roomSpark = makeSparkles(120, 0.05); room.add(roomSpark.points);
const HEAD = new THREE.Vector3(1.6, 0.85, -2.74);
// ---------- pond swarm ----------
const swarm = [];
{ const r = rng(4); for (let i = 0; i < 40; i++) { const b = makeBug('mosquito'); b.scale.setScalar(0.7); field.add(b); swarm.push({ b, a: r() * 6.28, rr: 0.5 + r() * 2.6, h: 0.6 + r() * 1.8, s: 0.6 + r() * 1.2 }); } }
const pondSpark = makeSparkles(300, 0.18); field.add(pondSpark.points);
const birds = [];
for (let i = 0; i < 3; i++) { const b = makeBug('bird'); b.scale.setScalar(1.2); field.add(b); birds.push(b); }
// ---------- globe ----------
const LAND = [[40, -100], [35, -85], [50, -110], [20, -100], [-10, -60], [-20, -50], [0, -70], [-30, -60], [10, 20], [0, 25], [-10, 30], [20, 10], [10, 0], [-20, 25], [50, 10], [45, 30], [55, 40], [60, 90], [40, 100], [25, 80], [20, 105], [10, 105], [-25, 135], [35, 138], [0, 115]];
const globeSpark = makeSparkles(700, 0.35); earth.add(globeSpark.points);
globeSpark.init(LAND.map(([la, lo]) => latLon(la, lo, 10.2).toArray()), 3.2, 2.2);
const malaria = [];
{
  const r = rng(9); const dm = new THREE.SphereGeometry(0.11, 8, 6);
  for (let i = 0; i < 120; i++) {
    const la = -15 + r() * 28, lo = -12 + r() * 50; if (la > 5 && lo > 35) continue;
    const m = new THREE.Mesh(dm, new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true })); m.position.copy(latLon(la, lo, 10.08)); earth.add(m); malaria.push({ m, k: r() });
  }
  for (let i = 0; i < 30; i++) { const la = 5 + r() * 20, lo = 75 + r() * 30; const m = new THREE.Mesh(dm, new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true })); m.position.copy(latLon(la, lo, 10.08)); earth.add(m); malaria.push({ m, k: r() }); }
}
const lifeSpark = makeSparkles(400, 0.3, 0xffe6a0); earth.add(lifeSpark.points);
lifeSpark.init(malaria.map(x => x.m.position.toArray()), 0.4, 3);
function malariaVis(k) { for (const x of malaria) { x.m.visible = k > 0.001; x.m.material.opacity = clamp((k - x.k * 0.5) / 0.5); } }

const SUBS = [
  [2.5, 6.0, '時間を少し戻そう。<br>いつもの夏の夕方。'],
  [6.2, 10.1, '世界中の蚊<br>3,729種が、一斉に消えた。'],
  [10.1, 14, '家にも、森にも、<br>もう1匹もいない。'],
  [14.2, 18.1, '夏の夜なのに、<br>かゆみゼロ。'],
  [18.1, 22, 'デング熱を運ぶ蚊も、<br>いなくなった。'],
  [22.2, 26.1, 'マラリアを運ぶのも、<br>蚊だった。'],
  [26.1, 30, '患者は1年で<br>約2億8,200万人。'],
  [30.2, 34.6, '池では、蚊の子ども<br>ボウフラが消えた。'],
  [34.6, 39, 'それを食べていた魚や鳥は、<br>エサを探し回る。'],
  [39.2, 43.6, '虫などが運ぶ病気の死者は、<br>毎年70万人以上。'],
  [43.6, 47.8, 'そのいちばん大きな<br>マラリアを運ぶのが蚊。'],
  [48.1, 52.6, '結果：マラリアだけで<br>年61万人が助かる計算に。'],
  [52.6, 55.4, '実は、蚊を減らす研究も<br>本当に進んでいる。'],
  [55.6, 59.4, '蚊は全部消えてほしい？<br>それとも残すべき？'],
];

function bedroomNight(T) {
  setRoom({ sets: ['bed'] }); setLight('night', { ceil: 0, hemi: 0.8, lamp: 2.2 }); lamp.position.set(0.3, 1.2, -2.6); lamp.color.set('#ffc98a');
  setClock('2:13'); props.phone.visible = true;
}
function mosAt(t) {
  const a = t * 2.4;
  mos.position.set(HEAD.x + 0.5 + Math.cos(a) * 0.14, HEAD.y + 0.32 + Math.sin(t * 3.1) * 0.06, HEAD.z - 0.15 + Math.sin(a) * 0.14);
  mos.rotation.y = -a - Math.PI / 2; mos.userData.flap(t);
}

function shot0(t, T) { // hook: mosquito near ear, vanishes at 1.2
  bedroomNight(T);
  const tv = 1.2;
  mos.visible = t < tv; mosAt(t);
  if (t >= tv && !roomSpark.ready) { roomSpark.init([mos.position.toArray()], 0.15, 0.6); roomSpark.ready = true; }
  roomSpark.set(t >= tv ? (t - tv) / 1.0 : 0);
  el.flash.style.opacity = t >= tv ? 0.6 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  const u = ease(t / 2.5);
  look(lerp(3.3, 3.1, u), lerp(2.2, 2.1, u), lerp(-0.4, -0.7, u), HEAD.x - 0.1, HEAD.y + 0.05, HEAD.z, 50);
  el.title.style.opacity = 1;
  setHud('世界の蚊', t < tv ? '3,729種' : comma(3729 * (1 - easeOut((t - tv) / 0.8))) + '種', 1, { color: t < tv ? '#fff' : '#ff6b6b' });
  return room;
}
function swarmAt(t, on = 1) {
  for (const s of swarm) {
    s.b.visible = on > 0;
    const a = s.a + t * s.s;
    s.b.position.set(-8 + Math.cos(a) * s.rr * 1.3, s.h + Math.sin(t * 2 + s.a) * 0.2, 9 + Math.sin(a) * s.rr);
    s.b.rotation.y = -a; s.b.userData.flap(t + s.a);
  }
}
function shot1(t, T) { // everyday: dusk pond with mosquitoes
  setFieldEnv('dusk'); setFlowers(1); swarmAt(t + 3);
  for (const b of birds) b.visible = false;
  pondSpark.set(0);
  fishAt(t);
  const u = ease(t / 3.6);
  look(lerp(-4.5, -5.0, u), 2.0, lerp(17.5, 16.5, u), -8, 1.2, 9, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.6);
  return field;
}
function fishAt(t) { fish.forEach((f, i) => { const a = t * (0.5 + i * 0.13) + i * 1.6; f.position.set(-8 + Math.cos(a) * (1.5 + i * 0.6) * 1.3, -0.02, 9 + Math.sin(a) * (1.5 + i * 0.6)); f.rotation.y = -a - Math.PI / 2; }); }
function shot2(t, T) { // +1s globe vanish
  setEarthNight(0); malariaVis(0); lifeSpark.set(0);
  earth.rotation.y = faceLon(20) + 0.7 - t * 0.09;
  globeSpark.set(clamp(t / 3.2));
  const u = ease(t / 8);
  look(0, lerp(9, 5, u), lerp(42, 39, u), 0, -2.5, 0, 45);
  hudTime('+1秒');
  setTop('世界の蚊の種類（2024年）', comma(countUp(t, 3729)) + '種', fade(t, 0.15, 8, 0.25));
  return space;
}
function shot3(t, T) { // +1day bedroom calm
  bedroomNight(T); mos.visible = false; roomSpark.set(0);
  const u = ease(t / 8);
  look(lerp(-0.6, 0.0, u), lerp(2.6, 2.3, u), lerp(3.6, 2.6, u), 1.0, 0.7, -2.2, 52);
  hudTime('+1日');
  const v = countUp(t, 14434584, 0.3, 1.6);
  setTop('デング熱の報告数（2024年）', '約' + comma(Math.round(v / 10000)) + '万件', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t, T) { // +1month malaria map fades
  setEarthNight(0); globeSpark.set(0); lifeSpark.set(0);
  earth.rotation.y = faceLon(18) - 0.15 + t * 0.03;
  malariaVis(t < 3.5 ? 1 : 1 - (t - 3.5) / 3.5);
  const u = ease(t / 8);
  look(0, lerp(2, 0, u), lerp(36, 33, u), 0, -2.5, 0, 45);
  hudTime('+1か月');
  const v = countUp(t, 28200, 0.3, 1.6);
  setTop('マラリアの患者数（2024年）', '約' + (v >= 10000 ? Math.floor(v / 10000) + '億' + comma(v % 10000) : comma(v)) + '万人', fade(t, 0.15, 8, 0.25));
  return space;
}
function shot5(t, T) { // +1 year pond: birds & fish searching, no mosquitoes
  setFieldEnv('day'); setFlowers(1); swarmAt(t, 0); pondSpark.set(0); fishAt(t * 1.8);
  birds.forEach((b, i) => { b.visible = true; const a = t * 0.9 + i * 2.1; b.position.set(-8 + Math.cos(a) * 3.8, 2.6 + i * 0.5 + Math.sin(t * 2 + i) * 0.3, 9 + Math.sin(a) * 2.8); b.rotation.y = -a - Math.PI / 2; b.userData.flap(t + i); });
  const u = ease(t / 9);
  look(lerp(-2.5, -3.5, u), lerp(3.6, 3.0, u), lerp(19.5, 18.0, u), -8, 1.0, 8.5, 52);
  hudTime('+1年');
  setTop('生き物の世界から消えた蚊（2024年）', comma(countUp(t, 3729)) + '種', fade(t, 0.15, 9, 0.25));
  return field;
}
function shot6(t, T) { // vector-borne deaths, night globe
  setEarthNight(0.85); globeSpark.set(0); malariaVis(0.6); lifeSpark.set(0);
  earth.rotation.y = faceLon(40) + t * 0.06;
  const u = ease(t / 8.6);
  look(0, lerp(6, 3, u), lerp(38, 36, u), 0, -2.5, 0, 45);
  setTop('虫などが運ぶ病気の死者（WHO・2024年）', '年' + comma(countUp(t, 70)) + '万人以上', fade(t, 0.15, 8.6, 0.25));
  return space;
}
function shot7(t, T) { // result
  setEarthNight(0); globeSpark.set(0); malariaVis(t < 1 ? 0.6 * (1 - t) : 0);
  lifeSpark.set(clamp((t - 0.3) / 4));
  earth.rotation.y = faceLon(18) + t * 0.05;
  const u = ease(t / 7.5);
  look(0, lerp(2, 6, u), lerp(34, 40, u), 0, -2.5, 0, 45);
  setTop('マラリアの死者（2024年）', '約' + comma(countUp(t, 61, 0.2, 1.4)) + '万人', fade(t, 0.15, 7.5, 0.25));
  return space;
}
function shot8(t, T) { // loop back to the opening bedroom, now quiet
  bedroomNight(T); roomSpark.set(0);
  const u = ease(t / 4);
  mos.visible = true; mosAt(t + 0.4);
  look(lerp(3.4, 3.3, u), lerp(2.25, 2.2, u), lerp(-0.25, -0.4, u), HEAD.x - 0.1, HEAD.y + 0.05, HEAD.z, 50);
  setHud('世界の蚊', '3,729種', 1);
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, dim: f => f === shot2 || f === shot4 || f === shot6 || f === shot7 ? false : false,
  meta: {
    id: '0002',
    title: '世界中の蚊が絶滅したら？',
    titleHtml: '世界中の蚊が<br>絶滅したら？',
    mood: 'mystery', seed: 2, hits: [1.2, 48.1], risers: [1.2],
    ask: '蚊は全部消えてほしい？それとも残すべき？',
    caption: 'もしも世界中の蚊3,729種が一瞬で絶滅したら？\nかゆみのない夏の夜、マラリアやデング熱、池の生き物たちはどうなるのか。WHOの最新データでシミュレーション。\n\n蚊は全部消えてほしい？それとも残すべき？ コメントで教えて。\n\n出典：WHO World Malaria Report 2025、WHO Weekly Epidemiological Record（デング熱 2024年）、WHO ファクトシート「Vector-borne diseases」、Mosquito Taxonomic Inventory（2024年11月）',
    hashtags: ['もしもラボ', '蚊', '絶滅', '生き物', '雑学'],
    endStats: [['世界の蚊の種類', '3,729種', '2024年'], ['マラリアの患者数', '約2億8,200万人', '2024年'], ['マラリアの死者', '約61万人', '2024年'], ['デング熱の報告数', '約1,443万件', '2024年']],
    sources: '出典：WHO World Malaria Report 2025、WHO 週報（デング熱 2024年）、<br>WHO Vector-borne diseases、Mosquito Taxonomic Inventory',
  },
});
