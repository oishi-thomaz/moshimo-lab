import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, el } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #002 シャッター アイランド（映画・2010年・138分。Netflixで見放題、2026/10確認）
// 設定：1954年、ボストン沖の孤島にある犯罪者用の精神病院。女性患者の失踪を連邦保安官が捜査する（映画.com 作品ページ）
// 作品の映像・人物・ロゴは使わず、設定だけを汎用の3Dで見せる。結末にはふれない
// 追加の事実（2026/11/2 確認）：
//   女性患者は前夜、鍵のかかった病室から消えていた（WATCHA pedia 作品ページ pedia.watcha.com/ja/contents/m5xJLaO）
//   裸足の女性が鍵のかかった部屋から消えた。島に巨大なハリケーンが迫る（原作の紹介文 penguin.co.uk/books/1011755/shutter-island）
//   島は四方を海に囲まれている（ぴあ映画 lp.p.pia.jp/event/movie/16566）
//   精神を病んだ犯罪者だけを収容する病院が建つ絶海の孤島。マーティン・スコセッシ監督とレオナルド・ディカプリオの4度目のタッグ（allcinema.net/cinema/334301）
//   監督 マーティン・スコセッシ、主演 レオナルド・ディカプリオ（映画.com 作品ページ eiga.com/movie/53192）
// 結末・どんでん返しにかかわる要素は字幕にも映像にも一切出さない（ほのめかしもしない）。衣装・有名な場面の構図もなぞらない

const S = quizStage({ bg: '#1b2330', floor: null, fogNear: 30, fogFar: 95 });
const qs = S.scene;
const R = rng(202);
const SEA = new THREE.Mesh(new THREE.PlaneGeometry(500, 200), new THREE.MeshLambertMaterial({ color: '#173445', emissive: '#06121a' }));
SEA.rotation.x = -Math.PI / 2; SEA.position.set(60, -0.05, 0); SEA.receiveShadow = true; qs.add(SEA);

// ---------- 共通の小物 ----------
const HERO = { skin: '#efcfae', hair: '#3a2a20', shirt: '#5e5a52', pants: '#3a3630', tie: true };
function makeDoctor(seed = 0) { return makePerson({ skin: ['#efcfae', '#e8b98f', '#f1c9a5'][seed % 3], hair: ['#9a9a9a', '#2c2421', '#1d1a19'][seed % 3], shirt: '#eef0f2', pants: '#3b3f4a', tie: seed % 2 === 0 }); }
function makePatient(seed = 0) { return makePerson({ skin: ['#efcfae', '#d9a57c', '#f5d3b5'][seed % 3], hair: ['#4a3426', '#6b4a33', '#1a1a22'][seed % 3], shirt: '#c9c6b8', pants: '#c9c6b8', long: seed % 2 === 1 }); }
const barsTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#0d1520'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f3550'; g.fillRect(14, 14, w - 28, h - 28); g.fillStyle = '#c8ccd2'; for (let x = 40; x < w - 20; x += 44) g.fillRect(x, 14, 12, h - 28); g.fillRect(14, 120, w - 28, 10); });
// 建物の窓（昼は暗い窓、夜は emissive で一部が灯る）
const WIN_LIT = [];
const winTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#8b8a80'; g.fillRect(0, 0, w, h); for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const x = 28 + c * 80, y = 34 + r * 112; g.fillStyle = '#22303c'; g.fillRect(x, y, 48, 72); g.fillStyle = '#4a4a44'; for (let k = 1; k < 4; k++) g.fillRect(x + k * 12 - 2, y, 4, 72); } });
const winEmi = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { if ((r * 3 + c * 7) % 4 === 1) continue; const x = 28 + c * 80, y = 34 + r * 112; g.fillStyle = '#ffffff'; g.fillRect(x, y, 48, 72); g.fillStyle = '#000'; for (let k = 1; k < 4; k++) g.fillRect(x + k * 12 - 2, y, 4, 72); } });
function winMat() { const m = new THREE.MeshLambertMaterial({ map: winTex, emissiveMap: winEmi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0 }); WIN_LIT.push(m); return m; }
// 光の筋（先端が原点、-Y 方向に広がる円すい）。aimBeam で向ける
const DOWN = new THREE.Vector3(0, -1, 0);
function beamMesh(len, rad, color = '#ffe9a8', op = 0.16) {
  const geo = new THREE.ConeGeometry(rad, len, 24, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  m.userData.len = len; m.renderOrder = 4; return m;
}
const _v = new THREE.Vector3();
function aimBeam(m, from, to) { m.position.copy(from); _v.copy(to).sub(from); const d = _v.length(); m.quaternion.setFromUnitVectors(DOWN, _v.normalize()); m.scale.set(1, d / m.userData.len, 1); }
function cloud(x, y, z, s = 1, color = '#2d3440') { const g = new THREE.Group(); const m = mat(color); for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1.4 * s, 10, 8), m); b.position.set((i - 2) * 1.5 * s, Math.sin(i) * 0.4 * s, (i % 2) * 0.6 * s); b.scale.y = 0.55; g.add(b); } g.position.set(x, y, z); qs.add(g); return g; }
// 雨（縦の線。時間から位置を決めるので静止画でも同じ）
function makeRain(n, cx, cz, w, d, top = 12, y0 = 0) {
  const pos = new Float32Array(n * 6), base = []; let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) base.push([cx + (r() - 0.5) * w, r() * top, cz + (r() - 0.5) * d]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: '#9fb4c8', transparent: true, opacity: 0.5 });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; qs.add(L);
  L.userData.set = (t) => { for (let i = 0; i < n; i++) { const [x, yb, z] = base[i]; const y = y0 + ((yb - t * 14) % top + top) % top; pos.set([x - 0.15, y, z, x, y + 0.55, z], i * 6); } g.attributes.position.needsUpdate = true; };
  L.visible = false;
  return L;
}
function lightning(t, times) { let f = 0; for (const a of times) { const d = t - a; if (d >= 0 && d < 0.45) f = Math.max(f, d < 0.08 ? 0.6 : d < 0.16 ? 0.15 : d < 0.24 ? 0.45 : 0.45 * (1 - (d - 0.24) / 0.21)); } el.flash.style.opacity = f.toFixed(3); return f; }
function starBadge() {
  const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.045 : 0.1; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); } sh.closePath();
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), new THREE.MeshLambertMaterial({ color: '#d8b04a', emissive: '#5a3c08' }));
  return m;
}

