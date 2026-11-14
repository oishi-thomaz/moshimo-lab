import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #086 カルテット（ドラマ・日本・TBS 火曜ドラマ・2017年1月17日〜3月21日・全10話。U-NEXT・Hulu・Prime Video・Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/karutetsuto-2017 で2026/11/14確認（Filmarks の動画配信欄も U-NEXT・Hulu・Netflix ほか）。
//   Filmarks 4.3・レビュー70,971件 filmarks.com/dramas/865/1994）
// 確かめた事実（公式 tbs.co.jp/quartet2017/intro/・/story/vol1.html、ja.wikipedia.org/wiki/カルテット_(2017年のテレビドラマ)。2026/11/14）：
//   ・ある日、4人は“偶然”出会った。その“偶然”には、大きな秘密が隠されていた（公式 はじめに・第1話）
//   ・4人は東京のカラオケボックスで出会った演奏者たち（公式 第1話）
//   ・主人公は第一ヴァイオリン。家庭があるため普段は都内で暮らし、週末だけ演奏のために通う（公式 はじめに）。夫が失踪している（Wikipedia 第1幕）
//   ・女ふたり、男ふたり、全員30代。夢が叶わなかった人たち。ひと冬の共同生活（公式 はじめに）。冬の別荘が舞台（公式・Wikipedia）
//   ・ライブレストランで演奏しようという話になる（公式 第1話）。レギュラー出演の場をつかむ（Wikipedia）
//   ・恋、涙、笑い、秘密、嘘が入り乱れる 大人のラブストーリー×ヒューマンサスペンス（公式 はじめに）。2017年 TBS 火曜ドラマ（Wikipedia）
//   ・弦楽四重奏（ヴァイオリン2・ヴィオラ・チェロ）を組む（公式 はじめに・Wikipedia）
// 構成（ヒント6段）：1 カラオケボックスで偶然出会った4人・その偶然には大きな秘密 → 2 主人公は週末だけ演奏しに通う主婦・夫がある日いなくなった
//   → 3 雪の別荘地でひと冬の共同生活・女ふたり男ふたり全員30代 → 4 夢が叶わなかった4人・ライブレストランで演奏の場をつかむ
//   → 5 2017年の日本の連続ドラマ・恋と笑いと嘘の大人のラブ・サスペンス → 6 決め手：弦楽器の4人（ヴァイオリン2・ヴィオラ・チェロ）・タイトルは4人組の演奏
// 秘密の中身・夫の行方・後半の出来事・結末は言わない。人物名・地名（軽井沢）・店名・グループ名は出さない。食卓の有名な場面（唐揚げ）や主題歌は使わない。
// 俳優の顔・ポスター・ロゴは使わない。人は汎用の3D

const S = quizStage({ bg: '#1e1a22', floor: '#26222a', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8686);

// 4人（女ふたり・男ふたり）。冬は上着
const MAKI = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#e9e4da', pants: '#5a4a5a', long: true, skirt: true };
const SUZU = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#c8a050', pants: '#3b3f4a', long: true };
const TSUKA = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#2f4a7a', pants: '#2b3346', tie: true };
const IE = { skin: '#e8b98f', hair: '#4a3426', shirt: '#7a4a6a', pants: '#3b3f4a' };
const FOUR = [MAKI, SUZU, TSUKA, IE];
const HUSB = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#59606e', pants: '#2b2f3a' };
const WOOD = '#8a4a20', WOOD2 = '#5a2e14';

// 楽器（形だけ。k=1 ヴァイオリン、1.15 ヴィオラ、2.6 チェロ）
function instrument(k = 1) { const g = new THREE.Group();
  const bd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), mat(WOOD)); bd.scale.set(1, 1.7, 0.35); bd.position.y = 0; g.add(bd);
  const up = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 12), mat(WOOD)); up.scale.set(1, 1.3, 0.35); up.position.y = 0.2; g.add(up);
  const nk = box(0.03, 0.26, 0.03, mat('#1a1410')); nk.position.y = 0.42; g.add(nk); const sc = box(0.04, 0.05, 0.05, mat(WOOD2)); sc.position.y = 0.57; g.add(sc);
  const br = box(0.06, 0.01, 0.05, mat('#e8d8b0')); br.position.set(0, -0.06, 0.04); g.add(br);
  g.scale.setScalar(k); return g; }
