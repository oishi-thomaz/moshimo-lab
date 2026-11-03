import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #034 涙の女王（ドラマ・韓国・2024年・全16話。Netflixで見放題、
//   justwatch.com/jp/テレビ番組/queen-of-tears で2026/11/4確認。Filmarks 4.4・レビュー37,940件 filmarks.com/dramas/14693/20002）
// 確かめた事実（Filmarks の作品ページのあらすじ・エピソード紹介。2026/11/4）：
//   ・財閥クィーンズグループの3代目で「デパート業界の女王」ホン・ヘインと、「スーパーマーケットの王子」と呼ばれるペク・ヒョヌは、結婚3周年を迎える夫婦。
//     度重なるすれ違いから離婚を検討していた矢先、ある危機が夫婦を襲い、一緒に乗り越えるうちにラブストーリーが再び動き出す。Netflixシリーズ、2024年3月9日から配信
//   ・エピソード1：家庭でも職場でも、冷え切った関係を続けるふたり。将来を左右する大きな決断をしたヒョヌは実家を訪れる。全16話
// 構成（ヒント6段）：1 結婚3年目、家でも職場でも冷え切った夫婦 → 2 夫は将来を左右する決断、離婚を考えはじめる → 3 妻は巨大な財閥グループの3代目
//   → 4 ある危機が夫婦を襲い、一緒に乗り越えるうちに → 5 2024年の韓国ドラマ・全16話 → 6 決め手：デパート業界の女王と、スーパーマーケットの王子
// 「女王」・人物の名前・グループの名前は6段目まで字幕にも札にも出さない。危機の中身（病気など）は言わない。作品の映像・俳優・ロゴ・有名な場面の構図は使わない。人と建物は汎用の3D

const S = quizStage({ bg: '#2a3346', floor: '#3a3a44', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(3434);

const WIFE = { skin: '#f2d4b8', hair: '#2a1a14', shirt: '#e8e2d8', pants: '#3a3448', long: true, skirt: true };
const HUS = { skin: '#efcfae', hair: '#141414', shirt: '#2a3044', pants: '#1c1e24', tie: true };

// ---------- 1段目. 長い食卓（x=0）。両端にすわる夫婦、まん中は凍りついている ----------
{ const fl = box(16, 0.04, 12, mat('#4a4048')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(16, 6, 0.2, mat('#5a6478')); wl.position.set(0, 3, -5); qs.add(wl);
  for (const x of [-4.5, 0, 4.5]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2), new THREE.MeshBasicMaterial({ color: '#9fb8e0' })); win.position.set(x, 3.2, -4.88); qs.add(win); }
  const tb = box(3.0, 0.12, 1.4, mat('#e8e4dc')); tb.position.set(0, 0.92, -1); qs.add(tb);
  for (const x of [-1.35, 1.35]) for (const z of [-1.6, -0.4]) { const lg = box(0.12, 0.9, 0.12, mat('#6a4a32')); lg.position.set(x, 0.45, z); qs.add(lg); } }
const ICE = []; for (let i = 0; i < 26; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 + R() * 0.2, 0), new THREE.MeshStandardMaterial({ color: '#cfeaff', transparent: true, opacity: 0.85, roughness: 0.1, metalness: 0.2 })); c.userData.x = (R() - 0.5) * 1.8; c.userData.z = -1 + (R() - 0.5) * 1.0; c.userData.o = R(); qs.add(c); ICE.push(c); }
const w1 = makePerson(WIFE); w1.position.set(-1.75, 0, -1); w1.rotation.y = Math.PI / 2; qs.add(w1);
const h1 = makePerson(HUS); h1.position.set(1.75, 0, -1); h1.rotation.y = -Math.PI / 2; qs.add(h1);
for (const p of [w1, h1]) { p.userData.legs.forEach(l => l.rotation.x = -1.45); p.position.y = -0.3; }
for (const x of [-1.95, 1.95]) { const seat = box(0.55, 0.08, 0.55, mat('#6a4a32')); seat.position.set(x, 0.5, -1); qs.add(seat); const bk = box(0.08, 0.9, 0.55, mat('#6a4a32')); bk.position.set(x + (x < 0 ? -0.26 : 0.26), 0.95, -1); qs.add(bk); for (const dz of [-0.22, 0.22]) for (const dx of [-0.22, 0.22]) { const lg = box(0.06, 0.5, 0.06, mat('#5a3a26')); lg.position.set(x + dx, 0.25, -1 + dz); qs.add(lg); } }
const PLATES = [-2.6, 2.6].map(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 24), mat('#ffffff')); p.position.set(x * 0.55, 1.0, -1); qs.add(p); return p; });
const t3y = tag('結婚3年目', { size: 76, w: 420, bg: '#e6b450', color: '#14161c', sx: 1.8 }); t3y.position.set(0, 2.6, -1); qs.add(t3y);
const tCold = tag('会話ゼロ', { size: 84, w: 380, bg: '#3a7ad8', sx: 1.7 }); tCold.position.set(0, 2.2, -0.6); qs.add(tCold);

