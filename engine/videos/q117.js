import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #117 サンクチュアリ -聖域-（ドラマ・日本・2023年5月4日配信・Netflix シリーズ・全8話。Netflix で見放題、
//   Netflix の作品ページ netflix.com/jp/title/81144910（エピソード1〜8）と JustWatch 日本版 justwatch.com/jp/テレビ番組/sankuchiyuari-sheng-yu
//   （Netflix で配信中）、Filmarks の動画配信欄（Netflix 見放題）で2026/11/20確認。Filmarks 4.1・レビュー47,360件 filmarks.com/dramas/9999/14039。
//   Filmarks にシーズン2 制作決定の作品ページあり filmarks.com/dramas/9999/24670）
// 確かめた事実（Netflix 公式ニュース about.netflix.com/ja/news/sanctuary-teaser-trailer-and-teaser-key-art-and-first-look-debut と
//   about.netflix.com/ja/news/sanctuary-special-trailer-and-display-art-debut、Netflix の作品ページのエピソード紹介。2026/11/20）：
//   ・福岡で荒れた暮らしを送っていた青年は、相撲で大金を稼げると口説かれ、故郷を離れて相撲部屋に入門（エピソード1）
//   ・カネのためだけに入門した、大相撲に一切興味ナシなヤンキー力士。反抗的な態度で周囲から認められない（公式ニュース・エピソード1）
//   ・才能と体格を親方に見初められた。型破りな戦い方で快進撃（公式ニュース）
//   ・1500年以上日本の伝統文化・神事として継承されてきた大相撲。その戦いが行われる土俵はまさに“サンクチュアリ”（聖域）（公式ニュース）
//   ・Netflix シリーズ、2023年5月4日から世界独占配信。監督 江口カン、脚本 金沢知樹（公式ニュース）
// 構成（ヒント6段）：1 荒れた毎日の青年に、大金を稼げるうまい話 → 2 主人公は故郷を離れてある世界に入った青年・目的は金だけ
//   → 3 夜明け前からきびしい稽古・上下関係はぜったい → 4 態度は最悪でまわりは敵だらけ・でも才能だけは本物
//   → 5 2023年の日本のドラマ・1500年以上続く伝統の世界 → 6 決め手：ヤンキー力士が土俵で暴れる・タイトルは神聖な場所という意味
// 結末・取組の勝ち負け・けがの中身は言わない。登場人物の名前・しこ名・部屋の名前・地名は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。けんかや血は描かない。人は汎用の3D。前半（1〜4段）では まげ・まわし・土俵 を出さない
const S = quizStage({ bg: '#1c2028', floor: '#2a2a30', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(11710);

const KIYO = { skin: '#e8b98f', hair: '#e0c060', shirt: '#2a2a30', pants: '#3a3e4a' };
const BOSS = { skin: '#d8a880', hair: '#4a4a4a', shirt: '#2a2420', pants: '#2a2420', tie: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
// 体の大きな男の人（おなかを足す）。knot: まげ、belt: まわし（6段目だけ）
function bigman(opt, { knot = false, belt = false, sc = 1.25 } = {}) {
  const p = makePerson(opt); p.scale.setScalar(sc);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), mat(belt ? opt.skin : opt.shirt)); bel.scale.set(1.0, 0.95, 0.8); bel.position.set(0, 1.08, 0.08); p.add(bel);
  if (belt) { const m = box(0.66, 0.22, 0.5, mat(belt)); m.position.set(0, 0.84, 0.02); p.add(m); }
  if (knot) { const k = box(0.12, 0.1, 0.24, mat(opt.hair)); k.position.set(0, 0.6, 0.0); p.userData.head.add(k); }
  return p; }
const YUKATA = (i) => ({ skin: ['#e8b98f', '#d8a880', '#f1c9a5', '#c89a70'][i % 4], hair: '#1a1410', shirt: ['#6a7a9a', '#5a6a5a', '#7a6a8a', '#4a5a7a'][i % 4], pants: ['#6a7a9a', '#5a6a5a', '#7a6a8a', '#4a5a7a'][i % 4] });

// ---------- 1段目. 夜の古い家の前（x=0）。階段にすわる金髪の青年。封筒を差し出す、体の大きなスーツの男 ----------
{ const gr = box(12, 0.04, 10, mat('#3a3a3e')); gr.position.set(0, 0.02, -2); qs.add(gr);
  const hs = box(6, 3.6, 0.3, mat('#6a6058')); hs.position.set(-0.5, 1.8, -5.2); qs.add(hs);
  const dr = box(1.0, 2.0, 0.06, mat('#4a3a30')); dr.position.set(-1.2, 1.2, -5.02); qs.add(dr);
  for (let i = 0; i < 2; i++) { const st = box(1.6, 0.2, 0.5, mat('#7a7470')); st.position.set(-1.2, 0.1 + i * 0.2, -4.5 + i * -0.25); qs.add(st); }
  const win = box(0.9, 0.7, 0.06, gl('#ffcf80')); win.position.set(-2.8, 2.0, -5.02); qs.add(win);
  const pole = box(0.1, 4.0, 0.1, mat('#4a4a4e')); pole.position.set(2.6, 2.0, -3.6); qs.add(pole);
  const lp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), gl('#fff0c0')); lp.position.set(2.4, 3.9, -3.6); qs.add(lp);
  for (let i = 0; i < 5; i++) { const c = box(0.12, 0.2, 0.12, mat(['#5a8a4a', '#8a5a3a', '#c8c8c8'][i % 3])); c.position.set(-2.6 + i * 0.3, 0.1, -4.4 + (i % 2) * 0.2); c.rotation.z = i % 2 ? Math.PI / 2 : 0; qs.add(c); }
  const env = box(0.2, 0.2, 0.2, mat('#3a3a3e')); env.visible = false; qs.add(env); }
