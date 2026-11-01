import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setClock, props, lamp } from '../scenes/room.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも1年間太陽の光を浴びなかったら？（blueprint no 732・人体の限界シリーズ）
// 数字：
//  人の体内時計の周期は平均24時間11分（Czeisler ほか Science 1999年6月25日号、24人を約1か月観察）
//   https://news.harvard.edu/gazette/story/1999/07/human-biological-clock-set-back-an-hour
//   光がないと毎日11分ずつずれる→30日で約5時間半（単純計算）
//  1日分のビタミンD（5.5µg・顔と手の甲 600cm²）を肌で作るのに必要な日光（晴天・正午）：つくば7月 3.5分、つくば12月 22.4分、札幌12月 76.4分
//   （国立環境研究所 2013年）https://cger.nies.go.jp/ja/about/results/2013/13030.html
//  東京都内で健診を受けた5,518人の98%がビタミンD不足（30ng/mL未満。2019年4月〜2020年3月、東京慈恵会医科大学 2023年6月発表）
//   https://www.jikei.ac.jp/news/pdf/press_release_20230605.pdf
//  ビタミンD欠乏症の最も一般的な原因は日光を十分に浴びないこと。成人では骨軟化症（骨がもろくなる）、骨粗しょう症を悪化させる（MSDマニュアル家庭版）
//   https://www.msdmanuals.com/ja-jp/home/11-栄養障害/ビタミン/ビタミンd欠乏症

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- the window, the sunbeam, the shutter ----------
const WIN = new THREE.Vector3(-1.6, 1.85, -3.48);
const shutterM = mat('#5b6068');
const SHUT = new THREE.Group(); room.add(SHUT);
{ const s = box(2.5, 1.75, 0.06, shutterM); SHUT.add(s); for (let i = 0; i < 11; i++) { const l = box(2.5, 0.03, 0.08, mat('#474b52')); l.position.set(0, -0.8 + i * 0.16, 0.02); SHUT.add(l); } }
const beamM = new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
// beam: a prism from the window down to the floor
const beamGeo = new THREE.BufferGeometry();
{ const w = 1.05, h = 0.72; const A = [[-w, h, 0], [w, h, 0], [w, -h, 0], [-w, -h, 0]].map(([x, y, z]) => [x + WIN.x, y + WIN.y, WIN.z + 0.05]);
  const B = [[-w, 0, 0], [w, 0, 0], [w, 0, 0], [-w, 0, 0]].map(([x], i) => [x + WIN.x + 0.6, 0.02, i < 2 ? -0.2 : 1.6]);
  const v = []; const quad = (a, b, c, d) => v.push(...a, ...b, ...c, ...a, ...c, ...d);
  quad(A[0], A[1], B[1], B[0]); quad(A[3], A[2], B[2], B[3]); quad(A[0], A[3], B[3], B[0]); quad(A[1], A[2], B[2], B[1]);
  beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); }
const beam = new THREE.Mesh(beamGeo, beamM); room.add(beam);
const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.8), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.5, depthWrite: false })); patch.rotation.x = -Math.PI / 2; patch.position.set(WIN.x + 0.6, 0.025, 0.7); room.add(patch);
const dust = makeSparkles(120, 0.04, 0xfff3c0); room.add(dust.points);
{ const pts = []; const r = rng(4); for (let i = 0; i < 40; i++) pts.push([WIN.x + (r() - 0.3) * 2, 0.4 + r() * 1.8, -2.5 + r() * 3]); dust.init(pts, 0.4, 0.5); }
function setSun(k) { beam.visible = patch.visible = k > 0.01; beamM.opacity = 0.22 * k; patch.material.opacity = 0.5 * k; }
function setShutter(k) { SHUT.visible = k > 0.001; SHUT.position.set(WIN.x, WIN.y + (1 - k) * 1.7, WIN.z + 0.18); SHUT.scale.y = Math.max(0.01, k); }

