import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #083 グレイテスト・ショーマン（映画・アメリカ・2017年（日本公開2018年）・105分。Disney+・Prime Video で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/gureitesutoshiyoman で2026/11/13確認（Filmarks の動画配信欄も Prime Video・ディズニープラス 見放題）。
//   Filmarks 4.1・レビュー381,760件 filmarks.com/movies/60905）
// 確かめた事実（Filmarks の作品紹介、ja.wikipedia.org/wiki/グレイテスト・ショーマン。2026/11/13）：
//   ・主人公は小さいころから貧しくも夢想家。良家の令嬢と結婚し、娘たちも生まれる（Wikipedia）
//   ・勤めていた貿易会社が倒産して解雇される。銀行から資金を借り、珍しいものを展示した博物館を開くが、客足はかんばしくない（Wikipedia）
//   ・世間から隠れるようにして生きていた様々な人を集めて、ショーを始める。ショーは大盛況（Wikipedia）
//   ・一家は裕福になったが、上流社会からは成り上がりの扱いしかされなかった（Wikipedia）
//   ・19世紀に活躍した実在の興行師の成功を描く、2017年のアメリカのミュージカル映画（Wikipedia）。日本公開2018年2月16日、105分（Filmarks）
//   ・主人公は＜ショービジネス＞の概念を生み出した実在の人物（Filmarks）
// 構成（ヒント6段）：1 会社がつぶれて仕事を失った男、借りたお金で小さな博物館 → 2 主人公は貧しく育った夢見る男、妻と娘たち
//   → 3 19世紀の大都会、上流の人々は成り上がりを見下す → 4 世間から隠れて生きてきた人たちを集めて、いっしょに舞台へ
//   → 5 2017年のアメリカ映画（日本公開2018年）・105分のミュージカル → 6 決め手：実在の人物、ショービジネスを生み出した男、タイトルは最高のショーマン
// 後半の挫折・結末は言わない。人物名・地名は出さない。歌・歌詞・音楽は使わない。
// 俳優の顔・ポスター・ロゴ・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#1e1a24', floor: '#2a2420', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8383);

const HERO = { skin: '#f1c9a5', hair: '#3a2a22', shirt: '#4a4a58', pants: '#2b2f3a', tie: true };
const HERO_SHOW = { skin: '#f1c9a5', hair: '#3a2a22', shirt: '#c8202c', pants: '#f4f0e8' };
const WIFE = { skin: '#f4d3b5', hair: '#c8a070', shirt: '#8ab0d8', pants: '#8ab0d8', long: true, skirt: true };
const KID = (i) => ({ skin: '#f4d3b5', hair: ['#c8a070', '#6b4a33'][i], shirt: ['#f2c14e', '#e88aa0'][i], pants: ['#f2c14e', '#e88aa0'][i], long: true, skirt: true, scale: 0.6 });
const RICH = (i) => ({ skin: ['#f4d3b5', '#f1c9a5'][i % 2], hair: ['#9a9a9a', '#4a3426', '#c8a070'][i % 3], shirt: ['#2a2a34', '#5a2a4a', '#2a3a5a'][i % 3], pants: '#1e1e24', long: i % 2 === 1, skirt: i % 2 === 1 });
const TROUPE = [
  { skin: '#e8b98f', hair: '#2c2421', shirt: '#3f8f6b', pants: '#2b3346', scale: 1.45 },
  { skin: '#f1c9a5', hair: '#6b4a33', shirt: '#8e6bbf', pants: '#3b3f4a', scale: 0.62 },
  { skin: '#d9a57c', hair: '#1d1a19', shirt: '#e6b450', pants: '#5a4a3a', long: true, skirt: true },
  { skin: '#c88a6a', hair: '#1d1a19', shirt: '#d97a3a', pants: '#2b3346', long: true, skirt: true },
  { skin: '#f4d3b5', hair: '#9a2a2a', shirt: '#3a7ad8', pants: '#2b2f3a' },
];

