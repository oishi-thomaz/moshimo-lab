import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, posePoint, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable } from '../scenes/home.js';
import { makeHanko, hankoSlam, makeMark, makeDoc } from '../scenes/hanko.js';

// もしも日本から、謎マナーが消えたら？（皮肉回・台本 S138・社会の消えたら）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。ハンコはお辞儀させなさい と去年までなかったマナーで新人を叱るお局が、謎マナーの本が消えて固まる回。後半で 研修を毎年頼んでいた部長 にも返す
// 数字は使わない。実在のマナー講師・会社・ロゴは出さない。礼儀そのものをばかにしない（叩くのは 根拠のないマナーで叱る ふるまい）。若い女性は笑われる側にしない（新人は男女どちらも叱られる側）

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d0dc', ground: '#8a8f99' }); hemi.intensity = 1.3;

// 人
const OTSUBONE = makeSuit({ woman: true, jacket: '#6a3a4a', hair: '#4a3028', glasses: true }); S.add(OTSUBONE); const sweatO = makeSweat(); OTSUBONE.userData.head.add(sweatO);
const SHINJIN = [makeSuit({ jacket: '#2e3442', tie: '#3a6ab2' }), makeSuit({ woman: true, jacket: '#3a3f4e', hair: '#2a1a14' })]; SHINJIN.forEach(p => S.add(p));
const BUCHO = makeSuit({ old: true, bald: true, jacket: '#2a2e38', tie: '#7a2a2a' }); S.add(BUCHO); const sweatB = makeSweat(); BUCHO.userData.head.add(sweatB);
const SENPAI = makeSuit({ jacket: '#3a5a6a', tie: '#c89a3a' }); S.add(SENPAI);
// 謎マナーの本（分厚い）
const BOOK = new THREE.Group(); { const b = box(0.5, 0.7, 0.22, mat('#7a2a3a')); BOOK.add(b); const pg = box(0.46, 0.66, 0.2, mat('#f4efe2')); pg.position.x = 0.03; BOOK.add(pg); } S.add(BOOK);
const BOOK_L = label('謎マナー', { w: 512, size: 110, color: '#fff', bg: 'rgba(122,42,58,.98)', sx: 0.6 }); S.add(BOOK_L);
const sparkA = makeSparkles(140, 0.1, 0xfff2c0); S.add(sparkA.points);

