import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #041 アイドル（曲・YOASOBI・2023年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/4）：
//   ・配信開始 2023年4月12日、日本レコード協会のストリーミング認定 ダイヤモンド（5億回以上。2024年1月度。riaj.or.jp/data/st/search/ で「アイドル」）
//   ・TVアニメ「【推しの子】」のオープニングテーマ。Billboard の Global Excl. U.S. で日本語の曲として初めての1位（2023年6月。realsound.jp/2023/12/post-1511898.html ほか）
//   ・YOASOBI は小説を音楽にする2人組のユニット
// 物語：曲が描く状況（ステージの真ん中で誰もが夢中になるアイドル → 素顔は誰も知らない → ファンに向ける言葉は作ったもの → いつかセリフに心が追いつけば）を
//   自分の言葉で作り直したもの。歌詞の言葉・言い回しは使わない（歌詞と見比べて、重なる言葉がないことを確かめた）。アニメの絵・登場人物・音源・ジャケット・歌手の見た目は使わない
// 構成（ヒント6段）：1 スポットライトの真ん中で手をふる少女・歓声 → 2 グループのセンター・素顔を知る人はいない → 3 ペンライトの海・楽屋では表情が消える
//   → 4 ファンへのセリフは作りもの・いつか心が追いつけば → 5 2023年・アニメの主題歌・世界のチャートで日本語の歌として初の1位 → 6 決め手：小説を音楽にする2人組・カタカナ4文字

const S = quizStage({ bg: '#140e24', floor: '#1a1430', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(4141);

const IDOL = { skin: '#f6dcc8', hair: '#d8a8e0', shirt: '#ff8ac0', pants: '#ffffff', long: true, skirt: true };
const PURPLE = '#9a5ad8';

// ---------- 1段目. ライブのステージ（x=0）。真ん中の少女と、客席のペンライト ----------
{ const st = box(10, 0.8, 5, mat('#2a2438')); st.position.set(0, 0.4, -3); qs.add(st); const edge = box(10, 0.06, 0.06, new THREE.MeshBasicMaterial({ color: '#ff8ac0' })); edge.position.set(0, 0.82, -0.52); qs.add(edge);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ map: canvasTex(256, 160, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h * 0.4, 4, w / 2, h * 0.4, w * 0.6); gr.addColorStop(0, '#ff9ad0'); gr.addColorStop(0.5, '#6a2a8a'); gr.addColorStop(1, '#140e24'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); back.position.set(0, 4.5, -5.6); qs.add(back); }
const idol1 = makePerson(IDOL); idol1.position.set(0, 0.8, -2.6); qs.add(idol1);
const SIDE = [-1.6, 1.6].map(x => { const p = makePerson({ ...IDOL, hair: '#3a2a30', shirt: '#c86aa8' }); p.position.set(x, 0.8, -3.4); qs.add(p); return p; });
const SPOT1 = new THREE.SpotLight(0xffe8f4, 0, 14, 0.35, 0.5, 1.2); SPOT1.position.set(0, 9, 0); SPOT1.target.position.set(0, 0.8, -2.6); qs.add(SPOT1); qs.add(SPOT1.target);
const BEAMS = []; for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.9, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: ['#ff8ac0', '#8ac8ff', '#c8a0ff', '#ffe08a'][i], transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); b.position.set(-4.5 + i * 3, 4.5, -4.5); qs.add(b); BEAMS.push(b); }
const PEN = []; for (let i = 0; i < 90; i++) { const c = ['#ff6ab0', '#6ac8ff', '#c88aff', '#ffe06a'][i % 4]; const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), new THREE.MeshBasicMaterial({ color: c })); p.userData.x = -6 + (i % 18) * 0.7 + (R() - 0.5) * 0.3; p.userData.z = 1 + Math.floor(i / 18) * 0.9; p.userData.o = R() * 6; qs.add(p); PEN.push(p); }
const tCenter = tag('真ん中の少女', { size: 70, w: 480, bg: '#14161c', sx: 2.6 }); tCenter.position.set(0, 3.5, -2.2); qs.add(tCenter);
const tCheer = tag('割れるような歓声', { size: 64, w: 560, bg: PURPLE, sx: 2.8 }); tCheer.position.set(0, 3.5, -2.2); qs.add(tCheer);

// ---------- 2段目. 取材のマイク（x=40）。答えをするりとかわす ----------
const KX = 40;
{ const wl = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: '#2a2040' })); wl.position.set(KX, 3, -4); qs.add(wl);
  for (let i = 0; i < 12; i++) { const fl = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })); fl.position.set(KX - 5 + (i % 6) * 2, 1.6 + Math.floor(i / 6) * 2.4, -3.9); qs.add(fl); (qs.userData.flash = qs.userData.flash || []).push(fl); } }
