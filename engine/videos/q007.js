import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, poseWalk, makeQ, rng } from '../lib.js';
import { lift, look, runStory, endCard, makeSparkles } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #007 君の名は。（映画・日本・2016年・107分のアニメ。Netflixで見放題、justwatch.com/jp/映画/jun-noming-ha で2026/11/1確認。Filmarks 3.9）
// 設定：山深い田舎町で暮らし都会にあこがれる女子高校生が、東京の男の子になる夢を見る。東京の男子高校生も、山奥の町の女の子になる夢を見ていた。
//       眠っている間に入れ替わっていると気づき、スマホのメモや日記でやりとりする。女の子は古い神社の娘（crank-in 作品紹介・ciatr 作品紹介）
// 作品の映像・キャラクターの見た目・ロゴ・有名な場面の構図（空を分けたポスター、階段の場面など）は使わない。物語の後半にかかわる要素（空のできごと・時間のこと）には一切ふれない
// ヒント6段（2026/11/2 作り直し）：知らない部屋で目がさめる → 田舎町の女子高校生 → 大都会の男子高校生 → 見知らぬ2人の不思議な夢 → 日本・神社の娘・アニメ映画 → 決め手の入れ替わりとスマホのメモ
// 湖・夕焼けの空・流れ星・時計など、作品を思わせる景色や後半にかかわる小物は出さない

const S = quizStage({ bg: '#9cc4e4', floor: '#6f9a58', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(707);

const GIRL = { skin: '#f5d3b5', hair: '#1d1a19', shirt: '#f2f2f0', pants: '#3a3f5a', long: true, skirt: true };
const BOY = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#f2f2f0', pants: '#2b3040' };
const CITY_P = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f', '#f5d3b5'][i % 4], hair: ['#1d1a19', '#2c2421', '#4a3426'][i % 3], shirt: ['#2b3040', '#e9e4da', '#59606e', '#c94f7c', '#4fa3d1'][i % 5], pants: ['#2b3346', '#1f2430', '#3b3f4a'][i % 3], long: i % 3 === 1, skirt: i % 5 === 3 });
function wonder(p, T) { p.userData.head.rotation.y = Math.sin(T * 2.0) * 0.55; p.userData.head.rotation.x = -0.1; }
function lookHands(p, k) { p.userData.arms.forEach(a => { a.rotation.x = lerp(0, -1.3, k); }); p.userData.head.rotation.x = lerp(0, 0.45, k); }
function sitUp(p) { p.userData.legs.forEach(l => { l.rotation.x = -Math.PI / 2; l.children[1].visible = false; }); }
function cone(r, h, c, x, z, seg = 6) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c)); m.position.set(x, h / 2, z); m.castShadow = true; qs.add(m); return m; }
function house(x, z, s = 1, wall = '#e8dcc4', roof = '#5a4a5a') { const w = box(1.1 * s, 0.8 * s, 1.0 * s, mat(wall)); w.position.set(x, 0.4 * s, z); qs.add(w); const rf = new THREE.Mesh(new THREE.ConeGeometry(0.95 * s, 0.6 * s, 4), mat(roof)); rf.rotation.y = Math.PI / 4; rf.position.set(x, 1.1 * s, z); qs.add(rf); }
function building(x, z, w, h, d, seed, tint = '#8a94a8') { const wt = windowTextures(seed, tint); wt.map.repeat.set(w / 2, h / 2.5); wt.emi.repeat.set(w / 2, h / 2.5); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 0.25 })); b.position.set(x, h / 2, z); b.castShadow = true; qs.add(b); return b; }
// 夢の吹き出し（白い雲の中に、小さな景色）
function bubble(kind) {
  const g = new THREE.Group(); const white = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.35 });
  for (const [x, y, r] of [[0, 0, 0.55], [-0.5, -0.05, 0.42], [0.5, -0.05, 0.42], [-0.25, 0.25, 0.4], [0.28, 0.25, 0.38]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), white); s.position.set(x, y, -0.2); s.scale.z = 0.4; g.add(s); }
  for (const [x, y, r] of [[-0.45, -0.75, 0.1], [-0.62, -1.0, 0.06]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), white); s.position.set(x, y, -0.2); g.add(s); }
  if (kind === 'city') { [[-0.36, 0.5, '#6f7a8e'], [-0.1, 0.78, '#8a94a8'], [0.16, 0.62, '#59606e'], [0.4, 0.42, '#a8b0bf']].forEach(([x, h, c]) => { const wt = windowTextures(300 + Math.round(h * 100), c); wt.map.repeat.set(0.4, h / 1.4); const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, 0.1), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 0.3 })); b.position.set(x, -0.3 + h / 2, 0.02); g.add(b); }); }
  else { [[-0.3, 0.42, 0.62, '#5d8a52'], [0.12, 0.34, 0.5, '#4f7a4a'], [0.42, 0.26, 0.4, '#6f9a58']].forEach(([x, r, h, c]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mat(c)); m.position.set(x, -0.3 + h / 2, 0.02); g.add(m); }); const hs = box(0.18, 0.13, 0.1, mat('#e8dcc4')); hs.position.set(0.0, -0.24, 0.1); g.add(hs); }
  g.visible = false; qs.add(g); return g;
}

