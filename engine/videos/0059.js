import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, canvasTex, makePerson, makeQ, SKIN, HAIR } from '../lib.js';
import { grocer, setStock, setSoldOut, tagsOn, setGrocerLight, SIGNS } from '../scenes/grocer.js';
import { stage, makeBar, setStageColor } from '../scenes/stage.js';
import { room, setRoom, setLight, props } from '../scenes/room.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも米5kgが1万円になったら？（blueprint no 59・お財布のもしもシリーズ）
// 数字：
//  スーパーの米 5kg 平均販売価格（全国約1,000店舗の POS、税込）：2026年10月19〜25日 2,788円／前年同週（2025年10月20〜26日）4,208円／
//   掲載期間の最高値 4,416円（2025年12月29日〜2026年1月4日）（農林水産省 KSP-POS データ、2026年10月30日公表）
//   https://www.maff.go.jp/j/nousan/kokumotu/ksppos.pdf
//  1世帯（二人以上の世帯）の米の年間購入数量：2025年 61,310g（総務省 家計調査。農林水産省「世帯当たりの購入数量の推移」）
//   https://www.maff.go.jp/j/syouan/keikaku/soukatu/attach/pdf/r6_kome_ryutu-492.pdf
//  1人1年あたりの米の供給純食料：2024年度（概算）53.4kg／1965年度 111.7kg（農林水産省「令和6年度食料需給表」2025年10月10日公表）
//   https://www.maff.go.jp/j/press/kanbo/anpo/attach/pdf/251010-2.pdf
//  計算（単純計算）：1万円/5kg＝2,000円/kg。いま 2,788÷5＝557.6円/kg
//   1世帯：61.31kg×557.6＝34,186円（約3.4万円）→ ×2,000＝122,620円（約12.3万円）。差 88,434円（約8.8万円）。月 122,620÷12＝約1.0万円
//   1人：53.4kg×2,000＝106,800円（約10.7万円）。いま 53.4×557.6＝29,776円（約3.0万円）
//   10,000÷2,788＝3.59（約3.6倍）

const GOLD = '#ffd27a', RED = '#ff8a7a', BLUE = '#7fd4ff', GREEN = '#7ff0c8';

// ---------- grocer: big price tag over the rice stack + shoppers ----------
const tag = new THREE.Group(); grocer.add(tag);
const tagBoard = box(1.9, 0.95, 0.06, mat('#ffffff')); tag.add(tagBoard);
const tagRim = box(2.0, 1.05, 0.04, mat('#d63a34')); tagRim.position.z = -0.03; tag.add(tagRim);
const tagHead = textSprite('お米 5kg', { w: 512, h: 128, size: 80, color: '#333', sx: 1.2, depthTest: false }); tagHead.position.set(0, 0.28, 0.06); tag.add(tagHead);
const tagPrice = textSprite('2,788円', { w: 1024, h: 256, size: 190, color: '#222', sx: 1.75, depthTest: false }); tagPrice.position.set(0, -0.12, 0.06); tag.add(tagPrice);
const tagHot = textSprite('10,000円', { w: 1024, h: 256, size: 190, color: '#e02a20', sx: 1.75, depthTest: false }); tagHot.position.set(0, -0.12, 0.06); tag.add(tagHot);
const tagPole = box(0.05, 1.2, 0.05, mat('#999')); tagPole.position.set(0, -1.0, -0.02); tag.add(tagPole);
tag.position.set(6.5, 2.05, -0.3);
function setTag(price, hot) { tagPrice.visible = !hot; tagHot.visible = hot; }
// front-facing rice bags in front of the pallet (labels toward the camera)
const FB = []; for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.22), [mat('#ece6d6'), mat('#ece6d6'), mat('#ece6d6'), mat('#ece6d6'), null, mat('#ece6d6')]); FB.push(b); grocer.add(b); b.position.set(5.75 + i * 0.52, 0.38, 0.2); b.rotation.y = -0.25; }
const bang = makeSparkles(160, 0.12, 0xffd0a0); grocer.add(bang.points); bang.init([[6.5, 2.2, -0.4]], 0.6, 2.2);
const shoppers = [];
{ const r = rng(59); const P = [[4.6, 0.6, 2.4], [5.3, 1.2, 0.2], [8.2, 0.4, 2.6], [3.6, -0.6, 0.6]];
  for (const [x, z, ry] of P) { const p = makePerson({ skin: SKIN[Math.floor(r() * 3)], hair: HAIR[Math.floor(r() * 3)], shirt: ['#d1694f', '#4f8ad1', '#6fae6a', '#c9a24a'][shoppers.length], pants: '#3b3f4a' }); p.position.set(x, 0, z); p.rotation.y = ry + Math.PI; grocer.add(p); shoppers.push(p); } }
