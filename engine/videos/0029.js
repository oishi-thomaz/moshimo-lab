import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, randPerson, SKIN, HAIR } from '../lib.js';
import { factory, LINES, setLine, setWorkers, setFactoryLight, factorySign } from '../scenes/factory.js';
import { market, queues, shelfItems } from '../market.js';
import { field, setFieldEnv, setFruit } from '../scenes/field.js';
import { stage, makeBar, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも外国人労働者257万人が一斉に帰国したら？（人手の話として。国籍別の数字・見た目の区別は出さない）
// 数字はすべて 厚生労働省「外国人雇用状況」の届出状況まとめ（令和7年10月末時点、2026年1月30日公表）
//   https://www.mhlw.go.jp/stf/newpage_68794.html ／ 別添3 届出状況表一覧（別表4・参考表）
//   外国人労働者数 2,571,037人、外国人を雇う事業所 371,215所
//   産業別（別表4）：製造業 635,075人（24.7%）うち食料品製造業 203,834人／サービス業（他に分類されないもの）391,946人／
//     卸売業・小売業 340,687人／宿泊業・飲食サービス業 319,999人／建設業 206,468人／医療・福祉 146,105人／農業 64,826人
//   推移（参考表）：2021年10月末 1,727,221人 → 2025年10月末 2,571,037人（約1.49倍・計算）
// 映像の工場・店・畑は架空。誰が外国人かは見た目で区別しない（消える人は場面ごとに選んだ一部の人）

const GREEN = '#7ff0c8', RED = '#ff8a7a', GOLD = '#ffd98a';
const man10 = v => `${(v / 10000).toFixed(1)}万人`;
const jp = v => { const m = Math.floor(v / 10000), r = v % 10000; return m ? `${m}万${r ? comma(r) : ''}人` : `${comma(r)}人`; };

// ---------- factory: who vanishes (same people every time) ----------
const GONE = [[1, 5, 2], [0, 4, 6, 3]]; // front line: station 1 empties. back line: station 0 empties
const isGone = (li, i) => GONE[li].includes(i);
const fSpark = makeSparkles(260, 0.12, 0xfff2c0); factory.add(fSpark.points);
{
  const pts = [];
  LINES.forEach((ln, li) => ln.workers.forEach((w, i) => { if (isGone(li, i)) for (const y of [0.5, 1.0, 1.5]) pts.push([w.x, y, ln.z - 0.85]); }));
  fSpark.init(pts, 0.5, 1.4);
}
let lineDist = 0;
// before: everyone works, belt runs. vanish at tv: chosen workers disappear; belt keeps running (trays miss a dish)
function factoryAt(t, { tv = 1e9, run = true, distAt = null, signOn = true } = {}) {
  setFactoryLight('day'); factorySign.visible = signOn;
  const gone = t >= tv;
  setWorkers((li, i) => !(gone && isGone(li, i)));
  const d = distAt != null ? distAt : t * 0.9;
  setLine(d, { pack: run ? 1 : 0, t });
  fSpark.set(gone ? clamp((t - tv) / 1.2) : 0);
}

// ---------- market: 4 clerks at the registers, two of them vanish ----------
const clerks = [];
{
  const r = rng(77);
  for (let i = 0; i < 4; i++) {
    const p = makePerson({ skin: SKIN[Math.floor(r() * 4)], hair: HAIR[Math.floor(r() * 4)], shirt: '#1fb3a1', pants: '#2b3346', long: r() < 0.5 });
    p.position.set(-10 + i * 6.5 - 1.0, 0, 0.7); p.rotation.y = Math.PI / 2; market.add(p); clerks.push(p);
  }
}
const mSpark = makeSparkles(160, 0.18); market.add(mSpark.points);
mSpark.init([[-10 + 1 * 6.5 - 1, 1.0, 0.7], [-10 + 2 * 6.5 - 1, 1.0, 0.7]], 0.6, 1.4);

// ---------- field: farm workers between the berry rows ----------
const farmers = [];
{
  const r = rng(5);
  const spots = [[6.0, 1.8], [8.8, 3.4], [11.6, 1.8], [7.4, 5.0], [10.6, 5.0]];
  for (const [x, z] of spots) {
    const p = randPerson(r, {}); p.position.set(x, 0, z); p.rotation.y = (r() - .5) * 1.0; field.add(p);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14), mat('#e8d49a')); hat.position.set(0, 0.52, 0); p.userData.head.add(hat);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.16, 12), mat('#e8d49a')); crown.position.set(0, 0.6, 0); p.userData.head.add(crown);
    const crate = box(0.6, 0.35, 0.4, mat('#c9874a')); crate.position.set(x + 0.6, 0.18, z + 0.2); field.add(crate);
    p.userData.arms[0].rotation.x = -0.8; p.userData.arms[1].rotation.x = -0.6;
    farmers.push({ p, crate, ph: r() * 6 });
  }
}
const farmSpark = makeSparkles(200, 0.16); field.add(farmSpark.points);
farmSpark.init([[6.0, 1, 1.8], [8.8, 1, 3.4], [11.6, 1, 1.8], [7.4, 1, 5.0], [10.6, 1, 5.0]], 0.6, 1.6);

