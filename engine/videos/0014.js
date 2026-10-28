import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, randPerson, makeQ, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setScreen, props, sets } from '../scenes/room.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill } from '../city.js';
import { lift, look, cam, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも1日だけ昭和（1970年）に戻ったら？
// 数字：携帯電話の契約数 2億3,121万（総務省 2026年6月末）
//       テレビの普及率 白黒90.2%・カラー26.3%（内閣府 消費動向調査 1970年2月）
//       公衆電話（NTT東西）最多 934,903台（1984年度）→ 96,126台（2024年度）（NTT東日本 データブック）
//       一般世帯の1世帯あたり人員 3.41人（1970年）→ 2.10人（2025年）（総務省 国勢調査）

function L(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }
// the pendant lamp would sit right under the top numbers in this framing
sets.showa.children.forEach(c => { const p = c.geometry && c.geometry.parameters; if (p && (p.radiusTop === 0.55 || (p.width === 0.01 && p.height === 0.6))) c.visible = false; });
const hero = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#4fa3d1', pants: '#2b3346' }); room.add(hero);
const phone = new THREE.Group(); { const b = box(0.09, 0.16, 0.02, mat('#1b1d22')); phone.add(b); } phone.position.set(0, -0.6, 0.12); phone.rotation.x = -1.0; hero.userData.arms[1].add(phone);
const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.14), new THREE.MeshBasicMaterial({ color: 0x9fd8ff })); scr.position.z = 0.012; phone.add(scr);
const heroQ = makeQ(); room.add(heroQ);
const noSignal = textSprite('圏外', { w: 256, h: 128, size: 80, bg: '#1b1d22', color: '#ff6b6b', sx: 0.6 }); room.add(noSignal);
// family around the chabudai
const family = [];
{
  const specs = [[-0.55, -0.6, Math.PI / 2, { skin: SKIN[1], hair: HAIR[0], shirt: '#5a6b4a', pants: '#3b3f4a' }], [0.95, -0.6, -Math.PI / 2, { skin: SKIN[3], hair: HAIR[1], shirt: '#c96f5a', pants: '#5a4a3a', long: true, skirt: true }], [0.2, -1.4, 0, { skin: SKIN[0], hair: HAIR[4], shirt: '#8a7a6a', pants: '#4a4f5c' }], [0.2, 0.2, Math.PI, { skin: SKIN[3], hair: HAIR[2], shirt: '#f2c14e', pants: '#2b3346', scale: 0.62 }]];
  for (const [x, z, ry, o] of specs) { const p = makePerson(o); const sc = o.scale || 1; p.position.set(x, -0.62 * sc, z); p.rotation.y = ry; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms.forEach(a => a.rotation.x = -0.7); room.add(p); family.push(p); }
}
// modern couple on the sofa
const couple = [];
{ const r = rng(8); for (let i = 0; i < 2; i++) { const p = randPerson(r); p.position.set(0.1 + i * 0.9, -0.4, 0.55); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms[1].rotation.x = -1.2; const ph = box(0.08, 0.14, 0.02, mat('#9fd8ff')); ph.position.set(0, -0.6, 0.12); ph.rotation.x = -1.0; p.userData.arms[1].add(ph); room.add(p); couple.push(p); } }
// phone booth in the street
const booth = new THREE.Group(); city.add(booth); booth.position.set(-3.0, 0, 6.8); booth.visible = false;
{
  const frame = mat('#3f9b5a');
  const glassM = new THREE.MeshLambertMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.35 });
  const g = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.1), glassM); g.position.y = 1.25; booth.add(g);
  const top = box(1.25, 0.25, 1.25, frame); top.position.y = 2.45; booth.add(top);
  const base = box(1.25, 0.15, 1.25, frame); base.position.y = 0.08; booth.add(base);
  for (const [x, z] of [[-0.56, -0.56], [0.56, -0.56], [-0.56, 0.56], [0.56, 0.56]]) { const p = box(0.08, 2.3, 0.08, frame); p.position.set(x, 1.2, z); booth.add(p); }
  const tel = box(0.3, 0.4, 0.2, mat('#3f9b5a')); tel.position.set(0, 1.4, -0.42); booth.add(tel);
  const sign = textSprite('公衆電話', { w: 384, h: 96, size: 60, bg: '#3f9b5a', color: '#ffffff', sx: 1.1 }); sign.position.set(0, 2.85, 0); booth.add(sign);
}
const caller = makePerson({ skin: SKIN[2], hair: HAIR[1], shirt: '#8e6bbf', pants: '#3b3f4a', long: true }); booth.add(caller); caller.position.set(0, 0.15, 0.05); caller.rotation.y = Math.PI; caller.userData.arms[1].rotation.set(-2.5, 0, 0.3);
const queue = []; { const r = rng(4); for (let i = 0; i < 4; i++) { const p = randPerson(r); booth.add(p); p.position.set(-1.0 - i * 0.85, 0, 0.2); p.rotation.y = Math.PI / 2; queue.push(p); } }

