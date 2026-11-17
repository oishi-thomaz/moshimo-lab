import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #100 フォレスト・ガンプ／一期一会（映画・アメリカ・1994年・142分。Netflix・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/huoresutoganpu-qi-hui（Netflix・Hulu・U-NEXT・Prime Video）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・Hulu・Netflix 見放題）で2026/11/17確認。Filmarks 4.1・レビュー268,396件 filmarks.com/movies/31778）
// 確かめた事実（映画.com eiga.com/movie/48663 の解説。2026/11/17）：
//   ・誰にも負けない俊足と清らかな心をもった男の数奇な人生を、アメリカ現代史と重ねて描くヒューマンドラマ
//   ・幼なじみの女性と小学校で出会う。俊足を買われ、大学でアメフトのスター選手として活躍する
//   ・軍隊で戦争に従軍し、仲間を救って勲章を受ける。除隊後はエビ漁を始めて成功する。幼なじみとは再会と別れを繰り返す
//   ・1994年のアメリカ映画。監督ロバート・ゼメキス。第67回アカデミー賞で作品賞など6部門を受賞
// 構成（ヒント6段）：1 人より少しゆっくりな少年・でも走れば誰より速い → 2 人を疑わないまっすぐな心・大学ではアメフトのスター
//   → 3 戦場へ送られる・仲間を救って勲章 → 4 小学校で出会った幼なじみ・再会と別れをくり返す
//   → 5 1994年のアメリカ映画・アカデミー賞 作品賞など6部門 → 6 決め手：エビ漁で大成功・アメリカの歴史と重なる人生
// 幼なじみとのその後・結末は言わない。人物名・国名（5段目まで）・地名は出さない。俳優の顔・ポスター・ロゴ・劇中の有名な場面
// （ベンチとお菓子の箱・羽根・足の装具がはずれる場面・大陸横断のランニング）は使わない。人は汎用の3D
const S = quizStage({ bg: '#9ac0e0', floor: '#5a7a4a', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(10010);

const HERO_KID = { skin: '#f1c9a5', hair: '#6a4a2a', shirt: '#4a7ad8', pants: '#3a3a40', scale: 0.7 };
const HERO = { skin: '#f1c9a5', hair: '#6a4a2a', shirt: '#4a7ad8', pants: '#3a3a40' };
const GIRL_KID = { skin: '#f4d3b5', hair: '#c8a050', shirt: '#e8e4dc', pants: '#c8505a', long: true, skirt: true, scale: 0.68 };
const GIRL = { skin: '#f4d3b5', hair: '#c8a050', shirt: '#e8e4dc', pants: '#c8505a', long: true, skirt: true };
const KIDS = ['#c8505a', '#2e8a4a', '#e6b450', '#8e5bd0'].map(c => ({ skin: '#f1c9a5', hair: '#2c2421', shirt: c, pants: '#3a3a40', scale: 0.7 }));
function gl(c) { return new THREE.MeshBasicMaterial({ color: c }); }

// ---------- 1段目. 学校の校庭のトラック（x=0）。5人で走る。青い服の子だけ、ぐんぐん前へ ----------
{ const tr = box(10, 0.04, 40, mat('#c8704a')); tr.position.set(0, 0.03, -14); qs.add(tr);
  for (let i = 0; i < 6; i++) { const l = box(0.06, 0.02, 40, gl('#f4f0e6')); l.position.set(-3 + i * 1.2, 0.06, -14); qs.add(l); }
  const fin = box(7.2, 0.02, 0.3, gl('#f4f0e6')); fin.position.set(-0.0, 0.07, -26); qs.add(fin);
  const sc = box(14, 5, 4, mat('#e8dcc8')); sc.position.set(-12, 2.5, -24); qs.add(sc);
  for (let i = 0; i < 8; i++) { const w = box(1.0, 1.0, 0.05, gl('#9ac0e0')); w.position.set(-17.5 + i * 1.6, 3.2, -21.97); qs.add(w); }
  for (let i = 0; i < 6; i++) { const t = new THREE.Group(); const tk = box(0.3, 2.4, 0.3, mat('#5a3a1a')); tk.position.y = 1.2; t.add(tk); const c = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), mat('#3a7a3a')); c.position.y = 3.0; t.add(c); t.position.set(7 + (i % 2) * 2, 0, -4 - i * 5); qs.add(t); } }
