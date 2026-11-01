import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #006 クイーンズ・ギャンビット（ドラマ・アメリカ・全7話。Netflixで見放題、justwatch.com/jp/テレビ番組/kuinzugiyanbitsuto で2026/11/1確認。Filmarks 4.2）
// 設定：1950年代、両親を亡くした9歳の少女が児童養護施設へ。地下室でひとりチェスを指す用務員に頼みこんで教わり、才能を開花させる。
//       頭の中で盤を動かして練習する。全米の大会を勝ち抜き、メキシコシティ・パリ・モスクワへ。ソ連の王者が立ちはだかる
//       （Filmarks 作品ページ・WATCHA PEDIA・Real Sound の紹介記事・The Review Geek 第1話の紹介）
// 作品の映像・衣装・ロゴ・有名な場面の構図（ベッドから天井の駒を見上げる場面など）は使わず、設定だけを汎用の3Dで見せる。依存症の描写は入れない

const S = quizStage({ bg: '#2a3346', floor: '#3a4256', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(606);

const GIRL = { skin: '#f5d3b5', hair: '#6b4a33', shirt: '#7a8aa0', pants: '#5a6a80', long: true, skirt: true, scale: 0.78 };
const BETH = { skin: '#f5d3b5', hair: '#6b4a33', shirt: '#2f6a5a', pants: '#1f2a2a', long: true, skirt: true };
const JANITOR = { skin: '#efcfae', hair: '#7a7a7a', shirt: '#5a5a4a', pants: '#3a3a30' };
const KID = (i) => ({ skin: ['#f1c9a5', '#f5d3b5', '#e8b98f', '#d9a57c'][i % 4], hair: ['#2c2421', '#4a3426', '#1d1a19', '#9a7a4a'][i % 4], shirt: '#7a8aa0', pants: '#5a6a80', long: true, skirt: true, scale: 0.78 });
const PLAYER = (i) => ({ skin: ['#efcfae', '#e8b98f', '#f1c9a5', '#d9a57c'][i % 4], hair: ['#2c2421', '#1a1a22', '#9a9a9a', '#4a3426'][i % 4], shirt: ['#2b3040', '#4a3a3a', '#3a4a5a', '#2a2a2a'][i % 4], pants: '#22262f', tie: true });
const RIVAL = { skin: '#efcfae', hair: '#1a1a1a', shirt: '#141418', pants: '#141418', tie: true };

// チェス盤と駒（汎用の形）
const BOARD_T = canvasTex(512, 512, (g, w) => { const c = w / 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#6a4a30' : '#e8d8b8'; g.fillRect(x * c, y * c, c, c); } });
function board(size = 0.9) { const g = new THREE.Group(); const b = box(size, 0.05, size, new THREE.MeshLambertMaterial({ map: BOARD_T })); g.add(b); const rim = box(size + 0.08, 0.04, size + 0.08, mat('#3a2a1e')); rim.position.y = -0.02; g.add(rim); return g; }
function piece(kind, white, s = 1) {
  const m = mat(white ? '#f2ece0' : '#1e1e22'); const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.06 * s, 0.03 * s, 12), m); base.position.y = 0.015 * s; g.add(base);
  if (kind === 'p') { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.04 * s, 0.07 * s, 10), m); b.position.y = 0.065 * s; g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.032 * s, 10, 8), m); h.position.y = 0.12 * s; g.add(h); }
  else { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.045 * s, 0.14 * s, 10), m); b.position.y = 0.1 * s; g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.038 * s, 10, 8), m); h.position.y = 0.19 * s; g.add(h);
    if (kind === 'k') { const c1 = box(0.014 * s, 0.07 * s, 0.014 * s, m); c1.position.y = 0.255 * s; g.add(c1); const c2 = box(0.045 * s, 0.014 * s, 0.014 * s, m); c2.position.y = 0.26 * s; g.add(c2); }
    if (kind === 'q') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.04 * s, 0.05 * s, 8), m); c.position.y = 0.24 * s; g.add(c); } }
  g.children.forEach(c => { c.castShadow = true; });
  return g;
}
function setPieces(bd, size = 0.9, s = 1, n = 12) { const c = size / 8; const kinds = ['p', 'p', 'k', 'q', 'p', 'b', 'p', 'p']; const out = []; for (let i = 0; i < n; i++) { const white = i % 2 === 0; const p = piece(kinds[i % 8], white, s); const fx = (i * 3 + 1) % 8, fz = white ? (5 + (i % 3)) % 8 : (i % 3) + 1; p.position.set(-size / 2 + c * (fx + 0.5), 0.03, -size / 2 + c * (fz + 0.5)); bd.add(p); out.push(p); } return out; }
function table(x, z, w = 1.0) { const g = new THREE.Group(); const top = box(w, 0.06, w * 0.8, mat('#5a4030')); top.position.y = 0.76; g.add(top); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.06, 0.74, 0.06, mat('#3a2a1e')); l.position.set(a * (w / 2 - 0.06), 0.37, b * (w * 0.4 - 0.06)); g.add(l); } g.position.set(x, 0, z); return g; }
function sit(p) { p.userData.legs.forEach(l => { l.rotation.x = -1.45; }); p.position.y -= 0.32 * (p.scale.x); }

