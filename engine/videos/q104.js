import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #104 ホーム・アローン（映画・アメリカ・1990年製作・日本公開1991年6月22日・102分。Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/home-alone（Disney Plus）と Filmarks の動画配信欄（ディズニープラス 見放題）で2026/11/18確認。
//   Filmarks 3.9・レビュー320,458件 filmarks.com/movies/14752）
// 確かめた事実（映画.com eiga.com/movie/49303/、Filmarks の作品紹介、ムービーウォーカー press.moviewalker.jp/news/article/1170199/。2026/11/18）：
//   ・イタズラが大好きな8歳の少年ケヴィン。家族と親戚がそろってクリスマスにヨーロッパ（パリ）へ旅行。家には総勢15人（映画.com・Filmarks）
//   ・出発の朝、屋根裏部屋で寝ていたケヴィンはただひとり置き去りに。誰もいない家で好き放題に過ごす（映画.com）
//   ・そこへ、クリスマスの旅行で留守になった家を狙う泥棒2人組が現れる。家を守るため、あの手この手を駆使する（映画.com）。あの手この手の仕掛け（ムービーウォーカー）
//   ・1990年製作のアメリカ映画。クリスマス映画の定番になった（映画.com）
// 構成（ヒント6段）：1 朝起きると家に誰もいない・家族がひとり残らずいない → 2 主人公は8歳のイタズラ好き・家族15人は旅行に出たあと
//   → 3 大きな家をひとりじめ・好き放題に過ごす → 4 留守の家を狙う泥棒の2人組 → 5 1990年のアメリカ映画・クリスマス映画の定番
//   → 6 決め手：家じゅうにイタズラの仕掛け・8歳がひとりで家を守る
// 泥棒との対決の中身・結末・家族との再会は言わない。人物名・地名・タイトルの文字は出さない。俳優の顔・ポスター・ロゴ・
// 劇中の有名な場面の構図（両手でほおを押さえる顔・階段のペンキ缶など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#1a2030', floor: '#2a3040', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(10410);

const KID = { skin: '#f4d3b5', hair: '#d8b070', shirt: '#c8202c', pants: '#2a3a6a', scale: 0.66 };
const THIEF = [{ skin: '#e8b98f', hair: '#1a1410', shirt: '#3a3e48', pants: '#1e2028', scale: 1.1 }, { skin: '#f1c9a5', hair: '#2c2421', shirt: '#5a4a3a', pants: '#2a2a30', scale: 0.92 }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function lights(X, y, z, n, w) { const L = []; for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), gl(['#ff4a3a', '#4aff6a', '#ffd84a', '#4ab8ff'][i % 4])); b.position.set(X - w / 2 + i * w / (n - 1), y, z); qs.add(b); L.push(b); } return L; }
function tree(x, z, s = 1) { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 - i * 0.22, 1.0, 12), mat('#2a6a3a')); c.position.y = 0.8 + i * 0.6; g.add(c); }
  const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), gl('#ffd84a')); st.position.y = 2.4; g.add(st);
  for (let i = 0; i < 10; i++) { const a = i * 2.3, y = 0.5 + (i % 5) * 0.35; const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), gl(['#ff3a3a', '#ffd84a', '#4ab8ff'][i % 3])); b.position.set(Math.cos(a) * (0.75 - y * 0.25), y, Math.sin(a) * (0.75 - y * 0.25)); g.add(b); }
  g.position.set(x, 0, z); g.scale.setScalar(s); qs.add(g); return g; }

