import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #087 チェリー（曲・スピッツ・1996年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/14）：
//   ・スピッツの13枚目のシングル、発売日 1996年4月10日（公式 spitz-web.com/discography/single-13/）
//   ・日本レコード協会のストリーミング認定 トリプル・プラチナ（3億回以上。2026年1月度。riaj.or.jp/data/st/search/ で「チェリー」）
// 物語：曲が描く状況（旅立ちの日に大切な人と別れる → 思い出を胸に、ひとりで歩き出す → さみしさを抱えたまま前へ → いつか笑って話せる日を信じる）を
//   自分の言葉で作り直したもの。歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が文法の切れ端だけなのを確かめた）。
//   音源・ジャケット・MV・歌手の見た目は使わない。桜（花）は使わない（答えに近すぎる）。人は汎用の3D
// 構成（ヒント6段）：1 旅立ちの朝、駅で大切な人と別れる → 2 恋を終えたばかりの男の子・思い出が胸の中で光る
//   → 3 あたたかい風・でこぼこ道を自転車で → 4 さみしいけど前へ・いつか笑って話せる日が来る
//   → 5 1996年・ロックバンドのシングル・ストリーミング3億回 → 6 決め手：赤い小さな実がふたつ並んだ果物・タイトルはその英語の名前

const S = quizStage({ bg: '#8ab4d8', floor: '#7a9a6a', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(8787);

const BOY = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#4a7ad8', pants: '#2b3346' };
const GIRL = { skin: '#f4d3b5', hair: '#4a3426', shirt: '#f2e0c8', pants: '#c88a9a', long: true, skirt: true };
const SKY = (x, c1, c2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(220, 60), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); m.position.set(x, 14, -40); qs.add(m); return m; };
// 菜の花（黄色い小さな花のかたまり）
function flowers(x, z, n = 10, col = '#f2d84e') { for (let i = 0; i < n; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(col)); f.position.set(x + (R() - 0.5) * 1.6, 0.25 + R() * 0.25, z + (R() - 0.5) * 1.0); qs.add(f); const st = box(0.02, 0.3, 0.02, mat('#4a8a3a')); st.position.set(f.position.x, 0.15, f.position.z); qs.add(st); } }

// ---------- 1段目. 春の朝の駅のホーム（x=0）。電車に乗る男の子、ホームで手をふる人 ----------
const SK0 = SKY(0, '#7ab0e0', '#f4e8d0');
{ const pf = box(14, 0.6, 3.0, mat('#b8b0a4')); pf.position.set(0, 0.3, -1.2); qs.add(pf);
  const edge = box(14, 0.04, 0.3, mat('#f2c14e')); edge.position.set(0, 0.62, -2.5); qs.add(edge);
  const rf = box(14, 0.15, 2.4, mat('#5a6a7a')); rf.position.set(0, 3.6, -0.6); qs.add(rf);
  for (const x of [-3.2, 3.2]) { const p = box(0.15, 3.0, 0.15, mat('#5a6a7a')); p.position.set(x, 2.1, 0.2); qs.add(p); }
  for (let i = 0; i < 6; i++) flowers(-6 + i * 2.4, -7.5, 6); }
const TRAIN = new THREE.Group(); { const b = box(14, 2.4, 2.4, mat('#e8ecf0')); b.position.y = 1.6; TRAIN.add(b); const st = box(14, 0.3, 2.42, mat('#3a9a5a')); st.position.y = 1.1; TRAIN.add(st);
  for (let i = 0; i < 8; i++) { const w = box(1.0, 0.8, 0.05, new THREE.MeshBasicMaterial({ color: '#a8c8e0' })); w.position.set(-6 + i * 1.7, 2.0, 1.22); TRAIN.add(w); }
  const dr = box(1.0, 1.9, 0.05, mat('#9aa4b0')); dr.position.set(0.85, 1.4, 1.23); TRAIN.add(dr); TRAIN.userData.door = dr; }
