import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit, makeSuit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeSteam, makeGlass, makeTub } from '../scenes/home.js';

// もしもサウナ自慢の部長が、1か月毎日入ったら？（人体の限界・台本 S141・作り直し 0695）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。0695 もしも毎日サウナに入るのを1か月続けたら？ の冒頭を作り直し（plan/remake.md の15）。
// 月曜の朝礼で 週末ととのった と言いかけた部長の頭に 30日 のカウンターが出る回（強い側が痛い目を見る型）。研究・結果の数字は元の回のまま
// 部長は笑う程度（体や年齢をばかにしない）
// 数字（一次資料で確認・2026/11/25。PubMed の抄録 25705824）：Laukkanen T ほか JAMA Intern Med 2015;175(4):542-548（KIHD 研究）
//  フィンランド東部の42〜60歳の男性2,315人・追跡の中央値20.7年。週1回と比べて 週4〜7回は 心臓突然死 HR 0.37（63%低い）、週2〜3回は 0.78
//  観察研究なので 防げる とは言わない（画面に 観察研究 と出す）。お酒のあと・水分なしのサウナはしないで の注意を字幕と札で出す
// 裸の絵は出さない（サウナ着とタオル）。8分は筋の中の時間

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#2a2630', ground: '#5a4a3a' }); hemi.intensity = 1.25;
const SAUNER = makeMan({ shirt: '#e8dcc8', pants: '#e8dcc8', hair: '#9a9a9a', bald: true }); S.add(SAUNER); // サウナ自慢の部長（サウナ着）
const BUCHO = makeSuit({ old: true, bald: true, jacket: '#3a3f4e' }); S.add(BUCHO); const sweatBu = makeSweat(); BUCHO.userData.head.add(sweatBu);
const BUKA = [makeSuit({ jacket: '#2e3442' }), makeSuit({ woman: true }), makeSuit({ jacket: '#4a4a5a', tie: '#3a8a5a' }), makeSuit({ woman: true, jacket: '#5a4a5a' })]; BUKA.forEach(p => S.add(p));
const TOWEL_H = box(0.46, 0.1, 0.44, mat('#f4f4f2')); TOWEL_H.position.y = 0.52; SAUNER.userData.head.add(TOWEL_H);
const RED_FACE = box(0.41, 0.43, 0.39, new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: 0, depthWrite: false })); RED_FACE.position.y = 0.24; SAUNER.userData.head.add(RED_FACE);
const sweat = makeSweat(); SAUNER.userData.head.add(sweat);
const TOWEL = box(0.5, 0.08, 0.14, mat('#f4f4f2')); S.add(TOWEL);
function redFace(k) { RED_FACE.material.opacity = 0.45 * k; RED_FACE.visible = k > 0.01; }

