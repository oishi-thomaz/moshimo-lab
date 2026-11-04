import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #058 ウ・ヨンウ弁護士は天才肌（ドラマ・韓国・2022年・ENA・全16話。Netflixで見放題、
//   justwatch.com/jp/テレビ番組/extraordinary-attorney-woo で2026/11/4確認。Filmarks 4.3・レビュー47,355件 filmarks.com/dramas/12357/17050）
// 確かめた事実（Filmarks のエピソード紹介・ja.wikipedia.org/wiki/ウ・ヨンウ弁護士は天才肌。2026/11/4）：
//   ・自閉スペクトラム症のある新人弁護士。ソウル大学ロースクールを首席で卒業。5歳のとき父の法律書を暗唱してみせた
//   ・第1話：初出勤の日、気の合う味方・疑い深い上司・かつての知り合いに出会う。所属は大きな法律事務所
//   ・クジラやイルカが好き。父はキンパ屋を経営。名前は逆から読んでも同じ読み
//   ・ENA、2022年6月29日〜8月18日、全16話。日本版（南田南弁護士は天才肌）が2026年10月から放送
// 構成（ヒント6段）：1 初出勤の新人弁護士、上司は不安顔 → 2 首席で卒業、法律書を丸暗記 → 3 大きな法律事務所、父は小さな店
//   → 4 自閉スペクトラム症、法廷でひらめく → 5 2022年の韓国ドラマ・全16話、日本版リメイクも → 6 決め手：クジラが大好き、名前は逆から読んでも同じ
// クジラ・名前・回文・キンパ・地名・事務所名は6段目まで出さない。障がいの描き方は茶化さない。俳優・ロゴ・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#26324a', floor: '#2e3442', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(5858);

const WOO = { skin: '#f2d6c0', hair: '#1a1614', shirt: '#e8e4dc', pants: '#3a4a6a', long: true, skirt: true };
const BOSS = { skin: '#eccaa8', hair: '#2a2420', shirt: '#2a3044', pants: '#1c1e24', tie: true };
const DAD = { skin: '#e8c8a8', hair: '#4a4a4a', shirt: '#e6b450', pants: '#3a3a3a' };

// ---------- 1段目. 法律事務所のロビー（x=0）。初出勤の新人と、腕を組む上司 ----------
{ const fl = box(14, 0.04, 12, mat('#c8ccd0')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#e8ecf0')); wl.position.set(0, 3, -5); qs.add(wl);
  for (let i = 0; i < 5; i++) { const g = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), new THREE.MeshBasicMaterial({ color: '#a8c8e8' })); g.position.set(-5 + i * 2.5, 3, -4.88); qs.add(g); }
  const desk = box(3, 1.0, 0.8, mat('#3a3e48')); desk.position.set(3.4, 0.5, -3); qs.add(desk);
  for (const x of [-3.6, 3.6]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.6, 12), mat('#8a6a4a')); pl.position.set(x, 0.3, -0.5); qs.add(pl); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat('#3a8a4a')); lf.position.set(x, 1.0, -0.5); qs.add(lf); } }
const w1 = makePerson(WOO); w1.position.set(-0.7, 0, 0.4); w1.rotation.y = 0.5; qs.add(w1);
const BAG1 = box(0.4, 0.3, 0.12, mat('#6a4a3a')); BAG1.position.set(-0.36, 0.85, 0); w1.add(BAG1);
const b1 = makePerson(BOSS); b1.position.set(0.9, 0, -0.4); b1.rotation.y = -0.6; qs.add(b1);
const QM = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.55), new THREE.MeshBasicMaterial({ map: canvasTex(100, 120, (g, w, h) => { g.fillStyle = '#e2483c'; g.font = 'bold 110px sans-serif'; g.textAlign = 'center'; g.fillText('?', w / 2, h - 14); }), transparent: true })); qs.add(QM);
const tFirst = tag('新人弁護士、初出勤', { size: 62, w: 600, bg: '#14161c', sx: 1.75 }); tFirst.position.set(0, 2.42, 0.2); qs.add(tFirst);
const tBoss = tag('上司は、不安顔', { size: 70, w: 480, bg: '#e2483c', sx: 1.35 }); tBoss.position.set(0, 2.42, 0.2); qs.add(tBoss);