const idol2 = makePerson(IDOL); idol2.position.set(KX, 0, -1.6); qs.add(idol2);
const MICS = []; for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 8), mat('#2a2a2e')); st.rotation.x = Math.PI / 2; st.position.z = 0.65; g.add(st); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), mat('#4a4a52')); g.add(hd); g.userData.a = (i - 2) * 0.35; qs.add(g); MICS.push(g); }
const QS = []; for (let i = 0; i < 4; i++) { const q = tag('？', { size: 100, w: 150, h: 150, bg: 'rgba(0,0,0,0)', color: '#ffe06a', sx: 0.5 }); qs.add(q); QS.push(q); }
const tGroup = tag('グループのセンター', { size: 60, w: 600, bg: '#14161c', sx: 1.8 }); tGroup.position.set(KX, 2.85, -1.2); qs.add(tGroup);
const tFace = tag('素顔を知る人はいない', { size: 60, w: 620, bg: PURPLE, sx: 1.8 }); tFace.position.set(KX, 2.85, -1.2); qs.add(tFace);

// ---------- 3段目. 楽屋（x=90）。電球の鏡の前で、表情が消える ----------
const CX = 90;
{ const fl = box(10, 0.04, 8, mat('#3a3040')); fl.position.set(CX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#4a4058')); wl.position.set(CX, 3, -3.4); qs.add(wl);
  const dk = box(3, 0.08, 0.8, mat('#e8e0e8')); dk.position.set(CX, 0.82, -2.8); qs.add(dk);
  const mr = box(2.2, 1.5, 0.04, new THREE.MeshBasicMaterial({ color: '#5a6a88' })); mr.position.set(CX, 1.9, -3.25); qs.add(mr);
  for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe8b0' })); const k = i / 12; const x = k < 0.5 ? -1.2 + k * 4.8 : 1.2 - (k - 0.5) * 4.8; b.position.set(CX + x, k < 0.5 ? 2.75 : 1.05, -3.2); qs.add(b); }
  const hg = box(0.05, 1.4, 0.05, mat('#8a8e96')); hg.position.set(CX - 2.6, 1.6, -2.6); qs.add(hg); const dress = box(0.6, 0.8, 0.1, mat('#ff8ac0')); dress.position.set(CX - 2.6, 1.6, -2.5); qs.add(dress); }
{ const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 16), mat('#6a5a7a')); stool.position.set(CX + 0.2, 0.25, -1.5); qs.add(stool); }
const idol3 = makePerson(IDOL); idol3.position.set(CX + 0.2, -0.32, -1.5); idol3.rotation.y = Math.PI * 0.72; idol3.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(idol3);

const tPen = tag('何万本ものペンライト', { size: 58, w: 640, bg: '#14161c', sx: 1.5 }); tPen.position.set(CX, 2.95, -1.6); qs.add(tPen);
const tBlank = tag('楽屋では表情が消える', { size: 58, w: 660, bg: PURPLE, sx: 1.9 }); tBlank.position.set(CX + 0.5, 2.75, -2.2); qs.add(tBlank);

// ---------- 4段目. 作ったセリフ（x=130）。にこにこの仮面と、本物になってほしい気持ち ----------
const BX = 130;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ color: '#1e1430' })); bg.position.set(BX, 3.5, -3.6); qs.add(bg); }
const idol4 = makePerson(IDOL); idol4.position.set(BX, 0, -1.6); qs.add(idol4);
const MASK = new THREE.Group(); qs.add(MASK);
{ const m = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), mat('#fff4f8')); MASK.add(m);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 6, 12, Math.PI), mat('#2a2a30')); e.position.set(s * 0.12, 0.06, 0.01); MASK.add(e); }
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 6, 16, Math.PI), mat('#e8487a')); mo.rotation.z = Math.PI; mo.position.set(0, -0.06, 0.01); MASK.add(mo);
  const st = box(0.03, 0.4, 0.02, mat('#d8b860')); st.position.set(0, -0.5, -0.01); MASK.add(st); }
