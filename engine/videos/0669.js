import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしもお世辞が全部本音で聞こえたら？（皮肉回・台本 S64・図星／大人の本音）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。元ネタ：ガルちゃん「若作りおばさんあるある」https://girlschannel.net/topics/6327859/（2026/11/05）
// 数字は使わない。見た目を笑う絵にはしない（おそろいの服は ふつうのワンピース。顔や体型をいじらない）。お世辞の言葉が裏返る三段で落とす。学校・店・会社は架空

const S = new THREE.Scene();
S.background = new THREE.Color('#a8cce8'); S.fog = new THREE.Fog(0xa8cce8, 60, 240);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
const DRESS = '#f29bbb';
const MAMA = () => makeWoman({ shirt: DRESS, pants: DRESS, hair: '#5a3a28', skirt: true });
const MUSUME = () => makeWoman({ shirt: DRESS, pants: DRESS, hair: '#2a2020', skirt: true, scale: 0.78 });
// 吹き出し：お世辞（白）→ パリン → 本音（灰色）
function bubble(a, b) { const front = label(a, { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.4 }); const back = label(b, { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.97)', sx: 1.4 }); S.add(front); S.add(back);
  const sp = makeSparkles(70, 0.12, 0xffffff); S.add(sp.points); return { front, back, sp, inited: false }; }
function flip(B, t, t0, tb, x, y, z, k = 1.3) { // t0 でお世辞が出て、tb でパリンと割れて本音に
  if (!B.inited) { B.sp.init([[x, y, z]], 0.6, 1.0); B.inited = true; }
  B.front.position.set(x, y, z); B.back.position.set(x, y, z);
  if (t < tb) { pop(B.front, t, t0, 0.25, k); B.back.visible = false; B.sp.set(0); }
  else { B.front.visible = false; pop(B.back, t, tb, 0.2, k); B.sp.set(clamp((t - tb) / 0.9)); if (t - tb < 0.08) el.flash.style.opacity = 0.25; }
}

// ---------- A：校門の前（原点） ----------
flat(20, 14, '#c9c2b0', 0, 0);
const wallA = box(20, 1.6, 0.4, mat('#d8d2c4')); wallA.position.set(0, 0.8, -3); S.add(wallA);
for (const x of [-1.8, 1.8]) { const p = box(0.6, 2.6, 0.6, mat('#bfb8a8')); p.position.set(x, 1.3, -3); S.add(p); }
const school = box(16, 7, 6, mat('#efe8da')); school.position.set(0, 3.5, -10); S.add(school);
for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: '#9ec2e0' })); w.position.set(-6.3 + i * 1.8, 2.4 + j * 2.4, -6.98); S.add(w); }
const gateName = label('もしも小学校', { w: 768, size: 90, color: '#2a2a2a', bg: 'rgba(250,250,250,.97)', sx: 1.4 }); gateName.position.set(1.8, 2.0, -2.6); S.add(gateName);
const A_MAMA = MAMA(); S.add(A_MAMA); const A_MUSUME = MUSUME(); S.add(A_MUSUME);
const MAMATOMO = makeWoman({ shirt: '#9fc7a8', hair: '#6b4a33', pants: '#3a3f4e' }); S.add(MAMATOMO);
const B0 = bubble('若く見える〜', '本音'); const B_WAKAI = bubble('若い！', '頑張ってるね');
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.55 }); S.add(katamaru);
const minna = label('みんな若いって言ってくれる', { w: 1100, size: 88, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.3 }); S.add(minna);
const osoroi = label('おそろい', { w: 512, size: 110, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 0.95 }); S.add(osoroi);
const B_KAWAII = bubble('かわいいよ', '一緒に歩くのはちょっと');

