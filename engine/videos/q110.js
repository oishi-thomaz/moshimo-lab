import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #110 アラジン（映画・アメリカ・2019年6月7日公開・128分。Disney+ で見放題、
//   Disney+ の作品ページ disneyplus.com/ja-jp/movies/aladdin/57QdIBthImk6 と Filmarks の動画配信欄（ディズニープラス 見放題）で2026/11/19確認。
//   Filmarks 4.1・レビュー263,798件 filmarks.com/movies/79546）
// 確かめた事実（Filmarks のあらすじ filmarks.com/movies/79546、Wikipedia 日本語版 アラジン (2019年の映画) の 冒頭・ストーリー・興行収入。2026/11/19）：
//   ・本当の自分の居場所を探す貧しい青年。市場へ繰り出しては盗みを働いて暮らす。相棒は猿（Filmarks・Wikipedia）
//   ・ある日、市場で変装した王女と出会い、心を通わせる（Wikipedia）。王女は王宮の外の世界での自由を求めている（Filmarks）
//   ・魔法の洞窟でランプを手に入れる。ランプをこすると魔人が現れ、願い事を3つかなえると言う（Wikipedia・Filmarks）
//   ・2019年のアメリカのミュージカル・ファンタジー映画。1992年のディズニーの長編アニメーション映画の実写リメイク。
//     興行収入は世界 10億5,069万ドル・日本 121.6億円（Wikipedia）
// 構成（ヒント6段）：1 にぎやかな市場で、青年がひとりの娘と出会う・娘は正体を隠していた → 2 主人公は貧しい青年・盗みでその日を暮らす、相棒は小さな猿
//   → 3 砂漠の王国・高い塀の奥に宮殿 → 4 娘は、宮殿の外の自由にあこがれる王女・身分ちがいのふたり
//   → 5 2019年のアメリカ映画・ミュージカル・世界で興行収入10億ドル超え → 6 決め手：洞窟の奥の古いランプ・こすると願いを3つかなえる魔人が
// 悪役の計画・願い事の中身・結末は言わない。登場人物の名前・国の名前は出さない。
// 俳優の顔・ポスター・ロゴ・アニメの絵・劇中の有名な場面の構図（じゅうたんで夜空を飛ぶ場面・青い魔人の姿など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#e8c898', floor: '#d8b888', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(11010);

const HERO = { skin: '#d8a070', hair: '#1a1410', shirt: '#b04a2a', pants: '#e8dcc0' };
const PRIN = { skin: '#d8a882', hair: '#141010', shirt: '#4ab0b8', pants: '#4ab0b8', long: true, skirt: true };
const CLOAK = '#7a5a40';
const SELL = (i) => ({ skin: ['#d8a070', '#c89060', '#e0b088'][i % 3], hair: ['#1a1410', '#3a2a20', '#888'][i % 3], shirt: ['#e8c050', '#5a8a4a', '#8a4a8a', '#c86a3a'][i % 4], pants: '#6a5040', skirt: i % 2 === 1, long: i % 2 === 1 });
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function sky(x, c1, c2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(49, 60), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); m.position.set(x, 14, -48 - x * 0.002); qs.add(m); return m; }
function stall(x, z, c) { const g = new THREE.Group();
  const tb = box(2.0, 0.8, 1.0, mat('#8a6a48')); tb.position.y = 0.4; g.add(tb);
  for (const sx of [-0.95, 0.95]) for (const sz of [-0.45, 0.45]) { const p = box(0.08, 2.4, 0.08, mat('#5a4030')); p.position.set(sx, 1.2, sz); g.add(p); }
  const aw = box(2.3, 0.08, 1.4, mat(c)); aw.position.set(0, 2.4, 0.1); aw.rotation.x = 0.18; g.add(aw);
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(['#f0a030', '#e04a3a', '#f0d040', '#7ab040'][(i + x | 0) % 4])); f.position.set(-0.7 + (i % 3) * 0.6, 0.92, -0.2 + Math.floor(i / 3) * 0.35); g.add(f); }
  g.position.set(x, 0, z); qs.add(g); return g; }
