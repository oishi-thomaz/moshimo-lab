import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeHanko, hankoSlam, makeMark } from '../scenes/hanko.js';
import { makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeShelf, makeTable, makeKotatsu } from '../scenes/home.js';

// もしもカスハラ客に、出禁のハンコが押せたら？（皮肉回・台本 S96・図星／大人の本音・作り直し 0639）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。plan/remake.md の8：出禁のハンコがドン → コンビニを出禁 → スーパーも駅も を3秒ずつ、数字は10秒より後
// 数字（一次資料で確認・2026/11/17。厚生労働省 令和5年度 職場のハラスメントに関する実態調査 の報告書）：
//  過去3年間に勤務先で 顧客等からの著しい迷惑行為（カスタマーハラスメント）を受けた労働者 10.8%
// 店名・制服は架空（実在のコンビニ・スーパー・鉄道の配色は使わない）

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d0dc', ground: '#8a8f99' }); hemi.intensity = 1.3;
const OJI = makeOji(rng(7), { shirt: '#59606e', bald: true }); S.add(OJI);
const sweat = makeSweat(); OJI.userData.head.add(sweat);
function clerk(i = 0, color = '#7a5ab0') { const p = (i % 2 ? makeMan : makeWoman)({ shirt: '#f4f4f4', hair: ['#3a2620', '#1d1a19', '#5a3a28'][i % 3] }); const ap = box(0.52, 0.66, 0.05, mat(color)); ap.position.set(0, 1.05, 0.16); p.add(ap); return p; }
const CL = clerk(0); S.add(CL);
const HK = makeHanko(); HK.scale.setScalar(0.42); S.add(HK);
const MARK = makeMark('出禁', { sx: 0.5 }); S.add(MARK);
// 紙の王冠（おぢの頭の上）
function crown() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16, 1, true), mat('#f2c230', { side: THREE.DoubleSide })); g.add(b); for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), mat('#f2c230')); const a = i / 6 * Math.PI * 2; c.position.set(Math.cos(a) * 0.22, 0.13, Math.sin(a) * 0.22); g.add(c); } return g; }
const CROWN = crown(); OJI.userData.head.add(CROWN); CROWN.position.y = 0.58;

