import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, makeSweat } from '../scenes/office.js';
import { planTimes, makeTimer } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしも前屈で床に届かない人が、1か月ストレッチしたら？（人体の限界・台本 S130・作り直し 0389）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。plan/remake.md の14：元の回は1行目が 体は柔らかくなった。でも理由が意外だった で、だれの話かが5秒で分からなかった。
// 0秒で 前屈で床に届かない課長と赤い線 を見せる。お題・数字・結果は元の回のまま
// 数字（一次資料で確認・2026/11/23）：
//  Mendez-Rebolledo ほか Annals of Physical and Rehabilitation Medicine 2026年69巻7号：84の研究のメタ分析。運動選手でない人の静的ストレッチで、脚を伸ばしたまま上げる角度（SLR）が 12.11度 大きく、
//   1週間以上・合計70分ほどで届きやすい。1か月なら1日約2分20秒は 70分÷30日 の単純計算
//  LaRoche・Connolly The American Journal of Sports Medicine 2006年：4週間のストレッチで 筋肉の硬さは変わらず、伸ばされることへの慣れ（stretch tolerance）が増えた
// 痛いほど伸ばさないで の札を出す。課長は笑う程度（体や年齢をばかにしない）

const GOLD = '#ffd27a', GREEN = '#9be86a', BLUE = '#7fc8ff', RED = '#ff6a6a';
const { S, flat, room, hemi } = makeSet({ bg: '#d8dee6', ground: '#8a8f99' }); hemi.intensity = 1.3;
const KACHO = makeSuit({ old: true, jacket: '#3a4256', tie: '#7a2a2a', glasses: true }); S.add(KACHO); const sweatK = makeSweat(); KACHO.userData.head.add(sweatK);
const KOUHAI = makeSuit({ jacket: '#3a5a6a', tie: '#3a6ab2' }); S.add(KOUHAI);
// 家での課長（部屋着）
const HOMEK = makeSuit({ old: true, jacket: '#7a8a6a', tie: '#7a8a6a', glasses: true }); S.add(HOMEK); const sweatH = makeSweat(); HOMEK.userData.head.add(sweatH);

// 前屈：腰（高さ0.86）で曲げる。a は前に倒す角度（ラジアン）。r は腕をさらに下へ伸ばす量
function bend(p, a, r = 0) { const s = p.scale.y, h = 0.86 * s; p.rotation.x = a; p.userData.legs.forEach(l => l.rotation.x = -a); p.userData.arms.forEach(x => x.rotation.set(-a - r, 0, 0)); p.position.y = h * (1 - Math.cos(a)); p.userData.head.rotation.x = -0.3; return p; }
function bendZ(p, a) { return -0.86 * p.scale.y * Math.sin(a); }
function tipY(p, a) { const s = p.scale.y; return (0.86 + 0.58 * Math.cos(a) - 0.68) * s; }
function tipZoff(p, a) { const s = p.scale.y; return 0.58 * Math.sin(a) * s; }
// あお向けで片脚を上げる
function lieRaise(p, x, z, deg) { poseClear(p); p.visible = true; p.rotation.set(-Math.PI / 2, 0, 0); p.position.set(x, 0.16, z); p.userData.legs[1].rotation.x = -deg * Math.PI / 180; p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); }

// ---------- A：オフィス（原点） ----------
room({ x: 0, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(-3.2 + i * 3.2, 2.0, -3.4); S.add(w); }
const ISL = makeDeskIsland(2); ISL.position.set(0, 0, -2.2); S.add(ISL);
const REDLINE = new THREE.Group(); { const b = box(0.035, 0.035, 0.7, new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); REDLINE.add(b); } S.add(REDLINE);
const FLOORMARK = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.7), new THREE.MeshBasicMaterial({ color: '#ffffff', depthWrite: false })); FLOORMARK.rotation.x = -Math.PI / 2; FLOORMARK.renderOrder = -0.7; S.add(FLOORMARK);
const todokanai = label('届かない', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(todokanai);
const nidomi = label('二度見', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.55 }); S.add(nidomi);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.38 }); S.add(katamaru);

