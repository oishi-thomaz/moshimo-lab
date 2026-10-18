import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, comma } from '../lib.js';
import { japan, ll, CITY, setDots, setMapEnv, makeRing } from '../scenes/japan.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { stage, makeCrowd, stageDisc } from '../scenes/stage.js';
import { look, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも日本人全員が同時にジャンプしたら？
// 数字：総人口 1億2,265万人（男5,968万・女6,297万、総務省 人口推計 2026年9月1日概算）
//       平均体重 男62.5kg・女50.8kg（1歳以上、厚生労働省 令和6年国民健康・栄養調査）→ 合計 約69億kg（推計）
//       地球の質量 5.9722×10^24kg（NASA Earth Fact Sheet）→ 全員の約860兆倍（推計）
//       30cm跳んだ場合の地球の移動 約0.0000000000000003m（推計：69億kg×0.3m÷地球の質量）
//       2001年9月7日 イギリスで子どもの一斉ジャンプ実験（Science Year "Giant Jump"、地震計で計測を試みた：グラスゴー大学）

const crowd = makeCrowd(90, 11, { w: 15, d: 9, x: 0, z: 1 });
const jumpers = crowd.people.map((p, i) => ({ p, d: ((i * 37) % 11) / 11 }));
function crowdJump(t, t0) { // t0: jump start (s). airtime 0.5s
  for (const j of jumpers) {
    const u = (t - t0 - j.d * 0.08) / 0.5;
    const y = u > 0 && u < 1 ? Math.sin(u * Math.PI) * 0.6 : 0;
    j.p.position.y = y;
    const crouch = (u > -0.25 && u < 0) || (u > 1 && u < 1.25) ? 1 : 0;
    j.p.userData.arms.forEach(a => a.rotation.x = u > 0 && u < 1 ? -2.6 : crouch ? 0.4 : 0);
    j.p.userData.legs.forEach(l => l.rotation.x = crouch ? -0.3 : 0);
  }
}
const rings = [];
for (const c of ['tokyo', 'osaka', 'nagoya', 'fukuoka', 'sapporo', 'sendai', 'hiroshima']) { const r = makeRing('#ffffff', 0.7); const v = ll(...CITY[c]); r.position.x = v.x; r.position.z = v.z; r.visible = false; rings.push(r); }
function ringsAt(u) { rings.forEach((r, i) => { const k = clamp(u - i * 0.04); r.visible = k > 0 && k < 1; r.scale.setScalar(1 + k * 12); r.material.opacity = 0.7 * (1 - k); }); }
function mapJump(t, t0, color) { setDots((i, x, z, q) => { const u = (t - t0 - q * 0.15) / 0.5; return { y: u > 0 && u < 1 ? Math.sin(u * Math.PI) * 2.2 : 0, color }; }); }
const jpMarker = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd34d })); jpMarker.position.copy(latLon(36, 138, 10.12)); earth.add(jpMarker);

const SUBS = [
  [2.6, 6.0, '日本中の人が、<br>今いる場所で。'],
  [6.2, 10.1, '1億2,265万人が、'],
  [10.1, 14, 'いっせいに、<br>ジャンプ！'],
  [14.2, 18.1, '全員の体重を合わせると、<br>約69億kg。'],
  [18.1, 22, 'それが同時に、<br>地面をけった。'],
  [22.2, 26.1, 'でも地球の重さは、<br>その約860兆倍。'],
  [26.1, 30, '地球にとっては、<br>ほんのわずかな力。'],
  [30.2, 34.6, '着地。日本中で、<br>小さな揺れ。'],
  [34.6, 39, '地球が動くのは、<br>原子よりはるかに小さい距離。'],
  [39.2, 43.6, '一人ひとりの体重は、<br>平均で50〜60kgほど。'],
  [43.6, 47.8, '集まっても、地球から見れば<br>ほんの一粒。'],
  [48.1, 52.6, '結果：全員で跳んでも、<br>地球はほぼ動かなかった。'],
  [52.6, 55.4, '実は2001年のイギリスで、<br>本当に一斉ジャンプ実験が。'],
  [55.6, 59.4, 'あなたの1回のジャンプは、<br>その1億2,265万分の1。'],
];

