import * as THREE from 'three';
import { clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, props, sets } from '../scenes/room.js';
import { stage, makeBar, setStageColor, stageDisc } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも1か月お酒をやめたら？（blueprint no 207・人体の限界シリーズ）
// 数字（すべて一次資料で確認）：
//  Mehta et al., "Short-term abstinence from alcohol and changes in cardiovascular risk factors, liver function tests
//   and cancer-related growth factors: a prospective observational study", BMJ Open 2018;8:e020673
//   https://bmjopen.bmj.com/content/8/5/e020673 ／ https://pubmed.ncbi.nlm.nih.gov/29730627/
//   ・1か月やめた人 94人／飲み続けた人 47人（ふだん男性 週64g超・女性 週48g超を飲む健康な人。やめた群の平均は週258.2g）
//   ・やめた人の変化（中央値）：インスリン抵抗性（HOMA）−25.9%、上の血圧 −6.6%、体重 −1.5%、γ-GTP −28.6%（p<0.001）
//   ・飲み続けた人：主な項目に有意な変化なし（"No significant changes from baseline ... in the control group"）
//  ・60kg×1.5%＝0.9kg（単純計算）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- open fridge (kitchen) ----------
const FR = new THREE.Group(); room.add(FR);
const FX = 2.3, FZ = -2.75;
{
  const w = mat('#f4f5f7'), inner = mat('#eef6fb', { emissive: 0xcfe8ff, emissiveIntensity: 0.35 });
  const back = box(1.15, 2.05, 0.06, inner); back.position.set(0, 1.03, -0.36); FR.add(back);
  for (const s of [-1, 1]) { const sd = box(0.06, 2.05, 0.78, w); sd.position.set(s * 0.6, 1.03, 0); FR.add(sd); }
  const tp = box(1.26, 0.06, 0.78, w); tp.position.set(0, 2.08, 0); FR.add(tp);
  const bt = box(1.26, 0.14, 0.78, w); bt.position.set(0, 0.07, 0); FR.add(bt);
  const drawer = box(1.1, 0.34, 0.7, mat('#dfe7ee', { transparent: true, opacity: 0.85 })); drawer.position.set(0, 0.32, 0.02); FR.add(drawer);
  for (const y of [0.55, 1.0, 1.45]) { const sh = box(1.12, 0.025, 0.66, mat('#cfe3f0', { transparent: true, opacity: 0.8 })); sh.position.set(0, y, 0.0); FR.add(sh); }
  // door, hinged on the right edge, swung open toward the camera-right
  const hinge = new THREE.Group(); hinge.position.set(0.62, 0, 0.4); FR.add(hinge);
  const door = box(1.22, 2.0, 0.08, w); door.position.set(-0.61, 1.05, 0); hinge.add(door);
  const pocket = box(1.05, 0.12, 0.14, mat('#d5e4ee')); pocket.position.set(-0.61, 0.8, -0.1); hinge.add(pocket);
  hinge.rotation.y = 1.95;
}
FR.position.set(FX, 0, FZ);
sets.kitchen.children.forEach(c => { if (c.position.x > 1.9) c.visible = false; }); // 元の冷蔵庫（取っ手・線）を隠して、開いた冷蔵庫に置きかえる
const fLight = new THREE.PointLight(0xdcefff, 0, 3.0, 1.4); fLight.position.set(FX, 1.2, FZ + 0.6); room.add(fLight);
// cans: 3 shelves × 7 (generic gold/silver, no brand)
const canGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.16, 12);
const canM = [mat('#d9b44a'), mat('#c7ccd3'), mat('#d9b44a')], bandM = mat('#3d6fb0');
const cans = [];
for (const [si, y] of [[0, 0.55], [1, 1.0], [2, 1.45]]) for (let i = 0; i < 7; i++) {
  const c = new THREE.Group(); const b = new THREE.Mesh(canGeo, canM[si]); c.add(b);
  const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.05, 12), si === 1 ? mat('#2f8a5a') : bandM); c.add(bd);
  c.scale.setScalar(1.3); c.position.set(-0.45 + i * 0.15, y + 0.11, 0.12 - (i % 2) * 0.12); FR.add(c); cans.push(c);
}
// tea / water bottles (after)
const bottles = [];
for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10), mat(i % 2 ? '#bfe6ff' : '#b8d68a', { transparent: true, opacity: 0.9 })); b.position.set(-0.36 + i * 0.18, 1.18, 0.05); FR.add(b); bottles.push(b); }
const canSpark = makeSparkles(260, 0.06); room.add(canSpark.points);
canSpark.init(cans.map(c => { const v = c.position.clone(); return [v.x + FX, v.y, v.z + FZ]; }), 0.1, 0.6);
function setCans(on) { cans.forEach(c => c.visible = on); }
function setBottles(on) { bottles.forEach(b => b.visible = on); }

