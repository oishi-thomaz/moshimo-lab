import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, makeQ } from '../lib.js';
import { lift, look, runStory, endCard, el } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #002 シャッター アイランド（映画・2010年・138分。Netflixで見放題、2026/10確認）
// 設定：1954年、ボストン沖の孤島にある犯罪者用の精神病院。女性患者の失踪を連邦保安官が捜査する（映画.com 作品ページ）
// 作品の映像・人物・ロゴは使わず、設定だけを汎用の3Dで見せる。結末にはふれない

const S = quizStage({ bg: '#1b2330', floor: null, fogNear: 26, fogFar: 80 });
const qs = S.scene;
const SEA = new THREE.Mesh(new THREE.PlaneGeometry(500, 200), new THREE.MeshLambertMaterial({ color: '#173445', emissive: '#06121a' }));
SEA.rotation.x = -Math.PI / 2; SEA.position.set(60, -0.05, 0); SEA.receiveShadow = true; qs.add(SEA);

// ---------- 共通の小物 ----------
const MARSHAL = { skin: '#efcfae', hair: '#3a2a20', shirt: '#6b5e4e', pants: '#3a3630', tie: true };
const PARTNER = { skin: '#e8b98f', hair: '#1d1a19', shirt: '#4e4a44', pants: '#2b2b2b', tie: true };
function hat(p, color = '#2a2622') {
  const h = p.userData.head; const m = mat(color);
  const brim = box(0.6, 0.04, 0.56, m); brim.position.y = 0.5; h.add(brim);
  const crown = box(0.42, 0.2, 0.4, m); crown.position.y = 0.62; h.add(crown);
}
function makeMarshal(opt = MARSHAL) { const p = makePerson(opt); hat(p); return p; }
function makeDoctor(seed = 0) { return makePerson({ skin: ['#efcfae', '#e8b98f', '#f1c9a5'][seed % 3], hair: ['#9a9a9a', '#2c2421', '#1d1a19'][seed % 3], shirt: '#eef0f2', pants: '#3b3f4a', tie: seed % 2 === 0 }); }
function makePatient(seed = 0) { return makePerson({ skin: ['#efcfae', '#d9a57c', '#f5d3b5'][seed % 3], hair: ['#4a3426', '#6b4a33', '#1a1a22'][seed % 3], shirt: '#c9c6b8', pants: '#c9c6b8', long: seed % 2 === 1 }); }
const barsTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#0d1520'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f3550'; g.fillRect(14, 14, w - 28, h - 28); g.fillStyle = '#c8ccd2'; for (let x = 40; x < w - 20; x += 44) g.fillRect(x, 14, 12, h - 28); g.fillRect(14, 120, w - 28, 10); });
const winTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#8b8a80'; g.fillRect(0, 0, w, h); for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const x = 28 + c * 80, y = 34 + r * 112; g.fillStyle = (r + c) % 5 === 2 ? '#e8d48a' : '#22303c'; g.fillRect(x, y, 48, 72); g.fillStyle = '#4a4a44'; for (let k = 1; k < 4; k++) g.fillRect(x + k * 12 - 2, y, 4, 72); } });
function lighthouse(h = 6) {
  const g = new THREE.Group();
  const white = mat('#ece8de'), red = mat('#b8322a');
  for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.55 - i * 0.04, 0.6 - i * 0.04, h / 6, 20), i % 2 ? red : white); seg.position.y = h / 12 + i * h / 6; seg.castShadow = true; g.add(seg); }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.55, 16), new THREE.MeshBasicMaterial({ color: '#fff2c0' })); lamp.position.y = h + 0.28; g.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 16), mat('#2b2b2b')); roof.position.y = h + 0.8; g.add(roof);
  const beamM = new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 11, 24, 1, true), beamM); beam.rotation.z = Math.PI / 2; beam.position.x = 5.5;
  const pivot = new THREE.Group(); pivot.position.y = h + 0.28; pivot.add(beam); g.add(pivot);
  g.userData = { pivot, beamM };
  return g;
}
function cloud(x, y, z, s = 1) { const g = new THREE.Group(); const m = mat('#2d3440'); for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1.4 * s, 10, 8), m); b.position.set((i - 2) * 1.5 * s, Math.sin(i) * 0.4 * s, (i % 2) * 0.6 * s); b.scale.y = 0.55; g.add(b); } g.position.set(x, y, z); qs.add(g); return g; }
// 雨（縦の線。時間から位置を決めるので静止画でも同じ）
function makeRain(n, cx, cz, w, d, top = 12) {
  const pos = new Float32Array(n * 6), base = []; let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) base.push([cx + (r() - 0.5) * w, r() * top, cz + (r() - 0.5) * d]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: '#9fb4c8', transparent: true, opacity: 0.55 });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; qs.add(L);
  L.userData.set = (t) => { for (let i = 0; i < n; i++) { const [x, y0, z] = base[i]; const y = ((y0 - t * 14) % top + top) % top; pos.set([x - 0.15, y, z, x, y + 0.55, z], i * 6); } g.attributes.position.needsUpdate = true; };
  L.visible = false;
  return L;
}

