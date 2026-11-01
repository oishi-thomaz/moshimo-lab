import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { cedar, setCedarEnv, HERO, setPollen, puff } from '../scenes/cedar.js';
import { plaza, setPlazaEnv, makePlazaPeople } from '../scenes/plaza.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも日本からスギ花粉が消えたら？（blueprint no 703・絶滅ボタンシリーズ）
// 数字：
//  スギ花粉症の有病率 38.8%、花粉症全体 42.5%（鼻アレルギーの全国疫学調査2019。厚生労働省「花粉症対策」2021年4月 資料2）
//   https://www.cas.go.jp/jp/seisaku/kafun/dai1/02siryo2.pdf
//  アレルギー性鼻炎の医療費：保険診療 約3,600億円（診察等 約1,900億円＋内服薬 約1,700億円）、市販薬 約400億円（同資料・直近のデータ）
//  花粉症の有病率 1998年16% → 2019年39%（推定）（林野庁 令和6年度 森林・林業白書 第1部第2章第3節）
//   https://www.rinya.maff.go.jp/j/kikaku/hakusyo/r6hakusyo_h/all/chap1_2_3.html
//  人工林 約1,000万ha（国土の約4分の1）、その約4割 約441万ha がスギ林。戦後、成長が早いスギが植えられた。20年生以降に花粉が多くなる
//   （林野庁「花粉症対策 Q&A」）https://www.rinya.maff.go.jp/j/sin_riyou/kafun/qanda.html

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- forest: button on a stump by the forest road ----------
const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 1.75, 10), mat('#7a5a3e')); stump.position.set(0.15, 0.875, 7.0); cedar.add(stump);
const stumpTop = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 10), mat('#d8b98a')); stumpTop.position.set(0.15, 1.76, 7.0); cedar.add(stumpTop);
const btn = makeXButton({ label: 'スギ花粉絶滅ボタン' }); btn.position.set(0.15, 1.77, 7.0); btn.scale.setScalar(1.0); cedar.add(btn);
const pSpark = makeSparkles(400, 0.22, 0xffe9a0); cedar.add(pSpark.points);
pSpark.init(HERO.map(h => [h.position.x, 7, h.position.z]), 5, 3);
function forest(env, pk, t) {
  setCedarEnv(env); setPollen(pk, t); puff(pk, t); HERO.forEach(h => h.userData.flowers(pk > 0)); pSpark.set(0);
  btn.visible = false; stump.visible = stumpTop.visible = false; btn.userData.press(0); btn.userData.hand(0); btn.userData.labelOn(false);
}

// ---------- plaza: people with masks ----------
const crowd = makePlazaPeople(26, 21);
const masks = crowd.list.map(({ p }) => { const m = box(0.3, 0.14, 0.05, mat('#f4f4f2')); m.position.set(0, 0.16, 0.2); p.userData.head.add(m); return m; });
const hero = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#d98a4a', pants: '#3b4250', long: true, scale: 1 }); plaza.add(hero);
const heroMask = box(0.3, 0.14, 0.05, mat('#f4f4f2')); heroMask.position.set(0, 0.16, 0.2); hero.userData.head.add(heroMask);
const tissue = new THREE.Group(); { const b = box(0.22, 0.1, 0.12, mat('#e8eef6')); tissue.add(b); const s = box(0.06, 0.08, 0.04, mat('#ffffff')); s.position.y = 0.08; tissue.add(s); }
hero.userData.arms[1].add(tissue); tissue.position.set(0, -0.62, 0.1);
function plazaBase(maskK, t) {
  setPlazaEnv('day'); crowd.set(26, t, { look: true });
  masks.forEach((m, i) => { m.visible = (i / masks.length) < maskK; });
  hero.visible = false;
}
function heroPose(t, masked, sneeze) {
  hero.visible = true; hero.position.set(0.5, 0, 4); hero.rotation.y = 0.15; heroMask.visible = masked; tissue.visible = masked;
  const U = hero.userData; U.legs.forEach(l => l.rotation.x = 0);
  const s = sneeze ? Math.max(0, Math.sin(t * 2.4)) : 0;
  U.head.rotation.x = s * 0.45 - (sneeze ? 0 : 0.12); U.arms[1].rotation.x = masked ? -1.6 + s * 0.3 : -0.1; U.arms[0].rotation.x = masked ? 0 : 0.05 * Math.sin(t);
}

