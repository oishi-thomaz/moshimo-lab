import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, randPerson, poseWalk } from '../lib.js';
import { station, setStationEnv, PH, TZ, makeTrain, setBoard, board, makeRiders, makeQs } from '../scenes/station.js';
board.position.set(-10, 3.9, -1.6);
import { japan, ll, CITY, setMapEnv, setDots, dots, onLand, LAND_Y } from '../scenes/japan.js';
import { city, setEnv, makeCar, updateCars } from '../city.js';
import { lift, look, runStory, endCard, hudTime, countUp, setTop, setHud, el, textSprite } from '../story.js';

// もしも日本中の電車が全部止まったら？
// 数字（国土交通省 鉄道輸送統計調査 2024年度 年報・報告書 表1・表2）
//   旅客数量 23,377百万人（233億7,700万人）／うち定期 12,891百万人（55.1%）／新幹線 386百万人／旅客人キロ 407,073百万人キロ
//   貨物数量 38,474,759トン
// 推計：1日あたり 23,377百万÷365日≒6,400万人、新幹線 386百万÷365≒106万人、平均乗車距離 407,073÷23,377≒17.4km
//       徒歩の所要時間は 道路距離80mにつき1分（不動産公正取引協議会連合会 表示規約の基準）→ 17.4km÷80m≒218分＝約3時間38分

// ---------- station ----------
const train = makeTrain({ cars: 6, side: -1 });
const freight = makeTrain({ cars: 7, side: 1, freight: true, color: '#3f4b5c', band: '#e9ecef' });
const waiting = makeRiders(40, 11, { x0: -30, x1: 0, z0: -2.6, z1: -0.6 });
const crowd = makeRiders(170, 23, { x0: -44, x1: 2, z0: -2.7, z1: 2.7 });
const qs = makeQs(14);
const qPeople = () => crowd.people.filter(p => p.userData.base.x < -16);
const STOP = '運転見合わせ';
const ROWS = [['普通', '7:42', 'もしも台方面'], ['快速', '7:45', 'みらい港方面']];

// ---------- japan rail lines ----------
const SHINKANSEN = [
  [[139.77, 35.68], [139.15, 35.26], [138.38, 34.97], [137.73, 34.7], [136.88, 35.17], [135.76, 34.99], [135.5, 34.73], [135.19, 34.68], [133.92, 34.67], [132.47, 34.4], [130.93, 33.95], [130.42, 33.59], [130.69, 32.79], [130.54, 31.6]],
  [[139.77, 35.68], [139.62, 35.91], [139.9, 36.56], [140.46, 37.75], [140.88, 38.26], [141.14, 39.7], [141.51, 40.51], [140.69, 40.83], [140.65, 41.9]],
  [[139.62, 35.91], [139.01, 36.32], [139.06, 37.91]],
  [[139.01, 36.32], [138.19, 36.64], [137.21, 36.7], [136.65, 36.58], [136.07, 35.65]],
];
const lineY = LAND_Y + 0.35;
function tube(pts, r, m) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([lo, la]) => ll(lo, la, lineY)), false, 'catmullrom', 0.1);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 12), r, 6, false), m); japan.add(mesh);
  return { mesh, curve };
}
const shinM = new THREE.MeshBasicMaterial({ color: '#7fd4ff' });
const shin = SHINKANSEN.map(p => tube(p, 0.45, shinM));
// commuter networks around big cities (schematic)
const comM = new THREE.MeshBasicMaterial({ color: '#ffd166' });
const commuter = [];
{
  const r = rng(8);
  const hubs = [['tokyo', 14, 9], ['osaka', 10, 7], ['nagoya', 8, 6], ['fukuoka', 6, 5], ['sapporo', 5, 5], ['sendai', 4, 5], ['hiroshima', 4, 4], ['niigata', 3, 4], ['kanazawa', 3, 4], ['shizuoka', 3, 4], ['kagoshima', 3, 4], ['kochi', 2, 3]];
  for (const [c, n, len] of hubs) {
    const o = CITY[c];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + r() * 0.4, L = len * (0.5 + r() * 0.7) / 11; // deg
      const pts = [o]; let ok = true;
      for (let k = 1; k <= 3; k++) { const p = [o[0] + Math.cos(a + (r() - .5) * 0.3 * k) * L * k / 3 / Math.cos(0.63), o[1] + Math.sin(a) * L * k / 3]; const v = ll(...p); if (!onLand(v.x, v.z)) { ok = false; break; } pts.push(p); }
      if (ok) commuter.push(tube(pts, 0.22, comM));
    }
  }
}
// moving train dots
const trainDotM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const tdots = [];
{
  const r = rng(4); const all = [...shin.map(s => [s, 0.006]), ...commuter.map(s => [s, 0.04])];
  for (const [s, sp] of all) for (let k = 0; k < (sp < 0.01 ? 8 : 2); k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), trainDotM); japan.add(m); tdots.push({ m, s, off: r(), sp: sp * (0.7 + r() * 0.6) * (r() < 0.5 ? 1 : -1) }); }
}
const grey = new THREE.Color('#5a6270'), red = new THREE.Color('#ff5b4f');
function rail(t, stopK, { shinOn = 1, comOn = 1 } = {}) { // stopK 0 = running, 1 = stopped
  shinM.color.set('#7fd4ff').lerp(grey, stopK * shinOn); comM.color.set('#ffd166').lerp(grey, stopK * comOn);
  const run = t * (1 - stopK);
  for (const d of tdots) {
    const u = ((d.off + (stopK >= 1 ? 0 : run * d.sp)) % 1 + 1) % 1;
    d.m.position.copy(d.s.curve.getPointAt(u)); d.m.position.y += 0.3;
    d.m.material = stopK > 0.5 ? redDot : trainDotM;
  }
}
const redDot = new THREE.MeshBasicMaterial({ color: red });
function mapDots() { setDots((i, x, z, q) => ({ s: 0.8, color: '#e8eef6' })); }
const shinLab = textSprite('新幹線', { sx: 34, size: 80, color: '#ffffff', stroke: 10 }); shinLab.material.depthTest = false; shinLab.renderOrder = 6; japan.add(shinLab);
{ const p = ll(137.2, 33.4, 6); shinLab.position.copy(p); }

