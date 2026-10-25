import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, makeQ, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, lamp } from '../scenes/room.js';
import { field, setFieldEnv, setFlowers, setFruit, makeBug } from '../scenes/field.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { lab, setLabLight, setMice, researcher } from '../scenes/mouselab.js';
import { makeFly, makeSwarm } from '../scenes/spider.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界中のハエが絶滅したら？（blueprint no 701・絶滅ボタンシリーズ）
// 解析の依頼：カカオの受粉はヌカカ説の裏付けが弱いので、チョコが消えたとは言わない。確かな数字で着地を組む。
// 数字：
//  ハエの仲間（双翅目）は16万種以上が記載（Systema Dipterorum ver.5.3, 2024／GBIF・Catalogue of Life）
//   https://www.gbif.org/dataset/7389fe13-3ebb-493d-b40a-01509cf1942a
//  トラコーマ：約190万人が失明・視覚障害。感染者の目や鼻の分泌物に触れたハエがうつす。流行地に約9,200万人（2026年3月）（WHO ファクトシート Trachoma）
//   https://www.who.int/en/news-room/fact-sheets/detail/trachoma
//  作物の花への訪問の25〜50%はハチ以外の虫（ハエ・甲虫・ガなど）。ハチ以外の訪問が増えると実つきも上がる（Rader et al., PNAS 113(1):146, 2016）
//   https://rune.une.edu.au/web/handle/1959.11/19558
//  人の病気の遺伝子929個のうち714個（77%）がショウジョウバエにもある（Reiter et al., Genome Research 11:1114, 2001）
//   https://genome.cshlp.org/content/11/6/1114

const BLUE = '#7fd4ff', GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8';
const FS = 2.6; // fly scale in close shots

// ---------- kitchen ----------
const KIT = new THREE.Group(); room.add(KIT);
const BTN = new THREE.Vector3(-0.15, 0.945, -2.95);
const btn = makeXButton({ label: 'ハエ絶滅ボタン' }); btn.position.copy(BTN); KIT.add(btn);
// food on the counter (what flies come for)
const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.03, 18), mat('#f4f4f2')); plate.position.set(-0.75, 0.96, -2.95); KIT.add(plate);
const food = []; for (const [x, z, c] of [[-0.8, -2.92, '#e2a04a'], [-0.7, -3.0, '#c9473c'], [-0.72, -2.88, '#7fae4a']]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 7, 5), mat(c)); f.position.set(x, 1.0, z); f.scale.y = 0.6; KIT.add(f); food.push(f); }
const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.55, 14), mat('#7d8794')); bin.position.set(1.55, 0.28, -2.75); KIT.add(bin);
const cook = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#e9e4da', pants: '#3b3f4a', scale: 1 }); cook.position.set(0.9, 0, -1.9); cook.rotation.y = -1.3; KIT.add(cook);
const kFly = []; for (let i = 0; i < 5; i++) { const f = makeFly(); f.scale.setScalar(FS); KIT.add(f); kFly.push(f); }
const KF = [[-0.75, 1.15, -2.95, 0.22, 2.1], [-0.2, 1.3, -2.7, 0.3, 1.6], [0.5, 1.45, -2.6, 0.35, 1.3], [1.5, 0.75, -2.75, 0.2, 2.4], [-1.2, 1.5, -2.4, 0.4, 1.1]];
function kitFlies(t, vis) {
  kFly.forEach((f, i) => {
    f.visible = vis; if (!vis) return;
    const [x, y, z, r, s] = KF[i]; const a = t * s + i * 1.7;
    f.position.set(x + Math.cos(a) * r, y + Math.sin(a * 2.3) * 0.08, z + Math.sin(a) * r * 0.6);
    f.rotation.y = -a - Math.PI / 2; f.userData.flap(t + i);
  });
}
const hookFly = makeFly(); hookFly.scale.setScalar(1.7); KIT.add(hookFly);
const kitSpark = makeSparkles(180, 0.06); room.add(kitSpark.points);
function kitchen() { setRoom({ sets: ['kitchen'] }); KIT.visible = true; setLight('day', { ceil: 6, hemi: 1.05 }); lamp.position.set(-0.2, 2.1, -2.4); }

