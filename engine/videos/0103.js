import * as THREE from 'three';
import { clamp, lerp, ease, fade, mat, box, comma, makePerson, SKIN, HAIR, canvasTex, makeQ } from '../lib.js';
import { room, setRoom, setLight, lamp } from '../scenes/room.js';
import { town, HOUSES, setTownEnv } from '../scenes/town.js';
import { japan, ll, setMapEnv, setDots, dotPos } from '../scenes/japan.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも日本中の家で同時に電子レンジを使ったら？（blueprint no 103・日本人全員でシリーズ）
// 数字：
//  一般世帯数 5,570万5千世帯（2020年国勢調査、総務省統計局「日本の統計が分かる」 https://www.stat.go.jp/info/guide/asu/pdf/2023asu_3-2.pdf）
//  電子レンジの消費電力 1,400W（東京都の家庭向け省エネハンドブック「家電製品の消費電力の目安」、資源エネルギー庁調べ他
//    https://www.tokyo-co2down.jp/wp-content/uploads/2023/04/4_2023_handbook_p9_10.pdf）
//  → 全世帯が1台ずつ同時に使うと 5,570.5万×1.4kW＝約7,800万kW（単純計算）
//  2025年度夏季の全国最大需要 16,260万kW（暫定、8月5日14〜15時、電力広域的運営推進機関 評議員会資料 2025年度第2回
//    https://www.occto.or.jp/soukaihoka/hyougiinkai/2025/files/2025_2_houkoku_1.pdf）→ 約半分（単純計算）
//  需要が供給を上回ると周波数が下がり、一定より下がると発電機は故障防止のため自動停止。2018年9月6日の北海道胆振東部地震で
//    道内全域 最大約295万戸が停電、全域への供給回復まで約45時間（内閣府 令和元年版防災白書
//    https://www.bousai.go.jp/kaigirep/hakusho/h31/honbun/0b_1s_01_04.html）

// ---------- kitchen + microwave ----------
const K = new THREE.Group(); room.add(K);
const MW = new THREE.Vector3(-2.3, 0.95, -3.05);
const mwBody = box(0.62, 0.36, 0.42, mat('#eceef0')); mwBody.position.set(MW.x, MW.y + 0.18, MW.z); K.add(mwBody);
const winM = new THREE.MeshLambertMaterial({ color: '#2a2e36', emissive: 0xffd27a, emissiveIntensity: 0 });
const mwWin = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.24), winM); mwWin.position.set(MW.x - 0.08, MW.y + 0.18, MW.z + 0.215); K.add(mwWin);
const dispTex = canvasTex(128, 48, (g, w, h) => { g.fillStyle = '#10161a'; g.fillRect(0, 0, w, h); });
const dispC = dispTex.image; const dispM = new THREE.MeshBasicMaterial({ map: dispTex });
const mwDisp = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.045), dispM); mwDisp.position.set(MW.x + 0.21, MW.y + 0.27, MW.z + 0.215); K.add(mwDisp);
for (let i = 0; i < 2; i++) { const b = box(0.08, 0.035, 0.01, mat('#c9ced4')); b.position.set(MW.x + 0.21, MW.y + 0.17 - i * 0.06, MW.z + 0.215); K.add(b); }
const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.03, 16), mat('#f4f1ea')); K.add(plate);
const food = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 5), mat('#c9873e')); food.scale.y = 0.5; K.add(food);
let lastDisp = '';
function setMW(on, secLeft, t = 0) {
  winM.emissiveIntensity = on ? 0.9 : 0;
  const s = on ? `${Math.floor(secLeft / 60)}:${String(Math.floor(secLeft % 60)).padStart(2, '0')}` : '';
  if (s !== lastDisp) { lastDisp = s; const g = dispC.getContext('2d'); g.fillStyle = '#10161a'; g.fillRect(0, 0, 128, 48); g.fillStyle = '#7dffb0'; g.font = '700 36px monospace'; g.textAlign = 'center'; g.fillText(s, 64, 36); dispTex.needsUpdate = true; }
  const a = on ? t * 2 : 0;
  plate.position.set(MW.x - 0.08, MW.y + 0.06, MW.z + 0.02); food.position.set(MW.x - 0.08 + Math.cos(a) * 0.02, MW.y + 0.1, MW.z + 0.02 + Math.sin(a) * 0.02);
}
const cook = makePerson({ skin: SKIN[1], hair: HAIR[2], shirt: '#e7a6a0', pants: '#3b3f4a', long: true }); cook.position.set(-1.45, 0, -2.4); cook.rotation.y = -2.2; K.add(cook);
function kitchen() { setRoom({ sets: ['kitchen'] }); setLight('evening', { ceil: 9, hemi: 0.95, lamp: 1.4 }); lamp.position.set(-2.0, 2.1, -2.2); K.visible = true; }

