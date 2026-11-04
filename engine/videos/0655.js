import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, makePerson, poseWalk, SKIN } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { poseClear, poseSit, makeSuit, makeSweat } from '../scenes/office.js';
import { makeDog, dogWalk } from '../scenes/dog.js';

// もしもラブホが消えたら？（皮肉回・台本 S54・社会の消えたら）
// 2026/11/05 ゆうとの直接の指示（ゆうとが中身を出した回。承認済み扱い）。
//  ゆうとの中身：一夜を華やかにしてくれる〇〇 → 多目的トイレ・公園・ネットカフェ・車・民泊・ビジネスホテルに分散
//   → 浮気・不倫調査の探偵はラブホの出入りで1発で証拠がとれていたが、なくなると難航 → 年間売上と社会への貢献
//  〇〇＝大人のお城（たとえは お城 → 城を追われる → 城の前で待つだけだった探偵 → お城の売上 → お城が消えて一番喜んだのは浮気している人）
// 数字（裏取り済み）：
//  ・ラブホテル等（店舗型性風俗特殊営業 4号＝モーテル・ラブホテル等）の届出数 4,425件（2025年末）。
//    警察庁生活安全局保安課「令和7年における風俗営業等の現状と風俗関係事犯等の取締り状況について」（令和8年4月）
//    https://www.npa.go.jp/publications/statistics/safetylife/080423huzokukankeitoukei.pdf
//    （届出をせずにホテル・旅館として営業する施設は入っていない＝届出の数として出す）
//  ・ラブホテルの市場規模（利用料ベース）7,114億円（2014年度・推計）。矢野経済研究所の推計（同社の Xビジネス「ラブホテル（ファッションホテル）市場の実態と展望」2017/03/30）
//    https://xbusiness.jp/post/131 　※届出施設の利用料。古い推計なので画面に 推計・2014年度 と出す。ネットでよく見る 4兆円 は出典が確かめられないので使わない
//  ・探偵の証拠：ラブホテルは利用目的が限られるため、2人で入り一定時間（おおむね2〜3時間以上）いたことを示せれば肉体関係が推認される傾向。
//    一般のホテルや自宅は出張など他の目的も考えられ、出入りの写真だけでは不十分なことが多い（弁護士ドットコム 不倫の証拠、渡邊律弁護士監修、2026/10/01）
//    https://www.bengo4.com/c_3/guides/furin-shoko/
//  ・社会への貢献：雇用・税収・防犯・少子化との関係は確かな数字が見つからないので言い切らない。人目を気にせず2人になれる場所（施設の目的そのもの）と、
//    公園・トイレの話は風刺の筋として描く
// 性的な描写はしない（行為・露骨な言葉・体の表現なし）。多目的トイレは本来の利用者（車いすの人）が困る皮肉で描く。ホテル・チェーン・探偵社は全部架空

const PINK = '#ff5fae', GOLD = '#ffd27a', BLUE = '#7fd4ff', GREEN = '#7be38f', RED = '#ff5a5a', CREAM = '#fff1c9';

const S = new THREE.Scene();
S.background = new THREE.Color('#0c1022'); S.fog = new THREE.Fog(0x0c1022, 40, 120);
const hemi = new THREE.HemisphereLight(0xc4ceff, 0x2a2434, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(12, 30, 22); S.add(sun);
const groundM = mat('#262a36');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 400), groundM); ground.rotation.x = -Math.PI / 2; ground.position.x = 300; ground.renderOrder = -1; S.add(ground);
const overM = (c) => new THREE.MeshLambertMaterial({ color: c, depthWrite: false });
function flat(w, d, c, x, z, ro = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), overM(c)); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.renderOrder = ro; S.add(m); return m; }
const cyl = (rt, rb, h, c, seg = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); return m; };
const cone = (r, h, c) => new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), mat(c));

// ---------- 人 ----------
function couple(r, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  const m = makeMan({ shirt: ['#4f6a8f', '#3f8f6b', '#59606e', '#8e6bbf'][Math.floor(r() * 4)], skin: SKIN[Math.floor(r() * 3)] }); m.position.x = -0.34; g.add(m);
  const w = makeWoman({ shirt: ['#f29bbb', '#f2c14e', '#e9e4da', '#c58bff'][Math.floor(r() * 4)], hair: ['#3a2620', '#6b4a33', '#1d1a19'][Math.floor(r() * 3)] }); w.position.x = 0.34; g.add(w);
  m.userData.arms[1].rotation.z = 0.25; w.userData.arms[0].rotation.z = -0.25;
  const h = label('♡', { w: 192, h: 192, size: 150, color: PINK, stroke: 14, strokeColor: '#2a0f1e', sx: 0.7 }); h.position.set(0, 2.35, 0); g.add(h);
  g.userData = { m, w, h, ph: r() * 6.28 };
  return g;
}
function walkCouple(c, t, amp = 1) { poseWalk(c.userData.m, t * 8 + c.userData.ph, amp); poseWalk(c.userData.w, t * 8 + c.userData.ph + 0.4, amp); c.userData.h.position.y = 2.35 + Math.sin(t * 4 + c.userData.ph) * 0.08; }
function makeDetective() {
  const p = makePerson({ skin: '#e8b98f', hair: '#2a2421', shirt: '#b89a6a', pants: '#3a3226' });
  const coat = box(0.6, 0.55, 0.34, mat('#a88a5c')); coat.position.y = 0.72; p.add(coat);
  const brim = cyl(0.42, 0.42, 0.04, '#3b2f24'); brim.position.y = 0.5; p.userData.head.add(brim);
  const crown = cyl(0.24, 0.27, 0.24, '#3b2f24'); crown.position.y = 0.63; p.userData.head.add(crown);
  const camB = box(0.34, 0.22, 0.2, mat('#1b1d22')); camB.position.set(0, 0.22, 0.42); p.userData.head.add(camB);
  const lens = cyl(0.08, 0.08, 0.2, '#3a3d46'); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.22, 0.58); p.userData.head.add(lens);
  p.userData.camB = camB; p.userData.lens = lens;
  return p;
}
function aim(p, k = 1) { const a = p.userData.arms; a[0].rotation.set(-1.75 * k, 0, 0.45 * k); a[1].rotation.set(-1.75 * k, 0, -0.45 * k); }
function makeWheelchair() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 24), mat('#3a3d46')); wh.rotation.y = Math.PI / 2; wh.position.set(s * 0.36, 0.32, -0.05); g.add(wh); const fw = cyl(0.08, 0.08, 0.05, '#3a3d46'); fw.rotation.z = Math.PI / 2; fw.position.set(s * 0.3, 0.08, 0.38); g.add(fw); }
  const seat = box(0.6, 0.06, 0.5, mat('#2f6fd1')); seat.position.y = 0.47; g.add(seat);
  const back = box(0.6, 0.55, 0.05, mat('#2f6fd1')); back.position.set(0, 0.78, -0.26); g.add(back);
  const p = makePerson({ skin: '#f1c9a5', hair: '#4a3426', shirt: '#e05a4f', pants: '#2b3346' }); poseSit(p); p.position.y = 0.0; p.position.z = 0.02; g.add(p);
  p.userData.arms.forEach(a => a.rotation.x = -0.5);
  g.userData.p = p;
  return g;
}

