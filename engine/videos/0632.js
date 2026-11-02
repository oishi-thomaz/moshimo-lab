import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';

// もしも男だらけの職場が男女半々になったら？（皮肉回・台本 S06）
// 2026/11/02 ゆうと承認。元ネタ：ガルちゃん「男ばかりの職場で女1人は得なのか？」
// 数字：建設業の就業者478万人のうち女性88万人＝約18%（総務省「労働力調査」2025年平均。JILPT 早わかり グラフでみる労働の今で確認）

const WOMEN_RATE = '約18%';
const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a', GRAY = '#cfd3dc';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2f3a'); S.fog = new THREE.Fog(0x2a2f3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3a44, 1.1); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(10, 20, 14); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#3a3a40', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// ---------- 現場の事務所（原点） ----------
const office = makeRoom({ w: 12, d: 8, wall: '#d6d8cc', floor: '#8a8f86' }); office.userData.rw.visible = false; S.add(office);
const desk = box(3.6, 0.8, 1.4, mat('#9aa0aa')); desk.position.set(0, 0.4, -1.8); S.add(desk);
const board = box(4, 1.6, 0.08, mat('#f4f4f0')); board.position.set(-1.8, 2.1, -3.9); S.add(board);
function helmet(p, c = '#f2c14e') { const h = box(0.46, 0.18, 0.44, mat(c)); h.position.y = 0.52; p.userData.head.add(h); }
const MEN = []; { for (let i = 0; i < 7; i++) { const p = makeMan({ shirt: ['#6a7a5a', '#5a6b8a', '#6b5a4a', '#59606e'][i % 4], hair: ['#1d1a19', '#3a2620', '#9a9a9a'][i % 3] }); helmet(p, i % 3 ? '#f2c14e' : '#ffffff'); S.add(p); MEN.push(p); } }
const HIME = makeWoman({ shirt: '#e05a7a', hair: '#3a2620' }); S.add(HIME);
const NEWW = []; { for (let i = 0; i < 6; i++) { const p = makeWoman({ shirt: ['#e9e4da', '#9fc7a8', '#c9a8d8', '#9fc7e8', '#f2c14e', '#ffffff'][i], hair: ['#3a2620', '#1d1a19', '#6b4a33'][i % 3] }); S.add(p); NEWW.push(p); } }
const arrive = makeSparkles(300, 0.3, 0xffffff); S.add(arrive.points); arrive.init([[-2, 1.5, 0.5], [2, 1.5, 0.5], [0, 1.5, 1.5]], 3, 2);
const crown = new THREE.Group(); { const cm = new THREE.MeshBasicMaterial({ color: '#ffe066' }); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20), cm); ring.rotation.x = Math.PI / 2; crown.add(ring); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const c = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), cm); c.position.set(Math.cos(a) * 0.16, 0.08, Math.sin(a) * 0.16); crown.add(c); } const gem = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff4fa0' })); gem.position.set(0, 0.06, 0.17); crown.add(gem); } S.add(crown);
const hime = label('お姫様', { size: 120, color: '#fff', bg: 'rgba(224,90,122,.92)', sx: 1.2 }); S.add(hime);
const himeSeat = label('お姫様の席：0', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,60,70,.92)', sx: 2.4 }); S.add(himeSeat);
const BOX = box(0.6, 0.45, 0.45, mat('#c9a070')); S.add(BOX);
const chair = box(0.6, 0.45, 0.6, mat('#5a5f6b')); chair.position.set(0, 0.22, -1.0); S.add(chair);
const SWEETS = box(0.7, 0.12, 0.45, mat('#f4e4c8')); S.add(SWEETS);
const omiyage = label('お土産', { size: 110, color: '#fff', bg: 'rgba(200,120,40,.92)', sx: 1.0 }); S.add(omiyage);
const empty = label('最後の1個…なし', { w: 1024, size: 96, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 2.2 }); S.add(empty);
const whisper = label('あの人、甘やかされてない？', { w: 1024, size: 86, color: '#fff', bg: 'rgba(120,60,160,.92)', sx: 2.8 }); S.add(whisper);
const shinjin = label('新人', { size: 130, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 0.9 }); S.add(shinjin);
const raku = label('気をつかわなくていい', { w: 1024, size: 96, color: '#fff', bg: 'rgba(30,110,170,.92)', sx: 2.6 }); S.add(raku);

