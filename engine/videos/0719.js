import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeSweat, poseSit, poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeCounter, makeDishes, makeFridge, makeTrash } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも家事のダメ出しが、言った人の仕事になったら？（皮肉回・台本 S125・図星／男と女のもしも）
// 2026/11/21 ゆうと承認（投稿サーバーで ok）。夫のやり方に それ違う と全部やり直す妻（30〜40代）が、ダメ出しした家事を全部引き受けて固まる回。後半で 最初から何もしない夫 にも返す
// 数字は使わない（曜日・1か月・2通りは筋の中の数）。子どもは笑われる側にしない。家は架空

const GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#e0e6ec' }); hemi.intensity = 1.3;
const TSUMA = makeWoman({ shirt: '#c8a0c8', hair: '#3a2620' }); S.add(TSUMA); const sweatT = makeSweat(); TSUMA.userData.head.add(sweatT);
const OTTO = makeMan({ shirt: '#6a9ac0', hair: '#2a2220' }); S.add(OTTO);
const OTTO2 = makeMan({ shirt: '#b8a070', hair: '#3a2a1e' }); S.add(OTTO2); const sweatO2 = makeSweat(); OTTO2.userData.head.add(sweatO2);
const BABY = new THREE.Group(); { const b = box(0.32, 0.16, 0.5, mat('#f4e8d8')); BABY.add(b); const h = box(0.18, 0.16, 0.16, mat('#f5d3b5')); h.position.set(0, 0.04, -0.3); BABY.add(h); } S.add(BABY);
const HTOWEL = box(0.3, 0.05, 0.22, mat('#f2d07a')); HTOWEL.position.set(0, -0.66, 0.12); TSUMA.userData.arms[1].add(HTOWEL);

// タオルの山（たたみ方：A＝妻の三つ折り、B＝夫の二つ折り）
function towel(color, kind = 'A') { const w = kind === 'A' ? 0.34 : 0.42, d = kind === 'A' ? 0.22 : 0.3; const m = box(w, 0.05, d, mat(color)); return m; }
const TCOL = ['#f2d07a', '#8ac0e8', '#f0a0b0', '#a8d89a', '#e8e4dc'];
function stack(kind, n, x, z) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const t = towel(TCOL[i % 5], kind); t.position.set((i % 2) * 0.01, 0.025 + i * 0.052, 0); if (kind === 'B') t.rotation.y = (i % 3 - 1) * 0.08; g.add(t); } g.position.set(x, 0, z); S.add(g); return g; }
// ドサッと落ちてくる洗濯物の山
const PILE = []; { const r = rng(125); for (let i = 0; i < 40; i++) { const b = box(0.32 + r() * 0.25, 0.08 + r() * 0.08, 0.26 + r() * 0.2, mat(['#f2d07a', '#8ac0e8', '#f0a0b0', '#a8d89a', '#e8e4dc', '#c8b0e0', '#9aa0aa'][i % 7])); b.userData.o = [(r() - 0.5) * 1.1, (r() - 0.5) * 0.8, r() * Math.PI, i]; S.add(b); PILE.push(b); } }
function pile(k, x, z) { PILE.forEach((b, i) => { const [dx, dz, ry] = b.userData.o; const layer = Math.floor(i / 8); const fall = clamp(k * 1.4 - i / 40 * 0.4); b.visible = fall > 0; b.position.set(x + dx * (1 - layer * 0.15), 0.06 + layer * 0.14 + (1 - easeOut(fall)) * 2.2, z + dz * (1 - layer * 0.15)); b.rotation.set(0, ry, 0); }); }

