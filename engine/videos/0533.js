import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, makePerson, randPerson, poseWalk, SKIN, HAIR } from '../lib.js';
import { town, setTownEnv } from '../scenes/town.js';
import { field, setFieldEnv, setFruit } from '../scenes/field.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { makeBear, addMountains, makeGarbage, makeBearSign } from '../scenes/bear.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, el } from '../story.js';

// もしもクマが人を恐れなくなったら？（blueprint no 33。0033 は別の動画で使用済みのため id 0533）
// 数字（すべて環境省「クマに関する各種情報・取組」の速報値、2026年10月14日更新）
//   出没件数 2025年度 50,801件（北海道は公表なしで含まない。九州・沖縄は調査外）、うち10月 15,998件
//     https://www.env.go.jp/nature/choju/effort/effort12/syutubotu.pdf
//   人身被害 2025年度 216件・被害者238人（死亡13人を含む）＝過去最多。それまでの最多は2023年度の219人・死亡6人
//     https://www.env.go.jp/nature/choju/effort/effort12/injury-qe.pdf
//     年度別の被害者数：2019 157 / 2020 158 / 2021 88 / 2022 75 / 2023 219 / 2024 85 / 2025 238
//   許可捕獲数 2025年度 14,741頭、2024年度 5,345頭 → 約2.8倍（単純計算）
//     https://www.env.go.jp/nature/choju/effort/effort12/capture-qe.pdf
//   農作物被害 クマ 2025年度 9億円（前年度から+4.2億円）
//     農林水産省 全国の野生鳥獣による農作物被害状況（令和7年度） https://www.maff.go.jp/j/seisan/tyozyu/higai/hogai_zyoukyou/index.html
// 描写の決まり：人が襲われる場面は出さない（クマと人は必ず離れた場所。数字と字幕で淡々と）

// ---------- town: mountains, garbage, sign, kids ----------
addMountains(town, { z: -150 });
const tBear = makeBear(); tBear.scale.setScalar(1.15); town.add(tBear);
const garbage = makeGarbage(); garbage.position.set(-2.4, 0, -12); garbage.rotation.y = Math.PI / 2; town.add(garbage);
const sign = makeBearSign(textSprite); sign.position.set(-5.3, 0, -7.0); sign.rotation.y = 1.1; town.add(sign);
// 柿の木（町の庭）
const kaki = new THREE.Group(); kaki.position.set(-6.2, 0, -3.2); town.add(kaki);
{ const tr = box(0.35, 2.2, 0.35, mat('#6b4f3a')); tr.position.y = 1.1; kaki.add(tr); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), mat('#4f7f3a', { flatShading: true })); c.position.y = 2.8; c.castShadow = true; kaki.add(c);
  const r = rng(4); for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 5), mat('#ec8a2a')); const a = r() * 6.28, h = r() * 1.4 - 0.4; f.position.set(Math.cos(a) * 1.35, 2.8 + h, Math.sin(a) * 1.35); kaki.add(f); } }
const kids = [];
{
  const r = rng(12);
  for (let i = 0; i < 5; i++) {
    const p = randPerson(r, { scale: 0.68 });
    const bag = box(0.42, 0.5, 0.22, mat(['#c0392b', '#2c3e50', '#8e44ad', '#c0392b', '#2c3e50'][i])); bag.position.set(0, 1.15, -0.27); p.add(bag);
    const cap = box(0.46, 0.12, 0.44, mat('#f1d34a')); cap.position.y = 2.0; p.userData.head.add(cap); cap.position.set(0, 0.5, 0);
    town.add(p); kids.push(p);
  }
}
const adult = makePerson({ skin: SKIN[1], hair: HAIR[2], shirt: '#e2b23a', pants: '#3b3f4a', scale: 1 }); town.add(adult);
const vest = box(0.54, 0.5, 0.31, mat('#f2c230')); vest.position.y = 1.2; adult.add(vest);
function kidsWalk(t, { group = false, show = true } = {}) {
  kids.forEach((p, i) => {
    p.visible = show; if (!show) return;
    const z = group ? -12 + t * 1.0 - i * 0.75 : 9 - t * 1.1 - i * 2.2 - (i % 2) * 0.6;
    const x = group ? -4.3 + (i % 2) * 0.55 - 0.25 : -4.3 + (i % 2 ? 0.35 : -0.35);
    p.position.set(x, 0, z); p.rotation.y = group ? 0 : Math.PI; poseWalk(p, t * 7 + i, 0.8);
  });
  adult.visible = show && group; if (adult.visible) { adult.position.set(-3.6, 0, -11.4 + t * 1.0); adult.rotation.y = 0; poseWalk(adult, t * 6.5, 0.8); }
}

