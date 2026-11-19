import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, label, pop } from '../satire-kit.js';
import { makeSweat } from '../scenes/office.js';
import { addKnees, fitReset, planTimes } from '../scenes/fitness.js';
import { makeSet, makePipeChair } from '../scenes/home.js';

// もしも毎朝ラジオ体操を1か月続けたら？（人体の限界・台本 S103）
// 2026/11/18 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/17 の解析の種（0389 ストレッチの急上昇・0671 湯船×0654 片足立ち）
// 数字（一次資料で確認・2026/11/19。PMC11405370 本文）：Osuka Y ほか J Epidemiol 2024;34(10):467-476
//  Effects of Radio-Taiso on HRQoL in Older Adults With Frailty: RCT。日本・虚弱／虚弱の手前の高齢者 220人をくじで2組（年齢の中央値78歳）
//  12週間、毎日家でラジオ体操（第一・第二・第三で約11分）＋栄養プログラム。対照は栄養プログラムだけ
//  2分間足踏み 対照より3.2回多い・8フィートアップ＆ゴー 0.3秒速い（どちらも有意）。SF-36（気分＝精神面・体の調子＝身体面）は差なし
//  台本の 平均78歳 は本文が中央値なので 78歳前後 に、結果の 毎朝の3分で は研究が約11分なので 毎朝の体操で に直した（数字の正確さのため）
//  無理しない・転ばないの注意を札で出す。放送局のロゴ・曲・番組の見た目は使わない（第一 の文字と動きだけ）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#f4e2c8', ground: '#b8a48a' }); hemi.intensity = 1.3;
const ME = addKnees(makeMan({ shirt: '#e8e4dc', pants: '#5a6a8a', hair: '#2c2421' })); S.add(ME); // 寝間着の会社員
const NEGUSE = [[0.12, 0.6, 0.05, 0.4], [-0.1, 0.58, -0.05, -0.5], [0.0, 0.62, 0.12, 0.2]].map(([x, y, z, r]) => { const b = box(0.07, 0.16, 0.07, mat('#2c2421')); b.position.set(x, y, z); b.rotation.z = r; ME.userData.head.add(b); return b; });
const sweat = makeSweat(); ME.userData.head.add(sweat);
const MOUTH = box(0.12, 0.06, 0.02, mat('#3a1a1a')); MOUTH.position.set(0, 0.12, 0.2); ME.userData.head.add(MOUTH);
// 鏡の中の自分（同じ人形を左右反転させて鏡の奥に置く）
const MIR = addKnees(makeMan({ shirt: '#e8e4dc', pants: '#5a6a8a', hair: '#2c2421' })); S.add(MIR);
[[0.12, 0.6, 0.05, 0.4], [-0.1, 0.58, -0.05, -0.5], [0.0, 0.62, 0.12, 0.2]].forEach(([x, y, z, r]) => { const b = box(0.07, 0.16, 0.07, mat('#2c2421')); b.position.set(x, y, z); b.rotation.z = r; MIR.userData.head.add(b); });

// ---------- A：朝の寝室（原点）。布団と姿見 ----------
const roomA = room({ x: 0, w: 9, d: 7, h: 3.2, wall: '#f2ead8', floor: '#c9a87a' });
const TATAMI = flat(4, 3, '#cdbf8a', 0, -1.2, -0.8, 0.02);
const FUTON = box(1.3, 0.16, 2.2, mat('#f6f4ee')); FUTON.position.set(-1.6, 0.08, -1.0); S.add(FUTON);
const KAKE = box(1.32, 0.12, 1.2, mat('#7aa0d0')); KAKE.position.set(-1.6, 0.2, -0.6); KAKE.rotation.z = 0.05; S.add(KAKE);
const PILLOW = box(0.7, 0.14, 0.4, mat('#ffffff')); PILLOW.position.set(-1.6, 0.22, -1.8); S.add(PILLOW);
const WIN = box(1.6, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#fff4d8' })); WIN.position.set(-3.4, 1.9, -3.42); S.add(WIN);
const MIRROR = new THREE.Group(); { const fr = box(1.2, 2.1, 0.08, mat('#8a6a48')); fr.position.y = 1.15; MIRROR.add(fr); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), new THREE.MeshBasicMaterial({ color: '#d8ecf4', transparent: true, opacity: 0.35, depthWrite: false })); gl.position.set(0, 1.15, 0.05); gl.renderOrder = 3; MIRROR.add(gl); } MIRROR.position.set(0.4, 0, -3.36); S.add(MIRROR);
const MIRBACK = box(1.0, 1.9, 0.02, mat('#c8dce4')); MIRBACK.position.set(0.4, 1.15, -3.3); S.add(MIRBACK);
const DAI1 = label('第一', { w: 512, size: 150, color: '#fff', bg: 'rgba(230,120,30,.98)', sx: 0.6 }); S.add(DAI1);
const glow = new THREE.PointLight(0xffb060, 0, 5, 1.6); S.add(glow);
const sparkA = makeSparkles(80, 0.05, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0, 2.3, 0]], 0.5, 0.5);
const katte = label('体が 勝手に', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.95 }); S.add(katte);
const toshiyori = label('年寄りの体操でしょ', { w: 1000, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.35 }); S.add(toshiyori);
const zee = label('ゼェ…ゼェ…', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(zee);
const gokiS = label('ゴキッ', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.6 }); S.add(gokiS);
const naranai = label('鳴らない', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.7 }); S.add(naranai);

