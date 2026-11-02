import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #019 新感染 ファイナル・エクスプレス（映画・韓国・2016年・118分。Netflixで見放題、justwatch.com/jp/映画/fu-shan-xing-ki で2026/11/2確認。Filmarks 3.9 filmarks.com/movies/69390）
// 設定：ソウルで働くファンドマネージャーのソグは、妻と別居中で幼い娘スアンと暮らす。誕生日に釜山の母に会いたいという娘を送るため、ソウル発釜山行きの高速鉄道KTXに乗る。
//       発車直前、謎のウイルスに感染した女が乗りこみ、車内で感染が広がる。妊婦とその夫、野球部の高校生たち、身勝手な中年の会社員など、乗客たちは生き残りをかけて戦う
//       （映画.com の作品解説・Filmarks の作品ページ）。邦題の「新感染」は「新幹線」にかけた言葉
// 構成（ヒント6段）：1 発車直前、様子のおかしい女性が飛び乗る → 2 仕事ばかりの父と幼い娘、母に会いに → 3 車内の乗客たち → 4 感染が広がる、父は娘を守る
//       → 5 韓国のパニック・ホラー、ソウルから釜山へ → 6 決め手：感染者を乗せた超高速の密室、邦題は日本のあの列車のだじゃれ
// 結末・誰が助かるかには触れない。血・傷・かまれる場面は出さない（感染者はガラスの向こうの影だけ）。作品の映像・俳優・ポスター・実在の車両の塗装やロゴは使わない。人と列車は汎用の3D

const S = quizStage({ bg: '#7a8ca0', floor: '#4a4e56', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(1919);
const DAD = { skin: '#efcfae', hair: '#1d1a19', shirt: '#2a3040', pants: '#2a3040', tie: true };
const KID = { skin: '#f5d3b5', hair: '#1d1a19', shirt: '#e9e4da', pants: '#c94f7c', long: true, skirt: true, scale: 0.62 };
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = -0.38; return p; }

// ---------- 列車（外観）：白い車体に青い帯（実在の塗装やロゴではない汎用のもの） ----------
function makeTrain(n = 4) {
  const g = new THREE.Group(); const body = mat('#e8ecf0'), dark = mat('#1c2430'), band = mat('#3a6aa8');
  for (let k = 0; k < n; k++) { const c = new THREE.Group(); c.position.x = -k * 12.4; g.add(c);
    const b = box(12, 3.0, 3.0, body); b.position.y = 2.1; c.add(b);
    const st = box(12.02, 0.3, 3.02, band); st.position.y = 1.3; c.add(st);
    const wl = box(11, 0.7, 3.04, dark); wl.position.y = 2.6; c.add(wl);
    for (const x of [-5.6, 5.6]) { const d = box(0.9, 2.0, 3.06, mat('#c8d0d8')); d.position.set(x, 1.7, 0); c.add(d); }
    if (k === 0) { const nose = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI), body); nose.rotation.y = Math.PI / 2; nose.scale.set(2.6, 1.0, 1); nose.position.set(6, 2.0, 0); c.add(nose); const glass = new THREE.Mesh(new THREE.SphereGeometry(1.62, 16, 12, 0, Math.PI, 0, Math.PI / 3), dark); glass.rotation.y = Math.PI / 2; glass.scale.set(1.8, 1.0, 0.9); glass.position.set(6.6, 2.1, 0); c.add(glass); } }
  return g;
}

// ---------- 1. 夜のホーム（x=0）。0秒目がサムネ ----------
{ const plat = box(40, 1.0, 5, mat('#8a8c90')); plat.position.set(0, 0.5, 3.6); qs.add(plat);
  const edge = box(40, 0.04, 0.4, mat('#e6c040')); edge.position.set(0, 1.02, 1.35); qs.add(edge);
  const roof = box(40, 0.2, 5.4, mat('#4a4e56')); roof.position.set(0, 5.0, 3.8); roof.castShadow = false; qs.add(roof);
  for (let i = 0; i < 8; i++) { const l = box(1.6, 0.06, 0.2, new THREE.MeshBasicMaterial({ color: '#f4f0e0' })); l.position.set(-14 + i * 4, 4.88, 3.2); qs.add(l); } }
