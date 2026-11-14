import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeCounter } from '../scenes/home.js';

// もしも毎日、握力を鍛えるのを1か月続けたら？（人体の限界・台本 S84）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/13 の解析の種（0654 片足立ちの型を 手の力 で）
// 数字（一次資料で確認・2026/11/14。PubMed の抄録・Healio の記事）：Leong DP ほか Lancet 2015;386(9990):266-273（PURE 研究）
//  17か国・139,691人・35〜70歳・追跡の中央値4年。握力が5kg低いごとに 全死亡 HR 1.16（16%高い）・心血管死 HR 1.17（17%高い）
//  関連であって 鍛えれば下がる とは言わない（画面に 観察研究 と出す）。1か月の上達は筋の中の話

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#d8d0c4' }); hemi.intensity = 1.3;
const OTONA = makeMan({ shirt: '#7a6a55', hair: '#2c2421' }); S.add(OTONA); // ふたを人に開けてもらう大人
const RED_FACE = box(0.41, 0.43, 0.39, new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: 0.0, depthWrite: false })); RED_FACE.position.y = 0.24; OTONA.userData.head.add(RED_FACE);
const KAZOKU = makeWoman({ shirt: '#8fb87a', hair: '#2a1a14', pants: '#3a3f4e' }); S.add(KAZOKU);
function redFace(k) { RED_FACE.material.opacity = 0.45 * k; RED_FACE.visible = k > 0.01; }

