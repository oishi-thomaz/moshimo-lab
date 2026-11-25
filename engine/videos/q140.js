import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #140 ダークナイト（映画・アメリカ・2008年製作・152分。Prime Video・U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/dakunaito（見放題：Prime Video・U-NEXT・Hulu・Netflix）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・Hulu・Netflix 見放題）で2026/11/25確認。
//   Filmarks 4.2・レビュー219,171件 filmarks.com/movies/33832）
// 確かめた事実（2026/11/25）：
//   ・映画.com eiga.com/movie/53214 ：2008年製作／152分／アメリカ。DCコミックスの人気ヒーロー、バットマンの誕生を描いた「バットマン ビギンズ」の続編。
//     ゴッサム・シティに現れた史上最悪の犯罪者ジョーカー。バットマン＝ブルース・ウェインは、協力するゴードン警部補や新任地方検事ハービー・デントらとともに立ち向かう。
//     全世界興収も10億ドルの大ヒット。ジョーカーを演じたヒース・レジャーはアカデミー助演男優賞を受賞
//   ・JustWatch 日本版の紹介文：悪のはびこる街を舞台に、警部補や地方検事の協力のもと、バットマンは犯罪撲滅の成果を上げつつあった。
//     だが、ジョーカーと名乗る謎の犯罪者の台頭により、街は再び混乱と狂気に包まれていく
// 構成（ヒント6段）：1 夜の大都会・犯罪がおさまらず警察も手を焼く → 2 主人公は昼は大金持ちの青年・夜は正体をかくして街を守る
//   → 3 協力するのは警部補と新しい検事・街の犯罪はへりはじめていた → 4 そこへ正体不明の犯罪者・街はふたたび混乱と狂気に
//   → 5 2008年のアメリカ映画・世界の興行収入は10億ドル → 6 決め手：コウモリのような黒いスーツのヒーロー・悪役の演技がアカデミー賞に
// 結末・悪役の計画の中身は言わない。登場人物の名前・街の名前は出さない。俳優の顔・ポスター・ロゴ（コウモリのマーク）・
// スーツや悪役のメイクと衣装・空に映るサインの光・トランプのカードは使わない。有名な場面の構図（銀行強盗・取調室など）はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#10141e', floor: '#1a1e26', fogNear: 20, fogFar: 90 });
const qs = S.scene;
const R = rng(14010);

const RICH = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#2a2a30', pants: '#1e1e24', tie: true };
const DARK = { skin: '#2a2a30', hair: '#0e0e10', shirt: '#1e1e24', pants: '#18181c' };
const COP = { skin: '#f0c8a8', hair: '#8a8a8a', shirt: '#5a4a3a', pants: '#3a3a36' };
const DA = { skin: '#f4d3b5', hair: '#c8a060', shirt: '#4a5a7a', pants: '#2a3040', tie: true };
const STRANGER = { skin: '#e8c0a0', hair: '#1a1614', shirt: '#2a2c34', pants: '#22242a', long: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const winTex = (seed, lit = 0.45) => { const r = rng(seed); return canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#14161e'; g.fillRect(0, 0, w, h);
  for (let y = 6; y < h - 8; y += 14) for (let x = 6; x < w - 8; x += 14) { if (r() < lit) { g.fillStyle = r() < 0.7 ? '#f0d890' : '#a8c8f0'; g.fillRect(x, y, 8, 9); } } }); };
function city(cx, cz, n = 14, seed = 1) { const r = rng(seed); for (let i = 0; i < n; i++) { const w = 3 + r() * 3, h = 10 + r() * 26, d = 3 + r() * 3;
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: winTex(seed * 100 + i) })); b.position.set(cx - 30 + i * (60 / n) + r() * 2, h / 2, cz - r() * 14); qs.add(b); } }
function policeCar() { const g = new THREE.Group(); const b = box(1.8, 0.7, 4.0, mat('#20242c')); b.position.y = 0.6; g.add(b); const t = box(1.6, 0.6, 2.0, mat('#0e1014')); t.position.set(0, 1.25, -0.2); g.add(t);
  for (const z of [-1.3, 1.3]) for (const x of [-0.9, 0.9]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 14), mat('#08080a')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); g.add(w); }
  const sr = box(0.36, 0.14, 0.24, gl('#ff2a2a')); sr.position.set(-0.22, 1.62, -0.2); g.add(sr); const sb = box(0.36, 0.14, 0.24, gl('#2a5aff')); sb.position.set(0.22, 1.62, -0.2); g.add(sb); g.userData.sr = sr; g.userData.sb = sb; qs.add(g); return g; }

