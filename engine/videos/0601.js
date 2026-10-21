import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, poseWalk, SKIN, HAIR, SHIRT, PANTS } from '../lib.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill, glassTex } from '../city.js';
import { town, setTownEnv, setVacant } from '../scenes/town.js';
import { field, setFieldEnv, setFlowers, setFruit } from '../scenes/field.js';
import { space, earth, globeM, setEarthNight } from '../scenes/earth.js';
import { makeDog } from '../scenes/dog.js';
import { cam, lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, hudTime, el } from '../story.js';

// もしも地球から人間が消えたら？（+0秒〜100年後）。結果で「地球にとって良いか悪いか」を言い切る
// 数字
//   世界人口 約82億人（国連 世界人口推計2024：2024年に82億人）
//   電気とポンプが止まり、48時間以内にニューヨークの地下鉄に水が流れ込む／大通りは数か月でひび割れ・隆起／
//   数十年で街路が陥没し建物が倒れ、植物が入り込む／一部のプラスチックは数十万年残る
//   （Scientific American「An Earth Without People」2007年・Alan Weisman『The World Without Us』の取材）
//   福島：原発事故の避難区域などに106台のカメラ・120日間で26万7000枚以上、20種超。イノシシ4万6000枚のうち2万6000枚以上が立入禁止区域（ジョージア大学、2020年1月発表／CNN）
//   チェルノブイリ：事故から約30年、オオカミは汚染のない保護区の7倍以上、ヘラジカ・シカ・イノシシは保護区と同程度（Deryabina et al., Current Biology 2015／Nature News）
//   CO2：排出をやめても、出したCO2の約20%は数千年にわたって大気に残る（IPCC 第4次評価報告書 FAQ 10.3）
// 着地：自然（動物・森）には良い。でも人間が残したCO2とプラスチックは100年後も消えない。

const GREEN = '#7ff0c8', RED = '#ff8a7a', GOLD = '#ffe08a', BLUE = '#7fd4ff';
function L(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }
const pick = (r, a) => a[Math.floor(r() * a.length)];
const TV = 6.6; // people vanish

// ---------- city: people on the sidewalk ----------
const gStreet = new THREE.Group(); city.add(gStreet);
const peds = [];
{ const r = rng(36); for (let i = 0; i < 24; i++) { const p = makePerson({ skin: pick(r, SKIN), hair: pick(r, HAIR), shirt: pick(r, SHIRT), pants: pick(r, PANTS), long: r() < 0.5, scale: 0.94 + r() * 0.12 }); gStreet.add(p); peds.push({ p, z: 5.8 + r() * 2.4, x0: -12 + r() * 24, dir: r() < 0.5 ? 1 : -1, s: 0.8 + r() * 0.5, ph: r() * 6 }); } }
const streetSpark = makeSparkles(500, 0.16); city.add(streetSpark.points);
const cityPeople = []; city.traverse(o => { if (o.userData && o.userData.legs && o.userData.arms && !peds.some(w => w.p === o)) cityPeople.push(o); });
// the clerk is painted on the shop window texture: erase it after the vanish
const gctx = glassTex.image.getContext('2d'); const clerkImg = gctx.getImageData(116, 62, 60, 100); const clerkBg = gctx.getImageData(100, 95, 1, 1).data; let clerkOn = true;
function setClerk(on) { if (on === clerkOn) return; clerkOn = on; if (on) gctx.putImageData(clerkImg, 116, 62); else { gctx.fillStyle = `rgb(${clerkBg[0]},${clerkBg[1]},${clerkBg[2]})`; gctx.fillRect(116, 62, 60, 98); gctx.fillStyle = '#b9b3a6'; gctx.fillRect(116, 160, 60, 2); } glassTex.needsUpdate = true; }
function cityBase() { setEnv('day', new THREE.Vector3(0, 0, 2)); setStore(1); setStoreLights(0.3); setBurst(0); ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = false; }
function streetAt(T) {
  const gone = T >= TV;
  for (const w of peds) {
    let x = w.x0 + w.dir * Math.min(T, TV) * w.s; x = ((x + 14) % 28 + 28) % 28 - 14;
    w.p.position.set(x, 0, w.z); w.p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2; w.p.visible = !gone; poseWalk(w.p, T * 7 + w.ph);
  }
  updateCars(Math.min(T, TV), !gone);
  cityPeople.forEach(o => { o.visible = !gone; }); setClerk(!gone);
}

