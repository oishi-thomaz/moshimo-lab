import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #069 最愛（ドラマ・日本・2021年・TBS 金曜ドラマ・全10話。Prime Video・Netflix で見放題（Disney+ も）、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/zui-ai で2026/11/11確認（Filmarks の動画配信欄も Prime Video・Netflix・U-NEXT 見放題）。
//   Filmarks 4.3・レビュー55,429件 filmarks.com/dramas/11129/15471）
// 確かめた事実（JustWatch の作品紹介・Filmarks の作品紹介・ja.wikipedia.org/wiki/最愛_(テレビドラマ)。2026/11/11）：
//   ・2006年、主人公が青春時代を過ごしたのどかな田舎町で失踪事件が起きた（JustWatch）。舞台は合掌造りの村（Wikipedia）
//   ・主人公は当時高校生。父は大学の陸上部の寮の管理人で、父を手伝いながら大学の化学の道を志し、弟のための薬を作る夢をもつ（Wikipedia）
//   ・15年後、主人公は製薬会社の社長になっている（Wikipedia）。時代を牽引する実業家（JustWatch）
//   ・殺人事件の重要参考人となり、事件を追う刑事は主人公の初恋の相手。あらゆる手段で主人公を守ろうとする弁護士がいる（JustWatch・Filmarks）
//   ・刑事は2006年当時、大学の陸上部員で、主人公と想いを寄せ合っていた（Wikipedia）
//   ・TBS 金曜ドラマ（夜10時）、2021年10月〜12月放送。サスペンスラブストーリー（JustWatch・Wikipedia）
// 構成（ヒント6段）：1 15年前、山あいの静かな村で失踪事件 → 2 父は大学陸上部の寮の管理人、薬をつくる夢 → 3 15年後、製薬会社の社長に
//   → 4 殺人事件の重要参考人、追う刑事はかつて想いを寄せ合った人 → 5 2021年の日本のドラマ、サスペンスとラブストーリー → 6 決め手：刑事が疑うのはいちばん大切な人・タイトルは漢字2文字
// 犯人・真相・結末は言わない。人物名・村の名前・会社名は出さない。俳優の顔・ポスター・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#1c2434', floor: '#3a4a3a', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(6969);

const RIO = { skin: '#f4d3b5', hair: '#1d1a19', shirt: '#f0f0f4', pants: '#2b3346', long: true, skirt: true, scale: 0.9 };
const RIO_NOW = { skin: '#f4d3b5', hair: '#1d1a19', shirt: '#e9e4da', pants: '#e9e4da', long: true, skirt: true };
const DAD = { skin: '#e8b98f', hair: '#5a5a5a', shirt: '#5a7a5a', pants: '#4a4a4a' };
const COP = { skin: '#e8b98f', hair: '#1d1a19', shirt: '#4a4a52', pants: '#2b2b30' };
const LAW = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#1e2a44', pants: '#1e2a44', tie: true };
const RUN = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#d9a57c'][i % 3], hair: '#1d1a19', shirt: ['#2f6fd0', '#2f6fd0', '#e9e4da'][i % 3], pants: '#1e2a44' });
const VIL = (i) => ({ skin: ['#f1c9a5', '#e8b98f'][i % 2], hair: ['#1d1a19', '#5a5a5a', '#2c2421'][i % 3], shirt: ['#5a4a3a', '#3a4a5a', '#6a5a4a'][i % 3], pants: '#2b2b30' });

// かやぶきの家（汎用の三角屋根）
function thatch(x, z, ry = 0, s = 1) {
  const g = new THREE.Group();
  const w = box(3.2, 1.6, 2.4, mat('#8a6a4a')); w.position.y = 0.8; g.add(w);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 2.4, 2.6, 4, 1), mat('#9a8458')); roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, 0.75); roof.position.y = 2.9; g.add(roof);
  const win = box(0.6, 0.5, 0.05, new THREE.MeshBasicMaterial({ color: '#ffcf7a' })); win.position.set(0.6, 1.0, 1.23); g.add(win);
  g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); qs.add(g); return g;
}

