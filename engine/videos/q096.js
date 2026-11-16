import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #096 アベンジャーズ／エンドゲーム（映画・アメリカ・2019年・181分。Disney+ で見放題、
//   Filmarks の動画配信欄（ディズニープラス 見放題、ほかはレンタル）と disneyplus.com/ja-jp/explore/articles/mcu-series の作品リストで2026/11/16確認。
//   Filmarks 4.5・レビュー174,406件 filmarks.com/movies/60414）
// 話題：シリーズ最新作『アベンジャーズ/ドゥームズデイ』が2026年12月18日に日米同時公開（realsound.jp/movie/2025/07/post-2095487.html）。
//   2026年9月に『エンドゲーム：アンコール』が公開され、世界興収歴代1位に返り咲いた（ja.wikipedia.org/wiki/アベンジャーズ/エンドゲーム 冒頭）
// 確かめた事実（disneyplus.com の作品紹介、ja.wikipedia.org/wiki/アベンジャーズ/エンドゲーム の 冒頭・ストーリー冒頭。2026/11/16）：
//   ・宇宙の生命の半分が消し去られたあと、ヒーローたちが再び集結して反撃する物語（Disney+・Wikipedia）
//   ・物語の大部分はそれから5年後。残された者たちはそれぞれの人生を送り、失った者たちを取り戻そうとする（Wikipedia）
//   ・2019年のアメリカ映画。シリーズ（マーベル・シネマティック・ユニバース）の22作目（Wikipedia）
// 構成（ヒント6段）：1 ある日、地球の人の半分が消えた・家族も友だちも一瞬で → 2 残されたのは止められなかった者たち・5年たっても前を向けない
//   → 3 人の減った街は静かなまま・空っぽの席があちこちに → 4 散り散りだった仲間がもう一度集まる・失ったものを取り戻すために
//   → 5 2019年のアメリカ映画・シリーズ22作目の大きな区切り → 6 決め手：世界の興行収入で歴代1位・12月18日にシリーズ最新作が公開
// 作戦の中身・誰が戻るか・誰が犠牲になるか・結末は言わない。ヒーローやキャラクターの名前・衣装・武器・指を鳴らす仕草・石・敵は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面（消える人が灰になる・集結の場面）は使わない。人は汎用の3D
const S = quizStage({ bg: '#1a1c26', floor: '#24262e', fogNear: 28, fogFar: 100 });
const qs = S.scene;
const R = rng(9696);

const CLOTH = [
  { skin: '#f1c9a5', hair: '#2c2421', shirt: '#4a7ad8', pants: '#2a2e3a' },
  { skin: '#f4d3b5', hair: '#6a4a2a', shirt: '#e6b450', pants: '#3a3a40', long: true, skirt: true },
  { skin: '#c89a78', hair: '#1a1410', shirt: '#2e8a4a', pants: '#2a2e3a' },
  { skin: '#f4d3b5', hair: '#2c2421', shirt: '#c8505a', pants: '#3a3a40', long: true },
  { skin: '#8a5a3a', hair: '#1a1410', shirt: '#e8e4dc', pants: '#1a1a1e' },
  { skin: '#f1c9a5', hair: '#a8783a', shirt: '#8a5ac8', pants: '#2a2e3a' },
  { skin: '#f4d3b5', hair: '#1d1a19', shirt: '#e88a3a', pants: '#3a3a40', scale: 0.62 },
  { skin: '#f1c9a5', hair: '#3a2a1a', shirt: '#5a6a7a', pants: '#2a2e3a' },
];
const HERO = { skin: '#f1c9a5', hair: '#3a2a1a', shirt: '#3a4a6a', pants: '#2a2e3a' };

function glow(col = '#bfe0ff') { return new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: col, transparent: true })); }

