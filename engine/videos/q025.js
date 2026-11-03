import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #025 最強のふたり（映画・フランス・2011年・113分。Prime Video・U-NEXTで見放題、justwatch.com/jp/映画/the-intouchables で2026/11/3確認。
//   Filmarks 4.2・レビュー37万件 filmarks.com/movies/24821）
// 確かめた事実（movie.jorudan.co.jp/cinema/21718/ の解説とあらすじ・Filmarks の作品紹介）：
//   ・パリの邸に住む大富豪フィリップは、パラグライダーの事故で首から下がまひしている。介護者を選ぶ面接で、スラム街出身の無職の青年ドリスと出会う。
//     ドリスは不採用の証明書でもらえる失業手当が目当てで面接に来ていた。宝石強盗で半年服役した前科がある。
//   ・同情してくる他人にうんざりしていたフィリップは、ドリスを採用する。価値観も生活も正反対のふたりが、ユーモアのある友情を育てていく。
//   ・実話に基づいたヒューマン・コメディ。フランス映画で、本国で大ヒット
// 構成（ヒント6段）：1 介護の面接、ひとりだけやる気ゼロ → 2 首から下が動かない大富豪 → 3 豪華なお屋敷、同情はもううんざり
//   → 4 選ばれたのは前科のある青年、正反対のふたり → 5 パリ、実話がもとのヒューマン・コメディ → 6 決め手：けがの理由はパラグライダーの事故、フランスで大ヒット
// 事故の場面は出さない（6段目は空を飛ぶパラグライダーだけ）。実在の人物・俳優の見た目・ポスター・ロゴは使わない。車いすと人は汎用の3D。結末には触れない

const S = quizStage({ bg: '#c8b89a', floor: '#8a7a62', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(2525);

const RICH = { skin: '#efcfae', hair: '#8a8a8a', shirt: '#3a3e4a', pants: '#2a2e38' };
const YOUTH = { skin: '#5a3a26', hair: '#141210', shirt: '#4a6a3a', pants: '#2a3040' };
const APPL = (i) => ({ skin: ['#efcfae', '#e8b98f', '#f5d3b5', '#d9a57c'][i % 4], hair: ['#2c2421', '#6a6a6a', '#4a3426', '#1d1a19'][i % 4], shirt: ['#3a4050', '#4a4a50', '#5a5048', '#384858'][i % 4], pants: '#22262f', tie: true, long: i % 4 === 2, skirt: i % 4 === 2 });
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = -0.38; return p; }
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }
// 車いす（汎用）に座った人
function makeChair() {
  const g = new THREE.Group(); const fr = mat('#3a3c42'), wh = mat('#1c1c20');
  const seat = box(0.56, 0.08, 0.5, mat('#2a2a30')); seat.position.y = 0.5; g.add(seat);
  const back = box(0.56, 0.6, 0.06, mat('#2a2a30')); back.position.set(0, 0.82, -0.25); g.add(back);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 24), wh); w.rotation.y = Math.PI / 2; w.position.set(s * 0.33, 0.32, -0.08); g.add(w); const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), wh); sm.rotation.z = Math.PI / 2; sm.position.set(s * 0.24, 0.07, 0.26); g.add(sm); const arm = box(0.04, 0.04, 0.46, fr); arm.position.set(s * 0.3, 0.72, -0.02); g.add(arm); }
  const foot = box(0.4, 0.03, 0.16, fr); foot.position.set(0, 0.12, 0.34); g.add(foot);
  const p = makePerson(RICH); p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.legs.forEach(l => { const shin = l.children[0]; }); p.position.set(0, -0.32, 0.02); p.userData.arms.forEach(a => a.rotation.x = -0.9); g.add(p); g.userData.p = p;
  return g;
}

// ---------- 1. 面接の待合室（x=0）。0秒目がサムネ ----------
{ const g = new THREE.Group(); qs.add(g);
  const fl = box(12, 0.1, 7, mat('#a8906a')); fl.position.y = 0.05; g.add(fl);
  const wl = box(12, 4, 0.2, mat('#e8dcc4')); wl.position.set(0, 2, -2.2); g.add(wl);
  for (let i = 0; i < 4; i++) { const pn = box(1.6, 2.4, 0.04, mat('#d8c8a8')); pn.position.set(-4.5 + i * 3, 1.8, -2.08); g.add(pn); } }
