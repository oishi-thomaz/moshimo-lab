import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #009 KPOPガールズ！デーモン・ハンターズ（映画・アメリカ・2025年・100分のアニメ。Netflixで見放題、justwatch.com/jp/映画/kpopgaruzu-demonhantazu で2026/11/1確認。Filmarks 3.8）
// 設定：スタジアムを満員にする3人組のスーパースターは、裏では正体を隠してファンを守るデーモンハンター。デーモンは人間の魂をねらう。
//       人気を集めるライバルのボーイズグループは、実はデーモンの手先。スタジアムでパフォーマンスをしながら戦う場面もある
//       （Filmarks 作品ページ・JustWatch の作品紹介・シネマトゥデイの紹介記事）
// 作品の映像・キャラクターの見た目・衣装・ロゴ・曲・歌詞・有名な場面の構図は使わない。実在のアイドルに似せない。デーモンはこわすぎない記号的な形にする

const S = quizStage({ bg: '#140f24', floor: '#1e1a2e', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(909);

const IDOL = [
  { skin: '#f5d3b5', hair: '#2a2440', shirt: '#e8e2f0', pants: '#2a2440', long: true },
  { skin: '#f1c9a5', hair: '#b04a6a', shirt: '#2a2a3a', pants: '#2a2a3a', long: true },
  { skin: '#f5d3b5', hair: '#1d1a19', shirt: '#e6b450', pants: '#3a3040', long: true, skirt: true },
];
const HUNT = (i) => ({ ...IDOL[i], shirt: ['#3a3a5a', '#2a2a3a', '#4a3a2a'][i], pants: '#1a1a24' });
const BOYS = (i) => ({ skin: ['#f5d3b5', '#f1c9a5', '#efcfae', '#f5d3b5', '#f1c9a5'][i], hair: ['#1a1a1a', '#5a4a6a', '#1a1a1a', '#8a6a4a', '#2a2a3a'][i], shirt: '#1a1a20', pants: '#1a1a20', tie: false });
const FAN = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f', '#f5d3b5', '#d9a57c'][i % 5], hair: ['#1d1a19', '#2c2421', '#4a3426', '#6b4a33'][i % 4], shirt: ['#e05a4f', '#4fa3d1', '#f2c14e', '#8e6bbf', '#e9e4da', '#3f8f6b'][i % 6], pants: ['#2b3346', '#3b3f4a'][i % 2], long: i % 3 === 0, skirt: i % 6 === 3 });
function glowSword(p, color = '#7ad8ff') { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.03), new THREE.MeshBasicMaterial({ color })); b.position.set(0, -1.15, 0.05); p.userData.arms[1].add(b); const hilt = box(0.18, 0.05, 0.06, mat('#3a3a3a')); hilt.position.set(0, -0.62, 0.05); p.userData.arms[1].add(hilt); return b; }
function stick(p, color) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 8), new THREE.MeshBasicMaterial({ color })); s.position.set(0, -0.74, 0.08); p.userData.arms[1].add(s); p.userData.arms[1].rotation.x = -2.8; }
// デーモン（紫のかたまりに角と光る目。記号的な形）
function demon(s = 1) { const g = new THREE.Group(); const body = box(0.9 * s, 1.0 * s, 0.7 * s, new THREE.MeshLambertMaterial({ color: '#5a2a7a', emissive: '#1a0a2a' })); body.position.y = 0.7 * s; g.add(body);
  for (const x of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.1 * s, 0.38 * s, 6), mat('#e8e0f0')); h.position.set(x * 0.3 * s, 1.36 * s, 0); h.rotation.z = -x * 0.3; g.add(h); const e = box(0.16 * s, 0.1 * s, 0.02 * s, new THREE.MeshBasicMaterial({ color: '#ffe24a' })); e.position.set(x * 0.2 * s, 0.9 * s, 0.36 * s); g.add(e); }
  return g; }
