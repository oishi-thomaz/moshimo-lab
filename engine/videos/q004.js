import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #004 愛の不時着（ドラマ・韓国・全16話。Netflixで見放題、netflix.com/jp/title/81159258 で2026/11/1確認。Filmarks 4.5）
// 設定：韓国の財閥令嬢がパラグライダーの事故で北朝鮮に不時着し、堅物の将校の家で身分を隠して暮らす（Netflix 作品紹介・Filmarks 作品ページ）
// 追加の事実（2026/11/2 確認）：
//   ・令嬢は韓国最大の財閥の末娘で、自らファッションブランドを立ち上げた（ciatr.jp/topics/315920）
//   ・森の木に引っかかって動けなくなったところを将校に見つかり、将校と部下たちを説得して彼の家にかくまってもらう（thetv.jp/program/0000983056/plot/ 第1・2話）
//   ・将校の家は軍人の舎宅村にあり、近所の奥様たちは彼の婚約者（と名乗る彼女）に興味しんしん（ciatr.jp/topics/315920 第1・3話）
// 構成：ヒント6段（森で圏外・背後に足音 → 財閥の末娘で社長 → 古い家が並ぶ村 → 堅物の軍人の家に身分を隠して同居 → 韓国と北・ラブロマンス → 決め手のパラグライダーで境界線越え）
//       パラグライダー・境界線は6段目まで字幕にも映像にも出さない。作品名・人物名・地名・看板の文字も出さない
// 作品の映像・衣装・ロゴ・有名な場面の構図（竜巻・木に引っかかる場面など）は使わず、設定だけを汎用の3Dで見せる。軍服は作品と違う色、国旗や実在の記章は出さない

const S = quizStage({ bg: '#8fb3d6', floor: '#5f7d4a', fogNear: 30, fogFar: 95 });
const qs = S.scene;
const R = rng(404);

const HEIRESS = { skin: '#f5d3b5', hair: '#3a2a22', shirt: '#3f8f9a', pants: '#2b3346', long: true };
const HER_OFFICE = { ...HEIRESS, shirt: '#efe6d8', pants: '#3a3236' };
const HER_PLAIN = { ...HEIRESS, shirt: '#b98a6a', pants: '#5a4a3a' };
const OFFICER = { skin: '#efcfae', hair: '#141414', shirt: '#56606e', pants: '#56606e' };
const AUNT = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f', '#f5d3b5'][i % 4], hair: ['#2c2421', '#1a1a22', '#4a3426', '#2c2421'][i % 4], shirt: ['#c94f6a', '#4f8fc9', '#d9a44a', '#7a5ca8'][i % 4], pants: ['#3b3f4a', '#5a4a3a', '#2b3346', '#4a3a4a'][i % 4], long: true, skirt: true });
function cap(p, color = '#3c4450') { const h = p.userData.head; const c = box(0.46, 0.12, 0.46, mat(color)); c.position.y = 0.53; h.add(c); const v = box(0.42, 0.03, 0.2, mat('#22262c')); v.position.set(0, 0.47, 0.28); h.add(v); }
function tree(x, z, s = 1, c = '#2f5a34') { const g = new THREE.Group(); const tr = box(0.22 * s, 1.2 * s, 0.22 * s, mat('#5a4030')); tr.position.y = 0.6 * s; g.add(tr); for (let k = 0; k < 3; k++) { const cn = new THREE.Mesh(new THREE.ConeGeometry((1.0 - k * 0.22) * s, 1.3 * s, 8), mat(c)); cn.position.y = (1.4 + k * 0.7) * s; cn.castShadow = true; g.add(cn); } g.position.set(x, 0, z); qs.add(g); return g; }
function house(x, z, col = '#e8e0cf', w = 4.2) { const g = new THREE.Group(); g.position.set(x, 0, z); const wall = box(w, 2.0, 2.8, mat(col)); wall.position.y = 1.0; g.add(wall); const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, 1.2, 4), mat('#5a4636')); roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, 0.66); roof.position.y = 2.6; g.add(roof); const door = box(0.8, 1.5, 0.06, mat('#6a4a30')); door.position.set(w * 0.18, 0.75, 1.42); g.add(door); const win = box(0.9, 0.6, 0.05, mat('#f6e7b8')); win.position.set(-w * 0.22, 1.25, 1.42); g.add(win); qs.add(g); return g; }

