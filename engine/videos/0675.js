import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeShaker, makeProteinBag, makeCounter, makeMirror, makeTable } from '../scenes/home.js';

// もしも毎日プロテインを飲むのを1か月続けたら？（台本 S67・人体の限界）
// 2026/11/11 ゆうと 直してOK：プロテインを飲んでいるだけで筋肉がつくという誤解を払拭する内容も入れる。1食をプロテインに置き換えるダイエットのリスクも説明する
// 数字（一次資料で確認済み）：
//  ・たんぱく質の推奨量 18〜64歳 男性65g・女性50g/日（厚生労働省「日本人の食事摂取基準（2025年版）」）
//  ・1日の平均摂取量 20歳以上 男性78.0g・女性65.9g（厚生労働省「令和6年 国民健康・栄養調査結果の概要」）。平均であって全員が足りているとは言わない
//  ・筋トレなしのプロテイン：Kirwan RP ほか. Am J Clin Nutr 2022;115(3):897-913（Europe PMC の抄録で確認 2026/11/11）
//    平均50歳以上の28のランダム化比較試験のメタ分析。筋トレなしでは、たんぱく質を増やしても 除脂肪量・手足の筋肉量・握力 に上乗せの効果なし。筋トレと組み合わせたときだけ 手足の筋肉量と握力が増えた
//  ・置き換え・食事を減らしすぎるダイエット：神奈川県「ダイエットで筋肉まで落とすと、太りやすくなる」（未病改善のページ）
//    食事を抜くなどの極端なダイエットは脂肪だけでなく筋肉や骨まで減る。筋肉量が減ると代謝が落ちて脂肪がつきやすくなり、リバウンドを招く
// 腎臓の病気など医療の話には踏み込まない。プロテインが体に悪いとは言わない。実在の商品・ブランドの見た目は出さない

const GOLD = '#ffd27a', BLUE = '#7fd4ff', GREEN = '#9be86a', PINK = '#ff9ec7', RED = '#ff6a5a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d8e8' }); hemi.intensity = 1.4;
const ME = makeSuit({ jacket: '#3a4256', tie: '#c8242c' }); S.add(ME); // 筋トレしてない同僚
const SHAKER = makeShaker('#3a7fd0'); S.add(SHAKER);
const BAG = makeProteinBag(); S.add(BAG);

// ---------- A：職場（原点） ----------
const roomA = room({ x: 0, w: 9, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = { userData: { seats: [{ x: -2.2, z: -0.7, ry: 0 }, null, { x: 0, z: -0.7, ry: 0 }, { x: 2.2, z: -0.7, ry: 0 }] } };
[-2.2, 0, 2.2].forEach(x => { const t = makeTable({ w: 1.5, d: 0.8, h: TABLE_Y - 0.03, color: '#e8e4dc' }); t.position.set(x, 0, -0.75); S.add(t); });
const COWORK = [makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }), makeSuit({ jacket: '#56504a', tie: '#5a8a4a' })]; COWORK.forEach(p => S.add(p));
const sparkA = makeSparkles(120, 0.14, 0xfff2c0); S.add(sparkA.points);
const don = label('毎日 プロテイン', { w: 900, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.6 }); S.add(don);
const shaka = label('シャカシャカ', { w: 640, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.1 }); S.add(shaka);
const torutoru = label('とればとるほどいい', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.8 }); S.add(torutoru);
const asahiruban = label('朝・昼・晩', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.96)', sx: 1.1 }); S.add(asahiruban);
const sweatC = makeSweat(); COWORK[0].userData.head.add(sweatC);

// ---------- B：家の台所（x=60）：洗うのは家族 ----------
const BX = 60;
const roomB = room({ x: BX, w: 6, d: 5, h: 3, wall: '#efeae0', floor: '#cfd2d8' });
const CNT = makeCounter({ w: 3.6 }); CNT.position.set(BX, 0, -1.9); S.add(CNT);
const FAMILY = makeWoman({ shirt: '#9fc7a8', hair: '#4a3020', pants: '#4a4f60' }); S.add(FAMILY);
const SINK_SH = [0, 1, 2, 3].map(i => { const s = makeShaker(['#3a7fd0', '#3a7fd0', '#3a7fd0', '#3a7fd0'][i]); S.add(s); return s; });
const kazoku = label('洗うのは家族', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(kazoku);

// ---------- C：洗面所（x=120）：鏡の腕 ----------
const CX = 120;
const roomC = room({ x: CX, w: 5, d: 4, h: 3, wall: '#e6eef2', floor: '#c8ccd4' });
const MIRROR = makeMirror(1.2, 1.3); MIRROR.position.set(CX, 0, -1.9); S.add(MIRROR);
const kawaranai = label('何も変わらない', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.5 }); S.add(kawaranai);