TRAIN.position.set(0, 0, -3.9); qs.add(TRAIN);
const boy1 = makePerson(BOY); boy1.position.set(0.85, 0.6, -2.2); qs.add(boy1);
const girl1 = makePerson(GIRL); girl1.position.set(-0.6, 0.6, -1.4); girl1.rotation.y = Math.PI * 0.85; qs.add(girl1);
const BAG1 = box(0.4, 0.5, 0.25, mat('#8a5a3a')); BAG1.position.set(0.3, 0.75, 0.05); boy1.add(BAG1);
const tBye = tag('駅で、お別れ', { size: 60, w: 560, bg: '#14161c', sx: 1.9 }); tBye.position.set(0.1, 3.0, -1.4); qs.add(tBye);
const tAlone = tag('ひとりで出発', { size: 64, w: 460, bg: SONG_GREEN, sx: 1.7 }); tAlone.position.set(0.1, 3.0, -1.4); qs.add(tAlone);

// ---------- 2段目. 電車の窓ぎわ（x=40）。座る男の子、胸の中で光る思い出の玉 ----------
const AX = 40;
{ const fl = box(8, 0.04, 4, mat('#6a6a72')); fl.position.set(AX, 0.02, -1.5); qs.add(fl);
  const wl = box(8, 3.4, 0.2, mat('#e8ecf0')); wl.position.set(AX, 1.7, -3.0); qs.add(wl);
  const seat = box(3.0, 0.45, 0.7, mat('#3a7a5a')); seat.position.set(AX, 0.23, -2.4); qs.add(seat); const sb = box(3.0, 0.7, 0.15, mat('#3a7a5a')); sb.position.set(AX, 0.8, -2.8); qs.add(sb); }
const WIN2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(512, 220, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ac8f0'); gr.addColorStop(1, '#f4ecd8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7ab060'; g.fillRect(0, 150, w, 70); for (let i = 0; i < 40; i++) { g.fillStyle = '#f2d84e'; g.beginPath(); g.arc((i * 53) % w, 160 + (i * 17) % 50, 6, 0, 7); g.fill(); } }) }));
WIN2.material.map.wrapS = THREE.RepeatWrapping; WIN2.position.set(AX, 1.9, -2.88); qs.add(WIN2);
const boy2 = makePerson(BOY); boy2.position.set(AX + 0.3, -0.3, -2.3); boy2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(boy2);
const GLOW2 = new THREE.Group(); GLOW2.position.set(AX + 0.3, 1.25, -2.0); qs.add(GLOW2);
{ const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff0a0' })); GLOW2.add(core); const halo = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff0a0', transparent: true, opacity: 0.35 })); GLOW2.add(halo); GLOW2.userData.halo = halo; }
const MEM2 = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.38), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(100, 76, (g, w, h) => { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h); g.fillStyle = ['#9ac8f0', '#f2c0a0', '#a8d8a0', '#d8b8e8'][i]; g.fillRect(6, 6, w - 12, h - 12);
  for (const [x, c] of [[38, '#4a7ad8'], [60, '#f2e0c8']]) { g.fillStyle = '#4a3426'; g.beginPath(); g.arc(x, 30, 7, 0, 7); g.fill(); g.fillStyle = c; g.fillRect(x - 7, 37, 14, 24); } }) })); qs.add(m); MEM2.push(m); }
const tEnd = tag('恋を終えた男の子', { size: 60, w: 560, bg: '#14161c', sx: 1.9 }); tEnd.position.set(AX, 2.95, -2.0); qs.add(tEnd);
const tMem = tag('胸の中で光る記憶', { size: 60, w: 560, bg: SONG_GREEN, sx: 1.6 }); tMem.position.set(AX, 2.95, -2.0); qs.add(tMem);

// ---------- 3段目. 春の田舎道（x=80）。あたたかい風、でこぼこ道を自転車で ----------
const BX = 80;
const SKB = SKY(BX, '#6aa8e0', '#f8f0d8');
{ const rd = box(3.0, 0.04, 60, mat('#c8b088')); rd.position.set(BX, 0.04, -20); qs.add(rd);
  for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.12 + R() * 0.1, 8, 6), mat('#a89070')); b.scale.y = 0.35; b.position.set(BX + (R() - 0.5) * 2.4, 0.05, 2 - i * 1.8); qs.add(b); }
  for (let i = 0; i < 14; i++) flowers(BX + (i % 2 ? 2.8 : -2.8) + (R() - 0.5), 1 - Math.floor(i / 2) * 4, 8);
  for (let i = 0; i < 8; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 10), mat('#6a9a5a')); h.scale.y = 0.35; h.position.set(BX - 24 + i * 7, 0, -36 - (i % 2) * 6); qs.add(h); } }