const you = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#3f8f6b', pants: '#2b3346', scale: 1 }); room.add(you);
function youAt(x, z, ry, t, look = 0) { you.visible = true; you.position.set(x, 0, z); you.rotation.set(0, ry, 0); const U = you.userData; U.legs.forEach(l => l.rotation.x = 0); U.arms[0].rotation.set(0, 0, 0.05); U.arms[1].rotation.set(-0.15 - Math.sin(t * 1.3) * 0.04, 0, -0.05); U.head.rotation.set(look, Math.sin(t * 0.7) * 0.08, 0); }
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 10), mat('#e46a5b')); mug.position.set(0, -0.68, 0.06); you.userData.arms[1].add(mug); mug.visible = false;

function kitchen(light = 'evening', opt = { ceil: 9, hemi: 0.9 }) {
  setRoom({ sets: ['kitchen'] }); setLight(light, opt); props.fridge.visible = false;
  FR.visible = true; fLight.intensity = 1.6; canSpark.set(0); mug.visible = false; liver.visible = false; livTag.visible = false; you.visible = false;
}

// ---------- liver (on the body) ----------
const liver = new THREE.Group(); room.add(liver);
const livM = new THREE.MeshLambertMaterial({ color: '#b5413a', emissive: 0x8a1a10, emissiveIntensity: 0.5, flatShading: true });
{ const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), livM); a.scale.set(1.3, 0.55, 0.6); a.position.x = -0.05; liver.add(a); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), livM); b.scale.set(1.1, 0.5, 0.55); b.position.set(0.17, -0.02, 0.01); liver.add(b); }
liver.renderOrder = 6; liver.traverse(o => { if (o.material) { o.material.depthTest = false; } o.renderOrder = 6; });
const livTag = textSprite('肝臓', { w: 384, h: 140, size: 78, bg: 'rgba(181,65,58,.92)', sx: 0.62 }); livTag.material.depthTest = false; livTag.renderOrder = 8; room.add(livTag);
function setLiver(k, t) { // k: 0 = strained (red) .. 1 = calmer
  liver.visible = true; livTag.visible = true;
  const v = new THREE.Vector3(); you.localToWorld(v.set(-0.05, 1.12, 0.16)); liver.position.copy(v); liver.rotation.y = you.rotation.y;
  livM.color.set(new THREE.Color('#b5413a').lerp(new THREE.Color('#c9785a'), k));
  livM.emissiveIntensity = lerp(0.75 + Math.sin(t * 6) * 0.15, 0.15, k);
  livTag.position.set(v.x + 0.55, v.y - 0.32, v.z + 0.35);
}

// ---------- stage: 4 bars, 100 → after 1 month ----------
const METRICS = [['上の血圧', 6.6], ['体重', 1.5], ['インスリン', 25.9], ['γ-GTP（肝臓）', 28.6]];
const H0 = 5.6;
const bars = METRICS.map(([lab, d], i) => makeBar({ color: i === 3 ? '#c9785a' : i === 2 ? '#e0a94a' : '#4fa3d1', w: 1.5, d: 1.5, label: lab.replace('<br>', ''), x: -4.8 + i * 3.2, z: 0, nameTop: true }));
const ghosts = METRICS.map((m, i) => { const g = box(1.55, H0, 1.55, new THREE.MeshLambertMaterial({ color: '#9aa7c2', transparent: true, opacity: 0.18, depthWrite: false })); g.position.set(-4.8 + i * 3.2, 0.3 + H0 / 2, 0); stage.add(g); return g; });
const stTitle = textSprite('1か月やめる前を100%とすると', { w: 1024, h: 128, size: 60, sx: 9 }); stTitle.position.set(0, 8.7, -1); stage.add(stTitle);
// k[i]: 0 = 100% … 1 = after
function setBars(k, show = true) {
  bars.forEach((b, i) => { const d = METRICS[i][1]; const kk = clamp(k[i] ?? 0); b.g.visible = show; b.setH(H0 * (1 - d / 100 * ease(kk)), kk > 0.02 ? '−' + (d * ease(kk)).toFixed(1) + '%' : '100%'); ghosts[i].visible = show && kk > 0.02; });
  stTitle.visible = show;
}