// ---------- 1段目. 森で圏外（x=0）。0秒目がサムネ ----------
for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, r = 2.6 + R() * 7; const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8 - 3.5; if (z > -3.4 && Math.abs(x) < 5.5) continue; tree(x, z, 1.1 + R() * 0.7, ['#2f5a34', '#2a5230', '#36603a'][i % 3]); }
const TRUNK = new THREE.Group(); TRUNK.position.set(-1.7, 0, -2.4); qs.add(TRUNK);
{ const t = box(0.55, 4.2, 0.55, mat('#4a3628')); t.position.y = 2.1; TRUNK.add(t); for (let k = 0; k < 2; k++) { const cn = new THREE.Mesh(new THREE.ConeGeometry(1.8 - k * 0.4, 2.0, 8), mat('#2a5230')); cn.position.y = 4.4 + k * 1.1; TRUNK.add(cn); } }
for (let i = 0; i < 5; i++) { const br = box(0.6 + R() * 0.5, 0.06, 0.06, mat('#5a4030')); br.position.set(-0.9 + R() * 2.0, 0.04, 0.4 + R() * 1.0); br.rotation.y = R() * 3; qs.add(br); }
const her1 = makePerson(HEIRESS); her1.position.set(0.15, 0, 0.3); her1.rotation.y = 0.15; qs.add(her1);
const phoneTex = canvasTex(128, 232, (g, w, h) => { g.fillStyle = '#1a1c22'; g.beginPath(); g.roundRect(0, 0, w, h, 18); g.fill(); g.fillStyle = '#2c3a52'; g.fillRect(10, 14, w - 20, h - 28); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(22 + i * 22, 110 - i * 18, 15, 22 + i * 18); } g.strokeStyle = '#ff4a3a'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(28, 60); g.lineTo(100, 132); g.moveTo(100, 60); g.lineTo(28, 132); g.stroke(); });
const PHONE = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.3), new THREE.MeshBasicMaterial({ map: phoneTex, transparent: true }));
her1.userData.arms[1].add(PHONE); PHONE.position.set(0, -0.86, 0.09);
const LEAVES = []; for (let i = 0; i < 34; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshLambertMaterial({ color: ['#6f9a3a', '#c9a23a', '#4f7a34', '#d9813a'][i % 4], side: THREE.DoubleSide })); l.userData.x = (R() - 0.5) * 5; l.userData.z = -2 + R() * 3.4; l.userData.y = R() * 4.6; l.userData.s = 0.35 + R() * 0.4; qs.add(l); LEAVES.push(l); }
const shadowP = makePerson({ skin: '#2a2e36', hair: '#101216', shirt: '#1c2028', pants: '#161a20' }); shadowP.position.set(-1.7, 0, -3.0); qs.add(shadowP);
const tSignal = tag('圏外', { size: 84, w: 240, bg: '#e2483c', sx: 0.6 }); qs.add(tSignal);
const tStep = tag('足音', { size: 80, w: 240, bg: '#14161c', sx: 0.7 }); qs.add(tStep);

