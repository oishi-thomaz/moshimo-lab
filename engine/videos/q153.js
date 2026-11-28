import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #153 いつかこの恋を思い出してきっと泣いてしまう（ドラマ・日本・2016年・フジテレビ・全10話。FOD で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/itsukakonolian-wosi-ichu-shitekitsutoqi-iteshimau/シーズン-1（シーズン1・10話。FOD で配信中）と
//   Filmarks の動画配信欄（Prime Video・FOD 見放題。2026年10月更新。Prime Video はお試しの3話だけなので FOD だけを出す）で2026/11/28確認。
//   Filmarks 3.9・レビュー34,495件 filmarks.com/dramas/902/2034）
// 確かめた事実（2026/11/28）：
//   ・Filmarks のあらすじ・作品情報（2016年製作・脚本 坂元裕二）：女の子は育ての親である老夫婦のもと、北海道のさびれた町で暮らしていた。家政婦扱いされ、
//     寝たきりになった妻の介護をしている。「あきらめること」を教え込まれて生きてきた。青年は東京の運送会社で引っ越しの仕事に就いていた。祖父に育てられ、
//     人を疑うことを知らない。先輩たちからこき使われ、給料は安く、古ぼけたアパートで暮らす。ある日、悪友が北海道で盗んだというカバンの中から古ぼけた手紙を
//     見つけ、手紙は持ち主に返さなければならないと強く感じ、トラックを飛ばし北海道へと向かう
//   ・JustWatch のエピソード名：第1話 失くした手紙が繋いだ奇跡…二人は出逢った／第2話 東京編スタート 都会の現実、募る想い
// 構成（ヒント6段）：1 盗まれたカバンの中に古い手紙・持ち主に返さなきゃ → 2 主人公は東京で引っ越しの仕事をする青年・人を疑うことを知らない
//   → 3 雪の積もるさびれた北の町・あきらめることに慣れた女の子 → 4 トラックを飛ばして手紙を届けに行く・そこで出会うふたり
//   → 5 2016年の日本のドラマ・脚本は坂元裕二 → 6 決め手：地方から東京へ出てきた若者たちの恋・タイトルは未来の涙を予感する長い一文
// 後半の展開・結末は言わない。登場人物の名前・地名・会社名は出さない。俳優の顔・ポスター・ロゴは使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#1c2230', floor: '#2a2c32', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(15310);

const BOY = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#3a5a8a', pants: '#3a4a6a' };
const GIRL = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#c8b8a0', pants: '#4a4a52', long: true };
const PAL = { skin: '#e8c09a', hair: '#8a5a2a', shirt: '#2a2a2e', pants: '#2a3040' };
const SENP = [{ skin: '#e0b08a', hair: '#1a1a1a', shirt: '#3a5a8a', pants: '#3a4a6a' }, { skin: '#f1c9a5', hair: '#2a2420', shirt: '#3a5a8a', pants: '#3a4a6a', scale: 1.08 }];
const TOKYO = [{ skin: '#f1c9a5', hair: '#3a2418', shirt: '#d8a048', pants: '#2a2a30', long: true }, { skin: '#e8c09a', hair: '#1a1410', shirt: '#4a7a5a', pants: '#2a2a30' }, { skin: '#f4d3b5', hair: '#6a3a1a', shirt: '#a04a5a', pants: '#2a2a30', long: true, skirt: true }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function letter() { const g = new THREE.Group(); const e = box(0.42, 0.28, 0.02, mat('#f0e8d0')); g.add(e); const f = box(0.42, 0.02, 0.14, mat('#e0d4b4')); f.position.set(0, 0.13, 0.05); f.rotation.x = -1.0; g.add(f);
  for (let i = 0; i < 3; i++) { const l = box(0.26, 0.012, 0.005, mat('#7a6a5a')); l.position.set(-0.02, 0.04 - i * 0.05, 0.012); g.add(l); } const st = box(0.06, 0.07, 0.005, mat('#c83a3a')); st.position.set(0.15, 0.08, 0.012); g.add(st); return g; }
function truck(c = '#e8e8e8') { const g = new THREE.Group(); const cab = box(1.6, 1.4, 1.4, mat('#3a6aa0')); cab.position.set(0, 1.0, 1.6); g.add(cab); const ws = box(1.4, 0.6, 0.04, gl('#9ac0e0')); ws.position.set(0, 1.35, 2.31); g.add(ws);
  const bx = box(1.8, 2.0, 3.2, mat(c)); bx.position.set(0, 1.3, -0.8); g.add(bx);
  for (const [x, z] of [[-0.8, 1.6], [0.8, 1.6], [-0.8, -1.6], [0.8, -1.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.25, 14), mat('#1a1a1a')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); g.add(w); }
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), gl('#fff4c0')); h.position.set(s * 0.55, 0.7, 2.32); g.add(h); } return g; }
function snow(cx, n = 240, z0 = -14) { const g = new THREE.BufferGeometry(); const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = cx - 8 + R() * 16; a[i * 3 + 1] = R() * 7; a[i * 3 + 2] = z0 + R() * 18; }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 4, sizeAttenuation: false, fog: false })); p.userData.base = a.slice(); qs.add(p); return p; }
function fall(p, t) { const a = p.geometry.attributes.position, b = p.userData.base; for (let i = 0; i < a.count; i++) a.array[i * 3 + 1] = ((b[i * 3 + 1] - t * 0.5) % 7 + 7) % 7; a.needsUpdate = true; }

