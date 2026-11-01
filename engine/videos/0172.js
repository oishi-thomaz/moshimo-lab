import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, canvasTex } from '../lib.js';
import { town, HOUSES, setTownEnv, setVacant } from '../scenes/town.js';
import { japan, ll, CITY, setDots, setMapEnv, dots, landM, LAND_Y } from '../scenes/japan.js';
import { stage, makeLabel, setStageColor } from '../scenes/stage.js';
import { cam, lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも日本人全員が同時に電気を消したら？（blueprint no 172・日本人全員でシリーズ・v2）
// 数字：
//  ・夏の19時ごろの家庭の電気の使い方：照明 14.9%（エアコン38.3%、冷蔵庫12.0% …）
//    （資源エネルギー庁「夏季の省エネメニュー」から政府広報室作成 https://www.gov-online.go.jp/article/202208/entry-9897.html）
//  ・電気は多く貯められないので、使う分だけ作られる＝同時同量。需要と供給のバランスがくずれると周波数や電圧が乱れ、
//    大幅にくずれると大規模な停電につながることもある。東日本50Hz・西日本60Hz。周波数の変動幅の目標は ±0.1〜0.3Hz 以内
//    （経済産業省 資源エネルギー庁 エネルギー教育資料 https://energy-kyoiku.meti.go.jp/assets/114/m_energy_p48-51.pdf）
//  ・発電機は一定範囲の周波数でしか運転できず、周波数が大きくずれると発電機が停止し、最悪の場合は広範囲の停電に
//    （九州電力 https://www.kyuden.co.jp/library/pdf/csr/2012/csr2012_b_04.pdf ／東京電力パワーグリッド https://www.tepco.co.jp/forecast/html/ufr-j.html）
//  ・2018年9月6日 北海道：3時7分の地震で発電機が止まり周波数が急低下（46.13Hzまで）。道東などでは逆に周波数が上昇して水力発電が停止。
//    3時25分に北海道エリア全域がブラックアウト（地震から18分）
//    （電力広域的運営推進機関 北海道胆振東部地震に伴う大規模停電に関する検証委員会 資料 https://www.occto.or.jp/iinkai/hokkaido_kensho/files/hokkaido_kensho_04_03_2.pdf）

const GOLD = '#ffd27a', BLUE = '#7fd4ff', RED = '#ff6b5f', GREEN = '#7ff0c8';

// ---------- 町：窓の明かりを手で切り替える ----------
function setWindows(k) { // k: 点いている割合（q < k の家が点く）
  for (const h of HOUSES) { const on = h.lit && h.q < k; for (const m of h.wins) { m.emissiveIntensity = on ? 2.3 : 0; m.color.set(on ? '#3a4250' : '#1c2230'); } }
}
function townNight(k) { setTownEnv('night'); setVacant(0); setWindows(k); town.fog.near = 40; town.fog.far = 160; }

// ---------- 日本地図（夜） ----------
const HOK = (x, z) => { const a = ll(139.8, 41.4), b = ll(145.8, 45.6); return x > a.x && x < b.x && z < a.z && z > b.z; };
function nightMap() { setMapEnv('night'); landM.color.set('#3a4f6e'); }
function mapLights(fn) { // fn(i,x,z,q) -> 明るさ 0..1
  setDots((i, x, z, q) => { const v = fn(i, x, z, q); return v <= 0.01 ? { hide: true } : { s: 0.6 + v * 0.5, color: '#ffd98a' }; });
}
const timeLab = textSprite('', { w: 640, h: 200, size: 120, color: '#fff', bg: 'rgba(10,14,22,.82)', depthTest: false }); timeLab.renderOrder = 10; japan.add(timeLab); timeLab.visible = false;

// ---------- 発電所（ステージ） ----------
setStageColor('#0f1a2e');
const PLANT = new THREE.Group(); stage.add(PLANT);
{
  const hall = box(7, 3.2, 3.6, mat('#c9ced6')); hall.position.set(-0.8, 1.9, -1); PLANT.add(hall);
  const roof = box(7.2, 0.25, 3.8, mat('#7b8494')); roof.position.set(-0.8, 3.6, -1); PLANT.add(roof);
  for (let i = 0; i < 5; i++) { const w = box(0.8, 0.6, 0.05, new THREE.MeshLambertMaterial({ color: '#2a3344', emissive: '#ffd98a', emissiveIntensity: 1 })); w.position.set(-3.6 + i * 1.4, 2.4, 0.83); PLANT.add(w); w.userData.win = true; }
  for (const x of [3.6, 5.0]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.6, 7.5, 14), mat('#dfe3ea')); c.position.set(x, 4.05, -1.5); PLANT.add(c); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.5, 14), mat('#d9534f')); band.position.set(x, 7.2, -1.5); PLANT.add(band); }
  const tower = box(0.25, 6, 0.25, mat('#8b93a3')); tower.position.set(-5.6, 3.3, 0.5); PLANT.add(tower);
  const arm = box(2.4, 0.18, 0.18, mat('#8b93a3')); arm.position.set(-5.6, 5.8, 0.5); PLANT.add(arm);
}
const PWIN = PLANT.children.filter(o => o.userData.win);
const SMK = []; { const r = rng(4); for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshLambertMaterial({ color: '#eef1f5', transparent: true, opacity: 0.7 })); stage.add(m); SMK.push({ m, x: i % 2 ? 3.6 : 5.0, ph: r() }); } }
function smoke(t, k) { SMK.forEach(({ m, x, ph }) => { const u = (t * 0.25 + ph) % 1; m.visible = k > 0.02; m.position.set(x + u * 2.5, 8.0 + u * 5, -1.5); m.scale.setScalar((0.6 + u * 1.6) * Math.max(0.2, k)); m.material.opacity = 0.75 * (1 - u) * k; }); }
function plantOn(k) { PWIN.forEach(w => w.material.emissiveIntensity = k * 1.2); }
const doujiLab = makeLabel('使う量 ＝ 作る量', { sx: 7, size: 104, color: GOLD, stroke: 10, w: 1024, h: 192 }); doujiLab.position.set(0, 10.5, 0); stage.add(doujiLab);

