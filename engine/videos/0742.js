import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSuit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeFridge, makeGift, makeTable } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも日本から、自爆営業が消えたら？（皮肉回・台本 S143・社会の消えたら）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。年末にケーキとおせちの予約ノルマを部下に配る店長が、休憩室のノルマ表が消えて固まる回。後半で 自腹で 達成 にしてきた中堅 にも返す
// 数字は使わない（日付は筋の中の時間）。実在のコンビニ・郵便局・ケーキ店・ロゴ・制服は出さない（架空の もしも屋）。店員やバイトを笑わない。食べ物を捨てる絵は出さない

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#2c3040', ground: '#4a4a52' }); hemi.intensity = 1.3;
function apron(p, color = '#3a7a5a') { const a = box(0.46, 0.7, 0.03, mat(color)); a.position.set(0, 1.0, 0.16); p.add(a); return a; }
const BOSS = makeOji(rng(143), { shirt: '#f0ece4' }); apron(BOSS, '#2f5a8a'); S.add(BOSS); const sweatB = makeSweat(); BOSS.userData.head.add(sweatB);
const STACK = box(0.32, 0.12, 0.24, mat('#fbfaf5')); STACK.position.set(0, -0.66, 0.12); BOSS.userData.arms[1].add(STACK);
const STAFF = [makeWoman({ shirt: '#e8b0c8', hair: '#2a1a14' }), makeMan({ shirt: '#a8c8e8' }), makeWoman({ shirt: '#c8e0b0', hair: '#5a3a24' })]; STAFF.forEach(p => { apron(p); S.add(p); });
const MID = makeMan({ shirt: '#d8c8a8', hair: '#3a3330' }); apron(MID, '#3a7a5a'); S.add(MID); const sweatM = makeSweat(); MID.userData.head.add(sweatM);

// ---------- A：休憩室（原点） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#e6e0d4', floor: '#9a8a74' });
const QUOTA = makeDoc({ title: 'ケーキ予約ノルマ', rows: ['田中', '佐藤', '鈴木'], head: '#c8242c', w: 1.8, h: 1.6 });
['10個', '10個', '10個', '10個'].forEach((v, i) => QUOTA.userData.fill(i, v)); QUOTA.position.set(0.2, 0.9, -2.42); S.add(QUOTA);
const sparkA = makeSparkles(160, 0.12, 0xffe08a); S.add(sparkA.points); sparkA.init([[0.2, 0.9, -2.3]], 1.0, 0.8);
const TBL = makeTable({ w: 1.4, d: 0.8 }); TBL.position.set(-1.6, 0, -1.4); S.add(TBL);
const quotaGone = label('ノルマ表 消滅', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(quotaGone);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const jibara = label('売れ残りは 自腹', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(jibara);
const kae = label('自分で 買って', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(kae);

// ---------- B：店員の家の台所（x=60） ----------
const BX = 60;
room({ x: BX, w: 5, d: 4, h: 2.6, wall: '#efe6d6', floor: '#b48a5e' });
const FR = makeFridge(); FR.position.set(BX + 0.2, 0, -1.4); S.add(FR);
const CAKES_F = []; for (let i = 0; i < 3; i++) { const c = makeGift({ color: '#f6f2ea', ribbon: '#e85a7a', s: 0.26 }); c.position.set(BX + 0.2 + (i - 1) * 0.28, 1.08, -1.05); S.add(c); CAKES_F.push(c); }
const hairanai = label('自腹ケーキ 0個', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(hairanai);
const karappo = label('冷凍庫 空っぽ', { w: 768, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.95 }); S.add(karappo);

// ---------- C：店の前（x=120）：架空の もしも屋 ----------
const CX = 120;
flat(30, 12, '#3a3a42', CX, 1.0);
const SHOP = new THREE.Group(); SHOP.position.set(CX, 0, -2.4); S.add(SHOP);
{ const b = box(7, 3.4, 2.2, mat('#d8cfc0')); b.position.y = 1.7; SHOP.add(b); const win = box(5.6, 1.9, 0.05, new THREE.MeshBasicMaterial({ color: '#ffe8c0' })); win.position.set(0, 1.35, 1.12); SHOP.add(win); const aw = box(7.2, 0.25, 0.9, mat('#c84a4a')); aw.position.set(0, 2.75, 1.4); SHOP.add(aw); }
const SHOPSIGN = label('もしも屋', { w: 640, size: 120, color: '#fff', bg: 'rgba(200,74,74,.97)', sx: 0.95 }); SHOPSIGN.position.set(CX, 3.1, -1.0); S.add(SHOPSIGN);
const STAND = makeTable({ w: 1.8, d: 0.7, color: '#f0ece4' }); STAND.position.set(CX + 0.9, 0, 0.1); S.add(STAND);
const CAKES_S = []; for (let i = 0; i < 4; i++) { const c = makeGift({ color: '#f6f2ea', ribbon: '#e85a7a', s: 0.3 }); c.position.set(CX + 0.35 + i * 0.38, 0.75, 0.1); S.add(c); CAKES_S.push(c); }
const SNOW = []; { const r = rng(24); for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); s.userData.o = [CX - 4 + r() * 8, r() * 4, -1 + r() * 3, r()]; S.add(s); SNOW.push(s); } }
const irasshai = label('いらっしゃいませ！', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.05 }); S.add(irasshai);
const tento = label('店長が 初めて店頭に', { w: 1000, size: 92, color: '#fff', bg: 'rgba(200,74,74,.97)', sx: 1.15 }); S.add(tento);
const OSECHI = makeDoc({ title: 'おせち予約', rows: ['1', '2', '3', '4'], head: '#2a2a2a', w: 1.3, h: 1.6 }); OSECHI.position.set(CX - 1.4, 1.5, -1.25); S.add(OSECHI);
const tabetai = label('食べたい人の分だけ', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.15 }); S.add(tabetai);

