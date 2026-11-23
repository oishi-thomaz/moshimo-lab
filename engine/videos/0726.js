import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, poseClear, poseSit, poseSlump, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTub, makeSteam, makeBed } from '../scenes/home.js';

// もしも1か月、仕事帰りに毎日銭湯へ通ったら？（人体の限界・台本 S128）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/22 の解析の種（0695 サウナ・0671 湯船 の 温まる習慣を毎日にしたら）
// 数字（一次資料で確認・2026/11/23）：
//  JAGES の65歳以上の自立した高齢者13,786人を3年追跡。冬に湯船の入浴が週7回以上の人は週0〜2回の人より要介護認定のハザード比0.71（95%CI 0.60–0.84）＝約29%低い（1−0.71）
//   （Yagi ほか Journal of Epidemiology 2019年 29巻12号、J-STAGE の要旨）。湯船の研究で銭湯の研究ではないので、字幕は 湯船に浸かる人。観察研究 と出す
//  一般公衆浴場 令和6年度末 2,730施設・前年度比117施設減（厚生労働省 令和6年度衛生行政報告例の概況）
//  熱いお湯・お酒のあとの入浴は控えて の札を出す（消費者庁の目安 湯温41度以下・10分まで は 0671 で確認済み）
// 裸の絵は出さない（のれん・湯気・肩から上）。実在の銭湯の名前・ロゴは出さない（架空の もしも湯）

const GOLD = '#ffd27a', GREEN = '#9be86a', BLUE = '#7fc8ff', RED = '#ff8a7a';
const { S, flat, room, hemi } = makeSet({ bg: '#2c3448', ground: '#4a4a52' }); hemi.intensity = 1.25;

const ME = makeSuit({ jacket: '#5a6a8a', tie: '#3a6ab2' }); S.add(ME); const sweat = makeSweat(); ME.userData.head.add(sweat);
const BAG = box(0.36, 0.26, 0.1, mat('#2a2220')); BAG.position.set(0, -0.7, 0.05); ME.userData.arms[0].add(BAG);
const HTOWEL = box(0.44, 0.08, 0.42, mat('#f4f4f2')); HTOWEL.position.y = 0.5; ME.userData.head.add(HTOWEL);
// 湯船の中の本人（肩から上だけ見える別の人形）
const BATHER = makeMan({ shirt: '#e8c8a8', hair: '#1d1a19' }); S.add(BATHER); const BTOWEL = box(0.44, 0.08, 0.42, mat('#f4f4f2')); BTOWEL.position.y = 0.5; BATHER.userData.head.add(BTOWEL);

// ---------- A：銭湯の外（原点）：架空の もしも湯 ----------
flat(40, 12, '#3a3a42', 0, 1.0);
const SENTO = new THREE.Group(); S.add(SENTO); SENTO.position.set(0, 0, -2.2);
{ const body = box(6, 3.4, 2.4, mat('#8a6a4c')); body.position.y = 1.7; SENTO.add(body);
  const roof = box(6.8, 0.3, 3.0, mat('#3a3a48')); roof.position.y = 3.5; SENTO.add(roof);
  const hafu = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), mat('#3a3a48')); hafu.rotation.y = Math.PI / 4; hafu.scale.z = 0.4; hafu.position.set(0, 4.2, 0.9); SENTO.add(hafu);
  const door = box(2.0, 2.3, 0.05, new THREE.MeshBasicMaterial({ color: '#ffe0a8' })); door.position.set(0, 1.15, 1.22); SENTO.add(door);
  const ch = box(0.6, 7, 0.6, mat('#a89a8a')); ch.position.set(2.6, 3.5, -0.8); SENTO.add(ch);
  for (const x of [-2.2, 2.2]) { const w = box(1.0, 0.8, 0.05, new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); w.position.set(x, 2.0, 1.22); SENTO.add(w); } }