// ---------- you ----------
const you = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#e0a85a', pants: '#3b4250', scale: 1 }); room.add(you);
const U = you.userData;
function stand(t, face = 'window') {
  you.visible = true; you.position.set(-1.0, 0, 0.2); U.legs.forEach(l => l.rotation.x = 0);
  you.rotation.y = face === 'window' ? Math.PI * 0.92 : 0.25;
  U.arms[0].rotation.set(0, 0, 0.05); U.arms[1].rotation.set(0, 0, -0.05); U.head.rotation.set(face === 'window' ? -0.15 : 0.2, 0, 0);
}
function stretch(k) { U.arms[0].rotation.set(-2.1 * k, 0, 0.3 * k); U.arms[1].rotation.set(-2.1 * k, 0, -0.3 * k); U.head.rotation.x = -0.35 * k; }
function base(mode) {
  setRoom({ sets: ['bed'], wall: '#e2dccf' }); props.sleeper.visible = false; props.phone.visible = false;
  if (mode === 'sun') { setLight('day', { ceil: 2, hemi: 1.1 }); setSun(1); setShutter(0); }
  else { setLight('dark', { ceil: 0, hemi: 0.42, lamp: 2.6 }); lamp.position.set(0.2, 1.6, -2.4); setSun(0); setShutter(1); }
  dust.set(0);
}

// ---------- stage: minutes of sun for a day's vitamin D ----------
const SUNM = [['夏（7月）', 3.5, '#f2c230'], ['冬（12月）', 22.4, '#e08a3a'], ['冬の札幌', 76.4, '#c9584a']];
const bars = SUNM.map(([l, v, c], i) => makeBar({ color: c, w: 1.9, d: 1.9, label: l, x: -3.7 + i * 3.7, z: 0, nameTop: true }));
function setBars(k) { bars.forEach((b, i) => { const kk = clamp(k * 1.6 - i * 0.3); b.setH(SUNM[i][1] / 19 * ease(kk), kk > 0.98 ? SUNM[i][1] + '分' : ''); }); }

const SUBS = [
  [2.6, 6.0, '太陽の光が、消えた。<br>最初に狂うのは、時計。'],
  [6.2, 10.1, '体の中の時計の1日は、<br>24時間より11分長い。'],
  [10.1, 14, '朝の光が毎日、<br>そのずれを直していた。'],
  [14.2, 18.1, '光がないと、毎日11分ずつ<br>ずれていく。'],
  [18.1, 22, '1か月で約5時間半。<br>でも本当の問題は骨。'],
  [22.2, 26.1, '骨に要るビタミンDは、<br>日光で肌が作っている。'],
  [26.1, 30, '夏の昼なら、<br>たった3.5分で1日分。'],
  [30.2, 34.6, '冬の札幌でも、<br>76分あれば足りる。'],
  [34.6, 39, 'それが1年中、<br>ずっと0分。'],
  [39.2, 43.6, '普通に暮らす東京の人でも、<br>98%が不足していた。'],
  [43.6, 47.8, '不足が続くと、<br>骨はもろくなる。'],
  [48.1, 53.8, '結果：体内時計はずれ続け、<br>骨の材料も作れなくなった。'],
  [53.9, 56.1, '夏なら3.5分で足りた。'],
  [56.2, 59.4, 'あなたは今日、<br>日光を何分浴びた？'],
];