const qs = shoppers.map(() => { const q = makeQ(); q.visible = false; grocer.add(q); return q; });
function shopperState(t, mode) { // mode 0 hidden, 1 looking at the tag, 2 walking away
  shoppers.forEach((p, i) => {
    p.visible = mode > 0; qs[i].visible = false; if (!mode) return;
    const U = p.userData; U.head.rotation.x = -0.15;
    const base = [[4.2, 1.6], [3.4, 0.6], [8.6, 1.4], [9.2, 0.4]][i];
    if (mode === 1) { p.position.set(base[0], 0, base[1]); p.lookAt(6.5, 0, -0.6); qs[i].visible = t > 0.6 + i * 0.4; qs[i].position.set(base[0], 2.15 + Math.sin(t * 3 + i) * 0.04, base[1]); }
    else { const w = Math.max(0, t - i * 0.4) * 0.9; p.position.set(base[0] - w * 0.4, 0, base[1] + w); p.rotation.y = 0; U.legs && U.legs.forEach((l, j) => l.rotation.x = Math.sin(t * 7 + j * Math.PI) * 0.4); }
  });
}
function grocerBase() { setGrocerLight('day'); setStock({ veg: 1, egg: 1, rice: 1 }); setSoldOut({}); tagsOn(false); SIGNS.rice.visible = false; bang.set(0); shopperState(0, 0); }
function rCam(t, d, a, b, tg = [6.5, 1.3, -0.9], fov = 50) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, fov); }

// ---------- stage: price bars ----------
const PB = [['2025年10月', 4208, '#9aa6b8'], ['過去最高', 4416, '#c9784a'], ['2026年10月', 2788, '#4fa3d1'], ['もしも', 10000, '#e0584a']];
const PSC = 1 / 1400;
const pbars = PB.map(([lab, v, c], i) => makeBar({ color: c, w: 1.6, d: 1.6, label: lab, x: -4.8 + i * 3.2, z: 0, nameTop: true }));
const pTitle = textSprite('お米5kgの値段（スーパー平均）', { w: 1024, h: 128, size: 64, sx: 9 }); pTitle.position.set(0, 9.0, -1); stage.add(pTitle);
function setPBars(k, show, n = 4) { pbars.forEach((b, i) => { const v = PB[i][1]; const kk = i < n ? clamp(k * 1.6 - (i === 3 ? 0 : i * 0.18)) : 0; b.g.visible = show && i < n; b.setH(v * PSC * ease(kk), kk > 0.05 ? Math.round(v * ease(kk)).toLocaleString('en-US') + '円' : ''); }); pTitle.visible = show; }