// ---------- 周波数メーター（キャンバス） ----------
const GW = 1024, GH = 640; const gc = document.createElement('canvas'); gc.width = GW; gc.height = GH;
const gTex = new THREE.CanvasTexture(gc); gTex.colorSpace = THREE.SRGBColorSpace;
const gauge = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, transparent: true })); gauge.scale.set(11, 11 * GH / GW, 1); stage.add(gauge);
function drawGauge(hz, tol = 0.3, danger = 0) {
  const g = gc.getContext('2d'); g.clearRect(0, 0, GW, GH);
  const cx = GW / 2, cy = GH * 0.84, R = 420, span = 2.0; // 48〜52Hz を半円に
  const ang = (v) => Math.PI + clamp((v - 50 + span) / (2 * span)) * Math.PI;
  g.fillStyle = 'rgba(12,18,30,.92)'; g.beginPath(); g.roundRect(20, 20, GW - 40, GH - 40, 40); g.fill();
  g.lineWidth = 64; g.lineCap = 'butt';
  g.strokeStyle = '#7a2b2b'; g.beginPath(); g.arc(cx, cy, R, Math.PI, 2 * Math.PI); g.stroke();
  g.strokeStyle = '#2f9e6e'; g.beginPath(); g.arc(cx, cy, R, ang(50 - tol), ang(50 + tol)); g.stroke();
  g.fillStyle = '#cfd6e0'; g.font = '700 46px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center';
  for (const v of [48, 49, 50, 51, 52]) { const a = ang(v); g.fillText(v + '', cx + Math.cos(a) * (R - 92), cy + Math.sin(a) * (R - 92) + 16); }
  const a = ang(hz); g.strokeStyle = danger > 0.5 ? '#ff6b5f' : '#ffffff'; g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R - 20), cy + Math.sin(a) * (R - 20)); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.fill();
  g.fillStyle = danger > 0.5 ? '#ff6b5f' : '#ffffff'; g.font = '900 96px "Noto Sans CJK JP", sans-serif'; g.fillText(hz.toFixed(1) + 'Hz', cx, cy - 120);
  gTex.needsUpdate = true;
}
function stageMode(m) { PLANT.visible = m === 'plant' || m === 'both'; doujiLab.visible = m === 'plant'; gauge.visible = m === 'gauge' || m === 'both'; }