// ---------- B：家のヨガマット（x=60） ----------
const BX = 60;
room({ x: BX, w: 8, d: 6, h: 3.0, wall: '#efe8da', floor: '#c8a880' });
const MAT = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), mat('#5ab0a0', { depthWrite: false })); MAT.rotation.x = -Math.PI / 2; MAT.position.set(BX, 0.012, -0.6); MAT.renderOrder = -0.7; S.add(MAT);
const TIMER = makeTimer(); TIMER.position.set(BX - 0.9, 1.75, -1.6); TIMER.rotation.y = Math.PI / 2; TIMER.scale.setScalar(0.6); S.add(TIMER);
const kawaranai = label('何も 変わらない気がする', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.35 }); S.add(kawaranai);
const tatta = label('たった2分', { w: 640, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.85 }); S.add(tatta);
const sukoshi = label('昨日より 少しだけ', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(sukoshi);
const yubi1 = label('あと指1本', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(yubi1);
const ARC = new THREE.Group(); S.add(ARC); { const m = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }); ARC.userData.m = m; }
function setArc(x, y, z, deg) { ARC.clear(); const g = new THREE.RingGeometry(0.5, 0.56, 24, 1, 0, deg * Math.PI / 180); const mesh = new THREE.Mesh(g, ARC.userData.m); mesh.rotation.y = Math.PI / 2; ARC.add(mesh); ARC.position.set(x, y, z); ARC.visible = true; }

