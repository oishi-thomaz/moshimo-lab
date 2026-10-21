import * as THREE from 'three';
import { clamp, lerp, ease, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight, props } from '../scenes/room.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも腕立て100回を30日続けたら？（blueprint no 31。0031 は別の動画で使用済みのため id 0531）
// 数字（すべて一次資料で確認）：
//  ・筋トレをしている人の割合 9〜29%（笹川スポーツ財団「スポーツライフに関する調査」2020年／厚生労働省「健康づくりのための身体活動・運動ガイド2023」で引用）
//  ・筋トレは週2〜3日がおすすめ（厚生労働省 身体活動・運動ガイド2023）
//  ・筋トレをしている人は総死亡・心血管疾患・がん・糖尿病のリスクが10〜17%低い（Momma et al., Br J Sports Med 2022／東北大学・早稲田大学・九州大学 プレスリリース 2022年3月1日）
//  ・高強度の脚の筋トレ（週3回）で、20日後に太ももの筋肉の断面積が3.5%増、35日で筋力（MVC）が38.9%増（Seynnes et al., J Appl Physiol 2007, 7人）
//  ・腕立て40回以上できた男性は10回未満の男性より心血管疾患が96%少なかった（米国の消防士1,104人・10年追跡、Yang et al., JAMA Network Open 2019／ハーバード公衆衛生大学院 2019年2月15日）
//  ・100回×30日＝3,000回（単純計算）

// ---------- living room: mat + you ----------
const MAT_Z = 2.5;
const yogaMat = box(2.1, 0.02, 0.75, mat('#4f8fb3')); yogaMat.position.set(-0.55, 0.011, MAT_Z); room.add(yogaMat);
const you = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#e05a4f', pants: '#2b2f3a', scale: 1 });
room.add(you);
const towel = box(0.4, 0.04, 0.25, mat('#f2f2ee')); towel.position.set(0.9, 0.03, 2.95); room.add(towel);
const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.24, 10), mat('#7fd4ff', { transparent: true, opacity: 0.8 })); bottle.position.set(1.15, 0.12, 2.75); room.add(bottle);
// sweat drops
const sweatM = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.9 });
const sweat = [0, 1, 2].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), sweatM); d.scale.set(1, 1.5, 1); room.add(d); return d; });
// push-up pose. u: 1 = arms straight (up), 0 = chest near the floor. body lies along +x, toes at (x0, 0, z)
const ARM = 0.68, SH = 1.44;
function pushPose(p, u, x0 = -1.45, z = MAT_Z) {
  const h = lerp(0.3, ARM, u);
  const th = Math.asin(h / SH);
  const rx = Math.PI / 2 - th;
  p.rotation.set(rx, Math.PI / 2, 0, 'YXZ');
  p.position.set(x0, 0, z);
  const { arms, legs, head } = p.userData;
  arms.forEach(a => { a.rotation.set(-rx, 0, 0); a.scale.y = h / ARM; });
  legs.forEach(l => l.rotation.x = 0);
  head.rotation.x = -0.35;
}
function standPose(p, x = -0.4, z = -1.7, ry = 0.25) {
  p.rotation.set(0, ry, 0); p.position.set(x, 0, z);
  p.userData.arms.forEach(a => { a.rotation.set(0, 0, 0); a.scale.y = 1; }); p.userData.legs.forEach(l => l.rotation.x = 0); p.userData.head.rotation.set(0, 0, 0);
}
// rep timing: reps at `rate` per second; returns u (1 up .. 0 down)
const repU = (t, rate) => 0.5 + 0.5 * Math.cos(t * rate * Math.PI * 2);
function showSweat(on, t) { sweat.forEach((d, i) => { d.visible = on; if (on) { const k = ((t * 0.8 + i * 0.33) % 1); d.position.set(-0.05 + i * 0.07, 0.75 - k * 0.6, MAT_Z + 0.12 - i * 0.08); } }); }
function living(mode = 'evening') {
  setRoom({ sets: ['living'] });
  setLight(mode, mode === 'evening' ? { ceil: 11, hemi: 0.95 } : {});
  yogaMat.visible = true;
}
const sideCam = (t, d = 3, k = 0) => { const u = ease(t / d); look(lerp(0.2, -0.3, u) + k, lerp(1.7, 1.6, u), lerp(7.4, 7.0, u) + k, -0.45, 0.05, MAT_Z, 50); };