const GLOWH = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const sh = new THREE.Shape(); sh.moveTo(0, -0.3); sh.bezierCurveTo(0.5, 0.05, 0.3, 0.42, 0, 0.18); sh.bezierCurveTo(-0.3, 0.42, -0.5, 0.05, 0, -0.3); return sh; })(), { depth: 0.08, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: '#ff8ac0', transparent: true })); GLOWH.position.set(BX, 1.25, -1.3); qs.add(GLOWH);
const tLine = tag('ファンへのセリフは作りもの', { size: 52, w: 720, bg: '#14161c', sx: 1.9 }); tLine.position.set(BX, 2.75, -1.2); qs.add(tLine);
const tReal = tag('心が追いつけば', { size: 68, w: 460, bg: PURPLE, sx: 1.6 }); tReal.position.set(BX, 2.75, -1.2); qs.add(tReal);

// ---------- 5段目. 2023年・アニメの主題歌・世界のチャートで1位（x=170） ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1834' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX - 1.3, 3.2, -1.6); DISC.scale.setScalar(0.8); qs.add(DISC);
const GLOBE = new THREE.Mesh(new THREE.SphereGeometry(0.95, 28, 20), new THREE.MeshStandardMaterial({ color: '#3a8ad8', roughness: 0.6, map: canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#3a8ad8'; g.fillRect(0, 0, w, h); g.fillStyle = '#5ac87a'; [[20, 18, 18, 14], [52, 12, 16, 22], [84, 20, 22, 16], [100, 40, 12, 10], [30, 40, 10, 12]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(x, y, a / 2, b / 2, 0, 0, Math.PI * 2); g.fill(); }); }) })); GLOBE.position.set(FX + 1.3, 3.2, -1.6); qs.add(GLOBE);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 4.6, -1.4); BARS.scale.set(0.8, 0.35, 0.8); qs.add(BARS);
const tYear = tag('2023年 アニメの主題歌', { size: 58, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tYear.position.set(FX, 5.75, -1.2); qs.add(tYear);
const tWorld = tag('世界のチャートで 日本語初の1位', { size: 50, w: 800, bg: SONG_GREEN, sx: 3.3 }); tWorld.position.set(FX, 5.75, -1.2); qs.add(tWorld);

// ---------- 6段目. 本から音符が飛び出す（x=210）。小説を音楽にする2人組 ----------
const NX = 210;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ color: '#140e24' })); bg.position.set(NX, 3.5, -3.6); qs.add(bg); const tb = box(3, 0.1, 1.6, mat('#5a4636')); tb.position.set(NX, 0.9, -1.4); qs.add(tb); const lg = box(0.1, 0.9, 0.1, mat('#3a2a20')); lg.position.set(NX, 0.45, -1.4); qs.add(lg); }
const BOOK = new THREE.Group(); BOOK.position.set(NX, 0.98, -1.4); qs.add(BOOK);
for (const s of [-1, 1]) { const pg = new THREE.Group(); const p = box(0.7, 0.04, 0.95, mat('#f8f4ea')); p.position.x = s * 0.36; pg.add(p); for (let i = 0; i < 6; i++) { const ln = box(0.5, 0.005, 0.02, mat('#8a8a90')); ln.position.set(s * 0.36, 0.025, -0.32 + i * 0.12); pg.add(ln); } pg.rotation.z = -s * 0.12; BOOK.add(pg); }
{ const cv = box(1.5, 0.03, 1.0, mat('#9a5ad8')); cv.position.y = -0.03; BOOK.add(cv); }
const NOTES = []; for (let i = 0; i < 12; i++) { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: ['#ff8ac0', '#8ac8ff', '#ffe06a'][i % 3] })); h.scale.set(1.3, 1, 1); g.add(h); const st = box(0.02, 0.28, 0.02, new THREE.MeshBasicMaterial({ color: ['#ff8ac0', '#8ac8ff', '#ffe06a'][i % 3] })); st.position.set(0.09, 0.14, 0); g.add(st); g.userData.o = i / 12; qs.add(g); NOTES.push(g); }
const tDuo = tag('小説を音楽にする2人組', { size: 58, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.75 }); tDuo.position.set(NX, 3.05, -0.8); qs.add(tDuo);
const tKata = tag('タイトルはカタカナ4文字', { size: 56, w: 700, bg: SONG_GREEN, sx: 1.8 }); tKata.position.set(NX, 2.55, -0.8); qs.add(tKata);

// ---------- shots ----------
const ALL = [tCenter, tCheer, tGroup, tFace, tPen, tBlank, tLine, tReal, tYear, tWorld, tDuo, tKata];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPOT1.intensity = 0; MICS.forEach(m => m.visible = false); MASK.visible = false; GLOWH.visible = false; NOTES.forEach(n => n.visible = false); QS.forEach(q => q.visible = false); (qs.userData.flash || []).forEach(f => f.material.opacity = 0); }

