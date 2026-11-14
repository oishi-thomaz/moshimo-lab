import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box, makePerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeBed } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも日本から転勤が消えたら？（皮肉回・台本 S90・社会の消えたら）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：転勤・単身赴任（ガルちゃん・はてなで定番。転勤族の妻のキャリア・子どもの転校・単身赴任の夫が楽しそう）
// 数字は使わない（単身赴任者の数の統計は出さない。段ボール1箱は筋の中の数）。実在の会社・ロゴは出さない。お酒はかっこよく見せない（缶を持つだけ）
// 最初は 会社と辞令 が痛い目を見るように見せて、喜ぶ家族→実は困るのは単身赴任を楽しんでいた夫、と叩かれる側がひっくり返る。言い換えは 長すぎる一人暮らしの夏休み

const { S, flat, room, hemi } = makeSet({ bg: '#c8d4e2' }); hemi.intensity = 1.3;
const OTTO = makeSuit({ jacket: '#3a4256', tie: '#b23a3a' }); S.add(OTTO); // 単身赴任の夫
const sweatO = makeSweat(); OTTO.userData.head.add(sweatO);
const TSUMA = makeWoman({ shirt: '#c96a8a', hair: '#3a2018', pants: '#3a3f4e' }); S.add(TSUMA);
const KO = makePerson({ skin: '#f5d3b5', hair: '#2a1a14', shirt: '#f2c14e', pants: '#3a5a8a', scale: 0.62 }); S.add(KO);
const CAN = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.13, 12), mat('#c8ccd4')); CAN.position.set(0, -0.66, 0.06); OTTO.userData.arms[1].add(CAN);

// ---------- A：会社の掲示板（原点） ----------
const roomA = room({ x: 0, w: 8, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const BOARD = box(2.1, 1.85, 0.08, mat('#b08a63')); BOARD.position.set(0, 1.6, -2.9); S.add(BOARD);
const bsign = label('辞令', { w: 384, size: 120, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.55 }); bsign.position.set(0, 2.7, -2.8); S.add(bsign);
const JIREI = []; { const names = ['大阪支店へ', '札幌支店へ', '福岡支店へ', '仙台支店へ', '広島支店へ', '名古屋支店へ']; for (let i = 0; i < 4; i++) { const d = makeDoc({ title: '辞令', rows: ['転勤先', '日付'], head: '#c8242c', w: 0.85, h: 0.78 }); d.userData.fill(0, names[i]); d.userData.fill(1, '来月1日'); d.position.set(-0.47 + (i % 2) * 0.94, 2.03 - Math.floor(i / 2) * 0.86, -2.85); S.add(d); JIREI.push(d); } }
const sparkA = makeSparkles(200, 0.12, 0xfff2c0); S.add(sparkA.points); sparkA.init(JIREI.map(d => d.position.toArray()), 0.4, 0.7);
const kamiichimai = label('紙一枚で 家族が動く', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(kamiichimai);

// ---------- B：単身赴任のワンルーム（x=60） ----------
const BX = 60;
const roomB = room({ x: BX, w: 5, d: 4, h: 2.8, wall: '#e8e0d0', floor: '#a88a64' });
const BED = makeBed({ blanket: '#6a7a9a' }); BED.position.set(BX - 1.2, 0, -1.2); S.add(BED);
const lowT = makeTable({ w: 0.9, d: 0.6, h: 0.35, color: '#c9a77a' }); lowT.position.set(BX + 0.3, 0, -0.6); S.add(lowT);
const RAMEN = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.1, 16), mat('#d84a3a')); RAMEN.add(b); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 16), mat('#e8c27a')); s.position.y = 0.04; RAMEN.add(s); } RAMEN.position.set(BX + 0.3, 0.42, -0.6); S.add(RAMEN);
const ROD = box(0.03, 1.6, 0.03, mat('#2a2e38')); ROD.rotation.z = 0.25; ROD.position.set(BX + 1.6, 0.85, -1.6); S.add(ROD); // 週末の趣味（釣りざお）
const GAME = box(0.3, 0.12, 0.05, mat('#3a3a50')); GAME.position.set(BX + 0.05, 0.4, -0.45); S.add(GAME);
const katamaru = label('…！', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const jiyu = label('夜の自由', { w: 512, size: 110, color: '#fff', bg: 'rgba(240,120,60,.96)', sx: 0.8 }); S.add(jiyu);
const kieta = label('消えた', { w: 384, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(kieta);
const natsuyasumi = label('長すぎる 夏休み', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.4 }); S.add(natsuyasumi);
const SUN = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.16, 16), mat('#f2d27a')); S.add(SUN); // 麦わら帽子
const BRIM = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 20), mat('#f2d27a')); S.add(BRIM);