// ---------- 2段目. 自分のブランドを持つ社長（x=30） ----------
const OFFICE = new THREE.Group(); OFFICE.position.set(30, 0, 0); qs.add(OFFICE);
{ const fl = box(10, 0.06, 9, mat('#d8d2c8')); fl.position.set(0, 0.03, 0.5); OFFICE.add(fl);
  const skyTex = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f9ed6'); gr.addColorStop(1, '#d9e6f2'); g.fillStyle = gr; g.fillRect(0, 0, w, h); let x = 0; let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; while (x < w) { const bw = 40 + r() * 70, bh = 120 + r() * 300; g.fillStyle = ['#7a8aa0', '#8e9cb0', '#6c7c94'][Math.floor(r() * 3)]; g.fillRect(x, h - bh, bw - 6, bh); g.fillStyle = 'rgba(255,255,255,.35)'; for (let yy = h - bh + 12; yy < h - 10; yy += 18) for (let xx = x + 6; xx < x + bw - 14; xx += 14) g.fillRect(xx, yy, 6, 8); x += bw; } });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 4.6), new THREE.MeshBasicMaterial({ map: skyTex })); win.position.set(0, 2.5, -3.4); OFFICE.add(win);
  for (let i = 0; i < 5; i++) { const fr = box(0.08, 4.8, 0.08, mat('#2a2a2e')); fr.position.set(-4.8 + i * 2.4, 2.5, -3.35); OFFICE.add(fr); }
  const sill = box(10, 0.3, 0.3, mat('#2a2a2e')); sill.position.set(0, 0.15, -3.3); OFFICE.add(sill);
  for (const s of [-1, 1]) { const w = box(0.2, 5, 9, mat('#ece8e2')); w.position.set(s * 5, 2.5, 0.5); OFFICE.add(w); }
  const desk = box(2.2, 0.08, 1.0, mat('#2a2422')); desk.position.set(1.9, 0.78, -1.8); OFFICE.add(desk);
  for (const x of [0.9, 2.9]) { const lg = box(0.08, 0.76, 0.9, mat('#2a2422')); lg.position.set(x, 0.38, -1.8); OFFICE.add(lg); }
  const lap = box(0.6, 0.03, 0.4, mat('#b8bcc4')); lap.position.set(1.9, 0.84, -1.8); OFFICE.add(lap);
  // 服のラック（ブランドの服。文字やロゴは無し）
  { const rx = -1.45, rz = -0.9; const rail = box(1.9, 0.05, 0.05, mat('#c8c8cc')); rail.position.set(rx, 1.75, rz); OFFICE.add(rail); for (const dx of [-0.95, 0.95]) { const p = box(0.05, 1.75, 0.05, mat('#c8c8cc')); p.position.set(rx + dx, 0.88, rz); OFFICE.add(p); }
    for (let i = 0; i < 6; i++) { const d = box(0.28, 0.9 + (i % 2) * 0.2, 0.08, mat(['#e2483c', '#f2f0ea', '#e6b450', '#2a3448', '#d98aa8', '#4f8fc9'][i])); d.position.set(rx - 0.78 + i * 0.31, 1.22 - (i % 2) * 0.1, rz + (i % 2) * 0.06); OFFICE.add(d); } } }
const her2 = makePerson(HER_OFFICE); her2.position.set(30.55, 0, 0.2); qs.add(her2);
const tHeir = tag('大財閥の末娘', { size: 70, w: 480, bg: '#e6b450', color: '#14161c' }); tHeir.position.set(30.5, 2.55, 0.3); qs.add(tHeir);
const tBrand = tag('自分のブランド', { size: 66, w: 480, bg: '#14161c' }); tBrand.position.set(28.8, 2.4, -0.7); qs.add(tBrand);

// ---------- 3段目. 古い家が並ぶ村（x=60） ----------
house(55.6, -4.6, '#e3dccb'); house(60.4, -5.2, '#d9d2c0'); house(65.2, -4.6, '#ebe4d3');
for (let i = 0; i < 6; i++) tree(52 + i * 3.2 + R(), -9.5 - R() * 2, 1.2 + R() * 0.5);
{ const p1 = box(0.08, 1.9, 0.08, mat('#5a4030')); p1.position.set(60.6, 0.95, -2.4); qs.add(p1); const p2 = p1.clone(); p2.position.x = 63.8; qs.add(p2); const ln = box(3.2, 0.015, 0.015, mat('#dddddd')); ln.position.set(62.2, 1.82, -2.4); qs.add(ln);
  for (let i = 0; i < 5; i++) { const c = box(0.42, 0.5 + (i % 2) * 0.15, 0.02, mat(['#f2f0ea', '#a8c8e0', '#e6b450', '#f2f0ea', '#d98aa8'][i])); c.position.set(61.0 + i * 0.6, 1.55 - (i % 2) * 0.07, -2.4); qs.add(c); } }
const AUNTS = [[58.3, -0.4], [59.0, 0.3], [57.9, 0.6], [59.3, -0.8]].map(([x, z], i) => { const p = makePerson(AUNT(i)); p.position.set(x, 0, z); qs.add(p); return p; });
const her3 = makePerson(HER_PLAIN); her3.position.set(61.2, 0, 0.6); her3.rotation.y = -0.9; qs.add(her3);
const tAunt = tag('近所の奥さんたち', { size: 64, w: 560 }); tAunt.position.set(58.6, 2.6, 0.0); qs.add(tAunt);
const tNew = tag('新顔', { size: 76, w: 240, bg: '#e6b450', color: '#14161c' }); tNew.position.set(61.2, 2.35, 0.6); qs.add(tNew);