// ---------- C：研究（x=120） ----------
const CX = 120;
flat(14, 10, '#3a3448', CX, 0); const cwall = box(14, 5, 0.2, mat('#2c2838')); cwall.position.set(CX, 2.5, -2.6); S.add(cwall);
const PAPERS = []; { const r = rng(130); for (let i = 0; i < 84; i++) { const p = box(0.32, 0.018, 0.44, mat(['#f4f2ea', '#e8eef4', '#f4ece0'][i % 3])); p.position.set(CX - 1.1 + (i % 4) * 0.72 + (r() - 0.5) * 0.04, 0.02 + Math.floor(i / 4) * 0.022, -0.6 + (r() - 0.5) * 0.04); p.rotation.y = (r() - 0.5) * 0.15; S.add(p); PAPERS.push(p); } }
const itai = label('痛いほど 伸ばさないで', { w: 1024, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(itai);
const MUSCLE = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.2, 6, 12), new THREE.MeshLambertMaterial({ color: '#c84a4a' })); MUSCLE.rotation.z = Math.PI / 2; S.add(MUSCLE);
const katasa = label('筋肉の硬さ 変わらず', { w: 1024, size: 92, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.15 }); S.add(katasa);
const nare = label('伸ばされることへの 慣れ', { w: 1100, size: 88, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(nare);
const daijobu = label('ここまで 大丈夫', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(daijobu);
const brake = label('怖がりな体の ブレーキ', { w: 1024, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.25 }); S.add(brake);

const PEOPLE = [KACHO, KOUHAI, HOMEK];
const LABELS = [todokanai, nidomi, katamaru, kawaranai, tatta, sukoshi, yubi1, itai, katasa, nare, daijobu, brake];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweatK.userData.set(0); sweatH.userData.set(0);
  REDLINE.visible = false; FLOORMARK.visible = false; ARC.visible = false; TIMER.visible = true; PAPERS.forEach(p => p.visible = true); MUSCLE.visible = false; hemi.intensity = 1.3;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function place(p, x, z, ry = 0) { p.visible = true; p.position.x = x; p.position.z = z; p.rotation.y = ry; }
const TP = 0.3;
const A0 = 1.35; // 課長の前屈の角度
function kachoBend(x, z, a = A0, r = 0) { bend(KACHO, a, r); place(KACHO, x, z + bendZ(KACHO, a)); return { ty: tipY(KACHO, a) - r * 0.3, tz: z + tipZoff(KACHO, a) }; }
function redLine(x, y, z, t, t0) { const k = clamp((t - t0) / 0.15); REDLINE.visible = t >= t0; REDLINE.position.set(x, y, z); REDLINE.scale.z = Math.max(0.001, easeOut(k)); FLOORMARK.visible = true; FLOORMARK.position.set(x, 0.013, z); }
function officeCam(u = 0) { look(lerp(4.8, 4.5, u), lerp(1.4, 1.35, u), 0.15, 0, 1.15, 0.15, 50); }
function shot0(t) { // 0秒＝サムネ：前屈した課長の指の先、床の手前に、赤い 届かない の線がパッと出る
  reset(); lift(0); const { ty, tz } = kachoBend(0, -0.3); place(KOUHAI, -0.6, -0.8, 1.3); KOUHAI.position.y = 0;
  redLine(0, ty - 0.02, tz, t, TP); if (t >= TP) { say(todokanai, t, TP + 0.05, 0.2, ty * 0.5, tz + 0.5, 0.6); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; }
  officeCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 前屈したまま固まった課長を、後輩が二度見する
  reset(); lift(140); const { ty, tz } = kachoBend(0, -0.3); redLine(0, ty - 0.02, tz, 1, 0); sweatK.userData.set(1, t);
  place(KOUHAI, -0.6, -0.8, 1.3); KOUHAI.position.y = 0; const ph = t / d; KOUHAI.userData.head.rotation.y = ph < 0.4 ? -0.9 : ph < 0.55 ? lerp(-0.9, 0.5, (ph - 0.4) / 0.15) : 0.5;
  if (ph > 0.55) say(nidomi, t, d * 0.55, -0.6, 2.15, -0.8, 0.5);
  if (ph > 0.3) say(katamaru, t, d * 0.3, 0.1, 1.45, 0.3, 0.32);
  officeCam(0.3 + 0.7 * ease(clamp(t / d)));
  return S;
}
function sFuman(t, d) { // 体が硬い人たちの不満から。伸ばしても伸ばしても、何も変わらない気がする
  reset(); lift(140); const a = 1.2 + Math.sin(t * 2.2) * 0.08; bend(HOMEK, a); place(HOMEK, BX, -0.6 + bendZ(HOMEK, a)); sweatH.userData.set(t > d * 0.5 ? 1 : 0, t);
  TIMER.userData.set('', '#fff');
  if (t > d * 0.45) say(kawaranai, t, d * 0.45, BX, 2.1, -0.8, 1.15);
  look(BX + 4.6, 1.2, -0.05, BX, 0.85, -0.05, 50);
  return S;
}
function sDay1(t, d) { // 1日目。伸ばしたのは、たった2分
  reset(); lift(140); const a = 1.25; bend(HOMEK, a); place(HOMEK, BX, -0.6 + bendZ(HOMEK, a));
  const sec = Math.min(120, Math.floor(t / d * 150)); TIMER.userData.set(Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), sec >= 120 ? '#9be86a' : '#fff');
  if (sec >= 120) say(tatta, t, d * 0.8, BX - 0.9, 2.3, -1.6, 0.7);
  setHud('毎日ストレッチ', '1日目', 1);
  look(BX + 4.6, 1.3, -0.6, BX, 1.0, -0.6, 50);
  return S;
}
function sWeek(t, d) { // 1週間後。寝ころんで脚を上げると、昨日より少しだけ上がる
  reset(); lift(140); TIMER.visible = false; const deg = lerp(50, 58, easeOut(clamp((t - d * 0.3) / (d * 0.4)))); lieRaise(HOMEK, BX, -0.1, deg);
  const rad = deg * Math.PI / 180; ARC.clear(); { const g = new THREE.RingGeometry(0.5, 0.56, 24, 1, Math.PI - rad, rad); const m = new THREE.Mesh(g, ARC.userData.m); m.rotation.y = Math.PI / 2; ARC.add(m); ARC.position.set(BX + 0.3, 0.2, -0.96); ARC.visible = true; }
  if (t > d * 0.55) say(sukoshi, t, d * 0.55, BX, 1.75, -0.6, 1.0);
  setHud('毎日ストレッチ', '1週間後', 1);
  look(BX + 5.2, 1.3, -1.0, BX, 0.6, -1.0, 50);
  return S;
}
function sTwoWeeks(t, d) { // 2週間後。赤い線まで、あと指1本
  reset(); lift(140); TIMER.visible = false; const a = 1.42; bend(HOMEK, a, 0.12); place(HOMEK, BX, -0.6 + bendZ(HOMEK, a)); const ty = tipY(HOMEK, a) - 0.12 * 0.3, tz = -0.6 + tipZoff(HOMEK, a);
  REDLINE.visible = true; REDLINE.position.set(BX, 0.1, tz); REDLINE.scale.z = 1; FLOORMARK.visible = true; FLOORMARK.position.set(BX, 0.013, tz);
  if (t > d * 0.4) say(yubi1, t, d * 0.4, BX + 0.2, 0.45, tz + 0.7, 0.55);
  setHud('毎日ストレッチ', '2週間後', 1);
  look(BX + 4.4, 1.0, -0.05, BX, 0.65, -0.05, 50);
  return S;
}
function sHonto(t, d) { // でも、本当に筋肉が伸びたのか
  reset(); lift(140); MUSCLE.visible = true; MUSCLE.position.set(CX, 1.3, -0.8); const k = 1 + 0.08 * Math.sin(t * 3); MUSCLE.scale.set(1, k, 1); PAPERS.forEach(p => p.visible = false);
  look(CX, 1.5, 3.2, CX, 1.25, -0.8, 50);
  return S;
}
function sStudy(t, d) { // 体が硬い人の84の研究をまとめると、脚の上がる角度は約12度アップ（2026年）
  reset(); lift(160); const ph = t / d; PAPERS.forEach((p, i) => p.visible = i < Math.round(84 * easeOut(clamp(ph / 0.45))));
  if (ph < 0.5) setTop('まとめた研究（2026年）', Math.round(84 * easeOut(clamp(ph / 0.45))) + '本', fade(t, 0.2, d * 0.5, 0.2), BLUE);
  else setTop('脚を伸ばしたまま上がる角度', '約12度アップ', fade(t, d * 0.5, d, 0.25), GREEN);
  setHud('運動選手でない人', '静的ストレッチ', 1);
  look(CX, 2.4, 3.0, CX, 0.4, -0.6, 50);
  return S;
}
function sKagi(t, d) { // カギは合計の時間。目安は合計70分。1か月なら1日約2分20秒
  reset(); lift(160); const ph = t / d;
  if (ph < 0.55) setTop('カギは 合計の時間', '合計70分', fade(t, 0.3, d * 0.55, 0.25), GOLD);
  else setTop('1か月なら 1日（単純計算）', '約2分20秒', fade(t, d * 0.55, d, 0.25), GOLD);
  say(itai, t, 0.5, CX, 1.45, -0.4, 1.1);
  setHud('目安', '1週間以上', 1);
  look(CX, 2.4, 3.0, CX, 0.4, -0.6, 50);
  return S;
}
function sTokoroga(t, d) { // ところが4週間の研究では、筋肉の硬さは変わらなかった（2006年）
  reset(); lift(140); PAPERS.forEach(p => p.visible = false); MUSCLE.visible = true; MUSCLE.position.set(CX, 1.3, -0.8); MUSCLE.scale.set(1, 1, 1);
  if (t > d * 0.4) say(katasa, t, d * 0.4, CX, 2.2, -0.8, 1.1);
  setHud('4週間の研究', '2006年', 1);
  look(CX, 1.5, 3.2, CX, 1.35, -0.8, 50);
  return S;
}
function sNare(t, d) { // 変わったのは、伸ばされることへの慣れだった
  reset(); lift(140); const a = 1.42; bend(HOMEK, a, 0.12); place(HOMEK, BX, -0.6 + bendZ(HOMEK, a)); TIMER.visible = false;
  if (t > d * 0.35) say(nare, t, d * 0.35, BX, 1.75, -0.4, 1.2);
  look(BX + 4.6, 1.2, -0.05, BX, 0.85, -0.05, 50);
  return S;
}
function sKekka(t, d) { // 結果：脚は約12度上がった。変わったのは筋肉より、体が覚えた ここまで大丈夫 だった
  reset(); lift(140); const ph = t / d;
  if (ph < 0.5) { TIMER.visible = false; lieRaise(HOMEK, BX, -0.1, 62); const rad = 62 * Math.PI / 180; ARC.clear(); { const g = new THREE.RingGeometry(0.5, 0.56, 24, 1, Math.PI - rad, rad); const m = new THREE.Mesh(g, ARC.userData.m); m.rotation.y = Math.PI / 2; ARC.add(m); ARC.position.set(BX + 0.3, 0.2, -0.96); ARC.visible = true; } setTop('結果', '脚が 約12度 上がった', fade(t, 0.3, d * 0.5, 0.25), GOLD); look(BX + 5.2, 1.3, -1.0, BX, 0.6, -1.0, 50); return S; }
  const a = 1.45; bend(HOMEK, a, 0.14); place(HOMEK, BX, -0.6 + bendZ(HOMEK, a)); TIMER.visible = false;
  say(daijobu, t, d * 0.55, BX, 1.75, -0.4, 0.95); setTop('結果', 'ここまで大丈夫', fade(t, d * 0.5, d, 0.25), GOLD);
  look(BX + 4.6, 1.2, -0.05, BX, 0.85, -0.05, 50);
  return S;
}
function sBrake(t, d) { // 体の硬さは、筋肉じゃなく、怖がりな体の、ブレーキだったのかもしれない
  reset(); lift(140); const { ty, tz } = kachoBend(0, -0.3, 1.45, 0.14); place(KOUHAI, -0.6, -0.8, 1.3); KOUHAI.position.y = 0; KOUHAI.userData.head.rotation.y = 0.5;
  if (t > d * 0.45) say(brake, t, d * 0.45, 0, 1.75, -0.3, 1.15);
  officeCam(0.6 + 0.4 * ease(clamp(t / d)));
  return S;
}
function sAsk(t) { reset(); lift(0); const { ty, tz } = kachoBend(0, -0.3); place(KOUHAI, -0.6, -0.8, 1.3); KOUHAI.position.y = 0; redLine(0, ty - 0.02, tz, 1, 0); todokanai.visible = true; todokanai.position.set(0, 1.65, -0.3); todokanai.userData.size(0.5); officeCam(0); return S; }

const NARR = { '前屈': 'ぜんくつ', '固まった': 'かたまった', '課長': 'かちょう', '後輩': 'こうはい', '二度見': 'にどみ', '体が硬い': 'からだがかたい', '不満': 'ふまん', '伸ばしても': 'のばしても', '何も': 'なにも', '変わらない': 'かわらない', '気がする': 'きがする', '1日目': 'いちにちめ', '伸ばした': 'のばした', '2分': 'にふん', '1週間後': 'いっしゅうかんご', '寝ころんで': 'ねころんで', '脚': 'あし', '上げる': 'あげる', '昨日': 'きのう', '少しだけ': 'すこしだけ', '上がる': 'あがる', '2週間後': 'にしゅうかんご', '赤い線': 'あかいせん', '指1本': 'ゆびいっぽん', '本当に': 'ほんとうに', '筋肉': 'きんにく', '伸びた': 'のびた', '84の研究': 'はちじゅうよんのけんきゅう', '角度': 'かくど', '約12度': 'やくじゅうにど', '合計': 'ごうけい', '時間': 'じかん', '目安': 'めやす', '70分': 'ななじゅっぷん', '1か月': 'いっかげつ', '1日約2分20秒': 'いちにちやくにふんにじゅうびょう', '4週間': 'よんしゅうかん', '研究': 'けんきゅう', '硬さ': 'かたさ', '変わった': 'かわった', '伸ばされる': 'のばされる', '慣れ': 'なれ', '結果：': '結果、', '上がった': 'あがった', '覚えた': 'おぼえた', '大丈夫': 'だいじょうぶ', '怖がり': 'こわがり', '床': 'ゆか', '手': 'て', '届く': 'とどく' };
const P = planTimes([
  ['前屈したまま固まった課長を、', (t, d) => sKatamaru(t, 2 * d)],
  ['後輩が二度見する。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['体が硬い人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['伸ばしても伸ばしても、<br>何も変わらない気がする。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。伸ばしたのは、<br>たった2分。', sDay1],
  ['1週間後。寝ころんで脚を<br>上げると、', (t, d) => sWeek(t, 2 * d)],
  ['昨日より少しだけ上がる。', (t, d) => sWeek(t + d, 2 * d)],
  ['2週間後。赤い線まで、<br>あと指1本。', sTwoWeeks],
  ['でも、本当に<br>筋肉が伸びたのか。', sHonto],
  ['体が硬い人の84の研究を<br>まとめると、', (t, d) => sStudy(t, 2 * d)],
  ['脚の上がる角度は<br>約12度アップ。', (t, d) => sStudy(t + d, 2 * d)],
  ['カギは合計の時間。<br>目安は合計70分。', (t, d) => sKagi(t, 2 * d)],
  ['1か月なら<br>1日約2分20秒。', (t, d) => sKagi(t + d, 2 * d)],
  ['ところが4週間の研究では、<br>筋肉の硬さは変わらなかった。', sTokoroga],
  ['変わったのは、<br>伸ばされることへの慣れだった。', sNare],
  ['結果：脚は約12度上がった。', (t, d) => sKekka(t, 2 * d)],
  ['変わったのは筋肉より、体が<br>覚えた ここまで大丈夫 だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['体の硬さは、筋肉じゃなく、', (t, d) => sBrake(t, 2 * d)],
  ['怖がりな体の、<br>ブレーキだったのかもしれない。', (t, d) => sBrake(t + d, 2 * d)],
  ['前屈で、床に手は届く？', sAsk],
], { shot0, endCard, start: 3.6, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0738',
    v2: true,
    tt: 'main',
    trial: true,
    remakeOf: '0389',
    hookLine: '前屈した課長の指の先、床の手前に、赤い 届かない の線がパッと出る。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも前屈で床に届かない人が、1か月ストレッチしたら？',
    titleHtml: 'もしも前屈で<br>床に届かない人が、<br>1か月ストレッチ<br>したら？',
    mood: 'hopeful', seed: 738, hits: [TP, P.at(10, 0.2), P.at(15)], risers: [P.at(8)], impacts: [P.at(10, 0.3), P.at(12, 0.3), P.at(13, 1.0)],
    sfx: [[TP, 'whoosh'], [P.at(0, 1.0), 'bubble'], [P.at(4, 1.0), 'meter', 0.2], [P.at(7, 0.8), 'alarm']],
    narr: NARR,
    ask: '前屈で、床に手は届く？',
    caption: 'もしも前屈で床に届かない人が、1か月ストレッチしたら？\n\n前屈したまま固まった課長を、後輩が二度見する。\n体が硬い人たちの不満から。伸ばしても伸ばしても、何も変わらない気がする。\n1日目。伸ばしたのは、たった2分。\n1週間後。寝ころんで脚を上げると、昨日より少しだけ上がる。\n2週間後。赤い線まで、あと指1本。\nでも、本当に筋肉が伸びたのか。\n体が硬い人の84の研究をまとめると、脚の上がる角度は約12度アップ（2026年）。\nカギは合計の時間。目安は合計70分。1か月なら1日約2分20秒（単純計算）。\nところが4週間の研究では、筋肉の硬さは変わらなかった（2006年）。\n変わったのは、伸ばされることへの慣れだった。\n\n結果：脚は約12度上がった。変わったのは筋肉より、体が覚えた ここまで大丈夫 だった。\n体の硬さは、筋肉じゃなく、怖がりな体の、ブレーキだったのかもしれない。\n\n前屈で、床に手は届く？ コメントで教えて。\n\n※痛いほど伸ばさないでください。登場する人物は架空です\n出典：Mendez-Rebolledo ほか Annals of Physical and Rehabilitation Medicine 2026年（84の研究のメタ分析・運動選手でない人の静的ストレッチで脚を伸ばしたまま上げる角度が12.11度大きい、合計70分が目安）／LaRoche・Connolly The American Journal of Sports Medicine 2006年（4週間で筋肉の硬さは変わらず、伸ばされることへの慣れが増えた）',
    hashtags: ['もしもラボ', 'もしも', 'ストレッチ', '体が硬い', '人体の限界'],
    endStats: [['脚を伸ばしたまま上がる角度', '約12度アップ', '2026年・84の研究のまとめ'], ['目安の合計時間', '70分（1日約2分20秒）', '1か月なら（単純計算）'], ['4週間で変わったもの', '伸ばされることへの慣れ', '2006年・筋肉の硬さは変わらず']],
    sources: '出典：Mendez-Rebolledo ほか Ann Phys Rehabil Med 2026／LaRoche・Connolly Am J Sports Med 2006<br>※痛いほど伸ばさないで',
  },
});
