import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { farm, setFarmEnv, setVeg, FIELD } from '../scenes/farm.js';
import { makeHornet, makeHornetNest, makeEave, makeHive, makeBeeBall, makeCaterpillars } from '../scenes/hornet.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界中のスズメバチが絶滅したら？（blueprint no 704・絶滅ボタンシリーズ）
// 数字：
//  ハチに刺されて亡くなった人 2022年 20人（厚生労働省 人口動態統計。岩手労働局 盛岡労働基準監督署「蜂刺されによる労働災害を防止しましょう」に掲載）
//   https://jsite.mhlw.go.jp/iwate-roudoukyoku/content/contents/hachisasare_moriokasho_001_.pdf
//  死亡の大半はスズメバチやアシナガバチに刺されたアナフィラキシーショック（兵庫労働局 西脇労働基準監督署のリーフレット）
//   https://jsite.mhlw.go.jp/hyogo-roudoukyoku/content/contents/002653870.pdf
//  ニホンミツバチは500匹以上でオオスズメバチを囲み、球の中は約47℃になってハチを殺す（Ono et al., Nature 377:334, 1995）
//   https://www.nature.com/articles/377334a0
//  クロスズメバチの仲間（Vespula vulgaris）は1ヘクタールで1シーズンに最大480万回獲物を運ぶ（Harris 1991、ニュージーランド）／
//  1つの巣の働きバチは最大1万匹（Donovan 2003）— どちらも Brock et al. 2021「Ecosystem services provided by aculeate wasps」Biological Reviews に引用
//   https://arpi.unipi.it/bitstream/11568/1156679/1/Brock%20et%20al%202021_Biological%20Reviews.pdf

const RED = '#ff8a7a', GOLD = '#ffd27a', GREEN = '#7ff0c8';
const HS = 0.2; // hornet scale (inside the scaled shed)

// ---------- eave set (garden of a house) ----------
const E = new THREE.Vector3(-32, 0, 22);
const EAVE = makeEave({ wall: '#e3d6bf', roof: '#4f5d73' }); EAVE.position.copy(E); EAVE.scale.setScalar(0.62); farm.add(EAVE); // garden shed (物置)
const YARD = new THREE.Group(); YARD.position.copy(E); farm.add(YARD);
const NEST = makeHornetNest(); NEST.position.copy(EAVE.userData.nestAt); NEST.scale.setScalar(1.0); EAVE.add(NEST);
const NP = new THREE.Vector3().copy(EAVE.userData.nestAt).add(new THREE.Vector3(0, -0.65, 0.1)); // nest hole area (local)
const table = new THREE.Group(); table.position.set(-0.15, 0, 1.75); YARD.add(table);
{ const top = box(0.9, 0.05, 0.6, mat('#a07a4e')); top.position.y = 0.75; table.add(top); for (const [x, z] of [[-0.38, -0.24], [0.38, -0.24], [-0.38, 0.24], [0.38, 0.24]]) { const l = box(0.05, 0.75, 0.05, mat('#7a5a38')); l.position.set(x, 0.375, z); table.add(l); } }
const btn = makeXButton({ label: 'スズメバチ絶滅ボタン' }); btn.position.set(0, 1.075, 0); btn.scale.setScalar(1.4); table.add(btn);
{ const ped = box(0.5, 0.3, 0.5, mat('#e8e4dc')); ped.position.y = 0.925; table.add(ped); }
const pots = []; for (const [x, c] of [[-2.4, '#d0603a'], [-1.9, '#e8b04a'], [2.3, '#c94a7a']]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 10), mat('#b5653a')); p.position.set(x * 0.7, 0.15, 0.6); YARD.add(p); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(c, { flatShading: true })); f.position.set(x * 0.7, 0.45, 0.6); YARD.add(f); pots.push(p); }
const lawn = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), mat('#7fae5a')); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.01, 3.5); lawn.receiveShadow = true; YARD.add(lawn);
const gardener = makePerson({ skin: SKIN[2], hair: HAIR[2], shirt: '#5a8fc4', pants: '#4a4f5a', scale: 1 }); gardener.position.set(1.6, 0, 2.6); gardener.rotation.y = -2.4; YARD.add(gardener);
const hats = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.06, 14), mat('#e6d39a')); hats.position.set(0, 1.78, 0); gardener.add(hats);
const eHornets = []; for (let i = 0; i < 6; i++) { const h = makeHornet(); h.scale.setScalar(HS); EAVE.add(h); eHornets.push(h); }
function eaveHornets(t, n) {
  eHornets.forEach((h, i) => {
    h.visible = i < n; if (!h.visible) return;
    const a = t * (1.1 + i * 0.17) + i * 1.05, r = 0.35 + (i % 3) * 0.22;
    h.position.set(NP.x + Math.cos(a) * r, NP.y - 0.1 + Math.sin(a * 1.7 + i) * 0.18, NP.z + 0.25 + Math.sin(a) * r * 0.7);
    h.rotation.y = -a - Math.PI / 2; h.userData.anim(t + i);
  });
}
const hookH = makeHornet(); hookH.scale.setScalar(0.13); YARD.add(hookH);
const eSpark = makeSparkles(220, 0.08); farm.add(eSpark.points);