// ---------- 1段目. 鍵のかかった部屋（x=0）。0秒目がサムネ ----------
const nightWinTex = canvasTex(256, 220, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#20344e'); gr.addColorStop(1, '#0c1626'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(170,200,230,.45)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = (i * 53) % w, y = (i * 97) % h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 22); g.stroke(); } g.fillStyle = '#d6d2c4'; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 12, w, 12); g.fillRect(0, 0, 12, h); g.fillRect(w - 12, 0, 12, h); g.fillRect(w / 2 - 6, 0, 12, h); g.fillRect(0, h / 2 - 6, w, 12); });
const ROOM = new THREE.Group(); qs.add(ROOM);
let ALARM, ALARM_L, DOORWIN, LOCK;
{ const fl = box(6.4, 0.1, 8, mat('#5a5a52')); fl.position.set(0, -0.05, 0.8); ROOM.add(fl);
  const back = box(6.4, 4.2, 0.2, mat('#b9b6a8')); back.position.set(0, 2.1, -3); ROOM.add(back);
  for (const s of [-1, 1]) { const w = box(0.2, 4.2, 8, mat('#a9a698')); w.position.set(s * 3.1, 2.1, 0.8); ROOM.add(w); }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ map: nightWinTex })); win.position.set(-0.6, 3.0, -2.88); ROOM.add(win);
  const frame = box(1.1, 0.2, 2.2, mat('#3a3a3a')); frame.position.set(-1.4, 0.12, -1.6); ROOM.add(frame);
  const bed = box(1.0, 0.36, 2.1, mat('#e4e2da')); bed.position.set(-1.4, 0.4, -1.6); ROOM.add(bed);
  const pillow = box(0.7, 0.14, 0.4, mat('#ffffff')); pillow.position.set(-1.4, 0.65, -2.4); ROOM.add(pillow);
  const blanket = box(1.0, 0.06, 1.1, mat('#8a9aa8')); blanket.position.set(-0.75, 0.42, -0.85); blanket.rotation.set(0.1, 0.2, -1.0); ROOM.add(blanket);
  for (const [x, z, r] of [[-0.15, -0.55, 0.3], [0.12, -0.38, -0.15]]) { const sh = box(0.13, 0.1, 0.3, mat('#5a3a26')); sh.position.set(x, 0.05, z); sh.rotation.y = r; ROOM.add(sh); }
  const door = box(1.1, 2.4, 0.1, mat('#5b6470')); door.position.set(1.35, 1.2, -2.86); ROOM.add(door);
  DOORWIN = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); DOORWIN.position.set(1.35, 1.85, -2.8); ROOM.add(DOORWIN);
  LOCK = box(0.2, 0.26, 0.08, new THREE.MeshLambertMaterial({ color: '#d6b45a', emissive: '#3a2a00' })); LOCK.position.set(0.95, 1.2, -2.78); ROOM.add(LOCK);
  ALARM = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 14), new THREE.MeshBasicMaterial({ color: '#ff3b2e' })); ALARM.position.set(1.35, 2.75, -2.8); ALARM.rotation.x = Math.PI / 2; ROOM.add(ALARM);
  ALARM_L = new THREE.PointLight(0xff3b2e, 0, 9, 1.2); ALARM_L.position.set(1.35, 2.7, -2.3); ROOM.add(ALARM_L); }
