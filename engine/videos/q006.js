import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #006 クイーンズ・ギャンビット（ドラマ・アメリカ・全7話。Netflixで見放題、justwatch.com/jp/テレビ番組/kuinzugiyanbitsuto で2026/11/1確認。Filmarks 4.2）
// 設定：1950年代、両親を亡くした9歳の少女が児童養護施設へ。地下室でひとりチェスを指す用務員に頼みこんで教わり、才能を開花させる。
//       頭の中で盤を動かして練習する。全米の大会を勝ち抜き、メキシコシティ・パリ・モスクワへ。ソ連の王者が立ちはだかる
//       （Filmarks 作品ページ・WATCHA PEDIA・Real Sound の紹介記事・The Review Geek 第1話の紹介）
// 作品の映像・衣装・ロゴ・有名な場面の構図（ベッドから天井の駒を見上げる場面など）は使わず、設定だけを汎用の3Dで見せる。依存症の描写は入れない
// ヒント6段（2026/11/2 作り直し）：チェスが決め手なので、盤と駒は6段目まで映さない（1〜5段目の机の上は空っぽ・無地のマットだけ）。施設の看板の文字も出さない

const S = quizStage({ bg: '#2a3346', floor: '#3a4256', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(606);

const GIRL = { skin: '#f5d3b5', hair: '#6b4a33', shirt: '#b0645a', pants: '#7a3a34', long: true, skirt: true, scale: 0.78 };
const BETH = { skin: '#f5d3b5', hair: '#6b4a33', shirt: '#2f6a5a', pants: '#1f2a2a', long: true, skirt: true, scale: 0.92 };
const JANITOR = { skin: '#efcfae', hair: '#7a7a7a', shirt: '#5a5a4a', pants: '#3a3a30' };
const MATRON = { skin: '#efcfae', hair: '#8a8a8a', shirt: '#3a3e4a', pants: '#2e323c', skirt: true };
const KID = (i) => ({ skin: ['#f1c9a5', '#f5d3b5', '#e8b98f', '#d9a57c'][i % 4], hair: ['#2c2421', '#4a3426', '#1d1a19', '#9a7a4a'][i % 4], shirt: '#8a8e96', pants: '#5a5e68', long: true, skirt: true, scale: 0.78 });
const PLAYER = (i) => ({ skin: ['#efcfae', '#e8b98f', '#f1c9a5', '#d9a57c'][i % 4], hair: ['#2c2421', '#1a1a22', '#9a9a9a', '#4a3426'][i % 4], shirt: ['#2b3040', '#4a3a3a', '#3a4a5a', '#2a2a2a'][i % 4], pants: '#22262f', tie: true });
const RIVAL = { skin: '#efcfae', hair: '#1a1a1a', shirt: '#141418', pants: '#141418', tie: true };

// チェス盤と駒（汎用の形。6段目からだけ使う）
const BOARD_T = canvasTex(512, 512, (g, w) => { const c = w / 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#6a4a30' : '#e8d8b8'; g.fillRect(x * c, y * c, c, c); } });
function board(size = 0.9) { const g = new THREE.Group(); const b = box(size, 0.05, size, new THREE.MeshLambertMaterial({ map: BOARD_T })); g.add(b); const rim = box(size + 0.08, 0.04, size + 0.08, mat('#3a2a1e')); rim.position.y = -0.02; g.add(rim); return g; }
function piece(kind, white, s = 1) {
  const m = mat(white ? '#f2ece0' : '#1e1e22'); const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.06 * s, 0.03 * s, 12), m); base.position.y = 0.015 * s; g.add(base);
  if (kind === 'p') { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.04 * s, 0.07 * s, 10), m); b.position.y = 0.065 * s; g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.032 * s, 10, 8), m); h.position.y = 0.12 * s; g.add(h); }
  else if (kind === 'r') { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.036 * s, 0.045 * s, 0.13 * s, 10), m); b.position.y = 0.095 * s; g.add(b); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.046 * s, 0.04 * s, 0.04 * s, 10), m); t.position.y = 0.18 * s; g.add(t); }
  else if (kind === 'n') { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.045 * s, 0.09 * s, 10), m); b.position.y = 0.075 * s; g.add(b); const h = box(0.045 * s, 0.12 * s, 0.06 * s, m); h.position.set(0, 0.17 * s, -0.005 * s); h.rotation.x = -0.25; g.add(h); const sn = box(0.04 * s, 0.045 * s, 0.085 * s, m); sn.position.set(0, 0.205 * s, 0.035 * s); sn.rotation.x = 0.35; g.add(sn); const ea = box(0.03 * s, 0.03 * s, 0.02 * s, m); ea.position.set(0, 0.245 * s, -0.015 * s); g.add(ea); }
  else { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.045 * s, 0.14 * s, 10), m); b.position.y = 0.1 * s; g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.038 * s, 10, 8), m); h.position.y = 0.19 * s; g.add(h);
    if (kind === 'k') { const c1 = box(0.014 * s, 0.07 * s, 0.014 * s, m); c1.position.y = 0.255 * s; g.add(c1); const c2 = box(0.045 * s, 0.014 * s, 0.014 * s, m); c2.position.y = 0.26 * s; g.add(c2); }
    if (kind === 'q') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.04 * s, 0.05 * s, 8), m); c.position.y = 0.24 * s; g.add(c); }
    if (kind === 'b') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.026 * s, 0.05 * s, 8), m); c.position.y = 0.235 * s; g.add(c); } }
  g.children.forEach(c => { c.castShadow = true; });
  return g;
}
// 対局の途中のような配置（白が手前・黒が奥。マスの位置は自作）
const LAYOUT = [['r', 1, 0, 7], ['k', 1, 6, 7], ['q', 1, 3, 5], ['n', 1, 5, 5], ['b', 1, 2, 6], ['p', 1, 0, 6], ['p', 1, 1, 6], ['p', 1, 4, 4], ['p', 1, 6, 6], ['p', 1, 7, 6],
  ['r', 0, 7, 0], ['k', 0, 6, 0], ['q', 0, 3, 1], ['n', 0, 2, 2], ['b', 0, 5, 2], ['p', 0, 0, 1], ['p', 0, 1, 1], ['p', 0, 3, 3], ['p', 0, 6, 1], ['p', 0, 7, 2]];