// =====================================================
// 1) 大人のお城（原点）
// =====================================================
const CASTLE = new THREE.Group(); S.add(CASTLE);
const WALLC = '#f6d9ea', ROOFC = '#c8367e';
{
  const body = box(7, 5, 4, mat(WALLC)); body.position.y = 2.5; CASTLE.add(body);
  for (const x of [-3.6, 3.6]) { const tw = cyl(1.05, 1.05, 7.2, WALLC); tw.position.set(x, 3.6, 0.3); CASTLE.add(tw); const rf = cone(1.35, 2.4, ROOFC); rf.position.set(x, 8.4, 0.3); CASTLE.add(rf); }
  const mid = cyl(1.3, 1.3, 8.8, WALLC); mid.position.set(0, 4.4, -0.6); CASTLE.add(mid);
  const mr = cone(1.7, 3, ROOFC); mr.position.set(0, 10.3, -0.6); CASTLE.add(mr);
  for (let i = 0; i < 7; i++) { const b = box(0.6, 0.5, 0.6, mat(WALLC)); b.position.set(-3 + i * 1, 5.25, 1.7); CASTLE.add(b); }
  const gate = box(1.8, 2.3, 0.1, mat('#5a1f3c')); gate.position.set(0, 1.15, 2.03); CASTLE.add(gate);
  const arch = cyl(0.9, 0.9, 0.1, '#5a1f3c', 20); arch.rotation.x = Math.PI / 2; arch.position.set(0, 2.3, 2.03); CASTLE.add(arch);
  for (const x of [-2.4, 2.4]) for (const y of [2.6, 4.0]) { const w = box(0.7, 0.8, 0.08, new THREE.MeshBasicMaterial({ color: '#ffd9a0' })); w.position.set(x, y, 2.03); CASTLE.add(w); }
}
const castleNeonM = new THREE.MeshBasicMaterial({ color: PINK });
for (const [w, h, x, y] of [[6.6, 0.12, 0, 4.95], [0.12, 4.8, -3.35, 2.5], [0.12, 4.8, 3.35, 2.5]]) { const n = box(w, h, 0.12, castleNeonM); n.position.set(x, y, 2.08); n.castShadow = false; CASTLE.add(n); }
const castleSign = label('HOTEL ♡', { size: 120, color: '#fff', stroke: 18, strokeColor: PINK, sx: 4.2 }); castleSign.position.set(0, 6.6, 2.4); castleSign.material.depthTest = false; castleSign.renderOrder = 4; CASTLE.add(castleSign);
const vacancy = label('空室', { size: 110, color: '#fff', bg: 'rgba(40,170,90,.95)', sx: 1.5 }); vacancy.position.set(2.4, 1.3, 2.3); CASTLE.add(vacancy);
const priceB = label('休憩・宿泊', { size: 100, color: '#fff', bg: 'rgba(120,30,80,.95)', sx: 2.4 }); priceB.position.set(-2.4, 1.3, 2.3); CASTLE.add(priceB);
const castleLight = new THREE.PointLight(0xff5fae, 40, 18, 1.6); castleLight.position.set(0, 4, 6); CASTLE.add(castleLight);
const castleDark = new THREE.Color('#3a2a34'), castleCol = new THREE.Color(PINK);
function castleOn(k) { castleNeonM.color.copy(castleDark).lerp(castleCol, k); castleSign.material.opacity = 0.15 + 0.85 * k; castleLight.intensity = 40 * k; vacancy.visible = priceB.visible = k > 0.5; }
function castleAt(u) { CASTLE.visible = u < 1; CASTLE.position.y = -12 * ease(u); }
const castleSpark = makeSparkles(160, 0.45, 0xffb0dc); S.add(castleSpark.points); castleSpark.init([[0, 3, 0], [-3.6, 6, 0.3], [3.6, 6, 0.3], [0, 9, -0.6]], 3, 6);
const heartsP = makeSparkles(160, 0.5, 0xff7ac0); S.add(heartsP.points); heartsP.init([[0, 5, 2]], 6, 5);
// 道・街灯・電柱（張り込み用）
flat(40, 7, '#2f3240', 0, 6.5, -0.8);
const lampL = new THREE.PointLight(0xffe2b0, 30, 24, 1.3); lampL.position.set(-2, 6, 9); S.add(lampL);
const pole = cyl(0.18, 0.2, 7, '#7a7f8a'); pole.position.set(-6.8, 3.5, 9); S.add(pole);
const lot = flat(9, 6, '#3a3430', 0, 0, -0.7); lot.visible = false;
const lotSign = label('閉業', { size: 110, color: '#fff', bg: 'rgba(50,50,60,.95)', sx: 1.6 }); lotSign.position.set(0, 3.4, -0.8); lotSign.userData.size(2.6); S.add(lotSign);
const FRONT = couple(rng(3), 0, 4.2, 0); // お城の前のカップル
const frontQ = label('？', { w: 200, h: 200, size: 150, color: '#fff', stroke: 14, strokeColor: '#222', sx: 1.5 }); S.add(frontQ);
// 散らばるカップル（俯瞰）
const SCATTER = []; { const r = rng(11); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + r() * 0.3; const c = couple(r, 0, 0, 0); c.userData.a = a; c.userData.sp = 2.4 + r() * 1.2; SCATTER.push(c); } }
const DEST = [['多目的トイレ', BLUE], ['公園', GREEN], ['ネットカフェ', GOLD], ['車', '#ff9a5a'], ['民泊', '#c58bff'], ['ビジホ', '#9fb3ff']].map(([s, c], i) => { const a = (i / 6) * Math.PI * 2 + 0.25; const sp = label(s, { size: 100, color: '#fff', bg: hexA(c, .92), sx: 4.2 }); sp.position.set(Math.cos(a) * 4.6, 2.6, Math.sin(a) * 5.5 + 0.5); sp.userData.a = a; S.add(sp); return sp; });
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
// 探偵（お城の前）
const DET = makeDetective(); S.add(DET);
const photo = label('IN 21:03 → OUT 23:10', { size: 80, color: '#222', bg: 'rgba(255,250,235,.97)', sx: 5.4 }); S.add(photo);
const camFlash = new THREE.PointLight(0xffffff, 0, 12, 1.2); S.add(camFlash);

