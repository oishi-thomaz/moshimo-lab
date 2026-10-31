import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, comma } from '../lib.js';
import { crowdfield, world, setScale, setCrowd, setPeopleN, setCrowdEnv, crowdSky } from '../scenes/crowdfield.js';
import { stage, makeBar, makeLabel } from '../scenes/stage.js';
import { cam, lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも全人類が1か所に集まって、同時にオナラをしたら？（v2・笑える回）
// 数字：
//  ・世界人口 82億3,200万人（2025年・UNFPA 世界人口白書2025）
//  ・立つ広さ：1m²に2人の単純計算で 4,116km²（0532 と同じ条件。山梨県 4,465km²）。一辺 約64.2km、中心から端まで 約32.1km
//  ・オナラ1回の量：中央値 約90mL（33〜125mL）、1日の回数 中央値8回（Tomlin ほか, Gut 1991）
//  ・82.32億人×90mL＝約74万m³（740,880m³）。東京ドームの容積 約124万m³（東京ドーム公式）→ 約0.6杯
//  ・群れの上に広げた厚さ：740,880m³ ÷ 41.16億m² ≒ 0.18mm
//  ・成分：水素が中央値で約半分（1日705mLのうち361mL＝51%。Tomlin 1991）。水素が燃える濃さは空気中4〜75%（EICネット）
//  ・群れの上2mの空気に混ざると：740,880 ÷ (41.16億m²×2m) ≒ 0.009% → 水素は約0.0046%（燃える下限4%の約870分の1）
//  ・においの元 硫化水素：オナラの中に平均1.06µmol/L≒約26ppm（Suarez ほか, Gut 1998）→ 混ざると約0.0023ppm。
//    硫化水素だと分かる濃さ 0.006ppm（宮城県の資料・認知閾値）→ その半分以下
//  ・音の速さ 約340m/秒 → 中心から端まで 約94秒（約1分半）、端から反対の端まで 約189秒（約3分）
// 2026/10/31 ゆうとの依頼：笑える内容に。冒頭は必ずタイトルを読む

const GREEN = '#9be86a', GOLD = '#ffd27a', BLUE = '#7fd4ff', PINK = '#ff9ec7';

// ---------- オナラの雲（近くの人の腰の高さから、ふわっと） ----------
const NP = 900; const SPC = Math.SQRT1_2;
const puffM = new THREE.MeshLambertMaterial({ color: '#a8e070', transparent: true, opacity: 0.55, depthWrite: false });
const puffs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 10, 8), puffM, NP); world.add(puffs);
const PP = []; { const r = rng(11); for (let i = 0; i < NP; i++) { const a = i % 30, b = Math.floor(i / 30); PP.push([(a - 14.5) * SPC + (r() - .5) * .2, (b - 14.5) * SPC + (r() - .5) * .2, r()]); } }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function setPuffs(k, t = 0) { // k: 出てからの時間（秒）。0 なら出ていない
  puffs.visible = k > 0;
  for (let i = 0; i < NP; i++) {
    const [x, z, r] = PP[i]; const u = clamp((k - r * 0.25) / 1.6);
    const s = u <= 0 ? 0.0001 : 0.45 + easeOut(u) * 0.6;
    _p.set(x + Math.sin(t + r * 9) * 0.1 * u, 0.55 + easeOut(u) * 0.9, z - 0.25 - easeOut(u) * 0.3);
    _m.compose(_p, _q, _s.set(s, s * 0.8, s)); puffs.setMatrixAt(i, _m);
  }
  puffs.instanceMatrix.needsUpdate = true; puffM.opacity = 0.5 * (1 - clamp((k - 2.5) / 3)) + 0.12;
}
const buu = textSprite('ブッ', { w: 512, h: 256, size: 200, color: '#b9f27a', stroke: 22, strokeColor: '#1d3a12' }); world.add(buu);
// ---------- 音の輪（中心から広がる） ----------
const ringM = new THREE.MeshBasicMaterial({ color: '#fff2a8', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
const ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 96), ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = 3; world.add(ring);
const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 96), ringM.clone()); ring2.rotation.x = -Math.PI / 2; ring2.position.y = 3; world.add(ring2);
// ---------- うすいガスの層（群れの上） ----------
const layerM = new THREE.MeshBasicMaterial({ color: '#b6f07a', transparent: true, opacity: 0, depthWrite: false });
const layer = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), layerM); layer.rotation.x = -Math.PI / 2; layer.position.y = 2.2; world.add(layer);
const SIDE = Math.sqrt(4116e6); // m
const bigLab = textSprite('', { w: 640, h: 160, size: 84, color: '#fff', bg: 'rgba(10,14,22,.78)' }); world.add(bigLab);
function lab(s, x, y, z, sx, op = 1) { bigLab.userData.set(s); bigLab.position.set(x, y, z); bigLab.scale.set(sx, sx / 4, 1); bigLab.visible = op > 0.01; bigLab.material.opacity = op; }

