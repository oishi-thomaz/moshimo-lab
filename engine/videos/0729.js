import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, makeOji, label, pop, makePhone } from '../satire-kit.js';
import { makeSweat, poseClear, poseSit, poseSlump, posePoint } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeCounter, makePot, makeTable } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも 誰が稼いでると思ってる と言った夫が、妻と入れ替わったら？（皮肉回・台本 S133・図星／男と女のもしも）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。誰が稼いでると思ってるんだ と言った夫が、妻と服ごと入れ替わって固まる回。後半で 母さんは楽でいいな と言ってきた夫の父 にも返す
// 数字は使わない（家事・育児時間の調査は出さない。時刻は筋の中の数）。妻はパートで働いている姿にして、専業主婦を下に見る形にしない。子どもは笑われる側にしない。実在の商品・ロゴは出さない

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#e0e6ec' }); hemi.intensity = 1.3;

// 服を入れ替えられるように、上半身の色を1人ずつの material にする
function ownShirt(p) { const torso = p.children.find(c => c.isMesh && Math.abs(c.position.y - 1.17) < 0.01); const m = torso.material.clone(); torso.material = m; p.userData.arms.forEach(a => { a.children[0].material = m; }); p.userData.shirtM = m; }
function makeApron(color = '#f2a0b8') { const g = new THREE.Group(); const a = box(0.44, 0.78, 0.02, mat(color)); a.position.set(0, 0.98, 0.15); g.add(a); const pk = box(0.2, 0.12, 0.022, mat('#ffffff')); pk.position.set(0, 0.86, 0.162); g.add(pk); const st = box(0.04, 0.3, 0.02, mat(color)); for (const s of [-1, 1]) { const x = st.clone(); x.position.set(s * 0.12, 1.38, 0.15); g.add(x); } return g; }
function makeTie() { const g = new THREE.Group(); const sh = box(0.2, 0.5, 0.02, mat('#f4f4f2')); sh.position.set(0, 1.22, 0.142); g.add(sh); const t = box(0.07, 0.42, 0.02, mat('#3a6ab2')); t.position.set(0, 1.22, 0.152); g.add(t); return g; }
const SUIT = '#3a4256', HOME = '#e8c8a0';
const OTTO = makeMan({ shirt: SUIT, hair: '#1d1a19' }); ownShirt(OTTO); S.add(OTTO); const sweatO = makeSweat(); OTTO.userData.head.add(sweatO);
const TSUMA = makeWoman({ shirt: HOME, hair: '#3a2620' }); ownShirt(TSUMA); S.add(TSUMA);
const APRON_O = makeApron(); OTTO.add(APRON_O); const TIE_O = makeTie(); OTTO.add(TIE_O);
const APRON_T = makeApron(); TSUMA.add(APRON_T); const TIE_T = makeTie(); TSUMA.add(TIE_T);
const CHICHI = makeOji(rng(133), { shirt: '#7a6a55' }); S.add(CHICHI); const APRON_C = makeApron('#8ab0d8'); CHICHI.add(APRON_C); const sweatC = makeSweat(); CHICHI.userData.head.add(sweatC);
const KID = makePerson({ skin: '#f5d3b5', hair: '#2a1a14', shirt: '#f2c94c', pants: '#3a5a9a', scale: 0.6 }); S.add(KID);
const EARS = [-1, 1].map(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#ffd23a')); e.position.set(s * 0.215, 0.24, 0); OTTO.userData.head.add(e); return e; });
// 赤ちゃん（おくるみ）
const BABY = new THREE.Group(); { const b = box(0.3, 0.16, 0.46, mat('#f4e8d8')); BABY.add(b); const h = box(0.17, 0.16, 0.16, mat('#f5d3b5')); h.position.set(0, 0.04, -0.28); BABY.add(h); } S.add(BABY);
const NAKU = label('おぎゃー', { w: 512, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.5 }); S.add(NAKU);
function setClothes(p, swapped) { const isO = p === OTTO; const apron = isO ? APRON_O : APRON_T, tie = isO ? TIE_O : TIE_T; const home = isO ? swapped : !swapped; p.userData.shirtM.color.set(home ? HOME : SUIT); apron.visible = home; tie.visible = !home; }

// ---------- A：居間（原点） ----------
room({ x: 0, w: 9, d: 6, h: 3.0, wall: '#efe8da', floor: '#c8a880' });
const SOFA = new THREE.Group(); { const b = box(2.2, 0.45, 0.9, mat('#7a8a9a')); b.position.y = 0.22; SOFA.add(b); const bk = box(2.2, 0.6, 0.2, mat('#6a7a8a')); bk.position.set(0, 0.7, -0.4); SOFA.add(bk); } SOFA.position.set(0.2, 0, -2.2); S.add(SOFA);
const BAG = box(0.4, 0.3, 0.12, mat('#2a2220')); S.add(BAG);
const dare = label('誰が稼いでると 思ってるんだ', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.4 }); S.add(dare);
const irekawari = label('入れ替わり', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.85 }); S.add(irekawari);
const sparkA = makeSparkles(160, 0.12, 0xfff2c0); S.add(sparkA.points); sparkA.init([[-0.6, 1.2, -0.3], [0.7, 1.2, -0.3]], 0.6, 0.8);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const iru = label('家にいるだけで いいよな', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.35 }); S.add(iru);
const zzz = label('寝落ち', { w: 512, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.6 }); S.add(zzz);
const mimisen = label('家の仕事を見ない 耳せん', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(mimisen);

// ---------- B：台所（x=60） ----------
const BX = 60;
room({ x: BX, w: 9, d: 6, h: 3.0, wall: '#f0ebe0', floor: '#c8b494' });
const KC = makeCounter({ w: 3.4 }); KC.position.set(BX - 0.4, 0, -2.5); S.add(KC);
const POT = makePot('#c84a3a'); POT.position.set(BX - 0.4 + KC.userData.stove.x, KC.userData.stove.y, -2.5); S.add(POT);
const BENTO = [0, 1].map(i => { const b = box(0.32, 0.1, 0.22, mat(['#3a6ab2', '#d84a6a'][i])); b.position.set(BX - 1.4 + i * 0.4, 0.96, -2.3); S.add(b); return b; });
const HOIKU = box(0.4, 0.3, 0.14, mat('#f2c94c')); HOIKU.position.set(BX + 0.9, 0.98, -2.3); S.add(HOIKU);
const TBL = makeTable({ w: 1.4, d: 0.8 }); TBL.position.set(BX + 1.6, 0, -0.6); S.add(TBL);
const NOTE = box(0.36, 0.01, 0.26, mat('#ffffff')); NOTE.position.set(BX + 1.6, 0.76, -0.5); S.add(NOTE);
const COFFEE = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 12), mat('#f4f4f2')); COFFEE.add(c); } S.add(COFFEE);
const STEAMC = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false })); S.add(m); return m; });
const BUNTAN = makeDoc({ title: '今日の分担', rows: ['朝ごはん', '送り', 'お迎え', '夕飯'], head: '#3a6ab2', w: 0.5, h: 0.62 }); BUNTAN.rotation.x = -Math.PI / 2; S.add(BUNTAN);
const doji = label('同時に来る', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.85 }); S.add(doji);
const marutsuke = label('宿題の 丸つけ', { w: 768, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.95 }); S.add(marutsuke);
const chichimo = label('夫の父も', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(chichimo);
const raku = label('母さんは 楽でいいな', { w: 1024, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.2 }); S.add(raku);
const demo = label('入れ替わったのは 夫婦だけじゃない', { w: 1300, size: 82, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(demo);
const jibun = label('自分から', { w: 512, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.7 }); S.add(jibun);
const atatakai = label('温かいうちに', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(atatakai);

// ---------- C：パート先のレジ（x=120） ----------
const CX = 120;
room({ x: CX, w: 9, d: 6, h: 3.0, wall: '#e8eef2', floor: '#b8bcc4' });
const REG = new THREE.Group(); { const c = box(1.8, 0.9, 0.7, mat('#d8dce2')); c.position.y = 0.45; REG.add(c); const r = box(0.4, 0.3, 0.35, mat('#3a3e48')); r.position.set(-0.4, 1.05, 0); REG.add(r); const sc = box(0.3, 0.2, 0.03, new THREE.MeshBasicMaterial({ color: '#7ad0a0' })); sc.position.set(-0.4, 1.3, 0.12); sc.rotation.x = -0.4; REG.add(sc); } REG.position.set(CX, 0, -0.9); S.add(REG);
const SHELF = new THREE.Group(); for (let i = 0; i < 3; i++) { const s = box(2.4, 0.06, 0.5, mat('#c8ccd4')); s.position.set(0, 0.6 + i * 0.6, 0); SHELF.add(s); for (let j = 0; j < 6; j++) { const g = box(0.25, 0.3, 0.25, mat(['#e86a4a', '#5ab07a', '#f2c94c', '#5a8ae8'][(i + j) % 4])); g.position.set(-1.0 + j * 0.4, 0.78 + i * 0.6, 0); SHELF.add(g); } } SHELF.position.set(CX + 0.6, 0, -2.7); S.add(SHELF);
const PH = makePhone({ w: 0.5, h: 1.0 }); S.add(PH.g);
const netsu = label('保育園から 熱の電話', { w: 1024, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.25 }); S.add(netsu);
const kyukei = label('休憩中', { w: 512, size: 110, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.6 }); S.add(kyukei);

const PEOPLE = [OTTO, TSUMA, CHICHI, KID];
const LABELS = [NAKU, dare, irekawari, katamaru, iru, zzz, mimisen, doji, marutsuke, chichimo, raku, demo, jibun, atatakai, netsu, kyukei];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); sweatC.userData.set(0);
  setClothes(OTTO, true); setClothes(TSUMA, true); EARS.forEach(e => e.visible = false); BABY.visible = false; BAG.visible = false; PH.g.visible = false; COFFEE.visible = false; STEAMC.forEach(s => s.visible = false); BUNTAN.visible = false; NOTE.visible = false;
  ['', '', '', ''].forEach((s, i) => BUNTAN.userData.fill(i, s)); hemi.intensity = 1.3;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function walk(p, t, sp = 7, a = 0.4) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * a; p.userData.legs[1].rotation.x = -s * a; }
function holdBaby(p, t, cry = true) { p.userData.arms.forEach((a, i) => a.rotation.set(-1.2, 0, i ? 0.35 : -0.35)); p.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.08, 0.33); p.localToWorld(v); BABY.visible = true; BABY.position.copy(v); BABY.rotation.set(0, p.rotation.y + Math.PI / 2, Math.sin(t * 9) * 0.06); }
const TP = 0.35;
function couple(t, swapped) { stand(OTTO, -0.6, -0.3, 0.35); stand(TSUMA, 0.7, -0.3, -0.35); setClothes(OTTO, swapped); setClothes(TSUMA, swapped); }
function livCam(u = 0) { look(lerp(0.05, 0.0, u), lerp(1.95, 1.9, u), lerp(5.2, 4.8, u), 0.05, 1.75, -0.4, 50); }
function shot0(t) { // 0秒＝サムネ：夫が 誰が稼いでると思ってるんだ と言った瞬間、夫と妻の服がパッと入れ替わる
  reset(); lift(0); const sw = t >= TP; couple(t, sw);
  if (!sw) { posePoint(OTTO, 1); BAG.visible = true; BAG.position.set(-0.85, 0.6, -0.2); holdBaby(TSUMA, t); }
  else { holdBaby(OTTO, t); sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; say(irekawari, t, TP + 0.1, 0.05, 0.85, 0.2, 0.75); }
  dare.visible = true; dare.position.set(-0.3, 2.12, -0.3); dare.userData.size(1.15);
  livCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // エプロン姿になった夫が、泣く赤ちゃんを抱いたまま固まる
  reset(); lift(140); couple(t, true); holdBaby(OTTO, t); sweatO.userData.set(1, t); TSUMA.userData.head.rotation.y = -0.4;
  say(NAKU, t, 0.2, -0.2, 1.65, 0.1, 0.45); if (t > d * 0.5) say(katamaru, t, d * 0.5, -0.6, 2.3, -0.3, 0.38);
  const u = ease(clamp(t / d)); look(lerp(-0.3, -0.5, u), 1.75, lerp(2.9, 2.5, u), -0.55, 1.4, -0.3, 50);
  return S;
}
function sFuman(t, d) { // 妻たちの不満から。家にいるだけでいいよな、と言われてきた（回想：ソファの夫と、立ち働く妻）
  reset(); lift(140); setClothes(OTTO, false); setClothes(TSUMA, false); stand(OTTO, 0.2, -2.15, 0); poseSit(OTTO); OTTO.position.y += 0.08; OTTO.userData.arms[1].rotation.set(-0.6, 0, 0.2);
  stand(TSUMA, -1.4, -0.9, 0.5); holdBaby(TSUMA, t); if (t > d * 0.45) say(iru, t, d * 0.45, 0.2, 2.35, -2.0, 1.15);
  look(-0.5, 2.0, 3.6, -0.6, 1.2, -1.5, 50);
  return S;
}
function sMorning(t, d) { // 朝7時。弁当2つと、保育園の準備が、同時に来る
  reset(); lift(140); const k = (t * 0.9) % 2; stand(OTTO, BX - 1.2 + Math.abs(k - 1) * 1.6, -1.6, k < 1 ? -Math.PI / 2 : Math.PI / 2); walk(OTTO, t, 10);
  if (t > d * 0.45) say(doji, t, d * 0.45, BX - 0.3, 2.35, -2.0, 0.8);
  setHud('入れ替わって', '朝7時', 1);
  look(BX - 0.2, 2.2, 2.4, BX - 0.3, 1.2, -2.0, 50);
  return S;
}
function sNoon(t, d) { // 昼12時。パートの休憩中に、保育園から熱の電話
  reset(); lift(140); stand(OTTO, CX + 0.8, 0.0, -0.4); OTTO.userData.arms[1].rotation.set(-2.6, 0, 0.3); OTTO.userData.head.rotation.y = -0.3;
  OTTO.updateMatrixWorld(); const v = new THREE.Vector3(0.28, 1.62, 0.1); OTTO.localToWorld(v); PH.g.visible = true; PH.g.position.copy(v); PH.g.rotation.set(0, OTTO.rotation.y + 1.4, 0); PH.g.scale.setScalar(0.28); PH.draw('call', (g, W, H) => { g.fillStyle = '#3a8a5a'; g.fillRect(0, 0, W, H); });
  say(kyukei, t, 0.2, CX - 0.6, 1.9, -0.9, 0.55); if (t > d * 0.4) { sweatO.userData.set(1, t); say(netsu, t, d * 0.4, CX + 0.6, 2.4, -0.2, 1.1); }
  setHud('入れ替わって', '昼12時', 1);
  look(CX + 0.3, 1.9, 3.4, CX + 0.3, 1.4, -0.6, 50);
  return S;
}
function sEvening(t, d) { // 夕方6時。夕飯を作る横で、宿題の丸つけ
  reset(); lift(140); stand(OTTO, BX - 0.4 + KC.userData.stove.x, -1.75, Math.PI); OTTO.userData.arms[1].rotation.set(-1.1, 0, Math.sin(t * 8) * 0.15);
  if (t > d * 0.35) { OTTO.rotation.y = Math.PI * 0.4; OTTO.userData.arms[0].rotation.set(-1.0, 0, 0); }
  stand(KID, BX + 1.6, 0.0, Math.PI); poseSit(KID); KID.position.y = 0.05; KID.userData.arms.forEach(a => a.rotation.set(-1.3, 0, 0)); NOTE.visible = true;
  if (t > d * 0.45) say(marutsuke, t, d * 0.45, BX + 0.9, 2.3, -0.8, 0.85);
  setHud('入れ替わって', '夕方6時', 1);
  look(BX + 0.8, 2.1, 2.8, BX + 0.6, 1.0, -1.2, 50);
  return S;
}
function sDemo(t, d) { // でも、入れ替わったのは、夫婦だけじゃなかった
  reset(); lift(140); stand(CHICHI, BX - 0.6, -1.6, 0.2); CHICHI.userData.head.rotation.x = -0.1; APRON_C.visible = false;
  if (t > d * 0.35) say(demo, t, d * 0.35, BX - 0.2, 2.45, -1.6, 1.25);
  look(BX - 0.4, 1.9, 2.8, BX - 0.5, 1.45, -1.8, 50);
  return S;
}
function sChichi(t, d) { // 母さんは楽でいいな と言っていた夫の父も、エプロン姿で台所に立つ
  reset(); lift(140); const ph = t / d; stand(CHICHI, BX - 0.6, -1.75, ph < 0.45 ? 0.2 : Math.PI); APRON_C.visible = ph >= 0.45;
  if (ph < 0.45) say(raku, t, 0.2, BX - 0.2, 2.4, -1.6, 1.05); else { CHICHI.userData.arms.forEach(a => a.rotation.set(-1.1, 0, Math.sin(t * 8) * 0.1)); sweatC.userData.set(1, t); say(chichimo, t, d * 0.5, BX - 0.6, 2.35, -1.6, 0.6); }
  look(BX - 0.4, 1.95, 2.9, BX - 0.5, 1.4, -1.9, 50);
  return S;
}
function sNight(t, d) { // 夜11時。夫は、ソファに座った瞬間に寝落ちする
  reset(); lift(140); hemi.intensity = 0.8; stand(OTTO, 0.2, -2.15, 0); poseSit(OTTO); OTTO.position.y += 0.08; const k = clamp((t - d * 0.3) / 0.6); OTTO.rotation.z = 0.5 * easeOut(k); OTTO.userData.head.rotation.x = 0.4 * k;
  if (k >= 1) say(zzz, t, d * 0.3 + 0.6, 0.0, 2.1, -2.0, 0.55);
  setHud('入れ替わって', '夜11時', 1);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.3, u), 1.6, lerp(1.0, 0.6, u), 0.1, 1.1, -2.1, 50);
  return S;
}
function sNext(t, d) { // 次の朝。夫は、自分から 今日の分担 を紙に書く
  reset(); lift(160); stand(OTTO, BX + 1.6, -1.35, 0); poseSit(OTTO); OTTO.position.y += 0.05; OTTO.userData.arms.forEach(a => a.rotation.set(-1.25, 0, 0)); OTTO.userData.head.rotation.x = 0.35;
  BUNTAN.visible = true; BUNTAN.position.set(BX + 1.6, 0.76, -0.6); const rows = ['夫', '夫', '妻', '夫']; rows.forEach((r, i) => BUNTAN.userData.fill(i, t > 0.3 + i * 0.5 ? r : ''));
  if (t > d * 0.45) say(jibun, t, d * 0.45, BX + 1.95, 1.45, -1.1, 0.42);
  setHud('入れ替わって', '次の朝', 1);
  look(BX + 1.6, 2.6, 1.9, BX + 1.6, 0.95, -0.9, 50);
  return S;
}
function sCoffee(t, d) { // 妻は、初めて朝のコーヒーを、温かいうちに飲む
  reset(); lift(140); stand(TSUMA, BX + 1.6, 0.15, Math.PI); poseSit(TSUMA); TSUMA.position.y += 0.05; TSUMA.userData.arms[1].rotation.set(-1.9, 0, -0.35); TSUMA.userData.head.rotation.x = -0.1;
  TSUMA.updateMatrixWorld(); const v = new THREE.Vector3(-0.15, 1.5, 0.35); TSUMA.localToWorld(v); COFFEE.visible = true; COFFEE.position.copy(v);
  STEAMC.forEach((s, i) => { s.visible = true; const u = (t * 0.6 + i / 3) % 1; s.position.set(v.x + Math.sin(t * 3 + i) * 0.02, v.y + 0.08 + u * 0.2, v.z); s.material.opacity = 0.6 * (1 - u); });
  if (t > d * 0.4) say(atatakai, t, d * 0.4, BX + 1.6, 2.2, -0.1, 0.8);
  look(BX + 1.3, 1.6, -1.6, BX + 1.6, 1.3, 0.1, 50);
  return S;
}
function sKekka(t, d) { // 結果：入れ替わって夫が知ったのは、家の中に、稼いでいない時間は1分もなかったことだった
  reset(); lift(140); couple(t, true); holdBaby(OTTO, t); OTTO.userData.head.rotation.x = 0.15;
  setTop('結果', '稼いでない時間 0分', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.0, u), lerp(1.9, 2.2, u), lerp(3.6, 4.8, u), 0.05, 1.3, -0.4, 50);
  return S;
}
function sMimisen(t, d) { // 誰が稼いでると思ってる は、自慢じゃなく、家の仕事を見ないための、耳せんだったのかもしれない
  reset(); lift(140); setClothes(OTTO, false); stand(OTTO, -0.2, -0.4, 0.15); EARS.forEach(e => e.visible = t > d * 0.3);
  if (t > d * 0.45) say(mimisen, t, d * 0.45, -0.2, 2.35, -0.4, 1.15);
  const u = ease(clamp(t / d)); look(lerp(0.1, -0.1, u), 1.8, lerp(2.8, 2.3, u), -0.2, 1.6, -0.4, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); couple(t, true); holdBaby(OTTO, t); dare.visible = true; dare.position.set(-0.3, 2.05, -0.3); dare.userData.size(1.2); livCam(0); return S; }

