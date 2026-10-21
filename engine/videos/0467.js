import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, makeQ } from '../lib.js';
import { station, setStationEnv, PH, TZ, makeRiders } from '../scenes/station.js';
import { field, setFieldEnv, setFlowers } from '../scenes/field.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { lab, setLabLight, makeRodent, setMice, researcher } from '../scenes/mouselab.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界中のネズミが消えたら？（blueprint no 467）
// 数字：
//  都内のネズミ類の苦情・相談 7,223件（東京都保健医療局「ねずみ・衛生害虫等の相談件数」令和7年度＝2025年度）
//  アジアの米の収穫の約6%をネズミなどのげっ歯類が食べる＝インドネシア2.4億人の1年分（Normile, Science 327:806, 2010「Holding Back a Torrent of Rats」）
//  レプトスピラ症 世界で年103万人が発症・5万8,900人が死亡（Costa et al., PLoS Negl Trop Dis 2015）。保菌動物はドブネズミなど、尿から排出（京都府感染症情報センター）
//  マウスと人のタンパク質をつくる部分の遺伝子は平均85%同じ。薬の効き目を試すモデルとして確立（NHGRI「Why Mouse Matters」）

// ---------- station rats ----------
const RAT_S = 0.42;
const sRats = []; for (let i = 0; i < 5; i++) { const r = makeRodent({ kind: 'rat' }); r.scale.setScalar(RAT_S); station.add(r); sRats.push(r); }
const sSpark = makeSparkles(260, 0.12); station.add(sSpark.points);
const HX = 4; // hook x position on the line
const RZ = TZ + 1.25, RY = 0.22;
// rat i runs along the ballast (x direction) and back
function ratPos(i, t) {
  const base = [HX + 2.5, HX + 0.5, HX + 4.5, HX + 1.5, HX - 1][i], zz = [RZ, TZ - 1.2, RZ - 0.1, TZ + 1.1, TZ - 1.15][i];
  const sp = [0.9, 0.7, 1.1, 0.8, 0.6][i];
  const x = base + Math.sin(t * sp + i * 2) * 2.2;
  const dir = Math.cos(t * sp + i * 2) >= 0 ? 1 : -1;
  return { x, z: zz + Math.sin(t * 2.3 + i) * 0.08, dir };
}
function stationRats(t, k = 5, s = RAT_S) {
  sRats.forEach((r, i) => {
    r.visible = i < k; if (!r.visible) return;
    r.scale.setScalar(s);
    const p = ratPos(i, t); r.position.set(p.x, RY, p.z); r.rotation.y = p.dir > 0 ? 0 : Math.PI; r.userData.anim(t + i, 1);
  });
}
const riders = makeRiders(14, 21, { x0: -4, x1: 16, z0: -2.4, z1: 2.4 });
// trash bag on platform near the hook (food for rats)
const bag = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), mat('#2d3138', { flatShading: true })); bag.scale.set(1, 0.85, 1); bag.position.set(HX + 7.8, PH + 0.27, 2.9); station.add(bag);
const bag2 = bag.clone(); bag2.position.set(HX + 8.4, PH + 0.24, 3.0); bag2.scale.set(0.8, 0.75, 0.8); station.add(bag2);
const night = () => { setStationEnv('night'); };