// ---------- 居酒屋（x=60） ----------
const IX = 60;
const izk = makeRoom({ w: 10, d: 7, wall: '#c8a878', floor: '#6a4a30' }); izk.position.set(IX, 0, 0); izk.userData.rw.visible = false; S.add(izk);
const itable = box(3.8, 0.75, 1.5, mat('#5a3a24')); itable.position.set(IX, 0.37, 0); S.add(itable);
const bill = label('お会計', { size: 120, color: '#fff', bg: 'rgba(40,40,50,.92)', sx: 1.2 }); S.add(bill);
const zero = label('0円', { size: 150, color: '#fff', bg: 'rgba(224,90,122,.95)', sx: 0.9 }); S.add(zero);
const warikan = label('割り勘', { size: 130, color: '#fff', bg: 'rgba(60,60,70,.95)', sx: 1.1 }); S.add(warikan);
const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 14), new THREE.MeshBasicMaterial({ color: '#ff6a4a' })); lantern.position.set(IX - 3.4, 2.6, -3.3); S.add(lantern);

function place(list, pts, ry = 0) { list.forEach((p, i) => { const q = pts[i]; if (!q) { p.position.set(0, -50, 0); return; } p.position.set(q[0], 0, q[1]); p.rotation.set(0, q[2] ?? ry, 0); }); }
function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; }
function reset() {
  [...MEN, HIME, ...NEWW].forEach(poseReset);
  place(MEN, [[-2.6, 0.2, 0.5], [-1.6, 1.0, 0.3], [-0.6, 1.4, 0], [1.6, 1.0, -0.3], [2.6, 0.2, -0.5], [1.8, -0.6, -0.6], [-1.8, -0.6, 0.6]]); place(NEWW, []);
  HIME.position.set(0, 0, 0.2); HIME.rotation.set(0, 0, 0); crown.scale.setScalar(1);
  arrive.set(0); crown.visible = false; hime.visible = false; himeSeat.visible = false; BOX.visible = false; SWEETS.visible = false; omiyage.visible = false; empty.visible = false; whisper.visible = false; shinjin.visible = false; raku.visible = false;
  bill.visible = false; zero.visible = false; warikan.visible = false; chair.visible = false;
  hemi.intensity = 1.1; S.background.set('#2a2f3a'); el.flash.style.opacity = 0; setHud('', '', 0);
}
function crownOn(p) { crown.visible = true; p.updateMatrixWorld(true); const v = new THREE.Vector3(0, 0.6, 0); p.userData.head.localToWorld(v); crown.position.copy(v); }
const MIX = [[-2.6, 0.2, 0.5], [-1.6, 1.0, 0.3], [-0.6, 1.4, 0], [1.6, 1.0, -0.3], [2.6, 0.2, -0.5]];
const WMIX = [[-2.1, 1.9, 0.3], [-1.1, 2.2, 0.1], [0.9, 2.2, -0.1], [2.1, 1.9, -0.3], [-3.0, 1.2, 0.5], [3.0, 1.2, -0.5]];
const TP = 0.5;
function offCam(t, d = 0) { look(lerp(0.5, 0.3, d), lerp(2.5, 2.7, d), lerp(4.6, 5.4, d), 0, 1.7, 0, 54); }
function shot0(t) { // 0秒＝サムネ：男の中に女1人。0.5秒で女性社員が一気に増える
  reset(); lift(80); crownOn(HIME); const k = t - TP;
  if (k > 0) { place(NEWW, WMIX, Math.PI); NEWW.forEach((p, i) => { const s = easeBack(clamp((k - i * 0.05) / 0.35)); p.scale.setScalar(Math.max(0.001, s * 0.96)); }); arrive.set(clamp(k / 1.2)); } else NEWW.forEach(p => p.scale.setScalar(0.96));
  HIME.userData.head.rotation.y = k > 0.3 ? Math.sin(t * 6) * 0.4 : 0;
  el.flash.style.opacity = k > 0 ? 0.35 * Math.max(0, 1 - k / 0.25) : 0;
  offCam(t, ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // 日本中の職場が、男女半々になった
  reset(); lift(80); place(MEN, MIX); place(NEWW, WMIX.slice(0, 5)); crownOn(HIME);
  look(0, 5.4, 9, 0, 1.2, 0.4, 50);
  setTop('職場の男女比', '5：5', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function shot2(t) { // 男女平等の第一歩。みんなが喜ぶ
  reset(); lift(80); place(MEN, MIX); place(NEWW, WMIX.slice(0, 5)); crownOn(HIME);
  [...MEN.slice(0, 5), ...NEWW.slice(0, 5)].forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = -2.6 + Math.sin(t * 6 + i) * 0.2); p.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.1; });
  look(0, 3.0, 7.4, 0, 1.4, 0.6, 52);
  return S;
}
function shot3(t) { // ただ1人、顔が曇る人がいる。男だらけの職場の紅一点
  reset(); lift(120); crownOn(HIME); HIME.userData.head.rotation.x = 0.3; hime.position.set(0, 2.55, 0.4); pop(hime, t, 0.6, 0.3, 0.8);
  look(0.4, 2.0, 3.4, 0, 1.7, 0.2, 48);
  setTop('建設業で働く人のうち女性（2025年）', WOMEN_RATE, fade(t, 0.15, 3.3, 0.25), PINK);
  return S;
}
function izakaya(n) { place(MEN, [[IX - 1.4, -1.2, 0], [IX, -1.2, 0], [IX + 1.4, -1.2, 0], [IX - 1.4, 1.2, Math.PI], [IX + 1.4, 1.2, Math.PI]]); HIME.position.set(IX, 0, 1.2); HIME.rotation.set(0, Math.PI, 0); if (n) place(NEWW, [[IX - 2.6, 1.2, Math.PI], [IX + 2.6, 1.2, Math.PI], [IX - 2.6, -1.2, 0], [IX + 2.6, -1.2, 0]]); hemi.intensity = 1.0; S.background.set('#c8a878'); }
function shot4(t) { // 飲み会の会計は、払ったことがない
  reset(); lift(110); izakaya(0); crownOn(HIME);
  bill.position.set(IX, 2.6, -0.4); pop(bill, t, 0.3, 0.3, 1.1); if (t >= 1.4) bill.visible = false; zero.position.set(IX, 2.6, -0.4); pop(zero, t, 1.4, 0.3, 0.9);
  look(IX + 0.4, 3.0, 5.6, IX, 1.3, 0.2, 52);
  return S;
}
function shot5(t) { // 重い荷物は誰かが持つ。お土産は最初に回ってくる
  reset(); lift(110); crownOn(HIME); const m = MEN[2]; m.position.set(0.8, 0, 0.6); m.rotation.y = -0.4; m.userData.arms.forEach(a => a.rotation.x = -1.3); m.updateMatrixWorld(true); const v = new THREE.Vector3(0, 1.05, 0.45); m.localToWorld(v); BOX.visible = t < 1.8; BOX.position.copy(v);
  if (t >= 1.8) { SWEETS.visible = true; SWEETS.position.set(lerp(1.5, 0.1, ease(clamp((t - 1.8) / 0.8))), 1.25, 0.6); omiyage.position.set(0.3, 2.3, 0.6); pop(omiyage, t, 2.0, 0.3, 0.9); HIME.userData.arms[1].rotation.x = -1.0; }
  look(0.6, 2.2, 4.2, 0.3, 1.4, 0.3, 50);
  return S;
}
function shot6(t) { // 女性が10人になった職場に、お姫様の席は1つもない
  reset(); lift(80); place(MEN, MIX); place(NEWW, WMIX.slice(0, 5)); crown.visible = t < 1.2; if (t < 1.2) crownOn(HIME); else { crown.visible = true; crown.position.set(0.2, lerp(2.0, 0.1, ease(clamp((t - 1.2) / 0.5))), 0.6); crown.rotation.z = (t - 1.2) * 1.5; }
  himeSeat.position.set(0, 3.1, 0.4); pop(himeSeat, t, 1.6, 0.3, 2.2);
  look(0, 3.4, 6.8, 0, 1.6, 0.4, 52);
  return S;
}
function shot7(t) { // 飲み会は割り勘。荷物は自分で持つ
  reset(); lift(110); izakaya(1);
  warikan.position.set(IX, 2.6, 0.3); pop(warikan, t, 0.4, 0.3, 1.1); zero.visible = false;
  look(IX + 0.4, 3.2, 6.4, IX, 1.3, 0.2, 52);
  setTop('紅一点の会計', '割り勘', fade(t, 0.15, 3.4, 0.25), RED);
  return S;
}
function shot8(t) { // 新しく来た女性たちから、あの人甘やかされてない？
  reset(); lift(110); place(MEN, []); place(NEWW, [[1.4, -0.4, -0.9], [2.0, 0.0, -1.3], [2.4, -0.8, -1.1]]); NEWW[0].userData.head.rotation.y = 0.6; NEWW[1].userData.head.rotation.y = -0.5;
  HIME.position.set(-1.1, 0, 0.4); HIME.rotation.y = 0.5;
  whisper.position.set(0.4, 2.6, -0.4); pop(whisper, t, 0.5, 0.3, 2.1);
  look(0.3, 2.5, 7.4, 0.3, 1.5, -0.2, 52);
  return S;
}
function shot9(t) { // 男の職場で最強だった人が、女の職場では新人扱い
  reset(); lift(110); place(MEN, []); place(NEWW, [[-1.8, -1.0, 0.3], [-0.6, -1.0, 0.1], [0.6, -1.0, -0.1], [1.8, -1.0, -0.3]]); HIME.position.set(0, 0, 1.6); HIME.rotation.y = Math.PI; HIME.userData.head.rotation.x = 0.3;
  shinjin.position.set(0, 2.5, 1.6); pop(shinjin, t, 0.6, 0.3, 0.8);
  look(0, 3.0, 5.6, 0, 1.4, 0, 52);
  return S;
}
function shot10(t) { // お土産のお菓子は、最後の1個も回ってこない
  reset(); lift(110); place(MEN, []); place(NEWW, [[-2.0, -0.6, 0.6], [-1.0, -1.1, 0.3], [0.2, -1.2, 0], [1.2, -0.9, -0.3]], 0); HIME.position.set(2.2, 0, 0.2); HIME.rotation.y = -0.8;
  SWEETS.visible = true; const u = clamp(t / 2.6); SWEETS.position.set(lerp(-2.0, 1.4, u), 1.25 + Math.sin(u * 12) * 0.03, lerp(-0.2, 0.2, u)); SWEETS.scale.x = Math.max(0.05, 1 - u);
  empty.position.set(0.5, 2.6, 0.3); pop(empty, t, 2.6, 0.3, 1.7);
  look(0.2, 2.6, 4.8, 0.2, 1.3, -0.2, 52);
  return S;
}
function shot11(t) { // 男たちは、気をつかわなくてよくなって、むしろ楽
  reset(); lift(110); place(MEN, [[-1.6, 0, 0.4], [-0.5, 0.3, 0.1], [0.6, 0.2, -0.2], [1.6, 0, -0.5]]); MEN.slice(0, 4).forEach((p, i) => { p.userData.head.rotation.x = -0.25; p.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 7 + i) * 0.4; p.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.06; }); HIME.position.set(0, -50, 0);
  raku.position.set(0, 2.6, 0.3); pop(raku, t, 0.5, 0.3, 1.8);
  look(0, 2.4, 4.8, 0, 1.4, 0, 52);
  return S;
}
function shot12(t) { // 結果：男女平等で一番損をしたのは紅一点
  reset(); lift(110); place(MEN, []); place(NEWW, []); HIME.position.set(0, 0.45, -0.9); HIME.rotation.y = 0; HIME.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); HIME.userData.head.rotation.x = 0.45; hemi.intensity = 0.7; S.background.set('#1a1e28');
  chair.visible = true;
  crown.visible = true; crown.position.set(0.5, 0.82, -1.6); crown.rotation.z = 1.4;
  const u = ease(clamp(t / 6)); look(lerp(1.8, 1.0, u), lerp(2.4, 2.0, u), lerp(3.6, 2.8, u), 0, 1.2, -1.0, 50);
  setTop('結果', '一番損したのは紅一点', fade(t, 0.15, 5.8, 0.25), RED);
  return S;
}
function shot13(t) { // 平等を嫌うのは、得をしている人なのかも
  reset(); lift(80); place(MEN, MIX); place(NEWW, WMIX.slice(0, 5)); HIME.position.set(0, 0, 0.2);
  [...MEN.slice(0, 5), ...NEWW.slice(0, 5)].forEach(p => { p.userData.head.rotation.y = Math.atan2(-p.position.x, 0.2 - p.position.z) - p.rotation.y; });
  crown.visible = true; crown.position.set(0.6, 0.1, 0.8); crown.rotation.z = 1.4;
  const u = ease(clamp(t / 6)); look(0, lerp(6.5, 7.5, u), lerp(7, 8, u), 0, 1.0, 0.2, 50);
  setTop('平等を嫌うのは', '得をしている人', fade(t, 0.3, 5.8, 0.25), BLUE);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（女性が増えた事務所。王冠は落ちたまま）
  reset(); lift(80); place(NEWW, WMIX, Math.PI); NEWW.forEach(p => p.scale.setScalar(0.96)); crown.visible = true; crown.position.set(-0.45, 0.08, 0.75); crown.scale.setScalar(1.3); crown.rotation.z = 1.4; HIME.userData.head.rotation.x = 0.3;
  offCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.5, '日本中の職場が、<br>男女半々になった。'],
  [6.6, 9.9, '男女平等の第一歩。<br>みんなが喜ぶ。'],
  [10.0, 13.4, 'ただ1人、顔が曇る人がいる。<br>男だらけの職場の紅一点。'],
  [13.5, 17.0, '飲み会の会計は、<br>払ったことがない。'],
  [17.1, 20.6, '重い荷物は誰かが持つ。<br>お土産は最初に回ってくる。'],
  [20.7, 24.2, '女性が10人になった職場に、<br>お姫様の席は1つもない。'],
  [24.3, 27.8, '飲み会は割り勘。<br>荷物は自分で持つ。'],
  [27.9, 31.6, '新しく来た女性たちから、<br>あの人、甘やかされてない？'],
  [31.7, 35.3, '男の職場で最強だった人が、<br>女の職場では新人扱い。'],
  [35.4, 39.0, 'お土産のお菓子は、<br>最後の1個も回ってこない。'],
  [39.1, 42.8, '男たちは気をつかわなくて<br>よくなって、むしろ楽。'],
  [42.9, 48.8, '結果：男女平等で<br>一番損をしたのは紅一点。'],
  [48.9, 55.0, '平等を嫌うのは、<br>得をしている人なのかも。'],
  [55.1, 61.3, '紅一点、<br>得？損？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.5, f: shot3 },
  { a: 13.5, b: 17.1, f: shot4 }, { a: 17.1, b: 20.7, f: shot5 }, { a: 20.7, b: 24.3, f: shot6 }, { a: 24.3, b: 27.9, f: shot7 },
  { a: 27.9, b: 31.7, f: shot8 }, { a: 31.7, b: 35.4, f: shot9 }, { a: 35.4, b: 39.1, f: shot10 }, { a: 39.1, b: 42.9, f: shot11 },
  { a: 42.9, b: 48.9, f: shot12 }, { a: 48.9, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0632',
    v2: true,
    hookLine: '職場が、男女半々になった。',
    series: '図星',  // 2026/11/03 ゆうと決定：皮肉回の柱は 図星シリーズ
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも職場が男女半々だったら？',
    titleHtml: 'もしも職場が<br>男女半々だったら？',
    mood: 'mystery', seed: 632, hits: [0.5, 42.9, 48.9], risers: [39.1], impacts: [10.0, 13.5, 20.7, 24.3, 27.9, 35.4, 42.9, 48.9],
    sfx: [[0.5, 'poof'], [14.8, 'bubble'], [21.9, 'buzz'], [25.0, 'buzz'], [28.4, 'buzz'], [38.0, 'buzz'], [49.2, 'whoosh']],
    narr: { '紅一点': 'こういってん', '結果：': '結果、' },
    ask: '紅一点、得？損？',
    caption: 'もしも男だらけの職場が、全部男女半々になったら？\n\n男女平等の第一歩。みんなが喜ぶ。ただ1人、顔が曇る人がいる。男だらけの職場の紅一点。\n飲み会の会計は払ったことがない。重い荷物は誰かが持つ。お土産は最初に回ってくる。\n女性が10人になった職場に、お姫様の席は1つもない。飲み会は割り勘。新しく来た女性たちからは、あの人甘やかされてない？\n\n結果：男女平等で一番損をしたのは紅一点。\n平等を嫌うのは、得をしている人なのかもしれない。\n\n紅一点、得？損？ コメントで教えて。\n\n※風刺ネタです\n出典：総務省「労働力調査」2025年平均（建設業で働く人のうち女性 約18%）',
    hashtags: ['もしもラボ', 'もしも', '紅一点', '男女平等', '職場あるある'],
    endStats: [['建設業で働く人のうち女性', WOMEN_RATE, '2025年 労働力調査'], ['紅一点の会計', '0円 → 割り勘', '男女半々の職場'], ['平等を嫌うのは', '得をしている人', 'かもしれない']],
    sources: '出典：総務省「労働力調査」2025年平均',
  },
});
