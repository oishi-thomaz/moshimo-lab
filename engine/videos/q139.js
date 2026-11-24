import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #139 ハイキュー!!（アニメ・日本・2014年4月〜。Netflix・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/haikyu-2014（見放題：Netflix・Hulu・U-NEXT・Prime Video・FOD・Disney Plus）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・DMM TV・Lemino・ABEMA・Hulu・Netflix 見放題。2026年10月更新）で2026/11/24確認。
//   Filmarks 4.4・レビュー44,762件 filmarks.com/animes/860/632）
// 確かめた事実（2026/11/24）：
//   ・Netflix 作品ページ netflix.com/jp/title/80090673 ：小柄な少年と仲間が青春を燃やすスポーツアニメ。想いをのせてボールを繋ぐ。
//     第1話：部員がいない逆風にも負けずやっとの思いでメンバーを集め、最初で最後の公式戦に出場。だが彼の前に「コート上の王様」が立ちはだかる。
//     第2話：入学した高校の体育館で、主人公は奇しくもその天才と再会。衝突の絶えない2人。第5話：天性のスピードとバネを持つ主人公
//   ・JustWatch 日本版の紹介文：ふとしたきっかけでバレーボールに魅せられた少年。中学最初で最後の公式戦で、「コート上の王様」と異名をとる天才に惨敗。
//     リベンジを誓い高校のバレー部の門を叩いたが、そこにはライバルの姿が
//   ・少年ジャンプ公式サイト shonenjump.com/j/rensai/haikyu.html ：週刊少年ジャンプで2012年12号から連載。劇的青春バレーボール物語
//   ・Filmarks：2014年製作・公開日 2014年04月06日・日本・原作 古舘春一
// 構成（ヒント6段）：1 部活の仲間がひとりもいない・やっと人を集めて最初で最後の大会へ → 2 主人公は小柄な中学生・あるスポーツに心をうばわれた
//   → 3 相手には天才がいた・コート上の王様と呼ばれる天才に完敗 → 4 高校の体育館にあの天才が・ぶつかってばかりの2人が同じチームに
//   → 5 2014年の日本のアニメ・原作は少年ジャンプの漫画 → 6 決め手：小さな体でだれよりも高く跳ぶ・ボールをつないでネットの向こうへ
// 試合の結果・結末は言わない。登場人物の名前・学校名・地名は出さない。俳優・声優の顔、ポスター、ロゴ、アニメの絵や人物のデザイン（髪の色・ユニフォームの色や番号）は使わない。
// 有名な場面の構図はなぞらない。人は汎用の3D。ボールは無地の白い球（5段目まで競技がわからないように）
const S = quizStage({ bg: '#2a2c34', floor: '#3a3a40', fogNear: 22, fogFar: 80 });
const qs = S.scene;
const R = rng(13910);

const BOY = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#e8e8ec', pants: '#2a3a5a', scale: 0.86 };
const TALL = { skin: '#f1c9a5', hair: '#14100c', shirt: '#e8e8ec', pants: '#2a3a5a', scale: 1.1 };
const RIVAL = { skin: '#f1c9a5', hair: '#14100c', shirt: '#3a4a6a', pants: '#2a2a36', scale: 1.1 };
const OPP = { skin: '#e8c0a0', hair: '#1a1410', shirt: '#3a4a6a', pants: '#2a2a36' };
const MATE = [{ skin: '#f1c9a5', hair: '#3a2a20', shirt: '#e8e8ec', pants: '#2a3a5a', scale: 0.9 }, { skin: '#e8c0a0', hair: '#1a1410', shirt: '#e8e8ec', pants: '#2a3a5a', scale: 0.95 }];
const CROWD = ['#8a6a6a', '#6a7a8a', '#8a8a6a', '#5a5a6a', '#9a8a7a'];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function ball() { return new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), mat('#f4f2ec')); }
const FLOORTEX = canvasTex(512, 512, (g) => { g.fillStyle = '#c89a62'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(120,80,40,.35)'; g.lineWidth = 2; for (let i = 0; i < 32; i++) { g.beginPath(); g.moveTo(0, i * 16); g.lineTo(512, i * 16); g.stroke(); }
  g.strokeStyle = '#f0f0f0'; g.lineWidth = 6; g.strokeRect(60, 40, 392, 432); g.beginPath(); g.moveTo(60, 256); g.lineTo(452, 256); g.stroke(); });
