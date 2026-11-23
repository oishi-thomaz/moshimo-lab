import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, poseSlump, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBed, makeTable } from '../scenes/home.js';

// もしもマッチングアプリの料金が、男女同じだったら？（皮肉回・台本 S129・図星／男と女のもしも・作り直し 0673）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。plan/remake.md の13：元の回は1行目が 女子が飛び起きる で、若い女性が笑われる側から入っていた。
// 矛先を 課金だけで勝っていたつもりの男 に移して0秒から入る。女性の側は笑わず、仕組みが変わって 文章を読む ようになるだけ
// 数字は使わない（1,000件・3件は筋の中の数）。実在のアプリ名・画面・料金・ロゴは出さない（架空の もしもマッチ。画面は文字と色だけ）。デートや体の写真は出さない

const PINK = '#ff7ab8', GOLD = '#ffd27a';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d8ea' }); hemi.intensity = 1.4;
const KAKIN = makeMan({ shirt: '#59606e', hair: '#1d1a19' }); S.add(KAKIN); const sweatK = makeSweat(); KAKIN.userData.head.add(sweatK);
const JOSHI = makeWoman({ shirt: '#a8c8e8', hair: '#3a2018' }); S.add(JOSHI);
const MEN = [0, 1, 2].map(i => { const p = makeMan({ shirt: ['#4f6a8f', '#7a6a55', '#3f8f6b'][i], hair: ['#1d1a19', '#3a3330', '#2c2421'][i] }); S.add(p); return p; });
const TEINEI = MEN[2];

const FONT = (w, px) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function bigPhone(w = 1.0) { const P = makePhone({ w, h: w * 2, cw: 540, ch: 1080 }); S.add(P.g); return P; }
function header(g, W, title, col = PINK) { g.fillStyle = col; g.fillRect(0, 0, W, 130); g.fillStyle = '#fff'; g.font = FONT(900, 58); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, W / 2, 68); }
function scrBoost(on) { return (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'もしもマッチ'); g.fillStyle = PINK; g.font = FONT(900, 90); g.fillText('♥ いいね', W / 2, 330);
  g.fillStyle = on ? '#c89a1a' : '#888'; g.font = FONT(900, 150); g.fillText(on ? '×10' : '×1', W / 2, 520); g.font = FONT(800, 52); g.fillStyle = on ? '#c89a1a' : '#d23a3a'; g.fillText(on ? 'プレミアムで上乗せ' : '上乗せ 終了', W / 2, 700); }; }
function scrTiles(k) { return (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'さがす');
  for (let i = 0; i < 4; i++) { const big = i === 0 ? 1 - k : 0; const w = 220 + big * 160, h = 270 + big * 180; const x = 40 + (i % 2) * 240, y = 170 + Math.floor(i / 2) * 310; if (i === 0 && big > 0.01) { g.fillStyle = '#ffd27a'; g.fillRect(x - 6, y - 6, w + 12, h + 12); }
    if (i === 0 && big > 0.01) continue; g.fillStyle = ['#c8d8f0', '#d8e8c8', '#f0e0c8', '#e0d0f0'][i]; g.fillRect(x, y, 220, 270); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 110, y + 110, 50, 0, 7); g.fill(); if (i === 0) { g.fillStyle = '#c89a1a'; g.font = FONT(900, 40); g.fillText('加工', x + 110, y + 220); } }
  if (k < 1) { const w = 220 + (1 - k) * 260; g.fillStyle = '#c8d8f0'; g.fillRect(40, 170, w, w * 1.2); g.fillStyle = '#fff'; g.beginPath(); g.arc(40 + w / 2, 170 + w * 0.5, 50 + (1 - k) * 40, 0, 7); g.fill(); g.fillStyle = '#c89a1a'; g.font = FONT(900, 50); g.fillText('✨加工✨', 40 + w / 2, 170 + w * 0.95); } }; }
