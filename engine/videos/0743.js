import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTub, makeSteam, makeBed, makeAlarm } from '../scenes/home.js';

// もしも1か月、寝る90分前にお風呂に入ったら？（人体の限界・台本 S139）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/23 の解析の種（0671 湯船・0695 サウナ の お風呂の習慣を変えたら ×TikTok で強い睡眠）
// 数字（一次資料で確認・2026/11/25）：
//  Haghayegh ほか Sleep Medicine Reviews 46巻124-135ページ 2019年（doi:10.1016/j.smrv.2019.04.008）。候補5,322本から17の研究（13でメタ分析）。
//   40〜42.5℃の湯で、寝る1〜2時間前・10分ほどでも、寝つくまでの時間が短くなった。仕組みは体の芯の温度が下がることと合う（PubMed 要旨・テキサス大学の発表）
//  90分前 は 1〜2時間前 の中の設定（題名の数で、研究の数字ではない と画面に出す）。何分早くなったか は使わない
//  熱すぎるお湯・お酒のあとの入浴は控えて の札（消費者庁の目安 湯温41度以下・10分まで は 0671 で確認済み）。裸の絵は出さない（湯気・肩から上）

const GOLD = '#ffd27a', GREEN = '#9be86a', BLUE = '#7fc8ff', RED = '#ff8a7a';
const { S, flat, room, hemi } = makeSet({ bg: '#1e2234', ground: '#3a3a46' }); hemi.intensity = 1.1;
const ME = makeMan({ shirt: '#8aa0c0', pants: '#4a5a7a', hair: '#1d1a19' }); S.add(ME); const sweat = makeSweat(); ME.userData.head.add(sweat);
const BATHER = makeMan({ shirt: '#e8c8a8', hair: '#1d1a19' }); S.add(BATHER); const BTOWEL = box(0.44, 0.08, 0.42, mat('#f4f4f2')); BTOWEL.position.y = 0.5; BATHER.userData.head.add(BTOWEL);
const PH = makePhone({ w: 0.22, h: 0.44, cw: 240, ch: 480 }); S.add(PH.g);
PH.draw('s', (g, W, H) => { g.fillStyle = '#e8f0ff'; g.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { g.fillStyle = ['#ffb0c0', '#a0d0ff', '#ffe08a'][i % 3]; g.fillRect(20, 30 + i * 74, W - 40, 60); } });