// ---------- city: walking crowd and stuck cars ----------
const walkers = [];
{
  const r = rng(31);
  for (let i = 0; i < 240; i++) {
    const p = randPerson(r, { tie: r() < 0.35 }); city.add(p);
    const lane = r(); let z;
    if (lane < 0.5) z = 5.0 + r() * 2.4; else if (lane < 0.66) z = 17.3 + r() * 2.4; else z = 9 + r() * 7; // sidewalks + the road itself
    walkers.push({ p, x0: -70 + r() * 140, z, road: z > 8.5 && z < 16.5, sp: 1.1 + r() * 0.5, ph: r() * 6.28 });
  }
}
function walk(t, road, dir = 1) { // road: also people walking on the road itself
  walkers.forEach((w, i) => {
    w.p.visible = road || !w.road; if (!w.p.visible) return;
    let x = w.x0 + dir * w.sp * t; x = ((x + 70) % 140 + 140) % 140 - 70;
    w.p.position.set(x, w.z > 8.5 && w.z < 16.5 ? 0 : 0.15, w.z); w.p.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; poseWalk(w.p, t * 7.5 + w.ph, 1);
    w.p.position.y += (w.z > 8.5 && w.z < 16.5 ? 0 : 0.15);
  });
}
const stuck = [];
{ const cols = ['#d94b4b', '#f1f1f1', '#3b6fb6', '#2d2f36', '#e7e3da', '#566275', '#7a8a6a', '#c9a24a']; for (let i = 0; i < 10; i++) { const c = makeCar(cols[i % cols.length]); c.position.set(-18 + i * 6.5 + (i % 3) * 0.6, 0, i % 2 ? 14.5 : 10.5); c.rotation.y = i % 2 ? Math.PI : 0; c.visible = false; stuck.push(c); } }
function cityProps(on) { stuck.forEach(c => c.visible = on); updateCars(0, false); }
function hideWalkers() { walkers.forEach(w => w.p.visible = false); }

// ---------- subtitles ----------
const SUBS = [
  [2.6, 6.0, 'いつもの朝。<br>電車が来て、乗りこむ。'],
  [6.2, 10.1, '日本中の電車が、<br>いっせいに止まった。'],
  [10.1, 14.0, 'ホームに人が<br>あふれていく。'],
  [14.2, 18.1, '乗る人の半分以上は、<br>通勤・通学の定期券。'],
  [18.1, 22.0, '都市の路線が、<br>まとめて止まった。'],
  [22.2, 26.1, 'みんな、<br>歩いて向かうしかない。'],
  [26.1, 30.0, '1回に乗る距離は、<br>平均17.4km（推計）'],
  [30.2, 34.6, '新幹線も止まった。'],
  [34.6, 39.0, '1日約106万人の<br>遠くへの移動が消えた。'],
  [39.2, 43.6, '貨物列車も動かない。'],
  [43.6, 47.8, '1年で3,847万トンを<br>運ぶ線路が止まった。'],
  [48.1, 52.6, '結果：1日約6,400万人が、<br>歩くしかなくなった。'],
  [52.6, 55.4, '電車の代わりに歩くと、<br>片道で約3時間38分。'],
  [55.6, 59.4, 'あなたの通勤、<br>歩くと何時間？'],
];

