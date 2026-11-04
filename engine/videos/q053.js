import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #053 ブラッシュアップライフ（ドラマ・日本・2023年・日本テレビ 日曜ドラマ・全10話。Hulu・Netflixで見放題、
//   justwatch.com/jp/テレビ番組/buratsushiyuatsupuraihu で2026/11/4確認。Filmarks 4.5・レビュー84,424件 filmarks.com/dramas/12912/17798）
// 確かめた事実（Filmarks の第1〜4話の紹介・ja.wikipedia.org/wiki/ブラッシュアップライフ。2026/11/4）：
//   ・地元の市役所で働く33歳・独身の女性。実家で両親と妹と4人暮らし。ある夜、幼なじみ2人との食事のあと交通事故で死ぬ
//   ・気が付くと真っ白な空間。死後の世界の案内人に、来世はグアテマラ南東部のオオアリクイと告げられる
//   ・同じ人生をやり直して徳を積めば、人間に生まれ変わる確率が上がる。2周目は小学生から（頭脳は大人）
//   ・日本テレビ系日曜ドラマ、2023年1月8日〜3月12日、全10話
// 構成（ヒント6段）：1 33歳の夜、突然の事故→真っ白な部屋 → 2 地元の市役所で働く平凡な女性・実家で4人暮らし → 3 幼なじみといつもの店
//   → 4 来世は人間じゃない、と告げられる → 5 2023年の日本のドラマ・全10話、小学生からやり直し → 6 決め手：グアテマラのオオアリクイ、人生2周目
// 「オオアリクイ」「2周目」は6段目まで字幕にも札にも出さない。地名・店名・人物名・案内人の見た目は出さない。結末は言わない。人は汎用の3D

const S = quizStage({ bg: '#2a3040', floor: '#3a3c44', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(5353);

const ASA = { skin: '#f2d4b8', hair: '#3a2418', shirt: '#e8dcc8', pants: '#5a6478', long: true };
const FRIEND1 = { skin: '#f0d0b0', hair: '#2a1a14', shirt: '#d88aa0', pants: '#3a3a4a', long: true, skirt: true };
const FRIEND2 = { skin: '#efcfae', hair: '#5a3a24', shirt: '#7aa8d8', pants: '#2a2e3a', long: false };

// ---------- 1段目. 真っ白な空間（x=0）。気がつくと、ひとりで立っている ----------
const WHITE = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 16), new THREE.MeshBasicMaterial({ color: "#f6f6f2", side: THREE.BackSide, fog: false })); WHITE.position.set(0, 0, 0); qs.add(WHITE);
const WFLOOR = new THREE.Mesh(new THREE.CircleGeometry(15, 48), new THREE.MeshBasicMaterial({ color: '#eceae4', fog: false })); WFLOOR.rotation.x = -Math.PI / 2; WFLOOR.position.set(0, 0.03, 0); qs.add(WFLOOR);
const a1 = makePerson(ASA); a1.position.set(0, 0, 0); qs.add(a1);
const QM = []; for (let i = 0; i < 3; i++) { const q = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(100, 120, (g, w, h) => { g.fillStyle = '#3a7ad8'; g.font = 'bold 100px sans-serif'; g.textAlign = 'center'; g.fillText('?', w / 2, h - 18); }), transparent: true })); q.userData.o = i; qs.add(q); QM.push(q); }
const LIGHTS = []; for (let i = 0; i < 2; i++) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.0 })); qs.add(c); LIGHTS.push(c); }
const t33 = tag('33歳の夜に、事故', { size: 64, w: 560, bg: '#e2483c', sx: 1.75 }); t33.position.set(0, 2.32, 0.3); qs.add(t33);
const tWhite = tag('…え？ 死んだ？', { size: 72, w: 520, bg: '#14161c', sx: 1.7 }); tWhite.position.set(0, 2.32, 0.3); qs.add(tWhite);