const SUBS = [
  [2.6, 6.0, '体の数字が4つ動いた。<br>一番大きいのは最後。'],
  [6.2, 10.1, '調べたのは、ふだん飲む<br>健康な大人94人。'],
  [10.1, 14, '1か月、1滴も飲まない。<br>まず下がったのは血圧。'],
  [14.2, 18.1, '上の血圧が、<br>6.6%下がった。'],
  [18.1, 22, '体重も1.5%減った。<br>でも本番はここから。'],
  [22.2, 26.1, '血糖を下げるインスリン。<br>その効きにくさは…'],
  [26.1, 30, '25.9%下がった。<br>でも、まだ一番じゃない。'],
  [30.2, 34.6, '一番動いたのは、<br>肝臓の数値だった。'],
  [34.6, 39, '肝臓の負担の目安γ-GTPが、<br>28.6%下がった。'],
  [39.2, 43.6, '血圧・体重・血糖・肝臓。<br>4つ全部が下がった。'],
  [43.6, 47.8, 'たった1か月で、<br>ここまで動いた。'],
  [48.1, 53.8, '結果：1か月の禁酒で、<br>肝臓の数値は約3割下がった。'],
  [53.9, 56.1, '飲み続けた人は変化なし。'],
  [56.2, 59.4, '次に1か月やめて<br>ほしいものは？'],
];