// ---------- D：中堅のグラフ・本社（x=180） ----------
const DX = 180;
room({ x: DX, w: 9, d: 6, h: 3.2, wall: '#dfe3e8', floor: '#8a8f99' });
const BOARD = makePhone({ w: 2.6, h: 1.6, cw: 1040, ch: 640 }); BOARD.g.position.set(DX, 1.7, -2.85); S.add(BOARD.g);
const FONT = (w, px) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function barsScr(title, a, b, la, lb, k) { return (g, W, H) => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a3a5a'; g.fillRect(0, 0, W, 110); g.fillStyle = '#fff'; g.font = FONT(900, 64); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, W / 2, 58);
  const base = H - 70, full = H - 220; [[a, la, '#9aa0aa'], [b * k + a * (1 - k), lb, '#e8604a']].forEach(([v, l, c], i) => { const x = W / 2 - 240 + i * 300; const h = full * v; g.fillStyle = c; g.fillRect(x, base - h, 180, h); g.fillStyle = '#333'; g.font = FONT(900, 52); g.fillText(l, x + 90, base + 38); }); }; }
const todokanai = label('去年に 届かない', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(todokanai);
const demo = label('困ったのは 店長だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(demo);
const HQ = [makeSuit({ old: true, bald: true }), makeSuit({ jacket: '#3a4256' }), makeSuit({ woman: true })]; HQ.forEach(p => S.add(p));
const honto = label('初めて 本当の数', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(honto);

// ---------- E：次の年の店の中（x=240） ----------
const EX = 240;
room({ x: EX, w: 7, d: 5, h: 3, wall: '#f0e8dc', floor: '#9a8a74' });
const RACK = box(4.2, 0.06, 0.8, mat('#c9a77a')); RACK.position.set(EX, 1.0, -1.6); S.add(RACK);
const RACK2 = box(4.2, 0.06, 0.8, mat('#c9a77a')); RACK2.position.set(EX, 1.75, -1.6); S.add(RACK2);
const CAKES_E = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { const c = makeGift({ color: '#f6f2ea', ribbon: '#e85a7a', s: 0.3 }); c.position.set(EX - 1.85 + i * 0.46, r ? 1.78 : 1.03, -1.6); S.add(c); CAKES_E.push(c); }
const sparkE = makeSparkles(160, 0.1, 0xffe0a8); S.add(sparkE.points); sparkE.init([[EX + 1.2, 1.3, -1.6], [EX + 0.4, 1.9, -1.6]], 1.4, 0.6);
const heru = label('作る数が 減る', { w: 768, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.9 }); S.add(heru);
const mie = label('給料で買った 見栄', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.1 }); S.add(mie);
const saifu = label('店員の財布から', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(saifu);

const PEOPLE = [BOSS, MID, ...STAFF, ...HQ];
const LABELS = [quotaGone, katamaru, jibara, kae, hairanai, karappo, SHOPSIGN, irasshai, tento, tabetai, todokanai, demo, honto, heru, mie, saifu];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkE.set(0); el.flash.style.opacity = 0; sweatB.userData.set(0); sweatM.userData.set(0);
  QUOTA.visible = false; QUOTA.scale.setScalar(1); STACK.visible = true; FR.userData.open(0); CAKES_F.forEach(c => c.visible = false); SNOW.forEach(s => s.visible = false);
  CAKES_E.forEach(c => { c.visible = true; c.scale.setScalar(1); }); OSECHI.visible = false; BOARD.g.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
const TP = 0.3;
function bossHand(k = 1) { BOSS.userData.arms[1].rotation.set(-1.1 * k, 0, 0); }
function staffLine(x0 = 1.2) { STAFF.forEach((p, i) => stand(p, x0 + i * 0.6, -0.6 - i * 0.35, -0.9)); }
function roomCam(u = 0) { look(lerp(0.3, 0.25, u), lerp(1.35, 1.3, u), lerp(4.9, 4.6, u), 0.25, 1.15, -1.4, 50); }
function shot0(t) { // 0秒＝サムネ：休憩室の壁の ケーキ予約ノルマ表 が、パッと消える
  reset(); lift(0); stand(BOSS, -0.85, -0.7, 0.5); bossHand(1); staffLine(1.35);
  const k = t < TP ? 1 : 1 - easeOut(clamp((t - TP) / 0.2)); QUOTA.visible = k > 0.01; QUOTA.scale.setScalar(Math.max(0.001, k));
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; say(quotaGone, t, TP + 0.15, 0.2, 0.85, -2.0, 1.25); }
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 部下に予約の紙を配りかけた店長が、紙の束を持ったまま固まる
  reset(); lift(140); stand(BOSS, -0.5, -0.2, 0.5); bossHand(1); sweatB.userData.set(1, t); staffLine(1.0);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, -0.5, 2.15, -0.2, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.5, 0.3, u), 1.7, lerp(4.8, 4.3, u), 0.3, 1.35, -0.4, 50);
  return S;
}
function sFuman(t, d) { // 店員たちの不満から。売れなかった分は、自分で買えと言われる
  reset(); lift(140); staffLine(-0.75); STAFF.forEach(p => p.rotation.y = 0); STAFF[1].userData.head.rotation.x = 0.3;
  say(jibara, t, 0.3, 0, 2.3, 0.2, 1.05); if (t > d * 0.55) say(kae, t, d * 0.55, 0, 1.9, 0.4, 0.85);
  look(0, 1.6, 5.4, 0, 1.3, 0, 50);
  return S;
}
function sDec1(t, d) { // 12月1日。店員の冷蔵庫に、自分で買ったケーキが入らない
  reset(); lift(140); FR.userData.open(easeOut(clamp((t - 0.2) / 0.8))); stand(STAFF[0], BX - 1.0, -0.3, 0.6);
  if (t > d * 0.45) say(hairanai, t, d * 0.45, BX + 0.1, 2.0, -0.6, 1.0);
  setHud('自爆営業が消えて', '12月1日', 1);
  look(BX - 0.6, 1.6, 4.4, BX, 1.1, -1.2, 50);
  return S;
}
function snow(t) { SNOW.forEach(s => { const [x, y, z, ph] = s.userData.o; s.visible = true; s.position.set(x, 4 - ((t * 0.4 + y + ph) % 4), z); }); }
function shopCam(u = 0) { look(CX + lerp(0.6, 0.4, u), 1.9, lerp(5.6, 5.0, u), CX + 0.3, 1.4, -0.6, 50); }
function sDec24(t, d) { // 12月24日。店長が、初めて自分で店の前に立って声をかける
  reset(); lift(140); snow(t); SHOPSIGN.visible = true; stand(BOSS, CX - 0.5, 0.5, 0.2); STACK.visible = false; BOSS.userData.arms[1].rotation.set(-0.4, 0, 0.3 + Math.sin(t * 4) * 0.2); BOSS.userData.arms[0].rotation.set(-0.3, 0, -0.2);
  if (t > d * 0.25) say(irasshai, t, d * 0.25, CX - 0.2, 2.25, 0.5, 1.0); if (t > d * 0.6) say(tento, t, d * 0.6, CX + 0.4, 1.85, 0.5, 1.1);
  setHud('自爆営業が消えて', '12月24日', 1);
  shopCam(ease(clamp(t / d)));
  return S;
}
function sDec31(t, d) { // 12月31日。おせちの予約は、本当に食べたい人の分だけ
  reset(); lift(140); OSECHI.visible = true; const n = Math.min(3, Math.floor(t / d * 8)); ['食べたい 1', '食べたい 1', '食べたい 1', ''].forEach((v, i) => OSECHI.userData.fill(i, i < n ? v : ''));
  stand(BOSS, CX - 0.2, -0.5, -0.3); STACK.visible = false;
  if (t > d * 0.5) say(tabetai, t, d * 0.5, CX - 0.6, 2.05, -0.6, 1.0);
  setHud('自爆営業が消えて', '12月31日', 1);
  look(CX - 0.6, 1.5, 3.8, CX - 1.0, 1.25, -1.2, 50);
  return S;
}
function hqCam(u = 0) { look(DX + lerp(0.2, 0.0, u), 1.6, lerp(5.8, 5.3, u), DX, 1.4, -1.6, 50); }
function sDemo(t, d) { // でも、困ったのは、店長だけじゃなかった
  reset(); lift(140); stand(MID, DX - 0.6, 0.0, 0.2); BOARD.g.visible = true; BOARD.draw('m0', barsScr('ケーキ 予約数', 0.85, 0.85, '去年', '今年', 0));
  if (t > d * 0.35) say(demo, t, d * 0.35, DX + 0.3, 2.45, -1.0, 1.2);
  hqCam(ease(clamp(t / d)));
  return S;
}
function sMid(t, d) { // 毎年自腹で買って 達成 にしてきた中堅も、去年の数字に届かない
  reset(); lift(140); const k = easeOut(clamp((t / d - 0.45) / 0.2)); stand(MID, DX - 0.7, 0.0, 0.25); BOARD.g.visible = true; BOARD.draw('m' + Math.round(k * 10), barsScr('ケーキ 予約数', 0.85, 0.5, '去年', '今年', k));
  if (t / d > 0.5) sweatM.userData.set(1, t); if (t / d > 0.65) say(todokanai, t, d * 0.65, DX - 0.3, 2.2, 0.4, 0.95);
  hqCam(0.5 + 0.5 * ease(clamp(t / d)));
  return S;
}
function sHQ(t, d) { // 本社は、初めて 本当に売れた数 を見る
  reset(); lift(140); BOARD.g.visible = true; BOARD.draw('hq', barsScr('本当に売れた数', 0.85, 0.5, '自腹込み', '本当', 1));
  HQ.forEach((p, i) => { stand(p, DX - 1.2 + i * 1.2, 0.3, Math.PI); });
  if (t > d * 0.45) say(honto, t, d * 0.45, DX, 2.75, -2.0, 0.95);
  look(DX + 0.3, 2.0, 5.0, DX, 1.5, -2.2, 50);
  return S;
}
function sNext(t, d) { // 次の年、作る数が、売れる数に合わせて減る
  reset(); lift(140); const k = easeOut(clamp((t - 0.4) / 1.2)); const GONE = [17, 16, 8, 15, 7, 14];
  GONE.forEach((i, j) => { const kk = clamp(k * 1.5 - j * 0.1); CAKES_E[i].scale.setScalar(Math.max(0.001, 1 - kk)); CAKES_E[i].visible = kk < 1; });
  sparkE.set(clamp((t - 0.4) / 1.5)); if (t > d * 0.5) say(heru, t, d * 0.5, EX, 2.3, -1.0, 0.9);
  setHud('自爆営業が消えて', '次の年', 1);
  look(EX, 1.7, 4.6, EX, 1.35, -1.6, 50);
  return S;
}
function sFreezer(t, d) { // 店員の家の冷凍庫が、初めて空っぽになる
  reset(); lift(140); FR.userData.open(easeOut(clamp((t - 0.2) / 0.8))); stand(STAFF[0], BX - 1.0, -0.3, 0.6); STAFF[0].userData.head.rotation.y = 0.4;
  if (t > d * 0.45) say(karappo, t, d * 0.45, BX + 0.1, 2.0, -0.6, 0.95);
  look(BX - 0.5, 1.6, 4.2, BX, 1.1, -1.2, 50);
  return S;
}
function sKekka(t, d) { // 結果：自爆営業が消えて、売り上げの数字は下がった。でも下がった分は、もともと店員の財布から出ていたお金だった
  reset(); lift(140); const ph = t / d;
  if (ph < 0.5) { BOARD.g.visible = true; BOARD.draw('k0', barsScr('売り上げ', 0.85, 0.6, '去年', '今年', 1)); stand(MID, DX - 0.7, 0.0, 0.25); setTop('結果', '売り上げは 下がった', fade(t, 0.3, d * 0.5, 0.25), RED); hqCam(0.6); return S; }
  FR.userData.open(1); stand(STAFF[0], BX - 1.0, -0.3, 0.6); say(saifu, t, d * 0.55, BX - 0.4, 2.15, -0.3, 0.95);
  setTop('結果', '下がった分＝自腹', fade(t, d * 0.5, d, 0.25), GOLD); look(BX - 0.5, 1.6, 4.4, BX - 0.2, 1.1, -1.0, 50);
  return S;
}
function sMie(t, d) { // ノルマの達成は、店の実力じゃなく、店員の給料で買った、見栄だったのかもしれない
  reset(); lift(140); stand(BOSS, -0.3, -0.2, 0.3); bossHand(0.6); BOSS.userData.head.rotation.x = 0.3;
  if (t > d * 0.45) say(mie, t, d * 0.45, 0.2, 2.15, -0.6, 1.05);
  const u = ease(clamp(t / d)); look(lerp(0.5, 0.3, u), 1.7, lerp(4.8, 4.3, u), 0.2, 1.35, -0.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); stand(BOSS, -0.85, -0.7, 0.5); bossHand(1); staffLine(1.35); roomCam(0); return S; }

