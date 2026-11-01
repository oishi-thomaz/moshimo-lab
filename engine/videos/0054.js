import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, canvasTex, makePerson, makeQ, SKIN, HAIR } from '../lib.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { makeBills } from '../scenes/bank.js';
import { room, setRoom, setLight, setScreen, props } from '../scenes/room.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも1億円を1日で使い切ったら？（blueprint のタイトル もしも1億円を1日で使い切れと言われたら？ を2行に収まるよう短縮）（blueprint no 54・お財布のもしもシリーズ）
// ※ 特定の買い物や投資をすすめるものではない
// 数字：
//  1年を通じて勤務した給与所得者の平均給与：2025年分 487万円（国税庁「令和7年分 民間給与実態統計調査結果について」2026年9月）
//   https://www.nta.go.jp/information/release/kokuzeicho/2026/minkan_2026/pdf/01.pdf
//   1億円÷487万円＝20.5（約20年分・単純計算）
//  二人以上の世帯の消費支出：2025年平均 1世帯1か月 314,001円（総務省 家計調査 2025年平均）
//   https://www.stat.go.jp/data/kakei/sokuhou/tsuki/pdf/fies_gaikyo2025.pdf
//   年 3,768,012円。1億円÷3,768,012＝26.5（約26年分・単純計算）
//  首都圏の新築マンション1戸の平均価格：2025年 9,182万円、東京23区 1億3,613万円（不動産経済研究所「首都圏マンション市場動向」2026年1月26日発表）
//   https://www.stepon.co.jp/uri/mansion/mansion_news/2026/0126_3976/ ・ https://www.nippon.com/ja/japan-data/h02685/
//   1億円−9,182万円＝818万円。1億3,613万円−1億円＝3,613万円足りない（単純計算）
//  1日＝86,400秒：1億円÷86,400＝1,157.4円/秒（約1,157円）、÷24＝4,166,667円/時（約417万円）

const GOLD = '#ffd27a', RED = '#ff8a7a', BLUE = '#7fd4ff', GREEN = '#7ff0c8';

// ---------- stage: the 1億円 pile (100 bundles of 100万円) ----------
const PILE = makeBills(100, { cols: 5, w: 0.8, h: 0.34 }); PILE.position.set(0, 0.3, 0.6); stage.add(PILE);
const you = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#3f8f6b', pants: '#3b3f4a', scale: 1.9 }); stage.add(you);
const pileSpark = makeSparkles(260, 0.22, 0xfff0b0); stage.add(pileSpark.points); pileSpark.init([[-1, 3.0, 0.6], [0, 3.4, 0.6], [1, 3.0, 0.6]], 1.6, 3.0);
const pileLab = textSprite('1億円', { w: 512, h: 160, size: 120, color: '#ffd27a', stroke: 10, sx: 3.0 }); stage.add(pileLab);
const q = makeQ(); q.scale.setScalar(1.6); stage.add(q);
function pile(n, labOn = true) { PILE.visible = true; PILE.userData.setN(Math.round(n)); pileLab.visible = labOn; pileLab.position.set(PILE.position.x, 0.3 + Math.max(1, Math.ceil(n / 10)) * 0.34 + 0.9, 0.6); }
function youAt(x, z, ry, t) { you.visible = true; you.position.set(x, 0.3, z); you.rotation.y = ry; you.userData.head.rotation.x = -0.1; you.userData.arms[1].rotation.x = -0.3 - Math.sin(t * 2) * 0.08; }

