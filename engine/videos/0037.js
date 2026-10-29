import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeBack, fade, mat, box, comma, makePerson, randPerson, poseWalk, makeQ, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setClock, setScreen, props, glow, lamp } from '../scenes/room.js';
import { town, setTownEnv } from '../scenes/town.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしもスマホを1か月手放したら？（blueprint no 37）
// 0012（世界からスマホが消えたら）とは別の切り口：あなた1人が手放す話。着地は実験で分かった心と集中力の変化。
// 数字：スマホ利用率 95.9%（13〜79歳）、モバイル機器でのネット利用 平日120.5分（全年代）
//       （総務省 情報通信政策研究所「令和7年度 情報通信メディアの利用時間と情報行動に関する調査」2026年6月公表、2025年12月調査）
//       浮く時間 120.5分×30日＝約60時間（単純計算・平日平均）、映画1本2時間として約30本分（単純計算）
//       スマホのネットを2週間止めた実験：467人、スマホ画面の時間 1日314分→161分、90.7%が 主観的幸福・心の健康・集中力 のどれかで改善、
//       集中力の改善は年齢による低下の約10年分、睡眠も増えた、外で過ごす時間・人と会う時間が増えた
//       （Castelo et al., PNAS Nexus 4(2) pgaf017, 2025）

// ---------- you (sofa) ----------
const scrM = new THREE.MeshBasicMaterial({ color: 0x9fd8ff });
function givePhone(p) { const ph = new THREE.Group(); const b = box(0.09, 0.16, 0.02, mat('#1b1d22')); ph.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.14), scrM); s.position.z = 0.012; ph.add(s); ph.position.set(0, -0.62, 0.1); ph.rotation.x = -1.1; p.userData.arms[1].add(ph); p.userData.phone = ph; return ph; }
const you = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#4fa3d1', pants: '#2b3346', scale: 1 });
you.position.set(0.3, -0.42, 0.6); you.rotation.y = Math.PI; you.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2);
room.add(you); givePhone(you);
const book = new THREE.Group(); { const c = box(0.46, 0.03, 0.32, mat('#e46a5b')); book.add(c); const pg = box(0.42, 0.03, 0.28, mat('#f7f3e8')); pg.position.y = 0.025; book.add(pg); const sp = box(0.02, 0.05, 0.3, mat('#b8483c')); sp.position.y = 0.03; book.add(sp); }
book.visible = false; you.add(book); book.position.set(0, 0.98, 0.36); book.rotation.x = -0.65;
const youQ = makeQ(); room.add(youQ);
const spark = makeSparkles(220, 0.05, 0x9fd8ff); room.add(spark.points);
function sitPose(mode, t = 0) {
  const A = you.userData.arms, H = you.userData.head;
  A[0].rotation.set(0, 0, 0); A[1].rotation.set(0, 0, 0); H.rotation.set(0, 0, 0); book.visible = false;
  if (mode === 'phone') { A[1].rotation.set(-1.25, 0, -0.35); H.rotation.x = 0.45; }
  if (mode === 'pocket') { A[1].rotation.set(0.35 + Math.sin(t * 5) * 0.12, 0, 0.25); A[0].rotation.set(0.3 - Math.sin(t * 5 + 1) * 0.1, 0, -0.2); H.rotation.x = 0.35; H.rotation.y = Math.sin(t * 1.3) * 0.25; }
  if (mode === 'bored') { A[0].rotation.set(-0.4, 0, 0.2); A[1].rotation.set(-0.3, 0, -0.2); H.rotation.x = -0.25; H.rotation.y = Math.sin(t * 0.9) * 0.5; }
  if (mode === 'book') { A[0].rotation.set(-1.1, 0, 0.35); A[1].rotation.set(-1.1, 0, -0.35); H.rotation.x = 0.35; book.visible = true; }
  you.userData.phone.visible = mode === 'phone';
}
const friend = makePerson({ skin: SKIN[3], hair: HAIR[3], shirt: '#f2c14e', pants: '#3b3f4a', long: true }); room.add(friend);
friend.position.set(1.45, -0.42, 0.6); friend.rotation.y = Math.PI; friend.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); friend.visible = false;
function living(mode) {
  lift(LIFTS);
  setRoom({ sets: ['living'] }); you.visible = true; props.sleeper.visible = false;
  if (mode === 'night') { setLight('night', { ceil: 3, hemi: 0.55, lamp: 1.4 }); lamp.position.set(-2.6, 1.6, 0.2); lamp.color.set('#ffd6a0'); }
  else if (mode === 'evening') { setLight('evening', { ceil: 8, hemi: 0.9 }); }
  else setLight('day', { ceil: 6 });
  setScreen((g, w, h) => { g.fillStyle = '#16181d'; g.fillRect(0, 0, w, h); });
}
function phoneGlow(on) { glow.intensity = on ? 0.45 : 0; glow.color.set('#9fd0ff'); glow.position.set(0.3, 1.0, -0.2); }
let LIFTS = 520;
// side-front camera onto the sofa (TV wall behind the camera's left)
function sofaCam(t, d = 8, near = false) { const u = ease(t / d); if (near) look(lerp(-1.9, -1.7, u), lerp(1.75, 1.7, u), lerp(-1.7, -1.9, u), 0.4, 0.8, 0.6, 50); else look(lerp(-2.3, -1.8, u), lerp(1.9, 1.8, u), lerp(-2.2, -2.5, u), 0.6, 0.85, 0.6, 52); }
function roomReset() { you.visible = true; friend.visible = false; youQ.visible = false; spark.set(0); props.sleeper.visible = true; props.phone.visible = true; phoneGlow(false); }

