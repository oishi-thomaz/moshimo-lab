import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, makeSweat, makeDeskIsland, poseSit } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { porch, setPorchEnv, canopy } from '../scenes/delivery.js';
import { makeSet, makeFridge, makeCounter, makeTrash, makeBed } from '../scenes/home.js';

// もしもドタキャンした宴会料理が、全部家に届いたら？（皮肉回・台本 S99・図星／大人の本音）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。0639 出禁・S87 残業代 と同じ 迷惑をかける側が痛い目を見る 型を、忘年会の季節の飲み会で。後半で かけもち予約の客 にも返す
// 数字は使わない（20人分・半日は筋の中の数。無断キャンセルの損失額の推計は出さない）。実在の店・ロゴは出さない。食べ物を捨てる絵は出さない（配って食べる）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a';
setPorchEnv('dusk');
// ---------- 料理（大皿） ----------
function makePlatter(kind = 0, s = 1) {
  const g = new THREE.Group();
  if (kind === 0) { // 刺身の舟盛り
    const hull = box(1.2, 0.18, 0.5, mat('#8a5a32')); hull.position.y = 0.09; g.add(hull); const bow = box(0.3, 0.3, 0.5, mat('#8a5a32')); bow.position.set(0.65, 0.18, 0); bow.rotation.z = 0.5; g.add(bow);
    const ice = box(1.0, 0.04, 0.4, mat('#e8f4ff')); ice.position.y = 0.2; g.add(ice);
    for (let i = 0; i < 12; i++) { const sl = box(0.14, 0.04, 0.1, mat(['#f08a7a', '#f4c0a0', '#e85a5a', '#fbe8e0'][i % 4])); sl.position.set(-0.4 + (i % 6) * 0.16, 0.24, -0.1 + Math.floor(i / 6) * 0.2); sl.rotation.z = 0.25; g.add(sl); }
  } else if (kind === 1) { // 唐揚げの大皿
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.06, 20), mat('#f4f4f2')); pl.position.y = 0.03; g.add(pl);
    const r = rng(5); for (let i = 0; i < 16; i++) { const k = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(['#b8742a', '#a8642a', '#c8843a'][i % 3], { flatShading: true })); const a = r() * 6.28, rr = r() * 0.32; k.position.set(Math.cos(a) * rr, 0.12 + (i > 10 ? 0.1 : 0), Math.sin(a) * rr); g.add(k); }
    const lem = box(0.12, 0.04, 0.08, mat('#f2d23a')); lem.position.set(0.3, 0.12, 0.2); g.add(lem);
  } else { // 寿司桶
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 20), mat('#2a2622')); pl.position.y = 0.07; g.add(pl);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; const sh = box(0.12, 0.06, 0.08, mat(['#f08a7a', '#fbfbf6', '#f2c14e', '#e85a5a'][i % 4])); sh.position.set(Math.cos(a) * 0.3, 0.17, Math.sin(a) * 0.3); sh.rotation.y = -a; g.add(sh); }
  }
  g.scale.setScalar(s); return g;
}

// ---------- A：玄関先（porch） ----------
const PLATES_P = []; for (let i = 0; i < 12; i++) { const p = makePlatter(i % 3, 0.9); porch.add(p); PLATES_P.push(p); }
function stackAt(list, n, x0, z0, cols = 3, dy = 0.3) { list.forEach((p, i) => { p.visible = i < n; p.position.set(x0 + (i % cols - (cols - 1) / 2) * 1.05, Math.floor(i / cols) * dy, z0 + (Math.floor(i / cols) % 2) * 0.1); p.rotation.y = (i % 2) * 0.3; }); }
const KANJI = makeMan({ shirt: '#c8a07a', hair: '#1d1a19' }); porch.add(KANJI); // 幹事（部屋着）
const sweatP = makeSweat(); KANJI.userData.head.add(sweatP);
const dodon = label('ドドン', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); porch.add(dodon);
const ninbun = label('20人分', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.9 }); porch.add(ninbun);
const nikenbun = label('2軒分', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); porch.add(nikenbun);
const KAKE = makeWoman({ shirt: '#8a9ab8', hair: '#3a2620', scale: 0.96 }); porch.add(KAKE); // かけもち予約の客
const sweatK = makeSweat(); KAKE.userData.head.add(sweatK);