// ---------- 1段目. 屋根裏部屋（x=0）。小さなベッドで男の子が起き上がる ----------
{ const fl = box(8, 0.04, 8, mat('#8a6a4a')); fl.position.set(0, 0.02, -2); qs.add(fl);
  for (const s of [-1, 1]) { const r = box(5, 0.1, 8, mat('#a88a68')); r.position.set(s * 1.9, 2.6, -2); r.rotation.z = -s * 0.75; qs.add(r); }
  const bw = box(8, 4, 0.2, mat('#c8b090')); bw.position.set(0, 2, -5.2); qs.add(bw);
  const win = box(1.0, 1.0, 0.06, gl('#ffe8b0')); win.position.set(0, 2.9, -5.08); qs.add(win);
  const bed = box(1.2, 0.4, 2.0, mat('#6a4a3a')); bed.position.set(-0.4, 0.2, -2.6); qs.add(bed);
  const mt = box(1.1, 0.14, 1.9, mat('#e8e0d0')); mt.position.set(-0.4, 0.47, -2.6); qs.add(mt);
  const bl = box(1.14, 0.08, 1.2, mat('#2a6ab0')); bl.position.set(-0.4, 0.56, -2.2); qs.add(bl);
  for (let i = 0; i < 4; i++) { const b = box(0.4, 0.3, 0.4, mat(['#c8a070', '#a87a50'][i % 2])); b.position.set(1.6 + (i % 2) * 0.45, 0.15 + Math.floor(i / 2) * 0.3, -4.2); qs.add(b); } }
const kid1 = makePerson(KID); qs.add(kid1);
const SUN1 = new THREE.SpotLight(0xffe8b0, 0, 10, 0.5, 0.5, 1); SUN1.position.set(0, 3, -5); SUN1.target.position.set(-0.4, 0.5, -2.4); qs.add(SUN1); qs.add(SUN1.target);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tWake = tag('朝、目が覚めると…', { size: 58, w: 600, bg: '#14161c', sx: 1.5 }); tWake.position.set(-0.25, 2.3, -3.2); qs.add(tWake);
const tGone = tag('家族が、ひとり残らずいない', { size: 52, w: 780, bg: '#c8202c', sx: 1.8 }); tGone.position.set(-0.25, 2.3, -3.2); qs.add(tGone);

// ---------- 2段目. 家の前（x=50）。空を飛行機がよこぎる。玄関に男の子ひとり ----------
const AX = 50;
{ const gr = box(30, 0.04, 24, mat('#dfe6ee')); gr.position.set(AX, 0.02, -6); qs.add(gr);
  const hs = box(7, 4, 4, mat('#a8463a')); hs.position.set(AX, 2, -7); qs.add(hs);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), mat('#3a2a2a')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.62); rf.position.set(AX, 5.1, -7); qs.add(rf);
  const dr = box(1.1, 2.0, 0.1, mat('#2a4a2a')); dr.position.set(AX, 1.0, -4.95); qs.add(dr);
  for (const s of [-1, 1]) for (const y of [1.4, 3.0]) { const w = box(1.0, 0.9, 0.06, gl('#ffe0a0')); w.position.set(AX + s * 2.3, y, -4.97); qs.add(w); }
  const wr = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 8, 16), mat('#2a6a3a')); wr.position.set(AX, 1.6, -4.85); qs.add(wr);
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.6, 10), mat('#2a5a3a')); t.position.set(AX - 9 + i * 3.6 + (i > 2 ? 3 : 0), 1.3, -10); qs.add(t); } }
const L2 = lights(AX, 4.05, -4.9, 14, 6.6);
const PLANE2 = new THREE.Group();
{ const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 12), mat('#e8ecf2')); b.rotation.z = Math.PI / 2; PLANE2.add(b);
  const w = box(0.5, 0.05, 2.6, mat('#c8ccd4')); PLANE2.add(w); const t = box(0.3, 0.6, 0.05, mat('#c8ccd4')); t.position.set(-1.1, 0.3, 0); PLANE2.add(t); }
PLANE2.position.set(AX, 9, -14); qs.add(PLANE2);
const kid2 = makePerson(KID); kid2.position.set(AX, 0, -4.3); qs.add(kid2);
const t8 = tag('主人公は、8歳のイタズラ好き', { size: 52, w: 800, bg: '#14161c', sx: 4.4 }); t8.position.set(AX, 4.2, -4.2); qs.add(t8);
const t15 = tag('家族15人は、旅行へ出発', { size: 54, w: 700, bg: '#2a6ab0', sx: 4.0 }); t15.position.set(AX, 4.2, -4.2); qs.add(t15);