const ROOM_SPOT = new THREE.SpotLight(0xfff2c8, 0, 9, 0.32, 0.5, 1.1); qs.add(ROOM_SPOT); qs.add(ROOM_SPOT.target);
const ROOM_BEAM = beamMesh(4, 0.55, '#fff2c8', 0.13); qs.add(ROOM_BEAM);
const tBed = tag('ベッドは空', { size: 76 }); tBed.position.set(-1.4, 1.5, -1.3); qs.add(tBed);
const tLock = tag('ドアに鍵', { size: 76, bg: '#e2483c' }); tLock.position.set(1.35, 3.2, -2.6); qs.add(tLock);
const tShoes = tag('靴は置いたまま', { size: 64, w: 520 }); tShoes.position.set(0.15, 0.85, -0.4); qs.add(tShoes);

// ---------- 2段目. 船着き場へ向かう捜査官（x=20） ----------
const PIER = new THREE.Group(); PIER.position.set(20, 0, 0); qs.add(PIER);
{ const deck = box(1.8, 0.14, 16, mat('#6b5a44')); deck.position.set(0, 0.5, -3); PIER.add(deck);
  for (let z = 4.5; z >= -10.5; z -= 1.5) for (const x of [-0.8, 0.8]) { const p = box(0.14, 1.2, 0.14, mat('#4a3c2c')); p.position.set(x, 0.0, z); PIER.add(p); }
  for (let z = 4.5; z >= -10.5; z -= 3) { const b = box(0.2, 0.36, 0.2, mat('#3a2e22')); b.position.set(0.8, 0.74, z); PIER.add(b); } }
const BOAT = new THREE.Group();
{ const hull = box(1.4, 0.7, 4.2, mat('#2f3a48')); hull.position.y = 0.3; BOAT.add(hull); const bow = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 4), mat('#2f3a48')); bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.5); bow.position.set(0, 0.3, -2.7); BOAT.add(bow);
  const cab = box(1.1, 0.9, 1.4, mat('#d9d4c8')); cab.position.set(0, 1.1, 0.3); BOAT.add(cab); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.7, 10), mat('#7a2a24')); st.position.set(0, 1.85, 0.6); BOAT.add(st);
  const rail = box(1.42, 0.08, 4.0, mat('#c9c4b4')); rail.position.y = 0.72; BOAT.add(rail); }
BOAT.position.set(21.75, 0, -6.5); qs.add(BOAT);
const hero2 = makePerson(HERO); hero2.position.set(20, 0.57, 3); qs.add(hero2);
const CASE = box(0.36, 0.26, 0.1, mat('#4a3020')); CASE.position.set(0, -0.72, 0); hero2.userData.arms[1].add(CASE);
const tAgent = tag('捜査官', { size: 80, w: 320, bg: '#e6b450', color: '#14161c' }); qs.add(tAgent);
const GULLS = [0, 1, 2].map(i => { const g = new THREE.Group(); const m = mat('#e8e8e2'); for (const s of [-1, 1]) { const w = box(0.34, 0.03, 0.1, m); w.position.x = s * 0.17; w.rotation.z = s * 0.35; g.add(w); } qs.add(g); return g; });