// ---------- town: blackout helper ----------
const tLights = [], tBulbs = [];
town.traverse(o => { if (o.isPointLight) tLights.push(o); if (o.isMesh && o.material && o.material.isMeshBasicMaterial) tBulbs.push(o); });
function townBlack(k) { // k=1: everything off
  for (const h of HOUSES) for (const m of h.wins) m.emissiveIntensity *= (1 - k);
  tLights.forEach(l => l.intensity *= (1 - k)); tBulbs.forEach(b => b.material.color.set(k > 0.5 ? '#3a3f4a' : '#fff2cf'));
}
const tq = []; for (let i = 0; i < 4; i++) { const p = makePerson({ skin: SKIN[i % 3], hair: HAIR[i % 4], shirt: ['#4fa3d1', '#e2574c', '#7bc47f', '#f2c14e'][i], pants: '#3b3f4a' }); p.position.set(-4.3 + (i % 2) * 8.6, 0.12, 6 + i * 3); p.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2; town.add(p); const q = makeQ(); q.position.set(p.position.x, 2.4, p.position.z); town.add(q); tq.push({ p, q }); }
function townPeople(v, t) { tq.forEach(({ p, q }, i) => { p.visible = v; q.visible = v && t > 1.5; q.position.y = 2.4 + Math.sin(t * 3 + i) * 0.05; p.userData.head.rotation.y = Math.sin(t * 1.5 + i) * 0.6; }); }

// ---------- stage bars ----------
const barPeak = makeBar({ color: '#4fa3d1', label: '夏の最大', x: -2.2, w: 2.2, d: 2.2 });
const barMW = makeBar({ color: '#ff8a5a', label: '一斉チン', x: 2.2, w: 2.2, d: 2.2 });
function barsOn(v) { barPeak.g.visible = barMW.g.visible = v; }

// ---------- japan map: Hokkaido ----------
const HKZ = ll(141, 41.45).z;
const isHK = (x, z) => z < HKZ && x > ll(139.3, 42).x;