function bow(k = 1) { const b = box(0.012, 0.012, 0.6 * k, mat('#4a2a14')); const h = box(0.006, 0.006, 0.58 * k, mat('#f4f0e0')); h.position.y = -0.02; b.add(h); return b; }
function caseOf(k = 1) { const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.11 * k, 0.45 * k, 4, 10), mat('#5a3a2a')); c.scale.set(1, 1, 0.5); return c; }
function coat(p, col) { const c = box(0.56, 0.7, 0.32, mat(col)); c.position.y = 1.12; p.add(c); return c; }

// ---------- 1段目. カラオケボックス（x=0）。楽器ケースを持った4人。ミラーボールの光、頭の上に「？」 ----------
{ const fl = box(8, 0.04, 7, mat('#2a2032')); fl.position.set(0, 0.02, -1.5); qs.add(fl);
  const wl = box(8, 4, 0.2, mat('#3a2a4a')); wl.position.set(0, 2, -4.2); qs.add(wl);
  const tv = box(2.0, 1.2, 0.08, new THREE.MeshBasicMaterial({ map: canvasTex(200, 120, (g, w, h) => { const c = ['#e2483c', '#f2c14e', '#3f8f6b', '#4fa3d1', '#8e6bbf', '#e9e4da']; c.forEach((x, i) => { g.fillStyle = x; g.fillRect(i * w / 6, 0, w / 6 + 1, h); }); }) }));
  tv.position.set(0, 2.5, -4.08); qs.add(tv);
  const sofa = box(4.6, 0.45, 0.8, mat('#6a2a3a')); sofa.position.set(0, 0.23, -3.5); qs.add(sofa); const sb = box(4.6, 0.6, 0.2, mat('#5a2232')); sb.position.set(0, 0.7, -3.85); qs.add(sb);
  const tb = box(2.2, 0.4, 0.8, mat('#1a1418')); tb.position.set(0, 0.2, -2.3); qs.add(tb);
  const mic = new THREE.Group(); const mh = box(0.05, 0.22, 0.05, mat('#2a2a2e')); mic.add(mh); const mb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat('#9a9aa0')); mb.position.y = 0.13; mic.add(mb); mic.rotation.z = 1.4; mic.position.set(0.5, 0.45, -2.2); qs.add(mic);
  const bk = box(0.5, 0.04, 0.35, mat('#d8d0c4')); bk.position.set(-0.5, 0.42, -2.3); qs.add(bk); }
const BALL1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({ color: '#d8dce4', metalness: 0.9, roughness: 0.2, flatShading: true })); BALL1.position.set(0, 3.5, -2.4); qs.add(BALL1);
const DOTS1 = []; for (let i = 0; i < 18; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), new THREE.MeshBasicMaterial({ color: ['#ff7aa8', '#7ad8ff', '#f2c14e'][i % 3] })); d.userData = { a: R() * 6.28, y: 0.6 + R() * 2.8 }; qs.add(d); DOTS1.push(d); }
const P1 = FOUR.map((o, i) => { const p = makePerson(o); p.position.set(-1.5 + i * 1.0, 0, -2.9 + (i % 2) * 0.2); p.rotation.y = [0.35, 0.15, -0.15, -0.35][i]; qs.add(p); return p; });
const CASES1 = [1, 2.2, 1, 1.15].map((k, i) => { const c = caseOf(k); if (i === 1) { c.position.set(-0.5 + 0.35, 0.85, -2.7); } else { c.rotation.z = Math.PI / 2 - 0.2; c.position.set(-1.5 + i * 1.0 + 0.2, 1.0, -2.6 + (i % 2) * 0.2); } qs.add(c); return c; });
const Q1 = FOUR.map((_, i) => { const q = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.42 }); q.position.set(-1.5 + i * 1.0, 2.55, -2.9); qs.add(q); return q; });
const tMeet = tag('4人は、偶然出会った', { size: 56, w: 620, bg: '#14161c', sx: 2.0 }); tMeet.position.set(0, 3.0, -2.2); qs.add(tMeet);
const tSecret = tag('その偶然に、秘密', { size: 60, w: 560, bg: '#c8202c', sx: 1.9 }); tSecret.position.set(0, 3.0, -2.2); qs.add(tSecret);

