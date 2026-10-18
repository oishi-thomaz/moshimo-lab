import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, makeQ, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, props } from '../scenes/room.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも30日間砂糖をやめたら？
// 数字：砂糖類 1人1年当たり供給純食料 16.6kg（令和7年度 概算）、1人1日当たり供給熱量 砂糖類 177.9kcal／合計 2,237.4kcal
//       （農林水産省 食料需給表 令和7年度、2026年8月公表：https://www.maff.go.jp/j/press/kanbo/anpo/attach/pdf/260807-1.pdf）
//       → 1日 約45.5g（16.6kg÷365・推計）、30日 約1,364g（推計）、供給熱量に占める割合 約8.0%（推計）
//       ※食料需給表は「供給量」で、実際に食べた量（摂取量）とは違う
//       WHO 遊離糖類は総エネルギーの10%未満、さらに5%未満（約25g・小さじ6杯）ならより良い（WHO 2015 ガイドライン／2015年3月4日 発表）
//       砂糖を減らした研究：33人、簡単な糖のカロリーの40%を置き換え、1か月後に低糖プリンを対照群より強く甘く、3か月後には対照群より約40%甘く感じた。好みの度合いは変わらず
//       （Wise PM ほか, American Journal of Clinical Nutrition 103(1), 2016）
// 体重・健康効果は言わない（根拠となる一次資料の数字で示せないため）