// ---------- 1段目. 朝、知らない部屋で目がさめる（x=0）。0秒目がサムネ ----------
{ const wood = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#c9a77a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8865a'; g.lineWidth = 4; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), new THREE.MeshLambertMaterial({ map: wood })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.03, 0.4); qs.add(fl);
  const back = box(8, 7, 0.2, mat('#d6e2dc')); back.position.set(0, 3.5, -2.9); qs.add(back);
  const left = box(0.2, 7, 7, mat('#c9d6d0')); left.position.set(-3.4, 3.5, 0.4); qs.add(left);
  const right = box(0.2, 7, 7, mat('#c9d6d0')); right.position.set(3.4, 3.5, 0.4); qs.add(right);
  // 窓（朝の光）とカーテン
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.4), new THREE.MeshBasicMaterial({ color: '#f4fbff' })); win.position.set(1.2, 2.2, -2.78); qs.add(win);
  for (const [w, h, x, y] of [[1.6, 0.08, 1.2, 2.92], [1.6, 0.08, 1.2, 1.48], [0.08, 1.5, 0.42, 2.2], [0.08, 1.5, 1.98, 2.2], [0.06, 1.4, 1.2, 2.2]]) { const f = box(w, h, 0.06, mat('#f2f2f0')); f.position.set(x, y, -2.75); qs.add(f); }
  for (const x of [0.2, 2.2]) { const c = box(0.42, 1.9, 0.06, mat('#e8b8c0')); c.position.set(x, 2.1, -2.72); qs.add(c); }
  // ベッド
  const frame = box(1.5, 0.4, 2.4, mat('#a8865a')); frame.position.set(-1.0, 0.2, -1.6); qs.add(frame);
  const mat1 = box(1.36, 0.18, 2.26, mat('#f6f4ee')); mat1.position.set(-1.0, 0.49, -1.6); qs.add(mat1);
  const head = box(1.6, 1.2, 0.12, mat('#a8865a')); head.position.set(-1.0, 0.8, -2.78); qs.add(head);
  const pil = box(0.8, 0.14, 0.4, mat('#ffffff')); pil.position.set(-1.0, 0.65, -2.45); qs.add(pil);
  const blanket = box(1.42, 0.22, 1.42, mat('#7aa6c9')); blanket.position.set(-1.0, 0.71, -1.0); qs.add(blanket);
  // 机と鏡、棚
  const desk = box(1.4, 0.8, 0.7, mat('#e8dcc4')); desk.position.set(2.3, 0.4, -2.4); qs.add(desk);
  const mir = box(0.6, 0.9, 0.04, new THREE.MeshLambertMaterial({ color: '#cfe2ee', emissive: new THREE.Color('#9ab8cc'), emissiveIntensity: 0.3 })); mir.position.set(2.5, 1.55, -2.76); qs.add(mir);
  const bag = box(0.4, 0.3, 0.16, mat('#3a3f5a')); bag.position.set(2.0, 0.95, -2.4); qs.add(bag);
  const shelf = box(0.36, 1.6, 0.9, mat('#e8dcc4')); shelf.position.set(-3.1, 0.8, 0.2); qs.add(shelf); }
const SUN = new THREE.PointLight(0xfff0d0, 7, 9, 1.2); SUN.position.set(1.0, 2.4, -1.6); qs.add(SUN);
const sleeper = makePerson({ ...GIRL, shirt: '#e8d8e8', pants: '#e8d8e8', skirt: false }); sleeper.position.set(-1.0, -0.21, -1.9); sitUp(sleeper); qs.add(sleeper);
const Q1 = makeQ(); Q1.position.set(-0.5, 1.95, -1.8); qs.add(Q1);
const tRoom = tag('知らない部屋', { size: 70, w: 500, sx: 1.25, bg: '#e6b450', color: '#14161c' }); tRoom.position.set(-0.95, 2.32, -1.8); qs.add(tRoom);
const tOdd = tag('なにかがおかしい', { size: 66, w: 560, sx: 1.4, bg: '#e2483c' }); tOdd.position.set(-0.95, 2.32, -1.8); qs.add(tOdd);

