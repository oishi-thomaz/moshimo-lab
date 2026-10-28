import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, randPerson, poseWalk, makeQ, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setClock, setScreen, props, lamp, glow } from '../scenes/room.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { town, setTownEnv } from '../scenes/town.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも1日中座りっぱなしを1年続けたら？（blueprint no 733・人体の限界シリーズ）
// 数字：
//  座って1時間で、脚の大きな動脈の血管の広がる力（FMD）が最大50%低下。1時間ごとに5分歩くと低下しなかった
//   （インディアナ大学 2014年9月の発表／Thosar et al., Med Sci Sports Exerc 47(4):843-849, 2015）
//   https://archive.news.indiana.edu/releases/iu/2014/09/slow-walking-sitting-study.shtml
//  日本人6万4,456人（J-MICC Study、平均7年8か月追跡）：日中に座る時間が2時間増えるごとに死亡率15%上昇。
//   糖尿病がある人は27%、高血圧20%、脂質異常症18%（Koyama et al., J Am Heart Assoc 2021年6月／JST サイエンスポータル 2021年7月5日）
//   https://scienceportal.jst.go.jp/newsflash/20210705_n01/
//  100万人以上・16研究のメタ分析：1日8時間以上座り、体をあまり動かさない人は、最も活動的な人より早死にのリスクが28〜59%高い。
//   1日60〜75分の中くらいの強さの運動（早歩きなど）で、座りすぎの上乗せリスクは見られなくなった。4人に3人はこの量に届いていない
//   （Ekelund et al., The Lancet 2016年7月／ケンブリッジ大学の発表）
//   https://www.cam.ac.uk/research/news/an-hour-of-moderate-exercise-a-day-enough-to-counter-health-risks-from-prolonged-sitting

const BLUE = '#7fd4ff', GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8', PURPLE = '#b9a4ff';

// ---------- you at the office desk ----------
const you = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#e9e4da', pants: '#3b3f4a', tie: true, scale: 1 }); room.add(you);
const U = you.userData;
const legM = U.legs.map(l => l.children[0].material);
const PANTS0 = new THREE.Color('#3b3f4a'), SLOW = new THREE.Color('#5b46c9');
function legSlow(k) { legM.forEach(m => { m.color.copy(PANTS0).lerp(SLOW, k); m.emissive = m.emissive || new THREE.Color(); m.emissive.setRGB(0.12 * k, 0.06 * k, 0.32 * k); }); }
function sitDesk(t) {
  you.visible = true; you.position.set(0, -0.38, -0.35); you.rotation.set(0, Math.PI, 0);
  U.legs.forEach(l => l.rotation.x = -Math.PI / 2); U.arms.forEach((a, i) => { a.rotation.set(-1.1 + Math.sin(t * 9 + i) * 0.04, 0, 0); });
  U.head.rotation.set(0.1, 0, 0);
}
function sitSofa(t) {
  you.visible = true; you.position.set(0.3, -0.42, 0.6); you.rotation.set(0, Math.PI, 0);
  U.legs.forEach(l => l.rotation.x = -Math.PI / 2); U.arms.forEach(a => a.rotation.set(-0.5, 0, 0)); U.head.rotation.set(-0.05, 0, 0);
}
const cow = []; { const r = rng(33); for (const [x, z] of [[-2.6, -2.25], [2.6, -2.25], [-2.6, -0.35], [2.6, -0.35], [0, -2.25], [-2.6, 1.55], [2.6, 1.55]]) { const p = randPerson(r); p.position.set(x, -0.38, z); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms.forEach(a => a.rotation.x = -1.1); room.add(p); cow.push(p); } }
// a glowing "slow blood" marker along the legs
const flow = makeSparkles(70, 0.06, 0x9a86ff); room.add(flow.points);
// wall clock text via setClock (room's clock lives on the nightstand set; we add our own wall clock)
const wc = textSprite('9:00', { w: 256, h: 128, size: 80, bg: 'rgba(20,22,28,.9)', sx: 0.8 }); wc.position.set(-1.3, 2.55, -3.45); room.add(wc);
let SIDE = false;
function office(light, opt, time) {
  setRoom({ sets: ['office'] }); setLight(light, opt); props.sleeper.visible = false;
  cow.forEach(c => c.visible = true); cow[3].visible = !SIDE; wc.visible = false; flow.set(0); glow.intensity = 0;
}
function living(light, opt) {
  setRoom({ sets: ['living'] }); setLight(light, opt); cow.forEach(c => c.visible = false); wc.visible = false; flow.set(0);
  setScreen((g, w, h) => { g.fillStyle = '#2b5a8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#7fb3e0'; g.fillRect(20, 30, w - 40, 60); g.fillStyle = '#f2c14e'; g.fillRect(30, 110, 90, 30); });
}

