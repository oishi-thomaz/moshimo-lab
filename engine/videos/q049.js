import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #049 インターステラー（映画・アメリカ・2014年・169分・SF。U-NEXT・Prime Video・Hulu で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/intasutera）で2026/11/4確認。Filmarks 4.2・レビュー325,436件 filmarks.com/movies/55572）
// 確かめた事実（Filmarks の作品ページのあらすじ・ja.wikipedia「インターステラー (映画)」。2026/11/4）：
//   ・地球の寿命は尽きかけていた。居住可能な新たな惑星を探すミッションに選ばれたのは、まだ幼い子供を持つ元エンジニアの男（Filmarks）
//   ・砂嵐と疫病で農作物が枯れ、人類は滅亡の危機。主人公クーパーは元テストパイロットで、今はトウモロコシ農場。息子トム15歳・娘マーフ10歳。
//     土星付近のワームホールを通って新天地を探す（wikipedia）
//   ・監督 クリストファー・ノーラン。米公開2014年11月7日・日本公開2014年11月22日。169分。第87回アカデミー賞 視覚効果賞
// 構成（ヒント6段）：1 畑が砂嵐に飲み込まれる・作物が育たなくなった世界 → 2 元パイロットの農家・10歳の娘と15歳の息子 → 3 ほこりまみれのトウモロコシ畑・残された時間は少ない
//   → 4 人類が住める新しい星を探す・幼い娘を残して宇宙へ → 5 2014年のアメリカのSF映画・169分 → 6 決め手：土星の近くのワームホール、監督はクリストファー・ノーラン
// 人物名は出さない。後半の展開・結末（本棚の秘密・誰が何をしたか）には絶対に触れない。作品の映像・俳優・ポスター・宇宙船やブラックホールのデザイン・
//   有名な場面の構図（波の惑星・本棚の向こう側など）は使わない。人と畑と宇宙は汎用の3D

const S = quizStage({ bg: '#b89a70', floor: '#8a7048', fogNear: 18, fogFar: 70 });
const qs = S.scene;
const R = rng(4949);

const DAD = { skin: '#ecc9a6', hair: '#6a4a2a', shirt: '#5a6a7a', pants: '#3a3a40' };
const GIRL = { skin: '#f2d4b8', hair: '#5a3a20', shirt: '#c8a070', pants: '#3a4a6a', long: true, scale: 0.68 };
const SON = { skin: '#ecc9a6', hair: '#5a3a20', shirt: '#8a4a3a', pants: '#3a3a44', scale: 0.88 };

function cornField(cx, cz, n, spread) { const g = new THREE.Group(); g.position.set(cx, 0, cz); qs.add(g); const stM = mat('#8a9a3a'), lfM = mat('#7a8a2a'); for (let i = 0; i < n; i++) { const p = new THREE.Group(); const st = box(0.06, 1.8 + R() * 0.4, 0.06, stM); st.position.y = 0.95; p.add(st); for (let k = 0; k < 2; k++) { const lf = box(0.5, 0.03, 0.12, lfM); lf.position.set(0.2 * (k ? -1 : 1), 1.0 + k * 0.4, 0); lf.rotation.z = (k ? 1 : -1) * 0.5; p.add(lf); } const cob = box(0.1, 0.25, 0.1, mat('#e6c060')); cob.position.set(0.06, 1.3, 0); p.add(cob); p.position.set((R() - 0.5) * spread, 0, -R() * spread * 0.8); p.userData.ph = R() * 6; g.add(p); } return g; }