function shotStage(t) { // 1段目 0〜9：スポットライトの真ん中で、ひとりの少女が手をふる。会場が、割れるような歓声に包まれる（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.45; S.key.intensity = 0.3; S.darken(0.5, '#05040a'); SPOT1.intensity = 90;
  idol1.userData.arms[1].rotation.x = -2.8; idol1.userData.arms[1].rotation.z = 0.3 * Math.sin(t * 6); idol1.userData.head.rotation.z = Math.sin(t * 3) * 0.06;
  SIDE.forEach((p, i) => { p.userData.arms[i].rotation.x = -2.4 + Math.sin(t * 5 + i) * 0.3; });
  BEAMS.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.9 + i * 1.3) * 0.45; });
  PEN.forEach(p => { const k = t * 5 + p.userData.o; p.position.set(p.userData.x + Math.sin(k) * 0.08, 1.4 + Math.abs(Math.sin(k)) * 0.25, p.userData.z); p.rotation.z = Math.sin(k) * 0.4; });
  tCenter.userData.pop(1); if (t > 4.6) tCenter.visible = false;
  tCheer.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.3, 0, u), lerp(2.0, 2.3, u), lerp(7.6, 6.4, u), 0, 2.0, -2.6, 56);
  return qs;
}
function shotPress(t) { // 2段目 9〜17：みんなが夢中になる、グループのセンター。でも、その素顔を知る人はいない
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 0.9; S.darken(0.2, '#140e24');
  (qs.userData.flash || []).forEach((f, i) => { const k = (t * 1.3 + i * 0.37) % 1; f.material.opacity = k < 0.08 ? 0.9 : 0; });
  MICS.forEach((m, i) => { m.visible = true; m.position.set(KX + Math.sin(m.userData.a) * 1.3, 1.65 + Math.cos(i * 2) * 0.12, -1.6 + Math.cos(m.userData.a) * 1.0); m.lookAt(KX, 1.75, -1.6); m.rotateY(Math.PI); m.position.add(new THREE.Vector3(0, 0, 0)); });
  idol2.userData.head.rotation.y = Math.sin(t * 1.6) * 0.35; idol2.userData.arms[0].rotation.x = t > 4.2 ? -1.6 : 0; idol2.userData.arms[0].rotation.z = t > 4.2 ? -0.6 : 0;
  QS.forEach((q, i) => { q.visible = t > 4.4; q.position.set(KX - 1.2 + i * 0.8, 2.3 + ((t * 0.4 + i * 0.25) % 1) * 0.6, -1.2); });
  tGroup.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tGroup.visible = false;
  tFace.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.4, 0, u), lerp(1.9, 1.8, u), lerp(3.4, 2.8, u), KX, 1.6, -1.6, 56);
  return qs;
}
function shotRoom(t) { // 3段目 17〜25：まぶしいライトと、何万本ものペンライト（ステージの上から客席を見る）。楽屋に戻ると、表情がふっと消える
  if (t < 4.1) { shotStage(t + 6); tCheer.visible = false; tCenter.visible = false; tPen.position.set(-0.6, 3.1, 1.0); tPen.userData.pop((t - 0.6) / 0.35); look(-2.2, 1.4, 6.4, 0.4, 1.9, -2, 50); return qs; }
  tPen.position.set(CX, 2.95, -1.6);
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 1.0;
  idol3.userData.head.rotation.x = t > 4.2 ? 0.25 * ease((t - 4.2) / 0.8) : 0;
  idol3.userData.arms.forEach(a => a.rotation.x = t > 4.2 ? -0.5 : -1.0);
  tBlank.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(3.4, 3.1, u), lerp(2.2, 2.1, u), lerp(2.6, 2.2, u), CX - 0.1, 1.4, -2.2, 56);
  return qs;
}
function shotMask(t) { // 4段目 25〜33：ファンに届けるセリフは、わざと作ったもの。いつか、そのセリフに心が追いつけばいい
  base(); S.aim(BX, -1); lift(-40); S.hemi.intensity = 0.8; S.darken(0.3, '#0a0614');
  const down = ease(clamp((t - 4.2) / 0.8));
  idol4.userData.arms[1].rotation.x = lerp(-1.75, -0.6, down);
  const hand = new THREE.Vector3(); idol4.userData.arms[1].children[1].getWorldPosition(hand); idol4.updateMatrixWorld();
  MASK.visible = true; MASK.position.set(BX + 0.3 + down * 0.25, lerp(1.95, 1.1, down), -1.25); MASK.rotation.set(0, 0, down * 0.6);
  GLOWH.visible = t > 4.6; const k = ease(clamp((t - 4.6) / 1.0)); GLOWH.scale.setScalar(Math.max(0.01, k * (0.9 + Math.sin(t * 4) * 0.08))); GLOWH.material.opacity = 0.4 + 0.5 * k; GLOWH.position.set(BX - 0.05, 1.3, -1.2);
  tLine.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tLine.visible = false;
  tReal.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.3, 0, u), lerp(1.8, 1.7, u), lerp(3.0, 2.6, u), BX, 1.6, -1.6, 56);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2023年に配信された、アニメの主題歌。世界のチャートで、日本語の歌として初めての1位
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1;
  DISC.rotation.z = -t * 2.2; BARS.userData.update(t); GLOBE.rotation.y = t * 0.6;
  tYear.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tYear.visible = false;
  tWorld.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(FX, 3.4, lerp(7.8, 7.2, u), FX, 3.6, -1.5, 56);
  return qs;
}
function shotBook(t, quiz = 0) { // 6段目 42〜49（決め手）：歌うのは、小説を音楽にする2人組。タイトルは、カタカナ4文字
  base(); S.aim(NX, -1); lift(-30); S.hemi.intensity = 1.0;
  NOTES.forEach(n => { n.visible = true; const k = (t * 0.3 + n.userData.o) % 1; n.position.set(NX + Math.sin(k * 7 + n.userData.o * 11) * (0.3 + k * 1.2), 1.1 + k * 2.4, -1.4 + Math.cos(k * 5 + n.userData.o * 7) * 0.4); n.scale.setScalar(Math.max(0.01, Math.sin(k * Math.PI) * 1.3)); });
  BOOK.children.slice(0, 2).forEach((pg, i) => pg.rotation.z = -(i ? 1 : -1) * (0.12 + Math.sin(t * 2) * 0.04));
  if (!quiz) { tDuo.userData.pop((t - 0.4) / 0.35); tKata.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX, lerp(2.3, 2.2, u), lerp(3.6, 3.2, u), NX, 1.7, -1.4, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？
  shotBook(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.0, 0.25, d);
  S.spot.color.set(0xf0d8ff); S.spot.position.set(NX, 6, 1); S.spot.target.position.set(NX, 1, -1.4); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(1.2, 0.8, k), lerp(2.0, 1.9, k), lerp(3.2, 2.8, k), NX, 1.6, -1.4, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotStage },
  { a: 9, b: 17, f: shotPress },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotMask },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: (t) => shotBook(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'スポットライトの真ん中で、<br>ひとりの少女が手をふる。'],
  [5.6, 9.0, '会場が、割れるような<br>歓声に包まれる。'],
  [9.2, 13.2, 'みんなが夢中になる、<br>グループのセンター。'],
  [13.2, 17.0, 'でも、その素顔を<br>知る人はいない。'],
  [17.2, 21.0, 'まぶしいライトと、<br>何万本ものペンライト。'],
  [21.0, 25.0, '楽屋に戻ると、<br>表情がふっと消える。'],
  [25.2, 29.0, 'ファンに届けるセリフは、<br>わざと作ったもの。'],
  [29.0, 33.0, 'いつか、そのセリフに<br>心が追いつけばいい。'],
  [33.2, 37.4, '2023年に配信された、<br>アニメの主題歌。'],
  [37.4, 41.8, '世界のチャートで、日本語の<br>歌として初めての1位。'],
  [42.2, 45.4, '歌うのは、小説を<br>音楽にする2人組。'],
  [45.4, 49.0, 'タイトルは、<br>カタカナ4文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、YOASOBIの、アイドル。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q041', v2: true, answer: 'アイドル', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 4141,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'YOASOBI': 'ヨアソビ', '真ん中': 'まんなか', '少女': 'しょうじょ', '歓声': 'かんせい', '夢中': 'むちゅう', '素顔': 'すがお', '何万本': 'なんまんぼん', '楽屋': 'がくや', '表情': 'ひょうじょう', '2023年': 'にせんにじゅうさんねん', '主題歌': 'しゅだいか', '日本語': 'にほんご', '1位': 'いちい', '2人組': 'ふたりぐみ', 'カタカナ4文字': 'カタカナよんもじ', '何秒': 'なんびょう' },
    caption: 'この曲のタイトル、わかる？\nスポットライトの真ん中で、ひとりの少女が手をふる。会場が、割れるような歓声に包まれる。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', 'アニソン'],
  },
});
applyQuizCards({ answer: 'アイドル', info: 'YOASOBI｜2023年', answerSize: 140, kind: '曲' });
