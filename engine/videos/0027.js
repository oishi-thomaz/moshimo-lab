import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, randPerson, poseWalk, SKIN, HAIR } from '../lib.js';
import { town, setTownEnv } from '../scenes/town.js';
import { japan, setDots, setMapEnv } from '../scenes/japan.js';
import { stage, makeBar, makeLabel } from '../scenes/stage.js';
import { makeDog, dogPose, dogWalk, dogIdle, neckPos, handPos, makeCollar, dropCollar, makeLeash, makeDogHouse, makeHarness } from '../scenes/dog.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界から犬が全部消えたら？
// 世界の犬の総数は確かな一次資料がないので使わない。数字は日本のものだけ。
// 数字：
//   犬の推計飼育頭数 6,820千頭（約682万頭）・世帯飼育率 8.50%（2025年）、2013年の世帯飼育率 12.85%、各年の世帯飼育率 2013〜2025
//     （一般社団法人ペットフード協会「令和7年（2025年）全国犬猫飼育実態調査」主要指標 時系列サマリー https://petfood.or.jp/pdf/data/2025/3.pdf ）
//   12軒に1軒 = 1 ÷ 8.50% ≒ 11.8（推計・このファイルで計算）
//   身体障害者補助犬の実働頭数（令和8年4月現在）：盲導犬 744頭・介助犬 54頭・聴導犬 51頭 → 合計 849頭（計算）
//     （厚生労働省 社会・援護局障害保健福祉部「身体障害者補助犬実働頭数（都道府県別）」 https://www.mhlw.go.jp/content/12200000/001717895.pdf ）
//   犬を飼っている高齢者は、飼育経験がない人に比べ要介護認知症の発症リスクが48%低い（オッズ比0.52、95%CI 0.27–0.98）。自宅在住高齢者11,224名を7.5年追跡
//     （国立環境研究所・東京都健康長寿医療センター研究所・東京大学、International Journal of Environmental Research and Public Health 2026年7月、プレスリリース 2026年8月18日 https://digitalpr.jp/r/141370 ）
// 流れ：犬が消える → 家の数 → 補助犬の利用者が支えを失う → 高齢の飼い主の認知症の守りが消える → 結果（人への影響を言い切る）
// 犬が消えたあとの因果（ネズミ・防犯など）は確かな数字がないので扱わない。消えた犬は戻らない。

const ORANGE = '#ffb46b', GREEN = '#7ff0c8';
// ---------- town: owner + dog on the walk ----------
const owner = makePerson({ skin: SKIN[0], hair: HAIR[2], shirt: '#4fa3d1', pants: '#2b3346', long: true, scale: 1 });
town.add(owner);
const dog = makeDog({ kind: 'shiba', coat: 'tan', scale: 1.15 }); town.add(dog);
const leash = makeLeash('#d9443a'); town.add(leash.mesh);
const collar = makeCollar('#d9443a'); town.add(collar);
const spark = makeSparkles(220, 0.08); town.add(spark.points);
// other walkers with dogs on the far sidewalk
const OTHERS = [];
{
  const r = rng(27);
  const kinds = [['lab', 'cream'], ['small', 'white'], ['shiba', 'black'], ['lab', 'black'], ['small', 'brown']];
  for (let i = 0; i < 5; i++) {
    const p = randPerson(r); town.add(p);
    const [kind, coat] = kinds[i];
    const d = makeDog({ kind, coat, scale: 1.1 }); town.add(d);
    const l = makeLeash(['#3a7bd5', '#f2c14e', '#7a4fc9', '#3f8f6b', '#e05a4f'][i]); town.add(l.mesh);
    const c = makeCollar(['#3a7bd5', '#f2c14e', '#7a4fc9', '#3f8f6b', '#e05a4f'][i]); town.add(c);
    OTHERS.push({ p, d, l, c, x: -3.7 + (i % 2) * 0.4, z0: 7 + i * 2.6, sp: 0.9 + r() * 0.3, dir: i % 2 ? 1 : -1 });
  }
}
const sparkB = makeSparkles(400, 0.09); town.add(sparkB.points);
// guide-dog user at the corner
const walker = makePerson({ skin: SKIN[1], hair: HAIR[4], shirt: '#59606e', pants: '#3b3f4a', scale: 1 }); town.add(walker);
const harness = makeHarness(); town.add(harness);
// doghouse in a yard
const house = makeDogHouse('#b5543c'); house.position.set(6.1, 0, 10.6); house.rotation.y = -Math.PI / 2; house.scale.setScalar(1.15); town.add(house);
const bowl = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.08, 16), mat('#4fa3d1')); b.position.y = 0.04; bowl.add(b); } bowl.position.set(5.4, 0.12, 9.7); town.add(bowl);

