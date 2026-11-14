import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #089 今、私たちの学校は...（ドラマ・韓国・2022年・全12話。Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/all-of-us-are-dead で2026/11/14確認（Filmarks の動画配信欄も Netflix）。
//   Filmarks 4.0・レビュー31,680件 filmarks.com/dramas/11826/16360）
// 確かめた事実（Netflix の作品ページ netflix.com/jp/title/81237994、Filmarks のエピソード紹介。2026/11/14）：
//   ・高校の科学室で、1人の生徒が指をかまれる。その後またたく間に感染が広がる（第1話）
//   ・生徒たちは教室に立てこもる（第2話）。携帯を手に入れるため、2人の生徒が危険を冒して職員室へ向かう（第4話）
//   ・はぐれた仲間を見つけだすため、ドローンを使った作戦を思いつく（第5話）
//   ・校内に広がっていくゾンビウイルスにより死の恐怖に直面した生徒たち。自力で脱出するしかない（Netflix の紹介文）
//   ・ウェブトゥーンが原作の韓国ドラマ、ホラー・サバイバル（Netflix のジャンル）。2022年・韓国・全12話（Filmarks）
// 構成（ヒント6段）：1 高校の理科室でひとりの生徒がかまれた・その日から学校がおかしくなっていく → 2 主人公はふつうの高校生たち・教室に立てこもる
//   → 3 校内に安全な場所はない・スマホを取りに危険な職員室へ → 4 自分たちの力で脱出したい・はぐれた仲間をドローンで探す
//   → 5 2022年の韓国ドラマ全12話・ウェブ漫画が原作のサバイバル・ホラー → 6 決め手：学校じゅうに広がるゾンビウイルス・タイトルは「今」で始まる
// 誰が助かるか・感染の原因・結末は言わない。人物名・地名は出さない。血や残酷な描写はしない（かまれた跡は小さな赤い点だけ）。
// 俳優の顔・ポスター・ロゴ・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#1a2024', floor: '#2a3034', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(8989);

const UNI = (i) => ({ skin: ['#f1c9a5', '#f4d3b5', '#e8b98f', '#f5d3b5'][i % 4], hair: ['#1d1a19', '#2c2421', '#4a3426'][i % 3], shirt: i % 2 ? '#e9e4da' : '#2f3a5a', pants: i % 2 ? '#3a3a5a' : '#2b2f3a', long: i % 2 === 1, skirt: i % 2 === 1, tie: i % 2 === 0 });
const ZOM = (i) => ({ skin: '#9ab08a', hair: ['#1d1a19', '#2c2421', '#4a3426'][i % 3], shirt: ['#c8ccc0', '#3a4258', '#b8bcb0'][i % 3], pants: '#2a2e3a', long: i % 3 === 1, skirt: i % 3 === 1 });
function zombie(p, t, i) { p.userData.arms.forEach(a => a.rotation.x = -1.4 + Math.sin(t * 2 + i) * 0.1); p.userData.head.rotation.z = 0.3 * Math.sin(i * 1.7 + 1); p.userData.head.rotation.x = 0.25; }

// ---------- 1段目. 高校の理科室（x=0）。指をおさえる生徒、うずくまる生徒、ちらつく蛍光灯 ----------
{ const fl = box(12, 0.04, 9, mat('#7a8a88')); fl.position.set(0, 0.02, -1.5); qs.add(fl);
  const wl = box(12, 4.2, 0.2, mat('#c8d0c8')); wl.position.set(0, 2.1, -4.2); qs.add(wl);
  const bb = box(3.2, 1.2, 0.05, mat('#2a4a3a')); bb.position.set(-1.4, 2.4, -4.08); qs.add(bb);
  for (const [x, z] of [[-1.6, -2.6], [1.6, -2.6], [-1.6, -0.4], [1.6, -0.4]]) { const b = box(2.2, 0.9, 1.0, mat('#3a3a40')); b.position.set(x, 0.45, z); qs.add(b); const tp = box(2.3, 0.06, 1.1, mat('#1a1a1e')); tp.position.set(x, 0.92, z); qs.add(tp); }
  for (let i = 0; i < 5; i++) { const fk = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 12), new THREE.MeshStandardMaterial({ color: ['#7ad8a0', '#d8e8f0', '#e8c060'][i % 3], transparent: true, opacity: 0.8 })); fk.position.set(-2.4 + i * 0.4, 1.07, -2.6 + (i % 2) * 0.2); qs.add(fk); }
  const win = box(2.0, 1.4, 0.05, new THREE.MeshBasicMaterial({ color: '#e8a070' })); win.position.set(2.6, 2.4, -4.08); qs.add(win); }
