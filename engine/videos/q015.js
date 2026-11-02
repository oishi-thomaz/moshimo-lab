import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #015 ドント・ルック・アップ（映画・アメリカ・2021年・145分。Netflixで見放題、justwatch.com/jp/映画/dont-look-up-2021 で2026/11/2確認。Filmarks 3.8 filmarks.com/movies/89503）
// 設定：天文学を学ぶ大学院生が新しい彗星を発見。指導教授と計算すると地球に向かっていて、衝突まで約半年。ふたりは大統領に知らせるが、
//       大統領は支持率のことばかりで取り合わない。朝のテレビ番組でも司会者に冗談で流され、彼女はネットで笑いものに、教授はテレビの人気者になる（シネマトゥデイの作品ページ・Netflix の作品紹介）
// 結末には触れない。作品の映像・俳優・実在の建物（ホワイトハウスなど）・ロゴは使わない。大統領や司会者は汎用の3Dの人物

const S = quizStage({ bg: '#1c2440', floor: '#2a3040', fogNear: 30, fogFar: 120 });
const qs = S.scene;
const R = rng(1515);
const KATE = { skin: '#f5d3b5', hair: '#b8502a', shirt: '#5a6a4a', pants: '#2b3346', long: true };
const PROF = { skin: '#efcfae', hair: '#5a4a3a', shirt: '#6a7a8a', pants: '#3b3f4a' };
const PRES = { skin: '#f1c9a5', hair: '#d8c49a', shirt: '#c43a3a', pants: '#2a2a30', long: true };

// 星空
{ const n = 600, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, e = 0.15 + R() * 1.3, r = 90; pos.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, fog: false })); stars.userData.stars = true; qs.add(stars); S.stars = stars; }

// 彗星（光る頭と尾）
function comet() {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: '#eaf6ff', fog: false })); g.add(head);
  const glowT = canvasTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(190,230,255,0.9)'); gr.addColorStop(1, 'rgba(120,180,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); glow.scale.set(6, 6, 1); g.add(glow);
  const tailT = canvasTex(64, 256, (c) => { const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(170,220,255,0.85)'); gr.addColorStop(1, 'rgba(120,170,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 256); });
  const tail = new THREE.Mesh(new THREE.ConeGeometry(1.4, 12, 20, 1, true), new THREE.MeshBasicMaterial({ map: tailT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  tail.rotation.z = Math.PI; tail.position.y = 6; g.add(tail);
  qs.add(g); return g;
}
const COMET = comet();

// ---------- 1. 天文台（x=0） ----------
const OBS = new THREE.Group(); OBS.position.set(0, 0, -4); qs.add(OBS);
{ const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.6, 32), mat('#d8d8dc')); base.position.y = 1.3; OBS.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e8e8ec')); dome.position.y = 2.6; OBS.add(dome);
  const slit = box(0.7, 2.6, 0.2, mat('#14161c')); slit.position.set(0, 3.8, 1.9); slit.rotation.x = -0.6; OBS.add(slit);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.6, 16), mat('#4a4e58')); tube.position.set(0, 4.2, 1.4); tube.rotation.x = -0.75; OBS.add(tube);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); door.position.set(0, 0.9, 2.41); OBS.add(door);
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.6, 8), mat('#1f3328')); t.position.set(-8 + i * 2.3 + R() * 0.6, 1.3, -3 - R() * 3); OBS.add(t); } }
const kate = makePerson(KATE); kate.position.set(-0.8, 0, 0.4); kate.rotation.y = 0.5; qs.add(kate);
const LAPTOP = new THREE.Group(); LAPTOP.position.set(-0.2, 0, 0.9); qs.add(LAPTOP);
{ const st = box(0.8, 0.75, 0.5, mat('#3a3e46')); st.position.y = 0.38; LAPTOP.add(st); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshBasicMaterial({ color: '#8fd0ff' })); scr.position.set(0, 0.95, -0.05); scr.rotation.x = -0.2; LAPTOP.add(scr); }
const tFound = tag('新しい彗星', { size: 74, w: 420, bg: '#e6b450', color: '#14161c' }); qs.add(tFound);
const tCourse = tag('地球に向かっている', { size: 64, w: 600, bg: '#e2483c' }); qs.add(tCourse);
const PATH = new THREE.Group(); qs.add(PATH);
for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#e2483c', fog: false })); PATH.add(d); }