// ---------- stage: risk bars ----------
const barA = makeBar({ color: '#4fa3d1', w: 2.6, d: 2.0, label: 'よく動く人', x: -2.2, z: 0, nameTop: true });
const barB = makeBar({ color: '#e0584a', w: 2.6, d: 2.0, label: '座りっぱなし', x: 2.2, z: 0, nameTop: true });
const crowdTitle = textSprite('早死にのリスク（100万人以上の分析）', { w: 1024, h: 128, size: 56, sx: 9.5 }); crowdTitle.position.set(0, 9.0, -1); stage.add(crowdTitle);
function setRisk(k) { const a = ease(clamp(k * 1.5)), b = ease(clamp(k * 1.5 - 0.3)); barA.setH(3.4 * a, a > 0.05 ? '基準' : ''); barB.setH(3.4 * (1 + 0.59 * b) * clamp(b * 3), b > 0.05 ? '最大+' + Math.round(59 * b) + '%' : ''); }

// ---------- town: walking ----------
const walker = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#3f8f6b', pants: '#3b3f4a', scale: 1 }); town.add(walker);
const others = []; { const r = rng(9); for (let i = 0; i < 4; i++) { const p = randPerson(r); town.add(p); others.push({ p, z0: -8 + i * 5, s: 0.8 + r() * 0.5, ph: r() * 6 }); } }

const SUBS = [
  [2.6, 6.0, '朝から晩まで、<br>デスクに座りっぱなし。'],
  [6.2, 10.1, '脚だけじゃない。<br>ヤバいのは1年後の数字。'],
  [10.1, 14, '座って1時間。脚の血管の<br>広がる力が、最大で半分に。'],
  [14.2, 18.1, '日本人6万人以上を<br>7年以上追いかけた研究。'],
  [18.1, 22, '座る時間が2時間増えるごとに、<br>死亡率が15%上がった。'],
  [22.2, 26.1, '家でもソファ。持病が<br>あると、さらに悪い。'],
  [26.1, 30, '糖尿病がある人は、<br>2時間ごとに27%上がった。'],
  [30.2, 34.6, '100万人以上を<br>調べた分析では、'],
  [34.6, 39, '8時間以上座って動かない人の<br>早死にリスクは最大59%高い。'],
  [39.2, 43.6, 'でも、1日60〜75分<br>体を動かす人は、'],
  [43.6, 47.8, 'この上乗せのリスクが<br>見られなかった。'],
  [48.1, 53.8, '結果：座りっぱなしが続くと、<br>早死にリスクが最大59%上がる。'],
  [53.9, 56.1, '1日60〜75分動けば帳消し。'],
  [56.2, 59.4, 'あなたは1日<br>何時間座ってる？'],
];