// ---------- B：部屋・会社・お店（makeSet） ----------
const H = makeSet({ bg: '#e0d6cc', ground: '#a8988a' }); const HS = H.S; H.hemi.intensity = 1.3;
H.room({ x: 0, w: 6, d: 5, h: 2.8, wall: '#efe6d6', floor: '#c9b8a0', right: true });
const BED = makeBed(); BED.position.set(-1.8, 0, -1.6); HS.add(BED);
const KANJI2 = makeMan({ shirt: '#c8a07a', hair: '#1d1a19' }); HS.add(KANJI2);
const sweat2 = makeSweat(); KANJI2.userData.head.add(sweat2);
const PLATES_R = []; for (let i = 0; i < 9; i++) { const p = makePlatter(i < 5 ? 0 : (i % 3), 0.9); HS.add(p); PLATES_R.push(p); }
const yuka = label('床が 舟盛り', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); HS.add(yuka);
const fuman = label('連絡なしで 来ない', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.2 }); HS.add(fuman);
// 台所と冷蔵庫（x=30）
const KX = 30; H.room({ x: KX, w: 6, d: 5, h: 2.8, wall: '#efe6d6', floor: '#c9b8a0' });
const FRIDGE = makeFridge(); FRIDGE.position.set(KX + 0.4, 0, -1.9); HS.add(FRIDGE);
const KARA = []; { const r = rng(7); for (let i = 0; i < 40; i++) { const k = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), mat(['#b8742a', '#a8642a', '#c8843a'][i % 3], { flatShading: true })); HS.add(k); k.userData.o = [(r() - 0.5) * 0.8, r() * 1.6, (r() - 0.5) * 0.4]; KARA.push(k); } }
const hairanai = label('入りきらない', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); HS.add(hairanai);
// 会社（x=60）
const OX = 60; H.room({ x: OX, w: 9, d: 6, h: 3.0, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(OX, 0, -1.2); HS.add(ISL);
const COWORK = [0, 1, 2].map(i => { const p = makeSuit({ woman: i === 1, jacket: ['#3a4256', '#5a4a6a', '#3a5a6a'][i], hair: i === 1 ? '#3a2620' : undefined }); HS.add(p); return p; });
const KANJI3 = makeSuit({ jacket: '#4a3a2a', tie: '#c8823a' }); HS.add(KANJI3);
const TRAY = makePlatter(1, 0.7); HS.add(TRAY);
const douzo = label('どうぞ…', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.7 }); HS.add(douzo);
// お店の厨房（x=90）
const SX = 90; H.room({ x: SX, w: 8, d: 6, h: 3.0, wall: '#f4f0e8', floor: '#9aa0a8' });
const CNT = makeCounter({ w: 4.4 }); CNT.position.set(SX, 0, -2.2); HS.add(CNT);
const CHEF = makeMan({ shirt: '#f4f4f4', pants: '#3a3e48', hair: '#1d1a19' }); const HAT = box(0.44, 0.22, 0.42, mat('#ffffff')); HAT.position.y = 0.6; CHEF.userData.head.add(HAT); HS.add(CHEF);
const CLOCK = label('9:00', { w: 512, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.7 }); HS.add(CLOCK);
const hannichi = label('半日の 仕込み', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); HS.add(hannichi);
const KNIFE = box(0.04, 0.02, 0.3, mat('#d8dde4')); HS.add(KNIFE);
const PLATES_S = []; for (let i = 0; i < 6; i++) { const p = makePlatter(i % 3, 0.6); HS.add(p); PLATES_S.push(p); }
const PH = makePhone({ w: 0.12, h: 0.24, cw: 120, ch: 240 }); HS.add(PH.g); PH.draw('call', (g, w, h) => { g.fillStyle = '#5ab07a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h * 0.7, 22, 0, 7); g.fill(); });
const denwa = label('前の日に 電話', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); HS.add(denwa);
const SHOPPH = box(0.3, 0.12, 0.22, mat('#3a3e48')); HS.add(SHOPPH);
const RENRAKU = [0, 1, 2].map(i => { const l = label(['行けません、すみません', 'キャンセルします', '2人減ります'][i], { w: 1024, size: 84, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.1 }); HS.add(l); return l; });
const TRASH = makeTrash(); HS.add(TRASH);
const kieta = label('捨てる料理 ゼロ', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); HS.add(kieta);
const yakusoku = label('料理との 約束', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); HS.add(yakusoku);

const P_LABELS = [dodon, ninbun, nikenbun];
const H_LABELS = [yuka, fuman, hairanai, douzo, CLOCK, hannichi, denwa, ...RENRAKU, kieta, yakusoku];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); p.visible = false; }
function reset() {
  [KANJI, KAKE, KANJI2, KANJI3, CHEF, ...COWORK].forEach(clearP); [...P_LABELS, ...H_LABELS].forEach(l => l.visible = false); el.flash.style.opacity = 0;
  [sweatP, sweatK, sweat2].forEach(s => s.userData.set(0)); [...PLATES_P, ...PLATES_R, ...PLATES_S].forEach(p => p.visible = false); KARA.forEach(k => k.visible = false); FRIDGE.userData.open(0);
  TRAY.visible = false; KNIFE.visible = false; PH.g.visible = false; SHOPPH.visible = false; TRASH.visible = false; canopy.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function porchCam(u = 0) { look(lerp(0.4, 0.3, u), 2.6, lerp(5.2, 4.8, u), 0, 1.75, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：玄関を開けると、20人分の宴会料理の大皿がドドンと届く
  reset(); lift(0); KANJI.visible = true; KANJI.position.set(0, 0.2, -1.9); KANJI.userData.arms.forEach((a, i) => a.rotation.set(0, 0, i ? 0.5 : -0.5));
  const n = Math.round(lerp(6, 12, easeOut(clamp((t - 0.05) / TP)))); PLATES_P.forEach((p, i) => { p.visible = i < n; }); stackAt(PLATES_P, n, 0, -0.4, 3, 0.32); PLATES_P.forEach((p, i) => { if (i < n) p.position.y += 0.06 + (i >= 6 ? Math.max(0, (1 - clamp((t - 0.05 - (i - 6) * 0.04) / 0.15))) * 0.6 : 0); });
  if (t > TP) { el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; say(dodon, t, TP, -0.8, 1.55, 0.2, 0.55); say(ninbun, t, TP + 0.15, 0.8, 1.45, 0.2, 0.55); }
  porchCam(ease(clamp(t / 3)) * 0.3);
  return porch;
}
function sKatamaru(t, d) { // 飲み会を流して家でくつろいでいた幹事が、大皿の山の前で固まる
  reset(); lift(120); KANJI.visible = true; KANJI.position.set(0, 0.2, -1.6); stackAt(PLATES_P, 12, 0, -0.2, 3, 0.32); if (t > d * 0.4) sweatP.userData.set(1, t);
  look(0.5, 2.0, 3.2, 0, 1.3, -1.2, 50);
  return porch;
}
function sFuman(t, d) { // 店の人たちの不満から。連絡もなく来ない予約で、料理が全部ムダになる
  reset(); lift(120); CHEF.visible = true; CHEF.position.set(SX + 0.4, 0, -1.4); CHEF.userData.head.rotation.x = 0.25; CHEF.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0));
  stackAt(PLATES_S, 6, SX - 0.6, -2.1, 3, 0.2); PLATES_S.forEach(p => p.position.y += 0.95);
  if (t > 0.4) say(fuman, t, 0.4, SX + 0.1, 2.3, -1.4, 1.1);
  look(SX + 0.4, 1.85, 2.2, SX, 1.3, -1.6, 50);
  return HS;
}
function sYuka(t, d) { // 1日目。刺身の舟盛りが、ワンルームの床を埋める
  reset(); lift(120); KANJI2.visible = true; KANJI2.position.set(-0.6, 0, -1.4); KANJI2.rotation.y = 0.4; sweat2.userData.set(1, t);
  const n = Math.round(lerp(3, 9, easeOut(clamp(t / (d * 0.5))))); PLATES_R.forEach((p, i) => { p.visible = i < n; p.position.set(-0.3 + (i % 3) * 1.3, 0, -0.2 + Math.floor(i / 3) * 0.75); p.rotation.y = 0.1 * i; });
  if (t > d * 0.5) say(yuka, t, d * 0.5, 0.3, 1.9, -0.6, 0.8);
  setHud('ドタキャンの料理', '1日目', 1);
  look(0.4, 3.2, 4.0, 0.2, 0.7, -0.7, 50);
  return HS;
}
function sReizouko(t, d) { // 2日目。冷蔵庫に、唐揚げが入りきらない
  reset(); lift(120); KANJI2.visible = true; KANJI2.position.set(KX - 0.6, 0, -1.2); KANJI2.rotation.y = 0.6; KANJI2.userData.arms[1].rotation.set(-1.5, 0, 0);
  FRIDGE.userData.open(1); const k = clamp((t - d * 0.3) / 0.6); KARA.forEach((m, i) => { m.visible = true; const [x, y, z] = m.userData.o; const fall = i > 26 ? k : 0; m.position.set(KX + 0.4 + x * 0.9, Math.max(0.08, 0.3 + y - fall * (y + 0.2)), -1.4 + z + fall * 0.6); });
  if (t > d * 0.45) say(hairanai, t, d * 0.45, KX + 0.2, 2.45, -1.3, 0.85);
  setHud('ドタキャンの料理', '2日目', 1);
  look(KX + 0.2, 1.8, 2.4, KX + 0.2, 1.1, -1.5, 50);
  return HS;
}
function sKubaru(t, d) { // 3日目。会社の同僚に、唐揚げを配って回る
  reset(); lift(120); const st = ISL.userData.seats; COWORK.forEach((p, i) => { const s = st[[0, 2, 1][i]]; p.visible = true; p.position.set(OX + s.x, 0, -1.2 + s.z); p.rotation.y = s.ry; poseSit(p); });
  const k = clamp(t / d); KANJI3.visible = true; KANJI3.position.set(OX + lerp(-1.6, 0.2, k), 0, 0.3); KANJI3.rotation.y = Math.PI * 0.75; poseWalk(KANJI3, t * 6, 0.5); KANJI3.userData.arms.forEach((a, i) => a.rotation.set(-1.25, 0, i ? 0.3 : -0.3));
  KANJI3.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.05, 0.55); KANJI3.localToWorld(v); TRAY.visible = true; TRAY.position.copy(v);
  if (t > d * 0.4) say(douzo, t, d * 0.4, KANJI3.position.x, 2.2, 0.3, 0.55);
  setHud('ドタキャンの料理', '3日目', 1);
  look(OX + 0.3, 2.4, 4.6, OX - 0.2, 1.1, -0.6, 50);
  return HS;
}
function sDake(t, d) { // でも、届いたのは料理だけじゃなかった
  reset(); lift(120); KANJI.visible = true; KANJI.position.set(0, 0.2, -1.6); stackAt(PLATES_P, 6, 0, -0.2, 3, 0.32);
  const u = ease(clamp(t / d)); look(lerp(0.6, 1.2, u), lerp(1.6, 2.6, u), lerp(1.6, 4.0, u), 0, 1.2, -1.2, 50);
  return porch;
}
function sShikomi(t, d) { // 料理と一緒に届いたのは、店の人が仕込んだ半日の時間
  reset(); lift(120); CHEF.visible = true; CHEF.position.set(SX + 0.2, 0, -1.5); CHEF.rotation.y = Math.PI; CHEF.userData.arms.forEach(a => a.rotation.set(-1.0 + Math.sin(t * 10) * 0.15, 0, 0));
  KNIFE.visible = true; KNIFE.position.set(SX + 0.35, 0.98, -2.1 + Math.sin(t * 10) * 0.04);
  const hrs = Math.min(17, 9 + Math.floor(clamp(t / (d * 0.7)) * 8)); CLOCK.visible = true; CLOCK.userData.set(hrs + ':00'); CLOCK.position.set(SX - 1.0, 2.2, -2.8); CLOCK.userData.size(0.5);
  stackAt(PLATES_S, Math.round(clamp(t / (d * 0.7)) * 6), SX - 0.9, -2.1, 3, 0.2); PLATES_S.forEach(p => p.position.y += 0.95);
  if (t > d * 0.5) say(hannichi, t, d * 0.5, SX + 0.7, 2.5, -1.5, 0.75);
  look(SX + 2.4, 2.0, 2.0, SX - 0.1, 1.3, -1.9, 50);
  return HS;
}
function sNiken(t, d) { // 2軒かけもちで予約していた客の家には、2軒分届く
  reset(); lift(120); KAKE.visible = true; KAKE.position.set(0, 0.2, -1.9); if (t > d * 0.4) sweatK.userData.set(1, t);
  PLATES_P.forEach(p => p.visible = false); const n = Math.round(lerp(4, 12, easeOut(clamp(t / (d * 0.4))))); stackAt(PLATES_P, n, 0, -0.4, 3, 0.32);
  if (t > d * 0.45) say(nikenbun, t, d * 0.45, 0.75, 1.55, 0.2, 0.55);
  porchCam(0.5);
  return porch;
}
function sDenwa(t, d) { // 次の飲み会。幹事が、前の日に自分から店に電話する
  reset(); lift(120); KANJI2.visible = true; KANJI2.position.set(KX - 0.6, 0, -1.0); KANJI2.rotation.y = 0.3; KANJI2.userData.arms[1].rotation.set(-2.7, 0, 0.5);
  KANJI2.updateMatrixWorld(); const v = new THREE.Vector3(-0.22, 1.72, 0.12); KANJI2.localToWorld(v); PH.g.visible = true; PH.g.position.copy(v); PH.g.rotation.y = KANJI2.rotation.y + Math.PI / 2;
  if (t > d * 0.4) say(denwa, t, d * 0.4, KX - 0.6, 2.25, -1.0, 0.8);
  look(KX - 0.2, 1.8, 2.4, KX - 0.6, 1.5, -1.0, 50);
  return HS;
}
function sRenraku(t, d) { // 行けなくなった客から、すぐに連絡が来るようになる
  reset(); lift(120); CHEF.visible = true; CHEF.position.set(SX + 0.4, 0, -1.4); CHEF.userData.arms[1].rotation.set(-1.4, 0, 0.2); CHEF.userData.head.rotation.x = 0.2;
  SHOPPH.visible = true; SHOPPH.position.set(SX + 0.4, 0.98, -2.1);
  RENRAKU.forEach((l, i) => { const t0 = 0.3 + i * d * 0.22; if (t > t0) say(l, t, t0, SX + 0.2 + (i % 2 ? 0.25 : -0.25), 1.6 + i * 0.3, -1.2, 0.95); });
  look(SX + 0.4, 1.9, 2.5, SX + 0.2, 1.5, -1.4, 50);
  return HS;
}
function sKekka(t, d) { // 結果：ドタキャンの料理が家に届くようになって、消えたのは無断キャンセルと、捨てられるはずだった料理だった
  reset(); lift(120); CHEF.visible = true; CHEF.position.set(SX + 0.6, 0, -1.4); CHEF.rotation.y = -0.3; CHEF.userData.arms.forEach((a, i) => a.rotation.set(0, 0, i ? 0.3 : -0.3));
  TRASH.visible = true; TRASH.position.set(SX - 0.6, 0, -1.2); TRASH.userData.open(0.8);
  if (t > d * 0.55) say(kieta, t, d * 0.55, SX - 0.4, 1.9, -1.2, 0.85);
  setTop('結果', '捨てる料理が 消えた', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(SX + lerp(0.3, 0.5, u), lerp(1.9, 2.2, u), lerp(2.6, 3.4, u), SX, 1.0, -1.3, 50);
  return HS;
}
function sYakusoku(t, d) { // 予約は、店にとっては、もう作り始めた料理との約束だったのかもしれない
  reset(); lift(120); CHEF.visible = true; CHEF.position.set(SX + 0.2, 0, -1.5); CHEF.rotation.y = Math.PI; CHEF.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0));
  stackAt(PLATES_S, 3, SX - 0.6, -2.1, 3, 0.2); PLATES_S.forEach(p => p.position.y += 0.95);
  if (t > d * 0.45) say(yakusoku, t, d * 0.45, SX - 0.3, 2.3, -1.8, 0.85);
  const u = ease(clamp(t / d)); look(SX + lerp(1.4, 1.0, u), 1.9, lerp(1.4, 1.8, u), SX - 0.3, 1.2, -1.9, 50);
  return HS;
}
function sAsk(t) { reset(); lift(0); KANJI.visible = true; KANJI.position.set(0, 0.2, -1.9); KANJI.userData.arms.forEach((a, i) => a.rotation.set(0, 0, i ? 0.5 : -0.5)); stackAt(PLATES_P, 12, 0, -0.4, 3, 0.32); PLATES_P.forEach(p => p.position.y += 0.06); ninbun.visible = true; ninbun.position.set(0.8, 1.45, 0.2); ninbun.userData.size(0.55); porchCam(0); return porch; }

