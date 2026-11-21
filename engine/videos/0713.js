import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも部長に、つわりが来たら？（皮肉回・台本 S118・図星／男と女のもしも・作り直し 0663）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。plan/remake.md の11：元の回は1行目が つり革の男たち全員で、誰が痛い目を見るかが5秒で分からなかった
// → 0秒で つわりは病気じゃない と言いかけた部長が口をおさえて固まる → 妊娠中の部下が見つめる の二人の絵から入る
// 数字は使わない（元の回と同じ）。吐く絵は出さない（口をおさえる・トイレへ走るまで）。会社・駅・電車は架空

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d8e8' }); hemi.intensity = 1.3;
const GREEN_FACE = new THREE.Color('#b8d49a');
function suit(o = {}) { const p = makeSuit({ jacket: '#2e3442', tie: '#c8423a', ...o }); const face = p.userData.head.children[0]; p.userData.face = face; p.userData.skin0 = face.material.color.clone(); face.material = face.material.clone(); S.add(p); return p; }
function sick(p, k) { p.userData.face.material.color.copy(p.userData.skin0).lerp(GREEN_FACE, clamp(k)); }
function mouth(p, k = 1, t = 0) { p.userData.arms[1].rotation.set(-2.55 * k, 0, -0.42 * k); p.userData.head.rotation.x = 0.18 * k + Math.sin(t * 25) * 0.01 * k; }
const BUCHO = suit({ old: true, bald: true, glasses: true, jacket: '#3a3f4e' }); const sweatB = makeSweat(); BUCHO.userData.head.add(sweatB);
const KACHO = suit({ jacket: '#3a4a5a', tie: '#3a6ab2' }); const sweatK = makeSweat(); KACHO.userData.head.add(sweatK);
const BUKA = makeSuit({ woman: true, jacket: '#e8d8c8', hair: '#3a2620' }); S.add(BUKA); // 妊娠中の部下
const BELLY = box(0.4, 0.34, 0.2, mat('#e8d8c8')); BELLY.position.set(0, 0.98, 0.2); BUKA.add(BELLY);
const DOCS = box(0.3, 0.4, 0.03, mat('#fbfaf4')); DOCS.position.set(0, -0.62, 0.12); DOCS.rotation.x = -0.6; BUKA.userData.arms[0].add(DOCS);
const TSUMA = [makeWoman({ shirt: '#e9b8c8' }), makeWoman({ shirt: '#9fc7a8', hair: '#6b4a33' })]; TSUMA.forEach(p => S.add(p));
const OTTO = makeMan({ shirt: '#4f6a8f', hair: '#2a2420' }); S.add(OTTO);

