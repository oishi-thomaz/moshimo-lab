import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #146 モンスターズ・インク（アニメ映画・アメリカ・2001年製作・92分。Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/monsutazuinku（定額：Disney Plus ほか）と
//   Filmarks の動画配信欄（ディズニープラス 見放題。Prime Video・DMM TV はレンタル）で2026/11/26確認。
//   Filmarks 3.9・レビュー245,610件 filmarks.com/movies/17312。世界中で大ヒットしたアニメ映画）
// 確かめた事実（2026/11/26）：
//   ・映画.com eiga.com/movie/1124 ：2001年製作／92分／アメリカ。「トイ・ストーリー」のピクサー・アニメーション・スタジオが手がけた長編アニメーション。
//     モンスターたちの世界を舞台に、人間の子どもたちの「悲鳴」をエネルギー源として集める会社で働く、ナンバーワンの怖がらせ屋と相棒の親友。
//     子ども部屋のクローゼットを通じて人間界へ行き、子どもたちを驚かせて悲鳴を集める仕事。ある日、担当する部屋から人間の女の子がモンスターの世界に
//     迷い込んでしまう。本来、人間の子どもは危険な存在とされており、会社に知られれば大騒動は必至。ふたりは女の子を元の世界へ帰そうと奔走する
// 構成（ヒント6段）：1 夜の子ども部屋・クローゼットがひとりでに開く → 2 主人公はこわがらせる仕事のプロ・会社でナンバーワン
//   → 3 ずらりと流れていくたくさんのドア・ここは人間とは別の世界 → 4 人間の小さな女の子がまぎれこむ・相棒とこっそり帰そうとする
//   → 5 2001年のアメリカのアニメ映画・トイ・ストーリーと同じスタジオ → 6 決め手：子どもの悲鳴を集めてエネルギーにする会社・なのに子どもは危険とされている
// 結末・会社の陰謀の中身は言わない。キャラクターの見た目（青い毛の大きな体・緑の一つ目の丸い体）はなぞらず、汎用の丸い3Dの怪物にする。
// 登場人物の名前・会社名・町の名前は出さない。映像・ポスター・ロゴは使わない。有名な場面の構図はなぞらない
const S = quizStage({ bg: '#2a2a48', floor: '#3a3a52', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(14610);

const GIRL = { skin: '#f4d3b5', hair: '#2a1a12', shirt: '#e86a9a', pants: '#e86a9a', long: true, skirt: true, scale: 0.48 };
const KID = { skin: '#f1c9a5', hair: '#4a2a1a', shirt: '#6a9ad8', pants: '#3a3a5a', scale: 0.5 };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
// 汎用の怪物：丸い体・2つの目・小さな角・短い手足
function monster(c, { h = 2.0, w = 1.3, horn = '#f0e8d0' } = {}) {
  const g = new THREE.Group(); const m = mat(c);
  const bd = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), m); bd.scale.set(w, h, w * 0.85); bd.position.y = h * 0.5 + 0.25; g.add(bd);
  const eyes = new THREE.Group(); eyes.position.set(0, h * 0.78 + 0.25, w * 0.4); g.add(eyes);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat('#ffffff')); e.position.x = s * 0.17; eyes.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#111111')); p.position.set(s * 0.17, 0, 0.1); eyes.add(p); }
  const mo = box(0.36, 0.06, 0.05, mat('#3a1a1a')); mo.position.set(0, h * 0.6 + 0.25, w * 0.43); g.add(mo);
  for (const s of [-1, 1]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 8), mat(horn)); hn.position.set(s * 0.22, h + 0.32, 0); hn.rotation.z = -s * 0.3; g.add(hn); }
  const arms = []; for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * w * 0.48, h * 0.62 + 0.25, 0); const ab = box(0.18, 0.7, 0.18, m); ab.position.y = -0.3; a.add(ab); g.add(a); arms.push(a); }
  const legs = []; for (const s of [-1, 1]) { const l = box(0.24, 0.4, 0.26, m); l.position.set(s * 0.25, 0.2, 0); g.add(l); legs.push(l); }
  g.userData = { arms, legs, eyes, body: bd }; return g;
}
function door(c) { const g = new THREE.Group(); const d = box(1.0, 2.0, 0.08, mat(c)); d.position.y = 1.0; g.add(d); const k = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#e8c860')); k.position.set(0.36, 1.0, 0.06); g.add(k); const fr = box(1.12, 0.08, 0.12, mat('#5a5a66')); fr.position.y = 2.04; g.add(fr); return g; }

// ---------- 1段目. 夜の子ども部屋（x=0）。眠る子ども、少しずつ開くクローゼットの扉、暗がりで光る2つの目 ----------
{ const fl = box(10, 0.04, 8, mat('#5a4a6a')); fl.position.set(0, 0.02, -3); qs.add(fl);
  const wl = box(10, 4, 0.3, mat('#3a3a6a')); wl.position.set(0, 2, -6); qs.add(wl); const sw = box(0.3, 4, 8, mat('#3a3a6a')); sw.position.set(-4, 2, -3); qs.add(sw);
  const bd = box(1.2, 0.5, 2.2, mat('#e8e0f0')); bd.position.set(-1.2, 0.25, -3.6); qs.add(bd); const pl = box(0.7, 0.18, 0.4, mat('#ffffff')); pl.position.set(-1.2, 0.58, -4.4); qs.add(pl);
  const bl = box(1.24, 0.12, 1.4, mat('#7a9ae8')); bl.position.set(-1.2, 0.56, -3.2); qs.add(bl);
  const cl = box(1.6, 2.6, 0.5, mat('#2a2236')); cl.position.set(0.9, 1.3, -5.7); qs.add(cl);
  const wn = box(1.2, 1.0, 0.05, gl('#1a2048')); wn.position.set(-2.4, 2.4, -5.82); qs.add(wn);
  const mn = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), gl('#f4ecc8')); mn.position.set(-2.1, 2.6, -5.8); qs.add(mn);
  const nl = new THREE.PointLight('#a8b8ff', 2.6, 8); nl.position.set(0.4, 2.4, -2.4); qs.add(nl); }
