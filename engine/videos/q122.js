import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #122 わかっていても（ドラマ・韓国・2021年・全10話。Netflix で見放題、
//   Netflix の作品ページ netflix.com/jp/title/81435649（2021・10エピソード）、JustWatch 日本版 justwatch.com/jp/テレビ番組/algoissjiman
//   （サブスクリプション：Netflix）、Filmarks の動画配信欄（Netflix 見放題）で2026/11/21確認。Filmarks 3.9・レビュー46,971件 filmarks.com/dramas/10875/15168）
// 確かめた事実（Netflix の作品ページの紹介・エピソード紹介、ciatr.jp/topics/318974 の基本情報・あらすじ。2026/11/21）：
//   ・恋愛は面倒だけどトキメキは楽しみたい男子と、愛なんて信じないけど恋愛はしたい女子。同じ学校に通う2人は、互いに割り切った関係を始める（Netflix）
//   ・美大で彫刻を専攻する主人公は、交際中の彼氏の浮気を目撃して別れを決意。バーでひとり飲んでいると、ある男性が人違いで声をかけてきた（ciatr）
//   ・その男性のうなじには蝶のタトゥー。のちに2人が同じ学科だったとわかる（ciatr）
//   ・JTBC・2021年・全10回。ウェブトゥーンが原作の韓国ドラマ（ciatr・Netflix のジャンル）
// 構成（ヒント6段）：1 恋人の浮気を見てしまった夜・ひとりで飲んでいると見知らぬ男が声をかけてきた → 2 主人公は美大で彫刻を学ぶ女子大生・もう恋なんて信じない
//   → 3 粘土の匂いのするアトリエ・あの男と同じ学科だった → 4 恋人じゃないけど友だちでもない・割り切った関係のはずが
//   → 5 2021年の韓国ドラマ・原作はウェブ漫画、全10話の大人のラブストーリー → 6 決め手：男のうなじには蝶のタトゥー・タイトルはダメだと知りながら という意味
// 結末・ふたりの関係がどうなるかは言わない。登場人物の名前・大学名・地名は出さない。キスやベッドの場面は描かない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。人は汎用の3D。前半（1〜4段）では蝶とタトゥーを出さない
const S = quizStage({ bg: '#1a1a28', floor: '#24222c', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(12210);

const NABI = { skin: '#f4d3b5', hair: '#1a1210', shirt: '#e8e0d8', pants: '#3a3a48', long: true };
const JAE = { skin: '#f1c9a5', hair: '#2a1e18', shirt: '#2a2a30', pants: '#1e1e24' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
// 青い蝶（6段目だけ）
function butterfly(c = '#3a8af0') { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const ws = [-1, 1].map(s => { const pv = new THREE.Group(); const w = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), m); w.position.x = s * 0.15; w.scale.set(1, 1.3, 1); pv.add(w); g.add(pv); return pv; });
  const b = box(0.03, 0.22, 0.03, mat('#1a1a1a')); g.add(b); g.userData.ws = ws; qs.add(g); return g; }

// ---------- 1段目. 夜のバー（x=0）。カウンターにひとりの女の人。近づいてくる男 ----------
{ const fl = box(12, 0.04, 10, mat('#3a2a24')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.4, 0.2, mat('#2a2230')); wl.position.set(0, 2.2, -5.6); qs.add(wl);
  const ct = box(6, 1.1, 0.8, mat('#5a3a28')); ct.position.set(0, 0.55, -3.6); qs.add(ct);
  const top = box(6.2, 0.08, 1.0, mat('#8a5a38')); top.position.set(0, 1.14, -3.6); qs.add(top);
  for (let r = 0; r < 3; r++) { const sh = box(5, 0.06, 0.3, mat('#4a3a30')); sh.position.set(0, 2.0 + r * 0.7, -5.4); qs.add(sh);
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.4, 8), gl(['#3a8a5a', '#c8a050', '#8a3a3a', '#5a6aa8'][(i + r) % 4], 0.85)); b.position.set(-2.2 + i * 0.55, 2.25 + r * 0.7, -5.4); qs.add(b); } }
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), gl('#ffc880')); lp.position.set(-2.4 + i * 1.6, 3.6, -3.6); qs.add(lp); const cd = box(0.02, 0.8, 0.02, mat('#2a2a2a')); cd.position.set(-2.4 + i * 1.6, 4.1, -3.6); qs.add(cd); }
  for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14), mat('#2a2a2a')); st.position.set(-1.8 + i * 1.2, 0.8, -2.8); qs.add(st); const lg = box(0.06, 0.8, 0.06, mat('#5a5a5a')); lg.position.set(-1.8 + i * 1.2, 0.4, -2.8); qs.add(lg); } }
