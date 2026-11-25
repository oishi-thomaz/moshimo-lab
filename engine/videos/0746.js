import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { makeSuit, makeChair, makeDeskIsland, poseClear, poseSit, poseSlump, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeAlarm } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも求人票に、ウソが書けなくなったら？（皮肉回・台本 S145・図星／大人の本音）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。アットホームな職場・残業ほぼなし と書いて毎日終電まで働かせる社長の求人票が 毎日終電 に書き換わる回。後半で 経歴を盛る応募者 にも返す
// 数字（一次資料で確認・2026/11/25）：職業安定法の改正（令和4年法律第12号）で、令和4年10月1日から求人等に関する情報の的確な表示が義務化。
//  募集する人は、虚偽の表示・誤解を生じさせる表示をしてはならず、正確かつ最新の内容に保たなければならない（厚生労働省 職業安定法の改正・改正のポイント）。罰の中身・件数・残業時間の統計は使わない
// 実在の会社・求人サイト・ロゴは出さない（架空の もしも商事）。働く人や応募者をばかにしない（叩くのは 盛る ふるまい）

const GOLD = '#ffd27a', RED = '#ff8a7a', BLUE = '#7fc8ff', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#2c3040', ground: '#4a4a52' }); hemi.intensity = 1.3;
const BOSS = makeSuit({ old: true, bald: true, jacket: '#3a3030', tie: '#c8a030' }); S.add(BOSS); const sweatB = makeSweat(); BOSS.userData.head.add(sweatB);
const APP = makeSuit({ jacket: '#2a3448', tie: '#3a6ab2' }); S.add(APP); const sweatA = makeSweat(); APP.userData.head.add(sweatA);
const WORKERS = [makeSuit({ jacket: '#3a4256' }), makeSuit({ woman: true }), makeSuit({ jacket: '#4a4a5a', tie: '#3a8a5a' }), makeSuit({ woman: true, jacket: '#5a4a5a' })]; WORKERS.forEach(p => S.add(p));

// ---------- A：面接室（原点） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#e8e4dc', floor: '#9a8a74' });
const DESK = makeTable({ w: 1.6, d: 0.8, color: '#8a6a4a' }); DESK.position.set(0, 0, -0.6); S.add(DESK);
const CH1 = makeChair(); S.add(CH1); const CH2 = makeChair(); S.add(CH2);
const JOB = makeDoc({ title: '求人票 もしも商事', rows: ['職場', '残業', '若手', '経験'], head: '#2a6a9a', w: 1.5, h: 2.0 }); S.add(JOB);
const JOBV = { 職場: 'アットホームな職場', 残業: 'ほぼなし', 若手: '若手が活躍中', 経験: '未経験歓迎' };
const sparkJ = makeSparkles(150, 0.1, 0xffe08a); S.add(sparkJ.points); sparkJ.init([[0, 1.75, 0.2]], 0.6, 0.6);
const kakikawari = label('毎日終電', { w: 640, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.8 }); S.add(kakikawari);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const RESUME = makeDoc({ title: '履歴書', rows: ['名前', '経験'], head: '#5a5a5a', w: 1.3, h: 1.4 }); S.add(RESUME);
const demo = label('ウソが書けないのは 社長だけじゃない', { w: 1300, size: 80, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(demo);
const housou = label('残業を包む 包装紙', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.05 }); S.add(housou);

// ---------- B：夜のオフィス（x=60） ----------
const BX = 60;
room({ x: BX, w: 8, d: 6, h: 3.2, wall: '#cfd4dc', floor: '#7a808a' });
const ISLAND = makeDeskIsland(2); ISLAND.position.set(BX, 0, -0.8); S.add(ISLAND);
const CLOCK = makeAlarm(); CLOCK.scale.setScalar(1.3); CLOCK.position.set(BX - 0.4, 2.1, -2.9); S.add(CLOCK);
const shuden = label('入社3日目で 終電', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.05 }); S.add(shuden);
const hobonashi = label('残業 ほぼなし？', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(hobonashi);
const kaeru = label('終電の前に 全員帰る', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.15 }); S.add(kaeru);