// ---------- rice paddy (added to field) ----------
const P = new THREE.Vector3(4, 0, 17);
const PAD = new THREE.Group(); PAD.position.copy(P); field.add(PAD);
const waterM = mat('#6f8d86'), dikeM = mat('#8a7a52');
const PLOTS = []; // 3 x 3 plots 5 x 4.6
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
  const x = (a - 1) * 5.4, z = (b - 1) * 5.0;
  const w = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.6), waterM); w.rotation.x = -Math.PI / 2; w.position.set(x, 0.05, z); w.receiveShadow = true; PAD.add(w);
  PLOTS.push([x, z]);
}
for (let a = 0; a < 4; a++) { const d = box(0.4, 0.18, 15.2, dikeM); d.position.set(-8.1 + a * 5.4, 0.09, 0); PAD.add(d); }
for (let b = 0; b < 4; b++) { const d = box(16.6, 0.18, 0.4, dikeM); d.position.set(0, 0.09, -7.5 + b * 5.0); PAD.add(d); }
const riceGeo = new THREE.ConeGeometry(0.07, 0.62, 4); riceGeo.translate(0, 0.31, 0);
const riceM = new THREE.MeshLambertMaterial({ color: '#5f9f45', flatShading: true });
const RICE = [];
for (const [x, z] of PLOTS) for (let i = 0; i < 13; i++) for (let j = 0; j < 12; j++) RICE.push([x - 2.25 + i * 0.375, z - 2.05 + j * 0.375]);
const rice = new THREE.InstancedMesh(riceGeo, riceM, RICE.length); rice.castShadow = true; PAD.add(rice);
const earGeo = new THREE.SphereGeometry(0.06, 5, 4); earGeo.scale(1, 1.8, 1);
const ears = new THREE.InstancedMesh(earGeo, mat('#e2b84a'), RICE.length); PAD.add(ears);
const dm = new THREE.Object3D();
// gnawed: some stalks bent / missing (k = how much damage visible 0..1)
const gnawR = rng(5); const GNAW = RICE.map(() => gnawR());
function setRice(grow, gold, gnaw = 0) {
  RICE.forEach(([x, z], i) => {
    const bitten = GNAW[i] < 0.06 * gnaw * 1.0; // 6%
    dm.position.set(x, 0.05, z); dm.rotation.set(bitten ? 1.2 : Math.sin(i * 1.3) * 0.08, 0, Math.cos(i * 0.7) * 0.08); dm.scale.set(1, (0.5 + grow * 0.6) * (bitten ? 0.6 : 1), 1); dm.updateMatrix(); rice.setMatrixAt(i, dm.matrix);
    dm.position.y = 0.05 + (0.5 + grow * 0.6) * 0.6; dm.scale.set(1, 1, 1); dm.rotation.set(0.5, i, 0); dm.updateMatrix();
    if (bitten || gold < 0.3) dm.scale.set(0, 0, 0), dm.updateMatrix();
    ears.setMatrixAt(i, dm.matrix);
  });
  rice.instanceMatrix.needsUpdate = true; ears.instanceMatrix.needsUpdate = true;
  riceM.color.set('#5f9f45').lerp(new THREE.Color('#d1ab45'), gold);
}
const pRats = []; for (let i = 0; i < 10; i++) { const r = makeRodent({ kind: 'rat', coat: '#6e6152' }); r.scale.setScalar(0.38); PAD.add(r); pRats.push(r); }
const padSpark = makeSparkles(400, 0.16); PAD.add(padSpark.points);
function paddyRats(t, vis) {
  pRats.forEach((r, i) => {
    r.visible = vis; if (!vis) return;
    // run along dikes
    const along = ((t * (0.9 + (i % 3) * 0.25) + i * 3.3) % 14) - 7;
    if (i % 2) r.position.set(-8.1 + (i % 4) * 5.4, 0.18, along * (i % 4 === 1 ? -1 : 1)), r.rotation.y = (i % 4 === 1) ? Math.PI / 2 : -Math.PI / 2;
    else r.position.set(along * (i % 4 === 2 ? -1 : 1), 0.18, -7.5 + (i % 4) * 5.0), r.rotation.y = (i % 4 === 2) ? Math.PI : 0;
    r.userData.anim(t + i, 1);
  });
}
const pw = (x, y, z) => [P.x + x, P.y + y, P.z + z];