// ---------- 1段目. 畑と迫る砂嵐（x=0） ----------
const FIELD1 = cornField(0, 0, 70, 10);
const DUST = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, map: canvasTex(256, 96, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(120,90,60,0)'); gr.addColorStop(0.35, 'rgba(120,90,60,.9)'); gr.addColorStop(1, 'rgba(90,66,44,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(150,115,80,.5)'; g.beginPath(); g.arc(R() * w, 30 + R() * 30, 8 + R() * 18, 0, Math.PI * 2); g.fill(); } }) })); qs.add(DUST);
const HOUSE1 = new THREE.Group(); { const b = box(3, 2.2, 2.4, mat('#e8e0cc')); b.position.y = 1.1; HOUSE1.add(b); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.2, 4), mat('#6a5a4a')); rf.position.y = 2.8; rf.rotation.y = Math.PI / 4; HOUSE1.add(rf); } HOUSE1.position.set(-4, 0, -9); qs.add(HOUSE1);
const GRAINS = []; for (let i = 0; i < 120; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: '#a8885a' })); d.userData = { x: R() * 12 - 6, y: R() * 4, z: R() * 8 - 6, s: 2 + R() * 3 }; qs.add(d); GRAINS.push(d); }
function grains(cx, t, on) { GRAINS.forEach(d => { d.visible = on; if (!on) return; const u = d.userData; d.position.set(cx + ((u.x + t * u.s + 6) % 12) - 6, u.y + Math.sin(t * 2 + u.x) * 0.2, u.z); }); }
const tStorm = tag('迫る砂嵐', { size: 84, w: 400, bg: '#14161c', sx: 1.9 }); tStorm.position.set(0, 3.2, -2); qs.add(tStorm);
const tCrop = tag('作物が育たない世界', { size: 64, w: 620, bg: '#b23a3a', sx: 2.4 }); tCrop.position.set(0, 3.2, -2); qs.add(tCrop);

// ---------- 2段目. 農家の玄関先（x=40）。父と娘と息子 ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#9a8058')); fl.position.set(KX, 0.03, -1); qs.add(fl); const h = box(8, 4, 0.3, mat('#e8e0cc')); h.position.set(KX, 2, -3.4); qs.add(h); const pr = box(8, 0.2, 2, mat('#8a6a4a')); pr.position.set(KX, 0.1, -2.4); qs.add(pr);
  const dr = box(1.0, 2.0, 0.1, mat('#6a4a2a')); dr.position.set(KX + 1.5, 1.1, -3.2); qs.add(dr); for (const x of [-1.6, -0.2]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ color: '#3a4a5a' })); w.position.set(KX + x, 2.2, -3.24); qs.add(w); } }
const TRUCK = new THREE.Group(); { const b = box(1.8, 0.8, 3.4, mat('#4a6a8a')); b.position.y = 0.8; TRUCK.add(b); const c = box(1.7, 0.7, 1.4, mat('#4a6a8a')); c.position.set(0, 1.55, 0.6); TRUCK.add(c); for (const [x, z] of [[-0.9, 1.1], [0.9, 1.1], [-0.9, -1.1], [0.9, -1.1]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16), mat('#1a1a1a')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); TRUCK.add(w); } } TRUCK.position.set(KX - 3.4, 0, -0.4); TRUCK.rotation.y = 0.3; qs.add(TRUCK);
const dad2 = makePerson(DAD); dad2.position.set(KX - 0.4, 0.2, -1.6); qs.add(dad2);
const girl2 = makePerson(GIRL); girl2.position.set(KX + 0.4, 0.2, -1.4); qs.add(girl2);
const son2 = makePerson(SON); son2.position.set(KX - 1.3, 0.2, -1.8); qs.add(son2);
const WING = new THREE.Group(); { const b = box(0.6, 0.14, 0.16, mat('#c8ccd4')); WING.add(b); const w = box(0.16, 0.03, 0.9, mat('#c8ccd4')); WING.add(w); } WING.position.set(KX - 0.4, 2.6, -1.6); qs.add(WING);
const tPilot = tag('元パイロットの農家', { size: 64, w: 600, bg: '#14161c', sx: 2.0 }); tPilot.position.set(KX, 3.2, -1.6); qs.add(tPilot);
const tKids = tag('10歳の娘と 15歳の息子', { size: 58, w: 660, bg: '#4fa3d1', sx: 2.1 }); tKids.position.set(KX, 3.2, -1.6); qs.add(tKids);