function dome(x, y, z, r, c = '#e6b450') { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.35 })); d.position.set(x, y, z); qs.add(d);
  const sp = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.5, 8), mat(c)); sp.position.set(x, y + r + r * 0.2, z); qs.add(sp); return d; }
function monkey() { const g = new THREE.Group(); const fur = mat('#7a5030'), face = mat('#d8b088');
  const b = box(0.22, 0.26, 0.18, fur); b.position.y = 0.2; g.add(b); const h = box(0.22, 0.2, 0.2, fur); h.position.y = 0.42; g.add(h);
  const f = box(0.14, 0.12, 0.02, face); f.position.set(0, 0.41, 0.105); g.add(f);
  for (const s of [-1, 1]) { const e = box(0.06, 0.06, 0.03, face); e.position.set(s * 0.13, 0.46, 0); g.add(e); const ey = box(0.025, 0.03, 0.01, mat('#111')); ey.position.set(s * 0.035, 0.43, 0.115); g.add(ey); }
  const vest = box(0.23, 0.12, 0.19, mat('#c83a3a')); vest.position.y = 0.26; g.add(vest);
  const tl = box(0.04, 0.04, 0.3, fur); tl.position.set(0, 0.12, -0.2); tl.rotation.x = -0.6; g.add(tl); return g; }

// ---------- 1段目. 昼の市場（x=0）。屋台の列。フードで顔を隠した娘と、青年が出会う ----------
sky(0, '#7ab0e0', '#f4e0b8');
{ const gr = box(24, 0.04, 16, mat('#d8b888')); gr.position.set(0, 0.02, -4); qs.add(gr);
  for (let i = 0; i < 4; i++) { const w = box(4, 4 + (i % 2), 3, mat(['#e8d0a8', '#d8b890', '#f0dcb8', '#c8a880'][i])); w.position.set(-7 + i * 4.6, 2.2, -10); qs.add(w);
    const ar = box(0.9, 1.6, 0.05, mat('#5a3a2a')); ar.position.set(-7 + i * 4.6, 0.8, -8.47); qs.add(ar); }
  ['#c83a3a', '#3a7ab0', '#e0a030', '#8a4a9a'].forEach((c, i) => stall(-4.8 + i * 3.2, -6.2, c)); }