// ---------- 1. 児童養護施設（x=0） ----------
const HOME = new THREE.Group(); HOME.position.set(0, 0, -6); qs.add(HOME);
{ const wall = mat('#b8ad98');
  const main = box(13, 5.2, 3.2, wall); main.position.y = 2.6; HOME.add(main);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(9.6, 2.2, 4), mat('#4a3a34')); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.25); roof.position.y = 6.3; HOME.add(roof);
  const WIN_ON = new THREE.MeshBasicMaterial({ color: '#ffd98a' }), WIN_OFF = mat('#2a3242');
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { if (r === 0 && (i === 3 || i === 4)) continue; const w = box(0.8, 1.1, 0.08, (i + r) % 3 === 0 ? WIN_ON : WIN_OFF); w.position.set(-5.2 + i * 1.5, 1.6 + r * 2.2, 1.62); HOME.add(w); }
  const door = box(1.6, 2.2, 0.1, mat('#4a3020')); door.position.set(0, 1.1, 1.64); HOME.add(door);
  const step = box(3, 0.24, 1.0, mat('#8a8272')); step.position.set(0, 0.12, 2.1); HOME.add(step);
  const signT = canvasTex(1024, 160, (g, w, h) => { g.fillStyle = '#2e3a2e'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e0c8'; g.font = '900 88px "Noto Serif CJK JP", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('児童養護施設', w / 2, h / 2 + 4); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.62), new THREE.MeshLambertMaterial({ map: signT })); sign.position.set(0, 2.75, 1.66); HOME.add(sign);
  for (let i = 0; i < 9; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 7), mat('#2f4a3a')); tr.position.set(-11 + i * 2.8 + (i > 3 ? 4 : 0), 1.6, -2.6); HOME.add(tr); } }
const KIDS = []; for (let i = 0; i < 6; i++) { const p = makePerson(KID(i)); p.position.set(-2.6 + i * 1.04 + (i > 2 ? 0.0 : 0), 0, -2.6); p.rotation.y = 0; qs.add(p); KIDS.push(p); }
const girl1 = makePerson(GIRL); girl1.position.set(1.2, 0, 2.2); girl1.rotation.y = 0.35; qs.add(girl1);
const suitcase = box(0.4, 0.3, 0.14, mat('#6a3a2a')); suitcase.position.set(1.62, 0.15, 2.3); qs.add(suitcase);
const tAge = tag('9歳の少女', { size: 78, bg: '#e6b450', color: '#14161c' }); tAge.position.set(1.2, 1.95, 2.2); qs.add(tAge);

