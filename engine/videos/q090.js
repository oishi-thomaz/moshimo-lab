import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #090 ジュラシック・パーク（映画・アメリカ・1993年・127分。Prime Video・U-NEXT・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/ziyurashitsukupaku で2026/11/15確認（Filmarks の動画配信欄も Prime Video・U-NEXT・Hulu 見放題）。
//   Filmarks 3.9・レビュー182,369件 filmarks.com/movies/29105）
// 確かめた事実（Filmarks の作品紹介、ja.wikipedia.org/wiki/ジュラシック・パーク_(映画)。2026/11/15）：
//   ・島に、生きた恐竜が歩き回るテーマパークが造られた。その安全性を確かめるため、さまざまな分野の専門家が島に招かれる（Filmarks）
//   ・主人公は古生物学者（Filmarks）。映画では当初は子ども嫌い（Wikipedia 登場人物）
//   ・パークは高電圧の柵に囲まれ、コンピューターで管理されていて安全と思われた（Filmarks）
//   ・社長の孫ふたりも加わって、パーク内を見学するツアーへ。予期せぬトラブルが起きる（Filmarks）
//   ・1993年のアメリカの SF 映画、スティーヴン・スピルバーグ監督。アカデミー賞3部門を含む20以上の賞（Wikipedia）
//   ・最新クローン技術で、恐竜を現代によみがえらせた（Filmarks）
// 構成（ヒント6段）：1 海に浮かぶ島・オープン前のテーマパーク・安全か確かめに専門家が呼ばれた → 2 主人公は化石を掘る学者・子どもがちょっと苦手
//   → 3 ジャングルに見上げるほど高い柵・電気が流れコンピューターで管理 → 4 社長の孫ふたりも見学ツアーへ・予期せぬトラブル
//   → 5 1993年のアメリカ映画・スピルバーグ監督のSFアドベンチャー → 6 決め手：大昔のDNAからよみがえらせたのは、絶滅した恐竜
// トラブルの中身・誰が生き残るか・結末は言わない。人物名・島の名前・会社名・パークの門やロゴ（骨の絵）は出さない。
// 有名な場面（コップの水が揺れる・琥珀の蚊の杖・門が開く場面）はなぞらない。俳優の顔・ポスター・ロゴは使わない。恐竜は6段目まで見せない
const S = quizStage({ bg: '#20303a', floor: '#2a3a2a', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(9090);

const DR = { skin: '#f1c9a5', hair: '#8a6a4a', shirt: '#4a6a8a', pants: '#8a7a5a' };      // 主人公（学者）
const DR2 = { skin: '#f4d3b5', hair: '#e0c08a', shirt: '#e8a8a8', pants: '#7a8a9a', long: true };
const DR3 = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#1a1a1e', pants: '#1a1a1e' };
const KID1 = { skin: '#f4d3b5', hair: '#e0c08a', shirt: '#c84a6a', pants: '#3a4a6a', long: true, scale: 0.72 };
const KID2 = { skin: '#f4d3b5', hair: '#8a6a4a', shirt: '#3a8a5a', pants: '#3a4a6a', scale: 0.62 };
const JG = ['#1e4a2a', '#2a5a30', '#1a3e24', '#2e6a3a'];

// ジャングルの木（幹＋丸い葉のかたまり）とヤシ
function jungleTree(x, z, s = 1) { const g = new THREE.Group();
  const tk = box(0.25, 2.2, 0.25, mat('#4a3424')); tk.position.y = 1.1; g.add(tk);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.9 + R() * 0.4, 10, 8), mat(JG[k % 4])); b.position.set((R() - 0.5) * 1.2, 2.3 + R() * 0.9, (R() - 0.5) * 1.0); g.add(b); }
  g.position.set(x, 0, z); g.scale.setScalar(s); qs.add(g); return g; }
function palm(x, z, s = 1, y = 0) { const g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const t = box(0.16, 0.5, 0.16, mat('#6a4a2a')); t.position.set(i * 0.05, 0.25 + i * 0.48, 0); t.rotation.z = -0.05 * i; g.add(t); }
  for (let i = 0; i < 6; i++) { const l = box(1.3, 0.04, 0.3, mat('#2e7a3a')); const a = i / 6 * Math.PI * 2; l.position.set(0.25 + Math.cos(a) * 0.6, 2.45, Math.sin(a) * 0.6); l.rotation.y = -a; l.rotation.z = -0.35; g.add(l); }
  g.position.set(x, y, z); g.scale.setScalar(s); qs.add(g); return g; }
