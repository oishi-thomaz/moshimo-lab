import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, SKIN, HAIR, makeQ } from '../lib.js';
import { room, setRoom, setLight, setClock, setScreen, props, lamp, glow } from '../scenes/room.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも1日30分睡眠だけで生活したら？
// 30分の睡眠は、眠りの1周（ノンレム睡眠とレム睡眠の約90分周期・厚生労働省 e-ヘルスネット）に届かないので、ほぼ徹夜が続く状態として徹夜の研究で推計
// 数字：起きて20〜25時間で血中アルコール0.10%相当（Lamond & Dawson 1999）、24〜48時間で知覚のゆがみ・不安・イライラ・時間感覚の乱れ、
//       48〜90時間で複雑な幻覚、3日目に視覚・聴覚・触覚の幻覚、72時間以降に妄想（Waters et al. 2018, Frontiers in Psychiatry, 21研究・760人のレビュー）
//       起きていた記録 264時間（約11日、1964年 Randy Gardner、スタンフォード大の Dement が観察）、ギネスは健康への危険を理由に1996年に認定をやめた（NPR 2024）
// 以下は 0004 のメモ
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
  [2.6, 6.0, '今日から毎日、<br>眠るのは30分だけ。'],
  [6.2, 10.1, '30分では、眠りの1周<br>約90分に届かない。'],
  [10.1, 14, '深い眠りも、夢を見る眠りも<br>ほとんど取れない。'],
  [14.2, 18.1, '1日目。頭はお酒を<br>飲んだ人並みに。'],
  [18.1, 22, '起きて20〜25時間で、<br>酔った状態と同じ成績。'],
  [22.2, 26.1, '2日目。物がゆがみ、<br>イライラが止まらない。'],
  [26.1, 30, '時間の感覚も<br>ずれ始める。'],
  [30.2, 34.6, '3日目。ないものが<br>見えて、聞こえる。'],
  [34.6, 39, '目・耳・体、<br>3つの感覚で幻覚。'],
  [39.2, 43.6, '4日目。本当ではないことを<br>信じ込み始める。'],
  [43.6, 47.8, '人が起きていられた記録は、<br>11日（264時間）。'],
  [48.1, 52.6, '結果：3日目に幻覚、<br>4日目には妄想が出た。'],
  [52.6, 55.4, 'ギネスは危険すぎるとして、<br>記録の認定をやめた。'],
  [55.6, 59.4, '知ってる人で、1日30分睡眠で<br>生活してる人、いる？'],
];