// ---------- 2段目. 夜の廊下（x=40）。夫が白い紙を見つめる ----------
const HX = 40;
{ const fl = box(6, 0.04, 16, mat('#3a3440')); fl.position.set(HX, 0.02, -4); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.2, 5, 16, mat('#6a6070')); wl.position.set(HX + s * 3, 2.5, -4); qs.add(wl); }
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), new THREE.MeshBasicMaterial({ color: '#ffe0a8' })); lp.position.set(HX, 4.9, -i * 4); qs.add(lp); } }
const h2 = makePerson(HUS); h2.position.set(HX, 0, 0); qs.add(h2);
const PAPER = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.58), new THREE.MeshBasicMaterial({ map: canvasTex(128, 176, (g, w, h) => { g.fillStyle = '#faf8f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8c4ba'; for (let y = 30; y < h - 10; y += 16) g.fillRect(12, y, w - 24, 3); g.strokeStyle = '#b03a3a'; g.lineWidth = 3; g.strokeRect(w - 40, h - 42, 28, 28); }) , side: THREE.DoubleSide })); qs.add(PAPER);
const tDecide = tag('将来を左右する決断', { size: 60, w: 620, bg: '#14161c', sx: 1.7 }); tDecide.position.set(HX, 2.55, 0); qs.add(tDecide);
const tDiv = tag('離婚を考えている', { size: 66, w: 560, bg: '#e2483c', sx: 1.6 }); tDiv.position.set(HX, 2.55, 0); qs.add(tDiv);

// ---------- 3段目. 財閥グループ（x=80）。そびえるビル群と、豪華なホール ----------
const GX = 80;
const TOWERS = []; for (let i = 0; i < 7; i++) { const w = 3 + R() * 1.4, h = 14 + R() * 14 + (i === 3 ? 10 : 0); const wt = windowTextures(3440 + i, ['#7a8aa8', '#8a94a8', '#6a7a98'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.35 })); b.position.set(GX - 12 + i * 4, h / 2, -16 - (i % 2) * 3); qs.add(b); TOWERS.push(b); }
{ const hall = box(14, 0.06, 8, mat('#c8b48a')); hall.position.set(GX, 0.03, 0); qs.add(hall);
  const rug = box(2.4, 0.02, 8, mat('#8a1e2a')); rug.position.set(GX, 0.07, 0); qs.add(rug);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 5, 16), mat('#efe8d8')); col.position.set(GX + s * 3.4, 2.5, 2 - i * 2.6); qs.add(col); }
  const chand = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffe8b0' })); chand.position.set(GX, 5.2, -1); qs.add(chand); }
const FAMILY = []; for (let i = 0; i < 5; i++) { const p = makePerson({ skin: '#f0d0b0', hair: ['#1a1a1a', '#8a8a8a', '#2a2420', '#3a2a20', '#1a1a1a'][i], shirt: ['#1e2229', '#5a1a2a', '#2a3044', '#e6d8c0', '#22262f'][i], pants: '#1c1e24', tie: i % 2 === 0, long: i === 3, skirt: i === 3 }); p.position.set(GX - 2.4 + i * 1.2, 0, -2.2); qs.add(p); FAMILY.push(p); }
const w3 = makePerson(WIFE); w3.position.set(GX, 0, 0.4); qs.add(w3);
const tZai = tag('巨大な財閥グループ', { size: 62, w: 620, bg: '#14161c', sx: 3.8 }); tZai.position.set(GX, 3.0, 0); qs.add(tZai);
const t3rd = tag('妻はその3代目', { size: 70, w: 520, bg: '#e6b450', color: '#14161c', sx: 2.2 }); t3rd.position.set(GX, 2.55, 0.6); qs.add(t3rd);