const kiyo1 = makePerson(KIYO); kiyo1.position.set(-1.2, 0.4, -4.1); qs.add(kiyo1);
const boss1 = bigman(BOSS, { sc: 1.2 }); boss1.position.set(0.9, 0, -2.6); boss1.rotation.y = -2.2; qs.add(boss1);
const ENV1 = box(0.28, 0.06, 0.18, mat('#c8a060')); ENV1.position.set(0, -0.62, 0.1); boss1.userData.arms[0].add(ENV1);
const CASH1 = []; for (let i = 0; i < 6; i++) { const c = box(0.3, 0.02, 0.16, gl('#c8d8a0')); c.userData.p = [R(), R(), R()]; qs.add(c); CASH1.push(c); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#3a7ad8', sx: 0.5 }); qs.add(Q1);
const tRough = tag('荒れた毎日の、青年', { size: 56, w: 600, bg: '#14161c', sx: 2.2 }); tRough.position.set(-0.2, 3.0, -3.6); qs.add(tRough);
const tMoney = tag('大金を、稼げるぞ', { size: 58, w: 560, bg: '#3a7ad8', sx: 2.1 }); tMoney.position.set(-0.2, 3.0, -3.6); qs.add(tMoney);

// ---------- 2段目. 朝の駅のホーム（x=50）。大きなかばんを持つ青年。入ってくる電車 ----------
const AX = 50;
{ const pf = box(20, 1.0, 4, mat('#9a948a')); pf.position.set(AX, 0.5, -1); qs.add(pf);
  const ln = box(20, 0.02, 0.2, mat('#e6c440')); ln.position.set(AX, 1.02, -2.7); qs.add(ln);
  const tk = box(20, 0.1, 3, mat('#4a4440')); tk.position.set(AX, 0.05, -4.6); qs.add(tk);
  const roof = box(20, 0.2, 4.4, mat('#6a6a70')); roof.position.set(AX, 4.4, -1); qs.add(roof);
  for (let i = 0; i < 4; i++) { const c = box(0.2, 3.4, 0.2, mat('#5a5a60')); c.position.set(AX - 6 + i * 4, 2.7, 0.6); qs.add(c); }
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(4, 3 + i % 2, 6), mat(['#5a7a5a', '#4a6a5a'][i % 2])); m.position.set(AX - 12 + i * 6, 1.5, -18); qs.add(m); } }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7aa8d8'); gr.addColorStop(1, '#f0d8b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SKY2.position.set(AX, 10, -30); qs.add(SKY2);
const TRAIN2 = new THREE.Group(); for (let c = 0; c < 2; c++) { const b = box(8, 2.6, 2.6, mat('#d8dce4')); b.position.set(c * 8.3, 1.6, 0); TRAIN2.add(b);
  const st = box(8, 0.3, 2.62, mat('#3a7ad8')); st.position.set(c * 8.3, 1.2, 0); TRAIN2.add(st);
  for (let i = 0; i < 5; i++) { const w = box(0.9, 0.7, 2.64, mat('#2a3040')); w.position.set(c * 8.3 - 3 + i * 1.5, 2.2, 0); TRAIN2.add(w); } }