const SEL1 = [0, 1, 2].map(i => { const p = makePerson(SELL(i)); p.position.set(-4.8 + i * 3.2, 0, -7.2); qs.add(p); return p; });
const hero1 = makePerson(HERO); hero1.position.set(-0.9, 0, -3.4); hero1.rotation.y = 0.9; qs.add(hero1);
const prin1 = makePerson({ ...PRIN, shirt: CLOAK, pants: CLOAK }); prin1.position.set(0.9, 0, -3.6); prin1.rotation.y = -0.9; qs.add(prin1);
const HOOD1 = box(0.5, 0.5, 0.48, mat(CLOAK)); HOOD1.position.set(0, 0.3, -0.04); prin1.userData.head.add(HOOD1);
const VEIL1 = box(0.42, 0.14, 0.04, mat(CLOAK)); VEIL1.position.set(0, 0.12, 0.2); prin1.userData.head.add(VEIL1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tMeet = tag('市場で、ひとりの娘と出会う', { size: 52, w: 780, bg: '#14161c', sx: 2.4 }); tMeet.position.set(0, 2.6, -4.0); qs.add(tMeet);
const tHide = tag('娘は、正体を隠していた', { size: 54, w: 700, bg: '#c8202c', sx: 2.2 }); tHide.position.set(0, 2.6, -4.0); qs.add(tHide);

// ---------- 2段目. 夕方の屋根の上（x=50）。青年と小さな猿が、パンを分け合う ----------
const AX = 50;
sky(AX, '#e88a58', '#f8d8a0');
{ const rf = box(10, 0.3, 6, mat('#c8a070')); rf.position.set(AX, 2.0, -3); qs.add(rf);
  const wl = box(10, 2.0, 6, mat('#b89060')); wl.position.set(AX, 1.0, -3); qs.add(wl);
  for (let i = 0; i < 7; i++) { const h = 3 + (i % 3) * 1.4; const b = box(3, h, 3, mat(['#e0c090', '#d0a878', '#e8d0a8'][i % 3])); b.position.set(AX - 12 + i * 4, h / 2, -14 - (i % 2) * 3); qs.add(b); }
  dome(AX + 6, 6.5, -24, 2.4); dome(AX - 4, 5.5, -26, 1.8);
  const cl = box(1.6, 0.04, 1.2, mat('#c84a6a')); cl.position.set(AX + 1.8, 2.17, -2.4); qs.add(cl); }
const hero2 = makePerson(HERO); hero2.position.set(AX - 0.3, 2.15, -2.6); qs.add(hero2);
const MON2 = monkey(); MON2.position.set(AX + 0.45, 2.15, -2.4); qs.add(MON2);
const BREAD2 = [0, 1].map(i => { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.16, 4, 8), mat('#d8a050')); b.rotation.z = Math.PI / 2; qs.add(b); return b; });
const tPoor = tag('貧しい青年、その日暮らし', { size: 52, w: 760, bg: '#14161c', sx: 2.3 }); tPoor.position.set(AX, 3.9, -3.0); qs.add(tPoor);
const tBuddy = tag('相棒は、小さな猿', { size: 58, w: 560, bg: '#c86a2a', sx: 1.9 }); tBuddy.position.set(AX, 3.9, -3.0); qs.add(tBuddy);

// ---------- 3段目. 砂漠の王国（x=100）。丘の上から見る町、塀の奥の金色の宮殿 ----------
const BX = 100;
sky(BX, '#5a9ad8', '#f4dcb0');
{ const gr = box(80, 0.04, 60, mat('#d8b080')); gr.position.set(BX, 0.02, -20); qs.add(gr);
  for (let i = 0; i < 40; i++) { const w = 1.2 + R() * 1.4, h = 1 + R() * 2.2; const b = box(w, h, w, mat(['#f0dcb8', '#e0c498', '#d8b888', '#f4e4c8'][i % 4])); b.position.set(BX - 14 + (i % 10) * 3 + R(), h / 2, -10 - Math.floor(i / 10) * 3.4 - R()); qs.add(b); }
  const wall = box(18, 3.0, 0.8, mat('#c8a070')); wall.position.set(BX, 1.5, -26); qs.add(wall);
  for (let i = 0; i < 10; i++) { const c = box(0.6, 0.6, 0.85, mat('#c8a070')); c.position.set(BX - 8.5 + i * 1.9, 3.3, -26); qs.add(c); }
  const pal = box(10, 6, 6, mat('#f4ece0')); pal.position.set(BX, 3, -31); qs.add(pal);
  dome(BX, 6, -31, 3.2); dome(BX - 4, 6, -30, 1.6); dome(BX + 4, 6, -30, 1.6);
  for (const s of [-1, 1]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 10, 12), mat('#f4ece0')); tw.position.set(BX + s * 6.5, 5, -29); qs.add(tw); dome(BX + s * 6.5, 10, -29, 0.7); } }
const SUN3 = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: '#fff4d0', fog: false })); SUN3.position.set(BX + 18, 22, -47); qs.add(SUN3);
const hero3 = makePerson(HERO); hero3.position.set(BX - 1.0, 0, 1.0); hero3.rotation.y = Math.PI; qs.add(hero3);
const tDesert = tag('砂漠の、にぎやかな王国', { size: 54, w: 700, bg: '#14161c', sx: 5.4 }); tDesert.position.set(BX, 9.0, -12); qs.add(tDesert);
const tPalace = tag('塀の奥には、宮殿', { size: 58, w: 560, bg: '#e6b450', color: '#14161c', sx: 4.8 }); tPalace.position.set(BX, 9.0, -12); qs.add(tPalace);