function scrInbox(n, col = '#5a8ae8') { return (g, W, H) => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); header(g, W, 'メッセージ', col); g.fillStyle = n ? '#3a8a5a' : '#999'; g.font = FONT(900, 160); g.fillText(n + '件', W / 2, 480); g.font = FONT(800, 50); g.fillStyle = '#888'; g.fillText(n ? '新しい返事' : '返事はまだありません', W / 2, 700); }; }
function scrLikes(n) { return (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'もしもマッチ'); g.fillStyle = PINK; g.font = FONT(900, 90); g.fillText('♥ いいね', W / 2, 330); g.font = FONT(900, 150); g.fillText(comma(n) + '件', W / 2, 520); g.fillStyle = '#888'; g.font = FONT(800, 50); g.fillText(n > 100 ? '多すぎて 読めない' : 'ちゃんと選ぶ', W / 2, 720); }; }
function scrProfile(k) { return (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'プロフィール'); g.fillStyle = '#c8d8e8'; g.fillRect(170, 170, 200, 200); g.fillStyle = '#333'; g.font = FONT(800, 50); g.fillText('相手に求める条件', W / 2, 440);
  const n = Math.max(1, Math.round(6 - 5 * k)); for (let i = 0; i < 6; i++) { if (i >= n) break; g.fillStyle = '#d8b8c8'; g.fillRect(60, 500 + i * 80, (W - 120) * (0.6 + ((i * 37) % 40) / 100), 40); } }; }
function scrRead() { return (g, W, H) => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); header(g, W, '自己紹介', '#5a8ae8'); g.fillStyle = '#c8d8f0'; g.fillRect(190, 160, 160, 160); g.fillStyle = '#555'; for (let i = 0; i < 9; i++) g.fillRect(50, 370 + i * 64, (W - 100) * (i % 3 === 2 ? 0.6 : 0.95), 26); }; }
function scrHello() { return (g, W, H) => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); header(g, W, 'メッセージ', '#5a8ae8'); g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(40, 260, 400, 130, 30); g.fill(); g.fillStyle = '#333'; g.font = FONT(900, 52); g.textAlign = 'left'; g.fillText('文章、素敵です', 70, 328); g.textAlign = 'center'; g.fillStyle = '#3a8a5a'; g.font = FONT(900, 60); g.fillText('はじめての返事', W / 2, 640); }; }

// ---------- A：課金の男の部屋（原点） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#dfe4ea', floor: '#8a7a6a' });
const sofa = new THREE.Group(); { const sm = mat('#4a5a7a'); const a = box(2.4, 0.45, 0.9, sm); a.position.y = 0.23; sofa.add(a); const b = box(2.4, 0.6, 0.25, sm); b.position.set(0, 0.75, -0.35); sofa.add(b); } sofa.position.set(0, 0, -1.4); S.add(sofa);
const PA = bigPhone(0.9);
const PREMIUM = label('プレミアム', { w: 768, size: 120, color: '#5a3a00', bg: 'rgba(255,200,60,.98)', sx: 1.0 }); S.add(PREMIUM);
const ONAJI = label('男女 同じ値段', { w: 900, size: 110, color: '#fff', bg: 'rgba(60,140,90,.97)', sx: 1.2 }); S.add(ONAJI);
const sparkA = makeSparkles(160, 0.14, 0xffe08a); S.add(sparkA.points); sparkA.init([[0.0, 2.55, -0.2]], 0.7, 0.9);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const uwanose = label('上乗せ 消える', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(uwanose);
const onaji2 = label('同じ大きさ', { w: 640, size: 110, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.95 }); S.add(onaji2);
const zero = label('返事 0件', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.95 }); S.add(zero);
const MEKAKUSHI = label('プレミアム', { w: 768, size: 120, color: '#5a3a00', bg: 'rgba(255,200,60,.98)', sx: 0.55 }); S.add(MEKAKUSHI);
const mekakushi = label('中身を隠す 目隠し', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.35 }); S.add(mekakushi);