const nabi1 = makePerson(NABI); nabi1.position.set(-0.6, 0.38, -2.8); nabi1.rotation.y = Math.PI; qs.add(nabi1);
nabi1.userData.legs.forEach(l => l.rotation.x = -1.2);
const GLASS1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.2, 10), gl('#e8c070', 0.8)); GLASS1.position.set(-0.5, 1.28, -3.45); qs.add(GLASS1);
const jae1 = makePerson(JAE); jae1.position.set(2.6, 0, -1.6); jae1.rotation.y = -1.6; qs.add(jae1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#3a7ad8', sx: 0.5 }); qs.add(Q1);
const tNight = tag('浮気を、見てしまった夜', { size: 54, w: 700, bg: '#14161c', sx: 2.4 }); tNight.position.set(0.2, 3.0, -3.8); qs.add(tNight);
const tVoice = tag('見知らぬ男が、声をかけた', { size: 52, w: 740, bg: '#3a7ad8', sx: 2.5 }); tVoice.position.set(0.9, 3.0, -3.8); qs.add(tVoice);

// ---------- 2段目. 昼のアトリエ（x=50）。台の上の白い胸像を、へらで削る女の人 ----------
const AX = 50;
{ const fl = box(14, 0.04, 10, mat('#8a8478')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#e8e4dc')); wl.position.set(AX, 2.5, -5.6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const w = box(2.4, 2.2, 0.06, gl('#d8ecf8')); w.position.set(AX - 4 + i * 4, 3.0, -5.48); qs.add(w); }
  for (let i = 0; i < 4; i++) { const sh = box(0.5, 0.5, 0.5, mat('#c8c0b0')); sh.position.set(AX - 5 + i * 0.6, 0.25, -4.8); qs.add(sh); }
  const tb = box(2, 0.1, 1, mat('#9a7a5a')); tb.position.set(AX + 3.6, 0.9, -4.2); qs.add(tb); }
const STAND2 = box(0.6, 1.0, 0.6, mat('#6a5a48')); STAND2.position.set(AX, 0.5, -3.4); qs.add(STAND2);
const BUST2 = new THREE.Group(); { const m = mat('#d8d0c4'); const b = box(0.7, 0.4, 0.4, m); b.position.y = 1.2; BUST2.add(b); const n = box(0.2, 0.2, 0.2, m); n.position.y = 1.5; BUST2.add(n); const h = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), m); h.position.y = 1.8; BUST2.add(h); }
BUST2.position.set(AX, 0, -3.4); qs.add(BUST2);
const nabi2 = makePerson(NABI); nabi2.position.set(AX + 0.9, 0, -2.6); nabi2.rotation.y = -2.2; qs.add(nabi2);
const APRON2 = box(0.52, 0.8, 0.02, mat('#7a8a9a')); APRON2.position.set(0, 1.0, 0.15); nabi2.add(APRON2);
const TOOL2 = box(0.03, 0.22, 0.03, mat('#c8a060')); TOOL2.position.set(0, -0.68, 0.06); nabi2.userData.arms[1].add(TOOL2);
const CHIPS2 = []; for (let i = 0; i < 8; i++) { const c = box(0.04, 0.04, 0.04, mat('#d8d0c4')); c.userData.p = [R(), R()]; qs.add(c); CHIPS2.push(c); }
const tArt = tag('美大で、彫刻を学ぶ', { size: 58, w: 580, bg: '#14161c', sx: 2.3 }); tArt.position.set(AX + 0.3, 2.9, -3.6); qs.add(tArt);
const tNoLove = tag('もう、恋なんて信じない', { size: 54, w: 700, bg: '#3a7ad8', sx: 2.2 }); tNoLove.position.set(AX + 0.3, 2.9, -3.6); qs.add(tNoLove);