// ---------- 2段目. 市役所の窓口（x=40）。いつものように市民に怒られる ----------
const CX = 40;
{ const fl = box(16, 0.04, 12, mat('#c8c4b8')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(16, 6, 0.2, mat('#e6e2d6')); wl.position.set(CX, 3, -4); qs.add(wl);
  const ctr = box(6, 1.05, 0.8, mat('#d8d0bc')); ctr.position.set(CX, 0.52, -0.4); qs.add(ctr);
  const top = box(6.2, 0.06, 0.9, mat('#a89a7a')); top.position.set(CX, 1.08, -0.4); qs.add(top);
  for (let i = 0; i < 3; i++) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.4), new THREE.MeshBasicMaterial({ color: ['#3f8f6b', '#3a7ad8', '#e6b450'][i] })); sg.position.set(CX - 2 + i * 2, 3.4, -3.88); qs.add(sg); }
  for (let i = 0; i < 3; i++) { const d = box(1.4, 0.75, 0.7, mat('#b8b0a0')); d.position.set(CX - 2.4 + i * 2.4, 0.37, -2.2); qs.add(d); const pc = box(0.5, 0.36, 0.05, mat('#2a2e38')); pc.position.set(CX - 2.4 + i * 2.4, 0.95, -2.3); qs.add(pc); } }
const a2 = makePerson({ ...ASA, shirt: '#f4f2ea' }); a2.position.set(CX, 0, -1.0); qs.add(a2);
const VEST = box(0.52, 0.5, 0.3, mat('#4a6a9a')); VEST.position.set(0, 1.2, 0); a2.add(VEST);
const ANGRY = makePerson({ skin: '#e8c8a8', hair: '#8a8a8a', shirt: '#6a5a4a', pants: '#3a3430' }); ANGRY.position.set(CX + 0.2, 0, 0.5); ANGRY.rotation.y = Math.PI; qs.add(ANGRY);
const STEAM = []; for (let i = 0; i < 2; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: canvasTex(96, 96, (g, w, h) => { g.strokeStyle = '#e2483c'; g.lineWidth = 10; g.lineCap = 'round'; for (const [a, b] of [[[20, 38], [38, 20]], [[58, 20], [76, 38]], [[20, 58], [38, 76]], [[58, 76], [76, 58]]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(48, 48, b[0], b[1]); g.stroke(); } }), transparent: true, opacity: 1 })); s.userData.o = i * 0.5; qs.add(s); STEAM.push(s); }
const tCity = tag('地元の市役所勤め', { size: 64, w: 560, bg: '#14161c', sx: 1.9 }); tCity.position.set(CX - 0.3, 2.75, -0.6); qs.add(tCity);
const tHome = tag('実家で4人暮らし', { size: 64, w: 560, bg: '#3f8f6b', sx: 1.9 }); tHome.position.set(CX - 0.3, 2.75, -0.6); qs.add(tHome);

// ---------- 3段目. いつもの店（x=80）。幼なじみ3人のテーブル ----------
const FX = 80;
{ const fl = box(14, 0.04, 12, mat('#7a5a44')); fl.position.set(FX, 0.02, -2); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#d8b890')); wl.position.set(FX, 3, -4); qs.add(wl);
  for (const x of [-3.5, 3.5]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.0), new THREE.MeshBasicMaterial({ color: '#2a3458' })); win.position.set(FX + x, 2.8, -3.88); qs.add(win); }
  for (let i = 0; i < 3; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); lp.position.set(FX - 1.6 + i * 1.6, 3.6, -1.2); qs.add(lp); }
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 28), mat('#efe6d4')); tb.position.set(FX, 0.82, -0.8); qs.add(tb); const lg = box(0.12, 0.8, 0.12, mat('#4a3424')); lg.position.set(FX, 0.4, -0.8); qs.add(lg); }
const FRIENDS = [makePerson(ASA), makePerson(FRIEND1), makePerson(FRIEND2)];
FRIENDS.forEach((p, i) => { const a = -Math.PI / 2 + (i - 1) * 1.15; p.position.set(FX + Math.cos(a) * 1.3, -0.3, -0.8 - Math.sin(a) * 1.3); p.rotation.y = Math.atan2(FX - p.position.x, -0.8 - p.position.z); p.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(p); });
const CUPS = []; for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.2, 12), mat(['#f2c14e', '#e05a4f', '#8ac0e8'][i])); const a = -Math.PI / 2 + (i - 1) * 1.15; c.position.set(FX + Math.cos(a) * 0.62, 0.96, -0.8 - Math.sin(a) * 0.62); qs.add(c); CUPS.push(c); }
const tOsa = tag('幼なじみ3人', { size: 72, w: 440, bg: '#e6b450', color: '#14161c', sx: 1.9 }); tOsa.position.set(FX, 2.6, -0.8); qs.add(tOsa);
const tUsual = tag('いつもの店で、いつもの話', { size: 56, w: 680, bg: '#14161c', sx: 1.9 }); tUsual.position.set(FX, 2.6, -0.8); qs.add(tUsual);