const T1 = makeTrain(4); T1.position.set(8, 0, -0.4); qs.add(T1);
const DOOR1 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), new THREE.MeshBasicMaterial({ color: '#f4f0d8' })); DOOR1.position.set(8 - 12.4 + 5.6, 1.7, 1.15); qs.add(DOOR1);
const woman = makePerson({ skin: '#c8c4b8', hair: '#3a2a20', shirt: '#7a8a6a', pants: '#3b3f4a', long: true }); qs.add(woman);
const crowd = [0, 1, 2].map(i => { const p = makePerson({ skin: ['#f1c9a5', '#e8b98f', '#f5d3b5'][i], hair: ['#1d1a19', '#2c2421', '#1a1a22'][i], shirt: ['#3a4a6a', '#6a5a4a', '#8a4a4a'][i], pants: '#2b3346' }); p.position.set(-9 + i * 2.2, 1.0, 3.0 + i * 0.5); p.rotation.y = -Math.PI / 2 + i * 0.3; qs.add(p); return p; });

// ---------- 車内（x=30 と x=60 に2両）：通路をまっすぐ見通す ----------
function makeCar(cx, day = true, skipFront = false) {
  const g = new THREE.Group(); g.position.set(cx, 0, 0); qs.add(g);
  const fl = box(3.2, 0.1, 18, mat('#5a6070')); fl.position.set(0, 0.05, -7); g.add(fl);
  const aisle = box(0.8, 0.02, 18, mat('#8a3a3a')); aisle.position.set(0, 0.11, -7); g.add(aisle);
  for (const s of [-1, 1]) { const w = box(0.12, 2.6, 18, mat('#d8dce0')); w.position.set(s * 1.66, 1.3, -7); g.add(w);
    for (let i = 0; i < 9; i++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ color: day ? '#cfe4f2' : '#1a2438' })); wn.position.set(s * 1.59, 1.55, 0.8 - i * 1.9); wn.rotation.y = -s * Math.PI / 2; g.add(wn); } }
  const ceil = box(3.4, 0.1, 18, mat('#eef0f2')); ceil.position.set(0, 2.62, -7); ceil.castShadow = false; g.add(ceil);
  for (let i = 0; i < 8; i++) { const l = box(0.3, 0.03, 1.4, new THREE.MeshBasicMaterial({ color: '#ffffff' })); l.position.set(0, 2.56, 0.6 - i * 2.2); g.add(l); }
  const endW = box(3.4, 2.6, 0.12, mat('#c8ccd2')); endW.position.set(0, 1.3, -16); g.add(endW);
  const SEATS = [];
  for (let i = 0; i < 12; i++) for (const s of [-1, 1]) for (const k of [0, 1]) { if (skipFront && i === 0 && s === 1) continue; const x = s * (0.55 + k * 0.5), z = 0.2 - i * 1.25; const seat = box(0.46, 0.12, 0.48, mat('#3a5a8a')); seat.position.set(x, 0.46, z); g.add(seat); const back = box(0.46, 0.7, 0.1, mat('#3a5a8a')); back.position.set(x, 0.86, z - 0.26); g.add(back); const hr = box(0.3, 0.14, 0.12, mat('#f4f4f4')); hr.position.set(x, 1.26, z - 0.26); g.add(hr); SEATS.push([cx + x, z]); }
  const L = new THREE.PointLight(0xffffff, 0, 14, 1.0); L.position.set(cx, 2.3, -3); qs.add(L);
  return { g, SEATS, L };
}
const CAR_A = makeCar(30, true, true);
const CAR_B = makeCar(60, true);
// 2. 父と娘（CAR_A の手前の席。座席は通路側を向いて見せる）
const dad = sit(makePerson(DAD)); dad.position.set(30.55, -0.3, -1.05); dad.rotation.y = 0; qs.add(dad);
const kid = sit(makePerson(KID)); kid.position.set(31.05, 0.0, -1.05); kid.rotation.y = 0; qs.add(kid);
const phone = box(0.08, 0.14, 0.02, new THREE.MeshBasicMaterial({ color: '#9ac8f0' })); qs.add(phone);
const tDad = tag('仕事ばかりの父', { size: 64, w: 520, bg: '#14161c', sx: 1.4 }); tDad.position.set(30.6, 1.62, -1.5); qs.add(tDad);
const tKid = tag('幼い娘', { size: 70, w: 300, bg: '#e6b450', color: '#14161c', sx: 0.75 }); tKid.position.set(31.25, 1.47, -1.2); qs.add(tKid);
const tBday = tag('誕生日', { size: 70, w: 300, bg: '#e2483c' }); tBday.position.set(30.8, 1.75, -1.5); qs.add(tBday);
// 3. 乗客たち（CAR_B）
const PAX = [];
const pregnant = makePerson({ skin: '#f1c9a5', hair: '#1d1a19', shirt: '#e8b0a0', pants: '#3b3f4a', long: true }); { const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat('#e8b0a0')); belly.position.set(0, 1.05, 0.14); belly.scale.z = 0.8; pregnant.add(belly); } pregnant.position.set(59.05, 0.1, -4.4); qs.add(pregnant); PAX.push(pregnant);
const husband = makePerson({ skin: '#e8b98f', hair: '#1a1a1a', shirt: '#3a3a3a', pants: '#2a2a2a', scale: 1.18 }); husband.position.set(59.6, 0.1, -4.7); qs.add(husband); PAX.push(husband);
const TEAM = [0, 1, 2].map(i => { const p = makePerson({ skin: ['#f1c9a5', '#efcfae', '#e8b98f'][i], hair: '#1a1a1a', shirt: '#f4f4f4', pants: '#f4f4f4' }); const cap = box(0.44, 0.1, 0.44, mat('#2a3a6a')); cap.position.y = 0.52; p.userData.head.add(cap); const vis = box(0.44, 0.03, 0.2, mat('#2a3a6a')); vis.position.set(0, 0.48, 0.28); p.userData.head.add(vis); p.position.set(60.3 + i * 0.5, 0.1, -8.4 - (i % 2) * 0.3); qs.add(p); PAX.push(p); return p; });
const exec = makePerson({ skin: '#e8b98f', hair: '#6a6a6a', shirt: '#4a4a50', pants: '#3a3a40', tie: true }); exec.position.set(60.7, 0.1, -11.0); exec.rotation.y = -0.4; qs.add(exec); PAX.push(exec);
const tPreg = tag('妊婦と夫', { size: 66, w: 360, bg: '#14161c' }); tPreg.position.set(59.35, 2.3, -4.6); qs.add(tPreg);
const tTeam = tag('野球部', { size: 66, w: 300, bg: '#14161c' }); tTeam.position.set(60.8, 2.15, -8.6); qs.add(tTeam);