TRAIN2.position.set(AX + 20, 0, -4.6); qs.add(TRAIN2);
const kiyo2 = makePerson(KIYO); kiyo2.position.set(AX - 0.2, 1.0, -1.4); kiyo2.rotation.y = -0.4; qs.add(kiyo2);
const BAG2 = box(0.8, 0.45, 0.35, mat('#2a3a5a')); BAG2.position.set(-0.38, 0.75, 0); kiyo2.add(BAG2);
const tLeave = tag('故郷を、離れて', { size: 60, w: 520, bg: '#14161c', sx: 1.7 }); tLeave.position.set(AX - 0.1, 3.6, -1.8); qs.add(tLeave);
const tOnly = tag('目的は、金だけ', { size: 60, w: 520, bg: '#3a7ad8', sx: 1.7 }); tOnly.position.set(AX - 0.1, 3.6, -1.8); qs.add(tOnly);

// ---------- 3段目. 夜明け前の古い木の建物（x=100）。広い板の間。並んで頭を下げる大きな男たち。あくびをする青年 ----------
const BX = 100;
{ const fl = box(14, 0.04, 12, mat('#8a6a48')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  for (let i = 0; i < 14; i++) { const ln = box(0.02, 0.01, 12, mat('#6a5038')); ln.position.set(BX - 7 + i, 0.05, -3); qs.add(ln); }
  const wl = box(14, 5, 0.2, mat('#a88a68')); wl.position.set(BX, 2.5, -8); qs.add(wl);
  for (let i = 0; i < 6; i++) { const p = box(0.24, 5, 0.24, mat('#5a4030')); p.position.set(BX - 6 + i * 2.4, 2.5, -7.8); qs.add(p); }
  const bm = box(14, 0.3, 0.3, mat('#5a4030')); bm.position.set(BX, 4.6, -7.8); qs.add(bm);
  const shoji = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(200, 120, (g, w, h) => { g.fillStyle = '#c8d0e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a4030'; g.lineWidth = 3; for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(i * 40, 0); g.lineTo(i * 40, h); g.stroke(); } for (let i = 0; i <= 3; i++) { g.beginPath(); g.moveTo(0, i * 40); g.lineTo(w, i * 40); g.stroke(); } }) }));
  shoji.position.set(BX + 3.6, 2.4, -7.88); qs.add(shoji); }
const ROW3 = [0, 1, 2, 3].map(i => { const p = bigman(YUKATA(i)); p.position.set(BX - 3.2 + i * 1.6, 0, -5.4); qs.add(p); return p; });
const kiyo3 = makePerson(KIYO); kiyo3.position.set(BX + 2.0, 0, -3.6); kiyo3.rotation.y = -0.5; qs.add(kiyo3);
const BROOM3 = new THREE.Group(); { const h = box(0.04, 1.2, 0.04, mat('#c8a060')); h.position.y = 0.6; BROOM3.add(h); const b = box(0.4, 0.2, 0.1, mat('#d8c890')); b.position.y = 0.05; BROOM3.add(b); }
BROOM3.position.set(0.15, -0.3, 0.3); BROOM3.rotation.x = 0.4; kiyo3.userData.arms[1].add(BROOM3);
const tDawn = tag('夜明け前から、稽古', { size: 58, w: 600, bg: '#14161c', sx: 3.0 }); tDawn.position.set(BX, 4.1, -5); qs.add(tDawn);
const tRank = tag('上下関係は、ぜったい', { size: 56, w: 640, bg: '#3a7ad8', sx: 3.1 }); tRank.position.set(BX, 4.1, -5); qs.add(tRank);