function gym(x, z, w = 22, d = 26, wall = '#d8d0c0') {
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: FLOORTEX })); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.03, z); qs.add(fl);
  const bw = box(w, 9, 0.3, mat(wall)); bw.position.set(x, 4.5, z - d / 2); qs.add(bw);
  for (const s of [-1, 1]) { const sw = box(0.3, 9, d, mat(wall)); sw.position.set(x + s * w / 2, 4.5, z); qs.add(sw); }
  for (let i = 0; i < 6; i++) { const wn = box(2.2, 1.6, 0.05, gl('#cfe0f0')); wn.position.set(x - w / 2 + 2 + i * (w - 4) / 5, 6.8, z - d / 2 + 0.2); qs.add(wn); }
  const cl = box(w, 0.3, d, mat('#8a8a90')); cl.position.set(x, 9, z); qs.add(cl);
  for (let i = 0; i < 4; i++) { const lt = box(1.6, 0.1, 0.5, gl('#fffbe8')); lt.position.set(x - 6 + i * 4, 8.8, z); qs.add(lt); }
  const pl = new THREE.PointLight('#fff4e0', 4, 30); pl.position.set(x, 7, z + 2); qs.add(pl); }
function net(x, z, w = 9) { const g = new THREE.Group(); for (const s of [-1, 1]) { const p = box(0.12, 2.6, 0.12, mat('#4a4a50')); p.position.set(s * w / 2, 1.3, 0); g.add(p); }
  const n = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(256, 32, (c) => { c.clearRect(0, 0, 256, 32); c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.5; for (let i = 0; i <= 64; i++) { c.beginPath(); c.moveTo(i * 4, 0); c.lineTo(i * 4, 32); c.stroke(); } for (let j = 0; j <= 8; j++) { c.beginPath(); c.moveTo(0, j * 4); c.lineTo(256, j * 4); c.stroke(); } }), transparent: true, side: THREE.DoubleSide }));
  n.position.y = 2.0; g.add(n); const tp = box(w, 0.08, 0.03, mat('#f0f0f0')); tp.position.y = 2.5; g.add(tp); g.position.set(x, 0, z); qs.add(g); return g; }

// ---------- 1段目. 放課後のがらんとした体育館（x=0）。まん中に小柄な少年がひとり。足もとに白いボール ----------
gym(0, -6);
const BOY1 = person(BOY, 0, -5.2, 0);
const BALL1 = ball(); BALL1.position.set(0.4, 0.13, -4.8); qs.add(BALL1);
const SHADOW1 = []; for (let i = 0; i < 4; i++) { const p = makePerson(MATE[i % 2]); p.position.set(-2.4 + i * 1.6, 0, -6.4); p.visible = false; qs.add(p); SHADOW1.push(p); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tAlone = tag('部活の仲間が、ひとりもいない', { size: 50, w: 800, bg: '#14161c', sx: 1.85 }); qs.add(tAlone);
const tGather = tag('やっと人を集めて、最初で最後の大会へ', { size: 42, w: 900, bg: '#e24050', sx: 2.0 }); qs.add(tGather);

// ---------- 2段目. 夕焼けの校庭（x=50）。小柄な少年が、ぐっとかがんで高く跳ぶ ----------
const AX = 50;
{ const gr = box(40, 0.04, 30, mat('#b89a78')); gr.position.set(AX, 0.02, -8); qs.add(gr);
  const sc = box(20, 6, 4, mat('#d8d0c4')); sc.position.set(AX, 3, -18); qs.add(sc);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const w = box(1.4, 1.0, 0.05, gl('#ffd8a0', 0.8)); w.position.set(AX - 8 + i * 2.3, 2.0 + r * 2.2, -15.95); qs.add(w); }
  for (let i = 0; i < 6; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), mat('#4a6a3a')); tr.position.set(AX - 14 + i * 5.6, 2.6, -13); qs.add(tr); const tk = box(0.3, 1.6, 0.3, mat('#5a4030')); tk.position.set(AX - 14 + i * 5.6, 0.8, -13); qs.add(tk); } }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), new THREE.MeshBasicMaterial({ fog: false, color: '#f0a070' })); SKY2.position.set(AX, 14, -40); qs.add(SKY2);
