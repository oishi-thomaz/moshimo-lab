import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat, makeChair } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeTub, makeSteam, makeGlass } from '../scenes/home.js';
import { makeNomiya, setYokochoEnv } from '../scenes/yokocho.js';

// もしも日本から、スナックが消えたら？（皮肉回・台本 S150・図星／沼が消えたら）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。夜の路地でおぢがドアを開けた瞬間、スナックの看板の明かりが消える回。後半で キープボトルの本数を張り合っていた別のおぢ にも返す
// 数字は使わない（3回・週1回は筋の中の数）。実在の店・お酒の銘柄・ロゴは出さない（架空の スナック もしも）。ママや女性の客を笑わない・性的に見せない（叩くのは 毎晩同じ自慢を聞かせる おぢのふるまい）。
// お酒を飲む絵は楽しそうに見せすぎない。行き先は現実の規模（家に帰るだけ）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#1a1c2c', ground: '#3a3a44' }); hemi.intensity = 1.1;
const OJI = makeOji(rng(150), { shirt: '#7a6a55' }); S.add(OJI); const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const OJI2 = makeOji(rng(250), { shirt: '#59606e' }); S.add(OJI2); const sweat2 = makeSweat(); OJI2.userData.head.add(sweat2);
const MAMA = makeWoman({ shirt: '#8a5a7a', hair: '#4a3020', skin: '#f0cfb2' }); S.add(MAMA);
const GUESTS = [makeMan({ shirt: '#3f8f6b', hair: '#3a3330' }), makeWoman({ shirt: '#a8c8e8', hair: '#2a1a14' })]; GUESTS.forEach(p => S.add(p));
const WIFE = makeWoman({ shirt: '#c8a070', hair: '#5a4a3a', skin: '#f0cfb2' }); S.add(WIFE);
const DAUGHTER = makeWoman({ shirt: '#e8b0c8', hair: '#2a1a14' }); S.add(DAUGHTER);
const TAG = box(0.12, 0.18, 0.02, mat('#f4f0e4')); TAG.position.set(0, -0.66, 0.1); OJI.userData.arms[1].add(TAG);

// ---------- A：夜の路地（原点） ----------
flat(30, 6, '#33323c', 0, 0.5);
const SNACK = makeNomiya({ w: 3.4, h: 3.2, body: '#4a3a44', noren: '#4a2a4a', word: '', lantern: false }); SNACK.position.set(0, 0, -2.6); S.add(SNACK); SNACK.userData.setNoren(0);
const NEIGH = [makeNomiya({ body: '#5a4a3a', word: '酒' }), makeNomiya({ body: '#3a4a4a', word: '食' })]; NEIGH[0].position.set(-3.8, 0, -2.8); NEIGH[1].position.set(3.8, 0, -2.8); NEIGH.forEach(n => S.add(n));
const SIGNC = document.createElement('canvas'); SIGNC.width = 512; SIGNC.height = 384; const SIGNT = new THREE.CanvasTexture(SIGNC); SIGNT.colorSpace = THREE.SRGBColorSpace;
function drawSign(on) { const g = SIGNC.getContext('2d'); g.fillStyle = on ? '#fff4f8' : '#3a3640'; g.fillRect(0, 0, 512, 384); g.fillStyle = on ? '#c8306a' : '#5a5660'; g.font = '900 110px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('スナック', 256, 130); g.font = '900 96px "Noto Sans CJK JP"'; g.fillText('もしも', 256, 270); SIGNT.needsUpdate = true; }
const SIGN = new THREE.Group(); { const b = box(0.9, 0.7, 0.32, mat('#2a2a2a')); b.position.y = 0.95; SIGN.add(b); for (const z of [0.165, -0.165]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.63), new THREE.MeshBasicMaterial({ map: SIGNT })); f.position.set(0, 0.95, z); if (z < 0) f.rotation.y = Math.PI; SIGN.add(f); } const leg = box(0.1, 0.6, 0.1, mat('#2a2a2a')); leg.position.y = 0.3; SIGN.add(leg); } SIGN.position.set(1.3, 0, -1.3); SIGN.rotation.y = -0.4; S.add(SIGN);
const SLIGHT = new THREE.PointLight(0xff8ab8, 0, 5, 1.6); SLIGHT.position.set(1.0, 1.2, -0.2); S.add(SLIGHT);
const sparkA = makeSparkles(150, 0.1, 0xffc8e0); S.add(sparkA.points); sparkA.init([[1.3, 1.0, -1.3]], 0.6, 0.6);
const kieta = label('スナック 消滅', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(kieta);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const kikiyaku = label('有料の 聞き役', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.9 }); S.add(kikiyaku);

