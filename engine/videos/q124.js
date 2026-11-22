import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #124 野ブタ。をプロデュース（ドラマ・日本・2005年・全10話。Hulu・Netflix で見放題、
//   Filmarks の動画配信欄（Hulu・Netflix 見放題。2026年10月更新）と JustWatch 日本版 justwatch.com/jp/テレビ番組/ye-buta-wopurodeyusu
//   （見放題：Hulu・Netflix）で2026/11/22確認。Filmarks 3.9・レビュー32,499件 filmarks.com/dramas/2879/4688）
// 確かめた事実（2026/11/22）：
//   ・日本テレビ 2005年10月期 土曜ドラマ。原作 白岩玄の小説「野ブタ。をプロデュース」（河出書房新社）、脚本 木皿泉（日本テレビ公式 ntv.co.jp/nobuta/）
//   ・本音を隠し、クラスの人気者を演じている高校2年の男子。苦手な同級生は、なぜか自分を親友と思い込んでなにかと絡んでくる。
//     ある日、クラスに陰気な転校生がやってくる。いじめにあうようになった転校生を、2人が学校一の人気者にするプロデュースを引き受ける
//     （Hulu の作品ページ hulu.jp/watch/100053309 のあらすじ）
// 構成（ヒント6段）：1 ある日、クラスに暗い転校生・長い前髪でだれとも目を合わせない → 2 主人公はクラスの人気者の男子高校生・本音を隠して演じている
//   → 3 にぎやかな、どこにでもある高校・転校生はすぐに意地悪の的に → 4 苦手な同級生となぜかコンビに・2人である計画を引き受ける
//   → 5 2005年の日本のドラマ・原作は同じタイトルの小説 → 6 決め手：転校生を学校一の人気者にプロデュース・タイトルにはちょっと失礼なあだ名
// 登場人物の名前・学校名・物語の後半の出来事・結末は言わない。俳優の顔・ポスター・ロゴ・主題歌は使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#c8d4e0', floor: '#8a7a68', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(12410);

const BOY = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#2a3450', pants: '#3a3e4a', tie: true };
const HERO = { skin: '#f1c9a5', hair: '#4a3020', shirt: '#2a3450', pants: '#3a3e4a', tie: true };
const PAL = { skin: '#f4d3b5', hair: '#7a4a2a', shirt: '#e8a040', pants: '#3a3e4a' };
const GIRL = { skin: '#f4d3b5', hair: '#3a2a20', shirt: '#2a3450', pants: '#5a5a6a', long: true, skirt: true, tie: true };
const NEW = { skin: '#eacbb0', hair: '#0e0e12', shirt: '#2a3450', pants: '#4a4a56', long: true, skirt: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -1.45); p.position.y = -0.36; return p; }
// 転校生：長い黒髪と、目にかかる前髪
function newGirl(x, z, ry = 0) { const p = person(NEW, x, z, ry); const fr = box(0.44, 0.2, 0.05, mat('#0e0e12')); fr.position.set(0, 0.3, 0.205); p.userData.head.add(fr); p.userData.fringe = fr; p.userData.head.rotation.x = 0.28; return p; }
function desk(x, z) { const g = new THREE.Group(); const tp = box(0.9, 0.06, 0.6, mat('#c8a070')); tp.position.y = 0.74; g.add(tp);
  for (const [a, b] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) { const l = box(0.05, 0.72, 0.05, mat('#7a7a80')); l.position.set(a, 0.36, b); g.add(l); }
  const ch = box(0.5, 0.05, 0.45, mat('#b08a60')); ch.position.set(0, 0.44, 0.62); g.add(ch); const bk = box(0.5, 0.5, 0.05, mat('#b08a60')); bk.position.set(0, 0.7, 0.85); g.add(bk);
  g.position.set(x, 0, z); qs.add(g); return g; }
