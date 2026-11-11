import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, randPerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, poseClear, poseSit } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTub, makeSteam, makeBed } from '../scenes/home.js';

// もしもシャワーをやめて毎日湯船に浸かったら？（台本 S78・人体の限界）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）
// 数字（一次資料で確認済み 2026/11/11・Europe PMC の抄録）：
//  ・Ukai T ほか. Habitual tub bathing and risks of incident coronary heart disease and stroke. Heart 2020;106(10):732-737（JPHC 研究）
//    40〜59歳 30,076人・1990〜2009年の追跡。ほぼ毎日〜毎日 vs 週0〜2回：心血管疾患 HR 0.72（95%CI 0.62–0.84）、脳卒中 HR 0.74（0.62–0.87）
//    突然死・くも膜下出血とは関連なし。観察研究（関連）なので 防げる とは言わない（画面に 観察研究 と出す）
//  ・入浴の注意：消費者庁「入浴中の事故」湯温は41度以下、湯につかる時間は10分までを目安に。アルコールが抜けていない状態の入浴は控える
//    （台本の 逆効果 は、出典の言い方に合わせて 注意 にした）
// 入浴は肩から上だけ（Tシャツを着た絵と湯気）。真似しないで ではなく 目安 を出す

const BLUE = '#7fd4ff', RED = '#ff6a5a', GOLD = '#ffd27a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#b8d4e8' }); hemi.intensity = 1.6;

// ---------- A：お風呂場（原点） ----------
const bath = room({ x: 0, w: 5, d: 4, h: 3.0, wall: '#cfe6ee', floor: '#9ab8c4', right: true });
for (let i = 0; i < 8; i++) { const l = box(5, 0.02, 0.02, mat('#b8d2dc')); l.position.set(0, 0.35 + i * 0.35, -1.92); S.add(l); }
const TUB = makeTub(); TUB.position.set(0.4, 0, -1.2); S.add(TUB);
const STEAM = makeSteam(26, { w: 1.6, d: 0.7, h: 1.8 }); STEAM.position.set(0.4, 0.5, -1.2); S.add(STEAM);
// シャワー（壁のヘッドと水の線）
const SH = new THREE.Group(); { const pipe = box(0.05, 1.4, 0.05, mat('#c8ccd4')); pipe.position.set(-1.6, 1.4, -1.9); SH.add(pipe); const head = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.08, 14), mat('#c8ccd4')); head.position.set(-1.6, 2.15, -1.75); head.rotation.x = 0.9; SH.add(head); } S.add(SH);
const DROPS = []; for (let i = 0; i < 26; i++) { const d = box(0.015, 0.16, 0.015, new THREE.MeshBasicMaterial({ color: '#9fd8ff' })); S.add(d); DROPS.push(d); }
function setDrops(on, t) { DROPS.forEach((d, i) => { d.visible = on; const u = (t * 2.2 + i * 0.137) % 1; d.position.set(-1.6 + ((i * 0.37) % 1 - 0.5) * 0.3, 2.05 - u * 2.0, -1.55 + ((i * 0.61) % 1 - 0.5) * 0.3); }); }
const ME = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }); S.add(ME);
const BATHER = makeMan({ shirt: '#e9e4da', hair: '#1d1a19' }); S.add(BATHER); BATHER.userData.legs.forEach(l => l.visible = false); // 湯船の中（Tシャツ）
const PHONE = makePhone({ w: 0.2, h: 0.4 }); S.add(PHONE.g);
function drawPhone(t) { PHONE.draw('v' + Math.floor(t * 6), (g, w, h) => { g.fillStyle = '#f4f4f6'; g.fillRect(0, 0, w, h); const off = (t * 300) % 200; for (let i = -1; i < 7; i++) { g.fillStyle = ['#d8dce4', '#e8d8e0', '#d8e4dc'][(i + 3) % 3]; g.fillRect(30, i * 200 + off + 20, w - 60, 160); } }); }
const yubune = label('毎日 湯船', { w: 640, size: 120, color: '#fff', bg: 'rgba(60,110,200,.96)', sx: 1.3 }); S.add(yubune);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.5 }); S.add(katamaru);
const gofun = label('シャワー5分で十分', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(gofun);
const aa = label('あ〜', { w: 384, size: 130, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.75 }); S.add(aa);
const nijuppun = label('20分たった', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.96)', sx: 1.1 }); S.add(nijuppun);
const tanoshimi = label('1日でいちばんの楽しみ', { w: 1100, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.9 }); S.add(tanoshimi);
const dou = label('体にどう？', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.1 }); S.add(dou);
const chui = label('41℃以下・10分まで', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,90,40,.96)', sx: 1.6 }); S.add(chui);
// 温度計
const THERMO = new THREE.Group(); { const b = box(0.16, 1.0, 0.06, mat('#ffffff')); b.position.y = 0.5; THERMO.add(b); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat('#e04a3a')); bulb.position.y = 0.0; THERMO.add(bulb); } S.add(THERMO);
const TH_RED = box(0.06, 1, 0.07, mat('#e04a3a')); THERMO.add(TH_RED);
function setThermo(k) { TH_RED.scale.y = Math.max(0.01, 0.9 * k); TH_RED.position.y = 0.45 * k; }