const RED = '#ff8a7a', GREEN = '#7ff0c8', GOLD = '#ffd98a';
const PER_DAY = 16.6 * 1000 / 365; // 45.48g
// ---------- kitchen dressing: table with sweets ----------
const KIT = new THREE.Group(); room.add(KIT);
const TBL = new THREE.Vector3(-0.3, 0.78, -1.55);
{
  const top = box(1.9, 0.06, 0.95, mat('#c99a6b')); top.position.set(TBL.x, TBL.y, TBL.z); KIT.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.07, 0.76, 0.07, mat('#8a6a4a')); l.position.set(TBL.x + sx * 0.85, 0.38, TBL.z + sz * 0.4); KIT.add(l); }
}
const SWEETS = new THREE.Group(); KIT.add(SWEETS);
const sweetPts = [];
function onTable(obj, x, z, y = 0) { obj.position.set(TBL.x + x, TBL.y + 0.03 + y, TBL.z + z); SWEETS.add(obj); sweetPts.push([obj.position.x, obj.position.y + 0.1, obj.position.z]); return obj; }
// soda bottles (generic colors, no labels)
[['#e0574f', -0.78, -0.25], ['#f2c14e', -0.62, -0.3], ['#4fa3d1', -0.7, -0.08]].forEach(([c, x, z]) => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.32, 12), mat(c, { transparent: true, opacity: 0.9 })); b.position.y = 0.16; g.add(b);
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, 0.08, 10), mat(c)); nk.position.y = 0.36; g.add(nk);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), mat('#f4f4f4')); cap.position.y = 0.415; g.add(cap);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.09, 12), mat('#ffffff')); band.position.y = 0.17; g.add(band);
  onTable(g, x, z);
});
// cake on a plate
{
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.02, 20), mat('#ffffff')); plate.position.y = 0.01; g.add(plate);
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 3, 1, false, 0, Math.PI * 2), mat('#fbeee0')); cake.position.y = 0.09; cake.rotation.y = 0.4; g.add(cake);
  const cream = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.03, 3), mat('#ffd0dc')); cream.position.y = 0.17; cream.rotation.y = 0.4; g.add(cream);
  const berry = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat('#e0352b')); berry.position.set(0, 0.21, 0); g.add(berry);
  onTable(g, -0.28, 0.15);
}
// donuts
for (const [x, z, c] of [[0.05, -0.2, '#f49ac1'], [0.2, -0.05, '#7a4a2a']]) {
  const d = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.045, 8, 16), mat(c)); d.rotation.x = -Math.PI / 2; onTable(d, x, z, 0.045);
}
// cookie jar
{
  const g = new THREE.Group();
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 16), mat('#dff1ff', { transparent: true, opacity: 0.45 })); jar.position.y = 0.15; g.add(jar);
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), mat('#c98a4a')); c.position.set(0, 0.03 + i * 0.045, 0); c.rotation.z = (i % 2 ? 0.15 : -0.15); g.add(c); }
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), mat('#e05a4f')); lid.position.y = 0.32; g.add(lid);
  onTable(g, 0.5, -0.25);
}
// candy bowl
{
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.08, 16), mat('#ffffff')); bowl.position.y = 0.04; g.add(bowl);
  const r = rng(25); const cc = ['#e0574f', '#f2c14e', '#7ff0c8', '#8e6bbf', '#4fa3d1'];
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), mat(cc[i % 5])); s.position.set((r() - .5) * 0.18, 0.09 + r() * 0.04, (r() - .5) * 0.18); g.add(s); }
  onTable(g, 0.55, 0.12);
}
// chocolate bars
for (const [x, z, rot] of [[0.25, 0.25, 0.3], [0.32, 0.18, -0.2]]) { const b = box(0.24, 0.025, 0.1, mat('#5a3420')); b.rotation.y = rot; onTable(b, x, z, 0.012 + (x > 0.3 ? 0.025 : 0)); }
const sweetSpark = makeSparkles(260, 0.07); KIT.add(sweetSpark.points); sweetSpark.init(sweetPts, 0.25, 0.8);
function sweetsOn(on) { SWEETS.visible = on; }
// person
const me = makePerson({ skin: SKIN[0], hair: HAIR[3], shirt: '#4fa3d1', pants: '#3b3f4a', long: true }); room.add(me);
me.position.set(0.55, 0, -2.45); me.rotation.y = -0.25;
const meQ = makeQ(); room.add(meQ);
// pudding (taste study)
const pud = new THREE.Group(); KIT.add(pud);
{
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.1, 14), mat('#eef6ff', { transparent: true, opacity: 0.6 })); cup.position.y = 0.05; pud.add(cup);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.085, 14), mat('#f6d27a')); p.position.y = 0.045; pud.add(p);
  const cara = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.06, 0.012, 14), mat('#8a4a1a')); cara.position.y = 0.094; pud.add(cara);
}
const pudSpark = makeSparkles(70, 0.05, 0xfff4b0); room.add(pudSpark.points);
// sugar bag (generic) + loose heap for the room (result)
function makeBag(scale = 1) {
  const g = new THREE.Group();
  const b = box(0.5, 0.75, 0.24, mat('#fbfbf8')); b.position.y = 0.375; g.add(b);
  const band = box(0.505, 0.18, 0.245, mat('#4fa3d1')); band.position.y = 0.43; g.add(band);
  const lab = textSprite('砂糖 1kg', { w: 512, h: 128, size: 76, color: '#ffffff', sx: 0.46 }); lab.position.set(0, 0.43, 0.13); lab.material.depthTest = true; g.add(lab);
  const top = box(0.5, 0.06, 0.12, mat('#e6e6e0')); top.position.y = 0.78; g.add(top);
  g.scale.setScalar(scale);
  return g;
}
function makeHeap(n, seed, size, spread) { // cone of sugar cubes
  const g = new THREE.Group(); const r = rng(seed); const cubes = [];
  const m = mat('#ffffff'); const geo = new THREE.BoxGeometry(size, size, size);
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(geo, m); c.castShadow = true; c.receiveShadow = true;
    const k = i / n; const rad = spread * Math.sqrt(1 - k) * Math.sqrt(r()); const a = r() * Math.PI * 2;
    c.position.set(Math.cos(a) * rad, size / 2 + k * spread * 0.9, Math.sin(a) * rad);
    c.rotation.set(r() * 0.4, r() * 3, r() * 0.4); g.add(c); cubes.push(c);
  }
  return { g, set(k) { cubes.forEach((c, i) => c.visible = i < Math.round(k * n)); } };
}
const roomBag = makeBag(0.8); roomBag.position.set(TBL.x - 0.25, TBL.y + 0.03, TBL.z - 0.05); room.add(roomBag);
const roomHeap = makeHeap(60, 7, 0.06, 0.2); roomHeap.g.position.set(TBL.x + 0.2, TBL.y + 0.03, TBL.z + 0.05); room.add(roomHeap.g);
function resultProps(on) { roomBag.visible = on; roomHeap.g.visible = on; roomHeap.set(1); }