// ---------- 3段目. 居間（x=100）。ツリー・ソファ・テレビ。男の子がソファで跳ねる。お菓子の山 ----------
const BX = 100;
{ const fl = box(12, 0.04, 10, mat('#8a5a3a')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.5, 0.2, mat('#d8c8a0')); wl.position.set(BX, 2.25, -6); qs.add(wl);
  const fp = box(1.8, 1.4, 0.5, mat('#8a4a3a')); fp.position.set(BX - 2.6, 0.7, -5.7); qs.add(fp);
  const fi = box(0.9, 0.6, 0.1, gl('#ff9a3a')); fi.position.set(BX - 2.6, 0.5, -5.42); qs.add(fi);
  const sofa = box(2.6, 0.5, 1.0, mat('#7a2a2a')); sofa.position.set(BX + 0.4, 0.35, -2.6); qs.add(sofa);
  const sb = box(2.6, 0.7, 0.3, mat('#7a2a2a')); sb.position.set(BX + 0.4, 0.75, -3.05); qs.add(sb);
  const tb = box(1.2, 0.4, 0.7, mat('#5a3a2a')); tb.position.set(BX + 0.4, 0.2, -1.2); qs.add(tb);
  for (let i = 0; i < 12; i++) { const c = box(0.16, 0.1, 0.12, mat(['#ff4a6a', '#ffd84a', '#4ab8ff', '#8a4a2a'][i % 4])); c.position.set(BX + 0.1 + (i % 4) * 0.2, 0.45 + Math.floor(i / 4) * 0.1, -1.2 + ((i * 7) % 3 - 1) * 0.15); qs.add(c); } }
tree(BX + 3.2, -4.6, 1.1);
const kid3 = makePerson(KID); kid3.position.set(BX, 0, -2.6); qs.add(kid3);
const tOwn = tag('大きな家を、ひとりじめ', { size: 54, w: 680, bg: '#14161c', sx: 3.0 }); tOwn.position.set(BX + 0.2, 3.4, -3.6); qs.add(tOwn);
const tFree = tag('好き放題に、過ごす', { size: 58, w: 580, bg: '#c8202c', sx: 2.6 }); tFree.position.set(BX + 0.2, 3.4, -3.6); qs.add(tFree);

// ---------- 4段目. 夜の家の前（x=150）。懐中電灯の2人組が忍び寄る ----------
const CX = 150;
{ const gr = box(30, 0.04, 24, mat('#c8d0e0')); gr.position.set(CX, 0.02, -6); qs.add(gr);
  const hs = box(7, 4, 4, mat('#6a2e28')); hs.position.set(CX, 2, -8); qs.add(hs);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), mat('#2a1e1e')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.62); rf.position.set(CX, 5.1, -8); qs.add(rf);
  for (const s of [-1, 1]) for (const y of [1.4, 3.0]) { const w = box(1.0, 0.9, 0.06, gl('#2a3048')); w.position.set(CX + s * 2.3, y, -5.97); qs.add(w); }
  const dr = box(1.1, 2.0, 0.1, mat('#2a3a2a')); dr.position.set(CX, 1.0, -5.95); qs.add(dr);
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.6, 10), mat('#1e3a2a')); t.position.set(CX - 8 + i * 4, 1.3, -11); qs.add(t); } }
const MOON4 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), gl('#f0ecd0')); MOON4.position.set(CX + 4, 8, -16); qs.add(MOON4);
const TH4 = THIEF.map(c => { const p = makePerson(c); p.position.set(CX, 0, 0); qs.add(p); return p; });
const BEAM4 = TH4.map(() => { const b = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 16, 1, true), gl('#fff4c0', 0.22)); b.rotation.x = -Math.PI / 2; b.position.set(CX, 1, 0); qs.add(b); return b; });
const tAim = tag('留守の家を、ねらう', { size: 58, w: 580, bg: '#14161c', sx: 3.8 }); tAim.position.set(CX, 4.5, -5.6); qs.add(tAim);
const tTwo = tag('泥棒の、2人組', { size: 62, w: 480, bg: '#c8202c', sx: 3.2 }); tTwo.position.set(CX, 4.5, -5.6); qs.add(tTwo);

