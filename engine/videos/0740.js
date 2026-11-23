import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBench } from '../scenes/home.js';

// もしもママ友のマウントに、毎回イエローカードが出たら？（皮肉回・台本 S134・図星／大人の本音）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。公園で聞いてもいない自慢をするマウントママの頭の上にイエローカードが出て固まる回。後半で 会社で子どもの模試の自慢を言いふらすパパ にも返す
// 数字は使わない。子どもは笑われる側にしない（子どもの顔は出さず、叩くのは親のふるまい）。実在のブランド・ロゴは出さない。審判の見た目は出さない（カードと笛の音だけ）。着地は 寂しさ で、見下す言い方にしない

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#a8d0ec', ground: '#7aa86a' }); hemi.intensity = 1.35;
const MAUNT = makeWoman({ shirt: '#c89ad8', hair: '#5a3020', pants: '#3a3a4a' }); S.add(MAUNT); const sweatM = makeSweat(); MAUNT.userData.head.add(sweatM);
const MAMAS = [makeWoman({ shirt: '#9ac8a0', hair: '#2a1a14' }), makeWoman({ shirt: '#e8c890', hair: '#3a2620' })]; MAMAS.forEach(p => S.add(p));
const PAPA = makeSuit({ jacket: '#3a4256', tie: '#c89a3a', glasses: true }); S.add(PAPA); const sweatP = makeSweat(); PAPA.userData.head.add(sweatP);
const COWORK = makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#2a1a14' }); S.add(COWORK);

// カード（イエロー・レッド）
function makeCard(color) { const g = new THREE.Group(); const c = box(0.26, 0.36, 0.02, new THREE.MeshBasicMaterial({ color })); g.add(c); return g; }
const YC = makeCard('#ffd400'); S.add(YC); const YC2 = makeCard('#ffd400'); S.add(YC2); const RC = makeCard('#e8202a'); S.add(RC);
const PI = label('ピッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.45 }); S.add(PI);
function cardOver(c, p, t, t0, s = 1) { const k = clamp((t - t0) / 0.18); c.visible = t >= t0; p.userData.head.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.85, 0); p.userData.head.localToWorld(v); c.position.copy(v); c.position.y += Math.sin(t * 3) * 0.02; c.scale.setScalar(s * (0.4 + 0.6 * easeOut(k)) * (1 + 0.25 * Math.max(0, 1 - Math.abs(k - 1) * 5))); c.rotation.set(0, 0, Math.sin(t * 2) * 0.06); }
// ベビーカー
const STROLLER = new THREE.Group(); { const m = mat('#4a6a9a'); const b = box(0.5, 0.3, 0.7, m); b.position.y = 0.55; STROLLER.add(b); const hood = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m); hood.position.set(0, 0.68, -0.2); hood.rotation.x = -0.5; STROLLER.add(hood); const h = box(0.5, 0.04, 0.04, mat('#2a2a30')); h.position.set(0, 1.0, 0.45); STROLLER.add(h); for (const s of [-1, 1]) { const bar = box(0.03, 0.6, 0.03, mat('#2a2a30')); bar.position.set(s * 0.24, 0.7, 0.4); bar.rotation.x = -0.4; STROLLER.add(bar); for (const z of [-0.25, 0.25]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), mat('#1a1a20')); w.rotation.z = Math.PI / 2; w.position.set(s * 0.26, 0.1, z); STROLLER.add(w); } } } S.add(STROLLER);

