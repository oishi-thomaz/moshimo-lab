import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #047 リメンバー・ミー（アニメ映画・アメリカ・日本公開2018年・105分・ピクサー。Disney+ で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/rimenbami）で2026/11/4確認。Filmarks 4.2・レビュー264,790件 filmarks.com/movies/64777）
// 確かめた事実（Filmarks の作品ページのあらすじ・ja.wikipedia「リメンバー・ミー (2017年の映画)」。2026/11/4）：
//   ・主人公ミゲルは音楽が大好きなギターの天才少年。一族には「音楽禁止」の掟があり、家で音楽を聞くこともできない。ある日、死者の国へ迷い込む（Filmarks）
//   ・ミゲルは12歳。リヴェラ家は代々靴作り。舞台は死者の日（祭壇に先祖の写真を飾る）。日の出までに家族の許しをもらって戻る必要がある（wikipedia）
//   ・米公開2017年11月22日、日本公開2018年3月16日。第90回アカデミー賞 長編アニメ映画賞・歌曲賞
// 構成（ヒント6段）：1 ギターが大好きな少年・でも家では音楽禁止 → 2 12歳・家は代々靴作り → 3 年に一度、家族の写真を飾る夜・オレンジの花びら
//   → 4 迷い込んだのはガイコツたちの世界・日の出までに家族の許し → 5 アメリカのアニメ映画・アカデミー賞2部門 → 6 決め手：舞台はメキシコの死者の日、作ったのはピクサー
// 地名（メキシコ）・人物名・歌の題名は6段目まで出さない。歌詞は使わない。後半の展開・結末（誰が誰か）には触れない。作品の映像・キャラクター・
//   ポスター・有名な場面の構図（花びらの橋・ステージで歌う場面など）は使わない。人とガイコツと町は汎用の3D

const S = quizStage({ bg: '#3a2448', floor: '#4a3a40', fogNear: 24, fogFar: 90 });
const qs = S.scene;
const R = rng(4747);

const BOY = { skin: '#c8946a', hair: '#1a1a1a', shirt: '#e8e4dc', pants: '#3a4a7a', scale: 0.8 };
const MARI = ['#f28a1e', '#f2a830', '#e86a10'];
function guitar() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 18), mat('#e8c070')); b.rotation.x = Math.PI / 2; g.add(b); const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 18), mat('#e8c070')); b2.rotation.x = Math.PI / 2; b2.position.y = 0.28; g.add(b2); const hole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 14), mat('#2a1a10')); hole.position.set(0, 0.12, 0.052); g.add(hole); const nk = box(0.06, 0.6, 0.04, mat('#5a3a20')); nk.position.y = 0.7; g.add(nk); const hd = box(0.1, 0.14, 0.05, mat('#3a2410')); hd.position.y = 1.05; g.add(hd); return g; }
function skeleton(col) { const p = makePerson({ skin: '#f2eee4', hair: '#f2eee4', shirt: col, pants: '#2a2a34' }); const h = p.userData.head; h.children.forEach(c => { if (c.material && c.material.color && c.material.color.getHexString() === '121212') { c.scale.set(1.6, 1.3, 1); } }); const nose = box(0.06, 0.05, 0.02, mat('#121212')); nose.position.set(0, 0.2, 0.196); h.add(nose); const mouth = box(0.2, 0.03, 0.02, mat('#3a3a3a')); mouth.position.set(0, 0.11, 0.196); h.add(mouth); for (let i = 0; i < 3; i++) { const r = box(0.52, 0.04, 0.02, mat('#f2eee4')); r.position.set(0, 1.08 + i * 0.12, 0.15); p.add(r); } return p; }

