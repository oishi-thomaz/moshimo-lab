import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #023 ショーシャンクの空に（映画・アメリカ・1994年・143分。U-NEXT・Hulu・Prime Videoで見放題、justwatch.com/jp/映画/shiyoshiyankunokong-ni で2026/11/3確認。
//   Filmarks 4.3・レビュー37万件 filmarks.com/movies/19119）
// 確かめた事実：
//   ・元銀行副頭取のアンディが無実の罪でショーシャンク刑務所に収監される（eiga.com/movie/45573 の解説）。1947年、妻とその愛人を殺した容疑、終身刑（ciatr.jp/topics/222439）
//   ・囚人たちの依頼で外からいろいろな物を手に入れる「調達屋」レッドと交流が始まる。刑務官たちが税金や資産の相談をするようになり、税務処理を任される。
//     図書係になり、州議会への要望を重ねて図書室を整える（ciatr.jp/topics/222439）
// 構成（ヒント6段）：1 高い塀の刑務所に新しい囚人 → 2 元は銀行のエリート、終身刑 → 3 灰色の毎日、日々を数える壁 → 4 調達屋と友情
//   → 5 1947年アメリカ、名作のヒューマンドラマ → 6 決め手：看守の税金の相談を引き受け、図書室のために手紙を書きつづける
// 結末・脱獄に関わることには一切触れない（道具・ポスター・穴・雨の場面・屋上の場面は出さない）。暴力の場面なし。俳優・ポスター・ロゴは使わない

