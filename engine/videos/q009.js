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
// ヒント6段（2026/11/2 作り直し）：決め手は 指輪を火山の炎で壊す旅。指輪と火山は6段目まで出さない（それまでは布の包みと、遠くの暗い空だけ）。
//   指輪は文字も模様もない無地の金の輪にする（作品の指輪の文字・見た目はなぞらない）

const S = quizStage({ bg: '#e9a86a', floor: null, fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(2001);

// ---------- 共通の小物 ----------
const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.35, 'rgba(255,200,90,.55)'); gr.addColorStop(1, 'rgba(255,170,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
function makeGlow(s = 1, color = 0xffd27a) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.set(s, s, 1); sp.renderOrder = 5; return sp; }
function makeRing(r = 0.2) { // 無地の金の輪（文字・模様なし）
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.2, 16, 48), new THREE.MeshLambertMaterial({ color: '#f2c14e', emissive: '#a8740e' }));
  g.add(t);
  const gl = makeGlow(r * 7); g.add(gl);
  g.userData = { t, gl };
  return g;
}
// 布の包み（ひもで十字にしばってある。すきまから光がもれる）
function makeParcel(s = 1) {
  const g = new THREE.Group();
  const cloth = box(0.34 * s, 0.22 * s, 0.26 * s, mat('#b8946a')); g.add(cloth);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 10, 8), mat('#5a3a22')); knot.position.y = 0.12 * s; g.add(knot);
  for (const [w, d] of [[0.36, 0.03], [0.03, 0.28]]) { const st = box(w * s, 0.235 * s, d * s, mat('#5a3a22')); g.add(st); }
  const gl = makeGlow(1.2 * s, 0xffc070); gl.position.set(0, 0.06 * s, 0.1 * s); gl.material.depthTest = false; gl.renderOrder = 6; g.add(gl);
  const SP = []; for (let i = 0; i < 10; i++) { const sp = makeGlow(0.11 * s, 0xffe0a0); sp.material.depthTest = false; sp.renderOrder = 6; g.add(sp); SP.push(sp); }
  g.userData = { cloth, gl, SP, s };
  return g;
}
function animParcel(pc, t, k = 1, color = null) {
  const { gl, SP, s } = pc.userData;
  gl.scale.setScalar(s * k * (1.15 + Math.sin(t * 5.2) * 0.12 + Math.sin(t * 13) * 0.05));
  if (color) gl.material.color.set(color);
  SP.forEach((sp, i) => { const u = (t * 0.45 + i / SP.length) % 1; sp.position.set(Math.sin(i * 2.3 + t * 0.7) * (0.08 + u * 0.22) * s, 0.12 * s + u * 0.7 * s, (Math.cos(i * 1.7) * 0.12 + 0.12) * s); sp.material.opacity = (1 - u) * 0.9; if (color) sp.material.color.set(color); });
}
function cloak(p, color) { const c = box(0.54, 0.95, 0.05, mat(color)); c.position.set(0, 1.0, -0.17); p.add(c); return c; }
function hood(p, color) { const h = box(0.48, 0.24, 0.46, mat(color)); h.position.set(0, 0.5, -0.02); p.userData.head.add(h); const bk = box(0.48, 0.42, 0.08, mat(color)); bk.position.set(0, 0.26, -0.22); p.userData.head.add(bk); return [h, bk]; }
function inHand(p, obj, side = 1) { p.userData.arms[side].add(obj); return obj; }
function handMark(p, side) { const m = new THREE.Object3D(); m.position.set(0, -0.66, 0.06); p.userData.arms[side].add(m); return m; }