// ---------- ステージ：東京ドームとガス、濃さのバー ----------
const DOME = new THREE.Group(); stage.add(DOME);
const domeM = new THREE.MeshLambertMaterial({ color: '#e9eef5', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), domeM); dome.scale.set(1, 0.55, 1); dome.position.y = 0.3; DOME.add(dome);
const ringBase = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.3, 40), mat('#c9ced8')); ringBase.position.y = 0.15; DOME.add(ringBase);
const gasM = new THREE.MeshLambertMaterial({ color: '#a8e070', transparent: true, opacity: 0.8 });
const gas = new THREE.Mesh(new THREE.SphereGeometry(2.38, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), gasM); gas.position.y = 0.3; DOME.add(gas);
const domeLab = makeLabel('東京ドーム 約0.6杯', { sx: 4.4, size: 72, color: GREEN, stroke: 8, w: 768, h: 128 }); domeLab.position.set(0, 2.6, 0); DOME.add(domeLab);
const BARS = new THREE.Group(); stage.add(BARS);
const bNow = makeBar({ color: '#9be86a', label: '82億人分', x: -1.3, w: 1.6, d: 1.4 }); const bLine = makeBar({ color: '#ff8a7a', label: '臭いとわかる', x: 1.3, w: 1.6, d: 1.4 });
for (const b of [bNow, bLine]) { stage.remove(b.g); BARS.add(b.g); }
const BUU8 = new THREE.Group(); stage.add(BUU8);
const eight = makeLabel('1日 約8回', { sx: 6, size: 110, color: PINK, stroke: 10, w: 768, h: 192 }); eight.position.set(0, 2.2, 0); BUU8.add(eight);
function stageMode(m) { DOME.visible = m === 'dome'; BARS.visible = m === 'bars'; BUU8.visible = m === 'eight'; }

function crowd(scale, area, n) { setScale(scale); setCrowd(area); setPeopleN(n); setCrowdEnv('day'); crowdfield.fog.near = 400; crowdfield.fog.far = 3800; }
function off() { setPuffs(0); buu.visible = false; ring.visible = ring2.visible = false; layerM.opacity = 0; layer.visible = false; bigLab.visible = false; el.flash.style.opacity = 0; }

const SUBS = [
  [2.6, 6.1, '82億人が、山梨県くらいの<br>広さにぎゅうぎゅう。'],
  [6.2, 10.1, 'まず、出たガスの量。<br>1回で約90mL。'],
  [10.2, 14.1, '82億人分で、<br>約74万立方メートル。'],
  [14.2, 18.1, '東京ドーム、<br>約0.6杯ぶん。'],
  [18.2, 22.1, 'でも群れの上に広げると、<br>厚さたった0.2ミリ。'],
  [22.2, 26.1, '本当にヤバいのは、<br>ここから。'],
  [26.2, 30.1, '音は1秒に340m。<br>群れの端から端まで64km。'],
  [30.2, 34.1, '真ん中の人には、<br>ブッが1分半も届き続ける。'],
  [34.2, 38.1, '端の人のブッが、反対の端に<br>届くのは約3分後。'],
  [38.2, 42.1, 'オナラの約半分は水素。<br>でも燃える濃さの870分の1。'],
  [42.2, 47.8, 'においの元の硫化水素も、<br>気づける濃さの半分以下。'],
  [48.0, 54.6, '結果：音は3分鳴りやまないのに、<br>においはギリギリわからない。'],
  [54.7, 57.4, '実は人は、1日に<br>約8回オナラをしている。'],
  [57.5, 61.3, '人前のオナラ、<br>許せる？許せない？'],
];