// ---------- 3段目. 大学の作業場（x=100）。並ぶ石こう像と作業台。入口に立つ、あの男 ----------
const BX = 100;
{ const fl = box(16, 0.04, 10, mat('#7a7468')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(16, 5, 0.2, mat('#d0ccc4')); wl.position.set(BX, 2.5, -5.6); qs.add(wl);
  for (let i = 0; i < 5; i++) { const st = box(0.5, 0.9, 0.5, mat('#5a5048')); st.position.set(BX - 5 + i * 2.5, 0.45, -4.6); qs.add(st);
    const fg = new THREE.Mesh(i % 2 ? new THREE.SphereGeometry(0.3, 12, 10) : new THREE.ConeGeometry(0.3, 0.8, 8), mat('#e0dcd4')); fg.position.set(BX - 5 + i * 2.5, 1.2, -4.6); qs.add(fg); }
  const dr = box(1.2, 2.4, 0.1, mat('#3a3028')); dr.position.set(BX + 3.0, 1.2, -5.48); qs.add(dr);
  for (let i = 0; i < 2; i++) { const tb = box(2.4, 0.1, 1.2, mat('#9a7a5a')); tb.position.set(BX - 2 + i * 3.6, 0.9, -2.2); qs.add(tb); const lg = box(2.2, 0.8, 1.0, mat('#7a5a40')); lg.position.set(BX - 2 + i * 3.6, 0.45, -2.2); qs.add(lg); } }
const nabi3 = makePerson(NABI); nabi3.position.set(BX - 1.0, 0, -1.2); nabi3.rotation.y = 2.6; qs.add(nabi3);
const jae3 = makePerson(JAE); jae3.position.set(BX + 3.0, 0, -4.8); qs.add(jae3);
const STUD3 = [0, 1].map(i => { const p = makePerson({ skin: ['#e8b98f', '#f1c9a5'][i], hair: '#2a2018', shirt: ['#5a7a5a', '#8a6a9a'][i], pants: '#3a3a48', long: i === 1 }); p.position.set(BX - 3.6 + i * 6.4, 0, -1.6); p.rotation.y = i ? -0.6 : 0.6; qs.add(p); return p; });
const tStudio = tag('粘土の匂いの、作業場', { size: 54, w: 660, bg: '#14161c', sx: 2.5 }); tStudio.position.set(BX + 0.6, 3.2, -3.6); qs.add(tStudio);
const tSame = tag('あの男と、同じ学科', { size: 56, w: 600, bg: '#3a7ad8', sx: 2.3 }); tSame.position.set(BX + 0.6, 3.2, -3.6); qs.add(tSame);

// ---------- 4段目. 夜の屋上（x=150）。少し離れて座るふたり。ゆっくり近づく ----------
const CX = 150;
{ const rf = box(14, 0.3, 10, mat('#3a3a44')); rf.position.set(CX, 0.15, -2); qs.add(rf);
  const ed = box(14, 0.6, 0.3, mat('#4a4a54')); ed.position.set(CX, 0.6, -5.2); qs.add(ed);
  for (let i = 0; i < 10; i++) { const h = 6 + R() * 14; const b = box(3, h, 3, mat('#1e2030')); b.position.set(CX - 18 + i * 4, h / 2 - 4, -22 - R() * 6); qs.add(b);
    for (let k = 0; k < 6; k++) { const w = box(0.3, 0.3, 0.02, gl(R() < 0.5 ? '#ffd890' : '#8aa8d8')); w.position.set(b.position.x - 1 + R() * 2, -4 + R() * h, b.position.z + 1.52); qs.add(w); } } }
const MOON4 = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), new THREE.MeshBasicMaterial({ color: '#f4ecd0', fog: false })); MOON4.position.set(CX + 6, 10, -40); qs.add(MOON4);
const nabi4 = makePerson(NABI); nabi4.rotation.y = Math.PI; qs.add(nabi4);
const jae4 = makePerson(JAE); jae4.rotation.y = Math.PI; qs.add(jae4);
[nabi4, jae4].forEach(p => { p.userData.legs.forEach(l => l.rotation.x = -1.5); });
const tNotLovers = tag('恋人じゃない、友だちでもない', { size: 50, w: 800, bg: '#14161c', sx: 2.4 }); tNotLovers.position.set(CX, 2.7, -6.0); qs.add(tNotLovers);
const tDeal = tag('割り切った関係の、はずが', { size: 52, w: 740, bg: '#3a7ad8', sx: 2.3 }); tDeal.position.set(CX, 2.7, -6.0); qs.add(tDeal);

