import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #138 彼女はキレイだった（ドラマ・韓国・2015年。U-NEXT・Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/geunyeoneun-yebbeossda（見放題：U-NEXT・Netflix・FOD・Disney Plus ほか）と
//   Filmarks の動画配信欄（U-NEXT・DMM TV・FOD・Lemino・Hulu・Netflix ほか見放題。2026年10月更新）で2026/11/24確認。
//   Filmarks 4.1・レビュー37,479件 filmarks.com/dramas/1093/2353（2015年製作・韓国）。同じ題の2021年の日本のドラマとは別）
// 確かめた事実（2026/11/24）：
//   ・Netflix 作品ページ netflix.com/jp/title/80188471 ：2015年・ラブロマンス。才色兼備のお嬢様だった少女時代から外見が180度変わってしまった彼女と、
//     完璧な男に生まれ変わった彼。15年の時を経て、幼い頃の初恋は再び花開くのか。
//     第1話：幼なじみと久しぶりに会うことになった主人公。現れた彼は超イケメンに成長していて、気後れした主人公は友人に自分の代役を頼む。
//     第2話：ファッション誌の編集部に出向となった主人公は、副編集長として配属された彼と再会。彼は慣れない仕事でミスをする主人公に辛く当たる。
//     第5話：雑誌がトップファッション誌の座に返り咲けなければ廃刊になる。第6話：彼は、記憶の中の主人公と目の前の友人の性格が重ならないことにとまどい始める
// 構成（ヒント6段）：1 初恋の人と15年ぶりに会うことに・でも私はもう昔の私じゃない → 2 主人公は子どものころだれもがあこがれた女の子・今はすっかり変わってしまった
//   → 3 現れた彼は見ちがえるほど素敵な大人・思わず親友に代わりに会ってとたのむ → 4 新しい職場はファッション雑誌の編集部・上司としてやってきたのはあの初恋の人
//   → 5 2015年の韓国ドラマ・雑誌は廃刊のピンチ → 6 決め手：彼はまだ気づいていない・すぐそばにいるのがあの日の初恋の女の子だと
// 結末・恋の行方は言わない。登場人物の名前・雑誌の名前は出さない。俳優の顔・ポスター・ロゴ・人物の見た目（髪型・そばかす）は使わない。
// 有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#2a2632', floor: '#3a3640', fogNear: 20, fogFar: 75 });
const qs = S.scene;
const R = rng(13810);

