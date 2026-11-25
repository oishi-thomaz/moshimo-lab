import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk, makeQ } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBed, makeTable } from '../scenes/home.js';

// もしも日本から、迷惑系配信者が消えたら？（皮肉回・台本 S146・社会の消えたら）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。駅前で通行人に絡もうとした配信者の手から自撮り棒とスマホが消える回。後半で 草 とコメントしていた視聴者 にも返す
// 数字は使わない（2けた は筋の中の数）。実在の配信者・事件・お店・回転ずし・駅名・アプリの画面とロゴは出さない（架空の もしも食堂・もしもTube）。
// 迷惑行為そのもの（食べ物にいたずら・線路に入るなど）はまねできる形で見せない（消える直前の姿だけ）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#9ac4e4', ground: '#9a9488' }); hemi.intensity = 1.2;
const STR = makeMan({ shirt: '#ff8a1a', pants: '#2a2a2a', hair: '#e8c040' }); S.add(STR); const sweatS = makeSweat(); STR.userData.head.add(sweatS);
const CAP = box(0.44, 0.1, 0.5, mat('#1a1a1a')); CAP.position.set(0, 0.5, 0.06); STR.userData.head.add(CAP);
const STICK = new THREE.Group(); { const p = box(0.03, 0.03, 0.9, mat('#2a2a2a')); p.position.z = 0.45; STICK.add(p); const ph = box(0.14, 0.26, 0.02, mat('#15161c')); ph.position.set(0, 0.05, 0.92); STICK.add(ph); const sc = box(0.12, 0.22, 0.005, new THREE.MeshBasicMaterial({ color: '#ff4a6a' })); sc.position.set(0, 0.05, 0.905); STICK.add(sc); }
STICK.position.set(0, -0.62, 0); STICK.rotation.x = 0.5; STR.userData.arms[1].add(STICK);
const PASS = makeWoman({ shirt: '#a8c8e8', hair: '#2a1a14' }); S.add(PASS);
const STAFF = makeWoman({ shirt: '#f4f0ea', hair: '#3a2018' }); { const a = box(0.46, 0.7, 0.03, mat('#c84a4a')); a.position.set(0, 1.0, 0.16); STAFF.add(a); } S.add(STAFF);
const GUEST = makeMan({ shirt: '#3f8f6b' }); S.add(GUEST);
const VIEWER = makeMan({ shirt: '#6a6a8a', hair: '#1d1a19' }); S.add(VIEWER);
const RIDERS = []; { const r = rng(46); for (let i = 0; i < 6; i++) { const p = (i % 2 ? makeWoman : makeMan)({ shirt: ['#59606e', '#a8c8e8', '#8a7a5a', '#e8b0c8', '#3f8f6b', '#7a6a9a'][i] }); S.add(p); RIDERS.push(p); } }

// ---------- A：駅前のお店の前（原点） ----------
const SHOP = new THREE.Group(); SHOP.position.set(0, 0, -3); S.add(SHOP);
{ const b = box(8, 3.6, 2, mat('#e8dcc8')); b.position.y = 1.8; SHOP.add(b); const win = box(3.0, 1.6, 0.05, new THREE.MeshBasicMaterial({ color: '#ffe8c0' })); win.position.set(-1.8, 1.4, 1.02); SHOP.add(win); const door = box(1.4, 2.2, 0.05, new THREE.MeshBasicMaterial({ color: '#d8e8f0' })); door.position.set(1.4, 1.1, 1.02); SHOP.add(door); const aw = box(8.2, 0.25, 0.9, mat('#2a5a8a')); aw.position.set(0, 2.85, 1.4); SHOP.add(aw); }
const SHOPSIGN = label('もしも食堂', { w: 768, size: 120, color: '#fff', bg: 'rgba(42,90,138,.97)', sx: 1.0 }); SHOPSIGN.position.set(0, 3.25, -1.5); S.add(SHOPSIGN);
const sparkA = makeSparkles(150, 0.1, 0xffe08a); S.add(sparkA.points); sparkA.init([[0.0, 1.5, 0.4]], 0.5, 0.7);
const kieta = label('自撮り棒 消滅', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(kieta);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const sawagu = label('店で 騒がれる', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.9 }); S.add(sawagu);
const katte = label('勝手に 動画に', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(katte);
const zero = label('カメラ ゼロ', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.8 }); S.add(zero);
const satsuei = label('他人の店で 撮影所', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.05 }); S.add(satsuei);

