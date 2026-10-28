import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { stage, makeLabel, setStageColor } from '../scenes/stage.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界中のクラミジア菌が消えたら？（絶滅ボタンシリーズ・v2）
// 数字：
//  ・世界の新しい感染：2020年に約1億2,850万人（15〜49歳）（WHO ファクトシート Chlamydia）
//  ・日本の性器クラミジア：2024年 29,795件（暫定値・定点報告。性感染症の定点4疾患で最多）、梅毒14,663件（全数）、淋菌8,789件（定点）（厚生労働省 性感染症報告数）
//    ※定点報告は決められた医療機関だけの数なので、実際の感染はもっと多い
//  ・症状が出ない人：女性の約8割、男性の約半数（大阪市 性器クラミジア啓発リーフレット 令和6年）
//  ・放っておくと不妊症や子宮外妊娠の原因（大阪市リーフレット、WHO）。妊娠中の感染で赤ちゃんの目の感染・肺炎（WHO）
//  ・予防はコンドーム、治療は抗菌薬で治る（厚生労働省、WHO）
//  ・トラコーマ：クラミジア・トラコマティス（同じ菌の仲間）が原因の目の病気。約190万人が失明・視力障害。感染による失明の原因で世界1位（WHO ファクトシート Trachoma）
// 50対50に割れる質問で終える（ゆうと 2026/10/28）

const RED = '#ff8a7a', GOLD = '#ffd27a', GREEN = '#7ff0c8', BLUE = '#7fd4ff', PINK = '#ff9ec7';

// ---------- lab: petri dish full of bacteria + red button ----------
const LAB = new THREE.Group(); stage.add(LAB);
const dish = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.18, 48), mat('#d8eef6', { transparent: true, opacity: 0.55 })); dish.position.y = 0.4; LAB.add(dish);
const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.07, 8, 48), mat('#eaf6fb')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.5; LAB.add(rim);
const agar = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.06, 48), mat('#f2e6b8')); agar.position.y = 0.46; LAB.add(agar);
const NB = 160;
const bugM = mat('#5fd36a', { emissive: 0x1d5a22, emissiveIntensity: 0.5 });
const bugs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 10, 8), bugM, NB); LAB.add(bugs);
const bugPos = [];
{ const r = rng(620); for (let i = 0; i < NB; i++) { const c = Math.floor(i / 8), a = r() * 6.28, d = Math.sqrt(r()) * 2.1; const cx = Math.cos(c * 2.4) * (0.4 + (c % 5) * 0.4), cz = Math.sin(c * 2.4) * (0.4 + (c % 5) * 0.4); bugPos.push(new THREE.Vector3(clamp(cx + Math.cos(a) * 0.25 * r(), -2.2, 2.2), 0.56, clamp(cz + Math.sin(a) * 0.25 * r(), -2.2, 2.2))); void d; } }
const _m = new THREE.Matrix4();
function setBugs(k, t = 0) { for (let i = 0; i < NB; i++) { const s = Math.max(0.0001, k) * (1 + 0.12 * Math.sin(t * 3 + i)); _m.makeScale(s, s, s).setPosition(bugPos[i]); bugs.setMatrixAt(i, _m); } bugs.instanceMatrix.needsUpdate = true; bugs.visible = k > 0.001; }
const btn = makeXButton({ label: 'クラミジア絶滅ボタン' }); btn.position.set(0, 0.3, 3.4); btn.scale.setScalar(1.9); LAB.add(btn);
const bSpark = makeSparkles(400, 0.16, 0xb8ffbf); stage.add(bSpark.points);
// other germs left behind (syphilis spirals = purple, gonococci pairs = yellow)
const OTHERS = new THREE.Group(); LAB.add(OTHERS);
{ const r = rng(7); const spM = mat('#b07ae0', { emissive: 0x3a1a5a, emissiveIntensity: 0.4 }); const gcM = mat('#f2c84a', { emissive: 0x5a4a10, emissiveIntensity: 0.4 });
  for (let i = 0; i < 9; i++) { const curve = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, k) => new THREE.Vector3(k * 0.07, Math.sin(k * 1.6) * 0.06, Math.cos(k * 1.6) * 0.06))); const sp = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.025, 6), spM); sp.position.set(-1.8 + r() * 1.6, 0.6, -1.4 + r() * 2.8); sp.rotation.y = r() * 6; OTHERS.add(sp); }
  for (let i = 0; i < 10; i++) { const p = new THREE.Group(); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), gcM); b.scale.set(0.8, 1, 1); b.position.x = s * 0.075; p.add(b); } p.position.set(0.3 + r() * 1.6, 0.58, -1.4 + r() * 2.8); p.rotation.y = r() * 6; OTHERS.add(p); } }
