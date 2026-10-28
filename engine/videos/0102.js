import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { town, setTownEnv } from '../scenes/town.js';
import { farm, setFarmEnv, setVeg, FIELD, makeFarmer } from '../scenes/farm.js';
import { highway, setHighwayEnv, makeHwCar, laneX } from '../scenes/highway.js';
import { makeCrow } from '../scenes/creatures.js';
import { makeGarbage, makeBearSign } from '../scenes/bear.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも日本中のカラスが消えたら？（blueprint no 102・絶滅ボタンシリーズ）
// 数字：
//  東京都のカラス対策：都内の生息数は平成13年度（2001年度）比で約80%減（令和6年度＝2024年度）、捕獲は累計約25万羽、
//  都への苦情・相談は2001年度比で約92%減（東京都環境局「カラス対策」チラシ 令和6年度）
//   https://www.kankyo.metro.tokyo.lg.jp/documents/d/kankyo/r6karasu_chirashi-1
//  カラスの農作物被害 約13.4億円（令和4年度＝2022年度）、鳥類被害28億円の49%（農林水産省「野生鳥獣被害防止マニュアル 鳥類編」令和5年）
//   https://www.maff.go.jp/j/seisan/tyozyu/higai/manyuaru/pdf/r5_tyourui_1.pdf
//  直轄国道のロードキル 年約7万件（令和4年度）（国土交通省 報道発表）
//   https://www.mlit.go.jp/report/press/road01_hh_002005.html

const RED = '#ff8a7a', GOLD = '#ffd27a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- town: garbage spot ----------
const GS = new THREE.Vector3(4.45, 0, 7.0);
const G = new THREE.Group(); G.position.copy(GS); G.rotation.y = -Math.PI / 2; town.add(G);
const garb = makeGarbage(); G.add(garb);
garb.children.forEach(m => { if (m.material && m.material.transparent && Math.abs(m.material.opacity - 0.55) < 0.01 && m.geometry.parameters && m.geometry.parameters.height > 0.5) m.visible = false; }); // ネットの側面は手前をふさぐので隠す
const stand = box(0.36, 0.95, 0.36, mat('#8a8f96')); stand.position.set(-1.45, 0.475, 0.9); G.add(stand);
const btn = makeXButton({ label: 'カラス絶滅ボタン' }); btn.position.set(-1.45, 0.95, 0.9); btn.scale.setScalar(1.2); G.add(btn);
const crows = [];
for (const [x, y, z, ry] of [[-0.35, 0.42, 0.05, 2.6], [0.35, 0.42, -0.05, -2.2], [-0.75, 0.42, 0.25, 0.4], [0.1, 0.0, 1.0, 1.0], [0.9, 0.0, 1.2, 3.6]]) { const c = makeCrow(); c.scale.setScalar(0.62); c.position.set(x, y, z); c.rotation.y = ry; G.add(c); crows.push(c); }
const hookCrow = makeCrow(); hookCrow.scale.setScalar(0.5); G.add(hookCrow);
const gSpark = makeSparkles(220, 0.1); town.add(gSpark.points);
const walker = makePerson({ skin: SKIN[0], hair: HAIR[0], shirt: '#c4675a', pants: '#3b3f4a', scale: 1 }); walker.position.set(2.9, 0, 12); town.add(walker);
function crowsAt(t, n, peck = 1) { crows.forEach((c, i) => { c.visible = i < n; if (c.visible) c.userData.anim(t + i * 0.7, peck); }); }
const wp = (c) => c.getWorldPosition(new THREE.Vector3()).toArray();

// ---------- farm: crows on the cabbages ----------
const fCrows = [];
{ const r = rng(6); for (let i = 0; i < 9; i++) { const c = makeCrow(); c.scale.setScalar(0.75); c.position.set(FIELD.x - 4.5 + r() * 9, 0.12, FIELD.z - 2.6 + Math.floor(r() * 5) * 1.3 + 0.55); c.rotation.y = r() * 6.28; farm.add(c); fCrows.push(c); } }
const farmer = makeFarmer(rng(3)); farmer.position.set(FIELD.x - 6.8, 0, FIELD.z + 2.2); farmer.rotation.y = 0.9; farm.add(farmer);
const fSpark = makeSparkles(260, 0.16); farm.add(fSpark.points);
function farmCrows(t, vis) { fCrows.forEach((c, i) => { c.visible = vis; if (vis) c.userData.anim(t + i * 0.5, 1); }); }