// ---------- 3段目・6段目・クイズ. 海に囲まれた島（x=50） ----------
const IC = new THREE.Vector3(50, 0, -4);
const ISLE = new THREE.Group(); ISLE.position.copy(IC); qs.add(ISLE);
const TOWERS = [];
{ const rock = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 10.2, 1.8, 12), mat('#4a4a46')); rock.position.y = 0.2; rock.receiveShadow = true; ISLE.add(rock);
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(8.3, 8.6, 0.1, 12), mat('#3f5434')); grass.position.y = 1.15; grass.receiveShadow = true; ISLE.add(grass);
  const foam = new THREE.Mesh(new THREE.RingGeometry(10.0, 11.2, 40), new THREE.MeshBasicMaterial({ color: '#cfe0ea', transparent: true, opacity: 0.32, side: THREE.DoubleSide })); foam.rotation.x = -Math.PI / 2; foam.position.y = 0.02; ISLE.add(foam); ISLE.userData.foam = foam;
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 + (i % 3) * 0.4), mat('#3e3e3a')); const a = i * 1.1 + 0.4; r.position.set(Math.cos(a) * 9.6, 0.3, Math.sin(a) * 9.6); ISLE.add(r); }
  const wallM = mat('#8a877c');
  const W = (w, d, x, z) => { const b = box(w, 1.4, d, wallM); b.position.set(x, 1.85, z); ISLE.add(b); };
  W(12.4, 0.3, 0, -4.4); W(0.3, 8.6, -6.2, -0.1); W(0.3, 8.6, 6.2, -0.1); W(5.2, 0.3, -3.6, 4.2); W(5.2, 0.3, 3.6, 4.2);
  for (const s of [-1, 1]) { const gp = box(0.5, 1.9, 0.5, mat('#6e6c64')); gp.position.set(s * 1.0, 2.1, 4.2); ISLE.add(gp); }
  const hall = new THREE.Mesh(new THREE.BoxGeometry(6, 2.8, 2.4), [mat('#8b8a80'), mat('#8b8a80'), mat('#55534c'), mat('#55534c'), winMat(), mat('#8b8a80')]); hall.position.set(0, 2.6, -1.8); hall.castShadow = true; ISLE.add(hall);
  const roofA = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.3, 4), mat('#3b3a36')); roofA.rotation.y = Math.PI / 4; roofA.scale.set(1, 1, 0.45); roofA.position.set(0, 4.65, -1.8); ISLE.add(roofA);
  const tw = box(1.2, 4.6, 1.2, mat('#7a786f')); tw.position.set(0, 3.5, -2.0); ISLE.add(tw);
  for (const s of [-1, 1]) { const wd = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 2.2), [mat('#8b8a80'), mat('#8b8a80'), mat('#55534c'), mat('#55534c'), winMat(), mat('#8b8a80')]); wd.position.set(s * 4.0, 2.15, 0.8); wd.castShadow = true; ISLE.add(wd); const rf = box(2.6, 0.2, 2.4, mat('#3b3a36')); rf.position.set(s * 4.0, 3.2, 0.8); ISLE.add(rf); }
  for (const [x, z] of [[-6.2, -4.4], [6.2, -4.4], [-6.2, 4.2], [6.2, 4.2]]) { const p = box(0.6, 3.0, 0.6, mat('#6e6c64')); p.position.set(x, 2.6, z); ISLE.add(p); const cab = box(1.0, 0.7, 1.0, mat('#55534c')); cab.position.set(x, 4.4, z); ISLE.add(cab); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff2c0' })); lamp.position.set(x, 4.85, z); ISLE.add(lamp); const b = beamMesh(10, 0.9, '#fff0b8', 0.12); qs.add(b); TOWERS.push({ from: new THREE.Vector3(IC.x + x, 4.85, IC.z + z), beam: b, lamp }); }
  for (let i = 0; i < 9; i++) { const a = i * 0.7 + 2.2, r = 7.0 + (i % 2) * 0.6; const tr = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 8), mat('#2f4228')); tr.position.set(Math.cos(a) * r, 1.95, Math.sin(a) * r); if (Math.abs(tr.position.x) < 6.5 && Math.abs(tr.position.z) < 4.6) continue; ISLE.add(tr); }
  const dock = box(1.2, 0.12, 3.4, mat('#6b5a44')); dock.position.set(0, 0.5, 10.6); ISLE.add(dock); }