const HER = { skin: '#f4d3b5', hair: '#3a2a20', shirt: '#8a8a7a', pants: '#4a4a52', long: true };
const HIM = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#1e2230', pants: '#1e2230', tie: true, scale: 1.06 };
const FRIEND = { skin: '#f6d8c0', hair: '#5a3a24', shirt: '#c83a4a', pants: '#c83a4a', long: true, skirt: true };
const STAFF = [{ skin: '#f1c9a5', hair: '#2a2018', shirt: '#e8e0d8', pants: '#3a3a40' }, { skin: '#f4d3b5', hair: '#6a4a30', shirt: '#2a2a30', pants: '#2a2a30', long: true, skirt: true }, { skin: '#e8c0a0', hair: '#1a1410', shirt: '#6a8aa8', pants: '#2a2e3a' }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function cafe(x, z) { const g = new THREE.Group();
  const wl = box(8, 3.6, 0.3, mat('#4a3a30')); wl.position.y = 1.8; g.add(wl);
  const wn = box(4.4, 2.0, 0.05, gl('#ffd8a0', 0.55)); wn.position.set(0.6, 1.6, 0.17); g.add(wn);
  const fr = box(4.6, 0.12, 0.1, mat('#2a2018')); fr.position.set(0.6, 2.66, 0.2); g.add(fr); const fr2 = fr.clone(); fr2.position.y = 0.56; g.add(fr2);
  const aw = box(5.0, 0.12, 1.0, mat('#2a5a4a')); aw.position.set(0.6, 3.0, 0.6); aw.rotation.x = 0.25; g.add(aw);
  const dr = box(1.0, 2.2, 0.08, mat('#2a2018')); dr.position.set(-2.6, 1.1, 0.18); g.add(dr);
  const lt = new THREE.PointLight('#ffd0a0', 3, 6); lt.position.set(0.6, 1.8, -0.8); g.add(lt);
  g.position.set(x, 0, z); qs.add(g); return g; }

// ---------- 1段目. 夕暮れの街角（x=0）。明かりのついたカフェ。電柱のかげから、のぞく女性 ----------
{ const gr = box(30, 0.04, 20, mat('#5a5660')); gr.position.set(0, 0.02, -4); qs.add(gr);
  const sw = box(30, 0.12, 2.4, mat('#7a7680')); sw.position.set(0, 0.06, -5.2); qs.add(sw);
  for (let i = 0; i < 4; i++) { if (i === 1) continue; const b = box(5, 4 + R() * 2, 3, mat(['#6a5a5a', '#5a5a6a', '#7a6a60'][i % 3])); b.position.set(-12 + i * 7, 2.4, -8); qs.add(b); } }
const CAFE1 = cafe(-4.4, -6.6);
const HIM1 = person(HIM, -3.4, -5.6, 0.3);
const POLE1 = box(0.32, 5, 0.32, mat('#8a8a84')); POLE1.position.set(-0.05, 2.5, -2.5); qs.add(POLE1);
const HER1 = person(HER, 0.4, -2.75, -Math.PI / 2 - 0.3);
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ fog: false, color: '#c88a8a' })); SKY1.position.set(0, 12, -40); qs.add(SKY1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tFirst = tag('初恋の人と、15年ぶりに会う', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tFirst);
const tNot = tag('でも、もう昔の私じゃない', { size: 52, w: 720, bg: '#e24050', sx: 1.75 }); qs.add(tNot);

// ---------- 2段目. 小さな部屋（x=50）。かべの子どものころの写真（顔のないシルエット）、鏡の前でうつむく女性 ----------
const AX = 50;
{ const fl = box(8, 0.04, 7, mat('#6a5a4a')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(8, 3.4, 0.2, mat('#a8a090')); wl.position.set(AX, 1.7, -5.2); qs.add(wl);
  const bd = box(2.2, 0.5, 3, mat('#c8b8d0')); bd.position.set(AX + 2.4, 0.25, -3.4); qs.add(bd);
  const tb = box(1.2, 0.4, 0.8, mat('#8a6a4a')); tb.position.set(AX - 0.4, 0.2, -2.6); qs.add(tb);
  for (let i = 0; i < 5; i++) { const pp = box(0.3, 0.02, 0.22, mat('#f0ece4')); pp.position.set(AX - 0.6 + R() * 0.4, 0.42 + i * 0.02, -2.6 + R() * 0.2); pp.rotation.y = R(); qs.add(pp); } }
const MIRROR2 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), new THREE.MeshStandardMaterial({ color: '#c8d8e8', metalness: 0.6, roughness: 0.15 })); MIRROR2.position.set(AX - 2.2, 1.5, -5.08); qs.add(MIRROR2);
{ const mf = box(1.0, 1.7, 0.05, mat('#e8d8c0')); mf.position.set(AX - 2.2, 1.5, -5.11); qs.add(mf); }
const PHOTO2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshLambertMaterial({ map: canvasTex(160, 120, (g) => { g.fillStyle = '#f0e8d8'; g.fillRect(0, 0, 160, 120); g.fillStyle = '#a8d0e8'; g.fillRect(8, 8, 144, 104);
  g.fillStyle = '#e8a0b0'; g.beginPath(); g.arc(80, 48, 16, 0, 7); g.fill(); g.fillRect(64, 64, 32, 40); g.fillStyle = '#f8f0a0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(28 + i * 26, 100, 6, 0, 7); g.fill(); } }) }));
PHOTO2.position.set(AX + 0.6, 2.2, -5.08); qs.add(PHOTO2);
const HER2 = person(HER, AX - 1.4, -3.4, 0.5);
const LAMP2 = new THREE.PointLight('#ffe0b0', 2.5, 7); LAMP2.position.set(AX, 2.6, -2); qs.add(LAMP2);
const tStar = tag('子どものころは、あこがれの的', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tStar);
const tNow = tag('今は、すっかり変わってしまった', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tNow);

// ---------- 3段目. 夜のカフェの前（x=100）。窓の中に背の高いスーツの男性。外で、親友の背中を押す女性 ----------
const BX = 100;
{ const gr = box(30, 0.04, 20, mat('#4a4650')); gr.position.set(BX, 0.02, -4); qs.add(gr); }
const CAFE3 = cafe(BX, -5.4);
const HIM3 = person(HIM, BX + 0.9, -4.4, -0.4);
const HER3 = person(HER, BX - 1.6, -2.0, 0.6);
const FR3 = person(FRIEND, BX - 0.8, -2.6, Math.PI);
const tWow = tag('現れた彼は、見ちがえるほど素敵', { size: 48, w: 840, bg: '#14161c', sx: 1.9 }); qs.add(tWow);
const tSwap = tag('思わず、親友に代わりをたのむ', { size: 50, w: 780, bg: '#e24050', sx: 1.85 }); qs.add(tSwap);

// ---------- 4段目. 昼の編集部（x=150）。机がならぶ。かべの写真ボード（色の四角だけ）。前に立つ新しい上司 ----------
const CX = 150;
{ const fl = box(14, 0.04, 12, mat('#c8c4bc')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const wl = box(14, 4, 0.2, mat('#e8e6e0')); wl.position.set(CX, 2, -7.5); qs.add(wl);
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.0), new THREE.MeshLambertMaterial({ map: canvasTex(300, 120, (g) => { g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, 300, 120);
    const cs = ['#e8a0a8', '#a8c8e8', '#e8d8a0', '#a8e0c0', '#c8a8e0', '#f0b890', '#90c0d0', '#e0e0e0']; for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) { g.fillStyle = cs[(r * 7 + i) % cs.length]; g.fillRect(10 + i * 41, 10 + r * 56, 32, 46); } }) }));
  bd.position.set(CX + 1.6, 2.2, -7.38); qs.add(bd);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const dk = box(1.6, 0.08, 0.9, mat('#f0ece4')); dk.position.set(CX - 3 + i * 2.6, 0.8, -2.4 - r * 2.2); qs.add(dk);
    const lg = box(1.5, 0.76, 0.8, mat('#a8a8a8')); lg.position.set(CX - 3 + i * 2.6, 0.38, -2.4 - r * 2.2); qs.add(lg);
    const mn = box(0.6, 0.4, 0.05, mat('#2a2a30')); mn.position.set(CX - 3 + i * 2.6, 1.1, -2.7 - r * 2.2); qs.add(mn);
    for (let k = 0; k < 3; k++) { const mg = box(0.3, 0.03, 0.4, mat(['#e8a0a8', '#a8c8e8', '#e8d8a0'][k])); mg.position.set(CX - 3.5 + i * 2.6 + k * 0.1, 0.86 + k * 0.03, -2.3 - r * 2.2); qs.add(mg); } } }
