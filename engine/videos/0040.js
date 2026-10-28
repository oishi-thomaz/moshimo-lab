import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, randPerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, sets } from '../scenes/room.js';
import { japan, ll, CITY, setMapEnv, makeRing, addPin, LAND_Y } from '../scenes/japan.js';
import { field, setFieldEnv, setFruit } from '../scenes/field.js';
import { makeParcel } from '../scenes/delivery.js';
import { stage, makeCrowd, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしもふるさと納税がなくなったら？（blueprint no 40）
// 数字（すべて一次資料で確認）：総務省 自治税務局市町村税課「ふるさと納税に関する現況調査結果（令和8年度実施）」令和8年7月31日
//   https://www.soumu.go.jp/main_content/001084951.pdf
//   令和7年度 受入額 1兆3,314億円・受入件数 5,963.0万件
//   募集に要した費用 6,382億円（受入額の47.9%）、うち返礼品の調達に係る費用 3,528億円（26.5%）
//   住民税控除額 9,524.4億円・控除適用者数 1,151.4万人（令和8年度課税＝令和7年中の寄附）
// 計算（画面に（単純計算）と表示）：
//   返礼品の調達費用 3,528億円 ÷ 控除適用者 1,151.4万人 ≒ 3.06万円 → 1人あたり 約3.1万円分
//   受入額 1兆3,314億円 − 募集費用 6,382億円 = 6,932億円（自治体の手元に残った分）

// ---------- home: table + gift box ----------
const HOME = new THREE.Group(); room.add(HOME);
// リビングのマグカップ（テーブルの上）はこの動画では消す（箱が消えたあとに赤い箱が残って見えるため）
sets.living.children.forEach(m => { if (Math.abs(m.position.x - 0.3) < 0.01 && Math.abs(m.position.y - 0.42) < 0.01) m.visible = false; });
const TBL = new THREE.Vector3(0.6, 0.36, -0.9);
const gift = new THREE.Group(); HOME.add(gift);
{
  const b = makeParcel(0.7, 0.32, 0.5); gift.add(b);
  const lid = box(0.7, 0.02, 0.5, mat('#c89a62')); lid.position.set(0, 0.33, -0.27); lid.rotation.x = -1.25; lid.geometry.translate(0, 0, -0.25); gift.add(lid);
  // contents: rice bag, fruit, wrapped meat
  const rice = box(0.24, 0.3, 0.14, mat('#f3efe2')); rice.position.set(-0.18, 0.35, 0.02); gift.add(rice);
  const band = box(0.245, 0.06, 0.145, mat('#3f8f6b')); band.position.set(-0.18, 0.4, 0.02); gift.add(band);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(i % 2 ? '#f29a3a' : '#e8822c')); f.position.set(0.08 + (i % 2) * 0.12, 0.34, -0.08 + Math.floor(i / 2) * 0.13); gift.add(f); }
  const meat = box(0.16, 0.05, 0.12, mat('#d0584f')); meat.position.set(0.24, 0.32, 0.12); gift.add(meat);
  const card = box(0.18, 0.005, 0.12, mat('#ffffff')); card.position.set(0.0, 0.33, 0.16); card.rotation.y = 0.3; gift.add(card);
}
gift.position.copy(TBL);
const giftSpark = makeSparkles(220, 0.07); room.add(giftSpark.points);
giftSpark.init([[TBL.x - 0.2, TBL.y + 0.3, TBL.z], [TBL.x + 0.2, TBL.y + 0.3, TBL.z], [TBL.x, TBL.y + 0.2, TBL.z + 0.1]], 0.3, 0.8);
const mom = makePerson({ skin: SKIN[0], hair: HAIR[2], shirt: '#c94f7c', pants: '#3b3f4a', long: true }); HOME.add(mom);
const kid = makePerson({ skin: SKIN[3], hair: HAIR[0], shirt: '#f2c14e', pants: '#2b3346', scale: 0.7 }); HOME.add(kid);
const dad = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#4fa3d1', pants: '#2b3346' }); HOME.add(dad);
const paper = box(0.21, 0.005, 0.3, mat('#f8f8f2')); HOME.add(paper);
function home(mode) {
  setRoom({ sets: ['living'] }); HOME.visible = true;
  if (mode === 'evening') setLight('evening', { ceil: 9, hemi: 1.0 }); else setLight('day', { ceil: 6, hemi: 1.15 });
  mom.visible = kid.visible = dad.visible = false; paper.visible = false; gift.visible = true; giftSpark.set(0);
}