// ---------- 1. 孤島の精神病院（x=0） ----------
const isle = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.6, 1.2, 10), mat('#4a4a46')); isle.position.set(0, 0.3, -2); isle.receiveShadow = true; qs.add(isle);
const grass = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.5, 0.1, 10), mat('#3f5434')); grass.position.set(0, 0.95, -2); grass.receiveShadow = true; qs.add(grass);
const wallM = new THREE.MeshLambertMaterial({ map: winTex });
const hall = new THREE.Mesh(new THREE.BoxGeometry(6, 2.8, 2.4), [mat('#8b8a80'), mat('#8b8a80'), mat('#55534c'), mat('#55534c'), wallM, mat('#8b8a80')]); hall.position.set(-0.6, 2.4, -3); hall.castShadow = true; qs.add(hall);
const roofA = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.3, 4), mat('#3b3a36')); roofA.rotation.y = Math.PI / 4; roofA.scale.set(1, 1, 0.45); roofA.position.set(-0.6, 4.45, -3); qs.add(roofA);
const tower = box(1.2, 4.6, 1.2, mat('#7a786f')); tower.position.set(-0.6, 3.3, -3.2); qs.add(tower);
const LH1 = lighthouse(5.5); LH1.position.set(4.4, 1, -4.6); qs.add(LH1);
const pier1 = box(0.9, 0.12, 4, mat('#6b5a44')); pier1.position.set(-3.2, 0.5, 4.6); qs.add(pier1);
const ferry = new THREE.Group();
{ const hull = box(2.6, 0.6, 1.1, mat('#2f3a48')); hull.position.y = 0.3; ferry.add(hull); const cab = box(1.2, 0.7, 0.9, mat('#d9d4c8')); cab.position.set(-0.3, 0.95, 0); ferry.add(cab); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.6, 10), mat('#b8322a')); st.position.set(0.3, 1.4, 0); ferry.add(st); }
qs.add(ferry);
[cloud(-4, 9.5, -8, 1.2), cloud(5, 10.5, -10, 1.4), cloud(0, 11, -14, 1.6)];

// ---------- 2. 鍵のかかった病室（x=20） ----------
const cell = new THREE.Group(); cell.position.set(20, 0, 0); qs.add(cell);
{ const fl = box(6, 0.1, 6, mat('#5a5a52')); fl.position.y = -0.05; cell.add(fl);
  const back = box(6, 4, 0.2, mat('#b9b6a8')); back.position.set(0, 2, -3); cell.add(back);
  const left = box(0.2, 4, 6, mat('#a9a698')); left.position.set(-3, 2, 0); cell.add(left);
  const right = box(0.2, 4, 6, mat('#a9a698')); right.position.set(3, 2, 0); cell.add(right);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: barsTex })); win.position.set(0.3, 2.6, -2.88); cell.add(win);
  const bed = box(1.0, 0.45, 2.1, mat('#e4e2da')); bed.position.set(-1.7, 0.42, -1.6); cell.add(bed);
  const frame = box(1.1, 0.2, 2.2, mat('#3a3a3a')); frame.position.set(-1.7, 0.12, -1.6); cell.add(frame);
  const pillow = box(0.7, 0.14, 0.4, mat('#ffffff')); pillow.position.set(-1.7, 0.72, -2.4); cell.add(pillow);
  const door = box(1.1, 2.4, 0.1, mat('#5b6470')); door.position.set(1.95, 1.2, -2.86); cell.add(door);
  const lock = box(0.2, 0.26, 0.08, mat('#d6b45a')); lock.position.set(1.55, 1.25, -2.78); cell.add(lock);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe6a8' })); bulb.position.set(0, 3.7, 0); cell.add(bulb);
}
const m2a = makeMarshal(); m2a.position.set(19.6, 0, 1.6); m2a.rotation.y = Math.PI - 0.3; qs.add(m2a);
const m2b = makeMarshal(PARTNER); m2b.position.set(21.3, 0, 1.2); m2b.rotation.y = Math.PI + 0.3; qs.add(m2b);
const tBed = tag('ベッドは空', { size: 76 }); tBed.position.set(18.4, 1.55, -1.6); qs.add(tBed);
const tWin = tag('窓に鉄格子', { size: 76 }); tWin.position.set(20.3, 3.6, -2.6); qs.add(tWin);
const tDoor = tag('ドアに鍵', { size: 76, bg: '#e2483c' }); tDoor.position.set(21.95, 2.75, -2.6); qs.add(tDoor);