// ---------- A：寝室と浴室のドア（原点・夜） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#4a4e66', floor: '#6a5a4a' });
const BED = makeBed({ blanket: '#5a6a9a' }); BED.position.set(-0.9, 0, -1.2); S.add(BED);
const CLOCK = makeAlarm(); CLOCK.scale.setScalar(1.25); CLOCK.position.set(0.4, 0.5, -2.1); S.add(CLOCK);
const STOOL = box(0.7, 0.5, 0.5, mat('#7a5c40')); STOOL.position.set(0.4, 0.25, -2.1); S.add(STOOL);
const DOOR = new THREE.Group(); DOOR.position.set(1.6, 0, -2.42); S.add(DOOR);
const doorM = new THREE.MeshBasicMaterial({ color: '#2a2c38' }); { const f = box(1.3, 2.3, 0.06, mat('#8a7a68')); f.position.y = 1.15; DOOR.add(f); const g = box(1.1, 2.1, 0.07, doorM); g.position.y = 1.1; DOOR.add(g); }
const BLIGHT = new THREE.PointLight(0xffe6b0, 0, 6, 1.4); BLIGHT.position.set(1.6, 1.6, -1.6); S.add(BLIGHT);
const DSTEAM = makeSteam(16, { w: 1.0, d: 0.3, h: 1.6 }); DSTEAM.position.set(1.6, 1.4, -2.2); S.add(DSTEAM);
const bath90 = label('90分前', { w: 512, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(bath90);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const abiteru = label('シャワーは 浴びてる', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.1 }); S.add(abiteru);
const nemurenai = label('寝つけない', { w: 640, size: 110, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.8 }); S.add(nemurenai);
const omoi = label('まぶたが 重い', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(omoi);
const neteru = label('スマホの前に 寝てる', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(neteru);
const ZZZ = label('Zzz', { w: 384, size: 120, color: '#fff', sx: 0.45 }); S.add(ZZZ);

// ---------- B：浴室（x=60） ----------
const BX = 60;
room({ x: BX, w: 5, d: 4, h: 2.8, wall: '#bcd8e4', floor: '#8aa8b8', left: true, right: true });
const TUB = makeTub(); TUB.scale.set(1.3, 1, 1.2); TUB.position.set(BX, 0, -1.3); TUB.userData.setWater(1); S.add(TUB);
const STEAM = makeSteam(26, { w: 2.0, d: 1.0, h: 2.0 }); STEAM.position.set(BX, 0.5, -1.3); S.add(STEAM);
const BCLOCK = makeAlarm(); BCLOCK.position.set(BX - 0.9, 1.45, -1.9); S.add(BCLOCK);
const juppun = label('10分だけ', { w: 640, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.8 }); S.add(juppun);

// ---------- C：論文の山（x=120） ----------
const CX = 120;
flat(30, 20, '#2e2c3c', CX, -2); const BACKC = box(16, 7, 0.2, mat('#262434')); BACKC.position.set(CX, 3.5, -8); S.add(BACKC);
const PAPERS = []; { const r = rng(139); for (let i = 0; i < 120; i++) { const p = box(0.42, 0.04, 0.56, mat(r() < 0.5 ? '#f4f2ec' : '#e8e4da')); p.position.set(CX - 2.6 + (i % 12) * 0.47 + (r() - 0.5) * 0.1, 0.02 + Math.floor(i / 12) * 0.05, -1.5 + (r() - 0.5) * 2.2); p.rotation.y = (r() - 0.5) * 0.6; S.add(p); PAPERS.push(p); } }
const PICK = []; for (let i = 0; i < 17; i++) { const p = box(0.36, 0.5, 0.03, mat('#ffe08a')); S.add(p); PICK.push(p); }
const bunseki = label('17の研究をまとめた', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.15 }); S.add(bunseki);

// ---------- D：体温の模式図（x=180） ----------
const DX = 180;
flat(20, 14, '#23263a', DX, -2);
const BODY = makeMan({ shirt: '#7a8aa8', pants: '#4a5a7a' }); S.add(BODY);
const CORE = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: '#ff5a3a', transparent: true, opacity: 0.85, depthTest: false })); CORE.renderOrder = 5; S.add(CORE);
const HANDS = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0, depthTest: false })); m.renderOrder = 5; S.add(m); return m; });
const sagaru = label('芯の熱が 下がる → 眠い', { w: 1100, size: 88, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.35 }); S.add(sagaru);
const chuui = label('熱すぎるお湯・お酒のあとは NG', { w: 1200, size: 84, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.45 }); S.add(chuui);
const settei = label('90分は 1〜2時間前の中の設定', { w: 1200, size: 84, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(settei);
const osoi = label('少し 遅すぎた準備', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.05 }); S.add(osoi);

const LABELS = [bath90, katamaru, abiteru, nemurenai, omoi, neteru, ZZZ, juppun, bunseki, sagaru, chuui, settei, osoi];
function reset() {
  ME.userData.legs.forEach(l => l.visible = true); [ME, BATHER, BODY].forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); PH.g.visible = false;
  STEAM.userData.set(0); DSTEAM.userData.set(0); BLIGHT.intensity = 0; doorM.color.set('#2a2c38'); CLOCK.userData.set('0:00');
  PICK.forEach(p => p.visible = false); CORE.visible = false; HANDS.forEach(h => h.visible = false); hemi.intensity = 1.1; BED.userData.blanket.visible = true;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function bathOn(k, t) { BLIGHT.intensity = 9 * k; doorM.color.set('#2a2c38').lerp(new THREE.Color('#ffe6b0'), k); DSTEAM.userData.set(k, t); }
function inBed(phone = true, head = 0) { ME.visible = true; ME.rotation.set(-Math.PI / 2, 0, 0); ME.position.set(-0.9, 0.62, -0.05); ME.userData.head.rotation.x = head; ME.userData.legs.forEach(l => l.visible = false);
  { if (phone) { ME.userData.arms[1].rotation.set(-2.4, 0, 0.3); PH.g.visible = true; PH.g.position.set(-0.85, 1.25, -1.5); PH.g.rotation.set(-Math.PI / 2 + 0.35, 0, 0); } } }
function soak(t) { BATHER.visible = true; BATHER.position.set(BX - 0.2, 0, -1.2); poseSit(BATHER); BATHER.position.y = -0.62; BATHER.userData.legs.forEach(l => l.visible = false); BATHER.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0)); BATHER.userData.head.rotation.z = Math.sin(t * 1.5) * 0.05; }
const TP = 0.3;
function roomCam(u = 0) { look(lerp(0.4, 0.35, u), lerp(1.8, 1.75, u), lerp(4.3, 4.0, u), 0.35, 1.25, -1.6, 50); }
function shot0(t) { // 0秒＝サムネ：布団の横の時計が 0:00 を指した瞬間、90分前の 22:30 に、浴室の電気がパッと点く
  reset(); lift(0); inBed(true); hemi.intensity = 0.8;
  if (t >= TP) { CLOCK.userData.set('22:30', '#ffd27a'); bathOn(easeOut(clamp((t - TP) / 0.25)), t); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; say(bath90, t, TP + 0.15, 1.6, 1.3, -1.9, 0.8); }
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 寝る直前にシャワーを浴びた会社員が、スマホを握ったまま布団で固まる
  reset(); lift(140); inBed(true); hemi.intensity = 0.8; sweat.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, -0.5, 1.5, -1.7, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), lerp(2.4, 2.3, u), lerp(1.4, 1.1, u), -0.9, 0.7, -1.6, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。シャワーは浴びてる。なのに、寝つけない
  reset(); lift(140); hemi.intensity = 0.8; const ph = t / d; CLOCK.userData.set(ph < 0.5 ? '0:00' : '1:40');
  inBed(true); sweat.userData.set(ph > 0.5 ? 1 : 0, t);
  if (ph < 0.5) say(abiteru, t, 0.3, -0.2, 1.75, -0.6, 1.05); else say(nemurenai, t, d * 0.5, -0.2, 1.75, -0.6, 0.8);
  look(0.4, 2.2, 3.6, -0.3, 0.9, -1.3, 50);
  return S;
}
function tubCam(u = 0) { look(BX + lerp(0.9, 0.7, u), 1.6, lerp(2.5, 2.2, u), BX - 0.1, 0.8, -1.3, 50); }
function sDay1(t, d) { // 1日目。22:30 に湯船へ。10分だけ浸かる
  reset(); lift(140); soak(t); STEAM.userData.set(1, t); BCLOCK.userData.set(t < d * 0.5 ? '22:30' : '22:40', '#ffd27a');
  if (t > d * 0.45) say(juppun, t, d * 0.45, BX - 0.2, 1.65, -1.0, 0.7);
  setHud('寝る90分前の湯船', '1日目', 1); tubCam(ease(clamp(t / d)));
  return S;
}
function sWeek(t, d) { // 1週間後。0時前に、まぶたが勝手に重くなる
  reset(); lift(140); hemi.intensity = 0.8; CLOCK.userData.set('23:50'); inBed(false); ME.userData.arms[1].rotation.set(-0.2, 0, 0);
  if (t > d * 0.4) say(omoi, t, d * 0.4, -0.2, 1.7, -0.6, 0.85);
  setHud('寝る90分前の湯船', '1週間後', 1);
  look(0.4, 2.2, 3.4, -0.3, 0.9, -1.3, 50);
  return S;
}
function sTwoWeeks(t, d) { // 2週間後。布団でスマホを開く前に、もう寝ている
  reset(); lift(140); hemi.intensity = 0.75; CLOCK.userData.set('23:40'); inBed(false); PH.g.visible = true; PH.g.position.set(-0.25, 0.68, -0.6); PH.g.rotation.set(-Math.PI / 2, 0, 0.3);
  ZZZ.visible = true; ZZZ.position.set(-0.7, 1.2 + (t % 1.5) * 0.2, -1.3); ZZZ.userData.size(0.45);
  if (t > d * 0.45) say(neteru, t, d * 0.45, -0.2, 1.75, -0.6, 1.05);
  setHud('寝る90分前の湯船', '2週間後', 1);
  look(0.4, 2.2, 3.4, -0.3, 0.9, -1.3, 50);
  return S;
}
function sNaze(t, d) { // でも、なぜ寝る直前じゃなく、90分前なのか
  reset(); lift(140); inBed(false); hemi.intensity = 0.8; CLOCK.userData.set(t < d * 0.5 ? '0:00' : '22:30', t < d * 0.5 ? '#ff5a4a' : '#ffd27a'); if (t > d * 0.5) bathOn(1, t);
  if (t > d * 0.55) say(settei, t, d * 0.55, 0.7, 2.25, -1.2, 1.3);
  roomCam(0.5);
  return S;
}
function papersCam(u = 0) { look(CX + lerp(0.4, 0.0, u), lerp(3.2, 2.6, u), lerp(5.2, 4.4, u), CX, 0.6, -1.4, 50); }
function sPapers(t, d) { // 5,322本の論文から、17の研究をまとめた分析がある（2019年）
  reset(); lift(160); const ph = t / d; const k = easeOut(clamp((ph - 0.5) / 0.3));
  PICK.forEach((p, i) => { p.visible = k > 0; const x = CX - 2.0 + (i % 9) * 0.5, y = 0.9 + Math.floor(i / 9) * 0.6; p.position.set(lerp(CX - 2.4 + (i * 0.33) % 5, x, k), lerp(0.2, y, k), lerp(-1.5, -0.6, k)); });
  setTop('お風呂と眠りの論文（2019年）', ph < 0.5 ? Math.round(5322 * easeOut(clamp((t - 0.3) / 1.4))).toLocaleString('ja-JP') + '本' : '→ 17の研究', 1, BLUE);
  if (ph > 0.7) say(bunseki, t, d * 0.7, CX, 2.15, -0.6, 1.1);
  papersCam(ease(clamp(t / d)));
  return S;
}
function sTemp(t, d) { // 40〜42.5度のお湯に、寝る1〜2時間前に入ると
  reset(); lift(140); soak(t); STEAM.userData.set(1, t); BCLOCK.userData.set('寝る1〜2時間前', '#ffd27a');
  setTop('お湯の温度（2019年の分析）', '40〜42.5度', fade(t, 0.3, d, 0.25), RED); setHud('入る時間', '寝る1〜2時間前', 1);
  tubCam(0.5);
  return S;
}
function sShort(t, d) { // たった10分でも、寝つくまでの時間が短くなった
  reset(); lift(140); soak(t); STEAM.userData.set(1, t); BCLOCK.userData.set('10:00', '#7dff8a');
  setTop('たった10分でも', '寝つくまでが 短縮', fade(t, 0.3, d, 0.25), GREEN);
  tubCam(0.8);
  return S;
}
function bodyCam() { look(DX, 1.3, 3.6, DX, 1.05, 0, 50); }
function heatBody(k, t) { BODY.visible = true; BODY.position.set(DX, 0, 0); BODY.userData.arms[0].rotation.set(0, 0, -0.35); BODY.userData.arms[1].rotation.set(0, 0, 0.35); BODY.updateMatrixWorld();
  CORE.visible = true; CORE.position.set(DX, 1.2, 0.2); CORE.material.color.set('#ff5a3a').lerp(new THREE.Color('#5aa0ff'), k); CORE.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
  const hp = [[-0.56, 0.86, 0.1], [0.56, 0.86, 0.1], [-0.12, 0.1, 0.15], [0.12, 0.1, 0.15]]; HANDS.forEach((h, i) => { h.visible = true; h.position.set(DX + hp[i][0], hp[i][1], hp[i][2]); h.material.opacity = 0.9 * Math.sin(Math.min(1, k * 1.2) * Math.PI); }); }
