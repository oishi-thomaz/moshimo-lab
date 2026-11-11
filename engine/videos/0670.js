import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSuit, poseClear, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makePipeChair, makeTent, makeLotBox, makeTable } from '../scenes/home.js';

// もしも日本からPTAが消えたら？（皮肉回・台本 S77・社会の消えたら）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。元ネタ：毎年春と秋に燃える PTAの役員決め・PTAはいらない の議論（ガルちゃん・はてなの定番）
// 数字は使わない。実在の学校・団体の名前は出さない（学校は架空の もしも小学校）。女叩き（ボスママ）から入り、来なかった父親にも返す
// 行き先は現実の規模（来てくれる人だけで、案外まわる）。三段は 4月の会議→6月のテント→9月のバザー。言い換えは 学校の中のお城

const { S, flat, room } = makeSet();
const BOSS_C = '#b0306a';
const makeBoss = () => { const p = makeWoman({ shirt: BOSS_C, hair: '#3a2018', pants: '#2a2a34' }); const sc = box(0.52, 0.1, 0.3, mat('#f2c14e')); sc.position.set(0, 1.47, 0.02); p.add(sc); return p; };
const TEACHER = (c = '#2a6ad0') => makeMan({ shirt: c, pants: c, hair: '#1d1a19' });
const MAMA = (i) => makeWoman({ shirt: ['#9fc7a8', '#e9b8c8', '#8fd0f0', '#f2d08a', '#c9a8d8'][i % 5], hair: ['#3a2620', '#6b4a33', '#2a2020'][i % 3], pants: '#3a3f4e' });

// ---------- A：体育館（原点）：役員決めのパイプ椅子 ----------
const gym = room({ x: 0, w: 14, d: 10, h: 6, wall: '#e8dcc0', floor: '#d6a96a' });
const stage = box(8, 1.1, 2, mat('#b8864e')); stage.position.set(0, 0.55, -4); S.add(stage);
const curtain = box(8, 3.6, 0.1, mat('#a0283a')); curtain.position.set(0, 2.9, -4.9); S.add(curtain);
for (const x of [-4.6, 4.6]) { const c = box(1.2, 4.8, 0.2, mat('#8a2030')); c.position.set(x, 3.4, -4.85); S.add(c); }
const banner = label('PTA役員決め', { w: 1024, size: 120, color: '#fff', bg: 'rgba(40,60,120,.96)', sx: 2.6 }); banner.position.set(0, 2.45, -3.0); S.add(banner);
const CHAIRS = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const ch = makePipeChair(); ch.position.set(-2.5 + c * 1.0, 0, 0.4 + r * 0.95); ch.rotation.y = Math.PI; S.add(ch); CHAIRS.push(ch); }
const sparkA = makeSparkles(320, 0.16, 0xffe9a8); S.add(sparkA.points); sparkA.init(CHAIRS.map(c => [c.position.x, 0.6, c.position.z]), 0.4, 1.2);
const BOSS = makeBoss(); S.add(BOSS);
const LOT = makeLotBox(); S.add(LOT);
const kieta = label('PTA 消滅', { w: 768, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(kieta);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.55 }); S.add(katamaru);
const kujiBubble = label('くじ、引いて', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(kujiBubble);
const WORK = [0, 1, 2].map(i => { const p = makeSuit({ woman: true, jacket: ['#3a4256', '#5a4a6a', '#56504a'][i], hair: ['#2a2020', '#6b4a33', '#3a2620'][i] }); S.add(p); return p; });
const yasumi = label('仕事を休んで', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(yasumi);
const nashi = label('バザー なし', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(nashi);
const komaranai = label('困った人 いない', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.7 }); S.add(komaranai);
const TABLES = [0, 1, 2].map(i => { const t = makeTable({ w: 1.8, d: 0.8, color: '#c9b08a' }); t.position.set(-3 + i * 3, 0, 0.5); S.add(t); return t; });
const deban = label('出番がない', { w: 768, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(deban);

// ---------- B：学童の門（x=60）：定時のお迎え ----------
const BX = 60;
flat(20, 12, '#c9c2b0', BX, 0);
const wallB = box(20, 1.6, 0.4, mat('#d8d2c4')); wallB.position.set(BX, 0.8, -3); S.add(wallB);
for (const x of [-1.8, 1.8]) { const p = box(0.6, 2.6, 0.6, mat('#bfb8a8')); p.position.set(BX + x, 1.3, -3); S.add(p); }
const bld = box(16, 6, 6, mat('#efe8da')); bld.position.set(BX, 3, -10); S.add(bld);
for (let i = 0; i < 8; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: '#ffd98a' })); w.position.set(BX - 6.3 + i * 1.8, 2.6, -6.98); S.add(w); }
const gateName = label('もしも小学校', { w: 768, size: 90, color: '#2a2a2a', bg: 'rgba(250,250,250,.97)', sx: 1.4 }); gateName.position.set(BX + 1.8, 2.1, -2.6); S.add(gateName);
const KIDS = [0, 1, 2].map(i => { const k = makeMan({ shirt: ['#f2c14e', '#e05a4f', '#4fa3d1'][i], pants: '#3a3f4e', scale: 0.62 }); S.add(k); return k; });
const teiji = label('定時でお迎え', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(teiji);
const kaigiNashi = label('夜の会議 なし', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(kaigiNashi);

// ---------- C：校庭（x=120）：運動会のテント ----------
const CX = 120;
flat(40, 30, '#c8a878', CX, 0);
for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), mat('#ffffff', { depthWrite: false })); l.rotation.x = -Math.PI / 2; l.position.set(CX - 9 + i * 1.6, 0.02, 4); l.renderOrder = -0.7; S.add(l); }
const schoolC = box(30, 8, 6, mat('#efe8da')); schoolC.position.set(CX, 4, -14); S.add(schoolC);
const TENT = makeTent({ color: '#3f7fd0' }); TENT.position.set(CX, 0, -1); S.add(TENT);
const TEACH = [TEACHER('#2a6ad0'), TEACHER('#2a8a5a'), TEACHER('#8a4a2a')]; TEACH.forEach(p => S.add(p));
const SWEAT = TEACH.map(p => { const s = makeSweat(); p.userData.head.add(s); return s; });
const dare = label('誰が立てる？', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(dare);
const sensei3 = label('先生 3人', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.1 }); S.add(sensei3);
const DADS = [0, 1, 2, 3].map(i => { const p = makeMan({ shirt: ['#59606e', '#4f6a8f', '#7a6a55', '#3f8f6b'][i], hair: ['#3a3330', '#1d1a19', '#5a5a5a', '#2c2421'][i], pants: '#2b3346' }); S.add(p); return p; });
const hajimete = label('初めて来た', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(hajimete);
const anngai = label('案外まわる', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.2 }); S.add(anngai);

