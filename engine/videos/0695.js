import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeSteam, makeGlass, makeTub } from '../scenes/home.js';

// もしも毎日サウナに入るのを1か月続けたら？（人体の限界・台本 S93）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/16 の解析の種（0671 湯船と同じ お風呂・温まる習慣を毎日にしたら）
// 数字（一次資料で確認・2026/11/17。PubMed の抄録 25705824）：Laukkanen T ほか JAMA Intern Med 2015;175(4):542-548（KIHD 研究）
//  フィンランド東部の42〜60歳の男性2,315人・追跡の中央値20.7年。週1回と比べて 週4〜7回は 心臓突然死 HR 0.37（63%低い）、週2〜3回は 0.78
//  観察研究なので 防げる とは言わない（画面に 観察研究 と出す）。お酒のあと・水分なしのサウナはしないで の注意を字幕と札で出す
// 裸の絵は出さない（サウナ着とタオル）。8分は筋の中の時間

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#2a2630', ground: '#5a4a3a' }); hemi.intensity = 1.25;
const SAUNER = makeMan({ shirt: '#e8dcc8', pants: '#e8dcc8', hair: '#2c2421' }); S.add(SAUNER); // 週末だけのサウナー（サウナ着）
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
const kansatsu = label('観察研究', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.8 }); S.add(kansatsu);
const BARS = []; [['週1回', '#9aa0aa'], ['週4〜7回', '#5ab07a']].forEach(([n, c], i) => { const b = box(0.6, 1, 0.4, mat(c)); S.add(b); const l = label(n, { w: 512, size: 100, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.75 }); S.add(l); BARS.push({ b, l }); });
const dame = label('お酒のあと・水分なし NG', { w: 1024, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(dame);
const shuukan = label('毎日の 帰り道の習慣', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(shuukan);
const betsu = label('週1回とは 別の話', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(betsu);

const LABELS = [COUNTER, totonou, TIMER, genkai, mizu, katte, kansatsu, dame, shuukan, betsu, ...BARS.map(x => x.l)];
function reset() {
  const p = SAUNER; p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); p.visible = true;
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); redFace(0); TOWEL.visible = false; TOWEL_H.visible = true;
  STEAM.userData.set(0); DOOR.rotation.y = 0; BEER.visible = false; WATER.visible = false; CROWD.forEach(c => c.visible = false); HEART.visible = false; BARS.forEach(x => x.b.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
DOOR.position.set(-0.9, 0, 1.2);
function doorCam(u = 0) { look(lerp(0.25, 0.2, u), 1.75, lerp(3.0, 2.8, u), 0.1, 1.75, -0.9, 50); }
function shot0(t) { // 0秒＝サムネ：サウナ室の扉が開いて、30日 のカウンターが回り出す
  reset(); lift(0); benchSit(0); redFace(0.3);
  STEAM.userData.set(1, t); DOOR.rotation.y = -1.4 * easeOut(clamp((t - 0.05) / 0.3));
  if (t > TP) { COUNTER.visible = true; COUNTER.userData.set(Math.min(30, 1 + Math.floor((t - TP) * 18)) + '日'); say(COUNTER, t, TP, 0.55, 1.3, -0.4, 0.5); }
  doorCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function benchSit(row = 1) { SAUNER.position.set(-0.1, 0, -0.95 - row * 0.7); poseSit(SAUNER); SAUNER.position.y = 0.51 + row * 0.45 - 0.78; }
function sKatamaru(t, d) { // 週末だけのサウナーが、タオルを握ったまま固まる
  reset(); lift(120); benchSit(0); SAUNER.userData.arms.forEach((a, i) => a.rotation.set(-1.0, 0, i ? 0.3 : -0.3)); SAUNER.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.88, 0.45); SAUNER.localToWorld(v); TOWEL.visible = true; TOWEL.position.copy(v);
  STEAM.userData.set(1, t); redFace(0.5); if (t > d * 0.4) sweat.userData.set(1, t);
  look(0.3, 1.5, 1.6, -0.1, 1.3, -0.9, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。週1回で、もうととのってる
  reset(); lift(120); benchSit(0); SAUNER.userData.arms[1].rotation.set(-2.6, 0, 0.2); STEAM.userData.set(1, t); redFace(0.4);
  if (t > 0.4) say(totonou, t, 0.4, -0.1, 2.35, -0.9, 1.2);
  look(0.3, 1.6, 2.2, -0.1, 1.5, -0.9, 50);
  return S;
}
function sGenkai(t, d) { // 1日目。仕事帰りのサウナで、8分で限界
  reset(); lift(120); benchSit(1); STEAM.userData.set(1, t); const k = clamp(t / (d * 0.7)); redFace(k); SAUNER.userData.head.rotation.x = 0.4 * k; SAUNER.userData.arms.forEach(a => a.rotation.set(-0.5 * k, 0, 0)); sweat.userData.set(k, t);
  TIMER.visible = true; const sec = Math.floor(k * 480); TIMER.userData.set(Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0')); TIMER.position.set(1.4, 2.35, -2.5); TIMER.userData.size(0.55);
  if (k >= 1) say(genkai, t, d * 0.7, -0.1, 2.55, -1.6, 0.45);
  setHud('毎日サウナ', '1日目', 1);
  look(0.4, 1.95, 1.8, -0.1, 1.6, -1.5, 50);
  return S;
}
function sMizu(t, d) { // 1週間後。水風呂のあとのビールを、水に変える
  reset(); lift(120); SAUNER.position.set(BX + 0.3, 0, -0.9); SAUNER.rotation.y = -0.3; TOWEL_H.visible = false; SAUNER.userData.arms[1].rotation.set(-1.6, 0, 0.3);
  const k = clamp((t - d * 0.4) / 0.4); SAUNER.updateMatrixWorld(); const v = new THREE.Vector3(0, -0.66, 0.05); SAUNER.userData.arms[1].localToWorld(v);
  BEER.visible = k < 0.5; BEER.position.copy(v); BEER.scale.setScalar(1.6 * (1 - k)); WATER.visible = k >= 0.5; WATER.position.copy(v); WATER.scale.setScalar(1.6 * k);
  if (t > d * 0.5) say(mizu, t, d * 0.5, BX + 0.2, 2.15, -0.9, 0.8);
  setHud('毎日サウナ', '1週間後', 1);
  look(BX + 0.6, 1.7, 1.6, BX + 0.1, 1.4, -1.1, 50);
  return S;
}
function sAshi(t, d) { // 1か月後。帰り道、サウナの前で足が勝手に止まる
  reset(); lift(120); TOWEL_H.visible = false; SAUNER.shirt; const k = clamp(t / (d * 0.5)); SAUNER.position.set(CX + lerp(-3, 0.3, k), 0, -0.6); SAUNER.rotation.y = k < 1 ? Math.PI / 2 : Math.PI * 0.9; if (k < 1) poseWalk(SAUNER, t * 7.5, 0.9);
  if (t > d * 0.55) say(katte, t, d * 0.55, CX + 0.3, 2.3, -0.6, 0.8);
  setHud('毎日サウナ', '1か月後', 1);
  look(CX + 0.4, 2.1, 4.4, CX + 0.2, 1.4, -1.2, 50);
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
function sShuukan(t, d) { // ととのう は、週末のごほうびじゃなく、毎日の帰り道の習慣だったのかもしれない
  reset(); lift(120); TOWEL_H.visible = false; SAUNER.position.set(CX + 0.4, 0, -1.2); SAUNER.rotation.y = Math.PI; const k = clamp((t - d * 0.3) / (d * 0.5)); SAUNER.position.z = lerp(-0.6, -2.0, k); poseWalk(SAUNER, t * 6, 0.6 * (1 - Math.floor(k)));
  if (t > d * 0.45) say(shuukan, t, d * 0.45, CX + 0.4, 2.2, -1.0, 1.1);
  look(CX + 0.8, 2.0, 3.8, CX + 0.4, 1.5, -1.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); benchSit(0); redFace(0.3); STEAM.userData.set(1, t); DOOR.rotation.y = -1.4; COUNTER.visible = true; COUNTER.userData.set('30日'); COUNTER.position.set(0.55, 1.3, -0.4); COUNTER.userData.size(0.5); doorCam(0); return S; }

const NARR = { '週末': 'しゅうまつ', '握った': 'にぎった', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '週1回': 'しゅういっかい', '1日目': 'いちにちめ', '仕事帰り': 'しごとがえり', '8分': 'はっぷん', '限界': 'げんかい', '1週間後': 'いっしゅうかんご', '水風呂': 'みずぶろ', '水に': 'みずに', '変える': 'かえる', '1か月後': 'いっかげつご', '帰り道': 'かえりみち', '足': 'あし', '勝手に': 'かってに', '止まる': 'とまる', '毎日': 'まいにち', '入ると': 'はいると', '体': 'からだ', '何が': 'なにが', '起きる': 'おきる', '中年': 'ちゅうねん', '男性': 'だんせい', '2,315人': 'にせんさんびゃくじゅうごにん', '約20年': 'やくにじゅうねん', '研究': 'けんきゅう', '週4〜7回': 'しゅうよんからななかい', '心臓': 'しんぞう', '急に': 'きゅうに', '亡くなる': 'なくなる', '63%': '63パーセント', '低かった': 'ひくかった', '観察研究': 'かんさつけんきゅう', '水分': 'すいぶん', '絶対に': 'ぜったいに', '結果：': '結果、', '入る人': 'はいるひと', '少なかった': 'すくなかった', '別の話': 'べつのはなし', '習慣': 'しゅうかん', '週に': 'しゅうに', '何回': 'なんかい', '行く': 'いく' };
const P = planTimes([
  ['週末だけのサウナーが、<br>タオルを握ったまま固まる。', sKatamaru],
  ['本人の言い分から。<br>週1回で、もうととのってる。', sIibun],
  ['1日目。仕事帰りのサウナで、<br>8分で限界。', sGenkai],
  ['1週間後。水風呂のあとの<br>ビールを、水に変える。', sMizu],
  ['1か月後。帰り道、サウナの前で<br>足が勝手に止まる。', sAshi],
  ['でも、毎日入ると、<br>体に何が起きるのか。', sNani],
  ['フィンランドの中年の男性<br>2,315人を、', (t, d) => sStudy(t, 2 * d)],
  ['約20年追いかけた<br>研究がある。', (t, d) => sStudy(t + d, 2 * d)],
  ['サウナが週4〜7回の人は、<br>週1回の人より、', sHikaku],
  ['心臓が急に止まって亡くなる<br>リスクが、63%低かった。', sSixtyThree],
  ['ただし観察研究。お酒のあと・<br>水分なしのサウナは', (t, d) => sDame(t, 2 * d)],
  ['絶対にしないで。', (t, d) => sDame(t + d, 2 * d)],
  ['結果：毎日入る人ほど、心臓で<br>亡くなる人が少なかった。', (t, d) => sKekka(t, 2 * d)],
  ['週1回のととのいとは、<br>別の話だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['ととのう は、週末の<br>ごほうびじゃなく、', (t, d) => sShuukan(t, 2 * d)],
  ['毎日の帰り道の習慣<br>だったのかもしれない。', (t, d) => sShuukan(t + d, 2 * d)],
  ['サウナは週に何回行く？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0695',
    v2: true,
    tt: 'main',
    hookLine: 'サウナ室の扉が開いて、30日 のカウンターが回り出す。',
    series: '人体の限界',
    hookType: 'H1',
    cat: '体・健康',
    title: 'もしも毎日サウナに入るのを1か月続けたら？',
    titleHtml: 'もしも毎日<br>サウナに入るのを<br>1か月続けたら？',
    mood: 'hopeful', seed: 695, hits: [TP, P.at(12), P.at(15)], risers: [P.at(5)], impacts: [P.at(6, 1.0), P.at(9, 0.4)],
    sfx: [[0.05, 'whoosh'], [TP, 'alarm'], [P.at(2, 0.4), 'meter', 0.4], [P.at(3, 1.0), 'bubble'], [P.at(10, 0.3), 'alarm']],
    narr: NARR,
    ask: 'サウナは週に何回行く？',
    caption: 'もしも毎日サウナに入るのを1か月続けたら？\n\n週末だけのサウナーが、タオルを握ったまま固まる。\n本人の言い分から。週1回で、もうととのってる。\n1日目。仕事帰りのサウナで、8分で限界。\n1週間後。水風呂のあとのビールを、水に変える。\n1か月後。帰り道、サウナの前で足が勝手に止まる。\nでも、毎日入ると、体に何が起きるのか。\nフィンランドの中年の男性2,315人を、約20年追いかけた研究がある。\nサウナが週4〜7回の人は、週1回の人より、心臓が急に止まって亡くなるリスクが、63%低かった。\nただし観察研究。お酒のあと・水分なしのサウナは絶対にしないで。持病のある人は医師に相談を。\n\n結果：毎日入る人ほど、心臓で亡くなる人が少なかった。週1回のととのいとは、別の話だった。\nととのう は、週末のごほうびじゃなく、毎日の帰り道の習慣だったのかもしれない。\n\nサウナは週に何回行く？ コメントで教えて。\n\n出典：Laukkanen ほか JAMA Internal Medicine（2015年）フィンランド KIHD 研究（42〜60歳の男性2,315人・追跡の中央値20.7年）',
    hashtags: ['もしもラボ', 'もしも', 'サウナ', 'ととのう', '人体の限界'],
    endStats: [['サウナの研究', '男性2,315人', 'フィンランド・約20年'], ['週4〜7回の人の心臓突然死', '−63%', '観察研究・2015年'], ['お酒のあと・水分なし', '絶対にしない', '注意']],
    sources: '出典：Laukkanen ほか JAMA Internal Medicine（2015年）',
  },
});