// ---------- 2段目. 都会の家（x=40）。ヴァイオリンのケースを持って出かける妻。食卓から消える夫 ----------
const AX = 40;
{ const fl = box(9, 0.04, 7, mat('#8a7a68')); fl.position.set(AX, 0.02, -1.5); qs.add(fl);
  const wl = box(9, 4.5, 0.2, mat('#d8ccb8')); wl.position.set(AX, 2.25, -4.0); qs.add(wl);
  const win = box(1.6, 1.4, 0.05, new THREE.MeshBasicMaterial({ color: '#8ab0d8' })); win.position.set(AX + 2.4, 2.3, -3.88); qs.add(win);
  const tb = box(1.6, 0.06, 0.9, mat('#a8885a')); tb.position.set(AX - 0.6, 0.78, -2.6); qs.add(tb);
  for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) { const lg = box(0.06, 0.78, 0.06, mat('#6a4a30')); lg.position.set(AX - 0.6 + x, 0.39, -2.6 + z); qs.add(lg); }
  for (const s of [-1, 1]) { const ch = box(0.5, 0.06, 0.5, mat('#6a4a30')); ch.position.set(AX - 0.6 + s * 1.1, 0.48, -2.6); qs.add(ch); const cb = box(0.06, 0.6, 0.5, mat('#6a4a30')); cb.position.set(AX - 0.6 + s * 1.36, 0.8, -2.6); qs.add(cb); }
  for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 12), mat('#ffffff')); cup.position.set(AX - 0.6 + s * 0.45, 0.86, -2.6); qs.add(cup); }
  const door = box(1.0, 2.2, 0.06, mat('#6a4a30')); door.position.set(AX + 1.2, 1.1, -3.88); qs.add(door); }
const husb2 = makePerson(HUSB); husb2.position.set(AX - 1.55, -0.3, -2.6); husb2.rotation.y = Math.PI / 2; husb2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(husb2);
const HUSB_MATS = []; husb2.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; HUSB_MATS.push(o.material); } });
const maki2 = makePerson(MAKI); maki2.position.set(AX, 0, -1.6); qs.add(maki2);
const CASE2 = caseOf(1); CASE2.rotation.z = Math.PI / 2; CASE2.position.set(0.3, 0.75, 0.1); maki2.add(CASE2);
const tWeekend = tag('週末だけ、演奏しに通う', { size: 54, w: 660, bg: '#14161c', sx: 2.2 }); tWeekend.position.set(AX, 3.0, -2.0); qs.add(tWeekend);
const tGone = tag('夫が、いなくなった', { size: 60, w: 580, bg: '#4a5a8a', sx: 2.0 }); tGone.position.set(AX - 0.7, 2.75, -2.4); qs.add(tGone);

// ---------- 3段目. 雪の別荘地（x=80）。三角屋根の別荘へ、ケースを持った4人 ----------
const BX = 80;
{ const gr = box(30, 0.06, 24, mat('#e8eef4')); gr.position.set(BX, 0.03, -6); qs.add(gr);
  const house = new THREE.Group(); const hb = box(5, 2.8, 3.4, mat('#6a4a34')); hb.position.y = 1.4; house.add(hb);
  for (const s of [-1, 1]) { const rf = box(3.3, 0.16, 3.8, mat('#f4f6fa')); rf.position.set(s * 1.3, 3.35, 0); rf.rotation.z = -s * 0.65; house.add(rf); }
  const gb = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.6, 3), mat('#5a3a28')); gb.rotation.y = Math.PI / 2; gb.position.set(0, 3.5, 1.68); gb.scale.set(1, 1, 0.05); house.add(gb);
  for (const x of [-1.6, 1.6]) { const w = box(0.9, 0.9, 0.05, new THREE.MeshBasicMaterial({ color: '#ffd890' })); w.position.set(x, 1.6, 1.72); house.add(w); }
  const dr = box(0.9, 1.7, 0.05, mat('#3a2418')); dr.position.set(0, 0.85, 1.72); house.add(dr);
  const ch = box(0.5, 1.4, 0.5, mat('#7a6a5a')); ch.position.set(1.4, 4.0, -0.6); house.add(ch);
  house.position.set(BX, 0, -7); qs.add(house);
  for (let i = 0; i < 12; i++) { const tr = new THREE.Group(); const tk = box(0.18, 0.8, 0.18, mat('#4a3020')); tk.position.y = 0.4; tr.add(tk);
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 - k * 0.22, 1.0, 8), mat(k % 2 ? '#e8eef4' : '#2e5a3e')); c.position.y = 1.0 + k * 0.55; tr.add(c); }
    const s = i % 2 ? 1 : -1; tr.position.set(BX + s * (3.6 + (i % 3) * 1.6), 0, -3 - Math.floor(i / 2) * 2.2); tr.scale.setScalar(1.2 + (i % 3) * 0.3); qs.add(tr); } }