const BOSS4 = person(HIM, CX + 0.4, -5.8, 0);
const HER4 = person(HER, CX - 0.4, -1.4, Math.PI + 0.2);
const ST4 = [person(STAFF[0], CX - 3, -3.6, 0.3), person(STAFF[1], CX + 2.6, -3.4, -0.4), person(STAFF[2], CX + 3.4, -1.4, -0.8)];
const tJob = tag('新しい職場は、ファッション雑誌', { size: 48, w: 840, bg: '#14161c', sx: 1.9 }); qs.add(tJob);
const tBoss = tag('上司は、あの初恋の人', { size: 54, w: 640, bg: '#e24050', sx: 1.6 }); qs.add(tBoss);

// ---------- 5段目. 夜の机の上（x=200）。表紙が無地の雑誌の山と、カレンダーの赤い丸 ----------
const DX = 200;
{ const fl = box(10, 0.04, 8, mat('#3a3640')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const tb = box(3.2, 0.1, 1.8, mat('#e8e4dc')); tb.position.set(DX, 0.9, -2.6); qs.add(tb); const tl = box(3.0, 0.86, 1.6, mat('#8a8680')); tl.position.set(DX, 0.43, -2.6); qs.add(tl);
  const wl = box(10, 4, 0.2, mat('#4a4650')); wl.position.set(DX, 2, -5); qs.add(wl); }
const MAGS5 = []; for (let s = 0; s < 3; s++) for (let i = 0; i < 6 + s * 2; i++) { const m = box(0.5, 0.03, 0.68, mat(['#e8a0a8', '#a8c8e8', '#e8d8a0', '#c8a8e0', '#f0f0ec'][(i + s) % 5])); m.position.set(DX - 0.9 + s * 0.9, 0.97 + i * 0.035, -2.6 + Math.sin(i * 1.3) * 0.04); m.rotation.y = Math.sin(i * 2.1) * 0.12; qs.add(m); MAGS5.push(m); }
const CAL5 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshLambertMaterial({ map: canvasTex(140, 140, (g) => { g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, 140, 140); g.fillStyle = '#c84a4a'; g.fillRect(0, 0, 140, 24);
  g.fillStyle = '#b8b8b8'; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.fillRect(8 + c * 18, 32 + r * 20, 12, 12); g.strokeStyle = '#e02a2a'; g.lineWidth = 4; g.beginPath(); g.arc(14 + 5 * 18, 38 + 4 * 20, 11, 0, 7); g.stroke(); }) }));
