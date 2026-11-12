import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #076 国宝（映画・日本・2025年・175分。Prime Video で見放題（2026/6/6から独占見放題）、
//   JustWatch 日本版 justwatch.com/jp/映画/guo-bao で2026/11/12確認（Filmarks の動画配信欄も Prime Video 見放題）。
//   Filmarks 4.2・レビュー261,129件 filmarks.com/movies/115241）
// 確かめた事実（Filmarks・JustWatch の作品紹介、ja.wikipedia.org/wiki/国宝_(映画)。2026/11/12）：
//   ・主人公は任侠の一門に生まれた。抗争によって父を亡くし、上方歌舞伎の名門の当主に引き取られ、歌舞伎の世界へ飛び込む（Filmarks・JustWatch）
//   ・当主の実の息子は、生まれながらに将来を約束された御曹司。血筋と才能、正反対の2人はライバルとして高め合う（Filmarks・JustWatch）
//   ・主人公には女形としての天賦の才があった。当主の厳しい稽古で才能を伸ばす（Wikipedia）
//   ・2025年6月6日公開、上映時間175分（Filmarks）。実写邦画の興行収入で歴代1位（2025年11月24日発表、Wikipedia）
// 構成（ヒント6段）：1 抗争で父を亡くした少年、名門の当主が引き取る → 2 生まれは任侠の一門、飛び込んだのは芸の世界
//   → 3 板の間で厳しい稽古、扇子ひとつで同じ動きを何度も → 4 当主の息子は生まれながらの跡取り、血筋と才能のライバル
//   → 5 2025年の日本映画・約3時間、実写邦画の興行収入歴代1位 → 6 決め手：歌舞伎の女形・タイトルは漢字2文字
// 人物名・家の名・地名・演目名は出さない。俳優の顔・ポスター・ロゴ・衣装や化粧の再現・有名な場面（雪の中の場面・鷺の衣装など）の構図は使わない。
// 歌舞伎の幕は一般的な三色の縦じまだけ。人は汎用の3D。結末（主人公たちのその後）は言わない

const S = quizStage({ bg: '#1a1a24', floor: '#2a2420', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(7676);

const BOY = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#2a3046', pants: '#2a3046', scale: 0.78 };
const HEAD = { skin: '#e8b98f', hair: '#2c2421', shirt: '#14161c', pants: '#14161c' };
const YOUNG = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#e9e4da', pants: '#3a3a44' };
const HEIR = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#c8a070', pants: '#3a3a44' };
const ONNA = { skin: '#f8f2ec', hair: '#14161c', shirt: '#e86a9a', pants: '#c94f7c', long: true, skirt: true };

function fan(c = '#e6b450') { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); g.add(m); const h = box(0.03, 0.12, 0.02, mat('#4a3424')); h.position.y = -0.04; g.add(h); return g; }

// ---------- 1段目. 夜の門の前（x=0）。ひとり立つ少年に、黒い着物の当主が手を差し出す ----------
{ const gr = box(16, 0.04, 14, mat('#3a3430')); gr.position.set(0, 0.02, -2); qs.add(gr);
  const wall = box(16, 2.4, 0.4, mat('#5a5048')); wall.position.set(0, 1.2, -5); qs.add(wall);
  const roofW = box(16.4, 0.3, 0.9, mat('#24262b')); roofW.position.set(0, 2.5, -5); qs.add(roofW);
  for (const s of [-1, 1]) { const p = box(0.4, 3.4, 0.4, mat('#3a2a20')); p.position.set(s * 1.6, 1.7, -4.8); qs.add(p); }
  const gt = box(4.0, 0.4, 0.8, mat('#24262b')); gt.position.set(0, 3.5, -4.8); qs.add(gt);
  const dr = box(2.8, 3.0, 0.1, mat('#2a1e18')); dr.position.set(0, 1.5, -4.95); qs.add(dr);
  for (const s of [-1, 1]) { const ln = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), new THREE.MeshBasicMaterial({ color: '#f4c870' })); ln.position.set(s * 2.3, 2.6, -4.5); qs.add(ln); } }