const APPS = [];
for (let i = 0; i < 6; i++) { const ch = box(0.5, 0.06, 0.5, mat('#6a4a30')); ch.position.set(-2.5 + i * 0.95, 0.48, -1.2); qs.add(ch); const cb = box(0.5, 0.5, 0.06, mat('#6a4a30')); cb.position.set(-2.5 + i * 0.95, 0.76, -1.45); qs.add(cb); for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) { const l = box(0.04, 0.48, 0.04, mat('#4a3420')); l.position.set(-2.5 + i * 0.95 + dx, 0.24, -1.2 + dz); qs.add(l); }
  const p = sit(makePerson(i === 4 ? YOUTH : APPL(i))); p.position.set(-2.5 + i * 0.95, -0.3, -1.15); qs.add(p); APPS.push(p); }
const youth1 = APPS[4];
const PAPER = [0, 1, 2, 3, 4, 5].map(i => { if (i === 4) return null; const f = box(0.22, 0.3, 0.01, mat('#f4f0e4')); qs.add(f); return f; });
const tIntv = tag('介護の仕事の面接', { size: 64, w: 560, bg: '#14161c', sx: 1.6 }); tIntv.position.set(-0.2, 2.6, -1.0); qs.add(tIntv);
const tZero = tag('やる気ゼロ', { size: 76, w: 400, bg: '#e2483c', sx: 1.0 }); tZero.position.set(1.3, 1.95, -0.9); qs.add(tZero);

// ---------- 2・3. お屋敷（x=30） ----------
const HX = 30;
{ const g = new THREE.Group(); g.position.set(HX, 0, 0); qs.add(g);
  const fl = box(12, 0.1, 9, mat('#7a5a3a')); fl.position.y = 0.05; g.add(fl);
  const rug = box(4, 0.02, 3, mat('#8a2a2a')); rug.position.set(0, 0.11, 0); g.add(rug);
  const wl = box(12, 6, 0.2, mat('#e8dcc0')); wl.position.set(0, 3, -3); g.add(wl);
  for (const x of [-3.2, 3.2]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.0), new THREE.MeshBasicMaterial({ color: '#d8e8f4' })); win.position.set(x, 2.6, -2.88); g.add(win); const cur = box(0.4, 3.4, 0.06, mat('#8a2a2a')); cur.position.set(x - 0.9, 2.6, -2.84); g.add(cur); const cur2 = cur.clone(); cur2.position.x = x + 0.9; g.add(cur2); }
  const frame = box(1.8, 1.2, 0.06, mat('#c8a040')); frame.position.set(0, 3.2, -2.86); g.add(frame); const art = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: '#5a7a8a' })); art.position.set(0, 3.2, -2.82); g.add(art);
  // シャンデリア
  const ch = new THREE.Group(); ch.position.set(0, 4.6, -0.6); g.add(ch); const rodc = box(0.04, 0.8, 0.04, mat('#c8a040')); rodc.position.y = 0.4; ch.add(rodc); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff4c8' })); b.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); ch.add(b); } }
const CHL = new THREE.PointLight(0xffe8b0, 0, 10, 1.2); CHL.position.set(HX, 4.2, -0.6); qs.add(CHL);
const CHAIR = makeChair(); CHAIR.position.set(HX, 0.1, 0); qs.add(CHAIR);
const STAFF = [0, 1, 2].map(i => { const p = makePerson({ skin: ['#efcfae', '#f5d3b5', '#e8b98f'][i], hair: ['#5a5a5a', '#2c2421', '#4a3426'][i], shirt: ['#1f2229', '#f4f0e8', '#3a3a3a'][i], pants: '#1f2229', long: i === 1, skirt: i === 1 }); qs.add(p); return p; });
const tRich = tag('大富豪', { size: 90, w: 340, bg: '#e6b450', color: '#14161c', sx: 0.95 }); tRich.position.set(HX, 2.15, 0); qs.add(tRich);
const tParal = tag('首から下が動かない', { size: 60, w: 600, bg: '#14161c', sx: 1.5 }); tParal.position.set(HX, 2.15, 0); qs.add(tParal);
const tPity = tag('同情は、もううんざり', { size: 60, w: 640, bg: '#e2483c', sx: 1.7 }); tPity.position.set(HX, 2.5, 0.2); qs.add(tPity);