function helicopter() { const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), mat('#e8e4d8')); b.scale.set(1.4, 0.8, 0.8); g.add(b);
  const w = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), mat('#3a5a7a')); w.scale.set(1, 0.6, 0.72); w.position.set(0.5, 0.08, 0); g.add(w);
  const tl = box(1.6, 0.16, 0.16, mat('#e8e4d8')); tl.position.set(-1.3, 0.12, 0); g.add(tl);
  const fin = box(0.3, 0.5, 0.05, mat('#c8402c')); fin.position.set(-2.05, 0.35, 0); g.add(fin);
  const st = box(0.06, 0.25, 0.06, mat('#2a2a2e')); st.position.y = 0.55; g.add(st);
  const rot = new THREE.Group(); for (let i = 0; i < 2; i++) { const bl = box(3.6, 0.03, 0.14, mat('#2a2a2e')); bl.rotation.y = i * Math.PI / 2; rot.add(bl); } rot.position.y = 0.68; g.add(rot);
  for (const s of [-1, 1]) { const sk = box(1.4, 0.05, 0.06, mat('#2a2a2e')); sk.position.set(0, -0.6, s * 0.42); g.add(sk); }
  g.userData.rot = rot; return g; }
function jeep(col = '#c8402c') { const g = new THREE.Group();
  const b = box(2.2, 0.6, 1.2, mat('#e8e0cc')); b.position.y = 0.6; g.add(b);
  const stripe = box(2.22, 0.14, 1.22, mat(col)); stripe.position.y = 0.62; g.add(stripe);
  const cab = box(1.3, 0.55, 1.15, new THREE.MeshStandardMaterial({ color: '#8ab0c8', transparent: true, opacity: 0.55 })); cab.position.set(-0.1, 1.17, 0); g.add(cab);
  const roof = box(1.4, 0.06, 1.2, mat('#e8e0cc')); roof.position.set(-0.1, 1.47, 0); g.add(roof);
  for (const [x, z] of [[0.7, 0.6], [-0.7, 0.6], [0.7, -0.6], [-0.7, -0.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 14), mat('#1a1a1e')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.28, z); g.add(w); }
  const lt = []; for (const z of [-0.4, 0.4]) { const l = box(0.04, 0.12, 0.18, new THREE.MeshBasicMaterial({ color: '#fff4c0' })); l.position.set(1.11, 0.7, z); g.add(l); lt.push(l); }
  g.userData.lights = lt; return g; }

// ---------- 1段目. 海に浮かぶ島（x=0）。ヘリコプターが近づく。島の上に「？」 ----------
{ const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mat('#2a6a8a')); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.02, -20); qs.add(sea);
  const isl = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#2a5a30')); isl.scale.set(1.3, 0.5, 0.8); isl.position.set(0, 0, -26); qs.add(isl);
  const mt = new THREE.Mesh(new THREE.ConeGeometry(5, 7, 10), mat('#3a5a3a')); mt.position.set(-4, 5, -30); qs.add(mt);
  const mt2 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 5, 10), mat('#2e4e30')); mt2.position.set(4, 4, -29); qs.add(mt2);
  const beach = new THREE.Mesh(new THREE.CylinderGeometry(11.8, 12.2, 0.2, 32), mat('#d8c890')); beach.scale.set(1, 1, 0.66); beach.position.set(0, 0.05, -26); qs.add(beach);
  for (let i = 0; i < 9; i++) palm(-9 + i * 2.2 + (R() - 0.5), -19.6 + R() * 0.8, 1.2 + R() * 0.4, 0.1);
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1.2 + R(), 10, 8), mat(JG[i % 4])); b.position.set(-10 + i * 1.5, 2.2 + R() * 1.5, -25 + R() * 3); qs.add(b); }
  for (let i = 0; i < 12; i++) { const w = box(0.8 + R(), 0.02, 0.1, mat('#8ac8e0')); w.position.set((R() - 0.5) * 30, 0.05, -4 - R() * 12); qs.add(w); } }
const HELI = helicopter(); qs.add(HELI);
const FOG1 = []; for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(2 + R() * 1.5, 10, 8), new THREE.MeshBasicMaterial({ color: '#e8eef4', transparent: true, opacity: 0.35 })); f.scale.y = 0.35; f.position.set(-10 + i * 4, 6.5 + R() * 1.5, -24); qs.add(f); FOG1.push(f); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 1.6 }); Q1.position.set(1.5, 7.4, -21); qs.add(Q1);
const tPark = tag('オープン前の、テーマパーク', { size: 54, w: 760, bg: '#14161c', sx: 3.4 }); tPark.position.set(0, 6.4, -6); qs.add(tPark);
const tSafe = tag('安全か、確かめて', { size: 62, w: 560, bg: '#c8202c', sx: 2.8 }); tSafe.position.set(0, 6.4, -6); qs.add(tSafe);

