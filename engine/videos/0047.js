import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setScreen, props, lamp } from '../scenes/room.js';
import { stage, makeBar, makeCoins, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも毎月3万円を30年積み立て続けたら？（blueprint no 47・お財布のもしもシリーズ）
// ※ 特定の商品はすすめない。年3%は仮定の利回りで、将来の運用成果を保証するものではない（投資助言ではない）
// 数字：
//  試算の方法は金融庁 NISA特設サイトの資料と同じ（年3%を月の複利に直して、毎月末に積み立て。手数料・税は考えない）
//   金融庁の例：月3万円・40年・年3% → 元本1,440万円・約2,752万円（同じ計算式で再現できることを確認）
//   この動画：月3万円 → 1年 元本36万円／10年 元本360万円・約418万円（4,183,440円）／20年 元本720万円・約981万円（9,805,633円）／
//            30年 元本1,080万円・約1,736万円（17,361,391円）。増えた分 約656万円、元本の約1.6倍（いずれも試算）
//   1日あたり 3万円÷30日＝1,000円（単純計算）
//  NISA つみたて投資枠：年間投資枠120万円、非課税保有限度額1,800万円（総枠）、非課税保有期間は無期限（金融庁「NISAを知る」2024年6月）
//   https://www.fsa.go.jp/policy/nisa2/about/nisa2024/slide_202406.pdf
//  ふつうの口座なら利益に20.315%（所得税・復興特別所得税15.315%＋住民税5%）。約656万円×20.315%＝約133万円（単純計算）
//   https://www.city.yamaguchi.lg.jp/uploaded/attachment/42350.pdf

const BLUE = '#7fd4ff', GOLD = '#ffd27a', GREEN = '#7ff0c8';
const YEN = 0.0042; // 1万円 = 0.004 units of height

// ---------- stage: coins (hook) ----------
const STACKS = []; { const r = rng(5); for (let i = 0; i < 9; i++) { const c = makeCoins(-4 + (i % 5) * 2 + (i > 4 ? 1 : 0), i > 4 ? 1.6 : -0.6, 40); STACKS.push({ c, k: r() }); } }
function setStacks(k) { STACKS.forEach((s, i) => { s.c.g.visible = true; s.c.setN(Math.floor(clamp(k * 1.25 - s.k * 0.25) * 40)); }); }
function hideStacks() { STACKS.forEach(s => s.c.g.visible = false); }
// ---------- stage: stacked bars (principal + gain) ----------
const COLS = [['10年後', 360, 418], ['20年後', 720, 981], ['30年後', 1080, 1736]];
const cols = COLS.map(([lab, p, v], i) => {
  const x = -3.0 + i * 3.0;
  const base = makeBar({ color: '#4fa3d1', w: 2.0, d: 2.0, label: '', x, z: 0 });
  const gain = makeBar({ color: '#e8b84a', w: 2.0, d: 2.0, label: '', x, z: 0 });
  const tag = textSprite(lab, { w: 512, h: 128, size: 64, sx: 2.6 }); tag.position.set(x, 0, 1.4); stage.add(tag);
  return { base, gain, tag, p, v };
});
function setCols(n, k) { // n columns fully shown, column n grows with k
  cols.forEach((c, i) => {
    const on = i < n || (i === n && k > 0); const kk = i < n ? 1 : i === n ? ease(clamp(k)) : 0;
    const hp = c.p * YEN * kk, hg = (c.v - c.p) * YEN * clamp(kk * 1.4 - 0.4);
    c.base.g.visible = on; c.gain.g.visible = on && hg > 0.01; c.tag.visible = on;
    c.base.setH(hp, ''); c.gain.g.position.y = 0.3 + hp; c.gain.setH(hg, on && kk > 0.95 ? '約' + c.v.toLocaleString('en-US') + '万' : '');
    c.tag.position.y = 0.55;
  });
}
const legend = textSprite('青＝積み立てたお金　金＝増えた分（試算）', { w: 1024, h: 96, size: 48, sx: 9 }); legend.position.set(0, 9.4, -1); stage.add(legend);
function stageMode(m) { if (m === 'coins') { hideStacks(); setStacks(0); } else hideStacks(); cols.forEach(c => { c.base.g.visible = false; c.gain.g.visible = false; c.tag.visible = false; }); legend.visible = false; }

// ---------- living room: coins into a jar ----------
const you = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#3f8f6b', pants: '#3b3f4a', scale: 1 }); room.add(you);
const jar = new THREE.Group(); { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 18, 1, true), new THREE.MeshLambertMaterial({ color: '#dff1ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); g.position.y = 0.2; jar.add(g); const b = new THREE.Mesh(new THREE.CircleGeometry(0.16, 18), mat('#cfe3f0')); b.rotation.x = -Math.PI / 2; b.position.y = 0.005; jar.add(b); }
const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 18), mat('#e8b84a', { emissive: 0x3a2a08 })); fill.geometry.translate(0, 0.5, 0); jar.add(fill);
jar.position.set(0.9, 0.36, -0.9); room.add(jar);
const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), mat('#e8b84a', { emissive: 0x3a2a08 })); room.add(coin);
const cal = textSprite('1か月目', { w: 512, h: 160, size: 84, bg: 'rgba(255,255,255,.95)', color: '#2f7fd1', sx: 0.9 }); cal.position.set(-0.4, 1.9, -3.4); room.add(cal);
function living(light, opt) { setRoom({ sets: ['living'] }); setLight(light, opt); props.sleeper.visible = false; setScreen((g, w, h) => { g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h); }); }
function drop(t, fillK) {
  you.position.set(1.05, 0, -1.6); you.rotation.set(0, 0.15, 0);
  const U = you.userData; U.arms[1].rotation.set(-0.95, 0, 0.12); U.arms[0].rotation.set(0, 0, 0); U.head.rotation.x = 0.35;
  const p = (t * 0.9) % 1; coin.visible = true; coin.position.set(0.9, lerp(0.95, 0.4 + fillK * 0.35, p * p), -0.9);
  fill.scale.y = Math.max(0.001, fillK * 0.36); fill.visible = fillK > 0.01;
}
const spark = makeSparkles(120, 0.12, 0xffe6a0); stage.add(spark.points); spark.init([[0, 3, 0]], 4, 3);

