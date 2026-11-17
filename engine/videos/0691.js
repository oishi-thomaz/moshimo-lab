import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeBed } from '../scenes/home.js';

// もしもアイドルのチェキ会が全部消えたら？（皮肉回・台本 S92・図星／沼が消えたら）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/15 の解析の種（0666 推しが全員引退 の沼を おぢが困る 側に）
// 数字（一次資料で確認・2026/11/17。commercepick 掲載の株式会社A3 発表 推し活市場規模は約3.9兆円）：
//  推しにお金を使っている人の月額平均支出 16,356円（調査 2025年4月15〜17日・全国15〜69歳・ネオマーケティングのネット調査。選択肢の中央値で集計）
//  チェキ1枚の値段・市場規模は確かめていないので使わない（数十秒 は筋の中の描写）
// 実在のアイドル・グループ・グッズ・会場の見た目は出さない。アイドルの子は服装も含めて性的に見せない（練習着）
// 行き先は現実の規模（家でスマホを見るだけ。人があふれる絵は描かない）

const GOLD = '#ffd27a', PINK = '#ff9ac8', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#d6cfe0', ground: '#8a8494' }); hemi.intensity = 1.3;
const OJI = makeOji(rng(7), { shirt: '#7a8a6a', bald: true }); S.add(OJI);
const sweat = makeSweat(); OJI.userData.head.add(sweat);
const IDOL = makeWoman({ shirt: '#f2a0c0', pants: '#3a3f5e', hair: '#3a2620' }); S.add(IDOL);