// ---------- field: bear in the orchard ----------
const fBear = makeBear(); field.add(fBear);
addMountains(field, { z: -90, color: '#557a4c' });

// ---------- stage: victims by year ----------
const YEARS = [[2019, 157], [2020, 158], [2021, 88], [2022, 75], [2023, 219], [2024, 85], [2025, 238]];
const BARS = YEARS.map(([y, v], i) => makeBar({ color: y === 2025 ? '#e0603a' : y === 2023 ? '#e0a03a' : '#4fa3d1', w: 1.3, d: 1.3, label: String(y), x: -6 + i * 2.0, z: 0, nameTop: false }));
const stageTitle = makeLabel('クマの被害に遭った人（年度別）', { sx: 9, w: 1024, h: 128, size: 60, bg: 'rgba(20,30,50,.0)' }); stageTitle.position.set(0, 9.6, -1); stage.add(stageTitle);
const H = v => v / 238 * 7;
function stageOn(on) { BARS.forEach(b => b.g.visible = on); stageTitle.visible = on; }

// ---------- shots ----------
function bearOnRoad(t, { x0 = -7, x1 = 0.5, z = -4, t0 = 0.4, dur = 1.6, after = 'stand' } = {}) {
  const u = clamp((t - t0) / dur);
  tBear.visible = true; tBear.position.set(lerp(x0, x1, ease(u)), 0, z); tBear.rotation.y = u < 1 ? 0 : lerp(0, -Math.PI / 2 * 0.75, ease((t - t0 - dur) / 0.8));
  tBear.userData.stand(0);
  tBear.userData.anim(t, { walk: u < 1 ? 1 : 0, head: 0.05 });
}
function hookCam(t) { look(lerp(1.7, 1.5, t / 4), 1.35, lerp(4.6, 4.2, t / 4), -0.8, 1.25, -6, 52); }
function townBase(env = 'day') { setTownEnv(env); garbage.userData.scatter(0); sign.visible = false; kidsWalk(0, { show: false }); tBear.visible = false; }