const BIKE = new THREE.Group(); { for (const z of [-0.45, 0.45]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 20), mat('#2a2a2e')); w.rotation.y = Math.PI / 2; w.position.set(0, 0.32, z); BIKE.add(w); }
  const fr = box(0.05, 0.05, 0.9, mat('#c8202c')); fr.position.set(0, 0.55, 0); BIKE.add(fr); const sp = box(0.05, 0.35, 0.05, mat('#c8202c')); sp.position.set(0, 0.5, 0.3); BIKE.add(sp); const hb = box(0.5, 0.04, 0.04, mat('#2a2a2e')); hb.position.set(0, 0.85, -0.42); BIKE.add(hb); }
BIKE.position.set(BX, 0, 1); qs.add(BIKE);
const boy3 = makePerson(BOY); boy3.position.set(BX, 0.12, 1.1); qs.add(boy3);
const WIND3 = []; for (let i = 0; i < 10; i++) { const w = box(0.9 + R() * 0.8, 0.025, 0.025, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); w.userData = { y: 0.8 + R() * 2.2, z: -R() * 6, o: R() }; qs.add(w); WIND3.push(w); }
const PET3 = []; for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.06, 6), new THREE.MeshBasicMaterial({ color: '#f2d84e', side: THREE.DoubleSide })); p.userData = { y: 0.5 + R() * 2, z: -R() * 6, o: R() }; qs.add(p); PET3.push(p); }
const tWind = tag('あたたかい風', { size: 64, w: 440, bg: '#14161c', sx: 1.6 }); tWind.position.set(BX, 2.9, -1.0); qs.add(tWind);
const tRoad = tag('でこぼこ坂を走る', { size: 60, w: 540, bg: SONG_GREEN, sx: 1.9 }); tRoad.position.set(BX, 2.9, -1.0); qs.add(tRoad);

// ---------- 4段目. 夕方の分かれ道（x=120）。前を向いて歩く男の子。遠くの道に小さな人影 ----------
const CX = 120;
const SKC = SKY(CX, '#e8a070', '#fae0b8');
{ const gr = box(30, 0.04, 40, mat('#8aa86a')); gr.position.set(CX, 0.02, -14); qs.add(gr);
  const r1 = box(2.0, 0.05, 30, mat('#c8b088')); r1.position.set(CX - 2.2, 0.05, -14); r1.rotation.y = 0.25; qs.add(r1);
  const r2 = box(2.0, 0.05, 30, mat('#c8b088')); r2.position.set(CX + 2.2, 0.05, -14); r2.rotation.y = -0.25; qs.add(r2);
  for (let i = 0; i < 6; i++) flowers(CX + (i % 2 ? 4.5 : -4.5), -2 - Math.floor(i / 2) * 5, 8); }
const boy4 = makePerson(BOY); boy4.position.set(CX, 0, -0.5); qs.add(boy4);
const far4 = makePerson(GIRL); far4.scale.setScalar(0.85); far4.position.set(CX + 5.6, 0, -22); far4.rotation.y = Math.PI * 1.15; qs.add(far4);
const SPARK4 = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.5, 32), new THREE.MeshBasicMaterial({ color: '#fff4c0', transparent: true, opacity: 0, side: THREE.DoubleSide })); qs.add(SPARK4);
const tLonely = tag('さみしいけど、前へ', { size: 60, w: 580, bg: '#14161c', sx: 2.0 }); tLonely.position.set(CX, 3.0, -2.4); qs.add(tLonely);
const tAgain = tag('きっと、笑える日が', { size: 60, w: 580, bg: SONG_GREEN, sx: 2.0 }); tAgain.position.set(CX, 3.0, -2.4); qs.add(tAgain);

