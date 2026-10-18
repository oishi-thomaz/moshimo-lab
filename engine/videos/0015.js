import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade } from '../lib.js';
import { arena, STN, RUNZ, FINX, makeAthlete, act, run, setOthers, hideOthers, setClock } from '../scenes/hyrox.js';
import { lift, look, runStory, endCard, setTop, setHud, el } from '../story.js';

// もしもマラソン世界記録保持者がHYROX（メンズシングル オープン）に出たら？
// 前提：マラソン世界記録 1:59:30（2026年4月 ロンドン、2026年7月公認・World Athletics）。実在の選手の名前・見た目は使わない
//       体重は56kgと仮定（ケニアのトップ長距離選手9人の平均 55.98kg・身長169cm：Human Movement 17(1), 2016）
// 規定（HYROX ルールブック 2026/27・男子オープン）：1km×8、SkiErg 1000m／スレッドプッシュ 152kg 50m／スレッドプル 103kg 50m／
//       バーピーブロードジャンプ 80m／ローイング 1000m／ファーマーズキャリー 2×24kg 200m／サンドバッグランジ 20kg 100m／ウォールボール 6kg 3m 100回
// 比べる数字：男子オープン世界記録 50:38（Rončević, Cologne 2024：ラン27:42・種目19:56・移動3:00 / hyresult）
//       男子オープンの種目別（RoxHype 175,919人）：SkiErg 上位10% 4:14／プッシュ 上位10% 2:25・ふつう3:10・遅い10% 4:26／
//       プル ふつう5:03・遅い10% 7:04／ロー 上位10% 4:25／ウォールボール ふつう7:15。男子オープン上位10%は1:10:11以内（2025/26、177,264人）
// 推計（このファイルの数字はすべて推計）
const RUNS = ['2:45', '2:55', '3:30', '3:10', '3:15', '3:05', '3:10', '3:45']; // 計25:35。1本目はマラソン世界記録ペース（2:50/km）より少し速い。種目で脚を使うほど落ちる（プッシュ後とランジ後が最も遅い）
const STNT = ['4:20', '4:30', '6:30', '3:00', '4:00', '2:10', '4:15', '7:00']; // 計35:45。移動（ロックスゾーン）3:30。総合 1:04:50
const STNL = ['SkiErg 1000m（推計）', 'スレッドプッシュ 152kg（推計）', 'スレッドプル 103kg（推計）', 'バーピーブロードジャンプ 80m（推計）', 'ローイング 1000m（推計）', 'ファーマーズキャリー 2×24kg（推計）', 'サンドバッグランジ 20kg（推計）', 'ウォールボール 100回（推計）'];
const STNC = ['#ffffff', '#ff8a7a', '#ff8a7a', '#7ff0c8', '#7ff0c8', '#ffffff', '#ffffff', '#ffffff'];
const SLOW = [0, 1, 1, 0, 0, 0.5, 0.4, 0.6];
const GREEN = '#7ff0c8';
const sec = s => { const [m, x] = s.split(':').map(Number); return m * 60 + x; };
const mmss = v => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
const roll = (t, s, t0 = 1.75, d = 1.2) => mmss(sec(s) * easeOut(clamp((t - t0) / d)));

const SUBS = [
  [2.6, 6.0, '1km走って、種目を1つ。<br>これを8回くり返す。'],
  [6.2, 10.9, '腕の筋肉は少なめ。でも<br>心肺は人類トップクラス。'],
  [11.1, 15.9, '152kgは体重の約2.7倍。<br>軽すぎて押し負ける。'],
  [16.1, 20.9, '103kgを腕と背中で引く。<br>いちばんの山場。'],
  [21.1, 25.9, '体が軽いほど有利な種目。<br>ここで一気に巻き返す。'],
  [26.1, 30.9, '心肺の強さがそのまま出る。<br>上位10%より速い。'],
  [31.1, 35.9, '2×24kgは体重の約86%。<br>握力が先に限界に。'],
  [36.1, 40.9, '20kgを担いで100m。<br>脚の持久力でしのぐ。'],
  [41.1, 45.9, '6kgを3mの的へ100回。<br>小柄な体には高い的。'],
  [46.2, 50.5, '結果：推計1時間4分50秒。<br>男子オープンの上位10%。'],
  [50.6, 55.4, 'ランはHYROX世界記録より<br>2分速く、種目で16分負けた。'],
  [55.6, 59.4, 'あなたなら、どの種目で<br>この男に勝てる？'],
];