// ---------- 4段目. 夕暮れの宮殿のバルコニー（x=150）。町を見下ろす王女。塀の下に青年 ----------
const CX = 150;
sky(CX, '#4a4a8a', '#f0a070');
{ const fl = box(6, 0.2, 4, mat('#f0e4d0')); fl.position.set(CX, 3.0, -3); qs.add(fl);
  const rail = box(6, 0.12, 0.12, mat('#e6b450')); rail.position.set(CX, 4.0, -1.1); qs.add(rail);
  for (let i = 0; i < 13; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), mat('#f4ece0')); b.position.set(CX - 2.9 + i * 0.48, 3.5, -1.1); qs.add(b); }
  const wl = box(6, 5, 0.3, mat('#f4ece0')); wl.position.set(CX, 5.4, -5.1); qs.add(wl);
  const arch = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24, 0, Math.PI), mat('#3a2a3a')); arch.position.set(CX, 5.2, -4.94); qs.add(arch); const ad = box(2.0, 2.1, 0.05, mat('#3a2a3a')); ad.position.set(CX, 4.15, -4.94); qs.add(ad);
  const base = box(6, 3, 4, mat('#e8dcc8')); base.position.set(CX, 1.5, -3); qs.add(base);
  const gr = box(40, 0.04, 30, mat('#c8a070')); gr.position.set(CX, 0.02, -8); qs.add(gr);
  for (let i = 0; i < 12; i++) { const h = 1 + R() * 2; const b = box(1.6, h, 1.6, mat(['#e0c498', '#d0a878'][i % 2])); b.position.set(CX - 12 + i * 2.2, h / 2, 6 + (i % 3)); qs.add(b); } }
const LAMPS4 = []; for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gl('#ffd890')); l.position.set(CX - 10 + i * 1.6, 0.8 + (i % 3) * 0.4, 5.5 + (i % 2)); qs.add(l); LAMPS4.push(l); }
const prin4 = makePerson(PRIN); prin4.position.set(CX + 0.6, 3.1, -1.8); qs.add(prin4);
const CROWN4 = box(0.3, 0.08, 0.05, mat('#e6b450')); CROWN4.position.set(0, 0.48, 0.2); prin4.userData.head.add(CROWN4);
const hero4 = makePerson(HERO); hero4.position.set(CX - 2.4, 0, 1.6); hero4.rotation.y = Math.PI * 0.85; qs.add(hero4);
const tFree = tag('外の世界の、自由にあこがれる', { size: 50, w: 820, bg: '#14161c', sx: 3.6 }); tFree.position.set(CX, 6.0, -2.4); qs.add(tFree);
const tRank = tag('身分ちがいの、ふたり', { size: 56, w: 640, bg: '#4ab0b8', sx: 3.0 }); tRank.position.set(CX, 6.0, -2.4); qs.add(tRank);

// ---------- 5段目. 映画館（x=200）。スクリーンに金色の丸屋根。金貨の山が伸びる ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1e1a22')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#2a2230')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#5a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a2a6a'); gr.addColorStop(1, '#c87a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f4e8d0'; for (let i = 0; i < 14; i++) g.fillRect(i * 52, 260 - (i % 3) * 18, 44, 120);
  g.fillStyle = '#e6b450'; g.beginPath(); g.arc(360, 210, 70, Math.PI, 0); g.fill(); g.beginPath(); g.arc(250, 235, 34, Math.PI, 0); g.fill(); g.beginPath(); g.arc(470, 235, 34, Math.PI, 0); g.fill();
  g.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % 720, (i * 37) % 130, 3, 3); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const COINS5 = []; for (let i = 0; i < 5; i++) { const s = new THREE.Group(); for (let k = 0; k < 14; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 18), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.25 })); c.position.y = k * 0.07; c.visible = false; s.add(c); }
  s.position.set(TX - 2.0 + i * 1.0, 0.04, -1.6); qs.add(s); COINS5.push(s); }
