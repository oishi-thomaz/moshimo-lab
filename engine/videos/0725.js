import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';
import { makeHanko, hankoSlam, makeMark, makeDoc } from '../scenes/hanko.js';

// もしも会社から、喫煙所が消えたら？（皮肉回・台本 S127・社会の消えたら）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。喫煙所で部長と先に話を決めてくるヤニカスの課長が、喫煙所の撤去で固まる回。後半で 噂話を気にしていた吸わない社員 にも返す
// 数字（一次資料で確認・2026/11/23）：現在習慣的に喫煙している者の割合 男性24.5%（厚生労働省 令和6年国民健康・栄養調査結果の概要）。
//  改正健康増進法 2020年4月1日全面施行・多数の者が利用する施設は原則屋内禁煙（基準を満たした喫煙専用室のみ喫煙可。厚生労働省 なくそう！望まない受動喫煙）
// タバコに火をつける・煙を出す絵は出さない（ライターは手に持つだけ）。実在の会社・銘柄・ロゴは出さない。行き先は現実の規模（外の決められた場所に1人で行くだけ）

const GOLD = '#ffd27a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d0dc', ground: '#8a8f99' }); hemi.intensity = 1.3;

// ---------- A：社内の喫煙所（原点） ----------
room({ x: 0, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const booth = new THREE.Group(); S.add(booth); booth.position.set(0, 0, -1.8);
const glassM = new THREE.MeshLambertMaterial({ color: '#bfd8e8', transparent: true, opacity: 0.28, depthWrite: false });
{ const back = box(3.4, 2.6, 0.06, mat('#c9ced8')); back.position.set(0, 1.3, -1.3); booth.add(back);
  for (const x of [-1.7, 1.7]) { const s = box(0.06, 2.6, 2.6, glassM); s.position.set(x, 1.3, 0); booth.add(s); }
  const roof = box(3.5, 0.12, 2.7, mat('#9aa0aa')); roof.position.set(0, 2.66, 0); booth.add(roof);
  for (const x of [-1.7, 1.7]) for (const z of [-1.3, 1.3]) { const f = box(0.08, 2.6, 0.08, mat('#8a8f99')); f.position.set(x, 1.3, z); booth.add(f); }
  const lintel = box(3.4, 0.3, 0.08, mat('#8a8f99')); lintel.position.set(0, 2.45, 1.3); booth.add(lintel); }
const DOOR = box(1.1, 2.15, 0.05, glassM); DOOR.position.set(0, 1.08, -0.5); S.add(DOOR);
const DOORF = new THREE.Group(); for (const [w, h, x, y] of [[1.15, 0.06, 0, 2.15], [1.15, 0.06, 0, 0.03], [0.06, 2.15, -0.55, 1.08], [0.06, 2.15, 0.55, 1.08]]) { const f = box(w, h, 0.07, mat('#6a707c')); f.position.set(x, y, 0); DOORF.add(f); } DOORF.position.set(0, 0, -0.5); S.add(DOORF);
const ASH = new THREE.Group(); { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.95, 16), mat('#5a5e66')); a.position.y = 0.475; ASH.add(a); const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 16), mat('#8a8f99')); tp.position.y = 0.97; ASH.add(tp); } ASH.position.set(-0.95, 0, -0.15); S.add(ASH);
const boothSign = label('喫煙所', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 0.8 }); S.add(boothSign);
const TEKKYO = label('撤去', { w: 384, size: 150, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(TEKKYO);
const sparkA = makeSparkles(120, 0.1, 0xfff2c0); S.add(sparkA.points); sparkA.init([[-0.95, 0.6, -0.15]], 0.5, 0.7);

// 人
const KACHO = makeOji(rng(127), { shirt: '#59606e' }); S.add(KACHO); const sweatK = makeSweat(); KACHO.userData.head.add(sweatK);
const LIGHTER = box(0.06, 0.13, 0.035, mat('#d83a3a')); LIGHTER.position.set(0, -0.68, 0.07); KACHO.userData.arms[1].add(LIGHTER);
const BUCHO = makeSuit({ old: true, bald: true, jacket: '#2a2e38', tie: '#7a2a2a' }); S.add(BUCHO);
const YOUNG = [makeSuit({ jacket: '#3a5a6a', tie: '#3a6ab2' }), makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }), makeSuit({ jacket: '#4a5a3a', tie: '#c89a3a' })]; YOUNG.forEach(p => S.add(p));
const sweatY = makeSweat(); YOUNG[1].userData.head.add(sweatY);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const sakini = label('大事な話は ここで先に', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(sakini);
const kimari = label('決まり', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(kimari);

// ---------- B：廊下とオフィス（x=60） ----------
const BX = 60;
room({ x: BX, w: 12, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(BX - 3.6 + i * 3.6, 2.0, -3.4); S.add(w); }
const ISL = makeDeskIsland(3); ISL.position.set(BX, 0, -0.9); S.add(ISL); const SEATS = ISL.userData.seats;
const kikkake = label('話すきっかけ 0', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.2 }); S.add(kikkake);
const shiin = label('シーン', { w: 512, size: 120, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.7 }); S.add(shiin);
const uwasa = label('噂話 0件', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.95 }); S.add(uwasa);
const demo = label('困ったのは 課長だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(demo);
const waruguchi = label('悪口のきっかけ 0', { w: 1000, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(waruguchi);

// ---------- C：会議室（x=120） ----------
const CX = 120;
const MR = makeMeetingRoom(); MR.position.set(CX, 0, 0); S.add(MR); const MSEATS = MR.userData.seats;
const zenin = label('全員の前で 決定', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.25 }); S.add(zenin);
const kaigi2 = label('もう一つの会議室', { w: 1000, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(kaigi2);

// ---------- D：数字（x=180）：男性の4人と、法律の書類 ----------
const DX = 180;
flat(14, 10, '#5a6070', DX, 0); const dwall = box(14, 4, 0.2, mat('#3a3f50')); dwall.position.set(DX, 2, -2.6); S.add(dwall);
const MEN = [0, 1, 2, 3].map(i => { const p = makeSuit({ jacket: ['#3a4256', '#4a5a3a', '#5a4a3a', '#3a5a6a'][i], tie: ['#3a6ab2', '#c89a3a', '#7a2a2a', '#5a8a4a'][i], old: i === 2 }); p.position.set(DX - 1.5 + i * 1.0, 0, -1.2); S.add(p); return p; });
const spot = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), mat('#ffd27a', { depthWrite: false })); spot.rotation.x = -Math.PI / 2; spot.position.set(DX + 0.5, 0.02, -1.2); spot.renderOrder = -0.7; S.add(spot);
const LIGHTER2 = box(0.06, 0.13, 0.035, mat('#d83a3a')); LIGHTER2.position.set(0, -0.68, 0.07); MEN[2].userData.arms[1].add(LIGHTER2);
const EX = DX + 40;
flat(12, 10, '#6a5040', EX, 0); const ewall = box(12, 4, 0.2, mat('#3a3a50')); ewall.position.set(EX, 2, -2.5); S.add(ewall);
const edesk = box(2.6, 0.08, 1.6, mat('#8a6a4c')); edesk.position.set(EX, 0.9, -0.8); S.add(edesk);
const DOC = makeDoc({ title: '改正健康増進法', rows: ['職場', '屋内', '吸える所'], head: '#3a6ab2', w: 1.3, h: 1.6 }); DOC.rotation.x = -Math.PI / 2; DOC.position.set(EX, 0.945, -0.8); S.add(DOC);
const HANKO = makeHanko(); HANKO.scale.setScalar(0.26); S.add(HANKO);
const MARK = makeMark('施行', { sub: '2020年4月' }); S.add(MARK);

// ---------- E：外の決められた場所（x=280） ----------
const FX = 280;
flat(20, 14, '#9aa0a8', FX, 0); const fwall = box(20, 6, 0.3, mat('#d8d4cc')); fwall.position.set(FX, 3, -3.2); S.add(fwall);
for (let i = 0; i < 4; i++) { const w = box(1.4, 1.0, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(FX - 4.5 + i * 3, 3.6, -3.0); S.add(w); }
const ENT = box(2.0, 2.4, 0.06, new THREE.MeshBasicMaterial({ color: '#7fa6c8' })); ENT.position.set(FX - 1.0, 1.2, -3.0); S.add(ENT);
const FENCE = new THREE.Group(); for (let i = 0; i < 6; i++) { const p = box(0.06, 1.0, 0.06, mat('#5a6070')); p.position.set(FX + 1.6 + i * 0.5, 0.5, -1.2); FENCE.add(p); } { const r = box(2.6, 0.06, 0.06, mat('#5a6070')); r.position.set(FX + 2.85, 0.95, -1.2); FENCE.add(r); } S.add(FENCE);
const ASH2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16), mat('#5a5e66')); ASH2.position.set(FX + 2.8, 0.45, -2.0); S.add(ASH2);
const outSign = label('喫煙場所', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 0.8 }); S.add(outSign);
const ippon = label('1本だけ', { w: 512, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.65 }); S.add(ippon);
const kippu = label('部長の隣に立つ 切符', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(kippu);

const PEOPLE = [KACHO, BUCHO, ...YOUNG];
const LABELS = [boothSign, TEKKYO, katamaru, sakini, kimari, kikkake, shiin, uwasa, demo, waruguchi, zenin, kaigi2, outSign, ippon, kippu];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  MEN.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatK.userData.set(0); sweatY.userData.set(0);
  ASH.visible = true; DOOR.visible = true; HANKO.visible = false; MARK.visible = false; ['', '', ''].forEach((s, i) => DOC.userData.fill(i, s)); MR.userData.board.set([]); hemi.intensity = 1.3;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function sit(p, s, ox = 0, oz = 0) { stand(p, s.x + ox, s.z + oz, s.ry); poseSit(p); p.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); }
function walk(p, t, sp = 7, a = 0.4) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * a; p.userData.legs[1].rotation.x = -s * a; p.userData.arms[0].rotation.x = -s * a * 0.6; }
const TP = 0.3;
function lighterHand(p) { p.userData.arms[1].rotation.set(-1.25, 0, 0.15); }
function boothBase(t, tekkyo = true) {
  boothSign.visible = true; boothSign.position.set(0, 2.32, -0.48); boothSign.userData.size(0.55);
  stand(KACHO, 0.9, 0.3, -0.35); lighterHand(KACHO);
  if (tekkyo) { TEKKYO.visible = true; TEKKYO.position.set(0, 1.45, -0.42); TEKKYO.userData.size(0.62); }
}
function boothCam(u = 0) { look(lerp(0.05, 0.0, u), lerp(1.95, 1.9, u), lerp(5.6, 5.2, u), 0.0, 1.35, -0.8, 50); }
function shot0(t) { // 0秒＝サムネ：喫煙所のドアに 撤去 の札がバンと貼られ、灰皿がスッと消える
  reset(); lift(0); boothBase(t, false);
  const k = clamp((t - TP) / 0.18); if (t >= TP) { TEKKYO.visible = true; TEKKYO.position.set(0, 1.45, -0.42); TEKKYO.userData.size(0.62 * (1 + 0.5 * (1 - easeOut(k)))); el.flash.style.opacity = t < TP + 0.1 ? 0.25 : 0; }
  const g = clamp((t - TP - 0.15) / 0.35); ASH.visible = g < 1; ASH.scale.setScalar(1 - easeOut(g) * 0.999); if (g > 0) sparkA.set(clamp((t - TP - 0.15) / 1.2));
  boothCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // ライターを持った課長が、ドアの前で固まる
  reset(); lift(140); boothBase(t); ASH.visible = false; sweatK.userData.set(1, t); KACHO.userData.head.rotation.y = -0.25;
  if (t > d * 0.35) say(katamaru, t, d * 0.35, 0.95, 2.15, 0.35, 0.38);
  const u = ease(clamp(t / d)); look(lerp(1.9, 1.7, u), 1.75, lerp(2.4, 2.0, u), 0.8, 1.4, 0.0, 50);
  return S;
}
function sFuman(t, d) { // 吸わない社員たちの不満から。大事な話は、いつも喫煙所で先に決まっていた（回想：喫煙所の中の課長と部長、外の若手）
  reset(); lift(140); boothSign.visible = true; boothSign.position.set(0, 2.32, -0.48); boothSign.userData.size(0.55);
  stand(KACHO, -0.35, -2.0, 0.5); lighterHand(KACHO); stand(BUCHO, 0.7, -2.1, -0.5); BUCHO.userData.arms[1].rotation.set(-0.6, 0, 0); KACHO.userData.head.rotation.y = 0.2;
  YOUNG.forEach((p, i) => { stand(p, [-2.4, -2.0, 2.3][i], [0.2, 1.0, 0.6][i], [-2.6, -2.4, 2.6][i]); });
  if (t > d * 0.3) say(sakini, t, d * 0.3, 0.1, 3.0, -0.6, 1.6);
  if (t > d * 0.6) say(kimari, t, d * 0.6, 0.95, 2.0, -1.9, 0.7);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), 2.3, lerp(5.4, 5.0, u), 0.0, 1.7, -1.4, 50);
  return S;
}
function sDay1(t, d) { // 1日目。課長は、部長と話すきっかけをなくす（オフィスの通路で、部長が素通り）
  reset(); lift(140); const k = clamp(t / d);
  stand(BUCHO, BX + lerp(3.0, -1.5, k), 1.2, -Math.PI / 2); walk(BUCHO, t);
  stand(KACHO, BX + 0.6, 1.0, 0.6); lighterHand(KACHO); KACHO.userData.head.rotation.y = lerp(0.6, -0.6, k);
  if (t > d * 0.45) say(kikkake, t, d * 0.45, BX + 0.6, 2.25, 1.0, 1.0);
  setHud('喫煙所が消えて', '1日目', 1);
  look(BX + 0.6, 1.8, 4.6, BX + 0.6, 1.3, 1.0, 50);
  return S;
}
function sDay3(t, d) { // 3日目。会議室で、初めて全員の前で企画が決まる
  reset(); lift(140); MR.userData.board.set(['新しい企画', '決定'], { color: '#1a6a3a' });
  [KACHO, BUCHO, ...YOUNG].forEach((p, i) => sit(p, MSEATS[[0, 2, 1, 3, 5][i]], CX));
  if (t > d * 0.45) say(zenin, t, d * 0.45, CX + 0.6, 1.55, -0.6, 1.0);
  setHud('喫煙所が消えて', '3日目', 1);
  const u = ease(clamp(t / d)); look(CX + lerp(1.4, 1.1, u), 2.7, lerp(4.4, 4.0, u), CX + 0.4, 1.55, -1.6, 50);
  return S;
}
function deskSeat(p, si) { sit(p, SEATS[si], BX, -0.9); }
function sWeek(t, d) { // 1週間後。喫煙所から回ってきた噂話が、どこからも聞こえてこない
  reset(); lift(140); deskSeat(YOUNG[0], 0); deskSeat(YOUNG[1], 2); deskSeat(YOUNG[2], 4);
  if (t > d * 0.3) say(shiin, t, d * 0.3, BX - 0.6, 2.0, -1.4, 0.55);
  if (t > d * 0.6) say(uwasa, t, d * 0.6, BX + 0.6, 1.55, -0.8, 0.8);
  setHud('喫煙所が消えて', '1週間後', 1);
  const u = ease(clamp(t / d)); look(BX + lerp(0.3, 0.0, u), lerp(2.7, 2.5, u), lerp(4.6, 4.0, u), BX, 1.1, -1.3, 50);
  return S;
}
function sDemo(t, d) { // でも、困ったのは、課長だけじゃなかった
  reset(); lift(140); deskSeat(YOUNG[0], 0); deskSeat(YOUNG[1], 2); YOUNG[1].userData.head.rotation.y = -0.5;
  if (t > d * 0.35) say(demo, t, d * 0.35, BX - 0.75, 2.25, -1.3, 1.2);
  look(BX - 0.4, 1.9, 3.0, BX - 0.75, 1.3, -1.3, 50);
  return S;
}
function sUwasa(t, d) { // 噂話を気にしていた吸わない社員も、だれかの悪口を言うきっかけをなくす
  reset(); lift(140); deskSeat(YOUNG[0], 0); deskSeat(YOUNG[1], 2);
  const lean = Math.min(1, t / 0.6); YOUNG[1].rotation.z = -0.15 * lean; YOUNG[0].rotation.z = 0.12 * lean; YOUNG[1].userData.head.rotation.y = -0.7; YOUNG[0].userData.head.rotation.y = 0.7;
  YOUNG[1].userData.arms[0].rotation.set(-1.6, 0, 0.3);
  if (t > d * 0.5) { sweatY.userData.set(1, t); YOUNG[1].userData.arms[0].rotation.set(-0.6, 0, 0); say(waruguchi, t, d * 0.5, BX - 0.75, 2.25, -1.2, 1.05); }
  const u = ease(clamp(t / d)); look(BX - lerp(0.4, 0.6, u), 1.9, lerp(3.2, 2.9, u), BX - 0.75, 1.2, -1.2, 50);
  return S;
}
function sMen(t, d) { // 日本の男性で、習慣的にタバコを吸う人は24.5%（2024年）
  reset(); lift(160); hemi.intensity = 1.1;
  MEN.forEach((p, i) => { if (i === 2) { lighterHand(p); } });
  const v = Math.round(lerp(0, 24.5, easeOut(clamp((t - 0.4) / 1.4))) * 10) / 10;
  setTop('習慣的にタバコを吸う男性（2024年）', `${v.toFixed(1)}%`, fade(t, 0.3, d, 0.25), GOLD); setHud('日本の数字', '2024年', 1);
  const u = ease(clamp(t / d)); look(DX + 0.1, 1.8, lerp(4.6, 4.2, u), DX, 1.2, -1.2, 50);
  return S;
}
function sLaw(t, d) { // 職場は2020年4月から、法律で原則屋内禁煙
  reset(); lift(330);
  DOC.userData.fill(0, '原則 屋内禁煙'); DOC.userData.fill(1, 'タバコはダメ'); DOC.userData.fill(2, '専用室だけ');
  HANKO.visible = true; const done = hankoSlam(HANKO, [EX + 0.45, 0.95, -0.4], t, 0.6, { from: 1.4, up: 1.6 });
  if (done) { MARK.visible = true; MARK.position.set(EX + 0.45, 1.0, -0.4); MARK.userData.size(0.4); }
  setTop('職場は法律で 原則屋内禁煙', '2020年4月〜', fade(t, 0.9, d, 0.25), GREEN); setHud('改正健康増進法', '2020年4月', 1);
  const u = ease(clamp(t / d)); look(EX + lerp(0.15, 0.1, u), lerp(3.2, 3.1, u), lerp(1.7, 1.5, u), EX, 0.95, -0.9, 50);
  return S;
}
function sOutside(t, d) { // 1か月後。課長は昼休み、外の決められた場所で1本だけ吸って、すぐ席に戻る
  reset(); lift(140); outSign.visible = true; outSign.position.set(FX + 2.85, 1.55, -1.2); outSign.userData.size(0.55);
  const ph = t / d;
  if (ph < 0.55) { stand(KACHO, FX + 2.4, -1.9, 0.3); lighterHand(KACHO); KACHO.userData.head.rotation.x = 0.1; if (ph > 0.15) say(ippon, t, d * 0.15, FX + 2.4, 2.35, -1.9, 0.55); }
  else { const k = clamp((ph - 0.55) / 0.45); stand(KACHO, lerp(FX + 1.8, FX - 1.0, k), lerp(-1.0, -2.6, k), -Math.PI / 2 - 0.5); walk(KACHO, t, 9); }
  setHud('喫煙所が消えて', '1か月後', 1);
  look(FX + 1.5, 2.2, 6.0, FX + 1.4, 1.3, -1.7, 50);
  return S;
}
function sKekka(t, d) { // 結果：喫煙所が消えて、なくなったのは煙だけじゃなく、吸う人だけが入れた、もう一つの会議室だった
  reset(); lift(140); boothSign.visible = true; boothSign.position.set(0, 2.32, -0.48); boothSign.userData.size(0.55); TEKKYO.visible = true; TEKKYO.position.set(0, 1.45, -0.42); TEKKYO.userData.size(0.62); ASH.visible = false;
  if (t > d * 0.45) say(kaigi2, t, d * 0.45, 0, 2.95, -0.5, 1.2);
  setTop('結果', '裏の会議室が 消えた', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.0, u), lerp(2.0, 2.2, u), lerp(5.4, 6.2, u), 0, 1.6, -1.2, 50);
  return S;
}
function sKippu(t, d) { // タバコ部屋の1本は、休憩じゃなく、部長の隣に立つための、切符だったのかもしれない
  reset(); lift(140); stand(KACHO, BX + 0.6, 1.0, 0.2); lighterHand(KACHO); KACHO.userData.head.rotation.x = 0.25;
  if (t > d * 0.45) say(kippu, t, d * 0.45, BX + 0.6, 2.35, 1.0, 1.1);
  const u = ease(clamp(t / d)); look(BX + lerp(1.0, 0.8, u), 2.0, lerp(6.4, 5.8, u), BX + 0.6, 1.5, 1.0, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); boothBase(t); ASH.visible = false; boothCam(0); return S; }

