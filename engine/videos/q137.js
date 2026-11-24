import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #137 容疑者Xの献身（映画・日本・2008年製作・128分。FOD・Prime Video で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/rong-yi-zhe-xnoxian-shen（見放題：Prime Video・FOD・Hulu・Netflix・U-NEXT）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・DMM TV・FOD・Lemino・Hulu・Netflix 見放題。2026年10月更新）で2026/11/24確認。
//   Filmarks 3.9・レビュー161,725件 filmarks.com/movies/16236）
// 確かめた事実（2026/11/24）：
//   ・映画.com eiga.com/movie/53307 ：2008年製作／128分／日本。05年に直木賞を受賞した東野圭吾の人気ミステリー「探偵ガリレオ」シリーズ第3作を、
//     TVドラマ「ガリレオ」のスタッフ・キャストで映画化。殺人事件が発生し、刑事は天才物理学者に助けを求める。
//     被害者の元妻の隣人として捜査線上に浮かんだのは、物理学者の大学時代の友人で天才数学者だった
//   ・JustWatch 日本版の紹介文：男の死体が発見された。刑事は弁当屋を営む被害者の元妻を訪ねる。だが有力容疑者と思われた彼女には完璧なアリバイがあった。
//     捜査に行き詰まった刑事は大学の物理学者に協力を求める。物理学者は、元妻の隣人が学生時代に数学の天才と認めた親友であることを知る
//   ・Netflix 作品ページ netflix.com/jp/title/70119194 ：警察は犯人逮捕の糸口を求めて、明晰な頭脳を持つ物理学者に協力を頼む
// 構成（ヒント6段）：1 ひとりの男が遺体で見つかる・疑われたのは別れた妻 → 2 主人公は大学の天才物理学者・刑事から事件の相談がくる
//   → 3 別れた妻は小さな弁当屋・でも彼女には完璧なアリバイ → 4 となりに住むのは主人公の学生時代の親友・数学の天才と認めた男
//   → 5 2008年の日本映画・原作は直木賞を受賞したミステリー小説 → 6 決め手：天才物理学者と天才数学者の頭脳戦・あの人気ドラマの映画版
// 犯人・トリック・結末は言わない。遺体の姿・傷は見せない（警察の車と白い布だけ）。登場人物の名前・地名・店の名前は出さない。
// 俳優の顔・ポスター・ロゴは使わない。有名な場面の構図（数式を書きなぐる場面など）はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#1c2230', floor: '#2a2e36', fogNear: 18, fogFar: 75 });
const qs = S.scene;
const R = rng(13710);

const PROF = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#e8e8ec', pants: '#2a2e3a' };
const COP = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#2a2a34', pants: '#2a2a34', long: true };
const COP2 = { skin: '#e8b890', hair: '#1a1410', shirt: '#4a4a52', pants: '#2a2a30', tie: true };
const WOMAN = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#c8a8a0', pants: '#4a4048', long: true, skirt: true };
const NEIGH = { skin: '#e0b090', hair: '#2a2420', shirt: '#5a5a50', pants: '#3a3a36', bald: false };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function chalkTex(seed, w = 512, h = 256) { const r = rng(seed); return canvasTex(w, h, (g) => { g.fillStyle = '#24402e'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(240,240,230,.85)'; g.lineWidth = 3;
  for (let row = 0; row < 6; row++) { let x = 20 + r() * 30; const y = 30 + row * 38; while (x < w - 40) { const k = r(); g.beginPath();
    if (k < 0.3) { g.arc(x + 8, y, 8, 0, 6.3); x += 26; } else if (k < 0.55) { g.moveTo(x, y + 8); g.lineTo(x + 14, y - 8); g.moveTo(x, y - 8); g.lineTo(x + 14, y + 8); x += 24; }
    else if (k < 0.75) { g.moveTo(x, y); g.lineTo(x + 18, y); g.moveTo(x, y + 6); g.lineTo(x + 18, y + 6); x += 28; } else { g.moveTo(x, y + 10); g.quadraticCurveTo(x + 10, y - 16, x + 20, y + 10); x += 30; } g.stroke(); } } }); }