// 小さな種族の若者たち（4人）
const SMALL = [
  { skin: '#f1c9a5', hair: '#4a3426', shirt: '#c9a46a', pants: '#5a4a3a', scale: 0.68 },
  { skin: '#efcfae', hair: '#6b4a33', shirt: '#7a8a4a', pants: '#4a3a2a', scale: 0.66 },
  { skin: '#e8b98f', hair: '#9a6a3a', shirt: '#b8573a', pants: '#3b3f4a', scale: 0.67 },
  { skin: '#f5d3b5', hair: '#2c2421', shirt: '#5a7aa0', pants: '#5a4a3a', scale: 0.65 },
];
// ex：4段目（夜のたき火）でフードをかぶせるときに隠す、種族のわかる小物
function makeSmall(i) { const p = makePerson(SMALL[i]); cloak(p, ['#4a5a3a', '#5a4a3a', '#3a4a5a', '#5a5a3a'][i]); p.userData.ex = []; return p; }
function makeWizard() {
  const p = makePerson({ skin: '#efcfae', hair: '#d8d8d8', shirt: '#3a4a7a', pants: '#3a4a7a' });
  const robe = box(0.6, 0.9, 0.4, mat('#3a4a7a')); robe.position.y = 0.5; p.add(robe);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), mat('#2e3a62')); brim.position.y = 0.52; p.userData.head.add(brim);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 16), mat('#2e3a62')); cone.position.y = 0.88; cone.rotation.z = 0.12; p.userData.head.add(cone);
  const beard = box(0.34, 0.42, 0.08, mat('#e4e4e4')); beard.position.set(0, 0.0, 0.2); p.userData.head.add(beard);
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.9, 8), mat('#6b4a2a')); staff.position.set(0, -0.62, 0.08); inHand(p, staff);
  const orb = makeGlow(0.5, 0xbfe0ff); orb.position.set(0, -1.6, 0.08); inHand(p, orb); p.userData.orb = orb;
  p.userData.ex = [brim, cone, beard, orb];
  return p;
}
function makeElf() {
  const p = makePerson({ skin: '#f5d3b5', hair: '#3a3a4a', shirt: '#3f6b4a', pants: '#3a4a3a', long: true, scale: 1.04 });
  const ex = [];
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), mat('#f5d3b5')); e.position.set(s * 0.23, 0.33, 0); e.rotation.z = -s * 0.9; p.userData.head.add(e); ex.push(e); }
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 20, Math.PI), mat('#8a6a3a')); bow.position.set(0.0, 1.15, -0.2); bow.rotation.z = Math.PI / 2 + 0.3; p.add(bow); ex.push(bow);
  cloak(p, '#2f4a3a');
  p.userData.ex = ex;
  return p;
}
function makeDwarf() {
  const p = makePerson({ skin: '#e8b98f', hair: '#5a3a2a', shirt: '#7a3a2a', pants: '#3a3030' });
  p.scale.set(0.86, 0.7, 0.86);
  const beard = box(0.44, 0.5, 0.12, mat('#5a3a2a')); beard.position.set(0, -0.02, 0.2); p.userData.head.add(beard);
  const helm = box(0.46, 0.14, 0.44, mat('#8a8a8a')); helm.position.y = 0.5; p.userData.head.add(helm);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), mat('#5a3a1a')); hd.position.set(0, -0.7, 0.1); inHand(p, hd);
  const blade = box(0.05, 0.3, 0.32, mat('#b8bcc2')); blade.position.set(0, -1.05, 0.26); inHand(p, blade);
  p.userData.ex = [beard, helm, hd, blade];
  return p;
}
function makeHuman(i) {
  const o = [{ skin: '#e8b98f', hair: '#2c2421', shirt: '#3a3a30', pants: '#2b2b2b' }, { skin: '#efcfae', hair: '#6b4a33', shirt: '#7a3a3a', pants: '#3b3f4a' }][i];
  const p = makePerson(o);
  cloak(p, ['#2f3a2a', '#4a2a2a'][i]);
  if (i === 0) { const sw = box(0.06, 0.95, 0.04, mat('#c8ccd2')); sw.position.set(0, -1.05, 0.06); inHand(p, sw); p.userData.ex = [sw]; }
  else { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 20), mat('#8a6a3a')); sh.rotation.x = Math.PI / 2; sh.position.set(-0.1, -0.4, 0.14); inHand(p, sh, 0); p.userData.ex = [sh]; }
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
  g.userData = { smoke, h, r, gl, lava };
  return g;
}
function puff(v, t) { const { smoke, h, r } = v.userData; smoke.forEach((s, i) => { const u = ((t * 0.12 + i / smoke.length) % 1); s.position.set(Math.sin(i * 2.1) * r * 0.1 + u * r * 0.3, h + 0.6 + u * r * 0.9, Math.cos(i * 1.7) * r * 0.1); s.scale.setScalar(0.6 + u * 1.4); s.material.opacity = 0.75 * (1 - u); }); }
// 暗い雲（闇の気配）
function clouds(g, n, x0, x1, y, z, rr = 2.2, fog = true) { const out = []; for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(rr + R() * rr * 0.7, 12, 10), new THREE.MeshLambertMaterial({ color: '#2a1416', emissive: '#3a0a06', transparent: true, opacity: 0.9, fog })); c.scale.y = 0.5; c.userData.b = [lerp(x0, x1, i / Math.max(1, n - 1)) + (R() - 0.5) * rr, y + R() * rr * 0.6, z - R() * rr]; c.position.set(...c.userData.b); g.add(c); out.push(c); } return out; }

const GROUPS = [];
function zone(x) { const g = new THREE.Group(); g.position.set(x, 0, 0); qs.add(g); GROUPS.push(g); return g; }