// ---------- 4段目. 嵐の夜（x=120）。ひとつの傘に入るふたり ----------
const SX = 120;
{ const rd = box(14, 0.04, 14, mat('#2a2c34')); rd.position.set(SX, 0.02, -2); qs.add(rd); }
const RAIN = []; for (let i = 0; i < 160; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), new THREE.MeshBasicMaterial({ color: '#a8c0e0', transparent: true, opacity: 0.6 })); d.userData.x = (R() - 0.5) * 12; d.userData.z = (R() - 0.5) * 8 - 1; d.userData.o = R(); qs.add(d); RAIN.push(d); }
const w4 = makePerson(WIFE); w4.position.set(SX - 0.32, 0, 0); qs.add(w4);
const h4 = makePerson(HUS); h4.position.set(SX + 0.32, 0, 0); qs.add(h4);
const UMB = new THREE.Group(); qs.add(UMB);
{ const top = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 16, 1, true), new THREE.MeshLambertMaterial({ color: '#3a4a7a', side: THREE.DoubleSide })); top.position.y = 2.55; UMB.add(top); const st = box(0.04, 1.3, 0.04, mat('#2a2a2e')); st.position.y = 1.9; UMB.add(st); }
UMB.position.set(SX + 0.1, 0, 0.1);
const FLASH = new THREE.PointLight(0xdfe8ff, 0, 60, 1.2); FLASH.position.set(SX, 12, -8); qs.add(FLASH);
const tCrisis = tag('ある危機が夫婦を襲う', { size: 60, w: 660, bg: '#e2483c', sx: 2.4 }); tCrisis.position.set(SX, 3.4, 0); qs.add(tCrisis);
const tTogether = tag('一緒に乗り越えるうちに', { size: 58, w: 680, bg: '#14161c', sx: 2.4 }); tTogether.position.set(SX, 3.4, 0); qs.add(tTogether);

// ---------- 5段目. テレビの前（x=160）。2024年の韓国ドラマ・全16話 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1a26' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f4b8c8'); gr.addColorStop(1, '#7a8ad8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(40 + (i % 8) * 62, 110 + Math.floor(i / 8) * 70, 20, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const tKR = tag('2024年 韓国ドラマ', { size: 64, w: 600, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tKR.position.set(TX, 4.6, -1.2); qs.add(tKR);
const t16 = tag('全16話', { size: 76, w: 340, bg: '#3a7ad8', sx: 2.2 }); t16.position.set(TX, 4.6, -1.2); qs.add(t16);

// ---------- 6段目. デパートとスーパーマーケット（x=200）。まん中で向き合うふたり ----------
const DX = 200;
{ const rd = box(20, 0.04, 12, mat('#c8c4bc')); rd.position.set(DX, 0.02, -2); qs.add(rd); }
const DEPT = new THREE.Group(); DEPT.position.set(DX - 3.6, 0, -5); qs.add(DEPT);
{ const b = box(6, 9, 4, mat('#efe6d6')); b.position.y = 4.5; DEPT.add(b); for (let i = 0; i < 3; i++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), new THREE.MeshBasicMaterial({ color: '#ffe6a8' })); wn.position.set(-1.9 + i * 1.9, 1.6, 2.02); DEPT.add(wn); } const aw = box(6.4, 0.2, 1, mat('#b8963a')); aw.position.set(0, 3.0, 2.3); DEPT.add(aw);
  for (let i = 0; i < 4; i++) { const bag = box(0.4, 0.5, 0.15, mat(['#e05a7a', '#e6b450', '#ffffff', '#3a3a3e'][i])); bag.position.set(-1.6 + i * 1.0, 0.6, 2.4); DEPT.add(bag); } }
const MART = new THREE.Group(); MART.position.set(DX + 3.8, 0, -5); qs.add(MART);
{ const b = box(7, 4.5, 4, mat('#e8f0e8')); b.position.y = 2.25; MART.add(b); const band = box(7.1, 0.7, 0.1, mat('#3f8f6b')); band.position.set(0, 3.8, 2.02); MART.add(band); const glass = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), new THREE.MeshBasicMaterial({ color: '#d8f0ff' })); glass.position.set(0, 1.3, 2.02); MART.add(glass);
  for (let i = 0; i < 3; i++) { const cart = new THREE.Group(); const bk = box(0.6, 0.4, 0.8, new THREE.MeshLambertMaterial({ color: '#b8c0c8', wireframe: true })); bk.position.y = 0.6; cart.add(bk); cart.position.set(-2 + i * 0.8, 0, 2.6); MART.add(cart); }
  for (let i = 0; i < 6; i++) { const f = box(0.36, 0.36, 0.36, mat(['#e05a4f', '#f2c14e', '#3f8f6b'][i % 3])); f.position.set(1.0 + (i % 3) * 0.45, 0.2 + Math.floor(i / 3) * 0.38, 2.5); MART.add(f); } }