const LIGHT1 = []; for (const x of [-1.6, 1.6]) { const l = box(1.6, 0.06, 0.2, new THREE.MeshBasicMaterial({ color: '#f4f8ff' })); l.position.set(x, 3.6, -1.6); qs.add(l); LIGHT1.push(l); }
const stu1 = makePerson(UNI(1)); stu1.position.set(0.1, 0, -1.5); stu1.rotation.y = 0.3; qs.add(stu1);
const DOT1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#d0202a' })); DOT1.position.set(0, -0.68, 0.08); stu1.userData.arms[1].add(DOT1);
const sick1 = makePerson({ ...UNI(0), skin: '#d8c8b0' }); sick1.position.set(-0.8, 0, -3.3); sick1.rotation.y = 0.5; qs.add(sick1);
const Q1 = tag('？', { size: 100, w: 130, h: 130, bg: '#14161c', sx: 0.36 }); qs.add(Q1);
const tBit = tag('理科室で、かまれた', { size: 58, w: 580, bg: '#14161c', sx: 1.9 }); tBit.position.set(0, 3.0, -2.4); qs.add(tBit);
const tWrong = tag('学校が、おかしい', { size: 62, w: 520, bg: '#6a8a3a', sx: 1.8 }); tWrong.position.set(0, 3.0, -2.4); qs.add(tWrong);

// ---------- 2段目. 立てこもった教室（x=40）。扉の前に積んだ机、身を寄せる生徒たち ----------
const AX = 40;
{ const fl = box(10, 0.04, 8, mat('#9a8468')); fl.position.set(AX, 0.02, -1.5); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#d8d4c8')); wl.position.set(AX, 2, -4.0); qs.add(wl);
  const bb = box(3.6, 1.3, 0.05, mat('#2a4a3a')); bb.position.set(AX - 1.0, 2.3, -3.88); qs.add(bb);
  const door = box(1.0, 2.1, 0.06, mat('#8a7a68')); door.position.set(AX + 2.6, 1.05, -3.88); qs.add(door);
  for (let i = 0; i < 6; i++) { const d = box(0.7, 0.5, 0.5, mat('#a88a5a')); d.position.set(AX + 2.3 + (i % 2) * 0.6, 0.25 + Math.floor(i / 2) * 0.5, -3.4 + (i % 3) * 0.05); d.rotation.z = (i % 3 - 1) * 0.08; qs.add(d); } }
const DOORWIN = box(0.4, 0.4, 0.04, new THREE.MeshBasicMaterial({ color: '#3a4a3a' })); DOORWIN.position.set(AX + 2.6, 1.6, -3.84); qs.add(DOORWIN);
const SHADOW2 = makePerson(ZOM(1)); SHADOW2.position.set(AX + 2.6, 0, -4.4); qs.add(SHADOW2);
const HUD2 = []; for (let i = 0; i < 5; i++) { const p = makePerson(UNI(i)); p.position.set(AX - 1.6 + i * 0.6, -0.32, -2.0 - (i % 2) * 0.4); p.userData.legs.forEach(l => l.rotation.x = -1.45); p.rotation.y = 0.2 - i * 0.1; qs.add(p); HUD2.push(p); }
const tUs = tag('ふつうの高校生たち', { size: 58, w: 580, bg: '#14161c', sx: 1.9 }); tUs.position.set(AX, 2.8, -2.2); qs.add(tUs);
const tLock = tag('教室に、立てこもる', { size: 58, w: 580, bg: '#6a8a3a', sx: 1.9 }); tLock.position.set(AX, 2.8, -2.2); qs.add(tLock);

// ---------- 3段目. 夜の廊下（x=80）。ロッカーの列、しのび足のふたり、奥の職員室で光るスマホ ----------
const BX = 80;
{ const fl = box(4, 0.04, 30, mat('#6a7270')); fl.position.set(BX, 0.02, -10); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.2, 3.6, 30, mat('#b8c0b8')); wl.position.set(BX + s * 2.0, 1.8, -10); qs.add(wl);
    for (let i = 0; i < 14; i++) { const lk = box(0.1, 1.6, 0.9, mat(i % 2 ? '#4a6a8a' : '#3a5a7a')); lk.position.set(BX + s * 1.88, 0.8, 2 - i * 1.0); qs.add(lk); } }
  const cl = box(4, 0.1, 30, mat('#d8dcd8')); cl.position.set(BX, 3.6, -10); qs.add(cl);
  const end = box(4, 3.6, 0.2, mat('#8a8070')); end.position.set(BX, 1.8, -14); qs.add(end);
  const dr = box(1.2, 2.2, 0.05, mat('#6a5a48')); dr.position.set(BX, 1.1, -13.88); qs.add(dr); }
