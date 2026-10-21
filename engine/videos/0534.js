import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, makePerson, poseWalk, SKIN, HAIR } from '../lib.js';
import { bank, setBankEnv, setATM, makeQueue, setShutter, bankSign } from '../scenes/bank.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, setTop, setHud, el } from '../story.js';

// もしも全員が同時に預金を下ろしに行ったら？（blueprint no 34。0034 は別の動画で使用済みのため id 0534）
// 数字：
//   日本の預金 約1,530兆円 ＝ マネーストック M3 の 預金通貨977.6＋準通貨531.2＋CD21.3（2026年8月 平均残高・速報、兆円）
//     日本銀行 マネーストック速報 https://www.boj.or.jp/statistics/money/ms/ms2608.pdf
//   日本銀行券の発行高 114.6兆円（2026年9月 平均残高 1,146,005億円）
//     日本銀行 マネタリーベース https://www.boj.or.jp/statistics/boj/other/mb/base2609.pdf
//   お札÷預金 ＝ 114.6÷1,530.1 ≒ 7.5%（単純計算）→ 預金100万円あたり約7万5千円
//   全国銀行 実質預金 9,743,324億円（約974兆円）、総貸出残高 6,426,262億円（約643兆円）→ 約66%（単純計算）
//     全国銀行協会 全国銀行預金・貸出金等速報（2026年8月末） https://www.zenginkyo.or.jp/fileadmin/res/abstract/stats/month1_01/yokashi04413.pdf
//   預金保険：一般預金等は1金融機関ごとに預金者1人あたり元本1,000万円とその利息まで、決済用預金は全額（預金保険機構） https://www.dic.go.jp/yokinsha/page_000016.html
// 銀行は架空（もしも銀行）。実在の銀行の名前・ロゴ・色は使わない。投資助言ではなく公式統計による単純計算。

// ---------- bank set ----------
const Q = makeQueue(90, 34);
const solo = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#3f8f6b', pants: '#2b3346' }); bank.add(solo);
const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
const TP = 1.4;
function bankBase(env = 'day') { setBankEnv(env); bankSign.visible = true; setShutter(0); [0, 1, 2].forEach(i => setATM(i, 'ok')); solo.visible = false; Q.set(0, 0); }

// ---------- stage: bars and bill stacks ----------
const barDep = makeBar({ color: '#4fa3d1', w: 2.4, d: 2.4, label: '預金', x: -2.2, z: 0 });
const barCash = makeBar({ color: '#f2c14e', w: 2.4, d: 2.4, label: 'お札', x: 2.2, z: 0 });
const barDep2 = makeBar({ color: '#4fa3d1', w: 2.4, d: 2.4, label: '預金', x: -2.2, z: 0 });
const barLoan = makeBar({ color: '#e0603a', w: 2.4, d: 2.4, label: '貸出', x: 2.2, z: 0 });
const pairA = [barDep, barCash], pairB = [barDep2, barLoan];
const stTitle = makeLabel('', { sx: 8, w: 1024, h: 128, size: 60 }); stTitle.position.set(0, 8.0, -1); stage.add(stTitle);
// 100 bills (1万円×100 ＝ 100万円) — generic cream notes
const billG = new THREE.Group(); billG.position.set(0, 0.3, 0); stage.add(billG);
const bills = [];
{ const r = rng(9); const bm = mat('#e9dfc4'), bm2 = mat('#ddd0ae'); for (let i = 0; i < 100; i++) { const b = box(3.2, 0.05, 1.5, i % 2 ? bm : bm2); b.position.set((r() - .5) * 0.06, 0.03 + i * 0.055, (r() - .5) * 0.06); b.rotation.y = (r() - .5) * 0.04; billG.add(b); bills.push(b); } }
const band = box(0.5, 5.6, 1.56, mat('#7d8a99')); band.position.set(0, 2.78, 0); billG.add(band);
function setBills(k, bandOn) { const n = Math.floor(k), fr = k - n; bills.forEach((b, i) => { b.visible = i < n || (i === n && fr > 0.05); b.scale.x = i === n ? Math.max(0.05, fr) : 1; }); band.visible = bandOn; }
function stageMode(m) {
  pairA.forEach(b => b.g.visible = m === 'A'); pairB.forEach(b => b.g.visible = m === 'B'); billG.visible = m === 'C'; stTitle.visible = m === 'A' || m === 'B';
}