// =====================================================
// 2) 多目的トイレ（x=60）
// =====================================================
const TX = 60;
flat(16, 10, '#3a3f4c', TX, 2, -0.8);
const TOI = new THREE.Group(); TOI.position.set(TX, 0, -1); S.add(TOI);
{ const b = box(4.2, 3.2, 3, mat('#dfe6ee')); b.position.y = 1.6; TOI.add(b); const rf = box(4.6, 0.2, 3.4, mat('#8a95a8')); rf.position.y = 3.3; TOI.add(rf); }
const toiDoorM = mat('#6f86a8'); const toiDoor = box(1.6, 2.3, 0.08, toiDoorM); toiDoor.position.set(0, 1.15, 1.53); TOI.add(toiDoor);
const toiSign = label('多目的トイレ', { size: 96, color: '#fff', bg: 'rgba(40,110,190,.95)', sx: 3.2 }); toiSign.position.set(TX, 2.9, 1.5); S.add(toiSign);
const inUse = label('使用中', { size: 110, color: '#fff', bg: 'rgba(220,50,60,.96)', sx: 1.8 }); inUse.position.set(TX, 1.85, 1.4); S.add(inUse);
const vacant = label('空き', { size: 110, color: '#fff', bg: 'rgba(40,170,90,.96)', sx: 1.4 }); vacant.position.set(TX, 1.85, 1.4); S.add(vacant);
const toiLamp = new THREE.PointLight(0xdfe8ff, 16, 14, 1.5); toiLamp.position.set(TX, 4.5, 4); S.add(toiLamp);
const WC = makeWheelchair(); WC.position.set(TX - 0.9, 0, 3.0); WC.rotation.y = Math.PI + 0.35; S.add(WC);
const wcQ = label('…', { w: 200, h: 200, size: 140, color: '#fff', stroke: 14, strokeColor: '#222', sx: 0.9 }); S.add(wcQ);
const TOICOUPLE = couple(rng(5), TX, 3, Math.PI);
// 張り込みの探偵（植え込み）
const bush = new THREE.Group(); bush.position.set(TX + 3.2, 0, 4.2); S.add(bush);
for (const [x, y, s] of [[0, 0.5, 0.8], [0.6, 0.45, 0.65], [-0.6, 0.45, 0.65]]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat('#2f6b3a', { flatShading: true })); b.position.set(x, y, 0); bush.add(b); }
const DET2 = makeDetective(); DET2.userData.camB.visible = DET2.userData.lens.visible = false; S.add(DET2);
const bino = new THREE.Group(); for (const s of [-1, 1]) { const c = cyl(0.07, 0.07, 0.22, '#1b1d22'); c.rotation.x = Math.PI / 2; c.position.set(s * 0.09, 0.26, 0.32); bino.add(c); } DET2.userData.head.add(bino);
const DSWEAT = makeSweat(); DET2.userData.head.add(DSWEAT);

// =====================================================
// 3) 夜の公園（x=120）
// =====================================================
const PX = 120;
flat(30, 20, '#24402c', PX, 0, -0.8);
const BENCH = [];
for (let i = 0; i < 4; i++) {
  const g = new THREE.Group(); g.position.set(PX - 6 + i * 4, 0, -2 + (i % 2) * 0.6); S.add(g);
  const seat = box(2.2, 0.1, 0.6, mat('#8a5a32')); seat.position.y = 0.45; g.add(seat);
  const back = box(2.2, 0.5, 0.08, mat('#8a5a32')); back.position.set(0, 0.8, -0.3); g.add(back);
  for (const x of [-0.95, 0.95]) { const l = box(0.08, 0.45, 0.5, mat('#3a3d46')); l.position.set(x, 0.22, 0); g.add(l); }
  const c = couple(rng(20 + i), 0, 0, 0); S.remove(c); g.add(c); poseSit(c.userData.m); poseSit(c.userData.w); c.position.z = 0.05;
  BENCH.push(g);
}
const fullP = label('満室', { size: 120, color: '#fff', bg: 'rgba(220,50,60,.96)', sx: 2.0 }); fullP.position.set(PX, 3.4, -1.5); S.add(fullP);
for (const x of [-9, 9]) { const lp = cyl(0.1, 0.12, 4.5, '#6a6f7a'); lp.position.set(PX + x, 2.25, -3.5); S.add(lp); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe6b0' })); bulb.position.set(PX + x, 4.6, -3.5); S.add(bulb); }
const parkLamp = new THREE.PointLight(0xffe2b0, 22, 24, 1.4); parkLamp.position.set(PX, 6, 4); S.add(parkLamp);
for (const [x, z, s] of [[-12, -6, 1.6], [12, -6, 1.8], [-4, -8, 1.4], [6, -9, 1.7]]) { const tr = cyl(0.25, 0.3, 2.4, '#5a3e2a'); tr.position.set(PX + x, 1.2, z); S.add(tr); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat('#2e5a36', { flatShading: true })); lf.position.set(PX + x, 3.2, z); S.add(lf); }
const WALKER = makeOji(rng(7)); S.add(WALKER);
const DOG = makeDog({ kind: 'shiba', coat: 'tan' }); S.add(DOG);
const walkerQ = label('…', { w: 200, h: 200, size: 140, color: '#fff', stroke: 14, strokeColor: '#222', sx: 0.9 }); S.add(walkerQ);

// =====================================================
// 4) コインパーキング（x=180）
// =====================================================
const CX = 180;
flat(26, 12, '#2c2f3a', CX, 0, -0.8);
function carMesh(color) {
  const g = new THREE.Group();
  const b = box(1.8, 0.9, 4, mat(color)); b.position.y = 0.75; g.add(b);
  const c = box(1.6, 0.7, 2.2, mat('#9fb0c4')); c.position.set(0, 1.5, -0.2); g.add(c);
  for (const z of [-1.3, 1.3]) for (const s of [-1, 1]) { const w = box(0.25, 0.7, 0.7, mat('#1b1d22')); w.position.set(s * 0.85, 0.35, z); g.add(w); }
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6d0 }); for (const s of [-1, 1]) { const l = box(0.35, 0.18, 0.05, hl); l.position.set(s * 0.6, 0.85, 2.01); g.add(l); }
  S.add(g); return g;
}
const CARS = ['#d94b4b', '#f1f1f1', '#3b6fb6', '#2d2f36', '#e7e3da', '#566275'].map((c, i) => { const g = carMesh(c); g.position.set(CX - 7.5 + i * 3, 0, -1.5); return g; });
for (let i = 0; i <= 6; i++) { const l = flat(0.12, 5, '#e8e8e8', CX - 9 + i * 3, -1.5, -0.7); }
const pSign = new THREE.Group(); pSign.position.set(CX + 10, 0, 1.5); S.add(pSign);
{ const p = cyl(0.12, 0.12, 4, '#9aa0aa'); p.position.y = 2; pSign.add(p); }
const pFull = label('P 満車', { size: 120, color: '#fff', bg: 'rgba(220,50,60,.96)', sx: 2.6 }); pFull.position.set(CX + 10, 4.4, 1.5); S.add(pFull);
const pTime = label('朝5:00', { size: 110, color: '#fff', bg: 'rgba(30,40,70,.92)', sx: 2.2 }); pTime.position.set(CX - 2, 4.2, -1.5); S.add(pTime);
const parkLight = new THREE.PointLight(0xfff0c0, 20, 26, 1.4); parkLight.position.set(CX, 7, 6); S.add(parkLight);

