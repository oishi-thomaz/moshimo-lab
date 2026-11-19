import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSweat } from '../scenes/office.js';
import { addKnees, fitReset, makeTimer, planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしも毎日1分のプランクを続けたら？（人体の限界・台本 S104）
// 2026/11/18 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/17 の解析の種（0389 ストレッチの急上昇・0654 片足立ちの その場で試したくなるテスト）
// 数字（一次資料で確認・2026/11/19。PMC11235748 本文）：Park S, Kim YC, Jee YS. Eur J Sport Sci 2024;24(3):330-340（doi:10.1002/ejsc.12086）
//  韓国・20〜24歳の大学生61人（プランク組30人・対照31人）。週3回・12週、通常・ひじ・横の3種類を各1分（1分休み）、セットは 3→4→5 と増える
//  上体起こし（1分間）プランク組 22.60→35.60回（約55%増＝約1.5倍）、対照 22.68→19.29回
//  台本の 22回から35回 は平均が22.6回・35.6回なので、字幕を 約23回から約36回 に直した（数字の正確さのため）
//  小さな研究なので お腹がへこむ・腰痛が治る とは言わない。腰痛・妊娠中・持病の人の注意を札で出す。28秒・45秒は筋の中の時間

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#e8dccc', ground: '#a8988a' }); hemi.intensity = 1.3;
const ME = addKnees(makeMan({ shirt: '#4f8fb3', pants: '#3a3f4e', hair: '#2a211c' })); S.add(ME);
const sweat = makeSweat(); ME.userData.head.add(sweat);
const REDF = box(0.41, 0.43, 0.39, new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0, depthWrite: false })); REDF.position.y = 0.24; ME.userData.head.add(REDF);
function redFace(k) { REDF.material.opacity = 0.5 * k; REDF.visible = k > 0.01; }
const FAM = makeWoman({ shirt: '#e88a9a', hair: '#3a2620', pants: '#4a4f5e' }); S.add(FAM);
const FPHONE = box(0.1, 0.18, 0.02, mat('#15161c')); FPHONE.position.set(0, -0.66, 0.1); FAM.userData.arms[1].add(FPHONE);
const KID = makeMan({ shirt: '#f2c14e', hair: '#2a211c', scale: 0.62 }); S.add(KID);