// ---------- 4段目. 白い空間の受付（x=120）。来世を告げられる ----------
const GX = 120;
const WHITE2 = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 16), new THREE.MeshBasicMaterial({ color: "#f6f6f2", side: THREE.BackSide, fog: false })); WHITE2.position.set(GX, 0, 0); qs.add(WHITE2);
const WF2 = new THREE.Mesh(new THREE.CircleGeometry(15, 48), new THREE.MeshBasicMaterial({ color: '#eceae4', fog: false })); WF2.rotation.x = -Math.PI / 2; WF2.position.set(GX, 0.03, 0); qs.add(WF2);
{ const desk = box(1.8, 1.0, 0.7, mat('#ffffff')); desk.position.set(GX + 0.9, 0.5, -0.6); qs.add(desk); }
const GUIDE = makePerson({ skin: '#eccaa8', hair: '#1a1614', shirt: '#ffffff', pants: '#e8e8e8' }); GUIDE.position.set(GX + 0.9, 0, -1.3); qs.add(GUIDE);
const a4 = makePerson(ASA); a4.position.set(GX - 0.9, 0, 0.3); a4.rotation.y = 0.6; qs.add(a4);
const BOARD = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(320, 220, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8c8c8'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#2a2a30'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText('来世', w / 2, 74); g.font = 'bold 120px sans-serif'; g.fillStyle = '#e2483c'; g.fillText('？', w / 2, 196); }) })); BOARD.position.set(GX + 0.9, 2.5, -1.6); qs.add(BOARD);
const tNext = tag('来世は、人間じゃない', { size: 60, w: 640, bg: '#e2483c', sx: 2.1 }); tNext.position.set(GX, 3.5, -0.6); qs.add(tNext);
const tRedo = tag('同じ人生を、もう一度', { size: 60, w: 640, bg: '#3a7ad8', sx: 2.1 }); tRedo.position.set(GX, 3.5, -0.6); qs.add(tRedo);