// ---------- 3. 嵐の桟橋（x=40） ----------
const cliff = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 8), mat('#4a4a46')); cliff.position.set(40, 0.3, -6); cliff.receiveShadow = true; qs.add(cliff);
const pier3 = box(1.4, 0.14, 6, mat('#6b5a44')); pier3.position.set(40, 0.55, 0); qs.add(pier3);
for (let z = -2.5; z <= 2.5; z += 1.25) for (const x of [39.4, 40.6]) { const p = box(0.12, 1.0, 0.12, mat('#4a3c2c')); p.position.set(x, 0.1, z); qs.add(p); }
const m3a = makeMarshal(); m3a.position.set(39.7, 0.6, 1.9); m3a.rotation.y = Math.PI / 2 + 0.25; qs.add(m3a);
const m3b = makeMarshal(PARTNER); m3b.position.set(40.2, 0.6, 0.7); m3b.rotation.y = Math.PI / 2 + 0.1; qs.add(m3b);
const ferry3 = ferry.clone(); qs.add(ferry3);
const gate = new THREE.Group(); gate.position.set(40, 0.9, -7.5); qs.add(gate);
{ const w = box(8, 2.4, 0.4, mat('#77756c')); w.position.y = 1.2; gate.add(w); }
const docs = [makeDoctor(0), makeDoctor(1)]; docs.forEach((d, i) => { d.position.set(39.2 + i * 1.6, 0.9, -6.9); qs.add(d); });
const tHide = tag('何かを隠している', { size: 72, bg: '#e2483c' }); tHide.position.set(40, 3.6, -6.9); qs.add(tHide);
const rain = makeRain(900, 40, -1, 26, 22, 12);

// ---------- 4. 立入禁止の灯台（x=60） ----------
const rock4 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 2.2, 9), mat('#3e3e3a')); rock4.position.set(60, 0.8, -4); qs.add(rock4);
const LH4 = lighthouse(9); LH4.position.set(60, 1.9, -4); qs.add(LH4);
const fence = new THREE.Group(); fence.position.set(60, 0, 1.4); qs.add(fence);
for (let x = -2.5; x <= 2.5; x += 0.5) { const p = box(0.06, 1.3, 0.06, mat('#9aa0a6')); p.position.set(x, 0.65, 0); fence.add(p); }
{ const r1 = box(5.2, 0.05, 0.05, mat('#9aa0a6')); r1.position.y = 1.25; fence.add(r1); const r2 = r1.clone(); r2.position.y = 0.4; fence.add(r2); }
const noTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#f2d23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 26, w, 26); g.font = '900 104px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('立入禁止', w / 2, h / 2 + 6); });
const noSign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshLambertMaterial({ map: noTex, emissive: '#3a3008' })); noSign.position.set(60, 0.95, 1.45); qs.add(noSign);
const m4 = makeMarshal(); m4.position.set(60.3, 0, 3.2); m4.rotation.y = Math.PI; qs.add(m4);

// ---------- 5. 病棟の廊下（x=80） ----------
const hallG = new THREE.Group(); hallG.position.set(80, 0, 0); qs.add(hallG);
{ const fl = box(4, 0.1, 22, mat('#6e6a5e')); fl.position.set(0, -0.05, -6); hallG.add(fl);
  for (const s of [-1, 1]) { const w = box(0.2, 3.6, 22, mat('#bfc2b4')); w.position.set(s * 2, 1.8, -6); hallG.add(w);
    for (let z = 2; z > -16; z -= 3.2) { const d = box(0.08, 2.2, 1.0, mat('#5b6470')); d.position.set(s * 1.88, 1.1, z); hallG.add(d); const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ map: barsTex })); wn.position.set(s * 1.83, 1.7, z); wn.rotation.y = -s * Math.PI / 2; hallG.add(wn); } }
  for (let z = 2; z > -16; z -= 4) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.3), new THREE.MeshBasicMaterial({ color: '#fff6dc' })); l.position.set(0, 3.55, z); hallG.add(l); }
}
const crowd5 = [[makeDoctor(0), -0.9, -2.6, 0.3], [makePatient(1), 0.8, -1.4, -0.4], [makeDoctor(2), 0.6, -5.4, 0.1], [makePatient(0), -0.8, -6.6, 0.4], [makeDoctor(1), 0.2, -9.6, 0]];
const Q5 = [];
crowd5.forEach(([p, x, z, r]) => { p.position.set(80 + x, 0, z); p.rotation.y = r; qs.add(p); const q = makeQ(); q.position.set(80 + x, 2.55, z); q.visible = false; qs.add(q); Q5.push(q); });
const m5 = makeMarshal(); m5.position.set(80.8, 0, 0.6); m5.rotation.y = Math.PI; qs.add(m5);

