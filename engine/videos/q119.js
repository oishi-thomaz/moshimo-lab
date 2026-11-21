import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #119 今日から俺は!!（ドラマ・日本・2018年10月14日〜 日本テレビ・全10話。Hulu・FOD で見放題、
//   Filmarks の動画配信欄（Hulu 見放題。2026年10月更新）と JustWatch 日本版 justwatch.com/jp/テレビ番組/jin-ri-karaan-ha（サブスクリプション：Hulu・FOD）で2026/11/21確認。
//   Filmarks 4.1・レビュー36,389件 filmarks.com/dramas/1210/2506）
// 確かめた事実（ザテレビジョン thetv.jp/program/0000941879/1/ の概要・あらすじ、第10話のページあり。2026/11/21）：
//   ・西森博之の同名漫画（累計発行部数4000万部超のヤンキーギャグ漫画）を、福田雄一の脚本・演出、賀来賢人主演でドラマ化。2018年10月14日 日本テレビ
//   ・1980年代を舞台に、高校生の“ツッパリ”たちが巻き起こす学園コメディー
//   ・転校を機にツッパることを決意した三橋と伊藤は、思いがけず不良集団を倒したことで意気投合。二人は番長格として有名人になる
//   ・“どんなことをしてでも勝つ”が信条の金髪パーマの主人公・三橋と、トンガリ頭・伊藤の最強ツッパリコンビ
// 構成（ヒント6段）：1 転校をきっかけに、ある決意をした高校生・見た目をがらりと変えて登校 → 2 主人公は勝つためならどんな手でも使う男・同じ日にもう1人転校生
//   → 3 舞台はちょっと昔の高校・長い学ランにぺたんこのカバン → 4 ふたりで不良の集団を倒してしまった・いつの間にか学校の有名人
//   → 5 2018年の日本のドラマ・原作は人気の漫画、1980年代の笑える学園コメディ → 6 決め手：金髪パーマとトンガリ頭の最強コンビ・タイトルは決意の一言
// 結末・けんかの勝ち負けの中身は言わない。登場人物の名前・学校名・地名は出さない。けんかは倒れて目を回すだけ（血やけがは描かない）。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。人は汎用の3D。前半（1〜4段）では もう1人の転校生のトンガリ頭を出さない
const S = quizStage({ bg: '#26303e', floor: '#3a3a3a', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(11910);

const GAKU = '#16181e';
const MIT = { skin: '#f1c9a5', hair: '#1a1410', shirt: GAKU, pants: GAKU };
const ITO = { skin: '#e8b98f', hair: '#1a1410', shirt: GAKU, pants: GAKU };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
// 金髪パーマ（もこもこの玉）。最初は隠しておいて、1段目で出す
function perm(p) { const g = new THREE.Group(); const m = mat('#f0cc58');
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), m); const a = i / 14 * Math.PI * 2; b.position.set(Math.cos(a) * 0.19, 0.42 + (i % 2) * 0.06, Math.sin(a) * 0.17 - 0.02); g.add(b); }
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), m); b.position.set(-0.12 + (i % 3) * 0.12, 0.52, -0.08 + Math.floor(i / 3) * 0.14); g.add(b); }
  p.userData.head.add(g); return g; }
// トンガリ頭（6段目だけ）
function spike(p) { const g = new THREE.Group(); const m = mat('#1a1410');
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 4), m); c.position.set(0, 0.92, 0.02); c.rotation.y = Math.PI / 4; g.add(c);
  const b = box(0.43, 0.2, 0.41, m); b.position.y = 0.52; g.add(b); p.userData.head.add(g); return g; }
// 長い学ラン（すそを長くする）
function longCoat(p) { const c = box(0.54, 0.6, 0.3, mat(GAKU)); c.position.set(0, 0.74, 0); p.add(c);
  for (let i = 0; i < 4; i++) { const bt = box(0.04, 0.04, 0.02, mat('#d8c060')); bt.position.set(0, 1.4 - i * 0.16, 0.15); p.add(bt); } return c; }
