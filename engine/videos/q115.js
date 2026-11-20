import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #115 天使にラブ・ソングを…（映画・アメリカ・1992年製作・日本公開1993年4月17日・100分。Disney+・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/tian-shi-nirabusonguwo（Disney Plus, Hulu で配信中）と
//   Filmarks の動画配信欄（ディズニープラス・Hulu 見放題）で2026/11/20確認。Filmarks 4.1・レビュー228,268件 filmarks.com/movies/19506）
// 確かめた事実（Filmarks の作品紹介 filmarks.com/movies/19506、Wikipedia 日本語版 天使にラブ・ソングを… の 冒頭・あらすじ。2026/11/20）：
//   ・ギャングに命を狙われ修道院に匿われることになったクラブ歌手が、堅苦しい修道院の中で変革を起こしていくハートフル・コメディ（Filmarks）
//   ・リノのクラブで歌うしがないクラブ歌手が、愛人のマフィアのボスが人を殺す現場を見てしまい、警察に駆け込む。
//     証人保護で女子修道院に匿われ、尼僧として振る舞うことになる。厳格な修道院長とは第一印象から最悪（Wikipedia）
//   ・下手な聖歌隊の指導を任され、聖歌をゴスペルやロック風にアレンジして町中の人気者に（Wikipedia）
//   ・1992年のアメリカのコメディ映画。主演 ウーピー・ゴールドバーグ。アメリカで6か月のロングラン。翌1993年に続編（Wikipedia）
// 構成（ヒント6段）：1 ある夜、恋人の部屋をのぞいたら、見てはいけないものを見た → 2 主人公は小さなクラブの売れない歌手・警察に守られて身をかくす
//   → 3 かくれ場所は高い塀に囲まれた古い建物・規則だらけ → 4 きびしいリーダーと衝突・下手な合唱をまかされる
//   → 5 1992年のアメリカのコメディ映画・6か月のロングラン → 6 決め手：修道女のふりをして聖歌隊をノリノリに・続編もヒット
// 結末・救出・法王の前の場面は言わない。登場人物の名前・クラブや修道院の名前・町の名前は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。殺しの場面は描かない（ドアのすき間の光と影だけ）。人は汎用の3D
const S = quizStage({ bg: '#1a1626', floor: '#2a2430', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(11510);

const DEL = { skin: '#8a5a3c', hair: '#1a1410', shirt: '#7a3ab0', pants: '#7a3ab0', long: true, skirt: true };
const NUN = { skin: '#f1c9a5', hair: '#1a1a1e', shirt: '#1e1e24', pants: '#1e1e24', skirt: true };
const COP = { skin: '#e8b98f', hair: '#2a2420', shirt: '#2a3a6a', pants: '#2a3048' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
// 修道女の頭巾（黒いベールと白いふち）。makePerson の頭に足す
function veil(p) { const h = p.userData.head;
  const v = box(0.5, 0.6, 0.46, mat('#141418')); v.position.set(0, 0.3, -0.05); h.add(v);
  const band = box(0.44, 0.08, 0.06, mat('#f4f4f0')); band.position.set(0, 0.47, 0.2); h.add(band);
  for (const s of [-1, 1]) { const sd = box(0.04, 0.4, 0.06, mat('#f4f4f0')); sd.position.set(s * 0.21, 0.26, 0.19); h.add(sd); }
  const col = box(0.36, 0.1, 0.3, mat('#f4f4f0')); col.position.set(0, 1.47 - 1.5 + 0.0, 0.02); col.position.y = -0.04; h.add(col);
  const robe = box(0.56, 0.9, 0.36, mat('#1e1e24')); robe.position.y = 0.45; p.add(robe);
  return p; }
function nun(skin, x, z) { const p = veil(makePerson({ ...NUN, skin })); p.position.set(x, 0, z); qs.add(p); return p; }
function note(col) { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gl(col)); h.scale.set(1.3, 1, 1); g.add(h);
  const st = box(0.025, 0.36, 0.025, gl(col)); st.position.set(0.11, 0.18, 0); g.add(st); const fl = box(0.12, 0.04, 0.025, gl(col)); fl.position.set(0.16, 0.34, 0); g.add(fl); return g; }

// ---------- 1段目. 夜のクラブの裏の廊下（x=0）。少し開いたドアのすき間から光。のぞきこむ派手なドレスの女の人 ----------
{ const fl = box(10, 0.04, 8, mat('#3a2a2a')); fl.position.set(0, 0.02, -2); qs.add(fl); // 床
  const wl = box(10, 4, 0.2, mat('#4a3a44')); wl.position.set(0, 2, -5); qs.add(wl);
  const wl2 = box(0.2, 4, 8, mat('#3e3038')); wl2.position.set(-3.2, 2, -2); qs.add(wl2);
  for (let i = 0; i < 2; i++) { const lp = box(0.3, 0.3, 0.1, gl('#ffb860')); lp.position.set(2.9 + i * 1.2, 2.6, -4.88); qs.add(lp); }
  const rug = box(1.2, 0.02, 6, mat('#7a1a2a')); rug.position.set(0.4, 0.04, -2); qs.add(rug); }
const DOOR1 = box(1.0, 2.3, 0.08, mat('#6a4a34')); DOOR1.position.set(2.05, 1.15, -4.55); DOOR1.rotation.y = -0.9; qs.add(DOOR1);
const FRAME1 = box(1.3, 2.5, 0.06, mat('#2a1a14')); FRAME1.position.set(1.6, 1.25, -4.9); qs.add(FRAME1);
// ドアのすき間：中は暖かい光。人の影が2つ（だれかは見せない）
const GAP1 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.3), new THREE.MeshBasicMaterial({ map: canvasTex(200, 460, (g, w, h) => {
  g.fillStyle = '#ffe2a0'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, w, 60);
  g.fillStyle = '#1a0c0c'; for (const [x, s] of [[60, 1], [140, 0.92]]) { g.beginPath(); g.arc(x, 150 * s + 40, 24, 0, 7); g.fill(); g.fillRect(x - 32, 190, 64, 200); g.fillRect(x - 26, 390, 22, 70); g.fillRect(x + 4, 390, 22, 70); }
  g.fillRect(140 - 70, 205, 50, 16); }) }));