// ---------- 2段目. 乾いた発掘現場（x=40）。ハケで土を払う学者。近づく子ども、一歩さがる学者 ----------
const AX = 40;
{ const gr = box(16, 0.06, 12, mat('#c8a070')); gr.position.set(AX, 0.03, -3); qs.add(gr);
  for (let i = 0; i < 5; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(3 + R() * 2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(['#b8885a', '#a87a50', '#c89868'][i % 3])); h.scale.y = 0.45; h.position.set(AX - 8 + i * 4, 0, -10 - R() * 2); qs.add(h); }
  const pit = box(3.2, 0.04, 1.8, mat('#9a7048')); pit.position.set(AX, 0.07, -1.8); qs.add(pit);
  for (const [x, z] of [[-1.6, -0.9], [1.6, -0.9], [-1.6, 0.9], [1.6, 0.9]]) { const st = box(0.05, 0.4, 0.05, mat('#e8e0cc')); st.position.set(AX + x, 0.2, -1.8 + z); qs.add(st); }
  for (const z of [-0.9, 0.9]) { const rp = box(3.2, 0.015, 0.015, mat('#e8e0cc')); rp.position.set(AX, 0.36, -1.8 + z); qs.add(rp); }
  for (const x of [-1.6, 1.6]) { const rp = box(0.015, 0.015, 1.8, mat('#e8e0cc')); rp.position.set(AX + x, 0.36, -1.8); qs.add(rp); }
  // 土から出ている骨（形は汎用。何の骨かはわからない程度）
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), mat('#efe6cc')); b.rotation.z = Math.PI / 2; b.rotation.y = 0.5 - i * 0.12; b.position.set(AX - 0.9 + i * 0.32, 0.1, -1.9 + Math.sin(i) * 0.15); qs.add(b); }
  const tent = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.8, 4), mat('#e8dcc0')); tent.rotation.y = Math.PI / 4; tent.position.set(AX + 4.5, 0.9, -5); qs.add(tent);
  const tbl = box(1.4, 0.06, 0.7, mat('#8a6a4a')); tbl.position.set(AX - 3.2, 0.8, -3.2); qs.add(tbl);
  for (const [x, z] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) { const lg = box(0.05, 0.8, 0.05, mat('#6a4a30')); lg.position.set(AX - 3.2 + x, 0.4, -3.2 + z); qs.add(lg); } }
const SUN2 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff0b0', fog: false })); SUN2.position.set(AX + 9, 9, -30); qs.add(SUN2);
const dig2 = makePerson(DR); dig2.position.set(AX - 0.2, 0, -1.0); dig2.rotation.y = Math.PI; qs.add(dig2);
{ const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 20), mat('#c8a878')); hat.position.y = 0.53; dig2.userData.head.add(hat); const hc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.14, 16), mat('#c8a878')); hc.position.y = 0.6; dig2.userData.head.add(hc); }
const BRUSH2 = box(0.04, 0.04, 0.28, mat('#8a5a2a')); BRUSH2.position.set(0, -0.68, 0.1); dig2.userData.arms[1].add(BRUSH2);
const kid2 = makePerson(KID2); kid2.position.set(AX + 3, 0, -1.2); kid2.rotation.y = -Math.PI / 2; qs.add(kid2);
const DUST2 = []; for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#e8d0a0', transparent: true })); qs.add(d); DUST2.push(d); }
const tDig = tag('土の中から、化石を掘る', { size: 54, w: 680, bg: '#14161c', sx: 1.5 }); tDig.position.set(AX - 0.4, 1.75, -1.8); qs.add(tDig);
const tKid = tag('子どもが、ちょっと苦手', { size: 56, w: 680, bg: '#c8902c', sx: 2.0 }); tKid.position.set(AX + 0.5, 2.55, -1.6); qs.add(tKid);

// ---------- 3段目. ジャングルの高い柵（x=80）。見上げる学者たち。電気がパチッ ----------
const BX = 80;
{ const gr = box(30, 0.06, 26, mat('#2e4a26')); gr.position.set(BX, 0.03, -8); qs.add(gr);
  const road = box(3, 0.02, 26, mat('#7a6a4a')); road.position.set(BX + 3.8, 0.07, -6); qs.add(road);
  for (let i = 0; i < 18; i++) { const s = i % 2 ? 1 : -1; jungleTree(BX + (R() - 0.5) * 22, -12 - R() * 10, 1.6 + R() * 0.9); }
  for (let i = 0; i < 8; i++) palm(BX - 9 + i * 2.6, -2 - R() * 1.5 - (i % 2) * 6, 1.0 + R() * 0.3); }
