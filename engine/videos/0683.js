import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson, SKIN } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { addKnees, fitReset, planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしも毎日、床から手をつかずに立つ練習を1か月続けたら？（人体の限界・台本 S83）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/13 の解析の種（0654 片足立ち インスタ21時間で約9倍）
// 数字（一次資料で確認・2026/11/14）：Brito LBB ほか Eur J Prev Cardiol 2014;21(7):892-898（ESC のプレスリリースで確認）
//  51〜80歳 2,002人・追跡の中央値6.3年・座って立つテスト 0〜10点（支えを1回使うごとに1点引く）
//  0〜3点の人は 8〜10点の人に比べて 死亡リスク 5〜6倍（HR 5.44）／1点上がるごとに 死亡が21%低い
//  関連であって 練習で下がる とは言わない（画面に 観察研究 と出す）。1か月の上達は筋の中の話。転びやすい人は無理をしない を出す

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#d8d0c4' }); hemi.intensity = 1.3;
const CHU = makeOji(rng(83), { shirt: '#c9c2b0' }); addKnees(CHU); S.add(CHU); // 体はまだ20代のつもりの中年
const WAKA = makeMan({ shirt: '#3f8f6b', hair: '#2c2421' }); addKnees(WAKA); S.add(WAKA);

// 床から立つ：k 0 あぐら → 1 立つ。hand / knee で手と膝をつく
function rise(p, k, { hand = 0, knee = 0, t = 0 } = {}) {
  const U = p.userData; fitReset(p);
  const e = ease(clamp(k)); const mid = Math.sin(clamp(k) * Math.PI);
  p.position.y = lerp(-0.72, 0, e) - knee * 0.25 * mid;
  U.legs[0].rotation.set(lerp(-1.45, 0, e), 0, lerp(-0.55, 0, e)); U.legs[1].rotation.set(lerp(-1.45, 0, e) - knee * 0.4 * mid, 0, lerp(0.55, 0, e));
  U.knees[0].rotation.x = lerp(2.5, 0, e) + mid * 0.6; U.knees[1].rotation.x = lerp(2.5, 0, e) + mid * (0.6 + knee * 1.2);
  p.rotation.x = mid * (0.35 + hand * 0.25);
  if (hand) { U.arms[0].rotation.set(-0.5 * hand * mid - 0.2, 0, -0.35 * hand); U.arms[1].rotation.set(-0.5 * hand * mid - 0.2, 0, 0.35 * hand); }
  else { U.arms[0].rotation.set(-1.2 * mid, 0, -0.3 * mid); U.arms[1].rotation.set(-1.2 * mid, 0, 0.3 * mid); }
}

// ---------- A：リビング（原点） ----------
const roomA = room({ x: 0, w: 8, d: 6, h: 3, wall: '#efe6d6', floor: '#b48a5e' });
const rug = flat(2.6, 2.0, '#c0504a', 0, -0.6, -0.7, 0.012);
const sofa = new THREE.Group(); { const sm = mat('#6a7a8a'); const a = box(2.2, 0.45, 0.9, sm); a.position.y = 0.23; sofa.add(a); const b = box(2.2, 0.6, 0.25, sm); b.position.set(0, 0.75, -0.35); sofa.add(b); } sofa.position.set(1.9, 0, -1.9); S.add(sofa);
const yokkoi = label('よっこいしょ', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.0 }); S.add(yokkoi);
const TE = label('手', { w: 256, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.36 }); S.add(TE);
const pupu = label('ぷっ', { w: 384, size: 120, color: '#fff', bg: 'rgba(63,178,122,.97)', sx: 0.42 }); S.add(pupu);
const nijudai = label('体はまだ 20代', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.4 }); S.add(nijudai);
const COUNT = label('手 1回・膝 1回', { w: 900, size: 100, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.4 }); S.add(COUNT);
const sparkA = makeSparkles(120, 0.14, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0, 1.8, -0.6]], 0.8, 1.2);
const nazeLab = label('なぜ大事？', { w: 640, size: 110, color: '#fff', bg: 'rgba(90,138,232,.96)', sx: 1.0 }); S.add(nazeLab);

