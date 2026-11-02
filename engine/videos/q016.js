import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #016 舞妓さんちのまかないさん（ドラマ・日本・全9話。Netflixで見放題、justwatch.com/jp/テレビ番組/wu-ji-sanchinomakanaisan-2023 で2026/11/2確認。Filmarks 4.1 filmarks.com/dramas/11718/16239）
// 設定：舞妓さんを夢見て、親友と青森から京都へ来た少女。舞妓さんたちが共に暮らす屋形で、親友は期待の舞妓さんに、
//       少女は屋形のみんなのごはんをつくる係になる。華やかな舞妓の世界とふだんのごはん。同じ屋根の下で、ふたりはそれぞれの夢を追いかける
//       （Netflix 公式ニュース「舞妓さんちのまかないさん」発表・Filmarks の作品ページ・Netflix の作品紹介）
// 構成（ヒント6段）：1 親友とふたり、ふるさとを出る → 2 遠く離れた古い町へ → 3 同じ夢の女の子たちが暮らす家 → 4 親友は期待の新星に → 5 夢は京都の舞妓さん、青森から → 6 決め手：もうひとりは、みんなのごはんをつくる係
// 地名（青森・京都）と「舞妓」は5段目まで字幕にも札にも出さない。作品の映像・俳優・ロゴ・有名な場面の構図は使わない。実在の店や屋形の名前は出さない。人と町並みは汎用の3D

const S = quizStage({ bg: '#e8c8a8', floor: '#8a8478', fogNear: 22, fogFar: 70 });
const qs = S.scene;
const R = rng(1616);
const KIYO = { skin: '#f3d2b4', hair: '#1d1a19', shirt: '#e8e2d2', pants: '#4a5a7a' };
const SUMI = { skin: '#f5d8bc', hair: '#1a1416', shirt: '#c45a6a', pants: '#3a3448', long: true };
const KIMONO = ['#c43a4a', '#e88aa0', '#6a8ac8', '#e6b450', '#8ac0a0'];
function maiko(i, scale = 1) { const p = makePerson({ skin: '#f8eadc', hair: '#141214', shirt: KIMONO[i % 5], pants: KIMONO[i % 5], scale }); const obi = box(0.54, 0.2, 0.32, mat(['#e6b450', '#2a3a6a', '#c43a4a'][i % 3])); obi.position.y = 1.0; p.add(obi); const skirt = box(0.56, 0.86, 0.36, mat(KIMONO[i % 5])); skirt.position.y = 0.43; p.add(skirt); p.userData.legs.forEach(l => l.visible = false); const bun = box(0.36, 0.2, 0.3, mat('#141214')); bun.position.set(0, 0.62, -0.04); p.userData.head.add(bun); const kan = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#e88aa0')); kan.position.set(0.16, 0.6, 0.05); p.userData.head.add(kan); return p; }

// 町家（格子の家）
const LATT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4a3020'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1a10'; for (let x = 6; x < w; x += 22) g.fillRect(x, 0, 8, h); });
function machiya(x, z, w = 4, lantern = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); qs.add(g);
  const b = box(w, 2.6, 3, mat('#d8c8a8')); b.position.y = 1.3; g.add(b);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, 1.6), new THREE.MeshLambertMaterial({ map: LATT })); f.position.set(0, 1.0, 1.51); g.add(f);
  const roof = box(w + 0.3, 0.12, 1.0, mat('#3a3a40')); roof.position.set(0, 2.0, 1.8); roof.rotation.x = 0.35; g.add(roof);
  const up = box(w, 1.4, 2.6, mat('#d0c0a0')); up.position.set(0, 3.3, -0.2); g.add(up);
  const roof2 = box(w + 0.3, 0.12, 3.4, mat('#3a3a40')); roof2.position.set(0, 4.1, -0.2); g.add(roof2);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.5, 0.7), new THREE.MeshBasicMaterial({ color: '#f4e8c8' })); win.position.set(0, 3.3, 1.11); g.add(win);
  if (lantern) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 14), new THREE.MeshBasicMaterial({ color: '#fff0d0' })); l.position.set(w / 2 - 0.4, 2.2, 1.7); g.add(l); const lb = box(0.48, 0.06, 0.48, mat('#2a1a10')); lb.position.set(w / 2 - 0.4, 2.5, 1.7); g.add(lb); }
  g.userData.win = win.material; return g;
}