const dayStr = (n) => Math.floor(n) + '日';
const TP = 0.5;
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(1.9, 1.8, u), lerp(1.4, 1.38, u), lerp(4.4, 4.2, u), -1.35, 1.38, -1.0, 50); }
function shot0(t) { // hook: you in the sunbeam by the window; at 0.5s the shutter slams down
  lift(0);
  const k = ease(clamp((t - (TP - 0.25)) / 0.25));
  base(t < TP ? 'sun' : 'dark'); setShutter(k); if (t < TP) { setLight('day', { ceil: 2, hemi: 1.1 }); setSun(1 - k * 0.6); }
  stand(t, 'window'); stretch(t < TP ? 1 : Math.max(0, 1 - (t - TP) / 0.4));
  dust.set(t < TP ? (t + 0.3) / 1.5 : 0);
  el.flash.style.opacity = t >= TP ? 0.35 * Math.max(0, 1 - (t - TP) / 0.25) : 0;
  hookCam(t);
  setHud('太陽の光を浴びていない', t < TP ? '0日' : '1日目', 1, { color: t < TP ? '#fff' : '#ff8a7a' });
  return room;
}
function shot1(t) { // dark room, one lamp, you turn away from the shuttered window
  lift(0); base('dark'); stand(t, 'room'); setClock('7:00');
  const u = ease(t / 3.5); look(lerp(1.8, 2.3, u), lerp(1.38, 1.6, u), lerp(4.2, 4.9, u), -1.0, 1.3, -1.0, 50);
  return room;
}
function shot2(t) { // +1日: the bedside clock, internal clock 24h11m
  lift(200); base('dark'); stand(t, 'room'); setClock(t < 4 ? '7:00' : '7:11', t < 4 ? '#7fd4ff' : '#ff8a7a');
  const u = ease(t / 8); look(lerp(0.9, 0.7, u), lerp(1.3, 1.25, u), lerp(-1.3, -1.6, u), -0.05, 0.69, -2.95, 46);
  hudTime('+1日');
  if (t < 4.1) setTop('人の体内時計の1日（1999年の研究）', '24時間' + countUp(t, 11, 0.4, 1.2) + '分', fade(t, 0.3, 4.1, 0.25), BLUE);
  else setTop('朝の光が毎日直していた、ずれ', '11分', fade(t, 4.1, 8, 0.25), BLUE);
  return room;
}
function shot3(t) { // +1か月: you awake in bed at a strange hour
  lift(200); base('dark'); you.visible = false; props.sleeper.visible = true; props.sleeper.position.y = 0.74; props.sleeper.userData.head.rotation.y = 0;
  const h = Math.floor(lerp(7, 12, clamp(t / 7))), m = Math.floor(lerp(0, 30, clamp(t / 7))) % 60;
  setClock(`${h}:${String(m).padStart(2, '0')}`, '#ff8a7a');
  const u = ease(t / 8.2); look(lerp(-0.6, -0.4, u), lerp(2.3, 2.2, u), lerp(1.4, 1.0, u), 1.2, 0.8, -2.2, 50);
  hudTime('+1か月');
  setTop('体内時計のずれ（30日・単純計算）', t < 1.8 ? countUp(t, 330, 0.3, 1.3) + '分' : '約5時間半', fade(t, 0.3, 8.2, 0.25), RED);
  return room;
}
function shot4(t) { // +半年: you in front of the shuttered window (vitamin D)
  lift(150); base('dark'); stand(t, 'window'); you.position.set(-1.4, 0, -1.9); U.head.rotation.x = -0.05;
  const u = ease(t / 8); look(lerp(0.4, 0.7, u), lerp(1.6, 1.7, u), lerp(1.4, 1.8, u), -1.5, 1.5, -2.8, 50);
  hudTime('+半年');
  setTop('1日分のビタミンDに要る日光（7月の正午・2013年）', '3.5分', fade(t, 4.0, 8, 0.25), GOLD);
  return room;
}
function shot5(t) { // +半年: stage — minutes of sun needed
  setStageColor('#1d2438'); lift(330); setBars(clamp((t - 0.3) / 3.5));
  const u = ease(t / 9); look(lerp(0, 0.3, u), lerp(4.0, 4.3, u), lerp(20, 19, u), 0, 2.9, 0, 50);
  hudTime('+半年');
  if (t < 4.4) setTop('1日分に要る日光（札幌・12月の正午・2013年）', '76.4分', fade(t, 0.3, 4.4, 0.25), GOLD);
  else setTop('あなたが浴びた日光', '0分', fade(t, 4.4, 9, 0.25), RED);
  return stage;
}
function shot6(t) { // +1年: dark room, you sit on the bed under the lamp
  lift(60); base('dark'); you.visible = true; you.position.set(0.9, 0.35, -0.6); you.rotation.y = -0.3;
  U.legs.forEach(l => l.rotation.x = -Math.PI / 2); U.arms[0].rotation.set(-0.3, 0, 0.1); U.arms[1].rotation.set(-0.3, 0, -0.1); U.head.rotation.set(0.35, 0, 0);
  const u = ease(t / 8.8); look(lerp(-1.4, -1.1, u), lerp(1.7, 1.6, u), lerp(3.3, 3.0, u), 0.8, 1.15, -0.8, 48);
  hudTime('+1年');
  if (t < 4.4) setTop('東京の健診でビタミンD不足（2019〜20年度）', countUp(t, 98, 0.4, 1.2) + '%', fade(t, 0.3, 4.4, 0.25), RED);
  else setTop('ビタミンDが足りないと、大人の骨は', 'もろくなる', fade(t, 4.4, 8.8, 0.25), RED);
  return room;
}
function shot7(t) { // result: the shuttered window, dark room, wide
  lift(150); base('dark'); you.visible = true; you.position.set(-1.2, 0, -1.6); you.rotation.y = Math.PI; U.legs.forEach(l => l.rotation.x = 0); U.arms.forEach(a => a.rotation.set(0, 0, 0)); U.head.rotation.set(-0.1, 0, 0);
  const u = ease(t / 7.5); look(lerp(1.5, 2.2, u), lerp(2.0, 2.3, u), lerp(3.6, 4.6, u), -1.3, 1.4, -2.6, 52);
  const a = t < 3.6;
  setTop(a ? '体内時計のずれ（毎日）' : '浴びた日光（1年）', a ? '11分' : '0分', fade(t, 0.15, 7.5, 0.25), RED);
  return room;
}
function shot8(t) { // loop: hook framing, shutter still down (result state)
  lift(0); base('dark'); stand(t, 'window');
  hookCam(t + 0.5, 4.5);
  setHud('太陽の光を浴びていない', '365日', 1, { color: '#ff8a7a' });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22.2, f: shot3 },
  { a: 22.2, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0732',
    v2: true,
    hookLine: '1年間、太陽の光を浴びなくなった。',
    series: '人体の限界',
    hookType: 'H4',
    cat: '体・健康',
    title: '1年間太陽の光を浴びなかったら？',
    titleHtml: '1年間、太陽の光を<br>浴びなかったら？',
    mood: 'mystery', seed: 732, hits: [0.5, 48.1], risers: [34.6], impacts: [6.6, 18.4, 26.4, 39.6],
    sfx: [[0.5, 'whoosh'], [0.45, 'alarm']],
    narr: { '3.5分': '3.5ふん', '76分': '76ふん', '0分': 'ゼロふん', '11分': '11ぷん', '約5時間半': 'やく5時間半', 'ビタミンD': 'ビタミンディー', '98%': '98パーセント' },
    ask: 'あなたは今日、日光を何分浴びた？',
    caption: 'もしも1年間、太陽の光をまったく浴びなかったら、体はどうなる？\n人の体内時計の1日は平均24時間11分（Science 1999年）。光がないと、毎日少しずつずれていく。1日11分なら、1か月で約5時間半（単純計算）。\n本当の問題は骨。骨に必要なビタミンDは日光で肌が作る。1日分（顔と手の甲で5.5µg）なら、7月の正午は3.5分、12月は22.4分、冬の札幌でも76.4分（国立環境研究所 2013年）。それが1年中0分。\n普通に暮らす東京の健診受診者5,518人でも、98%がビタミンD不足だった（東京慈恵会医科大学 2023年発表）。不足が続くと大人の骨はもろくなる（骨軟化症）。\n夏なら3.5分で足りた。\n\nあなたは今日、日光を何分浴びた？ コメントで教えて。\n\n出典：Czeisler ほか Science（1999年）、国立環境研究所（2013年）、東京慈恵会医科大学（2023年）、MSDマニュアル家庭版',
    hashtags: ['もしもラボ', 'ビタミンD', '日光浴', '体内時計', '雑学'],
    endStats: [['体内時計の1日', '24時間11分', '1999年'], ['1日分のビタミンDに要る日光', '3.5分', '7月の正午'], ['冬の札幌なら', '76.4分', '12月の正午'], ['東京の健診でビタミンD不足', '98%', '2019〜20年度']],
    sources: '出典：Science（1999年）、国立環境研究所（2013年）、<br>東京慈恵会医科大学（2023年）、MSDマニュアル',
  },
});
