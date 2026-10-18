import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, SKIN, HAIR, makeQ } from '../lib.js';
import { room, setRoom, setLight, setClock, setScreen, props, lamp, glow } from '../scenes/room.js';
import { look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも72時間ずっと寝なかったら？
// 数字：起きて17〜19時間で血中アルコール0.05%相当・反応は最大50%遅い・さらに長く起きると0.1%相当（Williamson & Feyer 2000, Occup Environ Med）
//       24〜48時間で知覚のゆがみ・イライラ・時間感覚の乱れ、48時間以降に複雑な幻覚、3日目に視覚・聴覚・触覚の幻覚、視覚の異常は90%の研究で報告、
//       眠ると多くは回復（全員ではない）（Waters et al. 2018, Frontiers in Psychiatry, 21研究のレビュー）
//       睡眠6時間未満 男性37.5%・女性40.6%（厚生労働省 令和元年国民健康・栄養調査）

const hero = makePerson({ skin: SKIN[3], hair: HAIR[2], shirt: '#8e6bbf', pants: '#3b3f4a', scale: 1 }); room.add(hero);
const H = hero.userData;
const head = H.head;
const eyes = head.children.filter(c => c.geometry && c.geometry.parameters && c.geometry.parameters.width === 0.055);
const eyeM = new THREE.MeshLambertMaterial({ color: '#121212' }); eyes.forEach(e => e.material = eyeM);
const bags = [];
for (const s of [-1, 1]) { const b = box(0.08, 0.025, 0.02, mat('#7a5a8a', { transparent: true, opacity: 0 })); b.position.set(s * 0.085, 0.215, 0.2); head.add(b); bags.push(b); }
function tired(k) { eyeM.color.setRGB(0.07 + 0.5 * k, 0.07, 0.07); bags.forEach(b => b.material.opacity = clamp(k * 1.2)); eyes.forEach(e => e.scale.y = 1 - 0.45 * k); }
function sitDesk(t) { // at the home desk, facing the monitor (-z)
  hero.position.set(-2.6, -0.34, -2.15); hero.rotation.set(0, Math.PI, 0);
  H.legs.forEach(l => l.rotation.x = -Math.PI / 2); H.arms.forEach(a => { a.rotation.x = -1.1; a.rotation.z = 0; });
  head.rotation.set(0.05 + Math.sin(t * 0.7) * 0.03, 0, 0);
}
function sitBed(t, sway = 0) { // sitting up in bed, facing the camera (+z)
  hero.position.set(1.6, -0.2, -2.6); hero.rotation.set(0, 0, 0);
  H.legs.forEach(l => l.rotation.x = -Math.PI / 2); H.arms.forEach((a, i) => { a.rotation.x = -0.25; a.rotation.z = (i ? -1 : 1) * 0.12; });
  head.rotation.set(Math.sin(t * 0.9) * 0.08 * sway, Math.sin(t * 0.6) * 0.5 * sway, Math.sin(t * 0.5) * 0.12 * sway);
}
function standWake(t) {
  hero.position.set(0.3, 0, -1.2); hero.rotation.set(0, 0.2, 0);
  H.legs.forEach(l => l.rotation.x = 0); H.arms[0].rotation.set(-0.3, 0, 0.2); H.arms[1].rotation.set(-2.8, 0, -0.2);
  head.rotation.set(-0.15, 0, 0);
}
// hallucination shapes floating in the bedroom
const ghosts = [];
{
  const r = rng(13); const cols = ['#ff7ad9', '#7af0ff', '#ffe36e', '#9b7dff', '#7dff9b'];
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Mesh(r() < .5 ? new THREE.IcosahedronGeometry(0.18 + r() * 0.25, 0) : new THREE.TorusGeometry(0.2 + r() * 0.2, 0.05, 6, 12), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], transparent: true, opacity: 0, depthWrite: false }));
    room.add(g); ghosts.push({ g, o: [2.3 + r() * 1.6, 0.5 + r() * 2.2, -3.3 + r() * 1.3], ph: r() * 6, s: 0.3 + r() * 0.6 });
  }
}
function hallu(t, k) { for (const h of ghosts) { h.g.visible = k > 0; h.g.material.opacity = 0.75 * k; h.g.position.set(h.o[0] + Math.sin(t * h.s + h.ph) * 0.5, h.o[1] + Math.sin(t * h.s * 1.3 + h.ph) * 0.3, h.o[2] + Math.cos(t * h.s + h.ph) * 0.4); h.g.rotation.set(t * h.s, t * h.s * 0.7, 0); } }
const zzz = makeSparkles(60, 0.08, 0xbfd8ff); room.add(zzz.points);

