import * as THREE from 'three';
import { clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight } from '../scenes/room.js';
import { stage, makeBar, setStageColor, stageDisc } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも毎日ストレッチを1か月続けたら？（blueprint no 389・人体の限界シリーズ）
// 数字（すべて一次資料で確認）：
//  Mendez-Rebolledo et al., "Optimal stretching dose for improving range of motion in non-athletes and athletes with
//   hamstring shortening: a dose-response meta-analysis", Annals of Physical and Rehabilitation Medicine 2026;69(7):102153
//   https://www.em-consulte.com/article/1845926
//   ・84研究（運動選手でない人 3,008人・選手 1,059人）。太ももの裏が硬い人
//   ・運動選手でない人の静的ストレッチ（何もしない人と比べて）：脚を伸ばしたまま上げる角度（SLR）+12.11度
//   ・1回だけ（1.5分）では、はっきりした差（12度）に届かなかった。1週間以上・合計70分で届きやすい
//  la Roche & Connolly, "Effects of stretching on passive muscle tension and response to eccentric exercise",
//   Am J Sports Med 2006;34(6):1000-1007（4週間・合計3,600秒。可動域と伸張への慣れ（stretch tolerance）は上がり、
//   筋肉の硬さ（stiffness）は変わらなかった。増えたのは主に慣れによると結論）
//   https://search.pedro.org.au/search-results/record-detail/16218
//  ・70分÷30日＝約2分20秒（単純計算）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- living room: yoga mat + you lying on your back, raising one straight leg ----------
const MAT_Z = 1.2;
const yogaMat = box(2.2, 0.02, 0.8, mat('#8fb34f')); yogaMat.position.set(-0.2, 0.011, MAT_Z); room.add(yogaMat);
const towel = box(0.45, 0.04, 0.3, mat('#f2f2ee')); towel.position.set(1.4, 0.03, MAT_Z + 0.75); room.add(towel);
const you = makePerson({ skin: SKIN[2], hair: HAIR[0], shirt: '#8e6bbf', pants: '#2b2f3a', long: true, scale: 1 });
const wrap = new THREE.Group(); wrap.add(you); room.add(wrap);
// local y (head) → world -x, local z (face) → world +y
const LYING = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)));
const HIP = new THREE.Vector3(0.2, 0.16, MAT_Z);
function lie(deg) { // deg: raised leg angle from the floor
  wrap.visible = true; wrap.quaternion.copy(LYING); wrap.position.copy(HIP);
  you.position.set(0, -0.86, 0); you.rotation.set(0, 0, 0);
  const U = you.userData;
  U.legs[0].rotation.x = 0; U.legs[1].rotation.x = -deg * Math.PI / 180;
  U.arms.forEach((a, i) => a.rotation.set(0, 0, i ? -0.12 : 0.12));
  U.head.rotation.set(-0.15, 0, 0);
}
// angle wedges in the leg's plane (world XY), at the hip
const BASE = 55, GAIN = 12;
const wedgeBase = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
const wedgeGain = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x3fe0a8, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
[wedgeBase, wedgeGain].forEach(w => { w.position.set(HIP.x + 0.0, HIP.y + 0.08, MAT_Z + 0.32); w.renderOrder = 4; room.add(w); });
const gainTag = textSprite('+12度', { w: 384, h: 160, size: 96, bg: 'rgba(32,170,120,.95)', sx: 0.62 }); gainTag.material.depthTest = false; gainTag.renderOrder = 8; room.add(gainTag);
let wKey = '';
function wedges(base, gain, op = 1) {
  const key = base.toFixed(1) + '/' + gain.toFixed(2);
  if (key !== wKey) {
    wKey = key; const r = Math.PI / 180;
    wedgeBase.geometry.dispose(); wedgeBase.geometry = new THREE.RingGeometry(0.12, 0.95, 40, 1, 0, Math.max(0.001, base * r));
    wedgeGain.geometry.dispose(); wedgeGain.geometry = new THREE.RingGeometry(0.12, 1.12, 16, 1, base * r, Math.max(0.001, gain * r));
  }
  wedgeBase.visible = op > 0.01; wedgeGain.visible = gain > 0.2 && op > 0.01;
  wedgeBase.material.opacity = 0.28 * op; wedgeGain.material.opacity = 0.85 * op;
  const a = (base + gain / 2) * Math.PI / 180;
  gainTag.visible = gain > 0.5 && op > 0.01; gainTag.material.opacity = op;
  const b = (base + gain + 32) * Math.PI / 180; gainTag.position.set(wedgeGain.position.x + Math.cos(b) * 0.95, wedgeGain.position.y + Math.sin(b) * 0.95, wedgeGain.position.z + 0.1);
  gainTag.userData.set('+' + Math.round(gain) + '度');
}
const pop = makeSparkles(120, 0.05, 0x9fffd8); room.add(pop.points);
{ const a = (BASE + GAIN) * Math.PI / 180; pop.init([[HIP.x + Math.cos(a) * 0.9, HIP.y + Math.sin(a) * 0.9, MAT_Z]], 0.25, 0.6); }
function living(light = 'day', opt = { ceil: 6, hemi: 1.05 }) { setRoom({ sets: ['desk'], floor: 'wood' }); setLight(light, opt); pop.set(0); wedges(BASE, 0, 0); }
function sideCam(t, d, a, b, tg = [0.05, 0.6, MAT_Z]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 48); }