// ---------- 6〜7. 夜の崖（x=110） ----------
const cliff6 = new THREE.Mesh(new THREE.CylinderGeometry(4, 5.5, 3, 9), mat('#3a3a36')); cliff6.position.set(110, 1.4, 0); qs.add(cliff6);
const m6 = makeMarshal(); m6.position.set(110.4, 2.9, 1.6); m6.rotation.y = 0.25; qs.add(m6);
const LH6 = lighthouse(5.5); LH6.position.set(119, 1, -14); qs.add(LH6);
const moon = new THREE.Mesh(new THREE.SphereGeometry(1.8, 20, 14), new THREE.MeshBasicMaterial({ color: '#f1ecd8' })); moon.position.set(104, 14, -30); qs.add(moon);

// ---------- shots ----------
const LHS = [LH1, LH4, LH6];
function base(t) {
  S.reset(); rain.visible = false; moon.visible = false;
  [tBed, tWin, tDoor, tHide].forEach(x => x.visible = false); Q5.forEach(q => q.visible = false);
  LHS.forEach((L, i) => { L.userData.pivot.rotation.y = t * 0.9 + i; L.userData.beamM.opacity = 0.14; });
}
function lightning(t, times) { let f = 0; for (const a of times) { const d = t - a; if (d >= 0 && d < 0.45) f = Math.max(f, d < 0.08 ? 0.6 : d < 0.16 ? 0.15 : d < 0.24 ? 0.45 : 0.45 * (1 - (d - 0.24) / 0.21)); } el.flash.style.opacity = f.toFixed(3); }