// ---------- 4段目. 同じ板の間の夜（x=150）。にらむ大きな男たち。真ん中で腕を組む青年。最後に青年だけに光 ----------
const CX = 150;
{ const fl = box(14, 0.04, 12, mat('#6a5038')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#5a4a3a')); wl.position.set(CX, 2.5, -8); qs.add(wl);
  for (let i = 0; i < 6; i++) { const p = box(0.24, 5, 0.24, mat('#3a2a20')); p.position.set(CX - 6 + i * 2.4, 2.5, -7.8); qs.add(p); } }
const RING4 = [0, 1, 2, 3, 4].map(i => { const a = -0.9 + i * 0.45; const p = bigman(YUKATA(i + 1)); p.position.set(CX + Math.sin(a) * 2.6, 0, -3.4 - Math.cos(a) * 2.0); p.rotation.y = Math.PI + a; qs.add(p); return p; });
const kiyo4 = makePerson(KIYO); kiyo4.position.set(CX, 0, -3.0); qs.add(kiyo4);
const SPOT4 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 24, 1, true), gl('#fff0c8', 0.16)); SPOT4.position.set(CX, 3.0, -3.0); qs.add(SPOT4);
const tEnemy = tag('まわりは、敵だらけ', { size: 58, w: 580, bg: '#14161c', sx: 2.7 }); tEnemy.position.set(CX, 3.7, -3.6); qs.add(tEnemy);
const tTalent = tag('才能だけは、本物', { size: 58, w: 560, bg: '#3a7ad8', sx: 2.7 }); tTalent.position.set(CX, 3.7, -3.6); qs.add(tTalent);

// ---------- 5段目. リビング（x=200）。テレビに、上から見た丸い土の舞台 ----------
const TX = 200;
{ const fl = box(14, 0.04, 12, mat('#5a4a40')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a3a44')); wl.position.set(TX, 4, -5); qs.add(wl);
  const tvb = box(4, 0.6, 0.8, mat('#2a2420')); tvb.position.set(TX, 0.3, -4.4); qs.add(tvb);
  const fr = box(5.0, 2.9, 0.12, mat('#121216')); fr.position.set(TX, 2.3, -4.6); qs.add(fr);
  const sofa = box(3.2, 0.6, 1.0, mat('#6a5a7a')); sofa.position.set(TX, 0.3, 1.8); qs.add(sofa); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.6), new THREE.MeshBasicMaterial({ map: canvasTex(470, 260, (g, w, h) => {
  g.fillStyle = '#2a2018'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8a070'; g.fillRect(105, 10, 260, 240);
  g.strokeStyle = '#f0e8d0'; g.lineWidth = 8; g.beginPath(); g.arc(235, 130, 100, 0, 7); g.stroke();
  g.fillStyle = '#ffffff'; g.fillRect(205, 118, 6, 24); g.fillRect(259, 118, 6, 24); }) }));