function setPieces(bd, size, s) { const c = size / 8; return LAYOUT.map(([k, w, fx, fz]) => { const p = piece(k, !!w, s); p.position.set(-size / 2 + c * (fx + 0.5), 0.03, -size / 2 + c * (fz + 0.5)); if (k === 'n') p.rotation.y = w ? Math.PI : 0; bd.add(p); return p; }); }
function table(x, z, w = 1.0) { const g = new THREE.Group(); const top = box(w, 0.06, w * 0.8, mat('#5a4030')); top.position.y = 0.76; g.add(top); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.06, 0.74, 0.06, mat('#3a2a1e')); l.position.set(a * (w / 2 - 0.06), 0.37, b * (w * 0.4 - 0.06)); g.add(l); } g.position.set(x, 0, z); return g; }
function sit(p) { p.userData.legs.forEach(l => { l.rotation.x = -1.45; }); p.position.y -= 0.32 * (p.scale.x); }
const glowTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,246,220,1)'); gr.addColorStop(0.3, 'rgba(255,220,150,.7)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function glow(s) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.set(s, s, 1); sp.renderOrder = 5; qs.add(sp); return sp; }

// ---------- 1段目. 夕暮れの大きな古い建物と、スーツケースの少女（x=0） ----------
const HOME = new THREE.Group(); HOME.position.set(0, 0, -6); qs.add(HOME);
const WIN_KIDS = [];
{ const wall = mat('#9a917e');
  const main = box(13, 5.2, 3.2, wall); main.position.y = 2.6; HOME.add(main);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(9.6, 2.2, 4), mat('#3a2e2a')); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.25); roof.position.y = 6.3; HOME.add(roof);
  const WIN_ON = new THREE.MeshBasicMaterial({ color: '#f2c878' }), WIN_OFF = mat('#1e2636'), SIL = new THREE.MeshBasicMaterial({ color: '#2a2026' });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { if (r === 0 && (i === 3 || i === 4)) continue; const on = r === 1 || i === 2 || i === 5; const x = -5.2 + i * 1.5, y = 1.6 + r * 2.2; const w = box(0.8, 1.1, 0.08, on ? WIN_ON : WIN_OFF); w.position.set(x, y, 1.62); HOME.add(w);
    if (on && (i >= 1 && i <= 6)) { const k = new THREE.Group(); const hd = box(0.26, 0.28, 0.04, SIL); hd.position.y = 0.05; k.add(hd); const sh = box(0.46, 0.22, 0.04, SIL); sh.position.y = -0.27; k.add(sh); k.position.set(x + (i % 2 ? -0.1 : 0.1), y - 0.18, 1.68); HOME.add(k); WIN_KIDS.push(k); } }
  // 開いた扉から、あたたかい光
  const door = box(1.6, 2.2, 0.06, new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); door.position.set(0, 1.34, 1.62); HOME.add(door);
  const leaf = box(0.8, 2.2, 0.08, mat('#4a3020')); leaf.position.set(-1.05, 1.34, 2.0); leaf.rotation.y = -1.1; HOME.add(leaf);
  const step = box(3, 0.24, 1.0, mat('#7a7262')); step.position.set(0, 0.12, 2.1); HOME.add(step);
  for (let i = 0; i < 9; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 7), mat('#26392e')); tr.position.set(-11 + i * 2.8 + (i > 3 ? 4 : 0), 1.6, -2.6); HOME.add(tr); } }
