import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeShelf, makeTable } from '../scenes/home.js';
import { makeYokocho, makeRamen, setYokochoEnv } from '../scenes/yokocho.js';

// もしも飲み会の締めのラーメンを、1か月やめたら？（台本 S115・人体の限界）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。締めのラーメンを後輩に付き合わせるおじさんが困る回
// 数字（2026/11/21 一次資料で確認）：20歳以上の男性の食塩摂取量の平均 10.7g/日（厚生労働省 令和5年国民健康・栄養調査 結果の概要）、
//   食塩相当量の目標量 成人男性 7.5g未満（日本人の食事摂取基準 2025年版。農林水産省 みんなの食育 のページで確認）。
//   ラーメン1杯の塩分は一次資料で確かめられないので使わない（差が縮まる は向きだけ）。回数・10分は筋の中の数。店は架空

const GOLD = '#ffd27a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#1c2338', ground: '#3a3a40' });
setYokochoEnv(S, hemi, 'night'); hemi.intensity = 1.15;
const OJI = makeOji(rng(115), { shirt: '#5a6278', bald: true }); S.add(OJI);
const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const blush = [-1, 1].map(s => { const m = box(0.07, 0.04, 0.01, new THREE.MeshBasicMaterial({ color: '#ff7a7a' })); m.position.set(s * 0.12, 0.02, 0.2); OJI.userData.head.add(m); return m; });
const KOH = makeMan({ shirt: '#6a8ab0', hair: '#2a2220' }); S.add(KOH);

// ---------- A：夜の横丁（原点）。真ん中が らーめん の店 ----------
const YK = makeYokocho(S, { x: 0, z: 0, n: 5, words: ['やきとり', '酒', 'らーめん', 'おでん', '酒場'] });
const RAMEN_SHOP = YK.userData.shops[2];
const sparkA = makeSparkles(110, 0.07, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0, 2.0, -0.9]], 0.7, 0.4);
const suu = label('スッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(suu);
const kieta = label('締めのラーメン 消えた', { w: 1100, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(kieta);
const shime = label('締めまでが 飲み会', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(shime);
const nemui = label('もう0時…', { w: 640, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.85 }); S.add(nemui);
const ato = label('ラーメン屋の 跡', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.15 }); S.add(ato);
const BOWL = makeRamen(); S.add(BOWL);
// ---------- E：ラーメン屋の中（x=240）。回想とひねり ----------
const EX = 240;
room({ x: EX, w: 8, d: 6, h: 3.0, wall: '#d8c8a8', floor: '#6a5040' });
const inL = new THREE.PointLight(0xffe0b0, 14, 12, 1.2); inL.position.set(EX, 2.8, 1.5); S.add(inL);
const CNT = makeTable({ w: 3.0, d: 0.6, h: 1.0, color: '#b08a63' }); CNT.position.set(EX, 0, -1.2); S.add(CNT); // カウンター
const KITCH = box(3.2, 1.0, 0.8, mat('#9a9a9e')); KITCH.position.set(EX, 0.5, -2.4); S.add(KITCH);
const MENU = label('らーめん', { w: 640, size: 110, color: '#fff', bg: 'rgba(160,40,40,.96)', sx: 1.1 }); MENU.position.set(EX - 1.6, 2.4, -2.9);

// ---------- B：コンビニの棚（x=60） ----------
const BX = 60;
const { } = {};
room({ x: BX, w: 8, d: 6, h: 3.2, wall: '#eef0f2', floor: '#c8ccd2' });
const shopL = new THREE.PointLight(0xffffff, 10, 12, 1.2); shopL.position.set(BX, 2.9, 1); S.add(shopL);
const SHELF = new THREE.Group(); S.add(SHELF); SHELF.position.set(BX, 0, -2.4);
{ const frame = box(3.2, 2.0, 0.08, mat('#c8ccd4')); frame.position.set(0, 1.0, -0.28); SHELF.add(frame);
  const cols = ['#e85a5a', '#f2c14e', '#5a9ae8', '#e8e2d6', '#6ac46a'];
  for (let r = 0; r < 3; r++) { const sh = box(3.2, 0.04, 0.62, mat('#b8bcc4')); sh.position.set(0, 0.45 + r * 0.55, 0.02); SHELF.add(sh);
    for (let c = 0; c < 9; c++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.26, 12), mat('#f4f2ec')); cup.position.set(-1.4 + c * 0.35, 0.6 + r * 0.55, 0.15); SHELF.add(cup); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.02, 12), mat(cols[(c + r) % 5])); lid.position.set(-1.4 + c * 0.35, 0.74 + r * 0.55, 0.15); SHELF.add(lid); } } }
