import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #066 プラダを着た悪魔（映画・アメリカ・2006年・109分。Disney+・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/puradawozhao-tae-mo で2026/11/10確認。Filmarks 4.1・レビュー427,858件 filmarks.com/movies/2151）
//   続編『プラダを着た悪魔2』が2026年5月1日に日米同時公開、Disney+ で見放題（JustWatch で確認）
// 確かめた事実（Filmarks の作品紹介・ja.wikipedia.org/wiki/プラダを着た悪魔。2026/11/10）：
//   ・ジャーナリストをめざして大都会（ニューヨーク）にやってきた主人公。おしゃれには興味がない（Filmarks）
//   ・世界中の女性が憧れる一流ファッション誌の、カリスマ編集長のアシスタントになる。何人もの犠牲者（辞めた人）を出してきたポスト（Filmarks・Wikipedia）
//   ・悪魔的にハイレベルな要求と、鳴り続けるケイタイ（Filmarks）。仕事の用事だけでなく私生活の用事まで押し付けられる（Wikipedia）
//   ・ハイブランドの服を着こなすようになり、アシスタントとして成長していく（Wikipedia）
//   ・2006年のアメリカ映画。原作は2003年の小説。20年ぶりの続編『プラダを着た悪魔2』が2026年5月1日に日米同時公開（Wikipedia）
// 構成（ヒント6段）：1 鳴りやまない電話と山のような用事、新人アシスタントが今日も街を走る → 2 ジャーナリストを目指して大都会へ、おしゃれに興味なし
//   → 3 世界中があこがれる一流ファッション誌、何人も辞めていった職場 → 4 上司はカリスマ編集長、要求は悪魔のようにハイレベル
//   → 5 2006年のアメリカ映画、20年ぶりの続編が2026年に公開 → 6 決め手：おしゃれに目覚めていく主人公、タイトルは悪魔と高級ブランドの名前
// 人物名・雑誌名・街の名前・ブランドの名前とロゴは出さない（6段目も名前そのものは言わない）。結末は言わない。
// 俳優の顔・ポスター・有名な場面の構図（青いセーターの場面・机にコートを投げる場面など）はなぞらない。人は汎用の3D

const S = quizStage({ bg: '#1c2230', floor: '#2a2e36', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(6666);

const ANDY0 = { skin: '#f4d3b5', hair: '#4a3020', shirt: '#8a7a5a', pants: '#5a5048', long: true, skirt: true };
const ANDY1 = { skin: '#f4d3b5', hair: '#4a3020', shirt: '#1a1a1e', pants: '#1a1a1e', long: true, skirt: true };
const BOSSW = { skin: '#f1d2b8', hair: '#e8e8ec', shirt: '#14141a', pants: '#14141a', long: false, skirt: true };
const CHIC = (i) => ({ skin: ['#f1c9a5', '#f5d3b5', '#e8b98f'][i % 3], hair: ['#1d1a19', '#e0c080', '#6b3a22'][i % 3], shirt: ['#e2483c', '#f4f0e8', '#3a7ad8', '#e6b450', '#2a2a2e'][i % 5], pants: ['#1a1a1e', '#f4f0e8', '#5a3a6a'][i % 3], long: i % 4 !== 3, skirt: i % 2 === 0 });

// ---------- 1段目. 朝の大通り（x=0）。コーヒーと電話を持って走る新人 ----------
{ const road = box(14, 0.04, 40, mat('#3a3c42')); road.position.set(-2.5, 0.02, -10); qs.add(road);
  const walk = box(5, 0.12, 40, mat('#8a8680')); walk.position.set(2.4, 0.06, -10); qs.add(walk);
  for (let i = 0; i < 10; i++) { const w = 3.4, h = 10 + R() * 12; const wt = windowTextures(600 + i, ['#8a7a6a', '#6a6e78', '#9a8a78'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(3.4, h, 4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.3 })); b.position.set(i % 2 ? 7 : -12, h / 2, 4 - Math.floor(i / 2) * 5); qs.add(b); }
  for (let i = 0; i < 4; i++) { const c = new THREE.Group(); const bd = box(1.8, 0.6, 3.8, mat('#f2c230')); bd.position.y = 0.55; c.add(bd); const tp = box(1.6, 0.5, 2.0, mat('#e8b820')); tp.position.y = 1.1; c.add(tp); const ws = box(1.5, 0.4, 0.05, mat('#2a3a48')); ws.position.set(0, 1.1, 1.0); c.add(ws); c.position.set(-1.5 - (i % 2) * 2.6, 0, -2 - i * 6); c.userData.z = c.position.z; qs.add(c); c.name = 'cab'; } }
const CABS = qs.children.filter(o => o.name === 'cab');
const andy1 = makePerson(ANDY0); qs.add(andy1);
const TRAY = new THREE.Group(); { const tr = box(0.4, 0.04, 0.3, mat('#c8a878')); TRAY.add(tr); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.18, 10), mat('#f4f0e8')); c.position.set(-0.1 + (i % 2) * 0.2, 0.11, -0.07 + Math.floor(i / 2) * 0.14); TRAY.add(c); } } qs.add(TRAY);
const PHONE = box(0.08, 0.15, 0.02, mat('#141418')); qs.add(PHONE);
const RING = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 24), new THREE.MeshBasicMaterial({ color: '#e2483c', transparent: true })); qs.add(RING);
const PEDS = []; for (let i = 0; i < 4; i++) { const p = makePerson(CHIC(i + 2)); p.position.set(3.2 + (i % 2) * 0.8, 0.1, -3 - i * 3); p.rotation.y = Math.PI; qs.add(p); PEDS.push(p); }
const tCall = tag('鳴りやまない電話', { size: 64, w: 580, bg: '#14161c', sx: 2.4 }); qs.add(tCall);
const tRun = tag('今日も、全力で走る', { size: 60, w: 620, bg: '#e2483c', sx: 2.5 }); qs.add(tRun);