// ---------- 1. 京都の町並み（x=0） ----------
{ const path = box(4, 0.04, 40, mat('#b8b0a0')); path.position.set(0, 0.02, -8); qs.add(path);
  for (let i = 0; i < 12; i++) { const s = box(0.9, 0.05, 0.9, mat(i % 2 ? '#a8a090' : '#c0b8a8')); s.position.set((i % 3 - 1) * 1.1, 0.05, 4 - i * 1.2); qs.add(s); } }
for (let i = 0; i < 6; i++) { machiya(-4.3, 2 - i * 4.2, 4, i % 2 === 0).rotation.y = Math.PI / 2; machiya(4.3, 2 - i * 4.2, 4, i % 2 === 1).rotation.y = -Math.PI / 2; }
const kiyo = makePerson(KIYO); kiyo.position.set(-0.55, 0, 2.2); kiyo.rotation.y = Math.PI; qs.add(kiyo);
const sumi = makePerson(SUMI); sumi.position.set(0.55, 0, 2.2); sumi.rotation.y = Math.PI; qs.add(sumi);
function suitcase(x, c) { const g = new THREE.Group(); const b = box(0.42, 0.6, 0.22, mat(c)); b.position.y = 0.36; g.add(b); const h = box(0.04, 0.4, 0.04, mat('#3a3a40')); h.position.set(0, 0.85, 0); g.add(h); g.position.set(x, 0, 2.15); qs.add(g); return g; }
suitcase(-1.0, '#c4302b'); suitcase(1.0, '#3a6aa0');
const APPLES = new THREE.Group(); APPLES.position.set(-1.0, 0.68, 2.15); qs.add(APPLES);
{ const crate = box(0.5, 0.18, 0.34, mat('#b8905a')); APPLES.add(crate); for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#d8323a')); a.position.set(-0.15 + i * 0.1, 0.13, 0); APPLES.add(a); } }
const tFriend = tag('ここで暮らす', { size: 66, w: 440, bg: '#c43a4a' }); qs.add(tFriend);

// ---------- 2. 屋形（x=30） ----------
const YAKATA = machiya(30, -2.4, 7, true);
{ const noren = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshLambertMaterial({ color: '#3a4a7a', side: THREE.DoubleSide })); noren.position.set(30, 1.6, -0.85); qs.add(noren);
  for (const x of [26, 34]) machiya(x + (x < 30 ? -3.5 : 3.5), -2.4, 4); }
const GROUP = [0, 1, 2, 3].map(i => { const p = maiko(i); p.position.set(28.2 + i * 1.2, 0, 0.2 + (i % 2) * 0.3); qs.add(p); return p; });
const kiyo2 = makePerson(KIYO); kiyo2.position.set(27.8, 0, 1.9); kiyo2.rotation.y = 0.6; qs.add(kiyo2);
const sumi2 = makePerson(SUMI); sumi2.position.set(32.2, 0, 1.9); sumi2.rotation.y = -0.6; qs.add(sumi2);
const NIGHTL = new THREE.PointLight(0xffd8a0, 0, 10, 1.2); NIGHTL.position.set(30, 2.6, 1.5); qs.add(NIGHTL);
const MOON = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color: '#fff4d8', fog: false })); MOON.position.set(33.0, 6.6, -7); qs.add(MOON);
const tHouse = tag('舞妓さんが暮らす家', { size: 62, w: 580, bg: '#c43a4a' }); tHouse.position.set(30, 3.3, 3.0); qs.add(tHouse);

// ---------- 3. 稽古の座敷（x=60） ----------
const ROOM = new THREE.Group(); ROOM.position.set(60, 0, 0); qs.add(ROOM);
const TATAMI = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#c8c08a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,110,60,.35)'; g.lineWidth = 2; for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#3a4a3a'; g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h); });
{ for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), new THREE.MeshLambertMaterial({ map: TATAMI })); t.rotation.x = -Math.PI / 2; t.position.set(-2.7 + i * 1.8, 0.03, -1.2 + j * 3.6); ROOM.add(t); }
  const back = box(8, 3.4, 0.2, mat('#e8dcc0')); back.position.set(0, 1.7, -3); ROOM.add(back);
  const shoji = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f8f2e4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a4a30'; g.lineWidth = 8; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
  for (const x of [-2.2, 0, 2.2]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.4), new THREE.MeshBasicMaterial({ map: shoji })); s.position.set(x, 1.4, -2.88); ROOM.add(s); } }