// ---------- B：電車の中（x=60） ----------
const BX = 60;
const CAR = new THREE.Group(); CAR.position.set(BX, 0, 0); S.add(CAR);
{ const fl = box(3.0, 0.1, 14, mat('#8a8070')); fl.position.y = -0.05; CAR.add(fl); for (const sx of [-1, 1]) { const w = box(0.1, 2.4, 14, mat('#e8e8e4')); w.position.set(sx * 1.5, 1.2, 0); CAR.add(w); for (let i = 0; i < 4; i++) { const g = box(0.05, 0.8, 1.8, new THREE.MeshBasicMaterial({ color: '#9ad0f0' })); g.position.set(sx * 1.44, 1.6, -5 + i * 3.2); CAR.add(g); } const seat = box(0.5, 0.45, 12, mat('#4a6a9a')); seat.position.set(sx * 1.2, 0.22, 0); CAR.add(seat); } const top = box(3.0, 0.1, 14, mat('#f4f4f0')); top.position.y = 2.4; CAR.add(top); }
const shizuka = label('車内 静か', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.8 }); S.add(shizuka);

// ---------- C：お店の中（x=120） ----------
const CX = 120;
room({ x: CX, w: 7, d: 5, h: 3, wall: '#f0e4d0', floor: '#a88a68' });
const CNT = makeTable({ w: 2.4, d: 0.6, h: 1.0, color: '#8a6a4a' }); CNT.position.set(CX, 0, -0.8); S.add(CNT);
const PAD = box(0.18, 0.24, 0.02, mat('#2a2a2a')); S.add(PAD);
const kinishinai = label('カメラを 気にしない', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.15 }); S.add(kinishinai);
const obienai = label('おびえない毎日', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(obienai);

// ---------- D：視聴者の部屋（x=180・夜） ----------
const DX = 180;
room({ x: DX, w: 6, d: 5, h: 2.8, wall: '#3a3e56', floor: '#5a4a40' });
const BED = makeBed({ blanket: '#5a5a7a' }); BED.position.set(DX - 0.6, 0, -1.2); S.add(BED);
const VP = makePhone({ w: 0.9, h: 1.8, cw: 540, ch: 1080 }); S.add(VP.g);
const FONT = (w, px) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function tubeScr(title, views, kusa = false) { return (g, W, H) => { g.fillStyle = '#1a1a22'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8304a'; g.fillRect(0, 0, W, 110); g.fillStyle = '#fff'; g.font = FONT(900, 46); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('もしもTube', W / 2, 58);
  g.fillStyle = '#3a3a48'; g.fillRect(30, 140, W - 60, 340); g.fillStyle = '#fff'; g.font = FONT(900, 44); g.fillText(title, W / 2, 310);
  g.textAlign = 'left'; g.font = FONT(900, 50); g.fillStyle = '#fff'; g.fillText('再生 ' + views, 40, 560);
  if (kusa) { ['草', '草草', 'www 草'].forEach((c, i) => { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(30, 640 + i * 110, W - 60, 90); g.fillStyle = '#9be86a'; g.font = FONT(900, 46); g.fillText(c, 60, 688 + i * 110); }); } }; }
const nai = label('暇つぶし なし', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.9 }); S.add(nai);