// ---------- globe: trachoma endemic zones ----------
const HOT = [];
{
  const r = rng(31); const g = new THREE.SphereGeometry(0.13, 8, 6);
  const zones = [[6, 14, 34, 10, 40], [9, 16, -12, 40, 45], [-6, 4, 29, 10, 18], [12, 17, 42, 6, 8], [-26, -18, 123, 12, 7], [-12, -2, -50, 12, 5], [25, 34, 64, 8, 6]]; // lat0, lat1, lon0, lonSpan, n
  for (const [la0, la1, lo0, span, n] of zones) for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true })); m.position.copy(latLon(la0 + r() * (la1 - la0), lo0 + r() * span, 10.08)); earth.add(m); HOT.push({ m, k: r() });
  }
}
function hotVis(k) { for (const x of HOT) { x.m.visible = k > 0.001; x.m.material.opacity = clamp((k - x.k * 0.4) / 0.6); } }
const gFly = makeSwarm(140, 7, { x0: -6, x1: 6, y0: -2, y1: 5, z0: 9, z1: 13, size: 0.09 });
space.add(gFly.mesh);
const gSpark = makeSparkles(260, 0.35, 0xffe6a0); space.add(gSpark.points);

// ---------- field: flowers, flies and bees ----------
const MC = new THREE.Vector3(0, 0, 0);
const fSwarm = makeSwarm(60, 3, { x0: -3, x1: 3, y0: 0.35, y1: 1.1, z0: -2, z1: 2.5, size: 0.06 });
field.add(fSwarm.mesh);
const fSpark = makeSparkles(300, 0.12); field.add(fSpark.points);
{ const pts = []; const r = rng(4); for (let i = 0; i < 40; i++) pts.push([-3 + r() * 6, 0.4 + r() * 0.7, -2 + r() * 4.5]); fSpark.init(pts, 0.2, 0.8); }
const bees = []; for (let i = 0; i < 3; i++) { const b = makeBug('bee'); b.scale.setScalar(0.8); field.add(b); bees.push(b); }
function fieldBees(t) { bees.forEach((b, i) => { const a = t * (0.7 + i * 0.2) + i * 2.1; b.position.set(Math.cos(a) * (1.2 + i * 0.5), 0.8 + Math.sin(t * 2 + i) * 0.15, -0.6 + Math.sin(a) * 1.0); b.rotation.y = -a; b.userData.flap(t + i); }); }
function fieldEnv(e) { setFieldEnv(e); setFlowers(1); setFruit(1); }

// ---------- lab: fly vials ----------
const VIALS = [];
{
  const glassM = new THREE.MeshLambertMaterial({ color: '#dff2ff', transparent: true, opacity: 0.35 });
  const plugM = mat('#e9dcc0'), foodM = mat('#d9a24a');
  for (let i = 0; i < 10; i++) {
    const x = 0.55 + (i % 5) * 0.2, z = -1.05 - Math.floor(i / 5) * 0.2;
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.32, 12), glassM); v.position.set(x, 1.09, z); lab.add(v);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.06, 12), plugM); p.position.set(x, 1.27, z); lab.add(p);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.06, 12), foodM); f.position.set(x, 0.96, z); lab.add(f);
    const sw = makeSwarm(7, 20 + i, { x0: x - 0.03, x1: x + 0.03, y0: 1.0, y1: 1.18, z0: z - 0.03, z1: z + 0.03, size: 0.014 }); lab.add(sw.mesh);
    VIALS.push({ x, z, sw });
  }
}
const rack = box(1.15, 0.04, 0.5, mat('#9aa4ae')); rack.position.set(0.95, 0.94, -1.15); lab.add(rack);
const labSpark = makeSparkles(200, 0.04); lab.add(labSpark.points); labSpark.init(VIALS.map(v => [v.x, 1.1, v.z]), 0.08, 0.35);
function vials(n, t) { VIALS.forEach(v => v.sw.set(n, t)); }
const lq = makeQ(); lq.visible = false; lab.add(lq);
function labDress() { setLabLight('day'); setMice(1); researcher.position.set(1.95, 0, -0.35); researcher.rotation.y = -0.9; }

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの夏の台所。'],
  [6.2, 10.1, '世界中のハエが、<br>一斉に消えた。'],
  [10.1, 14, 'ハエの仲間は、<br>16万種以上いた。'],
  [14.2, 18.1, 'まず、目の病気<br>トラコーマの運び屋が消えた。'],
  [18.1, 22, '世界で約190万人が、<br>この病気で目を悪くしている。'],
  [22.2, 26.1, 'でも、ハエの仕事は<br>それだけじゃなかった。'],
  [26.1, 30, '作物の花に来る虫の<br>25〜50%はハチ以外。'],
  [30.2, 34.6, 'ハエもその1つ。<br>実をつける手伝い役だった。'],
  [34.6, 39, '死がいやフンを分解する<br>幼虫も、もういない。'],
  [39.2, 43.6, 'そして研究室の<br>ショウジョウバエも消えた。'],
  [43.6, 47.8, '人の病気の遺伝子の77%が、<br>このハエにもあった。'],
  [48.1, 53.8, '結果：病気の運び屋は消え、<br>受粉と研究の相棒も消えた。'],
  [53.9, 56.1, '嫌われ者は、研究の相棒。'],
  [56.2, 59.4, '次に絶滅ボタンを<br>押したい生き物は？'],
];

