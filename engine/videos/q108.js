import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #108 万引き家族（映画・日本・2018年6月8日公開・120分。FOD・U-NEXT で見放題、
//   U-NEXT の作品ページ video.unext.jp/title/SID0039892（見放題の札）と Filmarks の動画配信欄（FOD・Hulu・Lemino・Netflix・Prime Video・U-NEXT 見放題）で2026/11/18確認。
//   Filmarks 3.9・レビュー247,984件 filmarks.com/movies/77796）
// 確かめた事実（Filmarks の作品紹介 filmarks.com/movies/77796、Wikipedia 日本語版 万引き家族 の 概要・あらすじ・受賞。2026/11/18）：
//   ・高層マンションの谷間にポツンと取り残された今にも壊れそうな平屋に、治と信代の夫婦、息子の祥太、信代の妹の亜紀の4人が転がり込んで暮らしている（Filmarks）
//   ・彼らの目当ては、この家の持ち主である初枝の年金。足りない生活費は、万引きで稼いでいた（Filmarks）
//   ・互いに口は悪いが仲よく暮らし、なぜかいつも笑いが絶えない（Filmarks）
//   ・冬のある日、近隣の団地の廊下で震えていた幼い女の子を、見かねた治が家に連れ帰る。信代は娘として育てることにする（Filmarks・Wikipedia）
//   ・監督・脚本 是枝裕和。第71回カンヌ国際映画祭で最高賞のパルム・ドール（Wikipedia）
// 構成（ヒント6段）：1 寒い夜、外で震える小さな女の子・見かねて家に連れて帰る → 2 ビルの谷間の古い平屋・家族5人がぎゅうぎゅうに暮らす
//   → 3 口は悪いけど仲がいい・いつも笑いが絶えない → 4 頼りは、おばあちゃんの年金・女の子も家族の一員に
//   → 5 2018年の日本映画・監督は是枝裕和・カンヌで最高賞 → 6 決め手：足りない生活費は、お店の品物をこっそりかばんへ
// ある事件・家族がばらばらになること・家族それぞれの秘密・結末は言わない。人物名・地名・タイトルの文字は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図（縁側で花火の音を見上げる場面・海辺の場面など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#1a2030', floor: '#2a3040', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(10810);

const DAD = { skin: '#e8b98f', hair: '#2a2420', shirt: '#6a5a48', pants: '#3a3a40' };
const MOM = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#c8604a', pants: '#3a3e52', skirt: true, long: true };
const BOY = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#4a7ab0', pants: '#3a3a40', scale: 0.74 };
const GIRL = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#e8a0b0', pants: '#e8a0b0', skirt: true, scale: 0.55 };
const GRAN = { skin: '#e8c4a0', hair: '#c8c8c8', shirt: '#8a7a9a', pants: '#5a5068', skirt: true, scale: 0.9 };
const SIS = { skin: '#f4d3b5', hair: '#6a4a30', shirt: '#f0e0e8', pants: '#5a6a8a', skirt: true, long: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function knitCap(p, c = '#5a6a4a') { const k = box(0.45, 0.16, 0.43, mat(c)); k.position.y = 0.52; p.userData.head.add(k); }
// 平屋（瓦屋根の小さな家）
function hiraya(x, z, s = 1) { const g = new THREE.Group();
  const b = box(4.4, 2.2, 3.2, mat('#8a7a62')); b.position.y = 1.1; g.add(b);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.3, 4), mat('#4a4a52')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.75); rf.position.y = 2.85; g.add(rf);
  const sh = box(1.8, 1.4, 0.06, gl('#ffd890')); sh.position.set(-0.6, 1.0, 1.62); g.add(sh);
  for (let i = 0; i < 4; i++) { const l = box(0.03, 1.4, 0.04, mat('#5a4a3a')); l.position.set(-1.35 + i * 0.5, 1.0, 1.64); g.add(l); }
  const dr = box(0.8, 1.7, 0.06, mat('#6a5a40')); dr.position.set(1.3, 0.85, 1.62); g.add(dr);
  g.position.set(x, 0, z); g.scale.setScalar(s); qs.add(g); return g; }

