import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #031 ハリー・ポッターと賢者の石（映画・イギリス/アメリカ・2001年・152分・ファンタジー。Hulu・Prime Videoで見放題、
//   justwatch.com/jp/映画/haripotsutatoxian-zhe-noshi で2026/11/3確認。Filmarks 4.1・レビュー340,949件 filmarks.com/movies/14348）
// 確かめた事実（movie.jorudan.co.jp/film/32579/ の解説とあらすじ・上映時間152分）：
//   ・孤児のハリーは、亡くなった母親の妹の一家に引き取られ、抑圧されたみじめな生活。11歳の誕生日が近づいたある日、手紙が届く。それは魔法魔術学校の入学許可証。
//   ・ハリーの両親は優れた魔法使いで、悪の魔法使いとの戦いの際に死んでしまった。ハリーも魔法界では有名人。
//   ・9月の最初の日、ロンドンの駅から特急に乗って学校へ。その中で同級生の少女や少年とさっそく仲良くなる。学校には意地の悪い先生がいる。
//   ・孤児の少年が魔法使いとして成長していく様を描くファンタジー。原作はJ・K・ローリングの大ベストセラー小説
// 構成（ヒント6段）：1 11歳の誕生日の前に一通の手紙、ある学校の入学許可証 → 2 親を亡くし、親せきの家でみじめな毎日
//   → 3 大きな駅から特別な列車、遠くの学校へ → 4 列車で仲良くなった2人、意地の悪い先生も → 5 ロンドンから始まるファンタジー、原作は大ベストセラー
//   → 6 決め手：両親は魔法使い、少年は魔法の学校へ
// 俳優の見た目（丸メガネ・額の傷）・制服や寮の色・ロゴ・有名な場面（手紙が大量に降る・階段下の部屋・壁に駆けこむ・赤い機関車・ふくろう）は使わない。結末・黒幕には触れない

const S = quizStage({ bg: '#1a1e2c', floor: '#22283a', fogNear: 24, fogFar: 90 });
const qs = S.scene;
const R = rng(3131);