// ---------- B：スタンプカード（x=60） ----------
const BX = 60;
flat(30, 20, '#e8dcc4', BX, -2);
const BACKB = box(14, 7, 0.2, mat('#f2e4c8')); BACKB.position.set(BX, 3.5, -4); S.add(BACKB);
const cardC = document.createElement('canvas'); cardC.width = 1024; cardC.height = 720; const cardT = new THREE.CanvasTexture(cardC); cardT.colorSpace = THREE.SRGBColorSpace; let cardKey = -1;
function drawCard(n) {
  if (n === cardKey) return; cardKey = n; const g = cardC.getContext('2d');
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 1024, 720); g.fillStyle = '#e8781e'; g.fillRect(0, 0, 1024, 130);
  g.fillStyle = '#fff'; g.font = '900 76px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('体操カード', 512, 68);
  for (let i = 0; i < 30; i++) { const cx = 92 + (i % 10) * 93, cy = 210 + Math.floor(i / 10) * 170; g.strokeStyle = '#c8b898'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 38, 0, 7); g.stroke(); g.fillStyle = '#9a8a6a'; g.font = '700 30px "Noto Sans CJK JP", sans-serif'; g.fillText(String(i + 1), cx, cy + 62); if (i < n) { g.fillStyle = '#d8342c'; g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 36px "Noto Sans CJK JP", sans-serif'; g.fillText('済', cx, cy + 2); } }
  cardT.needsUpdate = true;
}
const CARD = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.25), new THREE.MeshBasicMaterial({ map: cardT })); CARD.position.set(BX, 2.0, -1); S.add(CARD);
const CARDF = box(3.32, 2.37, 0.04, mat('#c8a878')); CARDF.position.set(BX, 2.0, -1.03); S.add(CARDF);
const zenbu = label('30個 ぜんぶ', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(zenbu);
const sparkB = makeSparkles(80, 0.07, 0xfff2c0); S.add(sparkB.points); sparkB.init([[BX, 2.0, -0.8]], 1.2, 0.6);

// ---------- C：研究の高齢者（x=120） ----------
const CX = 120;
flat(30, 20, '#3a3448', CX, -2);
const BACKC = box(18, 8, 0.2, mat('#2c2838')); BACKC.position.set(CX, 4, -9); S.add(BACKC);
const ELD = []; { const r = rng(103); for (let i = 0; i < 24; i++) { const p = addKnees(makePerson({ skin: ['#f1c9a5', '#eac3a0', '#e0b08a'][i % 3], hair: ['#c8c8c8', '#9a9a9a', '#e8e8e8'][i % 3], shirt: ['#b86a6a', '#6a8ab8', '#8ab86a', '#c8a85a', '#9a7ab8', '#e8e4dc'][i % 6], pants: '#3a3f4e', bald: i % 5 === 2, scale: 0.9 })); p.userData.ph = r() * 6.28; S.add(p); ELD.push(p); } }
const SEAT = makePipeChair('#5a6a8a'); S.add(SEAT);
const CONE = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 12), mat('#f08a30')); S.add(CONE);
const BARC = [['体操しない組', '#9aa0aa'], ['体操した組', '#f08a30']].map(([n, c]) => { const b = box(0.8, 1, 0.5, mat(c)); S.add(b); const l = label(n, { w: 700, size: 84, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.85 }); S.add(l); return { b, l }; });
const muri = label('無理しない・転ばない', { w: 1000, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.45 }); S.add(muri);
const kibun = label('気分・体の調子', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.25 }); S.add(kibun);