// =====================================================
// 5) ネットカフェ（x=240・店内）
// =====================================================
const NX = 240;
flat(20, 14, '#4a4f5e', NX, 0, -0.8);
const nBack = box(20, 4, 0.2, mat('#d9dde6')); nBack.position.set(NX, 2, -4.2); S.add(nBack);
const BOOTHS = [];
for (let i = 0; i < 5; i++) {
  const x = NX - 6 + i * 3;
  for (const s of [-1, 1]) { const w = box(0.1, 2.0, 3.4, mat('#3a4a6a')); w.position.set(x + s * 1.45, 1.0, -2.5); S.add(w); }
  const door = box(2.8, 1.6, 0.06, mat('#5a6f99')); door.position.set(x, 0.95, -0.8); S.add(door);
  const num = label(String(11 + i), { size: 90, color: '#fff', bg: 'rgba(30,40,70,.9)', sx: 0.8 }); num.position.set(x, 1.55, -0.7); num.material.depthTest = true; num.renderOrder = 0; S.add(num);
  const cough = label('ゴホン', { size: 100, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.6 }); cough.position.set(x, 2.7, -0.4); S.add(cough);
  BOOTHS.push({ x, cough });
}
const ncLight = new THREE.PointLight(0xffffff, 20, 22, 1.3); ncLight.position.set(NX, 5, 4); S.add(ncLight);
const CLERK = makePerson({ skin: '#f5d3b5', hair: '#1d1a19', shirt: '#e05a4f', pants: '#2b3346' }); S.add(CLERK);
const apron = box(0.52, 0.6, 0.04, mat('#1f2430')); apron.position.set(0, 1.0, 0.16); CLERK.add(apron);

// =====================================================
// 6) 民泊（x=300）
// =====================================================
const MX = 300;
flat(18, 12, '#33372f', MX, 0, -0.8);
const HOUSE = new THREE.Group(); HOUSE.position.set(MX - 3, 0, -3); S.add(HOUSE);
{ const b = box(5, 3.2, 4, mat('#e9e0cf')); b.position.y = 1.6; HOUSE.add(b); const rf = new THREE.Mesh(new THREE.ConeGeometry(4, 1.8, 4), mat('#7a3b2e', { flatShading: true })); rf.rotation.y = Math.PI / 4; rf.position.y = 4.1; HOUSE.add(rf); const d = box(1, 2, 0.08, mat('#5a3a2a')); d.position.set(0, 1, 2.03); HOUSE.add(d); for (const x of [-1.6, 1.6]) { const w = box(0.9, 0.8, 0.06, new THREE.MeshBasicMaterial({ color: '#ffd9a0' })); w.position.set(x, 1.9, 2.03); HOUSE.add(w); } }
const mpSign = label('民泊', { size: 110, color: '#fff', bg: 'rgba(140,90,200,.95)', sx: 1.6 }); mpSign.position.set(MX - 3, 3.4, -0.6); S.add(mpSign);
const OOYA = makeOji(rng(9), { shirt: '#6b7a5a' }); OOYA.position.set(MX + 1.2, 0, 1.2); OOYA.rotation.y = -0.5; S.add(OOYA);
const mpPhone = new THREE.Group(); S.add(mpPhone);
{ const b = box(2.4, 4.2, 0.15, mat('#15161c')); mpPhone.add(b); }
const mpC = document.createElement('canvas'); mpC.width = 540; mpC.height = 960;
{ const g = mpC.getContext('2d'); g.fillStyle = '#f7f3ff'; g.fillRect(0, 0, 540, 960); g.fillStyle = '#8c5ac8'; g.fillRect(0, 0, 540, 140); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText('新しい予約', 270, 72);
  g.fillStyle = '#333'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.fillText('11月5日', 270, 260); g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.fillText('21:00〜23:00', 270, 380);
  g.fillStyle = '#e0335a'; g.font = '900 96px "Noto Sans CJK JP", sans-serif'; g.fillText('（2時間）', 270, 520); g.fillStyle = '#333'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.fillText('ゲスト 2名', 270, 680); g.fillText('荷物 なし', 270, 780); }
const mpT = new THREE.CanvasTexture(mpC); mpT.colorSpace = THREE.SRGBColorSpace;
{ const s = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.9), new THREE.MeshBasicMaterial({ map: mpT })); s.position.z = 0.08; mpPhone.add(s); }
mpPhone.position.set(MX - 0.6, 3.0, 1.8); mpPhone.rotation.y = -0.15;
const mpQ = label('？', { w: 200, h: 200, size: 150, color: '#fff', stroke: 14, strokeColor: '#222', sx: 1.8 }); mpQ.position.set(MX + 1.2, 2.9, 1.2); S.add(mpQ);
const mpLight = new THREE.PointLight(0xffe2b0, 18, 18, 1.4); mpLight.position.set(MX, 5, 6); S.add(mpLight);

// =====================================================
// 7) ビジネスホテル（x=360・2部屋の断面）
// =====================================================
const BX = 360;
const BH = new THREE.Group(); BH.position.set(BX, 0, 0); S.add(BH);
{ const fl = box(9, 0.1, 4, mat('#7a6a5a')); fl.position.y = -0.05; BH.add(fl); const bw = box(9, 3, 0.12, mat('#e8e1d6')); bw.position.set(0, 1.5, -2); BH.add(bw); const wall = box(0.18, 3, 4, mat('#cfc6b8')); wall.position.set(0, 1.5, 0); BH.add(wall);
  const cl = box(9, 0.1, 4, mat('#f1ece4')); cl.position.y = 3.05; BH.add(cl);
  const bed = box(1.6, 0.5, 2.6, mat('#ffffff')); bed.position.set(-2.5, 0.25, -0.5); BH.add(bed); const pil = box(1.0, 0.18, 0.5, mat('#f2f2f2')); pil.position.set(-2.5, 0.6, -1.5); BH.add(pil);
  const desk = box(1.2, 0.75, 0.6, mat('#8a6a4a')); desk.position.set(-3.8, 0.375, -1.5); BH.add(desk);
  const door = box(1.0, 2.1, 0.08, mat('#6a5040')); door.position.set(2.6, 1.05, -1.93); BH.add(door);
  const bed2 = box(1.6, 0.5, 2.6, mat('#ffffff')); bed2.position.set(2.5, 0.25, -0.5); BH.add(bed2); }
