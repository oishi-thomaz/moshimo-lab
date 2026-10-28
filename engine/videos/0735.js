import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, setScreen, props, lamp, glow } from '../scenes/room.js';
import { stage, setStageColor, stageDisc } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも毎日スマホを8時間見続けたら？（blueprint no 735・人体の限界シリーズ）
// 数字：
//  頭の重さ：まっすぐで10〜12ポンド（約5kg）。前に倒すと首にかかる力は 15度 27ポンド（約12kg）・30度 40ポンド（約18kg）・
//   45度 49ポンド（約22kg）・60度 60ポンド（約27kg）（Hansraj, Surgical Technology International 25:277-279, 2014）
//   https://www.medicaleconomics.com/view/spine-surgeon-touches-a-nerve-with-text-neck-study
//  裸眼視力1.0未満：高校生71.51%・中学生59.35%・小学生36.07%（文部科学省 2025年度学校保健統計調査／秋田魁新報 2026年2月13日）
//   https://www.sakigake.jp/news/article/20260213CO0110/
//  スマホ＋パソコンの画面時間が長いと近視のオッズ比1.77（95%CI 1.28–2.45）。スマホだけでは1.26（1.00–1.60）
//   （Foreman et al., The Lancet Digital Health 2021年／33論文のシステマティックレビュー・11論文のメタ分析）
//   https://reviewofmm.com/global-evidence-links-digital-device-screen-time-with-myopia/
//  8時間×365日＝2,920時間＝約122日分。1日16時間起きているとして起きている時間の半分（単純計算）

const BLUE = '#7fd4ff', GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#7ff0c8';

// ---------- you on the sofa with a phone ----------
const you = makePerson({ skin: SKIN[3], hair: HAIR[2], shirt: '#c94f7c', pants: '#2b3346', long: true, scale: 1 }); room.add(you);
const U = you.userData, head = U.head;
const scrM = new THREE.MeshBasicMaterial({ color: '#cfe6ff' });
const phone = new THREE.Group(); { const b = box(0.09, 0.16, 0.02, mat('#1b1d22')); phone.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.14), scrM); s.position.z = 0.012; phone.add(s); }
phone.position.set(0, -0.62, 0.1); phone.rotation.x = -1.1; U.arms[1].add(phone);
const pl = new THREE.PointLight(0xbcd8ff, 0, 1.8, 1.5); room.add(pl);
// neck load marker
const neckGlow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.0, depthWrite: false })); room.add(neckGlow);
const kgTag = textSprite('5kg', { w: 384, h: 160, size: 92, bg: 'rgba(224,72,58,.92)', sx: 0.5 }); kgTag.material.depthTest = false; kgTag.renderOrder = 8; room.add(kgTag);
function sit(t, tilt) { // tilt 0..1 → head 0..60 degrees forward
  you.visible = true; you.position.set(0.3, -0.42, 0.6); you.rotation.set(0, Math.PI, 0);
  U.legs.forEach(l => l.rotation.x = -Math.PI / 2);
  U.arms[0].rotation.set(-0.9, 0, 0.25); U.arms[1].rotation.set(-1.05, 0, -0.2);
  head.rotation.set(tilt * 1.05, 0, 0);
  pl.position.set(0.3, 1.25, 0.15);
}
function neckMark(kg, op) {
  const v = new THREE.Vector3(); head.getWorldPosition(v);
  neckGlow.position.copy(v); neckGlow.material.opacity = 0.45 * op; neckGlow.visible = op > 0.01;
  kgTag.position.set(v.x, v.y + 0.3, v.z + 0.38); kgTag.visible = op > 0.01; kgTag.material.opacity = op; kgTag.userData.set(kg);
}
const zzz = makeSparkles(10, 0.01); room.add(zzz.points);
function sofa(light, opt) {
  setRoom({ sets: ['living'] }); setLight(light, opt); props.sleeper.visible = false;
  setScreen((g, w, h) => { g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h); });
  pl.intensity = 2.2; glow.intensity = 0; neckMark('5kg', 0);
}
function sideCam(t, d, a, b, tg = [0.3, 1.15, 0.5]) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), ...tg, 48); }
function frontCam(t, d, a, b) { const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0.4, 0.95, 0.6, 50); }

