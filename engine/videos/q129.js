import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #129 キングダム（映画・日本・2019年製作・134分。U-NEXT・Prime Video で見放題、
//   Filmarks の動画配信欄（U-NEXT・Prime Video・Netflix・Hulu・DMM TV 見放題。2026年10月更新）と JustWatch 日本版 justwatch.com/jp/映画/kingudamu
//   （見放題：Amazon Prime Video・Hulu・Netflix・U-NEXT）で2026/11/22確認。Filmarks 3.8・レビュー192,095件 filmarks.com/movies/79926）
// 確かめた事実（映画.com eiga.com/movie/89983 の解説・あらすじ。2026/11/22）：
//   ・中国春秋戦国時代を舞台にした原泰久のベストセラー漫画を実写映画化。2019年製作／134分／日本
//   ・紀元前245年。戦災孤児の少年ふたりは奴隷の身分から天下の大将軍になることを目標に掲げ、日々の剣術の鍛錬に励んでいた
//   ・ある時、ひとりが大臣に召し上げられて王宮へ入ることになり、ふたりはそれぞれ別の道を歩むことになる
//   ・主人公はやがて、王座を追われた若き王と行動をともにすることになる
// 構成（ヒント6段）：1 奴隷として働くふたりの少年・毎晩こっそり剣のけいこ → 2 主人公は戦で家族を失った少年・身分はいちばん下
//   → 3 いくつもの国が争う遠い昔・どこまでも続く乾いた大地 → 4 ある日、親友だけが都へ呼ばれる・ふたりは別々の道へ
//   → 5 2019年の日本映画・原作は古代中国が舞台のベストセラー漫画 → 6 決め手：夢は天下の大将軍・若き王と出会い運命が動き出す
// 王宮で起きること・親友のその後・王の正体と結末は言わない。登場人物の名前・国の名前は出さない。
// 俳優の顔・ポスター・ロゴ・漫画の絵は使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#d8c8a8', floor: '#a88a60', fogNear: 30, fogFar: 120 });
const qs = S.scene;
const R = rng(12910);

const BOY1 = { skin: '#d8a880', hair: '#1a1410', shirt: '#8a7a5a', pants: '#5a4a3a' };
const BOY2 = { skin: '#e0b088', hair: '#2a2018', shirt: '#7a6a50', pants: '#4a3e30', long: true };
const LORD = { skin: '#e0b890', hair: '#3a3a3a', shirt: '#3a4a6a', pants: '#2a3048' };
const SOLD = { skin: '#d8a880', hair: '#2a2018', shirt: '#6a2a24', pants: '#3a2a20' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function stick(p, len = 0.9, c = '#a8865a') { const s = box(0.05, len, 0.05, mat(c)); s.position.set(0, -0.62 - len / 2 + 0.1, 0.06); p.userData.arms[1].add(s); return s; }
function flag(x, z, c, h = 3) { const g = new THREE.Group(); const pl = box(0.06, h, 0.06, mat('#5a4a3a')); pl.position.y = h / 2; g.add(pl); const f = box(0.8, 0.6, 0.02, mat(c)); f.position.set(0.42, h - 0.35, 0); g.add(f); g.position.set(x, 0, z); qs.add(g); return g; }
function hut(x, z, s = 1) { const g = new THREE.Group(); const w = box(2.4, 1.6, 2, mat('#a08a6a')); w.position.y = 0.8; g.add(w); const r = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 4), mat('#6a5a3a')); r.rotation.y = Math.PI / 4; r.position.y = 2.1; g.add(r);
  g.position.set(x, 0, z); g.scale.setScalar(s); qs.add(g); return g; }