// ---------- B：スナックの中（x=60） ----------
const BX = 60;
room({ x: BX, w: 7, d: 5, h: 3, wall: '#5a3a4a', floor: '#3a2a2a' });
const CNT = makeTable({ w: 3.2, d: 0.6, h: 1.05, color: '#6a3a2a' }); CNT.position.set(BX, 0, -1.2); S.add(CNT);
const SHELF = new THREE.Group(); { const b = box(3.4, 0.05, 0.3, mat('#8a5a3a')); b.position.y = 1.9; SHELF.add(b); const b2 = box(3.4, 0.05, 0.3, mat('#8a5a3a')); b2.position.y = 1.45; SHELF.add(b2); } SHELF.position.set(BX, 0, -2.3); S.add(SHELF);
const BOTTLES = []; { for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.32, 10), mat(['#3a6a3a', '#6a3a1a', '#2a3a5a', '#5a5a2a'][i % 4])); b.position.y = 0.16; g.add(b); const n = box(0.08, 0.1, 0.01, mat('#f4f0e4')); n.position.set(0, 0.14, 0.07); g.add(n); g.position.set(BX - 1.5 + (i % 7) * 0.5, i < 7 ? 1.47 : 1.92, -2.25); S.add(g); BOTTLES.push(g); } }
const BLAMP = new THREE.PointLight(0xffb0c8, 5, 7, 1.4); BLAMP.position.set(BX, 2.5, 0.5); S.add(BLAMP);
const STOOLS = []; for (let i = 0; i < 3; i++) { const g = new THREE.Group(); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), mat('#8a2a3a')); st.position.y = 0.72; g.add(st); const l = box(0.05, 0.72, 0.05, mat('#2a2a2a')); l.position.y = 0.36; g.add(l); g.position.set(BX - 1.0 + i * 1.0, 0, -0.5); S.add(g); STOOLS.push(g); }
const mukashi = label('昔はな…', { w: 512, size: 110, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 0.6 }); S.add(mukashi);
const sankai = label('同じ武勇伝 3回目', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.05 }); S.add(sankai);
const jiman = label('自慢する相手 いない', { w: 1000, size: 92, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.15 }); S.add(jiman);
const demo = label('困ったのは おぢだけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(demo);
const RANK = makePhone({ w: 1.0, h: 1.3, cw: 400, ch: 520 }); S.add(RANK.g);
RANK.draw('r', (g, W, H) => { g.fillStyle = '#2a1a22'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd27a'; g.font = '900 52px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ボトルの本数', W / 2, 60); [['おぢ', 5], ['おぢ2', 4]].forEach(([n, c], i) => { g.fillStyle = '#fff'; g.font = '900 46px "Noto Sans CJK JP"'; g.textAlign = 'left'; g.fillText(n, 24, 170 + i * 150); for (let k = 0; k < c; k++) { g.fillStyle = '#5a9a5a'; g.fillRect(170 + k * 42, 130 + i * 150, 30, 80); } }); });

// ---------- C：おぢの家（x=120） ----------
const CX = 120;
room({ x: CX, w: 7, d: 5, h: 2.8, wall: '#efe6d6', floor: '#b48a5e' });
const DT = makeTable({ w: 1.6, d: 0.9 }); DT.position.set(CX, 0, -1.0); S.add(DT);
const CHS = [0, 1, 2].map(() => { const c = makeChair(); S.add(c); return c; });
const MEAL = []; for (let i = 0; i < 3; i++) { const g = new THREE.Group(); const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.08, 12), mat('#f4f0ea')); g.add(bw); const r = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), mat('#fafaf4')); r.position.y = 0.04; r.scale.y = 0.5; g.add(r); g.position.set(CX - 0.5 + i * 0.5, 0.79, -1.0 + (i === 1 ? -0.2 : 0.15)); S.add(g); MEAL.push(g); }
const CLOCK = label('20:00', { w: 512, size: 120, color: '#7dff8a', bg: 'rgba(20,22,28,.96)', sx: 0.6 }); S.add(CLOCK);
const ie = label('夜8時に 家', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.8 }); S.add(ie);
const kikanai = label('だれも 聞かない', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.9 }); S.add(kikanai);
const yameru = label('言いかけて やめる', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(yameru);
const ikkai = label('昔の話を 1回だけ', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(ikkai);
const saigo = label('初めて 最後まで聞く', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.15 }); S.add(saigo);
const PHS = [0, 1].map(() => { const P = makePhone({ w: 0.16, h: 0.32 }); S.add(P.g); return P; });

// ---------- D：お風呂（x=180） ----------
const DX = 180;
room({ x: DX, w: 4, d: 4, h: 2.6, wall: '#bcd8e4', floor: '#8aa8b8', left: true, right: true });
const TUB = makeTub(); TUB.position.set(DX, 0, -1.2); TUB.userData.setWater(1); S.add(TUB);
const STEAM = makeSteam(18, { w: 1.4, d: 0.6, h: 1.6 }); STEAM.position.set(DX, 0.5, -1.2); S.add(STEAM);
const NOTE = label('♪', { w: 256, h: 256, size: 200, color: '#3a6ab2', sx: 0.35 }); S.add(NOTE);
const ohuro = label('十八番は お風呂で', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(ohuro);

const PEOPLE = [OJI, OJI2, MAMA, ...GUESTS, WIFE, DAUGHTER];
const LABELS = [kieta, katamaru, kikiyaku, mukashi, sankai, jiman, demo, CLOCK, ie, kikanai, yameru, ikkai, saigo, NOTE, ohuro];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; p.userData.legs.forEach(l => l.visible = true); });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); sweat2.userData.set(0);
  setSign(true); TAG.visible = true; CHS.forEach(c => c.visible = false); MEAL.forEach(m => m.visible = false); PHS.forEach(P => P.g.visible = false); RANK.g.visible = false; STEAM.userData.set(0); hemi.intensity = 1.1;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function seat(p, x, z, ry, ch) { stand(p, x, z, ry); poseSit(p); if (ch) { ch.visible = true; ch.position.set(x - Math.sin(ry) * 0.1, 0, z - Math.cos(ry) * 0.1); ch.rotation.y = ry; } }