// ---------- stage: rice bags (1 bag = 5kg) + yen bars ----------
const bagTex = canvasTex(128, 192, (g) => { g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 128, 192); g.fillStyle = '#4f8a5a'; g.fillRect(0, 120, 128, 30); g.fillStyle = '#2f3a33'; g.font = '900 34px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('お米', 64, 70); g.fillStyle = '#fff'; g.font = '800 22px "Noto Sans CJK JP", sans-serif'; g.fillText('5kg', 64, 143); });
const bagFace = new THREE.MeshLambertMaterial({ map: bagTex }), bagSide = mat('#ece6d6');
const BAGS = new THREE.Group(); stage.add(BAGS);
FB.forEach(b => b.material[4] = bagFace);
const bags = [];
for (let i = 0; i < 13; i++) { // pyramid: 5 + 4 + 3 + 1 (front faces the camera)
  const row = i < 5 ? 0 : i < 9 ? 1 : i < 12 ? 2 : 3; const idx = row === 0 ? i : row === 1 ? i - 5 : row === 2 ? i - 9 : 0; const nRow = [5, 4, 3, 1][row];
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.45), [bagSide, bagSide, bagSide, bagSide, bagFace, bagSide]);
  b.position.set((idx - (nRow - 1) / 2) * 1.08, 0.3 + 0.75 + row * 1.52, 0); b.castShadow = true; BAGS.add(b); bags.push(b);
}
function setBags(n, frac = 1) { bags.forEach((b, i) => { b.visible = i < Math.floor(n); b.scale.setScalar(1); }); const last = bags[Math.floor(n)]; if (last && n % 1 > 0.05) { last.visible = true; last.scale.set(1, 1, 1); } }
const bagLab = textSprite('', { w: 1024, h: 128, size: 64, sx: 6.4 }); bagLab.position.set(0, 6.9, -1); stage.add(bagLab);
const YB = [['いま', 3.4, '#4fa3d1'], ['もしも', 12.3, '#e0584a']];
const ybars = YB.map(([lab, v, c], i) => makeBar({ color: c, w: 2.0, d: 2.0, label: lab, x: -2.2 + i * 4.4, z: 0, nameTop: true }));
const yTitle = textSprite('', { w: 1024, h: 128, size: 64, sx: 9 }); yTitle.position.set(0, 9.6, -1); stage.add(yTitle);
function setYBars(k, show, vals, title) { ybars.forEach((b, i) => { const v = vals[i]; const kk = clamp(k * 1.4 - i * 0.35); b.g.visible = show; b.setH(v * 0.5 * ease(kk), kk > 0.05 ? '約' + (v * ease(kk)).toFixed(1) + '万円' : ''); }); yTitle.visible = show; if (title) yTitle.userData.set(title); }
const you = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#3f8f6b', pants: '#3b3f4a', scale: 2.2 }); stage.add(you);
function stageMode(m) { setPBars(0, m === 'price'); BAGS.visible = m === 'bags' || m === 'person'; bagLab.visible = BAGS.visible; setYBars(0, m === 'yen', [3.4, 12.3]); you.visible = m === 'person'; }
function sCam(t, d, a, b, tg = [0, 4.2, 0]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }

// ---------- kitchen (result) ----------
const fam = [makePerson({ skin: SKIN[0], hair: HAIR[2], shirt: '#c9784a', pants: '#3b3f4a' }), makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#4f8ad1', pants: '#2b3346' })];
fam.forEach(p => room.add(p));
const kBag = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.15), [bagSide, bagSide, bagSide, bagSide, bagFace, bagSide]); room.add(kBag);
const kTag = textSprite('10,000円', { w: 512, h: 160, size: 110, bg: 'rgba(255,255,255,.96)', color: '#e02a20', sx: 0.9 }); room.add(kTag);
const kQ = makeQ(); room.add(kQ);

