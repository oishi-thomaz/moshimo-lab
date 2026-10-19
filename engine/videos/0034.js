import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade, comma } from '../lib.js';
import { sofaRoom, setFigure, setThumbs, THUMBS, setRoomDark } from '../scenes/sofa.js';
import { stage, makeBar, makeCoins, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも野獣先輩が全員訴えたら、いくら？（注意喚起の回）
// 方針：本人の姿・似せた人物・元の映像の場面（行為や台詞）・決まり文句は出さない。人物は顔のない灰色の人影だけ。
//       ソファと背景はセットとして再現するが、人は座らせない（空のソファ）。
// 数字
//   ニコニコ動画のタグ「野獣先輩」の動画 13,698本（2026年10月20日 タグ検索の件数）
//   元の映像は2001年の作品。2002年に報道で広く知られた（週刊女性PRIME 2025年4月5日）。本人は名前も居場所も知られていない一般人（週刊女性PRIME 2025年3月22日）
//   判例：なりすまし投稿 大阪地裁 2017年8月30日 慰謝料60万円・発信者特定の調査費用58万6,000円（全額）・弁護士費用12万円 → 合計130万6,000円（モノリス法律事務所の解説記事）
//   単純計算：13,698本 × 130.6万円 ＝ 178億8,959万円 ≒ 約179億円（1本＝1人の投稿者とみなした仮定）
//   ログ：総務省 報告書（令和7年9月）SNSなどに通信履歴を「少なくとも3〜6か月程度」保存することが望ましい（義務ではない）
//   時効：不法行為の損害賠償は、損害と加害者を知った時から3年（民法724条）
// 着地：投稿した1人あたりの重さ（約131万円の可能性）で言い切る。

const RED = '#ff8a7a', GOLD = '#ffe08a', BLUE = '#7fd4ff';
const POSTS = 13698, PER = 130.6; // 万円
const TOTAL_OKU = POSTS * PER / 1e4; // 178.9億円

// ---------- thumbnail choreography ----------
function swirl(t, k = 1) { // dark hook: tiles stream toward the camera in a tunnel
  setThumbs((i, r) => {
    if (i > THUMBS * k) return null;
    const a = r[0] * 6.283 + t * (0.25 + r[1] * 0.2);
    const rad = 1.2 + r[1] * 3.2;
    const z = ((r[2] * 14 + t * 3.2) % 14) - 10;
    return { x: Math.cos(a) * rad, y: 1.2 + Math.sin(a) * rad * 0.75, z, ry: 0, s: 1 };
  });
}
function orbit(t, n, burial = 0) { // tiles circle the figure, then pile on it
  const fx = 2.25, fz = 0.55;
  setThumbs((i, r) => {
    if (i >= n) return null;
    const a = r[0] * 6.283 + t * (0.5 + r[1] * 0.4);
    const rad = 0.7 + r[1] * 1.5, h = 0.3 + r[2] * 2.4;
    const ox = fx + Math.cos(a) * rad, oz = fz + Math.sin(a) * rad, oy = h;
    // pile: a mound centred on the figure
    const pr = Math.sqrt(r[1]) * 1.25, pa = r[0] * 6.283;
    const px = fx + Math.cos(pa) * pr, pz = fz + Math.sin(pa) * pr * 0.9, py = 0.05 + (1.25 - pr) * 1.7 * r[2] + 0.02 * (i % 7);
    const b = clamp(burial * 1.3 - r[2] * 0.3);
    return { x: lerp(ox, px, b), y: lerp(oy, py, b), z: lerp(oz, pz, b), ry: a + Math.PI / 2, rx: lerp(0, -1.2 + r[0] * 0.8, b), rz: lerp(0, r[1] - 0.5, b), s: 1 };
  });
}

// ---------- stage: one judgment (bars) ----------
const HB = 4.4 / 130.6;
const bA = makeBar({ color: '#ff8a7a', label: '慰謝料', x: -3.0, w: 1.9, d: 1.9, nameTop: true });
const bB = makeBar({ color: '#7fd4ff', label: '特定の費用', x: 0, w: 1.9, d: 1.9, nameTop: true });
const bC = makeBar({ color: '#c9b6ff', label: '弁護士費用', x: 3.0, w: 1.9, d: 1.9, nameTop: true });
const bT = makeBar({ color: '#ffe08a', label: '1件の合計', x: 0, w: 2.6, d: 2.6, nameTop: true });
const judgBars = [bA, bB, bC, bT];
// ---------- stage: 1 stack = 1 post ----------
const COLS = 12, ROWS = 8;
const stacks = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) stacks.push(makeCoins(-6.05 + c * 1.1, -3.6 + r * 1.05, 13));
const stackLab = makeLabel('1山＝投稿1本', { sx: 3.6, size: 60, color: GOLD }); stackLab.position.set(0, 2.6, -1.0); stage.add(stackLab);
const coinSpark = makeSparkles(300, 0.35); stage.add(coinSpark.points);
coinSpark.init([[-4, 1, -2], [0, 1, 0], [4, 1, 2], [-2, 1.5, 2], [3, 1.5, -2]], 3, 3);
function stageMode(m) { judgBars.forEach(b => { b.g.visible = m === 'judg'; }); stacks.forEach(s => { s.g.visible = m === 'coins'; }); stackLab.visible = m === 'coins'; if (m !== 'coins') coinSpark.set(0); }

