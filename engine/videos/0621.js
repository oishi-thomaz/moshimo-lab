import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, comma } from '../lib.js';
import { japan, ll, setMapEnv, setDots, LAND_Y } from '../scenes/japan.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el, textSprite } from '../story.js';

// もしも北朝鮮が消えたら？（v2）— 消えるのは「国（体制）」。そこに住む人は消えない
// 数字（すべて一次資料で確認）：
//  ・北朝鮮の人口：2,657万人（2025年・世界銀行）
//  ・2022年の弾道ミサイル発射：少なくとも59発（防衛省 令和5年版防衛白書）
//  ・2022年10月4日：7時22分ごろ発射、Jアラート 北海道7時27分・青森7時29分、青森上空の通過7時28〜29分ごろ、日本上空の通過は5年ぶり（消防庁 令和4年版消防白書）
//  ・核弾頭：約50発を組み立て済みと推定（SIPRI 年鑑2025）
//  ・ロシアへの派兵：1万人超（韓国・西側の情報機関の推定。AFP 2025年4月）
//  ・暗号資産の窃取：2025年に少なくとも20億2,000万ドル（Chainalysis）
//  ・南北離散家族：登録13万4,516人、生存3万4,368人（2025年末・韓国統一部。Korea Times 2026年1月）
//  ・拉致被害者：政府認定17人、帰国5人（政府 拉致問題対策本部）
// 結論はゆうとの希望で「世界は少し平和に近づく」。統一の費用は重い、をひと言だけ入れて、質問は割れる形にする（2026/10/31）

