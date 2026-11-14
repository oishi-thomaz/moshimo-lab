import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #088 ルックバック（アニメ映画・日本・2024年6月28日公開・58分。Prime Video・Disney+・Netflix・Hulu・U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/look-back で2026/11/14確認（Filmarks の動画配信欄も Prime Video・ディズニープラス ほか）。
//   Filmarks 4.1・レビュー192,336件 filmarks.com/movies/114872）
// 今話題：是枝裕和監督の実写映画「ルックバック」が2026年9月11日公開（Filmarks filmarks.com/movies/126181、2026/11/14確認）
// 確かめた事実（公式 lookback-anime.com の INTRODUCTION・STORY、Filmarks の作品紹介。2026/11/14）：
//   ・学年新聞で4コマ漫画を連載している小学4年生の主人公。クラスメートから絶賛され、自分の画力に絶対の自信を持つ（公式）
//   ・ある日の学年新聞に、不登校の同級生の4コマ漫画が初めて載り、その画力の高さに驚く（公式）
//   ・以来、わき目も振らずひたすら漫画を描き続けるが、画力の差は一向に縮まらない（公式）
//   ・小学校の卒業の日、卒業証書を届けに行った家で、その同級生と初めて会う。ふたりは一緒に漫画を描き始める（公式）
//   ・原作は「チェンソーマン」などの藤本タツキ。2021年に少年ジャンプ＋で公開（公式）。劇場アニメ、58分（Filmarks）
// 構成（ヒント6段）：1 学年新聞の4コマでクラスの人気者・ある日自分よりずっとうまい絵が載った → 2 主人公は漫画を描く小学4年生の女の子・追いつきたくてひたすら描く
//   → 3 季節がめぐっても机に向かう毎日・差はちっとも縮まらない → 4 卒業の日、あの子と初めて会う・ふたりで漫画を描きはじめる
//   → 5 2024年公開の日本のアニメ映画・58分 → 6 決め手：原作はチェンソーマンの作者の漫画・2026年に実写映画にもなった
// 後半の出来事（公式が伏せている事件）・結末は言わない。人物名・地名は出さない。作品の絵・ポスター・ロゴ・有名な場面の構図（背中越しの机など）は使わない。人は汎用の3D

const S = quizStage({ bg: '#2a2e3a', floor: '#3a3a40', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8888);

const FUJI = { skin: '#f4d3b5', hair: '#6b4a33', shirt: '#e88a5a', pants: '#3b4a6a', long: true, skirt: true, scale: 0.72 };
const KYO = { skin: '#f6dcc4', hair: '#2c2421', shirt: '#b8c8a8', pants: '#5a5a6a', long: true, skirt: true, scale: 0.72 };
const KID = (i) => ({ skin: ['#f1c9a5', '#f4d3b5', '#e8b98f'][i % 3], hair: ['#1d1a19', '#4a3426', '#2c2421'][i % 3], shirt: ['#4fa3d1', '#f2c14e', '#5d8c3a', '#c94f7c', '#8e6bbf'][i % 5], pants: '#2b3346', long: i % 2 === 1, skirt: i % 2 === 1, scale: 0.7 });

// 4コマの紙（中身は形だけの落書き。fine=true は細かくうまい絵）
function koma(fine) { return canvasTex(160, 420, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#222'; g.lineWidth = 3;
  for (let i = 0; i < 4; i++) { const y = 10 + i * 102; g.strokeRect(10, y, w - 20, 94);
    if (!fine) { g.beginPath(); g.arc(50 + i * 12, y + 50, 16, 0, 7); g.stroke(); g.beginPath(); g.moveTo(80, y + 70); g.lineTo(130, y + 30); g.stroke(); }
    else { for (let k = 0; k < 18; k++) { g.lineWidth = 1; g.beginPath(); g.moveTo(14, y + 8 + k * 5); g.lineTo(w - 14, y + 4 + k * 5 + (k % 3)); g.stroke(); }
      g.fillStyle = '#555'; g.fillRect(30 + i * 8, y + 40, 30, 46); g.fillRect(90, y + 24, 40, 62); g.lineWidth = 3; } } }); }
