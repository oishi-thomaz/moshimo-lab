import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma } from '../lib.js';
import { stage, makeBar, makeCoins, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// 特別会計：国のもう1つの財布、26年でいくら使った？（2000〜2025年度）
// 数字
//   歳出決算額（総額）：財務省「財政統計」第8表 特別会計別歳入歳出決算（単位千円）。2000〜2024年度
//     2000 305.8 / 2001 363.3 / 2002 373.9 / 2003 357.7 / 2004 376.0 / 2005 401.2 / 2006 450.6 / 2007 353.3 / 2008 359.2 / 2009 348.1 /
//     2010 345.1 / 2011 376.5 / 2012 377.0 / 2013 382.7 / 2014 390.2 / 2015 386.2 / 2016 395.4 / 2017 374.2 / 2018 368.9 / 2019 374.2 /
//     2020 404.5 / 2021 441.1 / 2022 432.4 / 2023 412.5 / 2024 407.4（兆円）
//   2025年度：財務省「令和7年度特別会計の決算概要」（2026年7月31日）の支出済歳出額の合計 412万6,547億円 ≒ 412.7兆円
//   26年度分の合計 ≒ 9,969.9兆円 → 約9,970兆円（このファイルで計算）
//   2025年度予算：特別会計の歳出総額429.5兆円・純計額204.1兆円（国債の借換え136.2兆円、会計間・勘定間のやりとり89.2兆円）、一般会計115.5兆円（財務省「特別会計について（令和7年度予算）」「令和7年度予算のポイント」）
//   2025年度の特別会計の数：14（決算概要の一覧）
//   剰余金：2025年度決算上の剰余金 計16.2兆円（国債整理基金を除く。決算概要）
//   問題になった使い方（公的資料で金額を確認できたもののみ。不正と確定したものではないので「問題になった」「批判された」とする）
//     社会保険庁：大量購入に係る監修料を職員606人が受領、約4.9億円（平成11〜15年度）（厚生労働省「これまでの各種事案への対応状況」）
//     私のしごと館：建設費約581億円（土地取得含む）、財源は雇用保険。2010年8月までに廃止と閣議決定（厚生労働省 審議会資料 2009年12月）
//     道路整備特別会計：道路ミュージカルの上演経費 約5,500万円（平成18年度。政府答弁書 2008年5月23日）
//   たとえ：塩川正十郎 元財務大臣「母屋でおかゆ、離れですき焼き」（国会答弁として広く知られる。東洋経済オンライン 2009年）
// 方針：財務省が隠している等の根拠のない推測は入れない。総額には重複が含まれることを必ず言う。

const GOLD = '#ffe08a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';
const YEARS = Array.from({ length: 26 }, (_, i) => 2000 + i);
const VAL = [305.8, 363.3, 373.9, 357.7, 376.0, 401.2, 450.6, 353.3, 359.2, 348.1, 345.1, 376.5, 377.0, 382.7, 390.2, 386.2, 395.4, 374.2, 368.9, 374.2, 404.5, 441.1, 432.4, 412.5, 407.4, 412.7];
const TOTAL = 9969.9;

// ---------- wallets ----------
function makeWallet(color, w, h, d, label) {
  const g = new THREE.Group();
  const body = box(w, h, d, mat(color)); body.position.y = h / 2; g.add(body);
  const flap = box(w * 1.01, h * 0.42, d * 1.02, mat(new THREE.Color(color).multiplyScalar(0.8))); flap.position.y = h * 0.8; g.add(flap);
  const clasp = box(w * 0.12, h * 0.16, 0.05, mat('#e8c25a', { emissive: 0x3a2a00 })); clasp.position.set(0, h * 0.62, d / 2 + 0.03); g.add(clasp);
  const stitch = box(w * 0.9, 0.02, 0.02, mat('#ffffff')); stitch.position.set(0, h * 0.58, d / 2 + 0.02); g.add(stitch);
  const lab = makeLabel(label, { sx: Math.max(2.4, w * 0.95), size: 64, stroke: 8 }); lab.position.set(0, h + 0.7, 0); g.add(lab);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  stage.add(g); return g;
}
const wGen = makeWallet('#3f7fbf', 1.6, 1.2, 0.5, '一般会計（母屋）'); wGen.position.set(-2.5, 0.3, 0);
const wSp = makeWallet('#c0483c', 3.2, 2.4, 0.9, '特別会計（離れ）'); wSp.position.set(1.1, 0.3, 0);
const ACC = ['年金', '国債整理基金', '交付税', '財政投融資', 'エネルギー', '労働保険', '外為', '子ども・子育て', '食料', '自動車安全', '特許', '震災復興', '地震再保険', '国有林野'];
const accTiles = ACC.map((name, i) => { const s = makeLabel(name, { sx: 1.25, size: 50, bg: 'rgba(20,24,34,.85)', w: 512, h: 128 }); const a = (i / ACC.length) * Math.PI * 2; s.position.set(0.5 + Math.cos(a) * 2.9, 1.9 + Math.sin(a) * 2.3, 0.6); stage.add(s); return s; });
const walletGroup = [wGen, wSp];
// ---------- two bars: general vs special (2025 budget) ----------
const HB = 5.2 / 429.5;
const bGen = makeBar({ color: '#3f7fbf', label: '一般会計', x: -1.8, w: 2.0, d: 2.0, nameTop: true });
const bSp = makeBar({ color: '#c0483c', label: '特別会計', x: 1.8, w: 2.0, d: 2.0, nameTop: true });
// ---------- 26 yearly bars ----------
const HY = 5.0 / 450.6;
const ybars = YEARS.map((y, i) => makeBar({ color: '#c0483c', x: -6.25 + i * 0.5, w: 0.38, d: 0.6 }));
const ylabs = [0, 6, 25].map(i => { const s = makeLabel(`${YEARS[i]}年度`, { sx: 2.4, size: 64, w: 512, h: 128, stroke: 6 }); s.position.set(-6.25 + i * 0.5, -0.35, 1.0); s.material.depthTest = false; stage.add(s); return s; });
const yvals = [0, 6, 25].map(i => { const s = makeLabel(`${VAL[i]}兆`, { sx: 1.8, size: 64, stroke: 8, w: 512, h: 128, color: GOLD }); s.position.set(-6.25 + i * 0.5, VAL[i] * HY + 0.85, 0); stage.add(s); return s; });
// ---------- total tower ----------
const tower = makeBar({ color: '#e0b04a', x: 0, w: 2.4, d: 2.4 });
const KEI = makeLabel('1京円', { sx: 1.6, size: 60, color: '#ffffff', stroke: 6 }); stage.add(KEI);
const keiLine = box(4.2, 0.04, 0.04, mat('#ffffff', { transparent: true, opacity: 0.8 })); stage.add(keiLine);
// ---------- case 1: books + people ----------
const books = new THREE.Group(); stage.add(books);
{ const r = rng(9); const cols = ['#d9534f', '#4f8fd9', '#e0b04a', '#5cb85c', '#ffffff']; for (let i = 0; i < 90; i++) { const b = box(0.5, 0.12, 0.36, mat(cols[i % cols.length])); const st = i % 9; b.position.set(-3 + (st % 3) * 0.7 + (r() - .5) * 0.05, 0.36 + Math.floor(i / 9) * 0.125, -1.2 + Math.floor(st / 3) * 0.6); b.rotation.y = (r() - .5) * 0.2; books.add(b); } }
const crowd = makeCrowd(60, 7, { w: 6.5, d: 3.4, x: 1.8, z: 0.4 });
// ---------- case 2: building closed ----------
const hall = new THREE.Group(); stage.add(hall);
{ const b = box(5.0, 2.6, 2.6, mat('#d8d4cc')); b.position.y = 1.6; hall.add(b); const roof = box(5.4, 0.25, 3.0, mat('#8a8f99')); roof.position.y = 3.0; hall.add(roof); for (let i = 0; i < 5; i++) { const w = box(0.7, 0.9, 0.05, mat('#9fd6ff', { emissive: 0x1a3a50 })); w.position.set(-2 + i, 1.9, 1.33); hall.add(w); } const door = box(1.0, 1.2, 0.05, mat('#3a3f48')); door.position.set(0, 0.9, 1.33); hall.add(door); }
const hallSign = makeLabel('私のしごと館', { sx: 2.6, size: 64, bg: 'rgba(20,24,34,.85)' }); hallSign.position.set(0, 3.7, 1.0); hall.add(hallSign);
const closed = makeLabel('廃止', { sx: 1.6, size: 80, bg: 'rgba(200,40,40,.9)' }); closed.position.set(0, 1.6, 1.6); hall.add(closed);
// ---------- case 3: road musical ----------
const theater = new THREE.Group(); stage.add(theater);
{ const st = box(5, 0.5, 3, mat('#5a3b2a')); st.position.set(0, 0.55, -0.5); theater.add(st); const cur = box(6, 3.4, 0.2, mat('#8a1c24')); cur.position.set(0, 2.0, -2.0); theater.add(cur); const road = box(4.4, 0.02, 0.8, mat('#3a3d44')); road.position.set(0, 0.82, 0); theater.add(road); for (let i = 0; i < 5; i++) { const l = box(0.4, 0.02, 0.08, mat('#ffffff')); l.position.set(-1.6 + i * 0.8, 0.84, 0); theater.add(l); } }
const theaterSign = makeLabel('道路ミュージカル', { sx: 2.8, size: 60, bg: 'rgba(20,24,34,.85)' }); theaterSign.position.set(0, 4.1, -1.8); theater.add(theaterSign);
const actors = makeCrowd(5, 3, { w: 3.2, d: 0.6, x: 0, z: -0.4 }); actors.g.position.y = 0.8; theater.add(actors.g);
const spot = new THREE.SpotLight(0xfff2c0, 0, 20, 0.5, 0.4); spot.position.set(0, 7, 4); spot.target.position.set(0, 0.8, 0); stage.add(spot); stage.add(spot.target);
// ---------- 母屋と離れ ----------
function makeHouse(w, h, d, wall, roofC) { const g = new THREE.Group(); const b = box(w, h, d, mat(wall)); b.position.y = h / 2; g.add(b); const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.6, 4), mat(roofC)); roof.rotation.y = Math.PI / 4; roof.position.y = h + h * 0.3; g.add(roof); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); stage.add(g); return g; }
const omoya = makeHouse(3.2, 1.8, 2.4, '#d8cbb0', '#6b4f3a'); omoya.position.set(-2.2, 0.3, 0);
const hanare = makeHouse(1.8, 1.2, 1.6, '#f2d48a', '#b8442f'); hanare.position.set(2.4, 0.3, 0.4);
const okayu = makeLabel('母屋：おかゆ', { sx: 2.4, size: 60, bg: 'rgba(20,24,34,.85)' }); okayu.position.set(-2.2, 4.0, 0); stage.add(okayu);
const sukiyaki = makeLabel('離れ：すき焼き', { sx: 2.6, size: 60, bg: 'rgba(180,60,40,.9)' }); sukiyaki.position.set(2.4, 3.0, 0.4); stage.add(sukiyaki);
const glow = new THREE.PointLight(0xffb060, 0, 6, 1.5); glow.position.set(2.4, 1.2, 1.6); stage.add(glow);
// ---------- surplus coins ----------
const SPILE = []; for (let i = 0; i < 9; i++) SPILE.push(makeCoins(-2.0 + (i % 3) * 1.15, -0.8 + Math.floor(i / 3) * 1.1, 18));
const surplusLab = makeLabel('使わずに残ったお金', { sx: 3.2, size: 60, color: GOLD, stroke: 6 }); surplusLab.position.set(0.2, 3.4, 0); stage.add(surplusLab);
// ---------- double counting bar ----------
const HD = 5.2 / 429.5;
const dNet = makeBar({ color: '#c0483c', x: 0, w: 2.4, d: 2.4 });
const dDup = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 2.4), new THREE.MeshLambertMaterial({ color: '#8a8f99', transparent: true, opacity: 0.55 })); dDup.geometry.translate(0, 0.5, 0); stage.add(dDup);
const dupLab = makeLabel('重複・借り換え', { sx: 2.6, size: 60, stroke: 6 }); stage.add(dupLab);
const netLab = makeLabel('実際に外へ', { sx: 2.2, size: 60, stroke: 6, color: GOLD }); stage.add(netLab);

