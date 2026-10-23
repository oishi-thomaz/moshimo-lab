import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, fade, mat, box, makePerson } from '../lib.js';
import { stage, makeBar, makeCoins, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, el } from '../story.js';

// もしも中国と日本が合併したら？（数字と制度で比べるだけ。どちらが良い悪いとは言わない）
// 人口・面積
//   中国の総人口：14億489万人（2025年末・中国国家統計局 2026年1月19日発表）
//   日本の総人口：1億2,265万人（2026年9月1日概算値・総務省統計局 人口推計）→ 合計15億2,754万人、日本の割合8.03%
//   インド：約14億6,000万人（2025年・国連 世界人口推計2024）
//   面積：中国 約960万km²、日本 約37.8万km² → 日本は約3.8%
// 日本列島の扱い（2つの型を並べるだけ）
//   中国の省レベルの区分：省・自治区・直轄市・特別行政区
//   広東省の常住人口：1億2,859万人（2025年末・広東省統計 / 第一財経 2026年3月）→ 日本（1億2,265万人）は広東省に次ぐ規模
//   香港（特別行政区）：基本法により独自の法律・通貨（香港ドル）を維持
// 省になった場合のルールの違い（中国の法律）
//   右側通行：道路交通安全法 第35条（日本は道路交通法で左側通行）
//   結婚できる年齢：民法典で男22歳・女20歳（日本は男女とも18歳）
//   お酒：未成年者（18歳未満）への販売禁止（未成年人保護法 第59条）／日本は20歳未満の飲酒禁止
//   国の議会の代表：全国人民代表大会の代表は下の段階の人民代表大会が選ぶ間接選挙（選挙法 第2条）。有権者が直接選ぶのは県・郷レベルまで
//   ネット：グレート・ファイアウォールでInstagram、YouTube、LINE、Google、Xなどがつながらない
// 治安：殺人の発生率（10万人あたり）日本0.2（2017年・犯罪白書/UNODC）、中国0.5（2020年・世界銀行/UNODC）
// 時差：中国は全土で1つの標準時（UTC+8）、日本はUTC+9
// 1人あたり名目GDP（2025年・IMF 2026年10月版）：日本36,119ドル、中国13,970ドル。合併後の平均 24.08兆÷15億2,754万 ≒ 15,764ドル（日本の約44%）

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
// ---------- status tags ----------
const tagProv = makeLabel('省？', { sx: 2.0, size: 90, color: '#ffffff', bg: 'rgba(217,83,79,.92)', w: 384 }); stage.add(tagProv);
const tagSar = makeLabel('特別行政区？', { sx: 3.4, size: 70, color: '#ffffff', bg: 'rgba(80,120,200,.92)', w: 768, h: 128 }); stage.add(tagSar);
const keepLab = makeLabel('法律もお金も 今のまま', { sx: 4.4, size: 60, color: GREEN, stroke: 8, w: 1024, h: 128 }); stage.add(keepLab);
// ---------- road ----------
const road = new THREE.Group(); stage.add(road);
{ const r = box(4.0, 0.06, 16, mat('#2b2f38')); r.position.y = 0.33; road.add(r);
  for (let i = 0; i < 8; i++) { const d = box(0.12, 0.07, 1.0, mat('#f2f2f2')); d.position.set(0, 0.35, -7 + i * 2); road.add(d); } }