// ---------- E：配信者の部屋（x=240） ----------
const EX = 240;
room({ x: EX, w: 6, d: 5, h: 2.8, wall: '#e8e2d6', floor: '#b48a5e' });
const DESK = makeTable({ w: 1.6, d: 0.8 }); DESK.position.set(EX, 0, -1.4); S.add(DESK);
const EP = makePhone({ w: 0.9, h: 1.8, cw: 540, ch: 1080 }); S.add(EP.g);
const PLANT = new THREE.Group(); { const pot = box(0.3, 0.3, 0.3, mat('#c88a5a')); pot.position.y = 0.15; PLANT.add(pot); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat('#6aa86a', { flatShading: true })); lf.position.y = 0.55; PLANT.add(lf); } PLANT.position.set(EX - 0.3, 0.75, -1.5); S.add(PLANT);
const futsuu = label('普通の動画', { w: 640, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.8 }); S.add(futsuu);
const niketa = label('再生数 2けた', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(niketa);
const kangaeru = label('迷惑をかけない 動画？', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.15 }); S.add(kangaeru);
const demo = label('困ったのは 配信者だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(demo);
const Q = makeQ(); S.add(Q);

const PEOPLE = [STR, PASS, STAFF, GUEST, VIEWER, ...RIDERS];
const LABELS = [kieta, katamaru, sawagu, katte, zero, satsuei, shizuka, kinishinai, obienai, nai, futsuu, niketa, kangaeru, demo];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatS.userData.set(0); STICK.visible = true; STICK.scale.setScalar(1);
  VP.g.visible = false; EP.g.visible = false; PAD.visible = false; Q.visible = false; hemi.intensity = 1.2;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
const TP = 0.3;
function strPose(stick = true) { stand(STR, -0.5, -0.4, 0.5); STR.userData.arms[1].rotation.set(-1.5, 0, 0.1); STR.userData.arms[0].rotation.set(-0.6, 0, -0.5); STICK.visible = stick; }
function frontCam(u = 0) { look(lerp(0.2, 0.1, u), lerp(1.45, 1.4, u), lerp(4.4, 4.1, u), 0.1, 1.85, -0.8, 50); }
function shot0(t) { // 0秒＝サムネ：駅前で通行人に絡もうとした配信者の手から、自撮り棒とスマホがパッと消える
  reset(); lift(0); strPose(); stand(PASS, 0.9, -0.2, -0.6); PASS.userData.arms[0].rotation.set(-0.3, 0, -0.3);
  const k = t < TP ? 0 : easeOut(clamp((t - TP) / 0.2)); STICK.visible = k < 1; STICK.scale.setScalar(Math.max(0.001, 1 - k));
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; say(kieta, t, TP + 0.15, 0.1, 0.6, 0.6, 0.85); }
  frontCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 撮るものをなくした配信者が、カメラ目線のまま固まる
  reset(); lift(140); stand(STR, 0, -0.4, 0); STR.userData.arms[1].rotation.set(-2.0, 0, 0.3); STICK.visible = false; sweatS.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, 0.45, 2.15, -0.4, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.1, 0.0, u), 1.7, lerp(2.8, 2.3, u), 0, 1.6, -0.4, 50);
  return S;
}
function sFuman(t, d) { // 店員たちの不満から。店で騒がれて、勝手に動画にされる
  reset(); lift(140); stand(STAFF, CX, -1.4, 0); STAFF.userData.arms.forEach(a => a.rotation.set(-0.4, 0, 0)); stand(STR, CX + 1.2, 0.2, -2.4); STR.userData.arms[1].rotation.set(-2.0, 0, 0.3); STR.userData.arms[0].rotation.set(0, 0, -2.4 + Math.sin(t * 8) * 0.3);
  say(sawagu, t, 0.3, CX - 0.2, 2.5, -1.2, 0.9); if (t > d * 0.55) say(katte, t, d * 0.55, CX - 0.2, 2.05, -1.0, 0.9);
  look(CX + 0.2, 1.8, 3.6, CX, 1.4, -0.8, 50);
  return S;
}
function sDay1(t, d) { // 1日目。お店の前に、カメラを向ける人がいない
  reset(); lift(140); stand(PASS, -1.4 + t * 0.4, 0.4, Math.PI / 2); poseWalk(PASS, t * 7, 0.8); stand(GUEST, 1.6 - t * 0.3, 0.9, -Math.PI / 2); poseWalk(GUEST, t * 7, 0.8);
  if (t > d * 0.45) say(zero, t, d * 0.45, 0, 2.4, -1.0, 0.8);
  setHud('迷惑系が消えて', '1日目', 1);
  frontCam(0.6);
  return S;
}
function sDay3(t, d) { // 3日目。電車の中で、大声の撮影が聞こえてこない
  reset(); lift(140); RIDERS.forEach((p, i) => { const sx = i % 2 ? 1 : -1; stand(p, BX + sx * 1.05, -3 + Math.floor(i / 2) * 1.4, -sx * Math.PI / 2); poseSit(p); p.position.y = -0.39 + 0.05; p.userData.head.rotation.x = 0.25; });
  if (t > d * 0.45) say(shizuka, t, d * 0.45, BX, 2.0, -2.0, 0.8);
  setHud('迷惑系が消えて', '3日目', 1);
  look(BX, 1.65, 3.4, BX, 1.2, -3.0, 55);
  return S;
}
function shopIn() { stand(STAFF, CX - 0.2, -1.5, 0); STAFF.userData.arms[1].rotation.set(-1.0, 0, 0.1); PAD.visible = true; PAD.position.set(CX - 0.05, 1.05, -1.1); PAD.rotation.x = -0.5; stand(GUEST, CX + 0.9, -0.5, Math.PI * 0.8); }
function sWeek(t, d) { // 1週間後。店員が、カメラを気にせずに注文を取る
  reset(); lift(140); shopIn();
  if (t > d * 0.45) say(kinishinai, t, d * 0.45, CX - 0.1, 2.5, -1.4, 1.05);
  setHud('迷惑系が消えて', '1週間後', 1);
  look(CX + 0.6, 1.8, 2.6, CX - 0.1, 1.4, -1.0, 50);
  return S;
}
function viewerAt(scr) { VIEWER.visible = true; VIEWER.rotation.set(-Math.PI / 2, 0, 0); VIEWER.position.set(DX - 0.6, 0.62, -0.05); VIEWER.userData.legs.forEach(l => l.visible = false); VIEWER.userData.arms[1].rotation.set(-2.4, 0, 0.3); VP.g.visible = true; VP.g.position.set(DX + 0.4, 1.5, -0.8); VP.g.scale.setScalar(0.75); VP.draw(scr[0], scr[1]); }
function sDemo(t, d) { // でも、困ったのは、配信者だけじゃなかった
  reset(); lift(140); hemi.intensity = 0.8; viewerAt(['k', tubeScr('迷惑系 チャンネル', '－', true)]);
  if (t > d * 0.35) say(demo, t, d * 0.35, DX, 2.45, -1.4, 1.2);
  look(DX + 0.3, 2.0, 3.0, DX - 0.1, 1.1, -1.0, 50);
  return S;
}
function sViewer(t, d) { // 迷惑な動画を見て 草 とコメントしていた視聴者も、夜の暇つぶしがなくなる
  reset(); lift(140); hemi.intensity = 0.8; const ph = t / d; viewerAt(ph < 0.5 ? ['k', tubeScr('迷惑系 チャンネル', '－', true)] : ['n', tubeScr('おすすめ なし', '－', false)]);
  if (ph > 0.55) say(nai, t, d * 0.55, DX - 0.4, 1.65, -0.6, 0.85);
  look(DX + 0.3, 2.0, 3.0, DX - 0.1, 1.1, -1.0, 50);
  return S;
}
function strDesk(scr) { stand(STR, EX - 0.9, -0.7, 0.6); STR.userData.arms[1].rotation.set(-1.2, 0, 0.2); STICK.visible = false; EP.g.visible = true; EP.g.position.set(EX + 0.55, 1.45, -1.3); EP.g.scale.setScalar(0.7); EP.g.rotation.y = -0.2; EP.draw(scr[0], scr[1]); }
function eCam(u = 0) { look(EX + lerp(0.0, -0.2, u), 1.75, lerp(3.6, 3.2, u), EX - 0.3, 1.5, -1.0, 50); }
function sFutsuu(t, d) { // 再生数が稼げないと分かって、配信者は 普通の動画 を撮り始める
  reset(); lift(140); strDesk(['f', tubeScr('植物を育てる', '…')]);
  if (t > d * 0.5) say(futsuu, t, d * 0.5, EX - 0.3, 2.35, -1.0, 0.8);
  eCam(ease(clamp(t / d)));
  return S;
}
function sNiketa(t, d) { // 普通の動画の再生数は、2けた
  reset(); lift(140); strDesk(['n', tubeScr('植物を育てる', '2けた')]); sweatS.userData.set(1, t);
  if (t > d * 0.35) say(niketa, t, d * 0.35, EX - 0.3, 2.35, -1.0, 0.85);
  eCam(1);
  return S;
}
function sKangaeru(t, d) { // 配信者は、初めて、だれにも迷惑をかけない動画の作り方を考える
  reset(); lift(140); strDesk(['n', tubeScr('植物を育てる', '2けた')]); STR.userData.arms[0].rotation.set(-2.6, 0, -0.4); STR.userData.head.rotation.z = 0.15;
  Q.visible = true; Q.position.set(EX - 0.9, 2.35 + Math.sin(t * 3) * 0.04, -0.7);
  if (t > d * 0.4) say(kangaeru, t, d * 0.4, EX - 0.1, 2.7, -1.2, 1.1);
  eCam(0.5);
  return S;
}
function sKekka(t, d) { // 結果：迷惑系が消えて、減ったのは配信者の再生数で、増えたのは店員がカメラにおびえない毎日だった
  reset(); lift(140); const ph = t / d;
  if (ph < 0.55) { strDesk(['n', tubeScr('植物を育てる', '2けた')]); setTop('結果', '減ったのは 再生数', fade(t, 0.3, d * 0.55, 0.25), RED); eCam(0.8); return S; }
  shopIn(); say(obienai, t, d * 0.6, CX - 0.1, 2.5, -1.4, 0.95); setTop('増えたのは', 'おびえない毎日', fade(t, d * 0.55, d, 0.25), GREEN); look(CX + 0.6, 1.8, 2.6, CX - 0.1, 1.4, -1.0, 50);
  return S;
}
function sSatsuei(t, d) { // 迷惑系の動画は、おもしろさじゃなく、他人の店を勝手に借りて撮る、ただの撮影所だったのかもしれない
  reset(); lift(140); stand(STR, -0.3, -0.4, 0.3); STICK.visible = false; STR.userData.head.rotation.x = 0.3;
  if (t > d * 0.45) say(satsuei, t, d * 0.45, 0, 2.4, -1.0, 1.05);
  frontCam(0.4 + 0.6 * ease(clamp(t / d)));
  return S;
}
function sAsk(t) { reset(); lift(0); strPose(false); stand(PASS, 0.9, -0.2, -0.6); frontCam(0); return S; }