// ---------- map: money arcs ----------
const RURAL = [[141.9, 42.95], [144.4, 43.6], [140.5, 40.6], [141.2, 39.0], [139.9, 38.2], [138.6, 36.9], [136.9, 36.2], [134.2, 35.3], [133.5, 33.6], [132.6, 34.6], [131.0, 31.7], [130.7, 32.9], [129.9, 33.3], [134.5, 34.1], [135.6, 33.9], [137.6, 35.4]];
const URBAN = [CITY.tokyo, CITY.osaka, CITY.nagoya, CITY.fukuoka, CITY.sapporo];
const coinG = new THREE.CylinderGeometry(0.75, 0.75, 0.22, 14); coinG.rotateX(Math.PI / 2);
const coinM = mat('#f2c14e', { emissive: 0x7a5a10, emissiveIntensity: 0.45 });
const ARCS = []; // {from, to, coins[]}
{
  const r = rng(40);
  RURAL.forEach((dst, i) => {
    const src = URBAN[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : (i % 2 ? 2 : 0)];
    const a = ll(...src, LAND_Y + 0.5), b = ll(...dst, LAND_Y + 0.5);
    const mid = a.clone().lerp(b, 0.5); mid.y += 6 + a.distanceTo(b) * 0.35;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.12, 4, false), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.55, depthWrite: false })); japan.add(line);
    const coins = []; for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(coinG, coinM); japan.add(c); coins.push(c); }
    ARCS.push({ curve, line, coins, ph: r() });
  });
}
const pins = RURAL.map(p => addPin(...p, '#7ff0c8'));
const cityPins = URBAN.slice(0, 3).map(p => addPin(...p, '#ffd166'));
const rings = cityPins.map(() => makeRing('#ffd166', 0.9));
// k: arcs visible amount 0..1 (fades), dir: 1 urban->rural, -1 back to the cities
function setArcs(t, k, dir = 1, speed = 0.35) {
  ARCS.forEach((A, i) => {
    A.line.visible = k > 0.01; A.line.material.opacity = 0.55 * k;
    A.coins.forEach((c, j) => {
      c.visible = k > 0.01; if (!c.visible) return;
      let u = (A.ph + j / 4 + t * speed) % 1; if (dir < 0) u = 1 - u;
      A.curve.getPoint(u, c.position); c.rotation.y = t * 2 + i; c.scale.setScalar(Math.max(0.01, k));
    });
  });
}
function mapPins(rural, urban) { pins.forEach(p => { p.visible = rural > 0.01; p.scale.setScalar(Math.max(0.01, rural)); }); cityPins.forEach(p => { p.visible = urban > 0.01; p.scale.setScalar(Math.max(0.01, urban)); }); rings.forEach(r => r.visible = false); }
const MAPCAM = (t, d) => { const u = ease(t / d); look(lerp(-8, -4, u), lerp(270, 250, u), lerp(100, 88, u), -6, 0, -18, 50); };

// ---------- stage: crowd with boxes ----------
const CROWD = makeCrowd(60, 7, { w: 13, d: 7, x: 0, z: -1 });
const cBoxes = CROWD.people.map((p, i) => { const b = makeParcel(0.42, 0.24, 0.32); b.position.set(p.position.x + 0.05, 0.3 + 0.95, p.position.z + 0.32); CROWD.g.add(b); b.userData.k = (i * 37 % 60) / 60; return b; });
const crowdSpark = makeSparkles(400, 0.12); stage.add(crowdSpark.points);
crowdSpark.init(CROWD.people.map(p => [p.position.x, 1.6, p.position.z - 1]), 0.4, 1.0);