// ---------- 1段目. 昼の公園（x=0）。8人のうち4人が、光の粒になって消える ----------
{ const gr = box(24, 0.04, 20, mat('#6a9a4a')); gr.position.set(0, 0.02, -4); qs.add(gr);
  const path = box(3, 0.03, 20, mat('#c8b890')); path.position.set(0, 0.05, -4); qs.add(path);
  for (let i = 0; i < 10; i++) { const s = i % 2 ? 1 : -1; const t = new THREE.Group(); const tk = box(0.25, 2.2, 0.25, mat('#5a3a1a')); tk.position.y = 1.1; t.add(tk); const c = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), mat('#3a7a3a')); c.scale.y = 0.8; c.position.y = 2.8; t.add(c); t.position.set(s * (4 + R() * 3), 0, -3 - i * 2.2); qs.add(t); }
  for (const x of [-2.4, 2.4]) { const b = box(1.6, 0.1, 0.5, mat('#8a5a3a')); b.position.set(x, 0.5, -6); qs.add(b); } }
const POS1 = [[-1.2, -2.2], [0.3, -2.6], [1.3, -2.0], [-0.6, -3.6], [0.9, -3.9], [-1.8, -4.6], [0.0, -1.7], [1.9, -4.4]];
const PEOPLE1 = POS1.map(([x, z], i) => { const p = makePerson(CLOTH[i]); p.position.set(x, 0, z); p.rotation.y = R() * 1.2 - 0.6; qs.add(p); return p; });
const GONE1 = [1, 3, 6, 7];
const SPARK1 = []; GONE1.forEach(() => { const g = []; for (let k = 0; k < 14; k++) { const m = glow(); m.userData.o = [R() - 0.5, R() * 1.6, R() - 0.5, 0.6 + R() * 0.8]; qs.add(m); g.push(m); } SPARK1.push(g); });
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.4 }); qs.add(Q1);
const tHalf = tag('人の半分が、消えた', { size: 58, w: 600, bg: '#14161c', sx: 1.9 }); tHalf.position.set(0, 3.0, -3.0); qs.add(tHalf);
const tFlash = tag('家族も友だちも、一瞬で', { size: 54, w: 700, bg: '#c8202c', sx: 2.2 }); tFlash.position.set(0, 3.0, -3.0); qs.add(tFlash);

// ---------- 2段目. 夜の部屋（x=40）。ソファにひとり。壁のカレンダーが 5年後 まで進む ----------
const AX = 40;
{ const fl = box(12, 0.04, 9, mat('#3a3028')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#3a3e4a')); wl.position.set(AX, 2.5, -4.6); qs.add(wl);
  const sofa = box(2.4, 0.45, 0.9, mat('#5a4a5a')); sofa.position.set(AX, 0.23, -3.6); qs.add(sofa);
  const sb = box(2.4, 0.7, 0.25, mat('#5a4a5a')); sb.position.set(AX, 0.75, -4.0); qs.add(sb);
  const win = box(1.4, 1.6, 0.06, new THREE.MeshBasicMaterial({ color: '#1a2a4a' })); win.position.set(AX + 2.6, 2.6, -4.47); qs.add(win);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); lamp.position.set(AX - 1.8, 1.4, -3.9); qs.add(lamp);
  const lp = box(0.05, 1.3, 0.05, mat('#24262b')); lp.position.set(AX - 1.8, 0.65, -3.9); qs.add(lp);
  for (let i = 0; i < 3; i++) { const fr = box(0.5, 0.4, 0.04, mat('#c8b890')); fr.position.set(AX - 1.0 + i * 0.7, 2.6, -4.47); qs.add(fr); const ph = box(0.4, 0.3, 0.05, mat('#2a2e38')); ph.position.set(AX - 1.0 + i * 0.7, 2.6, -4.46); qs.add(ph); } }
