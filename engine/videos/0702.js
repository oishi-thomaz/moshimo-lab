import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makeQ } from '../lib.js';
import { farm, setFarmEnv, setRice, makeFarmer, farmerWork } from '../scenes/farm.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { makeRodent } from '../scenes/mouselab.js';
import { makeMite } from '../scenes/mites.js';
import { makeSnake, makeGrass } from '../scenes/snake.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも世界中のヘビが絶滅したら？（blueprint no 702・絶滅ボタンシリーズ）
// 数字：
//  ヘビにかまれる人 世界で年約540万人、うち毒が回る人 180万〜270万人、亡くなる人 年8万1,410〜13万7,880人、
//   切断などの後遺症はその約3倍。いちばん被害を受けるのは農業で働く人と子ども
//   （WHO ファクトシート Snakebite envenoming）https://www.who.int/en/news-room/fact-sheets/detail/snakebite-envenoming
//  アジアの米が収穫前に5%ネズミに食べられると約3,000万トン＝1億8,000万人の12か月分
//   （Singleton, Impacts of Rodents on Rice Production in Asia, IRRI Discussion Paper No.45, 2003）
//   https://ageconsearch.umn.edu/record/287607/files/Singleton.pdf
//  ベトナムは毎年、米の生産の約10%をネズミに失う（IRRI 2012年7月31日のニュースリリース）https://www.eurekalert.org/news-releases/848216
//  ネズミなどを食べることで、ガラガラヘビ1匹が1地点で年2,500〜4,500匹のマダニを減らしていた（推計。メリーランド大学 Kabay ほか、米国生態学会 2013年）
//   https://sciencedaily.com/releases/2013/08/130806091815.htm

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- the grass patch by the paddies ----------
const SP = new THREE.Vector3(5.5, 0, 16.5); // snake spot
const PATCH = new THREE.Group(); farm.add(PATCH);
const grass = makeGrass(1100, 12, { x0: 2.0, x1: 9.5, z0: 13.0, z1: 20.5, h: 0.32, hole: [5.5, 16.5, 1.6] }); PATCH.add(grass);
const snake = makeSnake({ len: 2.4, r: 0.08 }); snake.position.copy(SP); snake.rotation.y = -0.9; snake.scale.setScalar(1.5); PATCH.add(snake);
const btn = makeXButton({ label: 'ヘビ絶滅ボタン' }); btn.position.set(5.15, 0, 17.65); btn.scale.setScalar(0.85); PATCH.add(btn);
const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), mat('#8c8a84', { flatShading: true })); rock.position.set(6.9, 0.18, 15.6); rock.scale.set(1.3, 0.6, 1); PATCH.add(rock);
const snakeSpark = makeSparkles(260, 0.07); farm.add(snakeSpark.points);
{ const pts = []; for (let i = 0; i < 30; i++) { const a = i / 30 * 6.28 * 2.1, R = 0.2 + i / 30 * 0.8; pts.push([SP.x + Math.cos(a) * R, 0.15, SP.z + Math.sin(a) * R]); } snakeSpark.init(pts, 0.12, 0.9); }

// ---------- farmers and rats ----------
const farmers = [0, 1].map(i => makeFarmer(rng(30 + i))); farmers.forEach(f => farm.add(f));
const RATS = []; { const r = rng(5); for (let i = 0; i < 30; i++) { const m = makeRodent({ kind: 'rat' }); m.scale.setScalar(0.6); farm.add(m); const lev = i % 3 === 0; RATS.push({ m, x: -9 + r() * 18, z: lev ? -0.2 + r() * 2.2 : -3.5 + r() * 3.2, a: r() * 6.28, s: 0.6 + r() * 0.8, k: r() }); } }
function rats(t, k, run = 1) { RATS.forEach((R, i) => { R.m.visible = R.k < k; if (!R.m.visible) return; const a = R.a + t * 0.25 * R.s * run; R.m.position.set(R.x + Math.cos(a) * 1.2, 0.05, R.z + Math.sin(a) * 0.9); R.m.rotation.y = -a - Math.PI / 2; R.m.userData.anim(t + i, run); }); }
// close-up rat with ticks
const bigRat = makeRodent({ kind: 'rat' }); bigRat.scale.setScalar(0.9); farm.add(bigRat);
const ticks = []; { const P = [[0.15, 0.5, 0.18], [-0.1, 0.52, 0.2], [0.35, 0.56, 0.12], [-0.25, 0.46, 0.22], [0.0, 0.58, -0.1], [0.2, 0.5, -0.2]]; for (const p of P) { const tk = makeMite({ kind: 'tick' }); tk.scale.setScalar(0.55); tk.position.set(...p); tk.rotation.x = -0.6; bigRat.add(tk); ticks.push(tk); } }
const qm = makeQ(); qm.visible = false; farm.add(qm);

