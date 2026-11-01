import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, randPerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setClock, props, lamp, glow } from '../scenes/room.js';
import { stage, makeBar, setStageColor, stageDisc } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも1か月だれとも話さなかったら？（blueprint no 731・人体の限界シリーズ）
// 数字（すべて一次資料で確認）：
//  内閣府 孤独・孤立対策推進室「孤独・孤立の実態把握に関する全国調査（令和7年）」結果のポイント（2026年4月14日公表・2025年12月調査）
//   https://www.cao.go.jp/kodoku_koritsu/torikumi/zenkokuchousa/r7/pdf/tyosakekka_point.pdf
//   ・孤独感が しばしばある・常にある 4.5%＋時々ある 13.7%＋たまにある 19.5%＝37.7%（約4割）
//   ・同居していない家族や友人と直接会って話すことが 全くない 9.7%
//  U.S. Surgeon General's Advisory "Our Epidemic of Loneliness and Isolation"（2023年）
//   https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf
//   ・社会的孤立で早く亡くなるリスク +29%（孤独感は +26%）
//   ・つながりの不足は、最大でたばこ1日15本と同じくらい早く亡くなるリスクを上げる
//   ・心臓病 +29%、脳卒中 +32%、高齢者の認知症 約+50%
//   ・友人と直接会う時間：2003年 月30時間 → 2020年 月10時間（米国）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- your room at night ----------
const you = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#59606e', pants: '#2b3346', scale: 1 }); room.add(you);
const U = you.userData;
const scrM = new THREE.MeshBasicMaterial({ color: '#cfe6ff' });
const phone = new THREE.Group(); { const b = box(0.09, 0.16, 0.02, mat('#1b1d22')); phone.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.14), scrM); s.position.z = 0.012; phone.add(s); }
phone.position.set(0, -0.62, 0.1); phone.rotation.x = -1.1; U.arms[1].add(phone);
const pl = new THREE.PointLight(0xbcd8ff, 0, 1.8, 1.5); room.add(pl);
function stand(t, x = -0.3, z = -0.6, ry = 0.25, headDown = 0.45) {
  you.visible = true; you.position.set(x, 0, z); you.rotation.set(0, ry, 0);
  U.legs.forEach(l => l.rotation.x = 0); U.arms[0].rotation.set(0.05, 0, 0.06); U.arms[1].rotation.set(-1.05, 0, -0.25);
  U.head.rotation.set(headDown + Math.sin(t * 0.6) * 0.03, 0, 0);
  const v = new THREE.Vector3(); phone.getWorldPosition(v); pl.position.set(v.x, v.y + 0.3, v.z + 0.2);
}
// chat bubbles around you
const WORDS = ['おつかれ！', 'またね', 'ありがとう', '今日どう？', 'おはよう'];
const BUB = [[-0.85, 1.95, -0.5], [0.25, 2.05, -0.5], [-0.9, 1.45, -0.3], [0.35, 1.5, -0.3], [-0.3, 2.3, -0.7]];
const bubbles = WORDS.map((w, i) => { const s = textSprite(w, { w: 512, h: 170, size: 72, bg: 'rgba(255,255,255,.95)', color: '#2a2f3a', radius: 60, sx: 0.7 }); s.renderOrder = 7; s.material.depthTest = false; room.add(s); return s; });
const bubSpark = makeSparkles(200, 0.06); room.add(bubSpark.points);
function setBubbles(on, t = 0, dx = 0, dz = 0) { bubbles.forEach((b, i) => { b.visible = on; const [x, y, z] = BUB[i]; b.position.set(x + dx, y + Math.sin(t * 1.4 + i) * 0.03, z + dz); }); }
// body markers
const markM = new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.5, depthTest: false });
const heart = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), markM); heart.renderOrder = 6; room.add(heart);
const brain = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), markM.clone()); brain.renderOrder = 6; room.add(brain);
const tagHeart = textSprite('心臓', { w: 384, h: 140, size: 78, bg: 'rgba(224,72,58,.92)', sx: 0.5 }); tagHeart.material.depthTest = false; tagHeart.renderOrder = 8; room.add(tagHeart);
const tagBrain = textSprite('脳', { w: 256, h: 140, size: 78, bg: 'rgba(224,72,58,.92)', sx: 0.36 }); tagBrain.material.depthTest = false; tagBrain.renderOrder = 8; room.add(tagBrain);
function marks(h, b, t) {
  const pulse = 0.5 + 0.25 * Math.sin(t * 7);
  const v = new THREE.Vector3();
  you.localToWorld(v.set(0.08, 1.25, 0.16)); heart.position.copy(v); heart.visible = h > 0.01; heart.material.opacity = pulse * h; tagHeart.visible = h > 0.01; tagHeart.material.opacity = h; tagHeart.position.set(v.x + 0.45, v.y - 0.05, v.z + 0.2);
  you.localToWorld(v.set(0, 1.76, 0.0)); brain.position.copy(v); brain.visible = b > 0.01; brain.material.opacity = pulse * b; tagBrain.visible = b > 0.01; tagBrain.material.opacity = b; tagBrain.position.set(v.x + 0.42, v.y + 0.2, v.z + 0.2);
}
function bedroom(light = 'night', opt = { ceil: 2.0, hemi: 0.75, lamp: 1.6 }) {
  setRoom({ sets: ['bed'] }); setLight(light, opt); lamp.position.set(1.0, 1.5, -2.2); setClock('23:40');
  props.sleeper.visible = false; props.phone.visible = false; props.clock.visible = false; pl.intensity = 2.0;
  setBubbles(false); bubSpark.set(0); marks(0, 0, 0);
}
const lonely = (d, col) => setHud('最後に人と話してから', d + '日', 1, { color: col || '#fff' });
function roomCam(t, d, a, b, tg = [-0.2, 1.2, -0.6]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }

// ---------- stage ----------
// 10 people, 1 stands apart
const TEN = new THREE.Group(); stage.add(TEN);
const ten = []; { const r = rng(731); for (let i = 0; i < 10; i++) { const p = randPerson(r); p.scale.setScalar(1.6); TEN.add(p); ten.push(p); } }
const spot = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color: 0xff8a7a, transparent: true, opacity: 0.55 })); spot.rotation.x = -Math.PI / 2; spot.position.y = 0.32; TEN.add(spot);
function setTen(k, t) {
  ten.forEach((p, i) => {
    if (i < 9) { const c = i % 5, r = Math.floor(i / 5); p.position.set(-4.2 + c * 1.5 + r * 0.7, 0.3, -0.6 + r * 1.4); p.rotation.y = Math.sin(t * 0.8 + i) * 0.4 + (c % 2 ? 0.5 : -0.5); }
    else { const x = lerp(-0.5, 3.0, ease(k)); p.position.set(x, 0.3, 0.6); p.rotation.y = -0.4; spot.position.x = x; spot.position.z = 0.6; spot.visible = k > 0.3; }
  });
}
// friend time bars (US)
const fBars = [makeBar({ color: '#4fa3d1', w: 1.8, d: 1.8, label: '2003年', x: -2.0, z: 0, nameTop: true }), makeBar({ color: '#e0584a', w: 1.8, d: 1.8, label: '2020年', x: 2.0, z: 0, nameTop: true })];
function setFBars(k, show) { fBars[0].g.visible = show; fBars[1].g.visible = show; fBars[0].setH(6 * ease(clamp(k * 2)), '月30時間'); fBars[1].setH(2 * ease(clamp(k * 2 - 0.6)), k > 0.5 ? '月10時間' : ''); }
// 15 cigarettes
const CIG = new THREE.Group(); stage.add(CIG);
const cigs = []; for (let i = 0; i < 15; i++) { const g = new THREE.Group(); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.4, 12), mat('#f4f1ea')); w.position.y = 1.2; g.add(w); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.7, 12), mat('#d98a3a')); f.position.y = 0.35; g.add(f); const c = i % 5, r = Math.floor(i / 5); g.position.set(-3.2 + c * 1.6, 0.3, -1.6 + r * 1.6); CIG.add(g); cigs.push(g); }
function setCigs(n) { cigs.forEach((g, i) => { const k = clamp(n - i); g.visible = k > 0.01; g.scale.set(1, Math.max(0.01, ease(k)), 1); }); }
// risk bars
const RISK = [['心臓病', 29, '#e0584a'], ['脳卒中', 32, '#e07a4a'], ['早く亡くなる', 29, '#c94f7c'], ['認知症', 50, '#8e6bbf']];
const rBars = RISK.map(([lab, v, c], i) => makeBar({ color: c, w: 1.5, d: 1.5, label: lab, x: -4.2 + i * 2.8, z: 0, nameTop: true }));
function setRBars(k, show) { rBars.forEach((b, i) => { b.g.visible = show; const kk = clamp(k[i] ?? 0); b.setH(0.2 + RISK[i][1] / 6.5 * ease(kk), kk > 0.05 ? '+' + Math.round(RISK[i][1] * ease(kk)) + '%' : ''); }); }
function stageMode(m) { TEN.visible = m === 'ten'; setFBars(0, false); CIG.visible = m === 'cig'; setRBars([], false); stageDisc.visible = m !== 'cig'; }