const BOY2 = person(BOY, AX, -3.4, 0.3);
const tSmall = tag('主人公は、小柄な中学生', { size: 54, w: 680, bg: '#14161c', sx: 1.7 }); qs.add(tSmall);
const tLove = tag('あるスポーツに、心をうばわれた', { size: 48, w: 840, bg: '#e24050', sx: 1.85 }); qs.add(tLove);

// ---------- 3段目. 大会の大きな会場（x=100）。観客席。むこうに背の高い天才。手前でうなだれる少年たち ----------
const BX = 100;
gym(BX, -6, 26, 30, '#b8b4c0');
for (let r = 0; r < 3; r++) for (let i = 0; i < 26; i++) { const c = box(0.4, 0.6, 0.4, mat(CROWD[(i + r) % 5])); c.position.set(BX - 12 + i * 0.95, 3.3 + r * 0.7, -20.4 + r * 0.5); qs.add(c); }
{ const st = box(26, 0.2, 2.4, mat('#6a6470')); st.position.set(BX, 3.0, -20); qs.add(st); }
const NET3 = net(BX, -8);
const KING3 = person(RIVAL, BX + 0.3, -10.6, 0);
const OPP3 = [person(OPP, BX - 2.6, -11.4, 0), person(OPP, BX + 2.8, -11.2, 0), person(OPP, BX - 1.2, -12.4, 0)];
const BOY3 = person(BOY, BX - 0.4, -4.4, Math.PI);
const MATES3 = [person(MATE[0], BX - 1.8, -4.0, Math.PI), person(MATE[1], BX + 1.4, -3.9, Math.PI)];
const SCORE3 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(320, 120, (g) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, 320, 120); g.fillStyle = '#e8e8e8'; g.fillRect(30, 30, 30, 60);
  g.fillStyle = '#e24050'; for (let i = 0; i < 9; i++) g.fillRect(150 + i * 16, 30, 10, 60); }) })); SCORE3.position.set(BX + 6, 6.0, -20.8); qs.add(SCORE3);
const tGenius = tag('相手には、天才がいた', { size: 56, w: 640, bg: '#14161c', sx: 1.6 }); qs.add(tGenius);
const tLose = tag('コート上の王様と呼ばれる天才に、完敗', { size: 42, w: 920, bg: '#e24050', sx: 2.0 }); qs.add(tLose);

// ---------- 4段目. 春の高校の体育館の入口（x=150）。扉をあける少年。中には、あの天才 ----------
const CX = 150;
gym(CX, -8, 22, 22, '#e0d8c8');
{ const dr = box(2.4, 3, 0.2, mat('#7a7a80')); dr.position.set(CX - 3.4, 1.5, 2.6); qs.add(dr); const wl = box(22, 9, 0.3, mat('#e0d8c8')); wl.position.set(CX + 3, 4.5, 3); qs.add(wl); }
const BOY4 = person(BOY, CX - 0.8, -0.6, Math.PI);
const RIV4 = person(RIVAL, CX + 0.8, -6.2, 0);
const BALL4 = ball(); BALL4.position.set(CX, 1, -6); qs.add(BALL4);
const tMeet = tag('高校の体育館に、あの天才が', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tMeet);
const tTeam = tag('ぶつかってばかりの2人が、同じチームに', { size: 42, w: 920, bg: '#e24050', sx: 2.0 }); qs.add(tTeam);

// ---------- 5段目. 夜の部屋（x=200）。机の上に、背表紙が無地の漫画の山と、テレビの光 ----------
const DX = 200;
{ const fl = box(10, 0.04, 8, mat('#4a3e34')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#3a3a48')); wl.position.set(DX, 2, -5); qs.add(wl);
  const tb = box(2.8, 0.1, 1.4, mat('#8a6a4a')); tb.position.set(DX - 0.4, 0.8, -2.6); qs.add(tb); const tl = box(2.6, 0.76, 1.2, mat('#5a4030')); tl.position.set(DX - 0.4, 0.38, -2.6); qs.add(tl);
  const tv = box(1.8, 1.1, 0.12, mat('#101014')); tv.position.set(DX + 1.8, 1.6, -4.6); qs.add(tv); const ts = box(2.0, 0.7, 0.6, mat('#2a2420')); ts.position.set(DX + 1.8, 0.35, -4.6); qs.add(ts); }
const BOOKS5 = []; for (let s = 0; s < 3; s++) for (let i = 0; i < 8 - s * 2; i++) { const b = box(0.42, 0.06, 0.62, mat(['#e86a3a', '#2a2a30', '#e8e8e8', '#3a5a8a'][(i + s) % 4])); b.position.set(DX - 1.2 + s * 0.7, 0.88 + i * 0.065, -2.6); b.rotation.y = Math.sin(i * 1.7 + s) * 0.1; qs.add(b); BOOKS5.push(b); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(256, 144, (g) => { const gr = g.createLinearGradient(0, 0, 0, 144); gr.addColorStop(0, '#6ab0e8'); gr.addColorStop(1, '#e8f0f8'); g.fillStyle = gr; g.fillRect(0, 0, 256, 144);
  g.fillStyle = '#f8f8f0'; g.beginPath(); g.arc(196, 40, 16, 0, 7); g.fill(); }) })); SCR5.position.set(DX + 1.8, 1.6, -4.53); qs.add(SCR5);
