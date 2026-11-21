import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el, comma } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSuit, makeSweat, poseSit, poseClear, makeDeskIsland, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeShelf } from '../scenes/home.js';

// もしもタバコ代を、1年ぜんぶ貯金したら？（台本 S116・お財布のもしも）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。1箱くらい安いもん と言うヤニカスが、貯金箱の重さで気づく回。後半で コンビニのコーヒーとお菓子 の非喫煙者にも返す
// 数字：1日1箱600円なら、600×365＝21万9,000円（単純計算・画面とキャプションに条件を出す）。
//   600円は主な紙巻きの定価の1つ（2026年1月時点 セブンスター・マールボロ 20本 600円、メビウス 580円。マイナビニュース 2026/01/14 のまとめ。財務省の小売定価認可の一覧 https://www.mof.go.jp/policy/tab_salt/topics/kouriteika.html は銘柄ごとの PDF までは開けなかった）。
//   「なら」の仮定として出す。喫煙率・健康の数字は使わない。実在の銘柄・パッケージは出さない（箱は無地）。吸う絵は出さない。コーヒーとお菓子の額は筋の中の話（数字なし）

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#d8e0e8', ground: '#a8a49a' }); hemi.intensity = 1.3;
const YANI = makeSuit({ jacket: '#5a5e66', tie: '#8a6a3a', hair: '#3a3330' }); S.add(YANI); const sweatY = makeSweat(); YANI.userData.head.add(sweatY);
const DOURYO = makeSuit({ woman: true, jacket: '#3a6a8a', hair: '#3a2620' }); S.add(DOURYO); const sweatD = makeSweat(); DOURYO.userData.head.add(sweatD);
const TENIN = makeMan({ shirt: '#5aa070', hair: '#2a2220' }); S.add(TENIN);
const COINS_H = box(0.08, 0.02, 0.08, mat('#e8c040')); COINS_H.position.set(0, -0.68, 0.1); YANI.userData.arms[1].add(COINS_H);

// 貯金箱（ぶた）
function makePig(color = '#f4a0b8') {
  const g = new THREE.Group(); const M = mat(color);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), M); body.scale.set(1.25, 1, 1); body.position.y = 0.32; g.add(body);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), mat('#e88aa4')); snout.rotation.z = Math.PI / 2; snout.position.set(0.39, 0.33, 0); g.add(snout);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 6), M); e.position.set(0.22, 0.6, s * 0.12); g.add(e); const ey = box(0.03, 0.04, 0.02, mat('#1a1a1e')); ey.position.set(0.33, 0.42, s * 0.1); ey.rotation.y = Math.PI / 2; g.add(ey); }
  for (const [x, z] of [[-0.18, -0.14], [-0.18, 0.14], [0.18, -0.14], [0.18, 0.14]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), M); l.position.set(x, 0.05, z); g.add(l); }
  const slot = box(0.16, 0.02, 0.03, mat('#3a2a2a')); slot.position.set(0, 0.62, 0); g.add(slot);
  return g;
}
const PIG_Y = makePig('#f4a0b8'); S.add(PIG_Y);
const PIG_D = makePig('#a0c8f4'); S.add(PIG_D);
const SHARDS = []; for (let i = 0; i < 10; i++) { const s = box(0.14, 0.1, 0.05, mat('#f4a0b8')); S.add(s); SHARDS.push(s); }
const COINS = []; for (let i = 0; i < 24; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14), mat(i % 3 ? '#e8c040' : '#c8ccd4')); S.add(c); COINS.push(c); }
const TBOX = new THREE.Group(); { const b = box(0.09, 0.14, 0.035, mat('#f4f2ec')); TBOX.add(b); const band = box(0.092, 0.035, 0.037, mat('#8a96a8')); band.position.y = 0.03; TBOX.add(band); } S.add(TBOX); // 無地の箱
const COFFEE = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.13, 12), mat('#f4f2ec')); c.position.y = 0.065; COFFEE.add(c); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 12), mat('#5a3a22')); l.position.y = 0.135; COFFEE.add(l); } S.add(COFFEE);
const SNACK = box(0.18, 0.12, 0.05, mat('#e8a03a')); S.add(SNACK);