const GROUPS = { wallets: [wGen, wSp, ...accTiles], two: [bGen.g, bSp.g], years: [...ybars.map(b => b.g), ...ylabs, ...yvals], tower: [tower.g, KEI, keiLine], books: [books, crowd.g], hall: [hall], theater: [theater], houses: [omoya, hanare, okayu, sukiyaki], surplus: [...SPILE.map(s => s.g), surplusLab], dup: [dNet.g, dDup, dupLab, netLab] };
function mode(m) { for (const k in GROUPS) GROUPS[k].forEach(o => { o.visible = k === m; }); spot.intensity = m === 'theater' ? 60 : 0; glow.intensity = m === 'houses' ? 6 : 0; }

const SUBS = [
  [3.0, 6.5, '国の財布は、<br>実は2つある。'],
  [6.6, 10.5, '税金で回す一般会計と、<br>目的別の特別会計。'],
  [10.6, 14.4, '特別会計は、年金や<br>国債の返済など14個。'],
  [14.6, 18.5, '2025年度予算で、<br>429.5兆円。'],
  [18.6, 22.4, '一般会計の<br>約3.7倍。'],
  [22.6, 26.5, '2000年度から、<br>1年ずつ見ていく。'],
  [26.6, 30.5, '2000年度は、<br>305.8兆円。'],
  [30.6, 34.5, '一番多いのは2006年度、<br>450.6兆円。'],
  [34.6, 38.4, '2025年度は、<br>412.7兆円。'],
  [38.6, 42.5, '26年分を<br>全部足すと…'],
  [42.6, 46.4, '約9,970兆円。<br>1京円まであと約30兆円。'],
  [46.6, 50.5, 'その使い道で、<br>問題になったこともある。'],
  [50.6, 54.5, '国が大量に買った本の<br>監修料を、職員606人が受領。'],
  [54.6, 58.4, '合計約4.9億円<br>（1999〜2003年度）。'],
  [58.6, 62.4, '雇用保険の約581億円で<br>建てた施設は、廃止に。'],
  [62.6, 66.4, '道路のお金で、ミュージカル<br>に約5,500万円。'],
  [66.6, 70.4, '元財務大臣の例えは、<br>母屋はおかゆ、離れはすき焼き。'],
  [70.6, 74.4, '2025年度も、使わずに<br>残ったお金が16.2兆円。'],
  [74.6, 78.5, 'ただし総額の半分近くは、<br>会計どうしのやりとり。'],
  [78.6, 82.4, '重複を除くと、2025年度は<br>約204兆円（予算）。'],
  [82.5, 89.8, '結果：26年で約9,970兆円。<br>毎年約200兆円が離れから出る。'],
  [89.9, 92.4, 'この数字は全部、<br>財務省の公開データ。'],
  [92.5, 95.6, 'この金額、<br>知ってた？'],
];