// ---------- 2段目. 高層ビルを見上げる（x=40）。地味な服の新人 ----------
const AX = 40;
{ const gr = box(20, 0.06, 20, mat('#7a7670')); gr.position.set(AX, 0.03, -4); qs.add(gr);
  for (let i = 0; i < 5; i++) { const w = 4, h = 14 + R() * 12; const wt = windowTextures(700 + i, ['#5a6478', '#6a7284', '#7a6a5a'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.3 })); b.position.set(AX - 9 + i * 4.5, h / 2, -10); qs.add(b); } }
const andy2 = makePerson(ANDY0); andy2.position.set(AX, 0, 0); andy2.rotation.y = Math.PI; qs.add(andy2);
const BAG = box(0.5, 0.6, 0.25, mat('#5a4a3a')); BAG.position.set(AX + 0.5, 0.3, 0.1); qs.add(BAG);
const tJour = tag('記者になる夢', { size: 72, w: 500, bg: '#14161c', sx: 1.6 }); tJour.position.set(AX + 0.5, 2.3, -0.4); qs.add(tJour);
const tNoFash = tag('おしゃれに興味なし', { size: 62, w: 620, bg: '#8a7a5a', sx: 1.8 }); tNoFash.position.set(AX + 0.05, 2.3, -0.2); qs.add(tNoFash);

// ---------- 3段目. 白い編集部（x=80）。色とりどりの服のラック、雑誌の表紙の壁 ----------
const BX = 80;
{ const fl = box(16, 0.04, 12, mat('#e8e6e2')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(16, 6, 0.2, mat('#f6f4f0')); wl.position.set(BX, 3, -5); qs.add(wl);
  for (let i = 0; i < 12; i++) { const cv = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(90, 120, (g, w, h) => { g.fillStyle = ['#e2483c', '#2a2a2e', '#e6b450', '#3a7ad8', '#e85a8a', '#3f8f6b'][i % 6]; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(8, 8, w - 16, 14); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(w / 2, h * 0.62, 22, 34, 0, 0, Math.PI * 2); g.fill(); }) })); cv.position.set(BX - 5.5 + (i % 6) * 2.2, 2.0 + Math.floor(i / 6) * 1.5, -4.88); qs.add(cv); }
  for (const rx of [-4, 4]) { const bar = box(3, 0.05, 0.05, mat('#c8c8cc')); bar.position.set(BX + rx, 1.9, -2.2); qs.add(bar); for (const s of [-1.5, 1.5]) { const lg = box(0.05, 1.9, 0.05, mat('#c8c8cc')); lg.position.set(BX + rx + s, 0.95, -2.2); qs.add(lg); }
    for (let k = 0; k < 9; k++) { const c = box(0.06, 1.0, 0.5, mat(['#e2483c', '#2a2a2e', '#e6b450', '#3a7ad8', '#e85a8a', '#f4f0e8', '#8e6bbf'][(k + (rx > 0 ? 3 : 0)) % 7])); c.position.set(BX + rx - 1.3 + k * 0.32, 1.35, -2.2); qs.add(c); } } }