// ---------- stage: rice bags (27kg ≒ 5kg × 5.4) ----------
const RICE = new THREE.Group(); stage.add(RICE);
const bagTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#f3ecd8'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#c94a3a'; g.fillRect(0, 96, 256, 32); g.fillStyle = '#3a3a3a'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('お米 5kg', 128, 50); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const bagM = [mat('#efe6cf'), mat('#efe6cf'), mat('#efe6cf'), mat('#efe6cf'), new THREE.MeshLambertMaterial({ map: bagTex }), mat('#efe6cf')];
const bags = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.62, 1.4), bagM); b.position.set(1.7, 0.62 + i * 0.64, 0); b.castShadow = true; RICE.add(b); bags.push(b); }
const sPerson = makePerson({ skin: SKIN[3], hair: HAIR[2], shirt: '#c94f7c', pants: '#2b3346', long: true, scale: 2.2 }); sPerson.position.set(-1.7, 0.3, 0); sPerson.rotation.y = 1.25; RICE.add(sPerson);
const sPhone = box(0.09, 0.16, 0.02, mat('#1b1d22')); sPhone.position.set(0, -0.62, 0.1); sPhone.rotation.x = -1.1; sPerson.userData.arms[1].add(sPhone);
sPerson.userData.arms[1].rotation.x = -1.1; sPerson.userData.arms[0].rotation.x = -0.9; sPerson.userData.head.rotation.x = 1.05;
const eqTag = textSprite('＝', { w: 256, h: 256, size: 200, sx: 1.4 }); eqTag.position.set(0.0, 1.9, 0.8); RICE.add(eqTag);
function setBags(k) { const n = k * 5.4; bags.forEach((b, i) => { const f = clamp(n - i); b.visible = f > 0.01; b.scale.set(1, Math.max(0.01, f), 1); b.position.y = 0.6 + i * 0.64 - (1 - f) * 0.31; }); }

// ---------- stage: a year of 365 tiles, 122 lit ----------
const DAYS = new THREE.Group(); stage.add(DAYS);
const tileGeo = new THREE.BoxGeometry(0.42, 0.42, 0.12);
const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), 365); DAYS.add(tiles);
{ const m = new THREE.Matrix4(); for (let i = 0; i < 365; i++) { const c = i % 19, r = Math.floor(i / 19); m.makeTranslation(-4.05 + c * 0.45, 9.0 - r * 0.45, 0); tiles.setMatrixAt(i, m); tiles.setColorAt(i, new THREE.Color('#2d3a58')); } }
const dayTitle = textSprite('1年＝365日', { w: 768, h: 128, size: 72, sx: 5 }); dayTitle.position.set(0, 10.1, 0); DAYS.add(dayTitle);
const LIT = new THREE.Color('#5fc8ff'), OFF = new THREE.Color('#2d3a58');
let litN = -1;
function setDays(n) { n = Math.round(n); if (n === litN) return; litN = n; for (let i = 0; i < 365; i++) tiles.setColorAt(i, i < n ? LIT : OFF); tiles.instanceColor.needsUpdate = true; }
function stageMode(m) { RICE.visible = m === 'rice'; DAYS.visible = m === 'days'; stageDisc.visible = m === 'rice'; }

const SUBS = [
  [2.6, 6.0, '起きてから寝るまで、<br>スマホを見続ける毎日。'],
  [6.2, 10.1, 'まっすぐなら頭は約5kg。<br>でも問題は角度だった。'],
  [10.1, 14, '60度うつむくと、<br>首には約27kgの負担。'],
  [14.2, 18.1, '27kgは、お米5kg袋の<br>5袋分以上。'],
  [18.1, 22, 'それを毎日8時間。<br>しかも首だけじゃない。'],
  [22.2, 26.1, '高校生の7割は、<br>裸眼視力が1.0未満。'],
  [26.1, 30, '画面を長く見る子どもは、<br>近視になりやすさ約1.8倍。'],
  [30.2, 34.6, '8時間×365日は2,920時間。<br>何日分になる？'],
  [34.6, 39, 'まるまる122日分、<br>スマホを見ていた計算だ。'],
  [39.2, 43.6, '起きている時間の、<br>ちょうど半分。'],
  [43.6, 47.8, 'その間ずっと、<br>首はうつむいたまま。'],
  [48.1, 53.8, '結果：1年で122日分うつむき、<br>首は毎日27kgを支えた。'],
  [53.9, 56.1, '頭を起こせば約5kg。'],
  [56.2, 59.4, 'あなたの1日の<br>スマホ時間は？'],
];