const KID1 = person(KID, -1.2, -3.9, 0); KID1.rotation.x = -Math.PI / 2; KID1.position.y = 0.56; KID1.position.z = -4.2;
const CDOOR1 = new THREE.Group(); CDOOR1.position.set(0.15, 0, -5.42); qs.add(CDOOR1);
{ const d = box(1.5, 2.4, 0.06, mat('#c8b8e0')); d.position.set(0.75, 1.25, 0); CDOOR1.add(d); const k = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#e8c860')); k.position.set(1.35, 1.2, 0.05); CDOOR1.add(k); }
const EYES1 = new THREE.Group(); EYES1.position.set(0.6, 1.9, -5.5); qs.add(EYES1);
for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), gl('#f8e050')); e.position.x = s * 0.16; EYES1.add(e); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tOpen = tag('夜の子ども部屋、クローゼットが開く', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tOpen);
const tPeek = tag('なにかが、のぞいている', { size: 54, w: 680, bg: '#e24050', sx: 1.7 }); qs.add(tPeek);

// ---------- 2段目. 会社の更衣室（x=50）。ロッカー、表彰の星、胸をはる大きな怪物 ----------
const AX = 50;
{ const fl = box(12, 0.04, 10, mat('#6a6a7a')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const wl = box(12, 5, 0.3, mat('#8a9ab0')); wl.position.set(AX, 2.5, -6.5); qs.add(wl);
  for (let i = 0; i < 8; i++) { const lk = box(0.8, 2.6, 0.6, mat(['#5a7a9a', '#4a6a8a'][i % 2])); lk.position.set(AX - 3.6 + i * 0.85, 1.3, -6.0); qs.add(lk); const ln = box(0.5, 0.04, 0.02, mat('#2a3a4a')); ln.position.set(AX - 3.6 + i * 0.85, 2.2, -5.69); qs.add(ln); }
  const bn = box(3, 0.4, 0.6, mat('#8a6a4a')); bn.position.set(AX - 1.8, 0.4, -4.4); qs.add(bn); }
const MON2 = monster('#e8843a', { h: 2.3, w: 1.5 }); MON2.position.set(AX + 0.6, 0, -3.8); qs.add(MON2);
const BAR2 = []; for (let i = 0; i < 5; i++) { const b = box(0.36, 1, 0.1, gl(i === 4 ? '#e6b450' : '#5a6a8a')); b.userData.h = 0.6 + i * 0.35; b.position.set(AX - 2.6 + i * 0.5, 3.4, -6.3); qs.add(b); BAR2.push(b); }
const STAR2 = tag('★', { size: 110, w: 140, h: 140, bg: 'rgba(0,0,0,0)', color: '#e6b450', sx: 0.45 }); qs.add(STAR2);
const tPro = tag('主人公は、こわがらせる仕事のプロ', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tPro);
const tTop = tag('しかも、会社でナンバーワン', { size: 50, w: 760, bg: '#e24050', sx: 1.8 }); qs.add(tTop);

// ---------- 3段目. 大きな工場のような職場（x=100）。天井のレールをずらりと流れていくドア ----------
const BX = 100;
{ const fl = box(40, 0.04, 20, mat('#4a4a5a')); fl.position.set(BX, 0.02, -6); qs.add(fl);
  const wl = box(40, 10, 0.3, mat('#3a3a50')); wl.position.set(BX, 5, -18); qs.add(wl);
  for (let i = 0; i < 2; i++) { const rl = box(40, 0.12, 0.12, mat('#8a8a9a')); rl.position.set(BX, 3.6, -7 - i * 4); qs.add(rl); }
  for (let i = 0; i < 6; i++) { const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.3, 12), gl('#f8e8b0')); lp.position.set(BX - 10 + i * 4, 6.5, -8); qs.add(lp); } }