// ---------- shots ----------
function hookCam(t) { lift(60); const u = ease(t / 4); look(lerp(3.6, 3.2, u), 2.1, lerp(11, 10.5, u), -1.6, 1.5, -0.5, 50); }
function shot0(t) { // hook: countdown at the ATM corner, at 0 the crowd rushes in
  bankBase('day');
  solo.visible = t < TP; solo.position.set(-4.9, 0.14, 0.4 - 0.9); solo.rotation.y = Math.PI; poseWalk(solo, 0, 0);
  if (t >= TP) Q.set(60, t, { arrive: clamp((t - TP) / 0.5) });
  el.flash.style.opacity = t >= TP ? 0.5 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t); bankSign.visible = false; // タイトルと看板の文字が重ならないように
  el.title.style.opacity = 1;
  setHud('全員が預金を下ろすまで', cd(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return bank;
}
function shot1(t) { // everyday: quiet ATM, one person
  bankBase('day');
  solo.visible = true; solo.position.set(-4.9, 0.14, -0.4); solo.rotation.y = Math.PI; poseWalk(solo, 0, 0); solo.userData.arms[0].rotation.x = -0.6 - Math.sin(t * 3) * 0.1;
  const u = ease(t / 3.5);
  look(lerp(-1.5, -1.0, u), 1.9, lerp(6.5, 6.0, u), -4.9, 1.3, -1, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return bank;
}
function shot2(t) { // +1分: the line stretches down the street
  lift(160);
  bankBase('day'); Q.set(90, t + 2, { look: 1 });
  const u = ease(t / 8);
  look(lerp(-3.0, 4.0, u), lerp(4.5, 6.5, u), lerp(9.5, 11.5, u), lerp(4, 10, u), 1.0, 1.5, 50);
  hudTime('+1分');
  setTop('日本の預金（2026年8月・M3）', comma(countUp(t, 1530, 4.1, 1.4)) + '兆円', fade(t, 4.0, 8, 0.25), '#7ff0c8');
  return bank;
}
function shot3(t) { // +1時間: ATM screens turn red one by one
  lift(120);
  bankBase('day'); Q.set(90, t + 10, { look: 1, qsOn: t > 2.2 });
  [0, 1, 2].forEach(i => setATM(i, t > 1.0 + i * 0.6 ? 'empty' : 'ok'));
  const u = ease(t / 8);
  look(lerp(-2.6, -2.0, u), lerp(1.9, 2.1, u), lerp(4.2, 5.0, u), -4.9, 1.35, -1.0, 50);
  hudTime('+1時間');
  setTop('日本銀行券の発行高（2026年9月）', (countUp(t * 10, 1146, 41, 13) / 10).toFixed(1) + '兆円', fade(t, 4.0, 8, 0.25), '#ffcf6a');
  return bank;
}
const HB = v => v / 1530.1 * 6.0;
function shot4(t) { // +1日: deposits vs all the bills
  lift(260); setStageColor('#14213a'); stageMode('A'); stTitle.userData.set('日本の預金と、日本中のお札');
  const k1 = ease(clamp((t - 0.2) / 1.2)), k2 = ease(clamp((t - 1.4) / 1.0));
  barDep.setH(HB(1530.1) * k1, k1 > 0.05 ? comma(Math.round(1530 * k1)) + '兆円' : '');
  barCash.setH(HB(114.6) * k2, k2 > 0.05 ? (114.6 * k2).toFixed(1) + '兆円' : '');
  const u = ease(t / 8);
  look(lerp(-1.2, 0.8, u), 5.0, lerp(20, 19, u), 0, 3.6, 0, 50);
  hudTime('+1日');
  setTop('お札÷預金（単純計算）', '約' + (countUp(t * 10, 75, 43, 12) / 10).toFixed(1) + '%', fade(t, 4.2, 8, 0.25), '#ff8a7a');
  return stage;
}
const HB2 = v => v / 974.3 * 6.0;
function shot5(t) { // +1週間: where the money is — lent out
  lift(260); setStageColor('#1a1f33'); stageMode('B'); stTitle.userData.set('全国銀行の預金と貸出');
  const k1 = ease(clamp((t - 0.2) / 1.0)), k2 = ease(clamp((t - 1.0) / 1.2));
  barDep2.setH(HB2(974.3) * k1, k1 > 0.05 ? Math.round(974 * k1) + '兆円' : '');
  barLoan.setH(HB2(642.6) * k2, k2 > 0.05 ? Math.round(643 * k2) + '兆円' : '');
  const u = ease(t / 8.8);
  look(lerp(1.0, -0.8, u), 5.0, lerp(20, 19, u), 0, 3.6, 0, 50);
  hudTime('+1週間');
  if (t < 4.4) setTop('全国銀行の貸出金（2026年8月末）', countUp(t, 643, 1.0, 1.4) + '兆円', fade(t, 0.15, 4.4, 0.2), '#ff8a7a');
  else setTop('預金に対する貸出（単純計算）', '約66%', fade(t, 4.4, 8.8, 0.2), '#ff8a7a');
  return stage;
}
function shot6(t) { // +1か月: 100万円 stack shrinks to the share of bills
  lift(330); setStageColor('#14213a'); stageMode('C');
  const shrink = ease(clamp((t - 4.8) / 2.6));
  const k = t < 4.8 ? Math.round(100 * ease(clamp(t / 1.6))) : lerp(100, 7.5, shrink);
  setBills(k, t > 1.6 && t < 4.8);
  const u = ease(t / 8.8);
  look(lerp(5.0, 4.0, u), lerp(6.5, 5.0, u), lerp(9.5, 8.5, u), 0, lerp(2.6, 1.6, u), 0, 50);
  hudTime('+1か月');
  if (t < 4.4) setTop('たとえば預金が', '100万円', fade(t, 0.15, 4.4, 0.2), '#7ff0c8');
  else setTop('お札を全員で分けると（単純計算）', '約' + lerp(100, 7.5, shrink).toFixed(1) + '万円', fade(t, 4.4, 8.8, 0.2), '#ff8a7a');
  return stage;
}
function shot7(t) { // result: dusk, shutters down, the line is still there, screens red
  lift(150);
  bankBase('dusk'); setShutter(ease(clamp(t / 2.5)) * 0.85); [0, 1, 2].forEach(i => setATM(i, 'empty'));
  Q.set(90, t + 20, { look: 1, qsOn: true });
  const u = ease(t / 7.5);
  look(lerp(9, 7, u), lerp(3.2, 2.6, u), lerp(11, 10, u), -1, 1.8, -0.5, 50);
  setTop('預金100万円あたりのお札（単純計算）', '約' + (countUp(t * 10, 75, 4, 12) / 10).toFixed(1) + '万円', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return bank;
}
function shot8(t) { // loop: like the hook, the crowd at the ATM corner
  bankBase('dusk'); setShutter(0.85); [0, 1, 2].forEach(i => setATM(i, 'empty'));
  Q.set(60, t + 30, { look: 1 });
  hookCam(t);
  setHud('全員が預金を下ろすまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  return bank;
}
function stageOff(f) { if (![shot4, shot5, shot6].includes(f)) stageMode(''); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 38.8, f: shot5 }, { a: 38.8, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { stageOff(f); return f(t, T); }; });

const SUBS = [
  [2.6, 6.0, 'いつもの昼。<br>ATMはすいている。'],
  [6.2, 10.1, 'もしも全員が一斉に、<br>預金を全部下ろしに来たら。'],
  [10.1, 14.0, '日本の預金は、<br>全部で約1,530兆円。'],
  [14.2, 18.1, 'ATMのお札が、<br>次々に空になる。'],
  [18.1, 22.0, '日本中のお札を集めても、<br>約115兆円しかない。'],
  [22.2, 26.1, '預金に比べると、<br>お札は1割にも届かない。'],
  [26.1, 30.0, '残りのお金は、<br>どこにあるのか。'],
  [30.2, 34.6, '銀行は預金の多くを、<br>家や会社に貸している。'],
  [34.6, 38.8, 'だから全員には、<br>一度に払えない。'],
  [39.0, 43.4, 'もし、あなたが<br>100万円預けていたら…'],
  [43.6, 47.8, 'お札を全員で<br>分けると…'],
  [48.1, 53.8, '結果：100万円預けた人も、<br>下ろせたのは約7万5千円。'],
  [53.9, 56.1, '銀行は、<br>信用で回っている。'],
  [56.2, 59.4, 'あなたは家に現金、<br>いくら置いてる？'],
];

runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0534',
    title: '全員が同時に預金を下ろしに行ったら？',
    titleHtml: '全員が同時に<br>預金を下ろしたら？',
    hookType: 'H1', cat: 'お金・経済',
    mood: 'tension', seed: 534, hits: [1.4, 48.1], risers: [44.5],
    impacts: [10.6, 18.6, 48.6],
    sfx: [[1.4, 'whoosh'], [15.0, 'alarm'], [44.0, 'meter', 0.4]],
    narr: { '1,530兆円': '1530兆円', '約7万5千円': '約7万5千円' },
    ask: 'あなたは家に現金、いくら置いてる？',
    caption: 'もしも日本中の全員が、同時に預金を全部下ろしに行ったら？\nATMには行列ができ、お札は次々に空に。日本の預金は約1,530兆円（2026年8月・M3）あるのに、日本中のお札（日本銀行券の発行高）は約114.6兆円（2026年9月）。お札は預金の約7.5%しかない（単純計算）。\n銀行は預かったお金の多くを家や会社に貸していて、全国銀行だと預金約974兆円に対して貸出は約643兆円（2026年8月末、約66%・単純計算）。\n結果、100万円預けていた人も、お札を全員で分けると下ろせるのは約7万5千円（単純計算）。銀行は、みんなの信用で回っている。\nちなみに銀行が破綻しても、預金は1つの銀行ごとに1人あたり元本1,000万円とその利息まで（決済用預金は全額）預金保険で守られる。\n※投資のすすめではなく、公式統計をもとにした単純計算です。\n\nあなたは家に現金、いくら置いてる？ コメントで教えて。\n\n出典：日本銀行 マネーストック（2026年8月速報）・マネタリーベース（2026年9月）、全国銀行協会 全国銀行預金・貸出金等速報（2026年8月末）、預金保険機構「保護の範囲」',
    hashtags: ['もしもラボ', '預金', '銀行', 'お金の雑学', '取り付け騒ぎ'],
    endStats: [['日本の預金（M3）', '約1,530兆円', '2026年8月'], ['日本銀行券の発行高', '約114.6兆円', '2026年9月'], ['お札÷預金', '約7.5%', '単純計算'], ['全国銀行の貸出金', '約643兆円', '2026年8月末'], ['預金100万円あたりのお札', '約7.5万円', '単純計算']],
    sources: '出典：日本銀行 マネーストック・マネタリーベース（2026年）、<br>全国銀行協会 預金・貸出金等速報（2026年8月末）、預金保険機構',
  },
});
