import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #085 インセプション（映画・アメリカ／イギリス・2010年・148分。Prime Video・Hulu・U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/insepushiyon で2026/11/14確認（Filmarks の動画配信欄も Prime Video・Hulu・U-NEXT）。
//   Filmarks 4.1・レビュー303,834件 filmarks.com/movies/5603）
// 確かめた事実（Filmarks の作品紹介、ja.wikipedia.org/wiki/インセプション。2026/11/14）：
//   ・主人公は、人の夢（潜在意識）の中に入り込んでアイデアを盗み出す産業スパイ。冒頭は夢の中の金庫から秘密の封書を盗み出す仕事（Filmarks・Wikipedia）
//   ・主人公は犯罪の容疑をかけられていて、アメリカの家で待つ娘と息子のところへ帰れない。依頼主は、成功すれば容疑を消して家に帰れるようにすると持ちかける（Wikipedia）
//   ・夢の世界を作る「設計士」として大学生が加わる。夢の主の潜在意識は、入り込んだ者を襲う（Wikipedia）
//   ・依頼は、盗み出すのとは逆に、ある男（大企業の後継者）の心にアイデアを植え付けること（＝インセプション）（Wikipedia）
//   ・設計士・偽造師・調合師などのプロを集めてチームを組む（Wikipedia）
//   ・作戦は夢の中のさらに夢へ、何層も潜る。落ちる衝撃（キック）で目を覚ます（Wikipedia）
//   ・2010年のSFアクション映画。アカデミー賞で撮影賞・視覚効果賞・音響編集賞・録音賞の4部門を受賞（Wikipedia）。製作国 アメリカ・イギリス、148分（Filmarks）
// 構成（ヒント6段）：1 眠っている人の夢に入りこむ・夢の中の金庫から秘密を盗む → 2 主人公は夢に入るプロのスパイ・疑いをかけられ家に帰れない
//   → 3 夢の街は設計できる・よそ者に気づいた心が襲ってくる → 4 プロを集めたチーム・ある男の心にアイデアを植え付ける
//   → 5 2010年のアメリカ・イギリス映画・アカデミー賞4部門のSFアクション → 6 決め手：夢の中でさらに夢を見る・落ちる衝撃で目を覚ます
// 結末（最後の場面）・妻のこと・作戦の結果は言わない。人物名・地名は出さない。最後の場面の小道具（回るコマ）・折れ曲がる街・無重力の廊下など有名な場面の構図は使わない。
// 俳優の顔・ポスター・ロゴは使わない。人は汎用の3D

const S = quizStage({ bg: '#141a26', floor: '#1c2230', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8585);

const HERO = { skin: '#f1c9a5', hair: '#6b4a33', shirt: '#2b2f3a', pants: '#1f2430', tie: true };
const PARTNER = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#59606e', pants: '#2b3346', tie: true };
const TARGET = { skin: '#f5d3b5', hair: '#4a3426', shirt: '#e9e4da', pants: '#3b3f4a', tie: true };
const ARCH = { skin: '#f4d3b5', hair: '#4a3426', shirt: '#c94f7c', pants: '#2b3346', long: true };
const TEAM = [HERO, PARTNER, ARCH,
  { skin: '#e8b98f', hair: '#2c2421', shirt: '#8a6a3a', pants: '#3b3f4a' },
  { skin: '#d9a57c', hair: '#1d1a19', shirt: '#3f8f6b', pants: '#2b3346' },
  { skin: '#f1c9a5', hair: '#9a9a9a', shirt: '#1a1a22', pants: '#1a1a22', tie: true }];
const CYAN = '#3ab0d8';

function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -1.45); }
function chair(x, z, ry = 0, col = '#3a3036') { const g = new THREE.Group(); const s = box(0.6, 0.1, 0.55, mat(col)); s.position.y = 0.48; g.add(s); const b = box(0.6, 0.8, 0.1, mat(col)); b.position.set(0, 0.9, -0.26); g.add(b); g.position.set(x, 0, z); g.rotation.y = ry; qs.add(g); return g; }
// 夢の泡（中が少し明るい半透明の玉）
function bubble(r = 1.1, col = '#9ad8ff') { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, depthWrite: false })); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 6, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7 })); m.add(rim); return m; }
function safe() { const g = new THREE.Group(); const b = box(0.8, 0.8, 0.7, new THREE.MeshStandardMaterial({ color: '#5a6270', metalness: 0.7, roughness: 0.35 })); g.add(b);
  const door = new THREE.Group(); door.position.set(-0.36, 0, 0.36); g.add(door); const dp = box(0.72, 0.72, 0.06, new THREE.MeshStandardMaterial({ color: '#7a8494', metalness: 0.8, roughness: 0.3 })); dp.position.x = 0.36; door.add(dp);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20), mat('#c8a050')); dial.rotation.x = Math.PI / 2; dial.position.set(0.36, 0, 0.05); door.add(dial);
  const env = box(0.36, 0.04, 0.24, new THREE.MeshBasicMaterial({ color: '#f4ecd8' })); env.position.set(0, -0.1, 0.05); g.add(env);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0 })); glow.position.set(0, 0, 0.34); g.add(glow);
  g.userData = { door, env, glow }; return g; }