// ---------- 2段目. 本に囲まれた机（x=40）。法律書を丸ごと覚えている ----------
const KX = 40;
{ const fl = box(12, 0.04, 10, mat('#4a3a30')); fl.position.set(KX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#5a4a40')); wl.position.set(KX, 3, -4); qs.add(wl);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) { const bk = box(0.22, 0.6 + R() * 0.2, 0.4, mat(['#8a2a2a', '#2a4a6a', '#3a5a3a', '#6a5a2a', '#4a2a4a'][(r + c) % 5])); bk.position.set(KX - 3.2 + c * 0.48, 0.6 + r * 1.0, -3.6); qs.add(bk); }
  const desk = box(2, 0.06, 1, mat('#7a5a3a')); desk.position.set(KX, 0.8, -0.6); qs.add(desk); }
const w2 = makePerson(WOO); w2.position.set(KX, 0, 0.3); qs.add(w2);
const BOOKS = []; for (let i = 0; i < 9; i++) { const bk = new THREE.Group(); const c = ['#8a2a2a', '#2a4a6a', '#3a5a3a', '#6a5a2a'][i % 4]; const l = box(0.3, 0.04, 0.4, mat(c)); l.position.x = -0.15; l.rotation.z = 0.3; bk.add(l); const r = box(0.3, 0.04, 0.4, mat(c)); r.position.x = 0.15; r.rotation.z = -0.3; bk.add(r); const pg = box(0.56, 0.02, 0.36, mat('#f4f2ea')); pg.position.y = 0.04; bk.add(pg); bk.userData.o = i; qs.add(bk); BOOKS.push(bk); }
const tTop = tag('大学は、首席で卒業', { size: 62, w: 600, bg: '#e6b450', color: '#14161c', sx: 1.35 }); tTop.position.set(KX, 2.8, 0.6); qs.add(tTop);
const tMem = tag('法律書を丸ごと暗記', { size: 62, w: 600, bg: '#14161c', sx: 1.35 }); tMem.position.set(KX, 2.8, 0.6); qs.add(tMem);

// ---------- 3段目. 高層ビルの事務所と、街角の小さな店（x=80） ----------
const SX = 80;
{ const fl = box(24, 0.04, 20, mat('#5a5c64')); fl.position.set(SX, 0.02, -6); qs.add(fl);
  for (let i = 0; i < 4; i++) { const h = 20 + i * 4; const wt = windowTextures(5800 + i, '#7a8aa8'); wt.map.repeat.set(3, h / 2); wt.emi.repeat.set(3, h / 2); const b = new THREE.Mesh(new THREE.BoxGeometry(5, h, 5), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.3 })); b.position.set(SX - 6 + i * 4.2, h / 2, -14 - (i % 2) * 2); qs.add(b); } }
const SHOP = new THREE.Group(); SHOP.position.set(SX + 1.6, 0, -1.6); qs.add(SHOP);
{ const b = box(3.0, 2.6, 2.4, mat('#e8dcc0')); b.position.y = 1.3; SHOP.add(b); const aw = box(3.2, 0.12, 0.9, mat('#e2483c')); aw.position.set(0, 2.3, 1.5); aw.rotation.x = 0.25; SHOP.add(aw);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), new THREE.MeshBasicMaterial({ color: '#ffe8b8' })); win.position.set(0, 1.4, 1.21); SHOP.add(win);
  const cnt = box(2.4, 0.9, 0.5, mat('#a8784a')); cnt.position.set(0, 0.45, 1.5); SHOP.add(cnt);
  for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12), mat('#1e2a1e')); r.rotation.z = Math.PI / 2; r.position.set(-0.8 + i * 0.4, 0.95, 1.5); SHOP.add(r); } }
