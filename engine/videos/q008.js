import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #008 Lupin/ルパン（ドラマ・フランス。Netflixで見放題、justwatch.com/jp/テレビ番組/lupin で2026/11/1確認。Filmarks パート1 4.0）
// 設定：パリの美術館に管理人の姿で現れ、王妃の首飾りをねらう男。変装の名人。少年のころ父から怪盗紳士の本を贈られた。
//       父は裕福な雇い主の一家に宝石の首飾りを盗んだ罪を着せられた。その一家への報復に乗り出す
//       （Filmarks・JustWatch の作品紹介、France.fr のロケ地紹介、Woman&Home の作品紹介）
// 追加で確認（2026/11/2）：主人公は美術館で清掃員として働いている。ねらう首飾りは、父が盗んだと疑われたのと同じ首飾りで、
//       年月がたって雇い主の一家が売りに出したもの（The Nerd Daily の作品レビュー thenerddaily.com/tv-review-lupin）
// 作品の映像・衣装・ロゴ・有名な場面の構図、実在の美術館の外観（ガラスのピラミッドなど）は使わない。シルクハットや片眼鏡のような怪盗の定番の姿も出さない
// 実在の建物（塔・大聖堂など）も出さない。人が傷つく描写・血は一切出さない（父は連れて行かれるだけ）

const S = quizStage({ bg: '#1c2030', floor: '#3a3430', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(808);

const CLEAN = { skin: '#7a5236', hair: '#141010', shirt: '#4a6a8a', pants: '#4a6a8a' };
const COURIER = { skin: '#7a5236', hair: '#141010', shirt: '#c8862a', pants: '#3a3020' };
const SUITM = { skin: '#7a5236', hair: '#141010', shirt: '#22242c', pants: '#22242c', tie: true };
const FATHER = { skin: '#6e4a30', hair: '#1a1410', shirt: '#e9e4da', pants: '#3a3a40' };
const SON = { skin: '#7a5236', hair: '#141010', shirt: '#d97a3a', pants: '#2b3346', scale: 0.62 };
const RICH = { skin: '#efcfae', hair: '#9a9a9a', shirt: '#3a2a3a', pants: '#2a2028', tie: true };
const RICHW = { skin: '#efcfae', hair: '#c8a870', shirt: '#6a2a3a', pants: '#2a2028', long: true, skirt: true };
const COP = { skin: '#efcfae', hair: '#2c2421', shirt: '#24324f', pants: '#1c2232' };
function capOn(p, c = '#1c2232') { const h = p.userData.head; const k = box(0.44, 0.12, 0.44, mat(c)); k.position.y = 0.52; h.add(k); const v = box(0.44, 0.03, 0.18, mat(c)); v.position.set(0, 0.47, 0.27); h.add(v); }
function mop(p) { const st = box(0.04, 1.5, 0.04, mat('#c9a26a')); st.position.set(0, -0.3, 0.12); st.rotation.x = 0.3; p.userData.arms[1].add(st); const hd = box(0.4, 0.08, 0.16, mat('#d8d8d8')); hd.position.set(0, -1.05, 0.34); p.userData.arms[1].add(hd); p.userData.arms[1].rotation.x = -0.35; }
function parcel(p) { const b = box(0.46, 0.34, 0.36, mat('#b08a5a')); b.position.set(-0.32, -0.6, 0.22); p.userData.arms[1].add(b); p.userData.arms[1].rotation.x = -0.9; p.userData.arms[0].rotation.x = -0.9; }

// 宝石の首飾り（金の輪と石）
function necklace(s = 1) { const g = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.7, roughness: 0.3, emissive: '#3a2a08' }); const gem = new THREE.MeshStandardMaterial({ color: '#e8f4ff', metalness: 0.2, roughness: 0.05, emissive: '#6a8aaa' });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28 * s, 0.022 * s, 8, 40), gold); g.add(ring);
  for (let i = 0; i < 14; i++) { const a = Math.PI * 0.15 + (i / 13) * Math.PI * 0.7; const d = new THREE.Mesh(new THREE.OctahedronGeometry((i === 6 || i === 7 ? 0.06 : 0.035) * s), gem); d.position.set(Math.cos(a + Math.PI) * 0.3 * s, Math.sin(a + Math.PI) * 0.3 * s, 0.01); g.add(d); }
  return g; }