// ---------- 1段目. 夜の山あいの村（x=0）。かやぶきの家、懐中電灯で人をさがす村人たち ----------
{ for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(9 + i % 3 * 3, 10 + (i % 2) * 4, 6), mat('#1e2a24')); m.position.set(-24 + i * 8, 4.5, -26 - (i % 2) * 6); qs.add(m); }
  thatch(-4.2, -6, 0.3); thatch(3.6, -7.5, -0.2); thatch(-9, -12, 0.1, 1.1); thatch(9, -12.5, -0.3, 1.1);
  const path = box(2.2, 0.03, 20, mat('#6a6050')); path.position.set(0, 0.02, -2); qs.add(path);
  for (let i = 0; i < 18; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 7), mat('#26402c')); t.position.set((i % 2 ? 1 : -1) * (7 + R() * 6), 1.3, -2 - i * 1.2); qs.add(t); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 14), new THREE.MeshBasicMaterial({ color: '#f4ecc8' })); moon.position.set(7, 13, -30); qs.add(moon); }
const VILS = [], BEAMS = [];
for (let i = 0; i < 4; i++) {
  const p = makePerson(VIL(i)); p.position.set(-2.4 + i * 1.6, 0, -3.4 - (i % 2) * 1.2); qs.add(p); VILS.push(p);
  const bm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); qs.add(bm); BEAMS.push(bm);
  const gl = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.22, depthWrite: false })); bm.add(gl);
}
const girl1 = makePerson(RIO); girl1.position.set(0.3, 0, 0.6); girl1.rotation.y = Math.PI; qs.add(girl1);
const tNight = tag('15年前の、ある夜', { size: 62, w: 600, bg: '#14161c', sx: 2.2 }); tNight.position.set(0.2, 2.75, -1.5); qs.add(tNight);
const tGone = tag('失踪事件', { size: 80, w: 420, bg: '#c43a3a', sx: 1.6 }); tGone.position.set(0.2, 2.75, -1.5); qs.add(tGone);

// ---------- 2段目. 昼の寮の前（x=40）。陸上部の学生が走る。高校生の主人公が父を手伝う ----------
const AX = 40;
{ const gr = box(24, 0.04, 16, mat('#7a9a5a')); gr.position.set(AX, 0.02, -3); qs.add(gr);
  const dorm = box(9, 4.2, 3, mat('#d8ccb0')); dorm.position.set(AX - 1, 2.1, -8); qs.add(dorm);
  const rf = box(9.4, 0.25, 3.4, mat('#5a4a3a')); rf.position.set(AX - 1, 4.3, -8); qs.add(rf);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 5; i++) { const w = box(0.9, 0.9, 0.05, mat('#9ab8d0')); w.position.set(AX - 4.6 + i * 1.8, 1.3 + f * 1.8, -6.47); qs.add(w); }
  const trk = box(24, 0.03, 2.2, mat('#b85a3a')); trk.position.set(AX, 0.04, -4.2); qs.add(trk);
  for (const z of [-3.2, -5.2]) { const ln = box(24, 0.035, 0.05, mat('#f4f0e4')); ln.position.set(AX, 0.05, z); qs.add(ln); }
  const line = box(0.03, 0.03, 3.6, mat('#e9e4da')); line.position.set(AX + 3.4, 1.5, -2.4); qs.add(line);
  for (const z of [-4.2, -0.6]) { const pl = box(0.08, 1.6, 0.08, mat('#8a8a8a')); pl.position.set(AX + 3.4, 0.8, z); qs.add(pl); }
  for (let i = 0; i < 4; i++) { const tw = box(0.5, 0.6, 0.02, mat(['#f4f0e4', '#2f6fd0', '#f4f0e4', '#e9e4da'][i])); tw.position.set(AX + 3.4, 1.2, -3.8 + i * 0.8); tw.rotation.y = Math.PI / 2; qs.add(tw); } }
const RUNNERS = []; for (let i = 0; i < 3; i++) { const p = makePerson(RUN(i)); p.rotation.y = Math.PI / 2; qs.add(p); RUNNERS.push(p); }
const girl2 = makePerson(RIO); girl2.position.set(AX + 2.4, 0, -1.6); girl2.rotation.y = -1.2; qs.add(girl2);
const BASKET = box(0.6, 0.3, 0.4, mat('#c8a070')); qs.add(BASKET);
const dad2 = makePerson(DAD); dad2.position.set(AX + 0.6, 0, -2.2); dad2.rotation.y = 0.6; qs.add(dad2);
const FLASK = new THREE.Group(); { const b = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.5, 18), new THREE.MeshStandardMaterial({ color: '#bfe8f0', transparent: true, opacity: 0.75 })); FLASK.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), new THREE.MeshStandardMaterial({ color: '#bfe8f0', transparent: true, opacity: 0.75 })); n.position.y = 0.38; FLASK.add(n); const lq = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.24, 18), new THREE.MeshBasicMaterial({ color: '#5ad0a0' })); lq.position.y = -0.12; FLASK.add(lq); } qs.add(FLASK);
const tDorm = tag('父は、寮の管理人', { size: 62, w: 600, bg: '#14161c', sx: 2.0 }); tDorm.position.set(AX + 1.5, 2.9, -1.6); qs.add(tDorm);
const tDream = tag('夢は、薬をつくること', { size: 58, w: 680, bg: '#2f8f7a', sx: 2.2 }); tDream.position.set(AX + 1.5, 2.9, -1.6); qs.add(tDream);

