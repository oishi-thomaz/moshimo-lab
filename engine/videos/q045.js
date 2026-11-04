import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #045 サマーウォーズ（アニメ映画・日本・2009年・114分。Netflix・Prime Video・Hulu・U-NEXT で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/samauozu）で2026/11/4確認。Filmarks 3.9・レビュー359,732件 filmarks.com/movies/29605）
// 確かめた事実（Filmarks の作品ページのあらすじ・ja.wikipedia「サマーウォーズ」。2026/11/4）：
//   ・細田守監督の長編オリジナルアニメ。人工知能の暴走で生じた世界の危機を、仮想空間「OZ」と現実世界の両方で救おうとする（Filmarks）
//   ・主人公 小磯健二は数学が得意な高校2年生。国際数学オリンピックの日本代表になり損ねた。憧れの先輩 夏希に頼まれ、彼女の田舎（長野県上田市の陣内家）へ。
//     曽祖母 栄の誕生日に親族が集まる。健二は夏希の婚約者のふりをすることに。深夜、携帯に数字の羅列のメールが届き、解いて返信すると翌日OZが大混乱（wikipedia）
//   ・日本公開2009年8月1日
// 構成（ヒント6段）：1 真夜中の数字だけのメール・解いて返したら次の朝大騒ぎ → 2 数学が得意な高校生・日本代表にあと一歩 → 3 夏の田舎の大きなお屋敷・親戚が大集合
//   → 4 憧れの先輩の頼みは婚約者のふり → 5 2009年の日本のアニメ映画・ネットの仮想世界と大家族 → 6 決め手：仮想世界の名前は OZ、監督は細田守
// 人物名・地名（上田）・家の名前は6段目まで出さない。後半の展開・結末には触れない。作品の映像・キャラクター・OZ やアバターのデザイン・
//   有名な場面の構図（花札の勝負・大勢の手がつながる場面など）は使わない。人と家と仮想空間は汎用の3D

const S = quizStage({ bg: '#8ec8f0', floor: '#6aa04a', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(4545);

const BOY = { skin: '#f2d4b8', hair: '#1a1a1a', shirt: '#f4f4f0', pants: '#3a4a6a' };
const GIRL = { skin: '#f2d4b8', hair: '#3a2418', shirt: '#e86a8a', pants: '#f4f0e8', long: true, skirt: true };

// ---------- 1段目. 真夜中の部屋（x=0）。光る携帯と、浮かぶ数字 ----------
{ const fl = box(8, 0.04, 7, mat('#4a3e34')); fl.position.set(0, 0.02, -1); qs.add(fl); const wl = box(10, 8, 0.2, mat('#2a3048')); wl.position.set(0, 4, -4); qs.add(wl);
  const fu = box(1.4, 0.18, 2.4, mat('#e8e4f0')); fu.position.set(0, 0.12, -1.6); qs.add(fu); const pl = box(0.7, 0.14, 0.4, mat('#f4f0e8')); pl.position.set(0, 0.28, -2.6); qs.add(pl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ color: '#16204a' })); win.position.set(1.6, 2.6, -3.88); qs.add(win);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: '#fff4c8' })); moon.position.set(2.0, 2.9, -3.86); qs.add(moon); }