SCR5.position.set(TX, 2.3, -4.53); qs.add(SCR5);
const t2023 = tag('2023年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.8 }); t2023.position.set(TX, 4.6, -4.2); qs.add(t2023);
const t1500 = tag('1500年以上、続く伝統', { size: 56, w: 680, bg: '#3a7ad8', sx: 3.8 }); t1500.position.set(TX, 4.6, -4.2); qs.add(t1500);

// ---------- 6段目. 土俵（x=250）。にらみ合う大きな力士ふたり。片方は金髪。白い塩が舞う ----------
const DX = 250;
{ const fl = box(20, 0.04, 20, mat('#2a2224')); fl.position.set(DX, 0.02, -3); qs.add(fl);
  const base = box(6.4, 0.6, 6.4, mat('#c8a070')); base.position.set(DX, 0.3, -3); qs.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.08, 6, 48), mat('#e8dcc0')); ring.rotation.x = Math.PI / 2; ring.position.set(DX, 0.62, -3); qs.add(ring);
  for (const s of [-1, 1]) { const ln = box(0.08, 0.02, 0.5, mat('#ffffff')); ln.position.set(DX + s * 0.4, 0.62, -3); qs.add(ln); }
  const roof = box(7.2, 0.5, 7.2, mat('#4a3a2a')); roof.position.set(DX, 6.6, -3); qs.add(roof);
  const cols = ['#3a6a3a', '#c83a3a', '#e8e8e8', '#1a1a1a'];
  for (let i = 0; i < 4; i++) { const t = box(0.3, 0.9, 0.3, mat(cols[i])); t.position.set(DX + (i % 2 ? 3.2 : -3.2), 6.0, -3 + (i < 2 ? 3.2 : -3.2)); qs.add(t); }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) { const p = box(0.4, 0.6, 0.4, mat(['#3a3a4a', '#4a3a3a', '#3a4a4a'][(i + r) % 3])); p.position.set(DX - 4.5 + i, 0.3 + r * 0.4, -8 - r * 0.9); qs.add(p);
    const hd = box(0.26, 0.26, 0.26, mat('#e8b98f')); hd.position.set(p.position.x, p.position.y + 0.45, p.position.z); qs.add(hd); } }
const rik6a = bigman({ ...KIYO, skin: '#e8b98f', shirt: '#e8b98f', pants: '#e8b98f' }, { knot: true, belt: '#2a2a30', sc: 1.35 }); rik6a.position.set(DX - 0.8, 0.6, -2.6); rik6a.rotation.y = Math.PI / 2; qs.add(rik6a);
const rik6b = bigman({ skin: '#d8a880', hair: '#1a1410', shirt: '#d8a880', pants: '#d8a880' }, { knot: true, belt: '#5a2a6a', sc: 1.45 }); rik6b.position.set(DX + 0.9, 0.6, -2.9); rik6b.rotation.y = -Math.PI / 2; qs.add(rik6b);
const SALT6 = []; for (let i = 0; i < 26; i++) { const s = box(0.05, 0.05, 0.05, gl('#ffffff')); s.userData.p = [R(), R(), R()]; qs.add(s); SALT6.push(s); }
const tYan = tag('ヤンキー力士、参上', { size: 58, w: 600, bg: '#14161c', sx: 2.9 }); tYan.position.set(DX, 4.0, -3.4); qs.add(tYan);
const tHoly = tag('タイトルは、神聖な場所', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tHoly.position.set(DX, 4.0, -3.4); qs.add(tHoly);

// ---------- shots ----------
const ALL = [tRough, tMoney, tLeave, tOnly, tDawn, tRank, tEnemy, tTalent, t2023, t1500, tYan, tHoly, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); CASH1.forEach(c => c.visible = false); SALT6.forEach(c => c.visible = false); }