// ---------- subway tunnel ----------
const tunnel = new THREE.Scene();
tunnel.background = new THREE.Color('#0b0e12'); tunnel.fog = new THREE.Fog(0x0b0e12, 6, 40);
tunnel.add(new THREE.HemisphereLight(0xcfd8e6, 0x101418, 0.55));
const tube = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 80), mat('#5d636b', { side: THREE.BackSide })); tube.position.set(0, 2.5, -30); tunnel.add(tube);
const plat = box(3.0, 1.1, 60, mat('#8a8f96')); plat.position.set(-2.5, 0.55, -25); tunnel.add(plat);
const edge = box(0.25, 0.04, 60, mat('#e0c040')); edge.position.set(-1.05, 1.12, -25); tunnel.add(edge);
for (const x of [0.6, 2.0]) { const rail = box(0.1, 0.12, 80, mat('#9aa0a8')); rail.position.set(x, 0.1, -30); tunnel.add(rail); }
for (let i = 0; i < 26; i++) { const sl = box(1.9, 0.08, 0.25, mat('#4a4038')); sl.position.set(1.3, 0.03, 8 - i * 3); tunnel.add(sl); }
const tLights = [];
for (let i = 0; i < 10; i++) { const lm = new THREE.MeshBasicMaterial({ color: '#fff6dc' }); const l = box(1.6, 0.08, 0.3, lm); l.position.set(0, 4.9, 6 - i * 8); tunnel.add(l); tLights.push(lm); const pl = new THREE.PointLight(0xfff2d0, 1.2, 10, 1.5); pl.position.set(0, 4.4, 6 - i * 8); tunnel.add(pl); tLights.push(pl); }
const waterM = new THREE.MeshLambertMaterial({ color: '#3a6a7a', transparent: true, opacity: 0.85 });
const water = new THREE.Mesh(new THREE.PlaneGeometry(8, 80, 40, 160), waterM); water.rotation.x = -Math.PI / 2; water.position.set(0, 0, -30); tunnel.add(water);
const wpos = water.geometry.attributes.position, w0 = wpos.array.slice();
function setTunnel(level, lightsOn, t) {
  water.position.y = level; water.visible = level > 0.01;
  for (let i = 0; i < wpos.count; i++) wpos.setZ(i, Math.sin(w0[i * 3] * 1.7 + t * 2) * 0.03 + Math.sin(w0[i * 3 + 1] * 0.8 + t * 1.3) * 0.04);
  wpos.needsUpdate = true;
  tLights.forEach(l => { if (l.isPointLight) l.intensity = 1.2 * lightsOn; else l.color.set(lightsOn > 0.5 ? '#fff6dc' : '#2a2a2a'); });
}

// ---------- town: boars, overgrowth ----------
function makeBoar() {
  const g = new THREE.Group(); const brown = mat('#5a4535'), dark = mat('#3a2c22');
  const body = box(1.0, 0.5, 0.48, brown); body.position.y = 0.5; g.add(body);
  const hump = box(0.5, 0.18, 0.44, dark); hump.position.set(0.15, 0.82, 0); g.add(hump);
  const head = box(0.4, 0.36, 0.36, dark); head.position.set(0.66, 0.5, 0); head.rotation.z = -0.25; g.add(head);
  const snout = box(0.14, 0.16, 0.2, mat('#7a5a48')); snout.position.set(0.88, 0.42, 0); g.add(snout);
  for (const s of [-1, 1]) { const tusk = box(0.04, 0.12, 0.03, mat('#efe6d0')); tusk.position.set(0.86, 0.5, s * 0.1); tusk.rotation.z = 0.4; g.add(tusk); }
  const legs = [];
  for (const x of [-0.32, 0.32]) for (const s of [-1, 1]) { const l = box(0.12, 0.3, 0.12, dark); l.geometry.translate(0, -0.15, 0); l.position.set(x, 0.3, s * 0.16); g.add(l); legs.push(l); }
  g.userData.anim = (t, walk = 1) => { legs.forEach((l, i) => { l.rotation.z = Math.sin(t * 8 + i * Math.PI) * 0.4 * walk; }); head.rotation.z = -0.25 + Math.sin(t * 3) * 0.1; };
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
const boars = []; for (let i = 0; i < 5; i++) { const b = makeBoar(); b.scale.setScalar(i ? 0.6 : 0.85); town.add(b); boars.push(b); }
function boarWalk(T, vis) { boars.forEach((b, i) => { b.visible = vis; if (!vis) return; const x = 1.2 + (i % 2) * 0.9, z = 9 - ((T * 0.9 + i * 1.3) % 14); b.position.set(x + Math.sin(T + i) * 0.2, 0, z); b.rotation.y = Math.PI / 2; b.userData.anim(T + i); }); }
const overgrow = new THREE.Group(); town.add(overgrow);
{ const r = rng(77); for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = 2 + r() * 22; const x = Math.cos(a) * d, z = Math.sin(a) * d; const h = 2 + r() * 3; const tr = box(0.3, h, 0.3, mat('#5d4434')); tr.position.set(x, h / 2, z); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + r() * 1.0, 0), mat(r() < 0.5 ? '#3f7a44' : '#4f8f4a', { flatShading: true })); c.position.set(x, h + 0.7, z); c.castShadow = true; const g = new THREE.Group(); g.add(tr); g.add(c); g.userData.q = r(); overgrow.add(g); } }
const cracks = new THREE.Group(); town.add(cracks);
{ const r = rng(5); for (let i = 0; i < 40; i++) { const c = box(0.05 + r() * 0.06, 0.012, 0.6 + r() * 1.8, mat('#2a2a2a')); c.position.set((r() - 0.5) * 6, 0.03, (r() - 0.5) * 30); c.rotation.y = (r() - 0.5) * 1.2; cracks.add(c); } }
function setOvergrow(k) { overgrow.children.forEach(g => { const s = clamp(k * 1.3 - g.userData.q * 0.3); g.visible = s > 0.02; g.scale.setScalar(Math.max(0.01, s)); }); }
const townLamps = []; town.traverse(o => { if (o.isPointLight) townLamps.push(o); });
function townAt(env, vac, grow, over, crack) { setTownEnv(env); setVacant(vac, grow); setOvergrow(over); cracks.visible = crack; if (vac > 0.99) townLamps.forEach(l => { l.intensity = 0; }); }