// ---------- 2段目. 山深い田舎町の女子高校生（x=26） ----------
const TX = 26;
{ const field = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#8fb85a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6f9a48'; g.lineWidth = 3; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(0, i * 16 + 4); g.lineTo(w, i * 16 + 4); g.stroke(); } });
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), new THREE.MeshLambertMaterial({ map: field })); f.rotation.x = -Math.PI / 2; f.position.set(TX - 5 + (i % 3) * 3.5, 0.035, -2.6 - Math.floor(i / 3) * 3.0); qs.add(f); }
  const road = box(18, 0.04, 1.4, mat('#b8a07a')); road.position.set(TX, 0.03, 1.0); qs.add(road);
  for (let i = 0; i < 9; i++) { const p = box(0.08, 0.6, 0.08, mat('#8a6a4a')); p.position.set(TX - 4 + i * 1.0, 0.3, 0.2); qs.add(p); }
  const rail = box(8.2, 0.07, 0.06, mat('#8a6a4a')); rail.position.set(TX, 0.52, 0.2); qs.add(rail);
  [[TX - 6, -9, 1.0], [TX - 3.4, -8.4, 0.9], [TX + 3.6, -9.2, 1.0], [TX + 6.0, -8.0, 0.8], [TX + 0.6, -10.2, 0.85]].forEach(([x, z, s], i) => house(x, z, s, ['#e8dcc4', '#d9cdb4', '#efe4cc'][i % 3], ['#5a4a5a', '#3a4a6a', '#6a3a3a'][i % 3]));
  for (let i = 0; i < 9; i++) { const h = 7 + R() * 6; cone(6 + R() * 3, h, ['#4f7a4a', '#5d8a52', '#46703f'][i % 3], TX - 20 + i * 5, -18 - (i % 2) * 4); }
  for (let i = 0; i < 6; i++) { const h = 2.4 + R(); cone(0.8, h, '#3f6a3a', TX - 8 + i * 3.4 + R(), -5.6 - R(), 8); } }
const girl2 = makePerson(GIRL); girl2.position.set(TX - 0.5, 0, 1.1); girl2.rotation.y = 0.25; qs.add(girl2);
const bag2 = box(0.36, 0.3, 0.12, mat('#3a3f5a')); bag2.position.set(0.0, -0.58, 0.14); girl2.userData.arms[1].add(bag2);
const B2 = bubble('city'); B2.position.set(TX + 0.55, 2.85, 0.9);
const tGirl = tag('女子高校生', { size: 72, w: 440, sx: 1.25, bg: '#e6b450', color: '#14161c' }); tGirl.position.set(TX - 0.5, 2.4, 1.1); qs.add(tGirl);
const tLong = tag('都会にあこがれ', { size: 66, w: 520, sx: 1.45 }); tLong.position.set(TX + 0.3, 3.75, 0.9); qs.add(tLong);

// ---------- 3段目. 遠く離れた大都会の男子高校生（x=52） ----------
const CX = 52;
{ const road = box(18, 0.04, 12, mat('#55575f')); road.position.set(CX, 0.02, 4.0); qs.add(road);
  const walk = box(18, 0.06, 2.2, mat('#a8a49a')); walk.position.set(CX, 0.03, -2.0); qs.add(walk);
  for (let i = 0; i < 9; i++) building(CX - 8 + i * 2.1, -3.8 - (i % 2) * 1.6, 2.0 + R() * 1.2, 7 + R() * 9, 2.2, 70 + i, ['#8a94a8', '#a8b0bf', '#6f7a8e'][i % 3]);
  for (let i = 0; i < 5; i++) building(CX - 10 + i * 5, -12, 3.6, 14 + R() * 10, 3, 120 + i, '#9aa4b8'); }