const NARR = { '部下': 'ぶか', '予約': 'よやく', '紙': 'かみ', '配りかけた': 'くばりかけた', '店長': 'てんちょう', '紙の束': 'かみのたば', '固まる': 'かたまる', '店員': 'てんいん', '不満': 'ふまん', '売れなかった分': 'うれなかったぶん', '自分で買え': 'じぶんでかえ', '12月1日': 'じゅうにがつついたち', '冷蔵庫': 'れいぞうこ', '入らない': 'はいらない', '12月24日': 'じゅうにがつにじゅうよっか', '初めて': 'はじめて', '店の前': 'みせのまえ', '声': 'こえ', '12月31日': 'じゅうにがつさんじゅういちにち', '本当に': 'ほんとうに', '食べたい人': 'たべたいひと', '分だけ': 'ぶんだけ', '困った': 'こまった', '毎年': 'まいとし', '自腹': 'じばら', '達成': 'たっせい', '中堅': 'ちゅうけん', '去年': 'きょねん', '数字': 'すうじ', '届かない': 'とどかない', '本社': 'ほんしゃ', '売れた数': 'うれたかず', '次の年': 'つぎのとし', '作る数': 'つくるかず', '売れる数': 'うれるかず', '減る': 'へる', '冷凍庫': 'れいとうこ', '空っぽ': 'からっぽ', '結果：': '結果、', '自爆営業': 'じばくえいぎょう', '売り上げ': 'うりあげ', '下がった分': 'さがったぶん', '財布': 'さいふ', '実力': 'じつりょく', '給料': 'きゅうりょう', '見栄': 'みえ', 'バイト先': 'バイトさき', '買わされた': 'かわされた' };
const P = planTimes([
  ['部下に予約の紙を<br>配りかけた店長が、', (t, d) => sKatamaru(t, 2 * d)],
  ['紙の束を持ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['店員たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['売れなかった分は、<br>自分で買えと言われる。', (t, d) => sFuman(t + d, 2 * d)],
  ['12月1日。店員の冷蔵庫に、<br>自分で買ったケーキが入らない。', sDec1],
  ['12月24日。店長が、', (t, d) => sDec24(t, 2 * d)],
  ['初めて自分で<br>店の前に立って声をかける。', (t, d) => sDec24(t + d, 2 * d)],
  ['12月31日。おせちの予約は、<br>本当に食べたい人の分だけ。', sDec31],
  ['でも、困ったのは、<br>店長だけじゃなかった。', sDemo],
  ['毎年自腹で買って 達成 に<br>してきた中堅も、', (t, d) => sMid(t, 2 * d)],
  ['去年の数字に届かない。', (t, d) => sMid(t + d, 2 * d)],
  ['本社は、初めて<br>本当に売れた数 を見る。', sHQ],
  ['次の年、作る数が、<br>売れる数に合わせて減る。', sNext],
  ['店員の家の冷凍庫が、<br>初めて空っぽになる。', sFreezer],
  ['結果：自爆営業が消えて、<br>売り上げの数字は下がった。', (t, d) => sKekka(t, 3 * d)],
  ['でも下がった分は、', (t, d) => sKekka(t + d, 3 * d)],
  ['もともと店員の財布から<br>出ていたお金だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['ノルマの達成は、<br>店の実力じゃなく、', (t, d) => sMie(t, 3 * d)],
  ['店員の給料で買った、', (t, d) => sMie(t + d, 3 * d)],
  ['見栄だったのかもしれない。', (t, d) => sMie(t + 2 * d, 3 * d)],
  ['バイト先で、<br>自腹で買わされたことある？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0742',
    v2: true,
    tt: 'main',
    hookLine: '休憩室の壁の ケーキ予約ノルマ表 が、パッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本から、自爆営業が消えたら？',
    titleHtml: 'もしも日本から、<br>自爆営業が<br>消えたら？',
    mood: 'tension', seed: 742, hits: [TP, P.at(14), P.at(19)], risers: [P.at(8)], impacts: [P.at(10, 0.4), P.at(16, 0.5)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.25], [P.at(4, 0.6), 'whoosh'], [P.at(5, 0.8), 'bubble'], [P.at(12, 0.5), 'poof'], [P.at(13, 0.6), 'whoosh']],
    narr: NARR,
    ask: 'バイト先で、自腹で買わされたことある？',
    caption: 'もしも日本から、自爆営業が消えたら？\n\n部下に予約の紙を配りかけた店長が、紙の束を持ったまま固まる。\n店員たちの不満から。売れなかった分は、自分で買えと言われる。\n12月1日。店員の冷蔵庫に、自分で買ったケーキが入らない。\n12月24日。店長が、初めて自分で店の前に立って声をかける。\n12月31日。おせちの予約は、本当に食べたい人の分だけ。\nでも、困ったのは、店長だけじゃなかった。\n毎年自腹で買って 達成 にしてきた中堅も、去年の数字に届かない。\n本社は、初めて 本当に売れた数 を見る。\n次の年、作る数が、売れる数に合わせて減る。\n店員の家の冷凍庫が、初めて空っぽになる。\n\n結果：自爆営業が消えて、売り上げの数字は下がった。でも下がった分は、もともと店員の財布から出ていたお金だった。\nノルマの達成は、店の実力じゃなく、店員の給料で買った、見栄だったのかもしれない。\n\nバイト先で、自腹で買わされたことある？ コメントで教えて。\n\n※風刺ネタです。自爆営業が消えるのは、もしもの設定です。お店・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '自爆営業', 'ノルマ', '社会の消えたら'],
    endStats: [['下がったもの', '売り上げの数字', 'もしもの結果'], ['下がった分の正体', '店員の自腹', 'もしもの結果'], ['ノルマ達成の正体', '給料で買った見栄', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