const matron = makePerson(MATRON); matron.position.set(0, 0.24, -4.05); qs.add(matron);
const DOORL = new THREE.PointLight(0xffd8a0, 0, 10, 1.2); DOORL.position.set(0, 1.8, -3.2); qs.add(DOORL);
const girl1 = makePerson(GIRL); girl1.position.set(0.45, 0, 1.4); girl1.rotation.y = Math.PI; qs.add(girl1);
const suitcase = box(0.42, 0.32, 0.16, mat('#6a3a2a')); suitcase.position.set(0.88, 0.16, 1.45); qs.add(suitcase);
const tAge = tag('9歳', { size: 80, w: 220, bg: '#e6b450', color: '#14161c' }); tAge.position.set(0.45, 1.98, 1.4); qs.add(tAge);

// ---------- 2段目. 同じ服の子どもたちの部屋（x=24） ----------
const DORM = new THREE.Group(); DORM.position.set(24, 0, 0); qs.add(DORM);
{ const back = box(14, 4.6, 0.2, mat('#a49a86')); back.position.set(0, 2.3, -3.4); DORM.add(back);
  const fl = box(14, 0.06, 9, mat('#6a5240')); fl.position.y = 0.03; DORM.add(fl);
  for (let i = 0; i < 4; i++) { const w = box(1.1, 2.0, 0.06, new THREE.MeshBasicMaterial({ color: '#b8c8dc' })); w.position.set(-4.5 + i * 3.0, 2.6, -3.28); DORM.add(w); const fr = box(0.06, 2.0, 0.07, mat('#5a4a3a')); fr.position.set(-4.5 + i * 3.0, 2.6, -3.26); DORM.add(fr); }
  for (let i = 0; i < 6; i++) { const bed = box(0.9, 0.42, 1.8, mat('#d8d4c8')); bed.position.set(-5 + i * 2.0, 0.24, -2.3); DORM.add(bed); const fr = box(0.96, 0.8, 0.08, mat('#4a4a52')); fr.position.set(-5 + i * 2.0, 0.4, -3.2); DORM.add(fr); } }