const cd = (left) => `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`;
function stn(env = 'day') { setStationEnv(env); waiting.set(0, 0); crowd.set(0, 0); qs.set(0, crowd.people, 0); freight.g.visible = false; train.g.visible = true; train.setLights(1); }
const arriveX = t => lerp(-70, 0, easeOut(clamp(t / 3.4))); // train arrives and stops at x=0 by T=3.4

function shot0(t, T) { // hook: platform, train approaching, countdown, big number
  stn(); setBoard(ROWS);
  train.setX(arriveX(T)); train.setDoors(0); waiting.set(40, T, { look: true });
  const u = ease(t / 2.5);
  lift(160); look(lerp(13, 12.5, u), PH + 3.0, -1.4, -15, PH + 0.9, -2.4, 55);
  el.title.style.opacity = 1;
  setHud('全国の電車が止まるまで', cd(6 - T), 1, { mono: true });
  setTop('鉄道で運ばれる人（2024年度・1年間）', '233億7,700万人', 1);
  return station;
}
function shot1(t, T) { // ordinary: stops, doors open, people board
  stn(); setBoard(ROWS);
  train.setX(arriveX(T)); const dk = clamp((T - 3.6) / 0.5); train.setDoors(dk);
  waiting.set(40, T, { board: clamp((T - 4.0) / 2.0), side: -1 });
  const u = ease(t / 3.5);
  lift(160); look(lerp(12.5, 11.5, u), PH + 3.0, -1.4, -15, PH + 0.9, -2.4, 55);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('全国の電車が止まるまで', cd(Math.max(0, 6 - T)), 1, { mono: true });
  setTop('鉄道で運ばれる人（2024年度・1年間）', '233億7,700万人', clamp(1 - (t - 0.1) / 0.3));
  return station;
}
function shot2(t, T) { // +1min: everything stops, crowd grows
  stn(); setBoard([], { stop: STOP, blink: 0.5 + 0.5 * Math.cos(t * 5) });
  train.setX(0); train.setDoors(1); train.setLights(0);
  const n = Math.round(lerp(50, 170, easeOut(clamp(t / 7))));
  crowd.set(n, T, { look: true }); qs.set(Math.min(14, Math.floor(t * 3)), qPeople(), T);
  const u = ease(t / 8);
  lift(160); look(lerp(12.5, 15, u), PH + 2.9, -1.4, -15, PH + 1.1, -1.8, 55);
  hudTime('+1分');
  setTop('1日に電車を使う人（2024年度・推計）', '約' + comma(countUp(t, 6400)) + '万人', fade(t, 0.15, 8, 0.25));
  return station;
}
function mapCam(t, d) { const u = ease(t / d); look(lerp(-8, -4, u), lerp(300, 285, u), lerp(95, 88, u), -4, 0, -30, 50); }
function shot3(t, T) { // +10min: map, commuter networks stop
  lift(300);
  setMapEnv('dusk'); mapDots(); shinLab.visible = false;
  const k = clamp((t - 0.6) / 1.4);
  rail(T, k);
  comM.color.set('#ffd166').lerp(red, k * (0.6 + 0.4 * Math.sin(t * 6) ** 2));
  const tk = ll(...CITY.tokyo); const u = ease(t / 8);
  look(tk.x + lerp(-30, -20, u), lerp(150, 120, u), tk.z + lerp(70, 58, u), tk.x - 22, 0, tk.z - 10, 50);
  hudTime('+10分');
  setTop('乗客のうち定期券の割合（2024年度）', (countUp(t, 551) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return japan;
}
function shot4(t, T) { // +1h: everyone walks
  setEnv('day', new THREE.Vector3(0, 0, 10)); cityProps(true); walk(T, false);
  const u = ease(t / 8);
  look(lerp(-48, -42, u), lerp(11, 10, u), 12.5, 10, 0.5, 11.5, 55);
  hudTime('+1時間');
  setTop('1回に乗る平均の距離（2024年度・推計）', (countUp(t, 174) / 10).toFixed(1) + 'km', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot5(t, T) { // +3h: shinkansen line stopped
  lift(470);
  setMapEnv('dusk'); mapDots(); shinLab.visible = true;
  rail(T, 1);
  shinM.color.copy(grey).lerp(red, 0.55 + 0.45 * Math.sin(t * 5) ** 2);
  const u = ease(t / 9.2);
  look(lerp(-8, -4, u), lerp(300, 282, u), lerp(95, 86, u), -4, 0, -30, 50);
  hudTime('+3時間');
  setTop('新幹線の利用（2024年度・1日あたり推計）', '約' + countUp(t, 106) + '万人', fade(t, 0.15, 9.2, 0.25));
  return japan;
}
function shot6(t, T) { // +1day: freight train halted
  stn('dusk'); setBoard([], { stop: STOP, blink: 0.5 + 0.5 * Math.cos(t * 5) });
  train.g.visible = false; freight.g.visible = true; freight.setX(-20); freight.setLights(0);
  crowd.set(60, T, { look: true });
  const u = ease(t / 8.8);
  lift(300); look(lerp(-50, -55, u), 3.4, 12.5, -80, 2.2, 3.5, 55);
  hudTime('+1日');
  setTop('鉄道で運ぶ貨物（2024年度・1年間）', comma(countUp(t, 3847)) + '万トン', fade(t, 0.15, 8.8, 0.25));
  return station;
}
function shot7(t, T) { // result: dusk, people walking down the road
  setEnv('dusk', new THREE.Vector3(0, 0, 10)); cityProps(false); walk(T, true);
  const u = ease(t / 7.5);
  look(lerp(30, 34, u), lerp(9, 11, u), lerp(14, 13, u), -10, 0.8, 11.5, 55);
  if (t < 4.5) setTop('1日に電車を使っていた人（推計）', '約' + comma(countUp(t, 6400, 0.2, 1.2)) + '万人', fade(t, 0.15, 4.5, 0.2));
  else setTop('17.4kmを歩くと（1分80mで計算・推計）', '約3時間38分', fade(t, 4.5, 7.5, 0.2), '#ffd166');
  return city;
}
function shot8(t, T) { // loop: same platform framing as the opening, still stopped
  stn(); setBoard([], { stop: STOP, blink: 0.5 + 0.5 * Math.cos(t * 5) });
  train.setX(0); train.setDoors(1); train.setLights(0);
  crowd.set(170, T, { look: true });
  const u = ease(t / 4);
  lift(160); look(lerp(12.6, 13, u), PH + 3.0, -1.4, -15, PH + 0.9, -2.4, 55);
  return station;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0020',
    title: '日本中の電車が全部止まったら？',
    titleHtml: '日本中の電車が<br>全部止まったら？',
    mood: 'tension', seed: 20, hits: [6.0, 48.1], risers: [6.0],
    ask: 'あなたの通勤、歩くと何時間？',
    narr: { '17.4km': '17.4キロ', '3,847万トン': '3847万トン', '1回': 'いっかい' },
    caption: 'もしも日本中の電車が全部止まったら？\n鉄道が運ぶ人は2024年度で1年に233億7,700万人、1日あたり約6,400万人（推計）。1回に乗る平均の距離は約17.4km。歩くと片道約3時間38分（1分80mで計算・推計）。国交省の鉄道輸送統計で計算してみた。\n\nあなたの通勤、歩くと何時間？ コメントで教えて。\n\n出典：国土交通省 鉄道輸送統計調査（2024年度 年報）、不動産公正取引協議会連合会（徒歩所要時間の基準 80m＝1分）',
    hashtags: ['もしもラボ', '電車', '通勤', '鉄道', '雑学'],
    endStats: [['鉄道で運ばれる人（1年間）', '233億7,700万人', '2024年度'], ['1日あたり（推計）', '約6,400万人', '2024年度'], ['乗客のうち定期券', '55.1%', '2024年度'], ['新幹線 1日あたり（推計）', '約106万人', '2024年度'], ['平均17.4kmを歩くと（推計）', '約3時間38分', '1分80m']],
    sources: '出典：国土交通省 鉄道輸送統計調査（2024年度 年報）、<br>不動産公正取引協議会連合会（徒歩所要時間の基準）',
  },
});