// ---------- 1段目. 古いアパートの一室（x=0）。床に開いたカバン、中から古い手紙を取り出す青年と、あぐらの悪友 ----------
{ const fl = box(6, 0.04, 6, mat('#8a6a48')); fl.position.set(0, 0.02, -3); qs.add(fl); const wl = box(6, 3, 0.2, mat('#a89a80')); wl.position.set(0, 1.5, -6); qs.add(wl);
  const sw = box(0.2, 3, 6, mat('#9a8c74')); sw.position.set(-3, 1.5, -3); qs.add(sw); const win = box(1.2, 1.0, 0.04, gl('#1a2a44')); win.position.set(1.2, 1.8, -5.88); qs.add(win);
  const tb = box(1.0, 0.36, 0.7, mat('#5a4030')); tb.position.set(-1.6, 0.18, -4.6); qs.add(tb);
  const L = new THREE.PointLight('#ffd8a0', 3.4, 8); L.position.set(0, 2.6, -2.6); qs.add(L); }
const BAG1 = new THREE.Group(); { const b = box(0.8, 0.4, 0.4, mat('#6a3a2a')); b.position.y = 0.2; BAG1.add(b); const lid = box(0.8, 0.05, 0.4, mat('#5a3020')); lid.position.set(0, 0.42, -0.25); lid.rotation.x = -1.1; BAG1.add(lid); }
BAG1.position.set(0.2, 0, -3.4); qs.add(BAG1);
const BOY1 = person(BOY, -0.4, -3.0, 0.9); BOY1.userData.legs.forEach(l => l.rotation.x = -1.4); BOY1.position.y = -0.45;
const PAL1 = person(PAL, 1.2, -4.2, -0.6); PAL1.userData.legs.forEach(l => l.rotation.x = -1.5); PAL1.position.y = -0.5;
const LET1 = letter(); qs.add(LET1);
const GLOW1 = new THREE.PointLight('#fff0c0', 0, 2.5); qs.add(GLOW1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tLetter = tag('盗まれたカバンの中に、古い手紙', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tLetter);
const tReturn = tag('持ち主に、返さなきゃ', { size: 56, w: 640, bg: '#3478e6', sx: 1.6 }); qs.add(tReturn);

// ---------- 2段目. 引っ越しの現場（x=50）。トラックと段ボール、汗だくで運ぶ青年、腕を組む先輩たち ----------
const AX = 50;
{ const rd = box(14, 0.04, 16, mat('#5a5a5e')); rd.position.set(AX, 0.02, -4); qs.add(rd);
  for (let i = 0; i < 3; i++) { const b = box(4, 6, 4, mat(['#c8c0b0', '#b8b4a8', '#d0c8b8'][i])); b.position.set(AX - 5 + i * 5, 3, -11); qs.add(b);
    for (let k = 0; k < 6; k++) { const w = box(0.7, 0.6, 0.05, gl('#9ab0c8')); w.position.set(AX - 6 + i * 5 + (k % 3) * 1.0, 1.5 + Math.floor(k / 3) * 2.0, -8.97); qs.add(w); } } }
const TRK2 = truck(); TRK2.position.set(AX + 2.6, 0, -5.2); TRK2.rotation.y = -0.2; qs.add(TRK2);
const BOXES2 = []; for (let i = 0; i < 7; i++) { const b = box(0.55, 0.4, 0.45, mat('#c8a46a')); b.position.set(AX + 0.6 + (i % 3) * 0.6, 0.2 + Math.floor(i / 3) * 0.4, -3.2 + (i % 2) * 0.1); qs.add(b); BOXES2.push(b); }
const BOY2 = person(BOY, AX - 0.8, -2.4, 1.2);
const CARRY2 = [box(0.55, 0.4, 0.45, mat('#c8a46a')), box(0.55, 0.4, 0.45, mat('#b89458'))]; CARRY2.forEach((b, i) => { b.position.set(0, 1.55 + i * 0.4, 0.4); BOY2.add(b); });
const SEN2 = SENP.map((o, i) => person(o, AX - 2.4 + i * 0.8, -4.6 - i * 0.4, 0.5));
const tMove = tag('主人公は、都会で引っ越しの仕事をする青年', { size: 40, w: 980, bg: '#14161c', sx: 2.1 }); qs.add(tMove);
const tTrust = tag('人を疑うことを、知らない', { size: 52, w: 720, bg: '#3478e6', sx: 1.75 }); qs.add(tTrust);

// ---------- 3段目. 雪の積もるさびれた町（x=100）。古い木の家、ひとりで雪かきをする女の子、窓の灯りがひとつ ----------
const BX = 100;
{ const gr = box(30, 0.3, 30, mat('#e8ecf2')); gr.position.set(BX, -0.1, -6); qs.add(gr);
  const hs = box(4, 2.6, 3.4, mat('#6a5444')); hs.position.set(BX - 1, 1.3, -7); qs.add(hs); const rf = box(4.6, 0.3, 4.0, mat('#f0f2f6')); rf.position.set(BX - 1, 2.75, -7); rf.rotation.z = 0.0; qs.add(rf);
  const win = box(0.8, 0.7, 0.04, gl('#ffd890')); win.position.set(BX - 0.2, 1.4, -5.28); qs.add(win);
  for (let i = 0; i < 5; i++) { const pole = box(0.12, 4, 0.12, mat('#4a3a2e')); pole.position.set(BX + 3 + i * 3, 2, -10 - i); qs.add(pole); }
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.6 + R() * 0.6, 10, 8), mat('#f4f6fa')); m.position.set(BX - 6 + R() * 12, -0.2, -2 - R() * 10); m.scale.y = 0.4; qs.add(m); }
  const L = new THREE.PointLight('#ffd890', 1.6, 5); L.position.set(BX - 0.2, 1.4, -4.6); qs.add(L); }