// ---------- 1段目. 夜の大都会の大通り（x=0）。止まったパトカーの赤と青の光、遠くに光るビル群、走りまわる警官 ----------
city(0, -26, 14, 1);
{ const rd = box(40, 0.04, 10, mat('#22252c')); rd.position.set(0, 0.03, -3); qs.add(rd); for (let i = 0; i < 8; i++) { const ln = box(1.4, 0.02, 0.14, mat('#c8c060')); ln.position.set(-14 + i * 4, 0.06, -3); qs.add(ln); } }
const CARS1 = [policeCar(), policeCar(), policeCar()]; CARS1[0].position.set(-2.6, 0, -4.2); CARS1[0].rotation.y = 0.9; CARS1[1].position.set(2.4, 0, -5.4); CARS1[1].rotation.y = -0.7; CARS1[2].position.set(5.6, 0, -9); CARS1[2].rotation.y = 0.3;
const RL1 = new THREE.PointLight('#ff3030', 5, 12); RL1.position.set(-2.4, 2.4, -3.6); qs.add(RL1); const BL1 = new THREE.PointLight('#3060ff', 5, 12); BL1.position.set(2.4, 2.4, -4.8); qs.add(BL1);
const COPS1 = [person(COP, -0.6, -2.4, 0.6), person(COP, 0.9, -3.4, -0.8), person(COP, 3.8, -6.4, -2.2)];
COPS1.forEach(c => { c.children.forEach(() => {}); });
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tNight = tag('夜の大都会、犯罪がおさまらない', { size: 48, w: 820, bg: '#14161c', sx: 1.9 }); qs.add(tNight);
const tCops = tag('警察も、手を焼いている', { size: 54, w: 680, bg: '#e24050', sx: 1.7 }); qs.add(tCops);