const t2019 = tag('2019年の、アメリカ映画', { size: 56, w: 680, bg: '#e6b450', color: '#14161c', sx: 4.6 }); t2019.position.set(TX, 6.4, -4.4); qs.add(t2019);
const tBox = tag('世界で、興行収入10億ドル', { size: 54, w: 760, bg: '#c8202c', sx: 4.8 }); tBox.position.set(TX, 6.4, -4.4); qs.add(tBox);

// ---------- 6段目. 洞窟の奥（x=250）。宝の山の上の、古いランプ。青い光がゆらりと立ちのぼる ----------
const DX = 250;
{ const fl = box(14, 0.04, 12, mat('#3a2a3a')); fl.position.set(DX, 0.02, -3); qs.add(fl);
  for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + R() * 1.4, 0), mat(['#4a3a4a', '#3a2e3e', '#5a4450'][i % 3])); const a = i / 14 * Math.PI; r.position.set(DX - Math.cos(a) * 6, Math.sin(a) * 4.5, -6 - Math.sin(a) * 1.5); qs.add(r); }
  for (let i = 0; i < 26; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.35 + R() * 0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.7, roughness: 0.3 })); c.position.set(DX - 4 + R() * 8, 0, -4 - R() * 3); qs.add(c); }
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.4, 8), mat('#5a4a5a')); rock.position.set(DX, 0.7, -2.8); qs.add(rock);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.4, 8, 16, 1, true), gl('#fff4c0', 0.12)); beam.position.set(DX, 4.4, -2.8); qs.add(beam); }
const LAMP6 = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: '#d8a838', metalness: 0.85, roughness: 0.25 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), m); b.scale.set(1.3, 0.6, 0.9); LAMP6.add(b);
  const sp = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 10), m); sp.rotation.z = -Math.PI / 2 - 0.35; sp.position.set(0.48, 0.08, 0); LAMP6.add(sp);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 14), m); hd.position.set(-0.42, 0.04, 0); LAMP6.add(hd);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), m); lid.position.y = 0.2; LAMP6.add(lid);
  const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.08, 14), m); ft.position.y = -0.18; LAMP6.add(ft); }
LAMP6.position.set(DX, 1.62, -2.8); qs.add(LAMP6);
const SMOKE6 = []; for (let i = 0; i < 18; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), gl('#5ab8ff', 0.6)); qs.add(s); SMOKE6.push(s); }
const SPARK6 = []; for (let i = 0; i < 20; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), gl('#fff4c0')); s.userData.p = [R() * 6 - 3, R() * 3, R() * 2 - 3.5, R() * 6]; qs.add(s); SPARK6.push(s); }
const tLamp = tag('洞窟の奥の、古いランプ', { size: 56, w: 680, bg: '#14161c', sx: 2.6 }); tLamp.position.set(DX, 3.9, -3.2); qs.add(tLamp);
const tWish = tag('こすると、願いを3つ', { size: 58, w: 620, bg: '#2a7ad8', sx: 2.4 }); tWish.position.set(DX, 3.9, -3.2); qs.add(tWish);