// ---------- stage: industries (2025年10月末) ----------
const IND = [['製造', 635075, '#e9883a'], ['サービス', 391946, '#4fa3d1'], ['卸・小売', 340687, '#5fb38a'], ['宿泊・飲食', 319999, '#c47ad1'], ['建設', 206468, '#f2c14e'], ['医療・福祉', 146105, '#e46a5b']];
const K = 6.0 / 635075;
const bars = IND.map(([name, v, c], i) => makeBar({ color: c, w: 1.2, d: 1.2, label: name, x: -4.75 + i * 1.9, z: 0 }));
bars.forEach(b => { b.label.scale.set(2.3, 2.3 * 128 / 512, 1); b.val.scale.set(2.5, 2.5 * 128 / 512, 1); });
function barsOn(on) { bars.forEach(b => b.g.visible = on); }
const crowd = makeCrowd(150, 29, { w: 14, d: 7, x: 0, z: -1 });
const cSpark = makeSparkles(400, 0.22); stage.add(cSpark.points);
cSpark.init(crowd.people.map(p => [p.position.x, 1.0, p.position.z - 1]), 0.6, 2.2);
const qOrder = crowd.people.map((p, i) => ({ p, k: ((i * 37) % 150) / 150 }));
// footprints: a pale ring where each person stood (shows who is gone)
const ringG = new THREE.RingGeometry(0.22, 0.32, 16); ringG.rotateX(-Math.PI / 2);
const ringM = new THREE.MeshBasicMaterial({ color: 0xff8a7a, transparent: true, opacity: 0.55 });
const rings = crowd.people.map(p => { const m = new THREE.Mesh(ringG, ringM); m.position.set(p.position.x, 0.02, p.position.z); crowd.g.add(m); return m; });
function crowdOn(on) { crowd.g.visible = on; }

const SUBS = [
  [2.6, 6.0, 'いつもの朝。<br>お弁当工場のライン。'],
  [6.2, 10.0, 'まず困るのは、<br>毎日のお弁当だった。'],
  [10.1, 13.9, 'いちばん多いのは<br>工場で働く人。'],
  [14.2, 18.0, 'そのうち食べ物の工場は<br>20万人をこえる。'],
  [18.1, 21.9, 'おかずを詰める人がいない。<br>同じことが、街中で。'],
  [22.2, 26.0, 'お店でも、<br>レジに立つ人が消えた。'],
  [26.1, 29.9, '小売・卸だけで34万人。<br>でも、まだ序の口。'],
  [30.2, 34.6, '工事現場、飲食店、介護。<br>あらゆる職場から。'],
  [34.6, 38.9, '外国人を雇う職場は<br>37万か所超え。次は畑。'],
  [39.2, 43.6, '畑でも、<br>収穫する人が消えた。'],
  [43.6, 47.8, '実ったいちごが、<br>畑に残された。'],
  [48.1, 52.6, '結果：37万か所の職場から、<br>257万人の人手が消えた。'],
  [52.6, 55.4, '5年前は172万人。<br>約1.5倍に増えていた。'],
  [55.6, 59.4, 'あなたの職場にも、<br>外国人の同僚いる？'],
];