// ---------- A：オフィス（原点） ----------
room({ x: 0, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(-3.2 + i * 3.2, 2.0, -3.4); S.add(w); }
const ISL = makeDeskIsland(3); ISL.position.set(0, 0, -1.0); S.add(ISL); const SEATS = ISL.userData.seats;
const ojigi = label('ハンコは お辞儀させ…', { w: 1024, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(ojigi);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const kiitakoto = label('聞いたこともない マナー', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(kiitakoto);
const mainichi = label('毎日 叱られる', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(mainichi);
// 月曜：書類とハンコ
const DOC = makeDoc({ title: '稟議書', rows: ['担当', '課長', '部長'], head: '#3a6ab2', w: 1.1, h: 1.3 }); DOC.rotation.x = -Math.PI / 2; S.add(DOC);
const HANKO = makeHanko(); HANKO.scale.setScalar(0.2); S.add(HANKO);
const MARK = makeMark('新人', { sx: 0.3 }); MARK.material.rotation = 0; S.add(MARK);
const massugu = label('まっすぐ', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.75 }); S.add(massugu);
// 金曜：メール
const MAILSCR = (() => { const c = document.createElement('canvas'); c.width = 640; c.height = 400; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 640, 400); g.fillStyle = '#3a6ab2'; g.fillRect(0, 0, 640, 70); g.fillStyle = '#fff'; g.font = '900 40px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('メール', 320, 36); g.fillStyle = '#222'; g.font = '900 64px "Noto Sans CJK JP"'; g.fillText('取り急ぎ', 320, 180); g.fillStyle = '#888'; g.font = '800 40px "Noto Sans CJK JP"'; g.fillText('ご報告まで', 320, 290); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ map: tex })); })(); S.add(MAILSCR);
const yobidashi = label('呼び出し 0', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(yobidashi);
const kotsu = label('仕事のコツ', { w: 640, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.9 }); S.add(kotsu);
const kiku = label('先輩に 聞く', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(kiku);
const arigato = label('本気の ありがとうございます', { w: 1200, size: 86, color: '#fff', bg: 'rgba(214,90,140,.97)', sx: 1.5 }); S.add(arigato);

// ---------- B：宴会（x=60）：とっくり ----------
const BX = 60;
room({ x: BX, w: 9, d: 6, h: 3.0, wall: '#e8dcc8', floor: '#b8a070' });
const ZEN = makeTable({ w: 2.2, d: 1.0, h: 0.35, color: '#6a3a22' }); ZEN.position.set(BX, 0, -1.2); S.add(ZEN);
const TOKKURI = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat('#f0ece0')); b.scale.y = 1.2; b.position.y = 0.18; TOKKURI.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 12), mat('#f0ece0')); n.position.y = 0.42; TOKKURI.add(n); const lip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.06, 8), mat('#f0ece0')); lip.rotation.z = Math.PI / 2; lip.position.set(0.06, 0.52, 0); TOKKURI.add(lip); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.05, 16), mat('#3a5a9a')); band.position.y = 0.2; TOKKURI.add(band); } S.add(TOKKURI);
const CHOKO = [0, 1, 2].map(i => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.07, 12), mat('#f0ece0')); c.position.set(BX - 0.5 + i * 0.5, 0.42, -1.0); S.add(c); return c; });
const kinishinai = label('だれも 気にしない', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(kinishinai);

// ---------- C：部長と研修の時間割（x=120） ----------
const CX = 120;
room({ x: CX, w: 9, d: 6, h: 3.0, wall: '#e6e9ee', floor: '#7d8798' });
const BOARD = makeDoc({ title: '新人研修', rows: ['1日目', '2日目', '3日目', '4日目'], head: '#7a2a3a', w: 1.5, h: 1.9 }); BOARD.position.set(CX + 0.6, 1.6, -2.9); S.add(BOARD);
const demo = label('困ったのは お局だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(demo);
const hanbun = label('時間割が 半分空く', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.15 }); S.add(hanbun);
const fumidai = label('先に高い所に立つ 踏み台', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(fumidai);
const STEP = new THREE.Group(); { const b = box(0.9, 0.5, 0.7, mat('#7a2a3a')); b.position.y = 0.25; STEP.add(b); const pg = box(0.86, 0.46, 0.66, mat('#f4efe2')); pg.position.set(0.03, 0.25, 0); STEP.add(pg); } S.add(STEP);
const STEP_L = label('謎マナー', { w: 512, size: 110, color: '#fff', bg: 'rgba(122,42,58,.98)', sx: 0.5 }); S.add(STEP_L);

const PEOPLE = [OTSUBONE, ...SHINJIN, BUCHO, SENPAI];
const LABELS = [BOOK_L, ojigi, katamaru, kiitakoto, mainichi, massugu, yobidashi, kotsu, kiku, arigato, kinishinai, demo, hanbun, fumidai, STEP_L];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); sweatB.userData.set(0);
  BOOK.visible = false; DOC.visible = false; HANKO.visible = false; MARK.visible = false; MAILSCR.visible = false; TOKKURI.visible = false; STEP.visible = false; BOOK.scale.setScalar(1);
  ['', '', '', ''].forEach((s, i) => BOARD.userData.fill(i, s)); ISL.userData.monitors.forEach(m => m.visible = true);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function sit(p, si) { const s = SEATS[si]; stand(p, s.x, -1.0 + s.z, s.ry); poseSit(p); p.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); }