// ---------- 1段目. 夜の川べり（x=0）。止まったパトカーの赤い光、草むらの白い布、手帳を持つ刑事たち ----------
{ const gr = box(30, 0.04, 20, mat('#2a3428')); gr.position.set(0, 0.02, -4); qs.add(gr);
  const rv = box(30, 0.03, 8, mat('#1a2a3a')); rv.position.set(0, 0.03, -12); qs.add(rv);
  const bk = box(30, 1.2, 3, mat('#3a4434')); bk.position.set(0, 0.3, 4); bk.rotation.x = 0.3; qs.add(bk);
  const br = box(30, 0.5, 2, mat('#4a4a50')); br.position.set(0, 4, -18); qs.add(br); for (let i = 0; i < 5; i++) { const p = box(0.6, 4, 0.6, mat('#4a4a50')); p.position.set(-12 + i * 6, 2, -18); qs.add(p); }
  for (let i = 0; i < 30; i++) { const g = box(0.06, 0.3 + R() * 0.3, 0.06, mat('#4a5a3a')); g.position.set(-6 + R() * 12, 0.2, -1 - R() * 7); qs.add(g); } }
const CAR1 = new THREE.Group(); { const b = box(1.8, 0.7, 4.0, mat('#e8e8ec')); b.position.y = 0.6; CAR1.add(b); const t = box(1.6, 0.6, 2.0, mat('#1a1a20')); t.position.set(0, 1.25, -0.2); CAR1.add(t);
  const lo = box(1.82, 0.36, 4.02, mat('#1a1a20')); lo.position.y = 0.45; CAR1.add(lo); for (const z of [-1.3, 1.3]) for (const x of [-0.9, 0.9]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 14), mat('#101012')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); CAR1.add(w); } }
CAR1.position.set(-3.2, 0, -4.6); CAR1.rotation.y = 0.5; qs.add(CAR1);
const SIREN1 = box(0.7, 0.14, 0.24, gl('#ff2a2a')); SIREN1.position.set(0, 1.62, -0.2); CAR1.add(SIREN1);
const RED1 = new THREE.PointLight('#ff3030', 5, 10); RED1.position.set(-3.0, 2.2, -4.0); qs.add(RED1);
const SHEET1 = box(1.5, 0.16, 0.7, mat('#e8e8e4')); SHEET1.position.set(0.6, 0.1, -4.4); SHEET1.rotation.y = 0.2; qs.add(SHEET1);
const COPS1 = [person(COP2, 1.9, -3.6, -1.2), person(COP, -0.6, -3.2, 1.0), person(COP2, 1.4, -5.6, -2.4)];
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tFound = tag('ひとりの男が、遺体で見つかる', { size: 50, w: 800, bg: '#14161c', sx: 1.85 }); qs.add(tFound);
const tWife = tag('疑われたのは、別れた妻', { size: 54, w: 680, bg: '#e24050', sx: 1.7 }); qs.add(tWife);

// ---------- 2段目. 大学の研究室（x=50）。黒板いっぱいの数式、実験の装置、白いシャツの物理学者と、たずねてきた刑事 ----------
const AX = 50;
{ const fl = box(12, 0.04, 10, mat('#5a5048')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const wl = box(12, 4.4, 0.3, mat('#8a8a84')); wl.position.set(AX, 2.2, -6.5); qs.add(wl);
  const wn = box(3, 2, 0.05, gl('#9ab8d8')); wn.position.set(AX + 3.6, 2.4, -6.3); qs.add(wn);
  const dk = box(2.6, 0.08, 1.2, mat('#6a5a48')); dk.position.set(AX + 2.2, 0.9, -3.6); qs.add(dk); const dl = box(2.4, 0.86, 1.0, mat('#4a4038')); dl.position.set(AX + 2.2, 0.43, -3.6); qs.add(dl);
  for (let i = 0; i < 4; i++) { const fk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.34, 10), new THREE.MeshStandardMaterial({ color: ['#8ad8e8', '#e8d08a', '#a8e88a', '#e89aa8'][i], transparent: true, opacity: 0.8 })); fk.position.set(AX + 1.4 + i * 0.5, 1.11, -3.5); qs.add(fk); }
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 20), mat('#c88a40')); coil.position.set(AX + 3.1, 1.3, -3.7); qs.add(coil); }
const BOARD2 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshLambertMaterial({ map: chalkTex(2) })); BOARD2.position.set(AX - 1.2, 2.3, -6.3); qs.add(BOARD2);
{ const fr = box(4.4, 2.3, 0.08, mat('#6a4a30')); fr.position.set(AX - 1.2, 2.3, -6.36); qs.add(fr); }
const PROF2 = person(PROF, AX - 0.6, -4.6, 0.3);
const COP2b = person(COP, AX + 1.1, -2.2, Math.PI + 0.6);
const tProf = tag('主人公は、大学の天才物理学者', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tProf);
const tAsk = tag('刑事から、事件の相談がくる', { size: 50, w: 760, bg: '#e24050', sx: 1.75 }); qs.add(tAsk);