// ---------- C：面接の待合（x=120） ----------
const CX = 120;
room({ x: CX, w: 8, d: 5, h: 3, wall: '#e8e4dc', floor: '#9a8a74' });
const WCH = []; for (let i = 0; i < 6; i++) { const c = makeChair(); c.position.set(CX - 2.0 + i * 0.8, 0, -1.2); S.add(c); WCH.push(c); }
const SIGN = label('面接会場', { w: 640, size: 110, color: '#fff', bg: 'rgba(42,106,154,.97)', sx: 0.8 }); S.add(SIGN);
const konai = label('応募が 来ない', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.9 }); S.add(konai);
const LAW = makeDoc({ title: '職業安定法', rows: ['いつから', '求人の情報'], head: '#2a3a5a', w: 1.5, h: 1.5 }); LAW.userData.fill(0, '2022年10月'); LAW.userData.fill(1, '正確に出す'); S.add(LAW);

const PEOPLE = [BOSS, APP, ...WORKERS];
const LABELS = [kakikawari, katamaru, demo, housou, shuden, hobonashi, kaeru, SIGN, konai];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkJ.set(0); el.flash.style.opacity = 0; sweatB.userData.set(0); sweatA.userData.set(0);
  JOB.visible = false; RESUME.visible = false; LAW.visible = false; CH1.visible = false; CH2.visible = false; hemi.intensity = 1.3;
  Object.entries(JOBV).forEach(([k, v], i) => JOB.userData.fill(i, v)); RESUME.userData.fill(0, 'もしも 太郎'); RESUME.userData.fill(1, 'リーダー経験あり');
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function seat(p, x, z, ry, ch) { stand(p, x, z, ry); poseSit(p); if (ch) { ch.visible = true; ch.position.set(x - Math.sin(ry) * 0.1, 0, z - Math.cos(ry) * 0.1); ch.rotation.y = ry; } }
const TP = 0.3;
function interview(hand = 1) { seat(BOSS, -1.0, -0.6, Math.PI / 2, CH1); BOSS.userData.arms[1].rotation.set(-1.4 * hand, 0, 0); seat(APP, 1.0, -0.6, -Math.PI / 2, CH2); APP.userData.arms.forEach(a => a.rotation.set(-0.7, 0, 0)); }
function jobAt(x, y, z, s = 1, ry = 0) { JOB.visible = true; JOB.position.set(x, y, z); JOB.scale.setScalar(s); JOB.rotation.set(0, ry, 0); }
function roomCam(u = 0) { look(lerp(0.15, 0.05, u), lerp(1.5, 1.45, u), lerp(4.6, 4.2, u), 0, 1.5, -0.6, 50); }
function shot0(t) { // 0秒＝サムネ：求人票の アットホームな職場 の文字が、パッと 毎日終電 に書き換わる
  reset(); lift(0); interview(); jobAt(0, 1.0, -0.3, 0.72);
  if (t >= TP) { JOB.userData.fill(0, '毎日終電'); JOB.userData.fill(1, '毎日終電まで'); sparkJ.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; say(kakikawari, t, TP + 0.1, 0.55, 0.75, 0.2, 0.7); }
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 面接で求人票を差し出した社長が、手を伸ばしたまま固まる
  reset(); lift(140); interview(); jobAt(-0.2, 1.3, -0.3, 0.6, 0.3); JOB.userData.fill(0, '毎日終電'); JOB.userData.fill(1, '毎日終電まで'); sweatB.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, -1.0, 2.0, -0.6, 0.38);
  const u = ease(clamp(t / d)); look(lerp(-0.2, -0.4, u), 1.55, lerp(3.4, 3.0, u), -0.6, 1.2, -0.6, 50);
  return S;
}
function officeCam(u = 0) { look(BX + lerp(2.2, 2.0, u), 2.7, lerp(4.6, 4.2, u), BX, 1.1, -1.2, 50); }
function workers(slump = 0.6) { const seats = ISLAND.userData.seats; WORKERS.forEach((p, i) => { const s = seats[i]; p.visible = true; p.position.set(BX + s.x, 0, -0.8 + s.z); p.rotation.y = s.ry; poseSlump(p, slump); }); }
function sFuman(t, d) { // 転職した人たちの不満から。残業ほぼなし のはずが、入社3日目で終電
  reset(); lift(140); hemi.intensity = 0.8; const ph = t / d; workers(ph > 0.5 ? 0.8 : 0.3); CLOCK.userData.set(ph > 0.5 ? '23:50' : '18:00', ph > 0.5 ? '#ff5a4a' : '#7dff8a');
  if (ph < 0.5) say(hobonashi, t, 0.3, BX - 0.4, 2.85, -2.2, 1.0); else say(shuden, t, d * 0.5, BX - 0.4, 2.85, -2.2, 1.05);
  officeCam(ease(clamp(t / d)));
  return S;
}
function docCam(u = 0) { look(lerp(0.1, 0.0, u), 1.6, lerp(4.6, 4.3, u), 0, 1.6, -0.3, 50); }
function sSheet(row, oldV, newV, n) { return (t, d) => { reset(); lift(290); jobAt(0, 1.6, -0.3, 1.0); const ph = t / d;
  if (row > 0) JOB.userData.fill(0, '社長の飲み会は全員参加'); if (row > 2) JOB.userData.fill(2, 'すぐ辞めるので いつも募集中');
  JOB.userData.fill(row, ph < 0.4 ? oldV : newV); if (ph >= 0.4) { el.flash.style.opacity = ph < 0.43 ? 0.2 : 0; }
  setHud('ウソが書けない求人票', n, 1); docCam(ease(clamp(t / d))); return S; }; }