// ---------- 4. 向かい合うふたり（x=60） ----------
const FX = 60;
{ const g = new THREE.Group(); g.position.set(FX, 0, 0); qs.add(g);
  const fl = box(10, 0.1, 8, mat('#6a5038')); fl.position.y = 0.05; g.add(fl);
  const wl = box(10, 5, 0.2, mat('#d8c8a8')); wl.position.set(0, 2.5, -2.6); g.add(wl); }
const CHAIR4 = makeChair(); CHAIR4.position.set(FX - 0.8, 0.1, 0); CHAIR4.rotation.y = Math.PI / 2 - 0.3; qs.add(CHAIR4);
const youth4 = makePerson(YOUTH); youth4.position.set(FX + 0.8, 0, 0); youth4.rotation.y = -Math.PI / 2 + 0.3; qs.add(youth4);
const tPast = tag('前科のある無職の青年', { size: 58, w: 640, bg: '#14161c', sx: 1.6 }); tPast.position.set(FX + 0.3, 2.4, 0.3); qs.add(tPast);
const tOpp = tag('正反対のふたり', { size: 72, w: 520, bg: '#e6b450', color: '#14161c', sx: 1.5 }); tOpp.position.set(FX, 2.4, 0.3); qs.add(tOpp);

// ---------- 5. パリの街（x=90） ----------
const PX = 90;
{ const g = new THREE.Group(); g.position.set(PX, 0, 0); qs.add(g);
  const road = box(30, 0.04, 8, mat('#9a9286')); road.position.y = 0.02; g.add(road);
  for (let i = 0; i < 9; i++) { const w = 2.6, h = 5 + (i % 3) * 0.6; const b = box(w, h, 3, mat(['#e8dcc4', '#ded0b4', '#f0e4cc'][i % 3])); b.position.set(-10 + i * 2.7, h / 2, -6); g.add(b); const roof = box(w, 1.0, 3, mat('#5a6a7a')); roof.position.set(-10 + i * 2.7, h + 0.5, -6); g.add(roof);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7), new THREE.MeshBasicMaterial({ color: '#4a5a6a' })); wn.position.set(-10 + i * 2.7 - 0.8 + c * 0.8, 1.2 + r * 1.4, -4.48); g.add(wn); } }
  for (let i = 0; i < 6; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), mat('#5a7a3a')); tr.position.set(-7 + i * 2.8, 2.4, -3.2); g.add(tr); const tk = box(0.14, 1.8, 0.14, mat('#5a4030')); tk.position.set(-7 + i * 2.8, 0.9, -3.2); g.add(tk); } }
const CHAIR5 = makeChair(); qs.add(CHAIR5);
const youth5 = makePerson(YOUTH); qs.add(youth5);
const tParis = tag('舞台はパリ', { size: 76, w: 440, bg: '#14161c', sx: 1.6 }); tParis.position.set(PX, 3.6, 0.6); qs.add(tParis);
const tFR = tag('フランス映画', { size: 72, w: 460, bg: '#e6b450', color: '#14161c', sx: 1.7 }); tFR.position.set(PX, 2.8, 0.6); qs.add(tFR);
const tTrue = tag('実話がもと', { size: 76, w: 420, bg: '#e2483c', sx: 1.5 }); tTrue.position.set(PX, 3.6, 0.6); qs.add(tTrue);