function shotIsland(t, T) { // 0〜9：嵐の孤島。0.2秒で雷
  base(T); S.aim(0, -2); lift(170);
  S.hemi.intensity = 0.95; S.darken(0.35);
  lightning(T, [0.2, 6.6]);
  ferry.position.set(lerp(-11, -4.6, easeOut(T / 9)), 0, 4.6); ferry.rotation.y = 0; ferry.position.y = Math.sin(T * 2.2) * 0.06;
  const u = ease(T / 9);
  look(lerp(9.5, 7.5, u), lerp(5.2, 4.4, u), lerp(15.5, 12.5, u), 0, 2.4, -2.2, 50);
  return qs;
}
function shotCell(t) { // 9〜17：鍵のかかった病室
  base(t); S.aim(20, 0); lift(230);
  S.hemi.intensity = 1.0;
  tBed.userData.pop((t - 4.3) / 0.35); tWin.userData.pop((t - 4.9) / 0.35); tDoor.userData.pop((t - 5.5) / 0.35);
  const u = ease(t / 8);
  look(lerp(20.6, 20.3, u), lerp(3.4, 3.1, u), lerp(7.6, 6.4, u), 20.2, 1.6, -1.2, 56);
  return qs;
}
function shotStorm(t) { // 17〜25：嵐で船が出ていく。医者たちは何かを隠している
  base(t); S.aim(40, -2); lift(200);
  S.hemi.intensity = 0.8; S.darken(0.45, '#0a0e14');
  rain.visible = true; rain.userData.set(t);
  lightning(t, [0.8, 5.2]);
  ferry3.position.set(lerp(43.2, 55, ease(t / 6)), Math.sin(t * 2.6) * 0.1, lerp(2.6, 5, ease(t / 6))); ferry3.rotation.set(Math.sin(t * 1.8) * 0.08, -0.3, 0);
  tHide.userData.pop((t - 4.2) / 0.35);
  const k = ease((t - 3.4) / 1.6);
  look(lerp(33.6, 41.5, k), lerp(3.3, 3.4, k), lerp(3.4, 5.4, k), lerp(46, 40, k), lerp(0.8, 2.0, k), lerp(2.8, -6.5, k), 50);
  return qs;
}
function shotLight(t) { // 25〜33：立入禁止の灯台を見上げる
  base(t); S.aim(60, -2); lift(170);
  S.hemi.intensity = 0.7; S.darken(0.55, '#070a10'); LH4.userData.beamM.opacity = 0.22;
  const u = ease(t / 8);
  look(60, lerp(1.4, 1.9, u), lerp(8.6, 7.0, u), 60, lerp(4.5, 8.5, u), -3, 54);
  return qs;
}
function shotWard(t) { // 33〜42：病棟。調べるほど話が合わない
  base(t); S.aim(80, -4); lift(200);
  S.hemi.intensity = 1.0;
  Q5.forEach((q, i) => { const k = (t - (1.2 + i * 0.5)) / 0.3; q.visible = k > 0; q.scale.setScalar(0.55 * Math.min(1, Math.max(0, k)) + 0.0001); });
  const u = ease(t / 9);
  look(lerp(79.6, 79.4, u), lerp(2.8, 2.5, u), lerp(7.0, 5.2, u), 80, 1.4, lerp(-6, -8, u), 52);
  return qs;
}
function shotCliff(t) { // 42〜49：夜の崖にひとり
  base(t); S.aim(110, 0); lift(190); moon.visible = true;
  const d = ease(t / 1.4); S.hemi.intensity = lerp(1.0, 0.35, d); S.key.intensity = lerp(1.5, 0.25, d); S.darken(lerp(0.4, 0.85, d), '#05070b');
  const a = lerp(0.9, 0.4, ease(t / 7));
  look(110 + Math.sin(a) * 7.5, lerp(4.4, 3.9, ease(t / 7)), Math.cos(a) * 7.5 + 1.6, 110.4, 3.6, 1.0, 48);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品わかった？
  base(t); S.aim(110, 0); lift(190); moon.visible = true;
  S.hemi.intensity = 0.35; S.key.intensity = 0.25; S.darken(0.85, '#05070b');
  const k = ease(t / 7);
  look(lerp(112.6, 108, k), lerp(3.9, 9.5, k), lerp(8.3, 11, k), lerp(110.4, 112, k), lerp(3.6, 1.0, k), lerp(1.0, -6, k), lerp(48, 52, k));
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotIsland(t, T) },
  { a: 9, b: 17, f: shotCell },
  { a: 17, b: 25, f: shotStorm },
  { a: 25, b: 33, f: shotLight },
  { a: 33, b: 42, f: shotWard },
  { a: 42, b: 49, f: shotCliff },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.4, '1954年、<br>孤島の精神病院。'],
  [5.4, 9.0, '鍵のかかった部屋から、<br>患者が消えた。'],
  [9.2, 13.2, '捜査に来たのは、<br>連邦保安官。'],
  [13.2, 17.0, 'ベッドは空。<br>窓に鉄格子、ドアに鍵。'],
  [17.2, 21.0, 'そこへ嵐が来て、<br>島から出られない。'],
  [21.0, 25.0, '医者たちは、<br>何かを隠している。'],
  [25.2, 29.0, '島には、<br>立入禁止の灯台。'],
  [29.0, 33.0, 'そこで何が<br>行われている？'],
  [33.2, 37.6, '調べるほど、<br>話が合わなくなる。'],
  [37.6, 41.8, '誰が本当のことを<br>言っている？'],
  [42.2, 45.2, '結末を知ったら、'],
  [45.2, 49.0, 'もう一度、<br>最初から観たくなる。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'わかった人は、<br>コメントで答えて。'],
  [56.4, 59.6, '答えは、<br>シャッター アイランド。'],
  [59.6, 63.6, '観た人は感想を、<br>まだの人は保存して。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotCell || f === shotWard,
  meta: {
    id: 'q002', v2: true,
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 202,
    hits: [5.6, 17.2, 56.4], risers: [52.0],
    impacts: [0.2, 5.6, 56.4],
    sfx: [[9.0, 'whoosh'], [17.0, 'whoosh'], [17.8, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '1954年': 'せんきゅうひゃくごじゅうよねん', '連邦保安官': 'れんぽうほあんかん', '鉄格子': 'てつごうし', '立入禁止': 'たちいりきんし' },
    caption: 'この映画のタイトル、わかる？\n1954年、孤島の精神病院。鍵のかかった部屋から患者が消えた。捜査に来たのは連邦保安官。嵐で島から出られなくなり、医者たちは何かを隠している。\n\n答えは動画の最後で。わかった人はコメントで答えて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画紹介', 'どんでん返し'],
  },
});
applyQuizCards({ answer: 'シャッター アイランド', info: 'Netflix｜映画・138分', answerSize: 80 });