function sDemo(t, d) { // でも、ウソが書けなくなったのは、社長だけじゃなかった
  reset(); lift(140); interview(0); APP.userData.arms[1].rotation.set(-1.3, 0, 0); RESUME.visible = true; RESUME.position.set(0.35, 1.25, -0.4); RESUME.scale.setScalar(0.6); RESUME.rotation.set(0, -0.3, 0);
  if (t > d * 0.35) say(demo, t, d * 0.35, 0, 2.35, -0.6, 1.4);
  roomCam(0.6);
  return S;
}
function sResume(t, d) { // 面接で リーダー経験あり と言った応募者の履歴書も、飲み会の幹事 1回 に変わる
  reset(); lift(290); const ph = t / d; RESUME.visible = true; RESUME.position.set(0, 1.6, -0.3); RESUME.scale.setScalar(1.3); RESUME.rotation.set(0, 0, 0);
  if (ph > 0.55) { RESUME.userData.fill(1, '飲み会の幹事 1回'); el.flash.style.opacity = ph < 0.58 ? 0.2 : 0; }
  stand(APP, 1.1, -0.9, -0.3); if (ph > 0.55) sweatA.userData.set(1, t);
  look(0.3, 1.6, 4.2, 0.3, 1.6, -0.4, 50);
  return S;
}
function sLaw(t, d) { // 実は2022年10月から、求人の情報は 正確に出す のが法律の決まり（職業安定法）
  reset(); lift(140); LAW.visible = true; LAW.position.set(CX, 1.6, -2.38); jobAt(CX - 1.5, 1.4, -2.3, 0.7);
  setTop('職業安定法（2022年10月〜）', '求人は 正確に', fade(t, 0.3, d, 0.25), BLUE);
  look(CX - 0.6, 1.6, 2.4, CX - 0.6, 1.5, -2.3, 50);
  return S;
}
function sKonai(t, d) { // 本当のことしか書けない会社に、応募が来なくなる
  reset(); lift(140); SIGN.visible = true; SIGN.position.set(CX, 2.4, -2.3); SIGN.userData.size(0.75); stand(BOSS, CX + 2.4, -0.4, -0.8); sweatB.userData.set(1, t);
  if (t > d * 0.45) say(konai, t, d * 0.45, CX, 1.75, -1.0, 0.9);
  look(CX + 0.3, 1.8, 4.6, CX + 0.3, 1.2, -1.2, 50);
  return S;
}
function sKaeru(t, d) { // 社長は、人を集めるために、まず終電の前に全員を帰らせる
  reset(); lift(140); const ph = t / d; CLOCK.userData.set('18:00', '#7dff8a');
  if (ph < 0.4) { workers(0.2); stand(BOSS, BX + 1.5, -0.1, -0.9); BOSS.userData.arms[1].rotation.set(-1.4, 0, 0.3); }
  else { stand(BOSS, BX + 1.5, -0.1, -0.9); BOSS.userData.arms[1].rotation.set(-0.3, 0, 0.6 + Math.sin(t * 5) * 0.3); const k = (ph - 0.4) / 0.6; WORKERS.forEach((p, i) => { stand(p, BX - 1.2 + i * 0.5 + k * 0.5, 0.8 + k * 1.2, Math.PI * 0.1); poseWalk(p, t * 7 + i, 0.8); }); say(kaeru, t, d * 0.45, BX - 0.4, 2.85, -2.2, 1.1); }
  officeCam(0.5);
  return S;
}
function sKekka(t, d) { // 結果：ウソが書けなくなって、困ったのは求人票を盛っていた会社だった。人を集めるには、本当に残業を減らすしかなかった
  reset(); lift(140); const ph = t / d;
  if (ph < 0.6) { SIGN.visible = true; SIGN.position.set(CX, 2.4, -2.3); SIGN.userData.size(0.75); stand(BOSS, CX + 0.8, -0.4, -0.3); sweatB.userData.set(1, t); setTop('結果', '困ったのは 盛った会社', fade(t, 0.3, d * 0.6, 0.25), GOLD); look(CX + 0.3, 1.8, 4.6, CX + 0.3, 1.2, -1.2, 50); return S; }
  CLOCK.userData.set('18:00', '#7dff8a'); stand(BOSS, BX + 1.5, -0.1, -0.9); setTop('人を集めるには', '残業を 減らすしかない', fade(t, d * 0.6, d, 0.25), GREEN); officeCam(0.3);
  return S;
}
function sHousou(t, d) { // アットホームな職場 は、職場の空気じゃなく、残業の多さを包む、包装紙だったのかもしれない
  reset(); lift(140); interview(); jobAt(-0.2, 1.3, -0.3, 0.6, 0.3); JOB.userData.fill(0, '毎日終電'); BOSS.userData.head.rotation.x = 0.3;
  if (t > d * 0.45) say(housou, t, d * 0.45, 0, 2.35, -0.6, 1.05);
  roomCam(0.4 + 0.6 * ease(clamp(t / d)));
  return S;
}
function sAsk(t) { reset(); lift(0); interview(); jobAt(0, 1.45, -0.3, 0.85); JOB.userData.fill(0, '毎日終電'); JOB.userData.fill(1, '毎日終電まで'); roomCam(0); return S; }