const BOY = { skin: '#f1cfb0', hair: '#1e1a18', shirt: '#6a7a8a', pants: '#3a3f4a' };
const GIRL = { skin: '#f3d2b4', hair: '#6a4024', shirt: '#8a6a9a', pants: '#3a3f4a', long: true, skirt: true };
const FRIEND = { skin: '#f4d6bc', hair: '#c8642a', shirt: '#5a7a5a', pants: '#3a3f4a' };
const TEACH = { skin: '#e8d2bc', hair: '#141414', shirt: '#121216', pants: '#121216', long: true };
const UNCLE = { skin: '#ecc9a6', hair: '#4a3a2a', shirt: '#7a5a3a', pants: '#3b3f4a' };
const AUNT = { skin: '#f0d0b0', hair: '#c8a86a', shirt: '#c8a0b0', pants: '#5a4a5a', long: true, skirt: true };
const COUSIN = { skin: '#f0cca8', hair: '#d8b880', shirt: '#4a6a9a', pants: '#3a3a4a' };
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }
function robe(p) { const r = box(0.6, 1.2, 0.36, mat('#0e0e12')); r.position.y = 0.8; p.add(r); return p; }
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -1.45); return p; }
const ENVTEX = canvasTex(256, 180, (g, w, h) => { g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8b890'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h * 0.55); g.lineTo(w, 0); g.stroke(); g.fillStyle = '#a8241e'; g.beginPath(); g.arc(w / 2, h * 0.55, 22, 0, Math.PI * 2); g.fill(); });

// ---------- 1段目. 朝の玄関（x=0）。11歳の誕生日の前に、一通の手紙 ----------
{ const fl = box(10, 0.04, 8, mat('#8a6a4a')); fl.position.set(0, 0.02, 0); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#d8ccb4')); wl.position.set(0, 2.5, -2.4); qs.add(wl);
  const door = box(1.4, 2.4, 0.1, mat('#3a5a4a')); door.position.set(0, 1.2, -2.25); qs.add(door);
  const slot = box(0.5, 0.08, 0.04, mat('#c8a840')); slot.position.set(0, 1.2, -2.18); qs.add(slot);
  const mat0 = box(1.4, 0.03, 0.8, mat('#6a3a2a')); mat0.position.set(0, 0.04, -1.6); qs.add(mat0);
  for (const x of [-2.6, 2.6]) { const st = box(0.9, 1.0, 0.4, mat('#5a4030')); st.position.set(x, 0.5, -2.0); qs.add(st); } }
const LIGHT1 = new THREE.SpotLight(0xffe8b0, 0, 8, 0.5, 0.5, 1); LIGHT1.position.set(0.4, 3.5, 0.5); LIGHT1.target.position.set(0, 0, -1.5); qs.add(LIGHT1); qs.add(LIGHT1.target);
const ENVGLOW = new THREE.PointLight(0xffd890, 0, 3, 1.5); ENVGLOW.position.set(0, 0.5, -1.4); qs.add(ENVGLOW);
const ENV1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({ map: ENVTEX, side: THREE.DoubleSide })); qs.add(ENV1);
const boy1 = makePerson(BOY); boy1.position.set(0.9, 0, 0.4); boy1.rotation.y = Math.PI + 0.5; qs.add(boy1);
const t11 = tag('もうすぐ11歳', { size: 70, w: 440, bg: '#14161c', sx: 1.3 }); t11.position.set(-0.3, 1.35, -1.2); qs.add(t11);
const tAdmit = tag('入学許可証', { size: 78, w: 440, bg: '#e2483c', sx: 1.4 }); tAdmit.position.set(0.1, 2.6, -0.4); qs.add(tAdmit);

// ---------- 2段目. 親せきの家（x=30）。食卓でにぎやかな一家と、ひとり離れた少年 ----------
const HX = 30;
{ const fl = box(12, 0.04, 9, mat('#a88a6a')); fl.position.set(HX, 0.02, 0); qs.add(fl); const wl = box(12, 5, 0.2, mat('#e8dcc8')); wl.position.set(HX, 2.5, -2.8); qs.add(wl);
  const tbl = box(2.4, 0.75, 1.2, mat('#f4f0e8')); tbl.position.set(HX - 1.2, 0.38, -1.0); qs.add(tbl);
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 20), mat('#f0c8d0')); cake.position.set(HX - 1.2, 0.88, -1.0); qs.add(cake);
  for (const x of [-0.6, 0.6]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16), mat('#ffffff')); pl.position.set(HX - 1.2 + x, 0.77, -0.8); qs.add(pl); }
  const broomS = box(0.05, 1.3, 0.05, mat('#8a6a3a')); broomS.position.set(HX + 2.0, 0.75, 0.0); broomS.rotation.z = 0.25; qs.add(broomS); }
const FAMILY = [[UNCLE, -2.2, -1.0, Math.PI / 2], [AUNT, -0.2, -1.0, -Math.PI / 2], [COUSIN, -1.2, -1.9, 0]].map(([o, dx, z, r]) => { const p = makePerson(o); p.position.set(HX + dx, 0, z); p.rotation.y = r; if (o === UNCLE) p.scale.set(1.25, 1.05, 1.25); if (o === COUSIN) p.scale.set(1.2, 0.95, 1.2); qs.add(p); return p; });
const boy2 = makePerson(BOY); boy2.position.set(HX + 1.7, 0, 0.3); boy2.rotation.y = -0.4; qs.add(boy2);
const tOrphan = tag('親を亡くした少年', { size: 62, w: 540, bg: '#14161c', sx: 2.0 }); tOrphan.position.set(HX + 0.8, 2.35, 0.3); qs.add(tOrphan);
const tMiser = tag('みじめな毎日', { size: 70, w: 460, bg: '#e2483c', sx: 1.8 }); tMiser.position.set(HX + 0.9, 2.35, 0.3); qs.add(tMiser);

// ---------- 3段目. 大きな駅と特別な列車（x=60）→ 遠くの学校 ----------
const SX = 60;
{ const pf = box(16, 0.6, 3, mat('#8a8478')); pf.position.set(SX, 0.3, 1.0); qs.add(pf);
  const rail = box(30, 0.04, 2.4, mat('#3a3630')); rail.position.set(SX, 0.02, -1.6); qs.add(rail);
  for (let i = 0; i < 8; i++) { const c = box(0.3, 5, 0.3, mat('#4a4a52')); c.position.set(SX - 7 + i * 2, 2.5, 2.4); qs.add(c); }
  const clockF = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ color: '#f4eee0' })); clockF.position.set(SX + 2, 4.3, 2.2); qs.add(clockF); }
