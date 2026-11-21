import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしも水を毎日2リットル、30日飲みきったら？（台本 S119・人体の限界・作り直し 0665）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。plan/remake.md の12：元の回は痛い目を見る人がいない 地味な続けたら系で、数字の説明も早かった
// → 0秒で 2リットルを抱えた課長がトイレの行列で止まる → 空いた席を見て固まる部下たち から入り、数字は20秒より後
// 数字（2026/11/21 一次資料で確認）：
//  ・水の出入り：ふつうに生活して失う水 2.5L（尿・便1.6L＋呼吸や汗0.9L）、食事1.0L＋体内でつくられる水0.3L＝1.3L、不足1.2L（健康のため水を飲もう推進運動 のリーフレット。監修 武藤芳照）
//  ・Palma L ほか Clin Cosmet Investig Dermatol 2015;8:413-421：健康な女性49人、約2L/日を30日足す → 肌の表面と深い層のうるおいが有意に変化（小さな研究）
//  ・Dennis EA ほか Obesity 2010;18(2):300-307：55〜75歳の48人、カロリー制限中に毎食前500mlを12週間 → 体重の減りが約2kg多い
//  残りがトイレへ は向きだけ（単純計算の量は言わない）。病気の人の水分制限には踏み込まない。2リットルが体に悪いとは言わない。会社は架空

const GOLD = '#ffd27a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d8e8', ground: '#8a8a90' }); hemi.intensity = 1.3;
const KACHO = makeSuit({ jacket: '#3a4a5a', tie: '#3a8ac8', glasses: true }); S.add(KACHO); const sweatK = makeSweat(); KACHO.userData.head.add(sweatK);
function makeBottle(s = 1) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * s, 0.11 * s, 0.32 * s, 14), new THREE.MeshLambertMaterial({ color: '#9fd4f4', transparent: true, opacity: 0.75 })); b.position.y = 0.16 * s; g.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.09 * s, 0.08 * s, 12), new THREE.MeshLambertMaterial({ color: '#9fd4f4', transparent: true, opacity: 0.75 })); n.position.y = 0.36 * s; g.add(n); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 0.04 * s, 10), mat('#3a7ac8')); c.position.y = 0.42 * s; g.add(c); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.112 * s, 0.112 * s, 0.1 * s, 14), mat('#3a7ac8')); l.position.y = 0.17 * s; g.add(l); return g; }
const BOT = makeBottle(1.25); S.add(BOT);
const BUKA = [makeSuit({ jacket: '#2e3442', tie: '#c8423a' }), makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }), makeSuit({ jacket: '#56504a', tie: '#5a8a4a' }), makeSuit({ woman: true, jacket: '#3a4256', hair: '#5a3a28' })]; BUKA.forEach(p => S.add(p));
const QUEUE = [makeSuit({ jacket: '#4a4f60', tie: '#5a8a4a' }), makeSuit({ woman: true, jacket: '#6a5a4a', hair: '#2a2220' }), makeSuit({ jacket: '#2a2e38', tie: '#b23a3a', old: true })]; QUEUE.forEach(p => S.add(p));
const WOMAN = makeWoman({ shirt: '#f0b8c8', hair: '#3a2620' }); S.add(WOMAN);
const ELDER = makeMan({ shirt: '#8aa0b8', hair: '#9a9a9a' }); S.add(ELDER);

