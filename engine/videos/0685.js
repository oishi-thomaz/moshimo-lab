import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, label, pop } from '../satire-kit.js';
import { addKnees, fitReset, planTimes } from '../scenes/fitness.js';
import { makeSet, makeFridge, makeMirror } from '../scenes/home.js';

// もしも腹筋100回を、30日やりきったら？（人体の限界・台本 S85・作り直し 0612）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。plan/remake.md の5：1日目・3日目・10日目・30日目の体を先に見せ、腹直筋の説明と研究の数字は20秒より後
// 数字（一次資料で確認・2026/11/14。PubMed の抄録）：Vispute SS ほか J Strength Cond Res 2011;25(9):2559-64
//  24人・6週間の腹筋運動。上体起こし（カールアップ）の回数は 続けた人47回・何もしない人32回。お腹の脂肪（体脂肪率・腹囲・皮下脂肪）は減らなかった
//  30日で合計3,000回は 100回×30日 の単純計算。腹直筋はもともと区切られた形（腱画）で、見えるかどうかは上の脂肪の量

const GOLD = '#ffd27a', GREEN = '#9be86a', RED = '#ff8a7a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#d8d0c4' }); hemi.intensity = 1.3;
const SHIRT = '#4f8fd9';
const ME = makeMan({ shirt: SHIRT, hair: '#1d1a19' }); addKnees(ME); // お腹をへこませたい会社員
const BELLY = box(0.46, 0.3, 0.16, mat(SHIRT)); BELLY.position.set(0, 1.02, 0.17); ME.add(BELLY);
const SKINB = box(0.47, 0.3, 0.17, mat('#f1c9a5')); SKINB.position.set(0, 1.02, 0.18); ME.add(SKINB); // シャツをめくったお腹
const LIFTED = box(0.52, 0.12, 0.3, mat(SHIRT)); LIFTED.position.set(0, 1.24, 0.08); ME.add(LIFTED);
const WRAP = new THREE.Group(); S.add(WRAP); WRAP.add(ME);
const LYING = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)));
function poseCrunch(k) {
  const U = ME.userData; const c = 0.85 * k; ME.position.set(0, -0.86, 0); ME.rotation.set(0, 0, 0);
  WRAP.quaternion.copy(LYING).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), c));
  const phi = 0.9; U.legs.forEach(l => { l.rotation.x = -phi - c; }); U.knees.forEach(n => { n.rotation.x = 1.0 + phi; });
  U.arms.forEach((a, i) => { a.rotation.set(-2.7, 0, i ? -0.5 : 0.5); }); U.head.rotation.x = 0.25 * k;
}
function stand(x, z, ry = 0) { WRAP.quaternion.identity(); WRAP.position.set(x, 0, z); WRAP.rotation.set(0, ry, 0); fitReset(ME); ME.position.set(0, 0, 0); }
const MAT_X = 0, MAT_Z = 0;