// ---------- A：居間の床（原点） ----------
room({ x: 0, w: 9, d: 7, h: 3.0, wall: '#efe6d6', floor: '#b8966a' });
const MATT = flat(2.6, 0.9, '#5a9ad0', -0.05, -1.2, -0.8, 0.012);
const SOFA = new THREE.Group(); { const b = box(2.2, 0.45, 0.9, mat('#8a6a5a')); b.position.y = 0.22; SOFA.add(b); const bk = box(2.2, 0.6, 0.2, mat('#7a5a4a')); bk.position.set(0, 0.7, -0.4); SOFA.add(bk); } SOFA.position.set(1.6, 0, -2.6); S.add(SOFA);
const TIMER = makeTimer({ w: 0.9, h: 0.38 }); S.add(TIMER);
const puru = label('プルプル', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.6 }); S.add(puru);
const honki = label('腹筋は 明日から本気出す', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(honki);
const beta = label('ベタッ', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(beta);
const massugu = label('まっすぐ', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.65 }); S.add(massugu);
const warai = label('www', { w: 384, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(warai);
const sparkA = makeSparkles(70, 0.05, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0, 0.8, -1.2]], 0.8, 0.5);

// ---------- B：研究（x=60） ----------
const BX = 60;
flat(30, 20, '#3a3448', BX, -2);
const BACKB = box(18, 8, 0.2, mat('#2c2838')); BACKB.position.set(BX, 4, -9); S.add(BACKB);
const C30 = (() => { const n = 30, cols = 6; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.6, 0.24), mat('#7fc8ff'), n); const M = new THREE.Matrix4(); for (let i = 0; i < n; i++) { M.makeTranslation(BX - 2.9 + (i % cols) * 0.42, 0.3, -1.4 - Math.floor(i / cols) * 0.42); m.setMatrixAt(i, M); } S.add(m); return m; })();
const C31 = (() => { const n = 31, cols = 6; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.6, 0.24), mat('#9aa0aa'), n); const M = new THREE.Matrix4(); for (let i = 0; i < n; i++) { M.makeTranslation(BX + 0.8 + (i % cols) * 0.42, 0.3, -1.4 - Math.floor(i / cols) * 0.42); m.setMatrixAt(i, M); } S.add(m); return m; })();
const lab30 = label('プランク 30人', { w: 768, size: 96, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.3 }); lab30.position.set(BX - 1.85, 1.2, -0.6); S.add(lab30);
const lab31 = label('しない 31人', { w: 768, size: 96, color: '#fff', bg: 'rgba(110,116,130,.96)', sx: 1.3 }); lab31.position.set(BX + 1.85, 1.2, -0.6); S.add(lab31);
const KINDS = ['ふつう', 'ひじ', '横'].map(s => { const l = label(s, { w: 384, size: 100, color: '#fff', bg: 'rgba(230,120,30,.98)', sx: 0.55 }); S.add(l); return l; });
const PL3 = [0, 1, 2].map(() => { const p = addKnees(makeMan({ shirt: '#4f8fb3', pants: '#3a3f4e', hair: '#2a211c', scale: 0.85 })); S.add(p); return p; });
const BARB = [['はじめ', '#9aa0aa'], ['12週後', '#e8782a']].map(([n, c]) => { const b = box(0.9, 1, 0.5, mat(c)); S.add(b); const l = label(n, { w: 512, size: 92, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.7 }); S.add(l); const v = label('', { w: 600, size: 110, color: c, stroke: 14, strokeColor: '#1a1a22', sx: 0.85 }); v.material.depthTest = false; v.renderOrder = 9; S.add(v); return { b, l, v }; });
const muri = label('腰が痛い人は 無理しない', { w: 1100, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(muri);
const chiisai = label('小さな研究', { w: 640, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.85 }); S.add(chiisai);

// ---------- 結果・ひねり ----------
const ashita = label('今日の1分 → あしたへ', { w: 1100, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.55 }); S.add(ashita);
const CAL = new THREE.Group(); { const b = box(0.9, 1.1, 0.04, mat('#fbfaf5')); CAL.add(b); const h = box(0.9, 0.25, 0.05, mat('#c8242c')); h.position.y = 0.43; CAL.add(h); } S.add(CAL);
const calLab = label('あした', { w: 384, size: 110, color: '#2a1a00', sx: 0.4 }); calLab.material.depthTest = false; calLab.renderOrder = 8; S.add(calLab);

const LABELS = [puru, honki, beta, massugu, warai, muri, chiisai, ashita, calLab, ...KINDS, ...BARB.flatMap(x => [x.l, x.v])];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; }
function reset() {
  [ME, ...PL3].forEach(p => { fitReset(p); p.visible = false; p.position.set(0, -50, 0); }); [FAM, KID].forEach(clearP);
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); redFace(0); sparkA.set(0);
  TIMER.visible = false; BARB.forEach(x => x.b.visible = false); CAL.visible = false; C30.visible = C31.visible = true; lab30.visible = lab31.visible = true;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
// プランク：k=1 まっすぐ（ひじで支える）… 0 お腹が床。shake で腕が震える。頭は +z
function plank(p, x, z, k = 1, shake = 0, t = 0, ry = Math.PI / 2) {
  const s = p.scale.y; const th = Math.PI / 2 - 0.42 * k; p.visible = true; p.rotation.set(th, ry, 0);
  p.position.set(x, (0.06 + 0.1 * (1 - k)) * s + Math.sin(t * 40) * 0.006 * shake, z);
  p.userData.arms.forEach((a, i) => a.rotation.set(-th + Math.sin(t * 45 + i) * 0.03 * shake, 0, (i ? -1 : 1) * 0.05));
  p.userData.head.rotation.x = -0.9;
}
function setTimer(s, col, x = 0.0, y = 1.5, z = -0.6, sc = 1) { TIMER.visible = true; TIMER.userData.set(s, col); TIMER.position.set(x, y, z); TIMER.scale.setScalar(sc); }
const TP = 0.25;
const mmss = (sec) => sec >= 60 ? '1:00' : '0:' + String(Math.max(0, sec)).padStart(2, '0');
function floorCam(u = 0) { look(lerp(0.2, 0.1, u), lerp(1.5, 1.4, u), lerp(4.2, 3.8, u), -0.1, 0.8, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：床に伏せた会社員の頭の上に 1:00 のタイマーが出て、すぐに腕がプルプル震え出す
  reset(); lift(0); plank(ME, -1.25, -1.2, 1, t > TP ? 1 : 0, t);
  const k = easeOut(clamp(t / 0.25)); setTimer(t > TP ? mmss(60 - Math.floor((t - TP) * 2)) : '1:00', '#7dff8a', -1.0, 1.08, -1.3, 0.6 + 0.4 * k);
  if (t > TP) { sweat.userData.set(clamp((t - TP) / 0.6), t); say(puru, t, TP + 0.1, 0.75, 1.05, -0.8, 0.45); }
  floorCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sWarau(t, d) { // 横で家族がスマホを向けて笑う。会社員は顔を真っ赤にしたまま固まる
  reset(); lift(150); plank(ME, -1.25, -1.2, 1, 1, t); redFace(clamp((t - d * 0.4) / 0.6)); sweat.userData.set(1, t);
  FAM.visible = true; FAM.position.set(1.2, 0, -2.3); FAM.rotation.y = -0.7; FAM.userData.arms[1].rotation.set(-1.5, 0, 0.1); FAM.userData.head.rotation.z = Math.sin(t * 8) * 0.08;
  KID.visible = true; KID.position.set(-1.2, 0, -2.4); KID.rotation.y = 0.5; KID.userData.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * (0.3 + Math.abs(Math.sin(t * 7)) * 0.4)));
  if (t > 0.3) say(warai, t, 0.3, 1.2, 2.25, -2.3, 0.4);
  look(0.0, 1.7, 5.2, -0.1, 1.0, -1.5, 50);
  return S;
}
function sHonki(t, d) { // 本人の言い分から。腹筋は、明日から本気出す
  reset(); lift(150); ME.visible = true; ME.position.set(-0.3, 0, -0.9); ME.rotation.set(0, 0.3, 0); ME.userData.arms[1].rotation.set(-1.3, 0, 0.3); ME.userData.head.rotation.x = -0.1;
  if (t > d * 0.3) say(honki, t, d * 0.3, -0.2, 2.4, -0.9, 1.45);
  look(0.2, 1.8, 3.5, -0.1, 1.35, -0.9, 50);
  return S;
}
function sDay1(t, d) { // 1日目。1分のはずが、28秒でお腹が床につく
  reset(); lift(150); const sec = Math.min(28, Math.floor(t * 28 / (d * 0.65))); const fall = sec >= 28;
  plank(ME, -1.25, -1.2, fall ? lerp(1, 0, clamp((t - d * 0.65) / 0.25)) : 1, 1 + sec / 14, t); sweat.userData.set(clamp(sec / 10), t);
  setTimer(mmss(60 - sec), fall ? RED : '#7dff8a', -1.0, 1.08, -1.3, 0.85);
  if (fall) say(beta, t, d * 0.65, 0.4, 0.75, -0.8, 0.5);
  setHud('プランク', '1日目', 1);
  floorCam(0.6);
  return S;
}
function sWeek1(t, d) { // 1週間後。45秒で、足がプルプル
  reset(); lift(150); const sec = Math.min(45, Math.floor(t * 45 / (d * 0.7)));
  plank(ME, -1.25, -1.2, 1, sec >= 40 ? 2.4 : 0.6, t); ME.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 50 + i) * 0.03 * (sec >= 40 ? 1 : 0)); sweat.userData.set(0.6, t);
  setTimer(mmss(60 - sec), '#ffd27a', -1.0, 1.08, -1.3, 0.85);
  if (sec >= 40) say(puru, t, d * 0.65, -0.8, 0.75, -0.9, 0.45);
  setHud('プランク', '1週間後', 1);
  floorCam(0.7);
  return S;
}
function sMonth(t, d) { // 1か月後。タイマーが 0:00 になっても、体がまっすぐのまま
  reset(); lift(150); const sec = Math.min(60, Math.floor(t * 60 / (d * 0.55)));
  plank(ME, -1.25, -1.2, 1, 0, t); setTimer(sec >= 60 ? '0:00' : mmss(60 - sec), sec >= 60 ? '#9be86a' : '#7dff8a', -1.0, 1.08, -1.3, 0.85);
  if (sec >= 60) { sparkA.set(clamp((t - d * 0.55) / 0.8)); say(massugu, t, d * 0.6, 0.75, 1.05, -0.8, 0.5); }
  setHud('プランク', '1か月後', 1);
  floorCam(0.8);
  return S;
}
function sDoko(t, d) { // でも、1分のプランクで、体はどこまで変わるのか
  reset(); lift(150); plank(ME, -1.25, -1.2, 1, 0.3, t);
  const u = ease(clamp(t / d)); look(lerp(0.2, 1.2, u), lerp(1.35, 2.4, u), lerp(3.2, 5.0, u), 0.05, 0.6, -1.2, 50);
  return S;
}
function studyCam(u = 0) { look(BX, lerp(4.2, 4.5, u), lerp(8.4, 9.0, u), BX, 0.7, -2.0, 50); }
function sStudy(t, d) { // 韓国の大学生61人で、12週間確かめた研究がある
  reset(); lift(160); studyCam(ease(clamp(t / d)));
  setTop('プランクの研究（韓国・2024年）', Math.round(61 * easeOut(clamp((t - 0.3) / 1.2))) + '人', fade(t, 0.3, d, 0.25), BLUE); setHud('20〜24歳の大学生', '12週間', 1);
  return S;
}
function sKinds(t, d) { // 1分ずつのプランクを3種類、週に3回
  reset(); lift(150); const ph = Math.min(2, Math.floor(t / (d / 3)));
  if (ph === 2) { ME.visible = true; ME.rotation.set(0, 0, 1.2); ME.position.set(-0.45, 0.06, -1.2); ME.userData.arms[0].rotation.set(0, 0, -1.2); ME.userData.arms[1].rotation.set(0, 0, 0.4); }
  else plank(ME, -1.25, -1.2, ph === 1 ? 0.75 : 1, 0.4, t);
  say(KINDS[ph], t, ph * d / 3, -0.1, 1.55, -1.2, 0.5);
  setHud('各1分・3〜5セット', '週3回・指導つき', 1);
  floorCam(0.5);
  return S;
}
function barCam() { look(BX + 0.0, 1.6, 6.6, BX, 1.2, 0.6, 50); }
function sSitup(t, d) { // 上体起こしの回数は、約23回から約36回に増えた
  reset(); lift(220); C30.visible = C31.visible = false; lab30.visible = lab31.visible = false; const k = easeOut(clamp((t - 0.5) / 1.2)); const hs = [22.6 / 21, lerp(22.6, 35.6, k) / 21];
  BARB.forEach((x, i) => { const h = hs[i]; x.b.visible = true; x.b.scale.y = h; x.b.position.set(BX - 0.7 + i * 1.4, h / 2, 0.6); x.l.visible = true; x.l.position.set(BX - 0.7 + i * 1.4, h + 0.75, 0.9); x.l.userData.size(0.55); x.v.visible = true; x.v.userData.set((i ? lerp(22.6, 35.6, k) : 22.6).toFixed(1) + '回'); x.v.position.set(BX - 0.7 + i * 1.4, h + 0.3, 0.9); });
  setTop('1分間の上体起こし（プランク組・平均）', '+' + Math.round(55 * k) + '%', fade(t, 0.5, d, 0.25), GREEN); setHud('Park ほか', 'Eur J Sport Sci 2024年', 1);
  barCam();
  return S;
}
function sChui(t, d) { // ただし小さな研究。腰が痛い人は無理しないで
  reset(); lift(160); studyCam(1); say(chiisai, t, 0.2, BX, 2.2, -0.6, 0.9); if (t > d * 0.4) say(muri, t, d * 0.4, BX, 1.55, 0.2, 1.45);
  return S;
}
function sKekka(t, d) { // 結果：1分ずつのプランクを12週続けて、上体起こしが約1.5倍できる体になった
  reset(); lift(150); plank(ME, -1.25, -1.2, 1, 0, t); setTimer('0:00', '#9be86a', -1.0, 1.08, -1.3, 0.85); sparkA.set(clamp(t / 2));
  setTop('結果', '上体起こし 約1.5倍', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.4, u), lerp(1.4, 1.7, u), lerp(3.3, 4.0, u), 0.05, 0.75, -1.2, 50);
  return S;
}
function sAshita(t, d) { // 明日から本気出す は、今日の1分を、毎日あしたに送っていただけだったのかもしれない
  reset(); lift(150); ME.visible = true; ME.position.set(-0.6, 0, -0.9); ME.rotation.set(0, 0.5, 0); ME.userData.arms[1].rotation.set(-1.2, 0, 0.4);
  CAL.visible = true; CAL.position.set(0.7, 1.6, -2.9); calLab.visible = true; calLab.position.set(0.7, 1.5, -2.8); calLab.userData.size(0.38);
  const n = Math.floor(t / 0.9); calLab.userData.set(n % 2 ? 'あした' : 'あした');
  CAL.rotation.z = Math.sin(t * 3) * 0.03;
  if (t > d * 0.4) say(ashita, t, d * 0.4, 0.0, 2.45, -1.2, 1.45);
  look(0.2, 1.75, 3.4, 0.1, 1.4, -1.3, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); plank(ME, -1.25, -1.2, 1, 1, t); sweat.userData.set(0.6, t); setTimer(mmss(60 - Math.floor(t * 2)), '#7dff8a', -1.0, 1.08, -1.3, 1.0); floorCam(0); return S; }

