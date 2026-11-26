import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, SONG_GREEN, makeDisc, makeBars } from './quiz-kit.js';

// タイトル当てクイズ #145 青と夏（曲・Mrs. GREEN APPLE・2018年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/26）：
//   ・日本レコード協会のストリーミング認定 ダイヤモンド（5億回以上。2024年7月度。riaj.or.jp/data/st/search/ の認定データ
//     f/data/api/StProducts.json で「青と夏」、トラック・Mrs. GREEN APPLE・配信開始日 2018-07-12・ユニバーサル ミュージック）
//   ・Billboard JAPAN billboard-japan.com/d_news/detail/90374/2 （2020/07/29）：「青と夏」は映画『青夏 きみに恋した30日』のために
//     書き下ろされた楽曲で、2018年7月12日より配信がスタートした（配信が CD より早いので 2018年）
// 物語：曲が描く状況（まぶしい季節がやってくる → 輪の外から見ているだけの若者 → 熱い風と遠くの笑い声
//   → 見ているだけをやめて自分から飛び出す → 色と季節の名前の曲）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が曲名と文法の切れ端だけなのを確かめた）。
//   映画のタイトル・あらすじは出さない。音源・ジャケット・MV の映像や設定・歌手の見た目は使わない。人は汎用の3D
// 構成（ヒント6段）：1 ある朝、窓の外がやけにまぶしい・セミが鳴きはじめた → 2 主人公はいつも見ているだけの高校生・輪にうまく入れない
//   → 3 放課後の校庭はじりじり暑い・笑い声が遠くに聞こえる → 4 見ているだけはもうやめる・自転車で坂道をかけおりる
//   → 5 2018年、恋の物語（映画）の主題歌として書かれた・ストリーミング5億回 → 6 決め手：タイトルは色と季節・ひらがな1文字でつなぐ
const S = quizStage({ bg: '#cfe6f4', floor: '#a8b8a0', fogNear: 30, fogFar: 120 });
const qs = S.scene;
const R = rng(14510);

const HERO = { skin: '#f1c9a5', hair: '#1e1a18', shirt: '#f4f4f0', pants: '#2a3248' };
const MATES = [
  { skin: '#f4d3b5', hair: '#2a2018', shirt: '#f4f4f0', pants: '#2a3248' },
  { skin: '#f1c9a5', hair: '#4a2a1a', shirt: '#f4f4f0', pants: '#3a3a5a', long: true, skirt: true },
  { skin: '#f4d3b5', hair: '#1a1410', shirt: '#f4f4f0', pants: '#2a3248' },
  { skin: '#f1c9a5', hair: '#3a2418', shirt: '#f4f4f0', pants: '#3a3a5a', long: true, skirt: true },
];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function room(x, wall = '#eae4d8', floor = '#b89a74') { const fl = box(10, 0.04, 8, mat(floor)); fl.position.set(x, 0.02, -3); qs.add(fl);
  const wl = box(10, 4, 0.3, mat(wall)); wl.position.set(x, 2, -6); qs.add(wl); const sw = box(0.3, 4, 8, mat(wall)); sw.position.set(x - 4, 2, -3); qs.add(sw); }
function desk(x, z, c = '#c8a070') { const g = new THREE.Group(); const tp = box(0.9, 0.05, 0.6, mat(c)); tp.position.y = 0.74; g.add(tp);
  for (const [dx, dz] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) { const l = box(0.05, 0.72, 0.05, mat('#7a7a80')); l.position.set(dx, 0.36, dz); g.add(l); }
  g.position.set(x, 0, z); qs.add(g); return g; }
function bike() { const g = new THREE.Group(); const fm = mat('#2e8ad0'), tm = mat('#1a1a1e');
  const wheels = []; for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 20), tm); w.position.set(s * 0.55, 0.38, 0); g.add(w); wheels.push(w); }
  const b1 = box(1.0, 0.06, 0.06, fm); b1.position.set(0, 0.62, 0); b1.rotation.z = -0.15; g.add(b1);
  const b2 = box(0.06, 0.5, 0.06, fm); b2.position.set(-0.15, 0.6, 0); g.add(b2);
  const st = box(0.24, 0.05, 0.12, tm); st.position.set(-0.17, 0.87, 0); g.add(st);
  const hb = box(0.06, 0.04, 0.5, tm); hb.position.set(0.5, 0.98, 0); g.add(hb); const hp = box(0.05, 0.45, 0.05, fm); hp.position.set(0.5, 0.76, 0); g.add(hp);
  g.userData.wheels = wheels; return g; }