// ---------- 4. 連結部のガラス扉と、その向こうの影（x=90） ----------
const VEST = new THREE.Group(); VEST.position.set(90, 0, 0); qs.add(VEST);
{ const fl = box(3.2, 0.1, 8, mat('#5a6070')); fl.position.set(0, 0.05, -1); VEST.add(fl);
  for (const s of [-1, 1]) { const w = box(0.12, 2.6, 8, mat('#c8ccd2')); w.position.set(s * 1.66, 1.3, -1); VEST.add(w); }
  const ceil = box(3.4, 0.1, 8, mat('#e4e6ea')); ceil.position.set(0, 2.62, -1); ceil.castShadow = false; VEST.add(ceil);
  for (const s of [-1, 1]) { const wp = box(1.15, 2.6, 0.14, mat('#b8bcc4')); wp.position.set(s * 1.125, 1.3, -4.4); VEST.add(wp); const fr = box(0.1, 2.1, 0.18, mat('#6a6e76')); fr.position.set(s * 0.6, 1.05, -4.36); VEST.add(fr); }
  const top = box(1.1, 0.5, 0.14, mat('#b8bcc4')); top.position.set(0, 2.35, -4.4); VEST.add(top); const fb = box(1.3, 0.1, 0.18, mat('#6a6e76')); fb.position.set(0, 2.1, -4.36); VEST.add(fb); }