// ---------- field: wolves ----------
const wolves = [];
for (let i = 0; i < 5; i++) { const w = makeDog({ kind: 'lab', coat: 'black' }); w.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); const c = o.material.color; const l = (c.r + c.g + c.b) / 3; c.setRGB(0.35 + l * 0.6, 0.36 + l * 0.6, 0.38 + l * 0.62); } }); w.scale.setScalar(i ? 1.7 : 2.0); field.add(w); wolves.push(w); }
function wolfRun(T, vis) { wolves.forEach((w, i) => { w.visible = vis; if (!vis) return; const a = T * 0.35 + i * 0.5; w.position.set(-12 + Math.cos(a) * (5 + i * 0.4), 0, -4 + Math.sin(a) * (3 + i * 0.3)); w.rotation.y = -a; }); }

const SUBS = [
  [2.6, 6.4, 'いつもの街。<br>人が行き交う。'],
  [6.6, 10.5, '地球から、人間が<br>一瞬で消えた。'],
  [10.6, 14.4, '消えたのは、<br>約82億人。'],
  [14.6, 18.5, '電気が止まり、<br>ポンプも止まる。'],
  [18.6, 22.4, '48時間で、<br>地下鉄は水びたし。'],
  [22.6, 26.5, '1年後。道路は<br>数か月でひび割れた。'],
  [26.6, 30.4, '夜の街から、<br>明かりが消えた。'],
  [30.6, 34.5, '10年後。街を<br>イノシシが歩く。'],
  [34.6, 38.4, '福島の立入禁止区域で、<br>一番多く撮れた動物だ。'],
  [38.6, 42.5, '30年後。森には<br>オオカミが増える。'],
  [42.6, 46.4, 'チェルノブイリでは、<br>保護区の7倍以上いた。'],
  [46.6, 51.5, '100年後。道路は陥没し、<br>ビルは崩れて森になる。'],
  [51.6, 56.4, '動物にとっては、<br>楽園のような地球。'],
  [56.6, 60.5, 'でも人間が出したCO2は、<br>約20%が数千年残る。'],
  [60.6, 64.4, 'プラスチックは、<br>数十万年消えない。'],
  [64.7, 70.4, '結果：自然には良い。でも<br>人間の傷は100年後も残る。'],
  [70.5, 72.7, '地球は人間がいなくても<br>回っていく。'],
  [72.8, 76.0, '人間は地球に<br>いていいと思う？'],
];

