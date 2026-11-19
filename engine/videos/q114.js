import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #114 ラストマイル（映画・日本・2024年8月23日公開・128分。DMM TV・Netflix ほかで見放題、
//   DMM TV の作品ページ info.tv.dmm.com/pr/season/i8xknntdv0ndb2jcta58f2d9n/（見放題）・Netflix の作品ページ netflix.com/jp/title/82616563 と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・DMM TV・Lemino・Hulu・Netflix ほか 見放題）で2026/11/19確認。Filmarks 4.0・レビュー165,528件 filmarks.com/movies/113843）
// 確かめた事実（Filmarks のあらすじ filmarks.com/movies/113843、Netflix の作品紹介、Wikipedia 日本語版 ラストマイル の 冒頭・興行収入。2026/11/19）：
//   ・ある日、届いた荷物は爆弾だった。11月、流通業界最大のイベントのひとつ“ブラックフライデー”の前夜、ショッピングサイト最大手から
//     配送された段ボール箱が爆発する。やがて謎の連続爆破事件へと発展していく（Filmarks・Netflix）
//   ・巨大物流倉庫のセンター長に着任したばかりの女性が、チームマネージャーと共に事態の収拾にあたる（Filmarks）
//   ・残りの爆弾は幾つで、今どこにあるのか？ 止めることのできない流通を止めずに、連続爆破を止められるのか（Filmarks）
//   ・2024年公開の日本映画。監督 塚原あゆ子、脚本 野木亜紀子、主演 満島ひかり。興行収入 59.6億円。
//     ドラマ『アンナチュラル』『MIU404』と世界観を共有するシェアード・ユニバース作品（Wikipedia）
// 構成（ヒント6段）：1 届いた荷物を開けたら爆発・連続爆破の始まり → 2 主人公は巨大な物流倉庫の新しいセンター長・着任したばかりでこの事件
//   → 3 11月の大セールの前夜・止まらないベルトコンベア → 4 残りの爆弾はいくつ、今どこに・流れを止めずに爆破を止められるか
//   → 5 2024年の日本映画・興行収入59.6億円・監督 塚原あゆ子、脚本 野木亜紀子 → 6 決め手：2つの人気ドラマと同じ世界・タイトルは配達の最後のひと区間
// 犯人・動機・爆弾のありか・結末は言わない。登場人物の名前・会社名・ドラマのタイトルは出さない。実在の通販サイトのロゴや色は使わない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。爆発はけむりと光だけ（けが人は描かない）。人は汎用の3D
const S = quizStage({ bg: '#1a2030', floor: '#2a3040', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(11410);

const BOSS = { skin: '#f4d3b5', hair: '#1a1410', shirt: '#2a2a32', pants: '#2a2a32', long: true };
const MGR = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#e8e8ec', pants: '#3a4050', tie: true };
const RES = { skin: '#e8c4a0', hair: '#4a3426', shirt: '#8a9ab0', pants: '#4a4a52' };
const STAFF = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#2a2420', '#1a1410', '#5a4030'][i % 3], shirt: '#3a6ab0', pants: '#2a2e3a', long: i % 2 === 1 });
const DRV = { skin: '#e8b98f', hair: '#1a1410', shirt: '#4a8a5a', pants: '#2a3a2e' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
const BOXM = mat('#c89a5a'), TAPE = mat('#e8d8b0');
function parcel(s = 1) { const g = new THREE.Group(); const b = box(0.6 * s, 0.4 * s, 0.45 * s, BOXM); g.add(b); const tp = box(0.62 * s, 0.02, 0.1 * s, TAPE); tp.position.y = 0.2 * s + 0.005; g.add(tp); return g; }
function conveyor(x, z, len, rot = 0) { const g = new THREE.Group(); const b = box(len, 0.12, 1.0, mat('#3a3e46')); b.position.y = 0.9; g.add(b);
  for (let i = 0; i < len / 0.5; i++) { const r = box(0.06, 0.04, 0.96, mat('#8a8e98')); r.position.set(-len / 2 + 0.25 + i * 0.5, 0.97, 0); g.add(r); }
  for (let i = 0; i < len / 2; i++) for (const s of [-0.45, 0.45]) { const l = box(0.08, 0.9, 0.08, mat('#2a2e36')); l.position.set(-len / 2 + 1 + i * 2, 0.45, s); g.add(l); }
  g.position.set(x, 0, z); g.rotation.y = rot; qs.add(g); return g; }

// ---------- 1段目. マンションの玄関（x=0）。届いた段ボール箱を開ける住人。光とけむり ----------
{ const fl = box(10, 0.04, 8, mat('#8a8478')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#d8d0c4')); wl.position.set(0, 2, -5); qs.add(wl);
  const dr = box(1.2, 2.2, 0.08, mat('#5a4a3a')); dr.position.set(-1.6, 1.1, -4.88); qs.add(dr);
  const sh = box(1.4, 0.9, 0.5, mat('#9a7a5a')); sh.position.set(2.2, 0.45, -4.5); qs.add(sh);
  const lamp = box(0.6, 0.06, 0.6, gl('#fff4d8')); lamp.position.set(0, 3.9, -2); qs.add(lamp);
  const mat1 = box(1.4, 0.02, 0.9, mat('#6a5a7a')); mat1.position.set(-0.2, 0.04, -2.6); qs.add(mat1); }
const res1 = makePerson(RES); res1.position.set(-0.2, 0, -3.3); qs.add(res1);
const BOX1 = parcel(1.1); BOX1.position.set(-0.2, 0.25, -2.5); qs.add(BOX1);
const LID1 = [-1, 1].map(s => { const f = box(0.33, 0.02, 0.5, BOXM); f.position.set(-0.2 + s * 0.17, 0.48, -2.5); qs.add(f); return f; });
const FLASH1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), gl('#fff0a0', 0.9)); FLASH1.position.set(-0.2, 0.6, -2.5); qs.add(FLASH1);
const SMOKE1 = []; for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), gl('#8a8a90', 0.6)); s.userData.p = [R() * 2 - 1, R() * 2 - 1, R()]; qs.add(s); SMOKE1.push(s); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tOpen = tag('届いた荷物を、開けたら…', { size: 54, w: 720, bg: '#14161c', sx: 2.2 }); tOpen.position.set(-0.1, 2.35, -3.6); qs.add(tOpen);
const tChain = tag('連続爆破の、始まり', { size: 58, w: 600, bg: '#c8202c', sx: 2.0 }); tChain.position.set(-0.1, 2.35, -3.6); qs.add(tChain);

