import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, label, pop, makePhone } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';
import { makeHanko, hankoSlam, makeMark, makeDoc } from '../scenes/hanko.js';

// もしもタバコを吸わない人だけ、有給が年6日多かったら？（皮肉回・台本 S79・図星／大人の本音）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/11 の解析の種（0646 タバコ休憩の論争を、ごほうびの側から）
// 数字（一次資料で確認・2026/11/14）：2017年9月、国内の会社が非喫煙の社員に年6日の特別有休を導入（喫煙者が休憩時間以外にも業務を離れることへの不公平感の解消が目的。
//  弁護士ドットコムニュース 2017/9/27）。会社名・ロゴは出さない。タバコに火をつける・吸う絵は出さない（ライターは手に持つだけ）。健康被害の話には踏み込まない
// ヤニカス叩きから入り、後半で 休めない非喫煙者 に返す両叩き。三段は 1日目 静かな喫煙所→1か月後 禁煙外来→半年後 誰も並ばない。言い換えは 休めない自分

const GOLD = '#ffd27a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d0dc', ground: '#8a8f99' }); hemi.intensity = 1.3;

// ---------- A：オフィス（原点） ----------
const roomA = room({ x: 0, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(-3.2 + i * 3.2, 2.0, -3.4); S.add(w); }
const ISL = makeDeskIsland(3); ISL.position.set(0, 0, -0.8); S.add(ISL);
const SEATS = ISL.userData.seats; // 偶数＝奥の席（こちら向き）
const NON = [0, 2, 4].map((si, i) => { const p = makeSuit({ woman: i === 1, jacket: ['#3a4256', '#5a4a6a', '#3a5a6a'][i], hair: i === 1 ? '#3a2620' : undefined, tie: ['#3a6ab2', null, '#5a8a4a'][i] || undefined }); S.add(p); p.userData.seat = si; return p; }); // 吸わない人
const sweatN = makeSweat(); NON[1].userData.head.add(sweatN);
const PLUS = [0, 2].map(si => { const l = label('有給 +6日', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.97)', sx: 0.95 }); S.add(l); l.userData.seat = si; return l; });
const PLUS_MID = label('有給 +6日', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.97)', sx: 0.95 }); S.add(PLUS_MID);
const sparkA = makeSparkles(140, 0.12, 0xfff2c0); S.add(sparkA.points);
const EMPTY = label('席を外しています', { w: 900, size: 90, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(EMPTY);
const nankai = label('1日に何回も 席を外す', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(nankai);
const meiwaku = label('休むと迷惑かな…', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.4 }); S.add(meiwaku);
const yasumenai = label('休めない自分', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(yasumenai);
const nokori = label('有給 +6日 使ったのは 0日', { w: 1100, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.8 }); S.add(nokori);

// ---------- A2：サムネ用の2つの机（x=-40） ----------
const AX = -40;
const roomA2 = room({ x: AX, w: 8, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const win2 = box(2.4, 1.3, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); win2.position.set(AX, 2.2, -2.9); S.add(win2);
const D2 = [-0.6, 0.6].map(dx => { const g = new THREE.Group(); const top = box(1.08, 0.06, 0.75, mat('#e8e4dc')); top.position.y = TABLE_Y; g.add(top); const leg = box(1.0, TABLE_Y, 0.05, mat('#9aa0aa')); leg.position.set(0, TABLE_Y / 2, 0.33); g.add(leg); const mon = box(0.45, 0.3, 0.04, mat('#22252c')); mon.position.set(0.3, TABLE_Y + 0.2, -0.22); mon.rotation.y = -0.5; g.add(mon); g.position.set(AX + dx, 0, -1.0); S.add(g); return g; });
const CHAIR2 = box(0.5, 0.08, 0.5, mat('#30343e')); CHAIR2.position.set(AX + 0.6, 0.47, -1.7); S.add(CHAIR2); const CHB2 = box(0.5, 0.6, 0.07, mat('#30343e')); CHB2.position.set(AX + 0.6, 0.8, -1.95); S.add(CHB2);
const ME2 = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }); S.add(ME2);
const PLUS2 = label('有給 +6日', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.97)', sx: 1.0 }); S.add(PLUS2);
const EMPTY2 = label('タバコ休憩中', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.75 }); S.add(EMPTY2);

// ---------- B：喫煙所（x=60） ----------
const BX = 60;
flat(16, 10, '#7d8798', BX, 0);
const bwall = box(16, 3.6, 0.2, mat('#e6e9ee')); bwall.position.set(BX, 1.8, -3.4); S.add(bwall);
const booth = new THREE.Group(); S.add(booth); booth.position.set(BX, 0, -2.0);
const glassM = new THREE.MeshLambertMaterial({ color: '#bfd8e8', transparent: true, opacity: 0.3, depthWrite: false });
{ const back = box(3.4, 2.6, 0.06, mat('#c9ced8')); back.position.set(0, 1.3, -1.3); booth.add(back);
  for (const x of [-1.7, 1.7]) { const s = box(0.06, 2.6, 2.6, glassM); s.position.set(x, 1.3, 0); booth.add(s); }
  const roof = box(3.5, 0.12, 2.7, mat('#9aa0aa')); roof.position.set(0, 2.66, 0); booth.add(roof);
  for (const x of [-1.7, 1.7]) for (const z of [-1.3, 1.3]) { const f = box(0.08, 2.6, 0.08, mat('#8a8f99')); f.position.set(x, 1.3, z); booth.add(f); }
  const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.95, 16), mat('#5a5e66')); ash.position.set(0, 0.475, -0.2); booth.add(ash); }
const boothSign = label('喫煙所', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 0.85 }); boothSign.position.set(BX, 2.35, -0.75); S.add(boothSign);
const YANI = [0, 1, 2].map(i => { const p = makeOji(rng(40 + i), { shirt: ['#59606e', '#8a8f99', '#6b7a5a'][i] }); S.add(p); const l = box(0.06, 0.12, 0.03, mat(['#d83a3a', '#3a8ad8', '#e8c23a'][i])); l.position.set(0, -0.68, 0.06); p.userData.arms[1].add(l); return p; });
const KACHO = YANI[1];
const tomaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.45 }); S.add(tomaru);
const wallClock = label('15:00', { w: 512, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.8 }); S.add(wallClock);
const shizuka = label('いつもより 静か', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.4 }); S.add(shizuka);
const PH = makePhone({ w: 0.5, h: 1.0 }); S.add(PH.g);
const kossori = label('こっそり', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.8 }); S.add(kossori);
const daremo = label('誰も 並んでいない', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(daremo);

// ---------- C：書類とハンコ（x=120）：作り話じゃない ----------
const CX = 120;
flat(12, 10, '#6a5040', CX, 0);
const cwall = box(12, 4, 0.2, mat('#3a3a50')); cwall.position.set(CX, 2, -2.5); S.add(cwall);
const cdesk = box(2.6, 0.08, 1.6, mat('#8a6a4c')); cdesk.position.set(CX, 0.9, -0.8); S.add(cdesk);
const DOC = makeDoc({ title: '特別休暇のお知らせ', rows: ['対象', '日数', '理由'], head: '#3a6ab2', w: 1.3, h: 1.6 }); DOC.rotation.x = -Math.PI / 2; DOC.position.set(CX, 0.945, -0.8); S.add(DOC);
const HANKO = makeHanko(); HANKO.scale.setScalar(0.26); S.add(HANKO);
const MARK = makeMark('導入', { sub: '2017年' }); S.add(MARK);
const honto = label('作り話じゃない', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(honto);

// ---------- D：12月のカレンダー（オフィスの壁） ----------
const CAL = (() => { const c = document.createElement('canvas'); c.width = 700; c.height = 600; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), new THREE.MeshBasicMaterial({ map: tex })); let k = -1;
  m.userData.draw = () => { if (k === 1) return; k = 1; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 700, 600); g.fillStyle = '#c8242c'; g.fillRect(0, 0, 700, 100); g.fillStyle = '#fff'; g.font = '900 64px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('12月', 350, 52); g.fillStyle = '#333'; g.font = '800 44px "Noto Sans CJK JP"'; for (let i = 0; i < 31; i++) { g.fillText(String(i + 1), 60 + (i % 7) * 97, 150 + Math.floor(i / 7) * 95); } tex.needsUpdate = true; }; return m; })();
CAL.position.set(3.2, 2.0, -3.36); S.add(CAL);

const PEOPLE = [...NON, ...YANI];
const LABELS = [PLUS2, EMPTY2, ...PLUS, PLUS_MID, EMPTY, nankai, meiwaku, yasumenai, nokori, tomaru, wallClock, shizuka, kossori, daremo, honto];
function seatPos(si) { const s = SEATS[si]; return [s.x, -0.8 + s.z, s.ry]; }
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  poseClear(ME2); ME2.position.set(AX - 0.6, 0, -1.65); poseSit(ME2); ME2.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0));
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatN.userData.set(0); hemi.intensity = 1.3;
  NON.forEach(p => { const [x, z, ry] = seatPos(p.userData.seat); p.position.set(x, 0, z); p.rotation.y = ry; poseSit(p); p.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); });
  YANI.forEach((p, i) => { p.position.set(BX - 1.0 + i * 1.0, 0, -2.1 + (i === 1 ? -0.3 : 0)); p.rotation.y = 0; p.userData.arms[1].rotation.set(-1.3, 0, 0.15); });
  PH.g.visible = false; HANKO.visible = false; MARK.visible = false; DOC.userData.fill(0, ''); DOC.userData.fill(1, ''); DOC.userData.fill(2, '');
  CAL.userData.draw();
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.25;
function deskCam(u = 0) { look(lerp(-0.7, -0.75, u), lerp(3.2, 3.1, u), lerp(2.2, 2.0, u), -0.75, lerp(0.95, 0.9, u), -1.9, 50); }
function plusDrop(l, t, t0, x, z) { const k = clamp((t - t0) / 0.2); l.visible = t >= t0; l.position.set(x, lerp(3.4, TABLE_Y + 0.55, easeOut(k)), z); l.userData.size(0.8 * (1 + 0.25 * Math.max(0, 1 - Math.abs(k - 1) * 6))); }
function thumbCam(u = 0) { look(AX + lerp(0.05, 0.0, u), lerp(2.3, 2.25, u), lerp(3.4, 3.2, u), AX, lerp(1.5, 1.45, u), -1.2, 50); }
function thumb(t) {
  const k = clamp((t - TP) / 0.2); PLUS2.visible = t >= TP; PLUS2.position.set(AX - 0.6, lerp(3.0, 1.2, easeOut(k)), -0.75); PLUS2.userData.size(0.9 * (1 + 0.25 * Math.max(0, 1 - Math.abs(k - 1) * 6)));
  EMPTY2.visible = true; EMPTY2.position.set(AX + 0.6, 1.25, -1.5); EMPTY2.userData.size(0.6);
}
function shot0(t) { // 0秒＝サムネ：吸わない人の机にだけ、有給+6日 の札がドンと立つ（隣の席はタバコ休憩で空）
  reset(); lift(0); thumb(t);
  if (t > TP + 0.2) { sparkA.init([[AX - 0.6, 1.15, -0.75]], 0.4, 0.8); sparkA.set(clamp((t - TP - 0.2) / 1.2)); el.flash.style.opacity = t < TP + 0.3 ? 0.25 : 0; ME2.userData.head.rotation.x = -0.15; ME2.userData.arms[1].rotation.set(-2.6, 0, 0.2); }
  thumbCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function boothCam(u = 0) { look(BX + lerp(0.3, 0.2, u), lerp(1.9, 1.8, u), lerp(2.6, 2.2, u), BX, 1.4, -2.1, 50); }
function sTomaru(t, d) { // 喫煙所の前で、ヤニカスたちのライターの手が止まる
  reset(); lift(120); YANI.forEach(p => p.userData.head.rotation.x = t > d * 0.4 ? 0.2 : 0);
  if (t > d * 0.4) say(tomaru, t, d * 0.4, BX, 2.25, -2.1, 0.4);
  boothCam(ease(clamp(t / d)));
  return S;
}
function sFuman(t, d) { // 吸わない人たちの不満から。あの人たち、1日に何回も席を外してる
  reset(); lift(120); const [xm, zm] = seatPos(2); NON.forEach((p, i) => { if (i !== 1) p.userData.head.rotation.y = i === 0 ? -0.6 : 0.6; }); NON[1].visible = false;
  EMPTY.visible = true; EMPTY.position.set(xm, TABLE_Y + 0.45, zm + 0.45); EMPTY.userData.size(0.75);
  if (t > d * 0.35) say(nankai, t, d * 0.35, -0.6, 1.85, -1.6, 1.2);
  deskCam(0.5);
  return S;
}
function sDay1(t, d) { // 1日目。午後3時の喫煙所が、いつもより静か
  reset(); lift(120); YANI[0].visible = YANI[2].visible = false; KACHO.userData.arms[1].rotation.set(0, 0, 0);
  say(wallClock, t, 0.2, BX - 0.75, 2.2, -2.6, 0.6); if (t > d * 0.45) say(shizuka, t, d * 0.45, BX + 0.3, 1.95, -1.8, 1.3);
  setHud('有給 +6日から', '1日目', 1);
  boothCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sKinen(t, d) { // 1か月後。ヤニカスの課長が、こっそり禁煙外来を予約
  reset(); lift(120); YANI[0].visible = YANI[2].visible = false; KACHO.position.set(BX + 2.6, 0, 0.2); KACHO.rotation.y = -0.4;
  KACHO.userData.arms[1].rotation.set(-1.5, 0, 0.3); KACHO.userData.head.rotation.x = 0.35; KACHO.updateMatrixWorld(); const v = new THREE.Vector3(0.1, 1.42, 0.55); KACHO.localToWorld(v);
  PH.g.visible = true; PH.g.position.copy(v); PH.g.rotation.set(-0.4, KACHO.rotation.y, 0); PH.g.scale.setScalar(0.5);
  PH.draw('yoyaku', (g, W, H) => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a8a6a'; g.fillRect(0, 0, W, 150); g.fillStyle = '#fff'; g.font = '900 64px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('もしも病院', W / 2, 78); g.fillStyle = '#333'; g.font = '900 72px "Noto Sans CJK JP"'; g.fillText('禁煙外来', W / 2, 360); g.fillStyle = '#d23a3a'; g.fillRect(70, 520, W - 140, 160); g.fillStyle = '#fff'; g.font = '900 70px "Noto Sans CJK JP"'; g.fillText('予約する', W / 2, 600); });
  if (t > d * 0.4) say(kossori, t, d * 0.4, BX + 2.3, 2.05, 0.2, 0.6);
  setHud('有給 +6日から', '1か月後', 1);
  look(BX + 3.4, 1.8, 2.3, BX + 2.6, 1.4, 0.2, 50);
  return S;
}
function sHalf(t, d) { // 半年後。喫煙所の前に、もう誰も並んでいない
  reset(); lift(120); YANI.forEach(p => p.visible = false);
  if (t > d * 0.4) say(daremo, t, d * 0.4, BX, 2.0, -1.0, 1.4);
  setHud('有給 +6日から', '半年後', 1);
  const u = ease(clamp(t / d)); look(BX + lerp(0.8, 0.0, u), lerp(2.2, 2.4, u), lerp(3.6, 4.6, u), BX, 1.3, -2.0, 50);
  return S;
}
function docCam(u = 0) { look(CX + lerp(0.25, 0.15, u), lerp(2.7, 2.6, u), lerp(1.0, 0.8, u), CX, 0.95, -0.8, 50); }
function sHonto(t, d) { // でもこれ、作り話じゃない
  reset(); lift(160); YANI.forEach(p => p.visible = false); NON.forEach(p => p.visible = false);
  DOC.userData.fill(0, '吸わない社員'); DOC.userData.fill(1, '年6日'); DOC.userData.fill(2, '不公平感をなくす');
  if (t > d * 0.35) say(honto, t, d * 0.35, CX, 1.35, -0.2, 0.8);
  docCam(ease(clamp(t / d)));
  return S;
}
function sHanko(t, d) { // 2017年、吸わない社員に年6日の休みを足した会社が、日本に本当にある
  reset(); lift(160); YANI.forEach(p => p.visible = false); NON.forEach(p => p.visible = false);
  DOC.userData.fill(0, '吸わない社員'); DOC.userData.fill(1, '年6日'); DOC.userData.fill(2, '不公平感をなくす');
  HANKO.visible = true; const t0 = 0.7; const done = hankoSlam(HANKO, [CX + 0.35, 0.95, -1.3], t, t0, { from: 1.4, up: 1.6 });
  if (done) { MARK.visible = true; MARK.position.set(CX + 0.35, 1.0, -1.3); MARK.userData.size(0.4); }
  setTop('吸わない社員の特別休暇（2017年）', '年6日', fade(t, 1.0, d, 0.25), GREEN); setHud('日本の会社', '2017年9月', 1);
  docCam(1);
  return S;
}
function sIppou(t, d) { // 一方、6日をもらった吸わない人たち
  reset(); lift(120); NON[1].visible = true; PLUS.forEach(l => { const [x, z] = seatPos(l.userData.seat); l.visible = true; l.position.set(x, TABLE_Y + 0.55, z + 0.45); l.userData.size(0.75); });
  const [x2, z2] = seatPos(4); PLUS_MID.visible = true; PLUS_MID.position.set(x2, TABLE_Y + 0.55, z2 + 0.45); PLUS_MID.userData.size(0.75);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.0, u), lerp(2.4, 2.0, u), lerp(3.4, 2.6, u), 0, 1.2, -1.6, 50);
  return S;
}
function calCam(u = 0) { look(lerp(2.2, 2.0, u), 1.9, lerp(0.8, 0.4, u), 2.6, 1.6, -2.4, 50); }
function sDec(t, d) { // 12月。カレンダーを見る。6日のうち、1日も使っていない
  reset(); lift(120); NON[2].rotation.y = 0.9; NON[2].userData.head.rotation.y = 0.3; NON[2].userData.head.rotation.x = -0.2;
  if (t > d * 0.45) say(nokori, t, d * 0.45, 2.6, 1.3, -2.4, 1.2);
  setHud('有給 +6日から', '12月', 1);
  calCam(ease(clamp(t / d)));
  return S;
}
function sMeiwaku(t, d) { // 休むと迷惑かな、で結局出社
  reset(); lift(120); NON[1].userData.head.rotation.x = 0.3; sweatN.userData.set(1, t);
  const [x, z] = seatPos(2); if (t > 0.4) say(meiwaku, t, 0.4, x, 1.75, z, 0.95);
  look(x + 0.4, 1.7, z + 1.8, x, 1.25, z, 50);
  return S;
}
function sKekka(t, d) { // 結果：休みを6日足しても、休めない人は、やっぱり休まなかった
  reset(); lift(120); hemi.intensity = 0.9; NON.forEach(p => p.userData.head.rotation.x = 0.25);
  PLUS.forEach(l => { const [x, z] = seatPos(l.userData.seat); l.visible = true; l.position.set(x, TABLE_Y + 0.55, z + 0.45); l.userData.size(0.75); });
  const [x2, z2] = seatPos(4); PLUS_MID.visible = true; PLUS_MID.position.set(x2, TABLE_Y + 0.55, z2 + 0.45); PLUS_MID.userData.size(0.75);
  setTop('結果', '使った有給 0日', fade(t, 0.4, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.0, 0.4, u), lerp(2.2, 2.9, u), lerp(2.6, 3.8, u), 0, 1.1, -1.6, 50);
  return S;
}
function sJibun(t, d) { // ずるいと思っていたのは、タバコ休憩じゃなく、休めない自分だったのかもしれない
  reset(); lift(120); const [x, z] = seatPos(2); NON[1].userData.head.rotation.x = 0.15; NON[1].userData.head.rotation.y = 0;
  if (t > d * 0.45) say(yasumenai, t, d * 0.45, x, 1.8, z, 0.85);
  const u = ease(clamp(t / d)); look(x + lerp(0.6, 0.2, u), 1.65, z + lerp(2.4, 1.7, u), x, 1.3, z, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); thumb(5); ME2.userData.head.rotation.x = -0.15; thumbCam(0); return S; }

const NARR = { '有給': 'ゆうきゅう', '喫煙所': 'きつえんじょ', '不満': 'ふまん', '1日に何回も': 'いちにちになんかいも', '席': 'せき', '1日目': 'いちにちめ', '午後3時': 'ごごさんじ', '1か月後': 'いっかげつご', '課長': 'かちょう', '禁煙外来': 'きんえんがいらい', '予約': 'よやく', '半年後': 'はんとしご', '作り話': 'つくりばなし', '2017年': '2017ねん', '年6日': 'ねんむいか', '6日': 'むいか', '社員': 'しゃいん', '一方': 'いっぽう', '12月': 'じゅうにがつ', '1日も': 'いちにちも', '迷惑': 'めいわく', '出社': 'しゅっしゃ', '結果：': '結果、', '自分': 'じぶん', '休憩': 'きゅうけい' };
const P = planTimes([
  ['喫煙所の前で、ヤニカスたちの<br>ライターの手が止まる。', sTomaru],
  ['吸わない人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['あの人たち、1日に何回も<br>席を外してる。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。午後3時の喫煙所が、<br>いつもより静か。', sDay1],
  ['1か月後。ヤニカスの課長が、<br>こっそり禁煙外来を予約。', sKinen],
  ['半年後。喫煙所の前に、<br>もう誰も並んでいない。', sHalf],
  ['でもこれ、作り話じゃない。', sHonto],
  ['2017年、吸わない社員に<br>年6日の休みを足した会社が、', (t, d) => sHanko(t, 2 * d)],
  ['日本に本当にある。', (t, d) => sHanko(t + d, 2 * d)],
  ['一方、6日をもらった<br>吸わない人たち。', sIppou],
  ['12月。カレンダーを見る。<br>6日のうち、1日も使っていない。', sDec],
  ['休むと迷惑かな、で結局出社。', sMeiwaku],
  ['結果：休みを6日足しても、', (t, d) => sKekka(t, 2 * d)],
  ['休めない人は、<br>やっぱり休まなかった。', (t, d) => sKekka(t + d, 2 * d)],
  ['ずるいと思っていたのは、<br>タバコ休憩じゃなく、', (t, d) => sJibun(t, 2 * d)],
  ['休めない自分<br>だったのかもしれない。', (t, d) => sJibun(t + d, 2 * d)],
  ['タバコ休憩、<br>ずるいと思う？', sAsk],
], { shot0, endCard, start: 3.6, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0684',
    v2: true,
    tt: 'main',
    hookLine: '吸わない人の机にだけ、有給+6日 の札がドンと立つ。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもタバコを吸わない人だけ、有給が年6日多かったら？',
    titleHtml: 'もしもタバコを<br>吸わない人だけ、<br>有給が年6日<br>多かったら？',
    mood: 'tension', seed: 684, hits: [0.05, TP, P.at(12), P.at(15)], risers: [P.at(6)], impacts: [P.at(7, 0.7), P.at(10, 1.4)],
    sfx: [[0.05, 'whoosh'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.6), 'alarm'], [P.at(5, 0.5), 'poof'], [P.at(11, 0.5), 'meter', 0.3]],
    narr: NARR,
    ask: 'タバコ休憩、ずるいと思う？',
    caption: 'もしもタバコを吸わない人だけ、有給が年6日多かったら？\n\n喫煙所の前で、ヤニカスたちのライターの手が止まる。\n吸わない人たちの不満から。あの人たち、1日に何回も席を外してる。\n1日目。午後3時の喫煙所が、いつもより静か。\n1か月後。ヤニカスの課長が、こっそり禁煙外来を予約。\n半年後。喫煙所の前に、もう誰も並んでいない。\nでもこれ、作り話じゃない。2017年、吸わない社員に年6日の休みを足した会社が、日本に本当にある。\n一方、6日をもらった吸わない人たち。\n12月。カレンダーを見る。6日のうち、1日も使っていない。\n休むと迷惑かな、で結局出社。\n\n結果：休みを6日足しても、休めない人は、やっぱり休まなかった。\nずるいと思っていたのは、タバコ休憩じゃなく、休めない自分だったのかもしれない。\n\nタバコ休憩、ずるいと思う？ コメントで教えて。\n\n※風刺ネタです。登場する人物・会社は架空です。2017年に非喫煙の社員へ年6日の特別休暇を導入した会社は実在します（弁護士ドットコムニュース 2017年9月27日）',
    hashtags: ['もしもラボ', 'もしも', 'タバコ休憩', '有給', '会社あるある'],
    endStats: [['吸わない社員の特別休暇', '年6日', '2017年・日本の会社'], ['6日をもらった人が使ったのは', '0日', 'もしもの結果'], ['ずるいと思っていたのは', '休めない自分', 'かもしれない']],
    sources: '出典：弁護士ドットコムニュース（2017年9月27日）<br>※風刺ネタです（登場するものは架空）',
  },
});