// ---------- 1段目. 月夜の農家の裏庭（x=0）。木の棒で打ち合うふたりの少年 ----------
{ const gr = box(20, 0.04, 16, mat('#7a6a4a')); gr.position.set(0, 0.02, -3); qs.add(gr);
  hut(-3.4, -6); hut(3.8, -7, 1.2); const fn = box(10, 0.8, 0.1, mat('#6a5a3a')); fn.position.set(0, 0.4, -4.4); qs.add(fn);
  for (let i = 0; i < 8; i++) { const hs = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 6), mat('#c8a860')); hs.position.set(-6 + i * 1.6, 0.5, -5.4 - R()); qs.add(hs); } }
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), skyTex('#0e1430', '#3a4060')); SKY1.position.set(0, 12, -40); qs.add(SKY1);
const MOON1 = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), gl('#f4ecd0')); MOON1.position.set(-6, 12, -38); qs.add(MOON1);
const A1 = person(BOY1, -0.6, -2.4, Math.PI / 2); const B1 = person(BOY2, 0.6, -2.4, -Math.PI / 2);
const SA1 = stick(A1), SB1 = stick(B1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tTwo = tag('奴隷として働く、ふたり', { size: 54, w: 680, bg: '#14161c', sx: 2.2 }); tTwo.position.set(0, 2.55, -2.6); qs.add(tTwo);
const tNight = tag('毎晩、こっそり剣のけいこ', { size: 52, w: 740, bg: '#e24050', sx: 2.3 }); tNight.position.set(0, 2.55, -2.6); qs.add(tNight);

// ---------- 2段目. 昼の畑（x=50）。重い荷を運ぶ主人公。見張りの男の影 ----------
const AX = 50;
{ const gr = box(24, 0.04, 16, mat('#9a8058')); gr.position.set(AX, 0.02, -3); qs.add(gr);
  for (let r = 0; r < 6; r++) { const row = box(20, 0.2, 0.5, mat('#6a5a38')); row.position.set(AX, 0.1, -1 - r * 1.2); qs.add(row);
    for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 5), mat('#8aa050')); c.position.set(AX - 9 + i * 1.2, 0.45, -1 - r * 1.2); qs.add(c); } }
  hut(AX + 6, -10, 1.3); }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#8ab0d8', '#f0e8d0')); SKY2.position.set(AX, 12, -39); qs.add(SKY2);
const A2 = person(BOY1, AX, -1.6, Math.PI / 2);
const LOAD2 = box(0.7, 0.5, 0.5, mat('#b89a6a')); LOAD2.position.set(0, 1.55, -0.25); A2.add(LOAD2);
const BOSS2 = person({ skin: '#d8a880', hair: '#2a2018', shirt: '#4a3a2a', pants: '#2a2018' }, AX + 2.6, -2.8, -2.2);
const tLost = tag('戦で家族を失った、少年', { size: 54, w: 700, bg: '#14161c', sx: 1.9 }); tLost.position.set(AX, 2.75, -2.0); qs.add(tLost);
const tLow = tag('身分は、いちばん下', { size: 58, w: 560, bg: '#e24050', sx: 1.6 }); tLow.position.set(AX, 2.75, -2.0); qs.add(tLow);

// ---------- 3段目. 乾いた大地（x=100）。遠くに城壁の街。荒野を進む軍の旗の列 ----------
const BX = 100;
{ const gr = box(80, 0.04, 60, mat('#c8a870')); gr.position.set(BX, 0.02, -20); qs.add(gr);
  for (let i = 0; i < 14; i++) { const h = new THREE.Mesh(new THREE.ConeGeometry(4 + R() * 4, 3 + R() * 4, 6), mat(['#b8985e', '#a8885a', '#c0a070'][i % 3])); h.position.set(BX - 40 + i * 6, 1.5, -40 - R() * 6); qs.add(h); }
  const wall = box(14, 2.4, 1, mat('#9a8460')); wall.position.set(BX + 6, 1.2, -26); qs.add(wall);
  for (let i = 0; i < 4; i++) { const t = box(1.6, 3.6, 1.6, mat('#8a7450')); t.position.set(BX - 0.5 + i * 4.3, 1.8, -26); qs.add(t); } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), skyTex('#d8a868', '#f4e0b0')); SKY3.position.set(BX, 14, -60); qs.add(SKY3);
