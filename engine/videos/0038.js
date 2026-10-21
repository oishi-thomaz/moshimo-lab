import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeBack, fade, mat, box, comma, makePerson, randPerson, poseWalk, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setClock, props, glow, lamp } from '../scenes/room.js';
import { town, setTownEnv } from '../scenes/town.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも真夏にエアコンが全部消えたら？（blueprint no 38）
// 数字：ルームエアコン普及率 92.2%・100世帯あたり 284.5台（二人以上の世帯、2026年3月末）
//       （内閣府 経済社会総合研究所「消費動向調査 令和8年3月実施調査結果」）
//       熱中症の救急搬送 100,510人（2025年5〜9月、調査開始以来最多）、65歳以上 57.1%、発生場所は住居が最多 38.1%
//       （総務省消防庁「令和7年（5月〜9月）の熱中症による救急搬送状況」2025年10月29日）
//       東京23区の熱中症死亡者 193人（2025年6〜9月）、うち屋内 181人。屋内で亡くなった人のうち エアコン使用なし121人＋設置なし23人＝144人（79.6%）、単身住まい152人
//       （東京都監察医務院「令和7年夏の熱中症死亡者の状況（東京都23区・確定値）」）
// 死亡の場面は描かない。結果は 全員がエアコンなし＝亡くなった人の8割と同じ条件 という事実で言い切る。

// ---------- wall air conditioner (bedroom, above the headboard) ----------
const AC = new THREE.Group(); room.add(AC);
const acPos = new THREE.Vector3(1.6, 2.72, -3.33);
{
  const body = box(1.15, 0.36, 0.3, mat('#f4f5f3')); AC.add(body);
  const flap = box(1.0, 0.04, 0.12, mat('#d9dcdf')); flap.position.set(0, -0.17, 0.12); flap.rotation.x = 0.5; AC.add(flap);
  const grille = box(1.0, 0.02, 0.01, mat('#c9cdd2')); grille.position.set(0, 0.12, 0.155); AC.add(grille);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.01), new THREE.MeshBasicMaterial({ color: 0x46e08a })); led.position.set(0.45, -0.06, 0.156); AC.add(led);
}
AC.position.copy(acPos);
// cool air streaks
const airM = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
const airs = [];
for (let i = 0; i < 7; i++) { const a = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.42), airM); a.rotation.x = -0.6; room.add(a); airs.push({ a, x: -0.45 + i * 0.15, ph: i * 0.37 }); }
function setAir(on, t) { airs.forEach(o => { o.a.visible = on; if (!on) return; const u = (t * 0.9 + o.ph) % 1; o.a.position.set(acPos.x + o.x, acPos.y - 0.3 - u * 0.9, acPos.z + 0.25 + u * 0.7); }); airM.opacity = 0.45; }
const acSpark = makeSparkles(260, 0.06, 0xffffff); room.add(acSpark.points);
// sweat drops near the sleeper's head
const sweatM = new THREE.MeshBasicMaterial({ color: 0x8fd4ff });
const sweats = []; for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), sweatM); s.scale.y = 1.5; room.add(s); sweats.push(s); }
function setSweat(k, t) { sweats.forEach((s, i) => { s.visible = k > i / 5; const u = (t * 0.6 + i * 0.21) % 1; s.position.set(1.35 + i * 0.12, 1.15 - u * 0.25, -2.6 + (i % 2) * 0.12); }); }
const blanketHome = props.blanket.position.clone();
function bedroom(hot = 0, t = 0) {
  setRoom({ sets: ['bed'] }); props.sleeper.visible = true; props.phone.visible = true; ward.visible = false;
  setLight('night', { ceil: 0, hemi: 0.8, lamp: 1.3 }); lamp.position.set(-0.1, 1.3, -2.5); setClock('2:00', '#ff5b4f');
  lamp.color.set(hot > 0.5 ? '#ff9a5a' : '#ffd2a0');
  glow.intensity = hot * 1.6; glow.color.set('#ff6a3a'); glow.position.set(1.6, 1.6, -1.2);
  props.blanket.position.set(blanketHome.x, blanketHome.y + 0.09, blanketHome.z + hot * 1.0); props.blanket.scale.z = 1 - hot * 0.55;
  props.sleeper.rotation.z = hot > 0.3 ? Math.sin(t * 1.7) * 0.18 * hot : 0;
  setSweat(hot, t);
}
function bedCam(t, d = 8) { const u = ease(t / d); look(lerp(-1.9, -1.5, u), lerp(3.3, 3.2, u), lerp(3.6, 3.1, u), 1.3, 1.25, -2.4, 52); }