const RUN1 = [HERO_KID, ...KIDS].map((c, i) => { const p = makePerson(c); p.position.set([0, -2.4, -1.2, 1.2, 2.4][i], 0, 0); p.rotation.y = Math.PI; qs.add(p); return p; });
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.6 }); qs.add(Q1);
const tSlow = tag('人より少し、ゆっくりな少年', { size: 52, w: 760, bg: '#14161c', sx: 2.6 }); qs.add(tSlow);
const tFast = tag('でも、走れば誰より速い', { size: 54, w: 700, bg: '#2a6ab0', sx: 2.6 }); qs.add(tFast);

// ---------- 2段目. 夜のスタジアム（x=60）。ボールを抱えて走る青いユニフォーム ----------
const AX = 60;
{ const fl = box(30, 0.04, 40, mat('#3a8a3a')); fl.position.set(AX, 0.02, -10); qs.add(fl);
  for (let i = 0; i < 8; i++) { const l = box(30, 0.02, 0.12, gl('#f4f0e6')); l.position.set(AX, 0.05, 6 - i * 5); qs.add(l); }
  for (const s of [-1, 1]) { const st = box(4, 8, 40, mat('#4a4e58')); st.position.set(AX + s * 17, 4, -10); qs.add(st);
    for (let i = 0; i < 60; i++) { const d = box(0.3, 0.3, 0.3, mat(['#c8505a', '#4a7ad8', '#e6b450', '#f4f0e6'][i % 4])); d.position.set(AX + s * (15.3 + (i % 3) * 0.6), 2.5 + (i % 3) * 1.6, -28 + Math.floor(i / 3) * 1.9); qs.add(d); } }
  for (const s of [-1, 1]) { const lt = box(3, 1.2, 0.3, gl('#fff8e0')); lt.position.set(AX + s * 12, 14, -24); qs.add(lt); } }
const hero2 = makePerson({ ...HERO, shirt: '#2a5ac8', pants: '#e8e4dc' }); hero2.position.set(AX, 0, 0); qs.add(hero2);
const BALL2 = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), mat('#7a4a2a')); BALL2.scale.set(1, 0.65, 0.65); qs.add(BALL2);
const DEF2 = [0, 1, 2].map(i => { const p = makePerson({ skin: '#d9a57c', hair: '#1a1410', shirt: '#c8202c', pants: '#e8e4dc' }); p.position.set(AX, 0, -4); qs.add(p); return p; });
const tPure = tag('人を疑わない、まっすぐな心', { size: 52, w: 760, bg: '#14161c', sx: 2.6 }); qs.add(tPure);
const tStar = tag('大学では、アメフトのスター', { size: 52, w: 760, bg: '#2a6ab0', sx: 2.6 }); qs.add(tStar);

// ---------- 3段目. 雨のジャングル（x=120）。仲間を背負って走る。胸に光る勲章 ----------
const BX = 120;
{ const fl = box(30, 0.04, 30, mat('#3a4a2a')); fl.position.set(BX, 0.02, -8); qs.add(fl);
  for (let i = 0; i < 40; i++) { const x = BX + (R() - 0.5) * 22, z = -2 - R() * 20; if (Math.abs(x - BX) < 2.2 && z > -14) continue; const t = new THREE.Group(); const tk = box(0.25, 3 + R() * 2, 0.25, mat('#4a3a2a')); tk.position.y = 1.8; t.add(tk); for (let k = 0; k < 4; k++) { const lf = box(1.8, 0.06, 0.5, mat('#2e6a3a')); lf.position.set(0, 3.6 + R(), 0); lf.rotation.y = k * 0.8; lf.rotation.z = 0.3; t.add(lf); } t.position.set(x, 0, z); qs.add(t); } }