function sCore(t, d) { // 体の芯の熱が手足から逃げて、下がっていくときに眠くなる、と考えられている。熱すぎるお湯・お酒のあとはやめて
  reset(); lift(140); const ph = t / d;
  if (ph < 0.7) { heatBody(clamp(ph / 0.65), t); if (ph > 0.35) say(sagaru, t, d * 0.35, DX, 2.25, 0, 1.25); bodyCam(); return S; }
  heatBody(1, t); say(chuui, t, d * 0.7, DX, 2.25, 0, 1.3); bodyCam();
  return S;
}
function sKekka(t, d) { // 結果：寝る1〜2時間前の10分の湯船で、寝つきは早くなった。変えたのは、入る時間だけだった
  reset(); lift(140); const ph = t / d;
  if (ph < 0.55) { soak(t); STEAM.userData.set(1, t); BCLOCK.userData.set('22:30', '#ffd27a'); setTop('結果', '寝つきが 早くなった', fade(t, 0.3, d * 0.55, 0.25), GOLD); tubCam(0.4); return S; }
  hemi.intensity = 0.75; CLOCK.userData.set('22:30', '#ffd27a'); bathOn(1, t); inBed(false); ZZZ.visible = true; ZZZ.position.set(-0.7, 1.2 + (t % 1.5) * 0.2, -1.3); ZZZ.userData.size(0.45);
  setTop('変えたのは', '入る時間だけ', fade(t, d * 0.55, d, 0.25), GOLD); roomCam(0.6);
  return S;
}
function sOsoi(t, d) { // 寝る直前のシャワーは、疲れを流すだけで、眠りの準備には、少し遅すぎたのかもしれない
  reset(); lift(140); hemi.intensity = 0.8; CLOCK.userData.set('0:00'); inBed(true);
  if (t > d * 0.45) say(osoi, t, d * 0.45, -0.2, 1.75, -0.6, 1.0);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.3, u), 2.3, lerp(3.8, 3.2, u), -0.4, 0.9, -1.2, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); inBed(true); hemi.intensity = 0.8; CLOCK.userData.set('22:30', '#ffd27a'); bathOn(1, t); roomCam(0); return S; }

