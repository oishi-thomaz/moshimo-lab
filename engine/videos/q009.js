import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, setTop } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #009 ロード・オブ・ザ・リング（映画・アメリカ／ニュージーランド・2001年（日本公開2002年）・178分。
//   Netflixで見放題、justwatch.com/jp/映画/rodoobuzaringu で2026/11/1確認。Filmarks 3.8 filmarks.com/movies/35249）
// 設定：冥王サウロンが作った、世界を滅ぼす力を持つ「ひとつの指輪」。それがホビット（小さな種族）の若者フロドに託される。
//       冥王の手に渡る前に、滅びの山（火山）の炎で指輪を壊すため、9人の旅の仲間（ホビット・魔法使い・エルフ・ドワーフ・人間）が旅立つ。
//       冥王の手下が迫ってくる（Filmarks 作品ページ・JustWatch の作品紹介・シネマトゥデイのシリーズ紹介 A0008508）
// 作品の映像・キャラクターの見た目・衣装・ロゴ・有名な場面の構図（塔の上の目、黒い騎手、丸い扉の家など）は使わない。
// 追っ手は記号的な影にして、戦い・血は出さない。結末にはふれない

const S = quizStage({ bg: '#e9a86a', floor: null, fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(2001);

// ---------- 共通の小物 ----------
const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.35, 'rgba(255,200,90,.55)'); gr.addColorStop(1, 'rgba(255,170,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
function makeGlow(s = 1, color = 0xffd27a) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.set(s, s, 1); sp.renderOrder = 5; return sp; }
function makeRing(r = 0.2) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.2, 16, 48), new THREE.MeshLambertMaterial({ color: '#f2c14e', emissive: '#a8740e' }));
  g.add(t);
  const gl = makeGlow(r * 7); g.add(gl);
  g.userData = { t, gl };
  return g;
}
function cloak(p, color) { const c = box(0.54, 0.95, 0.05, mat(color)); c.position.set(0, 1.0, -0.17); p.add(c); return c; }
function hood(p, color) { const h = box(0.46, 0.2, 0.44, mat(color)); h.position.set(0, 0.5, -0.02); p.userData.head.add(h); }
function inHand(p, obj, side = 1) { p.userData.arms[side].add(obj); return obj; }