// ---------- 1段目. 暗い部屋（x=0）。椅子で眠る男たちと、管でつながった銀の箱。頭の上に夢の泡、中に金庫 ----------
{ const fl = box(12, 0.04, 10, mat('#2a2a34')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#3a3a48')); wl.position.set(0, 2.5, -5); qs.add(wl);
  const win = box(2.2, 1.6, 0.05, new THREE.MeshBasicMaterial({ color: '#1a2a48' })); win.position.set(2.6, 2.6, -4.88); qs.add(win);
  for (let i = 0; i < 3; i++) { const bl = box(2.2, 0.06, 0.03, mat('#5a5a6a')); bl.position.set(2.6, 2.0 + i * 0.5, -4.84); qs.add(bl); } }
const SLEEP1 = [];
[[-1.3, PARTNER], [0, TARGET], [1.3, HERO]].forEach(([x, o], i) => { chair(x, -2.6); const p = makePerson(o); p.position.set(x, -0.32, -2.5); sit(p); p.userData.head.rotation.x = -0.35; p.userData.head.rotation.z = i === 1 ? 0.12 : -0.1; qs.add(p); SLEEP1.push(p); });
const CASE1 = new THREE.Group(); { const c = box(0.9, 0.3, 0.6, new THREE.MeshStandardMaterial({ color: '#b8c0cc', metalness: 0.8, roughness: 0.25 })); c.position.y = 0.15; CASE1.add(c); const lid = box(0.9, 0.04, 0.6, mat('#8a929e')); lid.position.y = 0.32; CASE1.add(lid);
  const led = box(0.12, 0.05, 0.02, new THREE.MeshBasicMaterial({ color: '#4ad86a' })); led.position.set(0.25, 0.2, 0.31); CASE1.add(led); }
CASE1.position.set(0, 0, -1.4); qs.add(CASE1);
const TUBES = [];
[-1.3, 0, 1.3].forEach((x) => { const pts = [new THREE.Vector3(0, 0.3, -1.4), new THREE.Vector3(x * 0.6, 0.5, -1.7), new THREE.Vector3(x + (x > 0 ? -0.3 : x < 0 ? 0.3 : 0.3), 0.9, -2.2)];
  const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.02, 6), new THREE.MeshBasicMaterial({ color: CYAN })); qs.add(tb); TUBES.push(tb); });
const BUB1 = bubble(1.0); BUB1.position.set(0, 3.3, -2.6); qs.add(BUB1);
const SAFE1 = safe(); SAFE1.position.set(0, 3.25, -2.6); qs.add(SAFE1);
const ZZ = []; for (let i = 0; i < 3; i++) { const z = tag('z', { size: 90, w: 110, h: 110, bg: 'rgba(0,0,0,0)', color: '#cfe6ff', sx: 0.3 }); qs.add(z); ZZ.push(z); }
const tSleep = tag('眠る人の夢に入る', { size: 58, w: 560, bg: '#14161c', sx: 1.9 }); tSleep.position.set(0, 1.95, -1.6); qs.add(tSleep);
const tSafe = tag('夢の中の金庫から', { size: 58, w: 560, bg: '#2a6a9a', sx: 1.9 }); tSafe.position.set(0, 1.95, -1.6); qs.add(tSafe);