function flatBag(p, side = 1) { const b = box(0.46, 0.32, 0.04, mat('#2a2018')); b.position.set(0, -0.6, 0.1); p.userData.arms[side].add(b); return b; }

// ---------- 1段目. 朝の部屋（x=0）。鏡の前の男子高校生。ポンと煙が出て、髪が金色のもこもこに ----------
{ const fl = box(9, 0.04, 8, mat('#8a7050')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(9, 4.2, 0.2, mat('#d8cdb8')); wl.position.set(0, 2.1, -5.2); qs.add(wl);
  const fr = box(1.2, 2.2, 0.1, mat('#6a4a30')); fr.position.set(-0.6, 1.5, -5.05); qs.add(fr);
  const tans = box(1.6, 1.2, 0.6, mat('#7a5a38')); tans.position.set(2.4, 0.6, -4.8); qs.add(tans);
  const win = box(1.6, 1.2, 0.06, gl('#bfe0f8')); win.position.set(2.4, 2.6, -5.08); qs.add(win);
  const cal = box(0.6, 0.8, 0.02, mat('#f4f0e8')); cal.position.set(-2.6, 2.4, -5.08); qs.add(cal); }
const MIRROR1 = box(1.0, 2.0, 0.04, new THREE.MeshStandardMaterial({ color: '#c8d8e8', metalness: 0.9, roughness: 0.1 })); MIRROR1.position.set(-0.6, 1.5, -4.98); qs.add(MIRROR1);
const mit1 = makePerson(MIT); mit1.position.set(-0.4, 0, -3.4); mit1.rotation.y = Math.PI; qs.add(mit1);
const PERM1 = perm(mit1);
const COMB1 = box(0.04, 0.2, 0.02, mat('#d84a4a')); COMB1.position.set(0, -0.66, 0.06); mit1.userData.arms[1].add(COMB1);
const POOF1 = []; for (let i = 0; i < 12; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), gl('#ffffff', 0.9)); p.userData.p = [R(), R(), R()]; qs.add(p); POOF1.push(p); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#3a7ad8', sx: 0.5 }); qs.add(Q1);
const tResolve = tag('転校を機に、ある決意', { size: 54, w: 660, bg: '#14161c', sx: 2.3 }); tResolve.position.set(-0.2, 3.4, -4.2); qs.add(tResolve);
const tChange = tag('見た目を、がらりと', { size: 58, w: 600, bg: '#3a7ad8', sx: 2.2 }); tChange.position.set(-0.2, 3.4, -4.2); qs.add(tChange);

// ---------- 2段目. 朝の校門（x=50）。金髪で歩いてくる主人公。ニヤリと親指。向こうにもう1人の転校生の背中 ----------
const AX = 50;
{ const gr = box(20, 0.04, 14, mat('#8a8478')); gr.position.set(AX, 0.02, -2); qs.add(gr);
  for (const s of [-1, 1]) { const pl = box(0.7, 2.4, 0.7, mat('#9a9890')); pl.position.set(AX + s * 2.4, 1.2, -3.2); qs.add(pl); const wl = box(6, 1.6, 0.4, mat('#a8a49a')); wl.position.set(AX + s * 5.8, 0.8, -3.2); qs.add(wl); }
  const sch = box(16, 6, 3, mat('#d8d0c0')); sch.position.set(AX, 3, -12); qs.add(sch);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) { const w = box(1.2, 0.9, 0.06, mat('#6a8aa8')); w.position.set(AX - 6 + i * 2, 2 + r * 2, -10.46); qs.add(w); }
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), mat('#f4f0e8')); clock.position.set(AX, 5.2, -10.45); qs.add(clock);
  for (let i = 0; i < 4; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), mat('#5a8a4a')); tr.position.set(AX - 9 + i * 6, 3.2, -9); qs.add(tr); } }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ fog: false, color: '#a8c8e8' })); SKY2.position.set(AX, 10, -30); qs.add(SKY2);