const SUBS = [
  [2.6, 6.1, '節電でいいこと？<br>実は発電所がピンチ。'],
  [6.2, 10.1, '夏の夜7時、家の電気の<br>約15%は照明。'],
  [10.2, 14.1, 'それが日本中で、<br>一瞬でいらなくなった。'],
  [14.2, 18.1, '電気はほとんど貯められない。<br>使う分だけ作っている。'],
  [18.2, 22.1, 'でも本当にヤバいのは、<br>ここから。'],
  [22.2, 26.1, '使う量と作る量がずれると、<br>周波数が乱れる。'],
  [26.2, 30.1, '許されるずれは、<br>たった0.1〜0.3Hz。'],
  [30.2, 34.1, 'ずれが大きいと、<br>発電機は止まってしまう。'],
  [34.2, 38.1, '2018年の北海道では、<br>そのバランスが崩れた。'],
  [38.2, 42.6, '周波数が上がった所では、<br>水力発電所も止まった。'],
  [42.7, 47.8, '地震から18分で、<br>北海道全域が停電。'],
  [48.1, 53.8, '結果：一斉に消すと、<br>発電所が止まる危険も。'],
  [53.9, 56.1, '電気は、ほぼ貯められない。'],
  [56.2, 59.4, '次に日本人全員で<br>やってほしいことは？'],
];