// ---------- 2段目. 夜のホテルの部屋（x=40）。ベッドに座る男、子ども2人の写真、鳴らない電話 ----------
const AX = 40;
{ const fl = box(10, 0.04, 8, mat('#4a3a36')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#5a5048')); wl.position.set(AX, 2.5, -3.6); qs.add(wl);
  const bed = box(2.0, 0.45, 1.6, mat('#d8d0c4')); bed.position.set(AX - 0.4, 0.23, -2.4); qs.add(bed);
  const hb = box(2.0, 0.9, 0.1, mat('#5a3a2a')); hb.position.set(AX - 0.4, 0.7, -3.2); qs.add(hb);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.3, 14), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lamp.position.set(AX + 1.2, 0.95, -2.9); qs.add(lamp);
  const nt = box(0.5, 0.6, 0.5, mat('#3a2a20')); nt.position.set(AX + 1.2, 0.3, -2.9); qs.add(nt);
  const cw = box(3.0, 1.8, 0.05, new THREE.MeshBasicMaterial({ map: (() => { const wt = windowTextures(8501, '#1a2030'); wt.map.repeat.set(2, 1); return wt.map; })() })); cw.position.set(AX - 2.6, 2.6, -3.48); qs.add(cw); }
const man2 = makePerson(HERO); man2.position.set(AX + 0.1, 0.12, -1.75); sit(man2); qs.add(man2);
const PHOTO2 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.66), new THREE.MeshBasicMaterial({ map: canvasTex(270, 200, (g, w, h) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); g.fillStyle = '#9ac8e8'; g.fillRect(14, 14, w - 28, 110); g.fillStyle = '#7ab060'; g.fillRect(14, 124, w - 28, 62);
  for (const [x, hh, c] of [[100, 70, '#e88aa0'], [170, 56, '#4a7ad8']]) { g.fillStyle = '#6b4a33'; g.beginPath(); g.arc(x, 186 - hh - 16, 14, 0, 7); g.fill(); g.fillStyle = c; g.fillRect(x - 13, 186 - hh, 26, hh - 8); } }) }));
PHOTO2.position.set(AX + 1.25, 1.95, -3.45); qs.add(PHOTO2);
const PHONE2 = box(0.1, 0.18, 0.03, new THREE.MeshBasicMaterial({ color: '#9ad8ff' })); PHONE2.position.set(0, -0.7, 0.06); PHONE2.rotation.x = Math.PI / 2; man2.userData.arms[1].add(PHONE2);
const tSpy = tag('夢に入るプロのスパイ', { size: 54, w: 640, bg: '#14161c', sx: 2.1 }); tSpy.position.set(AX, 3.05, -1.9); qs.add(tSpy);
const tHome = tag('家に、帰れない', { size: 62, w: 480, bg: '#2a6a9a', sx: 1.7 }); tHome.position.set(AX, 3.05, -1.9); qs.add(tHome);

// ---------- 3段目. 夢の街（x=80）。地面からせり上がるビル、見つめてくる人々 ----------
const BX = 80;
{ const gr = box(30, 0.04, 24, mat('#3a4050')); gr.position.set(BX, 0.02, -6); qs.add(gr);
  const grid = new THREE.GridHelper(24, 24, '#5a7aa0', '#3a4a60'); grid.position.set(BX, 0.05, -6); qs.add(grid); }
const TOWERS = []; for (let i = 0; i < 9; i++) { const h = 3 + R() * 5; const wt = windowTextures(8510 + i, ['#6a7488', '#5a6478', '#7a8498'][i % 3]); wt.map.repeat.set(2, Math.round(h / 1.2)); wt.emi.repeat.set(2, Math.round(h / 1.2));
  const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.6), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe0a0'), emissiveIntensity: 0.5 }));
  const col = i % 3, row = Math.floor(i / 3); t.userData = { h, x: BX - 3.2 + col * 3.2 + (row % 2) * 0.8, z: -6 - row * 3.2, d: i * 0.18 }; t.position.set(t.userData.x, -h, t.userData.z); qs.add(t); TOWERS.push(t); }