// ---------- 5段目. 夜の部屋（x=200）。大きなスマホの画面に、縦に流れる漫画のコマ ----------
const TX = 200;
{ const fl = box(14, 0.04, 12, mat('#3a3440')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#2a2632')); wl.position.set(TX, 4, -5); qs.add(wl);
  const bed = box(3.4, 0.6, 2.2, mat('#6a6a8a')); bed.position.set(TX - 3.6, 0.3, -3.2); qs.add(bed); }
const PHONE5 = new THREE.Group(); { const f = box(1.8, 3.4, 0.12, mat('#121216')); PHONE5.add(f); }
const PTEX = canvasTex(180, 900, (g, w, h) => { g.fillStyle = '#f8f6f2'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) { const y = 10 + i * 128; g.fillStyle = ['#f0d8d8', '#d8e4f0', '#e8e0f4', '#f4ecd8'][i % 4]; g.fillRect(10, y, 160, 110); g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.strokeRect(10, y, 160, 110);
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(60 + (i % 2) * 60, y + 60, 20, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(110 - (i % 2) * 50, y + 25, 34, 14, 0, 0, 7); g.fill(); g.stroke(); } });
PTEX.wrapT = THREE.RepeatWrapping; PTEX.repeat.set(1, 0.36);
const PSCR5 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.1), new THREE.MeshBasicMaterial({ map: PTEX })); PSCR5.position.z = 0.07; PHONE5.add(PSCR5);
PHONE5.position.set(TX, 2.4, -3.0); qs.add(PHONE5);
const t2021 = tag('2021年の、韓国ドラマ', { size: 54, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.0 }); t2021.position.set(TX, 4.7, -3.2); qs.add(t2021);
const tWeb = tag('原作は、ウェブ漫画', { size: 56, w: 600, bg: '#3a7ad8', sx: 2.8 }); tWeb.position.set(TX, 4.7, -3.2); qs.add(tWeb);

// ---------- 6段目. 夜の屋上（x=250）。背中を向けた男のうなじに、蝶のタトゥー。舞い上がる青い蝶 ----------
const DX = 250;
{ const rf = box(14, 0.3, 10, mat('#3a3a44')); rf.position.set(DX, 0.15, -2); qs.add(rf);
  for (let i = 0; i < 10; i++) { const h = 6 + R() * 14; const b = box(3, h, 3, mat('#1e2030')); b.position.set(DX - 18 + i * 4, h / 2 - 4, -22 - R() * 6); qs.add(b); } }
const jae6 = makePerson(JAE); jae6.position.set(DX, 0.3, -2.6); jae6.rotation.y = Math.PI; qs.add(jae6);
const TAT6 = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(64, 48, (g, w, h) => {
  g.fillStyle = '#1a1a2a'; g.beginPath(); g.ellipse(20, 18, 14, 12, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(44, 18, 14, 12, 0.4, 0, 7); g.fill();
  g.beginPath(); g.ellipse(22, 34, 9, 8, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(42, 34, 9, 8, -0.3, 0, 7); g.fill(); g.fillRect(30, 10, 4, 30); }) }));
TAT6.position.set(0, 0.1, -0.21); TAT6.rotation.y = Math.PI; jae6.userData.head.add(TAT6);
const BF6 = [0, 1, 2, 3, 4].map(i => { const b = butterfly(['#3a8af0', '#5aa8ff', '#2a6ad8'][i % 3]); b.userData.p = [R(), R(), R()]; b.scale.setScalar(0.45 + R() * 0.2); b.position.set(DX, 3, -3); b.visible = false; return b; });
const tBfly = tag('うなじに、蝶のタトゥー', { size: 54, w: 680, bg: '#14161c', sx: 1.7 }); tBfly.position.set(DX, 3.0, -3.4); qs.add(tBfly);
const tKnow = tag('タイトルは、ダメだと知りながら', { size: 48, w: 820, bg: '#e6b450', color: '#14161c', sx: 1.8 }); tKnow.position.set(DX, 3.0, -3.4); qs.add(tKnow);

// ---------- shots ----------
const ALL = [tNight, tVoice, tArt, tNoLove, tStudio, tSame, tNotLovers, tDeal, t2021, tWeb, tBfly, tKnow, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); CHIPS2.forEach(c => c.visible = false); BF6.forEach(b => b.visible = false); }