const RAIN3 = []; for (let i = 0; i < 80; i++) { const r = box(0.02, 0.5, 0.02, gl('#c8d8e8')); r.userData.o = [R() * 10 - 5, R() * 8, -R() * 10]; qs.add(r); RAIN3.push(r); }
const hero3 = makePerson({ ...HERO, shirt: '#5a6a3a', pants: '#4a5a32' }); hero3.position.set(BX, 0, -6); qs.add(hero3);
const buddy3 = makePerson({ skin: '#8a5a3a', hair: '#1a1410', shirt: '#5a6a3a', pants: '#4a5a32' }); buddy3.position.set(BX, 2, -6); qs.add(buddy3);
const MEDAL3 = new THREE.Group(); { const rb = box(0.5, 0.6, 0.04, mat('#2a5ac8')); rb.position.y = 0.4; MEDAL3.add(rb); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 20), new THREE.MeshStandardMaterial({ color: '#e6c050', metalness: 0.7, roughness: 0.3, emissive: '#5a4010' })); m.rotation.x = Math.PI / 2; MEDAL3.add(m); } MEDAL3.position.set(BX, 1, -6); qs.add(MEDAL3);
const tWar = tag('戦場へ、送られる', { size: 60, w: 540, bg: '#14161c', sx: 2.2 }); qs.add(tWar);
const tSave = tag('仲間を救って、勲章', { size: 58, w: 620, bg: '#c8902c', sx: 2.2 }); qs.add(tSave);

// ---------- 4段目. 大きな木の下（x=180）。子どもの2人が、大人の2人になる。近づいては離れる ----------
const CX = 180;
{ const fl = box(30, 0.04, 30, mat('#7a9a4a')); fl.position.set(CX, 0.02, -8); qs.add(fl);
  const tk = box(0.9, 4.6, 0.9, mat('#5a3a1a')); tk.position.set(CX - 2.6, 2.3, -5); qs.add(tk);
  for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8), mat('#4a8a3a')); c.position.set(CX - 2.6 + (k % 3 - 1) * 1.5, 5.0 + Math.floor(k / 3) * 1.0, -5 + (k % 2 - 0.5)); qs.add(c); }
  for (let i = 0; i < 20; i++) { const f = box(0.2, 0.3, 0.2, mat(['#e6b450', '#f4f0e6', '#c8505a'][i % 3])); f.position.set(CX - 6 + R() * 12, 0.15, -1 - R() * 10); qs.add(f); } }
const boy4 = makePerson(HERO_KID); const girl4 = makePerson(GIRL_KID); const man4 = makePerson(HERO); const wom4 = makePerson(GIRL);
[boy4, girl4, man4, wom4].forEach(p => { p.position.set(CX, 0, -3.4); qs.add(p); });
const tFriend = tag('小学校で出会った、幼なじみ', { size: 52, w: 760, bg: '#14161c', sx: 2.4 }); qs.add(tFriend);
const tApart = tag('再会と別れを、くり返す', { size: 56, w: 700, bg: '#c8507a', sx: 2.4 }); qs.add(tApart);