// ---------- stage: bars (yearly pay vs 1億円) ----------
const pay = makeBar({ color: '#4fa3d1', w: 1.8, d: 1.8, label: '平均年収', x: -3.0, z: 0, nameTop: true });
const oku = makeBar({ color: '#e8b84a', w: 1.8, d: 1.8, label: '1億円', x: 3.0, z: 0, nameTop: true });
const PSC = 6.2 / 10000; // 1万円 → units
function bars(k, show) { pay.g.visible = show; oku.g.visible = show; const a = ease(clamp(k * 2)), b = ease(clamp(k * 1.6 - 0.5)); pay.setH(487 * PSC * a, a > 0.05 ? Math.round(487 * a) + '万円' : ''); oku.setH(10000 * PSC * b, b > 0.05 ? Math.round(10000 * b).toLocaleString('en-US') + '万円' : ''); }

// ---------- stage: condo tower ----------
const winTex = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, w, h); for (let y = 0; y < 16; y++) for (let x = 0; x < 6; x++) { g.fillStyle = (x + y) % 5 === 0 ? '#ffe39a' : '#5f7591'; g.fillRect(14 + x * 40, 14 + y * 31, 28, 20); } g.fillStyle = '#b9b0a0'; for (let y = 0; y < 16; y++) g.fillRect(0, 36 + y * 31, w, 4); });
const TOWER = new THREE.Group(); stage.add(TOWER);
{ const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 9, 2.6), [mat('#cfc7b8'), mat('#cfc7b8'), mat('#bfb6a6'), mat('#cfc7b8'), new THREE.MeshLambertMaterial({ map: winTex }), mat('#cfc7b8')]); b.position.y = 4.5; b.castShadow = true; TOWER.add(b);
  const roof = box(3.4, 0.2, 2.8, mat('#9a917f')); roof.position.y = 9.1; TOWER.add(roof); }
const tLab = textSprite('首都圏の新築マンション', { w: 1024, h: 128, size: 64, sx: 6.5 }); stage.add(tLab);
const short = makeBar({ color: '#e0584a', w: 1.4, d: 1.4, label: '', x: 3.6, z: 0.6 });
function tower(k, x, sc = 1) { TOWER.visible = k > 0; TOWER.position.set(x, 0.3, -0.4); TOWER.scale.set(sc, Math.max(0.001, ease(clamp(k))) * sc, sc); tLab.visible = k > 0.95; tLab.position.set(x, 0.3 + 9.6 * sc + 0.7, -0.4); }
const fam = [makePerson({ skin: SKIN[1], hair: HAIR[2], shirt: '#c9784a', pants: '#3b3f4a', scale: 1.9 }), makePerson({ skin: SKIN[2], hair: HAIR[0], shirt: '#4f8ad1', pants: '#2b3346', scale: 1.9 })];
fam.forEach(p => stage.add(p));

function stageMode() {
  setStageColor('#14213a'); PILE.visible = false; pileLab.visible = false; you.visible = false; pileSpark.set(0); q.visible = false;
  bars(0, false); TOWER.visible = false; tLab.visible = false; short.g.visible = false; fam.forEach(p => p.visible = false);
}
function sCam(t, d, a, b, tg = [0, 3.0, 0], fov = 50) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, fov); }

// ---------- living room: the household's monthly spending ----------
const lfam = [makePerson({ skin: SKIN[1], hair: HAIR[2], shirt: '#c9784a', pants: '#3b3f4a' }), makePerson({ skin: SKIN[2], hair: HAIR[0], shirt: '#4f8ad1', pants: '#2b3346' }), makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#e0b84a', pants: '#3b3f4a', scale: 0.7 })];
lfam.forEach(p => room.add(p));
const cal = textSprite('26年分', { w: 512, h: 200, size: 120, bg: 'rgba(255,255,255,.96)', color: '#d1453a', sx: 1.3 }); cal.position.set(0, 2.15, -3.4); room.add(cal);
function living(t) {
  setRoom({ sets: ['living'] }); setLight('evening', { ceil: 9, hemi: 1.0 }); props.sleeper.visible = false;
  setScreen((g, w, h) => { g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h); });
  [[-0.9, -0.6, 0.3], [0.9, -0.5, -0.3], [0.05, 0.1, 0]].forEach(([x, z, ry], i) => { const p = lfam[i]; p.position.set(x, 0, z); p.rotation.y = ry; p.userData.head.rotation.x = -0.05; p.userData.arms[0].rotation.x = Math.sin(t * 2 + i) * 0.1; });
}