const TP = 1.4; // press time
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(0.55, 0.45, u), lerp(1.75, 1.7, u), lerp(-1.25, -1.4, u), BTN.x - 0.15, 1.0, BTN.z - 0.05, 50); }
function btnState(t) { const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand); }
function shot0(t) { // hook: fly hovering by the red button, countdown, press -> fly vanishes
  kitchen(); cook.visible = false; btn.userData.labelOn(false); btnState(t);
  kitFlies(0, false);
  hookFly.visible = t < TP;
  if (hookFly.visible) { const a = t * 2.2; hookFly.position.set(BTN.x - 0.12 + Math.cos(a) * 0.14, BTN.y + 0.32 + Math.sin(a * 2.6) * 0.04, BTN.z + 0.1 + Math.sin(a) * 0.06); hookFly.rotation.y = -a - Math.PI / 2; hookFly.userData.flap(t); }
  if (t >= TP && !kitSpark.r0) { kitSpark.init([hookFly.position.toArray()], 0.1, 0.4); kitSpark.r0 = true; }
  kitSpark.set(t >= TP ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  el.title.style.opacity = 1;
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return room;
}
function kitCam(t, d, a, b) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), -0.1, 0.95, -2.8, 52); }
function shot1(t) { // everyday: flies around the food, cook waving them off
  lift(60);
  kitchen(); cook.visible = true; btn.userData.labelOn(false); btn.userData.press(0); btn.userData.hand(0); hookFly.visible = false; kitSpark.set(0);
  kitFlies(t + 2, true);
  cook.userData.arms[1].rotation.x = -1.3 - Math.sin(t * 7) * 0.35;
  kitCam(t, 3.5, [-1.4, 2.0, 1.4], [-1.1, 1.95, 1.1]);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return room;
}
function shot2(t) { // +1秒: kitchen flies vanish
  lift(60);
  kitchen(); cook.visible = true; btn.userData.labelOn(false); btn.userData.press(1); btn.userData.hand(0); hookFly.visible = false;
  const tv = 0.6;
  kitFlies(t + 5, t < tv);
  if (t >= tv && !kitSpark.r1) { kitSpark.init(kFly.map(f => f.position.toArray()), 0.1, 0.5); kitSpark.r1 = true; }
  kitSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  cook.userData.arms[1].rotation.x = t < tv ? -1.3 : lerp(-1.3, 0, clamp((t - 1.5) / 1));
  cook.userData.head.rotation.y = t > 1.5 ? Math.sin(t * 1.8) * 0.4 : 0;
  el.flash.style.opacity = t >= tv ? 0.4 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  kitCam(t, 8, [-1.1, 1.95, 1.1], [-0.6, 2.3, 1.9]);
  hudTime('+1秒');
  setTop('ハエの仲間（世界・2024年）', countUp(t, 16, 1.2, 1.0) + '万種以上', fade(t, 1.15, 8, 0.25));
  return room;
}
function shot3(t) { // +1日: globe, flies over the trachoma zones vanish; red dots fade
  setEarthNight(0);
  earth.rotation.y = faceLon(22) + 0.2 - t * 0.04;
  const tv = 0.8;
  gFly.set(t < tv ? 140 : 0, t);
  if (t >= tv && !gSpark.r) { const pts = []; for (let i = 0; i < 30; i++) pts.push([-6 + i * 0.4, -2 + (i % 7), 9 + (i % 4)]); gSpark.init(pts, 0.8, 2); gSpark.r = true; }
  gSpark.set(t >= tv ? (t - tv) / 1.5 : 0);
  hotVis(1);
  const u = ease(t / 8);
  look(0, lerp(4, 2, u), lerp(40, 35, u), 0, -2.5, 0, 45);
  hudTime('+1日');
  setTop('トラコーマで失明・視覚障害（WHO・2026年）', '約' + countUp(t, 190, 1.0, 0.9) + '万人', fade(t, 1.15, 8, 0.25), RED);
  return space;
}
function fieldCam(t, d, a, b, tg = [0, 0.5, 0.3]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function shot4(t) { // +1か月: meadow, flies on flowers vanish; bees stay
  lift(300);
  fieldEnv('day'); fieldBees(t);
  const tv = 1.0;
  fSwarm.set(t < tv ? 60 : 0, t);
  fSpark.set(t >= tv ? (t - tv) / 1.5 : 0);
  fieldCam(t, 8, [-2.5, 2.6, 7.0], [-1.0, 2.4, 6.0]);
  hudTime('+1か月');
  const v = t < 3.0 ? countUp(t, 25, 1.5, 1.0) + '%' : '25〜50%';
  setTop('作物の花に来る、ハチ以外の虫（2016年）', v, fade(t, 1.45, 8, 0.25), GOLD);
  return field;
}
function shot5(t) { // +3か月: wider meadow at dusk, only a few bees
  lift(300);
  fieldEnv('day'); fieldBees(t + 8); fSwarm.set(0, t); fSpark.set(0);
  fieldCam(t, 9.2, [3.5, 4.5, 9.5], [5.5, 6.5, 12], [0, 0.4, -1]);
  hudTime('+3か月');
  setTop('作物の花に来る、ハチ以外の虫（2016年）', '25〜50%', fade(t, 0.15, 9.2, 0.25), GOLD);
  return field;
}
function labCam(t, d, a, b) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0.95, 1.05, -1.15, 50); }
function shot6(t) { // +1年: lab, fruit flies in vials vanish
  lift(160);
  labDress();
  const tv = 1.0;
  vials(t < tv ? 7 : 0, t);
  labSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  researcher.userData.head.rotation.y = t > 2 ? Math.sin(t * 2) * 0.5 : 0;
  lq.visible = t > 2.2; lq.position.set(researcher.position.x, 2.35 + Math.sin(t * 3) * 0.04, researcher.position.z);
  labCam(t, 8.8, [0.1, 1.75, 1.0], [0.3, 1.7, 0.7]);
  hudTime('+1年');
  setTop('人の病気の遺伝子が、ハエにもある割合（2001年）', countUp(t, 77, 1.6, 1.2) + '%', fade(t, 1.55, 8.8, 0.25), GREEN);
  return lab;
}
function shot7(t) { // result: empty vials, researcher still
  lift(160);
  labDress(); vials(0, t); labSpark.set(0); lq.visible = false;
  researcher.userData.head.rotation.y = -0.5;
  labCam(t, 7.5, [0.4, 2.0, 1.8], [0.9, 2.4, 3.0]);
  const a = t < 3.6;
  setTop(a ? 'トラコーマで失明・視覚障害（WHO・2026年）' : '人の病気の遺伝子が、ハエにもある割合（2001年）', a ? '約190万人' : '77%', fade(t, 0.15, 7.5, 0.25), a ? RED : GREEN);
  return lab;
}
function shot8(t) { // loop: kitchen button again, no flies
  kitchen(); cook.visible = false; btn.userData.labelOn(false); btn.userData.press(0); btn.userData.hand(0); hookFly.visible = false; kitSpark.set(0);
  kitFlies(0, false);
  hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
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
    id: '0701',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '生き物・動物',
    title: '世界中のハエが絶滅したら？',
    titleHtml: '世界中のハエが<br>絶滅したら？',
    mood: 'tension', seed: 701, hits: [1.4, 48.1], risers: [6.0], impacts: [18.6, 44.6],
    sfx: [[1.4, 'poof'], [6.6, 'poof'], [14.8, 'poof'], [23.0, 'poof'], [40.2, 'poof'], [2.6, 'buzz']],
    narr: { '16万種': '16万しゅ', '190万人': '190万人', '25〜50%': '25から50パーセント', '77%': '77パーセント', 'ハエ絶滅ボタン': 'ハエぜつめつボタン' },
    ask: '次に絶滅ボタンを押したい生き物は？',
    caption: 'もしも世界中のハエが一瞬で絶滅したら？\nハエの仲間は、世界で16万種以上が見つかっている（2024年）。\nまず消えるのは、目の病気トラコーマの運び屋。この病気で失明・視覚障害になっている人は世界で約190万人（WHO・2026年）。\nでもハエの仕事はそれだけじゃない。作物の花に来る虫のうち25〜50%はハチ以外の虫で、ハエもその1つ（2016年の研究）。死がいやフンを分解する幼虫もいなくなる。\nそして研究室のショウジョウバエ。人の病気に関わる遺伝子の77%が、このハエにもある（2001年の研究）。\n結果、病気の運び屋は消えるけど、受粉と研究の相棒も消える。\n\n次に絶滅ボタンを押したい生き物は？ コメントで教えて。\n\n出典：Systema Dipterorum（2024年）、WHO ファクトシート Trachoma、Rader ほか PNAS（2016年）、Reiter ほか Genome Research（2001年）',
    hashtags: ['もしもラボ', 'ハエ', '絶滅', '生き物', '雑学'],
    endStats: [['ハエの仲間', '16万種以上', '2024年'], ['トラコーマで失明・視覚障害', '約190万人', 'WHO・2026年'], ['作物の花に来るハチ以外の虫', '25〜50%', '2016年'], ['人の病気の遺伝子がハエにも', '77%', '2001年']],
    sources: '出典：Systema Dipterorum（2024年）、WHO、<br>PNAS（2016年）、Genome Research（2001年）',
  },
});