function base(env = 'day') {
  setFarmEnv(env); setRice(0.85, env === 'dusk' ? 0.55 : 0.2);
  PATCH.visible = true; snake.visible = false; btn.visible = false; btn.userData.labelOn(false); btn.userData.press(0); btn.userData.hand(0);
  farmers.forEach(f => f.visible = false); rats(0, 0); bigRat.visible = false; snakeSpark.set(0); qm.visible = false;
}

// ---------- stage: people bitten / deaths ----------
const BARS = [['亡くなる人', 13.8, '#e0584a'], ['後遺症', 41, '#c9784a']];
const bars = BARS.map(([l, v, c], i) => makeBar({ color: c, w: 2.2, d: 2.2, label: l, x: -2.6 + i * 5.2, z: 0, nameTop: true }));
function stageMode(m, k = 1) {
  bars.forEach((b, i) => { b.g.visible = m === 'bars'; const kk = clamp(k * 1.4 - i * 0.4); b.setH(BARS[i][1] / 9 * ease(kk), ''); });
}

const SUBS = [
  [2.6, 6.0, 'かまれる人は、もういない。<br>でも怖いのは半年後。'],
  [6.2, 10.1, '世界では毎年、<br>約540万人がヘビにかまれる。'],
  [10.1, 14, 'いちばん多いのは、<br>畑で働く人と子どもだった。'],
  [14.2, 18.1, '亡くなる人は、<br>毎年8万〜14万人。'],
  [18.1, 22, '後遺症はその約3倍。<br>でも本題は次。'],
  [22.2, 26.1, 'ヘビが食べていたのは、<br>田んぼのネズミだった。'],
  [26.1, 30, '食べる側が消えて、<br>ネズミが田んぼを走る。'],
  [30.2, 34.6, 'アジアの米は、<br>もともとネズミに食べられる。'],
  [34.6, 39, 'たった5%で、<br>1億8千万人の1年分の米。'],
  [39.2, 43.6, 'しかも本当に厄介なのは、<br>ネズミについた虫。'],
  [43.6, 47.8, 'ヘビ1匹で、年に数千匹の<br>マダニを減らしていた。'],
  [48.1, 53.8, '結果：かまれる人は消えた。<br>でも、米の番人も消えた。'],
  [53.9, 56.1, 'ヘビは田んぼの番人だった。'],
  [56.2, 59.4, '次に絶滅ボタンを<br>押したい生き物は？'],
];