const CROWD = []; for (let i = 0; i < 12; i++) { const p = makePerson(CITY_P(i)); p.position.set(CX - 5.5 + i * 0.95, 0, (i % 3) * 0.6); qs.add(p); CROWD.push({ p, x0: CX - 5.5 + i * 0.95, z: 0.0 + (i % 3) * 0.6, dir: i % 2 ? 1 : -1, ph: R() * 6 }); }
const boy3 = makePerson(BOY); boy3.position.set(CX, 0, 2.2); qs.add(boy3);
const bag3 = box(0.4, 0.5, 0.18, mat('#2b2b30')); bag3.position.set(0, 1.15, -0.24); boy3.add(bag3);
const tBoy = tag('男子高校生', { size: 72, w: 440, sx: 1.35, bg: '#e6b450', color: '#14161c' }); qs.add(tBoy);
const tBig = tag('人であふれる街', { size: 66, w: 520, sx: 1.7 }); tBig.position.set(CX, 3.9, 0.4); qs.add(tBig);

// ---------- 4段目. 見知らぬ2人の、不思議な夢（x=78） ----------
const DX = 78;
const BEDS = [];
{ for (const [x, fc, wc] of [[DX - 1.6, '#6a5644', '#3e4a66'], [DX + 1.6, '#50545e', '#4a4058']]) { const pl = box(3.0, 0.1, 3.6, mat(fc)); pl.position.set(x, 0.05, -0.7); qs.add(pl); const wl = box(3.2, 5.0, 0.16, mat(wc)); wl.position.set(x, 2.5, -2.5); qs.add(wl); }
  for (const [x, c] of [[DX - 1.6, '#7aa6c9'], [DX + 1.6, '#c9a26a']]) { const fr = box(1.1, 0.34, 2.1, mat('#8a6a4a')); fr.position.set(x, 0.27, -0.8); qs.add(fr); const m = box(1.0, 0.14, 2.0, mat('#f6f4ee')); m.position.set(x, 0.5, -0.8); qs.add(m); const pl = box(0.6, 0.1, 0.32, mat('#ffffff')); pl.position.set(x, 0.62, -1.6); qs.add(pl); const bl = box(1.08, 0.2, 1.5, mat(c)); bl.position.set(x, 0.8, -0.28); qs.add(bl);
    const st = box(0.4, 0.5, 0.4, mat('#6a5a4a')); st.position.set(x + (x < DX ? -0.85 : 0.85), 0.35, -1.5); qs.add(st); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); lamp.position.set(st.position.x, 0.72, -1.5); qs.add(lamp);
    const L = new THREE.PointLight(0xffd8a0, 0, 4.5, 1.3); L.position.set(st.position.x, 1.2, -1.2); qs.add(L); BEDS.push(L); } }
function lieDown(p) { p.rotation.x = -Math.PI / 2; p.userData.legs.forEach(l => { l.children[1].visible = false; }); }
const girl4 = makePerson({ ...GIRL, shirt: '#e8d8e8', pants: '#e8d8e8', skirt: false }); lieDown(girl4); girl4.position.set(DX - 1.6, 0.68, -0.08); qs.add(girl4);
const boy4 = makePerson({ ...BOY, shirt: '#9ab0c8', pants: '#9ab0c8' }); lieDown(boy4); boy4.position.set(DX + 1.6, 0.68, -0.08); qs.add(boy4);
const B4a = bubble('city'); B4a.position.set(DX - 1.6, 2.35, -1.2);
const B4b = bubble('town'); B4b.position.set(DX + 1.6, 2.35, -1.2);
const tTwo = tag('見知らぬ2人', { size: 72, w: 460, sx: 1.6, bg: '#e6b450', color: '#14161c' }); tTwo.position.set(DX, 2.6, -0.8); qs.add(tTwo);
const tDream = tag('不思議な夢', { size: 72, w: 420, sx: 1.5, bg: '#14161c' }); tDream.position.set(DX, 3.45, -1.2); qs.add(tDream);