// ---------- A：もしもマート（原点） ----------
const roomA = room({ x: 0, w: 10, d: 7, h: 3.4, wall: '#f2efe8', floor: '#e0ddd6' });
const SH1 = makeShelf({ w: 3.4, h: 2.0, seed: 3 }); SH1.position.set(-2.4, 0, -3.1); S.add(SH1);
const SH2 = makeShelf({ w: 3.4, h: 2.0, seed: 5 }); SH2.position.set(2.4, 0, -3.1); S.add(SH2);
const COUNTER = box(3.4, 1.0, 0.8, mat('#8a7a6a')); COUNTER.position.set(0, 0.5, -1.4); S.add(COUNTER);
const CTOP = box(3.5, 0.06, 0.9, mat('#d8d2c6')); CTOP.position.set(0, 1.03, -1.4); S.add(CTOP);
const REG = box(0.56, 0.34, 0.46, mat('#3a4050')); REG.position.set(-0.9, 1.23, -1.45); S.add(REG);
const SIGNA = label('もしもマート', { w: 1024, size: 110, color: '#fff', bg: 'rgba(122,90,176,.96)', sx: 1.6 }); SIGNA.position.set(0, 2.6, -3.3); S.add(SIGNA);
const FRONT = box(10, 3.4, 0.1, new THREE.MeshLambertMaterial({ color: '#cfe4ee' })); FRONT.position.set(0, 1.7, 2.6); S.add(FRONT);
const dogeza = label('土下座し…', { w: 768, size: 110, color: '#d01c28', bg: 'rgba(255,255,255,.96)', sx: 0.95 }); S.add(dogeza);
const donaru = label('おい！', { w: 512, size: 120, color: '#d01c28', bg: 'rgba(255,255,255,.96)', sx: 0.55 }); S.add(donaru);
const fuman = label('客なら 何を言ってもいい？', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(fuman);
const QUEUE = [0, 1, 2].map(i => { const p = (i % 2 ? makeWoman : makeMan)({ shirt: ['#6a8fd0', '#f0a0b0', '#7ab07a'][i], hair: '#2a2220' }); S.add(p); return p; });
const yawara = label('ありがとうございます♪', { w: 1100, size: 92, color: '#2a6a3a', bg: 'rgba(255,255,255,.96)', sx: 1.4 }); S.add(yawara);
const hearts = makeSparkles(80, 0.12, 0xffb0d0); S.add(hearts.points); hearts.init([[0, 2.3, -1.9]], 0.8, 0.8);

// ---------- B：町の店先（x=60）。左から コンビニ・スーパー・駅の窓口 ----------
const BX = 60;
flat(30, 12, '#b8b4aa', BX, 0);
function storefront(x, name, color, wallC) { const g = new THREE.Group(); const w = box(3.0, 3.0, 0.3, mat(wallC)); w.position.y = 1.5; g.add(w); const door = box(1.2, 2.0, 0.05, new THREE.MeshBasicMaterial({ color: '#bfe2f4' })); door.position.set(0, 1.0, 0.17); g.add(door); const sg = label(name, { w: 768, size: 100, color: '#fff', bg: color, sx: 1.1 }); sg.position.set(0, 2.55, 0.25); g.add(sg); g.position.set(x, 0, -1.5); S.add(g); const mk = makeMark('出禁', { sx: 0.9 }); mk.position.set(x, 1.3, -1.0); S.add(mk); g.userData.mk = mk; g.userData.door = door; return g; }
const SHOPS = [storefront(BX - 3.3, 'もしもマート', 'rgba(122,90,176,.96)', '#efe8f6'), storefront(BX, 'もしもスーパー', 'rgba(220,120,40,.96)', '#f6eee2'), storefront(BX + 3.3, 'きっぷ 窓口', 'rgba(40,110,180,.96)', '#e6eef6')];
const HKB = makeHanko(); HKB.scale.setScalar(0.7); S.add(HKB);

// ---------- C：町の地図（x=120） ----------
const CX = 120;
flat(14, 14, '#9ab88a', CX, 0, -0.8);
const ROADS = [flat(14, 0.8, '#d8d4c8', CX, 0, -0.7, 0.02), flat(0.8, 14, '#d8d4c8', CX, 0, -0.7, 0.02)];
const ICONS = []; { const cols = ['#7a5ab0', '#dc7828', '#286eb4', '#3a9a5a', '#c84a6a', '#d8b23a', '#5a8ac8', '#9a6a4a']; const r = rng(4); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.4; const b = box(0.9, 0.7 + r() * 0.5, 0.9, mat(cols[i])); b.position.set(CX + Math.cos(a) * 3.4, 0.4, Math.sin(a) * 3.4); b.userData.c = cols[i]; S.add(b); ICONS.push(b); } }
const OJI_PIN = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat('#e0262f')); S.add(OJI_PIN);
const ikeru = label('行ける店', { w: 512, size: 110, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.8 }); S.add(ikeru);

// ---------- D：数字（x=180） ----------
const DX = 180;
flat(30, 20, '#4a5068', DX, -2);
const BACKD = box(14, 6, 0.2, mat('#3a4058')); BACKD.position.set(DX, 3, -4); S.add(BACKD);
const WORKERS = []; { const r = rng(11); for (let i = 0; i < 30; i++) { const p = clerk(i, i < 3 ? '#e0262f' : '#7a7f8c'); p.scale.setScalar(0.55); p.position.set(DX - 2.0 + (i % 10) * 0.44, 0, -0.6 - Math.floor(i / 10) * 0.7); S.add(p); WORKERS.push(p); } }
const ichibu = label('一部の店 だけ？', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.2 }); S.add(ichibu);

// ---------- E：家（x=240） ----------
const EX = 240;
const roomE = room({ x: EX, w: 8, d: 6, h: 3, wall: '#efe6d6', floor: '#c9b8a0' });
const KOT = makeKotatsu(); KOT.position.set(EX, 0, -1.4); S.add(KOT);
const TSUMA = makeWoman({ shirt: '#c88a5a', hair: '#4a3022', pants: '#5a4a6a', scale: 0.95 }); S.add(TSUMA);
const futo = label('…ふと止まる', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(futo);
const gaman = label('ずっと 我慢していた', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(gaman);
const oukan = label('紙の 王冠', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.8 }); S.add(oukan);
const kamisama = label('お客様は 神様', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.1 }); S.add(kamisama);

