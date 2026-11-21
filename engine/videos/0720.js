import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBed, makeAlarm } from '../scenes/home.js';

// もしも1か月、ゲームをやめたら？（台本 S117・人体の限界）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。あと1戦 で夜中3時までやめられない社会人ゲーマーの回。後半で ゲームは時間のムダ と言いながらショート動画を2時間見る親にも返す
// 数字（2026/11/21 一次資料で確認）：
//  ・国立病院機構 久里浜医療センター ネット・ゲーム使用と生活習慣についてのアンケート結果（概要）令和元年11月27日（全国の10〜29歳 9,000人に送り 5,096人が回答・厚労省の補助事業）：
//    ゲームが1日6時間以上の人の37.2%が、睡眠障害や心の問題が起きてもゲームを続けた（60分未満は2.4%）
//  ・He JW ほか PLoS One 2020;15(2):e0228756：寝る前にスマホを使う38人（19人ずつ）。寝る30分前から使わないを4週間 → 寝つくまで 30.98分→18.38分、睡眠 6.20時間→6.56時間（約20分。小さな研究）
//  研究はゲームに限らないスマホの話なので、画面では 画面を置いた と言う。夜中3時・3周・2時間は筋の中の数。実在のゲーム名・画面・ロゴ・ガチャや課金の絵は出さない。説教にしない

const GOLD = '#ffd27a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#1c2338', ground: '#3a3a44' }); hemi.intensity = 0.9;
const GAMER = makeMan({ shirt: '#4a5a7a', hair: '#2a2220', pants: '#3a3a44' }); S.add(GAMER); const sweatG = makeSweat(); GAMER.userData.head.add(sweatG);
const PAD = new THREE.Group(); { const b = box(0.24, 0.05, 0.12, mat('#2a2a30')); PAD.add(b); for (const s of [-1, 1]) { const h = box(0.07, 0.05, 0.12, mat('#2a2a30')); h.position.set(s * 0.12, -0.02, 0.04); h.rotation.z = s * 0.4; PAD.add(h); } } S.add(PAD);
const KAZOKU = makeWoman({ shirt: '#c8a0c8', hair: '#3a2620' }); S.add(KAZOKU);
const OYA = makeOji(rng(117), { shirt: '#8a7a6a', bald: true }); S.add(OYA);
const OPH = box(0.1, 0.18, 0.02, new THREE.MeshBasicMaterial({ color: '#cfe8ff' })); S.add(OPH);