// 小さな種族の若者たち（4人）
const SMALL = [
  { skin: '#f1c9a5', hair: '#4a3426', shirt: '#c9a46a', pants: '#5a4a3a', scale: 0.68 },
  { skin: '#efcfae', hair: '#6b4a33', shirt: '#7a8a4a', pants: '#4a3a2a', scale: 0.66 },
  { skin: '#e8b98f', hair: '#9a6a3a', shirt: '#b8573a', pants: '#3b3f4a', scale: 0.67 },
  { skin: '#f5d3b5', hair: '#2c2421', shirt: '#5a7aa0', pants: '#5a4a3a', scale: 0.65 },
];
function makeSmall(i) { const p = makePerson(SMALL[i]); cloak(p, ['#4a5a3a', '#5a4a3a', '#3a4a5a', '#5a5a3a'][i]); return p; }
function makeWizard() {
  const p = makePerson({ skin: '#efcfae', hair: '#d8d8d8', shirt: '#3a4a7a', pants: '#3a4a7a' });
  const robe = box(0.6, 0.9, 0.4, mat('#3a4a7a')); robe.position.y = 0.5; p.add(robe);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), mat('#2e3a62')); brim.position.y = 0.52; p.userData.head.add(brim);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 16), mat('#2e3a62')); cone.position.y = 0.88; cone.rotation.z = 0.12; p.userData.head.add(cone);
  const beard = box(0.34, 0.42, 0.08, mat('#e4e4e4')); beard.position.set(0, 0.0, 0.2); p.userData.head.add(beard);
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.9, 8), mat('#6b4a2a')); staff.position.set(0, -0.62, 0.08); inHand(p, staff);
  const orb = makeGlow(0.5, 0xbfe0ff); orb.position.set(0, -1.6, 0.08); inHand(p, orb); p.userData.orb = orb;
  return p;
}
function makeElf() {
  const p = makePerson({ skin: '#f5d3b5', hair: '#3a3a4a', shirt: '#3f6b4a', pants: '#3a4a3a', long: true, scale: 1.04 });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), mat('#f5d3b5')); e.position.set(s * 0.23, 0.33, 0); e.rotation.z = -s * 0.9; p.userData.head.add(e); }
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 20, Math.PI), mat('#8a6a3a')); bow.position.set(0.0, 1.15, -0.2); bow.rotation.z = Math.PI / 2 + 0.3; p.add(bow);
  cloak(p, '#2f4a3a');
  return p;
}
function makeDwarf() {
  const p = makePerson({ skin: '#e8b98f', hair: '#5a3a2a', shirt: '#7a3a2a', pants: '#3a3030' });
  p.scale.set(0.86, 0.7, 0.86);
  const beard = box(0.44, 0.5, 0.12, mat('#5a3a2a')); beard.position.set(0, -0.02, 0.2); p.userData.head.add(beard);
  const helm = box(0.46, 0.14, 0.44, mat('#8a8a8a')); helm.position.y = 0.5; p.userData.head.add(helm);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), mat('#5a3a1a')); hd.position.set(0, -0.7, 0.1); inHand(p, hd);
  const blade = box(0.05, 0.3, 0.32, mat('#b8bcc2')); blade.position.set(0, -1.05, 0.26); inHand(p, blade);
  return p;
}
function makeHuman(i) {
  const o = [{ skin: '#e8b98f', hair: '#2c2421', shirt: '#3a3a30', pants: '#2b2b2b' }, { skin: '#efcfae', hair: '#6b4a33', shirt: '#7a3a3a', pants: '#3b3f4a' }][i];
  const p = makePerson(o);
  cloak(p, ['#2f3a2a', '#4a2a2a'][i]);
  if (i === 0) { const sw = box(0.06, 0.95, 0.04, mat('#c8ccd2')); sw.position.set(0, -1.05, 0.06); inHand(p, sw); }
  else { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 20), mat('#8a6a3a')); sh.rotation.x = Math.PI / 2; sh.position.set(-0.1, -0.4, 0.14); inHand(p, sh, 0); }
  return p;
}
function makeFellowship() { return [makeSmall(0), makeSmall(1), makeSmall(2), makeSmall(3), makeWizard(), makeElf(), makeDwarf(), makeHuman(0), makeHuman(1)]; }