// ---------- 1段目. 屋根裏（x=0）。こっそりギター、下は靴の工房 ----------
{ const fl = box(8, 0.1, 6, mat('#6a4a30')); fl.position.set(0, 0.05, -1); qs.add(fl);
  for (const s of [-1, 1]) { const rf = box(0.2, 6, 7, mat('#5a3a24')); rf.position.set(s * 2.4, 2.4, -1); rf.rotation.z = s * 0.55; qs.add(rf); }
  const wl = box(8, 6, 0.2, mat('#7a5a3e')); wl.position.set(0, 3, -4); qs.add(wl);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#2a2a6a' })); win.position.set(0, 2.7, -3.88); qs.add(win);
  for (let i = 0; i < 4; i++) { const c = box(0.6, 0.5, 0.5, mat(['#8a6a4a', '#7a5a3a', '#9a7a5a', '#6a4a2a'][i])); c.position.set(-1.3 + (i % 2) * 0.7, 0.35 + Math.floor(i / 2) * 0.5, -2.9); qs.add(c); } }
const boy1 = makePerson(BOY); boy1.position.set(0.2, -0.32, -1.6); boy1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(boy1);
const GT1 = guitar(); GT1.scale.setScalar(0.8); GT1.position.set(0.1, 0.62, -1.25); GT1.rotation.z = 0.9; qs.add(GT1);
const CANDLE1 = new THREE.PointLight(0xffb060, 0, 5, 1.4); CANDLE1.position.set(0.8, 1.0, -1.2); qs.add(CANDLE1);
{ const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 10), mat('#f4ecd8')); c.position.set(0.8, 0.22, -1.2); qs.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd070' })); f.position.set(0.8, 0.4, -1.2); qs.add(f); }
const NOTES = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd070' })); h.scale.set(1.3, 1, 1); g.add(h); const st = box(0.02, 0.22, 0.02, new THREE.MeshBasicMaterial({ color: '#ffd070' })); st.position.set(0.07, 0.11, 0); g.add(st); g.userData.o = i / 6; qs.add(g); NOTES.push(g); }
const BAN = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), new THREE.MeshBasicMaterial({ color: '#e2483c' })); BAN.add(c); const b = box(0.85, 0.12, 0.02, new THREE.MeshBasicMaterial({ color: '#ffffff' })); b.rotation.z = -0.78; b.position.z = 0.01; BAN.add(b); const nt = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(24, 44, 10, 8, -0.3, 0, Math.PI * 2); g.fill(); g.fillRect(31, 10, 5, 34); }), transparent: true })); nt.position.z = -0.01; BAN.add(nt); } BAN.position.set(-0.75, 1.75, -1.5); BAN.scale.setScalar(0.6); qs.add(BAN);
const tBan = tag('この家では 音楽禁止', { size: 62, w: 620, bg: '#e2483c', sx: 1.5 }); tBan.position.set(0.2, 2.25, -1.4); qs.add(tBan);
const tSecret = tag('こっそりギター', { size: 74, w: 500, bg: '#14161c', sx: 1.3 }); tSecret.position.set(0.2, 2.25, -1.4); qs.add(tSecret);

// ---------- 2段目. 靴の工房（x=40）。棚いっぱいの靴 ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#8a6a4a')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#e8c8a0')); wl.position.set(KX, 3, -4); qs.add(wl);
  for (let r = 0; r < 3; r++) { const sh = box(5, 0.08, 0.5, mat('#6a4a2a')); sh.position.set(KX, 1.2 + r * 0.8, -3.7); qs.add(sh); for (let i = 0; i < 9; i++) { const sb = box(0.32, 0.18, 0.5, mat(['#5a3a20', '#3a2a1a', '#8a5a2a', '#a84a3a'][(i + r) % 4])); sb.position.set(KX - 2.1 + i * 0.52, 1.35 + r * 0.8, -3.6); qs.add(sb); const tp = box(0.3, 0.1, 0.22, sb.material); tp.position.set(KX - 2.1 + i * 0.52, 1.47 + r * 0.8, -3.75); qs.add(tp); } }
  const bn = box(2.4, 0.8, 1.0, mat('#7a5a3a')); bn.position.set(KX + 0.4, 0.4, -1.6); qs.add(bn); const bt = box(2.6, 0.08, 1.1, mat('#5a3a20')); bt.position.set(KX + 0.4, 0.84, -1.6); qs.add(bt); }
