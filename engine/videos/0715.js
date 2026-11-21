import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, makeSweat, poseSit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeCounter, makeTub, makeBed, makeBench } from '../scenes/home.js';

// もしもイクメンの投稿に、妻の24時間も並んだら？（皮肉回・台本 S122・図星／男と女のもしも）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。週末の公園1時間の写真で いいパパ と言われる自称イクメン夫が、自分の投稿の横に並ぶ妻の24時間で固まる回。後半で いいパパ！ とコメントした上司にも返す
// 数字は使わない（家事・育児時間の調査は出さない。時刻・10枚・10分の1は筋の中の数）。SNSの画面は架空（実在のロゴ・配色なし）。子どもは笑われる側にしない

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8e0f0', ground: '#8aa070' }); hemi.intensity = 1.3;
const PAPA = makeMan({ shirt: '#e8b04a', hair: '#2a2220', pants: '#3a4a6a' }); S.add(PAPA);
const sweatP = makeSweat(); PAPA.userData.head.add(sweatP);
const PPH = box(0.09, 0.17, 0.02, mat('#15161c')); PPH.position.set(0, -0.66, 0.08); PAPA.userData.arms[1].add(PPH);
const TSUMA = makeWoman({ shirt: '#c8a0c8', hair: '#3a2620' }); S.add(TSUMA);
const TSUMA2 = makeWoman({ shirt: '#9ac8b0', hair: '#5a3a28' }); S.add(TSUMA2);
const KID = makeMan({ shirt: '#f27a5a', hair: '#3a2a1e', scale: 0.52 }); S.add(KID);
const BABY = new THREE.Group(); { const b = box(0.3, 0.22, 0.45, mat('#f4e8d8')); BABY.add(b); const h = box(0.16, 0.16, 0.16, mat('#f5d3b5')); h.position.set(0, 0.06, -0.24); BABY.add(h); } S.add(BABY);
const BOTTLE = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 10), mat('#f4f8ff')); BOTTLE.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.05, 8), mat('#f2c890')); n.position.y = 0.1; BOTTLE.add(n); } S.add(BOTTLE);
const BASKET = box(0.5, 0.28, 0.36, mat('#d8b878')); S.add(BASKET);
const BOSS = makeSuit({ old: true, bald: true, jacket: '#3a4256', tie: '#3a6ab2' }); S.add(BOSS); const sweatB = makeSweat(); BOSS.userData.head.add(sweatB);