// ---------- field: produce crates for gifts ----------
const FARM = new THREE.Group(); field.add(FARM);
const CR = new THREE.Vector3(2, 0, 12.5);
const crates = [];
{
  const r = rng(9);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
    const p = makeParcel(0.6, 0.4, 0.45); p.position.set(CR.x - 0.9 + i * 0.65, k * 0.41, CR.z - 0.5 + j * 0.5); p.userData.k = r(); FARM.add(p); crates.push(p);
  }
}
const farmer = makePerson({ skin: SKIN[2], hair: HAIR[4], shirt: '#5d8c3a', pants: '#5a4a3a' }); farmer.position.set(CR.x - 2.2, 0, CR.z + 0.4); farmer.rotation.y = 1.2; FARM.add(farmer);
const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 12), mat('#e8d9a8')); hat.position.y = 2.02; farmer.add(hat);
const truck = new THREE.Group(); FARM.add(truck);
{ const b = box(3.4, 0.9, 1.7, mat('#e9e6df')); b.position.set(0, 0.85, 0); truck.add(b); const c = box(1.2, 1.1, 1.6, mat('#e9e6df')); c.position.set(1.9, 1.15, 0); truck.add(c); const w = box(0.05, 0.5, 1.3, mat('#3c4a5c')); w.position.set(2.51, 1.35, 0); truck.add(w); for (const x of [-1.1, 1.6]) for (const s of [-1, 1]) { const wh = box(0.65, 0.65, 0.22, mat('#1b1d22')); wh.position.set(x, 0.33, s * 0.8); truck.add(wh); } }
truck.position.set(CR.x + 0.2, 0, CR.z - 3.0);
function setCrates(k) { crates.forEach(c => c.visible = c.userData.k < k); }

function hideAll() { setArcs(0, 0); }

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
const TV = 0.5; // v2：0.5秒で消える（冒頭で待たせない）
const oku = v => (v >= 10000 ? Math.floor(v / 10000) + '兆' + comma(v % 10000) : comma(v)) + '億円';
const HOOK = (t, d = 2.5) => { const u = ease(t / d); look(lerp(1.9, 1.7, u), lerp(1.75, 1.65, u), lerp(1.3, 1.0, u), TBL.x, TBL.y + 0.15, TBL.z, 50); };

const SUBS = [
  [2.6, 6.0, 'いつもの冬。<br>お礼の品が届いた。'],
  [6.2, 10.1, '返礼品は消えた。<br>でも、払う税金は…？'],
  [10.1, 14.0, '止まった寄付は、<br>年1兆3,314億円。'],
  [14.2, 18.1, '使っていた人は、<br>1,151万人。'],
  [18.1, 22.0, '寄付は年5,963万件。<br>それがゼロに。'],
  [22.2, 26.1, '困るのは地方。農家や<br>工場から注文が消える。'],
  [26.1, 30.0, 'お礼の品の仕入れは、<br>年3,528億円。'],
  [30.2, 34.6, '経費を引いて地方に残った<br>6,932億円も消える。'],
  [34.6, 39.0, '住んでいる町には、<br>住民税9,524億円が戻る。'],
  [39.2, 43.6, '払う税金はほぼ同じ。<br>お礼の品だけ消える。'],
  [43.6, 47.8, '1人あたり、<br>年およそ3.1万円分。'],
  [48.1, 53.8, '結果：1人あたり年3万円分の<br>お礼の品が消えた。'],
  [53.9, 56.1, '寄付の約半分は、経費だった。'],
  [56.2, 59.4, 'ふるさと納税、<br>続けてほしい？'],
];