// ---------- A：会議室（原点） ----------
const MR = makeMeetingRoom(); S.add(MR); MR.userData.chairs.forEach((c, i) => { if (MR.userData.seats[i].z > 0) c.visible = false; });
const iikake = label('つわりは病気じゃ…', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(iikake);
const ut = label('うっ', { w: 384, size: 120, color: '#fff', bg: 'rgba(90,140,70,.96)', sx: 0.5 }); S.add(ut);
const buchoNi = label('部長に つわり', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(buchoNi);
const UME = [0, 1].map(() => { const u = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat('#c8283a')); S.add(u); return u; });
const umeLab = label('梅干し会議', { w: 768, size: 100, color: '#fff', bg: 'rgba(200,40,58,.96)', sx: 1.0 }); S.add(umeLab);
const futsu = label('普通に働く', { w: 768, size: 100, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 1.0 }); S.add(futsu);
const atta = label('それ、私のときに あったらよかった', { w: 1300, size: 84, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.75 }); S.add(atta);
const DOOR = box(0.9, 2.1, 0.08, mat('#b89a70')); DOOR.position.set(3.2, 1.05, -3.42); S.add(DOOR);
const naoranai = label('気の持ちようでは 治らない', { w: 1200, size: 88, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(naoranai);

// ---------- B：家（x=60）：妻たちの不満・炊飯器 ----------
const BX = 60;
room({ x: BX, w: 9, d: 6, h: 3.2, wall: '#efe8da', floor: '#c8b494' });
const counter = box(3.0, 0.9, 0.7, mat('#e8e4dc')); counter.position.set(BX - 0.8, 0.45, -2.5); S.add(counter);
const cooker = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.3, 20), mat('#f4f4f2')); b.position.y = 0.15; cooker.add(b); const lid = new THREE.Group(); const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 20), mat('#d8dce2')); lm.position.set(0, 0, 0.26); lid.add(lm); lid.position.set(0, 0.31, -0.26); cooker.add(lid); cooker.userData.lid = lid; const rice = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), mat('#ffffff')); rice.position.y = 0.29; cooker.add(rice); } cooker.position.set(BX - 0.8, 0.9, -2.45); S.add(cooker);
const steam = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 })); S.add(m); return m; });
const toiletDoor = box(0.9, 2.1, 0.08, mat('#c9b48a')); toiletDoor.position.set(BX + 2.6, 1.05, -2.9); S.add(toiletDoor);
const toiletSign = label('トイレ', { w: 512, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.75 }); toiletSign.position.set(BX + 2.6, 2.4, -2.8); S.add(toiletSign);
const kimochiLab = label('気の持ちようでしょ', { w: 1000, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(kimochiLab);
const tsurai = label('つらい…', { w: 512, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.7 }); S.add(tsurai);
const nioi = label('ごはんの匂い', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.0 }); S.add(nioi);

// ---------- C：給湯室（x=120） ----------
const CX = 120;
room({ x: CX, w: 8, d: 5, h: 3.2, wall: '#e6e2da', floor: '#c8c4bc' });
const dCounter = box(2.4, 0.9, 0.7, mat('#d8d8d4')); dCounter.position.set(CX, 0.45, -2.0); S.add(dCounter);
const coffee = new THREE.Group(); { const b = box(0.5, 0.65, 0.45, mat('#2a2a30')); b.position.y = 0.33; coffee.add(b); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 14), new THREE.MeshLambertMaterial({ color: '#5a3a22', transparent: true, opacity: 0.85 })); pot.position.set(0, 0.14, 0.12); coffee.add(pot); } coffee.position.set(CX - 0.4, 0.9, -2.0); S.add(coffee);
const BAG = box(0.4, 0.3, 0.1, mat('#2a2018')); BAG.position.set(0, -0.68, 0.05); BUCHO.userData.arms[0].add(BAG);
const soutai = label('早退', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.55 }); S.add(soutai);
const cnioi = label('コーヒーの匂い', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.05 }); S.add(cnioi);