// ---------- stage: daily heap ----------
setStageColor('#14213a');
const STG = {};
STG.day = makeHeap(150, 11, 0.42, 2.2); stage.add(STG.day.g);
STG.dayLab = makeLabel('1日分（推計）', { sx: 3.2, size: 60 }); STG.dayLab.position.set(0, 3.6, 0); stage.add(STG.dayLab);
// WHO bars
const K = 0.085; // 1g = 0.13 units
STG.bUs = makeBar({ color: '#f2c14e', label: 'いつもの量（推計）', x: -1.9, z: 0, w: 2.2, d: 2.2 });
STG.bWho = makeBar({ color: '#7fd4a8', label: 'WHOの目安', x: 1.9, z: 0, w: 2.2, d: 2.2 });
// ring chart: share of supplied calories
const RING = new THREE.Group(); RING.position.set(0, 4.6, 0); stage.add(RING);
const ringBg = new THREE.Mesh(new THREE.RingGeometry(2.0, 3.0, 64), new THREE.MeshBasicMaterial({ color: 0x2e426a, side: THREE.DoubleSide })); RING.add(ringBg);
let ringFg = null; const ringM = new THREE.MeshBasicMaterial({ color: 0xf2c14e, side: THREE.DoubleSide });
function setRing(frac) {
  if (ringFg) { RING.remove(ringFg); ringFg.geometry.dispose(); }
  ringFg = new THREE.Mesh(new THREE.RingGeometry(1.98, 3.02, 64, 1, Math.PI / 2 - Math.PI * 2 * frac, Math.PI * 2 * frac), ringM); ringFg.position.z = 0.01; RING.add(ringFg);
}
const ticks = [];
for (const [p, lab, c] of [[0.05, '5%', '#7ff0c8'], [0.10, '10%', '#ffffff']]) {
  const a = Math.PI / 2 - Math.PI * 2 * p;
  const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 1.4), new THREE.MeshBasicMaterial({ color: c })); tk.position.set(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0.02); tk.rotation.z = a - Math.PI / 2; RING.add(tk);
  const s = makeLabel(lab, { sx: 2.4, size: 80, color: c, stroke: 8 }); s.position.set(Math.cos(a) * 3.8 + 0.6, Math.sin(a) * 3.8 - 0.1, 0.05); RING.add(s); ticks.push(tk, s);
}
const ringLab = makeLabel('砂糖', { sx: 2.0, size: 80, color: GOLD, stroke: 8 }); ringLab.position.set(0, 0, 0.05); RING.add(ringLab);
// 30 days: bag + extra heap
const BAG30 = makeBag(3.2); BAG30.position.set(-1.6, 0.3, 0); stage.add(BAG30);
STG.extra = makeHeap(90, 21, 0.36, 1.3); STG.extra.g.position.set(1.9, 0.3, 0.4); stage.add(STG.extra.g);
STG.extraLab = makeLabel('+約364g', { sx: 2.6, size: 70, color: GOLD, stroke: 8 }); STG.extraLab.position.set(1.9, 2.6, 0.4); stage.add(STG.extraLab);
function stageAll(off) { STG.day.g.visible = STG.dayLab.visible = false; STG.bUs.g.visible = STG.bWho.g.visible = false; RING.visible = false; BAG30.visible = false; STG.extra.g.visible = STG.extraLab.visible = false; }

