import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, makeQ, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setClock, props, lamp } from '../scenes/room.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { makeBedBug, makeCrawlers } from '../scenes/mites.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも世界中のトコジラミが絶滅したら？（blueprint no 709・絶滅ボタンシリーズ）
// 数字：
//  東京都におけるトコジラミ相談件数：H21(2009)165件 … H26 301件 … H31(2019)458件 … R5(2023)537件（最多）… R6(2024)486件
//   大きさ 5〜8mm（成虫）、人や動物の血液だけをエサにする（東京都保健医療局「知っていますか？トコジラミ」令和7年12月）
//   https://www.hokeniryo.metro.tokyo.lg.jp/documents/d/hokeniryo/shittimasuka_tokojirami_r7
//  ピレスロイド系（ペルメトリン）を処理して3日後の致死率：千葉・大阪・滋賀・京都・浜名湖の集団 3.3〜6.7%、防府 3.3%
//   （橋本知幸・日本環境衛生センター「衛生害虫トコジラミに対する対策について」厚生労働省 令和5年度生活衛生関係技術担当者研修会 2024年2月）
//   https://www.mhlw.go.jp/content/10900000/001208090.pdf
//  トコジラミがいる住人は、いない住人より睡眠の不調が約5倍（オッズ比5.0、39人 vs 52人。Susser et al., BMJ Open 2012;2:e000838）
//   https://bmjopen.bmj.com/content/2/5/e000838
//  トコジラミは病気をうつすことは知られていない（米国環境保護庁 EPA「About Bed Bugs」）
//   https://www.epa.gov/bedbugs/about-bed-bugs

const BLUE = '#7fd4ff', GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8';

// ---------- hotel room ----------
const HOT = new THREE.Group(); room.add(HOT);
const sheet = box(2.08, 0.02, 1.0, mat('#fbfbf8')); sheet.position.set(1.6, 0.67, -2.3); HOT.add(sheet); // white sheet between pillow and blanket
const throwB = box(2.12, 0.03, 0.5, mat('#7a2f3a')); throwB.position.set(1.6, 0.945, -0.6); HOT.add(throwB); // hotel bed runner
const BTN = new THREE.Vector3(0.95, 0.93, -1.25);
const btn = makeXButton({ label: 'トコジラミ絶滅ボタン' }); btn.position.copy(BTN); btn.scale.setScalar(0.85); HOT.add(btn);
const cBugs = []; const CB = [[1.35, -1.55, 0.3, 0.8], [1.7, -1.2, 0.25, 1.1], [2.05, -1.7, 0.35, 0.7], [1.2, -1.0, 0.2, 1.3], [1.6, -1.9, 0.28, 0.9]];
for (let i = 0; i < CB.length; i++) { const b = makeBedBug(); b.scale.setScalar(0.62); HOT.add(b); cBugs.push(b); }
function closeBugs(t, vis) {
  cBugs.forEach((b, i) => {
    b.visible = vis; if (!vis) return;
    const [x, z, r, s] = CB[i]; const a = t * s * 0.45 + i * 1.7;
    b.position.set(x + Math.cos(a) * r * 0.35, 0.94, z + Math.sin(a) * r * 0.25); b.rotation.y = -a + Math.PI; b.userData.anim(t + i, true);
  });
}
const seamBugs = makeCrawlers(120, 7, { x0: 0.65, x1: 2.55, z0: -2.15, z1: -0.9, y: 0.935, size: 0.035, color: '#7a3320', legs: '#4a2014' }); HOT.add(seamBugs.mesh);
const bugSpark = makeSparkles(220, 0.05); room.add(bugSpark.points);
{ const pts = []; const r = rng(3); for (let i = 0; i < 40; i++) pts.push([0.7 + r() * 1.8, 0.98, -2.15 + r() * 1.25]); bugSpark.init(pts, 0.1, 0.35); }
const hookSpark = makeSparkles(150, 0.045); room.add(hookSpark.points); hookSpark.init(CB.map(([x, z]) => [x, 0.98, z]), 0.12, 0.3);
// traveler + suitcase
const trav = makePerson({ skin: SKIN[0], hair: HAIR[2], shirt: '#4fa3d1', pants: '#2b3346', scale: 1 }); HOT.add(trav);
const suit = new THREE.Group(); { const b = box(0.5, 0.7, 0.26, mat('#d9a441')); b.position.y = 0.42; suit.add(b); const h = box(0.2, 0.04, 0.04, mat('#333')); h.position.y = 0.8; suit.add(h); for (const s of [-1, 1]) { const w = box(0.06, 0.07, 0.06, mat('#222')); w.position.set(s * 0.18, 0.035, 0); suit.add(w); } } suit.position.set(-1.3, 0, -1.7); suit.rotation.y = 0.4; HOT.add(suit);
// pest-control worker with sprayer
const pro = makePerson({ skin: SKIN[2], hair: HAIR[0], shirt: '#5d8c3a', pants: '#3b4a30', scale: 1 }); HOT.add(pro);
const mask = box(0.3, 0.14, 0.05, mat('#f2f2f2')); mask.position.set(0, 0.17, 0.2); pro.userData.head.add(mask);
const spray = new THREE.Group(); { const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12), mat('#e8e4d8')); spray.add(tank); const noz = box(0.03, 0.03, 0.4, mat('#333')); noz.position.set(0, 0.1, 0.25); spray.add(noz); }
pro.userData.arms[1].add(spray); spray.position.set(0, -0.62, 0.1); spray.rotation.x = Math.PI / 2;
const mist = makeSparkles(120, 0.05, 0xdfefff); room.add(mist.points);
const bq = makeQ(); bq.visible = false; room.add(bq);
const zzz = makeSparkles(50, 0.07, 0xbfd8ff); room.add(zzz.points); zzz.init([[1.6, 1.25, -2.4]], 0.15, 1.0);
function hotel(light, opt) {
  setRoom({ sets: ['bed'], wall: '#d9d2c4' }); setLight(light, opt); setClock('2:00');
  props.phone.visible = false; props.sleeper.visible = false; HOT.visible = true; throwB.visible = true; props.blanket.material.color.set('#f4f2ee'); btn.visible = true;
  trav.visible = false; pro.visible = false; spray.visible = true; mist.set(0); bq.visible = false; zzz.set(0); suit.visible = true;
  closeBugs(0, false); seamBugs.set(0, 0); bugSpark.set(0); hookSpark.set(0);
}