// ---------- A：居間（原点） ----------
room({ x: 0, w: 9, d: 6, h: 3.0, wall: '#efe8da', floor: '#c8a880' });
const LOWT = box(1.2, 0.36, 0.7, mat('#9a7a58')); LOWT.position.set(0.9, 0.18, -0.6); S.add(LOWT);
const STA = stack('A', 5, 0.75, -0.6); STA.position.y = 0.36;
const STB = stack('B', 5, 1.1, -0.6); STB.position.y = 0.36;
const SOFA = new THREE.Group(); { const b = box(2.2, 0.45, 0.9, mat('#7a8a9a')); b.position.y = 0.22; SOFA.add(b); const bk = box(2.2, 0.6, 0.2, mat('#6a7a8a')); bk.position.set(0, 0.7, -0.4); SOFA.add(bk); } SOFA.position.set(-0.6, 0, -2.2); S.add(SOFA);
const sparkA = makeSparkles(80, 0.06, 0xffffff); S.add(sparkA.points); sparkA.init([[-0.5, 1.0, -0.4]], 0.6, 0.6);
const chigau = label('それ違う', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.8 }); S.add(chigau);
const dosa = label('ドサッ', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(dosa);
const zenbu = label('全部 妻の仕事に', { w: 900, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.15 }); S.add(zenbu);
const yarikata = label('やり方が 違う', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.0 }); S.add(yarikata);
const ORI = label('2通り', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.6 }); S.add(ORI);
const KUSE_A = label('妻のくせ', { w: 512, size: 100, color: '#fff', bg: 'rgba(200,120,200,.96)', sx: 0.6 }); S.add(KUSE_A);
const KUSE_B = label('夫のくせ', { w: 512, size: 100, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.6 }); S.add(KUSE_B);
const iwanai = label('何も言わない', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.95 }); S.add(iwanai);