// ---------- hospital ward: 3 patients resting ----------
const ward = new THREE.Group(); room.add(ward); ward.visible = false;
const patients = []; { const r = rng(38); for (let i = 0; i < 3; i++) { const p = randPerson(r, { scale: 0.95 }); p.rotation.x = -Math.PI / 2; p.position.set(-2.6 + i * 2.6, 0.74, -1.25); ward.add(p); patients.push(p); const bl = box(1.0, 0.1, 1.3, mat('#a9cbe0')); bl.position.set(-2.6 + i * 2.6, 0.94, -1.6); ward.add(bl); } }
const nurse = makePerson({ skin: SKIN[0], hair: HAIR[0], shirt: '#f2f6fa', pants: '#f2f6fa', long: true }); nurse.position.set(1.3, 0, -0.6); ward.add(nurse); nurse.visible = false;

// ---------- town in the heat ----------
const walkers = []; { const r = rng(83); for (let i = 0; i < 5; i++) { const p = randPerson(r); town.add(p); walkers.push({ p, z0: -20 + i * 4.5, x: (i % 2 ? 4.3 : -4.3), dir: i % 2 ? 1 : -1, ph: r() * 6 }); } }
const umb = []; walkers.forEach((w, i) => { if (i % 2) return; const u = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.22, 10), mat('#3a3f4a')); u.position.y = 2.15; w.p.add(u); const st = box(0.03, 0.5, 0.03, mat('#222')); st.position.set(0, 1.9, 0); w.p.add(st); umb.push(u); });
function townAt(t, n) { walkers.forEach((w, i) => { w.p.visible = i < n; w.p.position.set(w.x, 0, w.z0 + w.dir * t * 0.45); w.p.rotation.y = w.dir > 0 ? 0 : Math.PI; poseWalk(w.p, t * 4 + w.ph, 0.45); }); }

