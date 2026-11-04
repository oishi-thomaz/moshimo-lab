import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #048 カメラを止めるな！（映画・日本・2018年・96分・コメディ／ゾンビ。Hulu・U-NEXT で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/kamerawozhi-meruna）で2026/11/4確認。Filmarks 3.8・レビュー274,659件 filmarks.com/movies/76912）
// 確かめた事実（Filmarks の作品ページのあらすじ・ja.wikipedia「カメラを止めるな!」。2026/11/4）：
//   ・とある自主映画の撮影隊が山奥の廃墟でゾンビ映画を撮影。本物を求める監督はなかなかOKを出さず、テイクは42テイクに。そこに本物のゾンビが襲いかかる。
//     大喜びで撮影を続ける監督（Filmarks）
//   ・建物には、旧日本軍が死体を蘇らせる実験をしていたという都市伝説がある（wikipedia のあらすじ前半）
//   ・2018年6月23日劇場公開。製作費250万〜300万円。公開当初は2館、口コミで広がり最終的に353館。前半の約37分はワンカット。監督・脚本 上田慎一郎（wikipedia）
// 構成（ヒント6段）：1 山奥の廃墟で映画の撮影中・なかなかOKが出ない → 2 本物の恐怖にこだわる監督・テイクは42回目 → 3 夜の古い建物・ある噂
//   → 4 本物のゾンビが現れた・監督は大喜びで撮影を続ける → 5 2018年の日本映画・製作費およそ300万円 → 6 決め手：2館から口コミで350館以上、始まりの約37分はワンカット
// 後半の構造（この映画の仕掛け）には絶対に触れない。題名に近い言い回し（カメラは止めない など）は6段目まで使わない。人物名は出さない。
//   作品の映像・俳優・ポスター・有名な場面の構図（屋上の五芒星・斧など）は使わない。血や傷は見せない。人とゾンビと建物は汎用の3D

const S = quizStage({ bg: '#23262c', floor: '#3a3a36', fogNear: 20, fogFar: 80 });
const qs = S.scene;
const R = rng(4848);

