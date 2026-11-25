import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk, makeQ } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat, makeSuit } from '../scenes/office.js';
import { planTimes, addKnees, fitReset, setThighHeat, makeTimer, fmtMS, makeStairs } from '../scenes/fitness.js';
import { makeSet, makeTable } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも毎日1分のスクワットを1か月続けたら？（人体の限界・台本 S140）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/24 の解析の種（0708 毎日1分のプランク のバズ）
// 数字（一次資料で確認・2026/11/25）：
//  厚生労働省 健康づくりのための身体活動・運動ガイド2023：成人に 筋力トレーニングを週2〜3日行うことを推奨（成人版の推奨事項）
//  Momma ほか British Journal of Sports Medicine 2022年（doi:10.1136/bjsports-2021-105061）：16の研究のメタ分析。筋力を高める運動が週30〜60分ほどで、
//   全死亡などのリスクが約10〜20%低い。すべて観察研究（BMJ のニュースリリース）
//  1日1分×30日＝約30分・1日5分×7日＝35分（週30〜60分に届く）は単純計算（画面に（単純計算））。スクワットだけの研究ではないので画面は 筋トレ。膝や腰が痛い人は無理しない の字幕
//  実在のジム・ロゴは出さない（架空の もしもジム）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#a8cce8', ground: '#8a9078' }); hemi.intensity = 1.25;
const ME = addKnees(makeMan({ shirt: '#4a7ab0', pants: '#3a3f4e', hair: '#1d1a19' })); S.add(ME); const sweat = makeSweat(); ME.userData.head.add(sweat);
const SUIT = addKnees(makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' })); S.add(SUIT); const sweat2 = makeSweat(); SUIT.userData.head.add(sweat2);
const CROWD = []; { for (let i = 0; i < 40; i++) { const p = makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#d97a3a', '#59606e', '#c94f7c', '#8a7a5a'][i % 6], hair: ['#9a9a9a', '#4a3426', '#1d1a19'][i % 3] }); S.add(p); CROWD.push(p); } }
function squat(p, k, t = 0, shake = 0) { const U = p.userData; const th = 1.25 * k + Math.sin(t * 47) * 0.03 * shake, kn = 1.9 * k; U.legs.forEach(l => l.rotation.x = -th); U.knees.forEach(n => n.rotation.x = kn);
  const sh = kn - th; p.position.y = -(0.42 * (1 - Math.cos(th)) + 0.38 * (1 - Math.cos(sh))) * p.scale.y; U.arms.forEach(a => a.rotation.set(-1.45 * k, 0, 0)); }

// ---------- A：リビング（原点） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#efe6d6', floor: '#b48a5e' });
const SOFA = new THREE.Group(); { const b = box(2.0, 0.45, 0.8, mat('#7a8a9a')); b.position.y = 0.3; SOFA.add(b); const bk = box(2.0, 0.6, 0.2, mat('#6a7a8a')); bk.position.set(0, 0.75, -0.35); SOFA.add(bk); } SOFA.position.set(-1.6, 0, -2.0); S.add(SOFA);
const TIMER = makeTimer({ w: 1.3, h: 0.55 }); TIMER.position.set(-0.75, 1.95, -2.4); S.add(TIMER);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const moeru = label('太ももが 燃える', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(moeru);
const TBL = makeTable({ w: 1.0, d: 0.6, h: 0.45, color: '#c9a77a' }); TBL.position.set(1.5, 0, -1.2); S.add(TBL);
const CARD = box(0.34, 0.01, 0.22, mat('#e8c040')); CARD.position.set(1.3, 0.48, -1.15); S.add(CARD);
const CARDL = label('もしもジム 会員証', { w: 900, size: 90, color: '#2a1a00', bg: 'rgba(232,192,64,.97)', sx: 0.9 }); S.add(CARDL);
const minai = label('見ないふり', { w: 640, size: 110, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.8 }); S.add(minai);
const PH = makePhone({ w: 0.18, h: 0.36 }); S.add(PH.g);
const aikotoba = label('始めないための 合言葉', { w: 1100, size: 88, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(aikotoba);
const Q = makeQ(); S.add(Q);

// ---------- B：エレベーターホール（x=60） ----------
const BX = 60;
room({ x: BX, w: 7, d: 5, h: 3.2, wall: '#dfe3e8', floor: '#8a8f99' });
const ELV = new THREE.Group(); { const fr = box(1.6, 2.4, 0.1, mat('#9aa0aa')); fr.position.y = 1.2; ELV.add(fr); for (const s of [-1, 1]) { const d = box(0.68, 2.2, 0.06, mat('#c8ccd4')); d.position.set(s * 0.36, 1.1, 0.05); ELV.add(d); } const pnl = box(0.12, 0.2, 0.04, new THREE.MeshBasicMaterial({ color: '#ffd27a' })); pnl.position.set(1.0, 1.2, 0.05); ELV.add(pnl); } ELV.position.set(BX + 0.2, 0, -2.42); S.add(ELV);
const ELVSIGN = label('▲ 2階', { w: 512, size: 110, color: '#fff', bg: 'rgba(30,34,44,.95)', sx: 0.55 }); ELVSIGN.position.set(BX + 0.2, 2.65, -2.3); S.add(ELVSIGN);
const undou = label('運動は したい', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(undou);
const jikan = label('でも 時間がない', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(jikan);

// ---------- C：駅の階段（x=120） ----------
const CX = 120;
flat(30, 20, '#b9bcc4', CX, -2); const WALLC = box(20, 6, 0.3, mat('#d8dce2')); WALLC.position.set(CX, 3, -6.5); S.add(WALLC);
const STAIRS = makeStairs({ n: 14 }); STAIRS.position.set(CX - 0.6, 0, -0.2); S.add(STAIRS);
const ELV2 = ELV.clone(); ELV2.position.set(CX + 2.2, 0, -1.0); S.add(ELV2);
const toori = label('エレベーター 素通り', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.15 }); S.add(toori);

// ---------- D：データ（x=180） ----------
const DX = 180;
flat(30, 20, '#2e3044', DX, -2); const BACKD = box(16, 8, 0.2, mat('#262838')); BACKD.position.set(DX, 4, -8); S.add(BACKD);
const GUIDE = makeDoc({ title: '国の運動ガイド 2023', rows: ['筋トレ', '対象'], head: '#2a6a9a', w: 1.6, h: 1.4 }); GUIDE.userData.fill(0, '週2〜3日'); GUIDE.userData.fill(1, '成人'); GUIDE.position.set(DX, 1.6, -1.0); S.add(GUIDE);
const BARS = []; [['しない', '#9aa0aa'], ['週30〜60分', '#5ab07a']].forEach(([n, c]) => { const b = box(0.7, 1, 0.4, mat(c)); S.add(b); const l = label(n, { w: 640, size: 100, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.75 }); S.add(l); BARS.push({ b, l }); });
const kansatsu = label('観察研究', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.7 }); S.add(kansatsu);
const muri = label('膝や腰が痛い人は 無理しない', { w: 1200, size: 84, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(muri);
const CAL = []; for (let i = 0; i < 30; i++) { const c = box(0.34, 0.34, 0.04, mat('#f4f4f2')); S.add(c); CAL.push(c); }
const DOT = CAL.map(() => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: '#e8604a' })); S.add(m); return m; });

const PEOPLE = [ME, SUIT];
const LABELS = [katamaru, moeru, CARDL, minai, aikotoba, undou, jikan, toori, kansatsu, muri];
function reset() {
  PEOPLE.forEach(p => { fitReset(p); poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  CROWD.forEach(c => c.visible = false); LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); sweat2.userData.set(0);
  TIMER.userData.set('1:00'); PH.g.visible = false; Q.visible = false; GUIDE.visible = false; BARS.forEach(x => { x.b.visible = false; x.l.visible = false; }); CAL.forEach(c => c.visible = false); DOT.forEach(c => c.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
const TP = 0.2;
function roomCam(u = 0) { look(lerp(0.2, 0.1, u), lerp(1.45, 1.4, u), lerp(4.6, 4.2, u), 0.1, 1.7, -1.0, 50); }
function sq(p, x, z, ry, k, t, shake) { stand(p, x, z, ry); squat(p, k, t, shake); }
function shot0(t) { // 0秒＝サムネ：1:00 のタイマーが走り出し、リビングでスクワットを始めた会社員の膝が、プルプル震える
  reset(); lift(0); const k = t < TP ? 0.25 : 0.25 + 0.45 * Math.abs(Math.sin((t - TP) * 1.6)); sq(ME, 0.25, -0.6, 1.1, k, t, t > TP ? 1 : 0);
  TIMER.userData.set(fmtMS(60 - Math.max(0, t - TP)), t > TP ? '#ff5a4a' : '#7dff8a'); if (t > TP) { setThighHeat(ME, clamp((t - TP) / 1.5) * 0.6); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; }
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 2階に上がるのにもエレベーターを待つ本人が、腰を落としたまま固まる
  reset(); lift(140); sq(SUIT, BX - 0.1, -0.6, 1.1, 0.55, t, 0.4); sweat2.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, BX + 0.4, 2.2, -0.6, 0.38);
  const u = ease(clamp(t / d)); look(BX + lerp(0.6, 0.4, u), 1.6, lerp(3.6, 3.2, u), BX + 0.1, 1.35, -1.0, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。運動はしたい。でも、時間がない
  reset(); lift(140); stand(SUIT, BX - 0.3, -0.8, 0); const ph = t / d; SUIT.userData.arms[1].rotation.set(-0.3, 0, 0.2);
  if (ph < 0.5) say(undou, t, 0.3, BX - 0.3, 2.35, -0.8, 0.85); else { SUIT.userData.head.rotation.x = 0.2; say(jikan, t, d * 0.5, BX - 0.3, 2.35, -0.8, 0.95); }
  look(BX + 0.2, 1.7, 3.8, BX, 1.5, -1.0, 50);
  return S;
}
function sDay1(t, d) { // 1日目。たった1分で、太ももが燃える
  reset(); lift(140); const k = 0.15 + 0.6 * Math.abs(Math.sin(t * 1.8)); sq(ME, 0.25, -0.6, 1.1, k, t, 1); const sec = Math.min(60, t / d * 60); TIMER.userData.set(fmtMS(60 - sec), '#ff5a4a');
  setThighHeat(ME, clamp(t / (d * 0.6))); if (t > d * 0.4) { sweat.userData.set(1, t); say(moeru, t, d * 0.45, 0.6, 2.25, -0.8, 0.9); }
  setHud('毎日1分スクワット', '1日目', 1);
  look(-0.1, 1.5, 3.8, -0.2, 1.35, -0.8, 50);
  return S;
}
function sWeek(t, d) { // 1週間後。駅で、エレベーターの前を通り過ぎて階段を上る
  reset(); lift(140); const k = clamp(t / d); const s = k * 10; const [y, z] = STAIRS.userData.at(s); stand(ME, CX - 0.6, -0.2 + z, Math.PI); ME.position.y = y; poseWalk(ME, t * 7, 0.8);
  if (t > d * 0.4) say(toori, t, d * 0.4, CX + 0.5, 3.3, -1.5, 1.05);
  setHud('毎日1分スクワット', '1週間後', 1);
  look(CX + 0.9, 3.0, 6.2, CX + 0.4, 1.4, -2.0, 50);
  return S;
}
function sTwoWeeks(t, d) { // 2週間後。ジムの会員カードを見ないふりをして、今日も1分
  reset(); lift(140); const k = 0.15 + 0.5 * Math.abs(Math.sin(t * 1.8)); sq(ME, 0.0, -0.6, 1.1, k, t, 0.3); ME.userData.head.rotation.y = -0.5; TIMER.userData.set(fmtMS(60 - (t * 4) % 60), '#ff5a4a');
  CARDL.visible = true; CARDL.position.set(1.2, 0.85, -1.0); CARDL.userData.size(0.75); if (t > d * 0.5) say(minai, t, d * 0.5, 0.4, 2.3, -0.8, 0.8);
  setHud('毎日1分スクワット', '2週間後', 1);
  look(0.0, 1.6, 4.0, -0.15, 1.3, -0.9, 50);
  return S;
}
function sImi(t, d) { // でも、1日1分で、意味はあるのか
  reset(); lift(140); stand(ME, 0.1, -0.6, 0.2); ME.userData.arms[1].rotation.set(-2.6, 0, 0.4); ME.userData.head.rotation.z = 0.12; Q.visible = true; Q.position.set(0.15, 2.35 + Math.sin(t * 3) * 0.04, -0.6);
  roomCam(0.7);
  return S;
}
function sGuide(t, d) { // 国の運動のガイドは、筋トレを週2〜3日すすめている（2023年）
  reset(); lift(300); GUIDE.visible = true;
  setTop('国の運動ガイド（2023年）', '筋トレ 週2〜3日', fade(t, 0.3, d, 0.25), BLUE);
  look(DX, 1.6, 2.6, DX, 1.6, -1.0, 50);
  return S;
}
function crowdCam(u = 0) { look(DX + lerp(0.5, 0.0, u), lerp(4.2, 3.6, u), lerp(7.5, 6.5, u), DX, 0.8, -3.5, 50); }
function barCam() { look(DX + 0.1, 1.4, 6.2, DX, 0.5, 0.6, 50); }
function bars(h2) { BARS.forEach((x, i) => { const h = i ? h2 : 1.6; x.b.visible = true; x.b.scale.y = Math.max(0.01, h); x.b.position.set(DX - 0.6 + i * 1.2, h / 2, 0.6); x.l.visible = true; x.l.position.set(DX - 0.6 + i * 1.2, h + 0.25, 0.7); x.l.userData.size(0.55); }); }
function sStudy(t, d) { // 16の研究をまとめると、筋トレを週30〜60分する人は
  reset(); lift(160); CROWD.forEach((p, i) => { p.visible = t > 0.2 + (i % 8) * 0.05; p.position.set(DX - 5.5 + (i % 8) * 1.55, 0, -1 - Math.floor(i / 8) * 1.5); });
  setTop('筋トレの研究のまとめ（2022年）', '16の研究', fade(t, 0.3, d, 0.25), BLUE);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function sRisk(t, d) { // 亡くなるリスクが、しない人より約10〜20%低かった。ただし観察研究
  reset(); lift(140); const ph = t / d; bars(lerp(1.6, 1.6 * 0.85, easeOut(clamp((ph - 0.2) / 0.3))));
  setTop('亡くなるリスク（2022年）', '約10〜20%低い', fade(t, 0.3, d, 0.25), GREEN); setHud('筋トレ 週30〜60分', 'しない人と比べる', 1);
  if (ph > 0.65) say(kansatsu, t, d * 0.65, DX, 2.4, 0.6, 0.6);
  barCam();
  return S;
}
function calCam() { look(DX, 1.45, 4.2, DX, 1.45, -1.0, 50); }
function cal(n) { CAL.forEach((c, i) => { c.visible = true; c.position.set(DX - 1.2 + (i % 7) * 0.4, 2.3 - Math.floor(i / 7) * 0.4, -1.0); }); DOT.forEach((m, i) => { m.visible = i < n; m.position.set(DX - 1.2 + (i % 7) * 0.4, 2.3 - Math.floor(i / 7) * 0.4, -0.97); }); }
function sMath(t, d) { // 1日1分なら、1か月で約30分。膝や腰が痛い人は、無理しないで
  reset(); lift(140); const ph = t / d; cal(Math.min(30, Math.floor(ph * 2.2 * 30)));
  setTop('1日1分 × 30日（単純計算）', '約30分', fade(t, 0.3, d, 0.25), GOLD);
  if (ph > 0.5) say(muri, t, d * 0.5, DX, 0.55, -0.6, 1.3);
  calCam();
  return S;
}
function sKekka(t, d) { // 結果：毎日1分は、続けるための入り口だった。研究の 週30〜60分 は、1日5分で届く
  reset(); lift(140); const ph = t / d;
  if (ph < 0.5) { const k = 0.15 + 0.55 * Math.abs(Math.sin(t * 1.8)); sq(ME, 0.25, -0.6, 1.1, k, t, 0.3); TIMER.userData.set(fmtMS(60 - (t * 6) % 60), '#7dff8a'); setTop('結果', '続けるための入り口', fade(t, 0.3, d * 0.5, 0.25), GOLD); look(-0.1, 1.5, 3.8, -0.2, 1.35, -0.8, 50); return S; }
  TIMER.userData.set('5:00', '#7dff8a'); sq(ME, 0.25, -0.6, 1.1, 0.15 + 0.55 * Math.abs(Math.sin(t * 1.8)), t, 0.3); setTop('週30〜60分は（単純計算）', '1日5分で届く', fade(t, d * 0.5, d, 0.25), GREEN); roomCam(0.5);
  return S;
}
function sAikotoba(t, d) { // 時間がない は、運動しない理由じゃなく、最初の1分を始めないための、合言葉だったのかもしれない
  reset(); lift(140); stand(ME, -1.6, -1.7, 0.2); poseSit(ME); ME.position.y = -0.39 + 0.05; ME.userData.knees.forEach(n => n.rotation.x = Math.PI / 2); ME.userData.arms[1].rotation.set(-1.3, 0, 0.2); ME.userData.head.rotation.x = 0.3;
  ME.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.15, 0.45); ME.localToWorld(v); PH.g.visible = true; PH.g.position.copy(v); PH.g.rotation.y = 0.2;
  if (t > d * 0.45) say(aikotoba, t, d * 0.45, -1.3, 2.2, -1.4, 1.1);
  const u = ease(clamp(t / d)); look(lerp(-0.6, -0.9, u), 1.6, lerp(2.4, 2.0, u), -1.4, 1.0, -1.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); sq(ME, 0.25, -0.6, 1.1, 0.55, t, 1); TIMER.userData.set('1:00', '#7dff8a'); roomCam(0); return S; }

const NARR = { '2階': 'にかい', '上がる': 'あがる', '待つ': 'まつ', '本人': 'ほんにん', '腰を落とした': 'こしをおとした', '固まる': 'かたまる', '言い分': 'いいぶん', '運動': 'うんどう', '時間': 'じかん', '1日目': 'いちにちめ', '1分': 'いっぷん', '太もも': 'ふともも', '燃える': 'もえる', '1週間後': 'いっしゅうかんご', '駅': 'えき', '通り過ぎて': 'とおりすぎて', '階段': 'かいだん', '上る': 'のぼる', '2週間後': 'にしゅうかんご', '会員カード': 'かいいんカード', '見ないふり': 'みないふり', '今日': 'きょう', '1日1分': 'いちにちいっぷん', '意味': 'いみ', '国': 'くに', '筋トレ': 'きんトレ', '週2〜3日': 'しゅうにからみっか', '16の研究': 'じゅうろくのけんきゅう', '週30〜60分': 'しゅうさんじゅっぷんからろくじゅっぷん', '亡くなる': 'なくなる', '約10〜20%': 'やくじゅっパーセントからにじゅっパーセント', '低かった': 'ひくかった', '観察研究': 'かんさつけんきゅう', '1か月': 'いっかげつ', '約30分': 'やくさんじゅっぷん', '膝': 'ひざ', '腰': 'こし', '痛い': 'いたい', '無理': 'むり', '結果：': '結果、', '毎日1分': 'まいにちいっぷん', '続ける': 'つづける', '入り口': 'いりぐち', '研究': 'けんきゅう', '1日5分': 'いちにちごふん', '届く': 'とどく', '理由': 'りゆう', '最初': 'さいしょ', '始めない': 'はじめない', '合言葉': 'あいことば', '何回': 'なんかい' };
const P = planTimes([
  ['2階に上がるのにも<br>エレベーターを待つ本人が、', (t, d) => sKatamaru(t, 2 * d)],
  ['腰を落としたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['本人の言い分から。', (t, d) => sIibun(t, 2 * d)],
  ['運動はしたい。<br>でも、時間がない。', (t, d) => sIibun(t + d, 2 * d)],
  ['1日目。たった1分で、<br>太ももが燃える。', sDay1],
  ['1週間後。駅で、エレベーターの<br>前を通り過ぎて階段を上る。', sWeek],
  ['2週間後。ジムの会員カードを', (t, d) => sTwoWeeks(t, 2 * d)],
  ['見ないふりをして、<br>今日も1分。', (t, d) => sTwoWeeks(t + d, 2 * d)],
  ['でも、1日1分で、<br>意味はあるのか。', sImi],
  ['国の運動のガイドは、<br>筋トレを週2〜3日', (t, d) => sGuide(t, 2 * d)],
  ['すすめている（2023年）。', (t, d) => sGuide(t + d, 2 * d)],
  ['16の研究をまとめると、<br>筋トレを週30〜60分する人は', sStudy],
  ['亡くなるリスクが、<br>しない人より', (t, d) => sRisk(t, 3 * d)],
  ['約10〜20%低かった。', (t, d) => sRisk(t + d, 3 * d)],
  ['ただし観察研究。', (t, d) => sRisk(t + 2 * d, 3 * d)],
  ['1日1分なら、<br>1か月で約30分。', (t, d) => sMath(t, 2 * d)],
  ['膝や腰が痛い人は、<br>無理しないで。', (t, d) => sMath(t + d, 2 * d)],
  ['結果：毎日1分は、<br>続けるための入り口だった。', (t, d) => sKekka(t, 2 * d)],
  ['研究の 週30〜60分 は、<br>1日5分で届く。', (t, d) => sKekka(t + d, 2 * d)],
  ['時間がない は、<br>運動しない理由じゃなく、', (t, d) => sAikotoba(t, 3 * d)],
  ['最初の1分を始めないための、', (t, d) => sAikotoba(t + d, 3 * d)],
  ['合言葉だったのかもしれない。', (t, d) => sAikotoba(t + 2 * d, 3 * d)],
  ['1分スクワット、<br>何回できる？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0751',
    v2: true,
    tt: 'main',
    hookLine: '1:00 のタイマーが走り出し、リビングでスクワットを始めた会社員の膝が、プルプル震える。',
    series: '人体の限界',
    hookType: 'H1',
    cat: '体・健康',
    title: 'もしも毎日1分のスクワットを1か月続けたら？',
    titleHtml: 'もしも毎日1分の<br>スクワットを<br>1か月続けたら？',
    mood: 'hopeful', seed: 751, hits: [TP, P.at(17), P.at(21)], risers: [P.at(8)], impacts: [P.at(9, 1.0), P.at(13, 0.3), P.at(15, 0.6)],
    sfx: [[TP, 'alarm'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.4), 'meter', 0.4], [P.at(5, 0.6), 'whoosh'], [P.at(16, 0.3), 'alarm']],
    narr: NARR,
    ask: '1分スクワット、何回できる？',
    caption: 'もしも毎日1分のスクワットを1か月続けたら？\n\n2階に上がるのにもエレベーターを待つ本人が、腰を落としたまま固まる。\n本人の言い分から。運動はしたい。でも、時間がない。\n1日目。たった1分で、太ももが燃える。\n1週間後。駅で、エレベーターの前を通り過ぎて階段を上る。\n2週間後。ジムの会員カードを見ないふりをして、今日も1分。\nでも、1日1分で、意味はあるのか。\n国の運動のガイドは、筋トレを週2〜3日すすめている（2023年）。\n16の研究をまとめると、筋トレを週30〜60分する人は、亡くなるリスクが、しない人より約10〜20%低かった。ただし観察研究。\n1日1分なら、1か月で約30分（単純計算）。膝や腰が痛い人は、無理しないで。\n\n結果：毎日1分は、続けるための入り口だった。研究の 週30〜60分 は、1日5分で届く（単純計算）。\n時間がない は、運動しない理由じゃなく、最初の1分を始めないための、合言葉だったのかもしれない。\n\n1分スクワット、何回できる？ コメントで教えて。\n\n※研究は観察研究で、スクワットだけの研究ではありません。膝や腰が痛い人は無理しないでください。登場する人物・ジムは架空です\n出典：厚生労働省 健康づくりのための身体活動・運動ガイド2023（成人 筋力トレーニング週2〜3日）／Momma ほか British Journal of Sports Medicine 2022年（16の研究のメタ分析、週30〜60分でリスク約10〜20%低い）',
    hashtags: ['もしもラボ', 'もしも', 'スクワット', '筋トレ', '人体の限界'],
    endStats: [['国のおすすめ', '筋トレ 週2〜3日', '厚生労働省 2023'], ['週30〜60分の人のリスク', '約10〜20%低い', '2022年・観察研究'], ['週30〜60分に届くのは', '1日5分', '単純計算']],
    sources: '出典：厚生労働省 身体活動・運動ガイド2023／Momma ほか Br J Sports Med 2022<br>※観察研究。膝や腰が痛い人は無理しない',
  },
});