const PEOPLE = [OJI, CL, TSUMA, ...QUEUE];
const LABELS = [MARK, dogeza, donaru, fuman, yawara, ikeru, ichibu, futo, gaman, oukan, kamisama, ...SHOPS.map(s => s.userData.mk)];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); p.visible = false; }
function reset() {
  PEOPLE.forEach(clearP); LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); hearts.set(0);
  HK.visible = false; HKB.visible = false; SIGNA.visible = false; CROWN.visible = true; CROWN.position.set(0, 0.58, 0); CROWN.rotation.set(0, 0, 0); CROWN.scale.setScalar(1);
  ICONS.forEach(b => b.material.color.set(b.userData.c)); OJI_PIN.visible = false; WORKERS.forEach(p => p.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.4;
function regSet() { OJI.visible = true; OJI.position.set(0.15, 0, -0.5); OJI.rotation.y = Math.PI; CL.visible = true; CL.position.set(-0.55, 0, -2.2); SIGNA.visible = true; }
function frontCam(u = 0) { look(lerp(0.75, 0.7, u), 1.72, lerp(-2.9, -3.0, u), 0.1, 1.62, -0.4, 50); }
function yellPose(t) { OJI.userData.arms[1].rotation.set(-1.9, 0, 0); OJI.userData.arms[0].rotation.set(-0.4 + Math.sin(t * 14) * 0.15, 0, -0.3); }
function sideCam(u = 0) { look(lerp(2.0, 1.8, u), lerp(1.8, 1.75, u), lerp(0.9, 0.7, u), 0.0, 1.55, -1.3, 50); }
function stampOji(t, t0) { // おでこに 出禁 のハンコがドン
  OJI.updateMatrixWorld(); const hp = new THREE.Vector3(0, 0.3, 0.2); OJI.userData.head.localToWorld(hp);
  const d = clamp((t - (t0 - 0.25)) / 0.25); const back = t < t0 ? 1 - easeOut(d) : clamp((t - t0 - 0.12) / 0.4);
  const from = new THREE.Vector3(0, 0.3 + back * 0.32, 0.32 + back * 0.4); OJI.userData.head.localToWorld(from);
  HK.visible = true; HK.position.copy(from); HK.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), hp.clone().sub(from).normalize().lengthSq() > 0 ? hp.clone().sub(from).normalize() : new THREE.Vector3(0, 0, -1));
  if (back < 0.02) { const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(OJI.quaternion); HK.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); }
  if (t >= t0) { MARK.visible = true; const mp = new THREE.Vector3(0, 0.3, 0.3); OJI.userData.head.localToWorld(mp); MARK.position.copy(mp); MARK.userData.size(0.36); }
}
function shot0(t) { // 0秒＝サムネ：レジで怒鳴るおじさんの額に、赤い 出禁 のハンコがドン
  reset(); lift(0); regSet(); CL.visible = false; yellPose(t);
  stampOji(t, TP); if (t >= TP) { el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; OJI.userData.head.rotation.x = -0.12; }
  frontCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 土下座しろと言いかけたおじさんが、口を開けたまま固まる
  reset(); lift(120); regSet(); CL.visible = false; OJI.userData.arms[1].rotation.set(-1.9, 0, 0); stampOji(5, TP); HK.visible = false;
  say(dogeza, t, 0.15, 0.6, 2.2, -0.6, 0.55); if (t > d * 0.5) sweat.userData.set(1, t);
  look(0.9, 1.85, -3.4, 0.15, 1.5, -0.4, 50);
  return S;
}
function sFuman(t, d) { // 店員たちの不満から。客だからって、何を言ってもいいわけじゃない
  reset(); lift(120); CL.visible = true; CL.position.set(0, 0, -2.0); CL.userData.head.rotation.x = 0.15; SIGNA.visible = true;
  if (t > 0.4) say(fuman, t, 0.4, 0, 2.3, -2.0, 1.15);
  look(0.3, 1.9, 1.8, 0, 1.55, -2.0, 50);
  return S;
}
function shopCam(i) { const x = BX + (i - 1) * 3.3; look(x + 0.5, 1.7, 4.2, x + 0.2, 1.4, -1.2, 50); }
function sShop(i) { return (t, d) => { // 1日目 コンビニ／2日目 スーパー／3日目 駅の窓口 を出禁
  reset(); lift(120); const x = BX + (i - 1) * 3.3; OJI.visible = true; const k = clamp(t / (d * 0.4)); OJI.position.set(x + lerp(0.2, 0.9, k), 0, lerp(0.4, -0.4, k)); OJI.rotation.y = Math.PI * 0.8; if (k < 1) poseWalk(OJI, t * 7.5, 0.8);
  const t0 = d * 0.45; const mk = SHOPS[i].userData.mk;
  if (t >= t0) { pop(mk, t, t0, 0.25, 0.9); SHOPS[i].userData.door.material.color.set('#6a6e78'); el.flash.style.opacity = t < t0 + 0.1 ? 0.2 : 0; OJI.rotation.y = Math.PI; OJI.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); sweat.userData.set(1, t); } else SHOPS[i].userData.door.material.color.set('#bfe2f4');
  for (let j = 0; j < i; j++) SHOPS[j].userData.door.material.color.set('#6a6e78');
  setHud('出禁', ['1日目', '2日目', '3日目'][i], 1);
  shopCam(i);
  return S;
}; }
function sMap(t, d) { // 行ける店が、町から1軒ずつ消えていく
  reset(); lift(160); const n = Math.floor(clamp((t - 0.3) / (d * 0.8)) * 7); ICONS.forEach((b, i) => { if (i < n + 1) b.material.color.set('#6a6e78'); });
  OJI_PIN.visible = true; OJI_PIN.position.set(CX, 0.4 + Math.abs(Math.sin(t * 3)) * 0.2, 0);
  setTop('行ける店', (8 - Math.min(8, n + 1)) + '軒', fade(t, 0.3, d, 0.25), RED);
  look(CX, 15, 8.5, CX, 0, -0.5, 50);
  return S;
}
function dCam(u = 0) { look(DX + lerp(0.3, 0, u), 2.0, lerp(5.4, 5.0, u), DX, 0.6, -1.2, 50); }
function sIchibu(t, d) { // でもこれは、一部の店だけの話じゃない
  reset(); lift(380); WORKERS.forEach((p, i) => { p.visible = t > 0.1 + i * 0.02; }); WORKERS.slice(0, 3).forEach(p => p.children.forEach(() => { }));
  if (t > d * 0.35) say(ichibu, t, d * 0.35, DX, 1.45, 0, 1.0);
  dCam(ease(clamp(t / d)));
  return S;
}
function sStat(t, d) { // 働く人の10.8%が、客からのハラスメントを受けていた
  reset(); lift(380); WORKERS.forEach(p => p.visible = true);
  WORKERS.slice(0, 3).forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.06 * clamp((t - 0.8) / 0.3); });
  setTop('客からのハラスメントを受けた 働く人（2023年度）', (10.8 * easeOut(clamp((t - 0.3) / 1.2))).toFixed(1) + '%', fade(t, 0.3, d, 0.25), RED); setHud('厚生労働省', '実態調査', 1);
  dCam(1);
  return S;
}
function sYawara(t, d) { // 一方、レジの列は静かになって、店員の声がやわらかくなる
  reset(); lift(120); CL.visible = true; CL.position.set(-0.2, 0, -2.2); CL.userData.head.rotation.z = Math.sin(t * 2) * 0.08;
  QUEUE.forEach((p, i) => { p.visible = true; p.position.set(-0.2 + (i % 2) * 0.1, 0, -0.6 + i * 0.9); p.rotation.y = Math.PI; });
  hearts.set(clamp((t - d * 0.3) / 0.8));
  if (t > d * 0.4) say(yawara, t, d * 0.4, -0.2, 2.35, -2.0, 1.1);
  look(2.0, 2.0, 1.4, -0.2, 1.45, -1.6, 50);
  return S;
}
function homeSet() { OJI.visible = true; OJI.position.set(EX - 0.9, 0, -0.7); OJI.rotation.y = 0.9; TSUMA.visible = true; TSUMA.position.set(EX + 0.4, 0, -1.4); TSUMA.rotation.y = -0.6; }
function sTsuma(t, d) { // おじさんは家に帰って、妻に怒鳴ろうとして、ふと止まる
  reset(); lift(120); homeSet(); MARK.visible = false; const k = clamp((t - d * 0.2) / 0.3); OJI.userData.arms[1].rotation.set(lerp(-0.2, -1.9, k), 0, 0);
  if (t < d * 0.55) say(donaru, t, d * 0.2, EX - 0.9, 2.3, -0.7, 0.45); else { OJI.userData.arms[1].rotation.set(lerp(-1.9, -0.6, clamp((t - d * 0.55) / 0.4)), 0, 0); say(futo, t, d * 0.55, EX - 0.6, 2.35, -0.7, 0.8); sweat.userData.set(1, t); }
  look(EX + 0.4, 1.85, 3.2, EX - 0.2, 1.3, -1.0, 50);
  return S;
}
function sKekka(t, d) { // 結果：客が偉かったんじゃない。店員が、ずっと我慢していただけだった
  reset(); lift(120); CL.visible = true; CL.position.set(-0.2, 0, -2.2); CL.userData.head.rotation.x = -0.1; CL.userData.arms.forEach((a, i) => a.rotation.set(0, 0, i ? 0.25 : -0.25));
  OJI.visible = true; OJI.position.set(0.45, 0, -0.95); OJI.rotation.y = -0.4; OJI.userData.head.rotation.x = 0.35; stampOji(5, TP); HK.visible = false; MARK.userData.size(0.32);
  if (t > d * 0.55) say(gaman, t, d * 0.55, -0.2, 2.35, -2.0, 1.1);
  setTop('結果', '我慢していたのは 店員', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(1.0, 1.2, u), lerp(1.9, 2.0, u), lerp(1.7, 2.3, u), 0.0, 1.45, -1.2, 50);
  return S;
}
function sOukan(t, d) { // お客様は神様 は、怒鳴る人が自分でかぶっていた、紙の王冠だったのかもしれない
  reset(); lift(120); OJI.visible = true; OJI.position.set(0.0, 0, -0.6); OJI.rotation.y = 0.2; OJI.userData.head.rotation.x = 0.2;
  const k = clamp((t - d * 0.4) / 0.8); CROWN.position.set(0.15 * k, 0.58 - k * 0.2, 0.05 * k); CROWN.rotation.set(0, 0, k * 0.6); CROWN.scale.set(1, 1 - k * 0.5, 1);
  if (t < d * 0.4) say(kamisama, t, 0.2, 0.0, 2.55, -0.6, 0.8); else say(oukan, t, d * 0.4, 0.0, 2.55, -0.6, 0.6);
  look(0.3, 1.9, 2.2, 0.0, 1.75, -0.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); regSet(); CL.visible = false; yellPose(t); stampOji(5, TP); HK.visible = false; frontCam(0); return S; }