function topHat(p, color = '#14141a') { const g = new THREE.Group(); const br = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 20), mat(color)); g.add(br); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 20), mat(color)); c.position.y = 0.18; g.add(c); g.position.y = 0.55; p.userData.head.add(g); return g; }
function beard(p) { const b = box(0.36, 0.2, 0.08, mat('#3a2418')); b.position.set(0, 0.08, 0.2); p.userData.head.add(b); }
function stripes(g, w, h, a = '#c8202c', b = '#f4f0e8', n = 12) { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * w / n, 0, w / n + 1, h); } }

// ---------- 1段目. つぶれた会社の前（x=0）。箱を抱えて出てくる男、閉まる扉 ----------
{ const gr = box(16, 0.04, 12, mat('#5a5048')); gr.position.set(0, 0.02, -2); qs.add(gr);
  const bld = box(8, 5, 2, mat('#7a6a5a')); bld.position.set(0, 2.5, -5); qs.add(bld);
  const door = box(1.4, 2.4, 0.08, mat('#3a2a20')); door.position.set(0, 1.2, -3.96); qs.add(door);
  for (const x of [-2.6, 2.6]) { const w = box(1.4, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#2a2a30' })); w.position.set(x, 2.6, -3.97); qs.add(w); }
  const sh = box(0.06, 0.06, 0.06, mat('#000')); sh.position.set(0, 0, 0); }
const BOARD1 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(200, 140, (g, w, h) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a1f2c'; g.lineWidth = 14; g.beginPath(); g.moveTo(30, 20); g.lineTo(170, 120); g.moveTo(170, 20); g.lineTo(30, 120); g.stroke(); }) }));
BOARD1.position.set(0, 1.6, -3.9); qs.add(BOARD1);
const man1 = makePerson(HERO); man1.position.set(0, 0, -3.2); qs.add(man1);
const BOX1 = box(0.6, 0.4, 0.4, mat('#c89a5a')); qs.add(BOX1);
const WORKERS = []; for (let i = 0; i < 3; i++) { const p = makePerson(RICH(i)); p.position.set([-2.7, -1.7, 2.7][i], 0, -2.8); qs.add(p); WORKERS.push(p); }
const MUSEUM = new THREE.Group(); { const b = box(2.4, 2.2, 1.4, mat('#a8885a')); b.position.y = 1.1; MUSEUM.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.9, 4), mat('#6a3a2a')); r.rotation.y = Math.PI / 4; r.position.y = 2.65; MUSEUM.add(r);
  const d = box(0.7, 1.2, 0.05, mat('#3a2a20')); d.position.set(0, 0.6, 0.72); MUSEUM.add(d);
  for (let i = 0; i < 3; i++) { const q = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(['#e6b450', '#3f8f6b', '#c8202c'][i])); q.position.set(-0.8 + i * 0.8, 1.7, 0.72); MUSEUM.add(q); } }
MUSEUM.position.set(3.4, 0, -3.0); qs.add(MUSEUM);
const tJob = tag('仕事を失った男', { size: 62, w: 500, bg: '#14161c', sx: 1.9 }); tJob.position.set(0, 3.0, -2.6); qs.add(tJob);
const tMuseum = tag('借金で、小さな博物館', { size: 56, w: 620, bg: '#b8861c', sx: 2.2 }); tMuseum.position.set(1.1, 3.0, -2.6); qs.add(tMuseum);