// ---------- 5段目. テレビの前（x=160）。2023年の日本のドラマ・全10話 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#232030' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f8e0a0'); gr.addColorStop(1, '#8ac8e8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.88)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(46 + (i % 5) * 105, 100 + Math.floor(i / 5) * 90, 22, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const BAG = box(0.5, 0.5, 0.25, mat('#c8303a')); BAG.position.set(TX - 2.6, 0.6, -0.6); qs.add(BAG);
const BAGL = box(0.06, 0.4, 0.06, mat('#a8202a')); BAGL.position.set(TX - 2.6, 0.95, -0.6); qs.add(BAGL);
const tJP = tag('2023年 日本のドラマ', { size: 62, w: 620, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tJP.position.set(TX, 4.6, -1.2); qs.add(tJP);
const t10 = tag('全10話', { size: 80, w: 340, bg: '#3a7ad8', sx: 2.0 }); t10.position.set(TX, 4.6, -1.2); qs.add(t10);
const tKid = tag('小学生から、やり直し', { size: 60, w: 620, bg: '#e2483c', sx: 2.8 }); tKid.position.set(TX, 3.62, -1.0); qs.add(tKid);

// ---------- 6段目. 森の中のオオアリクイ（x=200） ----------
const AX = 200;
{ const fl = box(24, 0.04, 26, mat('#5a7a3a')); fl.position.set(AX, 0.02, 0); qs.add(fl);
  for (let i = 0; i < 14; i++) { const x = AX - 8 + R() * 16, z = -4 - R() * 6; const tr = box(0.4, 4 + R() * 2, 0.4, mat('#5a3a24')); tr.position.set(x, 2.5, z); qs.add(tr); const lf = new THREE.Mesh(new THREE.SphereGeometry(1.2 + R() * 0.6, 10, 8), mat(['#3a7a3a', '#4a8a3a', '#2a6a3a'][i % 3])); lf.position.set(x, 5 + R(), z); qs.add(lf); }
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 10), mat('#a8784a')); m.position.set(AX - 3 + i * 2, 0.5, -2.4 - (i % 2)); qs.add(m); } }
const ANT = new THREE.Group(); ANT.position.set(AX, 0, 0); qs.add(ANT);
{ const brown = mat('#6a5040'), dark = mat('#2a2220'), light = mat('#d8c8a8');
  const body = box(1.6, 0.8, 0.7, brown); body.position.set(0, 0.85, 0); ANT.add(body);
  const stripe = box(1.62, 0.18, 0.72, dark); stripe.position.set(0.2, 1.02, 0); stripe.rotation.z = -0.5; ANT.add(stripe);
  const stripe2 = box(0.5, 0.5, 0.74, light); stripe2.position.set(0.55, 0.92, 0); ANT.add(stripe2);
  const head = box(0.5, 0.42, 0.4, brown); head.position.set(1.0, 0.85, 0); ANT.add(head);
  const snout = box(0.9, 0.18, 0.18, brown); snout.position.set(1.65, 0.72, 0); snout.rotation.z = -0.15; ANT.add(snout);
  const nose = box(0.08, 0.1, 0.1, dark); nose.position.set(2.1, 0.66, 0); ANT.add(nose);
  for (const s of [-1, 1]) { const ey = box(0.05, 0.05, 0.02, dark); ey.position.set(1.12, 0.95, s * 0.2); ANT.add(ey); }
  for (const x of [-0.6, 0.55]) for (const z of [-0.25, 0.25]) { const lg = box(0.2, 0.55, 0.2, x > 0 ? light : dark); lg.position.set(x, 0.27, z); ANT.add(lg); }
  const tail = box(1.2, 0.7, 0.25, brown); tail.position.set(-1.25, 1.0, 0); tail.rotation.z = 0.35; ANT.add(tail);
  for (let i = 0; i < 9; i++) { const fur = box(0.08, 0.35, 0.22, dark); fur.position.set(-0.9 - i * 0.12, 1.3 + Math.sin(i) * 0.04, 0); ANT.add(fur); } }