// ---------- D：数字（x=180）：目安と平均の棒 ----------
const DX = 180;
flat(16, 12, '#e8eaee', DX, 0);
const dWall = box(16, 5, 0.2, mat('#f4f6f8')); dWall.position.set(DX, 2.5, -3); S.add(dWall);
function bar(color) { const g = new THREE.Group(); const b = box(0.9, 1, 0.6, mat(color)); b.position.y = 0.5; g.add(b); g.userData.b = b; S.add(g); return g; }
const BARS = [bar('#9aa6b8'), bar('#3a7fd0'), bar('#c8a8b8'), bar('#e85a8a')];
[DX - 1.9, DX - 0.9, DX + 0.9, DX + 1.9].forEach((x, i) => BARS[i].position.set(x, 0, -1));
const BV = [65, 78, 50, 66];
const BL = ['目安', '平均', '目安', '平均'].map((s, i) => { const l = label(s, { w: 384, size: 90, color: '#2a2a2a', bg: 'rgba(255,255,255,.95)', sx: 0.6 }); S.add(l); return l; });
const BN = BV.map((v, i) => { const l = label((i % 2 ? '平均' : '目安') + v + 'g', { w: 384, size: 100, color: '#fff', bg: 'rgba(42,46,56,.92)', sx: 0.62 }); S.add(l); return l; });
const GL = ['男性', '女性'].map(s => { const l = label(s, { w: 384, size: 110, color: '#fff', bg: 'rgba(58,127,208,.96)', sx: 0.75 }); S.add(l); return l; });
const LINE = [0, 1].map(() => { const m = box(2.3, 0.04, 0.05, new THREE.MeshBasicMaterial({ color: '#d23a3a' })); S.add(m); return m; });
function setBars(k, show = [1, 1, 1, 1]) { BARS.forEach((g, i) => { const h = Math.max(0.01, BV[i] / 30 * clamp(k[i] ?? k)); g.userData.b.scale.y = h; g.userData.b.position.y = h / 2; g.visible = !!show[i]; BL[i].visible = false; BL[i].position.set(g.position.x, -0.35 + 0.0, -0.6); BL[i].position.y = 0.3; BN[i].visible = !!show[i] && clamp(k[i] ?? k) > 0.95; BN[i].position.set(g.position.x, h + 0.35, -0.7); BN[i].userData.size(0.9); });
  GL[0].position.set(DX - 1.4, 3.6, -1); GL[1].position.set(DX + 1.4, 3.6, -1); GL.forEach(l => { l.visible = true; l.userData.size(0.75); }); }
