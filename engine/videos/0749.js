import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { poseClear, poseSit, poseSlump, posePoint, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeKotatsu, makeTable } from '../scenes/home.js';

// もしも 母さんの味方 をする夫が、実家に返品されたら？（皮肉回・台本 S148・図星／男と女のもしも）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。母さんは悪気ないんだよ と言った夫の背中に 返品 の札が貼られて、段ボールで実家に返る回。後半で 嫁にだけ厳しかった姑 にも返す
// 数字は使わない。実在の人・ブランドは出さない。お年寄りの体や年齢をばかにしない（叩くのは 嫁にだけ厳しい ふるまい）。段ボールはコミカルに（人を物のように乱暴に扱う絵にしない）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#9ac4e4', ground: '#8a9078' }); hemi.intensity = 1.25;
const HUS = makeMan({ shirt: '#6a8ab0', pants: '#3a3f4e', hair: '#1d1a19' }); S.add(HUS); const sweatH = makeSweat(); HUS.userData.head.add(sweatH);
const WIFE = makeWoman({ shirt: '#e8a8b8', hair: '#3a2018' }); S.add(WIFE);
const MOM = makeWoman({ shirt: '#8a6a9a', hair: '#b8b8b8', skin: '#f0cfb2', pants: '#4a4a5a' }); S.add(MOM); const sweatM = makeSweat(); MOM.userData.head.add(sweatM);
const APRON = box(0.46, 0.66, 0.03, mat('#e8d8a8')); APRON.position.set(0, 1.0, 0.16); MOM.add(APRON);
const CBOX = new THREE.Group(); { const m = mat('#c89a5a'); const b = box(0.9, 0.9, 0.7, m); b.position.y = 0.45; CBOX.add(b); const tp = box(0.92, 0.04, 0.72, mat('#a87a3a')); tp.position.y = 0.9; CBOX.add(tp); const tape = box(0.92, 0.06, 0.12, mat('#d8c898')); tape.position.y = 0.92; CBOX.add(tape); } S.add(CBOX);
const RETURN_TAG = label('返品', { w: 384, size: 150, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(RETURN_TAG);

// ---------- A：夫婦の家のリビング（原点） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#efe6d6', floor: '#b48a5e' });
const SOFA = new THREE.Group(); { const b = box(2.0, 0.45, 0.8, mat('#7a8a9a')); b.position.y = 0.3; SOFA.add(b); const bk = box(2.0, 0.6, 0.2, mat('#6a7a8a')); bk.position.set(0, 0.75, -0.35); SOFA.add(bk); } SOFA.position.set(-1.6, 0, -2.0); S.add(SOFA);
const warugi = label('母さんは 悪気ないんだよ', { w: 1100, size: 88, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.25 }); S.add(warugi);
const sparkA = makeSparkles(120, 0.1, 0xffe08a); S.add(sparkA.points); sparkA.init([[0, 1.5, 0]], 0.5, 0.6);
const hijou = label('話し合いから逃げる 非常口', { w: 1200, size: 84, color: '#fff', bg: 'rgba(40,150,80,.98)', sx: 1.45 }); S.add(hijou);
const fuman = label('義母に何を言われても', { w: 1000, size: 92, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.15 }); S.add(fuman);
const mikata = label('夫は 母さんの味方', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.05 }); S.add(mikata);

// ---------- B：実家（x=60） ----------
const BX = 60;
room({ x: BX, w: 8, d: 6, h: 3, wall: '#e8dcc0', floor: '#c8b078' });
const TATAMI = []; for (let i = 0; i < 4; i++) { const t = flat(1.8, 3.6, i % 2 ? '#c8c088' : '#d0c890', BX - 2.7 + i * 1.8, -0.8, -0.8, 0.012); TATAMI.push(t); }
const KOTA = makeKotatsu({ futon: '#8a5a4a' }); KOTA.position.set(BX + 0.6, 0, -1.0); S.add(KOTA);
const LAUNDRY = []; { const r = rng(48); for (let i = 0; i < 10; i++) { const b = box(0.4, 0.06, 0.3, mat(['#6a8ab0', '#e8e8e8', '#3a3f4e', '#a8c8e8'][i % 4])); S.add(b); LAUNDRY.push(b); } }
const DISHES = []; { for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.04, 16), mat('#f4f4f2')); g.add(pl); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(['#c88a3a', '#e85a3a', '#6ab04a', '#f2d05a', '#a86a3a', '#e8a0a0'][i], { flatShading: true })); f.position.y = 0.07; g.add(f); g.position.set(BX + 0.6 - 0.45 + (i % 3) * 0.45, 0.52, -1.0 - 0.25 + Math.floor(i / 3) * 0.5); S.add(g); DISHES.push(g); } }
const GENKAN = new THREE.Group(); { const d = box(1.4, 2.3, 0.1, mat('#6a4a30')); d.position.y = 1.15; GENKAN.add(d); const gl = box(0.5, 1.0, 0.11, new THREE.MeshBasicMaterial({ color: '#f4ecd4' })); gl.position.set(0, 1.4, 0); GENKAN.add(gl); const st = box(2.4, 0.2, 1.2, mat('#9a9288')); st.position.set(0, 0.1, 0.6); GENKAN.add(st); } GENKAN.position.set(BX - 2.5, 0, -2.9); S.add(GENKAN);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const tatamu = label('洗濯物は 母さん', { w: 900, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.0 }); S.add(tatamu);
const okazu = label('好きなおかず 毎晩', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.05 }); S.add(okazu);
const kaeri = label('そろそろ 帰りなさい', { w: 1000, size: 92, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.1 }); S.add(kaeri);
const demo = label('困ったのは 夫だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(demo);
const sewa = label('息子の世話が 毎日', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.05 }); S.add(sewa);
const omosa = label('嫁の毎日の 重さ', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(omosa);
const kiite = label('妻の話も 聞いて', { w: 900, size: 100, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.0 }); S.add(kiite);
const JUBAKO = new THREE.Group(); { for (let i = 0; i < 2; i++) { const b = box(0.5, 0.18, 0.5, mat(i ? '#1a1a1a' : '#a81a1a')); b.position.y = 0.09 + i * 0.19; JUBAKO.add(b); } } JUBAKO.position.set(BX + 0.6, 0.5, -1.0); S.add(JUBAKO);

// ---------- C：帰り道（x=120） ----------
const CX = 120;
flat(40, 4, '#9a9488', CX, 0);
const HOUSES = []; { const r = rng(5); for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const b = box(3, 2.6, 2.4, mat(['#e8dcc8', '#d8e0e8', '#f0e4d0'][i % 3])); b.position.y = 1.3; g.add(b); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.2, 4), mat(['#5a4a4a', '#4a5a6a', '#6a4a3a'][i % 3])); rf.rotation.y = Math.PI / 4; rf.position.y = 3.2; g.add(rf); g.position.set(CX - 14 + i * 4, 0, -3.5); S.add(g); HOUSES.push(g); } }
const renshu = label('最後まで 聞く練習', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.05 }); S.add(renshu);