function shot0(t) { // hook: dusk road toward the mountains; bear walks out onto the road at ~1s
  townBase('dusk');
  bearOnRoad(t, { t0: 0.3, dur: 1.4 });
  hookCam(t);
  el.title.style.opacity = 1;
  setTop('クマの出没（2025年度・北海道除く）', '50,801件', 1, '#ffcf6a');
  return town;
}
function shot1(t) { // everyday: morning school route, kids walking, kaki tree
  townBase('day');
  kidsWalk(t + 1);
  const u = ease(t / 3.5);
  look(lerp(-0.5, -0.2, u), 2.4, lerp(10, 9, u), -4.5, 1.0, 0, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  return town;
}
function shot2(t) { // +1日: bear comes down into the orchard and eats fruit
  setFieldEnv('day'); setFruit(clamp(1 - Math.max(0, t - 3) * 0.06));
  lift(240);
  const u = clamp(t / 3.2);
  fBear.position.set(lerp(-3.2, -6.6, ease(u)), 0, lerp(-0.6, -3.0, ease(u))); fBear.rotation.y = lerp(2.5, 2.0, u);
  fBear.userData.stand(t > 3.6 ? ease((t - 3.6) / 0.8) * 0.8 : 0);
  fBear.userData.anim(t, { walk: u < 1 ? 1 : 0, head: t > 3.6 ? 0.3 : -0.1 });
  const v = ease(t / 8);
  look(lerp(-2.6, -3.4, v), lerp(2.6, 2.2, v), lerp(4.2, 3.0, v), -7.0, 1.2, -3.6, 50);
  hudTime('+1日');
  setTop('クマの出没（2025年度・北海道除く）', comma(countUp(t, 50801, 0.3, 1.6)) + '件', fade(t, 0.15, 8, 0.25), '#ffcf6a');
  return field;
}
function shot3(t) { // +1週間: night residential, bear at the garbage station
  townBase('night'); lift(200);
  const u = clamp(t / 2.4);
  tBear.visible = true; tBear.position.set(lerp(-2.2, -1.3, ease(u)), 0, lerp(-6.5, -10.0, ease(u))); tBear.rotation.y = lerp(Math.PI / 2, Math.PI * 0.62, u);
  tBear.userData.stand(0); tBear.userData.anim(t, { walk: u < 1 ? 1 : 0, head: u < 1 ? 0 : -0.5 });
  garbage.userData.scatter(clamp((t - 2.6) / 3));
  const v = ease(t / 8);
  look(lerp(3.2, 2.4, v), lerp(3.0, 2.6, v), lerp(-2.5, -3.6, v), -1.8, 0.7, -11, 52);
  hudTime('+1週間');
  setTop('10月の出没（2025年・北海道除く）', comma(countUp(t, 15998, 4.1, 1.3)) + '件', fade(t, 4.0, 8, 0.25), '#ffcf6a');
  return town;
}
function shot4(t) { // +1か月: orchard with most fruit gone, bear walking away
  setFieldEnv('dusk'); setFruit(0.25);
  lift(240);
  const u = clamp(t / 8);
  fBear.position.set(-9.6, 0, -1.9); fBear.rotation.y = -0.9; fBear.userData.stand(0); fBear.userData.anim(t, { walk: 0, head: -0.55 });
  look(lerp(-6.4, -6.0, u), lerp(2.5, 2.3, u), lerp(2.8, 2.2, u), -9.6, 0.9, -2.4, 52);
  hudTime('+1か月');
  if (t < 4.0) setTop('クマによる農作物の被害（2025年度）', countUp(t, 9, 0.4, 1.2) + '億円', fade(t, 0.15, 4.0, 0.2), '#ffcf6a');
  else setTop('クマによる農作物の被害 前年度から', '+4.2億円', fade(t, 4.0, 8, 0.2), '#ff8a7a');
  return field;
}
function shot5(t) { // +秋: school route with warning sign, kids in a group with an adult
  townBase('day'); sign.visible = true;
  kidsWalk(t, { group: true });
  const u = ease(t / 8.8);
  lift(150);
  look(lerp(1.0, 0.6, u), lerp(2.0, 1.9, u), lerp(4.0, 3.2, u), -3.6, 1.5, -7.2, 52);
  hudTime('+秋');
  if (t < 4.4) setTop('許可捕獲されたクマ（2025年度）', comma(countUp(t, 14741, 0.4, 1.4)) + '頭', fade(t, 0.15, 4.4, 0.2), '#ffcf6a');
  else setTop('許可捕獲数の前年度比（単純計算）', '約2.8倍', fade(t, 4.4, 8.8, 0.2), '#ff8a7a');
  return town;
}
function shot6(t) { // +1年: bar chart of victims per year; 2025 rises last
  lift(290); setStageColor('#14213a'); stageOn(true);
  BARS.forEach((b, i) => {
    const t0 = i < 6 ? 0.2 + i * 0.35 : 5.6;
    const k = ease(clamp((t - t0) / (i < 6 ? 0.7 : 1.4)));
    const v = YEARS[i][1];
    b.setH(Math.max(0.001, H(v) * k), k > 0.05 ? Math.round(v * k) + '人' : '');
  });
  const u = ease(t / 8.8);
  look(lerp(-0.8, 0.6, u), lerp(8.0, 7.6, u), lerp(32, 30, u), 0, 4.6, 0, 50);
  hudTime('+1年');
  setTop('これまでの最多（2023年度）', '219人', fade(t, 4.4, 8.8, 0.2), '#ffcf6a');
  return stage;
}
function shot7(t) { // result: dusk town, empty school route, only the bear on the road
  townBase('dusk'); garbage.userData.scatter(1); lift(220);
  tBear.visible = true; tBear.position.set(lerp(0.5, -0.4, t / 7.5), 0, lerp(-8, -5, t / 7.5)); tBear.rotation.y = Math.PI / 2 + 0.3; tBear.userData.stand(0); tBear.userData.anim(t, { walk: 0.6, head: 0 });
  const u = ease(t / 7.5);
  look(lerp(3.5, 2.6, u), lerp(2.2, 2.6, u), lerp(4.0, 6.5, u), -0.6, 1.2, -6, 52);
  setTop('クマの被害に遭った人（2025年度・うち死亡13人）', countUp(t, 238, 0.4, 1.2) + '人', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return town;
}
function shot8(t) { // loop: same as the hook, the bear standing on the road
  townBase('dusk'); garbage.userData.scatter(1);
  lift(160); bearOnRoad(t + 3, { t0: 0.3, dur: 1.4 });
  hookCam(t);
  return town;
}
function stageOff(f) { stageOn(f === shot6); if (f !== shot6) lift(0); }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 38.8, f: shot5 }, { a: 38.8, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { stageOff(f); return f(t, T); }; });