// ---------- B：男たち（x=60） ----------
const BX = 60;
flat(16, 10, '#b8b4ac', BX, 0); const bWall = box(16, 3.2, 0.2, mat('#e8e2d4')); bWall.position.set(BX, 1.6, -2.6); S.add(bWall);
const MEN_P = MEN.map(() => { const P = makePhone({ w: 0.2, h: 0.4 }); S.add(P.g); return P; });
const maitsuki = label('毎月 課金', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(maitsuki);
const MIDOKU = MEN.map(() => { const l = label('未読', { w: 384, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.5 }); S.add(l); return l; });

// ---------- C：返事をする側の部屋（x=120） ----------
const CX = 120;
room({ x: CX, w: 7, d: 5, h: 3, wall: '#eef0e6', floor: '#c9a27a' });
const TBL = makeTable({ w: 1.4, d: 0.8 }); TBL.position.set(CX + 0.6, 0, -1.4); S.add(TBL);
const PC = bigPhone(0.9);
const demo = label('変わったのは 男だけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(demo);
const sanken = label('3件まで', { w: 512, size: 120, color: '#fff', bg: 'rgba(255,122,184,.98)', sx: 0.8 }); S.add(sanken);
const mijikaku = label('そっと短く', { w: 640, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.9 }); S.add(mijikaku);
const yomu = label('文章を ちゃんと読む', { w: 1024, size: 96, color: '#fff', bg: 'rgba(90,138,232,.96)', sx: 1.3 }); S.add(yomu);

// ---------- D：丁寧に書く男（x=180） ----------
const DX = 180;
room({ x: DX, w: 7, d: 5, h: 3, wall: '#e6e8f0', floor: '#9a8a7a' });
const DESK = makeTable({ w: 1.4, d: 0.8, color: '#b89a72' }); DESK.position.set(DX, 0, -1.4); S.add(DESK);
const PD = bigPhone(0.9);
const hajimete = label('初めて 返事', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(hajimete);

const PEOPLE = [KAKIN, JOSHI, ...MEN];
const LABELS = [PREMIUM, ONAJI, katamaru, uwanose, onaji2, zero, MEKAKUSHI, mekakushi, maitsuki, ...MIDOKU, demo, sanken, mijikaku, yomu, hajimete];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatK.userData.set(0);
  [PA, PC, PD, ...MEN_P].forEach(P => P.g.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function holdPhone(p) { p.userData.arms[1].rotation.set(-1.3, 0, 0.25); p.userData.arms[0].rotation.set(-1.1, 0, -0.25); p.userData.head.rotation.x = 0.25; }
function phoneAt(P, x, y, z, ry = 0, s = 1) { P.g.visible = true; P.g.position.set(x, y, z); P.g.rotation.set(0, ry, 0); P.g.scale.setScalar(s); }
const TP = 0.3;
function kakinBase() { stand(KAKIN, -0.5, -0.3, 0.25); holdPhone(KAKIN); }
function roomCam(u = 0) { look(lerp(0.05, 0.0, u), lerp(1.75, 1.7, u), lerp(4.6, 4.2, u), 0.0, 1.5, -0.6, 50); }
function shot0(t) { // 0秒＝サムネ：男だけに付いていた金色の プレミアム の札がパッと消えて、男女同じ値段の札に変わる
  reset(); lift(0); kakinBase(); phoneAt(PA, 0.55, 1.35, -0.2, -0.15); PA.draw(t < TP ? 'b1' : 'b0', scrBoost(t < TP));
  if (t < TP) { PREMIUM.visible = true; PREMIUM.position.set(-0.5, 1.2, 0.1); PREMIUM.userData.size(0.75); }
  else { const k = clamp((t - TP) / 0.15); if (k < 1) { PREMIUM.visible = true; PREMIUM.position.set(-0.5, 1.2, 0.1); PREMIUM.userData.size(0.75 * (1 - k)); } sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(ONAJI, t, TP + 0.1, -0.4, 1.2, 0.2, 0.95); }
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
sparkA.init([[-0.5, 1.2, 0.1]], 0.7, 0.9);
function sKatamaru(t, d) { // 課金で いいね を買い続けてきた男が、スマホを持ったまま固まる
  reset(); lift(140); kakinBase(); phoneAt(PA, 0.55, 1.35, -0.2, -0.15); PA.draw('b0', scrBoost(false)); sweatK.userData.set(1, t);
  if (t > d * 0.4) say(katamaru, t, d * 0.4, -0.75, 2.3, -0.3, 0.38);
  const u = ease(clamp(t / d)); look(lerp(-0.1, -0.3, u), 1.75, lerp(3.0, 2.6, u), -0.25, 1.45, -0.4, 50);
  return S;
}
function sFuman(t, d) { // 男たちの不満から。こっちは毎月払って、既読もつかない
  reset(); lift(140); MEN.forEach((p, i) => { stand(p, BX - 1.3 + i * 1.3, -0.8, 0); holdPhone(p); p.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.2, 0.45); p.localToWorld(v); phoneAt(MEN_P[i], v.x, v.y, v.z, 0); MEN_P[i].draw('m', scrInbox(0)); });
  say(maitsuki, t, 0.3, BX, 2.6, -1.0, 0.9);
  if (t > d * 0.55) MIDOKU.forEach((l, i) => say(l, t, d * 0.55 + i * 0.12, BX - 1.3 + i * 1.3, 2.05, -0.6, 0.45));
  look(BX, 1.9, 6.4, BX, 1.5, -0.8, 50);
  return S;
}
function phoneCam(x, u = 0) { look(x + lerp(0.1, 0.0, u), 1.6, lerp(3.6, 3.3, u), x, 1.55, -0.3, 50); }
function sDay1(t, d) { // 1日目。男の いいね の上乗せが、消える
  reset(); lift(120); phoneAt(PA, 0.0, 1.4, -0.3, 0, 0.75); const k = t > d * 0.4; PA.draw(k ? 'b0' : 'b1', scrBoost(!k));
  if (k) say(uwanose, t, d * 0.4, 0.0, 2.45, -0.2, 0.95);
  setHud('男女 同じ値段', '1日目', 1);
  phoneCam(0.0, ease(clamp(t / d)));
  return S;
}
function sDay3(t, d) { // 3日目。加工した写真だけが、ほかの人と同じ大きさで並ぶ
  reset(); lift(120); phoneAt(PA, 0.0, 1.4, -0.3, 0, 0.75); const k = easeOut(clamp((t - d * 0.3) / 0.8)); PA.draw('t' + Math.round(k * 20), scrTiles(k));
  if (k >= 1) say(onaji2, t, d * 0.3 + 0.8, 0.0, 2.45, -0.2, 0.85);
  setHud('男女 同じ値段', '3日目', 1);
  phoneCam(0.0, ease(clamp(t / d)));
  return S;
}
function sWeek(t, d) { // 1週間後。返事が、1件も来ない
  reset(); lift(140); stand(KAKIN, -0.2, -1.35, 0); poseSit(KAKIN); KAKIN.position.y += 0.06; holdPhone(KAKIN); KAKIN.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.15, 0.45); KAKIN.localToWorld(v); phoneAt(PA, v.x, v.y, v.z, 0, 0.35); PA.draw('i0', scrInbox(0)); sweatK.userData.set(1, t);
  if (t > d * 0.4) say(zero, t, d * 0.4, -0.2, 2.05, -1.2, 0.85);
  setHud('男女 同じ値段', '1週間後', 1);
  const u = ease(clamp(t / d)); look(lerp(0.4, 0.2, u), 1.7, lerp(2.8, 2.4, u), -0.2, 1.1, -1.3, 50);
  return S;
}
function joshiBase() { stand(JOSHI, CX - 0.6, -0.9, 0.3); holdPhone(JOSHI); }
function sDemo(t, d) { // でも、変わったのは、男だけじゃなかった
  reset(); lift(140); joshiBase(); JOSHI.userData.head.rotation.x = 0.1;
  if (t > d * 0.35) say(demo, t, d * 0.35, CX - 0.2, 2.45, -1.0, 1.2);
  look(CX - 0.2, 1.8, 3.4, CX - 0.3, 1.5, -1.0, 50);
  return S;
}
function sSanken(t, d) { // 同じ値段を払うようになって、1,000件のいいねは、3件まで絞られる
  reset(); lift(120); phoneAt(PC, CX, 1.4, -0.3, 0, 0.75); const ph = t / d; const n = ph < 0.5 ? 1000 : Math.round(lerp(1000, 3, easeOut(clamp((ph - 0.5) / 0.2)))); PC.draw('l' + n, scrLikes(n));
  if (ph > 0.72) say(sanken, t, d * 0.72, CX, 2.45, -0.2, 0.75);
  phoneCam(CX, ease(clamp(t / d)));
  return S;
}
function sJoken(t, d) { // プロフィールの条件の欄が、そっと短くなる
  reset(); lift(120); phoneAt(PC, CX, 1.4, -0.3, 0, 0.75); const k = easeOut(clamp((t - 0.3) / (d * 0.6))); PC.draw('p' + Math.round(k * 5), scrProfile(k));
  if (t > d * 0.5) say(mijikaku, t, d * 0.5, CX, 2.45, -0.2, 0.8);
  phoneCam(CX, ease(clamp(t / d)));
  return S;
}
function sYomu(t, d) { // 払う人はみんな、写真より先に、文章をちゃんと読み始める
  reset(); lift(140); stand(JOSHI, CX - 0.7, -0.9, 0.35); holdPhone(JOSHI);
  phoneAt(PC, CX + 0.45, 1.45, -0.6, -0.2, 0.75); PC.draw('r', scrRead());
  if (t > d * 0.4) say(yomu, t, d * 0.4, CX - 0.1, 2.45, -0.8, 1.15);
  look(CX - 0.1, 1.75, 3.4, CX - 0.1, 1.45, -0.7, 50);
  return S;
}
function sTeinei(t, d) { // 文章を丁寧に書いていた男に、初めて返事が届く
  reset(); lift(140); stand(TEINEI, DX - 0.7, -0.7, 0.35); holdPhone(TEINEI); TEINEI.userData.head.rotation.x = t > d * 0.45 ? -0.1 : 0.25;
  phoneAt(PD, DX + 0.45, 1.45, -0.4, -0.2, 0.75); PD.draw(t > d * 0.35 ? 'h1' : 'h0', t > d * 0.35 ? scrHello() : scrInbox(0));
  if (t > d * 0.45) say(hajimete, t, d * 0.45, DX - 0.6, 2.4, -0.7, 0.85);
  look(DX - 0.1, 1.75, 3.2, DX - 0.1, 1.45, -0.6, 50);
  return S;
}
function sKekka(t, d) { // 結果：男女同じ値段になって、一番困ったのは、お金でしか目立てなかった男だった
  reset(); lift(140); stand(KAKIN, 0, -1.35, 0); poseSlump(KAKIN, 0.6); KAKIN.position.y += 0.06; KAKIN.userData.arms.forEach(a => a.rotation.set(-0.3, 0, 0)); sweatK.userData.set(1, t);
  setTop('結果', 'お金だけの男が困った', clamp(Math.min(t / 0.3, (d - t) / 0.25)), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.3, u), lerp(1.8, 2.2, u), lerp(2.6, 3.6, u), 0, 1.0, -1.4, 50);
  return S;
}
function sMekakushi(t, d) { // 課金の金色の札は、人気じゃなく、中身を見られないための、目隠しだったのかもしれない
  reset(); lift(140); stand(KAKIN, -0.1, -0.5, 0); KAKIN.userData.head.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.2, 0.32); KAKIN.userData.head.localToWorld(v);
  MEKAKUSHI.visible = true; MEKAKUSHI.position.copy(v); MEKAKUSHI.userData.size(0.5 * clamp(t / 0.4));
  if (t > d * 0.45) say(mekakushi, t, d * 0.45, -0.1, 2.35, -0.5, 1.15);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.0, u), 1.75, lerp(2.9, 2.5, u), -0.1, 1.55, -0.5, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); kakinBase(); phoneAt(PA, 0.55, 1.35, -0.2, -0.15); PA.draw('b0', scrBoost(false)); ONAJI.visible = true; ONAJI.position.set(-0.4, 2.3, 0.2); ONAJI.userData.size(0.95); roomCam(0); return S; }