// ---------- 3段目. ほこりまみれのトウモロコシ畑（x=90）。かすんだ太陽 ----------
const CX = 90;
const FIELD3 = cornField(CX, 2, 140, 16);
const SUN3 = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: '#f4d8a0', transparent: true, opacity: 0.8, fog: false })); SUN3.position.set(CX + 4, 8, -40); qs.add(SUN3);
const HAZE = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshBasicMaterial({ color: '#b89a70', transparent: true, opacity: 0.5, depthWrite: false, fog: false })); HAZE.position.set(CX, 6, -30); qs.add(HAZE);
const CLOCK = new THREE.Group(); { const f = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), new THREE.MeshBasicMaterial({ color: '#f4f0e4' })); CLOCK.add(f); const r = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.8, 32), new THREE.MeshBasicMaterial({ color: '#2a2a2a' })); CLOCK.add(r); const h = box(0.06, 0.45, 0.02, new THREE.MeshBasicMaterial({ color: '#b23a3a' })); h.position.y = 0.2; const hp = new THREE.Group(); hp.add(h); hp.position.z = 0.01; CLOCK.add(hp); CLOCK.userData.hand = hp; } CLOCK.position.set(CX, 2.9, -1.5); qs.add(CLOCK);
const tCorn = tag('ほこりまみれの畑', { size: 68, w: 560, bg: '#14161c', sx: 2.4 }); tCorn.position.set(CX, 4.3, -1.5); qs.add(tCorn);
const tTime = tag('人類に 残された時間', { size: 62, w: 620, bg: '#b23a3a', sx: 2.6 }); tTime.position.set(CX, 4.3, -1.5); qs.add(tTime);

// ---------- 4段目. 夜の発射台（x=130）。手を振る娘と、旅立つ父 ----------
const BX = 130;
{ const fl = box(14, 0.04, 12, mat('#4a4a4a')); fl.position.set(BX, 0.03, -2); qs.add(fl); }
const ROCKET = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 7, 20), mat('#e8e8ec')); b.position.y = 3.5; ROCKET.add(b); const n = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 20), mat('#e8e8ec')); n.position.y = 7.8; ROCKET.add(n); for (let i = 0; i < 4; i++) { const f = box(0.08, 1.2, 0.8, mat('#2a2a30')); f.position.set(Math.cos(i * Math.PI / 2) * 0.8, 0.8, Math.sin(i * Math.PI / 2) * 0.8); f.rotation.y = -i * Math.PI / 2; ROCKET.add(f); } const tw = box(0.4, 9, 0.4, mat('#8a6a3a')); tw.position.set(1.6, 4.5, 0); ROCKET.add(tw); } ROCKET.position.set(BX + 2.6, 0, -9); qs.add(ROCKET);
const STARS4 = []; for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.06, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); s.position.set(BX - 16 + R() * 32, 6 + R() * 14, -40); qs.add(s); STARS4.push(s); }
const PLANETS = []; for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.5 + i * 0.2, 20, 14), new THREE.MeshLambertMaterial({ color: ['#6a9ad8', '#d8a86a', '#8ad8a0'][i], emissive: ['#1a2a4a', '#4a2a10', '#1a4a2a'][i] })); p.position.set(BX - 4 + i * 3.6, 9 + (i % 2) * 2, -30); qs.add(p); PLANETS.push(p); }
const dad4 = makePerson({ ...DAD, shirt: '#e8e4dc', pants: '#e8e4dc' }); dad4.position.set(BX + 0.9, 0, -2.4); qs.add(dad4);
const girl4 = makePerson(GIRL); girl4.position.set(BX - 0.8, 0, 0.2); girl4.rotation.y = Math.PI; qs.add(girl4);
const tSeek = tag('人類が住める星を探せ', { size: 60, w: 640, bg: '#14161c', sx: 2.4 }); tSeek.position.set(BX, 3.6, -1.4); qs.add(tSeek);
const tLeave = tag('娘を残して 宇宙へ', { size: 66, w: 580, bg: '#4fa3d1', sx: 2.4 }); tLeave.position.set(BX, 3.6, -1.4); qs.add(tLeave);