// ---------- 4段目. 堅物の軍人の家（x=90） ----------
const HOUSE = house(90, -2.8, '#e8e0cf', 5.2);
{ const wood = box(1.4, 0.5, 0.6, mat('#7a5a3a')); wood.position.set(87.6, 0.25, -0.8); qs.add(wood); }
const her4 = makePerson(HER_PLAIN); her4.position.set(89.2, 0, 0.6); her4.rotation.y = 0.4; qs.add(her4);
const off4 = makePerson(OFFICER); cap(off4); off4.position.set(91.0, 0, 0.4); off4.rotation.y = -0.45; qs.add(off4);
off4.userData.arms.forEach((a, i) => { a.rotation.set(-1.25, 0, i === 0 ? 0.75 : -0.75); }); // 腕組み
const tHard = tag('堅物の軍人', { size: 70, w: 420, bg: '#14161c' }); tHard.position.set(91.0, 2.55, 0.4); qs.add(tHard);
const tHide = tag('身分を隠して同居', { size: 68, w: 560, bg: '#e6b450', color: '#14161c' }); tHide.position.set(90.1, 3.15, 0.2); qs.add(tHide);

// ---------- 5段目. 夜、住む世界がちがう2人（x=120） ----------
const NIGHT = new THREE.Group(); NIGHT.position.set(120, 0, 0); qs.add(NIGHT);
const BULBS = [];
{ for (let i = 0; i < 14; i++) { const x = -3.2 + i * 0.5, y = 3.1 - Math.sin((i / 13) * Math.PI) * 0.45; const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd98a' })); b.position.set(x, y, -0.6); NIGHT.add(b); BULBS.push(b); }
  const p1 = box(0.1, 3.3, 0.1, mat('#4a3a2a')); p1.position.set(-3.3, 1.65, -0.6); NIGHT.add(p1);
  const p2 = box(0.1, 3.3, 0.1, mat('#4a3a2a')); p2.position.set(3.4, 1.65, -0.6); NIGHT.add(p2);
  const warm = new THREE.PointLight(0xffc878, 0, 9, 1.4); warm.position.set(0, 2.6, 0.8); NIGHT.add(warm); NIGHT.userData.warm = warm; }
for (let i = 0; i < 6; i++) tree(114 + i * 2.4, -5 - R() * 2, 1.0 + R() * 0.4, '#24402a');
const her5 = makePerson(HEIRESS); her5.position.set(119.45, 0, 0.3); her5.rotation.y = 0.9; qs.add(her5);
const off5 = makePerson(OFFICER); cap(off5); off5.position.set(120.55, 0, 0.3); off5.rotation.y = -0.9; qs.add(off5);
const tKor = tag('韓国ドラマ', { size: 72, w: 420, bg: '#14161c' }); tKor.position.set(120, 2.42, 0.5); qs.add(tKor);
const tLove = tag('ラブロマンス', { size: 70, w: 460, bg: '#e2483c' }); tLove.position.set(120, 2.42, 0.5); qs.add(tLove);

// ---------- 6段目（決め手）. パラグライダーで境界線を越える（x=150） ----------
const BORDER = new THREE.Group(); BORDER.position.set(150, 0, 0); qs.add(BORDER);
{ for (let i = 0; i < 44; i++) { const p = box(0.1, 2.2, 0.1, mat('#6c6f66')); p.position.set(0, 1.1, 8 - i * 1.6); BORDER.add(p); }
  for (let k = 0; k < 4; k++) { const w = box(0.025, 0.025, 72, mat('#b9bcb4')); w.position.set(0, 0.4 + k * 0.5, -27); BORDER.add(w); }
  const strip = box(1.4, 0.03, 72, mat('#8a7a5a')); strip.position.set(0, 0.015, -27); BORDER.add(strip);
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(4 + R() * 3, 5 + R() * 4, 6), mat(['#6f8a5a', '#5d7a4c', '#7c946a'][i % 3])); m.position.set(-24 + i * 6, 1.6, -34 - R() * 8); BORDER.add(m); } }
for (let i = 0; i < 18; i++) tree(152.4 + (i % 6) * 1.5 + R() * 0.6, 1 - Math.floor(i / 6) * 3.4 - R() * 1.6, 0.9 + R() * 0.5);
const WIND = []; for (let i = 0; i < 16; i++) { const w = box(0.9 + R() * 1.2, 0.03, 0.03, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); w.userData.y = 2.6 + R() * 4.2; w.userData.z = -9 + R() * 4.6; w.userData.o = R() * 10; w.userData.v = 4 + R() * 3; qs.add(w); WIND.push(w); }
function glider() {
  const g = new THREE.Group();
  const W = new THREE.MeshLambertMaterial({ color: '#ffffff' }), Y = new THREE.MeshLambertMaterial({ color: '#f2a03a' });
  for (let i = -3; i <= 3; i++) { const an = i * 0.24; const seg = box(0.72, 0.1, 0.95, i % 2 ? Y : W); seg.position.set(Math.sin(an) * 2.3, 1.2 + Math.cos(an) * 2.0, 0); seg.rotation.z = -an; seg.castShadow = true; g.add(seg); }
  const lm = new THREE.LineBasicMaterial({ color: '#eeeeee' });
  for (const i of [-3, -1.5, 1.5, 3]) { const an = i * 0.24; const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.sin(an) * 2.3, 1.2 + Math.cos(an) * 2.0 - 0.05, 0), new THREE.Vector3(0, 1.35, 0)]); g.add(new THREE.Line(geo, lm)); }
  const p = makePerson(HEIRESS); p.scale.setScalar(0.9); p.position.y = -0.2; p.userData.arms.forEach(a => { a.rotation.x = -2.6; }); g.add(p);
  return g;
}
const G6 = glider(); G6.scale.setScalar(0.8); qs.add(G6);
const tGlide = tag('パラグライダー', { size: 68, w: 500, bg: '#e6b450', color: '#14161c' }); qs.add(tGlide);
const tCross = tag('境界線の向こうへ', { size: 66, w: 560, bg: '#e2483c' }); qs.add(tCross);