// ---------- globe: leptospirosis hotspots ----------
const HOT = [];
{
  const r = rng(17); const g = new THREE.SphereGeometry(0.12, 8, 6);
  const zones = [[-5, 20, 110, 30, 60], [-25, 5, -75, 30, 50], [-10, 12, -10, 40, 40], [10, 20, -90, 15, 12], [15, 25, 72, 18, 25], [-10, 0, 140, 10, 8]]; // lat0, lat1, lon0, lonSpan, n
  for (const [la0, la1, lo0, span, n] of zones) for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true })); m.position.copy(latLon(la0 + r() * (la1 - la0), lo0 + r() * span, 10.08)); earth.add(m); HOT.push({ m, k: r() });
  }
}
function hotVis(k) { for (const x of HOT) { x.m.visible = k > 0.001; x.m.material.opacity = clamp((k - x.k * 0.5) / 0.5); } }
const hotSpark = makeSparkles(300, 0.3, 0xffe6a0); earth.add(hotSpark.points); hotSpark.init(HOT.map(x => x.m.position.toArray()), 0.3, 2.5);

// ---------- lab ----------
const lq = makeQ(); lq.visible = false; lab.add(lq);
const labSpark = makeSparkles(160, 0.05); lab.add(labSpark.points);

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの夜の駅。'],
  [6.2, 10.1, '世界中のネズミが、<br>一斉に消えた。'],
  [10.1, 14, '東京だけでも、ネズミの<br>相談は年7,000件超。'],
  [14.2, 18.1, '消えたのは、街の<br>ネズミだけじゃない。'],
  [18.1, 22, 'アジアの田んぼでは、<br>米の6%を食べていた。'],
  [22.2, 26.1, 'それは2.4億人が、<br>1年食べられる量。'],
  [26.1, 30, 'その米が、<br>収穫まで残るようになった。'],
  [30.2, 34.6, 'ネズミなどの尿でうつる<br>レプトスピラ症も減る。'],
  [34.6, 39, '世界で毎年、5.9万人が<br>亡くなっていた病気だ。'],
  [39.2, 43.6, 'でも、研究室の<br>マウスも消えた。'],
  [43.6, 47.8, '人と遺伝子の85%が同じ、<br>薬の実験の主役だった。'],
  [48.1, 53.8, '結果：2.4億人分の米が残り、<br>薬の実験は主役を失った。'],
  [53.9, 56.1, '嫌われ者は、薬の恩人。'],
  [56.2, 59.4, 'ネズミを消す？<br>それとも残す？'],
];