// ---------- stage: 30-day calendar ----------
const CAL = new THREE.Group(); stage.add(CAL);
const tiles = [];
for (let i = 0; i < 30; i++) {
  const c = i % 6, r = Math.floor(i / 6);
  const tile = box(1.25, 0.2, 1.25, mat('#26385e')); tile.position.set(-3.5 + c * 1.4, 0.4, -4.2 + r * 1.4); CAL.add(tile);
  const lab = textSprite('100', { w: 256, h: 128, size: 76, color: '#ffffff', sx: 0.95 }); lab.position.set(tile.position.x, 0.85, tile.position.z); lab.material.depthTest = false; lab.renderOrder = 5; CAL.add(lab);
  tiles.push({ tile, lab });
}
const calTitle = makeLabel('30日カレンダー', { sx: 4.2, size: 60, color: '#cfd6df' }); calTitle.position.set(0, 2.2, -6.0); 
const ON = new THREE.Color('#e05a4f'), OFF = new THREE.Color('#26385e');
function setDays(n) { tiles.forEach((x, i) => { const k = clamp(n - i); x.tile.material.color.copy(OFF).lerp(ON, k); x.tile.position.y = 0.4 + 0.12 * k; x.lab.visible = k > 0.5; }); }
const mini = makePerson({ skin: SKIN[1], hair: HAIR[1], shirt: '#e05a4f', pants: '#2b2f3a', scale: 1 }); stage.add(mini);

// ---------- stage: push-up capacity bars ----------
const BARS = new THREE.Group(); stage.add(BARS);
const barLow = makeBar({ color: '#8a94a3', label: '10回未満', x: -2.4, z: 0, headerY: 7.0 });
const barHigh = makeBar({ color: '#7ff0c8', label: '40回以上', x: 2.4, z: 0, headerY: 7.0 });
[barLow, barHigh].forEach(b => BARS.add(b.g));
const barCap = makeLabel('腕立てできた回数', { sx: 4.2, size: 56, color: '#cfd6df' }); barCap.position.set(0, 8.4, 0); 

// ---------- subtitles ----------
const SUBS = [
  [2.6, 6.0, '運動は、ほとんど<br>していないあなた。'],
  [6.2, 10.1, '1日目。100回を<br>10回×10セットで。'],
  [10.1, 14, '日本で筋トレをしている人は、<br>9〜29%しかいない。'],
  [14.2, 18.1, '2日目。腕も胸も、<br>筋肉痛でパンパン。'],
  [18.1, 22, 'それでも、<br>毎日100回は続ける。'],
  [22.2, 26.1, '脚の筋トレの研究では、<br>20日で筋肉が太りはじめた。'],
  [26.1, 30, 'その太さ、<br>3.5%アップ。'],
  [30.2, 34.6, '30日で、合計<br>3,000回に到達。'],
  [34.6, 39, '同じ研究で、力は<br>35日で約39%アップ。'],
  [39.2, 43.6, '腕立て40回以上の男性は、<br>心臓の病気が96%少なかった。'],
  [43.6, 47.8, '米国の消防士1,104人を、<br>10年追いかけた研究。'],
  [48.1, 53.8, '結果：死亡リスクが<br>10〜17%低い側の人になった。'],
  [53.9, 56.1, 'ただ、週2〜3日でも十分。'],
  [56.2, 59.4, 'あなたは今、腕立て<br>何回できる？'],
];

const counter = (n, op = 1, color = '#fff') => setHud('今日の腕立て', `${Math.min(100, Math.floor(n))} / 100`, op, { mono: true, color });

