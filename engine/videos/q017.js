import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #017 西部戦線異状なし（映画・ドイツ・2022年・147分。Netflixで見放題、justwatch.com/jp/映画/all-quiet-on-the-western-front-2022 で2026/11/2確認。Filmarks 3.9 filmarks.com/movies/105398）
// 設定：第一次世界大戦。17歳のドイツの少年パウルは、祖国のために戦うという高揚感を胸に、学校の仲間とともに志願して西部戦線へ向かう。
//       そこで想像を超える絶望と恐怖に直面していく。原作はドイツの作家レマルクの長編小説。第95回アカデミー賞で国際長編映画賞など4部門を受賞（映画.com の作品解説・JustWatch・Filmarks の作品ページ）
// 構成（ヒント6段）：1 17歳の仲間たちが同じ紙に名前を書く → 2 支給の服で列車へ → 3 泥と霧の世界 → 4 仲間と、生きて帰ること → 5 第一次世界大戦・ドイツの若い兵士 → 6 決め手：約100年前のドイツの名作小説が原作・アカデミー賞4冠
// 結末には触れない。人が傷つく場面・血・遺体は出さない（遠くの光と音だけ）。作品の映像・俳優・ポスター・有名な場面の構図は使わない。旗や紋章も出さない。人と町は汎用の3D

const S = quizStage({ bg: '#9fb2c4', floor: '#6a6458', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(1717);
const BOY = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f', '#f5d3b5', '#ecc4a0'][i], hair: ['#6b4a33', '#c9a46a', '#2c2421', '#8a5a3a', '#4a3426'][i], shirt: ['#3a4a6a', '#6a5a4a', '#4a5a4a', '#7a6a5a', '#3b3f4a'][i], pants: ['#2b3346', '#3b3f4a', '#4a4038', '#2f3540', '#3a342c'][i], scale: 0.94 });
const GREY = { shirt: '#6b6f5e', pants: '#5c604f' };
const HELM_M = mat('#4e5446');
function helmet(p) { p.userData.head.children.forEach(c => { if (c.position.y >= 0.33) c.visible = false; }); const h = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), HELM_M); h.position.y = 0.40; h.scale.set(1, 0.8, 1.05); p.userData.head.add(h); const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.33, 0.05, 18), HELM_M); rim.position.y = 0.40; p.userData.head.add(rim); return h; }
function pack(p) { const b = box(0.4, 0.42, 0.18, mat('#5a4a36')); b.position.set(0, 1.2, -0.22); p.add(b); }
function soldier(i, opt = {}) { const p = makePerson({ ...BOY(i), ...GREY }); if (opt.helmet !== false) helmet(p); if (opt.pack) pack(p); return p; }

// ---------- 1. 町の広場、同じ紙に名前を書く（x=0）。0秒目がサムネ ----------
const SQ = new THREE.Group(); SQ.position.set(0, 0, 0); qs.add(SQ);
{ const pave = box(20, 0.04, 14, mat('#a49a88')); pave.position.set(0, 0.02, 2); SQ.add(pave);
  for (const [x, w, h, c] of [[-7, 4, 7, '#9a5a44'], [-3, 3.6, 8.5, '#b8a888'], [1, 4.2, 7.5, '#8a6a54'], [5.2, 3.8, 9, '#c4b49a'], [9, 3.4, 7, '#9a7a5a']]) {
    const b = box(w, h, 3, mat(c)); b.position.set(x, h / 2, 9); SQ.add(b);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 2.2, 4), mat('#5a3a30')); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.6; roof.position.set(x, h + 1.1, 9); SQ.add(roof);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), mat('#e8e0c8')); wn.position.set(x - w / 4 + k * w / 2, 2.2 + r * 2.0, 7.49); wn.rotation.y = Math.PI; SQ.add(wn); } }
  // 三角の小旗（色だけ。紋章や国旗は出さない）
  for (let i = 0; i < 18; i++) { const u = i / 17; const f = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 3), new THREE.MeshLambertMaterial({ color: ['#e6b450', '#d8d2c4', '#8a3a30'][i % 3] })); f.rotation.x = Math.PI; f.position.set(lerp(-6, 6, u), 4.6 - Math.sin(u * Math.PI) * 0.8, 4.5); SQ.add(f); }
  const tbl = box(2.2, 0.8, 1.0, mat('#5a4030')); tbl.position.set(0, 0.4, -1.6); SQ.add(tbl);
  const paper = box(0.8, 0.02, 0.6, mat('#f4efe0')); paper.position.set(0, 0.82, -1.5); SQ.add(paper);
  const pen = box(0.04, 0.04, 0.4, mat('#1a1a1a')); pen.position.set(0.3, 0.84, -1.4); pen.rotation.y = 0.6; SQ.add(pen); }