// 大きなスマホ（架空のSNS）：左にパパの投稿、右に妻の24時間
const BIG = makePhone({ w: 1.55, h: 2.4, cw: 620, ch: 960 }); S.add(BIG.g);
const F = (px, w = 900) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
const WIFE_ROWS = [['6:00', '起きる'], ['6:10', 'ミルク'], ['7:00', '洗濯'], ['12:00', '離乳食'], ['13:00', '寝かしつけ'], ['14:00', '洗い物'], ['16:00', '買い物'], ['19:00', 'お風呂'], ['20:00', '寝かしつけ'], ['2:00', '夜泣き']];
function scr({ side = false, likes = 128, who = 'パパ', pic = 'park', rows = 10, comment = true } = {}) {
  BIG.draw(JSON.stringify(arguments[0] || {}), (g, w, h) => {
    g.fillStyle = '#f4f5f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a6a8a'; g.fillRect(0, 0, w, 80); g.fillStyle = '#fff'; g.font = F(40); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('もしもSNS（架空）', w / 2, 42);
    const cw = side ? w / 2 - 12 : w - 24; const x0 = 12;
    g.fillStyle = '#fff'; rr(g, x0, 96, cw, side ? 600 : 720, 16);
    g.fillStyle = '#2a2e38'; g.font = F(side ? 28 : 36); g.textAlign = 'left'; g.fillText(who === 'パパ' ? 'イクメンパパ' : '部長', x0 + 20, 130);
    // 写真（公園：空・芝生・すべり台・笑う子ども）
    const px = x0 + 16, py = 160, pw = cw - 32, ph = side ? 300 : 400;
    if (pic === 'park') { g.fillStyle = '#9ad0f0'; g.fillRect(px, py, pw, ph); g.fillStyle = '#7ac060'; g.fillRect(px, py + ph * 0.65, pw, ph * 0.35); g.fillStyle = '#f2c14e'; g.fillRect(px + pw * 0.62, py + ph * 0.3, pw * 0.06, ph * 0.4); g.save(); g.translate(px + pw * 0.65, py + ph * 0.3); g.rotate(0.7); g.fillStyle = '#e85a5a'; g.fillRect(0, 0, pw * 0.08, ph * 0.5); g.restore(); g.fillStyle = '#f5d3b5'; g.beginPath(); g.arc(px + pw * 0.3, py + ph * 0.45, ph * 0.1, 0, 7); g.fill(); g.beginPath(); g.arc(px + pw * 0.45, py + ph * 0.58, ph * 0.07, 0, 7); g.fill(); g.fillStyle = '#e8b04a'; g.fillRect(px + pw * 0.24, py + ph * 0.55, pw * 0.12, ph * 0.25); g.fillStyle = '#f27a5a'; g.fillRect(px + pw * 0.41, py + ph * 0.65, pw * 0.08, ph * 0.15); }
    else if (pic === 'golf') { g.fillStyle = '#9ad0f0'; g.fillRect(px, py, pw, ph); g.fillStyle = '#5ab04a'; g.fillRect(px, py + ph * 0.55, pw, ph * 0.45); g.fillStyle = '#fff'; g.beginPath(); g.arc(px + pw * 0.6, py + ph * 0.7, ph * 0.04, 0, 7); g.fill(); g.fillStyle = '#e85a5a'; g.fillRect(px + pw * 0.75, py + ph * 0.35, pw * 0.02, ph * 0.3); g.fillRect(px + pw * 0.77, py + ph * 0.35, pw * 0.08, ph * 0.08); }
    else { g.fillStyle = '#e8e4dc'; g.fillRect(px, py, pw, ph); g.fillStyle = '#9aa0aa'; g.font = F(side ? 30 : 40, 700); g.textAlign = 'center'; g.fillText('写真なし', px + pw / 2, py + ph / 2); }
    g.textAlign = 'left'; g.fillStyle = '#e85a7a'; g.font = F(side ? 40 : 52); g.fillText('♥ ' + likes, x0 + 20, py + ph + 50);
    if (comment) { g.fillStyle = '#2a2e38'; g.font = F(side ? 26 : 34, 700); g.fillText(who === 'パパ' ? '部長：いいパパ！' : '部下：さすがです！', x0 + 20, py + ph + 110); }
    if (side) {
      const sx = w / 2 + 6, sw = w / 2 - 18; g.fillStyle = '#fff4f4'; rr(g, sx, 96, sw, 850, 16); g.fillStyle = '#c8242c'; rr(g, sx, 96, sw, 64, 16); g.fillStyle = '#fff'; g.font = F(32); g.textAlign = 'center'; g.fillText('妻の24時間', sx + sw / 2, 130);
      g.textAlign = 'left'; WIFE_ROWS.slice(0, rows).forEach(([tm, s], i) => { const y = 200 + i * 74; g.fillStyle = '#c8242c'; g.font = F(26); g.fillText(tm, sx + 12, y); g.fillStyle = '#2a2e38'; g.font = F(30); g.fillText(s, sx + 100, y); });
    }
  });
}
const pa = label('パッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(pa);
const narabu = label('妻の24時間も 並んだ', { w: 1000, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(narabu);
const sparkA = makeSparkles(90, 0.05, 0xffffff); S.add(sparkA.points); sparkA.init([[0.4, 1.6, 0.2]], 0.5, 0.7);

// ---------- A：夜の居間（原点） ----------
room({ x: 0, w: 9, d: 6, h: 3.0, wall: '#e8e0d4', floor: '#a88a68' });
const SOFA = new THREE.Group(); { const b = box(2.2, 0.45, 0.9, mat('#6a8a7a')); b.position.y = 0.22; SOFA.add(b); const bk = box(2.2, 0.6, 0.2, mat('#5a7a6a')); bk.position.set(0, 0.7, -0.4); SOFA.add(bk); } SOFA.position.set(-0.4, 0, -1.6); S.add(SOFA);
const ippatsu = label('1時間で いいパパ', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.2 }); S.add(ippatsu);

// ---------- B：台所（x=60）：妻の朝と昼 ----------
const BX = 60;
room({ x: BX, w: 9, d: 6, h: 3.0, wall: '#f0ebe0', floor: '#c8b494' });
const KC = makeCounter({ w: 3.6 }); KC.position.set(BX - 0.6, 0, -2.5); S.add(KC);
const HIGHCHAIR = new THREE.Group(); { const s = box(0.45, 0.06, 0.45, mat('#f2f2ee')); s.position.y = 0.7; HIGHCHAIR.add(s); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.04, 0.7, 0.04, mat('#d8d8d4')); l.position.set(x * 0.2, 0.35, z * 0.2); HIGHCHAIR.add(l); } const tr = box(0.5, 0.04, 0.3, mat('#f2f2ee')); tr.position.set(0, 0.95, 0.3); HIGHCHAIR.add(tr); } HIGHCHAIR.position.set(BX + 1.2, 0, -1.0); S.add(HIGHCHAIR);
const STAGE_L = ['起きて、ミルク、洗濯', '離乳食、寝かしつけ、洗い物', '公園で1時間、写真10枚'].map((s, i) => { const l = label(s, { w: 1100, size: 88, color: '#fff', bg: i < 2 ? 'rgba(214,30,40,.97)' : 'rgba(58,127,208,.97)', sx: 1.35 }); S.add(l); return l; });