// 天井のスポット（光の円すい）
function beam(color) { const m = new THREE.Mesh(new THREE.ConeGeometry(1.4, 7, 20, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); return m; }

// ---------- 1. スタジアム（x=0） ----------
const STAGE = new THREE.Group(); STAGE.position.set(0, 0, -2); qs.add(STAGE);
const BEAMS = [], LIGHTS = [];
{ const st = box(10, 1.0, 4, mat('#2a2a3a')); st.position.y = 0.5; STAGE.add(st);
  const edge = box(10, 0.08, 0.1, new THREE.MeshBasicMaterial({ color: '#ff5ac8' })); edge.position.set(0, 1.02, 2.0); STAGE.add(edge);
  const scrT = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff4ab0'); gr.addColorStop(0.5, '#7a4aff'); gr.addColorStop(1, '#3ad0ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w * (0.3 + i * 0.2), h * 0.55, 70, 0, Math.PI * 2); g.fill(); } });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: scrT })); scr.position.set(0, 4.0, -1.9); STAGE.add(scr);
  [['#ff4ab0', -3.2], ['#3ad0ff', 0], ['#ffd84a', 3.2]].forEach(([c, x]) => { const b = beam(c); b.position.set(x, 4.5, 0.4); STAGE.add(b); BEAMS.push(b); }); }
const GIRLS1 = IDOL.map((o, i) => { const p = makePerson(o); p.position.set(-1.3 + i * 1.3, 1.0, -1.2); qs.add(p); return p; });
const FRONT = new THREE.PointLight(0xfff0f0, 0, 10, 1.2); FRONT.position.set(0, 3.2, 1.6); qs.add(FRONT);
const GBLADE = GIRLS1.map((p, i) => glowSword(p, ['#7ad8ff', '#ff7ad8', '#ffe27a'][i]));
const MICS = GIRLS1.map(p => { const m = box(0.05, 0.05, 0.2, mat('#2a2a2a')); m.position.set(0.1, 0.25, 0.25); p.userData.head.add(m); return m; });
const FANS = []; for (let i = 0; i < 30; i++) { const p = makePerson(FAN(i)); p.scale.setScalar(0.9); p.position.set(-6 + (i % 10) * 1.3 + R() * 0.3, 0, 1.8 + Math.floor(i / 10) * 1.1); p.rotation.y = Math.PI; stick(p, ['#ff4ab0', '#3ad0ff', '#ffd84a'][i % 3]); qs.add(p); FANS.push(p); }
const tStar = tag('3人組のスーパースター', { size: 66, w: 640, bg: '#e6b450', color: '#14161c' }); tStar.position.set(0, 3.15, -1.2); qs.add(tStar);

// ---------- 2. 夜の路地で戦う（x=24） ----------
const ALLEY = new THREE.Group(); ALLEY.position.set(24, 0, 0); qs.add(ALLEY);
{ for (const s of [-1, 1]) { const w = box(0.4, 6, 12, mat('#2a2a3a')); w.position.set(s * 4.2, 3, -2); ALLEY.add(w); for (let k = 0; k < 6; k++) { const n = box(0.04, 0.5, 0.9, new THREE.MeshBasicMaterial({ color: ['#ff4ab0', '#3ad0ff', '#ffd84a'][(k + (s > 0 ? 1 : 0)) % 3] })); n.position.set(s * 3.98, 2.2 + (k % 2) * 1.4, -6 + k * 1.6); ALLEY.add(n); } }
  const glow = new THREE.PointLight(0x9a6aff, 0, 9, 1.4); glow.position.set(0, 2.6, -1.0); ALLEY.add(glow); ALLEY.userData.glow = glow; }
const HUNTERS = [0, 1, 2].map(i => { const p = makePerson(HUNT(i)); p.position.set(22.8 + i * 1.2, 0, 1.0); p.rotation.y = Math.PI; qs.add(p); p.userData.blade = glowSword(p, ['#7ad8ff', '#ff7ad8', '#ffe27a'][i]); return p; });
const DEM2 = [[22.6, -2.4], [24.2, -3.0], [25.6, -2.2]].map(([x, z]) => { const d = demon(1); d.position.set(x, 0, z); qs.add(d); return d; });
const tBack = tag('裏の顔', { size: 84, bg: '#e2483c' }); tBack.position.set(24.0, 2.6, 1.0); qs.add(tBack);

// ---------- 3. ねらわれる魂、守るのはファン（x=48） ----------
const PLAZA = new THREE.Group(); PLAZA.position.set(48, 0, 0); qs.add(PLAZA);
const SOULS = [];
{ for (let i = 0; i < 6; i++) { const h = 4 + R() * 4; const b = box(2.2, h, 2.2, mat('#262a3a')); b.position.set(-6 + i * 2.4, h / 2, -6); PLAZA.add(b); } }
const PEOPLE3 = []; for (let i = 0; i < 6; i++) { const p = makePerson(FAN(i + 3)); p.position.set(45.8 + (i % 3) * 1.1, 0, 0.2 + Math.floor(i / 3) * 1.0); p.rotation.y = 0.2; qs.add(p); PEOPLE3.push(p); const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.9 })); qs.add(s); SOULS.push(s); }
const dem3 = demon(1.5); dem3.position.set(50.4, 0, -1.4); dem3.rotation.y = -0.6; qs.add(dem3);
const tSoul = tag('人間の魂', { size: 80, bg: '#e2483c' }); tSoul.position.set(47.8, 3.0, 0.6); qs.add(tSoul);