// 渦を巻く嵐の雲（島のまわりをゆっくり回る）
const SWIRL = []; for (let i = 0; i < 12; i++) { const c = cloud(0, 0, 0, 1.1 + (i % 3) * 0.35, i % 2 ? '#2d3440' : '#384150'); c.userData.a = i / 12 * Math.PI * 2; c.userData.r = 13 + (i % 4) * 3.2; c.userData.y = 12 + (i % 3) * 1.4; SWIRL.push(c); }
const rainIsle = makeRain(1600, 50, 6, 46, 40, 16);
const tStorm = tag('ハリケーン接近', { size: 70, w: 560, sx: 7.5, bg: '#e2483c' }); tStorm.position.set(50, 9.6, -4); qs.add(tStorm);
const tCrime = tag('罪を犯した患者の病院', { size: 60, w: 740, sx: 8.6, bg: '#e2483c' }); tCrime.position.set(50, 8.4, -4); qs.add(tCrime);
const tDuo = tag('スコセッシ×ディカプリオ', { size: 58, w: 780, sx: 9.0, bg: '#e6b450', color: '#14161c' }); tDuo.position.set(50, 7.2, -4); qs.add(tDuo);
const moon = new THREE.Mesh(new THREE.SphereGeometry(1.8, 20, 14), new THREE.MeshBasicMaterial({ color: '#f1ecd8', fog: false })); moon.position.set(36, 22, -44); qs.add(moon);

// ---------- 4段目. 病院の廊下（x=90） ----------
const hallG = new THREE.Group(); hallG.position.set(90, 0, 0); qs.add(hallG);
{ const fl = box(4, 0.1, 24, mat('#6e6a5e')); fl.position.set(0, -0.05, -6); hallG.add(fl);
  for (const s of [-1, 1]) { const w = box(0.2, 3.6, 24, mat('#bfc2b4')); w.position.set(s * 2, 1.8, -6); hallG.add(w);
    for (let z = 3; z > -16; z -= 3.2) { const d = box(0.08, 2.2, 1.0, mat('#5b6470')); d.position.set(s * 1.88, 1.1, z); hallG.add(d); const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ map: barsTex })); wn.position.set(s * 1.83, 1.7, z); wn.rotation.y = -s * Math.PI / 2; hallG.add(wn); } }
  for (let z = 3; z > -16; z -= 4) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.3), new THREE.MeshBasicMaterial({ color: '#fff6dc' })); l.position.set(0, 3.55, z); hallG.add(l); }
  const hl = new THREE.PointLight(0xfff0d0, 6, 14, 1.2); hl.position.set(0, 3.2, -2); hallG.add(hl); }
[[makeDoctor(0), -1.25, -2.4, 0.5], [makePatient(1), 1.3, -4.2, -0.6], [makeDoctor(2), 1.2, -6.8, -0.3], [makePatient(0), -1.3, -8.0, 0.5], [makeDoctor(1), -0.2, -11.0, 0]].forEach(([p, x, z, r]) => { p.position.set(90 + x, 0, z); p.rotation.y = r; qs.add(p); });
const hero4 = makePerson(HERO); hero4.position.set(90.1, 0, -2); qs.add(hero4);
const FILE_T = canvasTex(320, 400, (g, w, h) => { g.fillStyle = '#f2ead6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a7a5a'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#c9c2b0'; g.fillRect(40, 34, w - 80, 230); g.fillStyle = '#4a4438'; g.beginPath(); g.ellipse(w / 2, 140, 66, 86, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#6a6458'; g.beginPath(); g.ellipse(w / 2, 262, 96, 74, 0, Math.PI, 0); g.fill(); g.fillStyle = '#857e70'; g.beginPath(); g.ellipse(w / 2, 132, 40, 50, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c9283a'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('行方不明', w / 2, 330); });
const FILE = new THREE.Sprite(new THREE.SpriteMaterial({ map: FILE_T, depthTest: false })); FILE.renderOrder = 9; FILE.scale.set(0.8, 1.0, 1); qs.add(FILE);
const tSeek = tag('行方を追う', { size: 72, bg: '#14161c' }); qs.add(tSeek);

// ---------- 5段目. 嵐の岩場（x=125） ----------
const SHORE = new THREE.Group(); SHORE.position.set(125, 0, 0); qs.add(SHORE);
{ const ledge = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.0, 1.4, 9), mat('#3e3e3a')); ledge.position.set(0, 0.2, 0); SHORE.add(ledge);
  for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + R() * 0.8), mat(i % 2 ? '#3a3a36' : '#45453f')); const a = i * 0.7 - 1.2; r.position.set(Math.cos(a) * (3.6 + R()), 0.2, Math.sin(a) * (3.6 + R()) - 0.5); SHORE.add(r); }
  const foam = new THREE.Mesh(new THREE.RingGeometry(3.9, 4.9, 30), new THREE.MeshBasicMaterial({ color: '#cfe0ea', transparent: true, opacity: 0.35, side: THREE.DoubleSide })); foam.rotation.x = -Math.PI / 2; foam.position.y = 0.02; SHORE.add(foam); SHORE.userData.foam = foam; }