// ---------- 1〜2段目. のどかな村（x=0） ----------
const VIL = zone(0);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat('#6f9a4a')); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; VIL.add(gr);
  [[-6, -10, 6, 2.2, '#5f8a40'], [5, -12, 7, 2.6, '#6a9446'], [0, -18, 9, 3.4, '#58823c'], [-12, -16, 7, 2.8, '#64903f'], [12, -18, 8, 3.0, '#5a843d']].forEach(a => VIL.add(hill(...a)));
  [[-3.4, -5.2, 0.3], [2.6, -6.0, -0.2], [-0.2, -8.6, 0], [5.4, -9.2, -0.4], [-6.2, -8.4, 0.5]].forEach(([x, z, r], i) => VIL.add(cottage(x, z, r, i === 2 ? 0.9 : 1)));
  [[-5, -3.2, 1.1], [4.8, -3.6, 1.2], [-1.6, -11.5, 1.3], [7.4, -6.6, 1.0], [-8, -6, 1.2], [1.4, -12.6, 1.1], [-3.0, 3.5, 1.2], [3.6, 4.0, 1.1]].forEach(([x, z, s]) => VIL.add(tree(x, z, s)));
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 14), mat('#b89a6a')); path.rotation.x = -Math.PI / 2; path.position.set(0.4, 0.01, -2); VIL.add(path);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff0c8', fog: false })); sun.position.set(-14, 9, -60); VIL.add(sun); VIL.userData.sun = sun;
}
const hero1 = makeSmall(0); hero1.position.set(0.3, 0, 1.4); hero1.rotation.y = -0.15; VIL.add(hero1);
const HM1 = [handMark(hero1, 0), handMark(hero1, 1)];
const PARCEL1 = makeParcel(1); VIL.add(PARCEL1);
const PLIGHT1 = new THREE.PointLight(0xffb060, 0, 5, 1.4); VIL.add(PLIGHT1);
const VCLOUD = clouds(VIL, 10, -16, 16, 7.5, -22, 3.2);
const tKeep = tag('誰にも渡すな', { size: 70, w: 500, bg: '#e2483c', sx: 1.25 }); VIL.add(tKeep);
const tPower = tag('世界を滅ぼす力', { size: 70, w: 560, bg: 'rgba(10,12,18,.9)', color: '#ff9a6a' }); VIL.add(tPower);

// ---------- 3段目. 森と丘の世界（x=290）。遠くの空だけが暗い ----------
const LAND = zone(290);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), mat('#6a8a4a')); gr.rotation.x = -Math.PI / 2; gr.position.z = -80; gr.receiveShadow = true; LAND.add(gr);
  for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * 70, z = 4 - R() * 70; LAND.add(hill(x, z, 4 + R() * 6, 1.4 + R() * 3.2, ['#5f8a40', '#6a9446', '#58823c', '#64903f'][i % 4])); }
  for (let i = 0; i < 90; i++) { const x = (R() - 0.5) * 60, z = 6 - R() * 60; if (Math.abs(x + z * 0.12) < 2.0) continue; LAND.add(R() < 0.6 ? pine(x, z, 1.2 + R() * 1.4, ['#2e5a3a', '#244a30', '#386a40'][i % 3]) : tree(x, z, 1.1 + R() * 0.9, ['#3f6b3a', '#4a7a3e'][i % 2])); }
  const river = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 120), new THREE.MeshLambertMaterial({ color: '#7aa8c8' })); river.rotation.x = -Math.PI / 2; river.rotation.z = 0.12; river.position.set(-1, 0.03, -40); LAND.add(river);
  for (let i = 0; i < 12; i++) { const s = i - 5.5; const h = 14 + R() * 10; const m = new THREE.Mesh(new THREE.ConeGeometry(9 + R() * 6, h, 6), mat(i % 2 ? '#6a6e7a' : '#5e6470')); m.position.set(s * 13 + (R() - 0.5) * 4, h / 2 - 0.5, -100 - R() * 14); LAND.add(m); const cap = new THREE.Mesh(new THREE.ConeGeometry(3.0, 3.6, 6), mat('#eef2f6')); cap.position.set(m.position.x, h - 2.0, m.position.z); LAND.add(cap); }
}
const LCLOUD = clouds(LAND, 16, 0, 90, 13, -125, 8, false); LCLOUD.forEach(c => { c.material.transparent = false; c.material.color.set('#3a2228'); c.material.emissive.set('#2a0a08'); });
const LRED = makeGlow(70, 0xff5a2a); LRED.position.set(45, 6, -128); LRED.material.opacity = 0.35; LAND.add(LRED);
const LFLASH = makeGlow(40, 0xffe0d0); LFLASH.position.set(45, 16, -120); LAND.add(LFLASH);
const tDark = tag('闇の冥王', { size: 76, bg: 'rgba(10,12,18,.9)', color: '#ff9a6a', sx: 30 }); tDark.material.fog = false; tDark.position.set(42, 36, -118); LAND.add(tDark);