// ---------- D：お城（体育館の中に出る） ----------
const CASTLE = new THREE.Group(); {
  const wm = mat('#e8e2d0'), rm = mat('#5a6a8a');
  for (const [w, d, x, z] of [[4.2, 0.3, 0, -1.6], [4.2, 0.3, 0, 1.6], [0.3, 3.2, -2.1, 0], [0.3, 3.2, 2.1, 0]]) { const b = box(w, 1.3, d, wm); b.position.set(x, 0.65, z); CASTLE.add(b); }
  for (const [x, z] of [[-2.1, -1.6], [2.1, -1.6], [-2.1, 1.6], [2.1, 1.6]]) { const t = box(0.8, 2.2, 0.8, wm); t.position.set(x, 1.1, z); CASTLE.add(t); const r = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.9, 4), rm); r.position.set(x, 2.65, z); r.rotation.y = Math.PI / 4; CASTLE.add(r); }
  for (let i = 0; i < 7; i++) { const c = box(0.3, 0.3, 0.32, wm); c.position.set(-1.6 + i * 0.53, 1.45, 1.6); CASTLE.add(c); }
  const pole = box(0.04, 1.0, 0.04, mat('#888')); pole.position.set(2.1, 3.5, -1.6); CASTLE.add(pole);
  const flag = box(0.5, 0.3, 0.02, mat(BOSS_C)); flag.position.set(2.36, 3.85, -1.6); CASTLE.add(flag);
}
CASTLE.position.set(0, 0, 0.6); S.add(CASTLE);
const oshiro = label('学校の中のお城', { w: 900, size: 110, color: '#fff', bg: 'rgba(176,48,106,.96)', sx: 1.9 }); S.add(oshiro);
const komatta = label('仕切っていた人', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.8 }); S.add(komatta);