const hero5 = makePerson(HERO); hero5.position.set(125, 0.9, 0.6); qs.add(hero5);
const BADGE = starBadge(); BADGE.position.set(-0.13, 1.3, 0.141); hero5.add(BADGE);
const TORCH = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), mat('#2a2a2a')); TORCH.position.set(0, -0.68, 0.02); hero5.userData.arms[1].add(TORCH);
const TORCH_B = beamMesh(3.6, 0.7, '#fff2c8', 0.11); TORCH_B.position.set(0, -0.82, 0.02); hero5.userData.arms[1].add(TORCH_B); TORCH_B.scale.set(1, 1, 1);
const rainShore = makeRain(1100, 126, 2, 16, 14, 10);
const t1954 = tag('1954年・アメリカ', { size: 66, w: 600, bg: '#e6b450', color: '#14161c' }); t1954.position.set(124.8, 3.7, 0.4); qs.add(t1954);
const tMarshal = tag('連邦保安官', { size: 72, w: 440, bg: '#e2483c' }); tMarshal.position.set(124.8, 3.7, 0.4); qs.add(tMarshal);

// ---------- shots ----------
const ALLTAG = [tBed, tLock, tShoes, tAgent, tStorm, tCrime, tDuo, tSeek, t1954, tMarshal];
function base(T) {
  S.reset(); ALLTAG.forEach(x => x.visible = false); FILE.visible = false;
  rainIsle.visible = false; rainShore.visible = false; moon.visible = false;
  ROOM_SPOT.intensity = 0; ROOM_BEAM.visible = false; ALARM_L.intensity = 0;
  TOWERS.forEach(o => { o.beam.visible = false; o.lamp.visible = false; }); WIN_LIT.forEach(m => m.emissiveIntensity = 0);
  SWIRL.forEach(c => c.visible = false); GULLS.forEach(g => g.visible = false);
}
function swirl(T, speed = 0.12) { SWIRL.forEach(c => { c.visible = true; const a = c.userData.a + T * speed; c.position.set(IC.x + Math.cos(a) * c.userData.r, c.userData.y, IC.z + Math.sin(a) * c.userData.r * 0.8); c.rotation.y = -a; }); }
function nightIsle(T, k = 1) {
  WIN_LIT.forEach(m => m.emissiveIntensity = 0.9 * k);
  TOWERS.forEach((o, i) => { o.beam.visible = k > 0; o.lamp.visible = true; const a = T * 0.55 + i * 1.7; aimBeam(o.beam, o.from, _t.set(IC.x + Math.sin(a) * 5.2, 1.2, IC.z + Math.cos(a * 1.3) * 3.6)); o.beam.material.opacity = 0.14 * k; });
}
const _t = new THREE.Vector3();
const foamPulse = (m, T) => { m.material.opacity = 0.26 + 0.12 * Math.sin(T * 2.2); m.scale.setScalar(1 + 0.02 * Math.sin(T * 1.7)); };