// ---------- A：廊下のトイレ（原点） ----------
room({ x: 0, w: 10, d: 5, h: 3.0, wall: '#e6e2da', floor: '#9a9aa0' });
const TDOOR = box(0.95, 2.1, 0.08, mat('#8aa0b8')); TDOOR.position.set(-2.0, 1.05, -2.45); S.add(TDOOR);
const tsign = label('トイレ', { w: 512, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.75 }); tsign.position.set(-2.0, 2.4, -2.3); S.add(tsign);
const pa = label('ピタッ', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.55 }); S.add(pa);
const kaigi = label('会議の途中', { w: 640, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(kaigi);
const gyouretsu = label('トイレの行列', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(gyouretsu);

// ---------- B：会議室（x=60） ----------
const BX = 60;
const MR = makeMeetingRoom(); MR.position.set(BX, 0, 0); S.add(MR); MR.userData.chairs.forEach((c, i) => { if (MR.userData.seats[i].z > 0) c.visible = false; });
const karappo = label('課長の席 からっぽ', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.2 }); S.add(karappo);
const kuchiguse = label('水を飲めば 全部よくなる', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.45 }); S.add(kuchiguse);
const sotto = label('そっと', { w: 512, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.6 }); S.add(sotto);
const MDOOR = box(0.9, 2.1, 0.08, mat('#b89a70')); MDOOR.position.set(BX + 3.2, 1.05, -3.42); S.add(MDOOR);

// ---------- C：オフィス（x=120） ----------
const CX = 120;
room({ x: CX, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(3); ISL.position.set(CX, 0, -0.8); S.add(ISL);
const CDOOR = box(0.95, 2.1, 0.08, mat('#8aa0b8')); CDOOR.position.set(CX + 3.2, 1.05, -3.42); S.add(CDOOR);
const csign = label('トイレ', { w: 512, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.75 }); csign.position.set(CX + 3.2, 2.4, -3.3); S.add(csign);
const kaisu = label('トイレ 1回目', { w: 768, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.0 }); S.add(kaisu);
const chikai = label('トイレに いちばん近い席', { w: 1100, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(chikai);
const DESKBOT = makeBottle(1.0); S.add(DESKBOT);

// ---------- D：数字のスタジオ（x=180） ----------
const DX = 180;
room({ x: DX, w: 10, d: 6, h: 4, wall: '#24304a', floor: '#34405a' });
const stL = new THREE.PointLight(0xffffff, 14, 14, 1.2); stL.position.set(DX, 3.5, 2); S.add(stL);
function makeTank(color) { const g = new THREE.Group(); const b = box(1.0, 1, 1.0, new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.85 })); b.geometry.translate(0, 0.5, 0); g.add(b); const cap = box(1.04, 0.05, 1.04, mat('#ffffff')); g.add(cap); g.userData.set = (h) => { b.scale.y = Math.max(0.001, h); cap.position.y = h; g.visible = h > 0.002; }; S.add(g); return g; }
const T_OUT = makeTank('#5aa8e8'); T_OUT.position.set(DX - 1.1, 0, -1.2);
const T_IN = makeTank('#8ad07a'); T_IN.position.set(DX + 1.1, 0, -1.2);
const T_GAP = makeTank('#ffd27a');
const HL = 0.62; // 1L あたりの高さ
const lOut = label('出ていく 2.5L', { w: 768, size: 96, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(lOut);
const lIn = label('食事と体の中 1.3L', { w: 900, size: 92, color: '#fff', bg: 'rgba(70,140,80,.97)', sx: 1.15 }); S.add(lIn);
const lGap = label('足りない 約1.2L', { w: 900, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.15 }); S.add(lGap);
const hontou = label('本当に 2リットル？', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(hontou);
const SCALE = new THREE.Group(); { const b = box(0.6, 0.08, 0.5, mat('#e8e8ec')); b.position.y = 0.04; SCALE.add(b); const d = box(0.22, 0.01, 0.1, new THREE.MeshBasicMaterial({ color: '#2a3a2a' })); d.position.set(0, 0.085, 0.12); SCALE.add(d); } SCALE.position.set(DX + 0.5, 0, -0.6); S.add(SCALE);
const uruoi = label('肌のうるおい アップ', { w: 1000, size: 92, color: '#fff', bg: 'rgba(232,90,122,.97)', sx: 1.3 }); S.add(uruoi);
const genryou = label('体重 約2kg 多く減った', { w: 1100, size: 90, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(genryou);
const BOTS = []; for (let i = 0; i < 4; i++) { const b = makeBottle(1.0); b.position.set(DX - 0.9 + i * 0.6, 0, -0.3); S.add(b); BOTS.push(b); }
const kusuri = label('全部よくなる 薬じゃない', { w: 1100, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.45 }); S.add(kusuri);
const umeru = label('足りない分を 埋めるもの', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(umeru);

const LABELS = [pa, kaigi, gyouretsu, karappo, kuchiguse, sotto, kaisu, chikai, lOut, lIn, lGap, hontou, uruoi, genryou, kusuri, umeru];
const PEOPLE = [KACHO, ...BUKA, ...QUEUE, WOMAN, ELDER];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweatK.userData.set(0); BOT.visible = false; DESKBOT.visible = false; SCALE.visible = false; BOTS.forEach(b => b.visible = false);
  [T_OUT, T_IN, T_GAP].forEach(g => g.userData.set(0)); MR.userData.board.set([]);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function walk(p, t, sp = 9, a = 0.6) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * a; p.userData.legs[1].rotation.x = -s * a; p.userData.arms[1].rotation.x = s * a * 0.6; }
function hug() { KACHO.userData.arms[0].rotation.set(-1.0, 0, 0.5); KACHO.userData.arms[1].rotation.x = Math.min(KACHO.userData.arms[1].rotation.x, -0.9); BOT.visible = true; KACHO.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.85, 0.3); KACHO.localToWorld(v); BOT.position.copy(v); BOT.rotation.set(KACHO.rotation.x, KACHO.rotation.y, 0); }
const TP = 0.35;
function line() { QUEUE.forEach((p, i) => { stand(p, -2.0 + i * 0.8, -1.5 + i * 0.1, -Math.PI / 2 + 0.25); p.userData.head.rotation.y = -0.2; }); }
function lineCam(u = 0) { look(lerp(0.0, -0.2, u), 1.95, lerp(5.6, 5.2, u), -0.55, 1.55, -1.3, 50); }
function shot0(t) { // 0秒＝サムネ：会議の途中、2リットルのボトルを抱えた課長が、トイレの前の行列でパッと止まる
  reset(); lift(0); line(); const k = clamp(t / TP); stand(KACHO, lerp(1.9, 0.75, easeOut(k)), -1.25, -Math.PI / 2 + 0.3); hug();
  if (t < TP) walk(KACHO, t); else { KACHO.rotation.x = -0.05; KACHO.userData.head.rotation.y = 0.35; sweatK.userData.set(1, t); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; say(pa, t, TP, 0.75, 2.25, -1.0, 0.5); }
  if (t > TP + 0.35) say(gyouretsu, t, TP + 0.35, -1.0, 0.75, -0.8, 0.9);
  lineCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKaraseki(t, d) { // 会議室では、部下たちが、空いた課長の席を見て固まる
  reset(); lift(150); const seats = MR.userData.seats.filter(s => s.z < 0); // 奥の3席：真ん中が課長の席
  [0, 2].forEach((si, j) => { const s = seats[si]; stand(BUKA[j], BX + s.x, s.z, s.ry); poseSit(BUKA[j]); BUKA[j].userData.head.rotation.y = si === 0 ? -0.5 : 0.5; });
  const fs = MR.userData.seats.filter(s => s.z > 0); [0, 2].forEach((si, j) => { const s = fs[si]; stand(BUKA[2 + j], BX + s.x, s.z - 0.15, s.ry); poseSit(BUKA[2 + j]); });
  if (t > d * 0.45) say(karappo, t, d * 0.45, BX, 1.55, -1.75, 0.9);
  const u = ease(clamp(t / d)); look(BX + lerp(0.3, 0.1, u), 1.7, lerp(3.8, 3.4, u), BX, 1.0, -1.6, 50);
  return S;
}
function sKuchiguse(t, d) { // 部下たちの不満から。課長の口ぐせは、水を飲めば全部よくなる
  reset(); lift(150); stand(KACHO, BX + 0.6, -2.6, 0.1); hug(); KACHO.userData.arms[1].rotation.set(-2.3, 0, -0.3);
  const fs = MR.userData.seats.filter(s => s.z > 0); [0, 2].forEach((si, j) => { const s = fs[si]; stand(BUKA[j], BX + s.x, s.z - 0.15, s.ry); poseSit(BUKA[j]); BUKA[j].userData.head.rotation.x = 0.2; });
  if (t > d * 0.5) say(kuchiguse, t, d * 0.5, BX + 0.5, 2.4, -2.4, 1.2);
  look(BX - 0.6, 1.9, 2.6, BX + 0.4, 1.45, -2.0, 50);
  return S;
}
function deskSeat(i) { const s = ISL.userData.seats[i]; return { x: CX + s.x, z: -0.8 + s.z, ry: s.ry }; }
function sDay1(t, d) { // 1日目。午前中だけで、課長はトイレに3回
  reset(); lift(150); const k = Math.min(3, 1 + Math.floor(t / (d / 3)));
  const ph = (t % (d / 3)) / (d / 3); const s = deskSeat(2);
  stand(KACHO, lerp(s.x, CX + 3.2, ease(ph)), lerp(s.z, -3.0, ease(ph)), Math.PI / 2 + 0.6); walk(KACHO, t, 12); hug();
  kaisu.userData.set(`トイレ ${k}回目`); say(kaisu, t, 0.2, CX + 1.4, 2.3, -2.0, 0.9);
  setHud('2リットル生活', '1日目', 1);
  look(CX + 0.8, 2.3, 4.0, CX + 1.6, 1.2, -1.6, 50);
  return S;
}
function sDay3(t, d) { // 3日目。会議の途中で、そっとトイレへ抜ける
  reset(); lift(150); const k = clamp(t / d); stand(KACHO, lerp(BX + 1.3, BX + 3.1, ease(k)), lerp(-1.6, -3.0, k), Math.PI / 2 + 0.4); KACHO.rotation.x = 0.35; walk(KACHO, t, 6, 0.3); hug();
  const fs = MR.userData.seats.filter(s => s.z > 0); [0, 1].forEach((si, j) => { const s = fs[si]; stand(BUKA[j], BX + s.x, s.z - 0.15, s.ry); poseSit(BUKA[j]); });
  if (t > d * 0.3) say(sotto, t, d * 0.3, BX + 2.2, 2.1, -2.0, 0.55);
  setHud('2リットル生活', '3日目', 1);
  look(BX + 1.2, 2.0, 3.2, BX + 2.3, 1.1, -2.3, 50);
  return S;
}
function sWeek(t, d) { // 1週間後。朝イチで、トイレにいちばん近い席を取る
  reset(); lift(150); const s = deskSeat(5); const k = clamp(t / (d * 0.45));
  stand(KACHO, lerp(s.x - 1.8, s.x, ease(k)), s.z, k < 1 ? Math.PI / 2 : s.ry); if (k < 1) { walk(KACHO, t, 9); hug(); } else { poseSit(KACHO); BOT.visible = false; DESKBOT.visible = true; DESKBOT.position.set(s.x - 0.35, TABLE_Y + 0.03, s.z - 0.35); }
  if (t > d * 0.55) say(chikai, t, d * 0.55, CX + 0.9, 2.0, -1.2, 1.1);
  setHud('2リットル生活', '1週間後', 1);
  look(CX + 0.2, 2.2, 3.4, CX + 1.6, 1.15, -1.6, 50);
  return S;
}
function studioCam() { look(DX, 1.7, 6.0, DX, 1.25, -1.0, 50); }
function sDemo(t, d) { // でも、体は本当に2リットルを待っていたのか
  reset(); lift(150); stand(KACHO, DX, -0.6, 0); hug(); KACHO.userData.head.rotation.z = 0.2;
  if (t > d * 0.3) say(hontou, t, d * 0.3, DX, 2.45, -0.6, 1.1);
  look(DX + 0.3, 1.8, 3.6, DX, 1.4, -0.6, 50);
  return S;
}
function sNum(i, t, d) { // 2.5L 出ていく → 1.3L 食事と体の中 → 足りない 約1.2L
  reset(); lift(150);
  const kO = i === 0 ? easeOut(clamp((t - 0.3) / 1.2)) : 1; T_OUT.userData.set(2.5 * HL * kO);
  if (kO > 0.98) say(lOut, t, i === 0 ? 1.5 : 0, DX - 1.1, 2.5 * HL + 0.4, -0.6, 0.9);
  if (i >= 1) { const kI = i === 1 ? easeOut(clamp((t - 0.3) / 1.0)) : 1; T_IN.userData.set(1.3 * HL * kI); if (kI > 0.98) say(lIn, t, i === 1 ? 1.3 : 0, DX + 1.1, 1.3 * HL * 0.5, -0.4, 1.0); }
  if (i >= 2) { const kG = easeOut(clamp((t - 0.3) / 0.8)); T_GAP.position.set(DX + 1.1, 1.3 * HL, -1.2); T_GAP.userData.set(1.2 * HL * kG); if (kG > 0.98) say(lGap, t, 1.1, DX + 1.1, 2.5 * HL + 0.4, -0.6, 1.0); }
  if (i === 0) setTop('ふつうの暮らしで 1日に出ていく水', `${(2.5 * kO).toFixed(1)}L`, fade(t, 0.2, d, 0.2), BLUE);
  if (i === 1) setTop('食事1.0L ＋ 体の中でできる0.3L', '1.3L', fade(t, 0.2, d, 0.2), '#9be86a');
  if (i === 2) setTop('飲み水で 足りない分', '約1.2L', fade(t, 0.2, d, 0.2), GOLD);
  studioCam();
  return S;
}
function sBiyou(t, d) { // 美容は？ 女性49人が、1日2リットル多く飲んで30日。肌のうるおいが上がった
  reset(); lift(150); stand(WOMAN, DX - 0.2, -0.6, 0.2); WOMAN.userData.arms[1].rotation.set(-2.4, 0, -0.5);
  BOTS.forEach((b, i) => { b.visible = i < 2; b.position.set(DX + 0.6 + i * 0.35, 0, -0.3); });
  if (t > d * 0.55) say(uruoi, t, d * 0.55, DX, 2.4, -0.6, 1.15);
  setTop('女性49人・30日（2015年の研究）', '1日 ＋約2L', fade(t, 0.2, d, 0.2), '#ff9ab8');
  look(DX + 0.2, 1.75, 3.6, DX + 0.1, 1.4, -0.6, 50);
  return S;
}
function sDiet(t, d) { // ダイエットは？ 食事を減らしている55〜75歳の48人。毎食前に500mlの水を12週間で、体重が約2kg多く減った
  reset(); lift(150); SCALE.visible = true; stand(ELDER, DX + 0.5, -0.6, -0.2); ELDER.position.y = 0.08;
  BOTS.forEach((b, i) => { b.visible = i < 3; b.scale.setScalar(0.7); b.position.set(DX - 0.9 + i * 0.4, 0, -0.4); });
  const ph = t / d;
  if (ph > 0.7) say(genryou, t, d * 0.7, DX + 0.2, 2.45, -0.6, 1.25);
  setTop(ph < 0.4 ? '食事を減らしている 55〜75歳の48人' : '毎食前に500ml・12週間（2010年の研究）', ph < 0.7 ? '48人' : '約2kg 多く減った', fade(t, 0.2, d, 0.2), '#9be86a');
  look(DX + 0.2, 1.75, 3.8, DX + 0.2, 1.3, -0.6, 50);
  return S;
}
function sKekka(t, d) { // 結果：体が待っていたのは約1.2リットル。残りの水は、トイレの往復と、肌とダイエットの味方だった
  reset(); lift(150); const s = deskSeat(5); stand(KACHO, s.x, s.z, s.ry); poseSit(KACHO); BOT.visible = false; DESKBOT.visible = true; DESKBOT.position.set(s.x - 0.35, TABLE_Y + 0.03, s.z - 0.35); KACHO.userData.head.rotation.y = 0.6;
  setTop('結果', '待っていたのは 約1.2L', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(s.x + lerp(-0.4, -0.6, u), 2.0, s.z + lerp(-2.6, -3.0, u), s.x, 1.1, s.z, 50);
  return S;
}
function sKusuri(t, d) { // 水は、飲めば全部よくなる薬じゃなく、足りない分を埋めるものだったのかもしれない
  reset(); lift(420); BOTS.forEach((b, i) => { b.visible = true; b.scale.setScalar(1.2); b.position.set(DX - 0.9 + i * 0.6, 0, -0.3); });
  const ph = t / d; if (ph > 0.2 && ph < 0.55) say(kusuri, t, d * 0.2, DX, 1.3, 0.2, 1.2);
  if (ph > 0.6) { say(umeru, t, d * 0.6, DX, 1.3, 0.2, 1.2); BOTS.forEach((b, i) => { if (i > 0) b.visible = false; }); BOTS[0].position.x = DX; }
  look(DX, 1.5, 4.2, DX, 0.95, -0.3, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); line(); stand(KACHO, 0.75, -1.25, -Math.PI / 2 + 0.3); hug(); KACHO.userData.head.rotation.y = 0.35; lineCam(0); return S; }

const NARR = { '会議室': 'かいぎしつ', '部下たち': 'ぶかたち', '空いた': 'あいた', '課長': 'かちょう', '席': 'せき', '見て': 'みて', '固まる': 'かたまる', '不満': 'ふまん', '口ぐせ': 'くちぐせ', '水': 'みず', '飲めば': 'のめば', '全部': 'ぜんぶ', '1日目': 'いちにちめ', '午前中': 'ごぜんちゅう', '3回': 'さんかい', '3日目': 'みっかめ', '会議': 'かいぎ', '途中': 'とちゅう', '抜ける': 'ぬける', '1週間後': 'いっしゅうかんご', '朝イチ': 'あさイチ', '近い': 'ちかい', '取る': 'とる', '体': 'からだ', '本当に': 'ほんとうに', '2リットル': 'にリットル', '待っていた': 'まっていた', '暮らす': 'くらす', '出ていく': 'でていく', '1日2.5リットル': 'いちにちにてんごリットル', '食事': 'しょくじ', '体の中': 'からだのなか', '1.3リットル': 'いってんさんリットル', '飲み水': 'のみみず', '足りない': 'たりない', '分': 'ぶん', '約1.2リットル': 'やくいってんにリットル', '美容': 'びよう', '女性49人': 'じょせいよんじゅうきゅうにん', '1日2リットル': 'いちにちにリットル', '多く': 'おおく', '飲んで': 'のんで', '30日': 'さんじゅうにち', '肌': 'はだ', '上がった': 'あがった', '減らしている': 'へらしている', '55〜75歳': 'ごじゅうごからななじゅうごさい', '48人': 'よんじゅうはちにん', '毎食前': 'まいしょくまえ', '500ml': 'ごひゃくミリリットル', '12週間': 'じゅうにしゅうかん', '体重': 'たいじゅう', '約2kg': 'やくにキロ', '減った': 'へった', '結果：': '結果、', '残り': 'のこり', '往復': 'おうふく', '味方': 'みかた', '薬': 'くすり', '埋める': 'うめる', '1日': 'いちにち', '何杯': 'なんばい' };
const P = planTimes([
  ['会議室では、部下たちが、', (t, d) => sKaraseki(t, 2 * d)],
  ['空いた課長の席を見て<br>固まる。', (t, d) => sKaraseki(t + d, 2 * d)],
  ['部下たちの不満から。', (t, d) => sKuchiguse(t, 2 * d)],
  ['課長の口ぐせは、<br>水を飲めば全部よくなる。', (t, d) => sKuchiguse(t + d, 2 * d)],
  ['1日目。午前中だけで、<br>課長はトイレに3回。', sDay1],
  ['3日目。会議の途中で、<br>そっとトイレへ抜ける。', sDay3],
  ['1週間後。朝イチで、トイレに<br>いちばん近い席を取る。', sWeek],
  ['でも、体は本当に<br>2リットルを待っていたのか。', sDemo],
  ['ふつうに暮らすだけで、<br>体から出ていく水は', (t, d) => sNum(0, t, 2 * d)],
  ['1日2.5リットル。', (t, d) => sNum(0, t + d, 2 * d)],
  ['食事と体の中から<br>1.3リットル。', (t, d) => sNum(1, t, d)],
  ['飲み水で足りない分は、<br>約1.2リットル。', (t, d) => sNum(2, t, d)],
  ['美容は？ 女性49人が、', (t, d) => sBiyou(t, 2 * d)],
  ['1日2リットル多く飲んで30日。<br>肌のうるおいが上がった。', (t, d) => sBiyou(t + d, 2 * d)],
  ['ダイエットは？ 食事を<br>減らしている55〜75歳の48人。', (t, d) => sDiet(t, 3 * d)],
  ['毎食前に500mlの水を<br>12週間で、', (t, d) => sDiet(t + d, 3 * d)],
  ['体重が約2kg多く減った。', (t, d) => sDiet(t + 2 * d, 3 * d)],
  ['結果：体が待っていたのは<br>約1.2リットル。', (t, d) => sKekka(t, 3 * d)],
  ['残りの水は、トイレの往復と、', (t, d) => sKekka(t + d, 3 * d)],
  ['肌とダイエットの<br>味方だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['水は、飲めば全部よくなる<br>薬じゃなく、', (t, d) => sKusuri(t, 2 * d)],
  ['足りない分を埋めるもの<br>だったのかもしれない。', (t, d) => sKusuri(t + d, 2 * d)],
  ['あなたは1日、<br>水を何杯飲んでる？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0716',
    v2: true,
    tt: 'main',
    trial: true,
    remakeOf: '0665',
    hookLine: '会議の途中、2リットルのボトルを抱えた課長が、トイレの前の行列でパッと止まる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも水を毎日2リットル、30日飲みきったら？',
    titleHtml: 'もしも水を<br>毎日2リットル、<br>30日飲みきったら？',
    mood: 'hopeful', seed: 716, hits: [TP, P.at(17), P.at(20)], risers: [P.at(7)], impacts: [P.at(9, 0.3), P.at(11, 0.6), P.at(16, 0.3)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 0.3), 'bubble'], [P.at(5, 0.3), 'whoosh'], [P.at(6, 0.3), 'whoosh'], [P.at(13, 0.6), 'bubble']],
    narr: NARR,
    ask: 'あなたは1日、水を何杯飲んでる？',
    caption: 'もしも水を毎日2リットル、30日飲みきったら？\n\n会議室では、部下たちが、空いた課長の席を見て固まる。\n部下たちの不満から。課長の口ぐせは、水を飲めば全部よくなる。\n1日目。午前中だけで、課長はトイレに3回。\n3日目。会議の途中で、そっとトイレへ抜ける。\n1週間後。朝イチで、トイレにいちばん近い席を取る。\nでも、体は本当に2リットルを待っていたのか。\nふつうに暮らすだけで、体から出ていく水は1日2.5リットル。食事と体の中から1.3リットル。\n飲み水で足りない分は、約1.2リットル。\n美容は？ 女性49人が、1日2リットル多く飲んで30日。肌のうるおいが上がった。\nダイエットは？ 食事を減らしている55〜75歳の48人。毎食前に500mlの水を12週間で、体重が約2kg多く減った。\n\n結果：体が待っていたのは約1.2リットル。残りの水は、トイレの往復と、肌とダイエットの味方だった。\n水は、飲めば全部よくなる薬じゃなく、足りない分を埋めるものだったのかもしれない。\n\nあなたは1日、水を何杯飲んでる？ コメントで教えて。\n\n出典：健康のため水を飲もう推進運動 リーフレット（1日の水の出入り）、Palma L ほか Clin Cosmet Investig Dermatol 2015（女性49人・30日）、Dennis EA ほか Obesity 2010（55〜75歳48人・12週間）。病気で水分を制限されている人は医師の指示に従ってください\n※会社・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '水2リットル', '水分補給', '人体の限界'],
    endStats: [['飲み水で足りない分（1日）', '約1.2L', '健康のため水を飲もう推進運動'], ['女性49人・+2L/日を30日', '肌のうるおい アップ', 'Palma ほか 2015'], ['55〜75歳48人・毎食前500ml・12週', '体重 約2kg 多く減った', 'Dennis ほか 2010']],
    sources: '健康のため水を飲もう推進運動／Palma ほか 2015／Dennis ほか 2010',
  },
});