function classroom(x) {
  const fl = box(14, 0.04, 14, mat('#a08060')); fl.position.set(x, 0.02, -1); qs.add(fl);
  const wl = box(14, 4.4, 0.2, mat('#e8e0d0')); wl.position.set(x, 2.2, -7); qs.add(wl);
  const bb = box(6, 1.8, 0.06, mat('#2a4a3a')); bb.position.set(x, 2.3, -6.86); qs.add(bb);
  const bf = box(6.2, 0.08, 0.16, mat('#9a7a5a')); bf.position.set(x, 1.36, -6.8); qs.add(bf);
  const td = box(1.6, 0.9, 0.7, mat('#9a7a5a')); td.position.set(x - 1.6, 0.45, -5.6); qs.add(td);
  const sw = box(0.2, 4.4, 14, mat('#e8e0d0')); sw.position.set(x + 7, 2.2, -1); qs.add(sw);
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), gl('#bfe0f4')); w.rotation.y = -Math.PI / 2; w.position.set(x + 6.88, 2.4, -5 + i * 3.2); qs.add(w); }
  const dr = box(0.06, 2.4, 1.2, mat('#8a6a4a')); dr.position.set(x - 6.9, 1.2, -5.2); qs.add(dr);
  const sw2 = box(0.2, 4.4, 14, mat('#e8e0d0')); sw2.position.set(x - 7, 2.2, -1); qs.add(sw2);
}

// ---------- 1段目. 教室（x=0）。座る生徒たちの前に、前髪の長い転校生が立つ ----------
classroom(0);
const CLASS1 = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = -3.3 + c * 2.2, z = -2.6 + r * 1.8; desk(x, z); const p = sit(person([BOY, GIRL, BOY, GIRL][(r + c) % 4], x, z + 0.62, Math.PI)); p.rotation.y = Math.PI; p.position.y = -0.36; CLASS1.push(p); }
const NEW1 = newGirl(0.4, -5.0);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tCome = tag('クラスに、転校生', { size: 58, w: 560, bg: '#14161c', sx: 1.9 }); tCome.position.set(0.4, 2.75, -5.0); qs.add(tCome);
const tEyes = tag('だれとも、目を合わせない', { size: 52, w: 740, bg: '#e24050', sx: 2.3 }); tEyes.position.set(0.4, 2.75, -5.0); qs.add(tEyes);

// ---------- 2段目. 昼休みの廊下（x=50）。友だちに囲まれて笑う主人公。ひとりになると、笑顔が消える ----------
const AX = 50;
{ const fl = box(20, 0.04, 6, mat('#b8a890')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(20, 4, 0.2, mat('#eae4d8')); wl.position.set(AX, 2, -3.6); qs.add(wl);
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), gl('#bfe0f4')); w.position.set(AX - 8 + i * 4, 2.3, -3.48); qs.add(w); }
  for (let i = 0; i < 8; i++) { const lk = box(0.5, 1.4, 0.4, mat('#8a9aa8')); lk.position.set(AX - 9 + i * 0.52, 0.7, -3.3); qs.add(lk); } }
const HERO2 = person(HERO, AX, -1.2);
const FANS2 = [[-1.0, -0.6, 0.9], [1.0, -0.6, -0.9], [-0.6, 0.3, 2.4], [0.7, 0.3, -2.4]].map(([dx, dz, ry], i) => person([GIRL, BOY, BOY, GIRL][i], AX + dx, -1.2 + dz, ry));
const SMILE2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3a2a20'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.arc(42, 56, 10, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(86, 56, 10, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  g.beginPath(); g.arc(64, 70, 28, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }), transparent: true, depthTest: false }));
SMILE2.renderOrder = 9; SMILE2.scale.set(0.52, 0.52, 1); qs.add(SMILE2);
const tPop = tag('クラスの、人気者', { size: 58, w: 560, bg: '#14161c', sx: 2.3 }); tPop.position.set(AX, 3.0, -1.6); qs.add(tPop);
const tMask = tag('本音は、だれにも見せない', { size: 52, w: 740, bg: '#e24050', sx: 2.7 }); tMask.position.set(AX, 3.0, -1.6); qs.add(tMask);

// ---------- 3段目. 校舎の前の中庭（x=100）。にぎやかな生徒たち。ベンチにひとりの転校生、その背中を見て笑う3人 ----------
const BX = 100;
{ const gr = box(30, 0.04, 20, mat('#8a9a6a')); gr.position.set(BX, 0.02, -4); qs.add(gr);
  const sc = box(22, 7, 3, mat('#e8e0d0')); sc.position.set(BX, 3.5, -13); qs.add(sc);
  for (let f = 0; f < 3; f++) for (let i = 0; i < 9; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), gl('#9ac0dc')); w.position.set(BX - 9.6 + i * 2.4, 1.6 + f * 2.0, -11.48); qs.add(w); }
  const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 24), mat('#f4f0e8')); ck.rotation.x = Math.PI / 2; ck.position.set(BX, 6.2, -11.4); qs.add(ck);
  const bn = box(2.4, 0.1, 0.6, mat('#9a6a40')); bn.position.set(BX + 1.6, 0.5, -3.0); qs.add(bn); for (const dx of [-1, 1]) { const l = box(0.1, 0.5, 0.5, mat('#5a5a5a')); l.position.set(BX + 1.6 + dx, 0.25, -3.0); qs.add(l); }
  for (const [x, z] of [[-6, -6], [7, -7]]) { const t = box(0.4, 2.2, 0.4, mat('#6a4a2a')); t.position.set(BX + x, 1.1, z); qs.add(t); const c = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 10), mat('#5a8a4a')); c.position.set(BX + x, 3.2, z); qs.add(c); } }