// ---------- A：リビング（原点）：ヨガマット ----------
const roomA = room({ x: 0, w: 8, d: 6, h: 3, wall: '#efe6d6', floor: '#b48a5e' });
const yoga = flat(2.1, 0.8, '#4f8fb3', MAT_X - 0.3, MAT_Z, -0.7, 0.012);
const COUNTER = label('0回', { w: 640, size: 170, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.1 }); S.add(COUNTER);
const sparkA = makeSparkles(150, 0.14, 0xfff2c0); S.add(sparkA.points); sparkA.init([[-0.2, 1.6, -0.3]], 0.8, 1.2);
const shizumu = label('98回目', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.8 }); S.add(shizumu);
const iibun = label('腹筋さえやれば へこむ', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.7 }); S.add(iibun);
const sofa = new THREE.Group(); { const sm = mat('#6a7a8a'); const a = box(2.2, 0.45, 0.9, sm); a.position.y = 0.23; sofa.add(a); const b = box(2.2, 0.6, 0.25, sm); b.position.set(0, 0.75, -0.35); sofa.add(b); } sofa.position.set(1.8, 0, -2.2); S.add(sofa);
const warau = label('笑うだけで 痛い', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(warau);
const yasumazu = label('休まず 100回', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(yasumazu);

// ---------- B：洗面所の鏡（x=60） ----------
const BX = 60;
const roomB = room({ x: BX, w: 6, d: 5, h: 3, wall: '#dfe7ea', floor: '#c8ccd4' });
const MIR = makeMirror(1.0, 1.2); MIR.position.set(BX, 0, -2.3); S.add(MIR);
const are = label('あれ？', { w: 512, size: 130, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.75 }); S.add(are);
const sonomama = label('見た目は そのまま', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.4 }); S.add(sonomama);

// ---------- C：お腹の中（x=120）：腹直筋と脂肪 ----------
const CX = 120;
flat(12, 10, '#2a3040', CX, 0);
const cwall = box(12, 5, 0.2, mat('#323a4e')); cwall.position.set(CX, 2.5, -2.4); S.add(cwall);
const ABS = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { const a = box(0.42, 0.36, 0.14, new THREE.MeshLambertMaterial({ color: '#c8504a', emissive: 0x000000 })); a.position.set(CX - 0.23 + c * 0.46, 2.2 - r * 0.42, -1.0); S.add(a); ABS.push(a); }
const FAT = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.45, 0.14), new THREE.MeshLambertMaterial({ color: '#f2d27a', transparent: true, opacity: 0.0, depthWrite: false })); FAT.position.set(CX, 1.78, -0.84); FAT.renderOrder = 3; S.add(FAT);
const fukuchoku = label('腹直筋', { w: 512, size: 110, color: '#fff', bg: 'rgba(200,80,74,.97)', sx: 0.8 }); S.add(fukuchoku);
const shibou = label('脂肪', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(242,210,122,.98)', sx: 0.6 }); S.add(shibou);
const BAR_C = box(0.7, 1, 0.7, mat('#8a8f99')); S.add(BAR_C); const BAR_E = box(0.7, 1, 0.7, mat('#5ac88a')); S.add(BAR_E);
const labC = label('何もしない 32回', { w: 768, size: 96, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(labC);
const labE = label('続けた 47回', { w: 640, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(labE);
const sparkC = makeSparkles(120, 0.12, 0xffe0d0); S.add(sparkC.points); sparkC.init(ABS.map(a => a.position.toArray()), 0.3, 0.6);

// ---------- D：台所の冷蔵庫（x=180） ----------
const DX = 180;
const roomD = room({ x: DX, w: 7, d: 5, h: 3, wall: '#efe6d6', floor: '#c9b8a0' });
const FRIDGE = makeFridge(); FRIDGE.position.set(DX + 0.6, 0, -1.9); S.add(FRIDGE);
const SWITCH = label('へこますスイッチ', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(SWITCH);
const yuka = label('床の上じゃなく', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.2 }); S.add(yuka);

const LABELS = [COUNTER, shizumu, iibun, warau, yasumazu, are, sonomama, fukuchoku, shibou, labC, labE, SWITCH, yuka];
function reset() {
  LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkC.set(0); el.flash.style.opacity = 0;
  WRAP.visible = true; WRAP.position.set(MAT_X - 0.15, 0.16, MAT_Z); WRAP.rotation.set(0, 0, 0); fitReset(ME); ME.rotation.set(0, 0, 0);
  SKINB.visible = false; LIFTED.visible = false; BELLY.visible = true;
  ABS.forEach(a => { a.visible = false; a.material.emissive.setRGB(0, 0, 0); }); FAT.visible = false; BAR_C.visible = BAR_E.visible = false; FRIDGE.userData.open(0);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function counter(n, x = 0.9, y = 1.5, z = -0.4, sx = 0.95) { COUNTER.visible = true; COUNTER.userData.set(comma(n) + '回'); COUNTER.position.set(x, y, z); COUNTER.userData.size(sx); }
const TP = 0.45;
function matCam(u = 0) { look(lerp(-0.35, -0.4, u), lerp(2.0, 1.95, u), lerp(3.4, 3.2, u), -0.45, lerp(0.55, 0.5, u), -0.2, 50); }
function shot0(t) { // 0秒＝サムネ：マットの上で、腹筋の回数が 100 でドンと止まる
  reset(); lift(0); const n = t < TP ? Math.round(lerp(94, 99, t / TP)) : 100; poseCrunch(t < TP ? Math.abs(Math.sin(t * 9)) : 1);
  counter(n, -0.45, 0.35, 1.0, t >= TP ? 0.95 * (1 + 0.25 * Math.max(0, 1 - (t - TP) * 5)) : 0.95); COUNTER.material.color.set(t >= TP ? '#ffd27a' : '#ffffff');
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  matCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sDay1(t, d) { // 1日目。お腹をへこませたい会社員が、98回目で床に沈む
  reset(); lift(120); const k = t < d * 0.45 ? Math.abs(Math.sin(t * 7)) : Math.max(0, 1 - (t - d * 0.45) * 3); poseCrunch(k);
  counter(t < d * 0.45 ? Math.min(98, 90 + Math.floor(t * 4)) : 98, -0.4, 1.45, -0.6, 0.85);
  if (t > d * 0.5) say(shizumu, t, d * 0.5, -0.4, 1.05, 0.0, 0.7);
  setHud('腹筋100回', '1日目', 1);
  matCam(0.5);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。腹筋さえやれば、お腹はへこむ
  reset(); lift(120); stand(0.2, -0.3, 0.2); ME.userData.arms[1].rotation.set(-1.2, 0, 0.6); ME.userData.arms[0].rotation.set(-0.6, 0, -0.3);
  if (t > 0.4) say(iibun, t, 0.4, 0.3, 2.0, -0.3, 1.3);
  look(0.5, 1.6, 2.6, 0.2, 1.35, -0.3, 50);
  return S;
}
function sDay3(t, d) { // 3日目。笑うだけで、お腹が痛い
  reset(); lift(120); stand(1.6, -1.9, 0); ME.position.y = -0.4; ME.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); ME.userData.knees.forEach(k => k.rotation.x = Math.PI / 2);
  const shake = Math.sin(t * 22) * 0.04; ME.rotation.x = 0.35 + shake; ME.userData.arms.forEach((a, i) => a.rotation.set(-0.75, 0, i ? -0.55 : 0.55)); ME.userData.head.rotation.x = -0.2;
  if (t > d * 0.4) say(warau, t, d * 0.4, 1.6, 1.85, -1.6, 1.15);
  setHud('腹筋100回', '3日目', 1);
  look(1.9, 1.5, 0.6, 1.6, 1.0, -1.9, 50);
  return S;
}
function sDay10(t, d) { // 10日目。100回が、休まずできるようになる
  reset(); lift(120); poseCrunch(Math.abs(Math.sin(t * 9))); counter(Math.min(100, Math.floor(t / (d * 0.8) * 100)), -0.4, 1.45, -0.6, 0.85);
  if (t > d * 0.75) say(yasumazu, t, d * 0.75, -0.4, 1.05, 0.0, 1.0);
  setHud('腹筋100回', '10日目', 1);
  matCam(0.8);
  return S;
}
function mirrorShot(t, d, labOn, k0 = 0) {
  reset(); lift(120); stand(BX - 0.1, -1.5, -0.35); const k = clamp((t + k0 - 0.4) / 0.6);
  ME.userData.arms.forEach((a, i) => a.rotation.set(-0.5 - 1.0 * k, 0, i ? -0.25 : 0.25));
  if (k > 0.6) { BELLY.visible = false; SKINB.visible = true; LIFTED.visible = true; }
  ME.userData.head.rotation.x = 0.35;
  if (labOn) labOn();
  look(BX + 2.0, 1.6, 1.3, BX - 0.2, 1.25, -1.7, 50);
  return S;
}
function sDay30(t, d) { // 30日目。鏡の前でシャツをめくる。あれ？
  mirrorShot(t, d, () => { if (t > d * 0.6) say(are, t, d * 0.6, BX + 0.1, 1.95, -1.3, 0.5); });
  setHud('腹筋100回', '30日目', 1);
  return S;
}
function bodyCam(u = 0) { look(CX + lerp(0.5, 0.2, u), lerp(2.2, 2.0, u), lerp(3.4, 3.0, u), CX, 1.8, -1.0, 50); }
function sAbs(t, d) { // でも実は、腹筋は誰でも、もともと割れている
  reset(); lift(160); WRAP.visible = false; ABS.forEach((a, i) => { a.visible = t > 0.3 + i * 0.12; });
  if (t > d * 0.5) say(fukuchoku, t, d * 0.5, CX, 2.75, -0.9, 0.7);
  bodyCam(ease(clamp(t / d)));
  return S;
}
function sFat(t, d) { // 見えないのは、上に脂肪がのっているだけ
  reset(); lift(160); WRAP.visible = false; ABS.forEach(a => a.visible = true); FAT.visible = true; FAT.material.opacity = 0.92 * easeOut(clamp((t - 0.3) / 1.0));
  if (t > d * 0.5) say(shibou, t, d * 0.5, CX, 2.75, -0.7, 0.55);
  bodyCam(1);
  return S;
}
function barCam() { look(CX + 0.2, 2.0, 4.6, CX, 1.6, -1.0, 50); }
function sStudy(t, d) { // 腹筋を6週間続けた研究。何もしない人は32回、続けた人は47回
  reset(); lift(160); WRAP.visible = false; BAR_C.visible = BAR_E.visible = true;
  const k = easeOut(clamp((t - d * 0.3) / 1.2)); const s = 0.05;
  const hC = 32 * s, hE = lerp(32, 47, k) * s;
  BAR_C.scale.y = hC; BAR_C.position.set(CX - 0.7, hC / 2 + 0.3, -1.0); BAR_E.scale.y = hE; BAR_E.position.set(CX + 0.7, hE / 2 + 0.3, -1.0);
  if (t > d * 0.3) { labC.visible = true; labC.position.set(CX - 0.7, hC + 0.65, -0.6); labC.userData.size(0.95); labE.visible = true; labE.position.set(CX + 0.7, hE + 0.65, -0.6); labE.userData.size(0.85); }
  setTop('6週間後の上体起こし（2011年）', t > d * 0.3 + 1.2 ? '32回 → 47回' : '…', fade(t, 0.3, d, 0.25), GREEN); setHud('Vispute ほか', '24人・6週間', 1);
  barCam();
  return S;
}
function sNotFat(t, d) { // でも、お腹の脂肪は減らなかった
  reset(); lift(160); WRAP.visible = false; ABS.forEach(a => a.visible = true); FAT.visible = true; FAT.material.opacity = 0.92;
  say(shibou, t, 0.2, CX, 2.75, -0.7, 0.55);
  setTop('6週間後の お腹の脂肪（2011年）', '減らなかった', fade(t, 0.3, d, 0.25), RED); setHud('Vispute ほか', '24人・6週間', 1);
  bodyCam(1);
  return S;
}
function s3000(t, d) { // 30日で合計3,000回。お腹の中は、ちゃんと強くなっていた
  reset(); lift(160); WRAP.visible = false; const k = clamp((t - 0.3) / 1.2);
  ABS.forEach(a => { a.visible = true; a.material.emissive.setRGB(0.35 * k, 0.08 * k, 0.02 * k); }); FAT.visible = true; FAT.material.opacity = lerp(0.92, 0.35, k);
  sparkC.set(clamp((t - 0.6) / 1.5));
  setTop('30日の合計（100回×30日・単純計算）', comma(Math.round(3000 * easeOut(clamp(t / 1.2)))) + '回', fade(t, 0.2, d, 0.25), GOLD);
  bodyCam(0.6);
  return S;
}
function sKekka(t, d) { // 結果：腹筋を3,000回やって、強くなったのはお腹の中。見た目はそのままだった
  mirrorShot(t, d, () => { if (t > d * 0.55) say(sonomama, t, d * 0.55, BX + 0.2, 1.95, -1.3, 0.95); }, 2);
  setTop('結果', '見た目は そのまま', fade(t, 0.3, d, 0.25), GOLD);
  return S;
}
function sFridge(t, d) { // お腹をへこますスイッチは、床の上じゃなく、冷蔵庫の前にあった
  reset(); lift(120); stand(DX - 0.4, -0.9, 0.5); ME.userData.head.rotation.y = 0.5;
  FRIDGE.userData.open(easeOut(clamp((t - 0.5) / 1.0)));
  if (t > d * 0.2) say(yuka, t, d * 0.2, DX + 0.1, 2.45, -1.2, 0.9);
  if (t > d * 0.55) say(SWITCH, t, d * 0.55, DX + 0.1, 2.1, -1.2, 1.0);
  const u = ease(clamp(t / d)); look(DX + lerp(-0.2, 0.2, u), 1.7, lerp(2.8, 2.4, u), DX + 0.1, 1.45, -1.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); poseCrunch(1); counter(100, -0.45, 0.35, 1.0, 0.95); COUNTER.material.color.set('#ffd27a'); matCam(0); return S; }

const NARR = { '1日目': 'いちにちめ', '98回目': 'きゅうじゅうはっかいめ', '会社員': 'かいしゃいん', '本人': 'ほんにん', '言い分': 'いいぶん', '腹筋': 'ふっきん', '3日目': 'みっかめ', '10日目': 'とおかめ', '100回': 'ひゃっかい', '30日目': 'さんじゅうにちめ', '30日': 'さんじゅうにち', '鏡': 'かがみ', '誰でも': 'だれでも', '脂肪': 'しぼう', '6週間': 'ろくしゅうかん', '32回': 'さんじゅうにかい', '47回': 'よんじゅうななかい', '3,000回': 'さんぜんかい', '合計': 'ごうけい', '結果：': '結果、', '冷蔵庫': 'れいぞうこ', '床': 'ゆか', '見た目': 'みため' };
const P = planTimes([
  ['1日目。お腹をへこませたい<br>会社員が、98回目で床に沈む。', sDay1],
  ['本人の言い分から。<br>腹筋さえやれば、お腹はへこむ。', sIibun],
  ['3日目。笑うだけで、<br>お腹が痛い。', sDay3],
  ['10日目。100回が、<br>休まずできるようになる。', sDay10],
  ['30日目。鏡の前で<br>シャツをめくる。あれ？', sDay30],
  ['でも実は、腹筋は誰でも、<br>もともと割れている。', sAbs],
  ['見えないのは、上に<br>脂肪がのっているだけ。', sFat],
  ['腹筋を6週間続けた研究。<br>何もしない人は32回、', (t, d) => sStudy(t, 2 * d)],
  ['続けた人は47回。', (t, d) => sStudy(t + d, 2 * d)],
  ['でも、お腹の脂肪は<br>減らなかった。', sNotFat],
  ['30日で合計3,000回。お腹の中は、<br>ちゃんと強くなっていた。', s3000],
  ['結果：腹筋を3,000回やって、<br>強くなったのはお腹の中。', (t, d) => sKekka(t, 2 * d)],
  ['見た目はそのままだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['お腹をへこますスイッチは、<br>床の上じゃなく、', (t, d) => sFridge(t, 2 * d)],
  ['冷蔵庫の前にあった。', (t, d) => sFridge(t + d, 2 * d)],
  ['お腹をへこますなら、<br>腹筋？食事？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0685',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0612',
    hookLine: 'マットの上で、腹筋の回数が 100 でドンと止まる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも腹筋100回を、30日やりきったら？',
    titleHtml: 'もしも<br>腹筋100回を、<br>30日<br>やりきったら？',
    mood: 'hopeful', seed: 685, hits: [TP, P.at(11), P.at(14)], risers: [P.at(5)], impacts: [P.at(8, 0.3), P.at(9, 0.4), P.at(10, 0.6)],
    sfx: [[TP, 'whoosh'], [P.at(0, 1.6), 'poof'], [P.at(2, 0.6), 'bubble'], [P.at(4, 1.6), 'meter', 0.3], [P.at(14, 0.5), 'whoosh']],
    narr: NARR,
    ask: 'お腹をへこますなら、腹筋？食事？',
    caption: 'もしも腹筋100回を、30日やりきったら？\n\n1日目。お腹をへこませたい会社員が、98回目で床に沈む。\n本人の言い分から。腹筋さえやれば、お腹はへこむ。\n3日目。笑うだけで、お腹が痛い。\n10日目。100回が、休まずできるようになる。\n30日目。鏡の前でシャツをめくる。あれ？\nでも実は、腹筋は誰でも、もともと割れている。見えないのは、上に脂肪がのっているだけ。\n腹筋を6週間続けた研究。何もしない人は32回、続けた人は47回（上体起こしの回数）。\nでも、お腹の脂肪は減らなかった。\n30日で合計3,000回（単純計算）。お腹の中は、ちゃんと強くなっていた。\n\n結果：腹筋を3,000回やって、強くなったのはお腹の中。見た目はそのままだった。\nお腹をへこますスイッチは、床の上じゃなく、冷蔵庫の前にあった。\n\nお腹をへこますなら、腹筋？食事？ コメントで教えて。\n\n出典：Vispute ほか Journal of Strength and Conditioning Research（2011年）',
    hashtags: ['もしもラボ', 'もしも', '腹筋', '筋トレ', '人体の限界'],
    endStats: [['6週間後の上体起こし', '32回 → 47回', '2011年・24人'], ['6週間後の お腹の脂肪', '減らなかった', '2011年・24人'], ['30日の合計', '3,000回', '単純計算']],
    sources: '出典：Vispute ほか J Strength Cond Res（2011年）',
  },
});