// ---------- stage ----------
const PREV = [['1998年', 16], ['2019年', 39]];
const pBars = PREV.map(([l, v], i) => makeBar({ color: i ? '#e0a63a' : '#9a8a5a', w: 2.4, d: 2.4, label: l, x: -2.3 + i * 4.6, z: 0, nameTop: true }));
const MONEY = [['保険診療', 3600], ['市販薬', 400]];
const mBars = MONEY.map(([l, v], i) => makeBar({ color: i ? '#7fbf7a' : '#4fa3d1', w: 2.4, d: 2.4, label: l, x: -2.8 + i * 5.6, z: 0, nameTop: true }));
function stageMode(m, k) {
  pBars.forEach((b, i) => { b.g.visible = m === 'prev'; const kk = clamp(k * 1.5 - i * 0.5); b.setH(PREV[i][1] / 9 * ease(kk), kk > 0.98 ? PREV[i][1] + '%' : ''); });
  mBars.forEach((b, i) => { b.g.visible = m === 'money'; const kk = clamp(k * 1.5 - i * 0.5); b.setH(MONEY[i][1] / 820 * ease(kk), kk > 0.98 ? '約' + MONEY[i][1].toLocaleString('en-US') + '億円' : ''); });
}

const SUBS = [
  [2.6, 6.0, 'くしゃみが止まった。<br>でも驚くのは、その人数。'],
  [6.2, 10.1, 'スギ花粉症の人は、<br>10人に4人。'],
  [10.1, 14, '20年ほど前は、<br>まだ6人に1人だった。'],
  [14.2, 18.1, 'なぜこんなに増えた？<br>答えは山にある。'],
  [18.1, 22, '戦後に植えたスギが、<br>花粉の多い年齢になった。'],
  [22.2, 26.1, 'スギの人工林は、<br>約441万ヘクタール。'],
  [26.1, 30, '人工林のうち、<br>約4割がスギだった。'],
  [30.2, 34.6, 'でも本当に大きいのは、<br>毎年出ていくお金。'],
  [34.6, 39, '鼻炎の医療費は、<br>保険だけで年約3,600億円。'],
  [39.2, 43.6, '市販薬も合わせると、<br>約4,000億円。'],
  [43.6, 47.8, 'その中の花粉症の分が、<br>まるごと浮いてくる。'],
  [48.1, 53.8, '結果：10人に4人の春から、<br>くしゃみとかゆみが消えた。'],
  [53.9, 56.1, 'スギの木は、そのまま。'],
  [56.2, 59.4, '次に絶滅ボタンで<br>消したいものは？'],
];