function screenCode(g, w, h, k = 0) { g.fillStyle = '#10151f'; g.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 12; i++) { g.fillStyle = ['#7ff0c8', '#f2c14e', '#7aa8ff'][i % 3]; g.fillRect(14 + (i % 2) * 20, 12 + i * 12, 60 + r() * 150, 6); } if (k) { g.fillStyle = `rgba(255,80,120,${k})`; g.fillRect(0, 0, w, h); } }
const fmt = (hrs) => { const h = Math.floor(hrs), m = Math.floor((hrs - h) * 60), s = Math.floor(((hrs - h) * 60 - m) * 60); return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };

const SUBS = [
  [2.6, 6.0, '朝7時。いつも通り起きた。<br>ここから72時間、寝ない。'],
  [6.2, 10.1, '夜中の0時。'],
  [10.1, 14, '反応は最大50%遅く。<br>お酒を飲んだ人並み。'],
  [14.2, 18.1, '一晩、徹夜。'],
  [18.1, 22, 'さらに起き続けると、<br>もっと酔った状態に。'],
  [22.2, 26.1, 'イライラと不安。'],
  [26.1, 30, '時間の感覚が、<br>ずれ始める。'],
  [30.2, 34.6, '物がゆがみ、<br>ないものが見え始める。'],
  [34.6, 39, '目の異常は、ほとんどの<br>研究で報告されている。'],
  [39.2, 43.6, '見える、聞こえる、<br>触られる感じまで。'],
  [43.6, 47.8, '本当ではないことを、<br>信じ込み始める。'],
  [48.1, 52.6, '結果：72時間で、目にも耳にも<br>幻覚が出る状態になった。'],
  [52.6, 55.4, '実は日本の大人の約4割が、<br>6時間未満しか寝ていない。'],
  [55.6, 59.4, '今夜は、ちゃんと寝よう。'],
];