const hms = (s) => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = Math.floor(s) % 60; return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
const TP = 0.5;
// v2：1枚目（サムネ）で頭と kg の札がタイトルにかからないよう、少し引いて横から
const HOOK_LIFT = 150;
function hookCam(t, d) { const u = ease(t / d); look(lerp(-3.4, -3.25, u), lerp(1.75, 1.7, u), lerp(-0.7, -0.75, u), 0.3, 1.3, 0.5, 54); }
function shot0(t) { // hook: screen-time clock runs, the head bends forward, the neck turns red
  lift(HOOK_LIFT);
  sofa('evening', { ceil: 7, hemi: 0.9 });
  // v2：0秒目は頭まっすぐ（5kg）。0.5秒で8時間に届いて、頭がガクッと前へ（27kg）
  const k = ease(clamp((t - (TP - 0.3)) / 0.3)); sit(t, k);
  neckMark(Math.round(lerp(5, 27, k)) + 'kg', 1);
  el.flash.style.opacity = t >= TP ? 0.4 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  hookCam(t, 2.5);
  setHud('スマホを見た時間', hms(t < TP ? Math.pow(t / TP, 1.6) * 8 * 3600 : 8 * 3600 + (t - TP) * 60), 1, { mono: true, color: t >= TP ? '#ff8a7a' : '#fff' });
  return room;
}
function shot1(t) { // everyday: on the sofa, scrolling
  lift(150);
  sofa('evening', { ceil: 7, hemi: 0.9 }); sit(t, 0.75 + Math.sin(t * 0.8) * 0.05);
  frontCam(t, 3.5, [-2.3, 1.9, -2.2], [-1.9, 1.85, -2.4]);
  setHud('スマホを見た時間', hms(3600 + t * 900), 1, { mono: true });
  return room;
}
function shot2(t) { // +1時間: side view, head straight → 60 degrees, kg tag 5 → 27
  lift(150);
  sofa('evening', { ceil: 7, hemi: 0.9 });
  const k = t < 0.8 ? 1 - ease(t / 0.8) : t < 4.1 ? 0 : ease(clamp((t - 4.1) / 1.2)); sit(t, k); // v2：冒頭でうつむいた頭を、いったん起こしてから説明
  neckMark(Math.round(lerp(5, 27, k)) + 'kg', 1);
  sideCam(t, 8, [-2.9, 1.75, 0.5], [-2.6, 1.65, 0.45]);
  hudTime('+1時間');
  setTop(t < 4.1 ? '頭の重さ（まっすぐ・2014年）' : '首にかかる重さ（60度うつむく・2014年）', '約' + Math.round(lerp(5, 27, k)) + 'kg', fade(t, 0.85, 8, 0.25), t < 4.1 ? GREEN : RED); // v2：頭を起こし切ってから 5kg を出す
  return room;
}
function shot3(t) { // +1日: stage, the bent figure = 5.4 bags of rice
  setStageColor('#1d2438'); stageMode('rice'); setBags(clamp((t - 0.4) / 3.2));
  const u = ease(t / 8); look(lerp(0, 0.3, u), lerp(3.8, 4.0, u), lerp(13.2, 12.6, u), 0, 2.6, 0, 50);
  lift(330);
  hudTime('+1日');
  if (t < 4.2) setTop('27kg（単純計算）', 'お米5kg袋 ' + (Math.round(clamp((t - 0.4) / 3.2) * 54) / 10).toFixed(1) + '袋', fade(t, 0.3, 4.2, 0.25), GOLD);
  else setTop('首でお米を支える時間（毎日）', countUp(t - 4.2, 8, 0.1, 0.8) + '時間', fade(t, 4.2, 8, 0.25), RED);
  return stage;
}
function shot4(t) { // +1か月: front close-up, face lit by the phone at night
  lift(150);
  sofa('night', { ceil: 1.5, hemi: 0.7, lamp: 1.2 }); lamp.position.set(-2.6, 1.6, 0.2); pl.intensity = 0.22;
  sit(t, 0.45);
  const u = ease(t / 8); look(lerp(-0.9, -0.7, u), lerp(1.15, 1.1, u), lerp(-1.7, -1.5, u), 0.3, 1.2, 0.55, 46);
  hudTime('+1か月');
  if (t < 3.9) setTop('裸眼視力1.0未満の高校生（2025年度）', (countUp(t, 715, 0.4, 1.2) / 10).toFixed(1) + '%', fade(t, 0.3, 3.9, 0.25), BLUE);
  else setTop('近視になりやすさ（画面を長く見る子・2021年）', '約1.8倍', fade(t, 3.9, 8, 0.25), BLUE);
  return room;
}
function shot5(t) { // +1年: 365 tiles, 122 light up
  setStageColor('#111a2e'); stageMode('days'); setDays(122 * ease(clamp((t - 0.6) / 3.6)));
  dayTitle.userData.set('1年＝365日');
  const u = ease(t / 9.2); look(0, lerp(6.4, 6.6, u), lerp(19.5, 18.8, u), 0, 6.4, 0, 50);
  lift(280);
  hudTime('+1年');
  if (t < 4.4) setTop('8時間×365日（単純計算）', countUp(t, 2920, 0.4, 1.4).toLocaleString('en-US') + '時間', fade(t, 0.3, 4.4, 0.25), BLUE);
  else setTop('スマホを見ていた日数（単純計算）', '約122日分', fade(t, 4.4, 9.2, 0.25), BLUE);
  return stage;
}
function shot6(t) { // still on the sofa at night, head down, neck red
  lift(150);
  sofa('night', { ceil: 2, hemi: 0.6, lamp: 1.0 }); lamp.position.set(-2.6, 1.6, 0.2); pl.intensity = 3.0;
  sit(t, 1); neckMark('27kg', 1);
  sideCam(t, 8.8, [-3.1, 1.8, 0.7], [-2.8, 1.75, 0.5]);
  hudTime('+1年');
  if (t < 4.4) setTop('起きている時間のうち（1日16時間として）', '半分', fade(t, 0.3, 4.4, 0.25), BLUE);
  else setTop('首にかかる重さ（60度うつむく・2014年）', '約27kg', fade(t, 4.4, 8.8, 0.25), RED);
  return room;
}
function shot7(t) { // result: the year view again, 122 lit
  setStageColor('#111a2e'); stageMode('days'); setDays(122);
  const u = ease(t / 7.5); look(0, lerp(6.6, 6.8, u), lerp(18.8, 20, u), 0, 6.4, 0, 50);
  lift(280);
  const a = t < 3.6;
  setTop(a ? 'うつむいていた日数（1年・単純計算）' : '首にかかる重さ（毎日8時間）', a ? '約122日分' : '約27kg', fade(t, 0.15, 7.5, 0.25), a ? BLUE : RED);
  return stage;
}
function shot8(t) { // loop: back to the side view, head starting to bend
  lift(HOOK_LIFT);
  sofa('evening', { ceil: 7, hemi: 0.9 }); sit(t, 0); neckMark('5kg', 1);
  hookCam(t + 0.5, 4.5); // v2：冒頭（サムネ）と同じ構図・頭まっすぐ・5kg に戻してループ
  setHud('スマホを見た時間', hms(0), 1, { mono: true });
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30.2, f: shot4 }, { a: 30.2, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：ソファでスクロールする日常（元の2.5〜6秒）を抜いて、うつむいた直後から本題へ
  meta: {
    id: '0735',
    v2: true,
    hookLine: 'うつむいた首に、27kgがのしかかった。',
    series: '人体の限界',
    hookType: 'H4',
    cat: '体・健康',
    title: '毎日スマホを8時間見続けたら？',
    titleHtml: '毎日スマホを<br>8時間見続けたら？',
    mood: 'tension', seed: 735, hits: [0.5, 48.1], risers: [30.2], impacts: [11.0, 18.4, 35.0],
    sfx: [[0.5, 'meter', 0.45]],
    narr: { '約5kg': 'やく5キロ', '約27kg': 'やく27キロ', '27kg': '27キロ', 'お米5kg袋': 'お米5キロぶくろ', '1.0未満': '1.0みまん', '約1.8倍': 'やく1.8ばい', '8時間×365日': '8時間かける365日', '2,920時間': '2920時間', '60度': '60ど' },
    ask: 'あなたの1日のスマホ時間は？',
    caption: 'もしも毎日スマホを8時間見続けたら、体はどうなる？\n頭の重さは、まっすぐなら約5kg。でも60度うつむくと、首には約27kgの負担がかかる（2014年の研究）。お米5kg袋の5袋分以上を、毎日8時間首で支える計算。\n目も近くを見続ける。高校生の71.51%は裸眼視力が1.0未満（2025年度 学校保健統計）。スマホとパソコンの画面を長く見る子どもは、近視のなりやすさ（オッズ比）が約1.8倍という分析もある（2021年）。\n8時間×365日は2,920時間。まるまる約122日分で、1日16時間起きているとすれば起きている時間の半分（単純計算）。\n頭を起こせば首の負担は約5kg。\n\nあなたの1日のスマホ時間は？ コメントで教えて。\n\n出典：Hansraj, Surgical Technology International（2014年）、文部科学省 学校保健統計調査（2025年度）、Foreman ほか The Lancet Digital Health（2021年）',
    hashtags: ['もしもラボ', 'スマホ首', 'スマホ', '視力', '雑学'],
    endStats: [['首にかかる重さ（60度）', '約27kg', '2014年'], ['裸眼視力1.0未満の高校生', '71.51%', '2025年度'], ['近視のなりやすさ（画面が長い子）', '約1.8倍', '2021年'], ['8時間×365日', '約122日分', '単純計算']],
    sources: '出典：Surgical Technology International（2014年）、<br>文部科学省 学校保健統計（2025年度）、Lancet Digital Health（2021年）',
  },
});