const dad = makePerson(DAD); dad.position.set(SX + 1.6, 0, 0.6); qs.add(dad);
const w3 = makePerson(WOO); w3.position.set(SX - 1.4, 0, 0.6); w3.rotation.y = 0.4; qs.add(w3);
const tFirm = tag('大きな法律事務所', { size: 64, w: 560, bg: '#14161c', sx: 3.4 }); tFirm.position.set(SX - 1.0, 4.0, -1); qs.add(tFirm);
const tShop = tag('父は、小さな店を営む', { size: 60, w: 640, bg: '#e2483c', sx: 2.3 }); tShop.position.set(SX + 0.6, 3.4, 0); qs.add(tShop);

// ---------- 4段目. 法廷（x=120）。ひらめきの瞬間 ----------
const CX = 120;
{ const fl = box(16, 0.04, 12, mat('#7a5a3a')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(16, 6, 0.2, mat('#d8ccb0')); wl.position.set(CX, 3, -6); qs.add(wl);
  const bench = box(5, 1.4, 1.0, mat('#5a3a24')); bench.position.set(CX, 0.7, -4.8); qs.add(bench); const bt = box(5.2, 0.1, 1.1, mat('#4a2a1a')); bt.position.set(CX, 1.45, -4.8); qs.add(bt);
  const emb = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: '#c8a050' })); emb.position.set(CX, 3.6, -5.88); qs.add(emb);
  for (const s of [-1, 1]) { const tb = box(2.0, 0.9, 0.8, mat('#6a4a2a')); tb.position.set(CX + s * 2.4, 0.45, -1.6); qs.add(tb); } }
const JUDGES = []; for (let i = 0; i < 3; i++) { const j = makePerson({ skin: '#eccaa8', hair: ['#2a2420', '#6a6a6a', '#2a2420'][i], shirt: '#141418', pants: '#141418' }); j.position.set(CX - 1.4 + i * 1.4, 0.55, -5.4); qs.add(j); JUDGES.push(j); }
const w4 = makePerson({ ...WOO, shirt: '#2a3044' }); w4.position.set(CX - 2.4, 0, -0.9); qs.add(w4);
const BULB = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffe680' })); qs.add(BULB);
const RAYS = []; for (let i = 0; i < 8; i++) { const r = box(0.04, 0.2, 0.02, new THREE.MeshBasicMaterial({ color: '#ffe680' })); r.userData.a = i / 8 * Math.PI * 2; qs.add(r); RAYS.push(r); }
const tASD = tag('自閉スペクトラム症がある', { size: 56, w: 700, bg: '#3a7ad8', sx: 2.2 }); tASD.position.set(CX - 1.6, 2.9, -0.9); qs.add(tASD);
const tIdea = tag('法廷で、ひらめく', { size: 66, w: 520, bg: '#e6b450', color: '#14161c', sx: 1.9 }); tIdea.position.set(CX - 1.6, 2.9, -0.9); qs.add(tIdea);

// ---------- 5段目. テレビの前（x=160）。2022年の韓国ドラマ・全16話 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1a1e2a' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#8ac8f0'); gr.addColorStop(1, '#2a5a9a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.88)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(40 + (i % 8) * 62, 110 + Math.floor(i / 8) * 70, 20, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const tKR = tag('2022年 韓国ドラマ', { size: 64, w: 600, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tKR.position.set(TX, 4.6, -1.2); qs.add(tKR);
const t16 = tag('全16話', { size: 80, w: 340, bg: '#3a7ad8', sx: 2.0 }); t16.position.set(TX, 4.6, -1.2); qs.add(t16);
const tJPv = tag('日本版リメイクも', { size: 64, w: 540, bg: '#e2483c', sx: 2.6 }); tJPv.position.set(TX, 3.75, -1.0); qs.add(tJPv);