const DOORS3 = []; const DC = ['#e85a5a', '#5ab0e8', '#e8c040', '#8ad06a', '#c87ad8', '#f0a060', '#60c8b8', '#e870a8'];
for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { const d = door(DC[(i + r * 3) % DC.length]); d.userData.x0 = i * 2.4; d.userData.r = r; d.position.set(BX, 1.5, -7 - r * 4); qs.add(d); DOORS3.push(d); }
const WORK3 = [monster('#7ac0e8', { h: 1.8, w: 1.2 }), monster('#b08ae0', { h: 2.2, w: 1.0 }), monster('#e8c84a', { h: 1.6, w: 1.4 })];
WORK3.forEach((m, i) => { m.position.set(BX - 3 + i * 3, 0, -4.6); qs.add(m); });
const tDoors = tag('たくさんのドアが、ずらりと流れる', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tDoors);
const tWorld = tag('ここは、人間とは別の世界', { size: 52, w: 720, bg: '#e24050', sx: 1.75 }); qs.add(tWorld);

// ---------- 4段目. 夜の町の裏通り（x=150）。小さな女の子をかくして、そっと歩く2体の怪物 ----------
const CX = 150;
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#1a1a3a', '#5a4a7a')); SKY4.position.set(CX, 12, -40); qs.add(SKY4);
{ const rd = box(8, 0.04, 40, mat('#4a4658')); rd.position.set(CX, 0.03, -10); qs.add(rd);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const h = 4 + R() * 4; const b = box(4, h, 4, mat(['#6a5a8a', '#5a6a9a', '#7a6a7a'][i % 3])); b.position.set(CX + s * 6, h / 2, -2 - i * 5); qs.add(b);
    for (let k = 0; k < 3; k++) { const wn = box(0.6, 0.6, 0.05, gl(R() > 0.4 ? '#f8d888' : '#3a3a4a')); wn.position.set(CX + s * 3.97, 1.4 + k * 1.3, -1.2 - i * 5); wn.rotation.y = Math.PI / 2; qs.add(wn); } }
  const lp = new THREE.PointLight('#ffd890', 3, 10); lp.position.set(CX + 1.5, 3.2, -4); qs.add(lp); }