const dancer = maiko(0, 1.0); dancer.position.set(60, 0, -0.6); qs.add(dancer);
const FAN = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20, 0, Math.PI), new THREE.MeshLambertMaterial({ color: '#e6b450', side: THREE.DoubleSide })); qs.add(FAN);
const tStar = tag('期待の新星', { size: 72, w: 420, bg: '#e6b450', color: '#14161c' }); tStar.position.set(60, 2.6, -0.6); qs.add(tStar);
const SPOTD = new THREE.SpotLight(0xfff0d8, 0, 10, 0.5, 0.5, 1); SPOTD.position.set(60, 5, 1.5); SPOTD.target.position.set(60, 0, -0.6); qs.add(SPOTD); qs.add(SPOTD.target);

// ---------- 4. 台所（x=90） ----------
const KIT = new THREE.Group(); KIT.position.set(90, 0, 0); qs.add(KIT);
{ const back = box(7, 3.2, 0.2, mat('#d8c8a8')); back.position.set(0, 1.6, -2.4); KIT.add(back);
  const counter = box(4.6, 0.9, 0.8, mat('#8a6a4a')); counter.position.set(0, 0.45, -1.7); KIT.add(counter);
  const top = box(4.7, 0.06, 0.86, mat('#c8c0b0')); top.position.set(0, 0.93, -1.7); KIT.add(top);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ color: '#f4e8c8' })); win.position.set(0.6, 2.1, -2.28); KIT.add(win);
  for (let i = 0; i < 5; i++) { const sh = box(0.2 + R() * 0.1, 0.3, 0.2, mat(['#e8e2d2', '#4a6a8a', '#c43a3a'][i % 3])); sh.position.set(-1.8 + i * 0.3, 2.0, -2.2); KIT.add(sh); }
  const shelf = box(1.8, 0.05, 0.3, mat('#6a4a30')); shelf.position.set(-1.2, 1.84, -2.2); KIT.add(shelf); }
const POT = new THREE.Group(); POT.position.set(89.0, 0.96, -1.7); qs.add(POT);
{ const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.36, 20), mat('#3a3a40')); p.position.y = 0.2; POT.add(p); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.04, 20), mat('#5a5a60')); lid.position.y = 0.4; POT.add(lid); POT.userData.lid = lid; }
const PAN = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.08, 20), mat('#2a2a30')); PAN.position.set(90.2, 1.0, -1.7); qs.add(PAN);
const EGG = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16), mat('#f4c040')); EGG.position.set(90.2, 1.05, -1.7); qs.add(EGG);
const STEAM = [];
for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false })); qs.add(s); STEAM.push(s); }
const kiyo3 = makePerson(KIYO); kiyo3.position.set(89.6, 0, -0.8); kiyo3.rotation.y = Math.PI; qs.add(kiyo3);
{ const ap = box(0.52, 0.7, 0.04, mat('#f4f1ea')); ap.position.set(0, 1.0, -0.17); kiyo3.add(ap); }
const tCook = tag('みんなのごはん係', { size: 64, w: 520, bg: '#c43a4a' }); tCook.position.set(89.7, 2.45, -1.4); qs.add(tCook);
const KITL = new THREE.PointLight(0xffd8a0, 5, 8, 1.2); KITL.position.set(90, 2.6, 0); qs.add(KITL);

// ---------- 5. みんなの食卓（x=120） ----------
const TABLE = box(3.2, 0.36, 1.4, mat('#6a4a30')); TABLE.position.set(120, 0.18, -0.6); qs.add(TABLE);
{ for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), new THREE.MeshLambertMaterial({ map: TATAMI })); t.rotation.x = -Math.PI / 2; t.position.set(117.3 + i * 1.8, 0.03, -2.4 + j * 3.6); qs.add(t); }
  const back = box(8, 3.4, 0.2, mat('#e8dcc0')); back.position.set(120, 1.7, -3.2); qs.add(back); }
const DISHES = [];
for (let i = 0; i < 9; i++) { const g = new THREE.Group(); const k = i % 3; const plate = new THREE.Mesh(new THREE.CylinderGeometry(k === 1 ? 0.14 : 0.2, 0.12, k === 1 ? 0.14 : 0.05, 16), mat(k === 1 ? '#3a2a2a' : '#f4f1ea')); plate.position.y = k === 1 ? 0.07 : 0.03; g.add(plate);
  const food = k === 0 ? new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat('#f4f1ea')) : k === 1 ? new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 14), mat('#c8783a')) : box(0.2, 0.06, 0.12, mat('#f4c040')); food.position.y = k === 1 ? 0.14 : 0.1; g.add(food);
  g.position.set(118.9 + (i % 5) * 0.55, 0.37, -0.95 + Math.floor(i / 5) * 0.7); qs.add(g); DISHES.push(g); }