const SUBS = [
  [2.6, 6.0, 'いつもの台所。<br>甘いものが並ぶ。'],
  [6.2, 10.1, '日本の砂糖は、<br>1人1年16.6kg（供給量）'],
  [10.1, 14, '1日にすると、<br>約45.5g（推計）'],
  [14.2, 18.1, 'WHOの目安は、できれば<br>1日25gくらいまで。'],
  [18.1, 22, 'いつもの量は、<br>その約1.8倍（推計）'],
  [22.2, 26.1, '食べ物のカロリーのうち、<br>砂糖は約8%（推計）'],
  [26.1, 30, 'WHOの目安は10%未満。<br>できれば5%未満。'],
  [30.2, 34.6, '30日で口にしなかった<br>砂糖は…'],
  [34.6, 39, '約1.4kg（推計）<br>1kgの袋より多い。'],
  [39.2, 43.6, '砂糖を減らした<br>33人の研究では…'],
  [43.6, 47.8, '1か月で、減らした人の方が<br>プリンを甘く感じた。'],
  [48.1, 52.6, '結果：30日で砂糖約1.4kgを<br>口にしなかった。'],
  [52.6, 55.4, '1年続ければ、<br>16.6kg分になる。'],
  [55.6, 59.4, 'あなたが一番やめられない<br>甘いものは？'],
];