const FENCE3 = new THREE.Group();
{ for (let i = 0; i < 7; i++) { const p = box(0.35, 9, 0.35, mat('#5a5e64')); p.position.set(-9 + i * 3, 4.5, 0); FENCE3.add(p);
    const cap = box(0.5, 0.2, 0.5, mat('#e6b450')); cap.position.set(-9 + i * 3, 9.1, 0); FENCE3.add(cap); }
  for (let k = 0; k < 10; k++) { const w = box(18, 0.04, 0.04, mat('#9aa0a8')); w.position.set(0, 0.6 + k * 0.9, 0); FENCE3.add(w); }
  const sign = box(1.2, 0.8, 0.05, mat('#e6b450')); sign.position.set(-1.5, 1.6, 0.25); FENCE3.add(sign);
  const bolt = tag('⚡', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#14161c', sx: 0.5 }); bolt.visible = true; bolt.position.set(-1.5, 1.6, 0.32); bolt.userData.pop = () => {}; FENCE3.add(bolt); }
FENCE3.position.set(BX, 0, -6); qs.add(FENCE3);
const SPARK3 = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: '#bfe8ff' })); qs.add(s); SPARK3.push(s); }
const P3 = [DR, DR2, DR3].map((o, i) => { const p = makePerson(o); p.position.set(BX - 1.2 + i * 1.1, 0, -2.4 + (i % 2) * 0.3); p.rotation.y = Math.PI; qs.add(p); return p; });
const tFence = tag('見上げるほど、高い柵', { size: 56, w: 640, bg: '#14161c', sx: 2.6 }); tFence.position.set(BX, 3.4, -3.2); qs.add(tFence);
const tComp = tag('電気が流れ、機械が管理', { size: 54, w: 700, bg: '#2a6ab0', sx: 2.8 }); tComp.position.set(BX, 3.4, -3.2); qs.add(tComp);

// ---------- 4段目. 夜の雨のツアー（x=120）。車2台・大人と子どもふたり。ライトが消え、木が揺れる ----------
const CX = 120;
{ const gr = box(30, 0.06, 26, mat('#1e2e1a')); gr.position.set(CX, 0.03, -8); qs.add(gr);
  const road = box(3.2, 0.02, 30, mat('#4a4030')); road.rotation.y = Math.PI / 2; road.position.set(CX, 0.07, -1.6); qs.add(road);
  for (let i = 0; i < 14; i++) jungleTree(CX - 12 + i * 1.8 + (R() - 0.5), -9 - R() * 6, 1.5 + R() * 0.8);
  for (let i = 0; i < 6; i++) { const p = box(0.3, 7, 0.3, mat('#4a4e54')); p.position.set(CX - 9 + i * 3.6, 3.5, -5.2); qs.add(p); }
  for (let k = 0; k < 7; k++) { const w = box(20, 0.04, 0.04, mat('#6a6e74')); w.position.set(CX, 0.6 + k * 0.9, -5.2); qs.add(w); } }
const SHAKE4 = []; for (let i = 0; i < 3; i++) SHAKE4.push(jungleTree(CX - 1.5 + i * 1.6, -7.2, 2.0));
const CAR4 = jeep(); CAR4.position.set(CX - 1.6, 0, -1.5); qs.add(CAR4);
const CAR4b = jeep(); CAR4b.position.set(CX + 3.4, 0, -1.5); qs.add(CAR4b);
const IN4 = [DR, KID1, KID2].map((o, i) => { const p = makePerson(o); p.scale.multiplyScalar(0.92); p.position.set(-0.5 + i * 0.45, 0.35, (i - 1) * 0.3); p.rotation.y = 0.2; CAR4.add(p); return p; });
const RAIN4 = []; for (let i = 0; i < 80; i++) { const d = box(0.012, 0.3, 0.012, new THREE.MeshBasicMaterial({ color: '#a8c0d8', transparent: true, opacity: 0.6 })); d.userData = { x: CX + (R() - 0.5) * 12, z: -0.5 - R() * 7, o: R() }; qs.add(d); RAIN4.push(d); }
const PRINT4 = []; for (let i = 0; i < 3; i++) { const f = new THREE.Group(); const pd = new THREE.Mesh(new THREE.CircleGeometry(0.45, 14), mat('#1a1610')); pd.rotation.x = -Math.PI / 2; f.add(pd);
  for (let k = -1; k <= 1; k++) { const t = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), mat('#1a1610')); t.rotation.x = -Math.PI / 2; t.scale.y = 2.2; t.position.set(k * 0.32, 0, -0.55 - Math.abs(k) * -0.1); t.rotation.z = k * 0.4; f.add(t); }
  f.position.set(CX + 0.6 + i * 0.5, 0.09, -3.4 + i * 0.9); f.rotation.y = 0.3; f.visible = false; qs.add(f); PRINT4.push(f); }