const BIG4 = monster('#e8843a', { h: 2.3, w: 1.5 }); BIG4.position.set(CX - 0.9, 0, -4.4); BIG4.rotation.y = Math.PI; qs.add(BIG4);
const PAL4 = monster('#6ac07a', { h: 1.6, w: 0.9 }); PAL4.position.set(CX + 1.0, 0, -4.6); PAL4.rotation.y = Math.PI; qs.add(PAL4);
const GIRL4 = person(GIRL, CX + 0.05, -4.2, Math.PI);
const tGirl = tag('人間の女の子が、まぎれこむ', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tGirl);
const tHome = tag('相棒と、こっそり帰そうとする', { size: 50, w: 780, bg: '#e24050', sx: 1.85 }); qs.add(tHome);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーンとならんだ座席、回るフィルムのリール ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#2a3a8a')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#24307a')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#6a7a9a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const REEL5 = new THREE.Group(); REEL5.position.set(DX, 2.0, -3.4); qs.add(REEL5);
{ const rm = new THREE.MeshStandardMaterial({ color: '#c8ccd4', metalness: 0.8, roughness: 0.3 }); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 32), rm); d.rotation.x = Math.PI / 2; REEL5.add(d);
  for (let i = 0; i < 5; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 14), mat('#1a1416')); const a = i / 5 * Math.PI * 2; h.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0); h.rotation.x = Math.PI / 2; REEL5.add(h); } }
const t2001 = tag('2001年の、アメリカのアニメ映画', { size: 46, w: 860, bg: '#e6b450', color: '#14161c', sx: 1.95 }); qs.add(t2001);
const tStudio = tag('トイ・ストーリーと同じスタジオ', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tStudio);

// ---------- 6段目. エネルギーのタンク室（x=250）。黄色く光るボンベが次々にたまり、町の明かりがともる ----------
const EX = 250;
{ const fl = box(14, 0.04, 12, mat('#2a2a38')); fl.position.set(EX, 0.02, -3); qs.add(fl);
  const wl = box(14, 6, 0.3, mat('#22222e')); wl.position.set(EX, 3, -7.5); qs.add(wl);
  const pp = box(12, 0.25, 0.25, mat('#7a7a8a')); pp.position.set(EX, 2.6, -6.8); qs.add(pp); }
const TANKS6 = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.6, 16), new THREE.MeshStandardMaterial({ color: '#b8bcc8', metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.55 })); sh.position.y = 0.8; g.add(sh);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1, 16), gl('#f8d840')); g.add(fill); g.userData.fill = fill;
  const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.2, 16), mat('#5a5a6a')); cp.position.y = 1.7; g.add(cp);
  g.position.set(EX - 2.5 + i * 1.0, 0, -5.4); qs.add(g); TANKS6.push(g); }