const RED = '#ff6b5b', GREEN = '#7ff0c8', GOLD = '#ffd27a', BLUE = '#7fd4ff';
const P = (lon, lat) => { const v = ll(lon, lat); return new THREE.Vector2(v.x, -v.z); };
function landMesh(pts, color, y = -0.3) {
  const shape = new THREE.Shape(pts.map(([a, b]) => P(a, b)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.35, bevelSegments: 1 }); geo.rotateX(-Math.PI / 2);
  const top = new THREE.MeshLambertMaterial({ color, flatShading: true }), side = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.7) });
  const m = new THREE.Mesh(geo, [top, side]); m.position.y = y; japan.add(m); return { m, top, side };
}
// ---------- 朝鮮半島と大陸 ----------
const BORDER = [[124.3, 40.0], [125.0, 40.5], [125.8, 40.9], [126.6, 41.6], [127.3, 41.5], [128.1, 41.6], [128.3, 42.0], [129.0, 42.1], [129.7, 42.4], [130.2, 42.9], [130.7, 42.4]];
const NK = [...BORDER, [130.0, 41.5], [129.7, 40.9], [129.2, 40.7], [128.7, 40.2], [127.6, 39.8], [127.45, 39.2], [128.35, 38.62], [127.8, 38.3], [127.1, 38.3], [126.6, 37.8], [126.1, 37.75], [125.3, 37.7], [124.7, 38.1], [125.0, 38.6], [125.3, 39.3], [124.7, 39.6]];
const SK = [[126.1, 37.75], [126.6, 37.8], [127.1, 38.3], [127.8, 38.3], [128.35, 38.62], [128.6, 38.2], [129.4, 37.0], [129.5, 36.0], [129.4, 35.5], [129.0, 35.1], [128.4, 34.85], [127.6, 34.6], [126.9, 34.4], [126.3, 34.5], [126.3, 35.1], [126.5, 35.9], [126.8, 36.4], [126.5, 36.9], [126.8, 37.3], [126.6, 37.5]];
const MAIN = [[112, 37], [117.5, 38.6], [118.5, 39.2], [121.0, 39.0], [121.6, 40.9], [123.0, 39.7], [124.3, 40.0], ...BORDER.slice(1), [131.5, 43.0], [133.0, 42.8], [135.3, 43.9], [137.5, 45.5], [140.3, 48.5], [140.5, 52], [112, 52]];
const nk = landMesh(NK, '#c94f45');
const sk = landMesh(SK, '#7cc08a');
const cont = landMesh(MAIN, '#6f9a76', -0.35);
// 軍事境界線（38度線あたり）
const DMZ = [[126.1, 37.75], [126.6, 37.8], [127.1, 38.3], [127.8, 38.3], [128.35, 38.62]];
const dmzM = new THREE.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 1 });
const dmz = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(DMZ.map(([a, b]) => ll(a, b, LAND_Y + 0.6))), 60, 0.55, 6), dmzM); japan.add(dmz);
// 国境（中国・ロシアとの境）
const borderM = new THREE.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 1 });
const border = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(BORDER.map(([a, b]) => ll(a, b, LAND_Y + 0.6))), 80, 0.45, 6), borderM); japan.add(border);
// ラベル
const lab = (s, lon, lat, o = {}) => { const sp = textSprite(s, { w: 640, h: 160, size: 84, color: o.color || '#fff', bg: o.bg || 'rgba(10,14,22,.78)', sx: o.sx || 34 }); sp.position.copy(ll(lon, lat, o.y ?? 14)); japan.add(sp); return sp; };
const labNK = lab('北朝鮮', 127.0, 40.3, { color: '#ffd0c8' });
const labKR = lab('朝鮮半島', 127.6, 38.2, { color: GREEN });
const labJ = lab('日本', 139.5, 37.6, { sx: 26 });
const labAomori = lab('青森', 140.8, 40.9, { sx: 22, bg: 'rgba(120,20,20,.85)' });
const labRu = lab('ロシアへ 1万人超', 125.5, 44.2, { sx: 44, color: '#ffd0c8' });
// ミサイル（平壌 → 青森の上 → 太平洋）
const MIS = new THREE.CatmullRomCurve3([ll(125.75, 39.03, 2), ll(131, 40.0, 60), ll(140.7, 40.8, 70), ll(152, 41, 30), ll(158, 41, 2)]);
const misGeo = new THREE.TubeGeometry(MIS, 200, 0.7, 6); const misM = new THREE.MeshBasicMaterial({ color: '#ffb35a', transparent: true, opacity: 1 });
const mis = new THREE.Mesh(misGeo, misM); japan.add(mis);
const misHead = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff2c0' })); japan.add(misHead);
function setMissile(k, on = 1) { mis.visible = misHead.visible = !!on && k > 0; const n = Math.floor(misGeo.index.count / 3 * clamp(k)) * 3; misGeo.setDrawRange(0, n); misHead.position.copy(MIS.getPoint(clamp(k))); misM.opacity = on; }
// 核弾頭 50（寧辺のあたりに並べる）
const NW = 50; const whM = new THREE.MeshLambertMaterial({ color: '#d9dde4' });
const wh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 3.4, 8), whM, NW); japan.add(wh);
const whP = []; { const c = ll(126.4, 40.3, LAND_Y + 1.8); for (let i = 0; i < NW; i++) whP.push(new THREE.Vector3(c.x + (i % 10 - 4.5) * 2.6, c.y, c.z + (Math.floor(i / 10) - 2) * 2.6)); }
const _m = new THREE.Matrix4();
function setWarheads(k, t = 0) { for (let i = 0; i < NW; i++) { const on = i / NW >= k; const s = on ? 1 : 0.0001; _m.makeScale(s, s, s).setPosition(whP[i].x, whP[i].y + (on ? 0 : 0) + Math.sin(t * 2 + i) * 0.1, whP[i].z); wh.setMatrixAt(i, _m); } wh.instanceMatrix.needsUpdate = true; }
// 人（離散家族）：38度線の南北から近づく点
const NF = 80; const fam = new THREE.InstancedMesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshBasicMaterial({ color: GOLD }), NF); japan.add(fam);
const famA = [], famB = []; { const r = rng(5); for (let i = 0; i < NF; i++) { const lon = 126.3 + r() * 1.9, lat0 = 38.25 + (lon - 126.3) * 0.18; famA.push([lon, lat0 + (i % 2 ? 0.9 : -0.9) * (0.4 + r() * 0.6)]); famB.push([lon + (r() - .5) * 0.15, lat0 + (r() - .5) * 0.08]); } }
function setFam(k, on = 1) { fam.visible = !!on; for (let i = 0; i < NF; i++) { const a = famA[i], b = famB[i], u = easeOut(clamp(k)); const v = ll(lerp(a[0], b[0], u), lerp(a[1], b[1], u), LAND_Y + 1.0); _m.makeTranslation(v.x, v.y, v.z); fam.setMatrixAt(i, _m); } fam.instanceMatrix.needsUpdate = true; }
const spark = makeSparkles(500, 1.6, 0xffe2c0); japan.add(spark.points);
spark.init(NK.filter((_, i) => i % 1 === 0).map(([a, b]) => { const v = ll(a, b, LAND_Y + 1); return [v.x, v.y, v.z]; }), 6, 30);
const whSpark = makeSparkles(260, 1.2, 0xfff2c0); japan.add(whSpark.points); whSpark.init(whP.map(v => [v.x, v.y, v.z]), 2, 16);

