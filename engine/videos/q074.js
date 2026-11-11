import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #074 劇場版「鬼滅の刃」無限列車編（アニメ映画・日本・2020年・117分。U-NEXT・Hulu で見放題（Netflix・Disney+・FOD も）、
//   JustWatch 日本版 justwatch.com/jp/映画/ju-chang-ban-gui-mie-noren-wu-xian-lie-che-bian で2026/11/11確認（Filmarks の動画配信欄も U-NEXT・Hulu ほか見放題）。
//   Filmarks 4.0・レビュー179,279件 filmarks.com/movies/86962）
// 確かめた事実（Filmarks・JustWatch の作品紹介、ja.wikipedia.org/wiki/劇場版_鬼滅の刃_無限列車編。2026/11/11）：
//   ・修業を終えた主人公たちは、次の任務の地《無限列車》へ。短期間のうちに四十人以上が行方不明になっている（Filmarks・JustWatch）
//   ・主人公と仲間2人の剣士の一行は、鬼殺隊最強の剣士《柱》のひとり、炎柱と合流し、列車の中で鬼に立ち向かう（Filmarks・JustWatch）
//   ・剣士たちは鬼の術で眠らされ、夢の中に閉じ込められる。それぞれ幸せな夢を見る（Wikipedia）
//   ・2020年10月16日公開。日本の興行収入404.3億円（Wikipedia）。原作は吾峠呼世晴の漫画（Wikipedia）
// 構成（ヒント6段）：1 夜を走る汽車、40人以上が行方不明 → 2 乗り込んだのは修業を終えた刀を持つ3人の少年剣士
//   → 3 車内で眠らされ、それぞれの幸せな夢へ → 4 合流したのは最強の剣士のひとり、炎のような剣
//   → 5 2020年公開の日本のアニメ映画、興行収入400億円超え → 6 決め手：夢の列車で鬼に立ち向かう・タイトルには列車の名前
// 結末（戦いの決着・登場人物の生死）は言わない。人物名は出さない。アニメの絵・キャラクターの髪色や羽織の柄・刀の鍔・ロゴ・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#141a2a', floor: '#2a2a30', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(7474);

const BOY = (i) => ({ skin: ['#f1c9a5', '#f4d3b5', '#e8b98f'][i % 3], hair: ['#4a2420', '#1d1a19', '#2c2421'][i % 3], shirt: '#1e2230', pants: '#1e2230', scale: 0.92 });
const HASHIRA = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#1e2230', pants: '#1e2230' };
const PAX = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#d9a57c'][i % 3], hair: ['#1d1a19', '#5a5a5a', '#2c2421'][i % 3], shirt: ['#6a5a4a', '#4a5a6a', '#7a4a4a', '#5a6a4a'][i % 4], pants: '#3a3430', long: i % 3 === 1, skirt: i % 3 === 1 });

function sword(color = '#c8ccd4') { const g = new THREE.Group(); const bl = box(0.04, 0.95, 0.02, new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.25 })); bl.position.y = 0.5; g.add(bl); const hd = box(0.05, 0.25, 0.05, mat('#2a2018')); hd.position.y = -0.1; g.add(hd); return g; }
function sheath() { const s = box(0.06, 0.95, 0.06, mat('#14161c')); return s; }
// 汽車（汎用の蒸気機関車と客車）
function locomotive() {
  const g = new THREE.Group(); const k = mat('#1a1a1e'), r = mat('#7a1a1a');
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 4.2, 20), k); boiler.rotation.z = Math.PI / 2; boiler.position.set(0.6, 1.9, 0); g.add(boiler);
  const cab = box(1.8, 2.4, 2.0, k); cab.position.set(-2.2, 2.2, 0); g.add(cab); const rf = box(2.0, 0.15, 2.2, k); rf.position.set(-2.2, 3.45, 0); g.add(rf);
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 1.0, 14), k); chim.position.set(2.0, 3.1, 0); g.add(chim);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), k); dome.position.set(0.6, 2.8, 0); g.add(dome);
  const base = box(5.8, 0.4, 1.8, r); base.position.set(-0.2, 0.9, 0); g.add(base);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.15, 18), r); w.rotation.x = Math.PI / 2; w.position.set(1.4 - i * 1.3, 0.6, s * 0.95); g.add(w); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); lamp.position.set(2.75, 2.1, 0); g.add(lamp);
  return g;
}
function coach() { const g = new THREE.Group(); const b = box(7, 2.6, 2.2, mat('#3a2a24')); b.position.y = 2.0; g.add(b); const rf = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 7, 16, 1, false, 0, Math.PI), mat('#24262b')); rf.rotation.z = Math.PI / 2; rf.position.y = 3.3; rf.scale.z = 1; g.add(rf);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const w = box(0.7, 0.6, 0.04, new THREE.MeshBasicMaterial({ color: '#ffd890' })); w.position.set(-2.8 + i * 1.12, 2.4, s * 1.12); g.add(w); }
  for (let i = 0; i < 2; i++) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16), mat('#1a1a1e')); w.rotation.x = Math.PI / 2; w.position.set(-2.4 + i * 4.8, 0.5, s * 0.95); g.add(w); }
  return g; }