// ---------- 3段目. 夕方の下町（x=100）。小さなお弁当屋さんのカウンター。店の女性 ----------
const BX = 100;
{ const gr = box(30, 0.04, 20, mat('#6a6460')); gr.position.set(BX, 0.02, -4); qs.add(gr);
  for (let i = 0; i < 5; i++) { if (i === 2) continue; const h = box(3.2, 3.4 + R() * 1.2, 3, mat(['#a89880', '#8a8070', '#b8a890'][i % 3])); h.position.set(BX - 7 + i * 3.5, 1.8, -7); qs.add(h); }
  const sh = box(3.4, 3.2, 3, mat('#e8dcc8')); sh.position.set(BX, 1.6, -7); qs.add(sh);
  const aw = box(3.6, 0.12, 1.2, mat('#c84a3a')); aw.position.set(BX, 2.6, -5.1); aw.rotation.x = 0.25; qs.add(aw);
  const ct = box(3.0, 1.0, 0.6, mat('#d8c8a8')); ct.position.set(BX, 0.5, -4.6); qs.add(ct);
  const gw = box(2.8, 0.5, 0.5, new THREE.MeshStandardMaterial({ color: '#c8e0e8', transparent: true, opacity: 0.5 })); gw.position.set(BX, 1.25, -4.6); qs.add(gw);
  for (let i = 0; i < 6; i++) { const bx = box(0.34, 0.1, 0.24, mat(['#2a2a2a', '#c84a3a'][i % 2])); bx.position.set(BX - 1.0 + i * 0.4, 1.06, -4.6); qs.add(bx); const fd = box(0.28, 0.04, 0.18, mat(['#e8c860', '#e8e0d0', '#8ab060'][i % 3])); fd.position.set(BX - 1.0 + i * 0.4, 1.13, -4.6); qs.add(fd); }
  const lan = new THREE.PointLight('#ffd8a0', 3, 7); lan.position.set(BX, 2.2, -4.2); qs.add(lan);
  for (let i = 0; i < 4; i++) { const pl = box(0.16, 5, 0.16, mat('#6a6058')); pl.position.set(BX - 6 + i * 4.5, 2.5, -4.2); qs.add(pl); } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ fog: false, color: '#e8a878' })); SKY3.position.set(BX, 12, -40); qs.add(SKY3);
const WOMAN3 = person(WOMAN, BX + 0.3, -5.2, 0);
const tShop = tag('別れた妻は、小さな弁当屋', { size: 52, w: 720, bg: '#14161c', sx: 1.75 }); qs.add(tShop);
const tAlibi = tag('でも、完璧なアリバイ', { size: 56, w: 640, bg: '#e24050', sx: 1.6 }); qs.add(tAlibi);