function hill(x, z, r, h, color) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), mat(color)); m.scale.y = h / r; m.position.set(x, 0, z); m.receiveShadow = true; return m; }
function tree(x, z, s = 1, leaf = '#3f6b3a') { const g = new THREE.Group(); const tr = box(0.18 * s, 0.8 * s, 0.18 * s, mat('#5a4030')); tr.position.y = 0.4 * s; g.add(tr); const c = new THREE.Mesh(new THREE.SphereGeometry(0.6 * s, 10, 8), mat(leaf)); c.position.y = 1.2 * s; c.castShadow = true; g.add(c); g.position.set(x, 0, z); return g; }
function pine(x, z, s = 1, leaf = '#1e3428') { const g = new THREE.Group(); const tr = box(0.16 * s, 0.6 * s, 0.16 * s, mat('#2a2018')); tr.position.y = 0.3 * s; g.add(tr); for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((0.8 - k * 0.2) * s, 1.0 * s, 8), mat(leaf)); c.position.y = (0.9 + k * 0.55) * s; g.add(c); } g.position.set(x, 0, z); return g; }
function cottage(x, z, rot = 0, s = 1) {
  const g = new THREE.Group();
  const w = box(1.6 * s, 1.0 * s, 1.2 * s, mat('#efe2c4')); w.position.y = 0.5 * s; g.add(w);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25 * s, 0.8 * s, 4), mat('#8a5a3a')); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8; roof.position.y = 1.4 * s; roof.castShadow = true; g.add(roof);
  const door = box(0.32 * s, 0.56 * s, 0.04, mat('#3f6b3a')); door.position.set(0, 0.28 * s, 0.61 * s); g.add(door);
  const win = box(0.3 * s, 0.26 * s, 0.04, new THREE.MeshBasicMaterial({ color: '#ffd98a' })); win.position.set(0.48 * s, 0.6 * s, 0.61 * s); g.add(win);
  const ch = box(0.2 * s, 0.5 * s, 0.2 * s, mat('#7a6a5a')); ch.position.set(-0.45 * s, 1.6 * s, -0.1 * s); g.add(ch);
  g.position.set(x, 0, z); g.rotation.y = rot; return g;
}
function volcano(h = 14, r = 10) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r, h, 14, 1), mat('#2a2224')); c.position.y = h / 2; g.add(c);
  const lava = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.1, r * 0.12, 0.3, 14), new THREE.MeshBasicMaterial({ color: '#ff6a1a', fog: false })); lava.position.y = h + 0.1; g.add(lava);
  const gl = makeGlow(r * 1.4, 0xff7a2a); gl.position.y = h + 0.6; g.add(gl);
  const smoke = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 10, 8), new THREE.MeshLambertMaterial({ color: '#3a2a2a', transparent: true, opacity: 0.75 })); g.add(s); smoke.push(s); }
  g.userData = { smoke, h, r, gl };
  return g;
}
function puff(v, t) { const { smoke, h, r } = v.userData; smoke.forEach((s, i) => { const u = ((t * 0.12 + i / smoke.length) % 1); s.position.set(Math.sin(i * 2.1) * r * 0.1 + u * r * 0.3, h + 0.6 + u * r * 0.9, Math.cos(i * 1.7) * r * 0.1); s.scale.setScalar(0.6 + u * 1.4); s.material.opacity = 0.75 * (1 - u); }); }

const GROUPS = [];
function zone(x) { const g = new THREE.Group(); g.position.set(x, 0, 0); qs.add(g); GROUPS.push(g); return g; }

// ---------- 1. のどかな村（x=0） ----------
const VIL = zone(0);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat('#6f9a4a')); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; VIL.add(gr);
  [[-6, -10, 6, 2.2, '#5f8a40'], [5, -12, 7, 2.6, '#6a9446'], [0, -18, 9, 3.4, '#58823c'], [-12, -16, 7, 2.8, '#64903f'], [12, -18, 8, 3.0, '#5a843d']].forEach(a => VIL.add(hill(...a)));
  [[-3.4, -5.2, 0.3], [2.6, -6.0, -0.2], [-0.2, -8.6, 0], [5.4, -9.2, -0.4], [-6.2, -8.4, 0.5]].forEach(([x, z, r], i) => VIL.add(cottage(x, z, r, i === 2 ? 0.9 : 1)));
  [[-5, -3.2, 1.1], [4.8, -3.6, 1.2], [-1.6, -11.5, 1.3], [7.4, -6.6, 1.0], [-8, -6, 1.2], [1.4, -12.6, 1.1]].forEach(([x, z, s]) => VIL.add(tree(x, z, s)));
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 14), mat('#b89a6a')); path.rotation.x = -Math.PI / 2; path.position.set(0.4, 0.01, -2); VIL.add(path);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff0c8', fog: false })); sun.position.set(-14, 9, -60); VIL.add(sun);
}
const hero1 = makeSmall(0); hero1.position.set(0.3, 0, 1.4); hero1.rotation.y = -0.15; VIL.add(hero1);
const heroMark = new THREE.Object3D(); heroMark.position.set(0, -0.98, 0.05); hero1.userData.arms[1].add(heroMark);
const RING1 = makeRing(0.16); VIL.add(RING1);
const tRing = tag('ひとつの指輪', { size: 72, bg: '#e6b450', color: '#14161c', sx: 0.95 }); tRing.position.set(0.3, 2.15, 1.4); VIL.add(tRing);