const car = new THREE.Group(); road.add(car);
{ const b = box(1.1, 0.5, 2.0, mat('#e04848')); b.position.y = 0.65; car.add(b); const c = box(0.9, 0.4, 1.0, mat('#c9d6e8')); c.position.set(0, 1.08, -0.1); car.add(c); }
const sideLab = makeLabel('左側通行', { sx: 2.6, size: 76, stroke: 8, w: 512 }); stage.add(sideLab);
// ---------- marriage / alcohol / vote ----------
const groom = makePerson({ skin: '#f1c7a3', hair: '#222', shirt: '#2d3446', pants: '#2d3446', tie: true }); groom.position.set(-0.6, 0.3, 0); stage.add(groom);
const bride = makePerson({ skin: '#f3cfb0', hair: '#3a2a1a', shirt: '#ffffff', pants: '#ffffff', long: true, skirt: true }); bride.position.set(0.6, 0.3, 0); stage.add(bride);
const ageLab = makeLabel('', { sx: 3.6, size: 70, color: GOLD, stroke: 8, w: 768, h: 128 }); stage.add(ageLab);
const bottle = new THREE.Group(); stage.add(bottle);
{ const b = box(0.7, 1.6, 0.7, mat('#3a7a3a', { transparent: true, opacity: 0.9 })); b.position.y = 1.1; bottle.add(b); const n = box(0.28, 0.6, 0.28, mat('#3a7a3a')); n.position.y = 2.2; bottle.add(n); const l = box(0.72, 0.5, 0.72, mat('#f2e6c8')); l.position.y = 1.1; bottle.add(l); }
const ballot = new THREE.Group(); stage.add(ballot);
{ const b = box(1.6, 1.4, 1.2, mat('#d8dde6')); b.position.y = 1.0; ballot.add(b); const s = box(0.8, 0.05, 0.12, mat('#222')); s.position.y = 1.73; ballot.add(s); const p = box(0.6, 0.8, 0.02, mat('#ffffff')); p.position.set(0, 2.2, 0); ballot.add(p); ballot.userData.paper = p; }
const voteLab = makeLabel('国の代表は 間接選挙', { sx: 4.4, size: 64, color: RED, stroke: 8, w: 1024, h: 128 }); stage.add(voteLab);

const GROUPS = {
  land: [cnTile, jpTile, cnName, jpName, areaLab], tags: [tagProv, tagSar, keepLab], crowd: [crowd.g, crowdLab, popLab], bars: [B.a.g, B.b.g, B.c.g, stackJP],
  clocks: [clkJ, clkC, clkLabJ, clkLabC], apps: appTiles, phone: [bigPhone], name: [nameQ], road: [road, sideLab], couple: [groom, bride], age: [ageLab], bottle: [bottle], vote: [ballot, voteLab],
};
function mode(...ms) { for (const k in GROUPS) GROUPS[k].forEach(o => { o.visible = ms.includes(k); }); mergeSpark.set(0); }
function pop(s, t0, t, sx, sy) { const k = easeBack(clamp((t - t0) / 0.5)); s.scale.set(sx * k, sy * k, 1); s.visible = k > 0.01; }