// ---------- 5段目. 記録（x=180）。ジャケットのない無地のディスクと、音のバー ----------
const FX = 180;
{ const fl = box(12, 0.04, 10, mat('#1a2420')); fl.position.set(FX, 0.02, -1); qs.add(fl);
  const wl = box(12, 8, 0.2, mat('#14201a')); wl.position.set(FX, 4, -4); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const t1996 = tag('1996年 ロックバンド', { size: 58, w: 620, bg: '#e6b450', color: '#14161c', sx: 2.3 }); t1996.position.set(FX, 4.4, -2.0); qs.add(t1996);
const tPlay = tag('ストリーミング 3億回超え', { size: 54, w: 720, bg: SONG_GREEN, sx: 2.6 }); tPlay.position.set(FX, 4.4, -2.0); qs.add(tPlay);

// ---------- 6段目. 決め手（x=220）。赤い小さな実がふたつ並んだ果物 ----------
const NX = 220;
{ const fl = box(12, 0.04, 10, mat('#2a1a1e')); fl.position.set(NX, 0.02, -1); qs.add(fl);
  const wl = box(12, 8, 0.2, mat('#3a2228')); wl.position.set(NX, 4, -4); qs.add(wl); }
const FRUIT = new THREE.Group(); FRUIT.position.set(NX, 2.1, -1.8); qs.add(FRUIT);
{ const red = new THREE.MeshStandardMaterial({ color: '#d0182a', roughness: 0.25, metalness: 0.1 });
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), red); b.scale.set(1, 0.92, 1); b.position.set(s * 0.42, -0.5, 0); FRUIT.add(b);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd0d0' })); hl.position.set(s * 0.42 - 0.15, -0.35, 0.36); FRUIT.add(hl);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 0.4, -0.12, 0), new THREE.Vector3(s * 0.25, 0.5, 0), new THREE.Vector3(0, 0.75, 0)), 12, 0.025, 6), mat('#4a7a2a')); FRUIT.add(stem); }
  const lf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat('#4a9a3a')); lf.scale.set(1.4, 0.25, 0.7); lf.position.set(0.22, 0.8, 0); lf.rotation.z = 0.4; FRUIT.add(lf); }
const SP6 = []; for (let i = 0; i < 10; i++) { const s = tag('✦', { size: 80, w: 110, h: 110, bg: 'rgba(0,0,0,0)', color: '#fff0c0', sx: 0.28 }); qs.add(s); SP6.push(s); }
const tTwo = tag('ふたつ並んだ、赤い実', { size: 58, w: 640, bg: '#c8202c', sx: 2.2 }); tTwo.position.set(NX, 3.6, -1.6); qs.add(tTwo);
const tName = tag('タイトルは英語の名前', { size: 58, w: 640, bg: SONG_GREEN, sx: 2.2 }); tName.position.set(NX, 3.6, -1.6); qs.add(tName);

// ---------- shots ----------
const ALL = [tBye, tAlone, tEnd, tMem, tWind, tRoad, tLonely, tAgain, t1996, tPlay, tTwo, tName];
function base() { [SK0, SKB, SKC].forEach(m => m.visible = false); S.reset(); ALL.forEach(x => x.visible = false); SP6.forEach(s => s.visible = false); }