const TP = 0.3;
function scold(t) { stand(OTSUBONE, 0.75, 0.6, -0.5); OTSUBONE.userData.arms[1].rotation.set(-2.5, 0, 0.1); stand(SHINJIN[0], -0.55, 0.45, 0.6); SHINJIN[0].userData.head.rotation.x = 0.25; }
function bookInHand(k = 0) { OTSUBONE.updateMatrixWorld(); const v = new THREE.Vector3(-0.3, 1.0, 0.3); OTSUBONE.localToWorld(v); BOOK.visible = k < 1; BOOK.position.copy(v); BOOK.rotation.y = OTSUBONE.rotation.y; BOOK.scale.setScalar(Math.max(0.001, 1 - easeOut(k))); OTSUBONE.userData.arms[0].rotation.set(-0.9, 0, -0.3); }
function mainCam(u = 0) { look(lerp(0.15, 0.1, u), lerp(1.85, 1.8, u), lerp(6.0, 5.6, u), 0.1, 1.4, 0.3, 50); }
function shot0(t) { // 0秒＝サムネ：新人を叱ろうとしたお局の手から、分厚い 謎マナーの本 がパッと消える
  reset(); lift(0); scold(t); const k = clamp((t - TP) / 0.18); bookInHand(k);
  if (k < 1) { BOOK_L.visible = true; BOOK_L.position.set(BOOK.position.x, BOOK.position.y + 0.55, BOOK.position.z + 0.1); BOOK_L.userData.size(0.5 * (1 - k)); }
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; }
  mainCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
{ OTSUBONE.position.set(0.75, 0, 0.6); OTSUBONE.rotation.y = -0.5; OTSUBONE.updateMatrixWorld(); const v = new THREE.Vector3(-0.3, 1.0, 0.3); OTSUBONE.localToWorld(v); sparkA.init([[v.x, v.y, v.z]], 0.5, 0.7); }
function sKatamaru(t, d) { // ハンコはお辞儀させなさい と言いかけたお局が、指を立てたまま固まる
  reset(); lift(140); scold(t); OTSUBONE.userData.arms[0].rotation.set(-0.9, 0, -0.3);
  say(ojigi, t, 0.2, 0.75, 2.35, 0.6, 1.0); if (t > d * 0.55) { sweatO.userData.set(1, t); say(katamaru, t, d * 0.55, 0.3, 2.0, 0.6, 0.38); }
  const u = ease(clamp(t / d)); look(lerp(-0.3, -0.5, u), 1.8, lerp(3.0, 2.6, u), 0.6, 1.55, 0.5, 50);
  return S;
}
function sFuman(t, d) { // 新人たちの不満から。去年まで聞いたこともないマナーで、毎日叱られる
  reset(); lift(140); sit(SHINJIN[0], 0); sit(SHINJIN[1], 2); stand(OTSUBONE, 0.6, 0.4, 0.2); posePoint(OTSUBONE, 1);
  say(kiitakoto, t, 0.3, -0.4, 2.55, -1.3, 1.5); if (t > d * 0.55) say(mainichi, t, d * 0.55, -0.6, 2.0, -1.3, 0.85);
  look(-0.2, 2.3, 4.8, -0.2, 1.3, -1.0, 50);
  return S;
}
function sMon(t, d) { // 月曜。ハンコが、まっすぐ押される
  reset(); lift(160); ISL.userData.monitors.forEach(m => m.visible = false); const x = SEATS[1].x, z = -1.0 + 0.45; DOC.visible = true; DOC.position.set(x, TABLE_Y + 0.07, z); DOC.rotation.z = 0;
  DOC.userData.fill(0, ''); HANKO.visible = true; const done = hankoSlam(HANKO, [x + 0.22, TABLE_Y + 0.08, z - 0.15], t, 0.8, { from: 1.0, up: 0.8 });
  if (done) { MARK.visible = true; MARK.position.set(x + 0.22, TABLE_Y + 0.1, z - 0.15); MARK.userData.size(0.3); say(massugu, t, 1.1, x - 0.2, TABLE_Y + 0.5, z - 0.45, 0.35); }
  setHud('謎マナーが消えて', '月曜', 1);
  look(x + 0.05, TABLE_Y + 2.0, z + 0.9, x + 0.05, TABLE_Y, z - 0.2, 50);
  return S;
}
function sWed(t, d) { // 水曜。とっくりの注ぎ口の向きを、だれも気にしない
  reset(); lift(160); stand(SHINJIN[0], BX - 0.7, -0.35, Math.PI * 0.85); poseSit(SHINJIN[0]); SHINJIN[0].position.y -= 0.12; SHINJIN[0].userData.arms[1].rotation.set(-1.2, 0, 0.3);
  stand(OTSUBONE, BX + 0.7, -0.35, -Math.PI * 0.85); poseSit(OTSUBONE); OTSUBONE.position.y -= 0.12; OTSUBONE.userData.head.rotation.x = 0.1;
  const k = clamp((t - 0.3) / 0.6); TOKKURI.visible = true; TOKKURI.position.set(BX - 0.25, 0.38 + k * 0.12, -1.0); TOKKURI.rotation.z = -0.9 * k;
  if (t > d * 0.45) say(kinishinai, t, d * 0.45, BX, 1.85, -1.2, 1.0);
  setHud('謎マナーが消えて', '水曜', 1);
  look(BX + 0.1, 1.6, 1.6, BX, 0.5, -1.1, 50);
  return S;
}
function sFri(t, d) { // 金曜。メールの 取り急ぎ で、だれも呼び出されない
  reset(); lift(160); const s = SEATS[2]; sit(SHINJIN[1], 2); const mon = ISL.userData.monitors[2];
  ISL.userData.monitors.forEach(m => m.visible = false); MAILSCR.visible = true; MAILSCR.position.set(s.x + 0.15, 2.05, -1.0 + s.z - 0.4); MAILSCR.rotation.set(0, 0, 0); MAILSCR.scale.setScalar(0.7);
  if (t > d * 0.45) say(yobidashi, t, d * 0.45, s.x + 0.15, 2.65, -1.0 + s.z - 0.3, 0.75);
  setHud('謎マナーが消えて', '金曜', 1);
  look(s.x + 0.1, 2.0, 1.6, s.x + 0.1, 1.6, -1.6, 50);
  return S;
}
function sDemo(t, d) { // でも、困ったのは、お局だけじゃなかった
  reset(); lift(140); stand(BUCHO, CX - 0.7, -1.6, 0.4); BUCHO.userData.head.rotation.y = 0.4;
  if (t > d * 0.35) say(demo, t, d * 0.35, CX, 2.6, -1.8, 1.2);
  look(CX, 1.8, 2.8, CX - 0.1, 1.6, -2.0, 50);
  return S;
}
function sKenshu(t, d) { // 謎マナーの研修を毎年頼んでいた部長も、新人研修の時間割が半分空く
  reset(); lift(140); stand(BUCHO, CX - 0.7, -1.6, 0.6); BUCHO.userData.head.rotation.y = 0.3; const ph = t / d;
  const rows = ['マナー研修', 'マナー研修', 'マナー研修', 'マナー研修'];
  rows.forEach((r, i) => BOARD.userData.fill(i, ph > 0.55 && (i === 1 || i === 3) ? '空き' : r));
  if (ph > 0.6) { sweatB.userData.set(1, t); say(hanbun, t, d * 0.6, CX + 0.1, 2.75, -2.2, 1.05); }
  look(CX - 0.1, 1.8, 2.4, CX + 0.1, 1.7, -2.4, 50);
  return S;
}
function sKiku(t, d) { // 空いた時間で、新人は、仕事のやり方を先輩に聞く
  reset(); lift(140); ISL.userData.monitors.forEach(m => m.visible = false); sit(SENPAI, 2); stand(SHINJIN[1], SEATS[2].x + 0.65, -1.0 + SEATS[2].z + 0.1, -0.9); SHINJIN[1].userData.arms[1].rotation.set(-0.8, 0, 0.2); SENPAI.userData.head.rotation.y = 0.6;
  if (t > d * 0.4) say(kiku, t, d * 0.4, SEATS[2].x + 0.3, 2.35, -1.0 + SEATS[2].z, 0.8);
  look(SEATS[2].x + 0.3, 2.0, 1.8, SEATS[2].x + 0.3, 1.3, -1.6, 50);
  return S;
}
function sKotsu(t, d) { // お局は、初めて新人に、マナーじゃなく、仕事のコツを教える
  reset(); lift(140); ISL.userData.monitors.forEach(m => m.visible = false); sit(SHINJIN[0], 0); SHINJIN[0].userData.head.rotation.y = 0.4; stand(OTSUBONE, SEATS[0].x + 0.6, -1.0 + SEATS[0].z + 0.15, -0.6); posePoint(OTSUBONE, 0.7); OTSUBONE.rotation.x = 0.12;
  if (t > d * 0.4) say(kotsu, t, d * 0.4, SEATS[0].x + 0.3, 2.3, -1.0 + SEATS[0].z, 0.8);
  look(SEATS[0].x + 0.3, 2.0, 1.6, SEATS[0].x + 0.3, 1.3, -1.6, 50);
  return S;
}
function sArigato(t, d) { // 新人が、お局に、本気の ありがとうございます を言う
  reset(); lift(140); stand(SHINJIN[0], -0.5, 0.45, 0.7); const bow = Math.sin(clamp(t / (d * 0.6)) * Math.PI); SHINJIN[0].rotation.x = 0.5 * bow; stand(OTSUBONE, 0.75, 0.6, -0.8); OTSUBONE.userData.head.rotation.x = -0.05;
  if (t > d * 0.35) say(arigato, t, d * 0.35, 0.15, 2.45, 0.5, 1.2);
  mainCam(0.5);
  return S;
}
function sKekka(t, d) { // 結果：謎マナーが消えて、減ったのは叱る理由で、増えたのは新人が仕事を覚える時間だった
  reset(); lift(140); sit(SHINJIN[0], 0); sit(SHINJIN[1], 2); sit(SENPAI, 4); stand(OTSUBONE, 0.0, 0.3, 0); OTSUBONE.userData.arms[0].rotation.set(-0.3, 0, 0);
  setTop('結果', '覚える時間が 増えた', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.2, u), lerp(2.2, 2.6, u), lerp(3.6, 4.6, u), 0, 1.1, -1.0, 50);
  return S;
}
function sFumidai(t, d) { // 謎マナーは、礼儀じゃなく、叱る側が先に高い所に立つための、踏み台だったのかもしれない
  reset(); lift(140); STEP.visible = true; STEP.position.set(CX + 0.3, 0, -0.6); stand(OTSUBONE, CX + 0.3, -0.6, 0); OTSUBONE.position.y = 0.5; posePoint(OTSUBONE, 1);
  STEP_L.visible = true; STEP_L.position.set(CX + 0.3, 0.28, -0.2); STEP_L.userData.size(0.42);
  stand(SHINJIN[1], CX - 0.9, 0.2, 0.6); SHINJIN[1].userData.head.rotation.x = -0.25;
  if (t > d * 0.45) say(fumidai, t, d * 0.45, CX - 0.1, 2.55, -0.4, 1.2);
  const u = ease(clamp(t / d)); look(CX + lerp(0.0, -0.2, u), 1.6, lerp(4.0, 3.6, u), CX - 0.2, 1.4, -0.4, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); scold(t); OTSUBONE.userData.arms[0].rotation.set(-0.9, 0, -0.3); mainCam(0); return S; }