// ---------- 4段目. 夜のアパートの外廊下（x=150）。となりあう2つのドア。となりの部屋の前に立つ男 ----------
const CX = 150;
{ const fl = box(12, 0.1, 2.4, mat('#7a7670')); fl.position.set(CX, 2.0, -3); qs.add(fl);
  const wl = box(12, 2.8, 0.3, mat('#b8b0a0')); wl.position.set(CX, 3.4, -4.3); qs.add(wl);
  const rl = box(12, 1.0, 0.1, mat('#6a6a6a')); rl.position.set(CX, 2.55, -1.8); qs.add(rl);
  const gr = box(30, 0.04, 20, mat('#2a2c30')); gr.position.set(CX, 0.02, -2); qs.add(gr);
  for (let i = 0; i < 4; i++) { const p = box(0.3, 2, 0.3, mat('#5a5a5a')); p.position.set(CX - 5 + i * 3.4, 1.0, -1.9); qs.add(p); }
  for (let i = 0; i < 3; i++) { const dr = box(1.0, 2.0, 0.08, mat(['#6a5a4a', '#5a5a6a', '#6a5a4a'][i])); dr.position.set(CX - 3 + i * 3, 3.05, -4.1); qs.add(dr);
    const kn = box(0.08, 0.08, 0.08, mat('#c8b060')); kn.position.set(CX - 3 + i * 3 + 0.36, 3.0, -4.04); qs.add(kn);
    const lp = box(0.3, 0.12, 0.12, gl('#fff0c8')); lp.position.set(CX - 3 + i * 3 - 0.9, 4.2, -4.1); qs.add(lp); }
  const l4 = new THREE.PointLight('#fff0c8', 3, 8); l4.position.set(CX, 4.2, -3.0); qs.add(l4); }
const NEIGH4 = person(NEIGH, CX + 0.1, -3.6, Math.PI / 2 + 0.6, 2.05);
const PROF4 = person(PROF, CX - 2.4, -2.9, Math.PI / 2, 2.05);
const tNext = tag('となりの部屋に住むのは…', { size: 54, w: 700, bg: '#14161c', sx: 1.7 }); qs.add(tNext);
const tFriend = tag('主人公の、学生時代の親友', { size: 52, w: 720, bg: '#e24050', sx: 1.75 }); qs.add(tFriend);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーンと、ならんだ赤い座席 ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#8a1a24')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#7a1620')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#6a7a9a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const SL5 = new THREE.PointLight('#c8d8ff', 3, 14); SL5.position.set(DX, 3, -5); qs.add(SL5);
const t2008 = tag('2008年の、日本映画', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 1.6 }); qs.add(t2008);
const tNovel = tag('原作は、直木賞を受賞したミステリー', { size: 44, w: 900, bg: '#e24050', sx: 2.0 }); qs.add(tNovel);

// ---------- 6段目. 夜の大きな黒板の前（x=250）。左右に向かいあう2人。数式の線が光る ----------
const EX = 250;
{ const fl = box(14, 0.04, 10, mat('#2a2622')); fl.position.set(EX, 0.02, -2); qs.add(fl); }
const BOARD6 = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), new THREE.MeshBasicMaterial({ map: chalkTex(6, 1024, 384) })); BOARD6.position.set(EX, 2.6, -5); qs.add(BOARD6);
{ const fr = box(9.3, 3.7, 0.1, mat('#5a4030')); fr.position.set(EX, 2.6, -5.08); qs.add(fr); }
const PROF6 = person(PROF, EX - 1.6, -2.6, Math.PI / 2 - 0.3);
const MATH6 = person(NEIGH, EX + 1.6, -2.6, -Math.PI / 2 + 0.3);
const ARC6 = []; for (let i = 0; i < 24; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), gl('#ffe8a0')); qs.add(d); ARC6.push(d); }
const tDuel = tag('天才物理学者と、天才数学者', { size: 50, w: 780, bg: '#14161c', sx: 1.8 }); qs.add(tDuel);
const tDrama = tag('あの人気ドラマの、映画版', { size: 52, w: 720, bg: '#e6b450', color: '#14161c', sx: 1.75 }); qs.add(tDrama);

// ---------- shots ----------
const ALL = [tFound, tWife, tProf, tAsk, tShop, tAlibi, tNext, tFriend, t2008, tNovel, tDuel, tDrama, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SKY3.visible = false; }

