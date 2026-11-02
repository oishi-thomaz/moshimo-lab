import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #011 パラサイト 半地下の家族（映画・韓国・132分。Netflixで見放題、justwatch.com/jp/映画/parasaito-ban-di-xia-nojia-zu で2026/11/2確認。Filmarks 4.0 filmarks.com/movies/83796）
// 設定：全員失業中の4人家族が半地下の家で内職をして暮らす。長男は、名門大学に通う友人から、高台の豪邸に住むIT企業の社長の娘の家庭教師の仕事をゆずられる。
//       長男は妹を他人のふりをさせて、社長の息子の家庭教師に推薦。父と母もひとりずつ、その家で働くようになる（BSテレ東の番組紹介・クランクイン！の作品紹介）
// 結末と豪邸の秘密には触れない。作品の映像・ポスター・俳優・有名な場面の構図（階段・大雨・窓からの眺め）は使わない。家と人は汎用の3D

const S = quizStage({ bg: '#9fb0c4', floor: null, fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(1111);

const KIM = [
  { skin: '#e9c19c', hair: '#2a2421', shirt: '#6d6a5e', pants: '#3b3f4a' },              // 父
  { skin: '#efcfae', hair: '#1d1a19', shirt: '#8a5a4a', pants: '#3a3434', long: true },  // 母
  { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#4f6b8a', pants: '#2b3346' },              // 長男
  { skin: '#f1c9a5', hair: '#241c18', shirt: '#7a7f86', pants: '#2a2a30', long: true },  // 妹
];
const EARTH = mat('#6b5440'), EARTH_D = mat('#4f3d2e');

// ---------- 1. 半地下の家の断面（x=0）。地面は y=0、部屋の床は y=-1.6 ----------
const FY = -1.6;
const HOME = new THREE.Group(); qs.add(HOME);
{
  const l = box(10, 12, 3.0, EARTH); l.position.set(-7.6, -6, -0.7); HOME.add(l);
  const r = box(16, 12, 3.0, EARTH); r.position.set(10.6, -6, -0.7); HOME.add(r);
  const u = box(5.2, 10, 3.0, EARTH_D); u.position.set(0, FY - 5, -0.7); HOME.add(u);
  for (const [x, w] of [[-7.6, 10], [10.6, 16]]) { const top = box(w, 0.08, 3.0, mat('#8b8f96')); top.position.set(x, -0.04, -0.7); HOME.add(top); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), mat('#7d8288')); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -62.2); ground.receiveShadow = true; qs.add(ground);
  // 部屋（奥の壁・左右の壁・天井）
  const wall = mat('#b9ab8e');
  const back = box(5.2, 2.45, 0.12, wall); back.position.set(0, FY + 1.225, -2.14); HOME.add(back);
  const lw = box(0.14, 2.45, 3.0, wall); lw.position.set(-2.67, FY + 1.225, -0.7); HOME.add(lw);
  const rw = box(0.14, 2.45, 3.0, wall); rw.position.set(2.67, FY + 1.225, -0.7); HOME.add(rw);
  const ceil = box(5.5, 0.16, 3.0, mat('#8f8676')); ceil.position.set(0, FY + 2.53, -0.7); HOME.add(ceil);
  const fl = box(5.2, 0.06, 3.0, mat('#7a6a55')); fl.position.set(0, FY + 0.03, -0.7); HOME.add(fl);
  // 地面の上に出ている小さな窓（奥の壁の上のほう）
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshBasicMaterial({ color: '#cfe0ee' })); win.position.set(-0.6, 0.45, -2.07); HOME.add(win);
  for (const dx of [-0.9, 0, 0.9]) { const bar = box(0.05, 0.5, 0.04, mat('#3a3a3a')); bar.position.set(-0.6 + dx, 0.45, -2.05); HOME.add(bar); }
  // 部屋の中：低いテーブルと、内職の小さな箱の山
  const tb = box(1.7, 0.36, 0.9, mat('#5b4532')); tb.position.set(0.2, FY + 0.18, -0.9); HOME.add(tb);
  for (let i = 0; i < 9; i++) { const b = box(0.36, 0.06, 0.36, mat('#e8e2d2')); b.position.set(-0.3 + (i % 3) * 0.08, FY + 0.39 + i * 0.065, -0.95); b.rotation.y = R() * 0.3; HOME.add(b); }
  for (let i = 0; i < 4; i++) { const b = box(0.32, 0.22, 0.32, mat('#d9cfb6')); b.position.set(0.55 + (i % 2) * 0.36, FY + 0.47, -1.05 + Math.floor(i / 2) * 0.36); HOME.add(b); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); lamp.position.set(0.2, FY + 2.15, -0.9); HOME.add(lamp);
  const cord = box(0.02, 0.2, 0.02, mat('#222')); cord.position.set(0.2, FY + 2.33, -0.9); HOME.add(cord);
  for (let i = 0; i < 6; i++) { const s = box(0.5 + R() * 0.4, 0.3 + R() * 0.4, 0.4, mat(['#6a5a48', '#7c6c58', '#5a4c3e'][i % 3])); s.position.set(i < 3 ? -2.2 : 2.25, FY + 0.2 + (i % 3) * 0.42, -1.6 + (i % 3) * 0.1); HOME.add(s); }
}
const ROOML = new THREE.PointLight(0xffd59a, 7, 6, 1.4); ROOML.position.set(0.2, FY + 2.0, -0.4); qs.add(ROOML);
const FAM = KIM.map((o, i) => { const p = makePerson(o); const a = [[-0.95, -1.0, Math.PI / 2], [1.35, -1.0, -Math.PI / 2], [-0.2, -0.05, Math.PI], [0.65, -0.05, Math.PI]][i]; p.position.set(a[0], FY - 0.61, a[1]); p.rotation.y = a[2]; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms.forEach(a => a.rotation.x = -0.9); qs.add(p); return p; });
// 地面の高さを示す線
const GLINE = box(16, 0.05, 0.05, new THREE.MeshBasicMaterial({ color: '#e6b450' })); GLINE.position.set(0, 0.02, 0.85); qs.add(GLINE);
const tJobless = tag('全員失業中', { size: 84, bg: '#e2483c' }); tJobless.position.set(0.0, 1.35, 0.9); qs.add(tJobless);
const tGround = tag('ここが地面', { size: 54, w: 330, bg: '#e6b450', color: '#14161c' }); tGround.position.set(-1.75, -0.32, 0.9); qs.add(tGround);
// 歩道を歩く人（窓の高さに足だけ見える）
const WALK = [0, 1, 2].map(i => { const p = makePerson({ skin: '#efcfae', hair: ['#1d1a19', '#6b4a33', '#3a3030'][i], shirt: ['#2f4a7a', '#c8a24a', '#59606e'][i], pants: ['#22262f', '#3b3f4a', '#5a4a3a'][i] }); qs.add(p); return p; });
function walkers(T) { WALK.forEach((p, i) => { const s = ((T * 1.1 + i * 3.3) % 10) - 5; p.position.set(-1.6 + s * 1.3, 0, -2.75 - i * 0.45); p.rotation.y = Math.PI / 2; poseWalk(p, T * 7 + i, 1); p.position.y = 0; }); }