const SUBS = [
  [2.6, 6.0, '真夏の夜。エアコンの<br>おかげで眠れている。'],
  [6.2, 10.1, '日本中のエアコンが、<br>一斉に消えた。'],
  [10.1, 14, '二人以上の世帯の<br>92.2%が持っていた。'],
  [14.2, 18.1, '寝室が、じわじわ<br>暑くなっていく。'],
  [18.1, 22, '消えたのは、100世帯で<br>284.5台。'],
  [22.2, 26.1, 'いつもの夏でも、熱中症の<br>搬送は約10万人。'],
  [26.1, 30, 'いちばん多い場所は、<br>家の中だった。'],
  [30.2, 34.6, '店も駅も、涼しい場所は<br>どこにもない。'],
  [34.6, 39, '搬送された人の半分以上は、<br>65歳以上。'],
  [39.2, 43.6, '2025年夏、東京23区で<br>亡くなった人は193人。'],
  [43.6, 47.8, 'そのうち181人が、<br>家の中だった。'],
  [48.1, 53.8, '結果：全員が、亡くなった人の<br>8割と同じ、エアコンなしの夏へ。'],
  [53.9, 56.1, 'エアコンは、命の家電だった。'],
  [56.2, 59.4, 'あなたの家、<br>エアコン何台？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
const TV = 1.3;
function hookCam(t) { const u = ease(t / 4); look(lerp(-0.4, -0.2, u), lerp(1.9, 1.95, u), lerp(1.2, 0.9, u), 1.4, 1.95, -2.9, 52); }
function shot0(t) { // hook: AC running, countdown, vanishes
  lift(0);
  bedroom(0, t); AC.visible = t < TV; setAir(t < TV, t);
  if (t >= TV && !acSpark.ready) { acSpark.init([[acPos.x - 0.4, acPos.y, acPos.z + 0.15], [acPos.x, acPos.y, acPos.z + 0.15], [acPos.x + 0.4, acPos.y, acPos.z + 0.15]], 0.3, 0.6); acSpark.ready = true; }
  acSpark.set(t >= TV ? (t - TV) / 1.0 : 0);
  el.flash.style.opacity = t >= TV ? 0.5 * Math.max(0, 1 - (t - TV) / 0.3) : 0;
  hookCam(t);
  el.title.style.opacity = 1;
  setHud('エアコンが消えるまで', cd(Math.max(0, TV - t)), 1, { mono: true, color: t < TV ? '#fff' : '#ff6b6b' });
  return room;
}
function shot1(t) { // everyday: cool bedroom
  lift(230);
  bedroom(0, t); AC.visible = true; setAir(true, t + 2); acSpark.set(0);
  bedCam(t, 4);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return room;
}
function shot2(t) { // +10min: AC gone
  lift(230);
  bedroom(clamp(t / 8) * 0.3, t); AC.visible = false; setAir(false); acSpark.set(0);
  bedCam(t + 4, 12);
  hudTime('+10分');
  setTop('エアコンがある家（二人以上の世帯・2026年）', (countUp(t, 922, 4.2, 1.2) / 10).toFixed(1) + '%', fade(t, 4.1, 8, 0.25));
  return room;
}
function shot3(t) { // +1h hot bedroom: blanket off, tossing, sweat
  lift(80);
  bedroom(0.4 + clamp(t / 6) * 0.6, t); AC.visible = false; setAir(false);
  const u = ease(t / 8); look(lerp(-0.9, -0.6, u), lerp(2.4, 2.3, u), lerp(0.9, 0.6, u), 1.5, 0.85, -2.2, 50);
  hudTime('+1時間');
  setTop('100世帯あたりのエアコン（2026年）', (countUp(t, 2845, 4.1, 1.2) / 10).toFixed(1) + '台', fade(t, 4.0, 8, 0.25));
  return room;
}
function shot4(t) { // +1day ward
  lift(130);
  setRoom({ sets: ['ward'] }); ward.visible = true; props.sleeper.visible = false; AC.visible = false; setAir(false); setSweat(0, 0);
  setLight('day', { ceil: 7 }); glow.intensity = 0;
  nurse.position.set(lerp(1.6, -1.3, clamp(t / 7.5)), 0, -0.85); nurse.rotation.y = -Math.PI / 2; poseWalk(nurse, t * 6, t < 7 ? 0.7 : 0);
  const u = ease(t / 8); look(lerp(-0.4, 0.4, u), 3.15, lerp(2.2, 1.8, u), 0, 0.2, -2.4, 62);
  hudTime('+1日');
  if (t < 4.1) setTop('熱中症の救急搬送（2025年5〜9月）', comma(countUp(t, 100510)) + '人', fade(t, 0.15, 4.1, 0.25));
  else setTop('発生場所で最多：家の中（2025年）', (countUp(t, 381, 4.3, 1.0) / 10).toFixed(1) + '%', fade(t, 4.1, 8, 0.25), '#ff8a7a');
  return room;
}
function shot5(t) { // +1week hot town: few people, parasols
  lift(260);
  setTownEnv('day'); townAt(t, 5);
  const u = ease(t / 9.2); look(lerp(-9, -7, u), lerp(7, 6, u), lerp(16, 12, u), 0, 1, -4, 50);
  hudTime('+1週間');
  setTop('搬送された人のうち65歳以上（2025年）', (countUp(t, 571, 4.7, 1.0) / 10).toFixed(1) + '%', fade(t, 4.5, 9.2, 0.25), '#ff8a7a');
  return town;
}
function shot6(t) { // +1month dusk town, lit windows
  lift(260);
  setTownEnv('dusk'); townAt(t, 1);
  const u = ease(t / 8.8); look(lerp(3, 1, u), lerp(24, 21, u), lerp(26, 22, u), 0, 0, -4, 50);
  hudTime('+1か月');
  if (t < 4.4) setTop('熱中症で亡くなった人（東京23区・2025年夏）', countUp(t, 193, 0.2, 0.5) + '人', fade(t, 0.15, 4.4, 0.25));
  else setTop('そのうち家の中（東京23区・2025年夏）', countUp(t, 181, 4.6, 0.9) + '人', fade(t, 4.4, 8.8, 0.25), '#ff8a7a');
  return town;
}
function shot7(t) { // result: hot bedroom, no AC
  lift(400);
  bedroom(1, t + 3); AC.visible = false; setAir(false);
  const u = ease(t / 7.5); look(lerp(-1.0, -1.7, u), lerp(2.3, 2.5, u), lerp(1.0, 2.2, u), 1.3, 1.2, -2.3, 52);
  setTop('エアコンを使っていなかった（屋内・東京23区・2025年）', (countUp(t, 796, 0.3, 1.3) / 10).toFixed(1) + '%', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return room;
}
function shot8(t) { // loop: hook framing, AC gone, warm light
  lift(0);
  bedroom(0.8, t); AC.visible = false; setAir(false); acSpark.set(0);
  hookCam(t + 1.3);
  setHud('エアコンが消えるまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  return room;
}
function reset(f) { ward.visible = false; patients.forEach(p => p.visible = true); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { reset(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0038',
    title: '真夏にエアコンが全部消えたら？',
    titleHtml: '真夏にエアコンが<br>全部消えたら？',
    mood: 'tension', seed: 38, hits: [1.3, 48.1], risers: [36.0],
    impacts: [22.6, 48.4],
    sfx: [[1.3, 'poof', 1], [14.5, 'meter', 0.5]],
    narr: { '92.2%': 'きゅうじゅうにてんにパーセント', '284.5台': 'にひゃくはちじゅうよんてんごだい', '東京23区': 'とうきょうにじゅうさんく', '8割': 'はちわり', '193人': 'ひゃくきゅうじゅうさんにん', '181人': 'ひゃくはちじゅういちにん' },
    ask: 'あなたの家、エアコン何台？',
    caption: 'もしも真夏に、日本中のエアコンが一斉に消えたら？\nエアコンがある家は二人以上の世帯の92.2%、100世帯あたり284.5台（2026年3月末）。\nいつもの夏でも、熱中症の救急搬送は100,510人（2025年5〜9月、過去最多）。発生場所でいちばん多いのは家の中（38.1%）で、65歳以上が57.1%。\n2025年夏、東京23区で熱中症で亡くなった人は193人。そのうち181人が家の中で、その約8割（79.6%）はエアコンを使っていなかった（設置なしを含む）。\n結果：全員が、亡くなった人の8割と同じ「エアコンなしの夏」になる。エアコンは、命を守る家電だった。\n\nあなたの家、エアコン何台？ コメントで教えて。\n\n出典：内閣府「消費動向調査」（2026年3月）、総務省消防庁「令和7年（5月〜9月）の熱中症による救急搬送状況」、東京都監察医務院「令和7年夏の熱中症死亡者の状況（東京都23区・確定値）」',
    hashtags: ['もしもラボ', 'エアコン', '熱中症', '夏', '雑学'],
    endStats: [['エアコンがある家（二人以上の世帯）', '92.2%', '2026年'], ['100世帯あたりのエアコン', '284.5台', '2026年'], ['熱中症の救急搬送', '100,510人', '2025年5〜9月'], ['熱中症死亡（東京23区）', '193人', '2025年夏'], ['そのうち家の中', '181人', '2025年夏'], ['うちエアコンなし', '79.6%', '設置なし含む']],
    sources: '出典：内閣府 消費動向調査（2026年）、総務省消防庁（2025年）、<br>東京都監察医務院（2025年夏・確定値）',
  },
});