const cd = left => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function shot0(t, T) { cityBase(); streetAt(T); lift(160); const u = ease(t / 2.5); L(lerp(-1, 0, u), lerp(2.4, 2.5, u), lerp(17, 16, u), 0, 2.9, 2, 58); el.title.style.opacity = 1; setHud('人間が消えるまで', cd(TV - T), 1, { mono: true }); return city; }
function shot1(t, T) { cityBase(); streetAt(T); lift(160); const u = ease(t / 3.9); L(lerp(0, 1, u), lerp(2.5, 2.8, u), lerp(16, 15, u), 0, 2.9, 2, 58); el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5); setHud('人間が消えるまで', cd(Math.max(0, TV - T)), 1, { mono: true }); return city; }
function shotVanish(t, T) {
  cityBase(); streetAt(T); lift(160);
  streetSpark.init(peds.map(w => [w.p.position.x, 1.2, w.p.position.z]), 0.6, 1.4); streetSpark.set(clamp((T - TV) / 1.8));
  el.flash.style.opacity = T < TV ? 0 : 0.45 * clamp(1 - (T - TV) / 0.4);
  const u = ease(t / 8); L(lerp(1, -1, u), lerp(2.8, 6, u), lerp(15, 20, u), 0, 2.4, 2, 58);
  hudTime('+0秒');
  setTop('地球から消えた人（2024年・国連）', '約' + countUp(t - 4.2, 82, 0.1, 1.2) + '億人', fade(t, 4.2, 8, 0.2), GOLD);
  return city;
}
function shotTunnel(t, T) {
  lift(220);
  const on = t < 0.8 ? 1 : 0;
  setTunnel(lerp(0.0, 1.45, easeOut(clamp((t - 3.6) / 4.2))), on, T);
  const u = ease(t / 8); look(lerp(-1.6, -1.2, u), lerp(2.6, 2.3, u), lerp(8, 6.5, u), 1.0, 0.8, -14, 55);
  hudTime(t < 4.1 ? '+1時間' : '+48時間');
  if (t < 4.1) setTop('電気とポンプ', '止まる', fade(t, 0.9, 4.1, 0.2), RED);
  else setTop('地下鉄に水があふれるまで（ニューヨーク）', countUp(t - 4.1, 48, 0.1, 1.0) + '時間', fade(t, 4.1, 8, 0.2), BLUE);
  return tunnel;
}
function shotYear(t, T) {
  lift(220);
  const night = t >= 4.1;
  townAt(night ? 'night' : 'day', 1, 0.35, 0, true); boarWalk(T, false);
  const u = ease(t / 8); look(lerp(6, 5, u), lerp(4.2, 3.6, u), lerp(14, 12, u), 0, 0.8, 2, 52);
  hudTime('+1年');
  if (!night) setTop('道路のひび割れ', '数か月で', fade(t, 0.15, 4.1, 0.2), GOLD);
  else setTop('夜の街の明かり', '0', fade(t, 4.1, 8, 0.2), BLUE);
  return town;
}
function shotBoar(t, T) {
  lift(220); townAt('day', 1, 0.6, 0, true); boarWalk(T, true);
  const u = ease(t / 8); look(lerp(3.6, 3.2, u), lerp(1.3, 1.2, u), lerp(-6.5, -5.5, u), 1.5, 0.5, 4, 50);
  hudTime('+10年');
  if (t < 4.1) setTop('街を歩く動物', 'イノシシ', fade(t, 0.15, 4.1, 0.2), GREEN);
  else setTop('福島で撮れたイノシシの写真（2020年発表）', countUp(t - 4.1, 46000, 0.1, 1.2).toLocaleString('en-US') + '枚', fade(t, 4.1, 8, 0.2), GOLD);
  return town;
}
function shotWolf(t, T) {
  lift(220); setFieldEnv('dusk'); setFlowers(1); setFruit(1); wolfRun(T, true);
  const u = ease(t / 8); look(lerp(-6.5, -7.5, u), lerp(1.8, 1.6, u), lerp(3.5, 2.5, u), -12, 0.7, -4, 50);
  hudTime('+30年');
  if (t < 4.1) setTop('森に増える動物', 'オオカミ', fade(t, 0.15, 4.1, 0.2), GREEN);
  else setTop('チェルノブイリのオオカミ（Current Biology 2015）', '保護区の' + countUp(t - 4.1, 7, 0.1, 0.8) + '倍以上', fade(t, 4.1, 8, 0.2), GOLD);
  return field;
}
function shotCentury(t, T) {
  lift(220); townAt('day', 1, 1, easeOut(clamp(t / 6)), true); boarWalk(T, false);
  const u = ease(t / 10); look(lerp(14, 10, u), lerp(12, 8, u), lerp(20, 16, u), 0, 1, 0, 50);
  hudTime('+100年');
  if (t < 5.1) setTop('道路と建物', '崩れて森に', fade(t, 0.15, 5.1, 0.2), GREEN);
  else setTop('動物にとっての地球', '楽園', fade(t, 5.1, 10, 0.2), GREEN);
  return town;
}
function shotEarth(t, T) {
  lift(200); setEarthNight(0); earth.rotation.y = 2.0 + t * 0.06;
  look(0, 3, lerp(34, 30, ease(t / 8)), 0, 1.5, 0, 50);
  hudTime('+100年');
  if (t < 4.2) setTop('数千年残るCO2（IPCC）', '出した量の約' + countUp(t, 20, 0.2, 1.0) + '%', fade(t, 0.15, 4.2, 0.2), RED);
  else setTop('一部のプラスチック', '数十万年残る', fade(t, 4.2, 8, 0.2), RED);
  return space;
}
function shotResult(t, T) {
  lift(220); townAt('dusk', 1, 1, 1, true); boarWalk(T, false);
  const u = ease(t / 7.7); look(lerp(-10, -7, u), lerp(9, 6, u), lerp(18, 14, u), 0, 1, 0, 50);
  if (t < 6.0) setTop('人間がいない地球は、自然には', '良い', fade(t, 0.3, 6.0, 0.2), GREEN);
  else setTop('人間が残したCO2とプラスチック', '100年後も残る', fade(t, 6.0, 7.7, 0.2), RED);
  return town;
}
function shotLoop(t, T) { cityBase(); streetAt(T); lift(160); const u = ease(t / 4); L(lerp(-1, -0.6, u), lerp(2.4, 2.45, u), lerp(17, 16.6, u), 0, 2.9, 2, 58); setHud('人間が消えるまで', '0:00.00', 1, { mono: true }); return city; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6.4, f: shot1 }, { a: 6.4, b: 14.4, f: shotVanish },
  { a: 14.4, b: 22.4, f: shotTunnel }, { a: 22.4, b: 30.4, f: shotYear }, { a: 30.4, b: 38.4, f: shotBoar },
  { a: 38.4, b: 46.4, f: shotWolf }, { a: 46.4, b: 56.4, f: shotCentury }, { a: 56.4, b: 64.4, f: shotEarth },
  { a: 64.4, b: 72.1, f: shotResult }, { a: 72.1, b: 76.1, f: shotLoop }, { a: 76.1, b: 81.1, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 81.1,
  meta: {
    id: '0601',
    title: '地球から人間が消えたら？',
    titleHtml: '地球から人間が<br>消えたら？',
    mood: 'mystery', seed: 601, hits: [6.6, 46.6, 64.7], risers: [6.4, 64.4],
    impacts: [10.6, 18.6, 42.6, 56.6, 64.7],
    sfx: [[0.3, 'whoosh'], [6.6, 'poof'], [14.9, 'drone'], [15.6, 'bubble'], [19.5, 'bubble'], [26.6, 'whoosh'], [38.8, 'howl'], [41.5, 'howl']],
    ask: '人間は地球にいていいと思う？',
    narr: { '82億人': '82億人', 'CO2': 'シーオーツー', '約20%': '約20パーセント' },
    caption: 'もしも地球から人間が一瞬で消えたら？ 0秒から100年後まで追ってみた。\n\n+0秒：約82億人が消える（2024年・国連）\n+48時間：電気とポンプが止まり、地下鉄は水びたしに\n+1年：道路は数か月でひび割れ、夜の街から明かりが消える\n+10年：街をイノシシが歩く。福島の立入禁止区域では、カメラに一番多く写った動物がイノシシだった\n+30年：森にオオカミが増える。チェルノブイリでは汚染のない保護区の7倍以上いた\n+100年：道路は陥没し、建物は崩れて森になる\n\nでも人間が出したCO2は、約20%が数千年も大気に残る。一部のプラスチックは数十万年消えない。\n\n結果：人間がいない地球は、自然には良い。でも人間が残した傷は100年後も残る。\n\n人間は地球にいていいと思う？ コメントで教えて。\n\n出典：国連 世界人口推計2024、Scientific American「An Earth Without People」（2007年）、ジョージア大学（2020年発表・CNN）、Deryabina et al. Current Biology（2015年）、IPCC 第4次評価報告書 FAQ 10.3',
    hashtags: ['もしもラボ', '地球', '雑学', '生態系', '環境'],
    endStats: [['消えた人', '約82億人', '2024年'], ['地下鉄が水びたし', '48時間', 'ニューヨーク'], ['チェルノブイリのオオカミ', '7倍以上', '保護区と比べて'], ['数千年残るCO2', '約20%', 'IPCC'], ['プラスチック', '数十万年', '一部は消えない']],
    sources: '出典：国連 世界人口推計2024、Scientific American（2007）、<br>ジョージア大学（2020）、Current Biology（2015）、IPCC',
  },
});