// ---------- 5段目. 日本の山奥の町の、古い神社（x=104） ----------
const JX = 104;
{ const plat = box(4.4, 0.3, 2.8, mat('#7a7a76')); plat.position.set(JX, 0.15, -3.4); qs.add(plat);
  const hall = box(3.6, 1.7, 2.2, mat('#7a5a3a')); hall.position.set(JX, 1.15, -3.4); qs.add(hall);
  const front = box(3.0, 1.2, 0.06, mat('#d9c9a8')); front.position.set(JX, 1.0, -2.27); qs.add(front);
  for (const x of [-1.7, -0.6, 0.6, 1.7]) { const p = box(0.14, 1.7, 0.14, mat('#5a3a24')); p.position.set(JX + x, 1.15, -2.26); qs.add(p); }
  const rf = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.3, 4), mat('#3a3a3a')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.75); rf.position.set(JX, 2.65, -3.4); qs.add(rf);
  const path = box(1.2, 0.04, 5, mat('#b8b4aa')); path.position.set(JX, 0.03, 0.2); qs.add(path);
  for (const x of [-1.5, 1.5]) { const b = box(0.36, 0.5, 0.36, mat('#9a9a94')); b.position.set(JX + x, 0.25, -1.4); qs.add(b); const c = box(0.22, 0.34, 0.22, mat('#a8a8a2')); c.position.set(JX + x, 0.67, -1.4); qs.add(c); const t = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 4), mat('#8a8a84')); t.rotation.y = Math.PI / 4; t.position.set(JX + x, 0.94, -1.4); qs.add(t); }
  for (let i = 0; i < 12; i++) { const s = i % 2 ? 1 : -1; const h = 3.6 + R() * 2; cone(0.9 + R() * 0.4, h, ['#2f5a34', '#3f6a3a'][i % 2], JX + s * (3.0 + R() * 4), -1.5 - Math.floor(i / 2) * 1.2, 8); }
  for (let i = 0; i < 7; i++) { const h = 7 + R() * 5; cone(6 + R() * 3, h, ['#4f7a4a', '#5d8a52', '#46703f'][i % 3], JX - 15 + i * 5, -16 - (i % 2) * 3); } }
// 神社の鳥居（汎用の形）
function torii(x, z, s = 1) { const g = new THREE.Group(); const red = mat('#c8402e'); for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.12 * s, 2.2 * s, 10), red); p.position.set(sx * 0.9 * s, 1.1 * s, 0); p.castShadow = true; g.add(p); } const top = box(2.6 * s, 0.16 * s, 0.24 * s, mat('#2a2a2a')); top.position.y = 2.25 * s; g.add(top); const t2 = box(2.3 * s, 0.14 * s, 0.2 * s, red); t2.position.y = 2.05 * s; g.add(t2); const nuki = box(2.1 * s, 0.1 * s, 0.14 * s, red); nuki.position.y = 1.7 * s; g.add(nuki); g.position.set(x, 0, z); qs.add(g); return g; }
torii(JX, -0.2, 1.25);
const girl5 = makePerson({ ...GIRL, shirt: '#f2f2f0', pants: '#5a6270' }); girl5.position.set(JX + 0.45, 0, 1.3); girl5.rotation.y = -0.15; qs.add(girl5);
const broom = box(0.05, 1.3, 0.05, mat('#a8865a')); broom.position.set(0, -0.55, 0.06); girl5.userData.arms[0].add(broom);
const tJapan = tag('舞台は日本', { size: 74, w: 440, bg: '#e6b450', color: '#14161c' }); tJapan.position.set(JX, 3.5, -0.2); qs.add(tJapan);
const tAnime = tag('アニメ映画', { size: 74, w: 420, bg: '#e6b450', color: '#14161c' }); tAnime.position.set(JX, 3.5, -0.2); qs.add(tAnime);
const tShrine = tag('神社の娘', { size: 70, w: 360, bg: '#e2483c' }); tShrine.position.set(JX + 0.45, 2.45, 1.3); qs.add(tShrine);

// ---------- 6段目（決め手）. 眠っている間に、入れ替わる2人。スマホのメモ（x=130） ----------
const WX = 130;
{ const l = box(4.6, 0.12, 10, mat('#7aa65a')); l.position.set(WX - 2.3, 0.06, 2.2); qs.add(l);
  const r = box(4.6, 0.12, 10, mat('#6a6e78')); r.position.set(WX + 2.3, 0.06, 2.2); qs.add(r);
  [[-3.4, 1.0, 1.8], [-2.2, 0.8, 1.4], [-1.0, 0.7, 1.2]].forEach(([x, rr, h], i) => { const m = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 6), mat(['#4f7a4a', '#5d8a52', '#46703f'][i])); m.position.set(WX + x, 0.12 + h / 2, -2.2); qs.add(m); });
  house(WX - 2.6, -1.3, 0.6);
  [[1.0, 0.7, 2.2], [1.9, 0.8, 3.0], [2.9, 0.8, 2.4], [3.8, 0.7, 1.8]].forEach(([x, w, h], i) => building(WX + x, -2.2, w, h, 0.8, 160 + i, '#9aa4b8').position.y = 0.12 + h / 2); }