// ---------- stage: 30 day tiles (70 minutes) ----------
const DAYS = new THREE.Group(); stage.add(DAYS);
const tiles = []; for (let i = 0; i < 30; i++) { const tl = box(0.95, 0.95, 0.2, mat('#2d3a58')); tl.position.set(-2.55 + (i % 6) * 1.02, 8.2 - Math.floor(i / 6) * 1.02, 0); DAYS.add(tl); tiles.push(tl); }
const dayTitle = textSprite('1か月＝30日', { w: 768, h: 128, size: 72, sx: 5 }); dayTitle.position.set(0, 9.6, 0); DAYS.add(dayTitle);
const LIT = new THREE.Color('#3fe0a8'), OFF = new THREE.Color('#2d3a58');
function setDays(n) { tiles.forEach((tl, i) => tl.material.color.copy(i < n ? LIT : OFF)); }
// ---------- stage: 3 bars (qualitative: before = 1, after) ----------
const B3 = [['筋肉の硬さ', '#9aa7c2', 0], ['伸ばされる慣れ', '#3fe0a8', 1], ['脚の上がる角度', '#4fa3d1', 1]];
const bars = B3.map(([lab, c], i) => makeBar({ color: c, w: 1.7, d: 1.7, label: lab, x: -3.6 + i * 3.6, z: 0, nameTop: true }));
const BH = 3.2;
function setBars(k, show = true) { bars.forEach((b, i) => { const kk = clamp(k[i] ?? 0); b.g.visible = show; b.setH(BH * (1 + B3[i][2] * 0.55 * ease(kk)), kk > 0.6 ? (B3[i][2] ? 'アップ' : '変化なし') : ''); }); }
function stageMode(m) { DAYS.visible = m === 'days'; bars.forEach(b => b.g.visible = m === 'bars'); stageDisc.visible = m === 'bars'; }

const SUBS = [
  [2.6, 6.0, '体は柔らかくなった。<br>でも理由が意外だった。'],
  [6.2, 10.1, '体が硬い人の84の研究を<br>まとめた分析がある。'],
  [10.1, 14, '太ももの裏を伸ばし続けると、<br>脚の上がる角度は…'],
  [14.2, 18.1, '約12度アップ。<br>でも、条件があった。'],
  [18.1, 22, '1回伸ばしただけでは、<br>はっきりした差にならない。'],
  [22.2, 26.1, 'カギは合計の時間。<br>目安は合計70分。'],
  [26.1, 30, '1か月で割ると、<br>1日たった約2分20秒。'],
  [30.2, 34.6, 'じゃあ筋肉は、<br>本当に伸びたのか？'],
  [34.6, 39, '4週間の研究で、筋肉の<br>硬さは変わらなかった。'],
  [39.2, 43.6, '変わったのは、<br>伸ばされることへの慣れ。'],
  [43.6, 47.8, '体が「ここまで大丈夫」と<br>覚えたという見方だ。'],
  [48.1, 53.8, '結果：脚は約12度上がった。<br>変わったのは筋肉より感じ方。'],
  [53.9, 56.1, '痛いほど伸ばさないで。'],
  [56.2, 59.4, '次に1か月続けて<br>ほしいことは？'],
];