// ---------- 結果・ひねり ----------
const ashi = label('足は 速くなった', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(ashi);
const karui = label('軽くなった気が…？', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.25 }); S.add(karui);
const chokin = label('毎朝3分の 貯金', { w: 900, size: 100, color: '#fff', bg: 'rgba(230,120,30,.98)', sx: 1.2 }); S.add(chokin);
const PIG = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), mat('#f4a0b4')); b.scale.set(1.2, 1, 1); PIG.add(b); const sn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), mat('#e88aa0')); sn.rotation.z = Math.PI / 2; sn.position.x = 0.38; PIG.add(sn); for (const [x, z] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]]) { const l = box(0.08, 0.16, 0.08, mat('#e88aa0')); l.position.set(x, -0.3, z); PIG.add(l); } const sl = box(0.18, 0.02, 0.04, mat('#3a1a1a')); sl.position.y = 0.32; PIG.add(sl); } S.add(PIG);
const COINS = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), mat('#e8c040')); c.rotation.x = Math.PI / 2; S.add(c); COINS.push(c); }

const LABELS = [DAI1, katte, toshiyori, zee, gokiS, naranai, zenbu, muri, kibun, ashi, karui, chokin, ...BARC.map(x => x.l)];
function reset() {
  [ME, MIR, ...ELD].forEach(p => { fitReset(p); p.visible = false; p.position.set(0, -50, 0); });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); MOUTH.scale.set(1, 1, 1); glow.intensity = 0; sparkA.set(0); sparkB.set(0);
  SEAT.visible = false; CONE.visible = false; BARC.forEach(x => x.b.visible = false); PIG.visible = false; COINS.forEach(c => c.visible = false); NEGUSE.forEach(b => b.visible = true);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