const crosswalk = new THREE.Group(); { const m = mat('#eef0f2'); for (let i = 0; i < 6; i++) { const b = box(0.5, 0.02, 4.4, m); b.castShadow = false; b.position.set(1.6 + i * 1.0, 0.045, 0); crosswalk.add(b); } } town.add(crosswalk);
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const X = 4.25; // owner walks on the sidewalk x≈4.25 toward -z
function placeOwner(z, walking, phase) {
  owner.position.set(X, 0, z); owner.rotation.y = Math.PI; // facing -z
  if (walking) poseWalk(owner, phase, 1); else poseWalk(owner, 0, 0);
  owner.position.y = walking ? owner.position.y + 0.12 : 0.12;
  owner.userData.arms[1].rotation.x = -0.35; // leash hand forward
}
function placeDog(d, x, z, walking, phase, rotY = Math.PI) {
  d.visible = true; d.position.set(x, 0.12, z); d.rotation.y = rotY;
  dogPose(d, 'stand'); if (walking) dogWalk(d, phase, 1); else dogIdle(d, phase);
}
function tieLeash(l, p, d, sag = 0.12) { handPos(p, _a); neckPos(d, _b); l.mesh.visible = true; l.set(_a, _b, sag); }
// leash after the dog vanished: hangs from the hand to the ground
function limpLeash(l, p, gx, gz) { handPos(p, _a); _b.set(gx, 0.14, gz); l.mesh.visible = true; l.set(_a, _b, 0.05); }

// scene state for the walk: k = 0 (dog there) .. vanish at tv
function walkScene(t, T, { tv = 99, z0 = 15, speed = 1.0, env = 'day', others = false } = {}) {
  setTownEnv(env); owner.visible = true; crosswalk.visible = false;
  const gone = t >= tv;
  const zt = gone ? z0 - speed * tv : z0 - speed * t; // owner stops when the dog vanishes
  placeOwner(zt, !gone, t * 7);
  const dz = zt - 1.25, dx = X - 0.55;
  if (!gone) { placeDog(dog, dx, dz, true, t * 9); tieLeash(leash, owner, dog); collar.visible = false; }
  else {
    dog.visible = false;
    const fall = clamp((t - tv) / 0.35);
    collar.visible = true; dropCollar(collar, dx, dz, lerp(0.55, 0.15, fall * fall));
    limpLeash(leash, owner, dx, dz);
  }
  spark.init([[dx, 0.5, dz]], 0.5, 0.9); spark.set(gone ? clamp((t - tv) / 1.4) : 0);
  // others
  OTHERS.forEach((o, i) => {
    const vis = others; o.p.visible = vis; o.d.visible = vis && !gone; o.l.mesh.visible = vis; o.c.visible = vis && gone;
    if (!vis) return;
    const tt = gone ? tv : t;
    const z = o.z0 + o.dir * o.sp * tt;
    o.p.position.set(o.x, 0.12, z); o.p.rotation.y = o.dir > 0 ? 0 : Math.PI;
    if (!gone) poseWalk(o.p, t * 7 + i, 1); else poseWalk(o.p, 0, 0);
    o.p.position.y += 0.12; o.p.userData.arms[1].rotation.x = -0.35;
    const ddz = z + o.dir * 1.15, ddx = o.x + 0.5 * (o.dir > 0 ? -1 : 1);
    if (!gone) { placeDog(o.d, ddx, ddz, true, t * 9 + i, o.dir > 0 ? 0 : Math.PI); tieLeash(o.l, o.p, o.d); }
    else { dropCollar(o.c, ddx, ddz, lerp(0.5, 0.15, clamp((t - tv) / 0.35))); limpLeash(o.l, o.p, ddx, ddz); }
  });
  if (others) { sparkB.init(OTHERS.map(o => [o.x + (o.dir > 0 ? -0.5 : 0.5), 0.5, o.z0 + o.dir * o.sp * tv + o.dir * 1.15]), 0.6, 1.0); sparkB.set(gone ? clamp((t - tv) / 1.4) : 0); }
  else sparkB.set(0);
  walker.visible = false; harness.visible = false;
  return zt;
}