// ---------- A：公園（原点） ----------
flat(30, 20, '#c8b490', 0, -1.0);
const TREES = []; { const r = rng(134); for (let i = 0; i < 9; i++) { const g = new THREE.Group(); const tr = box(0.2, 1.4, 0.2, mat('#7a5a3a')); tr.position.y = 0.7; g.add(tr); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.9 + r() * 0.3, 10, 8), mat(['#5a9a5a', '#6aa86a', '#4a8a4a'][i % 3])); lf.position.y = 1.9; g.add(lf); g.position.set(-8 + i * 2.0 + (r() - 0.5), 0, -6 - r() * 2); S.add(g); TREES.push(g); } }
const BENCH = makeBench(); BENCH.position.set(0.3, 0, -1.6); S.add(BENCH);
const SLIDE = new THREE.Group(); { const p = box(0.1, 1.4, 0.1, mat('#e86a4a')); for (const x of [-0.3, 0.3]) for (const z of [-0.3, 0.3]) { const q = p.clone(); q.position.set(x, 0.7, z); SLIDE.add(q); } const top = box(0.7, 0.06, 0.7, mat('#f2c94c')); top.position.y = 1.4; SLIDE.add(top); const sl = box(0.5, 0.04, 1.8, mat('#5a9ae8')); sl.position.set(0, 0.75, 1.1); sl.rotation.x = 0.75; SLIDE.add(sl); } SLIDE.position.set(3.2, 0, -3.5); S.add(SLIDE);
const peraPera = label('うちの子、もう英語ペラペラで', { w: 1200, size: 82, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.4 }); S.add(peraPera);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const kikasareru = label('聞いてもいない 自慢', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.25 }); S.add(kikasareru);
const SPEECH = ['英語に ピアノに 水泳に…', '夫がまた 昇進しちゃって…', 'ハワイの写真 見る？'].map(s => { const l = label(s, { w: 1100, size: 86, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.25 }); S.add(l); return l; });
const PH = makePhone({ w: 0.5, h: 1.0 }); S.add(PH.g);
const nimaime = label('2枚目', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(nimaime);
const shiin = label('しーん', { w: 512, size: 120, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.65 }); S.add(shiin);
const nereteru = label('最近、寝れてる？', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.1 }); S.add(nereteru);
const zenzen = label('実はうちも 全然', { w: 900, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.05 }); S.add(zenzen);
const sabishisa = label('自慢でしか 話せなかった', { w: 1100, size: 88, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.3 }); S.add(sabishisa);
const senobi = label('置いていかれたくない 背伸び', { w: 1300, size: 82, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(senobi);

// ---------- B：会社（x=60） ----------
const BX = 60;
room({ x: BX, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(BX - 3.2 + i * 3.2, 2.0, -3.4); S.add(w); }
const ISL = makeDeskIsland(2); ISL.position.set(BX, 0, -1.8); S.add(ISL);
const demo = label('カードは ママ友だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(demo);
const moshi = label('息子が模試で 一番でさ', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(moshi);

const PEOPLE = [MAUNT, ...MAMAS, PAPA, COWORK];
const LABELS = [PI, peraPera, katamaru, kikasareru, ...SPEECH, nimaime, shiin, nereteru, zenzen, sabishisa, senobi, demo, moshi];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweatM.userData.set(0); sweatP.userData.set(0);
  [YC, YC2, RC].forEach(c => c.visible = false); STROLLER.visible = false; PH.g.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function sitBench(p, dx) { stand(p, 0.3 + dx, -1.55, 0); poseSit(p); p.position.y += 0.06; }
const TP = 0.3;
function mauntStroller(x = -0.55, z = -0.2, ry = 0.35) { stand(MAUNT, x, z, ry); MAUNT.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); MAUNT.updateMatrixWorld(); const v = new THREE.Vector3(0, 0, 0.85); MAUNT.localToWorld(v); STROLLER.visible = true; STROLLER.position.set(v.x, 0, v.z); STROLLER.rotation.y = ry + Math.PI; }
function parkCam(u = 0) { look(lerp(0.2, 0.1, u), lerp(2.3, 2.25, u), lerp(5.4, 5.0, u), 0.05, 2.3, -0.6, 50); }
function shot0(t) { // 0秒＝サムネ：公園で うちの子、もう英語ペラペラで と言ったママの頭の上に、イエローカードがパッと出る
  reset(); lift(0); mauntStroller(); stand(MAMAS[0], 0.75, -0.5, -0.5); stand(MAMAS[1], 1.35, -1.1, -0.6);
  peraPera.visible = t < TP; peraPera.position.set(0.15, 1.1, 0.3); peraPera.userData.size(1.5);
  cardOver(YC, MAUNT, t, TP, 1.3); if (t >= TP) { el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(PI, t, TP, 0.3, 2.3, -0.2, 0.42); }
  parkCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // ピッ の笛の音に、マウントママがベビーカーを押したまま固まる
  reset(); lift(140); mauntStroller(); cardOver(YC, MAUNT, 1, 0, 1.0); sweatM.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, -0.1, 2.1, -0.1, 0.36);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.2, u), 1.8, lerp(3.0, 2.6, u), -0.3, 1.5, -0.1, 50);
  return S;
}
function sFuman(t, d) { // ママたちの不満から。公園に行くたび、聞いてもいない自慢を聞かされる
  reset(); lift(140); sitBench(MAMAS[0], -0.45); sitBench(MAMAS[1], 0.45); MAMAS.forEach(p => p.userData.head.rotation.y = 0.5); stand(MAUNT, -0.95, -0.9, 0.7); MAUNT.userData.arms[1].rotation.set(-1.6, 0, 0.3);
  if (t > d * 0.4) say(kikasareru, t, d * 0.4, 0.0, 2.15, -1.4, 1.15);
  look(-0.1, 1.85, 4.2, -0.05, 1.2, -1.3, 50);
  return S;
}
function sStage(i, t, d) { // 月曜 習い事・水曜 夫の年収・金曜 旅行の写真（2枚目でレッド）
  reset(); lift(140); stand(MAUNT, -0.5, -0.6, 0.5); sitBench(MAMAS[0], 0.0); sitBench(MAMAS[1], 0.8); MAMAS.forEach(p => p.userData.head.rotation.y = 0.4);
  MAUNT.userData.arms[1].rotation.set(-1.4, 0, 0.3);
  say(SPEECH[i], t, 0.15, 0.4, 2.25, -0.6, 0.95);
  if (i === 2) { MAUNT.userData.arms[1].rotation.set(-1.7, 0, 0.5); MAUNT.updateMatrixWorld(); const v = new THREE.Vector3(0.2, 1.4, 0.45); MAUNT.localToWorld(v); PH.g.visible = true; PH.g.position.copy(v); PH.g.rotation.set(0, 0.5, 0); PH.g.scale.setScalar(0.5); const two = t > d * 0.4; PH.draw(two ? 'p2' : 'p1', (g, W, H) => { g.fillStyle = two ? '#f2b07a' : '#7ac8e8'; g.fillRect(0, 0, W, H); g.fillStyle = two ? '#e8804a' : '#f4e4b0'; g.fillRect(0, H * 0.6, W, H * 0.4); g.fillStyle = '#fff'; g.beginPath(); g.arc(W * 0.7, H * 0.25, 60, 0, 7); g.fill(); });
    if (two) { say(nimaime, t, d * 0.4, 0.5, 1.75, -0.4, 0.5); cardOver(RC, MAUNT, t, d * 0.55, 1.1); if (t > d * 0.55) say(PI, t, d * 0.55, -1.0, 2.3, -0.6, 0.38); } }
  else { cardOver(YC, MAUNT, t, d * 0.55, 1.0); if (t > d * 0.55) say(PI, t, d * 0.55, -1.0, 2.3, -0.6, 0.38); }
  setHud('マウントに カード', ['月曜', '水曜', '金曜'][i], 1);
  look(0.0, 1.95, 4.2, -0.05, 1.45, -1.0, 50);
  return S;
}
function officeBase() { stand(PAPA, BX - 0.4, -0.3, 0.3); PAPA.userData.arms[1].rotation.set(-1.4, 0, 0.3); stand(COWORK, BX + 0.7, -0.5, -0.6); }
function sDemo(t, d) { // でも、カードが出たのは、ママ友だけじゃなかった
  reset(); lift(140); officeBase(); PAPA.userData.arms[1].rotation.set(0, 0, 0);
  if (t > d * 0.35) say(demo, t, d * 0.35, BX + 0.1, 2.35, -0.6, 1.2);
  look(BX + 0.1, 1.8, 3.6, BX + 0.1, 1.45, -0.6, 50);
  return S;
}
function sPapa(t, d) { // 会社で 息子が模試で一番でさ と言いふらすパパにも、イエローカード
  reset(); lift(140); officeBase(); const ph = t / d;
  say(moshi, t, 0.2, BX + 0.5, 2.45, -0.4, 1.0);
  if (ph > 0.55) { cardOver(YC2, PAPA, t, d * 0.55, 1.0); sweatP.userData.set(1, t); say(PI, t, d * 0.55, BX - 0.75, 2.2, -0.3, 0.38); }
  look(BX + 0.1, 1.9, 4.0, BX + 0.1, 1.55, -0.5, 50);
  return S;
}
function sShiin(t, d) { // 次の週。公園のベンチが、しーんとなる
  reset(); lift(140); sitBench(MAUNT, -0.5); sitBench(MAMAS[0], 0.3); sitBench(MAMAS[1], 1.0); STROLLER.visible = true; STROLLER.position.set(-1.3, 0, -1.2); STROLLER.rotation.y = 0.3;
  if (t > d * 0.4) say(shiin, t, d * 0.4, 0.3, 2.0, -1.5, 0.6);
  setHud('マウントに カード', '次の週', 1);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.3, u), 1.8, lerp(4.4, 3.8, u), 0.2, 1.1, -1.5, 50);
  return S;
}
function sNereteru(t, d) { // マウントママが、初めて 最近、寝れてる？ と聞く
  reset(); lift(140); sitBench(MAUNT, -0.5); sitBench(MAMAS[0], 0.3); MAUNT.userData.head.rotation.y = -0.5; MAMAS[0].userData.head.rotation.y = 0.4;
  if (t > d * 0.3) say(nereteru, t, d * 0.3, -0.2, 2.0, -1.4, 1.0);
  look(-0.0, 1.6, 2.4, -0.1, 1.1, -1.5, 50);
  return S;
}
function sZenzen(t, d) { // 隣のママが、実はうちも全然、と笑う
  reset(); lift(140); sitBench(MAUNT, -0.5); sitBench(MAMAS[0], 0.3); MAUNT.userData.head.rotation.y = -0.5; MAMAS[0].userData.head.rotation.y = 0.5; MAMAS[0].rotation.x = -0.05 + Math.abs(Math.sin(t * 8)) * 0.06;
  if (t > d * 0.3) say(zenzen, t, d * 0.3, 0.2, 2.0, -1.4, 1.0);
  look(0.1, 1.6, 2.4, 0.0, 1.1, -1.5, 50);
  return S;
}
function sKekka(t, d) { // 結果：マウントにカードが出るようになって、消えたのは自慢じゃなく、自慢でしか話せなかった寂しさだった
  reset(); lift(140); sitBench(MAUNT, -0.5); sitBench(MAMAS[0], 0.3); sitBench(MAMAS[1], 1.0); MAUNT.userData.head.rotation.y = -0.3;
  if (t > d * 0.5) say(sabishisa, t, d * 0.5, 0.3, 2.1, -1.5, 1.6);
  setTop('結果', '消えたのは 寂しさ', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.3, u), lerp(1.8, 2.1, u), lerp(3.6, 4.6, u), 0.25, 1.1, -1.5, 50);
  return S;
}
function sSenobi(t, d) { // ママ友のマウントは、強さじゃなく、置いていかれたくない人の、背伸びだったのかもしれない
  reset(); lift(140); stand(MAUNT, -0.1, -0.4, 0); const k = easeOut(clamp(t / (d * 0.4))); MAUNT.position.y = 0.12 * k; MAUNT.userData.legs.forEach(l => l.rotation.x = 0);
  if (t > d * 0.45) say(senobi, t, d * 0.45, -0.1, 2.35, -0.4, 1.3);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.0, u), 1.6, lerp(3.4, 3.0, u), -0.1, 1.4, -0.4, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); mauntStroller(); stand(MAMAS[0], 0.75, -0.5, -0.5); stand(MAMAS[1], 1.35, -1.1, -0.6); cardOver(YC, MAUNT, 1, 0, 1.3); parkCam(0); return S; }