// ---------- 2〜3. 地下室（x=22） ----------
const BASE = new THREE.Group(); BASE.position.set(22, 0, 0); qs.add(BASE);
let bulb;
{ const back = box(10, 4, 0.2, mat('#5a5a52')); back.position.set(0, 2, -3); BASE.add(back);
  const fl = box(10, 0.06, 7, mat('#4a4a44')); fl.position.y = 0.03; BASE.add(fl);
  for (let i = 0; i < 4; i++) { const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 10, 8), mat('#7a6a5a')); pipe.rotation.z = Math.PI / 2; pipe.position.set(0, 3.3 + i * 0.22, -2.7); BASE.add(pipe); }
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.4, 16), mat('#6a5040')); boiler.position.set(-3.6, 1.2, -2.0); boiler.castShadow = true; BASE.add(boiler);
  // 階段（右奥から下りてくる）
  for (let i = 0; i < 9; i++) { const st = box(1.2, 0.2, 0.42, mat('#6a5a4a')); st.position.set(3.6, 0.1 + i * 0.36, 1.8 - i * 0.42); BASE.add(st); const rs = box(1.2, i * 0.36 + 0.2, 0.42, mat('#5a4a3a')); rs.position.set(3.6, (i * 0.36 + 0.2) / 2, 1.8 - i * 0.42); BASE.add(rs); }
  BASE.add(table(0, -0.6, 1.1));
  bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); bulb.position.set(0, 3.0, -0.6); BASE.add(bulb);
  const cord = box(0.02, 1.0, 0.02, mat('#222')); cord.position.set(0, 3.55, -0.6); BASE.add(cord);
  const pl = new THREE.PointLight(0xffd89a, 0, 8, 1.3); pl.position.set(0, 2.8, -0.6); BASE.add(pl); BASE.userData.pl = pl; }
const BD2 = board(0.8); BD2.position.set(22, 0.82, -0.6); qs.add(BD2); setPieces(BD2, 0.8, 1, 14);
const jan = makePerson(JANITOR); jan.position.set(21.0, 0, -0.6); jan.rotation.y = Math.PI / 2; sit(jan); jan.userData.arms[1].rotation.x = -0.9; qs.add(jan);
const stool1 = box(0.4, 0.45, 0.4, mat('#3a2a1e')); stool1.position.set(21.0, 0.22, -0.6); qs.add(stool1);
const stool2 = box(0.4, 0.45, 0.4, mat('#3a2a1e')); stool2.position.set(23.0, 0.22, -0.6); qs.add(stool2);
const girl2 = makePerson(GIRL); qs.add(girl2);
const tBase = tag('地下室', { size: 84 }); tBase.position.set(23.2, 2.9, -0.8); qs.add(tBase);
const tJan = tag('用務員さん', { size: 78, bg: '#e6b450', color: '#14161c' }); tJan.position.set(21.4, 2.2, -0.6); qs.add(tJan);
const tGift = tag('天才', { size: 96, bg: '#e2483c' }); tGift.position.set(22.75, 2.05, -0.6); qs.add(tGift);

// ---------- 4. 夜、頭の中の盤（x=66） ----------
const NIGHT = new THREE.Group(); NIGHT.position.set(66, 0, 0); qs.add(NIGHT);
const GHOST = new THREE.Group(); GHOST.position.set(66, 2.5, -0.4); qs.add(GHOST);
{ const back = box(10, 4.4, 0.2, mat('#3a4050')); back.position.set(0, 2.2, -3); NIGHT.add(back);
  const win = box(1.4, 1.8, 0.06, new THREE.MeshBasicMaterial({ color: '#2a3a66' })); win.position.set(1.7, 2.4, -2.88); NIGHT.add(win);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: '#f2ecd0' })); moon.position.set(2.0, 2.8, -2.84); NIGHT.add(moon);
  for (let i = 0; i < 4; i++) { const bed = box(1.0, 0.45, 2.0, mat('#5a5a6a')); bed.position.set(-3.8 + i * 1.3, 0.22, -1.6); NIGHT.add(bed); }
  const gl = new THREE.PointLight(0x9ad0ff, 0, 7, 1.4); gl.position.set(0, 3.0, 0.8); NIGHT.add(gl); NIGHT.userData.gl = gl;
  // 光る半透明の盤（線だけ）と、浮かぶ駒
  const gT = canvasTex(512, 512, (g, w) => { const c = w / 8; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? 'rgba(120,200,255,.55)' : 'rgba(120,200,255,.12)'; g.fillRect(x * c, y * c, c, c); } g.strokeStyle = 'rgba(180,230,255,.9)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, w - 6); });
  const gb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: gT, transparent: true, side: THREE.DoubleSide, depthWrite: false })); gb.rotation.x = -Math.PI / 2.6; GHOST.add(gb); }