// ---------- C：家族の家のリビング（x=120） ----------
const CX = 120;
const roomC = room({ x: CX, w: 8, d: 6, h: 3, wall: '#f2e8d8', floor: '#b48a5e' });
const DT = makeTable({ w: 1.6, d: 0.9, h: 0.72, color: '#c9a77a' }); DT.position.set(CX, 0, -1.2); S.add(DT);
const CHAIRS = [[-0.5, -1.85, 0], [0.5, -1.85, 0], [-0.5, -0.55, Math.PI], [0.5, -0.55, Math.PI]].map(([x, z, r]) => { const g = new THREE.Group(); const s = box(0.45, 0.06, 0.45, mat('#8a6a4c')); s.position.y = 0.45; g.add(s); const b = box(0.45, 0.55, 0.06, mat('#8a6a4c')); b.position.set(0, 0.75, -0.2); g.add(b); g.position.set(CX + x, 0, z); g.rotation.y = r; S.add(g); return g; });
const BAGS = [box(0.4, 0.3, 0.25, mat('#e86a8a')), box(0.35, 0.35, 0.3, mat('#5aa8d8'))]; BAGS.forEach(b => S.add(b)); // 4つめの席は荷物置き場
const tobihaneru = label('転校しなくていい！', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.6 }); S.add(tobihaneru);
const gomi = label('ゴミの日、知ってる？', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(gomi);
const itsumade = label('いつまでいるの？', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.4 }); S.add(itsumade);
const sekiganai = label('自分の席がない', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(sekiganai);
const yorokonde = label('喜んでいない人', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(yorokonde);
const komatta = label('一番困ったのは 夫', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(komatta);

// ---------- D：街（x=180）：妻の出勤・夫の帰宅 ----------
const DX = 180;
flat(30, 16, '#b8b4ac', DX, 0); flat(30, 3, '#5a5e66', DX, 2.5, -0.75);
for (let i = 0; i < 5; i++) { const h = 3.2 + (i % 2) * 0.8; const b = box(3.6, h, 3.6, mat(['#e8e2d4', '#d8dde4', '#efe6d6'][i % 3])); b.position.set(DX - 8 + i * 4, h / 2, -4.0); S.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.2, 4), mat(['#8a4a3a', '#4a5a7a', '#6a6a6a'][i % 3])); r.rotation.y = Math.PI / 4; r.position.set(DX - 8 + i * 4, h + 0.6, -4.0); S.add(r); }
const DOOR = box(0.9, 2.0, 0.06, mat('#6a4a32')); DOOR.position.set(DX, 1.0, -2.18); S.add(DOOR);
const BOX1 = box(0.5, 0.4, 0.4, mat('#c8a070')); S.add(BOX1); const tape = box(0.52, 0.04, 0.1, mat('#e8d8b0')); tape.position.y = 0.2; BOX1.add(tape);
const BAG = box(0.12, 0.3, 0.38, mat('#2a2e38')); S.add(BAG);
const yamezu = label('辞めずに済んだ仕事', { w: 1024, size: 96, color: '#fff', bg: 'rgba(200,106,138,.97)', sx: 1.6 }); S.add(yamezu);
const hitohako = label('段ボール 1箱', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.2 }); S.add(hitohako);