const NARR = { '飲み会': 'のみかい', '流して': 'ながして', '家': 'いえ', '幹事': 'かんじ', '大皿': 'おおざら', '山': 'やま', '固まる': 'かたまる', '店': 'みせ', '不満': 'ふまん', '連絡': 'れんらく', '来ない': 'こない', '予約': 'よやく', '料理': 'りょうり', '全部': 'ぜんぶ', '1日目': 'いちにちめ', '刺身': 'さしみ', '舟盛り': 'ふなもり', '床': 'ゆか', '埋める': 'うめる', '2日目': 'ふつかめ', '冷蔵庫': 'れいぞうこ', '唐揚げ': 'からあげ', '入りきらない': 'はいりきらない', '3日目': 'みっかめ', '会社': 'かいしゃ', '同僚': 'どうりょう', '配って': 'くばって', '回る': 'まわる', '届いた': 'とどいた', '一緒': 'いっしょ', '仕込んだ': 'しこんだ', '半日': 'はんにち', '時間': 'じかん', '2軒': 'にけん', '客': 'きゃく', '2軒分': 'にけんぶん', '届く': 'とどく', '次の': 'つぎの', '前の日': 'まえのひ', '自分': 'じぶん', '電話': 'でんわ', '行けなくなった': 'いけなくなった', '結果：': '結果、', '無断': 'むだん', '捨てられる': 'すてられる', '作り始めた': 'つくりはじめた', '約束': 'やくそく' };
const P = planTimes([
  ['飲み会を流して家でくつろいで<br>いた幹事が、', (t, d) => sKatamaru(t, 2 * d)],
  ['大皿の山の前で固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['店の人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['連絡もなく来ない予約で、<br>料理が全部ムダになる。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。刺身の舟盛りが、<br>ワンルームの床を埋める。', sYuka],
  ['2日目。冷蔵庫に、<br>唐揚げが入りきらない。', sReizouko],
  ['3日目。会社の同僚に、<br>唐揚げを配って回る。', sKubaru],
  ['でも、届いたのは<br>料理だけじゃなかった。', sDake],
  ['料理と一緒に届いたのは、<br>店の人が仕込んだ半日の時間。', sShikomi],
  ['2軒かけもちで予約していた<br>客の家には、2軒分届く。', sNiken],
  ['次の飲み会。幹事が、<br>前の日に自分から店に電話する。', sDenwa],
  ['行けなくなった客から、<br>すぐに連絡が来るようになる。', sRenraku],
  ['結果：ドタキャンの料理が<br>家に届くようになって、', (t, d) => sKekka(t, 3 * d)],
  ['消えたのは無断キャンセルと、', (t, d) => sKekka(t + d, 3 * d)],
  ['捨てられるはずだった<br>料理だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['予約は、店にとっては、<br>もう作り始めた', (t, d) => sYakusoku(t, 2 * d)],
  ['料理との約束<br>だったのかもしれない。', (t, d) => sYakusoku(t + d, 2 * d)],
  ['予約のドタキャン、<br>したことある？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0696',
    v2: true,
    tt: 'main',
    hookLine: '玄関を開けると、20人分の宴会料理の大皿がドドンと届く。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもドタキャンした宴会料理が、全部家に届いたら？',
    titleHtml: 'もしも<br>ドタキャンした<br>宴会料理が、<br>全部家に届いたら？',
    mood: 'tension', seed: 696, hits: [TP, P.at(9, 1.0), P.at(12)], risers: [P.at(7)], impacts: [P.at(8, 0.8), P.at(15, 0.4)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.3], [P.at(4, 0.6), 'poof'], [P.at(5, 0.8), 'bubble'], [P.at(11, 0.3), 'alarm'], [P.at(11, 1.6), 'alarm']],
    narr: NARR,
    ask: '予約のドタキャン、したことある？',
    caption: 'もしもドタキャンした宴会料理が、全部家に届いたら？\n\n飲み会を流して家でくつろいでいた幹事が、大皿の山の前で固まる。\n店の人たちの不満から。連絡もなく来ない予約で、料理が全部ムダになる。\n1日目。刺身の舟盛りが、ワンルームの床を埋める。\n2日目。冷蔵庫に、唐揚げが入りきらない。\n3日目。会社の同僚に、唐揚げを配って回る。\nでも、届いたのは料理だけじゃなかった。\n料理と一緒に届いたのは、店の人が仕込んだ半日の時間。\n2軒かけもちで予約していた客の家には、2軒分届く。\n次の飲み会。幹事が、前の日に自分から店に電話する。\n行けなくなった客から、すぐに連絡が来るようになる。\n\n結果：ドタキャンの料理が家に届くようになって、消えたのは無断キャンセルと、捨てられるはずだった料理だった。\n予約は、店にとっては、もう作り始めた料理との約束だったのかもしれない。\n\n予約のドタキャン、したことある？ コメントで教えて。\n\n※風刺ネタです。料理が家に届くのは、もしもの設定です。登場する人物・店は架空です',
    hashtags: ['もしもラボ', 'もしも', 'ドタキャン', '忘年会', '飲食店'],
    endStats: [['届いたのは', '20人分の宴会料理', 'もしもの設定'], ['消えたのは', '無断キャンセル', 'もしもの結果'], ['予約の正体', '料理との約束', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