const TP = 0.5;
const dayHud = (d, col) => setHud('毎日ストレッチ', d + '日目', 1, { color: col || '#fff' });
const HOOK_A = [0.7, 1.15, MAT_Z + 4.8], HOOK_B = [0.65, 1.1, MAT_Z + 4.5];
function shot0(t) { // hook: the leg jumps up 12 degrees
  lift(95);
  living();
  const g = GAIN * ease(clamp((t - TP + 0.12) / 0.25));
  lie(BASE + g); wedges(BASE, g, 1);
  pop.set(t >= TP ? (t - TP) / 1.1 : 0);
  el.flash.style.opacity = t >= TP ? 0.45 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  sideCam(t, 2.5, HOOK_A, HOOK_B);
  dayHud(t < TP ? 0 : 30, t < TP ? '#fff' : GREEN);
  return room;
}
function shot1(t) { // the leg lowers, camera drifts; 84 studies
  lift(95);
  living();
  const g = GAIN * (1 - ease(clamp(t / 1.2)));
  lie(BASE + g + Math.sin(t * 0.9) * 2); wedges(BASE, g, 1 - clamp((t - 0.6) / 0.6));
  sideCam(t, 7.6, HOOK_B, [-1.0, 1.6, MAT_Z + 5.4]);
  dayHud(1);
  setTop('体が硬い人の研究のまとめ（2026年）', countUp(t - 3.7, 84, 0.1, 1.0) + '件', fade(t, 3.75, 7.6, 0.25), BLUE);
  return room;
}
function shot2(t) { // side view: +12 degrees, then "one time is not enough"
  lift(95);
  living();
  const up = t < 7.9 ? ease(clamp((t - 3.4) / 1.4)) : 1 - ease(clamp((t - 7.9) / 1.0));
  const g = GAIN * up; lie(BASE + g); wedges(BASE, g, 1);
  pop.set(t > 4.1 && t < 6 ? (t - 4.1) / 1.2 : 0);
  sideCam(t, 11.9, [0.4, 1.0, MAT_Z + 5.4], [0.35, 0.95, MAT_Z + 5.0]);
  dayHud(t < 7.9 ? 30 : 1);
  if (t > 3.8 && t < 7.9) setTop('脚の上がる角度（静的ストレッチ・2026年）', '+' + (countUp(t, 121, 4.1, 1.0) / 10).toFixed(1) + '度', fade(t, 3.8, 7.9, 0.25), GREEN);
  else if (t >= 7.9) setTop('1回だけ（1.5分）伸ばしたとき（2026年）', '12度に届かず', fade(t, 7.9, 11.9, 0.25), RED);
  return room;
}
function shot3(t) { // stage: 30 days light up → 70 minutes
  setStageColor('#111a2e'); stageMode('days');
  const n = 30 * ease(clamp((t - 0.6) / 3.4)); setDays(n);
  const u = ease(t / 8.2); look(0, lerp(6.0, 6.2, u), lerp(14.5, 13.8, u), 0, 6.2, 0, 50);
  lift(160);
  dayHud(Math.max(1, Math.round(n)));
  if (t < 4.1) setTop('効果が出やすい合計時間（2026年）', countUp(t, 70, 0.6, 3.2) + '分', fade(t, 0.3, 4.1, 0.25), GREEN);
  else setTop('70分÷30日（単純計算）', '1日 約2分20秒', fade(t, 4.1, 8.2, 0.25), GOLD);
  return stage;
}
function shot4(t) { // stage: muscle stiffness unchanged
  setStageColor('#14213a'); stageMode('bars');
  setBars([clamp((t - 4.4) / 1.2), 0, 0]);
  const u = ease(t / 17.8); look(lerp(-0.4, 0.0, u), 4.6, lerp(21, 20, u), lerp(-0.4, 0.0, u), 3.4, 0, 50);
  lift(160);
  dayHud(30);
  if (t > 4.4) setTop('筋肉の硬さ（4週間のストレッチ・2006年）', '変化なし', fade(t, 4.4, 9.0, 0.25), BLUE);
  return stage;
}
function shot5(t) { // stage: tolerance and range go up
  setStageColor('#14213a'); stageMode('bars');
  setBars([1, clamp((t - 0.3) / 1.4), clamp((t - 4.6) / 1.4)]);
  const u = ease(t / 8.8); look(lerp(0.0, 0.3, u), 4.6, lerp(20, 19.5, u), lerp(0.0, 0.3, u), 3.6, 0, 50);
  lift(160);
  dayHud(30);
  if (t < 4.4) setTop('伸ばされることへの慣れ（2006年）', 'アップ', fade(t, 0.3, 4.4, 0.25), GREEN);
  else setTop('脚の上がる角度（2026年のまとめ）', '+12.1度', fade(t, 4.4, 8.8, 0.25), GREEN);
  return stage;
}
function shot6(t) { // result: leg raised with the green +12 wedge
  lift(95);
  living('day', { ceil: 6, hemi: 1.1 });
  lie(BASE + GAIN); wedges(BASE, GAIN, 1);
  sideCam(t, 7.5, [-0.6, 1.5, MAT_Z + 5.2], [0.5, 1.2, MAT_Z + 5.6]);
  const a = t < 3.6;
  setTop(a ? '脚の上がる角度（静的ストレッチ・2026年）' : '筋肉の硬さ（4週間・2006年）', a ? '+12.1度' : '変化なし', fade(t, 0.15, 7.5, 0.25), a ? GREEN : BLUE);
  return room;
}
function shot7(t) { // loop: hook framing, leg up
  lift(95);
  living();
  lie(BASE + GAIN); wedges(BASE, GAIN, 1);
  sideCam(t, 4, HOOK_B, HOOK_A);
  dayHud(30, GREEN);
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 10.1, f: shot1 }, { a: 10.1, b: 22, f: shot2 }, { a: 22, b: 30.2, f: shot3 },
  { a: 30.2, b: 39.2, f: shot4 }, { a: 39.2, b: 48, f: shot5 }, { a: 48, b: 55.5, f: shot6 }, { a: 55.5, b: 59.5, f: shot7 },
  { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0389',
    v2: true,
    hookLine: '1か月で、脚が12度上がった。',
    series: '人体の限界',
    hookType: 'H4',
    cat: '体・健康',
    title: '毎日ストレッチを1か月続けたら？',
    titleHtml: '毎日ストレッチを<br>1か月続けたら？',
    mood: 'hopeful', seed: 389, hits: [0.5, 48.1], risers: [30.2], impacts: [14.3, 22.6, 35.0],
    sfx: [[0.5, 'whoosh']],
    narr: { '約12度': 'やく12ど', '12度': '12ど', '84の研究': '84のけんきゅう', '約2分20秒': 'やく2ふん20びょう', '70分': '70ぷん', '4週間': '4しゅうかん' },
    ask: '次に1か月続けてほしいことは？',
    caption: 'もしも毎日ストレッチを1か月続けたら、体はどうなる？\n太ももの裏が硬い人を調べた84の研究をまとめた分析（2026年）では、運動選手でない人が静的ストレッチを続けると、脚を伸ばしたまま上げる角度が何もしない人より約12度（12.11度）大きくなった。\nただし1回だけ（1.5分）伸ばしても、はっきりした差には届かない。1週間以上・合計70分ほどで届きやすかった。1か月なら1日約2分20秒（単純計算）。\nじゃあ筋肉は伸びたのか？ 4週間ストレッチした研究（2006年）では、筋肉の硬さは変わらず、増えたのは伸ばされることへの慣れだった。\n痛いほど伸ばさないで。痛みやけががある人は医師に相談を。\n\n次に1か月続けてほしいことは？ コメントで教えて。\n\n出典：Mendez-Rebolledo ほか Annals of Physical and Rehabilitation Medicine（2026年）、la Roche・Connolly The American Journal of Sports Medicine（2006年）',
    hashtags: ['もしもラボ', 'ストレッチ', '柔軟', '体が硬い', '雑学'],
    endStats: [['脚の上がる角度', '+12.1度', '2026年のまとめ'], ['効果が出やすい合計時間', '70分', '2026年'], ['1か月なら1日', '約2分20秒', '単純計算'], ['筋肉の硬さ', '変化なし', '4週間・2006年']],
    sources: '出典：Annals of Physical and Rehabilitation Medicine（2026年）、<br>The American Journal of Sports Medicine（2006年）',
  },
});
