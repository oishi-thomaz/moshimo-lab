import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, randPerson, SKIN, HAIR, makeQ } from '../lib.js';
import { room, setRoom, setLight, setClock, setScreen, props, lamp, glow } from '../scenes/room.js';
import { look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも毎日4時間睡眠を1か月続けたら？
// 数字：成人は少なくとも6時間以上（厚生労働省 健康づくりのための睡眠ガイド2023）
//       4時間・6時間の睡眠を14日間続けると成績は毎日下がり、最大で徹夜2晩分に相当、本人はほとんど自覚なし（Van Dongen et al. 2003, Sleep）
//       睡眠を削ると満腹ホルモン（レプチン）-18%、食欲ホルモン（グレリン）+28%、空腹感+24%、高カロリー・炭水化物の多い食べ物への欲求+33〜45%（Spiegel et al. 2004, Ann Intern Med）

const hero = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#8fa3b8', pants: '#5d6b80' }); room.add(hero);
const H = hero.userData;
const eyes = H.head.children.filter(c => c.geometry && c.geometry.parameters && c.geometry.parameters.width === 0.055);
function sleepy(k) { eyes.forEach(e => e.scale.y = 1 - 0.7 * k); }
// calendar on the wall
const cal = textSprite('1日目', { w: 256, h: 256, size: 70, bg: '#ffffff', color: '#c0262d', sx: 0.7 }); room.add(cal);
// coworkers
const coworkers = [];
{ const r = rng(6); for (const [x, z] of [[-2.6, -2.25], [2.6, -2.25], [-2.6, -0.35], [2.6, -0.35]]) { const p = randPerson(r); p.position.set(x, -0.38, z); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms.forEach(a => a.rotation.x = -1.1); room.add(p); coworkers.push(p); } }
const snack = []; { const cols = ['#e46a5b', '#f2c14e', '#c47ad1', '#f08a4b']; for (let i = 0; i < 6; i++) { const b = box(0.18, 0.08, 0.26, mat(cols[i % 4])); room.add(b); snack.push(b); } }
const fridgeGlow = new THREE.PointLight(0xdff1ff, 0, 5, 1.4); fridgeGlow.position.set(2.2, 1.2, -2.0); room.add(fridgeGlow);
const zQ = makeQ(); room.add(zQ);

function pose(kind, t) {
  hero.visible = true; hero.rotation.set(0, 0, 0); H.head.rotation.set(0, 0, 0); H.legs.forEach(l => l.rotation.x = 0); H.arms.forEach(a => a.rotation.set(0, 0, 0));
  if (kind === 'office') { hero.position.set(0, -0.38, -0.35); hero.rotation.y = Math.PI; H.legs.forEach(l => l.rotation.x = -Math.PI / 2); H.arms.forEach(a => a.rotation.x = -1.1); }
  if (kind === 'bed') { hero.position.set(1.6, -0.2, -2.6); H.legs.forEach(l => l.rotation.x = -Math.PI / 2); H.arms.forEach((a, i) => { a.rotation.x = -0.3; }); }
  if (kind === 'fridge') { hero.position.set(1.7, 0, -1.6); hero.rotation.y = Math.PI * 0.8; H.arms[1].rotation.x = -1.4; H.arms[0].rotation.x = -0.9; }
}
function officeOn(on) { coworkers.forEach(c => c.visible = on); }
function snacksOn(n) { snack.forEach((b, i) => { b.visible = i < n; b.position.set(1.0 + (i % 3) * 0.3, 0.95, -3.0 + Math.floor(i / 3) * 0.3); b.rotation.y = i; }); }

const SUBS = [
  [2.6, 6.0, 'あなたは今日から毎晩、<br>4時間しか寝ない。'],
  [6.2, 10.1, '+1日。昼すぎに<br>強い眠気の波。'],
  [10.1, 14, '国の目安は、大人で<br>6時間以上。'],
  [14.2, 18.1, '+1週間。体は<br>慣れたつもり。'],
  [18.1, 22, 'でも実験では、成績は<br>毎日下がり続けた。'],
  [22.2, 26.1, '+2週間。頭の働きは<br>徹夜2晩分まで落ちた。'],
  [26.1, 30, 'なのに本人は、<br>ほとんど気づいていない。'],
  [30.2, 34.6, '+3週間。夜中に<br>おなかがすく。'],
  [34.6, 39, '食欲ホルモンは28%増え、<br>満腹ホルモンは18%減った。'],
  [39.2, 43.6, '+1か月。甘い物や<br>炭水化物が止まらない。'],
  [43.6, 47.8, 'そういう食べ物への欲求は、<br>最大45%アップ。'],
  [48.1, 52.6, '結果：平気なつもりでも、<br>頭は徹夜2晩分に落ちていた。'],
  [52.6, 55.4, '睡眠不足は、自分では<br>いちばん気づきにくい。'],
  [55.6, 59.4, '今夜のあなたは、<br>何時間寝る？'],
];

function bedroom(light, clock, day) {
  setRoom({ sets: ['bed', 'desk'] }); officeOn(false); snacksOn(0); fridgeGlow.intensity = 0; props.sleeper.visible = false; zQ.visible = false;
  setLight(light, light === 'night' || light === 'dark' ? { ceil: 0, hemi: 0.8, lamp: 2.2 } : { ceil: 0, hemi: 1.1 }); lamp.position.set(0.3, 1.2, -2.6);
  setClock(clock, '#ff5b4f'); cal.visible = true; cal.position.set(-0.5, 2.0, -3.45); cal.userData.set(day);
}
function office(day) {
  setRoom({ sets: ['office'] }); officeOn(true); snacksOn(0); fridgeGlow.intensity = 0; cal.visible = true; cal.position.set(-3.2, 2.2, -3.45); cal.userData.set(day); zQ.visible = false;
  setLight('day', { ceil: 0, hemi: 1.2 }); pose('office');
}
function shot0(t, T) { // hook: clock jumps 2:00 -> 6:00, alarm
  bedroom('dark', t < 1.0 ? '2:00' : '6:00', '1日目'); pose('bed'); sleepy(t < 1.0 ? 0.2 : 0.8);
  props.sleeper.visible = t < 1.0; hero.visible = t >= 1.0;
  el.flash.style.opacity = t >= 1.0 ? 0.3 * Math.max(0, 1 - (t - 1.0) / 0.25) : 0;
  const u = ease(t / 2.6);
  look(0.9, 1.55, lerp(1.4, 1.2, u), 0.9, 0.95, -2.85, 50);
  el.title.style.opacity = 1;
  setHud('今夜の睡眠', '4時間', 1, { color: '#ff8a7a' });
  return room;
}
function shot1(t, T) { // everyday: up late at the desk
  bedroom('night', '1:58', '1日目'); hero.visible = true;
  hero.position.set(-2.6, -0.34, -2.15); hero.rotation.set(0, Math.PI, 0); H.legs.forEach(l => l.rotation.x = -Math.PI / 2); H.arms.forEach(a => a.rotation.x = -1.1); sleepy(0.1);
  setScreen((g, w, h) => { g.fillStyle = '#10151f'; g.fillRect(0, 0, w, h); g.fillStyle = '#7aa8ff'; for (let i = 0; i < 9; i++) g.fillRect(16, 14 + i * 15, 80 + (i * 37) % 140, 7); });
  const u = ease(t / 3.5);
  look(lerp(-0.6, -0.9, u), 1.95, lerp(-0.2, -0.6, u), -2.75, 1.45, -2.45, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  setHud('今夜の睡眠', '4時間', 1, { color: '#ff8a7a' });
  return room;
}
function officeCam(t, a, b) { const u = ease(t / 8); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0, 1.2, -0.6, 50); }
function shot2(t, T) { // +1 day office, nodding off after lunch
  office('2日目'); sleepy(0.5); H.head.rotation.x = Math.max(0, Math.sin(t * 0.9)) * 0.45;
  officeCam(t, [1.6, 2.2, -2.6], [1.3, 2.1, -2.3]);
  hudTime('+1日');
  setTop('大人の睡眠の目安（厚労省 2023年）', countUp(t, 6) + '時間以上', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t, T) { // +1 week: "I'm used to it"
  office('8日目'); sleepy(0.55); H.head.rotation.set(Math.max(0, Math.sin(t * 1.1)) * 0.3, Math.sin(t * 0.5) * 0.2, 0);
  officeCam(t, [-1.5, 2.3, -2.5], [-1.2, 2.2, -2.2]);
  hudTime('+1週間');
  setTop('4時間睡眠を続けた実験（2003年）', countUp(t, 14) + '日間', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t, T) { // +2 weeks: head on desk
  office('15日目'); sleepy(0.8); H.head.rotation.set(0.6 + Math.sin(t * 0.7) * 0.08, 0, 0.15);
  zQ.visible = false;
  officeCam(t, [1.8, 2.6, -2.4], [1.4, 2.4, -2.0]);
  hudTime('+2週間');
  setTop('14日後の頭の働き（最大・2003年）', '徹夜' + countUp(t, 2) + '晩分', fade(t, 0.15, 8, 0.25), '#ff8a7a');
  return room;
}
function shot5(t, T) { // +3 weeks: midnight fridge
  setRoom({ sets: ['kitchen'] }); officeOn(false); cal.visible = false; zQ.visible = false;
  setLight('dark', { ceil: 0, hemi: 0.6 }); fridgeGlow.intensity = 6; pose('fridge'); sleepy(0.6); snacksOn(3);
  const u = ease(t / 9);
  look(lerp(-0.4, -0.1, u), 2.0, lerp(2.4, 2.0, u), 1.8, 1.3, -2.3, 50);
  hudTime('+3週間');
  setTop('食欲を増やすホルモン（2004年）', '+' + countUp(t, 28) + '%', fade(t, 0.15, 9, 0.25), '#ff8a7a');
  return room;
}
function shot6(t, T) { // +1 month snacks pile up
  setRoom({ sets: ['kitchen'] }); officeOn(false); cal.visible = false; zQ.visible = false;
  setLight('dark', { ceil: 0, hemi: 0.6 }); fridgeGlow.intensity = 5; pose('fridge'); sleepy(0.7); snacksOn(3 + Math.floor(clamp(t / 4) * 3));
  hero.rotation.y = Math.PI * 0.9; H.arms[1].rotation.x = -1.0 + Math.sin(t * 3) * 0.3;
  const u = ease(t / 8.6);
  look(lerp(-0.6, -0.3, u), 2.1, lerp(2.6, 2.2, u), 1.4, 1.2, -2.5, 50);
  hudTime('+1か月');
  setTop('高カロリー・炭水化物への欲求（2004年）', '最大+' + countUp(t, 45) + '%', fade(t, 0.15, 8.6, 0.25), '#ff8a7a');
  return room;
}
function shot7(t, T) { // result: asleep at the desk in the office
  office('31日目'); sleepy(1); H.head.rotation.set(0.75, 0, 0.2);
  const u = ease(t / 7.5);
  look(lerp(1.4, 2.6, u), lerp(2.3, 3.2, u), lerp(-2.2, -3.0, u), 0, 1.1, -0.6, 50);
  setTop('14日間の実験での頭の働き（2003年）', '徹夜' + countUp(t, 2, 0.2, 1.0) + '晩分', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return room;
}
function shot8(t, T) { // loop: the clock again
  bedroom('dark', '2:00', '1日目'); pose('bed'); props.sleeper.visible = true; hero.visible = false;
  const u = ease(t / 4);
  look(0.9, 1.55, lerp(1.5, 1.4, u), 0.9, 0.95, -2.85, 50);
  setHud('今夜の睡眠', '4時間', 1, { color: '#ff8a7a' });
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
    id: '0010',
    title: '毎日4時間睡眠を1か月続けたら？',
    titleHtml: '毎日4時間睡眠を<br>1か月続けたら？',
    mood: 'tension', seed: 11, hits: [1.0, 22.2, 48.1], risers: [1.0],
    caption: 'もしもあなたが毎日4時間睡眠を1か月続けたら？\n本人は慣れたつもりでも、頭の働きは徹夜2晩分まで落ち、食欲ホルモンは28%増える。睡眠研究のデータでシミュレーション。\n\n出典：Van Dongen et al.（2003）Sleep、Spiegel et al.（2004）Annals of Internal Medicine、厚生労働省 健康づくりのための睡眠ガイド2023',
    hashtags: ['もしもラボ', '睡眠不足', 'ショートスリーパー', '集中力', '雑学'],
    endStats: [['大人の睡眠の目安', '6時間以上', '2023年'], ['14日後の頭の働き', '最大で徹夜2晩分', '2003年'], ['食欲ホルモン', '+28%', '2004年'], ['満腹ホルモン', '-18%', '2004年']],
    sources: '出典：Van Dongen et al.（2003）、Spiegel et al.（2004）、<br>厚生労働省 健康づくりのための睡眠ガイド2023',
  },
});