// ---------- 1段目. 朝の部屋（x=0）。まぶしく光る窓と、机にほおづえをつく少年 ----------
room(0);
const WIN1 = box(3.0, 2.0, 0.05, gl('#f8fcff')); WIN1.position.set(0.4, 2.2, -5.82); qs.add(WIN1);
const GLOW1 = new THREE.PointLight('#fff4d0', 5, 10); GLOW1.position.set(0.4, 2.2, -4.6); qs.add(GLOW1);
{ const fr = box(3.2, 0.1, 0.12, mat('#d8d0c0')); fr.position.set(0.4, 1.15, -5.75); qs.add(fr); const fr2 = fr.clone(); fr2.position.y = 3.25; qs.add(fr2);
  const md = box(0.08, 2.0, 0.12, mat('#d8d0c0')); md.position.set(0.4, 2.2, -5.75); qs.add(md);
  const cu = box(0.5, 2.4, 0.06, mat('#8ab8d8')); cu.position.set(-1.4, 2.1, -5.7); qs.add(cu); const cu2 = cu.clone(); cu2.position.x = 2.2; qs.add(cu2);
  const bd = box(1.8, 0.4, 2.4, mat('#e0e4ec')); bd.position.set(-2.6, 0.2, -3.4); qs.add(bd); }
desk(0.4, -4.6);
const RAYS1 = []; for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 4.5), gl('#fff8d8', 0.18)); r.position.set(-0.4 + i * 0.4, 1.6, -4.4); r.rotation.set(-0.9, 0, 0.25); qs.add(r); RAYS1.push(r); }
const HERO1 = person(HERO, 0.4, -3.9, Math.PI); HERO1.userData.legs.forEach(l => l.rotation.x = -1.5); HERO1.position.y = -0.32;
const NOTES1 = []; for (let i = 0; i < 5; i++) { const n = tag('〜', { size: 80, w: 120, h: 110, bg: 'rgba(0,0,0,0)', color: '#5a6a5a', sx: 0.28 }); qs.add(n); NOTES1.push(n); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: SONG_GREEN, sx: 0.5 }); qs.add(Q1);
const tBright = tag('ある朝、窓の外がまぶしい', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tBright);
const tCicada = tag('セミが、鳴きはじめた', { size: 54, w: 640, bg: SONG_GREEN, sx: 1.6 }); qs.add(tCicada);

// ---------- 2段目. 昼休みの教室（x=50）。輪になって笑う生徒たちと、窓ぎわの席にひとりの少年 ----------
const AX = 50;
room(AX, '#eeeae0', '#c8a880');
{ const bb = box(5, 1.6, 0.05, mat('#2e4a3a')); bb.position.set(AX + 0.5, 2.0, -5.83); qs.add(bb);
  for (let i = 0; i < 3; i++) { const wn = box(1.6, 1.6, 0.05, gl('#dff2ff')); wn.position.set(AX - 3.83, 2.0, -4.6 + i * 2.0); wn.rotation.y = Math.PI / 2; qs.add(wn); } }
for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) desk(AX - 2.9 + c * 1.3, -4.6 + r * 1.3);
desk(AX - 1.6, -1.25);
const HERO2 = person(HERO, AX - 1.4, -1.8, 2.3); HERO2.userData.legs.forEach(l => l.rotation.x = -1.5); HERO2.position.y = -0.32;
const RING2 = MATES.map((o, i) => { const a = i / MATES.length * Math.PI * 2; return person(o, AX + 1.5 + Math.cos(a) * 0.75, -4.4 + Math.sin(a) * 0.75, -a - Math.PI / 2); });
const LAUGH2 = []; for (let i = 0; i < 4; i++) { const l = tag('♪', { size: 80, w: 110, h: 110, bg: 'rgba(0,0,0,0)', color: '#e6a030', sx: 0.26 }); qs.add(l); LAUGH2.push(l); }
const tWatch = tag('主人公は、見ているだけの高校生', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tWatch);
const tRing = tag('みんなの輪に、うまく入れない', { size: 48, w: 820, bg: SONG_GREEN, sx: 1.85 }); qs.add(tRing);