GAP1.position.set(1.6, 1.15, -4.86); qs.add(GAP1);
const SHAD1 = [];
const del1 = makePerson(DEL); del1.position.set(0.55, 0, -4.1); del1.rotation.y = Math.PI / 2; qs.add(del1);
const SPK1 = []; for (let i = 0; i < 10; i++) { const s = box(0.05, 0.05, 0.02, gl('#f0d0ff')); s.position.set((R() - 0.5) * 0.44, 0.9 + R() * 0.6, 0.15); del1.add(s); SPK1.push(s); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tSaw = tag('見ては、いけないものを…', { size: 54, w: 720, bg: '#14161c', sx: 2.2 }); tSaw.position.set(0.9, 2.95, -3.9); qs.add(tSaw);
const tHunt = tag('命を、ねらわれる身に', { size: 56, w: 640, bg: '#c8202c', sx: 2.0 }); tHunt.position.set(0.9, 2.95, -3.9); qs.add(tHunt);

// ---------- 2段目. 小さなクラブのステージ（x=50）。スポットライトの下で歌う3人。客席はがらがら ----------
const AX = 50;
{ const fl = box(16, 0.04, 14, mat('#2a1a22')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const st = box(6, 0.5, 2.6, mat('#5a2a3a')); st.position.set(AX, 0.25, -5.2); qs.add(st);
  const wl = box(16, 6, 0.2, mat('#2a1626')); wl.position.set(AX, 3, -6.6); qs.add(wl);
  const cur = box(6.6, 4.4, 0.1, mat('#8a1a2a')); cur.position.set(AX, 2.7, -6.45); qs.add(cur);
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gl(i % 2 ? '#ffd860' : '#ff8ac8')); b.position.set(AX - 3 + i * 0.86, 4.9, -6.3); qs.add(b); }
  for (let i = 0; i < 4; i++) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 18), mat('#3a2a30')); tb.position.set(AX - 3 + i * 2, 0.75, -0.6 - (i % 2) * 1.2); qs.add(tb);
    const lg = box(0.08, 0.72, 0.08, mat('#1a1418')); lg.position.set(tb.position.x, 0.36, tb.position.z); qs.add(lg);
    const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.16, 10), gl('#ffd890')); cn.position.set(tb.position.x, 0.86, tb.position.z); qs.add(cn); } }