// ---------- 2段目. 高層ビルの最上階の広い部屋（x=50）。大きな窓の外に夜景。スーツの青年が窓の前に立つ ----------
const AX = 50;
{ const fl = box(14, 0.04, 10, mat('#3a3430')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const rug = box(4, 0.02, 3, mat('#5a2a2a')); rug.position.set(AX + 1.5, 0.05, -2); qs.add(rug);
  const so = box(2.4, 0.5, 0.9, mat('#2a2a2e')); so.position.set(AX + 2.2, 0.35, -1.2); qs.add(so); const sb2 = box(2.4, 0.6, 0.2, mat('#2a2a2e')); sb2.position.set(AX + 2.2, 0.8, -0.8); qs.add(sb2);
  const tb = box(1.0, 0.4, 0.6, mat('#8a7050')); tb.position.set(AX + 2.2, 0.2, -2.2); qs.add(tb);
  const gs = box(0.08, 0.16, 0.08, gl('#e8c070', 0.8)); gs.position.set(AX + 2.0, 0.48, -2.2); qs.add(gs); }
const VIEW2 = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(512, 256, (g, w, h) => { const r = rng(22); g.fillStyle = '#0a0e1a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { const bw = 10 + r() * 24, bh = 40 + r() * 170, x = r() * w; g.fillStyle = '#121620'; g.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 4; y < h - 4; y += 7) for (let xx = x + 2; xx < x + bw - 3; xx += 6) if (r() < 0.4) { g.fillStyle = r() < 0.8 ? '#f0d890' : '#90b8f0'; g.fillRect(xx, y, 3, 3); } } }) }));
VIEW2.position.set(AX, 3.4, -7.2); qs.add(VIEW2);
for (let i = 0; i < 5; i++) { const fr = box(0.1, 7, 0.1, mat('#1a1a1e')); fr.position.set(AX - 6 + i * 3, 3.4, -7.1); qs.add(fr); }
const RICH2 = person(RICH, AX - 0.6, -5.6, Math.PI);
const CAPE2 = new THREE.Group(); { const c = box(0.9, 1.6, 0.06, mat('#0e0e12')); c.position.y = 1.0; CAPE2.add(c); const st = box(0.06, 1.8, 0.06, mat('#3a3a40')); st.position.y = 0.9; CAPE2.add(st); } CAPE2.position.set(AX + 0.5, 0, -6.4); qs.add(CAPE2);
const tRich = tag('主人公は、昼は大金持ちの青年', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tRich);
const tHide = tag('夜は、正体をかくして街を守る', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tHide);

// ---------- 3段目. 夜の警察署の一室（x=100）。地図と写真が貼られたボード。コートの警部補と、明るい髪のスーツの検事 ----------
const BX = 100;
{ const fl = box(12, 0.04, 10, mat('#4a4844')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  const wl = box(12, 4.4, 0.3, mat('#5a6058')); wl.position.set(BX, 2.2, -6.5); qs.add(wl);
  const dk = box(2.8, 0.08, 1.2, mat('#5a4a3a')); dk.position.set(BX + 0.2, 0.9, -3.2); qs.add(dk); const dl = box(2.6, 0.86, 1.0, mat('#3a3028')); dl.position.set(BX + 0.2, 0.43, -3.2); qs.add(dl);
  const lp = new THREE.PointLight('#ffe0a8', 3, 8); lp.position.set(BX, 3.2, -3); qs.add(lp);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 16, 1, true), mat('#2a3a2a')); shade.position.set(BX, 3.4, -3.2); qs.add(shade); }
const BOARD3 = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshLambertMaterial({ map: canvasTex(512, 256, (g, w, h) => { const r = rng(33); g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#8a7a5a'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.stroke(); }
  for (let i = 0; i < 9; i++) { g.fillStyle = ['#e8e4dc', '#d0d4d8', '#e0d8c8'][i % 3]; const x = 20 + (i % 5) * 96, y = 20 + Math.floor(i / 5) * 120; g.fillRect(x, y, 70, 86); g.fillStyle = '#8a8a8a'; g.fillRect(x + 10, y + 10, 50, 40); g.fillStyle = '#c83a3a'; g.beginPath(); g.arc(x + 35, y + 4, 5, 0, 6.3); g.fill(); } }) }));
BOARD3.position.set(BX - 0.4, 2.4, -6.3); qs.add(BOARD3);
const COP3 = person(COP, BX - 1.4, -4.4, 0.5);
const DA3 = person(DA, BX + 1.3, -4.6, -0.5);
const tTeam = tag('協力するのは、警部補と新しい検事', { size: 46, w: 880, bg: '#14161c', sx: 1.95 }); qs.add(tTeam);
const tDown = tag('街の犯罪は、へりはじめていた', { size: 50, w: 780, bg: '#e24050', sx: 1.8 }); qs.add(tDown);

// ---------- 4段目. 夜の交差点（x=150）。消防車と赤い煙、逃げまどう人たち。真ん中に立つ正体不明の男のシルエット ----------
const CX = 150;
city(CX, -26, 12, 4);
{ const rd = box(40, 0.04, 14, mat('#22252c')); rd.position.set(CX, 0.03, -4); qs.add(rd); }
const FIRE4 = new THREE.PointLight('#ff6a20', 6, 16); FIRE4.position.set(CX + 3, 2.2, -8); qs.add(FIRE4);
const SMOKE4 = []; for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.8 + R() * 0.8, 10, 8), gl('#5a3a30', 0.5)); s.userData.o = [CX + 1.5 + R() * 4, R() * 3, -8 - R() * 3]; qs.add(s); SMOKE4.push(s); }
const TRUCK4 = new THREE.Group(); { const b = box(2.2, 1.8, 6, mat('#b02a24')); b.position.y = 1.2; TRUCK4.add(b); const c = box(2.1, 1.0, 1.8, mat('#c83a30')); c.position.set(0, 2.6, 2.0); TRUCK4.add(c); const ld = box(0.3, 0.2, 5, mat('#c8c8c8')); ld.position.set(0, 2.5, -0.8); TRUCK4.add(ld); } TRUCK4.position.set(CX + 4.6, 0, -6.4); TRUCK4.rotation.y = -0.3; qs.add(TRUCK4);
const RUN4 = [person(COP, CX - 3, -5, 1.2), person(DA, CX - 4, -7, 1.4), person({ skin: '#e8c0a0', hair: '#3a2418', shirt: '#6a8a5a', pants: '#3a3a30', long: true, skirt: true }, CX - 2, -8, 1.6)];
RUN4[1].visible = false;
const MAN4 = person(STRANGER, CX - 0.2, -4.0, 0);
const tWho = tag('そこへ現れた、正体不明の犯罪者', { size: 48, w: 840, bg: '#14161c', sx: 1.9 }); qs.add(tWho);
const tChaos = tag('街はふたたび、混乱と狂気に', { size: 52, w: 740, bg: '#e24050', sx: 1.75 }); qs.add(tChaos);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーンと、ならんだ赤い座席 ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#8a1a24')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#7a1620')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#6a7a9a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const SL5 = new THREE.PointLight('#c8d8ff', 3, 14); SL5.position.set(DX, 3, -5); qs.add(SL5);
const COINS5 = []; for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16), gl('#e6b450')); c.rotation.x = Math.PI / 2; c.userData.o = [R() * 5 - 2.5, R() * 2, R()]; qs.add(c); COINS5.push(c); }
const t2008 = tag('2008年の、アメリカ映画', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2008);
const tBox = tag('世界の興行収入は、10億ドル超え', { size: 46, w: 840, bg: '#e24050', sx: 1.9 }); qs.add(tBox);