// ---------- 2. 計算のボード（x=30） ----------
const BOARD_C = document.createElement('canvas'); BOARD_C.width = 1024; BOARD_C.height = 640;
const BOARD_T = new THREE.CanvasTexture(BOARD_C); BOARD_T.colorSpace = THREE.SRGBColorSpace;
let lastB = null;
function drawBoard(mode) { if (mode === lastB) return; lastB = mode; const g = BOARD_C.getContext('2d'), w = 1024, h = 640; g.fillStyle = '#f4f6f2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8e96'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.strokeStyle = '#2a4a8a'; g.lineWidth = 6; g.beginPath(); g.ellipse(560, 330, 380, 180, -0.2, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#2a7ad0'; g.beginPath(); g.arc(250, 420, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2a2a2a'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText('地球', 210, 500);
  g.fillStyle = '#5a5a5a'; g.font = '700 46px "Noto Sans CJK JP", sans-serif'; for (let i = 0; i < 4; i++) g.fillText(['a = 2.71 AU', 'e = 0.93', 'v = 38 km/s', 'Δt = ?'][i], 620, 120 + i * 62);
  if (mode === 'hit') { g.strokeStyle = '#e2483c'; g.lineWidth = 10; g.setLineDash([24, 18]); g.beginPath(); g.moveTo(900, 120); g.quadraticCurveTo(560, 200, 270, 400); g.stroke(); g.setLineDash([]); g.fillStyle = '#e2483c'; g.font = '900 78px "Noto Sans CJK JP", sans-serif'; g.fillText('衝突', 300, 300); }
  BOARD_T.needsUpdate = true; }
drawBoard('');
{ const b = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.75), new THREE.MeshBasicMaterial({ map: BOARD_T })); b.position.set(30, 2.3, -2); qs.add(b);
  const wall = box(10, 5, 0.2, mat('#5a6070')); wall.position.set(30, 2.5, -2.2); qs.add(wall); }
const kate2 = makePerson(KATE); kate2.position.set(28.7, 0, 0.2); kate2.rotation.y = 0.35; qs.add(kate2);
const prof2 = makePerson(PROF); prof2.position.set(31.3, 0, 0.3); prof2.rotation.y = -0.35; qs.add(prof2);
const tHalf = tag('衝突まで約半年', { size: 70, w: 520, bg: '#e2483c' }); tHalf.position.set(30, 4.25, -1.6); qs.add(tHalf);
const BOARDL = new THREE.PointLight(0xffffff, 0, 10, 1.2); BOARDL.position.set(30, 3, 2); qs.add(BOARDL);

// ---------- 3. 大統領の部屋（x=60） ----------
const OFFICE = new THREE.Group(); OFFICE.position.set(60, 0, 0); qs.add(OFFICE);
{ const w = box(10, 5, 0.2, mat('#d8cfb8')); w.position.set(0, 2.5, -3); OFFICE.add(w);
  const fl = box(10, 0.06, 8, mat('#3a4a6a')); fl.position.set(0, 0.03, 0.8); OFFICE.add(fl);
  for (const x of [-2.6, 2.6]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ color: '#bcd4ea' })); win.position.set(x, 2.3, -2.88); OFFICE.add(win); const cur = box(0.3, 3.0, 0.1, mat('#8a2a2a')); cur.position.set(x - 0.85, 2.3, -2.8); OFFICE.add(cur); const cur2 = cur.clone(); cur2.position.x = x + 0.85; OFFICE.add(cur2); }
  const desk = box(2.6, 0.85, 1.1, mat('#5a3a24')); desk.position.set(0, 0.43, -1.4); OFFICE.add(desk); }