const SUBS = [
  [2.6, 6.0, '2001年のある映像に、<br>一般人が映っていた。'],
  [6.2, 10.1, 'その人は芸能人ではない。<br>名前も知られていない。'],
  [10.1, 14, 'なのに20年以上、<br>同意なくネタにされてきた。'],
  [14.2, 18.1, 'ニコニコで野獣先輩の<br>タグがついた動画は…'],
  [18.1, 22, '1万3,698本<br>（2026年10月）。'],
  [22.2, 26.1, 'ネットの権利侵害で、ある<br>判決の慰謝料は60万円。'],
  [26.1, 30, '特定の費用と弁護士費用で、<br>1件 約131万円に。'],
  [30.2, 34.6, 'これを1万3,698本<br>全部に当てはめると…'],
  [34.6, 39, '約179億円<br>（単純計算）。'],
  [39.2, 43.6, 'でも投稿者をたどるログは、<br>3〜6か月で消えることも。'],
  [43.6, 47.8, '時効は相手を知って3年。<br>取れるのは、ほんの一部。'],
  [48.1, 53.8, '結果：あなたの1回の投稿で、<br>約131万円払う可能性がある。'],
  [53.9, 56.1, '本人は今も、<br>名乗り出られないまま。'],
  [56.2, 59.4, '昔ネタで上げたもの、<br>今から消す？'],
];