// チェキ（白いふち＋写真。blank で白紙）
function chekiTex(blank) { const c = document.createElement('canvas'); c.width = 216; c.height = 270; const g = c.getContext('2d'); g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 216, 270); if (blank) { g.fillStyle = '#e9e9e4'; g.fillRect(14, 14, 188, 190); } else { const gr = g.createLinearGradient(0, 14, 0, 204); gr.addColorStop(0, '#ffb8d8'); gr.addColorStop(1, '#ffd8a8'); g.fillStyle = gr; g.fillRect(14, 14, 188, 190); g.fillStyle = '#3a2620'; g.beginPath(); g.arc(80, 95, 30, 0, 7); g.fill(); g.beginPath(); g.arc(140, 100, 28, 0, 7); g.fill(); g.fillStyle = '#f5d3b5'; g.beginPath(); g.arc(80, 100, 22, 0, 7); g.fill(); g.beginPath(); g.arc(140, 104, 20, 0, 7); g.fill(); g.fillStyle = '#f29bbb'; g.fillRect(55, 128, 50, 76); g.fillStyle = '#7a8a6a'; g.fillRect(118, 128, 46, 76); g.fillStyle = '#e8243a'; g.font = '900 34px sans-serif'; g.fillText('♡', 98, 60); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const TEX_ON = chekiTex(false), TEX_OFF = chekiTex(true);
const CHEKI = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 0.54), new THREE.MeshBasicMaterial({ map: TEX_ON, side: THREE.DoubleSide })); S.add(m); CHEKI.push(m); }
function chekis(x, y, z, k, spread = 1, blankK = 0) { CHEKI.forEach((m, i) => { m.visible = true; const a = (i - 3.5) * 0.17 * spread; m.position.set(x + Math.sin(a) * 0.9 * spread, y + Math.cos(a) * 0.15 * spread - 0.1, z + i * 0.004); m.rotation.set(0, 0, -a); m.material.map = (i / 8 < blankK) ? TEX_OFF : TEX_ON; }); }
const WALLET = new THREE.Group(); { const w = box(1.2, 0.7, 0.12, mat('#5a3a2a')); WALLET.add(w); const f = box(1.2, 0.35, 0.13, mat('#6a4a34')); f.position.y = -0.17; WALLET.add(f); } S.add(WALLET);
const shiro = label('白紙', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(shiro);
const sparkA = makeSparkles(110, 0.08, 0xffffff); S.add(sparkA.points); sparkA.init([[0, 1.6, -0.5]], 0.9, 0.5);

// ---------- B：イベントの会場（x=50） ----------
const BX = 50;
const roomB = room({ x: BX, w: 12, d: 8, h: 4, wall: '#3a3448', floor: '#5a5466' });
const BUPPAN = makeTable({ w: 2.6, d: 0.8, h: 0.75, color: '#ece8f0' }); BUPPAN.position.set(BX, 0, -1.8); S.add(BUPPAN);
const CLOTH = box(2.62, 0.5, 0.02, mat('#d84a8a')); CLOTH.position.set(BX, 0.48, -1.39); S.add(CLOTH);
const SIGN = label('物販', { w: 512, size: 120, color: '#fff', bg: 'rgba(216,74,138,.98)', sx: 0.75 }); SIGN.position.set(BX, 2.6, -3.7); S.add(SIGN);
const STAND = new THREE.Group(); { const pole = box(0.06, 1.6, 0.06, mat('#b8bec6')); pole.position.y = 0.8; STAND.add(pole); const b = box(0.7, 0.5, 0.04, mat('#ffffff')); b.position.y = 1.5; STAND.add(b); } STAND.position.set(BX + 1.8, 0, -1.6); S.add(STAND);
const ninchi = label('俺、認知されてるから', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(ninchi);
const CLOCKB = label('金曜 19:00', { w: 768, size: 120, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.9 }); S.add(CLOCKB);
const nai = label('列が ない', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(nai);
const ROPE = []; for (let i = 0; i < 5; i++) { const p = box(0.06, 0.9, 0.06, mat('#c8a23a')); p.position.set(BX - 2.2 + i * 1.1, 0.45, 0.4); S.add(p); ROPE.push(p); } const ROPEL = box(4.4, 0.04, 0.04, mat('#c82a3a')); ROPEL.position.set(BX, 0.85, 0.4); S.add(ROPEL);

// ---------- C：おぢの部屋（x=100） ----------
const CX = 100;
const roomC = room({ x: CX, w: 8, d: 6, h: 3, wall: '#e6e0d4', floor: '#b49a78' });
const BED = makeBed({ blanket: '#7a8aa8' }); BED.position.set(CX - 1.4, 0, -1.8); S.add(BED);
const LOWT = makeTable({ w: 1.0, d: 0.6, h: 0.4, color: '#a07a50' }); LOWT.position.set(CX + 0.6, 0, -1.2); S.add(LOWT);
const PH = makePhone({ w: 0.12, h: 0.24, cw: 120, ch: 240 }); const PHONE = PH.g; S.add(PHONE); PH.draw('on', (g, w, h) => { g.fillStyle = '#9ad0ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) g.fillRect(10, 20 + i * 44, w - 20, 30); });
const nokoru = label('お金が 残ってる', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(nokoru);
const BILLS = []; for (let i = 0; i < 5; i++) { const b = box(0.36, 0.18, 0.01, mat(['#e8d8a8', '#c8b07a'][i % 2])); S.add(b); BILLS.push(b); }
const hanasu = label('話す相手が いない', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(hanasu);
const CAL = label('日曜', { w: 384, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.5 }); S.add(CAL);

// ---------- D：お金と数十秒（x=150） ----------
const DX = 150;
flat(30, 20, '#5a5470', DX, -2);
const BACKD = box(14, 6, 0.2, mat('#4a4460')); BACKD.position.set(DX, 3, -4); S.add(BACKD);
const STACKD = []; for (let i = 0; i < 16; i++) { const b = box(0.7, 0.04, 0.34, mat(i % 2 ? '#8ac08a' : '#a8d0a0')); S.add(b); STACKD.push(b); }
const TIMER = label('0:30', { w: 512, size: 140, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.8 }); S.add(TIMER);
const suujuubyou = label('推しと 話せる 数十秒', { w: 1024, size: 96, color: '#fff', bg: 'rgba(216,74,138,.98)', sx: 1.5 }); S.add(suujuubyou);
const shashin = label('写真のためじゃ なかった', { w: 1100, size: 92, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.5 }); S.add(shashin);

// ---------- E：練習室（x=200） ----------
const EX = 200;
const roomE = room({ x: EX, w: 8, d: 6, h: 3.2, wall: '#e8eef4', floor: '#c8a87a' });
const MIRROR = box(5, 2, 0.04, new THREE.MeshBasicMaterial({ color: '#cfe4ee' })); MIRROR.position.set(EX, 1.4, -2.9); S.add(MIRROR);
const MIC = new THREE.Group(); { const st = box(0.03, 1.4, 0.03, mat('#2a2e38')); st.position.y = 0.7; MIC.add(st); const h = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#3a3e48')); h.position.y = 1.45; MIC.add(h); } S.add(MIC);
const NOTES = []; for (let i = 0; i < 4; i++) { const n = label('♪', { w: 192, size: 130, color: '#ff6aa8', sx: 0.25 }); S.add(n); NOTES.push(n); }
const renshu = label('歌の 練習', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.7 }); S.add(renshu);
const kao = label('毎週来る 顔', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(kao);
const NAMECARD = label('名前', { w: 384, size: 110, color: '#888', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(NAMECARD);
const seiriken = label('話す時間の 整理券', { w: 900, size: 100, color: '#fff', bg: 'rgba(216,74,138,.98)', sx: 1.3 }); S.add(seiriken);
const TICKETS = []; for (let i = 0; i < 6; i++) { const t = label('No.' + (101 + i), { w: 384, h: 192, size: 90, color: '#2a1a00', bg: 'rgba(255,236,170,.98)', sx: 0.42 }); S.add(t); TICKETS.push(t); }

const LABELS = [shiro, ninchi, CLOCKB, nai, nokoru, hanasu, CAL, TIMER, suujuubyou, shashin, renshu, kao, NAMECARD, seiriken, ...NOTES, ...TICKETS];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, 0); p.visible = false; }
function reset() {
  clearP(OJI); clearP(IDOL); LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweat.userData.set(0);
  CHEKI.forEach(m => { m.visible = false; m.scale.setScalar(1); }); WALLET.visible = false; WALLET.scale.setScalar(1); WALLET.rotation.set(0, 0, 0); PHONE.visible = false; BILLS.forEach(b => b.visible = false); STACKD.forEach(b => b.visible = false); MIC.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function chekiCam(u = 0) { look(lerp(0.1, 0.0, u), lerp(1.5, 1.45, u), lerp(2.6, 2.35, u), 0, 1.45, -0.5, 50); }
function shot0(t) { // 0秒＝サムネ：おぢの財布から出したチェキの束が、一斉に白紙になる
  reset(); lift(0); WALLET.visible = true; WALLET.position.set(0, 0.85, -0.45);
  const k = clamp((t - TP) / 0.35); chekis(0, 1.45, -0.5, 1, 1, k);
  if (t > TP) { sparkA.set(clamp((t - TP) / 0.8)); el.flash.style.opacity = t < TP + 0.1 ? 0.25 : 0; }
  if (t > TP + 0.3) say(shiro, t, TP + 0.3, 0, 0.95, -0.1, 0.42);
  chekiCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function ojiAt(x, z, ry = 0) { OJI.visible = true; OJI.position.set(x, 0, z); OJI.rotation.y = ry; }
function holdCheki(blank = true) { OJI.userData.arms[1].rotation.set(-1.5, 0, 0.2); OJI.updateMatrixWorld(); const v = new THREE.Vector3(0, -0.62, 0.12); OJI.userData.arms[1].localToWorld(v); const m = CHEKI[0]; m.visible = true; m.position.copy(v); m.position.y += 0.15; m.rotation.set(0, OJI.rotation.y, 0); m.scale.setScalar(0.6); m.material.map = blank ? TEX_OFF : TEX_ON; }
function sKatamaru(t, d) { // 白紙のチェキを握ったおぢが、物販の机の前で固まる
  reset(); lift(120); ojiAt(BX - 0.2, -0.6, 0.25); holdCheki(true); sweat.userData.set(clamp((t - d * 0.4) / 0.3), t);
  look(BX + 0.7, 1.75, 2.0, BX - 0.1, 1.3, -1.0, 50);
  return S;
}
function sIibun(t, d) { // おぢの言い分から。俺、あの子に認知されてるから
  reset(); lift(120); ojiAt(BX - 0.2, -0.6, 0.15); OJI.userData.arms[0].rotation.set(-1.9, 0, -0.3); OJI.userData.head.rotation.x = -0.15;
  if (t > 0.4) say(ninchi, t, 0.4, BX - 0.2, 2.2, -0.6, 1.15);
  look(BX + 0.2, 1.7, 2.4, BX - 0.2, 1.5, -0.6, 50);
  return S;
}
function sKinyo(t, d) { // 給料日の金曜。いつもの物販の列が、どこにもない
  reset(); lift(120); const k = clamp(t / (d * 0.6)); ojiAt(BX + lerp(-0.9, -0.3, k), 0.0, Math.PI / 2 - 0.3); if (k < 1) poseWalk(OJI, t * 7.5, 0.9); else OJI.userData.head.rotation.y = -0.6;
  say(CLOCKB, t, 0.2, BX + 0.7, 2.3, -1.2, 0.55);
  if (t > d * 0.55) say(nai, t, d * 0.55, BX - 0.2, 1.75, 0.4, 0.55);
  setHud('チェキ会 消滅', '金曜', 1);
  look(BX - 0.1, 2.2, 4.8, BX - 0.1, 1.0, -0.8, 50);
  return S;
}
function roomCam(u = 0) { look(CX + lerp(0.6, 0.4, u), 1.7, lerp(2.4, 2.1, u), CX + 0.1, 1.0, -1.3, 50); }
function sDoyo(t, d) { // 土曜。財布に、なぜかお金が残っている
  reset(); lift(120); ojiAt(CX + 0.1, -1.5, 0); OJI.userData.arms.forEach((a, i) => a.rotation.set(-1.3, 0, i ? 0.3 : -0.3));
  WALLET.visible = true; WALLET.position.set(CX + 0.1, 1.18, -0.82); WALLET.scale.setScalar(0.45); WALLET.rotation.x = -0.2;
  const k = easeOut(clamp((t - d * 0.3) / 0.6)); BILLS.forEach((b, i) => { b.visible = k > 0; b.position.set(CX + 0.1 + (i - 2) * 0.07, 1.12 + k * 0.12 + i * 0.015, -0.6); b.rotation.z = (i - 2) * 0.15 * k; });
  if (t > d * 0.45) say(nokoru, t, d * 0.45, CX + 0.1, 2.15, -1.5, 0.95);
  setHud('チェキ会 消滅', '土曜', 1);
  look(CX + 0.6, 1.8, 1.6, CX + 0.1, 1.35, -1.2, 50);
  return S;
}
function sNichiyo(t, d) { // 日曜。話す相手がいなくて、一日スマホを眺める
  reset(); lift(120); ojiAt(CX - 1.4, -1.6, 0); OJI.rotation.x = 0; OJI.position.y = 0.25; OJI.userData.legs.forEach(l => l.rotation.x = -1.4); OJI.userData.arms[1].rotation.set(-1.5, 0, 0.2); OJI.userData.head.rotation.x = 0.35;
  OJI.updateMatrixWorld(); const v = new THREE.Vector3(0, -0.6, 0.12); OJI.userData.arms[1].localToWorld(v); PHONE.visible = true; PHONE.position.copy(v); PHONE.position.y += 0.1; PHONE.rotation.x = -0.6;
  say(CAL, t, 0.2, CX - 1.9, 2.3, -2.8, 0.42);
  if (t > d * 0.45) say(hanasu, t, d * 0.45, CX - 1.2, 2.25, -1.6, 0.95);
  setHud('チェキ会 消滅', '日曜', 1);
  look(CX - 0.3, 2.0, 2.4, CX - 1.3, 1.1, -1.7, 50);
  return S;
}
function studioD() { }
function dCam(u = 0) { look(DX + lerp(0.3, 0.0, u), 1.6, lerp(4.6, 4.2, u), DX, 0.9, 0, 50); }
function sShashin(t, d) { // でも、通っていたのは、写真のためじゃなかった
  reset(); lift(380); chekis(DX, 0.9, 0, 1, 0.9, 0);
  if (t > d * 0.4) say(shashin, t, d * 0.4, DX, 1.75, 0.3, 1.3);
  dCam(ease(clamp(t / d)));
  return S;
}
function sOkane(t, d) { // 推しに使うお金は、使う人の平均で月16,356円
  reset(); lift(380); const n = Math.round(lerp(0, 16, easeOut(clamp((t - 0.3) / 1.4)))); STACKD.forEach((b, i) => { b.visible = i < n; b.position.set(DX, 0.02 + i * 0.045, 0); b.rotation.y = (i % 3) * 0.05; });
  setTop('推しに使うお金（使う人の平均・2025年）', '月' + Math.round(16356 * n / 16).toLocaleString('ja-JP') + '円', fade(t, 0.3, d, 0.25), PINK); setHud('株式会社A3', '推し活の調査', 1);
  dCam(1);
  return S;
}
function sSuujuu(t, d) { // おぢが買っていたのは、推しと話せる数十秒
  reset(); lift(380); const s = Math.max(0, 30 - Math.floor(t * 8)); TIMER.visible = true; TIMER.userData.set('0:' + String(s).padStart(2, '0')); TIMER.position.set(DX, 0.75, 0); TIMER.userData.size(0.8);
  if (t > d * 0.45) say(suujuubyou, t, d * 0.45, DX, 1.55, 0.3, 1.3);
  dCam(1);
  return S;
}
function eCam(u = 0) { look(EX + lerp(0.8, 0.5, u), 1.65, lerp(2.6, 2.3, u), EX, 1.25, -1.0, 50); }
function sRenshu(t, d) { // 一方、アイドルの子は、空いた時間で歌の練習をする
  reset(); lift(120); IDOL.visible = true; IDOL.position.set(EX - 0.1, 0, -1.2); IDOL.rotation.y = 0.15; IDOL.userData.arms[1].rotation.set(-1.4, 0, 0.3); IDOL.userData.arms[0].rotation.set(-0.3 + Math.sin(t * 3) * 0.2, 0, -0.3);
  MIC.visible = true; MIC.position.set(EX + 0.05, 0, -0.75);
  NOTES.forEach((n, i) => { const u = ((t * 0.5 + i * 0.25) % 1); n.visible = true; n.position.set(EX + 0.3 + i * 0.15, 1.7 + u * 0.8, -1.0); n.userData.size(0.22 * (1 - u * 0.5)); });
  if (t > d * 0.45) say(renshu, t, d * 0.45, EX - 0.55, 2.15, -1.2, 0.55);
  eCam(ease(clamp(t / d)));
  return S;
}
function sKao(t, d) { // おぢは気づく。覚えられていたのは、名前じゃなく、毎週来る顔だった
  reset(); lift(120); ojiAt(CX - 0.1, -0.9, 0.2); OJI.userData.head.rotation.x = 0.2; sweat.userData.set(1, t);
  say(NAMECARD, t, 0.2, CX - 0.6, 2.2, -0.9, 0.4); if (t > d * 0.35) { NAMECARD.userData.set('名前 ×'); }
  if (t > d * 0.5) say(kao, t, d * 0.5, CX + 0.3, 2.3, -0.8, 0.75);
  look(CX + 0.3, 1.8, 2.5, CX - 0.1, 1.5, -0.9, 50);
  return S;
}
function sKekka(t, d) { // 結果：チェキ会が消えて、おぢの手元に残ったのは、お金と、話す相手のいない日曜だった
  reset(); lift(120); ojiAt(CX + 0.1, -0.6, 0.35); OJI.userData.arms.forEach((a, i) => a.rotation.set(-1.2, 0, i ? 0.25 : -0.25)); OJI.userData.head.rotation.x = 0.25;
  WALLET.visible = true; WALLET.scale.setScalar(0.5); WALLET.rotation.set(-0.3, 0.35, 0); OJI.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.95, 0.5); OJI.localToWorld(v); WALLET.position.copy(v);
  setTop('結果', 'お金と、ひとりの日曜', fade(t, 0.3, d, 0.25), GOLD);
  CAL.visible = true; CAL.position.set(CX + 0.6, 2.3, -2.8); CAL.userData.size(0.42);
  const u = ease(clamp(t / d)); look(CX + lerp(0.4, 0.7, u), lerp(1.8, 2.0, u), lerp(2.8, 3.6, u), CX + 0.1, 1.3, -0.9, 50);
  return S;
}
function sSeiri(t, d) { // チェキは写真じゃなく、推しと話す時間の、1枚ずつの整理券だったのかもしれない
  reset(); lift(380); const k = clamp((t - d * 0.3) / 0.6);
  if (k < 0.5) chekis(DX, 0.9, 0, 1, 0.9 * (1 - k), 0);
  TICKETS.forEach((tk, i) => { if (k > 0.4) { tk.visible = true; tk.position.set(DX - 0.62 + (i % 3) * 0.62, 1.05 - Math.floor(i / 3) * 0.32, i * 0.01); tk.userData.size(0.55 * clamp((k - 0.4) / 0.4)); } });
  if (k > 0.4) sparkA.set(0);
  if (t > d * 0.5) say(seiriken, t, d * 0.5, DX, 1.55, 0.3, 1.2);
  dCam(ease(clamp(t / d)));
  return S;
}
function sAsk(t) { reset(); lift(0); WALLET.visible = true; WALLET.scale.setScalar(1); WALLET.rotation.set(0, 0, 0); WALLET.position.set(0, 0.85, -0.45); chekis(0, 1.45, -0.5, 1, 1, 1); chekiCam(0); return S; }

const NARR = { '白紙': 'はくし', '握った': 'にぎった', '物販': 'ぶっぱん', '机': 'つくえ', '固まる': 'かたまる', '言い分': 'いいぶん', '俺': 'おれ', '認知': 'にんち', '給料日': 'きゅうりょうび', '金曜': 'きんよう', '列': 'れつ', '土曜': 'どよう', '財布': 'さいふ', '残って': 'のこって', '日曜': 'にちよう', '相手': 'あいて', '一日': 'いちにち', '眺める': 'ながめる', '通って': 'かよって', '写真': 'しゃしん', '推し': 'おし', '使う人': 'つかうひと', '平均': 'へいきん', '月16,356円': 'つきいちまんろくせんさんびゃくごじゅうろくえん', '数十秒': 'すうじゅうびょう', '一方': 'いっぽう', '空いた': 'あいた', '歌': 'うた', '練習': 'れんしゅう', '気づく': 'きづく', '覚えられて': 'おぼえられて', '名前': 'なまえ', '毎週来る': 'まいしゅうくる', '顔': 'かお', '結果：': '結果、', '手元': 'てもと', '時間': 'じかん', '1枚': 'いちまい', '整理券': 'せいりけん', '払える': 'はらえる' };
const P = planTimes([
  ['白紙のチェキを握ったおぢが、<br>物販の机の前で固まる。', sKatamaru],
  ['おぢの言い分から。<br>俺、あの子に認知されてるから。', sIibun],
  ['給料日の金曜。いつもの<br>物販の列が、どこにもない。', sKinyo],
  ['土曜。財布に、なぜか<br>お金が残っている。', sDoyo],
  ['日曜。話す相手がいなくて、<br>一日スマホを眺める。', sNichiyo],
  ['でも、通っていたのは、<br>写真のためじゃなかった。', sShashin],
  ['推しに使うお金は、使う人の<br>平均で月16,356円。', sOkane],
  ['おぢが買っていたのは、<br>推しと話せる数十秒。', sSuujuu],
  ['一方、アイドルの子は、<br>空いた時間で歌の練習をする。', sRenshu],
  ['おぢは気づく。覚えられて<br>いたのは、名前じゃなく、', (t, d) => sKao(t, 2 * d)],
  ['毎週来る顔だった。', (t, d) => sKao(t + d, 2 * d)],
  ['結果：チェキ会が消えて、<br>おぢの手元に残ったのは、', (t, d) => sKekka(t, 2 * d)],
  ['お金と、話す相手の<br>いない日曜だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['チェキは写真じゃなく、<br>推しと話す時間の、', (t, d) => sSeiri(t, 2 * d)],
  ['1枚ずつの整理券<br>だったのかもしれない。', (t, d) => sSeiri(t + d, 2 * d)],
  ['チェキ1枚、<br>いくらまでなら払える？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0691',
    v2: true,
    tt: 'main',
    hookLine: 'おぢの財布から出したチェキの束が、一斉に白紙になる。',
    series: '沼が消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもアイドルのチェキ会が全部消えたら？',
    titleHtml: 'もしもアイドルの<br>チェキ会が<br>全部消えたら？',
    mood: 'tension', seed: 691, hits: [TP, P.at(11), P.at(14)], risers: [P.at(5)], impacts: [P.at(6, 1.6), P.at(10, 0.2)],
    sfx: [[TP, 'poof'], [P.at(2, 1.0), 'meter', 0.3], [P.at(3, 0.8), 'bubble'], [P.at(7, 0.3), 'alarm'], [P.at(14, 0.6), 'poof']],
    narr: NARR,
    ask: 'チェキ1枚、いくらまでなら払える？',
    caption: 'もしもアイドルのチェキ会が全部消えたら？\n\n白紙のチェキを握ったおぢが、物販の机の前で固まる。\nおぢの言い分から。俺、あの子に認知されてるから。\n給料日の金曜。いつもの物販の列が、どこにもない。\n土曜。財布に、なぜかお金が残っている。\n日曜。話す相手がいなくて、一日スマホを眺める。\nでも、通っていたのは、写真のためじゃなかった。\n推しに使うお金は、使う人の平均で月16,356円。\nおぢが買っていたのは、推しと話せる数十秒。\n一方、アイドルの子は、空いた時間で歌の練習をする。\nおぢは気づく。覚えられていたのは、名前じゃなく、毎週来る顔だった。\n\n結果：チェキ会が消えて、おぢの手元に残ったのは、お金と、話す相手のいない日曜だった。\nチェキは写真じゃなく、推しと話す時間の、1枚ずつの整理券だったのかもしれない。\n\nチェキ1枚、いくらまでなら払える？ コメントで教えて。\n\n※風刺ネタです。チェキ会が全部消えるのは、もしもの設定です。登場する人物・会場は架空です\n出典：株式会社A3 推し活の全国調査（2025年4月・ネオマーケティングのネット調査。推しにお金を使っている人の月額平均 16,356円）',
    hashtags: ['もしもラボ', 'もしも', 'チェキ', '推し活', 'アイドル'],
    endStats: [['推しに使うお金（使う人の平均）', '月16,356円', 'A3 推し活の調査 2025年'], ['おぢが買っていたのは', '話せる数十秒', 'もしもの筋'], ['チェキの正体', '話す時間の整理券', 'かもしれない']],
    sources: '出典：株式会社A3 推し活の全国調査（2025年）',
  },
});