// ---------- 6. 決め手（x=130）：空を飛ぶパラグライダー ----------
const SX = 130;
const SKYBG = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: '#8ac0e8', fog: false })); SKYBG.position.set(SX, 8, -20); qs.add(SKYBG);
const HILLS = []; for (let i = 0; i < 5; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(6 + i, 16, 10), mat(['#6a9a4a', '#5a8a3a', '#7aaa5a'][i % 3])); h.position.set(SX - 16 + i * 8, -3, -14 - (i % 2) * 3); h.scale.y = 0.6; qs.add(h); HILLS.push(h); }
const GLIDER = new THREE.Group(); qs.add(GLIDER);
{ // 翼（正面から見て弓なり。赤と白の帯）
  const N = 11;
  for (let i = 0; i < N; i++) { const a = (i - (N - 1) / 2) / ((N - 1) / 2) * 0.95; const seg = box(0.62, 0.22, 0.9, mat(i % 2 ? '#f4f0e4' : '#e2483c')); seg.position.set(Math.sin(a) * 3.2, Math.cos(a) * 3.2 - 3.2 + 0.6, 0); seg.rotation.z = -a; GLIDER.add(seg); }
  for (const s of [-1, 1]) for (const k of [0.45, 0.9]) { const tx = s * Math.sin(k) * 3.2, ty = Math.cos(k) * 3.2 - 3.2 + 0.5; const len = Math.hypot(tx, ty + 2.2); const ln = box(0.025, len, 0.025, mat('#3a3a3a')); ln.position.set(tx / 2, (ty - 2.2) / 2, 0); ln.rotation.z = Math.atan2(tx, ty + 2.2) * -1; GLIDER.add(ln); }
  const pilot = makePerson({ skin: '#efcfae', hair: '#3a3a3a', shirt: '#3a4a6a', pants: '#2a2e38' }); pilot.scale.setScalar(0.8); pilot.position.set(0, -3.4, 0); pilot.userData.legs.forEach(l => l.rotation.x = -1.2); pilot.userData.arms.forEach(a => a.rotation.x = -2.6); GLIDER.add(pilot); }
const tGlide = tag('パラグライダー', { size: 72, w: 620, bg: '#14161c', sx: 3.2 }); qs.add(tGlide);
const tHit = tag('フランスで大ヒット', { size: 66, w: 600, bg: '#e6b450', color: '#14161c', sx: 3.0 }); qs.add(tHit);

// ---------- クイズ：夜の街を並んで進むふたり（x=90 を夜に） ----------
const LAMPL = new THREE.PointLight(0xffd890, 0, 10, 1.2); qs.add(LAMPL);

// ---------- shots ----------
const ALL = [tIntv, tZero, tRich, tParal, tPity, tPast, tOpp, tParis, tFR, tTrue, tGlide, tHit];
function base() { S.reset(); ALL.forEach(x => x.visible = false); CHL.intensity = 0; LAMPL.intensity = 0; STAFF.forEach(p => p.visible = false); SKYBG.visible = false; GLIDER.visible = false; HILLS.forEach(h => h.visible = false); CHAIR5.visible = false; youth5.visible = false; }