// ---------- 4段目. 夜のたき火を囲む9人（x=170）。フードで種族はまだ見せない ----------
const WOOD = zone(170);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat('#24302a')); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; WOOD.add(gr);
  for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, r = 5 + R() * 14; WOOD.add(pine(Math.cos(a) * r, Math.sin(a) * r - 3, 1.6 + R() * 1.4, '#16261e')); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), new THREE.MeshBasicMaterial({ color: '#e8ecf4', fog: false })); moon.position.set(-6, 12, -40); WOOD.add(moon);
  const clr = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), mat('#6a5a44')); clr.rotation.x = -Math.PI / 2; clr.position.y = 0.01; clr.receiveShadow = true; WOOD.add(clr);
  for (let i = 0; i < 5; i++) { const lg = box(0.9, 0.12, 0.12, mat('#4a3020')); lg.position.set(0, 0.08, 0); lg.rotation.y = i * Math.PI / 5; WOOD.add(lg); }
}
const FIRE = new THREE.Group(); WOOD.add(FIRE);
const FLAMES = [['#ff7a1a', 0.32, 0.9], ['#ffb02a', 0.22, 0.7], ['#ffe07a', 0.12, 0.45]].map(([c, r, h]) => { const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), new THREE.MeshBasicMaterial({ color: c })); f.position.y = 0.12 + h / 2; FIRE.add(f); f.userData.h = h; return f; });
const FGLOW = makeGlow(2.6, 0xff9a3a); FGLOW.position.y = 0.55; FIRE.add(FGLOW);
const FLIGHT = new THREE.PointLight(0xff9a4a, 0, 9, 1.4); FLIGHT.position.y = 0.9; WOOD.add(FLIGHT);
const MOONL = new THREE.PointLight(0xaabbe0, 0, 30, 1.2); MOONL.position.set(-3, 8, -4); WOOD.add(MOONL);
const FS4 = makeFellowship();
const HOODC = ['#4a5a3a', '#5a4a3a', '#3a4a5a', '#5a5a3a', '#4a4a52', '#2f4a3a', '#4a3a30', '#2f3a2a', '#4a2a2a'];
const CAMP_A = [Math.PI - 0.5, Math.PI + 0.55, Math.PI - 1.25, Math.PI + 1.3, Math.PI + 0.05, Math.PI - 1.95, Math.PI + 2.0, Math.PI - 2.55, Math.PI + 2.6];
FS4.forEach((p, i) => { p.userData.ex.forEach(o => o.visible = false); hood(p, HOODC[i]); const a = CAMP_A[i]; const r = i < 4 ? 1.35 : (i === 4 ? 2.0 : 1.75); const x = Math.sin(a) * r, z = Math.cos(a) * r; p.position.set(x, 0, z); p.rotation.y = Math.atan2(-x, -z); p.userData.s0 = p.scale.clone(); WOOD.add(p); });

const HM4 = [handMark(FS4[0], 0), handMark(FS4[0], 1)];
const PARCEL4 = makeParcel(1); WOOD.add(PARCEL4);

// ---------- 5段目. 9人の種族がわかる（x=60） ----------
const MEET = zone(60);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat('#7a9a5a')); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; MEET.add(gr);
  [[-7, -14, 8, 4, '#6a8a4c'], [6, -16, 9, 5, '#62844a'], [0, -26, 14, 8, '#8a9aa8']].forEach(a => MEET.add(hill(...a)));
  [[-4.4, -4, 1.4], [4.6, -5, 1.6], [-6, -8, 1.3], [6.4, -9, 1.5]].forEach(([x, z, s]) => MEET.add(pine(x, z, s, '#2e5a3a')));
}
const FS = makeFellowship();
const FS_POS = [[-1.3, 1.1], [-0.65, 1.2], [0, 1.2], [0.65, 1.15], [0.45, -0.3], [-1.35, -0.4], [1.3, 1.05], [-0.45, -0.3], [1.35, -0.4]];
FS.forEach((p, i) => { p.position.set(FS_POS[i][0], 0, FS_POS[i][1]); MEET.add(p); });
FS[5].rotation.y = 0.2; FS[8].rotation.y = -0.2; FS[6].rotation.y = -0.15;
const T5 = [['魔法使い', 4, 3.05], ['エルフ', 5, 2.45], ['ドワーフ', 6, 1.55], ['人間', 8, 2.45]].map(([s, i, y]) => { const t = tag(s, { size: 52, w: 270, h: 104 }); t.position.set(FS_POS[i][0], y, FS_POS[i][1] + 0.3); MEET.add(t); return t; });
const MCLOUD = clouds(MEET, 9, -10, 10, 6.5, -16, 2.4);
const MSHADE = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#07080a' }); const b = box(0.8, 1.5, 0.6, m); b.position.y = 0.85; g.add(b); const hd = box(0.55, 0.45, 0.5, m); hd.position.set(0, 1.75, 0.08); g.add(hd); for (const s of [-1, 1]) { const e = box(0.1, 0.06, 0.02, new THREE.MeshBasicMaterial({ color: '#ff3a2a', fog: false })); e.position.set(s * 0.12, 1.8, 0.34); g.add(e); } g.userData.x = [-5.0, -3.9, -2.8, 2.8, 3.9, 5.0][i]; g.position.set(g.userData.x, 0, -12); MEET.add(g); MSHADE.push(g); }
const tChase = tag('冥王の手下', { size: 64, w: 420, bg: '#e2483c' }); tChase.position.set(0, 5.6, -12); MEET.add(tChase);