const boy1 = makePerson(BOY); boy1.position.set(-0.6, 0, -1.4); boy1.rotation.y = 0.3; qs.add(boy1);
const head1 = makePerson(HEAD); qs.add(head1); head1.position.set(1.8, 0, -3.6);
const tLost = tag('父を亡くした少年', { size: 62, w: 560, bg: '#14161c', sx: 1.9 }); tLost.position.set(-0.3, 2.4, -1.6); qs.add(tLost);
const tTake = tag('名門の当主が、引き取る', { size: 56, w: 680, bg: '#8a1f2c', sx: 1.9 }); tTake.position.set(-0.2, 2.6, -2.2); qs.add(tTake);

// ---------- 2段目. 大きな屋敷の広間（x=40）。任侠の家から、芸の世界へ ----------
const AX = 40;
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshStandardMaterial({ map: canvasTex(280, 240, (g, w, h) => { g.fillStyle = '#c8b878'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a4a2a'; g.lineWidth = 3; for (let x = 0; x <= w; x += 70) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }) })); fl.rotation.x = -Math.PI / 2; fl.position.set(AX, 0.03, -2); qs.add(fl);
  const wl = box(14, 4, 0.2, mat('#efe6d0')); wl.position.set(AX, 2, -6); qs.add(wl);
  for (let i = 0; i < 6; i++) { const b = box(0.08, 4, 0.12, mat('#5a3a24')); b.position.set(AX - 5 + i * 2, 2, -5.88); qs.add(b); }
  const bm = box(14, 0.2, 0.2, mat('#5a3a24')); bm.position.set(AX, 3.0, -5.85); qs.add(bm); }
const boy2 = makePerson(BOY); boy2.position.set(AX - 1.6, 0, -1.6); qs.add(boy2);
const SHADOW = []; for (let i = 0; i < 3; i++) { const p = makePerson({ skin: '#2a2a30', hair: '#14161c', shirt: '#24262b', pants: '#24262b' }); p.position.set(AX - 3.0 + i * 0.7, 0, -4.4); qs.add(p); SHADOW.push(p); }
const FANS2 = []; for (let i = 0; i < 5; i++) { const f = fan(['#e6b450', '#e2483c', '#f4f0e4'][i % 3]); qs.add(f); FANS2.push(f); }
const tBorn = tag('任侠の家に生まれた', { size: 60, w: 600, bg: '#14161c', sx: 2.0 }); tBorn.position.set(AX - 1.6, 2.5, -1.8); qs.add(tBorn);
const tArt = tag('飛び込んだのは、芸の世界', { size: 54, w: 720, bg: '#c8902a', sx: 2.0 }); tArt.position.set(AX - 0.1, 2.6, -2.2); qs.add(tArt);

// ---------- 3段目. 板の間の稽古場（x=80）。扇子を持って同じ動きを何度も ----------
const BX = 80;
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = ['#a07848', '#987040', '#a87e50'][i % 3]; g.fillRect(i * 16, 0, 16, h); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(i * 16, 0, 1, h); } }) })); fl.rotation.x = -Math.PI / 2; fl.position.set(BX, 0.03, -2); qs.add(fl);
  const wl = box(12, 4, 0.2, mat('#e8dcc4')); wl.position.set(BX, 2, -5.4); qs.add(wl);
  const mr = box(4, 2.2, 0.05, mat('#b8c8d0')); mr.position.set(BX + 2.5, 1.6, -5.28); qs.add(mr);
  for (let i = 0; i < 3; i++) { const w = box(1.4, 1.4, 0.05, mat('#f4f0e0')); w.position.set(BX - 4 + i * 1.6, 2.4, -5.28); qs.add(w); } }
const boy3 = makePerson({ ...BOY, scale: 0.86 }); boy3.position.set(BX - 0.2, 0, -1.6); qs.add(boy3);
const FAN3 = fan('#e6b450'); qs.add(FAN3);
const head3 = makePerson(HEAD); head3.position.set(BX + 1.6, 0, -3.0); head3.rotation.y = -0.6; head3.userData.legs.forEach(l => l.rotation.x = -1.5); head3.position.y = -0.55; qs.add(head3);
const GHOST = []; for (let i = 0; i < 3; i++) { const g = makePerson({ ...BOY, scale: 0.86 }); g.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.22; } }); g.position.set(BX - 0.2, 0, -1.6); qs.add(g); GHOST.push(g); }
const tPractice = tag('厳しい稽古の毎日', { size: 62, w: 560, bg: '#14161c', sx: 1.9 }); tPractice.position.set(BX, 2.6, -2.0); qs.add(tPractice);
const tFan = tag('扇子ひとつで、何度も', { size: 58, w: 640, bg: '#c8902a', sx: 2.1 }); tFan.position.set(BX, 2.6, -2.0); qs.add(tFan);