// ---------- 2段目. 巨大な物流倉庫（x=50）。高い棚の列。中央に立つ新しいセンター長、となりにマネージャー ----------
const AX = 50;
{ const fl = box(30, 0.04, 30, mat('#9a9890')); fl.position.set(AX, 0.02, -10); qs.add(fl);
  for (let i = 0; i < 12; i++) { const ln = box(0.12, 0.01, 30, mat('#e0c040')); ln.position.set(AX - 12 + i * 2.2, 0.04, -10); if (i % 3 === 1) qs.add(ln); }
  for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { const x = AX + (r ? 3.4 : -3.4); const z = -6 - k * 3.2;
    const rack = box(1.4, 6, 2.8, mat('#3a5a8a')); rack.position.set(x, 3, z); qs.add(rack);
    for (let lv = 0; lv < 5; lv++) for (let q = 0; q < 3; q++) { const p = parcel(0.9); p.position.set(x + (r ? -0.72 : 0.72), 0.6 + lv * 1.15, z - 0.9 + q * 0.9); p.rotation.y = Math.PI / 2; qs.add(p); } }
  for (let i = 0; i < 6; i++) { const l = box(0.4, 0.08, 4, gl('#f4f8ff')); l.position.set(AX + (i % 2 ? 1.6 : -1.6), 9, -4 - Math.floor(i / 2) * 7); qs.add(l); }
  const ceil = box(30, 0.2, 30, mat('#3a3e46')); ceil.position.set(AX, 9.4, -10); qs.add(ceil); }