function shot0(t) { // hook: you drop into a push-up, the counter starts running at frame 0
  lift(90);
  living('evening'); standPose(you); showSweat(false, t);
  pushPose(you, repU(t, 1.6));
  sideCam(t, 2.5);
  el.title.style.opacity = 1;
  counter(t * 1.6);
  return room;
}
function shot1(t) { // everyday: standing, scrolling the phone
  lift(200);
  living('evening'); showSweat(false, t);
  standPose(you, -0.4, 2.3, 0.2); you.userData.arms[1].rotation.x = -1.1; you.userData.arms[0].rotation.x = -0.9; you.userData.head.rotation.x = 0.35;
  const u = ease(t / 3.5);
  look(lerp(0.6, 0.3, u), lerp(1.8, 1.7, u), lerp(7.4, 6.9, u), -0.4, 0.55, 2.3, 52);
  el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5);
  return room;
}
function shot2(t) { // +1日: 10 x 10 — counter climbs to 100
  lift(90);
  living('evening');
  const n = clamp(t / 6.8) * 100;
  const resting = (Math.floor(n) % 10 === 9 && t < 6.8) ? 0 : 1;
  pushPose(you, t < 6.8 ? repU(t, 2.2) * resting + (1 - resting) * 1 : 1);
  showSweat(t > 3, t);
  sideCam(t, 8, 0.15);
  hudTime('+1日');
  counter(n, 1, n >= 100 ? '#7ff0c8' : '#fff');
  setTop('筋トレをしている人（2020年）', '9〜' + countUp(t, 29, 4.2, 1.0) + '%', fade(t, 4.0, 8, 0.25));
  return room;
}
function shot3(t) { // +2日: sore, slower and shaky
  lift(90);
  living('evening');
  pushPose(you, clamp(repU(t, 0.9) + Math.sin(t * 40) * 0.04));
  showSweat(true, t);
  const u = ease(t / 8);
  look(lerp(2.8, 2.3, u), lerp(1.7, 1.6, u), lerp(6.6, 6.2, u), -0.5, 0.1, MAT_Z, 50);
  hudTime('+2日');
  setTop('ここまでの合計', comma(100 + countUp(t, 100, 0.3, 1.4)) + '回', fade(t, 0.15, 8, 0.25));
  return room;
}
function calShot(t, n0, n1, dur) {
  lift(260); setStageColor('#14213a'); CAL.visible = true;
  setDays(lerp(n0, n1, ease(clamp((t - 0.3) / dur))));
  mini.visible = false;
}
function shot4(t) { // +20日: calendar fills to 20
  calShot(t, 2, 20, 4.5);
  const u = ease(t / 8);
  look(lerp(-1.2, 0, u), lerp(14, 13.5, u), lerp(8.5, 8.0, u), 0, 0, -1.4, 50);
  hudTime('+20日');
  setTop('筋トレ20日で、筋肉の太さ（2007年の研究）', '+' + (countUp(t, 35, 4.2, 1.2) / 10).toFixed(1) + '%', fade(t, 4.0, 8, 0.25), '#7ff0c8');
  return stage;
}
function shot5(t) { // +30日: calendar full, 3,000 reps
  calShot(t, 20, 30, 2.5);
  const u = ease(t / 9);
  look(lerp(0, 0.2, u), lerp(15.5, 16.3, u), lerp(9.0, 9.8, u), 0, 0, -1.4, 50);
  hudTime('+30日');
  if (t < 4.6) setTop('30日の合計（単純計算）', comma(countUp(t, 3000, 0.3, 2.4)) + '回', fade(t, 0.15, 4.6, 0.2), '#ffd166');
  else setTop('35日で、脚の力（2007年の研究）', '+' + countUp(t, 39, 4.8, 1.2) + '%', fade(t, 4.65, 9, 0.2), '#7ff0c8');
  return stage;
}
function shot6(t) { // bars: CVD risk, <10 vs >40 push-ups
  lift(250); setStageColor('#14213a'); BARS.visible = true;
  const k = ease(clamp((t - 0.3) / 1.4)), k2 = ease(clamp((t - 1.6) / 1.0));
  barLow.setH(6 * k, '');
  barHigh.setH(Math.max(0.24, 6 * (1 - k2)) * k, k2 > 0.9 ? '−96%' : '');
  const u = ease(t / 8.8);
  look(lerp(-1.0, 0.8, u), lerp(5.5, 5.2, u), lerp(21, 19.5, u), 0, 4.0, 0, 50);
  setTop('心臓の病気（2019年・米国の消防士）', countUp(t, 96, 0.3, 2.4) + '%少ない', fade(t, 0.15, 8.8, 0.25), '#7ff0c8');
  return stage;
}
function shot7(t) { // result: you stand up after the 30th day, stretching
  lift(200);
  living('evening'); showSweat(false, t);
  standPose(you, -0.5, 2.4, 0.2);
  const s = ease(clamp((t - 0.5) / 1.2));
  you.userData.arms[0].rotation.z = -2.6 * s; you.userData.arms[1].rotation.z = 2.6 * s;
  const u = ease(t / 7.5);
  look(lerp(0.4, 0.8, u), lerp(1.7, 1.8, u), lerp(6.4, 7.0, u), -0.5, 0.95, 2.4, 50);
  setTop('筋トレをする人の死亡リスク（2022年の研究）', countUp(t, 10, 0.2, 1.0) + '〜' + countUp(t, 17, 0.2, 1.3) + '%低い', fade(t, 0.15, 7.5, 0.25), '#7ff0c8');
  return room;
}
function shot8(t) { // loop: same framing as the hook, 100/100 done — still going
  lift(90);
  living('evening'); showSweat(true, t);
  pushPose(you, repU(t, 1.6));
  sideCam(t + 0.5, 4.5);
  counter(100, 1, '#7ff0c8');
  return room;
}
function scenesOff(f) { CAL.visible = false; BARS.visible = false; mini.visible = f === shot4 || f === shot5; }

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
shots.forEach(s => { const f = s.f; s.f = (t, T) => { scenesOff(f); return f(t, T); }; });
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0531',
    title: '腕立て100回を30日続けたら？',
    titleHtml: '腕立て100回を<br>30日続けたら？',
    hookType: 'H4', cat: '体・健康',
    mood: 'hopeful', seed: 531, hits: [6.2, 30.2, 48.1], risers: [22.0],
    impacts: [33.0, 41.0, 48.4],
    narr: { '10回×10セット': 'じゅっかいを、じゅっセット', '9〜29%': 'きゅうから、にじゅうきゅうパーセント', '3.5%': 'さんてんごパーセント', '約39%': 'やく、さんじゅうきゅうパーセント', '96%': 'きゅうじゅうろくパーセント', '1,104人': 'せんひゃくよにん', '10〜17%': 'じゅうから、じゅうななパーセント', '週2〜3日': 'しゅう、にから、さんにち' },
    ask: 'あなたは今、腕立て何回できる？',
    caption: 'もしも腕立て伏せを毎日100回、30日続けたら？\n1日目は10回×10セットでやっと100回。日本で筋トレをしている人は9〜29%しかいない。\n脚の筋トレの研究では、20日で筋肉の太さが3.5%アップ、35日で力は約39%アップ。30日続ければ合計3,000回（単純計算）。\n米国の消防士1,104人を10年追った研究では、腕立てが40回以上できた男性は、10回未満の男性より心臓の病気が96%少なかった。\n結果：筋トレをしている人は、死亡リスクが10〜17%低い（16の研究のまとめ）。毎日じゃなくても、厚生労働省のおすすめは週2〜3日。\n\nあなたは今、腕立て何回できる？ コメントで教えて。\n\n出典：厚生労働省「健康づくりのための身体活動・運動ガイド2023」、笹川スポーツ財団（2020年）、Momma et al. British Journal of Sports Medicine（2022年）、Seynnes et al. Journal of Applied Physiology（2007年）、Yang et al. JAMA Network Open（2019年）',
    hashtags: ['もしもラボ', '腕立て伏せ', '筋トレ', '30日チャレンジ', '健康'],
    endStats: [['30日の合計', '3,000回', '単純計算'], ['筋トレをしている人', '9〜29%', '2020年'], ['20日で筋肉の太さ', '+3.5%', '2007年の研究'], ['腕立て40回以上の男性の心臓病', '96%少ない', '2019年'], ['筋トレをする人の死亡リスク', '10〜17%低い', '2022年'], ['おすすめの筋トレ', '週2〜3日', '厚生労働省']],
    sources: '出典：厚生労働省 身体活動・運動ガイド2023、笹川スポーツ財団（2020年）、<br>Momma et al. BJSM（2022年）、Seynnes et al. JAP（2007年）、<br>Yang et al. JAMA Netw Open（2019年）',
  },
});