// ---------- shots ----------
function shot0(t, T) { // hook: giant number + some workers vanish at 0.5s（v2：0.6秒以内に消える）
  factoryAt(T, { tv: 0.5, signOn: false });
  el.flash.style.opacity = T >= 0.5 ? 0.45 * Math.max(0, 1 - (T - 0.5) / 0.3) : 0;
  const u = ease(T / 2.5);
  look(lerp(-1.2, -0.6, u), 3.0, lerp(6.6, 6.2, u), 0, 1.2, -1.6, 50);
  setTop('日本で働く外国人（2025年10月末）', '257万1,037人', 1);
  return factory;
}
function shot1(t, T) { // daily (rewind): everyone working
  factoryAt(t, { signOn: t > 0.5 });
  const u = ease(t / 3.5);
  el.title.style.opacity = clamp(1 - t / 0.4);
  look(lerp(3.5, 2.2, u), lerp(2.4, 2.6, u), lerp(4.2, 4.6, u), lerp(1.0, 0.4, u), 1.1, -1.4, 50);
  return factory;
}
function shot2(t, T) { // +1min: they are already gone (v2：冒頭の続き。ベルトもそのまま流れ続ける)
  factoryAt(t + 2.5, { tv: 0.5, signOn: false });
  const u = ease(t / 8);
  look(lerp(-0.6, 0.6, u), lerp(3.0, 3.4, u), lerp(6.4, 7.0, u), 0, 1.1, -1.8, 50);
  hudTime('+1分');
  setTop('製造業で働く外国人（2025年10月末）', jp(countUp(t, 635075, 0.4, 1.6)), fade(t, 0.15, 8, 0.25));
  return factory;
}
function shot3(t, T) { // +1h: trays come out missing a dish
  factoryAt(t + 40, { tv: 0 });
  const u = ease(t / 8);
  look(lerp(-2.6, -1.8, u), lerp(3.3, 3.1, u), lerp(4.4, 4.0, u), lerp(1.0, 1.6, u), 0.9, -0.6, 50);
  hudTime('+1時間');
  setTop('食料品の工場で働く外国人（2025年10月末）', jp(countUp(t, 203834, 0.3, 1.5)), fade(t, 0.15, 8, 0.25));
  return factory;
}
function shot4(t, T) { // +3h: market, 2 of 4 clerks vanish, queues stay
  lift(300);
  for (const q of queues) { q.p.visible = q.n < 3; q.p.userData.head.rotation.y = Math.sin(t * 1.3 + q.ph) * 0.3; }
  for (const s of shelfItems) s.it.visible = true;
  const gone = t >= 0.8;
  clerks.forEach((c, i) => c.visible = !(gone && (i === 1 || i === 2)));
  mSpark.set(gone ? clamp((t - 0.8) / 1.2) : 0);
  const u = ease(t / 8);
  look(lerp(-1, 1, u), lerp(8.5, 8.0, u), lerp(15, 14, u), lerp(-1, 0, u), 1.2, 0.5, 50);
  hudTime('+3時間');
  setTop('卸売・小売で働く外国人（2025年10月末）', jp(countUp(t, 340687, 0.3, 1.5)), fade(t, 0.15, 8, 0.25));
  return market;
}
function shot5(t, T) { // +1day: industries bars, all go to 0
  lift(380);
  crowdOn(false); barsOn(true); cSpark.set(0);
  const down = clamp((t - 4.6) / 2.4);
  bars.forEach((b, i) => {
    const v = IND[i][1];
    const up = easeOut(clamp((t - 0.2 - i * 0.12) / 1.0));
    const k = up * (1 - easeOut(clamp(down * 1.3 - i * 0.06)));
    b.setH(Math.max(0.001, v * K * k), k > 0.02 ? man10(v * k).replace('人', '') : '0');
  });
  const u = ease(t / 9);
  look(lerp(-0.2, 0.4, u), 5.6, lerp(26, 25.5, u), 0.2, 3.6, 0, 50);
  hudTime('+1日');
  if (t < 4.4) setTop('外国人が働く産業（2025年10月末）', '上位6つ', fade(t, 0.15, 4.4, 0.2));
  else setTop('外国人を雇う職場（2025年10月末）', comma(countUp(t - 4.4, 371215, 0.1, 1.4)) + 'か所', fade(t, 4.4, 9, 0.2));
  return stage;
}
function shot6(t, T) { // +1week: farm, farmers vanish, berries stay unpicked
  lift(320);
  setFieldEnv('day'); setFruit(1);
  const gone = t >= 0.6;
  farmers.forEach(f => { f.p.visible = !gone; f.p.userData.arms[0].rotation.x = -0.8 + Math.sin(t * 4 + f.ph) * 0.2; });
  farmSpark.set(gone ? clamp((t - 0.6) / 1.3) : 0);
  const u = ease(t / 8.8);
  look(lerp(7.5, 9.5, u), lerp(4.2, 3.8, u), lerp(13.5, 12.5, u), 9, 0.6, 3.6, 50);
  hudTime('+1週間');
  setTop('農業で働く外国人（2025年10月末）', jp(countUp(t, 64826, 0.6, 1.4)), fade(t, 0.15, 8.8, 0.25));
  return field;
}
function shot7(t, T) { // result: crowd vanishes
  lift(380);
  barsOn(false); crowdOn(true);
  const k = clamp((t - 0.4) / 3.0);
  qOrder.forEach((o, i) => { o.p.visible = o.k >= k; });
  rings.forEach((m, i) => m.visible = !crowd.people[i].visible);
  cSpark.set(t > 0.4 && t < 4.6 ? clamp((t - 0.4) / 4.2) : 0);
  const u = ease(t / 7.5);
  look(0, lerp(6.5, 7.5, u), lerp(18, 20, u), 0, 2.4, 0, 50);
  if (t < 4.5) setTop('いなくなった人手（2025年10月末）', jp(countUp(t, 2571037, 0.4, 3.0)), fade(t, 0.15, 4.5, 0.2), RED);
  else setTop('5年前（2021年10月末）', '172万7,221人', fade(t, 4.5, 7.5, 0.2), GOLD);
  return stage;
}
function shot8(t, T) { // loop: same factory framing as the hook, people still gone
  factoryAt(t + 80, { tv: 0, signOn: false });
  const u = ease(t / 4);
  look(lerp(-1.4, -1.2, u), 3.0, lerp(6.8, 6.6, u), 0, 1.2, -1.6, 50);
  return factory;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, dim: f => f === shot4 || f === shot6,
  cut: [[2.5, 6.0]], // v2：いつもの朝のライン（元の2.5〜6秒）を抜いて、消えた直後から本題へ
  meta: {
    id: '0029',
    v2: true,
    hookLine: '日本で働く外国人が、一斉に帰国した。',
    title: '外国人労働者257万人が一斉に帰国したら？',
    titleHtml: '外国人労働者が<br>一斉に帰国したら？', // v2：大きく出すので2行・1行9字以内に（人数は下の大きな数字で見せる）
    mood: 'tension', seed: 29, hits: [0.5, 48.1], risers: [6.0], sfx: [[0.5, 'poof']],
    ask: '職場に外国人の同僚いる？',
    narr: { '6万4,826人': '6万4826人' },
    caption: 'もしも日本で働く外国人257万人が一斉に帰国したら？\n2025年10月末、日本で働く外国人は257万1,037人で過去最多。いちばん多いのは製造業の63万5,075人で、うち食料品の工場は20万3,834人。外国人を雇う職場は37万1,215か所。工場、お店、畑の人手がどこで消えるのか、厚生労働省の統計で見てみた。5年前（2021年）は172万7,221人だった。\n\n職場に外国人の同僚いる？ コメントで教えて。\n\n出典：厚生労働省「外国人雇用状況」の届出状況まとめ（令和7年10月末時点）',
    hashtags: ['もしもラボ', '外国人労働者', '人手不足', '日本の仕事', '雑学'],
    endStats: [['日本で働く外国人', '257万1,037人', '2025年10月末'], ['製造業', '63万5,075人', '2025年10月末'], ['外国人を雇う職場', '37万1,215か所', '2025年10月末'], ['5年前', '172万7,221人', '2021年10月末']],
    sources: '出典：厚生労働省「外国人雇用状況」の届出状況まとめ<br>（令和7年10月末時点）',
  },
});