// ---------- 6段目. 雨上がりの夜のビルの屋上（x=250）。月を背に、黒い姿のヒーロー。まわりを飛ぶコウモリ ----------
const EX = 250;
city(EX, -30, 14, 6);
{ const rf = box(10, 0.4, 8, mat('#3a3c42')); rf.position.set(EX, 6, -2); qs.add(rf); const ed = box(10, 0.5, 0.3, mat('#4a4c52')); ed.position.set(EX, 6.45, 1.8); qs.add(ed);
  const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 16), mat('#4a4440')); tk.position.set(EX + 3, 7.0, -4); qs.add(tk); }
const MOON6 = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshBasicMaterial({ color: '#e8e4d0', fog: false })); MOON6.position.set(EX, 14.2, -30); qs.add(MOON6);
const HERO6 = person(DARK, EX, -0.6, Math.PI, 6.2);
const CAPE6 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), new THREE.MeshLambertMaterial({ color: '#0a0a0e', side: THREE.DoubleSide })); CAPE6.position.set(0, 0.8, -0.18); HERO6.add(CAPE6);
const BATS6 = []; for (let i = 0; i < 9; i++) { const b = new THREE.Group(); for (const s of [-1, 1]) { const w = box(0.28, 0.02, 0.12, gl('#060608')); w.position.x = s * 0.14; b.add(w); } const bd = box(0.08, 0.06, 0.12, gl('#060608')); b.add(bd); b.userData.o = [R() * 6.28, 1.2 + R() * 1.6, 0.8 + R() * 1.5]; qs.add(b); BATS6.push(b); }
const tBat = tag('コウモリのような、黒いスーツのヒーロー', { size: 44, w: 920, bg: '#14161c', sx: 2.0 }); qs.add(tBat);
const tOscar = tag('悪役の演技は、アカデミー賞に', { size: 50, w: 780, bg: '#e6b450', color: '#14161c', sx: 1.8 }); qs.add(tOscar);

// ---------- shots ----------
const ALL = [tNight, tCops, tRich, tHide, tTeam, tDown, tWho, tChaos, t2008, tBox, tBat, tOscar, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SMOKE4.forEach(x => x.visible = false); COINS5.forEach(x => x.visible = false); BATS6.forEach(x => x.visible = false); }