const SUBS = [
  [2.6, 6.0, 'いつもの夕方。<br>夕ごはんを温める時間。'],
  [6.2, 10.1, 'チンが終わる前に、<br>日本中が暗くなるかも。'],
  [10.1, 14, '電子レンジ1台は、<br>約1,400W。'],
  [14.2, 18.1, '5,570万世帯で、<br>同時に動かすと…'],
  [18.1, 22, '約7,800万kWが、<br>一瞬で上乗せ。'],
  [22.2, 26.1, '2025年の夏、いちばん電気を<br>使った時間の約半分。'],
  [26.1, 30, 'でも発電所は、<br>すぐには増やせない。'],
  [30.2, 34.6, '使う電気が作る電気を超えると、<br>周波数が下がる。'],
  [34.6, 39, '下がりすぎると、発電機は<br>壊れないように止まる。'],
  [39.2, 43.6, '2018年の北海道では、<br>全域が停電した。'],
  [43.6, 47.8, '全部に電気が戻るまで、<br>約45時間かかった。'],
  [48.1, 53.8, '結果：夕飯の一斉チンで、<br>日本中が大停電の危機に。'],
  [53.9, 56.1, '温めるのは、時間をずらして。'],
  [56.2, 59.4, '次に日本人全員で<br>やってほしいことは？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
function offAll(f) { K.visible = (f === shot0 || f === shot1 || f === shot2 || f === shot8); barsOn(f === shot4); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(MW.x + lerp(0.9, 0.7, u), MW.y + lerp(0.75, 0.65, u), MW.z + lerp(1.7, 1.45, u), MW.x - 0.02, MW.y + 0.1, MW.z, 50); }
const TP = 0.5; // v2：0.5秒でスタート（冒頭で待たせない）
function shot0(t) { // hook: microwave close-up, countdown hits 0 at 0.5s and it turns on
  lift(-50); // v2：0秒目サムネ。レンジをタイトルのバッジから離す
  kitchen(); cook.visible = false; setMW(t >= TP, 120 - Math.max(0, t - TP), t);
  hookCam(t);
  el.flash.style.opacity = t >= TP ? 0.4 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  setHud('全国いっせいにチンまで', cd(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return room;
}
function shot1(t) { // everyday: someone puts a dish in
  lift(80);
  kitchen(); cook.visible = true; setMW(false, 0, t);
  cook.userData.arms.forEach((a, i) => a.rotation.x = -0.9 - Math.sin(t * 2 + i) * 0.1);
  const u = ease(t / 3.5);
  look(lerp(-3.3, -3.0, u), lerp(2.0, 1.9, u), lerp(0.9, 0.5, u), -1.7, 1.0, -2.75, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  setHud('全国いっせいにチンまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  return room;
}
function shot2(t) { // +0秒: microwave on
  lift(80);
  kitchen(); cook.visible = false; setMW(true, Math.max(0, 118 - t), t); // v2：冒頭の0.5秒でスタートした続き
  cook.userData.arms.forEach(a => a.rotation.x = 0);
  const u = ease(t / 8);
  look(MW.x + lerp(1.2, 0.8, u), MW.y + lerp(0.9, 0.7, u), MW.z + lerp(2.4, 1.8, u), MW.x - 0.05, MW.y + 0.15, MW.z, 50);
  hudTime('+0秒');
  if (t < 4.1) setTop('日本の世帯数（2020年）', comma(countUp(t, 5570, 0.2, 1.3)) + '万世帯', fade(t, 0.15, 4.1, 0.2));
  else setTop('電子レンジの消費電力（目安）', comma(countUp(t - 4.1, 1400, 0.05, 1.1)) + 'W', fade(t, 4.1, 8, 0.2), '#ffd27a');
  return room;
}
function shot3(t) { // +1秒: town at dusk, every window lights up
  setTownEnv('dusk'); townBlack(0); townPeople(false, t);
  for (const h of HOUSES) for (const m of h.wins) m.emissiveIntensity = h.lit ? 1.4 + Math.sin(t * 20 + h.q * 30) * 0.25 : 0;
  const u = ease(t / 8);
  look(lerp(30, 22, u), lerp(26, 20, u), lerp(42, 36, u), 0, 0, 4, 50);
  hudTime('+1秒');
  if (t < 4.1) setTop('同時に動く電子レンジ（全世帯で）', comma(countUp(t, 5570, 0.2, 1.3)) + '万台', fade(t, 0.15, 4.1, 0.2));
  else setTop('増える電力（単純計算）', '約' + comma(countUp(t - 4.1, 7800, 0.05, 1.3)) + '万kW', fade(t, 4.1, 8, 0.2), '#ff8a5a');
  return town;
}
function shot4(t) { // +2秒: bars vs summer peak
  lift(300); setStageColor('#14213a');
  const k = ease(clamp((t - 0.2) / 1.6));
  barPeak.setH(4.5 * k, k > 0.05 ? comma(Math.round(16260 * k)) + '万kW' : '');
  barMW.setH(4.5 * 7800 / 16260 * k, k > 0.05 ? comma(Math.round(7800 * k)) + '万kW' : '');
  const u = ease(t / 8);
  look(lerp(-1, 1, u), lerp(5.5, 5, u), lerp(17, 16, u), 0, 2.4, 0, 50);
  hudTime('+2秒');
  setTop('2025年夏の全国最大需要（暫定）', '1億' + comma(6260) + '万kW', fade(t, 0.15, 8, 0.25));
  return stage;
}
function mapNight(fn) { setMapEnv('night'); setDots(fn); }
function shot5(t) { // +3秒: map at night, lights flicker
  mapNight((i, x, z, q) => ({ hide: Math.sin(t * 14 + q * 40) > 0.85 - t * 0.06, color: '#ffd98a' }));
  const u = ease(t / 9.2);
  look(lerp(-6, -2, u), lerp(270, 240, u), lerp(80, 70, u), -4, 0, -30, 50);
  hudTime('+3秒');
  if (t < 4.4) setTop('使う電気が作る電気を超えると（防災白書）', '周波数が下がる', fade(t, 0.15, 4.4, 0.2), '#ff8a7a');
  else setTop('下がりすぎると（防災白書）', '発電機が自動で停止', fade(t, 4.4, 9.2, 0.2), '#ff8a7a');
  return japan;
}
function shot6(t) { // 2018 Hokkaido blackout
  const off = clamp((t - 0.6) / 0.6);
  lift(260);
  mapNight((i, x, z, q) => ({ hide: isHK(x, z) && q < off * 1.01, color: '#ffd98a' }));
  const h = ll(142.5, 43.2); const u = ease(t / 8.8);
  look(h.x + lerp(10, 4, u), lerp(110, 85, u), h.z + lerp(70, 55, u), h.x, 0, h.z - 2, 50);
  setHud('2018年9月6日', '北海道', 1);
  if (t < 4.4) setTop('北海道の停電（2018年）', '最大約' + countUp(t, 295, 0.6, 1.2) + '万戸', fade(t, 0.15, 4.4, 0.2), '#ff8a7a');
  else setTop('全域に電気が戻るまで（2018年）', '約' + countUp(t - 4.4, 45, 0.05, 1.0) + '時間', fade(t, 4.4, 8.8, 0.2), '#ff8a7a');
  return japan;
}
function shot7(t) { // result: town at night, blackout, people puzzled
  setTownEnv('night'); townBlack(1); townPeople(true, t);
  const u = ease(t / 7.5);
  look(lerp(14, 18, u), lerp(10, 14, u), lerp(30, 36, u), 0, 1, 8, 50);
  setTop('一斉チンで増える電力（単純計算）', '約' + comma(7800) + '万kW', fade(t, 0.15, 7.5, 0.25), '#ff8a5a');
  return town;
}
function shot8(t) { // loop: microwave close-up, countdown
  lift(-50);
  kitchen(); cook.visible = false; setMW(false, 0, t);
  hookCam(t + 0.3, 4.5);
  setHud('全国いっせいにチンまで', cd(TP), 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 65, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { offAll(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 65,
  cut: [[2.5, 6.0]], // v2：夕ごはんを入れる いつもの夕方（元の2.5〜6秒）を抜いて、スタート直後から本題へ
  meta: {
    id: '0103',
    v2: true,
    hookLine: '日本中のレンジが、一斉に動き出した。',
    series: '日本人全員で',
    hookType: 'H1',
    cat: '全員が同時に・極端な数字',
    title: '日本中の家で同時に電子レンジを使ったら？',
    titleHtml: '日本中の家で同時に<br>レンジを使ったら？',
    mood: 'tension', seed: 103, hits: [0.5, 48.1], risers: [2.5], impacts: [18.3, 39.4],
    sfx: [[0.5, 'alarm'], [30.4, 'meter', 0.7], [40.0, 'poof']],
    narr: { '1,400W': '1400ワット', '7,800万kW': '7800万キロワット', '5,570万世帯': '5570万世帯', '45時間': 'よんじゅうごじかん' },
    ask: '次に全員で同時にやってほしいのは？',
    caption: 'もしも日本中の家で、夕ごはんの時間に一斉に電子レンジを使ったら？\n日本の世帯は5,570万（2020年）。電子レンジ1台はおよそ1,400W。全世帯で同時に動かすと、約7,800万kWが一瞬で上乗せされる（単純計算）。これは2025年の夏、日本で一番電気を使った時間（1億6,260万kW）の約半分。\n使う電気が作る電気を超えると周波数が下がり、下がりすぎると発電機は壊れないように自動で止まる。2018年の北海道では、これで全域の最大約295万戸が停電し、全部に電気が戻るまで約45時間かかった。\n温めるのは、時間をずらして。\n\n次に全員で同時にやってほしいのは？ コメントで教えて。\n\n出典：総務省 令和2年国勢調査、東京都 家庭の省エネハンドブック（資源エネルギー庁調べ他）、電力広域的運営推進機関（2025年度夏季実績・暫定）、内閣府 令和元年版防災白書',
    hashtags: ['もしもラボ', '電子レンジ', '停電', '電力', 'もしも'],
    endStats: [['日本の世帯数', '5,570万世帯', '2020年'], ['電子レンジの消費電力', '約1,400W', '目安'], ['一斉に使うと（単純計算）', '約7,800万kW', ''], ['夏の全国最大需要', '1億6,260万kW', '2025年夏'], ['北海道の停電', '最大約295万戸', '2018年']],
    sources: '出典：総務省 国勢調査（2020年）、東京都（資源エネルギー庁調べ他）、<br>電力広域的運営推進機関（2025年）、令和元年版防災白書',
  },
});