const NARR = { 'ライター': 'ライター', '持った': 'もった', '課長': 'かちょう', '固まる': 'かたまる', '吸わない': 'すわない', '社員たち': 'しゃいんたち', '社員': 'しゃいん', '不満': 'ふまん', '大事な話': 'だいじなはなし', '喫煙所': 'きつえんじょ', '先に': 'さきに', '決まっていた': 'きまっていた', '1日目': 'いちにちめ', '部長': 'ぶちょう', '話す': 'はなす', '3日目': 'みっかめ', '会議室': 'かいぎしつ', '初めて': 'はじめて', '全員': 'ぜんいん', '企画': 'きかく', '決まる': 'きまる', '1週間後': 'いっしゅうかんご', '回ってきた': 'まわってきた', '噂話': 'うわさばなし', '聞こえて': 'きこえて', '困った': 'こまった', '気にしていた': 'きにしていた', '悪口': 'わるぐち', '言う': 'いう', '日本': 'にほん', '男性': 'だんせい', '習慣的に': 'しゅうかんてきに', '吸う人': 'すうひと', '24.5%': 'にじゅうよんてんごパーセント', '職場': 'しょくば', '2020年4月': 'にせんにじゅうねんしがつ', '法律': 'ほうりつ', '原則': 'げんそく', '屋内禁煙': 'おくないきんえん', '1か月後': 'いっかげつご', '昼休み': 'ひるやすみ', '外': 'そと', '決められた場所': 'きめられたばしょ', '1本だけ': 'いっぽんだけ', '吸って': 'すって', '席': 'せき', '戻る': 'もどる', '結果：': '結果、', '消えて': 'きえて', '煙': 'けむり', '入れた': 'はいれた', '一つ': 'ひとつ', '1本': 'いっぽん', '休憩': 'きゅうけい', '隣': 'となり', '立つ': 'たつ', '切符': 'きっぷ', '決まった': 'きまった', 'タバコ部屋': 'タバコべや' };
const P = planTimes([
  ['ライターを持った課長が、<br>ドアの前で固まる。', sKatamaru],
  ['吸わない社員たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['大事な話は、いつも<br>喫煙所で先に決まっていた。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。課長は、部長と<br>話すきっかけをなくす。', sDay1],
  ['3日目。会議室で、初めて<br>全員の前で企画が決まる。', sDay3],
  ['1週間後。喫煙所から<br>回ってきた噂話が、', (t, d) => sWeek(t, 2 * d)],
  ['どこからも聞こえてこない。', (t, d) => sWeek(t + d, 2 * d)],
  ['でも、困ったのは、<br>課長だけじゃなかった。', sDemo],
  ['噂話を気にしていた<br>吸わない社員も、', (t, d) => sUwasa(t, 2 * d)],
  ['だれかの悪口を言う<br>きっかけをなくす。', (t, d) => sUwasa(t + d, 2 * d)],
  ['日本の男性で、習慣的に<br>タバコを吸う人は24.5%。', sMen],
  ['職場は2020年4月から、<br>法律で原則屋内禁煙。', sLaw],
  ['1か月後。課長は昼休み、<br>外の決められた場所で', (t, d) => sOutside(t, 2 * d)],
  ['1本だけ吸って、<br>すぐ席に戻る。', (t, d) => sOutside(t + d, 2 * d)],
  ['結果：喫煙所が消えて、<br>なくなったのは煙だけじゃなく、', (t, d) => sKekka(t, 2 * d)],
  ['吸う人だけが入れた、<br>もう一つの会議室だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['タバコ部屋の1本は、<br>休憩じゃなく、', (t, d) => sKippu(t, 2 * d)],
  ['部長の隣に立つための、<br>切符だったのかもしれない。', (t, d) => sKippu(t + d, 2 * d)],
  ['喫煙所で決まった話、<br>あったことある？', sAsk],
], { shot0, endCard, start: 3.3, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0725',
    v2: true,
    tt: 'main',
    hookLine: '会社の喫煙所のドアに 撤去 の札が貼られ、灰皿がスッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも会社から、喫煙所が消えたら？',
    titleHtml: 'もしも会社から、<br>喫煙所が<br>消えたら？',
    mood: 'tension', seed: 725, hits: [TP, P.at(14), P.at(17)], risers: [P.at(7)], impacts: [P.at(10, 1.8), P.at(11, 0.7)],
    sfx: [[TP, 'whoosh'], [TP + 0.15, 'poof'], [P.at(0, 0.6), 'meter', 0.25], [P.at(3, 0.8), 'whoosh'], [P.at(4, 0.8), 'bubble'], [P.at(5, 0.6), 'meter', 0.2], [P.at(9, 0.6), 'alarm']],
    narr: NARR,
    ask: '喫煙所で決まった話、あったことある？',
    caption: 'もしも会社から、喫煙所が消えたら？\n\nライターを持った課長が、ドアの前で固まる。\n吸わない社員たちの不満から。大事な話は、いつも喫煙所で先に決まっていた。\n1日目。課長は、部長と話すきっかけをなくす。\n3日目。会議室で、初めて全員の前で企画が決まる。\n1週間後。喫煙所から回ってきた噂話が、どこからも聞こえてこない。\nでも、困ったのは、課長だけじゃなかった。\n噂話を気にしていた吸わない社員も、だれかの悪口を言うきっかけをなくす。\n日本の男性で、習慣的にタバコを吸う人は24.5%（2024年）。\n職場は2020年4月から、法律で原則屋内禁煙。\n1か月後。課長は昼休み、外の決められた場所で1本だけ吸って、すぐ席に戻る。\n\n結果：喫煙所が消えて、なくなったのは煙だけじゃなく、吸う人だけが入れた、もう一つの会議室だった。\nタバコ部屋の1本は、休憩じゃなく、部長の隣に立つための、切符だったのかもしれない。\n\n喫煙所で決まった話、あったことある？ コメントで教えて。\n\n※風刺ネタです。登場する人物・会社は架空です\n出典：厚生労働省 令和6年国民健康・栄養調査結果の概要（現在習慣的に喫煙している者の割合 男性24.5%）／厚生労働省 なくそう！望まない受動喫煙（改正健康増進法 2020年4月1日全面施行）',
    hashtags: ['もしもラボ', 'もしも', '喫煙所', 'タバコ休憩', '社会の消えたら'],
    endStats: [['習慣的にタバコを吸う男性', '24.5%', '2024年・厚生労働省'], ['職場の原則屋内禁煙', '2020年4月〜', '改正健康増進法'], ['喫煙所の1本の正体', '部長の隣に立つ切符', 'かもしれない']],
    sources: '出典：厚生労働省 令和6年国民健康・栄養調査／なくそう！望まない受動喫煙<br>※風刺ネタです（登場するものは架空）',
  },
});