const SMOKES = [];
function addSmoke(n) { for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshStandardMaterial({ color: '#c8c8d0', transparent: true, opacity: 0.6, depthWrite: false })); s.userData.o = i / n; qs.add(s); SMOKES.push(s); } }
addSmoke(10);
function smoke(t, x, y, z, dir = -1) { SMOKES.forEach(s => { const k = (t * 0.45 + s.userData.o) % 1; s.visible = true; s.position.set(x + dir * k * 4, y + k * 2.2, z + Math.sin(k * 6 + s.userData.o * 9) * 0.3); s.scale.setScalar(0.5 + k * 1.6); s.material.opacity = 0.65 * (1 - k); }); }

// ---------- 1段目. 夜の駅（x=0）。ホームに止まる汽車。「行方不明」の張り紙 ----------
{ const pf = box(16, 0.8, 4, mat('#5a5650')); pf.position.set(0, 0.4, -3.0); qs.add(pf);
  for (const z of [-1.0, 1.0]) { const rl = box(30, 0.08, 0.1, mat('#8a8a90')); rl.position.set(0, 0.1, z * 0.75 - 0.0); qs.add(rl); }
  for (let i = 0; i < 14; i++) { const sl = box(0.25, 0.06, 2.2, mat('#3a2a20')); sl.position.set(-14 + i * 2.2, 0.05, 0); qs.add(sl); }
  for (let i = 0; i < 4; i++) { const p = box(0.15, 3.2, 0.15, mat('#2a2018')); p.position.set(-6 + i * 4, 2.4, -4.4); qs.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); l.position.set(p.position.x, 4.0, -4.4); qs.add(l); }
  const roof = box(16, 0.15, 3.0, mat('#2a2420')); roof.position.set(0, 4.2, -3.6); qs.add(roof);
  for (let i = 0; i < 40; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: '#f4f0e0' })); st.position.set(-20 + R() * 40, 6 + R() * 12, -20 - R() * 10); qs.add(st); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 14), new THREE.MeshBasicMaterial({ color: '#f4ecc8' })); moon.position.set(-8, 12, -28); qs.add(moon); }
const LOCO1 = locomotive(); LOCO1.position.set(3.0, 0, 0); qs.add(LOCO1);
const C1 = coach(); C1.position.set(-4.3, 0, 0); qs.add(C1); const C1b = coach(); C1b.position.set(-11.6, 0, 0); qs.add(C1b);
const POSTER = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(160, 200, (g, w, h) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a1a1a'; g.fillRect(10, 10, w - 20, 40); g.fillStyle = '#3a3028'; for (let i = 0; i < 6; i++) g.fillRect(16, 66 + i * 20, w - 32 - (i % 2) * 30, 8); }) })); POSTER.position.set(-2.0, 2.2, -4.3); POSTER.rotation.y = 0; qs.add(POSTER);
const tNight = tag('夜を走る汽車', { size: 66, w: 480, bg: '#14161c', sx: 3.6 }); tNight.position.set(0.3, 3.7, 2.0); qs.add(tNight);
const tGone = tag('40人以上が、行方不明', { size: 56, w: 680, bg: '#a82a2a', sx: 3.4 }); tGone.position.set(0.3, 3.7, 2.0); qs.add(tGone);

// ---------- 2段目. ホームを歩く3人の少年剣士（x=40） ----------
const AX = 40;
{ const pf = box(16, 0.8, 5, mat('#5a5650')); pf.position.set(AX, 0.4, 0); qs.add(pf);
  for (let i = 0; i < 4; i++) { const p = box(0.15, 3.2, 0.15, mat('#2a2018')); p.position.set(AX - 6 + i * 4, 2.4, -1.8); qs.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); l.position.set(p.position.x, 4.0, -1.8); qs.add(l); } }