const NARR = { 'お辞儀': 'おじぎ', '言いかけた': 'いいかけた', 'お局': 'おつぼね', '指': 'ゆび', '立てた': 'たてた', '固まる': 'かたまる', '新人たち': 'しんじんたち', '不満': 'ふまん', '去年': 'きょねん', '聞いたこともない': 'きいたこともない', '毎日': 'まいにち', '叱られる': 'しかられる', '月曜': 'げつよう', '押される': 'おされる', '水曜': 'すいよう', '注ぎ口': 'つぎぐち', '向き': 'むき', '気にしない': 'きにしない', '金曜': 'きんよう', '取り急ぎ': 'とりいそぎ', '呼び出されない': 'よびだされない', '困った': 'こまった', '謎マナー': 'なぞマナー', '研修': 'けんしゅう', '毎年': 'まいとし', '頼んでいた': 'たのんでいた', '部長': 'ぶちょう', '新人研修': 'しんじんけんしゅう', '時間割': 'じかんわり', '半分': 'はんぶん', '空く': 'あく', '空いた': 'あいた', '新人': 'しんじん', '仕事': 'しごと', '先輩': 'せんぱい', '聞く': 'きく', '初めて': 'はじめて', '教える': 'おしえる', '本気': 'ほんき', '言う': 'いう', '結果：': '結果、', '消えて': 'きえて', '減った': 'へった', '叱る理由': 'しかるりゆう', '増えた': 'ふえた', '覚える': 'おぼえる', '礼儀': 'れいぎ', '叱る側': 'しかるがわ', '高い所': 'たかいところ', '立つ': 'たつ', '踏み台': 'ふみだい', '意味': 'いみ', '分からなかった': 'わからなかった' };
const P = planTimes([
  ['ハンコはお辞儀させなさい と<br>言いかけたお局が、', (t, d) => sKatamaru(t, 2 * d)],
  ['指を立てたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['新人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['去年まで聞いたこともない<br>マナーで、毎日叱られる。', (t, d) => sFuman(t + d, 2 * d)],
  ['月曜。ハンコが、<br>まっすぐ押される。', sMon],
  ['水曜。とっくりの注ぎ口の<br>向きを、だれも気にしない。', sWed],
  ['金曜。メールの 取り急ぎ で、<br>だれも呼び出されない。', sFri],
  ['でも、困ったのは、<br>お局だけじゃなかった。', sDemo],
  ['謎マナーの研修を<br>毎年頼んでいた部長も、', (t, d) => sKenshu(t, 2 * d)],
  ['新人研修の時間割が<br>半分空く。', (t, d) => sKenshu(t + d, 2 * d)],
  ['空いた時間で、新人は、<br>仕事のやり方を先輩に聞く。', sKiku],
  ['お局は、初めて新人に、<br>マナーじゃなく、', (t, d) => sKotsu(t, 2 * d)],
  ['仕事のコツを教える。', (t, d) => sKotsu(t + d, 2 * d)],
  ['新人が、お局に、本気の<br>ありがとうございます を言う。', sArigato],
  ['結果：謎マナーが消えて、<br>減ったのは叱る理由で、', (t, d) => sKekka(t, 2 * d)],
  ['増えたのは新人が<br>仕事を覚える時間だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['謎マナーは、礼儀じゃなく、', (t, d) => sFumidai(t, 3 * d)],
  ['叱る側が先に<br>高い所に立つための、', (t, d) => sFumidai(t + d, 3 * d)],
  ['踏み台だったのかもしれない。', (t, d) => sFumidai(t + 2 * d, 3 * d)],
  ['意味が分からなかった<br>謎マナーは？', sAsk],
], { shot0, endCard, start: 3.3, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0728',
    v2: true,
    tt: 'main',
    hookLine: '新人を叱ろうとしたお局の手から、分厚い 謎マナーの本 がパッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本から、謎マナーが消えたら？',
    titleHtml: 'もしも日本から、<br>謎マナーが<br>消えたら？',
    mood: 'tension', seed: 728, hits: [TP, P.at(4, 0.8), P.at(14), P.at(18)], risers: [P.at(7)], impacts: [P.at(9, 0.8), P.at(15, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.25], [P.at(5, 0.6), 'bubble'], [P.at(6, 0.6), 'whoosh'], [P.at(9, 0.6), 'alarm']],
    narr: NARR,
    ask: '意味が分からなかった謎マナーは？',
    caption: 'もしも日本から、謎マナーが消えたら？\n\nハンコはお辞儀させなさい と言いかけたお局が、指を立てたまま固まる。\n新人たちの不満から。去年まで聞いたこともないマナーで、毎日叱られる。\n月曜。ハンコが、まっすぐ押される。\n水曜。とっくりの注ぎ口の向きを、だれも気にしない。\n金曜。メールの 取り急ぎ で、だれも呼び出されない。\nでも、困ったのは、お局だけじゃなかった。\n謎マナーの研修を毎年頼んでいた部長も、新人研修の時間割が半分空く。\n空いた時間で、新人は、仕事のやり方を先輩に聞く。\nお局は、初めて新人に、マナーじゃなく、仕事のコツを教える。\n新人が、お局に、本気の ありがとうございます を言う。\n\n結果：謎マナーが消えて、減ったのは叱る理由で、増えたのは新人が仕事を覚える時間だった。\n謎マナーは、礼儀じゃなく、叱る側が先に高い所に立つための、踏み台だったのかもしれない。\n\n意味が分からなかった謎マナーは？ コメントで教えて。\n\n※風刺ネタです。謎マナーが消えるのは、もしもの設定です。登場する人物・会社は架空です',
    hashtags: ['もしもラボ', 'もしも', '謎マナー', '新入社員', '社会の消えたら'],
    endStats: [['減ったもの', '叱る理由', 'もしもの結果'], ['増えたもの', '仕事を覚える時間', 'もしもの結果'], ['謎マナーの正体', '先に高い所に立つ踏み台', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
