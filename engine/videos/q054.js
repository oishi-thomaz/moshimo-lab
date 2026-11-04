import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #054 ウォーキング・デッド（ドラマ・アメリカ・2010年〜・AMC・シーズン11まで全177話。U-NEXT・Prime Video（ほか Disney+・Netflix）で見放題、
//   justwatch.com/jp/テレビ番組/the-walking-dead で2026/11/4確認。Filmarks シーズン1 4.2・レビュー30,751件 filmarks.com/dramas/300/1105）
// 確かめた事実（ja.wikipedia.org/wiki/ウォーキング・デッド_(テレビドラマ)・en.wikipedia.org/wiki/Days_Gone_Bye_(The_Walking_Dead)。2026/11/4）：
//   ・主人公はジョージア州の保安官代理。犯人を追う途中で撃たれて昏睡。目覚めると病院は荒れ果てて無人
//   ・家に帰ると妻と息子はいない。文明は崩壊し、生ける屍「ウォーカー」が歩き回っていた。家族が避難したと思われる都市を目指す
//   ・2010年10月31日にAMCで放送開始。シーズン11まで計177話。シーズン1は6話。原作はグラフィックノベル
// 構成（ヒント6段）：1 病院で目覚めると誰もいない → 2 撃たれて昏睡していた保安官代理、家に妻と息子がいない → 3 乗り捨てられた車、崩壊した文明
//   → 4 家族を探す旅、生き残った仲間 → 5 2010年のアメリカのドラマ・シーズン11まで、動く死者のあふれる世界 → 6 決め手：死者は ウォーカー と呼ばれる・全177話
// 「ウォーカー」は6段目まで出さない。地名・人物名は出さない。グロい描写はしない（死者は灰緑の肌の汎用の人形・血は出さない）。有名な場面の構図（馬で都市に入る など）は使わない

const S = quizStage({ bg: '#2a3038', floor: '#3a3a3a', fogNear: 22, fogFar: 70 });
const qs = S.scene;
const R = rng(5454);

const RICK = { skin: '#eccaa8', hair: '#3a2a1e', shirt: '#c8b48a', pants: '#3a3a30' };
const GOWN = { skin: '#eccaa8', hair: '#3a2a1e', shirt: '#b8d0d8', pants: '#b8d0d8' };
const WALK = (i) => ({ skin: '#a8b898', hair: ['#3a3a30', '#5a5040', '#2a2a26'][i % 3], shirt: ['#5a5448', '#4a5058', '#6a5a4a', '#504a44'][i % 4], pants: '#3a3830', long: i % 3 === 1 });

// ---------- 1段目. 荒れた病室（x=0）。目を覚ますと誰もいない ----------
{ const fl = box(10, 0.04, 10, mat('#8a9088')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#a8b0a8')); wl.position.set(0, 2.5, -3.5); qs.add(wl);
  const sw = box(0.2, 5, 10, mat('#9aa29a')); sw.position.set(-3.5, 2.5, -1); qs.add(sw);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), new THREE.MeshBasicMaterial({ color: '#d8e0c8' })); win.position.set(1.6, 2.6, -3.38); qs.add(win);
  for (let i = 0; i < 3; i++) { const bl = box(1.6, 0.06, 0.02, mat('#6a706a')); bl.position.set(1.6, 2.0 + i * 0.5, -3.36); bl.rotation.z = (i === 1 ? 0.25 : 0); qs.add(bl); }
  const bed = box(1.1, 0.5, 2.2, mat('#d8dcd8')); bed.position.set(0, 0.55, -1.2); qs.add(bed); const frame = box(1.2, 0.3, 2.3, mat('#6a7078')); frame.position.set(0, 0.25, -1.2); qs.add(frame);
  const head = box(1.2, 1.0, 0.1, mat('#6a7078')); head.position.set(0, 1.0, -2.35); qs.add(head);
  const drip = box(0.05, 1.8, 0.05, mat('#9aa0a8')); drip.position.set(-0.9, 0.9, -2.0); qs.add(drip);
  const ch = box(0.5, 0.5, 0.5, mat('#5a6070')); ch.position.set(1.6, 0.2, 0.4); ch.rotation.set(1.4, 0.3, 0); qs.add(ch);
  for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ color: '#efece4', side: THREE.DoubleSide })); p.rotation.set(-Math.PI / 2, 0, R() * 3); p.position.set((R() - 0.5) * 4, 0.05, 0.4 + (R() - 0.5) * 2); qs.add(p); }
  const flower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.3, 10), mat('#6a8aa8')); flower.position.set(-1.6, 0.18, 0.2); flower.rotation.z = Math.PI / 2; qs.add(flower);
  for (let i = 0; i < 4; i++) { const pt = box(0.12, 0.3, 0.02, mat('#5a6a3a')); pt.position.set(-1.9 + i * 0.12, 0.05, 0.3 + i * 0.08); pt.rotation.x = -Math.PI / 2; qs.add(pt); } }