// ---------- B：寝室（x=40）：寝る前 ----------
const BX = 40;
const bed = room({ x: BX, w: 7, d: 5, h: 3, wall: '#e6dccc', floor: '#b48a5e' });
const BED = makeBed(); BED.position.set(BX + 0.6, 0, -1.2); S.add(BED);
const SLEEPER = makeMan({ shirt: '#8fa3b8', pants: '#5d6b80', hair: '#1d1a19' }); S.add(SLEEPER);

// ---------- C：研究の人たち（x=100） ----------
const CX = 100;
flat(40, 30, '#d8e2e8', CX, 0);
const CROWD = []; { const r = rng(78); for (let i = 0; i < 64; i++) { const p = randPerson(r); p.position.set(CX - 2.8 + (i % 8) * 0.8 + (r() - 0.5) * 0.2, 0, -4 + Math.floor(i / 8) * 0.9 + (r() - 0.5) * 0.2); p.rotation.y = (r() - 0.5) * 0.5; S.add(p); CROWD.push(p); } }
const grpA = label('ほぼ毎日 湯船', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,110,200,.96)', sx: 2.4 }); S.add(grpA);
const grpB = label('週2回以下', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 2.0 }); S.add(grpB);
// 心臓（2つの球と円すい）と脳卒中（頭の中の脳）
const HEART = new THREE.Group(); { const m = mat('#e0405a'); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), m); b.position.set(s * 0.36, 0.2, 0); HEART.add(b); } const c = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.2, 16), m); c.rotation.z = Math.PI; c.position.y = -0.45; HEART.add(c); } HEART.position.set(CX, 2.2, 2); S.add(HEART);
const BRAIN = new THREE.Group(); { const m = mat('#f2a8b8', { flatShading: true }); for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), m); b.position.set(-0.6 + (i % 4) * 0.4, 0.15 + Math.floor(i / 4) * 0.35, (i % 2) * 0.2); BRAIN.add(b); } } BRAIN.position.set(CX + 0.2, 2.0, 2); BRAIN.scale.setScalar(0.7); S.add(BRAIN);
const kansatsu = label('観察研究', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.9 }); S.add(kansatsu);

const PEOPLE = [ME, BATHER, SLEEPER, ...CROWD];
const LABELS = [yubune, katamaru, gofun, aa, nijuppun, tanoshimi, dou, chui, grpA, grpB, kansatsu];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; p.scale.setScalar(p === ME || p === BATHER || p === SLEEPER ? 1 : p.scale.x); });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0;
  TUB.userData.setWater(1); STEAM.userData.set(0); setDrops(false, 0); PHONE.g.visible = false; THERMO.visible = false; HEART.visible = false; BRAIN.visible = false;
  ME.position.set(1.75, 0, -0.5); ME.rotation.y = -0.7;
  BATHER.visible = false; BATHER.position.set(0.55, -0.02, -1.15); BATHER.rotation.y = 0;
  SLEEPER.rotation.set(-Math.PI / 2, 0, 0); SLEEPER.position.set(BX + 0.6, 0.66, -1.0);
  BED.userData.blanket.visible = true;
  CROWD.forEach(p => p.visible = true);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function sitTub(p, t) { poseSit(p); p.position.y = -0.6; p.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0)); p.userData.head.rotation.z = Math.sin(t * 1.5) * 0.05; }