const HAM = new THREE.Group(); { const h = box(0.06, 0.4, 0.06, mat('#8a5a2a')); HAM.add(h); const hd = box(0.2, 0.08, 0.08, mat('#5a5a60')); hd.position.y = 0.22; HAM.add(hd); } HAM.position.set(KX + 0.55, 1.1, -1.5); qs.add(HAM);
const SHOE = box(0.34, 0.18, 0.14, mat('#3a2a1a')); SHOE.position.set(KX + 0.4, 0.97, -1.5); qs.add(SHOE);
const boy2 = makePerson(BOY); boy2.position.set(KX + 0.4, 0, -0.7); boy2.rotation.y = Math.PI; qs.add(boy2);
const tAge = tag('12歳の少年', { size: 80, w: 440, bg: '#14161c', sx: 1.7 }); tAge.position.set(KX, 2.6, -1.6); qs.add(tAge);
const tShoe = tag('家は代々 靴作り', { size: 70, w: 540, bg: '#8a5a2a', sx: 1.9 }); tShoe.position.set(KX, 2.6, -1.6); qs.add(tShoe);

// ---------- 3段目. 祭りの夜の祭壇（x=90）。写真立てとロウソク、オレンジの花びら ----------
const CX = 90;
{ const fl = box(10, 0.04, 8, mat('#3a2a2a')); fl.position.set(CX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#5a3a5a')); wl.position.set(CX, 3, -4); qs.add(wl);
  for (let r = 0; r < 3; r++) { const st = box(4.4 - r * 1.1, 0.5, 0.8, mat(['#e8dcc8', '#e2483c', '#f2c14e'][r])); st.position.set(CX, 0.25 + r * 0.5, -3.0 - r * 0.25); qs.add(st); } }
const FRAMES = []; for (let i = 0; i < 7; i++) { const g = new THREE.Group(); const f = box(0.42, 0.52, 0.04, mat('#5a3a20')); g.add(f); const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.42), new THREE.MeshBasicMaterial({ map: canvasTex(64, 84, (gg, w, h) => { gg.fillStyle = '#d8c8a8'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#8a7a60'; gg.beginPath(); gg.arc(w / 2, 34, 13, 0, Math.PI * 2); gg.fill(); gg.fillRect(w / 2 - 18, 50, 36, 34); }) })); ph.position.z = 0.022; g.add(ph); const r = i < 4 ? 0 : (i < 6 ? 1 : 2); const n = [4, 2, 1][r]; const k = [0, 4, 6][r]; g.position.set(CX + (i - k - (n - 1) / 2) * 0.8, 0.82 + r * 0.5, -2.85 - r * 0.25); qs.add(g); FRAMES.push(g); }
const CANDLES = []; for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22 + R() * 0.15, 10), mat('#f4ecd8')); c.position.set(CX - 2 + i * 0.44, 0.62, -2.5); qs.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd070' })); f.position.set(CX - 2 + i * 0.44, 0.82, -2.5); qs.add(f); CANDLES.push(f); }
const ALTARLIGHT = new THREE.PointLight(0xffa850, 0, 8, 1.3); ALTARLIGHT.position.set(CX, 1.6, -1.6); qs.add(ALTARLIGHT);
const PETALS = []; for (let i = 0; i < 90; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.05 + R() * 0.04, 6), new THREE.MeshBasicMaterial({ color: MARI[i % 3], side: THREE.DoubleSide })); p.userData = { x: R() * 8 - 4, z: R() * 6 - 4, o: R(), s: 0.4 + R() * 0.6 }; qs.add(p); PETALS.push(p); }
const tPhoto = tag('年に一度 写真を飾る夜', { size: 60, w: 660, bg: '#14161c', sx: 2.0 }); tPhoto.position.set(CX, 3.1, -1.2); qs.add(tPhoto);
const tPetal = tag('オレンジの花びら', { size: 70, w: 560, bg: '#f28a1e', sx: 1.9 }); tPetal.position.set(CX, 3.1, -1.2); qs.add(tPetal);

// ---------- 4段目. ガイコツたちの世界（x=130）。光る町と、ガイコツの人たち ----------
const BX = 130;
const TOWERS = []; for (let i = 0; i < 12; i++) { const w = 1.4 + R() * 1.2, h = 4 + R() * 10; const wt = windowTextures(4700 + i, ['#6a3a8a', '#3a5a9a', '#8a3a6a', '#3a7a8a'][i % 4]); wt.map.repeat.set(w / 1.4, h / 1.6); wt.emi.repeat.set(w / 1.4, h / 1.6); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color(['#ffb060', '#ff70c0', '#70e0ff'][i % 3]), emissiveIntensity: 0.9 })); b.position.set(BX - 12 + i * 2.2, h / 2 - 1 + (i % 3), -16 - (i % 4) * 3); qs.add(b); TOWERS.push(b); }
const SKELS = []; for (let i = 0; i < 6; i++) { const p = skeleton(['#8e6bbf', '#e05a4f', '#3f8f6b', '#f2c14e', '#4fa3d1', '#e86a8a'][i]); p.position.set(BX - 2.6 + i * 1.05, 0, -2.2 - (i % 2) * 0.8); p.rotation.y = (i - 2.5) * -0.12; qs.add(p); SKELS.push(p); }
const boy4 = makePerson(BOY); boy4.position.set(BX, 0, 0.6); boy4.rotation.y = Math.PI; qs.add(boy4);
const SUN = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#ffd070', fog: false })); SUN.position.set(BX + 6, 0, -24); qs.add(SUN);
const tSkel = tag('ガイコツたちの世界', { size: 66, w: 600, bg: '#8e6bbf', sx: 2.2 }); tSkel.position.set(BX, 3.2, -1.0); qs.add(tSkel);
const tDawn = tag('期限は 日の出まで', { size: 68, w: 560, bg: '#14161c', sx: 2.1 }); tDawn.position.set(BX, 3.2, -1.0); qs.add(tDawn);