// ---------- 6段目. 事務所の窓の外を泳ぐクジラ（x=200） ----------
const WX = 200;
{ const fl = box(14, 0.04, 10, mat('#c8ccd0')); fl.position.set(WX, 0.02, -1); qs.add(fl);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: canvasTex(256, 144, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6ab8e8'); gr.addColorStop(1, '#1a4a8a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc((i * 47) % w, (i * 31) % h, 3 + (i % 3), 0, Math.PI * 2); g.fill(); } }) })); sea.position.set(WX, 4, -5); qs.add(sea);
  for (let i = 0; i < 6; i++) { const fr = box(0.12, 9, 0.12, mat('#e8ecf0')); fr.position.set(WX - 6.5 + i * 2.6, 4, -4.9); qs.add(fr); } }
const WHALE = new THREE.Group(); qs.add(WHALE);
{ const bm = new THREE.MeshLambertMaterial({ color: '#3a6aa8' }), lm = new THREE.MeshLambertMaterial({ color: '#d8e4ec' });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), bm); body.scale.set(2.4, 0.9, 0.95); WHALE.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), lm); belly.scale.set(2.2, 0.6, 0.85); belly.position.y = -0.32; WHALE.add(belly);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 12), bm); tail.rotation.z = Math.PI / 2; tail.position.x = -2.8; WHALE.add(tail);
  for (const s of [-1, 1]) { const fl = box(1.2, 0.08, 0.5, bm); fl.position.set(-3.5, 0, s * 0.35); fl.rotation.y = s * 0.5; WHALE.add(fl); const fin = box(0.8, 0.06, 0.3, bm); fin.position.set(0.6, -0.5, s * 0.9); fin.rotation.set(s * 0.5, 0, -0.4); WHALE.add(fin); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#141414' })); ey.position.set(1.6, -0.1, s * 0.62); WHALE.add(ey); } }
WHALE.position.set(WX, 4.4, -3.6);
const BUBS = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08 + R() * 0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.7 })); b.userData.o = R(); qs.add(b); BUBS.push(b); }
const w6 = makePerson(WOO); w6.position.set(WX, 0, 2.6); qs.add(w6);
const tWhale = tag('クジラが大好き', { size: 70, w: 480, bg: '#3a7ad8', sx: 3.0 }); tWhale.position.set(WX, 8.2, -3); qs.add(tWhale);
const tName = tag('名前は、逆から読んでも同じ', { size: 56, w: 800, bg: '#e2483c', sx: 4.6 }); tName.position.set(WX, 7.3, -2.8); qs.add(tName);

// ---------- shots ----------
const ALL = [tFirst, tBoss, tTop, tMem, tFirm, tShop, tASD, tIdea, tKR, t16, tJPv, tWhale, tName];
function base() { S.reset(); ALL.forEach(x => x.visible = false); QM.visible = false; BULB.visible = false; RAYS.forEach(r => r.visible = false); BOOKS.forEach(b => b.visible = false); BUBS.forEach(b => b.visible = false); }

