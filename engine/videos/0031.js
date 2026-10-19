import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, randPerson, SKIN, HAIR, makeQ } from '../lib.js';
import { market, queues, shelfItems } from '../market.js';
import { room, setRoom, setLight } from '../scenes/room.js';
import { stage, makeCrowd } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, makeSparkles, setTop, setHud, el } from '../story.js';

// もしもこの世からお金がなくなったら？
// 数字：日本銀行券発行高 114兆2,474億円＋貨幣流通高 4兆5,787億円＝約119兆円（日本銀行 マネタリーベースと日本銀行の取引 2026年9月末）
//       キャッシュレス決済比率 58.0%（経済産業省 2025年）、消費支出 月314,001円（総務省 家計調査 2025年 二人以上の世帯）
//       就業者数 6,842万人（総務省 労働力調査 2025年12月）
//       昔の日本では、銅銭が使われなくなると米や絹での物々交換に代わった（日本銀行 貨幣博物館の解説 / nippon.com）

// ---------- market: register ----------
const REG = new THREE.Vector3(-3.5, 0, 1);
const price = textSprite('¥1,000', { w: 512, h: 160, size: 120, bg: '#0f1a2b', color: '#7ff0c8', sx: 3.2 }); price.position.set(REG.x, 3.9, REG.z - 0.2); market.add(price);
const priceLab = textSprite('お会計', { w: 512, h: 96, size: 56, color: '#0f1a2b', bg: '#ffffff', sx: 2.6 }); priceLab.position.set(REG.x, 4.75, REG.z - 0.2); market.add(priceLab);
const clerk = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#1fb3a1', pants: '#2b3346' }); clerk.position.set(REG.x - 1.0, 0, REG.z - 0.3); clerk.rotation.y = Math.PI / 2; market.add(clerk);
const customer = makePerson({ skin: SKIN[2], hair: HAIR[3], shirt: '#e05a4f', pants: '#2b3346' }); customer.position.set(REG.x + 1.3, 0, REG.z + 0.2); customer.rotation.y = -Math.PI / 2 - 0.3; market.add(customer);
const cq = makeQ(); market.add(cq);
const basket = box(0.6, 0.35, 0.4, mat('#e46a5b')); basket.position.set(REG.x, 1.2, REG.z + 0.3); market.add(basket);
// お札と硬貨（カウンターの上と、客の手）
const money = new THREE.Group(); market.add(money);
{
  const bill = (c) => box(0.34, 0.012, 0.16, mat(c));
  for (let i = 0; i < 6; i++) { const b = bill(i % 2 ? '#c9b48a' : '#9fb59a'); b.position.set(REG.x - 0.35 + (i % 3) * 0.06, 1.39 + i * 0.013, REG.z - 0.05 + (i % 2) * 0.02); b.rotation.y = 0.2 * i; money.add(b); }
  const coinG = new THREE.CylinderGeometry(0.05, 0.05, 0.015, 14);
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(coinG, mat(i % 3 ? '#d8b25a' : '#c7ccd2')); c.position.set(REG.x + 0.25 + (i % 4) * 0.07, 1.39 + Math.floor(i / 4) * 0.016, REG.z - 0.05); money.add(c); }
}
const handBill = box(0.34, 0.012, 0.16, mat('#9fb59a')); customer.userData.arms[1].add(handBill); handBill.position.set(0, -0.68, 0.12); handBill.rotation.x = Math.PI / 2;
const spark = makeSparkles(220, 0.12); market.add(spark.points);
spark.init([[REG.x - 0.25, 1.42, REG.z - 0.05], [REG.x + 0.35, 1.42, REG.z - 0.05], [REG.x + 1.1, 1.25, REG.z + 0.35]], 0.4, 1.2);
const payBoard = textSprite('お支払いできません', { w: 768, h: 128, size: 64, bg: '#ffffff', color: '#c0262d', sx: 3.2 }); payBoard.position.set(REG.x, 3.9, REG.z - 0.2); market.add(payBoard);
function marketBase({ queue = false, moneyOn = true, pay = false } = {}) {
  price.visible = !pay; priceLab.visible = true; payBoard.visible = pay; money.visible = moneyOn; handBill.visible = moneyOn;
  for (const q of queues) q.p.visible = queue;
  for (const s of shelfItems) s.it.visible = true;
  spark.set(0);
}
const qBubbles = queues.slice(0, 10).map(q => { const b = makeQ(); market.add(b); return { b, q }; });
function queueQs(t, on) { for (const { b, q } of qBubbles) { b.visible = on; if (!on) continue; b.position.set(q.p.position.x, 2.45 + Math.sin(t * 3 + q.ph) * 0.05, q.p.position.z); b.scale.setScalar(0.5); } }