// ---------- outside: walk with a friend ----------
const walkers = [];
{ const a = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#4fa3d1', pants: '#2b3346' }); const b = makePerson({ skin: SKIN[3], hair: HAIR[3], shirt: '#f2c14e', pants: '#3b3f4a', long: true }); town.add(a); town.add(b); walkers.push(a, b); }
const others = []; { const r = rng(37); for (let i = 0; i < 6; i++) { const p = randPerson(r); town.add(p); others.push({ p, x: (r() < .5 ? -1 : 1) * 4.3, z0: -30 + r() * 40, s: 0.6 + r() * 0.5, dir: r() < .5 ? 1 : -1, ph: r() * 6 }); } }
function townWalk(t) {
  walkers.forEach((p, i) => { p.visible = true; p.position.set(3.7 + i * 0.95, 0, 6 - t * 1.1); p.rotation.y = Math.PI; poseWalk(p, t * 6.5 + i * 1.3, 0.8); p.userData.head.rotation.y = (i ? 1 : -1) * (0.35 + Math.sin(t * 1.4) * 0.15); });
  others.forEach((o, i) => { o.p.position.set(-4.3 + (i % 2) * 0.6, 0, o.z0 + o.dir * t * o.s); o.p.rotation.y = o.dir > 0 ? 0 : Math.PI; poseWalk(o.p, t * 6 + o.ph, 0.7); });
}

const SUBS = [
  [2.6, 6.0, 'いつもの夜。<br>気づけば、ずっとスマホ。'],
  [6.2, 10.1, '1か月、スマホなし。<br>集中力はどう変わる？'],
  [10.1, 14, 'ないのに、何度も<br>ポケットを探してしまう。'],
  [14.2, 18.1, 'スマホでネットを見る時間は、<br>平日1日 約2時間。'],
  [18.1, 22, 'その2時間が空いた。<br>すると、体が変わり始めた。'],
  [22.2, 26.1, '寝る前の画面の光が、<br>消えた。'],
  [26.1, 30, 'スマホのネットを止めた<br>実験では、睡眠も増えた。'],
  [30.2, 34.6, '外を歩く時間、<br>人と会う時間が増えた。'],
  [34.6, 39, '集中力は、年齢でいうと<br>約10歳分よくなった。'],
  [39.2, 43.6, '夜は、本を<br>読むようになった。'],
  [43.6, 47.8, '気分の落ち込みも、<br>軽くなっていた。'],
  [48.1, 53.8, '結果：2週間で、9割の人の<br>心か集中力が上向いた。'],
  [53.9, 56.5, '浮いた時間は、<br>1か月で約60時間。'],
  [56.6, 59.4, 'あなたは何日、<br>手放せる？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
function hookCam(t, d = 2.5) { const u = ease(clamp(t / d)); look(lerp(-2.0, -1.9, u), lerp(1.95, 1.9, u), lerp(-1.9, -1.8, u), 0.35, 0.95, 0.6, 50); }
const TV = 0.5; // v2：0.5秒で消える（冒頭で待たせない）
function shot0(t) { // hook: phone in your hand vanishes
  living('night'); roomReset(); props.sleeper.visible = false;
  sitPose('phone'); you.userData.phone.visible = t < TV; phoneGlow(t < TV);
  you.userData.arms[1].rotation.set(-1.75, 0, -0.45); you.userData.head.rotation.x = 0.3; you.userData.phone.scale.setScalar(1.5); // v2：サムネで見えるよう、スマホを顔の前に上げる
  if (t >= TV && !spark.ready) { const v = new THREE.Vector3(); you.userData.phone.getWorldPosition(v); spark.init([v.toArray()], 0.08, 0.5); spark.ready = true; }
  spark.set(t >= TV ? (t - TV) / 1.0 : 0);
  el.flash.style.opacity = t >= TV ? 0.5 * Math.max(0, 1 - (t - TV) / 0.3) : 0;
  lift(-60); hookCam(t); // v2：0秒目サムネ。顔と手のスマホがタイトルの下に来るよう近くから
  setHud('スマホが消えるまで', cd(Math.max(0, TV - t)), 1, { mono: true, color: t < TV ? '#fff' : '#ff6b6b' });
  return room;
}
function shot1(t) { // everyday: scrolling at night
  living('night'); roomReset(); props.sleeper.visible = false;
  sitPose('phone'); phoneGlow(true); you.userData.arms[1].rotation.z = -0.35 + Math.sin(t * 3) * 0.03;
  sofaCam(t, 4);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return room;
}
function shot2(t) { // +1h pocket searching
  living('evening'); roomReset(); props.sleeper.visible = false;
  sitPose('pocket', t);
  const qa = clamp((t - 4.2) / 0.3); youQ.visible = qa > 0; youQ.position.set(0.3, 1.95, 0.6); youQ.scale.setScalar(0.5 * easeBack(qa));
  sofaCam(t, 8);
  hudTime('+1時間');
  setTop('スマホを使う人（13〜79歳・2025年）', countUp(t, 959, 0.3, 1.4) / 10 + '%', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot3(t) { // +1day bored, TV off, daytime
  living('day'); roomReset(); props.sleeper.visible = false;
  sitPose('bored', t);
  sofaCam(t, 8);
  hudTime('+1日');
  setTop('スマホなどでネットを使う時間（平日・2025年）', countUp(t, 1205, 0.3, 1.4) / 10 + '分', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t) { // +1week bedroom at night, no phone glow
  lift(120);
  setRoom({ sets: ['bed'] }); setLight('night', { ceil: 0, hemi: 0.75, lamp: 0.9 }); lamp.position.set(-0.2, 1.4, -2.6); lamp.color.set('#ffcf9a');
  you.visible = false; friend.visible = false; youQ.visible = false; spark.set(0); phoneGlow(false);
  props.sleeper.visible = true; props.phone.visible = false; setClock('23:00', '#7ff0c8');
  const u = ease(t / 8);
  look(lerp(-2.4, -2.0, u), lerp(2.6, 2.4, u), lerp(2.6, 2.0, u), 0.9, 0.7, -2.0, 50);
  hudTime('+1週間');
  const v = Math.round(lerp(314, 161, clamp((t - 0.4) / 1.6)));
  setTop('実験：1日のスマホ画面の時間（米国・2025年）', '314分→' + v + '分', fade(t, 0.15, 8, 0.25), '#7ff0c8');
  return room;
}
function shot5(t) { // +2weeks walking outside together
  lift(420);
  setTownEnv('day'); walkers.forEach(p => p.visible = true);
  townWalk(t + 1);
  const p = walkers[0].position;
  look(p.x - 3.2, 2.6, p.z - 5.5, p.x + 0.2, 1.2, p.z + 0.5, 50);
  hudTime('+2週間');
  setTop('実験：集中力の改善（米国・2025年）', '約' + countUp(t, 10, 4.7, 1.0) + '歳分', fade(t, 4.6, 9.2, 0.25), '#7ff0c8');
  return town;
}
function shot6(t) { // +1month reading on the sofa with a friend at evening
  living('evening'); roomReset(); props.sleeper.visible = false;
  sitPose('book'); friend.visible = true; friend.userData.head.rotation.y = -0.4; lift(300);
  sofaCam(t, 8.8);
  hudTime('+1か月');
  setTop('実験に参加した人（米国・2025年）', countUp(t, 467, 0.2, 0.6) + '人', fade(t, 0.15, 8.8, 0.25));
  return room;
}
function shot7(t) { // result: calm night, reading, no phone glow
  living('night'); roomReset(); props.sleeper.visible = false;
  sitPose('book'); friend.visible = false;
  const u = ease(t / 7.5);
  look(lerp(-1.4, -2.4, u), lerp(1.6, 2.1, u), lerp(-1.3, -2.4, u), 0.5, 0.9, 0.6, 50);
  if (t < 5.9) setTop('実験：心か集中力が上向いた人（米国・2025年）', (countUp(t, 907, 0.2, 1.4) / 10).toFixed(1) + '%', fade(t, 0.15, 5.9, 0.25), '#7ff0c8');
  else setTop('浮く時間（平日120.5分×30日・単純計算）', '約60時間', fade(t, 5.9, 7.6, 0.25));
  return room;
}
function shot8(t) { // loop: same framing as hook, hand empty
  living('night'); roomReset(); props.sleeper.visible = false;
  sitPose('phone'); you.userData.phone.visible = false; phoneGlow(false);
  lift(-60); hookCam(t + 0.5);
  setHud('スマホが消えるまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 65, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65,
  cut: [[2.5, 6.0]], // v2：夜にスマホを見続ける いつもの夜（元の2.5〜6秒）を抜いて、消えた直後から本題へ
  meta: {
    id: '0037',
    v2: true,
    hookLine: 'あなたのスマホが、手の中から消えた。',
    title: 'スマホを1か月手放したら？',
    titleHtml: 'スマホを1か月<br>手放したら？',
    mood: 'calm', seed: 37, hits: [0.5, 48.1], risers: [44.0],
    impacts: [48.4],
    sfx: [[0.5, 'poof', 1]],
    narr: { '95.9%': 'きゅうじゅうごてんきゅうパーセント', '約10歳分': 'やく10さいぶん', '9割': 'きゅうわり' },
    ask: 'あなたは何日、手放せる？',
    caption: 'もしもあなたが、今日からスマホを1か月手放したら？\n日本で13〜79歳のスマホ利用率は95.9%。スマホなどでネットを使う時間は平日1日120.5分（2025年）。1か月なら約60時間が浮く計算（平日平均×30日・単純計算）。\n米国でスマホのネットを2週間止めた実験（467人）では、スマホ画面の時間が1日314分から161分に減り、90.7%の人が気分・心の健康・集中力のどれかで上向いた。集中力の改善は、年齢でいうと約10歳分。睡眠や、外で過ごす時間・人と会う時間も増えた。\n結果：2週間で、9割の人の心か集中力が上向いた。\n\nあなたは何日、手放せる？ コメントで教えて。\n\n出典：総務省 情報通信政策研究所「令和7年度 情報通信メディアの利用時間と情報行動に関する調査」（2026年）、Castelo et al.「Blocking mobile internet on smartphones improves sustained attention, mental health, and subjective well-being」PNAS Nexus（2025年）',
    hashtags: ['もしもラボ', 'スマホ断ち', 'デジタルデトックス', 'スクリーンタイム', '雑学'],
    endStats: [['スマホ利用率（13〜79歳）', '95.9%', '2025年'], ['スマホ等のネット利用', '平日120.5分', '2025年'], ['1か月で浮く時間', '約60時間', '単純計算'], ['実験：心か集中力が上向いた人', '90.7%', '米国・2025年'], ['実験：集中力の改善', '約10歳分', '米国・2025年']],
    sources: '出典：総務省 情報通信政策研究所（2026年公表）、<br>Castelo et al., PNAS Nexus（2025年）',
  },
});