const SING2 = [0, 1, 2].map(i => { const p = makePerson(i === 1 ? DEL : { ...DEL, skin: ['#c89a7a', '', '#e8b98f'][i], hair: '#3a2420', shirt: '#c83a8a', pants: '#c83a8a' }); p.position.set(AX - 1.0 + i * 1.0, 0.5, -5.0); qs.add(p); return p; });
const MIC2 = new THREE.Group(); { const pole = box(0.04, 1.4, 0.04, mat('#8a8e98')); pole.position.y = 0.7; MIC2.add(pole); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#2a2a2e')); hd.position.y = 1.45; MIC2.add(hd); }
MIC2.position.set(AX, 0.5, -4.55); qs.add(MIC2);
const SPOT2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 5.5, 24, 1, true), gl('#fff0c8', 0.16)); SPOT2.position.set(AX, 3.2, -5.0); qs.add(SPOT2);
const cop2 = makePerson(COP); cop2.position.set(AX + 2.6, 0, -2.4); cop2.rotation.y = -0.9; qs.add(cop2);
{ const cap = box(0.46, 0.12, 0.48, mat('#1a2448')); cap.position.set(0, 0.56, 0.02); cop2.userData.head.add(cap); const bd = box(0.1, 0.1, 0.02, gl('#e6c450')); bd.position.set(-0.12, 1.32, 0.15); cop2.add(bd); }
const tStar = tag('小さなクラブの、売れない歌手', { size: 50, w: 820, bg: '#14161c', sx: 3.8 }); tStar.position.set(AX + 0.7, 4.2, -4.2); qs.add(tStar);
const tHide = tag('警察に守られて、身をかくす', { size: 52, w: 780, bg: '#c8202c', sx: 3.6 }); tHide.position.set(AX + 0.5, 4.2, -4.2); qs.add(tHide);

// ---------- 3段目. 高い石の塀に囲まれた古い建物（x=100）。中庭を一列に歩く黒い服の人たち。鐘の塔 ----------
const BX = 100;
{ const gr = box(30, 0.04, 30, mat('#8a8676')); gr.position.set(BX, 0.02, -8); qs.add(gr);
  const bl = box(14, 7, 4, mat('#b8a888')); bl.position.set(BX, 3.5, -14); qs.add(bl);
  for (let i = 0; i < 6; i++) { const w = box(0.9, 1.8, 0.1, mat('#3a3a48')); w.position.set(BX - 5 + i * 2, 4.2, -11.95); qs.add(w);
    const ar = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16, 0, Math.PI), mat('#3a3a48')); ar.position.set(BX - 5 + i * 2, 5.1, -11.89); qs.add(ar); }
  const tw = box(2.4, 11, 2.4, mat('#a89878')); tw.position.set(BX + 5.6, 5.5, -13); qs.add(tw);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(1.9, 2.4, 4), mat('#6a4a3a')); rf.rotation.y = Math.PI / 4; rf.position.set(BX + 5.6, 12.2, -13); qs.add(rf);
  const roof = box(14.4, 0.4, 4.4, mat('#6a4a3a')); roof.position.set(BX, 7.2, -14); qs.add(roof);
  for (const s of [-1, 1]) { const wl = box(0.6, 4.2, 18, mat('#9a8a70')); wl.position.set(BX + s * 7.4, 2.1, -6); qs.add(wl); }
  const fr = box(5, 4.2, 0.6, mat('#9a8a70')); fr.position.set(BX - 4.9, 2.1, 2.6); qs.add(fr);
  const gate = box(4.6, 3.4, 0.2, mat('#2a2a2e')); gate.position.set(BX + 2.6, 1.7, 2.6); qs.add(gate);
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 8), mat('#3a5a3a')); t.position.set(BX - 5 + i * 2.5, 1.3, -10.6); qs.add(t); } }
const BELL3 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 16, 1, true), mat('#c8a040')); BELL3.position.set(BX + 5.6, 9.8, -11.7); qs.add(BELL3);
const LINE3 = [0, 1, 2, 3, 4].map(i => nun(['#f1c9a5', '#e8b98f', '#f4d3b5', '#d8a880', '#f1c9a5'][i], BX - 4 + i * 1.3, -7));
const tWall = tag('高い塀に囲まれた、古い建物', { size: 52, w: 780, bg: '#14161c', sx: 3.6 }); tWall.position.set(BX, 4.6, -7); qs.add(tWall);
const tRule = tag('朝は早く、規則だらけ', { size: 58, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.1 }); tRule.position.set(BX, 4.6, -7); qs.add(tRule);

