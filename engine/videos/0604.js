import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { stage, makeBar, makeCoins, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, el } from '../story.js';

// もしも中国と日本が合併したら？（数字で比べるだけ。どちらかを良い悪いとは言わない）
// 数字
//   中国の総人口：14億489万人（2025年末・中国国家統計局 2026年1月19日発表）
//   日本の総人口：1億2,265万人（2026年9月1日概算値・総務省統計局 人口推計）
//     → 合計 15億2,754万人。日本の割合 8.03% ≒ 8%
//   インドの人口：約14億6,000万人（2025年・国連 世界人口推計2024）→ 合計はインドを上回る
//   面積：中国 約960万km²（中国政府）、日本 約37.8万km²（国土地理院）→ 日本は合計の約3.8%
//   名目GDP（2025年・IMF 2026年10月版）：米国30.86兆ドル、中国19.63兆ドル、日本4.45兆ドル → 合計24.08兆ドル
//   1人あたり名目GDP（2025年・IMF 2026年10月版）：日本36,119ドル、中国13,970ドル
//     → 合併後の平均 24.08兆÷15億2,754万 ≒ 15,764ドル ≒ 約1.6万ドル（日本の約44%）
//   軍事費（2025年・SIPRI 2026年4月）：米国9,540億ドル、中国3,360億ドル（推定）、日本622億ドル → 合計3,982億ドル（米国の約42%）
//   パリ五輪2024：米国 金40・計126、中国 金40・計91、日本 金20・計45 → 合計 金60・計136
//   時差：中国は全土で1つの標準時（UTC+8）、日本はUTC+9
//   中国ではグレート・ファイアウォールでInstagram、YouTube、LINE、Google、Xなどがつながらない

const GOLD = '#ffe08a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff', PINK = '#ff7ab8';
const CN = '#d9534f', JP = '#f2f2f2', MIX = '#b46ad9', US = '#4f8fd9';