const SUBS = [
  [2.6, 6.0, 'さびしいだけでは、<br>終わらなかった。'],
  [6.2, 10.1, '日本では約4割が、<br>孤独を感じることがある。'],
  [10.1, 14, '家族や友人と会って話すことが<br>全くない人は…'],
  [14.2, 18.1, '9.7%。10人に1人。<br>でも本当の問題は体だった。'],
  [18.1, 22, '米国では、友人と会う時間が<br>17年で3分の1に減った。'],
  [22.2, 26.1, 'つながりがない状態が続くと、<br>心臓の病気は29%増える。'],
  [26.1, 30, '脳卒中は32%。<br>でも、まだ先がある。'],
  [30.2, 34.6, '早く亡くなるリスクは、<br>29%高くなる。'],
  [34.6, 39, 'その害は最大で、<br>たばこ1日15本と同じくらい。'],
  [39.2, 43.6, '高齢の人では、認知症の<br>リスクが約50%増える。'],
  [43.6, 47.8, '声を出さない日が、<br>30日続いた。'],
  [48.1, 53.8, '結果：孤立が続くと、<br>たばこ1日15本ほどの害になる。'],
  [53.9, 56.1, '話すのは、今日からできる。'],
  [56.2, 59.4, '最後にだれかと<br>話したのはいつ？'],
];