const SUBS = [
  [2.6, 6.0, '山のふもとの町。<br>いつもの朝の通学路。'],
  [6.2, 10.1, 'もしもクマが、<br>人を恐れなくなったら。'],
  [10.1, 14.0, '山から下りて、<br>畑の実を食べ始める。'],
  [14.2, 18.1, '夜は住宅街の<br>ゴミ置き場をあさる。'],
  [18.1, 22.0, 'いちばん多い10月は、<br>1か月で約1万6千件。'],
  [22.2, 26.1, '畑の被害は、<br>1年で9億円。'],
  [26.1, 30.0, '前の年より、<br>4.2億円も増えた。'],
  [30.2, 34.6, '通学路には、<br>クマ出没注意の看板。'],
  [34.6, 38.8, '捕まえたクマは、<br>前の年の約2.8倍。'],
  [39.0, 43.4, '被害に遭った人を、<br>年ごとに並べると…'],
  [43.6, 47.8, 'それまでの最多は、<br>2023年度の219人。'],
  [48.1, 53.8, '結果：1年で238人が<br>被害に遭い、13人が亡くなった。'],
  [53.9, 56.1, '全部、2025年度の<br>本当の数字。'],
  [56.2, 59.4, 'あなたの町、<br>クマは出る？出ない？'],
];

runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0533',
    title: 'クマが人を恐れなくなったら？',
    titleHtml: 'クマが人を<br>恐れなくなったら？',
    hookType: 'H3', cat: '生き物・動物',
    mood: 'tension', seed: 533, hits: [1.0, 48.1], risers: [44.0],
    impacts: [7.9, 48.6],
    sfx: [[0.6, 'whoosh'], [16.6, 'meter', 0.3], [41.0, 'meter', 0.5]],
    narr: { '1万6千件': 'いちまんろくせん件', '2.8倍': '2.8倍' },
    ask: 'あなたの町、クマは出る？出ない？',
    caption: 'もしもクマが人を恐れなくなったら？\n山から畑へ、畑から住宅街のゴミ置き場へ。通学路にはクマ出没注意の看板が立ち、子どもは大人と一緒に登校する。\n実はこれ、全部2025年度に本当に起きた数字。クマの出没は1年で50,801件（北海道を除く）、いちばん多い10月だけで15,998件。クマによる農作物の被害は9億円で前年度から4.2億円増え、許可捕獲されたクマは14,741頭（前年度の約2.8倍・単純計算）。\n結果、クマの被害に遭った人は1年で238人、亡くなった人は13人。どちらも過去最多。\n\nあなたの町、クマは出る？出ない？ コメントで教えて。\n\n出典：環境省「クマの出没情報」「クマによる人身被害件数」「クマの許可捕獲数」（いずれも速報値、2026年10月14日更新）、農林水産省「全国の野生鳥獣による農作物被害状況（令和7年度）」',
    hashtags: ['もしもラボ', 'クマ', 'クマ出没', '野生動物', '雑学'],
    endStats: [['クマの出没', '50,801件', '2025年度・北海道除く'], ['10月の出没', '15,998件', '2025年'], ['クマによる農作物の被害', '9億円', '2025年度'], ['許可捕獲されたクマ', '14,741頭', '2025年度'], ['被害に遭った人（死亡13人）', '238人', '2025年度・過去最多']],
    sources: '出典：環境省 クマの出没情報・人身被害件数・許可捕獲数<br>（速報値、2026年10月14日更新）、<br>農林水産省 野生鳥獣による農作物被害状況（令和7年度）',
  },
});