// ---------- land tiles ----------
const AREA_S = 5.2; // side of the merged square
const cnSide = AREA_S * Math.sqrt(960 / 997.8), jpSide = AREA_S * Math.sqrt(37.8 / 997.8);
const cnTile = box(cnSide, 0.3, cnSide, mat(CN)); cnTile.position.y = 0.45; stage.add(cnTile);
const jpTile = box(jpSide, 0.3, jpSide, mat(JP)); jpTile.position.y = 0.45; stage.add(jpTile);
const cnName = makeLabel('中国', { sx: 1.8, size: 90, stroke: 10, w: 384 }); stage.add(cnName);
const jpName = makeLabel('日本', { sx: 1.8, size: 90, stroke: 10, w: 384 }); stage.add(jpName);
const mergeSpark = makeSparkles(300, 0.2, 0xffe0f0); stage.add(mergeSpark.points);
const areaLab = makeLabel('', { sx: 3.2, size: 76, color: GOLD, stroke: 8 }); stage.add(areaLab);
// ---------- crowd of 100 ----------
const crowd = makeCrowd(100, 46, { w: 9, d: 5, x: 0, z: 0 });
const JP8 = [12, 27, 35, 48, 59, 66, 81, 93];
const hiMat = mat('#ffffff', { emissive: 0x2a5a8a });
const rings = JP8.map(i => { const r = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 24), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true })); r.rotation.x = -Math.PI / 2; r.position.copy(crowd.people[i].position); r.position.y = 0.03; crowd.g.add(r); return r; });
const crowdLab = makeLabel('', { sx: 3.6, size: 76, color: BLUE, stroke: 8 }); stage.add(crowdLab);
const popLab = makeLabel('', { sx: 4.6, size: 66, color: GOLD, stroke: 8, w: 768, h: 128 }); stage.add(popLab);
// ---------- bars ----------
function bar(color, label, x) { return makeBar({ color, label, x, w: 1.6, d: 1.6, nameTop: true }); }
const B = { a: bar(MIX, ' ', -1.4), b: bar(US, ' ', 1.4), c: bar(JP, ' ', 0) };
const stackJP = box(1.62, 1, 1.62, mat('#f2f2f2')); stackJP.geometry.translate(0, 0.5, 0); stage.add(stackJP);
function setNames(a, b, c) { [['a', a], ['b', b], ['c', c]].forEach(([k, s]) => { if (B[k].label) B[k].label.userData.set(s || ''); }); }
// ---------- clocks ----------
function clockFace() {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 40), mat('#f7f3e8')); face.rotation.x = Math.PI / 2; g.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 40), mat('#333a48')); g.add(rim);
  const hh = box(0.08, 0.5, 0.04, mat('#222')); hh.geometry.translate(0, 0.25, 0); hh.position.z = 0.09; g.add(hh);
  const mh = box(0.05, 0.8, 0.04, mat('#222')); mh.geometry.translate(0, 0.4, 0); mh.position.z = 0.11; g.add(mh);
  g.userData = { hh, mh }; stage.add(g); return g;
}
const clkJ = clockFace(), clkC = clockFace();
const clkLabJ = makeLabel('日本 12:00', { sx: 2.6, size: 64, stroke: 8 }); stage.add(clkLabJ);
const clkLabC = makeLabel('中国 11:00', { sx: 2.6, size: 64, stroke: 8 }); stage.add(clkLabC);
// ---------- apps ----------
const APPS = ['Instagram', 'YouTube', 'LINE', 'Google', 'X', 'TikTok'];
const appTiles = APPS.map((n, i) => {
  const g = new THREE.Group(); const b = box(1.5, 1.5, 0.2, mat(['#c13584', '#e62117', '#06c755', '#4285f4', '#222222', '#111111'][i])); g.add(b);
  const l = makeLabel(n, { sx: 1.5, size: 56, stroke: 6, w: 512 }); l.position.set(0, -1.05, 0.2); g.add(l);
  const x1 = box(1.7, 0.18, 0.1, mat('#ff3b3b', { emissive: 0x550000 })); x1.rotation.z = Math.PI / 4; x1.position.z = 0.18; g.add(x1);
  const x2 = x1.clone(); x2.rotation.z = -Math.PI / 4; g.add(x2);
  g.userData = { b, xs: [x1, x2], col: b.material.color.clone() };
  g.position.set(-1.9 + (i % 3) * 1.9, 4.0 - Math.floor(i / 3) * 2.3, 0); stage.add(g); return g;
});
// ---------- big phone (twist) ----------
const bigPhone = new THREE.Group(); stage.add(bigPhone);
{ const b = box(2.4, 4.2, 0.25, mat('#1b1d22')); bigPhone.add(b);
  const c = document.createElement('canvas'); c.width = 256; c.height = 448; const g = c.getContext('2d'); g.fillStyle = '#0d0f14'; g.fillRect(0, 0, 256, 448);
  g.strokeStyle = '#ff6b6b'; g.lineWidth = 14; g.beginPath(); g.arc(128, 170, 70, 0, 7); g.stroke(); g.beginPath(); g.moveTo(78, 120); g.lineTo(178, 220); g.stroke();
  g.fillStyle = '#fff'; g.font = '900 30px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('もしもラボ', 128, 300); g.fillStyle = '#ff8a7a'; g.font = '900 28px "Noto Sans CJK JP", sans-serif'; g.fillText('接続できません', 128, 350);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Mesh(new THREE.PlaneGeometry(2.16, 3.78), new THREE.MeshBasicMaterial({ map: t })); s.position.z = 0.13; bigPhone.add(s); }
bigPhone.position.set(0, 3.0, 0);
// ---------- name ----------
const nameQ = makeLabel('国の名前：？？？', { sx: 4.4, size: 72, color: GOLD, stroke: 8, w: 768, h: 128 }); stage.add(nameQ);

const GROUPS = {
  land: [cnTile, jpTile, cnName, jpName, areaLab], crowd: [crowd.g, crowdLab, popLab], bars: [B.a.g, B.b.g, B.c.g, stackJP],
  clocks: [clkJ, clkC, clkLabJ, clkLabC], apps: appTiles, phone: [bigPhone], name: [nameQ],
};
function mode(...ms) { for (const k in GROUPS) GROUPS[k].forEach(o => { o.visible = ms.includes(k); }); mergeSpark.set(0); }
function pop(s, t0, t, sx, sy) { const k = easeBack(clamp((t - t0) / 0.5)); s.scale.set(sx * k, sy * k, 1); s.visible = k > 0.01; }

const SUBS = [
  [4.2, 8.0, '人口は、中国14億489万人。<br>日本1億2,265万人。'],
  [8.1, 12.0, '合わせて15億2,754万人。<br>インドを抜いて世界1位。'],
  [12.1, 16.0, 'そのうち日本人は、<br>たったの8%。'],
  [16.1, 20.0, '100人の会議なら、<br>日本人は8人だけ。'],
  [20.1, 24.0, '面積は、日本が<br>全体の約3.8%。'],
  [24.1, 28.0, 'GDPは合わせて24.1兆ドル。<br>アメリカは30.9兆ドル。'],
  [28.1, 32.0, '合併しても、<br>アメリカには届かない。'],
  [32.1, 36.0, '1人あたりGDPは、<br>日本3.6万ドル、中国1.4万ドル。'],
  [36.1, 40.0, '合併後の平均は約1.6万ドル。<br>日本の半分以下になる。'],
  [40.1, 44.0, '軍事費は合わせて<br>3,982億ドル。'],
  [44.1, 48.0, 'それでもアメリカの<br>約4割。'],
  [48.1, 52.0, 'パリ五輪の金メダルは、<br>合わせて60個。'],
  [52.1, 56.0, 'アメリカの40個を抜いて、<br>世界1位。'],
  [56.1, 60.0, '時差の1時間も消える。<br>中国は国じゅう同じ時間。'],
  [60.1, 64.0, 'もし中国のネットのルールに<br>合わせたら…'],
  [64.1, 68.0, 'インスタもYouTubeも、<br>LINEもGoogleも使えない。'],
  [68.1, 76.0, '結果：人口も金メダルも世界一。<br>でも日本人は100人中8人。'],
  [76.1, 78.7, 'そしてこの動画も、<br>中国では見られない。'],
  [78.8, 82.2, '合併したら、<br>国の名前どうする？'],
];

// ---------- shots ----------
function landScene(t, merge, showArea = false) {
  mode('land');
  const m = ease(merge);
  cnTile.position.set(lerp(-1.6, -0.3, m), 0.45, 0); jpTile.position.set(lerp(3.2, cnSide / 2 - 0.3 + jpSide / 2 + 0.02, m), 0.45, lerp(-1.2, -cnSide / 2 + jpSide / 2 + 0.3, m));
  cnName.position.set(cnTile.position.x, 1.6, cnTile.position.z); cnName.scale.set(1.8, 0.9, 1);
  jpName.position.set(jpTile.position.x, 1.3, jpTile.position.z + 0.2); jpName.scale.set(1.4, 0.7, 1);
  cnTile.material.color.set(CN).lerp(new THREE.Color(MIX), m * 0.6); jpTile.material.color.set(JP).lerp(new THREE.Color(MIX), m * 0.3);
  areaLab.visible = showArea;
}
function shot0(t, T) { lift(300); landScene(t, clamp((t - 1.2) / 2.2)); if (t > 3.0 && t < 4.1) { mergeSpark.init([[1.6, 0.8, -1.2]], 0.6, 2.4); mergeSpark.set(clamp((t - 3.0) / 1.1)); } const u = ease(t / 4); look(lerp(0.0, -0.2, u), lerp(17, 15.5, u), lerp(6.5, 6.0, u), lerp(0.0, -0.2, u), 0, -1.2, 50); el.title.style.opacity = 1; return stage; }
function shotPop(t, T) {
  lift(240); mode('crowd');
  const hi = t > 8.0; rings.forEach((r, j) => { r.visible = hi && t > 8.2 + j * 0.1; r.scale.setScalar(1 + Math.sin(T * 6) * 0.08); });
  crowd.people.forEach((p, i) => { const isJ = JP8.includes(i); p.position.y = isJ && hi ? Math.abs(Math.sin(T * 5 + i)) * 0.15 : 0; });
  popLab.position.set(0, 3.7, 0);
  if (t < 3.9) { popLab.userData.set('14億489万 ＋ 1億2,265万'); pop(popLab, 0.2, t, 4.6, 0.77); }
  else if (t < 7.9) { popLab.userData.set('合計 15億2,754万人'); pop(popLab, 4.0, t, 4.6, 0.77); }
  else popLab.visible = false;
  crowdLab.position.set(0, 3.6, 1.0); crowdLab.userData.set(t < 11.9 ? '日本人 8%' : '100人中 8人'); if (t > 8.2) pop(crowdLab, 8.2, t, 3.6, 0.9); else crowdLab.visible = false;
  const u = ease(t / 16); look(lerp(0, 0.4, u), lerp(7.0, 6.2, u), lerp(13, 12, u), 0, 1.2, 0, 50);
  if (t < 3.9) setTop('人口（中国2025年末・日本2026年9月）', '中国14億・日本1.2億', fade(t, 0.15, 3.9, 0.2), GOLD);
  else if (t < 7.9) setTop('合計（インドは約14.6億）', '15億2,754万人', fade(t, 3.9, 7.9, 0.2), GOLD);
  else if (t < 11.9) setTop('合併後の日本人の割合', '8%', fade(t, 7.9, 11.9, 0.2), BLUE);
  else setTop('100人の会議なら', '日本人は8人', fade(t, 11.9, 15.9, 0.2), BLUE);
  return stage;
}
function shotArea(t, T) {
  lift(240); landScene(t, 1, true);
  areaLab.position.set(jpTile.position.x - 0.4, 2.6, jpTile.position.z + 0.6); areaLab.userData.set('日本 3.8%'); pop(areaLab, 0.6, t, 3.2, 0.8);
  jpTile.position.y = 0.45 + Math.abs(Math.sin(T * 4)) * 0.2;
  const u = ease(t / 4); look(lerp(-0.2, 0.6, u), lerp(15, 12, u), lerp(6.5, 5.5, u), lerp(-0.2, 0.8, u), 0, -1.2, 50);
  setTop('面積（中国 約960万km²・日本 約37.8万km²）', '日本は約3.8%', fade(t, 0.15, 3.9, 0.2), BLUE);
  return stage;
}
function barScene(t, T, H, a, b, c, labs, stack, cols = [MIX, US, MIX]) {
  mode('bars'); setNames(...labs); B.a.mat.color.set(cols[0]); B.b.mat.color.set(cols[1]); B.c.mat.color.set(cols[2]); B.a.g.position.y = 0.3;
  const g1 = easeOut(clamp((t - 0.2) / 1.4)), g2 = easeOut(clamp((t - 0.8) / 1.4));
  B.a.setH(a.h * H * g1, a.v); B.b.setH(b.h * H * g2, b.v);
  if (c) { B.c.g.visible = true; B.a.g.position.x = -2.5; B.c.g.position.x = 0; B.b.g.position.x = 2.5; B.c.setH(c.h * H * easeOut(clamp((t - 1.4) / 1.4)), c.v); }
  else { B.c.g.visible = false; B.a.g.position.x = -1.4; B.b.g.position.x = 1.4; }
  stackJP.visible = !!stack; if (stack) { stackJP.position.set(B.a.g.position.x, 0.3 + (a.h - stack) * H * g1, 0); stackJP.scale.y = Math.max(0.001, stack * H * g1); }
  look(0, 4.4, c ? 15.5 : 13.5, 0, 2.9, 0, 50);
}
function shotGDP(t, T) {
  lift(240); const H = 4.6 / 30.86;
  barScene(t, T, H, { h: 24.08, v: '24.1兆ドル' }, { h: 30.86, v: '30.9兆ドル' }, null, ['中国＋日本', 'アメリカ', ''], 4.45);
  if (t < 3.9) setTop('名目GDP（2025年・IMF）', '合わせて24.1兆ドル', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('アメリカとの差', 'まだ届かない', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotPer(t, T) {
  lift(240); const H = 4.4 / 36.119;
  barScene(t, T, H, { h: 36.119, v: '3.6万ドル' }, { h: 13.97, v: '1.4万ドル' }, t > 4 ? { h: 15.764, v: '約1.6万ドル' } : null, ['日本', '中国', '合併後'], 0, ['#e8e8e8', CN, MIX]);
  if (!(t > 4)) { B.c.g.visible = false; }
  if (t < 3.9) setTop('1人あたり名目GDP（2025年・IMF）', '日本3.6万・中国1.4万', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('合併後の平均', '日本の半分以下', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotMil(t, T) {
  lift(240); const H = 4.6 / 954;
  barScene(t, T, H, { h: 398.2, v: '3,982億ドル' }, { h: 954, v: '9,540億ドル' }, null, ['中国＋日本', 'アメリカ', ''], 62.2);
  if (t < 3.9) setTop('軍事費（2025年・SIPRI）', '合わせて3,982億ドル', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('アメリカとくらべて', '約4割', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotGold(t, T) {
  lift(240); const H = 4.4 / 60;
  barScene(t, T, H, { h: 60, v: '金60個' }, { h: 40, v: '金40個' }, null, ['中国＋日本', 'アメリカ', ''], 20, ['#e0b04a', US, MIX]); if (t > 4.2) B.a.g.position.y = 0.3 + Math.abs(Math.sin(T * 5)) * 0.15; else B.a.g.position.y = 0.3;
  if (t < 3.9) setTop('パリ五輪の金メダル（中国40・日本20）', '60個', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('アメリカ40個を抜いて', '世界1位', fade(t, 3.9, 7.9, 0.2), GOLD);
  return stage;
}
function shotClock(t, T) {
  lift(240); mode('clocks');
  const m = ease(clamp((t - 1.4) / 1.6));
  clkJ.position.set(lerp(1.4, 0, m), 3.0, 0); clkC.position.set(lerp(-1.4, 0, m), 3.0, -0.2);
  const hJ = 0, hC = lerp(-Math.PI / 6, 0, m);
  clkJ.userData.hh.rotation.z = -hJ; clkJ.userData.mh.rotation.z = 0; clkC.userData.hh.rotation.z = -hC; clkC.userData.mh.rotation.z = 0;
  clkLabJ.position.set(clkJ.position.x, 1.5, 0.3); clkLabC.position.set(clkC.position.x, 1.5, 0.3); clkLabJ.visible = m < 0.9; clkLabC.visible = m < 0.9;
  clkC.visible = m < 0.98;
  look(0, 3.2, 8.5, 0, 2.6, 0, 50);
  setTop('中国は全土で1つの時間', '時差1時間が消える', fade(t, 0.15, 3.9, 0.2), GOLD);
  return stage;
}
function shotApps(t, T) {
  lift(240); mode('apps');
  appTiles.forEach((g, i) => { const k = clamp((t - 4.4 - i * 0.25) / 0.4); g.userData.b.material.color.copy(g.userData.col).lerp(new THREE.Color('#3a3f4a'), k); g.userData.xs.forEach(x => { x.visible = k > 0.02; x.scale.set(k, 1, 1); }); g.rotation.y = Math.sin(T * 1.2 + i) * 0.1; });
  look(0, 3.0, 10.5, 0, 2.9, 0, 50);
  if (t < 3.9) setTop('もし中国のネットのルールなら', '…', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('グレート・ファイアウォール', 'つながらない', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotResult(t, T) {
  lift(260); mode('crowd'); popLab.visible = false;
  rings.forEach(r => { r.visible = true; r.scale.setScalar(1 + Math.sin(T * 6) * 0.08); });
  crowd.people.forEach((p, i) => { p.position.y = JP8.includes(i) ? Math.abs(Math.sin(T * 5 + i)) * 0.15 : 0; });
  crowdLab.position.set(0, 3.6, 1.0); crowdLab.userData.set('100人中 8人'); pop(crowdLab, 3.8, t, 3.6, 0.9);
  const u = ease(t / 8); look(lerp(0.4, 0, u), lerp(7.5, 6.6, u), lerp(14, 12.5, u), 0, 1.2, 0, 50);
  if (t < 3.9) setTop('人口・金メダル', '世界一', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('でも日本人は', '100人中8人', fade(t, 3.9, 7.9, 0.2), BLUE);
  return stage;
}
function shotTwist(t, T) { lift(240); mode('phone'); bigPhone.rotation.y = Math.sin(T * 0.8) * 0.15; look(0, 3.4, 9.0, 0, 2.6, 0, 50); setTop('Instagramは中国では', '見られない', fade(t, 0.15, 2.6, 0.2), RED); return stage; }
function shotAsk(t, T) { lift(300); landScene(t, 1); mode('land', 'name'); areaLab.visible = false; jpName.visible = false; cnName.visible = false; nameQ.position.set(-0.2, 2.5, 0.2); nameQ.material.depthTest = false; nameQ.renderOrder = 9; pop(nameQ, 0.2, t, 5.6, 0.93); const u = ease(t / 3.4); look(-0.2, lerp(16, 15.5, u), 6.2, -0.2, 0, -1.2, 50); return stage; }

const shots = [
  { a: 0, b: 4.1, f: shot0 }, { a: 4.1, b: 20.0, f: shotPop }, { a: 20.0, b: 24.0, f: shotArea }, { a: 24.0, b: 32.0, f: shotGDP },
  { a: 32.0, b: 40.0, f: shotPer }, { a: 40.0, b: 48.0, f: shotMil }, { a: 48.0, b: 56.0, f: shotGold }, { a: 56.0, b: 60.0, f: shotClock },
  { a: 60.0, b: 68.0, f: shotApps }, { a: 68.0, b: 76.0, f: shotResult }, { a: 76.0, b: 78.7, f: shotTwist }, { a: 78.7, b: 82.4, f: shotAsk },
  { a: 82.4, b: 86.4, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 86.4,
  meta: {
    id: '0604',
    title: '中国と日本が合併したらどうなる？',
    titleHtml: '中国と日本が<br>合併したらどうなる？',
    mood: 'tension', seed: 604, hits: [12.1, 68.1], risers: [8.0, 68.0],
    impacts: [8.1, 12.1, 20.1, 24.1, 36.1, 40.1, 48.1, 52.1, 64.1, 68.1, 76.1],
    sfx: [[0.3, 'whoosh'], [3.0, 'poof'], [8.3, 'meter', 0.8], [12.2, 'bubble'], [20.4, 'bubble'], [24.3, 'meter', 0.8], [32.3, 'meter', 0.5], [40.3, 'meter', 0.6], [48.3, 'meter', 1.0], [57.6, 'whoosh'], [64.5, 'buzz'], [76.2, 'alarm']],
    ask: '合併したら、国の名前どうする？',
    narr: { 'GDP': 'ジーディーピー', 'YouTube': 'ユーチューブ', 'Google': 'グーグル', 'LINE': 'ライン', '1億2,265万人': '1億2265万人', '15億2,754万人': '15億2754万人', '3,982億ドル': '3982億ドル', '24.1兆ドル': '24.1兆ドル' },
    caption: '中国と日本が合併したらどうなる？\n\n人口：中国14億489万人＋日本1億2,265万人＝15億2,754万人。インド（約14.6億人）を抜いて世界1位。\nそのうち日本人は8%。100人の会議なら日本人は8人。\n面積：日本は全体の約3.8%。\n\nGDP：合わせて24.1兆ドル。アメリカは30.9兆ドルで、合併しても届かない。\n1人あたりGDP：日本3.6万ドル、中国1.4万ドル。合併後の平均は約1.6万ドルで、日本の半分以下。\n軍事費：合わせて3,982億ドル。アメリカ（9,540億ドル）の約4割。\nパリ五輪の金メダル：合わせて60個。アメリカの40個を抜いて世界1位（総数も136個で1位）。\n時差：中国は国じゅう同じ時間。日本との1時間の時差が消える。\nネット：中国のルールに合わせると、インスタもYouTubeもLINEもGoogleも使えない。\n\n結果：人口も金メダルも世界一。でも日本人は100人中8人。\nそしてこの動画も、中国では見られない。\n\n合併したら、国の名前どうする？ コメントで教えて。\n\n※数字で比べるだけの「もしも」です。\n\n出典：中国国家統計局（2026年1月）、総務省統計局 人口推計（2026年9月概算）、国連 世界人口推計2024、IMF World Economic Outlook（2026年10月）、SIPRI（2026年4月）、パリ2024オリンピック公式メダル数',
    hashtags: ['もしもラボ', 'もしも', '中国', '日本', '雑学'],
    endStats: [['合併後の人口', '15億2,754万人', '世界1位'], ['日本人の割合', '8%', '100人中8人'], ['GDP', '24.1兆ドル', 'アメリカは30.9兆'], ['1人あたりGDP', '約1.6万ドル', '日本の半分以下'], ['金メダル', '60個', 'パリ五輪・世界1位']],
    sources: '出典：中国国家統計局、総務省統計局、国連、IMF（2026年10月）、<br>SIPRI（2026年）、パリ2024オリンピック',
  },
});