const ARMY3 = new THREE.Group(); for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) { const s = box(0.4, 1.4, 0.3, mat(['#5a2a24', '#4a3a2a'][(r + i) % 2])); s.position.set(i * 0.7, 0.7, r * 0.7); ARMY3.add(s); }
for (let i = 0; i < 4; i++) { const pl = box(0.05, 3, 0.05, mat('#4a3a2a')); pl.position.set(i * 2.4, 1.5, -0.4); ARMY3.add(pl); const f = box(0.7, 0.5, 0.02, mat('#a82a24')); f.position.set(i * 2.4 + 0.37, 2.7, -0.4); ARMY3.add(f); }
ARMY3.position.set(BX - 10, 0, -14); qs.add(ARMY3);
const DUST3 = []; for (let i = 0; i < 20; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.3 + R() * 0.4, 6, 5), gl('#e0c898', 0.35)); qs.add(d); DUST3.push(d); }
const tWar = tag('国どうしが争う、遠い昔', { size: 54, w: 700, bg: '#14161c', sx: 2.2 }); tWar.position.set(BX, 3.0, -8); qs.add(tWar);
const tLand = tag('どこまでも、乾いた大地', { size: 54, w: 700, bg: '#e24050', sx: 2.2 }); tLand.position.set(BX, 3.0, -8); qs.add(tLand);

// ---------- 4段目. 分かれ道（x=150）。立派な服の男に連れられて都へ向かう親友。見送る主人公 ----------
const CX = 150;
{ const gr = box(30, 0.04, 30, mat('#b0966a')); gr.position.set(CX, 0.02, -10); qs.add(gr);
  const rd1 = box(1.6, 0.03, 18, mat('#d8c8a0')); rd1.position.set(CX - 2.4, 0.04, -9); rd1.rotation.y = -0.25; qs.add(rd1);
  const rd2 = box(1.6, 0.03, 18, mat('#d8c8a0')); rd2.position.set(CX + 2.4, 0.04, -9); rd2.rotation.y = 0.25; qs.add(rd2);
  const wall = box(10, 3, 1, mat('#8a7454')); wall.position.set(CX - 6, 1.5, -22); qs.add(wall); const gate = box(2.4, 4.6, 1.4, mat('#6a5034')); gate.position.set(CX - 6, 2.3, -21.8); qs.add(gate); }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#e8a060', '#f8e0b0')); SKY4.position.set(CX, 12, -44); qs.add(SKY4);
const A4 = person(BOY1, CX + 1.1, -1.4, Math.PI + 0.5);
const B4 = person(BOY2, CX - 1.0, -2.6, Math.PI + 0.25);
const L4 = person(LORD, CX - 1.6, -3.2, Math.PI + 0.25);
const tCall = tag('親友だけが、都へ', { size: 58, w: 540, bg: '#14161c', sx: 1.9 }); tCall.position.set(CX - 0.6, 2.7, -3.0); qs.add(tCall);
const tApart = tag('ふたりは、別々の道へ', { size: 56, w: 620, bg: '#e24050', sx: 2.0 }); tApart.position.set(CX - 0.6, 2.7, -3.0); qs.add(tApart);