// ---------- B：台所（x=60） ----------
const BX = 60;
room({ x: BX, w: 9, d: 6, h: 3.0, wall: '#f0ebe0', floor: '#c8b494' });
const KC = makeCounter({ w: 3.4 }); KC.position.set(BX - 0.4, 0, -2.5); S.add(KC);
const DISH = makeDishes(10); DISH.position.set(BX - 0.4 + KC.userData.sink.x, 0.97, -2.5); S.add(DISH);
const MAT = box(1.0, 0.04, 0.7, mat('#a8d8c8')); MAT.position.set(BX + 1.6, 0.02, -0.9); S.add(MAT);
const TRASH = [0, 1, 2].map(i => { const t = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat('#f4f4f2')); t.scale.y = 1.2; t.position.set(BX - 2.6 + i * 0.4, 0.26, -1.6); S.add(t); return t; });
const FR = makeFridge(); FR.position.set(BX + 3.2, 0, -2.4); FR.rotation.y = -0.3; S.add(FR);
const CHART = makeDoc({ title: '夫の家事表', rows: ['月', '火', '水', '木', '金'], head: '#3a6ab2', w: 0.62, h: 0.8 }); S.add(CHART);
const STAGE_L = ['食器 → 妻の仕事', 'おむつ → 妻の仕事', 'ゴミ出し → 妻の仕事'].map(s => { const l = label(s, { w: 1000, size: 92, color: '#fff', bg: 'rgba(214,30,40,.97)', sx: 1.2 }); S.add(l); return l; });
const dame = label('ダメ出し', { w: 640, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.75 }); S.add(dame);
const demo = label('困ったのは 妻だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(demo);
const masshiro = label('真っ白', { w: 512, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.6 }); S.add(masshiro);
const jibunkara = label('初めて 自分から', { w: 900, size: 96, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 1.1 }); S.add(jibunkara);

const LABELS = [chigau, dosa, zenbu, yarikata, ORI, KUSE_A, KUSE_B, iwanai, ...STAGE_L, dame, demo, masshiro, jibunkara];
const PEOPLE = [TSUMA, OTTO, OTTO2];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatT.userData.set(0); sweatO2.userData.set(0);
  PILE.forEach(b => b.visible = false); HTOWEL.visible = false; BABY.visible = false; CHART.visible = false; DISH.userData.setN(1); STB.visible = false; STA.visible = true;
  TRASH.forEach(t => t.visible = true);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function walk(p, t, sp = 7, a = 0.4) { const s = Math.sin(t * sp); p.userData.legs[0].rotation.x = s * a; p.userData.legs[1].rotation.x = -s * a; }
const TP = 0.35;
function living() { stand(TSUMA, -0.45, -0.4, 0.6); TSUMA.userData.arms[1].rotation.set(-1.3, 0, 0.1); HTOWEL.visible = true; stand(OTTO, 1.6, 0.0, -0.9); OTTO.userData.arms[0].rotation.set(-0.4, 0, 0.3); STB.visible = true; STA.visible = false; }
function livCam(u = 0) { look(lerp(0.5, 0.4, u), 1.9, lerp(4.6, 4.2, u), 0.4, 1.55, -0.6, 50); }
function shot0(t) { // 0秒＝サムネ：夫のたたんだタオルに それ違う と言った瞬間、家じゅうの洗濯物が妻の前にドサッと積み上がる
  reset(); lift(0); living(); say(chigau, 1, 0, 0.75, 1.45, -0.4, 0.62);
  const k = clamp((t - TP) / 0.5); if (k > 0) { pile(k, -0.4, 0.15); if (k > 0.7) { el.flash.style.opacity = k < 0.8 ? 0.18 : 0; say(dosa, t, TP + 0.35, -1.0, 1.35, 0.2, 0.5); } }
  if (t > TP + 0.5) say(zenbu, t, TP + 0.5, 0.35, 0.55, 0.4, 0.95);
  livCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 洗濯物の山にうもれた妻が、タオルを持ったまま固まる
  reset(); lift(150); living(); pile(1, -0.4, 0.15); sweatT.userData.set(1, t);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.2, u), 1.6, lerp(2.6, 2.2, u), -0.3, 1.2, -0.3, 50);
  return S;
}
function sFuman(t, d) { // 夫たちの不満から。やれと言われてやると、やり方が違うと言われる（回想：たたむ夫と見下ろす妻）
  reset(); lift(150); stand(OTTO, 0.95, -1.25, 0); OTTO.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); OTTO.rotation.x = 0.25; STB.visible = true; STA.visible = false;
  stand(TSUMA, -0.3, -1.1, 0.7); TSUMA.userData.arms[0].rotation.set(-0.2, 0, 0.5); TSUMA.userData.arms[1].rotation.set(-1.4, 0, -0.3);
  if (t > d * 0.6) say(yarikata, t, d * 0.6, -0.3, 2.15, -1.1, 0.85);
  look(0.5, 1.8, 3.0, 0.35, 1.1, -0.9, 50);
  return S;
}
function sStage(i, t, d) { // 月曜 食器・火曜 おむつ・水曜 ゴミ
  reset(); lift(150); const ph = t / d;
  if (ph < 0.45) { // ダメ出しの瞬間
    if (i === 0) { stand(OTTO, BX - 0.4 + KC.userData.sink.x, -1.7, Math.PI); OTTO.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0)); }
    if (i === 1) { stand(OTTO, BX + 1.6, -1.5, 0); OTTO.rotation.x = 0.4; BABY.visible = true; BABY.position.set(BX + 1.6, 0.1, -1.0); }
    if (i === 2) { stand(OTTO, BX - 2.2, -1.0, Math.PI); OTTO.rotation.x = 0.3; }
    const tx = [BX - 0.4 + KC.userData.sink.x + 1.0, BX + 0.6, BX - 1.2][i]; stand(TSUMA, tx, -0.9, -1.2 + (i === 2 ? 2.2 : 0)); TSUMA.userData.arms[1].rotation.set(-1.5, 0, -0.2);
    say(dame, t, 0.1, tx, 2.2, -0.9, 0.65);
  } else { // 妻の仕事に
    if (i === 0) { stand(TSUMA, BX - 0.4 + KC.userData.sink.x, -1.7, Math.PI); TSUMA.userData.arms.forEach(a => a.rotation.set(-1.1, 0, Math.sin(t * 8) * 0.1)); DISH.userData.setN(1 - (ph - 0.45)); }
    if (i === 1) { stand(TSUMA, BX + 1.6, -1.5, 0); TSUMA.rotation.x = 0.4; BABY.visible = true; BABY.position.set(BX + 1.6, 0.1, -1.0); }
    if (i === 2) { const k = clamp((ph - 0.45) / 0.55); stand(TSUMA, lerp(BX - 2.2, BX - 3.6, k), lerp(-1.0, -0.2, k), -Math.PI / 2); walk(TSUMA, t); TRASH.forEach((tr, j) => { tr.visible = j > 0; }); }
    stand(OTTO, BX + 0.4, 0.4, Math.PI - 0.3); OTTO.userData.arms.forEach(a => a.rotation.set(0, 0, 0));
    say(STAGE_L[i], t, d * 0.45, BX + (i === 1 ? 1.2 : i === 2 ? -1.6 : -0.6), 2.1, -1.0, 1.0);
  }
  setHud('ダメ出しが返る', ['月曜', '火曜', '水曜'][i], 1);
  look(BX + [-0.4, 1.2, -1.6][i] + 0.6, 2.1, 2.8, BX + [-0.6, 1.2, -1.7][i], 1.05, -1.2, 50);
  return S;
}
function chart() { CHART.visible = true; FR.updateMatrixWorld(); const v = new THREE.Vector3(-0.1, 1.4, 0.56); FR.localToWorld(v); CHART.position.copy(v); CHART.rotation.y = FR.rotation.y; }
function sDemo(t, d) { // でも、困ったのは、妻だけじゃなかった
  reset(); lift(150); chart(); stand(OTTO2, BX + 1.9, -1.2, 0.2); OTTO2.userData.arms[1].rotation.set(-0.2, 0, 0.2); OTTO2.userData.head.rotation.y = 0.5;
  if (t > d * 0.35) say(demo, t, d * 0.35, BX + 2.3, 2.35, -1.4, 1.2);
  look(BX + 1.2, 1.9, 3.4, BX + 2.4, 1.35, -1.8, 50);
  return S;
}
function sChart(t, d) { // 最初から何もしない夫の家事表は、真っ白なまま冷蔵庫に貼り出される
  reset(); lift(150); chart(); stand(OTTO2, BX + 1.9, -1.3, 0.7); OTTO2.userData.head.rotation.x = -0.1; if (t > d * 0.6) sweatO2.userData.set(1, t);
  if (t > d * 0.5) say(masshiro, t, d * 0.5, BX + 2.5, 2.0, -1.6, 0.5);
  const u = ease(clamp(t / d)); look(BX + lerp(1.7, 1.9, u), 1.7, lerp(1.8, 1.3, u), BX + 2.6, 1.3, -1.8, 50);
  return S;
}
function sMokuyo(t, d) { // 木曜。妻は、ゆがんだタオルを見て、何も言わずに通り過ぎる
  reset(); lift(150); STB.visible = true; STA.visible = false; const k = clamp(t / d); stand(TSUMA, lerp(-1.2, 2.4, k), 0.1, Math.PI / 2); walk(TSUMA, t); TSUMA.userData.head.rotation.y = -0.4;
  if (t > d * 0.4) say(iwanai, t, d * 0.4, 0.9, 2.15, -0.4, 0.85);
  setHud('ダメ出しが返る', '木曜', 1);
  look(0.9, 1.9, 3.4, 0.8, 1.0, -0.6, 50);
  return S;
}
function sJibun(t, d) { // 夫は、白い家事表を見て、初めて自分から皿を洗う
  reset(); lift(150); chart(); stand(OTTO2, BX - 0.4 + KC.userData.sink.x, -1.7, Math.PI); OTTO2.userData.arms.forEach(a => a.rotation.set(-1.1, 0, Math.sin(t * 8) * 0.1)); DISH.userData.setN(1 - 0.5 * clamp(t / d));
  if (t > d * 0.4) say(jibunkara, t, d * 0.4, BX - 0.6, 2.05, -1.6, 0.95);
  look(BX + 0.9, 2.0, 1.4, BX - 0.6, 1.15, -2.0, 50);
  return S;
}
function sNitori(t, d) { // 1か月後。家のタオルのたたみ方は、2通りになる
  reset(); lift(150); STB.visible = true; STA.visible = true; STA.position.x = 0.65; STB.position.x = 1.15;
  if (t > d * 0.4) say(ORI, t, d * 0.4, 0.9, 0.95, -0.6, 0.35);
  setHud('ダメ出しが返る', '1か月後', 1);
  look(0.9, 1.35, 1.6, 0.9, 0.65, -0.6, 50);
  return S;
}
function sKekka(t, d) { // 結果：ダメ出しが自分に返ってきて、減ったのは妻の小言と、夫の 手を出さない言い訳だった
  reset(); lift(150); STB.visible = true; STA.visible = true; STA.position.x = 0.65; STB.position.x = 1.15;
  stand(TSUMA, -0.6, -2.05, 0); poseSit(TSUMA); TSUMA.position.y += 0.08; stand(OTTO, -0.0, -2.05, 0); poseSit(OTTO); OTTO.position.y += 0.08; OTTO.userData.head.rotation.y = -0.3; TSUMA.userData.head.rotation.y = 0.3;
  setTop('結果', '小言と 言い訳が 減った', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.4, u), 1.7, lerp(2.4, 3.0, u), -0.1, 1.0, -1.6, 50);
  return S;
}
function sKuse(t, d) { // 家事のやり方は、正解じゃなく、二人ぶんの、くせだったのかもしれない
  reset(); lift(150); STB.visible = true; STA.visible = true; STA.position.x = 0.6; STB.position.x = 1.2;
  if (t > d * 0.35) { say(KUSE_A, t, d * 0.35, 0.6, 0.8, -0.55, 0.3); say(KUSE_B, t, d * 0.5, 1.2, 0.8, -0.55, 0.3); }
  look(0.9, 1.35, 1.6, 0.9, 0.65, -0.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); living(); pile(1, -0.4, 0.15); livCam(0); return S; }