const SNOW3 = snow(BX);
const GIRL3 = person({ ...GIRL, shirt: '#6a7a8a' }, BX + 0.8, -3.4, -0.4);
const SHOV3 = new THREE.Group(); { const st = box(0.04, 1.1, 0.04, mat('#8a6a4a')); st.position.y = -0.4; SHOV3.add(st); const bl = box(0.36, 0.04, 0.3, mat('#d83a3a')); bl.position.set(0, -0.95, 0.12); SHOV3.add(bl); }
SHOV3.position.set(0, -0.55, 0.2); GIRL3.userData.arms[1].add(SHOV3);
const tTown = tag('雪の積もる、さびれた北の町', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tTown);
const tGive = tag('あきらめることに、慣れた女の子', { size: 46, w: 860, bg: '#3478e6', sx: 1.95 }); qs.add(tGive);

// ---------- 4段目. 夜の雪道を走るトラック（x=150）→ 雪の中で手紙を差し出す青年と、受け取る女の子 ----------
const CX = 150;
{ const gr = box(30, 0.3, 60, mat('#dfe4ec')); gr.position.set(CX, -0.15, -12); qs.add(gr); const rd = box(3.4, 0.02, 60, mat('#9aa0aa')); rd.position.set(CX, 0.02, -12); qs.add(rd);
  for (let i = 0; i < 10; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 8), mat('#2a4a3a')); t.position.set(CX + (i % 2 ? 4 : -4) + (R() - 0.5), 1.3, -2 - i * 5); qs.add(t); } }