// ---------- 2. 高台の豪邸（家の右奥） ----------
const HILL = new THREE.Group(); HILL.position.set(9, 0, -22); qs.add(HILL);
const MANSION_WIN = [];
{
  const h = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 10, 6.5, 40), mat('#5f7a4e')); h.position.y = 3.25; h.receiveShadow = true; HILL.add(h);
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(7.5, 40), mat('#76a35a')); lawn.rotation.x = -Math.PI / 2; lawn.position.y = 6.51; HILL.add(lawn);
  const wallM = mat('#eceae4'), darkM = mat('#3d4046');
  const a = box(7.0, 2.2, 4.4, wallM); a.position.set(0, 7.6, -1.5); HILL.add(a);
  const b = box(5.0, 1.9, 3.8, darkM); b.position.set(0.9, 9.65, -1.8); HILL.add(b);
  const roof = box(7.6, 0.2, 5.0, wallM); roof.position.set(0, 8.75, -1.3); HILL.add(roof);
  const roof2 = box(5.6, 0.2, 4.4, wallM); roof2.position.set(0.9, 10.7, -1.6); HILL.add(roof2);
  for (const [x, y, w, hh, z] of [[-1.0, 7.55, 4.4, 1.6, 0.71], [2.4, 7.55, 1.6, 1.6, 0.71], [0.9, 9.65, 4.2, 1.3, 0.11]]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ color: '#ffe3a8' })); g.position.set(x, y, z); HILL.add(g); MANSION_WIN.push(g.material); }
  for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 10), mat('#3f6b3a')); const ang = -2.4 + i * 0.55; t.position.set(Math.cos(ang) * 6.2, 7.6, Math.sin(ang) * 5.6); t.castShadow = true; HILL.add(t); }
}
const tCEO = tag('IT企業の社長', { size: 72, w: 520, bg: '#e6b450', color: '#14161c' }); tCEO.position.set(7.75, 11.25, -12.7); qs.add(tCEO);
const HILLL = new THREE.PointLight(0xffd8a0, 0, 22, 1.1); HILLL.position.set(9, 9, -17); qs.add(HILLL);