const PEOPLE = [HUS, WIFE, MOM];
const LABELS = [RETURN_TAG, warugi, hijou, fuman, mikata, katamaru, tatamu, okazu, kaeri, demo, sewa, omosa, kiite, renshu];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatH.userData.set(0); sweatM.userData.set(0);
  CBOX.visible = false; LAUNDRY.forEach(b => b.visible = false); DISHES.forEach(g => g.visible = false); JUBAKO.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function sitFloor(p, x, z, ry) { stand(p, x, z, ry); poseSit(p); p.position.y = -0.39 + 0.05; }
const TP = 0.3;
function livingCam(u = 0) { look(lerp(0.1, 0.0, u), lerp(1.5, 1.45, u), lerp(5.2, 4.9, u), -0.05, 1.75, -0.8, 50); }
function shot0(t) { // 0秒＝サムネ：夫が 母さんは悪気ないんだよ と言った瞬間、夫の背中に 返品 の札がパッと貼られる
  reset(); lift(0); stand(HUS, -0.1, -0.6, 0.15); HUS.userData.arms[1].rotation.set(-0.6, 0, 0.4); stand(WIFE, 1.15, -0.4, -0.7); WIFE.userData.arms.forEach(a => a.rotation.set(-0.2, 0, 0)); stand(MOM, -1.25, -0.9, 0.5);
  say(warugi, t, -1, -0.1, 0.65, 0.4, 1.3);
  if (t >= TP) { say(RETURN_TAG, t, TP, 0.35, 1.75, -0.2, 0.62); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; }
  livingCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function inBox(x, z, ry) { CBOX.visible = true; CBOX.position.set(x, 0, z); CBOX.rotation.y = ry; stand(HUS, x, z, ry); HUS.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); }