// ラジオ体操の動き（腕を横から上へ・ひざを軽く曲げる）。k=0..1 で動きの大きさ、ph で位相
function taiso(p, t, k = 1, sp = 5, ph = 0) {
  const u = (Math.sin(t * sp + ph) + 1) / 2; const U = p.userData;
  U.arms[0].rotation.set(0, 0, -u * 2.9 * k); U.arms[1].rotation.set(0, 0, u * 2.9 * k);
  const b = (1 - u) * 0.35 * k; U.legs.forEach(l => l.rotation.x = -b); U.knees.forEach(n => n.rotation.x = b * 2); p.position.y = (U.y0 || 0) - b * 0.12;
}
function meAt(x, z, ry = 0) { ME.visible = true; ME.position.set(x, 0, z); ME.rotation.y = ry; }
function mirrorOn(t, k, sp, still) { MIR.visible = true; MIR.position.set(0.4, 0.3, -3.22); MIR.rotation.y = -0.25; MIR.scale.set(-0.82, 0.82, 0.12); if (still) { MIR.userData.arms[0].rotation.set(0, 0, -2.5); MIR.userData.arms[1].rotation.set(0, 0, 2.5); } else taiso(MIR, t, k, sp); }
const TP = 0.3;
function bedCam(u = 0) { look(lerp(0.3, 0.1, u), 1.75, lerp(4.7, 4.3, u), -0.25, 1.62, -1.0, 50); }
function shot0(t) { // 0秒＝サムネ：朝の布団の上で、会社員の頭の上に 第一 の文字がパッと光り、体が勝手に腕を振り上げる
  reset(); lift(0); meAt(-0.35, -0.9, 0.15);
  const on = t > TP; if (on) { const kk = clamp((t - TP) / 0.3); if (t < 1.4) { ME.userData.arms[0].rotation.set(0, 0, -2.9 * kk); ME.userData.arms[1].rotation.set(0, 0, 2.9 * kk); } else taiso(ME, t - 1.4 + Math.PI / 12, 1, 6); glow.intensity = 3; glow.position.set(-0.35, 2.6, -0.4); sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; MOUTH.scale.set(1, 2.2, 1); }
  DAI1.visible = true; DAI1.position.set(0.5, 2.1, -0.9); DAI1.userData.size(on ? 0.62 : 0.45);
  if (t > TP + 0.4) say(katte, t, TP + 0.4, -0.3, 0.75, -0.4, 0.85);
  bedCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function mirCam() { look(-1.7, 1.8, 2.6, 0.0, 1.3, -2.9, 50); }
function sKagami(t, d) { // 寝ぐせのまま腕を回している会社員が、鏡に映る自分を見て固まる
  reset(); lift(150); meAt(-0.75, -1.5, Math.PI + 0.35); const still = t > d * 0.55;
  if (still) { ME.userData.arms[0].rotation.set(0, 0, -2.5); ME.userData.arms[1].rotation.set(0, 0, 2.5); sweat.userData.set(1, t); } else taiso(ME, t, 1, 6);
  mirrorOn(t, 1, 6, still);
  mirCam();
  return S;
}
function sToshiyori(t, d) { // 本人の言い分から。ラジオ体操なんて、年寄りの体操でしょ
  reset(); lift(150); meAt(-0.6, -0.9, 0.3); ME.userData.arms[1].rotation.set(-1.4, 0, 0.3); ME.userData.head.rotation.x = -0.1;
  if (t > d * 0.35) say(toshiyori, t, d * 0.35, -0.5, 2.45, -0.9, 1.2);
  bedCam(0.6);
  return S;
}
function sZee(t, d) { // 1日目。たった3分の体操で、もう息が上がる
  reset(); lift(150); meAt(-0.6, -0.9, 0.3); taiso(ME, t, lerp(1, 0.45, clamp(t / d)), 6); sweat.userData.set(clamp(t / 1.5), t); MOUTH.scale.set(1, 2.4, 1);
  ME.rotation.x = 0.15 * clamp(t / d);
  if (t > d * 0.45) say(zee, t, d * 0.45, -0.5, 2.45, -0.9, 0.95);
  setHud('ラジオ体操 第一', '1日目', 1);
  bedCam(0.6);
  return S;
}
function sGoki(t, d) { // 1週間後。腕を回すたびに鳴っていた肩の音が、鳴らなくなる
  reset(); lift(150); meAt(-0.6, -0.9, 0.3); const u = (t * 1.6) % 1; ME.userData.arms[1].rotation.set(-u * Math.PI * 2, 0, 0.15); ME.userData.arms[0].rotation.set(-((u + 0.5) % 1) * Math.PI * 2, 0, -0.15);
  if (t < d * 0.45) say(gokiS, t, 0.2, -0.05, 2.35, -0.9, 0.55); else say(naranai, t, d * 0.45, -0.05, 2.35, -0.9, 0.65);
  setHud('ラジオ体操 第一', '1週間後', 1);
  look(0.4, 1.8, 3.4, -0.6, 1.5, -0.9, 50);
  return S;
}
function cardCam(u = 0) { look(BX, 2.0, lerp(6.6, 6.0, u), BX, 2.0, -1, 50); }
function sCard(t, d) { // 1か月後。夏休み以来のスタンプカードが、30個ぜんぶ埋まる
  reset(); lift(230); drawCard(Math.floor(clamp((t - 0.2) / (d * 0.7)) * 30)); sparkB.set(clamp((t - d * 0.75) / 1.0));
  if (t > d * 0.75) say(zenbu, t, d * 0.75, BX + 0.9, 3.25, -0.8, 0.85);
  setHud('ラジオ体操 第一', '1か月後', 1);
  cardCam(ease(clamp(t / d)));
  return S;
}
function sHontou(t, d) { // でも、本当に体は変わるのか
  reset(); lift(150); meAt(-0.6, -0.9, 0.3); taiso(ME, t, 1, 4); NEGUSE.forEach(b => b.visible = false);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.9, u), lerp(1.7, 2.6, u), lerp(4.5, 6.6, u), -0.6, 1.3, -0.9, 50);
  return S;
}
function eldPlace() { ELD.forEach((p, i) => { p.visible = true; p.position.set(CX - 3.3 + (i % 6) * 1.3, 0, -1.2 - Math.floor(i / 6) * 1.4); p.rotation.y = 0; }); }
function crowdCam(u = 0) { look(CX + lerp(0.4, 0.0, u), lerp(4.6, 4.2, u), lerp(10.2, 9.2, u), CX, 1.0, -3.0, 50); }
function sStudy(t, d) { // 78歳前後の220人で、12週間、毎日ラジオ体操をしてもらった研究がある
  reset(); lift(200); eldPlace(); ELD.forEach((p, i) => taiso(p, t, clamp((t - 0.4 - (i % 6) * 0.05) / 0.4), 4, p.userData.ph * 0.2));
  setTop('ラジオ体操の研究（日本・2024年）', Math.round(220 * easeOut(clamp((t - 0.3) / 1.2))) + '人', fade(t, 0.3, d, 0.25), BLUE); setHud('毎日 家で 第一〜第三（約11分）', '12週間', 1);
  if (t > d * 0.55) say(muri, t, d * 0.55, CX, 2.9, -0.6, 2.4);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function barCam() { look(CX + 0.1, 1.5, 6.4, CX, 0.95, 0.6, 50); }
function bars(h1, h2, name) { [h1, h2].forEach((h, i) => { const x = BARC[i]; x.b.visible = true; x.b.scale.y = Math.max(0.01, h); x.b.position.set(CX - 0.6 + i * 1.2, h / 2, 0.6); x.l.visible = true; x.l.position.set(CX - 0.6 + i * 1.2, h + 0.3, 0.7); x.l.userData.size(0.62); }); }
function sAshibumi(t, d) { // 2分間の足踏みは、体操しなかった人より約3回多くできた
  reset(); lift(200); const k = easeOut(clamp((t - 0.3) / 1.2)); bars(1.3, lerp(1.3, 1.3 * 1.06, k));
  ELD[0].visible = true; ELD[0].position.set(CX + 1.9, 0, 0.4); ELD[0].rotation.y = -0.4; const s = Math.sin(t * 8); ELD[0].userData.legs[0].rotation.x = -Math.max(0, s) * 0.9; ELD[0].userData.legs[1].rotation.x = -Math.max(0, -s) * 0.9; ELD[0].userData.knees.forEach((n, i) => n.rotation.x = Math.max(0, i ? -s : s) * 1.2);
  setTop('2分間の足踏み（対照との差・2024年）', '+' + (3.2 * k).toFixed(1) + '回', fade(t, 0.3, d, 0.25), GREEN); setHud('Osuka ほか', 'J Epidemiol 2024年', 1);
  barCam();
  return S;
}
function sChair(t, d) { // 椅子から立って歩いて戻るのも、0.3秒速くなった
  reset(); lift(200); SEAT.visible = true; SEAT.position.set(CX - 1.4, 0, 0.6); SEAT.rotation.y = Math.PI / 2; CONE.visible = true; CONE.position.set(CX + 1.6, 0.22, 0.6);
  const p = ELD[1]; p.visible = true; const u = (t * 0.45) % 1; const go = u < 0.5 ? u * 2 : 2 - u * 2; p.position.set(lerp(CX - 1.1, CX + 1.2, ease(go)), 0, 0.6); p.rotation.y = u < 0.5 ? Math.PI / 2 : -Math.PI / 2; const s = Math.sin(t * 9) * 0.5; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s;
  setTop('立って歩いて戻る（対照との差・2024年）', '−' + (0.3 * easeOut(clamp((t - 0.3) / 1.0))).toFixed(1) + '秒', fade(t, 0.3, d, 0.25), GREEN); setHud('Osuka ほか', 'J Epidemiol 2024年', 1);
  look(CX, 1.9, 6.2, CX, 0.9, 0.6, 50);
  return S;
}
function sKibun(t, d) { // でも、気分や体の調子の感じ方は、ほとんど変わらなかった
  reset(); lift(200); bars(1.2, 1.2); BARC[0].l.userData.set('体操しない組'); kibun.visible = true; kibun.position.set(CX, 2.15, 0.6); kibun.userData.size(1.05);
  setTop('気分・体の調子の感じ方（2024年）', '差なし', fade(t, 0.3, d, 0.25), GOLD); setHud('Osuka ほか', 'J Epidemiol 2024年', 1);
  barCam();
  return S;
}
function sKekka(t, d) { // 結果：毎朝の体操で、足は数字で分かるほど速くなった。体が軽くなった気がするのは、数字には出なかった
  reset(); lift(150); meAt(-0.6, -0.9, 0.3); NEGUSE.forEach(b => b.visible = false); taiso(ME, t, 1, 4);
  if (t < d * 0.55) { if (t > d * 0.15) say(ashi, t, d * 0.15, -0.5, 2.45, -0.9, 1.0); } else say(karui, t, d * 0.55, -0.5, 2.45, -0.9, 1.05);
  setTop('結果', t < d * 0.55 ? '足は 速くなった' : '気分は 変わらず', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.7, u), lerp(1.7, 1.9, u), lerp(4.6, 5.4, u), -0.6, 1.3, -0.9, 50);
  return S;
}
function sChokin(t, d) { // ラジオ体操は、年寄りの体操じゃなく、年寄りになるまで続ける、毎朝3分の貯金だったのかもしれない
  reset(); lift(150); meAt(-1.0, -0.9, 0.35); NEGUSE.forEach(b => b.visible = false); taiso(ME, t, 1, 4);
  PIG.visible = true; PIG.position.set(0.5, 0.75, -0.6); PIG.rotation.y = -0.6; const n = Math.min(6, Math.floor(t / (d / 7)));
  COINS.forEach((c, i) => { c.visible = i <= n; const f = clamp((t - i * d / 7) / 0.5); c.position.set(0.5, lerp(1.9, 1.1, f), -0.6); if (f >= 1) c.visible = false; });
  if (t > d * 0.5) say(chokin, t, d * 0.5, 0.0, 2.45, -0.9, 1.05);
  look(0.0, 1.7, 3.9, -0.2, 1.25, -0.8, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); meAt(-0.35, -0.9, 0.15); taiso(ME, t + 1.2, 1, 6); glow.intensity = 3; glow.position.set(-0.35, 2.6, -0.4); NEGUSE.forEach(b => b.visible = false); DAI1.visible = true; DAI1.position.set(0.5, 2.1, -0.9); DAI1.userData.size(0.62); bedCam(0); return S; }