const C2 = coach(); C2.position.set(AX, 0, -3.8); qs.add(C2);
const BOYS = [], SHEATHS = []; for (let i = 0; i < 3; i++) { const p = makePerson(BOY(i)); qs.add(p); BOYS.push(p); const s = sheath(); qs.add(s); SHEATHS.push(s); }
const tSwords = tag('刀を持つ少年たち', { size: 62, w: 560, bg: '#14161c', sx: 1.9 }); tSwords.position.set(AX, 3.2, 0); qs.add(tSwords);
const tTrain = tag('修業を終えた3人', { size: 62, w: 540, bg: '#2f6f8a', sx: 1.6 }); tTrain.position.set(AX, 3.2, 0); qs.add(tTrain);

// ---------- 3段目. 客車の中（x=80）。眠る剣士たち。頭の上にそれぞれの幸せな夢 ----------
const BX = 80;
{ const fl = box(3.2, 0.04, 14, mat('#5a3a2a')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.1, 3, 14, mat('#6a4a34')); wl.position.set(BX + s * 1.6, 1.5, -3); qs.add(wl);
    for (let i = 0; i < 5; i++) { const w = box(0.04, 0.8, 1.2, new THREE.MeshBasicMaterial({ color: '#1a2040' })); w.position.set(BX + s * 1.54, 1.7, -0.5 - i * 2.4); qs.add(w); } }
  const ceil = box(3.2, 0.1, 14, mat('#3a2a20')); ceil.position.set(BX, 3.0, -3); qs.add(ceil);
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); l.position.set(BX, 2.85, -0.5 - i * 2.4); qs.add(l); }
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const st = box(0.9, 0.5, 0.6, mat('#2a4a3a')); st.position.set(BX + s * 0.95, 0.25, -0.5 - i * 2.4); qs.add(st); const bk = box(0.9, 0.9, 0.12, mat('#2a4a3a')); bk.position.set(BX + s * 0.95, 0.75, -0.8 - i * 2.4); qs.add(bk); } }
const SLEEP = []; for (let i = 0; i < 6; i++) { const p = makePerson(i < 3 ? BOY(i) : PAX(i)); const s = i % 2 ? 1 : -1; p.position.set(BX + s * 0.95, 0.2, -2.9 - Math.floor(i / 2) * 2.4); p.rotation.y = 0; p.userData.legs.forEach(l => l.rotation.x = -1.4); p.position.y = 0.55; qs.add(p); SLEEP.push(p); }
const ZS = []; for (let i = 0; i < 6; i++) { const z = tag('Z', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#c8d8ff', sx: 0.35 }); qs.add(z); ZS.push(z); }
const DREAMS = []; for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, ['#fff4c0', '#ffd0e0', '#d0f0c0'][i]); gr.addColorStop(1, ['#f4a860', '#e86a9a', '#5ab070'][i]); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, opacity: 0.85 })); qs.add(d); DREAMS.push(d); }
const tSleep = tag('眠らされる剣士', { size: 62, w: 520, bg: '#14161c', sx: 1.4 }); tSleep.position.set(BX, 2.45, -3.8); qs.add(tSleep);
const tDream = tag('幸せな夢の中へ', { size: 62, w: 520, bg: '#8e6bbf', sx: 1.4 }); tDream.position.set(BX, 2.45, -3.8); qs.add(tDream);

// ---------- 4段目. 客車の通路（x=120）。最強の剣士が立つ。刀に炎 ----------
const CX = 120;
{ const fl = box(3.2, 0.04, 14, mat('#5a3a2a')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.1, 3, 14, mat('#6a4a34')); wl.position.set(CX + s * 1.6, 1.5, -3); qs.add(wl); }
  const ceil = box(3.2, 0.1, 14, mat('#3a2a20')); ceil.position.set(CX, 3.0, -3); qs.add(ceil);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const st = box(0.9, 0.5, 0.6, mat('#2a4a3a')); st.position.set(CX + s * 0.95, 0.25, -0.5 - i * 2.4); qs.add(st); } }