const w6 = makePerson(WIFE); w6.position.set(DX - 0.9, 0, 0.6); w6.rotation.y = 0.5; qs.add(w6);
const h6 = makePerson(HUS); h6.position.set(DX + 0.9, 0, 0.6); h6.rotation.y = -0.5; qs.add(h6);
const tQ = tag('デパート業界の女王', { size: 62, w: 600, bg: '#e2483c', sx: 2.3 }); tQ.position.set(DX, 4.3, 0.6); qs.add(tQ);
const tP = tag('スーパーマーケットの王子', { size: 56, w: 700, bg: '#3f8f6b', sx: 2.6 }); tP.position.set(DX, 3.55, 0.6); qs.add(tP);

// ---------- shots ----------
const ALL = [t3y, tCold, tDecide, tDiv, tZai, t3rd, tCrisis, tTogether, tKR, t16, tQ, tP];
function base() { S.reset(); ALL.forEach(x => x.visible = false); ICE.forEach(c => c.visible = false); RAIN.forEach(d => d.visible = false); FLASH.intensity = 0; PAPER.visible = false; }

function shotTable(t) { // 1段目 0〜9：結婚して3年目の夫婦。家でも職場でも、冷え切った関係（0秒目がサムネ）
  base(); S.aim(0, -1); lift(-40); S.hemi.intensity = 1.0; S.darken(0.25, '#0e1a30');
  const g = 0.55 + 0.45 * ease(t / 6);
  ICE.forEach(c => { c.visible = true; c.position.set(c.userData.x, 1.0 + c.scale.y * 0.1, c.userData.z); c.scale.setScalar(g * (0.8 + 0.4 * Math.sin(t * 1.5 + c.userData.o * 6) * 0.2 + 0.2)); c.rotation.y = c.userData.o * 3; });
  w1.userData.head.rotation.y = -0.9; h1.userData.head.rotation.y = 0.9; // そっぽを向く
  t3y.userData.pop(1); if (t > 4.6) t3y.visible = false;
  tCold.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.3, 0, u), lerp(2.7, 2.5, u), lerp(7.8, 7.0, u), 0, 1.25, -1, 56);
  return qs;
}
function shotHall(t) { // 2段目 9〜17：夫は、将来を左右する大きな決断をした。離婚を考えはじめていた
  base(); S.aim(HX, -2); lift(-40); S.hemi.intensity = 0.9; S.darken(0.4, '#0a0c14');
  PAPER.visible = true; PAPER.position.set(HX + 0.05, 1.2, 0.42); PAPER.rotation.x = -0.5;
  h2.userData.arms.forEach(a => a.rotation.x = -0.9); h2.userData.head.rotation.x = 0.35;
  tDecide.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tDecide.visible = false;
  tDiv.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(HX + lerp(1.4, 0.8, u), lerp(2.2, 1.9, u), lerp(4.6, 3.6, u), HX, 1.5, 0, 52);
  return qs;
}
function shotGroup(t) { // 3段目 17〜25：妻は、巨大な財閥グループの3代目。職場でも、顔を合わせるふたり
  base(); S.aim(GX, -2); lift(-30); S.hemi.intensity = 1.3; S.darken(0.1, '#6a7a98');
  FAMILY.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.8 + i) * 0.2; });
  tZai.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tZai.visible = false;
  t3rd.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4) look(GX, lerp(2.0, 4.0, u * 2), lerp(9.4, 8.6, u), GX, lerp(3.0, 6.0, u * 2), -10, 58);
  else look(GX + 0.4, 1.9, lerp(5.4, 4.6, u), GX, 1.5, 0, 54);
  return qs;
}
function shotStorm(t) { // 4段目 25〜33：そんなふたりを、ある危機が襲う。一緒に乗り越えるうちに、止まっていた恋が動き出す
  base(); S.aim(SX, 0); lift(-40); S.hemi.intensity = 0.7; S.key.intensity = 0.5; S.darken(0.65, '#0a0e18');
  RAIN.forEach(d => { d.visible = true; const k = (t * 1.6 + d.userData.o) % 1; d.position.set(d.userData.x + SX, 8 - k * 8, d.userData.z); });
  const fl = Math.max(0, Math.sin(t * 2.3) - 0.92) * 12 * (t < 4 ? 1 : 0.3); FLASH.intensity = 900 * fl;
  const close = ease((t - 4.0) / 1.6);
  w4.position.x = SX - lerp(0.85, 0.32, close); h4.position.x = SX + lerp(0.85, 0.32, close);
  w4.rotation.y = lerp(-0.6, 0.25, close); h4.rotation.y = lerp(0.6, -0.25, close);
  UMB.visible = t > 4.0; UMB.scale.setScalar(Math.max(0.01, close));
  h4.userData.arms[0].rotation.x = t > 4 ? -1.6 * close : 0;
  tCrisis.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCrisis.visible = false;
  tTogether.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(SX + lerp(-1.2, -0.6, u), lerp(2.0, 1.8, u), lerp(6.4, 5.0, u), SX, 1.5, 0, 54);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2024年の韓国ドラマ。全16話。離婚寸前の夫婦の、もう一度の恋
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.2;
  TV.material.map.offset.x = Math.sin(t * 0.6) * 0.02;
  tKR.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKR.visible = false; t16.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX, 2.8, lerp(7.6, 6.8, u), TX, 2.7, -1.5, 56);
  return qs;
}
function shotStores(t, quiz = 0) { // 6段目 42〜49（決め手）：デパート業界の女王と、スーパーマーケットの王子
  base(); S.aim(DX, -2); lift(-30); S.hemi.intensity = 1.3; S.darken(0.15, '#f0b8a0');
  w6.userData.head.rotation.y = 0.3; h6.userData.head.rotation.y = -0.3;
  if (!quiz) { tQ.userData.pop((t - 0.4) / 0.35); tP.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(DX, lerp(2.6, 2.3, u), lerp(8.2, 7.4, u), DX, 2.3, -2, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（傘の下のふたり）
  shotStorm(7.9);
  ALL.forEach(x => x.visible = false);
  RAIN.forEach(d => { const k = (t * 1.6 + d.userData.o) % 1; d.position.set(d.userData.x + SX, 8 - k * 8, d.userData.z); });
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.7, 0.2, d);
  S.spot.color.set(0xffd0d8); S.spot.position.set(SX, 6, 4); S.spot.target.position.set(SX, 1, 0); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(SX + lerp(0.8, 0.4, k), lerp(1.9, 1.7, k), lerp(4.6, 3.8, k), SX, 1.6, 0, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotTable },
  { a: 9, b: 17, f: shotHall },
  { a: 17, b: 25, f: shotGroup },
  { a: 25, b: 33, f: shotStorm },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotStores(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '結婚して3年目の、<br>ある夫婦。'],
  [5.6, 9.0, '家でも職場でも、<br>冷え切った関係。'],
  [9.2, 13.2, '夫は、将来を左右する<br>大きな決断をした。'],
  [13.2, 17.0, '離婚を、<br>考えはじめていた。'],
  [17.2, 21.0, '妻は、巨大な<br>財閥グループの3代目。'],
  [21.0, 25.0, '夫婦は、職場でも<br>顔を合わせる。'],
  [25.2, 29.0, 'そんなふたりを、<br>ある危機が襲う。'],
  [29.0, 33.0, '一緒に乗り越えるうちに、<br>止まっていた恋が動き出す。'],
  [33.2, 37.4, '2024年の韓国ドラマ。<br>全16話。'],
  [37.4, 41.8, '離婚寸前の夫婦の、<br>もう一度の恋。'],
  [42.2, 45.4, 'デパート業界の、<br>女王と呼ばれる妻。'],
  [45.4, 49.0, 'スーパーマーケットの、<br>王子と呼ばれる夫。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、涙の女王。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q034', v2: true, answer: '涙の女王',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 3434,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.2, 'drone'], [17.0, 'whoosh'], [25.0, 'whoosh'], [25.4, 'drone'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '3年目': 'さんねんめ', '3代目': 'さんだいめ', '2024年': 'にせんにじゅうよねん', '全16話': 'ぜんじゅうろくわ', '涙の女王': 'なみだのじょおう', '財閥': 'ざいばつ', '冷え切った': 'ひえきった', '将来': 'しょうらい', '左右する': 'さゆうする', '決断': 'けつだん', '離婚寸前': 'りこんすんぜん', '離婚': 'りこん', '巨大': 'きょだい', '職場': 'しょくば', '危機': 'きき', '襲う': 'おそう', '乗り越える': 'のりこえる', '韓国': 'かんこく', '業界': 'ぎょうかい', '女王': 'じょおう', '王子': 'おうじ', '妻': 'つま', '夫婦': 'ふうふ', '夫': 'おっと', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n結婚して3年目の、ある夫婦。家でも職場でも、冷え切った関係。夫は、将来を左右する大きな決断をした。離婚を、考えはじめていた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', 'ラブコメ'],
  },
});
applyQuizCards({ answer: '涙の女王', info: 'Netflix｜韓国ドラマ・全16話', answerSize: 128 });