// ---------- hive with bee ball ----------
const HV = new THREE.Vector3(-32, 0, 36);
const HIVE = makeHive(); HIVE.position.copy(HV); farm.add(HIVE);
const tree = new THREE.Group(); tree.position.set(HV.x - 1.4, 0, HV.z - 1.2); farm.add(tree);
{ const tr = box(0.35, 2.4, 0.35, mat('#5d4434')); tr.position.y = 1.2; tree.add(tr); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), mat('#3f7a44', { flatShading: true })); c.position.y = 2.9; tree.add(c); }
const ball = makeBeeBall(110); ball.g.position.set(HV.x, 0.62, HV.z + 0.62); farm.add(ball.g);
const ballH = makeHornet(); ballH.scale.setScalar(0.2); ballH.position.copy(ball.g.position); ballH.rotation.y = -0.6; farm.add(ballH);
const bSpark = makeSparkles(120, 0.06); farm.add(bSpark.points); bSpark.init([ball.g.position.toArray()], 0.15, 0.6);
const guards = []; { const r = rng(8); for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), mat('#c99a3a')); b.scale.x = 1.5; b.position.set(HV.x - 0.22 + r() * 0.44, 0.36 + r() * 0.02, HV.z + 0.3 + r() * 0.08); farm.add(b); guards.push(b); } }