// 国が消えたかどうか（0..1）：赤い土地と国境線が、ふつうの緑の土地に
function regime(k) {
  const c = new THREE.Color('#c94f45').lerp(new THREE.Color('#7cc08a'), clamp(k)); nk.top.color.copy(c); nk.side.color.copy(c).multiplyScalar(0.7);
  borderM.opacity = dmzM.opacity = 1 - clamp(k); border.visible = dmz.visible = k < 0.999;
  labNK.material.opacity = 1 - clamp(k * 1.5); labNK.visible = k < 0.99 && labNK.userData.show !== false;
}
function base() { setMapEnv('day'); setDots(() => ({ color: '#ffffff' })); for (const s of [labKR, labJ, labAomori, labRu]) s.visible = false; setMissile(0, 0); setWarheads(1); wh.visible = false; setFam(0, 0); spark.set(0); whSpark.set(0); el.flash.style.opacity = 0; }

const SUBS = [
  [2.6, 6.1, '国が消えても、<br>2,657万人の人はそのまま。'],
  [6.2, 10.1, '最初に変わるのは、<br>日本の朝。'],
  [10.2, 14.1, '2022年、北朝鮮のミサイルは<br>少なくとも59発。'],
  [14.2, 18.1, 'Jアラートが鳴ったのは、<br>発射の5分後。'],
  [18.2, 22.1, 'その頃にはもう、<br>青森の真上だった。'],
  [22.2, 26.1, 'でも本当に大きいのは、<br>ここから。'],
  [26.2, 30.1, '核弾頭、約50発。<br>それがアジアから消える。'],
  [30.2, 34.1, 'ロシアに送られた兵士、<br>1万人超も帰ってくる。'],
  [34.2, 38.1, '1年に約20億ドルの<br>暗号資産の盗みも止まる。'],
  [38.2, 42.1, '38度線が開いて、離れ離れの<br>家族3万4千人が会える。'],
  [42.2, 47.8, '帰れていない拉致被害者も、<br>やっと探しに行ける。'],
  [48.0, 54.6, '結果：警報の鳴らない朝と、<br>核約50発のないアジア。'],
  [54.7, 57.4, 'ただ、統一にかかるお金は<br>とてつもなく重い。'],
  [57.5, 61.3, '世界は平和に近づく？<br>近づかない？'],
];