// ---------- 3. 友だちから仕事をゆずられる（x=30） ----------
const STREET = new THREE.Group(); STREET.position.set(30, 0, 0); qs.add(STREET);
{
  const pave = box(14, 0.06, 8, mat('#8a8f96')); pave.position.set(0, 0.03, -1); STREET.add(pave);
  for (let i = 0; i < 4; i++) { const w = 2.6 + R(), h = 4 + R() * 3; const wt = windowTextures(60 + i, ['#b2a896', '#9aa2b2', '#a69c8a', '#8c94a2'][i]); wt.map.repeat.set(w / 1.4, h / 1.4); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), new THREE.MeshLambertMaterial({ map: wt.map })); b.position.set(-4.5 + i * 3.0, h / 2, -5); STREET.add(b); }
}
const son3 = makePerson(KIM[2]); son3.position.set(29.35, 0, 0.4); son3.rotation.y = 0.9; qs.add(son3);
const friend = makePerson({ skin: '#efcfae', hair: '#1d1a19', shirt: '#2a3d6a', pants: '#cfc7b4' }); friend.position.set(30.75, 0, 0.3); friend.rotation.y = -0.9; qs.add(friend);
const NOTE = new THREE.Group();
{ const tex = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#c4302b'; g.fillRect(0, 0, w, 70); g.fillStyle = '#fff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('英語', w / 2, 52); g.fillStyle = 'rgba(40,40,40,.35)'; for (let y = 110; y < 320; y += 34) g.fillRect(30, y, w - 60, 10); });
  const n = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.45, 0.04), [mat('#c4302b'), mat('#c4302b'), mat('#c4302b'), mat('#c4302b'), new THREE.MeshLambertMaterial({ map: tex }), mat('#c4302b')]); NOTE.add(n); }
qs.add(NOTE);
const tTutor = tag('家庭教師の仕事', { size: 66, w: 520, bg: '#e6b450', color: '#14161c' }); tTutor.position.set(30, 2.4, 0.3); qs.add(tTutor);