// ---------- 2. 指輪のアップ（x=30） ----------
const VOID = zone(30);
const RING2 = makeRing(0.7); RING2.position.set(0, 2.2, 0); VOID.add(RING2);
const EMB = []; for (let i = 0; i < 40; i++) { const e = makeGlow(0.12 + R() * 0.14, 0xff8a3a); e.userData.b = [(R() - 0.5) * 8, R() * 6, -1 - R() * 6, R()]; VOID.add(e); EMB.push(e); }
const DARKC = []; for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(2.2 + R() * 1.4, 12, 10), new THREE.MeshLambertMaterial({ color: '#2a1416', emissive: '#3a0a06', transparent: true, opacity: 0.85 })); c.scale.y = 0.55; c.position.set(-8 + i * 2, 5.2 + R() * 1.6, -12 - R() * 3); VOID.add(c); DARKC.push(c); }
const tPower = tag('世界を滅ぼす力', { size: 70, w: 560, bg: '#e2483c' }); tPower.position.set(0, 3.55, 0); VOID.add(tPower);
const tDark = tag('ねらうのは闇の冥王', { size: 64, w: 620, bg: 'rgba(10,12,18,.9)', color: '#ff9a6a' }); tDark.position.set(0, 3.55, 0); VOID.add(tDark);

// ---------- 3. 9人の旅の仲間（x=60） ----------
const MEET = zone(60);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat('#7a9a5a')); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; MEET.add(gr);
  [[-7, -14, 8, 4, '#6a8a4c'], [6, -16, 9, 5, '#62844a'], [0, -26, 14, 8, '#8a9aa8']].forEach(a => MEET.add(hill(...a)));
  [[-4.4, -4, 1.4], [4.6, -5, 1.6], [-6, -8, 1.3], [6.4, -9, 1.5]].forEach(([x, z, s]) => MEET.add(pine(x, z, s, '#2e5a3a')));
}
const FS = makeFellowship();
// 前列：小さな4人。後列：人間・エルフ・魔法使い・ドワーフ・人間
const FS_POS = [[-1.3, 1.1], [-0.65, 1.2], [0, 1.2], [0.65, 1.15], [0.45, -0.3], [-1.35, -0.4], [1.3, 1.05], [-0.45, -0.3], [1.35, -0.4]];
const FS_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8];
FS.forEach((p, i) => { p.position.set(FS_POS[i][0], 0, FS_POS[i][1]); p.userData.s0 = p.scale.clone(); MEET.add(p); });
FS[5].rotation.y = 0.2; FS[8].rotation.y = -0.2; FS[6].rotation.y = -0.15;
const T3 = [['魔法使い', 4, 3.05], ['エルフ', 5, 2.45], ['ドワーフ', 6, 0.42], ['人間', 8, 2.45]].map(([s, i, y]) => { const t = tag(s, { size: 52, w: 270, h: 104 }); t.position.set(FS_POS[i][0], y, FS_POS[i][1] + 0.3); MEET.add(t); return t; });
const tSmall = tag('小さな種族', { size: 52, w: 340, h: 104, bg: '#e6b450', color: '#14161c' }); tSmall.position.set(-0.65, 0.42, 1.6); MEET.add(tSmall);

// ---------- 4. 火の山を目指す（x=110） ----------
const ROAD = zone(110);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(120, 160), mat('#8a8a6a')); gr.rotation.x = -Math.PI / 2; gr.position.z = -40; gr.receiveShadow = true; ROAD.add(gr);
  for (let i = 0; i < 9; i++) { const s = i % 2 ? -1 : 1; const m = new THREE.Mesh(new THREE.ConeGeometry(6 + R() * 4, 9 + R() * 6, 6), mat('#6a6a72')); m.position.set(s * (10 + R() * 8), 4, -14 - i * 7); ROAD.add(m); const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3, 6), mat('#eef2f6')); cap.position.set(m.position.x, m.geometry.parameters.height + 2.5, m.position.z); ROAD.add(cap); cap.position.y = 4 + m.geometry.parameters.height / 2 - 1.3; }
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 80), mat('#b0a07a')); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, -30); ROAD.add(path);
  for (let i = 0; i < 10; i++) { const r = box(0.5 + R(), 0.4 + R() * 0.4, 0.5 + R(), mat('#7a7a70')); r.position.set((R() < 0.5 ? -1 : 1) * (1.6 + R() * 3), 0.2, 2 - i * 4); ROAD.add(r); }
}
const VOL4 = volcano(22, 16); VOL4.position.set(0, 0, -95); ROAD.add(VOL4);
const FS4 = makeFellowship(); FS4.forEach(p => ROAD.add(p));
const tMount = tag('滅びの山', { size: 72, bg: '#e2483c', sx: 16 }); tMount.position.set(0, 33, -95); ROAD.add(tMount);
const tFire = tag('炎でしか壊せない', { size: 64, w: 560, bg: 'rgba(10,12,18,.9)', color: '#ffb06a', sx: 26 }); ROAD.add(tFire);