const GLASS = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9), new THREE.MeshBasicMaterial({ color: '#8a9aa8', transparent: true, opacity: 0.3 })); { const bw = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshBasicMaterial({ color: '#c84a3a' })); bw.position.set(90, 1.6, -7.5); qs.add(bw); } GLASS.position.set(90, 1.08, -4.26); qs.add(GLASS);
const SHADOWS = [0, 1, 2].map(i => { const p = makePerson({ skin: '#2a2e34', hair: '#1a1c20', shirt: '#22262c', pants: '#1c1e22' }); p.position.set(89.7 + i * 0.35, 0, -4.9 - i * 0.5); p.rotation.y = 0; qs.add(p); return p; });
const RED = new THREE.PointLight(0xff3020, 0, 7, 1.2); RED.position.set(90, 2.3, -2.5); qs.add(RED);
const dad4 = makePerson(DAD); dad4.position.set(89.7, 0, -0.3); dad4.rotation.y = Math.PI; qs.add(dad4);
const kid4 = makePerson(KID); kid4.position.set(89.2, 0, 0.1); kid4.rotation.y = Math.PI; qs.add(kid4);
const tInf = tag('感染が広がる', { size: 66, w: 480, bg: '#e2483c' }); tInf.position.set(90, 2.35, -3.9); qs.add(tInf);
const tProtect = tag('娘を守る', { size: 64, w: 320, bg: '#e6b450', color: '#14161c', sx: 1.0 }); tProtect.position.set(90.75, 1.95, -1.2); qs.add(tProtect);

// ---------- 5. 路線図（x=120）：北の街から南の街へ ----------
const MAP = new THREE.Group(); MAP.position.set(120, 0, 0); qs.add(MAP);
{ const board = box(6, 0.1, 8, mat('#2a2e36')); board.position.y = 0.05; MAP.add(board);
  const tex = canvasTex(600, 800, (g, w, h) => { g.fillStyle = '#d8e4ec'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8e0cc'; g.beginPath(); g.moveTo(250, 40); g.bezierCurveTo(420, 60, 470, 200, 440, 330); g.bezierCurveTo(470, 470, 520, 600, 470, 720); g.bezierCurveTo(380, 760, 260, 760, 190, 720); g.bezierCurveTo(130, 600, 170, 460, 150, 360); g.bezierCurveTo(130, 240, 140, 120, 250, 40); g.fill();
    g.strokeStyle = '#b8b0a0'; g.lineWidth = 4; g.stroke(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 7.8), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -Math.PI / 2; m.position.y = 0.11; MAP.add(m); }
const ROUTE = []; { const pts = [[-0.5, -2.4], [-0.3, -1.4], [0.1, -0.4], [0.4, 0.6], [0.8, 1.6], [1.1, 2.5]]; for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; const seg = box(Math.hypot(x1 - x0, z1 - z0) + 0.06, 0.06, 0.12, mat('#3a6aa8')); seg.position.set(120 + (x0 + x1) / 2, 0.15, (z0 + z1) / 2); seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0); qs.add(seg); ROUTE.push(seg); } }
const DOTS = [[-0.5, -2.4], [1.1, 2.5]].map(([x, z]) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 18), mat('#e2483c')); d.position.set(120 + x, 0.17, z); qs.add(d); return d; });
const mini = new THREE.Group(); { const b = box(0.5, 0.18, 0.2, mat('#e8ecf0')); b.position.y = 0.25; mini.add(b); const n = box(0.2, 0.14, 0.18, mat('#3a6aa8')); n.position.set(0.3, 0.24, 0); mini.add(n); } qs.add(mini);
const tSeoul = tag('ソウル', { size: 66, w: 280, bg: '#14161c' }); tSeoul.position.set(119.0, 0.9, -2.4); qs.add(tSeoul);
const tBusan = tag('釜山', { size: 66, w: 240, bg: '#14161c' }); tBusan.position.set(119.9, 1.5, 2.3); qs.add(tBusan);
const tKorea = tag('韓国映画', { size: 70, w: 360, bg: '#e6b450', color: '#14161c' }); tKorea.position.set(121.4, 1.0, -2.0); qs.add(tKorea);
const tGenre = tag('パニック・ホラー', { size: 66, w: 560, bg: '#e2483c' }); tGenre.position.set(119.4, 1.2, 0.8); qs.add(tGenre);