function shotLobby(t) { // 1段目 0〜9：初出勤の新人弁護士。上司は不安顔（0秒目がサムネ）
  base(); S.aim(0, -1); lift(-40); S.hemi.intensity = 1.25;
  w1.userData.head.rotation.y = Math.sin(t * 1.6) * 0.25; w1.userData.arms[1].rotation.x = -0.2;
  b1.userData.arms.forEach((a, i) => { a.rotation.x = -0.15; }); b1.userData.head.rotation.x = 0.1; b1.userData.head.rotation.z = t > 4.8 ? 0.15 : 0;
  QM.visible = t > 5.0; QM.position.set(1.25, 2.15 + Math.sin(t * 3) * 0.04, -0.2); QM.scale.setScalar(ease((t - 5.0) / 0.3));
  tFirst.userData.pop(1); if (t > 4.6) tFirst.visible = false;
  tBoss.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(2.0, 1.85, u), lerp(5.0, 4.0, u), 0.1, 1.45, -0.1, 54);
  return qs;
}
function shotBooks(t) { // 2段目 9〜17：大学は首席で卒業。法律書を丸ごと暗記
  base(); S.aim(KX, -1); lift(-40); S.hemi.intensity = 1.0; S.darken(0.3, '#1a1410');
  BOOKS.forEach((b, i) => { b.visible = true; const a = t * 0.9 + i / 9 * Math.PI * 2; const r = 0.9 + 0.1 * Math.sin(t * 2 + i); b.position.set(KX + Math.cos(a) * r * 1.2, 2.45 + Math.sin(a * 2) * 0.15, 0.3 + Math.sin(a) * r * 0.6); b.rotation.set(0, -a, Math.sin(t * 3 + i) * 0.2); });
  w2.userData.head.rotation.y = Math.sin(t * 0.9) * 0.4;
  tTop.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTop.visible = false;
  tMem.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(0.3, 0, u), lerp(2.2, 2.1, u), lerp(5.0, 4.4, u), KX, 1.75, 0.2, 56);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：大きな法律事務所。父は小さな店を営む
  base(); S.aim(SX, -2); lift(-30); S.hemi.intensity = 1.2;
  dad.userData.arms[1].rotation.x = -0.4 - Math.abs(Math.sin(t * 2)) * 0.6; w3.userData.head.rotation.y = -0.4;
  tFirm.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFirm.visible = false;
  tShop.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4) look(SX - 1, lerp(1.8, 2.6, u * 2), 7.6, SX - 1.5, lerp(3.5, 8, u * 2), -12, 60);
  else look(SX + 0.2, 2.2, lerp(6.6, 5.8, u), SX + 0.2, 1.6, -0.6, 58);
  return qs;
}
function shotCourt(t) { // 4段目 25〜33：自閉スペクトラム症がある。法廷で、ひらめく
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 1.1;
  const on = t > 4.4; BULB.visible = on; BULB.position.set(CX - 2.4, 2.35, -0.9); BULB.scale.setScalar(on ? 1 + Math.sin(t * 6) * 0.12 : 0.01);
  RAYS.forEach(r => { r.visible = on; const a = r.userData.a; r.position.set(CX - 2.4 + Math.cos(a) * 0.38, 2.35 + Math.sin(a) * 0.38, -0.9); r.rotation.z = a - Math.PI / 2; });
  w4.userData.head.rotation.x = on ? -0.2 : 0.2; w4.userData.head.rotation.y = on ? 0 : -0.5;
  tASD.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tASD.visible = false;
  tIdea.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.4, -0.8, u), lerp(2.2, 2.1, u), lerp(4.6, 3.8, u), CX - 1.6, 1.6, -2.4, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2022年の韓国ドラマ。全16話。日本版リメイクも
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  tKR.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKR.visible = false;
  t16.userData.pop((t - 4.2) / 0.35); tJPv.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX, 2.8, lerp(7.8, 7.0, u), TX, 2.7, -1.5, 56);
  return qs;
}
function shotWhale(t, quiz = 0) { // 6段目 42〜49（決め手）：クジラが大好き。名前は逆から読んでも同じ
  base(); S.aim(WX, -1); lift(-30); S.hemi.intensity = 1.35;
  WHALE.position.set(WX + Math.sin(t * 0.5) * 1.2, 5.5 + Math.sin(t * 1.1) * 0.25, -3.6); WHALE.rotation.z = Math.sin(t * 1.1) * 0.08; WHALE.children[2].rotation.y = Math.sin(t * 3) * 0.2;
  BUBS.forEach((b, i) => { b.visible = true; const k = (t * 0.3 + b.userData.o) % 1; b.position.set(WHALE.position.x + 2.0 + Math.sin(i) * 0.3, WHALE.position.y + 0.6 + k * 2.2, -3.4); });
  w6.userData.head.rotation.x = -0.35; w6.userData.arms[0].rotation.x = -2.2 + Math.sin(t * 2) * 0.1; w6.rotation.y = Math.PI * 0.05;
  if (!quiz) { tWhale.userData.pop((t - 0.4) / 0.35); tName.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(WX + lerp(0.6, 0.3, u), lerp(1.6, 1.5, u), lerp(7.6, 6.8, u), WX, 4.4, -1.5, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（クジラを見上げる）
  shotWhale(t + 7, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.35, 0.35, d);
  S.spot.color.set(0xe8f4ff); S.spot.position.set(WX, 6, 4); S.spot.target.position.set(WX, 1, 2.6); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(WX + lerp(1.0, 0.6, k), lerp(1.2, 1.1, k), lerp(7.6, 7.0, k), WX, 5.6, -1.5, 60);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotLobby },
  { a: 9, b: 17, f: shotBooks },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotCourt },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotWhale(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '初出勤の日。<br>新人弁護士がやってきた。'],
  [5.6, 9.0, '上司は、思わず<br>顔をくもらせた。'],
  [9.2, 13.2, '大学は、首席で卒業。<br>天才的な記憶力。'],
  [13.2, 17.0, '5歳で、父の法律書を<br>暗唱してみせた。'],
  [17.2, 21.0, '働くのは、<br>大きな法律事務所。'],
  [21.0, 25.0, '父は、<br>小さな店を営んでいる。'],
  [25.2, 29.0, '彼女には、<br>自閉スペクトラム症がある。'],
  [29.0, 33.0, '法廷では、誰も<br>思いつかない一手を。'],
  [33.2, 37.4, '2022年の韓国ドラマ。<br>全16話。'],
  [37.4, 41.8, '日本版のリメイクも、<br>作られた。'],
  [42.2, 45.4, 'クジラが、<br>大好き。'],
  [45.4, 49.0, '名前は、逆から<br>読んでも同じ。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ウ・ヨンウ弁護士は天才肌。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q058', v2: true, answer: 'ウ・ヨンウ弁護士は天才肌',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 5858,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.4, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '初出勤': 'はつしゅっきん', '日': 'ひ', '新人弁護士': 'しんじんべんごし', '上司': 'じょうし', '思わず': 'おもわず', '顔': 'かお', '大学': 'だいがく', '首席': 'しゅせき', '卒業': 'そつぎょう', '天才的': 'てんさいてき', '記憶力': 'きおくりょく', '5歳': 'ごさい', '父': 'ちち', '法律書': 'ほうりつしょ', '暗唱': 'あんしょう', '働く': 'はたらく', '法律事務所': 'ほうりつじむしょ', '小さな店': 'ちいさなみせ', '営んでいる': 'いとなんでいる', '彼女': 'かのじょ', '自閉スペクトラム症': 'じへいスペクトラムしょう', '法廷': 'ほうてい', '誰も': 'だれも', '思いつかない': 'おもいつかない', '一手': 'いって', '2022年': 'にせんにじゅうにねん', '韓国': 'かんこく', '全16話': 'ぜんじゅうろくわ', '日本版': 'にほんばん', '作られた': 'つくられた', '大好き': 'だいすき', '名前': 'なまえ', '逆から': 'ぎゃくから', '読んでも同じ': 'よんでもおなじ', 'ウ・ヨンウ弁護士は天才肌': 'ウ・ヨンウべんごしはてんさいはだ', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n初出勤の日。新人弁護士がやってきた。上司は、思わず顔をくもらせた。大学は、首席で卒業。天才的な記憶力。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', 'ヒューマンドラマ'],
  },
});
applyQuizCards({ answer: 'ウ・ヨンウ<br>弁護士は天才肌', info: 'Netflix｜韓国ドラマ・全16話', answerSize: 112 });