const STAFF3 = []; for (let i = 0; i < 5; i++) { const p = makePerson(CHIC(i)); p.position.set(BX - 3 + i * 1.5, 0, -0.6 - (i % 2) * 0.8); qs.add(p); STAFF3.push(p); }
const EMPTY = []; for (let i = 0; i < 3; i++) { const c = box(0.5, 0.9, 0.5, mat('#e8e4dc')); c.position.set(BX - 1.2 + i * 1.2, 0.45, 1.6); qs.add(c); const g = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.36), mat('#c8a878')); g.position.set(BX - 1.2 + i * 1.2, 0.96, 1.6); qs.add(g); EMPTY.push(c, g); }
const tMag = tag('一流ファッション誌', { size: 62, w: 620, bg: '#14161c', sx: 2.5 }); tMag.position.set(BX, 3.0, 0.5); qs.add(tMag);
const tQuit = tag('何人も、辞めていった', { size: 58, w: 660, bg: '#e2483c', sx: 2.0 }); tQuit.position.set(BX + 0.2, 2.2, 0.4); qs.add(tQuit);

// ---------- 4段目. ガラスの編集長室（x=120）。銀髪の編集長と、メモを取る新人 ----------
const CX = 120;
{ const fl = box(14, 0.04, 10, mat('#2a2a30')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshBasicMaterial({ color: '#c8d8e8' })); win.position.set(CX, 3, -4.4); qs.add(win);
  for (let i = 0; i < 6; i++) { const f = box(0.06, 6, 0.06, mat('#1a1a1e')); f.position.set(CX - 6 + i * 2.4, 3, -4.35); qs.add(f); }
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.1), new THREE.MeshPhongMaterial({ color: '#c8e0f0', transparent: true, opacity: 0.55, shininess: 120 })); desk.position.set(CX, 0.85, -2.2); qs.add(desk);
  for (const s of [-1.2, 1.2]) { const lg = box(0.05, 0.85, 1.0, mat('#c8c8cc')); lg.position.set(CX + s, 0.42, -2.2); qs.add(lg); }
  const fl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.3, 12), mat('#f4f0e8')); fl2.position.set(CX + 0.9, 1.03, -2.3); qs.add(fl2); }
const boss4 = makePerson(BOSSW); boss4.position.set(CX - 0.2, 0, -3.0); qs.add(boss4);
const andy4 = makePerson(ANDY0); andy4.position.set(CX + 1.3, 0, -0.6); andy4.rotation.y = Math.PI + 0.7; qs.add(andy4);
const NOTE = box(0.2, 0.26, 0.02, mat('#f4f0e8')); qs.add(NOTE);
const LIST = []; for (let i = 0; i < 5; i++) { const l = box(0.9, 0.08, 0.02, new THREE.MeshBasicMaterial({ color: '#f4f0e8' })); l.position.set(CX - 2.6, 1.6 + i * 0.3, -2.4); qs.add(l); LIST.push(l); }
const tBoss = tag('カリスマ編集長', { size: 66, w: 540, bg: '#14161c', sx: 2.2 }); tBoss.position.set(CX + 0.4, 3.0, -1.2); qs.add(tBoss);
const tDevil = tag('悪魔のような要求', { size: 62, w: 600, bg: '#e2483c', sx: 2.4 }); tDevil.position.set(CX + 0.4, 3.0, -1.2); qs.add(tDevil);

