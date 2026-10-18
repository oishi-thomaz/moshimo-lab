import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, randPerson, walkAlong, SKIN, HAIR, makeQ } from '../lib.js';
import { market, queues, shelfItems } from '../market.js';
import { room, setRoom, setLight, setScreen, props } from '../scenes/room.js';
import { stage, makeBar, makeCoins, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも物価が一晩で全部2倍になったら？（公式統計からの試算。投資助言ではない）
// 数字：消費者物価指数 2025年平均 総合 前年比+3.2%（総務省統計局 2026年1月23日公表）
//       家計調査 2025年平均（総務省統計局）：二人以上の世帯 食料 94,895円／月
//       同 勤労者世帯：消費支出 346,297円／月、可処分所得 532,408円／月、黒字 186,111円／月
//       毎月勤労統計調査 2025年分結果確報（厚生労働省）：実質賃金 前年比1.3%減
// 推計：食料2倍 189,790円、消費支出2倍 692,594円、2倍の支出−可処分所得＝160,186円の赤字（どれも給料が同じと仮定）

const RED = '#ff8a7a', GREEN = '#7ff0c8';
const man = (o = {}) => makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#4fa3d1', pants: '#2b3346', ...o });
// ---------- market: price board over a register ----------
const REG = new THREE.Vector3(-3.5, 0, 1);
const price = textSprite('¥2,000', { w: 512, h: 160, size: 120, bg: '#0f1a2b', color: '#ffffff', sx: 3.2 }); price.position.set(REG.x, 3.9, REG.z - 0.2); market.add(price);
const priceLab = textSprite('お会計', { w: 512, h: 96, size: 52, color: '#0f1a2b', bg: '#ffffff', sx: 2.6 }); priceLab.position.set(REG.x, 4.75, REG.z - 0.2); market.add(priceLab);
const clerk = man({ skin: SKIN[0], hair: HAIR[1], shirt: '#1fb3a1' }); clerk.position.set(REG.x - 1.0, 0, REG.z - 0.3); clerk.rotation.y = Math.PI / 2; market.add(clerk);
const customer = makePerson({ skin: SKIN[2], hair: HAIR[3], shirt: '#e05a4f', pants: '#2b3346', long: true, skirt: true }); customer.position.set(REG.x + 1.3, 0, REG.z + 0.2); customer.rotation.y = -Math.PI / 2 - 0.3; market.add(customer);
const cq = makeQ(); market.add(cq);
const basket = box(0.6, 0.35, 0.4, mat('#e46a5b')); basket.position.set(REG.x, 1.2, REG.z + 0.3); market.add(basket);
// red ×2 tags on the shelf ends (visible after the flip)
const tags = [];
for (let s = 0; s < 6; s++) for (const side of [-1, 1]) {
  const tg = textSprite('×2', { w: 256, h: 128, size: 92, bg: '#e04848', color: '#ffffff', sx: 0.9 });
  tg.position.set(-15 + s * 6 + side * 1.35, 2.75, -2.6); market.add(tg); tg.visible = false; tags.push(tg);
}
// shoppers walking the aisle with small baskets
const shoppers = [];
{ const r = rng(31); for (let i = 0; i < 4; i++) { const p = randPerson(r); market.add(p); const b = box(0.45, 0.25, 0.3, mat('#4f8fd1')); p.userData.arms[1].add(b); b.position.set(0, -0.72, 0.1); p.userData.arms[1].rotation.x = -0.25; p.visible = false; shoppers.push({ p, x: -12 + i * 6 + (i === 2 ? 0.4 : 0), ph: i * 1.7 }); } }
function marketBase({ queue = false, tagsOn = false, shop = false } = {}) {
  price.visible = priceLab.visible = true; cq.visible = false;
  for (const q of queues) q.p.visible = queue;
  for (const s of shelfItems) s.it.visible = true;
  tags.forEach(tg => tg.visible = tagsOn);
  shoppers.forEach(s => s.p.visible = shop);
}
function flipPrice(t, tv) {
  const on = t >= tv; price.userData.set(on ? '¥4,000' : '¥2,000');
  price.scale.set(3.2 * (on ? 1 + 0.25 * Math.max(0, 1 - (t - tv) / 0.3) : 1), 1.0, 1);
  price.material.color.set(on ? '#ffd0c8' : '#ffffff');
}
// ---------- kitchen ----------
const mom = makePerson({ skin: SKIN[3], hair: HAIR[2], shirt: '#8e6bbf', pants: '#3b3f4a', long: true }); room.add(mom); mom.position.set(1.2, 0, -1.9); mom.rotation.y = -0.4;
const receipt = box(0.25, 0.45, 0.01, mat('#ffffff')); mom.userData.arms[1].add(receipt); receipt.position.set(0, -0.72, 0.12);
const momQ = makeQ(); room.add(momQ);
// ---------- stage: take-home pay vs doubled spending ----------
const K = 1 / 140000; // 1 unit = 14万円
const barPay = makeBar({ color: '#4fa3d1', label: '手取り（月）', x: -2.4, z: 0 });
const barSpend = makeBar({ color: '#f2c14e', label: '支出（月）', x: 2.4, z: 0 });
const gap = box(2.06, 1, 2.06, mat('#e04848', { transparent: true, opacity: 0.85 })); gap.geometry.translate(0, 0.5, 0); gap.position.set(2.4, 0.3, 0); stage.add(gap); gap.visible = false;
const coins = makeCoins(0, 1.5, 30);
const minus = makeLabel('−16万円（推計）', { sx: 6.0, size: 80, color: RED, stroke: 10, w: 1024, h: 160 }); minus.position.set(0, 3.2, 1.5); stage.add(minus);
const coinLab = makeLabel('毎月残るお金', { sx: 3.6, size: 64 }); coinLab.position.set(0, 4.8, 1.5); stage.add(coinLab);
function barsOn(on) { barPay.g.visible = barSpend.g.visible = on; }
const man10k = v => `${(v / 10000).toFixed(1)}万円`;

const SUBS = [
  [2.6, 6.0, 'いつものスーパー。<br>いつもの値段。'],
  [6.2, 10.1, '2,000円のお会計が、<br>一晩で4,000円に。'],
  [10.1, 14, '2025年の値上がりは、<br>1年で3.2%だった。'],
  [14.2, 18.1, '家計で大きいのは食費。'],
  [18.1, 22, '月9万4,895円が、<br>18万9,790円に（推計）'],
  [22.2, 26.1, '棚の商品は全部2倍。<br>カゴはいつもの半分。'],
  [26.1, 30, '働く世帯の支出は<br>月34万6,297円。'],
  [30.2, 34.6, '2倍なら<br>69万2,594円（推計）'],
  [34.6, 39, '手取りは53万2,408円。<br>もう足りない。'],
  [39.2, 43.6, '毎月18万6,111円<br>残っていたお金は…'],
  [43.6, 47.8, '残るどころか、<br>毎月16万円の不足に。'],
  [48.1, 52.6, '結果：給料が同じなら、<br>毎月約16万円の赤字（推計）'],
  [52.6, 55.4, '実際2025年も、実質賃金は<br>1.3%減っていた。'],
  [55.6, 59.4, '物価2倍、<br>まず削るのは何？'],
];

function shot0(t, T) { // hook: 2,000 -> 4,000
  lift(230);
  marketBase(); const tv = 1.0; flipPrice(t, tv);
  el.flash.style.opacity = t >= tv ? 0.55 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  cq.visible = t > tv + 0.3; cq.position.set(customer.position.x, 2.45, customer.position.z); cq.scale.setScalar(0.6 * easeBack(clamp((t - tv - 0.3) / 0.3)));
  const u = ease(t / 2.6);
  look(REG.x - 0.5, 4.5, lerp(10.6, 9.9, u), REG.x - 0.6, 4.4, REG.z - 0.4, 50);
  el.title.style.opacity = 1;
  setHud('物価', t < tv ? '1倍' : '2倍', 1, { color: t < tv ? '#fff' : RED });
  return market;
}
function shot1(t, T) { // everyday aisle (before)
  marketBase(); price.visible = priceLab.visible = false;
  const u = ease(t / 3.5);
  look(lerp(4, 2, u), lerp(8, 7, u), lerp(13, 11, u), -4, 1, -9, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  return market;
}
function shot2(t, T) { // +1min register flips
  lift(300);
  marketBase(); flipPrice(t, 0.6);
  cq.visible = t > 1; cq.position.set(customer.position.x, 2.45, customer.position.z); cq.scale.setScalar(0.6 * easeBack(clamp((t - 1) / 0.3)));
  customer.userData.head.rotation.y = Math.sin(t * 1.5) * 0.3;
  const u = ease(t / 8);
  look(REG.x + lerp(0.6, 0.0, u), lerp(7.6, 7.2, u), lerp(14.5, 13.8, u), REG.x - 0.3, 2.6, REG.z - 0.4, 50);
  hudTime('+1分');
  if (t < 4.1) setTop('一晩で上がった物価', '+' + countUp(t, 100, 0.3, 1.2) + '%', fade(t, 0.15, 4.1, 0.2), RED);
  else setTop('2025年の1年間の物価上昇（全国・総合）', '+' + (countUp(t - 4.1, 32, 0.2, 1.2) / 10).toFixed(1) + '%', fade(t, 4.1, 8, 0.2));
  return market;
}
function shot3(t, T) { // +1day kitchen, receipt
  lift(300);
  setRoom({ sets: ['kitchen'] }); setLight('day', { ceil: 0, hemi: 1.0 }); props.sleeper.visible = false;
  mom.userData.arms[1].rotation.x = -1.1; mom.userData.head.rotation.x = 0.25 + Math.sin(t * 1.2) * 0.05;
  momQ.visible = t > 4.3; momQ.position.set(mom.position.x, 2.3, mom.position.z); momQ.scale.setScalar(0.55 * easeBack(clamp((t - 4.3) / 0.3)));
  const u = ease(t / 8);
  look(lerp(-0.2, 0.2, u), 2.0, lerp(2.8, 2.3, u), 0.6, 1.25, -2.2, 52);
  hudTime('+1日');
  if (t < 4.1) { const v = countUp(t, 94895, 0.3, 1.4); setTop('1か月の食費（2人以上の世帯・2025年）', `${comma(v)}円`, fade(t, 0.15, 4.1, 0.2)); }
  else { const v = countUp(t - 4.1, 189790, 0.1, 1.2); setTop('2倍になると（推計）', `${comma(v)}円`, fade(t, 4.1, 8, 0.2), RED); }
  return room;
}
function shot4(t, T) { // +1week aisle: ×2 tags, small baskets
  marketBase({ tagsOn: true, shop: true }); price.visible = priceLab.visible = false;
  shoppers.forEach(s => walkAlong(s.p, [[s.x, -15 + s.ph * 0.5, 0], [s.x, -6.5, 8]], t, 6));
  tags.forEach((tg, i) => tg.scale.set(0.9 * (1 + 0.15 * Math.sin(t * 4 + i)), 0.45 * (1 + 0.15 * Math.sin(t * 4 + i)), 1));
  const u = ease(t / 8);
  lift(260);
  look(lerp(1.2, 0.6, u), lerp(7.5, 7.0, u), lerp(9.5, 8.5, u), 0, 0.5, -10, 50);
  hudTime('+1週間');
  if (t < 3.9) setTop('一晩で、棚の値段が', '全部×2', fade(t, 0.15, 3.9, 0.2), RED);
  else { const v = countUp(t, 346297, 3.9, 1.4); setTop('働く世帯の1か月の支出（2025年）', `${comma(v)}円`, fade(t, 3.9, 8, 0.2)); }
  return market;
}
function shot5(t, T) { // +1month bars
  lift(460);
  barsOn(true); coins.g.visible = false; minus.visible = coinLab.visible = false;
  const g = easeOut(clamp(t / 1.2)), d = easeOut(clamp((t - 0.6) / 1.6));
  const spend = 346297 * (1 + d);
  barPay.setH(532408 * K * g, man10k(532408));
  barSpend.setH(spend * K * g, man10k(spend));
  gap.visible = t > 4.6; gap.position.y = 0.3 + 532408 * K; gap.scale.y = Math.max(0.001, (692594 - 532408) * K * easeOut(clamp((t - 4.6) / 0.6)));
  const u = ease(t / 9);
  look(lerp(-0.6, 0.6, u), 3.6, lerp(19.5, 18.7, u), 0, 3.4, 0, 50);
  hudTime('+1か月');
  if (t < 4.4) { const v = countUp(t, 692594, 0.6, 1.6); setTop('支出が2倍になると（推計）', `${comma(v)}円`, fade(t, 0.15, 4.4, 0.2), RED); }
  else { const v = countUp(t - 4.4, 532408, 0.1, 1.2); setTop('働く世帯の1か月の手取り（2025年）', `${comma(v)}円`, fade(t, 4.4, 9.2, 0.2)); }
  return stage;
}
function shot6(t, T) { // savings coins vanish -> deficit
  lift(360);
  barsOn(false); gap.visible = false;
  coins.g.visible = true; coins.setN(Math.round(30 * (1 - easeOut(clamp((t - 4.2) / 1.2)))));
  coinLab.visible = t < 5.4; minus.visible = t > 5.0; minus.scale.set(6 * easeBack(clamp((t - 5.0) / 0.4)), 0.94 * easeBack(clamp((t - 5.0) / 0.4)), 1);
  const u = ease(t / 8.8);
  look(lerp(-1.5, 1.5, u), 5.5, lerp(13, 12, u), 0, 2.8, 0, 50);
  hudTime('+1か月');
  if (t < 4.4) { const v = countUp(t, 186111, 0.3, 1.4); setTop('毎月残っていたお金（働く世帯・2025年）', `${comma(v)}円`, fade(t, 0.15, 4.4, 0.2), GREEN); }
  else { const v = countUp(t - 4.4, 160186, 0.1, 1.2); setTop('2倍の物価だと毎月（推計）', `−${comma(v)}円`, fade(t, 4.4, 8.8, 0.2), RED); }
  return stage;
}
function shot7(t, T) { // result: bars with the red gap
  lift(460);
  barsOn(true); coins.g.visible = false; minus.visible = coinLab.visible = false;
  barPay.setH(532408 * K, man10k(532408)); barSpend.setH(692594 * K, man10k(692594));
  gap.visible = true; gap.position.y = 0.3 + 532408 * K; gap.scale.y = (692594 - 532408) * K;
  gap.material.opacity = 0.7 + 0.25 * Math.abs(Math.sin(t * 2.5));
  const u = ease(t / 7.5);
  look(lerp(0.6, 0, u), 3.6, lerp(18.7, 19.8, u), 0, 3.4, 0, 50);
  if (t < 4.5) setTop('毎月の赤字（推計）', '約' + countUp(t, 16, 0.2, 1.2) + '万円', fade(t, 0.15, 4.5, 0.2), RED);
  else setTop('実質賃金（2025年・前年比）', '−' + (countUp(t - 4.5, 13, 0.1, 0.9) / 10).toFixed(1) + '%', fade(t, 4.5, 7.5, 0.2));
  return stage;
}
function shot8(t, T) { // loop: register at the doubled price
  lift(300);
  marketBase(); flipPrice(9, 0); price.scale.set(3.2, 1, 1);
  const u = ease(t / 4);
  look(REG.x - 0.2, lerp(7.3, 7.2, u), lerp(14.2, 13.9, u), REG.x - 0.3, 2.6, REG.z - 0.4, 50);
  setHud('物価', '2倍', 1, { color: RED });
  return market;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, dim: f => f === shot2 || f === shot4 || f === shot8,
  meta: {
    id: '0016',
    title: '物価が一晩で全部2倍になったら？',
    titleHtml: '物価が一晩で<br>全部2倍になったら？',
    mood: 'tension', seed: 16, hits: [1.0, 34.6, 48.1], risers: [1.0, 30.2],
    ask: '物価2倍、まず削るのは何？',
    caption: 'もしも物価が一晩で全部2倍になったら？\n2025年の値上がりは1年で3.2%。それが一晩で100%になったら、働く世帯の家計はどうなるのか。総務省の家計調査（2025年）で計算すると、支出は月69万2,594円、手取り53万2,408円を超えて毎月約16万円の赤字に（給料が同じと仮定した試算です）。\n\n物価2倍、まず削るのは何？ コメントで教えて。\n\n出典：総務省統計局 家計調査（2025年平均）、総務省統計局 消費者物価指数（2025年平均）、厚生労働省 毎月勤労統計調査（2025年分確報）',
    hashtags: ['もしもラボ', '物価高', '値上げ', '家計', 'インフレ'],
    endStats: [['物価の上昇（全国・総合）', '+3.2%', '2025年'], ['働く世帯の支出（月）', '346,297円', '2025年'], ['働く世帯の手取り（月）', '532,408円', '2025年'], ['物価2倍の赤字（推計）', '毎月約16万円', '給料が同じ場合']],
    sources: '出典：総務省統計局 家計調査（2025年平均）・消費者物価指数（2025年平均）、<br>厚生労働省 毎月勤労統計調査（2025年分確報）',
  },
});