// ---------- 5段目. 映画館（x=240）。1994年・アメリカ映画。アカデミー賞 ----------
const TX = 240;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8ac0e8'); gr.addColorStop(1, '#e8f0f4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#6a9a4a'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = '#c8b890'; g.beginPath(); g.moveTo(w * 0.45, h); g.lineTo(w * 0.55, h); g.lineTo(w * 0.51, h * 0.7); g.lineTo(w * 0.49, h * 0.7); g.fill(); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const TROPHY5 = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const b = box(0.3, 0.12, 0.3, mat('#2a2a30')); g.add(b); const s = box(0.1, 0.6, 0.1, new THREE.MeshStandardMaterial({ color: '#e6c050', metalness: 0.7, roughness: 0.3, emissive: '#5a4010' })); s.position.y = 0.36; g.add(s); const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), s.material); h.position.y = 0.74; g.add(h); g.position.set(TX - 2.5 + i * 1.0, 1.15, -4.5); qs.add(g); TROPHY5.push(g); }
{ const sh = box(6.6, 0.12, 0.6, mat('#5a3a2a')); sh.position.set(TX, 1.05, -4.5); qs.add(sh); }
const t1994 = tag('1994年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 4.0 }); t1994.position.set(TX, 6.0, -4.4); qs.add(t1994);
const tOscar = tag('アカデミー賞、作品賞など6部門', { size: 50, w: 840, bg: '#c8202c', sx: 4.4 }); tOscar.position.set(TX, 6.0, -4.4); qs.add(tOscar);

// ---------- 6段目. 港とエビ漁の船（x=300）。網いっぱいのエビ ----------
const DX = 300;
{ const sea = box(40, 0.04, 40, mat('#2a6a9a')); sea.position.set(DX, 0.0, -10); qs.add(sea);
  const pier = box(4, 0.4, 16, mat('#8a6a4a')); pier.position.set(DX - 4.5, 0.4, -2); qs.add(pier);
  const sky = box(60, 0.1, 0.1, gl('#ffffff')); sky.visible = false; qs.add(sky); }
const BOAT6 = new THREE.Group();
{ const hull = box(3.2, 1.0, 7, mat('#f4f0e6')); hull.position.y = 0.5; BOAT6.add(hull); const st = box(3.25, 0.2, 7.05, mat('#c8202c')); st.position.y = 0.95; BOAT6.add(st);
  const cab = box(2.0, 1.4, 1.8, mat('#e8e4dc')); cab.position.set(0, 1.7, -2.2); BOAT6.add(cab); const win = box(1.6, 0.5, 0.05, gl('#9ac0e0')); win.position.set(0, 2.0, -1.28); BOAT6.add(win);
  const mast = box(0.12, 4, 0.12, mat('#9a9ea8')); mast.position.set(0, 3, -0.5); BOAT6.add(mast);
  for (const s of [-1, 1]) { const boom = box(3.4, 0.08, 0.08, mat('#9a9ea8')); boom.position.set(s * 1.6, 3.4, -0.5); boom.rotation.z = s * -0.5; BOAT6.add(boom); } }
BOAT6.position.set(DX, 0, -3); qs.add(BOAT6);
const SHRIMP6 = []; for (let i = 0; i < 46; i++) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 6, 10, Math.PI * 1.3), mat(i % 3 ? '#f08a5a' : '#e8705a')); s.userData.o = [R() * 1.6 - 0.8, R() * 0.8, R() * 1.6 - 0.8]; s.rotation.set(R() * 3, R() * 3, R() * 3); qs.add(s); SHRIMP6.push(s); }
const hero6 = makePerson({ ...HERO, shirt: '#e8e4dc', pants: '#3a3a40' }); hero6.position.set(DX, 1, -3); qs.add(hero6);
const tShrimp = tag('エビ漁で、大成功', { size: 60, w: 560, bg: '#e8705a', sx: 2.6 }); qs.add(tShrimp);
const tHist = tag('アメリカの歴史と、重なる人生', { size: 50, w: 800, bg: '#2a6ab0', sx: 3.2 }); qs.add(tHist);

// ---------- shots ----------
const ALL = [tSlow, tFast, tPure, tStar, tWar, tSave, tFriend, tApart, t1994, tOscar, tShrimp, tHist, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); RAIN3.forEach(r => r.visible = false); }