function sparkles(n, cx, cy, cz, sx, sy, sz) { const a = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); s.userData.p = new THREE.Vector3(cx + (R() - 0.5) * sx, cy + R() * sy, cz + (R() - 0.5) * sz); qs.add(s); a.push(s); } return a; }
function twinkle(arr, T) { arr.forEach((s, i) => { s.position.copy(s.userData.p); const tw = (Math.sin(T * 6 + i * 1.7) + 1) / 2; s.scale.setScalar(0.3 + tw * 1.2); s.visible = tw > 0.5; }); }
function caseBox(parent, x, z, withNk) { const ped = box(1.0, 1.1, 1.0, mat('#2a2a30')); ped.position.set(x, 0.55, z); parent.add(ped);
  const glass = box(0.96, 0.9, 0.96, new THREE.MeshLambertMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, depthWrite: false })); glass.position.set(x, 1.56, z); parent.add(glass);
  const stand = box(0.5, 0.5, 0.06, mat('#3a1a2a')); stand.position.set(x, 1.36, z - 0.06); stand.rotation.x = -0.2; parent.add(stand);
  let nk = null; if (withNk) { nk = necklace(0.9); nk.position.set(x, 1.5, z); nk.rotation.x = -0.2; parent.add(nk); }
  const sp = new THREE.SpotLight(0xfff2d8, 0, 8, 0.35, 0.5, 1.2); sp.position.set(x, 5.4, z + 1.2); sp.target.position.set(x, 1.4, z); parent.add(sp); parent.add(sp.target);
  return { nk, sp }; }

// ---------- 1〜2段目. 大きな屋敷（x=0）。首飾りが消え、父が疑われる ----------
const MAN = new THREE.Group(); MAN.position.set(0, 0, 0); qs.add(MAN);
let MCASE;
{ const back = box(14, 5.4, 0.3, mat('#d8ccb4')); back.position.set(0, 2.7, -3.6); MAN.add(back);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 5.0, 14), mat('#efe6d4')); c.position.set(-5.5 + i * 2.2, 2.5, -3.2); c.castShadow = true; MAN.add(c); }
  const door = box(1.8, 3.2, 0.08, new THREE.MeshBasicMaterial({ color: '#f2dcae' })); door.position.set(0, 1.6, -3.42); MAN.add(door);
  const rug = box(7, 0.02, 3.6, mat('#7a2a2a')); rug.position.set(0, 0.03, -0.4); MAN.add(rug);
  const rugB = box(6.4, 0.025, 3.0, mat('#a8843a')); rugB.position.set(0, 0.035, -0.4); MAN.add(rugB);
  const rugI = box(6.1, 0.03, 2.7, mat('#7a2a2a')); rugI.position.set(0, 0.04, -0.4); MAN.add(rugI);
  MCASE = caseBox(MAN, -1.0, 0.7, false);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.98, 0.92, 0.98)), new THREE.LineBasicMaterial({ color: '#dff0ff' })); edge.position.set(-1.0, 1.56, 0.7); MAN.add(edge);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 32), new THREE.MeshBasicMaterial({ color: '#e6b450', transparent: true, opacity: 0.35 })); halo.position.set(-1.0, 1.5, 0.66); halo.rotation.x = -0.2; MAN.add(halo); // 首飾りのあった跡
  const warm = new THREE.PointLight(0xffd8a0, 0, 12, 1.2); warm.position.set(0, 4.2, 1.2); MAN.add(warm); MAN.userData.warm = warm; }