const arch3 = makePerson(ARCH); arch3.position.set(BX - 0.5, 0, -1.6); arch3.rotation.y = Math.PI; qs.add(arch3);
const man3 = makePerson(HERO); man3.position.set(BX + 0.4, 0, -1.4); man3.rotation.y = Math.PI; qs.add(man3);
const CROWD3 = []; for (let i = 0; i < 9; i++) { const p = makePerson({ skin: ['#f1c9a5', '#e8b98f', '#d9a57c', '#f5d3b5'][i % 4], hair: ['#1d1a19', '#4a3426', '#6b4a33', '#9a9a9a'][i % 4], shirt: '#4a5060', pants: '#2b2f3a', long: i % 3 === 1, skirt: i % 3 === 1 });
  const a = -1.2 + i * 0.3; p.userData.base = new THREE.Vector3(BX + Math.sin(a) * 3.4, 0, -1.5 - Math.cos(a) * 2.6 + 0.4); p.position.copy(p.userData.base); qs.add(p); CROWD3.push(p); }
const tBuild = tag('夢の街は、設計できる', { size: 56, w: 640, bg: '#14161c', sx: 2.1 }); tBuild.position.set(BX, 3.6, -2.4); qs.add(tBuild);
const tAttack = tag('よそ者に、襲いかかる', { size: 56, w: 640, bg: '#a82a2a', sx: 2.1 }); tAttack.position.set(BX, 3.6, -2.4); qs.add(tAttack);

// ---------- 4段目. 作戦会議の倉庫（x=120）。プロのチームと、ある男の頭に植える小さな芽 ----------
const CX = 120;
{ const fl = box(14, 0.04, 10, mat('#3a3834')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#4a4844')); wl.position.set(CX, 3, -6); qs.add(wl);
  const tb = box(2.6, 0.08, 1.4, mat('#6a5a48')); tb.position.set(CX, 0.8, -2.4); qs.add(tb);
  for (const [x, z] of [[-1.2, -0.65], [1.2, -0.65], [-1.2, 0.65], [1.2, 0.65]]) { const lg = box(0.08, 0.8, 0.08, mat('#3a2a20')); lg.position.set(CX + x, 0.4, -2.4 + z); qs.add(lg); }
  const pl = box(1.4, 0.02, 1.0, new THREE.MeshBasicMaterial({ color: '#d8e4f0' })); pl.position.set(CX, 0.85, -2.4); qs.add(pl);
  for (let i = 0; i < 4; i++) { const ln = box(0.9 - i * 0.15, 0.025, 0.02, new THREE.MeshBasicMaterial({ color: '#2a6a9a' })); ln.position.set(CX - 0.1, 0.87, -2.7 + i * 0.2); qs.add(ln); } }
const TEAM4 = TEAM.map((o, i) => { const p = makePerson(o); const a = -2.3 + i * 0.92; p.position.set(CX + Math.sin(a) * 1.9, 0, -2.4 - Math.cos(a) * 1.25); p.rotation.y = Math.atan2(CX - p.position.x, -2.4 - p.position.z); qs.add(p); return p; });
const HEAD4 = new THREE.Group(); HEAD4.position.set(CX, 3.6, -3.6); qs.add(HEAD4);
{ const hd = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), new THREE.MeshBasicMaterial({ color: '#9ad8ff', transparent: true, opacity: 0.3, depthWrite: false })); hd.scale.set(0.9, 1.05, 0.9); HEAD4.add(hd);
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.5, 16), new THREE.MeshBasicMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.22, depthWrite: false })); nk.position.y = -1.1; HEAD4.add(nk); }
const SEED4 = new THREE.Group(); { const sd = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), mat('#8a6a3a')); SEED4.add(sd); const st = box(0.03, 0.3, 0.03, new THREE.MeshBasicMaterial({ color: '#5ac85a' })); st.position.y = 0.15; SEED4.add(st);
  for (const s of [-1, 1]) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), new THREE.MeshBasicMaterial({ color: '#5ac85a' })); lf.scale.set(1.4, 0.4, 0.8); lf.position.set(s * 0.12, 0.3, 0); lf.rotation.z = s * 0.4; SEED4.add(lf); } SEED4.userData.sprout = [st, ...SEED4.children.slice(2)]; }
HEAD4.add(SEED4);
const tTeam = tag('集めたのは、プロたち', { size: 56, w: 640, bg: '#14161c', sx: 2.1 }); tTeam.position.set(CX, 2.3, -1.0); qs.add(tTeam);
const tPlant = tag('心に、アイデアを植える', { size: 54, w: 660, bg: '#3f8f6b', sx: 2.2 }); tPlant.position.set(CX, 2.3, -1.0); qs.add(tPlant);