function shotTrack(t, quiz = 0) { // 1段目 0〜9：人より少し、ゆっくりな少年。でも、走れば誰より速い（0秒目がサムネ）
  base(); S.aim(0, -8); lift(0);
  const go = quiz ? 3.0 : clamp(t - 0.6);
  RUN1.forEach((p, i) => { const sp = i === 0 ? (t < 3.5 ? 1.5 : 1.5 + (t - 3.5) * 1.6) : 2.2 - i * 0.12; const d = quiz ? (i === 0 ? 7.5 : 4.0) : (i === 0 ? (t < 3.5 ? t * 1.2 : 4.2 + (t - 3.5) * 3.4) : t * (1.25 - i * 0.03)); p.position.z = -Math.min(d * (go > 0 ? 1 : 0), 24); poseWalk(p, t * (i === 0 && t > 3.5 ? 16 : 11) + i, go > 0 ? 1 : 0); });
  const lead = RUN1[0].position.z;
  Q1.position.set(RUN1[0].position.x + 0.5, 1.75, lead); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  tSlow.position.set(0, 2.55, lead + 0.6); tFast.position.set(0, 2.55, lead + 0.6);
  if (!quiz) { tSlow.userData.pop((t - 2.0) / 0.35); if (t > 4.6) tSlow.visible = false; tFast.userData.pop((t - 4.8) / 0.35); }
  look(0.9, 2.1, lead - 4.6, 0, 1.0, lead + 1.5, 62);
  return qs;
}
function shotField(t) { // 2段目 9〜17：人を疑わない、まっすぐな心。大学では、アメフトのスター選手に
  base(); S.aim(AX, -6); lift(0); S.hemi.intensity = 0.8; S.scene.background.set('#1a2236'); S.scene.fog.color.set('#1a2236');
  const z = 4 - t * 3.0;
  hero2.position.set(AX, 0, z); hero2.rotation.y = Math.PI; poseWalk(hero2, t * 14, 1); hero2.userData.arms[0].rotation.x = -1.4;
  BALL2.position.set(AX - 0.38, 1.05, z - 0.25);
  DEF2.forEach((p, i) => { const s = i - 1; p.position.set(AX + s * (1.7 + clamp(t - 1) * 0.5), 0, z - 3.2 + i * 0.6); p.rotation.y = s * 0.8; poseWalk(p, t * 12 + i, 1); });
  tPure.position.set(AX, 2.8, z - 0.6); tStar.position.set(AX, 2.8, z - 0.6);
  tPure.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tPure.visible = false; tStar.userData.pop((t - 4.3) / 0.35);
  look(AX + 2.0, 3.0, z + 5.4, AX, 1.2, z - 2.0, 62);
  return qs;
}
function shotJungle(t) { // 3段目 17〜25：やがて、戦場へ送られる。仲間を背負って走り、勲章をもらう
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.7; S.scene.background.set('#5a6a6a'); S.scene.fog.color.set('#5a6a6a');
  const z = -6 + t * 0.9;
  hero3.position.set(BX, 0, z); hero3.rotation.y = 0; poseWalk(hero3, t * 11, 1); hero3.userData.arms.forEach(a => { a.rotation.x = 0; a.rotation.z = 0; }); hero3.userData.arms[0].rotation.z = -2.6; hero3.userData.arms[1].rotation.z = 2.6;
  buddy3.position.set(BX + 0.95, 1.78, z - 0.05); buddy3.rotation.set(0, 0, Math.PI / 2);
  RAIN3.forEach(r => { r.visible = true; const [ox, oy, oz] = r.userData.o; r.position.set(BX + ox, 8 - ((oy + t * 9) % 8), z + oz + 2); });
  MEDAL3.visible = t > 4.4; MEDAL3.position.set(BX + 0.12, 1.25, z + 0.17); MEDAL3.scale.setScalar(0.3 * ease(clamp((t - 4.4) / 0.4)));
  tWar.position.set(BX, 3.2, z - 0.4); tSave.position.set(BX - 0.4, 3.2, z - 0.4);
  tWar.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWar.visible = false; tSave.userData.pop((t - 4.2) / 0.35);
  look(BX + 1.4, 2.4, z + 4.4, BX, 1.6, z, 62);
  return qs;
}
function shotTree(t) { // 4段目 25〜33：小学校で出会った、幼なじみ。大人になっても、再会と別れをくり返す
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.1;
  const kid = t < 4;
  [boy4, girl4].forEach(p => p.visible = kid); [man4, wom4].forEach(p => p.visible = !kid);
  if (kid) { boy4.position.set(CX - 0.5, 0, -3.4); girl4.position.set(CX + 0.4, 0, -3.4); boy4.rotation.y = 0.5; girl4.rotation.y = -0.5; boy4.userData.head.rotation.y = 0.3; }
  else { const u = (t - 4) / 4; const gap = 0.5 + Math.abs(Math.sin(u * Math.PI * 2)) * 2.2; man4.position.set(CX - gap / 2, 0, -3.4); wom4.position.set(CX + gap / 2, 0, -3.4); man4.rotation.y = 0.6; wom4.rotation.y = -0.6 + (gap > 1.5 ? Math.PI * 0.7 : 0); }
  tFriend.position.set(CX, kid ? 2.0 : 3.0, -3.4); tApart.position.set(CX, 3.0, -3.4);
  tFriend.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFriend.visible = false; tApart.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.4, 0.4, u), lerp(1.6, 2.2, u), lerp(2.6, 3.8, u), CX, 1.2, -3.4, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1994年の、アメリカ映画。アカデミー賞で、作品賞など6部門
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  TROPHY5.forEach((g, i) => { g.visible = t > 4.3 + i * 0.25; });
  t1994.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1994.visible = false; tOscar.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.4, 5.4, u), TX, 3.6, -4.8, 64);
  return qs;
}
function shotBoat(t) { // 6段目 42〜49（決め手）：エビ漁で、大成功。アメリカの歴史と重なる、ひとりの男の人生
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.1; S.scene.background.set('#f0c890'); S.scene.fog.color.set('#f0c890');
  BOAT6.position.y = Math.sin(t * 1.6) * 0.06; BOAT6.rotation.z = Math.sin(t * 1.3) * 0.03;
  hero6.position.set(DX + 0.7, 1.05 + BOAT6.position.y, -2.0); hero6.rotation.y = 0.3; hero6.userData.arms.forEach(a => a.rotation.x = -0.8 - Math.sin(t * 3) * 0.2);
  const k = ease(clamp((t - 0.3) / 1.6));
  SHRIMP6.forEach(s => { const [ox, oy, oz] = s.userData.o; s.position.set(DX - 0.5 + ox * 0.9, 1.1 + oy * k + BOAT6.position.y, -1.6 + oz * 0.8); s.visible = k > 0.05; });
  tShrimp.position.set(DX, 3.0, -2.6); tHist.position.set(DX, 3.0, -2.6);
  if (t < 3.6) tShrimp.userData.pop((t - 0.3) / 0.35); else tHist.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(2.0, 1.2, u), lerp(3.4, 3.0, u), lerp(4.4, 3.6, u), DX, 1.6, -2.2, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（校庭に戻る）
  shotTrack(6.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotTrack(t, 0) },
  { a: 9, b: 17, f: shotField },
  { a: 17, b: 25, f: shotJungle },
  { a: 25, b: 33, f: shotTree },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotBoat },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '人より少し、<br>ゆっくりな少年。'],
  [5.6, 9.0, 'でも、走れば<br>誰より速い。'],
  [9.2, 13.2, '人を疑わない、<br>まっすぐな心。'],
  [13.2, 17.0, '大学では、<br>アメフトのスター選手に。'],
  [17.2, 21.0, 'やがて、<br>戦場へ送られる。'],
  [21.0, 25.0, '仲間を背負って走り、<br>勲章をもらう。'],
  [25.2, 29.0, '小学校で出会った、<br>幼なじみ。'],
  [29.0, 33.0, '大人になっても、<br>再会と別れをくり返す。'],
  [33.2, 37.4, '1994年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>作品賞など6部門。'],
  [42.2, 45.4, 'エビ漁で、<br>大成功。'],
  [45.4, 49.0, 'アメリカの歴史と重なる、<br>ひとりの男の人生。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>フォレスト・ガンプ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q100', v2: true, answer: 'フォレスト・ガンプ／一期一会',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 10010,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '人より': 'ひとより', '少し': 'すこし', '少年': 'しょうねん', '走れば': 'はしれば', '誰より': 'だれより', '速い': 'はやい', '人を': 'ひとを', '疑わない': 'うたがわない', '心': 'こころ', '大学': 'だいがく', '選手': 'せんしゅ', '戦場': 'せんじょう', '送られる': 'おくられる', '仲間': 'なかま', '背負って': 'せおって', '走り': 'はしり', '勲章': 'くんしょう', '小学校': 'しょうがっこう', '出会った': 'であった', '幼なじみ': 'おさななじみ', '大人': 'おとな', '再会': 'さいかい', '別れ': 'わかれ', '1994年': 'せんきゅうひゃくきゅうじゅうよねん', '映画': 'えいが', '賞': 'しょう', '作品賞': 'さくひんしょう', '6部門': 'ろくぶもん', '漁': 'りょう', '大成功': 'だいせいこう', '歴史': 'れきし', '重なる': 'かさなる', '男': 'おとこ', '人生': 'じんせい', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n人より少し、ゆっくりな少年。でも、走れば誰より速い。人を疑わない、まっすぐな心の持ち主。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Hulu', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'フォレスト・ガンプ<br>／一期一会', info: 'Netflix・Hulu｜映画・142分', answerSize: 92 });