const rich = makePerson(RICH); rich.position.set(1.55, 0, -0.1); qs.add(rich);
const richW = makePerson(RICHW); richW.position.set(2.1, 0, -0.9); qs.add(richW);
const dad = makePerson(FATHER); dad.position.set(0.0, 0, -0.5); qs.add(dad);
const COPS = [-0.7, 0.7].map((x) => { const p = makePerson(COP); capOn(p); p.position.set(x, 0, -1.3); qs.add(p); return p; });
const son = makePerson(SON); son.position.set(0.85, 0, 1.3); qs.add(son);
const grown = makePerson({ ...SUITM, shirt: '#3a3e4a', pants: '#2a2c34', tie: false }); grown.position.set(0.85, 0, 1.3); qs.add(grown);
const MSPARK = sparkles(10, -1.0, 1.3, 0.7, 0.7, 0.5, 0.2);
const tGone = tag('首飾りが消えた', { size: 70, w: 520, bg: '#e2483c' }); tGone.position.set(-0.45, 2.3, 0.7); qs.add(tGone);
const tSus = tag('疑われたのは父', { size: 66, w: 520, bg: '#e6b450', color: '#14161c' }); tSus.position.set(0.1, 2.35, -0.5); qs.add(tSus);
const tFalse = tag('無実の罪', { size: 84, bg: '#e2483c' }); tFalse.position.set(-0.6, 2.45, -0.4); qs.add(tFalse);
const tSon = tag('大人になった息子', { size: 60, w: 520, bg: '#e6b450', color: '#14161c' }); tSon.position.set(0.2, 2.4, 1.3); qs.add(tSon);
const PUFF = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshLambertMaterial({ color: '#e8e4ec', transparent: true, opacity: 0.8 })); m.userData.d = new THREE.Vector3((R() - 0.5) * 1.4, R() * 1.8, (R() - 0.5) * 1.0); qs.add(m); PUFF.push(m); }
function puff(x, z, k) { PUFF.forEach((m) => { m.visible = k > 0 && k < 1; m.position.set(x + m.userData.d.x * (0.4 + k), 0.2 + m.userData.d.y * (0.6 + k * 0.4), z + m.userData.d.z * (0.4 + k)); m.material.opacity = 0.85 * (1 - k); m.scale.setScalar(0.6 + k * 1.2); }); }

// ---------- 3〜4段目. 夜の美術館（x=26）。中は抽象的な色面の絵だけ ----------
const GAL = new THREE.Group(); GAL.position.set(26, 0, 0); qs.add(GAL);
let GCASE;
{ const wall = mat('#5a4a40');
  const back = box(16, 6, 0.3, wall); back.position.set(0, 3, -4); GAL.add(back);
  for (const x of [-7.6, 7.6]) { const sw = box(0.3, 6, 10, wall); sw.position.set(x, 3, 0); GAL.add(sw); }
  const flT = canvasTex(512, 512, (g, w, h) => { const c = w / 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#6a5040' : '#7a6050'; g.fillRect(x * c, y * c, c, c); } });
  flT.wrapS = flT.wrapT = THREE.RepeatWrapping; flT.repeat.set(4, 3);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ map: flT })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.02; GAL.add(fl);
  const PAL = [['#8a6a3a', '#3a5a6a'], ['#6a3a3a', '#d8b878'], ['#2a4a3a', '#c8a86a'], ['#4a3a6a', '#d89a6a']];
  [[-5, 2.8, 2.0, 2.6], [-2.2, 3.0, 1.4, 1.8], [2.4, 3.0, 1.6, 2.0], [5.2, 2.8, 2.2, 2.8]].forEach(([x, y, w, h], i) => { const pt = canvasTex(256, 320, (g, W, H) => { g.fillStyle = PAL[i][0]; g.fillRect(0, 0, W, H); g.fillStyle = PAL[i][1]; g.beginPath(); g.arc(W * 0.5, H * 0.45, W * 0.28, 0, Math.PI * 2); g.fill(); g.fillRect(0, H * 0.72, W, H * 0.28); }); const fr = box(w + 0.24, h + 0.24, 0.08, mat('#b08a3a')); fr.position.set(x, y, -3.8); GAL.add(fr); const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: pt })); pic.position.set(x, y, -3.75); GAL.add(pic); });
  GCASE = caseBox(GAL, 0, -0.6, true);
  const rope = box(3.2, 0.04, 0.04, mat('#a02a2a')); rope.position.set(0, 0.8, 0.6); GAL.add(rope);
  for (const x of [-1.6, 1.6]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.9, 10), mat('#b08a3a')); pole.position.set(x, 0.45, 0.6); GAL.add(pole); }
  const moonWin = new THREE.SpotLight(0x9ab0e0, 0, 16, 0.5, 0.6, 1.0); moonWin.position.set(-5, 6, 3); moonWin.target.position.set(-1, 0, -1); GAL.add(moonWin); GAL.add(moonWin.target); GAL.userData.moon = moonWin; }