// ---------- 5段目. 金色の像と光（x=170）。アメリカのアニメ映画・アカデミー賞2部門 ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1430' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const STATUES = [-1, 1].map(s => { const g = new THREE.Group(); const gm = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.85, roughness: 0.25, emissive: '#4a3008' }); const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.4, 20), mat('#2a2a2e')); bs.position.y = 0.2; g.add(bs); const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.1, 14), gm); bd.position.y = 0.95; g.add(bd); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), gm); hd.position.y = 1.62; g.add(hd); g.position.set(FX + s * 1.3, -0.2, -1); qs.add(g); return g; });
const RAYS = []; for (let i = 0; i < 10; i++) { const r = box(0.06, 5, 0.02, new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.25 })); r.position.set(FX, 2.4, -2.5); r.rotation.z = (i - 4.5) * 0.22; qs.add(r); RAYS.push(r); }
const tUS = tag('アメリカのアニメ映画', { size: 64, w: 640, bg: '#4fa3d1', sx: 2.8 }); tUS.position.set(FX, 4.6, -1.2); qs.add(tUS);
const tAca = tag('アカデミー賞 2部門', { size: 66, w: 600, bg: '#e2483c', sx: 2.7 }); tAca.position.set(FX, 4.6, -1.2); qs.add(tAca);