const Q4 = tag('！？', { size: 90, w: 180, h: 140, bg: '#c8202c', sx: 0.75 }); Q4.position.set(CX - 1.4, 2.7, -1.5); qs.add(Q4);
const tTour = tag('孫ふたりも、見学ツアーへ', { size: 54, w: 720, bg: '#14161c', sx: 2.2 }); tTour.position.set(CX - 1.4, 3.1, -2.2); qs.add(tTour);
const tTrouble = tag('予期せぬトラブル', { size: 62, w: 560, bg: '#c8202c', sx: 2.2 }); tTrouble.position.set(CX - 0.2, 3.2, -2.6); qs.add(tTrouble);

// ---------- 5段目. 映画館のスクリーン（x=180）。1993年・アメリカ映画 ----------
const TX = 180;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 1.4 + r * 1.1); qs.add(s); const b = box(0.7, 0.9, 0.12, mat('#7a1424')); b.position.set(TX - 2.9 + i * 1.15, 1.0 + r * 0.25, 1.68 + r * 1.1); qs.add(b); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2a04a'); gr.addColorStop(0.6, '#c84a2a'); gr.addColorStop(1, '#3a1a14'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1a0e0a'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(i * 56, h - 40 - (i % 3) * 18, 50 + (i % 2) * 20, 0, 7); g.fill(); }
  g.fillRect(0, h - 50, w, 50);
  g.fillStyle = '#1a0e0a'; g.fillRect(140, h - 150, 14, 110); g.fillRect(560, h - 170, 14, 130);
  g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(560, 110, 40, 0, 7); g.fill(); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t1993 = tag('1993年 アメリカ映画', { size: 56, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.0 }); t1993.position.set(TX, 6.0, -4.4); qs.add(t1993);
const tSpiel = tag('スピルバーグ監督', { size: 60, w: 560, bg: '#2a6ab0', sx: 2.6 }); tSpiel.position.set(TX, 6.0, -4.4); qs.add(tSpiel);

// ---------- 6段目. 研究所（x=220）。光るDNA → 卵がわれる → 窓の外、木より高い首長の恐竜 ----------
const DX = 220;
{ const fl = box(14, 0.04, 12, mat('#d8dce4')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#e8ecf2')); wl.position.set(DX - 5.6, 3, -5); wl.scale.x = 0.2; qs.add(wl);
  const wr = box(14, 6, 0.2, mat('#e8ecf2')); wr.position.set(DX + 5.6, 3, -5); wr.scale.x = 0.2; qs.add(wr);
  const desk = box(3.4, 0.1, 1.2, mat('#f4f6fa')); desk.position.set(DX, 0.9, -2.2); qs.add(desk);
  const db = box(3.3, 0.85, 1.1, mat('#b8c0cc')); db.position.set(DX, 0.43, -2.2); qs.add(db);
  for (const x of [-4.8, 4.8]) { const sh = box(1.6, 3, 0.6, mat('#c8d0dc')); sh.position.set(DX + x, 1.5, -4.4); qs.add(sh); }
  // 窓の外のジャングル
  for (let i = 0; i < 9; i++) jungleTree(DX - 6 + i * 1.5, -15 - R() * 3, 1.8 + R() * 0.6); }
const LAMP6 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.12, 20), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); LAMP6.position.set(DX, 0.98, -2.2); qs.add(LAMP6);
const EGG6 = new THREE.Group(); { const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4ecd8')); e1.scale.y = 1.35; e1.position.y = 0; const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#f4ecd8')); e2.scale.y = 1.35; EGG6.add(e1); EGG6.add(e2); EGG6.userData = { top: e1 }; }
EGG6.position.set(DX, 1.3, -2.2); qs.add(EGG6);
const DNA6 = new THREE.Group(); for (let i = 0; i < 16; i++) { const a = i * 0.55, y = i * 0.16;
  for (const s of [0, Math.PI]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: s ? '#4fd1a5' : '#5ab0ff' })); b.position.set(Math.cos(a + s) * 0.4, y, Math.sin(a + s) * 0.4); DNA6.add(b); }
  const r = box(0.8, 0.02, 0.02, new THREE.MeshBasicMaterial({ color: '#e8f0ff' })); r.position.y = y; r.rotation.y = -a; DNA6.add(r); }