// ---------- 1段目. 冬の夜の団地（x=0）。1階の外廊下で、小さな女の子がひとりうずくまる ----------
{ const gr = box(24, 0.04, 20, mat('#3a3e48')); gr.position.set(0, 0.02, -4); qs.add(gr);
  const bd = box(12, 7, 3, mat('#8a8e98')); bd.position.set(0, 3.5, -8); qs.add(bd);
  const cor = box(12, 0.2, 1.6, mat('#9a9ea8')); cor.position.set(0, 0.5, -5.7); qs.add(cor);
  const rail = box(12, 0.08, 0.1, mat('#7a7e88')); rail.position.set(0, 1.5, -4.92); qs.add(rail);
  for (let i = 0; i < 25; i++) { const b = box(0.04, 0.9, 0.04, mat('#7a7e88')); b.position.set(-6 + i * 0.5, 1.05, -4.92); qs.add(b); }
  for (let i = 0; i < 4; i++) { const d = box(1.0, 1.9, 0.06, mat('#5a6070')); d.position.set(-4.5 + i * 3, 1.55, -6.47); qs.add(d);
    const w = box(1.0, 0.6, 0.06, gl(i === 1 ? '#3a4050' : '#ffd890')); w.position.set(-3.4 + i * 3, 1.9, -6.47); qs.add(w); }
  for (let f = 1; f < 3; f++) for (let i = 0; i < 4; i++) { const w = box(1.0, 0.7, 0.06, gl((f + i) % 3 ? '#3a4050' : '#ffd890')); w.position.set(-4.5 + i * 3, 1.6 + f * 2.2, -6.47); qs.add(w); } }
const girl1 = makePerson(GIRL); girl1.position.set(-0.2, 0.18, -5.6); qs.add(girl1);
const dad1 = makePerson(DAD); knitCap(dad1); dad1.position.set(2.6, 0, -3.6); qs.add(dad1);
const SNOW1 = []; for (let i = 0; i < 70; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), gl('#ffffff')); s.userData.p = [R() * 10 - 5, R() * 5, -2 - R() * 4]; qs.add(s); SNOW1.push(s); }
const BREATH1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), gl('#e8eef4', 0.6)); qs.add(BREATH1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tCold = tag('寒い夜、震える小さな女の子', { size: 52, w: 780, bg: '#14161c', sx: 1.9 }); tCold.position.set(0.2, 2.2, -4.8); qs.add(tCold);
const tTake = tag('見かねて、家に連れて帰る', { size: 54, w: 720, bg: '#c8202c', sx: 1.8 }); tTake.position.set(0.2, 2.2, -4.8); qs.add(tTake);

// ---------- 2段目. 高層ビルの谷間（x=50）。まわりは高いビル、まん中に古い平屋がひとつ ----------
const AX = 50;
{ const gr = box(30, 0.04, 24, mat('#5a5a58')); gr.position.set(AX, 0.02, -6); qs.add(gr);
  for (let i = 0; i < 6; i++) { const hgt = 12 + (i % 3) * 4; const b = box(4, hgt, 4, mat(['#9aa0a8', '#a8acb4', '#8a929c'][i % 3])); const sx = i < 3 ? -1 : 1; b.position.set(AX + sx * (4.6 + (i % 3) * 4.2), hgt / 2, -10 - (i % 3) * 3); qs.add(b);
    for (let f = 0; f < 8; f++) { const w = box(3.2, 0.3, 0.06, gl(f % 3 ? '#c8d8e8' : '#ffe8b8')); w.position.set(b.position.x, 1.5 + f * 1.6, b.position.z + 2.03); qs.add(w); } } }
hiraya(AX, -9, 1.0);
const FAM2 = [DAD, MOM, BOY, SIS, GRAN].map((c, i) => { const p = makePerson(c); p.position.set(AX - 1.6 + i * 0.8, 0, -6.6); qs.add(p); return p; });
const tGap = tag('ビルの谷間の、古い平屋', { size: 54, w: 680, bg: '#14161c', sx: 4.4 }); tGap.position.set(AX, 6.6, -8); qs.add(tGap);
const tFive = tag('5人で、ぎゅうぎゅう暮らし', { size: 52, w: 760, bg: '#2a6ab0', sx: 4.8 }); tFive.position.set(AX, 6.6, -8); qs.add(tFive);

// ---------- 3段目. 狭い茶の間（x=100）。ちゃぶ台を囲む家族。物があふれる部屋 ----------
const BX = 100;
{ const fl = box(8, 0.04, 7, mat('#c8b080')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 4; i++) { const ln = box(0.02, 0.01, 7, mat('#a8905a')); ln.position.set(BX - 3 + i * 2, 0.045, -2); qs.add(ln); }
  const wl = box(8, 3.4, 0.2, mat('#d8c8a8')); wl.position.set(BX, 1.7, -5); qs.add(wl);
  for (let i = 0; i < 14; i++) { const b = box(0.3 + (i % 3) * 0.15, 0.25 + (i % 4) * 0.12, 0.3, mat(['#c8a070', '#8a9ab0', '#e8e0d0', '#6a8a5a', '#c86a5a'][i % 5])); b.position.set(BX - 3.6 + (i % 7) * 0.45, 0.15 + Math.floor(i / 7) * 0.4, -4.6 + (i % 2) * 0.2); qs.add(b); }
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 24), mat('#7a5a3a')); tb.position.set(BX, 0.4, -2.4); qs.add(tb);
  const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.38, 8), mat('#5a3a2a')); lg.position.set(BX, 0.2, -2.4); qs.add(lg);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 16, 1, true), mat('#e8e0c8')); lamp.position.set(BX, 2.6, -2.4); qs.add(lamp); }