const r1 = makePerson(GOWN); r1.position.set(0, 0.55, -1.4); qs.add(r1);
const LAMP = new THREE.PointLight(0xd8f0d8, 0, 8, 1.4); LAMP.position.set(0, 4.4, -0.8); qs.add(LAMP);
const TUBE = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: '#e8f8e8' })); TUBE.position.set(0, 4.6, -0.8); qs.add(TUBE);
const tWake = tag('目を覚ますと…', { size: 72, w: 500, bg: '#14161c', sx: 1.7 }); tWake.position.set(0, 2.42, -0.6); qs.add(tWake);
const tNone = tag('病院に、誰もいない', { size: 62, w: 600, bg: '#e2483c', sx: 1.6 }); tNone.position.set(0, 2.5, -0.6); qs.add(tNone);

// ---------- 2段目. 自宅の前（x=40）。保安官代理の男、家族の姿がない ----------
const HX = 40;
{ const fl = box(16, 0.04, 14, mat('#6a7a4a')); fl.position.set(HX, 0.02, -3); qs.add(fl);
  const house = box(6, 3.2, 4, mat('#d8d0c0')); house.position.set(HX, 1.6, -5); qs.add(house);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.8, 4), mat('#6a4a3a')); roof.position.set(HX, 4.1, -5); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.7; qs.add(roof);
  const door = box(0.9, 1.9, 0.1, mat('#3a2a20')); door.position.set(HX + 0.3, 0.95, -2.9); door.rotation.y = -1.0; qs.add(door);
  const dk = box(0.9, 1.9, 0.05, mat('#1a1612')); dk.position.set(HX, 0.95, -2.98); qs.add(dk);
  for (const x of [-2, 2]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), new THREE.MeshBasicMaterial({ color: '#2a2c30' })); w.position.set(HX + x, 1.9, -2.98); qs.add(w); }
  const bike = box(0.9, 0.5, 0.1, mat('#d84a3a')); bike.position.set(HX - 2.4, 0.25, -1.4); bike.rotation.set(0, 0.4, Math.PI / 2); qs.add(bike);
  for (let i = 0; i < 6; i++) { const lf = box(0.2, 0.02, 0.14, mat('#a8783a')); lf.position.set(HX + (R() - 0.5) * 6, 0.05, -1 + (R() - 0.5) * 3); lf.rotation.y = R() * 3; qs.add(lf); } }
const r2 = makePerson(RICK); r2.position.set(HX - 0.4, 0, 0.6); r2.rotation.y = 0.35; qs.add(r2);
const HAT = new THREE.Group(); { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 20), mat('#8a7050')); HAT.add(br); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.22, 16), mat('#8a7050')); cr.position.y = 0.12; HAT.add(cr); } HAT.position.y = 0.55; r2.userData.head.add(HAT);
const BADGE = box(0.1, 0.1, 0.02, mat('#e6c450')); BADGE.position.set(-0.12, 1.32, 0.15); r2.add(BADGE);
const PHOTO = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: canvasTex(150, 108, (g, w, h) => { g.fillStyle = '#f4efe4'; g.fillRect(0, 0, w, h); g.fillStyle = '#9ac0d8'; g.fillRect(8, 8, w - 16, h - 16); g.fillStyle = '#5a4030'; g.fillRect(40, 40, 22, 52); g.fillRect(86, 54, 18, 38); g.fillStyle = '#f0d0b0'; g.fillRect(43, 24, 16, 16); g.fillRect(87, 40, 15, 15); }), side: THREE.DoubleSide })); qs.add(PHOTO);
const tDep = tag('保安官代理', { size: 76, w: 420, bg: '#14161c', sx: 1.35 }); tDep.position.set(HX - 0.4, 2.55, 0.6); qs.add(tDep);
const tFam = tag('妻と息子がいない', { size: 64, w: 540, bg: '#e2483c', sx: 1.5 }); tFam.position.set(HX - 0.4, 2.55, 0.6); qs.add(tFam);