function hookCam(t, d = 2.5) { const u = ease(t / d); look(HX + lerp(-0.4, -0.1, u), lerp(2.3, 2.2, u), lerp(3.3, 3.5, u), HX + 1.6, 0.25, RZ - 0.1, 46); }
function hookRat(t) { const r = sRats[0]; r.visible = true; r.scale.setScalar(0.6); r.position.set(HX + lerp(2.4, 1.0, t / 1.4), RY, RZ - 0.15); r.rotation.y = Math.PI + 0.15; r.userData.anim(t, 1); }
const TV = 1.2;
function shot0(t) { // hook: night station, rats on the track vanish at 1.2s
  night(); riders.set(0, t);
  stationRats(t, 0); if (t < TV) hookRat(t);
  if (t >= TV && !sSpark.r0) { sSpark.init([sRats[0].position.toArray()], 0.3, 0.8); sSpark.r0 = true; }
  sSpark.set(t >= TV ? (t - TV) / 1.0 : 0);
  el.flash.style.opacity = t >= TV ? 0.5 * Math.max(0, 1 - (t - TV) / 0.3) : 0;
  hookCam(t);
  el.title.style.opacity = 1;
  return station;
}
function shot1(t) { // everyday: rats around the station at night, people waiting
  night(); riders.set(14, t, { look: true }); sSpark.set(0);
  stationRats(t + 3, 5, 0.55);
  const u = ease(t / 3.5);
  look(HX + lerp(7.4, 6.8, u), lerp(2.3, 2.2, u), lerp(3.0, 3.3, u), HX + 3, 0.3, TZ + 0.4, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return station;
}
function shot2(t) { // +1s: rats vanish everywhere in the station
  night(); riders.set(14, t, { look: true });
  const tv = 0.7;
  stationRats(t + 6.5, t < tv ? 5 : 0, 0.55);
  if (t >= tv && !sSpark.r1) { sSpark.init(sRats.map(r => r.position.toArray()), 0.3, 0.9); sSpark.r1 = true; }
  sSpark.set(t >= tv ? (t - tv) / 1.3 : 0);
  el.flash.style.opacity = t >= tv ? 0.35 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  const u = ease(t / 8);
  look(HX + lerp(8.5, 10, u), lerp(2.5, 4.0, u), lerp(3.0, 9.5, u), HX + 3, lerp(0.3, 0.9, u), TZ - lerp(-0.2, 1.5, u), 50);
  hudTime('+1秒');
  setTop('都内のネズミの相談件数（2025年度）', comma(countUp(t, 7223, 4.0, 1.3)) + '件', fade(t, 3.95, 8, 0.25));
  return station;
}
function padEnv(e) { setFieldEnv(e); setFlowers(1); }
function shot3(t) { // +1日: paddy, rats on the dikes vanish
  lift(260);
  padEnv('day'); setRice(0.55, 0.15, 1);
  const tv = 1.0;
  paddyRats(t, t < tv);
  if (t >= tv && !padSpark.r) { padSpark.init(pRats.map(r => r.position.toArray()), 0.3, 1.0); padSpark.r = true; }
  padSpark.set(t >= tv ? (t - tv) / 1.5 : 0);
  const u = ease(t / 8);
  look(...pw(lerp(-6, -3, u), lerp(4.2, 5.0, u), lerp(10.5, 11.5, u)), ...pw(-1, 0.3, 0), 50);
  hudTime('+1日');
  setTop('ネズミなどが食べるアジアの米（2010年）', countUp(t, 6, 4.3, 1.0) + '%', fade(t, 4.25, 8, 0.25), '#ffd27a');
  return field;
}
function shot4(t) { // +3か月: rice grows golden, no damage
  lift(300);
  padEnv('day'); paddyRats(0, false); padSpark.set(0);
  setRice(lerp(0.6, 1, clamp(t / 5)), clamp(t / 5), 0);
  const u = ease(t / 8);
  look(...pw(lerp(9, 6, u), lerp(9, 12, u), lerp(13, 15, u)), ...pw(0, 0, -1), 50);
  hudTime('+3か月');
  setTop('守られる米（2010年の推計）', (countUp(t, 24, 0.3, 1.4) / 10).toFixed(1) + '億人分', fade(t, 0.15, 8, 0.25), '#ffd27a');
  return field;
}
function shot5(t) { // +半年: globe, leptospirosis hotspots fade
  setEarthNight(0);
  earth.rotation.y = faceLon(105) + 0.25 - t * 0.05;
  hotVis(t < 3 ? 1 : 1 - (t - 3) / 4);
  if (!hotSpark.r) hotSpark.r = true;
  hotSpark.set(t > 3.2 ? (t - 3.2) / 4 : 0);
  const u = ease(t / 9);
  look(0, lerp(4, 1.5, u), lerp(38, 34, u), 0, -2.5, 0, 45);
  hudTime('+半年');
  const lab1 = t < 4.4 ? 'レプトスピラ症の患者（世界・2015年の推計）' : 'レプトスピラ症の死者（世界・2015年の推計）';
  const v = t < 4.4 ? '年' + countUp(t, 103, 0.3, 1.3) + '万人' : '年' + comma(countUp(t, 58900, 4.5, 1.3)) + '人';
  setTop(lab1, v, fade(t, 0.15, 9, 0.25), '#ff8a7a');
  return space;
}
function labDress() { setLabLight('day'); researcher.position.set(0.75, 0, -0.15); researcher.rotation.y = Math.PI + 0.35; }
function shot6(t) { // +1年: lab mice vanish, researcher puzzled
  lift(160);
  labDress();
  const tv = 1.0;
  setMice(t < tv ? 1 : 0, t);
  if (t >= tv && !labSpark.r) {
    const pts = []; lab.updateMatrixWorld(true);
    // cage centers
    for (const x of [-2.55, -1.5, -0.45, -2.05, -1.0, 0.05]) pts.push([x, 1.05, -1.2]);
    labSpark.init(pts, 0.5, 0.4); labSpark.r = true;
  }
  labSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  researcher.userData.head.rotation.y = t > 2 ? Math.sin(t * 2) * 0.5 : 0;
  lq.visible = t > 2.2; lq.position.set(researcher.position.x, 2.35 + Math.sin(t * 3) * 0.04, researcher.position.z);
  const u = ease(t / 8.8);
  look(lerp(-1.6, -1.1, u), lerp(2.0, 1.85, u), lerp(2.4, 2.0, u), -1.2, 0.95, -1.2, 50);
  hudTime('+1年');
  setTop('マウスと人の遺伝子（NHGRI）', countUp(t, 85, 4.6, 1.2) + '%が同じ', fade(t, 4.5, 8.8, 0.25), '#7ff0c8');
  return lab;
}
function shot7(t) { // result: empty cages, researcher stands still; rice number
  lift(160);
  labDress(); setMice(0); labSpark.set(0);
  researcher.userData.head.rotation.y = -0.4;
  lq.visible = false;
  const u = ease(t / 7.5);
  look(lerp(-1.0, -0.6, u), lerp(2.3, 2.7, u), lerp(3.4, 4.8, u), 0.1, 0.95, -1.0, 50);
  const a = t < 3.6;
  setTop(a ? '守られる米（2010年の推計）' : 'マウスと人の遺伝子（NHGRI）', a ? '2.4億人分' : '85%が同じ', fade(t, 0.15, 7.5, 0.25), a ? '#ffd27a' : '#7ff0c8');
  return lab;
}
function shot8(t) { // loop: same station view, no rats
  night(); riders.set(0, t); stationRats(0, 0); sSpark.set(0);
  hookCam(t + 0.4, 4.5);
  return station;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0467',
    title: '世界中のネズミが消えたら？',
    titleHtml: '世界中のネズミが<br>消えたら？',
    mood: 'mystery', seed: 467, hits: [1.2, 48.1], risers: [6.0], impacts: [22.6, 35.0],
    sfx: [[1.2, 'poof'], [6.7, 'poof'], [15.0, 'poof'], [40.2, 'poof'], [2.8, 'skitter']],
    narr: { '2.4億人': '2億4千万人', '5.9万人': '5万9千人', '6%': '6パーセント', '85%': '85パーセント', '7,000件': '7000件' },
    ask: 'ネズミを消す？それとも残す？',
    caption: 'もしも世界中のネズミが一瞬で消えたら？\n東京だけでも、ネズミの苦情・相談は年7,223件（2025年度）。\nアジアの田んぼでは、収穫の約6%をネズミなどが食べていた。これはインドネシアの2.4億人が1年食べられる量（2010年の推計）。\nネズミなどの尿でうつるレプトスピラ症は、世界で年103万人がかかり、約5万8,900人が亡くなっていた（2015年の推計）。\nでも、研究室のマウスも消える。マウスと人は、タンパク質をつくる遺伝子の85%が同じ。薬が効くかを試す実験の主役だった。\n結果、2.4億人分の米は残るけど、薬の実験は主役を失う。\n\nネズミを消す？それとも残す？ コメントで教えて。\n\n出典：東京都保健医療局 ねずみ・衛生害虫等の相談件数（令和7年度）、Science 327:806（2010年）、Costa ほか PLoS Neglected Tropical Diseases（2015年）、米国立ヒトゲノム研究所 NHGRI「Why Mouse Matters」',
    hashtags: ['もしもラボ', 'ネズミ', '絶滅', '生き物', '雑学'],
    endStats: [['都内のネズミの相談', '7,223件', '2025年度'], ['ネズミなどが食べるアジアの米', '約6%', '2010年'], ['それで食べられる人数', '2.4億人分', '2010年の推計'], ['レプトスピラ症の死者', '年5万8,900人', '2015年推計'], ['マウスと人の遺伝子', '85%が同じ', 'NHGRI']],
    sources: '出典：東京都保健医療局（2025年度）、Science（2010年）、<br>PLoS Negl Trop Dis（2015年）、NHGRI',
  },
});