const koete = label('もう超えていた', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(koete);

// ---------- E：研究（x=240）：筋トレなし／あり ----------
const EX = 240;
flat(16, 12, '#dfe6ea', EX, 0);
const eWall = box(16, 4, 0.2, mat('#eef2f4')); eWall.position.set(EX, 2, -3); S.add(eWall);
const NOTR = makeMan({ shirt: '#e9e4da', hair: '#5a5a5a', pants: '#3a3f4a' }); S.add(NOTR);
const TRAIN = makeMan({ shirt: '#e9e4da', hair: '#5a5a5a', pants: '#3a3f4a' }); S.add(TRAIN);
const SH2 = makeShaker('#3a7fd0'); S.add(SH2); const SH3 = makeShaker('#3a7fd0'); S.add(SH3);
const DB = new THREE.Group(); { const m = mat('#2a2e38'); const h = box(0.08, 0.08, 0.5, mat('#9aa0a8')); DB.add(h); for (const z of [-0.22, 0.22]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), m); p.rotation.x = Math.PI / 2; p.position.z = z; DB.add(p); } } S.add(DB);
const nashiL = label('筋トレなし', { w: 640, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.1 }); S.add(nashiL);
const ariL = label('筋トレあり', { w: 640, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(ariL);
const fuenai = label('増えない', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(fuenai);
const fueta = label('増えた', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.8 }); S.add(fueta);
function bulk(p, k) { p.userData.arms.forEach(a => a.scale.set(1 + 0.6 * k, 1, 1 + 0.6 * k)); }

// ---------- F：置き換え（x=300） ----------
const FX = 300;
const roomF = room({ x: FX, w: 7, d: 5, h: 3, wall: '#efe6d6', floor: '#b48a5e' });
const TBL = makeTable({ w: 1.4, d: 0.8, color: '#c9a77a' }); TBL.position.set(FX, 0, -0.9); S.add(TBL);
const PLATE = new THREE.Group(); { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.04, 18), mat('#f4f2ec')); PLATE.add(pl); const r = box(0.18, 0.1, 0.14, mat('#f8f8f0')); r.position.set(-0.08, 0.06, 0); PLATE.add(r); const v = box(0.12, 0.08, 0.12, mat('#6ac46a')); v.position.set(0.1, 0.05, 0.04); PLATE.add(v); const f = box(0.14, 0.06, 0.1, mat('#d8844a')); f.position.set(0.06, 0.05, -0.1); PLATE.add(f); } S.add(PLATE);
const SH4 = makeShaker('#3a7fd0'); S.add(SH4);
const DIETER = makeWoman({ shirt: '#f29bbb', hair: '#3a2018', pants: '#3a3f4e' }); S.add(DIETER);
const okikae = label('1食 置き換え', { w: 768, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.3 }); S.add(okikae);
const heru = label('筋肉や骨まで減る', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(heru);
const rebound = label('リバウンド', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,90,40,.97)', sx: 1.1 }); S.add(rebound);
const ARROW = new THREE.Group(); { const m = mat('#d65a28'); const sh = box(0.14, 0.7, 0.05, m); sh.position.y = 0.35; ARROW.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.34, 4), m); hd.position.y = 0.85; ARROW.add(hd); } S.add(ARROW);
const undo = label('足りないのは 運動', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.6 }); S.add(undo);

const PEOPLE = [ME, ...COWORK, FAMILY, NOTR, TRAIN, DIETER];
const LABELS = [don, shaka, torutoru, asahiruban, kazoku, kawaranai, koete, nashiL, ariL, fuenai, fueta, okikae, heru, rebound, undo];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; p.scale.setScalar(p === DIETER ? 0.96 : p.scale.x); });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatC.userData.set(0);
  const st = ISL.userData.seats;
  ME.position.set(st[2].x + 0.0, 0, -0.6 + st[2].z); ME.rotation.y = st[2].ry; poseSit(ME);
  COWORK[0].position.set(st[0].x, 0, -0.6 + st[0].z); COWORK[0].rotation.y = st[0].ry; poseSit(COWORK[0]);
  COWORK[1].position.set(st[3].x, 0, -0.6 + st[3].z); COWORK[1].rotation.y = st[3].ry; poseSit(COWORK[1]);
  BAG.visible = SHAKER.visible = true; BAG.position.set(st[2].x - 0.35, TABLE_Y + 0.03, -0.85); BAG.rotation.set(0, 0.3, 0); SHAKER.position.set(st[2].x + 0.3, TABLE_Y + 0.03, -0.8); SHAKER.rotation.set(0, 0, 0); SHAKER.scale.setScalar(1);
  SINK_SH.forEach(s => s.visible = false); BARS.forEach(b => b.visible = false); BL.forEach(l => l.visible = false); BN.forEach(l => l.visible = false); GL.forEach(l => l.visible = false); LINE.forEach(l => l.visible = false);
  NOTR.position.set(EX - 1.0, 0, -0.6); TRAIN.position.set(EX + 1.0, 0, -0.6); bulk(NOTR, 0); bulk(TRAIN, 0); SH2.visible = SH3.visible = false; DB.visible = false;
  PLATE.visible = true; PLATE.position.set(FX - 0.2, TABLE_Y + 0.02, -0.75); SH4.visible = false; ARROW.visible = false; DIETER.userData.arms.forEach(a => a.scale.set(1, 1, 1)); DB.visible = false;
  DIETER.position.set(FX - 0.2, 0, -1.55); DIETER.rotation.y = 0; poseSit(DIETER); FAMILY.position.set(BX - 0.9, 0, -1.2); FAMILY.rotation.y = Math.PI;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function shake(p, t, sh, on = true) { const k = on ? Math.sin(t * 22) : 0; p.userData.arms[1].rotation.set(-1.9 + k * 0.25, 0, -0.2); p.updateMatrixWorld(); const v = new THREE.Vector3(0.32, 1.08 + k * 0.06, 0.62); p.localToWorld(v); sh.position.copy(v); sh.rotation.set(0.2, 0, k * 0.2); }