function sKatamaru(t, d) { // 段ボールに入った夫が、実家の玄関で固まる
  reset(); lift(140); inBox(BX - 2.5, -1.6, 0); sweatH.userData.set(1, t); RETURN_TAG.visible = true; RETURN_TAG.position.set(BX - 1.85, 1.3, -1.4); RETURN_TAG.userData.size(0.45);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, BX - 2.0, 2.15, -1.6, 0.38);
  const u = ease(clamp(t / d)); look(BX - 2.5 + lerp(0.4, 0.2, u), 1.75, lerp(2.4, 2.0, u), BX - 2.5, 1.35, -1.8, 50);
  return S;
}
function sFuman(t, d) { // 妻たちの不満から。義母に何を言われても、夫はいつも 母さんの味方
  reset(); lift(140); stand(WIFE, -0.6, -0.8, 0.3); WIFE.userData.head.rotation.x = 0.25; stand(HUS, 0.7, -1.2, -0.5); stand(MOM, 1.4, -1.6, -0.6); HUS.userData.arms[0].rotation.set(0, 0, -0.5);
  say(fuman, t, 0.3, 0.2, 2.55, -1.0, 1.1); if (t > d * 0.55) say(mikata, t, d * 0.55, 0.2, 2.1, -0.8, 1.0);
  look(0.2, 1.6, 4.4, 0.2, 1.4, -1.0, 50);
  return S;
}
function homeCam(u = 0) { look(BX + lerp(0.4, 0.3, u), 2.9, lerp(4.4, 4.0, u), BX + 0.3, 0.9, -1.0, 50); }
function sLaundry(t, d) { // 1日目。実家で、母さんが夫の洗濯物をたたむ
  reset(); lift(140); sitFloor(MOM, BX - 0.6, -0.6, 0.6); MOM.userData.arms.forEach(a => a.rotation.set(-0.9 + Math.sin(t * 4) * 0.2, 0, 0)); sitFloor(HUS, BX + 1.5, -1.0, -Math.PI / 2);
  const n = Math.min(LAUNDRY.length, 3 + Math.floor(t * 2)); LAUNDRY.forEach((b, i) => { b.visible = i < n; b.position.set(BX - 0.2, 0.03 + i * 0.065, -0.3); });
  if (t > d * 0.4) say(tatamu, t, d * 0.4, BX + 0.3, 2.3, -1.2, 0.95);
  setHud('夫が実家に 返品されて', '1日目', 1); homeCam(ease(clamp(t / d)));
  return S;
}
function sOkazu(t, d) { // 3日目。夫の好きなおかずが、毎晩出てくる
  reset(); lift(140); DISHES.forEach((g, i) => g.visible = t > 0.2 + i * 0.25); sitFloor(HUS, BX + 1.5, -1.0, -Math.PI / 2); HUS.userData.arms[1].rotation.set(-1.0, 0, 0); stand(MOM, BX - 0.6, -1.6, 0.6);
  if (t > d * 0.45) say(okazu, t, d * 0.45, BX + 0.3, 2.3, -1.2, 1.0);
  setHud('夫が実家に 返品されて', '3日目', 1); homeCam(0.5);
  return S;
}
function sKaeri(t, d) { // 1週間後。母さんが、夫に そろそろ自分の家に帰りなさい と言う
  reset(); lift(140); stand(MOM, BX - 0.4, -0.6, 0.8); posePoint(MOM, 1); MOM.userData.arms[1].rotation.set(-1.4, 0.5, 0.3); sitFloor(HUS, BX + 1.5, -1.0, -Math.PI / 2); sweatH.userData.set(t > d * 0.5 ? 1 : 0, t);
  if (t > d * 0.35) say(kaeri, t, d * 0.35, BX + 0.3, 2.3, -1.2, 1.05);
  setHud('夫が実家に 返品されて', '1週間後', 1); homeCam(0.7);
  return S;
}
function sDemo(t, d) { // でも、困ったのは、夫だけじゃなかった
  reset(); lift(140); stand(MOM, BX - 0.4, -0.6, 0.5); sweatM.userData.set(1, t); LAUNDRY.forEach((b, i) => { b.visible = true; b.position.set(BX - 1.1 + (i % 2) * 0.45, 0.03 + Math.floor(i / 2) * 0.065, -0.2); });
  if (t > d * 0.35) say(demo, t, d * 0.35, BX + 0.2, 2.45, -0.8, 1.3);
  look(BX + 0.1, 1.7, 3.6, BX - 0.3, 1.3, -0.8, 50);
  return S;
}
function sSewa(t, d) { // 嫁にだけ厳しかった姑も、大人の息子の世話が、毎日になる
  reset(); lift(140); stand(MOM, BX - 0.4, -0.6, 0.5); MOM.userData.arms.forEach(a => a.rotation.set(-0.5, 0, 0)); MOM.userData.head.rotation.x = 0.25; sweatM.userData.set(1, t); sitFloor(HUS, BX + 1.5, -1.0, -Math.PI / 2);
  LAUNDRY.forEach((b, i) => { b.visible = true; b.position.set(BX - 1.1 + (i % 2) * 0.45, 0.03 + Math.floor(i / 2) * 0.065, -0.2); }); DISHES.forEach(g => g.visible = true);
  if (t > d * 0.5) say(sewa, t, d * 0.5, BX + 0.3, 2.3, -1.2, 1.0);
  homeCam(0.4);
  return S;
}
function sOmosa(t, d) { // 姑は、初めて、嫁が毎日していたことの重さを知る
  reset(); lift(140); sitFloor(MOM, BX - 0.4, -0.6, 0.5); poseSlump(MOM, 0.7); MOM.position.y = -0.39 + 0.05; sweatM.userData.set(1, t);
  LAUNDRY.forEach((b, i) => { b.visible = true; b.position.set(BX - 1.2 + (i % 2) * 0.45, 0.03 + Math.floor(i / 2) * 0.065, -0.2); });
  if (t > d * 0.45) say(omosa, t, d * 0.45, BX - 0.3, 2.0, -0.6, 0.95);
  look(BX + 0.2, 1.6, 2.8, BX - 0.4, 0.9, -0.6, 50);
  return S;
}
function sRenshu(t, d) { // 夫は、帰り道で、妻の話を最後まで聞く練習をする
  reset(); lift(140); stand(HUS, CX - 1.0 + t * 0.35, 0.3, Math.PI / 2); poseWalk(HUS, t * 6, 0.7); HUS.userData.head.rotation.x = 0.2 + Math.max(0, Math.sin(t * 4)) * 0.25;
  if (t > d * 0.45) say(renshu, t, d * 0.45, CX - 1.0 + t * 0.35, 2.4, 0.3, 1.0);
  look(CX - 1.0 + t * 0.35, 1.6, 4.6, CX - 1.0 + t * 0.35, 1.4, 0, 50);
  return S;
}
function sShogatsu(t, d) { // 次の正月、夫が初めて、義母に 妻の話も聞いて と言う
  reset(); lift(140); JUBAKO.visible = true; sitFloor(HUS, BX + 1.5, -1.0, -Math.PI / 2); HUS.userData.arms[1].rotation.set(-1.2, 0, 0); sitFloor(WIFE, BX + 0.6, -0.1, Math.PI); sitFloor(MOM, BX - 0.3, -1.0, Math.PI / 2);
  if (t > d * 0.4) say(kiite, t, d * 0.4, BX + 0.7, 2.0, -1.0, 0.95);
  setHud('夫が実家に 返品されて', '次の正月', 1); homeCam(0.6);
  return S;
}
function sKekka(t, d) { // 結果：マザコン夫が返品されて、いちばん早く音を上げたのは、母さんのほうだった
  reset(); lift(140); stand(MOM, BX - 0.4, -0.6, 0.8); posePoint(MOM, 1); MOM.userData.arms[1].rotation.set(-1.4, 0.5, 0.3); sitFloor(HUS, BX + 1.5, -1.0, -Math.PI / 2); sweatM.userData.set(1, t);
  setTop('結果', '音を上げたのは 母さん', fade(t, 0.3, d, 0.25), GOLD); homeCam(0.8);
  return S;
}
function sHijou(t, d) { // 母さんは悪気ない は、やさしさじゃなく、妻との話し合いから逃げる、非常口だったのかもしれない
  reset(); lift(140); stand(HUS, -0.1, -0.6, 0.15); HUS.userData.arms[1].rotation.set(-0.6, 0, 0.4); stand(WIFE, 1.15, -0.4, -0.7);
  if (t > d * 0.45) say(hijou, t, d * 0.45, 0.4, 2.45, -0.8, 1.35);
  livingCam(0.4 + 0.6 * ease(clamp(t / d)));
  return S;
}
function sAsk(t) { reset(); lift(0); stand(HUS, -0.1, -0.6, 0.15); stand(WIFE, 1.15, -0.4, -0.7); stand(MOM, -1.25, -0.9, 0.5); RETURN_TAG.visible = true; RETURN_TAG.position.set(0.35, 1.75, -0.2); RETURN_TAG.userData.size(0.62); livingCam(0); return S; }