const NEW3 = sit(newGirl(BX + 1.6, -3.0, 0)); NEW3.position.y = -0.33;
const CROWD3 = []; for (let i = 0; i < 8; i++) CROWD3.push(person([BOY, GIRL][i % 2], BX - 8 + R() * 16, -8 + R() * 3, R() * 6));
const BULLY3 = [-1, 0, 1].map(i => person({ skin: '#f1c9a5', hair: ['#c89050', '#2a2018', '#8a5a2a'][i + 1], shirt: '#2a3450', pants: '#3a3e4a', long: i === 0, skirt: i === 0 }, BX - 2.4 + i * 0.8, -1.4, 2.2 + i * 0.1));
const tLively = tag('にぎやかな、高校', { size: 58, w: 560, bg: '#14161c', sx: 2.3 }); tLively.position.set(BX + 0.2, 2.8, -3.0); qs.add(tLively);
const tTarget = tag('すぐに、意地悪の的に', { size: 54, w: 660, bg: '#e24050', sx: 2.5 }); tTarget.position.set(BX + 0.2, 2.8, -3.0); qs.add(tTarget);

// ---------- 4段目. 屋上（x=150）。肩を組んでくる変わり者の同級生。いやそうな主人公。そこへ転校生 ----------
const CX = 150;
{ const fl = box(16, 0.04, 12, mat('#9a9a98')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 20; i++) { const p = box(0.06, 1.4, 0.06, mat('#7a8a90')); p.position.set(CX - 7.6 + i * 0.8, 0.7, -6); qs.add(p); }
  const rl = box(16, 0.08, 0.08, mat('#7a8a90')); rl.position.set(CX, 1.4, -6); qs.add(rl);
  const wt = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.6, 16), mat('#d8d8d0')); wt.position.set(CX - 5, 0.8, -4); qs.add(wt);
  for (let i = 0; i < 6; i++) { const b = box(2 + R() * 2, 3 + R() * 6, 2, mat(['#b8c0c8', '#a8b0b8', '#c8c8c0'][i % 3])); b.position.set(CX - 12 + i * 5, 1.5, -24); qs.add(b); } }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a9ae0'); gr.addColorStop(1, '#e8f0f8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SKY4.position.set(CX, 10, -40); qs.add(SKY4);
const HERO4 = person(HERO, CX - 0.45, -1.6, 0.15);
const PAL4 = person(PAL, CX + 0.45, -1.6, -0.15);
const HAT4 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.16, 16), mat('#3a8a6a')); HAT4.position.set(0, 0.62, 0); PAL4.userData.head.add(HAT4);
const NEW4 = newGirl(CX + 3.0, -1.0, -1.4);
const tOdd = tag('苦手な同級生と、コンビに', { size: 52, w: 740, bg: '#14161c', sx: 2.7 }); tOdd.position.set(CX, 3.1, -1.8); qs.add(tOdd);
const tPlan = tag('2人で、ある計画を', { size: 58, w: 560, bg: '#e24050', sx: 2.3 }); tPlan.position.set(CX + 0.6, 3.1, -1.8); qs.add(tPlan);