const cd = (left) => `0:${String(Math.floor(Math.max(0, left))).padStart(2, '0')}.${String(Math.floor((Math.max(0, left) % 1) * 100)).padStart(2, '0')}`;
const TP = 0.5;
function hookCam(t) { const u = ease(clamp(t / 2.6)); look(lerp(-1.5, -1.0, u), lerp(3.2, 3.6, u), lerp(13, 12, u), -9, 2.6, -6, 50); }
function shot0(t) { // 0秒＝サムネ：夜の住宅街の明かり。0.5秒で全部消える
  lift(150); townNight(t < TP ? 1 : 0);
  el.flash.style.opacity = 0;
  hookCam(t); if (t > TP && t < TP + 0.4) { cam.position.x += Math.sin(t * 70) * 0.03; }
  setHud('全員で消灯まで', cd(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ffd27a' });
  return town;
}
function shot1(t) { // 真っ暗な町を上から
  lift(120); townNight(0);
  const u = ease(clamp(t / 3.6)); look(lerp(-2, 6, u), lerp(5, 34, u), lerp(14, 34, u), 0, 0, -6, 50);
  return town;
}
function shot2(t) { // 日本地図：明かり → 消える
  nightMap(); timeLab.visible = false; lift(140);
  const off = clamp((t - 4.4) / 0.6);
  mapLights((i, x, z, q) => 1 - off);
  dots.material.emissiveIntensity = 1.4;
  const u = ease(clamp(t / 8)); look(lerp(-4, 2, u), lerp(185, 172, u), lerp(105, 98, u), 0, 0, 6, 50);
  if (t < 4) setTop('夏の夜7時、家庭の電気のうち照明', countUp(t, 149, 0.3, 1.2) / 10 + '%', fade(t, 0.15, 3.9, 0.25), GOLD);
  else setTop('日本中の明かり', '一斉にオフ', fade(t, 4.0, 7.9, 0.25), BLUE);
  return japan;
}
function shot3(t) { // 発電所：同時同量
  lift(220); stageMode('plant'); plantOn(1); smoke(t, 1);
  doujiLab.position.y = 10.3 + Math.sin(t * 2.5) * 0.08;
  const u = ease(clamp(t / 8)); look(lerp(-2, 1, u), lerp(5.5, 6.2, u), lerp(24, 22, u), 0, 5, 0, 50);
  if (t < 4) setTop('電気の作り方', '同時同量', fade(t, 0.15, 3.9, 0.25), GOLD);
  else setTop('本当にヤバいのは', '周波数', fade(t, 4.0, 7.9, 0.25), RED);
  return stage;
}
function shot4(t) { // 周波数メーター
  lift(60); stageMode('both'); gauge.position.set(0, 10.4, 1.5);
  let hz = 50 + Math.sin(t * 3) * 0.05, danger = 0;
  if (t > 8) { const k = clamp((t - 8) / 1.5); hz = 50 + easeOut(k) * 1.6 + Math.sin(t * 9) * 0.05 * k; danger = k; }
  drawGauge(hz, 0.3, danger);
  const pk = t > 9.5 ? Math.max(0, 1 - (t - 9.5) / 1.2) : 1; plantOn(pk); smoke(t, pk);
  const u = ease(clamp(t / 12)); look(lerp(-1, 1, u), 7.5, lerp(26, 24, u), 0, 7.6, 0, 50);
  if (t < 4) setTop('周波数（東日本50Hz・西日本60Hz）', '50Hz', fade(t, 0.15, 3.9, 0.25), GREEN);
  else if (t < 8) setTop('周波数の変動幅の目標', '±0.1〜0.3Hz', fade(t, 4.0, 7.9, 0.25), GREEN);
  else setTop('ずれが大きいと', '発電機が停止', fade(t, 8.0, 12, 0.25), RED);
  return stage;
}
function shot5(t) { // 2018年 北海道（3:07 → 3:25）
  nightMap(); lift(140); dots.material.emissiveIntensity = 1.4;
  const T0 = 3 * 60 + 7; const mins = t < 8.5 ? lerp(0, 18, clamp((t - 0.4) / 8.1)) : 18;
  const off = (q) => t > 8.5 ? true : q < clamp((t - 4.0) / 4.5) * 0.7;
  mapLights((i, x, z, q) => HOK(x, z) ? (off(q) ? 0 : 1) : 0.35);
  const hk = ll(142.6, 43.3); const u = ease(clamp(t / 13.6));
  look(hk.x + lerp(-6, 4, u), lerp(70, 60, u), hk.z + lerp(48, 42, u), hk.x, 0, hk.z + 4, 50);
  const m = Math.floor(T0 + mins); timeLab.visible = true; timeLab.userData.set(`${Math.floor(m / 60)}時${String(m % 60).padStart(2, '0')}分`);
  timeLab.position.set(hk.x + 2, 10, hk.z - 6); timeLab.scale.set(13, 4, 1);
  setHud('2018年9月6日', '北海道', 1, { color: GOLD });
  if (t < 4) setTop('地震で発電機が止まり、周波数が', '46.13Hzまで低下', fade(t, 0.15, 3.9, 0.25), RED);
  else if (t < 8.5) setTop('周波数が上がった道東などでは', '水力発電が停止', fade(t, 4.0, 8.4, 0.25), RED);
  else setTop('地震から全域停電まで', '18分', fade(t, 8.5, 13.6, 0.25), RED);
  return japan;
}
function shot6(t) { // 結果：真っ暗な日本と、止まった発電所
  if (t < 3.7) {
    lift(60); stageMode('both'); gauge.position.set(0, 10.4, 1.5); drawGauge(51.6 + Math.sin(t * 9) * 0.05, 0.3, 1); plantOn(0); smoke(t, 0);
    look(0, 7.5, 25, 0, 7.6, 0, 50);
    setTop('ずれが大きいと', '発電機が停止', fade(t, 0.15, 3.7, 0.25), RED);
    return stage;
  }
  nightMap(); lift(140); timeLab.visible = false; mapLights(() => 0);
  const u = ease(clamp((t - 3.7) / 3.8)); look(lerp(0, 3, u), 185, 105, 0, 0, 6, 50);
  setTop('夏の夜7時、家庭の電気のうち照明', '14.9%', fade(t, 3.7, 7.5, 0.25), GOLD);
  return japan;
}
function shot7(t) { // ループ：冒頭と同じ。明かりが点いた町、0:00.50
  lift(150); townNight(1); hookCam(0);
  setHud('全員で消灯まで', cd(TP), 1, { mono: true });
  return town;
}

const shots = [
  { a: 0, b: 2.6, f: shot0 }, { a: 2.6, b: 6.2, f: shot1 }, { a: 6.2, b: 14.2, f: shot2 }, { a: 14.2, b: 22.2, f: shot3 },
  { a: 22.2, b: 34.2, f: shot4 }, { a: 34.2, b: 48.0, f: shot5 }, { a: 48.0, b: 55.5, f: shot6 }, { a: 55.5, b: 59.6, f: shot7 },
  { a: 59.6, b: 64.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.6, camera: cam,
  meta: {
    id: '0172',
    v2: true,
    hookLine: '日本中の電気が、一斉に消えた。',
    series: '日本人全員で',
    hookType: 'H2',
    cat: '全員が同時に・極端な数字',
    title: '日本人全員が同時に電気を消したら？',
    titleHtml: '日本人全員が同時に<br>電気を消したら？',
    mood: 'tension', seed: 172, hits: [0.5, 48.1], risers: [18.2], impacts: [6.6, 26.4, 30.4, 42.9],
    sfx: [[0.5, 'poof'], [10.6, 'whoosh'], [32.0, 'alarm'], [38.4, 'meter', 0.6]],
    narr: { '約15%': 'やく15パーセント', '0.1〜0.3Hz': 'れいてんいちから、れいてんさんヘルツ', '18分': 'じゅうはっぷん', '2018年': '2018年' },
    ask: '次に日本人全員でやってほしいことは？',
    caption: 'もしも日本人全員が、同時に家の電気を消したら？\n\n夏の夜7時、家で使う電気の約15%（14.9%）は照明。それが日本中で一瞬でいらなくなる。\n節電でいいことに見えるけど、電気はほとんど貯められない。使う分だけ、その瞬間に作っている（同時同量）。\n使う量と作る量がずれると、周波数（東日本50Hz・西日本60Hz）が乱れる。許されるずれは、たった0.1〜0.3Hz。ずれが大きいと、発電機は自分を守るために止まってしまう。\n2018年9月6日の北海道では、地震で発電機が止まって周波数が46.13Hzまで低下。逆に周波数が上がった道東などでは水力発電が止まり、地震から18分で北海道全域が停電した。\n\n結果：一斉に消すと、発電所が止まる危険も。電気は、ほぼ貯められない。\n\n次に日本人全員でやってほしいことは？ コメントで教えて。\n\n出典：資源エネルギー庁（政府広報オンライン）、経済産業省 エネルギー教育資料、九州電力、東京電力パワーグリッド、電力広域的運営推進機関 検証委員会資料',
    hashtags: ['もしもラボ', '電気', '停電', '節電', '雑学'],
    endStats: [['夏の夜7時の照明', '14.9%', '家庭の電気のうち'], ['周波数', '50Hz／60Hz', '東日本／西日本'], ['ずれの目標', '±0.1〜0.3Hz', '経済産業省'], ['北海道 全域停電まで', '18分', '2018年9月6日']],
    sources: '出典：資源エネルギー庁、経済産業省、九州電力、<br>東京電力PG、電力広域的運営推進機関',
  },
});