// 大きな手とペットボトル（アップ用）
const HAND = new THREE.Group(); { const sk = mat('#f1c9a5'); const palm = box(0.5, 0.55, 0.22, sk); HAND.add(palm); for (let i = 0; i < 4; i++) { const f = box(0.11, 0.12, 0.3, sk); f.position.set(-0.18 + i * 0.12, 0.2 - i * 0.02, 0.18); HAND.add(f); } const th = box(0.12, 0.3, 0.12, sk); th.position.set(0.3, 0.15, 0.1); th.rotation.z = -0.5; HAND.add(th); } S.add(HAND);
function makeBottle(s = 1) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 20), new THREE.MeshLambertMaterial({ color: '#bfe2f4', transparent: true, opacity: 0.75 })); b.position.y = 0.35; g.add(b); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.15, 0.16, 20), new THREE.MeshLambertMaterial({ color: '#bfe2f4', transparent: true, opacity: 0.75 })); neck.position.y = 0.78; g.add(neck); const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.22, 20), mat('#3a8ad8')); lab.position.y = 0.38; g.add(lab); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 16), mat('#f4f4f2')); cap.position.y = 0.9; g.add(cap); g.userData.cap = cap; g.scale.setScalar(s); return g; }
const BIG = makeBottle(1.4); S.add(BIG);
const BOTTLE = makeBottle(0.32); S.add(BOTTLE);
const bikutomo = label('ビクともしない', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(bikutomo);
const sparkA = makeSparkles(80, 0.1, 0xffffff); S.add(sparkA.points);

// ---------- A：台所（原点） ----------
const roomA = room({ x: 0, w: 8, d: 6, h: 3, wall: '#efe6d6', floor: '#c9b8a0' });
const CNT = makeCounter(); CNT.position.set(0, 0, -2.4); S.add(CNT);
const TBL = makeTable({ w: 1.4, d: 0.8, h: 0.72, color: '#c9a77a' }); TBL.position.set(0, 0, -0.6); S.add(TBL);
const damatte = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.38 }); S.add(damatte);
const katasugi = label('最近のふたは 固すぎる', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(katasugi);
const TOWEL = box(0.5, 0.08, 0.08, mat('#f4f4f2')); S.add(TOWEL);
const purupuru = label('プルプル', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.65 }); S.add(purupuru);
const JAR = new THREE.Group(); { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 18), new THREE.MeshLambertMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.5 })); g.position.y = 0.11; JAR.add(g); const j = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.17, 18), mat('#c8243a')); j.position.y = 0.09; JAR.add(j); } S.add(JAR);
const JLID = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.04, 18), mat('#e8c23a')); S.add(JLID);
const hajimete = label('初めて 自分で', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(hajimete);
const akete = label('開けて', { w: 384, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.55 }); S.add(akete);
const tame = label('ふたのため だけじゃない', { w: 1024, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.5 }); S.add(tame);
const POP = label('パカッ', { w: 384, size: 110, color: '#fff', bg: 'rgba(240,120,60,.96)', sx: 0.5 }); S.add(POP);

// ---------- B：研究（x=60） ----------
const BX = 60;
flat(30, 20, '#3a3448', BX, -2);
const CROWD = []; { const r = rng(9); for (let i = 0; i < 48; i++) { const p = r() < 0.5 ? makeWoman({ shirt: ['#e05a4f', '#4fa3d1', '#f2c14e', '#8e6bbf', '#e9e4da'][i % 5], hair: ['#3a2620', '#9a9a9a', '#6b4a33'][i % 3] }) : makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#d97a3a', '#59606e', '#c94f7c'][i % 5], hair: ['#1d1a19', '#9a9a9a', '#4a3426'][i % 3], bald: r() < 0.2 }); p.position.set(BX - 5.5 + (i % 8) * 1.55 + (r() - 0.5) * 0.3, 0, -1 - Math.floor(i / 8) * 1.5); p.rotation.y = (r() - 0.5) * 0.5; S.add(p); CROWD.push(p); } }
const GRIP = new THREE.Group(); { const body = box(0.5, 0.9, 0.18, mat('#3a3e48')); GRIP.add(body); const dial = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), mat('#f4f4f2')); dial.position.set(0, 0.22, 0.1); GRIP.add(dial); const needle = box(0.02, 0.15, 0.01, mat('#d82a2a')); needle.position.set(0, 0.22, 0.11); needle.geometry.translate(0, 0.07, 0); GRIP.add(needle); GRIP.userData.needle = needle; const handle = box(0.42, 0.08, 0.14, mat('#9aa0aa')); handle.position.set(0, -0.3, 0.18); GRIP.add(handle); GRIP.userData.handle = handle; } S.add(GRIP);
const gyutto = label('ぎゅっと 握るだけ', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); S.add(gyutto);
const kansatsu = label('観察研究', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.8 }); S.add(kansatsu);
const HEART = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshLambertMaterial({ color: '#c8323a', emissive: 0x400000 })); S.add(HEART);
const wakaranai = label('寿命がのびるかは 不明', { w: 1024, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.5 }); S.add(wakaranai);
const tsuyosa = label('体の強さを 映す数字', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.5 }); S.add(tsuyosa);