const boy1 = makePerson(BOY); boy1.position.set(0, 0.2, -1.0); boy1.rotation.y = 0; boy1.userData.legs.forEach(l => l.rotation.x = -1.45); boy1.position.y = -0.1; qs.add(boy1);
const PHONE = new THREE.Group(); { const b = box(0.2, 0.36, 0.03, mat('#2a2a30')); PHONE.add(b); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.3), new THREE.MeshBasicMaterial({ color: '#cfe8ff' })); sc.position.z = 0.017; PHONE.add(sc); } qs.add(PHONE);
const GLOW = new THREE.PointLight(0x9fd0ff, 0, 4, 1.5); qs.add(GLOW);
const DIG = []; for (let i = 0; i < 26; i++) { const d = String(Math.floor(R() * 10)); const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(48, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#bfe4ff'; g.font = 'bold 54px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d, w / 2, h / 2 + 3); }), transparent: true, depthWrite: false })); sp.userData = { a: R() * Math.PI * 2, r: 0.7 + R() * 1.3, y: 0.7 + R() * 1.5, s: 0.3 + R() * 0.5 }; qs.add(sp); DIG.push(sp); }
const tMail = tag('真夜中の 数字だけのメール', { size: 58, w: 700, bg: '#14161c', sx: 2.0 }); tMail.position.set(0, 2.45, -1.4); qs.add(tMail);
const tSolve = tag('解いて返したら…', { size: 72, w: 540, bg: '#e2483c', sx: 1.7 }); tSolve.position.set(0, 2.45, -1.4); qs.add(tSolve);

// ---------- 2段目. 教室（x=40）。数式の黒板 ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#a8845a')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(12, 8, 0.2, mat('#e8e0cc')); wl.position.set(KX, 4, -4); qs.add(wl);
  for (let i = 0; i < 3; i++) { const dk = box(0.9, 0.06, 0.6, mat('#c8a070')); dk.position.set(KX - 1.6 + i * 1.6, 0.75, 0.2); qs.add(dk); const lg = box(0.7, 0.7, 0.5, mat('#6a6a70')); lg.position.set(KX - 1.6 + i * 1.6, 0.36, 0.2); qs.add(lg); } }
const BOARD = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 224, (g, w, h) => { g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f4e8'; g.font = '30px serif'; const L = ['x² + y² = r²', '∫ f(x) dx', 'a ≡ b (mod n)', 'Σ 1/n²', 'p × q = N', '√2 ≒ 1.414']; L.forEach((l, i) => g.fillText(l, 24 + (i % 2) * 250, 50 + Math.floor(i / 2) * 64)); }) })); BOARD.position.set(KX, 2.9, -3.88); qs.add(BOARD);
const boy2 = makePerson(BOY); boy2.position.set(KX + 0.4, 0, -2.6); qs.add(boy2);
const MEDAL = new THREE.Group(); { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24), new THREE.MeshBasicMaterial({ color: '#d8dce4' })); m.rotation.x = Math.PI / 2; MEDAL.add(m); } MEDAL.position.set(KX - 1.4, 2.0, -2.2); qs.add(MEDAL);
const tMath = tag('数学が得意な高校生', { size: 64, w: 620, bg: '#14161c', sx: 2.0 }); tMath.position.set(KX, 3.95, -2.4); qs.add(tMath);
const tAlmost = tag('日本代表に あと一歩', { size: 62, w: 620, bg: '#4fa3d1', sx: 2.0 }); tAlmost.position.set(KX, 3.95, -2.4); qs.add(tAlmost);

// ---------- 3段目. 夏の田舎の大きなお屋敷（x=90）。親戚が集まる ----------
const CX = 90;
const MOUNT = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(8 + R() * 5, 6 + R() * 4, 6), new THREE.MeshLambertMaterial({ color: ['#4a8a4a', '#5a9a52', '#3e7a44'][i % 3] })); m.position.set(CX - 24 + i * 10, 3, -34 - (i % 2) * 6); qs.add(m); MOUNT.push(m); }
const HOUSE = new THREE.Group(); HOUSE.position.set(CX, 0, -8); qs.add(HOUSE);
{ const bd = box(12, 2.6, 5, mat('#e8dcc0')); bd.position.y = 1.5; HOUSE.add(bd); const base = box(12.4, 0.4, 5.4, mat('#6a5a4a')); base.position.y = 0.2; HOUSE.add(base);
  for (let i = 0; i < 8; i++) { const pl = box(0.18, 2.6, 0.18, mat('#5a3a24')); pl.position.set(-5.6 + i * 1.6, 1.5, 2.55); HOUSE.add(pl); }
  for (let i = 0; i < 7; i++) { const sh = box(1.3, 2.0, 0.05, mat('#f8f4e8')); sh.position.set(-4.8 + i * 1.6, 1.5, 2.52); HOUSE.add(sh); }
  const roofM = mat('#3a4a5a'); for (const s of [-1, 1]) { const rf = box(13.6, 0.25, 3.6, roofM); rf.position.set(0, 3.55, s * 1.4); rf.rotation.x = s * 0.5; HOUSE.add(rf); } const rg = box(13.8, 0.3, 0.3, mat('#2a3440')); rg.position.y = 4.35; HOUSE.add(rg);
  const en = box(12.4, 0.12, 1.2, mat('#8a6a4a')); en.position.set(0, 0.55, 3.2); HOUSE.add(en); }