const hashira = makePerson(HASHIRA); hashira.position.set(CX, 0, -3.0); qs.add(hashira);
const CLOAK = box(0.62, 1.1, 0.06, mat('#e9e4da')); qs.add(CLOAK);
const SW4 = sword(); qs.add(SW4);
const FLAMES = []; for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 8), new THREE.MeshBasicMaterial({ color: ['#ff7a2a', '#ffb83a', '#ff4a1a'][i % 3], transparent: true, opacity: 0.9 })); f.userData.o = i / 18; qs.add(f); FLAMES.push(f); }
const tStrong = tag('最強の剣士のひとり', { size: 58, w: 600, bg: '#14161c', sx: 1.6 }); tStrong.position.set(CX, 2.6, -2.4); qs.add(tStrong);
const tFire = tag('炎のような剣', { size: 66, w: 460, bg: '#d8582a', sx: 1.3 }); tFire.position.set(CX, 2.6, -2.4); qs.add(tFire);

// ---------- 5段目. 映画館のスクリーン（x=180）。2020年の日本のアニメ映画、興行収入400億円超え ----------
const TX = 180;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: '#1a1420' })); bg.position.set(TX, 4, -4); qs.add(bg);
  for (const s of [-1, 1]) { const cu = box(1.2, 5, 0.2, mat('#7a2a3a')); cu.position.set(TX + s * 3.4, 2.9, -3.7); qs.add(cu); }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const st = box(0.6, 0.7, 0.6, mat('#6a2a3a')); st.position.set(TX - 2.7 + i * 0.9, 0.35, 0.6 + r * 1.1); qs.add(st); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(560, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2040'); gr.addColorStop(1, '#4a2a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f4ecc8'; g.beginPath(); g.arc(440, 70, 34, 0, Math.PI * 2); g.fill(); g.fillStyle = '#0c0c10'; g.fillRect(0, 250, w, 70); g.fillRect(120, 190, 220, 60); g.fillRect(300, 150, 40, 50); }) })); SCREEN.position.set(TX, 2.9, -3.6); qs.add(SCREEN);
const COINS = []; for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 18), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.7, roughness: 0.3 })); c.rotation.x = Math.PI / 2; qs.add(c); COINS.push(c); }
const t2020 = tag('2020年 日本のアニメ映画', { size: 54, w: 720, bg: '#e6b450', color: '#14161c', sx: 3.4 }); t2020.position.set(TX, 5.0, -2.8); qs.add(t2020);
const t400 = tag('興行収入 400億円超え', { size: 58, w: 700, bg: '#a82a2a', sx: 3.3 }); t400.position.set(TX, 5.0, -2.8); qs.add(t400);

// ---------- 6段目. 夜の野原を走る汽車（x=220）。屋根の上に剣士、前に角のある影 ----------
const DX = 220;
{ const gr = box(60, 0.04, 30, mat('#1a2a1e')); gr.position.set(DX, 0.02, -6); qs.add(gr);
  for (let i = 0; i < 30; i++) { const sl = box(0.25, 0.06, 2.2, mat('#3a2a20')); sl.position.set(DX - 30 + i * 2.0, 0.05, -4); qs.add(sl); }
  for (const z of [-4.75, -3.25]) { const rl = box(60, 0.08, 0.1, mat('#8a8a90')); rl.position.set(DX, 0.1, z); qs.add(rl); }
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(6 + i % 3 * 2, 6 + (i % 2) * 3, 6), mat('#121a18')); m.position.set(DX - 30 + i * 5.5, 2.5, -22); qs.add(m); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), new THREE.MeshBasicMaterial({ color: '#f4ecc8' })); moon.position.set(DX + 4, 12, -26); qs.add(moon); }
const TRAIN6 = new THREE.Group(); { const l = locomotive(); TRAIN6.add(l); const c = coach(); c.position.x = -7.3; TRAIN6.add(c); const c2 = coach(); c2.position.x = -14.6; TRAIN6.add(c2); } TRAIN6.position.set(DX, 0, -4); qs.add(TRAIN6);
const hero6 = makePerson(BOY(0)); qs.add(hero6);
const SW6 = sword('#a8c8e8'); qs.add(SW6);
const ONI = new THREE.Group(); { const m = new THREE.MeshBasicMaterial({ color: '#0a0608' }); const bd = box(0.9, 1.4, 0.5, m); bd.position.y = 1.3; ONI.add(bd); const hd = box(0.6, 0.6, 0.5, m); hd.position.y = 2.3; ONI.add(hd); for (const s of [-1, 1]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 8), new THREE.MeshBasicMaterial({ color: '#e8dcc0' })); hn.position.set(s * 0.18, 2.75, 0); hn.rotation.z = -s * 0.3; ONI.add(hn); const ey = box(0.1, 0.06, 0.02, new THREE.MeshBasicMaterial({ color: '#ff3a3a' })); ey.position.set(s * 0.13, 2.35, 0.26); ONI.add(ey); } for (const s of [-1, 1]) { const lg = box(0.25, 0.7, 0.25, m); lg.position.set(s * 0.22, 0.35, 0); ONI.add(lg); const ar = box(0.2, 1.1, 0.2, m); ar.position.set(s * 0.6, 1.4, 0); ar.rotation.z = s * 0.3; ONI.add(ar); } } qs.add(ONI);
const SLASH = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 30, Math.PI * 0.9), new THREE.MeshBasicMaterial({ color: '#bfe0ff', transparent: true, opacity: 0.9 })); qs.add(SLASH);
const tOni = tag('夢の列車で、鬼に挑む', { size: 56, w: 680, bg: '#14161c', sx: 1.7 }); tOni.position.set(DX + 0.6, 6.0, -3.0); qs.add(tOni);
const tName = tag('タイトルに、列車の名前', { size: 54, w: 700, bg: '#a82a2a', sx: 1.75 }); tName.position.set(DX + 0.6, 6.0, -3.0); qs.add(tName);