const LABELS = [bikutomo, damatte, katasugi, purupuru, hajimete, akete, tame, POP, gyutto, kansatsu, wakaranai, tsuyosa];
function reset() {
  [OTONA, KAZOKU].forEach(p => { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; redFace(0);
  OTONA.position.set(-0.3, 0, -1.2); KAZOKU.position.set(0.9, 0, -1.1); KAZOKU.rotation.y = -0.7;
  HAND.visible = false; BIG.visible = false; BOTTLE.visible = false; TOWEL.visible = false; TOWEL.scale.set(1, 1, 1); JAR.visible = false; JLID.visible = false;
  CROWD.forEach(p => p.visible = false); GRIP.visible = false; HEART.visible = false;
  BIG.userData.cap.position.y = 0.9; BOTTLE.userData.cap.position.y = 0.9;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function holdBottle(p, open = 0) { p.userData.arms.forEach((a, i) => a.rotation.set(-1.25, 0, i ? 0.45 : -0.45)); p.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.95, 0.55); p.localToWorld(v); BOTTLE.visible = true; BOTTLE.position.copy(v); BOTTLE.userData.cap.position.y = 0.9 + open * 0.3; }
const TP = 0.35;
function closeCam(u = 0) { look(lerp(0.15, 0.1, u), lerp(1.95, 1.9, u), lerp(2.65, 2.45, u), 0, lerp(1.72, 1.7, u), -0.2, 50); }
function shot0(t) { // 0秒＝サムネ：ペットボトルのふたが、大人の手の中でビクともしない
  reset(); lift(0); OTONA.visible = false; KAZOKU.visible = false;
  BIG.visible = true; BIG.position.set(0, 0.35, -0.2); const shake = t > TP ? Math.sin(t * 45) * 0.03 : 0; BIG.rotation.z = shake;
  HAND.visible = true; HAND.position.set(0.02, 1.62 + shake * 0.5, -0.2); HAND.rotation.set(0.0, 0, -0.15 + Math.sin(t * 30) * 0.06 * (t > TP ? 1 : 0));
  if (t > TP) say(bikutomo, t, TP, 0, 1.1, 0.1, 0.7);
  closeCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function kitchenCam(u = 0) { look(lerp(0.4, 0.3, u), 1.65, lerp(2.4, 2.1, u), 0.2, 1.3, -1.2, 50); }
function sSashidasu(t, d) { // 顔を真っ赤にした大人が、だまってふたを家族に差し出す
  reset(); lift(120); redFace(clamp(t / 0.8)); holdBottle(OTONA); OTONA.rotation.y = 0.5;
  const k = clamp((t - d * 0.4) / 0.6); OTONA.userData.arms.forEach((a, i) => a.rotation.set(lerp(-1.25, -1.5, k), 0, i ? 0.2 : -0.2)); OTONA.updateMatrixWorld(); const v = new THREE.Vector3(0, lerp(0.95, 1.05, k), lerp(0.55, 0.7, k)); OTONA.localToWorld(v); BOTTLE.position.copy(v);
  if (t > d * 0.5) say(damatte, t, d * 0.5, -0.3, 2.0, -1.2, 0.34);
  kitchenCam(ease(clamp(t / d)));
  return S;
}
function sIibun(t, d) { // 本人の言い分から。最近のふたは、固すぎる
  reset(); lift(120); KAZOKU.visible = false; redFace(0.5); OTONA.rotation.y = 0.2; OTONA.userData.arms[1].rotation.set(-1.8, 0, 0.5);
  if (t > 0.4) say(katasugi, t, 0.4, -0.2, 1.95, -1.1, 1.05);
  look(0.1, 1.65, 1.6, -0.25, 1.45, -1.2, 50);
  return S;
}
function sTowel(t, d) { // 1日目。タオルを絞るだけで、腕がプルプル
  reset(); lift(120); KAZOKU.visible = false; OTONA.position.set(0.0, 0, -1.6); const sh = Math.sin(t * 40) * 0.05;
  OTONA.userData.arms.forEach((a, i) => a.rotation.set(-1.3 + sh, 0, (i ? 0.25 : -0.25))); OTONA.updateMatrixWorld(); const h0 = new THREE.Vector3(0, -0.62, 0), h1 = new THREE.Vector3(0, -0.62, 0); OTONA.userData.arms[0].localToWorld(h0); OTONA.userData.arms[1].localToWorld(h1); TOWEL.visible = true; TOWEL.position.copy(h0).add(h1).multiplyScalar(0.5); TOWEL.scale.set(h0.distanceTo(h1) / 0.5 + 0.2, 1.4, 1.4); TOWEL.rotation.set(t * 3, 0, 0);
  redFace(0.4); if (t > d * 0.4) say(purupuru, t, d * 0.4, 0.35, 1.95, -1.4, 0.42);
  setHud('握力トレーニング', '1日目', 1);
  look(0.4, 1.7, 1.5, 0.0, 1.35, -1.6, 50);
  return S;
}
function sJam(t, d) { // 1週間後。ジャムのびんを、初めて自分で開ける
  reset(); lift(120); KAZOKU.visible = false; OTONA.position.set(-0.1, 0, -1.3); OTONA.userData.arms.forEach((a, i) => a.rotation.set(-1.3, 0, i ? 0.35 : -0.35));
  JAR.visible = true; JAR.position.set(-0.1, 0.75, -0.75); JLID.visible = true; const k = clamp((t - d * 0.4) / 0.5); JLID.position.set(-0.1 + k * 0.25, 0.99 + Math.sin(k * Math.PI) * 0.25, -0.75); JLID.rotation.z = k * 2;
  if (k > 0) say(POP, t, d * 0.4, 0.2, 1.35, -0.7, 0.38); if (t > d * 0.6) say(hajimete, t, d * 0.6, -0.1, 1.9, -1.2, 0.8);
  setHud('握力トレーニング', '1週間後', 1);
  look(0.4, 1.75, 1.3, -0.1, 1.3, -1.0, 50);
  return S;
}
function sTanomu(t, d) { // 1か月後。家族のほうが、ふたを開けてと頼みに来る
  reset(); lift(120); KAZOKU.position.set(0.5, 0, -0.9); KAZOKU.rotation.y = -1.2; holdBottle(KAZOKU); OTONA.rotation.y = 0.8;
  if (t > d * 0.35) say(akete, t, d * 0.35, 0.5, 1.95, -0.9, 0.5);
  setHud('握力トレーニング', '1か月後', 1);
  kitchenCam(0.5);
  return S;
}
function sTame(t, d) { // でも、握る力は、ふたのためだけじゃない
  reset(); lift(120); KAZOKU.position.set(0.5, 0, -0.9); KAZOKU.rotation.y = -1.2; holdBottle(OTONA, clamp((t - 0.3) / 0.5)); OTONA.rotation.y = 0.8;
  if (t > d * 0.45) say(tame, t, d * 0.45, 0.2, 2.15, -1.0, 1.35);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.6, u), lerp(1.65, 2.0, u), lerp(2.1, 2.9, u), 0.2, 1.3, -1.1, 50);
  return S;
}
function crowdCam(u = 0) { look(BX + lerp(0.5, 0.0, u), lerp(4.2, 3.6, u), lerp(7.5, 6.5, u), BX, 0.8, -3.5, 50); }
function sStudy(t, d) { // 17か国、35〜70歳の約14万人を、約4年追いかけた研究がある
  reset(); lift(160); OTONA.visible = KAZOKU.visible = false; CROWD.forEach((p, i) => { p.visible = t > 0.2 + (i % 8) * 0.06; });
  setTop('握力の研究（2015年）', '約14万人', fade(t, 0.4, d, 0.25), BLUE); setHud('17か国・35〜70歳', '約4年', 1);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function gripCam() { look(BX + 0.2, 1.7, 3.2, BX, 1.45, 1.0, 50); }
function sFive(t, d) { // 握力が5kg低いごとに、亡くなるリスクが16%高かった
  reset(); lift(160); OTONA.visible = KAZOKU.visible = false; GRIP.visible = true; GRIP.position.set(BX, 1.5, 1.0); GRIP.userData.needle.rotation.z = lerp(-1.2, 0.2, easeOut(clamp(t / 1.2)));
  setTop('握力が5kg低いごとに 死亡リスク（2015年）', '+16%', fade(t, 0.4, d, 0.25), RED); setHud('Leong ほか', 'Lancet 2015年', 1);
  if (t > d * 0.5) say(kansatsu, t, d * 0.5, BX, 2.2, 1.0, 0.55);
  gripCam();
  return S;
}
function sSeventeen(t, d) { // 心臓や血管の病気で亡くなるリスクも、17%高かった
  reset(); lift(160); OTONA.visible = KAZOKU.visible = false; HEART.visible = true; HEART.position.set(BX, 1.5, 1.0); HEART.scale.setScalar(1 + Math.max(0, Math.sin(t * 8)) * 0.12);
  setTop('心臓・血管の病気で亡くなるリスク（2015年）', '+17%', fade(t, 0.4, d, 0.25), RED); setHud('Leong ほか', 'Lancet 2015年', 1);
  say(kansatsu, t, 0.2, BX, 2.0, 1.0, 0.5); HEART.scale.multiplyScalar(0.6);
  gripCam();
  return S;
}
function sMeasure(t, d) { // 測り方は、ぎゅっと握るだけ
  reset(); lift(160); OTONA.visible = KAZOKU.visible = false; GRIP.visible = true; GRIP.position.set(BX, 1.5, 1.0); const sq = Math.abs(Math.sin(t * 3)); GRIP.userData.handle.position.y = -0.3 + sq * 0.06; GRIP.userData.needle.rotation.z = lerp(-1.2, 0.6, sq);
  HAND.visible = true; HAND.scale.setScalar(0.8); HAND.position.set(BX + 0.05, 1.12 + sq * 0.05, 1.25); HAND.rotation.set(Math.PI / 2, 0, 0);
  if (t > d * 0.3) say(gyutto, t, d * 0.3, BX, 2.15, 1.0, 0.9);
  gripCam();
  return S;
}
function sKekka(t, d) { // 結果：ふたが固かったのはふたのせいじゃない。握る力は、体の強さを映す数字だった
  reset(); lift(120); holdBottle(OTONA, clamp((t - 0.4) / 0.4)); OTONA.rotation.y = 0.4; KAZOKU.rotation.y = -0.9; KAZOKU.userData.arms[1].rotation.set(-2.4, 0, 0.3);
  if (t > d * 0.55) say(tsuyosa, t, d * 0.55, 0.2, 2.2, -1.1, 1.35);
  setTop('結果', '体の強さの数字', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.6, u), lerp(1.65, 1.9, u), lerp(2.1, 2.8, u), 0.2, 1.3, -1.1, 50);
  return S;
}
function sTadashi(t, d) { // ただし、鍛えれば寿命がのびるかは、まだ分かっていない
  reset(); lift(120); KAZOKU.visible = false; holdBottle(OTONA, 1); OTONA.rotation.y = 0.2;
  say(wakaranai, t, 0.3, -0.2, 2.15, -1.1, 1.4); setHud('観察研究', '関連が分かっただけ', 1);
  look(0.1, 1.65, 1.8, -0.25, 1.4, -1.2, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); OTONA.visible = false; KAZOKU.visible = false; BIG.visible = true; BIG.position.set(0, 0.35, -0.2); HAND.visible = true; HAND.position.set(0.02, 1.62, -0.2); HAND.rotation.set(0, 0, -0.15); bikutomo.visible = true; bikutomo.position.set(0, 1.1, 0.1); bikutomo.userData.size(0.7); closeCam(0); return S; }

const NARR = { '真っ赤': 'まっか', '大人': 'おとな', '家族': 'かぞく', '差し出す': 'さしだす', '本人': 'ほんにん', '言い分': 'いいぶん', '最近': 'さいきん', '固すぎる': 'かたすぎる', '1日目': 'いちにちめ', '絞る': 'しぼる', '腕': 'うで', '1週間後': 'いっしゅうかんご', '初めて': 'はじめて', '1か月後': 'いっかげつご', '頼み': 'たのみ', '握る': 'にぎる', '17か国': 'じゅうななかこく', '35〜70歳': 'さんじゅうごからななじゅっさい', '約14万人': 'やくじゅうよんまんにん', '約4年': 'やくよねん', '握力': 'あくりょく', '5kg': 'ごキロ', '16%': '16パーセント', '17%': '17パーセント', '心臓': 'しんぞう', '血管': 'けっかん', '測り方': 'はかりかた', '結果：': '結果、', '寿命': 'じゅみょう', '鍛えれば': 'きたえれば' };
const P = planTimes([
  ['顔を真っ赤にした大人が、<br>だまってふたを家族に差し出す。', sSashidasu],
  ['本人の言い分から。<br>最近のふたは、固すぎる。', sIibun],
  ['1日目。タオルを絞るだけで、<br>腕がプルプル。', sTowel],
  ['1週間後。ジャムのびんを、<br>初めて自分で開ける。', sJam],
  ['1か月後。家族のほうが、ふたを<br>開けてと頼みに来る。', sTanomu],
  ['でも、握る力は、<br>ふたのためだけじゃない。', sTame],
  ['17か国、35〜70歳の約14万人を、', (t, d) => sStudy(t, 2 * d)],
  ['約4年追いかけた研究がある。', (t, d) => sStudy(t + d, 2 * d)],
  ['握力が5kg低いごとに、<br>亡くなるリスクが16%高かった。', sFive],
  ['心臓や血管の病気で亡くなる<br>リスクも、17%高かった。', sSeventeen],
  ['測り方は、ぎゅっと握るだけ。', sMeasure],
  ['結果：ふたが固かったのは<br>ふたのせいじゃない。', (t, d) => sKekka(t, 2 * d)],
  ['握る力は、体の強さを<br>映す数字だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['ただし、鍛えれば<br>寿命がのびるかは、', (t, d) => sTadashi(t, 2 * d)],
  ['まだ分かっていない。', (t, d) => sTadashi(t + d, 2 * d)],
  ['ペットボトルのふた、<br>最近自分で開けてる？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0689',
    v2: true,
    tt: 'main',
    hookLine: 'ペットボトルのふたが、大人の手の中でビクともしない。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日、握力を鍛えるのを1か月続けたら？',
    titleHtml: 'もしも毎日、<br>握力を鍛えるのを<br>1か月<br>続けたら？',
    mood: 'hopeful', seed: 689, hits: [TP, P.at(11), P.at(13)], risers: [P.at(5)], impacts: [P.at(6, 0.4), P.at(8, 0.4), P.at(9, 0.4)],
    sfx: [[TP, 'alarm'], [P.at(0, 1.2), 'whoosh'], [P.at(2, 0.6), 'meter', 0.3], [P.at(3, 1.0), 'poof'], [P.at(10, 0.4), 'bubble']],
    narr: NARR,
    ask: 'ペットボトルのふた、最近自分で開けてる？',
    caption: 'もしも毎日、握力を鍛えるのを1か月続けたら？\n\n顔を真っ赤にした大人が、だまってふたを家族に差し出す。\n本人の言い分から。最近のふたは、固すぎる。\n1日目。タオルを絞るだけで、腕がプルプル。\n1週間後。ジャムのびんを、初めて自分で開ける。\n1か月後。家族のほうが、ふたを開けてと頼みに来る。\nでも、握る力は、ふたのためだけじゃない。\n17か国、35〜70歳の約14万人を、約4年追いかけた研究がある。\n握力が5kg低いごとに、亡くなるリスクが16%高かった。\n心臓や血管の病気で亡くなるリスクも、17%高かった。\n測り方は、ぎゅっと握るだけ。\n\n結果：ふたが固かったのはふたのせいじゃない。握る力は、体の強さを映す数字だった。\nただし、鍛えれば寿命がのびるかは、まだ分かっていない（観察研究）。\n\nペットボトルのふた、最近自分で開けてる？ コメントで教えて。\n\n出典：Leong ほか The Lancet（2015年）PURE 研究',
    hashtags: ['もしもラボ', 'もしも', '握力', '健康', '人体の限界'],
    endStats: [['握力の研究', '約14万人', '17か国・2015年'], ['握力が5kg低いごとに 死亡リスク', '+16%', '観察研究'], ['心臓・血管の病気で死亡リスク', '+17%', '観察研究']],
    sources: '出典：Leong ほか The Lancet（2015年）',
  },
});