const S = quizStage({ bg: '#6a7480', floor: '#5a5650', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(2323);

const ANDY_SUIT = { skin: '#efcfae', hair: '#3a2a20', shirt: '#3a3e48', pants: '#2e323a', tie: true };
const ANDY = { skin: '#efcfae', hair: '#3a2a20', shirt: '#6a86a8', pants: '#3a4a6a' };
const RED = { skin: '#7a5236', hair: '#2a2420', shirt: '#6a86a8', pants: '#3a4a6a' };
const INM = (i) => ({ skin: ['#e8b98f', '#efcfae', '#8a5a3a', '#d9a57c'][i % 4], hair: ['#1d1a19', '#6a6a6a', '#2c2421', '#4a3426'][i % 4], shirt: '#6a86a8', pants: '#3a4a6a' });
const GUARD = (i) => ({ skin: ['#efcfae', '#e8b98f', '#d9a57c'][i % 3], hair: ['#1d1a19', '#5a5a5a', '#2c2421'][i % 3], shirt: '#4a4a3a', pants: '#3a3a30', tie: true });
const stone = mat('#8a8680'), dark = mat('#2a2a2e');
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = -0.38; return p; }

// ---------- 1. 高い塀と門（x=0）。0秒目がサムネ ----------
{ for (const s of [-1, 1]) { const w = box(14, 7, 1.2, stone); w.position.set(s * 9.2, 3.5, -4); qs.add(w); }
  for (const s of [-1, 1]) { const tw = box(2.2, 10, 2.2, mat('#7a766e')); tw.position.set(s * 2.6, 5, -4); qs.add(tw); const cap = box(2.8, 0.6, 2.8, dark); cap.position.set(s * 2.6, 10.2, -4); qs.add(cap); }
  const top = box(3.2, 1.6, 1.2, stone); top.position.set(0, 7.0, -4); qs.add(top); }
const GATE = []; for (const s of [-1, 1]) { const g = new THREE.Group(); for (let i = 0; i < 8; i++) { const b = box(0.08, 6, 0.08, dark); b.position.set(s * (0.1 + i * 0.19), 3, 0); g.add(b); } for (const y of [0.4, 3, 5.8]) { const h = box(1.6, 0.1, 0.1, dark); h.position.set(s * 0.8, y, 0); g.add(h); } g.position.set(0, 0, -4); qs.add(g); GATE.push(g); }
const SEARCH = new THREE.SpotLight(0xfff4d0, 0, 30, 0.22, 0.6, 1); SEARCH.position.set(2.6, 10.4, -3.4); qs.add(SEARCH); qs.add(SEARCH.target);
const newman = makePerson(ANDY_SUIT); qs.add(newman);
const GUARD1 = [0, 1].map(i => { const p = makePerson(GUARD(i)); qs.add(p); return p; });

// ---------- 2. 囚人服に着がえる（x=30） ----------
{ const g = new THREE.Group(); g.position.set(30, 0, 0); qs.add(g);
  const wl = box(10, 4, 0.2, mat('#9a9890')); wl.position.set(0, 2, -2.2); g.add(wl);
  for (let i = 0; i < 5; i++) { const ln = box(10, 0.03, 0.02, mat('#7a786e')); ln.position.set(0, 0.8 + i * 0.6, -2.08); g.add(ln); } }
const andy2 = makePerson(ANDY); andy2.position.set(30, 0, 0); qs.add(andy2);
const SUITGHOST = makePerson(ANDY_SUIT); SUITGHOST.position.set(30, 0, 0.01); qs.add(SUITGHOST);
const tBank = tag('元 銀行の副頭取', { size: 66, w: 560, bg: '#14161c', sx: 1.6 }); tBank.position.set(30, 2.55, 0); qs.add(tBank);
const tLife = tag('終身刑', { size: 90, w: 360, bg: '#e2483c', sx: 1.1 }); tLife.position.set(30, 2.55, 0); qs.add(tLife);

// ---------- 3. 独房の列（x=60）。壁に日々を数える線 ----------
const CX = 60;
{ const g = new THREE.Group(); g.position.set(CX, 0, 0); qs.add(g);
  const fl = box(10, 0.1, 4, mat('#6a6660')); fl.position.y = 0.05; g.add(fl);
  for (let k = 0; k < 4; k++) { const x = -3 + k * 2.2; const back = box(2.2, 3.2, 0.2, mat('#a09c94')); back.position.set(x, 1.6, -1.8); g.add(back); const side = box(0.15, 3.2, 2.0, stone); side.position.set(x - 1.1, 1.6, -0.8); g.add(side);
    for (let i = 0; i < 9; i++) { const b = box(0.05, 3.0, 0.05, dark); b.position.set(x - 0.9 + i * 0.22, 1.5, 0.15); g.add(b); }
    const bed = box(1.6, 0.3, 0.6, mat('#7a6e5e')); bed.position.set(x + 0.1, 0.45, -1.4); g.add(bed); }
  const side = box(0.15, 3.2, 2.0, stone); side.position.set(5.8, 1.6, -0.8); g.add(side); }
const TALLY = canvasTex(512, 384, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#2a2622'; g.lineWidth = 7; for (let k = 0; k < 7; k++) for (let i = 0; i < 4; i++) { const x = 30 + k * 68 + i * 12, y = 40 + Math.floor(k / 4) * 150; if (k * 5 + i < 34) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 100); g.stroke(); } } for (let k = 0; k < 6; k++) { const x = 22 + k * 68, y = 40 + Math.floor(k / 4) * 150; g.beginPath(); g.moveTo(x, y + 90); g.lineTo(x + 54, y + 10); g.stroke(); } });
const TALLYM = new THREE.MeshBasicMaterial({ map: TALLY, transparent: true, opacity: 0 });
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), TALLYM); m.position.set(CX - 0.8 + 0.1, 1.9, -1.68); qs.add(m); }
const andy3 = makePerson(ANDY); andy3.position.set(CX - 0.8 + 0.4, 0, -0.7); andy3.rotation.y = Math.PI * 0.85; qs.add(andy3);
const tGray = tag('灰色の毎日', { size: 76, w: 440, bg: '#14161c', sx: 0.95 }); tGray.position.set(CX - 0.55, 2.6, 0.6); qs.add(tGray);

// ---------- 4. 中庭（x=90）。調達屋と、ふたりの友情 ----------
const YX = 90;
{ const g = new THREE.Group(); g.position.set(YX, 0, 0); qs.add(g);
  const yard = box(16, 0.06, 10, mat('#8a7a62')); yard.position.set(0, 0.03, -1); g.add(yard);
  const wall = box(18, 6, 0.8, stone); wall.position.set(0, 3, -6); g.add(wall);
  const bench = box(2.0, 0.12, 0.5, mat('#6a5038')); bench.position.set(0, 0.46, 0); g.add(bench);
  for (const x of [-0.8, 0.8]) { const l = box(0.1, 0.46, 0.4, mat('#4a3828')); l.position.set(x, 0.23, 0); g.add(l); } }