// ---------- 5段目. 映画館（x=200）。赤と緑の光。1990年・アメリカ映画 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1a3a'); gr.addColorStop(1, '#1a2a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc((i * 131) % w, (i * 71) % h, 2 + (i % 3), 0, 7); g.fill(); }
  g.fillStyle = '#e8eef4'; g.fillRect(0, h - 50, w, 50); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const L5 = lights(TX, 5.6, -4.8, 18, 7.4);
const T5 = [tree(TX - 4.6, -3.8, 0.9), tree(TX + 4.6, -3.8, 0.9)];
const t1990 = tag('1990年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 4.8 }); t1990.position.set(TX, 6.4, -4.4); qs.add(t1990);
const tXmas = tag('クリスマス映画の、定番', { size: 54, w: 700, bg: '#2a8a4a', sx: 4.8 }); tXmas.position.set(TX, 6.4, -4.4); qs.add(tXmas);

// ---------- 6段目. 夜の玄関ホール（x=250）。床にビー玉とおもちゃの車、扉の上にバケツ。階段の上に男の子 ----------
const DX = 250;
{ const fl = box(12, 0.04, 10, mat('#7a5a40')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#c8b890')); wl.position.set(DX, 2.5, -6); qs.add(wl);
  for (let i = 0; i < 10; i++) { const st = box(1.6, 0.25, 0.4, mat('#8a5a3a')); st.position.set(DX + 2.6, 0.125 + i * 0.25, -1.4 - i * 0.4); st.scale.y = 1; qs.add(st);
    const sp = box(1.6, 0.25 * (i + 1), 0.4, mat('#6a4a30')); sp.position.set(DX + 2.6, 0.125 * (i + 1), -1.4 - i * 0.4); qs.add(sp); }
  const land = box(2.4, 0.2, 2.0, mat('#8a5a3a')); land.position.set(DX + 2.6, 2.5, -6.0); qs.add(land);
  const rail = box(0.06, 0.06, 4.4, mat('#4a2a1a')); rail.position.set(DX + 1.8, 2.0, -3.2); rail.rotation.x = 0.55; qs.add(rail);
  const dr = box(1.2, 2.3, 0.1, mat('#5a3a2a')); dr.position.set(DX - 2.6, 1.15, -5.9); qs.add(dr);
  const dfr = box(1.4, 0.1, 0.3, mat('#4a2a1a')); dfr.position.set(DX - 2.6, 2.35, -5.8); qs.add(dfr); }
const MAR6 = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: ['#4ab8ff', '#ff5a5a', '#5aff8a', '#ffd84a'][i % 4], roughness: 0.1, metalness: 0.2 })); m.position.set(DX - 2.6 + (R() - 0.5) * 2.4, 0.07, -4.6 + R() * 2.6); qs.add(m); MAR6.push(m); }
for (let i = 0; i < 3; i++) { const c = box(0.36, 0.14, 0.2, mat(['#c8202c', '#2a6ab0', '#e6b450'][i])); c.position.set(DX - 1.4 + i * 0.5, 0.09, -2.2 - i * 0.4); c.rotation.y = i * 0.7; qs.add(c); }
const BUCKET6 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.36, 14), mat('#8a9aa8')); BUCKET6.position.set(DX - 2.6, 2.6, -5.7); qs.add(BUCKET6);
const ROPE6 = box(0.02, 0.02, 3.6, mat('#e8dcc0')); ROPE6.position.set(DX - 0.6, 0.25, -4.4); ROPE6.rotation.y = 1.2; qs.add(ROPE6);
const kid6 = makePerson(KID); kid6.position.set(DX + 2.6, 2.6, -5.8); qs.add(kid6);
const tTrap = tag('家じゅうに、イタズラの仕掛け', { size: 52, w: 800, bg: '#c8202c', sx: 3.4 }); tTrap.position.set(DX, 4.0, -4.0); qs.add(tTrap);
const tGuard = tag('8歳が、ひとりで家を守る', { size: 54, w: 720, bg: '#2a6ab0', sx: 3.1 }); tGuard.position.set(DX, 4.0, -4.0); qs.add(tGuard);