const hero2 = makePerson(HERO); hero2.position.set(AX - 0.2, -0.3, -3.5); hero2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(hero2);
const YEAR2 = [0, 1, 2, 3, 4, 5].map(n => { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: canvasTex(160, 160, (g, w, h) => { g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8503a'; g.fillRect(0, 0, w, 36); g.fillStyle = '#14161c'; g.font = '900 86px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n ? '+' + n : '0', 80, 102); }) })); c.position.set(AX + 1.4, 2.4, -4.45); qs.add(c); return c; });
const tLeft = tag('残された、者たち', { size: 58, w: 560, bg: '#14161c', sx: 1.8 }); tLeft.position.set(AX - 0.2, 2.35, -3.4); qs.add(tLeft);
const t5y = tag('5年たっても、前を向けない', { size: 52, w: 760, bg: '#2a6ab0', sx: 2.3 }); t5y.position.set(AX, 3.5, -3.6); qs.add(t5y);

// ---------- 3段目. 曇り空の客席（x=80）。ほとんど空っぽの席 ----------
const BX = 80;
{ const fl = box(30, 0.04, 30, mat('#5a5e68')); fl.position.set(BX, 0.02, -10); qs.add(fl);
  for (let r = 0; r < 9; r++) { const st = box(20, 0.4, 1.2, mat('#7a7e88')); st.position.set(BX, 0.2 + r * 0.45, -4 - r * 1.2); qs.add(st); } }
const SEATS3 = [];
for (let r = 0; r < 9; r++) for (let i = 0; i < 18; i++) { const c = ['#c8505a', '#4a7ad8', '#e6b450'][r % 3]; const s = box(0.5, 0.5, 0.45, mat(c)); s.position.set(BX - 8.5 + i * 1.0, 0.65 + r * 0.45, -4 - r * 1.2); qs.add(s); SEATS3.push(s); }
const FEW3 = [[-2, 2], [3, 5], [-5, 6]].map(([x, r], i) => { const p = makePerson(CLOTH[i + 2]); p.scale.setScalar(0.85); p.position.set(BX + x, 0.4 + r * 0.45, -4 - r * 1.2); p.rotation.y = Math.PI; qs.add(p); return p; });
const tCity = tag('人の減った、街', { size: 60, w: 500, bg: '#14161c', sx: 3.0 }); tCity.position.set(BX, 5.2, -7); qs.add(tCity);
const tEmpty = tag('空っぽの席が、あちこちに', { size: 54, w: 740, bg: '#5a5e68', sx: 4.0 }); tEmpty.position.set(BX, 5.2, -7); qs.add(tEmpty);

// ---------- 4段目. 夜の広場（x=120）。散り散りだった6人が、まん中に集まる ----------
const CX = 120;
{ const fl = box(20, 0.04, 16, mat('#2a2c34')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.15, 48), new THREE.MeshBasicMaterial({ color: '#e6b450' })); ring.rotation.x = -Math.PI / 2; ring.position.set(CX, 0.05, -3); qs.add(ring); }
const CREW4 = [0, 2, 3, 4, 5, 7].map((c, i) => { const p = makePerson(CLOTH[c]); qs.add(p); const a = i / 6 * Math.PI * 2 + 0.3; p.userData.a = a; p.position.set(CX + Math.cos(a) * 5, 0, -3 + Math.sin(a) * 5); return p; });
const SPOT4 = new THREE.SpotLight(0xfff0d0, 0, 14, 0.5, 0.5, 1); SPOT4.position.set(CX, 8, -1); SPOT4.target.position.set(CX, 0, -3); qs.add(SPOT4); qs.add(SPOT4.target);
const tAgain = tag('もう一度、集まる', { size: 60, w: 540, bg: '#14161c', sx: 2.6 }); tAgain.position.set(CX, 3.2, -3); qs.add(tAgain);
const tBack = tag('失ったものを、取り戻す', { size: 54, w: 700, bg: '#c8902c', sx: 2.8 }); tBack.position.set(CX, 3.2, -3); qs.add(tBack);

// ---------- 5段目. 映画館（x=180）。宇宙の映像。2019年・アメリカ映画 ----------
const TX = 180;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  g.fillStyle = '#060814'; g.fillRect(0, 0, w, h); const rr = rng(55);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rr() * 0.7})`; g.fillRect(rr() * w, rr() * h, 2, 2); }
  const pg = g.createRadialGradient(470, 220, 10, 470, 220, 150); pg.addColorStop(0, '#4a7ad8'); pg.addColorStop(1, '#0a1a3a'); g.fillStyle = pg; g.beginPath(); g.arc(470, 220, 140, 0, 7); g.fill(); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t2019 = tag('2019年 アメリカ映画', { size: 56, w: 660, bg: '#e6b450', color: '#14161c', sx: 4.0 }); t2019.position.set(TX, 6.0, -4.4); qs.add(t2019);
const t22 = tag('シリーズ22作目', { size: 60, w: 540, bg: '#c8202c', sx: 3.6 }); t22.position.set(TX, 6.0, -4.4); qs.add(t22);

// ---------- 6段目. 夜の映画館の前（x=220）。金色の 1 の台と、長い行列 ----------
const DX = 220;
{ const fl = box(20, 0.04, 16, mat('#2a2a30')); fl.position.set(DX, 0.02, -3); qs.add(fl);
  const fa = box(10, 6, 0.4, mat('#3a2a3a')); fa.position.set(DX, 3, -7); qs.add(fa);
  const mq = box(7, 1.2, 0.6, mat('#1a1a1e')); mq.position.set(DX, 4.4, -6.6); qs.add(mq);
  for (let i = 0; i < 22; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffe08a' })); b.position.set(DX - 3.4 + i * (6.8 / 21), 5.0, -6.28); qs.add(b); const b2 = b.clone(); b2.position.y = 3.8; qs.add(b2); }
  const door = box(2.4, 2.6, 0.1, new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); door.position.set(DX, 1.3, -6.78); qs.add(door); }
const LINE6 = []; for (let i = 0; i < 12; i++) { const p = makePerson(CLOTH[i % 8]); p.position.set(DX + 1.2 + (i % 2) * 0.1 - i * 0.05, 0, -6.0 + i * 0.75); p.rotation.y = Math.PI; qs.add(p); LINE6.push(p); }
const POD6 = new THREE.Group();
{ const pd = box(1.4, 1.0, 1.4, new THREE.MeshStandardMaterial({ color: '#e6c050', metalness: 0.5, roughness: 0.4, emissive: '#6a5010' })); pd.position.y = 0.5; POD6.add(pd);
  const one = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(180, 180, (g) => { g.fillStyle = '#14161c'; g.font = '900 150px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', 90, 100); }) })); one.position.set(0, 0.5, 0.71); POD6.add(one); }
POD6.position.set(DX - 1.6, 0, -3.2); qs.add(POD6);
const CONF6 = []; for (let i = 0; i < 24; i++) { const c = box(0.08, 0.08, 0.01, new THREE.MeshBasicMaterial({ color: ['#e6c050', '#c8202c', '#4a7ad8', '#ffffff'][i % 4] })); c.userData.o = [R() * 3 - 1.5, R() * 4, R() * 2 - 1, 0.5 + R()]; qs.add(c); CONF6.push(c); }
const tTop = tag('世界の興行収入、歴代1位', { size: 52, w: 740, bg: '#c8902c', sx: 2.4 }); tTop.position.set(DX - 1.5, 2.5, -3.0); qs.add(tTop);
const tNew = tag('12月18日、最新作', { size: 60, w: 560, bg: '#c8202c', sx: 2.8 }); tNew.position.set(DX - 0.8, 3.4, -4.0); qs.add(tNew);

// ---------- shots ----------
const ALL = [tHalf, tFlash, tLeft, t5y, tCity, tEmpty, tAgain, tBack, t2019, t22, tTop, tNew, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPOT4.intensity = 0; SPARK1.forEach(gs => gs.forEach(m => m.visible = false)); }

function shotPark(t, quiz = 0) { // 1段目 0〜9：ある日、地球の人の半分が消えた。家族も友だちも、一瞬で（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.2; S.scene.background.set('#a8c8e8'); S.scene.fog.color.set('#a8c8e8');
  const g = quiz ? 1 : clamp((t - 2.4) / 1.6);
  PEOPLE1.forEach((p, i) => { const gi = GONE1.indexOf(i); p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.3;
    if (gi < 0) { p.scale.setScalar(CLOTH[i].scale || 1); if (g > 0.6 && !quiz) { p.userData.head.rotation.y = Math.sin(t * 6 + i) * 0.6; } return; }
    const s = 1 - ease(g); p.visible = s > 0.02; p.scale.set(s, s, s);
    SPARK1[gi].forEach(m => { const [ox, oy, oz, sp] = m.userData.o; m.visible = !quiz && g > 0.001 && g < 0.999; const k = clamp(g); m.position.set(p.position.x + ox * 0.6, oy * (1 - k) + k * (1.8 + sp), p.position.z + oz * 0.6); m.material.opacity = 1 - k; }); });
  if (quiz) SPARK1.forEach(gs => gs.forEach(m => m.visible = false));
  Q1.position.set(0.3, 2.5, -3.2); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3);
  if (!quiz) { tHalf.userData.pop((t - 1.0) / 0.35); if (t > 4.6) tHalf.visible = false; tFlash.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(4.2, 3.8, u), lerp(3.6, 3.0, u), 0, 1.0, -3.4, 62);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：残されたのは、それを止められなかった者たち。5年たっても、前を向けずにいる
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.45, '#06080e');
  hero2.userData.head.rotation.x = 0.45; hero2.userData.arms.forEach(a => a.rotation.x = -0.6);
  const n = t < 4 ? 0 : Math.min(5, Math.floor((t - 4) / 0.55) + 1); YEAR2.forEach((c, i) => c.visible = i === n);
  tLeft.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tLeft.visible = false; t5y.userData.pop((t - 4.3) / 0.35);
  if (t < 4) { const u = ease(t / 4); look(AX + lerp(0.4, 0.2, u), 1.7, lerp(0.4, -0.2, u), AX - 0.2, 1.4, -3.5, 62); }
  else { const u = ease((t - 4) / 4); look(AX + 0.5, lerp(2.0, 2.2, u), lerp(1.4, 1.0, u), AX + 0.4, 1.9, -4.0, 62); }
  return qs;
}
function shotSeats(t) { // 3段目 17〜25：人の減った街は、静かなまま。空っぽの席が、あちこちに残る
  base(); S.aim(BX, -8); lift(0); S.hemi.intensity = 0.9; S.scene.background.set('#8a8e98'); S.scene.fog.color.set('#8a8e98');
  FEW3.forEach((p, i) => { p.userData.head.rotation.x = 0.3; });
  tCity.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCity.visible = false; tEmpty.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-3, 3, u), lerp(3.4, 3.6, u), 3.4, BX + lerp(-1, 1, u), 2.6, -9, 62);
  return qs;
}
function shotGather(t) { // 4段目 25〜33：散り散りだった仲間が、もう一度集まる。失ったものを、取り戻すために
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.5; S.darken(0.5, '#06070c'); SPOT4.intensity = 50;
  const k = ease(clamp((t - 0.3) / 4.0));
  CREW4.forEach((p, i) => { const a = p.userData.a; const r = lerp(5, 1.6, k); p.position.set(CX + Math.cos(a) * r, 0, -3 + Math.sin(a) * r); p.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); poseWalk(p, t * 8 + i, k < 1 ? 0.8 : 0); if (t > 5.0) p.userData.arms[1].rotation.x = -0.3; });
  tAgain.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAgain.visible = false; tBack.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0, 0.6, u), lerp(4.4, 3.4, u), lerp(5.0, 3.0, u), CX, 1.2, -3, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2019年の、アメリカ映画。シリーズ22作目の、大きな区切り
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2019.visible = false; t22.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.4, 5.4, u), TX, 3.8, -4.8, 62);
  return qs;
}
function shotTop(t) { // 6段目 42〜49（決め手）：世界の興行収入で、歴代1位。12月18日、シリーズの最新作が公開
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.7; S.darken(0.45, '#06070c');
  LINE6.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 2 + i) * 0.3; });
  CONF6.forEach(c => { const [ox, oy, oz, sp] = c.userData.o; c.visible = t > 0.4; c.position.set(DX - 1.6 + ox, 3.8 - ((oy + t * sp) % 3.6), -3.0 + oz); c.rotation.set(t * 3 * sp, t * 2, 0); });
  if (t < 3.4) { tTop.userData.pop((t - 0.3) / 0.35); const u = ease(t / 3.4); look(DX - 1.5, lerp(2.0, 2.2, u), lerp(3.0, 2.5, u), DX - 1.5, 1.3, -3.2, 62); }
  else { tNew.userData.pop((t - 3.6) / 0.3); const u = ease((t - 3.4) / 3.6); look(DX - 3.2, lerp(2.8, 3.0, u), lerp(4.0, 4.6, u), DX - 0.4, 2.4, -5.0, 62); }
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（公園に戻る）
  shotPark(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(0.3, 3.9, lerp(3.4, 3.0, k), 0, 1.0, -3.4, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotPark(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotSeats },
  { a: 25, b: 33, f: shotGather },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotTop },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、地球の人の<br>半分が消えた。'],
  [5.6, 9.0, '家族も友だちも、<br>一瞬で。'],
  [9.2, 13.2, '残されたのは、それを<br>止められなかった者たち。'],
  [13.2, 17.0, '5年たっても、<br>前を向けずにいる。'],
  [17.2, 21.0, '人の減った街は、<br>静かなまま。'],
  [21.0, 25.0, '空っぽの席が、<br>あちこちに残る。'],
  [25.2, 29.0, '散り散りだった仲間が、<br>もう一度集まる。'],
  [29.0, 33.0, '失ったものを、<br>取り戻すために。'],
  [33.2, 37.4, '2019年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'シリーズ22作目の、<br>大きな区切り。'],
  [42.2, 45.4, '世界の興行収入で、<br>歴代1位。'],
  [45.4, 49.0, '12月18日、<br>シリーズの最新作が公開。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、アベンジャーズ<br>エンドゲーム。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q096', v2: true, answer: 'アベンジャーズ／エンドゲーム',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 9696,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ある日': 'あるひ', '地球': 'ちきゅう', '人': 'ひと', '半分': 'はんぶん', '消えた': 'きえた', '家族': 'かぞく', '友だち': 'ともだち', '一瞬': 'いっしゅん', '残された': 'のこされた', '止められなかった': 'とめられなかった', '者たち': 'ものたち', '5年': 'ごねん', '前を向けず': 'まえをむけず', '減った': 'へった', '街': 'まち', '静かな': 'しずかな', '空っぽ': 'からっぽ', '席': 'せき', '残る': 'のこる', '散り散り': 'ちりぢり', '仲間': 'なかま', '一度': 'いちど', '集まる': 'あつまる', '失った': 'うしなった', '取り戻す': 'とりもどす', '2019年': 'にせんじゅうきゅうねん', '映画': 'えいが', '22作目': 'にじゅうにさくめ', '大きな': 'おおきな', '区切り': 'くぎり', '世界': 'せかい', '興行収入': 'こうぎょうしゅうにゅう', '歴代1位': 'れきだいいちい', '12月18日': 'じゅうにがつじゅうはちにち', '最新作': 'さいしんさく', '公開': 'こうかい', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nある日、地球の人の半分が消えた。家族も友だちも、一瞬で。残されたのは、それを止められなかった者たち。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', '映画好き', '洋画', 'アクション映画'],
  },
});
applyQuizCards({ answer: 'アベンジャーズ／<br>エンドゲーム', info: 'Disney+｜映画・181分', answerSize: 104 });