// ---------- 5. 夜の森、追っ手（x=170） ----------
const WOOD = zone(170);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat('#1e2a24')); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; WOOD.add(gr);
  for (let i = 0; i < 34; i++) { const x = (R() - 0.5) * 22, z = -2 - R() * 22; if (Math.abs(x) < 1.6 && z > -10) continue; WOOD.add(pine(x, z, 1.4 + R() * 1.2, '#16261e')); }
  for (const [x, z] of [[-2.8, 2.5], [2.6, 2.0], [-3.6, -0.5], [3.4, -1.0]]) WOOD.add(pine(x, z, 1.8, '#16261e'));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), new THREE.MeshBasicMaterial({ color: '#e8ecf4', fog: false })); moon.position.set(5, 11, -40); WOOD.add(moon);
}
const FS5 = makeFellowship(); FS5.forEach(p => WOOD.add(p));
const MOONL = new THREE.PointLight(0xaabbe0, 0, 30, 1.2); MOONL.position.set(0, 7, 4); WOOD.add(MOONL);
const SHADE = []; for (let i = 0; i < 7; i++) { const g = new THREE.Group(); const b = box(0.8, 1.5, 0.6, new THREE.MeshBasicMaterial({ color: '#07080a' })); b.position.y = 0.85; g.add(b); const hd = box(0.55, 0.45, 0.5, b.material); hd.position.set(0, 1.75, 0.08); g.add(hd); for (const s of [-1, 1]) { const e = box(0.1, 0.06, 0.02, new THREE.MeshBasicMaterial({ color: '#ff3a2a', fog: false })); e.position.set(s * 0.12, 1.8, 0.34); g.add(e); } g.userData.b = [-3.5 + i * 1.15 + (R() - 0.5) * 0.4, -9 - R() * 3]; WOOD.add(g); SHADE.push(g); }
const tChase = tag('冥王の手下', { size: 70, bg: '#e2483c' }); tChase.position.set(0, 3.1, -9); WOOD.add(tChase);

// ---------- 6〜7. 果てしない旅（x=230） ----------
const VISTA = zone(230);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat('#5a6a4a')); gr.rotation.x = -Math.PI / 2; gr.position.z = -60; VISTA.add(gr);
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(3, 6, 3, 9), mat('#6a6a5a')); ridge.position.set(0, 1.5, 0); VISTA.add(ridge);
  for (let i = 0; i < 14; i++) { const s = i % 2 ? -1 : 1; const h = 10 + R() * 12; const m = new THREE.Mesh(new THREE.ConeGeometry(8 + R() * 6, h, 6), mat(i % 3 ? '#4a4e58' : '#545a64')); m.position.set(s * (14 + R() * 30), h / 2 - 0.5, -30 - i * 9); VISTA.add(m); }
}
const VOL6 = volcano(30, 22); VOL6.position.set(-6, 0, -140); VISTA.add(VOL6);
const TOP6 = new THREE.Group(); TOP6.position.y = 3.0; VISTA.add(TOP6);
const FS6 = makeFellowship(); FS6.forEach((p, i) => { p.position.set(-1.6 + i * 0.4, 0, 0.8 - i * 0.18); p.rotation.y = Math.PI - 0.2; TOP6.add(p); });
const RING7 = makeRing(0.45); VISTA.add(RING7);