function shotIntv(t, T) { // 0〜9：介護の仕事の面接。並ぶ応募者の中で、ひとりだけやる気がない（0秒目がサムネ）
  base(); S.aim(0, -1); lift(-40);
  APPS.forEach((p, i) => { if (i === 4) return; p.userData.arms.forEach(a => a.rotation.x = -1.0); p.userData.head.rotation.x = 0.25; const f = PAPER[i]; f.position.set(p.position.x, 0.86, -0.75); f.rotation.x = -0.6; });
  youth1.position.y = -0.38; youth1.rotation.x = -0.25; youth1.userData.legs.forEach(l => l.rotation.x = -1.2); youth1.userData.arms.forEach(a => a.rotation.z = 0); youth1.userData.arms[0].rotation.z = -0.35; youth1.userData.arms[1].rotation.z = 0.35;
  youth1.userData.head.rotation.x = -0.4 + Math.sin(T * 1.5) * 0.05; youth1.userData.head.rotation.y = Math.sin(T * 0.9) * 0.3;
  tIntv.userData.pop((T - 1.0) / 0.35); if (T > 4.4) tIntv.visible = false;
  tZero.userData.pop((T - 5.6) / 0.35);
  const u = ease(T / 9);
  look(lerp(-0.4, 0.9, u), lerp(1.9, 1.7, u), lerp(5.4, 3.6, u), lerp(-0.4, 1.2, u), 1.0, -1.1, 54);
  return qs;
}
function shotRich(t) { // 9〜17：大きなお屋敷に住む大富豪。事故で、首から下が動かない
  base(); S.aim(HX, 0); lift(-40);
  CHL.intensity = 4; S.hemi.intensity = 1.1;
  CHAIR.rotation.y = 0;
  tRich.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tRich.visible = false;
  tParal.userData.pop((t - 4.4) / 0.35);
  CHAIR.userData.p.userData.head.rotation.y = Math.sin(t * 0.6) * 0.15;
  const u = ease(t / 8);
  look(HX, lerp(2.4, 1.8, u), lerp(6.4, 4.2, u), HX, 1.2, -0.2, 54);
  return qs;
}
function shotPity(t) { // 17〜25：まわりはみんな、気をつかってくる。同情は、もううんざり
  base(); S.aim(HX, 0); lift(-40);
  CHL.intensity = 4; S.hemi.intensity = 1.1;
  STAFF.forEach((p, i) => { p.visible = true; const a = -0.9 + i * 0.9; const r = lerp(2.4, 1.05, ease((t - i * 0.3) / 1.4)); p.position.set(HX + Math.sin(a) * r * 1.1, 0, -Math.cos(a) * r * 0.8 - 0.1); p.rotation.y = Math.atan2(HX - p.position.x, 0 - p.position.z); walk(p, t * 6 + i, t < 1.4 + i * 0.3 ? 1 : 0); p.rotation.x = t > 2 ? 0.25 : 0; p.userData.arms[1].rotation.x = t > 2 ? -0.8 : 0; });
  CHAIR.userData.p.userData.head.rotation.x = t > 3.6 ? -0.3 : 0; CHAIR.userData.p.userData.head.rotation.y = t > 3.6 ? Math.sin(t * 3) * 0.25 : 0;
  tPity.userData.pop((t - 4.0) / 0.35);
  const u = ease(t / 8);
  look(lerp(HX + 0.6, HX + 0.3, u), lerp(2.4, 2.2, u), lerp(5.4, 4.8, u), HX, 1.2, -0.4, 54);
  return qs;
}
function shotPair(t) { // 25〜33：選んだのは、前科のある無職の青年。生活も価値観も正反対
  base(); S.aim(FX, 0); lift(-40); S.hemi.intensity = 1.15;
  youth4.userData.arms[0].rotation.x = Math.sin(t * 2) * 0.2; youth4.userData.head.rotation.z = Math.sin(t * 1.4) * 0.12;
  if (t > 4.6) { youth4.userData.arms[1].rotation.x = -1.2 + Math.sin(t * 8) * 0.25; }
  tPast.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tPast.visible = false;
  tOpp.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(FX + 0.4, FX, u), lerp(1.8, 1.7, u), lerp(5.0, 4.3, u), FX, 1.25, 0, 54);
  return qs;
}
function shotParis(t) { // 33〜42：舞台はパリ。実話をもとにしたヒューマン・コメディ
  base(); S.aim(PX, 0); lift(150); S.hemi.intensity = 1.2;
  CHAIR5.visible = true; youth5.visible = true;
  const x = PX - 3 + t * 0.6;
  CHAIR5.position.set(x, 0.05, 0.4); CHAIR5.rotation.y = Math.PI / 2; youth5.position.set(x - 0.75, 0, 0.4); youth5.rotation.y = Math.PI / 2; walk(youth5, t * 5, 0.8); youth5.userData.arms.forEach(a => a.rotation.x = -1.3);
  tParis.position.set(x - 0.35, 3.5, 0.6); tFR.position.set(x - 0.35, 2.75, 0.6); tTrue.position.set(x - 0.35, 3.5, 0.6);
  tParis.userData.pop((t - 0.6) / 0.35); tFR.userData.pop((t - 1.6) / 0.35);
  if (t > 4.2) { tParis.visible = false; tFR.visible = false; }
  tTrue.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(x - 0.3, lerp(2.4, 2.5, u), lerp(7.0, 6.6, u), x - 0.35, 2.0, 0, 54);
  return qs;
}
function shotGlide(t) { // 42〜49：決め手。けがの理由は、パラグライダーの事故。フランスで大ヒット
  base(); S.aim(SX, 0); lift(170);
  SKYBG.visible = true; GLIDER.visible = true; HILLS.forEach(h => h.visible = true); S.scene.background.set('#8ac0e8'); S.scene.fog.color.set('#8ac0e8'); S.hemi.intensity = 1.3;
  GLIDER.position.set(SX - 1.2 + t * 0.35, 6.4 + Math.sin(t * 1.2) * 0.2, -2); GLIDER.rotation.z = Math.sin(t * 0.8) * 0.06;
  tGlide.position.set(SX, 8.9, -2); tHit.position.set(SX, 8.9, -2); if (t > 3.6) tGlide.visible = false;
  tGlide.userData.pop((t - 0.6) / 0.35);
  tHit.userData.pop((t - 3.6) / 0.35); if (t > 3.6) tGlide.visible = false;
  const u = ease(t / 7);
  look(SX, lerp(5.0, 5.3, u), lerp(13.5, 12.5, u), SX, lerp(5.0, 5.3, u), -2, 54);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夕暮れの街を、ふたりが並んで進む）
  base(); S.aim(PX, 0); lift(-40);
  const d = ease(t / 1.2); S.darken(d * 0.8, '#1a1428'); S.hemi.intensity = lerp(1.2, 0.45, d); S.key.intensity = lerp(1.5, 0.3, d);
  CHAIR5.visible = true; youth5.visible = true;
  const x = PX + 2 + t * 0.4;
  CHAIR5.position.set(x, 0.05, 0.4); CHAIR5.rotation.y = Math.PI / 2; youth5.position.set(x - 0.75, 0, 0.4); youth5.rotation.y = Math.PI / 2; walk(youth5, t * 5, 0.8); youth5.userData.arms.forEach(a => a.rotation.x = -1.3);
  LAMPL.position.set(x - 0.2, 2.6, 1.6); LAMPL.intensity = lerp(0, 8, d);
  const k = ease(t / 7);
  look(lerp(x + 0.6, x + 0.2, k), 1.7, lerp(5.6, 4.8, k), x - 0.4, 1.0, 0.4, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotIntv(t, T) },
  { a: 9, b: 17, f: shotRich },
  { a: 17, b: 25, f: shotPity },
  { a: 25, b: 33, f: shotPair },
  { a: 33, b: 42, f: shotParis },
  { a: 42, b: 49, f: shotGlide },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '介護の仕事の面接に、<br>応募者がずらり。'],
  [5.6, 9.0, 'でもひとりだけ、<br>やる気がまるでない。'],
  [9.2, 13.2, '大きなお屋敷に住む、<br>大富豪の男。'],
  [13.2, 17.0, '事故で、首から下が<br>動かなくなった。'],
  [17.2, 21.0, 'まわりはみんな、<br>気をつかってくる。'],
  [21.0, 25.0, '同情されるのは、<br>もううんざり。'],
  [25.2, 29.0, '彼が選んだのは、<br>前科のある無職の青年。'],
  [29.0, 33.0, '生活も価値観も、<br>まるで正反対のふたり。'],
  [33.2, 37.4, '舞台はパリ。<br>フランスの映画。'],
  [37.4, 41.8, '実話をもとにした、<br>ヒューマン・コメディ。'],
  [42.2, 45.4, 'けがの理由は、<br>パラグライダーの事故。'],
  [45.4, 49.0, 'フランスで、<br>大ヒットした友情の物語。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、最強のふたり。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q025', v2: true, answer: '最強のふたり',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 2525,
    hits: [5.6, 25.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.8, 13.4, 21.2, 29.4, 42.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '最強': 'さいきょう', '介護': 'かいご', '仕事': 'しごと', '面接': 'めんせつ', '応募者': 'おうぼしゃ', '大きな': 'おおきな', '屋敷': 'やしき', '住む': 'すむ', '大富豪': 'だいふごう', '男': 'おとこ', '事故': 'じこ', '首から下': 'くびからした', '動かなく': 'うごかなく', '気をつかって': 'きをつかって', '同情': 'どうじょう', '彼': 'かれ', '選んだ': 'えらんだ', '前科': 'ぜんか', '無職': 'むしょく', '青年': 'せいねん', '生活': 'せいかつ', '価値観': 'かちかん', '正反対': 'せいはんたい', '舞台': 'ぶたい', '映画': 'えいが', '実話': 'じつわ', '理由': 'りゆう', '大ヒット': 'だいヒット', '友情': 'ゆうじょう', '物語': 'ものがたり', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n介護の仕事の面接に、応募者がずらり。でもひとりだけ、やる気がまるでない。面接をしていたのは、大きなお屋敷に住む大富豪の男だった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'U-NEXT', '映画好き', '実話映画'],
  },
});
applyQuizCards({ answer: '最強のふたり', info: 'Prime Video・U-NEXT｜フランス映画', answerSize: 120 });