const cd = (left) => `0:${String(Math.floor(Math.max(0, left))).padStart(2, '0')}.${String(Math.floor((Math.max(0, left) % 1) * 100)).padStart(2, '0')}`;
const TP = 0.5;
const peninsula = (t, d = 2.6, z0 = 175, z1 = 160) => { const u = ease(clamp(t / d)); look(-74, lerp(z0, z1, u), lerp(70, 62, u), -74, 0, -24, 50); };
function shot0(t) { // 0秒＝サムネ：赤い北朝鮮と国境。0.5秒で国が消える
  base(); lift(40);
  regime(t < TP ? 0 : easeOut(clamp((t - TP) / 0.5)));
  spark.set(t >= TP ? (t - TP) / 1.8 : 0);
  el.flash.style.opacity = t >= TP ? 0.45 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  peninsula(t);
  setHud('北朝鮮が消えるまで', cd(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return japan;
}
function shot1(t) { // 人はそのまま：半島に人の光
  base(); regime(1); labKR.visible = true; lift(140);
  setDots(() => ({ color: '#ffffff' })); setFam(0, 1);
  peninsula(t + 2.6, 6, 175, 150);
  setTop('北朝鮮の人口（2025年）', comma(countUp(t, 2657)) + '万人', fade(t, 0.15, 3.5, 0.25), GREEN);
  return japan;
}
function shot2(t) { // 日本の朝 / 59発 / 6分で青森
  base(); regime(0); labJ.visible = true; labAomori.visible = t > 8; lift(120);
  const k = clamp((t - 4.2) / 6.5); setMissile(k);
  const u = ease(clamp(t / 16));
  look(lerp(-20, 0, u), lerp(300, 290, u), lerp(190, 200, u), lerp(-10, 5, u), 20, -25, 58);
  if (t < 4) setTop('いつもの朝', '日本', fade(t, 0.15, 3.9, 0.25));
  else if (t < 8) setTop('北朝鮮の弾道ミサイル（2022年）', '少なくとも' + countUp(t - 4, 59) + '発', fade(t, 4.0, 8.0, 0.25), RED);
  else if (t < 12) setTop('2022年10月4日 Jアラート', '発射の5分後', fade(t, 8.0, 12.0, 0.25), GOLD);
  else setTop('青森の上空を通過', '7時28分ごろ', fade(t, 12.0, 15.9, 0.25), RED);
  setHud('', '', 0);
  return japan;
}
function shot3(t) { // 消えた世界：同じ朝、ミサイルは来ない
  base(); regime(1); labJ.visible = true; lift(120);
  const u = ease(clamp(t / 4)); look(lerp(-10, -20, u), 210, 120, -10, 0, -18, 50);
  setTop('北朝鮮が消えた世界のJアラート', '0回', fade(t, 0.15, 3.9, 0.25), GREEN);
  return japan;
}
function shot4(t) { // 核50発が消える
  base(); regime(0); wh.visible = true; labNK.visible = false; lift(140);
  const k = easeOut(clamp((t - 1.0) / 1.8)); setWarheads(k, t); whSpark.set(t > 1.0 ? (t - 1.0) / 2.2 : 0);
  const c = ll(126.4, 40.3); const u = ease(clamp(t / 4));
  look(c.x + lerp(20, 16, u), lerp(48, 40, u), c.z + lerp(46, 40, u), c.x, 2, c.z, 50);
  setTop('北朝鮮の核弾頭（推定・SIPRI 2025）', '約' + Math.round(50 * (1 - k)) + '発', fade(t, 0.15, 3.9, 0.25), k > 0.99 ? GREEN : RED);
  return japan;
}
function shot5(t) { // ロシアへの派兵・暗号資産
  base(); regime(0); labRu.visible = t < 4; lift(140);
  const u = ease(clamp(t / 8)); look(-74 + lerp(-10, 10, u), lerp(240, 220, u), 60, -74, 0, -40, 50);
  if (t < 4) setTop('ロシアへの派兵（情報機関の推定）', '1万人超', fade(t, 0.15, 3.9, 0.25), RED);
  else setTop('北朝鮮の暗号資産の窃取（2025年）', '約20億ドル', fade(t, 4.0, 7.9, 0.25), RED);
  return japan;
}
function shot6(t) { // 38度線が開いて家族が会う
  base(); regime(easeOut(clamp(t / 1.2))); setFam(clamp((t - 0.8) / 2.5)); lift(140);
  const c = ll(127.2, 38.1); const u = ease(clamp(t / 4));
  look(c.x, lerp(90, 70, u), c.z + lerp(70, 55, u), c.x, 0, c.z, 50);
  setTop('南北の離散家族 生存者（2025年末）', comma(countUp(t, 34368)) + '人', fade(t, 0.15, 3.9, 0.25), GOLD);
  return japan;
}
function shot7(t) { // 拉致被害者
  base(); regime(1); labJ.visible = true; lift(140);
  const u = ease(clamp(t / 5.6)); look(lerp(-50, -30, u), 220, 110, -30, 0, -20, 50);
  setTop('拉致被害者（政府認定17人）', '帰国できたのは5人', fade(t, 0.15, 5.5, 0.25), GOLD);
  return japan;
}
function shot8(t) { // 結果：静かなアジア
  base(); regime(1); labKR.visible = true; labJ.visible = true; lift(120);
  const u = ease(clamp(t / 6.6)); look(lerp(-40, -20, u), lerp(260, 300, u), lerp(130, 150, u), -25, 0, -18, 48);
  if (t < 3.3) setTop('鳴らなくなる警報', 'Jアラート', fade(t, 0.15, 3.3, 0.25), GREEN);
  else setTop('消える核弾頭', '約50発', fade(t, 3.3, 6.6, 0.25), GREEN);
  return japan;
}
function shot9(t) { // ただし：統一の重さ
  base(); regime(1); labKR.visible = true; lift(140);
  peninsula(2.6, 2.6);
  setTop('暮らしを立て直す人数', '2,657万人', fade(t, 0.15, 2.7, 0.25), GOLD);
  return japan;
}
function shot10(t) { // ループ：冒頭と同じ半島。カウントダウンは 0:00.50
  base(); regime(0); lift(40);
  peninsula(t * 0.15, 2.6);
  setHud('北朝鮮が消えるまで', cd(TP), 1, { mono: true });
  return japan;
}

const shots = [
  { a: 0, b: 2.6, f: shot0 }, { a: 2.6, b: 6.2, f: shot1 }, { a: 6.2, b: 22.2, f: shot2 }, { a: 22.2, b: 26.2, f: shot3 },
  { a: 26.2, b: 30.2, f: shot4 }, { a: 30.2, b: 38.2, f: shot5 }, { a: 38.2, b: 42.2, f: shot6 }, { a: 42.2, b: 47.9, f: shot7 },
  { a: 47.9, b: 54.6, f: shot8 }, { a: 54.6, b: 57.4, f: shot9 }, { a: 57.4, b: 61.5, f: shot10 }, { a: 61.5, b: 65.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.5,
  meta: {
    id: '0621',
    v2: true,
    hookLine: '北朝鮮という国が、一夜で消えた。',
    series: '国が消えたら',
    hookType: 'H5',
    cat: '社会・政治',
    title: '北朝鮮が消えたら？',
    titleHtml: '北朝鮮が<br>消えたら？',
    mood: 'tension', seed: 621, hits: [0.5, 48.0], risers: [22.2], impacts: [10.2, 14.2, 18.2, 27.2, 38.2, 48.0],
    sfx: [[0.5, 'poof'], [10.5, 'alarm'], [27.4, 'poof'], [38.6, 'whoosh'], [54.8, 'buzz']],
    narr: { '2,657万人': '2657まんにん', '59発': 'ごじゅうきゅうはつ', '50発': 'ごじっぱつ', '1万人超': 'いちまんにんちょう', '20億ドル': 'にじゅうおくドル', '3万4千人': 'さんまんよんせんにん', '38度線': 'さんじゅうはちどせん', 'Jアラート': 'ジェイアラート' },
    ask: '世界は平和に近づく？近づかない？',
    caption: 'もしも北朝鮮という国が一夜で消えたら？（消えるのは国の仕組みで、2,657万人の人はそのまま）\n\n2022年、北朝鮮の弾道ミサイルは少なくとも59発。10月4日の朝、Jアラートが鳴ったのは発射の5分後で、その頃にはもう青森の真上だった。\n核弾頭は推定約50発。ロシアへの派兵は1万人超、暗号資産の盗みは2025年だけで約20億ドル。\n38度線が開けば、離れ離れの南北の家族3万4,368人が会える。帰れていない拉致被害者も、やっと探しに行ける。\n\n結果：警報の鳴らない朝と、核約50発のないアジア。ただ、統一にかかるお金はとてつもなく重い。\n\n世界は平和に近づく？近づかない？ コメントで教えて。\n\n出典：防衛省 令和5年版防衛白書、消防庁 令和4年版消防白書、SIPRI 年鑑2025、Chainalysis（2025年）、韓国統一部（2025年末）、政府 拉致問題対策本部、世界銀行（2025年）',
    hashtags: ['もしもラボ', '北朝鮮', 'Jアラート', '国際情勢', '雑学'],
    endStats: [['2022年の弾道ミサイル', '少なくとも59発', '防衛省'], ['核弾頭（推定）', '約50発', 'SIPRI 2025'], ['暗号資産の窃取', '約20億ドル', '2025年'], ['南北離散家族の生存者', '34,368人', '2025年末'], ['拉致被害者（政府認定）', '17人中 帰国5人', '']],
    sources: '出典：防衛省、消防庁、SIPRI、Chainalysis、韓国統一部、<br>拉致問題対策本部、世界銀行',
  },
});