// ---------- 6・クイズ. 夜を走る列車（x=150） ----------
const NIGHT = new THREE.Group(); NIGHT.position.set(150, 0, 0); qs.add(NIGHT);
{ const bed = box(64, 0.3, 4, mat('#3a3a3e')); bed.position.set(8, 0.15, 0); NIGHT.add(bed);
  for (const z of [-0.7, 0.7]) { const r = box(64, 0.1, 0.1, mat('#8a8c90')); r.position.set(8, 0.35, z); NIGHT.add(r); } }
const POLES = []; for (let i = 0; i < 8; i++) { const p = box(0.18, 5, 0.18, mat('#4a4c52')); p.position.set(130 + i * 6, 2.5, -2.4); qs.add(p); POLES.push(p); }
const T2 = makeTrain(4); T2.position.set(300, 0.3, 0); qs.add(T2);
const T2WIN = []; T2.children.forEach(c => c.children.forEach(m => { if (m.geometry && m.geometry.parameters && m.geometry.parameters.width === 11) T2WIN.push(m); }));
const winMat = new THREE.MeshBasicMaterial({ color: '#ffe8b0' }); T2WIN.forEach(m => m.material = winMat);
const tBox = tag('感染者を乗せた、超高速の密室', { size: 54, w: 760, bg: '#14161c' }); qs.add(tBox);
const tPun = tag('邦題は あの列車のだじゃれ', { size: 56, w: 720, bg: '#e6b450', color: '#14161c' }); qs.add(tPun);

// ---------- shots ----------
const ALL = [tDad, tKid, tBday, tPreg, tTeam, tInf, tProtect, tSeoul, tBusan, tKorea, tGenre, tBox, tPun];
function base() { T2.position.x = 300; S.reset(); ALL.forEach(x => x.visible = false); CAR_A.L.intensity = 0; CAR_B.L.intensity = 0; RED.intensity = 0; phone.visible = false; mini.visible = false; }

