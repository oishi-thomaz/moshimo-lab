import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSuit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable } from '../scenes/home.js';

// もしも1か月、甘い飲み物をやめたら？（人体の限界・台本 S91）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/14 の解析の種（0665 水2リットル・0648 お酒の 1か月試す 型を飲み物で）
// 数字（一次資料で確認・2026/11/17。WHO のニュースリリース 2015年3月4日 WHO calls on countries to reduce sugars intake among adults and children）：
//  遊離糖は1日の総エネルギーの10%未満を強く推奨、5%未満・およそ25g（小さじ6杯）でさらに健康上の利益／甘い炭酸の缶1本に遊離糖が最大40g（小さじ約10杯）
//  目安の3倍は 缶2本80g÷25g＝3.2 の単純計算（画面とキャプションに書く）。体重・病気の変化の数字は使わない
// 商品名・ロゴ・実在の自販機の配色は出さない（無地の缶と色のボトルだけ）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#cfd8e2', ground: '#9a9a94' }); hemi.intensity = 1.3;
const KAISHA = makeSuit({ jacket: '#3a4256', tie: '#c8823a' }); S.add(KAISHA); // 毎日甘いのを2本空ける会社員
const sweat = makeSweat(); KAISHA.userData.head.add(sweat);

// ---------- 自販機（無地・架空の配色） ----------
function makeVending() {
  const g = new THREE.Group();
  const body = box(1.1, 1.9, 0.75, mat('#e8eef4')); body.position.y = 0.95; g.add(body);
  const top = box(1.12, 0.12, 0.77, mat('#5a8ac8')); top.position.y = 1.92; g.add(top);
  const win = box(0.96, 0.9, 0.02, new THREE.MeshBasicMaterial({ color: '#f8fbff' })); win.position.set(0, 1.38, 0.38); g.add(win);
  const COLS = ['#e8503a', '#f0a030', '#3a8ad8', '#c84a8a', '#5ab04a', '#f2d23a', '#8a5ad8', '#e87a5a'];
  const btns = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const col = COLS[(r * 4 + c) % COLS.length];
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 12), mat(col)); b.position.set(-0.33 + c * 0.22, 1.62 - r * 0.42, 0.33); g.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10), mat('#f4f4f2')); cap.position.set(-0.33 + c * 0.22, 1.77 - r * 0.42, 0.33); g.add(cap);
    const bt = box(0.13, 0.05, 0.03, mat('#2a2e38')); bt.position.set(-0.33 + c * 0.22, 1.43 - r * 0.42, 0.4); g.add(bt); btns.push(bt);
  }
  const slot = box(0.6, 0.18, 0.05, mat('#2a2e38')); slot.position.set(0, 0.35, 0.39); g.add(slot);
  const coin = box(0.14, 0.24, 0.03, mat('#9aa0aa')); coin.position.set(0.38, 0.95, 0.39); g.add(coin);
  g.userData = { btns };
  return g;
}
const VM = makeVending(); VM.position.set(0, 0, -1.6); S.add(VM);
const roomA = room({ x: 0, w: 10, d: 6, h: 3.4, wall: '#d8dde4', floor: '#a8aaa8', left: false });
// 大きな手（アップ用）
const HAND = new THREE.Group(); { const sk = mat('#f1c9a5'); const palm = box(0.5, 0.55, 0.22, sk); HAND.add(palm); const f = box(0.12, 0.42, 0.14, sk); f.position.set(-0.12, 0.45, 0.02); HAND.add(f); for (let i = 0; i < 3; i++) { const ff = box(0.11, 0.16, 0.3, sk); ff.position.set(0.0 + i * 0.12, 0.18, 0.18); HAND.add(ff); } const th = box(0.12, 0.3, 0.12, sk); th.position.set(-0.3, 0.05, 0.1); th.rotation.z = 0.5; HAND.add(th); const cuff = box(0.56, 0.3, 0.3, mat('#3a4256')); cuff.position.y = -0.4; HAND.add(cuff); } S.add(HAND);
const pita = label('ピタッ', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(pita);
const nibon = label('毎日 2本', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.7 }); S.add(nibon);
const suibun = label('ジュースは 水分補給', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(suibun);
const CLOCK = label('15:00', { w: 512, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.75 }); S.add(CLOCK);
const katte = label('足が 勝手に', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(katte);

// ---------- カフェのカウンター（x=40） ----------
const CX = 40;
const roomC = room({ x: CX, w: 9, d: 6, h: 3.2, wall: '#efe2cc', floor: '#9a7656' });
const CNT = makeTable({ w: 2.6, d: 0.7, h: 1.05, color: '#6a4a34' }); CNT.position.set(CX, 0, -1.4); S.add(CNT);
const MENU = new THREE.Group(); { const b = box(2.2, 0.9, 0.05, mat('#2a2622')); MENU.add(b); ['#c89a6a', '#e8d8c0', '#8a5a3a'].forEach((c, i) => { const m = box(0.5, 0.5, 0.02, mat(c)); m.position.set(-0.7 + i * 0.7, 0.0, 0.04); MENU.add(m); }); } MENU.position.set(CX, 2.5, -2.9); S.add(MENU);
const STAFF = makeWoman({ shirt: '#3a5a4a', hair: '#2a1a14' }); STAFF.position.set(CX + 0.6, 0, -2.2); S.add(STAFF);
function makeCup(color = '#f4f0e8', s = 1) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.3, 16), mat(color)); c.position.y = 0.15; g.add(c); const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.1, 0.1, 16), mat('#b88a5a')); sl.position.y = 0.14; g.add(sl); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), mat('#f4f4f2')); lid.position.y = 0.32; g.add(lid); g.scale.setScalar(s); return g; }
const LATTE = makeCup('#f4f0e8', 1.2); S.add(LATTE);
const amai = label('これも 甘い', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(amai);
const TEA = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.16, 16), mat('#e8e4dc')); c.position.y = 0.08; TEA.add(c); const tq = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 16), mat('#9ab85a')); tq.position.y = 0.155; TEA.add(tq); } S.add(TEA);
const honnori = label('ほんのり 甘い…？', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(200,236,170,.97)', sx: 1.2 }); S.add(honnori);

// ---------- 砂糖のスタジオ（x=80） ----------
const DX = 80;
flat(30, 20, '#5a6078', DX, -2);
const BACK = box(14, 6, 0.2, mat('#4a5068')); BACK.position.set(DX, 3, -4); S.add(BACK);
function makeCan(s = 1) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1.2, 24), mat('#d84a3a')); b.position.y = 0.6; g.add(b); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.32, 24), mat('#f4f0e8')); band.position.y = 0.62; g.add(band); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.08, 24), mat('#b8bec6')); t.position.y = 1.24; g.add(t); g.scale.setScalar(s); return g; }
const CAN = makeCan(1); S.add(CAN);
const CUBES = []; for (let i = 0; i < 20; i++) { const c = box(0.2, 0.2, 0.2, mat('#fbfbf6')); S.add(c); CUBES.push(c); }
const Q = label('？', { w: 256, size: 160, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.42 }); S.add(Q);
const can40 = label('缶1本 最大40g', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(can40);
const who25 = label('1日の目安 25g', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(who25);
const koeta = label('1本で もう超えてる', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(koeta);
const LINE25 = box(3.2, 0.03, 0.03, new THREE.MeshBasicMaterial({ color: '#9be86a' })); S.add(LINE25);
const OYATSU = new THREE.Group(); { const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 24), mat('#f4f4f2')); plate.position.y = 0.02; OYATSU.add(plate); const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 24), mat('#f6dcb0')); cake.position.y = 0.24; OYATSU.add(cake); const cream = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.1, 24), mat('#fbfbf6')); cream.position.y = 0.48; OYATSU.add(cream); for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat('#d8243a')); st.position.set(Math.cos(i) * 0.3, 0.58, Math.sin(i) * 0.3); OYATSU.add(st); } } S.add(OYATSU);
const oyatsu = label('液体の おやつ', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,90,140,.97)', sx: 1.1 }); S.add(oyatsu);
const sparkD = makeSparkles(90, 0.1, 0xfff2c0); S.add(sparkD.points); sparkD.init([[DX, 1.0, 0]], 0.6, 0.9);