// ---------- 3段目. 乗り捨てられた車の続く道（x=80） ----------
const RX = 80;
{ const fl = box(30, 0.04, 40, mat('#8a7a5a')); fl.position.set(RX, 0.02, -12); qs.add(fl);
  const rd = box(8, 0.03, 40, mat('#3a3a3c')); rd.position.set(RX, 0.05, -12); qs.add(rd);
  for (let i = 0; i < 10; i++) { const ln = box(0.2, 0.02, 1.4, mat('#d8c860')); ln.position.set(RX, 0.08, 4 - i * 3.6); qs.add(ln); } }
const CARS = []; for (let i = 0; i < 11; i++) { const g = new THREE.Group(); const c = ['#6a3a3a', '#3a4a6a', '#8a8a8a', '#4a5a3a', '#c8b48a', '#2a2a2e'][i % 6]; const b = box(1.7, 0.6, 3.6, mat(c)); b.position.y = 0.55; g.add(b); const t = box(1.5, 0.5, 1.8, mat(c)); t.position.set(0, 1.1, -0.2); g.add(t); const gl = box(1.52, 0.36, 1.6, mat('#5a6a78')); gl.position.set(0, 1.12, -0.2); g.add(gl); for (const x of [-0.8, 0.8]) for (const z of [-1.2, 1.2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), mat('#141414')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.3, z); g.add(w); }
  g.position.set(RX + (i % 2 ? 1.9 : -1.9) + (R() - 0.5) * 0.8, 0, -2 - i * 3.4); g.rotation.y = (R() - 0.5) * 0.9; if (i === 3) { g.rotation.z = 0.2; } if (i % 4 === 1) { const dr = box(0.06, 0.8, 1.0, mat(c)); dr.position.set(0.95, 0.7, 0.2); dr.rotation.y = 0.9; g.add(dr); } qs.add(g); CARS.push(g); }
const r3 = makePerson(RICK); r3.position.set(RX - 0.2, 0, 2.2); r3.rotation.y = Math.PI; qs.add(r3);
const BAG3 = box(0.4, 0.5, 0.2, mat('#4a4a3a')); BAG3.position.set(0, 1.2, -0.2); r3.add(BAG3);
const DUST = []; for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#e8d8b0', transparent: true, opacity: 0.6 })); d.userData = { x: (R() - 0.5) * 10, y: R() * 4, z: -R() * 20, o: R() }; qs.add(d); DUST.push(d); }
const tCars = tag('乗り捨てられた車', { size: 64, w: 560, bg: '#14161c', sx: 2.1 }); tCars.position.set(RX, 3.2, -1); qs.add(tCars);
const tFall = tag('文明が、崩壊していた', { size: 60, w: 640, bg: '#e2483c', sx: 2.4 }); tFall.position.set(RX, 3.2, -1); qs.add(tFall);

// ---------- 4段目. 生き残りのキャンプ（x=120）。たき火を囲む仲間 ----------
const CX = 120;
{ const fl = box(20, 0.04, 16, mat('#4a5a34')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  for (let i = 0; i < 4; i++) { const tn = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.5, 4), mat(['#5a6a4a', '#7a6a4a', '#4a5a6a', '#6a5040'][i])); tn.position.set(CX - 4.5 + i * 3, 0.75, -5 - (i % 2)); tn.rotation.y = Math.PI / 4; qs.add(tn); }
  const rv = box(2.2, 2.0, 5, mat('#e8e0d0')); rv.position.set(CX + 5, 1.2, -6); qs.add(rv); const rvs = box(2.24, 0.3, 5.02, mat('#8a5a3a')); rvs.position.set(CX + 5, 1.2, -6); qs.add(rvs);
  for (let i = 0; i < 12; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(1.2, 5, 8), mat('#2a4a2a')); tr.position.set(CX - 10 + i * 1.9, 2.5, -10 - (i % 3)); qs.add(tr); } }