// ---------- 4段目. 古い建物の中（x=150）。長いいすの前で合唱する黒い服の人たち。音はばらばら。腕を組む、きびしいリーダー ----------
const CX = 150;
{ const fl = box(14, 0.04, 12, mat('#6a5040')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#c8b898')); wl.position.set(CX, 4, -6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.6), new THREE.MeshBasicMaterial({ map: canvasTex(110, 260, (g, w, h) => {
      const cs = ['#c83a3a', '#3a6ac8', '#e6b450', '#3aa86a']; for (let y = 0; y < 6; y++) for (let x = 0; x < 3; x++) { g.fillStyle = cs[(x + y + i) % 4]; g.fillRect(x * 37, y * 44, 36, 43); } }) }));
    w.position.set(CX - 3.6 + i * 3.6, 4.6, -5.88); qs.add(w); }
  for (let r = 0; r < 3; r++) { const pw = box(5, 0.5, 0.5, mat('#5a3a28')); pw.position.set(CX - 3.2, 0.5, 1.4 + r * 1.3); qs.add(pw); const pb = box(5, 0.8, 0.1, mat('#5a3a28')); pb.position.set(CX - 3.2, 0.9, 1.65 + r * 1.3); qs.add(pb); } }
const CHOIR4 = []; for (let i = 0; i < 6; i++) { const p = nun(['#f1c9a5', '#e8b98f', '#f4d3b5', '#d8a880', '#f1c9a5', '#e8c4a0'][i], CX - 2.5 + (i % 3) * 1.1, -3.6 - Math.floor(i / 3) * 0.9); p.position.y = Math.floor(i / 3) * 0.3; CHOIR4.push(p); }
{ const st = box(4, 0.3, 1, mat('#5a3a28')); st.position.set(CX - 1.4, 0.15, -4.5); qs.add(st); }
const boss4 = nun('#f4e0cc', CX + 1.25, -1.3); boss4.rotation.y = -1.1;
const del4 = veil(makePerson({ ...NUN, skin: DEL.skin })); del4.position.set(CX + 0.4, 0, -1.9); del4.rotation.y = 0.6; qs.add(del4);
const BAD4 = []; for (let i = 0; i < 7; i++) { const n = note(i % 2 ? '#ff6a6a' : '#c8c8d0'); n.userData.p = [R(), R(), R()]; qs.add(n); BAD4.push(n); }
const tClash = tag('きびしいリーダーと、衝突', { size: 54, w: 700, bg: '#14161c', sx: 3.4 }); tClash.position.set(CX, 3.55, -3.6); qs.add(tClash);
const tChoir = tag('下手な合唱を、まかされた', { size: 54, w: 720, bg: '#c8202c', sx: 3.4 }); tChoir.position.set(CX, 3.55, -3.6); qs.add(tChoir);

// ---------- 5段目. 映画館（x=200）。スクリーンに、坂の多い明るい町と、レトロな車 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1e1a22')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#2a2230')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#5a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7ab8e8'); gr.addColorStop(1, '#f0e0c0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#8a9a6a'; g.beginPath(); g.moveTo(0, 360); g.lineTo(0, 230); g.lineTo(720, 120); g.lineTo(720, 360); g.fill();
  const cs = ['#f0d8b8', '#e8c0c8', '#c8d8e8', '#f0e8c0', '#d8c8e8'];
  for (let i = 0; i < 9; i++) { const x = 20 + i * 78, y = 222 - i * 13.5; g.fillStyle = cs[i % 5]; g.fillRect(x, y - 90, 66, 90); g.fillStyle = '#5a6a8a'; g.fillRect(x + 10, y - 74, 16, 20); g.fillRect(x + 40, y - 74, 16, 20); g.fillRect(x + 10, y - 44, 16, 20); g.fillRect(x + 40, y - 44, 16, 20); }
  g.fillStyle = '#5a5a60'; g.beginPath(); g.moveTo(0, 300); g.lineTo(720, 170); g.lineTo(720, 200); g.lineTo(0, 330); g.fill();
  g.fillStyle = '#c83a3a'; g.fillRect(300, 230, 80, 30); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(315, 262, 9, 0, 7); g.arc(365, 262, 9, 0, 7); g.fill(); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t1992 = tag('1992年の、アメリカ映画', { size: 56, w: 700, bg: '#e6b450', color: '#14161c', sx: 4.6 }); t1992.position.set(TX, 6.4, -4.4); qs.add(t1992);