const NARR = { '寝ぐせ': 'ねぐせ', '腕': 'うで', '回している': 'まわしている', '会社員': 'かいしゃいん', '鏡': 'かがみ', '映る': 'うつる', '自分': 'じぶん', '見て': 'みて', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '体操': 'たいそう', '年寄り': 'としより', '1日目': 'いちにちめ', '3分': 'さんぷん', '息': 'いき', '上がる': 'あがる', '1週間後': 'いっしゅうかんご', '鳴っていた': 'なっていた', '肩': 'かた', '音': 'おと', '鳴らなくなる': 'ならなくなる', '1か月後': 'いっかげつご', '夏休み': 'なつやすみ', '以来': 'いらい', '30個': 'さんじゅっこ', '埋まる': 'うまる', '本当に': 'ほんとうに', '体': 'からだ', '変わる': 'かわる', '78歳前後': 'ななじゅうはっさいぜんご', '220人': 'にひゃくにじゅうにん', '12週間': 'じゅうにしゅうかん', '毎日': 'まいにち', '研究': 'けんきゅう', '2分間': 'にふんかん', '足踏み': 'あしぶみ', '約3回': 'やくさんかい', '多く': 'おおく', '椅子': 'いす', '立って': 'たって', '歩いて': 'あるいて', '戻る': 'もどる', '0.3秒': 'れいてんさんびょう', '速く': 'はやく', '気分': 'きぶん', '調子': 'ちょうし', '感じ方': 'かんじかた', '変わらなかった': 'かわらなかった', '結果：': '結果、', '毎朝': 'まいあさ', '足': 'あし', '数字': 'すうじ', '分かる': 'わかる', '軽く': 'かるく', '気': 'き', '出なかった': 'でなかった', '続ける': 'つづける', '貯金': 'ちょきん', '第二': 'だいに', '踊れる': 'おどれる' };
const P = planTimes([
  ['寝ぐせのまま腕を回している<br>会社員が、', (t, d) => sKagami(t, 2 * d)],
  ['鏡に映る自分を見て固まる。', (t, d) => sKagami(t + d, 2 * d)],
  ['本人の言い分から。ラジオ体操<br>なんて、年寄りの体操でしょ。', sToshiyori],
  ['1日目。たった3分の体操で、<br>もう息が上がる。', sZee],
  ['1週間後。腕を回すたびに<br>鳴っていた肩の音が、', (t, d) => sGoki(t, 2 * d)],
  ['鳴らなくなる。', (t, d) => sGoki(t + d, 2 * d)],
  ['1か月後。夏休み以来の<br>スタンプカードが、', (t, d) => sCard(t, 2 * d)],
  ['30個ぜんぶ埋まる。', (t, d) => sCard(t + d, 2 * d)],
  ['でも、本当に体は変わるのか。', sHontou],
  ['78歳前後の220人で、<br>12週間、毎日ラジオ体操を', (t, d) => sStudy(t, 2 * d)],
  ['してもらった研究がある。', (t, d) => sStudy(t + d, 2 * d)],
  ['2分間の足踏みは、<br>体操しなかった人より', (t, d) => sAshibumi(t, 2 * d)],
  ['約3回多くできた。', (t, d) => sAshibumi(t + d, 2 * d)],
  ['椅子から立って歩いて<br>戻るのも、0.3秒速くなった。', sChair],
  ['でも、気分や体の<br>調子の感じ方は、', (t, d) => sKibun(t, 2 * d)],
  ['ほとんど変わらなかった。', (t, d) => sKibun(t + d, 2 * d)],
  ['結果：毎朝の体操で、足は<br>数字で分かるほど速くなった。', (t, d) => sKekka(t, 2 * d)],
  ['体が軽くなった気がするのは、<br>数字には出なかった。', (t, d) => sKekka(t + d, 2 * d)],
  ['ラジオ体操は、年寄りの<br>体操じゃなく、', (t, d) => sChokin(t, 3 * d)],
  ['年寄りになるまで続ける、<br>毎朝3分の貯金', (t, d) => sChokin(t + d, 3 * d)],
  ['だったのかもしれない。', (t, d) => sChokin(t + 2 * d, 3 * d)],
  ['ラジオ体操、<br>第二まで踊れる？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0699',
    v2: true,
    tt: 'main',
    hookLine: '朝の布団の上で、会社員の頭の上に 第一 の文字がパッと光り、体が勝手に腕を振り上げる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎朝ラジオ体操を1か月続けたら？',
    titleHtml: 'もしも毎朝<br>ラジオ体操を<br>1か月続けたら？',
    mood: 'hopeful', seed: 699, hits: [TP, P.at(16), P.at(20)], risers: [P.at(8)], impacts: [P.at(9, 0.6), P.at(12, 0.3), P.at(13, 0.6), P.at(15, 0.3)],
    sfx: [[TP, 'whoosh'], [P.at(3, 0.8), 'meter', 0.3], [P.at(4, 0.4), 'poof'], [P.at(7, 0.3), 'bubble'], [P.at(19, 0.4), 'bubble']],
    narr: NARR,
    ask: 'ラジオ体操、第二まで踊れる？',
    caption: 'もしも毎朝ラジオ体操を1か月続けたら？\n\n寝ぐせのまま腕を回している会社員が、鏡に映る自分を見て固まる。\n本人の言い分から。ラジオ体操なんて、年寄りの体操でしょ。\n1日目。たった3分の体操で、もう息が上がる。\n1週間後。腕を回すたびに鳴っていた肩の音が、鳴らなくなる。\n1か月後。夏休み以来のスタンプカードが、30個ぜんぶ埋まる。\nでも、本当に体は変わるのか。\n78歳前後の220人で、12週間、毎日ラジオ体操をしてもらった研究がある。\n2分間の足踏みは、体操しなかった人より約3回多くできた。\n椅子から立って歩いて戻るのも、0.3秒速くなった。\nでも、気分や体の調子の感じ方は、ほとんど変わらなかった。\n\n結果：毎朝の体操で、足は数字で分かるほど速くなった。体が軽くなった気がするのは、数字には出なかった。\nラジオ体操は、年寄りの体操じゃなく、年寄りになるまで続ける、毎朝3分の貯金だったのかもしれない。\n\n※研究は虚弱やその手前の高齢者が対象で、毎日 第一〜第三（約11分）＋栄養の指導。会社員でも同じになるとは限りません。無理せず、転ばないように。\n\nラジオ体操、第二まで踊れる？ コメントで教えて。\n\n出典：Osuka ほか Journal of Epidemiology（2024年）日本の高齢者220人のランダム化比較試験（2分間足踏み +3.2回、立って歩いて戻る −0.3秒、生活の質の感じ方は差なし）',
    hashtags: ['もしもラボ', 'もしも', 'ラジオ体操', '朝活', '人体の限界'],
    endStats: [['ラジオ体操の研究', '220人・12週間', '日本・2024年'], ['2分間の足踏み', '+3.2回', '対照との差'], ['気分・体の調子の感じ方', '差なし', '同じ研究']],
    sources: '出典：Osuka ほか Journal of Epidemiology（2024年）',
  },
});