const FIRE = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 10), new THREE.MeshBasicMaterial({ color: '#ffa040' })); FIRE.position.set(CX, 0.4, -1); qs.add(FIRE);
const FIRE2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 10), new THREE.MeshBasicMaterial({ color: '#ffe080' })); FIRE2.position.set(CX, 0.3, -1); qs.add(FIRE2);
const FL = new THREE.PointLight(0xffa050, 0, 10, 1.4); FL.position.set(CX, 1.0, -1); qs.add(FL);
const CAMP = []; for (let i = 0; i < 6; i++) { const p = makePerson({ skin: ['#eccaa8', '#c89a78', '#f2d4b8', '#8a5a3a', '#eccaa8', '#f0d0b0'][i], hair: ['#3a2a1e', '#1a1614', '#c89a50', '#1a1614', '#6a6a6a', '#5a3a24'][i], shirt: ['#c8b48a', '#5a6a4a', '#d8a0a0', '#4a4a5a', '#8a6a4a', '#7a9ab8'][i], pants: '#3a3a34', long: i === 2 || i === 5, scale: i === 5 ? 0.72 : 1 }); const a = i / 6 * Math.PI * 2 + 0.3; p.position.set(CX + Math.cos(a) * 1.6, i === 5 ? 0 : -0.3, -1 + Math.sin(a) * 1.6); p.rotation.y = Math.atan2(CX - p.position.x, -1 - p.position.z); if (i !== 5) p.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(p); CAMP.push(p); }
const tSearch = tag('家族を探す旅', { size: 70, w: 480, bg: '#14161c', sx: 2.0 }); tSearch.position.set(CX, 2.6, -1.4); qs.add(tSearch);
const tCrew = tag('生き残った仲間たち', { size: 62, w: 600, bg: '#3f8f6b', sx: 2.4 }); tCrew.position.set(CX, 2.6, -1.4); qs.add(tCrew);

// ---------- 5段目. テレビの前（x=160）。2010年のアメリカのドラマ・シーズン11まで ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1a1c20' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c8a868'); gr.addColorStop(1, '#4a3a2a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(20,20,20,.8)'; for (let i = 0; i < 11; i++) { const x = 30 + i * 44; g.fillRect(x, 150 + (i % 3) * 8, 16, 70); g.fillRect(x + 2, 132 + (i % 3) * 8, 12, 14); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const tUS = tag('2010年 アメリカのドラマ', { size: 60, w: 820, bg: '#e6b450', color: '#14161c', sx: 3.5 }); tUS.position.set(TX, 4.6, -1.2); qs.add(tUS);
const tS11 = tag('シーズン11まで', { size: 70, w: 500, bg: '#3a7ad8', sx: 2.5 }); tS11.position.set(TX, 4.6, -1.2); qs.add(tS11);
const tDead = tag('動く死者が、あふれる世界', { size: 56, w: 700, bg: '#5a6a4a', sx: 3.0 }); tDead.position.set(TX, 3.75, -1.0); qs.add(tDead);

// ---------- 6段目. 金網の向こうに集まる死者（x=200） ----------
const DX = 200;
{ const fl = box(24, 0.04, 20, mat('#6a6a4a')); fl.position.set(DX, 0.02, -3); qs.add(fl); }
const FENCE = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#b8bcc0'; g.lineWidth = 2; for (let x = -h; x < w + h; x += 26) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke(); } }), transparent: true, side: THREE.DoubleSide })); FENCE.position.set(DX, 1.3, 0.2); qs.add(FENCE);
for (let i = 0; i < 8; i++) { const po = box(0.1, 2.8, 0.1, mat('#8a8e92')); po.position.set(DX - 7 + i * 2, 1.4, 0.2); qs.add(po); }
const WALKERS = []; for (let i = 0; i < 14; i++) { const p = makePerson(WALK(i)); p.userData.x0 = DX - 6 + (i % 7) * 2 + (R() - 0.5) * 0.6; p.userData.z0 = -1.6 - Math.floor(i / 7) * 2.2 - R() * 0.8; p.userData.ph = R() * 6; p.userData.arms.forEach(a => a.rotation.x = -1.4); p.userData.head.rotation.z = (R() - 0.5) * 0.6; p.position.set(p.userData.x0, 0, p.userData.z0); qs.add(p); WALKERS.push(p); }
const r6 = makePerson(RICK); r6.position.set(DX + 2.4, 0, 2.2); r6.rotation.y = Math.PI; qs.add(r6);
const HAT6 = HAT.clone(); r6.userData.head.add(HAT6);
const tWalker = tag('死者の呼び名は「ウォーカー」', { size: 56, w: 840, bg: '#e2483c', sx: 3.5 }); tWalker.position.set(DX, 4.0, -1); qs.add(tWalker);
const t177 = tag('全177話', { size: 76, w: 360, bg: '#e6b450', color: '#14161c', sx: 1.8 }); t177.position.set(DX, 3.25, -0.6); qs.add(t177);