function shot0(t) { // hook: countdown, gift box vanishes at 1.4
  home('day'); gift.visible = t < TV;
  giftSpark.set(t >= TV ? (t - TV) / 0.9 : 0);
  el.flash.style.opacity = t >= TV ? 0.5 * Math.max(0, 1 - (t - TV) / 0.3) : 0;
  lift(50); HOOK(t); // v2：0秒目サムネ。箱の中身がタイトルのバッジにかからないよう下げる
  setHud('ふるさと納税がなくなるまで', cd(Math.max(0, TV - t)), 1, { mono: true, color: t < TV ? '#fff' : '#ff6b6b' });
  return room;
}
function shot1(t) { // everyday: family opens the box
  home('day');
  mom.visible = kid.visible = true;
  mom.position.set(TBL.x - 0.95, 0, TBL.z + 0.25); mom.rotation.y = 1.3; mom.userData.arms[1].rotation.x = -0.9 - Math.sin(t * 3) * 0.1; mom.userData.arms[0].rotation.x = -0.6;
  kid.position.set(TBL.x + 0.95, 0, TBL.z + 0.05); kid.rotation.y = -1.5; kid.userData.arms[0].rotation.x = -1.2 - Math.sin(t * 5) * 0.25;
  lift(140);
  const u = ease(t / 3.5);
  look(lerp(0.9, 0.7, u), lerp(2.5, 2.4, u), lerp(3.6, 3.3, u), TBL.x, 0.9, TBL.z, 50);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return room;
}
function shot2(t) { // +1日 map: money arcs stop
  setMapEnv('day'); mapPins(1, 1);
  setArcs(t + 2, 1 - ease(clamp((t - 1.0) / 2.0)));
  lift(240); MAPCAM(t, 8);
  hudTime('+1日');
  setTop('ふるさと納税の寄付（2025年度）', oku(countUp(t, 13314, 4.3, 1.4)), fade(t, 4.25, 8, 0.25), '#ffd166');
  return japan;
}
function shot3(t) { // +1週間 stage crowd: boxes vanish
  setStageColor('#14213a'); CROWD.g.visible = true;
  const tv = 1.0;
  cBoxes.forEach(b => b.visible = t < tv);
  crowdSpark.set(t >= tv ? (t - tv) / 1.4 : 0);
  CROWD.people.forEach((p, i) => { p.userData.arms[0].rotation.x = t < tv ? -1.2 : lerp(-1.2, 0, clamp((t - tv - 0.5) / 0.6)); p.userData.arms[1].rotation.x = p.userData.arms[0].rotation.x; p.userData.head.rotation.y = t > tv + 1 ? Math.sin(t * 2 + i) * 0.4 : 0; });
  lift(260);
  const u = ease(t / 8);
  look(lerp(-1.5, 1.5, u), lerp(9, 8.5, u), lerp(13.5, 12.5, u), 0, 1.0, -1.5, 50);
  hudTime('+1週間');
  setTop('控除を受けた人（2025年の寄付）', comma(countUp(t, 1151, 0.3, 1.4)) + '万人', fade(t, 0.15, 8, 0.25));
  return stage;
}
function shot4(t) { // +1か月 farm: crates disappear, farmer idle
  setFieldEnv('day'); setFruit(1); FARM.visible = true;
  setCrates(1 - ease(clamp((t - 0.8) / 4)));
  farmer.userData.head.rotation.y = Math.sin(t * 0.9) * 0.5;
  lift(230);
  const u = ease(t / 8);
  look(CR.x + lerp(-4.2, -3.0, u), lerp(4.2, 3.8, u), CR.z + lerp(8.0, 7.0, u), CR.x - 0.3, 0.9, CR.z - 1.2, 50);
  hudTime('+1か月');
  setTop('返礼品の調達費用（2025年度）', comma(countUp(t, 3528, 4.3, 1.3)) + '億円', fade(t, 4.25, 8, 0.25), '#ff8a7a');
  return field;
}
function shot5(t) { // +半年 map: rural pins fade, money back to cities
  setMapEnv('day');
  const sw = 4.4; // 34.6 - 30.2
  mapPins(t < sw ? 1 - 0.6 * ease(clamp(t / 2)) : 0.4, 1);
  setArcs(t, t < sw ? 0 : ease(clamp((t - sw) / 0.8)), -1, 0.4);
  rings.forEach((r, i) => { r.visible = t > sw; const u = ((t - sw) * 0.6 + i * 0.33) % 1; const c = ll(...URBAN[i], LAND_Y + 0.2); r.position.set(c.x, LAND_Y + 0.2, c.z); r.scale.setScalar(1 + u * 9); r.material.opacity = 0.9 * (1 - u); });
  lift(240); MAPCAM(t + 2, 11);
  hudTime('+半年');
  if (t < sw) setTop('寄付−募集の経費（2025年度・単純計算）', comma(countUp(t, 6932, 0.3, 1.3)) + '億円', fade(t, 0.15, sw, 0.25), '#ff8a7a');
  else setTop('住民税の控除額（2026年度課税）', comma(countUp(t - sw, 9524, 0.3, 1.3)) + '億円', fade(t, sw + 0.1, 9, 0.25), '#ffd166');
  return japan;
}
function shot6(t) { // +1年 home: empty table, tax paper
  home('evening'); gift.visible = false;
  dad.visible = true; dad.position.set(TBL.x - 0.9, 0, TBL.z + 0.3); dad.rotation.y = 1.3; dad.userData.arms[1].rotation.x = -0.7; dad.userData.head.rotation.x = 0.25;
  paper.visible = true; paper.position.set(TBL.x - 0.15, TBL.y + 0.005, TBL.z + 0.05); paper.rotation.y = 0.3;
  lift(140);
  const u = ease(t / 9);
  look(lerp(2.8, 2.5, u), 2.5, lerp(2.4, 2.1, u), TBL.x - 0.45, 0.7, TBL.z, 50);
  hudTime('+1年');
  setTop('返礼品÷控除を受けた人（単純計算）', '約' + (countUp(t, 31, 4.6, 1.2) / 10).toFixed(1) + '万円', fade(t, 4.45, 9, 0.25), '#ff8a7a');
  return room;
}
function shot7(t) { // result: evening, empty table, family
  home('evening'); gift.visible = false;
  dad.visible = mom.visible = kid.visible = true;
  dad.position.set(TBL.x - 0.95, 0, TBL.z + 0.3); dad.rotation.y = 1.3; dad.userData.arms[1].rotation.x = 0; dad.userData.head.rotation.x = 0;
  mom.position.set(TBL.x + 1.0, 0, TBL.z + 0.2); mom.rotation.y = -1.4; mom.userData.arms[0].rotation.x = 0; mom.userData.arms[1].rotation.x = 0;
  kid.position.set(TBL.x + 0.1, 0, TBL.z - 0.8); kid.rotation.y = 0; kid.userData.arms[0].rotation.x = 0;
  const u = ease(t / 7.5);
  lift(140);
  look(lerp(1.3, 1.6, u), lerp(2.5, 2.9, u), lerp(4.0, 4.8, u), TBL.x, 0.7, TBL.z - 0.2, 50);
  setTop('1人あたりの返礼品（2025年度・単純計算）', '約' + (countUp(t, 31, 0.3, 1.0) / 10).toFixed(1) + '万円', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return room;
}
function shot8(t) { // loop: hook framing, table already empty
  home('day'); gift.visible = false;
  lift(50); HOOK(t + 0.4, 4.4);
  setHud('ふるさと納税がなくなるまで', cd(TV), 1, { mono: true });
  return room;
}
function scnOff(f) { HOME.visible = [shot0, shot1, shot6, shot7, shot8].includes(f); CROWD.g.visible = f === shot3; FARM.visible = f === shot4; if (f !== shot3) crowdSpark.set(0); if (f !== shot2 && f !== shot5) setArcs(0, 0); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 65, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { scnOff(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 65,
  cut: [[2.5, 6.0]], // v2：家族で箱を開ける いつもの冬（元の2.5〜6秒）を抜いて、消えた直後から本題へ
  meta: {
    id: '0040',
    v2: true,
    hookLine: 'ふるさと納税が、この世から消えた。',
    series: 'お財布のもしも',
    title: 'ふるさと納税がなくなったら？',
    titleHtml: 'ふるさと納税が<br>なくなったら？',
    mood: 'emotional', seed: 40, hits: [0.5, 48.1], risers: [6.0], impacts: [10.6, 26.6, 44.0, 48.4],
    sfx: [[0.5, 'poof'], [15.0, 'poof'], [22.8, 'whoosh']],
    narr: { '1兆3,314億円': 'いっちょうさんぜんさんびゃくじゅうよんおくえん', '1,151万人': 'せんひゃくごじゅういちまんにん', '5,963万件': 'ごせんきゅうひゃくろくじゅうさんまんけん', '3.1万円分': 'さんてんいちまんえんぶん', '3万円分': 'さんまんえんぶん' },
    ask: 'ふるさと納税、続けてほしい？',
    caption: 'もしもふるさと納税が明日なくなったら？\n2025年度の寄付は1兆3,314億円、5,963万件。2025年の寄付で住民税の控除を受けた人は1,151万人。\nなくなると、地方の農家や工場へのお礼の品の注文（年3,528億円）が消え、経費を引いて地方に残っていた6,932億円（単純計算）も消える。\nその分、住んでいる町には住民税9,524億円が戻る。払う税金はほぼ同じで、お礼の品だけがなくなる。\n返礼品の仕入れ額を控除を受けた人数で割ると、1人あたり年約3.1万円分（単純計算）。\nちなみに寄付の47.9%は、返礼品や送料・仲介サイトなどの募集の経費だった。\n\nふるさと納税、続けてほしい？ コメントで教えて。\n\n出典：総務省「ふるさと納税に関する現況調査結果（令和8年度実施）」（2026年7月31日）',
    hashtags: ['もしもラボ', 'ふるさと納税', '返礼品', '節税', '雑学'],
    endStats: [['ふるさと納税の寄付', '1兆3,314億円', '2025年度'], ['控除を受けた人', '1,151万人', '2025年の寄付'], ['返礼品の調達費用', '3,528億円', '2025年度'], ['募集にかかった経費', '寄付の47.9%', '2025年度'], ['1人あたりの返礼品', '約3.1万円', '単純計算']],
    sources: '出典：総務省「ふるさと納税に関する現況調査結果<br>（令和8年度実施）」（2026年7月31日）',
  },
});