const SUBS = [
  [4.2, 8.4, '人口は、中国が約14億人。<br>日本が約1.2億人。'],
  [8.5, 12.0, '合わせて約15.3億人。<br>インドを抜いて世界1位。'],
  [12.1, 16.0, '日本人は100人中、<br>たったの8人。'],
  [16.1, 20.0, '面積は、日本が<br>全体の約3.8%。'],
  [20.1, 24.0, 'じゃあ日本列島は、<br>どういう扱いになる？'],
  [24.1, 28.0, '省になるなら、人口は<br>広東省に次ぐ2番目。'],
  [28.1, 32.0, '香港のような特別行政区なら、<br>法律もお金も今のまま。'],
  [32.1, 36.0, '省になった場合、<br>暮らしのルールが変わる。'],
  [36.1, 40.0, '車は左側通行から、<br>右側通行に。'],
  [40.1, 44.8, '結婚できる年齢は、18歳から<br>男22歳・女20歳に。'],
  [44.9, 48.0, 'お酒を買えるのは、<br>20歳から18歳に。'],
  [48.1, 52.0, '国の議会の代表は、<br>直接選べなくなる。'],
  [52.1, 56.0, 'インスタもYouTubeも、<br>LINEもGoogleもつながらない。'],
  [56.1, 60.0, '治安は、殺人の発生率が<br>日本0.2、中国0.5。'],
  [60.1, 64.0, 'どちらも世界で<br>トップクラスに低い。'],
  [64.1, 68.0, '時差の1時間も消える。<br>中国は国じゅう同じ時間。'],
  [68.1, 72.0, '1人あたりGDPの平均は、<br>日本の半分以下に。'],
  [72.1, 80.2, '結果：日本人は100人中8人。<br>車も結婚もネットも変わる。'],
  [80.3, 82.9, 'そしてこの動画も、<br>中国では見られない。'],
  [83.0, 86.6, '合併したら、<br>国の名前どうする？'],
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
  crowd.people.forEach((p, i) => { p.position.y = JP8.includes(i) && hi ? Math.abs(Math.sin(T * 5 + i)) * 0.15 : 0; });
  popLab.position.set(0, 3.7, 0);
  if (t < 3.9) { popLab.userData.set('14億489万 ＋ 1億2,265万'); pop(popLab, 0.2, t, 4.6, 0.77); }
  else if (t < 7.9) { popLab.userData.set('合計 15億2,754万人'); pop(popLab, 4.0, t, 4.6, 0.77); }
  else popLab.visible = false;
  crowdLab.position.set(0, 3.6, 1.0); crowdLab.userData.set('100人中 8人'); if (t > 8.2) pop(crowdLab, 8.2, t, 3.6, 0.9); else crowdLab.visible = false;
  const u = ease(t / 12); look(lerp(0, 0.4, u), lerp(7.0, 6.2, u), lerp(13, 12, u), 0, 1.2, 0, 50);
  if (t < 3.9) setTop('人口（中国2025年末・日本2026年9月）', '中国14億・日本1.2億', fade(t, 0.15, 3.9, 0.2), GOLD);
  else if (t < 7.9) setTop('合計（インドは約14.6億）', '15億2,754万人', fade(t, 3.9, 7.9, 0.2), GOLD);
  else setTop('合併後の日本人の割合', '8%', fade(t, 7.9, 11.9, 0.2), BLUE);
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
function shotStatus(t, T) {
  lift(240); landScene(t, 1); mode('land', 'tags'); areaLab.visible = false;
  jpTile.position.y = 0.45 + Math.abs(Math.sin(T * 3)) * 0.12;
  const jx = jpTile.position.x, jz = jpTile.position.z;
  tagProv.position.set(jx - 0.9, 2.8, jz + 0.6); tagSar.position.set(jx - 1.2, 1.8, jz + 1.6); keepLab.position.set(-0.2, 3.6, -1.0);
  if (t < 3.9) { pop(tagProv, 0.5, t, 2.0, 1.0); pop(tagSar, 1.2, t, 3.4, 0.57); keepLab.visible = false; }
  else if (t < 7.9) { tagProv.visible = false; tagSar.visible = false; }
  else { tagProv.visible = false; pop(tagSar, 8.0, t, 3.4, 0.57); pop(keepLab, 8.6, t, 4.4, 0.55); }
  const u = ease(t / 12); look(lerp(0.6, 0.4, u), lerp(12, 13, u), lerp(5.5, 6.0, u), 0.4, 0, -1.0, 50);
  if (t < 3.9) setTop('中国の区分', '省？ 特別行政区？', fade(t, 0.15, 3.9, 0.2), GOLD);
  else if (t < 7.9) setTop('省になるなら（広東省 1億2,859万人）', '人口2番目の省', fade(t, 3.9, 7.9, 0.2), RED);
  else setTop('香港型の特別行政区なら', '法律もお金もそのまま', fade(t, 7.9, 11.9, 0.2), GREEN);
  return stage;
}
function shotGuang(t, T) {
  lift(240); const H = 4.4 / 128.59; mode('bars'); setNames('広東省', '日本', '');
  B.a.mat.color.set(CN); B.b.mat.color.set('#e8e8e8'); B.c.g.visible = false; stackJP.visible = false;
  B.a.g.position.set(-1.4, 0.3, 0); B.b.g.position.set(1.4, 0.3, 0);
  const g1 = easeOut(clamp((t - 0.2) / 1.2)), g2 = easeOut(clamp((t - 0.7) / 1.2));
  B.a.setH(128.59 * H * g1, '1億2,859万'); B.b.setH(122.65 * H * g2, '1億2,265万');
  look(0, 4.4, 14.5, 0, 3.0, 0, 50);
  setTop('省になるなら（広東省 1億2,859万人）', '人口2番目の省', fade(t, 0.15, 3.9, 0.2), RED);
  return stage;
}
function shotRules(t, T) {
  lift(240); mode('land', 'tags'); landScene(t, 1); mode('land', 'tags'); areaLab.visible = false; tagSar.visible = false; keepLab.visible = false;
  tagProv.userData.set('省'); tagProv.position.set(jpTile.position.x - 0.6, 2.4, jpTile.position.z + 0.6); pop(tagProv, 0.3, t, 2.0, 1.0);
  look(0.6, 11, 5.0, 0.6, 0, -1.2, 50);
  setTop('もし省になったら', 'ルールが変わる', fade(t, 0.15, 3.9, 0.2), RED);
  return stage;
}
function shotRoad(t, T) {
  lift(240); mode('road');
  const sw = ease(clamp((t - 1.6) / 1.0));
  car.position.set(lerp(-1.0, 1.0, sw), 0, 6 - ((t * 3) % 12)); car.rotation.y = Math.PI;
  sideLab.userData.set(sw < 0.5 ? '左側通行' : '右側通行'); sideLab.position.set(0, 3.2, 0); sideLab.scale.set(2.6, 0.65, 1);
  look(0, 6.5, 9.0, 0, 0.5, 0, 50);
  setTop('中国の道路交通安全法', '右側通行', fade(t, 0.15, 3.9, 0.2), RED);
  return stage;
}
function shotMarry(t, T) {
  lift(240); mode('couple', 'age'); ageLab.position.set(0, 3.0, 0.4);
  ageLab.userData.set(t < 1.6 ? '日本：男女とも18歳' : '中国：男22歳・女20歳'); pop(ageLab, t < 1.6 ? 0.2 : 1.6, t, 3.6, 0.6);
  groom.rotation.y = 0.25; bride.rotation.y = -0.25;
  look(0, 2.6, 8.4, 0, 1.9, 0, 50);
  setTop('結婚できる年齢（中国 民法典）', '男22歳・女20歳', fade(t, 0.15, 3.9, 0.2), GOLD);
  return stage;
}
function shotBottle(t, T) {
  lift(240); mode('bottle', 'age'); bottle.rotation.y = T * 0.6; bottle.position.set(0, 0.3, 0);
  ageLab.position.set(0, 3.3, 0.4); ageLab.userData.set(t < 1.6 ? '日本：20歳から' : '中国：18歳から'); pop(ageLab, t < 1.6 ? 0.2 : 1.6, t, 3.6, 0.6);
  look(0, 2.6, 8.4, 0, 1.9, 0, 50);
  setTop('お酒（中国は18歳未満への販売禁止）', '18歳から', fade(t, 0.15, 3.9, 0.2), GOLD);
  return stage;
}
function shotVote(t, T) {
  lift(240); mode('vote');
  const p = ballot.userData.paper; const d = clamp((t - 0.5) / 1.0); p.position.y = lerp(2.6, 1.7, ease(d)); p.visible = d < 1;
  voteLab.position.set(0, 3.4, 0.4); pop(voteLab, 1.6, t, 4.4, 0.55);
  look(0, 2.8, 7.4, 0, 1.9, 0, 50);
  setTop('全国人民代表大会の代表（選挙法）', '間接選挙', fade(t, 0.15, 3.9, 0.2), RED);
  return stage;
}
function shotApps(t, T) {
  lift(240); mode('apps');
  appTiles.forEach((g, i) => { const k = clamp((t - 0.6 - i * 0.25) / 0.4); g.userData.b.material.color.copy(g.userData.col).lerp(new THREE.Color('#3a3f4a'), k); g.userData.xs.forEach(x => { x.visible = k > 0.02; x.scale.set(k, 1, 1); }); g.rotation.y = Math.sin(T * 1.2 + i) * 0.1; });
  look(0, 3.0, 10.5, 0, 2.9, 0, 50);
  setTop('グレート・ファイアウォール', 'つながらない', fade(t, 0.15, 3.9, 0.2), RED);
  return stage;
}
function shotCrime(t, T) {
  lift(240); const H = 4.0 / 0.5; mode('bars'); setNames('日本', '中国', '');
  B.a.mat.color.set('#e8e8e8'); B.b.mat.color.set(CN); B.c.g.visible = false; stackJP.visible = false;
  B.a.g.position.set(-1.4, 0.3, 0); B.b.g.position.set(1.4, 0.3, 0);
  B.a.setH(0.2 * H * easeOut(clamp((t - 0.2) / 1.2)), '0.2'); B.b.setH(0.5 * H * easeOut(clamp((t - 0.7) / 1.2)), '0.5');
  look(0, 4.2, 13, 0, 2.7, 0, 50);
  if (t < 3.9) setTop('殺人の発生率（10万人あたり・UNODC）', '日本0.2・中国0.5', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('アメリカは5.3（2017年）', 'どちらも低い', fade(t, 3.9, 7.9, 0.2), GREEN);
  return stage;
}
function shotClock(t, T) {
  lift(240); mode('clocks');
  const m = ease(clamp((t - 1.4) / 1.6));
  clkJ.position.set(lerp(1.4, 0, m), 3.0, 0); clkC.position.set(lerp(-1.4, 0, m), 3.0, -0.2);
  clkJ.userData.hh.rotation.z = 0; clkC.userData.hh.rotation.z = lerp(Math.PI / 6, 0, m);
  clkLabJ.position.set(clkJ.position.x, 1.5, 0.3); clkLabC.position.set(clkC.position.x, 1.5, 0.3); clkLabJ.visible = m < 0.9; clkLabC.visible = m < 0.9; clkC.visible = m < 0.98;
  look(0, 3.2, 8.5, 0, 2.6, 0, 50);
  setTop('中国は全土で1つの時間', '時差1時間が消える', fade(t, 0.15, 3.9, 0.2), GOLD);
  return stage;
}
function shotPer(t, T) {
  lift(240); const H = 4.4 / 36.119; mode('bars'); setNames('日本', '中国', '合併後');
  B.a.mat.color.set('#e8e8e8'); B.b.mat.color.set(CN); B.c.mat.color.set(MIX); stackJP.visible = false; B.c.g.visible = true;
  B.a.g.position.set(-2.5, 0.3, 0); B.c.g.position.set(0, 0.3, 0); B.b.g.position.set(2.5, 0.3, 0);
  B.a.setH(36.119 * H * easeOut(clamp((t - 0.2) / 1.2)), '3.6万ドル'); B.b.setH(13.97 * H * easeOut(clamp((t - 0.6) / 1.2)), '1.4万ドル'); B.c.setH(15.764 * H * easeOut(clamp((t - 1.4) / 1.2)), '約1.6万ドル');
  look(0, 4.4, 15.5, 0, 2.9, 0, 50);
  setTop('1人あたりGDP（2025年・IMF）合併後の平均', '日本の半分以下', fade(t, 0.15, 3.9, 0.2), RED);
  return stage;
}
function shotResult(t, T) {
  lift(260); mode('crowd'); popLab.visible = false;
  rings.forEach(r => { r.visible = true; r.scale.setScalar(1 + Math.sin(T * 6) * 0.08); });
  crowd.people.forEach((p, i) => { p.position.y = JP8.includes(i) ? Math.abs(Math.sin(T * 5 + i)) * 0.15 : 0; });
  crowdLab.position.set(0, 3.6, 1.0); crowdLab.userData.set('100人中 8人'); pop(crowdLab, 0.4, t, 3.6, 0.9);
  const u = ease(t / 8); look(lerp(0.4, 0, u), lerp(7.5, 6.6, u), lerp(14, 12.5, u), 0, 1.2, 0, 50);
  if (t < 3.9) setTop('合併後の日本人', '100人中8人', fade(t, 0.15, 3.9, 0.2), BLUE);
  else setTop('省になったら', 'ルールも変わる', fade(t, 3.9, 8.1, 0.2), RED);
  return stage;
}
function shotTwist(t, T) { lift(240); mode('phone'); bigPhone.rotation.y = Math.sin(T * 0.8) * 0.15; look(0, 3.4, 9.0, 0, 2.6, 0, 50); setTop('Instagramは中国では', '見られない', fade(t, 0.15, 2.6, 0.2), RED); return stage; }
function shotAsk(t, T) { lift(300); landScene(t, 1); mode('land', 'name'); areaLab.visible = false; jpName.visible = false; cnName.visible = false; nameQ.position.set(-0.2, 2.5, 0.2); nameQ.material.depthTest = false; nameQ.renderOrder = 9; pop(nameQ, 0.2, t, 5.6, 0.93); const u = ease(t / 3.4); look(-0.2, lerp(16, 15.5, u), 6.2, -0.2, 0, -1.2, 50); return stage; }

const shots = [
  { a: 0, b: 4.1, f: shot0 }, { a: 4.1, b: 16.0, f: shotPop }, { a: 16.0, b: 20.0, f: shotArea }, { a: 20.0, b: 24.0, f: (t, T) => shotStatus(t, T) },
  { a: 24.0, b: 28.0, f: shotGuang }, { a: 28.0, b: 32.0, f: (t, T) => shotStatus(t + 8, T) }, { a: 32.0, b: 36.0, f: shotRules }, { a: 36.0, b: 40.0, f: shotRoad },
  { a: 40.0, b: 44.8, f: shotMarry }, { a: 44.8, b: 48.0, f: shotBottle }, { a: 48.0, b: 52.0, f: shotVote }, { a: 52.0, b: 56.0, f: shotApps },
  { a: 56.0, b: 64.0, f: shotCrime }, { a: 64.0, b: 68.0, f: shotClock }, { a: 68.0, b: 72.0, f: shotPer }, { a: 72.0, b: 80.2, f: shotResult },
  { a: 80.2, b: 82.9, f: shotTwist }, { a: 82.9, b: 86.8, f: shotAsk }, { a: 86.8, b: 90.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 90.8,
  meta: {
    id: '0604',
    title: '中国と日本が合併したらどうなる？',
    titleHtml: '中国と日本が<br>合併したらどうなる？',
    mood: 'tension', seed: 604, hits: [12.1, 72.1], risers: [8.0, 72.0],
    impacts: [8.1, 12.1, 16.1, 24.1, 36.1, 40.1, 44.9, 48.1, 52.1, 56.1, 68.1, 72.1, 80.3],
    sfx: [[0.3, 'whoosh'], [3.0, 'poof'], [8.3, 'meter', 0.8], [12.2, 'bubble'], [16.4, 'bubble'], [20.5, 'whoosh'], [24.3, 'meter', 0.8], [28.6, 'bubble'], [37.6, 'whoosh'], [41.6, 'bubble'], [46.2, 'bubble'], [49.6, 'buzz'], [52.6, 'alarm'], [56.3, 'meter', 0.4], [65.4, 'whoosh'], [68.3, 'meter', 0.5], [80.4, 'alarm']],
    ask: '合併したら、国の名前どうする？',
    narr: { 'YouTube': 'ユーチューブ', 'Google': 'グーグル', 'LINE': 'ライン', '広東省': 'カントンしょう', '男22歳・女20歳': '男22、女20歳', '0.2、': 'れいてんに、', '0.5。': 'れいてんご。' },
    caption: '中国と日本が合併したらどうなる？\n\n人口：中国 約14億人＋日本 約1.2億人＝約15.3億人。インドを抜いて世界1位。\n日本人は100人中8人。面積は日本が全体の約3.8%。\n\n日本列島はどういう扱いになる？\n・省になるなら、人口は広東省（1億2,859万人）に次ぐ2番目\n・香港のような特別行政区なら、法律もお金も今のまま\n\n省になった場合、暮らしのルールが変わる（中国の法律）\n・車は左側通行から右側通行に\n・結婚できる年齢は、男女18歳から男22歳・女20歳に\n・お酒を買えるのは20歳から18歳に\n・国の議会（全国人民代表大会）の代表は間接選挙。直接は選べなくなる\n・インスタもYouTubeもLINEもGoogleもつながらない\n\n治安：殺人の発生率（10万人あたり）は日本0.2、中国0.5。どちらも世界でトップクラスに低い。\n時差：中国は国じゅう同じ時間。1時間の時差が消える。\n1人あたりGDP：日本3.6万ドル、中国1.4万ドル。合併後の平均は約1.6万ドルで日本の半分以下。\n\n結果：日本人は100人中8人。車も結婚もネットも変わる。\nそしてこの動画も、中国では見られない。\n\n合併したら、国の名前どうする？ コメントで教えて。\n\n※数字と制度で比べるだけの「もしも」です。\n\n出典：中国国家統計局（2026年1月）、総務省統計局 人口推計（2026年9月概算）、国連 世界人口推計2024、広東省統計（2025年末）、中華人民共和国 道路交通安全法・民法典・未成年人保護法・選挙法、香港基本法、法務省 犯罪白書／UNODC、世界銀行、IMF World Economic Outlook（2026年10月）',
    hashtags: ['もしも', '中国', '日本', '雑学', 'もしもラボ'],
    endStats: [['合併後の人口', '約15.3億人', '世界1位'], ['日本人の割合', '100人中8人', '8%'], ['省になったら', '人口2番目', '広東省の次'], ['車', '右側通行に', '道路交通安全法'], ['結婚できる年齢', '男22・女20', '民法典']],
    sources: '出典：中国国家統計局、総務省統計局、国連、広東省統計、<br>中国の法律（道路交通安全法・民法典ほか）、犯罪白書、IMF',
  },
});