DNA6.position.set(DX - 1.1, 1.0, -2.6); DNA6.scale.setScalar(0.8); qs.add(DNA6);
// 首の長い恐竜（汎用の形。窓の外の木より高い）
const DINO6 = new THREE.Group();
{ const sk = mat('#6a7a5a');
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), sk); body.scale.set(1.6, 1.0, 0.9); body.position.y = 3.4; DINO6.add(body);
  for (const [x, z] of [[1.2, 0.7], [1.2, -0.7], [-1.3, 0.7], [-1.3, -0.7]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 3.2, 10), sk); l.position.set(x, 1.6, z); DINO6.add(l); }
  const neck = new THREE.Group(); neck.position.set(1.9, 4.0, 0); DINO6.add(neck);
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.55 - i * 0.02, 10, 8), sk); s.position.set(i * 0.16, i * 0.36, 0); neck.add(s); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), sk); head.scale.set(1.5, 0.8, 0.9); head.position.set(2.5, 5.2, 0); neck.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), mat('#121212')); e.position.set(2.8, 5.35, s * 0.3); neck.add(e); }
  const tail = new THREE.Group(); tail.position.set(-2.4, 3.4, 0); DINO6.add(tail);
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.6 - i * 0.04, 10, 8), sk); s.position.set(-i * 0.3, -i * 0.15, 0); tail.add(s); }
  DINO6.userData.neck = neck; }
DINO6.scale.setScalar(0.85); DINO6.rotation.y = -0.35; DINO6.position.set(DX - 1.0, 0, -9); qs.add(DINO6);
const tDNA = tag('大昔のDNAから、よみがえる', { size: 52, w: 760, bg: '#14161c', sx: 1.7 }); tDNA.position.set(DX - 0.4, 2.45, -2.4); qs.add(tDNA);
const tDino = tag('絶滅した、恐竜', { size: 66, w: 520, bg: '#2e8a4a', sx: 3.0 }); tDino.position.set(DX - 0.2, 6.6, -6); qs.add(tDino);

// ---------- shots ----------
const ALL = [tPark, tSafe, tDig, tKid, tFence, tComp, tTour, tTrouble, t1993, tSpiel, tDNA, tDino, Q1, Q4];
function base() { S.reset(); ALL.forEach(x => x.visible = false); PRINT4.forEach(f => f.visible = false); }