// ---------- 2段目. 小さな家（x=40）。妻と娘たちに夢を語る男 ----------
const AX = 40;
{ const fl = box(10, 0.04, 8, mat('#8a6a48')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#c8b8a0')); wl.position.set(AX, 2, -3.5); qs.add(wl);
  const win = box(1.4, 1.4, 0.05, new THREE.MeshBasicMaterial({ color: '#2a3a6a' })); win.position.set(AX + 2.4, 2.2, -3.38); qs.add(win);
  for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff4c0' })); st.position.set(AX + 1.9 + (i % 3) * 0.4, 1.8 + Math.floor(i / 3) * 0.6 + (i % 2) * 0.15, -3.34); qs.add(st); }
  const tb = box(1.6, 0.06, 0.9, mat('#6a4a30')); tb.position.set(AX - 1.6, 0.75, -2.4); qs.add(tb);
  const lmp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lmp.position.set(AX - 1.6, 0.95, -2.4); qs.add(lmp); }
const man2 = makePerson(HERO); man2.position.set(AX + 0.6, 0, -1.6); man2.rotation.y = -0.3; qs.add(man2);
const wife2 = makePerson(WIFE); wife2.position.set(AX - 0.6, 0, -1.8); wife2.rotation.y = 0.5; qs.add(wife2);
const KIDS2 = [0, 1].map(i => { const p = makePerson(KID(i)); p.position.set(AX - 0.1 + i * 0.45, 0, -1.0); p.rotation.y = Math.PI + (i ? 0.4 : -0.2); qs.add(p); return p; });
const SPARK2 = []; for (let i = 0; i < 8; i++) { const s = tag('★', { size: 80, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#f2c14e', sx: 0.3 }); qs.add(s); SPARK2.push(s); }
const tDream = tag('貧しく育った夢見る男', { size: 56, w: 640, bg: '#14161c', sx: 2.2 }); tDream.position.set(AX, 2.9, -1.8); qs.add(tDream);
const tFamily = tag('家族を、幸せにしたい', { size: 58, w: 620, bg: '#3a7ad8', sx: 2.1 }); tFamily.position.set(AX, 2.9, -1.8); qs.add(tFamily);

// ---------- 3段目. 19世紀の大都会（x=80）。石畳と馬車、見下ろす上流の人々 ----------
const BX = 80;
const LAMPS = [];
{ const gr = box(30, 0.04, 20, mat('#6a6058')); gr.position.set(BX, 0.02, -4); qs.add(gr);
  for (let i = 0; i < 6; i++) { const h = 5 + (i % 3) * 1.5; const b = box(3.2, h, 3, mat(['#8a5a48', '#7a6a5a', '#9a7a5a'][i % 3])); b.position.set(BX - 8 + i * 3.3, h / 2, -9); qs.add(b);
    for (let k = 0; k < 6; k++) { const w = box(0.5, 0.8, 0.05, new THREE.MeshBasicMaterial({ color: (i + k) % 3 ? '#f4d890' : '#3a3030' })); w.position.set(BX - 8 + i * 3.3 + ((k % 3) - 1) * 0.9, 1.6 + Math.floor(k / 3) * 1.8, -7.47); qs.add(w); } }
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3, 8), mat('#2a2a2a')); p.position.set(BX - 5 + i * 3.4, 1.5, -5.6); qs.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); l.position.set(BX - 5 + i * 3.4, 3.1, -5.6); qs.add(l); LAMPS.push(l); } }
const CARRIAGE = new THREE.Group(); { const b = box(1.6, 1.0, 1.0, mat('#2a1e18')); b.position.y = 1.0; CARRIAGE.add(b); const rf = box(1.7, 0.08, 1.1, mat('#c8a050')); rf.position.y = 1.54; CARRIAGE.add(rf);
  for (const x of [-0.6, 0.6]) for (const z of [-0.52, 0.52]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 6, 16), mat('#c8a050')); w.position.set(x, 0.36, z); CARRIAGE.add(w); }
  const horse = new THREE.Group(); const hb = box(1.2, 0.6, 0.45, mat('#6a4a30')); hb.position.y = 1.1; horse.add(hb); const hn = box(0.3, 0.7, 0.3, mat('#6a4a30')); hn.position.set(0.65, 1.45, 0); hn.rotation.z = -0.4; horse.add(hn);
  for (const x of [-0.45, 0.45]) for (const z of [-0.15, 0.15]) { const lg = box(0.12, 0.8, 0.12, mat('#4a3020')); lg.position.set(x, 0.4, z); horse.add(lg); } horse.position.x = 1.8; CARRIAGE.add(horse); }