// ---------- 5段目. 映画館のスクリーン（x=180）。2010年・SFアクション・アカデミー賞4部門 ----------
const TX = 180;
{ const fl = box(12, 0.04, 12, mat('#1a1a24')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 7, 0.2, mat('#101018')); wl.position.set(TX, 3.5, -5); qs.add(wl);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const st = box(0.7, 0.6, 0.6, mat('#2a3a5a')); st.position.set(TX - 2.1 + i * 0.85, 0.3 + r * 0.2, 1.2 + r * 1.1); qs.add(st); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(600, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1a30'); gr.addColorStop(1, '#2a4a70'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) { const bw = 30 + (i * 37) % 25, bh = 60 + (i * 53) % 140; g.fillStyle = '#0a1220'; g.fillRect(i * 50, h - bh, bw, bh); }
  g.strokeStyle = 'rgba(160,220,255,0.7)'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(w / 2, 120, 60 + k * 50, 24 + k * 12, 0, 0, 7); g.stroke(); } }) }));
SCREEN5.position.set(TX, 3.0, -4.88); qs.add(SCREEN5);
const STARS5 = []; for (let i = 0; i < 4; i++) { const s = tag('★', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#f2c14e', sx: 0.5 }); s.position.set(TX - 1.5 + i * 1.0, 1.25, -4.0); qs.add(s); STARS5.push(s); }
const t2010 = tag('2010年 アメリカ・イギリス映画', { size: 52, w: 820, bg: '#e6b450', color: '#14161c', sx: 2.9 }); t2010.position.set(TX, 5.2, -4.0); qs.add(t2010);
const tOscar = tag('アカデミー賞 4部門', { size: 60, w: 600, bg: '#2a6a9a', sx: 2.3 }); tOscar.position.set(TX, 5.2, -4.0); qs.add(tOscar);

// ---------- 6段目. 重なった3つの夢（x=220）。上から 雨の街／ホテル／雪の山。下へ潜り、落ちて目を覚ます ----------
const DX = 220;
const LAYERS = [];
function layer(y, top, cols) { const g = new THREE.Group(); g.position.set(DX, y, -2.4); qs.add(g);
  const pl = box(4.6, 0.14, 3.0, mat(top)); g.add(pl);
  const edge = new THREE.Mesh(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.6, 0.14, 3.0)), new THREE.LineBasicMaterial({ color: '#9ad8ff' })); g.add(edge);
  cols.forEach(([x, z, w, h, d, c]) => { const b = box(w, h, d, mat(c)); b.position.set(x, 0.07 + h / 2, z); g.add(b); });
  LAYERS.push(g); return g; }
const L1 = layer(6.2, '#3a4458', [[-1.6, -1.0, 0.8, 1.6, 0.8, '#5a6478'], [1.5, -1.0, 0.9, 2.0, 0.8, '#4a5468'], [-0.2, -1.1, 0.7, 1.2, 0.6, '#6a7488']]);
const L2 = layer(3.2, '#6a4a3a', [[-1.4, -1.2, 0.6, 1.4, 0.2, '#b89a6a'], [0, -1.2, 0.6, 1.4, 0.2, '#b89a6a'], [1.4, -1.2, 0.6, 1.4, 0.2, '#b89a6a']]);
const L3 = layer(0.2, '#e8eef4', [[-1.5, -0.9, 0.0001, 0.0001, 0.0001, '#fff']]);
{ const mt = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.6, 4), mat('#c8d4e0')); mt.position.set(-1.0, 0.87, -0.8); L3.add(mt); const mt2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 4), mat('#d8e2ec')); mt2.position.set(1.3, 0.67, -0.9); L3.add(mt2); }
const RAIN = []; for (let i = 0; i < 40; i++) { const d = box(0.015, 0.25, 0.015, new THREE.MeshBasicMaterial({ color: '#9ac8ff' })); L1.add(d); d.userData = { x: (R() - 0.5) * 4.2, z: (R() - 0.5) * 2.6, o: R() }; RAIN.push(d); }
const SNOW = []; for (let i = 0; i < 30; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); L3.add(d); d.userData = { x: (R() - 0.5) * 4.2, z: (R() - 0.5) * 2.6, o: R() }; SNOW.push(d); }
const SLEEPERS6 = [L1, L2, L3].map((L, i) => { const g = new THREE.Group(); const p = makePerson(TEAM[i]); p.scale.setScalar(0.6); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.2, 0.55); g.add(p); g.position.set(0.5, 0.07, 0.4); g.rotation.y = 0.5; L.add(g); g.userData.p = p; return g; });
const FALL6 = makePerson(HERO); FALL6.scale.setScalar(0.6); qs.add(FALL6);
const WAKE6 = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 32), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0, side: THREE.DoubleSide })); qs.add(WAKE6);
const tDeep = tag('夢の中の、また夢へ', { size: 58, w: 600, bg: '#14161c', sx: 2.1 }); tDeep.position.set(DX, 0, -0.8); qs.add(tDeep);
const tKick = tag('落ちて、目を覚ます', { size: 60, w: 580, bg: '#c8202c', sx: 2.1 }); tKick.position.set(DX, 0, -0.8); qs.add(tKick);