const NARR = { '課金': 'かきん', '買い続けてきた': 'かいつづけてきた', '持った': 'もった', '固まる': 'かたまる', '不満': 'ふまん', '毎月': 'まいつき', '払って': 'はらって', '既読': 'きどく', '1日目': 'いちにちめ', '上乗せ': 'うわのせ', '消える': 'きえる', '3日目': 'みっかめ', '加工した': 'かこうした', '写真': 'しゃしん', '同じ大きさ': 'おなじおおきさ', '並ぶ': 'ならぶ', '1週間後': 'いっしゅうかんご', '返事': 'へんじ', '1件': 'いっけん', '来ない': 'こない', '変わった': 'かわった', '同じ値段': 'おなじねだん', '払う': 'はらう', '1,000件': 'せんけん', '3件': 'さんけん', '絞られる': 'しぼられる', '条件': 'じょうけん', '欄': 'らん', '短く': 'みじかく', '先に': 'さきに', '文章': 'ぶんしょう', '読み始める': 'よみはじめる', '丁寧に': 'ていねいに', '書いていた': 'かいていた', '初めて': 'はじめて', '届く': 'とどく', '結果：': '結果、', '男女': 'だんじょ', '一番': 'いちばん', '困った': 'こまった', '目立てなかった': 'めだてなかった', '金色': 'きんいろ', '札': 'ふだ', '人気': 'にんき', '中身': 'なかみ', '見られない': 'みられない', '目隠し': 'めかくし' };
const P = planTimes([
  ['課金で いいね を<br>買い続けてきた男が、', (t, d) => sKatamaru(t, 2 * d)],
  ['スマホを持ったまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['男たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['こっちは毎月払って、<br>既読もつかない。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。男の いいね の<br>上乗せが、消える。', sDay1],
  ['3日目。加工した写真だけが、<br>ほかの人と同じ大きさで並ぶ。', sDay3],
  ['1週間後。返事が、<br>1件も来ない。', sWeek],
  ['でも、変わったのは、<br>男だけじゃなかった。', sDemo],
  ['同じ値段を払うようになって、', (t, d) => sSanken(t, 2 * d)],
  ['1,000件のいいねは、<br>3件まで絞られる。', (t, d) => sSanken(t + d, 2 * d)],
  ['プロフィールの条件の欄が、<br>そっと短くなる。', sJoken],
  ['払う人はみんな、写真より先に、<br>文章をちゃんと読み始める。', sYomu],
  ['文章を丁寧に書いていた男に、<br>初めて返事が届く。', sTeinei],
  ['結果：男女同じ値段になって、', (t, d) => sKekka(t, 3 * d)],
  ['一番困ったのは、', (t, d) => sKekka(t + d, 3 * d)],
  ['お金でしか目立てなかった<br>男だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['課金の金色の札は、<br>人気じゃなく、', (t, d) => sMekakushi(t, 2 * d)],
  ['中身を見られないための、<br>目隠しだったのかもしれない。', (t, d) => sMekakushi(t + d, 2 * d)],
  ['マッチングアプリ、<br>男女同じ値段にすべき？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0727',
    v2: true,
    tt: 'main',
    trial: true,
    remakeOf: '0673',
    hookLine: '男だけに付いていた金色の プレミアム の札が、パッと消えて、男女同じ値段の札に変わる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしもマッチングアプリの料金が、男女同じだったら？',
    titleHtml: 'もしもマッチング<br>アプリの料金が、<br>男女同じ<br>だったら？',
    mood: 'tension', seed: 727, hits: [TP, P.at(13), P.at(16)], risers: [P.at(7)], impacts: [P.at(9, 0.9), P.at(15, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.25], [P.at(4, 0.8), 'whoosh'], [P.at(5, 0.8), 'whoosh'], [P.at(6, 0.6), 'alarm'], [P.at(12, 0.6), 'bubble']],
    narr: NARR,
    ask: 'マッチングアプリ、男女同じ値段にすべき？',
    caption: 'もしもマッチングアプリの料金が、男女同じだったら？\n\n課金で いいね を買い続けてきた男が、スマホを持ったまま固まる。\n男たちの不満から。こっちは毎月払って、既読もつかない。\n1日目。男の いいね の上乗せが、消える。\n3日目。加工した写真だけが、ほかの人と同じ大きさで並ぶ。\n1週間後。返事が、1件も来ない。\nでも、変わったのは、男だけじゃなかった。\n同じ値段を払うようになって、1,000件のいいねは、3件まで絞られる。\nプロフィールの条件の欄が、そっと短くなる。\n払う人はみんな、写真より先に、文章をちゃんと読み始める。\n文章を丁寧に書いていた男に、初めて返事が届く。\n\n結果：男女同じ値段になって、一番困ったのは、お金でしか目立てなかった男だった。\n課金の金色の札は、人気じゃなく、中身を見られないための、目隠しだったのかもしれない。\n\nマッチングアプリ、男女同じ値段にすべき？ コメントで教えて。\n\n※風刺ネタです。料金が男女同じになるのは、もしもの設定です。アプリ・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'マッチングアプリ', '婚活', '男と女のもしも'],
    endStats: [['変わったもの', '男女 同じ値段', 'もしもの設定'], ['一番困ったのは', 'お金だけの男', 'もしもの結果'], ['金色の札の正体', '中身を隠す目隠し', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