function seated(p, x, z, ry) { p.position.set(x, -0.4, z); p.rotation.y = ry; qs.add(p); return p; }
const DINERS = [seated(maiko(1), 118.4, -1.7, 0), seated(maiko(2), 119.6, -1.7, 0), seated(maiko(3), 120.8, -1.7, 0), seated(makePerson(SUMI), 121.9, -1.6, -0.2), seated(maiko(4), 118.2, 0.6, Math.PI), seated(maiko(0), 121.6, 0.6, Math.PI)];
const kiyo4 = makePerson(KIYO); kiyo4.position.set(122.4, 0, 0.3); kiyo4.rotation.y = -1.0; qs.add(kiyo4);
const TABL = new THREE.PointLight(0xffd8a0, 6, 8, 1.2); TABL.position.set(120, 2.6, 0); qs.add(TABL);

// ---------- 0. ふるさとの道（x=150）。りんごの木の間の一本道 ----------
{ const grass = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), mat('#7a9a5a')); grass.rotation.x = -Math.PI / 2; grass.position.set(150, 0.01, -20); qs.add(grass);
  const road = box(2.6, 0.04, 80, mat('#b8a888')); road.position.set(150, 0.03, -20); qs.add(road);
  for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const tr = new THREE.Group(); tr.position.set(150 + sd * (3.0 + R() * 0.8 + (i % 2) * 2.2), 0, 4 - i * 4.2); qs.add(tr);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.4, 8), mat('#6a4a30')); trunk.position.y = 0.7; tr.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), mat('#4a7a3a')); top.position.y = 1.9; top.scale.y = 0.85; tr.add(top);
    for (let k = 0; k < 7; k++) { const a = R() * Math.PI * 2, e = (R() - 0.3) * 1.0; const ap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat('#d8323a')); ap.position.set(Math.cos(a) * Math.cos(e) * 1.05, 1.9 + Math.sin(e) * 0.9, Math.sin(a) * Math.cos(e) * 1.05); tr.add(ap); } }
  for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(6 + R() * 4, 6 + R() * 5, 6), mat('#7a8aa8')); m.position.set(150 - 24 + i * 8, 2.5, -48 - R() * 6); qs.add(m); }
  for (let i = 0; i < 5; i++) { const c = new THREE.Group(); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1.6 + R() * 0.8, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); b.position.set(k * 1.8 - 1.8, R() * 0.5, 0); b.scale.y = 0.55; c.add(b); } c.position.set(150 - 14 + i * 7 + R() * 2, 12 + R() * 5, -34 - R() * 6); qs.add(c); } }
const kiyo5 = makePerson(KIYO); qs.add(kiyo5);
const sumi5 = makePerson(SUMI); qs.add(sumi5);
function bag(c) { const g = new THREE.Group(); const b = box(0.42, 0.6, 0.22, mat(c)); b.position.y = 0.36; g.add(b); const h = box(0.04, 0.4, 0.04, mat('#3a3a40')); h.position.set(0, 0.85, 0); g.add(h); qs.add(g); return g; }
const BAG1 = bag('#c4302b'), BAG2 = bag('#3a6aa0');
const tWhat = tag('？', { size: 120, w: 220, h: 190, bg: '#e6b450', color: '#14161c' }); qs.add(tWhat);