const cd = (left) => `0:${String(Math.floor(Math.max(0, left))).padStart(2, '0')}.${String(Math.floor((Math.max(0, left) % 1) * 100)).padStart(2, '0')}`;
const TP = 0.5;
const hookCam = (t) => { const u = ease(clamp(t / 2.6)); look(lerp(7, 7.6, u), lerp(8.5, 9.2, u), lerp(15, 16, u), 0, 0.3, 0, 50); crowdSky.position.copy(cam.position); };
function shot0(t) { // 0秒＝サムネ：ぎゅうぎゅうの人。0.5秒で全員ブッ
  off(); crowd(1, 4116e6, 70); lift(200);
  const k = t - TP; setPuffs(k > 0 ? k : 0, t);
  buu.visible = k > 0; buu.position.set(3.2, 1.6 + easeOut(clamp(k / 0.4)) * 0.4, 7.5); const bs = 4.6 * easeBack(clamp(k / 0.35)); buu.scale.set(bs, bs / 2, 1);
  el.flash.style.opacity = k > 0 ? 0.35 * Math.max(0, 1 - k / 0.25) : 0;
  hookCam(t); if (k > 0 && k < 0.6) { cam.position.x += Math.sin(t * 90) * 0.06; cam.position.y += Math.cos(t * 70) * 0.05; }
  setHud('全員でオナラまで', cd(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#9be86a' });
  return crowdfield;
}
function shot1(t) { // 引いて：82億人の四角
  off(); crowd(0.01, 4116e6, 0); lift(160);
  const u = ease(clamp(t / 3.6)); const h = lerp(250, 900, u);
  look(0, h, h * 0.9, 0, 0, 0, 50); crowdSky.position.copy(cam.position);
  setHud('集まった人', '82億3,200万人', 1, { color: GOLD });
  setTop('82億人が立つ広さ（1m²に2人）', comma(countUp(t, 4116)) + 'km²', fade(t, 0.15, 3.5, 0.25), GOLD);
  return crowdfield;
}
function shot2(t) { // 1回90mL → 74万m³
  off(); crowd(1, 4116e6, 70); lift(200); setPuffs(1.0 + t * 0.15, t);
  const u = ease(clamp(t / 8)); look(lerp(4.5, 5.5, u), lerp(4.5, 6, u), lerp(8, 10, u), 0, 0.6, 0, 50); crowdSky.position.copy(cam.position);
  setHud('', '', 0);
  if (t < 4) setTop('オナラ1回のガス（中央値）', '約' + countUp(t, 90) + 'mL', fade(t, 0.15, 3.9, 0.25), GREEN);
  else setTop('82億人分', '約' + countUp(t - 4, 74) + '万m³', fade(t, 4.0, 8.0, 0.25), GREEN);
  return crowdfield;
}
function shot3(t) { // 東京ドーム 0.6杯
  lift(240); stageMode('dome');
  const k = easeOut(clamp((t - 0.3) / 2.0)) * 0.6; gas.scale.set(1, Math.max(0.001, 0.55 * k), 1); domeLab.visible = t > 2.2;
  const u = ease(clamp(t / 4)); look(lerp(0, 0.5, u), lerp(4.6, 4.2, u), lerp(9.5, 8.6, u), 0, 1.2, 0, 50);
  setTop('東京ドームの容積（約124万m³）', '約0.6杯', fade(t, 0.15, 3.9, 0.25), GREEN);
  return stage;
}
function shot4(t) { // 広げると厚さ0.18mm
  off(); crowd(0.01, 4116e6, 0); lift(160); layer.visible = true; layerM.opacity = 0.35 * clamp(t / 0.8); layer.scale.set(SIDE, SIDE, 1);
  const u = ease(clamp(t / 4)); look(0, lerp(900, 600, u), lerp(800, 540, u), 0, 0, 0, 50); crowdSky.position.copy(cam.position);
  setTop('82億人の上に広げると、厚さ', '約0.18mm', fade(t, 0.15, 3.9, 0.25), GREEN);
  return crowdfield;
}
function shot5(t) { // ここから：音
  off(); crowd(1, 4116e6, 70); lift(200);
  ring.visible = true; const r = 0.5 + t * 6; ring.scale.set(r, r, 1); ringM.opacity = 0.9 * (1 - clamp(t / 4));
  const u = ease(clamp(t / 4)); look(lerp(6, 9, u), lerp(3, 6, u), lerp(14, 20, u), 0, 1, 0, 52); crowdSky.position.copy(cam.position);
  setTop('本当にヤバいのは', '音', fade(t, 0.15, 3.9, 0.25), GOLD);
  return crowdfield;
}
function shot6(t) { // 音の輪が64kmを渡る（12秒で189秒ぶんを早送り）
  off(); crowd(0.01, 4116e6, 0); lift(160);
  const sec = clamp(t / 12) * 189; // 実際の秒
  ring.visible = true; const R = Math.min(340 * sec, SIDE * 0.72); ring.scale.set(R, R, 1); ringM.opacity = 0.95;
  const u = ease(clamp(t / 12)); look(0, lerp(800, 900, u), lerp(650, 740, u), 0, 0, 0, 50); crowdSky.position.copy(cam.position);
  setHud('ブッからの時間', `${Math.floor(sec / 60)}分${String(Math.floor(sec % 60)).padStart(2, '0')}秒`, 1, { mono: true, color: GOLD });
  if (t < 4) setTop('音の速さ', '1秒に約340m', fade(t, 0.15, 3.9, 0.25), GOLD);
  else if (t < 8) setTop('真ん中から端まで32km', '約1分半', fade(t, 4.0, 7.9, 0.25), GOLD);
  else setTop('端から反対の端まで64km', '約3分', fade(t, 8.0, 12.0, 0.25), GOLD);
  return crowdfield;
}
function shot7(t) { // 水素：燃える濃さの870分の1 → 硫化水素：0.0023 vs 0.006
  lift(240);
  if (t < 4) {
    off(); stageMode('none'); crowd(1, 4116e6, 70); setPuffs(3, t); lift(200);
    look(7, 8.5, 15, 0, 0.3, 0, 50); crowdSky.position.copy(cam.position);
    setTop('混ざった水素の濃さ（燃えるのは4%から）', '約0.0046%', fade(t, 0.15, 3.9, 0.25), BLUE);
    return crowdfield;
  }
  stageMode('bars'); const H = 3.6 / 0.006, k = ease(clamp((t - 4.3) / 1.2));
  bNow.setH(0.0023 * H * k, '0.0023ppm'); bLine.setH(0.006 * H * k, '0.006ppm');
  look(0, 3.4, 13, 0, 2.0, 0, 50);
  setTop('においの元・硫化水素の濃さ', '半分以下', fade(t, 4.0, 9.6, 0.25), PINK);
  return stage;
}
function shot8(t) { // 結果
  off(); crowd(0.01, 4116e6, 0); lift(160); ring.visible = ring2.visible = true;
  const r1 = (t * 900) % (SIDE * 0.7), r2 = (t * 900 + SIDE * 0.35) % (SIDE * 0.7); ring.scale.set(r1, r1, 1); ring2.scale.set(r2, r2, 1); ringM.opacity = 0.8; ring2.material.opacity = 0.8;
  const u = ease(clamp(t / 6.6)); look(lerp(-120, 120, u), 850, 760, 0, 0, 0, 50); crowdSky.position.copy(cam.position);
  if (t < 3.3) setTop('音', '約3分 鳴りやまない', fade(t, 0.15, 3.3, 0.25), GOLD);
  else setTop('におい', 'ギリギリわからない', fade(t, 3.3, 6.6, 0.25), GREEN);
  return crowdfield;
}
function shot9(t) { // 実は1日8回
  lift(240); stageMode('eight'); eight.position.y = 2.2 + Math.sin(t * 6) * 0.05;
  look(0, 2.6, 9, 0, 2.0, 0, 50);
  setTop('1日のオナラの回数（中央値）', '約8回', fade(t, 0.15, 2.7, 0.25), PINK);
  return stage;
}
function shot10(t) { // ループ：冒頭と同じ。カウントダウンは 0:00.50
  off(); crowd(1, 4116e6, 70); lift(200); hookCam(0);
  setHud('全員でオナラまで', cd(TP), 1, { mono: true });
  return crowdfield;
}

const shots = [
  { a: 0, b: 2.6, f: shot0 }, { a: 2.6, b: 6.2, f: shot1 }, { a: 6.2, b: 14.2, f: shot2 }, { a: 14.2, b: 18.2, f: shot3 },
  { a: 18.2, b: 22.2, f: shot4 }, { a: 22.2, b: 26.2, f: shot5 }, { a: 26.2, b: 38.2, f: shot6 }, { a: 38.2, b: 47.9, f: shot7 },
  { a: 47.9, b: 54.6, f: shot8 }, { a: 54.6, b: 57.4, f: shot9 }, { a: 57.4, b: 61.5, f: shot10 }, { a: 61.5, b: 65.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.5, camera: cam,
  meta: {
    id: '0622',
    v2: true,
    hookLine: '82億人が、同時にブッ。',
    series: '全人類が集まったら',
    hookType: 'H5',
    cat: '体・健康',
    title: '全人類が同時にオナラしたら？',
    titleHtml: '全人類が同時に<br>オナラしたら？',
    mood: 'tension', seed: 622, hits: [0.5, 48.0], risers: [22.2], impacts: [6.2, 14.2, 26.2, 34.2, 38.2, 48.0],
    sfx: [[0.5, 'poof'], [14.4, 'bubble'], [22.4, 'whoosh'], [42.4, 'buzz'], [54.8, 'poof']],
    narr: { '82億人': 'はちじゅうにおくにん', '90mL': '90ミリリットル', '74万': 'ななじゅうよんまん', '0.6杯': 'れいてんろくはい', '0.2ミリ': 'れいてんにミリ', '340m': 'さんびゃくよんじゅうメートル', '64km': 'ろくじゅうよんキロ', '870分の1': 'はっぴゃくななじゅうぶんのいち', 'ブッ': 'ぶっ', '約8回': 'やくはっかい' },
    ask: '人前のオナラ、許せる？許せない？',
    caption: 'もしも全人類82億人が1か所に集まって、同時にオナラをしたら？\n\nオナラ1回は約90mL。82億人分で約74万m³、東京ドーム約0.6杯ぶん。でも群れの上に広げると厚さたった0.2ミリ。\n本当にヤバいのは音。1秒に340mしか進まないから、真ん中の人には1分半もブッが届き続け、端から反対の端まで届くのは約3分後。\nオナラの約半分は水素だけど、混ざると燃える濃さの870分の1。においの元の硫化水素も、気づける濃さの半分以下。\n\n結果：音は3分鳴りやまないのに、においはギリギリわからない。\n実は人は1日に約8回オナラをしている。\n\n人前のオナラ、許せる？許せない？ コメントで教えて。\n\n※1m²に2人で立ち、ガスは群れの上2mの空気に均一に混ざるとした単純計算\n出典：UNFPA 世界人口白書2025、Tomlin ほか Gut 1991、Suarez ほか Gut 1998、東京ドーム公式、EICネット、宮城県',
    hashtags: ['もしもラボ', 'オナラ', '全人類', '雑学', '科学'],
    endStats: [['オナラ1回（中央値）', '約90mL', 'Gut 1991'], ['82億人分', '約74万m³', '東京ドーム約0.6杯'], ['音が端から端まで', '約3分', '64km÷340m/秒'], ['1日の回数（中央値）', '約8回', 'Gut 1991']],
    sources: '出典：UNFPA、Tomlin ほか（Gut 1991）、Suarez ほか（Gut 1998）、<br>東京ドーム、EICネット、宮城県',
  },
});