const POT3 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.2, 16), mat('#3a3a3a')); POT3.position.set(BX, 0.53, -2.4); qs.add(POT3);
const STEAM3 = []; for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), gl('#ffffff', 0.5)); qs.add(s); STEAM3.push(s); }
const FAM3 = [DAD, MOM, BOY, SIS, GRAN].map((c, i) => { const p = makePerson(c); const a = Math.PI * (-0.6 + i * 0.3); p.position.set(BX + Math.sin(a) * 1.25, 0, -2.4 - Math.cos(a) * 1.25); p.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)) + Math.PI; qs.add(p); return p; });
const tRough = tag('口は悪いけど、仲がいい', { size: 54, w: 680, bg: '#14161c', sx: 2.6 }); tRough.position.set(BX, 2.6, -3.6); qs.add(tRough);
const tLaugh = tag('いつも、笑いが絶えない', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 2.6 }); tLaugh.position.set(BX, 2.6, -3.6); qs.add(tLaugh);

// ---------- 4段目. 縁側の奥の部屋（x=150）。おばあちゃんが封筒を手に座る。女の子がとなりに ----------
const CX = 150;
{ const fl = box(8, 0.04, 7, mat('#c8b080')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(8, 3.4, 0.2, mat('#d0c0a0')); wl.position.set(CX, 1.7, -5); qs.add(wl);
  const sh = box(2.4, 2.0, 0.06, gl('#f4ecd8')); sh.position.set(CX - 2.2, 1.6, -4.88); qs.add(sh);
  for (let i = 0; i < 5; i++) { const l = box(0.03, 2.0, 0.04, mat('#8a6a4a')); l.position.set(CX - 3.4 + i * 0.6, 1.6, -4.84); qs.add(l); } }
const gran4 = makePerson(GRAN); gran4.position.set(CX - 0.5, 0.0, -3.0); qs.add(gran4);
const girl4 = makePerson(GIRL); girl4.position.set(CX + 0.6, 0.0, -2.8); qs.add(girl4);
const ENV4 = new THREE.Group(); { const e = box(0.5, 0.32, 0.03, mat('#f0e8d0')); ENV4.add(e); const f = box(0.5, 0.06, 0.035, mat('#c8a050')); f.position.y = 0.13; ENV4.add(f); }
ENV4.position.set(0.05, -0.65, 0.18); gran4.userData.arms[1].add(ENV4);
const YEN4 = []; for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.7, roughness: 0.3 })); c.rotation.x = Math.PI / 2; qs.add(c); YEN4.push(c); }
const H4 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gl('#ff8aa0')); qs.add(H4);
const tPension = tag('頼りは、おばあちゃんの年金', { size: 52, w: 760, bg: '#14161c', sx: 2.8 }); tPension.position.set(CX, 2.5, -3.6); qs.add(tPension);
const tFamily = tag('女の子も、家族の一員に', { size: 54, w: 680, bg: '#c8604a', sx: 2.6 }); tFamily.position.set(CX, 2.5, -3.6); qs.add(tFamily);

