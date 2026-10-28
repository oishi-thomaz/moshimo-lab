import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, makeQ, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setClock, props, lamp } from '../scenes/room.js';
import { field, setFieldEnv, setFlowers, setFruit } from '../scenes/field.js';
import { makeMite, makeCrawlers, makeLitter } from '../scenes/mites.js';
import { makeXButton, xCountdown, xHook } from '../scenes/xbutton.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも世界中のダニが絶滅したら？（blueprint no 705・絶滅ボタンシリーズ）
// 数字：
//  ダニの仲間（ダニ目 Acari）は 54,617種が記載（Zhang 2011, Zootaxa 3148:7-12「Animal biodiversity」）
//   https://www.mapress.com/zootaxa/2011/f/zt03148p012.pdf
//  小児喘息の大半（70〜90%）はダニを原因アレルゲンとするアトピー型。吸い込むダニアレルゲンの大半は布団から（厚生労働省 リウマチ・アレルギー情報）
//   https://www.mhlw.go.jp/new-info/kobetu/kenkou/ryumachi/dl/jouhou01-07.pdf
//  マダニがうつすSFTS（重症熱性血小板減少症候群）：2025年は191人で過去最多。致命率は約10〜30%（福島県 感染症対策課・2026年9月更新）
//   https://www.pref.fukushima.lg.jp/sec/21045i/sfts.html
//  ササラダニ類（土のダニ）：個体数密度は数千から数万個体/m²。有機物の分解過程や養分循環で重要な役割（森林総合研究所 森林生物データベース）
//   https://db.ffpri.go.jp/BioDB/BioDB-L/browserecord.php?-action=browse&-recid=66

const BLUE = '#7fd4ff', GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8';

// ---------- bedroom ----------
const BED = new THREE.Group(); room.add(BED);
const BTN = new THREE.Vector3(0.95, 0.93, -1.05);
const btn = makeXButton({ label: 'ダニ絶滅ボタン' }); btn.position.copy(BTN); btn.scale.setScalar(0.9); BED.add(btn);
// close-up mites on the blanket (magnified)
const cMites = []; const CM = [[1.3, -1.35, 0.4, 0.9], [1.6, -1.0, 0.3, 1.2], [1.15, -0.75, 0.35, 0.7], [1.85, -1.5, 0.45, 1.0], [1.45, -1.7, 0.25, 1.4]];
for (let i = 0; i < CM.length; i++) { const m = makeMite({ kind: 'dust' }); m.scale.setScalar(0.55); BED.add(m); cMites.push(m); }
function closeMites(t, vis) {
  cMites.forEach((m, i) => {
    m.visible = vis; if (!vis) return;
    const [x, z, r, s] = CM[i]; const a = t * s * 0.5 + i * 1.3;
    m.position.set(x + Math.cos(a) * r * 0.4, 0.93, z + Math.sin(a) * r * 0.3); m.rotation.y = -a + Math.PI; m.userData.anim(t + i, true);
  });
}
// many mites across the blanket and pillow (wide shots, exaggerated size)
const bedMites = makeCrawlers(240, 5, { x0: 0.7, x1: 2.5, z0: -2.15, z1: -0.45, y: 0.935, size: 0.035 }); BED.add(bedMites.mesh);
const pilMites = makeCrawlers(50, 9, { x0: 1.1, x1: 2.1, z0: -3.15, z1: -2.85, y: 0.835, size: 0.03 }); BED.add(pilMites.mesh);
const bedSpark = makeSparkles(260, 0.06); room.add(bedSpark.points);
{ const pts = []; const r = rng(4); for (let i = 0; i < 50; i++) pts.push([0.8 + r() * 1.7, 0.97, -2.2 + r() * 1.8]); bedSpark.init(pts, 0.1, 0.5); }
const hookSpark = makeSparkles(160, 0.05); room.add(hookSpark.points);
hookSpark.init(CM.map(([x, z]) => [x, 0.97, z]), 0.15, 0.35);
// child sleeping (asthma beat)
const kid = makePerson({ skin: SKIN[3], hair: HAIR[2], shirt: '#f2c14e', pants: '#6b7a8f', scale: 0.7 });
kid.rotation.x = -Math.PI / 2; kid.position.set(1.6, 0.8, -1.55); BED.add(kid);
const mom = makePerson({ skin: SKIN[0], hair: HAIR[1], shirt: '#8e6bbf', pants: '#3b3f4a', long: true, scale: 1 });
mom.position.set(3.05, 0, -0.9); mom.rotation.y = -Math.PI / 2 - 0.35; BED.add(mom);
const zzz = makeSparkles(50, 0.07, 0xbfd8ff); room.add(zzz.points); zzz.init([[1.6, 1.25, -2.4]], 0.15, 1.0);
function bedroom(light, opt) {
  setRoom({ sets: ['bed'] }); setLight(light, opt); setClock('23:00');
  props.sleeper.visible = false; props.phone.visible = false; BED.visible = true; kid.visible = false; mom.visible = false; zzz.set(0);
}