const NARR = { '土下座': 'どげざ', '言いかけた': 'いいかけた', '口': 'くち', '開けた': 'あけた', '固まる': 'かたまる', '店員': 'てんいん', '不満': 'ふまん', '客': 'きゃく', '何を': 'なにを', '1日目': 'いちにちめ', '出禁': 'できん', '2日目': 'ふつかめ', '3日目': 'みっかめ', '駅': 'えき', '窓口': 'まどぐち', '1軒': 'いっけん', '一部': 'いちぶ', '働く人': 'はたらくひと', '10.8%': 'じゅってんはちパーセント', '受けていた': 'うけていた', '一方': 'いっぽう', '列': 'れつ', '静か': 'しずか', '声': 'こえ', '家': 'いえ', '妻': 'つま', '怒鳴ろう': 'どなろう', '止まる': 'とまる', '結果：': '結果、', '偉かった': 'えらかった', '我慢': 'がまん', 'お客様': 'おきゃくさま', '神様': 'かみさま', '怒鳴る人': 'どなるひと', '自分': 'じぶん', '紙': 'かみ', '王冠': 'おうかん', '見た': 'みた' };
const P = planTimes([
  ['土下座しろと言いかけた<br>おじさんが、', (t, d) => sKatamaru(t, 2 * d)],
  ['口を開けたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['店員たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['客だからって、何を<br>言ってもいいわけじゃない。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。おじさん、<br>コンビニを出禁。', sShop(0)],
  ['2日目。スーパーも出禁。', sShop(1)],
  ['3日目。駅の窓口も出禁。', sShop(2)],
  ['行ける店が、町から<br>1軒ずつ消えていく。', sMap],
  ['でもこれは、一部の店<br>だけの話じゃない。', sIchibu],
  ['働く人の10.8%が、客からの<br>ハラスメントを受けていた。', sStat],
  ['一方、レジの列は静かになって、<br>店員の声がやわらかくなる。', sYawara],
  ['おじさんは家に帰って、妻に<br>怒鳴ろうとして、ふと止まる。', sTsuma],
  ['結果：客が偉かったんじゃない。', (t, d) => sKekka(t, 2 * d)],
  ['店員が、ずっと<br>我慢していただけだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['お客様は神様 は、怒鳴る人が<br>自分でかぶっていた、', (t, d) => sOukan(t, 2 * d)],
  ['紙の王冠<br>だったのかもしれない。', (t, d) => sOukan(t + d, 2 * d)],
  ['店で怒鳴る客、<br>見たことある？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0692',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0639',
    hookLine: 'レジで怒鳴るおじさんの額に、赤い 出禁 のハンコがドン。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもカスハラ客に、出禁のハンコが押せたら？',
    titleHtml: 'もしもカスハラ客に、<br>出禁のハンコが<br>押せたら？',
    mood: 'tension', seed: 692, hits: [TP, P.at(4, 1.0), P.at(5, 1.0), P.at(6, 1.0), P.at(12)], risers: [P.at(8)], impacts: [P.at(9, 0.6)],
    sfx: [[TP, 'poof'], [P.at(0, 0.2), 'meter', 0.3], [P.at(7, 0.5), 'meter', 0.4], [P.at(11, 0.4), 'alarm'], [P.at(15, 0.3), 'whoosh']],
    narr: NARR,
    ask: '店で怒鳴る客、見たことある？',
    caption: 'もしもカスハラ客に、出禁のハンコが押せたら？\n\n土下座しろと言いかけたおじさんが、口を開けたまま固まる。\n店員たちの不満から。客だからって、何を言ってもいいわけじゃない。\n1日目。おじさん、コンビニを出禁。\n2日目。スーパーも出禁。\n3日目。駅の窓口も出禁。\n行ける店が、町から1軒ずつ消えていく。\nでもこれは、一部の店だけの話じゃない。\n働く人の10.8%が、客からのハラスメントを受けていた。\n一方、レジの列は静かになって、店員の声がやわらかくなる。\nおじさんは家に帰って、妻に怒鳴ろうとして、ふと止まる。\n\n結果：客が偉かったんじゃない。店員が、ずっと我慢していただけだった。\nお客様は神様 は、怒鳴る人が自分でかぶっていた、紙の王冠だったのかもしれない。\n\n店で怒鳴る客、見たことある？ コメントで教えて。\n\n※風刺ネタです。出禁のハンコは、もしもの設定です。登場する人物・店は架空です\n出典：厚生労働省 令和5年度 職場のハラスメントに関する実態調査（過去3年間に顧客等からの著しい迷惑行為を受けた労働者 10.8%）',
    hashtags: ['もしもラボ', 'もしも', 'カスハラ', '接客業', '出禁'],
    endStats: [['客からのハラスメントを受けた働く人', '10.8%', '厚生労働省 2023年度'], ['偉かったのは', '客じゃなかった', 'もしもの結果'], ['お客様は神様 の正体', '紙の王冠', 'かもしれない']],
    sources: '出典：厚生労働省 令和5年度 職場のハラスメントに関する実態調査',
  },
});