const SUBS = [
  [2.5, 6.0, '1億円、今日中に使い切れ。<br>これが意外と難しい。'],
  [6.2, 10.1, '1日で使い切るには、<br>1秒に約1,157円。'],
  [10.1, 14, '寝ずに使っても、<br>1時間に約417万円。'],
  [14.2, 18.1, '平均年収の約20年分。<br>でも、本当の重さは次。'],
  [18.1, 22, '家族の生活費は、<br>1か月約31.4万円。'],
  [22.2, 26.1, '1億円あれば、<br>約26年暮らせる。'],
  [26.1, 30, 'それでも、1日で<br>消える使い道がある。'],
  [30.2, 34.6, '答えは、家。'],
  [34.6, 39, '首都圏の新築マンションは、<br>平均9,182万円。'],
  [39.2, 43.6, '1戸買うと、<br>残りは818万円。'],
  [43.6, 47.8, '東京23区なら1億3,613万円。<br>1億円でも足りない。'],
  [48.1, 53.8, '結果：26年分の生活費が、<br>家1つで1日で消えた。'],
  [53.9, 56.1, '1億円でも、家1つ。'],
  [56.2, 59.4, 'あなたなら1億円、<br>何に使う？'],
];

const TP = 0.45; // v2：0.45秒でタイマーが動き出し、札束が崩れ始める
const hms = (sec) => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
function hookCam(t, d = 2.5) { sCam(t, d, [0.4, 4.6, 17.5], [0.3, 4.5, 16.8], [-0.7, 2.15, 0], 50); }
function shot0(t) { // hook: the 1億円 pile, the 24h timer starts and bundles vanish
  stageMode(); lift(0);
  const go = t >= TP; const n = go ? 100 - Math.min(14, (t - TP) * 9) : 100;
  pile(n, false); youAt(-3.0, 1.0, 0.45, t);
  pileSpark.set(go ? clamp((t - TP) / 1.6) : 0);
  el.flash.style.opacity = go ? 0.45 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  setHud('残り時間', go ? hms(86400 - (t - TP) * 3600) : '24:00:00', 1, { mono: true, color: go ? RED : '#fff' });
  return stage;
}
function shot1(t) { // per second / per hour
  stageMode(); lift(200);
  pile(86 - t * 1.1); youAt(-3.0, 1.0, 0.45 + Math.sin(t) * 0.1, t);
  q.visible = t > 5; q.position.set(-3.0, 4.7 + Math.sin(t * 3) * 0.06, 1.0);
  sCam(t, 11.6, [0.6, 5.0, 12.5], [1.4, 5.6, 14.0], [-0.6, 2.9, 0]);
  setHud('残り時間', hms(79020 - t * 2400), 1, { mono: true, color: RED });
  if (t < 7.6) setTop('1日で使い切るには（1秒あたり・単純計算）', '約' + countUp(t - 3.7, 1157, 0, 1.0).toLocaleString('en-US') + '円', fade(t, 3.7, 7.6, 0.25), GOLD);
  else setTop('1時間あたり（単純計算）', '約' + countUp(t - 7.6, 417, 0, 0.9) + '万円', fade(t, 7.6, 11.6, 0.25), GOLD);
  return stage;
}
function shot2(t) { // vs average yearly pay
  stageMode(); bars(clamp(t / 1.7), true); lift(330);
  sCam(t, 8, [0, 5.0, 19], [0.4, 5.2, 18], [0, 4.4, 0]);
  setTop('1億円は平均年収の（単純計算）', '約' + (countUp(t, 205, 0.6, 1.4) / 10).toFixed(1) + '年分', fade(t, 0.5, 8, 0.25), GOLD);
  return stage;
}
function shot3(t) { // household living costs
  living(t); lift(200); cal.visible = t > 4.0;
  const u = ease(t / 8.1); look(lerp(-0.3, 0.1, u), lerp(2.3, 2.4, u), lerp(6.6, 6.0, u), 0, 1.25, -1.6, 50);
  setHud('1世帯・1か月', '生活費', 1);
  if (t < 4.0) setTop('二人以上の世帯の消費支出（2025年・月）', '約' + (countUp(t, 314, 0.4, 1.2) / 10).toFixed(1) + '万円', fade(t, 0.4, 4.0, 0.25), BLUE);
  else setTop('1億円で暮らせる年数（単純計算）', '約' + countUp(t - 4.0, 26, 0.05, 0.8) + '年分', fade(t, 4.0, 8.1, 0.25), GOLD);
  return room;
}
function shot4(t) { // "there's a way": pile + question
  stageMode(); lift(200);
  pile(70); youAt(-3.0, 1.0, 0.4, t); q.visible = true; q.position.set(-3.0, 4.7 + Math.sin(t * 3) * 0.06, 1.0);
  sCam(t, 8.1, [3.0, 5.4, 14], [1.5, 4.8, 12.5], [-0.6, 2.9, 0]);
  setHud('残り時間', hms(50000 - t * 1500), 1, { mono: true, color: RED });
  return stage;
}
function shot5(t) { // the tower rises, the pile collapses to 818万
  stageMode(); lift(120);
  const k = clamp((t - 0.2) / 2.2);
  tower(k, 2.6); pile(lerp(70, 8, ease(clamp((t - 0.4) / 2.6))), false); PILE.position.x = -3.2;
  pileSpark.set(t > 0.4 ? clamp((t - 0.4) / 2.0) : 0);
  youAt(-5.4, 2.0, 0.6, t); you.visible = t < 9.2;
  sCam(t, 13.4, [-0.4, 6.4, 24.5], [0.2, 6.8, 23.5], [0, 5.4, 0]);
  setHud('残り時間', hms(37000 - t * 1500), 1, { mono: true, color: RED });
  if (t < 4.4) setTop('首都圏の新築マンション（2025年・平均）', countUp(t, 9182, 0.4, 1.6).toLocaleString('en-US') + '万円', fade(t, 0.3, 4.4, 0.25), GOLD);
  else if (t < 9.0) setTop('1億円の残り（単純計算）', countUp(t - 4.4, 818, 0.05, 0.9) + '万円', fade(t, 4.4, 9.0, 0.25), RED);
  else setTop('東京23区の新築マンション（2025年・平均）', '1億' + countUp(t - 9.0, 3613, 0.05, 1.0).toLocaleString('en-US') + '万円', fade(t, 9.0, 13.4, 0.25), RED);
  if (t > 9.2) { tower(1, 2.6, 1.25); short.g.visible = true; short.g.position.set(-2.4, 0.3, 0.6); short.setH(3613 * PSC * ease(clamp((t - 9.6) / 1.2)), t > 10 ? '足りない' : ''); PILE.visible = false; }
  return stage;
}
function shot6(t) { // result: the family in front of the tower, a thin stack left
  stageMode(); lift(120);
  tower(1, 2.2); pile(8, false); PILE.position.x = -3.4;
  fam[0].visible = fam[1].visible = true; fam[0].position.set(-1.6, 0.3, 2.4); fam[1].position.set(-0.4, 0.3, 2.6); fam.forEach((p, i) => { p.rotation.y = 0.2 - i * 0.3; p.userData.head.rotation.x = -0.25; });
  sCam(t, 7.5, [0.2, 6.0, 22], [-0.6, 6.6, 24.5], [0, 5.2, 0]);
  setHud('残り時間', '00:00:00', 1, { mono: true, color: RED });
  const a = t < 3.6;
  setTop(a ? '首都圏のマンション1戸（2025年・平均）' : '1億円で暮らせる年数（単純計算）', a ? '9,182万円' : '約26年分', fade(t, 0.15, 7.5, 0.25), a ? GOLD : BLUE);
  return stage;
}
function shot7(t) { // loop: full pile with 24:00:00, like the hook
  stageMode(); lift(0); PILE.position.x = 0;
  pile(100, false); youAt(-3.0, 1.0, 0.45, t);
  hookCam(t + 0.5, 4.5);
  setHud('残り時間', '24:00:00', 1, { mono: true });
  return stage;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 14.1, f: shot1 }, { a: 14.1, b: 18.1, f: shot2 }, { a: 18.1, b: 26.1, f: shot3 },
  { a: 26.1, b: 34.6, f: shot4 }, { a: 34.6, b: 48, f: shot5 }, { a: 48, b: 55.5, f: shot6 },
  { a: 55.5, b: 59.5, f: shot7 }, { a: 59.5, b: 63, f: endCard },
];
// shot0 moves the pile back to the center when looping
const _s0 = shots[0].f; shots[0].f = (t) => { PILE.position.x = 0; return _s0(t); };
const _s1 = shots[1].f; shots[1].f = (t) => { PILE.position.x = 0; return _s1(t); };
const _s4 = shots[4].f; shots[4].f = (t) => { PILE.position.x = 0; return _s4(t); };
runStory({
  shots, subs: SUBS, duration: 63,
  meta: {
    id: '0054',
    v2: true,
    hookLine: '1億円、今日中に使い切れ。',
    series: 'お財布のもしも',
    hookType: 'H1',
    cat: 'お金・経済',
    title: '1億円を1日で使い切ったら？',
    titleHtml: '1億円を1日で<br>使い切ったら？',
    mood: 'tension', seed: 54, hits: [0.45, 48.1], risers: [26.1], impacts: [6.8, 30.4, 39.6, 44.0],
    sfx: [[0.45, 'whoosh'], [34.8, 'poof']],
    narr: { '約1,157円': 'やく1157円', '約417万円': 'やく417万円', '約20年分': 'やく20ねんぶん', '約31.4万円': 'やく31.4万円', '約26年': 'やく26ねん', '9,182万円': '9182万円', '818万円': '818万円', '1億3,613万円': '1おく3613万円', '26年分': '26ねんぶん', '家1つ': 'いえひとつ' },
    ask: 'あなたなら1億円、何に使う？',
    caption: 'もしも1億円を1日で使い切ったら？\n1日で使い切るには、1秒に約1,157円、1時間に約417万円（単純計算）。\n1億円は、会社員の平均年収487万円（2025年分）の約20年分。二人以上の世帯の生活費は1か月平均約31.4万円（2025年）なので、約26年暮らせる金額（単純計算）。\nそれでも一瞬で消える使い道がある。首都圏の新築マンションは2025年の平均で9,182万円。1戸買うと残りは818万円。東京23区なら平均1億3,613万円で、1億円でも足りない。\n特定の買い物や投資をすすめるものではない。\n\nあなたなら1億円、何に使う？ コメントで教えて。\n\n出典：国税庁 令和7年分民間給与実態統計調査、総務省 家計調査（2025年平均）、不動産経済研究所 首都圏マンション市場動向（2025年）',
    hashtags: ['もしもラボ', '1億円', 'お金', 'マンション', '生活費'],
    endStats: [['1秒あたり', '約1,157円', '単純計算'], ['平均年収の', '約20年分', '2025年分'], ['1世帯の生活費なら', '約26年分', '単純計算'], ['首都圏の新築マンション', '9,182万円', '2025年平均'], ['東京23区', '1億3,613万円', '2025年平均']],
    sources: '出典：国税庁 民間給与実態統計調査（2025年分）、<br>総務省 家計調査（2025年）、不動産経済研究所（2025年）',
  },
});