// ---------- A：コンビニのレジ（原点） ----------
room({ x: 0, w: 9, d: 6, h: 3.0, wall: '#eef0f2', floor: '#c8ccd2' });
const shopL = new THREE.PointLight(0xffffff, 8, 12, 1.2); shopL.position.set(0, 2.8, 1.5); S.add(shopL);
const REG = box(2.6, 1.0, 0.7, mat('#e8e4dc')); REG.position.set(0, 0.5, -1.2); S.add(REG);
const REGT = box(2.7, 0.05, 0.8, mat('#b8bcc4')); REGT.position.set(0, 1.02, -1.2); S.add(REGT);
const SH = makeShelf({ w: 3.4, h: 1.6, rows: 3, seed: 3 }); SH.position.set(0, 1.0, -2.85); S.add(SH);
const sparkA = makeSparkles(90, 0.05, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0.2, 1.2, -1.0]], 0.35, 0.5);
const charin = label('チャリン', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.6 }); S.add(charin);
const kawatta = label('タバコ代が 貯金箱に', { w: 1000, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.25 }); S.add(kawatta);

// ---------- B：会社（x=60） ----------
const BX = 60;
room({ x: BX, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(BX, 0, -0.8); S.add(ISL);
const DOOR = box(1.0, 2.2, 0.08, mat('#8aa0b8')); DOOR.position.set(BX - 3.0, 1.1, -3.42); S.add(DOOR);
const yasui = label('1箱くらい 安いもん', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.25 }); S.add(yasui);
const katate = label('片手で 持てない', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.1 }); S.add(katate);
const ryote = label('両手で 出社', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.95 }); S.add(ryote);
const demo = label('持たされたのは ヤニカスだけじゃない', { w: 1300, size: 82, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.7 }); S.add(demo);
const onaji = label('同じくらいの 重さ', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.15 }); S.add(onaji);
const ogoru = label('コーヒー、おごるわ', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.25 }); S.add(ogoru);
const nefuda = label('くらい ＝ 1年ぶんの値札隠し', { w: 1200, size: 86, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.55 }); S.add(nefuda);

const LABELS = [charin, kawatta, yasui, katate, ryote, demo, onaji, ogoru, nefuda];
const PEOPLE = [YANI, DOURYO, TENIN];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatY.userData.set(0); sweatD.userData.set(0);
  [PIG_Y, PIG_D, TBOX, COFFEE, SNACK, ...SHARDS, ...COINS].forEach(o => o.visible = false); TBOX.scale.setScalar(1); PIG_Y.scale.setScalar(1); PIG_D.scale.setScalar(1); PIG_Y.rotation.set(0, 0, 0); PIG_D.rotation.set(0, 0, 0); COINS_H.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function walk(p, t, sp = 7, a = 0.45) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * a; p.userData.legs[1].rotation.x = -s * a; }