const othLab1 = makeLabel('梅毒', { sx: 1.6, size: 80, color: '#d6b4ff', stroke: 8, w: 384 }); othLab1.position.set(-1.0, 1.6, -0.2); OTHERS.add(othLab1);
const othLab2 = makeLabel('淋菌', { sx: 1.6, size: 80, color: '#ffe08a', stroke: 8, w: 384 }); othLab2.position.set(1.1, 1.6, -0.2); OTHERS.add(othLab2);

// ---------- eye (trachoma) ----------
const EYE = new THREE.Group(); stage.add(EYE); EYE.position.set(0, 2.6, 0);
const ball = new THREE.Mesh(new THREE.SphereGeometry(1.6, 40, 28), mat('#f7f4ef')); EYE.add(ball);
const iris = new THREE.Mesh(new THREE.CircleGeometry(0.72, 40), mat('#3f7fbf')); iris.position.z = 1.58; EYE.add(iris);
const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), mat('#111')); pupil.position.z = 1.59; EYE.add(pupil);
const shine = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: 0xffffff })); shine.position.set(0.22, 0.22, 1.6); EYE.add(shine);
const fogM = new THREE.MeshBasicMaterial({ color: 0xd8dde3, transparent: true, opacity: 0 });
const fog = new THREE.Mesh(new THREE.CircleGeometry(0.85, 40), fogM); fog.position.z = 1.61; EYE.add(fog);
const lidM = mat('#e8b98f');
const lidT = new THREE.Mesh(new THREE.SphereGeometry(1.66, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.32), lidM); EYE.add(lidT);
const lidB = new THREE.Mesh(new THREE.SphereGeometry(1.66, 40, 20, 0, Math.PI * 2, Math.PI * 0.7, Math.PI * 0.3), lidM); EYE.add(lidB);
const eyeBugs = Array.from({ length: 18 }, (_, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), bugM); const a = i / 18 * 6.28; b.position.set(Math.cos(a) * (0.9 + (i % 3) * 0.12), Math.sin(a) * (0.9 + (i % 3) * 0.12) * 0.7, 1.55); EYE.add(b); return b; });
const eyeLab = makeLabel('トラコーマ', { sx: 2.8, size: 80, color: '#ffffff', bg: 'rgba(20,24,34,.85)' }); eyeLab.position.set(0, 4.4, 0.5); stage.add(eyeLab);

// ---------- people: who has no symptoms ----------
const PEOPLE = new THREE.Group(); stage.add(PEOPLE);
const women = [], men = [];
{ const r = rng(3); for (let i = 0; i < 10; i++) { const w = makePerson({ skin: SKIN[i % SKIN.length], hair: HAIR[i % HAIR.length], shirt: '#e07aa0', pants: '#3b3f4a', long: true, skirt: i % 2 === 0, scale: 0.8 }); w.position.set(-3.6 + i * 0.8, 0.3, -0.9); PEOPLE.add(w); women.push(w); }
  for (let i = 0; i < 10; i++) { const m = makePerson({ skin: SKIN[(i + 2) % SKIN.length], hair: HAIR[(i + 1) % HAIR.length], shirt: '#4f8fd9', pants: '#2d3446', scale: 0.82 }); m.position.set(-3.6 + i * 0.8, 0.3, 1.0); PEOPLE.add(m); men.push(m); } void r; }