const SMOKE3 = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: '#d8dce4', transparent: true })); s.position.set(BX + 1.4, 5, -7.6); qs.add(s); SMOKE3.push(s); }
const SNOW3 = []; for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); d.userData = { x: BX + (R() - 0.5) * 10, z: -1 - R() * 8, o: R(), s: 0.3 + R() * 0.3 }; qs.add(d); SNOW3.push(d); }
const P3 = FOUR.map((o, i) => { const p = makePerson(o); coat(p, ['#c8b8a0', '#8a3a2a', '#2a3a5a', '#4a4a3a'][i]); p.rotation.y = Math.PI; const c = caseOf(i === 1 ? 2.2 : 1); c.position.set(0.32, i === 1 ? 0.9 : 0.7, 0); if (i !== 1) c.rotation.z = 0.1; p.add(c); p.position.set(BX - 1.2 + i * 0.8, 0, -1.2); qs.add(p); return p; });
const tSnow = tag('雪の別荘で、共同生活', { size: 56, w: 640, bg: '#14161c', sx: 2.1 }); tSnow.position.set(BX, 2.9, -1.2); qs.add(tSnow);
const t30 = tag('女ふたり、男ふたり', { size: 58, w: 600, bg: '#4a7ab0', sx: 2.0 }); t30.position.set(BX, 2.9, -1.8); qs.add(t30);

// ---------- 4段目. 夜のライブレストラン（x=120）。うつむく4人 → 小さな舞台へ ----------
const CX = 120;
{ const fl = box(12, 0.04, 10, mat('#4a3426')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#5a3a2a')); wl.position.set(CX, 2.5, -6); qs.add(wl);
  const stg = box(4.4, 0.3, 2.2, mat('#3a2418')); stg.position.set(CX, 0.15, -4.6); qs.add(stg);
  const pn = box(1.4, 0.9, 0.6, mat('#14141a')); pn.position.set(CX + 1.5, 0.75, -5.2); qs.add(pn);
  for (let i = 0; i < 6; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lp.position.set(CX - 4 + i * 1.6, 3.8, -5.8); qs.add(lp); }
  for (const [x, z] of [[-2.8, -1.2], [2.8, -1.4]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 20), mat('#e8dcc8')); t.position.set(CX + x, 0.75, z); qs.add(t); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' })); c.position.set(CX + x, 0.84, z); qs.add(c); } }
const TABLE4 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 24), mat('#e8dcc8')); TABLE4.position.set(CX, 0.75, -1.6); qs.add(TABLE4);
const P4 = FOUR.map((o, i) => { const p = makePerson(o); p.position.set(CX, 0, -1.6); qs.add(p); return p; });
const SPOT4 = new THREE.SpotLight(0xfff0d0, 0, 12, 0.45, 0.5, 1); SPOT4.position.set(CX, 6, -2.5); SPOT4.target.position.set(CX, 0.3, -4.6); qs.add(SPOT4); qs.add(SPOT4.target);
const tDream = tag('夢が叶わなかった4人', { size: 56, w: 620, bg: '#14161c', sx: 2.1 }); tDream.position.set(CX, 2.6, -1.8); qs.add(tDream);
const tStage = tag('演奏できる場所を', { size: 60, w: 560, bg: '#c8902c', sx: 2.0 }); tStage.position.set(CX, 2.9, -3.4); qs.add(tStage);