function base(sets, light, opt) { setRoom({ sets }); setLight(light, opt); props.sleeper.visible = false; props.phone.visible = true; hallu(0, 0); zzz.set(0); hero.visible = true; }
const day = (n, c) => setHud('1日30分睡眠', n + '日目', 1, c ? { color: c } : {});
function shot0(t, T) { // hook：寝て30分でアラーム。たたき起こされる
  const tv = 1.0;
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.8, lamp: 2.2 }); lamp.position.set(0.3, 1.2, -2.6); setClock(t < tv ? '2:00' : '2:30', t < tv ? '#7ff0c8' : '#ff5b4f');
  if (t < tv) { hero.visible = false; props.sleeper.visible = true; } else { sitBed(t, 0.6); tired(0.3); }
  el.flash.style.opacity = t >= tv ? 0.35 * Math.max(0, 1 - (t - tv) / 0.25) : 0;
  lift(230); const u = ease(t / 2.6);
  look(lerp(3.3, 3.1, u), lerp(2.2, 2.1, u), lerp(1.9, 1.6, u), 0.9, 1.25, -2.4, 50);
  el.title.style.opacity = 1;
  setHud('1日の睡眠', '30分', 1, { color: '#ff8a7a' });
  return room;
}
function shot1(t, T) { // 朝
  base(['bed', 'desk'], 'day', { ceil: 0, hemi: 1.1 }); setClock('7:00', '#ff5b4f'); standWake(t); tired(0.1);
  const u = ease(t / 3.5);
  look(lerp(2.6, 2.3, u), 1.9, lerp(3.4, 3.0, u), 0.3, 1.45, -1.4, 50);
  el.title.style.opacity = clamp(1 - t / 0.4);
  setHud('1日の睡眠', '30分', 1, { color: '#ff8a7a' });
  return room;
}
function shot2(t, T) { // 眠りの周期に届かない（寝ている姿）
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.7, lamp: 1.6 }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:00');
  hero.visible = false; props.sleeper.visible = true;
  if (!zzz.ok) { zzz.init([[1.6, 1.4, -2.7]], 0.2, 1.5); zzz.ok = true; } zzz.set((t % 2.5) / 2.5);
  const u = ease(t / 8);
  look(lerp(3.2, 3.5, u), lerp(2.4, 2.7, u), lerp(0.6, 1.2, u), 1.5, 0.8, -2.2, 50);
  setHud('1日の睡眠', '30分', 1, { color: '#ff8a7a' });
  setTop('眠りの1周（ノンレム睡眠とレム睡眠）', '約' + countUp(t, 90) + '分', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t, T) { // 1日目：机で頭がふらつく
  base(['bed', 'desk'], 'day', { ceil: 0, hemi: 1.0 }); setClock('9:00');
  setScreen((g, w, h) => screenCode(g, w, h)); sitDesk(t); tired(0.45);
  head.rotation.x = 0.15 + Math.max(0, Math.sin(t * 1.1)) * 0.35;
  const u = ease(t / 8);
  look(lerp(-0.4, -0.8, u), lerp(2.2, 2.0, u), lerp(0.4, -0.3, u), -2.7, 1.4, -2.4, 50);
  day(1);
  setTop('起きて20〜25時間の成績（お酒にすると・1999年）', (countUp(t, 10) / 100).toFixed(2) + '%相当', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t, T) { lift(200); // 2日目：ベッドに座って落ち着かない
  base(['bed', 'desk'], 'evening', { ceil: 4, hemi: 0.9 }); setClock('19:00'); sitBed(t, 1); tired(0.7);
  const u = ease(t / 8);
  look(lerp(0.8, 0.5, u), 2.0, lerp(1.6, 1.0, u), 1.3, 1.65, -2.6, 50);
  day(2);
  setTop('知覚のゆがみやイライラが出始める（2018年）', countUp(t, 24) + '〜' + countUp(t, 48) + '時間', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot5(t, T) { lift(200); // 3日目：幻覚
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.75, lamp: 2.4 }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:00'); sitBed(t, 1.5); tired(0.85);
  hallu(t, clamp((t - 1.0) / 3) * 0.85);
  const u = ease(t / 9);
  look(lerp(0.5, 0.8, u), 1.95, lerp(1.4, 0.8, u), 1.3, 1.7, -2.6, 52);
  day(3, '#ff8a7a');
  setTop('3日目に出た幻覚（目・耳・体／2018年）', countUp(t, 3) + '種類', fade(t, 0.15, 9, 0.25));
  return room;
}
function shot6(t, T) { lift(200); // 4日目：妄想。記録は11日
  base(['bed', 'desk'], 'dark', { ceil: 0, hemi: 0.6, lamp: 2.0, glow: 1.5, glowPos: [1.6, 1.8, -1.5] }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:00', '#ff5b4f'); sitBed(t, 2); tired(1);
  hallu(t * 1.6, 1);
  const u = ease(t / 8.6);
  look(lerp(0.8, 1.1, u), 1.9, lerp(0.7, 0.4, u), 1.35, 1.75, -2.6, 50);
  day(4, '#ff8a7a');
  if (t < 4.4) setTop('妄想が出始める（2018年）', countUp(t, 72) + '時間以降', fade(t, 0.15, 4.4, 0.25));
  else setTop('起きていられた記録（1964年）', countUp(t - 4.4, 264, 0.1, 1.2) + '時間', fade(t, 4.4, 8.8, 0.2));
  return room;
}
function shot7(t, T) { // 結果：幻覚の部屋で座り込む
  base(['bed', 'desk'], 'dark', { ceil: 0, hemi: 0.6, lamp: 1.8 }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:00', '#ff5b4f'); sitBed(t, 2.2); tired(1);
  hallu(t * 1.3, 0.9);
  const u = ease(t / 7.5);
  look(lerp(3.2, 3.8, u), lerp(2.4, 2.9, u), lerp(0.6, 1.6, u), 1.5, 1.4, -2.4, 50);
  if (t < 4.5) setTop('幻覚と妄想が出るまで（2018年）', '約' + countUp(t, 3) + '日', fade(t, 0.15, 4.5, 0.25), '#ff8a7a');
  else setTop('ギネスが認定をやめた年', String(countUp(t - 4.5, 1996, 0.05, 0.8)), fade(t, 4.5, 7.5, 0.2));
  return room;
}
function shot8(t, T) { // ループ：30分でアラーム
  base(['bed', 'desk'], 'night', { ceil: 0, hemi: 0.8, lamp: 2.2 }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:30', '#ff5b4f'); sitBed(t, 0.6); tired(0.3);
  lift(230); const u = ease(t / 4);
  look(lerp(3.3, 3.2, u), 2.1, lerp(1.9, 1.7, u), 0.9, 1.25, -2.4, 50);
  setHud('1日の睡眠', '30分', 1, { color: '#ff8a7a' });
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
    id: '0032',
    title: '1日30分睡眠で生活したら？',
    titleHtml: '1日30分睡眠で<br>生活したら？',
    mood: 'tension', seed: 32, hits: [1.0, 30.2, 48.1], risers: [1.0, 39.2],
    ask: 'あなたの知ってる人で、1日30分睡眠で生活してる人はいる？',
    narr: { '264時間': '264時間' },
    caption: 'もしも1日30分睡眠だけで生活したら、何日目にどうなる？\n30分の睡眠は、眠りの1周（約90分）にも届かない。ほぼ徹夜が続く状態として、睡眠不足と徹夜の研究データでシミュレーション。1日目で酔った人並み、3日目に幻覚、4日目には妄想。\n※まねしないでください\n\nあなたの知ってる人で、1日30分睡眠で生活してる人はいる？ コメントで教えて。\n\n出典：Waters et al.（2018）Frontiers in Psychiatry、Lamond & Dawson（1999）Journal of Sleep Research、厚生労働省 e-ヘルスネット「眠りのメカニズム」、NPR（2024）Randy Gardner の記録',
    hashtags: ['もしもラボ', '睡眠不足', 'ショートスリーパー', '人体', '雑学'],
    endStats: [['眠りの1周', '約90分', 'e-ヘルスネット'], ['起きて20〜25時間', '血中アルコール0.10%相当', '1999年'], ['3日目の幻覚', '目・耳・体の3種類', '2018年'], ['妄想が出始める', '72時間以降', '2018年'], ['起きていられた記録', '264時間（約11日）', '1964年']],
    sources: '出典：Waters et al.（2018）、Lamond & Dawson（1999）、<br>厚生労働省 e-ヘルスネット、NPR（2024）',
  },
});