// ---------- 5段目. 映画館のスクリーン（x=160）。2006年のアメリカ映画、20年ぶりの続編 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: '#1a0e14' })); bg.position.set(TX, 4, -4); qs.add(bg);
  for (const s of [-1, 1]) { const cu = box(1.2, 5, 0.2, mat('#7a1a24')); cu.position.set(TX + s * 3.4, 2.9, -3.7); qs.add(cu); }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const st = box(0.6, 0.7, 0.6, mat('#5a1a22')); st.position.set(TX - 2.7 + i * 0.9, 0.35, 0.6 + r * 1.1); qs.add(st); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(560, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a2a40'); gr.addColorStop(1, '#141018'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 3; i++) { g.fillRect(150 + i * 100, 110, 60, 110); g.beginPath(); g.arc(180 + i * 100, 92, 22, 0, Math.PI * 2); g.fill(); } }) })); SCREEN.position.set(TX, 2.9, -3.6); qs.add(SCREEN);
const t2006 = tag('2006年 アメリカ映画', { size: 62, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.2 }); t2006.position.set(TX, 5.0, -2.8); qs.add(t2006);
const tSeq = tag('20年ぶりの続編も', { size: 64, w: 600, bg: '#e2483c', sx: 3.0 }); tSeq.position.set(TX, 5.0, -2.8); qs.add(tSeq);

// ---------- 6段目. 鏡の前で、地味な服から黒のスーツへ（x=200） ----------
const DX = 200;
{ const fl = box(12, 0.04, 10, mat('#1a1a20')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ color: '#141018' })); bk.position.set(DX, 3, -4); qs.add(bk);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.15, 40), mat('#e8e4dc')); ring.position.set(DX, 0.08, -1); qs.add(ring); }
const andy6 = makePerson(ANDY0); andy6.position.set(DX, 0.15, -1); qs.add(andy6);
const andy6M = []; andy6.traverse(o => { if (o.isMesh && !andy6M.includes(o.material)) andy6M.push(o.material); });
const FROM = { shirt: new THREE.Color(ANDY0.shirt), pants: new THREE.Color(ANDY0.pants) }, TO = { shirt: new THREE.Color('#14141a'), pants: new THREE.Color('#14141a') };
const torsoM = andy6M.find(m => m.color.getHexString() === new THREE.Color(ANDY0.shirt).getHexString());
const pantsM = andy6M.find(m => m.color.getHexString() === new THREE.Color(ANDY0.pants).getHexString());
const SPOT6 = new THREE.SpotLight(0xffffff, 0, 12, 0.5, 0.4, 1); SPOT6.position.set(DX, 6, 1); SPOT6.target.position.set(DX, 0.8, -1); qs.add(SPOT6); qs.add(SPOT6.target);
const BAG6 = new THREE.Group(); { const b = box(0.4, 0.3, 0.14, mat('#e2483c')); BAG6.add(b); const hd = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 16, Math.PI), mat('#1a1a1a')); hd.position.y = 0.15; BAG6.add(hd); } qs.add(BAG6);
const tWake = tag('おしゃれに目覚める', { size: 62, w: 620, bg: '#14161c', sx: 2.0 }); tWake.position.set(DX, 2.4, -0.6); qs.add(tWake);
const tTitle = tag('悪魔 × 高級ブランド', { size: 62, w: 640, bg: '#e2483c', sx: 2.1 }); tTitle.position.set(DX, 2.4, -0.6); qs.add(tTitle);

// ---------- shots ----------
const ALL = [tCall, tRun, tJour, tNoFash, tMag, tQuit, tBoss, tDevil, t2006, tSeq, tWake, tTitle];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPOT6.intensity = 0; }