const NARR = { '誰が稼いでると思ってる': 'だれがかせいでるとおもってる', 'エプロン姿': 'エプロンすがた', '泣く': 'なく', '赤ちゃん': 'あかちゃん', '抱いた': 'だいた', '固まる': 'かたまる', '妻たち': 'つまたち', '不満': 'ふまん', '家にいる': 'いえにいる', '言われてきた': 'いわれてきた', '朝7時': 'あさしちじ', '弁当2つ': 'べんとうふたつ', '保育園': 'ほいくえん', '準備': 'じゅんび', '同時に': 'どうじに', '来る': 'くる', '昼12時': 'ひるじゅうにじ', '休憩中': 'きゅうけいちゅう', '熱': 'ねつ', '電話': 'でんわ', '夕方6時': 'ゆうがたろくじ', '夕飯': 'ゆうはん', '作る': 'つくる', '横': 'よこ', '宿題': 'しゅくだい', '丸つけ': 'まるつけ', '入れ替わった': 'いれかわった', '夫婦': 'ふうふ', '母さん': 'かあさん', '楽': 'らく', '言っていた': 'いっていた', '夫の父': 'おっとのちち', '台所': 'だいどころ', '立つ': 'たつ', '夜11時': 'よるじゅういちじ', '座った': 'すわった', '瞬間': 'しゅんかん', '寝落ち': 'ねおち', '次の朝': 'つぎのあさ', '自分から': 'じぶんから', '今日の分担': 'きょうのぶんたん', '紙': 'かみ', '書く': 'かく', '初めて': 'はじめて', '温かい': 'あたたかい', '飲む': 'のむ', '結果：': '結果、', '入れ替わって': 'いれかわって', '知った': 'しった', '家の中': 'いえのなか', '稼いでいない': 'かせいでいない', '時間': 'じかん', '1分も': 'いっぷんも', '自慢': 'じまん', '家の仕事': 'いえのしごと', '見ない': 'みない', '耳せん': 'みみせん', '言われた': 'いわれた' };
const P = planTimes([
  ['エプロン姿になった夫が、', (t, d) => sKatamaru(t, 2 * d)],
  ['泣く赤ちゃんを<br>抱いたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['妻たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['家にいるだけでいいよな、<br>と言われてきた。', (t, d) => sFuman(t + d, 2 * d)],
  ['朝7時。弁当2つと、<br>保育園の準備が、同時に来る。', sMorning],
  ['昼12時。パートの休憩中に、<br>保育園から熱の電話。', sNoon],
  ['夕方6時。夕飯を作る横で、<br>宿題の丸つけ。', sEvening],
  ['でも、入れ替わったのは、<br>夫婦だけじゃなかった。', sDemo],
  ['母さんは楽でいいな と<br>言っていた夫の父も、', (t, d) => sChichi(t, 2 * d)],
  ['エプロン姿で台所に立つ。', (t, d) => sChichi(t + d, 2 * d)],
  ['夜11時。夫は、ソファに<br>座った瞬間に寝落ちする。', sNight],
  ['次の朝。夫は、自分から<br>今日の分担 を紙に書く。', sNext],
  ['妻は、初めて朝のコーヒーを、<br>温かいうちに飲む。', sCoffee],
  ['結果：入れ替わって<br>夫が知ったのは、', (t, d) => sKekka(t, 3 * d)],
  ['家の中に、稼いでいない時間は', (t, d) => sKekka(t + d, 3 * d)],
  ['1分もなかったことだった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['誰が稼いでると思ってる は、<br>自慢じゃなく、', (t, d) => sMimisen(t, 2 * d)],
  ['家の仕事を見ないための、<br>耳せんだったのかもしれない。', (t, d) => sMimisen(t + d, 2 * d)],
  ['誰が稼いでると思ってる、<br>言われたことある？', sAsk],
], { shot0, endCard, start: 4.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0729',
    v2: true,
    tt: 'main',
    hookLine: '夫が 誰が稼いでると思ってるんだ と言った瞬間、夫と妻の服がパッと入れ替わる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも 誰が稼いでると思ってる と言った夫が、妻と入れ替わったら？',
    titleHtml: '<span style="font-size:.8em">もしも 誰が稼いでると</span><br><span style="font-size:.8em">思ってる と言った夫が、</span><br><span style="font-size:.9em">妻と入れ替わったら？</span>',
    mood: 'tension', seed: 729, hits: [TP, P.at(13), P.at(17)], risers: [P.at(7)], impacts: [P.at(9, 0.5), P.at(15, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.4), 'alarm'], [P.at(4, 0.6), 'whoosh'], [P.at(5, 0.6), 'alarm'], [P.at(6, 0.6), 'whoosh'], [P.at(10, 0.8), 'meter', 0.2], [P.at(12, 0.6), 'bubble']],
    narr: NARR,
    ask: '誰が稼いでると思ってる、言われたことある？',
    caption: 'もしも 誰が稼いでると思ってる と言った夫が、妻と入れ替わったら？\n\nエプロン姿になった夫が、泣く赤ちゃんを抱いたまま固まる。\n妻たちの不満から。家にいるだけでいいよな、と言われてきた。\n朝7時。弁当2つと、保育園の準備が、同時に来る。\n昼12時。パートの休憩中に、保育園から熱の電話。\n夕方6時。夕飯を作る横で、宿題の丸つけ。\nでも、入れ替わったのは、夫婦だけじゃなかった。\n母さんは楽でいいな と言っていた夫の父も、エプロン姿で台所に立つ。\n夜11時。夫は、ソファに座った瞬間に寝落ちする。\n次の朝。夫は、自分から 今日の分担 を紙に書く。\n妻は、初めて朝のコーヒーを、温かいうちに飲む。\n\n結果：入れ替わって夫が知ったのは、家の中に、稼いでいない時間は1分もなかったことだった。\n誰が稼いでると思ってる は、自慢じゃなく、家の仕事を見ないための、耳せんだったのかもしれない。\n\n誰が稼いでると思ってる、言われたことある？ コメントで教えて。\n\n※風刺ネタです。夫と妻が入れ替わるのは、もしもの設定です。登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '夫婦', '家事育児', '男と女のもしも'],
    endStats: [['入れ替わったもの', '夫と妻の一日', 'もしもの設定'], ['夫が知ったこと', '稼いでない時間 0分', 'もしもの結果'], ['口ぐせの正体', '家の仕事を見ない耳せん', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