const boss2 = makePerson(BOSS); boss2.position.set(AX - 0.3, 0, -4.4); qs.add(boss2);
const CARD2 = box(0.14, 0.18, 0.02, gl('#ffffff')); CARD2.position.set(0, 1.18, 0.16); boss2.add(CARD2);
const mgr2 = makePerson(MGR); mgr2.position.set(AX + 0.7, 0, -4.9); mgr2.rotation.y = -0.3; qs.add(mgr2);
const STAFF2 = [0, 1, 2].map(i => { const p = makePerson(STAFF(i)); p.position.set(AX - 1.4 + i * 1.3, 0, -10 - i * 1.5); qs.add(p); return p; });
const tBoss = tag('巨大倉庫の、新しいセンター長', { size: 50, w: 820, bg: '#14161c', sx: 4.0 }); tBoss.position.set(AX, 3.3, -5.4); qs.add(tBoss);
const tNew = tag('着任したばかりで、大事件', { size: 54, w: 720, bg: '#c8202c', sx: 3.6 }); tNew.position.set(AX, 3.3, -5.4); qs.add(tNew);

// ---------- 3段目. 夜のベルトコンベア（x=100）。流れつづける段ボール箱。壁に大セールの垂れ幕 ----------
const BX = 100;
{ const fl = box(30, 0.04, 30, mat('#7a7a74')); fl.position.set(BX, 0.02, -10); qs.add(fl);
  const wl = box(30, 9, 0.2, mat('#5a5e68')); wl.position.set(BX, 4.5, -16); qs.add(wl);
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(560, 128, (g, w, h) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6b450'; g.font = '900 78px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BIG SALE', w / 2, h / 2 + 4); }) }));
  ban.position.set(BX, 6.4, -15.85); qs.add(ban);
  for (let i = 0; i < 6; i++) { const l = box(0.4, 0.08, 4, gl('#f4f8ff')); l.position.set(BX + (i % 3 - 1) * 4, 8.6, -4 - Math.floor(i / 3) * 6); qs.add(l); } }
const BELTS3 = [conveyor(BX - 1.6, -6, 24, 0), conveyor(BX + 1.6, -9, 24, 0)];
const PAR3 = []; for (let i = 0; i < 26; i++) { const p = parcel(0.7 + (i % 3) * 0.15); p.userData.p = [i % 2, (i * 1.9) % 24, R()]; qs.add(p); PAR3.push(p); }
const STAFF3 = [0, 1, 2, 3].map(i => { const p = makePerson(STAFF(i)); p.position.set(BX - 4 + i * 2.6, 0, -6 + (i % 2 ? -1.0 : 0.9)); p.rotation.y = i % 2 ? 0 : Math.PI; qs.add(p); return p; });
const tEve = tag('11月、大セールの前夜', { size: 56, w: 640, bg: '#14161c', sx: 3.0 }); tEve.position.set(BX + 0.8, 3.9, -7); qs.add(tEve);
const tNonstop = tag('荷物は、止まらない', { size: 58, w: 600, bg: '#e6b450', color: '#14161c', sx: 2.9 }); tNonstop.position.set(BX + 0.8, 3.9, -7); qs.add(tNonstop);

// ---------- 4段目. 暗い指令室（x=150）。大きな地図の画面に、赤い点が次々ともる。見つめるセンター長とマネージャー ----------
const CX = 150;
{ const fl = box(12, 0.04, 10, mat('#22262e')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#1a1e26')); wl.position.set(CX, 3, -5); qs.add(wl);
  const dk = box(6, 0.8, 1.0, mat('#3a3e48')); dk.position.set(CX, 0.4, -2.6); qs.add(dk);
  for (let i = 0; i < 3; i++) { const m = box(0.9, 0.55, 0.04, gl('#3a6ab0')); m.position.set(CX - 1.4 + i * 1.4, 1.15, -2.9); qs.add(m); } }
const MAP4 = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => { g.fillStyle = '#0a1a2a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,160,220,0.35)'; g.lineWidth = 1; for (let i = 0; i < 32; i++) { g.beginPath(); g.moveTo(i * 20, 0); g.lineTo(i * 20, h); g.stroke(); } for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(0, i * 20); g.lineTo(w, i * 20); g.stroke(); }
  g.fillStyle = '#2a4a6a'; g.beginPath(); g.moveTo(120, 300); g.bezierCurveTo(200, 120, 360, 80, 520, 60); g.lineTo(560, 110); g.bezierCurveTo(420, 150, 300, 220, 220, 330); g.fill();
  g.strokeStyle = '#7ac8ff'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(330, 170); g.lineTo(140 + (i * 53) % 400, 70 + (i * 71) % 250); g.stroke(); } }) }));