function shotIsland(t, quiz = 0) { // 1段目 0〜9：海に浮かぶ島に、オープン前のテーマパーク。専門家たちが、安全か確かめに呼ばれた（0秒目がサムネ）
  base(); S.aim(0, -18); lift(0); S.hemi.intensity = 1.25; S.scene.background.set('#8ab8d8'); S.scene.fog.color.set('#8ab8d8');
  const k = clamp(t / 9);
  HELI.position.set(lerp(-4, 2.5, k), 4.4 + Math.sin(t * 1.6) * 0.15, lerp(-8, -15, k)); HELI.rotation.y = -0.9; HELI.rotation.z = 0.08; HELI.userData.rot.rotation.y = t * 22;
  FOG1.forEach((f, i) => { f.position.x = -10 + i * 4 + Math.sin(t * 0.3 + i) * 0.6; });
  Q1.userData.pop(quiz ? 1 : (t - 0.2) / 0.3);
  if (!quiz) { tPark.userData.pop((t - 0.6) / 0.35); if (t > 4.1) tPark.visible = false; tSafe.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.5, -0.5, u), lerp(4.6, 4.4, u), lerp(1.5, -0.5, u), 0, 4.6, -20, 62);
  return qs;
}
function shotDig(t) { // 2段目 9〜17：主人公は、土の中から化石を掘り出す学者。実は、子どもがちょっと苦手
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.35; S.scene.background.set('#e8c890'); S.scene.fog.color.set('#e8c890');
  // しゃがんでハケで払う
  dig2.position.y = -0.38; dig2.userData.legs.forEach(l => l.rotation.x = -1.2); dig2.userData.head.rotation.x = 0.5;
  dig2.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 9) * 0.25; dig2.userData.arms[0].rotation.x = -0.5;
  DUST2.forEach((d, i) => { const k = (t * 0.8 + i / 10) % 1; d.position.set(AX - 0.1 + (i - 5) * 0.06 + k * 0.3 * Math.sin(i), 0.15 + k * 0.6, -1.7 + Math.cos(i) * 0.1); d.material.opacity = 1 - k; d.visible = t < 4.2; });
  const kk = ease(clamp((t - 3.6) / 1.4));
  kid2.position.set(AX + lerp(3.4, 0.9, kk), 0, -1.2); poseWalk(kid2, t * 7, kk < 1 && kk > 0 ? 0.9 : 0); kid2.userData.arms[0].rotation.x = t > 5 ? -2.4 + Math.sin(t * 6) * 0.3 : 0;
  if (t > 5.2) { const b = ease(clamp((t - 5.2) / 0.8)); dig2.position.set(AX - 0.2 - b * 0.7, lerp(-0.38, 0, b), -1.0); dig2.userData.legs.forEach(l => l.rotation.x = lerp(-1.2, 0, b)); dig2.userData.head.rotation.x = lerp(0.5, 0, b); dig2.rotation.y = lerp(Math.PI, Math.PI / 2 + 0.2, b); dig2.userData.arms[1].rotation.x = lerp(-0.9, -0.3, b); dig2.userData.arms[0].rotation.x = lerp(-0.5, -1.3, b); }
  tDig.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDig.visible = false; tKid.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4) look(AX + lerp(-0.8, -0.4, u), lerp(2.2, 1.9, u), lerp(1.8, 1.4, u), AX - 0.1, 0.4, -1.6, 62);
  else look(AX + 0.6, 1.8, lerp(3.2, 2.9, ease((t - 4) / 4)), AX + 0.4, 1.1, -1.3, 62);
  return qs;
}
function shotFence(t) { // 3段目 17〜25：ジャングルの中に、見上げるほど高い柵。電気が流れていて、コンピューターで管理
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.0; S.scene.background.set('#9ab8a0'); S.scene.fog.color.set('#9ab8a0');
  P3.forEach((p, i) => { p.userData.head.rotation.x = -0.5; p.userData.head.rotation.y = Math.sin(t * 0.6 + i) * 0.2; });
  const on = t > 4.2;
  SPARK3.forEach((s, i) => { const k = (t * 1.6 + i / 10) % 1; s.visible = on && k < 0.5; s.position.set(BX - 6 + i * 1.3, 0.6 + ((i * 3) % 10) * 0.9, -5.9); s.scale.setScalar(1 + Math.sin(t * 30 + i) * 0.5); });
  tFence.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFence.visible = false; tComp.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.6, 0.4, u), lerp(1.6, 2.0, u), lerp(2.8, 2.2, u), BX, lerp(4.2, 5.0, u), -6, 66);
  return qs;
}
function shotTour(t) { // 4段目 25〜33：社長の孫ふたりも、一緒に見学ツアーへ。ところが、予期せぬトラブルが起きる
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.55, '#0a1018');
  const dark = t > 4.2;
  RAIN4.forEach(d => { const k = (t * 1.4 + d.userData.o) % 1; d.position.set(d.userData.x, 5 - k * 5, d.userData.z); });
  [CAR4, CAR4b].forEach(c => c.userData.lights.forEach(l => l.material.color.set(dark ? '#3a3a30' : '#fff4c0')));
  if (dark) S.darken(0.75, '#04060a');
  IN4.forEach((p, i) => { p.userData.head.rotation.y = dark ? Math.sin(t * 2.4 + i) * 0.6 : 0.3 * Math.sin(t + i); });
  SHAKE4.forEach((tr, i) => { tr.rotation.z = dark && t > 5.2 ? Math.sin(t * 9 + i) * 0.06 : 0; });
  PRINT4.forEach((f, i) => { f.visible = t > 5.6 + i * 0.4; });
  Q4.userData.pop((t - 6.0) / 0.3);
  tTour.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTour.visible = false; tTrouble.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  if (!dark) look(CX + lerp(-1.0, -0.4, u), 2.4, lerp(3.6, 3.2, u), CX - 1.2, 1.1, -1.6, 62);
  else look(CX - 0.6, lerp(2.6, 3.0, ease((t - 4.2) / 3.8)), lerp(5.4, 5.0, ease((t - 4.2) / 3.8)), CX - 0.4, 1.2, -2.6, 64);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1993年の、アメリカ映画。スピルバーグ監督の、SFアドベンチャー
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  t1993.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1993.visible = false; tSpiel.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.4, 5.4, u), TX, 3.8, -4.8, 62);
  return qs;
}
function shotLab(t) { // 6段目 42〜49（決め手）：研究所で、大昔のDNAからよみがえらせたのは、6500万年前に絶滅した恐竜
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.1; S.scene.background.set('#a8c8b0'); S.scene.fog.color.set('#a8c8b0');
  DNA6.visible = true; EGG6.visible = true; LAMP6.visible = true; DNA6.rotation.y = t * 1.2;
  const crack = clamp((t - 1.6) / 0.8); EGG6.userData.top.position.y = crack * 0.25; EGG6.userData.top.rotation.z = crack * 0.6; EGG6.rotation.z = Math.sin(t * 20) * 0.08 * (t > 0.8 && t < 1.8 ? 1 : 0);
  const rise = ease(clamp((t - 3.2) / 1.4)); DINO6.position.y = lerp(-6, 0, rise); DINO6.userData.neck.rotation.z = Math.sin(t * 0.8) * 0.05;
  tDNA.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tDNA.visible = false; tDino.userData.pop((t - 3.6) / 0.3);
  const u = ease(t / 7);
  if (t < 3.3) look(DX + lerp(-0.5, -0.3, u), 2.0, lerp(1.9, 1.6, u), DX - 0.6, 1.5, -2.3, 62);
  else { DNA6.visible = false; EGG6.visible = false; LAMP6.visible = false; look(DX - 0.2, lerp(2.4, 2.6, ease((t - 3.3) / 3.7)), lerp(3.0, 3.6, ease((t - 3.3) / 3.7)), DX - 0.6, 4.4, -9, 66); }
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（島に戻る）
  shotIsland(4.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(0, 4.5, lerp(0.5, -1.5, k), 0, 4.8, -20, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotIsland(t, 0) },
  { a: 9, b: 17, f: shotDig },
  { a: 17, b: 25, f: shotFence },
  { a: 25, b: 33, f: shotTour },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotLab },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '海に浮かぶ島に、<br>オープン前のテーマパーク。'],
  [5.6, 9.0, '専門家たちが、<br>安全か確かめに呼ばれた。'],
  [9.2, 13.2, '主人公は、土の中から<br>化石を掘り出す学者。'],
  [13.2, 17.0, '実は、子どもが<br>ちょっと苦手。'],
  [17.2, 21.0, 'ジャングルの中に、<br>見上げるほど高い柵。'],
  [21.0, 25.0, '電気が流れていて、<br>コンピューターで管理。'],
  [25.2, 29.0, '社長の孫ふたりも、<br>一緒に見学ツアーへ。'],
  [29.0, 33.0, 'ところが、<br>予期せぬトラブルが起きる。'],
  [33.2, 37.4, '1993年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'スピルバーグ監督の、<br>SFアドベンチャー。'],
  [42.2, 45.4, '大昔のDNAから、<br>よみがえらせたのは、'],
  [45.4, 49.0, '絶滅したはずの、<br>恐竜。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ジュラシック・パーク。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q090', v2: true, answer: 'ジュラシック・パーク',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 9090,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '海': 'うみ', '浮かぶ': 'うかぶ', '島': 'しま', '前': 'まえ', '専門家': 'せんもんか', '安全': 'あんぜん', '確かめ': 'たしかめ', '呼ばれた': 'よばれた', '主人公': 'しゅじんこう', '土': 'つち', '中': 'なか', '化石': 'かせき', '掘り出す': 'ほりだす', '学者': 'がくしゃ', '実は': 'じつは', '子ども': 'こども', '苦手': 'にがて', '見上げる': 'みあげる', '高い': 'たかい', '柵': 'さく', '電気': 'でんき', '流れて': 'ながれて', '管理': 'かんり', '社長': 'しゃちょう', '孫': 'まご', '一緒': 'いっしょ', '見学': 'けんがく', '予期せぬ': 'よきせぬ', '起きる': 'おきる', '1993年': 'せんきゅうひゃくきゅうじゅうさんねん', '映画': 'えいが', '監督': 'かんとく', '大昔': 'おおむかし', 'DNA': 'ディーエヌエー', '絶滅': 'ぜつめつ', '恐竜': 'きょうりゅう', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n海に浮かぶ島に、オープン前のテーマパーク。専門家たちが、安全か確かめに呼ばれた。主人公は、土の中から化石を掘り出す学者。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'U-NEXT', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'ジュラシック・パーク', info: 'Prime Video・U-NEXT｜映画・127分', answerSize: 84 });