const PHONE3 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), new THREE.MeshBasicMaterial({ color: '#9ad8ff' })); PHONE3.position.set(BX, 1.55, -13.8); qs.add(PHONE3);
const LAMP3 = []; for (let i = 0; i < 6; i++) { const l = box(0.6, 0.04, 0.2, new THREE.MeshBasicMaterial({ color: '#c8e0c0' })); l.position.set(BX, 3.53, 1 - i * 2.8); qs.add(l); LAMP3.push(l); }
const SNEAK3 = [0, 1].map(i => { const p = makePerson(UNI(i + 2)); p.rotation.y = Math.PI; p.position.set(BX, 0, 0); qs.add(p); return p; });
const tNoSafe = tag('安全な場所は、ない', { size: 58, w: 580, bg: '#14161c', sx: 1.6 }); qs.add(tNoSafe);
const tPhone = tag('スマホを取りに', { size: 62, w: 480, bg: '#6a8a3a', sx: 1.5 }); qs.add(tPhone);

// ---------- 4段目. 校舎の屋上（x=120）。脱出を誓う生徒たち、飛び立つドローン ----------
const CX = 120;
{ const rf = box(10, 0.3, 8, mat('#8a9090')); rf.position.set(CX, 0.15, -2); qs.add(rf);
  for (const [x, z, w, d] of [[0, -6, 10, 0.1], [-5, -2, 0.1, 8], [5, -2, 0.1, 8]]) { const f = box(w, 1.2, d, mat('#5a6a6a')); f.position.set(CX + x, 0.9, z); qs.add(f); }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 16), mat('#c8ccc8')); tank.position.set(CX + 3.2, 1.0, -4.6); qs.add(tank);
  for (let i = 0; i < 7; i++) { const wt = windowTextures(8900 + i, '#9a9488'); const b = new THREE.Mesh(new THREE.BoxGeometry(4, 6 + i % 3 * 3, 4), new THREE.MeshLambertMaterial({ map: wt.map })); b.position.set(CX - 18 + i * 6, 1, -24 - (i % 2) * 6); qs.add(b); } }
const SK4 = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a4a6a'); gr.addColorStop(1, '#d89a70'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); SK4.position.set(CX, 14, -50); qs.add(SK4);
const ROOF4 = []; for (let i = 0; i < 4; i++) { const p = makePerson(UNI(i)); p.position.set(CX - 1.2 + i * 0.8, 0.3, -1.6 - (i % 2) * 0.3); p.rotation.y = Math.PI; qs.add(p); ROOF4.push(p); }
const DRONE = new THREE.Group(); { const b = box(0.3, 0.08, 0.3, mat('#2a2a2e')); DRONE.add(b); for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 12), new THREE.MeshBasicMaterial({ color: '#c8d0d8', transparent: true, opacity: 0.6 })); r.position.set(x, 0.06, z); DRONE.add(r); }
  const led = box(0.05, 0.03, 0.05, new THREE.MeshBasicMaterial({ color: '#ff3a3a' })); led.position.set(0, -0.05, 0.15); DRONE.add(led); }
DRONE.position.set(CX, 1.2, -2.2); qs.add(DRONE);
const tOut = tag('自分たちの力で、脱出', { size: 56, w: 640, bg: '#14161c', sx: 2.1 }); tOut.position.set(CX, 3.0, -2.4); qs.add(tOut);
const tDrone = tag('ドローンで、仲間を探す', { size: 54, w: 660, bg: '#6a8a3a', sx: 2.2 }); tDrone.position.set(CX, 3.0, -2.4); qs.add(tDrone);