const juppun = label('10分', { w: 384, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.5 }); S.add(juppun);

// ---------- C：駅の改札（x=120） ----------
const CX = 120;
flat(30, 14, '#8a8680', CX, 0);
const EKI = box(9, 4.2, 3, mat('#c8c2b6')); EKI.position.set(CX, 2.1, -4.5); S.add(EKI);
const ekiSign = label('もしも台駅', { w: 768, size: 110, color: '#fff', bg: 'rgba(40,60,110,.97)', sx: 1.4 }); ekiSign.position.set(CX, 3.4, -2.9); S.add(ekiSign);
for (let i = 0; i < 4; i++) { const g = box(0.2, 1.0, 1.2, mat('#7a8090')); g.position.set(CX - 1.5 + i * 1.0, 0.5, -2.6); S.add(g); }
const ekiL = new THREE.PointLight(0xfff0d0, 14, 14, 1.2); ekiL.position.set(CX, 3.5, 1); S.add(ekiL);
const mata = label('また明日！', { w: 640, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.9 }); S.add(mata);
const shuden = label('終電で 帰れた夜', { w: 900, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(shuden);
const CAL = new THREE.Group(); S.add(CAL);
{ const c = document.createElement('canvas'); c.width = 512; c.height = 400; const g = c.getContext('2d'); g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 512, 400); g.fillStyle = '#c8242c'; g.fillRect(0, 0, 512, 70); g.fillStyle = '#fff'; g.font = '900 46px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('終電で帰れた夜', 256, 50);
  for (let i = 0; i < 28; i++) { const x = 40 + (i % 7) * 66, y = 110 + Math.floor(i / 7) * 70; g.strokeStyle = '#c8c2b6'; g.lineWidth = 2; g.strokeRect(x - 26, y - 26, 56, 56); if ([3, 6, 10, 13, 17, 20, 24, 27].includes(i)) { g.strokeStyle = '#3a9a5a'; g.lineWidth = 9; g.beginPath(); g.arc(x + 2, y + 2, 20, 0, 7); g.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshBasicMaterial({ map: t })); CAL.add(m); }

// ---------- D：数字のスタジオ（x=180） ----------
const DX = 180;
room({ x: DX, w: 10, d: 6, h: 4, wall: '#2a3048', floor: '#3a4058' });
const stL = new THREE.PointLight(0xffffff, 14, 14, 1.2); stL.position.set(DX, 3.5, 2); S.add(stL);
function makeSaltBar(color) { const g = new THREE.Group(); const b = box(1.1, 1, 1.1, mat(color)); b.geometry.translate(0, 0.5, 0); g.add(b); const cap = box(1.14, 0.06, 1.14, mat('#ffffff')); g.add(cap); g.userData.set = (h) => { b.scale.y = Math.max(0.001, h); cap.position.y = h; }; S.add(g); return g; }
const BAR1 = makeSaltBar('#e8e4dc'); BAR1.position.set(DX - 0.8, 0, -1.2);
const BAR2 = makeSaltBar('#7fc8ff'); BAR2.position.set(DX + 0.8, 0, -1.2);
const SALT = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.45, 16), mat('#ffffff')); S.add(SALT);
const lab1 = label('いま 10.7g', { w: 640, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.85 }); S.add(lab1);
const lab2 = label('目標 7.5g未満', { w: 768, size: 96, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(lab2);
const LINE = box(3.0, 0.04, 0.04, new THREE.MeshBasicMaterial({ color: '#ff5a4a' })); S.add(LINE);
const sa = label('その差が 縮まる', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.2 }); S.add(sa);
const hatena = label('本当に 体は変わる？', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.4 }); S.add(hatena);

// ---------- 結果・ひねり ----------
const kimochi = label('終わらせたくない 気持ち', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.55 }); S.add(kimochi);