const TP = 0.5;
const dayHud = (d, col) => setHud('お酒をやめて', d + '日目', 1, { color: col || '#fff' });
function fridgeCam(t, d, a, b, tg = [FX - 0.1, 1.2, FZ]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
const HOOK_A = [FX - 0.55, 1.25, 2.65], HOOK_B = [FX - 0.5, 1.2, 2.3];
function shot0(t) { // hook: fridge full of cans → 0.5s they all vanish
  lift(195);
  kitchen();
  setCans(t < TP); setBottles(false);
  youAt(FX - 1.45, -2.3, 1.1, t, 0.05);
  canSpark.set(t >= TP ? (t - TP) / 1.4 : 0);
  el.flash.style.opacity = t >= TP ? 0.5 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  fridgeCam(t, 2.5, HOOK_A, HOOK_B);
  dayHud(t < TP ? 0 : 1, t < TP ? '#fff' : GREEN);
  return room;
}
function shot1(t) { // days 1 → 7, fridge stays empty; 94 people
  lift(200);
  kitchen(); setCans(false); setBottles(t > 3.2);
  canSpark.set(t < 1.6 ? (t + 2.0) / 3.6 : 0);
  youAt(FX - 1.35, -1.85, 1.0, t + 2, 0.1);
  fridgeCam(t, 7.6, HOOK_B, [FX - 2.4, 1.8, 2.4]);
  dayHud(1 + Math.floor(clamp(t / 7) * 6));
  setTop('1か月やめた人（英国の研究・2018年）', countUp(t - 3.7, 94, 0.1, 1.0) + '人', fade(t, 3.75, 7.6, 0.25), BLUE);
  return room;
}
function stageCam(t, d, x0, x1, z0 = 20, z1 = 19) { const u = ease(t / d); look(lerp(x0, x1, u), 5.0, lerp(z0, z1, u), lerp(x0, x1, u), 4.2, 0, 50); }
function shot2(t) { // stage: blood pressure, then weight
  setStageColor('#14213a'); stageDisc.visible = true;
  const k = [clamp((t - 4.4) / 1.4), clamp((t - 8.3) / 1.4), 0, 0]; setBars(k);
  stageCam(t, 11.9, -0.3, 0, 27, 25.5);
  lift(120);
  dayHud(30);
  if (t < 4.1) setTop('1か月やめた人（中央値・2018年）', '4つの数字', fade(t, 0.3, 4.1, 0.25), GOLD);
  else if (t < 8.0) setTop('上の血圧（中央値・2018年）', '−6.6%', fade(t, 4.1, 8.0, 0.25), BLUE);
  else setTop('体重（中央値・2018年）', '−1.5%', fade(t, 8.0, 11.9, 0.25), BLUE);
  return stage;
}
function shot3(t) { // stage: insulin resistance
  setStageColor('#14213a'); stageDisc.visible = true;
  setBars([1, 1, clamp((t - 4.3) / 1.4), 0]);
  stageCam(t, 8.2, 0, 0.3, 25.5, 24.5);
  lift(120);
  dayHud(30);
  if (t > 4.1) setTop('インスリンの効きにくさ（中央値・2018年）', '−' + (countUp(t, 259, 4.3, 1.2) / 10).toFixed(1) + '%', fade(t, 4.1, 8.2, 0.25), GOLD);
  return stage;
}
function shot4(t) { // body: the liver calms down
  lift(220);
  kitchen('day', { ceil: 6, hemi: 1.05 }); setCans(false); setBottles(true); FR.visible = true;
  youAt(-0.2, -0.6, 0.35, t, -0.05); mug.visible = true; you.userData.arms[1].rotation.set(-1.0, 0, -0.1);
  setLiver(ease(clamp((t - 4.8) / 2.0)), t);
  const u = ease(t / 9); look(lerp(-1.3, -1.0, u), lerp(1.7, 1.6, u), lerp(3.4, 2.9, u), 0.0, 1.2, -0.7, 46);
  dayHud(30);
  if (t > 4.4) setTop('γ-GTP（肝臓の数値・中央値・2018年）', '−' + (countUp(t, 286, 4.8, 1.2) / 10).toFixed(1) + '%', fade(t, 4.4, 9, 0.25), RED);
  return room;
}
function shot5(t) { // stage: all four
  setStageColor('#14213a'); stageDisc.visible = true;
  setBars([1, 1, 1, 1]);
  const u = ease(t / 8.8); look(lerp(0, 0.2, u), lerp(5.4, 5.6, u), lerp(27, 26, u), 0, 4.4, 0, 50);
  lift(120);
  dayHud(30);
  if (t < 4.4) setTop('1か月で下がった数字（中央値・2018年）', '4つ全部', fade(t, 0.3, 4.4, 0.25), GREEN);
  else setTop('一番動いた数字（γ-GTP・2018年）', '−28.6%', fade(t, 4.4, 8.8, 0.25), RED);
  return stage;
}
function shot6(t) { // result: the liver at ease, morning
  lift(220);
  kitchen('day', { ceil: 6, hemi: 1.1 }); setCans(false); setBottles(true);
  youAt(-0.2, -0.6, 0.35, t, -0.05); mug.visible = true; you.userData.arms[1].rotation.set(-1.0, 0, -0.1);
  setLiver(1, t);
  const u = ease(t / 7.5); look(lerp(-1.0, -1.4, u), lerp(1.6, 1.75, u), lerp(2.9, 3.6, u), 0.0, 1.2, -0.7, 46);
  const a = t < 3.6;
  setTop(a ? 'γ-GTP（肝臓の数値・中央値・2018年）' : 'インスリンの効きにくさ（中央値・2018年）', a ? '−28.6%' : '−25.9%', fade(t, 0.15, 7.5, 0.25), a ? RED : GOLD);
  return room;
}
function shot7(t) { // loop: same framing as the hook, fridge without beer
  lift(195);
  kitchen(); setCans(false); setBottles(true);
  youAt(FX - 1.45, -2.3, 1.1, t, 0.05);
  fridgeCam(t, 4, HOOK_B, HOOK_A);
  dayHud(30, GREEN);
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 10.1, f: shot1 }, { a: 10.1, b: 22, f: shot2 }, { a: 22, b: 30.2, f: shot3 },
  { a: 30.2, b: 39.2, f: shot4 }, { a: 39.2, b: 48, f: shot5 }, { a: 48, b: 55.5, f: shot6 }, { a: 55.5, b: 59.5, f: shot7 },
  { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0207',
    v2: true,
    hookLine: '冷蔵庫のお酒が、一瞬で消えた。',
    series: '人体の限界',
    hookType: 'H4',
    cat: '体・健康',
    title: '1か月お酒をやめたら？',
    titleHtml: '1か月お酒を<br>やめたら？',
    mood: 'hopeful', seed: 207, hits: [0.5, 48.1], risers: [30.2], impacts: [14.6, 26.4, 35.0],
    sfx: [[0.5, 'poof']],
    narr: { 'γ-GTP': 'ガンマジーティーピー', '6.6%': '6.6パーセント', '1.5%': '1.5パーセント', '25.9%': '25.9パーセント', '28.6%': '28.6パーセント', '94人': '94にん', '1滴': 'いってき', '約3割': 'やく3わり' },
    ask: '次に1か月やめてほしいものは？',
    caption: 'もしも1か月お酒をやめたら、体の数字はどうなる？\nイギリスの研究（BMJ Open 2018年）で、ふだんお酒を飲む健康な大人94人が1か月禁酒すると、真ん中の値で上の血圧が6.6%、体重が1.5%、インスリンの効きにくさが25.9%、肝臓の数値（γ-GTP）が28.6%下がった。\n飲み続けた47人には、はっきりした変化はなかった。\nたった1か月で、4つの数字が全部下がった。\n※お酒をやめると体調が悪くなる・やめられない人は、自己判断せず医療機関に相談を。\n\n次に1か月やめてほしいものは？ コメントで教えて。\n\n出典：Mehta ほか BMJ Open（2018年）',
    hashtags: ['もしもラボ', '禁酒', 'お酒', '肝臓', '雑学'],
    endStats: [['γ-GTP（肝臓）', '−28.6%', '中央値'], ['インスリンの効きにくさ', '−25.9%', '中央値'], ['上の血圧', '−6.6%', '中央値'], ['体重', '−1.5%', '中央値'], ['調べた人数', '94人', '飲み続けた47人と比較']],
    sources: '出典：Mehta ほか BMJ Open（2018年）<br>1か月禁酒した94人の変化',
  },
});