// ---------- stage: 物々交換 ----------
const traders = [];
{
  const a = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#4fa3d1', pants: '#3b3f4a' });
  const b = makePerson({ skin: SKIN[3], hair: HAIR[2], shirt: '#f2c14e', pants: '#5a4a3a', long: true });
  a.position.set(-1.3, 0.3, 0.5); a.rotation.y = Math.PI / 2; b.position.set(1.3, 0.3, 0.5); b.rotation.y = -Math.PI / 2;
  stage.add(a); stage.add(b); traders.push(a, b);
}
const fish = new THREE.Group(); { const body = box(0.7, 0.22, 0.12, mat('#7fa6c4')); fish.add(body); const tail = box(0.18, 0.3, 0.06, mat('#5d86a6')); tail.position.x = -0.42; fish.add(tail); } stage.add(fish);
const rice = box(0.55, 0.42, 0.35, mat('#efe6cf')); stage.add(rice);
const riceBand = box(0.57, 0.06, 0.37, mat('#b23a3a')); rice.add(riceBand);
const tradeQ = [makeQ(), makeQ()]; tradeQ.forEach(q => stage.add(q));
const crowd = makeCrowd(30, 8, { w: 12, d: 3, x: 0, z: 4.2 }); crowd.people.forEach(p => { p.rotation.y = Math.PI + p.rotation.y; });
function stageBase(showCrowd) { traders.forEach(p => p.visible = true); fish.visible = rice.visible = true; crowd.g.visible = showCrowd; }

// ---------- office ----------
const workers = [];
{ const r = rng(12); for (const [x, z] of [[-2.6, -2.25], [0, -2.25], [2.6, -2.25], [-2.6, -0.35], [0, -0.35], [2.6, -0.35]]) { const p = randPerson(r, { long: false, skirt: false }); p.position.set(x, 0, z + 0.9); p.rotation.y = Math.PI; room.add(p); workers.push(p); } }
const workQ = workers.map(() => { const q = makeQ(); room.add(q); return q; });
const sign = textSprite('今月の給料：0円', { w: 768, h: 160, size: 84, bg: '#ffffff', color: '#c0262d', sx: 3.0 }); sign.position.set(0, 2.95, -3.3); sign.scale.set(2.6, 2.6 * 160 / 768, 1); room.add(sign);
function office(t, qs) {
  setRoom({ sets: ['office'] }); setLight('day', { ceil: 0, hemi: 1.2 }); sign.visible = true;
  workers.forEach((p, i) => { p.visible = true; p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.5; });
  workQ.forEach((q, i) => { q.visible = qs && i % 3 !== 1 && t > 0.6 + i * 0.15; q.position.set(workers[i].position.x, 2.45 + Math.sin(t * 3 + i) * 0.05, workers[i].position.z); q.scale.setScalar(0.5 * easeBack(clamp((t - 0.6 - i * 0.15) / 0.3))); });
}