// ---------- highway: cars and an animal-warning sign ----------
const CARS = [];
{
  const r = rng(12); const cols = ['#d9dde2', '#3f5f8a', '#8a2f2f', '#f4f1ea', '#5a6a4a', '#2d3138'];
  [9.0, 5.6, 2.2, -2.2, -5.6, -9.0].forEach((z, li) => { const dir = z > 0 ? 1 : -1; for (let i = 0; i < 4; i++) { const g = makeHwCar(cols[Math.floor(r() * cols.length)]); g.position.z = z; g.rotation.y = dir > 0 ? 0 : Math.PI; highway.add(g); CARS.push({ g, dir, off: i * 70 + r() * 25 + li * 13, sp: 22 + r() * 4 }); } });
}
function cars(T) { for (const v of CARS) v.g.position.x = laneX(T, v.sp, v.off, v.dir, 320); }
const sign = makeBearSign(textSprite, '動物注意'); sign.position.set(1.9, 0, 12.9); sign.scale.setScalar(1.0); highway.add(sign);
const hCrow = makeCrow(); hCrow.scale.setScalar(1.1); hCrow.position.set(3.2, 0, 12.4); hCrow.rotation.y = 2.4; highway.add(hCrow);
const hSpark = makeSparkles(120, 0.2); highway.add(hSpark.points); hSpark.init([[3.2, 0.6, 12.4]], 0.4, 1.0);

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの朝のゴミ置き場。'],
  [6.2, 10.1, 'ゴミ荒らしは消える。<br>でもヤバいのは1年後。'],
  [10.1, 14, '東京都はこれまでに、<br>約25万羽を捕まえてきた。'],
  [14.2, 18.1, '都内のカラスは、2001年度<br>から約8割減っていた。'],
  [18.1, 22, 'それが、ついにゼロ。<br>ゴミ荒らしも消えた。'],
  [22.2, 26.1, '畑でもカラスは、<br>嫌われ者だった。'],
  [26.1, 30, '野菜や果物の被害は、<br>1年で約13.4億円。'],
  [30.2, 34.6, '鳥による被害の、<br>ほぼ半分がカラスだ。'],
  [34.6, 39, 'その被害が、<br>まるごと消えた。'],
  [39.2, 43.6, 'でもカラスは、死がいを<br>食べる掃除屋でもあった。'],
  [43.6, 47.8, '国道だけでも、動物が<br>年約7万件はねられている。'],
  [48.1, 53.8, '結果：畑の被害13億円が消え、<br>街の掃除屋もいなくなった。'],
  [53.9, 56.1, '嫌われ者は、街の掃除屋。'],
  [56.2, 59.4, '次に消してほしい<br>嫌われ者は？'],
];