function base(sets, light, opt) { setRoom({ sets }); setLight(light, opt); props.sleeper.visible = false; props.phone.visible = true; hallu(0, 0); zzz.set(0); hero.visible = true; }
function shot0(t, T) { // hook: sitting up in bed at night, the awake-timer races, eyes redden
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.8, lamp: 2.2 }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:00'); sitBed(t, 0.4);
  tired(clamp(t / 2.4));
  const u = ease(t / 2.6);
  look(lerp(1.0, 0.8, u), 1.95, lerp(1.0, 0.7, u), 1.3, 1.7, -2.6, 50);
  el.title.style.opacity = 1;
  setHud('起きてから', fmt(t * 30), 1, { mono: true });
  return room;
}
function shot1(t, T) { // morning wake up
  base(['bed', 'desk'], 'day', { ceil: 0, hemi: 1.1 }); setClock('7:00', '#ff5b4f'); standWake(t); tired(0);
  const u = ease(t / 3.5);
  look(lerp(2.6, 2.3, u), 1.9, lerp(3.4, 3.0, u), 0.3, 1.45, -1.4, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('起きてから', fmt(t / 3600), 1, { mono: true });
  return room;
}
function shot2(t, T) { // +17h desk at midnight
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.7, glow: 3, glowPos: [-2.6, 1.3, -2.6] }); setClock('0:00');
  setScreen((g, w, h) => screenCode(g, w, h)); sitDesk(t); tired(0.35);
  head.rotation.x = 0.1 + Math.max(0, Math.sin(t * 0.8)) * 0.25;
  const u = ease(t / 8);
  look(lerp(-0.6, -1.0, u), lerp(1.95, 1.85, u), lerp(-0.1, -0.7, u), -2.75, 1.45, -2.45, 50);
  setHud('起きてから', '17時間', 1);
  setTop('起きて17〜19時間の成績（お酒にすると・2000年）', (countUp(t, 5) / 100).toFixed(2) + '%相当', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t, T) { // +24h morning, still at desk, sunlight
  base(['bed', 'desk'], 'day', { ceil: 0, hemi: 1.0 }); setClock('7:00');
  setScreen((g, w, h) => screenCode(g, w, h)); sitDesk(t); tired(0.55);
  head.rotation.x = 0.15 + Math.max(0, Math.sin(t * 1.1)) * 0.35;
  const u = ease(t / 8);
  look(lerp(-0.4, -0.8, u), lerp(2.2, 2.0, u), lerp(0.4, -0.3, u), -2.7, 1.4, -2.4, 50);
  setHud('起きてから', '24時間', 1);
  setTop('さらに長く起きていると（お酒にすると・2000年）', (countUp(t, 10) / 100).toFixed(2) + '%相当', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t, T) { // +36h evening, sitting on bed, restless
  base(['bed', 'desk'], 'evening', { ceil: 4, hemi: 0.9 }); setClock('19:00'); sitBed(t, 1); tired(0.7);
  const u = ease(t / 8);
  look(lerp(0.8, 0.5, u), 2.0, lerp(1.6, 1.0, u), 1.3, 1.65, -2.6, 50);
  setHud('起きてから', '36時間', 1);
  setTop('知覚のゆがみやイライラが出始める（2018年）', countUp(t, 24) + '〜' + countUp(t, 48) + '時間', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot5(t, T) { // +48h night, hallucination shapes appear
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.75, lamp: 2.4 }); lamp.position.set(0.3, 1.2, -2.6); setClock('7:00'); sitBed(t, 1.5); tired(0.85);
  hallu(t, clamp((t - 1.5) / 3) * 0.8);
  const u = ease(t / 9);
  look(lerp(0.5, 0.8, u), 1.95, lerp(1.4, 0.8, u), 1.3, 1.7, -2.6, 52);
  setHud('起きてから', '48時間', 1);
  setTop('目の異常を報告した研究（2018年）', countUp(t, 90) + '%', fade(t, 0.15, 9, 0.25));
  return room;
}
function shot6(t, T) { // +72h
  base(['bed', 'desk'], 'dark', { ceil: 0, hemi: 0.6, lamp: 2.0, glow: 1.5, glowPos: [1.6, 1.8, -1.5] }); lamp.position.set(0.3, 1.2, -2.6); setClock('7:00', '#ff5b4f'); sitBed(t, 2); tired(1);
  hallu(t * 1.6, 1);
  const u = ease(t / 8.6);
  look(lerp(0.8, 1.1, u), 1.9, lerp(0.7, 0.4, u), 1.35, 1.75, -2.6, 50);
  setHud('起きてから', '72時間', 1, { color: '#ff8a7a' });
  setTop('3日目に出た幻覚（目・耳・体／2018年）', countUp(t, 3) + '種類', fade(t, 0.15, 8.6, 0.25));
  return room;
}
function shot7(t, T) { // result: the person finally sleeps; then the twist number
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.7, lamp: 1.6 }); lamp.position.set(0.3, 1.2, -2.6); setClock('7:00', '#ff5b4f');
  hero.visible = false; props.sleeper.visible = true;
  hallu(t, clamp(1 - t / 2.5));
  if (!zzz.ok) { zzz.init([[1.6, 1.4, -2.7]], 0.2, 1.5); zzz.ok = true; } zzz.set((t % 2.5) / 2.5);
  const u = ease(t / 7.5);
  look(lerp(3.2, 3.6, u), lerp(2.4, 2.8, u), lerp(0.6, 1.4, u), 1.5, 0.8, -2.2, 50);
  if (t < 4.6) setTop('調べた研究（2018年のレビュー）', countUp(t, 21) + '本', fade(t, 0.15, 4.6, 0.25));
  else setTop('睡眠6時間未満の女性（2019年）', (countUp(t - 4.6, 406, 0.1, 1.0) / 10).toFixed(1) + '%', fade(t, 4.6, 7.5, 0.2));
  return room;
}
function shot8(t, T) { // loop: morning again, timer resets
  base(['bed', 'desk'], 'day', { ceil: 0, hemi: 1.1 }); setClock('7:00', '#ff5b4f'); standWake(t); tired(0);
  const u = ease(t / 4);
  look(lerp(2.7, 2.6, u), 1.9, lerp(3.5, 3.4, u), 0.3, 1.45, -1.4, 50);
  setHud('起きてから', fmt(t / 3600), 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0004',
    title: '72時間ずっと寝なかったら？',
    titleHtml: '72時間ずっと<br>寝なかったら？',
    mood: 'tension', seed: 4, hits: [6.1, 30.1, 39.3, 48.1], risers: [39.3],
    caption: 'もしも72時間ずっと寝なかったら、体と頭はどうなる？\n17時間でお酒を飲んだ人並み、48時間でないものが見え始める。睡眠不足と徹夜の研究データでシミュレーション。\n※まねしないでください\n\n出典：Williamson & Feyer（2000）Occupational and Environmental Medicine、Waters et al.（2018）Frontiers in Psychiatry、厚生労働省 令和元年国民健康・栄養調査',
    hashtags: ['もしもラボ', '睡眠不足', '徹夜', '人体', '雑学'],
    endStats: [['起きて17〜19時間', '血中アルコール0.05%相当', '2000年'], ['反応の速さ', '最大50%遅い', '2000年'], ['3日目の幻覚', '目・耳・体の3種類', '2018年'], ['睡眠6時間未満', '男性37.5%・女性40.6%', '2019年']],
    sources: '出典：Williamson & Feyer（2000）、Waters et al.（2018）、<br>厚生労働省 令和元年国民健康・栄養調査',
  },
});