const SUBS = [
  [2.6, 6.0, '1日1,000円。<br>月3万円を積み立てる。'],
  [6.2, 10.1, '1年で積み立てたお金は<br>36万円。'],
  [10.1, 14, '年3%で増えると仮定して、<br>国と同じ方法で試算する。'],
  [14.2, 18.1, '10年で元本360万円。<br>試算では約418万円。'],
  [18.1, 22, '増えた分は約58万円。<br>まだ小さい。'],
  [22.2, 26.1, '20年で元本720万円。<br>試算では約981万円。'],
  [26.1, 30, '増えた分が、さらに<br>増えた分を生み始める。'],
  [30.2, 34.6, '30年で元本1,080万円。'],
  [34.6, 39, '試算では約1,736万円。<br>元本の約1.6倍。'],
  [39.2, 43.6, 'ふつうの口座なら、<br>利益に約20%の税金。'],
  [43.6, 47.8, '国のNISAなら、この<br>約133万円がかからない。'],
  [48.1, 53.8, '結果：30年で元本1,080万円が、<br>試算で約1,736万円になった。'],
  [53.9, 56.1, 'ただし、元本保証はない。'],
  [56.2, 59.4, '毎月いくらなら<br>続けられる？'],
];

const yen = (man) => man >= 10000 ? (man / 10000).toFixed(0) + '億円' : '約' + Math.round(man).toLocaleString('en-US') + '万円';
function stageCam(t, d, a, b, tg = [0, 3.6, 0]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function shot0(t) { // hook: coin stacks grow fast, months counter
  setStageColor('#14213a'); stageMode('coins'); setStacks(clamp(t / 2.4));
  stageCam(t, 2.5, [0, 5.0, 13.5], [0, 4.8, 12.5], [0, 2.2, 0]);
  lift(260);
  el.title.style.opacity = 1;
  setHud('積み立て', Math.min(360, Math.floor(Math.pow(t / 2.5, 1.5) * 360)) + 'か月目', 1, { mono: true, color: t > 1.4 ? GOLD : '#fff' });
  return stage;
}
function shot1(t) { // everyday: dropping coins in a jar at home
  lift(200);
  living('day', { ceil: 5, hemi: 1.05 }); you.visible = true; cal.visible = true; cal.userData.set('1か月目');
  drop(t, 0.15 + t * 0.03);
  const u = ease(t / 3.5); look(lerp(-0.7, -0.5, u), lerp(1.6, 1.55, u), lerp(1.5, 1.2, u), 0.9, 0.95, -1.2, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  setHud('1日', '1,000円', 1);
  return room;
}
function shot2(t) { // +1年: jar fuller, calendar 12
  lift(200);
  living('day', { ceil: 5, hemi: 1.05 }); you.visible = true; cal.visible = true; cal.userData.set('12か月目');
  drop(t + 2, 0.35 + Math.min(0.5, t * 0.05));
  const u = ease(t / 8); look(lerp(-0.5, -0.2, u), lerp(1.55, 1.8, u), lerp(1.2, 1.9, u), 0.9, 1.0, -1.3, 50);
  hudTime('+1年');
  setTop('積み立てたお金（元本）', countUp(t, 36, 0.3, 1.2) + '万円', fade(t, 0.3, 8, 0.25), BLUE);
  return room;
}
function barShot(n, t, d, top) {
  setStageColor('#14213a'); stageMode('bars'); setCols(n, clamp((t - 0.3) / 3.0));
  stageCam(t, d, [0, 4.4, 22.5], [0.3, 4.6, 21.5], [0, 4.0, 0]);
  lift(380);
  return stage;
}
function shot3(t) { // +10年
  barShot(0, t, 8);
  hudTime('+10年');
  if (t < 4.1) setTop('10年で積み立てたお金（元本）', countUp(t, 360, 0.3, 1.2) + '万円', fade(t, 0.3, 4.1, 0.25), BLUE);
  else setTop('10年後（年3%の試算）', '約' + countUp(t - 4.1, 418, 0.05, 0.6) + '万円', fade(t, 4.1, 8, 0.25), GOLD);
  return stage;
}
function shot4(t) { // +20年
  barShot(1, t, 8);
  hudTime('+20年');
  if (t < 4.0) setTop('20年で積み立てたお金（元本）', countUp(t, 720, 0.3, 1.2) + '万円', fade(t, 0.3, 4.0, 0.25), BLUE);
  else setTop('20年後（年3%の試算）', '約' + countUp(t - 4.0, 981, 0.05, 0.6) + '万円', fade(t, 4.0, 8, 0.25), GOLD);
  return stage;
}
function shot5(t) { // +30年
  barShot(2, t, 9.2);
  if (t > 4.3 && !spark.ok) spark.ok = true; spark.set(t > 4.3 ? clamp((t - 4.3) / 1.6) : 0);
  hudTime('+30年');
  if (t < 4.4) setTop('30年で積み立てたお金（元本）', countUp(t, 1080, 0.3, 1.2).toLocaleString('en-US') + '万円', fade(t, 0.3, 4.4, 0.25), BLUE);
  else setTop('30年後（年3%の試算）', '約' + countUp(t - 4.4, 1736, 0.05, 0.8).toLocaleString('en-US') + '万円', fade(t, 4.4, 9.2, 0.25), GOLD);
  return stage;
}
function shot6(t) { // tax vs NISA: zoom on the 30-year column's gold part
  setStageColor('#14213a'); stageMode('bars'); setCols(3, 1); spark.set(0);
  const u = ease(t / 8.8); look(lerp(0.5, 0.8, u), lerp(4.6, 4.8, u), lerp(21, 20.2, u), 0.5, 4.1, 0, 50);
  lift(380);
  setHud('30年後', '利益 約656万円', 1);
  if (t < 4.4) setTop('ふつうの口座の税金（利益に20.315%）', '約' + countUp(t, 133, 0.4, 1.2) + '万円', fade(t, 0.3, 4.4, 0.25), '#ff8a7a');
  else setTop('NISAなら（非課税・単純計算）', '0円', fade(t, 4.4, 8.8, 0.25), GREEN);
  return stage;
}
function shot7(t) { // result: wide on all three columns
  setStageColor('#14213a'); stageMode('bars'); setCols(3, 1);
  stageCam(t, 7.5, [0.3, 4.6, 21.5], [0, 4.8, 23.5], [0, 4.0, 0]);
  lift(380);
  const a = t < 3.6;
  setTop(a ? '30年の元本（月3万円）' : '30年後（年3%の試算）', a ? '1,080万円' : '約1,736万円', fade(t, 0.15, 7.5, 0.25), a ? BLUE : GOLD);
  return stage;
}
function shot8(t) { // loop: coins stage, like the hook
  setStageColor('#14213a'); stageMode('coins'); setStacks(0.18);
  stageCam(t + 0.5, 4.5, [0, 5.0, 13.5], [0, 4.8, 12.5], [0, 2.2, 0]);
  lift(260);
  setHud('積み立て', '0か月目', 1, { mono: true });
  return stage;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14.1, f: shot2 }, { a: 14.1, b: 22.1, f: shot3 },
  { a: 22.1, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0047',
    series: 'お財布のもしも',
    hookType: 'H6',
    cat: 'お金・経済',
    title: '毎月3万円を30年積み立て続けたら？',
    titleHtml: '毎月3万円を30年<br>積み立て続けたら？',
    mood: 'hopeful', seed: 47, hits: [1.4, 48.1], risers: [30.2], impacts: [18.5, 35.0, 44.0],
    sfx: [[1.4, 'whoosh']],
    narr: { '1,000円': '千円', '36万円': '36万円', '年3%': 'ねん3パーセント', '約418万円': 'やく418万円', '約58万円': 'やく58万円', '約981万円': 'やく981万円', '1,080万円': '1080万円', '約1,736万円': 'やく1736万円', '約1.6倍': 'やく1.6ばい', '約20%': 'やく20パーセント', '約133万円': 'やく133万円', 'NISA': 'ニーサ' },
    ask: '毎月いくらなら続けられる？',
    caption: 'もしも毎月3万円を30年積み立て続けたら？\n1日1,000円、月3万円。1年で積み立てたお金（元本）は36万円。\n年3%で増えると仮定して、金融庁のNISA資料と同じ方法で試算すると、10年で元本360万円→約418万円、20年で元本720万円→約981万円、30年で元本1,080万円→約1,736万円。増えた分は約656万円で、元本の約1.6倍。\nふつうの口座なら利益に20.315%の税金がかかり、約133万円（単純計算）。NISAのつみたて投資枠（年120万円まで）なら非課税。\nただし元本保証はない。年3%は仮定の数字で、将来の運用成果を保証するものではない。手数料は考えていない。特定の商品をすすめるものではない。\n\n毎月いくらなら続けられる？ コメントで教えて。\n\n出典：金融庁「NISAを知る」（2024年6月）の試算方法、税率は上場株式等の譲渡所得等の税率（所得税・復興特別所得税15.315%＋住民税5%）',
    hashtags: ['もしもラボ', '積立', 'NISA', 'お金の勉強', '複利'],
    endStats: [['30年の元本（月3万円）', '1,080万円', '単純計算'], ['30年後（年3%の試算）', '約1,736万円', '試算'], ['増えた分', '約656万円', '試算'], ['ふつうの口座の税金', '約133万円', '20.315%'], ['つみたて投資枠', '年120万円まで', '金融庁']],
    sources: '出典：金融庁「NISAを知る」（2024年6月）の試算方法、<br>上場株式等の税率 20.315%。年3%は仮定で、元本保証はありません',
  },
});
