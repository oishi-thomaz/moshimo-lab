import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, randPerson, SKIN, HAIR, makeQ } from '../lib.js';
import { market, queues, shelfItems } from '../market.js';
import { room, setRoom, setLight, setScreen, props } from '../scenes/room.js';
import { stage, makeBar, makeCoins, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも消費税が明日から0%になったら？
// 数字：消費税収 26兆278億円・一般会計税収 84兆2,226億円・所得税 25兆2,565億円・法人税 21兆7,450億円（財務省 令和7年度決算）
//       地方消費税 6兆9,143億円（総務省 令和6年度決算）、消費支出 月314,001円（総務省 家計調査 2025年 二人以上の世帯）
//       税率10%（2019年10月〜、国税庁）、総人口 1億2,265万人（総務省 人口推計 2026年9月1日概算）→1人あたり約21万円（推計）

// ---------- market: price board over register 2 ----------
const REG = new THREE.Vector3(-3.5, 0, 1);
const price = textSprite('¥1,100', { w: 512, h: 160, size: 120, bg: '#0f1a2b', color: '#7ff0c8', sx: 3.2 }); price.position.set(REG.x, 3.9, REG.z - 0.2); market.add(price);
const priceLab = textSprite('お会計（税込）', { w: 512, h: 96, size: 52, color: '#0f1a2b', bg: '#ffffff', sx: 2.6 }); priceLab.position.set(REG.x, 4.75, REG.z - 0.2); market.add(priceLab);
const clerk = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#1fb3a1', pants: '#2b3346', scale: 1 }); clerk.position.set(REG.x - 1.0, 0, REG.z - 0.3); clerk.rotation.y = Math.PI / 2; market.add(clerk);
const customer = makePerson({ skin: SKIN[2], hair: HAIR[3], shirt: '#e05a4f', pants: '#2b3346', long: true, skirt: true }); customer.position.set(REG.x + 1.3, 0, REG.z + 0.2); customer.rotation.y = -Math.PI / 2 - 0.3; market.add(customer);
const cq = makeQ(); market.add(cq);
const basket = box(0.6, 0.35, 0.4, mat('#e46a5b')); basket.position.set(REG.x, 1.2, REG.z + 0.3); market.add(basket);
function marketBase(showQueue) {
  price.visible = priceLab.visible = true;
  for (const q of queues) q.p.visible = !!showQueue;
  for (const s of shelfItems) s.it.visible = true;
}
// ---------- living room ----------
const dad = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#4fa3d1', pants: '#3b3f4a' }); room.add(dad); dad.position.set(0.4, 0, -1.6); dad.rotation.y = 0.5;
const receipt = box(0.25, 0.4, 0.01, mat('#ffffff')); dad.userData.arms[1].add(receipt); receipt.position.set(0, -0.72, 0.12);
const roomQ = makeQ(); room.add(roomQ);
// ---------- stage ----------
const bars = [
  makeBar({ color: '#4fa3d1', label: '所得税', x: -3.2, z: 0 }),
  makeBar({ color: '#8e6bbf', label: '法人税', x: 0, z: 0 }),
  makeBar({ color: '#f2c14e', label: '消費税', x: 3.2, z: 0 }),
];
const VAL = [25.2565, 21.7450, 26.0278];
const crowd = makeCrowd(60, 5, { w: 14, d: 5, x: 0, z: 4.5 }); crowd.g.visible = false;
const coins = [-6, -3, 0, 3, 6].map(x => makeCoins(x, -1.5, 26));
function stageBars(k, cons) { bars.forEach((b, i) => { b.g.visible = true; const v = i === 2 ? VAL[i] * cons : VAL[i]; b.setH(v * 0.18 * k, v > 0.01 ? v.toFixed(1) + '兆円' : ''); }); }

const SUBS = [
  [2.6, 6.0, 'いつものスーパー。<br>レシートには消費税10%。'],
  [6.2, 10.1, '1,100円が<br>1,000円に。'],
  [10.1, 14, '毎月約31万円の買い物から<br>消費税が消えた。'],
  [14.2, 18.1, '高い物ほど得をする。<br>レジに長い行列。'],
  [18.1, 22, '2019年から続いた10%が、<br>ゼロに。'],
  [22.2, 26.1, '困ったのは国の金庫だった。'],
  [26.1, 30, '消費税は、国の税収の<br>約3割を占めていた。'],
  [30.2, 34.6, '国に入るはずの<br>26兆円が消えた。'],
  [34.6, 39, '所得税よりも、法人税よりも<br>大きな柱だった。'],
  [39.2, 43.6, '国民1人あたり<br>約21万円分の穴。'],
  [43.6, 47.8, 'さらに地方の分も、<br>年約6.9兆円。'],
  [48.1, 52.6, '結果：1,100円は1,000円に。<br>国の税収は26兆円減った。'],
  [52.6, 55.4, 'その穴をどう埋めるかが、<br>次の大問題になった。'],
  [55.6, 59.4, 'あなたのレシートの消費税も、<br>その26兆円の一部。'],
];

function shot0(t, T) { // hook: price flips 1,100 -> 1,000
  lift(230);
  marketBase(false); const tv = 1.0;
  price.userData.set(t < tv ? '¥1,100' : '¥1,000'); price.scale.set(3.2 * (t >= tv ? 1 + 0.25 * Math.max(0, 1 - (t - tv) / 0.3) : 1), 1.0, 1);
  el.flash.style.opacity = t >= tv ? 0.55 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  cq.visible = t > tv + 0.3; cq.position.set(customer.position.x, 2.45, customer.position.z); cq.scale.setScalar(0.6 * easeBack(clamp((t - tv - 0.3) / 0.3)));
  const u = ease(t / 2.6);
  look(REG.x - 0.5, 4.5, lerp(10.6, 9.9, u), REG.x - 0.6, 4.4, REG.z - 0.4, 50);
  el.title.style.opacity = 1;
  setHud('消費税', t < tv ? '10%' : '0%', 1, { color: t < tv ? '#fff' : '#7ff0c8' });
  return market;
}
function shot1(t, T) { // everyday aisle (back to before)
  marketBase(false); price.visible = priceLab.visible = false; cq.visible = false;
  const u = ease(t / 3.5);
  look(lerp(4, 2, u), lerp(8, 7, u), lerp(13, 11, u), -4, 1, -9, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  return market;
}
function shot2(t, T) { // +1min register
  lift(230);
  marketBase(false); const tv = 0.6;
  price.userData.set(t < tv ? '¥1,100' : '¥1,000'); price.scale.set(3.2, 1, 1);
  cq.visible = t > 1; cq.position.set(customer.position.x, 2.45, customer.position.z); cq.scale.setScalar(0.6 * easeBack(clamp((t - 1) / 0.3)));
  customer.userData.head.rotation.y = Math.sin(t * 1.5) * 0.3;
  const u = ease(t / 8);
  look(REG.x + lerp(0.2, -0.3, u), 4.5, lerp(10.4, 9.8, u), REG.x - 0.5, 4.4, REG.z - 0.4, 50);
  hudTime('+1分');
  const v = countUp(t, 314001, 0.3, 1.6);
  setTop('1世帯の1か月の消費支出（2025年）', `${Math.floor(v / 10000)}万${comma(v % 10000)}円`, fade(t, 0.15, 8, 0.25));
  return market;
}
function shot3(t, T) { // +1day queues
  marketBase(true); price.userData.set('¥1,000'); cq.visible = false;
  for (const q of queues) { q.p.userData.head.rotation.y = Math.sin(t * 1.3 + q.ph) * 0.35; }
  const u = ease(t / 8);
  look(lerp(14, 11, u), lerp(11, 9.5, u), lerp(24, 21, u), -1, 0.5, lerp(5, 4, u), 50);
  hudTime('+1日');
  setTop('消費税の標準税率（2019年10月〜）', t < 2.2 ? '10%' : '0%', fade(t, 0.15, 8, 0.25), t < 2.2 ? '#fff' : '#7ff0c8');
  return market;
}
function shot4(t, T) { // +1month living room, news on TV
  setRoom({ sets: ['living'] }); setLight('evening', { ceil: 0, hemi: 1.25 });
  setScreen((g, w, h) => { g.fillStyle = '#1b2b4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = '900 38px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.fillText('消費税 0%', w / 2, 70); g.fillStyle = '#f2c14e'; g.fillRect(20, 100, w - 40, 36); g.fillStyle = '#1b2b4a'; g.font = '900 26px "Noto Sans CJK JP"'; g.fillText('国の税収どうなる', w / 2, 128); });
  dad.rotation.y = 1.2 + Math.sin(t * 0.4) * 0.1; dad.userData.arms[1].rotation.x = -1.1;
  roomQ.visible = false && roomQ.position.set(dad.position.x, 2.45, dad.position.z); roomQ.scale.setScalar(0.6 * easeBack(clamp((t - 3.5) / 0.3)));
  const u = ease(t / 8);
  look(lerp(-1.6, -1.3, u), 2.7, lerp(4.4, 3.9, u), 0.5, 1.4, -2.2, 52);
  hudTime('+1か月');
  setTop('国の税収に占める消費税（2025年度）', (countUp(t, 309) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot5(t, T) { // +1year bars: consumption tax collapses
  lift(460);
  crowd.g.visible = false; coins.forEach(c => c.g.visible = false);
  const grow = easeOut(clamp(t / 1.4)); const cons = t < 4.4 ? 1 : 1 - easeOut((t - 4.4) / 1.2);
  stageBars(grow, cons);
  bars[2].mat.color.set(t < 4.4 ? '#f2c14e' : '#ff6b6b');
  const u = ease(t / 9);
  look(lerp(-0.6, 0.6, u), 5.6, lerp(20.5, 19.5, u), 0, 5.6, 0, 50);
  hudTime('+1年');
  const v = countUp(t, 260278, 0.3, 1.6);
  setTop('国の消費税収（2025年度）', `${Math.floor(v / 10000)}兆${comma(v % 10000)}億円`, fade(t, 0.15, 9, 0.25));
  return stage;
}
function shot6(t, T) { // per person
  stageBars(1, 0); bars.forEach(b => b.g.visible = false);
  crowd.g.visible = true; coins.forEach((c, i) => { c.g.visible = true; c.setN(Math.round(26 * (1 - clamp((t - 1.0 - i * 0.25) / 1.5)))); });
  crowd.people.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.3; });
  const u = ease(t / 8.6);
  look(0, lerp(9.5, 10, u), lerp(16, 17.5, u), 0, 1.4, -1.5, 50);
  setTop('1人あたりにすると（推計）', '約' + comma(countUp(t, 21)) + '万円', fade(t, 0.15, 8.6, 0.25));
  return stage;
}
function shot7(t, T) { // result
  lift(460);
  crowd.g.visible = false; coins.forEach(c => c.g.visible = false);
  stageBars(1, 0); bars[2].mat.color.set('#ff6b6b');
  const u = ease(t / 7.5);
  look(lerp(0.6, 0, u), 5.6, lerp(19.5, 21, u), 0, 5.6, 0, 50);
  setTop('消えた国の税収（2025年度）', '約' + comma(countUp(t, 26, 0.2, 1.2)) + '兆円', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return stage;
}
function shot8(t, T) { // loop to the register
  lift(230);
  marketBase(false); price.userData.set('¥1,100'); price.scale.set(3.2, 1, 1); cq.visible = false;
  const u = ease(t / 4);
  look(REG.x - 0.5, 4.5, lerp(10.9, 10.6, u), REG.x - 0.6, 4.4, REG.z - 0.4, 50);
  setHud('消費税', '10%', 1);
  return market;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, dim: f => f === shot3,
  meta: {
    id: '0003',
    title: '消費税が明日から0%になったら？',
    titleHtml: '消費税が明日から<br>0%になったら？',
    mood: 'hopeful', seed: 5, hits: [1.0, 34.4, 48.1], risers: [1.0],
    caption: 'もしも消費税が明日から0%になったら？\nレジの1,100円は1,000円に。でも国の税収でいちばん大きい消費税26兆円が消えると、何が起きるのか。財務省・総務省の公式データでシミュレーション（試算です）。\n\n出典：財務省 令和7年度一般会計税収の決算額、総務省 国税・地方税の税収内訳（令和6年度決算）、総務省 家計調査（2025年）、総務省 人口推計（2026年9月概算）、国税庁',
    hashtags: ['もしもラボ', '消費税', '減税', '家計', '雑学'],
    endStats: [['国の消費税収', '26兆278億円', '2025年度'], ['国の税収に占める割合', '30.9%', '2025年度'], ['地方消費税', '6兆9,143億円', '2024年度'], ['1人あたり（推計）', '約21万円', '2025年度']],
    sources: '出典：財務省 令和7年度一般会計税収の決算額、総務省 税収内訳（令和6年度）・<br>家計調査（2025年）・人口推計（2026年9月）、国税庁',
  },
});