const pres = makePerson(PRES); pres.position.set(60, 0, -2.1); qs.add(pres);
const kate3 = makePerson(KATE); kate3.position.set(59.0, 0, 1.0); kate3.rotation.y = Math.PI; qs.add(kate3);
const prof3 = makePerson(PROF); prof3.position.set(61.0, 0, 1.1); prof3.rotation.y = Math.PI; qs.add(prof3);
const CHART_C = document.createElement('canvas'); CHART_C.width = 512; CHART_C.height = 384;
const CHART_T = new THREE.CanvasTexture(CHART_C); CHART_T.colorSpace = THREE.SRGBColorSpace;
let lastC = -1;
function drawChart(k) { const q = Math.round(k * 20); if (q === lastC) return; lastC = q; const g = CHART_C.getContext('2d'), w = 512, h = 384; g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('支持率', w / 2, 66);
  g.strokeStyle = '#e6b450'; g.lineWidth = 12; g.lineJoin = 'round'; g.beginPath(); const pts = [[40, 300], [130, 270], [210, 290], [300, 220], [380, 190], [470, 110]]; const n = Math.max(2, Math.ceil(pts.length * k)); pts.slice(0, n).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); CHART_T.needsUpdate = true; }
drawChart(0);
const CHART = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.35), new THREE.MeshBasicMaterial({ map: CHART_T })); CHART.position.set(61.9, 2.7, -2.6); qs.add(CHART);
const tPres = tag('大統領', { size: 76, w: 300, bg: '#14161c' }); tPres.position.set(60, 2.45, -2.1); qs.add(tPres);
const tPoll = tag('支持率が大事', { size: 70, w: 460, bg: '#e2483c' }); tPoll.position.set(60, 2.45, -2.1); qs.add(tPoll);

// ---------- 4. 朝のテレビ番組（x=90） ----------
const STUDIO = new THREE.Group(); STUDIO.position.set(90, 0, 0); qs.add(STUDIO);
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ color: '#f2b880' })); bg.position.set(0, 2.5, -3); STUDIO.add(bg);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), new THREE.MeshBasicMaterial({ color: '#ffe08a' })); sun.position.set(0, 3.1, -2.95); STUDIO.add(sun);
  const fl = box(10, 0.06, 8, mat('#6a4a5a')); fl.position.set(0, 0.03, 0.8); STUDIO.add(fl);
  const sofa = box(3.6, 0.5, 0.9, mat('#3a6aa0')); sofa.position.set(1.2, 0.3, -1.4); STUDIO.add(sofa); const sb = box(3.6, 0.6, 0.2, mat('#3a6aa0')); sb.position.set(1.2, 0.75, -1.85); STUDIO.add(sb);
  const sofa2 = box(1.8, 0.5, 0.9, mat('#e8e2d6')); sofa2.position.set(-2.4, 0.3, -1.2); STUDIO.add(sofa2); const s2b = box(1.8, 0.6, 0.2, mat('#e8e2d6')); s2b.position.set(-2.4, 0.75, -1.65); STUDIO.add(s2b);
  const oT = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#c4302b'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ON AIR', w / 2, h / 2 + 4); });
  const onair = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.45), new THREE.MeshBasicMaterial({ map: oT })); onair.position.set(3.4, 4.3, -2.9); STUDIO.add(onair); }
function sitter(o, x, z, ry) { const p = makePerson(o); p.position.set(x, -0.22, z); p.rotation.y = ry; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); qs.add(p); return p; }
const host1 = sitter({ skin: '#f5d3b5', hair: '#e8c870', shirt: '#e8e2d6', pants: '#2a2a30', long: true }, 87.2, -1.0, 0.5);
const host2 = sitter({ skin: '#d9a57c', hair: '#1d1a19', shirt: '#2a3448', pants: '#2a2a30' }, 88.0, -0.9, 0.3);
const kate4 = sitter(KATE, 90.6, -1.2, -0.2);
const prof4 = sitter(PROF, 91.8, -1.2, -0.3);
const LAUGH = [];
for (let i = 0; i < 6; i++) { const t = tag('ハハハ', { size: 56, w: 260, bg: '#ffffff', color: '#c4302b' }); qs.add(t); LAUGH.push(t); }
const tJoke = tag('冗談で笑いに', { size: 66, w: 460, bg: '#e2483c' }); tJoke.position.set(87.6, 2.6, -0.9); qs.add(tJoke);