const hero = makeAthlete({ shirt: '#e8743b' }); arena.add(hero);

function hookRun(t, T) { // 走る男が、ほかの選手をどんどん抜いていく
  lift(240);
  const x0 = STN[0].x - 26;
  setOthers(x0 + 4, t, 3.4);
  const x = run(hero, x0, x0 + 60, t, 7.2);
  look(x + 3.6, 1.3, RUNZ + 5.4, x - 1.2, 1.2, RUNZ, 50);
  setHud('マラソン世界記録', '1:59:30', 1, { mono: true, color: GREEN });
  return arena;
}
function shot0(t, T) { el.title.style.opacity = 1; return hookRun(t + 0.6, T); }
function shot1(t, T) { // スタート前
  lift(240); hideOthers();
  const x0 = STN[0].x - 14;
  run(hero, x0, x0, 0, 0); hero.userData.legs.forEach(l => l.rotation.x = 0); hero.userData.arms.forEach(a => a.rotation.x = 0); hero.position.y = 0;
  hero.rotation.y = Math.PI / 2 + Math.sin(t * 0.8) * 0.1;
  const u = ease(t / 3.5);
  look(x0 + lerp(3.4, 2.6, u), 1.6, RUNZ + lerp(4.6, 3.8, u), x0, 1.2, RUNZ, 48);
  setHud('体重（仮定）', '56kg', 1);
  setTop('マラソン世界記録（2026年4月）', '1:59:30', fade(t, 0.15, 3.5, 0.25), GREEN);
  return arena;
}
// ラン（1.6秒）→ 種目（3.4秒）
function pair(k) {
  return function (t, T) {
    lift(260);
    const sx = STN[k].x;
    setHud(`ラン${k + 1}`, RUNS[k], 1, { color: GREEN });
    if (t < 1.6) {
      setOthers(sx - 22, t, 3.4);
      const x = run(hero, sx - 16, sx + 4, t, 7.0);
      look(x + 4.5, 1.8, RUNZ + 6.5, x - 0.6, 1.0, RUNZ, 50);
      return arena;
    }
    hideOthers();
    const ts = t - 1.6 + 2.0;
    act(hero, k, ts, { slow: SLOW[k] });
    const p = hero.position;
    const cam = [
      [4.2, 2.6, 5.0, 0.0, 1.1, -0.6], // ski
      [3.4, 2.8, 6.0, 0.0, 0.7, -1.2], // push
      [3.0, 3.2, 6.2, 0.0, 0.8, -2.8], // pull
      [4.2, 2.6, 6.0, 0.0, 0.6, -1.2], // bbj
      [4.6, 2.4, 4.2, 0.0, 0.5, -0.6], // row
      [5.0, 2.6, 5.0, 0.0, 0.9, -0.8], // farmers
      [5.0, 2.4, 4.6, 0.0, 0.8, -0.8], // lunges
      [3.2, 2.2, 5.8, 0.0, 1.8, -0.6], // wall balls
    ][k];
    const u = ease((t - 1.6) / 3.4);
    look(p.x + cam[0] - u * 0.4, cam[1], p.z + cam[2] - u * 0.3, p.x + cam[3], cam[4], p.z + cam[5], 50);
    setTop(STNL[k], roll(t, STNT[k]), fade(t, 1.65, 5, 0.25), STNC[k]);
    return arena;
  };
}
function shotResult(t, T) { // ゴール。大時計が 1:04:50 で止まる
  lift(280); hideOthers();
  const x = run(hero, FINX - 10, FINX + 4, t, 3.0);
  const v = 3890 * easeOut(clamp((t - 0.2) / 2.2));
  const h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60), s = Math.floor(v % 60);
  setClock(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  const u = ease(t / 9.3);
  look(FINX + lerp(9, 11, u), lerp(1.7, 2.3, u), RUNZ + 0.9, FINX - 4, 2.0, RUNZ, 50);
  if (t < 4.3) setTop('推計タイム（メンズシングル オープン）', `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, fade(t, 0.15, 4.3, 0.2), '#ffffff');
  else setTop('ランの合計 8km（推計）', '25:35', fade(t, 4.4, 9.3, 0.2), GREEN);
  void x;
  return arena;
}
function shotLoop(t, T) { return hookRun(t, T); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => ({ a: 6 + k * 5, b: 11 + k * 5, f: pair(k) })),
  { a: 46, b: 55.5, f: shotResult }, { a: 55.5, b: 59.5, f: shotLoop }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0015',
    title: 'マラソン世界記録の男がHYROXに出たら？',
    titleHtml: '<span style="font-size:.84em">マラソン世界記録の男が</span><br>HYROXに出たら？',
    mood: 'tension', seed: 15, hits: [6.0, 11.1, 46.2], risers: [6.0, 46.2],
    ask: 'あなたなら、どの種目でこの男に勝てる？',
    narr: { '2×24kg': '24キロ2つ' },
    caption: 'もしもマラソン世界記録（1時間59分30秒）のランナーが、HYROXのメンズシングル オープンに出たら？\n体重56kg（ケニアのトップ長距離選手の平均）と仮定して、各ランと各種目のタイムを推計。\n\n推計タイム 1:04:50\nラン1 2:45 → SkiErg 4:20（腕は並み、心肺で押し切る）\nラン2 2:55 → スレッドプッシュ 4:30（152kgは体重の約2.7倍。最大の弱点）\nラン3 3:30 → スレッドプル 6:30（103kg。プッシュで脚を使い切った直後）\nラン4 3:10 → バーピーブロードジャンプ 3:00（軽さが武器）\nラン5 3:15 → ローイング 4:00（心肺の強さがそのまま出る）\nラン6 3:05 → ファーマーズキャリー 2:10（2×24kgは体重の約86%）\nラン7 3:10 → サンドバッグランジ 4:15（20kgは体重の約36%）\nラン8 3:45 → ウォールボール 7:00（6kgを3mの的へ100回）\n移動（ロックスゾーン）3:30\n\nランの合計25:35は、男子オープン世界記録（50:38）のラン27:42より約2分速い。でも種目で約16分負ける。\n※公開データをもとにした推計です。\n\nあなたなら、どの種目でこの男に勝てる？ コメントで教えて。\n\n出典：World Athletics（2026年7月公認 マラソン世界記録）、HYROX ルールブック 2026/27、hyresult（男子オープン世界記録 Cologne 2024）、RoxHype 種目別タイム（男子オープン 175,919人）・タイムの目安（2025/26）、Human Movement 17(1)（ケニアのトップ長距離選手の体格）',
    hashtags: ['もしもラボ', 'HYROX', 'ハイロックス', 'マラソン', 'フィットネスレース'],
    endStats: [['ラン 8km（推計）', '25分35秒', '1km平均3分12秒'], ['種目 8つ（推計）', '35分45秒', ''], ['推計タイム', '1時間4分50秒', '移動3分30秒込み'], ['男子オープン世界記録', '50分38秒', '2024年'], ['男子オープン上位10%', '1時間10分11秒以内', '2025/26'], ['マラソン世界記録', '1時間59分30秒', '2026年4月']],
    sources: '出典：World Athletics、HYROX ルールブック 2026/27、hyresult、<br>RoxHype（男子オープン 175,919人）、Human Movement 17(1)',
  },
});