function shotStreet(t, quiz = 0) { // 1段目 0〜9：夜の大都会、犯罪がおさまらない。警察も、手を焼いている（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.5; S.key.color.set('#a8b8e0'); S.darken(0.4, '#04060a');
  const on = Math.sin(t * 9) > 0; RL1.intensity = on ? 7 : 1.5; BL1.intensity = on ? 1.5 : 7;
  CARS1.forEach(c => { c.userData.sr.material.color.set(on ? '#ff2a2a' : '#4a1010'); c.userData.sb.material.color.set(on ? '#102050' : '#2a5aff'); });
  COPS1.forEach((c, i) => { c.position.x = [-0.6, 0.9, 3.8][i] + Math.sin(t * 0.8 + i) * 0.4; poseWalk(c, t * 7 + i, 0.8); });
  const u = ease(t / 9);
  look(lerp(-1.2, -0.6, u), lerp(1.9, 1.7, u), lerp(3.6, 2.6, u), 0.6, 1.6, -5.0, 62);
  Q1.position.set(0.6, 2.7, -4.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tNight, 1.05); pin(tCops, 1.05);
  if (!quiz) { tNight.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tNight.visible = false; tCops.userData.pop((t - 5.5) / 0.35); }
  return qs;
}
function shotTower(t) { // 2段目 9〜17：主人公は、昼は大金持ちの青年。夜は、正体をかくして街を守っている
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.6; S.darken(0.5, '#04060a');
  RICH2.rotation.y = t < 4.2 ? Math.PI : lerp(Math.PI, Math.PI * 1.5, clamp((t - 4.2) / 1.0));
  CAPE2.visible = t > 4.2;
  const u = ease(t / 8);
  look(AX + lerp(0.9, 0.6, u), lerp(1.8, 1.75, u), lerp(-2.2, -2.8, u), AX - 0.9, 1.6, -5.8, 62);
  pin(tRich, 1.05); pin(tHide, 1.05);
  tRich.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tRich.visible = false; tHide.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotOffice(t) { // 3段目 17〜25：協力するのは、警察の警部補と新しい検事。街の犯罪は、へりはじめていた
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.6; S.darken(0.3, '#06070a');
  COP3.userData.arms[1].rotation.x = t > 1.5 && t < 4 ? -1.6 : -0.2; DA3.userData.head.rotation.y = 0.3;
  DA3.userData.arms[0].rotation.x = t > 4.5 ? -0.9 : 0;
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0.2, u), lerp(2.0, 1.9, u), lerp(0.6, -0.2, u), BX, 1.7, -4.8, 62);
  pin(tTeam, 1.05); pin(tDown, 1.05);
  tTeam.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTeam.visible = false; tDown.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotChaos(t) { // 4段目 25〜33：そこへ現れた、正体不明の犯罪者。街はふたたび、混乱と狂気につつまれる
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.5, '#0a0404');
  FIRE4.intensity = 5 + Math.sin(t * 13) * 1.5;
  SMOKE4.forEach((s, i) => { const o = s.userData.o; s.visible = true; s.position.set(o[0] + Math.sin(t * 0.5 + i) * 0.4, 1 + ((o[1] + t * 0.5) % 4), o[2]); });
  RUN4.forEach((p, i) => { p.position.x = CX - 3 - i - t * 0.9; poseWalk(p, t * 9 + i, 1.0); p.rotation.y = -Math.PI / 2; });
  MAN4.userData.head.rotation.x = 0.1; MAN4.userData.arms.forEach((a, i) => a.rotation.z = t > 4.4 ? (i ? -0.5 : 0.5) : 0);
  const u = ease(t / 8);
  look(CX + lerp(0.8, 0.2, u), lerp(1.5, 1.4, u), lerp(1.2, 0.0, u), CX - 0.2, 1.5, -4.2, 62);
  pin(tWho, 1.05); pin(tChaos, 1.05);
  tWho.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWho.visible = false; tChaos.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2008年の、アメリカ映画。世界の興行収入は、10億ドルをこえた
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCREEN5.material.color.setHSL(0.6, 0.22, 0.42 + Math.sin(t * 2.3) * 0.06);
  COINS5.forEach((c, i) => { const o = c.userData.o; c.visible = t > 4.2; c.position.set(DX + o[0], 4.4 - ((t * 0.9 + o[1]) % 3.6), -3.5 + o[2]); c.rotation.z = t * 3 + i; });
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.6, 2.4, u), lerp(3.6, 2.8, u), DX, 2.0, -6, 62);
  pin(t2008, 1.05); pin(tBox, 1.05);
  t2008.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2008.visible = false; tBox.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotRoof(t) { // 6段目 42〜49（決め手）：コウモリのような、黒いスーツのヒーロー。悪役の演技は、アカデミー賞に
  base(); S.aim(EX, -2); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.5; S.key.color.set('#b8c8e8'); S.darken(0.45, '#04060c');
  CAPE6.rotation.x = 0.15 + Math.sin(t * 2.4) * 0.12;
  BATS6.forEach((b, i) => { const o = b.userData.o; b.visible = true; const a = o[0] + t * 1.3; b.position.set(EX + Math.cos(a) * o[2], 6.2 + o[1] + Math.sin(t * 3 + i) * 0.15, -0.6 + Math.sin(a) * o[2] * 0.6); b.children[0].rotation.z = Math.sin(t * 18 + i) * 0.6; b.children[1].rotation.z = -Math.sin(t * 18 + i) * 0.6; });
  const u = ease(t / 7);
  look(EX, lerp(6.65, 6.6, u), lerp(5.6, 5.0, u), EX, 7.7, -0.6, 62);
  pin(tBat, 1.05); pin(tOscar, 1.05);
  if (t < 3.6) tBat.userData.pop((t - 0.3) / 0.35); else tOscar.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の大通りに戻る）
  shotStreet(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStreet(t, 0) },
  { a: 9, b: 17, f: shotTower },
  { a: 17, b: 25, f: shotOffice },
  { a: 25, b: 33, f: shotChaos },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotRoof },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '夜の大都会。<br>犯罪がおさまらない。'],
  [5.6, 9.0, '警察も、<br>手を焼いている。'],
  [9.2, 13.2, '主人公は、昼は<br>大金持ちの青年。'],
  [13.2, 17.0, '夜は、正体をかくして<br>街を守っている。'],
  [17.2, 21.0, '協力するのは、<br>警部補と新しい検事。'],
  [21.0, 25.0, '街の犯罪は、<br>へりはじめていた。'],
  [25.2, 29.0, 'そこへ現れた、<br>正体不明の犯罪者。'],
  [29.0, 33.0, '街はふたたび、<br>混乱と狂気につつまれる。'],
  [33.2, 37.4, '2008年の、<br>アメリカ映画。'],
  [37.4, 41.8, '世界の興行収入は、<br>10億ドルをこえた。'],
  [42.2, 45.4, 'コウモリのような、<br>黒いスーツのヒーロー。'],
  [45.4, 49.0, '悪役の演技は、<br>アカデミー賞に。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ダークナイト。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q140', v2: true, answer: 'ダークナイト',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 14010,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'alarm', 0.3], [5.6, 'drone', 0.4], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'drone', 0.5], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'drone', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ダークナイト': 'ダークナイト', 'アカデミー賞': 'アカデミーしょう', '興行収入': 'こうぎょうしゅうにゅう', '正体不明': 'しょうたいふめい', '大金持ち': 'おおがねもち', '2008年': 'にせんはちねん', '10億': 'じゅうおく', '大都会': 'だいとかい', '警部補': 'けいぶほ', '主人公': 'しゅじんこう', '犯罪者': 'はんざいしゃ', '現れた': 'あらわれた', '焼いて': 'やいて', '守って': 'まもって', '協力': 'きょうりょく', '新しい': 'あたらしい', '検事': 'けんじ', '犯罪': 'はんざい', '警察': 'けいさつ', '正体': 'しょうたい', '青年': 'せいねん', '混乱': 'こんらん', '狂気': 'きょうき', '映画': 'えいが', '世界': 'せかい', '黒い': 'くろい', '悪役': 'あくやく', '演技': 'えんぎ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて', '夜': 'よる', '昼': 'ひる', '街': 'まち' },
    caption: 'この映画のタイトル、わかる？\n夜の大都会。犯罪がおさまらない。警察も、手を焼いている。主人公は、昼は大金持ちの青年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'U-NEXT', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'ダークナイト', info: 'Prime Video・U-NEXT｜映画・152分', answerSize: 128 });