// ---------- shots ----------
const ALLTAG = [tRing, tPower, tDark, ...T3, tSmall, tMount, tFire, tChase];
function base(zoneG) {
  S.reset(); GROUPS.forEach(g => g.visible = g === zoneG); ALLTAG.forEach(x => x.visible = false);
  MOONL.intensity = 0; S.scene.fog.near = 30; S.scene.fog.far = 110;
}
function sky(c) { S.scene.background.set(c); S.scene.fog.color.set(c); }
function spinRing(rg, t, fast = 1) { rg.userData.t.rotation.y = Math.sin(t * 0.9 * fast) * 0.55; rg.userData.gl.material.opacity = 0.75 + Math.sin(t * 3) * 0.2; }
function idle(ps, t) { ps.forEach((p, i) => { poseWalk(p, 0, 0); p.userData.head.rotation.y = Math.sin(t * 0.8 + i) * 0.15; }); }

function shotVillage(t, T) { // 0〜9：のどかな村の若者が、指輪を掲げる（0秒目がサムネ）
  base(VIL); S.aim(0, 0); lift(0);
  sky('#f0b47a'); S.hemi.intensity = 1.25; S.key.intensity = 1.35;
  const up = T < 5.4 ? 0.25 : ease((T - 5.4) / 0.9);
  hero1.userData.arms[1].rotation.x = lerp(-2.75, -2.75, up);
  hero1.userData.arms[1].rotation.z = 0.42; hero1.userData.arms[0].rotation.x = 0; hero1.userData.head.rotation.x = -0.25;
  qs.updateMatrixWorld();
  const p = new THREE.Vector3(); heroMark.getWorldPosition(p);
  RING1.position.copy(p).add(new THREE.Vector3(0, 0.12 + Math.sin(T * 2) * 0.03, 0));
  spinRing(RING1, T); RING1.userData.gl.scale.setScalar(1.4 * (T < 5.6 ? 1 : 1 + 0.25 * ease((T - 5.6) / 0.6)));
  tRing.userData.pop((T - 6.0) / 0.35); tRing.position.set(RING1.position.x, RING1.position.y + 0.42, RING1.position.z);
  const u = ease(T / 9);
  look(lerp(1.3, 0.9, u), lerp(0.95, 1.05, u), lerp(5.6, 4.9, u), 0.3, 1.62, 0.8, 50);
  return qs;
}
function shotPower(t) { // 9〜17：世界を滅ぼす力。ねらうのは闇の冥王
  base(VOID); S.aim(30, 0); lift(120);
  const dk = ease((t - 3.8) / 1.0);
  sky(new THREE.Color('#1a1418').lerp(new THREE.Color('#2a0c08'), dk).getStyle()); S.hemi.intensity = lerp(0.6, 0.45, dk); S.key.intensity = 0.6;
  S.scene.fog.near = 10; S.scene.fog.far = 40;
  spinRing(RING2, t, 0.7); RING2.position.y = 2.2 + Math.sin(t * 1.6) * 0.08;
  EMB.forEach((e, i) => { const [x, y0, z, ph] = e.userData.b; e.position.set(x, (y0 + t * 0.5 + ph * 3) % 6, z); e.material.opacity = 0.35 + 0.65 * dk; });
  DARKC.forEach((c, i) => { c.visible = dk > 0; c.material.opacity = 0.85 * dk; c.position.x = -8 + i * 2 + Math.sin(t * 0.4 + i) * 0.4; });
  tPower.userData.pop((t - 1.6) / 0.35);
  tDark.userData.pop((t - 4.6) / 0.35); if (t > 4.6) tPower.visible = false;
  const u = ease(t / 8);
  look(30 + Math.sin(u * 0.6) * 1.2, lerp(2.4, 2.25, u), lerp(6.4, 5.5, u), 30, 2.15, 0, 52);
  return qs;
}
function shotFellow(t) { // 17〜25：9人の旅の仲間。種族はばらばら
  base(MEET); S.aim(60, 0); lift(170);
  sky('#a8c4dc'); S.hemi.intensity = 1.25; S.key.intensity = 1.4;
  let n = 0;
  FS.forEach((p, i) => { const k = easeOut(clamp((t - 0.3 - FS_ORDER.indexOf(i) * 0.32) / 0.3)); p.visible = k > 0; if (k > 0) n++; p.scale.copy(p.userData.s0).multiplyScalar(0.0001 + k); });
  idle(FS, t);
  FS[4].userData.arms[1].rotation.x = -0.35; FS[4].userData.orb.material.opacity = 0.8;
  setTop('旅の仲間', `${n}人`, clamp((t - 0.3) / 0.2), '#e6b450');
  tSmall.userData.pop((t - 3.4) / 0.3);
  T3.forEach((x, i) => x.userData.pop((t - 4.2 - i * 0.55) / 0.3));
  const u = ease(t / 8);
  look(60 + lerp(0.3, -0.1, u), lerp(2.1, 2.0, u), lerp(9.8, 9.0, u), 60, 1.5, 0, 50);
  return qs;
}
function shotRoad(t) { // 25〜33：目指すのは遠い火の山。壊せるのはその炎だけ
  base(ROAD); S.aim(110, -6); lift(170);
  sky('#c89a7a'); S.hemi.intensity = 1.05; S.key.intensity = 1.2;
  S.scene.fog.near = 40; S.scene.fog.far = 200;
  puff(VOL4, t);
  FS4.forEach((p, i) => { const z = -1.6 - i * 0.95 - t * 0.55; p.position.set(Math.sin(i * 1.3) * 0.25, 0, z); p.rotation.y = Math.PI; poseWalk(p, t * 7 + i * 0.8, 1); });
  FS4[4].userData.orb.material.opacity = 0.5;
  tMount.userData.pop((t - 1.2) / 0.35);
  tFire.userData.pop((t - 4.6) / 0.35); tFire.position.set(0, 33, -95);
  if (t > 4.6) tMount.visible = false;
  const u = ease(t / 8);
  look(110 + lerp(0.6, 0.35, u), lerp(3.6, 3.9, u), lerp(7.2, 6.4, u) - t * 0.55, 110, lerp(9, 11, u), -60, 50);
  return qs;
}
function shotWood(t) { // 33〜42：冥王の手下が追ってくる
  base(WOOD); S.aim(170, -2); lift(190);
  sky('#0c1220'); S.hemi.intensity = 0.35; S.key.intensity = 0.25; MOONL.intensity = 5;
  S.scene.fog.near = 6; S.scene.fog.far = 30;
  const crouch = [[-1.0, 1.4], [-0.4, 1.6], [0.3, 1.5], [0.9, 1.3], [-0.2, 0.6], [-1.3, 0.5], [0.6, 0.5], [1.4, 0.7], [0.1, -0.1]];
  FS5.forEach((p, i) => { p.position.set(crouch[i][0], 0, crouch[i][1]); p.rotation.y = Math.PI + (i - 4) * 0.06; poseWalk(p, 0, 0); p.userData.head.rotation.y = Math.sin(t * 1.4 + i) * 0.25; });
  FS5[4].userData.orb.material.opacity = 0.9;
  SHADE.forEach((g, i) => { const [x, z] = g.userData.b; const k = ease((t - 0.6) / 8); g.position.set(x, 0, z + k * 3.2); g.rotation.y = Math.sin(t * 0.7 + i) * 0.2; g.visible = t > 0.4; });
  tChase.userData.pop((t - 2.0) / 0.35); tChase.position.z = -8.2 + ease((t - 0.6) / 8) * 2.8;
  const u = ease(t / 9);
  look(170 + lerp(0.6, 0.2, u), lerp(2.9, 2.6, u), lerp(6.4, 5.6, u), 170, 1.3, -8, 52);
  return qs;
}
const DUSK = '#3a2a3a';
function shotVista(t) { // 42〜49：壮大な旅は、ここから始まる
  base(VISTA); S.aim(230, 0); lift(0);
  const d = ease(t / 6);
  sky(new THREE.Color('#d88a5a').lerp(new THREE.Color(DUSK), d * 0.6).getStyle()); S.hemi.intensity = lerp(1.0, 0.7, d); S.key.intensity = lerp(1.1, 0.6, d);
  S.scene.fog.near = 40; S.scene.fog.far = 260;
  puff(VOL6, t); idle(FS6, t); RING7.visible = false;
  const k = ease(t / 7);
  look(230 + lerp(2.6, 4.0, k), lerp(6.4, 9.0, k), lerp(8.0, 14, k), 230 - 1, lerp(7.3, 6.6, k), lerp(-14, -20, k), 52);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？
  base(VISTA); S.aim(230, 0); lift(0);
  sky(new THREE.Color('#d88a5a').lerp(new THREE.Color(DUSK), 0.6 + 0.3 * ease(t / 7)).getStyle()); S.hemi.intensity = 0.65; S.key.intensity = 0.55;
  S.scene.fog.near = 40; S.scene.fog.far = 260;
  puff(VOL6, t + 7); idle(FS6, t + 7);
  const k = ease(t / 7);
  const k2 = ease(t / 3.4);
  look(234, lerp(9.0, 12.6, k2), lerp(14, 16, k), 229, lerp(6.6, 8.6, k), lerp(-20, -24, k), 52);
  RING7.visible = true; RING7.position.set(3.0, lerp(8.9, 12.2, k2), lerp(7.6, 9.4, k)); spinRing(RING7, t, 0.6);
  RING7.scale.setScalar(easeOut(clamp((t - 0.4) / 0.8)) + 0.0001);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotVillage(t, T) },
  { a: 9, b: 17, f: shotPower },
  { a: 17, b: 25, f: shotFellow },
  { a: 25, b: 33, f: shotRoad },
  { a: 33, b: 42, f: shotWood },
  { a: 42, b: 49, f: shotVista },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'のどかな村に住む、<br>小さな種族の若者。'],
  [5.6, 9.0, 'ある日、ひとつの<br>指輪を託された。'],
  [9.2, 13.2, 'その指輪には、<br>世界を滅ぼす力がある。'],
  [13.2, 17.0, 'ねらっているのは、<br>闇の冥王。'],
  [17.2, 21.0, '集まったのは、<br>9人の旅の仲間。'],
  [21.0, 25.0, '魔法使い、エルフ、<br>ドワーフ、そして人間。'],
  [25.2, 29.0, '目指すのは、<br>遠い火の山。'],
  [29.0, 33.0, '指輪を壊せるのは、<br>その炎だけ。'],
  [33.2, 37.4, 'でも、冥王の手下が<br>すぐそこまで迫る。'],
  [37.4, 41.8, '9人は、指輪を<br>守りぬけるのか。'],
  [42.2, 45.4, '壮大な旅は、<br>ここから始まる。'],
  [45.4, 49.0, '3時間、一気に<br>観たくなる。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ロード・オブ・ザ・リング。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotVillage || f === shotFellow || f === shotRoad,
  meta: {
    id: 'q009', v2: true, answer: 'ロード・オブ・ザ・リング',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 2001,
    hits: [5.6, 17.2, 56.4], risers: [52.0],
    impacts: [0.2, 5.6, 13.2, 56.4],
    sfx: [[9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [33.4, 'drone'], [42.2, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '種族': 'しゅぞく', '託された': 'たくされた', '滅ぼす': 'ほろぼす', '闇': 'やみ', '冥王': 'めいおう', '9人': 'きゅうにん', '魔法使い': 'まほうつかい', '火の山': 'ひのやま', '壊せる': 'こわせる', '炎': 'ほのお', '手下': 'てした', '迫る': 'せまる', '壮大': 'そうだい', '3時間': 'さんじかん', '一気に': 'いっきに' },
    caption: 'この映画のタイトル、わかる？\nのどかな村に住む小さな種族の若者が、世界を滅ぼす力を持つ指輪を託された。指輪を壊せるのは、遠い火の山の炎だけ。9人の旅の仲間が旅立つ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画紹介', 'ファンタジー'],
  },
});
applyQuizCards({ answer: 'ロード・オブ・<br>ザ・リング', info: 'Netflix｜映画・178分', answerSize: 104 });