const PEOPLE = [BOSS, ...WORK, ...KIDS, ...TEACH, ...DADS];
const LABELS = [kieta, katamaru, kujiBubble, yasumi, nashi, komaranai, deban, teiji, kaigiNashi, dare, sensei3, hajimete, anngai, oshiro, komatta];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); SWEAT.forEach(s => s.userData.set(0)); sparkA.set(0); el.flash.style.opacity = 0;
  CHAIRS.forEach(c => c.visible = true); TABLES.forEach(t => t.visible = false); CASTLE.visible = false; banner.visible = true;
  BOSS.position.set(0.2, 0, -1.2); LOT.position.set(-0.25, 0.86, -0.85); LOT.visible = true;
  WORK.forEach((p, i) => { p.visible = false; p.position.set(-1.5 + i * 1.2, 0, 3.0); });
  KIDS.forEach((k, i) => k.position.set(BX - 0.8 + i * 0.9, 0, -1.6));
  TEACH.forEach((p, i) => p.position.set(CX - 1.8 + i * 1.8, 0, -0.2));
  DADS.forEach((p, i) => { p.visible = false; p.position.set(CX - 2.6 + i * 1.75, 0, -2.4); });
  TENT.userData.setUp(1);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function holdLot(p) { p.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); }
const TP = 0.4;
function gymCam(u = 0) { look(0.3, lerp(2.5, 2.3, u), lerp(5.8, 5.2, u), 0.15, lerp(2.05, 1.6, u), -1.2, 44); }
function shot0(t) { // 0秒＝サムネ：体育館の 役員決め のパイプ椅子が、一斉にパッと消える
  reset(); lift(0); holdLot(BOSS);
  if (t > TP) { CHAIRS.forEach(c => c.visible = false); sparkA.set(clamp((t - TP) / 1.4)); el.flash.style.opacity = t < TP + 0.1 ? 0.35 : 0; say(kieta, t, TP + 0.05, 1.25, 1.95, -1.0, 0.85); }
  gymCam(ease(clamp(t / 3)));
  return S;
}
function bossCam(u = 0) { look(lerp(1.0, 0.7, u), 1.7, lerp(1.6, 1.1, u), 0.1, 1.45, -1.2, 50); }
function sKatamaru(t, d) { // くじの箱を持ったボスママが、空っぽの体育館で固まる。
  reset(); lift(120); CHAIRS.forEach(c => c.visible = false); holdLot(BOSS);
  banner.visible = false; if (t > 1.0) say(katamaru, t, 1.0, 0.55, 2.15, -1.0, 0.45);
  bossCam(ease(clamp(t / d)));
  return S;
}
function sFuman(t, d) { // 働くママたちの不満から。
  reset(); lift(120); holdLot(BOSS); BOSS.position.x = 2.4; LOT.position.x = 1.95; BOSS.rotation.y = -0.4; WORK.forEach((p, i) => { p.visible = true; p.rotation.y = Math.PI + (i - 1) * 0.2; p.position.set(-1.4 + i * 1.3, 0, -0.2); });
  CHAIRS.forEach((c, i) => c.visible = i < 6 ? false : true);
  look(-0.3, 1.9, -3.4, -0.3, 1.4, 0.2, 50);
  return S;
}
function sYasumi(t, d) { // 仕事を休んで、くじを引かされていた。
  reset(); lift(120); holdLot(BOSS); BOSS.position.x = 2.4; LOT.position.x = 1.95; BOSS.rotation.y = -0.4; WORK.forEach((p, i) => { p.visible = true; p.rotation.y = Math.PI + (i - 1) * 0.2; p.position.set(-1.4 + i * 1.3, 0, -0.2); });
  const k = clamp((t - 0.6) / 0.5); WORK[1].position.set(lerp(-0.1, 0.0, k), 0, lerp(-0.2, 1.2, k)); WORK[1].userData.arms[1].rotation.set(-1.6 * k, 0, 0); WORK[1].userData.head.rotation.x = 0.3;
  CHAIRS.forEach((c, i) => c.visible = i < 6 ? false : true);
  say(yasumi, t, 0.2, -0.3, 2.25, -0.2, 0.9);
  look(-0.3, 1.9, -3.4, -0.3, 1.4, 0.2, 50);
  return S;
}
function gateCam(u = 0) { look(BX + lerp(0.4, 0.1, u), 1.6, lerp(6.4, 5.6, u), BX, 1.3, -1.0, 50); }
function sApril(t, d) { // 4月。役員決めの夜の会議がない。
  reset(); lift(120); WORK.forEach(p => p.visible = false);
  say(kaigiNashi, t, 0.4, BX, 2.9, -2.2, 1.4); KIDS.forEach((k, i) => { k.rotation.y = 0; k.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.05; });
  setHud('PTAが消えて', '4月', 1); gateCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sTeiji(t, d) { // ママたちは定時に迎えに行ける。
  reset(); lift(120);
  WORK.forEach((p, i) => { p.visible = true; const k = easeOut(clamp((t - 0.2 * i) / 1.6)); p.position.set(BX - 1.4 + i * 1.1, 0, lerp(4.5, -0.6, k)); p.rotation.y = Math.PI * (k > 0.95 ? 0.95 : 1); });
  KIDS.forEach((k, i) => { k.rotation.y = 0; k.userData.arms[1].rotation.set(0, 0, 2.4 + Math.sin(t * 8 + i) * 0.3); });
  if (t > 1.2) say(teiji, t, 1.2, BX, 2.9, -1.4, 1.4);
  setHud('PTAが消えて', '4月', 1); gateCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function yardCam(u = 0) { look(CX + lerp(0.5, 0.2, u), lerp(3.0, 2.6, u), lerp(8.6, 7.6, u), CX, 1.3, -0.6, 50); }
function sJune(t, d) { // 6月。運動会のテントを、誰が立てる？
  reset(); lift(120); TENT.userData.setUp(0.15 + 0.1 * Math.sin(t * 2)); TEACH.forEach(p => p.visible = false);
  say(dare, t, 0.5, CX, 2.6, -0.4, 1.4);
  setHud('PTAが消えて', '6月', 1); yardCam(ease(clamp(t / d)) * 0.4);
  return S;
}
function sSensei(t, d) { // 先生が3人で汗だく。
  reset(); lift(120); TENT.userData.setUp(0.35 + 0.3 * clamp(t / d));
  TEACH.forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.set(-2.6 + Math.sin(t * 7 + i) * 0.15, 0, 0)); p.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.03; p.rotation.y = i === 1 ? 0 : (i === 0 ? 0.3 : -0.3); });
  SWEAT.forEach(s => s.userData.set(1, t));
  say(sensei3, t, 0.3, CX, 3.3, -0.4, 1.1);
  setHud('PTAが消えて', '6月', 1); yardCam(0.4 + ease(clamp(t / d)) * 0.6);
  return S;
}
function sSept(t, d) { // 9月。バザーがない。
  reset(); lift(120); CHAIRS.forEach(c => c.visible = false); BOSS.visible = false; LOT.visible = false; TABLES.forEach(tb => tb.visible = true);
  say(nashi, t, 0.4, 0, 2.8, 0.5, 1.4);
  setHud('PTAが消えて', '9月', 1); gymCam(0.6 + ease(clamp(t / d)) * 0.4);
  return S;
}
function sKomaranai(t, d) { // でも、困った人はいなかった。
  reset(); lift(120); CHAIRS.forEach(c => c.visible = false); BOSS.visible = false; LOT.visible = false; TABLES.forEach(tb => tb.visible = true);
  WORK.forEach((p, i) => { p.visible = true; p.position.set(-2 + i * 2, 0, 2.2); p.rotation.y = 0; p.userData.arms[0].rotation.set(0, 0, -0.5); p.userData.arms[1].rotation.set(0, 0, 0.5); p.userData.head.rotation.z = Math.sin(t * 3 + i) * 0.1; });
  say(komaranai, t, 0.3, 0, 3.0, 2.2, 1.7);
  setHud('PTAが消えて', '9月', 1); gymCam(1);
  return S;
}
function sNov(t, d) { // 11月。ボスママは気づく。私の出番が、どこにもない。
  reset(); lift(120); CHAIRS.forEach(c => c.visible = false); holdLot(BOSS); BOSS.userData.head.rotation.x = 0.25 * clamp(t / 1.2); banner.visible = t > d * 0.45 ? false : true;
  if (t > d * 0.45) say(deban, t, d * 0.45, 0.2, 2.3, -1.2, 1.1);
  setHud('PTAが消えて', '11月', 1);
  const u = ease(clamp(t / d)); look(lerp(3.0, 1.4, u), lerp(2.6, 2.0, u), lerp(4.7, 2.2, u), 0.1, 1.4, -1.2, 50);
  return S;
}
function sDads(t, d) { // 一方、毎年 妻に任せていた父親たち。
  reset(); lift(120); TENT.userData.setUp(0.3); TEACH.forEach((p, i) => { p.position.x = CX - 4.5 + i * 0.9; p.rotation.y = 0.6; });
  DADS.forEach((p, i) => { p.visible = true; const k = easeOut(clamp((t - 0.15 * i) / 1.5)); p.position.set(CX - 2.6 + i * 1.75, 0, lerp(6, 1.8, k)); p.rotation.y = Math.PI; poseWalkLite(p, t * 8 + i, 1 - k); });
  yardCam(0.3);
  return S;
}
function poseWalkLite(p, ph, amp) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.5 * amp; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5 * amp; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.4 * amp; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.4 * amp; }
function sTetsudau(t, d) { // 運動会のテント張りを、初めて手伝いに来る。
  reset(); lift(120); const k = ease(clamp((t - 0.4) / (d - 1.0))); TENT.userData.setUp(0.3 + 0.7 * k);
  const corners = [[-1.8, -1.3], [1.8, -1.3], [-1.8, 1.3], [1.8, 1.3]];
  DADS.forEach((p, i) => { p.visible = true; p.position.set(CX + corners[i][0] * 1.1, 0, -1 + corners[i][1] * 1.1); p.rotation.y = Math.atan2(-corners[i][0], -corners[i][1]); p.userData.arms.forEach(a => a.rotation.set(-2.4, 0, 0)); });
  TEACH.forEach((p, i) => { p.position.set(CX - 4.6 + i * 0.9, 0, 1.4); p.rotation.y = 0.5; });
  say(hajimete, t, 0.6, CX, 3.6, 1.0, 1.2);
  yardCam(0.6);
  return S;
}
function sAngai(t, d) { // 先生は言う。来てくれる人だけで、案外まわる。
  reset(); lift(120); TENT.userData.setUp(1);
  DADS.forEach((p, i) => { p.visible = true; p.position.set(CX - 3 + i * 2.0, 0, 1.5); p.rotation.y = 0; });
  TEACH.forEach((p, i) => { p.position.set(CX - 1.2 + i * 1.2, 0, 3.0); p.rotation.y = 0; }); TEACH[1].userData.arms[1].rotation.set(0, 0, 2.2);
  say(anngai, t, 0.6, CX, 3.2, 3.0, 1.2);
  look(CX + 0.2, 2.2, 9.4, CX, 1.6, 1.0, 50);
  return S;
}
function sKekka(t, d) { // 結果：PTAが消えて、一番困ったのは、PTAを仕切っていた人だった。
  reset(); lift(120); CHAIRS.forEach(c => c.visible = false); holdLot(BOSS); BOSS.userData.head.rotation.x = 0.3; banner.visible = false;
  if (t > d * 0.5) say(komatta, t, d * 0.5, 0.2, 2.3, -1.2, 1.3);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.8, u), lerp(2.4, 2.0, u), lerp(3.8, 2.6, u), 0.1, 1.5, -1.2, 50);
  return S;
}
function sOshiro(t, d) { // PTAは、ボスママが自分の居場所を守るための、学校の中のお城
  reset(); lift(120); CHAIRS.forEach(c => c.visible = false); holdLot(BOSS); BOSS.position.set(0, 0, 0.6); LOT.position.set(-0.45, 0.86, 0.95);
  CASTLE.visible = true; const k = easeOut(clamp((t - 0.3) / 1.0)); CASTLE.scale.set(1, Math.max(0.01, k), 1);
  banner.visible = false; if (t > 1.4) say(oshiro, t, 1.4, 0, 3.7, 0.6, 1.9);
  look(0.6, 4.2, 8.6, 0, 1.6, 0.6, 50);
  return S;
}
function sKamo(t, d) { // だったのかもしれない。
  reset(); lift(120); CHAIRS.forEach(c => c.visible = false); holdLot(BOSS); BOSS.position.set(0, 0, 0.6); LOT.position.set(-0.45, 0.86, 0.95); CASTLE.visible = true; banner.visible = false;
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.4, u), lerp(4.2, 4.8, u), lerp(8.6, 10.5, u), 0, 1.6, 0.6, 50);
  return S;
}
function sAsk(t) { // PTA、あったほうがいい？なくていい？（冒頭と同じ構図。椅子は消えたまま）
  reset(); lift(0); holdLot(BOSS); CHAIRS.forEach(c => c.visible = false); gymCam(0);
  return S;
}