function shotBar(t, quiz = 0) { // 1段目 0〜9：恋人の浮気を、見てしまった夜。ひとりで飲んでいると、見知らぬ男が声をかけてきた（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.45, '#0a0610');
  nabi1.userData.arms.forEach(a => a.rotation.x = -1.2); nabi1.userData.head.rotation.x = quiz ? 0.2 : 0.25 - 0.25 * ease(clamp((t - 6.0) / 0.5));
  const w = quiz ? 0 : ease(clamp((t - 4.4) / 2.0)); jae1.position.x = 2.6 - w * 1.9; jae1.position.z = -1.6 - w * 0.9; poseWalk(jae1, t * 4.5, w > 0 && w < 1 ? 0.8 : 0);
  jae1.visible = !quiz; if (!quiz && t > 6.4) { jae1.rotation.y = -2.4; jae1.userData.arms[0].rotation.x = -0.8; nabi1.userData.head.rotation.y = -0.6 * ease(clamp((t - 6.4) / 0.5)); }
  Q1.position.set(1.2, 2.4, -3.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tNight.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tNight.visible = false; tVoice.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-3.4, -3.0, u), lerp(2.0, 2.1, u), lerp(0.4, -0.2, u), 0.4, 1.5, -3.2, 62);
  return qs;
}
function shotStudio(t) { // 2段目 9〜17：主人公は、美大で彫刻を学ぶ女子大生。もう、恋なんて信じない
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.15;
  nabi2.userData.arms[1].rotation.x = -1.4 + Math.sin(t * 5) * 0.25; nabi2.userData.arms[0].rotation.x = -0.9;
  BUST2.rotation.y = Math.sin(t * 0.4) * 0.2;
  CHIPS2.forEach(c => { const q = c.userData.p; const k = ((t * 0.8 + q[0]) % 1); c.visible = true; c.position.set(AX + 0.25 + (q[1] - 0.5) * 0.4, 1.8 - k * 1.6, -3.1); });
  if (t > 4.4) { nabi2.userData.arms[1].rotation.x = -0.3; nabi2.userData.head.rotation.x = 0.25; }
  tArt.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tArt.visible = false; tNoLove.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-1.2, -0.8, u), lerp(2.0, 2.1, u), lerp(1.8, 1.2, u), AX + 0.3, 1.5, -3.2, 62);
  return qs;
}
function shotHall(t) { // 3段目 17〜25：粘土の匂いのする、大学の作業場。あの男と、同じ学科だった
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.0;
  jae3.visible = t > 3.6; jae3.position.z = -4.8 + ease(clamp((t - 3.6) / 1.4)) * 0.8; poseWalk(jae3, t * 4, t < 5 ? 0.6 : 0);
  if (t > 4.6) nabi3.userData.head.rotation.y = 0.3;
  STUD3.forEach((p, i) => { p.userData.arms[i].rotation.x = -0.6 + Math.sin(t * 2 + i) * 0.2; });
  tStudio.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStudio.visible = false; tSame.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.8, -1.6, u), lerp(2.1, 2.0, u), lerp(2.4, 1.6, u), BX + 1.0, 1.4, -4.0, 62);
  return qs;
}
function shotRoof(t) { // 4段目 25〜33：恋人じゃないけど、友だちでもない。割り切った関係の、はずが…
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.5; S.darken(0.55, '#06060e');
  const gap = lerp(0.8, 0.32, ease(clamp((t - 4.2) / 2.5)));
  nabi4.position.set(CX - gap, -0.12, -4.4); jae4.position.set(CX + gap, -0.12, -4.4);
  nabi4.userData.head.rotation.y = t > 5 ? -0.4 : 0; jae4.userData.head.rotation.y = t > 5.5 ? 0.3 : 0;
  tNotLovers.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNotLovers.visible = false; tDeal.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.3, 0.1, u), lerp(1.7, 1.6, u), lerp(-0.4, -1.4, u), CX, 1.2, -5.0, 62);
  return qs;
}
function shotPhone(t) { // 5段目 33〜42：2021年の、韓国ドラマ。原作はウェブ漫画。全10話の、大人のラブストーリー
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.4, '#08060c');
  PTEX.offset.y = -t * 0.06;
  t2021.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2021.visible = false; tWeb.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(0.6, 0.2, u), lerp(2.8, 2.9, u), lerp(3.6, 2.8, u), TX, 3.0, -3.0, 64);
  return qs;
}
function shotTattoo(t) { // 6段目 42〜49（決め手）：男のうなじには、蝶のタトゥー。タイトルは、ダメだと知りながら という意味
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.6; S.darken(0.5, '#06060e');
  jae6.userData.head.rotation.x = 0.35;
  BF6.forEach((b, i) => { const q = b.userData.p; const k = clamp((t - 0.8 - q[0] * 1.2) / 3.5); b.visible = k > 0; const a = q[1] * 6.28 + t * 0.8;
    b.position.set(DX + Math.cos(a) * (0.4 + k * 1.2), 2.0 + k * 1.6 + Math.sin(t * 3 + i) * 0.08, -2.6 + Math.sin(a) * 0.5 + 0.4); b.userData.ws.forEach((w, s) => w.rotation.y = (s ? -1 : 1) * Math.abs(Math.sin(t * 12 + i)) * 1.1); });
  if (t < 3.6) tBfly.userData.pop((t - 0.3) / 0.35); else tKnow.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.5, 0.2, u), lerp(2.3, 2.3, u), lerp(0.2, -0.4, u), DX, 2.1, -2.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜のバーに戻る）
  shotBar(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotBar(t, 0) },
  { a: 9, b: 17, f: shotStudio },
  { a: 17, b: 25, f: shotHall },
  { a: 25, b: 33, f: shotRoof },
  { a: 33, b: 42, f: shotPhone },
  { a: 42, b: 49, f: shotTattoo },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '恋人の浮気を、<br>見てしまった夜。'],
  [5.6, 9.0, 'ひとりで飲んでいると、<br>見知らぬ男が声をかけてきた。'],
  [9.2, 13.2, '主人公は、美大で<br>彫刻を学ぶ女子大生。'],
  [13.2, 17.0, 'もう、恋なんて<br>信じない。'],
  [17.2, 21.0, '粘土の匂いのする、<br>大学の作業場。'],
  [21.0, 25.0, 'あの男と、<br>同じ学科だった。'],
  [25.2, 29.0, '恋人じゃないけど、<br>友だちでもない。'],
  [29.0, 33.0, '割り切った関係の、<br>はずが…'],
  [33.2, 37.4, '2021年の、韓国ドラマ。<br>原作はウェブ漫画。'],
  [37.4, 41.8, '全10話の、<br>大人のラブストーリー。'],
  [42.2, 45.4, '男のうなじには、<br>蝶のタトゥー。'],
  [45.4, 49.0, 'タイトルは、ダメだと<br>知りながら、という意味。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>わかっていても。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q122', v2: true, answer: 'わかっていても',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 12210,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.2, 'meter', 0.3], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [43.0, 'bubble'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '恋人': 'こいびと', '浮気': 'うわき', '見て': 'みて', '夜': 'よる', '飲んで': 'のんで', '見知らぬ': 'みしらぬ', '男': 'おとこ', '声': 'こえ', '主人公': 'しゅじんこう', '美大': 'びだい', '彫刻': 'ちょうこく', '学ぶ': 'まなぶ', '女子大生': 'じょしだいせい', '恋': 'こい', '信じない': 'しんじない', '粘土': 'ねんど', '匂い': 'におい', '大学': 'だいがく', '作業場': 'さぎょうば', '同じ': 'おなじ', '学科': 'がっか', '友だち': 'ともだち', '割り切った': 'わりきった', '関係': 'かんけい', '2021年': 'にせんにじゅういちねん', '韓国': 'かんこく', '原作': 'げんさく', 'ウェブ漫画': 'ウェブまんが', '全10話': 'ぜんじゅうわ', '大人': 'おとな', '蝶': 'ちょう', '知りながら': 'しりながら', '意味': 'いみ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n恋人の浮気を、見てしまった夜。ひとりで飲んでいると、見知らぬ男が声をかけてきた。主人公は、美大で彫刻を学ぶ女子大生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'ドラマ好き', '韓国ドラマ', '恋愛ドラマ'],
  },
});
applyQuizCards({ answer: 'わかっていても', info: 'Netflix｜韓国ドラマ・全10話', answerSize: 120 });