CAL5.position.set(DX + 1.4, 2.0, -4.88); qs.add(CAL5);
const DL5 = new THREE.PointLight('#ffe8c0', 3, 6); DL5.position.set(DX - 0.6, 2.2, -2.0); qs.add(DL5);
const t2015 = tag('2015年の、韓国ドラマ', { size: 56, w: 660, bg: '#e6b450', color: '#14161c', sx: 1.6 }); qs.add(t2015);
const tEnd = tag('雑誌は、廃刊のピンチ', { size: 56, w: 640, bg: '#e24050', sx: 1.6 }); qs.add(tEnd);

// ---------- 6段目. 夜の編集部（x=250）。机で小さな写真を見つめる上司。ついたての向こうに立つ主人公 ----------
const EX = 250;
{ const fl = box(12, 0.04, 10, mat('#5a5660')); fl.position.set(EX, 0.02, -3); qs.add(fl);
  const wl = box(12, 4, 0.2, mat('#3a3844')); wl.position.set(EX, 2, -7); qs.add(wl);
  const dk = box(2.0, 0.08, 1.0, mat('#f0ece4')); dk.position.set(EX - 0.8, 0.8, -3.6); qs.add(dk); const lg = box(1.9, 0.76, 0.9, mat('#8a8a8a')); lg.position.set(EX - 0.8, 0.38, -3.6); qs.add(lg);
  const pt = box(0.08, 1.6, 2.4, mat('#a8b0b8')); pt.position.set(EX + 0.9, 0.8, -3.0); qs.add(pt);
  for (let i = 0; i < 6; i++) { const w = box(1.2, 1.6, 0.05, gl('#2a3a5a')); w.position.set(EX - 5 + i * 2, 2.4, -6.85); qs.add(w); for (let k = 0; k < 3; k++) { const d = box(0.08, 0.08, 0.02, gl('#ffe8a0')); d.position.set(EX - 5.3 + i * 2 + k * 0.3, 2.0 + k * 0.4, -6.8); qs.add(d); } } }