const TP = 0.5; // v2：0.5秒で押す（冒頭で待たせない）
function townEnv() { setTownEnv('day'); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(0.4, 0.6, u), lerp(1.9, 1.85, u), lerp(8.7, 8.5, u), 3.9, 0.8, 6.3, 50); }
function shot0(t) { // hook: crows pecking garbage, red button countdown -> press
  townEnv(); btn.userData.labelOn(false); walker.visible = false; garb.userData.scatter(0.25);
  const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand);
  crowsAt(t, t < TP ? 3 : 0);
  hookCrow.visible = false;
  if (t >= TP && !gSpark.r0) { gSpark.init(crows.slice(0, 3).map(wp), 0.3, 0.8); gSpark.r0 = true; }
  gSpark.set(t >= TP ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  lift(120); hookCam(t);
  el.title.style.opacity = 1;
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return town;
}
function shot1(t) { // everyday: crows tear the bags, a walker steps around
  lift(150);
  townEnv(); btn.userData.press(0); btn.userData.hand(0); gSpark.set(0);
  garb.userData.scatter(lerp(0.25, 0.6, clamp(t / 3)));
  crowsAt(t + 2, 5);
  walker.visible = true; walker.position.set(2.9, 0, lerp(11.5, 9.5, t / 3.5)); walker.rotation.y = Math.PI;
  const u = ease(t / 3.5);
  look(lerp(0.6, 0.9, u), lerp(2.3, 2.2, u), lerp(11.5, 11.0, u), 4.4, 0.5, 7.0, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return town;
}
function shot2(t) { // +1秒: crows vanish at the garbage spot
  lift(150);
  townEnv(); btn.userData.press(1); garb.userData.scatter(0.6); walker.visible = false;
  const tv = 0; // v2：冒頭で押した直後からつながるので、カラスはもう消えている（消えた跡の光だけ）
  crowsAt(t + 6, t < tv ? 5 : 0);
  if (t >= tv && !gSpark.r1) { gSpark.init(crows.map(wp), 0.3, 0.9); gSpark.r1 = true; }
  gSpark.set(t >= tv ? (t - tv) / 1.3 : 0);
  const u = ease(t / 8);
  look(lerp(0.9, 0.0, u), lerp(2.2, 4.0, u), lerp(11.0, 13.5, u), 4.4, 0.5, 6.8, 50);
  hudTime('+1秒');
  setTop('東京都が捕まえたカラス（累計・2024年度まで）', '約' + countUp(t, 25, 1.2, 1.0) + '万羽', fade(t, 1.15, 8, 0.25));
  return town;
}
function shot3(t) { // +1日: clean garbage spot, street from above
  lift(200);
  townEnv(); crowsAt(0, 0); gSpark.set(0); garb.userData.scatter(0); walker.visible = true; walker.position.set(2.9, 0, lerp(10, 4, t / 8)); walker.rotation.y = Math.PI;
  const u = ease(t / 8);
  look(lerp(-3, -4, u), lerp(7, 9, u), lerp(15, 17, u), 4.2, 0, 5.8, 50);
  hudTime('+1日');
  setTop('都内のカラス（2001年度比・2024年度）', '約' + countUp(t, 80, 0.6, 1.0) + '%減', fade(t, 0.55, 8, 0.25), GREEN);
  return town;
}
function fEnv() { setFarmEnv('day'); setVeg(1); }
function fcam(t, d, a, b, tg) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function shot4(t) { // +1か月: crows on the cabbages vanish
  lift(260);
  fEnv();
  const tv = 1.0;
  farmCrows(t, t < tv);
  if (t >= tv && !fSpark.r) { fSpark.init(fCrows.map(c => [c.position.x, 0.5, c.position.z]), 0.4, 1.0); fSpark.r = true; }
  fSpark.set(t >= tv ? (t - tv) / 1.4 : 0);
  farmer.rotation.y = 0.9;
  fcam(t, 8, [5.5, 3.2, 14.5], [6.5, 2.9, 13.2], [9, 0.3, 6.5]);
  hudTime('+1か月');
  setTop('カラスの農作物被害（2022年度）', '約' + (countUp(t, 134, 1.2, 1.1) / 10).toFixed(1) + '億円', fade(t, 1.15, 8, 0.25), GOLD);
  return farm;
}
function shot5(t) { // +3か月: wide field, harvest safe
  lift(260);
  fEnv(); farmCrows(0, false); fSpark.set(0);
  farmer.rotation.y = 0.9 + Math.sin(t * 0.6) * 0.3;
  fcam(t, 9.2, [0, 6, 18], [2, 8, 21], [8, 0, 5]);
  hudTime('+3か月');
  const a = t < 4.4;
  setTop(a ? '鳥の農作物被害のうちカラス（2022年度）' : 'カラスの農作物被害（2022年度）', a ? countUp(t, 49, 0.4, 1.0) + '%' : '約13.4億円', fade(t, 0.15, 9.2, 0.25), GOLD);
  return farm;
}
function shot6(t, T) { // +1年: highway roadside, a crow vanishes by the sign
  lift(240);
  setHighwayEnv('day'); cars(T);
  const tv = 0.8;
  hCrow.visible = t < tv; hCrow.userData.anim(t, 1);
  hSpark.set(t >= tv ? (t - tv) / 1.3 : 0);
  const u = ease(t / 8.8);
  look(lerp(-1.5, 0, u), lerp(2.4, 2.8, u), lerp(19.5, 21, u), 4.5, 1.2, 9, 50);
  hudTime('+1年');
  setTop('国道で動物がはねられた件数（2022年度）', '年約' + countUp(t, 7, 1.6, 0.8) + '万件', fade(t, 1.55, 8.8, 0.25), RED);
  return highway;
}
function shot7(t) { // result: quiet town garbage spot from above, no crows
  lift(200);
  townEnv(); crowsAt(0, 0); gSpark.set(0); garb.userData.scatter(0); walker.visible = false;
  const u = ease(t / 7.5);
  look(lerp(-2, -5, u), lerp(6, 11, u), lerp(14, 19, u), 4.2, 0, 5.8, 50);
  const a = t < 3.6;
  setTop(a ? 'カラスの農作物被害（2022年度）' : '国道で動物がはねられた件数（2022年度）', a ? '約13.4億円' : '年約7万件', fade(t, 0.15, 7.5, 0.25), a ? GOLD : RED);
  return town;
}
function shot8(t) { // loop: same button view, no crows
  townEnv(); btn.userData.press(0); btn.userData.hand(0); btn.userData.labelOn(false); crowsAt(0, 0); gSpark.set(0); garb.userData.scatter(0); walker.visible = false;
  lift(120); hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
  return town;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：いつもの朝（元の2.5〜6秒）を抜いて、押した直後から本題へ
  meta: {
    id: '0102',
    v2: true,
    hookLine: '日本中のカラスが、一斉に消えた。',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '生き物・動物',
    title: '日本中のカラスが消えたら？',
    titleHtml: '日本中のカラスが<br>消えたら？',
    mood: 'mystery', seed: 102, hits: [0.5, 48.1], risers: [6.0], impacts: [27.2, 44.4],
    sfx: [[0.5, 'poof'], [23.0, 'poof'], [40.0, 'poof'], [0.1, 'caw']],
    narr: { '25万羽': '25まんわ', '13.4億円': '13.4おくえん', '13億円': '13おくえん', '7万件': '7まんけん', '8割': 'はちわり', 'カラス絶滅ボタン': 'カラスぜつめつボタン' },
    ask: '次に消してほしい嫌われ者は？',
    caption: 'もしも日本中のカラスが一瞬で消えたら？\n東京都はこれまでにカラスを約25万羽捕まえてきて、都内のカラスは2001年度から約8割減った（2024年度）。それがゼロになれば、朝のゴミ荒らしも消える。\n畑では、カラスによる野菜や果物の被害が1年で約13.4億円（2022年度）。鳥による被害のほぼ半分（49%）がカラスだった。その被害がまるごと消える。\nでもカラスは、動物の死がいを食べる掃除屋でもある。国道だけでも、動物が車にはねられる事故は年約7万件（2022年度）。\n結果、畑の被害13億円は消えるけど、街の掃除屋もいなくなる。\n\n次に消してほしい嫌われ者は？ コメントで教えて。\n\n出典：東京都環境局 カラス対策（令和6年度）、農林水産省 野生鳥獣被害防止マニュアル 鳥類編（2022年度の被害）、国土交通省 報道発表（2022年度のロードキル）',
    hashtags: ['もしもラボ', 'カラス', '絶滅', '生き物', '雑学'],
    endStats: [['東京都が捕まえたカラス', '約25万羽', '2024年度まで'], ['都内のカラスの数', '約8割減', '2001→2024年度'], ['カラスの農作物被害', '約13.4億円', '2022年度'], ['国道で動物がはねられた件数', '年約7万件', '2022年度']],
    sources: '出典：東京都環境局（2024年度）、農林水産省（2022年度）、<br>国土交通省（2022年度）',
  },
});