const SALARY = makeSuit({ old: false }); S.add(SALARY);
const wallShake = BH.children[3];
const zzz = label('眠れない', { size: 100, color: '#fff', bg: 'rgba(30,40,70,.92)', sx: 2.2 }); zzz.position.set(BX - 1.9, 2.5, 0.6); S.add(zzz);
const nextHeart = label('♡', { size: 150, color: PINK, stroke: 14, strokeColor: '#2a0f1e', sx: 1.0 }); nextHeart.position.set(BX + 2.5, 1.7, 0); S.add(nextHeart);
const bhLight = new THREE.PointLight(0xfff0d8, 14, 14, 1.4); bhLight.position.set(BX - 2.5, 2.6, 3); S.add(bhLight);
const bhLight2 = new THREE.PointLight(0xff8ac8, 8, 8, 1.4); bhLight2.position.set(BX + 2.5, 2.4, 2); S.add(bhLight2);
// ビジホの入口（探偵と言い逃れ）
const BE = new THREE.Group(); BE.position.set(BX, 0, -20); S.add(BE);
{ const b = box(10, 9, 4, mat('#b9c0cc')); b.position.y = 4.5; BE.add(b); for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const w = box(0.9, 0.9, 0.06, new THREE.MeshBasicMaterial({ color: (r + c) % 3 ? '#ffe2a8' : '#556070' })); w.position.set(-3.8 + c * 1.5, 4 + r * 1.6, 2.03); BE.add(w); } const d = box(2.4, 2.4, 0.08, mat('#2a3a4a')); d.position.set(0, 1.2, 2.03); BE.add(d); }
const beSign = label('ビジネスホテル', { size: 96, color: '#fff', bg: 'rgba(40,60,110,.95)', sx: 4.0 }); beSign.position.set(BX + 0.2, 4.3, -16.6); S.add(beSign);
flat(20, 8, '#2f3240', BX, -14, -0.8);
const BECOUPLE = couple(rng(13), BX - 0.6, -15.8, 0.3);
const excuse = label('出張です', { size: 110, color: '#222', bg: 'rgba(255,255,255,.97)', sx: 2.2 }); excuse.position.set(BX - 2.0, 2.4, -15.0); S.add(excuse);
const DET3 = makeDetective(); S.add(DET3);
const detQ = label('？', { w: 200, h: 200, size: 150, color: '#fff', stroke: 14, strokeColor: '#222', sx: 1.5 }); S.add(detQ);
const beLight = new THREE.PointLight(0xfff0c0, 22, 22, 1.4); beLight.position.set(BX, 5, -10); S.add(beLight);

// =====================================================
// 8) お城の売上（x=420）
// =====================================================
const GX = 420;
flat(30, 20, '#1a1830', GX, 0, -0.8);
const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.14, 24), coinM = mat('#f2c14e');
const STACKS = [];
{ const r = rng(77); for (let i = 0; i < 26; i++) { const g = new THREE.Group(); const a = r() * 6.28, d = 0.5 + r() * 4.5; g.position.set(GX + Math.cos(a) * d * 1.3, 0, Math.sin(a) * d * 0.7 - 1); S.add(g); const n = Math.round(lerp(26, 6, d / 5) + r() * 5); const cs = []; for (let k = 0; k < n; k++) { const c = new THREE.Mesh(coinGeo, coinM); c.position.set((r() - .5) * 0.06, 0.07 + k * 0.145, (r() - .5) * 0.06); g.add(c); cs.push(c); } STACKS.push({ cs, d }); } }
function coins(u) { for (const s of STACKS) { const k = Math.round(s.cs.length * clamp(u * 1.6 - s.d / 9)); s.cs.forEach((c, i) => c.visible = i < k); } }
const MINI = CASTLE.clone(true); MINI.scale.setScalar(0.42); MINI.position.set(GX, 0, -6); S.add(MINI);
const gLight = new THREE.PointLight(0xffd27a, 40, 26, 1.3); gLight.position.set(GX, 8, 5); S.add(gLight);
const coinSpark = makeSparkles(260, 0.5, 0xffe39a); S.add(coinSpark.points); coinSpark.init([[GX, 2, -1]], 7, 4);
const yearL = label('推計・2014年度・届出分の利用料', { size: 72, color: '#fff', bg: 'rgba(40,30,70,.9)', sx: 5.2 }); yearL.position.set(GX, 4.6, -3); S.add(yearL);

// 結果：浮気している人（ビジホの入口で）
const UWAKI = makeMan({ shirt: '#2b2f3a' });
const UWAKIW = makeWoman({ shirt: '#c94f7c' });
S.add(UWAKI); S.add(UWAKIW);
const noProof = label('証拠なし', { size: 120, color: '#fff', bg: 'rgba(40,170,90,.96)', sx: 2.4 }); S.add(noProof);
const peace = label('ニヤリ', { size: 100, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.8 }); S.add(peace);
const DSWEAT3 = makeSweat(); DET3.userData.head.add(DSWEAT3);

function reset() {
  BE.visible = true; pole.visible = true;
  bush.visible = false;
  castleAt(0); castleOn(1); castleSpark.set(0); heartsP.set(0); lot.visible = false; lotSign.visible = false;
  FRONT.visible = true; frontQ.visible = false; SCATTER.forEach(c => c.visible = false); DEST.forEach(d => d.visible = false);
  DET.visible = false; photo.visible = false; camFlash.intensity = 0;
  inUse.visible = true; vacant.visible = false; wcQ.visible = false; TOICOUPLE.visible = false; DET2.visible = false; DSWEAT.userData.set(0);
  fullP.visible = false; walkerQ.visible = false; pTime.visible = false; BOOTHS.forEach(b => b.cough.visible = false);
  mpQ.visible = false; zzz.visible = false; nextHeart.visible = false; excuse.visible = false; detQ.visible = false; DSWEAT3.userData.set(0);
  UWAKI.visible = UWAKIW.visible = noProof.visible = peace.visible = false; BECOUPLE.visible = true; DET3.visible = false;
  coins(0); coinSpark.set(0); yearL.visible = false; hemi.intensity = 1.15;
  el.flash.style.opacity = 0; setHud('', '', 0);
}