// ---------- shots ----------
const ALLTAG = [tSignal, tStep, tHeir, tBrand, tAunt, tNew, tHard, tHide, tKor, tLove, tGlide, tCross];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); NIGHT.userData.warm.intensity = 0; LEAVES.forEach(l => l.visible = false); WIND.forEach(w => w.visible = false); shadowP.visible = false; G6.visible = false; }

function shotLost(t, T) { // 1段目 0〜9：森の中でスマホが圏外。背後に足音（0秒目がサムネ）
  base(); S.aim(0, -1); lift(100);
  S.hemi.intensity = 0.95; S.key.intensity = 1.0; S.darken(0.22 + 0.2 * ease((T - 5) / 3), '#1a2a22');
  her1.userData.arms[1].rotation.x = -2.75 + Math.sin(T * 2.4) * 0.12; her1.userData.arms[1].rotation.z = Math.sin(T * 1.7) * 0.15;
  her1.userData.arms[0].rotation.x = 0;
  const turn = ease((T - 6.0) / 0.6);
  her1.userData.head.rotation.x = lerp(-0.45, 0, turn); her1.userData.head.rotation.y = lerp(Math.sin(T * 1.3) * 0.25, 0.75, turn);
  her1.rotation.y = lerp(0.15, 0.45, turn);
  PHONE.rotation.x = 2.75 - Math.sin(T * 2.4) * 0.12 - 0.15;
  LEAVES.forEach((l, i) => { l.visible = true; const y = ((l.userData.y - T * l.userData.s) % 4.6 + 4.6) % 4.6; l.position.set(l.userData.x + Math.sin(T * 1.3 + i) * 0.3, y, l.userData.z); l.rotation.set(T * 2 + i, T * 1.5 + i * 0.7, 0); });
  shadowP.visible = true; shadowP.position.x = lerp(-1.6, -1.0, ease((T - 5.6) / 1.4)); shadowP.rotation.y = 0.5; // 0秒目から木の陰に誰かいる。5.6秒で出てくる
  shadowP.userData.legs[0].rotation.x = Math.sin(T * 6) * 0.35 * (T < 7 ? 1 : 0); shadowP.userData.legs[1].rotation.x = -shadowP.userData.legs[0].rotation.x;
  tSignal.position.set(-0.45, 2.5, 0.5); tSignal.userData.pop((T - 2.6) / 0.35); if (T > 6.2) tSignal.visible = false;
  tStep.position.set(-1.15, 2.25, -2.6); tStep.userData.pop((T - 6.4) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.9, 0.4, u), lerp(1.8, 2.0, u), lerp(4.4, 5.6, u), lerp(0.2, -0.3, u), lerp(1.8, 1.6, u), -0.6, 54);
  return qs;
}
function shotOffice(t) { // 2段目 9〜17：森にいたのは、大財閥の末娘。自分のブランドを立ち上げた社長
  base(); S.aim(30, 0); lift(150);
  S.hemi.intensity = 1.3; S.key.intensity = 1.1;
  her2.rotation.y = lerp(-0.2, 0.15, ease(t / 6)); her2.userData.arms.forEach((a, i) => { a.rotation.set(0, 0, i === 0 ? 0.45 : -0.45); });
  tHeir.userData.pop((t - 0.8) / 0.35); if (t > 4.0) tHeir.visible = false;
  tBrand.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(30.4, 29.8, u), lerp(2.2, 2.0, u), lerp(7.6, 7.0, u), 29.85, 1.5, -1.0, 54);
  return qs;
}
function shotVillage(t) { // 3段目 17〜25：森を抜けると、古い家が並ぶ村。近所の奥さんたちは新顔に興味しんしん
  base(); S.aim(60, -1); lift(150);
  S.hemi.intensity = 1.0; S.key.intensity = 1.1; S.darken(0.12, '#c8a070');
  const k = ease(t / 3.4); her3.position.x = lerp(63.0, 61.2, k); her3.userData.legs[0].rotation.x = Math.sin(t * 6) * 0.35 * (1 - k); her3.userData.legs[1].rotation.x = -her3.userData.legs[0].rotation.x;
  AUNTS.forEach((p, i) => { const look2 = ease((t - 2.4 - i * 0.2) / 0.5); p.rotation.y = lerp([1.6, -2.2, 2.6, -0.6][i], 1.2, look2); p.userData.head.rotation.y = Math.sin(t * 2.2 + i) * 0.15; });
  tNew.userData.pop((t - 1.0) / 0.35); if (t > 4.0) tNew.visible = false;
  tAunt.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(60.0, 59.6, u), lerp(3.0, 2.8, u), lerp(10.4, 9.6, u), 59.65, 1.3, -1.0, 54);
  return qs;
}
function shotHouse(t) { // 4段目 25〜33：かくまってくれたのは堅物の軍人。身分を隠して彼の家で暮らす
  base(); S.aim(90, -1); lift(150);
  her4.userData.head.rotation.y = Math.sin(t * 1.4) * 0.2;
  off4.userData.head.rotation.y = t > 4 ? -0.35 : 0;
  tHard.userData.pop((t - 0.8) / 0.35); if (t > 4.0) tHard.visible = false;
  tHide.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(89.2, 90.6, u), lerp(2.8, 2.6, u), lerp(7.6, 6.8, u), 90.1, 1.6, -0.6, 52);
  return qs;
}
const DARK = '#0a0d18';
function shotNight(t) { // 5段目 33〜42：韓国の令嬢と、北の軍の将校。住む世界がちがう2人のラブロマンス
  base(); S.aim(120, 0); lift(150);
  const d = ease(t / 1.3);
  S.hemi.intensity = lerp(1.25, 0.2, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  NIGHT.userData.warm.intensity = lerp(0, 9, ease((t - 0.6) / 1.2));
  BULBS.forEach((b, i) => b.material.color.set(Math.floor(t * 3 + i) % 4 === 0 ? '#fff2c8' : '#ffd98a'));
  tKor.userData.pop((t - 1.0) / 0.35); if (t > 4.4) tKor.visible = false;
  tLove.userData.pop((t - 4.6) / 0.35);
  const k = ease(t / 9);
  look(120, lerp(2.5, 2.3, k), lerp(7.8, 6.6, k), 120, 1.85, 0.2, lerp(52, 50, k));
  return qs;
}
function windAt(T, k = 1) { WIND.forEach((w, i) => { w.visible = true; const x = 143 + (((T + w.userData.o) * w.userData.v) % 16); w.position.set(x, w.userData.y + Math.sin(T * 2 + i) * 0.1, w.userData.z); w.material.opacity = 0.6 * k; }); }
function shotBorder(t, T) { // 6段目 42〜49（決め手）：突風で流されたパラグライダーが、境界線を越える
  base(); S.aim(150, -3); lift(170);
  S.hemi.intensity = 0.95; S.darken(0.3, '#3a4250');
  windAt(T); G6.visible = true;
  const k = ease(t / 6.6);
  G6.position.set(lerp(147.4, 152.4, k) + Math.sin(T * 4) * 0.08, lerp(6.0, 5.2, k) + Math.sin(T * 3.1) * 0.18, -3.2);
  G6.rotation.set(0, 0.5, Math.sin(T * 3.6) * 0.18 - 0.12);
  tGlide.position.set(clamp(G6.position.x, 148.6, 151.4), G6.position.y - 0.75, -3.2); tGlide.userData.pop((t - 0.6) / 0.35); if (t > 3.5) tGlide.visible = false;
  tCross.position.set(150, 3.2, -1.2); tCross.userData.pop((t - 3.7) / 0.35);
  const u = ease(t / 7);
  look(lerp(149.6, 150.4, u), lerp(4.0, 4.4, u), lerp(8.8, 9.6, u), lerp(149.8, 150.4, u), lerp(4.6, 4.4, u), -4, 56);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：このドラマ、わかった？（夕暮れ。境界線の向こうの森へ降りていくパラグライダー）
  base(); S.aim(150, -3); lift(170);
  const d = ease(t / 3);
  S.hemi.intensity = lerp(0.95, 0.55, d); S.key.intensity = lerp(1.5, 0.5, d); S.darken(lerp(0.3, 0.6, d), '#3a2a3a');
  windAt(T, 1 - d); G6.visible = true;
  const k = ease(t / 7);
  G6.position.set(lerp(152.4, 153.4, k) + Math.sin(T * 2) * 0.05, lerp(5.2, 3.8, k), lerp(-3.2, -4.4, k));
  G6.rotation.set(0, 0.5, Math.sin(T * 2.2) * 0.08);
  look(lerp(150.4, 150.8, k), lerp(4.4, 6.0, k), lerp(9.6, 12.6, k), lerp(150.4, 151.6, k), lerp(4.4, 3.4, k), -4, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotLost(t, T) },
  { a: 9, b: 17, f: shotOffice },
  { a: 17, b: 25, f: shotVillage },
  { a: 25, b: 33, f: shotHouse },
  { a: 33, b: 42, f: shotNight },
  { a: 42, b: 49, f: (t, T) => shotBorder(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'スマホは圏外。<br>まわりは、深い森。'],
  [5.6, 9.0, 'その時、<br>背後で足音が。'],
  [9.2, 13.2, '森にいたのは、<br>大財閥の末娘。'],
  [13.2, 17.0, '自分でブランドを<br>立ち上げた社長。'],
  [17.2, 21.0, '森を抜けると、<br>古い家が並ぶ村。'],
  [21.0, 25.0, '近所の奥さんたちは、<br>新顔に興味しんしん。'],
  [25.2, 29.0, 'かくまってくれたのは、<br>堅物の軍人。'],
  [29.0, 33.0, '身分を隠して、<br>彼の家で暮らすことに。'],
  [33.2, 37.4, '韓国の令嬢と、<br>北の軍の将校。'],
  [37.4, 41.8, '住む世界がちがう<br>2人の、ラブロマンス。'],
  [42.2, 45.6, 'きっかけは、突風に<br>流されたパラグライダー。'],
  [45.6, 49.0, '境界線を越えた先で、<br>恋が始まる。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>愛の不時着。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q004', v2: true, answer: '愛の不時着',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 404,
    hits: [6.2, 25.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 6.2, 33.2, 42.2, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'drone'], [42.0, 'whoosh'], [45.6, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '愛の不時着': 'あいのふじちゃく', '大財閥': 'だいざいばつ', '末娘': 'すえむすめ', '圏外': 'けんがい', '背後': 'はいご', '足音': 'あしおと', '立ち上げた': 'たちあげた', '社長': 'しゃちょう', '抜ける': 'ぬける', '並ぶ': 'ならぶ', '近所': 'きんじょ', '奥さん': 'おくさん', '新顔': 'しんがお', '興味': 'きょうみ', '堅物': 'かたぶつ', '軍人': 'ぐんじん', '身分': 'みぶん', '隠して': 'かくして', '暮らす': 'くらす', '韓国': 'かんこく', '令嬢': 'れいじょう', '将校': 'しょうこう', '住む': 'すむ', '2人': 'ふたり', '突風': 'とっぷう', '流された': 'ながされた', '境界線': 'きょうかいせん', '越えた': 'こえた', '恋': 'こい' },
    caption: 'このドラマのタイトル、わかる？\nスマホは圏外、まわりは深い森。その時、背後で足音が。森にいたのは、自分でブランドを立ち上げた大財閥の末娘。森を抜けると、古い家が並ぶ村があった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', '恋愛ドラマ'],
  },
});
applyQuizCards({ answer: '愛の不時着', info: 'Netflix｜韓国・全16話' });