function shotBoard(t, T) { // 0〜9：発車直前、様子のおかしい女性が飛び乗る（0秒目がサムネ）
  base(); S.aim(0, 1); lift(60);
  S.darken(0.55, '#141a26'); S.hemi.intensity = 0.95; S.key.intensity = 0.6;
  const k = clamp(T / 6.5); const wx = lerp(-1.2, 1.6, ease(k)), wz = lerp(2.6, 1.15, ease(k));
  woman.position.set(lerp(-1.2, 1.6, ease(k)), 1.0, lerp(2.6, 1.15, ease(k)));
  woman.rotation.y = Math.atan2(1.6 - -1.2, 1.15 - 2.6) + Math.sin(T * 5) * 0.15;
  poseWalk(woman, T * 5, k < 1 ? 0.8 : 0); woman.position.y = 1.0; woman.rotation.z = Math.sin(T * 3.3) * 0.12;
  woman.userData.head.rotation.x = 0.5; woman.userData.head.rotation.z = Math.sin(T * 4) * 0.2;
  woman.visible = T < 7.3;
  const u = ease(T / 9);
  look(lerp(5.0, 4.4, u), lerp(2.6, 2.4, u), lerp(5.6, 5.0, u), wx - 0.2, 1.8, wz, 54);
  return qs;
}
function shotDad(t) { // 9〜17：仕事ばかりの父と幼い娘。娘の誕生日、母に会いに
  base(); S.aim(30, -2); lift(80);
  S.hemi.intensity = 1.3; CAR_A.L.intensity = 6;
  phone.visible = true; phone.position.set(30.6, 0.75, -0.55); phone.rotation.x = -0.6;
  dad.userData.arms[1].rotation.x = -0.9; dad.userData.head.rotation.x = 0.35;
  kid.userData.head.rotation.y = t > 4.0 ? -0.5 : 0;
  tDad.userData.pop((t - 0.6) / 0.35); if (t > 2.0) tDad.visible = false; tKid.userData.pop((t - 2.0) / 0.35); if (t > 3.8) { tDad.visible = false; tKid.visible = false; }
  tBday.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(30.6, 30.5, u), lerp(1.5, 1.6, u), lerp(2.3, 2.7, u), 30.75, 0.85, -1.1, 58);
  return qs;
}
function shotPax(t) { // 17〜25：車内には、妊婦と夫、高校の野球部員たち
  base(); S.aim(60, -4); lift(80);
  S.hemi.intensity = 1.3; CAR_B.L.intensity = 6;
  PAX.forEach((p, i) => { p.rotation.y = p === exec ? -0.4 : 0; });
  TEAM.forEach((p, i) => p.userData.arms[1].rotation.x = -0.6 - Math.sin(t * 3 + i) * 0.3);
  tPreg.userData.pop((t - 0.8) / 0.35); if (t > 3.8) tPreg.visible = false; tTeam.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(60.0, 60.3, u), lerp(1.8, 1.7, u), lerp(1.8, -1.0, u), lerp(59.8, 60.5, u), 1.35, -12, 58);
  return qs;
}
function shotDoor(t, T) { // 25〜33：謎の感染が広がる。父は娘を守り、生き延びられるか
  base(); S.aim(90, -2); lift(80);
  S.darken(0.5, '#141418'); S.hemi.intensity = 0.7; S.key.intensity = 0.2; RED.intensity = 4 + Math.sin(T * 6) * 2;
  SHADOWS.forEach((p, i) => { p.userData.arms.forEach((a, k) => a.rotation.x = -Math.PI * 0.55 + Math.sin(T * 8 + i + k) * 0.25); p.position.z = -4.9 - i * 0.5 + Math.sin(T * 6 + i) * 0.06; });
  GLASS.position.x = 90 + Math.sin(T * 30) * 0.004;
  kid4.userData.head.rotation.y = 0.3; dad4.userData.arms[0].rotation.x = -0.5; dad4.rotation.y = Math.PI;
  tInf.userData.pop((t - 0.8) / 0.35); if (t > 4.0) tInf.visible = false;
  tProtect.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(91.2, 91.0, u), lerp(1.6, 1.65, u), lerp(2.6, 2.0, u), 89.85, 1.15, -4.3, 58);
  return qs;
}
function shotMap(t) { // 33〜42：韓国発のパニック・ホラー。ソウルから釜山へ
  base(); S.aim(120, 0); lift(200);
  S.hemi.intensity = 1.25;
  ROUTE.forEach((s, i) => { const k = clamp((t - 0.6 - i * 0.35) / 0.35); s.visible = k > 0; s.scale.x = Math.max(0.01, k); });
  mini.visible = t > 0.6; { const u = clamp((t - 0.6) / 2.2); mini.position.set(120 + lerp(-0.5, 1.1, u), 0.08, lerp(-2.4, 2.5, u)); mini.rotation.y = -Math.atan2(4.9, 1.6); }
  tSeoul.userData.pop((t - 0.3) / 0.35); tBusan.userData.pop((t - 2.6) / 0.35);
  tKorea.userData.pop((t - 0.6) / 0.35); tGenre.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(120, lerp(10.6, 11.0, u), lerp(3.8, 4.2, u), 120, 0, lerp(-0.2, 0, u), 56);
  return qs;
}
function nightRun(T) { // 夜の線路を走る列車（電柱が流れて速さを出す）
  S.darken(0.85, '#0a0e18'); S.hemi.intensity = 0.4; S.key.intensity = 0.25;
  T2.position.set(150 + 4, 0.3, 0);
  POLES.forEach((p, i) => { p.position.x = 130 + (((i * 6 - T * 38) % 48) + 48) % 48; });
}
function shotPun(t, T) { // 42〜49：決め手。感染者を乗せた超高速の密室。邦題は日本のあの列車のだじゃれ
  base(); S.aim(150, 0); lift(0);
  nightRun(T);
  tBox.position.set(152.9, 5.3, 4); tPun.position.set(152.9, 4.4, 4);
  tBox.userData.pop((t - 0.4) / 0.35); tPun.userData.pop((t - 3.4) / 0.35);
  const u = ease(t / 7);
  look(lerp(156.0, 155.0, u), lerp(2.6, 3.0, u), lerp(9.0, 10.0, u), 150.6, 3.6, 0, 58);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：この映画、わかった？（夜を走る列車を正面から）
  base(); S.aim(150, 0); lift(-120);
  nightRun(T);
  const u = ease(t / 7);
  look(lerp(170, 168, u), lerp(1.8, 2.2, u), lerp(4.0, 4.6, u), 156, 2.0, 0, 52);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotBoard(t, T) },
  { a: 9, b: 17, f: shotDad },
  { a: 17, b: 25, f: shotPax },
  { a: 25, b: 33, f: (t, T) => shotDoor(t, T) },
  { a: 33, b: 42, f: shotMap },
  { a: 42, b: 49, f: (t, T) => shotPun(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '発車の直前、ひとりの<br>女性が飛び乗った。'],
  [5.6, 9.0, 'その様子は、<br>どこかおかしい。'],
  [9.2, 13.2, '仕事ばかりの父親と、<br>幼い娘。'],
  [13.2, 17.0, '娘の誕生日、<br>母に会いに向かう。'],
  [17.2, 21.0, '乗り合わせたのは、<br>妊婦とその夫。'],
  [21.0, 25.0, '高校の野球部員たち。<br>いつもの旅のはずだった。'],
  [25.2, 29.0, 'やがて車内で、<br>謎の感染が広がる。'],
  [29.0, 33.0, '父は娘を守り、<br>生き延びられるか。'],
  [33.2, 37.4, '韓国発の、<br>パニック・ホラー。'],
  [37.4, 41.8, 'ソウルから釜山へ、<br>高速鉄道の旅。'],
  [42.2, 45.4, '感染者を乗せた、<br>超高速の密室。'],
  [45.4, 49.0, '邦題は、日本の<br>あの列車のだじゃれ。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、新感染<br>ファイナル・エクスプレス。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q019', v2: true, answer: '新感染 ファイナル・エクスプレス',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 1919,
    hits: [5.6, 25.2, 56.4], risers: [52.0],
    impacts: [0.3, 5.6, 25.2, 33.2, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [25.4, 'alarm'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.4, 'drone'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '発車': 'はっしゃ', '直前': 'ちょくぜん', '女性': 'じょせい', '飛び乗った': 'とびのった', '様子': 'ようす', '仕事': 'しごと', '父親': 'ちちおや', '幼い': 'おさない', '娘': 'むすめ', '誕生日': 'たんじょうび', '母': 'はは', '会いに': 'あいに', '向かう': 'むかう', '乗り合わせた': 'のりあわせた', '妊婦': 'にんぷ', '夫': 'おっと', '高校': 'こうこう', '野球部員': 'やきゅうぶいん', '旅': 'たび', '車内': 'しゃない', '謎': 'なぞ', '感染': 'かんせん', '広がる': 'ひろがる', '父': 'ちち', '守り': 'まもり', '生き延び': 'いきのび', '韓国発': 'かんこくはつ', '釜山': 'プサン', '高速鉄道': 'こうそくてつどう', '感染者': 'かんせんしゃ', '乗せた': 'のせた', '超高速': 'ちょうこうそく', '密室': 'みっしつ', '邦題': 'ほうだい', '日本': 'にほん', '列車': 'れっしゃ', '新感染': 'しんかんせん' },
    caption: 'この映画のタイトル、わかる？\n発車の直前、ひとりの女性が列車に飛び乗った。その様子は、どこかおかしい。乗っていたのは、仕事ばかりの父親と、母に会いに行く幼い娘。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画好き', 'パニック映画'],
  },
});
applyQuizCards({ answer: '新感染<br><span style="font-size:68px">ファイナル・エクスプレス</span>', info: 'Netflix｜韓国映画・118分', answerSize: 128 });