// ---------- cabbage field: caterpillars and hunting hornets ----------
const spots = []; { const r = rng(3); for (let row = 0; row < 6; row++) for (let k = 0; k < 14; k++) for (let j = 0; j < 2; j++) spots.push([FIELD.x - 5.3 + k * 0.82 + (r() - 0.5) * 0.3, 0.7 + r() * 0.06, FIELD.z - 3.2 + row * 1.3 + (r() - 0.5) * 0.3]); }
const cats = makeCaterpillars(spots); farm.add(cats.mesh);
const fHornets = []; for (let i = 0; i < 8; i++) { const h = makeHornet(); h.scale.setScalar(0.16); farm.add(h); fHornets.push(h); }
function fieldHornets(t, n) {
  fHornets.forEach((h, i) => {
    h.visible = i < n; if (!h.visible) return;
    const a = t * (0.7 + i * 0.09) + i * 0.8;
    h.position.set(FIELD.x - 3 + (i % 4) * 2 + Math.cos(a) * 1.0, 0.95 + Math.sin(t * 2.3 + i) * 0.2, FIELD.z - 2 + Math.floor(i / 4) * 3 + Math.sin(a) * 0.8);
    h.rotation.y = -a - Math.PI / 2; h.userData.anim(t + i);
  });
}
const fSpark = makeSparkles(260, 0.14); farm.add(fSpark.points);

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの夏の庭。'],
  [6.2, 10.1, '世界中のスズメバチが、<br>一斉に消えた。'],
  [10.1, 14, 'ハチに刺されて亡くなる人は、<br>2022年に20人。'],
  [14.2, 18.1, 'その大半は、スズメバチや<br>アシナガバチによるもの。'],
  [18.1, 22, '庭で刺される心配が、<br>ぐっと減った。'],
  [22.2, 26.1, 'ニホンミツバチは、<br>500匹以上で天敵を囲み、'],
  [26.1, 30, '約47℃の熱で<br>蒸し殺していた。'],
  [30.2, 34.6, 'でもスズメバチは、<br>虫を狩るハンターでもあった。'],
  [34.6, 39, 'その仲間は1ヘクタールで<br>最大480万回、獲物を運ぶ。'],
  [39.2, 43.6, '1つの巣には、<br>最大1万匹の狩人がいた。'],
  [43.6, 47.8, '狩られていた毛虫は、<br>もう狩られない。'],
  [48.1, 53.8, '結果：刺される心配は減り、<br>虫を狩るハンターが消えた。'],
  [53.9, 56.1, '怖い虫は、畑の番人。'],
  [56.2, 59.4, '次に絶滅ボタンを<br>押したい虫は？'],
];