const KIN = []; for (let i = 0; i < 12; i++) { const p = makePerson({ skin: '#f2d4b8', hair: ['#1a1a1a', '#5a4a3a', '#8a8a8a', '#2a2018'][i % 4], shirt: ['#e05a4f', '#3f8f6b', '#f2c14e', '#4fa3d1', '#8e6bbf', '#f4f4f0'][i % 6], pants: ['#2b3346', '#4a3a2a', '#e8e4d8'][i % 3], long: i % 3 === 1, skirt: i % 5 === 2, scale: i % 4 === 3 ? 0.7 : 1 }); p.userData.x = CX - 5 + (i % 6) * 2; p.userData.z = -3.6 + Math.floor(i / 6) * 1.6; p.userData.d = i * 0.25; p.position.set(p.userData.x, 0, p.userData.z + 8); qs.add(p); KIN.push(p); }
const CLOUD = []; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2 + R() * 1.6, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); s.position.set(k * 1.6 - 4, R() * 2 + (k % 3) * 1.4, 0); g.add(s); } g.position.set(CX - 20 + i * 13, 14 + R() * 4, -50); qs.add(g); CLOUD.push(g); }
const tSummer = tag('夏の田舎の 大きな家', { size: 62, w: 620, bg: '#14161c', sx: 4.6 }); tSummer.position.set(CX, 5.6, -2); qs.add(tSummer);
const tKin = tag('親戚が 大集合', { size: 74, w: 480, bg: '#e6b450', color: '#14161c', sx: 3.8 }); tKin.position.set(CX, 5.6, -2); qs.add(tKin);

// ---------- 4段目. 座敷（x=130）。先輩とならんで、ひいおばあちゃんの前に ----------
const BX = 130;
{ const fl = box(10, 0.04, 8, mat('#c8b880')); fl.position.set(BX, 0.02, -1); qs.add(fl); for (let i = 0; i < 6; i++) { const ln = box(0.03, 0.01, 8, mat('#8a7a50')); ln.position.set(BX - 4 + i * 1.6, 0.05, -1); qs.add(ln); }
  const wl = box(10, 6, 0.2, mat('#e8dcc0')); wl.position.set(BX, 3, -4.2); qs.add(wl);
  const tk = box(1.6, 2.4, 0.4, mat('#d8c8a0')); tk.position.set(BX - 2.6, 1.2, -4.0); qs.add(tk); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.6), new THREE.MeshBasicMaterial({ color: '#f4efe0' })); sc.position.set(BX - 2.6, 1.6, -3.78); qs.add(sc); }
const GRAN = makePerson({ skin: '#ecc9a6', hair: '#d8d8d8', shirt: '#5a4a6a', pants: '#5a4a6a', long: false }); GRAN.position.set(BX, -0.4, -2.8); GRAN.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(GRAN);
const boy4 = makePerson(BOY); boy4.position.set(BX - 0.75, 0, -0.2); boy4.rotation.y = Math.PI; qs.add(boy4);
const girl4 = makePerson(GIRL); girl4.position.set(BX + 0.75, 0, -0.2); girl4.rotation.y = Math.PI; qs.add(girl4);
const HEART = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, -0.3); s.bezierCurveTo(-0.5, 0.05, -0.3, 0.4, 0, 0.18); s.bezierCurveTo(0.3, 0.4, 0.5, 0.05, 0, -0.3); return s; })()), new THREE.MeshBasicMaterial({ color: '#ff6a8a', side: THREE.DoubleSide })); HEART.position.set(BX, 2.35, -0.2); qs.add(HEART);
const tAsk = tag('憧れの先輩の 頼み', { size: 64, w: 600, bg: '#14161c', sx: 2.0 }); tAsk.position.set(BX, 3.0, -2.2); qs.add(tAsk);
const tFake = tag('婚約者の ふり', { size: 84, w: 500, bg: '#e86a8a', sx: 1.8 }); tFake.position.set(BX, 3.0, -2.2); qs.add(tFake);

// ---------- 5段目. ネットの仮想世界（x=170）。浮かぶ球と光の格子 ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshBasicMaterial({ color: '#f4f6fa', fog: false })); bg.position.set(FX, 5, -8); qs.add(bg);
  const grid = new THREE.GridHelper(30, 30, '#9ac0ff', '#c8dcff'); grid.position.set(FX, 0.05, -3); qs.add(grid); }