const WAVE6 = []; for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 24, Math.PI), gl('#f8e070', 0.8)); qs.add(w); WAVE6.push(w); }
const BOLT6 = []; for (let i = 0; i < 3; i++) { const b = tag('⚡', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#f8d840', sx: 0.36 }); qs.add(b); BOLT6.push(b); }
const tScream = tag('子どもの悲鳴を、エネルギーにする会社', { size: 42, w: 920, bg: '#14161c', sx: 2.0 }); qs.add(tScream);
const tDanger = tag('なのに、子どもは危険とされている', { size: 46, w: 880, bg: '#e6b450', color: '#14161c', sx: 1.95 }); qs.add(tDanger);

// ---------- shots ----------
const ALL = [tOpen, tPeek, tPro, tTop, tDoors, tWorld, tGirl, tHome, t2001, tStudio, tScream, tDanger, Q1, STAR2, ...BOLT6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotBedroom(t, quiz = 0) { // 1段目 0〜9：夜の子ども部屋で、クローゼットが開く。なにかが、のぞいている（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.45; S.darken(0.45, '#0a0a1a');
  const k = quiz ? 0.6 : clamp((t - 0.6) / 4.5); CDOOR1.rotation.y = 0.15 + k * 0.85;
  EYES1.visible = k > 0.35 || quiz; EYES1.scale.y = (Math.sin(t * 2.3) > 0.95) ? 0.15 : 1;
  Q1.position.set(-0.3, 2.7, -4.8); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tOpen, 1.05); pin(tPeek, 1.05);
  if (!quiz) { tOpen.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tOpen.visible = false; tPeek.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(2.4, 2.0, u), lerp(2.3, 2.1, u), lerp(1.0, 0.2, u), -0.4, 1.1, -4.4, 62);
  return qs;
}
function shotLocker(t) { // 2段目 9〜17：主人公は、こわがらせる仕事のプロ。しかも、会社でナンバーワン
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.2; S.key.intensity = 1.3;
  MON2.userData.arms[0].rotation.z = -0.4 - Math.sin(t * 3) * 0.2; MON2.userData.arms[1].rotation.z = 0.4 + Math.sin(t * 3) * 0.2;
  MON2.userData.arms[0].rotation.x = t > 4.3 ? -2.6 : -0.3; MON2.position.y = t > 4.3 ? Math.abs(Math.sin(t * 5)) * 0.08 : 0;
  BAR2.forEach((b, i) => { const s = clamp((t - 4.3 - i * 0.12) / 0.4); b.scale.y = Math.max(0.01, b.userData.h * s); b.position.y = 2.8 + b.userData.h * s / 2; });
  STAR2.position.set(AX - 0.6, 4.8, -6.2); STAR2.userData.pop((t - 5.2) / 0.3);
  const u = ease(t / 8);
  look(AX + lerp(-0.6, -0.3, u), lerp(2.2, 2.3, u), lerp(2.2, 1.4, u), AX - 0.2, 2.2, -4.4, 62);
  pin(tPro, 1.05); pin(tTop, 1.05);
  tPro.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPro.visible = false; tTop.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotFloor(t) { // 3段目 17〜25：会社では、たくさんのドアがずらりと流れていく。ここは、人間とは別の世界
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 1.0;
  DOORS3.forEach(d => { const x = ((d.userData.x0 + t * (d.userData.r ? 1.4 : 2.0)) % 28.8) - 14.4; d.position.x = BX + x; });
  WORK3.forEach((m, i) => { m.userData.arms[1].rotation.x = -0.4 + Math.sin(t * 3 + i) * 0.3; m.rotation.y = Math.PI + Math.sin(t + i) * 0.2; });
  const u = ease(t / 8);
  look(BX + lerp(-1.5, 1.0, u), lerp(2.4, 2.6, u), lerp(1.6, 1.0, u), BX, 2.2, -8, 62);
  pin(tDoors, 1.05); pin(tWorld, 1.05);
  tDoors.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDoors.visible = false; tWorld.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotAlley(t) { // 4段目 25〜33：人間の小さな女の子が、まぎれこんでしまう。相棒と、こっそり家へ帰そうとする
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.6; S.darken(0.35, '#14102a');
  const z = -4.4 - t * 0.35; BIG4.position.z = z; PAL4.position.z = z - 0.2; GIRL4.position.z = z + 0.6;
  BIG4.position.y = Math.abs(Math.sin(t * 4)) * 0.05; PAL4.position.y = Math.abs(Math.sin(t * 4 + 1)) * 0.05; poseWalk(GIRL4, t * 6, 0.8);
  BIG4.userData.arms[1].rotation.x = -0.6; BIG4.rotation.y = Math.PI + (t > 4.3 ? Math.sin(t * 2) * 0.4 : 0); PAL4.rotation.y = Math.PI - (t > 4.3 ? Math.sin(t * 2 + 1) * 0.4 : 0);
  const u = ease(t / 8);
  look(CX + lerp(1.2, 0.9, u), lerp(3.0, 2.8, u), z + lerp(6.4, 5.6, u), CX, 0.9, z - 0.4, 62);
  pin(tGirl, 1.05); pin(tHome, 1.05);
  tGirl.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGirl.visible = false; tHome.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2001年の、アメリカのアニメ映画。トイ・ストーリーと同じスタジオが作った
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.3; S.darken(0.8, '#020204');
  SCREEN5.material.color.setHSL(0.62, 0.3, 0.45 + Math.sin(t * 2.3) * 0.06); REEL5.rotation.z = -t * 1.5;
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.3, 2.3, u), lerp(1.6, 0.8, u), DX, 2.2, -4.5, 62);
  pin(t2001, 1.05); pin(tStudio, 1.05);
  t2001.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2001.visible = false; tStudio.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTanks(t) { // 6段目 42〜49（決め手）：子どもの悲鳴を集めて、エネルギーにする会社。なのに、子どもは危険とされている
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.6; S.darken(0.5, '#0a0a14');
  TANKS6.forEach((g, i) => { const f = clamp((t - 0.4 - i * 0.45) / 1.2); g.userData.fill.scale.y = Math.max(0.01, f * 1.4); g.userData.fill.position.y = 0.1 + f * 0.7; });
  WAVE6.forEach((w, i) => { const s = ((t * 0.9 + i * 0.2) % 1); w.position.set(EX - 2.8 + s * 5.6, 2.6, -6.5); w.scale.setScalar(0.6 + s); w.material.opacity = 0.8 * (1 - s); });
  BOLT6.forEach((b, i) => { b.position.set(EX - 1.6 + i * 1.6, 2.4 + Math.sin(t * 4 + i) * 0.1, -5.0); b.userData.pop(clamp((t - 1.6 - i * 0.4) / 0.3)); });
  const u = ease(t / 7);
  look(EX + lerp(0.6, 0.3, u), lerp(1.9, 1.8, u), lerp(0.6, 0.0, u), EX, 1.3, -5.4, 62);
  pin(tScream, 1.05); pin(tDanger, 1.05);
  if (t < 3.6) tScream.userData.pop((t - 0.3) / 0.35); else tDanger.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の子ども部屋に戻る）
  shotBedroom(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotBedroom(t, 0) },
  { a: 9, b: 17, f: shotLocker },
  { a: 17, b: 25, f: shotFloor },
  { a: 25, b: 33, f: shotAlley },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotTanks },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '夜の子ども部屋で、<br>クローゼットが開く。'],
  [5.6, 9.0, 'なにかが、<br>のぞいている。'],
  [9.2, 13.2, '主人公は、こわがらせる<br>仕事のプロ。'],
  [13.2, 17.0, 'しかも、会社で<br>ナンバーワン。'],
  [17.2, 21.0, '職場では、たくさんのドアが<br>ずらりと流れていく。'],
  [21.0, 25.0, 'ここは、人間とは<br>別の世界。'],
  [25.2, 29.0, '人間の小さな女の子が、<br>まぎれこんでしまう。'],
  [29.0, 33.0, '相棒と、こっそり<br>家へ帰そうとする。'],
  [33.2, 37.4, '2001年の、<br>アメリカのアニメ映画。'],
  [37.4, 41.8, 'トイ・ストーリーと<br>同じスタジオが作った。'],
  [42.2, 45.4, '子どもの悲鳴を集めて、<br>エネルギーにする会社。'],
  [45.4, 49.0, 'なのに、子どもは<br>危険とされている。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>モンスターズ・インク。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q146', v2: true, answer: 'モンスターズ・インク',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 14610,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [13.2, 'bubble'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'モンスターズ・インク': 'モンスターズインク', 'トイ・ストーリー': 'トイストーリー', 'ナンバーワン': 'ナンバーワン', 'クローゼット': 'クローゼット', 'こわがらせる': 'こわがらせる', 'まぎれこんで': 'まぎれこんで', 'エネルギー': 'エネルギー', 'アニメ映画': 'アニメえいが', '2001年': 'にせんいちねん', '子ども部屋': 'こどもべや', 'スタジオ': 'スタジオ', 'アメリカ': 'アメリカ', '帰そう': 'かえそう', '集めて': 'あつめて', '聞かせて': 'きかせて', '女の子': 'おんなのこ', '主人公': 'しゅじんこう', '当てて': 'あてて', '危険': 'きけん', '悲鳴': 'ひめい', '人間': 'にんげん', '職場': 'しょくば', '会社': 'かいしゃ', '仕事': 'しごと', '相棒': 'あいぼう', '世界': 'せかい', '同じ': 'おなじ', '作った': 'つくった', '小さな': 'ちいさな', '開く': 'ひらく', '別の': 'べつの', '家': 'いえ', '夜': 'よる', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう' },
    caption: 'この映画のタイトル、わかる？\n夜の子ども部屋で、クローゼットが開く。なにかが、のぞいている。主人公は、こわがらせる仕事のプロ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'DisneyPlus', '映画好き', 'アニメ映画'],
  },
});
applyQuizCards({ answer: 'モンスターズ・<br>インク', info: 'Disney+｜アニメ映画・92分', answerSize: 112 });