const NARR = { '撮るもの': 'とるもの', '配信者': 'はいしんしゃ', '目線': 'めせん', '固まる': 'かたまる', '店員': 'てんいん', '不満': 'ふまん', '店': 'みせ', '騒がれて': 'さわがれて', '勝手に': 'かってに', '動画': 'どうが', '1日目': 'いちにちめ', '向ける人': 'むけるひと', '3日目': 'みっかめ', '電車の中': 'でんしゃのなか', '大声': 'おおごえ', '撮影': 'さつえい', '聞こえてこない': 'きこえてこない', '1週間後': 'いっしゅうかんご', '気にせずに': 'きにせずに', '注文': 'ちゅうもん', '取る': 'とる', '困った': 'こまった', '迷惑': 'めいわく', '草': 'くさ', '視聴者': 'しちょうしゃ', '夜': 'よる', '暇つぶし': 'ひまつぶし', '再生数': 'さいせいすう', '稼げない': 'かせげない', '分かって': 'わかって', '普通': 'ふつう', '撮り始める': 'とりはじめる', '2けた': 'ふたけた', '初めて': 'はじめて', '作り方': 'つくりかた', '考える': 'かんがえる', '結果：': '結果、', '迷惑系': 'めいわくけい', '減った': 'へった', '増えた': 'ふえた', '毎日': 'まいにち', '他人': 'たにん', '借りて': 'かりて', '撮る': 'とる', '撮影所': 'さつえいじょ', '見たこと': 'みたこと' };
const P = planTimes([
  ['撮るものをなくした配信者が、', (t, d) => sKatamaru(t, 2 * d)],
  ['カメラ目線のまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['店員たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['店で騒がれて、<br>勝手に動画にされる。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。お店の前に、<br>カメラを向ける人がいない。', sDay1],
  ['3日目。電車の中で、<br>大声の撮影が聞こえてこない。', sDay3],
  ['1週間後。店員が、カメラを<br>気にせずに注文を取る。', sWeek],
  ['でも、困ったのは、<br>配信者だけじゃなかった。', sDemo],
  ['迷惑な動画を見て 草 と<br>コメントしていた視聴者も、', (t, d) => sViewer(t, 2 * d)],
  ['夜の暇つぶしがなくなる。', (t, d) => sViewer(t + d, 2 * d)],
  ['再生数が稼げないと分かって、', (t, d) => sFutsuu(t, 2 * d)],
  ['配信者は 普通の動画 を<br>撮り始める。', (t, d) => sFutsuu(t + d, 2 * d)],
  ['普通の動画の再生数は、2けた。', sNiketa],
  ['配信者は、初めて、だれにも', (t, d) => sKangaeru(t, 2 * d)],
  ['迷惑をかけない動画の<br>作り方を考える。', (t, d) => sKangaeru(t + d, 2 * d)],
  ['結果：迷惑系が消えて、', (t, d) => sKekka(t, 3 * d)],
  ['減ったのは配信者の再生数で、', (t, d) => sKekka(t + d, 3 * d)],
  ['増えたのは店員が<br>カメラにおびえない毎日だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['迷惑系の動画は、<br>おもしろさじゃなく、', (t, d) => sSatsuei(t, 3 * d)],
  ['他人の店を勝手に借りて撮る、', (t, d) => sSatsuei(t + d, 3 * d)],
  ['ただの撮影所だった<br>のかもしれない。', (t, d) => sSatsuei(t + 2 * d, 3 * d)],
  ['迷惑系の動画、<br>見たことある？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0748',
    v2: true,
    tt: 'main',
    hookLine: '駅前で通行人に絡もうとした配信者の手から、自撮り棒とスマホがパッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: 'テクノロジー・ネット',
    title: 'もしも日本から、迷惑系配信者が消えたら？',
    titleHtml: 'もしも日本から、<br>迷惑系配信者が<br>消えたら？',
    mood: 'tension', seed: 748, hits: [TP, P.at(15), P.at(20)], risers: [P.at(7)], impacts: [P.at(12, 0.6)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.25], [P.at(3, 0.5), 'alarm'], [P.at(4, 0.8), 'whoosh'], [P.at(9, 0.3), 'poof'], [P.at(14, 0.6), 'bubble']],
    narr: NARR,
    ask: '迷惑系の動画、見たことある？',
    caption: 'もしも日本から、迷惑系配信者が消えたら？\n\n撮るものをなくした配信者が、カメラ目線のまま固まる。\n店員たちの不満から。店で騒がれて、勝手に動画にされる。\n1日目。お店の前に、カメラを向ける人がいない。\n3日目。電車の中で、大声の撮影が聞こえてこない。\n1週間後。店員が、カメラを気にせずに注文を取る。\nでも、困ったのは、配信者だけじゃなかった。\n迷惑な動画を見て 草 とコメントしていた視聴者も、夜の暇つぶしがなくなる。\n再生数が稼げないと分かって、配信者は 普通の動画 を撮り始める。\n普通の動画の再生数は、2けた。\n配信者は、初めて、だれにも迷惑をかけない動画の作り方を考える。\n\n結果：迷惑系が消えて、減ったのは配信者の再生数で、増えたのは店員がカメラにおびえない毎日だった。\n迷惑系の動画は、おもしろさじゃなく、他人の店を勝手に借りて撮る、ただの撮影所だったのかもしれない。\n\n迷惑系の動画、見たことある？ コメントで教えて。\n\n※風刺ネタです。迷惑系配信者が消えるのは、もしもの設定です。お店・アプリ・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '迷惑系', '配信者', '社会の消えたら'],
    endStats: [['減ったもの', '配信者の再生数', 'もしもの結果'], ['増えたもの', 'おびえない毎日', 'もしもの結果'], ['迷惑系の正体', '他人の店の撮影所', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