// ---------- map: dog households ----------
const DOG_RATE = 0.085; // 犬の世帯飼育率 2025年
function houseDots(t) {
  const pop = easeOut(clamp((t - 0.6) / 1.2));
  const gone = clamp((t - 3.6) / 1.8);
  setDots((i, x, z, q) => {
    if (q < DOG_RATE) {
      const k = clamp(gone * 1.4 - q * 4);
      return { color: k > 0.5 ? '#5d6675' : '#ffb46b', s: lerp(1, 1.9, pop) * (1 - 0.35 * k), y: 0 };
    }
    return { color: '#e8edf3', s: 0.85 };
  });
}

// ---------- stage: assistance dogs (bars) ----------
const HA = 4.6 / 744;
const barGuide = makeBar({ color: '#f2c14e', label: '盲導犬', x: -2.7, w: 1.8, d: 1.8, nameTop: true });
const barServ = makeBar({ color: '#4fa3d1', label: '介助犬', x: 0, w: 1.8, d: 1.8, nameTop: true });
const barHear = makeBar({ color: '#7ff0c8', label: '聴導犬', x: 2.7, w: 1.8, d: 1.8, nameTop: true });
const helpBars = [barGuide, barServ, barHear];
const barSpark = makeSparkles(300, 0.3); stage.add(barSpark.points);
barSpark.init([[-2.7, 1, 0], [-2.7, 2.5, 0], [-2.7, 4, 0], [0, 0.6, 0], [2.7, 0.6, 0]], 1.6, 2.5);
// ---------- stage: dementia risk, older adults (never owned = 100 → dog owners 52) ----------
const HD = 4.6 / 100;
const barNever = makeBar({ color: '#8a96ab', label: '飼ったことがない', x: -2.0, w: 2.2, d: 2.2, nameTop: true });
const barOwner = makeBar({ color: '#ffb46b', label: '犬を飼っている', x: 2.0, w: 2.2, d: 2.2, nameTop: true });
const riskSpark = makeSparkles(260, 0.3); stage.add(riskSpark.points);
riskSpark.init([[2.0, 2.6, 0], [2.0, 3.6, 0], [2.0, 4.4, 0]], 1.4, 2);
const riskGroup = [barNever.g, barOwner.g, riskSpark.points];
function stageMode(m) { helpBars.forEach(b => { b.g.visible = m === 'help'; }); riskGroup.forEach(g => { g.visible = m === 'risk'; }); if (m !== 'help') barSpark.set(0); }

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの朝の散歩。'],
  [6.2, 10.1, '世界中の犬が、<br>一瞬で消えた。'],
  [10.1, 14, '日本の飼い犬だけで、<br>約682万頭。'],
  [14.2, 18.1, '犬がいた家は、<br>全体の8.50%。'],
  [18.1, 22, 'だいたい、<br>12軒に1軒（推計）'],
  [22.2, 26.1, '盲導犬と歩いていた人が、<br>交差点で立ち止まる。'],
  [26.1, 30, '盲導犬は744頭。<br>744人が、歩く目を失った。'],
  [30.2, 34.6, '介助犬54頭、聴導犬51頭。<br>手と耳の代わりも消えた。'],
  [34.6, 39, '849人が、<br>毎日の支えを失った。'],
  [39.2, 43.6, '犬を飼う高齢者は、<br>認知症のリスクが48%低い。'],
  [43.6, 47.8, 'その守りも、<br>犬といっしょに消えた。'],
  [48.1, 52.6, '結果：補助犬849頭の支えと、<br>認知症の守りが消えた。'],
  [52.6, 55.4, '散歩道には、<br>首輪だけが残った。'],
  [55.6, 59.4, 'あなたの家に犬、<br>いる？いた？'],
];