// ---------- 5段目. 夜の部屋のテレビ（x=180）。2022年・韓国ドラマ・ウェブ漫画が原作 ----------
const TX = 180;
{ const fl = box(10, 0.04, 10, mat('#2a2a30')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(10, 6, 0.2, mat('#2a3038')); wl.position.set(TX, 3, -4); qs.add(wl);
  const rack = box(3.4, 0.6, 0.6, mat('#1a1a1e')); rack.position.set(TX, 0.3, -3.5); qs.add(rack); }
const TV5 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2a2a'); gr.addColorStop(1, '#5a7a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c8c4b0'; g.fillRect(120, 110, 400, 190); g.fillStyle = '#5a6a7a'; for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) g.fillRect(140 + c * 48, 125 + r * 55, 30, 36);
  g.fillStyle = '#0e1210'; for (let i = 0; i < 9; i++) { const x = 40 + i * 70; g.beginPath(); g.arc(x, 290, 14, 0, 7); g.fill(); g.fillRect(x - 12, 302, 24, 58); g.fillRect(x + 10, 312, 26, 7); } }) }));
TV5.position.set(TX, 1.6, -3.5); qs.add(TV5);
{ const fr = box(3.36, 1.96, 0.08, mat('#0c0c10')); fr.position.set(TX, 1.6, -3.56); qs.add(fr); }
const t2022 = tag('2022年 韓国ドラマ 全12話', { size: 54, w: 760, bg: '#e6b450', color: '#14161c', sx: 2.6 }); t2022.position.set(TX, 3.2, -3.2); qs.add(t2022);
const tWeb = tag('ウェブ漫画が原作', { size: 60, w: 540, bg: '#6a8a3a', sx: 2.0 }); tWeb.position.set(TX, 3.2, -3.2); qs.add(tWeb);

// ---------- 6段目. 夕暮れの校庭（x=220）。緑のもやの中、校舎へ向かう ゆらゆら歩く人たち ----------
const DX = 220;
{ const gr = box(24, 0.04, 20, mat('#8a7a5a')); gr.position.set(DX, 0.02, -6); qs.add(gr);
  const wt = windowTextures(8999, '#b8b0a0'); wt.map.repeat.set(5, 3); wt.emi.repeat.set(5, 3);
  const sc = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 3), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#9ae0a0'), emissiveIntensity: 0.5 })); sc.position.set(DX, 4, -14); qs.add(sc);
  const ck = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), new THREE.MeshBasicMaterial({ color: '#f4f0e0' })); ck.position.set(DX, 7, -12.48); qs.add(ck); }
const SK6 = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3a2a'); gr.addColorStop(1, '#a8c070'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); SK6.position.set(DX, 14, -50); qs.add(SK6);
const HORDE = []; for (let i = 0; i < 16; i++) { const p = makePerson(ZOM(i)); p.userData.base = new THREE.Vector3(DX - 5 + (i % 8) * 1.4 + (R() - 0.5) * 0.6, 0, -4 - Math.floor(i / 8) * 2.4 - R() * 0.8); p.position.copy(p.userData.base); p.rotation.y = Math.PI + (R() - 0.5) * 0.6; qs.add(p); HORDE.push(p); }
const MIST6 = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8), new THREE.MeshBasicMaterial({ color: '#9ad08a', transparent: true, opacity: 0.18, depthWrite: false })); m.scale.y = 0.35; m.userData = { x: DX - 7 + i * 1.6, z: -3 - (i % 3) * 2, o: R() * 6 }; m.position.set(m.userData.x, 0.4, m.userData.z); qs.add(m); MIST6.push(m); }
const tVirus = tag('学校じゅうに広がる', { size: 58, w: 580, bg: '#14161c', sx: 2.0 }); tVirus.position.set(DX, 3.6, -2.2); qs.add(tVirus);
const tNow = tag('タイトルは「今」から', { size: 58, w: 620, bg: '#6a8a3a', sx: 2.1 }); tNow.position.set(DX, 3.6, -2.2); qs.add(tNow);

// ---------- shots ----------
const ALL = [tBit, tWrong, tUs, tLock, tNoSafe, tPhone, tOut, tDrone, t2022, tWeb, tVirus, tNow];
function base() { S.reset(); ALL.forEach(x => x.visible = false); Q1.visible = false; }