const officer = makePerson({ skin: '#e8b98f', hair: '#4a4a4a', shirt: '#5c604f', pants: '#4a4e40' }); officer.position.set(1.9, 0, -2.0); officer.rotation.y = -0.5; qs.add(officer);
{ const cap = box(0.44, 0.12, 0.44, mat('#4a4e40')); cap.position.y = 0.52; officer.userData.head.add(cap); const vis = box(0.44, 0.03, 0.14, mat('#1a1a1a')); vis.position.set(0, 0.47, 0.25); officer.userData.head.add(vis); }
const FIVE = [0, 1, 2, 3, 4].map(i => { const p = makePerson(BOY(i)); p.position.set(-1.8 + i * 0.9, 0, -0.3 + (i % 2) * 0.35); p.rotation.y = Math.PI; qs.add(p); return p; });
const t17 = tag('17歳', { size: 84, w: 240, bg: '#e6b450', color: '#14161c' }); t17.position.set(-1.8, 2.25, -0.3); qs.add(t17);

// ---------- 2. 駅のホーム、列車に乗りこむ（x=30） ----------
const ST = new THREE.Group(); ST.position.set(30, 0, 0); qs.add(ST);
{ const plat = box(26, 0.6, 4, mat('#9a948a')); plat.position.set(0, 0.3, 0); ST.add(plat);
  const edge = box(26, 0.06, 0.3, mat('#e8e0c8')); edge.position.set(0, 0.62, -1.85); ST.add(edge);
  const roofM = mat('#4a4440');
  const roof = box(26, 0.2, 5, roofM); roof.position.set(0, 4.6, 0.4); roof.castShadow = false; ST.add(roof);
  for (let i = 0; i < 6; i++) { const c = box(0.2, 4, 0.2, roofM); c.position.set(-11 + i * 4.4, 2.6, 2.4); ST.add(c); }
  for (let k = 0; k < 3; k++) { const car = new THREE.Group(); car.position.set(-8 + k * 8.4, 0, -3.6); ST.add(car);
    const body = box(7.8, 2.8, 2.6, mat(k === 0 ? '#3a2a24' : '#5a3a30')); body.position.y = 2.0; car.add(body);
    const top = box(7.9, 0.2, 2.7, mat('#2a2220')); top.position.y = 3.5; car.add(top);
    for (let w = 0; w < 5; w++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ color: '#e8d8a8' })); wn.position.set(-3 + w * 1.5, 2.5, 1.31); car.add(wn); }
    if (k === 1) { const dr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.2), new THREE.MeshBasicMaterial({ color: '#f4e4b8' })); dr.position.set(0, 1.7, 1.32); car.add(dr); }
    for (const x of [-2.8, 2.8]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.7, 16), mat('#1a1a1a')); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.45, 0); car.add(wh); } } }
const STEAM = []; for (let i = 0; i < 8; i++) { if (0) {} const s = new THREE.Mesh(new THREE.SphereGeometry(0.6 + R() * 0.5, 10, 8), new THREE.MeshLambertMaterial({ color: '#e8e8e8', transparent: true, opacity: 0.55 })); qs.add(s); STEAM.push(s); }
const RIDERS = [0, 1, 2, 3].map(i => { const p = soldier(i, { helmet: false, pack: true }); p.position.set(28 + i * 1.0, 0.6, 0.2); qs.add(p); const cap = box(0.42, 0.1, 0.42, mat('#5c604f')); cap.position.y = 0.5; p.userData.head.add(cap); return p; });
const tProud = tag('高揚感', { size: 84, w: 320, bg: '#e6b450', color: '#14161c' }); tProud.position.set(29.5, 2.55, 0.2); qs.add(tProud);