// ---------- 3段目. 放課後の校庭（x=100）。強い日ざし、ゆらめく空気、遠くで走る生徒たち ----------
const BX = 100;
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#5aa8e8', '#e8f4fa')); SKY3.position.set(BX, 12, -45); qs.add(SKY3);
{ const gd = box(40, 0.04, 30, mat('#d8c8a0')); gd.position.set(BX, 0.03, -10); qs.add(gd);
  const sc = box(22, 7, 5, mat('#f0eee6')); sc.position.set(BX + 2, 3.5, -28); qs.add(sc);
  for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) { const wn = box(1.4, 1.2, 0.05, gl('#a8c8e0')); wn.position.set(BX - 7 + i * 2.2, 2.4 + k * 2.4, -25.47); qs.add(wn); }
  for (let i = 0; i < 6; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), mat('#4a8a3a')); tr.position.set(BX - 14 + i * 1.6, 3.2, -20 + (i % 2)); qs.add(tr); const tk = box(0.25, 2.4, 0.25, mat('#6a4a3a')); tk.position.set(BX - 14 + i * 1.6, 1.2, -20 + (i % 2)); qs.add(tk); } }
const SUN3 = new THREE.Mesh(new THREE.CircleGeometry(2.2, 28), gl('#fffbe0')); SUN3.position.set(BX + 10, 18, -44); qs.add(SUN3);
const RUN3 = MATES.map((o, i) => person(o, BX - 4 + i * 2.2, -16 - (i % 2) * 1.5, Math.PI / 2));
const HERO3 = person(HERO, BX - 0.6, -3.2, Math.PI);
const HAZE3 = []; for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.25), gl('#ffffff', 0.12)); h.position.set(BX - 3 + i * 1.3, 0.6 + (i % 3) * 0.3, -9 - i); qs.add(h); HAZE3.push(h); }
const tWind = tag('放課後の校庭は、じりじり暑い', { size: 48, w: 820, bg: '#14161c', sx: 1.7 }); qs.add(tWind);
const tFar = tag('笑い声が、遠くに聞こえる', { size: 50, w: 740, bg: SONG_GREEN, sx: 1.8 }); qs.add(tFar);

// ---------- 4段目. 坂道（x=150）。自転車でかけおりる少年。ガードレールと、ひらけた景色 ----------
const CX = 150;
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#3a98e8', '#d8eef8')); SKY4.position.set(CX, 10, -45); qs.add(SKY4);
const SLOPE = new THREE.Group(); SLOPE.position.set(CX, 0, 0); SLOPE.rotation.z = 0.12; qs.add(SLOPE);
{ const rd = box(60, 0.1, 3.2, mat('#6a6a70')); rd.position.set(0, 0, -3); SLOPE.add(rd);
  const ln = box(60, 0.02, 0.1, mat('#f0f0e8')); ln.position.set(0, 0.06, -3); SLOPE.add(ln);
  const gr = box(60, 0.18, 0.06, mat('#e8e8e8')); gr.position.set(0, 0.7, -1.3); SLOPE.add(gr);
  for (let i = 0; i < 24; i++) { const p = box(0.08, 0.7, 0.08, mat('#c8c8c8')); p.position.set(-30 + i * 2.5, 0.35, -1.3); SLOPE.add(p); }
  const hill = box(60, 3, 6, mat('#6aa84a')); hill.position.set(0, 1.2, -8); SLOPE.add(hill);
  const town = box(80, 0.04, 40, mat('#9ab88a')); town.position.set(CX, -4, 10); qs.add(town); }