// ---------- 4段目. 稽古場で向き合う2人の青年（x=120）。左は才能、右は血筋 ----------
const CX = 120;
{ const fl = box(14, 0.04, 10, mat('#8a6440')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#2a2420')); wl.position.set(CX, 2.5, -5.4); qs.add(wl); }
const young4 = makePerson(YOUNG); young4.position.set(CX - 0.75, 0, -1.8); young4.rotation.y = Math.PI / 2 - 0.35; qs.add(young4);
const heir4 = makePerson(HEIR); heir4.position.set(CX + 0.75, 0, -1.8); heir4.rotation.y = -Math.PI / 2 + 0.35; qs.add(heir4);
const SPOTL = new THREE.SpotLight(0xffd8a0, 0, 12, 0.32, 0.5, 1); SPOTL.position.set(CX - 0.75, 6, -1); SPOTL.target.position.set(CX - 0.75, 0, -1.8); qs.add(SPOTL); qs.add(SPOTL.target);
const SPOTR = new THREE.SpotLight(0xa0c8ff, 0, 12, 0.32, 0.5, 1); SPOTR.position.set(CX + 0.75, 6, -1); SPOTR.target.position.set(CX + 0.75, 0, -1.8); qs.add(SPOTR); qs.add(SPOTR.target);
const SPARK = []; for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffd84a' : '#a0c8ff' })); qs.add(s); SPARK.push(s); }
const tHeir = tag('当主の息子は、跡取り', { size: 56, w: 660, bg: '#3a5a8a', sx: 1.8 }); tHeir.position.set(CX + 0.6, 2.6, -2.0); qs.add(tHeir);
const tRival = tag('血筋と才能のライバル', { size: 56, w: 660, bg: '#14161c', sx: 2.1 }); tRival.position.set(CX, 2.7, -2.0); qs.add(tRival);

// ---------- 5段目. 映画館（x=180）。満席の客席とスクリーン ----------
const TX = 180;
{ const fl = box(14, 0.04, 12, mat('#2a1a1e')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(14, 7, 0.2, mat('#1a1418')); wl.position.set(TX, 3.5, -5.2); qs.add(wl);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const sh = box(0.5, 0.7, 0.12, mat('#8a1f2c')); sh.position.set(TX - 3.2 + c * 0.8, 0.55 + r * 0.25, 0.8 + r * 0.9); qs.add(sh);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), mat(['#1d1a19', '#2c2421', '#5a5a5a'][(r + c) % 3])); hd.position.set(TX - 3.2 + c * 0.8, 1.05 + r * 0.25, 0.75 + r * 0.9); qs.add(hd); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.0), new THREE.MeshBasicMaterial({ map: canvasTex(640, 300, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2a40'); gr.addColorStop(1, '#c8902a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,240,200,.5)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc((i * 97) % w, (i * 53) % h, 2 + i % 3, 0, Math.PI * 2); g.fill(); } }) }));
SCREEN.position.set(TX, 3.4, -5.05); qs.add(SCREEN);
const CLOCK = new THREE.Group(); { const f = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ color: '#f4f0e4' })); CLOCK.add(f); const hh = box(0.05, 0.3, 0.02, mat('#14161c')); hh.position.y = 0.15; CLOCK.add(hh); CLOCK.userData.hand = hh; } CLOCK.position.set(TX + 2.6, 4.6, -4.9); qs.add(CLOCK);
const t2025 = tag('2025年 日本映画・約3時間', { size: 52, w: 760, bg: '#e6b450', color: '#14161c', sx: 3.2 }); t2025.position.set(TX, 5.0, -2.0); qs.add(t2025);
const tRecord = tag('実写邦画 興行収入 歴代1位', { size: 52, w: 760, bg: '#8a1f2c', sx: 3.2 }); tRecord.position.set(TX, 5.0, -2.0); qs.add(tRecord);

// ---------- 6段目. 歌舞伎の舞台（x=220）。三色の幕が開くと、扇子を持つ女形の姿 ----------
const DX = 220;
{ const fl = box(14, 0.6, 6, mat('#b89060')); fl.position.set(DX, 0.3, -3.6); qs.add(fl);
  const bk = box(14, 7, 0.2, mat('#3a3a2a')); bk.position.set(DX, 3.5, -6.6); qs.add(bk);
  for (let i = 0; i < 5; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.4, 8), mat('#3f6a3a')); tr.position.set(DX - 4 + i * 2, 2.6, -6.4); qs.add(tr); }
  const fl2 = box(14, 0.04, 6, mat('#2a2420')); fl2.position.set(DX, 0.02, 1); qs.add(fl2); }