// ---------- shots ----------
const ALL = [tMeet, tHide, tPoor, tBuddy, tDesert, tPalace, tFree, tRank, t2019, tBox, tLamp, tWish, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotMarket(t, quiz = 0) { // 1段目 0〜9：にぎやかな市場で、青年がひとりの娘と出会う。娘は正体を隠していた（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 1.3;
  SEL1.forEach((p, i) => { p.userData.arms[i % 2].rotation.x = -0.6 - Math.abs(Math.sin(t * 2 + i)) * 0.6; });
  const w = quiz ? 1 : ease(clamp((t - 0.3) / 2.2));
  hero1.position.x = lerp(-1.7, -0.75, w); poseWalk(hero1, t * 6, !quiz && w < 1 ? 0.6 : 0);
  hero1.userData.arms[1].rotation.x = w >= 1 ? -0.9 : hero1.userData.arms[1].rotation.x;
  prin1.userData.head.rotation.x = 0.15; prin1.userData.arms[0].rotation.x = -0.4;
  const off = quiz ? 0 : ease(clamp((t - 5.0) / 0.6)); VEIL1.visible = true; HOOD1.position.z = -0.04 - off * 0.12; HOOD1.position.y = 0.3 + off * 0.06;
  Q1.position.set(0.9, 2.35, -3.6); Q1.userData.pop(quiz ? 1 : 1); if (!quiz && t > 1.6) Q1.visible = false;
  if (!quiz) { tMeet.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tMeet.visible = false; tHide.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(2.0, 1.8, u), lerp(2.4, 1.0, u), 0.1, 1.4, -3.6, 60);
  return qs;
}
function shotRoof(t) { // 2段目 9〜17：主人公は、貧しい青年。盗みでその日を暮らす。相棒は小さな猿
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.1; S.darken(0.2, '#f0a070');
  hero2.userData.legs.forEach(l => l.rotation.x = -1.5); hero2.position.y = 1.77; hero2.rotation.y = 0.3;
  hero2.userData.arms[1].rotation.x = t > 4.2 ? -1.3 : -0.8; hero2.userData.head.rotation.y = t > 4.2 ? 0.5 : 0;
  MON2.rotation.y = -0.5; MON2.position.y = 2.15 + (t > 4.2 ? Math.abs(Math.sin(t * 6)) * 0.08 : 0);
  BREAD2[0].position.set(AX - 0.05, 2.62, -2.3); BREAD2[1].position.set(AX + 0.42, 2.5, -2.25); BREAD2[1].visible = t > 4.4; BREAD2[0].visible = true;
  tPoor.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPoor.visible = false; tBuddy.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.8, 0.4, u), lerp(3.4, 3.2, u), lerp(1.9, 1.2, u), AX + 0.1, 2.35, -2.6, 62);
  return qs;
}
function shotKingdom(t) { // 3段目 17〜25：砂漠の、にぎやかな王国。高い塀の奥には宮殿
  base(); S.aim(BX, -14); lift(0); S.hemi.intensity = 1.35;
  tDesert.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDesert.visible = false; tPalace.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.6, 0.4, u), lerp(4.6, 4.0, u), lerp(5.0, 3.0, u), BX, 4.0, -24, 58);
  return qs;
}
function shotBalcony(t) { // 4段目 25〜33：娘は、宮殿の外の自由にあこがれる王女。身分ちがいのふたり
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.9; S.darken(0.3, '#e08a60');
  prin4.rotation.y = Math.PI * 0.95; prin4.userData.arms.forEach(a => a.rotation.x = -0.6); prin4.userData.head.rotation.x = 0.3;
  LAMPS4.forEach((l, i) => l.material.color.setHSL(0.11, 1, 0.65 + Math.sin(t * 3 + i) * 0.1));
  hero4.userData.head.rotation.x = -0.5;
  tFree.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFree.visible = false; tRank.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-1.2, -0.6, u), lerp(2.2, 2.6, u), lerp(5.6, 4.6, u), CX - 0.4, 3.8, -1.8, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2019年のアメリカ映画。世界で興行収入10億ドル超え
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  COINS5.forEach((s, i) => { const n = Math.floor(ease(clamp((t - 4.4 - i * 0.15) / 1.2)) * (6 + i * 2)); s.children.forEach((c, k) => c.visible = k < n); });
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2019.visible = false; tBox.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.8, 6.0, u), TX, 3.6, -4.8, 68);
  return qs;
}
function shotCave(t) { // 6段目 42〜49（決め手）：洞窟の奥の古いランプ。こすると、願いを3つかなえる魔人が
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.6; S.darken(0.7, '#0a0610');
  LAMP6.rotation.y = Math.sin(t * 0.8) * 0.2;
  const sm = clamp((t - 3.8) / 0.6);
  SMOKE6.forEach((s, i) => { const k = ((t * 0.5 + i / 18) % 1); s.visible = sm > 0; s.position.set(DX + 0.55 + Math.sin(k * 6 + i) * 0.25 * k, 1.75 + k * 2.4, -2.8 + Math.cos(k * 5 + i) * 0.2 * k); s.scale.setScalar((0.6 + k * 2.4) * sm); s.material.opacity = 0.6 * (1 - k); });
  SPARK6.forEach((s, i) => { const p = s.userData.p; s.position.set(DX + p[0], 0.4 + ((p[1] + t * 0.4) % 3), p[2]); s.rotation.y = t * 2 + p[3]; });
  if (t < 3.6) tLamp.userData.pop((t - 0.3) / 0.35); else tWish.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.3, u), lerp(2.4, 2.3, u), lerp(2.6, 1.6, u), DX, 2.0, -2.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（市場に戻る）
  shotMarket(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotMarket(t, 0) },
  { a: 9, b: 17, f: shotRoof },
  { a: 17, b: 25, f: shotKingdom },
  { a: 25, b: 33, f: shotBalcony },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotCave },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'にぎやかな市場で、<br>青年がひとりの娘と出会う。'],
  [5.6, 9.0, 'でも娘は、<br>正体を隠していた。'],
  [9.2, 13.2, '主人公は、貧しい青年。<br>盗みでその日を暮らす。'],
  [13.2, 17.0, 'いつもいっしょの相棒は、<br>小さな猿。'],
  [17.2, 21.0, '舞台は、砂漠の<br>にぎやかな王国。'],
  [21.0, 25.0, '高い塀の奥には、<br>金色の宮殿。'],
  [25.2, 29.0, '娘は、宮殿の外の自由に<br>あこがれる王女だった。'],
  [29.0, 33.0, '身分ちがいの、<br>ふたり。'],
  [33.2, 37.4, '2019年のアメリカ映画。<br>ミュージカル・ファンタジー。'],
  [37.4, 41.8, '世界の興行収入は、<br>10億ドルを超えた。'],
  [42.2, 45.4, '洞窟の奥で見つけた、<br>古いランプ。'],
  [45.4, 49.0, 'こすると、願いを3つ<br>かなえる魔人が…'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>アラジン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q110', v2: true, answer: 'アラジン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 11010,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '市場': 'いちば', '青年': 'せいねん', '娘': 'むすめ', '出会う': 'であう', '正体': 'しょうたい', '隠していた': 'かくしていた', '主人公': 'しゅじんこう', '貧しい': 'まずしい', '盗み': 'ぬすみ', '日': 'ひ', '暮らす': 'くらす', '相棒': 'あいぼう', '小さな': 'ちいさな', '猿': 'さる', '舞台': 'ぶたい', '砂漠': 'さばく', '王国': 'おうこく', '高い': 'たかい', '塀': 'へい', '奥': 'おく', '金色': 'きんいろ', '宮殿': 'きゅうでん', '外': 'そと', '自由': 'じゆう', '王女': 'おうじょ', '身分': 'みぶん', '2019年': 'にせんじゅうきゅうねん', '映画': 'えいが', '世界': 'せかい', '興行収入': 'こうぎょうしゅうにゅう', '10億ドル': 'じゅうおくドル', '超えた': 'こえた', '洞窟': 'どうくつ', '見つけた': 'みつけた', '古い': 'ふるい', '願い': 'ねがい', '3つ': 'みっつ', '魔人': 'まじん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nにぎやかな市場で、青年がひとりの娘と出会う。でも娘は、正体を隠していた。主人公は、貧しい青年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', '洋画', '映画好き', 'ミュージカル'],
  },
});
applyQuizCards({ answer: 'アラジン', info: 'Disney+｜映画・128分', answerSize: 150 });