const ORBS = []; for (let i = 0; i < 22; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.2 + R() * 0.35, 16, 12), new THREE.MeshLambertMaterial({ color: ['#ff8a5a', '#5ac8ff', '#ffd25a', '#8ae06a', '#c88aff', '#ff6a9a'][i % 6], emissive: '#222' })); o.userData = { a: R() * Math.PI * 2, r: 1.5 + R() * 3.5, y: 0.8 + R() * 4, s: 0.2 + R() * 0.4 }; o.position.set(FX, o.userData.y, -2); qs.add(o); ORBS.push(o); }
const RING = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 10, 60), new THREE.MeshBasicMaterial({ color: '#5a9aff' })); RING.position.set(FX, 2.6, -2); qs.add(RING);
const FAM = []; for (let i = 0; i < 9; i++) { const p = makePerson({ skin: '#f2d4b8', hair: ['#1a1a1a', '#5a4a3a', '#d8d8d8'][i % 3], shirt: ['#e05a4f', '#3f8f6b', '#f2c14e', '#4fa3d1', '#8e6bbf'][i % 5], pants: '#2b3346', long: i % 2 === 1, scale: 0.6 }); p.position.set(FX - 2.4 + i * 0.6, 0, 1.2); p.rotation.y = 0; qs.add(p); FAM.push(p); }
const tJP = tag('2009年 日本のアニメ映画', { size: 56, w: 700, bg: '#e2483c', sx: 3.2 }); tJP.position.set(FX, 4.9, -1.2); qs.add(tJP);
const tNet = tag('ネットの仮想世界 × 大家族', { size: 54, w: 760, bg: '#14161c', sx: 3.4 }); tNet.position.set(FX, 4.9, -1.2); qs.add(tNet);

// ---------- 6段目. 夏空の下の縁側（x=210）。入道雲と、空に浮かぶ光の輪 ----------
const NX = 210;
const HOUSE6 = HOUSE.clone(); HOUSE6.position.set(NX, 0, -6); qs.add(HOUSE6);
const CL6 = []; for (let i = 0; i < 3; i++) { const g = CLOUD[i].clone(); g.position.set(NX - 14 + i * 14, 12 + i * 2, -46); qs.add(g); CL6.push(g); }
const SKYRING = new THREE.Mesh(new THREE.TorusGeometry(4, 0.12, 10, 80), new THREE.MeshBasicMaterial({ color: '#5a9aff', transparent: true, fog: false })); SKYRING.position.set(NX, 10.5, -14); qs.add(SKYRING);
const SKYRING2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.08, 10, 80), new THREE.MeshBasicMaterial({ color: '#ffd25a', transparent: true, fog: false })); SKYRING2.position.set(NX, 10.5, -14); qs.add(SKYRING2);
const boy6 = makePerson(BOY); boy6.position.set(NX - 0.4, 0, 0.4); boy6.rotation.y = Math.PI; qs.add(boy6);
const girl6 = makePerson(GIRL); girl6.position.set(NX + 0.4, 0, 0.4); girl6.rotation.y = Math.PI; qs.add(girl6);
const tOZ = tag('仮想世界の名前は OZ', { size: 62, w: 620, bg: '#4fa3d1', sx: 3.0 }); tOZ.position.set(NX, 3.4, -0.6); qs.add(tOZ);
const tDir = tag('監督 細田守', { size: 76, w: 440, bg: '#14161c', sx: 2.4 }); tDir.position.set(NX, 3.4, -0.6); qs.add(tDir);

// ---------- shots ----------
const ALL = [tMail, tSolve, tMath, tAlmost, tSummer, tKin, tAsk, tFake, tJP, tNet, tOZ, tDir];
function base() { S.reset(); ALL.forEach(x => x.visible = false); GLOW.intensity = 0; DIG.forEach(d => d.visible = false); HEART.visible = false; }