// =====================================================
// ショット
// =====================================================
function castleCam(d = 0) { look(lerp(1.0, 0, d), lerp(3.0, 2.6, d), lerp(38, 13, d), 0, lerp(5.6, 2.2, d), lerp(0, 3, d), 46); }
const lotLight = new THREE.PointLight(0xffd6ea, 0, 12, 1.2); lotLight.position.set(0, 3.5, 8); S.add(lotLight);
function frontPose(t, k) { FRONT.position.set(0, 0, 4.2); FRONT.rotation.y = 0; walkCouple(FRONT, 0, 0); FRONT.userData.h.visible = k < 0.5; }
function shot0(t) { // 0秒＝サムネ：ネオンのお城の前にカップル。0.45秒でお城がボンと消える
  reset(); lift(0); const k = t - 0.45;
  castleAt(k < 0 ? 0 : clamp(k / 0.5)); castleOn(k < 0 ? 1 : 0.3); castleSpark.set(k < 0 ? 0 : clamp(k / 1.1));
  el.flash.style.opacity = k > 0 ? 0.45 * Math.max(0, 1 - k / 0.3) : 0;
  lot.visible = lotSign.visible = k > 0.5; frontPose(t, k > 0 ? 1 : 0);
  FRONT.rotation.y = k > 0.6 ? Math.sin(t * 3) * 0.5 : 0;
  frontQ.position.set(1.0, 2.7, 4.2); pop(frontQ, t, 0.9);
  castleCam(ease(clamp((t - 0.9) / 1.8)) * 0.85); lotLight.intensity = k > 0.3 ? 14 : 0;
  if (k > 0 && k < 0.4) cam.position.x += Math.sin(t * 80) * 0.06;
  return S;
}
function shot1(t) { // 一夜を華やかにしてくれる、大人のお城（ありし日の姿）
  reset(); lift(60); castleOn(0.85 + 0.15 * Math.sin(t * 6)); vacancy.visible = priceB.visible = false; heartsP.set((t * 0.28) % 1);
  FRONT.position.set(0, 0, lerp(6.5, 3.2, clamp(t / 3.3))); walkCouple(FRONT, t); FRONT.rotation.y = Math.PI;
  const u = ease(clamp(t / 3.3)); look(lerp(-5, 3, u), lerp(2.2, 3.4, u), lerp(20, 22, u), 0, 4.6, 0, 50);
  return S;
}
function shot2(t) { // そのお城が全国から消えた
  reset(); lift(60); const u = clamp((t - 0.5) / 1.6); castleAt(u); castleOn(u > 0 ? 0.3 : 1); castleSpark.set(clamp((t - 0.5) / 2.2));
  lot.visible = lotSign.visible = u >= 1; FRONT.visible = false;
  const c = ease(clamp(t / 2.8)); look(0, lerp(6, 9, c), lerp(20, 24, c), 0, 3.2, 0, 50);
  setTop('全国のラブホ（届出・2025年末）', '4,425軒', fade(t, 0.2, 2.8, 0.2), PINK);
  return S;
}
function shot3(t) { // 城を追われたカップルが街に散らばる（俯瞰）
  reset(); lift(240); castleAt(1); lot.visible = lotSign.visible = true; FRONT.visible = false;
  SCATTER.forEach((c, i) => { c.visible = true; const d = 1.2 + t * c.userData.sp; c.position.set(Math.cos(c.userData.a) * d * 0.6, 0, Math.sin(c.userData.a) * d * 0.8 + 0.5); c.rotation.y = Math.PI / 2 - c.userData.a; walkCouple(c, t); });
  DEST.forEach((d, i) => { pop(d, t, 0.6 + i * 0.25); });
  const u = ease(clamp(t / 2.9)); pole.visible = false; look(0, lerp(21, 23, u), lerp(14, 15.5, u), 0, 0, -0.5, 56);
  return S;
}
function shot4(t) { // 多目的トイレは使用中のまま。車いすの人が入れない
  reset(); lift(220); TOICOUPLE.visible = t < 0.9; const e = clamp(t / 0.9); TOICOUPLE.position.set(TX, 0, lerp(3.2, 1.4, e)); walkCouple(TOICOUPLE, t); TOICOUPLE.userData.h.visible = true;
  inUse.visible = t > 1.0; if (inUse.visible) pop(inUse, t, 1.0);
  wcQ.position.set(TX - 0.9, 2.0, 3.0); pop(wcQ, t, 1.7);
  const u = ease(clamp(t / 3.6)); look(lerp(TX + 5.0, TX + 4.4, u), lerp(2.4, 2.6, u), lerp(10.5, 10, u), TX - 1.3, 1.9, 1.0, 46);
  return S;
}
function shot5(t) { // 公園は満室。犬の散歩のおじさんが引き返す
  reset(); lift(100); pop(fullP, t, 0.5);
  const back = clamp((t - 1.6) / 0.5); const z = 5 - clamp(t / 1.6) * 1.6 + back * clamp((t - 2.1) / 1.2) * 2.2;
  WALKER.position.set(PX + 3, 0, z); WALKER.rotation.y = lerp(Math.PI, 0, back); poseWalk(WALKER, t * 7, t > 1.5 && t < 2.1 ? 0 : 1);
  DOG.position.set(PX + 3.8, 0, z + (back > 0.5 ? 0.6 : -0.6)); DOG.rotation.y = lerp(Math.PI / 2, -Math.PI / 2, back); dogWalk(DOG, t * 9);
  walkerQ.position.set(PX + 3, 2.4, z); pop(walkerQ, t, 1.6);
  const u = ease(clamp(t / 3.3)); look(lerp(PX + 9, PX + 8, u), lerp(3.4, 3.8, u), lerp(12, 11, u), PX + 0.5, 1.2, -1, 52);
  return S;
}
function shot6(t) { // コインパーキングは、なぜか朝まで満車
  reset(); lift(100); pop(pFull, t, 0.3); pTime.visible = true; pop(pTime, t, 0.9);
  CARS.forEach((c, i) => { c.position.y = Math.sin(t * 3 + i) * 0.0; });
  const u = ease(clamp(t / 2.7)); look(lerp(CX + 6, CX + 3, u), lerp(5, 6, u), lerp(12, 13, u), CX, 1.6, -1.5, 52);
  setHud('時刻', t < 1.2 ? '夜 22:00' : '朝 5:00', fade(t, 0.1, 2.6, 0.15));
  return S;
}
function shot7(t) { // ネットカフェの店員は、見回りのたびに咳払い
  reset(); lift(100); const x = NX - 7 + t * 3.6; CLERK.position.set(x, 0, 0.6); CLERK.rotation.y = Math.PI / 2; poseWalk(CLERK, t * 8);
  BOOTHS.forEach(b => { const u = clamp((x - b.x + 0.6) / 0.35); b.cough.visible = u > 0; if (u > 0) pop(b.cough, x - b.x + 0.6, 0, 0.35); });
  const u = ease(clamp(t / 3.3)); look(lerp(NX - 2, NX + 1, u), 3.2, 9.5, lerp(NX - 2, NX + 1.5, u), 1.2, -1, 56);
  return S;
}
function shot8(t) { // 民泊の大家は、2時間だけの予約に首をかしげる
  reset(); lift(80); pop(mpQ, t, 1.3); OOYA.userData.head.rotation.z = 0.35 * ease(clamp((t - 1.2) / 0.5));
  OOYA.userData.arms[1].rotation.x = -1.3;
  const u = ease(clamp(t / 3.4)); look(lerp(MX + 1.6, MX + 1.2, u), lerp(3.4, 3.2, u), lerp(12.5, 11.5, u), MX - 0.4, 2.4, 0, 50);
  return S;
}
function shot9(t) { // ビジホの隣の部屋では、出張の人が眠れない
  reset(); lift(0); BE.visible = false; poseClear(SALARY); SALARY.position.set(BX - 2.5, 0.5, -0.2); poseSit(SALARY); SALARY.position.y = 0.12; SALARY.rotation.y = 0;
  SALARY.userData.arms.forEach((a, i) => { a.rotation.x = -2.6; a.rotation.z = (i ? -1 : 1) * 0.5; });
  wallShake.position.x = Math.sin(t * 30) * 0.015 * (Math.sin(t * 2.2) > 0 ? 1 : 0);
  pop(zzz, t, 0.9); nextHeart.visible = true; nextHeart.position.y = 1.7 + Math.sin(t * 3) * 0.12;
  const u = ease(clamp(t / 3.1)); look(lerp(BX - 1.6, BX - 1.0, u), 1.9, lerp(10.5, 10, u), BX - 1.1, 1.5, -0.5, 50);
  return S;
}
function detPose(p, x, z, ry, k = 1) { poseClear(p); p.position.set(x, 0, z); p.rotation.y = ry; aim(p, k); }
function shot10(t) { // でも一番困ったのは、浮気調査の探偵
  reset(); lift(120); castleAt(1); lot.visible = lotSign.visible = true; FRONT.visible = false;
  DET.visible = true; detPose(DET, -6.2, 9.6, Math.PI * 0.85, 0.3 + 0.7 * ease(clamp(t / 1))); DET.userData.head.rotation.y = Math.sin(t * 2) * 0.3;
  const u = ease(clamp(t / 2.7)); look(lerp(-3.2, -3.6, u), 2.2, lerp(5.2, 5.8, u), -6.3, 1.7, 9.4, 46);
  setTop('浮気調査の探偵', 'ピンチ', fade(t, 0.3, 2.6, 0.2), GOLD);
  return S;
}
function shot11(t) { // 前はラブホに入る2人を撮れば、ほぼ決まり（回想）
  reset(); lift(60); pole.visible = false; castleOn(1); FRONT.rotation.y = Math.PI; FRONT.position.set(0, 0, lerp(5.2, 2.6, clamp(t / 1.6))); walkCouple(FRONT, t); FRONT.visible = t < 1.7;
  DET.visible = true; detPose(DET, -6.2, 9.6, Math.PI * 0.85);
  const f = (t > 0.9 && t < 1.05) || (t > 1.3 && t < 1.42); camFlash.intensity = f ? 30 : 0; camFlash.position.set(-6, 2, 9); el.flash.style.opacity = f ? 0.25 : 0;
  photo.position.set(-3.0, 5.2, 7.0); pop(photo, t, 1.6, 0.4, 3.4);
  hemi.intensity = 1.0;
  const u = ease(clamp(t / 3.1)); look(lerp(-9.5, -10, u), lerp(2.8, 3.2, u), lerp(17, 18, u), -1.5, 3.6, 2, 50);
  setTop('ラブホの出入りの写真', '単独でも有力な証拠', fade(t, 0.3, 3.0, 0.2), GOLD);
  return S;
}
function shot12(t) { // ビジホだと、出張ですで逃げられる
  reset(); lift(170); BECOUPLE.position.set(BX - 0.6, 0, -15.8); BECOUPLE.rotation.y = 0.3; walkCouple(BECOUPLE, 0, 0);
  pop(excuse, t, 0.4);
  DET3.visible = true; detPose(DET3, BX + 3.2, -12.6, -Math.PI * 0.75, clamp(1 - (t - 1.2) / 0.5)); detQ.position.set(BX + 3.2, 2.9, -12.6); pop(detQ, t, 1.4);
  const u = ease(clamp(t / 2.7)); look(lerp(BX + 6.5, BX + 6, u), 2.4, lerp(-2.5, -3.2, u), BX + 0.2, 3.4, -15.5, 48);
  setTop('ふつうのホテルの写真', 'それだけでは弱い', fade(t, 0.3, 2.6, 0.2), GOLD);
  return S;
}
function shot13(t) { // 探偵は、多目的トイレの前で3時間張り込むハメに
  reset(); lift(110); bush.visible = true; inUse.visible = true; DET2.visible = true; poseClear(DET2); DET2.position.set(TX + 3.2, 0, 4.9); DET2.rotation.y = Math.PI * 1.08; aim(DET2, 1);
  DET2.position.y = -0.25; DSWEAT.userData.set(clamp((t - 1.2) / 0.6), t);
  wcQ.position.set(TX - 0.9, 2.0, 3.0); wcQ.visible = true; wcQ.scale.set(0.9, 0.9 * wcQ.userData.ar, 1);
  const h = clamp(t / 3.2) * 3; const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  setHud('張り込み', `${hh}時間${String(mm).padStart(2, '0')}分`, fade(t, 0.1, 3.5, 0.15), { mono: true });
  const u = ease(clamp(t / 3.5)); look(lerp(TX + 7.5, TX + 6.8, u), lerp(2.4, 2.8, u), lerp(10.5, 11.5, u), TX + 0.8, 1.4, 1.5, 50);
  return S;
}
function shot14(t) { // 消えたお城の売上は、推計で年7,114億円
  reset(); lift(60); coins(clamp(t / 2.4)); coinSpark.set(clamp((t - 1.6) / 1.8));
  yearL.visible = true; pop(yearL, t, 1.6);
  const u = ease(clamp(t / 3.5)); look(GX, lerp(5, 7.5, u), lerp(13, 15.5, u), GX, 2.6, -3, 50);
  const v = Math.round(7114 * easeOut(clamp((t - 0.2) / 1.2)));
  setTop('ラブホの売上（推計・2014年度）', `年${v.toLocaleString('en-US')}億円`, fade(t, 0.2, 3.4, 0.2), GOLD);
  return S;
}
function shot15(t) { // お城は、人目を気にせず2人になれる場所だった
  reset(); lift(170); castleOn(1); heartsP.set((t * 0.3) % 1); FRONT.visible = false;
  SCATTER.forEach((c, i) => { c.visible = true; const d = Math.max(1.0, 12 - t * c.userData.sp * 1.4); c.position.set(Math.cos(c.userData.a) * d * 0.7, 0, Math.sin(c.userData.a) * d * 0.25 + 3.4); c.rotation.y = -Math.PI / 2 - c.userData.a; walkCouple(c, t); });
  const u = ease(clamp(t / 3.4)); look(0, lerp(9, 7, u), lerp(30, 28, u), 0, 2.8, 0, 46);
  return S;
}
function shot16(t) { // トイレも公園も、本来の人が使えていた（昼）
  reset(); lift(220); S.background.set('#9fc6ea'); hemi.intensity = 1.5; inUse.visible = false; vacant.visible = true; pop(vacant, t, 0.2);
  const e = clamp((t - 0.6) / 2.2); WC.position.set(TX - 0.9 + e * 0.9, 0, 3.0 - e * 1.7); WC.rotation.y = Math.PI + 0.35 * (1 - e);
  const u = ease(clamp(t / 3.2)); look(lerp(TX + 5.0, TX + 4.4, u), lerp(2.4, 2.6, u), lerp(10.5, 10, u), TX - 1.3, 1.9, 1.0, 46);
  return S;
}
function shot17(t) { // 結果：一番喜んだのは、浮気している人だった
  reset(); lift(170); BECOUPLE.visible = false;
  UWAKI.visible = UWAKIW.visible = true; UWAKI.position.set(BX - 1.0, 0, -15.6); UWAKIW.position.set(BX - 0.3, 0, -15.6); UWAKI.rotation.y = UWAKIW.rotation.y = 0.35;
  UWAKI.userData.arms[0].rotation.set(-2.6, 0, -0.3);
  noProof.position.set(BX - 0.6, 3.1, -15.2); pop(noProof, t, 0.5); peace.position.set(BX - 2.0, 2.3, -15.0); pop(peace, t, 1.1);
  DET3.visible = true; poseClear(DET3); DET3.position.set(BX + 3.2, 0, -12.6); DET3.rotation.y = -Math.PI * 0.75; DET3.userData.head.rotation.x = 0.4; DET3.userData.arms.forEach(a => a.rotation.z = (a === DET3.userData.arms[0] ? -0.05 : 0.05)); DSWEAT3.userData.set(1, t);
  const u = ease(clamp(t / 3.4)); look(lerp(BX + 6.0, BX + 5.4, u), 2.4, lerp(-2.6, -3.4, u), BX + 0.2, 3.4, -15, 48);
  setTop('一番喜んだのは', '浮気している人', fade(t, 0.3, 3.3, 0.2), GREEN);
  return S;
}
function shot18(t) { // 質問。最後は冒頭と同じ構図（お城が消えたまま）でループ
  reset(); lift(0); castleAt(1); lot.visible = lotSign.visible = true; frontPose(t, 1); FRONT.rotation.y = Math.sin(t * 2) * 0.4;
  frontQ.position.set(1.0, 2.7, 4.2); frontQ.visible = true; frontQ.userData.size(1.5);
  castleCam(0.85); lotLight.intensity = 14;
  return S;
}