// ---------- 4〜5. 豪邸のリビング（x=60） ----------
const LIV = new THREE.Group(); LIV.position.set(60, 0, 0); qs.add(LIV);
{
  const fl = box(16, 0.08, 22, mat('#c9b48c')); fl.position.set(0, 0.04, 5.5); LIV.add(fl);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.6), new THREE.MeshBasicMaterial({ color: '#a9d48a' })); glass.position.set(0, 1.9, -5.3); LIV.add(glass);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.2), new THREE.MeshBasicMaterial({ color: '#cfe6f5' })); sky.position.set(0, 3.1, -5.28); LIV.add(sky);
  for (let i = 0; i < 6; i++) { const f = box(0.12, 3.8, 0.14, mat('#2e3034')); f.position.set(-6 + i * 2.4, 1.9, -5.2); LIV.add(f); }
  const top = box(14, 0.2, 0.3, mat('#2e3034')); top.position.set(0, 3.8, -5.2); LIV.add(top);
  const side = box(0.2, 3.9, 9, mat('#efede8')); side.position.set(-6.5, 1.95, -1); LIV.add(side);
  const sofa = box(3.0, 0.5, 0.9, mat('#e8e2d6')); sofa.position.set(2.4, 0.33, -2.6); LIV.add(sofa);
  const sb = box(3.0, 0.6, 0.22, mat('#e8e2d6')); sb.position.set(2.4, 0.75, -3.0); LIV.add(sb);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.8), mat('#8a7a6a')); rug.rotation.x = -Math.PI / 2; rug.position.set(2.2, 0.09, -1.2); LIV.add(rug);
  const desk = box(1.8, 0.75, 0.9, mat('#5b4532')); desk.position.set(-1.7, 0.38, -1.8); LIV.add(desk);
  const book = box(0.5, 0.04, 0.36, mat('#f4f1ea')); book.position.set(-1.7, 0.78, -1.7); LIV.add(book);
}
const SUN = new THREE.PointLight(0xfff2d0, 6, 14, 1.0); SUN.position.set(60, 3.4, -2); qs.add(SUN);
const PARKD = makePerson({ skin: '#f5d3b5', hair: '#3a2a20', shirt: '#e9e4da', pants: '#4a5a7a', long: true, skirt: true, scale: 0.88 }); PARKD.position.set(57.7, 0, -1.15); PARKD.rotation.y = 0.3; qs.add(PARKD);
const PARKS = makePerson({ skin: '#f5d3b5', hair: '#1d1a19', shirt: '#4fa3d1', pants: '#2b3346', scale: 0.66 }); PARKS.position.set(61.7, 0, -1.0); PARKS.rotation.y = -0.2; qs.add(PARKS);
const L_SON = makePerson(KIM[2]); qs.add(L_SON);
const L_SIS = makePerson(KIM[3]); qs.add(L_SIS);
const L_DAD = makePerson({ ...KIM[0], shirt: '#2b3040', tie: true }); qs.add(L_DAD);
const L_MOM = makePerson({ ...KIM[1], shirt: '#e9e4da' }); qs.add(L_MOM);
const tFake = tag('他人のふり', { size: 72, w: 420, bg: '#e2483c' }); qs.add(tFake);
const NAME = ['長男', '妹', '父', '母'];
const KTAG = NAME.map((n, i) => { const t = tag(n, { size: 70, w: 230, bg: '#e6b450', color: '#14161c' }); qs.add(t); return t; });
const POS4 = [[57.9, -0.8], [61.8, -0.4], [59.4, 0.9], [63.6, 0.6]];

// ---------- shots ----------
const ALL = [tJobless, tGround, tCEO, tTutor, tFake, ...KTAG];
function base() { S.reset(); WALK.forEach(p => p.visible = true); [L_SON, L_SIS, L_DAD, L_MOM].forEach(p => p.visible = false); ALL.forEach(x => x.visible = false); GLINE.visible = false; ROOML.intensity = 7; HILLL.intensity = 0; MANSION_WIN.forEach(m => m.color.set('#ffe3a8')); NOTE.visible = false; }