const ew = (x, y, z) => [E.x + x, y, E.z + z];
const TP = 1.4;
function env() { setFarmEnv('day'); setVeg(1); cats.set(0); }
function hookCam(t, d = 2.5) { lift(110); const u = ease(t / d); look(...ew(lerp(-0.9, -0.8, u), lerp(1.35, 1.35, u), lerp(4.9, 4.7, u)), ...ew(0.3, 1.35, 1.0), 46); }
function shot0(t) { // hook: hornet near the nest, red button countdown -> press
  env(); btn.userData.labelOn(false);
  const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand);
  eaveHornets(t, t < TP ? 4 : 0);
  hookH.visible = t < TP; if (hookH.visible) { const a = t * 1.8; hookH.position.set(0.1 + Math.cos(a) * 0.22, 1.62 + Math.sin(a * 2) * 0.05, 1.8 + Math.sin(a) * 0.1); hookH.rotation.y = -a - Math.PI / 2; hookH.userData.anim(t); }
  if (t >= TP && !eSpark.r0) { eSpark.init([hookH, ...eHornets.slice(0, 4)].map(x => x.getWorldPosition(new THREE.Vector3()).toArray()), 0.12, 0.5); eSpark.r0 = true; }
  eSpark.set(t >= TP ? (t - TP) / 0.9 : 0);
  gardener.visible = false;
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  el.title.style.opacity = 1;
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return farm;
}
function gardenWork(t) { gardener.visible = true; gardener.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 3) * 0.2; gardener.userData.arms[1].rotation.x = -0.7; }
function shot1(t) { // everyday: hornets around the nest, gardener below
  lift(120);
  env(); btn.userData.press(0); btn.userData.hand(0); btn.userData.labelOn(false); hookH.visible = false; eSpark.set(0);
  eaveHornets(t + 3, 6); gardenWork(t);
  const u = ease(t / 3.5);
  look(...ew(lerp(-2.4, -2.1, u), lerp(1.7, 1.75, u), lerp(6.0, 5.6, u)), ...ew(0.5, 1.15, 1.2), 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return farm;
}
function shot2(t) { // +1秒: hornets at the nest vanish
  lift(120);
  env(); btn.userData.press(1); btn.userData.labelOn(false); hookH.visible = false; gardenWork(t);
  const tv = 0.6;
  eaveHornets(t + 6, t < tv ? 6 : 0);
  if (t >= tv && !eSpark.r1) { eSpark.init(eHornets.map(x => x.getWorldPosition(new THREE.Vector3()).toArray()), 0.12, 0.6); eSpark.r1 = true; }
  eSpark.set(t >= tv ? (t - tv) / 1.3 : 0);
  el.flash.style.opacity = t >= tv ? 0.4 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  const u = ease(t / 8);
  look(...ew(lerp(0.4, 0.8, u), lerp(1.4, 1.35, u), lerp(4.0, 3.5, u)), ...ew(0.7, 1.35, 0.6), 50);
  hudTime('+1秒');
  setTop('ハチに刺されて亡くなった人（2022年）', countUp(t, 20, 1.2, 1.0) + '人', fade(t, 1.15, 8, 0.25), RED);
  return farm;
}
function shot3(t) { // +1日: wide garden, gardener relaxed, empty nest
  lift(120);
  env(); btn.userData.press(0); btn.userData.labelOn(false); eaveHornets(0, 0); eSpark.set(0); hookH.visible = false;
  gardener.visible = true; gardener.userData.arms[0].rotation.x = 0; gardener.userData.arms[1].rotation.x = 0; gardener.rotation.y = -2.4 + Math.sin(t * 0.5) * 0.3;
  const u = ease(t / 8);
  look(...ew(lerp(-3.4, -2.6, u), lerp(2.2, 2.0, u), lerp(7.4, 6.6, u)), ...ew(0.4, 1.0, 1.0), 50);
  hudTime('+1日');
  setTop('ハチに刺されて亡くなった人（2022年）', '20人', fade(t, 0.15, 8, 0.25), RED);
  return farm;
}
function shot4(t) { // +1週間: Japanese honeybees' heat ball; the hornet inside vanishes
  lift(200);
  env();
  const tv = 6.0;
  const k = t < tv ? clamp(t / 1.2) : clamp(1 - (t - tv) / 1.6);
  ball.set(k, t, t < tv ? clamp((t - 1.0) / 1.5) : clamp(1 - (t - tv) / 0.8));
  ballH.visible = t < tv; ballH.userData.anim(t);
  bSpark.set(t >= tv ? (t - tv) / 1.0 : 0);
  const u = ease(t / 8);
  look(HV.x + lerp(1.1, 0.9, u), lerp(1.05, 0.95, u), HV.z + lerp(2.6, 2.3, u), HV.x, 0.7, HV.z + 0.4, 42);
  hudTime('+1週間');
  setTop('ミツバチが天敵を囲む球の温度（1995年）', '約' + countUp(t, 47, 1.2, 1.0) + '℃', fade(t, 1.15, 8, 0.25), GOLD);
  return farm;
}
function fcam(t, d, a, b, tg) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function shot5(t) { // +1か月: cabbage field, hunting hornets vanish, caterpillars appear
  lift(260);
  env(); ball.set(0, 0); ballH.visible = false;
  const tv = 1.0;
  fieldHornets(t, t < tv ? 8 : 0);
  if (t >= tv && !fSpark.r) { fSpark.init(fHornets.map(x => x.position.toArray()), 0.2, 0.8); fSpark.r = true; }
  fSpark.set(t >= tv ? (t - tv) / 1.4 : 0);
  cats.set(clamp((t - 2) / 7) * 0.35, t);
  fcam(t, 9.2, [5, 3.4, 15], [6.5, 3.0, 13.5], [9, 0.3, 6.5]);
  hudTime('+1か月');
  setTop('クロスズメバチの仲間が運ぶ獲物（1ha・1シーズン・1991年）', '最大' + countUp(t, 480, 1.4, 1.2) + '万回', fade(t, 1.35, 9.2, 0.25), GOLD);
  return farm;
}
function shot6(t) { // +1年: close on cabbages crawling with caterpillars
  lift(260);
  env(); fieldHornets(0, 0); fSpark.set(0);
  cats.set(lerp(0.4, 0.9, clamp(t / 6)), t);
  setVeg(lerp(1, 0.8, clamp(t / 8)));
  fcam(t, 8.8, [6.6, 2.6, 11.4], [7.2, 2.3, 10.6], [9.0, 0.5, 6.8]);
  hudTime('+1年');
  setTop('1つの巣の働きバチ（クロスズメバチの仲間・2003年）', '最大' + countUp(t, 1, 1.5, 0.6) + '万匹', fade(t, 1.45, 8.8, 0.25), GREEN);
  return farm;
}
function shot7(t) { // result: wide field, caterpillars stay
  lift(260);
  env(); cats.set(0.9, t); setVeg(0.8);
  fcam(t, 7.5, [4.5, 4.4, 15.5], [3.5, 6.0, 18], [9, 0.3, 6.5]);
  const a = t < 3.6;
  setTop(a ? 'ハチに刺されて亡くなった人（2022年）' : 'クロスズメバチの仲間が運ぶ獲物（1ha・1シーズン・1991年）', a ? '20人' : '最大480万回', fade(t, 0.15, 7.5, 0.25), a ? RED : GOLD);
  return farm;
}
function shot8(t) { // loop: same button and nest, no hornets
  env(); btn.userData.press(0); btn.userData.hand(0); btn.userData.labelOn(false); eaveHornets(0, 0); hookH.visible = false; eSpark.set(0); gardener.visible = false;
  hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
  return farm;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0704',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '生き物・動物',
    title: '世界中のスズメバチが絶滅したら？',
    titleHtml: '世界中のスズメバチが<br>絶滅したら？',
    mood: 'tension', seed: 704, hits: [1.4, 48.1], risers: [6.0], impacts: [11.6, 36.0],
    sfx: [[1.4, 'poof'], [6.6, 'poof'], [28.0, 'poof'], [31.0, 'poof'], [2.6, 'buzz']],
    narr: { '20人': 'にじゅうにん', '47℃': '47度', '480万回': '480万回', '1ヘクタール': 'いちヘクタール', '1万匹': 'いちまんびき', 'スズメバチ絶滅ボタン': 'スズメバチぜつめつボタン' },
    ask: '次に絶滅ボタンを押したい虫は？',
    caption: 'もしも世界中のスズメバチが一瞬で絶滅したら？\nハチに刺されて亡くなる人は、日本で2022年に20人。その大半はスズメバチやアシナガバチによるもの。庭や山で刺される心配はぐっと減る。\nニホンミツバチは、オオスズメバチを500匹以上で囲んで、約47℃の熱で蒸し殺す（1995年の研究）。その天敵もいなくなる。\nでもスズメバチは、虫を狩るハンターでもある。クロスズメバチの仲間は1ヘクタールで1シーズンに最大480万回も獲物を運び（ニュージーランドの調査・1991年）、1つの巣には最大1万匹の働きバチがいる。\n結果、刺される心配は減るけど、毛虫などを狩るハンターも消える。\n\n次に絶滅ボタンを押したい虫は？ コメントで教えて。\n\n出典：厚生労働省 人口動態統計（岩手労働局 盛岡労働基準監督署の資料より）、兵庫労働局 西脇労働基準監督署、Ono ほか Nature（1995年）、Brock ほか Biological Reviews（2021年）',
    hashtags: ['もしもラボ', 'スズメバチ', '絶滅', '生き物', '雑学'],
    endStats: [['ハチに刺されて亡くなった人', '20人', '2022年'], ['ミツバチが天敵を囲む球', '約47℃', '1995年'], ['クロスズメバチ類の獲物（1ha）', '最大480万回', '1991年'], ['1つの巣の働きバチ', '最大1万匹', '2003年']],
    sources: '出典：厚生労働省 人口動態統計、Nature（1995年）、<br>Biological Reviews（2021年）',
  },
});