const SNOW4 = snow(CX, 260, -30);
const TRK4 = truck(); TRK4.position.set(CX, 0, 4); TRK4.rotation.y = Math.PI; qs.add(TRK4);
const HL4 = new THREE.SpotLight('#fff4c0', 30, 18, 0.5, 0.6, 1); qs.add(HL4); qs.add(HL4.target);
const BOY4 = person({ ...BOY, shirt: '#2a3a5a' }, CX - 0.5, -24, 1.0);
const GIRL4 = person({ ...GIRL, shirt: '#6a7a8a' }, CX + 0.5, -24.2, -1.1);
const LET4 = letter(); LET4.position.set(0.05, -0.6, 0.3); LET4.rotation.x = -0.4; BOY4.userData.arms[1].add(LET4);
const L4 = new THREE.PointLight('#ffe8c8', 2.2, 8); L4.position.set(CX, 2.6, -22); qs.add(L4);
const tDrive = tag('トラックを飛ばして、手紙を届けに', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tDrive);
const tMeet = tag('そこで出会う、ふたり', { size: 56, w: 640, bg: '#3478e6', sx: 1.6 }); qs.add(tMeet);

// ---------- 5段目. 夜の居間のテレビ（x=200）。光る画面とソファ、テーブルの上の台本の束 ----------
const DX = 200;
{ const fl = box(8, 0.04, 7, mat('#4a3e34')); fl.position.set(DX, 0.02, -2); qs.add(fl); const wl = box(8, 3.6, 0.2, mat('#3a3440')); wl.position.set(DX, 1.8, -5.2); qs.add(wl);
  const sofa = box(2.6, 0.5, 0.9, mat('#4a5a6a')); sofa.position.set(DX, 0.3, -0.4); qs.add(sofa); }
const TV5 = box(2.6, 1.5, 0.12, mat('#121214')); TV5.position.set(DX, 1.6, -4.9); qs.add(TV5);
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.32), new THREE.MeshBasicMaterial({ color: '#6a8aba' })); SCR5.position.set(DX, 1.6, -4.83); qs.add(SCR5);
const STAND5 = box(2.2, 0.6, 0.5, mat('#4a3a2e')); STAND5.position.set(DX, 0.3, -4.8); qs.add(STAND5);
const L5 = new THREE.PointLight('#8ab0ff', 3, 8); L5.position.set(DX, 1.6, -3.8); qs.add(L5);
const BOOK5 = new THREE.Group(); for (let i = 0; i < 5; i++) { const b = box(0.5, 0.06, 0.7, mat(i % 2 ? '#f0ece0' : '#e0d8c4')); b.position.set((R() - 0.5) * 0.06, i * 0.065, 0); b.rotation.y = (R() - 0.5) * 0.2; BOOK5.add(b); }
BOOK5.position.set(DX + 0.2, 1.0, -2.4); qs.add(BOOK5);
const PEN5 = box(0.03, 0.03, 0.5, mat('#2a2a2a')); PEN5.position.set(DX + 0.6, 1.36, -2.3); PEN5.rotation.y = 0.6; qs.add(PEN5);
const t2016 = tag('2016年の、日本のドラマ', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2016);
const tWriter = tag('脚本は、坂元裕二', { size: 56, w: 600, bg: '#3478e6', sx: 1.55 }); qs.add(tWriter);