const KIDS = []; for (let i = 0; i < 6; i++) { const p = makePerson(KID(i)); p.position.set(21.4 + i * 0.82, 0, -0.5); qs.add(p); KIDS.push(p); }
const matron2 = makePerson(MATRON); matron2.position.set(20.3, 0, 0.6); matron2.rotation.y = Math.PI / 2 + 0.3; qs.add(matron2);
const girl2 = makePerson(GIRL); girl2.position.set(26.9, 0, 0.3); girl2.rotation.y = -0.5; qs.add(girl2);
const suit2 = box(0.42, 0.32, 0.16, mat('#6a3a2a')); suit2.position.set(27.35, 0.16, 0.45); suit2.rotation.y = -0.5; qs.add(suit2);
const tHome = tag('施設', { size: 84, w: 240, sx: 0.8 }); tHome.position.set(24.7, 2.0, -0.5); qs.add(tHome);

// ---------- 3〜4段目. 地下室（x=48） ----------
const BASE = new THREE.Group(); BASE.position.set(48, 0, 0); qs.add(BASE);
{ const back = box(10, 4, 0.2, mat('#5a5a52')); back.position.set(0, 2, -3); BASE.add(back);
  const fl = box(10, 0.06, 7, mat('#4a4a44')); fl.position.y = 0.03; BASE.add(fl);
  for (let i = 0; i < 4; i++) { const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 10, 8), mat('#7a6a5a')); pipe.rotation.z = Math.PI / 2; pipe.position.set(0, 3.3 + i * 0.22, -2.7); BASE.add(pipe); }
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.4, 16), mat('#6a5040')); boiler.position.set(-2.6, 1.2, -2.0); boiler.castShadow = true; BASE.add(boiler);
  for (let i = 0; i < 9; i++) { const st = box(1.2, 0.2, 0.42, mat('#6a5a4a')); st.position.set(2.8, 0.1 + i * 0.36, 1.8 - i * 0.42); BASE.add(st); const rs = box(1.2, i * 0.36 + 0.2, 0.42, mat('#5a4a3a')); rs.position.set(2.8, (i * 0.36 + 0.2) / 2, 1.8 - i * 0.42); BASE.add(rs); }
  BASE.add(table(0, -1.0, 0.95));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); bulb.position.set(0, 3.0, -1.0); BASE.add(bulb);
  const cord = box(0.02, 1.0, 0.02, mat('#222')); cord.position.set(0, 3.55, -1.0); BASE.add(cord);
  const pl = new THREE.PointLight(0xffd89a, 0, 8, 1.3); pl.position.set(0, 2.8, -1.0); BASE.add(pl); BASE.userData.pl = pl; }
const jan = makePerson(JANITOR); qs.add(jan);
const stool1 = box(0.4, 0.45, 0.4, mat('#3a2a1e')); qs.add(stool1);
const stool2 = box(0.34, 0.4, 0.34, mat('#3a2a1e')); stool2.position.set(48.95, 0.2, -1.0); qs.add(stool2);
const girl3 = makePerson(GIRL); qs.add(girl3);
const ORB = glow(0.5); ORB.position.set(48, 0.98, -1.0);
const tJan = tag('用務員さん', { size: 72, w: 440, bg: '#e6b450', color: '#14161c' }); tJan.position.set(48, 2.35, -0.2); qs.add(tJan);
const tGift = tag('天才', { size: 84, w: 240, sx: 0.62, bg: '#e2483c' }); tGift.position.set(48.55, 1.78, -1.0); qs.add(tGift);