MAP4.position.set(CX, 3.2, -4.88); qs.add(MAP4);
const DOTS4 = []; for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), gl('#ff3a3a')); d.position.set(CX - 3.2 + (140 + (i * 53) % 400) / 100, 3.2 + 1.8 - (70 + (i * 71) % 250) / 100, -4.86); qs.add(d); DOTS4.push(d); }
const boss4 = makePerson(BOSS); boss4.position.set(CX - 0.6, 0, -1.4); boss4.rotation.y = Math.PI; qs.add(boss4);
const mgr4 = makePerson(MGR); mgr4.position.set(CX + 0.7, 0, -1.2); mgr4.rotation.y = Math.PI; qs.add(mgr4);
const tLeft = tag('残りの爆弾は、いくつ？', { size: 56, w: 680, bg: '#c8202c', sx: 4.0 }); tLeft.position.set(CX, 5.4, -4.6); qs.add(tLeft);
const tStop = tag('流れを止めずに、止められるか', { size: 50, w: 820, bg: '#14161c', sx: 4.4 }); tStop.position.set(CX, 5.4, -4.6); qs.add(tStop);

// ---------- 5段目. 映画館（x=200）。スクリーンに、夜の倉庫と走るトラックの光 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1e1a22')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#2a2230')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#5a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1020'); gr.addColorStop(1, '#2a3048'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a6070'; g.fillRect(120, 120, 480, 140); g.fillStyle = '#ffe8a0'; for (let i = 0; i < 16; i++) g.fillRect(140 + i * 28, 150, 16, 10);
  g.fillStyle = '#3a3a40'; g.fillRect(0, 280, w, 80); g.fillStyle = '#ffd890'; for (let i = 0; i < 10; i++) g.fillRect(30 + i * 70, 305, 30, 5);
  g.fillStyle = '#ff5a3a'; for (let i = 0; i < 5; i++) g.fillRect(60 + i * 140, 325, 12, 6); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t2024 = tag('2024年の、日本映画', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 4.4 }); t2024.position.set(TX, 6.4, -4.4); qs.add(t2024);
const tBox = tag('興行収入、59.6億円', { size: 58, w: 620, bg: '#c8202c', sx: 4.4 }); tBox.position.set(TX, 6.4, -4.4); qs.add(tBox);

// ---------- 6段目. 夕方の住宅街（x=250）。配達のトラックから玄関まで、最後のひと区間を歩く配達員 ----------
const DX = 250;
{ const gr = box(24, 0.04, 16, mat('#8a8a84')); gr.position.set(DX, 0.02, -4); qs.add(gr);
  for (let i = 0; i < 3; i++) { const hs = box(4, 3, 3, mat(['#e8dcc8', '#d8c8b8', '#c8d0d8'][i])); hs.position.set(DX - 5 + i * 5, 1.5, -9); qs.add(hs);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.2, 4), mat('#6a5a50')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.75); rf.position.set(DX - 5 + i * 5, 3.6, -9); qs.add(rf);
    const dr = box(0.9, 1.9, 0.05, mat('#7a5a40')); dr.position.set(DX - 5 + i * 5, 0.95, -7.47); qs.add(dr); }
  const path = box(1.2, 0.03, 5, mat('#b8b0a0')); path.position.set(DX, 0.04, -5); qs.add(path); }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(49, 50), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4a5a8a'); gr.addColorStop(1, '#f0a070'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); SKY6.position.set(DX, 14, -40); qs.add(SKY6);