const tRun = tag('6か月の、ロングラン', { size: 58, w: 640, bg: '#c8202c', sx: 4.4 }); tRun.position.set(TX, 6.4, -4.4); qs.add(tRun);

// ---------- 6段目. 色とりどりの光の中（x=250）。黒い服の聖歌隊が手をたたいて体をゆらす。いちばん前で歌う主人公。音符が飛ぶ ----------
const DX = 250;
{ const fl = box(16, 0.04, 14, mat('#6a4a34')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(16, 9, 0.2, mat('#d8c8a8')); wl.position.set(DX, 4.5, -7); qs.add(wl);
  const rose = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g, w, h) => {
    const cs = ['#e83a3a', '#3a7ae8', '#f0c040', '#3ac86a', '#c83ae8', '#f08a3a'];
    for (let i = 0; i < 12; i++) { g.fillStyle = cs[i % 6]; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 128, i * Math.PI / 6, (i + 1) * Math.PI / 6); g.fill(); }
    g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(128, 128, 30, 0, 7); g.fill(); }) }));
  rose.position.set(DX, 6.6, -6.88); qs.add(rose);
  const st = box(7, 0.3, 1.2, mat('#5a3a28')); st.position.set(DX, 0.15, -5.4); qs.add(st);
  const st2 = box(7, 0.6, 1.2, mat('#5a3a28')); st2.position.set(DX, 0.3, -6.3); qs.add(st2); }
const CHOIR6 = []; for (let i = 0; i < 10; i++) { const r = i < 5 ? 0 : 1; const p = nun(['#f1c9a5', '#e8b98f', '#f4d3b5', '#d8a880', '#e8c4a0'][i % 5], DX - 2.6 + (i % 5) * 1.3, -5.3 - r * 0.9); p.position.y = 0.3 + r * 0.3; p.userData.y0 = p.position.y; CHOIR6.push(p); }
const del6 = veil(makePerson({ ...NUN, skin: DEL.skin })); del6.position.set(DX + 0.3, 0, -4.1); del6.rotation.y = 0; qs.add(del6);
const BEAM6 = ['#ff6a6a', '#6aa8ff', '#ffd86a'].map((c, i) => { const b = new THREE.Mesh(new THREE.ConeGeometry(1.4, 8, 20, 1, true), gl(c, 0.12)); b.position.set(DX - 2.8 + i * 2.8, 4.2, -4.4); qs.add(b); return b; });
const NOTE6 = []; for (let i = 0; i < 12; i++) { const n = note(['#ffd86a', '#ff8ac8', '#8ad8ff'][i % 3]); n.userData.p = [R(), R(), R()]; qs.add(n); NOTE6.push(n); }
const tNun = tag('修道女のふりで、ノリノリ', { size: 54, w: 720, bg: '#14161c', sx: 3.3 }); tNun.position.set(DX, 4.6, -3.6); qs.add(tNun);
const tSeq = tag('続編も、大ヒット', { size: 60, w: 560, bg: '#e6b450', color: '#14161c', sx: 2.9 }); tSeq.position.set(DX, 4.6, -3.6); qs.add(tSeq);