// ---------- 4〜5. ライバルのボーイズグループ（x=72） ----------
const STAGE2 = new THREE.Group(); STAGE2.position.set(72, 0, -2); qs.add(STAGE2);
const BEAMS2 = [];
{ const st = box(10, 1.0, 4, mat('#1a1a24')); st.position.y = 0.5; STAGE2.add(st);
  const edge = box(10, 0.08, 0.1, new THREE.MeshBasicMaterial({ color: '#c8102e' })); edge.position.set(0, 1.02, 2.0); STAGE2.add(edge);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ color: '#3a0a14' })); scr.position.set(0, 4.0, -1.9); STAGE2.add(scr);
  [-3, 0, 3].forEach(x => { const b = beam('#ff3a4a'); b.position.set(x, 4.5, 0.4); STAGE2.add(b); BEAMS2.push(b); }); }
const BOY5 = [0, 1, 2, 3, 4].map(i => { const p = makePerson(BOYS(i)); p.position.set(69.6 + i * 1.2, 1.0, -1.2); qs.add(p); return p; });
// 足元に伸びる影（角つき）＝正体
const SHADOWS = BOY5.map(p => { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.2), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.75, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.01, 1.1); g.add(sh); for (const x of [-1, 1]) { const h = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.42), sh.material); h.rotation.x = -Math.PI / 2; h.rotation.z = x * 0.35; h.position.set(x * 0.24, 0.012, 2.3); g.add(h); } g.position.set(p.position.x, 1.01, p.position.z); qs.add(g); return g; });
const EYES = BOY5.map(p => { const e = []; for (const s of [-1, 1]) { const m = box(0.06, 0.09, 0.02, new THREE.MeshBasicMaterial({ color: '#ffe24a' })); m.position.set(s * 0.085, 0.27, 0.205); m.visible = false; p.userData.head.add(m); e.push(m); } return e; });
const FANS4 = []; for (let i = 0; i < 24; i++) { const p = makePerson(FAN(i + 7)); p.scale.setScalar(0.9); p.position.set(66.5 + (i % 8) * 1.5 + R() * 0.3, 0, 1.8 + Math.floor(i / 8) * 1.1); p.rotation.y = Math.PI; stick(p, '#ff3a4a'); qs.add(p); FANS4.push(p); }
const tRival = tag('ライバル登場', { size: 78, bg: '#e6b450', color: '#14161c' }); tRival.position.set(72, 3.35, -1.2); qs.add(tRival);
const tTrue = tag('正体は悪魔の手先', { size: 70, w: 600, bg: '#e2483c' }); tTrue.position.set(72, 3.15, -1.2); qs.add(tTrue);

// ---------- 6〜7. ステージの上で、戦いは続く（x=0 のステージを夜の色で） ----------

// ---------- shots ----------
const ALLTAG = [tStar, tBack, tSoul, tRival, tTrue];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); ALLEY.userData.glow.intensity = 0; EYES.flat().forEach(e => e.visible = false); SOULS.forEach(s => s.visible = false); HUNTERS.forEach(h => h.userData.blade.visible = true); FRONT.intensity = 0; GBLADE.forEach(b => b.visible = false); }
function dance(ps, T, amp = 1) { ps.forEach((p, i) => { const ph = T * 4 + i * 0.7; p.userData.arms[0].rotation.x = -1.4 + Math.sin(ph) * 0.9 * amp; p.userData.arms[0].rotation.z = -0.3; p.userData.arms[1].rotation.x = -1.4 - Math.sin(ph) * 0.9 * amp; p.position.y = 1.0 + Math.abs(Math.sin(ph)) * 0.08 * amp; p.rotation.y = Math.sin(T * 1.3 + i) * 0.3; }); }
function crowd(fs, T) { fs.forEach((p, i) => { p.userData.arms[1].rotation.x = -2.8 + Math.sin(T * 5 + i) * 0.25; p.position.y = Math.abs(Math.sin(T * 5 + i * 0.6)) * 0.05; }); }
function concertLight(T) { S.hemi.intensity = 0.45; S.key.intensity = 0.3; FRONT.intensity = 7; BEAMS.forEach((b, i) => { b.rotation.z = Math.sin(T * 0.9 + i * 2) * 0.35; }); }