function hillY(x, z) { const f = (cx, cz, r, h) => { const d = ((x - cx) ** 2 + (z - cz) ** 2) / (r * r); return d < 1 ? h * Math.sqrt(1 - d) : 0; }; return Math.max(f(-7, -14, 8, 4), f(6, -16, 9, 5), 0); }

// ---------- 6段目（決め手）・クイズ. 果てしない旅の先の火山（x=230） ----------
const VISTA = zone(230);
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat('#5a6a4a')); gr.rotation.x = -Math.PI / 2; gr.position.z = -60; VISTA.add(gr);
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(3, 6, 3, 9), mat('#6a6a5a')); ridge.position.set(0, 1.5, 0); VISTA.add(ridge);
  for (let i = 0; i < 14; i++) { const s = i % 2 ? -1 : 1; const h = 10 + R() * 12; const m = new THREE.Mesh(new THREE.ConeGeometry(8 + R() * 6, h, 6), mat(i % 3 ? '#4a4e58' : '#545a64')); m.position.set(s * (14 + R() * 30), h / 2 - 0.5, -30 - i * 9); VISTA.add(m); }
}
const VOL6 = volcano(30, 22); VOL6.position.set(-6, 0, -140); VISTA.add(VOL6);
const TOP6 = new THREE.Group(); TOP6.position.y = 3.0; VISTA.add(TOP6);
const FS6 = makeFellowship(); FS6.forEach((p, i) => { p.position.set(-1.6 + i * 0.4, 0, 0.8 - i * 0.18); p.rotation.y = Math.PI - 0.2; TOP6.add(p); });
const HM6 = [handMark(FS6[0], 0), handMark(FS6[0], 1)];
const PARCEL6 = makeParcel(1); VISTA.add(PARCEL6);
const RING6 = makeRing(0.09); VISTA.add(RING6);
const tRing = tag('ひとつの指輪', { size: 72, w: 470, bg: '#e6b450', color: '#14161c', sx: 0.62 }); VISTA.add(tRing);
const tFire = tag('火山の炎でしか壊せない', { size: 60, w: 760, bg: '#e2483c', sx: 30 }); tFire.material.fog = false; tFire.position.set(-6, 49, -140); VISTA.add(tFire);
const RING7 = makeRing(0.45); VISTA.add(RING7);

// ---------- shots ----------
const ALLTAG = [tKeep, tPower, tDark, ...T5, tChase, tRing, tFire];
function base(zoneG) {
  S.reset(); GROUPS.forEach(g => g.visible = g === zoneG); ALLTAG.forEach(x => x.visible = false);
  MOONL.intensity = 0; S.scene.fog.near = 30; S.scene.fog.far = 110;
}
function sky(c) { S.scene.background.set(c); S.scene.fog.color.set(c); }
function spinRing(rg, t, fast = 1) { rg.userData.t.rotation.y = Math.sin(t * 0.9 * fast) * 0.55; rg.userData.gl.material.opacity = 0.75 + Math.sin(t * 3) * 0.2; }
function idle(ps, t) { ps.forEach((p, i) => { poseWalk(p, 0, 0); p.userData.head.rotation.y = Math.sin(t * 0.8 + i) * 0.15; }); }
const W = new THREE.Vector3(), W2 = new THREE.Vector3();
function holdParcel(p, marks, pc, zoneG, lift = 0.0) { // 両手で包みを胸の前に
  const A = p.userData.arms; A[0].rotation.set(-1.05, 0, 0.38); A[1].rotation.set(-1.05, 0, -0.38);
  qs.updateMatrixWorld(); marks[0].getWorldPosition(W); marks[1].getWorldPosition(W2); W.add(W2).multiplyScalar(0.5);
  zoneG.worldToLocal(W); pc.position.copy(W).add(new THREE.Vector3(0, 0.1 + lift, 0)); pc.rotation.y = p.rotation.y;
  return pc.position;
}
function setVolcano(on) { const v = VOL6.userData; v.lava.material.color.set(on ? '#ff6a1a' : '#2a1a1a'); v.gl.visible = on; v.smoke.forEach(s => s.visible = on); }

