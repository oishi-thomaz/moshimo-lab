import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, comma, randPerson, makePerson, SKIN, HAIR } from '../lib.js';
import { park, setParkEnv, makeDeer, deerWalk, deerGraze, deerBow, makeHerd, setLawn, makeCar, makeSenbei } from '../scenes/deerpark.js';
import { lift, look, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも奈良の鹿が10倍に増えたら？（blueprint no 39）
// 数字（すべて一次資料で確認）：
//   奈良公園の鹿 1,687頭（2026年7月16日現在、前年比+222。オス411・メス990・子鹿286。2021年1,105→2022年1,182→2023年1,233→2024年1,325→2025年1,465→2026年1,687 で5年連続増）
//     一般財団法人 奈良の鹿愛護会「頭数調査」https://naradeer.com/learning/number.html
//   10倍 → 16,870頭（単純計算）
//   シバが生えている面積 34.5ha（2020年、奈良県（2021））→ 16,870 ÷ 34.5 ≒ 489頭/ha（単純計算）
//     奈良県「重点保護地区における『奈良のシカ』生息環境の改善（特にシバ地）について」https://www.pref.nara.jp/secure/320353/26_siryou2-6.pdf
//   道路を横断する鹿：一の鳥居北交差点周辺 午後（12〜16時）1時間あたり約155頭（2025年12月27日〜2026年3月2日の観測）→ ×10 = 約1,550頭（単純計算）
//   シカと車の衝突事故：令和元年〜令和6年の平均 約130件/年 → ×10 = 約1,300件（単純計算、1日あたり約3.6件）
//     奈良県「『奈良のシカ』と車両との交通事故対策」https://www.pref.nara.lg.jp/documents/6506/20260526105554.pdf
//   人身事故：令和6年度 151件（令和7年2月28日時点、うち日本人49件）→ ×10 = 1,510件（単純計算、1日あたり約4.1件）
//     奈良県「令和6年度の人身事故への対応」https://www.pref.nara.jp/secure/320353/23_siryou2-3.pdf

const HERD = makeHerd(4800, 39, { x0: -42, x1: 42, z0: -52, z1: 6.5 }); // 1,687頭 = 480体、16,870頭 = 4,800体で表す（比は10倍のまま）
const herdN = (heads) => HERD.setN(heads / 16870 * 4800);

// close-up cast
const D = [makeDeer({ kind: 'buck' }), makeDeer({ kind: 'doe' }), makeDeer({ kind: 'fawn' }), makeDeer({ kind: 'doe' }), makeDeer({ kind: 'doe' })];
D.forEach(d => park.add(d));
const tourist = randPerson(rng(3), { shirt: '#4fa3d1', pants: '#2b3346', long: false, skirt: false }); park.add(tourist);
const kid = makePerson({ skin: SKIN[3], hair: HAIR[1], shirt: '#f2c14e', pants: '#3b3f4a', scale: 0.72 }); park.add(kid);
const senbei = makeSenbei(); tourist.userData.arms[1].add(senbei); senbei.position.set(0, -0.7, 0.05); senbei.rotation.x = Math.PI / 2;

// crossing deer (individual) + cars
const XD = []; { const r = rng(12); for (let i = 0; i < 46; i++) { const d = makeDeer({ kind: r() < 0.25 ? 'buck' : r() < 0.85 ? 'doe' : 'fawn' }); d.userData.x = -9 + r() * 18; d.userData.ph = r(); d.userData.sp = 0.7 + r() * 0.5; park.add(d); XD.push(d); } }
const carA = makeCar('#e8e6e0'), carB = makeCar('#3b6fb6'), carC = makeCar('#d94b4b'), carD = makeCar('#2d2f36');
const CARS = [carA, carB, carC, carD];

// crowd for 人身事故
const MOB = []; { const r = rng(21); for (let i = 0; i < 22; i++) { const d = makeDeer({ kind: r() < 0.3 ? 'buck' : 'doe' }); const a = (i / 22) * Math.PI * 2 + r() * 0.2, rr = 1.3 + (i % 3) * 0.8 + r() * 0.3; d.userData.a = a; d.userData.r = rr; park.add(d); MOB.push(d); } }
const PEOPLE = []; { const r = rng(5); for (let i = 0; i < 6; i++) { const p = randPerson(r); p.visible = false; park.add(p); PEOPLE.push(p); } }

function hideAll() {
  D.forEach(d => d.visible = false); tourist.visible = false; kid.visible = false;
  XD.forEach(d => d.visible = false); CARS.forEach(c => { c.visible = false; c.userData.setBrake(false); });
  MOB.forEach(d => d.visible = false); PEOPLE.forEach(p => p.visible = false); HERD.clear();
}
// lawn group spot (close-ups) at around (-4, -4)
function lawnCast(t, mode) {
  const pos = [[-3.0, -3.2, 2.6], [-4.4, -2.2, 1.2], [-3.7, -1.6, 1.6], [-6.2, -5.0, 0.4], [-1.6, -6.0, -0.6]];
  D.forEach((d, i) => { d.visible = true; d.scale.setScalar(1); const p = pos[i]; d.position.set(p[0], 0, p[1]); d.rotation.y = p[2]; if (i === 0) deerBow(d, mode === 'bow' ? clamp(Math.sin(t * 3.0) * 1.2) : 0); else if (i === 1 || i === 3) deerGraze(d, 0.8 + Math.sin(t * 2 + i) * 0.2); else deerWalk(d, t * 3 + i, 0.6); });
  D[0].rotation.y = -0.15;
  tourist.visible = true; tourist.position.set(-3.3, 0, -1.0); tourist.rotation.y = 3.0; tourist.userData.arms[1].rotation.x = -1.1;
  kid.visible = true; kid.position.set(-4.2, 0, -1.3); kid.rotation.y = 2.6; kid.userData.arms[0].rotation.x = -0.4 - Math.sin(t * 4) * 0.2;
}

const SUBS = [
  [2.6, 6.0, 'いつもの奈良公園。<br>鹿は1,687頭。'],
  [6.2, 10.1, '芝生は消える。<br>でもヤバいのは半年後。'],
  [10.1, 14.0, '公園にいる鹿は、<br>1万6,870頭。'],
  [14.2, 18.1, '芝生は34.5ha。<br>1haに約490頭。'],
  [18.1, 22.0, '芝生は消え、土がむき出し。<br>鹿が次に向かうのは…'],
  [22.2, 26.1, 'エサを探して、<br>道路にあふれ出す。'],
  [26.1, 30.0, '交差点を渡る鹿は、<br>1時間に約1,550頭。'],
  [30.2, 34.6, '車との事故は、<br>年1,300件に。'],
  [34.6, 39.0, '1日3〜4回、どこかで衝突。<br>次は、人が危ない。'],
  [39.2, 43.6, 'せんべいを持つと、<br>囲まれて動けない。'],
  [43.6, 47.8, 'かまれる・突かれる事故は<br>年1,510件に。'],
  [48.1, 53.8, '結果：鹿によるけがが、<br>1日4件のペースに。'],
  [53.9, 56.1, '実は5年連続で増えている。'],
  [56.2, 59.4, '鹿10倍の奈良、<br>行く？行かない？'],
];

const WIDE = (t, d) => { const u = ease(t / d); look(lerp(0, 3, u), lerp(22, 20, u), lerp(17, 15, u), 0, 0, -18, 55); };
const HOOK = (t, d) => { const u = ease(t / d); look(lerp(0, 1.0, u), lerp(5.6, 6.4, u), lerp(8.2, 7.6, u), 0, 0.4, -16, 55); }; // v2：低めから。手前の鹿を大きく、奥まで鹿で埋まる（サムネ）
function shot0(t) { // hook: herd multiplies x10 in 0.3〜1.0s（v2：0.6秒以内に増え始める）
  setParkEnv('day'); setLawn(1); hideAll();
  const k = easeOut(clamp((t - 0.3) / 0.7));
  herdN(lerp(1687, 16870, k));
  HERD.clear(0.6, -1.6, 2.2); D[0].visible = true; D[0].position.set(0.6, 0, -1.6); D[0].rotation.y = 0.5; D[0].scale.setScalar(1.35); deerWalk(D[0], 0, 0); // v2：手前の主役の鹿（サムネ）
  el.flash.style.opacity = t > 0.3 && t < 0.65 ? 0.35 * (1 - (t - 0.3) / 0.35) : 0;
  lift(140); HOOK(t, 2.5);
  setTop('奈良公園の鹿（2026年→10倍）', comma(Math.round(lerp(1687, 16870, k))) + '頭', 1, k >= 1 ? '#ffd166' : '#fff');
  return park;
}
function shot1(t) { // everyday close: bow + senbei
  setParkEnv('day'); setLawn(1); hideAll(); herdN(1687);
  HERD.clear(-3.5, -3, 6); lawnCast(t + 1, 'bow');
  const u = ease(t / 3.5);
  lift(120);
  look(lerp(2.8, 2.3, u), lerp(1.8, 1.7, u), lerp(0.6, 0.2, u), -3.7, 0.9, -2.0, 50);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return park;
}
function shot2(t) { // +1日 x10（v2：冒頭で増えた直後からつながるので、もう10倍のまま）
  setParkEnv('day'); setLawn(1); hideAll();
  herdN(16870);
  lift(140);
  const u = ease(t / 8);
  look(lerp(-6, 4, u), lerp(25, 22, u), lerp(18, 16, u), 0, 0, -20, 55);
  hudTime('+1日');
  setTop('奈良公園の鹿（2026年の10倍・単純計算）', '16,870頭', fade(t, 0.15, 8, 0.25), '#ffd166');
  return park;
}
function shot3(t) { // +1週間 lawn bare
  setParkEnv('day'); hideAll(); herdN(16870);
  setLawn(1 - ease(clamp((t - 3.5) / 3.5)));
  lift(160);
  const u = ease(t / 8);
  look(lerp(10, 0, u), lerp(9, 11, u), lerp(10, 12, u), lerp(-2, 0, u), 0, -10, 55);
  hudTime('+1週間');
  setTop('芝生1haあたりの鹿（2020年の面積・単純計算）', '約' + countUp(t, 490, 0.2, 1.3) + '頭', fade(t, 0.15, 8, 0.25));
  return park;
}
function crossing(t, flow = 1) {
  XD.forEach((d, i) => {
    d.visible = true;
    const sp = d.userData.sp * flow, zz = 4 + ((d.userData.ph * 16 + t * sp) % 16);
    d.position.set(d.userData.x + Math.sin(i + t * 0.3) * 0.3, 0, zz); d.rotation.y = 0; deerWalk(d, t * 5 * d.userData.sp + i, 0.9);
  });
}
function shot4(t) { // +1か月: road crossing, cars stopped
  setParkEnv('day'); setLawn(0); hideAll(); herdN(16870);
  crossing(t);
  carA.visible = true; carA.position.set(-14.5, 0, 11.3); carA.rotation.y = 0; carA.userData.setBrake(true);
  carB.visible = true; carB.position.set(-19.5, 0, 11.3); carB.rotation.y = 0; carB.userData.setBrake(true);
  carC.visible = true; carC.position.set(14.5, 0, 14.7); carC.rotation.y = Math.PI; carC.userData.setBrake(true);
  carD.visible = true; carD.position.set(19.8, 0, 14.7); carD.rotation.y = Math.PI; carD.userData.setBrake(true);
  lift(200);
  const u = ease(t / 8);
  look(lerp(10, 7, u), lerp(9, 8, u), lerp(-3, -1, u), 0, 1, 13, 50);
  hudTime('+1か月');
  setTop('交差点を渡る鹿（2026年1月の10倍・単純計算）', '約' + comma(countUp(t, 1550, 4.3, 1.3)) + '頭/時', fade(t, 4.25, 8, 0.25));
  return park;
}
function shot5(t) { // +3か月: car brakes before deer
  setParkEnv('day'); setLawn(0); hideAll(); herdN(16870);
  crossing(t + 3, 0.6);
  const stop = ease(clamp(t / 1.4));
  carA.visible = true; carA.position.set(lerp(-26, -12.5, stop), 0, 11.3); carA.rotation.y = 0; carA.userData.setBrake(t > 0.6);
  carB.visible = true; carB.position.set(lerp(-34, -17.5, stop), 0, 11.3); carB.rotation.y = 0; carB.userData.setBrake(t > 0.9);
  carC.visible = true; carC.position.set(12.5, 0, 14.7); carC.rotation.y = Math.PI; carC.userData.setBrake(true);
  lift(200);
  const u = ease(t / 9);
  look(lerp(-21, -19, u), lerp(4.5, 5.5, u), lerp(3, 4, u), -9, 1, 12.5, 50);
  hudTime('+3か月');
  setTop('鹿と車の事故（2019〜24年平均の10倍・単純計算）', '年' + comma(countUp(t, 1300, 0.3, 1.3)) + '件', fade(t, 0.15, 9, 0.25), '#ff8a7a');
  return park;
}
function shot6(t) { // +半年: tourists mobbed
  setParkEnv('day'); setLawn(0); hideAll(); herdN(16870);
  const c = new THREE.Vector3(-2, 0, 2); HERD.clear(-2, 2, 7);
  tourist.visible = true; tourist.position.copy(c); tourist.rotation.y = Math.sin(t * 2) * 0.6; tourist.userData.arms[1].rotation.x = -2.6; tourist.userData.arms[0].rotation.x = -2.4;
  MOB.forEach((d, i) => {
    d.visible = true; const rr = lerp(d.userData.r + 2.5, d.userData.r * 0.55 + 0.6, ease(clamp(t / 3))), a = d.userData.a + t * 0.05;
    d.position.set(c.x + Math.cos(a) * rr, 0, c.z + Math.sin(a) * rr); d.rotation.y = Math.atan2(c.x - d.position.x, c.z - d.position.z);
    if (t < 3) deerWalk(d, t * 5 + i, 0.8); else deerBow(d, clamp(Math.sin(t * 4 + i) * 1.3));
  });
  PEOPLE.forEach((p, i) => { p.visible = false; p.position.set(-8 + i * 3.2, 0, 6.5 - (i % 2) * 1.5); p.rotation.y = 2.4 + i * 0.3; p.userData.arms[0].rotation.x = -0.5; });
  lift(150);
  const u = ease(t / 9);
  look(lerp(4, 2.5, u), lerp(4.6, 5.2, u), lerp(9.5, 8.5, u), -2, 0.8, 1.6, 50);
  hudTime('+半年');
  setTop('鹿による人身事故（2024年度の10倍・単純計算）', '年' + comma(countUp(t, 1510, 4.6, 1.3)) + '件', fade(t, 4.45, 9, 0.25), '#ff8a7a');
  return park;
}
function shot7(t) { // result: dusk wide, bare park, deer everywhere
  setParkEnv('dusk'); setLawn(0); hideAll(); herdN(16870);
  crossing(t + 8, 0.5);
  carA.visible = true; carA.position.set(-12.5, 0, 11.3); carA.userData.setBrake(true);
  lift(140);
  const u = ease(t / 7.5);
  look(lerp(2, -3, u), lerp(20, 24, u), lerp(17, 19, u), 0, 0, -16, 55);
  setTop('鹿による人身事故（10倍・単純計算）', '1日 約' + countUp(t, 4, 0.3, 1.0) + '件', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return park;
}
function shot8(t) { // loop: hook framing, already x10
  setParkEnv('day'); setLawn(0); hideAll(); herdN(16870);
  lift(140); HOOK(t * 0.3, 2.5);
  return park;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：いつもの奈良公園（元の2.5〜6秒）を抜いて、増えた直後から本題へ
  meta: {
    id: '0039',
    v2: true,
    hookLine: '奈良の鹿が一晩で、10倍に増えた。',
    title: '奈良の鹿が10倍に増えたら？',
    titleHtml: '奈良の鹿が<br>10倍に増えたら？',
    mood: 'hopeful', seed: 39, hits: [1.0, 48.1], risers: [6.0], impacts: [31.0, 44.2, 48.4],
    sfx: [[0.3, 'whoosh'], [22.4, 'whoosh'], [30.6, 'alarm']],
    narr: { '34.5ha': 'さんじゅうよんてんごヘクタール', '1haに約490頭': 'いちヘクタールにやく490とう', '1万6,870頭': 'いちまんろくせんはっぴゃくななじゅうとう', '1日3〜4回、': 'いちにちさんかいからよんかい、' },
    ask: '鹿10倍の奈良、行く？行かない？',
    caption: 'もしも奈良公園の鹿が一晩で10倍に増えたら？\n2026年7月の調査で、奈良公園の鹿は1,687頭。1953年の調査開始以来の最多で、5年連続で増えている。\n10倍にすると16,870頭（単純計算）。シバが生えている芝生34.5haに、1haあたり約490頭がひしめく。\n交差点を渡る鹿は1時間に約1,550頭、車との事故は年約1,300件（どちらも今の10倍の単純計算）。\nかまれる・突かれるなどの人身事故は、2024年度の151件（2025年2月末時点）の10倍で年1,510件。1日4件のペースになる（単純計算）。\n奈良のシカは国の天然記念物。せんべい以外の食べ物はあげないで、適度な距離で見守ろう。\n\n鹿10倍の奈良、行く？行かない？ コメントで教えて。\n\n出典：奈良の鹿愛護会「頭数調査」（2026年）、奈良県「『奈良のシカ』と車両との交通事故対策」（2026年）、奈良県「令和6年度の人身事故への対応」（2025年）、奈良県「重点保護地区における『奈良のシカ』生息環境の改善（特にシバ地）について」',
    hashtags: ['もしもラボ', '奈良公園', '鹿', '奈良', '雑学'],
    endStats: [['奈良公園の鹿', '1,687頭', '2026年7月'], ['10倍にすると', '16,870頭', '単純計算'], ['鹿と車の事故', '年 約130件', '2019〜24年平均'], ['鹿による人身事故', '151件', '2024年度・2月末時点'], ['10倍にすると', '1日 約4件', '単純計算']],
    sources: '出典：奈良の鹿愛護会「頭数調査」（2026年）、<br>奈良県「奈良のシカと車両との交通事故対策」（2026年）、<br>奈良県「令和6年度の人身事故への対応」（2025年）、<br>奈良県 シバ地の資料（2020年の面積）',
  },
});