// ---------- 6段目. 夜の大都会（x=250）。高いビルの灯り、歩道橋の上の若者たち、空に長い光の帯 ----------
const EX = 250;
{ const gr = box(30, 0.04, 30, mat('#2a2c34')); gr.position.set(EX, 0.02, -8); qs.add(gr);
  for (let i = 0; i < 14; i++) { const h = 6 + R() * 12; const b = box(2.4, h, 2.4, mat('#1e2230')); b.position.set(EX - 14 + i * 2.2, h / 2, -16 - (i % 3) * 3); qs.add(b);
    for (let k = 0; k < 10; k++) if (R() > 0.35) { const w = box(0.3, 0.25, 0.04, gl(R() > 0.5 ? '#ffe0a0' : '#c8e0ff')); w.position.set(EX - 14.6 + i * 2.2 + (k % 3) * 0.6, 1 + Math.floor(k / 3) * (h / 4), -14.78 - (i % 3) * 3); qs.add(w); } }
  const br = box(6, 0.2, 1.6, mat('#5a5e68')); br.position.set(EX, 2.2, -4); qs.add(br); for (const s of [-1, 1]) { const rl = box(6, 0.5, 0.06, mat('#6a6e78')); rl.position.set(EX, 2.55, -4 + s * 0.78); qs.add(rl); }
  for (const s of [-1, 1]) { const lg = box(0.3, 2.2, 0.3, mat('#5a5e68')); lg.position.set(EX + s * 2.6, 1.1, -4); qs.add(lg); }
  const L = new THREE.PointLight('#ffd8b0', 2.0, 10); L.position.set(EX, 4, -2); qs.add(L); }
const YOUNG6 = [BOY, GIRL, ...TOKYO].map((o, i) => person(o, EX - 1.8 + i * 0.9, -4 + (i % 2 ? 0.2 : -0.2), 0, 2.3));
const BAND6 = []; for (let i = 0; i < 16; i++) { const d = box(0.45, 0.12, 0.05, gl(i % 4 === 3 ? '#e6b450' : '#ffffff', 0.85)); d.position.set(EX - 5.4 + i * 0.72, 6.2 + Math.sin(i * 0.5) * 0.3, -6); qs.add(d); BAND6.push(d); }
const tYoung = tag('地方から東京へ出てきた、若者たちの恋', { size: 42, w: 940, bg: '#14161c', sx: 2.05 }); qs.add(tYoung);
const tLong = tag('タイトルは、未来の涙を予感する長い一文', { size: 40, w: 980, bg: '#e6b450', color: '#14161c', sx: 2.1 }); qs.add(tLong);