// ---------- field: grass with ticks, a hiker ----------
const FLD = new THREE.Group(); field.add(FLD);
const grass = []; { const r = rng(21); const gM = [mat('#4f8f3a', { flatShading: true }), mat('#6aa84a', { flatShading: true }), mat('#3f7a30', { flatShading: true })]; for (let i = 0; i < 260; i++) { const h = 0.35 + r() * 0.5; const g = new THREE.Mesh(new THREE.ConeGeometry(0.06, h, 4), gM[i % 3]); g.position.set(-4 + r() * 6, h / 2, 1.5 + r() * 7); g.rotation.z = (r() - 0.5) * 0.4; FLD.add(g); grass.push(g); } }
const ticks = makeCrawlers(90, 33, { x0: -3.6, x1: 1.6, z0: 3, z1: 9, y: 0.02, size: 0.08, color: '#6b2a1c', legs: '#3a1d14' }); FLD.add(ticks.mesh);
const bigTick = makeMite({ kind: 'tick' }); bigTick.scale.setScalar(1.3); FLD.add(bigTick);
const hiker = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#d97a3a', pants: '#3f4a5a', scale: 1 }); FLD.add(hiker);
const cap = box(0.46, 0.08, 0.5, mat('#e8e4d8')); cap.position.set(0, 0.5, 0.04); hiker.userData.head.add(cap);
const fSpark = makeSparkles(260, 0.1); field.add(fSpark.points);
{ const pts = []; const r = rng(6); for (let i = 0; i < 40; i++) pts.push([-3.6 + r() * 5.2, 0.15, 2 + r() * 6]); fSpark.init(pts, 0.2, 0.7); }

// ---------- forest floor: soil mites + leaf litter ----------
const FOR = new THREE.Group(); field.add(FOR);
const soil = new THREE.Mesh(new THREE.CircleGeometry(7, 28), mat('#5e4430')); soil.rotation.x = -Math.PI / 2; soil.position.set(-10, 0.012, -6); FOR.add(soil);
const litter = makeLitter(2600, 41, { x0: -15, x1: -5, z0: -10.5, z1: -1.5, y: 0.02, size: 0.16 }); FOR.add(litter.mesh);
const soilMites = makeCrawlers(160, 44, { x0: -11.6, x1: -8.4, z0: -4.6, z1: -2.2, y: 0.03, size: 0.03, color: '#8a5a3a', legs: '#5a3a24' }); FOR.add(soilMites.mesh);
const sMite = makeMite({ kind: 'dust' }); sMite.scale.setScalar(0.8); FOR.add(sMite);
sMite.traverse(o => { if (o.material && o.material.color) { const c = o.material.color.getHexString(); if (c === 'efe2c8') o.material = mat('#9a6a44'); } });
const forSpark = makeSparkles(220, 0.07); field.add(forSpark.points);
{ const pts = []; const r = rng(16); for (let i = 0; i < 40; i++) pts.push([-11.6 + r() * 3.2, 0.1, -4.6 + r() * 2.4]); forSpark.init(pts, 0.15, 0.6); }
const fq = makeQ(); fq.visible = false; field.add(fq);
function fieldMode(m) { FLD.visible = m === 'grass'; FOR.visible = m === 'forest'; setFieldEnv('day'); setFlowers(0); setFruit(0); fSpark.set(0); forSpark.set(0); fq.visible = false; }

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの布団の中。'],
  [6.2, 10.1, '布団はきれいになる。<br>でもヤバいのは森の中。'],
  [10.1, 14, 'ダニの仲間は、<br>5万種以上いた。'],
  [14.2, 18.1, 'まず、布団のダニが消えた。'],
  [18.1, 22, '子どものぜん息の7〜9割は、<br>ダニが原因だった。'],
  [22.2, 26.1, '草むらのマダニも消えた。'],
  [26.1, 30, 'マダニがうつす病気は<br>2025年、過去最多だった。'],
  [30.2, 34.6, 'でも、ダニの仕事は<br>それだけじゃなかった。'],
  [34.6, 39, '森の土には、1m²に<br>数千〜数万匹のダニがいた。'],
  [39.2, 43.6, '落ち葉を細かくする、<br>土の掃除係だった。'],
  [43.6, 47.8, 'その係が、<br>森から一斉にいなくなった。'],
  [48.1, 53.8, '結果：ぜん息と感染症は減り、<br>森は土の掃除係を失った。'],
  [53.9, 56.1, '嫌われ者は、土の職人。'],
  [56.2, 59.4, '次に絶滅ボタンを<br>押したい生き物は？'],
];