const DLAMP6 = new THREE.PointLight('#ffe0a8', 3.5, 5); DLAMP6.position.set(EX - 0.6, 1.8, -3.2); qs.add(DLAMP6);
const PIC6 = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.2), new THREE.MeshBasicMaterial({ map: PHOTO2.material.map })); qs.add(PIC6);
const BOSS6 = person(HIM, EX - 0.8, -4.3, 0);
const HER6 = person(HER, EX + 1.6, -4.4, -Math.PI / 2 - 0.2);
const tDont = tag('彼はまだ、気づいていない', { size: 52, w: 720, bg: '#14161c', sx: 1.75 }); qs.add(tDont);
const tNear = tag('すぐそばにいるのが、初恋の女の子だと', { size: 42, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tNear);

// ---------- shots ----------
const ALL = [tFirst, tNot, tStar, tNow, tWow, tSwap, tJob, tBoss, t2015, tEnd, tDont, tNear, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SKY1.visible = false; }

function shotCorner(t, quiz = 0) { // 1段目 0〜9：初恋の人と、15年ぶりに会うことに。でも私は、もう昔の私じゃない（0秒目がサムネ）
  base(); SKY1.visible = true; S.aim(0, -4); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.7; S.key.color.set('#ffc0a0'); S.scene.background.set('#c88a8a'); S.scene.fog.color.set('#a87878');
  HIM1.userData.head.rotation.y = Math.sin(t * 0.8) * 0.4;
  const peek = quiz ? 1 : clamp((t - 0.4) / 1.2); HER1.position.x = 0.45 - peek * 0.2; HER1.userData.head.rotation.y = -0.3;
  HER1.userData.arms[1].rotation.x = -1.2; HER1.userData.arms[1].rotation.z = 0.4;
  const u = ease(t / 9);
  look(lerp(1.2, 0.8, u), lerp(1.9, 1.8, u), lerp(1.6, 0.8, u), -1.3, 1.4, -5.0, 62);
  Q1.position.set(-3.4, 2.55, -5.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tFirst, 1.05); pin(tNot, 1.05);
  if (!quiz) { tFirst.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tFirst.visible = false; tNot.userData.pop((t - 5.5) / 0.35); }
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：主人公は、子どものころだれもがあこがれた女の子。今は、見た目も暮らしもすっかり変わってしまった
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.6;
  HER2.userData.head.rotation.x = t > 4.2 ? 0.45 : 0; HER2.rotation.y = t > 4.2 ? 0.2 : 0.5;
  const u = ease(t / 8);
  look(AX + lerp(1.4, 0.9, u), lerp(1.9, 1.8, u), lerp(1.2, 0.4, u), AX - 0.8, 1.5, -4.6, 62);
  pin(tStar, 1.05); pin(tNow, 1.05);
  tStar.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStar.visible = false; tNow.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotCafe(t) { // 3段目 17〜25：現れた彼は、見ちがえるほど素敵な大人になっていた。思わず、親友に代わりに会ってとたのむ
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.4; S.darken(0.5, '#06050a');
  HIM3.userData.head.rotation.y = Math.sin(t * 0.7) * 0.3;
  if (t > 4.2) { HER3.userData.arms.forEach(a => a.rotation.x = -1.2); const k = clamp((t - 4.4) / 2.4); FR3.position.z = -2.6 - k * 1.2; poseWalk(FR3, t * 6, k > 0 && k < 1 ? 0.8 : 0); FR3.userData.head.rotation.y = k < 0.3 ? 0.8 : 0; }
  else { HER3.userData.arms.forEach(a => a.rotation.x = 0); FR3.position.z = -2.6; poseWalk(FR3, 0, 0); HER3.userData.head.rotation.y = -0.5; }
  const u = ease(t / 8);
  look(BX + lerp(-2.4, -1.8, u), lerp(1.9, 1.8, u), lerp(1.8, 1.0, u), BX + 0.2, 1.5, -5, 62);
  pin(tWow, 1.05); pin(tSwap, 1.05);
  tWow.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWow.visible = false; tSwap.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotOffice(t) { // 4段目 25〜33：新しい職場は、ファッション雑誌の編集部。上司としてやってきたのは、あの初恋の人
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.3; S.scene.background.set('#d8d4cc'); S.scene.fog.color.set('#d8d4cc');
  const k = clamp((t - 3.8) / 2.6); BOSS4.position.z = -5.8 + k * 1.6; poseWalk(BOSS4, t * 6, k > 0 && k < 1 ? 0.8 : 0);
  HER4.userData.head.rotation.x = t > 4.4 ? -0.1 : 0.3; ST4.forEach((p, i) => p.userData.head.rotation.y = t > 4.4 ? [0.5, -0.4, -0.2][i] : 0);
  const u = ease(t / 8);
  look(CX + lerp(-0.6, -0.2, u), lerp(2.2, 2.0, u), lerp(1.6, 0.8, u), CX + 0.3, 1.5, -5.2, 62);
  pin(tJob, 1.05); pin(tBoss, 1.05);
  tJob.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJob.visible = false; tBoss.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotDesk(t) { // 5段目 33〜42：2015年の、韓国ドラマ。雑誌は、トップに戻れなければ廃刊のピンチ
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5; S.darken(0.5, '#05050a');
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.3, 2.2, u), lerp(0.6, -0.2, u), DX + 0.3, 1.3, -3.6, 62);
  pin(t2015, 1.05); pin(tEnd, 1.05);
  t2015.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2015.visible = false; tEnd.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotNight(t) { // 6段目 42〜49（決め手）：彼はまだ、気づいていない。すぐそばにいるのが、あの日の初恋の女の子だと
  base(); S.aim(EX, -3); lift(0); S.hemi.intensity = 0.5; S.key.intensity = 0.35; S.darken(0.65, '#030308');
  BOSS6.userData.arms.forEach(a => a.rotation.x = -1.1); BOSS6.userData.head.rotation.x = 0.4;
  const hp = new THREE.Vector3(); BOSS6.updateMatrixWorld(); BOSS6.userData.arms[1].children[1].getWorldPosition(hp); PIC6.position.set(EX - 0.8, hp.y + 0.12, hp.z + 0.06); PIC6.rotation.x = -0.5;
  HER6.userData.head.rotation.y = t > 3.6 ? 0.25 : 0;
  const u = ease(t / 7);
  look(EX + lerp(0.6, 0.3, u), lerp(2.1, 2.0, u), lerp(1.6, 0.9, u), EX + 0.3, 1.3, -3.8, 62);
  pin(tDont, 1.05); pin(tNear, 1.05);
  if (t < 3.6) tDont.userData.pop((t - 0.3) / 0.35); else tNear.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夕暮れの街角に戻る）
  shotCorner(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotCorner(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotCafe },
  { a: 25, b: 33, f: shotOffice },
  { a: 33, b: 42, f: shotDesk },
  { a: 42, b: 49, f: shotNight },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '初恋の人と、<br>15年ぶりに会うことに。'],
  [5.6, 9.0, 'でも私は、もう<br>昔の私じゃない。'],
  [9.2, 13.2, '主人公は、子どものころ<br>だれもがあこがれた女の子。'],
  [13.2, 17.0, '今は、見た目も暮らしも<br>すっかり変わってしまった。'],
  [17.2, 21.0, '現れた彼は、見ちがえるほど<br>素敵な大人になっていた。'],
  [21.0, 25.0, '思わず、親友に<br>代わりに会ってとたのむ。'],
  [25.2, 29.0, '新しい職場は、<br>ファッション雑誌の編集部。'],
  [29.0, 33.0, '上司としてやってきたのは、<br>あの初恋の人。'],
  [33.2, 37.4, '2015年の、<br>韓国ドラマ。'],
  [37.4, 41.8, '雑誌は、トップに戻れなければ<br>廃刊のピンチ。'],
  [42.2, 45.4, '彼はまだ、<br>気づいていない。'],
  [45.4, 49.0, 'すぐそばにいるのが、<br>あの日の初恋の女の子だと。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>彼女はキレイだった。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q138', v2: true, answer: '彼女はキレイだった',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 13810,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.2, 'poof', 0.4], [25.0, 'whoosh'], [29.2, 'bubble', 0.4], [33.0, 'whoosh'], [37.6, 'buzz', 0.3], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ファッション雑誌': 'ファッションざっし', '上司として': 'じょうしとして', '15年ぶり': 'じゅうごねんぶり', '2015年': 'にせんじゅうごねん', '韓国ドラマ': 'かんこくドラマ', '見ちがえる': 'みちがえる', '変わって': 'かわって', '気づいて': 'きづいて', '聞かせて': 'きかせて', '主人公': 'しゅじんこう', '子ども': 'こども', '見た目': 'みため', '暮らし': 'くらし', '現れた': 'あらわれた', '代わり': 'かわり', '会って': 'あって', '新しい': 'あたらしい', '編集部': 'へんしゅうぶ', '女の子': 'おんなのこ', '当てて': 'あてて', '素敵': 'すてき', '大人': 'おとな', '親友': 'しんゆう', '会う': 'あう', '職場': 'しょくば', '初恋': 'はつこい', '雑誌': 'ざっし', '戻れ': 'もどれ', '廃刊': 'はいかん', '間に': 'あいだに', '答え': 'こたえ', '彼女': 'かのじょ', '何秒': 'なんびょう', '感想': 'かんそう', '人': 'ひと', '私': 'わたし', '昔': 'むかし', '今': 'いま', '彼': 'かれ', '日': 'ひ' },
    caption: 'このドラマのタイトル、わかる？\n初恋の人と、15年ぶりに会うことに。でも私は、もう昔の私じゃない。主人公は、子どものころだれもがあこがれた女の子。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Netflix', '韓国ドラマ', 'ドラマ好き'],
  },
});
applyQuizCards({ answer: '彼女は<br>キレイだった', info: 'U-NEXT・Netflix｜韓国ドラマ', answerSize: 128 });