const PEOPLE = [OTTO, TSUMA, KO];
const LABELS = [kamiichimai, katamaru, jiyu, kieta, natsuyasumi, tobihaneru, gomi, itsumade, sekiganai, yorokonde, komatta, yamezu, hitohako];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); hemi.intensity = 1.3;
  JIREI.forEach(d => { d.visible = true; d.scale.setScalar(1); }); CAN.visible = true; RAMEN.visible = true; ROD.visible = true; GAME.visible = true;
  SUN.visible = BRIM.visible = false; BOX1.visible = false; BAG.visible = false; BAGS.forEach(b => b.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function boardCam(u = 0) { look(lerp(0.05, 0.0, u), lerp(1.9, 1.85, u), lerp(0.75, 0.55, u), 0, lerp(1.95, 1.9, u), -2.9, 50); }
function shot0(t) { // 0秒＝サムネ：会社の掲示板に貼られた 辞令 の紙が、一斉にパッと消える
  reset(); lift(0); const k = clamp((t - TP) / 0.2); JIREI.forEach(d => { d.scale.setScalar(1 - k); d.visible = k < 1; });
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  boardCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function oneRoom() { OTTO.visible = true; OTTO.position.set(BX + 0.3, 0, -1.3); poseSit(OTTO); OTTO.position.y = -0.62; OTTO.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); OTTO.userData.arms[1].rotation.set(-1.3, 0, 0.2); }
function sKatamaru(t, d) { // 単身赴任先のワンルームで、夫が缶ビールを持ったまま固まる
  reset(); lift(120); oneRoom(); hemi.intensity = 1.0; if (t > d * 0.4) { say(katamaru, t, d * 0.4, BX + 0.3, 1.5, -1.3, 0.38); sweatO.userData.set(1, t); }
  const u = ease(clamp(t / d)); look(BX + lerp(0.9, 0.6, u), 1.3, lerp(1.6, 1.2, u), BX + 0.2, 0.75, -1.1, 50);
  return S;
}
function sFuman(t, d) { // 家族の不満から。紙一枚で、家族の暮らしが決まっていた
  reset(); lift(120); JIREI.forEach(d => d.visible = true);
  if (t > d * 0.4) say(kamiichimai, t, d * 0.4, 0, 1.6, -2.6, 1.2);
  boardCam(0.6);
  return S;
}
function sKo(t, d) { // 1日目。転勤族の子どもが、転校しなくていいと聞いて飛び跳ねる
  reset(); lift(120); KO.visible = true; KO.position.set(CX + 0.2, Math.abs(Math.sin(t * 6)) * 0.35, 0.2); KO.userData.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * (2.4 + Math.sin(t * 12) * 0.2)));
  TSUMA.visible = true; TSUMA.position.set(CX - 0.9, 0, -0.3); TSUMA.rotation.y = 0.6;
  if (t > d * 0.35) say(tobihaneru, t, d * 0.35, CX - 0.15, 1.9, 0.0, 1.2);
  setHud('転勤が消えて', '1日目', 1);
  look(CX - 0.1, 1.5, 3.4, CX - 0.2, 1.05, -0.2, 50);
  return S;
}
function sTsuma(t, d) { // 1週間後。妻は、辞めずに済んだ仕事に、そのまま出勤する
  reset(); lift(120); TSUMA.visible = true; TSUMA.rotation.y = Math.PI / 2; TSUMA.position.set(DX - 3 + t * 1.2, 0, 1.5); const ph = t * 7; TSUMA.userData.legs[0].rotation.x = Math.sin(ph) * 0.5; TSUMA.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5; TSUMA.userData.arms[0].rotation.x = -Math.sin(ph) * 0.4;
  BAG.visible = true; TSUMA.updateMatrixWorld(); const v = new THREE.Vector3(0.36, 0.75, 0); TSUMA.localToWorld(v); BAG.position.copy(v); BAG.rotation.y = Math.PI / 2;
  if (t > d * 0.4) say(yamezu, t, d * 0.4, TSUMA.position.x, 2.2, 1.5, 1.3);
  setHud('転勤が消えて', '1週間後', 1);
  look(TSUMA.position.x + 0.3, 1.7, 5.2, TSUMA.position.x, 1.2, 1.5, 50);
  return S;
}
function sKaeru(t, d) { // 1か月後。単身赴任の夫が、段ボール1箱で家に帰ってくる
  reset(); lift(120); OTTO.visible = true; OTTO.rotation.y = Math.PI; const k = clamp(t / (d * 0.7)); OTTO.position.set(DX, 0, lerp(2.6, -1.4, easeOut(k)));
  const ph = t * 6; if (k < 1) { OTTO.userData.legs[0].rotation.x = Math.sin(ph) * 0.45; OTTO.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45; }
  OTTO.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); CAN.visible = false;
  BOX1.visible = true; OTTO.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.1, 0.5); OTTO.localToWorld(v); BOX1.position.copy(v); BOX1.rotation.y = OTTO.rotation.y;
  if (t > d * 0.35) say(hitohako, t, d * 0.35, DX + 0.3, 2.15, OTTO.position.z, 0.9);
  setHud('転勤が消えて', '1か月後', 1);
  look(DX + 1.8, 2.0, OTTO.position.z + 3.2, DX, 1.2, OTTO.position.z - 0.6, 50);
  return S;
}
function sYorokobu(t, d) { // でも、喜んでいない人がいた
  reset(); lift(120); OTTO.visible = true; OTTO.position.set(DX, 0, -1.6); OTTO.rotation.y = Math.PI * 0.85; OTTO.userData.head.rotation.x = 0.35; CAN.visible = false;
  BOX1.visible = true; BOX1.position.set(DX + 0.5, 0.2, -1.4);
  if (t > d * 0.4) say(yorokonde, t, d * 0.4, DX, 2.4, -1.6, 1.2);
  const u = ease(clamp(t / d)); look(DX + lerp(-1.2, -0.8, u), 1.6, lerp(1.6, 0.6, u), DX, 1.3, -1.6, 50);
  return S;
}
function sJiyu(t, d) { // 夜の自由が消えた夫。毎晩のラーメンも、週末の一人の趣味も
  reset(); lift(120); oneRoom(); hemi.intensity = 0.95; OTTO.userData.arms[1].rotation.set(-1.5, 0, 0.3);
  const k1 = clamp((t - d * 0.4) / 0.4), k2 = clamp((t - d * 0.7) / 0.4); RAMEN.scale.setScalar(1 - k1); RAMEN.visible = k1 < 1; ROD.visible = k2 < 1; GAME.visible = k2 < 1;
  say(jiyu, t, 0.3, BX + 0.35, 1.5, -1.0, 0.6); if (t > d * 0.4) say(kieta, t, d * 0.4, BX + 0.85, 1.22, -1.0, 0.45);
  if (k1 > 0 && k1 < 1) { sparkA.init([[BX + 0.3, 0.45, -0.6]], 0.2, 0.5); }
  look(BX + 0.7, 1.4, 1.4, BX + 0.45, 0.85, -1.0, 50);
  return S;
}
function homeSet() {
  TSUMA.visible = true; TSUMA.position.set(CX - 0.5, 0, -1.85); poseSit(TSUMA);
  KO.visible = true; KO.position.set(CX + 0.5, 0.2, -1.85); KO.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2);
  BAGS.forEach((b, i) => { b.visible = true; b.position.set(CX + 0.5 + (i - 0.5) * 0.18, 0.62 + i * 0.3, -0.55); });
  CAN.visible = false;
}
function sSeki(t, d) { // 帰った家には、もう自分の席がない
  reset(); lift(120); homeSet(); OTTO.visible = true; OTTO.position.set(CX + 1.2, 0, 0.2); OTTO.rotation.y = -0.6; OTTO.userData.head.rotation.x = 0.25;
  if (t > d * 0.45) say(sekiganai, t, d * 0.45, CX + 0.5, 1.6, -0.5, 1.2);
  const u = ease(clamp(t / d)); look(CX + lerp(0.6, 0.3, u), 2.2, lerp(3.4, 2.9, u), CX + 0.2, 0.95, -1.1, 50);
  return S;
}
function sGomi(t, d) { // 妻は言う。ゴミの日、知ってる？
  reset(); lift(120); homeSet(); TSUMA.userData.head.rotation.y = 0.6; OTTO.visible = true; OTTO.position.set(CX + 1.2, 0, 0.0); OTTO.rotation.y = -1.0; sweatO.userData.set(1, t);
  if (t > 0.4) say(gomi, t, 0.4, CX - 0.2, 1.85, -1.6, 1.4);
  look(CX + 0.1, 1.55, 1.5, CX - 0.3, 1.15, -1.6, 50);
  return S;
}
function sItsumade(t, d) { // 子どもは言う。お父さん、いつまでいるの？
  reset(); lift(120); homeSet(); KO.userData.head.rotation.y = 0.6; OTTO.visible = true; OTTO.position.set(CX + 1.2, 0, 0.0); OTTO.rotation.y = -1.0; sweatO.userData.set(1, t);
  if (t > 0.4) say(itsumade, t, 0.4, CX + 0.5, 1.5, -1.6, 1.2);
  look(CX + 0.9, 1.35, 0.9, CX + 0.5, 0.95, -1.7, 50);
  return S;
}
function sKekka(t, d) { // 結果：転勤が消えて、一番困ったのは、会社でも家族でもなく、単身赴任を楽しんでいた夫だった
  reset(); lift(120); homeSet(); OTTO.visible = true; OTTO.position.set(CX + 1.8, 0, 0.6); OTTO.rotation.y = -0.4; OTTO.userData.head.rotation.x = 0.4;
  if (t > d * 0.55) say(komatta, t, d * 0.55, CX + 0.9, 2.1, 0.0, 1.3);
  const u = ease(clamp(t / d)); look(CX + lerp(0.4, 1.0, u), lerp(2.2, 2.4, u), lerp(3.6, 4.2, u), CX + 0.8, 1.0, -0.6, 50);
  return S;
}
function sNatsu(t, d) { // 単身赴任は、会社が夫にくれた、長すぎる一人暮らしの夏休みだったのかもしれない
  reset(); lift(120); oneRoom(); hemi.intensity = 1.25; OTTO.userData.arms[0].rotation.set(-2.6, 0, -0.3);
  SUN.visible = BRIM.visible = t > d * 0.3; OTTO.updateMatrixWorld(); const v = new THREE.Vector3(0, 2.05, 0); OTTO.localToWorld(v); SUN.position.copy(v); BRIM.position.set(v.x, v.y - 0.08, v.z);
  if (t > d * 0.5) say(natsuyasumi, t, d * 0.5, BX + 0.5, 1.6, -1.0, 0.95);
  look(BX + 0.8, 1.35, 1.6, BX + 0.3, 0.95, -1.1, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); JIREI.forEach(d => d.visible = false); boardCam(0); return S; }