const wLab = makeLabel('女性', { sx: 1.4, size: 80, color: PINK, stroke: 8, w: 256 }); wLab.position.set(-4.6, 1.4, -0.9); PEOPLE.add(wLab);
const mLab = makeLabel('男性', { sx: 1.4, size: 80, color: BLUE, stroke: 8, w: 256 }); mLab.position.set(-4.6, 1.4, 1.0); PEOPLE.add(mLab);
const qM = mat('#9aa3ad');
const ghostTag = (p) => { const s = makeLabel('症状なし', { sx: 0.75, size: 56, color: '#ffffff', bg: 'rgba(120,128,140,.9)', w: 384, h: 128 }); s.position.set(0, 2.05, 0); p.add(s); p.userData.tag = s; };
women.forEach(ghostTag); men.forEach(ghostTag);
function tintPerson(p, k) { p.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.userData.c0 = o.userData.c0 || o.material.color.clone(); o.material = o.userData.m1 || (o.userData.m1 = o.material.clone()); o.material.color.copy(o.userData.c0).lerp(qM.color, k * 0.7); } }); }

// ---------- body: simplified uterus + tubes (blocked) ----------
const BODY = new THREE.Group(); stage.add(BODY); BODY.position.set(0, 2.4, 0);
const uterus = new THREE.Mesh(new THREE.SphereGeometry(0.9, 28, 20), mat('#f29bb2')); uterus.scale.set(1, 1.15, 0.7); BODY.add(uterus);
const tubeM = mat('#f2a8bd');
const tubes = [-1, 1].map(s => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.7, 0.55, 0), new THREE.Vector3(s * 1.6, 0.95, 0), new THREE.Vector3(s * 2.4, 0.6, 0), new THREE.Vector3(s * 2.7, 0.0, 0)]); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.16, 10), tubeM); BODY.add(m); return c; });
const ovaries = [-1, 1].map(s => { const o = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), mat('#f7c7a8')); o.position.set(s * 2.55, -0.45, 0); BODY.add(o); return o; });
const plugs = tubes.map(c => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat('#c0392b', { emissive: 0x5a0a06, emissiveIntensity: 0.5 })); p.position.copy(c.getPoint(0.45)); BODY.add(p); return p; });
const bodyLab = makeLabel('卵管がふさがる', { sx: 3.2, size: 72, color: RED, stroke: 8, w: 768, h: 128 }); bodyLab.position.set(0, -1.4, 0.8); BODY.add(bodyLab);

// ---------- baby ----------
const BABY = new THREE.Group(); stage.add(BABY);
const crib = box(2.2, 0.5, 1.3, mat('#f2ead8')); crib.position.y = 0.55; BABY.add(crib);
const blanket = box(1.6, 0.12, 1.0, mat('#bfe3f2')); blanket.position.set(0.2, 0.86, 0); BABY.add(blanket);
const baby = makePerson({ skin: SKIN[1], hair: HAIR[3], shirt: '#ffe6a8', pants: '#ffe6a8', scale: 0.42 }); baby.rotation.set(-Math.PI / 2, 0, Math.PI / 2, 'YXZ'); baby.position.set(-0.55, 0.92, 0); BABY.add(baby);
const babyLab = makeLabel('目・肺にうつる', { sx: 3.0, size: 72, color: RED, stroke: 8, w: 768, h: 128 }); babyLab.position.set(0, 1.9, 0.4); BABY.add(babyLab);

// ---------- prevention: shield + test tubes ----------
const PREV = new THREE.Group(); stage.add(PREV);
const shield = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.2, 6), mat('#4fb3a0')); shield.rotation.x = Math.PI / 2; shield.position.set(-1.4, 2.3, 0); PREV.add(shield);
const rack = box(1.8, 0.25, 0.6, mat('#d8dde6')); rack.position.set(1.4, 1.2, 0); PREV.add(rack);
for (let i = 0; i < 4; i++) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.0, 12), mat('#e8f6ff', { transparent: true, opacity: 0.8 })); tb.position.set(0.85 + i * 0.37, 1.75, 0); PREV.add(tb); const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12), mat(['#7fd4ff', '#ffd27a', '#7ff0c8', '#ff9ec7'][i])); liq.position.set(0.85 + i * 0.37, 1.45, 0); PREV.add(liq); }
const pLab1 = makeLabel('コンドーム', { sx: 2.2, size: 72, color: GREEN, stroke: 8 }); pLab1.position.set(-1.4, 3.8, 0.3); PREV.add(pLab1);
const pLab2 = makeLabel('検査', { sx: 1.4, size: 80, color: BLUE, stroke: 8, w: 256 }); pLab2.position.set(1.4, 3.0, 0.3); PREV.add(pLab2);