const NOREN = new THREE.Group(); { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#2a4a8a'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#fff'; g.font = '900 170px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ゆ', 256, 136); g.fillStyle = '#2c3448'; for (const x of [168, 340]) g.fillRect(x, 120, 6, 136); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); NOREN.add(m); }
NOREN.position.set(0, 1.85, -0.94); S.add(NOREN);
const SENTO_SIGN = label('もしも湯', { w: 640, size: 120, color: '#fff', bg: 'rgba(40,60,110,.97)', sx: 0.95 }); SENTO_SIGN.position.set(0, 3.0, -0.9); S.add(SENTO_SIGN);
const COUNTER = label('1日', { w: 512, size: 140, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(COUNTER);
const POLE = []; for (let i = 0; i < 3; i += 2) { const p = box(0.1, 3.2, 0.1, mat('#6a6e78')); p.position.set(-6 + i * 6, 1.6, 1.4); S.add(p); const l = box(0.4, 0.1, 0.4, new THREE.MeshBasicMaterial({ color: '#fff4c8' })); l.position.set(-6 + i * 6, 3.2, 1.4); S.add(l); }
const katte = label('足が 勝手に', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(katte);

// ---------- B：浴場（x=60） ----------
const BX = 60;
room({ x: BX, w: 9, d: 7, h: 3.6, wall: '#bcd8e4', floor: '#8aa8b8', left: true, right: true });
const MURAL = new THREE.Group(); { const sky = box(6, 2.0, 0.05, new THREE.MeshBasicMaterial({ color: '#8ac4ec' })); sky.position.set(0, 2.5, 0); MURAL.add(sky); const mt = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 3), new THREE.MeshBasicMaterial({ color: '#3a6aa8' })); mt.position.set(0, 2.15, 0.05); mt.scale.z = 0.05; MURAL.add(mt); const sn = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' })); sn.position.set(0, 2.66, 0.07); sn.scale.z = 0.05; MURAL.add(sn); } MURAL.position.set(BX, 0, -3.42); S.add(MURAL);
const BIGTUB = makeTub(); BIGTUB.scale.set(3.6, 1, 2.4); BIGTUB.position.set(BX, 0, -2.0); BIGTUB.userData.setWater(1); S.add(BIGTUB);
const STEAM = makeSteam(30, { w: 5, d: 2, h: 2.6 }); STEAM.position.set(BX, 0.5, -2.0); S.add(STEAM);
const GLASSDOOR = box(1.4, 2.3, 0.05, new THREE.MeshLambertMaterial({ color: '#cfe4ee', transparent: true, opacity: 0.25, depthWrite: false })); GLASSDOOR.position.set(BX + 2.6, 1.15, 0.8); S.add(GLASSDOOR);
const aa = label('あ〜', { w: 512, size: 140, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.6 }); S.add(aa);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const BANDAI = new THREE.Group(); { const b = box(1.4, 1.1, 0.8, mat('#8a6a4c')); b.position.y = 0.55; BANDAI.add(b); const tp = box(1.5, 0.06, 0.9, mat('#6a4a30')); tp.position.y = 1.12; BANDAI.add(tp); } BANDAI.position.set(BX - 3.0, 0, 0.4); S.add(BANDAI);
const OBA = makeWoman({ shirt: '#a87ab0', hair: '#c8c8c8', skin: '#f0cfb2' }); S.add(OBA);
const okaeri = label('おかえり', { w: 640, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.75 }); S.add(okaeri);

// ---------- C：一人暮らしの部屋（x=120） ----------
const CX = 120;
room({ x: CX, w: 5, d: 5, h: 2.6, wall: '#e8e2d6', floor: '#b48a5e' });
const BED = makeBed(); BED.position.set(CX - 1.0, 0, -1.2); S.add(BED);
const SHOWER = new THREE.Group(); { const w = box(1.2, 2.2, 0.06, new THREE.MeshLambertMaterial({ color: '#d8e8f0' })); w.position.set(0, 1.1, 0); SHOWER.add(w); const pipe = box(0.04, 0.9, 0.04, mat('#c0c4c8')); pipe.position.set(0.3, 1.6, 0.06); SHOWER.add(pipe); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.1, 12), mat('#c0c4c8')); hd.rotation.x = Math.PI / 2; hd.position.set(0.3, 2.05, 0.12); SHOWER.add(hd); } SHOWER.position.set(CX + 1.4, 0, -2.4); S.add(SHOWER);
const shower5 = label('シャワー 5分', { w: 768, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(shower5);
const tsukare = label('疲れが 取れない', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.2 }); S.add(tsukare);
const ookina = label('部屋に足りない 大きな湯船', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(ookina);

// ---------- D：研究（x=180） ----------
const DX = 180;
flat(30, 20, '#3a3448', DX, -2); const BACKD = box(16, 7, 0.2, mat('#2c2838')); BACKD.position.set(DX, 3.5, -10); S.add(BACKD);
const CROWD = []; { const r = rng(128); for (let i = 0; i < 48; i++) { const w = r() < 0.53; const p = w ? makeWoman({ shirt: ['#a87ab0', '#7a9ac0', '#c8a070', '#8ab08a'][i % 4], hair: ['#c8c8c8', '#9a9a9a', '#e0e0e0'][i % 3] }) : makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#8a7a5a', '#59606e'][i % 4], hair: ['#c8c8c8', '#9a9a9a'][i % 2], bald: r() < 0.4 }); p.position.set(DX - 5.5 + (i % 8) * 1.55 + (r() - 0.5) * 0.3, 0, -1 - Math.floor(i / 8) * 1.5); p.rotation.y = (r() - 0.5) * 0.5; S.add(p); CROWD.push(p); } }
const BARS = []; [['週2回以下', '#9aa0aa'], ['ほぼ毎日', '#5ab07a']].forEach(([n, c]) => { const b = box(0.7, 1, 0.4, mat(c)); S.add(b); const l = label(n, { w: 640, size: 100, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.75 }); S.add(l); BARS.push({ b, l }); });
const kansatsu = label('観察研究', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.7 }); S.add(kansatsu);
const chuui = label('熱すぎるお湯・お酒のあとは NG', { w: 1200, size: 84, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.45 }); S.add(chuui);

// ---------- E：減っていく銭湯（x=240） ----------
const EX = 240;
flat(40, 30, '#3a3a42', EX, -6);
const MINI = []; { const r = rng(5); for (let i = 0; i < 40; i++) { const g = new THREE.Group(); const b = box(1.0, 0.7, 0.8, mat('#8a6a4c')); b.position.y = 0.35; g.add(b); const ch = box(0.14, 1.4, 0.14, mat('#a89a8a')); ch.position.set(0.3, 0.9, -0.2); g.add(ch); const w = box(0.5, 0.3, 0.02, new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); w.position.set(0, 0.35, 0.41); g.add(w); g.position.set(EX - 7.2 + (i % 8) * 2.05 + (r() - 0.5) * 0.3, 0, -1.2 - Math.floor(i / 8) * 2.1); S.add(g); MINI.push(g); } }
const sparkE = makeSparkles(160, 0.12, 0xffe0a8); S.add(sparkE.points); sparkE.init([[EX - 1.0, 0.6, -1.2], [EX + 3.1, 0.6, -3.3], [EX - 5.1, 0.6, -5.4], [EX + 5.1, 0.6, -7.5]], 0.6, 0.8);
const GONE = [1, 6, 11, 13, 20, 26, 30, 35];
const kieta = label('1年で 117軒 減った', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(kieta);

const LABELS = [COUNTER, katte, aa, katamaru, okaeri, shower5, tsukare, ookina, kansatsu, chuui, kieta, ...BARS.map(x => x.l)];
function reset() {
  [ME, BATHER, OBA].forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); HTOWEL.visible = false; BAG.visible = true;
  STEAM.userData.set(0); CROWD.forEach(c => c.visible = false); BARS.forEach(x => x.b.visible = false); MINI.forEach(m => { m.visible = true; m.scale.setScalar(1); }); sparkE.set(0); hemi.intensity = 1.25; NOREN.rotation.x = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function soak(t, x = BX - 0.4, z = -1.7) { BATHER.visible = true; BATHER.position.set(x, 0, z); poseSit(BATHER); BATHER.position.y = -0.8; BATHER.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0)); BATHER.userData.head.rotation.z = Math.sin(t * 1.5) * 0.05; }
const TP = 0.3;
function frontCam(u = 0) { look(lerp(0.1, 0.0, u), lerp(1.8, 1.75, u), lerp(6.4, 5.9, u), 0.1, 1.75, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：仕事帰りの会社員がのれんをくぐると、30日 のカウンターがカチッと回り出す
  reset(); lift(0); const k = clamp(t / 0.5); stand(ME, lerp(-0.75, -0.65, k), lerp(0.4, -0.3, k), Math.PI); if (k < 1) poseWalk(ME, t * 7, 0.7); NOREN.rotation.x = -0.35 * Math.sin(clamp(t / 0.6) * Math.PI);
  if (t >= TP) { const n = Math.min(30, 1 + Math.floor((t - TP) * 4)); COUNTER.userData.set(n + '日'); say(COUNTER, t, TP, 1.35, 1.05, -0.3, 0.75); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; }
  SENTO_SIGN.visible = t > 1.9;
  frontCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 家ではシャワー5分の一人暮らしの会社員が、大きな湯気の前で固まる
  reset(); lift(140); STEAM.userData.set(1, t); stand(ME, BX + 1.5, 0.6, -2.6); BAG.visible = false; ME.userData.arms[0].rotation.set(-0.3, 0, 0);
  if (t > d * 0.25) sweat.userData.set(1, t);
  if (t > d * 0.5) say(katamaru, t, d * 0.5, BX + 1.5, 2.3, 0.6, 0.38);
  const u = ease(clamp(t / d)); look(BX + lerp(2.6, 2.4, u), 1.9, lerp(3.8, 3.4, u), BX + 0.6, 1.3, -1.2, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。シャワーで十分。なのに、疲れが取れない
  reset(); lift(140); const ph = t / d;
  stand(ME, CX - 1.0, -0.4, 0.2); BAG.visible = false; if (ph > 0.5) { poseSit(ME); ME.position.set(CX - 0.6, 0, -0.65); ME.position.y = -0.39 + 0.3; ME.rotation.x = 0.35; ME.userData.head.rotation.x = 0.35; ME.userData.arms.forEach(a => a.rotation.set(-0.6, 0, 0)); }
  if (ph < 0.5) say(shower5, t, 0.3, CX + 1.2, 2.35, -2.0, 0.9); else { say(tsukare, t, d * 0.5, CX - 0.6, 2.1, -0.6, 1.0); sweat.userData.set(1, t); }
  look(CX + 0.2, 2.0, 4.8, CX + 0.2, 1.3, -1.2, 50);
  return S;
}
function sDay1(t, d) { // 1日目。大きな湯船で、思わず あ〜 と声が出る
  reset(); lift(140); STEAM.userData.set(1, t); soak(t);
  if (t > d * 0.35) say(aa, t, d * 0.35, BX - 0.1, 1.55, -1.5, 0.5);
  setHud('毎日 銭湯', '1日目', 1);
  const u = ease(clamp(t / d)); look(BX + lerp(0.8, 0.5, u), 1.5, lerp(1.6, 1.3, u), BX - 0.4, 0.75, -1.8, 50);
  return S;
}
function sWeek(t, d) { // 1週間後。番台のおばあちゃんに、おかえり と言われる
  reset(); lift(140); stand(OBA, BX - 3.0, 0.1, 0); OBA.position.y = 0.55; OBA.userData.legs.forEach(l => l.rotation.x = -1.4); OBA.userData.arms[1].rotation.set(-1.2, 0, 0.2);
  stand(ME, BX - 1.9, 1.4, -2.5); BAG.visible = true;
  if (t > d * 0.35) say(okaeri, t, d * 0.35, BX - 3.0, 2.55, 0.3, 0.7);
  setHud('毎日 銭湯', '1週間後', 1);
  look(BX - 1.8, 2.1, 5.6, BX - 2.4, 1.4, 0.5, 50);
  return S;
}
function sTwoWeeks(t, d) { // 2週間後。帰り道、足が勝手に銭湯の方へ曲がる
  reset(); lift(140); const k = clamp(t / (d * 0.75));
  const x = k < 0.6 ? lerp(-5, -0.2, k / 0.6) : -0.2 + 0.2 * (k - 0.6) / 0.4; const z = k < 0.6 ? 0.6 : lerp(0.6, -0.4, (k - 0.6) / 0.4);
  stand(ME, x, z, k < 0.6 ? Math.PI / 2 : Math.PI); if (k < 1) poseWalk(ME, t * 7, 0.8);
  if (t > d * 0.5) say(katte, t, d * 0.5, -1.4, 2.5, 0.4, 1.1);
  setHud('毎日 銭湯', '2週間後', 1);
  look(-1.2, 2.1, 6.2, -0.6, 1.6, -0.8, 50);
  return S;
}
function sDou(t, d) { // でも、毎日湯船に浸かると、体はどうなるのか
  reset(); lift(140); STEAM.userData.set(1, t); soak(t);
  const u = ease(clamp(t / d)); look(BX + lerp(0.8, 1.6, u), lerp(1.5, 2.4, u), lerp(1.6, 3.6, u), BX - 0.3, 0.9, -1.8, 50);
  return S;
}
function crowdCam(u = 0) { look(DX + lerp(0.5, 0.0, u), lerp(4.2, 3.6, u), lerp(7.5, 6.5, u), DX, 0.8, -3.5, 50); }
function sStudy(t, d) { // 日本の高齢者 約1.4万人を、3年追いかけた研究がある
  reset(); lift(160); CROWD.forEach((p, i) => { p.visible = t > 0.2 + (i % 8) * 0.06; });
  setTop('湯船の研究（2019年）', Math.round(13786 * easeOut(clamp((t - 0.3) / 1.4))).toLocaleString('ja-JP') + '人', fade(t, 0.3, d, 0.25), BLUE); setHud('日本・65歳以上', '3年', 1);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function barCam() { look(DX + 0.1, 1.4, 6.2, DX, 0.5, 0.6, 50); }
function bars(h2) { BARS.forEach((x, i) => { const h = i ? h2 : 1.6; x.b.visible = true; x.b.scale.y = Math.max(0.01, h); x.b.position.set(DX - 0.6 + i * 1.2, h / 2, 0.6); x.l.visible = true; x.l.position.set(DX - 0.6 + i * 1.2, h + 0.25, 0.7); x.l.userData.size(0.55); }); }
function sRisk(t, d) { // 冬にほぼ毎日湯船に浸かる人は、週2回以下の人より、介護が必要になるリスクが約29%低かった
  reset(); lift(140); const ph = t / d; bars(lerp(1.6, 1.6 * 0.71, easeOut(clamp((ph - 0.68) / 0.12))));
  setHud('介護が必要になるリスク', '冬の湯船', 1);
  if (ph > 0.68) setTop('介護が必要になるリスク（2019年）', '約29%低い', fade(t, d * 0.68, d, 0.25), GREEN);
  barCam();
  return S;
}
function sKansatsu(t, d) { // ただし観察研究。そして日本の銭湯（一般公衆浴場）は、2,730軒（2024年度末）
  reset(); lift(160); const ph = t / d;
  if (ph < 0.42) { lift(40); bars(1.6 * 0.71); say(kansatsu, t, 0.2, DX + 0.6, 1.8, 0.9, 0.6); say(chuui, t, 0.6, DX, 2.25, 0.9, 1.25); barCam(); return S; }
  const n = Math.round(2730 * easeOut(clamp((t - d * 0.45) / 1.2)));
  setTop('日本の銭湯（2024年度末）', n.toLocaleString('ja-JP') + '軒', fade(t, d * 0.45, d, 0.25), GOLD); setHud('一般公衆浴場', '2024年度末', 1);
  const u = ease(clamp((ph - 0.42) / 0.58)); look(EX + lerp(0.5, 0, u), lerp(6.5, 7.5, u), lerp(7, 6.5, u), EX, 0, -4.5, 50);
  return S;
}
function sGone(t, d, hold = false) { // たった1年で、117軒減った
  reset(); lift(160); const k = hold ? 1 : clamp((t - 0.3) / 1.0);
  GONE.forEach((i, j) => { const kk = clamp(k * 1.6 - j * 0.08); MINI[i].scale.setScalar(Math.max(0.001, 1 - easeOut(kk))); MINI[i].visible = kk < 1; });
  if (!hold) { sparkE.set(clamp((t - 0.3) / 1.5)); setTop('1年で減った銭湯', '−117軒', fade(t, 0.5, d, 0.25), RED); }
  if (!hold && t > d * 0.5) say(kieta, t, d * 0.5, EX, 2.4, -2.0, 1.2);
  setHud('一般公衆浴場', '2023→2024年度', 1);
  look(EX, 7.5, 6.5, EX, 0, -4.5, 50);
  return S;
}
function sKekka(t, d) { // 結果：毎日湯船の人は、介護が必要になるリスクが約3割低かった。でも通える銭湯は、1年で117軒消えた
  reset(); lift(140); const ph = t / d;
  if (ph < 0.62) { STEAM.userData.set(1, t); soak(t); setTop('結果', '介護リスク 約3割低い', fade(t, 0.3, d * 0.62, 0.25), GOLD); const u = ease(clamp(t / (d * 0.62))); look(BX + lerp(1.2, 1.6, u), 2.0, lerp(2.6, 3.4, u), BX - 0.3, 0.9, -1.8, 50); return S; }
  sGone(t, d, true); lift(140); setTop('結果', '銭湯 −117軒', fade(t, d * 0.62, d, 0.25), RED);
  return S;
}
function sYuBune(t, d) { // 銭湯は、年寄りの場所じゃなく、一人暮らしの部屋に足りない、大きな湯船だったのかもしれない
  reset(); lift(140); stand(ME, CX + 0.2, -1.3, 0.5); BAG.visible = false; ME.userData.head.rotation.y = 0.5;
  if (t > d * 0.45) say(ookina, t, d * 0.45, CX + 0.4, 2.35, -1.6, 1.15);
  const u = ease(clamp(t / d)); look(CX + lerp(0.2, 0.1, u), 1.8, lerp(3.4, 3.0, u), CX + 0.5, 1.4, -1.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); stand(ME, -0.65, -0.3, Math.PI); COUNTER.visible = true; COUNTER.userData.set('30日'); COUNTER.position.set(1.35, 2.2, -0.3); COUNTER.userData.size(0.75); SENTO_SIGN.visible = false; frontCam(0); return S; }

const NARR = { '一人暮らし': 'ひとりぐらし', '会社員': 'かいしゃいん', '大きな湯気': 'おおきなゆげ', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '十分': 'じゅうぶん', '疲れ': 'つかれ', '取れない': 'とれない', '1日目': 'いちにちめ', '大きな湯船': 'おおきなゆぶね', '思わず': 'おもわず', '出る': 'でる', '1週間後': 'いっしゅうかんご', '番台': 'ばんだい', '言われる': 'いわれる', '2週間後': 'にしゅうかんご', '帰り道': 'かえりみち', '勝手に': 'かってに', '銭湯': 'せんとう', '曲がる': 'まがる', '毎日': 'まいにち', '湯船': 'ゆぶね', '浸かる': 'つかる', '日本': 'にほん', '高齢者': 'こうれいしゃ', '約1.4万人': 'やく1.4まんにん', '3年': 'さんねん', '追いかけた': 'おいかけた', '研究': 'けんきゅう', '週2回以下': 'しゅうにかいいか', '介護': 'かいご', '必要': 'ひつよう', '約29%': 'やくにじゅうきゅうパーセント', '低かった': 'ひくかった', '観察研究': 'かんさつけんきゅう', '2,730軒': 'にせんななひゃくさんじゅっけん', '1年': 'いちねん', '117軒': 'ひゃくじゅうななけん', '減った': 'へった', '結果：': '結果、', '約3割': 'やくさんわり', '通える': 'かよえる', '消えた': 'きえた', '年寄り': 'としより', '場所': 'ばしょ', '部屋': 'へや', '足りない': 'たりない', '済ませてる': 'すませてる', 'シャワー5分': 'シャワーごふん' };
const P = planTimes([
  ['家ではシャワー5分の<br>一人暮らしの会社員が、', (t, d) => sKatamaru(t, 2 * d)],
  ['大きな湯気の前で固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['本人の言い分から。<br>シャワーで十分。', (t, d) => sIibun(t, 2 * d)],
  ['なのに、疲れが取れない。', (t, d) => sIibun(t + d, 2 * d)],
  ['1日目。大きな湯船で、<br>思わず あ〜 と声が出る。', sDay1],
  ['1週間後。番台の<br>おばあちゃんに、', (t, d) => sWeek(t, 2 * d)],
  ['おかえり と言われる。', (t, d) => sWeek(t + d, 2 * d)],
  ['2週間後。帰り道、<br>足が勝手に銭湯の方へ曲がる。', sTwoWeeks],
  ['でも、毎日湯船に浸かると、<br>体はどうなるのか。', sDou],
  ['日本の高齢者 約1.4万人を、<br>3年追いかけた研究がある。', sStudy],
  ['冬にほぼ毎日<br>湯船に浸かる人は、', (t, d) => sRisk(t, 3 * d)],
  ['週2回以下の人より、<br>介護が必要になるリスクが', (t, d) => sRisk(t + d, 3 * d)],
  ['約29%低かった。', (t, d) => sRisk(t + 2 * d, 3 * d)],
  ['ただし観察研究。そして<br>日本の銭湯は、2,730軒。', sKansatsu],
  ['たった1年で、117軒減った。', sGone],
  ['結果：毎日湯船の人は、', (t, d) => sKekka(t, 3 * d)],
  ['介護が必要になるリスクが<br>約3割低かった。', (t, d) => sKekka(t + d, 3 * d)],
  ['でも通える銭湯は、<br>1年で117軒消えた。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['銭湯は、<br>年寄りの場所じゃなく、', (t, d) => sYuBune(t, 3 * d)],
  ['一人暮らしの部屋に足りない、', (t, d) => sYuBune(t + d, 3 * d)],
  ['大きな湯船<br>だったのかもしれない。', (t, d) => sYuBune(t + 2 * d, 3 * d)],
  ['家のお風呂、<br>シャワーだけで済ませてる？', sAsk],
], { shot0, endCard, start: 3.3, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0726',
    v2: true,
    tt: 'main',
    hookLine: '仕事帰りの会社員が銭湯ののれんをくぐると、30日 のカウンターがカチッと回り出す。',
    series: '人体の限界',
    hookType: 'H1',
    cat: '体・健康',
    title: 'もしも1か月、仕事帰りに毎日銭湯へ通ったら？',
    titleHtml: 'もしも1か月、<br>仕事帰りに<br>毎日銭湯へ<br>通ったら？',
    mood: 'hopeful', seed: 726, hits: [TP, P.at(12, 0.2), P.at(15)], risers: [P.at(8)], impacts: [P.at(9, 1.6), P.at(13, 1.6), P.at(14, 0.4)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.6), 'bubble'], [P.at(7, 0.6), 'whoosh'], [P.at(14, 0.4), 'poof']],
    narr: NARR,
    ask: '家のお風呂、シャワーだけで済ませてる？',
    caption: 'もしも1か月、仕事帰りに毎日銭湯へ通ったら？\n\n家ではシャワー5分の一人暮らしの会社員が、大きな湯気の前で固まる。\n本人の言い分から。シャワーで十分。なのに、疲れが取れない。\n1日目。大きな湯船で、思わず あ〜 と声が出る。\n1週間後。番台のおばあちゃんに、おかえり と言われる。\n2週間後。帰り道、足が勝手に銭湯の方へ曲がる。\nでも、毎日湯船に浸かると、体はどうなるのか。\n日本の高齢者 約1.4万人を、3年追いかけた研究がある（2019年）。\n冬にほぼ毎日湯船に浸かる人は、週2回以下の人より、介護が必要になるリスクが約29%低かった。\nただし観察研究。そして日本の銭湯（一般公衆浴場）は、2,730軒（2024年度末）。\nたった1年で、117軒減った。\n\n結果：毎日湯船の人は、介護が必要になるリスクが約3割低かった。でも通える銭湯は、1年で117軒消えた。\n銭湯は、年寄りの場所じゃなく、一人暮らしの部屋に足りない、大きな湯船だったのかもしれない。\n\n家のお風呂、シャワーだけで済ませてる？ コメントで教えて。\n\n※熱すぎるお湯・お酒のあとの入浴は控えてください。研究は観察研究で、湯船に浸かる習慣とリスクの関係を見たものです。登場する人物・銭湯は架空です\n出典：Yagi ほか Journal of Epidemiology 2019年29巻12号（JAGES・65歳以上13,786人・3年追跡、冬の入浴 週7回以上 vs 週0〜2回 ハザード比0.71）／厚生労働省 令和6年度衛生行政報告例の概況（一般公衆浴場 2,730施設・前年度比117施設減）',
    hashtags: ['もしもラボ', 'もしも', '銭湯', 'お風呂', '人体の限界'],
    endStats: [['ほぼ毎日湯船の人の介護リスク', '約29%低い', '2019年・JAGES（観察研究）'], ['日本の銭湯', '2,730軒', '2024年度末・厚生労働省'], ['1年で減った銭湯', '117軒', '2023→2024年度']],
    sources: '出典：Yagi ほか J Epidemiol 2019／厚生労働省 令和6年度衛生行政報告例<br>※観察研究。熱すぎるお湯・お酒のあとの入浴はNG',
  },
});