const NARR = { '横': 'よこ', '家族': 'かぞく', '向けて': 'むけて', '笑う': 'わらう', '会社員': 'かいしゃいん', '顔': 'かお', '真っ赤': 'まっか', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '腹筋': 'ふっきん', '明日': 'あした', '本気出す': 'ほんきだす', '1日目': 'いちにちめ', '1分': 'いっぷん', '28秒': 'にじゅうはちびょう', 'お腹': 'おなか', '床': 'ゆか', '1週間後': 'いっしゅうかんご', '45秒': 'よんじゅうごびょう', '足': 'あし', '1か月後': 'いっかげつご', '0:00': 'ゼロ', '体': 'からだ', '変わる': 'かわる', '韓国': 'かんこく', '大学生': 'だいがくせい', '61人': 'ろくじゅういちにん', '12週間': 'じゅうにしゅうかん', '確かめた': 'たしかめた', '研究': 'けんきゅう', '1分ずつ': 'いっぷんずつ', '3種類': 'さんしゅるい', '週に3回': 'しゅうにさんかい', '上体起こし': 'じょうたいおこし', '回数': 'かいすう', '約23回': 'やくにじゅうさんかい', '約36回': 'やくさんじゅうろっかい', '増えた': 'ふえた', '小さな': 'ちいさな', '腰': 'こし', '痛い': 'いたい', '無理': 'むり', '結果：': '結果、', '12週': 'じゅうにしゅう', '続けて': 'つづけて', '約1.5倍': 'やくいってんごばい', '今日': 'きょう', '毎日': 'まいにち', '送って': 'おくって', '今': 'いま', '何秒': 'なんびょう' };
const P = planTimes([
  ['横で家族がスマホを<br>向けて笑う。', (t, d) => sWarau(t, 2 * d)],
  ['会社員は顔を真っ赤に<br>したまま固まる。', (t, d) => sWarau(t + d, 2 * d)],
  ['本人の言い分から。<br>腹筋は、明日から本気出す。', sHonki],
  ['1日目。1分のはずが、<br>28秒でお腹が床につく。', sDay1],
  ['1週間後。45秒で、<br>足がプルプル。', sWeek1],
  ['1か月後。タイマーが<br>0:00 になっても、', (t, d) => sMonth(t, 2 * d)],
  ['体がまっすぐのまま。', (t, d) => sMonth(t + d, 2 * d)],
  ['でも、1分のプランクで、<br>体はどこまで変わるのか。', sDoko],
  ['韓国の大学生61人で、<br>12週間確かめた研究がある。', sStudy],
  ['1分ずつのプランクを<br>3種類、週に3回。', sKinds],
  ['上体起こしの回数は、', (t, d) => sSitup(t, 2 * d)],
  ['約23回から<br>約36回に増えた。', (t, d) => sSitup(t + d, 2 * d)],
  ['ただし小さな研究。<br>腰が痛い人は無理しないで。', sChui],
  ['結果：1分ずつのプランクを<br>12週続けて、', (t, d) => sKekka(t, 2 * d)],
  ['上体起こしが約1.5倍<br>できる体になった。', (t, d) => sKekka(t + d, 2 * d)],
  ['明日から本気出す は、<br>今日の1分を、', (t, d) => sAshita(t, 3 * d)],
  ['毎日あしたに<br>送っていただけ', (t, d) => sAshita(t + d, 3 * d)],
  ['だったのかもしれない。', (t, d) => sAshita(t + 2 * d, 3 * d)],
  ['今やってみて。<br>プランク、何秒いけた？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0708',
    v2: true,
    tt: 'main',
    hookLine: '床に伏せた会社員の頭の上に 1:00 のタイマーが出て、すぐに腕がプルプル震え出す。',
    series: '人体の限界',
    hookType: 'H1',
    cat: '体・健康',
    title: 'もしも毎日1分のプランクを続けたら？',
    titleHtml: 'もしも毎日<br>1分のプランクを<br>続けたら？',
    mood: 'hopeful', seed: 708, hits: [TP, P.at(13), P.at(16)], risers: [P.at(7)], impacts: [P.at(8, 0.6), P.at(11, 0.5)],
    sfx: [[0.05, 'alarm'], [TP, 'meter', 0.3], [P.at(0, 0.3), 'bubble'], [P.at(3, 2.0), 'poof'], [P.at(6, 0.3), 'bubble'], [P.at(12, 0.5), 'alarm'], [P.at(16, 0.3), 'whoosh']],
    narr: NARR,
    ask: '今やってみて。プランク、何秒いけた？',
    caption: 'もしも毎日1分のプランクを続けたら？\n\n横で家族がスマホを向けて笑う。会社員は顔を真っ赤にしたまま固まる。\n本人の言い分から。腹筋は、明日から本気出す。\n1日目。1分のはずが、28秒でお腹が床につく。\n1週間後。45秒で、足がプルプル。\n1か月後。タイマーが 0:00 になっても、体がまっすぐのまま。\nでも、1分のプランクで、体はどこまで変わるのか。\n韓国の大学生61人で、12週間確かめた研究がある。\n1分ずつのプランクを3種類、週に3回。\n上体起こしの回数は、約23回から約36回に増えた。\nただし小さな研究。腰が痛い人は無理しないで。\n\n結果：1分ずつのプランクを12週続けて、上体起こしが約1.5倍できる体になった。\n明日から本気出す は、今日の1分を、毎日あしたに送っていただけだったのかもしれない。\n\n※研究は20〜24歳の大学生で、ふつう・ひじ・横のプランクを各1分、3〜5セットずつ、指導つきで週3回。腰痛・妊娠中・持病のある人は無理をしないで。\n\n今やってみて。プランク、何秒いけた？ コメントで教えて。\n\n出典：Park ほか European Journal of Sport Science（2024年）韓国の大学生61人のランダム化比較試験（1分間の上体起こし 22.6回→35.6回）',
    hashtags: ['もしもラボ', 'もしも', 'プランク', '体幹', '人体の限界'],
    endStats: [['プランクの研究', '61人・12週間', '韓国・2024年'], ['1分間の上体起こし', '22.6回→35.6回', 'プランク組の平均'], ['プランク', '各1分×3種類', '週3回']],
    sources: '出典：Park ほか European Journal of Sport Science（2024年）',
  },
});