ANT.rotation.y = 0.15; ANT.scale.setScalar(1.3);
const tAnt = tag('グアテマラのオオアリクイ', { size: 58, w: 720, bg: '#e2483c', sx: 3.6 }); tAnt.position.set(AX, 3.6, -0.4); qs.add(tAnt);
const t2nd = tag('人生、2周目', { size: 76, w: 440, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2nd.position.set(AX, 2.7, -0.2); qs.add(t2nd);

// ---------- shots ----------
const ALL = [t33, tWhite, tCity, tHome, tOsa, tUsual, tNext, tRedo, tJP, t10, tKid, tAnt, t2nd];
function base() { S.reset(); ALL.forEach(x => x.visible = false); QM.forEach(q => q.visible = false); S.floor.visible = true; }

function shotWhite(t) { // 1段目 0〜9：33歳の夜、突然の事故。気がつくと真っ白な部屋（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-40); S.hemi.intensity = 1.5; S.key.intensity = 0.8; S.darken(1, '#f2f2ee'); S.floor.visible = false;
  a1.userData.head.rotation.y = Math.sin(t * 1.4) * 0.6; a1.userData.arms.forEach((a, i) => a.rotation.z = (i ? -1 : 1) * (0.25 + 0.1 * Math.sin(t * 2)));
  a1.position.y = 0.05 + Math.sin(t * 1.2) * 0.05;
  QM.forEach((q, i) => { q.visible = t > 4.6; q.position.set(-0.7 + i * 0.7, 2.0 + Math.sin(t * 2 + i) * 0.08 + i % 2 * 0.15, 0.2); q.scale.setScalar(ease((t - 4.6 - i * 0.25) / 0.3)); });
  t33.userData.pop(1); if (t > 4.6) t33.visible = false;
  tWhite.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(2.0, 1.8, u), lerp(5.4, 4.0, u), 0, 1.45, 0, 54);
  return qs;
}
function shotCity(t) { // 2段目 9〜17：地元の市役所で働く、平凡な女性。実家で4人暮らし
  base(); S.aim(CX, -1); lift(-40); S.hemi.intensity = 1.3;
  ANGRY.userData.arms[1].rotation.x = -1.2 - Math.abs(Math.sin(t * 6)) * 0.5; ANGRY.userData.head.rotation.x = Math.sin(t * 6) * 0.08;
  STEAM.forEach((s, i) => { const k = (t * 0.9 + s.userData.o) % 1; s.position.set(CX + 0.1 + i * 0.35, 2.3 + i * 0.2, 0.5); s.scale.setScalar(0.7 + 0.5 * Math.sin(k * Math.PI)); });
  a2.userData.head.rotation.x = 0.15; a2.userData.arms.forEach(a => a.rotation.x = -0.5);
  tCity.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCity.visible = false;
  tHome.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-2.4, -2.0, u), lerp(2.2, 2.0, u), lerp(4.2, 3.6, u), CX - 0.2, 1.5, -0.6, 56);
  return qs;
}
function shotCafe(t) { // 3段目 17〜25：休みの日は、幼なじみといつもの店
  base(); S.aim(FX, -1); lift(-40); S.hemi.intensity = 1.1; S.darken(0.2, '#3a2a20');
  FRIENDS.forEach((p, i) => { p.userData.head.rotation.x = Math.sin(t * 5 + i * 2) * 0.12; p.userData.arms[i % 2].rotation.x = -0.6 - Math.sin(t * 3 + i) * 0.3; });
  tOsa.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOsa.visible = false;
  tUsual.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(FX + lerp(0.4, 0, u), lerp(2.6, 2.4, u), lerp(4.2, 3.6, u), FX, 1.1, -0.8, 56);
  return qs;
}
function shotDesk(t) { // 4段目 25〜33：来世は人間じゃない、と告げられた。同じ人生をもう一度
  base(); S.aim(GX, 0); lift(-40); S.hemi.intensity = 1.5; S.key.intensity = 0.8; S.darken(1, '#f2f2ee'); S.floor.visible = false;
  GUIDE.userData.arms[0].rotation.x = -0.4 - (t > 0.6 && t < 3 ? 0.6 : 0);
  a4.userData.head.rotation.x = t > 1.2 && t < 4 ? -0.25 : 0.15; a4.userData.head.rotation.z = t > 1.2 && t < 4 ? 0.2 : 0; a4.userData.arms.forEach((a, i) => a.rotation.z = (i ? -1 : 1) * (t > 1.2 && t < 4 ? 0.5 : 0.1));
  tNext.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNext.visible = false;
  tRedo.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(GX + lerp(-0.8, -0.5, u), lerp(2.3, 2.2, u), lerp(5.8, 5.0, u), GX - 0.25, 1.75, -0.6, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2023年の日本のドラマ。全10話。小学生から、やり直し
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.2;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  t10.userData.pop((t - 4.2) / 0.35); tKid.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX - 0.3, 2.8, lerp(7.8, 7.0, u), TX - 0.3, 2.7, -1.5, 56);
  return qs;
}
function shotAnt(t, quiz = 0) { // 6段目 42〜49（決め手）：来世はグアテマラのオオアリクイ。人生2周目
  base(); S.aim(AX, -1); lift(-30); S.hemi.intensity = 1.35; S.darken(0.1, '#9ad0a0');
  ANT.position.x = AX - 0.6 + Math.sin(t * 0.8) * 0.15; ANT.children[4].rotation.z = -0.15 + Math.sin(t * 3) * 0.08;
  if (!quiz) { tAnt.userData.pop((t - 0.4) / 0.35); t2nd.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(AX + lerp(0.3, 0.1, u), lerp(4.4, 4.2, u), lerp(9.0, 8.4, u), AX, 0.5, -0.6, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（真っ白な部屋）
  shotWhite(4.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.5, 0.6, d);
  WHITE.material.color.set('#f6f6f2').lerp(new THREE.Color('#9aa0b0'), d);
  S.spot.color.set(0xfff0d8); S.spot.position.set(0, 6, 3); S.spot.target.position.set(0, 1, 0); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(lerp(0.8, 0.4, k), lerp(1.9, 1.7, k), lerp(4.6, 3.8, k), 0, 1.6, 0, 54);
  countdown(t);
  return qs;
}
const _sw = shotWhite; // 1段目に戻るときは白に戻す
function shotWhite0(t) { WHITE.material.color.set('#f6f6f2'); return _sw(t); }

const SHOTS = [
  { a: 0, b: 9, f: shotWhite0 },
  { a: 9, b: 17, f: shotCity },
  { a: 17, b: 25, f: shotCafe },
  { a: 25, b: 33, f: shotDesk },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotAnt(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '33歳の夜、<br>突然の事故。'],
  [5.6, 9.0, '気がつくと、<br>真っ白な部屋にいた。'],
  [9.2, 13.2, '地元の市役所で働く、<br>ごく平凡な女性。'],
  [13.2, 17.0, '実家で、<br>両親と妹と4人暮らし。'],
  [17.2, 21.0, '休みの日は、<br>幼なじみといつもの店。'],
  [21.0, 25.0, 'たわいない話で、<br>笑い合う毎日だった。'],
  [25.2, 29.0, '告げられたのは、<br>来世は人間じゃない。'],
  [29.0, 33.0, '人間に生まれ変わるため、<br>同じ人生をもう一度。'],
  [33.2, 37.4, '2023年の日本のドラマ。<br>全10話。'],
  [37.4, 41.8, '頭は大人のまま、<br>小学生からやり直し。'],
  [42.2, 45.4, '来世は、グアテマラの<br>オオアリクイ。'],
  [45.4, 49.0, '徳を積むための、<br>人生2周目。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ブラッシュアップライフ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q053', v2: true, answer: 'ブラッシュアップライフ',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 5353,
    hits: [5.6, 25.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [2.6, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '33歳': 'さんじゅうさんさい', '突然': 'とつぜん', '事故': 'じこ', '真っ白': 'まっしろ', '部屋': 'へや', '地元': 'じもと', '市役所': 'しやくしょ', '平凡': 'へいぼん', '女性': 'じょせい', '実家': 'じっか', '両親': 'りょうしん', '妹': 'いもうと', '4人暮らし': 'よにんぐらし', '休みの日': 'やすみのひ', '幼なじみ': 'おさななじみ', '店': 'みせ', '毎日': 'まいにち', '告げられた': 'つげられた', '来世': 'らいせ', '人間': 'にんげん', '生まれ変わる': 'うまれかわる', '人生': 'じんせい', '2023年': 'にせんにじゅうさんねん', '日本': 'にほん', '全10話': 'ぜんじゅうわ', '頭': 'あたま', '大人': 'おとな', '小学生': 'しょうがくせい', 'グアテマラ': 'グアテマラ', 'オオアリクイ': 'オオアリクイ', '徳を積む': 'とくをつむ', '2周目': 'にしゅうめ', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n33歳の夜、突然の事故。気がつくと、真っ白な部屋にいた。地元の市役所で働く、ごく平凡な女性。休みの日は、幼なじみといつもの店。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'ネトフリ', 'ドラマ好き', 'コメディ'],
  },
});
applyQuizCards({ answer: 'ブラッシュ<br>アップライフ', info: 'Hulu・Netflix｜日本のドラマ・全10話', answerSize: 116 });
