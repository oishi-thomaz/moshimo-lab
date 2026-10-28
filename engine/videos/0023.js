import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, comma, randPerson, poseWalk } from '../lib.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill, RX0, RZ0 } from '../city.js';
import { japan, setDots, setMapEnv } from '../scenes/japan.js';
import { town, setTownEnv, setVacant } from '../scenes/town.js';
import { look, cam, lift, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも日本の人口が半分になったら？
// 数字：総人口 1億2,265万人・1年で54万人減（総務省 人口推計 2026年9月1日概算、2026年9月24日公表）
//       半分＝約6,133万人（計算）。54万人/年で割ると約114年分（計算）
//       2070年 8,700万人／2100年 6,278万人（国立社会保障・人口問題研究所 日本の将来推計人口 令和5年推計、出生中位・死亡中位。
//       2100年は長期参考推計 参考表1-1 出生中位（死亡中位）62,779千人：社人研 pp2023_Report3.pdf で確認）
//       空き家 900万2千戸・空き家率 13.8%（総務省 令和5年住宅・土地統計調査、2023年10月1日）
// 実在の交差点の見た目には似せない（架空の街）

function L(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }
const POP = 12265, HALF = 6133;

// ---------- crossing crowd (fictional scramble crossing) ----------
const CX = RZ0, CZ = RX0;
const gCross = new THREE.Group(); city.add(gCross); gCross.visible = false;
const peds = [];
{
  const r = rng(230);
  for (let i = 0; i < 70; i++) {
    const p = randPerson(r); gCross.add(p);
    const kind = Math.floor(r() * 5), j = (r() - .5) * 2.4, s = r() < .5 ? 1 : -1;
    let a, b;
    if (kind === 0) { const z = CZ + s * 6 + j * 0.6; a = [CX - 8.5, z]; b = [CX + 8.5, z]; }
    else if (kind === 1) { const x = CX + s * 6 + j * 0.6; a = [x, CZ - 8.5]; b = [x, CZ + 8.5]; }
    else if (kind === 2) { a = [CX - 7 + j, CZ - 7]; b = [CX + 7 + j, CZ + 7]; }
    else if (kind === 3) { a = [CX + 7 + j, CZ - 7]; b = [CX - 7 + j, CZ + 7]; }
    else { const z = CZ + s * 6 + j * 0.6; a = [CX - 8.5, z]; b = [CX + 8.5, z]; }
    if (r() < .5) [a, b] = [b, a];
    peds.push({ p, a, b, sp: 0.07 + r() * 0.05, o: r(), q: r(), ph: r() * 6 });
  }
}
const pedAt = (w, T) => { const u = (T * w.sp + w.o) % 1; return [lerp(w.a[0], w.b[0], u), lerp(w.a[1], w.b[1], u)]; };
// tv: 消える時刻（null なら全員いる）、keep: 消えた後も残る割合の境目（q >= 0.5 の人が残る）
function crowd(T, tv) {
  for (const w of peds) {
    const [x, z] = pedAt(w, T);
    w.p.position.set(x, 0.15, z); w.p.rotation.y = Math.atan2(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    poseWalk(w.p, T * 7 + w.ph); w.p.position.y += 0.15;
    w.p.visible = !(tv != null && T >= tv && w.q < 0.5);
  }
}
function sparkFor(tv) {
  const s = makeSparkles(500, 0.35); city.add(s.points);
  s.init(peds.filter(w => w.q < 0.5).map(w => { const [x, z] = pedAt(w, tv); return [x, 1.0, z]; }), 0.8, 2.5);
  return s;
}
const SP0 = 0.5, SP2 = 6.6; // v2：0.5秒で半分が消える
const spark0 = sparkFor(SP0), spark2 = sparkFor(SP2);
const sparkSm = makeSparkles(500, 0.12); city.add(sparkSm.points);
sparkSm.init(peds.filter(w => w.q < 0.5).map(w => { const [x, z] = pedAt(w, SP2); return [x, 1.0, z]; }), 0.4, 1.2);
function noSpark() { spark0.set(0); spark2.set(0); sparkSm.set(0); }

function cityBase(env = 'day') {
  gCross.visible = true; setEnv(env, new THREE.Vector3(CX, 0, CZ)); setStore(1); setStoreLights(env === 'day' ? 0.3 : 0.8); setBurst(0);
  ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = false; updateCars(0, false);
}
function aerial(t, T, ang0, h0, R = 24) {
  const ang = ang0 + t * 0.04;
  L(CX + Math.sin(ang) * R, h0 - t * 0.6, CZ + Math.cos(ang) * R, CX, 0, CZ, 55);
}
// ---------- town ----------
// ---------- map ----------
function mapDots(gone, color = '#ffffff') { setDots((i, x, z, q) => ({ hide: q < gone, color })); }

const SUBS = [
  [2.6, 6.0, 'いつもの朝の交差点。<br>人であふれている。'],
  [6.2, 10.1, 'これ、ただの空想じゃない。<br>国の推計に答えがある。'],
  [10.1, 14, '1億2,265万人が、<br>約6,133万人に。'],
  [14.2, 18.1, '交差点は、<br>人がまばらに。'],
  [18.1, 22, '1年に減る人数の、<br>約114年分（計算）。'],
  [22.2, 26.1, '夜の住宅街。明かりの<br>消えた家は、もう今ある。'],
  [26.1, 30, '空き家は今でも<br>900万戸（2023年）。'],
  [30.2, 34.6, '国の推計では、<br>2070年に8,700万人。'],
  [34.6, 39, '今より約3,600万人少ない。<br>でも、まだ終わらない。'],
  [39.2, 43.6, 'そして2100年には、<br>6,278万人。'],
  [43.6, 47.8, '今の約半分になる<br>見込みだ。'],
  [48.1, 52.6, '結果：人口は約6,133万人。<br>2100年ごろの推計に近い。'],
  [52.6, 55.4, '今から約74年後の、<br>国の推計だった。'],
  [55.6, 59.4, '人口半分の日本、<br>住みたい？住みたくない？'],
];

function shot0(t, T) { // hook: aerial crowd, half vanish at 1.2s
  cityBase('day'); crowd(T, SP0); noSpark(); spark0.set(clamp((T - SP0) / 1.1));
  lift(-80); aerial(t, T, -0.6, 32, 22); // v2：交差点の人の群れをタイトルの下に大きく
  el.flash.style.opacity = 0.5 * clamp(1 - Math.abs(T - SP0) / 0.12);
  return city;
}
function shot1(t, T) { // everyday: street level, everyone there
  cityBase('day'); crowd(T, null); noSpark();
  lift(230); const u = ease(t / 3.5);
  L(CX + lerp(15, 14, u), 6.5, CZ + lerp(17, 16, u), CX, 0.6, CZ, 50);
  return city;
}
function shot2(t, T) { // +0s street level（v2：冒頭の0.5秒でもう消えているので、半分はいないまま。もう一度消す演出はしない）
  cityBase('day'); crowd(T, 0); noSpark();
  lift(230); const u = ease(t / 8);
  L(CX + lerp(14, 12.5, u), lerp(6.5, 7.5, u), CZ + lerp(16, 14.5, u), CX, 0.6, CZ, 50);
  hudTime('+0秒');
  if (t < 4.1) setTop('日本の総人口（2026年9月）', (() => { const v = countUp(t, POP); return v < 10000 ? `${comma(v)}万人` : `${Math.floor(v / 10000)}億${comma(v % 10000)}万人`; })(), fade(t, 0.15, 8, 0.25));
  else { const v = Math.round(lerp(POP, HALF, easeOut(clamp((t - 4.2) / 1.4)))); setTop('半分になると（計算）', (v >= 10000 ? `${Math.floor(v / 10000)}億${comma(v % 10000)}` : '約' + comma(v)) + '万人', fade(t, 0.15, 8, 0.25), '#ff8a7a'); }
  return city;
}
function shot3(t, T) { // +1h aerial: sparse crossing
  cityBase('day'); crowd(T, 0); noSpark();
  lift(240); aerial(t, T, -0.15, 44, 22);
  hudTime('+1時間');
  setTop('1年で減った人口（2026年9月までの1年）', countUp(t, 54) + '万人', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot4(t, T) { // +1day night town: lights out
  setTownEnv('night'); setVacant(lerp(0.15, 0.5, easeOut(clamp((t - 0.5) / 3))), clamp((t - 2) / 3));
  lift(220); const u = ease(t / 8);
  L(lerp(4, 1, u), lerp(22, 20, u), lerp(44, 40, u), -1, 0, lerp(6, 2, u), 50);
  hudTime('+1日');
  if (t < 4.1) setTop('全国の空き家の数（2023年）', comma(countUp(t, 900)) + '万戸', fade(t, 0.15, 8, 0.25));
  else setTop('住宅のうち空き家の割合（2023年）', (countUp(t - 4.1, 138, 0.1, 1.2) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return town;
}
function shot5(t, T) { // 2070 map
  setMapEnv('dusk'); mapDots(lerp(0, 1 - 8700 / POP, easeOut(clamp((t - 0.5) / 3))), '#ffffff');
  lift(400); const u = ease(t / 9);
  L(lerp(-8, -4, u), lerp(300, 280, u), lerp(95, 85, u), -4, 0, -30, 50);
  setHud('国の推計', '2070年', 1);
  setTop('2070年の総人口（中位推計）', comma(Math.round(lerp(POP, 8700, easeOut(clamp((t - 0.5) / 3))))) + '万人', fade(t, 0.15, 9, 0.25));
  return japan;
}
function shot6(t, T) { // 2100 map
  setMapEnv('dusk'); mapDots(lerp(1 - 8700 / POP, 1 - 6278 / POP, easeOut(clamp((t - 0.5) / 3))), '#ffd98a');
  lift(400); const u = ease(t / 8.8);
  L(lerp(-4, -10, u), lerp(280, 300, u), lerp(85, 95, u), -4, 0, -30, 50);
  setHud('国の推計', '2100年', 1);
  setTop('2100年の総人口（中位推計）', comma(Math.round(lerp(8700, 6278, easeOut(clamp((t - 0.5) / 3))))) + '万人', fade(t, 0.15, 8.8, 0.25), '#ffd98a');
  return japan;
}
function shot7(t, T) { // result: dusk aerial, half the people
  cityBase('dusk'); crowd(T, 0); noSpark();
  lift(240); aerial(t, T, -0.35, 42, 24);
  if (t < 4.4) setTop('半分になった人口（計算）', '約' + comma(countUp(t, HALF, 0.2, 1.2)) + '万人', fade(t, 0.15, 4.4, 0.2), '#ff8a7a');
  else setTop('2100年の推計人口（中位）', comma(countUp(t - 4.4, 6278, 0.1, 1.0)) + '万人', fade(t, 4.4, 7.5, 0.2), '#ffd98a');
  return city;
}
function shot8(t, T) { // loop: like the hook, result state
  cityBase('day'); crowd(T, 0); noSpark();
  lift(240); aerial(t, T, -0.75, 35);
  return city;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 65, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65, camera: cityCam,
  cut: [[2.5, 6.0]], // v2：いつもの朝の交差点（元の2.5〜6秒）を抜いて、消えた直後から本題へ
  meta: {
    id: '0023',
    v2: true,
    hookLine: '日本の人口が、一瞬で半分になった。',
    title: '日本の人口が半分になったら？',
    titleHtml: '日本の人口が<br>半分になったら？',
    mood: 'mystery', seed: 23, hits: [0.5, 48.1], risers: [6.0],
    ask: '人口半分の日本、住みたい？',
    caption: 'もしも日本の人口1億2,265万人が、一瞬で半分の約6,133万人になったら？\n交差点、住宅街、そして日本地図で見てみた。国の将来推計（中位）では2070年に8,700万人、2100年に6,278万人。人口が半分の日本は、空想ではなく約74年後の推計に近い姿。\n\n人口半分の日本、住みたい？ コメントで教えて。\n\n出典：総務省 人口推計（2026年9月概算）、国立社会保障・人口問題研究所 日本の将来推計人口（令和5年推計）、総務省 令和5年住宅・土地統計調査',
    hashtags: ['もしもラボ', '人口減少', '少子化', '日本の未来', '雑学'],
    endStats: [['日本の総人口', '1億2,265万人', '2026年9月'], ['半分になると', '約6,133万人', '計算'], ['国の推計（中位）', '6,278万人', '2100年'], ['空き家の数', '900万戸', '2023年']],
    sources: '出典：総務省 人口推計・令和5年住宅・土地統計調査、<br>国立社会保障・人口問題研究所 日本の将来推計人口（令和5年推計）',
  },
});