// ---------- shots ----------
const ALL = [tSaw, tHunt, tStar, tHide, tWall, tRule, tClash, tChoir, t1992, tRun, tNun, tSeq, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotPeek(t, quiz = 0) { // 1段目 0〜9：ある夜、恋人の部屋をのぞいたら、見てはいけないものを見てしまった（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#0a0608');
  const k = quiz ? 0.5 : clamp((t - 1.0) / 2.0);
  del1.position.x = 0.55 + ease(k) * 0.4; del1.userData.head.rotation.y = -ease(k) * 0.35; del1.rotation.z = -ease(k) * 0.06;
  const jump = quiz ? 0 : ease(clamp((t - 5.2) / 0.4));
  del1.userData.arms.forEach(a => a.rotation.x = -jump * 2.3); del1.userData.arms[0].rotation.z = jump * 0.3; del1.userData.arms[1].rotation.z = -jump * 0.3;
  del1.position.x -= jump * 0.7; del1.rotation.y = Math.PI / 2 - jump * 0.9; del1.rotation.z *= (1 - jump);
  SPK1.forEach((s, i) => s.visible = Math.floor(t * 6 + i) % 3 !== 0);
  if (jump > 0) S.darken(0.3 + jump * 0.25, '#2a0408');
  Q1.position.set(-0.1, 2.15, -3.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tSaw.userData.pop((t - 1.6) / 0.35); if (t > 5.1) tSaw.visible = false; tHunt.userData.pop((t - 5.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.2, 0.1, u), lerp(1.7, 1.75, u), lerp(0.4, -0.2, u), 1.0, 1.45, -4.6, 60);
  return qs;
}
function shotStage(t) { // 2段目 9〜17：主人公は、小さなクラブの売れない歌手。警察に守られて、身をかくすことに
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 0.6; S.darken(0.5, '#08040a');
  SING2.forEach((p, i) => { const sw = Math.sin(t * 4 + i * 0.6); p.rotation.z = sw * 0.06; p.userData.arms.forEach((a, k) => a.rotation.x = -0.5 + Math.sin(t * 4 + i + k * 3) * 0.4); });
  SING2[1].userData.arms[0].rotation.x = -1.6;
  cop2.visible = t > 3.8; cop2.position.x = AX + 2.6 - ease(clamp((t - 3.8) / 1.5)) * 1.0; poseWalk(cop2, t * 6, t < 5.3 ? 0.6 : 0);
  tStar.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStar.visible = false; tHide.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.8, 1.6, u), lerp(1.9, 2.1, u), lerp(2.6, 2.0, u), AX + 0.4, 1.9, -5, 62);
  return qs;
}
function shotWall(t) { // 3段目 17〜25：かくれ場所は、高い塀に囲まれた古い建物。朝は早く、規則は厳しい。おしゃべりも禁止
  base(); S.aim(BX, -8); lift(0); S.hemi.intensity = 1.1; S.darken(0.15, '#c8d8e8');
  LINE3.forEach((p, i) => { p.position.x = BX + (i % 2 ? 0.75 : -0.75); p.position.z = -8.5 + Math.floor(i / 2) * -1.6 + 0.6 + t * 0.2 + (i % 2) * 0.5; p.rotation.y = 0; poseWalk(p, t * 4 + i, 0.3); });
  BELL3.rotation.z = Math.sin(t * 2.4) * 0.3;
  tWall.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWall.visible = false; tRule.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.6, 0.2, u), 1.35, lerp(-1.0, -1.8, u), BX, 2.7, -11, 64);
  return qs;
}
function shotChoir(t) { // 4段目 25〜33：きびしいリーダーとは、最初から衝突。まかされたのは、ひどく下手な合唱
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.0;
  boss4.userData.arms.forEach(a => { a.rotation.x = -1.3; }); boss4.userData.arms[0].rotation.z = -0.6; boss4.userData.arms[1].rotation.z = 0.6;
  boss4.userData.head.rotation.y = Math.sin(t * 1.2) * 0.15;
  del4.userData.arms[1].rotation.x = t > 4.2 ? -1.8 + Math.sin(t * 6) * 0.3 : -0.4; del4.userData.head.rotation.z = t > 4.2 ? 0 : 0.15;
  CHOIR4.forEach((p, i) => { p.userData.head.rotation.z = Math.sin(t * (3 + i) + i) * 0.12; });
  BAD4.forEach((n, i) => { const q = n.userData.p; const k = ((t * 0.4 + q[0]) % 1); n.visible = t > 4.3; n.position.set(CX - 2.6 + q[1] * 2.6 + Math.sin(t * 7 + i) * 0.1, 2.4 + k * 1.8, -3.6 + q[2] * 0.6); n.rotation.z = Math.sin(t * 9 + i) * 0.6; });
  tClash.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tClash.visible = false; tChoir.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.2, 0.2, u), lerp(2.7, 2.8, u), lerp(4.6, 4.0, u), CX + 0.1, 1.2, -3.4, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1992年のアメリカのコメディ映画。アメリカで6か月のロングランになった
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t1992.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1992.visible = false; tRun.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.8, 6.0, u), TX, 3.6, -4.8, 68);
  return qs;
}
function shotGospel(t) { // 6段目 42〜49（決め手）：修道女のふりをして、聖歌隊をノリノリに。続編もヒットした、音楽コメディの名作
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.9; S.darken(0.35, '#1a0a20');
  CHOIR6.forEach((p, i) => { const b = Math.sin(t * 7 + (i % 2) * Math.PI); p.rotation.z = b * 0.12; p.position.y = p.userData.y0 + Math.abs(Math.sin(t * 7 + i)) * 0.08;
    const clap = Math.abs(Math.sin(t * 7)); p.userData.arms[0].rotation.x = -1.4; p.userData.arms[1].rotation.x = -1.4; p.userData.arms[0].rotation.z = -0.5 * clap; p.userData.arms[1].rotation.z = 0.5 * clap; });
  del6.userData.arms[0].rotation.x = -2.4 + Math.sin(t * 7) * 0.4; del6.userData.arms[1].rotation.x = -2.4 - Math.sin(t * 7) * 0.4; del6.rotation.z = Math.sin(t * 3.5) * 0.08;
  BEAM6.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.6 + i * 2) * 0.35; });
  NOTE6.forEach((n, i) => { const q = n.userData.p; const k = ((t * 0.35 + q[0]) % 1); n.position.set(DX - 3.4 + q[1] * 6.8, 2.2 + k * 3.6, -4.4 + q[2] * 1.2); n.rotation.z = Math.sin(t * 3 + i) * 0.4; n.scale.setScalar(0.9 + q[2] * 0.6); });
  if (t < 3.6) tNun.userData.pop((t - 0.3) / 0.35); else tSeq.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-1.0, -0.4, u), lerp(2.4, 2.5, u), lerp(2.8, 2.0, u), DX + 0.2, 2.2, -5.4, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（廊下に戻る）
  shotPeek(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotPeek(t, 0) },
  { a: 9, b: 17, f: shotStage },
  { a: 17, b: 25, f: shotWall },
  { a: 25, b: 33, f: shotChoir },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotGospel },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.4, 'ある夜、恋人の部屋を<br>のぞいたら…'],
  [5.4, 9.0, '見てはいけないものを見て、<br>命をねらわれる身に。'],
  [9.2, 13.2, '主人公は、小さなクラブの<br>売れない歌手。'],
  [13.2, 17.0, '警察に守られて、<br>身をかくすことに。'],
  [17.2, 21.0, 'かくれ場所は、高い塀に<br>囲まれた古い建物。'],
  [21.0, 25.0, '朝は早く、規則は厳しい。<br>おしゃべりも禁止。'],
  [25.2, 29.0, 'きびしいリーダーとは、<br>最初から衝突。'],
  [29.0, 33.0, 'まかされたのは、<br>ひどく下手な合唱。'],
  [33.2, 37.4, '1992年の、<br>アメリカのコメディ映画。'],
  [37.4, 41.8, 'アメリカでは、<br>6か月のロングランに。'],
  [42.2, 45.4, '修道女のふりをして、<br>聖歌隊をノリノリに。'],
  [45.4, 49.0, '続編もヒットした、<br>音楽コメディの名作。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>天使にラブ・ソングを。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q115', v2: true, answer: '天使にラブ・ソングを…',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 11510,
    hits: [5.4, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 4.4, 5.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '夜': 'よる', '恋人': 'こいびと', '部屋': 'へや', '見て': 'みて', '命': 'いのち', '身': 'み', '主人公': 'しゅじんこう', '小さな': 'ちいさな', '売れない': 'うれない', '歌手': 'かしゅ', '警察': 'けいさつ', '守られて': 'まもられて', '身をかくす': 'みをかくす', '高い塀': 'たかいへい', '囲まれた': 'かこまれた', '古い建物': 'ふるいたてもの', '朝': 'あさ', '早く': 'はやく', '規則': 'きそく', '厳しい': 'きびしい', '禁止': 'きんし', '最初': 'さいしょ', '衝突': 'しょうとつ', '下手な': 'へたな', '合唱': 'がっしょう', '1992年': 'せんきゅうひゃくきゅうじゅうにねん', '映画': 'えいが', '6か月': 'ろっかげつ', '修道女': 'しゅうどうじょ', '聖歌隊': 'せいかたい', '続編': 'ぞくへん', '音楽': 'おんがく', '名作': 'めいさく', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '天使': 'てんし', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nある夜、恋人の部屋をのぞいたら…。見てはいけないものを見て、命をねらわれる身に。主人公は、小さなクラブの売れない歌手。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'Hulu', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: '天使に<br>ラブ・ソングを…', info: 'Disney+・Hulu｜映画・100分', answerSize: 110 });