const SUBS = [
  [2.6, 6.0, 'いつものレジ。<br>お会計は1,000円。'],
  [6.2, 10.1, 'お札も硬貨も、<br>一瞬で消えた。'],
  [10.1, 14, '日本中のお札と硬貨、<br>約119兆円分が。'],
  [14.2, 18.1, '電子マネーの残高も、<br>もう使えない。'],
  [18.1, 22, 'キャッシュレスは、<br>買い物の58%だった。'],
  [22.2, 26.1, '棚には物がある。<br>でも、だれも買えない。'],
  [26.1, 30, '1世帯が1か月に使う<br>31万4,001円が払えない。'],
  [30.2, 34.6, '物々交換が始まった。'],
  [34.6, 39, 'でも、ほしい物どうしが<br>なかなか合わない。'],
  [39.2, 43.6, '会社は、給料を<br>払えなくなった。'],
  [43.6, 47.8, '働く人は<br>6,842万人。'],
  [48.1, 52.6, '結果：119兆円が消えて、<br>働く人全員の給料が止まった。'],
  [52.6, 55.4, '実は昔の日本でも、<br>米や絹がお金の代わりだった。'],
  [55.6, 59.4, 'お金がなくなったら、<br>あなたは何と交換する？'],
];

function regCam(t, d = 8) { const u = ease(t / d); look(REG.x + lerp(0.2, -0.3, u), 4.3, lerp(10.4, 9.6, u), REG.x - 0.4, 4.0, REG.z - 0.4, 50); }
function shot0(t, T) { // hook: お会計の瞬間にお金が消える（カウントダウン）
  lift(230); marketBase({ moneyOn: true }); el.title.style.opacity = 1; cq.visible = false;
  const left = Math.max(0, 6.0 - T);
  regCam(t + 0.5, 3);
  setHud('お金が消えるまで', `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`, 1, { mono: true });
  return market;
}
function shot1(t, T) { // いつものレジ（カウントダウン続く）
  lift(230); marketBase({ moneyOn: true }); cq.visible = false;
  el.title.style.opacity = clamp(1 - t / 0.4);
  regCam(t + 2.5, 6);
  const left = Math.max(0, 6.0 - T);
  setHud('お金が消えるまで', `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`, 1, { mono: true });
  return market;
}
function shot2(t, T) { // +1分 消える
  lift(230); const tv = 0.25;
  marketBase({ moneyOn: t < tv }); spark.set(t >= tv ? clamp((t - tv) / 1.6) : 0);
  el.flash.style.opacity = t >= tv ? 0.6 * Math.max(0, 1 - (t - tv) / 0.35) : 0;
  cq.visible = t > 1.2; cq.position.set(customer.position.x, 2.45, customer.position.z); cq.scale.setScalar(0.6 * easeBack(clamp((t - 1.2) / 0.3)));
  customer.userData.head.rotation.y = t > 1 ? Math.sin(t * 1.5) * 0.4 : 0;
  regCam(t, 8);
  hudTime('+1分');
  setTop('日本のお札と硬貨（2026年9月末）', '約' + countUp(t, 119, 3.9, 1.4) + '兆円', fade(t, 3.85, 8, 0.25));
  return market;
}
function shot3(t, T) { // +1時間 電子マネーも使えない
  lift(230); marketBase({ moneyOn: false, pay: true });
  cq.visible = true; cq.position.set(customer.position.x, 2.45 + Math.sin(t * 3) * 0.05, customer.position.z); cq.scale.setScalar(0.6);
  customer.userData.arms[1].rotation.x = -1.1; customer.userData.head.rotation.y = Math.sin(t * 1.2) * 0.3;
  regCam(t, 8);
  hudTime('+1時間');
  setTop('キャッシュレス決済の割合（2025年）', (countUp(t, 580, 3.9, 1.4) / 10).toFixed(1) + '%', fade(t, 3.85, 8, 0.25));
  return market;
}
function shot4(t, T) { // +1日 棚に物はあるのに買えない
  marketBase({ queue: true, moneyOn: false, pay: true }); cq.visible = false; customer.userData.arms[1].rotation.x = 0;
  for (const q of queues) q.p.userData.head.rotation.y = Math.sin(t * 1.3 + q.ph) * 0.4;
  queueQs(t, true);
  const u = ease(t / 8);
  look(lerp(14, 11, u), lerp(11, 9.5, u), lerp(24, 21, u), -1, 0.5, lerp(5, 4, u), 50);
  hudTime('+1日');
  const v = countUp(t, 314001, 3.9, 1.6);
  setTop('1世帯の1か月の消費支出（2025年）', `${Math.floor(v / 10000)}万${comma(v % 10000)}円`, fade(t, 3.85, 8, 0.25));
  return market;
}
function shot5(t, T) { // +1週間 物々交換。でも合わない
  lift(260); queueQs(0, false); stageBase(false);
  const [a, b] = traders;
  // 魚と米を差し出し合うが、首を横に振る
  const k = easeOut(clamp(t / 1.2));
  fish.position.set(lerp(-0.9, -0.45, k), 1.25, 0.75); rice.position.set(lerp(0.9, 0.45, k), 1.2, 0.75);
  a.userData.arms[1].rotation.x = -1.2 * k; b.userData.arms[0].rotation.x = -1.2 * k;
  const no = t > 4.4 ? Math.sin((t - 4.4) * 9) * 0.45 * clamp((t - 4.4) / 0.3) * clamp((7.5 - t) / 0.5) : 0;
  a.userData.head.rotation.y = no; b.userData.head.rotation.y = -no;
  tradeQ.forEach((q, i) => { q.visible = t > 4.6; q.position.set(traders[i].position.x, 2.4, 0.5); q.scale.setScalar(0.6 * easeBack(clamp((t - 4.6) / 0.3))); });
  const u = ease(t / 8.8);
  look(lerp(1.6, 0.8, u), lerp(2.4, 2.3, u), lerp(7.0, 6.2, u), 0, 1.4, 0.5, 50);
  hudTime('+1週間');
  return stage;
}
function shot6(t, T) { // +1か月 給料が払えない
  lift(200); tradeQ.forEach(q => q.visible = false);
  office(t, true);
  const u = ease(t / 8.8);
  look(lerp(0.4, -0.2, u), 2.5, lerp(5.4, 4.9, u), 0, 2.1, -2.0, 55);
  hudTime('+1か月');
  setTop('働く人（2025年12月）', comma(countUp(t, 6842, 4.4, 1.4)) + '万人', fade(t, 4.35, 8.8, 0.25));
  return room;
}
function shot7(t, T) { // 結果：レジの前に長い列。だれも払えない
  marketBase({ queue: true, moneyOn: false, pay: true }); queueQs(t, true);
  const u = ease(t / 7.5);
  look(lerp(-2, -6, u), lerp(7, 9, u), lerp(18, 22, u), -3, 1.5, 0, 50);
  setTop('消えたお札と硬貨（2026年9月末）', '約119兆円', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return market;
}
function shot8(t, T) { // ループ：冒頭のレジ。でもお金はないまま
  lift(230); marketBase({ moneyOn: false }); queueQs(0, false); cq.visible = false;
  regCam(t + 0.5, 3);
  setHud('この世のお金', '0円', 1, { color: '#ff8a7a' });
  return market;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, dim: f => f === shot4 || f === shot7,
  meta: {
    id: '0031',
    title: 'この世からお金がなくなったら？',
    titleHtml: 'この世から<br>お金がなくなったら？',
    mood: 'tension', seed: 31, hits: [6.25, 48.1], risers: [6.25, 48.1],
    ask: 'お金がなくなったら、あなたは何と交換する？',
    caption: 'もしもこの世からお金がなくなったら？\n日本中のお札と硬貨は約119兆円。電子マネーも、給料も、家賃の支払いも、物々交換でどこまで回る？公式データでシミュレーション。\n\nお金がなくなったら、あなたは何と交換する？ コメントで教えて。\n\n出典：日本銀行 マネタリーベースと日本銀行の取引（2026年9月末）、経済産業省 キャッシュレス決済比率（2025年）、総務省 家計調査（2025年）・労働力調査（2025年12月）、日本銀行 貨幣博物館',
    hashtags: ['もしもラボ', 'お金', '物々交換', 'キャッシュレス', '雑学'],
    endStats: [['日本のお札と硬貨', '約119兆円', '2026年9月末'], ['キャッシュレス決済の割合', '58.0%', '2025年'], ['1世帯の1か月の消費支出', '31万4,001円', '2025年'], ['働く人', '6,842万人', '2025年12月']],
    sources: '出典：日本銀行（マネタリーベース・貨幣博物館）、経済産業省、<br>総務省（家計調査・労働力調査）',
  },
});