const TP = 0.3;
let signState = null;
function setSign(on) { if (signState !== on) { drawSign(on); signState = on; } SLIGHT.intensity = on ? 4 : 0; SNACK.userData.light(on ? 1 : 0); }
function ojiDoor(reach = 1) { stand(OJI, -0.35, -0.9, Math.PI * 0.85); OJI.userData.arms[0].rotation.set(-1.2 * reach, 0, 0); OJI.userData.arms[1].rotation.set(-0.5, 0, 0.2); }
function alleyCam(u = 0) { look(lerp(0.5, 0.4, u), lerp(1.45, 1.4, u), lerp(4.6, 4.2, u), 0.3, 1.75, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：夜の路地で、おぢがドアを開けた瞬間、スナックの看板の明かりがパッと消える
  reset(); lift(0); ojiDoor(); signState = null; setSign(t < TP);
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; say(kieta, t, TP + 0.15, 0.6, 0.55, 0.3, 0.85); }
  alleyCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // キープボトルの札を握ったおぢが、暗い入口で固まる
  reset(); lift(140); setSign(false); stand(OJI, -0.2, -0.6, 0.2); OJI.userData.arms[1].rotation.set(-1.2, 0, 0.1); sweatO.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, 0.3, 2.15, -0.6, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), 1.65, lerp(3.0, 2.6, u), -0.1, 1.45, -0.8, 50);
  return S;
}
function barCam(u = 0) { look(BX + lerp(0.3, 0.1, u), 1.8, lerp(4.4, 4.0, u), BX, 1.4, -1.2, 50); }
function barSeat() { seat(OJI, BX - 1.0, -0.4, Math.PI); OJI.position.y = -0.39 + 0.3; OJI.userData.arms[1].rotation.set(-0.8, 0, 0.2); stand(MAMA, BX - 0.2, -1.8, 0); MAMA.userData.arms.forEach(a => a.rotation.set(-0.5, 0, 0)); }
function sFuman(t, d) { // ママと客たちの不満から。毎晩、同じ武勇伝を3回聞かされる
  reset(); lift(140); barSeat(); GUESTS.forEach((p, i) => { seat(p, BX + 0.2 + i * 0.9, -0.4, Math.PI - 0.5); p.position.y = -0.39 + 0.3; p.userData.head.rotation.y = 0.4; });
  say(mukashi, t, 0.2, BX - 1.3, 2.0, -0.2, 0.6); if (t > d * 0.5) say(sankai, t, d * 0.5, BX, 2.3, -0.4, 1.0);
  look(BX - 0.2, 2.7, 3.8, BX - 0.1, 1.3, -1.2, 50);
  return S;
}
function homeCam(u = 0) { look(CX + lerp(0.3, 0.1, u), 2.0, lerp(3.4, 3.0, u), CX, 1.0, -1.0, 50); }
function sMon(t, d) { // 月曜。おぢは、夜8時に家で晩ごはんを食べる
  reset(); lift(140); seat(OJI, CX - 0.2, -0.3, Math.PI, CHS[0]); OJI.userData.arms[1].rotation.set(-1.0, 0, 0); seat(WIFE, CX + 0.5, -1.7, 0, CHS[1]); MEAL.forEach(m => m.visible = true);
  CLOCK.visible = true; CLOCK.position.set(CX + 0.6, 2.2, -2.4); CLOCK.userData.size(0.5); CLOCK.userData.set('20:00');
  if (t > d * 0.45) say(ie, t, d * 0.45, CX - 0.3, 2.25, -1.4, 0.75);
  setHud('スナックが消えて', '月曜', 1); homeCam(ease(clamp(t / d)));
  return S;
}
function sWed(t, d) { // 水曜。十八番を歌う場所がなく、お風呂で小さく歌う
  reset(); lift(140); OJI.visible = true; OJI.position.set(DX - 0.2, 0, -1.1); poseSit(OJI); OJI.position.y = -0.6; OJI.userData.legs.forEach(l => l.visible = false); OJI.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0)); TAG.visible = false; STEAM.userData.set(1, t);
  NOTE.visible = true; NOTE.position.set(DX + 0.3 + Math.sin(t * 2) * 0.1, 1.55 + (t % 1) * 0.3, -1.0); NOTE.userData.size(0.3);
  if (t > d * 0.45) say(ohuro, t, d * 0.45, DX, 2.05, -1.0, 0.95);
  setHud('スナックが消えて', '水曜', 1);
  look(DX + 0.6, 1.5, 2.4, DX - 0.1, 0.9, -1.2, 50);
  return S;
}
function family(phones = true) { seat(OJI, CX - 0.2, -0.3, Math.PI, CHS[0]); TAG.visible = false; seat(WIFE, CX + 0.5, -1.7, 0, CHS[1]); seat(DAUGHTER, CX - 0.6, -1.7, 0, CHS[2]); MEAL.forEach(m => m.visible = true);
  if (phones) [WIFE, DAUGHTER].forEach((p, i) => { p.userData.arms[1].rotation.set(-1.3, 0, 0.2); p.userData.head.rotation.x = 0.35; p.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.0, 0.4); p.localToWorld(v); PHS[i].g.visible = true; PHS[i].g.position.copy(v); PHS[i].g.rotation.y = Math.PI; }); }