// ---------- 6段目. 祭りの広場（x=210）。切り紙の旗とロウソク、ギターの少年 ----------
const NX = 210;
{ const fl = box(14, 0.04, 14, mat('#5a4038')); fl.position.set(NX, 0.02, -3); qs.add(fl); }
const HOUSES = []; for (let i = 0; i < 8; i++) { const w = 2.2 + R() * 0.8, h = 2.6 + R() * 1.6; const b = box(w, h, 2, mat(['#e86a8a', '#f2c14e', '#4fa3d1', '#3f8f6b', '#e2483c', '#8e6bbf'][i % 6])); const side = i % 2 ? 1 : -1; b.position.set(NX + side * 4.4, h / 2, 1 - (i >> 1) * 2.6); qs.add(b); HOUSES.push(b); }
const FLAGS = []; for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72), new THREE.MeshBasicMaterial({ map: canvasTex(62, 72, (g, w, h) => { g.fillStyle = ['#e86a8a', '#f2c14e', '#4fa3d1', '#3f8f6b', '#e2483c', '#8e6bbf', '#f28a1e'][(i + r * 2) % 7]; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0)'; g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(10 + (k % 3) * 21, 18 + Math.floor(k / 3) * 26, 5, 0, Math.PI * 2); g.fill(); } g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 10) g.lineTo(x, h - (x / 10 % 2 ? 8 : 0)); g.lineTo(w, h); g.fill(); }), transparent: true, side: THREE.DoubleSide })); f.position.set(NX - 3.6 + i * 0.9, 4.2 - Math.abs(i - 4) * -0.06, 0.5 - r * 2.4); qs.add(f); FLAGS.push(f); }
const C6 = []; for (let i = 0; i < 16; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd070' })); f.position.set(NX + (i % 2 ? 2.6 : -2.6), 0.3, 1 - (i >> 1) * 1.1); qs.add(f); C6.push(f); }
const boy6 = makePerson(BOY); boy6.position.set(NX, 0, 0.2); qs.add(boy6);
const GT6 = guitar(); GT6.scale.setScalar(0.8); GT6.position.set(NX + 0.05, 0.75, 0.42); GT6.rotation.z = 1.0; qs.add(GT6);
const tMX = tag('舞台は メキシコの死者の日', { size: 56, w: 740, bg: '#f28a1e', sx: 2.2 }); tMX.position.set(NX, 2.55, -0.8); qs.add(tMX);
const tPix = tag('作ったのは ピクサー', { size: 62, w: 600, bg: '#14161c', sx: 2.0 }); tPix.position.set(NX, 2.55, -0.8); qs.add(tPix);

// ---------- shots ----------
const ALL = [tBan, tSecret, tAge, tShoe, tPhoto, tPetal, tSkel, tDawn, tUS, tAca, tMX, tPix];
function base() { S.reset(); ALL.forEach(x => x.visible = false); CANDLE1.intensity = 0; ALTARLIGHT.intensity = 0; NOTES.forEach(n => n.visible = false); PETALS.forEach(p => p.visible = false); BAN.visible = false; }
function petals(cx, t) { PETALS.forEach(p => { p.visible = true; const u = p.userData; const y = 5 - ((t * u.s * 0.8 + u.o * 5) % 5); p.position.set(cx + u.x + Math.sin(t + u.o * 9) * 0.3, y, u.z); p.rotation.set(t * u.s * 2, t * u.s, 0); }); }

function shotAttic(t) { // 1段目 0〜9：ギターが大好きな少年。でも、この家では音楽が禁止（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.55; S.key.intensity = 0.3; S.darken(0.4, '#140a10');
  CANDLE1.intensity = 8 + Math.sin(t * 12) * 0.6;
  boy1.userData.arms[0].rotation.x = -0.9; boy1.userData.arms[1].rotation.x = -0.7 + 0.25 * Math.sin(t * 9); boy1.userData.head.rotation.x = 0.25;
  const hush = t > 4.6; if (hush) { boy1.userData.head.rotation.y = 0.6 * ease((t - 4.6) / 0.5); boy1.userData.head.rotation.x = 0; }
  NOTES.forEach((n, i) => { n.visible = !hush || t > 6.2; const k = (t * 0.35 + n.userData.o) % 1; n.position.set(0.2 + Math.sin(k * 6 + i) * 0.5 - k * 0.6, 1.0 + k * 1.4, -1.2); n.scale.setScalar((1 - k * 0.5) * (hush && t < 6.2 ? 0 : 1)); });
  BAN.visible = t < 4.6;
  tBan.userData.pop(1); if (t > 4.6) tBan.visible = false;
  tSecret.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.5, 0.3, u), lerp(1.7, 1.6, u), lerp(2.6, 2.0, u), 0.2, 1.3, -1.4, 58);
  return qs;
}
function shotShop(t) { // 2段目 9〜17：主人公は、12歳。家は代々、靴作りの一家
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.25;
  const k = Math.abs(Math.sin(t * 5)); HAM.position.set(KX + 0.55, 1.1 + k * 0.3, -1.5); HAM.rotation.z = 0.4 + k * 0.5;
  boy2.userData.arms[0].rotation.x = -0.8; boy2.userData.arms[1].rotation.x = -1.0 - k * 0.4; boy2.userData.head.rotation.x = 0.35;
  tAge.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAge.visible = false;
  tShoe.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.8, -0.3, u), lerp(2.2, 2.1, u), lerp(3.4, 2.6, u), KX + 0.2, 1.6, -2.4, 58);
  return qs;
}
function shotAltar(t) { // 3段目 17〜25：年に一度、家族の写真を飾る、祭りの夜。オレンジ色の花びらが、町を埋めつくす
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 0.5; S.key.intensity = 0.3; S.darken(0.45, '#140810');
  ALTARLIGHT.intensity = 16; CANDLES.forEach((c, i) => c.scale.setScalar(1 + 0.25 * Math.sin(t * 14 + i)));
  FRAMES.forEach((f, i) => f.scale.setScalar(Math.max(0.01, ease(clamp((t - 0.3 - i * 0.2) / 0.3)))));
  if (t > 4.0) petals(CX, t - 4.0);
  tPhoto.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tPhoto.visible = false;
  tPetal.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0, u), lerp(2.4, 2.2, u), lerp(3.8, 3.0, u), CX, 1.4, -2.8, 58);
  return qs;
}
function shotDead(t) { // 4段目 25〜33：迷い込んだのは、ガイコツたちの世界。日の出までに、家族の許しをもらって帰らないと
  base(); S.aim(BX, -2); lift(-30); S.hemi.intensity = 0.9; S.darken(0.55, '#1a0a30');
  SKELS.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.3; p.userData.arms[i % 2].rotation.x = -0.4 - 0.3 * Math.sin(t * 2 + i); p.position.y = Math.max(0, Math.sin(t * 4 + i)) * 0.05; });
  boy4.userData.head.rotation.y = Math.sin(t * 1.5) * 0.5; boy4.userData.arms.forEach(a => a.rotation.x = -0.2);
  SUN.visible = t > 4.2; SUN.position.y = t > 4.2 ? lerp(-1.2, 0.4, ease((t - 4.2) / 3)) : -2;
  tSkel.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSkel.visible = false;
  tDawn.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.6, 0.2, u), lerp(1.6, 1.8, u), lerp(4.4, 3.6, u), BX, 1.8, -4, 60);
  return qs;
}
function shotAward(t) { // 5段目 33〜42：アメリカの、アニメ映画。アカデミー賞で、長編アニメ賞と歌曲賞
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.0;
  STATUES.forEach((g, i) => { g.rotation.y = t * 0.6 * (i ? -1 : 1); g.visible = t > 4.2; g.scale.setScalar(t > 4.2 ? 1.7 * ease(clamp((t - 4.2 - i * 0.3) / 0.35)) : 0.01); });
  RAYS.forEach((r, i) => r.rotation.z = (i - 4.5) * 0.22 + Math.sin(t * 0.6) * 0.08);
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false;
  tAca.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.4, lerp(7.2, 6.4, u), FX, 2.6, -1.5, 56);
  return qs;
}
function shotPlaza(t, quiz = 0) { // 6段目 42〜49（決め手）：舞台は、メキシコの死者の日。作ったのは、ピクサー
  base(); S.aim(NX, -3); lift(-30); S.hemi.intensity = 0.8; S.darken(0.5, '#1a0a30');
  petals(NX, t + 3);
  FLAGS.forEach((f, i) => f.rotation.x = Math.sin(t * 2 + i * 0.7) * 0.25);
  C6.forEach((c, i) => c.scale.setScalar(1 + 0.3 * Math.sin(t * 13 + i)));
  boy6.userData.arms[0].rotation.x = -0.9; boy6.userData.arms[1].rotation.x = -0.7 + 0.25 * Math.sin(t * 9); boy6.userData.head.rotation.x = -0.1;
  if (!quiz) { tMX.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tMX.visible = false; tPix.userData.pop((t - 3.6) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(0.15, -0.05, u), lerp(1.3, 1.4, u), lerp(3.6, 3.0, u), NX - 0.1, 1.75, -3, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（祭りの広場でギターを弾く少年）
  shotPlaza(t + 7, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.8, 0.25, d);
  S.spot.color.set(0xffd8a0); S.spot.position.set(NX, 6, 3.4); S.spot.target.position.set(NX, 0.8, 0.2); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.4, 0.2, k), lerp(1.4, 1.3, k), lerp(3.0, 2.5, k), NX, 1.1, 0.2, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotAttic },
  { a: 9, b: 17, f: shotShop },
  { a: 17, b: 25, f: shotAltar },
  { a: 25, b: 33, f: shotDead },
  { a: 33, b: 42, f: shotAward },
  { a: 42, b: 49, f: (t) => shotPlaza(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ギターが大好きな少年。'],
  [5.6, 9.0, 'でも、この家では、<br>音楽が禁止。'],
  [9.2, 13.2, '主人公は、12歳。'],
  [13.2, 17.0, '家は代々、<br>靴作りの一家。'],
  [17.2, 21.0, '年に一度、家族の写真を飾る、<br>祭りの夜。'],
  [21.0, 25.0, 'オレンジ色の花びらが、<br>町を埋めつくす。'],
  [25.2, 29.0, '迷い込んだのは、<br>ガイコツたちの世界。'],
  [29.0, 33.0, '日の出までに、家族の許しを<br>もらって帰らないと。'],
  [33.2, 37.4, 'アメリカの、<br>アニメ映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>長編アニメ賞と歌曲賞。'],
  [42.2, 45.4, '舞台は、メキシコの<br>死者の日。'],
  [45.4, 49.0, '作ったのは、<br>ピクサー。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、リメンバー・ミー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q047', v2: true, answer: 'リメンバー・ミー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 4747,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'buzz'], [4.8, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.2, 'bubble'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'リメンバー・ミー': 'リメンバーミー', 'ピクサー': 'ピクサー', 'メキシコ': 'メキシコ', '死者の日': 'ししゃのひ', '12歳': 'じゅうにさい', '大好き': 'だいすき', '少年': 'しょうねん', '音楽': 'おんがく', '禁止': 'きんし', 'この家': 'このいえ', '主人公': 'しゅじんこう', '代々': 'だいだい', '靴作り': 'くつづくり', '一家': 'いっか', '年に一度': 'ねんにいちど', '家族の写真': 'かぞくのしゃしん', '飾る': 'かざる', '祭りの夜': 'まつりのよる', 'オレンジ色': 'オレンジいろ', '花びら': 'はなびら', '町を': 'まちを', '埋めつくす': 'うめつくす', '迷い込んだ': 'まよいこんだ', 'ガイコツ': 'ガイコツ', '世界': 'せかい', '日の出': 'ひので', '許し': 'ゆるし', '帰らないと': 'かえらないと', 'アニメ映画': 'アニメえいが', '長編アニメ賞': 'ちょうへんアニメしょう', '歌曲賞': 'かきょくしょう', '舞台': 'ぶたい', '作った': 'つくった', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nギターが大好きな少年。でも、この家では、音楽が禁止。主人公は、12歳。家は代々、靴作りの一家。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'DisneyPlus', 'アニメ映画', 'ピクサー'],
  },
});
applyQuizCards({ answer: 'リメンバー・ミー', info: 'Disney+｜アニメ映画・105分', answerSize: 108 });