const BIKE4 = bike(); SLOPE.add(BIKE4);
const HERO4 = makePerson(HERO); BIKE4.add(HERO4); HERO4.position.set(-0.12, 0.05, 0); HERO4.rotation.y = Math.PI / 2;
HERO4.userData.legs.forEach(l => l.rotation.x = -1.0); HERO4.userData.arms.forEach(a => a.rotation.x = -1.2);
const SPEED4 = []; for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.03), gl('#ffffff', 0.7)); SLOPE.add(s); SPEED4.push(s); }
const tStop = tag('見ているだけは、もうやめる', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tStop);
const tDown = tag('自転車で、坂道をかけおりる', { size: 50, w: 760, bg: SONG_GREEN, sx: 1.8 }); qs.add(tDown);

// ---------- 5段目. 記録（x=200）。ジャケットのない無地のディスクと音のバー ----------
const FX = 200;
{ const fl = box(14, 0.04, 12, mat('#2a2e3a')); fl.position.set(FX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#1e222c')); wl.position.set(FX, 4, -5); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const t2018 = tag('2018年、恋の物語の主題歌', { size: 52, w: 740, bg: '#e6b450', color: '#14161c', sx: 1.8 }); qs.add(t2018);
const tPlay = tag('ストリーミング 5億回超え', { size: 54, w: 740, bg: SONG_GREEN, sx: 1.8 }); qs.add(tPlay);

// ---------- 6段目. 晴れわたる空と海（x=250）。大きな入道雲、砂浜へ走っていく少年と仲間 ----------
const NX = 250;
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(100, 50), skyTex('#1a78d8', '#bfe2f6')); SKY6.position.set(NX, 14, -50); qs.add(SKY6);
{ const sea = box(100, 0.06, 40, mat('#2a8ac8')); sea.position.set(NX, 0.01, -28); qs.add(sea);
  const sand = box(40, 0.08, 12, mat('#eedcb0')); sand.position.set(NX, 0.04, -2); qs.add(sand);
  const cl = [[0, 0, 4], [3, -0.5, 3.2], [-3, -0.6, 3.0], [1.5, 3, 3.0], [-1.2, 2.6, 2.6]];
  for (const [dx, dy, r] of cl) { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), gl('#ffffff')); c.position.set(NX + 6 + dx, 6 + dy, -46); qs.add(c); } }
const WAVES6 = []; for (let i = 0; i < 4; i++) { const w = box(30, 0.04, 0.25, gl('#e8f6ff')); w.position.set(NX, 0.06, -8.5 - i * 1.6); qs.add(w); WAVES6.push(w); }
const HERO6 = person(HERO, NX - 0.6, -3.0, Math.PI);
const FRIENDS6 = MATES.slice(0, 3).map((o, i) => person(o, NX + 0.6 + i * 0.8, -4.0 - i * 0.5, Math.PI));
const tColor = tag('タイトルは、色と季節', { size: 54, w: 640, bg: '#14161c', sx: 1.6 }); qs.add(tColor);
const tJoin = tag('ひらがな1文字で、つなぐ', { size: 52, w: 700, bg: SONG_GREEN, sx: 1.7 }); qs.add(tJoin);