const girl6 = makePerson(GIRL); girl6.position.set(WX - 1.25, 0.12, 0.5); girl6.rotation.y = 0.55; qs.add(girl6);
const boy6 = makePerson(BOY); boy6.position.set(WX + 1.25, 0.12, 0.5); boy6.rotation.y = -0.55; qs.add(boy6);
const ORB = [['#ff9ab8', 0xff9ab8], ['#8ac8ff', 0x8ac8ff]].map(([c, h]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: c })); const L = new THREE.PointLight(h, 0, 3, 1.4); m.add(L); m.userData.L = L; qs.add(m); return m; });
const SPARK = makeSparkles(160, 0.18); qs.add(SPARK.points); SPARK.init([[WX - 1.2, 1.35, 0.6], [WX + 1.2, 1.35, 0.6]], 0.3, 1.4);
const PHONE_T = canvasTex(400, 760, (g, w, h) => {
  g.fillStyle = '#16181f'; g.fillRect(0, 0, w, h); g.fillStyle = '#f7f5ee'; g.fillRect(18, 60, w - 36, h - 120);
  g.fillStyle = '#e6b450'; g.fillRect(18, 60, w - 36, 90); g.fillStyle = '#14161c'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('メモ', w / 2, 107);
  for (let i = 0; i < 7; i++) { g.fillStyle = '#c9ccd4'; g.fillRect(56, 196 + i * 70, 270 - (i % 3) * 50, 20); g.fillStyle = '#e2483c'; g.fillRect(30, 198 + i * 70, 14, 14); }
});
function phone() { const g = new THREE.Group(); const body = box(0.5, 0.95, 0.05, mat('#16181f')); g.add(body); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.88), new THREE.MeshBasicMaterial({ map: PHONE_T })); scr.position.z = 0.03; g.add(scr); qs.add(g); return g; }
const PH = [phone(), phone()];
const DOTS = []; for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#e6b450' })); qs.add(d); DOTS.push(d); }
const tSwap = tag('入れ替わり', { size: 84, w: 460, sx: 1.7, bg: '#e2483c' }); tSwap.position.set(WX, 2.75, 0.4); qs.add(tSwap);
const tMemo = tag('スマホのメモ', { size: 74, w: 480, sx: 1.6, bg: '#e6b450', color: '#14161c' }); tMemo.position.set(WX, 3.65, 0.4); qs.add(tMemo);

// ---------- shots ----------
const ALLTAG = [tRoom, tOdd, tGirl, tLong, tBoy, tBig, tTwo, tDream, tJapan, tAnime, tShrine, tSwap, tMemo];
function base() {
  S.reset(); ALLTAG.forEach(x => x.visible = false); Q1.visible = false; [B2, B4a, B4b].forEach(b => b.visible = false); BEDS.forEach(L => L.intensity = 0);
  ORB.forEach(o => { o.visible = false; o.userData.L.intensity = 0; }); PH.forEach(p => p.visible = false); DOTS.forEach(d => d.visible = false); SPARK.set(0);
  [girl6, boy6].forEach(p => { p.userData.arms.forEach(a => a.rotation.x = 0); p.userData.head.rotation.set(0, 0, 0); });
}
function popGroup(g, k, s = 1) { g.visible = k > 0; g.scale.setScalar(s * easeOut(clamp(k))); }