const CURTAIN = new THREE.Group(); { const cols = ['#14161c', '#c8641e', '#2f6a3a']; for (let i = 0; i < 12; i++) { const s = box(0.62, 6.4, 0.06, mat(cols[i % 3])); s.position.x = (i - 5.5) * 0.62; CURTAIN.add(s); } } CURTAIN.position.set(DX, 3.6, -1.0); qs.add(CURTAIN);
const onna = makePerson(ONNA); onna.position.set(DX, 0.6, -3.4); qs.add(onna);
const FAN6 = fan('#e6b450'); qs.add(FAN6);
const PETALS = []; for (let i = 0; i < 22; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ color: '#f8c8d8', side: THREE.DoubleSide })); qs.add(p); PETALS.push(p); }
const tKabuki = tag('歌舞伎の女形', { size: 66, w: 480, bg: '#14161c', sx: 1.7 }); tKabuki.position.set(DX, 3.6, -2.4); qs.add(tKabuki);
const tKanji = tag('タイトルは漢字2文字', { size: 58, w: 640, bg: '#8a1f2c', sx: 2.2 }); tKanji.position.set(DX, 3.6, -2.4); qs.add(tKanji);

// ---------- shots ----------
const ALL = [tLost, tTake, tBorn, tArt, tPractice, tFan, tHeir, tRival, t2025, tRecord, tKabuki, tKanji];
function base() { S.reset(); ALL.forEach(x => x.visible = false); FANS2.forEach(f => f.visible = false); GHOST.forEach(g => g.visible = false); SPARK.forEach(s => s.visible = false); PETALS.forEach(p => p.visible = false); SPOTL.intensity = 0; SPOTR.intensity = 0; FAN3.visible = false; FAN6.visible = false; }