function shotStreet(t, quiz = 0) { // 1段目 0〜9：鳴りやまない電話と山のような用事。新人アシスタントが今日も街を走る（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 1.2; S.darken(0.1, '#c8a080');
  const z = lerp(-6, 1.2, clamp(t / 9));
  andy1.position.set(2.0, 0.12, z); andy1.rotation.y = 0; poseWalk(andy1, t * 11, 1.3);
  andy1.userData.arms[0].rotation.x = -1.2; andy1.userData.arms[1].rotation.x = -2.6;
  TRAY.position.set(2.0 - 0.34, 1.05, z + 0.42); PHONE.position.set(2.0 + 0.32, 1.85, z + 0.05);
  const rg = (t * 2) % 1; RING.position.set(2.0 + 0.32, 1.85, z + 0.06); RING.scale.setScalar(0.6 + rg * 1.6); RING.material.opacity = 1 - rg;
  CABS.forEach((c, i) => { c.position.z = c.userData.z + t * (2 + i % 2); });
  PEDS.forEach((p, i) => { p.position.z = -3 - i * 3 + t * 0.8; poseWalk(p, t * 6 + i, 0.8); });
  if (!quiz) { tCall.userData.pop(1); if (t > 4.4) tCall.visible = false; tRun.userData.pop((t - 4.6) / 0.35); }
  tCall.position.set(2.0, 2.75, z); tRun.position.set(2.0, 2.75, z);
  look(2.6, 2.0, z + 4.6, 1.8, 1.3, z - 1.0, 56);
  return qs;
}
function shotArrive(t) { // 2段目 9〜17：ジャーナリストを目指して大都会へ。おしゃれには興味なし
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.2;
  andy2.userData.head.rotation.x = -0.35;
  if (t > 4.2) { andy2.rotation.y = lerp(Math.PI, 0.2, ease((t - 4.2) / 0.8)); andy2.userData.head.rotation.x = 0; }
  tJour.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJour.visible = false; tNoFash.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(AX + 0.6, lerp(0.8, 1.0, u), lerp(3.6, 3.2, u), AX, 6, -10, 62);
  else look(AX + 0.3, 1.6, lerp(4.0, 3.4, ease((t - 4.2) / 4)), AX, 1.3, 0, 56);
  return qs;
}
function shotEditorial(t) { // 3段目 17〜25：世界中があこがれる一流ファッション誌。何人も辞めていった職場
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.35; S.key.intensity = 1.3;
  STAFF3.forEach((p, i) => { p.rotation.y = Math.sin(t * 0.8 + i) * 0.5; poseWalk(p, t * 4 + i, t < 4 ? 0.4 : 0); });
  EMPTY.forEach(o => { o.visible = t > 4.2; });
  tMag.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMag.visible = false; tQuit.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(BX + lerp(-1.0, 0.0, u), 2.6, lerp(7.5, 7.0, u), BX, 1.6, -2.5, 58);
  else look(BX + 0.2, 2.4, lerp(6.0, 5.4, ease((t - 4.2) / 4)), BX, 1.0, 0.8, 56);
  return qs;
}
function shotBoss(t) { // 4段目 25〜33：上司はカリスマ編集長。要求は悪魔のようにハイレベル
  base(); S.aim(CX, -1); lift(0); S.hemi.intensity = 1.1; S.darken(0.2, '#0a0c12');
  boss4.userData.arms[1].rotation.x = t > 4.2 ? -1.4 - Math.sin(t * 5) * 0.15 : -0.2;
  andy4.userData.arms[0].rotation.x = -1.1; andy4.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 9) * 0.1;
  NOTE.position.set(CX + 1.15, 1.15, -0.25); NOTE.rotation.y = andy4.rotation.y;
  LIST.forEach((l, i) => { const k = ease(clamp((t - 4.4 - i * 0.35) / 0.3)); l.scale.x = Math.max(1e-3, k); l.visible = k > 0.01; });
  tBoss.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBoss.visible = false; tDevil.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(2.0, 1.6, u), lerp(2.2, 2.1, u), lerp(4.4, 3.8, u), CX - 0.2, 1.4, -2.0, 58);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2006年のアメリカ映画。20年ぶりの続編が2026年に公開
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.4, '#06070a');
  t2006.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2006.visible = false; tSeq.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.6, 2.8, u), lerp(6.4, 5.6, u), TX, 3.2, -3.6, 58);
  return qs;
}
function shotChange(t) { // 6段目 42〜49（決め手）：おしゃれに目覚めていく主人公。タイトルには、悪魔と高級ブランドの名前
  base(); S.aim(DX, -1); lift(220); S.hemi.intensity = 0.7; S.darken(0.5, '#06070a');
  SPOT6.intensity = 60;
  const k = ease(clamp((t - 1.2) / 1.2));
  if (torsoM) torsoM.color.copy(FROM.shirt).lerp(TO.shirt, k); if (pantsM) pantsM.color.copy(FROM.pants).lerp(TO.pants, k);
  andy6.rotation.y = t < 2.6 ? t * 2.6 : lerp(2.6 * 2.6, Math.PI * 2, ease((t - 2.6) / 0.6));
  BAG6.visible = t > 2.4; andy6.userData.arms[1].rotation.x = t > 2.4 ? -0.3 : 0; BAG6.position.set(DX + 0.42 * Math.cos(andy6.rotation.y), 0.95, -1 - 0.42 * Math.sin(andy6.rotation.y));
  tWake.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tWake.visible = false; tTitle.userData.pop((t - 3.4) / 0.3);
  const u = ease(t / 7);
  look(DX, lerp(1.9, 1.8, u), lerp(4.4, 3.6, u), DX, 1.5, -1, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夕方の大通り。走る新人にだけ光）
  shotStreet(6.0 + t * 0.15, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.2, 0.4, d); S.key.intensity = lerp(1.5, 0.6, d); S.darken(lerp(0.1, 0.5, d), '#1a1020');
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStreet(t, 0) },
  { a: 9, b: 17, f: shotArrive },
  { a: 17, b: 25, f: shotEditorial },
  { a: 25, b: 33, f: shotBoss },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotChange },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '鳴りやまない電話。<br>山のような用事。'],
  [5.6, 9.0, '新人アシスタントは、<br>今日も街を走る。'],
  [9.2, 13.2, '主人公は、記者を目指して<br>大都会にやってきた。'],
  [13.2, 17.0, 'でも、おしゃれには<br>まったく興味がない。'],
  [17.2, 21.0, '職場は、世界中があこがれる<br>一流のファッション誌。'],
  [21.0, 25.0, 'この仕事を、何人もの<br>新人が辞めていった。'],
  [25.2, 29.0, '上司は、業界で絶大な力を持つ<br>カリスマ編集長。'],
  [29.0, 33.0, 'その要求は、悪魔のように<br>レベルが高い。'],
  [33.2, 37.4, '2006年の<br>アメリカ映画。'],
  [37.4, 41.8, '20年ぶりの続編が、<br>2026年に公開された。'],
  [42.2, 45.4, '仕事を通して、<br>おしゃれに目覚めていく。'],
  [45.4, 49.0, 'タイトルには、悪魔と<br>高級ブランドの名前。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>プラダを着た悪魔。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q066', v2: true, answer: 'プラダを着た悪魔',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 6666,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '鳴りやまない': 'なりやまない', '電話': 'でんわ', '山のような': 'やまのような', '用事': 'ようじ', '新人': 'しんじん', '今日も': 'きょうも', '街を走る': 'まちをはしる', '主人公': 'しゅじんこう', '記者': 'きしゃ', '目指して': 'めざして', '大都会': 'だいとかい', '興味': 'きょうみ', '職場': 'しょくば', '世界中': 'せかいじゅう', '一流': 'いちりゅう', 'ファッション誌': 'ファッションし', '仕事': 'しごと', '何人もの': 'なんにんもの', '辞めて': 'やめて', '上司': 'じょうし', '業界': 'ぎょうかい', '絶大な力': 'ぜつだいなちから', '持つ': 'もつ', '編集長': 'へんしゅうちょう', '要求': 'ようきゅう', '悪魔': 'あくま', '2006年': 'にせんろくねん', 'アメリカ映画': 'アメリカえいが', '20年ぶり': 'にじゅうねんぶり', '続編': 'ぞくへん', '2026年': 'にせんにじゅうろくねん', '公開': 'こうかい', '通して': 'とおして', '目覚めて': 'めざめて', '高級': 'こうきゅう', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '着た': 'きた', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n鳴りやまない電話。山のような用事。新人アシスタントは、今日も街を走る。主人公は、記者を目指して大都会にやってきた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'Hulu', '映画好き', 'お仕事映画'],
  },
});
applyQuizCards({ answer: 'プラダを<br>着た悪魔', info: 'Disney+・Hulu｜映画・109分', answerSize: 120 });