function paper(fine) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.5), new THREE.MeshBasicMaterial({ map: koma(fine) })); return m; }
function desk(x, z, col = '#a8885a', withLamp = true) { const g = new THREE.Group(); const t = box(1.1, 0.05, 0.6, mat(col)); t.position.y = 0.6; g.add(t); for (const sx of [-0.5, 0.5]) for (const sz of [-0.25, 0.25]) { const l = box(0.04, 0.6, 0.04, mat('#5a4a3a')); l.position.set(sx, 0.3, sz); g.add(l); }
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe0a0', side: THREE.DoubleSide })); lamp.position.set(0.4, 0.95, -0.15); const ar = box(0.02, 0.35, 0.02, mat('#3a3a40')); ar.position.set(0.4, 0.78, -0.2); if (withLamp) { g.add(lamp); g.add(ar); }
  g.position.set(x, 0, z); qs.add(g); return g; }
function sitAt(p) { p.userData.legs.forEach(l => l.rotation.x = -1.45); }

// ---------- 1段目. 教室のうしろの掲示板（x=0）。人気の4コマ → となりにずっとうまい4コマ ----------
{ const fl = box(12, 0.04, 8, mat('#b8986a')); fl.position.set(0, 0.02, -1.5); qs.add(fl);
  const wl = box(12, 4, 0.2, mat('#e8e0cc')); wl.position.set(0, 2, -3.6); qs.add(wl);
  const bd = box(3.4, 1.8, 0.06, mat('#8a6a3a')); bd.position.set(0, 1.9, -3.48); qs.add(bd);
  const cork = box(3.2, 1.6, 0.04, mat('#c89a5a')); cork.position.set(0, 1.9, -3.44); qs.add(cork);
  for (let i = 0; i < 3; i++) { const d = desk(-3 + i * 3, -0.2, '#c8a878', false); d.scale.setScalar(0.9); } }
const NEWS1 = paper(false); NEWS1.position.set(-0.55, 1.9, -3.4); NEWS1.scale.setScalar(0.9); qs.add(NEWS1);
const NEWS2 = paper(true); NEWS2.position.set(0.55, 1.9, -3.4); NEWS2.scale.setScalar(0.9); qs.add(NEWS2);
const fuji1 = makePerson(FUJI); fuji1.position.set(-0.3, 0, -2.3); qs.add(fuji1);
const KIDS1 = []; for (let i = 0; i < 5; i++) { const p = makePerson(KID(i)); p.position.set(-1.6 + i * 0.75 + (i > 1 ? 0.5 : 0), 0, -1.5 - (i % 2) * 0.3); p.rotation.y = Math.PI * 0.9 + (i - 2) * 0.1; qs.add(p); KIDS1.push(p); }
const CLAP1 = []; for (let i = 0; i < 6; i++) { const s = tag('★', { size: 80, w: 110, h: 110, bg: 'rgba(0,0,0,0)', color: '#f2c14e', sx: 0.26 }); qs.add(s); CLAP1.push(s); }
const SHOCK1 = tag('！', { size: 110, w: 140, h: 140, bg: '#c8202c', sx: 0.4 }); qs.add(SHOCK1);
const tStar = tag('4コマで、人気者', { size: 60, w: 520, bg: '#14161c', sx: 1.7 }); tStar.position.set(0, 3.25, -2.6); qs.add(tStar);
const tBetter = tag('ずっと、うまい絵', { size: 60, w: 520, bg: '#c8202c', sx: 1.7 }); tBetter.position.set(0, 3.25, -2.6); qs.add(tBetter);