function walletShot(t, T, hook) {
  lift(hook ? 300 : 240); mode('wallets');
  const breathe = 1 + Math.sin(T * 2) * 0.015; wSp.scale.setScalar(breathe);
  const show = clamp((T - 10.6) / 1.4);
  accTiles.forEach((s, i) => { const k = easeBack(clamp(show * 1.6 - i * 0.04)); s.visible = k > 0.01; s.scale.set(1.25 * k, 1.25 * k * 0.25, 1); });
  walletGroup.forEach(g => { g.children[g.children.length - 1].visible = !hook; });
  return show;
}
function shot0(t, T) { walletShot(t, T, true); const u = ease(t / 2.5); look(lerp(0.0, -0.2, u), 3.4, lerp(17.5, 17, u), -0.2, 1.4, 0, 50); el.title.style.opacity = 1; return stage; }
function shotWallets(t, T) {
  walletShot(t, T, false); const u = ease(t / 11.9); look(lerp(-0.2, 0.3, u), lerp(3.4, 3.6, u), lerp(17, 17.6, u), lerp(-0.2, 0.3, u), 1.8, 0, 50);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  if (T >= 6.6 && T < 10.6) setTop('国の財布', '一般会計と特別会計', fade(T, 6.6, 10.6, 0.2));
  else if (T >= 10.6) setTop('特別会計の数（2025年度）', countUp(T - 10.6, 14, 0.2, 1.0) + '個', fade(T, 10.6, 14.4, 0.2), GOLD);
  else setTop('', '', 0);
  return stage;
}
function shotTwo(t, T) {
  lift(280); mode('two');
  const g = easeOut(clamp((t - 0.3) / 1.6));
  bGen.setH(115.5 * HB * g, g > 0.05 ? (115.5 * g).toFixed(1) + '兆' : ''); bSp.setH(429.5 * HB * g, g > 0.05 ? (429.5 * g).toFixed(1) + '兆' : '');
  const u = ease(t / 8); look(lerp(-0.4, 0.4, u), lerp(4.6, 4.4, u), lerp(14.5, 13.8, u), 0, 2.8, 0, 50);
  if (t < 4.1) setTop('特別会計の歳出総額（2025年度予算）', countUp(t, 4295, 0.3, 1.6) / 10 + '兆円', fade(t, 0.15, 4.1, 0.2), RED);
  else setTop('一般会計（115.5兆円）とくらべると', '約3.7倍', fade(t, 4.1, 8, 0.2), GOLD);
  return stage;
}
function yearN(t) { // bars grow in step with the subtitles: 2000 at 4.2s, 2006 by 8.2s, 2025 by 12.2s
  if (t < 3.6) return 0;
  if (t < 6.0) return 1.2 * easeOut((t - 3.6) / 2.4);
  if (t < 9.6) return 1.2 + 5.8 * ((t - 6.0) / 3.6);
  return Math.min(26, 7 + 19 * easeOut(clamp((t - 9.6) / 3.0)));
}
function shotYears(t, T) {
  lift(240); mode('years');
  const n = yearN(t);
  ybars.forEach((b, i) => { const k = clamp(n - i); b.setH(VAL[i] * HY * easeOut(k), ''); b.mat.color.set(i === 6 ? '#ff6a4f' : i === 25 ? '#e0b04a' : '#c0483c'); });
  ylabs.forEach((s, j) => { const i = [0, 6, 25][j]; s.visible = n > i + 0.3; });
  yvals.forEach((s, j) => { const i = [0, 6, 25][j]; s.visible = n > i + 0.8; });
  let cx, cz;
  if (t < 8.2) { cx = -5.4; cz = 10; }
  else if (t < 12.2) { const v = ease((t - 8.2) / 1.6); cx = lerp(-5.4, -3.6, v); cz = lerp(10, 11, v); }
  else { const v = ease((t - 12.2) / 2.2); cx = lerp(-3.6, 0.2, v); cz = lerp(11, 26, v); }
  look(cx + 0.4, lerp(3.6, 5.0, clamp((cz - 10) / 16)), cz, cx, 2.4, 0, 50);
  if (cz < 18) ylabs.forEach(s => { s.visible = false; });
  if (t < 4.2) setTop('特別会計の歳出（決算）', '2000年度から', fade(t, 0.15, 4.2, 0.2));
  else if (t < 8.2) setTop('2000年度の歳出（決算）', '305.8兆円', fade(t, 4.2, 8.2, 0.2), GOLD);
  else if (t < 12.2) setTop('一番多い2006年度（決算）', '450.6兆円', fade(t, 8.2, 12.2, 0.2), RED);
  else setTop('2025年度の歳出（決算）', '412.7兆円', fade(t, 12.2, 16, 0.2), GOLD);
  return stage;
}
function shotTower(t, T) {
  lift(260); mode('tower');
  const g = easeOut(clamp((t - 0.6) / 3.6)); const H = 6.0 / 10000;
  tower.setH(TOTAL * H * g, g > 0.98 ? '約9,970兆円' : '');
  KEI.position.set(2.2, 10000 * H + 0.3, 0); keiLine.position.set(0, 10000 * H + 0.3, 0);
  const u = ease(t / 8); look(lerp(0, 0.6, u), lerp(3.8, 4.4, u), lerp(13, 14, u), 0, 3.2, 0, 50);
  if (t < 4.2) setTop('26年分の合計（2000〜2025年度・決算）', '約' + comma(countUp(t, 9970, 0.6, 3.6)) + '兆円', fade(t, 0.15, 4.2, 0.2), GOLD);
  else setTop('1京円まで', 'あと約30兆円', fade(t, 4.2, 8, 0.2), RED);
  return stage;
}
function shotBooks(t, T) {
  lift(240); mode('books');
  const k = easeOut(clamp((t - 0.4) / 2)); books.children.forEach((b, i) => { b.visible = i < 90 * k; });
  crowd.people.forEach((p, i) => { p.visible = i < 60 * clamp((t - 2.5) / 2); });
  const u = ease(t / 12); look(lerp(-1, 1, u), lerp(4.4, 4.0, u), lerp(10, 9, u), 0, 1.0, 0, 50);
  if (t < 4.2) setTop('使い道で問題になった例', '3つ', fade(t, 0.15, 4.2, 0.2));
  else if (t < 8.2) setTop('監修料を受け取った社会保険庁の職員', countUp(t - 4.2, 606, 0.1, 1.2) + '人', fade(t, 4.2, 8.2, 0.2), RED);
  else setTop('受け取った監修料（1999〜2003年度・厚労省）', '約' + (countUp(t - 8.2, 49, 0.1, 1.0) / 10) + '億円', fade(t, 8.2, 12, 0.2), RED);
  return stage;
}
function shotHall(t, T) {
  lift(240); mode('hall');
  closed.visible = t > 1.8; closed.scale.set(1.6 * easeBack(clamp((t - 1.8) / 0.4)), 0.4 * easeBack(clamp((t - 1.8) / 0.4)), 1);
  const u = ease(t / 4); look(lerp(2, 1, u), lerp(3.4, 3.2, u), lerp(13.5, 12.5, u), 0, 2.0, 0, 50);
  setTop('私のしごと館の建設費（雇用保険・厚労省）', '約' + countUp(t, 581, 0.2, 1.2) + '億円', fade(t, 0.15, 4, 0.2), RED);
  return stage;
}
function shotTheater(t, T) {
  lift(240); mode('theater');
  actors.people.forEach((p, i) => { p.rotation.y = Math.sin(T * 3 + i) * 0.6; p.position.y = Math.abs(Math.sin(T * 4 + i)) * 0.15; });
  const u = ease(t / 4); look(lerp(-1, 0, u), lerp(2.8, 2.6, u), lerp(9.5, 8.8, u), 0, 1.6, -0.5, 50);
  setTop('道路ミュージカルの上演（2006年度・政府答弁）', '約' + comma(countUp(t, 5500, 0.2, 1.2)) + '万円', fade(t, 0.15, 4, 0.2), RED);
  return stage;
}
function shotHouses(t, T) {
  lift(240); mode('houses');
  glow.intensity = 5 + Math.sin(T * 6) * 1.5;
  const u = ease(t / 4); look(lerp(0, 0.4, u), lerp(3.8, 3.6, u), lerp(13.5, 12.8, u), 0.1, 1.8, 0, 50);
  setTop('塩川正十郎 元財務大臣の例え', 'おかゆ と すき焼き', fade(t, 0.15, 4, 0.2), GOLD);
  return stage;
}
function shotSurplus(t, T) {
  lift(240); mode('surplus');
  const k = easeOut(clamp((t - 0.2) / 2)); SPILE.forEach((s, i) => s.setN(Math.round(18 * clamp(k * 1.4 - i * 0.04))));
  const u = ease(t / 4); look(lerp(-0.5, 0.5, u), lerp(5.0, 4.8, u), lerp(11.5, 10.8, u), 0, 1.6, 0, 50);
  setTop('2025年度の剰余金（決算・国債整理基金を除く）', countUp(t, 162, 0.2, 1.4) / 10 + '兆円', fade(t, 0.15, 4, 0.2), GOLD);
  return stage;
}
function shotDup(t, T) {
  lift(260); mode('dup');
  const g = easeOut(clamp((t - 0.2) / 1.4)); const split = easeOut(clamp((t - 4.0) / 1.2));
  dNet.setH(204.1 * HD * g, ''); dNet.g.position.x = -split * 1.6;
  dDup.position.set(split * 1.6, 0.3 + 204.1 * HD * g * (1 - split), 0); dDup.scale.y = Math.max(0.001, 225.4 * HD * g);
  dupLab.position.set(split * 1.6, 0.3 + 204.1 * HD * (1 - split) + 225.4 * HD + 0.5, 0); dupLab.visible = split > 0.3;
  netLab.position.set(-split * 1.6, 0.3 + 204.1 * HD + 0.5, 0); netLab.visible = split > 0.3;
  const u = ease(t / 8); look(lerp(0, 0, u), lerp(4.2, 4.0, u), lerp(12.5, 12, u), 0, 2.8, 0, 50);
  if (t < 4.1) setTop('特別会計の歳出総額（2025年度予算）', '429.5兆円', fade(t, 0.15, 4.1, 0.2), RED);
  else setTop('重複を除いた純計額（2025年度予算）', countUp(t - 4.1, 2041, 0.2, 1.2) / 10 + '兆円', fade(t, 4.1, 8, 0.2), GOLD);
  return stage;
}
function shotResult(t, T) {
  lift(260); mode('years');
  ybars.forEach((b, i) => { b.setH(VAL[i] * HY, ''); b.mat.color.set('#c0483c'); });
  ylabs.forEach(s => { s.visible = true; }); yvals.forEach(s => { s.visible = false; });
  const u = ease(t / 8); look(lerp(0.5, 0, u), lerp(4.6, 5.2, u), lerp(15.5, 17, u), 0, 2.4, 0, 50);
  if (t < 7.5) setTop('26年分の合計（決算）', '約9,970兆円', fade(t, 0.3, 7.5, 0.2), GOLD);
  else setTop('出典', '財務省が公開中', fade(t, 7.5, 10, 0.2), GREEN);
  return stage;
}
function shotLoop(t, T) { walletShot(t, 0, true); accTiles.forEach(s => { s.visible = false; }); const u = ease(t / 3.7); look(lerp(0.0, -0.1, u), 3.4, lerp(17.5, 17.2, u), -0.2, 1.4, 0, 50); return stage; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 14.4, f: shotWallets }, { a: 14.4, b: 22.4, f: shotTwo }, { a: 22.4, b: 38.4, f: shotYears },
  { a: 38.4, b: 46.4, f: shotTower }, { a: 46.4, b: 58.4, f: shotBooks }, { a: 58.4, b: 62.4, f: shotHall }, { a: 62.4, b: 66.4, f: shotTheater },
  { a: 66.4, b: 70.4, f: shotHouses }, { a: 70.4, b: 74.4, f: shotSurplus }, { a: 74.4, b: 82.4, f: shotDup }, { a: 82.4, b: 92.4, f: shotResult },
  { a: 92.4, b: 95.7, f: shotLoop }, { a: 95.7, b: 99.1, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 99.1,
  meta: {
    id: '0602',
    title: '特別会計 国のもう1つの財布、26年でいくら使った？',
    titleHtml: '<span style="font-size:.7em;color:#ffe08a">特別会計</span><br>国のもう1つの財布、<br>26年でいくら使った？',
    mood: 'tension', seed: 602, hits: [42.6, 82.7], risers: [38.4, 82.4],
    impacts: [14.6, 30.6, 42.6, 54.6, 58.6, 62.6, 70.6, 82.5],
    sfx: [[0.3, 'whoosh'], [10.8, 'whoosh'], [26.0, 'meter', 0.3], [42.4, 'meter', 1.0], [46.6, 'drone'], [60.2, 'alarm'], [74.6, 'whoosh']],
    ask: 'この金額、知ってた？',
    narr: { '429.5兆円': '429.5兆円', '9,970兆円': '9970兆円', '5,500万円': '5500万円', '（1999〜2003年度）': '', '（予算）': '', '1京円': 'いっけいえん', '特別会計国の': '国の', '母屋': 'おもや', '離れ': 'はなれ', '監修料': 'かんしゅうりょう', '受領': 'じゅりょう' },
    caption: '特別会計｜国のもう1つの財布、26年でいくら使った？\n\n国の財布は2つある。税金で回す「一般会計（母屋）」と、年金・国債の返済・地方へのお金など目的ごとに分けた「特別会計（離れ）」。2025年度は14個。\n\n2025年度予算で特別会計は429.5兆円。一般会計115.5兆円の約3.7倍。\n\n歳出（決算）を1年ずつ見ると\n2000年度 305.8兆円 → 一番多い2006年度 450.6兆円 → 2025年度 412.7兆円\n26年分（2000〜2025年度）を足すと 約9,970兆円。1京円まであと約30兆円。\n\n使い道で問題になったこともある（公的資料で金額を確認できたもの）\n・国が大量に買った本の監修料を、社会保険庁の職員606人が受け取った：約4.9億円（1999〜2003年度）\n・雇用保険のお金 約581億円で建てた「私のしごと館」は廃止に\n・道路のお金で「道路ミュージカル」に約5,500万円（2006年度）\n元財務大臣（塩川正十郎氏）は「母屋でおかゆ、離れですき焼き」と例えた。\n2025年度も、使わずに残ったお金（剰余金）が16.2兆円。\n\n※ただし総額の半分近くは、会計どうしのやりとりや国債の借り換えの重複。重複を除いた純計額は2025年度予算で204.1兆円。\n\n結果：26年で約9,970兆円。重複を除いても、毎年約200兆円が「離れの財布」から出ている。この数字は全部、財務省が公開している。\n\nこの金額、知ってた？ コメントで教えて。\n\n出典：財務省 財政統計 第8表（特別会計別歳入歳出決算）、令和7年度特別会計の決算概要（2026年7月）、特別会計について（令和7年度予算）、厚生労働省「これまでの各種事案への対応状況」・審議会資料（2009年）、政府答弁書（2008年5月23日）、東洋経済オンライン（2009年）',
    hashtags: ['もしもラボ', '特別会計', '税金', '国の予算', '雑学'],
    endStats: [['26年分の合計（決算）', '約9,970兆円', '2000〜2025年度'], ['2025年度', '412.7兆円', '決算'], ['一般会計とくらべて', '約3.7倍', '2025年度予算'], ['重複を除くと', '204.1兆円', '2025年度予算'], ['使わずに残ったお金', '16.2兆円', '2025年度決算']],
    sources: '出典：財務省 財政統計 第8表・令和7年度特別会計の決算概要・<br>特別会計について（令和7年度予算）、厚生労働省、政府答弁書（2008年）',
  },
});