function deskCam(t, d, a, b, tg = [0, 0.8, -0.5]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
const sitClock = (s) => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = Math.floor(s) % 60; return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
function sideCam(t, d, a, b) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0, 0.85, -0.55, 50); }
const TP = 0.5;
// v2：1枚目（サムネ）で顔がタイトルにかからず、青紫になる脚も見えるよう、少し引いて横から
const HOOK_LIFT = -180;
function hookCam(t, d) { const u = ease(t / d); look(lerp(3.85, 3.7, u), lerp(1.4, 1.35, u), lerp(0.75, 0.6, u), 0, 0.72, -0.45, 48); }
function shot0(t) { // hook: the clock since sitting runs fast; legs start to turn purple-blue
  lift(HOOK_LIFT); SIDE = true;
  office('day', { ceil: 6, hemi: 1.05 }, '9:00'); sitDesk(t);
  // v2：0.5秒で 座ってから1時間 に届き、脚が一気に青紫に（冒頭で待たせない）
  const sec = t < TP ? Math.pow(t / TP, 2) * 3600 : 3600 + (t - TP) * 60; legSlow(clamp((t - TP) / 0.3) * 0.7);
  if (t > TP) { if (!flow.ok) { flow.init([[-0.12, 0.5, 0.1], [0.12, 0.5, 0.1], [0, 0.5, 0.4]], 0.2, 0.3); flow.ok = true; } flow.set(((t - TP) % 1.2) / 1.2); }
  el.flash.style.opacity = t >= TP ? 0.4 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t, 2.5);
  setHud('座ってから', sitClock(sec), 1, { mono: true, color: t >= TP ? '#b9a4ff' : '#fff' });
  return room;
}
function shot1(t) { // everyday: the whole office sitting
  lift(200); SIDE = false;
  office('day', { ceil: 6, hemi: 1.05 }, '9:30'); sitDesk(t + 2); legSlow(0);
  deskCam(t, 3.5, [-2.4, 3.0, 3.6], [-2.0, 2.9, 3.2], [0, 0.8, -1.0]);
  setHud('座ってから', sitClock(1800 + t * 60), 1, { mono: true });
  return room;
}
function shot2(t) { // +1時間: close on the legs, they turn blue-purple
  lift(120); SIDE = true;
  office('day', { ceil: 6, hemi: 1.05 }, '10:00'); sitDesk(t + 4); legSlow(lerp(0.7, 0.85, clamp(t / 4))); // v2：冒頭で青紫になった脚の続き
  if (!flow.ok2) { flow.init([[-0.12, 0.5, 0.1], [0.12, 0.5, 0.1], [-0.12, 0.3, 0.5], [0.12, 0.3, 0.5]], 0.15, 0.25); flow.ok2 = true; } flow.set((t % 1.6) / 1.6);
  sideCam(t, 8, [3.1, 1.5, 0.7], [2.6, 1.3, 0.3]);
  hudTime('+1時間');
  setTop('座って1時間の、脚の血管の広がる力（2014年）', '最大' + countUp(t, 50, 4.2, 1.0) + '%低下', fade(t, 4.1, 8, 0.25), PURPLE);
  return room;
}
function shot3(t) { // +1日: evening office, everyone still sitting
  lift(200); SIDE = false;
  office('evening', { ceil: 10, hemi: 0.8 }, '19:00'); sitDesk(t); legSlow(0.85);
  U.head.rotation.x = 0.25 + Math.sin(t * 0.8) * 0.05;
  deskCam(t, 8, [2.6, 2.8, 3.4], [2.2, 2.7, 3.0], [0, 0.8, -1.0]);
  hudTime('+1日');
  setTop('座る時間が2時間増えるごとの死亡率（2021年）', '+' + countUp(t, 15, 4.2, 1.0) + '%', fade(t, 4.1, 8, 0.25), RED);
  return room;
}
function sofaCam(t, d) { const u = ease(t / d); look(lerp(-2.3, -1.8, u), lerp(1.9, 1.8, u), lerp(-2.2, -2.5, u), 0.6, 0.85, 0.6, 52); }
function shot4(t) { // +1か月: home, sitting on the sofa watching TV
  lift(160);
  living('night', { ceil: 4, hemi: 0.7, lamp: 1.2 }); lamp.position.set(-2.6, 1.6, 0.2); glow.intensity = 0.6; glow.color.set('#9fd0ff'); glow.position.set(0.6, 1.2, -0.5);
  sitSofa(t); legSlow(0.85);
  sofaCam(t, 8);
  hudTime('+1か月');
  setTop('糖尿病がある人（2時間ごとの死亡率・2021年）', '+' + countUp(t, 27, 4.0, 1.0) + '%', fade(t, 3.9, 8, 0.25), RED);
  return room;
}
function shot5(t) { // +1年: stage, risk bars
  setStageColor('#1b1630'); setRisk(clamp((t - 0.3) / 4.5));
  const u = ease(t / 9.2); look(lerp(0, 0.3, u), lerp(4.6, 5.0, u), lerp(26, 24.5, u), 0, 4.2, 0, 50);
  lift(330);
  hudTime('+1年');
  setTop('1日8時間以上座り、動かない人の早死にリスク（2016年）', '最大+' + countUp(t, 59, 4.4, 1.2) + '%', fade(t, 4.3, 9.2, 0.25), RED);
  return stage;
}
function shot6(t) { // twist set-up: walking outside, 60-75 minutes
  setTownEnv('day');
  const wz = 3 - t * 1.2; walker.position.set(4.3, 0, wz); walker.rotation.y = Math.PI; poseWalk(walker, t * 7, 1);
  others.forEach((o, i) => { o.p.position.set(-4.3 + (i % 2) * 0.6, 0, o.z0 + (i % 2 ? 1 : -1) * t * o.s); o.p.rotation.y = i % 2 ? 0 : Math.PI; poseWalk(o.p, t * 6 + o.ph, 0.7); });
  const u = ease(t / 8.8); look(lerp(7.4, 7.0, u), lerp(2.2, 2.5, u), wz + lerp(7.5, 6.0, u), 4.3, 1.1, wz - 0.5, 50);
  lift(200);
  setHud('上乗せが消えた運動', '1日', 1);
  setTop('早歩きくらいの運動（1日・2016年）', '60〜75分', fade(t, 0.3, 8.8, 0.25), GREEN);
  return town;
}
function shot7(t) { // result: night office, you alone still sitting
  lift(200); SIDE = false;
  office('night', { ceil: 9, hemi: 0.55 }, '22:00'); cow.forEach(c => c.visible = false); sitDesk(t); legSlow(0.85);
  U.head.rotation.x = 0.3;
  deskCam(t, 7.5, [2.0, 2.0, 2.4], [2.6, 2.6, 3.4], [0, 0.8, -0.6]);
  const a = t < 3.6;
  setTop(a ? '1日8時間以上座り、動かない人の早死にリスク' : 'リスクの上乗せが消えた運動（1日）', a ? '最大+59%' : '60〜75分', fade(t, 0.15, 7.5, 0.25), a ? RED : GREEN);
  return room;
}
function shot8(t) { // loop: back to 9:00, sitting down again
  lift(HOOK_LIFT); SIDE = true;
  office('day', { ceil: 6, hemi: 1.05 }, '9:00'); sitDesk(t); legSlow(0);
  hookCam(t + 0.4, 4.5); // v2：冒頭（サムネ）と同じ構図に戻してループ
  setHud('座ってから', sitClock(0), 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：朝のオフィス（元の2.5〜6秒）を抜いて、1時間たった脚から本題へ
  meta: {
    id: '0733',
    v2: true,
    hookLine: '座ってたった1時間で、脚に異変。',
    series: '人体の限界',
    hookType: 'H4',
    cat: '体・健康',
    title: '1日中座りっぱなしを1年続けたら？',
    titleHtml: '1日中座りっぱなしを<br>1年続けたら？',
    mood: 'tension', seed: 733, hits: [0.5, 48.1], risers: [30.2], impacts: [10.6, 19.0, 35.0],
    sfx: [[0.5, 'meter', 0.5]],
    narr: { '50%': '50パーセント', '15%': '15パーセント', '27%': '27パーセント', '59%': '59パーセント', '60〜75分': '60から75分', '6万人': '6万人' },
    ask: 'あなたは1日何時間座ってる？',
    caption: 'もしも1日中座りっぱなしの生活を1年続けたら、体はどうなる？\n座って1時間で、脚の動脈の血管の広がる力は最大50%落ちた（2014年の実験。1時間ごとに5分歩くと落ちなかった）。\n日本人6万4,456人を平均7年8か月追いかけた研究では、日中に座る時間が2時間増えるごとに死亡率が15%上昇。糖尿病がある人は27%上がった（2021年）。\n100万人以上を調べた分析では、1日8時間以上座って体をあまり動かさない人は、早死にのリスクが最大59%高かった。でも、1日60〜75分の早歩きくらいの運動をしている人は、この上乗せが見られなかった（2016年）。\n※ 研究の結果をもとにした説明で、個人の病気の予測ではありません。\n\nあなたは1日何時間座ってる？ コメントで教えて。\n\n出典：Thosar ほか（インディアナ大学 2014年）、J-MICC Study（J Am Heart Assoc 2021年）、Ekelund ほか The Lancet（2016年）',
    hashtags: ['もしもラボ', '座りすぎ', 'デスクワーク', '健康', '雑学'],
    endStats: [['座って1時間の脚の血管', '最大50%低下', '2014年'], ['座る時間+2時間ごとの死亡率', '+15%', '2021年'], ['糖尿病がある人', '+27%', '2021年'], ['8時間以上座り動かない人', '最大+59%', '2016年'], ['上乗せが消えた運動', '1日60〜75分', '2016年']],
    sources: '出典：インディアナ大学（2014年）、<br>J Am Heart Assoc（2021年）、The Lancet（2016年）',
  },
});