function shotParcel(t) { // 1段目 0〜9：若者の手の中で、光る包み（0秒目がサムネ）
  base(VIL); S.aim(0, 0); lift(0);
  sky('#f0b47a'); S.hemi.intensity = 1.15; S.key.intensity = 1.2;
  VCLOUD.forEach(c => c.visible = false); VIL.userData.sun.visible = true;
  hero1.rotation.y = -0.15; poseWalk(hero1, 0, 0);
  holdParcel(hero1, HM1, PARCEL1, VIL);
  hero1.userData.head.rotation.set(0.32 - ease((t - 5.6) / 0.5) * 0.3, 0, 0); // 包みを見下ろす → 5.6秒で顔を上げる
  const fl = t > 5.6 ? 1 + 0.5 * Math.exp(-(t - 5.6) * 2.5) : 1;
  animParcel(PARCEL1, t, fl * 1.1, '#ffc070');
  PLIGHT1.position.copy(PARCEL1.position).add(new THREE.Vector3(0, 0.25, 0.4)); PLIGHT1.intensity = 1.6 * fl + Math.sin(t * 5.2) * 0.25;
  tKeep.userData.pop((t - 5.8) / 0.35); tKeep.position.set(0.3, 1.66, 1.4);
  const u = ease(t / 9);
  look(lerp(1.5, 1.1, u), lerp(1.25, 1.2, u), lerp(5.4, 4.7, u), 0.3, lerp(1.0, 1.05, u), 1.0, 50);
  return qs;
}
function shotVillage(t) { // 2段目 9〜17：のどかな村で暮らす若者。でも包みには世界を滅ぼす力
  base(VIL); S.aim(0, -2); lift(300);
  const dk = ease((t - 4.0) / 1.6);
  sky(new THREE.Color('#f0b47a').lerp(new THREE.Color('#4a2622'), dk).getStyle()); S.hemi.intensity = lerp(1.2, 0.55, dk); S.key.intensity = lerp(1.3, 0.35, dk);
  VIL.userData.sun.visible = dk < 0.6;
  VCLOUD.forEach((c, i) => { c.visible = dk > 0; const [x, y, z] = c.userData.b; c.position.set(x + Math.sin(t * 0.4 + i) * 0.6, y - (1 - dk) * 4, z + dk * 3); c.material.opacity = 0.9 * dk; });
  hero1.rotation.y = 0.0; poseWalk(hero1, 0, 0);
  holdParcel(hero1, HM1, PARCEL1, VIL);
  hero1.userData.head.rotation.set(dk * -0.15, Math.sin(t * 0.9) * 0.2 * (1 - dk), 0);
  animParcel(PARCEL1, t + 9, 1.4 + dk * 1.2, dk > 0.5 ? '#ff7a4a' : '#ffc070');
  PLIGHT1.position.copy(PARCEL1.position).add(new THREE.Vector3(0, 0.3, 0.4)); PLIGHT1.intensity = 1.2 + dk * 2.5;
  tPower.userData.pop((t - 4.6) / 0.35); tPower.position.set(0.35, 1.95, 1.4);
  const u = ease(t / 8);
  look(lerp(1.6, 0.9, u), lerp(2.6, 2.0, u), lerp(8.4, 6.2, u), 0.3, lerp(1.25, 1.05, u), lerp(-1.0, 0.2, u), 50);
  return qs;
}
function shotLand(t) { // 3段目 17〜25：電気も車もない、森と丘の世界。遠くの空だけが暗い
  base(LAND); S.aim(290, -20); lift(0);
  sky('#bcd2e2'); S.hemi.intensity = 1.2; S.key.intensity = 1.3;
  S.scene.fog.near = 50; S.scene.fog.far = 230;
  const dk = ease((t - 3.8) / 1.2);
  LCLOUD.forEach((c, i) => { const [x, y, z] = c.userData.b; c.position.set(x + Math.sin(t * 0.3 + i) * 1.5, y + dk * 3, z); c.material.opacity = 1; c.scale.set(1 + dk * 0.25, 0.5 + dk * 0.15, 1); }); LRED.material.opacity = 0.15 + 0.35 * dk;
  const fk = (t > 4.2 && (Math.floor(t * 6) % 7 === 0)) ? 1 : 0; LFLASH.material.opacity = 0.15 + 0.6 * fk * dk;
  tDark.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(290 + lerp(-8, -2, u), lerp(16, 12, u), lerp(22, 14, u), 290 + lerp(4, 18, u), lerp(6, 10, u), -70, 52);
  return qs;
}
function shotCamp(t) { // 4段目 25〜33：村を旅立つ若者。夜のたき火に、背丈もばらばらの9人
  base(WOOD); S.aim(170, 0); lift(120);
  sky('#0c1220'); S.hemi.intensity = 0.3; S.key.intensity = 0.15; MOONL.intensity = 3;
  S.scene.fog.near = 8; S.scene.fog.far = 34;
  const fl = 1 + Math.sin(t * 17) * 0.08 + Math.sin(t * 7.3) * 0.08;
  FLAMES.forEach((f, i) => { f.scale.set(1, fl + Math.sin(t * 11 + i) * 0.1, 1); f.position.y = 0.12 + f.userData.h * f.scale.y / 2; });
  FGLOW.scale.setScalar(2.6 * fl); FLIGHT.intensity = 7 * fl;
  let n = 0;
  FS4.forEach((p, i) => { const k = i === 0 ? 1 : easeOut(clamp((t - 3.9 - (i - 1) * 0.3) / 0.3)); p.visible = k > 0; if (k > 0) n++; p.scale.copy(p.userData.s0).multiplyScalar(0.0001 + k); poseWalk(p, 0, 0); p.userData.head.rotation.set(0.12, Math.sin(t * 0.7 + i) * 0.15, 0); });
  holdParcel(FS4[0], HM4, PARCEL4, WOOD); animParcel(PARCEL4, t, 0.8, '#ffc070');
  if (t > 3.9) setTop('旅の仲間', `${n}人`, clamp((t - 3.9) / 0.2), '#e6b450');
  const u = ease(t / 8);
  const r = lerp(4.2, 6.2, ease((t - 3.4) / 3)), a = lerp(-0.2, 0.15, u);
  look(170 + Math.sin(a) * r, lerp(1.9, 3.3, u), Math.cos(a) * r, 170 + lerp(0.5, 0, ease((t - 3.4) / 3)), lerp(0.9, 0.8, u), lerp(-1.0, -0.3, u), 52);
  return qs;
}
function shotFellow(t) { // 5段目 33〜42：魔法使い、エルフ、ドワーフ、人間。冥王の手下に追われるファンタジー
  base(MEET); S.aim(60, 0); lift(170);
  const dk = ease((t - 4.2) / 1.2);
  sky(new THREE.Color('#a8c4dc').lerp(new THREE.Color('#3a2a34'), dk).getStyle()); S.hemi.intensity = lerp(1.25, 0.7, dk); S.key.intensity = lerp(1.4, 0.7, dk);
  idle(FS, t);
  FS[4].userData.arms[1].rotation.x = -0.35; FS[4].userData.orb.material.opacity = 0.8;
  if (t < 4.2) T5.forEach((x, i) => x.userData.pop((t - 0.6 - i * 0.55) / 0.3));
  MCLOUD.forEach((c, i) => { c.visible = dk > 0; const [x, y, z] = c.userData.b; c.position.set(x + Math.sin(t * 0.5 + i) * 0.4, y, z); c.material.opacity = 0.9 * dk; });
  MSHADE.forEach((g, i) => { const k = ease((t - 4.4 - i * 0.12) / 3.5); g.visible = t > 4.4; const gx = g.userData.x * (1 - 0.1 * k), gz = -12.5 - (i % 2) * 0.5 + k * 1.2; g.position.set(gx, hillY(gx, gz) - 0.6, gz); g.rotation.y = Math.sin(t * 0.7 + i) * 0.2; });
  tChase.userData.pop((t - 5.2) / 0.35); tChase.position.z = -12 + ease((t - 4.4) / 3.5) * 1.2;
  if (dk > 0.3) FS.forEach((p, i) => { p.userData.head.rotation.y = Math.PI * 0.0 + Math.sin(t * 1.4 + i) * 0.3; });
  const u = ease(t / 9);
  look(60 + lerp(0.3, -0.1, u), lerp(2.1, 2.6, u), lerp(9.8, 10.6, u), 60, lerp(1.5, 1.7, u), lerp(0, -2, u), 50);
  return qs;
}
const DUSK = '#3a2a3a';
function shotReveal(t) { // 6段目 42〜49（決め手）：包みの中身は、ひとつの指輪。火山の炎でしか壊せない
  base(VISTA); S.aim(230, 0); lift(0);
  const d = ease(t / 6);
  sky(new THREE.Color('#d88a5a').lerp(new THREE.Color(DUSK), d * 0.6).getStyle()); S.hemi.intensity = lerp(1.0, 0.7, d); S.key.intensity = lerp(1.1, 0.6, d);
  S.scene.fog.near = 40; S.scene.fog.far = 260;
  idle(FS6, t);
  const hero = FS6[0]; hero.rotation.y = lerp(-0.35, Math.PI - 0.2, ease((t - 3.0) / 1.4));
  const pp = holdParcel(hero, HM6, PARCEL6, VISTA).clone();
  const open = easeOut(clamp((t - 0.3) / 0.6));
  PARCEL6.visible = open < 1; PARCEL6.userData.cloth.parent.scale.setScalar(Math.max(0.001, 1 - open));
  animParcel(PARCEL6, t, 1.2, '#ffc070');
  const rise = easeOut(clamp((t - 0.4) / 1.0));
  RING6.visible = t > 0.35; RING6.position.copy(pp).add(new THREE.Vector3(0, -0.04 + rise * 0.06 + Math.sin(t * 2) * 0.012, 0.05)); spinRing(RING6, t, 1.2);
  RING6.scale.setScalar(Math.max(0.001, rise)); RING6.userData.gl.scale.setScalar(0.77 * (1 + 0.4 * Math.exp(-(t - 0.6) * 2)));
  const on = t > 3.2; setVolcano(on); if (on) { puff(VOL6, t); VOL6.userData.gl.scale.setScalar(30.8 * easeOut(clamp((t - 3.2) / 0.6))); }
  tRing.userData.pop((t - 1.0) / 0.35); tRing.position.copy(RING6.position).add(new THREE.Vector3(-0.05, 0.6, 0)); if (t > 3.2) tRing.visible = false;
  tFire.userData.pop((t - 4.3) / 0.35);
  const k = ease((t - 3.0) / 3.0);
  look(lerp(227.5, 233.6, k), lerp(4.35, 9.0, k), lerp(3.3, 14.5, k), lerp(228.35, 229, k), lerp(3.85, 9.0, k), lerp(0.75, -20, k), lerp(46, 52, k));
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？
  base(VISTA); S.aim(230, 0); lift(0);
  sky(new THREE.Color('#d88a5a').lerp(new THREE.Color(DUSK), 0.6 + 0.3 * ease(t / 7)).getStyle()); S.hemi.intensity = 0.65; S.key.intensity = 0.55;
  S.scene.fog.near = 40; S.scene.fog.far = 260;
  setVolcano(true); VOL6.userData.gl.scale.setScalar(30.8); PARCEL6.visible = false; RING6.visible = false;
  puff(VOL6, t + 7); idle(FS6, t + 7); FS6[0].rotation.y = Math.PI - 0.2; FS6[0].userData.arms.forEach(a => a.rotation.z = 0);
  const k = ease(t / 7);
  const k2 = ease(t / 3.4);
  look(234, lerp(9.0, 12.6, k2), lerp(14, 16, k), 229, lerp(6.6, 8.6, k), lerp(-20, -24, k), 52);
  RING7.visible = true; RING7.position.set(3.0, lerp(8.9, 12.2, k2), lerp(7.6, 9.4, k)); spinRing(RING7, t, 0.6);
  RING7.scale.setScalar(easeOut(clamp((t - 0.4) / 0.8)) + 0.0001);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotParcel },
  { a: 9, b: 17, f: shotVillage },
  { a: 17, b: 25, f: shotLand },
  { a: 25, b: 33, f: shotCamp },
  { a: 33, b: 42, f: shotFellow },
  { a: 42, b: 49, f: shotReveal },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ある日、若者が<br>小さな包みを預かった。'],
  [5.6, 9.0, '決して、誰にも<br>渡してはならない。'],
  [9.2, 13.2, '彼は、のどかな村で<br>静かに暮らす若者。'],
  [13.2, 17.0, 'でもその包みには、<br>世界を滅ぼす力がある。'],
  [17.2, 21.0, '電気も車もない、<br>森と丘の広がる世界。'],
  [21.0, 25.0, 'その遠くで、包みを<br>ねらう闇の冥王。'],
  [25.2, 29.0, '冥王に渡さないため、<br>若者は村を旅立つ。'],
  [29.0, 33.0, '共に行くのは、背丈も<br>生まれもばらばらの9人。'],
  [33.2, 37.4, '魔法使い、エルフ、<br>ドワーフ、そして人間。'],
  [37.4, 41.8, '冥王の手下に追われる、<br>壮大なファンタジー。'],
  [42.2, 45.4, '包みの中身は、<br>ひとつの指輪。'],
  [45.4, 49.0, '火山の炎で壊すまで、<br>この旅は終わらない。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ロード・オブ・ザ・リング。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotParcel || f === shotVillage || f === shotLand || f === shotFellow,
  meta: {
    id: 'q009', v2: true, answer: 'ロード・オブ・ザ・リング',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 2001,
    hits: [5.6, 13.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.6, 21.0, 42.6, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.2, 'drone'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.4, 'drone'], [42.0, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '預かった': 'あずかった', '決して': 'けっして', '渡してはならない': 'わたしてはならない', '渡さない': 'わたさない', '静かに': 'しずかに', '暮らす': 'くらす', '若者': 'わかもの', '包み': 'つつみ', '滅ぼす': 'ほろぼす', '電気': 'でんき', '広がる': 'ひろがる', '森と丘': 'もりとおか', '遠く': 'とおく', '闇': 'やみ', '冥王': 'めいおう', '旅立つ': 'たびだつ', '共に': 'ともに', '背丈': 'せたけ', '生まれ': 'うまれ', '9人': 'きゅうにん', '魔法使い': 'まほうつかい', '人間': 'にんげん', '手下': 'てした', '追われる': 'おわれる', '壮大': 'そうだい', '中身': 'なかみ', '指輪': 'ゆびわ', '火山': 'かざん', '炎': 'ほのお', '壊す': 'こわす', '誰': 'だれ', '彼': 'かれ' },
    caption: 'この映画のタイトル、わかる？\nある日、のどかな村で静かに暮らす若者が、小さな包みを預かった。決して、誰にも渡してはならない。その包みには、世界を滅ぼす力があった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画紹介', 'ファンタジー'],
  },
});
applyQuizCards({ answer: 'ロード・オブ・<br>ザ・リング', info: 'Netflix｜映画・178分', answerSize: 104 });