// ---------- 3・6（クイズ）. 泥と霧の野原（x=60） ----------
const MUD = new THREE.Group(); MUD.position.set(60, 0, 0); qs.add(MUD);
{ const g = box(60, 0.05, 50, mat('#5a4e40')); g.position.set(0, 0.025, -10); MUD.add(g);
  for (let i = 0; i < 26; i++) { const r = 0.6 + R() * 1.4; const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.6, 0.08, 16), mat('#3e352c')); c.position.set((R() - 0.5) * 26, 0.05, -2 - R() * 24); MUD.add(c); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.12, 6, 18), mat('#6a5c4a')); rim.rotation.x = Math.PI / 2; rim.position.copy(c.position); rim.position.y = 0.08; MUD.add(rim); }
  // 枯れ木
  for (let i = 0; i < 9; i++) { const t = box(0.22, 2.4 + R() * 2.4, 0.22, mat('#2e2620')); const h = t.geometry.parameters.height; t.position.set((R() - 0.5) * 24, h / 2, -5 - R() * 18); t.rotation.z = (R() - 0.5) * 0.3; MUD.add(t); const b = box(0.12, 1.0, 0.12, mat('#2e2620')); b.position.set(t.position.x + 0.3, h * 0.7, t.position.z); b.rotation.z = -0.8; MUD.add(b); }
  // 有刺鉄線の杭
  for (let i = 0; i < 14; i++) { const x = -9 + i * 1.4; const p = box(0.1, 1.0, 0.1, mat('#3a3028')); p.position.set(x, 0.5, -1.4 + Math.sin(i) * 0.3); p.rotation.z = (R() - 0.5) * 0.4; MUD.add(p); }
  for (const y of [0.45, 0.8]) { const w = box(18.2, 0.02, 0.02, mat('#2a2a2a')); w.position.set(0.1, y, -1.4); MUD.add(w); } }
const FLASH = new THREE.PointLight(0xffc070, 0, 60, 1.0); FLASH.position.set(66, 3, -26); qs.add(FLASH);
const glow = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffcf80', transparent: true, opacity: 0 })); glow.position.set(66, 0.6, -30); glow.material.fog = false; qs.add(glow);
const walker = soldier(0, { pack: true }); walker.position.set(60, 0, 1.5); qs.add(walker);

// ---------- 4. 塹壕で、パンを分け合う（x=90） ----------
const TR = new THREE.Group(); TR.position.set(90, 0, 0); qs.add(TR);
{ const floorT = box(10, 0.05, 2.4, mat('#4a3e32')); floorT.position.set(0, 0.025, 0); TR.add(floorT);
  for (const z of [-1.3]) { const wall = box(10, 2.2, 0.3, mat('#5a4a38')); wall.position.set(0, 1.1, z); TR.add(wall);
    for (let i = 0; i < 20; i++) { const pl = box(0.46, 2.1, 0.06, mat(i % 2 ? '#6a5640' : '#5e4c38')); pl.position.set(-4.75 + i * 0.5, 1.05, z + (z < 0 ? 0.17 : -0.17)); TR.add(pl); } }
  for (let i = 0; i < 18; i++) { const sb = box(0.62, 0.3, 0.42, mat(i % 2 ? '#8a7a5c' : '#7a6c50')); sb.position.set(-4.6 + i * 0.55, 2.35 + (i % 3 === 0 ? 0.25 : 0), -1.3); TR.add(sb); }
  const bench = box(3.6, 0.4, 0.5, mat('#6a5640')); bench.position.set(0, 0.2, -0.85); TR.add(bench);
  const lamp = box(0.2, 0.3, 0.2, mat('#2a2a2a')); lamp.position.set(1.6, 1.5, -1.05); TR.add(lamp); }