const GSPARK = sparkles(16, 26, 1.3, -0.6, 0.7, 0.5, 0.2);
const cleaner = makePerson(CLEAN); capOn(cleaner, '#3a5a7a'); mop(cleaner); cleaner.position.set(24.7, 0, -0.2); qs.add(cleaner);
const tSame = tag('あの日の首飾り', { size: 68, w: 520, bg: '#e6b450', color: '#14161c' }); tSame.position.set(26, 2.6, -0.6); qs.add(tSame);
const tCl = tag('清掃員', { size: 80, w: 320 }); tCl.position.set(24.8, 2.5, -0.2); qs.add(tCl);
const tRev = tag('目的は報復', { size: 76, w: 440, bg: '#e2483c' }); tRev.position.set(25.0, 2.5, -0.2); qs.add(tRev);

// ---------- 5段目・クイズ. 夜の屋根の上（x=52）。古い街並みの屋根と煙突だけ（実在の建物は出さない） ----------
const ROOF = new THREE.Group(); ROOF.position.set(52, 0, 0); qs.add(ROOF);
{ for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) { const h = 3.4 + ((i + row) % 3) * 0.6 + row * 0.8; const z = -6 - row * 4 - (i % 2) * 1.2; const x = -10 + i * 2.5 + row * 1.2; const b = box(2.4, h, 2.4, mat(['#c8b898', '#b8a888', '#d0c0a0'][(i + row) % 3])); b.position.set(x, h / 2, z); ROOF.add(b);
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.7, 1.1, 4), mat('#5a6a7a')); rf.rotation.y = Math.PI / 4; rf.position.set(x, h + 0.55, z); ROOF.add(rf);
    for (let k = 0; k < 2; k++) { const cp = box(0.18, 0.5, 0.18, mat('#b06a4a')); cp.position.set(x - 0.5 + k * 1.0, h + 1.15, z - 0.4); ROOF.add(cp); }
    for (let k = 0; k < 3; k++) { const w = box(0.4, 0.62, 0.05, new THREE.MeshBasicMaterial({ color: (i * 3 + k + row) % 4 ? '#262c3a' : '#ffd98a' })); w.position.set(x - 0.7 + k * 0.7, h - 1.0, z + 1.23); ROOF.add(w); const bal = box(0.5, 0.06, 0.12, mat('#1a1c22')); bal.position.set(x - 0.7 + k * 0.7, h - 1.38, z + 1.28); ROOF.add(bal); } }
  const deck = box(8, 0.3, 4, mat('#5a6a7a')); deck.position.set(0, 0.15, 0); ROOF.add(deck);
  const chim = box(0.6, 1.2, 0.5, mat('#b06a4a')); chim.position.set(-1.8, 0.9, -0.8); ROOF.add(chim);
  for (let k = 0; k < 3; k++) { const cp = box(0.14, 0.4, 0.14, mat('#8a4a3a')); cp.position.set(-2.0 + k * 0.2, 1.7, -0.8); ROOF.add(cp); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff2c8', fog: false })); moon.position.set(3.4, 8.2, -16); ROOF.add(moon);
  const rim = new THREE.PointLight(0xb8c8ff, 0, 8, 1.4); rim.position.set(1.6, 3.4, 1.6); ROOF.add(rim); ROOF.userData.rim = rim; }
const ROOFMEN = [CLEAN, COURIER, SUITM].map((o, i) => { const p = makePerson(o); if (i === 0) { capOn(p, '#3a5a7a'); mop(p); } if (i === 1) { capOn(p, '#6a4a1a'); parcel(p); } p.position.set(52.4, 0.3, 0.3); p.rotation.y = -0.4; qs.add(p); return p; });
const NK6 = necklace(0.5); qs.add(NK6);
const tParis = tag('フランス・パリ', { size: 68, w: 500, bg: '#e6b450', color: '#14161c' }); tParis.position.set(52.3, 2.75, 0.3); qs.add(tParis);
const tMaster = tag('変装の名人', { size: 80, bg: '#e2483c' }); tMaster.position.set(52.3, 2.75, 0.3); qs.add(tMaster);