function shotGate(t, quiz = 0) { // 1段目 0〜9：抗争で父を亡くした、ひとりの少年。ある名門の当主が、少年を引き取った（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.75; S.darken(0.2, '#06070a');
  boy1.userData.head.rotation.x = 0.25; boy1.userData.arms.forEach(a => a.rotation.x = 0);
  const k = quiz ? 1 : clamp((t - 4.4) / 2.2);
  head1.position.set(lerp(1.8, 0.2, ease(k)), 0, lerp(-3.6, -1.6, ease(k))); head1.rotation.y = -Math.PI / 2 - 0.2 + k * 0.3; poseWalk(head1, t * 5, k > 0 && k < 1 ? 0.7 : 0);
  if (k >= 1) { head1.userData.arms[0].rotation.x = -1.0; boy1.userData.head.rotation.x = -0.1; boy1.rotation.y = 0.9; }
  if (!quiz) { tLost.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tLost.visible = false; tTake.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.6, -0.4, u), lerp(1.6, 1.7, u), lerp(2.6, 2.3, u), lerp(-0.4, -0.1, u), 1.0, -2.2, 58);
  return qs;
}
function shotHall(t) { // 2段目 9〜17：少年が生まれたのは、任侠の一門。飛び込んだのは、芸の世界
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = t < 4.2 ? 0.8 : 1.3;
  SHADOW.forEach(p => p.visible = t < 4.2); if (t < 4.2) S.darken(0.3, '#100a0a');
  boy2.rotation.y = t < 4.2 ? 0.3 : 0; poseWalk(boy2, t * 5, t > 4.2 && t < 6.5 ? 0.6 : 0); boy2.position.x = AX - 1.6 + clamp((t - 4.2) / 2.3) * 1.6;
  if (t > 4.4) FANS2.forEach((f, i) => { f.visible = true; const a = i * 1.25 + t * 0.9; f.position.set(AX + Math.cos(a) * 1.4, 1.6 + Math.sin(a * 1.3) * 0.4, -2.0 + Math.sin(a) * 0.4); f.rotation.z = Math.sin(t * 2 + i) * 0.4; });
  tBorn.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBorn.visible = false; tArt.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-1.2, 0.2, u), 1.8, lerp(3.2, 2.8, u), AX + lerp(-1.8, 0, u), 1.2, -2.4, 58);
  return qs;
}
function shotPractice(t) { // 3段目 17〜25：板の間に響く、厳しい稽古の声。扇子ひとつで、何度も同じ動き
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.25;
  const ph = (t * 0.9) % 1; const sw = Math.sin(ph * Math.PI * 2);
  boy3.rotation.y = sw * 0.5; boy3.userData.arms[1].rotation.x = -1.6 - sw * 0.6; boy3.userData.arms[1].rotation.z = 0.3; boy3.userData.arms[0].rotation.x = -0.4;
  FAN3.visible = true; FAN3.position.set(BX - 0.2 + Math.cos(boy3.rotation.y) * 0.25, 1.75 + sw * 0.25, -1.6 + 0.35); FAN3.rotation.set(0, boy3.rotation.y, sw * 0.5);
  head3.userData.arms[0].rotation.x = t > 1.5 && t < 3 ? -1.2 : -0.3;
  if (t > 4.2) GHOST.forEach((g, i) => { g.visible = true; g.rotation.y = Math.sin((ph - (i + 1) * 0.08) * Math.PI * 2) * 0.5; g.userData.arms[1].rotation.x = -1.6 - Math.sin((ph - (i + 1) * 0.08) * Math.PI * 2) * 0.6; });
  tPractice.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPractice.visible = false; tFan.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0.3, u), 1.5, lerp(3.0, 2.5, u), BX, 1.1, -1.8, 58);
  return qs;
}
function shotRivals(t) { // 4段目 25〜33：当主の実の息子は、生まれながらの跡取り。血筋と才能、正反対のふたりはライバルに
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.5, '#06070a');
  SPOTR.intensity = 30; SPOTL.intensity = t > 4.2 ? 30 : 4;
  young4.userData.arms[1].rotation.x = t > 4.2 ? -1.4 : 0; heir4.userData.arms[0].rotation.x = t > 4.2 ? -1.4 : 0;
  if (t > 4.4) SPARK.forEach((s, i) => { s.visible = true; const a = i * 0.5 + t * 2; s.position.set(CX + Math.sin(a) * 0.25, 1.3 + (i % 7) * 0.2, -1.8 + Math.cos(a) * 0.2); });
  tHeir.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHeir.visible = false; tRival.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(CX + 1.6, 1.8, 2.6, CX + 0.6, 1.5, -1.9, 56);
  else look(CX, lerp(1.7, 1.6, u), lerp(3.4, 3.0, u), CX, 1.4, -1.8, 56);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2025年の日本映画。上映時間は約3時間。実写の日本映画で、興行収入の歴代1位
  base(); S.aim(TX, -1); lift(0); S.hemi.intensity = 0.6; S.darken(0.6, '#06070a');
  CLOCK.userData.hand.parent.rotation.z = -t * 1.2;
  t2025.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2025.visible = false; tRecord.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, lerp(2.6, 2.9, u), lerp(5.6, 5.0, u), TX, 2.6, -4.0, 60);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：歌舞伎の世界で、女形として舞台に立つ。タイトルは、漢字2文字
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.0; S.darken(0.4, '#0a0606');
  const k = ease(clamp(t / 2.4)); CURTAIN.position.x = DX - k * 9.0;
  onna.rotation.y = Math.sin(t * 1.2) * 0.4; onna.userData.arms[1].rotation.x = -2.0 + Math.sin(t * 1.6) * 0.3; onna.userData.arms[1].rotation.z = 0.2; onna.userData.head.rotation.z = Math.sin(t * 1.2) * 0.15;
  FAN6.visible = true; FAN6.position.set(DX + 0.33 * Math.cos(onna.rotation.y), 2.75 + Math.sin(t * 1.6) * 0.12, -3.2); FAN6.rotation.set(0, onna.rotation.y, Math.sin(t * 1.6) * 0.3);
  PETALS.forEach((p, i) => { p.visible = k > 0.3; const y = 5 - ((t * 0.6 + i * 0.23) % 1) * 4.6; p.position.set(DX - 2.2 + (i % 11) * 0.44, y, -2.6 - (i % 3) * 0.4); p.rotation.set(t * 2 + i, t + i, 0); });
  tKabuki.userData.pop((t - 1.0) / 0.35); if (t > 3.2) tKabuki.visible = false; tKanji.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX, lerp(2.0, 2.1, u), lerp(4.2, 3.4, u), DX, 2.1, -3.4, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（門の前に戻る）
  shotGate(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.75, 0.5, d); S.darken(0.2 + 0.3 * d, '#06070a');
  const k = ease(t / 7);
  look(lerp(-0.4, -0.3, k), 1.7, lerp(2.3, 1.9, k), -0.1, 1.0, -2.2, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotGate(t, 0) },
  { a: 9, b: 17, f: shotHall },
  { a: 17, b: 25, f: shotPractice },
  { a: 25, b: 33, f: shotRivals },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '抗争で父を亡くした、<br>ひとりの少年。'],
  [5.6, 9.0, 'ある名門の当主が、<br>少年を引き取った。'],
  [9.2, 13.2, '少年が生まれたのは、<br>任侠の一門。'],
  [13.2, 17.0, '飛び込んだのは、<br>芸の世界。'],
  [17.2, 21.0, '板の間に響く、<br>厳しい稽古の声。'],
  [21.0, 25.0, '扇子ひとつで、<br>何度も同じ動き。'],
  [25.2, 29.0, '当主の実の息子は、<br>生まれながらの跡取り。'],
  [29.0, 33.0, '血筋と才能。正反対の<br>ふたりはライバルに。'],
  [33.2, 37.4, '2025年の日本映画。<br>上映時間は約3時間。'],
  [37.4, 41.8, '実写の日本映画で、<br>興行収入の歴代1位。'],
  [42.2, 45.4, '歌舞伎の舞台に、<br>女形として立つ。'],
  [45.4, 49.0, 'タイトルは、<br>漢字2文字。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>国宝。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q076', v2: true, answer: '国宝',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 7676,
    hits: [2.0, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '抗争': 'こうそう', '父': 'ちち', '亡くした': 'なくした', '少年': 'しょうねん', '名門': 'めいもん', '当主': 'とうしゅ', '引き取った': 'ひきとった', '生まれた': 'うまれた', '任侠': 'にんきょう', '一門': 'いちもん', '飛び込んだ': 'とびこんだ', '芸': 'げい', '世界': 'せかい', '板の間': 'いたのま', '響く': 'ひびく', '厳しい': 'きびしい', '稽古': 'けいこ', '声': 'こえ', '扇子': 'せんす', '何度も': 'なんども', '同じ': 'おなじ', '動き': 'うごき', '実の': 'じつの', '息子': 'むすこ', '生まれながら': 'うまれながら', '跡取り': 'あととり', '血筋': 'ちすじ', '才能': 'さいのう', '正反対': 'せいはんたい', '2025年': 'にせんにじゅうごねん', '日本映画': 'にほんえいが', '上映時間': 'じょうえいじかん', '約3時間': 'やくさんじかん', '実写': 'じっしゃ', '興行収入': 'こうぎょうしゅうにゅう', '歴代1位': 'れきだいいちい', '歌舞伎': 'かぶき', '舞台': 'ぶたい', '女形': 'おんながた', '立つ': 'たつ', '漢字2文字': 'かんじにもじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '国宝': 'こくほう', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n抗争で父を亡くした、ひとりの少年。ある名門の当主が、少年を引き取った。飛び込んだのは、芸の世界。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'アマプラ', '邦画', '映画好き'],
  },
});
applyQuizCards({ answer: '国宝', info: 'Prime Video｜日本映画・175分', answerSize: 160 });