const TRUCK6 = new THREE.Group(); { const c = box(2.0, 2.2, 3.6, mat('#e8e8ec')); c.position.set(0, 1.5, -0.8); TRUCK6.add(c); const cab = box(2.0, 1.6, 1.4, mat('#4a8a5a')); cab.position.set(0, 1.2, 1.7); TRUCK6.add(cab);
  for (const [x, z] of [[-1, -1.8], [1, -1.8], [-1, 1.6], [1, 1.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 14), mat('#1a1a1a')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.4, z); TRUCK6.add(w); } }
TRUCK6.position.set(DX - 3.4, 0, -2.6); TRUCK6.rotation.y = Math.PI / 2; qs.add(TRUCK6);
const drv6 = makePerson(DRV); drv6.position.set(DX, 0, -2.4); qs.add(drv6);
const CAP6 = box(0.46, 0.12, 0.5, mat('#4a8a5a')); CAP6.position.set(0, 0.56, 0.04); drv6.userData.head.add(CAP6);
const BOX6 = parcel(0.8); BOX6.position.set(0, 0.95, 0.35); drv6.add(BOX6);
const ARROW6 = []; for (let i = 0; i < 6; i++) { const a = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 3), gl('#e6b450')); a.rotation.x = -Math.PI / 2; a.position.set(DX, 0.08, -3.2 - i * 0.7); qs.add(a); ARROW6.push(a); }
const tWorld = tag('2つの人気ドラマと、同じ世界', { size: 50, w: 800, bg: '#14161c', sx: 2.7 }); tWorld.position.set(DX, 3.3, -4.6); qs.add(tWorld);
const tLast = tag('配達の、最後のひと区間', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.5 }); tLast.position.set(DX, 3.3, -4.6); qs.add(tLast);

// ---------- shots ----------
const ALL = [tOpen, tChain, tBoss, tNew, tEve, tNonstop, tLeft, tStop, t2024, tBox, tWorld, tLast, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); FLASH1.visible = false; SMOKE1.forEach(s => s.visible = false); PAR3.forEach(p => p.visible = false); }