const TRAIN = new THREE.Group(); TRAIN.position.set(SX, 0, -1.6); qs.add(TRAIN);
{ const body = mat('#2a4a6a'), dark = mat('#1a1a1e');
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 3.2, 20), body); boiler.rotation.z = Math.PI / 2; boiler.position.set(-1.0, 1.4, 0); TRAIN.add(boiler);
  const cab = box(1.6, 2.2, 1.7, body); cab.position.set(1.3, 1.5, 0); TRAIN.add(cab);
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.8, 12), dark); chim.position.set(-2.0, 2.4, 0); TRAIN.add(chim);
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.2, 18), dark); w.rotation.x = Math.PI / 2; w.position.set(-2 + i * 1.2, 0.45, 0.85); TRAIN.add(w); }
  for (let c = 0; c < 2; c++) { const car = box(4.2, 2.0, 1.8, mat('#3a5a7a')); car.position.set(4.6 + c * 4.6, 1.4, 0); TRAIN.add(car); for (let i = 0; i < 4; i++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); wn.position.set(3.2 + c * 4.6 + i * 0.95, 1.7, 0.91); TRAIN.add(wn); } } }
const STEAM = []; for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshLambertMaterial({ color: '#e8eaee', transparent: true, opacity: 0.7 })); s.userData.o = R() * 3; qs.add(s); STEAM.push(s); }
const boy3 = makePerson(BOY); boy3.position.set(SX - 1, 0.6, 1.2); boy3.rotation.y = Math.PI * 0.85; qs.add(boy3);
const TRUNK = box(0.7, 0.4, 0.4, mat('#6a3a24')); TRUNK.position.set(SX - 0.4, 0.8, 1.3); qs.add(TRUNK);
const tTrain = tag('特別な列車', { size: 74, w: 420, bg: '#14161c', sx: 1.8 }); tTrain.position.set(SX - 0.6, 3.4, -1.2); qs.add(tTrain);
const tFar = tag('遠くの学校へ', { size: 72, w: 440, bg: '#e6b450', color: '#14161c', sx: 9.0 }); tFar.position.set(SX + 29, 17, -27); qs.add(tFar);
// 夜の丘の上の学校（シルエット。決まった建物の形はなぞらない）
const SCHOOL = new THREE.Group(); SCHOOL.position.set(SX + 30, 0, -30); qs.add(SCHOOL);
{ const hill = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#1e2a24')); hill.scale.set(1.6, 0.35, 1); SCHOOL.add(hill);
  const bm = mat('#2a2e3a'); const wm = new THREE.MeshBasicMaterial({ color: '#ffd890' });
  for (const [x, w, h] of [[-5, 3, 6], [-1.5, 3.6, 9], [2.6, 2.6, 7], [5.6, 2.2, 5]]) { const b = box(w, h, 3, bm); b.position.set(x, 4.6 + h / 2, 0); SCHOOL.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.6, 2.4, 4), bm); r.position.set(x, 4.6 + h + 1.2, 0); r.rotation.y = Math.PI / 4; SCHOOL.add(r);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.6), wm); wn.position.set(x - 0.6 + j * 1.2, 5.6 + i * 1.6, 1.52); SCHOOL.add(wn); } } }

// ---------- 4段目. 列車の個室（x=90）。仲良くなった2人と、意地の悪い先生 ----------
const CX = 90;
{ const fl = box(6, 0.04, 5, mat('#5a3a2a')); fl.position.set(CX, 0.02, 0); qs.add(fl);
  const wl = box(6, 4, 0.2, mat('#7a4a32')); wl.position.set(CX, 2, -1.6); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ color: '#7a9ab8' })); win.position.set(CX, 2.2, -1.48); qs.add(win);
  for (const z of [-0.9, 1.2]) { const se = box(2.8, 0.5, 0.6, mat('#8a2a2a')); se.position.set(CX, 0.25, z); qs.add(se); const bk = box(2.8, 0.9, 0.15, mat('#8a2a2a')); bk.position.set(CX, 0.9, z + (z < 0 ? -0.35 : 0.35)); qs.add(bk); } }