// ---------- A：夜の部屋（原点） ----------
room({ x: 0, w: 8, d: 6, h: 2.8, wall: '#3a4058', floor: '#5a4a44' });
const TV = new THREE.Group(); const TVC = document.createElement('canvas'); TVC.width = 640; TVC.height = 360; const TVT = new THREE.CanvasTexture(TVC); TVT.colorSpace = THREE.SRGBColorSpace;
{ const f = box(1.7, 1.0, 0.08, mat('#15161c')); TV.add(f); const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ map: TVT })); sc.position.z = 0.045; TV.add(sc); const st = box(0.9, 0.5, 0.4, mat('#2a2a30')); st.position.set(0, -0.75, 0); TV.add(st); } TV.position.set(0, 1.0, -2.1); S.add(TV);
let tvKey = null; function tv(mode) { if (mode === tvKey) return; tvKey = mode; const g = TVC.getContext('2d');
  if (mode === 'off') { g.fillStyle = '#050608'; g.fillRect(0, 0, 640, 360); }
  else { const grd = g.createLinearGradient(0, 0, 0, 360); grd.addColorStop(0, '#3a2a7a'); grd.addColorStop(1, '#a83a6a'); g.fillStyle = grd; g.fillRect(0, 0, 640, 360); g.fillStyle = 'rgba(255,255,255,.15)'; for (let i = 0; i < 8; i++) g.fillRect(i * 90, 250 - (i % 3) * 30, 60, 120); g.fillStyle = '#fff'; g.font = '900 96px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('あと1戦', 320, 150); g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText('もう一度 戦う？', 320, 250); }
  TVT.needsUpdate = true; }
const TVL = new THREE.PointLight(0x9a7aff, 6, 6, 1.4); TVL.position.set(0, 1.0, -1.2); S.add(TVL);
const CUSH = box(0.6, 0.18, 0.6, mat('#7a5a8a')); CUSH.position.set(0, 0.09, -0.75); S.add(CUSH);
const BED = makeBed({ blanket: '#5d7fb3' }); BED.position.set(2.4, 0, -1.4); S.add(BED);
const ALARM = makeAlarm(); ALARM.position.set(1.2, 0.75, -2.6); ALARM.scale.setScalar(1.0); S.add(ALARM);
const SHELF = box(0.8, 0.75, 0.4, mat('#6a5a4a')); SHELF.position.set(1.2, 0.37, -2.6); S.add(SHELF);
const WIN = box(1.2, 1.0, 0.02, new THREE.MeshBasicMaterial({ color: '#0e1430' })); WIN.position.set(-2.6, 1.6, -2.93); S.add(WIN);
const sparkA = makeSparkles(90, 0.05, 0xffffff); S.add(sparkA.points); sparkA.init([[0, 1.0, -0.4]], 0.4, 0.4);
const suu = label('スッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.42 }); S.add(suu);
const kieta = label('あと1戦が 消えた', { w: 900, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(kieta);
const asamade = label('あと1戦が 朝まで', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.1 }); S.add(asamade);
const sanshu = label('部屋を 3周', { w: 640, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.8 }); S.add(sanshu);
const neochi = label('寝落ち', { w: 512, size: 110, color: '#fff', bg: 'rgba(120,90,200,.96)', sx: 0.6 }); S.add(neochi);
const saki = label('目覚ましより 先に', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.1 }); S.add(saki);
const zzz = label('Zzz', { w: 384, size: 110, color: '#5a4a9a', bg: 'rgba(255,255,255,.96)', sx: 0.4 }); S.add(zzz);
const PILLOW = box(0.5, 0.14, 0.34, mat('#ffffff')); S.add(PILLOW);

// ---------- B：親の寝室（x=60） ----------
const BX = 60;
room({ x: BX, w: 8, d: 6, h: 2.8, wall: '#4a4a5e', floor: '#6a5a4a' });
const BED2 = makeBed({ blanket: '#a88a5a' }); BED2.position.set(BX, 0, -1.4); S.add(BED2);
const demo = label('やめられないのは ゲーマーだけじゃない', { w: 1300, size: 80, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(demo);
const muda = label('ゲームは 時間のムダ', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(muda);
const nijikan = label('ショート動画 2時間', { w: 1000, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(nijikan);

// ---------- C：数字のスタジオ（x=120） ----------
const CX = 120;
room({ x: CX, w: 10, d: 6, h: 4, wall: '#24304a', floor: '#34405a' });
const stL = new THREE.PointLight(0xffffff, 14, 14, 1.2); stL.position.set(CX, 3.5, 2); S.add(stL);
function makeB(color) { const g = new THREE.Group(); const b = box(1.0, 1, 1.0, mat(color)); b.geometry.translate(0, 0.5, 0); g.add(b); const cap = box(1.04, 0.05, 1.04, mat('#ffffff')); g.add(cap); g.userData.set = (h) => { b.scale.y = Math.max(0.001, h); cap.position.y = h; g.visible = h > 0.002; }; S.add(g); return g; }
const B1 = makeB('#e85a5a'); B1.position.set(CX - 0.9, 0, -1.2);
const B2 = makeB('#7fc8ff'); B2.position.set(CX + 0.9, 0, -1.2);
const lb1 = label('', { w: 900, size: 88, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(lb1);
const lb2 = label('', { w: 900, size: 88, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(lb2);
const chiisai = label('小さな研究', { w: 640, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.8 }); S.add(chiisai);

// ---------- 結果・ひねり ----------
const kariru = label('明日の自分から 借りた1戦', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(kariru);

const LABELS = [suu, kieta, asamade, sanshu, neochi, saki, zzz, demo, muda, nijikan, lb1, lb2, chiisai, kariru];
const PEOPLE = [GAMER, KAZOKU, OYA];
function night(mode = 'night') { if (mode === 'night') { hemi.intensity = 0.9; WIN.material.color.set('#0e1430'); S.background.set('#1c2338'); } else { hemi.intensity = 1.35; WIN.material.color.set('#bfe4ff'); S.background.set('#c8d8e8'); } }
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatG.userData.set(0);
  PAD.visible = false; OPH.visible = false; PILLOW.visible = false; tv('game'); TVL.intensity = 6; B1.userData.set(0); B2.userData.set(0); night('night'); ALARM.userData.set('3:00', '#ff5a4a');
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function walk(p, t, sp = 6, a = 0.4) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * a; p.userData.legs[1].rotation.x = -s * a; }
function lie(p, x, y, z, ry = 0) { p.visible = true; p.position.set(x, y, z); p.rotation.set(-Math.PI / 2, ry, 0); }
const TP = 0.35;
function gamerSit() { stand(GAMER, 0, -0.6, Math.PI); poseSit(GAMER); GAMER.position.y += 0.18; GAMER.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0)); }
function padAt() { PAD.visible = true; GAMER.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.98, -0.42); GAMER.localToWorld(v); PAD.position.copy(v); PAD.rotation.y = GAMER.rotation.y; }
function roomCam(u = 0) { look(lerp(-3.5, -3.3, u), 1.6, lerp(-1.2, -1.25, u), 0.1, 1.2, -1.35, 64); }
function shot0(t) { // 0秒＝サムネ：夜中3時の部屋で、コントローラーが手の中からスッと消え、画面の あと1戦 が真っ暗になる
  reset(); lift(0); gamerSit(); const on = t > TP;
  if (!on) padAt(); else { tv('off'); TVL.intensity = 0; sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; say(suu, t, TP, 0, 1.55, -0.7, 0.4); }
  if (t > TP + 0.35) say(kieta, t, TP + 0.35, 0, 0.5, -1.3, 0.95);
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 空っぽの手を握ったまま、ゲーマーが固まる
  reset(); lift(150); gamerSit(); tv('off'); TVL.intensity = 0; if (t > d * 0.3) sweatG.userData.set(1, t);
  const u = ease(clamp(t / d)); look(lerp(-2.0, -1.8, u), 1.6, lerp(-2.7, -2.5, u), 0, 1.15, -0.6, 52);
  return S;
}
function sFuman(t, d) { // 同じ家で寝る家族の不満から。明日も仕事なのに、あと1戦 が朝まで続く（回想）
  reset(); lift(150); gamerSit(); padAt(); lie(KAZOKU, 2.4, 0.72, -0.3); PILLOW.visible = true; PILLOW.position.set(2.4, 0.95, -2.05); PILLOW.rotation.set(0, 0, 0);
  ALARM.userData.set('4:30', '#ff5a4a'); if (t > d * 0.55) say(asamade, t, d * 0.55, 1.0, 2.15, -1.2, 1.0);
  look(1.0, 2.0, 2.6, 1.0, 0.95, -1.4, 52);
  return S;
}
function s1(t, d) { // 1日目。夜11時、手持ちぶさたで部屋の中を3周する
  reset(); lift(150); tv('off'); TVL.intensity = 0; ALARM.userData.set('23:00', '#7fe0a0');
  const a = t / d * Math.PI * 2 * 1.5; stand(GAMER, Math.cos(a) * 1.0, -0.5 + Math.sin(a) * 0.6, -a); walk(GAMER, t, 8);
  if (t > d * 0.35) say(sanshu, t, d * 0.35, 0, 1.85, -0.6, 0.75);
  setHud('ゲームをやめて', '1日目', 1);
  look(0.6, 2.4, 2.4, 0, 0.9, -0.8, 52);
  return S;
}
function s2(t, d) { // 1週間後。夜12時前に、布団で寝落ちする
  reset(); lift(150); tv('off'); TVL.intensity = 0; ALARM.userData.set('23:50', '#7fe0a0'); lie(GAMER, 2.4, 0.72, -0.3);
  if (t > d * 0.2) say(zzz, t, d * 0.2, 2.6, 1.35, -1.9, 0.38);
  if (t > d * 0.45) say(neochi, t, d * 0.45, 2.4, 1.9, -1.3, 0.6);
  setHud('ゲームをやめて', '1週間後', 1);
  look(4.4, 2.2, 0.8, 2.3, 0.9, -1.3, 50);
  return S;
}
function s3(t, d) { // 1か月後。目覚ましより先に、目が開く
  reset(); lift(150); night('day'); tv('off'); TVL.intensity = 0; ALARM.userData.set('6:29', '#ffd27a');
  const k = clamp((t - d * 0.3) / 0.4); stand(GAMER, 1.3, -0.7, 0.4); GAMER.userData.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? -1 : 1) * 2.8 * easeOut(k)));
  if (t > d * 0.45) say(saki, t, d * 0.45, 1.2, 2.05, -1.6, 1.0);
  setHud('ゲームをやめて', '1か月後', 1);
  look(0.4, 1.9, 2.2, 1.2, 1.0, -1.6, 50);
  return S;
}
function oyaBed() { lie(OYA, BX + 0.1, 0.72, -0.25, 0); OPH.visible = true; OPH.position.set(BX + 0.1, 1.15, -1.55); OPH.rotation.set(-0.5, 0, 0); }
function sDemo(t, d) { // でも、夜ふかしがやめられないのは、ゲーマーだけじゃなかった
  reset(); lift(150); oyaBed(); if (t > d * 0.3) say(demo, t, d * 0.3, BX, 2.15, -1.3, 1.45);
  look(BX + 1.8, 2.2, 1.2, BX, 0.95, -1.4, 50);
  return S;
}
function sOya(t, d) { // ゲームは時間のムダ と言う親も、布団でショート動画を2時間
  reset(); lift(150); oyaBed(); ALARM.userData.set('1:00', '#ff5a4a');
  const ph = t / d; if (ph < 0.55) say(muda, t, 0.1, BX, 1.65, -1.3, 1.0); else say(nijikan, t, d * 0.55, BX, 1.65, -1.3, 1.0);
  look(BX + 1.2, 1.9, 0.6, BX, 1.0, -1.5, 50);
  return S;
}
function numCam() { look(CX, 1.7, 6.0, CX, 1.3, -1.0, 50); }
function sNum1(t, d) { // 10〜29歳の約5,000人の国の調査。1日6時間以上ゲームをする人の37.2%が、眠りや心に問題が出てもやめられなかった
  reset(); lift(150); const ph = t / d; const k = easeOut(clamp((ph - 0.35) / 0.25));
  B1.userData.set(3.0 * 0.372 * k * 2); B2.userData.set(3.0 * 0.024 * 2 * k + 0.001);
  if (k > 0.98) { lb1.userData.set('6時間以上 37.2%'); say(lb1, t, d * 0.6, CX - 0.9, 2.23 + 0.45, -0.6, 0.95); lb2.userData.set('60分未満 2.4%'); say(lb2, t, d * 0.62, CX + 0.9, 0.6, -0.6, 0.95); }
  setTop(ph < 0.35 ? '10〜29歳 5,096人の調査（2019年）' : '眠りや心に問題が出ても ゲームを続けた', ph < 0.35 ? '約5,000人' : `${(37.2 * k).toFixed(1)}%`, fade(t, 0.2, d, 0.2), ph < 0.35 ? BLUE : '#ff8a7a');
  numCam();
  return S;
}
function sNum2(i, t, d) { // 寝る前30分、画面を置いた38人の研究。4週間で、寝つきは約31分から約18分に／眠っている時間も、1晩で約20分のびた（小さな研究）
  reset(); lift(150);
  if (i === 0) { const ph = t / d; const k = easeOut(clamp((ph - 0.5) / 0.3)); B1.userData.set(31 * 0.07); B2.userData.set(lerp(31, 18, k) * 0.07); lb1.userData.set('前 約31分'); say(lb1, t, 0.3, CX - 0.9, 31 * 0.07 + 0.45, -0.6, 0.8); if (k > 0.98) { lb2.userData.set('4週間後 約18分'); say(lb2, t, d * 0.8, CX + 0.9, 18 * 0.07 + 0.45, -0.6, 0.95); }
    setTop(ph < 0.5 ? '寝る前30分 画面を置いた38人（2020年の研究）' : '寝つくまでの時間', ph < 0.5 ? '38人' : `約${Math.round(lerp(31, 18, k))}分`, fade(t, 0.2, d, 0.2), BLUE); }
  else { const k = easeOut(clamp((t - 0.3) / 1.0)); B1.userData.set(6.20 * 0.4); B2.userData.set(lerp(6.20, 6.56, k) * 0.4); lb1.userData.set('前 6.20時間'); say(lb1, t, 0.2, CX - 0.9, 6.2 * 0.4 + 0.45, -0.6, 0.85); lb2.userData.set('後 6.56時間'); if (k > 0.98) say(lb2, t, 1.3, CX + 0.9, 6.56 * 0.4 + 0.45, -0.6, 0.85); if (t > d * 0.5) say(chiisai, t, d * 0.5, CX, 0.5, 0.2, 0.7);
    setTop('1晩の睡眠（小さな研究）', '約20分 のびた', fade(t, 0.2, d, 0.2), GOLD); }
  numCam();
  return S;
}
function sKekka(t, d) { // 結果：あと1戦 をやめて取り戻したのは、勝ち星じゃなく、毎晩の眠りだった
  reset(); lift(150); tv('off'); TVL.intensity = 0; ALARM.userData.set('23:30', '#7fe0a0'); lie(GAMER, 2.4, 0.72, -0.3); if (t > d * 0.2) say(zzz, t, d * 0.2, 2.6, 1.35, -1.9, 0.38);
  setTop('結果', '毎晩の眠りが 戻った', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.2, u), 2.1, lerp(2.0, 2.6, u), 1.2, 0.9, -1.4, 50);
  return S;
}
function sKariru(t, d) { // あと1戦 は、ゲームの中じゃなく、明日の自分から借りていた1戦だったのかもしれない
  reset(); lift(150); gamerSit(); padAt(); if (t > d * 0.4) say(kariru, t, d * 0.4, 0, 2.05, -1.6, 1.25);
  look(0.9, 1.6, 1.4, 0, 1.25, -1.8, 52);
  return S;
}
function sAsk(t) { reset(); lift(0); gamerSit(); tv('off'); TVL.intensity = 0; roomCam(0); return S; }

const NARR = { '空っぽ': 'からっぽ', '手': 'て', '握った': 'にぎった', '固まる': 'かたまる', '同じ': 'おなじ', '家': 'いえ', '寝る': 'ねる', '家族': 'かぞく', '不満': 'ふまん', '明日': 'あした', '仕事': 'しごと', 'あと1戦': 'あといっせん', '朝': 'あさ', '続く': 'つづく', '1日目': 'いちにちめ', '夜11時': 'よるじゅういちじ', '手持ちぶさた': 'てもちぶさた', '部屋': 'へや', '中': 'なか', '3周': 'さんしゅう', '1週間後': 'いっしゅうかんご', '夜12時前': 'よるじゅうにじまえ', '布団': 'ふとん', '寝落ち': 'ねおち', '1か月後': 'いっかげつご', '目覚まし': 'めざまし', '先': 'さき', '目': 'め', '開く': 'あく', '夜ふかし': 'よふかし', '時間': 'じかん', '言う': 'いう', '親': 'おや', '動画': 'どうが', '2時間': 'にじかん', '10〜29歳': 'じゅっさいからにじゅうきゅうさい', '約5,000人': 'やくごせんにん', '国': 'くに', '調査': 'ちょうさ', '1日6時間以上': 'いちにちろくじかんいじょう', '人': 'ひと', '37.2%': 'さんじゅうななてんにパーセント', '眠り': 'ねむり', '心': 'こころ', '問題': 'もんだい', '出ても': 'でても', '寝る前30分': 'ねるまえさんじゅっぷん', '画面': 'がめん', '置いた': 'おいた', '38人': 'さんじゅうはちにん', '研究': 'けんきゅう', '4週間': 'よんしゅうかん', '寝つき': 'ねつき', '約31分': 'やくさんじゅういっぷん', '約18分': 'やくじゅうはっぷん', '眠っている': 'ねむっている', '1晩': 'ひとばん', '約20分': 'やくにじゅっぷん', '結果：': '結果、', '取り戻した': 'とりもどした', '勝ち星': 'かちぼし', '毎晩': 'まいばん', '自分': 'じぶん', '借りていた': 'かりていた', '1戦': 'いっせん', '1日何時間': 'いちにちなんじかん' };
const P = planTimes([
  ['空っぽの手を握ったまま、', (t, d) => sKatamaru(t, 2 * d)],
  ['ゲーマーが固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['同じ家で寝る家族の<br>不満から。', (t, d) => sFuman(t, 2 * d)],
  ['明日も仕事なのに、<br>あと1戦 が朝まで続く。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。夜11時、手持ちぶさたで<br>部屋の中を3周する。', s1],
  ['1週間後。夜12時前に、<br>布団で寝落ちする。', s2],
  ['1か月後。目覚ましより先に、<br>目が開く。', s3],
  ['でも、夜ふかしがやめられない<br>のは、ゲーマーだけじゃなかった。', sDemo],
  ['ゲームは時間のムダ と言う親も、<br>布団でショート動画を2時間。', sOya],
  ['10〜29歳の約5,000人の<br>国の調査。', (t, d) => sNum1(t, 3 * d)],
  ['1日6時間以上ゲームをする<br>人の37.2%が、', (t, d) => sNum1(t + d, 3 * d)],
  ['眠りや心に問題が出ても<br>やめられなかった。', (t, d) => sNum1(t + 2 * d, 3 * d)],
  ['寝る前30分、画面を置いた<br>38人の研究。', (t, d) => sNum2(0, t, 2 * d)],
  ['4週間で、寝つきは<br>約31分から約18分に。', (t, d) => sNum2(0, t + d, 2 * d)],
  ['眠っている時間も、1晩で<br>約20分のびた（小さな研究）。', (t, d) => sNum2(1, t, d)],
  ['結果：あと1戦 をやめて<br>取り戻したのは、', (t, d) => sKekka(t, 2 * d)],
  ['勝ち星じゃなく、<br>毎晩の眠りだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['あと1戦 は、<br>ゲームの中じゃなく、', (t, d) => sKariru(t, 2 * d)],
  ['明日の自分から借りていた<br>1戦だったのかもしれない。', (t, d) => sKariru(t + d, 2 * d)],
  ['1日何時間<br>ゲームしてる？', sAsk],
], { shot0, endCard, start: 2.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0720',
    v2: true,
    tt: 'main',
    hookLine: '夜中3時の部屋で、コントローラーが手の中からスッと消え、画面の あと1戦 が真っ暗になる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月、ゲームをやめたら？',
    titleHtml: 'もしも1か月、<br>ゲームを<br>やめたら？',
    mood: 'hopeful', seed: 720, hits: [TP, P.at(15), P.at(18)], risers: [P.at(7)], impacts: [P.at(10, 1.4), P.at(13, 1.4), P.at(14, 1.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.4), 'whoosh'], [P.at(5, 0.4), 'bubble'], [P.at(6, 0.6), 'alarm'], [P.at(8, 0.3), 'buzz']],
    narr: NARR,
    ask: '1日何時間ゲームしてる？',
    caption: 'もしも1か月、ゲームをやめたら？\n\n空っぽの手を握ったまま、ゲーマーが固まる。\n同じ家で寝る家族の不満から。明日も仕事なのに、あと1戦 が朝まで続く。\n1日目。夜11時、手持ちぶさたで部屋の中を3周する。\n1週間後。夜12時前に、布団で寝落ちする。\n1か月後。目覚ましより先に、目が開く。\nでも、夜ふかしがやめられないのは、ゲーマーだけじゃなかった。\nゲームは時間のムダ と言う親も、布団でショート動画を2時間。\n10〜29歳の約5,000人の国の調査。1日6時間以上ゲームをする人の37.2%が、眠りや心に問題が出てもやめられなかった。\n寝る前30分、画面を置いた38人の研究。4週間で、寝つきは約31分から約18分に。\n眠っている時間も、1晩で約20分のびた（小さな研究）。\n\n結果：あと1戦 をやめて取り戻したのは、勝ち星じゃなく、毎晩の眠りだった。\nあと1戦 は、ゲームの中じゃなく、明日の自分から借りていた1戦だったのかもしれない。\n\n1日何時間ゲームしてる？ コメントで教えて。\n\n出典：国立病院機構 久里浜医療センター ネット・ゲーム使用と生活習慣についてのアンケート結果（2019年・10〜29歳 5,096人）、He JW ほか PLoS One 2020（寝る前30分スマホを使わない・38人・4週間）\n※ゲーム・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'ゲーム', '睡眠', '人体の限界'],
    endStats: [['1日6時間以上の人', '37.2%が やめられなかった', '久里浜医療センター 2019年'], ['寝る前30分 画面を置く（4週間）', '寝つき 約31分→約18分', 'He ほか 2020'], ['あと1戦の正体', '明日の自分から 借りた1戦', 'かもしれない']],
    sources: '久里浜医療センター 2019年調査／He ほか PLoS One 2020',
  },
});