// ---------- shots ----------
const ALL = [tWhat, tFriend, tHouse, tStar, tCook];
ALL.forEach(x => { x.material.fog = false; });
function base() { S.reset(); ALL.forEach(x => x.visible = false); FAN.visible = false; NIGHTL.intensity = 0; MOON.visible = false; SPOTD.intensity = 0; STEAM.forEach(s => s.visible = false); DISHES.forEach(d => d.visible = true); GROUP.forEach(p => p.visible = true); YAKATA.userData.win.color.set('#f4e8c8'); }
function shotRoad(t, T) { // 1段目 0〜9：親友とふたり、大きな荷物でふるさとを出る（0秒目がサムネ）
  base(); S.aim(150, -2); lift(-120);
  S.darken(0.9, '#8cbce8');
  const z = 1.2 - T * 0.32;
  [[kiyo5, -0.5, 0], [sumi5, 0.5, 1.3]].forEach(([p, x, ph]) => { p.position.set(150 + x, 0, z); p.rotation.y = Math.PI; poseWalk(p, T * 5 + ph, 0.6); p.userData.arms[x < 0 ? 0 : 1].rotation.x = 0; });
  kiyo5.userData.head.rotation.y = T > 4.5 ? -0.7 * ease((T - 4.5) / 0.8) : 0; sumi5.userData.head.rotation.y = T > 4.7 ? 0.6 * ease((T - 4.7) / 0.8) : 0;
  BAG1.position.set(150 - 0.85, 0, z + 0.05); BAG2.position.set(150 + 0.85, 0, z + 0.05);
  tWhat.position.set(150.1, 3.3, z - 0.6); tWhat.userData.pop(T < 0.1 ? 1 : (T - 0.1) / 0.3); if (T > 2.4) tWhat.visible = false;
  const u = ease(T / 9);
  look(lerp(150.4, 150.2, u), lerp(3.4, 3.2, u), lerp(z + 6.0, z + 5.7, u), 150, 1.2, z - 12, 50);
  return qs;
}
function shotStreet(t) { // 2段目 9〜17：たどり着いたのは、遠く離れた古い町（地名・看板は出さない）
  base(); S.aim(0, 0); lift(0);
  S.darken(0.15, '#c87a5a');
  kiyo.userData.head.rotation.y = Math.sin(t * 0.8) * 0.4; sumi.userData.head.rotation.y = Math.sin(t * 0.7 + 1) * 0.3;
  tFriend.position.set(0, 3.9, 1.0); tFriend.userData.pop((t - 4.4) / 0.35);
  const T = t; const u = ease(T / 8);
  look(lerp(0.5, 0.2, u), lerp(2.3, 2.0, u), lerp(9.4, 8.0, u), 0, lerp(2.2, 2.0, u), -4, 56);
  return qs;
}
function shotHome(t) { // 3段目 17〜25：同じ夢を持つ女の子たちが暮らす古い家。夕方、灯りがともる（舞妓の姿はまだ見せない）
  base(); S.aim(30, -1); lift(260);
  GROUP.forEach(p => p.visible = false);
  const d = 0.6; S.hemi.intensity = lerp(1.25, 0.6, d); S.key.intensity = lerp(1.5, 0.3, d); S.darken(0.55, '#8a4a5a'); NIGHTL.intensity = 6; MOON.visible = true;
  YAKATA.userData.win.color.set('#ffd890');
  kiyo2.rotation.y = 2.6; sumi2.rotation.y = -2.6;
  const u = ease(t / 8);
  look(lerp(30.4, 30.1, u), lerp(2.5, 2.4, u), lerp(12.6, 11.4, u), 30, 2.2, -1, 56);
  return qs;
}
function shotHouse(t) { // 5段目 33〜42：ふたりの夢は京都の舞妓さん。青森からやってきた
  base(); S.aim(30, -1); lift(260);
  kiyo2.rotation.y = 0.6; sumi2.rotation.y = -0.6;
  GROUP.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.3; p.userData.arms[0].rotation.x = -0.3 + Math.sin(t * 2 + i) * 0.1; });
  tHouse.userData.pop((t - 1.2) / 0.35);
  const u = ease(t / 9);
  look(lerp(30.4, 30.0, u), lerp(2.6, 2.4, u), lerp(10.4, 9.2, u), 30, 2.2, -1, 56);
  return qs;
}
function shotDance(t) { // 4段目 25〜33：やがて親友は、みんなが期待する新星に
  base(); S.aim(60, -1); lift(80);
  SPOTD.intensity = 40;
  const a = Math.sin(t * 1.4);
  dancer.rotation.y = a * 0.5; dancer.userData.arms[1].rotation.x = -1.6 + a * 0.5; dancer.userData.arms[1].rotation.z = 0.3; dancer.userData.arms[0].rotation.x = -0.6 - a * 0.3;
  const hand = new THREE.Vector3(0, -0.62, 0); dancer.userData.arms[1].localToWorld(hand); FAN.visible = true; FAN.position.copy(hand); FAN.position.y += 0.15; FAN.rotation.set(0, dancer.rotation.y, a * 0.6);
  tStar.userData.pop((t - 3.9) / 0.35);
  const u = ease(t / 8);
  look(lerp(60.6, 60.2, u), lerp(2.0, 1.8, u), lerp(6.2, 5.2, u), 60, 1.4, -0.6, 54);
  return qs;
}
function shotKitchen(t) { // 6段目 42〜49（決め手）：もうひとりは、みんなのごはんをつくる係に
  base(); S.aim(90, -1); lift(80);
  STEAM.forEach((s, i) => { s.visible = true; const u = ((t * 0.6 + i / 10) % 1); s.position.set(89.0 + Math.sin(u * 6 + i) * 0.12, 1.4 + u * 1.3, -1.7); s.scale.setScalar(0.6 + u * 1.6); s.material.opacity = 0.55 * (1 - u); });
  POT.userData.lid.position.y = 0.4 + Math.max(0, Math.sin(t * 9)) * 0.03;
  kiyo3.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 5) * 0.25; kiyo3.userData.arms[0].rotation.x = -0.8;
  tCook.userData.pop((t - 1.0) / 0.35);
  const u = ease(t / 7);
  look(lerp(91.6, 91.2, u), lerp(2.6, 2.4, u), lerp(4.6, 4.0, u), 89.8, 1.3, -1.6, 54);
  return qs;
}
function shotTable(t) { // 49〜56：みんなの食卓（このドラマ、わかった？＋カウントダウン）
  base(); S.aim(120, -1); lift(120);
  DISHES.forEach((d, i) => { const k = easeOut(clamp((t - 0.3 - i * 0.12) / 0.35)); d.visible = k > 0; d.scale.setScalar(Math.max(0.001, k)); });
  DINERS.forEach((p, i) => { p.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 3 + i) * 0.2; p.userData.head.rotation.x = Math.sin(t * 2 + i) * 0.08; });
  const u = ease(t / 7);
  look(lerp(120.2, 120.0, u), lerp(3.8, 3.4, u), lerp(5.8, 4.8, u), 120, 0.6, -0.6, 54);
  countdown(t);
  return qs;
}
const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotRoad(t, T) },
  { a: 9, b: 17, f: shotStreet },
  { a: 17, b: 25, f: shotHome },
  { a: 25, b: 33, f: shotDance },
  { a: 33, b: 42, f: shotHouse },
  { a: 42, b: 49, f: shotKitchen },
  { a: 49, b: 56, f: shotTable },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '親友とふたり、<br>大きな荷物を持って。'],
  [5.6, 9.0, '夢をかなえるため、<br>ふるさとを出る。'],
  [9.2, 13.0, 'たどり着いたのは、<br>遠く離れた古い町。'],
  [13.0, 17.0, 'ここで、ふたりの<br>新しい暮らしが始まる。'],
  [17.2, 21.0, '暮らすのは、同じ夢を<br>持つ女の子たちの家。'],
  [21.0, 25.0, 'みんなで、<br>ひとつ屋根の下。'],
  [25.2, 29.0, 'やがて親友は、'],
  [29.0, 33.0, 'みんなが期待する<br>新星に。'],
  [33.2, 37.4, 'ふたりの夢は、<br>京都の舞妓さん。'],
  [37.4, 41.8, '青森から、<br>はるばるやってきた。'],
  [42.2, 45.6, 'もうひとりは、みんなの<br>ごはんをつくる係に。'],
  [45.6, 49.0, 'ふたりはそれぞれの<br>夢を追いかける。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、舞妓さんちの<br>まかないさん。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q016', v2: true, answer: '舞妓さんちのまかないさん',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'calm', seed: 1616,
    hits: [5.6, 29.0, 56.4], risers: [52.0],
    impacts: [0.3, 29.0, 33.2, 42.2, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'bubble'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '遠く離れた': 'とおくはなれた', '新しい暮らし': 'あたらしいくらし', '屋根の下': 'やねのした', '追いかける': 'おいかける', '女の子': 'おんなのこ', '始まる': 'はじまる', '暮らす': 'くらす', '大きな': 'おおきな', '持って': 'もって', '持つ': 'もつ', '荷物': 'にもつ', '親友': 'しんゆう', '期待': 'きたい', '新星': 'しんせい', '舞妓': 'まいこ', '京都': 'きょうと', '青森': 'あおもり', '同じ': 'おなじ', '古い': 'ふるい', '出る': 'でる', '係': 'かかり', '夢': 'ゆめ', '町': 'まち', '家': 'いえ' },
    caption: 'このドラマのタイトル、わかる？\n親友とふたり、夢をかなえるためにふるさとを出た。たどり着いたのは、遠く離れた古い町。暮らすのは、同じ夢を持つ女の子たちが、ひとつ屋根の下で過ごす家。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '日本のドラマ', 'ドラマ紹介'],
  },
});
applyQuizCards({ answer: '舞妓さんちの<br>まかないさん', info: 'Netflix｜日本・全9話', answerSize: 104 });
