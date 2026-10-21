import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight } from '../scenes/room.js';
import { field, setFieldEnv, setFlowers, setFruit } from '../scenes/field.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { makeSpider, makeWeb, makeSwarm } from '../scenes/spider.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界からクモが消えたら？（blueprint no 275）
// 数字（すべて一次資料で確認）：
//  ・世界のクモが1年に食べる虫などの獲物 4億〜8億トン（生重量の推計）、そのうち森と草地のクモが95%以上、
//    畑（一年生作物）のクモは2%未満。人類が1年に食べる肉と魚は約4億トン（FAOの数字として引用）
//    （Nyffeler & Birkhofer, The Science of Nature 2017, doi:10.1007/s00114-017-1440-1／バーゼル大学プレスリリース 2017年3月14日）
//  ・世界のクモ 53,689種（World Spider Catalog Archive Version 26, 2026年2月2日）
//  ・世界の作物の約40%が病害虫で失われている（FAO, 2021年6月2日 国連ニュース）
//  ・世界人口 約82億人（国連 World Population Prospects 2024）
//  ・1人あたり：4億トン÷82億人＝約49kg、8億トン÷82億人＝約98kg（単純計算）

// ---------- living-room corner: web + spider ----------
const WEB_POS = new THREE.Vector3(-3.52, 2.83, -3.02);
const CORNER = new THREE.Group(); room.add(CORNER);
const web = makeWeb({ r: 0.5, spokes: 15, rings: 10, w: 0.006 });
web.position.copy(WEB_POS); web.rotation.set(-0.12, Math.PI / 4, 0, 'YXZ'); CORNER.add(web);
const spider = makeSpider(); spider.rotation.x = Math.PI / 2; spider.position.set(0, 0.02, 0.03); spider.scale.setScalar(0.85); web.add(spider);
// wrapped prey on the web
const preyM = mat('#e9e6dc');
const prey = [[0.22, -0.18], [-0.28, 0.12]].map(([x, y]) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), preyM); p.scale.set(1, 1.6, 1); p.position.set(x, y, 0.01); web.add(p); return p; });
const roomSwarm = makeSwarm(220, 31, { x0: -3.4, x1: 3.0, y0: 0.8, y1: 2.9, z0: -3.1, z1: 0.2, size: 0.02 });
room.add(roomSwarm.mesh);
const cornerSwarm = makeSwarm(40, 77, { x0: -3.8, x1: -3.0, y0: 2.3, y1: 3.1, z0: -3.3, z1: -2.6, size: 0.016 });
room.add(cornerSwarm.mesh);
const spark = makeSparkles(140, 0.05); room.add(spark.points);
const resident = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#5b7fb3', pants: '#3b3f4a', scale: 1 });
resident.position.set(-0.6, 0, -1.6); resident.rotation.y = 0.5; room.add(resident);
function living(mode = 'day') {
  setRoom({ sets: ['living'] });
  setLight(mode, mode === 'evening' ? { ceil: 10, hemi: 0.95 } : {});
}
function cornerOff() { roomSwarm.set(0, 0); cornerSwarm.set(0, 0); spark.set(0); resident.visible = false; }

// ---------- meadow / farm ----------
const MEADOW = new THREE.Group(); field.add(MEADOW);
const meadowWebs = [[-1.2, 0.9, 3.2], [1.4, 0.8, 2.4], [-3.0, 0.75, 1.0], [2.6, 0.85, 0.2]].map(([x, y, z], i) => {
  const w = makeWeb({ r: 0.38, spokes: 12, rings: 7, w: 0.008 }); w.position.set(x, y, z); w.rotation.y = 0.3 * i - 0.4; MEADOW.add(w);
  const s = makeSpider({ color: i % 2 ? '#c99a2a' : '#3a2c22' }); s.rotation.x = Math.PI / 2; s.position.z = 0.03; s.scale.setScalar(0.7); w.add(s); w.userData.sp = s;
  // stakes (grass stems) holding the web
  for (const sx of [-0.45, 0.45]) { const st = box(0.03, 1.2, 0.03, mat('#5f8f3a')); st.position.set(sx, -0.2, 0); w.add(st); }
  return w;
});
const meadowSwarm = makeSwarm(500, 12, { x0: -6, x1: 6, y0: 0.5, y1: 3.0, z0: -4, z1: 3.5, size: 0.028, color: '#2a2a22' });
MEADOW.add(meadowSwarm.mesh);
const meadowSpark = makeSparkles(260, 0.1); MEADOW.add(meadowSpark.points);
const farmSwarm = makeSwarm(700, 44, { x0: 3.5, x1: 14.5, y0: 0.4, y1: 1.8, z0: -0.5, z1: 7.5, size: 0.03, color: '#2f3a18' });
field.add(farmSwarm.mesh);
function fieldOff() { meadowSwarm.set(0, 0); farmSwarm.set(0, 0); meadowSpark.set(0); meadowWebs.forEach(w => w.userData.set(0)); }