function shotOffer(t, quiz = 0) { // 1段目 0〜9：荒れた毎日を送る青年に、うまい話が舞いこんだ。大金を稼げる、と口説かれて（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.7; S.darken(0.4, '#06080e');
  kiyo1.userData.legs.forEach(l => l.rotation.x = -1.4); kiyo1.position.y = 0.25; kiyo1.userData.arms.forEach(a => a.rotation.x = -0.7);
  kiyo1.userData.head.rotation.y = quiz ? 0.4 : 0.4 * ease(clamp((t - 1.2) / 1.0));
  const w = quiz ? 1 : ease(clamp((t - 0.6) / 2.4)); boss1.position.x = 1.7 - w * 1.2; boss1.position.z = -2.9; poseWalk(boss1, t * 5, w < 1 ? 0.5 : 0);
  boss1.userData.arms[0].rotation.x = -1.3 * (quiz ? 1 : ease(clamp((t - 3.4) / 0.8)));
  if (!quiz && t > 5.4) { kiyo1.userData.head.rotation.x = -0.2; CASH1.forEach((c, i) => { const q = c.userData.p; const k = clamp((t - 5.4 - q[0] * 0.8) / 2.5); c.visible = k > 0; c.position.set(-0.4 + (q[1] - 0.5) * 2.4, 3.2 - k * 3.0, -3.6 + (q[2] - 0.5) * 1.2); c.rotation.set(t * 3 + i, t * 2, i); }); }
  Q1.position.set(-0.4, 2.2, -3.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tRough.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tRough.visible = false; tMoney.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.4, -0.2, u), lerp(1.9, 2.0, u), lerp(2.6, 2.0, u), -0.1, 1.3, -3.8, 60);
  return qs;
}
function shotStation(t) { // 2段目 9〜17：主人公は、故郷を離れてある世界に入った青年。目的は、金だけ。興味は、まったくない
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.15;
  TRAIN2.position.x = AX + 20 - ease(clamp(t / 4.5)) * 20;
  kiyo2.userData.head.rotation.y = t < 4 ? -0.6 : Math.sin(t * 0.8) * 0.2; kiyo2.userData.arms[0].rotation.x = t > 4.2 ? -0.3 : 0;
  tLeave.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLeave.visible = false; tOnly.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(1.2, 0.8, u), lerp(2.5, 2.6, u), lerp(2.6, 1.8, u), AX - 0.2, 2.0, -2.6, 62);
  return qs;
}
function shotDawn(t) { // 3段目 17〜25：朝はまだ暗いうちから、きびしい稽古。上下関係は、ぜったい
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.75; S.darken(0.35, '#1a2440');
  const bow = t > 4.2 ? ease(clamp((t - 4.2) / 0.6)) : 0;
  ROW3.forEach((p, i) => { p.rotation.x = 0.45 * bow; p.userData.head.rotation.x = 0.2 * bow; });
  kiyo3.userData.arms[0].rotation.x = t < 3.4 ? -2.6 : -0.2; kiyo3.userData.head.rotation.x = t < 3.4 ? -0.3 : 0;
  kiyo3.userData.arms[1].rotation.x = -0.5 + Math.sin(t * 3) * 0.15;
  tDawn.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDawn.visible = false; tRank.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.8, 1.2, u), lerp(2.4, 2.5, u), lerp(2.6, 1.8, u), BX - 0.2, 1.7, -5, 62);
  return qs;
}
function shotGlare(t) { // 4段目 25〜33：態度は最悪。まわりは敵だらけ。それでも、才能だけは本物だった
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = t > 4.3 ? 0.35 : 0.7; S.darken(t > 4.3 ? 0.7 : 0.45, '#06060a');
  kiyo4.userData.arms[0].rotation.set(-1.3, 0, -0.7); kiyo4.userData.arms[1].rotation.set(-1.3, 0, 0.7);
  kiyo4.userData.head.rotation.y = Math.sin(t * 0.9) * 0.3;
  RING4.forEach((p, i) => { p.userData.head.rotation.x = -0.1; p.position.y = Math.sin(t * 2 + i) * 0.01; });
  SPOT4.visible = t > 4.3; SPOT4.material.opacity = 0.18 * clamp((t - 4.3) / 0.4);
  tEnemy.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tEnemy.visible = false; tTalent.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(2.0, 2.1, u), lerp(2.8, 2.0, u), CX, 1.5, -3.6, 64);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2023年の日本のドラマ。舞台は、1500年以上続く伝統の世界
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t2023.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2023.visible = false; t1500.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.8, u), lerp(4.8, 3.8, u), TX, 2.8, -4.6, 66);
  return qs;
}
function shotRing(t) { // 6段目 42〜49（決め手）：ヤンキー力士が、土俵で暴れまわる。タイトルは、神聖な場所という意味
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.9; S.darken(0.4, '#0a0808');
  const sq = 0.5 + Math.sin(t * 2.2) * 0.1; [rik6a, rik6b].forEach(p => { p.userData.legs[0].rotation.z = -0.5; p.userData.legs[1].rotation.z = 0.5; p.userData.arms.forEach(a => a.rotation.x = -0.6); p.rotation.x = 0; p.position.y = 0.6 - sq * 0.12; });
  rik6a.userData.arms[1].rotation.x = t < 1.6 ? -2.4 : -0.6;
  SALT6.forEach((s, i) => { const q = s.userData.p; const k = clamp((t - 0.6) / 1.6); s.visible = k > 0 && k < 1; s.position.set(DX - 1.0 + k * (0.6 + q[0] * 1.2), 3.0 + k * 0.8 - k * k * 2.6 + q[1] * 0.3, -2.6 + (q[2] - 0.5) * 1.0); });
  if (t < 3.6) tYan.userData.pop((t - 0.3) / 0.35); else tHoly.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.2, u), lerp(2.6, 2.4, u), lerp(3.6, 2.6, u), DX, 1.8, -3.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（家の前に戻る）
  shotOffer(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotOffer(t, 0) },
  { a: 9, b: 17, f: shotStation },
  { a: 17, b: 25, f: shotDawn },
  { a: 25, b: 33, f: shotGlare },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotRing },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '荒れた毎日を送る青年に、<br>うまい話が舞いこんだ。'],
  [5.6, 9.0, '大金を稼げるぞ、と<br>口説かれて…'],
  [9.2, 13.2, '主人公は、故郷を離れて<br>ある世界に入った青年。'],
  [13.2, 17.0, '目的は、金だけ。<br>興味は、まったくない。'],
  [17.2, 21.0, '朝はまだ暗いうちから、<br>きびしい稽古。'],
  [21.0, 25.0, '上下関係は、<br>ぜったい。'],
  [25.2, 29.0, '態度は最悪。<br>まわりは敵だらけ。'],
  [29.0, 33.0, 'それでも、才能だけは<br>本物だった。'],
  [33.2, 37.4, '2023年の、<br>日本のドラマ。'],
  [37.4, 41.8, '舞台は、1500年以上<br>続く伝統の世界。'],
  [42.2, 45.4, '金髪のヤンキー力士が、<br>土俵で暴れまわる。'],
  [45.4, 49.0, 'タイトルは、<br>神聖な場所という意味。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>サンクチュアリ 聖域。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q117', v2: true, answer: 'サンクチュアリ -聖域-',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 11710,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 4.4, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '荒れた': 'あれた', '毎日': 'まいにち', '送る': 'おくる', '青年': 'せいねん', '話': 'はなし', '舞いこんだ': 'まいこんだ', '大金': 'たいきん', '稼げる': 'かせげる', '口説かれて': 'くどかれて', '主人公': 'しゅじんこう', '故郷': 'こきょう', '離れて': 'はなれて', '世界': 'せかい', '入った': 'はいった', '目的': 'もくてき', '金だけ': 'かねだけ', '興味': 'きょうみ', '朝': 'あさ', '暗い': 'くらい', '稽古': 'けいこ', '上下関係': 'じょうげかんけい', '態度': 'たいど', '最悪': 'さいあく', '敵': 'てき', '才能': 'さいのう', '本物': 'ほんもの', '2023年': 'にせんにじゅうさんねん', '日本': 'にほん', '舞台': 'ぶたい', '1500年以上': 'せんごひゃくねんいじょう', '続く': 'つづく', '伝統': 'でんとう', '金髪': 'きんぱつ', '力士': 'りきし', '土俵': 'どひょう', '暴れまわる': 'あばれまわる', '神聖な': 'しんせいな', '場所': 'ばしょ', '意味': 'いみ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '聖域': 'せいいき', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n荒れた毎日を送る青年に、うまい話が舞いこんだ。大金を稼げるぞ、と口説かれて…。主人公は、故郷を離れてある世界に入った青年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'ドラマ好き', '日本のドラマ', 'ネトフリ'],
  },
});
applyQuizCards({ answer: 'サンクチュアリ<br><span style="font-size:72px">-聖域-</span>', info: 'Netflix｜日本のドラマ・全8話', answerSize: 112 });