// ---------- 5段目. 映画館（x=200）。スクリーンに、ビルの谷間の小さな家の明かり。金色の葉の飾り ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1e1a22')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#2a2230')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#5a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2a4a'); gr.addColorStop(1, '#3a4a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a6478'; g.fillRect(40, 40, 140, 320); g.fillRect(520, 20, 160, 340); g.fillRect(200, 100, 90, 260); g.fillRect(430, 120, 80, 240);
  g.fillStyle = '#ffe0a0'; for (let i = 0; i < 30; i++) g.fillRect([60, 540, 215, 445][i % 4] + ((i * 37) % 60), 60 + ((i * 53) % 260), 14, 8);
  g.fillStyle = '#4a4038'; g.fillRect(300, 270, 120, 70); g.beginPath(); g.moveTo(290, 272); g.lineTo(360, 230); g.lineTo(430, 272); g.fill();
  g.fillStyle = '#ffd890'; g.fillRect(320, 295, 40, 25); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const LEAF5 = new THREE.Group(); for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.25 })); l.scale.set(0.5, 1.4, 0.2); const a = (i - 4) * 0.28; l.position.set(Math.sin(a) * 0.9, Math.cos(a) * 0.9 - 0.6, 0); l.rotation.z = -a; LEAF5.add(l); }
LEAF5.position.set(TX, 1.2, -1.2); qs.add(LEAF5);
const t2018 = tag('2018年の、日本映画', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 4.6 }); t2018.position.set(TX, 6.4, -4.4); qs.add(t2018);
const tCannes = tag('カンヌで、最高賞', { size: 60, w: 560, bg: '#c8202c', sx: 4.2 }); tCannes.position.set(TX, 6.4, -4.4); qs.add(tCannes);

// ---------- 6段目. 夕方の商店（x=250）。棚の前の父と息子。品物がリュックへ ----------
const DX = 250;
{ const fl = box(12, 0.04, 9, mat('#d8d4c8')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 4, 0.2, mat('#e8e4d8')); wl.position.set(DX, 2, -5.5); qs.add(wl);
  for (let r = 0; r < 2; r++) { const sh = box(4.4, 1.8, 0.6, mat('#a8a8a0')); sh.position.set(DX - 1 + r * 0.2, 0.9, -4.4 + r * 2.2); if (r) sh.visible = false; qs.add(sh);
    for (let lv = 0; lv < 3; lv++) for (let i = 0; i < 9; i++) { const it = box(0.3, 0.32, 0.25, mat(['#e8506a', '#4a8ad8', '#f0c830', '#5ab87a', '#e8a050'][(i + lv) % 5])); it.position.set(DX - 2.9 + i * 0.47, 0.42 + lv * 0.55, -4.0); qs.add(it); } }
  for (let i = 0; i < 4; i++) { const l = box(1.4, 0.06, 0.3, gl('#fff8e0')); l.position.set(DX - 4 + i * 2.6, 3.9, -2); qs.add(l); } }
const dad6 = makePerson(DAD); knitCap(dad6); dad6.position.set(DX - 0.8, 0, -3.2); qs.add(dad6);
const boy6 = makePerson(BOY); boy6.position.set(DX + 0.6, 0, -3.3); qs.add(boy6);
const PACK6 = box(0.36, 0.42, 0.18, mat('#3a5a3a')); PACK6.position.set(0, 1.12, -0.24); boy6.add(PACK6);
const ITEM6 = box(0.22, 0.24, 0.18, mat('#f0c830')); qs.add(ITEM6);
const tShop = tag('足りない分は、お店で…', { size: 56, w: 640, bg: '#c8202c', sx: 2.6 }); tShop.position.set(DX - 0.1, 2.9, -4.2); qs.add(tShop);
const tBag = tag('こっそり、かばんの中へ', { size: 54, w: 680, bg: '#14161c', sx: 2.6 }); tBag.position.set(DX - 0.1, 2.9, -4.2); qs.add(tBag);