const NARR = { '単身赴任先': 'たんしんふにんさき', '単身赴任': 'たんしんふにん', '夫': 'おっと', '缶': 'かん', '固まる': 'かたまる', '家族': 'かぞく', '不満': 'ふまん', '紙一枚': 'かみいちまい', '暮らし': 'くらし', '1日目': 'いちにちめ', '転勤族': 'てんきんぞく', '転校': 'てんこう', '飛び跳ねる': 'とびはねる', '1週間後': 'いっしゅうかんご', '妻': 'つま', '辞めずに': 'やめずに', '出勤': 'しゅっきん', '1か月後': 'いっかげつご', '段ボール1箱': 'だんボールひとはこ', '喜んで': 'よろこんで', '毎晩': 'まいばん', '週末': 'しゅうまつ', '一人': 'ひとり', '趣味': 'しゅみ', '自分': 'じぶん', '席': 'せき', 'ゴミの日': 'ゴミのひ', '結果：': '結果、', '一番': 'いちばん', '一人暮らし': 'ひとりぐらし', '夏休み': 'なつやすみ', '転勤': 'てんきん' };
const P = planTimes([
  ['単身赴任先のワンルームで、', (t, d) => sKatamaru(t, 2 * d)],
  ['夫が缶ビールを<br>持ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['家族の不満から。紙一枚で、<br>家族の暮らしが決まっていた。', sFuman],
  ['1日目。転勤族の子どもが、<br>転校しなくていいと聞いて', (t, d) => sKo(t, 2 * d)],
  ['飛び跳ねる。', (t, d) => sKo(t + d, 2 * d)],
  ['1週間後。妻は、辞めずに済んだ<br>仕事に、そのまま出勤する。', sTsuma],
  ['1か月後。単身赴任の夫が、<br>段ボール1箱で家に帰ってくる。', sKaeru],
  ['でも、喜んでいない人がいた。', sYorokobu],
  ['夜の自由が消えた夫。<br>毎晩のラーメンも、', (t, d) => sJiyu(t, 2 * d)],
  ['週末の一人の趣味も。', (t, d) => sJiyu(t + d, 2 * d)],
  ['帰った家には、<br>もう自分の席がない。', sSeki],
  ['妻は言う。<br>ゴミの日、知ってる？', sGomi],
  ['子どもは言う。<br>お父さん、いつまでいるの？', sItsumade],
  ['結果：転勤が消えて、<br>一番困ったのは、', (t, d) => sKekka(t, 3 * d)],
  ['会社でも家族でもなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['単身赴任を楽しんでいた<br>夫だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['単身赴任は、会社が夫にくれた、', (t, d) => sNatsu(t, 2 * d)],
  ['長すぎる一人暮らしの夏休み<br>だったのかもしれない。', (t, d) => sNatsu(t + d, 2 * d)],
  ['単身赴任、家族は<br>ついていく？ついていかない？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0686',
    v2: true,
    tt: 'main',
    hookLine: '会社の掲示板に貼られた 辞令 の紙が、一斉にパッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本から転勤が消えたら？',
    titleHtml: 'もしも日本から<br>転勤が<br>消えたら？',
    mood: 'tension', seed: 686, hits: [TP, P.at(13), P.at(17)], risers: [P.at(7)], impacts: [P.at(10, 1.4), P.at(12, 0.4), P.at(15, 0.2)],
    sfx: [[TP, 'poof'], [P.at(1, 0.6), 'whoosh'], [P.at(3, 0.5), 'bubble'], [P.at(8, 1.0), 'poof'], [P.at(9, 0.6), 'poof'], [P.at(11, 0.4), 'meter', 0.3]],
    narr: NARR,
    ask: '単身赴任、家族はついていく？ついていかない？',
    caption: 'もしも日本から転勤が消えたら？\n\n単身赴任先のワンルームで、夫が缶ビールを持ったまま固まる。\n家族の不満から。紙一枚で、家族の暮らしが決まっていた。\n1日目。転勤族の子どもが、転校しなくていいと聞いて飛び跳ねる。\n1週間後。妻は、辞めずに済んだ仕事に、そのまま出勤する。\n1か月後。単身赴任の夫が、段ボール1箱で家に帰ってくる。\nでも、喜んでいない人がいた。\n夜の自由が消えた夫。毎晩のラーメンも、週末の一人の趣味も。\n帰った家には、もう自分の席がない。\n妻は言う。ゴミの日、知ってる？\n子どもは言う。お父さん、いつまでいるの？\n\n結果：転勤が消えて、一番困ったのは、会社でも家族でもなく、単身赴任を楽しんでいた夫だった。\n単身赴任は、会社が夫にくれた、長すぎる一人暮らしの夏休みだったのかもしれない。\n\n単身赴任、家族はついていく？ついていかない？ コメントで教えて。\n\n※風刺ネタです。転勤が消えるのは、もしもの設定です。登場する人物・会社は架空です',
    hashtags: ['もしもラボ', 'もしも', '転勤', '単身赴任', '会社あるある'],
    endStats: [['消えたのは', '転勤の辞令', 'もしもの設定'], ['一番困ったのは', '単身赴任の夫', 'もしもの結果'], ['単身赴任の正体', '長すぎる夏休み', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