// ---------- shots ----------
const ALL = [tLetter, tReturn, tMove, tTrust, tTown, tGive, tDrive, tMeet, t2016, tWriter, tYoung, tLong, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotRoom(t, quiz = 0) { // 1段目 0〜9：盗まれたカバンの中に、古い手紙。持ち主に、返さなきゃ（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.4, '#06070a');
  const up = quiz ? 1 : clamp((t - 0.4) / 2.0);
  LET1.position.set(lerp(0.15, 0.25, up), lerp(0.35, 0.95, up), lerp(-3.35, -2.55, up)); LET1.rotation.set(lerp(-1.4, -0.3, up), 0.7, 0);
  BOY1.userData.arms[1].rotation.x = -0.6 - up * 0.7; BOY1.userData.arms[0].rotation.x = -0.4 - up * 0.6; BOY1.userData.head.rotation.x = 0.35 - up * 0.1;
  GLOW1.position.copy(LET1.position); GLOW1.intensity = up * 1.6;
  PAL1.userData.arms[1].rotation.x = -0.7; PAL1.userData.head.rotation.y = Math.sin(t * 0.7) * 0.4;
  Q1.position.set(-1.0, 1.5, -3.8); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tLetter, 1.05); pin(tReturn, 1.05);
  if (!quiz) { tLetter.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tLetter.visible = false; tReturn.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.4, 1.0, u), lerp(1.9, 1.7, u), lerp(0.2, -0.6, u), -0.1, 0.8, -3.2, 62);
  return qs;
}
function shotMoving(t) { // 2段目 9〜17：主人公は、都会で引っ越しの仕事をする青年。人を疑うことを、知らない
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.1; S.key.intensity = 1.0;
  BOY2.position.set(AX - 0.8 + (t % 4) * 0.5, 0, -2.4 - (t % 4) * 0.3); poseWalk(BOY2, t * 6, 0.6); BOY2.userData.arms.forEach(a => a.rotation.x = -1.5);
  SEN2.forEach((p, i) => { p.userData.arms[0].rotation.x = -0.9; p.userData.arms[1].rotation.x = -0.9; p.userData.arms[0].rotation.z = 0.6; p.userData.arms[1].rotation.z = -0.6; p.userData.head.rotation.y = Math.sin(t + i) * 0.3; });
  if (t > 4.3) { SEN2[1].userData.arms[1].rotation.set(-1.6, 0, 0); BOY2.userData.head.rotation.x = -0.1; }
  const u = ease(t / 8);
  look(AX + lerp(-2.6, -1.8, u), lerp(1.9, 1.8, u), lerp(2.4, 1.6, u), AX + 0.2, 1.1, -3.6, 62);
  pin(tMove, 1.05); pin(tTrust, 1.05);
  tMove.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMove.visible = false; tTrust.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTown(t) { // 3段目 17〜25：雪の積もる、さびれた北の町。あきらめることに、慣れた女の子
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.4; S.darken(0.35, '#3a4250'); fall(SNOW3, t);
  GIRL3.userData.arms[1].rotation.x = -0.4 + Math.sin(t * 2.2) * 0.35; GIRL3.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 2.2) * 0.3; GIRL3.userData.head.rotation.x = 0.3;
  if (t > 4.3) { GIRL3.userData.head.rotation.x = -0.2; GIRL3.userData.arms[1].rotation.x = 0; GIRL3.userData.arms[0].rotation.x = 0; }
  const u = ease(t / 8);
  look(BX + lerp(2.6, 2.0, u), lerp(1.7, 1.6, u), lerp(0.6, -0.2, u), BX + 0.4, 1.2, -4.0, 62);
  pin(tTown, 1.05); pin(tGive, 1.05);
  tTown.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTown.visible = false; tGive.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotRoad(t) { // 4段目 25〜33：トラックを飛ばして、手紙を届けに行く。そこで出会う、ふたり
  base(); S.aim(CX, -6); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.2; S.darken(0.75, '#06080e'); fall(SNOW4, t);
  const meet = t > 4.3;
  TRK4.position.z = 4 - t * 4.0; TRK4.visible = !meet;
  HL4.position.set(CX, 0.8, TRK4.position.z - 2.4); HL4.target.position.set(CX, 0, TRK4.position.z - 12); HL4.intensity = meet ? 0 : 30;
  BOY4.userData.arms[1].rotation.x = meet ? -1.2 : 0; GIRL4.userData.arms[0].rotation.x = meet ? -0.7 + ease(clamp((t - 5.4) / 1.2)) * -0.5 : 0; GIRL4.userData.head.rotation.x = 0.15;
  if (!meet) look(CX + 2.6, 1.6, TRK4.position.z - 6.5, CX, 1.2, TRK4.position.z, 64);
  else { const v = ease(clamp((t - 4.3) / 3.7)); look(CX + lerp(0.9, 0.6, v), 1.6, lerp(-20.6, -21.2, v), CX, 1.25, -24.1, 62); }
  pin(tDrive, 1.05); pin(tMeet, 1.05);
  tDrive.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDrive.visible = false; tMeet.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2016年の、日本のドラマ。脚本は、坂元裕二
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.25; S.darken(0.8, '#020204');
  SCR5.material.color.setHSL(0.58, 0.3, 0.45 + Math.sin(t * 3.1) * 0.08); L5.intensity = 3 + Math.sin(t * 3.1) * 0.6;
  BOOK5.visible = PEN5.visible = t > 4.3;
  const u = ease(t / 9);
  if (t < 4.3) look(DX + lerp(-0.3, 0.2, u), lerp(1.7, 1.6, u), lerp(1.8, 1.0, u), DX + 0.1, 1.5, -4.8, 62);
  else { const v = ease(clamp((t - 4.3) / 4)); look(DX + lerp(1.4, 1.1, v), lerp(2.2, 2.0, v), lerp(-0.6, -1.0, v), DX + 0.2, 1.1, -2.5, 62); }
  pin(t2016, 1.05); pin(tWriter, 1.05);
  t2016.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2016.visible = false; tWriter.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotCity(t) { // 6段目 42〜49（決め手）：地方から東京へ出てきた、若者たちの恋。タイトルは、未来の涙を予感する長い一文
  base(); S.aim(EX, -6); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.3; S.darken(0.75, '#060812');
  YOUNG6.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.7 + i) * 0.4; p.userData.arms[0].rotation.x = -0.2; });
  const long = t > 3.6;
  BAND6.forEach((d, i) => { d.visible = long && i < (t - 3.6) * 12; d.position.y = 6.2 + Math.sin(i * 0.5 + t) * 0.3; });
  const u = ease(t / 7);
  if (!long) look(EX + lerp(-0.6, -0.2, u), lerp(2.6, 2.8, u), lerp(2.6, 2.0, u), EX, 3.3, -4.2, 62);
  else { const v = ease(clamp((t - 3.6) / 1.4)); look(EX + lerp(-0.2, 0, v), lerp(2.8, 2.6, v), lerp(2.0, 4.6, v), EX, lerp(3.3, 4.6, v), -5.0, 64); }
  pin(tYoung, 1.05); pin(tLong, 1.05);
  if (t < 3.6) tYoung.userData.pop((t - 0.3) / 0.35); else tLong.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（アパートの一室に戻る）
  shotRoom(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRoom(t, 0) },
  { a: 9, b: 17, f: shotMoving },
  { a: 17, b: 25, f: shotTown },
  { a: 25, b: 33, f: shotRoad },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotCity },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '盗まれたカバンの中に、<br>古い手紙。'],
  [5.6, 9.0, '持ち主に、<br>返さなきゃ。'],
  [9.2, 13.2, '主人公は、都会で引っ越しの<br>仕事をする青年。'],
  [13.2, 17.0, '人を疑うことを、<br>知らない。'],
  [17.2, 21.0, '雪の積もる、<br>さびれた北の町。'],
  [21.0, 25.0, 'あきらめることに、<br>慣れた女の子。'],
  [25.2, 29.0, 'トラックを飛ばして、<br>手紙を届けに行く。'],
  [29.0, 33.0, 'そこで出会う、<br>ふたり。'],
  [33.2, 37.4, '2016年の、<br>日本のドラマ。'],
  [37.4, 41.8, '脚本は、<br>坂元裕二。'],
  [42.2, 45.4, '地方から東京へ出てきた、<br>若者たちの恋。'],
  [45.4, 49.0, 'タイトルは、未来の涙を<br>予感する長い一文。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、いつかこの恋を思い出して<br>きっと泣いてしまう。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q153', v2: true, answer: 'いつかこの恋を思い出してきっと泣いてしまう',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 15310,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [13.2, 'bubble'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'bubble'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [45.4, 'bubble'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'いつかこの恋を思い出して': 'いつかこのこいをおもいだして', 'きっと泣いてしまう': 'きっとないてしまう', '坂元裕二': 'さかもとゆうじ', '2016年': 'にせんじゅうろくねん', '盗まれた': 'ぬすまれた', '古い手紙': 'ふるいてがみ', '手紙': 'てがみ', '中に': 'なかに', '持ち主': 'もちぬし', '返さなきゃ': 'かえさなきゃ', '主人公': 'しゅじんこう', '東京': 'とうきょう', '都会': 'とかい', '引っ越し': 'ひっこし', '仕事': 'しごと', '青年': 'せいねん', '人を疑う': 'ひとをうたがう', '知らない': 'しらない', '雪の積もる': 'ゆきのつもる', '北の町': 'きたのまち', '慣れた': 'なれた', '女の子': 'おんなのこ', '飛ばして': 'とばして', '届けに行く': 'とどけにいく', '出会う': 'であう', '日本': 'にほん', '脚本': 'きゃくほん', '地方': 'ちほう', '出てきた': 'でてきた', '若者': 'わかもの', '恋': 'こい', '未来': 'みらい', '涙': 'なみだ', '予感': 'よかん', '長い一文': 'ながいいちぶん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n盗まれたカバンの中に、古い手紙。持ち主に、返さなきゃ。主人公は、都会で引っ越しの仕事をする青年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'ドラマ好き', '日本のドラマ', '恋愛ドラマ'],
  },
});
applyQuizCards({ answer: 'いつかこの恋を<br>思い出して<br>きっと泣いてしまう', info: 'FOD｜日本のドラマ・全10話', answerSize: 76 });