// ---------- C：公園（x=120） ----------
const CX = 120;
flat(30, 18, '#7ab060', CX, 0);
const SLIDE = new THREE.Group(); { const st = box(0.8, 1.4, 0.8, mat('#f2c14e')); st.position.y = 0.7; SLIDE.add(st); const sl = box(0.6, 0.06, 2.2, mat('#e85a5a')); sl.position.set(0, 0.75, 1.3); sl.rotation.x = 0.55; SLIDE.add(sl); } SLIDE.position.set(CX + 1.4, 0, -2.0); S.add(SLIDE);
for (let i = 0; i < 6; i++) { const tr = new THREE.Group(); const t = box(0.25, 1.4, 0.25, mat('#7a5a3a')); t.position.y = 0.7; tr.add(t); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), mat('#4a9a4a', { flatShading: true })); c.position.y = 1.9; tr.add(c); tr.position.set(CX - 6 + i * 2.4, 0, -5.5); S.add(tr); }
const BENCH = makeBench(); BENCH.position.set(CX - 1.6, 0, -1.4); S.add(BENCH);
const kasha = label('カシャ', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.6 }); S.add(kasha);

// ---------- D：上司の机（x=180） ----------
const DX = 180;
room({ x: DX, w: 9, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const DESK = box(1.6, 0.74, 0.8, mat('#8a6a4c')); DESK.position.set(DX, 0.37, -1.4); S.add(DESK);
const demo = label('並んだのは パパだけじゃない', { w: 1300, size: 84, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.75 }); S.add(demo);
const jousi = label('上司の投稿にも', { w: 900, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(jousi);

// ---------- E：お風呂と寝室（x=240） ----------
const EX = 240;
room({ x: EX, w: 10, d: 6, h: 3.0, wall: '#dde8ee', floor: '#b8c4cc' });
const TUB = makeTub(); TUB.position.set(EX - 1.6, 0, -1.6); S.add(TUB); TUB.userData.setWater && TUB.userData.setWater(0.8);
const BED = makeBed({ blanket: '#c8a0c8' }); BED.position.set(EX + 1.8, 0, -1.4); S.add(BED);
const ofuro = label('お風呂と 寝かしつけ', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); S.add(ofuro);
const torikaesu = label('昼寝の分を 取り返す', { w: 1000, size: 92, color: '#fff', bg: 'rgba(120,90,200,.96)', sx: 1.3 }); S.add(torikaesu);
const zzz = label('Zzz', { w: 384, size: 110, color: '#5a4a9a', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(zzz);
const iine = label('いいね 10分の1', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.2 }); S.add(iine);

// ---------- 結果・ひねり ----------
const satsuei = label('育児の 撮影会', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.2 }); S.add(satsuei);

const LABELS = [pa, narabu, ippatsu, ...STAGE_L, kasha, demo, jousi, ofuro, torikaesu, zzz, iine, satsuei];
const PEOPLE = [PAPA, TSUMA, TSUMA2, KID, BOSS];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatP.userData.set(0); sweatB.userData.set(0);
  BIG.g.visible = false; BIG.g.scale.setScalar(1); BIG.g.rotation.set(0, 0, 0); BABY.visible = false; BOTTLE.visible = false; BASKET.visible = false; PPH.visible = true;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function holdBaby(p) { BABY.visible = true; p.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.1, 0.28); p.localToWorld(v); BABY.position.copy(v); BABY.rotation.set(0, p.rotation.y + Math.PI / 2, 0); p.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); }
const TP = 0.35;
function papaSofa() { PAPA.visible = true; PAPA.position.set(-0.4, 0.05, -1.45); PAPA.rotation.y = 0.15; poseSit(PAPA); PAPA.position.y += 0.06; PAPA.userData.arms[1].rotation.set(-1.25, 0, 0.15); PAPA.userData.head.rotation.x = 0.3; }
function bigAt(x, y, z, s, ry = -0.1) { BIG.g.visible = true; BIG.g.position.set(x, y, z); BIG.g.scale.setScalar(s); BIG.g.rotation.y = ry; }
function sofaCam(u = 0) { look(lerp(0.1, 0.0, u), 1.85, lerp(4.6, 4.2, u), 0.05, 1.5, -1.0, 50); }
function shot0(t) { // 0秒＝サムネ：公園で子どもと笑うパパの投稿の横に、同じ日の妻の24時間がパッと並ぶ
  reset(); lift(0); papaSofa(); const on = t > TP;
  scr({ side: on, likes: 128 }); bigAt(0.55, 1.15, 0.6, 0.58);
  if (on) { sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(pa, t, TP, -0.2, 1.75, 0.6, 0.34); }
  if (t > TP + 0.4) say(narabu, t, TP + 0.4, 0.5, 0.3, 0.7, 0.95);
  sofaCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // いいね が増えるのを見ていたパパが、スマホを持ったまま固まる
  reset(); lift(150); papaSofa(); const k = clamp(t / (d * 0.45)); scr({ side: k >= 1, likes: 128 + Math.round(k * 60) });
  bigAt(0.45, 1.5, -0.3, 0.42, -0.2); if (k >= 1) sweatP.userData.set(1, t); PAPA.userData.arms[1].rotation.set(-1.45, 0, 0.1); PAPA.userData.head.rotation.x = 0.15;
  const u = ease(clamp(t / d)); look(lerp(0.5, 0.35, u), 1.6, lerp(2.5, 2.1, u), -0.05, 1.35, -1.0, 50);
  return S;
}
function sFuman(t, d) { // 妻たちの不満から。1時間遊んだだけで、いいパパ と言われる
  reset(); lift(150); stand(TSUMA, -0.6, -1.0, 0.3); holdBaby(TSUMA); stand(TSUMA2, 0.7, -1.1, -0.3); TSUMA2.userData.arms[0].rotation.set(-0.5, 0, 0.4); TSUMA2.userData.head.rotation.x = 0.15;
  if (t > d * 0.55) say(ippatsu, t, d * 0.55, 0.05, 2.35, -1.0, 1.1);
  look(0.1, 1.75, 3.8, 0.05, 1.4, -1.0, 50);
  return S;
}
function sStage(i, t, d) { // 朝6時・昼12時（妻）、夕方4時（パパ）
  reset(); lift(150); PPH.visible = i === 2;
  if (i === 0) { stand(TSUMA, BX - 0.4, -1.4, 0.2); TSUMA.userData.arms[1].rotation.set(-1.3, 0, 0.1); BOTTLE.visible = true; TSUMA.updateMatrixWorld(); const v = new THREE.Vector3(0.18, 1.2, 0.35); TSUMA.localToWorld(v); BOTTLE.position.copy(v); BASKET.visible = true; BASKET.position.set(BX + 0.5, 0.14, -1.0); TSUMA.rotation.z = Math.sin(t * 2) * 0.03; }
  if (i === 1) { stand(TSUMA, BX + 0.5, -0.8, -0.4); holdBaby(TSUMA); TSUMA.rotation.z = Math.sin(t * 2.4) * 0.05; }
  if (i === 2) { stand(PAPA, CX - 0.6, -0.4, 0.5); PAPA.userData.arms[1].rotation.set(-1.5, 0, 0.2); stand(KID, CX + 0.5, -0.9, -0.4); KID.userData.arms[1].rotation.set(-2.6, 0, -0.2); if (Math.floor(t * 2) % 2 === 0) say(kasha, t, Math.floor(t * 2) / 2, CX - 0.9, 1.95, -0.3, 0.45); }
  if (t > d * 0.3) say(STAGE_L[i], t, d * 0.3, i === 2 ? CX : BX, 2.2, i === 2 ? -0.6 : -1.2, 1.15);
  setHud(i < 2 ? '妻の列' : 'パパの列', ['朝6時', '昼12時', '夕方4時'][i], 1);
  const x = i === 2 ? CX : BX; look(x + 0.3, 1.8, 3.6, x, 1.35, -1.0, 50);
  return S;
}
function sDemo(t, d) { // でも、並んだのは、パパの投稿だけじゃなかった。いいパパ！ とコメントしていた上司の投稿にも、上司の妻の24時間が並ぶ
  reset(); lift(150); stand(BOSS, DX, -2.2, 0); poseSit(BOSS); BOSS.userData.arms[1].rotation.set(-1.2, 0, 0.1); BOSS.userData.head.rotation.x = 0.25;
  const ph = t / d; scr({ side: ph > 0.6, likes: 54, who: '部長', pic: 'golf' }); bigAt(DX + 0.75, 1.55, -0.8, 0.5, -0.25);
  if (ph > 0.6) sweatB.userData.set(1, t);
  if (ph > 0.15 && ph < 0.55) say(demo, t, d * 0.15, DX - 0.1, 2.5, -1.4, 1.5);
  if (ph > 0.62) say(jousi, t, d * 0.62, DX + 0.1, 2.35, -1.4, 1.0);
  look(DX + 0.3, 1.8, 2.9, DX + 0.25, 1.45, -1.2, 50);
  return S;
}
function sShumatsu(t, d) { // 次の週末。パパは写真を撮らずに、夜のお風呂と寝かしつけを引き受ける
  reset(); lift(150); PPH.visible = false; const half = t < d * 0.5;
  if (half) { stand(PAPA, EX - 1.6, -0.6, Math.PI); PAPA.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0)); stand(KID, EX - 1.6, -1.6, 0); KID.position.y = 0.15; }
  else { stand(PAPA, EX + 0.9, -1.2, Math.PI / 2); PAPA.userData.arms[1].rotation.set(-1.0, 0, 0); stand(KID, EX + 1.8, -1.2, 0); KID.rotation.set(-Math.PI / 2, 0, 0); KID.position.y = 0.74; }
  if (t > d * 0.25) say(ofuro, t, d * 0.25, half ? EX - 1.6 : EX + 1.3, 2.25, -1.2, 1.0);
  setHud('次の週末', half ? 'お風呂' : '寝かしつけ', 1);
  const x = half ? EX - 1.6 : EX + 1.4; look(x + 2.4, 2.1, 2.8, x, 1.15, -1.2, 50);
  return S;
}
function sIine(t, d) { // 投稿の いいね は、10分の1に減る
  reset(); lift(150); papaSofa(); PAPA.userData.head.rotation.x = 0.2; scr({ side: false, likes: 12, pic: 'none', comment: false }); bigAt(0.45, 1.5, -0.3, 0.42, -0.2);
  if (t > d * 0.45) say(iine, t, d * 0.45, 0.2, 2.45, -0.5, 1.0);
  look(0.45, 1.65, 2.4, 0.0, 1.45, -0.8, 50);
  return S;
}
function sNeru(t, d) { // その夜、妻は、初めて昼寝の分を取り返す
  reset(); lift(150); stand(TSUMA, EX + 1.8, -0.4, 0); TSUMA.rotation.set(-Math.PI / 2, 0, 0); TSUMA.position.y = 0.74;
  if (t > d * 0.2) say(zzz, t, d * 0.2, EX + 1.8, 1.35, -2.2, 0.4);
  if (t > d * 0.5) say(torikaesu, t, d * 0.5, EX + 1.8, 1.95, -1.4, 1.0);
  look(EX + 4.6, 2.2, 1.6, EX + 1.8, 1.05, -1.4, 50);
  return S;
}
function sKekka(t, d) { // 結果：妻の24時間が並んで、減ったのは いいね の数で、増えたのは妻が眠れる時間だった
  reset(); lift(150); stand(TSUMA, EX + 1.8, -0.4, 0); TSUMA.rotation.set(-Math.PI / 2, 0, 0); TSUMA.position.y = 0.74;
  stand(PAPA, EX + 0.3, -0.6, 0.6); holdBaby(PAPA); PPH.visible = false;
  setTop('結果', '眠れる時間が 増えた', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(EX + lerp(1.0, 1.3, u), 2.0, lerp(3.0, 3.6, u), EX + 1.0, 1.1, -1.2, 50);
  return S;
}
function sSatsuei(t, d) { // 自称イクメンの写真は、育児じゃなく、育児をしているところの撮影会だったのかもしれない
  reset(); lift(150); stand(PAPA, CX - 0.4, -0.4, 0.3); PAPA.userData.arms[1].rotation.set(-2.6, 0, -0.5); stand(KID, CX + 0.4, -0.5, -0.2);
  const flash = (t % 1.0) < 0.08 && t > d * 0.2; el.flash.style.opacity = flash ? 0.25 : 0;
  if (t > d * 0.45) say(satsuei, t, d * 0.45, CX, 2.45, -0.5, 1.15);
  look(CX + 0.2, 1.8, 3.4, CX, 1.35, -0.5, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); papaSofa(); scr({ side: true, likes: 128 }); bigAt(0.5, 1.2, 0.5, 0.62); sofaCam(0); return S; }

const NARR = { 'いいね': 'いいね', '増える': 'ふえる', '見ていた': 'みていた', '持った': 'もった', '固まる': 'かたまる', '妻たち': 'つまたち', '不満': 'ふまん', '1時間': 'いちじかん', '遊んだ': 'あそんだ', '言われる': 'いわれる', '朝6時': 'あさろくじ', '妻の列': 'つまのれつ', '起きて': 'おきて', '洗濯': 'せんたく', '昼12時': 'ひるじゅうにじ', '離乳食': 'りにゅうしょく', '寝かしつけ': 'ねかしつけ', '洗い物': 'あらいもの', '夕方4時': 'ゆうがたよじ', 'パパの列': 'パパのれつ', '公園': 'こうえん', '写真10枚': 'しゃしんじゅうまい', '並んだ': 'ならんだ', '投稿': 'とうこう', '上司': 'じょうし', '妻の24時間': 'つまのにじゅうよじかん', '並ぶ': 'ならぶ', '次の週末': 'つぎのしゅうまつ', '写真': 'しゃしん', '撮らずに': 'とらずに', '夜': 'よる', 'お風呂': 'おふろ', '引き受ける': 'ひきうける', '10分の1': 'じゅうぶんのいち', '減る': 'へる', '妻': 'つま', '初めて': 'はじめて', '昼寝': 'ひるね', '分': 'ぶん', '取り返す': 'とりかえす', '結果：': '結果、', '減った': 'へった', '数': 'かず', '増えた': 'ふえた', '眠れる': 'ねむれる', '時間': 'じかん', '自称': 'じしょう', '育児': 'いくじ', '撮影会': 'さつえいかい', '撮る派': 'とるは', '撮らない派': 'とらないは' };
const P = planTimes([
  ['いいね が増えるのを<br>見ていたパパが、', (t, d) => sKatamaru(t, 2 * d)],
  ['スマホを持ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['妻たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['1時間遊んだだけで、<br>いいパパ と言われる。', (t, d) => sFuman(t + d, 2 * d)],
  ['朝6時。妻の列：<br>起きて、ミルク、洗濯。', (t, d) => sStage(0, t, d)],
  ['昼12時。妻の列：<br>離乳食、寝かしつけ、洗い物。', (t, d) => sStage(1, t, d)],
  ['夕方4時。パパの列：<br>公園で1時間、写真10枚。', (t, d) => sStage(2, t, d)],
  ['でも、並んだのは、<br>パパの投稿だけじゃなかった。', (t, d) => sDemo(t, 3 * d)],
  ['いいパパ！ とコメントしていた<br>上司の投稿にも、', (t, d) => sDemo(t + d, 3 * d)],
  ['上司の妻の24時間が並ぶ。', (t, d) => sDemo(t + 2 * d, 3 * d)],
  ['次の週末。パパは<br>写真を撮らずに、', (t, d) => sShumatsu(t, 2 * d)],
  ['夜のお風呂と寝かしつけを<br>引き受ける。', (t, d) => sShumatsu(t + d, 2 * d)],
  ['投稿の いいね は、<br>10分の1に減る。', sIine],
  ['その夜、妻は、初めて<br>昼寝の分を取り返す。', sNeru],
  ['結果：妻の24時間が並んで、', (t, d) => sKekka(t, 3 * d)],
  ['減ったのは いいね の数で、', (t, d) => sKekka(t + d, 3 * d)],
  ['増えたのは<br>妻が眠れる時間だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['自称イクメンの写真は、<br>育児じゃなく、', (t, d) => sSatsuei(t, 2 * d)],
  ['育児をしているところの<br>撮影会だったのかもしれない。', (t, d) => sSatsuei(t + d, 2 * d)],
  ['パパの育児、写真に<br>撮る派？撮らない派？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0715',
    v2: true,
    tt: 'main',
    hookLine: '公園で子どもと笑うパパの投稿の横に、同じ日の妻の24時間がパッと並ぶ。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしもイクメンの投稿に、妻の24時間も並んだら？',
    titleHtml: 'もしもイクメンの<br>投稿に、妻の<br>24時間も並んだら？',
    mood: 'tension', seed: 715, hits: [TP, P.at(14), P.at(18)], risers: [P.at(7)], impacts: [P.at(9, 0.4), P.at(16, 0.4)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.3), 'whoosh'], [P.at(5, 0.3), 'whoosh'], [P.at(6, 0.3), 'whoosh'], [P.at(9, 0.3), 'alarm'], [P.at(12, 0.6), 'bubble']],
    narr: NARR,
    ask: 'パパの育児、写真に撮る派？撮らない派？',
    caption: 'もしもイクメンの投稿に、妻の24時間も並んだら？\n\nいいね が増えるのを見ていたパパが、スマホを持ったまま固まる。\n妻たちの不満から。1時間遊んだだけで、いいパパ と言われる。\n朝6時。妻の列：起きて、ミルク、洗濯。\n昼12時。妻の列：離乳食、寝かしつけ、洗い物。\n夕方4時。パパの列：公園で1時間、写真10枚。\nでも、並んだのは、パパの投稿だけじゃなかった。\nいいパパ！ とコメントしていた上司の投稿にも、上司の妻の24時間が並ぶ。\n次の週末。パパは写真を撮らずに、夜のお風呂と寝かしつけを引き受ける。\n投稿の いいね は、10分の1に減る。\nその夜、妻は、初めて昼寝の分を取り返す。\n\n結果：妻の24時間が並んで、減ったのは いいね の数で、増えたのは妻が眠れる時間だった。\n自称イクメンの写真は、育児じゃなく、育児をしているところの撮影会だったのかもしれない。\n\nパパの育児、写真に撮る派？撮らない派？ コメントで教えて。\n\n※風刺ネタです。投稿に妻の24時間が並ぶのは、もしもの設定です。SNSの画面・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'イクメン', '育児', '男と女のもしも'],
    endStats: [['並んだもの', '妻の24時間', 'もしもの設定'], ['増えたもの', '妻が眠れる時間', 'もしもの結果'], ['自称イクメンの写真', '育児の撮影会', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