// ---------- 5. ネットの笑いものと、テレビの人気者（x=120） ----------
const kate5 = makePerson(KATE); kate5.position.set(119.2, 0, 0); qs.add(kate5);
const prof5 = makePerson(PROF); prof5.position.set(121.3, 0, 0); qs.add(prof5);
const PHONES = [];
for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const b = box(0.42, 0.78, 0.05, mat('#1a1a22')); g.add(b); const sT = canvasTex(128, 224, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#c4302b'; c.font = '900 64px "Noto Sans CJK JP", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['笑', 'w', '草', '笑'][i % 4], w / 2, h / 2); }); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.68), new THREE.MeshBasicMaterial({ map: sT })); sc.position.z = 0.03; g.add(sc); g.userData.a = i / 8 * Math.PI * 2; qs.add(g); PHONES.push(g); }
const SPOT2 = new THREE.SpotLight(0xfff2c8, 0, 12, 0.35, 0.4, 1); SPOT2.position.set(121.3, 6, 2); SPOT2.target.position.set(121.3, 0, 0); qs.add(SPOT2); qs.add(SPOT2.target);
const STARS2 = [];
for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: '#ffd84a' })); s.userData.a = i / 5 * Math.PI * 2; qs.add(s); STARS2.push(s); }
const tMeme = tag('ネットの笑いもの', { size: 60, w: 520, bg: '#14161c' }); tMeme.position.set(119.4, 2.6, 0); qs.add(tMeme);
const tStar = tag('人気者に', { size: 66, w: 340, bg: '#e6b450', color: '#14161c' }); tStar.position.set(121.2, 2.6, 0); qs.add(tStar);

// ---------- shots ----------
const ALL = [tFound, tCourse, tHalf, tPres, tPoll, tJoke, tMeme, tStar, ...LAUGH];
ALL.forEach(x => { x.material.fog = false; });
function base() { S.reset(); ALL.forEach(x => x.visible = false); COMET.visible = false; PATH.visible = false; BOARDL.intensity = 0; SPOT2.intensity = 0; S.stars.visible = false; PHONES.forEach(p => p.visible = false); STARS2.forEach(s => s.visible = false); }
function night(k = 1) { S.hemi.intensity = lerp(1.25, 0.45, k); S.key.intensity = lerp(1.5, 0.15, k); S.stars.visible = true; }
function cometAt(x, y, z, s) { COMET.visible = true; COMET.position.set(x, y, z); COMET.scale.setScalar(s); COMET.rotation.z = 0.7; }