// ---------- shots ----------
const ALL = [tBright, tCicada, tWatch, tRing, tWind, tFar, tStop, tDown, t2018, tPlay, tColor, tJoin, Q1, ...NOTES1, ...LAUGH2];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotMorning(t, quiz = 0) { // 1段目 0〜9：ある朝、窓の外がやけにまぶしい。セミが、鳴きはじめた（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.2; S.key.intensity = 1.4;
  GLOW1.intensity = 4 + Math.sin(t * 2) * 0.6; RAYS1.forEach((r, i) => r.material.opacity = 0.12 + Math.sin(t * 1.5 + i) * 0.05);
  HERO1.userData.head.rotation.x = -0.15; HERO1.userData.head.rotation.y = Math.sin(t * 0.6) * 0.15; HERO1.userData.arms[1].rotation.x = -2.2; HERO1.userData.arms[0].rotation.x = -1.0;
  NOTES1.forEach((n, i) => { const s = t - 5.6 - i * 0.3; n.position.set(-0.6 + i * 0.45, 2.7 + Math.sin(t * 3 + i) * 0.08, -5.0); n.userData.pop(quiz ? 0 : clamp(s / 0.3)); });
  Q1.position.set(1.4, 2.1, -4.0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tBright, 1.05); pin(tCicada, 1.05);
  if (!quiz) { tBright.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tBright.visible = false; tCicada.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-1.6, -1.2, u), lerp(2.0, 1.9, u), lerp(0.6, -0.2, u), 0.4, 1.7, -4.6, 62);
  return qs;
}
function shotClass(t) { // 2段目 9〜17：主人公は、いつも見ているだけの高校生。みんなの輪に、うまく入れない
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.2;
  RING2.forEach((p, i) => { p.userData.arms[i % 2].rotation.x = -0.6 + Math.sin(t * 4 + i) * 0.4; p.position.y = Math.abs(Math.sin(t * 3 + i)) * 0.04; p.userData.head.rotation.x = Math.sin(t * 5 + i) * 0.1; });
  HERO2.userData.head.rotation.y = 0.2; HERO2.userData.head.rotation.x = 0.1; HERO2.userData.arms.forEach(a => a.rotation.x = -1.0);
  LAUGH2.forEach((l, i) => { l.position.set(AX + 0.9 + i * 0.4, 2.2 + ((t * 0.5 + i * 0.3) % 0.8), -4.4); l.userData.pop(1); });
  const u = ease(t / 8);
  look(AX + lerp(-3.4, -3.1, u), lerp(2.3, 2.2, u), lerp(2.0, 1.6, u), AX + 0.4, 0.9, -3.4, 62);
  pin(tWatch, 1.05); pin(tRing, 1.05);
  tWatch.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWatch.visible = false; tRing.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotYard(t) { // 3段目 17〜25：放課後の校庭は、じりじり暑い。みんなの笑い声が、遠くに聞こえる
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.35; S.key.intensity = 1.8; S.key.color.set('#fff0c8');
  RUN3.forEach((p, i) => { p.position.x = BX - 6 + i * 2.2 + ((t * 1.6 + i) % 4); poseWalk(p, t * 9 + i, 1); });
  HERO3.userData.head.rotation.y = t > 4.3 ? 0.4 : 0; HERO3.userData.arms[0].rotation.x = -0.2;
  HAZE3.forEach((h, i) => { h.position.y = 0.6 + (i % 3) * 0.3 + Math.sin(t * 3 + i) * 0.08; });
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0.3, u), lerp(1.7, 1.75, u), lerp(-0.2, -0.8, u), BX - 0.8, 2.0, -12, 62);
  pin(tWind, 1.05); pin(tFar, 1.05);
  tWind.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWind.visible = false; tFar.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotSlope(t) { // 4段目 25〜33：見ているだけは、もうやめる。自転車で、坂道をかけおりる
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.35; S.key.intensity = 1.6;
  const x = -2 + t * 0.9; BIKE4.position.set(-x, 0.05, -3.0); BIKE4.rotation.y = Math.PI;
  BIKE4.userData.wheels.forEach(w => w.rotation.z = t * 9);
  HERO4.userData.legs[0].rotation.x = -1.0 + Math.sin(t * 6) * 0.4; HERO4.userData.legs[1].rotation.x = -1.0 - Math.sin(t * 6) * 0.4;
  SPEED4.forEach((s, i) => { s.position.set(-x + 1.4 + ((t * 4 + i * 0.7) % 3), 0.5 + (i % 4) * 0.25, -2.9 + (i % 2) * 0.3); });
  const bp = new THREE.Vector3(); BIKE4.getWorldPosition(bp);
  const u = ease(t / 8);
  look(bp.x - 0.8, bp.y + lerp(1.6, 1.4, u), bp.z + lerp(3.6, 3.0, u), bp.x - 0.4, bp.y + 1.0, bp.z, 62);
  pin(tStop, 1.05); pin(tDown, 1.05);
  tStop.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStop.visible = false; tDown.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2018年、恋の物語の主題歌として書かれた。ストリーミングは、5億回をこえた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.9; S.scene.background.set('#1e222c'); S.scene.fog.color.set('#1e222c');
  DISC.rotation.z = t * 1.2; BARS.userData.update(t);
  const u = ease(t / 9);
  look(FX + lerp(-0.4, 0.3, u), lerp(2.7, 2.6, u), lerp(4.6, 4.0, u), FX, 2.7, -2.2, 62);
  pin(t2018, 1.05); pin(tPlay, 1.05);
  t2018.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2018.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotSea(t) { // 6段目 42〜49（決め手）：タイトルは、色と季節。そのあいだを、ひらがな1文字でつなぐ
  base(); S.aim(NX, -3); lift(0); S.hemi.intensity = 1.4; S.key.intensity = 1.7;
  const k = clamp(t / 7);
  HERO6.position.z = -3.0 - k * 3.2; poseWalk(HERO6, t * 9, 1);
  FRIENDS6.forEach((p, i) => { p.position.z = -4.0 - i * 0.5 - k * 3.0; poseWalk(p, t * 9 + i, 1); if (i === 0) p.userData.arms[1].rotation.x = -2.6; });
  HERO6.userData.arms[0].rotation.x = -2.6;
  WAVES6.forEach((w, i) => w.position.z = -8.5 - i * 1.6 + Math.sin(t * 1.6 + i) * 0.3);
  const u = ease(t / 7);
  look(NX + lerp(0.4, 0.2, u), lerp(1.4, 1.6, u), lerp(1.0, 0.4, u), NX + 0.6, 3.0, -16, 62);
  pin(tColor, 1.05); pin(tJoin, 1.05);
  if (t < 3.6) tColor.userData.pop((t - 0.3) / 0.35); else tJoin.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（朝の部屋に戻る）
  shotMorning(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotMorning(t, 0) },
  { a: 9, b: 17, f: shotClass },
  { a: 17, b: 25, f: shotYard },
  { a: 25, b: 33, f: shotSlope },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: shotSea },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある朝、窓の外が<br>やけにまぶしい。'],
  [5.6, 9.0, 'セミが、<br>鳴きはじめた。'],
  [9.2, 13.2, '主人公は、いつも<br>見ているだけの高校生。'],
  [13.2, 17.0, 'みんなの輪に、<br>うまく入れない。'],
  [17.2, 21.0, '放課後の校庭は、<br>じりじり暑い。'],
  [21.0, 25.0, 'みんなの笑い声が、<br>遠くに聞こえる。'],
  [25.2, 29.0, '見ているだけは、<br>もうやめる。'],
  [29.0, 33.0, '自転車で、<br>坂道をかけおりる。'],
  [33.2, 37.4, '2018年、恋の物語の<br>主題歌として書かれた。'],
  [37.4, 41.8, 'ストリーミングは、<br>5億回をこえた。'],
  [42.2, 45.4, 'タイトルは、<br>色と季節。'],
  [45.4, 49.0, 'そのあいだを、<br>ひらがな1文字でつなぐ。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、Mrs. GREEN APPLEの、<br>青と夏。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q145', v2: true, answer: '青と夏', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 14510,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'Mrs. GREEN APPLE': 'ミセスグリーンアップル', '書かれた': 'かかれた', '主題歌': 'しゅだいか', 'ひらがな1文字': 'ひらがないちもじ', 'ストリーミング': 'ストリーミング', '2018年': 'にせんじゅうはちねん', '鳴きはじめた': 'なきはじめた', '恋の物語': 'こいのものがたり', '見ている': 'みている', '入れない': 'はいれない', '聞こえる': 'きこえる', '聞かせて': 'きかせて', '笑い声': 'わらいごえ', '高校生': 'こうこうせい', '5億回': 'ごおくかい', '主人公': 'しゅじんこう', '放課後': 'ほうかご', '自転車': 'じてんしゃ', '当てて': 'あてて', '青と夏': 'あおとなつ', '坂道': 'さかみち', '校庭': 'こうてい', '暑い': 'あつい', '遠く': 'とおく', '季節': 'きせつ', '窓': 'まど', '外': 'そと', '朝': 'あさ', '輪': 'わ', '色': 'いろ', '曲': 'きょく', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう' },
    caption: 'この曲のタイトル、わかる？\nある朝、窓の外がやけにまぶしい。セミが、鳴きはじめた。主人公は、いつも見ているだけの高校生。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '青春ソング'],
  },
});
applyQuizCards({ answer: '青と夏', info: 'Mrs. GREEN APPLE｜2018年', answerSize: 150, kind: '曲' });