const NARR = { '寝る直前': 'ねるちょくぜん', '浴びた': 'あびた', '会社員': 'かいしゃいん', '握った': 'にぎった', '布団': 'ふとん', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '浴びてる': 'あびてる', '寝つけない': 'ねつけない', '1日目': 'いちにちめ', '22:30': 'にじゅうにじはん', '湯船': 'ゆぶね', '10分だけ': 'じゅっぷんだけ', '浸かる': 'つかる', '1週間後': 'いっしゅうかんご', '0時前': 'れいじまえ', '勝手に': 'かってに', '重くなる': 'おもくなる', '2週間後': 'にしゅうかんご', '開く前': 'ひらくまえ', '寝ている': 'ねている', '90分前': 'きゅうじゅっぷんまえ', '5,322本': 'ごせんさんびゃくにじゅうにほん', '論文': 'ろんぶん', '17の研究': 'じゅうななのけんきゅう', '分析': 'ぶんせき', '40〜42.5度': 'よんじゅうどから、よんじゅうにてんごど', '寝る1〜2時間前': 'ねるいちからにじかんまえ', '入ると': 'はいると', 'たった10分': 'たったじゅっぷん', '寝つくまで': 'ねつくまで', '短くなった': 'みじかくなった', '体の芯': 'からだのしん', '熱が': 'ねつが', '手足': 'てあし', '逃げて': 'にげて', '下がっていく': 'さがっていく', '眠くなる': 'ねむくなる', '考えられている': 'かんがえられている', '熱すぎる': 'あつすぎる', '結果：': '結果、', '10分の湯船': 'じゅっぷんのゆぶね', '寝つき': 'ねつき', '早くなった': 'はやくなった', '変えた': 'かえた', '入る時間': 'はいるじかん', '疲れ': 'つかれ', '流す': 'ながす', '眠り': 'ねむり', '準備': 'じゅんび', '少し': 'すこし', '遅すぎた': 'おそすぎた', '何分前': 'なんぷんまえ', '入ってる': 'はいってる' };
const P = planTimes([
  ['寝る直前にシャワーを<br>浴びた会社員が、', (t, d) => sKatamaru(t, 2 * d)],
  ['スマホを握ったまま<br>布団で固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['本人の言い分から。<br>シャワーは浴びてる。', (t, d) => sIibun(t, 2 * d)],
  ['なのに、寝つけない。', (t, d) => sIibun(t + d, 2 * d)],
  ['1日目。22:30 に湯船へ。<br>10分だけ浸かる。', sDay1],
  ['1週間後。0時前に、<br>まぶたが勝手に重くなる。', sWeek],
  ['2週間後。布団でスマホを<br>開く前に、もう寝ている。', sTwoWeeks],
  ['でも、なぜ寝る直前じゃなく、<br>90分前なのか。', sNaze],
  ['5,322本の論文から、', (t, d) => sPapers(t, 2 * d)],
  ['17の研究をまとめた<br>分析がある（2019年）。', (t, d) => sPapers(t + d, 2 * d)],
  ['40〜42.5度のお湯に、<br>寝る1〜2時間前に入ると', sTemp],
  ['たった10分でも、<br>寝つくまでの時間が短くなった。', sShort],
  ['体の芯の熱が手足から逃げて、', (t, d) => sCore(t, 3 * d)],
  ['下がっていくときに眠くなる、<br>と考えられている。', (t, d) => sCore(t + d, 3 * d)],
  ['熱すぎるお湯・<br>お酒のあとはやめて。', (t, d) => sCore(t + 2 * d, 3 * d)],
  ['結果：寝る1〜2時間前の<br>10分の湯船で、', (t, d) => sKekka(t, 3 * d)],
  ['寝つきは早くなった。', (t, d) => sKekka(t + d, 3 * d)],
  ['変えたのは、<br>入る時間だけだった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['寝る直前のシャワーは、<br>疲れを流すだけで、', (t, d) => sOsoi(t, 3 * d)],
  ['眠りの準備には、', (t, d) => sOsoi(t + d, 3 * d)],
  ['少し遅すぎたのかもしれない。', (t, d) => sOsoi(t + 2 * d, 3 * d)],
  ['お風呂、<br>寝る何分前に入ってる？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0743',
    v2: true,
    tt: 'main',
    hookLine: '布団の横の時計が 0:00 を指した瞬間、90分前の 22:30 に、浴室の電気がパッと点く。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月、寝る90分前にお風呂に入ったら？',
    titleHtml: 'もしも1か月、<br>寝る90分前に<br>お風呂に<br>入ったら？',
    mood: 'calm', seed: 743, hits: [TP, P.at(15), P.at(17)], risers: [P.at(7)], impacts: [P.at(9, 0.3), P.at(10, 0.4), P.at(11, 0.4)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.6), 'bubble'], [P.at(6, 0.6), 'whoosh'], [P.at(14, 0.4), 'alarm']],
    narr: NARR,
    ask: 'お風呂、寝る何分前に入ってる？',
    caption: 'もしも1か月、寝る90分前にお風呂に入ったら？\n\n寝る直前にシャワーを浴びた会社員が、スマホを握ったまま布団で固まる。\n本人の言い分から。シャワーは浴びてる。なのに、寝つけない。\n1日目。22:30 に湯船へ。10分だけ浸かる。\n1週間後。0時前に、まぶたが勝手に重くなる。\n2週間後。布団でスマホを開く前に、もう寝ている。\nでも、なぜ寝る直前じゃなく、90分前なのか。\n5,322本の論文から、17の研究をまとめた分析がある（2019年）。\n40〜42.5度のお湯に、寝る1〜2時間前に入ると、たった10分でも、寝つくまでの時間が短くなった。\n体の芯の熱が手足から逃げて、下がっていくときに眠くなる、と考えられている。熱すぎるお湯・お酒のあとはやめて。\n\n結果：寝る1〜2時間前の10分の湯船で、寝つきは早くなった。変えたのは、入る時間だけだった。\n寝る直前のシャワーは、疲れを流すだけで、眠りの準備には、少し遅すぎたのかもしれない。\n\nお風呂、寝る何分前に入ってる？ コメントで教えて。\n\n※90分は、研究の 寝る1〜2時間前 の中から選んだ設定です。熱すぎるお湯・お酒のあとの入浴は控えてください。登場する人物は架空です\n出典：Haghayegh ほか Sleep Medicine Reviews 2019年46巻（5,322本の候補から17の研究、40〜42.5℃・寝る1〜2時間前の入浴で寝つくまでの時間が短くなった）',
    hashtags: ['もしもラボ', 'もしも', 'お風呂', '睡眠', '人体の限界'],
    endStats: [['まとめた研究', '17', '2019年・Sleep Med Rev'], ['お湯の温度', '40〜42.5度', '寝る1〜2時間前'], ['変えたのは', '入る時間だけ', 'もしもの結果']],
    sources: '出典：Haghayegh ほか Sleep Med Rev 2019<br>※90分は1〜2時間前の中の設定。熱すぎるお湯・お酒のあとはNG',
  },
});