CARRIAGE.position.set(BX - 6, 0, -3.8); qs.add(CARRIAGE);
const UPPER = []; for (let i = 0; i < 4; i++) { const p = makePerson(RICH(i)); if (i % 2 === 0) topHat(p); p.position.set(BX + 0.6 + i * 0.75, 0, -2.2 - (i % 2) * 0.4); p.rotation.y = -0.9; qs.add(p); UPPER.push(p); }
const man3 = makePerson(HERO); topHat(man3, '#3a2a22'); man3.position.set(BX - 1.6, 0, -1.8); man3.rotation.y = 0.8; qs.add(man3);
const tCentury = tag('19世紀の大都会', { size: 62, w: 500, bg: '#14161c', sx: 1.9 }); tCentury.position.set(BX - 0.2, 3.5, -2.4); qs.add(tCentury);
const tLook = tag('見下す上流の人々', { size: 60, w: 560, bg: '#5a2a4a', sx: 2.0 }); tLook.position.set(BX - 0.2, 3.5, -2.4); qs.add(tLook);

// ---------- 4段目. 幕の裏（x=120）。世間から隠れていた仲間たち、光の舞台へ ----------
const CX = 120;
{ const fl = box(12, 0.04, 10, mat('#4a3a30')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const stg = box(8, 0.3, 4, mat('#6a4a30')); stg.position.set(CX, 0.15, -1.4); qs.add(stg);
  for (const s of [-1, 1]) { const cur = box(2.4, 5, 0.2, mat('#8a1420')); cur.position.set(CX + s * 3.0, 2.5, -3.4); qs.add(cur); }
  const back = box(8, 5, 0.2, mat('#1a1418')); back.position.set(CX, 2.5, -3.6); qs.add(back); }
const TR4 = TROUPE.map((o, i) => { const p = makePerson(o); p.position.set(CX - 2.0 + i * 1.0, 0.3, -3.0); qs.add(p); return p; });
beard(TR4[2]);
const SPOT4 = new THREE.SpotLight(0xfff0d0, 0, 12, 0.5, 0.5, 1); SPOT4.position.set(CX, 6, 1); SPOT4.target.position.set(CX, 0.3, -1.4); qs.add(SPOT4); qs.add(SPOT4.target);
const tHidden = tag('隠れて生きてきた人たち', { size: 54, w: 680, bg: '#14161c', sx: 2.3 }); tHidden.position.set(CX, 3.6, -1.6); qs.add(tHidden);
const tStage = tag('いっしょに、舞台へ', { size: 60, w: 560, bg: '#c8202c', sx: 2.0 }); tStage.position.set(CX, 3.6, -1.6); qs.add(tStage);

// ---------- 5段目. 映画館のスクリーン（x=180）。2017年のアメリカのミュージカル映画 ----------
const TX = 180;
{ const fl = box(12, 0.04, 12, mat('#2a1418')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 7, 0.2, mat('#1a0e12')); wl.position.set(TX, 3.5, -5); qs.add(wl);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const st = box(0.7, 0.6, 0.6, mat('#8a1420')); st.position.set(TX - 2.1 + i * 0.85, 0.3 + r * 0.2, 1.2 + r * 1.1); qs.add(st); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(600, 320, (g, w, h) => { g.fillStyle = '#1a1424'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(255,${200 + i * 5},120,0.25)`; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(i * 75 - 20, h); g.lineTo(i * 75 + 30, h); g.fill(); }
  for (let i = 0; i < 7; i++) { g.fillStyle = '#0a0810'; const x = 80 + i * 75; g.beginPath(); g.arc(x, 210, 16, 0, 7); g.fill(); g.fillRect(x - 14, 226, 28, 60); g.fillRect(x - 30 - (i % 2) * 10, 232 - (i % 3) * 18, 16, 6); g.fillRect(x + 14, 232 - ((i + 1) % 3) * 18, 16 + (i % 2) * 10, 6); } }) }));
SCREEN5.position.set(TX, 3.0, -4.88); qs.add(SCREEN5);
const NOTES5 = []; for (let i = 0; i < 6; i++) { const n = tag('♪', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#f2c14e', sx: 0.42 }); qs.add(n); NOTES5.push(n); }
const t2017 = tag('2017年 アメリカ映画', { size: 58, w: 640, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2017.position.set(TX, 5.2, -4.0); qs.add(t2017);
const tMusical = tag('105分のミュージカル', { size: 58, w: 620, bg: '#c8202c', sx: 2.4 }); tMusical.position.set(TX, 5.2, -4.0); qs.add(tMusical);

// ---------- 6段目. 紅白のテントの中（x=220）。真ん中に立つ興行師と、照らされる仲間 ----------
const DX = 220;
{ const fl = box(16, 0.04, 16, mat('#3a2a20')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.12, 40), mat('#c8a050')); ring.position.set(DX, 0.06, -2.4); qs.add(ring);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.14, 40), mat('#8a1420')); inner.position.set(DX, 0.07, -2.4); qs.add(inner);
  const tent = new THREE.Mesh(new THREE.ConeGeometry(9, 8, 24, 1, true), new THREE.MeshStandardMaterial({ map: canvasTex(512, 64, (g, w, h) => stripes(g, w, h, '#c8202c', '#f4f0e8', 24)), side: THREE.BackSide })); tent.position.set(DX, 6.5, -2.4); qs.add(tent);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 2.6, 24, 1, true), new THREE.MeshStandardMaterial({ map: canvasTex(512, 64, (g, w, h) => stripes(g, w, h, '#c8202c', '#f4f0e8', 24)), side: THREE.BackSide })); wall.position.set(DX, 1.3, -2.4); qs.add(wall); }
const MASTER = makePerson(HERO_SHOW); topHat(MASTER); MASTER.position.set(DX, 0.13, -2.0); qs.add(MASTER);
const TR6 = TROUPE.map((o, i) => { const p = makePerson(o); const a = -0.9 + i * 0.45; p.position.set(DX + Math.sin(a) * 2.2, 0.13, -2.4 - Math.cos(a) * 1.2); qs.add(p); return p; });
beard(TR6[2]);
const BEAMS = []; for (let i = 0; i < 3; i++) { const b = new THREE.SpotLight([0xfff0d0, 0xffd0a0, 0xd0e0ff][i], 0, 14, 0.25, 0.5, 1); b.position.set(DX - 3 + i * 3, 7, 0.5); b.target.position.set(DX, 0.1, -2.2); qs.add(b); qs.add(b.target); BEAMS.push(b); }
const CONF = []; for (let i = 0; i < 16; i++) { const c = box(0.08, 0.08, 0.01, new THREE.MeshBasicMaterial({ color: ['#f2c14e', '#e2483c', '#3a7ad8', '#3f8f6b'][i % 4] })); c.position.set(DX, 3, -2); qs.add(c); CONF.push(c); }
const tReal = tag('ショービジネスを生んだ男', { size: 54, w: 700, bg: '#14161c', sx: 2.4 }); tReal.position.set(DX, 3.5, -2.0); qs.add(tReal);
const tGreat = tag('最高のショーマン', { size: 64, w: 540, bg: '#c8202c', sx: 2.1 }); tGreat.position.set(DX, 3.5, -2.0); qs.add(tGreat);

// ---------- shots ----------
const ALL = [tJob, tMuseum, tDream, tFamily, tCentury, tLook, tHidden, tStage, t2017, tMusical, tReal, tGreat];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPARK2.forEach(s => s.visible = false); NOTES5.forEach(n => n.visible = false); SPOT4.intensity = 0; BEAMS.forEach(b => b.intensity = 0); }

function shotClosed(t, quiz = 0) { // 1段目 0〜9：会社がつぶれて、仕事を失った男。借りたお金で、小さな博物館を開く（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.95; S.darken(0.15, '#0a0a10');
  const k = quiz ? 1 : clamp(t / 3.0);
  man1.position.set(lerp(0, 0.5, k), 0, lerp(-3.3, -1.7, k)); man1.rotation.y = 0; poseWalk(man1, t * 5, k < 1 ? 0.6 : 0);
  man1.userData.arms.forEach(a => a.rotation.x = -1.2); man1.userData.head.rotation.x = 0.35;
  BOX1.position.set(man1.position.x, 0.95, man1.position.z + 0.35);
  WORKERS.forEach((p, i) => { p.userData.head.rotation.x = 0.4; p.rotation.y = i === 0 ? 0.6 : i === 2 ? -0.6 : 0; p.userData.arms.forEach(a => a.rotation.x = -0.2); });
  MUSEUM.visible = quiz || t > 4.2; if (MUSEUM.visible && !quiz) MUSEUM.scale.setScalar(ease(clamp((t - 4.3) / 0.5)));
  if (!quiz && t > 4.2) { man1.rotation.y = 1.1; man1.userData.head.rotation.x = 0; man1.userData.arms[1].rotation.x = -2.3; }
  if (!quiz) { tJob.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tJob.visible = false; tMuseum.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, 1.0, u), lerp(2.2, 2.3, u), lerp(3.6, 3.2, u), lerp(0.2, 1.4, u), 1.4, -2.6, 64);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：主人公は、貧しく育った夢見る男。妻と娘たちを、幸せにしたい
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.9; S.darken(0.2, '#100a0a');
  const open = 0.5 + 0.5 * Math.sin(t * 1.5); man2.userData.arms[0].rotation.x = -1.3 - open * 0.5; man2.userData.arms[1].rotation.x = -1.3 - open * 0.5;
  wife2.userData.arms[1].rotation.x = -0.6; KIDS2.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.08; p.userData.arms.forEach(a => a.rotation.x = -2.6 + Math.sin(t * 6 + i) * 0.3); });
  SPARK2.forEach((s, i) => { s.visible = true; s.userData.pop(1); const a = t * 0.8 + i * 0.785; s.position.set(AX + 0.6 + Math.cos(a) * 0.9, 2.3 + Math.sin(a) * 0.35, -1.6 + Math.sin(a) * 0.2); });
  tDream.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDream.visible = false; tFamily.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.3, 0.3, u), lerp(1.9, 2.0, u), lerp(3.4, 2.8, u), AX, 1.3, -1.6, 62);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：舞台は19世紀の大都会。上流の人々は、成り上がりを見下す
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.9; S.darken(0.3, '#120c10');
  CARRIAGE.position.x = BX - 6 + t * 1.2; CARRIAGE.position.y = Math.abs(Math.sin(t * 6)) * 0.03;
  man3.userData.head.rotation.x = -0.1;
  UPPER.forEach((p, i) => { p.userData.head.rotation.x = t > 4.2 ? -0.25 : 0; p.userData.head.rotation.y = t > 4.2 ? 0.2 : 0; p.rotation.y = t > 4.2 ? -1.6 : -0.6; });
  if (t > 4.2) { UPPER[0].userData.arms[1].rotation.x = -1.2; UPPER[2].userData.arms[0].rotation.x = -1.6; }
  tCentury.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCentury.visible = false; tLook.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.6, 0.2, u), lerp(2.0, 2.2, u), lerp(4.6, 3.8, u), BX, 1.6, -3.0, 62);
  return qs;
}
function shotBackstage(t) { // 4段目 25〜33：世間から隠れて生きてきた人たちを集めて、みんなで、ショーの舞台へ
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#0a0608');
  const k = clamp((t - 4.0) / 2.6);
  TR4.forEach((p, i) => { p.position.z = lerp(-3.0, -1.4, ease(clamp(k * 1.3 - i * 0.08))); poseWalk(p, t * 5 + i, k > 0 && k < 1 ? 0.6 : 0); p.userData.head.rotation.x = t < 4 ? 0.35 : 0; });
  SPOT4.intensity = lerp(0, 50, ease(clamp((t - 3.8) / 1.0)));
  tHidden.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHidden.visible = false; tStage.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.4, 0.0, u), lerp(2.2, 2.0, u), lerp(4.6, 4.0, u), CX, 1.6, -2.0, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2017年のアメリカ映画。日本では2018年公開。105分のミュージカル
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.4; S.darken(0.6, '#08060a');
  NOTES5.forEach((n, i) => { n.visible = true; n.userData.pop(1); const k = (t * 0.25 + i / 6) % 1; n.position.set(TX - 2.4 + i * 0.95, 1.8 + k * 3.0, -3.6); });
  t2017.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t2017.visible = false; tMusical.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.9, u), lerp(4.6, 3.6, u), TX, 3.2, -4.8, 60);
  return qs;
}
function shotTent(t) { // 6段目 42〜49（決め手）：主人公は、ショービジネスを生み出した実在の男。タイトルは、最高のショーマン
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.5, '#0a0608');
  BEAMS.forEach((b, i) => { b.intensity = 40; b.target.position.set(DX + Math.sin(t * 1.2 + i * 2) * 1.6, 0.1, -2.4 + Math.cos(t + i) * 0.8); });
  MASTER.userData.arms[0].rotation.x = -2.5; MASTER.userData.arms[1].rotation.x = -1.2 + Math.sin(t * 3) * 0.2;
  TR6.forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = t > 3.5 ? -2.8 : -0.4); p.position.y = 0.13 + (t > 3.5 ? Math.abs(Math.sin(t * 5 + i)) * 0.1 : 0); });
  CONF.forEach((c, i) => { const k = (t * 0.3 + i / 16) % 1; c.visible = t > 3.5; c.position.set(DX - 3 + (i % 8) * 0.8 + Math.sin(t + i) * 0.2, 4.2 - k * 4, -1.0 - (i % 3) * 0.8); c.rotation.set(t * 3 + i, t * 2, i); });
  tReal.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tReal.visible = false; tGreat.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.5, 0.3, u), lerp(2.0, 2.3, u), lerp(4.6, 3.8, u), DX, 1.6, -2.2, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（幕の裏に戻る）
  shotBackstage(2.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.55, 0.4, d); S.darken(0.5 + 0.2 * d, '#100a14');
  const k = ease(t / 7);
  look(CX, 2.0, lerp(4.0, 3.4, k), CX, 1.6, -2.0, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotClosed(t, 0) },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotBackstage },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotTent },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '会社がつぶれて、<br>仕事を失った男。'],
  [5.6, 9.0, '借りたお金で、<br>小さな博物館を開く。'],
  [9.2, 13.2, '主人公は、貧しく育った<br>夢見る男。'],
  [13.2, 17.0, '妻と娘たちを、<br>幸せにしたい。'],
  [17.2, 21.0, '舞台は、<br>19世紀の大都会。'],
  [21.0, 25.0, '上流の人々は、<br>成り上がりを見下す。'],
  [25.2, 29.0, '世間から隠れて<br>生きてきた人たちを集めて、'],
  [29.0, 33.0, 'みんなで、<br>ショーの舞台へ。'],
  [33.2, 37.4, '2017年のアメリカ映画。<br>日本では2018年公開。'],
  [37.4, 41.8, '105分の、<br>ミュージカル映画。'],
  [42.2, 45.4, 'ショービジネスを<br>生み出した、実在の男。'],
  [45.4, 49.0, 'タイトルは、<br>最高のショーマン。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>グレイテスト・ショーマン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q083', v2: true, answer: 'グレイテスト・ショーマン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 8383,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '会社': 'かいしゃ', '仕事': 'しごと', '失った': 'うしなった', '男': 'おとこ', '借りた': 'かりた', 'お金': 'おかね', '小さな': 'ちいさな', '博物館': 'はくぶつかん', '開く': 'ひらく', '主人公': 'しゅじんこう', '貧しく': 'まずしく', '育った': 'そだった', '夢見る': 'ゆめみる', '妻': 'つま', '娘たち': 'むすめたち', '幸せ': 'しあわせ', '舞台': 'ぶたい', '19世紀': 'じゅうきゅうせいき', '大都会': 'だいとかい', '上流': 'じょうりゅう', '人々': 'ひとびと', '成り上がり': 'なりあがり', '見下す': 'みくだす', '世間': 'せけん', '隠れて': 'かくれて', '生きて': 'いきて', '人たち': 'ひとたち', '集めて': 'あつめて', '2017年': 'にせんじゅうななねん', '日本': 'にほん', '2018年': 'にせんじゅうはちねん', '公開': 'こうかい', '105分': 'ひゃくごふん', '映画': 'えいが', '生み出した': 'うみだした', '実在': 'じつざい', '最高': 'さいこう', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n会社がつぶれて、仕事を失った男。借りたお金で、小さな博物館を開く。主人公は、貧しく育った夢見る男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'PrimeVideo', '映画好き', 'ミュージカル映画'],
  },
});
applyQuizCards({ answer: 'グレイテスト・<br>ショーマン', info: 'Disney+・Prime Video｜映画・105分', answerSize: 112 });