const NARR = { '洗濯物': 'せんたくもの', '山': 'やま', '妻': 'つま', '持った': 'もった', '固まる': 'かたまる', '夫たち': 'おっとたち', '不満': 'ふまん', '言われて': 'いわれて', 'やり方': 'やりかた', '違う': 'ちがう', '言われる': 'いわれる', '月曜': 'げつよう', '食器': 'しょっき', '置き方': 'おきかた', '皿洗い': 'さらあらい', '仕事': 'しごと', '火曜': 'かよう', '向き': 'むき', 'おむつ替え': 'おむつがえ', '水曜': 'すいよう', '縛り方': 'しばりかた', 'ゴミ出し': 'ゴミだし', '困った': 'こまった', '最初': 'さいしょ', '何も': 'なにも', '夫': 'おっと', '家事表': 'かじひょう', '真っ白': 'まっしろ', '冷蔵庫': 'れいぞうこ', '貼り出される': 'はりだされる', '木曜': 'もくよう', '見て': 'みて', '言わずに': 'いわずに', '通り過ぎる': 'とおりすぎる', '白い': 'しろい', '初めて': 'はじめて', '自分から': 'じぶんから', '皿': 'さら', '洗う': 'あらう', '1か月後': 'いっかげつご', '家': 'いえ', 'たたみ方': 'たたみかた', '2通り': 'ふたとおり', '結果：': '結果、', '自分': 'じぶん', '返って': 'かえって', '減った': 'へった', '小言': 'こごと', '手を出さない': 'てをださない', '言い訳': 'いいわけ', '家事': 'かじ', '正解': 'せいかい', '二人ぶん': 'ふたりぶん', '相手': 'あいて', '任せられる': 'まかせられる' };
const P = planTimes([
  ['洗濯物の山にうもれた妻が、', (t, d) => sKatamaru(t, 2 * d)],
  ['タオルを持ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['夫たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['やれと言われてやると、<br>やり方が違うと言われる。', (t, d) => sFuman(t + d, 2 * d)],
  ['月曜。食器の置き方にダメ出し。<br>皿洗いが、妻の仕事に。', (t, d) => sStage(0, t, d)],
  ['火曜。おむつの向きにダメ出し。<br>おむつ替えが、妻の仕事に。', (t, d) => sStage(1, t, d)],
  ['水曜。ゴミの縛り方にダメ出し。<br>ゴミ出しが、妻の仕事に。', (t, d) => sStage(2, t, d)],
  ['でも、困ったのは、<br>妻だけじゃなかった。', sDemo],
  ['最初から何もしない<br>夫の家事表は、', (t, d) => sChart(t, 2 * d)],
  ['真っ白なまま<br>冷蔵庫に貼り出される。', (t, d) => sChart(t + d, 2 * d)],
  ['木曜。妻は、ゆがんだタオルを<br>見て、何も言わずに通り過ぎる。', sMokuyo],
  ['夫は、白い家事表を見て、<br>初めて自分から皿を洗う。', sJibun],
  ['1か月後。家のタオルの<br>たたみ方は、2通りになる。', sNitori],
  ['結果：ダメ出しが<br>自分に返ってきて、', (t, d) => sKekka(t, 3 * d)],
  ['減ったのは妻の小言と、', (t, d) => sKekka(t + d, 3 * d)],
  ['夫の 手を出さない<br>言い訳だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['家事のやり方は、<br>正解じゃなく、', (t, d) => sKuse(t, 2 * d)],
  ['二人ぶんの、くせだったのかも<br>しれない。', (t, d) => sKuse(t + d, 2 * d)],
  ['家事のやり方、<br>相手に任せられる？', sAsk],
], { shot0, endCard, start: 3.3, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0719',
    v2: true,
    tt: 'main',
    hookLine: '夫のたたんだタオルに それ違う と言った瞬間、家じゅうの洗濯物が妻の前にドサッと積み上がる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも家事のダメ出しが、言った人の仕事になったら？',
    titleHtml: 'もしも家事の<br>ダメ出しが、<br>言った人の仕事に<br>なったら？',
    mood: 'tension', seed: 719, hits: [TP + 0.35, P.at(13), P.at(16)], risers: [P.at(7)], impacts: [P.at(9, 0.4), P.at(15, 0.3)],
    sfx: [[TP + 0.3, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(4, 1.2), 'whoosh'], [P.at(5, 1.2), 'whoosh'], [P.at(6, 1.2), 'whoosh'], [P.at(9, 0.6), 'alarm'], [P.at(12, 0.6), 'bubble']],
    narr: NARR,
    ask: '家事のやり方、相手に任せられる？',
    caption: 'もしも家事のダメ出しが、言った人の仕事になったら？\n\n洗濯物の山にうもれた妻が、タオルを持ったまま固まる。\n夫たちの不満から。やれと言われてやると、やり方が違うと言われる。\n月曜。食器の置き方にダメ出し。皿洗いが、妻の仕事に。\n火曜。おむつの向きにダメ出し。おむつ替えが、妻の仕事に。\n水曜。ゴミの縛り方にダメ出し。ゴミ出しが、妻の仕事に。\nでも、困ったのは、妻だけじゃなかった。\n最初から何もしない夫の家事表は、真っ白なまま冷蔵庫に貼り出される。\n木曜。妻は、ゆがんだタオルを見て、何も言わずに通り過ぎる。\n夫は、白い家事表を見て、初めて自分から皿を洗う。\n1か月後。家のタオルのたたみ方は、2通りになる。\n\n結果：ダメ出しが自分に返ってきて、減ったのは妻の小言と、夫の 手を出さない言い訳だった。\n家事のやり方は、正解じゃなく、二人ぶんの、くせだったのかもしれない。\n\n家事のやり方、相手に任せられる？ コメントで教えて。\n\n※風刺ネタです。ダメ出しが言った人の仕事になるのは、もしもの設定です。登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '家事', '夫婦', '男と女のもしも'],
    endStats: [['返ってきたもの', 'ダメ出しした家事', 'もしもの設定'], ['減ったもの', '妻の小言と 夫の言い訳', 'もしもの結果'], ['家事のやり方の正体', '二人ぶんのくせ', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