function shotRiver(t, quiz = 0) { // 1段目 0〜9：ある日、ひとりの男が遺体で見つかる。疑われたのは、男の別れた妻（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.85; S.key.intensity = 0.6; S.key.color.set('#a8b8e0'); S.darken(0.5, '#04060a');
  const on = Math.sin(t * 9) > 0; RED1.intensity = on ? 6 : 1.5; SIREN1.material.color.set(on ? '#ff2a2a' : '#5a1010');
  COPS1[0].userData.head.rotation.x = 0.4; COPS1[1].userData.head.rotation.x = 0.3; COPS1[0].userData.arms[1].rotation.x = -1.0;
  const u = ease(t / 9);
  look(lerp(2.8, 2.2, u), lerp(2.4, 2.1, u), lerp(1.4, 0.4, u), 0.2, 0.8, -4.4, 62);
  Q1.position.set(0.6, 1.3, -4.4); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tFound, 1.05); pin(tWife, 1.05);
  if (!quiz) { tFound.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tFound.visible = false; tWife.userData.pop((t - 5.5) / 0.35); }
  return qs;
}
function shotLab(t) { // 2段目 9〜17：主人公は、大学の天才物理学者。刑事から、事件の相談がくる
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 1.0;
  PROF2.userData.arms[1].rotation.x = t < 4.2 ? -2.4 + Math.sin(t * 5) * 0.2 : -0.2;
  PROF2.rotation.y = t < 4.2 ? Math.PI : lerp(Math.PI, 0.6, clamp((t - 4.2) / 0.8));
  const k = clamp((t - 3.6) / 2.4); COP2b.position.z = -2.2 - k * 1.0; poseWalk(COP2b, t * 6, k > 0 && k < 1 ? 0.8 : 0);
  const u = ease(t / 8);
  look(AX + lerp(2.6, 2.2, u), lerp(2.0, 1.9, u), lerp(1.6, 0.9, u), AX - 0.6, 1.6, -4.6, 62);
  pin(tProf, 1.05); pin(tAsk, 1.05);
  tProf.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tProf.visible = false; tAsk.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotShop(t) { // 3段目 17〜25：別れた妻は、小さな弁当屋を営んでいる。でも彼女には、完璧なアリバイがあった
  base(); SKY3.visible = true; S.aim(BX, -5); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.8; S.key.color.set('#ffc898'); S.scene.background.set('#e8a878'); S.scene.fog.color.set('#c89878');
  WOMAN3.userData.arms.forEach(a => a.rotation.x = -0.7); WOMAN3.userData.head.rotation.x = t < 4.2 ? 0.3 : -0.05;
  const u = ease(t / 8);
  look(BX + lerp(-0.6, 0.2, u), lerp(1.9, 1.8, u), lerp(-0.2, -1.4, u), BX + 0.2, 1.45, -5.2, 62);
  pin(tShop, 1.05); pin(tAlibi, 1.05);
  tShop.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tShop.visible = false; tAlibi.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotHall(t) { // 4段目 25〜33：彼女のとなりに住むのは、主人公の学生時代の親友。数学の天才と認めた男だった
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.55, '#04050a');
  const k = clamp((t - 0.6) / 3.2); PROF4.position.x = CX - 3.4 + k * 2.2; poseWalk(PROF4, t * 6, k > 0 && k < 1 ? 0.8 : 0); PROF4.position.y = 2.05 + (PROF4.position.y || 0) * 0;
  NEIGH4.rotation.y = t > 4.2 ? -Math.PI / 2 + 0.2 : Math.PI / 2 + 0.6; NEIGH4.userData.head.rotation.x = 0.15;
  const u = ease(t / 8);
  look(CX + lerp(0.4, 0.0, u), lerp(3.9, 3.8, u), lerp(2.0, 1.2, u), CX - 0.6, 3.5, -3.6, 62);
  pin(tNext, 1.05); pin(tFriend, 1.05);
  tNext.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNext.visible = false; tFriend.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2008年の、日本映画。原作は、直木賞を受賞したミステリー小説
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCREEN5.material.color.setHSL(0.6, 0.22, 0.42 + Math.sin(t * 2.3) * 0.06);
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.6, 2.4, u), lerp(3.6, 2.8, u), DX, 2.0, -6, 62);
  pin(t2008, 1.05); pin(tNovel, 1.05);
  t2008.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2008.visible = false; tNovel.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotDuel(t) { // 6段目 42〜49（決め手）：天才物理学者と、天才数学者の頭脳戦。あの人気ドラマの、映画版
  base(); S.aim(EX, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5; S.darken(0.6, '#030304');
  ARC6.forEach((d, i) => { const k = ((i / ARC6.length) + t * 0.25) % 1; d.position.set(EX - 1.4 + k * 2.8, 2.0 + Math.sin(k * Math.PI) * 0.9, -2.6); d.visible = t > 0.4; });
  PROF6.userData.head.rotation.x = -0.1; MATH6.userData.head.rotation.x = 0.1;
  const u = ease(t / 7);
  look(EX + lerp(0.3, 0.0, u), lerp(2.3, 2.2, u), lerp(4.4, 3.4, u), EX, 1.6, -3.4, 62);
  pin(tDuel, 1.05); pin(tDrama, 1.05);
  if (t < 3.6) tDuel.userData.pop((t - 0.3) / 0.35); else tDrama.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の川べりに戻る）
  shotRiver(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRiver(t, 0) },
  { a: 9, b: 17, f: shotLab },
  { a: 17, b: 25, f: shotShop },
  { a: 25, b: 33, f: shotHall },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotDuel },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、ひとりの男が<br>遺体で見つかる。'],
  [5.6, 9.0, '疑われたのは、<br>男の別れた妻。'],
  [9.2, 13.2, '主人公は、大学の<br>天才物理学者。'],
  [13.2, 17.0, '刑事から、<br>事件の相談がくる。'],
  [17.2, 21.0, '別れた妻は、小さな<br>弁当屋を営んでいる。'],
  [21.0, 25.0, 'でも彼女には、<br>完璧なアリバイがあった。'],
  [25.2, 29.0, '彼女のとなりに住むのは、<br>主人公の学生時代の親友。'],
  [29.0, 33.0, '数学の天才と<br>認めた男だった。'],
  [33.2, 37.4, '2008年の、<br>日本映画。'],
  [37.4, 41.8, '原作は、直木賞を受賞した<br>ミステリー小説。'],
  [42.2, 45.4, '天才物理学者と、<br>天才数学者の頭脳戦。'],
  [45.4, 49.0, 'あの人気ドラマの、<br>映画版。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>容疑者Xの献身。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q137', v2: true, answer: '容疑者Xの献身',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 13710,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'alarm', 0.3], [5.6, 'drone', 0.4], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'drone', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '2008年': 'にせんはちねん', '見つかる': 'みつかる', '疑われた': 'うたがわれた', '物理学者': 'ぶつりがくしゃ', '学生時代': 'がくせいじだい', '日本映画': 'にほんえいが', '容疑者X': 'ようぎしゃエックス', '聞かせて': 'きかせて', '別れた': 'わかれた', '主人公': 'しゅじんこう', '小さな': 'ちいさな', '弁当屋': 'べんとうや', '営んで': 'いとなんで', '認めた': 'みとめた', '直木賞': 'なおきしょう', '数学者': 'すうがくしゃ', '頭脳戦': 'ずのうせん', '映画版': 'えいがばん', '当てて': 'あてて', '遺体': 'いたい', '大学': 'だいがく', '天才': 'てんさい', '刑事': 'けいじ', '事件': 'じけん', '相談': 'そうだん', '彼女': 'かのじょ', '完璧': 'かんぺき', '住む': 'すむ', '親友': 'しんゆう', '数学': 'すうがく', '原作': 'げんさく', '受賞': 'じゅしょう', '小説': 'しょうせつ', '人気': 'にんき', '間に': 'あいだに', '答え': 'こたえ', '献身': 'けんしん', '何秒': 'なんびょう', '感想': 'かんそう', '男': 'おとこ', '妻': 'つま' },
    caption: 'この映画のタイトル、わかる？\nある日、ひとりの男が遺体で見つかる。疑われたのは、男の別れた妻。主人公は、大学の天才物理学者。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'PrimeVideo', '映画好き', '邦画'],
  },
});
applyQuizCards({ answer: '容疑者Xの献身', info: 'FOD・Prime Video｜映画・128分', answerSize: 128 });