const GP = []; for (let i = 0; i < 8; i++) { const p = piece(['k', 'q', 'p', 'p', 'b', 'p', 'k', 'p'][i], i % 2 === 0, 2.8); p.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.85; o.material.emissive = new THREE.Color(i % 2 === 0 ? '#3a5a7a' : '#0a1a2a'); } }); p.userData.home = new THREE.Vector3(-0.9 + (i % 4) * 0.6, 0.1, -0.5 + Math.floor(i / 4) * 0.8); GHOST.add(p); GP.push(p); }
const girl4 = makePerson(GIRL); girl4.position.set(66, 0, 0.9); girl4.rotation.y = Math.PI; qs.add(girl4);
const tMind = tag('頭の中の盤', { size: 78, bg: '#e6b450', color: '#14161c' }); tMind.position.set(66, 3.75, -0.4); qs.add(tMind);

// ---------- 5. 大会の会場（x=88） ----------
const HALL = new THREE.Group(); HALL.position.set(88, 0, 0); qs.add(HALL);
{ const back = box(16, 5, 0.2, mat('#6a5a4a')); back.position.set(0, 2.5, -4.2); HALL.add(back);
  const fl = box(16, 0.06, 10, mat('#7a3a34')); fl.position.y = 0.03; HALL.add(fl);
  for (let i = 0; i < 3; i++) { const lamp = box(1.4, 0.1, 0.5, new THREE.MeshBasicMaterial({ color: '#fff2cc' })); lamp.position.set(-4 + i * 4, 4.4, -1.4); HALL.add(lamp); } }
const HP = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const x = 84.6 + i * 3.4, z = -2.6 + r * 2.4; if (i === 1) continue; HALL.add(table(x - 88, z, 0.9)); const bd = board(0.66); bd.position.set(x, 0.82, z); qs.add(bd); setPieces(bd, 0.66, 0.85, 10); for (const s of [-1, 1]) { const p = makePerson(PLAYER(i + r * 3 + (s > 0 ? 1 : 0))); p.position.set(x + s * 0.75, 0, z); p.rotation.y = -s * Math.PI / 2; sit(p); qs.add(p); HP.push(p); } }
const beth5 = makePerson(BETH); beth5.position.set(87.35, 0, -0.2); beth5.rotation.y = Math.PI / 2; sit(beth5); qs.add(beth5);
HALL.add(table(0, -0.2, 0.9)); const bd5 = board(0.66); bd5.position.set(88, 0.82, -0.2); qs.add(bd5); setPieces(bd5, 0.66, 0.85, 10);
const opp5 = makePerson(PLAYER(2)); opp5.position.set(88.75, 0, -0.2); opp5.rotation.y = -Math.PI / 2; sit(opp5); qs.add(opp5);
const tUS = tag('全米の大会', { size: 78 }); tUS.position.set(88, 2.75, -0.2); qs.add(tUS);
const CITY = ['メキシコシティ', 'パリ', 'モスクワ'].map((c, i) => { const t = tag(c, { size: 70, bg: '#e6b450', color: '#14161c' }); qs.add(t); return t; });

// ---------- 6〜7. 最強の相手（x=110） ----------
const FINAL = new THREE.Group(); FINAL.position.set(110, 0, 0); qs.add(FINAL);
FINAL.add(table(0, 0, 1.1));
const BD6 = board(0.8); BD6.position.set(110, 0.82, 0); qs.add(BD6); setPieces(BD6, 0.8, 1, 16);
const beth6 = makePerson(BETH); beth6.position.set(109.15, 0, 0); beth6.rotation.y = Math.PI / 2; sit(beth6); qs.add(beth6);
const rival = makePerson(RIVAL); rival.position.set(110.85, 0, 0); rival.rotation.y = -Math.PI / 2; sit(rival); qs.add(rival);
const top6 = new THREE.SpotLight(0xfff0d0, 0, 12, 0.45, 0.5, 1.2); top6.position.set(110, 6, 1.5); top6.target.position.set(110, 0.8, 0); qs.add(top6); qs.add(top6.target);
const tRival = tag('最強の相手', { size: 72, w: 470, bg: '#e2483c' }); tRival.position.set(110.3, 2.25, 0); qs.add(tRival);