const SUBS = [
  [2.5, 6.0, 'お米が約3.6倍に。<br>家計からいくら消える？'],
  [6.2, 10.1, 'いまの全国平均は、<br>5kgで2,788円。'],
  [10.1, 14, '去年一番高かった週でも、<br>4,416円だった。'],
  [14.2, 18.1, 'それが1万円。<br>本当にヤバいのは次の数字。'],
  [18.1, 22, '家で買うお米は、<br>1世帯で年61.3kg。'],
  [22.2, 26.1, 'いまの値段なら、<br>年約3.4万円。'],
  [26.1, 30, '1万円なら、年約12.3万円。'],
  [30.2, 34.6, '差は約8.8万円。<br>でも、まだある。'],
  [34.6, 39, '1人が1年に食べる<br>お米は53.4kg。'],
  [39.2, 43.6, '1人あたり年約10.7万円。<br>いまの約3.6倍。'],
  [43.6, 47.8, '1世帯の米代は、<br>月に約1万円になる。'],
  [48.1, 53.8, '結果：お米代が1世帯で<br>年約8.8万円増えた。'],
  [53.9, 56.1, '60年前の半分しか<br>食べてないのに。'],
  [56.2, 59.4, 'お米5kg、<br>いくらまでなら買う？'],
];

const TP = 0.45; // v2：0.45秒で値札がバンと1万円に
function shot0(t) { // hook: price tag over the rice stack slams to 10,000円
  grocerBase(); lift(0);
  const hot = t >= TP; setTag(hot ? '10,000円' : '2,788円', hot);
  const s = hot ? 1 + 0.35 * Math.max(0, 1 - (t - TP) / 0.25) : 1; tag.scale.setScalar(s);
  bang.set(hot ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = hot ? 0.5 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  rCam(t, 2.5, [4.9, 2.8, 5.3], [5.0, 2.75, 4.9], [6.5, 1.82, -0.9]);
  setHud('お米5kg', hot ? '約3.6倍' : 'いま', 1, { color: hot ? RED : '#fff' });
  return grocer;
}
function shot1(t) { // shoppers stare at the tag
  grocerBase(); lift(240); tag.scale.setScalar(1); setTag('10,000円', true); shopperState(t, 1);
  rCam(t, 7.6, [6.0, 3.4, 7.6], [6.2, 3.2, 6.8], [6.4, 1.5, -0.6]);
  setHud('お米5kg', '10,000円', 1, { color: RED });
  setTop('いまのスーパー平均（2026年10月）', countUp(t - 3.7, 2788, 0, 1.0).toLocaleString('en-US') + '円', fade(t, 3.7, 7.6, 0.25), BLUE);
  return grocer;
}
function shot2(t) { // price bars
  setStageColor('#14213a'); stageMode('price'); setPBars(t < 4.1 ? clamp((t + 0.6) / 3.0) : 1 + clamp((t - 4.1) / 1.2) * 0, true, 3); if (t >= 4.1) { const b = pbars[3], kk = clamp((t - 4.1) / 1.2); b.g.visible = true; b.setH(10000 * PSC * ease(kk), Math.round(10000 * ease(kk)).toLocaleString('en-US') + '円'); } lift(260);
  sCam(t, 8, [0, 5.0, 27], [0.3, 5.2, 25.5], [0, 4.4, 0]);
  if (t < 4.1) setTop('過去最高の週（2025年12月29日〜）', countUp(t, 4416, 0.6, 1.2).toLocaleString('en-US') + '円', fade(t, 0.5, 4.1, 0.25), GOLD);
  else setTop('もしも（いまの約3.6倍）', '10,000円', fade(t, 4.1, 8, 0.25), RED);
  return stage;
}
function shot3(t) { // household: rice bags 61.3kg → 12.3 bags
  setStageColor('#14213a'); stageMode('bags'); setBags(clamp(t / 2.4) * 12.3); bagLab.userData.set('1世帯の1年分（5kg袋で約12袋）');
  lift(300);
  sCam(t, 12.1, [0, 4.4, 17.5], [0.4, 4.5, 16.3], [0, 3.9, 0]);
  setHud('1世帯・1年', '61.3kg', 1);
  if (t < 4.0) setTop('1世帯の米の購入量（2025年）', countUp(t, 613, 0.3, 1.4) / 10 + 'kg', fade(t, 0.3, 4.0, 0.25), BLUE);
  else if (t < 8.0) setTop('いまの値段なら（単純計算）', '約' + (countUp(t - 4.0, 34, 0.1, 1.0) / 10).toFixed(1) + '万円', fade(t, 4.0, 8.0, 0.25), BLUE);
  else setTop('5kg1万円なら（単純計算）', '約' + (countUp(t - 8.0, 123, 0.1, 1.0) / 10).toFixed(1) + '万円', fade(t, 8.0, 12.1, 0.25), RED);
  return stage;
}
function shot4(t) { // yen bars: now vs 10,000
  setStageColor('#14213a'); stageMode('yen'); setYBars(clamp(t / 2.5), true, [3.4, 12.3], '1世帯のお米代（1年・単純計算）');
  lift(260);
  sCam(t, 9, [0, 5.4, 24], [0.5, 5.6, 22.5], [0, 4.8, 0]);
  setHud('1世帯・1年', '差 約8.8万円', 1, { color: RED });
  setTop('1世帯で増える分（単純計算）', '約' + (countUp(t, 88, 0.6, 1.4) / 10).toFixed(1) + '万円', fade(t, 0.5, 9, 0.25), RED);
  return stage;
}
function shot5(t) { // per person: one big person beside ~10.7 bags
  setStageColor('#14213a'); stageMode('person'); setBags(10.7); bagLab.userData.set('1人の1年分（5kg袋で約11袋）');
  you.position.set(-3.5, 0.3, 1.2); you.rotation.y = 0.5; you.userData.head.rotation.x = -0.2; you.userData.arms[0].rotation.x = -0.4 - Math.sin(t * 2) * 0.1;
  lift(300);
  sCam(t, 8.8, [-0.6, 4.4, 18], [-0.2, 4.6, 16.5], [-0.6, 3.9, 0]);
  setHud('1人・1年', '53.4kg', 1);
  if (t < 4.4) setTop('1人1年のお米（2024年度・概算）', countUp(t, 534, 0.3, 1.4) / 10 + 'kg', fade(t, 0.3, 4.4, 0.25), BLUE);
  else setTop('1人あたり、5kg1万円なら（単純計算）', '約' + (countUp(t - 4.4, 107, 0.1, 1.0) / 10).toFixed(1) + '万円', fade(t, 4.4, 8.8, 0.25), RED);
  return stage;
}
function kitchen(t) {
  setRoom({ sets: ['kitchen'] }); setLight('evening', { ceil: 9, hemi: 1.0 }); props.sleeper.visible = false;
  fam[0].position.set(-1.1, 0, -0.6); fam[0].rotation.y = 0.3; fam[0].userData.head.rotation.x = 0.35; fam[0].userData.arms[1].rotation.x = -0.9;
  fam[1].position.set(1.1, 0, -0.5); fam[1].rotation.y = -0.4; fam[1].userData.head.rotation.x = 0.3;
  kBag.position.set(0, 1.18, -1.05); kTag.position.set(0, 1.62, -1.0);
  kQ.position.set(1.1, 2.25 + Math.sin(t * 3) * 0.04, -0.6); kQ.visible = t > 0.6;
}
function shot6(t) { // +1か月: kitchen, the household looks at the 10,000円 bag
  kitchen(t); lift(220);
  const u = ease(t / 8.8); look(lerp(-0.3, 0.0, u), lerp(2.1, 2.0, u), lerp(4.6, 4.1, u), 0, 1.35, -1.0, 50);
  setHud('1世帯・1か月', 'お米代', 1);
  setTop('1世帯の1か月のお米代（単純計算）', '約' + (countUp(t, 10, 0.4, 1.0) / 10 === 1 ? '1.0' : (countUp(t, 10, 0.4, 1.0) / 10).toFixed(1)) + '万円', fade(t, 0.4, 8.8, 0.25), RED);
  return room;
}
function shot7(t) { // result: wide kitchen
  kitchen(t + 3); lift(220);
  const u = ease(t / 7.5); look(lerp(0.0, 0.4, u), lerp(2.0, 2.4, u), lerp(4.1, 5.2, u), 0, 1.35, -1.0, 50);
  const a = t < 3.6;
  setTop(a ? '1世帯で増えるお米代（年・単純計算）' : '1人1年のお米（1965年度→2024年度）', a ? '約8.8万円' : '111.7kg→53.4kg', fade(t, 0.15, 7.5, 0.25), a ? RED : GOLD);
  return room;
}
function shot8(t) { // loop: tag 10,000円 like the hook
  grocerBase(); lift(0); tag.scale.setScalar(1); setTag('10,000円', true);
  rCam(t + 0.5, 4.5, [4.9, 2.8, 5.3], [5.0, 2.75, 4.9], [6.5, 1.82, -0.9]);
  setHud('お米5kg', '約3.6倍', 1, { color: RED });
  return grocer;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 10.1, f: shot1 }, { a: 10.1, b: 18.1, f: shot2 }, { a: 18.1, b: 30.2, f: shot3 },
  { a: 30.2, b: 34.6, f: shot4 }, { a: 34.6, b: 43.6, f: shot5 }, { a: 43.6, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 63, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 63,
  meta: {
    id: '0059',
    v2: true,
    hookLine: 'お米5キロが、1万円になった。',
    series: 'お財布のもしも',
    hookType: 'H3',
    cat: 'お金・経済',
    title: '米5kgが1万円になったら？',
    titleHtml: '米5kgが<br>1万円になったら？',
    mood: 'tension', seed: 59, hits: [0.45, 48.1], risers: [14.2], impacts: [10.6, 26.3, 30.6, 39.6],
    sfx: [[0.45, 'whoosh'], [30.4, 'meter', 0.6]],
    narr: { '米5kg': 'こめ5キロ', '5kg': '5キロ', '2,788円': '2788円', '4,416円': '4416円', '61.3kg': '61.3キロ', '53.4kg': '53.4キロ', '約3.6倍': 'やく3.6ばい', '約3.4万円': 'やく3.4万円', '約12.3万円': 'やく12.3万円', '約8.8万円': 'やく8.8万円', '約10.7万円': 'やく10.7万円', 'お米5kg': 'おこめ5キロ' },
    ask: 'お米5kg、いくらまでなら買う？',
    caption: 'もしもお米5kgが1万円になったら？\nスーパーのお米5kgの全国平均は、2026年10月19〜25日の週で2,788円。去年一番高かった週（2025年12月29日〜2026年1月4日）でも4,416円。1万円はいまの約3.6倍。\n二人以上の世帯が家で買うお米は、2025年で1年に61.3kg。いまの値段なら年約3.4万円、5kg1万円なら年約12.3万円で、約8.8万円多く出ていく（単純計算）。月にすると約1万円。\n1人が1年に食べるお米は53.4kg（2024年度・概算）。1人あたり年約10.7万円（単純計算）。\nしかも1965年度は111.7kgで、いまはその半分以下しか食べていない。\n\nお米5kg、いくらまでなら買う？ コメントで教えて。\n\n出典：農林水産省（スーパーのPOSデータによる米の販売価格 2026年10月30日公表、令和6年度食料需給表）、総務省 家計調査（二人以上の世帯 2025年）',
    hashtags: ['もしもラボ', 'お米', '米価格', '家計', '節約'],
    endStats: [['お米5kgのスーパー平均', '2,788円', '2026年10月'], ['1世帯の購入量', '61.3kg', '2025年'], ['1世帯のお米代（5kg1万円）', '約12.3万円', '年・単純計算'], ['増える分', '約8.8万円', '年・単純計算'], ['1人1年のお米', '53.4kg', '2024年度']],
    sources: '出典：農林水産省（米の販売価格 POS 2026年10月30日公表、<br>令和6年度食料需給表）、総務省 家計調査（2025年）',
  },
});