function shotRoom(t, T) { // 1段目 0〜9：鍵のかかった部屋。ベッドは空。警報の赤い光（0秒目がサムネ）
  base(T); S.aim(0, -1); lift(230);
  S.hemi.intensity = 0.75; S.key.intensity = 0.2; S.darken(0.55, '#06080c');
  const pulse = 0.5 + 0.5 * Math.cos(T * 6.5);
  ALARM_L.intensity = 4 + pulse * 10; ALARM.material.color.set(pulse > 0.5 ? '#ff3b2e' : '#7a1a14');
  // ドアの小窓から懐中電灯の光がベッドをなめる
  const from = new THREE.Vector3(1.35, 1.85, -2.75);
  const sw = Math.sin(T * 0.9) * 0.55;
  _t.set(-1.4 + sw, 0.55, -1.5 + sw * 0.6);
  ROOM_SPOT.position.copy(from); ROOM_SPOT.target.position.copy(_t); ROOM_SPOT.intensity = 40;
  ROOM_BEAM.visible = true; aimBeam(ROOM_BEAM, from, _t);
  lightning(T, [5.6]);
  tBed.userData.pop((t - 2.6) / 0.35); tLock.userData.pop((t - 4.4) / 0.35); tShoes.userData.pop((t - 6.2) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.3, 0.1, u), lerp(3.0, 2.8, u), lerp(6.4, 5.8, u), lerp(0.0, -0.1, u), 1.3, -1.4, 60);
  return qs;
}
function shotPier(t, T) { // 2段目 9〜17：捜査を任された捜査官が、急いで船着き場へ
  base(T); S.aim(20, -2); lift(200);
  S.hemi.intensity = 1.0; S.key.intensity = 0.6; S.darken(0.35, '#55606e');
  const z = lerp(3.6, -2.4, t / 8);
  hero2.position.set(20, 0.57, z); hero2.rotation.y = Math.PI; poseWalk(hero2, t * 7.5, 1); hero2.position.y += 0.57;
  hero2.userData.arms[1].rotation.x = 0;
  tAgent.position.set(20, 3.1, z); tAgent.userData.pop((t - 4.2) / 0.35);
  BOAT.position.y = Math.sin(T * 1.6) * 0.06; BOAT.rotation.z = Math.sin(T * 1.2) * 0.03;
  GULLS.forEach((g, i) => { g.visible = true; const a = T * 0.5 + i * 2.1; g.position.set(20 + Math.cos(a) * (4 + i), 5.2 + i * 0.6 + Math.sin(T * 2 + i) * 0.2, -4 + Math.sin(a) * 3); g.rotation.y = -a; g.children.forEach((w, k) => w.rotation.z = (k ? 1 : -1) * (0.2 + 0.3 * Math.sin(T * 6 + i))); });
  look(lerp(23.2, 22.6, ease(t / 8)), 3.0, z + 6.6, 20.1, 1.5, z - 2.6, 54);
  return qs;
}
function shotIsle(t, T) { // 3段目 17〜25：四方を海に囲まれた島。巨大なハリケーンが迫る
  base(T); S.aim(50, -4); lift(140);
  const d = ease(t / 8);
  S.hemi.intensity = lerp(1.25, 0.8, d); S.key.intensity = lerp(0.8, 0.35, d); S.darken(lerp(0.1, 0.4, d), '#0a0e14');
  swirl(T, 0.18); rainIsle.visible = t > 2.0; rainIsle.userData.set(T);
  lightning(t, [4.0]);
  foamPulse(ISLE.userData.foam, T);
  tStorm.userData.pop((t - 4.2) / 0.35);
  const a = lerp(0.75, 0.3, ease(t / 8)), r = lerp(36, 29, ease(t / 8));
  look(IC.x + Math.sin(a) * r, lerp(16, 12.5, ease(t / 8)), IC.z + Math.cos(a) * r, IC.x, 2.0, IC.z, 50);
  return qs;
}
function shotWard(t, T) { // 4段目 25〜33：消えたのは病院の女性患者。行方を突き止めるのが目的
  base(T); S.aim(90, -4); lift(200);
  S.hemi.intensity = 1.0;
  const z = lerp(-3.6, -0.6, t / 8);
  hero4.position.set(90.1, 0, z); hero4.rotation.y = 0; poseWalk(hero4, t * 6.5, 0.8);
  const k = easeOut(clamp((t - 0.8) / 0.4)); FILE.visible = k > 0; FILE.scale.set(0.8 * k, 1.0 * k, 1); FILE.position.set(91.05, 1.85, z + 0.3);
  tSeek.position.set(89.85, 2.75, z + 0.2); tSeek.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(89.9, 90.1, u), lerp(2.3, 2.1, u), z + lerp(7.4, 6.6, u), 90.4, 1.6, z - 3, 52);
  return qs;
}
function shotShore(t, T) { // 5段目 33〜42：1954年のアメリカ。連邦保安官が嵐の島で捜す
  base(T); S.aim(125, 0); lift(190);
  S.hemi.intensity = 0.7; S.key.intensity = 0.35; S.darken(0.6, '#070a10');
  rainShore.visible = true; rainShore.userData.set(T);
  foamPulse(SHORE.userData.foam, T);
  const f = lightning(t, [3.0, 7.4]);
  hero5.rotation.y = 0.55 + Math.sin(t * 0.6) * 0.25; hero5.userData.arms[1].rotation.x = -1.25; hero5.userData.head.rotation.y = Math.sin(t * 0.6) * 0.2;
  BADGE.material.emissive.set(t > 4.2 && t < 4.9 ? '#c89a2a' : '#5a3c08');
  t1954.userData.pop(t < 4.2 ? (t - 0.6) / 0.35 : 0); tMarshal.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(lerp(127.8, 127.0, u), lerp(2.7, 2.5, u), lerp(7.4, 6.4, u), 125.0, 2.1, 0.3, 54);
  return qs;
}
function shotNight(t, T) { // 6段目 42〜49（決め手）：罪を犯した患者だけを収容する孤島の病院。スコセッシ×ディカプリオ
  base(T); S.aim(50, -4); lift(140); moon.visible = true;
  S.hemi.intensity = 0.4; S.key.intensity = 0.15; S.darken(0.85, '#05070b');
  nightIsle(T, 1); swirl(T, 0.08); foamPulse(ISLE.userData.foam, T);
  tCrime.userData.pop(t < 3.4 ? (t - 0.5) / 0.35 : 0); tDuo.userData.pop((t - 3.6) / 0.35);
  const u = ease(t / 7);
  look(IC.x + lerp(-6, -3, u), lerp(14, 11.5, u), IC.z + lerp(22, 18.5, u), IC.x, 2.6, IC.z, 50);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：この映画、わかった？（夜の嵐の島を引きで）
  base(T); S.aim(50, -4); lift(140); moon.visible = true;
  S.hemi.intensity = 0.35; S.key.intensity = 0.1; S.darken(0.9, '#05070b');
  nightIsle(T, 1); swirl(T, 0.14); foamPulse(ISLE.userData.foam, T);
  rainIsle.visible = true; rainIsle.userData.set(T); lightning(t, [1.6]);
  const k = ease(t / 7), a = lerp(-0.2, 0.35, k), r = lerp(20, 28, k);
  look(IC.x + Math.sin(a) * r, lerp(9, 15, k), IC.z + Math.cos(a) * r, IC.x, 2.2, IC.z, 52);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotRoom },
  { a: 9, b: 17, f: shotPier },
  { a: 17, b: 25, f: shotIsle },
  { a: 25, b: 33, f: shotWard },
  { a: 33, b: 42, f: shotShore },
  { a: 42, b: 49, f: shotNight },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '鍵のかかった部屋から、<br>ひとりの女性が消えた。'],
  [5.6, 9.0, '靴も履かずに、<br>どこへ行ったのか。'],
  [9.2, 13.2, '捜査を任されたのは、<br>ひとりの捜査官。'],
  [13.2, 17.0, '急いで船に乗り、<br>現場へ向かう。'],
  [17.2, 21.0, '着いたのは、四方を<br>海に囲まれた島。'],
  [21.0, 25.0, '空は荒れ、巨大な<br>ハリケーンが迫る。'],
  [25.2, 29.0, '消えたのは、島の病院に<br>収容されていた女性。'],
  [29.0, 33.0, '目的は、彼女の行方を<br>突き止めること。'],
  [33.2, 37.4, '舞台は1954年の<br>アメリカ。'],
  [37.4, 41.8, '連邦保安官が挑む、<br>孤島のミステリー。'],
  [42.2, 45.6, '罪を犯した患者だけを<br>収容する、孤島の病院。'],
  [45.6, 49.0, 'スコセッシと<br>ディカプリオの名コンビ。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>シャッター アイランド。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotWard,
  meta: {
    id: 'q002', v2: true, answer: 'シャッター アイランド',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 202,
    hits: [5.6, 21.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.6, 21.0, 37.4, 42.2, 56.4],
    sfx: [[0.3, 'alarm'], [9.0, 'whoosh'], [17.0, 'whoosh'], [17.6, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '1954年': 'せんきゅうひゃくごじゅうよねん', '連邦保安官': 'れんぽうほあんかん', '捜査官': 'そうさかん', '捜査': 'そうさ', '任された': 'まかされた', '履かずに': 'はかずに', '現場': 'げんば', '四方': 'しほう', '囲まれた': 'かこまれた', '荒れ': 'あれ', '巨大': 'きょだい', '迫る': 'せまる', '収容': 'しゅうよう', '行方': 'ゆくえ', '突き止める': 'つきとめる', '舞台': 'ぶたい', '挑む': 'いどむ', '孤島': 'ことう', '罪を犯した': 'つみをおかした', '患者': 'かんじゃ', '名コンビ': 'めいコンビ', 'シャッター アイランド': 'シャッターアイランド' },
    caption: 'この映画のタイトル、わかる？\n鍵のかかった部屋から、ひとりの女性が消えた。靴も履かずに、どこへ行ったのか。捜査を任された捜査官がたどり着いたのは、四方を海に囲まれた島。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画紹介', 'どんでん返し'],
  },
});
applyQuizCards({ answer: 'シャッター アイランド', info: 'Netflix｜映画・138分', answerSize: 80 });