// ---------- 2段目. 夜の子ども部屋（x=40）。机でひたすら描く女の子、積み上がる紙 ----------
const AX = 40;
{ const fl = box(8, 0.04, 6, mat('#9a7a5a')); fl.position.set(AX, 0.02, -1.5); qs.add(fl);
  const wl = box(8, 4, 0.2, mat('#d8c8b0')); wl.position.set(AX, 2, -3.2); qs.add(wl);
  const win = box(1.4, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#1a2448' })); win.position.set(AX - 1.6, 2.2, -3.08); qs.add(win);
  const bed = box(1.4, 0.4, 2.0, mat('#e8a0a8')); bed.position.set(AX + 2.4, 0.2, -2.0); qs.add(bed); }
const DESK2 = desk(AX, -2.4);
const fuji2 = makePerson(FUJI); fuji2.position.set(AX, -0.05, -1.95); fuji2.rotation.y = Math.PI; sitAt(fuji2); qs.add(fuji2);
const PILE2 = []; for (let i = 0; i < 30; i++) { const p = box(0.4, 0.012, 0.55, mat(i % 2 ? '#fbf8f0' : '#f0ece0')); p.position.set(AX - 1.0 + (i % 3 === 0 ? 0.01 : 0), 0.04 + i * 0.016, -2.2 + (i % 2) * 0.01); p.rotation.y = (R() - 0.5) * 0.2; qs.add(p); PILE2.push(p); }
const PEN2 = box(0.015, 0.015, 0.2, mat('#2a2a2e')); qs.add(PEN2);
const tGirl = tag('漫画を描く、小学4年生', { size: 54, w: 660, bg: '#14161c', sx: 2.0 }); tGirl.position.set(AX - 0.4, 2.7, -2.4); qs.add(tGirl);
const tDraw = tag('ひたすら、描き続ける', { size: 56, w: 640, bg: '#e88a5a', sx: 2.0 }); tDraw.position.set(AX - 0.4, 2.7, -2.4); qs.add(tDraw);

// ---------- 3段目. めぐる季節の窓辺（x=80）。窓の外が 緑→夕焼け色→雪 に変わる。2本のグラフの差は縮まらない ----------
const BX = 80;
{ const fl = box(8, 0.04, 6, mat('#9a7a5a')); fl.position.set(BX, 0.02, -1.5); qs.add(fl);
  const wl = box(8, 4.4, 0.2, mat('#d8c8b0')); wl.position.set(BX, 2.2, -3.2); qs.add(wl); }
const WIN3 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ color: '#7ab060' })); WIN3.position.set(BX, 2.4, -3.08); qs.add(WIN3);
{ const fr = box(2.6, 0.1, 0.1, mat('#f4f0e8')); fr.position.set(BX, 2.4, -3.04); qs.add(fr); const fr2 = box(0.1, 1.7, 0.1, mat('#f4f0e8')); fr2.position.set(BX, 2.4, -3.04); qs.add(fr2); }
const FLAKES3 = []; for (let i = 0; i < 24; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); f.userData = { x: (R() - 0.5) * 2.2, o: R() }; qs.add(f); FLAKES3.push(f); }
desk(BX, -2.5);
const fuji3 = makePerson({ ...FUJI, scale: 0.8 }); fuji3.position.set(BX, -0.05, -2.05); fuji3.rotation.y = Math.PI; sitAt(fuji3); qs.add(fuji3);
const BARS3 = []; [['#e88a5a', -0.35], ['#6a8a5a', 0.35]].forEach(([c, x]) => { const b = box(0.4, 1, 0.1, new THREE.MeshBasicMaterial({ color: c })); b.position.set(BX + 1.25 + x * 0.8, 0, -2.4); b.scale.x = 0.8; qs.add(b); BARS3.push(b); });
const tSeason = tag('季節がめぐっても', { size: 60, w: 540, bg: '#14161c', sx: 1.9 }); tSeason.position.set(BX - 0.2, 3.65, -2.4); qs.add(tSeason);
const tGap = tag('差は、縮まらない', { size: 60, w: 540, bg: '#4a6a8a', sx: 1.9 }); tGap.position.set(BX - 0.2, 3.65, -2.4); qs.add(tGap);

// ---------- 4段目. 雪の日の玄関（x=120）。筒を持って訪ねる → 2つの机を並べて描くふたり ----------
const CX = 120;
{ const gr = box(14, 0.04, 10, mat('#e8eef4')); gr.position.set(CX, 0.02, -2); qs.add(gr);
  const hs = box(5, 3.6, 3, mat('#c8b8a0')); hs.position.set(CX - 1.8, 1.8, -5.4); qs.add(hs);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.6, 4), mat('#f4f6fa')); rf.rotation.y = Math.PI / 4; rf.position.set(CX - 1.8, 4.4, -5.4); qs.add(rf);
  const dr = box(0.9, 1.8, 0.06, mat('#6a4a30')); dr.position.set(CX - 1.2, 0.9, -3.88); qs.add(dr);
  const rm = box(5, 0.04, 3.4, mat('#a8885a')); rm.position.set(CX + 2.6, 0.03, -2.6); qs.add(rm); }