// ---------- stage: Tokyo consultations by year ----------
const YEARS = [['2009', 165], ['2014', 301], ['2019', 458], ['2023', 537], ['2024', 486]];
const bars = YEARS.map(([y, v], i) => makeBar({ color: i === 3 ? '#e0584a' : '#c9784a', w: 1.5, d: 1.5, label: y + '年度', x: -5.2 + i * 2.6, z: 0, nameTop: true }));
const stTitle = textSprite('東京都のトコジラミ相談', { w: 1024, h: 128, size: 64, sx: 9 }); stTitle.position.set(0, 9.3, -1); stage.add(stTitle);
function setBars(k, show = true) { bars.forEach((b, i) => { const v = YEARS[i][1]; const kk = clamp(k * 1.6 - i * 0.15); b.g.visible = show; b.setH(v / 95 * ease(kk), kk > 0.05 ? Math.round(v * ease(kk)) + '件' : ''); }); stTitle.visible = show; }

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>旅先のホテルの夜。'],
  [6.2, 10.1, '世界中のトコジラミが、<br>一斉に消えた。'],
  [10.1, 14, '東京都への相談は、<br>2023年度に過去最多だった。'],
  [14.2, 18.1, 'まず、夜に血を吸われる<br>心配が消えた。'],
  [18.1, 22, 'トコジラミがいる家の人は、<br>睡眠の不調が約5倍だった。'],
  [22.2, 26.1, '殺虫剤が効きにくい<br>トコジラミも、もういない。'],
  [26.1, 30, '効きにくい地域では、<br>3日後に死んだのは3.3%。'],
  [30.2, 34.6, 'じゃあ、困る生き物は？'],
  [34.6, 39, 'トコジラミは、<br>病気をうつすと知られていない。'],
  [39.2, 43.6, '東京都の相談は、<br>15年で約3倍に増えていた。'],
  [43.6, 47.8, 'その相談の電話が、<br>鳴らなくなった。'],
  [48.1, 53.8, '結果：病気はうつさない虫。<br>消えたのは、かゆみと不眠。'],
  [53.9, 56.1, '血だけを飲む虫だった。'],
  [56.2, 59.4, '次に絶滅ボタンを<br>押したい生き物は？'],
];