// ---------- 5段目. フィルムと星（x=170）。2014年のアメリカのSF・169分 ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), new THREE.MeshBasicMaterial({ color: '#0a0c18' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const STARS5 = []; for (let i = 0; i < 60; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.03 + R() * 0.04, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); s.position.set(FX - 7 + R() * 14, R() * 9, -2.9); qs.add(s); STARS5.push(s); }
const DIAL = new THREE.Group(); { const r = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.35, 60), new THREE.MeshBasicMaterial({ color: '#e6b450' })); DIAL.add(r); for (let i = 0; i < 12; i++) { const tk = box(0.05, 0.2, 0.02, new THREE.MeshBasicMaterial({ color: '#e6b450' })); tk.position.set(Math.sin(i / 12 * Math.PI * 2) * 1.05, Math.cos(i / 12 * Math.PI * 2) * 1.05, 0); tk.rotation.z = -i / 12 * Math.PI * 2; DIAL.add(tk); } const hd = box(0.07, 0.9, 0.02, new THREE.MeshBasicMaterial({ color: '#ffffff' })); hd.position.y = 0.45; const hp = new THREE.Group(); hp.add(hd); DIAL.add(hp); DIAL.userData.hand = hp; } DIAL.position.set(FX, 2.4, -1.5); qs.add(DIAL);
const tUS = tag('2014年 アメリカのSF映画', { size: 56, w: 720, bg: '#4fa3d1', sx: 3.2 }); tUS.position.set(FX, 4.6, -1.2); qs.add(tUS);
const tLong = tag('上映時間 169分', { size: 70, w: 540, bg: '#e6b450', color: '#14161c', sx: 2.8 }); tLong.position.set(FX, 4.6, -1.2); qs.add(tLong);

// ---------- 6段目. 土星とワームホール（x=210） ----------
const NX = 210;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ color: '#04050c', fog: false })); bg.position.set(NX, 4, -20); qs.add(bg); }
const STARS6 = []; for (let i = 0; i < 90; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.05 + R() * 0.05, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); s.position.set(NX - 18 + R() * 36, -6 + R() * 22, -19); qs.add(s); STARS6.push(s); }
const SATURN = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(2.2, 40, 28), new THREE.MeshLambertMaterial({ map: canvasTex(64, 128, (g, w, h) => { for (let y = 0; y < h; y++) { const k = Math.sin(y * 0.35) * 0.5 + 0.5; g.fillStyle = `rgb(${200 + k * 30},${170 + k * 30},${110 + k * 30})`; g.fillRect(0, y, w, 1); } }), emissive: '#2a2010' })); SATURN.add(b); const ring = new THREE.Mesh(new THREE.RingGeometry(2.8, 4.4, 80), new THREE.MeshBasicMaterial({ color: '#d8c8a0', side: THREE.DoubleSide, transparent: true, opacity: 0.75, fog: false })); ring.rotation.x = Math.PI / 2 - 0.35; SATURN.add(ring); } SATURN.position.set(NX - 3.4, 4.8, -12); SATURN.rotation.z = 0.25; qs.add(SATURN);
const WORM = new THREE.Group(); { const core = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 24), new THREE.MeshBasicMaterial({ color: '#cfe4ff', transparent: true, opacity: 0.9 })); WORM.add(core); for (let i = 0; i < 3; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(1.25 + i * 0.3, 32, 24), new THREE.MeshBasicMaterial({ color: '#8ab4ff', transparent: true, opacity: 0.18 - i * 0.04, side: THREE.BackSide, depthWrite: false })); WORM.add(h); } } WORM.position.set(NX + 2.2, 1.4, -8); qs.add(WORM);
const SHIP = new THREE.Group(); { const b = box(0.5, 0.18, 0.18, mat('#e8e8ec')); SHIP.add(b); const w = box(0.14, 0.04, 0.6, mat('#c8ccd4')); SHIP.add(w); } SHIP.position.set(NX, 1, -3); qs.add(SHIP);
const tWorm = tag('土星の近くの ワームホール', { size: 58, w: 720, bg: '#4fa3d1', sx: 4.2 }); tWorm.position.set(NX, 5.0, -3); qs.add(tWorm);
const tNolan = tag('監督 クリストファー・ノーラン', { size: 52, w: 780, bg: '#14161c', sx: 4.4 }); tNolan.position.set(NX, 5.0, -3); qs.add(tNolan);