// ---------- shots ----------
const ALL = [tSleep, tSafe, tSpy, tHome, tBuild, tAttack, tTeam, tPlant, t2010, tOscar, tDeep, tKick];
function base() { S.reset(); ALL.forEach(x => x.visible = false); ZZ.forEach(z => z.visible = false); STARS5.forEach(s => s.visible = false); FALL6.visible = false; }

function shotSleep(t, quiz = 0) { // 1段目 0〜9：眠っている人の夢に、こっそり入りこむ。夢の中の金庫から、秘密を盗み出す（0秒目がサムネ）
  base(); S.aim(0, -2.5); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#05070c');
  SLEEP1.forEach((p, i) => { p.position.y = -0.32 + Math.sin(t * 1.2 + i) * 0.006; });
  TUBES.forEach((tb, i) => { tb.material.color.set(Math.sin(t * 4 - i) > 0.3 ? '#8ae8ff' : CYAN); });
  const open = quiz ? 0.6 : clamp((t - 4.6) / 1.4);
  BUB1.scale.setScalar(1 + Math.sin(t * 2) * 0.03); BUB1.rotation.y = t * 0.3;
  SAFE1.scale.setScalar(BUB1.scale.x); SAFE1.rotation.y = -0.35 + Math.sin(t * 0.6) * 0.15;
  SAFE1.userData.door.rotation.y = -open * 1.6; SAFE1.userData.glow.material.opacity = open * 0.7; SAFE1.userData.env.position.z = 0.05 + open * 0.25;
  ZZ.forEach((z, i) => { z.visible = true; z.userData.pop(1); const k = (t * 0.35 + i / 3) % 1; z.position.set(-1.3 + i * 1.3 + 0.2, 1.8 + k * 0.8, -2.3); z.material.opacity = 1 - k; });
  if (!quiz) { tSleep.userData.pop((t - 0.6) / 0.35); if (t > 4.3) tSleep.visible = false; tSafe.userData.pop((t - 4.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.3, -0.2, u), lerp(2.2, 2.6, u), lerp(4.4, 3.9, u), 0, 2.3, -2.4, 64);
  return qs;
}
function shotHotel(t) { // 2段目 9〜17：主人公は、夢に入るプロの産業スパイ。疑いをかけられ、家に帰れない。子どもたちに会いたい
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.75; S.darken(0.3, '#0a0806');
  man2.userData.arms[1].rotation.x = -1.0; man2.userData.arms[1].rotation.z = 0.15; man2.userData.head.rotation.x = 0.45;
  man2.userData.arms[0].rotation.x = -0.4; man2.userData.head.rotation.y = 0;
  if (t > 4.2) { man2.userData.head.rotation.x = 0.0; man2.userData.head.rotation.y = 0.5; man2.userData.arms[1].rotation.x = -0.3; }
  tSpy.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSpy.visible = false; tHome.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.6, 0.2, u), lerp(2.0, 2.2, u), lerp(3.4, 2.9, u), AX + 0.3, 1.6, -2.2, 62);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：夢の中の街は、思いどおりに設計できる。でも、よそ者に気づいた心が、襲いかかってくる
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.85; S.darken(0.35, '#0a1020');
  TOWERS.forEach(tw => { const k = ease(clamp((t - 0.3 - tw.userData.d) / 1.2)); tw.position.y = lerp(-tw.userData.h / 2, tw.userData.h / 2, k); });
  arch3.userData.arms.forEach(a => a.rotation.x = t < 3.8 ? -2.0 - Math.sin(t * 3) * 0.2 : -0.2);
  const turn = ease(clamp((t - 4.0) / 0.6)), come = ease(clamp((t - 4.8) / 3.0));
  CROWD3.forEach((p, i) => { const b = p.userData.base; p.position.x = lerp(b.x, lerp(b.x, BX, 0.4), come); p.position.z = lerp(b.z, lerp(b.z, -1.5, 0.4), come);
    p.rotation.y = lerp(i % 2 ? 0.6 : -0.6, Math.atan2(BX - p.position.x, -1.5 - p.position.z), turn); poseWalk(p, t * 5 + i, come > 0 && come < 1 ? 0.7 : 0); });
  if (t > 4.2) { man3.rotation.y = Math.PI + Math.sin(t * 2) * 0.5; arch3.rotation.y = Math.PI - Math.sin(t * 2) * 0.4; }
  if (t > 4.0) S.darken(0.35 + 0.25 * turn, '#200808');
  tBuild.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBuild.visible = false; tAttack.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, -0.2, u), lerp(1.8, 2.6, u), lerp(2.6, 3.8, u), BX, 1.9, -4.0, 64);
  return qs;
}
function shotTeam(t) { // 4段目 25〜33：集めたのは、それぞれの道のプロ。依頼は、ある男の心にアイデアを植え付けること
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.85; S.darken(0.3, '#0c0a08');
  TEAM4.forEach((p, i) => { p.userData.head.rotation.x = 0.3; if (i === 0) p.userData.arms[1].rotation.x = -1.2 - Math.sin(t * 2) * 0.2; });
  const k = clamp((t - 4.0) / 0.8);
  HEAD4.visible = t > 3.9; HEAD4.scale.setScalar(ease(k)); HEAD4.rotation.y = Math.sin(t * 0.5) * 0.2;
  const g = ease(clamp((t - 5.0) / 1.5)); SEED4.position.y = lerp(1.2, 0.1, ease(clamp((t - 4.4) / 0.8))); SEED4.userData.sprout.forEach(s => s.scale.setScalar(Math.max(0.001, g)));
  tTeam.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTeam.visible = false; tPlant.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.4, 0.3, u), lerp(3.4, 3.0, u), lerp(2.6, 3.0, u), CX, lerp(1.0, 2.4, ease(clamp((t - 3.6) / 1.2))), -2.8, 64);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2010年公開の、アメリカ・イギリス映画。アカデミー賞4部門の、SFアクション
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#06060a');
  if (t > 4.4) STARS5.forEach((s, i) => s.userData.pop((t - 4.5 - i * 0.2) / 0.3));
  t2010.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2010.visible = false; tOscar.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.9, u), lerp(4.8, 3.8, u), TX, 3.2, -4.8, 62);
  return qs;
}
function shotLayers(t) { // 6段目 42〜49（決め手）：夢の中で、さらに夢を見る。深く、深く潜っていく。落ちる衝撃で、目を覚ます
  base(); S.aim(DX, -2.4); lift(0); S.hemi.intensity = 0.8; S.darken(0.45, '#04060c');
  LAYERS.forEach((L, i) => { L.rotation.y = Math.sin(t * 0.4 + i) * 0.08; });
  RAIN.forEach(d => { const k = (t * 1.6 + d.userData.o) % 1; d.position.set(d.userData.x, 2.2 - k * 2.1, d.userData.z); });
  SNOW.forEach(d => { const k = (t * 0.3 + d.userData.o) % 1; d.position.set(d.userData.x + Math.sin(t + d.userData.o * 9) * 0.1, 2.0 - k * 1.9, d.userData.z); });
  SLEEPERS6.forEach((g, i) => { g.userData.p.rotation.x = -Math.PI / 2; });
  const cy = lerp(7.4, 1.4, ease(clamp(t / 3.4)));
  // 3.6秒から：いちばん下の夢の端から人が落ちる → 光の輪 → 眠っていた人が起き上がる
  const f = clamp((t - 3.7) / 1.3);
  FALL6.visible = t > 3.6; FALL6.position.set(DX - 1.2, lerp(0.9, -2.2, f * f), -1.0); FALL6.rotation.z = f * 1.4; FALL6.userData.arms.forEach(a => a.rotation.x = -2.6);
  const w = clamp((t - 4.9) / 0.9); WAKE6.position.set(DX + 0.5, 0.9, -1.6); WAKE6.material.opacity = w > 0 ? 1 - w : 0; WAKE6.scale.setScalar(1 + w * 4);
  if (t > 5.0) SLEEPERS6.forEach(g => { g.userData.p.rotation.x = lerp(-Math.PI / 2, -0.4, ease(clamp((t - 5.0) / 0.4))); });
  if (t > 4.9 && t < 5.15) S.darken(0.0, '#fff0c0');
  tDeep.position.set(DX, cy + 1.4, -0.8); tKick.position.set(DX, cy + 1.4, -0.8);
  tDeep.userData.pop((t - 0.3) / 0.35); if (t > 3.4) tDeep.visible = false; tKick.userData.pop((t - 3.6) / 0.3);
  look(DX + 0.3, cy + 0.9, 4.0, DX, cy - 0.5, -2.4, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（眠る部屋に戻る）
  shotSleep(6.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.7, 0.5, d); S.darken(0.3 + 0.3 * d, '#05070c');
  const k = ease(t / 7);
  look(0, 2.4, lerp(4.2, 3.6, k), 0, 2.4, -2.4, 64);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotSleep(t, 0) },
  { a: 9, b: 17, f: shotHotel },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotTeam },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotLayers },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '眠っている人の夢に、<br>こっそり入りこむ。'],
  [5.6, 9.0, '夢の中の金庫から、<br>秘密を盗み出す。'],
  [9.2, 13.2, '主人公は、夢に入る<br>プロの産業スパイ。'],
  [13.2, 17.0, '疑いをかけられ、家に帰れない。<br>子どもたちに会いたい。'],
  [17.2, 21.0, '夢の中の街は、<br>思いどおりに設計できる。'],
  [21.0, 25.0, 'でも、よそ者に気づいた心が、<br>襲いかかってくる。'],
  [25.2, 29.0, '集めたのは、<br>それぞれの道のプロ。'],
  [29.0, 33.0, '依頼は、ある男の心に<br>アイデアを植え付けること。'],
  [33.2, 37.4, '2010年公開の、<br>アメリカ・イギリス映画。'],
  [37.4, 41.8, 'アカデミー賞4部門の、<br>SFアクション。'],
  [42.2, 45.4, '夢の中の、<br>さらに夢の中へ。'],
  [45.4, 49.0, '落ちる衝撃で、<br>目を覚ます。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>インセプション。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q085', v2: true, answer: 'インセプション',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 8585,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.8, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '眠って': 'ねむって', '入りこむ': 'はいりこむ', '金庫': 'きんこ', '秘密': 'ひみつ', '盗み出す': 'ぬすみだす', '主人公': 'しゅじんこう', '入る': 'はいる', '産業スパイ': 'さんぎょうスパイ', '疑い': 'うたがい', '帰れない': 'かえれない', '子どもたち': 'こどもたち', '会いたい': 'あいたい', '思いどおり': 'おもいどおり', '設計': 'せっけい', 'よそ者': 'よそもの', '気づいた': 'きづいた', '襲いかかって': 'おそいかかって', '集めた': 'あつめた', '依頼': 'いらい', '植え付ける': 'うえつける', '2010年': 'にせんじゅうねん', '公開': 'こうかい', '映画': 'えいが', 'アカデミー賞': 'アカデミーしょう', '4部門': 'よんぶもん', '見る': 'みる', '深く': 'ふかく', '潜って': 'もぐって', '落ちる': 'おちる', '衝撃': 'しょうげき', '目を覚ます': 'めをさます', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n眠っている人の夢に、こっそり入りこむ。夢の中の金庫から、秘密を盗み出す。主人公は、夢に入るプロの産業スパイ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'Hulu', '映画好き', 'SF映画'],
  },
});
applyQuizCards({ answer: 'インセプション', info: 'Prime Video・Hulu｜映画・148分', answerSize: 120 });