function coinDrop(pig, t, t0, n = 1, s = 1) { // 小銭がチャリンと貯金箱へ
  for (let i = 0; i < n; i++) { const c = COINS[i]; const u = clamp((t - t0 - i * 0.18) / 0.45); if (u <= 0 || u >= 1) continue; c.visible = true; c.position.set(pig.position.x, pig.position.y + (0.62 + (1 - u) * 0.8) * s, pig.position.z); c.rotation.x = Math.PI / 2; }
}
const TP = 0.35;
function reg() { stand(TENIN, 0.1, -2.0, 0); stand(YANI, 0.15, -0.4, Math.PI); YANI.userData.arms[1].rotation.set(-1.2, 0, 0); COINS_H.visible = true; }
function regCam(u = 0) { look(lerp(3.7, 3.4, u), 2.0, lerp(-0.75, -0.85, u), 0.1, 1.62, -1.15, 50); }
function shot0(t) { // 0秒＝サムネ：レジに置いたタバコの箱が、チャリンと貯金箱に変わる
  reset(); lift(0); reg(); const on = t > TP;
  if (!on) { TBOX.visible = true; TBOX.position.set(0.2, 1.2, -1.15); TBOX.scale.setScalar(2.2); }
  else { const k = easeOut(clamp((t - TP) / 0.25)); PIG_Y.visible = true; PIG_Y.position.set(0.2, 1.045, -1.15); PIG_Y.scale.setScalar(0.75 * Math.max(0.05, k)); PIG_Y.rotation.y = -0.6; sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(charin, t, TP, 0.2, 1.75, -1.4, 0.4); }
  if (t > TP + 0.35) say(kawatta, t, TP + 0.35, 0.3, 0.7, -1.15, 0.85);
  regCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sNidomi(t, d) { // 毎日1箱のヤニカスが、小銭を出した手のまま二度見する
  reset(); lift(150); reg(); PIG_Y.visible = true; PIG_Y.position.set(0.2, 1.045, -1.15); PIG_Y.scale.setScalar(0.55); PIG_Y.rotation.y = -0.6;
  const ph = t / d; YANI.userData.head.rotation.y = ph < 0.45 ? 0.6 * Math.min(1, ph * 6) : (ph < 0.6 ? 0 : 0.0); YANI.userData.head.rotation.x = ph > 0.6 ? 0.35 : 0.1; if (ph > 0.6) sweatY.userData.set(1, t);
  const u = ease(clamp(ph)); look(lerp(3.0, 2.7, u), 1.75, lerp(-0.5, -0.6, u), 0.1, 1.5, -0.8, 50);
  return S;
}
function sFuman(t, d) { // 吸わない同僚の不満から。1箱くらい安いもん、と毎日コンビニへ消えていく
  reset(); lift(150); stand(DOURYO, BX + 0.9, 0.9, -1.2); DOURYO.userData.arms[0].rotation.set(-0.3, 0, 0.4);
  const k = clamp((t - d * 0.5) / (d * 0.5)); stand(YANI, lerp(BX - 1.2, BX - 2.9, k), lerp(0.6, -3.0, k), Math.PI - 0.6); walk(YANI, t); YANI.visible = k < 0.98;
  if (t > d * 0.25) say(yasui, t, d * 0.25, BX - 1.0, 2.25, 0.0, 1.0);
  look(BX + 1.0, 1.9, 4.6, BX - 0.6, 1.35, -0.6, 50);
  return S;
}
function pigDesk(pig, sc, x, z) { pig.visible = true; pig.scale.setScalar(sc); pig.position.set(x, TABLE_Y + 0.03, z); pig.rotation.y = -0.4; }
function deskYani() { const s = ISL.userData.seats[0]; stand(YANI, BX + s.x, -0.8 + s.z, s.ry); poseSit(YANI); return { x: BX + s.x, z: -0.8 + s.z }; }
function s1(t, d) { // 1日目。貯金箱に、1箱分のお金がチャリン
  reset(); lift(150); const p = deskYani(); pigDesk(PIG_Y, 0.4, p.x + 0.1, p.z - 0.55); YANI.userData.arms[1].rotation.set(-1.3, 0, 0.1);
  coinDrop(PIG_Y, t, d * 0.25, 3, 0.4); if (t > d * 0.45) say(charin, t, d * 0.45, p.x + 0.4, 1.6, p.z - 0.5, 0.45);
  setHud('タバコ代を貯金', '1日目', 1);
  look(p.x + 1.6, 1.95, p.z + 2.4, p.x + 0.05, 1.05, p.z - 0.4, 50);
  return S;
}
function s2(t, d) { // 1か月後。貯金箱が、片手で持てないほど重くなる
  reset(); lift(150); stand(YANI, BX + 0.4, 0.8, 0.2); const k = Math.sin(t * 5) * 0.06;
  PIG_Y.visible = true; PIG_Y.scale.setScalar(0.85); YANI.userData.arms[1].rotation.set(-0.9 + k, 0, -0.1); YANI.rotation.z = -0.1; YANI.updateMatrixWorld(); const v = new THREE.Vector3(0.3, 0.55 + k, 0.45); YANI.localToWorld(v); PIG_Y.position.copy(v); PIG_Y.rotation.y = -0.4;
  if (t > d * 0.4) { sweatY.userData.set(1, t); say(katate, t, d * 0.4, BX + 0.4, 2.1, 0.8, 0.9); }
  setHud('タバコ代を貯金', '1か月後', 1);
  look(BX + 0.6, 1.7, 4.0, BX + 0.55, 1.2, 0.8, 50);
  return S;
}
function s3(t, d) { // 半年後。ヤニカスが、貯金箱を両手で抱えて会社に来る
  reset(); lift(150); const k = clamp(t / d); stand(YANI, lerp(BX - 2.9, BX - 0.8, k), lerp(-2.6, 0.0, k), 0.8); walk(YANI, t, 6, 0.3); YANI.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); YANI.rotation.x = -0.12;
  PIG_Y.visible = true; PIG_Y.scale.setScalar(1.5); YANI.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.45, 0.55); YANI.localToWorld(v); PIG_Y.position.copy(v); PIG_Y.rotation.y = 0.8 - Math.PI / 2;
  sweatY.userData.set(1, t); if (t > d * 0.35) say(ryote, t, d * 0.35, BX - 1.2, 2.6, -0.6, 0.9);
  setHud('タバコ代を貯金', '半年後', 1);
  look(BX + 0.8, 1.9, 3.6, BX - 1.2, 1.25, -0.8, 50);
  return S;
}
function deskD() { const s = ISL.userData.seats[1]; stand(DOURYO, BX + s.x, -0.8 + s.z, s.ry); poseSit(DOURYO); return { x: BX + s.x, z: -0.8 + s.z }; }
function sDemo(t, d) { // でも、貯金箱を持たされたのは、ヤニカスだけじゃなかった
  reset(); lift(150); const p = deskD(); COFFEE.visible = true; COFFEE.position.set(p.x - 0.25, TABLE_Y + 0.03, p.z + 0.45); SNACK.visible = true; SNACK.position.set(p.x + 0.25, TABLE_Y + 0.09, p.z + 0.45); DOURYO.userData.arms[1].rotation.set(-1.2, 0, 0.1);
  if (t > d * 0.35) say(demo, t, d * 0.35, p.x, 1.75, p.z, 1.3);
  look(p.x - 0.8, 1.95, p.z - 3.0, p.x, 1.05, p.z + 0.2, 50);
  return S;
}
function sDouryo(t, d) { // 毎日のコンビニコーヒーとお菓子の分も、吸わない同僚の貯金箱にチャリン
  reset(); lift(150); const p = deskD(); COFFEE.visible = true; COFFEE.position.set(p.x - 0.35, TABLE_Y + 0.03, p.z + 0.45); SNACK.visible = true; SNACK.position.set(p.x - 0.15, TABLE_Y + 0.09, p.z + 0.55);
  pigDesk(PIG_D, 0.4 + 0.4 * clamp(t / d), p.x + 0.25, p.z + 0.5); coinDrop(PIG_D, t, d * 0.5, 4, PIG_D.scale.x); if (t > d * 0.62) { say(charin, t, d * 0.62, p.x + 0.6, 1.75, p.z + 0.5, 0.45); sweatD.userData.set(1, t); }
  look(p.x - 0.8, 1.95, p.z - 3.0, p.x, 1.05, p.z + 0.3, 50);
  return S;
}
function s4(t, d) { // 1年後。二人の貯金箱が、同じくらいの重さで机に並ぶ
  reset(); lift(150); const a = deskYani(), b = deskD(); pigDesk(PIG_Y, 0.9, BX - 0.5, -0.8); pigDesk(PIG_D, 0.85, BX + 0.5, -0.8); PIG_D.rotation.y = Math.PI + 0.4;
  if (t > d * 0.45) say(onaji, t, d * 0.45, BX, 2.15, -0.8, 1.05);
  setHud('タバコ代を貯金', '1年後', 1);
  look(BX + 0.3, 2.3, 2.4, BX, 1.05, -0.8, 50);
  return S;
}
function sNum(t, d) { // 1日1箱600円なら、1年で21万9,000円（単純計算）
  reset(); lift(150); const a = deskYani(); pigDesk(PIG_Y, 1.0, BX - 0.35, -0.8); YANI.userData.head.rotation.x = 0.3;
  const k = easeOut(clamp((t - 0.4) / 1.6));
  setTop('1日1箱600円 × 365日（単純計算）', comma(Math.round(219000 * k / 1000) * 1000) + '円', fade(t, 0.2, d, 0.2), GOLD);
  look(BX + 1.6, 1.75, 1.2, BX - 0.3, 1.05, -0.8, 50);
  return S;
}
function sWaru(t, d) { // ヤニカスは貯金箱を割って、同僚に言う。コーヒー、おごるわ
  reset(); lift(150); deskYani(); deskD(); const k = clamp((t - d * 0.25) / 0.35);
  if (k <= 0) pigDesk(PIG_Y, 1.0, BX - 0.35, -0.8);
  else { SHARDS.forEach((s, i) => { s.visible = true; const a = i / 10 * Math.PI * 2; const r = 0.15 + easeOut(k) * 0.35; s.position.set(BX - 0.35 + Math.cos(a) * r, TABLE_Y + 0.08 + (1 - k) * 0.3, -0.8 + Math.sin(a) * r * 0.6); s.rotation.set(a, a * 2, 0); }); COINS.slice(0, 16).forEach((c, i) => { c.visible = true; const a = i * 2.3; const r = easeOut(k) * (0.1 + (i % 5) * 0.06); c.position.set(BX - 0.35 + Math.cos(a) * r, TABLE_Y + 0.04 + (i % 3) * 0.013, -0.8 + Math.sin(a) * r * 0.6); c.rotation.set(0, 0, 0); }); el.flash.style.opacity = k < 0.15 ? 0.2 : 0; }
  YANI.userData.arms[1].rotation.set(-1.5 + (k > 0 && k < 0.3 ? 0.4 : 0), 0, 0);
  if (t > d * 0.55) { say(ogoru, t, d * 0.55, BX - 0.3, 1.75, -0.2, 1.0); YANI.userData.head.rotation.y = 0.5; }
  look(BX + 2.2, 1.9, 0.8, BX - 0.1, 1.0, -0.8, 50);
  return S;
}
function sKekka(t, d) { // 結果：タバコ代を貯めたら、1年で残ったのは21万9,000円と、毎日のちょっとがいちばん高いという気づきだった
  reset(); lift(150); deskYani(); deskD(); COFFEE.visible = true; COFFEE.position.set(BX + 0.3, TABLE_Y + 0.03, -0.75); COINS.slice(0, 16).forEach((c, i) => { c.visible = true; const a = i * 2.3; const r = 0.1 + (i % 5) * 0.06; c.position.set(BX - 0.35 + Math.cos(a) * r, TABLE_Y + 0.04 + (i % 3) * 0.013, -0.8 + Math.sin(a) * r * 0.6); });
  setTop('結果', t < d * 0.45 ? '1年で 21万9,000円' : 'ちょっとが一番高い', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(BX + lerp(2.6, 3.0, u), 2.1, lerp(1.0, 1.4, u), BX, 1.0, -0.8, 50);
  return S;
}
function sNefuda(t, d) { // 1箱くらい の くらい は、1年ぶんの値札を隠すための言葉だったのかもしれない
  reset(); lift(150); reg(); TBOX.visible = true; TBOX.position.set(0.2, 1.12, -1.15); TBOX.scale.setScalar(1.6);
  if (t > d * 0.4) say(nefuda, t, d * 0.4, 0.2, 1.6, -1.15, 0.95);
  look(2.8, 1.75, -0.95, 0.1, 1.35, -1.15, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); reg(); PIG_Y.visible = true; PIG_Y.position.set(0.2, 1.045, -1.15); PIG_Y.scale.setScalar(0.75); PIG_Y.rotation.y = -0.6; regCam(0); return S; }

const NARR = { '毎日1箱': 'まいにちひとはこ', '小銭': 'こぜに', '出した': 'だした', '手': 'て', '二度見': 'にどみ', '吸わない': 'すわない', '同僚': 'どうりょう', '不満': 'ふまん', '1箱': 'ひとはこ', '安い': 'やすい', '毎日': 'まいにち', '消えていく': 'きえていく', '1日目': 'いちにちめ', '貯金箱': 'ちょきんばこ', '1箱分': 'ひとはこぶん', '1か月後': 'いっかげつご', '片手': 'かたて', '持てない': 'もてない', '重く': 'おもく', '半年後': 'はんとしご', '両手': 'りょうて', '抱えて': 'かかえて', '会社': 'かいしゃ', '来る': 'くる', '持たされた': 'もたされた', 'お菓子': 'おかし', '分': 'ぶん', '1年後': 'いちねんご', '二人': 'ふたり', '同じ': 'おなじ', '重さ': 'おもさ', '机': 'つくえ', '並ぶ': 'ならぶ', '1日1箱600円': 'いちにちひとはころっぴゃくえん', '1年で21万9,000円': 'いちねんでにじゅういちまんきゅうせんえん', '21万9,000円': 'にじゅういちまんきゅうせんえん', '割って': 'わって', '言う': 'いう', '結果：': '結果、', 'タバコ代': 'タバコだい', '貯めたら': 'ためたら', '残った': 'のこった', '高い': 'たかい', '気づき': 'きづき', '1年ぶん': 'いちねんぶん', '値札': 'ねふだ', '隠す': 'かくす', '言葉': 'ことば', '1日': 'いちにち', '使ってる': 'つかってる' };
const P = planTimes([
  ['毎日1箱のヤニカスが、', (t, d) => sNidomi(t, 2 * d)],
  ['小銭を出した手のまま<br>二度見する。', (t, d) => sNidomi(t + d, 2 * d)],
  ['吸わない同僚の不満から。', (t, d) => sFuman(t, 2 * d)],
  ['1箱くらい安いもん、と<br>毎日コンビニへ消えていく。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。貯金箱に、<br>1箱分のお金がチャリン。', s1],
  ['1か月後。貯金箱が、片手で<br>持てないほど重くなる。', s2],
  ['半年後。ヤニカスが、貯金箱を<br>両手で抱えて会社に来る。', s3],
  ['でも、貯金箱を持たされたのは、<br>ヤニカスだけじゃなかった。', sDemo],
  ['毎日のコンビニコーヒーと<br>お菓子の分も、', (t, d) => sDouryo(t, 2 * d)],
  ['吸わない同僚の<br>貯金箱にチャリン。', (t, d) => sDouryo(t + d, 2 * d)],
  ['1年後。二人の貯金箱が、同じ<br>くらいの重さで机に並ぶ。', s4],
  ['1日1箱600円なら、1年で<br>21万9,000円（単純計算）。', sNum],
  ['ヤニカスは貯金箱を割って、<br>同僚に言う。', (t, d) => sWaru(t, 2 * d)],
  ['コーヒー、おごるわ。', (t, d) => sWaru(t + d, 2 * d)],
  ['結果：タバコ代を貯めたら、<br>1年で残ったのは', (t, d) => sKekka(t, 4 * d)],
  ['21万9,000円と、', (t, d) => sKekka(t + d, 4 * d)],
  ['毎日のちょっとが<br>いちばん高いという', (t, d) => sKekka(t + 2 * d, 4 * d)],
  ['気づきだった。', (t, d) => sKekka(t + 3 * d, 4 * d)],
  ['1箱くらい の くらい は、<br>1年ぶんの値札を', (t, d) => sNefuda(t, 2 * d)],
  ['隠すための言葉だったのかも<br>しれない。', (t, d) => sNefuda(t + d, 2 * d)],
  ['1日いくら、<br>なんとなく使ってる？', sAsk],
], { shot0, endCard, start: 2.7, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0717',
    v2: true,
    tt: 'main',
    hookLine: 'レジに置いたタバコの箱が、チャリンと貯金箱に変わる。',
    series: 'お財布のもしも',
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしもタバコ代を、1年ぜんぶ貯金したら？',
    titleHtml: 'もしもタバコ代を、<br>1年ぜんぶ<br>貯金したら？',
    mood: 'hopeful', seed: 717, hits: [TP, P.at(14), P.at(18)], risers: [P.at(7)], impacts: [P.at(11, 1.9), P.at(15, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.6), 'bubble'], [P.at(5, 0.3), 'whoosh'], [P.at(6, 0.3), 'whoosh'], [P.at(9, 0.4), 'bubble'], [P.at(12, 0.8), 'poof']],
    narr: NARR,
    ask: '1日いくら、なんとなく使ってる？',
    caption: 'もしもタバコ代を、1年ぜんぶ貯金したら？\n\n毎日1箱のヤニカスが、小銭を出した手のまま二度見する。\n吸わない同僚の不満から。1箱くらい安いもん、と毎日コンビニへ消えていく。\n1日目。貯金箱に、1箱分のお金がチャリン。\n1か月後。貯金箱が、片手で持てないほど重くなる。\n半年後。ヤニカスが、貯金箱を両手で抱えて会社に来る。\nでも、貯金箱を持たされたのは、ヤニカスだけじゃなかった。\n毎日のコンビニコーヒーとお菓子の分も、吸わない同僚の貯金箱にチャリン。\n1年後。二人の貯金箱が、同じくらいの重さで机に並ぶ。\n1日1箱600円なら、1年で21万9,000円（単純計算）。\nヤニカスは貯金箱を割って、同僚に言う。コーヒー、おごるわ。\n\n結果：タバコ代を貯めたら、1年で残ったのは21万9,000円と、毎日のちょっとがいちばん高いという気づきだった。\n1箱くらい の くらい は、1年ぶんの値札を隠すための言葉だったのかもしれない。\n\n1日いくら、なんとなく使ってる？ コメントで教えて。\n\n※金額は 1日1箱600円×365日 の単純計算です（定価は銘柄で違います）。お店・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'タバコ代', '貯金', 'お財布のもしも'],
    endStats: [['1日1箱600円 × 365日', '21万9,000円', '単純計算'], ['貯金箱が重かったのは', 'ヤニカスだけじゃない', 'もしもの結果'], ['くらい の正体', '1年ぶんの値札隠し', 'かもしれない']],
    sources: '1日1箱600円×365日の単純計算（定価は銘柄で違う）',
  },
});