// ---------- 5段目. 大人ばかりの大会の会場（x=88）。机の上は無地のマットだけ ----------
const HALL = new THREE.Group(); HALL.position.set(88, 0, 0); qs.add(HALL);
{ const back = box(16, 5, 0.2, mat('#6a5a4a')); back.position.set(0, 2.5, -4.2); HALL.add(back);
  const fl = box(16, 0.06, 10, mat('#7a3a34')); fl.position.y = 0.03; HALL.add(fl);
  for (let i = 0; i < 3; i++) { const lamp = box(1.4, 0.1, 0.5, new THREE.MeshBasicMaterial({ color: '#fff2cc' })); lamp.position.set(-4 + i * 4, 4.4, -1.4); HALL.add(lamp); } }
const MAT_M = mat('#3a3430');
function plainMat(x, z) { const m = box(0.6, 0.02, 0.6, MAT_M); m.position.set(x, 0.8, z); qs.add(m); }
const HP = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const x = 84.6 + i * 3.4, z = -2.6 + r * 2.4; if (i === 1) continue; HALL.add(table(x - 88, z, 0.9)); plainMat(x, z); for (const s of [-1, 1]) { const p = makePerson(PLAYER(i + r * 3 + (s > 0 ? 1 : 0))); p.position.set(x + s * 0.75, 0, z); p.rotation.y = -s * Math.PI / 2; sit(p); qs.add(p); HP.push(p); } }
const SPECT = []; for (let i = 0; i < 5; i++) { const p = makePerson(PLAYER(i + 1)); p.position.set(85.4 + i * 1.3, 0, -3.6); qs.add(p); SPECT.push(p); }
const beth5 = makePerson(BETH); beth5.position.set(87.3, 0, -0.2); beth5.rotation.y = Math.PI / 2; sit(beth5); qs.add(beth5);
HALL.add(table(0, -0.2, 0.9)); plainMat(88, -0.2);
const opp5 = makePerson(PLAYER(2)); opp5.position.set(88.75, 0, -0.2); opp5.rotation.y = -Math.PI / 2; sit(opp5); qs.add(opp5);
const tUS = tag('1950年代・アメリカ', { size: 62, w: 620 }); tUS.position.set(88, 3.0, -0.2); qs.add(tUS);
const tWin = tag('大会を勝ち抜く', { size: 66, w: 520, bg: '#e6b450', color: '#14161c' }); tWin.position.set(87.6, 2.2, -0.2); qs.add(tWin);

// ---------- 6段目（決め手）・クイズ. チェス盤とソ連の王者（x=110） ----------
const FINAL = new THREE.Group(); FINAL.position.set(110, 0, 0); qs.add(FINAL);
FINAL.add(table(0, 0, 1.2));
const BD6 = board(0.9); BD6.position.set(110, 0.82, 0); qs.add(BD6); const P6 = setPieces(BD6, 0.9, 1.15);
const beth6 = makePerson(BETH); beth6.position.set(109.12, 0, 0); beth6.rotation.y = Math.PI / 2; sit(beth6); qs.add(beth6);
const rival = makePerson(RIVAL); rival.position.set(110.88, 0, 0); rival.rotation.y = -Math.PI / 2; sit(rival); qs.add(rival);
const top6 = new THREE.SpotLight(0xfff0d0, 0, 12, 0.45, 0.5, 1.2); top6.position.set(110, 6, 1.5); top6.target.position.set(110, 0.8, 0); qs.add(top6); qs.add(top6.target);
const tChess = tag('チェス', { size: 92, w: 340, sx: 0.5, bg: '#e6b450', color: '#14161c' }); tChess.position.set(110, 1.5, -0.6); qs.add(tChess);
const tRival = tag('ソ連の王者', { size: 72, w: 420, sx: 1.05, bg: '#e2483c' }); tRival.position.set(110.5, 2.25, 0); qs.add(tRival);
// クイズの間：盤の上に浮かぶ、光る駒（頭の中で動かす盤のイメージ）
const GP = []; for (let i = 0; i < 6; i++) { const p = piece(['k', 'q', 'n', 'r', 'b', 'p'][i], i % 2 === 0, 2.4); p.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.8; o.material.emissive = new THREE.Color(i % 2 === 0 ? '#4a6a8a' : '#1a2a4a'); } }); p.userData.a = i / 6 * Math.PI * 2; qs.add(p); GP.push(p); }