const TP = 0.35;
function deskCam(u = 0) { const s = ISL.userData.seats[2]; look(s.x + lerp(0.25, 0.15, u), lerp(1.8, 1.7, u), lerp(2.7, 2.2, u), s.x, lerp(1.62, 1.3, u), -0.9, 48); }
function shot0(t) { // 0秒＝サムネ：会社の机に、プロテインの大袋とシェイカーがドンと置かれる
  reset(); lift(0); const k = clamp(t / TP); BAG.position.y = lerp(TABLE_Y + 0.45, TABLE_Y + 0.03, k * k); SHAKER.position.y = lerp(TABLE_Y + 0.5, TABLE_Y + 0.03, easeOut(clamp(t / TP)) ** 2);
  if (t > TP) { sparkA.init([[BAG.position.x, TABLE_Y + 0.2, BAG.position.z]], 0.5, 0.8); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; say(don, t, TP + 0.05, ISL.userData.seats[2].x + 0.3, 1.12, -0.3, 0.9); }
  deskCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sShake(t, d) { // 筋トレをしていない同僚が、朝からシェイカーを振っている。
  reset(); lift(120); shake(ME, t, SHAKER); say(shaka, t, 0.4, ISL.userData.seats[2].x + 0.25, 1.85, -0.6, 0.75);
  const s = ISL.userData.seats[2]; look(s.x + 1.2, 1.7, 2.4, s.x, 1.2, -0.5, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。たんぱく質は、とればとるほど体にいいらしい。
  reset(); lift(120); shake(ME, t, SHAKER, false); ME.userData.arms[0].rotation.set(-0.4, 0, 0.5);
  if (t > d * 0.35) say(torutoru, t, d * 0.35, ISL.userData.seats[2].x, 1.85, -0.6, 1.3);
  const s = ISL.userData.seats[2]; look(s.x - 0.6, 1.7, 2.2, s.x, 1.3, -0.5, 50);
  return S;
}
function sDay1(t, d) { // 1日目。朝・昼・晩、シェイカーを振る音が職場に響く。
  reset(); lift(120); shake(ME, t, SHAKER); COWORK[0].userData.head.rotation.y = 0.5; COWORK[1].userData.head.rotation.y = -0.5; sweatC.userData.set(clamp((t - 1) / 0.6), t);
  say(asahiruban, t, 0.4, ISL.userData.seats[2].x, 2.0, -0.9, 0.9);
  setHud('プロテイン生活', '1日目', 1);
  look(0.4, 2.6, 4.2, 0, 1.0, -0.6, 50);
  return S;
}
function sWeek(t, d) { // 1週間後。シェイカーを洗うのは、なぜか家族。
  reset(); lift(120); ME.visible = false; BAG.visible = SHAKER.visible = false; FAMILY.userData.arms.forEach(a => a.rotation.set(-1.1 + Math.sin(t * 8) * 0.1, 0, 0));
  SINK_SH.forEach((s, i) => { s.visible = true; s.position.set(BX - 1.6 + i * 0.22, 0.97, -1.95 + (i % 2) * 0.1); });
  if (t > 0.9) say(kazoku, t, 0.9, BX - 0.9, 2.2, -1.2, 1.0);
  setHud('プロテイン生活', '1週間後', 1);
  look(BX + 0.6, 1.9, 1.6, BX - 1.0, 1.3, -1.6, 50);
  return S;
}
function sMonth(t, d) { // 1か月後。鏡の前で腕を見る。何も変わっていない。
  reset(); lift(120); BAG.visible = SHAKER.visible = false; ME.position.set(CX, 0, -1.0); ME.rotation.y = Math.PI; ME.userData.legs.forEach(l => l.rotation.x = 0); ME.position.y = 0;
  ME.userData.arms[1].rotation.set(0, 0, 1.5 + Math.sin(t * 2) * 0.05); ME.userData.arms[0].rotation.set(0, 0, -1.5);
  if (t > d * 0.5) say(kawaranai, t, d * 0.5, CX, 2.2, -1.2, 1.1);
  setHud('プロテイン生活', '1か月後', 1);
  look(CX + 0.2, 1.75, 1.9, CX, 1.55, -1.7, 50);
  return S;
}
function sMatte(t, d) { // でも、体は本当にプロテインを待っていたのか。
  reset(); lift(120); shake(ME, t, SHAKER, false); ME.userData.head.rotation.x = 0.3;
  deskCam(0.3 + ease(clamp(t / d)) * 0.7);
  return S;
}
function barCam(u = 0) { look(DX, lerp(2.6, 2.4, u), lerp(11, 10, u), DX, 2.0, -1, 50); }
function sMeyasu(t, d) { // 国の目安は、大人の男性で1日65g、女性で50g。
  reset(); lift(150); ME.visible = false; BAG.visible = SHAKER.visible = false; const k = easeOut(clamp((t - 0.3) / 1.0)); setBars([k, 0, k, 0], [1, 0, 1, 0]);
  setTop('たんぱく質の推奨量（18〜64歳・1日）', '男性65g・女性50g', fade(t, 0.3, d, 0.25), BLUE); setHud('厚生労働省', '食事摂取基準 2025年版', 1);
  barCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sHeikin(t, d) { // ところが、ふつうの食事で男性は平均78g、女性は66g。
  reset(); lift(150); ME.visible = false; BAG.visible = SHAKER.visible = false; const k = easeOut(clamp((t - 0.3) / 1.0)); setBars([1, k, 1, k]);
  setTop('ふだん食べている量の平均（20歳以上・1日）', '男性78g・女性66g', fade(t, 0.3, d, 0.25), GOLD); setHud('国民健康・栄養調査', '2024年', 1);
  barCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sKoete(t, d) { // プロテインを足す前から、もう目安を超えていた。
  reset(); lift(150); ME.visible = false; BAG.visible = SHAKER.visible = false; setBars([1, 1, 1, 1]);
  LINE.forEach((l, i) => { l.visible = true; l.position.set(DX + (i ? 1.4 : -1.4), BV[i * 2] / 30, -0.6); });
  say(koete, t, 0.4, DX, 4.3, -0.5, 1.4);
  setHud('平均で見ると', '目安より多い', 1); barCam(1);
  return S;
}
function studyCam(u = 0) { look(EX, 1.9, lerp(7.2, 6.6, u), EX, 1.3, -0.6, 50); }
function sTsuku(t, d) { // じゃあ、飲めば筋肉はつくのか。
  reset(); lift(120); shake(ME, t, SHAKER); ME.userData.head.rotation.x = -0.1;
  const s = ISL.userData.seats[2]; look(s.x + 1.0, 1.6, 2.2, s.x, 1.25, -0.5, 50);
  return S;
}
function sStudy(t, d) { // 50歳以上を調べた28の研究をまとめると、
  reset(); lift(150); ME.visible = false; BAG.visible = SHAKER.visible = false; SH2.visible = SH3.visible = true; SH2.position.set(EX - 1.0, 0.0, 0.0); SH3.position.set(EX + 1.0, 0.0, 0.0); SH2.scale.setScalar(1.6); SH3.scale.setScalar(1.6);
  say(nashiL, t, 0.5, EX - 1.0, 2.5, -0.6, 1.0); say(ariL, t, 0.8, EX + 1.0, 2.5, -0.6, 1.0);
  setTop('平均50歳以上のランダム化比較試験', '28件', fade(t, 0.3, d, 0.25), BLUE); setHud('プロテインの研究のまとめ', '2022年', 1);
  studyCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sFuenai(t, d) { // 筋トレなしでは、筋肉の量も握力も増えなかった。
  reset(); lift(150); ME.visible = false; BAG.visible = SHAKER.visible = false; SH2.visible = SH3.visible = true; SH2.position.set(EX - 1.0, 0.0, 0.0); SH3.position.set(EX + 1.0, 0.0, 0.0); SH2.scale.setScalar(1.6); SH3.scale.setScalar(1.6);
  nashiL.visible = ariL.visible = true; nashiL.position.set(EX - 1.0, 2.5, -0.6); ariL.position.set(EX + 1.0, 2.5, -0.6); nashiL.userData.size(1.0); ariL.userData.size(1.0);
  NOTR.userData.arms[1].rotation.set(0, 0, 1.4); say(fuenai, t, 0.6, EX - 1.0, 2.05, -0.3, 0.8);
  setTop('筋トレなしで たんぱく質を増やすと 筋肉量・握力は', '増えない', fade(t, 0.3, d, 0.25), RED); setHud('Kirwan ほか', '2022年', 1);
  studyCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sFueta(t, d) { // 増えたのは、筋トレと組み合わせたときだけ。
  reset(); lift(150); ME.visible = false; BAG.visible = SHAKER.visible = false; SH2.visible = SH3.visible = true; SH2.position.set(EX - 1.0, 0.0, 0.0); SH3.position.set(EX + 1.0, 0.0, 0.0); SH2.scale.setScalar(1.6); SH3.scale.setScalar(1.6);
  nashiL.visible = ariL.visible = true; nashiL.position.set(EX - 1.0, 2.5, -0.6); ariL.position.set(EX + 1.0, 2.5, -0.6); nashiL.userData.size(1.0); ariL.userData.size(1.0);
  const k = easeOut(clamp((t - 0.4) / 1.2)); bulk(TRAIN, k); const c = Math.sin(t * 4) * 0.5 + 0.5; TRAIN.userData.arms[1].rotation.set(-0.4 - 1.6 * c, 0, 0); TRAIN.updateMatrixWorld(); DB.visible = true; const v = new THREE.Vector3(0.32, 1.44 - 0.62 * Math.cos(0.4 + 1.6 * c), 0.62 * Math.sin(0.4 + 1.6 * c)); TRAIN.localToWorld(v); DB.position.copy(v);
  say(fueta, t, 0.9, EX + 1.0, 2.05, -0.3, 0.75);
  setTop('筋トレと組み合わせると 手足の筋肉量・握力が', '増えた', fade(t, 0.3, d, 0.25), GREEN); setHud('Kirwan ほか', '2022年', 1);
  studyCam(1);
  return S;
}
function dietCam(u = 0) { look(FX + lerp(0.5, 0.3, u), 1.8, lerp(1.6, 1.3, u), FX - 0.2, 1.1, -0.7, 50); }
function sOkikae(t, d) { // じゃあ、1食をプロテインに置き換えたら？
  reset(); lift(120); ME.visible = false; BAG.visible = SHAKER.visible = false; const k = clamp((t - 0.6) / 0.6); PLATE.visible = k < 0.5; SH4.visible = k >= 0.5; SH4.position.set(FX - 0.2, TABLE_Y + 0.02, -0.75); SH4.scale.setScalar(1.3);
  if (t > 1.0) say(okikae, t, 1.0, FX - 0.2, 1.95, -0.7, 1.1);
  look(FX + 0.9, 1.9, 1.6, FX - 0.2, 1.05, -0.9, 50);
  return S;
}
function sHeru(t, d) { // 食事を減らしすぎると、脂肪だけでなく筋肉や骨まで減る。
  reset(); lift(120); ME.visible = false; BAG.visible = SHAKER.visible = false; PLATE.visible = false; SH4.visible = true; SH4.position.set(FX - 0.2, TABLE_Y + 0.02, -0.75); SH4.scale.setScalar(1.3);
  DIETER.rotation.y = 0; DIETER.position.set(FX + 0.9, 0, -0.4); DIETER.userData.legs.forEach(l => l.rotation.x = 0); DIETER.position.y = 0; const k = easeOut(clamp((t - 0.4) / 1.4)); DIETER.scale.set(0.96 * (1 - 0.18 * k), 0.96, 0.96 * (1 - 0.18 * k)); DIETER.userData.arms.forEach(a => a.scale.set(1 - 0.4 * k, 1, 1 - 0.4 * k));
  if (t > d * 0.45) say(heru, t, d * 0.45, FX + 0.6, 2.35, -0.4, 1.4);
  setHud('置き換えで 食べる量を減らしすぎると', '神奈川県', 1);
  look(FX + 0.5, 1.6, 3.4, FX + 0.4, 1.3, -0.5, 50);
  return S;
}
function sRebound(t, d) { // 筋肉が減ると代謝が落ちて、リバウンドしやすくなる。
  reset(); lift(120); ME.visible = false; BAG.visible = SHAKER.visible = false; PLATE.visible = true; PLATE.position.set(FX - 0.2, TABLE_Y + 0.02, -0.75);
  DIETER.rotation.y = 0; DIETER.position.set(FX + 0.9, 0, -0.4); DIETER.userData.legs.forEach(l => l.rotation.x = 0); DIETER.position.y = 0; const k = easeOut(clamp((t - 0.5) / 1.2)); DIETER.scale.set(0.96 * (0.82 + 0.3 * k), 0.96, 0.96 * (0.82 + 0.3 * k)); DIETER.userData.arms.forEach(a => a.scale.set(0.6, 1, 0.6)); DIETER.userData.head.rotation.x = 0.25 * k;
  ARROW.visible = t > 0.5; ARROW.position.set(FX + 1.75, 1.2, -0.4); ARROW.scale.setScalar(0.6 + 0.4 * k);
  if (t > 1.0) say(rebound, t, 1.0, FX + 0.6, 2.35, -0.4, 1.0);
  setHud('筋肉が減ると', '代謝が落ちる', 1);
  look(FX + 0.6, 1.6, 3.4, FX + 0.6, 1.3, -0.5, 50);
  return S;
}
function sKekka(t, d) { // 結果：筋トレをしない体に、プロテインは筋肉をくれなかった。
  reset(); lift(120); shake(ME, t, SHAKER, false); ME.userData.head.rotation.x = 0.35; ME.userData.arms[1].rotation.set(-0.6, 0, 0);
  const s = ISL.userData.seats[2]; const u = ease(clamp(t / d)); look(s.x + lerp(1.6, 0.6, u), lerp(2.4, 1.8, u), lerp(3.4, 2.0, u), s.x, 1.15, -0.5, 50);
  return S;
}
function sUndo(t, d) { // 足りなかったのは、たんぱく質ではなく運動だった。
  reset(); lift(120); ME.position.y = 0; ME.userData.legs.forEach(l => l.rotation.x = 0); ME.rotation.y = 0; ME.position.set(ISL.userData.seats[2].x + 1.3, 0, 0.6);
  const c = Math.sin(t * 4) * 0.5 + 0.5; ME.userData.arms[1].rotation.set(-0.4 - 1.6 * c, 0, 0); ME.updateMatrixWorld(); DB.visible = true; const v = new THREE.Vector3(0.32, 1.44 - 0.62 * Math.cos(0.4 + 1.6 * c), 0.62 * Math.sin(0.4 + 1.6 * c)); ME.localToWorld(v); DB.position.copy(v);
  if (t > 0.6) say(undo, t, 0.6, ME.position.x, 2.4, 0.6, 1.4);
  look(ME.position.x + 0.3, 1.7, 3.6, ME.position.x, 1.35, 0.4, 50);
  return S;
}
function sAsk(t) { // プロテイン、飲んでる？（冒頭と同じ構図）
  reset(); lift(0); deskCam(0);
  return S;
}

const NARR = { '1日目': 'いちにちめ', '1週間後': 'いっしゅうかんご', '1か月後': 'いっかげつご', '1日': 'いちにち', '65g': 'ろくじゅうごグラム', '50g': 'ごじゅうグラム', '78g': 'ななじゅうはちグラム', '66g': 'ろくじゅうろくグラム', '50歳以上': 'ごじゅっさいいじょう', '28の研究': 'にじゅうはちのけんきゅう', '1食': 'いっしょく', '朝・昼・晩': 'あさ、ひる、ばん', '言い分': 'いいぶん', '同僚': 'どうりょう', '筋トレ': 'きんトレ', '握力': 'あくりょく', '代謝': 'たいしゃ', '結果：': '結果、', '目安': 'めやす', '家族': 'かぞく', '腕': 'うで' };
const P = planTimes([
  ['筋トレをしていない同僚が、<br>朝からシェイカーを振っている。', sShake],
  ['本人の言い分から。', (t, d) => sIibun(t, 2.4 * d)],
  ['たんぱく質は、とればとるほど<br>体にいいらしい。', (t, d) => sIibun(t + 1.0, 2.4 * d)],
  ['1日目。朝・昼・晩、', (t, d) => sDay1(t, 2 * d)],
  ['シェイカーを振る音が<br>職場に響く。', (t, d) => sDay1(t + d, 2 * d)],
  ['1週間後。シェイカーを<br>洗うのは、なぜか家族。', sWeek],
  ['1か月後。鏡の前で腕を見る。<br>何も変わっていない。', sMonth],
  ['でも、体は本当に<br>プロテインを待っていたのか。', sMatte],
  ['国の目安は、大人の男性で<br>1日65g、女性で50g。', sMeyasu],
  ['ところが、ふつうの食事で<br>男性は平均78g、女性は66g。', sHeikin],
  ['プロテインを足す前から、<br>もう目安を超えていた。', sKoete],
  ['じゃあ、飲めば<br>筋肉はつくのか。', sTsuku],
  ['50歳以上を調べた<br>28の研究をまとめると、', sStudy],
  ['筋トレなしでは、<br>筋肉の量も握力も増えなかった。', sFuenai],
  ['増えたのは、筋トレと<br>組み合わせたときだけ。', sFueta],
  ['じゃあ、1食を<br>プロテインに置き換えたら？', sOkikae],
  ['食事を減らしすぎると、', (t, d) => sHeru(t, 2 * d)],
  ['脂肪だけでなく<br>筋肉や骨まで減る。', (t, d) => sHeru(t + d, 2 * d)],
  ['筋肉が減ると代謝が落ちて、<br>リバウンドしやすくなる。', sRebound],
  ['結果：筋トレをしない体に、', (t, d) => sKekka(t, 2 * d)],
  ['プロテインは<br>筋肉をくれなかった。', (t, d) => sKekka(t + d, 2 * d)],
  ['足りなかったのは、<br>たんぱく質ではなく運動だった。', sUndo],
  ['プロテイン、飲んでる？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0675',
    v2: true,
    tt: 'main',
    hookLine: '会社の机に、プロテインの大袋とシェイカーがドンと置かれる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日プロテインを飲むのを1か月続けたら？',
    titleHtml: 'もしも毎日<br>プロテインを<br>飲むのを<br>1か月続けたら？',
    mood: 'tension', seed: 675, hits: [TP, P.at(19), P.at(21)], risers: [P.at(7), P.at(11)], impacts: [P.at(8, 0.4), P.at(9, 0.4), P.at(13, 0.4), P.at(17, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.4), 'buzz'], [P.at(3, 0.4), 'buzz'], [P.at(5, 0.5), 'bubble'], [P.at(6, 0.8), 'meter', 0.3], [P.at(10, 0.4), 'alarm'], [P.at(15, 0.6), 'poof'], [P.at(18, 0.5), 'whoosh']],
    narr: NARR,
    ask: 'プロテイン、飲んでる？',
    caption: 'もしも毎日プロテインを飲むのを1か月続けたら？\n\n筋トレをしていない同僚が、朝からシェイカーを振っている。\n本人の言い分から。たんぱく質は、とればとるほど体にいいらしい。\n1日目。朝・昼・晩、シェイカーを振る音が職場に響く。\n1週間後。シェイカーを洗うのは、なぜか家族。\n1か月後。鏡の前で腕を見る。何も変わっていない。\nでも、体は本当にプロテインを待っていたのか。\n国の目安（推奨量・18〜64歳）は、大人の男性で1日65g、女性で50g。\nところが、ふつうの食事で男性は平均78g、女性は66g（20歳以上の平均。全員が足りているわけではない）。\nプロテインを足す前から、もう目安を超えていた。\nじゃあ、飲めば筋肉はつくのか。\n平均50歳以上を調べた28の研究をまとめると、筋トレなしでは、筋肉の量も握力も増えなかった。増えたのは、筋トレと組み合わせたときだけ。\nじゃあ、1食をプロテインに置き換えたら？\n食事を減らしすぎると、脂肪だけでなく筋肉や骨まで減る。筋肉が減ると代謝が落ちて、リバウンドしやすくなる。\n\n結果：筋トレをしない体に、プロテインは筋肉をくれなかった。\n足りなかったのは、たんぱく質ではなく運動だった。\n\nプロテイン、飲んでる？ コメントで教えて。\n\n※持病で食事の指示を受けている人は、医師の指示に従ってください\n出典：厚生労働省「日本人の食事摂取基準（2025年版）」「令和6年 国民健康・栄養調査結果の概要」、Kirwan RP ほか. Am J Clin Nutr 2022、神奈川県「ダイエットで筋肉まで落とすと、太りやすくなる」',
    hashtags: ['もしもラボ', 'もしも', 'プロテイン', '筋トレ', 'ダイエット'],
    endStats: [['たんぱく質の推奨量（1日）', '男性65g・女性50g', '食事摂取基準 2025年版'], ['ふだんの平均（1日・20歳以上）', '男性78g・女性66g', '国民健康・栄養調査 2024年'], ['筋トレなしのプロテイン', '筋肉量も握力も増えない', 'Kirwan ほか 2022年（28研究）']],
    sources: '出典：厚生労働省 食事摂取基準2025年版・国民健康・栄養調査（令和6年）、Kirwan RP ほか 2022、神奈川県',
  },
});