function shotRoom(t, T) { // 1段目 0〜9：朝、目がさめると知らない部屋（0秒目から ？ が出ている）
  base(); S.aim(0, -2); lift(170);
  SUN.intensity = 7;
  if (T < 5.6) { wonder(sleeper, T); sleeper.userData.arms.forEach(a => a.rotation.x = 0); Q1.visible = true; Q1.scale.setScalar(0.55 * (1 + 0.06 * Math.sin(T * 6))); tRoom.userData.pop((T - 2.7) / 0.35); }
  else { lookHands(sleeper, ease((T - 5.6) / 0.7)); sleeper.userData.head.rotation.y = 0; tOdd.userData.pop((T - 5.8) / 0.35); }
  const u = ease(T / 9);
  look(lerp(0.7, 0.4, u), lerp(2.1, 1.95, u), lerp(2.2, 1.7, u), -0.9, lerp(1.6, 1.5, u), -1.85, 54);
  return qs;
}
function shotGirl(t) { // 2段目 9〜17：山深い田舎町の女子高校生。都会にあこがれる
  base(); S.aim(TX, -2); lift(90);
  const hk = ease(clamp((t - 4.0) / 0.6)); girl2.userData.head.rotation.x = -0.35 * hk; girl2.userData.head.rotation.y = 0.5 * hk;
  if (t < 4.2) tGirl.userData.pop((t - 0.6) / 0.35);
  else { popGroup(B2, (t - 4.2) / 0.5, 0.75); tLong.userData.pop((t - 4.5) / 0.35); }
  const u = ease(t / 8);
  look(lerp(TX + 0.4, TX + 0.2, u), lerp(1.7, 1.9, u), lerp(7.0, 6.4, u), TX, lerp(2.1, 2.3, u), -2, 54);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：遠く離れた、人であふれる大都会。男子高校生
  base(); S.aim(CX, 0); lift(180);
  CROWD.forEach((c, i) => { const x = c.x0 + c.dir * ((t * 0.9 + c.ph) % 6 - 3); c.p.position.set(x, 0, c.z); c.p.rotation.y = c.dir * Math.PI / 2; poseWalk(c.p, t * 8 + i, 0.9); });
  boy3.position.set(CX - 0.5 + t * 0.12, 0, 2.2); boy3.rotation.y = 0.75; poseWalk(boy3, t * 8, 0.9);
  if (t < 4.0) tBig.userData.pop((t - 0.6) / 0.35);
  tBoy.position.set(boy3.position.x, 2.45, 2.2); tBoy.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(CX + 0.9, CX + 0.6, u), lerp(1.8, 1.9, u), lerp(8.6, 7.4, u), CX + 0.2, lerp(2.6, 2.3, u), 0, 56);
  return qs;
}
function shotDream(t) { // 4段目 25〜33：遠く離れて暮らす見知らぬ2人が、不思議な夢を見はじめる
  base(); S.aim(DX, 0); lift(230);
  S.hemi.intensity = 0.55; S.key.intensity = 0.25; S.darken(0.7, '#141a30');
  BEDS.forEach(L => L.intensity = 4);
  if (t < 4.0) tTwo.userData.pop((t - 0.6) / 0.35);
  else { popGroup(B4a, (t - 4.0) / 0.5, 1); popGroup(B4b, (t - 4.3) / 0.5, 1); tDream.userData.pop((t - 4.6) / 0.35); }
  [B4a, B4b].forEach((b, i) => { b.position.y = 2.35 + Math.sin(t * 1.6 + i) * 0.05; });
  const u = ease(t / 8);
  look(DX, lerp(3.8, 3.5, u), lerp(8.0, 7.2, u), DX, lerp(1.5, 1.6, u), -0.9, 54);
  return qs;
}
function shotShrine(t) { // 5段目 33〜42：舞台は日本。女の子は古い神社の娘。日本のアニメ映画
  base(); S.aim(JX, -1); lift(230);
  girl5.userData.arms[0].rotation.x = -0.3 + Math.sin(t * 2.2) * 0.25;
  if (t < 4.2) tJapan.userData.pop((t - 0.6) / 0.35);
  else { tAnime.userData.pop((t - 4.2) / 0.35); tShrine.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(JX + 0.6, JX + 0.3, u), lerp(1.6, 1.8, u), lerp(8.4, 7.4, u), JX, lerp(2.1, 2.0, u), -1.6, 54);
  return qs;
}
const A0 = new THREE.Vector3(WX - 1.2, 1.25, 0.6), B0 = new THREE.Vector3(WX + 1.2, 1.25, 0.6);
function swapState(t) { // 2人から出た光が、相手の体に入れ替わる
  const k = ease(clamp((t - 0.3) / 1.2));
  ORB.forEach((o, i) => { const a = i ? B0 : A0, b = i ? A0 : B0; o.visible = t > 0.15 && t < 1.65; o.position.lerpVectors(a, b, k); o.position.y += Math.sin(Math.PI * k) * 1.0; o.position.z += (i ? -1 : 1) * Math.sin(Math.PI * k) * 0.5; o.userData.L.intensity = 4; o.scale.setScalar(easeOut(clamp((t - 0.15) / 0.25))); });
  if (t > 1.45) { SPARK.set(clamp((t - 1.45) / 1.0)); }
  const h = 0.7 * ease(clamp((t - 1.6) / 0.5));
  [girl6, boy6].forEach(p => lookHands(p, h * (t < 3.3 ? 1 : 1 - ease(clamp((t - 3.3) / 0.5)))));
}
function phones(t, t0) {
  PH.forEach((p, i) => { const k = easeOut(clamp((t - t0 - i * 0.2) / 0.45)); p.visible = k > 0; const x = i ? WX + 1.05 : WX - 1.05; p.position.set(x, 2.75 + Math.sin(t * 1.8 + i) * 0.03, 0.7); p.rotation.set(0, (i ? -1 : 1) * 0.15, 0); p.scale.setScalar(0.85 * k); });
  DOTS.forEach((d, i) => { const s = ((t - t0 - 0.9) * 0.6 + i / 5) % 1; d.visible = t > t0 + 0.9; const dir = Math.floor((t - t0) / 1.6) % 2; const u = dir ? 1 - s : s; d.position.set(lerp(WX - 0.65, WX + 0.65, u), 2.85 + Math.sin(Math.PI * u) * 0.22, 0.7); });
}
function shotSwap(t) { // 6段目 42〜49（決め手）：眠っている間に、2人は入れ替わっていた。スマホのメモでつながる
  base(); S.aim(WX, 0); lift(170);
  swapState(t);
  if (t < 3.5) tSwap.userData.pop((t - 1.6) / 0.35);
  else { tMemo.userData.pop((t - 3.5) / 0.35); phones(t, 3.45); }
  const u = ease(t / 7);
  look(WX, lerp(1.9, 2.1, u), lerp(7.8, 7.2, u), WX, lerp(2.0, 2.2, u), 0, 54);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（メモでつながる2人を、引きで）
  base(); S.aim(WX, 0); lift(120);
  phones(t + 4, 3.4);
  const k = ease(t / 7);
  look(WX, lerp(2.1, 3.4, k), lerp(7.2, 9.6, k), WX, lerp(2.2, 2.1, k), -0.4, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotRoom(t, T) },
  { a: 9, b: 17, f: shotGirl },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotDream },
  { a: 33, b: 42, f: shotShrine },
  { a: 42, b: 49, f: shotSwap },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '朝、目がさめると、<br>知らない部屋。'],
  [5.6, 9.0, 'ここは、どこ？<br>なにかが、おかしい。'],
  [9.2, 13.2, '山深い田舎町で暮らす、<br>女子高校生。'],
  [13.2, 17.0, 'いつか、都会で<br>暮らしてみたい。'],
  [17.2, 21.0, 'いっぽう、遠く離れた<br>人であふれる大都会。'],
  [21.0, 25.0, 'そこで暮らす、<br>ひとりの男子高校生。'],
  [25.2, 29.0, '遠く離れて暮らす、<br>見知らぬ2人。'],
  [29.0, 33.0, 'ある日から、<br>不思議な夢を見はじめる。'],
  [33.2, 37.4, '舞台は日本の、<br>山奥の町と大都会。'],
  [37.4, 41.8, '女の子は、古い神社の娘。<br>日本のアニメ映画。'],
  [42.2, 45.4, '眠っている間に、<br>2人は入れ替わっていた。'],
  [45.4, 49.0, 'スマホのメモでつながる、<br>見知らぬ2人の物語。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>君の名は。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotCity || f === shotShrine,
  meta: {
    id: 'q007', v2: true, answer: '君の名は。',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 707,
    hits: [5.6, 29.0, 43.8, 56.4], risers: [40.0, 52.0],
    impacts: [0.3, 5.6, 33.2, 43.8, 56.4],
    sfx: [[0.2, 'whoosh'], [5.7, 'poof'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'drone'], [29.0, 'bubble'], [33.0, 'whoosh'], [42.0, 'whoosh'], [43.6, 'poof'], [49.0, 'meter', 0.5]],
    narr: { '君の名は。': 'きみのなは。', '山深い': 'やまぶかい', '田舎町': 'いなかまち', '女子高校生': 'じょしこうこうせい', '男子高校生': 'だんしこうこうせい', '大都会': 'だいとかい', '暮らす': 'くらす', '暮らして': 'くらして', '遠く': 'とおく', '離れた': 'はなれた', '離れて': 'はなれて', '見知らぬ': 'みしらぬ', '2人': 'ふたり', '不思議': 'ふしぎ', '舞台': 'ぶたい', '山奥': 'やまおく', '神社': 'じんじゃ', '娘': 'むすめ', '眠って': 'ねむって', '入れ替わって': 'いれかわって', '物語': 'ものがたり' },
    caption: 'この映画のタイトル、わかる？\n朝、目がさめると、知らない部屋。山深い田舎町で暮らし、都会にあこがれる女子高校生。いっぽう遠く離れた大都会には、ひとりの男子高校生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'アニメ映画', '名作映画'],
  },
});
applyQuizCards({ answer: '君の名は。', info: 'Netflix｜アニメ映画・107分', answerSize: 128 });