// ---------- 6段目（決め手）. 夜の書斎、父がくれた本（x=78）。表紙も中身も文字なし ----------
const LIB = new THREE.Group(); LIB.position.set(78, 0, 0); qs.add(LIB);
const pageT = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#f2e8d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8aa8a'; for (let i = 0; i < 13; i++) { const ln = 150 + ((i * 37) % 50); g.fillRect(26, 34 + i * 22, i % 5 === 4 ? ln * 0.5 : ln, 6); } });
const BOOK = new THREE.Group();
const COVER_L = new THREE.Group(), COVER_R = new THREE.Group();
{ const back = box(10, 4.6, 0.2, mat('#4a3022')); back.position.set(0, 2.3, -3); LIB.add(back);
  for (let k = 0; k < 4; k++) for (let i = 0; i < 26; i++) { const b = box(0.16, 0.55 + (i % 3) * 0.06, 0.3, mat(['#7a2a2a', '#2a4a6a', '#3a5a3a', '#8a6a2a', '#4a3a5a'][(i * 3 + k) % 5])); b.position.set(-4.2 + i * 0.33, 0.5 + k * 0.95, -2.75); LIB.add(b); }
  for (let k = 0; k < 4; k++) { const sh = box(9, 0.06, 0.4, mat('#3a2418')); sh.position.set(0, 0.2 + k * 0.95, -2.75); LIB.add(sh); }
  const desk = box(2.6, 0.9, 1.3, mat('#5a3a24')); desk.position.set(0, 0.45, -0.2); LIB.add(desk);
  const lampB = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.06, 14), mat('#b08a3a')); lampB.position.set(-0.95, 0.93, -0.5); LIB.add(lampB);
  const lampS = box(0.03, 0.5, 0.03, mat('#b08a3a')); lampS.position.set(-0.95, 1.2, -0.5); LIB.add(lampS);
  const lampH = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.24, 14, 1, true), mat('#2a5a3a')); lampH.position.set(-0.95, 1.5, -0.5); LIB.add(lampH);
  const lamp = new THREE.PointLight(0xffc878, 0, 6, 1.4); lamp.position.set(-0.8, 1.3, -0.3); LIB.add(lamp); LIB.userData.lamp = lamp;
  // 本：左右の表紙（紺）が開く。中のページは線だけ
  for (const [gr, s] of [[COVER_L, -1], [COVER_R, 1]]) { const cv = box(0.38, 0.03, 0.52, mat('#2a3a6a')); cv.position.x = s * 0.19; gr.add(cv); const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.48), new THREE.MeshLambertMaterial({ map: pageT })); pg.rotation.x = -Math.PI / 2; pg.position.set(s * 0.19, 0.02, 0); gr.add(pg); const band = box(0.38, 0.032, 0.06, mat('#e6b450')); band.position.set(s * 0.19, 0.002, 0.16); gr.add(band); BOOK.add(gr); }
  BOOK.position.set(0.15, 0.93, -0.1); LIB.add(BOOK);
  const glow = new THREE.PointLight(0xffe2a0, 0, 4, 1.4); glow.position.set(0.15, 1.6, 0.2); LIB.add(glow); LIB.userData.glow = glow; }
const reader = makePerson(SUITM); reader.position.set(79.05, 0, 0.35); reader.rotation.y = -1.1; qs.add(reader);
const BSPARK = sparkles(18, 78.15, 1.0, -0.1, 0.9, 1.2, 0.6);
const tBook = tag('父がくれた本', { size: 70, w: 460, bg: '#e6b450', color: '#14161c' }); tBook.position.set(78.3, 2.15, -0.3); qs.add(tBook);
const tThief = tag('怪盗紳士の物語', { size: 68, w: 540, bg: '#e2483c' }); tThief.position.set(78.3, 2.15, -0.3); qs.add(tThief);

// ---------- shots ----------
const ALLTAG = [tGone, tSus, tFalse, tSon, tSame, tCl, tRev, tParis, tMaster, tBook, tThief];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); MCASE.sp.intensity = 0; GCASE.sp.intensity = 0; MAN.userData.warm.intensity = 0; GAL.userData.moon.intensity = 0; ROOF.userData.rim.intensity = 0; LIB.userData.lamp.intensity = 0; LIB.userData.glow.intensity = 0; PUFF.forEach(m => m.visible = false); [...MSPARK, ...GSPARK, ...BSPARK].forEach(s => s.visible = false); grown.visible = false; son.visible = true; NK6.visible = false; }