const HILLS = []; for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.5 + R() * 0.4, 10, 6), mat('#5a8a5a')); h.userData.o = i * 0.9; qs.add(h); HILLS.push(h); }
const boy4 = sit(makePerson(BOY)); boy4.position.set(CX - 0.7, 0.05, -0.85); qs.add(boy4);
const girl4 = sit(makePerson(GIRL)); girl4.position.set(CX + 0.7, 0.05, -0.85); qs.add(girl4);
const friend4 = sit(makePerson(FRIEND)); friend4.position.set(CX, 0.05, -0.85); qs.add(friend4);
const SWEETS = []; for (let i = 0; i < 6; i++) { const c = box(0.12, 0.12, 0.12, mat(['#e05a4f', '#f2c14e', '#4fa3d1', '#3f8f6b'][i % 4])); qs.add(c); SWEETS.push(c); }
const teacher = robe(makePerson(TEACH)); teacher.position.set(CX + 3.6, 0, 0.4); teacher.rotation.y = -Math.PI / 2; qs.add(teacher);
const tFriends = tag('すぐに仲良くなった', { size: 60, w: 600, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tFriends.position.set(CX, 2.25, -0.6); qs.add(tFriends);
const tMean = tag('意地の悪い先生', { size: 62, w: 520, bg: '#e2483c', sx: 1.4 }); tMean.position.set(CX + 1.0, 2.4, 0.4); qs.add(tMean);

// ---------- 5段目. 大きな本（x=120）。ロンドンから始まるファンタジー、原作は大ベストセラー ----------
const BX = 120;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1a2a' })); bg.position.set(BX, 4, -3); qs.add(bg);
  const tb = box(5, 0.2, 3, mat('#4a3020')); tb.position.set(BX, 0.9, 0); qs.add(tb); }
const BOOK = new THREE.Group(); BOOK.position.set(BX, 1.02, 0); qs.add(BOOK);
const PAGE_TEX = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,40,20,.45)'; for (let y = 30; y < 320; y += 22) g.fillRect(24, y, w - 48 - ((y * 11) % 60), 8); });
{ const cov = box(2.6, 0.08, 1.7, mat('#5a1e1e')); BOOK.add(cov); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.6), new THREE.MeshLambertMaterial({ map: PAGE_TEX })); p.rotation.x = -Math.PI / 2; p.position.set(s * 0.64, 0.06, 0); BOOK.add(p); } }
const FLIPS = [0, 1, 2].map(i => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.6), new THREE.MeshLambertMaterial({ map: PAGE_TEX, side: THREE.DoubleSide })); p.geometry.translate(0.625, 0, 0); p.rotation.x = -Math.PI / 2; const g = new THREE.Group(); g.position.set(0, 0.07, 0); g.add(p); BOOK.add(g); return g; });
const DUST = []; for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true })); d.userData.a = R() * Math.PI * 2; d.userData.s = 0.3 + R() * 0.6; d.userData.o = R() * 4; qs.add(d); DUST.push(d); }
const tUK = tag('ロンドンから始まるファンタジー', { size: 54, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.6 }); tUK.position.set(BX, 2.7, 0); qs.add(tUK);
const tBest = tag('原作は大ベストセラー', { size: 62, w: 660, bg: '#e2483c', sx: 2.2 }); tBest.position.set(BX, 2.7, 0); qs.add(tBest);