function shotOpen(t, quiz = 0) { // 1段目 0〜9：届いた荷物を開けたら、爆発した。それは連続爆破の始まり（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.1;
  res1.userData.legs.forEach(l => l.rotation.x = -0.9); res1.position.y = -0.2; res1.userData.arms.forEach(a => a.rotation.x = -1.0); res1.userData.head.rotation.x = 0.5;
  const op = quiz ? 0.4 : ease(clamp((t - 1.0) / 2.0)); LID1.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * op * 1.8; f.position.y = 0.48 + op * 0.12; f.position.x = -0.2 + (i ? 1 : -1) * (0.17 + op * 0.14); });
  const bang = quiz ? 0 : clamp((t - 5.4) / 0.25);
  if (bang > 0) { const k = clamp((t - 5.4) / 2.5); FLASH1.visible = k < 0.4; FLASH1.scale.setScalar(1 + k * 6); FLASH1.material.opacity = 0.9 * (1 - k / 0.4);
    SMOKE1.forEach((s, i) => { const p = s.userData.p; s.visible = true; s.position.set(-0.2 + p[0] * k * 1.6, 0.6 + k * (1.5 + p[2]), -2.5 + p[1] * k * 1.2); s.scale.setScalar(1 + k * 3); s.material.opacity = 0.6 * (1 - k * 0.6); });
    res1.position.z = -3.3 - ease(clamp((t - 5.4) / 0.6)) * 0.8; res1.rotation.x = -0.25 * ease(clamp((t - 5.4) / 0.6)); res1.userData.arms.forEach(a => a.rotation.x = -2.2); }
  if (bang > 0) S.darken(0.2 * (1 - clamp((t - 5.6) / 1)), '#fff4c0');
  Q1.position.set(0.5, 0.75, -2.1); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tOpen.userData.pop((t - 1.6) / 0.35); if (t > 5.3) tOpen.visible = false; tChain.userData.pop((t - 5.7) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.4, 1.2, u), lerp(2.3, 2.4, u), lerp(1.2, 1.6, u), -0.2, 0.9, -2.8, 60);
  return qs;
}
function shotWarehouse(t) { // 2段目 9〜17：主人公は、巨大な物流倉庫の新しいセンター長。着任したばかりで、この大事件
  base(); S.aim(AX, -6); lift(0); S.hemi.intensity = 1.25;
  STAFF2.forEach((p, i) => { const w = (t * 0.6 + i) % 4; p.position.z = -10 - i * 1.5 + w; poseWalk(p, t * 6 + i, 0.6); });
  boss2.userData.head.rotation.y = Math.sin(t * 0.8) * 0.35; boss2.userData.arms[1].rotation.x = t > 4.2 ? -0.8 : 0;
  mgr2.userData.arms[0].rotation.x = t > 4.4 ? -1.4 : 0;
  tBoss.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBoss.visible = false; tNew.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.6, 0.3, u), lerp(1.8, 1.9, u), lerp(1.0, -0.6, u), AX, 2.2, -7, 64);
  return qs;
}
function shotBelt(t) { // 3段目 17〜25：1年でいちばん荷物が動く、11月の大セールの前夜。ベルトコンベアは止まらない
  base(); S.aim(BX, -8); lift(0); S.hemi.intensity = 1.0; S.darken(0.3, '#0a0c14');
  PAR3.forEach((p, i) => { p.visible = true; const q = p.userData.p; const x = ((q[1] + t * 2.2) % 24) - 12; p.position.set(BX + (q[0] ? 1.6 : -1.6) + 0, 1.18, (q[0] ? -9 : -6) + 0); p.position.x = BX - 12 + ((q[1] + t * 2.2) % 24); p.position.z = q[0] ? -9 : -6; p.rotation.y = q[2] * 0.3; });
  STAFF3.forEach((p, i) => { p.userData.arms.forEach((a, k) => a.rotation.x = -0.9 + Math.sin(t * 5 + i + k) * 0.25); });
  tEve.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tEve.visible = false; tNonstop.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-5.0, -3.6, u), lerp(2.6, 2.8, u), lerp(-1.0, -2.0, u), BX + 2, 1.6, -8, 62);
  return qs;
}
function shotMap(t) { // 4段目 25〜33：残りの爆弾は、いくつ？今、どこにある？流れを止めずに、爆破を止められるか
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#04060c');
  DOTS4.forEach((d, i) => { const k = clamp((t - 0.6 - i * 0.35) / 0.2); d.visible = k > 0; d.scale.setScalar(k * (1 + Math.sin(t * 8 + i) * 0.25)); });
  boss4.userData.head.rotation.x = -0.15; mgr4.userData.arms[1].rotation.x = t > 4.4 ? -1.6 : 0;
  tLeft.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLeft.visible = false; tStop.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.4, 0.2, u), lerp(2.2, 2.4, u), lerp(3.6, 2.8, u), CX, 2.8, -4.8, 66);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2024年の日本映画。興行収入59.6億円。監督 塚原あゆ子、脚本 野木亜紀子
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t2024.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2024.visible = false; tBox.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.8, 6.0, u), TX, 3.6, -4.8, 68);
  return qs;
}
function shotLastMile(t) { // 6段目 42〜49（決め手）：2つの人気ドラマと同じ世界の物語。タイトルは、配達の最後のひと区間
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 1.0; S.darken(0.2, '#f0a070');
  const w = ease(clamp((t - 0.4) / 6.0)); drv6.position.z = -2.4 - w * 4.4; drv6.rotation.y = Math.PI; poseWalk(drv6, t * 6, w < 1 ? 0.6 : 0);
  drv6.userData.arms.forEach(a => a.rotation.x = -1.1);
  ARROW6.forEach((a, i) => { a.material.opacity = 1; a.visible = Math.floor(t * 4 + i) % 6 !== 0; });
  if (t < 3.6) tWorld.userData.pop((t - 0.3) / 0.35); else tLast.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(1.4, 1.0, u), lerp(2.2, 2.3, u), lerp(1.8, 0.8, u), DX, 1.3, -5.6, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（玄関に戻る）
  shotOpen(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotOpen(t, 0) },
  { a: 9, b: 17, f: shotWarehouse },
  { a: 17, b: 25, f: shotBelt },
  { a: 25, b: 33, f: shotMap },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotLastMile },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、届いた荷物を<br>開けたら…'],
  [5.6, 9.0, '爆発した。それは、<br>連続爆破の始まりだった。'],
  [9.2, 13.2, '主人公は、巨大な物流倉庫の<br>新しいセンター長。'],
  [13.2, 17.0, '着任したばかりで、<br>この大事件。'],
  [17.2, 21.0, '1年でいちばん荷物が動く、<br>11月の大セールの前夜。'],
  [21.0, 25.0, 'ベルトコンベアは、<br>止まらない。'],
  [25.2, 29.0, '残りの爆弾は、いくつ？<br>今、どこにある？'],
  [29.0, 33.0, '流れを止めずに、<br>爆破を止められるか。'],
  [33.2, 37.4, '2024年の日本映画。<br>興行収入は59.6億円。'],
  [37.4, 41.8, '監督は塚原あゆ子、<br>脚本は野木亜紀子。'],
  [42.2, 45.4, '2つの人気ドラマと、<br>同じ世界の物語。'],
  [45.4, 49.0, 'タイトルは、配達の<br>最後のひと区間。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ラストマイル。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q114', v2: true, answer: 'ラストマイル',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 11410,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 4.4, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '日': 'ひ', '届いた': 'とどいた', '荷物': 'にもつ', '開けたら': 'あけたら', '爆発': 'ばくはつ', '連続爆破': 'れんぞくばくは', '始まり': 'はじまり', '主人公': 'しゅじんこう', '巨大': 'きょだい', '物流倉庫': 'ぶつりゅうそうこ', '新しい': 'あたらしい', 'センター長': 'センターちょう', '着任': 'ちゃくにん', '大事件': 'だいじけん', '1年': 'いちねん', '動く': 'うごく', '11月': 'じゅういちがつ', '大セール': 'だいセール', '前夜': 'ぜんや', '止まらない': 'とまらない', '残り': 'のこり', '爆弾': 'ばくだん', '今': 'いま', '流れ': 'ながれ', '止めずに': 'とめずに', '爆破': 'ばくは', '止められる': 'とめられる', '2024年': 'にせんにじゅうよねん', '日本映画': 'にほんえいが', '興行収入': 'こうぎょうしゅうにゅう', '59.6億円': 'ごじゅうきゅうてんろくおくえん', '監督': 'かんとく', '塚原あゆ子': 'つかはらあゆこ', '脚本': 'きゃくほん', '野木亜紀子': 'のぎあきこ', '2つ': 'ふたつ', '人気': 'にんき', '同じ': 'おなじ', '世界': 'せかい', '物語': 'ものがたり', '配達': 'はいたつ', '最後': 'さいご', '区間': 'くかん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nある日、届いた荷物を開けたら…。それは、連続爆破の始まりだった。主人公は、巨大な物流倉庫の新しいセンター長。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'DMMTV', 'Netflix', '映画好き', '邦画'],
  },
});
applyQuizCards({ answer: 'ラストマイル', info: 'DMM TV・Netflix｜映画・128分', answerSize: 130 });