// ---------- 5段目. 夜の部屋のテレビ（x=180）。2017年の日本の連続ドラマ ----------
const TX = 180;
{ const fl = box(10, 0.04, 10, mat('#3a3028')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(10, 6, 0.2, mat('#4a4038')); wl.position.set(TX, 3, -4); qs.add(wl);
  const rack = box(3.4, 0.6, 0.6, mat('#2a2018')); rack.position.set(TX, 0.3, -3.5); qs.add(rack);
  const sofa = box(3.0, 0.5, 0.9, mat('#5a6a7a')); sofa.position.set(TX, 0.25, 1.6); qs.add(sofa); }
const TV5 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2a48'); gr.addColorStop(1, '#c87a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f4f0e8'; g.fillRect(0, h - 70, w, 70);
  [[150, 1], [270, 1], [390, 1.15], [500, 2.2]].forEach(([x, k], i) => { g.fillStyle = '#1a1420'; g.beginPath(); g.arc(x, 150, 24, 0, 7); g.fill(); g.fillRect(x - 24, 176, 48, 110); if (i < 2) { g.save(); g.translate(x + 24, 170); g.rotate(-0.5); g.fillRect(0, -8, 60, 18); g.restore(); } else { g.fillRect(x + 18, 210 - k * 20, 26, 60 + k * 30); } });
  g.fillStyle = '#ff7aa8'; g.font = '900 60px sans-serif'; g.fillText('♥', 40, 90); g.fillStyle = '#f2c14e'; g.fillText('？', 560, 90); }) }));