// ---------- shots ----------
const ALL = [tNight, tGone, tSwords, tTrain, tSleep, tDream, tStrong, tFire, t2020, t400, tOni, tName];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SMOKES.forEach(s => s.visible = false); ZS.forEach(z => z.visible = false); DREAMS.forEach(d => d.visible = false); FLAMES.forEach(f => f.visible = false); COINS.forEach(c => c.visible = false); SLASH.visible = false; }

function shotStation(t, quiz = 0) { // 1段目 0〜9：夜を走る一台の汽車。短い間に40人以上が行方不明（0秒目がサムネ）
  base(); S.aim(0, 0); lift(0); S.hemi.intensity = 1.5; S.key.intensity = 1.1; S.darken(0.05, '#0a0e18');
  S.spot.color.set(0xffe0a0); S.spot.position.set(5.8, 2.1, 0); S.spot.target.position.set(12, 0, 0); S.spot.intensity = 30;
  smoke(t, 5.0, 3.6, 0, -1);
  if (!quiz) { tNight.userData.pop((t - 2.3) / 0.35); if (t > 4.4) tNight.visible = false; tGone.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(7.4, 6.6, u), lerp(2.6, 2.4, u), lerp(10.4, 9.4, u), lerp(0.4, 0.0, u), 1.6, 0, 58);
  return qs;
}
function shotBoard(t) { // 2段目 9〜17：調べに乗り込んだのは、刀を持つ少年たち。修業を終えたばかりの3人の剣士
  base(); S.aim(AX, -1); lift(0); S.hemi.intensity = 0.85; S.darken(0.2, '#0a0e18');
  BOYS.forEach((p, i) => { p.position.set(AX - 1.6 + i * 1.1 + t * 0.25, 0.8, 0.4 - (i % 2) * 0.4); p.rotation.y = Math.PI / 2 - 0.25; poseWalk(p, t * 6 + i, 0.7); p.position.y += 0.8;
    const sh = SHEATHS[i]; sh.position.set(p.position.x - 0.18, 0.8 + 0.85, p.position.z + 0.2); sh.rotation.z = 1.0; sh.rotation.y = Math.PI / 2 - 0.25; });
  tSwords.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSwords.visible = false; tTrain.userData.pop((t - 4.2) / 0.35);
  tSwords.position.x = AX + t * 0.25; tTrain.position.x = AX + t * 0.25;
  const u = ease(t / 8);
  look(AX + lerp(0.4, 1.6, u), 2.6, 4.6, AX + lerp(-0.2, 1.0, u), 1.9, -0.4, 58);
  return qs;
}
function shotSleep(t) { // 3段目 17〜25：車内で、剣士たちは眠らされてしまう。見るのは、それぞれの幸せな夢
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.6; S.darken(0.4, '#0a0e18');
  const nod = ease(clamp((t - 0.4) / 1.2));
  SLEEP.forEach((p, i) => { p.userData.head.rotation.x = 0.5 * nod; p.userData.head.rotation.z = (i % 2 ? 0.3 : -0.3) * nod; p.rotation.y = (i % 2 ? -1 : 1) * 0.0; });
  ZS.forEach((z, i) => { const p = SLEEP[i]; const k = ((t * 0.5 + i * 0.17) % 1); z.visible = nod > 0.5 && t < 4.2; z.position.set(p.position.x + 0.2 + k * 0.3, 1.9 + k * 0.6, p.position.z); z.material.opacity = 1 - k; });
  if (t > 4.2) DREAMS.forEach((d, i) => { const p = SLEEP[i]; d.visible = true; const s = ease(clamp((t - 4.4 - i * 0.2) / 0.5)); d.scale.setScalar(Math.max(1e-4, s)); d.position.set(p.position.x, 2.05 + Math.sin(t * 2 + i) * 0.05, p.position.z); d.rotation.y = t; });
  tSleep.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSleep.visible = false; tDream.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + 0.2, lerp(2.4, 2.3, u), lerp(1.2, 0.6, u), BX, 1.1, -6.0, 60);
  return qs;
}
function shotHashira(t) { // 4段目 25〜33：合流したのは、組織で最強の剣士のひとり。その剣は、炎のように熱い
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.6; S.darken(0.4, '#0a0e18');
  CLOAK.position.set(CX, 1.05, -3.17); CLOAK.rotation.y = 0;
  const draw = ease(clamp((t - 4.2) / 0.6));
  hashira.userData.arms[1].rotation.x = -1.6 * draw; hashira.userData.arms[1].rotation.z = 0.0;
  SW4.position.set(CX + 0.32, lerp(0.9, 1.3, draw), lerp(-2.9, -2.55, draw)); SW4.rotation.x = 0; SW4.rotation.z = lerp(0.9, 0, draw);
  if (t > 4.4) { S.spot.color.set(0xffb07a); S.spot.position.set(CX, 2.8, -1.5); S.spot.target.position.set(CX, 1, -3); S.spot.intensity = 14;
    FLAMES.forEach((f, i) => { f.visible = true; const k = (t * 1.6 + f.userData.o) % 1; const along = (i % 6) / 6; f.position.set(CX + 0.32 + Math.sin(i * 3) * 0.08, 1.45 + along * 0.9 + k * 0.25, -2.55 + Math.cos(i * 2) * 0.06); f.scale.setScalar(1 - k * 0.7); f.material.opacity = 0.9 * (1 - k); }); }
  tStrong.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStrong.visible = false; tFire.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.5, 0.3, u), lerp(1.6, 1.5, u), lerp(1.4, 0.8, u), CX, 1.4, -3.2, 58);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2020年公開の日本のアニメ映画。日本の興行収入は400億円を超えた
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#06070a');
  if (t > 4.2) COINS.forEach((c, i) => { c.visible = true; const k = ((t - 4.2) * 0.5 + i * 0.07) % 1; c.position.set(TX - 2.4 + (i % 7) * 0.8, 4.4 - k * 4, -1.5 + Math.floor(i / 7) * 0.5); c.rotation.z = t * 4 + i; });
  t2020.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2020.visible = false; t400.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.6, 2.8, u), lerp(6.4, 5.6, u), TX, 3.2, -3.6, 58);
  return qs;
}
function shotTrain(t) { // 6段目 42〜49（決め手）：夢の列車で、剣士たちが鬼に立ち向かう。タイトルには、その列車の名前
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 1.5; S.key.intensity = 1.2; S.darken(0, '#0a0e18');
  S.spot.color.set(0xff3a2a); S.spot.position.set(TRAIN6.position.x - 1.6, 8, -2); S.spot.target.position.set(TRAIN6.position.x - 1.6, 3.5, -4); S.spot.intensity = 40;
  TRAIN6.position.x = DX - 4 + t * 1.2;
  smoke(t * 2, TRAIN6.position.x + 2.0, 3.6, -4, -1);
  hero6.position.set(TRAIN6.position.x - 4.5, 3.6, -4); hero6.rotation.y = Math.PI / 2; hero6.userData.arms[1].rotation.x = -2.0; hero6.userData.legs[0].rotation.x = -0.4; hero6.userData.legs[1].rotation.x = 0.4;
  SW6.position.set(hero6.position.x + 0.6, 5.05, -3.7); SW6.rotation.z = -1.1;
  ONI.position.set(TRAIN6.position.x - 2.0, 3.5, -4); ONI.rotation.y = -Math.PI / 2;
  if (t > 1.0 && t < 3.0) { SLASH.visible = true; SLASH.position.set(hero6.position.x + 1.2, 5.0, -3.8); SLASH.rotation.z = -t * 2; SLASH.material.opacity = 0.9 * (1 - (t - 1) / 2); }
  tOni.position.x = TRAIN6.position.x - 3.05; tName.position.x = TRAIN6.position.x - 3.05;
  tOni.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tOni.visible = false; tName.userData.pop((t - 3.5) / 0.3);
  look(TRAIN6.position.x - 3.05, 4.9, 2.2, TRAIN6.position.x - 3.05, 4.5, -4, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の駅に戻る）
  shotStation(8.0 + t, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.1, 0.6, d); S.darken(0.05 + 0.3 * d, '#0a0e18');
  const k = ease(t / 7);
  look(lerp(6.6, 6.2, k), lerp(2.4, 2.2, k), lerp(9.4, 8.6, k), 0.0, 1.6, 0, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStation(t, 0) },
  { a: 9, b: 17, f: shotBoard },
  { a: 17, b: 25, f: shotSleep },
  { a: 25, b: 33, f: shotHashira },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotTrain },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '夜を走る、<br>一台の汽車。'],
  [5.6, 9.0, '短い間に、40人以上が<br>行方不明になっている。'],
  [9.2, 13.2, '調べに乗り込んだのは、<br>刀を持つ少年たち。'],
  [13.2, 17.0, '修業を終えたばかりの、<br>3人の剣士。'],
  [17.2, 21.0, '車内で、剣士たちは<br>眠らされてしまう。'],
  [21.0, 25.0, '見るのは、それぞれの<br>幸せな夢。'],
  [25.2, 29.0, '合流したのは、組織で<br>最強の剣士のひとり。'],
  [29.0, 33.0, 'その剣は、<br>炎のように熱い。'],
  [33.2, 37.4, '2020年公開の、<br>日本のアニメ映画。'],
  [37.4, 41.8, '日本の興行収入は、<br>400億円を超えた。'],
  [42.2, 45.4, '夢の列車で、<br>剣士たちは鬼に挑む。'],
  [45.4, 49.0, 'タイトルには、<br>その列車の名前。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、鬼滅の刃<br>無限列車編。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q074', v2: true, answer: '劇場版「鬼滅の刃」無限列車編',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 7474,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '夜': 'よる', '走る': 'はしる', '一台': 'いちだい', '汽車': 'きしゃ', '短い間': 'みじかいあいだ', '40人以上': 'よんじゅうにんいじょう', '行方不明': 'ゆくえふめい', '調べ': 'しらべ', '乗り込んだ': 'のりこんだ', '刀': 'かたな', '持つ': 'もつ', '少年': 'しょうねん', '修業': 'しゅぎょう', '終えた': 'おえた', '3人': 'さんにん', '剣士': 'けんし', '車内': 'しゃない', '眠らされて': 'ねむらされて', '見る': 'みる', '幸せ': 'しあわせ', '夢': 'ゆめ', '合流': 'ごうりゅう', '組織': 'そしき', '最強': 'さいきょう', '剣': 'けん', '炎': 'ほのお', '熱い': 'あつい', '2020年': 'にせんにじゅうねん', '公開': 'こうかい', '日本': 'にほん', '映画': 'えいが', '興行収入': 'こうぎょうしゅうにゅう', '400億円': 'よんひゃくおくえん', '超えた': 'こえた', '列車': 'れっしゃ', '鬼': 'おに', '挑む': 'いどむ', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '鬼滅の刃': 'きめつのやいば', '無限列車編': 'むげんれっしゃへん', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n夜を走る、一台の汽車。短い間に、40人以上が行方不明になっている。調べに乗り込んだのは、刀を持つ少年たち。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Hulu', 'アニメ映画', '邦画'],
  },
});
applyQuizCards({ answer: '鬼滅の刃<br><span style="font-size:84px">無限列車編</span>', info: 'U-NEXT・Hulu｜アニメ映画・117分', answerSize: 124 });