const NARR = { '段ボール': 'だんボール', '入った': 'はいった', '夫': 'おっと', '実家': 'じっか', '玄関': 'げんかん', '固まる': 'かたまる', '妻': 'つま', '不満': 'ふまん', '義母': 'ぎぼ', '言われても': 'いわれても', '母さん': 'かあさん', '味方': 'みかた', '1日目': 'いちにちめ', '洗濯物': 'せんたくもの', '3日目': 'みっかめ', '好きな': 'すきな', '毎晩': 'まいばん', '出てくる': 'でてくる', '1週間後': 'いっしゅうかんご', '自分の家': 'じぶんのいえ', '帰りなさい': 'かえりなさい', '困った': 'こまった', '嫁': 'よめ', '厳しかった': 'きびしかった', '姑': 'しゅうとめ', '大人': 'おとな', '息子': 'むすこ', '世話': 'せわ', '毎日': 'まいにち', '初めて': 'はじめて', '重さ': 'おもさ', '知る': 'しる', '帰り道': 'かえりみち', '話': 'はなし', '最後': 'さいご', '聞く': 'きく', '練習': 'れんしゅう', '次の正月': 'つぎのしょうがつ', '結果：': '結果、', '返品': 'へんぴん', '早く': 'はやく', '音を上げた': 'ねをあげた', '悪気': 'わるぎ', '話し合い': 'はなしあい', '逃げる': 'にげる', '非常口': 'ひじょうぐち', '義実家': 'ぎじっか' };
const P = planTimes([
  ['段ボールに入った夫が、<br>実家の玄関で固まる。', sKatamaru],
  ['妻たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['義母に何を言われても、<br>夫はいつも 母さんの味方。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。実家で、母さんが<br>夫の洗濯物をたたむ。', sLaundry],
  ['3日目。夫の好きなおかずが、<br>毎晩出てくる。', sOkazu],
  ['1週間後。母さんが、夫に', (t, d) => sKaeri(t, 2 * d)],
  ['そろそろ自分の家に帰りなさい<br>と言う。', (t, d) => sKaeri(t + d, 2 * d)],
  ['でも、困ったのは、<br>夫だけじゃなかった。', sDemo],
  ['嫁にだけ厳しかった姑も、', (t, d) => sSewa(t, 2 * d)],
  ['大人の息子の世話が、<br>毎日になる。', (t, d) => sSewa(t + d, 2 * d)],
  ['姑は、初めて、嫁が毎日<br>していたことの重さを知る。', sOmosa],
  ['夫は、帰り道で、妻の話を<br>最後まで聞く練習をする。', sRenshu],
  ['次の正月、夫が初めて、義母に<br>妻の話も聞いて と言う。', sShogatsu],
  ['結果：マザコン夫が返品されて、', (t, d) => sKekka(t, 2 * d)],
  ['いちばん早く音を上げたのは、<br>母さんのほうだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['母さんは悪気ない は、<br>やさしさじゃなく、', (t, d) => sHijou(t, 3 * d)],
  ['妻との話し合いから逃げる、', (t, d) => sHijou(t + d, 3 * d)],
  ['非常口だったのかもしれない。', (t, d) => sHijou(t + 2 * d, 3 * d)],
  ['義実家ともめたとき、<br>夫はどっちの味方だった？', sAsk],
], { shot0, endCard, start: 3.7, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0749',
    v2: true,
    tt: 'main',
    hookLine: '夫が 母さんは悪気ないんだよ と言った瞬間、夫の背中に 返品 の札がパッと貼られる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも 母さんの味方 をする夫が、実家に返品されたら？',
    titleHtml: 'もしも 母さんの味方<br>をする夫が、実家に<br>返品されたら？',
    mood: 'tension', seed: 749, hits: [TP, P.at(13), P.at(17)], risers: [P.at(7)], impacts: [P.at(6, 0.3), P.at(14, 0.5)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.6), 'meter', 0.2], [P.at(3, 0.5), 'bubble'], [P.at(5, 0.6), 'alarm'], [P.at(9, 0.5), 'meter', 0.3], [P.at(12, 0.5), 'bubble']],
    narr: NARR,
    ask: '義実家ともめたとき、夫はどっちの味方だった？',
    caption: 'もしも 母さんの味方 をする夫が、実家に返品されたら？\n\n段ボールに入った夫が、実家の玄関で固まる。\n妻たちの不満から。義母に何を言われても、夫はいつも 母さんの味方。\n1日目。実家で、母さんが夫の洗濯物をたたむ。\n3日目。夫の好きなおかずが、毎晩出てくる。\n1週間後。母さんが、夫に そろそろ自分の家に帰りなさい と言う。\nでも、困ったのは、夫だけじゃなかった。\n嫁にだけ厳しかった姑も、大人の息子の世話が、毎日になる。\n姑は、初めて、嫁が毎日していたことの重さを知る。\n夫は、帰り道で、妻の話を最後まで聞く練習をする。\n次の正月、夫が初めて、義母に 妻の話も聞いて と言う。\n\n結果：マザコン夫が返品されて、いちばん早く音を上げたのは、母さんのほうだった。\n母さんは悪気ない は、やさしさじゃなく、妻との話し合いから逃げる、非常口だったのかもしれない。\n\n義実家ともめたとき、夫はどっちの味方だった？ コメントで教えて。\n\n※風刺ネタです。夫が返品されるのは、もしもの設定です。登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'マザコン', '嫁姑', '男と女のもしも'],
    endStats: [['先に音を上げた', '母さん', 'もしもの結果'], ['姑が知ったもの', '嫁の毎日の重さ', 'もしもの結果'], ['悪気ないの正体', '話し合いの非常口', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