const mit2 = makePerson(MIT); perm(mit2); mit2.position.set(AX, 0, 0); qs.add(mit2); flatBag(mit2, 0);
const ito2 = makePerson(ITO); ito2.position.set(AX + 1.6, 0, -6.4); ito2.rotation.y = Math.PI; qs.add(ito2); flatBag(ito2, 1);
const KIDS2 = [0, 1, 2].map(i => { const p = makePerson({ skin: ['#e8b98f', '#f1c9a5', '#d8a880'][i], hair: '#1a1410', shirt: i === 1 ? '#2a3050' : GAKU, pants: i === 1 ? '#2a3050' : GAKU, long: i === 1, skirt: i === 1 }); p.position.set(AX - 2.2 + i * 0.8, 0, -4.6 - i * 0.6); p.rotation.y = 0.7; qs.add(p); return p; });
const tWin = tag('勝つためなら、何でも', { size: 54, w: 660, bg: '#14161c', sx: 2.2 }); tWin.position.set(AX, 3.2, -1.0); qs.add(tWin);
const tTwo = tag('もう1人の、転校生', { size: 58, w: 580, bg: '#3a7ad8', sx: 2.0 }); tTwo.position.set(AX, 3.2, -1.0); qs.add(tTwo);

// ---------- 3段目. 古い木の廊下（x=100）。長い学ランにぺたんこのカバンの生徒たち。窓から夕方の光 ----------
const BX = 100;
{ const fl = box(18, 0.04, 5, mat('#9a7a50')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 18; i++) { const ln = box(0.02, 0.01, 5, mat('#7a5a38')); ln.position.set(BX - 9 + i, 0.05, -2); qs.add(ln); }
  const wl = box(18, 3.6, 0.2, mat('#e0d4bc')); wl.position.set(BX, 1.8, -4.4); qs.add(wl);
  for (let i = 0; i < 5; i++) { const w = box(2.4, 1.4, 0.06, gl('#ffd8a0')); w.position.set(BX - 7 + i * 3.5, 2.2, -4.28); qs.add(w); const f = box(0.08, 1.4, 0.08, mat('#6a4a30')); f.position.set(BX - 7 + i * 3.5, 2.2, -4.24); qs.add(f); }
  const lk = box(3, 1.6, 0.5, mat('#8a8070')); lk.position.set(BX + 6, 0.8, 0.2); qs.add(lk); }
const ROW3 = [0, 1, 2, 3].map(i => { const p = makePerson({ skin: ['#e8b98f', '#f1c9a5', '#d8a880', '#c89a70'][i], hair: i === 2 ? '#8a5a2a' : '#1a1410', shirt: GAKU, pants: GAKU });
  longCoat(p); flatBag(p, i % 2); p.position.set(BX - 3 + i * 1.9, 0, -2.4 + (i % 2) * 0.6); p.rotation.y = 0.25 * (i % 2 ? -1 : 1); qs.add(p); return p; });
const tOld = tag('ちょっと昔の、高校', { size: 58, w: 580, bg: '#14161c', sx: 2.4 }); tOld.position.set(BX, 3.2, -2.6); qs.add(tOld);
const tLong = tag('長い学ランに、ぺたんこカバン', { size: 50, w: 820, bg: '#3a7ad8', sx: 2.8 }); tLong.position.set(BX, 3.2, -2.6); qs.add(tLong);

// ---------- 4段目. 夕方の河原（x=150）。目を回して倒れた不良たち。立っているふたり。あとで集まる生徒たち ----------
const CX = 150;
{ const gr = box(20, 0.04, 14, mat('#6a8a4a')); gr.position.set(CX, 0.02, -2); qs.add(gr);
  const rv = box(24, 0.06, 4, mat('#4a7aa8')); rv.position.set(CX, 0.03, -9); qs.add(rv);
  const br = box(24, 0.6, 1.4, mat('#8a8a8a')); br.position.set(CX, 4.0, -12); qs.add(br);
  for (let i = 0; i < 4; i++) { const pl = box(0.6, 4, 0.6, mat('#7a7a7a')); pl.position.set(CX - 9 + i * 6, 2, -12); qs.add(pl); } }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(70, 30), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a7ab8'); gr.addColorStop(1, '#f8b878'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SKY4.position.set(CX, 10, -30); qs.add(SKY4);