const HOOK_LIFT = 0;
const TP = 0.5; // v2：0.5秒で押す（冒頭で待たせない）
function btnState(t) { const h = xHook(t, TP); btn.userData.press(h.press); btn.userData.hand(h.hand); }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(lerp(0.45, 0.4, u), lerp(2.15, 2.1, u), lerp(0.75, 0.6, u), 1.3, 0.85, -1.25, 46); } // v2：少し上から、ボタンと拡大したダニをタイトルの下にまとめて
function shot0(t) { // hook: magnified mites crawling on the blanket next to the red button
  lift(HOOK_LIFT);
  bedroom('day', { ceil: 6, hemi: 1.05 }); btn.userData.labelOn(false); btnState(t);
  closeMites(t, t < TP); bedMites.set(t < TP ? 240 : 0, t); pilMites.set(0, t);
  hookSpark.set(t >= TP ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t);
  setHud('絶滅ボタンを押すまで', xCountdown(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return room;
}
function bedCam(t, d, a, b, tg = [1.5, 0.85, -1.6]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function shot1(t) { // everyday: the bed, mites everywhere on the blanket (magnified view)
  lift(200);
  bedroom('day', { ceil: 6, hemi: 1.05 }); btn.userData.labelOn(false); btn.userData.press(0); btn.userData.hand(0);
  closeMites(t + 3, true); bedMites.set(240, t + 3); pilMites.set(50, t + 3); hookSpark.set(0);
  bedCam(t, 3.5, [-0.3, 2.4, 1.6], [-0.1, 2.3, 1.2]);
  return room;
}
function shot2(t) { // +1秒: all the bed mites vanish
  lift(200);
  bedroom('day', { ceil: 6, hemi: 1.05 }); btn.userData.labelOn(false); btn.userData.press(1); btn.userData.hand(0);
  const tv = 0; // v2：冒頭で押した直後からつながるので、布団のダニはもう消えている（消えた跡の光だけ）
  closeMites(t + 6, t < tv); bedMites.set(t < tv ? 240 : 0, t + 6); pilMites.set(t < tv ? 50 : 0, t + 6);
  bedSpark.set(t >= tv ? (t - tv) / 1.3 : 0);
  bedCam(t, 8, [-0.1, 2.3, 1.2], [0.2, 2.7, 2.0]);
  hudTime('+1秒');
  setTop('ダニの仲間（世界・2011年）', countUp(t, 54617, 1.2, 1.4).toLocaleString('en-US') + '種', fade(t, 1.15, 8, 0.25));
  return room;
}
function shot3(t) { // +1日: night, a child sleeping, mom watching
  lift(200);
  bedroom('night', { ceil: 3, hemi: 1.0, lamp: 2.4 }); lamp.position.set(0.3, 1.4, -2.4);
  btn.visible = false; closeMites(0, false); bedMites.set(0, t); pilMites.set(0, t); bedSpark.set(0);
  kid.visible = true; mom.visible = true; kid.userData.head.rotation.x = 0; kid.position.y = 0.8 + Math.sin(t * 1.6) * 0.008;
  mom.userData.head.rotation.x = 0.3;
  zzz.set(((t % 2.6) / 2.6));
  bedCam(t, 8, [-0.4, 2.4, 1.2], [-0.1, 2.3, 0.7], [1.5, 0.9, -2.0]);
  hudTime('+1日');
  setTop('子どものぜん息で、ダニが原因の割合（厚労省）', t < 3.2 ? countUp(t, 70, 1.2, 0.7) + '%' : '70〜90%', fade(t, 1.15, 8, 0.25), GOLD);
  return room;
}
function grassCam(t, d, a, b, tg) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function shot4(t) { // +1週間: grass, ticks crawl on stems; a hiker walks through; ticks vanish
  lift(300);
  fieldMode('grass');
  const tv = 1.0;
  ticks.set(t < tv ? 90 : 0, t, 0.6);
  bigTick.visible = t < tv; bigTick.position.set(-0.2 + Math.sin(t) * 0.1, 0.02, 8.2); bigTick.rotation.y = 2.4; bigTick.userData.anim(t, true);
  fSpark.set(t >= tv ? (t - tv) / 1.4 : 0);
  hiker.position.set(lerp(-3.4, -0.2, t / 8), 0, 2.6); hiker.rotation.y = Math.PI / 2; hiker.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 7 + i * Math.PI) * 0.5); hiker.userData.arms.forEach((a, i) => a.rotation.x = -Math.sin(t * 7 + i * Math.PI) * 0.4);
  grassCam(t, 8, [0.6, 1.9, 10.8], [0.9, 2.0, 10.2], [-1.2, 1.0, 4.2]);
  hudTime('+1週間');
  setTop('マダニがうつす病気SFTSの患者（2025年）', countUp(t, 191, 1.2, 1.2) + '人', fade(t, 1.15, 8, 0.25), RED);
  return field;
}
function forestCam(t, d, a, b, tg = [-10, 0.2, -3.4]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 50); }
function shot5(t) { // +1か月: forest floor, soil mites under the leaves vanish
  lift(320);
  fieldMode('forest');
  litter.set(0.35);
  const tv = 4.3;
  soilMites.set(t < tv ? 160 : 0, t, 0.5);
  sMite.visible = t < tv; sMite.position.set(-9.6 + Math.sin(t * 0.5) * 0.15, 0.03, -2.0); sMite.rotation.y = 0.6 + t * 0.2; sMite.userData.anim(t, true);
  forSpark.set(t >= tv ? (t - tv) / 1.4 : 0);
  el.flash.style.opacity = t >= tv ? 0.3 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  forestCam(t, 9.2, [-9.2, 1.4, 0.4], [-9.4, 1.6, 0.9]);
  hudTime('+1か月');
  setTop('森の土のダニ（1m²あたり・森林総研）', t < 2.2 ? countUp(t - 0.0, 1000, 0.6, 1.2).toLocaleString('en-US') + '匹' : '数千〜数万匹', fade(t, 0.4, 9.2, 0.25), GREEN);
  return field;
}
function shot6(t) { // +1年: leaves pile up on the forest floor
  lift(320);
  fieldMode('forest'); soilMites.set(0, t); sMite.visible = false;
  litter.set(lerp(0.4, 1, ease(clamp(t / 7))));
  fq.visible = false;
  forestCam(t, 8.8, [-8.0, 1.8, 0.2], [-7.6, 2.4, 1.0], [-10, 0.2, -5]);
  hudTime('+1年');
  setTop('森の土のダニ（1m²あたり・森林総研）', '0匹', fade(t, 0.15, 8.8, 0.25), RED);
  return field;
}
function shot7(t) { // result: the child sleeps well; morning
  lift(200);
  bedroom('day', { ceil: 4, hemi: 1.1 }); btn.visible = false; closeMites(0, false); bedMites.set(0, t); pilMites.set(0, t); bedSpark.set(0);
  kid.visible = true; mom.visible = false; kid.position.y = 0.8 + Math.sin(t * 1.6) * 0.008;
  bedCam(t, 7.5, [0.2, 2.5, 1.8], [0.6, 2.9, 2.8], [1.5, 0.9, -1.8]);
  const a = t < 3.6;
  setTop(a ? '子どものぜん息で、ダニが原因の割合（厚労省）' : 'マダニがうつす病気SFTSの患者（2025年）', a ? '70〜90%' : '191人', fade(t, 0.15, 7.5, 0.25), a ? GOLD : RED);
  return room;
}
function shot8(t) { // loop: the red button on the empty blanket again
  lift(HOOK_LIFT);
  bedroom('day', { ceil: 6, hemi: 1.05 }); btn.visible = true; btn.userData.labelOn(false); btn.userData.press(0); btn.userData.hand(0);
  closeMites(0, false); bedMites.set(0, t); pilMites.set(0, t); hookSpark.set(0);
  hookCam(t + 0.5, 4.5);
  setHud('絶滅ボタンを押すまで', xCountdown(TP), 1, { mono: true });
  return room;
}
function show(f) { return (t, T) => { btn.visible = true; return f(t, T); }; }