// ---------- 3段目. 15年後の都会（x=80）。高層ビルの社長室。大きな窓の前に立つ主人公 ----------
const BX = 80;
{ const fl = box(14, 0.04, 10, mat('#3a3e48')); fl.position.set(BX, 0.02, -1); qs.add(fl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: canvasTex(600, 300, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a9ad8'); gr.addColorStop(1, '#d8e4f0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { const bw = 16 + (i * 37) % 24, bh = 60 + (i * 53) % 170, x = (i * 23) % w; g.fillStyle = ['#7a8aa0', '#8a9ab0', '#6a7a90'][i % 3]; g.fillRect(x, h - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.35)'; for (let y = h - bh + 8; y < h - 6; y += 12) g.fillRect(x + 4, y, bw - 8, 4); } }) }));
  win.position.set(BX, 3, -4.5); qs.add(win);
  for (let i = 0; i < 5; i++) { const fr = box(0.08, 6, 0.08, mat('#2a2e38')); fr.position.set(BX - 6 + i * 3, 3, -4.45); qs.add(fr); }
  const desk = box(2.6, 0.08, 1.1, mat('#2a2018')); desk.position.set(BX + 0.2, 0.8, -1.6); qs.add(desk);
  const dk2 = box(2.4, 0.76, 0.9, mat('#3a2a20')); dk2.position.set(BX + 0.2, 0.38, -1.6); qs.add(dk2);
  const pc = box(0.6, 0.4, 0.04, mat('#14161c')); pc.position.set(BX + 0.7, 1.05, -1.8); qs.add(pc);
  const ch = box(0.7, 1.4, 0.2, mat('#14161c')); ch.position.set(BX + 0.2, 0.9, -2.7); qs.add(ch); }
const rio3 = makePerson(RIO_NOW); rio3.position.set(BX - 1.6, 0, -3.0); rio3.rotation.y = Math.PI; qs.add(rio3);
const STAFF = []; for (let i = 0; i < 3; i++) { const p = makePerson({ skin: '#f1c9a5', hair: '#1d1a19', shirt: '#2a3040', pants: '#2a3040', tie: i !== 1, long: i === 1, skirt: i === 1 }); p.position.set(BX + 0.4 + i * 1.0, 0, -0.2); p.rotation.y = Math.PI; qs.add(p); STAFF.push(p); }
const t15 = tag('15年後', { size: 80, w: 380, bg: '#14161c', sx: 1.5 }); t15.position.set(BX - 0.8, 2.75, -2.0); qs.add(t15);
const tCEO = tag('製薬会社の、社長', { size: 62, w: 600, bg: '#2f8f7a', sx: 2.0 }); tCEO.position.set(BX - 0.8, 2.75, -2.0); qs.add(tCEO);

// ---------- 4段目. 取調室のような部屋（x=120）。刑事と向かい合う主人公、となりに弁護士 ----------
const CX = 120;
{ const fl = box(12, 0.04, 10, mat('#4a4a50')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#7a7e88')); wl.position.set(CX, 2.5, -4); qs.add(wl);
  const tb = box(2.0, 0.08, 1.0, mat('#8a8a8e')); tb.position.set(CX, 0.75, -1.6); qs.add(tb);
  const tl = box(1.9, 0.72, 0.9, mat('#5a5a60')); tl.position.set(CX, 0.37, -1.6); qs.add(tl);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#f4f0d0', side: THREE.DoubleSide })); lamp.position.set(CX, 3.0, -1.6); qs.add(lamp);
  const file = box(0.5, 0.03, 0.36, mat('#e9dcc0')); file.position.set(CX - 0.3, 0.81, -1.5); qs.add(file); }
const rio4 = makePerson(RIO_NOW); rio4.position.set(CX - 1.4, 0, -1.6); rio4.rotation.y = Math.PI / 2; qs.add(rio4);
const law4 = makePerson(LAW); law4.position.set(CX - 2.0, 0, -0.6); law4.rotation.y = Math.PI / 2 + 0.3; qs.add(law4);
const cop4 = makePerson(COP); cop4.position.set(CX + 1.4, 0, -1.6); cop4.rotation.y = -Math.PI / 2; qs.add(cop4);
const BADGE = box(0.22, 0.3, 0.04, mat('#2a2018')); qs.add(BADGE);
const tWit = tag('重要参考人', { size: 76, w: 460, bg: '#c43a3a', sx: 1.7 }); tWit.position.set(CX, 2.9, -1.4); qs.add(tWit);
const tFirst = tag('刑事は、初恋の人', { size: 62, w: 580, bg: '#14161c', sx: 2.0 }); tFirst.position.set(CX + 0.6, 2.55, -1.6); qs.add(tFirst);

// ---------- 5段目. 夜の居間のテレビ（x=180）。2021年の日本のドラマ、金曜よる10時 ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(3.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.1, -3.5); qs.add(tvb);
  const sofa = box(3.0, 0.5, 1.0, mat('#6a4a4a')); sofa.position.set(TX, 0.25, 1.6); qs.add(sofa); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a1a3a'); gr.addColorStop(1, '#6a2a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % w, (i * 61) % h, 3, 3); g.strokeStyle = 'rgba(255,200,200,.5)'; g.lineWidth = 10; g.beginPath(); g.moveTo(w * 0.5, h * 0.82); g.bezierCurveTo(w * 0.2, h * 0.55, w * 0.32, h * 0.18, w * 0.5, h * 0.36); g.bezierCurveTo(w * 0.68, h * 0.18, w * 0.8, h * 0.55, w * 0.5, h * 0.82); g.stroke(); }) }));
TV.position.set(TX, 2.1, -3.42); qs.add(TV);
const t2021 = tag('2021年 日本のドラマ', { size: 60, w: 660, bg: '#e6b450', color: '#14161c', sx: 2.6 }); t2021.position.set(TX, 4.1, -3.0); qs.add(t2021);
const tGenre = tag('サスペンス × 恋', { size: 66, w: 560, bg: '#c43a3a', sx: 2.2 }); tGenre.position.set(TX, 4.1, -3.0); qs.add(tGenre);

// ---------- 6段目. 雨の夜の橋（x=220）。刑事と主人公が向かい合う。あいだに割れたハート ----------
const DX = 220;
{ const br = box(4, 0.2, 12, mat('#4a4e58')); br.position.set(DX, 0.1, -2); qs.add(br);
  for (const s of [-1, 1]) { const rl = box(0.1, 0.9, 12, mat('#8a8e98')); rl.position.set(DX + s * 2, 0.65, -2); qs.add(rl); }
  for (let i = 0; i < 6; i++) { const lp = box(0.1, 3, 0.1, mat('#2a2e38')); lp.position.set(DX + (i % 2 ? 2 : -2), 1.5, -6 + Math.floor(i / 2) * 4); qs.add(lp); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); bl.position.set(lp.position.x, 3.05, lp.position.z); qs.add(bl); } }
const RAIN = []; { const rm = new THREE.MeshBasicMaterial({ color: '#a8c0e0', transparent: true, opacity: 0.5 }); for (let i = 0; i < 90; i++) { const d = box(0.015, 0.4, 0.015, rm); d.userData.x = DX - 4 + R() * 8; d.userData.z = -6 + R() * 9; d.userData.o = R() * 6; qs.add(d); RAIN.push(d); } }
const rio6 = makePerson(RIO_NOW); rio6.position.set(DX - 0.8, 0.2, -1.4); rio6.rotation.y = Math.PI / 2; qs.add(rio6);
const cop6 = makePerson(COP); cop6.position.set(DX + 0.8, 0.2, -1.4); cop6.rotation.y = -Math.PI / 2; qs.add(cop6);
const HEART = new THREE.Group(); { const shp = new THREE.Shape(); shp.moveTo(0, -0.5); shp.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35); shp.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5); const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.15, bevelEnabled: false }); const L = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#e2483c', clippingPlanes: [] })); HEART.add(L); } HEART.position.set(DX, 2.6, -1.4); qs.add(HEART);
const tLove = tag('疑うのは、愛した人', { size: 60, w: 620, bg: '#14161c', sx: 2.2 }); tLove.position.set(DX, 3.6, -1.4); qs.add(tLove);
const tKanji = tag('タイトルは漢字2文字', { size: 60, w: 640, bg: '#e6b450', color: '#14161c', sx: 2.3 }); tKanji.position.set(DX, 3.6, -1.4); qs.add(tKanji);