// ---------- 5段目. 部屋（x=200）。2005年ごろの机：折りたたみの携帯電話・ブラウン管のテレビ・積んだ小説 ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#b89a78')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#e8dccc')); wl.position.set(TX, 2.5, -4.6); qs.add(wl);
  const dk = box(3.4, 0.1, 1.6, mat('#a07848')); dk.position.set(TX, 0.9, -2.6); qs.add(dk); const dl = box(3.2, 0.86, 1.4, mat('#7a5a38')); dl.position.set(TX, 0.43, -2.6); qs.add(dl);
  const tv = box(1.3, 1.0, 1.0, mat('#3a3a40')); tv.position.set(TX + 1.0, 1.45, -3.0); qs.add(tv);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.78), gl('#5a7aa0')); sc.position.set(TX + 1.0, 1.47, -2.49); qs.add(sc);
  for (let i = 0; i < 3; i++) { const b = box(0.7, 0.12, 0.95, mat(['#d8d0c0', '#c84a3a', '#e8e0d0'][i])); b.position.set(TX - 1.1, 1.01 + i * 0.13, -2.6); b.rotation.y = 0.1 * i; qs.add(b); } }
const PHONE5 = new THREE.Group(); { const lo = box(0.22, 0.04, 0.46, mat('#c8c8d0')); PHONE5.add(lo); const up = box(0.22, 0.04, 0.46, mat('#d8d8e0')); up.position.set(0, 0.2, -0.24); up.rotation.x = 1.2; PHONE5.add(up);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.24), gl('#8ab8e0')); scr.position.set(0, 0.215, -0.215); scr.rotation.x = 1.2 - Math.PI / 2; PHONE5.add(scr); }
PHONE5.position.set(TX - 0.1, 0.97, -2.3); PHONE5.rotation.y = -0.3; qs.add(PHONE5);
const t2005 = tag('2005年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.4 }); t2005.position.set(TX, 2.9, -2.8); qs.add(t2005);
const tNovel = tag('原作は、同じタイトルの小説', { size: 50, w: 780, bg: '#e24050', sx: 2.6 }); tNovel.position.set(TX, 2.9, -2.8); qs.add(tNovel);

// ---------- 6段目. 体育館の舞台（x=250）。スポットライトの中の転校生、そのうしろで作戦を練る2人。人気のメーターが上がる ----------
const DX = 250;
{ const fl = box(16, 0.04, 12, mat('#c89a60')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const st = box(9, 1.0, 4, mat('#8a5a30')); st.position.set(DX, 0.5, -3.6); qs.add(st);
  const cu = box(9.4, 5, 0.2, mat('#8a1a24')); cu.position.set(DX, 3, -5.7); qs.add(cu);
  for (const s of [-1, 1]) { const c = box(1.4, 5, 0.3, mat('#a02030')); c.position.set(DX + s * 4.4, 3, -5.4); qs.add(c); } }
const NEW6 = newGirl(DX, -3.2); NEW6.position.y = 1.0;
const HERO6 = person(HERO, DX - 2.6, -0.4, 0.7);
const PAL6 = person(PAL, DX + 2.6, -0.4, -0.7); const HAT6 = HAT4.clone(); PAL6.userData.head.add(HAT6);
const SPOT6 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2c0', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
SPOT6.position.set(DX, 4.0, -3.2); qs.add(SPOT6);
const METER6 = new THREE.Group(); const MB = box(0.36, 2.4, 0.1, mat('#3a3a44')); MB.position.y = 1.2; METER6.add(MB);
const MF = box(0.28, 1, 0.12, new THREE.MeshBasicMaterial({ color: '#e6b450' })); METER6.add(MF);
METER6.position.set(DX + 3.4, 1.2, -3.6); qs.add(METER6);
const HEARTS6 = []; for (let i = 0; i < 10; i++) { const h = tag('♥', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#ff6a8a', sx: 0.36 }); h.renderOrder = 7; qs.add(h); HEARTS6.push(h); }
const tProd = tag('転校生を、人気者に！', { size: 54, w: 660, bg: '#14161c', sx: 2.6 }); tProd.position.set(DX, 4.2, -3.2); qs.add(tProd);
const tNick = tag('タイトルに、失礼なあだ名', { size: 50, w: 740, bg: '#e6b450', color: '#14161c', sx: 2.7 }); tNick.position.set(DX, 4.2, -3.2); qs.add(tNick);

// ---------- shots ----------
const ALL = [tCome, tEyes, tPop, tMask, tLively, tTarget, tOdd, tPlan, t2005, tNovel, tProd, tNick, Q1, SMILE2, ...HEARTS6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotClass(t, quiz = 0) { // 1段目 0〜9：ある日、クラスに暗い転校生がやってきた。長い前髪で、だれとも目を合わせない（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.2;
  CLASS1.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(i * 1.7) * 0.25 * (quiz ? 1 : ease(clamp((t - 1.2) / 0.8))); });
  NEW1.userData.head.rotation.y = Math.sin(t * 0.7) * 0.15;
  Q1.position.set(0.95, 2.15, -5.0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tCome.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tCome.visible = false; tEyes.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.3, 0.1, u), lerp(2.6, 2.4, u), lerp(0.6, -0.2, u), 0.4, 1.4, -5.0, 58);
  return qs;
}
function shotHall(t) { // 2段目 9〜17：主人公はクラスの人気者の男子高校生。でも本当は、本音を隠して人気者を演じている
  base(); S.aim(AX, -1); lift(0); S.hemi.intensity = 1.2;
  const alone = t > 4.2;
  FANS2.forEach((p, i) => { p.visible = !alone; p.userData.arms[i % 2].rotation.x = -1.2 + Math.sin(t * 5 + i) * 0.3; p.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.04; });
  HERO2.userData.arms[0].rotation.x = alone ? 0 : -2.4 + Math.sin(t * 5) * 0.2; HERO2.userData.head.rotation.x = alone ? 0.3 : -0.1;
  if (alone) { S.darken(0.35, '#3a3a50'); S.hemi.intensity = 0.8; }
  SMILE2.visible = true; const k = alone ? ease(clamp((t - 4.6) / 1.0)) : 0;
  SMILE2.position.set(AX + 0.6 * k, 1.75 + 0.5 * k, -1.0); SMILE2.material.opacity = 1 - 0.55 * k;
  tPop.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPop.visible = false; tMask.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.8, 0.4, u), lerp(1.9, 1.8, u), lerp(3.4, 2.6, u), AX, 1.6, -1.4, 62);
  return qs;
}
function shotYard(t) { // 3段目 17〜25：舞台は、にぎやかな、どこにでもある高校。転校生は、すぐに意地悪の的にされてしまう
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.3;
  CROWD3.forEach((p, i) => poseWalk(p, t * 5 + i, 0.4));
  const mean = t > 4.2;
  BULLY3.forEach((p, i) => { p.visible = mean; p.userData.arms[1].rotation.x = mean ? -1.6 + Math.sin(t * 6 + i) * 0.2 : 0; p.position.y = mean ? Math.abs(Math.sin(t * 7 + i)) * 0.05 : 0; });
  NEW3.userData.head.rotation.x = 0.5;
  tLively.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLively.visible = false; tTarget.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  if (!mean) look(BX + lerp(-0.6, 0.2, u), lerp(2.8, 2.6, u), lerp(3.6, 2.8, u), BX + 0.2, 1.7, -4, 62);
  else look(BX - 0.6, 1.9, 2.6, BX + 0.6, 1.2, -2.6, 62);
  return qs;
}
function shotRoof(t) { // 4段目 25〜33：苦手な同級生と、なぜかコンビを組むことに。2人で、ある計画を引き受ける
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 1.3;
  const k = ease(clamp((t - 0.8) / 0.8));
  PAL4.userData.arms[0].rotation.set(-2.2 * k, 0, -0.9 * k); PAL4.userData.arms[1].rotation.x = -2.6 + Math.sin(t * 6) * 0.3;
  HERO4.userData.head.rotation.y = -0.4 * k; HERO4.position.x = CX - 0.45 - 0.1 * k;
  const g = ease(clamp((t - 4.0) / 1.6)); NEW4.position.x = lerp(CX + 3.4, CX + 1.7, g); poseWalk(NEW4, t * 6, g < 1 ? 0.6 : 0); NEW4.rotation.y = -1.4 + 0.6 * g;
  if (t > 4.3) { HERO4.userData.head.rotation.y = 0.5; PAL4.userData.head.rotation.y = 0.5; }
  tOdd.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOdd.visible = false; tPlan.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.2, 0.8, u), lerp(1.8, 1.9, u), lerp(3.0, 3.4, u), CX + lerp(0, 0.6, u), 1.5, -1.6, 62);
  return qs;
}
function shotRoom(t) { // 5段目 33〜42：2005年の、日本のドラマ。原作は、同じタイトルの小説
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 1.0; S.darken(0.2, '#2a2018');
  PHONE5.rotation.y = -0.3 + Math.sin(t * 0.6) * 0.05;
  t2005.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2005.visible = false; tNovel.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.4, 0.2, u), lerp(2.5, 2.4, u), lerp(2.8, 2.2, u), TX, 1.6, -2.7, 62);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：転校生を、学校一の人気者にプロデュース！ タイトルには、ちょっと失礼なあだ名
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.75; S.darken(0.45, '#14101a');
  S.spot.intensity = 60; S.spot.color.set('#fff2c0'); S.spot.position.set(DX, 7, -1.6); S.spot.target.position.set(DX, 1, -3.2);
  const k = clamp(t / 6);
  NEW6.userData.head.rotation.x = lerp(0.28, -0.1, ease(k)); NEW6.userData.fringe.scale.y = lerp(1, 0.35, ease(k)); NEW6.userData.fringe.position.y = lerp(0.3, 0.36, ease(k)); NEW6.userData.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * 0.4 * ease(k));
  HERO6.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 4) * 0.2; PAL6.userData.arms[0].rotation.x = -2.6 + Math.sin(t * 5) * 0.3;
  MF.scale.y = 0.1 + 2.2 * ease(k); MF.position.y = MF.scale.y / 2 + 0.05;
  HEARTS6.forEach((h, i) => { const ph = (t * 0.5 + i / 10) % 1; h.visible = t > 1.0; h.position.set(DX + Math.sin(i * 2.3) * 2.2, 2.2 + ph * 2.0, -2.4 + Math.cos(i) * 0.5); h.material.opacity = 1 - ph; });
  tProd.position.y = tNick.position.y = 3.55;
  if (t < 3.6) tProd.userData.pop((t - 0.3) / 0.35); else tNick.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.4, 0.3, u), lerp(2.5, 2.6, u), lerp(2.4, 1.8, u), DX, 2.4, -3.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（教室に戻る）
  shotClass(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotClass(t, 0) },
  { a: 9, b: 17, f: shotHall },
  { a: 17, b: 25, f: shotYard },
  { a: 25, b: 33, f: shotRoof },
  { a: 33, b: 42, f: shotRoom },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、クラスに<br>暗い転校生がやってきた。'],
  [5.6, 9.0, '長い前髪で、<br>だれとも目を合わせない。'],
  [9.2, 13.2, '主人公は、クラスの<br>人気者の男子高校生。'],
  [13.2, 17.0, 'でも本当は、本音を隠して<br>人気者を演じている。'],
  [17.2, 21.0, '舞台は、にぎやかな、<br>どこにでもある高校。'],
  [21.0, 25.0, '転校生は、すぐに<br>意地悪の的にされてしまう。'],
  [25.2, 29.0, '苦手な同級生と、<br>なぜかコンビを組むことに。'],
  [29.0, 33.0, '2人で、ある計画を<br>引き受ける。'],
  [33.2, 37.4, '2005年の、<br>日本のドラマ。'],
  [37.4, 41.8, '原作は、<br>同じタイトルの小説。'],
  [42.2, 45.4, '転校生を、学校一の<br>人気者にプロデュース！'],
  [45.4, 49.0, 'タイトルには、<br>ちょっと失礼なあだ名。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>野ブタ。をプロデュース。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q124', v2: true, answer: '野ブタ。をプロデュース',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 12410,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.4, 'drone', 0.4], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [43.0, 'bubble', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ある日': 'あるひ', '暗い': 'くらい', '転校生': 'てんこうせい', '長い前髪': 'ながいまえがみ', '目': 'め', '合わせない': 'あわせない', '主人公': 'しゅじんこう', '人気者': 'にんきもの', '男子高校生': 'だんしこうこうせい', '本当': 'ほんとう', '本音': 'ほんね', '隠して': 'かくして', '演じて': 'えんじて', '舞台': 'ぶたい', '高校': 'こうこう', '意地悪': 'いじわる', '的': 'まと', '苦手': 'にがて', '同級生': 'どうきゅうせい', '組む': 'くむ', '2人': 'ふたり', '計画': 'けいかく', '引き受ける': 'ひきうける', '2005年': 'にせんごねん', '日本': 'にほん', '原作': 'げんさく', '同じ': 'おなじ', '小説': 'しょうせつ', '学校一': 'がっこういち', '失礼': 'しつれい', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '野ブタ。をプロデュース': 'のぶたをプロデュース', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nある日、クラスに暗い転校生がやってきた。長い前髪で、だれとも目を合わせない。主人公は、クラスの人気者の男子高校生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'Netflix', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: '野ブタ。を<br>プロデュース', info: 'Hulu・Netflix｜日本のドラマ・全10話', answerSize: 112 });