const SUBS = [
  [2.7, 6.0, '一夜を華やかにしてくれる、<br>大人のお城。'],
  [6.1, 8.8, 'ある日、そのお城が<br>全国から消えた。'],
  [8.9, 11.7, '城を追われたカップルは、<br>街に散らばる。'],
  [11.8, 15.4, '多目的トイレは使用中のまま。<br>車いすの人が入れない。'],
  [15.5, 18.8, '公園は満室。犬の散歩の<br>おじさんが引き返す。'],
  [18.9, 21.5, 'コインパーキングは、<br>なぜか朝まで満車。'],
  [21.6, 24.8, 'ネットカフェの店員は、<br>見回りのたびに咳払い。'],
  [24.9, 28.2, '民泊の大家は、2時間だけの<br>予約に首をかしげる。'],
  [28.3, 31.4, 'ビジホの隣の部屋では、<br>出張の人が眠れない。'],
  [31.5, 34.1, 'でも一番困ったのは、<br>浮気調査の探偵。'],
  [34.2, 37.3, '前はラブホに入る2人を<br>撮れば、ほぼ決まり。'],
  [37.4, 40.1, 'ビジホだと、<br>出張ですで逃げられる。'],
  [40.2, 43.7, '探偵は、多目的トイレの前で<br>3時間張り込むハメに。'],
  [43.8, 47.3, '消えたお城の売上は、<br>推計で年7,114億円。'],
  [47.4, 50.7, 'お城は、人目を気にせず<br>2人になれる場所だった。'],
  [50.8, 54.0, 'おかげでトイレも公園も、<br>本来の人が使えていた。'],
  [54.1, 57.6, '結果：一番喜んだのは、<br>浮気している人だった。'],
  [57.7, 60.6, 'ラブホが消えたら、<br>一番困るのは誰？'],
];