function tvScreen(mode) {
  setScreen((g, w, h) => {
    if (mode === 'bw') { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(1, '#6a6a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(w / 2, h * 0.55, 34, 0, 7); g.fill(); g.fillRect(w / 2 - 40, h * 0.7, 80, 60); g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); }
    else { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2b6cb0'); gr.addColorStop(1, '#e05a7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(w * 0.3, h * 0.45, 26, 0, 7); g.fill(); }
  });
}
function scene(mode) { // 'modern' | 'showa'
  const showa = mode === 'showa';
  setRoom({ sets: [showa ? 'showa' : 'living'] }); props.sleeper.visible = false;
  family.forEach(p => p.visible = false); couple.forEach(p => p.visible = false); hero.visible = false; heroQ.visible = false; noSignal.visible = false;
  tvScreen(showa ? 'bw' : 'color');
}
function heroAt(x, z, ry, phoneOn) { hero.visible = true; hero.position.set(x, 0, z); hero.rotation.y = ry; hero.userData.arms[1].rotation.set(phoneOn ? -1.3 : 0, 0, phoneOn ? -0.3 : 0); hero.userData.head.rotation.x = phoneOn ? 0.35 : 0; phone.visible = phoneOn; }
function cityBase() { setEnv('dusk', new THREE.Vector3(-3, 0, 6)); setStore(1); setStoreLights(0.6); setBurst(0); ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = false; updateCars(0, false); }

const SUBS = [
  [2.6, 6.0, 'いつもの部屋。<br>スマホ、テレビ、Wi-Fi。'],
  [6.2, 10.1, 'スマホは圏外。でも一番<br>変わったのは家族の数。'],
  [10.1, 14, '今は2億を超える携帯電話が、<br>1台もつながらない。'],
  [14.2, 18.1, 'テレビはほとんどが白黒。'],
  [18.1, 22, 'カラーテレビは4軒に1軒ほど。<br>外はもっと違う。'],
  [22.2, 26.1, '外で電話するなら、<br>公衆電話に並ぶ。'],
  [26.1, 30, '昭和の終わりごろには、<br>約93万台もあった。'],
  [30.2, 34.6, 'ちゃぶ台を囲んで晩ごはん。<br>この人数がカギになる。'],
  [34.6, 39, '1世帯の人数は、<br>平均3.41人。'],
  [39.2, 43.6, '元の時代に戻ってきた。<br>何が減ったか分かる？'],
  [43.6, 47.8, '今の1世帯は、<br>平均2.10人。'],
  [48.1, 52.6, '結果：電話は1人1台以上に。<br>でも家族は1.31人減った。'],
  [52.6, 55.4, '公衆電話は、いちばん<br>多いときの約10分の1に。'],
  [55.6, 59.4, '住むなら、<br>昭和と今どっち？'],
];

function shot0(t, T) { // hook: modern room flips to showa at 1.0
  const tv = 0.5; scene(t < tv ? 'modern' : 'showa'); // v2：0.5秒で昭和に変わる setLight('evening', { ceil: t < tv ? 0 : 6, hemi: 1.1 });
  heroAt(-0.2, -1.1, 0.3, true); scr.material.color.set(t < tv ? 0x9fd8ff : 0x30333a);
  noSignal.visible = t > tv + 0.3; noSignal.position.set(-0.2, 2.2, -1.1);
  el.flash.style.opacity = t >= tv ? 0.6 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  const u = ease(t / 2.6);
  lift(170); L(lerp(-0.6, -0.8, u), 1.8, lerp(4.1, 3.7, u), -0.6, 1.75, -1.6, 52); // v2：主役（スマホを持つ人）をタイトルの下に
  setHud('いまは', t < tv ? '2026年' : '1970年', 1, { color: t < tv ? '#fff' : '#f2c14e' });
  return room;
}
function shot1(t, T) { // everyday modern living
  scene('modern'); setLight('evening', { ceil: 0, hemi: 1.15 }); couple.forEach(p => p.visible = true);
  heroAt(-1.6, -1.2, 0.6, true); scr.material.color.set(0x9fd8ff);
  const u = ease(t / 3.5);
  L(lerp(-1.2, -0.8, u), 2.3, lerp(-2.8, -3.1, u), 0.4, 1.1, 0.4, 58);
  setHud('いまは', '2026年', 1);
  return room;
}
function shot2(t, T) { // +1min: no signal
  scene('showa'); setLight('evening', { ceil: 6, hemi: 1.0 }); heroAt(-0.2, -1.1, 0.3 + Math.sin(t * 0.8) * 0.4, true); scr.material.color.set(0x30333a);
  noSignal.visible = true; noSignal.position.set(-0.2, 2.35, -1.1);
  heroQ.visible = false;
  const u = ease(t / 8);
  lift(170); L(lerp(-0.8, -0.8, u), 1.8, lerp(3.7, 3.4, u), -0.6, 1.75, -1.6, 52); // v2：冒頭の終わりと同じ構図から続ける
  hudTime('+1分');
  setTop('携帯電話の契約数（2026年6月）', (() => { const v = countUp(t, 23121); return v < 10000 ? `${comma(v)}万` : `${Math.floor(v / 10000)}億${comma(v % 10000)}万`; })(), fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t, T) { // +1h black-and-white TV
  scene('showa'); setLight('evening', { ceil: 6, hemi: 1.0 });
  const u = ease(t / 8);
  L(lerp(-0.4, -0.8, u), 1.5, lerp(0.8, 0.3, u), -2.45, 1.0, -2.6, 50);
  hudTime('+1時間');
  setTop('白黒テレビの普及率（1970年2月）', (countUp(t, 902) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t, T) { // +half day: phone booth queue
  booth.visible = true; cityBase(); queue.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t + i) * 0.4; });
  const u = ease(t / 8);
  L(lerp(-4.2, -4.9, u), 2.0, lerp(14.8, 14.0, u), -3.9, 1.8, 6.8, 50);
  hudTime('+半日');
  setTop('公衆電話がいちばん多かった年（1984年度）', '約' + comma(countUp(t, 93)) + '万台', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot5(t, T) { // +night: dinner around the chabudai
  booth.visible = false; scene('showa'); setLight('night', { ceil: 9, hemi: 0.9 }); family.forEach((p, i) => { p.visible = true; p.userData.head.rotation.y = Math.sin(t * 0.7 + i) * 0.3; p.userData.arms[1].rotation.x = -0.7 + Math.sin(t * 2 + i) * 0.15; });
  const u = ease(t / 9);
  L(lerp(3.5, 3.2, u), 1.85, lerp(3.4, 3.0, u), 0.1, 1.15, -0.8, 50);
  hudTime('+夜');
  setTop('1世帯の人数（1970年）', (countUp(t, 341) / 100).toFixed(2) + '人', fade(t, 0.15, 9, 0.25));
  return room;
}
function shot6(t, T) { // +1 day: back to now, two people on the sofa
  scene('modern'); setLight('night', { ceil: 0, hemi: 1.0 }); couple.forEach(p => p.visible = true);
  el.flash.style.opacity = 0.5 * Math.max(0, 1 - t / 0.3);
  const u = ease(t / 8.6);
  L(lerp(-1.0, -0.6, u), 2.3, lerp(-2.8, -3.1, u), 0.5, 1.0, 0.5, 58);
  hudTime('+1日');
  setTop('1世帯の人数（2025年）', (countUp(t, 210) / 100).toFixed(2) + '人', fade(t, 0.15, 8.6, 0.25));
  return room;
}
function shot7(t, T) { // result: the showa table, now with fewer people
  scene('showa'); setLight('evening', { ceil: 6, hemi: 1.0 }); family.forEach((p, i) => p.visible = i < 2);
  const u = ease(t / 7.5);
  L(lerp(2.9, 3.4, u), lerp(1.9, 2.3, u), lerp(2.6, 3.3, u), 0.1, 1.0, -0.8, 50);
  if (t < 4.4) setTop('1世帯の人数の変化（1970→2025年）', '−' + (countUp(t, 131, 0.2, 1.2) / 100).toFixed(2) + '人', fade(t, 0.15, 4.4, 0.2), '#ff8a7a');
  else setTop('公衆電話の数（2024年度）', comma(countUp(t - 4.4, 96126, 0.1, 1.0)) + '台', fade(t, 4.4, 7.5, 0.2));
  return room;
}
function shot8(t, T) { // loop: modern room again
  scene('modern'); setLight('evening', { ceil: 0, hemi: 1.1 }); heroAt(-0.2, -1.1, 0.3, true); scr.material.color.set(0x9fd8ff);
  const u = ease(t / 4);
  lift(170); L(lerp(-0.5, -0.6, u), 1.8, lerp(4.2, 4.1, u), -0.6, 1.75, -1.6, 52); // v2：冒頭（0秒目）と同じ構図に戻ってループ
  setHud('いまは', '2026年', 1);
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 65, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65, camera: cityCam,
  cut: [[2.5, 6.0]], // v2：いつもの今の部屋（元の2.5〜6秒）を抜いて、昭和に変わった直後から本題へ
  meta: {
    id: '0014',
    v2: true,
    hookLine: '一瞬で、1970年の昭和に戻った。',
    title: '1日だけ昭和に戻ったら？',
    titleHtml: '1日だけ<br>昭和に戻ったら？',
    mood: 'emotional', seed: 15, hits: [0.5, 39.3], risers: [0.5],
    ask: '住むなら昭和と今、どっち？',
    caption: 'もしも1日だけ昭和（1970年）に戻ったら？\nスマホは圏外、テレビはほとんど白黒、電話は公衆電話に並ぶ。そして1世帯の人数は3.41人。国勢調査などの公式データで、昭和の1日をシミュレーション。\n\n住むなら昭和と今、どっち？ コメントで教えて。\n\n出典：総務省 国勢調査・電気通信サービスの契約数（2026年6月）、内閣府 消費動向調査（1970年）、NTT東日本 データブック（公衆電話施設数）',
    hashtags: ['もしもラボ', '昭和', 'レトロ', 'タイムスリップ', '雑学'],
    endStats: [['1世帯の人数', '3.41人→2.10人', '1970→2025年'], ['白黒テレビの普及率', '90.2%', '1970年'], ['公衆電話', '約93万台→約9.6万台', '1984→2024年度'], ['携帯電話の契約数', '2億3,121万', '2026年6月']],
    sources: '出典：総務省 国勢調査・電気通信サービスの契約数、内閣府 消費動向調査、<br>NTT東日本 データブック',
  },
});