const andy4 = sit(makePerson(ANDY)); andy4.position.set(YX - 0.45, -0.36, 0); andy4.rotation.y = 0.25; qs.add(andy4);
const red4 = sit(makePerson(RED)); red4.position.set(YX + 0.45, -0.36, 0); red4.rotation.y = -0.25; qs.add(red4);
const YARDM = [0, 1, 2, 3, 4].map(i => { const p = makePerson(INM(i)); p.position.set(YX - 5 + i * 2.4, 0, -3.2 - (i % 2)); p.rotation.y = R() * 6; qs.add(p); return p; });
const PARCEL = box(0.24, 0.16, 0.18, mat('#b89a6a')); qs.add(PARCEL);
const tDeal = tag('何でも手に入れる 調達屋', { size: 58, w: 700, bg: '#14161c', sx: 1.7 }); tDeal.position.set(YX + 0.4, 2.15, 0); qs.add(tDeal);
const tFriend = tag('友情', { size: 90, w: 260, bg: '#e6b450', color: '#14161c', sx: 0.8 }); tFriend.position.set(YX, 2.05, 0); qs.add(tFriend);

// ---------- 5. 1947年・アメリカ（x=120）：古い車とカレンダー ----------
const AX = 120;
{ const g = new THREE.Group(); g.position.set(AX, 0, 0); qs.add(g);
  const road = box(20, 0.04, 6, mat('#5a5a58')); road.position.set(0, 0.02, 0); g.add(road);
  const field = box(40, 0.02, 30, mat('#8a9a5a')); field.position.set(0, 0.01, -16); g.add(field);
  // 古い形の車（汎用）
  const car = new THREE.Group(); const b = box(3.0, 0.6, 1.4, mat('#2a3a3a')); b.position.y = 0.6; car.add(b); const cab = box(1.5, 0.6, 1.2, mat('#2a3a3a')); cab.position.set(-0.2, 1.2, 0); car.add(cab); const wn = box(1.3, 0.4, 1.24, mat('#b8c8d0')); wn.position.set(-0.2, 1.22, 0); car.add(wn);
  for (const x of [-1.0, 1.0]) for (const z of [-0.72, 0.72]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 16), mat('#1a1a1c')); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.34, z); car.add(wh); }
  car.position.set(-1.6, 0, 0.6); g.add(car); g.userData.car = car;
  for (let i = 0; i < 6; i++) { const pole = box(0.14, 4, 0.14, mat('#5a4a3a')); pole.position.set(-8 + i * 3.4, 2, -2.4); g.add(pole); } }
const CAL_C = document.createElement('canvas'); CAL_C.width = 512; CAL_C.height = 600; const CAL_T = new THREE.CanvasTexture(CAL_C); CAL_T.colorSpace = THREE.SRGBColorSpace;
{ const g = CAL_C.getContext('2d'); g.fillStyle = '#f4efe2'; g.fillRect(0, 0, 512, 600); g.fillStyle = '#a8322a'; g.fillRect(0, 0, 512, 150); g.fillStyle = '#ffffff'; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1947', 256, 82); g.fillStyle = '#4a4a4a'; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.fillRect(40 + c * 64, 200 + r * 76, 40, 40); CAL_T.needsUpdate = true; }
const CAL = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.52), new THREE.MeshBasicMaterial({ map: CAL_T, fog: false })); CAL.position.set(AX, 2.3, 1.2); qs.add(CAL);
const tUSA = tag('アメリカ映画', { size: 72, w: 460, bg: '#e6b450', color: '#14161c', sx: 1.7 }); tUSA.position.set(AX, 4.45, 1.2); qs.add(tUSA);
const tHuman = tag('ヒューマンドラマ', { size: 64, w: 520, bg: '#14161c', sx: 1.9 }); tHuman.position.set(AX, 3.7, 1.25); qs.add(tHuman);

// ---------- 6. 決め手（x=150）：看守たちの税金の相談、図書室への手紙 ----------
const FX = 150;
{ const g = new THREE.Group(); g.position.set(FX, 0, 0); qs.add(g);
  const fl = box(10, 0.1, 6, mat('#6a5a48')); fl.position.y = 0.05; g.add(fl);
  const wl = box(10, 4, 0.2, mat('#a89e8a')); wl.position.set(0, 2, -2.2); g.add(wl);
  const desk = box(1.6, 0.08, 0.8, mat('#6a4e38')); desk.position.set(0, 0.76, 0); g.add(desk);
  for (const [x, z] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) { const l = box(0.06, 0.76, 0.06, mat('#4a3828')); l.position.set(x, 0.38, z); g.add(l); } }