// ---------- A：サウナ室（原点） ----------
const WOOD = '#b07a48', WOOD2 = '#c88a52';
const roomA = room({ x: 0, w: 7, d: 6, h: 3.0, wall: '#a8703e', floor: '#7a5434', left: true, right: true });
for (let i = 0; i < 3; i++) { const b = box(5.6, 0.12, 0.7, mat(WOOD2)); b.position.set(0, 0.45 + i * 0.45, -2.6 + i * 0.0 - (2 - i) * 0.0); b.position.z = -0.9 - i * 0.7; S.add(b); const r = box(5.6, 0.45 + i * 0.45, 0.06, mat(WOOD)); r.position.set(0, (0.45 + i * 0.45) / 2, -0.55 - i * 0.7); S.add(r); }
const STOVE = new THREE.Group(); { const b = box(0.8, 0.9, 0.6, mat('#3a3e48')); b.position.y = 0.45; STOVE.add(b); const r = rng(3); for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), mat(['#6a6a6a', '#8a8580', '#5a5550'][i % 3], { flatShading: true })); s.position.set((r() - 0.5) * 0.6, 0.95 + r() * 0.1, (r() - 0.5) * 0.4); STOVE.add(s); } const glow = box(0.6, 0.06, 0.02, new THREE.MeshBasicMaterial({ color: '#ff7a2a' })); glow.position.set(0, 0.3, 0.31); STOVE.add(glow); } STOVE.position.set(2.6, 0, -0.6); S.add(STOVE);
const DOOR = new THREE.Group(); { const d = box(1.0, 2.1, 0.08, mat(WOOD2)); d.position.set(0.5, 1.05, 0); DOOR.add(d); const w = box(0.4, 0.8, 0.09, new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); w.position.set(0.5, 1.4, 0); DOOR.add(w); } S.add(DOOR);
const STEAM = makeSteam(24, { w: 4, d: 2, h: 2.4 }); STEAM.position.set(0, 0.6, -1.4); S.add(STEAM);
const LAMP = new THREE.PointLight(0xffb070, 3, 8); LAMP.position.set(0, 2.6, -0.5); S.add(LAMP);
const COUNTER = label('30日', { w: 512, size: 140, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(COUNTER);
const totonou = label('週1回で ととのってる', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(totonou);
const TIMER = label('8:00', { w: 512, size: 140, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.65 }); S.add(TIMER);
const genkai = label('限界', { w: 384, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.5 }); S.add(genkai);

// ---------- B：休憩所（x=50） ----------
const BX = 50;
const roomB = room({ x: BX, w: 8, d: 6, h: 3.0, wall: '#d8e4ea', floor: '#a8b8c0' });
const BATH = makeTub(); BATH.position.set(BX - 1.6, 0, -2.0); BATH.userData.setWater(1); BATH.userData.water.material = new THREE.MeshLambertMaterial({ color: '#8ad0f0' }); S.add(BATH);
const BEER = makeGlass({ beer: true, h: 0.22 }); S.add(BEER);
const WATER = makeGlass({ beer: false, h: 0.22 }); S.add(WATER);
const mizu = label('ビール → 水', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(mizu);

// ---------- C：帰り道（x=100） ----------
const CX = 100;
flat(30, 8, '#4a4a52', CX, 0);
const SHOP = new THREE.Group(); { const w = box(4, 3.2, 0.3, mat('#5a4a3a')); w.position.y = 1.6; SHOP.add(w); const d = box(1.2, 2.0, 0.05, new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); d.position.set(0, 1.0, 0.17); SHOP.add(d); const n = box(2.6, 0.5, 0.06, new THREE.MeshBasicMaterial({ color: '#ff9a3a' })); n.position.set(0, 2.7, 0.18); SHOP.add(n); } SHOP.position.set(CX + 0.5, 0, -2.5); S.add(SHOP);
const SIGN = label('サウナ もしも湯', { w: 900, size: 100, color: '#fff', bg: 'rgba(200,90,30,.98)', sx: 1.4 }); SIGN.position.set(CX + 0.5, 2.75, -2.2); S.add(SIGN);
const katte = label('足が 勝手に', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(katte);
const POLE = []; for (let i = 0; i < 3; i++) { const p = box(0.1, 3.2, 0.1, mat('#6a6e78')); p.position.set(CX - 5 + i * 5, 1.6, 0.6); S.add(p); const l = box(0.4, 0.1, 0.4, new THREE.MeshBasicMaterial({ color: '#fff4c8' })); l.position.set(CX - 5 + i * 5, 3.2, 0.6); S.add(l); }

// ---------- D：研究（x=150） ----------
const DX = 150;
flat(30, 20, '#3a3448', DX, -2);
const BACKD = box(16, 7, 0.2, mat('#2c2838')); BACKD.position.set(DX, 3.5, -10); S.add(BACKD);
const CROWD = []; { const r = rng(9); for (let i = 0; i < 48; i++) { const p = makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#d97a3a', '#59606e', '#c94f7c', '#8a7a5a'][i % 6], hair: ['#9a9a9a', '#4a3426', '#1d1a19'][i % 3], bald: r() < 0.3 }); p.position.set(DX - 5.5 + (i % 8) * 1.55 + (r() - 0.5) * 0.3, 0, -1 - Math.floor(i / 8) * 1.5); p.rotation.y = (r() - 0.5) * 0.5; S.add(p); CROWD.push(p); } }
const HEART = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshLambertMaterial({ color: '#c8323a', emissive: 0x400000 })); S.add(HEART);
// ---------- E：月曜の朝礼（x=200） ----------
const EX = 200;
room({ x: EX, w: 9, d: 6, h: 3.2, wall: '#dfe3e8', floor: '#8a8f99' });
const WB = box(2.6, 1.2, 0.06, mat('#f8f8f6')); WB.position.set(EX - 0.2, 1.6, -2.85); S.add(WB);
const totonotta = label('週末 ととのっ…', { w: 900, size: 100, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.0 }); S.add(totonotta);
const katamaruE = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaruE);
const getsuyou = label('月曜は ととのい の話', { w: 1000, size: 92, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.15 }); S.add(getsuyou);
const nashi = label('サウナの話 なし', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(nashi);
const maeoki = label('朝礼の 前置き', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.9 }); S.add(maeoki);
const kansatsu = label('観察研究', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.8 }); S.add(kansatsu);
const BARS = []; [['週1回', '#9aa0aa'], ['週4〜7回', '#5ab07a']].forEach(([n, c], i) => { const b = box(0.6, 1, 0.4, mat(c)); S.add(b); const l = label(n, { w: 512, size: 100, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.75 }); S.add(l); BARS.push({ b, l }); });
const dame = label('お酒のあと・水分なし NG', { w: 1024, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(dame);
const betsu = label('週末の自慢とは 別の話', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(betsu);

const LABELS = [COUNTER, totonou, TIMER, genkai, mizu, katte, kansatsu, dame, betsu, totonotta, katamaruE, getsuyou, nashi, maeoki, ...BARS.map(x => x.l)];
function reset() {
  const p = SAUNER; p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); p.visible = true;
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); redFace(0); TOWEL.visible = false; TOWEL_H.visible = true;
  [BUCHO, ...BUKA].forEach(q => { poseClear(q); q.rotation.set(0, 0, 0); q.position.set(0, -50, 0); q.visible = false; }); sweatBu.userData.set(0);
  STEAM.userData.set(0); DOOR.rotation.y = 0; BEER.visible = false; WATER.visible = false; CROWD.forEach(c => c.visible = false); HEART.visible = false; BARS.forEach(x => x.b.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
DOOR.position.set(-0.9, 0, 1.2);
function benchSit(row = 1) { SAUNER.position.set(-0.1, 0, -0.95 - row * 0.7); poseSit(SAUNER); SAUNER.position.y = 0.51 + row * 0.45 - 0.78; }
function chorei(gest = 1, t = 0) { BUCHO.visible = true; BUCHO.position.set(EX - 0.2, 0, -1.6); BUCHO.userData.arms[1].rotation.set(-0.4 * gest, 0, 0.5 * gest + Math.sin(t * 5) * 0.15 * gest);
  BUKA.forEach((p, i) => { const sx = i < 2 ? -1 : 1, j = i % 2; p.visible = true; p.position.set(EX - 0.2 + sx * (1.25 + j * 0.75), 0, -0.6 + j * 0.5); p.rotation.y = Math.PI + sx * 0.55; }); }
function choreiCam(u = 0) { look(EX + lerp(0.0, -0.1, u), lerp(1.6, 1.55, u), lerp(4.6, 4.3, u), EX - 0.2, 1.6, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：月曜の朝礼で 週末ととのった と言いかけた部長の頭の上に、30日 のカウンターがパッと出る
  reset(); lift(0); SAUNER.visible = false; chorei(1, t); say(totonotta, t, -1, EX - 0.2, 1.0, -1.0, 1.0);
  if (t > TP) { COUNTER.visible = true; COUNTER.userData.set(Math.min(30, 1 + Math.floor((t - TP) * 18)) + '日'); say(COUNTER, t, TP, EX + 0.55, 1.95, -1.4, 0.55); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; }
  choreiCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // サウナの話を聞かされ続けてきた部下たちが、目を合わせて固まる
  reset(); lift(140); SAUNER.visible = false; chorei(0, t); COUNTER.visible = true; COUNTER.userData.set('30日'); COUNTER.position.set(EX + 0.55, 1.95, -1.4); COUNTER.userData.size(0.5);
  BUKA[1].userData.head.rotation.y = -0.6; BUKA[2].userData.head.rotation.y = 0.6; sweatBu.userData.set(1, t);
  if (t > d * 0.45) say(katamaruE, t, d * 0.45, EX - 1.6, 2.2, -0.3, 0.38);
  const u = ease(clamp(t / d)); look(EX + lerp(2.2, 1.9, u), 1.7, lerp(2.6, 2.3, u), EX - 1.0, 1.4, -0.5, 50);
  return S;
}
function sIibun(t, d) { // 部下たちの不満から。月曜の朝は、いつも部長の ととのい の話から始まる
  reset(); lift(140); SAUNER.visible = false; chorei(1, t); say(getsuyou, t, 0.4, EX - 0.2, 2.45, -1.4, 1.1);
  choreiCam(0.5);
  return S;
}
function sGenkai(t, d) { // 1日目。仕事帰りのサウナで、8分で限界
  reset(); lift(120); benchSit(1); STEAM.userData.set(1, t); const k = clamp(t / (d * 0.7)); redFace(k); SAUNER.userData.head.rotation.x = 0.4 * k; SAUNER.userData.arms.forEach(a => a.rotation.set(-0.5 * k, 0, 0)); sweat.userData.set(k, t);
  TIMER.visible = true; const sec = Math.floor(k * 480); TIMER.userData.set(Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0')); TIMER.position.set(1.4, 2.35, -2.5); TIMER.userData.size(0.55);
  if (k >= 1) say(genkai, t, d * 0.7, -0.1, 2.55, -1.6, 0.45);
  setHud('サウナ自慢の部長', '1日目', 1);
  look(0.4, 1.95, 1.8, -0.1, 1.6, -1.5, 50);
  return S;
}
function sMizu(t, d) { // 1週間後。水風呂のあとのビールを、水に変える
  reset(); lift(120); SAUNER.position.set(BX + 0.3, 0, -0.9); SAUNER.rotation.y = -0.3; TOWEL_H.visible = false; SAUNER.userData.arms[1].rotation.set(-1.6, 0, 0.3);
  const k = clamp((t - d * 0.4) / 0.4); SAUNER.updateMatrixWorld(); const v = new THREE.Vector3(0, -0.66, 0.05); SAUNER.userData.arms[1].localToWorld(v);
  BEER.visible = k < 0.5; BEER.position.copy(v); BEER.scale.setScalar(1.6 * (1 - k)); WATER.visible = k >= 0.5; WATER.position.copy(v); WATER.scale.setScalar(1.6 * k);
  if (t > d * 0.5) say(mizu, t, d * 0.5, BX + 0.2, 2.15, -0.9, 0.8);
  setHud('サウナ自慢の部長', '1週間後', 1);
  look(BX + 0.6, 1.7, 1.6, BX + 0.1, 1.4, -1.1, 50);
  return S;
}
function sNoTalk(t, d) { // 2週間後。月曜の朝礼で、サウナの話が出てこない
  reset(); lift(140); SAUNER.visible = false; chorei(0.3, t); BUCHO.userData.head.rotation.x = 0.15;
  if (t > d * 0.4) say(nashi, t, d * 0.4, EX - 0.2, 2.45, -1.4, 0.95);
  setHud('サウナ自慢の部長', '2週間後', 1);
  choreiCam(0.6);
  return S;
}
function sNani(t, d) { // でも、毎日入ると、体に何が起きるのか
  reset(); lift(120); benchSit(1); STEAM.userData.set(1, t); redFace(0.2); SAUNER.userData.head.rotation.x = -0.2;
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.8, u), lerp(1.95, 2.3, u), lerp(1.8, 3.2, u), -0.1, 1.5, -1.5, 50);
  return S;
}
function crowdCam(u = 0) { look(DX + lerp(0.5, 0.0, u), lerp(4.2, 3.6, u), lerp(7.5, 6.5, u), DX, 0.8, -3.5, 50); }
function sStudy(t, d) { // フィンランドの中年の男性2,315人を、約20年追いかけた研究がある
  reset(); lift(160); SAUNER.visible = false; CROWD.forEach((p, i) => { p.visible = t > 0.2 + (i % 8) * 0.06; });
  setTop('サウナの研究（2015年）', Math.round(2315 * easeOut(clamp((t - 0.3) / 1.4))).toLocaleString('ja-JP') + '人', fade(t, 0.3, d, 0.25), BLUE); setHud('フィンランド・42〜60歳', '約20年', 1);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function barCam() { look(DX + 0.1, 1.3, 6.2, DX, 0.45, 0.6, 50); }
function bars(h4) { BARS.forEach((x, i) => { const h = i ? h4 : 1.6; x.b.visible = true; x.b.scale.y = Math.max(0.01, h); x.b.position.set(DX - 0.55 + i * 1.1, h / 2, 0.6); x.l.visible = true; x.l.position.set(DX - 0.55 + i * 1.1, h + 0.25, 0.7); x.l.userData.size(0.5); }); }
function sHikaku(t, d) { // サウナが週4〜7回の人は、週1回の人より
  reset(); lift(120); SAUNER.visible = false; bars(1.6 * easeOut(clamp((t - 0.3) / 0.6)));
  setHud('心臓突然死のリスク', '週1回と比べる', 1);
  barCam();
  return S;
}
function sSixtyThree(t, d) { // 心臓が急に止まって亡くなるリスクが、63%低かった
  reset(); lift(120); SAUNER.visible = false; bars(lerp(1.6, 1.6 * 0.37, easeOut(clamp((t - 0.3) / 1.2))));
  setTop('週4〜7回の人の 心臓突然死のリスク（2015年）', '−' + Math.round(63 * easeOut(clamp((t - 0.3) / 1.2))) + '%', fade(t, 0.3, d, 0.25), GREEN); setHud('Laukkanen ほか', 'JAMA 2015年', 1);
  if (t > d * 0.55) say(kansatsu, t, d * 0.55, DX, 2.3, 0.6, 0.55);
  barCam();
  return S;
}
function sDame(t, d) { // ただし観察研究。お酒のあと・水分なしのサウナは絶対にしないで
  reset(); lift(120); SAUNER.position.set(BX + 0.3, 0, -0.9); SAUNER.rotation.y = -0.2; TOWEL_H.visible = false; SAUNER.userData.arms[1].rotation.set(-1.6, 0, 0.3);
  SAUNER.updateMatrixWorld(); const v = new THREE.Vector3(0, -0.66, 0.05); SAUNER.userData.arms[1].localToWorld(v); WATER.visible = true; WATER.position.copy(v); WATER.scale.setScalar(1.6);
  say(dame, t, 0.3, BX + 0.3, 2.05, -0.9, 1.0); setHud('観察研究', '関連が分かっただけ', 1);
  look(BX + 0.6, 1.75, 2.5, BX + 0.2, 1.5, -1.1, 50);
  return S;
}
function sKekka(t, d) { // 結果：毎日入る人ほど、心臓で亡くなる人が少なかった。週1回のととのいとは、別の話だった
  reset(); lift(120); SAUNER.visible = false; bars(1.6 * 0.37); HEART.visible = true; HEART.position.set(DX + 0.55, 1.25, 0.6); HEART.scale.setScalar(0.5 * (1 + Math.max(0, Math.sin(t * 6)) * 0.1));
  if (t > d * 0.6) say(betsu, t, d * 0.6, DX, 2.35, 0.6, 1.1);
  setTop('結果', '毎日ほど 少なかった', fade(t, 0.3, d, 0.25), GOLD);
  barCam();
  return S;
}
function sMaeoki(t, d) { // ととのった自慢は、健康の話じゃなく、月曜の朝礼を、自分の話で始めるための、前置きだったのかもしれない
  reset(); lift(140); SAUNER.visible = false; chorei(1, t);
  if (t > d * 0.45) say(maeoki, t, d * 0.45, EX - 0.2, 2.45, -1.4, 0.9);
  choreiCam(0.3 + 0.7 * ease(clamp(t / d)));
  return S;
}
function sAsk(t) { reset(); lift(0); SAUNER.visible = false; chorei(1, t); COUNTER.visible = true; COUNTER.userData.set('30日'); COUNTER.position.set(EX + 0.55, 1.95, -1.4); COUNTER.userData.size(0.55); choreiCam(0); return S; }

const NARR = { '聞かされ続けてきた': 'きかされつづけてきた', '部下': 'ぶか', '目を合わせて': 'めをあわせて', '不満': 'ふまん', '月曜': 'げつよう', '朝': 'あさ', '部長': 'ぶちょう', '話': 'はなし', '始まる': 'はじまる', '2週間後': 'にしゅうかんご', '朝礼': 'ちょうれい', '出てこない': 'でてこない', '自慢': 'じまん', '健康': 'けんこう', '自分': 'じぶん', '始める': 'はじめる', '前置き': 'まえおき', '続けられる': 'つづけられる', '週末': 'しゅうまつ', '握った': 'にぎった', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '週1回': 'しゅういっかい', '1日目': 'いちにちめ', '仕事帰り': 'しごとがえり', '8分': 'はっぷん', '限界': 'げんかい', '1週間後': 'いっしゅうかんご', '水風呂': 'みずぶろ', '水に': 'みずに', '変える': 'かえる', '1か月後': 'いっかげつご', '帰り道': 'かえりみち', '足': 'あし', '勝手に': 'かってに', '止まる': 'とまる', '毎日': 'まいにち', '入ると': 'はいると', '体': 'からだ', '何が': 'なにが', '起きる': 'おきる', '中年': 'ちゅうねん', '男性': 'だんせい', '2,315人': 'にせんさんびゃくじゅうごにん', '約20年': 'やくにじゅうねん', '研究': 'けんきゅう', '週4〜7回': 'しゅうよんからななかい', '心臓': 'しんぞう', '急に': 'きゅうに', '亡くなる': 'なくなる', '63%': '63パーセント', '低かった': 'ひくかった', '観察研究': 'かんさつけんきゅう', '水分': 'すいぶん', '絶対に': 'ぜったいに', '結果：': '結果、', '入る人': 'はいるひと', '少なかった': 'すくなかった', '別の話': 'べつのはなし', '習慣': 'しゅうかん', '週に': 'しゅうに', '何回': 'なんかい', '行く': 'いく' };
const P = planTimes([
  ['サウナの話を聞かされ<br>続けてきた部下たちが、', (t, d) => sKatamaru(t, 2 * d)],
  ['目を合わせて固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['部下たちの不満から。<br>月曜の朝は、いつも', (t, d) => sIibun(t, 2 * d)],
  ['部長の ととのい の話から<br>始まる。', (t, d) => sIibun(t + d, 2 * d)],
  ['1日目。仕事帰りのサウナで、<br>部長は8分で限界。', sGenkai],
  ['1週間後。水風呂のあとの<br>ビールを、水に変える。', sMizu],
  ['2週間後。月曜の朝礼で、<br>サウナの話が出てこない。', sNoTalk],
  ['でも、毎日入ると、<br>体に何が起きるのか。', sNani],
  ['フィンランドの中年の男性<br>2,315人を、', (t, d) => sStudy(t, 2 * d)],
  ['約20年追いかけた<br>研究がある。', (t, d) => sStudy(t + d, 2 * d)],
  ['サウナが週4〜7回の人は、<br>週1回の人より、', sHikaku],
  ['心臓が急に止まって亡くなる<br>リスクが、63%低かった。', sSixtyThree],
  ['ただし観察研究。お酒のあと・<br>水分なしのサウナは', (t, d) => sDame(t, 2 * d)],
  ['絶対にしないで。', (t, d) => sDame(t + d, 2 * d)],
  ['結果：毎日入る人ほど、心臓で<br>亡くなる人が少なかった。', (t, d) => sKekka(t, 2 * d)],
  ['週末のととのい自慢とは、<br>別の話だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['ととのった自慢は、<br>健康の話じゃなく、', (t, d) => sMaeoki(t, 3 * d)],
  ['月曜の朝礼を、<br>自分の話で始めるための、', (t, d) => sMaeoki(t + d, 3 * d)],
  ['前置きだったのかもしれない。', (t, d) => sMaeoki(t + 2 * d, 3 * d)],
  ['サウナ、週に何回なら<br>続けられる？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0747',
    v2: true,
    trial: true,
    remakeOf: '0695',
    tt: 'main',
    hookLine: '月曜の朝礼で 週末ととのった と言いかけた部長の頭の上に、30日 のカウンターがパッと出る。',
    series: '人体の限界',
    hookType: 'H1',
    cat: '体・健康',
    title: 'もしもサウナ自慢の部長が、1か月毎日入ったら？',
    titleHtml: 'もしもサウナ自慢<br>の部長が、1か月<br>毎日入ったら？',
    mood: 'hopeful', seed: 747, hits: [TP, P.at(14), P.at(18)], risers: [P.at(7)], impacts: [P.at(8, 1.0), P.at(11, 0.4)],
    sfx: [[TP, 'alarm'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.4), 'meter', 0.4], [P.at(5, 1.0), 'bubble'], [P.at(12, 0.3), 'alarm']],
    narr: NARR,
    ask: 'サウナ、週に何回なら続けられる？',
    caption: 'もしもサウナ自慢の部長が、1か月毎日入ったら？\n\nサウナの話を聞かされ続けてきた部下たちが、目を合わせて固まる。\n部下たちの不満から。月曜の朝は、いつも部長の ととのい の話から始まる。\n1日目。仕事帰りのサウナで、部長は8分で限界。\n1週間後。水風呂のあとのビールを、水に変える。\n2週間後。月曜の朝礼で、サウナの話が出てこない。\nでも、毎日入ると、体に何が起きるのか。\nフィンランドの中年の男性2,315人を、約20年追いかけた研究がある。\nサウナが週4〜7回の人は、週1回の人より、心臓が急に止まって亡くなるリスクが、63%低かった。\nただし観察研究。お酒のあと・水分なしのサウナは絶対にしないで。持病のある人は医師に相談を。\n\n結果：毎日入る人ほど、心臓で亡くなる人が少なかった。週末のととのい自慢とは、別の話だった。\nととのった自慢は、健康の話じゃなく、月曜の朝礼を、自分の話で始めるための、前置きだったのかもしれない。\n\nサウナ、週に何回なら続けられる？ コメントで教えて。\n\n※登場する人物は架空です\n出典：Laukkanen ほか JAMA Internal Medicine（2015年）フィンランド KIHD 研究（42〜60歳の男性2,315人・追跡の中央値20.7年）',
    hashtags: ['もしもラボ', 'もしも', 'サウナ', 'ととのう', '人体の限界'],
    endStats: [['サウナの研究', '男性2,315人', 'フィンランド・約20年'], ['週4〜7回の人の心臓突然死', '−63%', '観察研究・2015年'], ['お酒のあと・水分なし', '絶対にしない', '注意']],
    sources: '出典：Laukkanen ほか JAMA Internal Medicine（2015年）',
  },
});