function sFri(t, d) { // 金曜。昔の話を、だれも聞いてくれない
  reset(); lift(140); family(true); OJI.userData.arms[0].rotation.set(-1.0, 0, -0.3 + Math.sin(t * 5) * 0.2); say(mukashi, t, 0.2, CX - 0.2, 2.05, -0.2, 0.55);
  if (t > d * 0.5) say(kikanai, t, d * 0.5, CX, 2.45, -1.4, 0.9);
  setHud('スナックが消えて', '金曜', 1); homeCam(0.5);
  return S;
}
function sDemo(t, d) { // でも、困ったのは、おぢだけじゃなかった
  reset(); lift(140); setSign(false); stand(OJI2, 0.4, -0.4, 0.1); OJI2.userData.arms[1].rotation.set(-0.3, 0, 0.2);
  if (t > d * 0.35) say(demo, t, d * 0.35, 0.3, 2.45, -0.6, 1.3);
  alleyCam(0.6);
  return S;
}
function sOji2(t, d) { // キープボトルの本数で、常連の順番を張り合っていた別のおぢも、自慢する相手がいなくなる
  reset(); lift(140); const ph = t / d;
  if (ph < 0.55) { RANK.g.visible = true; RANK.g.position.set(BX + 0.9, 1.6, -1.6); seat(OJI2, BX - 0.4, -0.4, Math.PI); OJI2.position.y = -0.39 + 0.3; seat(OJI, BX - 1.2, -0.4, Math.PI); OJI.position.y = -0.39 + 0.3; barCam(ph); return S; }
  setSign(false); stand(OJI2, 0.4, -0.4, 0.1); sweat2.userData.set(1, t); say(jiman, t, d * 0.58, 0.3, 2.45, -0.6, 1.1); alleyCam(0.8);
  return S;
}
function sYameru(t, d) { // おぢは、家で、同じ話を言いかけて、やめる
  reset(); lift(140); family(false); const ph = t / d; OJI.userData.arms[0].rotation.set(ph < 0.5 ? -1.0 : -0.2, 0, -0.3);
  if (ph < 0.5) say(mukashi, t, 0.2, CX - 0.2, 2.05, -0.2, 0.55); else say(yameru, t, d * 0.5, CX, 2.45, -1.4, 1.0);
  homeCam(0.6);
  return S;
}
function sSun(t, d) { // 日曜。娘に、昔の話を1回だけする
  reset(); lift(140); seat(OJI, CX - 0.2, -0.3, Math.PI, CHS[0]); TAG.visible = false; seat(DAUGHTER, CX - 0.6, -1.7, 0, CHS[2]); OJI.userData.arms[0].rotation.set(-0.8, 0, -0.3 + Math.sin(t * 3) * 0.15);
  if (t > d * 0.45) say(ikkai, t, d * 0.45, CX, 2.45, -1.4, 1.0);
  setHud('スナックが消えて', '日曜', 1); homeCam(0.7);
  return S;
}
function sSaigo(t, d) { // 娘は、その話を、初めて最後まで聞く
  reset(); lift(140); seat(OJI, CX - 0.2, -0.3, Math.PI, CHS[0]); TAG.visible = false; seat(DAUGHTER, CX - 0.6, -1.7, 0, CHS[2]); DAUGHTER.userData.head.rotation.x = -0.1; DAUGHTER.userData.head.rotation.z = Math.sin(t * 3) * 0.06;
  if (t > d * 0.45) say(saigo, t, d * 0.45, CX - 0.2, 2.35, -1.2, 1.1);
  look(CX + 2.4, 1.8, 0.6, CX - 0.4, 1.1, -1.0, 50);
  return S;
}
function sKekka(t, d) { // 結果：スナックが消えて、おぢの武勇伝は毎晩3回から週1回になった。でもその1回を、初めて家族が最後まで聞いた
  reset(); lift(140); const ph = t / d;
  if (ph < 0.6) { setSign(false); ojiDoor(0); setTop('結果', '武勇伝 毎晩3回→週1回', fade(t, 0.3, d * 0.6, 0.25), GOLD); alleyCam(0.5); return S; }
  seat(OJI, CX - 0.2, -0.3, Math.PI, CHS[0]); TAG.visible = false; seat(DAUGHTER, CX - 0.6, -1.7, 0, CHS[2]); seat(WIFE, CX + 0.5, -1.7, 0, CHS[1]); setTop('その1回を', '家族が最後まで聞いた', fade(t, d * 0.6, d, 0.25), GREEN); homeCam(0.8);
  return S;
}
function sKikiyaku(t, d) { // スナックのママは、お酒を出す人じゃなく、同じ話を何度でも聞いてくれる、有料の聞き役だったのかもしれない
  reset(); lift(140); setSign(false); stand(OJI, -0.2, -0.6, 0.2); OJI.userData.head.rotation.x = 0.3;
  if (t > d * 0.45) say(kikiyaku, t, d * 0.45, 0.3, 2.45, -0.6, 0.9);
  alleyCam(0.4 + 0.6 * ease(clamp(t / d)));
  return S;
}
function sAsk(t) { reset(); lift(0); ojiDoor(); setSign(false); alleyCam(0); return S; }