const LABELS = [suu, kieta, shime, nemui, ato, juppun, mata, shuden, lab1, lab2, sa, hatena, kimochi];
function reset() {
  [OJI, KOH].forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0);
  YK.userData.shops.forEach(s => { s.userData.setNoren(1); s.userData.light(1); });
  BOWL.visible = false; CAL.visible = false; SALT.visible = false; LINE.visible = false;
  BAR1.userData.set(0); BAR2.userData.set(0);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function walk(p, t, sp = 6) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * 0.45; p.userData.legs[1].rotation.x = -s * 0.45; p.userData.arms[0].rotation.x = -s * 0.3; p.userData.arms[1].rotation.x = s * 0.3; }
const TP = 0.35;
function ojiReach(sway = 0) { stand(OJI, -0.75, 0.6, Math.PI * 0.78 + sway); OJI.userData.arms[1].rotation.set(-1.55, 0, 0.15); OJI.userData.head.rotation.z = 0.08; OJI.rotation.z = sway * 0.2; }
function yCam(u = 0) { look(lerp(0.9, 0.7, u), 1.8, lerp(6.8, 6.2, u), -0.1, 1.85, -0.8, 50); }
function shot0(t) { // 0秒＝サムネ：深夜のラーメン屋の暖簾が、目の前でスッと消える
  reset(); lift(0); ojiReach(Math.sin(t * 2) * 0.05);
  const on = t > TP; const k = clamp((t - TP) / 0.3);
  RAMEN_SHOP.userData.setNoren(1 - k); RAMEN_SHOP.userData.light(1 - k * 0.85);
  if (on) { sparkA.set(clamp((t - TP) / 0.8)); say(suu, t, TP, 0.9, 2.3, -0.4, 0.5); }
  if (t > TP + 0.3) say(kieta, t, TP + 0.3, -0.1, 0.75, 0.8, 1.3);
  yCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // ほろ酔いのおじさんが、暖簾に手を伸ばしたまま固まる
  reset(); lift(150); ojiReach(0); OJI.rotation.y = 0.55; OJI.userData.arms[1].rotation.set(-1.7, 0, 0.5); RAMEN_SHOP.userData.setNoren(0); RAMEN_SHOP.userData.light(0.15); if (t > d * 0.3) sweatO.userData.set(1, t);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), 1.8, lerp(3.6, 3.2, u), -0.5, 1.6, 0.0, 50);
  return S;
}
function sFuman(t, d) { // 付き合わされてきた後輩の不満から。締めのラーメンまでが飲み会、と夜中の2軒目（2秒の回想）
  reset(); lift(150);
  stand(OJI, EX - 0.5, -0.6, Math.PI); stand(KOH, EX + 0.5, -0.6, Math.PI); OJI.rotation.y = Math.PI + 0.2; KOH.userData.head.rotation.x = 0.35; KOH.userData.arms[0].rotation.set(-0.2, 0, 0);
  OJI.rotation.y = 0.25; KOH.rotation.y = -0.1; BOWL.visible = true; BOWL.position.set(EX + 0.5, 1.03, -1.15); BOWL.scale.setScalar(1.3);
  if (t > d * 0.25) say(shime, t, d * 0.25, EX - 0.1, 2.3, -0.6, 1.0);
  if (t > d * 0.65) say(nemui, t, d * 0.65, EX + 0.7, 2.05, -0.5, 0.75);
  look(EX + 0.3, 1.8, 3.2, EX, 1.3, -0.9, 50); // 回想：夜中の2軒目
  return S;
}
function s1(t, d) { // 1回目の飲み会。駅までの道で、おじさんの足がラーメン屋の跡で止まる
  reset(); lift(150); RAMEN_SHOP.userData.setNoren(0); RAMEN_SHOP.userData.light(0.15);
  const k = clamp(t / (d * 0.5)); stand(OJI, lerp(-3.0, 0.1, ease(k)), 1.0, Math.PI / 2 - (k >= 1 ? Math.PI / 2 + 0.15 : 0)); if (k < 1) walk(OJI, t); else { OJI.userData.head.rotation.x = -0.1; }
  stand(KOH, lerp(-3.8, -0.9, ease(k)), 1.3, Math.PI / 2); if (k < 1) walk(KOH, t + 1);
  if (t > d * 0.55) say(ato, t, d * 0.55, 0.0, 2.65, -0.3, 1.0);
  setHud('締めをやめて', '1回目', 1);
  look(0.8, 1.9, 6.2, -0.2, 1.5, -0.5, 50);
  return S;
}
function s2(t, d) { // 2回目。コンビニのカップ麺の棚の前で、10分立ち尽くす
  reset(); lift(150); stand(OJI, BX + 0.2, -1.2, Math.PI); OJI.userData.head.rotation.x = 0.15; OJI.userData.arms[1].rotation.set(-0.9 * clamp(t / d * 2), 0, 0.1);
  if (t > d * 0.45) say(juppun, t, d * 0.45, BX + 0.6, 2.05, -1.2, 0.45);
  setHud('締めをやめて', '2回目', 1);
  const u = ease(clamp(t / d)); look(BX + lerp(2.2, 1.9, u), 1.9, lerp(1.6, 1.3, u), BX - 0.3, 1.25, -2.0, 52);
  return S;
}
function s3(t, d) { // 3回目。後輩と、駅の改札で手を振って別れる
  reset(); lift(150); stand(OJI, CX + 0.2, 0.6, Math.PI * 0.9); OJI.userData.arms[1].rotation.set(-2.8, 0, -0.2 + Math.sin(t * 8) * 0.25);
  stand(KOH, CX - 0.9, -1.4 - Math.min(t * 0.2, 0.5), 0.15); KOH.userData.arms[1].rotation.set(-2.8, 0, -0.2 + Math.sin(t * 8 + 1) * 0.25);
  if (t > d * 0.3) say(mata, t, d * 0.3, CX - 0.9, 2.35, -1.4, 0.8);
  setHud('締めをやめて', '3回目', 1);
  look(CX + 0.9, 1.9, 5.8, CX - 0.2, 1.3, -0.6, 50);
  return S;
}
function studio() { stand(OJI, DX - 1.8, 0.2, 0.55); OJI.userData.head.rotation.y = 0.3; }
const H1 = 10.7 / 4.5, H2 = 7.5 / 4.5; // 棒の高さ（1g＝約0.22）
function sDemo(t, d) { // でも、本当に体は変わるのか
  reset(); lift(150); studio(); OJI.userData.arms[1].rotation.set(-0.4, 0, -0.6); OJI.userData.head.rotation.z = 0.25;
  OJI.position.x = DX - 0.6;
  if (t > d * 0.3) say(hatena, t, d * 0.3, DX - 0.5, 2.4, 0.2, 1.1);
  look(DX - 0.2, 2.0, 5.4, DX - 0.6, 1.4, -1.0, 50);
  return S;
}
function sNum(i, t, d) { // 数字：男性の食塩 1日平均 10.7g → 目標 7.5g未満 → その差が縮まる
  reset(); lift(150);
  const k1 = i === 0 ? easeOut(clamp((t - 0.3) / 1.4)) : 1; BAR1.userData.set(H1 * k1);
  const k2 = i === 1 ? easeOut(clamp((t - 0.3) / 1.2)) : i > 1 ? 1 : 0; BAR2.userData.set(H2 * k2);
  if (i === 2) { const k3 = ease(clamp((t - d * 0.3) / (d * 0.5))); BAR1.userData.set(H1 - (H1 - H2) * 0.35 * k3); }
  if (k1 > 0.98) say(lab1, t, i === 0 ? 1.7 : 0, DX - 0.8, H1 + 0.45, -0.6, 0.75);
  if (k2 > 0.98) say(lab2, t, i === 1 ? 1.5 : 0, DX + 0.8, H2 + 0.45, -0.6, 0.9);
  if (i >= 1) { LINE.visible = k2 > 0.98; LINE.position.set(DX, H2, -0.6); }
  if (i === 2 && t > d * 0.4) say(sa, t, d * 0.4, DX, 3.15, -0.6, 1.1);
  if (i === 0) setTop('男性の食塩 1日平均（2023年）', `${(10.7 * k1).toFixed(1)}g`, fade(t, 0.2, d, 0.2), GOLD);
  if (i === 1) setTop('国の目標量（成人男性・2025年版）', `${(7.5 * k2).toFixed(1)}g未満`, fade(t, 0.2, d, 0.2), BLUE);
  look(DX, 2.0, 6.4, DX, 1.75, -1.0, 50);
  return S;
}
function sShuden(t, d) { // 1か月後。後輩が、初めて終電で帰れた夜を数える
  reset(); lift(150); stand(KOH, CX - 0.3, 0.3, 0.2); KOH.userData.arms[1].rotation.set(-1.3, 0, 0.1); KOH.userData.head.rotation.x = 0.2;
  CAL.visible = true; CAL.position.set(CX + 0.55, 1.55, 0.6); CAL.rotation.y = -0.25;
  if (t > d * 0.5) say(shuden, t, d * 0.5, CX + 0.2, 2.55, 0.3, 1.0);
  setHud('締めをやめて', '1か月後', 1);
  const u = ease(clamp(t / d)); look(CX + lerp(0.8, 0.6, u), 1.8, lerp(3.6, 3.2, u), CX + 0.15, 1.5, 0.2, 50);
  return S;
}
function sKekka(t, d) { // 結果：締めのラーメンをやめて、減ったのは夜中の塩と、後輩が終電を逃す夜だった
  reset(); lift(150); RAMEN_SHOP.userData.setNoren(0); RAMEN_SHOP.userData.light(0.15);
  stand(OJI, 0.5 - t * 0.12, 1.4, -Math.PI / 2); walk(OJI, t, 5); stand(KOH, -0.3 - t * 0.12, 1.2, -Math.PI / 2); walk(KOH, t + 1, 5);
  setTop('結果', '夜中の塩と 終電を逃す夜が 減った', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(1.0, 0.4, u), 1.9, lerp(6.0, 6.6, u), lerp(0.2, -0.2, u), 1.5, -0.5, 50);
  return S;
}
function sKimochi(t, d) { // 締めのラーメンは、おじさんの胃じゃなく、飲み会を終わらせたくない気持ちが食べていたのかもしれない
  reset(); lift(150); stand(OJI, EX, -0.6, 0); OJI.userData.head.rotation.x = 0.35;
  BOWL.visible = true; BOWL.position.set(EX, 1.03, -1.15); BOWL.scale.setScalar(1.3);
  if (t > d * 0.35) say(kimochi, t, d * 0.35, EX, 2.1, -0.6, 1.2);
  const u = ease(clamp(t / d)); look(EX + lerp(0.6, 0.4, u), 1.85, lerp(3.0, 2.5, u), EX, 1.35, -0.9, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); ojiReach(0); RAMEN_SHOP.userData.setNoren(0); RAMEN_SHOP.userData.light(0.15); yCam(0); return S; }