const TVL5 = new THREE.PointLight('#a8d0ff', 3, 6); TVL5.position.set(DX + 1.6, 1.8, -3.6); qs.add(TVL5);
const t2014 = tag('2014年の、日本のアニメ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 1.75 }); qs.add(t2014);
const tJump = tag('原作は、少年ジャンプの漫画', { size: 50, w: 760, bg: '#e24050', sx: 1.8 }); qs.add(tJump);

// ---------- 6段目. 試合の体育館（x=250）。ネットの前で、小柄な少年がだれよりも高く跳ぶ。下でボールを上げる背の高い仲間 ----------
const EX = 250;
gym(EX, -6, 24, 28, '#c8c4d0');
const NET6 = net(EX, -6.0);
const BOY6 = person(BOY, EX - 0.4, -4.6, Math.PI);
const SET6 = person(TALL, EX + 1.5, -4.3, -Math.PI / 2 - 0.4);
const BALL6 = ball(); BALL6.position.set(EX, 1, -5); qs.add(BALL6);
const TRAIL6 = []; for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), gl('#fff4c8', 0.6)); qs.add(d); TRAIL6.push(d); }
const OPP6 = [person(OPP, EX - 1.4, -7.6, 0), person(OPP, EX + 0.6, -7.4, 0)];
const tJumpHi = tag('小さな体で、だれよりも高く跳ぶ', { size: 46, w: 860, bg: '#14161c', sx: 1.9 }); qs.add(tJumpHi);
const tConnect = tag('ボールをつないで、ネットの向こうへ', { size: 44, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tConnect);

// ---------- shots ----------
const ALL = [tAlone, tGather, tSmall, tLove, tGenius, tLose, tMeet, tTeam, t2014, tJump, tJumpHi, tConnect, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SKY2.visible = false; TRAIL6.forEach(d => d.visible = false); }
function crouchJump(p, k, h) { const c = k < 0.3 ? Math.sin(k / 0.3 * Math.PI / 2) : 0; p.userData.legs.forEach(l => l.rotation.x = -c * 0.8); p.userData.arms.forEach(a => a.rotation.x = k < 0.3 ? c * 1.2 : -2.8);
  p.position.y = k >= 0.3 ? Math.sin((k - 0.3) / 0.7 * Math.PI) * h : -c * 0.12; }

function shotGym(t, quiz = 0) { // 1段目 0〜9：中学の部活。仲間が、ひとりもいない。何とか人を集めて、最初で最後の大会へ（0秒目がサムネ）
  base(); S.aim(0, -5); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.6;
  BOY1.userData.head.rotation.y = quiz ? 0 : Math.sin(t * 0.9) * 0.5;
  SHADOW1.forEach((p, i) => { p.visible = !quiz && t > 6.0 + i * 0.25; });
  const u = ease(t / 9);
  look(lerp(1.4, 0.8, u), lerp(2.4, 2.0, u), lerp(3.4, 1.6, u), 0, 1.1, -5.6, 62);
  Q1.position.set(0, 2.25, -5.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tAlone, 1.05); pin(tGather, 1.05);
  if (!quiz) { tAlone.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tAlone.visible = false; tGather.userData.pop((t - 5.5) / 0.35); }
  return qs;
}
function shotYard(t) { // 2段目 9〜17：主人公は、小柄な中学生。あるスポーツに、心をうばわれた
  base(); SKY2.visible = true; S.aim(AX, -4); lift(0); S.hemi.intensity = 1.1; S.key.intensity = 1.1; S.key.color.set('#ffc8a0'); S.scene.background.set('#f0a070'); S.scene.fog.color.set('#e0a080');
  const k = ((t - 1.0) % 3.2) / 1.6; if (t > 1.0 && k < 1) crouchJump(BOY2, k, 1.3); else { crouchJump(BOY2, 0, 0); BOY2.position.y = 0; BOY2.userData.arms.forEach(a => a.rotation.x = 0); }
  BOY2.userData.head.rotation.x = -0.35;
  const u = ease(t / 8);
  look(AX + lerp(1.8, 1.2, u), lerp(1.4, 1.3, u), lerp(1.8, 0.8, u), AX, 1.8, -3.4, 62);
  pin(tSmall, 1.05); pin(tLove, 1.05);
  tSmall.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSmall.visible = false; tLove.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotArena(t) { // 3段目 17〜25：最初で最後の大会。相手には、天才がいた。コート上の王様と呼ばれる天才に、完敗する
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 0.8;
  KING3.userData.head.rotation.x = -0.1;
  const down = t > 4.4 ? clamp((t - 4.4) / 0.8) : 0; [BOY3, ...MATES3].forEach(p => { p.userData.head.rotation.x = down * 0.5; });
  const u = ease(t / 8);
  look(BX + lerp(-1.2, -0.8, u), lerp(2.0, 1.9, u), lerp(-1.4, -2.2, u), BX + 0.2, 1.8, -10.6, 62);
  pin(tGenius, 1.05); pin(tLose, 1.05);
  tGenius.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGenius.visible = false; tLose.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotDoor(t) { // 4段目 25〜33：高校の体育館に、あの天才が。ぶつかってばかりの2人が、同じチームに
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.2; S.key.intensity = 1.0;
  const k = clamp(t / 3.0); BOY4.position.z = -0.6 - k * 1.8; poseWalk(BOY4, t * 6, k < 1 ? 0.8 : 0);
  if (t > 4.2) { const j = clamp((t - 4.2) / 1.6); RIV4.position.z = -6.2 + j * 2.0; poseWalk(RIV4, t * 6, j < 1 ? 0.8 : 0); BOY4.userData.arms.forEach(a => a.rotation.z = 0); }
  else { RIV4.position.z = -6.2; poseWalk(RIV4, 0, 0); }
  const bh = Math.abs(Math.sin(t * 2.4)) * 1.2; BALL4.position.set(CX + 0.8 + 0.35, 1.2 + bh, RIV4.position.z + 0.3);
  RIV4.userData.arms[1].rotation.x = -2.6 + bh * 0.4;
  const u = ease(t / 8);
  look(CX + lerp(-1.4, -1.0, u), lerp(2.0, 1.9, u), lerp(1.6, 0.6, u), CX + 0.3, 1.5, -5.4, 62);
  pin(tMeet, 1.05); pin(tTeam, 1.05);
  tMeet.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMeet.visible = false; tTeam.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotRoom(t) { // 5段目 33〜42：2014年の、日本のアニメ。原作は、少年ジャンプの漫画
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5; S.darken(0.45, '#05060a');
  TVL5.intensity = 2.6 + Math.sin(t * 6) * 0.5;
  const u = ease(t / 9);
  look(DX + lerp(-1.2, -0.4, u), lerp(2.2, 2.1, u), lerp(1.0, 0.2, u), DX + 0.4, 1.2, -3.4, 62);
  pin(t2014, 1.05); pin(tJump, 1.05);
  t2014.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2014.visible = false; tJump.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotSpike(t) { // 6段目 42〜49（決め手）：小さな体で、だれよりも高く跳ぶ。ボールをつないで、ネットの向こうへ
  base(); S.aim(EX, -5); lift(0); S.hemi.intensity = 1.1; S.key.intensity = 1.0;
  const k = clamp((t - 0.6) / 2.4); crouchJump(BOY6, k, 1.6);
  SET6.userData.arms.forEach(a => a.rotation.x = -2.9);
  const bk = clamp((t - 0.6) / 2.4); const p0 = new THREE.Vector3(EX + 1.3, 2.3, -4.3), p1 = new THREE.Vector3(EX - 0.4, 3.9, -4.7);
  BALL6.position.lerpVectors(p0, p1, bk); BALL6.position.y += Math.sin(bk * Math.PI) * 0.8;
  if (t > 3.2) { const s = clamp((t - 3.2) / 0.6); BALL6.position.set(lerp(EX - 0.4, EX - 0.9, s), lerp(3.9, 0.2, s), lerp(-4.7, -8.4, s)); }
  TRAIL6.forEach((d, i) => { d.position.copy(BALL6.position).add(new THREE.Vector3(0, 0, 0)); d.position.z += 0; d.visible = t > 3.2 && t < 4.4; d.position.lerp(new THREE.Vector3(EX - 0.4, 3.9, -4.7), i / 8); });
  OPP6.forEach(p => p.userData.arms.forEach(a => a.rotation.x = -2.8));
  const u = ease(t / 7);
  look(EX + lerp(4.6, 4.0, u), lerp(1.7, 1.8, u), lerp(2.2, 1.2, u), EX - 0.1, 1.9, -5.0, 62);
  pin(tJumpHi, 1.1); pin(tConnect, 1.1);
  if (t < 3.6) tJumpHi.userData.pop((t - 0.3) / 0.35); else tConnect.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（がらんとした体育館に戻る）
  shotGym(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotGym(t, 0) },
  { a: 9, b: 17, f: shotYard },
  { a: 17, b: 25, f: shotArena },
  { a: 25, b: 33, f: shotDoor },
  { a: 33, b: 42, f: shotRoom },
  { a: 42, b: 49, f: shotSpike },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '中学の部活。<br>仲間が、ひとりもいない。'],
  [5.6, 9.0, 'やっと人を集めて、<br>最初で最後の大会へ。'],
  [9.2, 13.2, '主人公は、<br>小柄な中学生。'],
  [13.2, 17.0, 'あるスポーツに、<br>心をうばわれた。'],
  [17.2, 21.0, 'でも、相手チームには<br>天才がいた。'],
  [21.0, 25.0, 'コート上の王様と呼ばれる<br>天才に、完敗する。'],
  [25.2, 29.0, '高校の体育館に入ると、<br>そこには、あの天才が。'],
  [29.0, 33.0, 'ぶつかってばかりの2人が、<br>同じチームに。'],
  [33.2, 37.4, '2014年の、<br>日本のアニメ。'],
  [37.4, 41.8, '原作は、<br>少年ジャンプの漫画。'],
  [42.2, 45.4, '小さな体で、<br>だれよりも高く跳ぶ。'],
  [45.4, 49.0, 'ボールをつないで、<br>ネットの向こうへ。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ハイキュー!!'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q139', v2: true, answer: 'ハイキュー!!',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'hopeful', seed: 13910,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [10.6, 'poof', 0.3], [17.0, 'whoosh'], [21.2, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.2, 'poof', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'コート上の王様': 'コートじょうのおうさま', '少年ジャンプ': 'しょうねんジャンプ', '最初で最後': 'さいしょでさいご', '2014年': 'にせんじゅうよねん', '相手チーム': 'あいてチーム', '呼ばれる': 'よばれる', '聞かせて': 'きかせて', '中学生': 'ちゅうがくせい', '体育館': 'たいいくかん', '小柄な': 'こがらな', '主人公': 'しゅじんこう', '集めて': 'あつめて', '小さな': 'ちいさな', '向こう': 'むこう', '当てて': 'あてて', '中学': 'ちゅうがく', '部活': 'ぶかつ', '仲間': 'なかま', '大会': 'たいかい', '天才': 'てんさい', '完敗': 'かんぱい', '高校': 'こうこう', '入る': 'はいる', '同じ': 'おなじ', '日本': 'にほん', '原作': 'げんさく', '漫画': 'まんが', '高く': 'たかく', '跳ぶ': 'とぶ', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '2人': 'ふたり', '体': 'からだ', '心': 'こころ', '人': 'ひと' },
    caption: 'この作品のタイトル、わかる？\n中学の部活。仲間が、ひとりもいない。やっと人を集めて、最初で最後の大会へ。主人公は、小柄な中学生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'Hulu', 'アニメ好き', '日本のアニメ'],
  },
});
applyQuizCards({ answer: 'ハイキュー!!', info: 'Netflix・Hulu｜日本のアニメ', answerSize: 140 });