const TP = 0.5;
function btnState(t) { const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(4.6, 4.65, u), lerp(1.75, 1.7, u), lerp(20.2, 20.0, u), 5.95, 0.45, 16.4, 46); }
function shot0(t) { // hook: snake on the grass, red button in front; pressed at 0.5s
  lift(200); base('day'); btn.visible = true; btnState(t);
  snake.visible = t < TP; snake.userData.pose(t + 2, { coil: 0.55, amp: 0.2, lift: 0.75, speed: 0.6 });
  snakeSpark.set(t >= TP ? (t - TP) / 1.3 : 0); grass.userData.sway(t);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return farm;
}
function shot1(t) { // after the press: empty grass, sparkles still drifting
  lift(220); base('day'); btn.visible = true; btn.userData.press(1); grass.userData.sway(t + 2.5);
  snakeSpark.set((t + 2) / 3.6);
  const u = ease(t / 3.5); look(lerp(3.4, 2.6, u), lerp(2.3, 3.4, u), lerp(20.5, 22.5, u), 5.4, 0.3, 15.5, 48);
  return farm;
}
function shot2(t) { // +1日: farmers working safely in the paddies
  lift(220); base('day'); grass.userData.sway(t);
  farmers.forEach((f, i) => { f.visible = true; f.position.set(-2 + i * 4.5, 0, -5.2 - i * 1.5); f.rotation.y = i ? 2.6 : -2.9; farmerWork(f, t, i); });
  const u = ease(t / 8); look(lerp(2.5, 3.5, u), lerp(3.0, 3.2, u), lerp(4.5, 3.2, u), 0.5, 0.8, -5.5, 50);
  hudTime('+1日');
  if (t < 4.1) setTop('ヘビにかまれる人（世界・1年）', '約' + countUp(t, 540, 0.4, 1.3) + '万人', fade(t, 0.3, 4.1, 0.25), GOLD);
  else setTop('いちばん被害を受ける人（WHO）', '畑で働く人と子ども', fade(t, 4.1, 8, 0.25), GOLD);
  return farm;
}
function shot3(t) { // +1週間: stage — deaths and disabilities
  setStageColor('#1a2238'); lift(330);
  const k = clamp((t - 0.3) / 3.0); stageMode('bars', k);
  const u = ease(t / 8.2); look(lerp(0, 0.3, u), lerp(4.0, 4.3, u), lerp(17, 16, u), 0, 2.8, 0, 50);
  hudTime('+1週間');
  if (t < 4.0) setTop('毒ヘビで亡くなる人（世界・1年）', '8万〜14万人', fade(t, 0.3, 4.0, 0.25), RED);
  else setTop('手足の切断などの後遺症（亡くなる人と比べて）', '約3倍', fade(t, 4.0, 8.2, 0.25), RED);
  return stage;
}
function shot4(t) { // +1か月: dusk, rats start running in the paddy
  lift(220); base('dusk'); grass.userData.sway(t);
  rats(t, 0.25 + 0.35 * clamp(t / 7));
  const u = ease(t / 8); look(lerp(-1.5, -0.5, u), lerp(1.7, 1.9, u), lerp(6.5, 5.8, u), -0.5, 0.2, -1.2, 50);
  hudTime('+1か月');
  setTop('ネズミを食べていた天敵', 'ヘビ', fade(t, 4.0, 8, 0.25), GREEN);
  return farm;
}
function shot5(t) { // +半年: golden paddies full of rats
  lift(220); base('day'); setRice(1, 1); grass.userData.sway(t);
  rats(t, 1);
  farmers[0].visible = true; farmers[0].position.set(0, 0, 0.5); farmers[0].rotation.y = Math.PI; farmers[0].userData.head.rotation.y = Math.sin(t * 1.3) * 0.5;
  qm.visible = t > 4.2; qm.position.set(0, 2.25 + Math.sin(t * 3) * 0.04, 0.5);
  const u = ease(t / 9); look(lerp(2.5, 1.5, u), lerp(3.2, 4.4, u), lerp(7.5, 9.0, u), 0, 0.3, -2.5, 50);
  hudTime('+半年');
  if (t < 4.4) setTop('アジアの米が5%ネズミに食べられると（2003年）', '約3,000万トン', fade(t, 0.3, 4.4, 0.25), GOLD);
  else setTop('それで食べられる人数（12か月分）', '1億8千万人', fade(t, 4.4, 9, 0.25), GOLD);
  return farm;
}
function shot6(t) { // +1年: close-up rat with ticks
  lift(200); base('dusk'); grass.userData.sway(t);
  bigRat.visible = true; bigRat.position.set(4.5, 0, 15.2); bigRat.rotation.y = 0.4; bigRat.userData.anim(t, 0.15);
  ticks.forEach((tk, i) => { tk.visible = t > 0.6 + i * 0.35; tk.userData.anim(t + i, false); });
  const u = ease(t / 8.8); look(lerp(5.6, 5.4, u), lerp(1.3, 1.2, u), lerp(17.6, 17.1, u), 4.55, 0.35, 15.2, 44);
  hudTime('+1年');
  setTop('ガラガラヘビ1匹が減らしていたマダニ（1年・推計）', '2,500〜4,500匹', fade(t, 3.4, 8.8, 0.25), RED);
  return farm;
}
function shot7(t) { // result: wide farm at dusk, rats in the gold paddies, a farmer looking on
  lift(220); base('dusk'); setRice(1, 1); grass.userData.sway(t); rats(t, 1);
  farmers[0].visible = true; farmers[0].position.set(0.3, 0, 0.8); farmers[0].rotation.y = Math.PI; farmers[0].userData.head.rotation.y = 0;
  const u = ease(t / 7.5); look(lerp(3, 4, u), lerp(4.5, 6.5, u), lerp(9.5, 12, u), 0, 0, -3, 50);
  const a = t < 3.6;
  setTop(a ? 'かまれなくなった人（世界・1年）' : 'ネズミが5%食べる米（アジア・2003年）', a ? '約540万人' : '1億8千万人分', fade(t, 0.15, 7.5, 0.25), a ? GREEN : GOLD);
  return farm;
}
function shot8(t) { // loop: same framing as the hook, empty grass and the button
  lift(110); base('day'); btn.visible = true; grass.userData.sway(t);
  hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
  return farm;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22.2, f: shot3 },
  { a: 22.2, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0702',
    v2: true,
    hookLine: '世界中のヘビが、一斉に消えた。',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '生き物・動物',
    title: '世界中のヘビが絶滅したら？',
    titleHtml: '世界中のヘビが<br>絶滅したら？',
    mood: 'tension', seed: 702, hits: [0.5, 48.1], risers: [39.2], impacts: [6.9, 14.6, 35.0, 43.9],
    sfx: [[0.5, 'poof'], [22.4, 'skitter'], [30.4, 'skitter']],
    narr: { '約540万人': 'やく540万人', '8万〜14万人': '8万から14万人', '約3倍': 'やく3ばい', '5%': '5パーセント', '1億8千万人': '1億8千万人', 'ヘビ絶滅ボタン': 'ヘビぜつめつボタン', '540万人減': '540万人げん' },
    ask: '次に絶滅ボタンを押したい生き物は？',
    caption: 'もしも世界中のヘビが一瞬で絶滅したら？\n世界では毎年、約540万人がヘビにかまれ、8万1,410〜13万7,880人が亡くなる。手足の切断などの後遺症はその約3倍。いちばん被害を受けるのは農業で働く人と子ども（WHO）。\nでもヘビは、田んぼや畑のネズミを食べる天敵でもある。アジアの米は収穫前にネズミに食べられていて、5%だけでも約3,000万トン、1億8,000万人の12か月分になる（IRRI 2003年）。\nネズミを食べることで、ガラガラヘビ1匹が1年に2,500〜4,500匹のマダニを減らしていたという推計もある（メリーランド大学 2013年）。\n結果、かまれる人は年540万人減。でも米を守る番人も消えた。\n\n次に絶滅ボタンを押したい生き物は？ コメントで教えて。\n\n出典：WHO ファクトシート Snakebite envenoming、Singleton「Impacts of Rodents on Rice Production in Asia」IRRI（2003年）、メリーランド大学 Kabay ほか 米国生態学会（2013年）',
    hashtags: ['もしもラボ', 'ヘビ', '絶滅', '生態系', '雑学'],
    endStats: [['ヘビにかまれる人（世界・1年）', '約540万人', 'WHO'], ['亡くなる人（1年）', '8万〜14万人', 'WHO'], ['米の5%＝何人の1年分', '1億8千万人', '2003年'], ['ヘビ1匹が減らすマダニ', '2,500〜4,500匹', '推計・2013年']],
    sources: '出典：WHO、IRRI（2003年）、<br>メリーランド大学（米国生態学会 2013年）',
  },
});