// ---------- shots ----------
const ALL = [tWake, tNone, tDep, tFam, tCars, tFall, tSearch, tCrew, tUS, tS11, tDead, tWalker, t177];
function base() { S.reset(); ALL.forEach(x => x.visible = false); LAMP.intensity = 0; FL.intensity = 0; PHOTO.visible = false; DUST.forEach(d => d.visible = false); }

function shotRoom(t) { // 1段目 0〜9：目を覚ますと、病院には誰もいない（0秒目がサムネ）
  base(); S.aim(0, -1); lift(-40); S.hemi.intensity = 0.75; S.key.intensity = 0.6; S.darken(0.5, '#101410');
  const fl = (Math.sin(t * 23) > 0.2 ? 1 : 0.15) * (Math.sin(t * 3.1) > -0.6 ? 1 : 0.2); LAMP.intensity = 6 * fl; TUBE.material.color.set(fl > 0.5 ? '#e8f8e8' : '#4a524a');
  const up = ease(t / 1.5); r1.rotation.x = 0; r1.position.set(0, 0.55, -1.4); r1.userData.legs.forEach(l => l.rotation.x = -1.5); r1.position.y = 0.3;
  r1.userData.head.rotation.y = Math.sin(t * 1.1) * 0.7 * clamp((t - 2) / 1);
  tWake.userData.pop(1); if (t > 4.6) tWake.visible = false;
  tNone.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(1.2, 0.8, u), lerp(2.2, 2.0, u), lerp(4.0, 3.2, u), 0, 1.35, -1.2, 56);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：撃たれて昏睡していた保安官代理。家に帰ると妻と息子がいない
  base(); S.aim(HX, -2); lift(-40); S.hemi.intensity = 1.0; S.darken(0.2, '#a8a088');
  r2.userData.head.rotation.y = Math.sin(t * 0.8) * 0.3;
  PHOTO.visible = t > 4.2; PHOTO.position.set(HX - 0.25, 1.25, 1.0); PHOTO.rotation.set(-0.5, 0.35, 0); r2.userData.arms.forEach(a => a.rotation.x = t > 4.2 ? -1.0 : 0);
  tDep.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDep.visible = false;
  tFam.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(HX + lerp(0.9, 0.6, u), lerp(2.1, 2.0, u), lerp(5.0, 4.4, u), HX - 0.4, 1.6, -1.6, 56);
  return qs;
}
function shotRoad(t) { // 3段目 17〜25：乗り捨てられた車。文明が崩壊していた
  base(); S.aim(RX, -6); lift(-30); S.hemi.intensity = 1.1; S.darken(0.4, '#c8a878');
  DUST.forEach(d => { d.visible = true; d.position.set(RX + d.userData.x + Math.sin(t * 0.5 + d.userData.o * 6) * 0.4, d.userData.y + Math.sin(t + d.userData.o * 4) * 0.2, d.userData.z); });
  poseWalk(r3, t * 3.2, 0.7); r3.position.z = 2.2 - t * 0.35;
  tCars.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCars.visible = false;
  tFall.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(RX + lerp(1.0, 0.6, u), lerp(2.6, 3.0, u), lerp(7.6, 6.8, u), RX, 1.4, -8, 54);
  return qs;
}
function shotCamp(t) { // 4段目 25〜33：家族を探す旅。生き残った仲間たち
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.6, '#0a0e14');
  FL.intensity = 18 + Math.sin(t * 9) * 3; FIRE.scale.y = 1 + Math.sin(t * 11) * 0.15; FIRE2.scale.y = 1 + Math.cos(t * 13) * 0.2;
  CAMP.forEach((p, i) => { p.userData.head.rotation.x = Math.sin(t * 1.2 + i) * 0.08; });
  tSearch.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSearch.visible = false;
  tCrew.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(4.4, 4.0, u), lerp(5.4, 4.8, u), CX, 0.6, -1.4, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2010年のアメリカのドラマ。シーズン11まで。動く死者のあふれる世界
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false;
  tS11.userData.pop((t - 4.2) / 0.35); tDead.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX, 2.8, lerp(7.8, 7.0, u), TX, 2.7, -1.5, 56);
  return qs;
}
function shotFence(t, quiz = 0) { // 6段目 42〜49（決め手）：死者は「ウォーカー」と呼ばれる。全177話
  base(); S.aim(DX, -2); lift(-30); S.hemi.intensity = 1.3; S.key.intensity = 1.4; S.darken(0.45, '#5a6050');
  WALKERS.forEach((p, i) => { const k = Math.min(1, (t + p.userData.ph) / 12); p.position.set(p.userData.x0, 0, p.userData.z0 + k * 1.2); poseWalk(p, t * 1.6 + p.userData.ph, 0.35); p.userData.arms.forEach(a => a.rotation.x = -1.4 + Math.sin(t * 2 + i) * 0.1); });
  if (!quiz) { tWalker.userData.pop((t - 0.4) / 0.35); t177.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(DX + lerp(1.2, 0.8, u), lerp(3.4, 3.2, u), lerp(7.4, 6.6, u), DX, 0.8, -2, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（荒れた病室）
  shotRoom(7.9);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.75, 0.2, d); LAMP.intensity = lerp(6, 0, d);
  S.spot.color.set(0xd8f0e0); S.spot.position.set(0, 5.5, 2); S.spot.target.position.set(0, 1, -1.2); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(lerp(0.9, 0.5, k), lerp(1.9, 1.8, k), lerp(3.6, 3.0, k), 0, 1.3, -1.3, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotRoom },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotRoad },
  { a: 25, b: 33, f: shotCamp },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotFence(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '病院のベッドで、<br>男が目を覚ました。'],
  [5.6, 9.0, 'なのに病院には、<br>誰もいない。'],
  [9.2, 13.2, '男は保安官代理。<br>撃たれて、昏睡していた。'],
  [13.2, 17.0, '家に帰ると、<br>妻と息子の姿がない。'],
  [17.2, 21.0, '道には、<br>乗り捨てられた車。'],
  [21.0, 25.0, '眠っている間に、<br>文明は崩壊していた。'],
  [25.2, 29.0, '家族を探して、<br>遠くの街を目指す。'],
  [29.0, 33.0, '生き残った人たちと、<br>力を合わせて。'],
  [33.2, 37.4, '2010年のアメリカのドラマ。<br>シーズン11まで続いた。'],
  [37.4, 41.8, '動く死者が、<br>あふれる世界。'],
  [42.2, 45.4, '死者の呼び名は、<br>ウォーカー。'],
  [45.4, 49.0, '全177話の、<br>サバイバル。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ウォーキング・デッド。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q054', v2: true, answer: 'ウォーキング・デッド',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 5454,
    hits: [5.6, 21.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.4, 'drone'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '病院': 'びょういん', '男': 'おとこ', '目を覚ました': 'めをさました', '誰も': 'だれも', '保安官代理': 'ほあんかんだいり', '撃たれて': 'うたれて', '昏睡': 'こんすい', '家': 'いえ', '妻': 'つま', '息子': 'むすこ', '姿': 'すがた', '道': 'みち', '乗り捨てられた': 'のりすてられた', '車': 'くるま', '眠っている間': 'ねむっているあいだ', '文明': 'ぶんめい', '崩壊': 'ほうかい', '家族': 'かぞく', '探して': 'さがして', '遠く': 'とおく', '街': 'まち', '目指す': 'めざす', '生き残った': 'いきのこった', '力を合わせて': 'ちからをあわせて', '2010年': 'にせんじゅうねん', 'シーズン11': 'シーズンじゅういち', '続いた': 'つづいた', '動く死者': 'うごくししゃ', '死者': 'ししゃ', '呼び名': 'よびな', '全177話': 'ぜんひゃくななじゅうななわ', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n病院のベッドで、男が目を覚ました。なのに病院には、誰もいない。家に帰ると、妻と息子の姿がない。道には、乗り捨てられた車。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'PrimeVideo', '海外ドラマ', 'ドラマ好き'],
  },
});
applyQuizCards({ answer: 'ウォーキング・<br>デッド', info: 'U-NEXT・Prime Video｜アメリカのドラマ', answerSize: 120 });