const TV0 = 1.2; // the dog vanishes in the hook
function shot0(t, T) { // hook: the dog vanishes on the walk, collar drops
  walkScene(t, T, { tv: TV0, z0: 15, speed: 1.0 });
  el.flash.style.opacity = t >= TV0 ? 0.45 * Math.max(0, 1 - (t - TV0) / 0.3) : 0;
  const u = ease(t / 2.5);
  look(lerp(1.5, 1.7, u), 2.3, lerp(7.0, 7.3, u), 3.9, 1.5, 13.6, 50);
  el.title.style.opacity = 1;
  return town;
}
function shot1(t, T) { // rewind: the usual walk
  const zt = walkScene(t, T, { z0: 16.5, speed: 1.0 });
  el.title.style.opacity = clamp(1 - (t - 0.6) / 0.5);
  const u = ease(t / 3.5);
  look(lerp(1.0, 1.5, u), 2.2, zt - 6.2, X - 0.3, 0.5, zt - 0.4, 50);
  return town;
}
function shot2(t, T) { // +0s: every dog on the street vanishes
  const zt = walkScene(t, T, { tv: 0.6, z0: 12.5, speed: 1.0, others: true });
  el.flash.style.opacity = t >= 0.6 ? 0.45 * Math.max(0, 1 - (t - 0.6) / 0.3) : 0;
  lift(200);
  const u = ease(t / 8);
  look(lerp(0.5, -0.5, u), lerp(5.6, 6.0, u), lerp(-7.5, -8.5, u), 0, 0.6, 12, 50);
  hudTime('+0秒');
  setTop('日本の飼い犬（2025年）', '約' + Math.max(1, countUp(t, 682, 0.7)) + '万頭', fade(t, 0.7, 8, 0.25));
  return town;
}
function shot3(t, T) { // +1min: households on the map
  setMapEnv('day'); houseDots(t);
  const u = ease(t / 8);
  lift(240); look(lerp(-10, -4, u), lerp(190, 170, u), lerp(70, 60, u), -6, 0, -10, 50);
  hudTime('+1分');
  if (t < 4) setTop('犬を飼っていた世帯の割合（2025年）', (countUp(t, 850, 0.3, 1.4) / 100).toFixed(2) + '%', fade(t, 0.15, 4, 0.2));
  else setTop('犬がいた家（2025年・推計）', '約12軒に1軒', fade(t, 4, 8, 0.2));
  return japan;
}
function shot4(t, T) { // +1hour: guide-dog user stopped at the corner, harness on the ground
  setTownEnv('day'); walkScene(0, 0, {}); owner.visible = false; dog.visible = false; leash.mesh.visible = false; collar.visible = false;
  crosswalk.visible = true; walker.visible = true; walker.position.set(X, 0.12, 5.6); walker.rotation.y = Math.PI; poseWalk(walker, 0, 0); walker.position.y = 0.12;
  walker.userData.arms[0].rotation.x = -0.25 * Math.sin(Math.min(1, t / 2) * Math.PI);
  walker.userData.head.rotation.y = Math.sin(t * 0.9) * 0.35;
  harness.visible = true; harness.scale.setScalar(1.6); harness.position.set(X - 0.6, 0.2, 4.7); harness.rotation.set(0, 0.6, Math.PI / 2 - 0.15);
  owner.visible = false;
  lift(200);
  const u = ease(t / 8);
  look(lerp(1.2, 1.6, u), lerp(2.6, 2.8, u), lerp(-2.6, -2.0, u), X - 0.4, 1.0, 4.6, 50);
  hudTime('+1時間');
  setTop('全国の盲導犬（2026年4月）', countUp(t, 744, 0.3, 1.4) + '頭', fade(t, 0.15, 8, 0.25));
  return town;
}
function shot5(t, T) { // +1day: assistance dogs as bars, then they vanish
  lift(170); stageMode('help');
  const grow = easeOut(clamp((t - 0.2) / 1.4));
  const k = 1 - easeOut(clamp((t - 6.0) / 1.2));
  barGuide.setH(744 * HA * grow * k, k > 0.02 ? Math.round(744 * grow * k) + '頭' : '');
  barServ.setH(Math.max(54 * HA, 0.35) * grow * k, k > 0.02 ? Math.round(54 * grow * k) + '頭' : '');
  barHear.setH(Math.max(51 * HA, 0.33) * grow * k, k > 0.02 ? Math.round(51 * grow * k) + '頭' : '');
  barSpark.set(clamp((t - 6.0) / 1.8));
  const u = ease(t / 9.2);
  look(lerp(-0.6, 0.6, u), lerp(5.0, 4.8, u), lerp(20, 19.5, u), 0, 2.6, 0, 50);
  hudTime('+1日');
  if (t < 4.4) setTop('介助犬と聴導犬（2026年4月）', countUp(t, 105, 0.3, 1.2) + '頭', fade(t, 0.15, 4.4, 0.2), '#7fd4ff');
  else setTop('補助犬の合計（2026年4月）', countUp(t - 4.4, 849, 0.1, 1.2) + '頭', fade(t, 4.4, 9.2, 0.2), '#ffe08a');
  return stage;
}
function shot6(t, T) { // +1month: dementia risk — dog owners 48% lower, then the gap closes as the dogs are gone
  lift(200); stageMode('risk');
  const g = easeOut(clamp((t - 0.2) / 1.6));
  const lose = easeOut(clamp((t - 5.6) / 1.6));
  barNever.setH(100 * HD * g, g > 0.05 ? '100' : '');
  const v = 52 + 48 * lose;
  barOwner.setH(v * HD * g, g > 0.05 ? (lose > 0.02 ? '' : String(Math.round(52 * g))) : '');
  const ol = lose > 0.5 ? '犬が消えたあと' : '犬を飼っている';
  if (barOwner.label.userData.cur !== ol) { barOwner.label.userData.set(ol); barOwner.label.userData.cur = ol; }
  riskSpark.set(clamp((t - 5.6) / 1.8));
  const u = ease(t / 8.8);
  look(lerp(-0.5, 0.5, u), lerp(5.0, 4.8, u), lerp(19, 18.5, u), 0, 2.6, 0, 50);
  hudTime('+1か月');
  if (t < 4.4) setTop('要介護認知症のリスク（犬を飼う高齢者）', countUp(t, 48, 0.3, 1.2) + '%低い', fade(t, 0.15, 4.4, 0.2), ORANGE);
  else setTop('犬が消えたあと（推計）', '48%の差が0に', fade(t, 4.4, 8.8, 0.2), ORANGE);
  return stage;
}
function shot7(t, T) { // result: evening, owner with the limp leash, empty doghouse, collar on the path
  walkScene(10, 0, { tv: 0, z0: 13.2, speed: 1.0, env: 'dusk' });
  spark.set(0);
  const u = ease(t / 7.5);
  lift(150);
  look(lerp(0.4, 0.7, u), lerp(2.6, 2.8, u), lerp(6.4, 6.0, u), 4.6, 1.1, 12.0, 50);
  if (t < 4.4) setTop('支えを失った補助犬の利用者（推計）', '約' + countUp(t, 849, 0.2, 1.2) + '人', fade(t, 0.15, 4.4, 0.2), '#ffe08a');
  else setTop('認知症リスクの差（犬を飼う高齢者）', '48%低かった', fade(t, 4.4, 7.5, 0.2), ORANGE);
  return town;
}
function shot8(t, T) { // loop: hook framing, the dog is gone
  walkScene(10, 0, { tv: TV0, z0: 15, speed: 1.0 }); spark.set(0);
  const u = ease(t / 4);
  look(lerp(1.6, 1.7, u), 2.3, lerp(7.2, 7.3, u), 3.9, 1.5, 13.6, 50);
  return town;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0027',
    title: '世界から犬が全部消えたら？',
    titleHtml: '世界から犬が<br>全部消えたら？',
    mood: 'emotional', seed: 27, hits: [1.2, 6.6, 48.1], risers: [6.0, 46.0],
    impacts: [10.1, 26.1, 39.2, 48.1],
    ask: 'あなたの家に犬、いる？いた？',
    narr: { '12軒に1軒（推計）': '12軒に1軒', '12.85%': '12.85パーセント', '8.50%': '8.5パーセント', '0%': 'ゼロパーセント', '48%': '48パーセント' },
    caption: 'もしも世界から犬が一瞬で全部消えたら？\n\n日本の飼い犬だけで約682万頭（2025年）。犬がいた家は8.50%、だいたい12軒に1軒（推計）。\n\n盲導犬744頭・介助犬54頭・聴導犬51頭、あわせて849頭の補助犬も消える（2026年4月）。目や手や耳の代わりに毎日を支えていた相棒が、一晩でいなくなる。\n\nさらに、犬を飼っている高齢者は、飼ったことがない人より要介護の認知症になるリスクが48%低いという研究も（約1万1,200人を7.5年追跡・2026年発表）。\n\n結果：補助犬849頭の支えと、高齢の飼い主の認知症の守りが消えた。散歩道には首輪だけが残る。\n\nあなたの家に犬、いる？いた？ コメントで教えて。\n\n出典：一般社団法人ペットフード協会 令和7年（2025年）全国犬猫飼育実態調査、厚生労働省 身体障害者補助犬実働頭数（令和8年4月現在）、国立環境研究所・東京都健康長寿医療センター研究所ほか International Journal of Environmental Research and Public Health（2026年）',
    hashtags: ['もしもラボ', '犬', '犬のいる暮らし', '盲導犬', '雑学'],
    endStats: [['日本の飼い犬', '約682万頭', '2025年'], ['犬がいた世帯', '8.50%', '約12軒に1軒'], ['消えた補助犬', '849頭', '盲導犬744頭ほか'], ['犬を飼う高齢者の認知症リスク', '48%低い', '2026年発表']],
    sources: '出典：ペットフード協会 全国犬猫飼育実態調査（2025年）、<br>厚生労働省 身体障害者補助犬実働頭数（2026年4月現在）、<br>国立環境研究所ほか IJERPH（2026年）',
  },
});