const TP = 0.5;
function btnState(t) { const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(-0.4, -0.3, u), lerp(2.6, 2.55, u), lerp(9.8, 9.6, u), 0.5, 3.0, -4, 54); }
function shot0(t) { // hook: yellow pollen clouds over the cedars; pressed at 0.5s and the air clears
  lift(0);
  const on = t < TP; forest(on ? 'haze' : 'clear', on ? 1 : 0, t + 3);
  btn.visible = stump.visible = stumpTop.visible = true; btnState(t);
  pSpark.set(t >= TP ? (t - TP) / 1.8 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: on ? '#fff' : '#ff6b6b' });
  return cedar;
}
function shot1(t) { // the cleared forest, camera rises
  lift(200); forest('clear', 0, t); btn.visible = stump.visible = stumpTop.visible = true; btn.userData.press(1);
  pSpark.set((t + 2) / 3.8);
  const u = ease(t / 3.5); look(lerp(-0.5, -0.8, u), lerp(2.3, 4.5, u), lerp(9.4, 12, u), 0.4, 5, -6, 52);
  return cedar;
}
function shot2(t) { // +1分: plaza, masks come off one by one
  lift(200); plazaBase(1 - clamp((t - 0.8) / 6), t);
  const u = ease(t / 8); look(lerp(-2.2, -1.6, u), lerp(2.2, 2.0, u), lerp(9.5, 8.6, u), 0.5, 1.5, 0.5, 50);
  hudTime('+1分');
  if (t < 4.1) setTop('スギ花粉症の人（2019年）', (countUp(t, 388, 0.4, 1.2) / 10).toFixed(1) + '%', fade(t, 0.3, 4.1, 0.25), GOLD);
  else setTop('花粉症の人（1998年）', '16%', fade(t, 4.1, 8, 0.25), GOLD);
  return plaza;
}
function shot3(t) { // +1週間: stage, prevalence 1998 vs 2019
  setStageColor('#2a2a1a'); lift(330); stageMode('prev', clamp((t - 0.3) / 3));
  const u = ease(t / 8.2); look(lerp(0, 0.3, u), lerp(4.2, 4.5, u), lerp(17, 16, u), 0, 3.2, 0, 50);
  hudTime('+1週間');
  setTop('花粉症の人（推定・林野庁 白書）', '16%→39%', fade(t, 0.3, 8.2, 0.25), GOLD);
  return stage;
}
function shot4(t) { // +1か月: aerial over the cedar plantation, no pollen
  lift(0); forest('clear', 0, t);
  const u = ease(t / 8); look(lerp(0, 2, u), lerp(16, 22, u), lerp(14, 6, u), 0, 6, -50, 52);
  hudTime('+1か月');
  if (t < 4.0) setTop('スギの人工林（全国）', '約' + countUp(t, 441, 0.3, 1.2) + '万ha', fade(t, 0.3, 4.0, 0.25), GREEN);
  else setTop('人工林に占めるスギ', '約4割', fade(t, 4.0, 8, 0.25), GREEN);
  return cedar;
}
function shot5(t) { // +半年: stage, money
  setStageColor('#14213a'); lift(330); stageMode('money', clamp((t - 0.3) / 3.2));
  const u = ease(t / 9); look(lerp(0, 0.3, u), lerp(4.6, 4.9, u), lerp(18, 17, u), 0, 3.6, 0, 50);
  hudTime('+半年');
  if (t < 4.4) setTop('毎年出ていくお金（2021年 厚労省資料）', 'アレルギー性鼻炎', fade(t, 0.3, 4.4, 0.25), BLUE);
  else setTop('アレルギー性鼻炎の医療費（保険診療・1年）', '約3,600億円', fade(t, 4.4, 9, 0.25), BLUE);
  return stage;
}
function shot6(t) { // +1年: close-up of a person, mask off, deep breath
  lift(120); plazaBase(0, t); heroPose(t, false, false);
  const u = ease(t / 8.8); look(lerp(0.0, 0.4, u), lerp(2.0, 1.95, u), lerp(9.4, 8.9, u), 0.5, 1.75, 4, 44);
  hudTime('+1年');
  setTop('保険診療＋市販薬（1年）', '約4,000億円', fade(t, 0.3, 8.8, 0.25), BLUE);
  return plaza;
}
function shot7(t) { // result: wide plaza in spring, nobody in a mask
  lift(200); plazaBase(0, t + 10); heroPose(t, false, false);
  const u = ease(t / 7.5); look(lerp(-1, -3, u), lerp(4, 6, u), lerp(15, 18, u), 0, 1.2, 0, 50);
  const a = t < 3.6;
  setTop(a ? 'スギ花粉症の人（2019年）' : 'アレルギー性鼻炎の医療費（保険＋市販薬）', a ? '10人に4人' : '約4,000億円', fade(t, 0.15, 7.5, 0.25), a ? GOLD : BLUE);
  return plaza;
}
function shot8(t) { // loop: hook framing, clear air, button not pressed
  lift(0); forest('clear', 0, t); btn.visible = stump.visible = stumpTop.visible = true;
  hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
  return cedar;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22.2, f: shot3 },
  { a: 22.2, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0703',
    v2: true,
    hookLine: '日本中のスギ花粉が、一瞬で消えた。',
    series: '絶滅ボタン',
    hookType: 'H2',
    cat: '生き物・動物',
    title: '日本からスギ花粉が消えたら？',
    titleHtml: '日本からスギ花粉が<br>消えたら？',
    mood: 'hopeful', seed: 703, hits: [0.5, 48.1], risers: [30.2], impacts: [6.6, 22.6, 35.0, 39.6],
    sfx: [[0.5, 'poof'], [0.0, 'whoosh']],
    narr: { 'スギ花粉絶滅ボタン': 'スギかふんぜつめつボタン', '約441万ヘクタール': 'やく441万ヘクタール', '年約3,600億円': 'ねん、やく3600おくえん', '約4,000億円': 'やく4000おくえん', '約4割': 'やく4わり' },
    ask: '次に絶滅ボタンで消したいものは？',
    caption: 'もしも日本からスギ花粉が一瞬で消えたら？\nスギ花粉症の人は38.8%、10人に4人（鼻アレルギーの全国疫学調査2019）。花粉症の人は1998年の16%から2019年には39%に増えたと推定されている（林野庁 森林・林業白書）。\n理由は山にある。戦後、成長の早いスギが植えられ、人工林約1,000万haの約4割、約441万haがスギ林。スギは20年生以降に花粉が多くなるといわれる（林野庁）。\nお金も大きい。アレルギー性鼻炎（花粉症を含む）の医療費は保険診療で約3,600億円、市販薬が約400億円（厚生労働省 2021年資料）。\n結果、10人に4人の春から、くしゃみとかゆみが消えた。スギの木はそのまま。\n\n次に絶滅ボタンで消したいものは？ コメントで教えて。\n\n出典：厚生労働省「花粉症対策」（2021年）・鼻アレルギーの全国疫学調査2019、林野庁 令和6年度 森林・林業白書、林野庁「花粉症対策 Q&A」',
    hashtags: ['もしもラボ', '花粉症', 'スギ花粉', '絶滅', '雑学'],
    endStats: [['スギ花粉症の人', '38.8%', '2019年'], ['花粉症の人の増え方', '16%→39%', '1998→2019年'], ['スギの人工林', '約441万ha', '林野庁'], ['鼻炎の医療費（保険＋市販薬）', '約4,000億円', '厚労省資料']],
    sources: '出典：厚生労働省（2021年）・鼻アレルギーの全国疫学調査2019、<br>林野庁 森林・林業白書（令和6年度）・花粉症対策Q&A',
  },
});