// ---------- shots ----------
const ALLTAG = [tAge, tHome, tJan, tGift, tUS, tWin, tChess, tRival];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); jan.position.set(48, 0, -0.25); girl3.position.set(50.8, 0, 1.0); stool1.position.set(48, 0.22, -0.25); BASE.userData.pl.intensity = 0; DOORL.intensity = 0; top6.intensity = 0; GP.forEach(p => p.visible = false); }

function shotArrive(t, T) { // 1段目 0〜9：夕暮れ、大きな古い建物の前にスーツケースの少女。窓という窓から子どもたちが見ている（0秒目がサムネ）
  base(); S.aim(0, 0); lift(110);
  S.hemi.intensity = 0.75; S.key.intensity = 0.55; S.darken(0.38, '#141a2a');
  DOORL.intensity = 7;
  WIN_KIDS.forEach((k, i) => { k.rotation.z = Math.sin(T * 1.3 + i * 1.7) * 0.06; });
  matron.userData.arms[1].rotation.x = -0.3 - 0.35 * Math.max(0, Math.sin(T * 2.2)); // 手まねきする
  const tu = ease((T - 2.8) / 1.8); girl1.rotation.y = lerp(-1.4, -3.06, tu); girl1.userData.head.rotation.y = lerp(1.05, 0, tu); // 最初はこちらを見ていて、建物のほうへ向き直る
  tAge.userData.pop((T - 5.8) / 0.35);
  const u = ease(T / 9);
  look(lerp(-0.9, -0.4, u), lerp(1.0, 1.2, u), lerp(6.4, 5.2, u), 0.2, lerp(2.4, 2.1, u), -3.0, 56);
  return qs;
}
function shotDorm(t) { // 2段目 9〜17：同じ服の子どもたちが並ぶ部屋。端に、ひとりだけ私服の少女
  base(); S.aim(24, 0); lift(120);
  S.hemi.intensity = 0.95; S.key.intensity = 0.7; S.darken(0.25, '#141a2a');
  KIDS.forEach((p, i) => { p.userData.head.rotation.y = lerp(0, 1.0, ease((t - 2.0 - i * 0.12) / 0.8)); }); // みんなが新しい子を見る
  girl2.userData.head.rotation.x = 0.25;
  tHome.userData.pop((t - 1.0) / 0.35); if (t > 4.8) tHome.visible = false;
  const u = ease(t / 8);
  look(lerp(23.2, 25.4, u), lerp(2.0, 1.7, u), lerp(8.2, 6.8, u), lerp(24.0, 25.8, u), 1.0, -0.3, 54);
  return qs;
}
function shotBasement(t) { // 3段目 17〜25：地下の薄暗い部屋。用務員がひとり、背を向けて何かに向き合う。階段から少女がのぞく
  base(); S.aim(48, 0); lift(170);
  S.hemi.intensity = 0.45; S.key.intensity = 0.25; S.darken(0.65, '#0e1016');
  BASE.userData.pl.intensity = 7;
  jan.position.set(48, 0, -0.25); jan.rotation.y = Math.PI; sit(jan); jan.userData.arms.forEach(a => a.rotation.x = -1.0); jan.userData.head.rotation.set(0.3, 0, 0);
  stool1.position.set(48, 0.22, -0.25);
  ORB.visible = true; const os = 0.5 + 0.06 * Math.sin(t * 3); ORB.scale.set(os, os, 1); ORB.material.opacity = 0.7;
  const k = ease(t / 3.0); // 少女が階段を下りてきて、途中で止まってのぞく
  const step = lerp(6, 3, k); girl3.position.set(50.8, 0.2 + step * 0.36, 1.8 - step * 0.42); girl3.rotation.y = -Math.PI / 2 + 0.15; girl3.userData.legs.forEach(l => l.rotation.x = 0); girl3.userData.head.rotation.set(0, 0, 0);
  tJan.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(49.6, 49.3, u), lerp(2.6, 2.3, u), lerp(8.2, 7.2, u), 49.2, 1.3, -0.5, 54);
  return qs;
}
function shotLesson(t) { // 4段目 25〜33：頼みこんで、教えてもらう。机の上の光が強くなる（机の上は映さない高さ）
  base(); S.aim(48, 0); lift(170);
  S.hemi.intensity = 0.45; S.key.intensity = 0.25; S.darken(0.65, '#0e1016');
  BASE.userData.pl.intensity = 7;
  jan.position.set(47.05, 0, -1.0); jan.rotation.y = Math.PI / 2; sit(jan); jan.userData.arms.forEach(a => a.rotation.x = -0.7); jan.userData.head.rotation.set(0.15, t < 2.6 ? -0.6 : 0, 0);
  stool1.position.set(47.05, 0.22, -1.0);
  girl3.position.set(48.95, 0.12, -1.0); girl3.rotation.y = -Math.PI / 2; sit(girl3); girl3.userData.head.rotation.set(t < 2.6 ? -0.15 : 0.15, 0, 0);
  girl3.userData.arms.forEach(a => a.rotation.x = -0.8);
  const g = ease((t - 3.8) / 1.0); ORB.visible = true; const os = lerp(0.45, 1.3, g) * (1 + 0.05 * Math.sin(t * 6)); ORB.scale.set(os, os, 1); ORB.material.opacity = lerp(0.6, 1, g);
  BASE.userData.pl.intensity = 7 + g * 3;
  tGift.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(48, lerp(1.2, 1.12, u), lerp(4.4, 3.6, u), 48, 1.05, -1.0, 52);
  return qs;
}
function shotHall(t) { // 5段目 33〜42：1950年代のアメリカ。大人の男ばかりの大会で、少女が勝ち抜いていく
  base(); S.aim(88, 0); lift(170);
  ORB.visible = false;
  HP.forEach((p, i) => { p.userData.head.rotation.x = 0.25 + Math.sin(t + i) * 0.05; });
  SPECT.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.6 + i) * 0.2; });
  beth5.userData.arms[0].rotation.x = t > 5.0 && t < 5.6 ? -1.0 : -0.4;
  opp5.userData.head.rotation.x = t > 5.8 ? 0.45 : 0.2; // 相手がうつむく
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tUS.visible = false;
  tWin.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(lerp(89.4, 88.6, u), lerp(3.2, 2.4, u), lerp(9.0, 6.2, u), 88, 1.2, -0.6, 54);
  return qs;
}
const DARK = '#06080f';
function shotFinal(t) { // 6段目 42〜49（決め手）：初めて盤が映る。チェス → 向かいに、ソ連の王者
  base(); S.aim(110, 0); lift(150);
  ORB.visible = false;
  const d = ease(t / 0.8);
  S.hemi.intensity = lerp(0.9, 0.12, d); S.key.intensity = lerp(0.8, 0, d); S.darken(d * 0.95, DARK);
  top6.intensity = 60;
  rival.userData.head.rotation.x = 0.2; beth6.userData.head.rotation.x = 0.3;
  const c8 = 0.9 / 8, mv = ease((t - 1.6) / 0.6); const n = P6[3]; n.position.y = 0.03 + Math.sin(mv * Math.PI) * 0.1; n.position.x = -0.45 + c8 * lerp(5.5, 4.5, mv); n.position.z = -0.45 + c8 * lerp(5.5, 3.5, mv); // 白のナイトがひとつ動く
  tChess.userData.pop((t - 0.5) / 0.35); if (t > 3.4) tChess.visible = false;
  tRival.userData.pop((t - 3.8) / 0.35);
  const k = ease((t - 0.2) / 4.0);
  look(lerp(110, 110, k), lerp(2.0, 2.0, k), lerp(1.3, 4.9, k), 110, lerp(0.8, 1.25, k), lerp(0, 0, k), 52);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（盤の上に、光る駒が浮かぶ）
  base(); S.aim(110, 0); lift(150);
  ORB.visible = false;
  S.hemi.intensity = 0.12; S.key.intensity = 0; S.darken(0.95, DARK); top6.intensity = 60;
  rival.userData.head.rotation.x = 0.2; beth6.userData.head.rotation.x = -0.25;
  GP.forEach((p, i) => { const k = easeOut(clamp((t - 0.3 - i * 0.18) / 0.6)); p.visible = k > 0; const a = p.userData.a + t * 0.45; p.position.set(110 + Math.cos(a) * 0.95, lerp(0.9, 2.25, k) + Math.sin(t * 2 + i) * 0.05, Math.sin(a) * 0.55 - 0.1); p.rotation.y = t * 0.6 + i; });
  const k = ease(t / 7);
  look(110, lerp(2.0, 2.6, k), lerp(4.9, 6.4, k), 110, lerp(1.4, 1.6, k), 0, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotArrive },
  { a: 9, b: 17, f: shotDorm },
  { a: 17, b: 25, f: shotBasement },
  { a: 25, b: 33, f: shotLesson },
  { a: 33, b: 42, f: shotHall },
  { a: 42, b: 49, f: shotFinal },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ある日、両親を<br>亡くした少女。'],
  [5.6, 9.0, '連れてこられたのは、<br>古くて大きな建物。'],
  [9.2, 13.2, 'そこは、親のいない<br>子どもたちの施設。'],
  [13.2, 17.0, '9歳の少女の、<br>新しい暮らしが始まる。'],
  [17.2, 21.0, '建物の地下には、<br>薄暗い部屋。'],
  [21.0, 25.0, '用務員の男が、ひとりで<br>何かに向き合っている。'],
  [25.2, 29.0, '少女は頼みこんで、<br>教えてもらうことに。'],
  [29.0, 33.0, '眠っていた才能が、<br>目をさます。'],
  [33.2, 37.4, '舞台は、1950年代の<br>アメリカ。'],
  [37.4, 41.8, '大人の男たちを相手に、<br>大会を勝ち抜いていく。'],
  [42.2, 45.6, '武器は、チェス。<br>やがて、パリ、モスクワへ。'],
  [45.6, 49.0, '立ちはだかるのは、<br>ソ連の王者。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、クイーンズ・<br>ギャンビット。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotHall || f === shotBasement || f === shotLesson,
  meta: {
    id: 'q006', v2: true, answer: 'クイーンズ・ギャンビット',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 606,
    hits: [6.2, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 29.0, 42.2, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '1950年代': 'せんきゅうひゃくごじゅうねんだい', '9歳': 'きゅうさい', '両親': 'りょうしん', '亡くした': 'なくした', '施設': 'しせつ', '地下': 'ちか', '薄暗い': 'うすぐらい', '用務員': 'ようむいん', '何か': 'なにか', '向き合って': 'むきあって', '頼みこんで': 'たのみこんで', '眠っていた': 'ねむっていた', '才能': 'さいのう', '大人': 'おとな', '勝ち抜いて': 'かちぬいて', '武器': 'ぶき', '王者': 'おうじゃ', 'ソ連': 'それん', 'クイーンズ・ギャンビット': 'くいーんず・ぎゃんびっと' },
    caption: 'このドラマのタイトル、わかる？\nある日、両親を亡くした9歳の少女。連れてこられたのは、親のいない子どもたちの施設。建物の地下の薄暗い部屋では、用務員の男がひとりで何かに向き合っていた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'チェス'],
  },
});
applyQuizCards({ answer: 'クイーンズ・<br>ギャンビット', info: 'Netflix｜アメリカ・全7話', answerSize: 104 });