// ---------- shots ----------
const ALL = [tNight, tGone, tDorm, tDream, t15, tCEO, tWit, tFirst, t2021, tGenre, tLove, tKanji];
function base() { S.reset(); ALL.forEach(x => x.visible = false); FLASK.visible = false; }

function shotVillage(t, quiz = 0) { // 1段目 0〜9：15年前、山あいの静かな村で失踪事件が起きた（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.75; S.key.intensity = 0.6; S.darken(0.3, '#0a0e18');
  VILS.forEach((p, i) => { const sw = Math.sin(t * 1.4 + i * 1.7); p.rotation.y = Math.PI * 0.9 + sw * 0.7 + i; poseWalk(p, t * 4 + i, 0.4);
    p.userData.arms[1].rotation.x = -1.1; const bm = BEAMS[i]; bm.position.set(p.position.x + Math.sin(p.rotation.y) * 0.75 - Math.cos(p.rotation.y) * 0.32, 1.45, p.position.z + Math.cos(p.rotation.y) * 0.75 + Math.sin(p.rotation.y) * 0.32); });
  girl1.userData.head.rotation.y = Math.sin(t * 0.8) * 0.4;
  if (!quiz) { tNight.userData.pop(1); if (t > 4.4) tNight.visible = false; tGone.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.9, 0.6, u), lerp(2.2, 2.0, u), lerp(6.6, 5.4, u), 0.0, 1.8, -5, 58);
  return qs;
}
function shotDorm(t) { // 2段目 9〜17：父は大学陸上部の寮の管理人。寮を手伝いながら、薬をつくる夢を追う
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.3;
  RUNNERS.forEach((p, i) => { p.position.set(AX - 9 + ((t * 3.2 + i * 2.2) % 18), 0, -4.0 - (i % 2) * 0.5); poseWalk(p, t * 11 + i, 1.2); p.userData.arms.forEach(a => a.rotation.x *= 1.4); });
  girl2.userData.arms.forEach(a => a.rotation.x = -0.9); BASKET.position.set(girl2.position.x - 0.32, 0.86, girl2.position.z + 0.25);
  dad2.userData.arms[0].rotation.x = -0.6 + Math.sin(t * 2) * 0.3;
  if (t > 4.2) { FLASK.visible = true; FLASK.position.set(AX + 2.5, 2.05 + Math.sin(t * 2) * 0.05, -1.2); FLASK.rotation.y = t; FLASK.scale.setScalar(ease(clamp((t - 4.2) / 0.4))); }
  tDorm.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDorm.visible = false; tDream.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(4.6, 4.0, u), lerp(2.0, 1.9, u), lerp(4.6, 4.0, u), AX + 1.2, 1.4, -2.4, 58);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：15年後、都会の高層ビル。製薬会社の若き社長に
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.2;
  const turn = ease(clamp((t - 3.8) / 0.8)); rio3.rotation.y = lerp(Math.PI, 0.25, turn);
  STAFF.forEach((p, i) => { p.rotation.y = Math.atan2(rio3.position.x - p.position.x, rio3.position.z - p.position.z); const bow = t > 4.6 ? ease(clamp((t - 4.6 - i * 0.1) / 0.4)) * 0.5 : 0; p.userData.head.rotation.x = bow; });
  t15.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t15.visible = false; tCEO.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX - lerp(2.6, 2.3, u), lerp(2.2, 2.1, u), lerp(3.4, 2.8, u), BX - 0.2, 1.5, -2.4, 60);
  return qs;
}
function shotRoom(t) { // 4段目 25〜33：殺人事件の重要参考人に。追う刑事は、かつて想いを寄せ合った人
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.3);
  S.spot.color.set(0xfff0d0); S.spot.position.set(CX, 3.2, -1.6); S.spot.target.position.set(CX, 0, -1.6); S.spot.intensity = 26;
  const up = ease(clamp((t - 0.6) / 0.5)); cop4.userData.arms[1].rotation.x = -1.4 * up; BADGE.position.set(CX + 1.15, 1.25 + 0.25 * up, -1.35); BADGE.rotation.y = -Math.PI / 2; BADGE.visible = up > 0.1 && t < 4.4;
  law4.userData.arms[0].rotation.x = -0.4;
  rio4.userData.head.rotation.x = t > 4.4 ? -0.1 : 0.15;
  tWit.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWit.visible = false; tFirst.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(CX + lerp(0.2, 0.1, u), lerp(2.6, 2.5, u), lerp(4.6, 4.0, u), CX, 1.4, -1.6, 58);
  else look(CX - 2.4, 1.9, lerp(1.4, 1.0, u), CX + 0.8, 1.7, -1.7, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2021年に放送された日本のドラマ。サスペンスとラブストーリー
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.5, '#0a0810');
  t2021.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2021.visible = false; tGenre.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.8, 3.0, u), lerp(5.4, 4.6, u), TX, 2.6, -3.4, 58);
  return qs;
}
function shotBridge(t) { // 6段目 42〜49（決め手）：刑事が疑うのは、いちばん大切な人。タイトルは漢字2文字
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.65; S.key.intensity = 0.7; S.darken(0.45, '#0a0e18');
  RAIN.forEach(d => { const y = 5 - ((t * 9 + d.userData.o) % 6); d.position.set(d.userData.x, y, d.userData.z); });
  HEART.rotation.y = Math.sin(t * 1.2) * 0.5; HEART.scale.setScalar(Math.max(1e-4, ease(clamp((t - 0.6) / 0.5))) * 0.9);
  tLove.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tLove.visible = false; tKanji.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + 0.1, lerp(2.0, 2.1, u), lerp(5.2, 4.4, u), DX, 2.0, -1.4, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の村に戻る）
  shotVillage(6.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.55, 0.35, d); S.darken(0.35 + 0.25 * d, '#0a0e18');
  const k = ease(t / 7);
  look(lerp(0.6, 0.4, k), lerp(2.0, 1.8, k), lerp(5.4, 4.6, k), 0.0, 1.6, -5, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotVillage(t, 0) },
  { a: 9, b: 17, f: shotDorm },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotRoom },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotBridge },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '15年前、山あいの<br>静かな村で。'],
  [5.6, 9.0, 'ある失踪事件が、<br>起きた。'],
  [9.2, 13.2, '主人公は高校生。父は<br>大学陸上部の寮の管理人。'],
  [13.2, 17.0, '寮を手伝いながら、<br>薬をつくる夢を追う。'],
  [17.2, 21.0, '15年後、彼女は<br>都会の高層ビルにいた。'],
  [21.0, 25.0, '製薬会社の、<br>若き社長になっていた。'],
  [25.2, 29.0, 'ある殺人事件の、<br>重要参考人になる。'],
  [29.0, 33.0, '追う刑事は、かつて<br>想いを寄せ合った人。'],
  [33.2, 37.4, '2021年に放送された、<br>日本のドラマ。'],
  [37.4, 41.8, 'サスペンスと<br>ラブストーリーが重なる。'],
  [42.2, 45.4, '刑事が疑うのは、<br>いちばん大切な人。'],
  [45.4, 49.0, 'タイトルは、<br>漢字2文字。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>最愛。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q069', v2: true, answer: '最愛',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 6969,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '15年前': 'じゅうごねんまえ', '山あい': 'やまあい', '静かな': 'しずかな', '村': 'むら', '失踪事件': 'しっそうじけん', '起きた': 'おきた', '主人公': 'しゅじんこう', '高校生': 'こうこうせい', '父': 'ちち', '大学': 'だいがく', '陸上部': 'りくじょうぶ', '寮': 'りょう', '管理人': 'かんりにん', '手伝い': 'てつだい', '薬': 'くすり', '夢': 'ゆめ', '追う': 'おう', '15年後': 'じゅうごねんご', '彼女': 'かのじょ', '都会': 'とかい', '高層': 'こうそう', '製薬会社': 'せいやくがいしゃ', '若き': 'わかき', '社長': 'しゃちょう', '殺人事件': 'さつじんじけん', '重要参考人': 'じゅうようさんこうにん', '刑事': 'けいじ', '想い': 'おもい', '寄せ合った': 'よせあった', '人': 'ひと', '2021年': 'にせんにじゅういちねん', '放送': 'ほうそう', '日本': 'にほん', '重なる': 'かさなる', '疑う': 'うたがう', '大切': 'たいせつ', '漢字2文字': 'かんじにもじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '最愛': 'さいあい', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n15年前、山あいの静かな村で、ある失踪事件が起きた。主人公は高校生。父は大学陸上部の寮の管理人。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'ネトフリ', 'ドラマ好き', 'サスペンス'],
  },
});
applyQuizCards({ answer: '最愛', info: 'Prime Video・Netflix｜日本・全10話', answerSize: 150 });