const BAD4 = [0, 1, 2, 3, 4].map(i => { const p = makePerson({ skin: ['#e8b98f', '#d8a880', '#f1c9a5', '#c89a70', '#e0b088'][i], hair: ['#1a1410', '#7a3a1a', '#1a1410', '#c8a040', '#1a1410'][i], shirt: '#3a3a4a', pants: '#3a3a4a' });
  const a = -1.2 + i * 0.6; p.position.set(CX + Math.sin(a) * 2.6, 0.2, -3.6 + Math.cos(a) * 1.0); p.rotation.set(-Math.PI / 2, 0, a * 0.6); qs.add(p);
  const st = new THREE.Group(); for (let k = 0; k < 3; k++) { const s = box(0.08, 0.08, 0.08, gl('#ffe060')); s.position.set(Math.cos(k * 2.1) * 0.3, 0, Math.sin(k * 2.1) * 0.3); st.add(s); } qs.add(st); p.userData.stars = st; return p; });
const mit4 = makePerson(MIT); perm(mit4); mit4.position.set(CX - 0.5, 0, -2.6); qs.add(mit4);
const ito4 = makePerson(ITO); ito4.position.set(CX + 0.6, 0, -2.8); qs.add(ito4);
const CAP4 = box(0.44, 0.12, 0.42, mat(GAKU)); CAP4.position.set(0, 0.5, 0); ito4.userData.head.add(CAP4); // 4段目は帽子で頭を隠す
const FANS4 = [0, 1, 2, 3, 4, 5].map(i => { const p = makePerson({ skin: ['#e8b98f', '#f1c9a5', '#d8a880'][i % 3], hair: '#1a1410', shirt: i % 3 === 1 ? '#2a3050' : GAKU, pants: i % 3 === 1 ? '#2a3050' : GAKU, long: i % 3 === 1, skirt: i % 3 === 1 });
  p.position.set(CX - 3.4 + i * 1.36, 0, -6.4); qs.add(p); return p; });
const tBeat = tag('不良の集団を、倒した', { size: 54, w: 660, bg: '#14161c', sx: 2.6 }); tBeat.position.set(CX, 3.4, -3.4); qs.add(tBeat);
const tFame = tag('いつの間にか、有名人', { size: 56, w: 640, bg: '#3a7ad8', sx: 2.6 }); tFame.position.set(CX, 3.4, -3.4); qs.add(tFame);