const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100 + 1e-6)).padStart(2, '0')}`;
function kitchen() { setRoom({ sets: ['kitchen'] }); setLight('day', { ceil: 3, hemi: 1.05 }); props.sleeper.visible = false; pud.visible = false; meQ.visible = false; resultProps(false); me.userData.arms[1].rotation.x = 0; me.userData.head.rotation.x = 0.15; }
function kitchenCam(u, z0 = 4.4, z1 = 4.0) { look(lerp(-0.5, -0.2, u), 2.35, lerp(z0, z1, u), 0.05, 1.15, -1.9, 52); }
function shot0(t, T) { // hook: countdown, sweets vanish at 1.2s
  lift(200); kitchen();
  const gone = T >= 1.2; sweetsOn(!gone); sweetSpark.set(gone ? clamp((T - 1.2) / 1.1) : 0);
  kitchenCam(ease(t / 2.5));
  el.title.style.opacity = 1;
  setHud('砂糖をやめるまで', cd(Math.max(0, 1.2 - T)), 1, { mono: true, color: gone ? RED : '#fff' });
  return room;
}
function shot1(t, T) { // usual kitchen (rewind)
  lift(240); kitchen(); sweetsOn(true); sweetSpark.set(0);
  me.userData.arms[1].rotation.x = -0.5 * Math.max(0, Math.sin(t * 1.4));
  look(lerp(-0.8, -0.4, ease(t / 3.5)), 2.4, lerp(4.1, 3.8, ease(t / 3.5)), 0.05, 1.05, -1.9, 52);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.4);
  return room;
}
function shot2(t, T) { // +1day: 45.5g a day
  lift(330); stageAll(); STG.day.g.visible = true; STG.day.set(easeOut(clamp((t - 0.3) / 3.0)));
  STG.dayLab.visible = t > 4.1;
  const u = ease(t / 8);
  look(lerp(-1.5, 1.0, u), lerp(5.2, 4.8, u), lerp(11.5, 10.5, u), 0, 1.4, 0, 50);
  hudTime('+1日');
  if (t < 4.1) setTop('1人1年あたりの砂糖（2025年度・供給量）', (countUp(t, 166, 0.3, 1.4) / 10).toFixed(1) + 'kg', fade(t, 0.15, 4.1, 0.2));
  else setTop('1人1日あたり（2025年度・推計）', '約' + (countUp(t - 4.1, 455, 0.1, 1.2) / 10).toFixed(1) + 'g', fade(t, 4.1, 8, 0.2), GOLD);
  return stage;
}
function shot3(t, T) { // +1week: WHO 25g vs 45.5g
  lift(300); stageAll(); STG.bUs.g.visible = STG.bWho.g.visible = true;
  const k = easeOut(clamp((t - 0.3) / 1.6));
  STG.bUs.setH(PER_DAY * K * k, k > 0.05 ? '約45.5g' : '');
  STG.bWho.setH(25 * K * k, k > 0.05 ? '約25g' : '');
  const u = ease(t / 8);
  look(lerp(-0.5, 0.5, u), 3.6, lerp(16.5, 15.8, u), 0, 2.4, 0, 50);
  hudTime('+1週間');
  if (t < 4.1) setTop('WHOがすすめる目安（1日・2015年）', '約' + countUp(t, 25, 0.3, 1.2) + 'g', fade(t, 0.15, 4.1, 0.2), GREEN);
  else setTop('目安とくらべると（推計）', '約' + (countUp(t - 4.1, 18, 0.1, 1.0) / 10).toFixed(1) + '倍', fade(t, 4.1, 8, 0.2), GOLD);
  return stage;
}
function shot4(t, T) { // +2weeks: share of calories
  lift(240); stageAll(); RING.visible = true;
  setRing(0.08 * easeOut(clamp((t - 0.3) / 1.8)));
  const u = ease(t / 8);
  look(lerp(-0.5, 0.5, u), 4.8, lerp(17.5, 16.8, u), 0, 4.2, 0, 50);
  hudTime('+2週間');
  if (t < 4.1) setTop('供給カロリーのうち砂糖（2025年度・推計）', (countUp(t, 80, 0.3, 1.6) / 10).toFixed(1) + '%', fade(t, 0.15, 4.1, 0.2), GOLD);
  else setTop('WHOの目安（2015年）', '10%未満', fade(t, 4.1, 8, 0.2), GREEN);
  return stage;
}
function shot5(t, T) { // +30days: total 1.4kg
  lift(330); stageAll(); BAG30.visible = true;
  BAG30.scale.setScalar(3.2 * easeBack(clamp((t - 0.2) / 0.6)));
  STG.extra.g.visible = t > 4.4; STG.extra.set(easeOut(clamp((t - 4.4) / 1.6))); STG.extraLab.visible = t > 5.4;
  const u = ease(t / 9.2);
  look(lerp(-1.2, 0.8, u), 4.6, lerp(12.5, 11.8, u), 0.2, 1.7, 0, 50);
  hudTime('+30日');
  setTop('30日分の砂糖（2025年度ペース・推計）', comma(countUp(t, 1364, 0.3, 4.6)) + 'g', fade(t, 0.15, 9.2, 0.25), GOLD);
  return stage;
}
function shot6(t, T) { // study: pudding tastes sweeter
  lift(420); kitchen(); sweetsOn(false); sweetSpark.set(0);
  pud.visible = true;
  const hand = me.userData.arms[1]; hand.rotation.x = -1.35 * easeOut(clamp(t / 0.8)); me.userData.head.rotation.x = 0.35;
  const hp = new THREE.Vector3(); hand.children[1].getWorldPosition(hp);
  pud.position.set(hp.x, hp.y + 0.04, hp.z + 0.05);
  const sk = clamp((t - 4.4) / 1.5); if (sk === 0 || sk >= 1) pudSpark.set(0); else { pudSpark.init([[pud.position.x, pud.position.y + 0.1, pud.position.z]], 0.15, 0.5); pudSpark.set(sk); }
  meQ.visible = t > 1.0 && t < 4.4; meQ.position.set(me.position.x, 2.25, me.position.z); meQ.scale.setScalar(0.5 * easeBack(clamp((t - 1.0) / 0.3)));
  const u = ease(t / 8.8);
  look(lerp(0.2, 0.45, u), 2.25, lerp(0.6, 0.3, u), 0.55, 1.5, -2.45, 50);
  setHud('研究では', '1か月後', 1);
  if (t < 4.4) setTop('砂糖を減らした研究の参加者（2016年発表）', countUp(t, 33, 0.3, 1.2) + '人', fade(t, 0.15, 4.4, 0.2));
  else setTop('3か月後・減らさない人と比べて（2016年発表）', '約' + countUp(t - 4.4, 40, 0.1, 1.2) + '%甘く', fade(t, 4.4, 8.8, 0.2), GOLD);
  return room;
}
function shot7(t, T) { // result: empty table, bag + heap
  lift(240); kitchen(); sweetsOn(false); sweetSpark.set(0); resultProps(true);
  roomBag.scale.setScalar(0.8 * easeBack(clamp((t - 0.3) / 0.5)));
  const u = ease(t / 7.4);
  look(lerp(-0.5, -0.2, u), lerp(2.4, 2.2, u), lerp(3.6, 3.1, u), 0.0, 1.05, -1.9, 52);
  hudTime('+30日');
  if (t < 4.5) setTop('30日で口にしなかった砂糖（推計）', '約' + (countUp(t, 14, 0.2, 1.2) / 10).toFixed(1) + 'kg', fade(t, 0.15, 4.5, 0.2), GOLD);
  else setTop('1年なら（2025年度）', (countUp(t - 4.5, 166, 0.1, 1.0) / 10).toFixed(1) + 'kg', fade(t, 4.5, 7.4, 0.2));
  return room;
}
function shot8(t, T) { // loop: same as hook, sweets gone
  lift(200); kitchen(); sweetsOn(false); sweetSpark.set(0);
  kitchenCam(ease(t / 4) * 0.3);
  setHud('砂糖をやめて', '30日目', 1);
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, dim: f => f === shot0 || f === shot1 || f === shot6 || f === shot7 || f === shot8,
  meta: {
    id: '0025',
    title: '30日間砂糖をやめたら？',
    titleHtml: '30日間<br>砂糖をやめたら？',
    mood: 'hopeful', seed: 25, hits: [1.2, 48.1], risers: [30.2],
    ask: '一番やめられない甘いものは？',
    narr: { '16.6kg': '16.6キロ', '45.5g': '45.5グラム', '25g': '25グラム', '1.4kg': '1.4キロ', '1kg': '1キロ', 'WHO': 'ダブリューエイチオー', '1.8倍': '1.8ばい' },
    caption: 'もしも30日間砂糖をやめたら？\n日本の砂糖の供給量は1人1年16.6kg（2025年度）。1日にすると約45.5g、WHOがすすめる「できれば1日25gくらい」の約1.8倍（推計）。30日やめると、約1.4kgの砂糖を口にしなかった計算に。砂糖を減らした33人の研究では、1か月で、減らした人の方がプリンを甘く感じたという結果も。\n※食料需給表の数字は供給量で、実際に食べた量とは違います。健康の効果を示すものではありません。\n\nあなたが一番やめられない甘いものは？ コメントで教えて。\n\n出典：農林水産省 食料需給表（令和7年度概算）、WHO Guideline: Sugars intake for adults and children（2015）、Wise ほか American Journal of Clinical Nutrition（2016）',
    hashtags: ['もしもラボ', '砂糖断ち', 'シュガーデトックス', '30日チャレンジ', '雑学'],
    endStats: [['砂糖の供給量（1人1年）', '16.6kg', '2025年度'], ['1日あたり（推計）', '約45.5g', '2025年度'], ['WHOの目安（できれば）', '1日約25g', '2015年'], ['30日でやめた砂糖（推計）', '約1.4kg', '2025年度ペース']],
    sources: '出典：農林水産省 食料需給表（令和7年度概算）、<br>WHO 砂糖の摂取に関するガイドライン（2015年）、<br>Wise ほか American Journal of Clinical Nutrition（2016年）',
  },
});