const NARR = { 'PTA': 'ピーティーエー', '働く': 'はたらく', '不満': 'ふまん', '4月': 'しがつ', '6月': 'ろくがつ', '9月': 'くがつ', '11月': 'じゅういちがつ', '3人': 'さんにん', '役員決め': 'やくいんぎめ', '定時': 'ていじ', '汗だく': 'あせだく', '出番': 'でばん', '一方': 'いっぽう', '毎年': 'まいとし', '妻': 'つま', '案外': 'あんがい', '結果：': '結果、', '一番': 'いちばん', '仕切って': 'しきって', '居場所': 'いばしょ', '城': 'しろ' };
const P = planTimes([
  ['くじの箱を持ったボスママが、<br>空っぽの体育館で固まる。', sKatamaru],
  ['働くママたちの不満から。', sFuman],
  ['仕事を休んで、<br>くじを引かされていた。', sYasumi],
  ['4月。役員決めの<br>夜の会議がない。', sApril],
  ['ママたちは定時に<br>迎えに行ける。', sTeiji],
  ['6月。運動会のテントを、<br>誰が立てる？', sJune],
  ['先生が3人で汗だく。', sSensei],
  ['9月。バザーがない。', sSept],
  ['でも、困った人は<br>いなかった。', sKomaranai],
  ['11月。ボスママは気づく。<br>私の出番が、どこにもない。', sNov],
  ['一方、毎年 妻に<br>任せていた父親たち。', sDads],
  ['運動会のテント張りを、<br>初めて手伝いに来る。', sTetsudau],
  ['先生は言う。来てくれる<br>人だけで、案外まわる。', sAngai],
  ['結果：PTAが消えて、<br>一番困ったのは、', sKekka],
  ['PTAを仕切っていた人だった。', (t, d) => sKekka(t + 2.4, d + 2.4)],
  ['PTAは、ボスママが自分の<br>居場所を守るための、', sOshiro],
  ['学校の中のお城', (t, d) => sOshiro(t + 2.0, d)],
  ['だったのかもしれない。', sKamo],
  ['PTA、あったほうがいい？<br>なくていい？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0670',
    v2: true,
    tt: 'main',
    hookLine: '体育館に並んだ PTA役員決め のパイプ椅子が、一斉にパッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本からPTAが消えたら？',
    titleHtml: 'もしも日本から<br>PTAが<br>消えたら？',
    mood: 'tension', seed: 670, hits: [TP, P.at(13), P.at(16)], risers: [P.at(9)], impacts: [P.at(7, 0.4), P.at(9, 1.4), P.at(12, 0.6), P.at(16, 0.1)],
    sfx: [[TP, 'poof'], [P.at(0, 1.0), 'buzz'], [P.at(3, 0.4), 'poof'], [P.at(5, 0.5), 'whoosh'], [P.at(7, 0.4), 'poof'], [P.at(9, 0.4), 'meter', 0.4], [P.at(10, 0.2), 'whoosh'], [P.at(15, 0.3), 'whoosh']],
    narr: NARR,
    ask: 'PTA、あったほうがいい？なくていい？',
    caption: 'もしも日本からPTAが消えたら？\n\nくじの箱を持ったボスママが、空っぽの体育館で固まる。\n働くママたちの不満から。仕事を休んで、くじを引かされていた。\n4月。役員決めの夜の会議がない。ママたちは定時に迎えに行ける。\n6月。運動会のテントを、誰が立てる？ 先生が3人で汗だく。\n9月。バザーがない。でも、困った人はいなかった。\n11月。ボスママは気づく。私の出番が、どこにもない。\n一方、毎年 妻に任せていた父親たち。運動会のテント張りを、初めて手伝いに来る。\n先生は言う。来てくれる人だけで、案外まわる。\n\n結果：PTAが消えて、一番困ったのは、PTAを仕切っていた人だった。\nPTAは、ボスママが自分の居場所を守るための、学校の中のお城だったのかもしれない。\n\nPTA、あったほうがいい？なくていい？ コメントで教えて。\n\n※風刺ネタです。PTAが消えるのは、もしもの設定です。登場する人物・学校は架空です',
    hashtags: ['もしもラボ', 'もしも', 'PTA', 'ボスママ', '役員決め'],
    endStats: [['消えたもの', 'PTA', 'もしもの設定'], ['一番困ったのは', '仕切っていた人', 'もしもの結果'], ['PTAの正体', '学校の中のお城', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