// ---------- 5段目. 居間（x=200）。テレビに漫画のコマ。ちゃぶ台 ----------
const TX = 200;
{ const fl = box(14, 0.04, 12, mat('#b8a070')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#c8b890')); wl.position.set(TX, 4, -5); qs.add(wl);
  const tvb = box(4, 0.6, 0.8, mat('#5a4030')); tvb.position.set(TX, 0.3, -4.4); qs.add(tvb);
  const fr = box(5.0, 2.9, 0.12, mat('#121216')); fr.position.set(TX, 2.3, -4.6); qs.add(fr);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.1, 24), mat('#6a4a30')); tb.position.set(TX, 0.5, 0.6); qs.add(tb);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8), mat('#5a3a20')); leg.position.set(TX, 0.24, 0.6); qs.add(leg);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.2, 12), mat('#e8e0d0')); cup.position.set(TX + 0.3, 0.65, 0.6); qs.add(cup); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.6), new THREE.MeshBasicMaterial({ map: canvasTex(470, 260, (g, w, h) => {
  g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 5;
  [[10, 10, 200, 110], [220, 10, 240, 110], [10, 130, 140, 120], [160, 130, 300, 120]].forEach(([x, y, ww, hh]) => g.strokeRect(x, y, ww, hh));
  g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(310, 190); g.lineTo(310 + Math.cos(i / 14 * 6.28) * 150, 190 + Math.sin(i / 14 * 6.28) * 60); g.stroke(); }
  g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(110, 70, 40, 34, 0, 0, 7); g.fill(); g.fillStyle = '#f8f6f0'; g.beginPath(); g.ellipse(110, 78, 30, 24, 0, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1a1a'; g.beginPath(); g.ellipse(340, 60, 80, 36, 0, 0, 7); g.fill(); g.stroke(); }) }));
SCR5.position.set(TX, 2.3, -4.53); qs.add(SCR5);
const t2018 = tag('2018年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.8 }); t2018.position.set(TX, 4.6, -4.2); qs.add(t2018);
const t80s = tag('舞台は、1980年代', { size: 58, w: 580, bg: '#3a7ad8', sx: 3.2 }); t80s.position.set(TX, 4.6, -4.2); qs.add(t80s);

// ---------- 6段目. 夕焼けの校舎の屋上（x=250）。金髪パーマとトンガリ頭が並んで立つ ----------
const DX = 250;
{ const rf = box(14, 0.3, 10, mat('#8a8a86')); rf.position.set(DX, 0.15, -2); qs.add(rf);
  const fen = box(14, 1.4, 0.06, gl('#5a6a5a', 0.6)); fen.position.set(DX, 1.0, -6.5); qs.add(fen);
  for (let i = 0; i < 8; i++) { const p = box(0.08, 1.4, 0.08, mat('#4a5a4a')); p.position.set(DX - 7 + i * 2, 1.0, -6.5); qs.add(p); }
  const wt = box(1.6, 2.0, 1.6, mat('#9a9890')); wt.position.set(DX + 4.6, 1.3, -4.8); qs.add(wt); }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(70, 30), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a5a9a'); gr.addColorStop(0.6, '#f89858'); gr.addColorStop(1, '#ffd880'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SKY6.position.set(DX, 8, -30); qs.add(SKY6);
const mit6 = makePerson(MIT); perm(mit6); longCoat(mit6); mit6.position.set(DX - 0.6, 0.3, -2.6); qs.add(mit6);
const ito6 = makePerson(ITO); spike(ito6); longCoat(ito6); ito6.position.set(DX + 0.6, 0.3, -2.6); qs.add(ito6);
const tCombo = tag('金髪パーマと、トンガリ頭', { size: 52, w: 740, bg: '#14161c', sx: 3.1 }); tCombo.position.set(DX, 3.6, -3.0); qs.add(tCombo);
const tVow = tag('タイトルは、決意の一言', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tVow.position.set(DX, 3.6, -3.0); qs.add(tVow);

// ---------- shots ----------
const ALL = [tResolve, tChange, tWin, tTwo, tOld, tLong, tBeat, tFame, t2018, t80s, tCombo, tVow, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); POOF1.forEach(p => p.visible = false); }

function shotMirror(t, quiz = 0) { // 1段目 0〜9：転校をきっかけに、ある決意をした高校生。見た目を、がらりと変えて登校（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.0;
  const done = quiz || t > 5.6; PERM1.visible = done;
  mit1.userData.arms[1].rotation.x = done ? -0.2 : -2.6 + Math.sin(t * 6) * 0.15; mit1.userData.head.rotation.x = 0;
  mit1.userData.arms[0].rotation.x = done && !quiz ? -1.6 * ease(clamp((t - 6.4) / 0.5)) : 0;
  if (!quiz && t > 5.4 && t < 6.6) POOF1.forEach(p => { const q = p.userData.p; const k = clamp((t - 5.4) / 1.2); p.visible = true; p.position.set(-0.4 + (q[0] - 0.5) * 1.4 * k, 1.9 + (q[1] - 0.3) * k * 1.2, -3.4 + (q[2] - 0.5) * k); p.scale.setScalar(1 - k * 0.6); });
  Q1.position.set(0.9, 2.5, -3.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tResolve.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tResolve.visible = false; tChange.userData.pop((t - 6.0) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.9, 0.7, u), lerp(2.2, 2.1, u), lerp(1.4, 0.6, u), -0.5, 1.7, -4.4, 62);
  return qs;
}
function shotGate(t) { // 2段目 9〜17：主人公は、勝つためならどんな手でも使う男。同じ日に、もう1人転校生がいた
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.25;
  const w = ease(clamp(t / 3.0)); mit2.position.z = 0.4 - w * 2.4; poseWalk(mit2, t * 4.5, w < 1 ? 1 : 0); mit2.rotation.y = Math.PI;
  mit2.rotation.y = 0; if (t > 3.0) { mit2.userData.arms[1].rotation.set(-1.4, 0, 0); mit2.userData.head.rotation.y = Math.sin(t * 2) * 0.15; }
  KIDS2.forEach((p, i) => { p.userData.head.rotation.y = 0.3; p.position.x = AX - 2.2 + i * 0.8 + (t > 2 ? -0.02 * t : 0); });
  ito2.visible = t > 3.8; ito2.position.z = -6.4 - (t - 3.8) * 0.3; poseWalk(ito2, t * 4, 1);
  tWin.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWin.visible = false; tTwo.userData.pop((t - 4.3) / 0.35);
  tWin.position.z = tTwo.position.z = -2.6; tWin.position.x = tTwo.position.x = AX + 0.1;
  const u = ease(t / 8);
  look(AX + lerp(-0.6, 0.4, u), lerp(2.0, 2.4, u), lerp(2.6, 2.2, u), AX + 0.4, 1.6, -4, 62);
  return qs;
}
function shotHall(t) { // 3段目 17〜25：舞台は、ちょっと昔の高校。長い学ランに、ぺたんこのカバン
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 0.95; S.darken(0.1, '#3a2a1a');
  ROW3.forEach((p, i) => { poseWalk(p, t * 3.5 + i, 0.5); p.position.x = BX - 3 + i * 1.9 + Math.sin(t * 0.5 + i) * 0.1; });
  tOld.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOld.visible = false; tLong.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.0, 1.0, u), lerp(1.9, 2.0, u), lerp(3.6, 3.2, u), BX + lerp(-0.6, 0.6, u), 1.4, -2.4, 64);
  return qs;
}
function shotRiver(t) { // 4段目 25〜33：ふたりで、不良の集団を倒してしまった。いつの間にか、学校で有名人に
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.0; S.darken(0.15, '#5a3a2a');
  BAD4.forEach((p, i) => { const st = p.userData.stars; st.position.set(p.position.x, 0.5, p.position.z + 0.7); st.rotation.y = t * 4 + i; });
  mit4.userData.arms[0].rotation.x = -2.8 * (t < 3.6 ? ease(clamp((t - 0.6) / 0.4)) : 0); ito4.userData.arms[1].rotation.x = -0.6;
  mit4.userData.head.rotation.y = -0.3; ito4.userData.head.rotation.y = 0.3;
  const k = ease(clamp((t - 4.0) / 1.4)); FANS4.forEach((p, i) => { p.visible = t > 3.8; p.position.z = lerp(-8.0, -5.4, k); poseWalk(p, t * 5 + i, k < 1 ? 1 : 0); p.userData.arms[i % 2].rotation.x = k >= 1 ? -2.4 + Math.sin(t * 8 + i) * 0.3 : p.userData.arms[i % 2].rotation.x; });
  tBeat.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBeat.visible = false; tFame.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(3.0, 3.4, u), lerp(3.6, 3.8, u), CX, 1.0, -3.0, 62);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2018年の、日本のドラマ。原作は人気の漫画。舞台は1980年代。笑える学園コメディ
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#1a140a');
  t2018.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2018.visible = false; t80s.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.8, u), lerp(4.8, 3.8, u), TX, 2.8, -4.6, 66);
  return qs;
}
function shotRoof(t) { // 6段目 42〜49（決め手）：金髪パーマと、トンガリ頭の最強コンビ。タイトルは、決意の一言
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.0; S.darken(0.2, '#4a2a1a');
  const k = ease(clamp(t / 1.2));
  mit6.userData.arms[0].rotation.x = -2.6 * k; ito6.userData.arms[1].rotation.x = -2.6 * k;
  mit6.userData.head.rotation.y = -0.2; ito6.userData.head.rotation.y = 0.2;
  if (t < 3.6) tCombo.userData.pop((t - 0.3) / 0.35); else tVow.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.4, 0.1, u), lerp(1.9, 2.0, u), lerp(2.8, 2.2, u), DX, 2.0, -2.8, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（朝の部屋に戻る）
  shotMirror(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1); PERM1.visible = false;
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotMirror(t, 0) },
  { a: 9, b: 17, f: shotGate },
  { a: 17, b: 25, f: shotHall },
  { a: 25, b: 33, f: shotRiver },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotRoof },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '転校をきっかけに、<br>ある決意をした高校生。'],
  [5.6, 9.0, '見た目を、がらりと<br>変えて登校！'],
  [9.2, 13.2, '主人公は、勝つためなら<br>どんな手でも使う男。'],
  [13.2, 17.0, '同じ日に、もう1人<br>転校生がいた。'],
  [17.2, 21.0, '舞台は、ちょっと昔の<br>高校。'],
  [21.0, 25.0, '長い学ランに、<br>ぺたんこのカバン。'],
  [25.2, 29.0, 'ふたりで、不良の集団を<br>倒してしまった。'],
  [29.0, 33.0, 'いつの間にか、<br>学校の有名人に。'],
  [33.2, 37.4, '2018年の、日本のドラマ。<br>原作は人気の漫画。'],
  [37.4, 41.8, '舞台は1980年代。<br>笑える学園コメディ。'],
  [42.2, 45.4, '金髪パーマと、<br>トンガリ頭の最強コンビ。'],
  [45.4, 49.0, 'タイトルは、<br>決意の一言。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>今日から俺は!!'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q119', v2: true, answer: '今日から俺は!!',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 11910,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.4, 'poof'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [25.4, 'bubble'], [29.2, 'meter', 0.3], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '転校': 'てんこう', '決意': 'けつい', '高校生': 'こうこうせい', '見た目': 'みため', '変えて': 'かえて', '登校': 'とうこう', '主人公': 'しゅじんこう', '勝つ': 'かつ', '手': 'て', '使う': 'つかう', '男': 'おとこ', '同じ日': 'おなじひ', 'もう1人': 'もうひとり', '舞台': 'ぶたい', '昔': 'むかし', '高校': 'こうこう', '長い': 'ながい', '学ラン': 'がくらん', '不良': 'ふりょう', '集団': 'しゅうだん', '倒して': 'たおして', '間に': 'まに', '学校': 'がっこう', '有名人': 'ゆうめいじん', '2018年': 'にせんじゅうはちねん', '日本': 'にほん', '原作': 'げんさく', '人気': 'にんき', '漫画': 'まんが', '1980年代': 'せんきゅうひゃくはちじゅうねんだい', '笑える': 'わらえる', '学園': 'がくえん', '金髪': 'きんぱつ', '最強': 'さいきょう', '一言': 'ひとこと', 'カウントダウンのまに': 'カウントダウンのあいだに', '当てて': 'あてて', '答え': 'こたえ', '今日から俺は!!': 'きょうからおれは', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n転校をきっかけに、ある決意をした高校生。見た目を、がらりと変えて登校！主人公は、勝つためならどんな手でも使う男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'FOD', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: '今日から俺は!!', info: 'Hulu・FOD｜日本のドラマ・全10話', answerSize: 124 });