const NARR = { '面接': 'めんせつ', '求人票': 'きゅうじんひょう', '差し出した': 'さしだした', '社長': 'しゃちょう', '手を伸ばした': 'てをのばした', '固まる': 'かたまる', '転職': 'てんしょく', '不満': 'ふまん', '残業': 'ざんぎょう', '入社3日目': 'にゅうしゃみっかめ', '終電': 'しゅうでん', '1枚目': 'いちまいめ', '飲み会': 'のみかい', '全員参加': 'ぜんいんさんか', '変わる': 'かわる', '2枚目': 'にまいめ', '若手': 'わかて', '活躍中': 'かつやくちゅう', '辞める': 'やめる', '募集中': 'ぼしゅうちゅう', '3枚目': 'さんまいめ', '未経験歓迎': 'みけいけんかんげい', '教える人': 'おしえるひと', '書けなくなった': 'かけなくなった', '経験': 'けいけん', '応募者': 'おうぼしゃ', '履歴書': 'りれきしょ', '幹事': 'かんじ', '1回': 'いっかい', '実は': 'じつは', '2022年10月': 'にせんにじゅうにねんじゅうがつ', '求人の情報': 'きゅうじんのじょうほう', '正確': 'せいかく', '法律': 'ほうりつ', '決まり': 'きまり', '本当': 'ほんとう', '会社': 'かいしゃ', '応募': 'おうぼ', '来なくなる': 'こなくなる', '集める': 'あつめる', '全員': 'ぜんいん', '帰らせる': 'かえらせる', '結果：': '結果、', '困った': 'こまった', '盛っていた': 'もっていた', '減らす': 'へらす', '職場': 'しょくば', '空気': 'くうき', '多さ': 'おおさ', '包む': 'つつむ', '包装紙': 'ほうそうし', '全然': 'ぜんぜん' };
const P = planTimes([
  ['面接で求人票を<br>差し出した社長が、', (t, d) => sKatamaru(t, 2 * d)],
  ['手を伸ばしたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['転職した人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['残業ほぼなし のはずが、<br>入社3日目で終電。', (t, d) => sFuman(t + d, 2 * d)],
  ['1枚目。アットホーム が、', (t, d) => sSheet(0, 'アットホームな職場', '社長の飲み会は全員参加', '1枚目')(t, 2 * d)],
  ['社長の飲み会は<br>全員参加 に変わる。', (t, d) => sSheet(0, 'アットホームな職場', '社長の飲み会は全員参加', '1枚目')(t + d, 2 * d)],
  ['2枚目。若手が活躍中 が、', (t, d) => sSheet(2, '若手が活躍中', 'すぐ辞めるので いつも募集中', '2枚目')(t, 2 * d)],
  ['すぐ辞めるので いつも募集中<br>に変わる。', (t, d) => sSheet(2, '若手が活躍中', 'すぐ辞めるので いつも募集中', '2枚目')(t + d, 2 * d)],
  ['3枚目。未経験歓迎 が、<br>教える人がいません に変わる。', sSheet(3, '未経験歓迎', '教える人がいません', '3枚目')],
  ['でも、ウソが<br>書けなくなったのは、', (t, d) => sDemo(t, 2 * d)],
  ['社長だけじゃなかった。', (t, d) => sDemo(t + d, 2 * d)],
  ['面接で リーダー経験あり<br>と言った応募者の履歴書も、', (t, d) => sResume(t, 2 * d)],
  ['飲み会の幹事 1回 に変わる。', (t, d) => sResume(t + d, 2 * d)],
  ['実は2022年10月から、<br>求人の情報は', (t, d) => sLaw(t, 2 * d)],
  ['正確に出す のが法律の決まり<br>（職業安定法）。', (t, d) => sLaw(t + d, 2 * d)],
  ['本当のことしか書けない<br>会社に、応募が来なくなる。', sKonai],
  ['社長は、人を集めるために、', (t, d) => sKaeru(t, 2 * d)],
  ['まず終電の前に<br>全員を帰らせる。', (t, d) => sKaeru(t + d, 2 * d)],
  ['結果：ウソが書けなくなって、', (t, d) => sKekka(t, 3 * d)],
  ['困ったのは求人票を<br>盛っていた会社だった。', (t, d) => sKekka(t + d, 3 * d)],
  ['人を集めるには、本当に<br>残業を減らすしかなかった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['アットホームな職場 は、<br>職場の空気じゃなく、', (t, d) => sHousou(t, 3 * d)],
  ['残業の多さを包む、', (t, d) => sHousou(t + d, 3 * d)],
  ['包装紙だったのかもしれない。', (t, d) => sHousou(t + 2 * d, 3 * d)],
  ['求人票と、<br>全然ちがった職場ある？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0746',
    v2: true,
    tt: 'main',
    hookLine: '求人票の アットホームな職場 の文字が、パッと 毎日終電 に書き換わる。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも求人票に、ウソが書けなくなったら？',
    titleHtml: 'もしも求人票に、<br>ウソが書け<br>なくなったら？',
    mood: 'tension', seed: 746, hits: [TP, P.at(18), P.at(23)], risers: [P.at(9)], impacts: [P.at(12, 0.5), P.at(14, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.25], [P.at(3, 0.8), 'alarm'], [P.at(4, 0.6), 'whoosh'], [P.at(6, 0.3), 'whoosh'], [P.at(8, 1.0), 'whoosh'], [P.at(12, 0.6), 'poof'], [P.at(17, 0.5), 'bubble']],
    narr: NARR,
    ask: '求人票と、全然ちがった職場ある？',
    caption: 'もしも求人票に、ウソが書けなくなったら？\n\n面接で求人票を差し出した社長が、手を伸ばしたまま固まる。\n転職した人たちの不満から。残業ほぼなし のはずが、入社3日目で終電。\n1枚目。アットホーム が、社長の飲み会は全員参加 に変わる。\n2枚目。若手が活躍中 が、すぐ辞めるので いつも募集中 に変わる。\n3枚目。未経験歓迎 が、教える人がいません に変わる。\nでも、ウソが書けなくなったのは、社長だけじゃなかった。\n面接で リーダー経験あり と言った応募者の履歴書も、飲み会の幹事 1回 に変わる。\n実は2022年10月から、求人の情報は 正確に出す のが法律の決まり（職業安定法）。\n本当のことしか書けない会社に、応募が来なくなる。\n社長は、人を集めるために、まず終電の前に全員を帰らせる。\n\n結果：ウソが書けなくなって、困ったのは求人票を盛っていた会社だった。人を集めるには、本当に残業を減らすしかなかった。\nアットホームな職場 は、職場の空気じゃなく、残業の多さを包む、包装紙だったのかもしれない。\n\n求人票と、全然ちがった職場ある？ コメントで教えて。\n\n※風刺ネタです。求人票にウソが書けなくなるのは、もしもの設定です。会社・登場する人物は架空です\n出典：厚生労働省 職業安定法の改正（令和4年10月1日から 求人等に関する情報の的確な表示の義務化）',
    hashtags: ['もしもラボ', 'もしも', '求人票', '転職', '大人の本音'],
    endStats: [['求人の的確な表示', '2022年10月〜', '職業安定法・厚生労働省'], ['困ったのは', '求人票を盛った会社', 'もしもの結果'], ['アットホームの正体', '残業を包む包装紙', 'かもしれない']],
    sources: '出典：厚生労働省 職業安定法の改正（2022年10月施行）<br>※風刺ネタです（会社・人物は架空）',
  },
});