const TRL = new THREE.PointLight(0xffc070, 0, 6, 1.3); TRL.position.set(91.6, 1.5, -0.7); qs.add(TRL);
const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lampBulb.position.set(91.6, 1.45, -0.92); qs.add(lampBulb);
const MATES = [0, 2, 3].map((i, k) => { const p = soldier(i); p.position.set(89.0 + k * 1.0, 0, -0.75); p.rotation.y = k === 2 ? -0.5 : (k === 0 ? 0.5 : 0); qs.add(p); return p; });
const vet = makePerson({ skin: '#e2b088', hair: '#3a2a20', ...GREY, scale: 1.08 }); helmet(vet); vet.position.set(92.2, 0, -0.2); vet.rotation.y = -1.2; qs.add(vet);
const bread = box(0.32, 0.14, 0.18, mat('#b07840')); qs.add(bread);
const tMate = tag('仲間', { size: 80, w: 260, bg: '#e6b450', color: '#14161c' }); tMate.position.set(90, 2.5, -0.5); qs.add(tMate);
const tHome = tag('生きて帰る', { size: 76, w: 440, bg: '#e2483c' }); tHome.position.set(90.6, 2.8, -0.6); qs.add(tHome);

// ---------- 5. 地図の上の長い塹壕線（x=120） ----------
const MAP = new THREE.Group(); MAP.position.set(120, 0, 0); qs.add(MAP);
{ const board = box(8, 0.1, 6, mat('#6a5640')); board.position.y = 0.05; MAP.add(board);
  const tex = canvasTex(800, 600, (g, w, h) => { g.fillStyle = '#e4dcc4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b8ac90'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, i * 55); g.bezierCurveTo(250, i * 55 + 30, 550, i * 55 - 30, w, i * 55 + 10); g.stroke(); }
    g.strokeStyle = '#a8c0d0'; g.lineWidth = 12; g.beginPath(); g.moveTo(80, 0); g.bezierCurveTo(200, 200, 60, 400, 140, 600); g.stroke(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 5.8), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -Math.PI / 2; m.position.y = 0.11; MAP.add(m); }
const LINE = []; { let x = -3.4, z = -2.6; for (let i = 0; i < 22; i++) { const nx = x + 0.32, nz = z + 0.24 + (i % 2 ? 0.08 : -0.06); const dx = nx - x, dz = nz - z; const seg = box(Math.hypot(dx, dz) + 0.04, 0.06, 0.09, mat('#7a2a24')); seg.position.set(120 + (x + nx) / 2, 0.15, (z + nz) / 2); seg.rotation.y = -Math.atan2(dz, dx); qs.add(seg); LINE.push(seg); x = nx; z = nz; } }
const PINS = []; for (const [x, z] of [[-1.2, -0.9], [0.6, 0.4], [2.1, 1.5]]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), HELM_M); h.position.set(120 + x, 0.12, z); qs.add(h); PINS.push(h); }
const tWar = tag('第一次世界大戦', { size: 70, w: 560, bg: '#14161c' }); tWar.position.set(120, 1.6, -2.2); qs.add(tWar);
const tGer = tag('ドイツの若い兵士', { size: 66, w: 580, bg: '#e2483c' }); tGer.position.set(120, 1.2, 1.4); qs.add(tGer);