// ---------- 5段目. 書庫（x=200）。巻物と、竹を並べた古い書物。ろうそくの光 ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#6a5034')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#7a6044')); wl.position.set(TX, 2.5, -4.6); qs.add(wl);
  for (let r = 0; r < 3; r++) { const sh = box(5, 0.08, 0.6, mat('#4a3420')); sh.position.set(TX + 2.6, 1.0 + r * 1.1, -4.2); qs.add(sh);
    for (let i = 0; i < 9; i++) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 10), mat(['#d8c8a0', '#c8b088', '#e0d0a8'][i % 3])); sc.rotation.z = Math.PI / 2; sc.position.set(TX + 0.6 + i * 0.5, 1.15 + r * 1.1, -4.1); qs.add(sc); } }
  const tb = box(2.6, 0.1, 1.3, mat('#5a3a22')); tb.position.set(TX - 0.8, 0.8, -2.4); qs.add(tb); const tl = box(2.4, 0.76, 1.1, mat('#4a3018')); tl.position.set(TX - 0.8, 0.38, -2.4); qs.add(tl);
  for (let i = 0; i < 12; i++) { const bm = box(0.07, 0.02, 0.8, mat('#c8b070')); bm.position.set(TX - 1.3 + i * 0.09, 0.86, -2.3); qs.add(bm); }
  const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), mat('#f0e8d0')); cd.position.set(TX + 0.1, 1.0, -2.6); qs.add(cd);
  const fl2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gl('#ffc860')); fl2.position.set(TX + 0.1, 1.2, -2.6); qs.add(fl2);
  const cl = new THREE.PointLight('#ffb860', 4, 5); cl.position.set(TX + 0.1, 1.4, -2.4); qs.add(cl); }
const t2019 = tag('2019年の、日本映画', { size: 56, w: 620, bg: '#e6b450', color: '#14161c', sx: 2.1 }); t2019.position.set(TX - 0.4, 2.6, -2.8); qs.add(t2019);
const tManga = tag('原作は、古代中国が舞台の漫画', { size: 48, w: 820, bg: '#e24050', sx: 2.4 }); tManga.position.set(TX - 0.4, 2.6, -2.8); qs.add(tManga);