// ---------- D：満員電車（x=180） ----------
const DX = 180;
flat(3.2, 30, '#8a8a84', DX, 0, -0.85, 0.02);
for (const sx of [-1, 1]) { const w = box(0.1, 2.6, 30, mat('#d8dde2')); w.position.set(DX + sx * 1.6, 1.3, 0); S.add(w); for (let i = 0; i < 6; i++) { const g = box(0.02, 0.9, 1.6, new THREE.MeshBasicMaterial({ color: '#9fd0f0' })); g.position.set(DX + sx * 1.54, 1.75, -10 + i * 4); S.add(g); } }
const ceil = box(3.2, 0.1, 30, mat('#eef0f2')); ceil.position.set(DX, 2.62, 0); S.add(ceil);
for (const x of [-0.55, 0.55]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 30, 8), mat('#c8ccd4')); r.rotation.x = Math.PI / 2; r.position.set(DX + x, 2.3, 0); S.add(r); for (let i = 0; i < 24; i++) { const g = new THREE.Group(); const b = box(0.03, 0.22, 0.03, mat('#e8e8e8')); b.position.y = -0.11; g.add(b); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), mat('#f2f2f2')); ring.position.y = -0.28; g.add(ring); g.position.set(DX + x, 2.3, -11 + i * 0.95); S.add(g); } }
const RIDERS = []; for (let i = 0; i < 6; i++) { const p = suit({ jacket: ['#2e3442', '#4a4f60', '#56504a'][i % 3], tie: ['#3a6ab2', '#5a8a4a'][i % 2], old: i % 3 === 0 }); RIDERS.push(p); }
const waratte = label('気の持ちようだろ', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(waratte);
const kachoMo = label('課長にも', { w: 640, size: 110, color: '#fff', bg: 'rgba(90,140,70,.96)', sx: 0.8 }); S.add(kachoMo);

// ---------- E：オフィス（x=240）：発表・休みの届け ----------
const EX = 240;
room({ x: EX, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(EX - 1.6, 0, -0.6); S.add(ISL);
const NOTICE = makeDoc({ title: 'お知らせ', rows: ['つわりの休み', '＝ 病気の休みと', '　同じ扱い'], head: '#3a6ab2', w: 1.5, h: 1.6 }); NOTICE.position.set(EX + 1.6, 1.9, -3.38); S.add(NOTICE);
const happyo = label('会社が 発表', { w: 768, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(happyo);
const BOSSDESK = box(1.6, TABLE_Y, 0.8, mat('#8a6a4c')); BOSSDESK.position.set(EX + 1.6, TABLE_Y / 2, -1.6); S.add(BOSSDESK);
const FORMS = [0, 1].map(() => { const d = makeDoc({ title: '休暇届', rows: ['理由：つわり'], head: '#c8242c', w: 0.5, h: 0.62 }); S.add(d); return d; });
const massaki = label('真っ先に 休みの届け', { w: 1000, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.35 }); S.add(massaki);

const PEOPLE = [BUCHO, KACHO, BUKA, ...TSUMA, OTTO, ...RIDERS];
const LABELS = [iikake, ut, buchoNi, umeLab, futsu, atta, naoranai, kimochiLab, tsurai, nioi, soutai, cnioi, waratte, kachoMo, happyo, massaki];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; if (p.userData.face) sick(p, 0); });
  LABELS.forEach(l => l.visible = false); steam.forEach(m => m.visible = false); UME.forEach(u => u.visible = false); BAG.visible = false; DOCS.visible = true;
  sweatB.userData.set(0); sweatK.userData.set(0); cooker.userData.lid.rotation.x = 0; FORMS.forEach(f => f.visible = false); el.flash.style.opacity = 0;
  MR.userData.board.set(['定例会議']);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function run(p, t) { const ph = t * 12; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.8; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.8; p.userData.arms[0].rotation.set(Math.sin(ph) * 0.8, 0, 0); }
const TP = 0.4;
function meeting() { // 会議室：部長は立ってホワイトボードの前、部下は手前の席で立って資料を持つ
  MR.userData.board.set([]);
  stand(BUCHO, 0.2, -2.3, 0.15); BUCHO.userData.arms[0].rotation.set(-0.9, 0, 0.3);
  stand(BUKA, 1.0, 0.1, -0.85); BUKA.userData.arms[0].rotation.set(-1.0, 0, 0.1);
}
function mCam(u = 0) { look(lerp(-0.3, -0.1, u), 1.95, lerp(3.9, 3.6, u), 0.5, 1.75, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：会議室で つわりは病気じゃない と言いかけた部長が、口をおさえて固まる
  reset(); lift(0); meeting(); const k = easeOut(clamp((t - TP) / 0.2));
  if (t < TP) { say(iikake, 1, 0, 0.5, 1.2, -1.9, 1.3); BUCHO.userData.arms[1].rotation.set(-1.2, 0, 0.3); }
  else { mouth(BUCHO, k, t); sick(BUCHO, k * 0.9); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; say(ut, t, TP, -0.45, 1.45, -2.0, 0.4); if (t > TP + 0.35) say(buchoNi, t, TP + 0.35, 0.45, 0.95, -1.2, 0.75); }
  mCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sMitsumeru(t, d) { // 妊娠中の部下が、資料を持ったまま、部長を見つめる
  reset(); lift(150); meeting(); mouth(BUCHO, 1, t); sick(BUCHO, 0.9); sweatB.userData.set(1, t); BUKA.userData.head.rotation.y = 0.15;
  const u = ease(clamp(t / d)); look(lerp(3.2, 2.9, u), 1.7, lerp(2.6, 2.3, u), 0.6, 1.45, -1.4, 50);
  return S;
}
function sFuman(t, d) { // 妻たちの不満から。つらいと言っても、気の持ちようと言われてきた
  reset(); lift(150); const W = TSUMA[0]; stand(W, BX - 0.5, -0.9, 0.35); W.userData.head.rotation.x = 0.25; W.userData.arms[1].rotation.set(-2.5, 0, -0.4);
  stand(TSUMA[1], BX - 1.4, -1.3, 0.4); TSUMA[1].userData.arms[0].rotation.set(-0.5, 0, 0.3);
  stand(OTTO, BX + 0.9, -0.5, -0.6); OTTO.userData.arms[1].rotation.set(-1.3, 0, 0.3);
  if (t > d * 0.3) say(tsurai, t, d * 0.3, BX - 0.6, 2.25, -0.9, 0.6);
  if (t > d * 0.6) say(kimochiLab, t, d * 0.6, BX + 0.3, 2.3, -0.5, 1.0);
  look(BX + 0.1, 1.8, 3.6, BX - 0.2, 1.4, -0.9, 50);
  return S;
}
function sDay1(t, d) { // 1日目。炊飯器を開けたとたん、部長がトイレへ走る
  reset(); lift(150); const k = easeOut(clamp((t - 0.3) / 0.4)); cooker.userData.lid.rotation.x = -1.6 * k;
  steam.forEach((m, i) => { m.visible = k > 0.5; const u = ((t * 0.7 + i * 0.2) % 1); m.position.set(BX - 0.8 + Math.sin(u * 5 + i) * 0.1, 1.3 + u * 1.0, -2.45); m.material.opacity = 0.5 * (1 - u); m.scale.setScalar(0.8 + u * 1.2); });
  const r = clamp((t - d * 0.45) / (d * 0.5));
  if (r <= 0) { stand(BUCHO, BX - 0.8, -1.7, Math.PI); BUCHO.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); if (t > 0.8) { sick(BUCHO, clamp((t - 0.8) / 0.4)); say(nioi, t, 0.8, BX - 0.4, 2.45, -2.0, 0.95); } }
  else { stand(BUCHO, lerp(BX - 0.8, BX + 2.5, ease(r)), lerp(-1.7, -2.4, r), Math.PI / 2 - 0.2); run(BUCHO, t); mouth(BUCHO, 1, t); sick(BUCHO, 1); }
  setHud('部長に つわり', '1日目', 1);
  look(BX + 1.0, 1.9, 2.6, BX + 0.6, 1.3, -2.0, 52);
  return S;
}
function sDay3(t, d) { // 3日目。給湯室のコーヒーの匂いで、部長が早退
  reset(); lift(150); stand(BUCHO, CX + 0.3, -1.2, Math.PI - 1.1);
  steam.forEach((m, i) => { m.visible = true; const u = ((t * 0.6 + i * 0.2) % 1); m.position.set(CX - 0.35 + Math.sin(u * 5 + i) * 0.08, 1.6 + u * 0.8, -1.9); m.material.opacity = 0.45 * (1 - u); m.scale.setScalar(0.6 + u); });
  if (t > 0.5) { mouth(BUCHO, easeOut(clamp((t - 0.5) / 0.3)), t); sick(BUCHO, clamp((t - 0.5) / 0.5)); say(cnioi, t, 0.5, CX - 0.3, 2.5, -1.6, 1.0); }
  if (t > d * 0.55) { BAG.visible = true; BUCHO.rotation.y = 0.6; say(soutai, t, d * 0.55, CX + 0.9, 2.2, -1.0, 0.55); }
  setHud('部長に つわり', '3日目', 1);
  look(CX + 1.2, 1.9, 2.8, CX - 0.1, 1.4, -1.5, 50);
  return S;
}
function sUme(t, d) { // 1週間後。部長の会議は、梅干しをなめながら
  reset(); lift(150); MR.userData.board.set(['定例会議']); const s = MR.userData.seats[2]; stand(BUCHO, s.x, s.z, s.ry); poseSit(BUCHO); sick(BUCHO, 0.6);
  BUCHO.userData.arms[1].rotation.set(-2.4, 0, -0.42); UME[0].visible = true; BUCHO.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.48, 0.3); BUCHO.localToWorld(v); UME[0].position.copy(v);
  if (t > d * 0.35) say(umeLab, t, d * 0.35, s.x + 0.45, 1.6, s.z + 0.3, 0.6);
  setHud('部長に つわり', '1週間後', 1);
  look(0.0, 1.55, 1.3, 0.0, 1.1, -1.6, 52);
  return S;
}
function sFutsu(t, d) { // その横で部下は、同じ梅干しをかじりながら普通に働いている
  reset(); lift(150); const s = MR.userData.seats[2]; stand(BUCHO, s.x, s.z, s.ry); poseSit(BUCHO); sick(BUCHO, 0.6); BUCHO.userData.head.rotation.x = 0.3; BUCHO.rotation.x = 0.1;
  const s2 = MR.userData.seats[4]; stand(BUKA, s2.x, s2.z, s2.ry); poseSit(BUKA); BUKA.userData.arms[0].rotation.set(-1.2, 0, 0.1); BUKA.userData.arms[1].rotation.set(-1.0, 0, -0.1);
  UME[1].visible = true; UME[1].position.set(s2.x + 0.25, TABLE_Y + 0.08, -0.85);
  if (t > d * 0.4) say(futsu, t, d * 0.4, s2.x - 0.2, 1.75, s2.z, 0.7);
  look(0.8, 1.6, 2.4, 0.6, 1.05, -1.3, 52);
  return S;
}
function sDemo(t, d) { // でも、つわりが来たのは、部長だけじゃなかった。気の持ちようだろ と笑っていた課長も、満員電車で口をおさえる
  reset(); lift(150); RIDERS.forEach((p, i) => { const side = i % 2 ? 0.55 : -0.55; stand(p, DX + side, -0.6 - Math.floor(i / 2) * 1.05, side > 0 ? -Math.PI / 2 + 0.75 : Math.PI / 2 - 0.75); p.userData.arms[0].rotation.set(0, 0, -2.9); });
  stand(KACHO, DX, 1.3, 0); KACHO.userData.arms[0].rotation.set(0, 0, -2.9);
  const ph = t / d; // 0..1（2本の字幕）
  if (ph < 0.62) { if (ph > 0.3) say(waratte, t, d * 0.3, DX, 2.45, 1.3, 1.0); KACHO.userData.head.rotation.x = -0.05; }
  else { mouth(KACHO, easeOut(clamp((ph - 0.62) / 0.06)), t); sick(KACHO, clamp((ph - 0.62) / 0.1)); sweatK.userData.set(1, t); say(kachoMo, t, d * 0.64, DX + 0.55, 2.3, 1.3, 0.65); }
  const u = ease(clamp(ph)); look(DX + lerp(0.2, 0.1, u), 1.8, lerp(4.6, 3.9, u), DX, 1.55, 0.6, 52);
  return S;
}
function sHappyo(t, d) { // 会社は、つわりの休みを病気の休みと同じ扱いにすると発表
  reset(); lift(150); stand(BUKA, EX + 0.4, -1.0, -0.5); BUKA.userData.head.rotation.x = -0.15;
  if (t > d * 0.3) say(happyo, t, d * 0.3, EX + 1.6, 3.0, -3.0, 0.9);
  const u = ease(clamp(t / d)); look(EX + lerp(0.6, 0.9, u), 1.9, lerp(3.4, 2.9, u), EX + 1.2, 1.75, -2.6, 50);
  return S;
}
function sAtta(t, d) { // 部下は言う。それ、私のときにあったらよかった
  reset(); lift(150); stand(BUKA, EX + 0.4, -1.0, 0.35); BUKA.userData.arms[1].rotation.set(-0.3, 0, -0.2);
  if (t > d * 0.35) say(atta, t, d * 0.35, EX + 0.4, 2.15, -1.0, 1.05);
  const u = ease(clamp(t / d)); look(EX + lerp(1.0, 0.8, u), 1.75, lerp(2.4, 2.0, u), EX + 0.4, 1.5, -1.0, 50);
  return S;
}
function sKekka(t, d) { // 結果：つわりは病気じゃないと言っていた男ほど、真っ先に休みの届けを出した
  reset(); lift(150);
  stand(BUCHO, EX + 1.2, -0.5, Math.PI); BUCHO.userData.arms[1].rotation.set(-1.4, 0, 0); sick(BUCHO, 0.7);
  stand(KACHO, EX + 2.1, 0.2, Math.PI + 0.2); KACHO.userData.arms[1].rotation.set(-1.4, 0, 0); sick(KACHO, 0.7);
  const k = clamp((t - 0.3) / 0.6); FORMS.forEach((f, i) => { f.visible = true; f.position.set(EX + 1.2 + i * 0.45, TABLE_Y + 0.04, -1.5 + i * 0.1); f.rotation.set(-Math.PI / 2, 0, 0.1 - i * 0.2); f.position.y += (1 - easeOut(k)) * 0.6; });
  if (t > d * 0.5) say(massaki, t, d * 0.5, EX + 1.6, 2.05, -0.6, 1.0);
  setTop('結果', '男ほど 真っ先に休んだ', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(EX + lerp(5.2, 5.5, u), 2.0, lerp(-0.4, -0.1, u), EX + 1.6, 1.2, -0.9, 50);
  return S;
}
function sNaoranai(t, d) { // 気の持ちようで治るなら、部長は会議室から出ていかなかった
  reset(); lift(150); MR.userData.board.set(['つわりは', '病気じゃ…'], { color: '#9a9aa0' }); stand(BUKA, 1.25, -0.1, -0.55);
  const k = clamp(t / (d * 0.6)); stand(BUCHO, lerp(1.6, 3.2, ease(k)), lerp(-2.3, -3.1, k), Math.PI / 2 + 0.4); run(BUCHO, t); mouth(BUCHO, 1, t); sick(BUCHO, 0.9); BUCHO.visible = k < 0.98;
  if (t > d * 0.5) say(naoranai, t, d * 0.5, 0.6, 1.0, -0.4, 1.1);
  look(-0.6, 1.8, 3.8, 0.9, 1.6, -1.8, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); meeting(); mouth(BUCHO, 1, t); sick(BUCHO, 0.9); mCam(0); return S; }

const NARR = { '妊娠中': 'にんしんちゅう', '部下': 'ぶか', '資料': 'しりょう', '持った': 'もった', '部長': 'ぶちょう', '見つめる': 'みつめる', '妻たち': 'つまたち', '不満': 'ふまん', '気の持ちよう': 'きのもちよう', '言われて': 'いわれて', '1日目': 'いちにちめ', '炊飯器': 'すいはんき', '開けた': 'あけた', '走る': 'はしる', '3日目': 'みっかめ', '給湯室': 'きゅうとうしつ', '匂い': 'におい', '早退': 'そうたい', '1週間後': 'いっしゅうかんご', '会議': 'かいぎ', '梅干し': 'うめぼし', '横': 'よこ', '普通に': 'ふつうに', '働いて': 'はたらいて', '来た': 'きた', '笑っていた': 'わらっていた', '課長': 'かちょう', '満員電車': 'まんいんでんしゃ', '口': 'くち', '会社': 'かいしゃ', '休み': 'やすみ', '病気': 'びょうき', '同じ': 'おなじ', '扱い': 'あつかい', '発表': 'はっぴょう', '言う': 'いう', '私': 'わたし', '結果：': '結果、', '男': 'おとこ', '真っ先に': 'まっさきに', '届け': 'とどけ', '出した': 'だした', '治る': 'なおる', '会議室': 'かいぎしつ', '出ていかなかった': 'でていかなかった' };
const P = planTimes([
  ['妊娠中の部下が、<br>資料を持ったまま、', (t, d) => sMitsumeru(t, 2 * d)],
  ['部長を見つめる。', (t, d) => sMitsumeru(t + d, 2 * d)],
  ['妻たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['つらいと言っても、<br>気の持ちようと言われてきた。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。炊飯器を開けたとたん、<br>部長がトイレへ走る。', sDay1],
  ['3日目。給湯室の<br>コーヒーの匂いで、部長が早退。', sDay3],
  ['1週間後。部長の会議は、<br>梅干しをなめながら。', sUme],
  ['その横で部下は、同じ梅干しを<br>かじりながら普通に働いている。', sFutsu],
  ['でも、つわりが来たのは、<br>部長だけじゃなかった。', (t, d) => sDemo(t, 2.4 * d)],
  ['気の持ちようだろ と<br>笑っていた課長も、', (t, d) => sDemo(t + d, 2.4 * d)],
  ['満員電車で口をおさえる。', (t, d) => sDemo(t + 1.75 * d, 2.4 * d)],
  ['会社は、つわりの休みを病気の<br>休みと同じ扱いにすると発表。', sHappyo],
  ['部下は言う。それ、<br>私のときにあったらよかった。', sAtta],
  ['結果：つわりは病気じゃないと<br>言っていた男ほど、', (t, d) => sKekka(t, 2 * d)],
  ['真っ先に休みの届けを出した。', (t, d) => sKekka(t + d, 2 * d)],
  ['気の持ちようで治るなら、', (t, d) => sNaoranai(t, 2 * d)],
  ['部長は会議室から<br>出ていかなかった。', (t, d) => sNaoranai(t + d, 2 * d)],
  ['つわりのとき、<br>休みは取りやすかった？', sAsk],
], { shot0, endCard, start: 2.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0713',
    v2: true,
    tt: 'main',
    trial: true,
    remakeOf: '0663',
    hookLine: '会議室で つわりは病気じゃない と言いかけた部長が、口をおさえて固まる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも部長に、つわりが来たら？',
    titleHtml: 'もしも部長に、<br>つわりが<br>来たら？',
    mood: 'tension', seed: 713, hits: [TP, P.at(12), P.at(14)], risers: [P.at(8)], impacts: [P.at(9, 1.6), P.at(13, 0.4)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.4), 'bubble'], [P.at(4, 1.6), 'whoosh'], [P.at(5, 1.6), 'alarm'], [P.at(9, 1.4), 'whoosh'], [P.at(10, 0.6), 'alarm']],
    narr: NARR,
    ask: 'つわりのとき、休みは取りやすかった？',
    caption: 'もしも部長に、つわりが来たら？\n\n妊娠中の部下が、資料を持ったまま、部長を見つめる。\n妻たちの不満から。つらいと言っても、気の持ちようと言われてきた。\n1日目。炊飯器を開けたとたん、部長がトイレへ走る。\n3日目。給湯室のコーヒーの匂いで、部長が早退。\n1週間後。部長の会議は、梅干しをなめながら。\nその横で部下は、同じ梅干しをかじりながら普通に働いている。\nでも、つわりが来たのは、部長だけじゃなかった。\n気の持ちようだろ と笑っていた課長も、満員電車で口をおさえる。\n会社は、つわりの休みを病気の休みと同じ扱いにすると発表。\n部下は言う。それ、私のときにあったらよかった。\n\n結果：つわりは病気じゃないと言っていた男ほど、真っ先に休みの届けを出した。\n気の持ちようで治るなら、部長は会議室から出ていかなかった。\n\nつわりのとき、休みは取りやすかった？ コメントで教えて。\n\n※風刺ネタです。男につわりが来るのは、もしもの設定です。会社・電車・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'つわり', '妊娠', '男と女のもしも'],
    endStats: [['来たもの', '部長に つわり', 'もしもの設定'], ['真っ先に休んだのは', '病気じゃないと 言っていた男', 'もしもの結果'], ['つわりは', '気の持ちようでは 治らない', 'もしもの結論']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