const DIR = { skin: '#ecc9a6', hair: '#2a2420', shirt: '#4a5a3a', pants: '#2a2a30' };
const ACT = { skin: '#f2d4b8', hair: '#1a1a1a', shirt: '#e8e4dc', pants: '#3a4a6a', long: true };
const CAMM = { skin: '#e8c4a0', hair: '#3a2a20', shirt: '#2a2e38', pants: '#22242a' };
const ZOM = (i) => ({ skin: ['#8aa07a', '#7a9070', '#9aa888'][i % 3], hair: '#2a2a2a', shirt: ['#5a5a50', '#4a4a5a', '#6a5a4a'][i % 3], pants: '#2a2a2a', long: i % 2 === 1 });
function capOn(p) { const c = box(0.46, 0.1, 0.46, mat('#c84a3a')); c.position.y = 0.52; p.userData.head.add(c); const b = box(0.3, 0.04, 0.2, mat('#c84a3a')); b.position.set(0, 0.48, 0.3); p.userData.head.add(b); }
function camRig() { const g = new THREE.Group(); const b = box(0.36, 0.3, 0.5, mat('#1a1a1e')); g.add(b); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.25, 14), mat('#2a2a30')); l.rotation.x = Math.PI / 2; l.position.z = 0.36; g.add(l); const red = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); red.position.set(0.12, 0.17, 0.1); g.add(red); g.userData.red = red; return g; }
function clapper(n) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(140, 100, (c, w, h) => { c.fillStyle = '#141416'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f4f4f0'; c.lineWidth = 2; c.strokeRect(4, 30, w - 8, h - 34); c.beginPath(); c.moveTo(w / 2, 30); c.lineTo(w / 2, h - 4); c.stroke(); c.fillStyle = '#f4f4f0'; c.font = 'bold 13px sans-serif'; c.fillText('TAKE', w / 2 + 8, 48); c.font = 'bold 34px sans-serif'; c.fillText(String(n), w / 2 + 10, 86); c.font = 'bold 13px sans-serif'; c.fillText('SCENE', 10, 48); c.font = 'bold 30px sans-serif'; c.fillText('1', 22, 86); }) })); g.add(b); const top = new THREE.Group(); const tb = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.1), new THREE.MeshBasicMaterial({ map: canvasTex(140, 20, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f4f4f0' : '#141416'; c.beginPath(); c.moveTo(i * 20, 0); c.lineTo(i * 20 + 20, 0); c.lineTo(i * 20 + 10, h); c.lineTo(i * 20 - 10, h); c.fill(); } }) })); tb.position.set(0.35, 0.05, 0.001); top.add(tb); top.position.set(-0.35, 0.25, 0); g.add(top); g.userData.top = top; return g; }

// ---------- 1段目. 廃墟の中（x=0）。撮影隊と、OKが出ない監督 ----------
{ const fl = box(10, 0.04, 8, mat('#4a4a44')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshLambertMaterial({ map: canvasTex(256, 160, (g, w, h) => { g.fillStyle = '#6a6a62'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(30,30,28,${0.1 + R() * 0.25})`; g.fillRect(R() * w, R() * h, 6 + R() * 30, 4 + R() * 20); } g.fillStyle = '#2a2a2a'; g.fillRect(150, 40, 60, 50); g.strokeStyle = '#3a3a36'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(R() * w, R() * h); g.lineTo(R() * w, R() * h); g.stroke(); } }) })); wl.position.set(0, 3, -4); qs.add(wl);
  for (let i = 0; i < 6; i++) { const d = box(0.3 + R() * 0.4, 0.15 + R() * 0.2, 0.3 + R() * 0.3, mat('#5a5a54')); d.position.set(-3 + R() * 6, 0.1, -3 + R() * 2); d.rotation.y = R() * 3; qs.add(d); } }
const dir1 = makePerson(DIR); capOn(dir1); dir1.position.set(1.3, 0, -2.6); dir1.rotation.y = -Math.PI / 2 + 0.2; qs.add(dir1);
const act1 = makePerson(ACT); act1.position.set(-0.5, 0, -2.2); act1.rotation.y = 0.5; qs.add(act1);
const cam1m = makePerson(CAMM); cam1m.position.set(1.5, 0, 0.5); cam1m.rotation.y = -Math.PI / 2 - 0.9; qs.add(cam1m);
const RIG1 = camRig(); RIG1.position.set(1.25, 1.6, 0.3); RIG1.rotation.y = -Math.PI / 2 - 0.9; qs.add(RIG1);
const CLAP1 = clapper(41); CLAP1.position.set(-1.0, 1.45, -1.5); CLAP1.rotation.y = 0.4; qs.add(CLAP1);
const tShoot = tag('山奥の廃墟で 撮影中', { size: 62, w: 620, bg: '#14161c', sx: 1.9 }); tShoot.position.set(0, 2.55, -1.4); qs.add(tShoot);
const tNG = tag('まだOKが出ない', { size: 72, w: 520, bg: '#e2483c', sx: 1.8 }); tNG.position.set(0, 2.55, -1.4); qs.add(tNG);

// ---------- 2段目. 監督のアップ（x=40）。メガホンとカチンコ42 ----------
const KX = 40;
{ const wl = box(10, 6, 0.2, mat('#5a5a54')); wl.position.set(KX, 3, -3); qs.add(wl); const fl = box(10, 0.04, 8, mat('#4a4a44')); fl.position.set(KX, 0.02, -1); qs.add(fl); }
const dir2 = makePerson(DIR); capOn(dir2); dir2.position.set(KX - 0.3, 0, -1.2); qs.add(dir2);
const MEGA = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.06, 0.45, 16, 1, true), new THREE.MeshLambertMaterial({ color: '#f2c14e', side: THREE.DoubleSide })); MEGA.rotation.x = Math.PI / 2; MEGA.position.set(KX + 0.02, 1.72, -0.78); qs.add(MEGA);
const CLAP2 = clapper(42); CLAP2.position.set(KX + 0.75, 1.95, -0.6); CLAP2.rotation.y = -0.3; qs.add(CLAP2);
const tReal = tag('本物にこだわる監督', { size: 64, w: 620, bg: '#14161c', sx: 1.9 }); tReal.position.set(KX + 0.2, 2.85, -1.0); qs.add(tReal);
const tTake = tag('テイク 42回目', { size: 76, w: 520, bg: '#e6b450', color: '#14161c', sx: 1.8 }); tTake.position.set(KX + 0.2, 2.85, -1.0); qs.add(tTake);

// ---------- 3段目. 夜の森の古い建物（x=90）。月と霧 ----------
const CX = 90;
const BLD = new THREE.Group(); BLD.position.set(CX, 0, -10); qs.add(BLD);
{ const b = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 5), new THREE.MeshLambertMaterial({ map: canvasTex(200, 100, (g, w, h) => { g.fillStyle = '#5a5a56'; g.fillRect(0, 0, w, h); for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { g.fillStyle = (i + r) % 4 === 1 ? '#c8b060' : '#1a1a1c'; g.fillRect(12 + i * 31, 18 + r * 42, 20, 24); } for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(20,24,20,.25)'; g.fillRect(R() * w, R() * h, 4 + R() * 14, 10 + R() * 30); } }) })); b.position.y = 2.5; BLD.add(b); const tw = box(2, 7, 2, mat('#4e4e4a')); tw.position.set(3.4, 3.5, 0); BLD.add(tw); }
const TREES = []; for (let i = 0; i < 20; i++) { const g = new THREE.Group(); const tr = box(0.2, 1.2, 0.2, mat('#2a2018')); tr.position.y = 0.6; g.add(tr); const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 + R() * 0.5, 2.8 + R() * 1.5, 7), mat('#1e3424')); c.position.y = 2.4; g.add(c); g.position.set(CX - 12 + R() * 24, 0, -2 - R() * 16); if (Math.abs(g.position.x - CX) < 5.5 && g.position.z < -6) g.position.z = -14 - R() * 6; qs.add(g); TREES.push(g); }
const MOON = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ color: '#f4f0d8', fog: false })); MOON.position.set(CX - 5, 13, -40); qs.add(MOON);
const FOG3 = []; for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.2), new THREE.MeshBasicMaterial({ color: '#a8b0b8', transparent: true, opacity: 0.18, depthWrite: false })); f.position.set(CX - 8 + i * 3.2, 0.5 + (i % 2) * 0.4, -4 - i); qs.add(f); FOG3.push(f); }
const tNight = tag('夜の古い建物', { size: 76, w: 480, bg: '#14161c', sx: 3.4 }); tNight.position.set(CX, 4.2, -2); qs.add(tNight);
const tRumor = tag('ここには ある噂が…', { size: 64, w: 580, bg: '#6a5a8a', sx: 3.6 }); tRumor.position.set(CX, 4.2, -2); qs.add(tRumor);

// ---------- 4段目. ゾンビ登場（x=130）。逃げる人と、撮り続ける監督 ----------
const BX = 130;
{ const fl = box(12, 0.04, 10, mat('#4a4a44')); fl.position.set(BX, 0.02, -1); qs.add(fl); const wl = box(12, 6, 0.2, mat('#5a5a52')); wl.position.set(BX, 3, -5); qs.add(wl); }
const ZOMS = []; for (let i = 0; i < 4; i++) { const p = makePerson(ZOM(i)); p.userData.x = BX - 2.2 + i * 1.4; p.userData.z0 = -3.0 - (i % 2) * 0.6; p.position.set(p.userData.x, 0, p.userData.z0); p.userData.arms.forEach(a => a.rotation.x = -1.5); qs.add(p); ZOMS.push(p); }
const act4 = makePerson(ACT); act4.position.set(BX - 1.2, 0, 0); qs.add(act4);
const dir4 = makePerson(DIR); capOn(dir4); dir4.position.set(BX + 1.5, 0, -0.2); dir4.rotation.y = Math.PI + 0.6; qs.add(dir4);
const RIG4 = camRig(); RIG4.position.set(BX + 1.3, 1.6, -0.5); qs.add(RIG4);
const tZom = tag('本物のゾンビ!?', { size: 76, w: 520, bg: '#3f8f6b', sx: 2.0 }); tZom.position.set(BX, 2.9, -1.4); qs.add(tZom);
const tJoy = tag('監督は 大喜びで撮影続行', { size: 56, w: 700, bg: '#14161c', sx: 2.2 }); tJoy.position.set(BX, 2.9, -1.4); qs.add(tJoy);

// ---------- 5段目. フィルムとお金（x=170）。2018年の日本映画・製作費およそ300万円 ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1a1c22' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const COINS = []; for (let s = 0; s < 3; s++) for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20), new THREE.MeshStandardMaterial({ color: '#d8b860', metalness: 0.7, roughness: 0.3 })); c.position.set(FX - 0.9 + s * 0.9, 0.5 + i * 0.09, -0.6); c.userData.k = s * 8 + i; qs.add(c); COINS.push(c); }
const SMALL = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(180, 110, (g, w, h) => { g.fillStyle = '#0e0e10'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d4c8'; for (let x = 4; x < w; x += 16) { g.fillRect(x, 4, 8, 8); g.fillRect(x, h - 12, 8, 8); } g.fillStyle = '#3a4458'; g.fillRect(10, 20, w - 20, h - 40); g.fillStyle = '#e2483c'; g.beginPath(); g.arc(w / 2, h / 2, 16, 0, Math.PI * 2); g.fill(); }) })); SMALL.position.set(FX, 2.2, -1.2); qs.add(SMALL);
const tJP = tag('2018年 日本映画', { size: 70, w: 560, bg: '#e2483c', sx: 3.0 }); tJP.position.set(FX, 4.4, -1.2); qs.add(tJP);
const tBudget = tag('製作費 およそ300万円', { size: 60, w: 640, bg: '#14161c', sx: 3.2 }); tBudget.position.set(FX, 4.4, -1.2); qs.add(tBudget);

// ---------- 6段目. 光る映画館の地図（x=210）。2館から350館以上へ・REC 37分 ----------
const NX = 210;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshBasicMaterial({ color: '#14161c' })); bg.position.set(NX, 4, -4); qs.add(bg); }
const SCREENS = []; for (let i = 0; i < 48; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true })); const a = R() * Math.PI * 2, r = i < 2 ? 0.25 : 0.6 + R() * 2.6; s.position.set(NX + Math.cos(a) * r * 1.1, 2.3 + Math.sin(a) * r * 0.6, -3.9); s.userData.r = r; SCREENS.push(s); qs.add(s); }
const REC = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.7), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(260, 70, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(30, h / 2, 13, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.font = 'bold 34px monospace'; g.fillText('REC 37:00', 54, h / 2 + 12); }) })); REC.position.set(NX, 4.35, -3.0); qs.add(REC);
const tSpread = tag('2館から 口コミで350館以上', { size: 54, w: 760, bg: '#e6b450', color: '#14161c', sx: 5.0 }); tSpread.position.set(NX, 5.5, -3); qs.add(tSpread);
const tOne = tag('始まりの約37分は ワンカット', { size: 54, w: 760, bg: '#e2483c', sx: 5.0 }); tOne.position.set(NX, 5.5, -3); qs.add(tOne);

// ---------- 夜の建物の前の撮影隊（クイズ用 x=250） ----------
const QX = 250;
const BLD2 = BLD.clone(); BLD2.position.set(QX, 0, -9); qs.add(BLD2);
const MOON2 = MOON.clone(); MOON2.position.set(QX + 4, 12, -40); qs.add(MOON2);
const CREW = [DIR, CAMM, ACT].map((o, i) => { const p = makePerson(o); if (i === 0) capOn(p); p.position.set(QX - 0.9 + i * 0.9, 0, 0); p.rotation.y = Math.PI; qs.add(p); return p; });
const RIGQ = camRig(); RIGQ.position.set(QX + 0.0, 1.6, -0.25); RIGQ.rotation.y = Math.PI; qs.add(RIGQ);

// ---------- shots ----------
const ALL = [tShoot, tNG, tReal, tTake, tNight, tRumor, tZom, tJoy, tJP, tBudget, tSpread, tOne];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotRuin(t) { // 1段目 0〜9：山奥の廃墟で、映画の撮影中。なかなか、OKが出ない（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.9; S.darken(0.2, '#14161a');
  const shout = t > 4.6; dir1.userData.arms[1].rotation.x = shout ? -2.6 + 0.3 * Math.sin(t * 10) : -0.3; dir1.userData.arms[0].rotation.x = shout ? -1.6 : 0; dir1.userData.head.rotation.x = shout ? -0.2 : 0;
  act1.userData.arms.forEach(a => a.rotation.x = -0.5 - 0.2 * Math.sin(t * 3)); act1.userData.head.rotation.y = shout ? 0.5 : 0;
  cam1m.userData.arms.forEach(a => a.rotation.x = -1.5);
  RIG1.userData.red.visible = Math.floor(t * 2) % 2 === 0;
  const k = t < 4.4 ? 0 : Math.min(1, (t - 4.4) / 0.15); CLAP1.userData.top.rotation.z = k ? 0 : 0.5;
  tShoot.userData.pop(1); if (t > 4.6) tShoot.visible = false;
  tNG.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(-0.2, 0.0, u), lerp(2.0, 1.9, u), lerp(4.2, 3.5, u), 0.3, 1.4, -1.0, 60);
  return qs;
}
function shotDirector(t) { // 2段目 9〜17：監督は、本物の恐怖にこだわる男。テイクは、42回目
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.1; S.darken(0.2, '#14161a');
  dir2.userData.arms[1].rotation.x = -1.6; dir2.userData.head.rotation.x = -0.1 + 0.08 * Math.sin(t * 9);
  MEGA.position.set(KX - 0.3 + 0.32, 1.72, -1.2 + 0.42);
  CLAP2.visible = t > 4.0; const c = t > 4.2 && t < 4.5; CLAP2.userData.top.rotation.z = c ? 0.5 : 0; CLAP2.scale.setScalar(t > 4.0 ? 1.15 * ease(clamp((t - 4.0) / 0.3)) : 0.01);
  tReal.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tReal.visible = false;
  tTake.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(0.2, 0.4, u), lerp(1.9, 1.8, u), lerp(3.0, 2.4, u), KX + 0.2, 1.6, -1.2, 58);
  return qs;
}
function shotNightBld(t) { // 3段目 17〜25：舞台は、夜の古い建物。ここには、ある噂があった
  base(); S.aim(CX, -6); lift(-10); S.hemi.intensity = 0.45; S.key.intensity = 0.25; S.darken(0.75, '#0a0c14');
  FOG3.forEach((f, i) => { f.position.x = CX - 8 + i * 3.2 + Math.sin(t * 0.4 + i) * 1.2; });
  tNight.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tNight.visible = false;
  tRumor.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-1.0, 0.4, u), lerp(2.2, 2.6, u), lerp(9.0, 7.6, u), CX, 3.0, -8, 58);
  return qs;
}
function shotZombie(t) { // 4段目 25〜33：そこへ、本物のゾンビが現れた。監督は大喜びで、撮影を続ける
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 0.7; S.darken(0.45, '#0e1410');
  ZOMS.forEach((p, i) => { const z = p.userData.z0 + Math.min(t, 7) * 0.32; p.position.set(p.userData.x + Math.sin(t * 2 + i) * 0.08, 0, z); p.rotation.y = Math.sin(t * 2.5 + i) * 0.15; const ph = t * 4 + i; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.3; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.3; p.userData.head.rotation.z = 0.25 * Math.sin(t + i); });
  const run = ease(clamp((t - 1) / 3)); act4.position.set(BX - 1.2 - run * 2.4, 0, run * 1.4); act4.rotation.y = lerp(0, -Math.PI / 2 - 0.4, run); const ph = t * 10; act4.userData.legs[0].rotation.x = Math.sin(ph) * 0.7 * run; act4.userData.legs[1].rotation.x = -Math.sin(ph) * 0.7 * run; act4.userData.arms[0].rotation.x = -Math.sin(ph) * 0.6 * run; act4.userData.arms[1].rotation.x = Math.sin(ph) * 0.6 * run;
  dir4.userData.arms.forEach(a => a.rotation.x = -1.5); dir4.position.y = t > 4.2 ? Math.max(0, Math.sin(t * 8)) * 0.12 : 0;
  RIG4.position.set(BX + 1.5 - 0.2, 1.6, -0.2 - 0.3); RIG4.rotation.y = Math.PI + 0.6; RIG4.userData.red.visible = Math.floor(t * 2) % 2 === 0;
  tZom.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tZom.visible = false;
  tJoy.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0.0, u), lerp(1.9, 2.0, u), lerp(4.6, 3.9, u), BX + 0.2, 1.3, -1.6, 60);
  return qs;
}
function shotBudget(t) { // 5段目 33〜42：2018年に公開された、日本映画。製作費は、およそ300万円
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1;
  COINS.forEach(c => { const k = ease(clamp((t - 4.2 - c.userData.k * 0.05) / 0.25)); c.visible = k > 0.01; c.scale.setScalar(Math.max(0.01, k)); });
  SMALL.rotation.y = Math.sin(t * 0.8) * 0.2;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  tBudget.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.6, lerp(7.0, 6.2, u), FX, 2.4, -1.2, 56);
  return qs;
}
function shotSpread(t) { // 6段目 42〜49（決め手）：2館から始まって、口コミで350館以上へ。始まりの約37分は、ワンカット
  base(); S.aim(NX, -2); lift(-30); S.hemi.intensity = 0.8;
  SCREENS.forEach((s, i) => { const show = i < 2 ? 1 : ease(clamp((t - 0.6 - s.userData.r * 0.6) / 0.3)); s.visible = show > 0.01; s.scale.setScalar(Math.max(0.01, show)); s.material.opacity = 0.7 + 0.3 * Math.sin(t * 3 + i); });
  REC.visible = t > 3.4; REC.material.opacity = 1;
  tSpread.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tSpread.visible = false; tOne.userData.pop((t - 3.6) / 0.35);
  const u = ease(t / 7);
  look(NX, 2.9, lerp(7.6, 6.8, u), NX, 2.9, -3, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の建物の前の撮影隊）
  base(); S.aim(QX, -4); lift(-10); S.hemi.intensity = lerp(0.6, 0.25, ease(t)); S.darken(0.75, '#0a0c14');
  CREW.forEach((p, i) => { p.userData.head.rotation.x = -0.1; if (i === 1) p.userData.arms.forEach(a => a.rotation.x = -1.5); });
  RIGQ.userData.red.visible = Math.floor(t * 2) % 2 === 0;
  S.spot.color.set(0xffe8c8); S.spot.position.set(QX, 6, 3); S.spot.target.position.set(QX, 1, 0); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(QX + lerp(0.6, 0.3, k), lerp(1.8, 1.7, k), lerp(3.8, 3.2, k), QX, 1.6, -2, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotRuin },
  { a: 9, b: 17, f: shotDirector },
  { a: 17, b: 25, f: shotNightBld },
  { a: 25, b: 33, f: shotZombie },
  { a: 33, b: 42, f: shotBudget },
  { a: 42, b: 49, f: shotSpread },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '山奥の廃墟で、<br>映画の撮影中。'],
  [5.6, 9.0, 'なかなか、<br>OKが出ない。'],
  [9.2, 13.2, '監督は、本物の恐怖に<br>こだわる男。'],
  [13.2, 17.0, 'テイクは、<br>42回目。'],
  [17.2, 21.0, '舞台は、<br>夜の古い建物。'],
  [21.0, 25.0, 'ここには、<br>ある噂があった。'],
  [25.2, 29.0, 'そこへ、本物のゾンビが<br>現れた。'],
  [29.0, 33.0, '監督は大喜びで、<br>撮影を続ける。'],
  [33.2, 37.4, '2018年に公開された、<br>日本映画。'],
  [37.4, 41.8, '製作費は、<br>およそ300万円。'],
  [42.2, 45.4, '2館から始まって、<br>口コミで350館以上へ。'],
  [45.4, 49.0, '始まりの約37分は、<br>ワンカット。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、カメラを止めるな！'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q048', v2: true, answer: 'カメラを止めるな！',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 4848,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.6, 17.4, 21.4, 25.6, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'buzz'], [4.4, 'buzz'], [9.0, 'whoosh'], [13.4, 'bubble'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'カメラを止めるな！': 'カメラをとめるな', '山奥': 'やまおく', '廃墟': 'はいきょ', '撮影中': 'さつえいちゅう', '撮影を': 'さつえいを', 'OK': 'オーケー', '出ない': 'でない', '監督': 'かんとく', '本物の恐怖': 'ほんもののきょうふ', 'こだわる男': 'こだわるおとこ', 'テイク': 'テイク', '42回目': 'よんじゅうにかいめ', '舞台': 'ぶたい', '夜の古い建物': 'よるのふるいたてもの', '噂': 'うわさ', '本物のゾンビ': 'ほんもののゾンビ', '現れた': 'あらわれた', '大喜び': 'おおよろこび', '続ける': 'つづける', '2018年': 'にせんじゅうはちねん', '公開': 'こうかい', '日本映画': 'にほんえいが', '製作費': 'せいさくひ', '300万円': 'さんびゃくまんえん', '2館': 'にかん', '始まって': 'はじまって', '口コミ': 'くちコミ', '350館以上': 'さんびゃくごじゅっかんいじょう', '始まり': 'はじまり', '約37分': 'やくさんじゅうななふん', 'ワンカット': 'ワンカット', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n山奥の廃墟で、映画の撮影中。なかなか、OKが出ない。監督は、本物の恐怖にこだわる男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'U-NEXT', '邦画', 'ゾンビ映画'],
  },
});
applyQuizCards({ answer: 'カメラを<br>止めるな！', info: 'Hulu・U-NEXT｜日本映画・96分', answerSize: 116 });