// ---------- globe dots ----------
const LANDS = [[40, -100], [35, -85], [20, -100], [-10, -60], [-20, -50], [0, -70], [10, 20], [0, 25], [-10, 30], [20, 10], [-20, 25], [50, 10], [45, 30], [55, 40], [40, 100], [25, 80], [20, 105], [-25, 135], [35, 138], [0, 115], [28, 77], [6, 3], [30, 31], [-6, 107], [14, 121]];
const NG = 360;
const gM = new THREE.MeshBasicMaterial({ color: 0x6be07a });
const gDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 6, 5), gM, NG); earth.add(gDots);
const gP = []; { const r = rng(12); for (let i = 0; i < NG; i++) { const [la, lo] = LANDS[i % LANDS.length]; gP.push(latLon(la + (r() - .5) * 16, lo + (r() - .5) * 20, 10.15)); } }
function setGlobe(k, t = 0) { for (let i = 0; i < NG; i++) { const s = (i / NG < k) ? 1 + 0.2 * Math.sin(t * 4 + i) : 0.0001; _m.makeScale(s, s, s).setPosition(gP[i]); gDots.setMatrixAt(i, _m); } gDots.instanceMatrix.needsUpdate = true; }
const gSpark = makeSparkles(300, 0.4, 0xb8ffbf); earth.add(gSpark.points);

const GROUPS = { lab: [LAB], eye: [EYE, eyeLab], people: [PEOPLE], body: [BODY], baby: [BABY], prev: [PREV] };
function mode(...ms) { for (const k in GROUPS) GROUPS[k].forEach(o => { o.visible = ms.includes(k); }); OTHERS.visible = false; bSpark.set(0); setStageColor('#14213a'); }

const SUBS = [
  [2.7, 6.2, '性病だけじゃない。<br>この菌、目も奪っていた。'],
  [6.3, 10.2, '世界では1年で、<br>約1億2,850万人が感染。'],
  [10.3, 14.2, '日本の性感染症でも最多。<br>報告だけで年約3万件。'],
  [14.3, 18.2, '女性の約8割、男性の<br>約半分は症状が出ない。'],
  [18.3, 22.2, 'だから気づかないまま、<br>パートナーにうつす。'],
  [22.3, 26.2, 'でも本当に怖いのは、<br>ここから。'],
  [26.3, 30.2, '放っておくと、不妊や<br>子宮外妊娠の原因に。'],
  [30.3, 34.2, '妊娠中なら、赤ちゃんの<br>目や肺にもうつる。'],
  [34.3, 38.2, 'コンドームと検査で、<br>防げて治せる病気なのに。'],
  [38.3, 42.2, 'そしてこの菌の仲間は、<br>目の病気トラコーマの原因。'],
  [42.3, 47.8, '世界で約190万人が、<br>失明や視力を失った。'],
  [48.0, 54.6, '結果：毎年1億人超の感染と、<br>失明の原因が1つ消える。'],
  [54.7, 57.4, 'でも梅毒や淋菌は、残ったまま。'],
  [57.5, 60.7, '付き合う前に性病検査、<br>アリ？ナシ？'],
];