// ---------- B：服屋（x=60） ----------
const BX = 60;
flat(12, 10, '#e8e0d8', BX, 0);
const bWall = box(12, 3.4, 0.2, mat('#f6eef0')); bWall.position.set(BX, 1.7, -3); S.add(bWall);
const rackB = new THREE.Group(); { const bar = box(3.0, 0.05, 0.05, mat('#c8ccd4')); bar.position.y = 1.7; rackB.add(bar); for (const x of [-1.45, 1.45]) { const p = box(0.05, 1.7, 0.05, mat('#c8ccd4')); p.position.set(x, 0.85, 0); rackB.add(p); } for (let i = 0; i < 8; i++) { const c = box(0.3, 0.8, 0.05, mat(['#f29bbb', '#9fc7a8', '#f2c14e', '#c9a8d8'][i % 4])); c.position.set(-1.2 + i * 0.34, 1.25, 0); c.rotation.y = Math.PI / 2; rackB.add(c); } } rackB.position.set(BX - 1.5, 0, -1.8); S.add(rackB);
const shopSign = label('もしもブティック', { w: 900, size: 100, color: '#fff', bg: 'rgba(200,90,130,.95)', sx: 2.2 }); shopSign.position.set(BX, 2.9, -2.8); S.add(shopSign);
const B_MAMA = MAMA(); S.add(B_MAMA); const CLERK = makeWoman({ shirt: '#2a2a30', hair: '#3a2620', pants: '#2a2a30' }); S.add(CLERK);
const B_ONE = bubble('お姉さんみたい！', '買ってくれそう');

// ---------- C：クローゼット（x=120） ----------
const CX = 120;
flat(10, 8, '#c9a27a', CX, 0);
const cWall = box(10, 3.2, 0.2, mat('#f3e6ef')); cWall.position.set(CX, 1.6, -2.4); S.add(cWall);
const closet = new THREE.Group(); { const b = box(2.2, 2.4, 0.7, mat('#e8dcc8')); b.position.y = 1.2; closet.add(b); const inside = box(2.0, 2.2, 0.05, mat('#5a4a3a')); inside.position.set(0, 1.2, 0.33); closet.add(inside); } closet.position.set(CX, 0, -1.9); S.add(closet);
const DOORL = box(1.0, 2.2, 0.05, mat('#d8ccb8')); S.add(DOORL); const DOORR = box(1.0, 2.2, 0.05, mat('#d8ccb8')); S.add(DOORR);
const HANG = box(0.5, 0.9, 0.06, mat(DRESS)); S.add(HANG);
const C_MAMA = makeWoman({ shirt: '#e9e4da', pants: '#4a4f60', hair: '#5a3a28' }); S.add(C_MAMA);
const oku = label('奥にしまう', { w: 640, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.15 }); S.add(oku);

// ---------- D：会議室（x=180）：部下の さすがです ----------
const DX = 180;
const MR = makeMeetingRoom(); MR.position.set(DX, 0, 0); S.add(MR);
const BOSS = makeSuit({ old: true, bald: true, jacket: '#2a2e38' }); S.add(BOSS); const sweatB = makeSweat(); BOSS.userData.head.add(sweatB);
const BF = BOSS.userData.head.children[0]; BF.material = BF.material.clone(); const BOSS_SKIN = BF.material.color.clone();
const SUBS_P = [makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }), makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }), makeSuit({ jacket: '#56504a', tie: '#5a8a4a' })]; SUBS_P.forEach(p => S.add(p));
const B_SASUGA = bubble('さすがです', '早く終われ');
const shokuba = label('職場でも', { w: 512, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.95 }); S.add(shokuba);
const MEMORY = ['すごいですね', '勉強になります', '天才です'].map(s => { const l = label(s, { w: 768, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.9)', sx: 1.1 }); S.add(l); return l; });
const aozame = label('青ざめる', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 0.95 }); S.add(aozame);

// ---------- E：街（x=240）：お世辞が消えた ----------
const EX = 240;
flat(30, 20, '#b8b4ac', EX, 0);
for (let i = 0; i < 6; i++) { const b = box(5, 5 + (i % 3) * 2, 4, mat(['#e8e2d4', '#d8dde4', '#efe6d6'][i % 3])); b.position.set(EX - 13 + i * 5.2, (5 + (i % 3) * 2) / 2, -7); S.add(b); }
const TOWN = []; { const r = rng(64); for (let i = 0; i < 12; i++) { const p = r() < 0.5 ? makeWoman({ shirt: ['#c9a8d8', '#9fc7a8', '#e9b8c8', '#8fd0f0'][i % 4], hair: ['#3a2620', '#6b4a33'][i % 2] }) : makeMan({ shirt: ['#4f6a8f', '#59606e', '#d97a3a'][i % 3] }); p.position.set(EX - 6 + (i % 4) * 4 + (r() - 0.5), 0, -3 + Math.floor(i / 4) * 2.4); p.rotation.y = (i % 2 ? 1 : -1) * 1.0; S.add(p); TOWN.push(p); } }
const TBUB = TOWN.map((p, i) => { const l = label(['いいね〜', 'すてき！', 'お若い！', 'さすが！'][i % 4], { w: 512, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 0.85 }); S.add(l); return l; });
const sparkE = makeSparkles(200, 0.16, 0xffffff); S.add(sparkE.points); sparkE.init(TOWN.map(p => [p.position.x + 0.4, 2.35, p.position.z]), 0.4, 0.9);
const nokorazu = label('お世辞 ゼロ', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(nokorazu);
const E_MAMA = MAMA(); S.add(E_MAMA);
const kizu = label('褒められ慣れていた人', { w: 1024, size: 92, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.1 }); S.add(kizu);
// 使い捨ての傘（透明のビニール傘）
const UMB = new THREE.Group(); { const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.35, 12, 1, true), new THREE.MeshLambertMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); c.position.y = 2.15; UMB.add(c); const sh = box(0.03, 1.3, 0.03, mat('#c8ccd4')); sh.position.y = 1.5; UMB.add(sh); const hd = box(0.12, 0.04, 0.04, mat('#c8ccd4')); hd.position.set(0.05, 0.86, 0); UMB.add(hd); } S.add(UMB);
const kasa = label('使い捨ての傘', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.4 }); S.add(kasa);