// ---------- stage: bars ----------
const BARS = new THREE.Group(); stage.add(BARS);
const barMeat = makeBar({ color: '#e0815a', label: '人類の肉と魚', x: -2.4, z: 0, headerY: 7.0 });
const barBug = makeBar({ color: '#7a8c4a', label: 'クモの獲物', x: 2.4, z: 0, headerY: 7.0 });
const ghost = box(2, 1, 2, new THREE.MeshLambertMaterial({ color: '#a8bd6a', transparent: true, opacity: 0.35, depthWrite: false })); ghost.geometry.translate(0, 0.5, 0); barBug.g.add(ghost);

const barSpider = makeSpider(); barSpider.scale.setScalar(4); BARS.add(barSpider);
[barMeat, barBug].forEach(b => BARS.add(b.g));
function barsOff(on) { BARS.visible = on; }

// ---------- subtitles ----------
const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの部屋のすみ。'],
  [6.2, 10.1, '世界中のクモが、<br>一斉に消えた。'],
  [10.1, 14, '世界のクモは、<br>5万種以上いた。'],
  [14.2, 18.1, 'ハエや蚊が、<br>部屋で目立ちはじめる。'],
  [18.1, 22, 'クモが1年に食べる虫は、<br>4億〜8億トン。'],
  [22.2, 26.1, 'その95%以上は、<br>森や草原での話。'],
  [26.1, 30, '食べられるはずの虫が、<br>そのまま残る。'],
  [30.2, 34.6, '今でも世界の作物の約4割が、<br>病害虫で失われている。'],
  [34.6, 39, 'その虫を食べる天敵が、<br>1つ消えた。'],
  [39.2, 43.6, '人類が1年に食べる<br>肉と魚は、約4億トン。'],
  [43.6, 47.8, 'クモは、それと同じか<br>それ以上を食べていた。'],
  [48.1, 53.8, '結果：ひとり年49kg以上の<br>虫が、野放しになった。'],
  [53.9, 56.1, 'クモは、無料の害虫駆除係。'],
  [56.2, 59.4, 'クモ全滅ボタン、<br>押す？押さない？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
const TP = 1.4;
const wp = (x, y, z) => [WEB_POS.x + x, WEB_POS.y + y, WEB_POS.z + z];
function cornerCam(t, d = 2.5, k = 0) { const u = ease(t / d); look(...wp(lerp(2.5, 2.35, u) + k, lerp(-0.45, -0.5, u), lerp(2.7, 2.55, u) + k), ...wp(0, -0.42, 0), 50); }

function shot0(t) { // hook: countdown, spider vanishes at TP
  living('day'); cornerOff(); web.userData.set(1); web.userData.shake(t, 0.01);
  spider.visible = t < TP; spider.userData.anim(t, 0.3); prey.forEach(p => p.visible = true);
  if (t >= TP && !spark.r0) { spark.init([spider.getWorldPosition(new THREE.Vector3()).toArray()], 0.1, 0.5); spark.r0 = true; }
  spark.set(t >= TP ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  cornerCam(t);
  el.title.style.opacity = 1;
  setHud('クモが消えるまで', cd(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return room;
}
function shot1(t) { // everyday: living room, spider on its web, a few flies near the corner get caught
  living('day'); cornerOff(); web.userData.set(1); web.userData.shake(t, 0.015);
  spider.visible = true; spider.userData.anim(t, 0.2); prey.forEach(p => p.visible = true);
  cornerSwarm.set(4, t);
  const u = ease(t / 3.5);
  look(lerp(0.6, 0.3, u), lerp(1.6, 1.7, u), lerp(2.6, 2.2, u), -2.6, 2.05, -2.8, 52);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return room;
}
function shot2(t) { // +1秒: spider vanishes (all spiders) – web stays empty
  living('day'); cornerOff(); web.userData.set(1); web.userData.shake(t, 0.01); prey.forEach(p => p.visible = true);
  const tv = 0.6;
  spider.visible = t < tv; spider.userData.anim(t, 0.3);
  if (t >= tv && !spark.r1) { spark.init([spider.getWorldPosition(new THREE.Vector3()).toArray()], 0.12, 0.6); spark.r1 = true; }
  spark.set(t >= tv ? (t - tv) / 1.1 : 0);
  el.flash.style.opacity = t >= tv ? 0.4 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  cornerSwarm.set(3, t);
  const u = ease(t / 8);
  look(...wp(lerp(1.5, 2.3, u), lerp(-0.6, -0.75, u), lerp(1.6, 2.4, u)), ...wp(-0.05, -0.55, 0), 50);
  hudTime('+1秒');
  setTop('世界のクモ（2026年）', comma(countUp(t, 53689, 4.0, 1.3)) + '種', fade(t, 4.0, 8, 0.25));
  return room;
}
function shot3(t) { // +1週間: the empty web breaks, flies multiply in the room
  living('day'); cornerOff(); spider.visible = false; prey.forEach(p => p.visible = t < 2.5);
  web.userData.set(clamp(1 - t / 3)); web.userData.shake(t, 0.05);
  roomSwarm.set(lerp(10, 70, clamp(t / 7)), t); cornerSwarm.set(12, t);
  resident.visible = true; resident.position.set(-0.6, 0, -1.6); resident.rotation.y = 0.5;
  resident.userData.arms[1].rotation.x = -1.3 - Math.sin(t * 7) * 0.4; resident.userData.arms[0].rotation.x = 0; resident.userData.head.rotation.x = -0.25;
  const u = ease(t / 8);
  look(lerp(1.8, 1.2, u), lerp(1.75, 1.85, u), lerp(3.6, 3.0, u), -1.4, 1.75, -2.2, 55);
  hudTime('+1週間');
  setTop('クモが1年に食べる虫（2017年推計）', '4〜' + (4 + countUp(t, 4, 4.1, 1.0)) + '億トン', fade(t, 4.0, 8, 0.25), '#ffd166');
  return room;
}
function shot4(t) { // +1か月: meadow — webs empty & gone, insects everywhere
  lift(260);
  setFieldEnv('day'); setFlowers(1); setFruit(1); fieldOff();
  const tv = 0.8;
  meadowWebs.forEach(w => { w.userData.set(t < tv ? 1 : clamp(1 - (t - tv) / 2.2)); w.userData.sp.visible = t < tv; w.userData.shake(t, 0.03); w.userData.sp.userData.anim(t, 0.2); });
  if (t >= tv && !meadowSpark.ready) { meadowSpark.init(meadowWebs.map(w => w.userData.sp.getWorldPosition(new THREE.Vector3()).toArray()), 0.15, 0.7); meadowSpark.ready = true; }
  meadowSpark.set(t >= tv ? (t - tv) / 1.2 : 0);
  meadowSwarm.set(lerp(60, 500, clamp(t / 7)), t);
  const u = ease(t / 8);
  look(lerp(-1.5, 0.5, u), lerp(2.0, 2.6, u), lerp(8.2, 9.0, u), 0, 1.0, 1.0, 52);
  hudTime('+1か月');
  setTop('そのうち森や草原のクモの分（2017年）', countUp(t, 95, 0.4, 1.3) + '%以上', fade(t, 0.15, 8, 0.25), '#7ff0c8');
  return field;
}
function shot5(t) { // +半年: vegetable rows covered in pests
  lift(240);
  setFieldEnv('day'); setFlowers(0.9); setFruit(0.6); fieldOff();
  farmSwarm.set(lerp(150, 700, clamp(t / 8)), t * 0.6);
  const u = ease(t / 9);
  look(lerp(5.5, 7.5, u), lerp(3.4, 2.8, u), lerp(13, 11.5, u), 9, 0.8, 4, 52);
  hudTime('+半年');
  setTop('病害虫で失われる世界の作物（2021年）', '約' + countUp(t, 40, 0.4, 1.3) + '%', fade(t, 0.15, 9, 0.25), '#ff8a7a');
  return field;
}
function shot6(t) { // +1年: bars — humans' meat & fish vs spiders' prey
  lift(330); setStageColor('#14213a'); barsOff(true);
  const k = ease(clamp((t - 0.3) / 1.6)), k2 = ease(clamp((t - 4.4) / 1.6));
  barMeat.setH(3.2 * k, '約4億トン');
  barBug.setH(3.2 * k2, k2 > 0.02 ? '4〜8億トン' : ''); barBug.label.visible = k2 > 0.02;
  ghost.scale.y = Math.max(0.001, 3.2 * k2); ghost.position.y = 3.2 * k2; ghost.visible = k2 > 0.02;
  barSpider.position.set(0.1, 0.32, 0.3); barSpider.rotation.y = 0.3; barSpider.visible = k2 > 0.3; barSpider.userData.anim(t, 0.3);
  const u = ease(t / 8.8);
  look(lerp(-1.0, 0.8, u), lerp(5.5, 5.2, u), lerp(21, 19.5, u), 0, 4.0, 0, 50);
  hudTime('+1年');
  if (t < 4.4) setTop('人類が1年に食べる肉と魚（2017年）', '約' + countUp(t, 4, 0.2, 0.8) + '億トン', fade(t, 0.15, 4.4, 0.2));
  else setTop('クモが1年に食べていた虫（2017年推計）', '4〜' + countUp(t, 8, 4.6, 1.0) + '億トン', fade(t, 4.45, 8.8, 0.2), '#ffd166');
  return stage;
}
function shot7(t) { // result: room swarming, the resident waving them away
  lift(170); living('evening'); cornerOff(); spider.visible = false; web.userData.set(0);
  roomSwarm.set(220, t); cornerSwarm.set(40, t);
  resident.visible = true; resident.position.set(-0.3, 0, -1.0); resident.rotation.y = 0.35;
  resident.userData.arms[1].rotation.x = -1.6 - Math.sin(t * 9) * 0.6; resident.userData.arms[0].rotation.x = -1.2 - Math.sin(t * 9 + 1.5) * 0.5; resident.userData.head.rotation.y = Math.sin(t * 3) * 0.3;
  const u = ease(t / 7.5);
  look(lerp(1.2, 1.9, u), lerp(1.9, 2.3, u), lerp(2.8, 4.0, u), -0.8, 1.6, -1.8, 55);
  setTop('ひとりあたりの虫（単純計算・2024年人口）', '年' + countUp(t, 49, 0.2, 1.3) + '〜' + countUp(t, 98, 0.2, 1.3) + 'kg', fade(t, 0.15, 7.5, 0.25), '#ffd166');
  return room;
}
function shot8(t) { // loop: same corner as the hook — the web is gone, flies remain
  living('day'); cornerOff(); spider.visible = false; web.userData.set(0);
  cornerSwarm.set(26, t);
  cornerCam(t + 0.5, 4.5);
  setHud('クモが消えるまで', cd(TP), 1, { mono: true });
  return room;
}
function scenesOff(f) { barsOff(f === shot6); MEADOW.visible = f === shot4; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { scenesOff(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0275',
    title: '世界からクモが消えたら？',
    titleHtml: '世界からクモが<br>消えたら？',
    hookType: 'H5', cat: '生き物・動物',
    mood: 'tension', seed: 275, hits: [1.4, 6.6, 48.1], risers: [14.0],
    impacts: [19.0, 44.0, 48.4],
    sfx: [[1.4, 'poof'], [6.6, 'poof'], [14.5, 'buzz'], [22.8, 'poof'], [23.5, 'buzz'], [31, 'meter', 0.5], [48.2, 'buzz']],
    narr: { '4億〜8億トン': 'よんおくから、はちおくトン', '95%以上': 'きゅうじゅうごパーセント以上', '約4割': 'やく、よんわり', '49kg': 'よんじゅうきゅうキロ', '5万種': 'ごまんしゅ' },
    ask: 'クモ全滅ボタン、押す？押さない？',
    caption: 'もしも世界中のクモが一瞬で消えたら？\n世界のクモは53,689種。クモが1年に食べる虫などの獲物は4億〜8億トンと推計されていて、これは人類が1年に食べる肉と魚（約4億トン）と同じかそれ以上。しかもその95%以上は森や草原でのこと。\n今でも世界の作物の約4割が病害虫で失われている。その虫を食べる天敵が1つ消えると、食べられるはずの虫がそのまま残る。\n結果：世界の人口で割ると、ひとり年49〜98kg（単純計算）。だいたい体重ほどの虫が野放しになる。\nクモは、無料の害虫駆除係だった。\n\nクモ全滅ボタン、押す？押さない？ コメントで教えて。\n\n出典：Nyffeler & Birkhofer「The Science of Nature」（2017年）・バーゼル大学、World Spider Catalog（2026年）、FAO（2021年）、国連 World Population Prospects 2024',
    hashtags: ['もしもラボ', 'クモ', '生き物', '生態系', '雑学'],
    endStats: [['世界のクモ', '53,689種', '2026年'], ['クモが1年に食べる虫', '4〜8億トン', '2017年推計'], ['そのうち森や草原', '95%以上', '2017年'], ['人類が1年に食べる肉と魚', '約4億トン', '2017年'], ['病害虫で失われる作物', '約40%', 'FAO・2021年'], ['ひとりあたりに直すと', '年49〜98kg', '単純計算']],
    sources: '出典：Nyffeler & Birkhofer, The Science of Nature（2017年）、<br>World Spider Catalog（2026年）、FAO（2021年）、国連 WPP 2024',
  },
});