const shots = [
  { a: 0, b: 2.5, f: show(shot0) }, { a: 2.5, b: 6, f: show(shot1) }, { a: 6, b: 14, f: show(shot2) }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：いつもの布団（元の2.5〜6秒）を抜いて、押した直後から本題へ
  meta: {
    id: '0705',
    v2: true,
    hookLine: '世界中のダニが、一斉に消えた。',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '生き物・動物',
    title: '世界中のダニが絶滅したら？',
    titleHtml: '世界中のダニが<br>絶滅したら？',
    mood: 'mystery', seed: 705, hits: [0.5, 48.1], risers: [6.0], impacts: [18.6, 34.9],
    sfx: [[0.5, 'poof'], [23.0, 'poof'], [34.5, 'poof'], [0.05, 'skitter']],
    narr: { '5万種': '5万しゅ', '7〜9割': '7から9わり', '1m²': '1平方メートル', '数千〜数万匹': '数千から数万匹', 'ダニ絶滅ボタン': 'ダニぜつめつボタン', '2025年': '2025年' },
    ask: '次に絶滅ボタンを押したい生き物は？',
    caption: 'もしも世界中のダニが一瞬で絶滅したら？\nダニの仲間は、世界で5万4,617種が見つかっている（2011年）。\nまず消えるのは布団のダニ。子どものぜん息の大半（70〜90%）は、ダニが原因のアレルギーだ（厚生労働省）。\n草むらのマダニも消える。マダニがうつす病気SFTSは、2025年に191人で過去最多。致命率は約10〜30%とされる。\nでもダニの仕事はそれだけじゃない。森の土には1m²あたり数千〜数万匹のダニがいて、落ち葉を細かくして土に戻す分解の役目を担っている（森林総合研究所）。\n結果、ぜん息とマダニの病気は減るけど、森は土の掃除係を失う。\n\n次に絶滅ボタンを押したい生き物は？ コメントで教えて。\n\n出典：Zhang, Zootaxa 3148（2011年）、厚生労働省 リウマチ・アレルギー情報、福島県 SFTS（2026年）、森林総合研究所 森林生物データベース',
    hashtags: ['もしもラボ', 'ダニ', '絶滅', 'マダニ', '雑学'],
    endStats: [['ダニの仲間', '5万4,617種', '2011年'], ['子どものぜん息でダニが原因', '70〜90%', '厚労省'], ['マダニがうつすSFTSの患者', '191人', '2025年'], ['森の土のダニ（1m²）', '数千〜数万匹', '森林総研']],
    sources: '出典：Zootaxa（2011年）、厚生労働省、<br>福島県（2026年）、森林総合研究所',
  },
});