const fuji4 = makePerson(FUJI); fuji4.position.set(CX, 0, -2.8); qs.add(fuji4);
const TUBE4 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), mat('#2a4a8a')); TUBE4.rotation.z = Math.PI / 2; TUBE4.position.set(0.3, 0.55, 0.15); fuji4.add(TUBE4);
const kyo4 = makePerson(KYO); kyo4.position.set(CX - 1.2, 0, -3.6); qs.add(kyo4);
const HEART4 = tag('！', { size: 100, w: 130, h: 130, bg: '#e88a5a', sx: 0.36 }); qs.add(HEART4);
const DESKS4 = [desk(CX + 2.0, -2.8), desk(CX + 3.2, -2.8)];
const SNOW4 = []; for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); d.userData = { x: CX - 3 + R() * 6, z: -1 - R() * 4, o: R() }; qs.add(d); SNOW4.push(d); }
const tMeet = tag('卒業の日、初めて会う', { size: 56, w: 620, bg: '#14161c', sx: 2.0 }); tMeet.position.set(CX - 0.7, 2.3, -2.8); qs.add(tMeet);
const tTwo = tag('ふたりで、描きはじめる', { size: 56, w: 640, bg: '#e88a5a', sx: 2.0 }); tTwo.position.set(CX + 2.6, 2.0, -1.4); qs.add(tTwo);

// ---------- 5段目. 映画館（x=180）。2024年の日本のアニメ映画・58分 ----------
const TX = 180;
{ const fl = box(12, 0.04, 12, mat('#1a1a24')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 7, 0.2, mat('#101018')); wl.position.set(TX, 3.5, -5); qs.add(wl);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const st = box(0.7, 0.6, 0.6, mat('#6a2a3a')); st.position.set(TX - 2.1 + i * 0.85, 0.3 + r * 0.2, 1.2 + r * 1.1); qs.add(st); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(600, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2c8a0'); gr.addColorStop(1, '#8ab0d8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#2a2a3a'; g.lineWidth = 5; for (const x of [150, 330]) { g.strokeRect(x, 70, 120, 200); g.beginPath(); g.moveTo(x, 170); g.lineTo(x + 120, 170); g.stroke(); }
  g.fillStyle = '#2a2a3a'; g.beginPath(); g.arc(460, 180, 18, 0, 7); g.fill(); g.fillRect(445, 198, 30, 70); g.beginPath(); g.arc(520, 186, 16, 0, 7); g.fill(); g.fillRect(506, 202, 28, 66); }) }));