const NARR = { 'ほろ酔い': 'ほろよい', '暖簾': 'のれん', '手を伸ばした': 'てをのばした', '固まる': 'かたまる', '付き合わされて': 'つきあわされて', '後輩': 'こうはい', '不満': 'ふまん', '締め': 'しめ', '飲み会': 'のみかい', '夜中': 'よなか', '2軒目': 'にけんめ', '1回目': 'いっかいめ', '駅': 'えき', '道': 'みち', '足': 'あし', '跡': 'あと', '止まる': 'とまる', '2回目': 'にかいめ', 'カップ麺': 'カップめん', '棚': 'たな', '前': 'まえ', '10分': 'じゅっぷん', '立ち尽くす': 'たちつくす', '3回目': 'さんかいめ', '改札': 'かいさつ', '手を振って': 'てをふって', '別れる': 'わかれる', '本当に': 'ほんとうに', '体': 'からだ', '変わる': 'かわる', '日本': 'にほん', '男性': 'だんせい', '1日': 'いちにち', '塩': 'しお', '平均': 'へいきん', '10.7グラム': 'じゅってんななグラム', '国': 'くに', '決めた': 'きめた', '目標': 'もくひょう', '7.5グラム': 'ななてんごグラム', '未満': 'みまん', '1杯': 'いっぱい', '夜の分': 'よるのぶん', '差': 'さ', '縮まる': 'ちぢまる', '1か月後': 'いっかげつご', '初めて': 'はじめて', '終電': 'しゅうでん', '帰れた': 'かえれた', '数える': 'かぞえる', '結果：': '結果、', '減った': 'へった', '逃す': 'のがす', '胃': 'い', '終わらせたくない': 'おわらせたくない', '気持ち': 'きもち', '食べていた': 'たべていた', '我慢': 'がまん' };
const P = planTimes([
  ['ほろ酔いのおじさんが、', (t, d) => sKatamaru(t, 2 * d)],
  ['暖簾に手を伸ばしたまま<br>固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['付き合わされてきた<br>後輩の不満から。', (t, d) => sFuman(t, 2 * d)],
  ['締めのラーメンまでが飲み会、<br>と夜中の2軒目。', (t, d) => sFuman(t + d, 2 * d)],
  ['1回目の飲み会。駅までの道で、', (t, d) => s1(t, 2 * d)],
  ['おじさんの足が<br>ラーメン屋の跡で止まる。', (t, d) => s1(t + d, 2 * d)],
  ['2回目。コンビニのカップ麺の<br>棚の前で、10分立ち尽くす。', s2],
  ['3回目。後輩と、駅の改札で<br>手を振って別れる。', s3],
  ['でも、本当に体は変わるのか。', sDemo],
  ['日本の男性が1日にとっている<br>塩は、平均10.7グラム。', (t, d) => sNum(0, t, d)],
  ['国が決めた目標は、<br>7.5グラム未満。', (t, d) => sNum(1, t, d)],
  ['締めの1杯をやめた夜の分だけ、<br>その差が縮まる。', (t, d) => sNum(2, t, d)],
  ['1か月後。後輩が、初めて<br>終電で帰れた夜を数える。', sShuden],
  ['結果：締めのラーメンをやめて、', (t, d) => sKekka(t, 3 * d)],
  ['減ったのは夜中の塩と、', (t, d) => sKekka(t + d, 3 * d)],
  ['後輩が終電を逃す夜だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['締めのラーメンは、おじさんの<br>胃じゃなく、', (t, d) => sKimochi(t, 3 * d)],
  ['飲み会を終わらせたくない<br>気持ちが', (t, d) => sKimochi(t + d, 3 * d)],
  ['食べていたのかもしれない。', (t, d) => sKimochi(t + 2 * d, 3 * d)],
  ['飲んだあとのラーメン、<br>我慢できる？', sAsk],
], { shot0, endCard, start: 3.1, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0712',
    v2: true,
    tt: 'main',
    hookLine: '深夜のラーメン屋の暖簾が、目の前でスッと消える。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも飲み会の締めのラーメンを、1か月やめたら？',
    titleHtml: 'もしも飲み会の<br>締めのラーメンを、<br>1か月やめたら？',
    mood: 'hopeful', seed: 712, hits: [TP, P.at(13), P.at(16)], risers: [P.at(8)], impacts: [P.at(9, 1.7), P.at(10, 1.5)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.3), 'whoosh'], [P.at(6, 0.9), 'alarm'], [P.at(7, 0.3), 'whoosh'], [P.at(12, 0.4), 'bubble']],
    narr: NARR,
    ask: '飲んだあとのラーメン、我慢できる？',
    caption: 'もしも飲み会の締めのラーメンを、1か月やめたら？\n\nほろ酔いのおじさんが、暖簾に手を伸ばしたまま固まる。\n付き合わされてきた後輩の不満から。締めのラーメンまでが飲み会、と夜中の2軒目。\n1回目の飲み会。駅までの道で、おじさんの足がラーメン屋の跡で止まる。\n2回目。コンビニのカップ麺の棚の前で、10分立ち尽くす。\n3回目。後輩と、駅の改札で手を振って別れる。\nでも、本当に体は変わるのか。\n日本の男性が1日にとっている塩は、平均10.7グラム。国が決めた目標は、7.5グラム未満。\n締めの1杯をやめた夜の分だけ、その差が縮まる。\n1か月後。後輩が、初めて終電で帰れた夜を数える。\n\n結果：締めのラーメンをやめて、減ったのは夜中の塩と、後輩が終電を逃す夜だった。\n締めのラーメンは、おじさんの胃じゃなく、飲み会を終わらせたくない気持ちが食べていたのかもしれない。\n\n飲んだあとのラーメン、我慢できる？ コメントで教えて。\n\n出典：厚生労働省 令和5年国民健康・栄養調査 結果の概要（20歳以上の男性の食塩摂取量の平均）、日本人の食事摂取基準（2025年版）の食塩相当量の目標量\n※お店・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '締めのラーメン', '塩分', '人体の限界'],
    endStats: [['男性の食塩 1日平均', '10.7g', '2023年 国民健康・栄養調査'], ['国の目標量（成人男性）', '7.5g未満', '日本人の食事摂取基準 2025年版'], ['締めのラーメンの正体', '終わらせたくない気持ち', 'かもしれない']],
    sources: '厚生労働省 令和5年国民健康・栄養調査／日本人の食事摂取基準（2025年版）',
  },
});