function shotObs(t, T) { // 0〜9：天文台。新しい彗星を見つける（0秒目がサムネ）
  base(); night(); S.aim(0, -2); lift(-260);
  cometAt(5, 17, -30, 1.4 + T * 0.03);
  kate.userData.arms[1].rotation.x = T > 2.4 ? -2.6 : -0.3; kate.userData.head.rotation.x = -0.4;
  tFound.position.set(-0.2, 3.6, 3.0); tFound.userData.pop((T - 2.9) / 0.35);
  if (T > 5.6) { tFound.visible = false; PATH.visible = true; const n = PATH.children.length; PATH.children.forEach((d, i) => { const u = i / (n - 1); d.visible = u < (T - 5.6) / 1.4; d.position.set(lerp(5, 0.4, u), lerp(17, 6.4, u) - Math.sin(u * Math.PI) * 1.5, lerp(-30, 6, u)); }); tCourse.position.set(-0.2, 4.7, 3.0); tCourse.userData.pop((T - 6.6) / 0.35); }
  const u = ease(T / 9);
  look(lerp(-1.8, -1.2, u), lerp(1.4, 1.6, u), lerp(8.6, 9.6, u), lerp(1.2, 1.6, u), lerp(4.6, 5.4, u), -6, 58);
  return qs;
}
function shotBoard(t) { // 9〜17：計算すると衝突まで約半年。教授と知らせに行く
  base(); S.aim(30, 0); lift(80);
  S.darken(0.3, '#2a3048'); BOARDL.intensity = 6;
  drawBoard(t > 1.0 ? 'hit' : '');
  tHalf.userData.pop((t - 2.0) / 0.35);
  prof2.rotation.y = t > 4.2 ? lerp(-0.35, Math.PI * 0.8, ease((t - 4.2) / 0.8)) : -0.35; kate2.rotation.y = t > 4.4 ? lerp(0.35, Math.PI * 0.8, ease((t - 4.4) / 0.8)) : 0.35;
  const u = ease(t / 8);
  look(lerp(30.4, 30.0, u), lerp(2.4, 2.2, u), lerp(8.4, 7.4, u), 30, 2.0, -1, 54);
  return qs;
}
function shotOffice(t) { // 17〜25：大統領が気にするのは支持率のことばかり
  base(); S.aim(60, -1); lift(60);
  drawChart(clamp((t - 3.6) / 2.2));
  if (t < 3.8) tPres.userData.pop((t - 0.5) / 0.35); else tPoll.userData.pop((t - 4.0) / 0.35);
  pres.rotation.y = t > 3.8 ? lerp(0, 0.9, ease((t - 3.8) / 0.8)) : 0;
  const u = ease(t / 8);
  look(lerp(60.6, 60.4, u), lerp(2.5, 2.3, u), lerp(7.4, 6.4, u), 60.4, 1.5, -1.6, 54);
  return qs;
}
function shotTV(t) { // 25〜33：朝のテレビ番組。司会者は冗談で笑いに変える
  base(); S.aim(90, -1); lift(80);
  [host1, host2].forEach((h, i) => { h.userData.head.rotation.x = t > 4 ? Math.sin(t * 9 + i) * 0.12 - 0.1 : 0; h.userData.arms.forEach(a => a.rotation.x = t > 4 ? -0.6 + Math.sin(t * 8 + i) * 0.2 : -0.2); });
  kate4.userData.arms.forEach(a => a.rotation.x = t < 3.8 ? -0.9 + Math.sin(t * 6) * 0.4 : -0.1);
  LAUGH.forEach((l, i) => { l.position.set(87.5 + (i % 3) * 0.75, 2.0 + Math.floor(i / 3) * 0.55 + Math.sin(t * 3 + i) * 0.05, -0.8); l.userData.pop((t - 4.2 - i * 0.12) / 0.3); });
  tJoke.position.set(88.6, 3.3, -0.9); tJoke.userData.pop((t - 5.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(89.4, 89.2, u), lerp(2.3, 2.1, u), lerp(8.0, 7.2, u), 89.3, 1.4, -1, 54);
  return qs;
}
function shotFame(t) { // 33〜42：彼女はネットの笑いもの、教授はテレビの人気者に
  base(); S.aim(120, 0); lift(120);
  S.darken(0.5, '#1a2236');
  PHONES.forEach((p, i) => { const k = easeOut(clamp((t - 0.6 - i * 0.12) / 0.4)); p.visible = k > 0; const a = p.userData.a + t * 0.4; p.position.set(119.2 + Math.cos(a) * 0.95, 1.3 + Math.sin(a * 2) * 0.35 + 0.3, Math.sin(a) * 0.6 + 0.2); p.rotation.y = -a + Math.PI / 2; p.scale.setScalar(Math.max(0.001, k)); });
  tMeme.userData.pop((t - 1.6) / 0.35);
  if (t > 4.2) { SPOT2.intensity = 80 * ease((t - 4.2) / 0.6); STARS2.forEach((s, i) => { s.visible = true; const a = s.userData.a + t; s.position.set(121.3 + Math.cos(a) * 0.7, 2.25 + Math.sin(a * 1.5) * 0.1, Math.sin(a) * 0.35); s.rotation.y = t * 2; }); tStar.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(120.25, lerp(2.2, 2.0, u), lerp(8.0, 7.2, u), 120.25, 1.4, 0, 56);
  return qs;
}
const DARK = '#04060c';
function shotTwist(t, T) { // 42〜49：空からは彗星が近づいてくる
  base(); night(); S.aim(0, -2); lift(0); S.darken(0.5, DARK);
  cometAt(lerp(5, 3, ease(t / 7)), lerp(17, 13, ease(t / 7)), lerp(-30, -18, ease(t / 7)), lerp(1.7, 3.0, ease(t / 7)));
  kate.userData.arms[1].rotation.x = -0.3; kate.userData.head.rotation.x = -0.5; kate.rotation.y = Math.PI * 0.9;
  const k = ease(t / 7);
  look(lerp(-1.2, -0.4, k), lerp(1.6, 0.8, k), lerp(9.6, 7.0, k), lerp(1.6, 2.4, k), lerp(5.4, 9.0, k), -10, 58);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：この映画、わかった？
  base(); night(); S.aim(0, -2); lift(0); S.darken(0.5, DARK);
  cometAt(lerp(3, 2.4, ease(t / 7)), lerp(13, 11.5, ease(t / 7)), lerp(-18, -14, ease(t / 7)), lerp(3.0, 3.6, ease(t / 7)));
  kate.userData.arms[1].rotation.x = -0.3; kate.userData.head.rotation.x = -0.5; kate.rotation.y = Math.PI * 0.9;
  const k = ease(t / 7);
  look(lerp(-0.4, -0.2, k), 0.8, lerp(7.0, 8.0, k), 2.4, 9.0, -10, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotObs(t, T) },
  { a: 9, b: 17, f: shotBoard },
  { a: 17, b: 25, f: shotOffice },
  { a: 25, b: 33, f: shotTV },
  { a: 33, b: 42, f: shotFame },
  { a: 42, b: 49, f: (t, T) => shotTwist(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '天文学を学ぶ大学院生が、<br>新しい彗星を発見。'],
  [5.6, 9.0, '計算すると、<br>地球に向かっていた。'],
  [9.2, 13.2, '衝突まで、<br>およそ半年。'],
  [13.2, 17.0, '教授とふたりで、<br>急いで知らせに行く。'],
  [17.2, 21.0, 'でも、大統領が<br>気にするのは'],
  [21.0, 25.0, '支持率のことばかり。'],
  [25.2, 29.0, '朝のテレビ番組で<br>訴えても、'],
  [29.0, 33.0, '司会者は、<br>冗談で笑いに変える。'],
  [33.2, 37.4, '必死な彼女は、<br>ネットの笑いもの。'],
  [37.4, 41.8, '教授は、<br>テレビの人気者に。'],
  [42.2, 45.4, 'そのあいだにも、<br>彗星は近づいてくる。'],
  [45.4, 49.0, '世界は、本当の危機に<br>気づけるのか。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ドント・ルック・アップ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q015', v2: true, answer: 'ドント・ルック・アップ',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 1515,
    hits: [5.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 9.2, 29.0, 56.4],
    sfx: [[0.2, 'whoosh'], [5.7, 'alarm'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '天文学': 'てんもんがく', '学ぶ': 'まなぶ', '大学院生': 'だいがくいんせい', '彗星': 'すいせい', '発見': 'はっけん', '計算': 'けいさん', '地球': 'ちきゅう', '衝突': 'しょうとつ', '半年': 'はんとし', '教授': 'きょうじゅ', '急いで': 'いそいで', '大統領': 'だいとうりょう', '支持率': 'しじりつ', '番組': 'ばんぐみ', '訴えても': 'うったえても', '司会者': 'しかいしゃ', '冗談': 'じょうだん', '必死': 'ひっし', '彼女': 'かのじょ', '人気者': 'にんきもの', '世界': 'せかい', '本当': 'ほんとう', '危機': 'きき' },
    caption: 'この映画のタイトル、わかる？\n天文学を学ぶ大学院生が見つけた新しい彗星は、地球に向かっていた。衝突まで約半年。でも大統領は支持率のことばかり、朝のテレビ番組では冗談で流される。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画紹介', '洋画'],
  },
});
applyQuizCards({ answer: 'ドント・ルック・<br>アップ', info: 'Netflix｜映画・145分', answerSize: 104 });