// ---------- shots ----------
const TP = 0.5;
function labCam(t, d = 2.6) { const u = ease(t / d); look(0, lerp(5.6, 5.3, u), lerp(8.6, 8.2, u), 0, 0.6, 0.6, 50); }
function shot0(t) { // hook: dish full of germs, button pressed at 0.5s, germs vanish
  lift(160); mode('lab');
  const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand); btn.userData.labelOn(false);
  setBugs(t < TP ? 1 : Math.max(0, 1 - (t - TP) / 0.35), t);
  if (t >= TP && !bSpark.r0) { bSpark.init(bugPos.filter((_, i) => i % 2 === 0).map(v => [v.x, v.y, v.z]), 0.2, 1.2); bSpark.r0 = true; }
  bSpark.set(t >= TP ? (t - TP) / 1.4 : 0);
  el.flash.style.opacity = t >= TP ? 0.5 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  labCam(t);
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return stage;
}
function eyeSet(t, fogK, bugsOn, blink = 0) {
  mode('eye');
  fogM.opacity = fogK; eyeBugs.forEach((b, i) => { b.visible = bugsOn; b.position.z = 1.56 + 0.02 * Math.sin(t * 5 + i); });
  const bl = blink; lidT.rotation.x = -0.15 + bl * 0.9; lidB.rotation.x = 0.15 - bl * 0.9;
  EYE.rotation.y = Math.sin(t * 0.7) * 0.12;
}
function shot1(t) { // teaser: a cloudy eye
  lift(200); eyeSet(t, 0.55, true);
  eyeLab.visible = false;
  const u = ease(t / 3.5); look(0, lerp(2.9, 2.7, u), lerp(8.5, 7.6, u), 0, 2.6, 0, 50);
  hudTime('+1秒');
  return stage;
}
function shot2(t, T) { // globe: infections everywhere (each year)
  setEarthNight(0.25); gDots.visible = true;
  setGlobe(t < 4 ? clamp(t / 2.5) : 1, T); gSpark.set(0);
  earth.rotation.y = faceLon(t < 4 ? 20 : 138) + t * 0.03;
  look(0, 3, lerp(31, 29, ease(t / 8)), 0, 1.2, 0, 45);
  hudTime('+1日');
  if (t < 3.9) setTop('世界の新しい感染（2020年・15〜49歳）', '約' + countUp(t, 12850, 0.3, 1.8).toLocaleString() + '万人', fade(t, 0.15, 3.9, 0.25), GREEN);
  else setTop('日本の性器クラミジア（2024年・定点報告）', countUp(t, 29795, 4.1, 1.4).toLocaleString() + '件', fade(t, 3.9, 7.9, 0.25), GREEN);
  return space;
}
function shot3(t) { // people: no symptoms
  lift(220); mode('people');
  const kw = ease(clamp((t - 0.4) / 1.2)), km = ease(clamp((t - 1.2) / 1.2));
  women.forEach((p, i) => { const on = i < 8; tintPerson(p, on ? kw : 0); p.userData.tag.visible = on && kw > 0.5; });
  men.forEach((p, i) => { const on = i < 5; tintPerson(p, on ? km : 0); p.userData.tag.visible = on && km > 0.5; });
  const pass = t > 4; // 気づかないまま、うつす：前列の人がとなりへ向く
  women.forEach((p, i) => { p.rotation.y = pass ? Math.sin(t * 2 + i) * 0.5 : 0; }); men.forEach((p, i) => { p.rotation.y = pass ? Math.sin(t * 2 + i + 1) * 0.5 : 0; });
  const u = ease(t / 8); look(lerp(0.3, 0, u), lerp(4.2, 4.6, u), lerp(9.5, 10.4, u), 0, 1.0, 0, 50);
  hudTime('+1週間');
  if (t < 3.9) setTop('症状が出ない人（大阪市・2024年）', '女性8割・男性5割', fade(t, 0.15, 3.9, 0.25), BLUE);
  else setTop('気づかないまま', 'パートナーにうつる', fade(t, 3.9, 7.9, 0.25), RED);
  return stage;
}
function shot4(t) { // body: tubes get blocked
  lift(220); mode('body');
  const k = ease(clamp((t - 4.4) / 1.2)); plugs.forEach(p => { p.scale.setScalar(Math.max(0.001, k)); p.visible = k > 0.01; }); bodyLab.visible = k > 0.5;
  BODY.rotation.y = Math.sin(t * 0.6) * 0.15;
  const u = ease(t / 8); look(0, lerp(2.6, 2.5, u), lerp(12.5, 11.6, u), 0, 2.0, 0, 50);
  hudTime('+1年');
  if (t < 3.9) setTop('でも本当に怖いのは', 'ここから', fade(t, 0.15, 3.9, 0.25), RED);
  else setTop('放っておくと（大阪市・WHO）', '不妊・子宮外妊娠', fade(t, 3.9, 7.9, 0.25), RED);
  return stage;
}
function shot5(t) { // baby
  lift(220); mode('baby');
  babyLab.visible = t > 0.8; baby.userData.head.rotation.y = Math.sin(t * 1.5) * 0.2;
  const u = ease(t / 4); look(lerp(0.8, 0.4, u), lerp(2.6, 2.4, u), lerp(6.6, 6.0, u), 0, 1.3, 0, 50);
  setTop('妊娠中の感染（WHO）', '赤ちゃんの目・肺に', fade(t, 0.15, 3.9, 0.25), RED);
  return stage;
}
function shot6(t) { // prevention
  lift(220); mode('prev');
  shield.rotation.z = t * 0.6; pLab1.visible = t > 0.3; pLab2.visible = t > 0.9;
  look(0, 2.8, 8.4, 0, 2.3, 0, 50);
  setTop('予防と治療（厚生労働省・WHO）', 'コンドームと検査', fade(t, 0.15, 3.9, 0.25), GREEN);
  return stage;
}
function shot7(t) { // trachoma eye: cloudy, then the germs vanish and it clears
  lift(200);
  const clear = ease(clamp((t - 5.2) / 2.5));
  eyeSet(t, 0.65 * (1 - clear), t < 5.2);
  eyeLab.visible = true;
  if (t > 5.2 && !bSpark.r2) { bSpark.init(eyeBugs.map(b => { const v = b.getWorldPosition(new THREE.Vector3()); return [v.x, v.y, v.z]; }), 0.2, 1.0); bSpark.r2 = true; }
  bSpark.set(t > 5.2 ? (t - 5.2) / 1.4 : 0);
  const u = ease(t / 9.7); look(0, lerp(2.9, 3.0, u), lerp(8.4, 9.4, u), 0, 3.0, 0, 50);
  hudTime('+10年');
  if (t < 3.9) setTop('トラコーマ（クラミジア・トラコマティス）', '感染性の失明 原因1位', fade(t, 0.15, 3.9, 0.25), GOLD);
  else setTop('失明・視力障害（WHO）', '約' + countUp(t, 190, 4.1, 1.2) + '万人', fade(t, 3.9, 9.7, 0.25), GOLD);
  return stage;
}
function shot8(t, T) { // result: clean globe
  setEarthNight(0.1); gDots.visible = true;
  setGlobe(1 - ease(clamp((t - 0.2) / 1.6)), T);
  if (!gSpark.r) { gSpark.init(gP.filter((_, i) => i % 3 === 0).map(v => [v.x, v.y, v.z]), 0.3, 2.0); gSpark.r = true; }
  gSpark.set(clamp((t - 0.2) / 2.4));
  earth.rotation.y = faceLon(30) - t * 0.05;
  look(0, 2.5, lerp(30, 33, ease(t / 6.6)), 0, 1.2, 0, 45);
  if (t < 3.3) setTop('消える感染（世界・1年）', '約1億2,850万人', fade(t, 0.15, 3.3, 0.25), GREEN);
  else setTop('消える失明の原因', 'トラコーマ', fade(t, 3.3, 6.6, 0.25), GOLD);
  return space;
}
function shot9(t) { // twist: other germs remain in the dish
  lift(160); mode('lab'); OTHERS.visible = true; setBugs(0); btn.userData.press(1); btn.userData.hand(0); btn.userData.labelOn(false);
  OTHERS.children.forEach((c, i) => { if (!c.isSprite) c.rotation.y += 0.02 * (i % 2 ? 1 : -1); });
  look(0, lerp(5.4, 5.2, ease(t / 2.7)), 8.0, 0, 0.6, 0, 50);
  setTop('残る性感染症（2024年）', '梅毒 14,663件', fade(t, 0.15, 2.7, 0.25), '#d6b4ff');
  return stage;
}
function shot10(t) { // loop: same as the hook framing, dish empty
  lift(160); mode('lab'); setBugs(0); btn.userData.press(0); btn.userData.hand(0); btn.userData.labelOn(false);
  labCam(0);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
  return stage;
}