// ---------- 6段目. 丘の上（x=250）。木の剣を空へかかげる少年。眼下には、旗をかかげた大軍 ----------
const DX = 250;
{ const gr = box(60, 0.04, 50, mat('#a8905e')); gr.position.set(DX, -2.0, -20); qs.add(gr);
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 6, 2.0, 16), mat('#8a7a4a')); hill.position.set(DX, -1.0, -1.5); qs.add(hill); }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), skyTex('#4a6ab0', '#f8d8a0')); SKY6.position.set(DX, 12, -60); qs.add(SKY6);
const ARMY6 = new THREE.Group(); for (let r = 0; r < 8; r++) for (let i = 0; i < 26; i++) { const s = box(0.4, 1.4, 0.3, mat(['#5a2a24', '#4a3a2a', '#6a3a2a'][(r + i) % 3])); s.position.set(i * 0.8, 0.7, r * 0.8); ARMY6.add(s); }
for (let i = 0; i < 9; i++) { const pl = box(0.06, 3.4, 0.06, mat('#4a3a2a')); pl.position.set(i * 2.6, 1.7, -0.5); ARMY6.add(pl); const f = box(0.9, 0.6, 0.02, mat('#b02a24')); f.position.set(i * 2.6 + 0.47, 3.0, -0.5); ARMY6.add(f); }
ARMY6.position.set(DX - 10, -2.0, -16); qs.add(ARMY6);
const A6 = person(BOY1, DX, -1.6, Math.PI); const SA6 = stick(A6, 1.0, '#c8a870');
const KING6 = person({ skin: '#f0d0b0', hair: '#1a1410', shirt: '#2a2a3a', pants: '#1a1a26' }, DX - 0.95, -1.3, Math.PI - 0.9);
const CAPE6 = box(0.6, 1.1, 0.06, mat('#6a1a2a')); CAPE6.position.set(0, 0.95, -0.18); KING6.add(CAPE6);
const tGeneral = tag('夢は、天下の大将軍！', { size: 56, w: 640, bg: '#14161c', sx: 1.9 }); qs.add(tGeneral);
const tKing = tag('若き王と、運命が動き出す', { size: 52, w: 740, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tKing);

// ---------- shots ----------
const ALL = [tTwo, tNight, tLost, tLow, tWar, tLand, tCall, tApart, t2019, tManga, tGeneral, tKing, Q1];
function base() { S.reset(); S.key.color.set('#fff0dc'); ALL.forEach(x => x.visible = false); }

function shotYard(t, quiz = 0) { // 1段目 0〜9：奴隷として働く、ふたりの少年。毎晩、こっそり剣のけいこをしている（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.5; S.key.color.set('#b8c8ff');
  const sw = quiz ? 0.4 : t;
  A1.userData.arms[1].rotation.x = -1.6 + Math.sin(sw * 5) * 0.9; B1.userData.arms[1].rotation.x = -1.6 + Math.sin(sw * 5 + 2.4) * 0.9;
  A1.position.x = -0.6 + Math.sin(sw * 2.5) * 0.15; B1.position.x = 0.6 + Math.sin(sw * 2.5 + 1) * 0.15;
  Q1.position.set(0, 1.85, -2.4); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tTwo.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tTwo.visible = false; tNight.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.8, 0.4, u), lerp(1.8, 1.7, u), lerp(2.2, 1.6, u), 0, 1.3, -2.6, 62);
  return qs;
}
function shotField(t) { // 2段目 9〜17：主人公は、戦で家族を失った少年。身分は、いちばん下の奴隷
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.2;
  A2.position.x = AX - 1.6 + t * 0.35; poseWalk(A2, t * 3.5, 0.6); A2.userData.arms.forEach(a => a.rotation.x = -2.8);
  A2.userData.head.rotation.x = t > 4.2 ? 0.3 : 0;
  tLost.position.x = tLow.position.x = A2.position.x;
  tLost.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLost.visible = false; tLow.userData.pop((t - 4.3) / 0.35);
  look(A2.position.x + 1.2, 2.0, 2.4, A2.position.x, 1.5, -1.8, 62);
  return qs;
}
function shotPlain(t) { // 3段目 17〜25：舞台は、いくつもの国が争う遠い昔の時代。どこまでも続く、乾いた大地
  base(); S.aim(BX, -10); lift(0); S.hemi.intensity = 1.2;
  ARMY3.position.x = BX - 10 + t * 0.5;
  DUST3.forEach((d, i) => { d.position.set(ARMY3.position.x + (i % 10) * 0.9, 0.4 + Math.sin(t + i) * 0.1, -14 + 3.0 + Math.floor(i / 10) * 0.6); });
  tWar.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWar.visible = false; tLand.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  const cx = BX - 4 + lerp(-1.0, 1.0, u); tWar.position.x = tLand.position.x = cx;
  look(cx, lerp(2.6, 2.8, u), lerp(-3.0, -3.6, u), cx, 1.4, -16, 62);
  return qs;
}
function shotFork(t) { // 4段目 25〜33：ある日、親友だけが都へ呼ばれる。ふたりは、別々の道を歩むことに
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.1;
  const k = clamp(t / 8); B4.position.set(CX - 1.0 - k * 1.2, 0, -2.6 - k * 3.6); L4.position.set(CX - 1.6 - k * 1.2, 0, -3.2 - k * 3.6); poseWalk(B4, t * 4, 0.6); poseWalk(L4, t * 4 + 1, 0.6);
  if (t > 4.4) B4.rotation.y = Math.PI + 0.25 + Math.PI * 0.85 * ease(clamp((t - 4.4) / 0.6)) * (t < 6.4 ? 1 : 0); else B4.rotation.y = Math.PI + 0.25;
  A4.userData.arms[0].rotation.set(t > 4.6 && t < 6.6 ? -2.8 : 0, 0, 0);
  tCall.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCall.visible = false; tApart.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.2, -0.2, u), lerp(1.9, 2.0, u), lerp(1.8, 1.4, u), CX - 1.2, 1.3, -4.4, 62);
  return qs;
}
function shotScroll(t) { // 5段目 33〜42：2019年の、日本映画。原作は、古代中国が舞台のベストセラー漫画
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.35, '#1a1008');
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2019.visible = false; tManga.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.6, 0.0, u), lerp(2.3, 2.2, u), lerp(1.6, 1.0, u), TX - 0.4, 1.4, -2.6, 62);
  return qs;
}
function shotHill(t) { // 6段目 42〜49（決め手）：夢は、天下の大将軍！ 若き王と出会い、運命が動き出す
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.1;
  A6.userData.arms[1].rotation.set(-2.9 - Math.sin(t * 2) * 0.05, 0, 0.1); A6.userData.head.rotation.x = -0.2;
  KING6.visible = t > 3.4; KING6.userData.head.rotation.y = 0.3;
  tGeneral.position.set(DX + 0.2, 3.0, -1.6); tKing.position.set(DX + 0.2, 3.0, -1.6);
  if (t < 3.6) tGeneral.userData.pop((t - 0.3) / 0.35); else tKing.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(1.4, 1.0, u), lerp(1.9, 2.0, u), lerp(3.0, 2.6, u), DX - 0.5, 1.5, -4.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（月夜の裏庭に戻る）
  shotYard(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotYard(t, 0) },
  { a: 9, b: 17, f: shotField },
  { a: 17, b: 25, f: shotPlain },
  { a: 25, b: 33, f: shotFork },
  { a: 33, b: 42, f: shotScroll },
  { a: 42, b: 49, f: shotHill },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '奴隷として働く、<br>ふたりの少年。'],
  [5.6, 9.0, '毎晩、こっそり<br>剣のけいこをしている。'],
  [9.2, 13.2, '主人公は、戦で<br>家族を失った少年。'],
  [13.2, 17.0, '身分は、<br>いちばん下。'],
  [17.2, 21.0, '舞台は、国どうしが争う<br>遠い昔の時代。'],
  [21.0, 25.0, 'どこまでも続く、<br>乾いた大地。'],
  [25.2, 29.0, 'ある日、親友だけが<br>都へ呼ばれる。'],
  [29.0, 33.0, 'ふたりは、<br>別々の道を歩むことに。'],
  [33.2, 37.4, '2019年の、<br>日本映画。'],
  [37.4, 41.8, '原作は、古代中国が舞台の<br>ベストセラー漫画。'],
  [42.2, 45.4, '夢は、<br>天下の大将軍！'],
  [45.4, 49.0, '若き王と出会い、<br>運命が動き出す。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>キングダム。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q129', v2: true, answer: 'キングダム',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 12910,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [17.4, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '奴隷': 'どれい', '働く': 'はたらく', '少年': 'しょうねん', '毎晩': 'まいばん', '剣': 'けん', '主人公': 'しゅじんこう', '戦': 'いくさ', '家族': 'かぞく', '失った': 'うしなった', '身分': 'みぶん', '下': 'した', '舞台': 'ぶたい', '国どうし': 'くにどうし', '争う': 'あらそう', '遠い昔': 'とおいむかし', '時代': 'じだい', '続く': 'つづく', '乾いた': 'かわいた', '大地': 'だいち', 'ある日': 'あるひ', '親友': 'しんゆう', '都': 'みやこ', '呼ばれる': 'よばれる', '別々': 'べつべつ', '道': 'みち', '歩む': 'あゆむ', '2019年': 'にせんじゅうきゅうねん', '日本映画': 'にほんえいが', '原作': 'げんさく', '古代中国': 'こだいちゅうごく', '漫画': 'まんが', '夢': 'ゆめ', '天下': 'てんか', '大将軍': 'だいしょうぐん', '若き王': 'わかきおう', '出会い': 'であい', '運命': 'うんめい', '動き出す': 'うごきだす', '映画': 'えいが', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n奴隷として働く、ふたりの少年。毎晩、こっそり剣のけいこをしている。主人公は、戦で家族を失った少年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'PrimeVideo', '映画好き', '邦画'],
  },
});
applyQuizCards({ answer: 'キングダム', info: 'U-NEXT・Prime Video｜映画・134分', answerSize: 128 });