// ---------- shots ----------
const ALL = [tWake, tGone, t8, t15, tOwn, tFree, tAim, tTwo, t1990, tXmas, tTrap, tGuard, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SUN1.intensity = 0; }
function blink(L, t) { L.forEach((b, i) => b.visible = Math.floor(t * 3 + i) % 3 !== 0); }

function shotAttic(t, quiz = 0) { // 1段目 0〜9：朝、目が覚めると、家族がひとり残らずいない（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 0.8; SUN1.intensity = 20;
  const k = quiz ? 1 : ease(clamp((t - 0.8) / 1.2));
  kid1.position.set(-0.4, 0.55, -2.9 + k * 0.1); kid1.rotation.set(-(1 - k) * 1.45, 0, 0);
  kid1.userData.legs.forEach(l => l.rotation.x = -1.5 * k);
  kid1.userData.head.rotation.y = quiz ? 0.3 : (t > 3 ? Math.sin((t - 3) * 2) * 0.6 : 0);
  kid1.userData.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * k * 0.4);
  Q1.position.set(0.35, 1.55, -2.6); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { tWake.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tWake.visible = false; tGone.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.8, 0.6, u), lerp(1.9, 1.8, u), lerp(0.4, 0.0, u), -0.3, 1.1, -2.8, 64);
  return qs;
}
function shotHouse(t) { // 2段目 9〜17：主人公は、8歳のイタズラ好き。家族15人は、旅行に出たあと
  base(); S.aim(AX, -5); lift(0); S.hemi.intensity = 1.2; blink(L2, t);
  PLANE2.position.set(AX - 8 + t * 2.2, 8.5 + t * 0.25, -14); PLANE2.rotation.z = 0.1;
  kid2.rotation.y = 0; kid2.userData.head.rotation.x = -0.5; kid2.userData.arms[1].rotation.x = t > 4.5 ? -2.6 + Math.sin(t * 8) * 0.3 : 0;
  t8.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t8.visible = false; t15.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-1.2, -0.6, u), lerp(1.8, 2.2, u), lerp(3.4, 2.6, u), AX, 3.2, -6, 66);
  return qs;
}
function shotLiving(t) { // 3段目 17〜25：大きな家を、ひとりじめ。好き放題に過ごす
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.0;
  const j = Math.abs(Math.sin(t * 4.2));
  kid3.position.set(BX + 0.4 + Math.sin(t * 0.8) * 0.6, 0.6 + j * 0.6, -2.6); kid3.rotation.y = Math.sin(t * 0.8) * 0.3;
  kid3.userData.arms.forEach((a, i) => { a.rotation.x = -2.6 * j; a.rotation.z = (i ? 1 : -1) * 0.3; }); kid3.userData.legs.forEach((l, i) => l.rotation.x = (i ? 1 : -1) * j * 0.3);
  tOwn.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOwn.visible = false; tFree.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.8, 0.2, u), lerp(2.2, 2.0, u), lerp(3.6, 3.0, u), BX + 0.4, 1.6, -3.0, 62);
  return qs;
}
function shotThieves(t) { // 4段目 25〜33：そこへ、留守の家をねらう泥棒の2人組が現れる
  base(); S.aim(CX, -6); lift(0); S.hemi.intensity = 0.35; S.darken(0.75, '#04060e');
  TH4.forEach((p, i) => { const z = lerp(1.0, -3.4, clamp(t / 7.5)); p.position.set(CX - 0.7 + i * 1.3, 0, z + i * 0.3); p.rotation.y = Math.PI; poseWalk(p, t * 4 + i * 2, 0.45);
    p.userData.arms[1].rotation.x = -1.3; p.userData.head.rotation.y = Math.sin(t * 1.4 + i * 2) * 0.5;
    const b = BEAM4[i]; b.position.set(p.position.x + 0.3, 1.2, p.position.z - 1.6); b.rotation.set(-Math.PI / 2 + 0.15, 0, Math.sin(t * 1.4 + i * 2) * 0.3); });
  tAim.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAim.visible = false; tTwo.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.2, 0.8, u), lerp(2.0, 2.4, u), lerp(5.4, 4.2, u), CX, 2.0, -4.5, 64);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1990年の、アメリカ映画。クリスマス映画の定番
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a'); blink(L5, t);
  t1990.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1990.visible = false; tXmas.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.8, 6.0, u), TX, 4.0, -4.8, 68);
  return qs;
}
function shotTraps(t) { // 6段目 42〜49（決め手）：家じゅうに、イタズラの仕掛け。8歳が、ひとりで家を守る
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.7; S.darken(0.4, '#06060e');
  MAR6.forEach((m, i) => m.position.x += Math.sin(t * 3 + i) * 0.0015);
  BUCKET6.rotation.z = Math.sin(t * 2.4) * 0.06;
  kid6.rotation.y = Math.PI * 0.75; kid6.userData.arms.forEach(a => a.rotation.x = -0.5 - Math.sin(t * 3) * 0.1);
  if (t < 3.6) tTrap.userData.pop((t - 0.3) / 0.35); else tGuard.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-1.6, -1.0, u), lerp(2.4, 2.6, u), lerp(3.6, 3.0, u), DX + 0.2, 1.4, -4.4, 66);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（屋根裏部屋に戻る）
  shotAttic(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotAttic(t, 0) },
  { a: 9, b: 17, f: shotHouse },
  { a: 17, b: 25, f: shotLiving },
  { a: 25, b: 33, f: shotThieves },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotTraps },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '朝、目が覚めると、<br>家がやけに静か。'],
  [5.6, 9.0, '家族が、<br>ひとり残らずいない。'],
  [9.2, 13.2, '主人公は、<br>8歳のイタズラ好き。'],
  [13.2, 17.0, '家族15人は、<br>もう旅行に出たあと。'],
  [17.2, 21.0, '大きな家を、<br>ひとりじめ。'],
  [21.0, 25.0, '誰もいない家で、<br>好き放題に過ごす。'],
  [25.2, 29.0, 'そこへ、<br>留守の家をねらう…'],
  [29.0, 33.0, '泥棒の、<br>2人組が現れる。'],
  [33.2, 37.4, '1990年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'クリスマス映画の、<br>定番中の定番。'],
  [42.2, 45.4, '家じゅうに、<br>イタズラの仕掛け。'],
  [45.4, 49.0, '8歳が、<br>ひとりで家を守る。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ホーム・アローン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q104', v2: true, answer: 'ホーム・アローン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'light', seed: 10410,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '朝': 'あさ', '目が覚める': 'めがさめる', '家': 'いえ', '静か': 'しずか', '家族': 'かぞく', '主人公': 'しゅじんこう', '8歳': 'はっさい', '好き': 'ずき', '15人': 'じゅうごにん', '旅行': 'りょこう', '出た': 'でた', '大きな': 'おおきな', '誰も': 'だれも', '好き放題': 'すきほうだい', '過ごす': 'すごす', '留守': 'るす', '泥棒': 'どろぼう', '2人組': 'ふたりぐみ', '現れる': 'あらわれる', '1990年': 'せんきゅうひゃくきゅうじゅうねん', '映画': 'えいが', '定番中の定番': 'ていばんちゅうのていばん', '家じゅう': 'いえじゅう', '仕掛け': 'しかけ', '守る': 'まもる', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n朝、目が覚めると、家がやけに静か。家族が、ひとり残らずいない。主人公は、8歳のイタズラ好き。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', '映画好き', '洋画', 'クリスマス映画'],
  },
});
applyQuizCards({ answer: 'ホーム・アローン', info: 'Disney+｜映画・102分', answerSize: 112 });