function shotStation(t, quiz = 0) { // 1段目 0〜9：旅立ちの朝、駅のホームで、大切な人と別れた。手をふって、ひとりで電車に乗る（0秒目がサムネ）
  base(); SK0.visible = true; S.aim(0, -2); lift(0); S.hemi.intensity = 1.15; S.darken(0.0);
  girl1.userData.arms[1].rotation.x = -2.6 + Math.sin(t * 6) * 0.25; girl1.userData.arms[1].rotation.z = 0.2;
  const k = quiz ? 0 : clamp((t - 4.2) / 1.0);
  boy1.position.z = lerp(-2.2, -2.85, k); boy1.rotation.y = k > 0.05 ? Math.PI : lerp(-0.5, -0.4, 0) ; poseWalk(boy1, t * 6, k > 0 && k < 1 ? 0.7 : 0);
  if (k <= 0.05) { boy1.userData.arms[0].rotation.x = -2.4 + Math.sin(t * 5) * 0.2; boy1.rotation.y = -0.5; }
  TRAIN.userData.door.position.x = 0.85 + (t > 6.2 && !quiz ? Math.min(1, (t - 6.2) / 0.5) * 1.0 : 0);
  if (!quiz && t > 6.8) TRAIN.position.x = -Math.pow(t - 6.8, 2) * 0.8; else TRAIN.position.x = 0;
  boy1.visible = quiz || t < 6.6;
  if (!quiz) { tBye.userData.pop((t - 0.6) / 0.35); if (t > 4.1) tBye.visible = false; tAlone.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.0, u), lerp(2.2, 2.4, u), lerp(3.4, 3.8, u), 0.1, 1.7, -2.2, 62);
  return qs;
}
function shotTrain(t) { // 2段目 9〜17：主人公は、恋を終えたばかりの若い男の子。ふたりの記憶が、胸の中で光っている
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.0; S.darken(0.1);
  WIN2.material.map.offset.x = t * 0.15;
  boy2.userData.head.rotation.y = t < 4 ? 0.9 : 0; boy2.userData.head.rotation.x = t < 4 ? 0 : 0.35; boy2.userData.arms.forEach(a => a.rotation.x = -0.6);
  const g = ease(clamp((t - 4.2) / 0.6)); GLOW2.scale.setScalar(Math.max(0.001, g)); GLOW2.userData.halo.scale.setScalar(1 + Math.sin(t * 4) * 0.15);
  MEM2.forEach((m, i) => { const a = t * 0.7 + i * 1.57; m.visible = t > 4.4; m.material.opacity = clamp((t - 4.4 - i * 0.2) / 0.4); m.position.set(AX + 0.3 + Math.cos(a) * 0.9, 1.6 + i * 0.12 + Math.sin(a * 1.3) * 0.12, -2.0 + Math.sin(a) * 0.3); m.lookAt(AX + 0.3, 1.8, 2.8); });
  tEnd.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tEnd.visible = false; tMem.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.4, 0.3, u), lerp(1.9, 1.8, u), lerp(2.2, 1.6, u), AX + 0.2, 1.5, -2.4, 62);
  return qs;
}
function shotRoad(t) { // 3段目 17〜25：あたたかい風が吹く、新しい季節。でこぼこの坂を、自転車で走りだす
  base(); SKB.visible = true; S.aim(BX, -4); lift(0); S.hemi.intensity = 1.2; S.darken(0.0);
  const z = 1.0 - t * 1.4;
  BIKE.position.set(BX, Math.abs(Math.sin(t * 9)) * 0.03, z); BIKE.rotation.z = Math.sin(t * 3) * 0.04;
  boy3.position.set(BX, 0.12 + BIKE.position.y, z + 0.12); boy3.rotation.y = Math.PI; boy3.userData.legs.forEach((l, i) => l.rotation.x = -1.0 + Math.sin(t * 8 + i * Math.PI) * 0.5); boy3.userData.arms.forEach(a => a.rotation.x = -1.1);
  WIND3.forEach(w => { const k = (t * 0.6 + w.userData.o) % 1; w.position.set(BX - 4 + k * 8, w.userData.y, z + w.userData.z); w.material.opacity = 0.7 * Math.sin(k * Math.PI); });
  PET3.forEach(p => { const k = (t * 0.4 + p.userData.o) % 1; p.position.set(BX - 3 + k * 6, p.userData.y + Math.sin(t * 3 + p.userData.o * 9) * 0.2, z + p.userData.z); p.rotation.set(t * 3, t * 2, 0); });
  tWind.position.z = z - 2.0; tRoad.position.z = z - 2.0;
  tWind.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWind.visible = false; tRoad.userData.pop((t - 4.2) / 0.35);
  look(BX + 1.0, 2.6, z + 5.0, BX, 1.3, z - 2.0, 62);
  return qs;
}
function shotFork(t) { // 4段目 25〜33：さみしいけれど、前を向いて進む。笑って話せる日が、きっと来る
  base(); SKC.visible = true; S.aim(CX, -4); lift(0); S.hemi.intensity = 1.0; S.darken(0.15, '#e8a070');
  const k = clamp(t / 8);
  boy4.position.set(CX - 0.4 - k * 1.0, 0, -0.5 - k * 3.6); boy4.rotation.y = Math.PI + 0.25; poseWalk(boy4, t * 5, 0.7);
  boy4.userData.head.rotation.x = t < 4 ? 0.3 : -0.1;
  const s = clamp((t - 4.6) / 1.2); SPARK4.position.set(CX + 1.0, 2.4, -16); SPARK4.material.opacity = s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0; SPARK4.scale.setScalar(1 + s * 2);
  far4.visible = false;
  tLonely.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLonely.visible = false; tAgain.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  const bx = boy4.position.x, bz = boy4.position.z; tLonely.position.set(bx + 0.2, 3.0, bz - 1.6); tAgain.position.set(bx + 0.2, 3.0, bz - 1.6);
  look(bx + 0.6, lerp(2.4, 2.6, u), bz + 4.4, bx - 0.2, 1.4, bz - 8, 60);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：1996年に発売された、ロックバンドのシングル。ストリーミングでも、3億回を超えた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.6, '#06100a');
  DISC.rotation.z = -t * 2.2; DISC.rotation.y = 0.25 * Math.sin(t * 0.6);
  BARS.userData.update(t);
  t1996.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1996.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(FX + lerp(-0.3, 0.3, u), 2.5, lerp(3.4, 2.8, u), FX, 2.4, -2.2, 62);
  return qs;
}
function shotFruit(t, quiz = 0) { // 6段目 42〜49（決め手）：赤くて小さな実が、ふたつ並んだ果物。タイトルは、その英語の名前
  base(); S.aim(NX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.45, '#14080a');
  FRUIT.rotation.y = Math.sin(t * 0.9) * 0.5; FRUIT.position.y = 2.1 + Math.sin(t * 1.6) * 0.06; FRUIT.scale.setScalar(quiz ? 1 : ease(clamp(t / 0.6)));
  SP6.forEach((s, i) => { s.visible = true; s.userData.pop(1); const a = t * 0.8 + i * 0.63; s.position.set(NX + Math.cos(a) * 1.3, 2.0 + Math.sin(a * 1.4) * 0.8, -1.8 + Math.sin(a) * 0.3); });
  if (!quiz) { tTwo.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tTwo.visible = false; tName.userData.pop((t - 3.5) / 0.3); }
  const u = ease(t / 7);
  look(NX + lerp(-0.4, 0.3, u), 2.4, lerp(3.4, 2.9, u), NX, 2.0, -1.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（自転車の道に戻る）
  shotRoad(2.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.darken(0.25 * d, '#30402a');
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStation(t, 0) },
  { a: 9, b: 17, f: shotTrain },
  { a: 17, b: 25, f: shotRoad },
  { a: 25, b: 33, f: shotFork },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: (t) => shotFruit(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '旅立ちの朝、駅のホームで、<br>大切な人と別れた。'],
  [5.6, 9.0, '手をふって、<br>ひとりで電車に乗る。'],
  [9.2, 13.2, '主人公は、恋を終えたばかりの<br>若い男の子。'],
  [13.2, 17.0, 'ふたりの記憶が、<br>胸の中で光っている。'],
  [17.2, 21.0, 'あたたかい風が吹く、<br>新しい季節。'],
  [21.0, 25.0, 'でこぼこの坂を、<br>自転車で走りだす。'],
  [25.2, 29.0, 'さみしいけれど、<br>前を向いて進む。'],
  [29.0, 33.0, '笑って話せる日が、<br>きっと来る。'],
  [33.2, 37.4, '1996年に発売された、<br>ロックバンドのシングル。'],
  [37.4, 41.8, 'ストリーミングでも、<br>3億回を超えた。'],
  [42.2, 45.4, '赤くて小さな実が、<br>ふたつ並んだ果物。'],
  [45.4, 49.0, 'タイトルは、その<br>英語の名前。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、スピッツの、チェリー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q087', v2: true, answer: 'チェリー', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 8787,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'スピッツ': 'スピッツ', '旅立ち': 'たびだち', '朝': 'あさ', '駅': 'えき', '大切な人': 'たいせつなひと', '別れた': 'わかれた', '電車': 'でんしゃ', '乗る': 'のる', '主人公': 'しゅじんこう', '恋': 'こい', '終えた': 'おえた', '若い': 'わかい', '男の子': 'おとこのこ', '記憶': 'きおく', '胸の中': 'むねのなか', '光って': 'ひかって', '風': 'かぜ', '吹く': 'ふく', '新しい': 'あたらしい', '季節': 'きせつ', '坂': 'さか', '自転車': 'じてんしゃ', '走りだす': 'はしりだす', '前を向いて': 'まえをむいて', '進む': 'すすむ', '笑って': 'わらって', '話せる': 'はなせる', '来る': 'くる', '1996年': 'せんきゅうひゃくきゅうじゅうろくねん', '発売': 'はつばい', '3億回': 'さんおくかい', '超えた': 'こえた', '赤くて': 'あかくて', '小さな実': 'ちいさなみ', '並んだ': 'ならんだ', '果物': 'くだもの', '英語': 'えいご', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この曲のタイトル、わかる？\n旅立ちの朝、駅のホームで、大切な人と別れた。手をふって、ひとりで電車に乗る。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '90年代'],
  },
});
applyQuizCards({ answer: 'チェリー', info: 'スピッツ｜1996年', answerSize: 130, kind: '曲' });