// ---------- B：研究（x=60）：2,000人と10点 ----------
const BX = 60;
flat(30, 20, '#3a3448', BX, -2);
const CROWD = []; { const r = rng(7); for (let i = 0; i < 48; i++) { const p = r() < 0.5 ? makeWoman({ shirt: ['#e05a4f', '#4fa3d1', '#f2c14e', '#8e6bbf', '#e9e4da'][i % 5], hair: ['#9a9a9a', '#c8c8c8', '#6b4a33'][i % 3] }) : makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#d97a3a', '#59606e', '#c94f7c'][i % 5], hair: ['#9a9a9a', '#c8c8c8', '#4a3426'][i % 3], bald: r() < 0.3 }); addKnees(p); p.position.set(BX - 5.5 + (i % 8) * 1.55 + (r() - 0.5) * 0.3, 0, -1 - Math.floor(i / 8) * 1.5); p.userData.ph = r() * 6; S.add(p); CROWD.push(p); } }
const SCORE = label('10点', { w: 640, size: 160, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.2 }); S.add(SCORE);
const MINUS = [0, 1].map(i => { const l = label(['手 −1点', '膝 −1点'][i], { w: 640, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(l); return l; });

// ---------- C：比べる（x=120）：0〜3点と8〜10点 ----------
const CX = 120;
flat(20, 14, '#2a3040', CX, -1);
const cwall = box(20, 6, 0.2, mat('#323a4e')); cwall.position.set(CX, 3, -3.5); S.add(cwall);
const BAR_LO = box(1.0, 1, 1.0, mat('#ff6a5a')); S.add(BAR_LO);
const BAR_HI = box(1.0, 1, 1.0, mat('#5ac88a')); S.add(BAR_HI);
const labLo = label('0〜3点', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(labLo);
const labHi = label('8〜10点', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(labHi);
const kansatsu = label('観察研究', { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.9 }); S.add(kansatsu);

// ---------- D：いちばん安い検査（リビングを使う） ----------
const zeroen = label('検査代 0円', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(zeroen);
const muri = label('転びやすい人は 無理しないで', { w: 1100, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.9 }); S.add(muri);
const wakaranai = label('寿命がのびるかは 不明', { w: 1024, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.7 }); S.add(wakaranai);

const LABELS = [yokkoi, TE, pupu, nijudai, COUNT, nazeLab, SCORE, ...MINUS, labLo, labHi, kansatsu, zeroen, muri, wakaranai];
function reset() {
  fitReset(CHU); fitReset(WAKA); CHU.visible = true; WAKA.visible = true; CROWD.forEach(p => p.visible = false);
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0;
  CHU.position.set(0.25, 0, -0.5); CHU.rotation.set(0, 0.3, 0);
  WAKA.position.set(1.7, 0, -1.75); WAKA.rotation.set(0, -0.5, 0); sitSofa(WAKA);
  BAR_LO.visible = BAR_HI.visible = false;
}
function sitSofa(p) { const U = p.userData; U.legs.forEach(l => l.rotation.x = -Math.PI / 2); U.knees.forEach(k => k.rotation.x = Math.PI / 2); p.position.y = -0.4; }
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function roomCam(u = 0) { look(lerp(0.75, 0.7, u), lerp(1.75, 1.7, u), lerp(3.3, 3.1, u), 0.75, lerp(1.05, 1.0, u), -1.0, 50); }
function shot0(t) { // 0秒＝サムネ：床にあぐらの中年が、手をつかずに立とうとして、よっこいしょで手が床に出る
  reset(); lift(0); const k = clamp(t / 0.6) * 0.35; rise(CHU, k, { hand: t > TP ? 1 : 0 });
  if (t > TP) { say(TE, t, TP, -0.05, 0.6, -0.2, 0.32); el.flash.style.opacity = t < TP + 0.1 ? 0.25 : 0; }
  WAKA.userData.head.rotation.y = 0.4;
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sWaka(t, d) { // 横で若手が、笑いをこらえて目をそらす
  reset(); lift(120); rise(CHU, 0.35, { hand: 1 }); WAKA.userData.head.rotation.y = t < d * 0.4 ? 0.4 : -0.6; WAKA.userData.arms[1].rotation.set(-2.4, 0, 0.3);
  if (t > d * 0.3) say(pupu, t, d * 0.3, 1.7, 1.75, -1.6, 0.4);
  const u = ease(clamp(t / d)); look(lerp(1.3, 1.1, u), 1.55, lerp(1.0, 0.6, u), 1.6, 1.15, -1.8, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。体はまだ、20代のつもり
  reset(); lift(120); rise(CHU, 0); CHU.userData.arms[1].rotation.set(-2.3, 0, 0.2); CHU.userData.head.rotation.x = -0.1;
  if (t > 0.5) say(nijudai, t, 0.5, 0.25, 1.35, -0.5, 1.0);
  look(0.55, 1.25, 2.1, 0.25, 0.75, -0.6, 50);
  return S;
}
function stepShot(i) { // 1日目・1週間後・1か月後
  return (t, d) => {
    reset(); lift(120); const k = clamp((t - 0.3) / (d * 0.7));
    const hand = i === 0 ? 1 : 0, knee = i < 2 ? 1 : 0; rise(CHU, k, { hand, knee });
    COUNT.userData.set(['手 1回・膝 1回', '手 0回・膝 1回', '手 0回・膝 0回'][i]); COUNT.material.color.set(i === 2 ? '#bff0c8' : '#ffffff');
    if (t > d * 0.5) say(COUNT, t, d * 0.5, 0.25, 1.95, -0.6, 1.2);
    if (i === 2 && k >= 1) { sparkA.init([[0.25, 1.8, -0.6]], 0.8, 1.2); sparkA.set(clamp((t - 0.3 - d * 0.7) / 1.2)); }
    setHud('床から立つ練習', ['1日目', '1週間後', '1か月後'][i], 1);
    const u = ease(clamp(t / d)); look(lerp(1.85, 1.65, u), 1.5, lerp(2.4, 2.2, u), 0.25, 1.0, -0.6, 50);
    return S;
  };
}
function sNaze(t, d) { // でも、床から立てるかどうかが、なぜ大事なのか
  reset(); lift(120); rise(CHU, 1); CHU.userData.head.rotation.x = 0.25;
  if (t > d * 0.35) say(nazeLab, t, d * 0.35, 0.25, 2.3, -0.6, 0.9);
  const u = ease(clamp(t / d)); look(lerp(0.85, 1.25, u), lerp(1.9, 2.6, u), lerp(2.6, 3.8, u), 0.25, 1.1, -0.6, 50);
  return S;
}
function crowdCam(u = 0) { look(BX + lerp(0.5, 0.0, u), lerp(4.2, 3.6, u), lerp(7.5, 6.5, u), BX, 0.8, -3.5, 50); }
function sStudy(t, d) { // 51〜80歳の約2,000人に、床に座って立つテストをした研究がある
  reset(); lift(160); CHU.visible = false; WAKA.visible = false;
  CROWD.forEach((p, i) => { p.visible = true; const k = clamp((t - 0.6 - (i % 8) * 0.12) / 1.4); rise(p, (Math.sin(t * 1.5 + p.userData.ph) * 0.5 + 0.5) * k); p.position.x = BX - 5.5 + (i % 8) * 1.55; });
  setTop('座って立つテストの研究（2014年）', '約2,000人', fade(t, 0.4, d, 0.25), BLUE); setHud('対象', '51〜80歳', 1);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function sScore(t, d) { // 10点満点。手や膝を1回つくごとに1点引く
  reset(); lift(160); CHU.position.set(BX, 0, 1.0); CHU.rotation.y = 0; WAKA.visible = false;
  const k = clamp((t - 0.3) / (d * 0.8)); rise(CHU, k, { hand: 1, knee: 1 });
  const n = 10 - (t > d * 0.45 ? 1 : 0) - (t > d * 0.7 ? 1 : 0); SCORE.userData.set(n + '点');
  say(SCORE, t, 0.2, BX, 2.35, 1.0, 0.9);
  if (t > d * 0.45) say(MINUS[0], t, d * 0.45, BX - 0.75, 1.85, 1.0, 0.7); if (t > d * 0.7) say(MINUS[1], t, d * 0.7, BX + 0.75, 1.85, 1.0, 0.7);
  look(BX + 0.4, 2.0, 5.8, BX, 1.3, 1.0, 50);
  return S;
}
const BY = 2.2;
const stand = box(4.6, BY, 1.4, mat('#4a5266')); stand.position.set(CX, BY / 2, -1.2); S.add(stand);
function barCam(u = 0) { look(CX + lerp(0.3, 0, u), 3.2, lerp(9.4, 9.0, u), CX, 3.0, -1.2, 50); }
function sRisk(t, d) { // 0〜3点の人は8〜10点の人より、約6年のうちに亡くなるリスクが5倍以上だった
  reset(); lift(160); CHU.visible = false; WAKA.visible = false; BAR_LO.visible = BAR_HI.visible = true;
  const k = easeOut(clamp((t - d * 0.35) / 1.4)); const hLo = 0.55 + (0.55 * 5.44 - 0.55) * k, hHi = 0.55;
  BAR_HI.scale.y = hHi; BAR_HI.position.set(CX + 1.2, BY + hHi / 2, -1.2); BAR_LO.scale.y = hLo; BAR_LO.position.set(CX - 1.2, BY + hLo / 2, -1.2);
  labHi.position.set(CX + 1.2, BY + hHi + 0.45, -0.6); labHi.visible = true; labHi.userData.size(1.1);
  labLo.position.set(CX - 1.2, BY + hLo + 0.45, -0.6); labLo.visible = true; labLo.userData.size(1.1);
  if (t > d * 0.55) say(kansatsu, t, d * 0.55, CX + 1.2, BY + 2.2, -0.6, 1.1);
  setTop('約6年で亡くなるリスク（0〜3点 ÷ 8〜10点）', t > d * 0.35 + 1.4 ? '5倍以上' : '…', fade(t, d * 0.3, d, 0.25), RED); setHud('Brito ほか', '2014年', 1);
  barCam(ease(clamp(t / d)));
  return S;
}
function sPoint(t, d) { // 1点上がるごとに、生存は21%よかった
  reset(); lift(160); CHU.visible = false; WAKA.visible = false; BAR_LO.visible = BAR_HI.visible = true;
  BAR_HI.scale.y = 0.55; BAR_HI.position.set(CX + 1.2, BY + 0.275, -1.2); BAR_LO.scale.y = 0.55 * 5.44; BAR_LO.position.set(CX - 1.2, BY + 0.55 * 5.44 / 2, -1.2);
  labHi.visible = labLo.visible = true; labHi.position.set(CX + 1.2, BY + 0.55 + 0.45, -0.6); labLo.position.set(CX - 1.2, BY + 0.55 * 5.44 + 0.45, -0.6); labHi.userData.size(1.1); labLo.userData.size(1.1);
  SCORE.visible = true; const n = Math.min(10, 3 + Math.floor(clamp(t / (d * 0.8)) * 7)); SCORE.userData.set('+1点ずつ ' + n + '点'); SCORE.position.set(CX + 1.2, BY + 2.1, -0.4); SCORE.userData.size(1.6);
  setTop('1点上がるごとに、生存', '21%よい', fade(t, 0.3, d, 0.25), GREEN); setHud('Brito ほか', '2014年', 1);
  barCam(1);
  return S;
}
function sKekka(t, d) { // 結果：床から手をつかずに立てるかは、体の若さを映す、いちばん安い検査だった
  reset(); lift(120); rise(CHU, 1); CHU.userData.arms.forEach((a, i) => a.rotation.set(-2.8, 0, i ? 0.3 : -0.3)); WAKA.userData.head.rotation.y = 0.5;
  if (t > d * 0.55) say(zeroen, t, d * 0.55, 0.25, 2.6, -0.6, 1.1);
  setTop('結果', 'いちばん安い検査', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.9, 0.5, u), lerp(1.8, 2.0, u), lerp(3.4, 3.8, u), 0.4, 1.35, -0.8, 50);
  return S;
}
function sTadashi(t, d) { // ただし、練習で寿命がのびるかは分かっていない。転びやすい人は無理しないで
  reset(); lift(120); rise(CHU, 0); WAKA.visible = false;
  say(wakaranai, t, 0.3, 0.25, 2.15, -0.6, 1.5); if (t > d * 0.5) say(muri, t, d * 0.5, 0.25, 1.75, -0.6, 1.6);
  setHud('観察研究', '真似は慎重に', 1);
  look(0.75, 1.7, 2.9, 0.25, 1.2, -0.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(120); rise(CHU, 0.35, { hand: 1 }); TE.visible = true; TE.position.set(-0.05, 0.6, -0.2); TE.userData.size(0.32); WAKA.userData.head.rotation.y = 0.4; roomCam(0); return S; }

const NARR = { '若手': 'わかて', '本人': 'ほんにん', '言い分': 'いいぶん', '20代': 'にじゅうだい', '1日目': 'いちにちめ', '手を1回': 'てをいっかい', '膝を1回': 'ひざをいっかい', '膝だけ1回': 'ひざだけいっかい', '1週間後': 'いっしゅうかんご', '1か月後': 'いっかげつご', '膝': 'ひざ', '51〜80歳': 'ごじゅういちからはちじゅっさい', '約2,000人': 'やく2000人', '10点満点': 'じゅってんまんてん', '1点': 'いってん', '0〜3点': 'れいからさんてん', '8〜10点': 'はちからじってん', '約6年': 'やくろくねん', '5倍以上': 'ごばいいじょう', '21%': '21パーセント', '結果：': '結果、', '寿命': 'じゅみょう', '無理': 'むり', '生存': 'せいぞん', '床': 'ゆか' };
const P = planTimes([
  ['横で若手が、笑いを<br>こらえて目をそらす。', sWaka],
  ['本人の言い分から。<br>体はまだ、20代のつもり。', sIibun],
  ['1日目。手を1回、膝を1回<br>ついて、やっと立つ。', stepShot(0)],
  ['1週間後。手はつかずに、<br>膝だけ1回。', stepShot(1)],
  ['1か月後。ゆっくりだけど、<br>手も膝もつかずに立てた。', stepShot(2)],
  ['でも、床から立てるかどうかが、<br>なぜ大事なのか。', sNaze],
  ['51〜80歳の約2,000人に、<br>床に座って立つテストを', (t, d) => sStudy(t, 2 * d)],
  ['した研究がある。', (t, d) => sStudy(t + d, 2 * d)],
  ['10点満点。手や膝を<br>1回つくごとに1点引く。', sScore],
  ['0〜3点の人は<br>8〜10点の人より、', (t, d) => sRisk(t, 3 * d)],
  ['約6年のうちに亡くなる<br>リスクが5倍以上だった。', (t, d) => sRisk(t + d, 3 * d)],
  ['1点上がるごとに、<br>生存は21%よかった。', sPoint],
  ['結果：床から手をつかずに<br>立てるかは、体の若さを映す、', (t, d) => sKekka(t, 2 * d)],
  ['いちばん安い検査だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['ただし、練習で寿命が<br>のびるかは分かっていない。', (t, d) => sTadashi(t, 2 * d)],
  ['転びやすい人は<br>無理しないで。', (t, d) => sTadashi(t + d, 2 * d)],
  ['今やってみて。<br>手をつかずに立てた？', sAsk],
], { shot0, endCard, start: 4.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0683',
    v2: true,
    tt: 'main',
    hookLine: '床にあぐらの中年が、手をつかずに立とうとして、よっこいしょで手が床に出る。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎日、床から手をつかずに立つ練習を1か月続けたら？',
    titleHtml: 'もしも毎日、床から<br>手をつかずに立つ<br>練習を1か月<br>続けたら？',
    mood: 'hopeful', seed: 683, hits: [TP, P.at(12), P.at(16)], risers: [P.at(5)], impacts: [P.at(6, 0.4), P.at(10, 1.2), P.at(11, 0.3)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.5), 'bubble'], [P.at(4, 2.4), 'poof'], [P.at(8, 1.2), 'alarm'], [P.at(9, 0.8), 'meter', 0.4]],
    narr: NARR,
    ask: '今やってみて。手をつかずに立てた？',
    caption: 'もしも毎日、床から手をつかずに立つ練習を1か月続けたら？\n\n横で若手が、笑いをこらえて目をそらす。\n本人の言い分から。体はまだ、20代のつもり。\n1日目。手を1回、膝を1回ついて、やっと立つ。\n1週間後。手はつかずに、膝だけ1回。\n1か月後。ゆっくりだけど、手も膝もつかずに立てた。\nでも、床から立てるかどうかが、なぜ大事なのか。\n51〜80歳の約2,000人に、床に座って立つテストをした研究がある。\n10点満点。手や膝を1回つくごとに1点引く。\n0〜3点の人は8〜10点の人より、約6年のうちに亡くなるリスクが5倍以上だった。\n1点上がるごとに、生存は21%よかった。\n\n結果：床から手をつかずに立てるかは、体の若さを映す、いちばん安い検査だった。\nただし、練習で寿命がのびるかは分かっていない（観察研究）。転びやすい人は無理しないで、周りに物を置かずに。\n\n今やってみて。手をつかずに立てた？ コメントで教えて。\n\n出典：Brito ほか European Journal of Preventive Cardiology（2014年）',
    hashtags: ['もしもラボ', 'もしも', '健康', '体力テスト', '人体の限界'],
    endStats: [['座って立つテストの研究', '約2,000人', '51〜80歳・2014年'], ['0〜3点の人の死亡リスク', '5倍以上', '8〜10点と比べて'], ['1点上がるごとに 生存', '21%よい', '観察研究']],
    sources: '出典：Brito ほか Eur J Prev Cardiol（2014年）',
  },
});