const NARR = { '笛': 'ふえ', '音': 'おと', 'マウントママ': 'マウントママ', '押した': 'おした', '固まる': 'かたまる', '不満': 'ふまん', '公園': 'こうえん', '行くたび': 'いくたび', '聞いてもいない': 'きいてもいない', '自慢': 'じまん', '聞かされる': 'きかされる', '月曜': 'げつよう', '習い事': 'ならいごと', '数': 'かず', '水曜': 'すいよう', '夫': 'おっと', '年収': 'ねんしゅう', '金曜': 'きんよう', '旅行': 'りょこう', '写真': 'しゃしん', '見せ合い': 'みせあい', '2枚目': 'にまいめ', '出た': 'でた', '会社': 'かいしゃ', '息子': 'むすこ', '模試': 'もし', '一番': 'いちばん', '言いふらす': 'いいふらす', '次の週': 'つぎのしゅう', '初めて': 'はじめて', '最近': 'さいきん', '寝れてる': 'ねれてる', '聞く': 'きく', '隣': 'となり', '実は': 'じつは', '全然': 'ぜんぜん', '笑う': 'わらう', '結果：': '結果、', '出る': 'でる', '消えた': 'きえた', '話せなかった': 'はなせなかった', '寂しさ': 'さびしさ', '強さ': 'つよさ', '置いていかれたくない': 'おいていかれたくない', '背伸び': 'せのび', '聞き流せる': 'ききながせる' };
const P = planTimes([
  ['ピッ の笛の音に、<br>マウントママが', (t, d) => sKatamaru(t, 2 * d)],
  ['ベビーカーを押したまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['ママたちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['公園に行くたび、聞いてもいない<br>自慢を聞かされる。', (t, d) => sFuman(t + d, 2 * d)],
  ['月曜。習い事の数の自慢。<br>イエローカード。', (t, d) => sStage(0, t, d)],
  ['水曜。夫の年収のにおわせ。<br>イエローカード。', (t, d) => sStage(1, t, d)],
  ['金曜。旅行の写真の見せ合い。<br>2枚目で、レッドカード。', (t, d) => sStage(2, t, d)],
  ['でも、カードが出たのは、<br>ママ友だけじゃなかった。', sDemo],
  ['会社で 息子が模試で一番でさ と<br>言いふらすパパにも、', (t, d) => sPapa(t, 2 * d)],
  ['イエローカード。', (t, d) => sPapa(t + d, 2 * d)],
  ['次の週。公園のベンチが、<br>しーんとなる。', sShiin],
  ['マウントママが、初めて<br>最近、寝れてる？ と聞く。', sNereteru],
  ['隣のママが、<br>実はうちも全然、と笑う。', sZenzen],
  ['結果：マウントにカードが<br>出るようになって、', (t, d) => sKekka(t, 3 * d)],
  ['消えたのは自慢じゃなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['自慢でしか話せなかった<br>寂しさだった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['ママ友のマウントは、<br>強さじゃなく、', (t, d) => sSenobi(t, 2 * d)],
  ['置いていかれたくない人の、<br>背伸びだったのかもしれない。', (t, d) => sSenobi(t + d, 2 * d)],
  ['ママ友のマウント、<br>聞き流せる？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0740',
    v2: true,
    tt: 'main',
    hookLine: '公園で うちの子、もう英語ペラペラで と言ったママの頭の上に、イエローカードがパッと出る。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしもママ友のマウントに、毎回イエローカードが出たら？',
    titleHtml: 'もしもママ友の<br>マウントに、毎回<br>イエローカードが<br>出たら？',
    mood: 'tension', seed: 740, hits: [TP, P.at(4, 1.0), P.at(5, 1.0), P.at(6, 1.4), P.at(13), P.at(17)], risers: [P.at(7)], impacts: [P.at(9, 0.1)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.6), 'meter', 0.25], [P.at(10, 0.6), 'meter', 0.15], [P.at(12, 0.4), 'bubble']],
    narr: NARR,
    ask: 'ママ友のマウント、聞き流せる？',
    caption: 'もしもママ友のマウントに、毎回イエローカードが出たら？\n\nピッ の笛の音に、マウントママがベビーカーを押したまま固まる。\nママたちの不満から。公園に行くたび、聞いてもいない自慢を聞かされる。\n月曜。習い事の数の自慢。イエローカード。\n水曜。夫の年収のにおわせ。イエローカード。\n金曜。旅行の写真の見せ合い。2枚目で、レッドカード。\nでも、カードが出たのは、ママ友だけじゃなかった。\n会社で 息子が模試で一番でさ と言いふらすパパにも、イエローカード。\n次の週。公園のベンチが、しーんとなる。\nマウントママが、初めて 最近、寝れてる？ と聞く。\n隣のママが、実はうちも全然、と笑う。\n\n結果：マウントにカードが出るようになって、消えたのは自慢じゃなく、自慢でしか話せなかった寂しさだった。\nママ友のマウントは、強さじゃなく、置いていかれたくない人の、背伸びだったのかもしれない。\n\nママ友のマウント、聞き流せる？ コメントで教えて。\n\n※風刺ネタです。マウントにカードが出るのは、もしもの設定です。登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'ママ友', 'マウント', '大人の本音'],
    endStats: [['カードが出たもの', 'マウントと自慢', 'もしもの設定'], ['消えたもの', '自慢でしか話せない寂しさ', 'もしもの結果'], ['マウントの正体', '置いていかれたくない背伸び', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