function shotNight(t) { // 1段目 0〜9：真夜中、携帯に届いた、数字だけのメール。解いて返したら、次の朝、大騒ぎに（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.35; S.key.intensity = 0.15; S.darken(0.85, '#0a0e20');
  boy1.userData.arms.forEach(a => a.rotation.x = -1.2); boy1.userData.head.rotation.x = 0.5;
  PHONE.position.set(0, 1.25, -0.55); PHONE.rotation.x = -0.5;
  GLOW.position.set(0, 1.5, -0.2); GLOW.intensity = 8;
  const burst = t > 4.8 ? ease(clamp((t - 4.8) / 1.0)) : 0;
  DIG.forEach((d, i) => { d.visible = true; const u = d.userData; const a = u.a + t * u.s; const r = u.r * (0.6 + 0.4 * burst + 0.5 * burst); d.position.set(Math.cos(a) * r, u.y + Math.sin(t * 1.4 + i) * 0.1, -1.0 + Math.sin(a) * r * 0.6); d.lookAt(0, 2, 4); });
  tMail.userData.pop(1); if (t > 4.6) tMail.visible = false;
  tSolve.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.2, 0.3, u), lerp(2.2, 2.1, u), lerp(2.9, 2.3, u), 0, 1.6, -1.2, 58);
  return qs;
}
function shotClass(t) { // 2段目 9〜17：主人公は、数学が得意な高校生。国の代表に、あと一歩で届かなかった
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.25;
  boy2.userData.arms[1].rotation.x = -2.4 + 0.15 * Math.sin(t * 4); boy2.userData.head.rotation.y = t > 4.4 ? 0.5 * ease((t - 4.4) / 0.6) : 0;
  MEDAL.visible = t > 4.2; MEDAL.rotation.y = t * 1.5; MEDAL.scale.setScalar(t > 4.2 ? ease(clamp((t - 4.2) / 0.4)) : 0.01);
  tMath.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMath.visible = false;
  tAlmost.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.6, -0.1, u), lerp(2.6, 2.5, u), lerp(4.4, 3.6, u), KX, 2.5, -2.8, 58);
  return qs;
}
function shotHouse(t) { // 3段目 17〜25：舞台は、夏の田舎の大きなお屋敷。親戚が、大勢集まってくる
  base(); S.aim(CX, -6); lift(-10); S.hemi.intensity = 1.35;
  KIN.forEach((p, i) => { const k = ease(clamp((t - 0.6 - p.userData.d) / 2.4)); p.position.set(p.userData.x, 0, p.userData.z + lerp(8, 0, k)); p.rotation.y = k < 1 ? Math.PI : 0; const ph = t * 8 + i; const w = 1 - k; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.5 * w; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5 * w; if (k >= 1) p.userData.arms[1].rotation.x = -0.4 - 0.3 * Math.sin(t * 3 + i); });
  tSummer.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSummer.visible = false;
  tKin.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-1.0, 0.6, u), lerp(3.2, 3.6, u), lerp(12.5, 11.0, u), CX, 2.4, -4, 58);
  return qs;
}
function shotZashiki(t) { // 4段目 25〜33：憧れの先輩に頼まれたのは、婚約者のふり。ひいおばあちゃんの、誕生日を祝うために
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 1.2;
  GRAN.userData.head.rotation.x = -0.1; GRAN.userData.head.rotation.y = Math.sin(t * 0.8) * 0.15;
  boy4.userData.head.rotation.y = t > 4.2 ? -0.5 : 0; boy4.userData.arms[0].rotation.x = t > 4.4 ? -0.3 : 0;
  girl4.userData.arms[0].rotation.x = t > 4.4 ? -0.6 : 0; girl4.userData.head.rotation.y = t > 4.2 ? 0.4 : 0;
  HEART.visible = t > 4.4; HEART.scale.setScalar(t > 4.4 ? 0.8 + 0.1 * Math.sin(t * 5) : 0.01);
  tAsk.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tAsk.visible = false;
  tFake.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.0, 0.5, u), lerp(2.3, 2.2, u), lerp(4.6, 3.8, u), BX, 1.5, -1.6, 58);
  return qs;
}
function shotNet(t) { // 5段目 33〜42：2009年の、日本のアニメ映画。ネットの仮想世界と、大家族の話
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.4; S.darken(0, '#ffffff');
  ORBS.forEach((o, i) => { const u = o.userData; const a = u.a + t * u.s; o.position.set(FX + Math.cos(a) * u.r, u.y + Math.sin(t + i) * 0.2, -2 + Math.sin(a) * u.r * 0.5); });
  RING.rotation.x = t * 0.6; RING.rotation.y = t * 0.9;
  FAM.forEach((p, i) => { p.visible = t > 4.2; p.position.y = t > 4.2 ? Math.max(0, 0.3 * Math.sin((t - 4.2) * 6 + i)) * (1 - clamp((t - 5.4) / 0.6)) : 0; });
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  tNet.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.6, lerp(8.6, 7.6, u), FX, 2.6, -1.5, 56);
  return qs;
}
function shotSky(t, quiz = 0) { // 6段目 42〜49（決め手）：仮想世界の名前は、OZ。監督は、細田守
  base(); S.aim(NX, -4); lift(-10); S.hemi.intensity = 1.35;
  SKYRING.rotation.z = t * 0.4; SKYRING2.rotation.z = -t * 0.6; SKYRING.rotation.x = 0.3 * Math.sin(t * 0.5);
  boy6.userData.head.rotation.x = -0.4; girl6.userData.head.rotation.x = -0.4; girl6.userData.arms[1].rotation.x = -2.6;
  if (!quiz) { tOZ.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tOZ.visible = false; tDir.userData.pop((t - 3.6) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(0.8, 0.2, u), lerp(1.5, 1.6, u), lerp(5.6, 5.0, u), NX, lerp(4.6, 5.2, u), -10, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夏空を見上げるふたり）
  shotSky(t + 7, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.35, 0.5, d); S.darken(0.5 * d, '#1a2a48');
  S.spot.color.set(0xfff0d0); S.spot.position.set(NX, 6, 4); S.spot.target.position.set(NX, 1, 0.4); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.5, 0.2, k), lerp(1.8, 1.7, k), lerp(-2.8, -2.4, k), NX, 1.5, 0.4, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotNight },
  { a: 9, b: 17, f: shotClass },
  { a: 17, b: 25, f: shotHouse },
  { a: 25, b: 33, f: shotZashiki },
  { a: 33, b: 42, f: shotNet },
  { a: 42, b: 49, f: (t) => shotSky(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '真夜中、携帯に届いた、<br>数字だけのメール。'],
  [5.6, 9.0, '解いて返したら、<br>次の朝、大騒ぎに。'],
  [9.2, 13.2, '主人公は、<br>数学が得意な高校生。'],
  [13.2, 17.0, '国の代表に、あと一歩で<br>届かなかった。'],
  [17.2, 21.0, '舞台は、夏の田舎の<br>大きなお屋敷。'],
  [21.0, 25.0, '親戚が、<br>大勢集まってくる。'],
  [25.2, 29.0, '憧れの先輩に頼まれたのは、<br>婚約者のふり。'],
  [29.0, 33.0, 'ひいおばあちゃんの、<br>誕生日を祝うために。'],
  [33.2, 37.4, '2009年の、<br>日本のアニメ映画。'],
  [37.4, 41.8, 'ネットの仮想世界と、<br>大家族の話。'],
  [42.2, 45.4, '仮想世界の名前は、<br>OZ。'],
  [45.4, 49.0, '監督は、<br>細田守。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、サマーウォーズ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q045', v2: true, answer: 'サマーウォーズ',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 4545,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'buzz'], [4.8, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.4, 'bubble'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'サマーウォーズ': 'サマーウォーズ', '細田守': 'ほそだまもる', 'OZ': 'オズ', '2009年': 'にせんきゅうねん', '真夜中': 'まよなか', '携帯': 'けいたい', '届いた': 'とどいた', '数字だけ': 'すうじだけ', '解いて': 'といて', '返したら': 'かえしたら', '次の朝': 'つぎのあさ', '大騒ぎ': 'おおさわぎ', '主人公': 'しゅじんこう', '数学': 'すうがく', '得意': 'とくい', '高校生': 'こうこうせい', '国の代表': 'くにのだいひょう', 'あと一歩': 'あといっぽ', '届かなかった': 'とどかなかった', '舞台': 'ぶたい', '夏の田舎': 'なつのいなか', '大きなお屋敷': 'おおきなおやしき', '親戚': 'しんせき', '大勢': 'おおぜい', '集まって': 'あつまって', '憧れ': 'あこがれ', '先輩': 'せんぱい', '頼まれた': 'たのまれた', '婚約者': 'こんやくしゃ', 'ひいおばあちゃん': 'ひいおばあちゃん', '誕生日': 'たんじょうび', '祝う': 'いわう', '日本': 'にほん', '仮想世界': 'かそうせかい', '大家族': 'だいかぞく', '名前': 'なまえ', '監督': 'かんとく', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n真夜中、携帯に届いた、数字だけのメール。解いて返したら、次の朝、大騒ぎに。主人公は、数学が得意な高校生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'アニメ映画', '夏の映画'],
  },
});
applyQuizCards({ answer: 'サマーウォーズ', info: 'Netflix・Prime Video｜アニメ映画・114分', answerSize: 112 });