const TP = 0.35;
function bathCam(u = 0) { look(lerp(1.0, 0.9, u), lerp(2.9, 2.7, u), lerp(5.2, 4.8, u), 0.95, lerp(1.55, 1.3, u), -1.0, 46); }
function shot0(t) { // 0秒＝サムネ：シャワーの水が止まり、空っぽの湯船にお湯がドドッと満ちる
  reset(); lift(0);
  const k = clamp((t - TP) / 0.6); TUB.userData.setWater(easeOut(k)); setDrops(t < TP, t); STEAM.userData.set(k, t);
  ME.userData.arms[1].rotation.set(-0.4, 0, 0.2);
  if (t > TP) { el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; say(yubune, t, TP + 0.1, 0.5, 1.75, -1.0, 0.95); }
  bathCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // シャワー派の会社員が、湯気の前で固まる。
  reset(); lift(120); STEAM.userData.set(1, t + 2); ME.rotation.y = -0.7; ME.position.set(1.6, 0, -0.3);
  if (t > 1.0) say(katamaru, t, 1.0, 1.25, 2.05, -0.3, 0.4);
  const u = ease(clamp(t / d)); look(lerp(-0.2, 0.2, u), 1.75, lerp(2.6, 2.2, u), 1.4, 1.35, -0.6, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。忙しいから、お風呂は5分のシャワーで十分。
  reset(); lift(120); TUB.userData.setWater(0); setDrops(true, t); ME.rotation.y = -0.3; ME.position.set(-0.7, 0, 0.1); ME.userData.arms[0].rotation.set(0, 0, -0.5); ME.userData.arms[1].rotation.set(-0.8, 0, 0.3);
  if (t > d * 0.35) say(gofun, t, d * 0.35, -0.7, 2.25, 0.1, 1.4);
  look(-0.4, 1.7, 3.4, -0.6, 1.5, -0.3, 50);
  return S;
}
function tubCam(u = 0) { look(lerp(0.9, 0.7, u), 1.75, lerp(2.7, 2.3, u), 0.5, 0.75, -1.15, 50); }
function sDay1(t, d) { // 1日目。湯船で、思わず あ〜 と声が出る。
  reset(); lift(120); ME.visible = false; BATHER.visible = true; sitTub(BATHER, t); STEAM.userData.set(0.8, t); BATHER.userData.head.rotation.x = -0.25;
  say(aa, t, 0.6, 1.05, 1.25, -1.0, 0.5);
  setHud('湯船生活', '1日目', 1); tubCam(ease(clamp(t / d)));
  return S;
}
function sDay3(t, d) { // 3日目。湯船でスマホを見ていたら、20分たっていた。
  reset(); lift(120); ME.visible = false; BATHER.visible = true; sitTub(BATHER, t); STEAM.userData.set(0.8, t);
  BATHER.userData.arms[1].rotation.set(-1.9, 0, 0.3); BATHER.userData.head.rotation.x = 0.3; PHONE.g.visible = true; PHONE.g.position.set(0.5, 0.82, -0.82); PHONE.g.rotation.x = -0.6; drawPhone(t);
  if (t > d * 0.5) say(nijuppun, t, d * 0.5, 0.55, 1.6, -1.2, 0.8);
  setHud('湯船生活', '3日目', 1); tubCam(0.5);
  return S;
}
function sWeek(t, d) { // 1週間後。寝る前の湯船が、1日でいちばん楽しみになる。
  reset(); lift(120); ME.visible = false; BATHER.visible = true; sitTub(BATHER, t); STEAM.userData.set(0.8, t); BATHER.userData.head.rotation.x = -0.2; BATHER.userData.head.rotation.z = 0.15;
  say(tanoshimi, t, 0.6, 0.45, 1.65, -1.1, 1.5);
  setHud('湯船生活', '1週間後', 1); tubCam(1 - ease(clamp(t / d)) * 0.5);
  return S;
}
function sDou(t, d) { // でも、毎日の湯船は、体にどうなのか。
  reset(); lift(120); ME.visible = false; BATHER.visible = true; sitTub(BATHER, t); STEAM.userData.set(1, t);
  say(dou, t, 0.3, 0.55, 1.6, -1.1, 0.8);
  const u = ease(clamp(t / d)); look(lerp(0.6, 1.4, u), lerp(1.5, 2.2, u), lerp(1.9, 3.2, u), 0.5, 1.0, -1.15, 50);
  return S;
}
function crowdCam(u = 0) { look(CX, lerp(6.0, 5.2, u), lerp(12, 10.5, u), CX, 1.0, -1.2, 50); }
function sStudy(t, d) { // 日本の40〜59歳、約3万人を、およそ20年追いかけた研究がある。
  reset(); lift(150); ME.visible = false;
  setTop('日本の40〜59歳（JPHC 研究）', '30,076人', fade(t, 0.3, d, 0.25), BLUE); setHud('追いかけた期間', '1990〜2009年', 1);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function sGroups(t, d) { // ほぼ毎日湯船に浸かる人は、週2回以下の人より
  reset(); lift(150); ME.visible = false;
  CROWD.forEach((p, i) => { const left = (i % 8) < 4; p.userData.bx ??= p.position.x; p.position.x = p.userData.bx + (left ? -0.7 : 0.7) * easeOut(clamp(t / 1.0)); });
  say(grpA, t, 0.5, CX - 1.6, 2.35, 1.0, 1.9); say(grpB, t, 0.9, CX + 1.7, 2.35, 1.0, 1.6);
  setHud('くらべた', '湯船に浸かる回数', 1); crowdCam(1);
  return S;
}
function sHeart(t, d) { // 心臓や血管の病気のなりやすさが28%低かった。
  reset(); lift(150); ME.visible = false; CROWD.forEach(p => p.visible = false);
  HEART.visible = true; const k = easeOut(clamp((t - 0.4) / 1.0)); HEART.scale.setScalar((1 - 0.28 * k) * (1 + Math.sin(t * 7) * 0.03));
  say(kansatsu, t, 0.3, CX + 0.55, 3.15, 2, 0.7);
  setTop('心臓や血管の病気（ほぼ毎日 vs 週2回以下）', '28%低い', fade(t, 0.3, d, 0.25), GREEN); setHud('JPHC 研究', '2020年', 1);
  look(CX, 2.4, 6.6, CX, 2.3, 2, 50);
  return S;
}
function sStroke(t, d) { // 脳卒中も26%低かった。
  reset(); lift(150); ME.visible = false; CROWD.forEach(p => p.visible = false);
  BRAIN.visible = true; BRAIN.rotation.y = Math.sin(t * 0.8) * 0.3;
  setTop('脳卒中（ほぼ毎日 vs 週2回以下）', '26%低い', fade(t, 0.3, d, 0.25), GREEN); setHud('JPHC 研究', '2020年', 1);
  look(CX, 2.4, 6.4, CX, 2.2, 2, 50);
  return S;
}
function sKekka(t, d) { // 結果：毎日の湯船の人は、心臓と血管の病気が3割近く少なかった。
  reset(); lift(120); ME.visible = false; BATHER.visible = true; sitTub(BATHER, t); STEAM.userData.set(0.9, t); BATHER.userData.head.rotation.x = -0.15;
  const u = ease(clamp(t / d)); look(lerp(1.6, 0.6, u), lerp(2.2, 1.6, u), lerp(3.6, 2.2, u), 0.5, 1.0, -1.15, 50);
  return S;
}
function sChui(t, d) { // ただし、熱すぎるお湯と長湯には注意。
  reset(); lift(120); ME.visible = false; BATHER.visible = true; sitTub(BATHER, t); STEAM.userData.set(0.9, t);
  THERMO.visible = true; THERMO.position.set(-0.45, 1.0, -1.3); setThermo(0.4 + 0.5 * easeOut(clamp(t / 1.2)));
  say(chui, t, 0.5, 0.2, 2.05, -0.9, 1.3);
  setHud('消費者庁の目安', '湯温と時間', 1);
  look(0.2, 1.6, 2.6, 0.15, 1.2, -1.15, 50);
  return S;
}
function sAsk(t) { // あなたはシャワー派？湯船派？（冒頭と同じ構図。湯船はお湯で満ちたまま）
  reset(); lift(0); STEAM.userData.set(1, t + 3); ME.userData.arms[1].rotation.set(-0.4, 0, 0.2); bathCam(0);
  return S;
}

const NARR = { '40〜59歳': 'よんじゅっさいからごじゅうきゅうさい', '約3万人': 'やくさんまんにん', '20年': 'にじゅうねん', '28%': 'にじゅうはちパーセント', '26%': 'にじゅうろくパーセント', '3割': 'さんわり', '5分': 'ごふん', '20分': 'にじゅっぷん', '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '1日': 'いちにち', '週2回': 'しゅうにかい', '湯船': 'ゆぶね', '浸かる': 'つかる', '言い分': 'いいぶん', '長湯': 'ながゆ', '脳卒中': 'のうそっちゅう', '結果：': '結果、', '何派': 'なには', '湯船派': 'ゆぶねは', 'シャワー派': 'シャワーは' };
const P = planTimes([
  ['シャワー派の会社員が、<br>湯気の前で固まる。', sKatamaru],
  ['本人の言い分から。忙しいから、', (t, d) => sIibun(t, 2 * d)],
  ['お風呂は5分のシャワーで十分。', (t, d) => sIibun(t + d, 2 * d)],
  ['1日目。湯船で、<br>思わず あ〜 と声が出る。', sDay1],
  ['3日目。湯船でスマホを<br>見ていたら、20分たっていた。', sDay3],
  ['1週間後。寝る前の湯船が、<br>1日でいちばん楽しみになる。', sWeek],
  ['でも、毎日の湯船は、<br>体にどうなのか。', sDou],
  ['日本の40〜59歳、約3万人を、', (t, d) => sStudy(t, 2 * d)],
  ['およそ20年<br>追いかけた研究がある。', (t, d) => sStudy(t + d, 2 * d)],
  ['ほぼ毎日湯船に浸かる人は、<br>週2回以下の人より', sGroups],
  ['心臓や血管の病気の<br>なりやすさが28%低かった。', sHeart],
  ['脳卒中も26%低かった。', sStroke],
  ['結果：毎日の湯船の人は、', (t, d) => sKekka(t, 2 * d)],
  ['心臓と血管の病気が<br>3割近く少なかった。', (t, d) => sKekka(t + d, 2 * d)],
  ['ただし、熱すぎるお湯と<br>長湯には注意。', sChui],
  ['あなたはシャワー派？<br>湯船派？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0671',
    v2: true,
    tt: 'main',
    hookLine: 'シャワーの水が止まり、空っぽの湯船にお湯がドドッと満ちる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしもシャワーをやめて毎日湯船に浸かったら？',
    titleHtml: 'もしもシャワーを<br>やめて毎日湯船に<br>浸かったら？',
    mood: 'calm', seed: 671, hits: [TP, P.at(12)], risers: [P.at(6)], impacts: [P.at(7, 0.4), P.at(10, 0.5), P.at(11, 0.4)],
    sfx: [[TP, 'bubble'], [P.at(0, 1.0), 'buzz'], [P.at(3, 0.5), 'bubble'], [P.at(4, 1.2), 'alarm'], [P.at(6, 0.2), 'meter', 0.35], [P.at(9, 0.3), 'whoosh'], [P.at(14, 0.4), 'alarm']],
    narr: NARR,
    ask: 'あなたはシャワー派？湯船派？',
    caption: 'もしもシャワーをやめて毎日湯船に浸かったら？\n\nシャワー派の会社員が、湯気の前で固まる。\n本人の言い分から。忙しいから、お風呂は5分のシャワーで十分。\n1日目。湯船で、思わず あ〜 と声が出る。\n3日目。湯船でスマホを見ていたら、20分たっていた。\n1週間後。寝る前の湯船が、1日でいちばん楽しみになる。\nでも、毎日の湯船は、体にどうなのか。\n日本の40〜59歳、約3万人（30,076人）を、およそ20年（1990〜2009年）追いかけた研究がある。\nほぼ毎日湯船に浸かる人は、週2回以下の人より、心臓や血管の病気のなりやすさが28%低かった。脳卒中も26%低かった（観察研究。湯船が病気を防ぐとまでは言えない）。\n\n結果：毎日の湯船の人は、心臓と血管の病気が3割近く少なかった。\nただし、熱すぎるお湯と長湯には注意（消費者庁の目安：湯温は41度以下、湯につかるのは10分まで。お酒を飲んだ後の入浴は控える）。\n\nあなたはシャワー派？湯船派？ コメントで教えて。\n\n出典：Ukai T ほか. Habitual tub bathing and risks of incident coronary heart disease and stroke. Heart 2020（JPHC 研究）、消費者庁「入浴中の事故」',
    hashtags: ['もしもラボ', 'もしも', '湯船', 'お風呂', '健康習慣'],
    endStats: [['心臓や血管の病気（ほぼ毎日 vs 週2回以下）', '28%低い', 'JPHC 研究 2020年・観察研究'], ['脳卒中', '26%低い', 'JPHC 研究 2020年・観察研究'], ['入浴の目安', '41℃以下・10分まで', '消費者庁']],
    sources: '出典：Ukai T ほか. Heart 2020（JPHC 研究・40〜59歳 30,076人）、消費者庁「入浴中の事故」',
  },
});