// ---------- 6段目. 夜の中庭（x=150）。両親は魔法使い、少年は魔法の学校へ ----------
const MX = 150;
{ const gr = new THREE.Mesh(new THREE.CircleGeometry(5, 40), mat('#3a4a3a')); gr.rotation.x = -Math.PI / 2; gr.position.set(MX, 0.02, 0); qs.add(gr); }
const boy6 = makePerson(BOY); boy6.position.set(MX, 0, 0); qs.add(boy6);
const STICK = box(0.04, 0.42, 0.04, mat('#5a3a20')); STICK.position.set(0, -0.78, 0.12); STICK.rotation.x = -0.6; boy6.userData.arms[1].add(STICK);
const SPARK = []; for (let i = 0; i < 46; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ color: ['#ffe08a', '#9ad8ff', '#ffffff'][i % 3], transparent: true, depthWrite: false })); s.userData.a = R() * Math.PI * 2; s.userData.r = 0.3 + R() * 1.5; s.userData.h = R() * 2.4; s.userData.o = R(); qs.add(s); SPARK.push(s); }
const tParents = tag('両親は魔法使い', { size: 66, w: 520, bg: '#14161c', sx: 1.5 }); tParents.position.set(MX, 2.65, 0.2); qs.add(tParents);
const tMagic = tag('魔法の学校へ入学', { size: 64, w: 560, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tMagic.position.set(MX, 2.65, 0.2); qs.add(tMagic);

// ---------- shots ----------
const ALL = [t11, tAdmit, tOrphan, tMiser, tTrain, tFar, tFriends, tMean, tUK, tBest, tParents, tMagic];
function base() { S.reset(); ENVGLOW.intensity = 0; ALL.forEach(x => x.visible = false); LIGHT1.intensity = 0; STEAM.forEach(s => s.visible = false); DUST.forEach(d => d.visible = false); SPARK.forEach(s => s.visible = false); HILLS.forEach(h => h.visible = false); SWEETS.forEach(c => c.visible = false); }

function shotLetter(t, T) { // 1段目 0〜9：11歳の誕生日の前に、一通の手紙。それは、ある学校の入学許可証（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-40); S.hemi.intensity = 0.9; S.darken(0.3, '#1a1420'); LIGHT1.intensity = 30;
  const pick = ease((T - 3.4) / 1.0);
  const glow = 0.6 + 0.4 * Math.sin(T * 6);
  const turn = ease((T - 4.4) / 0.8); boy1.rotation.y = lerp(Math.PI + 0.5, 0.35, turn);
  ENV1.position.set(lerp(0, lerp(0.75, 1.05, turn), pick), lerp(0.07, 1.2, pick), lerp(-1.5, lerp(0.0, 0.8, turn), pick)); ENV1.rotation.set(lerp(-Math.PI / 2, -0.15, pick), lerp(0.3, lerp(Math.PI + 0.5, 0.35, turn), pick), 0); ENV1.scale.setScalar((1.7 - 0.7 * pick) * (1 + 0.08 * glow * (1 - pick))); ENVGLOW.intensity = 6 * glow * (1 - pick);
  boy1.userData.arms[0].rotation.x = -1.1 * pick; boy1.userData.arms[1].rotation.x = -1.1 * pick; boy1.userData.head.rotation.x = 0.35 * (1 - pick) + 0.25 * pick;
  t11.userData.pop(1); if (T > 4.8) t11.visible = false;
  tAdmit.userData.pop((T - 5.0) / 0.35); tAdmit.position.set(0.4, 2.15, 0.6);
  const u = ease(T / 9);
  look(lerp(-0.8, -0.4, u), lerp(2.2, 2.1, u), lerp(5.6, 5.2, u), lerp(0.1, 0.3, u), lerp(0.8, 1.1, u), -0.6, 56);
  return qs;
}
function shotHouse(t) { // 2段目 9〜17：親を亡くした少年。親せきの家で、みじめな毎日
  base(); S.aim(HX, 0); lift(-40); S.hemi.intensity = 1.35;
  FAMILY.forEach((p, i) => { p.userData.arms[0].rotation.x = -0.6 + Math.sin(t * 4 + i) * 0.2; p.userData.head.rotation.z = Math.sin(t * 3 + i) * 0.08; });
  boy2.userData.arms[1].rotation.x = -0.4 + Math.sin(t * 2.4) * 0.15; boy2.userData.head.rotation.x = 0.35;
  tOrphan.userData.pop((t - 0.5) / 0.35); if (t > 3.9) tOrphan.visible = false;
  tMiser.userData.pop((t - 4.1) / 0.35);
  const u = ease(t / 8);
  look(HX + lerp(0.0, 0.3, u), lerp(2.4, 2.3, u), lerp(7.6, 7.0, u), HX + 0.0, 1.2, -0.6, 56);
  return qs;
}
function shotStation(t) { // 3段目 17〜25：大きな駅から、特別な列車に乗って。向かうのは、遠くにある特別な学校
  base(); S.aim(SX, 0); lift(-40); S.hemi.intensity = 1.4; S.darken(0.45, '#0e1226');
  STEAM.forEach((s, i) => { s.visible = true; const k = ((t * 0.5 + s.userData.o) % 3) / 3; s.position.set(SX - 2.0 - k * 1.5, 2.8 + k * 2.4, -1.6 + Math.sin(i) * 0.3); s.scale.setScalar(0.5 + k * 1.4); s.material.opacity = 0.7 * (1 - k); });
  const go = ease((t - 4.0) / 3);
  TRAIN.position.x = SX - go * 4;
  tTrain.userData.pop((t - 0.5) / 0.35); if (t > 3.9) tTrain.visible = false;
  tFar.userData.pop((t - 4.2) / 0.35);
  const pan = ease((t - 3.8) / 2.2);
  look(lerp(SX + 2.4, SX + 3.0, pan), lerp(2.4, 3.4, pan), lerp(8.0, 9.0, pan), lerp(SX - 0.6, SX + 30, pan), lerp(1.8, 9.0, pan), lerp(-0.6, -30, pan), 56);
  SCHOOL.visible = true;
  return qs;
}
function shotCabin(t) { // 4段目 25〜33：列車の中で、すぐに仲良くなった2人。学校には、意地の悪い先生も
  base(); S.aim(CX, 0); lift(-40); S.hemi.intensity = 1.3;
  HILLS.forEach((h, i) => { h.visible = true; const x = ((t * 1.6 + h.userData.o) % 5.4) - 2.7; h.position.set(CX - x, 1.8 + (i % 2) * 0.2, -1.9); });
  SWEETS.forEach((c, i) => { c.visible = true; c.position.set(CX - 0.35 + (i % 3) * 0.35, 0.72 + Math.abs(Math.sin(t * 3 + i)) * 0.08 * clamp((t - 1) / 0.5), -0.55 + Math.floor(i / 3) * 0.12); });
  [boy4, girl4, friend4].forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 2 + i) * 0.3; p.userData.arms[i % 2].rotation.x = -0.4 - Math.abs(Math.sin(t * 3 + i)) * 0.4; });
  const tin = ease((t - 4.0) / 1.2); teacher.position.x = lerp(CX + 3.6, CX + 1.6, tin); walk(teacher, t * 6, t > 4 && t < 5.2 ? 1 : 0);
  if (t > 4.2) [boy4, girl4, friend4].forEach(p => { p.userData.head.rotation.y = 0.8; });
  tFriends.userData.pop((t - 0.6) / 0.35); if (t > 3.9) tFriends.visible = false;
  tMean.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.4, 0.7, u), 1.6, lerp(5.0, 4.8, u), CX + lerp(0.3, 0.6, u), 1.1, -0.6, 58);
  return qs;
}
function shotBook(t) { // 5段目 33〜42：ロンドンから始まるファンタジー。原作は、大ベストセラー小説
  base(); S.aim(BX, 0); lift(-40); S.hemi.intensity = 1.0; S.key.intensity = 1.0;
  FLIPS.forEach((g, i) => { const k = ease(clamp((t - 0.8 - i * 0.9) / 0.8)); g.rotation.z = Math.PI * k; g.visible = k < 1; });
  DUST.forEach(d => { d.visible = true; const k = ((t * d.userData.s + d.userData.o) % 2.5) / 2.5; d.position.set(BX + Math.cos(d.userData.a) * (0.3 + k * 1.2), 1.1 + k * 2.2, Math.sin(d.userData.a) * (0.3 + k * 0.8)); d.material.opacity = 1 - k; d.lookAt(BX, 2, 6); });
  tUK.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUK.visible = false;
  tBest.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(BX, lerp(3.0, 2.9, u), lerp(5.4, 4.8, u), BX, 1.7, 0, 56);
  return qs;
}
function shotMagic(t) { // 6段目 42〜49（決め手）：実は、両親は魔法使い。少年は、魔法の学校へ入学する
  base(); S.aim(MX, 0); lift(-40); S.hemi.intensity = 1.0; S.key.intensity = 0.6; S.darken(0.7, '#0a0c1e');
  boy6.userData.arms[1].rotation.x = -1.6 * ease((t - 2.8) / 0.5);
  SPARK.forEach(s => { const on = clamp((t - 3.2) / 0.6); s.visible = on > 0; const k = (t * 0.6 + s.userData.o) % 1; s.position.set(MX + Math.cos(s.userData.a + t) * s.userData.r * on, 0.4 + s.userData.h + k * 0.6, Math.sin(s.userData.a + t) * s.userData.r * on); s.material.opacity = on * (1 - k); s.lookAt(MX, 1.6, 6); });
  tParents.userData.pop((t - 0.4) / 0.35); if (t > 3.1) tParents.visible = false;
  tMagic.userData.pop((t - 3.3) / 0.35);
  const u = ease(t / 7);
  look(MX, lerp(1.8, 1.9, u), lerp(5.0, 4.4, u), MX, 1.4, 0, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の丘の学校を見上げる少年）
  base(); S.aim(MX, 0); lift(-40);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.6, 0.15, d); S.key.intensity = lerp(0.3, 0, d); S.darken(lerp(0.75, 1, d), '#05060c');
  boy6.userData.arms[1].rotation.x = 0;
  S.spot.position.set(MX, 5, 2); S.spot.target.position.set(MX, 1, 0); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(MX + lerp(0.6, 0.2, k), lerp(1.8, 2.1, k), lerp(4.8, 4.0, k), MX, 1.3, 0, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotLetter },
  { a: 9, b: 17, f: shotHouse },
  { a: 17, b: 25, f: shotStation },
  { a: 25, b: 33, f: shotCabin },
  { a: 33, b: 42, f: shotBook },
  { a: 42, b: 49, f: shotMagic },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '11歳の誕生日を前に、<br>一通の手紙が届いた。'],
  [5.6, 9.0, 'それは、ある学校の<br>入学許可証。'],
  [9.2, 13.2, '両親を亡くした、<br>ひとりの少年。'],
  [13.2, 17.0, '親せきの家で、<br>みじめな毎日を送っていた。'],
  [17.2, 21.0, '大きな駅から、<br>特別な列車に乗って。'],
  [21.0, 25.0, '向かうのは、<br>遠くにある学校。'],
  [25.2, 29.0, '列車の中で、<br>すぐに仲良くなった2人。'],
  [29.0, 33.0, '学校には、<br>意地の悪い先生も。'],
  [33.2, 37.4, 'ロンドンから始まる、<br>ファンタジー映画。'],
  [37.4, 41.8, '原作は、<br>大ベストセラー小説。'],
  [42.2, 45.4, '実は、両親は<br>魔法使いだった。'],
  [45.4, 49.0, '少年は、<br>魔法の学校へ入学する。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ハリー・ポッターと賢者の石。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q031', v2: true, answer: 'ハリー・ポッターと賢者の石',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 3131,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [3.4, 5.6, 13.2, 21.2, 25.8, 29.6, 37.6, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.2, 'poof'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '賢者の石': 'けんじゃのいし', '11歳': 'じゅういっさい', '誕生日': 'たんじょうび', '一通': 'いっつう', '手紙': 'てがみ', '届いた': 'とどいた', '学校': 'がっこう', '入学許可証': 'にゅうがくきょかしょう', '両親': 'りょうしん', '亡くした': 'なくした', '少年': 'しょうねん', '親せき': 'しんせき', '毎日': 'まいにち', '送って': 'おくって', '大きな駅': 'おおきなえき', '特別': 'とくべつ', '列車': 'れっしゃ', '乗って': 'のって', '向かう': 'むかう', '遠く': 'とおく', '中で': 'なかで', '仲良く': 'なかよく', '2人': 'ふたり', '意地': 'いじ', '悪い': 'わるい', '先生': 'せんせい', '始まる': 'はじまる', '映画': 'えいが', '原作': 'げんさく', '大ベストセラー': 'だいベストセラー', '小説': 'しょうせつ', '実は': 'じつは', '魔法使い': 'まほうつかい', '魔法': 'まほう', '入学': 'にゅうがく', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n11歳の誕生日を前に、一通の手紙が届いた。それは、ある学校の入学許可証。両親を亡くしたひとりの少年は、親せきの家でみじめな毎日を送っていた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'PrimeVideo', '映画好き', 'ファンタジー'],
  },
});
applyQuizCards({ answer: 'ハリー・ポッターと<br>賢者の石', info: 'Hulu・Prime Video｜映画・152分', answerSize: 100 });