function shot0(t, T) { // hook: map + countdown
  setMapEnv('day'); ringsAt(0); mapJump(t, 99, '#ffffff');
  const u = ease(t / 2.6);
  look(lerp(-8, -4, u), lerp(300, 285, u), lerp(95, 85, u), -4, 0, -30, 50);
  el.title.style.opacity = 1;
  const left = Math.max(0, 2.5 - t);
  setHud('全員ジャンプまで', `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`, 1, { mono: true });
  return japan;
}
function shot1(t, T) { // everyday crowd standing
  crowdJump(t, 99);
  crowd.people.forEach((p, i) => p.userData.head.rotation.y = Math.sin(t * 1.1 + i) * 0.4);
  const u = ease(t / 3.5);
  look(lerp(-3, -1, u), lerp(6, 5, u), lerp(19, 17, u), 0, 1.8, 0, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('全員ジャンプまで', '0:00.00', 1, { mono: true });
  return stage;
}
function shot2(t, T) { // jump on stage
  crowdJump(t, 4.2); crowd.people.forEach(p => p.userData.head.rotation.y = 0);
  const u = ease(t / 8);
  look(lerp(0, 3, u), lerp(3.2, 2.6, u), lerp(16, 14, u), 0, 2.3, 0, 50);
  hudTime('+0秒');
  setTop('日本の総人口（2026年9月）', (() => { const v = countUp(t, 12265); return `${Math.floor(v / 10000)}億${comma(v % 10000)}万人`; })(), fade(t, 0.15, 8, 0.25));
  return stage;
}
function shot3(t, T) { // map: all dots jump
  setMapEnv('day'); ringsAt(0); mapJump(t, 1.5, '#ffe9a8');
  const tk = ll(...CITY.tokyo); const u = ease(t / 8);
  look(tk.x + lerp(30, 10, u), lerp(70, 45, u), tk.z + lerp(70, 50, u), tk.x - 6, 0, tk.z - 4, 50);
  hudTime('+0.5秒');
  setTop('全員の体重の合計（推計）', '約' + comma(countUp(t, 69)) + '億kg', fade(t, 0.15, 8, 0.25));
  return japan;
}
function shot4(t, T) { // earth vs people
  setEarthNight(0); earth.rotation.y = faceLon(138) + 0.25 - t * 0.02;
  jpMarker.scale.setScalar(1 + Math.sin(t * 4) * 0.25);
  const u = ease(t / 8);
  look(0, lerp(10, 6, u), lerp(30, 40, u), 0, 1.5, 0, 45);
  hudTime('+1秒');
  setTop('地球の重さは全員の（推計）', '約' + comma(countUp(t, 860)) + '兆倍', fade(t, 0.15, 8, 0.25));
  return space;
}
function shot5(t, T) { // landing ripples
  setMapEnv('dusk'); mapJump(t, -0.6, '#ffe9a8'); ringsAt(clamp(t / 4.5));
  const u = ease(t / 9);
  look(lerp(-8, 0, u), lerp(290, 270, u), lerp(90, 80, u), -4, 0, -30, 50);
  hudTime('着地');
  setTop('地球が動く距離（推計・30cm跳んだ場合）', '1mの約' + comma(countUp(t, 2900)) + '兆分の1', fade(t, 0.15, 9, 0.25));
  return japan;
}
function shot6(t, T) { // landed crowd, looking around
  crowdJump(t, -2);
  crowd.people.forEach((p, i) => p.userData.head.rotation.y = Math.sin(t * 1.4 + i * 0.7) * 0.6);
  const u = ease(t / 8.6);
  look(lerp(4, 1, u), lerp(4, 7, u), lerp(14, 18, u), 0, 1.6, 0, 50);
  hudTime('+10秒');
  if (t < 4.4) setTop('男性の平均体重（2024年・1歳以上）', (countUp(t, 625) / 10).toFixed(1) + 'kg', fade(t, 0.15, 4.4, 0.2));
  else setTop('女性の平均体重（2024年・1歳以上）', (countUp(t - 4.4, 508) / 10).toFixed(1) + 'kg', fade(t, 4.4, 8.6, 0.2));
  return stage;
}
function shot7(t, T) { // result: earth far
  setEarthNight(0); earth.rotation.y = faceLon(138) + 0.1 + t * 0.03; jpMarker.scale.setScalar(1);
  const u = ease(t / 7.5);
  look(0, lerp(6, 14, u), lerp(40, 70, u), 0, 2, 0, 45);
  setTop('地球の重さとくらべると（推計）', '約' + comma(countUp(t, 860, 0.2, 1.2)) + '兆分の1', fade(t, 0.15, 7.5, 0.25));
  return space;
}
function shot8(t, T) { // loop to opening map
  setMapEnv('day'); ringsAt(0); mapJump(t, 99, '#ffffff');
  const u = ease(t / 4);
  look(lerp(-10, -8, u), lerp(306, 300, u), lerp(98, 95, u), -4, 0, -30, 50);
  setHud('全員ジャンプまで', '0:03.00', 1, { mono: true });
  return japan;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0005',
    title: '日本人全員が同時にジャンプしたら？',
    titleHtml: '日本人全員が<br>同時にジャンプしたら？',
    mood: 'tension', seed: 7, hits: [10.2, 30.2, 48.1], risers: [6.2],
    caption: 'もしも日本人1億2,265万人が同時にジャンプしたら、地球は動く？\n全員の体重は約69億kg。でも地球はその約860兆倍。人口と体重の公式データと地球の質量で計算してみた（推計）。\n\n出典：総務省 人口推計（2026年9月概算）、厚生労働省 令和6年国民健康・栄養調査、NASA Earth Fact Sheet、グラスゴー大学（2001年 Giant Jump）',
    hashtags: ['もしもラボ', '同時ジャンプ', '地球', '雑学', 'もしも'],
    endStats: [['日本の総人口', '1億2,265万人', '2026年9月'], ['全員の体重の合計（推計）', '約69億kg', '2024年体重'], ['地球の重さ', '全員の約860兆倍', '推計'], ['地球が動く距離（推計）', '1mの約2,900兆分の1', '30cm跳躍']],
    sources: '出典：総務省 人口推計、厚生労働省 令和6年国民健康・栄養調査、<br>NASA Earth Fact Sheet、グラスゴー大学（2001年）',
  },
});