TV5.position.set(TX, 1.6, -3.5); qs.add(TV5);
{ const fr = box(3.36, 1.96, 0.08, mat('#121216')); fr.position.set(TX, 1.6, -3.56); qs.add(fr); }
const t2017 = tag('2017年 日本の連続ドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2017.position.set(TX, 3.3, -3.2); qs.add(t2017);
const tLove = tag('大人のラブ・サスペンス', { size: 56, w: 680, bg: '#c94f7c', sx: 2.4 }); tLove.position.set(TX, 3.3, -3.2); qs.add(tLove);

// ---------- 6段目. 舞台の上の4人（x=220）。ヴァイオリン2・ヴィオラ・チェロ。弓が動く ----------
const DX = 220;
{ const fl = box(12, 0.04, 10, mat('#2a1e18')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const stg = box(6, 0.3, 3.4, mat('#4a2a1a')); stg.position.set(DX, 0.15, -2.6); qs.add(stg);
  const back = box(8, 5, 0.2, mat('#1a1014')); back.position.set(DX, 2.5, -4.6); qs.add(back);
  for (let i = 0; i < 4; i++) { const ch = box(0.5, 0.06, 0.5, mat('#2a1a12')); ch.position.set(DX - 1.8 + i * 1.2, 0.78, -2.8 + Math.abs(i - 1.5) * 0.3); qs.add(ch); } }
const P6 = FOUR.map((o, i) => { const p = makePerson(o); p.position.set(DX - 1.8 + i * 1.2, -0.0, -2.75 + Math.abs(i - 1.5) * 0.3); p.rotation.y = [0.35, 0.12, -0.12, -0.35][i]; p.userData.legs.forEach(l => l.rotation.x = -1.45); p.position.y = -0.0 + 0.3 - 0.32 + 0.3; qs.add(p); return p; });
// 席順：左から 第1ヴァイオリン・チェロ・第2ヴァイオリン・ヴィオラ（チェロは膝の間に立てる）
const KIND6 = [1, 2.6, 1, 1.15];
const INST6 = KIND6.map((k, i) => { const ins = instrument(k); const p = P6[i];
  if (k > 2) { ins.position.set(0, 0.62, 0.34); ins.rotation.x = -0.2; } else { ins.position.set(-0.18, 1.42, 0.14); ins.rotation.set(-0.5, 0, 1.15); }
  p.add(ins); const b = bow(k > 2 ? 1.2 : 1); p.add(b); p.userData.bow = b; p.userData.k = k; return ins; });
const BEAM6 = new THREE.SpotLight(0xfff0d0, 0, 14, 0.5, 0.5, 1); BEAM6.position.set(DX, 7, 1); BEAM6.target.position.set(DX, 0.3, -2.6); qs.add(BEAM6); qs.add(BEAM6.target);
const NOTES6 = []; for (let i = 0; i < 6; i++) { const n = tag('♪', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#f2c14e', sx: 0.36 }); qs.add(n); NOTES6.push(n); }
const tStrings = tag('弦楽器を弾く、4人', { size: 58, w: 600, bg: '#14161c', sx: 2.1 }); tStrings.position.set(DX, 3.1, -2.2); qs.add(tStrings);
const tFour = tag('4人組の、演奏', { size: 64, w: 500, bg: '#8a4a20', sx: 1.9 }); tFour.position.set(DX, 3.1, -2.2); qs.add(tFour);

// ---------- shots ----------
const ALL = [tMeet, tSecret, tWeekend, tGone, tSnow, t30, tDream, tStage, t2017, tLove, tStrings, tFour];
function base() { S.reset(); ALL.forEach(x => x.visible = false); Q1.forEach(q => q.visible = false); NOTES6.forEach(n => n.visible = false); SPOT4.intensity = 0; BEAM6.intensity = 0; }

function shotKaraoke(t, quiz = 0) { // 1段目 0〜9：カラオケボックスで、4人は偶然出会った。その偶然には、大きな秘密があった（0秒目がサムネ）
  base(); S.aim(0, -2.5); lift(0); S.hemi.intensity = 0.6; S.darken(0.4, '#0a0610');
  BALL1.rotation.y = t * 0.8;
  DOTS1.forEach((d, i) => { const a = d.userData.a + t * 0.5; d.position.set(Math.sin(a) * 3.4, d.userData.y, -2.4 + Math.cos(a) * 1.6 - 1.6); d.lookAt(0, d.userData.y, -1); d.visible = d.position.z < -2.8; });
  P1.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.8 + i * 1.7) * 0.5; p.userData.arms[1].rotation.x = -0.4; });
  const sec = quiz ? 1 : clamp((t - 4.2) / 0.4);
  Q1.forEach((q, i) => q.userData.pop(quiz ? 1 : (t - 4.4 - i * 0.2) / 0.3));
  if (sec > 0) S.darken(0.4 + 0.25 * sec, '#200610');
  if (!quiz) { tMeet.userData.pop((t - 0.6) / 0.35); if (t > 4.1) tMeet.visible = false; tSecret.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, -0.2, u), lerp(2.0, 2.2, u), lerp(2.6, 2.2, u), 0, 1.7, -2.8, 66);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：主人公は、週末だけ演奏しに通う主婦。夫が、ある日突然いなくなった
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.95; S.darken(0.15, '#100c0a');
  const k = clamp(t / 3.6);
  maki2.position.set(AX + lerp(-0.1, 1.1, k), 0, lerp(-1.6, -3.3, k)); maki2.rotation.y = lerp(2.4, Math.PI, ease(clamp(t / 0.6))); poseWalk(maki2, t * 6, k < 1 ? 0.8 : 0);
  maki2.visible = t < 3.8;
  const fade = clamp((t - 4.4) / 2.2); HUSB_MATS.forEach(m => m.opacity = 1 - fade); husb2.visible = fade < 1;
  husb2.userData.head.rotation.x = 0.2;
  tWeekend.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWeekend.visible = false; tGone.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4) look(lerp(AX + 0.2, AX + 0.4, u), 2.2, 2.8, AX + 0.4, 1.3, -2.6, 62);
  else look(AX - 0.6, 2.1, lerp(2.4, 1.9, ease((t - 4) / 4)), AX - 0.8, 1.3, -2.6, 62);
  return qs;
}
function shotSnow(t) { // 3段目 17〜25：雪の別荘地で、ひと冬の共同生活。女ふたり、男ふたり、全員30代
  base(); S.aim(BX, -5); lift(0); S.hemi.intensity = 1.0; S.darken(0.45, '#2a3448');
  SNOW3.forEach(d => { const k = (t * d.userData.s + d.userData.o) % 1; d.position.set(d.userData.x + Math.sin(t + d.userData.o * 9) * 0.2, 4.5 - k * 4.5, d.userData.z); });
  SMOKE3.forEach((s, i) => { const k = (t * 0.25 + i / 6) % 1; s.position.set(BX + 1.4 + k * 0.6, 4.9 + k * 1.6, -7.6); s.scale.setScalar(0.6 + k); s.material.opacity = 0.7 * (1 - k); });
  P3.forEach((p, i) => { const k = clamp(t / 7.5); p.position.set(BX - 1.2 + i * 0.8, 0, lerp(-1.2, -4.6, k) - (i % 2) * 0.3); poseWalk(p, t * 6 + i, 0.8); if (t > 4.2) { p.rotation.y = Math.PI + [0.5, 0.2, -0.2, -0.5][i]; } });
  if (t > 4.2) P3.forEach((p, i) => { p.rotation.y = lerp(Math.PI, 0, ease(clamp((t - 4.2) / 0.5))); poseWalk(p, 0, 0); p.position.z = lerp(-1.2, -4.6, clamp(4.2 / 7.5)) - (i % 2) * 0.3; });
  tSnow.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSnow.visible = false; t30.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, -0.2, u), lerp(2.4, 2.1, u), lerp(3.4, 2.4, u), BX, 1.9, -6.0, 62);
  return qs;
}
function shotLive(t) { // 4段目 25〜33：4人とも、夢が叶わなかった人たち。ライブレストランで、演奏する場所をつかむ
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.4, '#0c0806');
  const up = t > 4.0; const k = ease(clamp((t - 4.0) / 2.4));
  P4.forEach((p, i) => { const a = i * Math.PI / 2 + Math.PI / 4;
    if (!up) { p.position.set(CX + Math.sin(a) * 0.95, -0.3, -1.6 + Math.cos(a) * 0.95); p.rotation.y = a + Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.45); p.userData.head.rotation.x = 0.45; }
    else { const x0 = CX + Math.sin(a) * 0.95, z0 = -1.6 + Math.cos(a) * 0.95, x1 = CX - 1.5 + i * 1.0, z1 = -4.4;
      p.position.set(lerp(x0, x1, k), k > 0.85 ? 0.3 : 0, lerp(z0, z1, k)); p.userData.legs.forEach(l => l.rotation.x = 0); p.userData.head.rotation.x = 0;
      p.rotation.y = k < 1 ? Math.atan2(x1 - x0, z1 - z0) : 0; poseWalk(p, t * 6 + i, k < 1 ? 0.8 : 0); } });
  SPOT4.intensity = up ? lerp(0, 45, ease(clamp((t - 5.6) / 0.8))) : 0;
  tDream.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDream.visible = false; tStage.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (!up) look(CX + 0.3, lerp(3.8, 3.6, u), lerp(2.8, 2.5, u), CX, 0.9, -1.8, 62);
  else look(CX + 0.2, 2.6, lerp(2.4, 2.0, u), CX, 1.3, -4.0, 62);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2017年に放送された、日本の連続ドラマ。恋と笑いと嘘が入り乱れる、大人のラブ・サスペンス
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t2017.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2017.visible = false; tLove.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(1.6, 1.8, u), lerp(3.4, 2.8, u), TX, 1.3, -3.5, 62);
  return qs;
}
function shotQuartet(t) { // 6段目 42〜49（決め手）：弦楽器を弾く4人。ヴァイオリン2本に、ヴィオラとチェロ。タイトルは、4人組の演奏のこと
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  BEAM6.intensity = 45;
  P6.forEach((p, i) => { const k = p.userData.k; const b = p.userData.bow; const s = Math.sin(t * 3.2 + i * 0.8);
    if (k > 2) { b.position.set(0.18 + s * 0.15, 0.62, 0.42); b.rotation.set(0, 1.4, 0); p.userData.arms[0].rotation.x = -0.7; p.userData.arms[0].rotation.z = 0.3; p.userData.arms[1].rotation.x = -0.9; p.userData.arms[1].rotation.z = -0.5; }
    else { b.position.set(-0.05 + s * 0.12, 1.32, 0.3); b.rotation.set(0.2, 1.2, 0.3); p.userData.arms[0].rotation.x = -1.4; p.userData.arms[0].rotation.z = -0.3 + s * 0.15; p.userData.arms[1].rotation.x = -1.7; p.userData.arms[1].rotation.z = -0.6; p.userData.head.rotation.z = 0.25; }
    p.position.y = 0; });
  NOTES6.forEach((n, i) => { n.visible = true; n.userData.pop(1); const k = (t * 0.3 + i / 6) % 1; n.position.set(DX - 2 + i * 0.8, 1.9 + k * 1.6, -2.4); });
  tStrings.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tStrings.visible = false; tFour.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.2, 0.2, u), lerp(2.4, 2.5, u), lerp(4.6, 4.1, u), DX, 1.4, -2.6, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（雪の別荘に戻る）
  shotSnow(3.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.0, 0.7, d); S.darken(0.45 + 0.2 * d, '#1a2030');
  const k = ease(t / 7);
  look(BX, 2.2, lerp(2.4, 1.6, k), BX, 1.8, -6.0, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotKaraoke(t, 0) },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotSnow },
  { a: 25, b: 33, f: shotLive },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotQuartet },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'カラオケボックスで、<br>4人は偶然出会った。'],
  [5.6, 9.0, 'その偶然には、<br>大きな秘密があった。'],
  [9.2, 13.2, '主人公は、週末だけ<br>演奏しに通う主婦。'],
  [13.2, 17.0, '夫が、ある日<br>突然いなくなった。'],
  [17.2, 21.0, '雪の別荘地で、<br>ひと冬の共同生活。'],
  [21.0, 25.0, '女ふたり、男ふたり、<br>全員30代。'],
  [25.2, 29.0, '4人とも、夢が<br>叶わなかった人たち。'],
  [29.0, 33.0, 'ライブレストランで、<br>演奏する場所をつかむ。'],
  [33.2, 37.4, '2017年に放送された、<br>日本の連続ドラマ。'],
  [37.4, 41.8, '恋と笑いと嘘が入り乱れる、<br>大人のラブ・サスペンス。'],
  [42.2, 45.4, 'ヴァイオリン2本に、<br>ヴィオラとチェロ。'],
  [45.4, 49.0, 'タイトルは、<br>4人組の演奏のこと。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>カルテット。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q086', v2: true, answer: 'カルテット',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 8686,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '4人組': 'よにんぐみ', '4人': 'よにん', '偶然': 'ぐうぜん', '出会った': 'であった', '大きな': 'おおきな', '秘密': 'ひみつ', '主人公': 'しゅじんこう', '週末': 'しゅうまつ', '演奏': 'えんそう', '通う': 'かよう', '主婦': 'しゅふ', '夫': 'おっと', '突然': 'とつぜん', '雪': 'ゆき', '別荘地': 'べっそうち', 'ひと冬': 'ひとふゆ', '共同生活': 'きょうどうせいかつ', '女ふたり': 'おんなふたり', '男ふたり': 'おとこふたり', '全員30代': 'ぜんいんさんじゅうだい', '夢': 'ゆめ', '叶わなかった': 'かなわなかった', '人たち': 'ひとたち', '場所': 'ばしょ', '2017年': 'にせんじゅうななねん', '放送': 'ほうそう', '日本': 'にほん', '連続': 'れんぞく', '恋': 'こい', '笑い': 'わらい', '嘘': 'うそ', '入り乱れる': 'いりみだれる', '大人': 'おとな', '弦楽器': 'げんがっき', '弾く': 'ひく', '2本': 'にほん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nカラオケボックスで、4人は偶然出会った。その偶然には、大きな秘密があった。主人公は、週末だけ演奏しに通う主婦。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'UNEXT', 'Hulu', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'カルテット', info: 'U-NEXT・Hulu｜日本のドラマ・全10話', answerSize: 128 });