const andy6 = sit(makePerson(ANDY)); andy6.position.set(FX, -0.36, -0.7); qs.add(andy6);
const GUARDS6 = [0, 1, 2].map(i => { const p = makePerson(GUARD(i)); p.position.set(FX - 1.4 + i * 0.0, 0, 0.9 + i * 0.7); p.rotation.y = -Math.PI * 0.75; qs.add(p); return p; });
const FORMS = [0, 1, 2].map(i => { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshLambertMaterial({ color: '#f4f0e4' })); f.rotation.x = -Math.PI / 2; f.position.set(FX - 0.45 + i * 0.32, 0.81 + i * 0.002, 0.05); qs.add(f); return f; });
const SHELF = new THREE.Group(); SHELF.position.set(FX + 2.6, 0, -1.6); qs.add(SHELF);
const BOOKS = [];
{ const sh = box(1.8, 2.4, 0.4, mat('#5a4430')); sh.position.set(0, 1.2, 0); SHELF.add(sh);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const b = box(0.14, 0.42, 0.28, mat(['#a83a3a', '#3a5a8a', '#e6b450', '#3a7a5a', '#7a4a8a'][(i + r) % 5])); b.position.set(-0.68 + i * 0.17, 0.35 + r * 0.55, 0.1); b.visible = false; SHELF.add(b); BOOKS.push(b); } }
const LETTERS = [0, 1, 2, 3, 4].map(i => { const l = box(0.26, 0.02, 0.17, mat('#f4f0e4')); qs.add(l); return l; });
const tTax = tag('看守の税金の相談', { size: 62, w: 560, bg: '#e2483c', sx: 1.6 }); tTax.position.set(FX + 0.4, 2.6, 0.4); qs.add(tTax);
const tLib = tag('図書室を広げたい', { size: 62, w: 560, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tLib.position.set(FX + 1.2, 2.95, -1.2); qs.add(tLib);

// ---------- クイズ：夜の独房と、窓から入る光（x=60 を夜に） ----------
const MOON = new THREE.SpotLight(0xb8c8ff, 0, 10, 0.5, 0.6, 1); MOON.position.set(CX - 0.6, 3.4, 1.8); MOON.target.position.set(CX - 0.6, 0.6, -0.8); qs.add(MOON); qs.add(MOON.target);

// ---------- shots ----------
const ALL = [tBank, tLife, tGray, tDeal, tFriend, tUSA, tHuman, tTax, tLib];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SEARCH.intensity = 0; MOON.intensity = 0; PARCEL.visible = false; LETTERS.forEach(l => l.visible = false); }

function shotGate(t, T) { // 0〜9：高い塀の刑務所。新しい囚人が門をくぐり、門が閉まる（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-80);
  S.darken(0.45, '#3a4250'); S.hemi.intensity = 0.95; S.key.intensity = 0.7;
  SEARCH.intensity = 120; SEARCH.target.position.set(lerp(-1.5, 0.2, ease(T / 5)), 0, lerp(1.5, -1.0, ease(T / 5)));
  const k = clamp(T / 5.2);
  newman.position.set(0, 0, lerp(2.2, -5.6, k)); newman.rotation.y = Math.PI; walk(newman, T * 6, k < 1 ? 1 : 0);
  GUARD1.forEach((p, i) => { p.position.set((i ? 0.7 : -0.7), 0, lerp(2.8, -5.0, k)); p.rotation.y = Math.PI; walk(p, T * 6 + i, k < 1 ? 1 : 0); });
  const close = ease((T - 5.4) / 1.6); GATE[0].position.x = lerp(-1.6, 0, close); GATE[1].position.x = lerp(1.6, 0, close);
  const u = ease(T / 9);
  look(lerp(0.6, 0.3, u), lerp(2.4, 2.8, u), lerp(8.6, 9.6, u), 0, lerp(2.6, 3.0, u), -4, 56);
  return qs;
}
function shotUniform(t) { // 9〜17：元は銀行の副頭取。言い渡されたのは終身刑
  base(); S.aim(30, 0); lift(-60);
  S.hemi.intensity = 1.1;
  const sw = ease((t - 3.6) / 0.8); SUITGHOST.visible = sw < 0.5; andy2.visible = sw >= 0.5;
  tBank.userData.pop((t - 0.6) / 0.35); if (t > 3.6) tBank.visible = false;
  tLife.userData.pop((t - 4.4) / 0.35);
  andy2.userData.head.rotation.x = t > 5 ? 0.25 * ease((t - 5) / 1) : 0;
  const u = ease(t / 8);
  look(30, lerp(1.7, 1.6, u), lerp(4.6, 3.9, u), 30, 1.55, 0, 54);
  return qs;
}
function shotCells(t) { // 17〜25：高い塀に囲まれた灰色の毎日。壁に、日々を数える線
  base(); S.aim(CX, 0); lift(-160);
  S.darken(0.35, '#3a3e48'); S.hemi.intensity = 0.9;
  TALLYM.opacity = clamp((t - 3.6) / 2.4);
  andy3.userData.arms[1].rotation.x = t > 3.6 && t < 6.2 ? -1.6 + Math.sin(t * 6) * 0.1 : -0.1;
  tGray.userData.pop((t - 0.6) / 0.35); if (t > 3.6) tGray.visible = false;
  const u = ease(t / 8);
  look(lerp(CX - 0.3, CX - 0.55, u), lerp(1.75, 1.7, u), lerp(3.9, 3.0, u), CX - 0.65, 1.55, -1.6, 54);
  return qs;
}
function shotYard(t) { // 25〜33：仲良くなったのは、何でも手に入れる調達屋。塀の中で生まれた友情
  base(); S.aim(YX, -1); lift(-60);
  S.hemi.intensity = 1.2;
  YARDM.forEach((p, i) => walk(p, t * 3 + i, 0.4));
  PARCEL.visible = t > 1.6 && t < 4.4; { const k = ease((t - 2.2) / 1.0); PARCEL.position.set(lerp(YX + 0.55, YX - 0.25, k), 0.86, 0.25); }
  red4.userData.arms[0].rotation.x = t > 1.6 && t < 3.4 ? -1.0 : 0; andy4.userData.arms[1].rotation.x = t > 2.6 && t < 4.4 ? -1.0 : 0;
  tDeal.userData.pop((t - 0.6) / 0.35); if (t > 4.2) tDeal.visible = false;
  tFriend.userData.pop((t - 4.6) / 0.35);
  red4.userData.head.rotation.y = t > 4.6 ? -0.4 : 0; andy4.userData.head.rotation.y = t > 4.6 ? 0.4 : 0;
  const u = ease(t / 8);
  look(lerp(YX + 0.3, YX - 0.2, u), lerp(1.5, 1.6, u), lerp(4.4, 3.8, u), YX, 1.15, 0, 54);
  return qs;
}
function shotUSA(t) { // 33〜42：1947年、アメリカ。名作と呼ばれるヒューマンドラマ
  base(); S.aim(AX, 0); lift(-80);
  S.darken(0.2, '#e8c890'); S.hemi.intensity = 1.2;
  CAL.visible = true; CAL.scale.setScalar(Math.max(0.01, easeOut(clamp((t - 0.4) / 0.4))));
  tUSA.userData.pop((t - 1.6) / 0.35);
  tHuman.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(lerp(AX - 0.2, AX + 0.2, u), lerp(2.4, 2.5, u), lerp(7.6, 7.0, u), AX, 2.1, 0, 54);
  return qs;
}
function shotTax(t) { // 42〜49：決め手。看守たちの税金の相談まで引き受け、図書室を広げるために手紙を書きつづける
  base(); S.aim(FX, 0); lift(-60);
  S.hemi.intensity = 1.4; S.key.intensity = 1.7;
  GUARDS6.forEach((p, i) => { p.position.set(FX - 0.55 - i * 0.25, 0, lerp(2.4, 0.75, ease((t - i * 0.3) / 1.2)) + i * 0.45); p.rotation.y = Math.PI * 0.85; walk(p, t * 6 + i, t < 1.2 + i * 0.3 ? 1 : 0); });
  andy6.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 8) * 0.12; andy6.userData.head.rotation.x = 0.3;
  tTax.userData.pop((t - 0.8) / 0.35); if (t > 3.6) tTax.visible = false;
  LETTERS.forEach((l, i) => { const k = clamp((t - 3.8 - i * 0.35) / 0.4); l.visible = k > 0 && k < 1; l.position.set(lerp(FX + 0.3, FX + 2.4, k), 0.85 + Math.sin(k * Math.PI) * 1.0, lerp(0, -1.4, k)); });
  BOOKS.forEach((b, i) => { b.visible = t > 4.2 + (i / BOOKS.length) * 2.4; });
  tLib.userData.pop((t - 4.0) / 0.35);
  const u = ease(t / 7);
  look(lerp(FX + 0.2, FX + 0.35, u), lerp(2.6, 2.5, u), lerp(7.0, 6.6, u), FX + 0.3, 1.4, -0.4, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の独房に、窓からの光）
  base(); S.aim(CX, 0); lift(-60);
  const d = ease(t / 1.0); S.hemi.intensity = lerp(0.9, 0.18, d); S.key.intensity = lerp(1.5, 0, d); S.darken(lerp(0.35, 0.95, d), '#06070c');
  MOON.intensity = lerp(0, 40, ease((t - 0.4) / 1.2));
  TALLYM.opacity = 1;
  andy3.rotation.y = Math.PI * 0.85; andy3.userData.arms[1].rotation.x = -0.1; andy3.userData.head.rotation.x = -0.3;
  const k = ease(t / 7);
  look(lerp(CX + 0.8, CX + 0.2, k), lerp(1.9, 1.8, k), lerp(4.2, 3.4, k), CX - 0.5, 1.6, -1.0, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotGate(t, T) },
  { a: 9, b: 17, f: shotUniform },
  { a: 17, b: 25, f: shotCells },
  { a: 25, b: 33, f: shotYard },
  { a: 33, b: 42, f: shotUSA },
  { a: 42, b: 49, f: shotTax },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '高い塀の向こうへ、<br>新しい囚人がやってきた。'],
  [5.6, 9.0, '罪は、妻殺し。<br>でも彼は、無実だという。'],
  [9.2, 13.2, '元は、銀行の<br>エリートだった男。'],
  [13.2, 17.0, '言い渡されたのは、<br>終身刑。'],
  [17.2, 21.0, '塀に囲まれた、<br>灰色の毎日。'],
  [21.0, 25.0, '壁に刻む線だけが、<br>増えていく。'],
  [25.2, 29.0, '仲良くなったのは、<br>何でも手に入れる調達屋。'],
  [29.0, 33.0, '塀の中で生まれた、<br>男たちの友情。'],
  [33.2, 37.4, '1947年、<br>アメリカの刑務所。'],
  [37.4, 41.8, '名作と呼ばれる、<br>ヒューマンドラマ。'],
  [42.2, 45.6, '看守たちの、<br>税金の相談まで引き受ける。'],
  [45.6, 49.0, '図書室を広げるため、<br>手紙を書きつづける。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ショーシャンクの空に。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q023', v2: true, answer: 'ショーシャンクの空に',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 2323,
    hits: [5.6, 13.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 6.6, 13.6, 29.6, 42.8, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '塀': 'へい', '向こう': 'むこう', '新しい': 'あたらしい', '囚人': 'しゅうじん', '罪': 'つみ', '妻殺し': 'つまごろし', '彼': 'かれ', '無実': 'むじつ', '元': 'もと', '銀行': 'ぎんこう', '男': 'おとこ', '言い渡された': 'いいわたされた', '終身刑': 'しゅうしんけい', '囲まれた': 'かこまれた', '灰色': 'はいいろ', '毎日': 'まいにち', '壁': 'かべ', '刻む': 'きざむ', '線': 'せん', '増えて': 'ふえて', '仲良く': 'なかよく', '手に入れる': 'てにいれる', '調達屋': 'ちょうたつや', '中': 'なか', '生まれた': 'うまれた', '男たち': 'おとこたち', '友情': 'ゆうじょう', '1947年': 'せんきゅうひゃくよんじゅうななねん', '刑務所': 'けいむしょ', '名作': 'めいさく', '呼ばれる': 'よばれる', '看守': 'かんしゅ', '税金': 'ぜいきん', '相談': 'そうだん', '引き受ける': 'ひきうける', '図書室': 'としょしつ', '広げる': 'ひろげる', '手紙': 'てがみ', '書き': 'かき', '空': 'そら', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n高い塀の向こうへ、新しい囚人がやってきた。罪は妻殺し。でも彼は、無実だという。元は銀行のエリートだった男に言い渡されたのは、終身刑。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Hulu', '映画好き', '名作映画'],
  },
});
applyQuizCards({ answer: 'ショーシャンクの空に', info: 'U-NEXT・Hulu｜映画・143分', answerSize: 90 });