function mansionPose() {
  dad.position.set(0.0, 0, -0.5); COPS.forEach((p, i) => p.position.set(i ? 0.7 : -0.7, 0, -1.3)); [dad, ...COPS].forEach(p => { p.visible = true; p.userData.legs.forEach(l => l.rotation.x = 0); p.userData.arms.forEach(a => a.rotation.x = 0); });
  rich.rotation.y = -1.45; rich.userData.arms[1].rotation.set(-1.5, 0, 0); // 父のほうを指さす
  richW.rotation.y = -0.7; richW.userData.head.rotation.y = -0.4;
  dad.rotation.y = 0.5;
  COPS.forEach((p, i) => { p.rotation.y = i ? -0.35 : 0.35; });
  son.rotation.y = -0.6; son.userData.head.rotation.y = -0.5;
}
function shotGone(t, T) { // 1段目 0〜9：大きな屋敷で首飾りが消えた。疑われたのは父（0秒目がサムネ）
  base(); S.aim(0, 0); lift(170);
  S.hemi.intensity = 0.8; S.key.intensity = 0.7; MAN.userData.warm.intensity = 6;
  MCASE.sp.intensity = 46 + Math.sin(T * 7) * 6;
  mansionPose();
  dad.userData.head.rotation.x = T > 6 ? 0.25 : 0; dad.userData.arms.forEach(a => a.rotation.x = T > 6 ? 0 : -0.25);
  tGone.userData.pop((T - 2.6) / 0.35);
  if (T > 5.6) { tGone.visible = false; tSus.userData.pop((T - 5.8) / 0.35); }
  const u = ease(T / 9);
  look(lerp(0.3, 0.1, u), lerp(1.9, 1.8, u), lerp(6.9, 6.2, u), lerp(0.2, 0.0, u), 1.25, -0.2, 54);
  return qs;
}
function shotTaken(t) { // 2段目 9〜17：父は無実の罪で連れて行かれ、残された息子はやがて大人に
  base(); S.aim(0, 0); lift(200);
  S.hemi.intensity = 0.75; S.key.intensity = 0.55; MAN.userData.warm.intensity = 5; MCASE.sp.intensity = 40;
  mansionPose();
  const w = ease(clamp((t - 0.6) / 4.6));
  const walking = t > 0.6 && t < 5.2;
  dad.position.set(0, 0, lerp(-0.5, -3.0, w)); dad.rotation.y = Math.PI; dad.userData.head.rotation.x = 0.3; dad.userData.arms.forEach(a => a.rotation.x = 0);
  COPS.forEach((p, i) => { p.position.set(i ? 0.62 : -0.62, 0, lerp(-1.3, -3.1, w)); p.rotation.y = Math.PI; if (walking) poseWalk(p, t * 6 + i, 0.6); });
  if (walking) poseWalk(dad, t * 6 + 2, 0.5);
  [dad, ...COPS].forEach(p => p.visible = w < 0.98);
  son.rotation.y = Math.PI + 0.2; son.userData.head.rotation.y = 0; // 父の背中を見送る
  const g = clamp((t - 4.6) / 0.6);
  son.visible = g <= 0.5; grown.visible = g > 0.5; grown.rotation.y = Math.PI + 0.2;
  puff(0.85, 1.3, g);
  tFalse.position.set(0, 2.45, lerp(-0.6, -2.9, w));
  tFalse.userData.pop((t - 1.0) / 0.35); if (t > 4.4) tFalse.visible = false;
  if (t > 5.4) tSon.userData.pop((t - 5.5) / 0.35);
  const u = ease(t / 8);
  look(lerp(1.2, 0.9, u), lerp(3.1, 2.6, u), lerp(6.8, 6.4, u), lerp(-0.6, -0.1, u), lerp(1.2, 1.3, u), lerp(-0.9, -0.2, u), 54);
  return qs;
}
function galleryNight(T, d = 0.6) { S.hemi.intensity = 0.42; S.key.intensity = 0.25; S.darken(d, '#0c0e16'); GCASE.sp.intensity = 44; GAL.userData.moon.intensity = 18; GCASE.nk.rotation.y = Math.sin(T * 0.8) * 0.25; twinkle(GSPARK, T); }
function shotMuseum(t, T) { // 3段目 17〜25：夜の静かな美術館。ケースの中に、あの日の首飾り
  base(); S.aim(26, 0); lift(170); galleryNight(T);
  cleaner.visible = false;
  tSame.userData.pop((t - 4.0) / 0.35);
  const u = ease(t / 8);
  look(lerp(22.4, 25.2, u), lerp(3.4, 2.3, u), lerp(8.6, 4.6, u), lerp(25.0, 26.0, u), lerp(2.0, 1.5, u), -0.6, 54);
  return qs;
}
function shotCleaner(t, T) { // 4段目 25〜33：そこへ清掃員。目的は、父に罪を着せた一家への報復
  base(); S.aim(26, 0); lift(170); galleryNight(T);
  cleaner.visible = true;
  const st = t < 3.6;
  const wk = ease(clamp(t / 3));
  cleaner.position.set(lerp(23.6, 24.7, wk), 0, -0.2);
  cleaner.userData.legs.forEach(l => l.rotation.x = 0); cleaner.userData.arms[0].rotation.x = 0;
  if (t < 3) poseWalk(cleaner, t * 6, 0.6 * (1 - wk));
  cleaner.rotation.y = st ? 1.2 + Math.sin(t * 2) * 0.2 : lerp(1.2, 1.85, ease((t - 3.6) / 0.8));
  cleaner.userData.arms[1].rotation.x = st ? -0.35 + Math.sin(T * 3) * 0.14 : -0.35;
  cleaner.userData.head.rotation.y = 0;
  tCl.userData.pop((t - 0.8) / 0.35);
  if (t > 4.0) { tCl.visible = false; tRev.userData.pop((t - 4.1) / 0.35); }
  const u = ease(t / 8);
  look(lerp(26.8, 26.5, u), lerp(2.1, 1.9, u), lerp(5.8, 5.0, u), lerp(25.4, 25.3, u), 1.4, -0.3, 54);
  return qs;
}
const DARK = '#080b16';
function roofNight(d) { S.hemi.intensity = lerp(0.6, 0.24, d); S.key.intensity = lerp(0.4, 0, d); S.darken(lerp(0.4, 1, d), DARK); ROOF.userData.rim.intensity = 7; }
function shotRoof(t) { // 5段目 33〜42：舞台はフランスのパリ。男は変装の名人
  base(); S.aim(52, 0); lift(260); roofNight(ease(t / 2));
  const sw1 = 4.6, sw2 = 6.6;
  const idx = t < sw1 ? 0 : t < sw2 ? 1 : 2;
  ROOFMEN.forEach((p, i) => { p.visible = i === idx; p.rotation.y = -0.4 + Math.sin(t * 0.7) * 0.1; });
  const k1 = clamp((t - (sw1 - 0.2)) / 0.6), k2 = clamp((t - (sw2 - 0.2)) / 0.6);
  if (k1 > 0 && k1 < 1) puff(52.4, 0.3, k1); else if (k2 > 0 && k2 < 1) puff(52.4, 0.3, k2);
  NK6.visible = false;
  tParis.userData.pop((t - 0.6) / 0.35);
  if (t > 4.2) { tParis.visible = false; tMaster.userData.pop((t - sw2 + 0.2) / 0.35); }
  const k = ease(t / 9);
  look(lerp(54.6, 53.6, k), lerp(2.2, 2.0, k), lerp(7.4, 5.6, k), lerp(51.6, 52.2, k), lerp(2.6, 1.9, k), lerp(-3.0, 0, k), 54);
  return qs;
}
function shotBook(t, T) { // 6段目 42〜49（決め手）：少年のころ父がくれた、怪盗紳士の物語
  base(); S.aim(78, 0); lift(180);
  S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.6, '#0c0a10');
  LIB.userData.lamp.intensity = 7;
  const o = easeOut(clamp((t - 0.4) / 1.4));
  COVER_L.rotation.z = lerp(Math.PI * 0.98, 0.08, o); COVER_R.rotation.z = -0.08;
  LIB.userData.glow.intensity = 5 * o;
  if (o > 0.6) twinkle(BSPARK, T);
  reader.userData.head.rotation.x = 0.35; reader.userData.arms[0].rotation.x = -0.6;
  tBook.userData.pop((t - 1.0) / 0.35);
  if (t > 3.3) { tBook.visible = false; tThief.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  look(lerp(77.6, 77.9, u), lerp(2.3, 2.1, u), lerp(5.4, 4.6, u), 78.4, lerp(1.3, 1.35, u), -0.3, 54);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の屋根の上、手元に光る首飾り）
  base(); S.aim(52, 0); lift(190); roofNight(1);
  ROOFMEN.forEach((p, i) => p.visible = i === 2);
  const man = ROOFMEN[2]; man.rotation.y = -0.35; man.userData.arms[1].rotation.x = -1.35; man.userData.head.rotation.x = 0.15;
  man.updateMatrixWorld(true); const hp = man.userData.arms[1].localToWorld(new THREE.Vector3(0, -0.66, 0.06)); // 手にさげた首飾り
  NK6.visible = true; NK6.position.set(hp.x, hp.y - 0.3 + Math.sin(t * 2) * 0.02, hp.z); NK6.rotation.y = Math.sin(t * 1.2) * 0.6;
  const k = ease(t / 7);
  look(lerp(53.6, 52.6, k), lerp(1.9, 4.4, k), lerp(4.0, 8.4, k), 52.4, lerp(1.6, 1.9, k), 0, 52);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotGone(t, T) },
  { a: 9, b: 17, f: shotTaken },
  { a: 17, b: 25, f: (t, T) => shotMuseum(t, T) },
  { a: 25, b: 33, f: (t, T) => shotCleaner(t, T) },
  { a: 33, b: 42, f: shotRoof },
  { a: 42, b: 49, f: (t, T) => shotBook(t, T) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ある屋敷で、<br>高価な首飾りが消えた。'],
  [5.6, 9.0, '疑われたのは、<br>そこで働く父。'],
  [9.2, 13.2, '父は、やってもいない<br>罪を着せられた。'],
  [13.2, 17.0, '残された息子は、<br>やがて大人になった。'],
  [17.2, 21.0, '夜の、<br>静かな美術館。'],
  [21.0, 25.0, 'ケースの中には、<br>あの日の首飾り。'],
  [25.2, 29.0, 'そこで働く、<br>ひとりの清掃員。'],
  [29.0, 33.0, '目的は、父に罪を<br>着せた一家への報復。'],
  [33.2, 37.4, '舞台は、<br>フランスのパリ。'],
  [37.4, 41.8, '男は、姿を自由に変える<br>変装の名人。'],
  [42.2, 45.6, '少年のころ、父がくれた<br>怪盗紳士の物語。'],
  [45.6, 49.0, 'あの本の主人公のように、<br>華麗に盗み出せるか。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>Lupin／ルパン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotTaken || f === shotRoof,
  meta: {
    id: 'q008', v2: true, answer: 'Lupin/ルパン',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 808,
    hits: [5.6, 21.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.8, 13.6, 29.1, 39.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.6, 'whoosh'], [17.0, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'whoosh'], [39.6, 'whoosh'], [42.0, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '屋敷': 'やしき', '高価': 'こうか', '首飾り': 'くびかざり', '疑われた': 'うたがわれた', '働く': 'はたらく', '着せられた': 'きせられた', '着せた': 'きせた', '残された': 'のこされた', '息子': 'むすこ', '美術館': 'びじゅつかん', 'あの日': 'あのひ', '清掃員': 'せいそういん', '一家': 'いっか', '報復': 'ほうふく', '舞台': 'ぶたい', '姿': 'すがた', '変装': 'へんそう', '名人': 'めいじん', '少年': 'しょうねん', '怪盗紳士': 'かいとうしんし', '物語': 'ものがたり', '主人公': 'しゅじんこう', '華麗': 'かれい', '盗み出せる': 'ぬすみだせる', 'Lupin／ルパン': 'ルパン' },
    caption: 'このドラマのタイトル、わかる？\nある屋敷で、高価な首飾りが消えた。疑われたのは、そこで働く父。やってもいない罪を着せられ、残された息子はやがて大人になる。夜の静かな美術館に、あの日の首飾りがあった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'フランスドラマ'],
  },
});
applyQuizCards({ answer: 'Lupin／ルパン', info: 'Netflix｜フランスのドラマ', answerSize: 100 });