// ---------- 1か月後：素通り（自販機のセットを使う） ----------
const sudoori = label('素通り', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.65 }); S.add(sudoori);
const tebanashita = label('砂糖 約3倍分を 手放した', { w: 1100, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.6 }); S.add(tebanashita);
const BOTTLES = []; for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.36, 14), new THREE.MeshLambertMaterial({ color: ['#f0a030', '#e8503a'][i] })); S.add(b); BOTTLES.push(b); }

const LABELS = [pita, nibon, suibun, CLOCK, katte, amai, honnori, Q, can40, who25, koeta, oyatsu, sudoori, tebanashita];
function reset() {
  const p = KAISHA; p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); p.visible = true;
  LABELS.forEach(l => l.visible = false); sparkD.set(0); el.flash.style.opacity = 0; sweat.userData.set(0);
  HAND.visible = false; HAND.scale.setScalar(1); LATTE.visible = false; TEA.visible = false; CAN.visible = false; CUBES.forEach(c => c.visible = false); LINE25.visible = false; OYATSU.visible = false; BOTTLES.forEach(b => b.visible = false);
  STAFF.visible = true; CAN.scale.setScalar(1); CAN.rotation.set(0, 0, 0);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.35;
function vmCam(u = 0) { look(lerp(0.15, 0.05, u), lerp(1.75, 1.7, u), lerp(1.55, 1.35, u), 0, lerp(1.45, 1.42, u), -1.25, 50); }
function shot0(t) { // 0秒＝サムネ：自販機の甘いジュースのボタンに伸びた手が、ピタッと止まる
  reset(); lift(0); KAISHA.visible = false; STAFF.visible = false;
  const k = easeOut(clamp(t / TP)); const sh = t > TP ? Math.sin(t * 40) * 0.012 * clamp(1 - (t - TP) / 0.6) : 0;
  HAND.visible = true; HAND.scale.setScalar(0.42); HAND.position.set(0.12 + sh, lerp(0.95, 1.12, k), lerp(-0.25, -0.62, k)); HAND.rotation.set(-0.35, 0, 0.1);
  if (t > TP) say(pita, t, TP, -0.32, 1.0, -0.6, 0.36);
  vmCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function standVM(x = 0.0, z = -0.55) { KAISHA.position.set(x, 0, z); KAISHA.rotation.y = Math.PI; }
function sKatamaru(t, d) { // 毎日甘いのを2本空ける会社員が、ボタンの前で固まる
  reset(); lift(120); standVM(0.15, -0.6); KAISHA.userData.arms[1].rotation.set(-1.5, 0, 0);
  if (t > d * 0.35) { sweat.userData.set(1, t); say(nibon, t, d * 0.35, 0.3, 2.3, -0.6, 0.5); }
  look(1.0, 1.75, 2.6, 0.15, 1.3, -1.0, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。ジュースは、水分補給だから
  reset(); lift(120); KAISHA.position.set(0.1, 0, -0.5); KAISHA.rotation.y = 0.15; KAISHA.userData.arms[1].rotation.set(-2.2, 0, 0.4);
  BOTTLES[0].visible = true; KAISHA.updateMatrixWorld(); const v = new THREE.Vector3(0, -0.6, 0); KAISHA.userData.arms[1].localToWorld(v); BOTTLES[0].position.copy(v);
  if (t > 0.4) say(suibun, t, 0.4, 0.0, 2.15, -0.7, 1.25);
  look(0.3, 1.6, 2.2, 0.0, 1.45, -0.6, 50);
  return S;
}
function sAshi(t, d) { // 1日目の午後3時。足が勝手に、自販機のほうへ向かう
  reset(); lift(120); const k = clamp(t / d); KAISHA.position.set(lerp(-1.7, -0.3, k), 0, -0.2); KAISHA.rotation.y = Math.PI / 2 - 0.4; poseWalk(KAISHA, t * 7.5, 0.9);
  KAISHA.userData.head.rotation.y = 0.9; // 顔は 行きたくない ほう
  say(CLOCK, t, 0.2, 0.9, 2.45, -1.8, 0.5);
  if (t > d * 0.4) say(katte, t, d * 0.4, KAISHA.position.x, 2.3, -0.2, 0.8);
  setHud('甘い飲み物 禁止', '1日目', 1);
  look(-0.2, 1.9, 5.6, -0.2, 1.2, -0.8, 50);
  return S;
}
function cafeSet() { KAISHA.position.set(CX - 0.4, 0, -0.5); KAISHA.rotation.y = Math.PI; }
function sLatte(t, d) { // 3日目。カフェラテを頼もうとして、これも甘いと気づく
  reset(); lift(120); cafeSet(); KAISHA.rotation.y = Math.PI - 0.3; const k = clamp((t - d * 0.3) / 0.4); KAISHA.userData.arms[1].rotation.set(lerp(-0.4, -1.6, k), 0, 0);
  STAFF.userData.arms[0].rotation.set(-1.4, 0, 0); LATTE.visible = true; LATTE.position.set(CX - 0.15, 1.06, -1.35);
  if (t > d * 0.5) { say(amai, t, d * 0.5, CX - 0.15, 1.95, -1.2, 0.85); sweat.userData.set(1, t); }
  setHud('甘い飲み物 禁止', '3日目', 1);
  look(CX + 1.2, 1.9, 2.6, CX - 0.1, 1.35, -1.3, 50);
  return S;
}
function sTea(t, d) { // 1週間後。ただのお茶が、ちょっとだけ甘く感じる
  reset(); lift(120); STAFF.visible = false; cafeSet(); KAISHA.rotation.y = 0.1; KAISHA.position.set(CX - 0.3, 0, -0.9);
  KAISHA.userData.arms[1].rotation.set(-1.7, 0, 0.35); KAISHA.updateMatrixWorld(); const v = new THREE.Vector3(0, -0.66, 0.05); KAISHA.userData.arms[1].localToWorld(v); TEA.visible = true; TEA.position.copy(v);
  KAISHA.userData.head.rotation.z = Math.sin(t * 2) * 0.12;
  if (t > d * 0.4) say(honnori, t, d * 0.4, CX - 0.3, 2.12, -0.9, 0.8);
  setHud('甘い飲み物 禁止', '1週間後', 1);
  look(CX + 0.2, 1.75, 1.4, CX - 0.3, 1.55, -0.9, 50);
  return S;
}
function studio() { KAISHA.visible = false; STAFF.visible = false; }
function canCam(u = 0) { look(DX + lerp(0.3, 0.0, u), lerp(1.6, 1.5, u), lerp(4.8, 4.3, u), DX, 0.9, 0, 50); }
function sSoMoSo(t, d) { // でも、そもそも1本にどれくらい入っているのか
  reset(); lift(430); studio(); CAN.visible = true; CAN.position.set(DX, 0, 0); CAN.rotation.y = t * 0.6;
  if (t > d * 0.35) say(Q, t, d * 0.35, DX + 0.75, 1.5, 0.2, 0.36);
  canCam(ease(clamp(t / d)));
  return S;
}
function cubes(n, x0, z0 = 0.2, cols = 5) { for (let i = 0; i < n && i < CUBES.length; i++) { const c = CUBES[i]; c.visible = true; c.position.set(x0 + (i % cols) * 0.22 - (cols - 1) * 0.11, 0.1 + Math.floor(i / cols) * 0.21, z0); c.rotation.y = 0; } }
function sForty(t, d) { // 甘い炭酸の缶1本に、砂糖は最大40g
  reset(); lift(430); studio(); CAN.visible = true; CAN.position.set(DX - 0.6, 0, -0.3);
  const n = Math.round(lerp(0, 10, easeOut(clamp((t - 0.3) / 1.4)))); cubes(n, DX + 0.55);
  setTop('甘い炭酸の缶1本の砂糖（WHO 2015年）', '最大' + Math.round(40 * n / 10) + 'g', fade(t, 0.3, d, 0.25), RED);
  if (t > d * 0.6) say(can40, t, d * 0.6, DX, 1.6, 0, 1.0);
  canCam(1);
  return S;
}
function sWho(t, d) { // WHOの目安は、1日25gまでが理想
  reset(); lift(430); studio(); cubes(6, DX); LINE25.visible = true; LINE25.position.set(DX, 0.43, 0.2);
  setTop('WHO の目安（2015年）', '1日25gまで', fade(t, 0.3, d, 0.25), GREEN); setHud('小さじ約6杯', 'WHO', 1);
  if (t > d * 0.45) say(who25, t, d * 0.45, DX, 1.05, 0.2, 1.0);
  canCam(1);
  return S;
}
function sKoeta(t, d) { // 缶1本で、もう1日分を超えていた
  reset(); lift(430); studio(); cubes(10, DX); LINE25.visible = true; LINE25.position.set(DX, 0.43, 0.32);
  if (t > d * 0.3) { say(koeta, t, d * 0.3, DX, 1.05, 0.2, 1.2); el.flash.style.opacity = t < d * 0.3 + 0.12 ? 0.18 : 0; }
  setTop('缶1本 40g ＞ 目安 25g', '1.6倍', fade(t, 0.3, d, 0.25), RED);
  canCam(1);
  return S;
}
function sSudoori(t, d) { // 1か月後。自販機の前を、素通りできるようになる
  reset(); lift(120); const k = clamp(t / d); KAISHA.position.set(lerp(-1.6, 1.6, k), 0, -0.15); KAISHA.rotation.y = Math.PI / 2; poseWalk(KAISHA, t * 7.5, 0.9);
  if (t > d * 0.45) say(sudoori, t, d * 0.45, KAISHA.position.x, 2.3, -0.15, 0.6);
  setHud('甘い飲み物 禁止', '1か月後', 1);
  look(0.0, 1.9, 6.0, 0.0, 1.2, -0.8, 50);
  return S;
}
function sKekka(t, d) { // 結果：1か月やめて、毎日2本で飲んでいた、目安の3倍の砂糖を手放した
  reset(); lift(430); studio(); const k = easeOut(clamp((t - 0.5) / 1.6));
  for (let i = 0; i < 20; i++) { const c = CUBES[i]; c.visible = true; const x = DX - 0.88 + (i % 10) * 0.2, y = 0.1 + Math.floor(i / 10) * 0.21; c.position.set(x, y + k * (0.9 + (i % 4) * 0.2), 0.2 - k * 2.5); c.rotation.set(k * (i + 1), k * 2, 0); c.visible = k < 0.98; }
  if (k > 0.2) sparkD.set(clamp((k - 0.2) / 0.6));
  setTop('毎日2本の砂糖 ÷ 1日の目安（単純計算）', '約3倍', fade(t, 0.3, d, 0.25), GOLD); setHud('80g ÷ 25g', '単純計算', 1);
  if (t > d * 0.55) say(tebanashita, t, d * 0.55, DX, 1.05, 0.2, 1.4);
  canCam(1);
  return S;
}
function sOyatsu(t, d) { // 水分補給のつもりの1本は、毎日飲んでいた、液体のおやつだったのかもしれない
  reset(); lift(430); studio(); const k = clamp((t - d * 0.35) / 0.5);
  CAN.visible = k < 0.5; CAN.position.set(DX, 0, 0); CAN.scale.setScalar(1 - k * 0.8);
  OYATSU.visible = k > 0.4; OYATSU.position.set(DX, 0.0, 0.0); OYATSU.scale.setScalar(1.5 * clamp((k - 0.4) / 0.6)); OYATSU.rotation.y = t * 0.6;
  if (k > 0.4) { sparkD.set(clamp((k - 0.4) / 0.6)); say(oyatsu, t, d * 0.35 + 0.3, DX, 1.45, 0.4, 0.95); }
  canCam(ease(clamp(t / d)));
  if (k >= 1) CAN.scale.setScalar(1);
  return S;
}
function sAsk(t) { reset(); lift(0); KAISHA.visible = false; STAFF.visible = false; HAND.visible = true; HAND.scale.setScalar(0.42); HAND.position.set(0.12, 1.12, -0.62); HAND.rotation.set(-0.35, 0, 0.1); pita.visible = true; pita.position.set(-0.32, 1.0, -0.6); pita.userData.size(0.36); vmCam(0); return S; }

const NARR = { '毎日': 'まいにち', '甘い': 'あまい', '2本': 'にほん', '空ける': 'あける', '会社員': 'かいしゃいん', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '水分補給': 'すいぶんほきゅう', '1日目': 'いちにちめ', '午後3時': 'ごごさんじ', '足': 'あし', '勝手に': 'かってに', '自販機': 'じはんき', '3日目': 'みっかめ', '頼もう': 'たのもう', '1週間後': 'いっしゅうかんご', '感じる': 'かんじる', '1本': 'いっぽん', '炭酸': 'たんさん', '缶': 'かん', '砂糖': 'さとう', '最大40g': 'さいだいよんじゅうグラム', 'WHO': 'ダブリューエイチオー', '目安': 'めやす', '1日25g': 'いちにちにじゅうごグラム', '理想': 'りそう', '1日分': 'いちにちぶん', '超えて': 'こえて', '1か月後': 'いっかげつご', '素通り': 'すどおり', '結果：': '結果、', '1か月': 'いっかげつ', '3倍': 'さんばい', '手放した': 'てばなした', '液体': 'えきたい', '何本': 'なんぼん', '今日': 'きょう', '飲んで': 'のんで', '飲んだ': 'のんだ' };
const P = planTimes([
  ['毎日甘いのを2本空ける会社員が、<br>ボタンの前で固まる。', sKatamaru],
  ['本人の言い分から。<br>ジュースは、水分補給だから。', sIibun],
  ['1日目の午後3時。足が勝手に、<br>自販機のほうへ向かう。', sAshi],
  ['3日目。カフェラテを頼もうと<br>して、これも甘いと気づく。', sLatte],
  ['1週間後。ただのお茶が、<br>ちょっとだけ甘く感じる。', sTea],
  ['でも、そもそも1本に<br>どれくらい入っているのか。', sSoMoSo],
  ['甘い炭酸の缶1本に、<br>砂糖は最大40g。', sForty],
  ['WHOの目安は、<br>1日25gまでが理想。', sWho],
  ['缶1本で、もう1日分を<br>超えていた。', sKoeta],
  ['1か月後。自販機の前を、<br>素通りできるようになる。', sSudoori],
  ['結果：1か月やめて、<br>毎日2本で飲んでいた、', (t, d) => sKekka(t, 2 * d)],
  ['目安の3倍の砂糖を<br>手放した。', (t, d) => sKekka(t + d, 2 * d)],
  ['水分補給のつもりの1本は、<br>毎日飲んでいた、', (t, d) => sOyatsu(t, 2 * d)],
  ['液体のおやつ<br>だったのかもしれない。', (t, d) => sOyatsu(t + d, 2 * d)],
  ['今日、甘い飲み物を<br>何本飲んだ？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0690',
    v2: true,
    tt: 'main',
    hookLine: '自販機の甘いジュースのボタンに伸びた手が、ピタッと止まる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月、甘い飲み物をやめたら？',
    titleHtml: 'もしも1か月、<br>甘い飲み物を<br>やめたら？',
    mood: 'hopeful', seed: 690, hits: [TP, P.at(10), P.at(13)], risers: [P.at(5)], impacts: [P.at(6, 1.6), P.at(7, 0.4), P.at(8, 0.3)],
    sfx: [[TP, 'alarm'], [P.at(2, 0.4), 'whoosh'], [P.at(3, 1.2), 'meter', 0.3], [P.at(10, 0.8), 'poof'], [P.at(12, 1.0), 'bubble']],
    narr: NARR,
    ask: '今日、甘い飲み物を何本飲んだ？',
    caption: 'もしも1か月、甘い飲み物をやめたら？\n\n毎日甘いのを2本空ける会社員が、ボタンの前で固まる。\n本人の言い分から。ジュースは、水分補給だから。\n1日目の午後3時。足が勝手に、自販機のほうへ向かう。\n3日目。カフェラテを頼もうとして、これも甘いと気づく。\n1週間後。ただのお茶が、ちょっとだけ甘く感じる。\nでも、そもそも1本にどれくらい入っているのか。\n甘い炭酸の缶1本に、砂糖は最大40g。\nWHOの目安は、1日25gまでが理想。\n缶1本で、もう1日分を超えていた。\n1か月後。自販機の前を、素通りできるようになる。\n\n結果：1か月やめて、毎日2本で飲んでいた、目安の3倍の砂糖を手放した（缶2本80g÷25g の単純計算）。\n水分補給のつもりの1本は、毎日飲んでいた、液体のおやつだったのかもしれない。\n\n今日、甘い飲み物を何本飲んだ？ コメントで教えて。\n\n出典：WHO（世界保健機関）2015年3月4日 砂糖の摂取に関するガイドラインの発表',
    hashtags: ['もしもラボ', 'もしも', '砂糖', 'ジュース', '人体の限界'],
    endStats: [['甘い炭酸の缶1本の砂糖', '最大40g', 'WHO 2015年'], ['WHO の1日の目安', '25gまで', 'WHO 2015年'], ['毎日2本の砂糖', '目安の約3倍', '単純計算']],
    sources: '出典：WHO 砂糖の摂取に関するガイドライン（2015年）',
  },
});