// ---------- shots ----------
const ALL = [tCold, tTake, tGap, tFive, tRough, tLaugh, tPension, tFamily, t2018, tCannes, tShop, tBag, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotCold(t, quiz = 0) { // 1段目 0〜9：寒い夜、外の廊下で震える小さな女の子。見かねた男が、家に連れて帰る（0秒目がサムネ）
  base(); S.aim(0, -5); lift(0); S.hemi.intensity = 0.55; S.darken(0.55, '#05070e');
  girl1.rotation.y = 0; girl1.userData.legs.forEach(l => l.rotation.x = -1.5); girl1.position.y = 0.18; girl1.userData.arms.forEach((a, i) => { a.rotation.x = -1.1; a.rotation.z = (i ? -1 : 1) * 0.35; });
  girl1.position.x = -0.2 + Math.sin(t * 40) * 0.006; girl1.userData.head.rotation.x = 0.35;
  SNOW1.forEach((s, i) => { const p = s.userData.p; s.position.set(p[0] + Math.sin(t + i) * 0.1, 5 - ((p[1] + t * 0.6) % 5), p[2]); });
  const w = quiz ? 1 : clamp((t - 4.4) / 2.6);
  dad1.position.set(lerp(2.8, 1.3, ease(w)), 0, lerp(-3.8, -4.6, ease(w))); dad1.rotation.y = lerp(-1.4, -2.6, ease(w)); poseWalk(dad1, t * 5, !quiz && w > 0 && w < 1 ? 0.5 : 0);
  dad1.userData.arms[0].rotation.x = w >= 1 ? -1.0 : dad1.userData.arms[0].rotation.x;
  BREATH1.visible = !quiz; BREATH1.position.set(0.15, 0.95 + (t * 0.5 % 1) * 0.3, -5.3 + (t * 0.5 % 1) * 0.3); BREATH1.scale.setScalar(0.5 + (t * 0.5 % 1));
  Q1.position.set(0.45, 1.25, -5.4); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { tCold.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tCold.visible = false; tTake.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  const pan = quiz ? 0 : ease(clamp((t - 5.2) / 2.5)); tCold.position.x = tTake.position.x = 0.2 + pan * 0.6;
  look(lerp(0.7, 0.5, u) + pan * 0.4, lerp(1.7, 1.6, u) + pan * 0.2, lerp(-0.6, -1.4, u) + pan * 0.9, 0.1 + pan * 0.6, 1.0 + pan * 0.3, -5.4, 58);
  return qs;
}
function shotGap(t) { // 2段目 9〜17：高層ビルの谷間に、ぽつんと古い平屋。そこに家族5人がぎゅうぎゅうに暮らす
  base(); S.aim(AX, -8); lift(0); S.hemi.intensity = 1.0; S.darken(0.2, '#3a4250');
  FAM2.forEach((p, i) => { const k = ease(clamp((t - 4.2 - i * 0.25) / 0.5)); p.visible = k > 0; p.scale.setScalar(([1, 1, 0.74, 1, 0.9][i]) * Math.max(0.01, k)); p.rotation.y = 0; p.position.y = Math.abs(Math.sin(t * 3 + i)) * 0.05; });
  tGap.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tGap.visible = false; tFive.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.8, 0.0, u), lerp(1.8, 2.4, u), lerp(4.0, 2.4, u), AX, 4.2, -9, 66);
  return qs;
}
function shotTable(t) { // 3段目 17〜25：口は悪いけど、仲がいい。いつも笑いが絶えない
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.0;
  FAM3.forEach((p, i) => { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = -0.42 * (p.scale.x);
    p.userData.arms[i % 2].rotation.x = -0.9 - Math.abs(Math.sin(t * (t > 4 ? 6 : 3) + i * 1.3)) * 0.5; p.userData.head.rotation.z = t > 4 ? Math.sin(t * 7 + i) * 0.12 : 0; });
  STEAM3.forEach((s, i) => { const k = (t * 0.6 + i * 0.2) % 1; s.position.set(BX + Math.sin(i * 2 + t) * 0.1, 0.7 + k * 0.9, -2.4); s.scale.setScalar(0.6 + k); s.material.opacity = 0.5 * (1 - k); });
  tRough.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tRough.visible = false; tLaugh.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.4, 0.0, u), lerp(2.4, 2.2, u), lerp(2.2, 1.6, u), BX, 1.0, -2.8, 62);
  return qs;
}
function shotPension(t) { // 4段目 25〜33：生活の頼りは、おばあちゃんの年金。女の子も、家族の一員に
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.1;
  gran4.position.y = -0.38; gran4.userData.legs.forEach(l => l.rotation.x = -1.5); gran4.rotation.y = 0.3; gran4.userData.arms[1].rotation.x = -1.0;
  girl4.position.y = -0.24; girl4.userData.legs.forEach(l => l.rotation.x = -1.5); girl4.rotation.y = -0.4; girl4.userData.head.rotation.y = t > 4.2 ? -0.4 : 0;
  YEN4.forEach((c, i) => { const k = clamp((t - 0.8 - i * 0.3) / 0.6); c.visible = t < 4.2 && k > 0; c.position.set(CX - 0.3 + i * 0.12, 0.9 + k * 0.6 + Math.sin(t * 3 + i) * 0.03, -2.6); c.rotation.z = t * 3 + i; });
  const hk = ease(clamp((t - 4.6) / 0.5)); H4.visible = hk > 0; H4.scale.setScalar(hk * (1.4 + Math.sin(t * 6) * 0.15)); H4.position.set(CX + 0.05, 1.45, -2.7);
  tPension.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPension.visible = false; tFamily.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(2.0, 1.9, u), lerp(1.8, 1.2, u), CX, 1.1, -3.0, 60);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2018年の日本映画。監督は是枝裕和。カンヌ国際映画祭で最高賞
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  LEAF5.visible = false; LEAF5.rotation.y = Math.sin(t) * 0.3; LEAF5.position.y = 2.2 + Math.sin(t * 2) * 0.05;
  t2018.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2018.visible = false; tCannes.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.8, 6.0, u), TX, 4.0, -4.8, 68);
  return qs;
}
function shotShop(t) { // 6段目 42〜49（決め手）：足りない生活費は、お店の品物を…こっそり、かばんの中へ
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.0;
  dad6.rotation.y = 0.6; dad6.userData.head.rotation.y = Math.sin(t * 1.5) * 0.6; dad6.userData.arms[1].rotation.x = -0.3;
  boy6.rotation.y = Math.PI; boy6.userData.arms[0].rotation.x = t > 3.4 && t < 4.6 ? -1.6 : 0;
  const k = ease(clamp((t - 3.6) / 0.9));
  ITEM6.visible = k < 1; ITEM6.position.set(lerp(DX + 0.47 * 7 - 2.9 + 0.0, DX + 0.6, k), lerp(1.52, 0.95, k) + Math.sin(k * Math.PI) * 0.25, lerp(-4.0, -3.1, k));
  if (t < 3.6) tShop.userData.pop((t - 0.3) / 0.35); else tBag.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.3, u), lerp(2.0, 1.9, u), lerp(1.8, 1.2, u), DX - 0.2, 1.2, -3.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（冬の夜の団地に戻る）
  shotCold(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotCold(t, 0) },
  { a: 9, b: 17, f: shotGap },
  { a: 17, b: 25, f: shotTable },
  { a: 25, b: 33, f: shotPension },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotShop },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '寒い冬の夜。外で震える<br>小さな女の子。'],
  [5.6, 9.0, '見かねた男が、<br>家に連れて帰る。'],
  [9.2, 13.2, '高いビルの谷間に、<br>ぽつんと古い平屋。'],
  [13.2, 17.0, 'そこに家族が、<br>ぎゅうぎゅうに暮らす。'],
  [17.2, 21.0, '口は悪いけど、<br>みんな仲がいい。'],
  [21.0, 25.0, 'いつも、<br>笑いが絶えない。'],
  [25.2, 29.0, '生活の頼りは、<br>おばあちゃんの年金。'],
  [29.0, 33.0, '女の子も、<br>家族の一員として育てる。'],
  [33.2, 37.4, '2018年の日本映画。<br>監督は是枝裕和。'],
  [37.4, 41.8, 'カンヌ国際映画祭で、<br>最高賞を受賞。'],
  [42.2, 45.4, '足りない生活費は、<br>お店の品物を…'],
  [45.4, 49.0, 'こっそり、<br>かばんの中へ。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>万引き家族。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q108', v2: true, answer: '万引き家族',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 10810,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '万引き家族': 'まんびきかぞく', '寒い': 'さむい', '冬': 'ふゆ', '夜': 'よる', '外': 'そと', '震える': 'ふるえる', '小さな': 'ちいさな', '女の子': 'おんなのこ', '見かねた': 'みかねた', '男': 'おとこ', '家に': 'いえに', '連れて帰る': 'つれてかえる', '高い': 'たかい', '谷間': 'たにま', '古い': 'ふるい', '平屋': 'ひらや', '家族': 'かぞく', '暮らす': 'くらす', '口は悪い': 'くちはわるい', '仲': 'なか', '笑い': 'わらい', '絶えない': 'たえない', '生活の頼り': 'せいかつのたより', '年金': 'ねんきん', '一員': 'いちいん', '育てる': 'そだてる', '2018年': 'にせんじゅうはちねん', '日本映画': 'にほんえいが', '監督': 'かんとく', '是枝裕和': 'これえだひろかず', '国際映画祭': 'こくさいえいがさい', '最高賞': 'さいこうしょう', '受賞': 'じゅしょう', '足りない': 'たりない', '生活費': 'せいかつひ', '品物': 'しなもの', '中へ': 'なかへ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n寒い冬の夜。外で震える小さな女の子。見かねた男が、家に連れて帰る。高いビルの谷間に、ぽつんと古い平屋。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'U-NEXT', '映画好き', '邦画'],
  },
});
applyQuizCards({ answer: '万引き家族', info: 'FOD・U-NEXT｜映画・120分', answerSize: 136 });