function shot0(t, T) { // hook: dark tunnel of blurred thumbnails
  setRoomDark(1); setFigure(0); swirl(T, clamp(0.3 + T / 2.5));
  look(0, 1.2, 4.5 - t * 0.4, 0, 1.2, -6, 55);
  el.title.style.opacity = 1;
  setHud('野獣先輩タグの動画（ニコニコ）', comma(countUp(T, POSTS, 0.1, 2.2)) + '本', 1, { mono: true });
  return sofaRoom;
}
function shot1(t, T) { // the empty sofa set
  setRoomDark(clamp(1 - t / 0.6)); setFigure(0); setThumbs(null);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  lift(160); const u = ease(t / 3.5);
  look(lerp(-0.2, -0.4, u), lerp(1.7, 1.6, u), lerp(10.5, 9.6, u), -0.5, 1.15, -1.3, 50);
  setHud('野獣先輩タグの動画（ニコニコ）', comma(POSTS) + '本', 1, { mono: true });
  return sofaRoom;
}
function shot2(t, T) { // the faceless figure appears; tiles start to circle
  setRoomDark(0); setFigure(easeOut(clamp((t - 0.3) / 1.2)));
  orbit(T, Math.round(260 * easeOut(clamp((t - 3.5) / 4))));
  lift(220); const u = ease(t / 8);
  look(lerp(0.2, 0.8, u), lerp(1.7, 1.8, u), lerp(9.6, 8.6, u), 0.6, 1.15, -0.6, 50);
  if (t < 4) setTop('元の映像が出た年', countUp(t, 2001, 0.2, 1.0) + '年', fade(t, 0.15, 4, 0.2));
  else setTop('ネタにされてきた年月', '20年以上', fade(t, 4, 8, 0.2), RED);
  return sofaRoom;
}
function shot3(t, T) { // tiles pile up and bury the figure
  setRoomDark(clamp((t - 4) / 4) * 0.35); setFigure(1);
  const n = Math.round(lerp(260, THUMBS, easeOut(clamp(t / 4))));
  orbit(T, n, easeOut(clamp((t - 3.6) / 3)));
  lift(240); const u = ease(t / 8);
  look(lerp(0.9, 0.5, u), lerp(1.9, 2.8, u), lerp(8.4, 9.6, u), 1.2, 1.0, -0.2, 50);
  setTop('野獣先輩タグの動画（ニコニコ・2026年10月）', comma(countUp(t, POSTS, 0.3, 4.2)) + '本', fade(t, 0.15, 8, 0.25), RED);
  return sofaRoom;
}
function shot4(t, T) { // one judgment: 60 + 58.6 + 12 -> 130.6
  lift(200); stageMode('judg');
  const g = k => easeOut(clamp((t - 0.3 - k * 0.5) / 1.1));
  const merge = easeOut(clamp((t - 4.4) / 1.0));
  [[bA, 60, '60万円'], [bB, 58.6, '58.6万円'], [bC, 12, '12万円']].forEach(([b, v, s], k) => { b.g.visible = merge < 0.98; b.setH(v * HB * g(k) * (1 - merge), merge < 0.05 && g(k) > 0.05 ? s : ''); });
  bT.g.visible = merge > 0.02; bT.setH(130.6 * HB * merge, merge > 0.6 ? '130.6万円' : '');
  const u = ease(t / 8);
  look(lerp(-0.6, 0.6, u), lerp(5.0, 4.8, u), lerp(17.5, 16.8, u), 0, 2.4, 0, 50);
  if (t < 4.1) setTop('慰謝料（大阪地裁 2017年）', countUp(t, 60, 0.3, 1.1) + '万円', fade(t, 0.15, 4.1, 0.2), RED);
  else setTop('1件の判決の合計（慰謝料＋特定の費用＋弁護士費用）', '約' + countUp(t - 4.1, 131, 0.3, 1.0) + '万円', fade(t, 4.1, 8, 0.2), GOLD);
  return stage;
}
function shot5(t, T) { // 1 stack = 1 post, the field fills up
  lift(300); stageMode('coins');
  const fill = easeOut(clamp((t - 0.3) / 3.8));
  stacks.forEach((s, i) => { const k = clamp(fill * 1.6 - (i / stacks.length) * 0.6); s.setN(Math.round(13 * k)); });
  coinSpark.set(clamp((t - 4.4) / 2.5));
  const u = ease(t / 9.2);
  look(lerp(0, 0, u), lerp(9.5, 12.5, u), lerp(14.5, 17.5, u), 0, 0.4, -0.6, 50);
  if (t < 4.4) setTop('投稿の数（野獣先輩タグ・ニコニコ）', comma(countUp(t, POSTS, 0.3, 3.8)) + '本', fade(t, 0.15, 4.4, 0.2), RED);
  else setTop('全部に当てはめると（単純計算）', '約' + countUp(t - 4.4, Math.round(TOTAL_OKU), 0.2, 1.4) + '億円', fade(t, 4.4, 9.2, 0.2), GOLD);
  return stage;
}
function shot6(t, T) { // the trail fades: tiles dissolve one by one
  setRoomDark(0.55); setFigure(0.5);
  const gone = easeOut(clamp((t - 0.6) / 6.5));
  // overwrite: drop tiles as the logs vanish
  setThumbs((i, r) => { if (r[0] < gone * 0.93) return null; const pr = Math.sqrt(r[1]) * 1.25, pa = r[0] * 6.283; return { x: 2.25 + Math.cos(pa) * pr, y: 0.05 + (1.25 - pr) * 1.7 * r[2] + 0.02 * (i % 7), z: 0.55 + Math.sin(pa) * pr * 0.9, rx: -1.2 + r[0] * 0.8, rz: r[1] - 0.5, ry: pa, s: 1 }; });
  lift(240); const u = ease(t / 8.8);
  look(lerp(0.4, 0.8, u), lerp(2.4, 2.1, u), lerp(9.4, 8.6, u), 1.0, 1.0, -0.3, 50);
  if (t < 4.4) setTop('投稿者をたどるログの保存（総務省の目安）', '3〜6か月', fade(t, 0.15, 4.4, 0.2), BLUE);
  else setTop('損害賠償の時効（民法724条）', '相手を知って3年', fade(t, 4.4, 8.8, 0.2), BLUE);
  return sofaRoom;
}
function shot7(t, T) { // result: the empty sofa, a faint figure
  setRoomDark(0); setFigure(0.35); setThumbs(null);
  lift(260); const u = ease(t / 7.5);
  look(lerp(-0.2, -0.4, u), lerp(1.7, 1.6, u), lerp(10.2, 9.4, u), -0.5, 1.15, -1.2, 50);
  if (t < 5.8) setTop('1回の投稿で払う可能性（判例1件の合計）', '約' + countUp(t, 131, 0.2, 1.2) + '万円', fade(t, 0.15, 5.8, 0.2), GOLD);
  else setTop('本人の名前', '今も知られていない', fade(t, 5.8, 7.5, 0.2));
  return sofaRoom;
}
function shot8(t, T) { // loop: back into the dark tunnel
  setRoomDark(clamp(t / 0.6)); setFigure(0); swirl(T, 1);
  look(0, 1.2, 4.5 - t * 0.1, 0, 1.2, -6, 55);
  setHud('野獣先輩タグの動画（ニコニコ）', comma(POSTS) + '本', 1, { mono: true });
  return sofaRoom;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0034',
    title: '野獣先輩が全員訴えたら、いくら？',
    titleHtml: '野獣先輩が全員<br>訴えたらいくら？',
    mood: 'mystery', seed: 34, hits: [6.2, 48.1], risers: [14.0, 46.0],
    impacts: [18.1, 34.6, 48.1],
    ask: '昔ネタで上げたもの、今から消す？',
    narr: { '1万3,698本': '1万3698本', '（2026年10月）': '', '3〜6か月': '3から6か月' },
    caption: 'もしも野獣先輩が、ネタにした人を全員訴えたら、いくらになる？\n\nこの動画は、ネットミームの重さを数字で知ってもらうための注意喚起です。本人の姿は使っていません。\n\n元の映像は2001年。映っていたのは芸能人ではなく、名前も知られていない一般人。それでも20年以上、本人の同意なくネタにされ続けてきた。\n\nニコニコ動画で野獣先輩のタグがついた動画は1万3,698本（2026年10月）。\nネットの権利侵害のある判決（大阪地裁 2017年）では、慰謝料60万円＋投稿者を特定する費用58.6万円＋弁護士費用12万円＝約131万円が認められた。\n全部に当てはめると約179億円（単純計算・1本1人とみなした場合）。\n\n実際は、投稿者をたどるログは3〜6か月で消えることもあり、時効は相手を知ってから3年。取れるのはほんの一部。\n\n結果：あなたの軽い1回の投稿で、約131万円を払う可能性がある。本人は今も名乗り出られないまま。\n※判例の金額は事案ごとに大きく変わります。法的な助言ではありません。\n\n昔ネタで上げたもの、今から消す？ コメントで教えて。\n\n出典：ニコニコ動画 タグ検索（2026年10月20日）、モノリス法律事務所（大阪地裁 2017年8月30日判決ほかの解説）、総務省 ICTサービスの利用環境整備に関する報告書（令和7年9月）、民法724条、週刊女性PRIME（2025年3月22日・4月5日）',
    hashtags: ['もしもラボ', '野獣先輩', 'ネットリテラシー', '肖像権', '誹謗中傷'],
    endStats: [['野獣先輩タグの動画', '1万3,698本', 'ニコニコ・2026年10月'], ['判決1件の合計', '約131万円', '大阪地裁 2017年'], ['全部に当てはめると', '約179億円', '単純計算'], ['ログ保存の目安', '3〜6か月', '総務省'], ['時効', '相手を知って3年', '民法724条']],
    sources: '出典：ニコニコ動画 タグ検索（2026年10月）、モノリス法律事務所（判例解説）、<br>総務省 報告書（令和7年9月）、民法724条、週刊女性PRIME（2025年）',
  },
});