const shots = [
  { a: 0, b: 2.7, f: shot0 }, { a: 2.7, b: 6.2, f: shot1 }, { a: 6.2, b: 14.2, f: shot2 }, { a: 14.2, b: 22.2, f: shot3 },
  { a: 22.2, b: 30.2, f: shot4 }, { a: 30.2, b: 34.2, f: shot5 }, { a: 34.2, b: 38.2, f: shot6 }, { a: 38.2, b: 47.9, f: shot7 },
  { a: 47.9, b: 54.6, f: shot8 }, { a: 54.6, b: 57.4, f: shot9 }, { a: 57.4, b: 61.0, f: shot10 }, { a: 61.0, b: 65.0, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { gDots.visible = false; gSpark.set(0); if (f !== shot8) gSpark.r = false; return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 65.0,
  meta: {
    id: '0620',
    v2: true,
    hookLine: '世界中のクラミジア菌が、一斉に消えた。',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '体・健康',
    title: 'クラミジア菌が消えたら？',
    titleHtml: 'クラミジア菌が<br>消えたら？',
    mood: 'tension', seed: 620, hits: [0.5, 48.0], risers: [22.3], impacts: [6.3, 10.3, 14.3, 26.3, 42.3, 48.0],
    sfx: [[0.5, 'poof'], [6.4, 'whoosh'], [14.6, 'bubble'], [26.6, 'alarm'], [43.4, 'poof'], [54.8, 'buzz']],
    narr: { '1億2,850万人': '1億2850万人', '3万件': '3まんけん', '8割': 'はちわり', '190万人': '190まんにん', '1億人超': 'いちおくにんちょう', '淋菌': 'りんきん', '子宮外妊娠': 'しきゅうがいにんしん', 'トラコーマ': 'トラコーマ', 'アリ？ナシ？': 'あり？なし？' },
    ask: '付き合う前に性病検査、アリ？ナシ？',
    caption: 'もしも世界中のクラミジア菌が一瞬で消えたら？\n\n世界では1年で約1億2,850万人が新たに感染（2020年・15〜49歳）。日本でも性感染症でいちばん多く、報告されているだけで年約3万件（2024年・定点報告）。\n女性の約8割、男性の約半分は症状が出ない。だから気づかないまま、パートナーにうつしてしまう。\n放っておくと、不妊や子宮外妊娠の原因に。妊娠中なら赤ちゃんの目や肺にもうつる。\nコンドームで予防でき、検査で見つかれば抗菌薬で治る病気。\n\nそしてこの菌の仲間（クラミジア・トラコマティス）は、目の病気トラコーマの原因でもある。世界で約190万人が失明・視力障害に。感染による失明の原因で世界1位。\n\n結果：毎年1億人超の感染と、失明の原因が1つ消える。\nでも梅毒（2024年 14,663件）や淋菌は、残ったまま。\n\n付き合う前に性病検査、アリ？ナシ？ コメントで教えて。\n\n出典：WHO ファクトシート（Chlamydia・Trachoma）、厚生労働省 性感染症報告数（2024年暫定値）、大阪市 性器クラミジア啓発リーフレット（令和6年）',
    hashtags: ['もしもラボ', 'クラミジア', '性病', '性教育', '雑学'],
    endStats: [['世界の新しい感染', '約1億2,850万人', '2020年・WHO'], ['日本の報告数', '29,795件', '2024年・定点'], ['症状が出ない人', '女性 約8割', '男性は約半数'], ['トラコーマで失明・視力障害', '約190万人', 'WHO'], ['残る梅毒', '14,663件', '2024年']],
    sources: '出典：WHO（Chlamydia・Trachoma）、厚生労働省（2024年）、<br>大阪市 性器クラミジアリーフレット（令和6年）',
  },
});