const TP = 0.5;
const HOOK_A = [0.9, 1.55, 3.7], HOOK_B = [0.8, 1.5, 3.35];
function shot0(t) { // hook: chat bubbles around you → 0.5s they all vanish
  lift(-40);
  bedroom('evening', { ceil: 6, hemi: 0.9, lamp: 1.2 });
  stand(t); setBubbles(t < TP, t);
  bubSpark.set(t >= TP ? (t - TP) / 1.3 : 0);
  el.flash.style.opacity = t >= TP ? 0.45 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  roomCam(t, 2.5, HOOK_A, HOOK_B);
  lonely(t < TP ? 0 : 30, t < TP ? '#fff' : RED);
  return room;
}
function shot1(t) { // night, alone; 37.7%
  lift(-40);
  bedroom(); stand(t + 2);
  bubSpark.set(t < 1.4 ? (t + 2.0) / 3.4 : 0);
  roomCam(t, 7.6, HOOK_B, [-1.7, 1.8, 3.4]);
  lonely(30, RED);
  setTop('孤独を感じることがある人（日本・2025年）', (countUp(t - 3.7, 377, 0.1, 1.1) / 10).toFixed(1) + '%', fade(t, 3.75, 7.6, 0.25), BLUE);
  return room;
}
function shot2(t) { // stage: 1 in 10 walks away from the group
  setStageColor('#14213a'); stageMode('ten'); setTen(clamp((t - 3.6) / 1.6), t);
  const u = ease(t / 8); look(lerp(-0.2, 0.3, u), lerp(5.2, 5.0, u), lerp(17, 16, u), 0, 2.4, 0, 50);
  lift(170);
  lonely(30, RED);
  if (t > 3.9) setTop('家族や友人と会って話すことが全くない（2025年）', (countUp(t, 97, 4.1, 1.0) / 10).toFixed(1) + '%', fade(t, 3.9, 8, 0.25), RED);
  return stage;
}
function shot3(t) { // stage: friend time 30h → 10h
  setStageColor('#14213a'); stageMode('bars'); setFBars(clamp(t / 3.2), true);
  look(0, 4.6, 19, 0, 3.6, 0, 50);
  lift(150);
  lonely(30, RED);
  setTop('友人と直接会う時間（米国・2003→2020年）', '3分の1', fade(t, 1.6, 3.9, 0.25), RED);
  return stage;
}
function shot4(t) { // room: heart, then brain
  lift(140);
  bedroom(); stand(t, -0.3, -0.6, 0.15, 0.3);
  marks(fade(t, 0.3, 8.6, 0.4), t > 4.1 ? fade(t, 4.1, 8.6, 0.4) : 0, t);
  roomCam(t, 8.2, [0.5, 1.6, 2.7], [0.4, 1.65, 2.4], [-0.15, 1.4, -0.6]);
  lonely(30, RED);
  if (t < 4.0) setTop('心臓の病気のリスク（米公衆衛生局長官・2023年）', '+' + countUp(t, 29, 0.5, 1.0) + '%', fade(t, 0.3, 4.0, 0.25), RED);
  else setTop('脳卒中のリスク（2023年）', '+' + countUp(t - 4, 32, 0.3, 1.0) + '%', fade(t, 4.0, 8.2, 0.25), RED);
  return room;
}
function shot5(t) { // stage: 15 cigarettes
  setStageColor('#1a1d2a'); stageMode('cig'); setCigs(15 * clamp((t - 0.4) / 3.4));
  const u = ease(t / 9); look(0, lerp(6.0, 6.4, u), lerp(14.5, 13.5, u), 0, 1.6, -0.4, 50);
  lift(170);
  lonely(30, RED);
  if (t < 4.2) setTop('早く亡くなるリスク（つながりがない・2023年）', '+' + countUp(t, 29, 0.5, 1.0) + '%', fade(t, 0.3, 4.2, 0.25), RED);
  else setTop('害の大きさ（最大で・米公衆衛生局長官）', 'たばこ1日15本', fade(t, 4.2, 9, 0.25), RED);
  return stage;
}
function shot6(t) { // stage risk bars → back to the room
  if (t < 4.4) {
    setStageColor('#14213a'); stageMode('risk'); setRBars([1, 1, 1, clamp((t - 0.4) / 1.4)], true);
    look(0, 5.4, 23, 0, 4.0, 0, 50); lift(150);
    lonely(30, RED);
    setTop('認知症のリスク（高齢者・2023年）', '約+50%', fade(t, 0.5, 4.4, 0.25), RED);
    return stage;
  }
  lift(120);
  bedroom('night', { ceil: 1.4, hemi: 0.6, lamp: 1.2 }); stand(t, -0.3, -0.6, 0.25, 0.55);
  roomCam(t - 4.4, 4.4, [-1.5, 1.8, 3.4], [-1.3, 1.75, 3.1]);
  lonely(30, RED);
  return room;
}
function shot7(t) { // result: alone at night, the 15 sticks number
  lift(120);
  bedroom('night', { ceil: 1.4, hemi: 0.6, lamp: 1.2 }); stand(t, -0.3, -0.6, 0.25, 0.55);
  roomCam(t, 7.5, [-1.3, 1.75, 3.1], [0.3, 1.7, 3.6]);
  const a = t < 3.6;
  setTop(a ? '害の大きさ（最大で・2023年）' : '早く亡くなるリスク（2023年）', a ? 'たばこ1日15本' : '+29%', fade(t, 0.15, 7.5, 0.25), RED);
  lonely(30, RED);
  return room;
}
function shot8(t) { // loop: hook framing, no bubbles
  lift(-40);
  bedroom('evening', { ceil: 6, hemi: 0.9, lamp: 1.2 }); stand(t);
  roomCam(t, 4, HOOK_B, HOOK_A);
  lonely(30, RED);
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 10.1, f: shot1 }, { a: 10.1, b: 18.1, f: shot2 }, { a: 18.1, b: 22, f: shot3 },
  { a: 22, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0731',
    v2: true,
    hookLine: 'だれとも、話さなくなった。',
    series: '人体の限界',
    hookType: 'H4',
    cat: '体・健康',
    title: '1か月だれとも話さなかったら？',
    titleHtml: '1か月だれとも<br>話さなかったら？',
    mood: 'emotional', seed: 731, hits: [0.5, 48.1], risers: [30.2], impacts: [14.4, 22.6, 35.0],
    sfx: [[0.5, 'poof']],
    narr: { '米国': 'べいこく', '約4割': 'やく4わり', '9.7%': '9.7パーセント', '29%': '29パーセント', '32%': '32パーセント', '約50%': 'やく50パーセント', '17年': '17ねん', '3分の1': '3ぶんの1', '1日15本': '1日15ほん', '30日': '30にち' },
    ask: '最後にだれかと話したのはいつ？',
    caption: 'もしも1か月、だれとも話さなかったら？\n日本では37.7%（約4割）が、孤独を感じることがあると答えている。同居していない家族や友人と直接会って話すことが全くない人は9.7%（内閣府の全国調査・2025年）。\nアメリカでは、友人と直接会う時間が2003年の月30時間から2020年の月10時間へ、3分の1に減った。\nアメリカの公衆衛生局長官の勧告（2023年）によると、人とのつながりがない状態が続くと、心臓病のリスクは29%、脳卒中は32%、早く亡くなるリスクは29%高くなり、その害は最大でたばこ1日15本と同じくらい。高齢の人では認知症のリスクが約50%増える。\n話すのは、今日からできる。ひとりで抱えこまず、身近な人や相談窓口に話してみて。\n\n最後にだれかと話したのはいつ？ コメントで教えて。\n\n出典：内閣府「孤独・孤立の実態把握に関する全国調査（令和7年）」、U.S. Surgeon General\'s Advisory（2023年）',
    hashtags: ['もしもラボ', '孤独', 'ひとり時間', '健康', '雑学'],
    endStats: [['孤独を感じることがある人', '37.7%', '日本・2025年'], ['会って話すことが全くない人', '9.7%', '日本・2025年'], ['早く亡くなるリスク', '+29%', '2023年'], ['害の大きさ（最大で）', 'たばこ1日15本', '2023年']],
    sources: '出典：内閣府 孤独・孤立の実態把握に関する全国調査（令和7年）、<br>米国公衆衛生局長官の勧告（2023年）',
  },
});