// ---------- クイズ用：夕暮れの畑で空を見上げる父と娘（x=250） ----------
const QX = 250;
const FIELDQ = cornField(QX, 0, 80, 12);
const dadQ = makePerson(DAD); dadQ.position.set(QX - 0.35, 0, 1.2); dadQ.rotation.y = 0.15; qs.add(dadQ);
const girlQ = makePerson(GIRL); girlQ.position.set(QX + 0.35, 0, 1.2); girlQ.rotation.y = -0.15; qs.add(girlQ);
const STARSQ = []; for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.06, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false, transparent: true })); s.position.set(QX - 14 + R() * 28, 6 + R() * 12, -36); qs.add(s); STARSQ.push(s); }

// ---------- shots ----------
const ALL = [tStorm, tCrop, tPilot, tKids, tCorn, tTime, tSeek, tLeave, tUS, tLong, tWorm, tNolan];
function base() { S.reset(); ALL.forEach(x => x.visible = false); grains(0, 0, false); DUST.visible = false; S.floor.visible = true; }
function sway(field, t) { field.children.forEach(p => { p.rotation.z = Math.sin(t * 2.4 + p.userData.ph) * 0.08; }); }

function shotStorm(t) { // 1段目 0〜9：畑が、砂嵐に飲み込まれていく。作物が、どんどん育たなくなった世界（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-20); S.hemi.intensity = 1.0; S.darken(0.15 + 0.3 * ease(t / 9), '#5a4028');
  DUST.visible = true; DUST.position.set(0, 4, lerp(-26, -12, ease(t / 9))); DUST.scale.set(1, lerp(0.8, 1.2, t / 9), 1);
  grains(0, t, true); sway(FIELD1, t * 2);
  FIELD1.children.forEach((p, i) => { const dry = t > 4.8 ? ease(clamp((t - 4.8 - (i % 10) * 0.08) / 1.2)) : 0; p.children[0].material.color.setRGB(lerp(0.54, 0.6, dry), lerp(0.6, 0.48, dry), lerp(0.23, 0.25, dry)); });
  tStorm.userData.pop(1); if (t > 4.6) tStorm.visible = false;
  tCrop.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(2.2, 2.4, u), lerp(5.4, 4.6, u), 0, 2.4, -10, 60);
  return qs;
}
function shotFamily(t) { // 2段目 9〜17：主人公は、元パイロットの農家。10歳の娘と、15歳の息子がいる
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.2; S.darken(0.15, '#8a6a48');
  grains(KX, t, true);
  WING.visible = t < 4.0; WING.position.set(KX - 0.4 + Math.sin(t * 1.5) * 0.3, 2.6 + Math.sin(t * 2) * 0.08, -1.6); WING.rotation.z = Math.sin(t * 1.5) * 0.2;
  girl2.userData.arms[1].rotation.x = t > 4.2 ? -0.5 : 0; dad2.userData.arms[0].rotation.x = t > 4.2 ? -0.4 : 0; girl2.userData.head.rotation.x = -0.35;
  tPilot.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPilot.visible = false;
  tKids.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.4, 0.0, u), lerp(2.0, 1.9, u), lerp(4.4, 3.6, u), KX - 0.3, 1.6, -1.6, 58);
  return qs;
}
function shotCorn(t) { // 3段目 17〜25：舞台は、ほこりまみれのトウモロコシ畑。人類に、残された時間は少ない
  base(); S.aim(CX, -4); lift(-10); S.hemi.intensity = 1.1; S.darken(0.3, '#8a6a48');
  grains(CX, t, true); sway(FIELD3, t);
  CLOCK.visible = t > 4.2; CLOCK.scale.setScalar(t > 4.2 ? ease(clamp((t - 4.2) / 0.35)) : 0.01); CLOCK.userData.hand.rotation.z = -t * 2.2;
  tCorn.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tCorn.visible = false;
  tTime.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-1.0, 0.4, u), lerp(2.4, 2.8, u), lerp(6.4, 5.4, u), CX, 2.6, -8, 58);
  return qs;
}
function shotLaunch(t) { // 4段目 25〜33：使命は、人類が住める新しい星を探すこと。幼い娘を地球に残して、宇宙へ
  base(); S.aim(BX, -4); lift(-20); S.hemi.intensity = 0.5; S.key.intensity = 0.4; S.darken(0.85, '#0a0e22');
  PLANETS.forEach((p, i) => p.rotation.y = t * 0.3 + i);
  const w = ease(clamp((t - 4.2) / 3)); dad4.position.z = lerp(-2.4, -5.0, w); dad4.rotation.y = Math.PI; const ph = t * 7; dad4.userData.legs[0].rotation.x = Math.sin(ph) * 0.4 * (w > 0 && w < 1 ? 1 : 0); dad4.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4 * (w > 0 && w < 1 ? 1 : 0);
  girl4.userData.arms[1].rotation.x = t > 4.4 ? -2.6 + 0.3 * Math.sin(t * 6) : 0;
  tSeek.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSeek.visible = false;
  tLeave.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.4, -1.0, u), lerp(1.6, 1.8, u), lerp(4.0, 3.4, u), BX + 0.8, 2.8, -6, 60);
  return qs;
}
function shotSF(t) { // 5段目 33〜42：2014年の、アメリカのSF映画。上映時間は、169分
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.0; S.floor.visible = false; S.darken(1, '#0a0c18');
  STARS5.forEach((s, i) => s.scale.setScalar(0.7 + 0.3 * Math.sin(t * 3 + i)));
  DIAL.userData.hand.rotation.z = t > 4.2 ? -Math.min(1, (t - 4.2) / 3) * Math.PI * 2 * (169 / 180) : 0;
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false;
  tLong.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.6, lerp(7.0, 6.4, u), FX, 2.8, -1.5, 56);
  return qs;
}
function shotSpace(t, quiz = 0) { // 6段目 42〜49（決め手）：土星の近くの、ワームホールを通る。監督は、クリストファー・ノーラン
  base(); S.aim(NX, -8); lift(-30); S.hemi.intensity = 0.8; S.darken(1, '#04050c'); S.floor.visible = false;
  SATURN.rotation.y = t * 0.1; WORM.rotation.y = t * 0.6; WORM.children.forEach((c, i) => c.scale.setScalar(1 + 0.05 * Math.sin(t * 3 + i)));
  const k = clamp(t / 7); SHIP.position.set(lerp(NX - 1.5, NX + 2.0, k), lerp(0.2, 1.3, k), lerp(-2, -7.4, k)); SHIP.rotation.y = -0.9; SHIP.scale.setScalar(lerp(1.0, 0.3, k));
  if (!quiz) { tWorm.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tWorm.visible = false; tNolan.userData.pop((t - 3.6) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(-0.4, 0.2, u), lerp(2.6, 2.8, u), lerp(6.0, 5.2, u), NX, 3.0, -8, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夕暮れの畑で星を見上げる父と娘）
  base(); S.aim(QX, -2); lift(-20); S.hemi.intensity = lerp(0.8, 0.3, ease(t)); S.darken(0.75, '#1a1430');
  sway(FIELDQ, t); STARSQ.forEach((s, i) => s.material.opacity = 0.5 + 0.5 * Math.sin(t * 2 + i));
  dadQ.userData.head.rotation.x = -0.4; girlQ.userData.head.rotation.x = -0.5; girlQ.userData.arms[1].rotation.x = -0.3; dadQ.userData.arms[0].rotation.x = -0.3;
  S.spot.color.set(0xffe0b0); S.spot.position.set(QX, 6, 4.6); S.spot.target.position.set(QX, 1, 1.2); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(QX + lerp(0.15, 0.05, k), lerp(1.4, 1.3, k), lerp(4.6, 4.0, k), QX, 1.6, 1.2, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotStorm },
  { a: 9, b: 17, f: shotFamily },
  { a: 17, b: 25, f: shotCorn },
  { a: 25, b: 33, f: shotLaunch },
  { a: 33, b: 42, f: shotSF },
  { a: 42, b: 49, f: (t) => shotSpace(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '畑が、砂嵐に<br>飲み込まれていく。'],
  [5.6, 9.0, '作物が、どんどん<br>育たなくなった世界。'],
  [9.2, 13.2, '主人公は、<br>元パイロットの農家。'],
  [13.2, 17.0, '10歳の娘と、<br>15歳の息子がいる。'],
  [17.2, 21.0, '舞台は、ほこりまみれの<br>トウモロコシ畑。'],
  [21.0, 25.0, '人類に、残された時間は<br>少ない。'],
  [25.2, 29.0, '使命は、人類が住める<br>新しい星を探すこと。'],
  [29.0, 33.0, '幼い娘を地球に残して、<br>宇宙へ。'],
  [33.2, 37.4, '2014年の、<br>アメリカのSF映画。'],
  [37.4, 41.8, '上映時間は、<br>169分。'],
  [42.2, 45.4, '土星の近くの、<br>ワームホールを通る。'],
  [45.4, 49.0, '監督は、<br>クリストファー・ノーラン。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、インターステラー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q049', v2: true, answer: 'インターステラー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 4949,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [4.8, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'インターステラー': 'インターステラー', 'クリストファー・ノーラン': 'クリストファーノーラン', '2014年': 'にせんじゅうよねん', '169分': 'ひゃくろくじゅうきゅうふん', '10歳': 'じゅっさい', '15歳': 'じゅうごさい', 'SF映画': 'エスエフえいが', '畑が': 'はたけが', '砂嵐': 'すなあらし', '飲み込まれて': 'のみこまれて', '作物': 'さくもつ', '育たなく': 'そだたなく', '世界': 'せかい', '主人公': 'しゅじんこう', '元パイロット': 'もとパイロット', '農家': 'のうか', '娘': 'むすめ', '息子': 'むすこ', '舞台': 'ぶたい', 'ほこりまみれ': 'ほこりまみれ', 'トウモロコシ畑': 'トウモロコシばたけ', '人類': 'じんるい', '残された時間': 'のこされたじかん', '少ない': 'すくない', '使命': 'しめい', '住める': 'すめる', '新しい星': 'あたらしいほし', '探す': 'さがす', '幼い': 'おさない', '地球': 'ちきゅう', '残して': 'のこして', '宇宙': 'うちゅう', '上映時間': 'じょうえいじかん', '土星': 'どせい', '近く': 'ちかく', 'ワームホール': 'ワームホール', '通る': 'とおる', '監督': 'かんとく', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n畑が、砂嵐に飲み込まれていく。作物が、どんどん育たなくなった世界。主人公は、元パイロットの農家。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'PrimeVideo', '映画好き', 'SF映画'],
  },
});
applyQuizCards({ answer: 'インター<br>ステラー', info: 'U-NEXT・Prime Video｜映画・169分', answerSize: 120 });