const TP = 1.4;
function btnState(t) { const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(0.55, 0.5, u), lerp(1.75, 1.7, u), lerp(0.05, -0.1, u), 1.4, 0.9, -1.5, 50); }
function shot0(t) { // hook: bed bugs on the white sheet by the pillow, red button on the nightstand
  lift(260);
  hotel('evening', { ceil: 8, hemi: 0.95, lamp: 1.2 }); lamp.position.set(0.3, 1.3, -2.4);
  btn.userData.labelOn(false); btnState(t); throwB.visible = false;
  closeBugs(t, t < TP); seamBugs.set(t < TP ? 120 : 0, t, 0.6);
  hookSpark.set(t >= TP ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  el.title.style.opacity = 1;
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return room;
}
function roomCam(t, d, a, b, tg = [1.4, 0.8, -2.0]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function travPose(t) { trav.visible = true; trav.position.set(-1.9, 0, -2.5); trav.rotation.y = 0.9; trav.userData.head.rotation.x = 0.25; trav.userData.arms[1].rotation.x = -0.2; }
function shot1(t) { // everyday: traveler arrives, the bugs hide in the sheet by the pillow
  lift(220);
  hotel('evening', { ceil: 8, hemi: 0.95, lamp: 1.2 }); lamp.position.set(0.3, 1.3, -2.4); btn.userData.labelOn(false); btn.userData.press(0); btn.userData.hand(0);
  closeBugs(t + 3, true); seamBugs.set(120, t + 3, 0.6); travPose(t);
  roomCam(t, 3.5, [-1.4, 2.3, 1.5], [-1.1, 2.2, 1.1]);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return room;
}
function shot2(t) { // +1秒: all gone
  lift(220);
  hotel('evening', { ceil: 8, hemi: 0.95, lamp: 1.2 }); lamp.position.set(0.3, 1.3, -2.4); btn.userData.labelOn(false); btn.userData.press(1); btn.userData.hand(0);
  const tv = 0.6;
  closeBugs(t + 6, t < tv); seamBugs.set(t < tv ? 120 : 0, t + 6, 0.6); travPose(t);
  bugSpark.set(t >= tv ? (t - tv) / 1.3 : 0);
  el.flash.style.opacity = t >= tv ? 0.4 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  roomCam(t, 8, [-1.1, 2.2, 1.1], [-0.7, 2.5, 1.8]);
  hudTime('+1秒');
  setTop('東京都のトコジラミ相談（2023年度・過去最多）', countUp(t, 537, 1.2, 1.2) + '件', fade(t, 1.15, 8, 0.25));
  return room;
}
function shot3(t) { // +1日: night, the traveler sleeps through
  lift(220);
  hotel('night', { ceil: 2.5, hemi: 0.95, lamp: 2.2 }); lamp.position.set(0.3, 1.4, -2.4); btn.visible = false;
  props.sleeper.visible = true; props.sleeper.position.y = 0.74 + Math.sin(t * 1.5) * 0.006;
  zzz.set((t % 2.6) / 2.6);
  roomCam(t, 8, [-0.6, 2.4, 1.0], [-0.3, 2.3, 0.6], [1.5, 0.85, -1.9]);
  hudTime('+1日');
  setTop('トコジラミがいる人の睡眠の不調（2012年）', '約' + countUp(t, 5, 1.2, 0.8) + '倍', fade(t, 1.15, 8, 0.25), GOLD);
  return room;
}
function shot4(t) { // +1週間: pest-control worker with nothing to spray
  lift(220);
  hotel('day', { ceil: 6, hemi: 1.05 }); btn.visible = false; suit.visible = false;
  pro.visible = true; pro.position.set(0.3, 0, -1.4); pro.rotation.y = 0.5;
  pro.userData.arms[1].rotation.x = -1.2; pro.userData.head.rotation.y = Math.sin(t * 1.2) * 0.5; pro.userData.head.rotation.x = 0.3;
  bq.visible = t > 3.5; bq.position.set(0.3, 2.2 + Math.sin(t * 3) * 0.04, -1.4);
  roomCam(t, 8, [-1.9, 2.1, 2.3], [-1.5, 2.2, 1.9], [0.8, 1.15, -1.8]);
  hudTime('+1週間');
  setTop('効きにくい地域で、殺虫剤3日後の致死率（2024年資料）', t < 2.6 ? (countUp(t, 33, 1.2, 1.0) / 10).toFixed(1) + '%' : '3.3%', fade(t, 1.15, 8, 0.25), RED);
  return room;
}
function shot5(t) { // +1か月: morning, traveler packing — nothing else changed
  lift(220);
  hotel('day', { ceil: 5, hemi: 1.1 }); btn.visible = false;
  travPose(t); trav.position.set(-1.7, 0, -2.3); trav.rotation.y = 0.9; trav.userData.arms[1].rotation.x = -0.6 - Math.sin(t * 2) * 0.1;
  roomCam(t, 9.2, [1.0, 1.9, 1.2], [0.8, 1.9, 0.8], [-1.5, 1.1, -2.2]);
  hudTime('+1か月');
  setTop('トコジラミがうつすと分かっている病気（米EPA）', 'なし', fade(t, 4.4, 9.2, 0.25), GREEN);
  return room;
}
function shot6(t) { // +1年: stage bar chart of Tokyo consultations, then the bars stop
  setStageColor('#14213a'); setBars(clamp(t / 4.5));
  const u = ease(t / 8.8); look(lerp(0, 0.3, u), lerp(5.0, 5.4, u), lerp(28, 26.5, u), 0, 4.6, 0, 50);
  lift(330);
  hudTime('+1年');
  if (t < 4.4) setTop('東京都の相談（2009年度→2024年度）', '165件→486件', fade(t, 1.0, 4.4, 0.25), GOLD);
  else setTop('15年で（2009年度→2024年度）', '約3倍', fade(t, 4.4, 8.8, 0.25), GOLD);
  return stage;
}
function shot7(t) { // result: morning, the traveler wakes up fresh
  lift(220);
  hotel('day', { ceil: 4, hemi: 1.1 }); btn.visible = false;
  props.sleeper.visible = true; props.sleeper.position.y = 0.74;
  roomCam(t, 7.5, [-0.4, 2.5, 1.6], [0.1, 2.9, 2.6], [1.5, 0.85, -1.9]);
  const a = t < 3.6;
  setTop(a ? 'トコジラミがいる人の睡眠の不調（2012年）' : 'トコジラミがうつすと分かっている病気（米EPA）', a ? '約5倍' : 'なし', fade(t, 0.15, 7.5, 0.25), a ? GOLD : GREEN);
  return room;
}
function shot8(t) { // loop: the red button on the nightstand, clean sheet
  lift(260);
  hotel('evening', { ceil: 8, hemi: 0.95, lamp: 1.2 }); lamp.position.set(0.3, 1.3, -2.4);
  btn.userData.labelOn(false); btn.userData.press(0); btn.userData.hand(0); throwB.visible = false;
  hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0709',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '生き物・動物',
    title: '世界中のトコジラミが絶滅したら？',
    titleHtml: '世界中のトコジラミが<br>絶滅したら？',
    mood: 'hopeful', seed: 709, hits: [1.4, 48.1], risers: [6.0], impacts: [18.6, 26.6, 39.6],
    sfx: [[1.4, 'poof'], [6.6, 'poof'], [2.6, 'skitter']],
    narr: { '3.3%': '3.3パーセント', '約5倍': 'やく5ばい', '約3倍': 'やく3ばい', 'トコジラミ絶滅ボタン': 'トコジラミぜつめつボタン', '2023年度': '2023年度' },
    ask: '次に絶滅ボタンを押したい生き物は？',
    caption: 'もしも世界中のトコジラミ（南京虫）が一瞬で絶滅したら？\n東京都に寄せられたトコジラミの相談は、2023年度に537件で過去最多。2009年度の165件から、2024年度は486件と15年で約3倍に増えている。\nトコジラミがいる家の人は、いない人より睡眠の不調が約5倍（2012年の調査）。\nしかも殺虫剤が効きにくい。ピレスロイド系の殺虫剤を処理して3日後に死んだのが3.3〜6.7%しかいない地域もあった（2024年の資料）。\nじゃあ消えて困る生き物は？ トコジラミは病気をうつすことは知られていない（米EPA）。\n結果、消えたのは、かゆみと眠れない夜。\n\n次に絶滅ボタンを押したい生き物は？ コメントで教えて。\n\n出典：東京都保健医療局「知っていますか？トコジラミ」、Susser ほか BMJ Open（2012年）、日本環境衛生センター 橋本知幸（厚生労働省 研修会資料 2024年）、米国環境保護庁 EPA',
    hashtags: ['もしもラボ', 'トコジラミ', '南京虫', '絶滅', '雑学'],
    endStats: [['東京都の相談（過去最多）', '537件', '2023年度'], ['15年での増え方', '約3倍', '2009→2024年度'], ['睡眠の不調', '約5倍', '2012年'], ['殺虫剤3日後の致死率', '3.3%', '効きにくい地域'], ['うつすと分かっている病気', 'なし', '米EPA']],
    sources: '出典：東京都保健医療局、BMJ Open（2012年）、<br>日本環境衛生センター（厚労省 研修会資料 2024年）、米EPA',
  },
});