const NARR = { '札': 'ふだ', '握った': 'にぎった', '暗い': 'くらい', '入口': 'いりぐち', '固まる': 'かたまる', '客': 'きゃく', '不満': 'ふまん', '毎晩': 'まいばん', '同じ': 'おなじ', '武勇伝': 'ぶゆうでん', '3回': 'さんかい', '聞かされる': 'きかされる', '月曜': 'げつよう', '夜8時': 'よるはちじ', '家': 'いえ', '晩ごはん': 'ばんごはん', '食べる': 'たべる', '水曜': 'すいよう', '十八番': 'おはこ', '歌う': 'うたう', '場所': 'ばしょ', '小さく': 'ちいさく', '金曜': 'きんよう', '昔の話': 'むかしのはなし', '聞いてくれない': 'きいてくれない', '困った': 'こまった', '本数': 'ほんすう', '常連': 'じょうれん', '順番': 'じゅんばん', '張り合っていた': 'はりあっていた', '別の': 'べつの', '自慢': 'じまん', '相手': 'あいて', '話': 'はなし', '言いかけて': 'いいかけて', '日曜': 'にちよう', '娘': 'むすめ', '1回だけ': 'いっかいだけ', '初めて': 'はじめて', '最後': 'さいご', '聞く': 'きく', '結果：': '結果、', '週1回': 'しゅういっかい', '1回': 'いっかい', '家族': 'かぞく', '聞いた': 'きいた', '出す人': 'だすひと', '何度でも': 'なんどでも', '有料': 'ゆうりょう', '聞き役': 'ききやく', '何回も': 'なんかいも' };
const P = planTimes([
  ['キープボトルの札を握ったおぢが、', (t, d) => sKatamaru(t, 2 * d)],
  ['暗い入口で固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['ママと客たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['毎晩、同じ武勇伝を<br>3回聞かされる。', (t, d) => sFuman(t + d, 2 * d)],
  ['月曜。おぢは、夜8時に<br>家で晩ごはんを食べる。', sMon],
  ['水曜。十八番を歌う場所がなく、<br>お風呂で小さく歌う。', sWed],
  ['金曜。昔の話を、<br>だれも聞いてくれない。', sFri],
  ['でも、困ったのは、<br>おぢだけじゃなかった。', sDemo],
  ['キープボトルの本数で、常連の', (t, d) => sOji2(t, 3 * d)],
  ['順番を張り合っていた<br>別のおぢも、', (t, d) => sOji2(t + d, 3 * d)],
  ['自慢する相手がいなくなる。', (t, d) => sOji2(t + 2 * d, 3 * d)],
  ['おぢは、家で、同じ話を<br>言いかけて、やめる。', sYameru],
  ['日曜。娘に、昔の話を<br>1回だけする。', sSun],
  ['娘は、その話を、<br>初めて最後まで聞く。', sSaigo],
  ['結果：スナックが消えて、', (t, d) => sKekka(t, 3 * d)],
  ['おぢの武勇伝は毎晩3回から<br>週1回になった。', (t, d) => sKekka(t + d, 3 * d)],
  ['でもその1回を、<br>初めて家族が最後まで聞いた。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['スナックのママは、<br>お酒を出す人じゃなく、', (t, d) => sKikiyaku(t, 3 * d)],
  ['同じ話を何度でも聞いてくれる、', (t, d) => sKikiyaku(t + d, 3 * d)],
  ['有料の聞き役だった<br>のかもしれない。', (t, d) => sKikiyaku(t + 2 * d, 3 * d)],
  ['同じ話を何回もする人、<br>まわりにいる？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0750',
    v2: true,
    tt: 'main',
    hookLine: '夜の路地で、おぢがドアを開けた瞬間、スナックの看板の明かりがパッと消える。',
    series: '沼が消えたら',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも日本から、スナックが消えたら？',
    titleHtml: 'もしも日本から、<br>スナックが<br>消えたら？',
    mood: 'mystery', seed: 750, hits: [TP, P.at(14), P.at(19)], risers: [P.at(7)], impacts: [P.at(15, 0.5), P.at(16, 0.5)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.2], [P.at(3, 0.6), 'alarm'], [P.at(5, 0.6), 'bubble'], [P.at(10, 0.4), 'poof'], [P.at(13, 0.6), 'whoosh']],
    narr: NARR,
    ask: '同じ話を何回もする人、まわりにいる？',
    caption: 'もしも日本から、スナックが消えたら？\n\nキープボトルの札を握ったおぢが、暗い入口で固まる。\nママと客たちの不満から。毎晩、同じ武勇伝を3回聞かされる。\n月曜。おぢは、夜8時に家で晩ごはんを食べる。\n水曜。十八番を歌う場所がなく、お風呂で小さく歌う。\n金曜。昔の話を、だれも聞いてくれない。\nでも、困ったのは、おぢだけじゃなかった。\nキープボトルの本数で、常連の順番を張り合っていた別のおぢも、自慢する相手がいなくなる。\nおぢは、家で、同じ話を言いかけて、やめる。\n日曜。娘に、昔の話を1回だけする。\n娘は、その話を、初めて最後まで聞く。\n\n結果：スナックが消えて、おぢの武勇伝は毎晩3回から週1回になった。でもその1回を、初めて家族が最後まで聞いた。\nスナックのママは、お酒を出す人じゃなく、同じ話を何度でも聞いてくれる、有料の聞き役だったのかもしれない。\n\n同じ話を何回もする人、まわりにいる？ コメントで教えて。\n\n※風刺ネタです。スナックが消えるのは、もしもの設定です。お店・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'スナック', 'おぢ', '沼が消えたら'],
    endStats: [['おぢの武勇伝', '毎晩3回→週1回', 'もしもの結果'], ['その1回を', '家族が最後まで聞いた', 'もしもの結果'], ['ママの正体', '有料の聞き役', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