function shotLab(t, quiz = 0) { // 1段目 0〜9：高校の理科室で、ひとりの生徒がかまれた。その日から、学校がおかしくなっていく（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 0.9; S.darken(0.2, '#0a100c');
  stu1.userData.arms[1].rotation.x = -1.3; stu1.userData.arms[1].rotation.z = -0.3; stu1.userData.arms[0].rotation.x = -1.1; stu1.userData.arms[0].rotation.z = 0.4; stu1.userData.head.rotation.x = 0.35;
  const w = quiz ? 1 : clamp((t - 4.2) / 0.5);
  sick1.userData.head.rotation.x = 0.5 - w * 0.2; sick1.userData.arms.forEach(a => a.rotation.x = -0.3 - w * 1.0); sick1.position.y = -0.3 * (1 - w); sick1.userData.legs.forEach(l => l.rotation.x = -1.2 * (1 - w));
  const fl = !quiz && t > 4.2 && Math.sin(t * 23) > 0.4; LIGHT1.forEach(l => l.material.color.set(fl ? '#3a4040' : '#f4f8ff'));
  if (t > 4.2 || quiz) S.darken(0.35 + (fl ? 0.15 : 0), '#0a160c');
  Q1.position.set(0.1, 1.6, -1.4); Q1.userData.pop(quiz ? 1 : (t - 1.0) / 0.3); if (!quiz && t > 4.2) Q1.visible = false;
  if (!quiz) { tBit.userData.pop((t - 0.6) / 0.35); if (t > 4.1) tBit.visible = false; tWrong.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.8, 0.2, u), lerp(2.0, 2.2, u), lerp(2.6, 2.2, u), -0.2, 1.3, -2.2, 62);
  return qs;
}
function shotClass(t) { // 2段目 9〜17：主人公は、ふつうの高校生たち。教室に立てこもって、息をひそめる
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#0a0c0a');
  HUD2.forEach((p, i) => { p.userData.head.rotation.y = t > 4.2 ? 0.7 : Math.sin(t + i) * 0.2; p.userData.arms.forEach(a => a.rotation.x = -0.8); });
  SHADOW2.position.z = t > 4.2 ? -4.2 : -6; SHADOW2.visible = t > 4.2; zombie(SHADOW2, t, 1); SHADOW2.position.x = AX + 2.6 + Math.sin(t * 2) * 0.08;
  tUs.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUs.visible = false; tLock.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.6, 0.4, u), lerp(2.0, 2.1, u), lerp(2.4, 2.0, u), AX + 0.3, 1.2, -2.8, 62);
  return qs;
}
function shotHall(t) { // 3段目 17〜25：校内には、もう安全な場所がない。スマホを取りに、危険な職員室へ
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.5; S.darken(0.5, '#060a08');
  const z = 0.4 - t * 0.7;
  SNEAK3.forEach((p, i) => { p.position.set(BX + (i ? 0.4 : -0.4), 0, z - i * 0.6); poseWalk(p, t * 4 + i, 0.4); p.userData.head.rotation.y = Math.sin(t * 1.4 + i) * 0.5; });
  LAMP3.forEach((l, i) => l.material.color.set(Math.sin(t * 9 + i * 2) > 0.7 ? '#2a3030' : '#c8e0c0'));
  PHONE3.material.color.set(Math.sin(t * 5) > 0 ? '#9ad8ff' : '#5a98c0');
  tNoSafe.position.set(BX, 2.7, z - 2.0); tPhone.position.set(BX, 2.7, z - 2.0);
  tNoSafe.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNoSafe.visible = false; tPhone.userData.pop((t - 4.2) / 0.35);
  look(BX + 0.5, 2.2, z + 3.8, BX, 1.3, z - 8, 62);
  return qs;
}
function shotRoof(t) { // 4段目 25〜33：自分たちの力で、学校から脱出したい。はぐれた仲間を、ドローンで探す
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.9; S.darken(0.25, '#2a2a3a');
  ROOF4.forEach((p, i) => { p.userData.head.rotation.x = t > 4.2 ? -0.4 : 0; if (i === 1) p.userData.arms[1].rotation.x = t > 4.2 ? -2.4 : -0.3; });
  const k = clamp((t - 4.2) / 3.6); DRONE.visible = t > 4.0; DRONE.position.set(CX - 0.4 + Math.sin(k * 3) * 1.2, 1.2 + k * 2.6, -2.2 - k * 2.0); DRONE.rotation.y = t * 0.6;
  DRONE.children.forEach((c, i) => { if (i > 0 && i < 5) c.rotation.y = t * 30; });
  tOut.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOut.visible = false; tDrone.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, -0.2, u), lerp(2.8, 3.0, u), lerp(3.4, 3.0, u), CX, lerp(1.2, 2.0, u), -4.0, 62);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2022年配信の、韓国のドラマ。全12話。ウェブ漫画が原作の、サバイバル・ホラー
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#06080a');
  t2022.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2022.visible = false; tWeb.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(1.6, 1.8, u), lerp(3.4, 2.8, u), TX, 1.3, -3.5, 62);
  return qs;
}
function shotYard(t, quiz = 0) { // 6段目 42〜49（決め手）：学校じゅうに広がる、ゾンビウイルス。タイトルは、「今」で始まる、学校の話
  base(); S.aim(DX, -6); lift(0); S.hemi.intensity = 0.6; S.darken(0.45, '#0a140a');
  HORDE.forEach((p, i) => { const b = p.userData.base; p.position.set(b.x + Math.sin(t * 0.7 + i) * 0.15, 0, b.z - t * 0.25); zombie(p, t, i); poseWalk(p, t * 2.4 + i, 0.25); p.userData.arms.forEach(a => a.rotation.x = -1.4 + Math.sin(t * 2 + i) * 0.1); });
  MIST6.forEach(m => m.position.set(m.userData.x + Math.sin(t * 0.4 + m.userData.o) * 0.8, 0.4, m.userData.z));
  if (!quiz) { tVirus.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tVirus.visible = false; tNow.userData.pop((t - 3.5) / 0.3); }
  const u = ease(t / 7);
  look(DX + lerp(-0.6, 0.4, u), lerp(3.0, 3.2, u), lerp(4.4, 3.6, u), DX, 1.8, -8, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（立てこもった教室に戻る）
  shotClass(2.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.8, 0.6, d); S.darken(0.3 + 0.25 * d, '#060806');
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotLab(t, 0) },
  { a: 9, b: 17, f: shotClass },
  { a: 17, b: 25, f: shotHall },
  { a: 25, b: 33, f: shotRoof },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotYard(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '高校の理科室で、<br>ひとりの生徒がかまれた。'],
  [5.6, 9.0, 'その日から、学校が<br>おかしくなっていく。'],
  [9.2, 13.2, '主人公は、ふつうの<br>高校生たち。'],
  [13.2, 17.0, '教室に立てこもって、<br>息をひそめる。'],
  [17.2, 21.0, '校内には、もう<br>安全な場所がない。'],
  [21.0, 25.0, 'スマホを取りに、<br>危険な職員室へ。'],
  [25.2, 29.0, '自分たちの力で、<br>学校から脱出したい。'],
  [29.0, 33.0, 'はぐれた仲間を、<br>ドローンで探す。'],
  [33.2, 37.4, '2022年配信の、<br>韓国のドラマ。全12話。'],
  [37.4, 41.8, 'ウェブ漫画が原作の、<br>サバイバル・ホラー。'],
  [42.2, 45.4, '学校じゅうに広がる、<br>ゾンビウイルス。'],
  [45.4, 49.0, 'タイトルは、<br>「今」で始まる。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>今、私たちの学校は。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q089', v2: true, answer: '今、私たちの学校は...',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 8989,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '理科室': 'りかしつ', '生徒': 'せいと', 'その日': 'そのひ', '学校じゅう': 'がっこうじゅう', '学校': 'がっこう', '主人公': 'しゅじんこう', '高校生': 'こうこうせい', '教室': 'きょうしつ', '立てこもって': 'たてこもって', '助け': 'たすけ', '待つ': 'まつ', '校内': 'こうない', '安全': 'あんぜん', '場所': 'ばしょ', '取りに': 'とりに', '危険': 'きけん', '職員室': 'しょくいんしつ', '自分たち': 'じぶんたち', '力': 'ちから', '脱出': 'だっしゅつ', '仲間': 'なかま', '探す': 'さがす', '2022年': 'にせんにじゅうにねん', '配信': 'はいしん', '韓国': 'かんこく', '全12話': 'ぜんじゅうにわ', '漫画': 'まんが', '原作': 'げんさく', '広がる': 'ひろがる', '「今」': 'いま', '始まる': 'はじまる', '私たち': 'わたしたち', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n高校の理科室で、ひとりの生徒がかまれた。その日から、学校がおかしくなっていく。主人公は、ふつうの高校生たち。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', '韓国ドラマ', 'ドラマ好き', 'ゾンビ'],
  },
});
applyQuizCards({ answer: '今、私たちの<br>学校は...', info: 'Netflix｜韓国ドラマ・全12話', answerSize: 108 });