SCREEN5.position.set(TX, 3.0, -4.88); qs.add(SCREEN5);
const t2024 = tag('2024年 日本のアニメ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.6 }); t2024.position.set(TX, 5.2, -4.0); qs.add(t2024);
const t58 = tag('上映時間 58分', { size: 62, w: 480, bg: '#e88a5a', sx: 2.0 }); t58.position.set(TX, 5.2, -4.0); qs.add(t58);

// ---------- 6段目. 本棚とカチンコ（x=220）。原作は人気漫画家の漫画、実写映画にも ----------
const DX = 220;
{ const fl = box(12, 0.04, 10, mat('#2a2420')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a302a')); wl.position.set(DX, 3, -4); qs.add(wl); }
const BOOKS6 = []; for (let i = 0; i < 12; i++) { const b = box(0.16, 1.0, 0.7, mat(['#c8202c', '#f2c14e', '#2a4a8a', '#f4f0e8', '#3f8f6b'][i % 5])); b.userData.x = DX - 1.6 + i * 0.18; b.position.set(b.userData.x, 0.5, -3.0); qs.add(b); BOOKS6.push(b); }
const OPEN6 = new THREE.Group(); OPEN6.position.set(DX - 0.6, 1.8, -2.2); qs.add(OPEN6);
for (const s of [-1, 1]) { const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshBasicMaterial({ map: koma(s > 0), side: THREE.DoubleSide })); pg.position.x = s * 0.41; pg.rotation.y = -s * 0.25; OPEN6.add(pg); }
const CLAPB = new THREE.Group(); { const b = box(1.0, 0.7, 0.06, mat('#1a1a1e')); CLAPB.add(b); for (let i = 0; i < 4; i++) { const ln = box(0.8, 0.03, 0.01, new THREE.MeshBasicMaterial({ color: '#f4f0e8' })); ln.position.set(0, 0.2 - i * 0.15, 0.04); CLAPB.add(ln); }
  const top = new THREE.Group(); top.position.set(-0.5, 0.38, 0); const tb = box(1.0, 0.14, 0.06, new THREE.MeshBasicMaterial({ map: canvasTex(200, 28, (g, w, h) => { for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#f4f0e8' : '#1a1a1e'; g.fillRect(i * 20, 0, 20, h); } }) })); tb.position.x = 0.5; top.add(tb); CLAPB.add(top); CLAPB.userData.top = top; }
CLAPB.position.set(DX + 1.0, 1.7, -2.0); qs.add(CLAPB);
const tAuthor = tag('原作は、あの人気漫画家', { size: 54, w: 680, bg: '#14161c', sx: 2.2 }); tAuthor.position.set(DX, 3.3, -2.0); qs.add(tAuthor);
const tLive = tag('2026年、実写映画にも', { size: 56, w: 660, bg: '#c8202c', sx: 2.2 }); tLive.position.set(DX, 3.3, -2.0); qs.add(tLive);

// ---------- shots ----------
const ALL = [tStar, tBetter, tGirl, tDraw, tSeason, tGap, tMeet, tTwo, t2024, t58, tAuthor, tLive];
function base() { S.reset(); ALL.forEach(x => x.visible = false); CLAP1.forEach(s => s.visible = false); SHOCK1.visible = false; HEART4.visible = false; }

function shotBoard(t, quiz = 0) { // 1段目 0〜9：学年新聞の4コマ漫画で、クラスの人気者。ある日、自分よりずっとうまい絵が載った（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.1; S.darken(0.05);
  const sh = quiz ? 1 : clamp((t - 4.2) / 0.4);
  NEWS2.visible = true; NEWS2.scale.setScalar(0.9 * (quiz ? 1 : (t < 4.2 ? 1 : 1 + 0.1 * Math.sin(clamp((t - 4.2) / 0.6) * Math.PI))));
  KIDS1.forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = sh < 1 ? -2.6 + Math.sin(t * 8 + i) * 0.3 : -0.3); p.rotation.y = sh < 1 ? Math.PI * 0.9 + (i - 2) * 0.1 : Math.PI + (i - 2) * 0.15; });
  fuji1.rotation.y = sh < 1 ? Math.PI * 0.1 : Math.PI; fuji1.userData.arms[1].rotation.x = sh < 1 ? -2.4 : -0.2; fuji1.userData.head.rotation.x = sh < 1 ? -0.1 : -0.2;
  if (sh >= 1) fuji1.position.z = -2.3 - 0.2 * clamp((t - 4.4) / 0.5); else fuji1.position.z = -2.3;
  CLAP1.forEach((s, i) => { s.visible = sh < 1; s.userData.pop(1); const a = t * 2 + i; s.position.set(-0.3 + Math.cos(a) * 0.5, 1.5 + Math.sin(a * 1.3) * 0.2, -2.0); });
  SHOCK1.position.set(-0.3, 1.55, -2.1); if (sh >= 1) SHOCK1.userData.pop(quiz ? 1 : (t - 4.4) / 0.3);
  if (!quiz) { tStar.userData.pop((t - 0.6) / 0.35); if (t > 4.1) tStar.visible = false; tBetter.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.4, 0.2, u), lerp(1.8, 2.0, u), lerp(1.8, 1.3, u), lerp(-0.2, 0.3, u), 1.7, -3.4, 62);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：主人公は、漫画を描く小学4年生の女の子。追いつきたくて、ひたすら描き続ける
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#0a0c18');
  const n = Math.floor(clamp(t / 7.6) * PILE2.length); PILE2.forEach((p, i) => p.visible = i < 6 + n);
  fuji2.userData.arms[1].rotation.x = -1.2 + Math.sin(t * 14) * 0.08; fuji2.userData.arms[0].rotation.x = -1.0; fuji2.userData.head.rotation.x = 0.4;
  PEN2.position.set(AX + 0.15 + Math.sin(t * 14) * 0.04, 0.66, -2.35); PEN2.rotation.y = 0.6;
  tGirl.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGirl.visible = false; tDraw.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-1.6, -1.1, u), lerp(2.0, 2.1, u), lerp(2.2, 1.8, u), AX - 0.2, 1.1, -2.4, 62);
  return qs;
}
function shotSeasons(t) { // 3段目 17〜25：季節がめぐっても、机に向かう毎日。それでも差は、ちっとも縮まらない
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 0.9; S.darken(0.15, '#1a1410');
  const c = t < 2.6 ? '#7ab060' : t < 5.2 ? '#e8945a' : '#c8d4e4'; WIN3.material.color.set(c);
  FLAKES3.forEach(f => { f.visible = t >= 5.2; const k = (t * 0.4 + f.userData.o) % 1; f.position.set(BX + f.userData.x, 3.15 - k * 1.5, -3.05); });
  fuji3.userData.arms.forEach((a, i) => a.rotation.x = -1.2 + (i ? Math.sin(t * 12) * 0.08 : 0)); fuji3.userData.head.rotation.x = t > 5.0 ? 0.6 : 0.35;
  const g = clamp((t - 3.8) / 3.6); BARS3[0].scale.y = 0.3 + g * 1.0; BARS3[1].scale.y = 1.0 + g * 1.0; BARS3.forEach(b => { b.position.y = b.scale.y / 2; b.visible = t > 3.8; });
  tSeason.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSeason.visible = false; tGap.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.2, 0.6, u), lerp(2.2, 2.3, u), lerp(2.6, 2.2, u), BX + 0.4, 1.8, -2.6, 62);
  return qs;
}
function shotMeet(t) { // 4段目 25〜33：卒業の日、絵のうまいあの子と初めて会う。ふたりで、漫画を描きはじめる
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 1.0; S.darken(0.2, '#c8d4e4');
  SNOW4.forEach(d => { d.visible = t < 4.0; const k = (t * 0.3 + d.userData.o) % 1; d.position.set(d.userData.x, 4 - k * 4, d.userData.z); });
  if (t < 4.0) { fuji4.visible = true; kyo4.visible = t > 1.4; TUBE4.visible = true;
    fuji4.position.set(CX - 0.2, 0, -3.0); fuji4.rotation.y = -Math.PI / 2 - 0.4; poseWalk(fuji4, 0, 0);
    kyo4.position.set(CX - 1.2, 0, -3.5); kyo4.rotation.y = Math.PI / 2 - 0.3; kyo4.userData.arms.forEach(a => a.rotation.x = -0.6);
    if (t > 1.6) { HEART4.position.set(CX - 0.2, 1.55, -3.0); HEART4.userData.pop((t - 1.7) / 0.3); }
    tMeet.userData.pop((t - 0.5) / 0.35);
    const u = ease(t / 4); look(CX + lerp(-0.4, -0.6, u), 1.6, lerp(1.0, 0.6, u), CX - 0.7, 0.9, -3.3, 60);
  } else { TUBE4.visible = false;
    [fuji4, kyo4].forEach((p, i) => { p.visible = true; p.position.set(CX + 2.0 + i * 1.2, -0.05, -2.35); p.rotation.y = Math.PI; sitAt(p); p.userData.head.rotation.x = 0.4; p.userData.arms.forEach((a, k) => a.rotation.x = -1.2 + (k ? Math.sin(t * 12 + i) * 0.08 : 0)); });
    if (t > 5.4) { kyo4.userData.head.rotation.y = -0.6; fuji4.userData.head.rotation.y = 0.6; kyo4.userData.head.rotation.x = 0; fuji4.userData.head.rotation.x = 0; }
    tTwo.userData.pop((t - 4.2) / 0.35);
    const u = ease((t - 4) / 4); look(CX + 2.6 + lerp(-0.6, 0.2, u), 1.6, lerp(-5.6, -5.2, u), CX + 2.6, 1.2, -2.4, 62);
  }
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2024年公開の、日本のアニメ映画。上映時間は、58分
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#06060a');
  t2024.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2024.visible = false; t58.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.9, u), lerp(4.8, 3.8, u), TX, 3.2, -4.8, 62);
  return qs;
}
function shotSource(t) { // 6段目 42〜49（決め手）：原作は、チェンソーマンの作者の漫画。2026年には、実写映画にもなった
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.4, '#0a0806');
  OPEN6.rotation.y = Math.sin(t * 0.8) * 0.15; OPEN6.position.y = 1.8 + Math.sin(t * 1.5) * 0.05;
  const c = t > 3.6 ? clamp((t - 3.6) / 0.3) : 0; CLAPB.userData.top.rotation.z = t > 3.6 && t < 4.2 ? 0.5 * (1 - c) : (t <= 3.6 ? 0.5 : 0);
  CLAPB.scale.setScalar(t > 3.4 ? 1 : 0.001);
  tAuthor.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tAuthor.visible = false; tLive.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.3, 0.3, u), 2.1, lerp(2.8, 2.4, u), DX + 0.1, 1.7, -2.4, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の部屋に戻る）
  shotRoom(6.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.7, 0.5, d); S.darken(0.3 + 0.25 * d, '#06081a');
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotBoard(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotSeasons },
  { a: 25, b: 33, f: shotMeet },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotSource },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '学年新聞の4コマ漫画で、<br>クラスの人気者。'],
  [5.6, 9.0, 'ある日、自分より<br>ずっとうまい絵が載った。'],
  [9.2, 13.2, '主人公は、漫画を描く<br>小学4年生の女の子。'],
  [13.2, 17.0, '追いつきたくて、<br>ひたすら描き続ける。'],
  [17.2, 21.0, '季節がめぐっても、<br>机に向かう毎日。'],
  [21.0, 25.0, 'それでも差は、<br>ちっとも縮まらない。'],
  [25.2, 29.0, '卒業の日、絵のうまい<br>あの子と初めて会う。'],
  [29.0, 33.0, 'ふたりで、<br>漫画を描きはじめる。'],
  [33.2, 37.4, '2024年公開の、<br>日本のアニメ映画。'],
  [37.4, 41.8, '上映時間は、<br>58分。'],
  [42.2, 45.4, '原作は、チェンソーマンの<br>作者の漫画。'],
  [45.4, 49.0, '2026年には、<br>実写映画にもなった。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ルックバック。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q088', v2: true, answer: 'ルックバック',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 8888,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '学年新聞': 'がくねんしんぶん', '4コマ漫画': 'よんコマまんが', '人気者': 'にんきもの', '自分': 'じぶん', '載った': 'のった', '主人公': 'しゅじんこう', '漫画': 'まんが', '描く': 'かく', '小学4年生': 'しょうがくよねんせい', '女の子': 'おんなのこ', '追いつきたくて': 'おいつきたくて', '描き続ける': 'かきつづける', '季節': 'きせつ', '机': 'つくえ', '向かう': 'むかう', '毎日': 'まいにち', '差は': 'さは', '縮まらない': 'ちぢまらない', '卒業': 'そつぎょう', '初めて': 'はじめて', '会う': 'あう', '描きはじめる': 'かきはじめる', '2024年': 'にせんにじゅうよねん', '公開': 'こうかい', '日本': 'にほん', '映画': 'えいが', '上映時間': 'じょうえいじかん', '58分': 'ごじゅうはっぷん', '原作': 'げんさく', '作者': 'さくしゃ', '2026年': 'にせんにじゅうろくねん', '実写': 'じっしゃ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n学年新聞の4コマ漫画で、クラスの人気者。ある日、自分よりずっとうまい絵が載った。主人公は、漫画を描く小学4年生の女の子。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'ディズニープラス', 'アニメ映画', '映画好き'],
  },
});
applyQuizCards({ answer: 'ルックバック', info: 'Prime Video・Disney+｜アニメ映画・58分', answerSize: 124 });