const shots = [
  { a: 0, b: 2.7, f: shot0 }, { a: 2.7, b: 6.1, f: shot1 }, { a: 6.1, b: 8.9, f: shot2 }, { a: 8.9, b: 11.8, f: shot3 },
  { a: 11.8, b: 15.5, f: shot4 }, { a: 15.5, b: 18.9, f: shot5 }, { a: 18.9, b: 21.6, f: shot6 }, { a: 21.6, b: 24.9, f: shot7 },
  { a: 24.9, b: 28.3, f: shot8 }, { a: 28.3, b: 31.5, f: shot9 }, { a: 31.5, b: 34.2, f: shot10 }, { a: 34.2, b: 37.4, f: shot11 },
  { a: 37.4, b: 40.2, f: shot12 }, { a: 40.2, b: 43.8, f: shot13 }, { a: 43.8, b: 47.4, f: shot14 }, { a: 47.4, b: 50.8, f: shot15 },
  { a: 50.8, b: 54.1, f: shot16 }, { a: 54.1, b: 57.7, f: shot17 }, { a: 57.7, b: 61.6, f: shot18 }, { a: 61.6, b: 65.6, f: endCard },
];
S.traverse(o => { if (o.isSprite) { o.material.depthTest = true; o.renderOrder = 0; } });
const _bg = S.background.clone();
const shotsBg = shots.map(s => s.f === endCard || s.f === shot16 ? s : { ...s, f: (t, T) => { S.background.copy(_bg); return s.f(t, T); } });
runStory({
  shots: shotsBg, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0655',
    v2: true,
    hookLine: '大人のお城が、全国から消えた。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもラブホが消えたら？',
    titleHtml: 'もしも<br>ラブホが<br>消えたら？',
    mood: 'mystery', seed: 655, hits: [0.45, 43.8, 54.1], risers: [31.5, 50.8], impacts: [6.6, 11.8, 31.5, 35.8, 44.2, 54.1],
    sfx: [[0.45, 'poof'], [6.6, 'poof'], [9.2, 'whoosh'], [12.8, 'buzz'], [16.1, 'bubble'], [22.4, 'whoosh'], [26.2, 'bubble'], [35.1, 'whoosh'], [38.0, 'bubble'], [45.4, 'whoosh'], [54.6, 'poof']],
    narr: { 'お城': 'おしろ', '城を': 'しろを', '一夜': 'いちや', '7,114億円': 'ななせんひゃくじゅうよんおくえん', '咳払い': 'せきばらい', '民泊': 'みんぱく', '大家': 'おおや', '結果：': '結果、', '張り込む': 'はりこむ', '人目': 'ひとめ', '本来': 'ほんらい', '浮気': 'うわき', 'ビジホ': 'ビジホ' },
    ask: 'ラブホが消えたら、一番困るのは誰？',
    caption: 'もしもラブホが消えたら？\n\n一夜を華やかにしてくれる、大人のお城。ある日、そのお城が全国から消えた。\n城を追われたカップルは、多目的トイレ・公園・コインパーキング・ネットカフェ・民泊・ビジネスホテルへ。\n車いすの人は多目的トイレに入れず、犬の散歩のおじさんは公園で引き返し、ビジホの隣の部屋では出張の人が眠れない。\n\nでも一番困ったのは、浮気・不倫調査の探偵。ラブホに2人で入る写真は単独でも有力な証拠になりやすいのに、ふつうのホテルだと 出張です で逃げられる。\n消えたお城の売上は、推計で年7,114億円（2014年度）。\n\n結果：一番喜んだのは、浮気している人だった。\n\nラブホが消えたら、一番困るのは誰？ コメントで教えて。\n\n※風刺ネタです。ホテル名・人物はすべて架空です\n出典：警察庁「令和7年における風俗営業等の現状と風俗関係事犯等の取締り状況について」（ラブホテル等の届出 4,425件・2025年末）／矢野経済研究所の推計（ラブホテル市場 7,114億円・2014年度・利用料ベース）／弁護士ドットコム「不倫の証拠」',
    hashtags: ['もしもラボ', 'もしも', 'ラブホ', '浮気調査', '探偵'],
    endStats: [['全国のラブホ（届出）', '4,425軒', '2025年末・警察庁'], ['ラブホの売上', '年7,114億円', '推計・2014年度'], ['一番喜んだのは', '浮気している人', 'かもしれない']],
    sources: '出典：警察庁 風俗営業等の現状（2025年末）／矢野経済研究所の推計（2014年度）／弁護士ドットコム',
  },
});