function shotStadium(t, T) { // 0〜9：満員のスタジアム（0秒目がサムネ）
  base(); S.aim(0, -1); lift(150); concertLight(T);
  dance(GIRLS1, T); crowd(FANS, T);
  tStar.userData.pop((T - 5.8) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.6, 0.0, u), lerp(3.6, 3.4, u), lerp(11.0, 8.6, u), 0, lerp(2.4, 2.3, u), -1.6, 54);
  return qs;
}
function shotAlley(t) { // 9〜17：でもその裏で、正体を隠して戦う
  base(); S.aim(24, 0); lift(200);
  S.hemi.intensity = 0.5; S.key.intensity = 0.3; S.darken(0.5, '#0a0814');
  ALLEY.userData.glow.intensity = 9;
  HUNTERS.forEach((p, i) => { const k = ease((t - 1.0 - i * 0.2) / 0.6); p.userData.arms[1].rotation.x = lerp(-0.3, -2.4, k) + (t > 4.5 ? Math.sin(t * 6 + i) * 0.5 : 0); p.userData.arms[1].rotation.z = 0.2; p.userData.legs[0].rotation.x = -0.4; p.userData.legs[1].rotation.x = 0.3; });
  DEM2.forEach((d, i) => { d.position.z = -2.6 + i * 0.1 + Math.sin(t * 2 + i) * 0.1; d.rotation.y = Math.sin(t * 3 + i) * 0.2; d.position.y = Math.abs(Math.sin(t * 3 + i)) * 0.12; });
  tBack.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(24.6, 24.2, u), lerp(3.6, 3.3, u), lerp(-7.4, -6.6, u), 24.1, 1.2, 0.6, 56);
  return qs;
}
function shotSoul(t) { // 17〜25：ねらわれているのは人間の魂。守るのはファン
  base(); S.aim(48, 0); lift(200);
  S.hemi.intensity = 0.4; S.key.intensity = 0.25; S.darken(0.6, '#0a0814');
  PEOPLE3.forEach((p, i) => { const s = SOULS[i]; const k = ease((t - 1.2 - i * 0.15) / 2.0); s.visible = t > 1.0; s.position.set(lerp(p.position.x, 50.0, k * 0.55), 2.1 + k * 0.9 + Math.sin(t * 3 + i) * 0.05, lerp(p.position.z, -1.0, k * 0.55)); p.userData.head.rotation.x = -0.3; });
  dem3.rotation.y = -0.6 + Math.sin(t * 1.5) * 0.15; dem3.scale.setScalar(1 + Math.sin(t * 3) * 0.03);
  tSoul.userData.pop((t - 1.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(47.6, 48.2, u), lerp(2.6, 2.4, u), lerp(8.0, 7.2, u), 48.2, 1.6, -0.6, 54);
  return qs;
}
function shotRival(t) { // 25〜33：大人気のライバルグループ
  base(); S.aim(72, -1); lift(150);
  S.hemi.intensity = 0.4; S.key.intensity = 0.3; BEAMS2.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.35; });
  dance(BOY5, t + 25, 0.8); crowd(FANS4, t + 25);
  SHADOWS.forEach((g, i) => { g.position.x = BOY5[i].position.x; g.visible = false; });
  tRival.userData.pop((t - 1.0) / 0.35);
  const u = ease(t / 8);
  look(lerp(72.6, 72.0, u), lerp(3.8, 3.6, u), lerp(10.6, 9.0, u), 72, 2.3, -1.6, 54);
  return qs;
}
function shotTrue(t) { // 33〜42：その正体は、悪魔の手先
  base(); S.aim(72, -1); lift(150);
  const d = ease((t - 2.5) / 1.0);
  S.hemi.intensity = lerp(0.4, 0.12, d); S.key.intensity = lerp(0.3, 0, d); S.darken(d * 0.8, '#1a0208');
  BEAMS2.forEach((b, i) => { b.rotation.z = Math.sin((t + 8) * 0.9 + i * 2) * 0.35; });
  dance(BOY5, t + 33, lerp(0.8, 0.0, d)); crowd(FANS4, t + 33);
  SHADOWS.forEach((g, i) => { g.position.x = BOY5[i].position.x; g.visible = d > 0.1; g.children.forEach(c => c.material.opacity = 0.75 * d); });
  EYES.flat().forEach(e => e.visible = t > 3.2);
  tTrue.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(72, lerp(4.0, 4.4, u), lerp(8.4, 7.6, u), 72, 1.8, -0.8, 54);
  return qs;
}
const DARK = '#06040c';
function shotFinal(t) { // 42〜49：ステージの上でも、戦いは続く
  base(); S.aim(0, -1); lift(150);
  const dd = ease(t / 1.2);
  S.hemi.intensity = lerp(0.45, 0.15, dd); S.key.intensity = lerp(0.3, 0, dd); S.darken(dd, DARK);
  BEAMS.forEach((b, i) => { b.rotation.z = Math.sin(t * 2.0 + i * 2) * 0.5; });
  dance(GIRLS1, t + 42, 1.2); crowd(FANS, t + 42); FRONT.intensity = 7; GBLADE.forEach(b => b.visible = t > 2.4);
  const k = ease(t / 6.5);
  look(lerp(0.4, 0, k), lerp(3.4, 3.0, k), lerp(7.0, 5.2, k), 0, 2.2, -1.2, lerp(54, 50, k));
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画わかった？
  base(); S.aim(0, -1); lift(150);
  S.hemi.intensity = 0.15; S.key.intensity = 0; S.darken(1, DARK);
  BEAMS.forEach((b, i) => { b.rotation.z = Math.sin((t + 7) * 2.0 + i * 2) * 0.5; });
  dance(GIRLS1, t + 49, 1.0); crowd(FANS, t + 49); FRONT.intensity = 7; GBLADE.forEach(b => b.visible = true);
  const k = ease(t / 7);
  look(0, lerp(3.0, 4.2, k), lerp(5.2, 10.0, k), 0, lerp(2.2, 2.4, k), -1.2, lerp(50, 54, k));
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotStadium(t, T) },
  { a: 9, b: 17, f: shotAlley },
  { a: 17, b: 25, f: shotSoul },
  { a: 25, b: 33, f: shotRival },
  { a: 33, b: 42, f: shotTrue },
  { a: 42, b: 49, f: shotFinal },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'スタジアムを<br>満員にする、'],
  [5.6, 9.0, '3人組の<br>スーパースター。'],
  [9.2, 13.2, 'でも、その裏では、<br>正体を隠して、'],
  [13.2, 17.0, 'ファンを守るために<br>戦っている。'],
  [17.2, 21.0, '相手がねらうのは、'],
  [21.0, 25.0, '人間の<br>魂。'],
  [25.2, 29.0, 'そこへ現れたのは、'],
  [29.0, 33.0, '人気急上昇の、<br>ライバルグループ。'],
  [33.2, 37.4, 'ところが、<br>その正体は、'],
  [37.4, 41.8, '人間の魂をねらう側の、<br>手先だった。'],
  [42.2, 45.4, 'ステージの上でも、'],
  [45.4, 49.0, '戦いは<br>続いていく。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、KPOPガールズ！<br>デーモン・ハンターズ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotAlley || f === shotSoul || f === shotRival || f === shotTrue,
  meta: {
    id: 'q009', v2: true, answer: 'KPOPガールズ！デーモン・ハンターズ',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 909,
    hits: [5.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 21.0, 37.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '3人組': 'さんにんぐみ', '満員': 'まんいん', '正体': 'しょうたい', '魂': 'たましい', '急上昇': 'きゅうじょうしょう', '手先': 'てさき', 'KPOPガールズ！': 'ケーポップガールズ', 'デーモン・ハンターズ': 'デーモンハンターズ' },
    caption: 'この映画のタイトル、わかる？\nスタジアムを満員にする3人組のスーパースター。でもその裏では、正体を隠してファンを守るために戦っている。そこへ現れた人気急上昇のライバルグループの正体は……\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'アニメ映画', '洋画'],
  },
});
applyQuizCards({ answer: 'KPOPガールズ！<br>デーモン・ハンターズ', info: 'Netflix｜アニメ映画・100分', answerSize: 72 });