function shotHome(t, T) { // 0〜9：半地下の家の断面と、高台の豪邸（0秒目がサムネ）
  base(); S.aim(2, -6); lift(0);
  walkers(T);
  FAM.forEach((p, i) => { p.userData.arms.forEach((a, k) => a.rotation.x = -0.9 + Math.sin(T * 3 + i + k) * 0.12); });
  tJobless.userData.pop((T - 2.8) / 0.35); if (T > 5.6) tJobless.visible = false;
  GLINE.visible = T > 5.6; GLINE.scale.x = Math.max(0.01, easeOut(clamp((T - 5.6) / 0.6)));
  tGround.userData.pop((T - 6.3) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.6, 0.4, u), lerp(2.6, 2.3, u), lerp(13.5, 12.2, u), lerp(1.2, 1.0, u), lerp(5.4, 5.0, u), -6, 56);
  return qs;
}
function shotHill(t) { // 9〜17：高台の豪邸へ
  base(); S.aim(9, -20); lift(0);
  walkers(9 + t); WALK.forEach(p => p.visible = t < 1.2);
  const u = ease(t / 8);
  look(lerp(0.4, 6.5, u), lerp(2.3, 10.5, u), lerp(12.2, -6.5, u), lerp(1.0, 9, u), lerp(5.0, 8.6, u), lerp(-6, -22, u), 56);
  tCEO.userData.pop((t - 4.4) / 0.35);
  return qs;
}
function shotFriend(t) { // 17〜25：友だちから家庭教師の仕事をゆずられる
  base(); S.aim(30, 0); lift(60);
  const k = ease((t - 1.0) / 1.6);
  NOTE.visible = true; NOTE.position.set(lerp(30.45, 29.75, k), 1.12 + Math.sin(k * Math.PI) * 0.15, 0.62); NOTE.rotation.set(-0.3, lerp(-0.6, 0.6, k), 0);
  friend.userData.arms[0].rotation.x = lerp(-1.2, -0.2, ease((t - 2.6) / 0.6)); son3.userData.arms[1].rotation.x = lerp(-0.2, -1.2, k);
  tTutor.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(30.7, 30.1, u), lerp(1.9, 1.8, u), lerp(6.4, 5.6, u), 30, 1.45, 0, 54);
  return qs;
}
function placeKim(sisIn, dadIn, momIn) {
  L_SON.visible = true;
  L_SON.position.set(59.2, 0, -1.2); L_SON.rotation.y = -0.6;
  L_SIS.visible = sisIn > 0; L_SIS.position.set(lerp(66.0, 62.5, sisIn), 0, -0.6); L_SIS.rotation.y = -Math.PI / 2 * (1 - sisIn) - 0.4 * sisIn; poseWalk(L_SIS, sisIn * 18, sisIn < 1 ? 1 : 0); L_SIS.position.y = 0;
  L_DAD.visible = dadIn > 0; L_DAD.position.set(lerp(66.0, 60.0, dadIn), 0, 0.7); L_DAD.rotation.y = dadIn < 1 ? -Math.PI / 2 : 0; poseWalk(L_DAD, dadIn * 22, dadIn < 1 ? 1 : 0); L_DAD.position.y = 0;
  L_MOM.visible = momIn > 0; L_MOM.position.set(lerp(66.0, 61.3, momIn), 0, 0.9); L_MOM.rotation.y = momIn < 1 ? -Math.PI / 2 : -0.3; poseWalk(L_MOM, momIn * 18, momIn < 1 ? 1 : 0); L_MOM.position.y = 0;
}
function shotSister(t) { // 25〜33：妹を他人のふりをさせて、息子の家庭教師に
  base(); S.aim(60, -1); lift(150);
  placeKim(ease((t - 0.6) / 2.6), 0, 0);
  tFake.position.set(Math.min(L_SIS.position.x, 61.9), 2.45, L_SIS.position.z); tFake.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(60.3, 60.5, u), lerp(3.0, 2.8, u), lerp(8.8, 8.2, u), 60.4, 1.1, -0.8, 54);
  return qs;
}
function shotAll(t) { // 33〜42：父も母もひとりずつ。一家全員が豪邸で
  base(); S.aim(60, -1); lift(170);
  placeKim(1, ease((t - 0.5) / 2.2), ease((t - 2.6) / 2.0));
  const P = [L_SON, L_SIS, L_DAD, L_MOM];
  KTAG.forEach((tg, i) => { tg.position.set(P[i].position.x, [2.45, 2.45, 2.25, 2.25][i], P[i].position.z); tg.userData.pop((t - 4.6 - i * 0.3) / 0.35); });
  const u = ease(t / 9);
  look(lerp(60.2, 60.3, u), lerp(3.6, 4.4, u), lerp(9.0, 10.0, u), 60.3, 1.0, -0.4, 54);
  return qs;
}
const DARK = '#070a12';
function night(d) {
  S.hemi.intensity = lerp(1.25, 0.16, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  HILLL.intensity = 30 * d; ROOML.intensity = 7;
}
function shotTwist(t) { // 42〜49：夜。高台の豪邸から、ふもとの半地下へ
  base(); S.aim(4, -10); lift(0);
  night(ease(t / 1.3));
  WALK.forEach(p => p.visible = false);
  const k = ease(t / 7);
  look(lerp(7.0, 4.5, k), lerp(11.5, 6.0, k), lerp(-7.0, 12.0, k), lerp(9, 3, k), lerp(8.6, 2.6, k), lerp(-22, -9, k), 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画わかった？
  base(); S.aim(4, -10); lift(0);
  night(1);
  WALK.forEach(p => p.visible = false);
  const k = ease(t / 7);
  look(lerp(4.5, 1.4, k), lerp(6.0, 5.4, k), lerp(12.0, 15.5, k), lerp(3, 2.8, k), lerp(2.6, 4.2, k), lerp(-9, -10, k), 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotHome(t, T) },
  { a: 9, b: 17, f: shotHill },
  { a: 17, b: 25, f: shotFriend },
  { a: 25, b: 33, f: shotSister },
  { a: 33, b: 42, f: shotAll },
  { a: 42, b: 49, f: shotTwist },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '家族4人、<br>全員が失業中。'],
  [5.6, 9.0, '暮らしているのは、<br>半地下の家。'],
  [9.2, 13.2, '一方、高台の<br>大きな豪邸には'],
  [13.2, 17.0, 'IT企業の<br>社長一家。'],
  [17.2, 21.0, '長男が友だちから<br>ゆずられたのは、'],
  [21.0, 25.0, 'その豪邸の娘の、<br>家庭教師の仕事。'],
  [25.2, 29.0, '次は妹に、<br>他人のふりをさせて'],
  [29.0, 33.0, 'あの家の息子の<br>家庭教師に推薦。'],
  [33.2, 37.4, 'さらに父も、母も、<br>ひとりずつ。'],
  [37.4, 41.8, '気づけば一家全員が、<br>豪邸で働いていた。'],
  [42.2, 45.4, 'でも、この計画は'],
  [45.4, 49.0, '誰も予想しない<br>方向へ転がり出す。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、パラサイト<br>半地下の家族。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotFriend || f === shotSister || f === shotAll,
  meta: {
    id: 'q011', v2: true, answer: 'パラサイト 半地下の家族',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 1111,
    hits: [5.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 3.0, 37.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '4人': 'よにん', '失業中': 'しつぎょうちゅう', '暮らして': 'くらして', '半地下': 'はんちか', '一方': 'いっぽう', '高台': 'たかだい', '豪邸': 'ごうてい', 'IT企業': 'アイティーきぎょう', '社長一家': 'しゃちょういっか', '長男': 'ちょうなん', '友だち': 'ともだち', '家庭教師': 'かていきょうし', '他人': 'たにん', '推薦': 'すいせん', '一家全員': 'いっかぜんいん', '働いて': 'はたらいて', '計画': 'けいかく', '誰も': 'だれも', '予想': 'よそう', '方向': 'ほうこう', '転がり出す': 'ころがりだす', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう' },
    caption: 'この映画のタイトル、わかる？\n家族4人、全員が失業中。暮らしているのは半地下の家。長男が友だちからゆずられたのは、高台の豪邸に住むIT企業の社長の娘の家庭教師の仕事だった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国映画', '名作映画'],
  },
});
applyQuizCards({ answer: 'パラサイト<br><span style="font-size:76px">半地下の家族</span>', info: 'Netflix｜韓国映画・132分', answerSize: 112 });