const PEOPLE = [A_MAMA, A_MUSUME, MAMATOMO, B_MAMA, CLERK, C_MAMA, BOSS, ...SUBS_P, ...TOWN, E_MAMA];
const ALLB = [B0, B_WAKAI, B_KAWAII, B_ONE, B_SASUGA];
const LABELS = [katamaru, minna, osoroi, oku, shokuba, ...MEMORY, aozame, ...TBUB, nokorazu, kizu, kasa];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); ALLB.forEach(b => { b.front.visible = b.back.visible = false; b.sp.set(0); }); sweatB.userData.set(0); sparkE.set(0); UMB.visible = false;
  A_MAMA.position.set(0.3, 0, 0); A_MUSUME.position.set(0.95, 0, 0.1); A_MAMA.rotation.y = -0.2; A_MUSUME.rotation.y = -0.3; MAMATOMO.position.set(-1.2, 0, 0.6); MAMATOMO.rotation.y = 1.1;
  B_MAMA.position.set(BX + 0.4, 0, 0); B_MAMA.rotation.y = -0.6; CLERK.position.set(BX - 0.8, 0, 0.3); CLERK.rotation.y = 0.9;
  C_MAMA.position.set(CX + 0.2, 0, -0.6); C_MAMA.rotation.y = Math.PI; DOORL.position.set(CX - 0.55, 1.2, -1.5); DOORR.position.set(CX + 0.55, 1.2, -1.5); DOORL.rotation.y = DOORR.rotation.y = 0; HANG.position.set(CX, 1.5, -1.5);
  const st = MR.userData.seats; BOSS.position.set(DX + st[2].x, 0, st[2].z); BOSS.rotation.y = st[2].ry; poseSit(BOSS); BF.material.color.copy(BOSS_SKIN);
  SUBS_P.forEach((p, i) => { const s = st[[1, 4, 5][i]]; p.position.set(DX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  MR.userData.board.set(['今期の方針']);
  E_MAMA.position.set(EX, 0, 2.0); E_MAMA.rotation.y = 0;
  el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.45;
function gateCam(u = 0) { look(lerp(-0.2, -0.3, u), 1.6, lerp(6.6, 6.1, u), -0.3, 1.7, 0.2, 50); }
function shot0(t) { // 0秒＝サムネ：ママ友の 若く見える〜 の吹き出しが、パリンと割れて 本音 に変わる
  reset(); lift(0); MAMATOMO.userData.arms[1].rotation.set(-0.8, 0, 0.3);
  B0.front.visible = true; flip(B0, t, -1, TP, -0.9, 2.05, 0.8, 1.1);
  A_MAMA.userData.head.rotation.x = t > TP ? -0.1 : 0;
  gateCam(ease(clamp(t / 3)));
  return S;
}
function sKatamaru(t) { // 娘とおそろいのワンピースのママが、校門の前で固まる。
  reset(); lift(120); A_MAMA.rotation.y = 0; A_MUSUME.rotation.y = 0; MAMATOMO.visible = false; A_MAMA.userData.arms[1].rotation.set(-0.3, 0, -0.3);
  say(osoroi, t, 0.4, 0.62, 2.3, 0.1, 0.9); if (t > 1.5) say(katamaru, t, 1.5, -0.3, 2.1, 0.1, 0.5);
  const u = ease(clamp(t / 3.5)); look(lerp(0.6, 0.8, u), 1.5, lerp(4.2, 3.8, u), 0.6, 1.3, 0, 50);
  return S;
}
function sIibun(t) { // ママの言い分から。
  reset(); lift(120); A_MAMA.rotation.y = 0.2; A_MAMA.userData.arms[0].rotation.set(-0.3, 0, 0.6); MAMATOMO.visible = false;
  look(0.6, 1.7, 3.6, 0.4, 1.5, 0, 46);
  return S;
}
function sMinna(t) { // だって、みんな若いって言ってくれる。
  reset(); lift(120); A_MAMA.rotation.y = 0.2; A_MAMA.userData.arms[0].rotation.set(0, 0, -0.6); A_MAMA.userData.arms[1].rotation.set(0, 0, 0.6); MAMATOMO.visible = false; A_MAMA.userData.head.rotation.z = Math.sin(t * 2) * 0.08;
  say(minna, t, 0.3, 0.4, 2.35, 0, 2.1);
  look(0.6, 1.7, 3.6, 0.4, 1.6, 0, 46);
  return S;
}
function sWakai(t, d) { // ママ友の 若い！ は、本音だと 頑張ってるね。
  reset(); lift(120); MAMATOMO.userData.arms[1].rotation.set(-0.8, 0, 0.3); flip(B_WAKAI, t, 0.2, d * 0.5, -0.8, 2.25, 0.7, 1.05);
  setHud('お世辞 1', 'ママ友', 1); look(-0.5, 1.7, 5.0, -0.5, 1.6, 0.3, 50);
  return S;
}
function sOne(t, d) { // 店員さんの お姉さんみたい！ は、本音だと 買ってくれそう。
  reset(); lift(120); CLERK.userData.arms.forEach(a => a.rotation.set(-0.8, 0, 0)); flip(B_ONE, t, 0.2, d * 0.5, BX - 0.3, 2.3, 0.4, 1.1);
  setHud('お世辞 2', '店員さん', 1); look(BX - 0.2, 1.7, 4.4, BX - 0.2, 1.6, 0, 50);
  return S;
}
function sKawaii(t, d) { // 娘の かわいいよ は、本音だと 一緒に歩くのはちょっと。
  reset(); lift(120); MAMATOMO.visible = false; A_MUSUME.rotation.y = -0.6; A_MAMA.rotation.y = 0.4; A_MUSUME.userData.head.rotation.y = 0.3;
  flip(B_KAWAII, t, 0.2, d * 0.5, 0.65, 2.0, 0.3, 1.0);
  setHud('お世辞 3', '娘', 1); look(0.7, 1.4, 4.0, 0.7, 1.4, 0, 50);
  return S;
}
function sShimau(t, d) { // ママは、おそろいの服をクローゼットの奥にしまう。
  reset(); lift(120); const k = clamp(t / (d - 0.5)); HANG.position.set(CX + 0.1, 1.5, lerp(-0.9, -1.75, k)); C_MAMA.userData.arms.forEach(a => a.rotation.set(-1.4 * (1 - k * 0.6), 0, 0)); DOORL.rotation.y = -1.2; DOORR.rotation.y = 1.2; DOORL.position.x = CX - 1.05; DOORR.position.x = CX + 1.05;
  if (t > 1.2) say(oku, t, 1.2, CX, 2.35, -1.0, 1.0);
  look(CX + 1.4, 1.9, 2.2, CX, 1.4, -1.3, 50);
  return S;
}
function meetCam(u = 0) { const s = MR.userData.seats[2]; look(DX + s.x + lerp(0.4, 0.2, u), 2.0, s.z + lerp(4.6, 4.2, u), DX + s.x, 1.3, s.z, 50); }
function sShokuba(t, d) { // 職場でも。部下の さすがです は、本音だと 早く終われ。
  reset(); lift(120); const s = MR.userData.seats[4]; const sb = SUBS_P[1]; sb.userData.arms[1].rotation.set(-0.9, 0, 0.2);
  say(shokuba, t, 0.1, DX + 0.2, 2.45, -1.2, 0.8); flip(B_SASUGA, t, 0.6, d * 0.55, DX + s.x - 0.4, 2.05, s.z + 0.3, 1.0);
  look(DX + 1.0, 2.2, 3.4, DX + 0.7, 1.3, -1.0, 50);
  return S;
}
function sAozame(t, d) { // 上司は、今まで褒められた全部を思い出して青ざめる。
  reset(); lift(120); const k = clamp((t - 0.6) / 1.2); BF.material.color.copy(BOSS_SKIN).lerp(new THREE.Color('#a8c0e0'), k); sweatB.userData.set(k, t); BOSS.userData.head.rotation.x = 0.3 * k;
  const s = MR.userData.seats[2]; MEMORY.forEach((l, i) => { l.position.set(DX + s.x - 0.9 + i * 0.9, 2.3 + (i % 2) * 0.35, s.z); pop(l, t, 0.1 + i * 0.25, 0.25, 0.85); if (t > 1.6) { l.material.opacity = clamp(1 - (t - 1.6) / 0.6); } else l.material.opacity = 1; });
  if (t > 1.8) say(aozame, t, 1.8, DX + s.x, 2.6, s.z, 0.9);
  meetCam(ease(clamp(t / d)));
  return S;
}
function townCam(u = 0) { look(EX, lerp(4.2, 5.0, u), lerp(9.5, 10.5, u), EX, 1.2, -1.0, 50); }
function sTown(t, d) { // 1週間後。街から、お世辞が1つ残らず消える。
  reset(); lift(120); E_MAMA.visible = false; TBUB.forEach((l, i) => { const p = TOWN[i]; l.position.set(p.position.x + 0.4, 2.35, p.position.z); const tv = 0.8 + i * 0.1; l.visible = t < tv; l.userData.size(0.85); });
  sparkE.set(clamp((t - 0.8) / 2.0)); if (t > 2.2) say(nokorazu, t, 2.2, EX, 3.6, -1.0, 1.3);
  setHud('1週間後', '街', 1); townCam(ease(clamp(t / d)));
  return S;
}
function sKekka(t, d) { // 結果：本音が聞こえて一番傷ついたのは、褒められ慣れていた人だった。
  reset(); lift(120); E_MAMA.userData.head.rotation.x = 0.35; E_MAMA.rotation.x = 0.06; TOWN.forEach(p => p.userData.head.rotation.y = 0);
  if (t > 1.5) say(kizu, t, 1.5, EX, 2.3, 2.0, 1.4);
  const u = ease(clamp(t / d)); look(EX + lerp(0.6, 0.2, u), 1.8, lerp(5.4, 4.6, u), EX, 1.5, 1.6, 50);
  return S;
}
function sKasa(t, d) { // お世辞は、言う人が自分を守るための、使い捨ての傘
  reset(); lift(120); MAMATOMO.position.set(0.0, 0, 0.6); MAMATOMO.rotation.y = 0; A_MAMA.visible = A_MUSUME.visible = false; MAMATOMO.userData.arms[1].rotation.set(-0.9, 0, 0.1);
  UMB.visible = true; UMB.position.set(0.25, 0, 0.75); UMB.scale.setScalar(easeOut(clamp(t / 0.5)));
  if (t > 0.8) say(kasa, t, 0.8, 0.1, 2.5, 0.6, 1.1);
  look(0.4, 1.8, 4.2, 0.1, 1.7, 0.5, 50);
  return S;
}
function sKamo(t, d) { // だったのかもしれない。（傘をたたむ）
  reset(); lift(120); MAMATOMO.position.set(0.0, 0, 0.6); MAMATOMO.rotation.y = 0; A_MAMA.visible = A_MUSUME.visible = false; MAMATOMO.userData.arms[1].rotation.set(-0.9, 0, 0.1);
  UMB.visible = true; UMB.position.set(0.25, 0, 0.75); UMB.scale.set(1 - 0.75 * clamp(t / 1.0), 1, 1 - 0.75 * clamp(t / 1.0));
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.8, u), 1.8, lerp(4.2, 5.0, u), 0.1, 1.6, 0.5, 50);
  return S;
}
function sAsk(t) { // 若く見えるね、言われたらうれしい？（冒頭と同じ構図。吹き出しは本音のまま）
  reset(); lift(0); MAMATOMO.userData.arms[1].rotation.set(-0.8, 0, 0.3); B0.back.visible = true; B0.back.position.set(-0.9, 2.05, 0.8); B0.back.userData.size(1.1); gateCam(0);
  return S;
}

const NARR = { '娘': 'むすめ', '校門': 'こうもん', '言い分': 'いいぶん', '本音': 'ほんね', '部下': 'ぶか', '上司': 'じょうし', '青ざめる': 'あおざめる', '1週間後': 'いっしゅうかんご', '1つ': 'ひとつ', '結果：': '結果、', '一番': 'いちばん', 'お世辞': 'おせじ', '使い捨て': 'つかいすて', '傘': 'かさ', '奥': 'おく' };
const P = planTimes([
  ['娘とおそろいのワンピースの<br>ママが、校門の前で固まる。', sKatamaru],
  ['ママの言い分から。', sIibun],
  ['だって、みんな<br>若いって言ってくれる。', sMinna],
  ['ママ友の 若い！ は、<br>本音だと 頑張ってるね。', sWakai],
  ['店員さんの<br>お姉さんみたい！ は、', (t, d) => sOne(t, 2 * d)],
  ['本音だと 買ってくれそう。', (t, d) => sOne(t + d, 2 * d)],
  ['娘の かわいいよ は、本音だと<br>一緒に歩くのはちょっと。', sKawaii],
  ['ママは、おそろいの服を<br>クローゼットの奥にしまう。', sShimau],
  ['職場でも。部下の<br>さすがです は、', (t, d) => sShokuba(t, 1.8 * d)],
  ['本音だと 早く終われ。', (t, d) => sShokuba(t + d, 1.8 * d)],
  ['上司は、今まで褒められた<br>全部を思い出して青ざめる。', sAozame],
  ['1週間後。街から、<br>お世辞が1つ残らず消える。', sTown],
  ['結果：本音が聞こえて<br>一番傷ついたのは、', sKekka],
  ['褒められ慣れていた人だった。', (t, d) => sKekka(t + 2.0, d + 2.0)],
  ['お世辞は、言う人が<br>自分を守るための、', sKasa],
  ['使い捨ての傘', (t, d) => sKasa(t + 1.5, d)],
  ['だったのかもしれない。', sKamo],
  ['若く見えるね、<br>言われたらうれしい？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0669',
    v2: true,
    tt: 'main',
    hookLine: 'ママ友の 若く見える〜 の吹き出しが、パリンと割れて 本音 に変わる。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもお世辞が全部本音で聞こえたら？',
    titleHtml: 'もしもお世辞が<br>全部本音で<br>聞こえたら？',
    mood: 'tension', seed: 669, hits: [TP, P.at(12), P.at(16)], risers: [P.at(10)], impacts: [P.at(3, 1.4), P.at(5, 0.1), P.at(6, 1.6), P.at(9, 0.1), P.at(11, 0.8)],
    sfx: [[TP, 'poof'], [P.at(0, 1.5), 'buzz'], [P.at(3, 1.4), 'poof'], [P.at(5, 0.1), 'poof'], [P.at(6, 1.6), 'poof'], [P.at(7, 1.2), 'whoosh'], [P.at(9, 0.1), 'poof'], [P.at(10, 1.0), 'meter', 0.4], [P.at(11, 0.8), 'poof'], [P.at(16, 0.2), 'whoosh']],
    narr: NARR,
    ask: '若く見えるね、言われたらうれしい？',
    caption: 'もしもお世辞が全部本音で聞こえたら？\n\n娘とおそろいのワンピースのママが、校門の前で固まる。\nママの言い分から。だって、みんな若いって言ってくれる。\nママ友の若い！は、本音だと頑張ってるね。\n店員さんのお姉さんみたい！は、本音だと買ってくれそう。\n娘のかわいいよは、本音だと一緒に歩くのはちょっと。\nママは、おそろいの服をクローゼットの奥にしまう。\n職場でも。部下のさすがですは、本音だと早く終われ。\n上司は、今まで褒められた全部を思い出して青ざめる。\n1週間後。街から、お世辞が1つ残らず消える。\n\n結果：本音が聞こえて一番傷ついたのは、褒められ慣れていた人だった。\nお世辞は、言う人が自分を守るための、使い捨ての傘だったのかもしれない。\n\n若く見えるね、言われたらうれしい？ コメントで教えて。\n\n※風刺ネタです。お世辞が本音で聞こえるのは、もしもの設定です。登場する人物・店・会社は架空です',
    hashtags: ['もしもラボ', 'もしも', 'お世辞', '本音', 'ママ友'],
    endStats: [['聞こえるようになったもの', 'お世辞の本音', 'もしもの設定'], ['一番傷ついたのは', '褒められ慣れていた人', 'もしもの結果'], ['お世辞の正体', '使い捨ての傘', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