// ---------- shots ----------
const ALLTAG = [tAge, tBase, tJan, tGift, tMind, tUS, ...CITY, tRival];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); BASE.userData.pl.intensity = 0; NIGHT.userData.gl.intensity = 0; top6.intensity = 0; }

function shotHome(t, T) { // 0〜9：施設の前に、ひとりの少女（0秒目がサムネ）
  base(); S.aim(0, 0); lift(150);
  S.hemi.intensity = 1.15; S.key.intensity = 1.2; S.darken(0.12, '#141a2a');
  KIDS.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(T * 0.8 + i) * 0.2; });
  tAge.userData.pop((T - 5.8) / 0.35);
  const u = ease(T / 9);
  look(lerp(2.2, 1.8, u), lerp(2.8, 2.3, u), lerp(10.5, 7.4, u), lerp(0.6, 1.0, u), lerp(2.2, 1.5, u), lerp(-2, 0.4, u), 54);
  return qs;
}
function shotBasement(t) { // 9〜17：地下室で、ひとりチェスを指す用務員
  base(); S.aim(22, 0); lift(200);
  S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.6, '#0e1016');
  BASE.userData.pl.intensity = 7;
  // 少女が階段を下りてきて、少し離れて見る
  const k = ease(t / 3.4);
  girl2.position.set(23.9, 0, 0.9); girl2.position.y = 0; girl2.rotation.y = -Math.PI / 2 - 0.4;
  if (t < 3.4) { girl2.position.set(lerp(25.4, 23.9, k), lerp(2.2, 0, Math.min(1, k * 1.25)), lerp(-0.8, 0.9, k)); }
  tBase.userData.pop((t - 0.6) / 0.35);
  if (t > 4.0) { tBase.visible = false; tJan.userData.pop((t - 4.1) / 0.35); }
  const u = ease(t / 8);
  look(lerp(22.6, 22.4, u), lerp(2.8, 2.6, u), lerp(8.4, 7.6, u), 22.5, 1.3, -0.2, 54);
  return qs;
}
function shotLesson(t) { // 17〜25：教わると、どんどん強くなる
  base(); S.aim(22, 0); lift(200);
  S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.6, '#0e1016');
  BASE.userData.pl.intensity = 7;
  girl2.position.set(23.0, 0.12, -0.6); girl2.rotation.y = -Math.PI / 2; girl2.userData.legs.forEach(l => { l.rotation.x = -1.45; }); girl2.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 3) * 0.1 * (t > 2 && t < 3 ? 1 : 0);
  jan.userData.head.rotation.x = t > 4.0 ? -0.15 : 0;
  tGift.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(22.1, 22.1, u), lerp(2.2, 2.0, u), lerp(5.4, 4.8, u), 22.1, 1.15, -0.6, 52);
  return qs;
}
function resetGirl2() { girl2.userData.legs.forEach(l => { l.rotation.x = 0; }); girl2.userData.arms[0].rotation.x = 0; }
const DARK = '#06080f';
function shotMind(t) { // 25〜33：夜、頭の中の盤で指し直す
  base(); S.aim(66, 0); lift(200);
  S.hemi.intensity = 0.25; S.key.intensity = 0; S.darken(1, '#0a0e1a');
  NIGHT.userData.gl.intensity = lerp(0, 5, ease(t / 1.2));
  GHOST.visible = true; GHOST.rotation.y = Math.sin(t * 0.5) * 0.15;
  GP.forEach((p, i) => { const k = ease((t - 0.6 - i * 0.25) / 0.8); p.position.copy(p.userData.home); p.position.y = lerp(1.6, 0.1, k) + Math.sin(t * 2 + i) * 0.03; p.visible = k > 0; });
  // 1つの駒がすべるように動く
  const mv = ease((t - 5.0) / 1.0); GP[1].position.x = lerp(GP[1].userData.home.x, 0.3, mv); GP[1].position.z = lerp(GP[1].userData.home.z, -0.1, mv);
  tMind.userData.pop((t - 1.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(66.4, 65.8, u), 2.4, lerp(7.4, 6.8, u), 66, 2.2, -0.4, 52);
  return qs;
}
function shotHall(t) { // 33〜42：全米の大会から世界へ
  base(); S.aim(88, 0); lift(200);
  GHOST.visible = false;
  HP.forEach((p, i) => { p.userData.head.rotation.x = 0.25 + Math.sin(t + i) * 0.05; });
  beth5.userData.arms[0].rotation.x = t > 1.6 && t < 2.2 ? -1.0 : -0.4;
  tUS.userData.pop((t - 0.4) / 0.35);
  if (t > 4.2) tUS.visible = false;
  CITY.forEach((c, i) => { c.position.set(88, 2.75, -0.2); const a = 4.5 + i * 1.4; c.userData.pop((t - a) / 0.3); if (i < 2 && t > a + 1.4) c.visible = false; });
  const u = ease(t / 9);
  look(lerp(88.6, 88.2, u), lerp(2.9, 2.7, u), lerp(7.6, 6.8, u), 88, 1.6, -0.6, 54);
  return qs;
}
function shotFinal(t) { // 42〜49：立ちはだかる、ソ連の王者
  base(); S.aim(110, 0); lift(190);
  GHOST.visible = false;
  const d = ease(t / 1.2);
  S.hemi.intensity = lerp(1.25, 0.08, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  top6.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  rival.userData.head.rotation.x = 0.2;
  tRival.userData.pop((t - 3.6) / 0.35);
  const k = ease(t / 6.5);
  look(110, lerp(2.6, 2.2, k), lerp(6.4, 5.4, k), 110, 1.3, 0, 52);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマわかった？
  base(); S.aim(110, 0); lift(190);
  GHOST.visible = false;
  S.hemi.intensity = 0.08; S.key.intensity = 0; S.darken(1, DARK); top6.intensity = 60;
  const k = ease(t / 7);
  look(110, lerp(2.2, 5.2, k), lerp(5.4, 8.0, k), 110, lerp(1.3, 1.0, k), 0, 52);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => { resetGirl2(); return shotHome(t, T); } },
  { a: 9, b: 17, f: (t) => { resetGirl2(); return shotBasement(t); } },
  { a: 17, b: 25, f: shotLesson },
  { a: 25, b: 33, f: shotMind },
  { a: 33, b: 42, f: shotHall },
  { a: 42, b: 49, f: shotFinal },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '1950年代の<br>アメリカ。'],
  [5.6, 9.0, '両親を亡くした9歳の少女が、<br>施設にやってくる。'],
  [9.2, 13.2, 'ある日、<br>地下室で見かけたのは、'],
  [13.2, 17.0, 'ひとりでチェスを指す、<br>用務員さん。'],
  [17.2, 21.0, '頼みこんで、<br>ルールを教わると、'],
  [21.0, 25.0, '人並みはずれた才能が、<br>目をさます。'],
  [25.2, 29.0, '夜になっても、<br>頭の中の盤で、'],
  [29.0, 33.0, '何度も何度も、<br>駒を動かす。'],
  [33.2, 37.4, '全米の大会を<br>勝ち抜き、'],
  [37.4, 41.8, 'やがて、<br>世界の舞台へ。'],
  [42.2, 45.4, '立ちはだかるのは、'],
  [45.4, 49.0, 'ソ連の、<br>チェス王者。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、クイーンズ・<br>ギャンビット。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotHall,
  meta: {
    id: 'q006', v2: true, answer: 'クイーンズ・ギャンビット',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 606,
    hits: [5.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 21.0, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '1950年代': 'せんきゅうひゃくごじゅうねんだい', '9歳': 'きゅうさい', '地下室': 'ちかしつ', '用務員': 'ようむいん', '指す': 'さす', '人並みはずれた': 'ひとなみはずれた', '盤': 'ばん', '駒': 'こま', '全米': 'ぜんべい', '勝ち抜き': 'かちぬき', '王者': 'おうじゃ' },
    caption: 'このドラマのタイトル、わかる？\n1950年代のアメリカ。両親を亡くして施設に来た9歳の少女は、地下室でひとりチェスを指す用務員さんに出会う。全米の大会を勝ち抜き、やがて世界の舞台へ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'チェス'],
  },
});
applyQuizCards({ answer: 'クイーンズ・<br>ギャンビット', info: 'Netflix｜アメリカ・全7話', answerSize: 104 });