// ---------- 6. 古い本（x=150）：原作と受賞 ----------
const BOOK = new THREE.Group(); BOOK.position.set(150, 0, 0); qs.add(BOOK);
{ const desk = box(5, 0.9, 3, mat('#4a3424')); desk.position.y = 0.45; BOOK.add(desk); const wall = box(10, 7, 0.2, mat('#3a2a20')); wall.position.set(0, 3.5, -2.4); BOOK.add(wall);
  const pageTex = canvasTex(512, 360, (g, w, h) => { g.fillStyle = '#efe6cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#9a8e74'; for (let s = 0; s < 2; s++) for (let i = 0; i < 14; i++) { const x0 = s ? 280 : 30; g.fillRect(x0, 34 + i * 22, 200 - (i % 4 === 3 ? 70 : 0), 6); } g.fillStyle = '#c8bca0'; g.fillRect(w / 2 - 2, 0, 4, h); });
  const pages = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.5), [mat('#e8dcc0'), mat('#e8dcc0'), new THREE.MeshLambertMaterial({ map: pageTex }), mat('#5a2a20'), mat('#e8dcc0'), mat('#e8dcc0')]); pages.position.set(0, 0.96, 0.1); BOOK.add(pages);
  const cover = box(2.3, 0.04, 1.6, mat('#5a2a20')); cover.position.set(0, 0.9, 0.1); BOOK.add(cover);
  const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 10), mat('#f4efe0')); cand.position.set(1.7, 1.1, -0.6); BOOK.add(cand);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffcf70' })); fl.scale.y = 1.7; fl.position.set(1.7, 1.36, -0.6); BOOK.add(fl);
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), HELM_M); hl.position.set(-1.7, 0.9, -0.5); BOOK.add(hl); }
const BKL = new THREE.PointLight(0xffc870, 0, 7, 1.3); BKL.position.set(151.7, 1.6, -0.3); qs.add(BKL);
const STARS = []; for (let i = 0; i < 4; i++) { const tx = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#e6b450'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 24 : 58; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } g.closePath(); g.fill(); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false })); s.scale.set(0.5, 0.5, 1); s.renderOrder = 9; s.position.set(148.95 + i * 0.7, 2.25, 0.2); qs.add(s); STARS.push(s); }
const tNovel = tag('原作は名作小説', { size: 70, w: 560, bg: '#14161c' }); tNovel.position.set(150, 1.75, 0.3); qs.add(tNovel);
const tOscar = tag('アカデミー賞 4冠', { size: 70, w: 580, bg: '#e6b450', color: '#14161c' }); tOscar.position.set(150, 2.8, 0.2); qs.add(tOscar);

// ---------- shots ----------
const ALL = [t17, tProud, tMate, tHome, tWar, tGer, tNovel, tOscar];
function base() { STEAM.forEach(s => s.visible = false); S.reset(); ALL.forEach(x => x.visible = false); FLASH.intensity = 0; glow.material.opacity = 0; TRL.intensity = 0; BKL.intensity = 0; STARS.forEach(s => s.visible = false); bread.visible = false; }
function shells(T, k = 1) { // 遠くの光（爆発そのものは見せない）
  const c = (T * 0.9) % 1; const f = c < 0.12 ? (1 - c / 0.12) : 0; FLASH.intensity = f * 18 * k; glow.material.opacity = f * 0.7 * k; FLASH.position.x = 60 + ((Math.floor(T * 0.9) * 37) % 16) - 4; glow.position.x = FLASH.position.x;
}

function shotSign(t, T) { // 0〜9：17歳の仲間たちが、同じ紙に名前を書く（0秒目がサムネ）
  base(); S.aim(0, -1); lift(60);
  S.hemi.intensity = 1.35; S.key.intensity = 1.6;
  FIVE.forEach((p, i) => { const up = i === 4 ? clamp((T - 1.0) / 0.4) : clamp((T - 4.6 - i * 0.25) / 0.3); p.userData.arms[1].rotation.x = -Math.PI * 0.9 * up; p.userData.arms[0].rotation.x = 0; });
  // 0秒目：ひとりが紙に手をのばしている
  FIVE[2].userData.arms[0].rotation.x = T < 4.4 ? -0.9 : 0;
  t17.userData.pop((T - 3.0) / 0.35); if (T > 6.8) t17.visible = false;
  const u = ease(T / 9);
  look(lerp(1.4, 0.4, u), lerp(2.9, 3.1, u), lerp(-6.2, -6.9, u), lerp(-0.2, 0, u), lerp(1.0, 1.2, u), lerp(0.4, 0.2, u), 54);
  return qs;
}
function shotTrain(t) { // 9〜17：支給の服で、列車に乗りこむ
  base(); S.aim(30, -1); lift(80);
  S.hemi.intensity = 1.2; S.key.intensity = 1.3;
  RIDERS.forEach((p, i) => { const k = clamp((t - 2.5 - i * 0.5) / 2.2); p.position.set(lerp(28 + i * 1.0, 30.4, ease(k)), 0.6, lerp(0.2, -2.0, ease(k))); p.rotation.y = k > 0 ? Math.PI : 0; p.visible = k < 1; poseWalk(p, t * 7 + i, k > 0 && k < 1 ? 1 : 0); p.position.y = 0.6 + (k > 0 && k < 1 ? Math.abs(Math.cos(t * 7 + i)) * 0.04 : 0); p.userData.arms[1].rotation.x = (k === 0 && t > 0.6) ? -Math.PI * 0.85 * clamp((t - 0.6) / 0.3) : p.userData.arms[1].rotation.x; });
  STEAM.forEach((s, i) => { s.visible = true; const u = ((t * 0.25 + i / STEAM.length) % 1); s.position.set(22.5 + u * 3, 4.2 + u * 3.2, -3.6 + Math.sin(i) * 0.5); s.scale.setScalar(0.6 + u * 1.6); s.material.opacity = 0.6 * (1 - u); });
  tProud.userData.pop((t - 0.8) / 0.35); if (t > 2.4) tProud.visible = false;
  const u = ease(t / 8);
  look(lerp(31.4, 30.4, u), lerp(2.3, 2.6, u), lerp(6.6, 7.8, u), lerp(29.6, 29.4, u), 1.7, lerp(-0.4, -1.4, u), 54);
  return qs;
}
function mudLight(d = 1) { S.darken(0.55 * d, '#3a3a38'); S.hemi.intensity = lerp(1.25, 0.75, d); S.key.intensity = lerp(1.5, 0.3, d); qs.fog.near = lerp(24, 6, d); qs.fog.far = lerp(80, 30, d); }
function fogReset() { qs.fog.near = 24; qs.fog.far = 80; }
function shotMud(t, T) { // 17〜25：泥と霧の世界。笑い声はすぐに消えた
  base(); fogReset(); S.aim(60, 0); lift(80);
  mudLight(1); shells(T, 0.7);
  walker.position.set(60, 0, lerp(2.5, -1.0, t / 8)); walker.rotation.y = Math.PI; poseWalk(walker, t * 5, 0.7);
  walker.userData.head.rotation.x = 0.2;
  const u = ease(t / 8);
  look(lerp(61.2, 60.6, u), lerp(1.4, 1.9, u), lerp(6.4, 4.6, u), 60, lerp(1.4, 1.2, u), -6, 54);
  return qs;
}
function shotMates(t) { // 25〜33：支えは仲間だけ。目的は、生きて帰ること
  base(); fogReset(); S.aim(90, 0); lift(80);
  S.darken(0.6, '#2a2a2c'); S.hemi.intensity = 0.7; S.key.intensity = 0.35; TRL.intensity = 4;
  bread.visible = true; const k = ease((t - 0.6) / 1.4); bread.position.set(lerp(91.8, 90.4, k), 1.0, lerp(-0.25, -0.5, k));
  vet.userData.arms[1].rotation.x = -1.1 * (1 - clamp((t - 2.2) / 0.5)); MATES[1].userData.arms[0].rotation.x = -1.0 * clamp((t - 1.6) / 0.5);
  MATES.forEach(p => p.userData.head.rotation.x = 0.1);
  tMate.userData.pop((t - 1.6) / 0.35); if (t > 4.0) tMate.visible = false;
  tHome.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(90.6, 90.2, u), lerp(1.7, 2.0, u), lerp(3.4, 4.3, u), 90.4, 1.2, -0.9, 60);
  return qs;
}
function shotMap(t) { // 33〜42：第一次世界大戦。ドイツの若い兵士
  base(); fogReset(); S.aim(120, 0); lift(60);
  S.hemi.intensity = 1.2; S.key.intensity = 1.2;
  LINE.forEach((s, i) => { const k = clamp((t - 0.4 - i * 0.07) / 0.2); s.visible = k > 0; s.scale.x = Math.max(0.01, k); });
  PINS.forEach((h, i) => { const k = easeOut(clamp((t - 4.6 - i * 0.25) / 0.3)); h.visible = k > 0; h.scale.setScalar(Math.max(0.01, k)); });
  tWar.userData.pop((t - 1.0) / 0.35); tGer.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(120, lerp(7.6, 8.4, u), lerp(6.4, 7.0, u), 120, 0, lerp(0.6, 0.2, u), 54);
  return qs;
}
function shotBook(t) { // 42〜49：決め手。約100年前のドイツの名作小説が原作。アカデミー賞4冠
  base(); fogReset(); S.aim(150, 0); lift(120);
  S.darken(0.75, '#140f0c'); S.hemi.intensity = 0.45; S.key.intensity = 0.25; BKL.intensity = 6 + Math.sin(t * 9) * 0.5;
  tNovel.userData.pop((t - 0.4) / 0.35);
  tOscar.userData.pop((t - 3.4) / 0.35);
  STARS.forEach((s, i) => { const k = easeOut(clamp((t - 3.9 - i * 0.18) / 0.25)); s.visible = k > 0; s.scale.set(0.3 * k, 0.3 * k, 1); s.position.set(149.32 + i * 0.45, 2.27, 0.25); });
  const u = ease(t / 7);
  look(lerp(150.4, 150.1, u), lerp(2.6, 2.9, u), lerp(4.0, 4.6, u), 150, 1.8, -0.2, 56);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：この映画、わかった？（泥の野原、霧の中の兵士）
  base(); fogReset(); S.aim(60, 0); lift(40);
  mudLight(1); shells(T, 1);
  walker.position.set(60, 0, -1.4); walker.rotation.y = Math.PI; poseWalk(walker, 0, 0); walker.userData.head.rotation.x = -0.1;
  const u = ease(t / 7);
  look(lerp(61.0, 60.6, u), lerp(1.5, 1.7, u), lerp(3.6, 2.9, u), 60, 1.5, -10, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotSign(t, T) },
  { a: 9, b: 17, f: shotTrain },
  { a: 17, b: 25, f: shotMud },
  { a: 25, b: 33, f: shotMates },
  { a: 33, b: 42, f: shotMap },
  { a: 42, b: 49, f: shotBook },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '17歳の少年と、<br>学校の仲間たち。'],
  [5.6, 9.0, 'みんなで、同じ紙に<br>名前を書いた。'],
  [9.2, 13.2, '胸にあるのは、<br>誇らしい高揚感。'],
  [13.2, 17.0, '支給された服を着て、<br>列車に乗りこむ。'],
  [17.2, 21.0, 'たどり着いたのは、<br>泥と霧の世界。'],
  [21.0, 25.0, '笑い声は、<br>すぐに消えた。'],
  [25.2, 29.0, '支えは、となりにいる<br>仲間だけ。'],
  [29.0, 33.0, '目的はただひとつ、<br>生きて帰ること。'],
  [33.2, 37.4, '時代は、<br>第一次世界大戦。'],
  [37.4, 41.8, '少年は、<br>ドイツの若い兵士。'],
  [42.2, 45.4, '原作は、約100年前の<br>ドイツの名作小説。'],
  [45.4, 49.0, 'アカデミー賞で、<br>4つの賞に輝いた。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>西部戦線異状なし。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q017', v2: true, answer: '西部戦線異状なし',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 1717,
    hits: [5.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 21.0, 33.2, 42.2, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [17.6, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '17歳': 'じゅうななさい', '少年': 'しょうねん', '学校': 'がっこう', '仲間': 'なかま', '同じ紙': 'おなじかみ', '名前': 'なまえ', '書いた': 'かいた', '胸': 'むね', '誇らしい': 'ほこらしい', '高揚感': 'こうようかん', '支給': 'しきゅう', '服': 'ふく', '着て': 'きて', '列車': 'れっしゃ', '乗りこむ': 'のりこむ', '泥': 'どろ', '霧': 'きり', '世界': 'せかい', '笑い声': 'わらいごえ', '消えた': 'きえた', '支え': 'ささえ', '目的': 'もくてき', '生きて帰る': 'いきてかえる', '時代': 'じだい', '第一次世界大戦': 'だいいちじせかいたいせん', '若い兵士': 'わかいへいし', '原作': 'げんさく', '約100年前': 'やくひゃくねんまえ', '名作小説': 'めいさくしょうせつ', '4つの賞': 'よっつのしょう', '輝いた': 'かがやいた', '西部戦線異状なし': 'せいぶせんせんいじょうなし' },
    caption: 'この映画のタイトル、わかる？\n17歳の少年と、学校の仲間たち。みんなで同じ紙に名前を書き、誇らしい気持ちで列車に乗りこんだ。たどり着いたのは、泥と霧の世界。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画好き', '名作映画'],
  },
});
applyQuizCards({ answer: '西部戦線<br>異状なし', info: 'Netflix｜ドイツ映画・147分', answerSize: 120 });
