import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBed, makeTable } from '../scenes/home.js';

// もしもマッチングアプリが女性も有料だったら？（皮肉回・台本 S71・図星／男と女のもしも）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。元ネタ：男性は有料・女性は無料 のマッチングアプリの料金の差（はてな・ガルちゃん・なんJで繰り返し燃える論争）
// 数字は使わない（実在のアプリ名・画面・料金は出さない。アプリは架空の もしもマッチ、画面は文字と色だけ）
// 女叩き（選び放題女子）から入り、後半で課金頼みの男に返す両叩き。三段は 1日目 3件に絞る→3日目 年収の条件が消える→1週間後 自分から送る。言い換えは 値札のない宝石
// デートや体の写真は出さない（プロフィールの写真は色の四角）

const PINK = '#ff7ab8';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d8ea' }); hemi.intensity = 1.4;
const JOSHI = makeWoman({ shirt: '#f29bbb', hair: '#3a2018', pants: '#f29bbb' }); S.add(JOSHI);
const KAKIN = makeMan({ shirt: '#59606e', hair: '#1d1a19' }); S.add(KAKIN); // 課金で勝っていたつもりの男
const MEN = [0, 1, 2].map(i => { const p = makeMan({ shirt: ['#4f6a8f', '#7a6a55', '#3f8f6b'][i], hair: ['#1d1a19', '#3a3330', '#2c2421'][i] }); S.add(p); return p; });

// 大きなスマホの画面（看板として浮かべる）
const FONT = (w, px) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function bigPhone(w = 1.1) { const P = makePhone({ w, h: w * 2, cw: 540, ch: 1080 }); S.add(P.g); return P; }
function header(g, W, title, col = PINK) { g.fillStyle = col; g.fillRect(0, 0, W, 130); g.fillStyle = '#fff'; g.font = FONT(900, 58); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, W / 2, 68); }
function scrLikes(n, price) { return (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'もしもマッチ');
  if (price) { g.fillStyle = '#1a1a22'; g.fillRect(40, 300, W - 80, 380); g.fillStyle = '#7dff9a'; g.font = FONT(900, 70); g.fillText('お会計', W / 2, 390); g.font = FONT(900, 120); g.fillText('¥ 有料', W / 2, 560); g.fillStyle = '#d23a3a'; g.font = FONT(900, 64); g.fillText('女性も有料に', W / 2, 800); return; }
  g.fillStyle = PINK; g.font = FONT(900, 90); g.fillText('♥ いいね', W / 2, 360); g.font = FONT(900, 150); g.fillText(comma(n) + '件', W / 2, 560); g.fillStyle = '#888'; g.font = FONT(800, 50); g.fillText('未読のまま', W / 2, 760); }; }
function scrProfile(k) { return (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'プロフィール');
  g.fillStyle = '#f2c4d8'; g.fillRect(150, 180, 240, 240); g.fillStyle = '#333'; g.font = FONT(800, 50); g.fillText('相手に求める条件', W / 2, 500);
  g.globalAlpha = 1 - k; g.fillStyle = '#d23a3a'; g.font = FONT(900, 70); g.fillText('年収600万以上', W / 2, 620); g.globalAlpha = 1;
  if (k > 0) { g.strokeStyle = '#333'; g.lineWidth = 12; g.beginPath(); g.moveTo(60, 620); g.lineTo(60 + (W - 120) * Math.min(1, k * 2), 620); g.stroke(); }
  g.fillStyle = '#333'; g.font = FONT(800, 50); g.fillText('身長170以上', W / 2, 760); }; }
function scrChat(sent, read, from = '自分') { return (g, W, H) => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); header(g, W, 'メッセージ', '#5a8ae8');
  if (sent) { g.fillStyle = '#7ad07a'; g.beginPath(); g.roundRect(150, 300, 340, 120, 30); g.fill(); g.fillStyle = '#fff'; g.font = FONT(900, 56); g.fillText('こんにちは', 320, 362); g.fillStyle = '#999'; g.font = FONT(800, 40); g.textAlign = 'right'; g.fillText(read ? '既読' : '未読', 140, 400); g.textAlign = 'center'; }
  g.fillStyle = '#bbb'; g.font = FONT(800, 46); g.fillText('返事はまだありません', W / 2, 760); }; }
function scrMenChat(k) { return (g, W, H) => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); header(g, W, 'メッセージ', '#5a8ae8');
  for (let i = 0; i < 5; i++) { const on = i / 5 >= k; g.fillStyle = on ? '#ffffff' : '#e0e2e6'; g.fillRect(30, 170 + i * 170, W - 60, 140); g.fillStyle = on ? '#f2c4d8' : '#cfd2d8'; g.fillRect(50, 190 + i * 170, 100, 100); g.fillStyle = on ? '#333' : '#aaa'; g.font = FONT(800, 44); g.textAlign = 'left'; g.fillText(on ? '返事が来ました' : '返事なし', 180, 245 + i * 170); g.textAlign = 'center'; } }; }
function scrPhotos() { return (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, '写真をよく見る'); for (let i = 0; i < 4; i++) { g.fillStyle = ['#c8d8f0', '#d8e8c8', '#f0e0c8', '#e0d0f0'][i]; g.fillRect(40 + (i % 2) * 240, 180 + Math.floor(i / 2) * 300, 220, 270); g.fillStyle = '#fff'; g.beginPath(); g.arc(150 + (i % 2) * 240, 290 + Math.floor(i / 2) * 300, 50, 0, 7); g.fill(); } }; }

// ---------- A：女子の部屋（原点） ----------
const roomA = room({ x: 0, w: 7, d: 5, h: 3, wall: '#f6e6ef', floor: '#c9a27a' });
const BED = makeBed({ blanket: '#f2b8d0' }); BED.position.set(0.2, 0, -1.2); S.add(BED);
const PA = bigPhone(1.0);
const tobiokiru = label('飛び起きる', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(tobiokiru);
const sparkA = makeSparkles(160, 0.14, 0xffd0e8); S.add(sparkA.points);
const shiboru = label('3件まで', { w: 512, size: 120, color: '#fff', bg: 'rgba(255,122,184,.98)', sx: 0.9 }); S.add(shiboru);
const sotto = label('そっと消す', { w: 640, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.1 }); S.add(sotto);
const hajimete = label('初めて自分から', { w: 900, size: 100, color: '#fff', bg: 'rgba(90,138,232,.96)', sx: 1.6 }); S.add(hajimete);
const kidoku = label('既読 つかない', { w: 768, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.4 }); S.add(kidoku);
const shiru = label('男は毎月これを', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(shiru);
const mamoru = label('ちゃんと見る', { w: 768, size: 100, color: '#fff', bg: 'rgba(255,122,184,.98)', sx: 1.3 }); S.add(mamoru);

// ---------- B：男たち（x=60）：毎月払って既読もつかない ----------
const BX = 60;
flat(16, 10, '#b8b4ac', BX, 0);
const bWall = box(16, 3.2, 0.2, mat('#e8e2d4')); bWall.position.set(BX, 1.6, -2.6); S.add(bWall);
const MEN_P = MEN.map((p, i) => { const P = makePhone({ w: 0.2, h: 0.4 }); S.add(P.g); return P; });
const maitsuki = label('毎月 課金', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(maitsuki);
const MIDOKU = MEN.map(() => { const l = label('未読', { w: 384, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.55 }); S.add(l); return l; });

// ---------- C：課金の男の部屋（x=120） ----------
const CX = 120;
const roomC = room({ x: CX, w: 7, d: 5, h: 3, wall: '#dfe4ea', floor: '#8a7a6a' });
const sofa = new THREE.Group(); { const sm = mat('#4a5a7a'); const a = box(2.4, 0.45, 0.9, sm); a.position.y = 0.23; sofa.add(a); const b = box(2.4, 0.6, 0.25, sm); b.position.set(0, 0.75, -0.35); sofa.add(b); } sofa.position.set(CX, 0, -1.2); S.add(sofa);
const PC = bigPhone(1.0);
const kachi = label('課金で勝ってた', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(kachi);
const tomaru = label('返事が全部止まる', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.9 }); S.add(tomaru);
const sweatK = makeSweat(); KAKIN.userData.head.add(sweatK);
const komatta = label('課金だけが取り柄の男', { w: 1100, size: 92, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.1 }); S.add(komatta);

// ---------- D：宝石（x=180）：値札のない宝石 ----------
const DX = 180;
flat(10, 8, '#2a2a3a', DX, 0);
const dWall = box(10, 4, 0.2, mat('#3a3a50')); dWall.position.set(DX, 2, -2.5); S.add(dWall);
const ped = box(0.9, 1.0, 0.9, mat('#e8e2d4')); ped.position.set(DX, 0.5, -0.6); S.add(ped);
const GEM = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshLambertMaterial({ color: '#ff9ed0', emissive: 0x803060, emissiveIntensity: 0.5, flatShading: true })); GEM.scale.y = 1.3; GEM.position.set(DX, 1.55, -0.6); S.add(GEM);
const gemLight = new THREE.PointLight(0xffd0f0, 14, 8, 1.3); gemLight.position.set(DX, 2.8, 1.2); S.add(gemLight);
const sparkD = makeSparkles(80, 0.12, 0xffffff); S.add(sparkD.points); sparkD.init([[DX, 1.55, -0.6]], 0.6, 0.8);
const nefuda = label('値札なし', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(nefuda);
const hoseki = label('値札のない宝石', { w: 900, size: 100, color: '#fff', bg: 'rgba(255,122,184,.98)', sx: 1.7 }); S.add(hoseki);

const PEOPLE = [JOSHI, KAKIN, ...MEN];
const LABELS = [tobiokiru, shiboru, sotto, hajimete, kidoku, shiru, mamoru, maitsuki, ...MIDOKU, kachi, tomaru, komatta, nefuda, hoseki];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkD.set(0); el.flash.style.opacity = 0; sweatK.userData.set(0);
  PA.g.visible = true; PA.g.position.set(-1.15, 1.75, -0.5); PA.g.rotation.set(0, 0.3, 0);
  JOSHI.position.set(0.2, 0.62, -1.3); JOSHI.rotation.set(-Math.PI / 2 + 0.2, 0, 0);
  MEN.forEach((p, i) => { p.position.set(BX - 1.6 + i * 1.6, 0, -0.4); p.userData.arms[1].rotation.set(-1.2, 0, 0.2); p.userData.head.rotation.x = 0.3; const P = MEN_P[i]; P.g.position.set(BX - 1.6 + i * 1.6 + 0.08, 1.28, -0.02); P.g.rotation.x = -0.5; });
  KAKIN.position.set(CX + 0.2, 0, -1.0); poseSit(KAKIN); KAKIN.userData.arms[1].rotation.set(-1.2, 0, 0.2); KAKIN.userData.head.rotation.x = 0.25;
  PC.g.position.set(CX + 1.4, 1.9, -0.2); PC.g.rotation.set(0, -0.3, 0);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function sitUp(p, k) { p.rotation.x = lerp(-Math.PI / 2 + 0.2, 0, k); p.position.y = lerp(0.62, 0.62, k); p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2 * k); }
const TP = 0.35;
function bedCam(u = 0) { look(lerp(-0.3, -0.35, u), lerp(2.3, 2.2, u), lerp(4.9, 4.4, u), -0.45, lerp(1.95, 1.5, u), -0.9, 50); }
function shot0(t) { // 0秒＝サムネ：スマホの いいね1,000件 の通知が、レジの金額にパッと変わる
  reset(); lift(0); sitUp(JOSHI, 1); JOSHI.userData.head.rotation.y = 0.5;
  PA.draw(t < TP ? 'l1000' : 'price', t < TP ? scrLikes(1000) : scrLikes(0, true));
  if (t > TP) { sparkA.init([[-1.15, 1.75, -0.4]], 0.6, 0.9); sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  bedCam(ease(clamp(t / 3)) * 0.4);
  return S;
}
function sTobiokiru(t, d) { // いいねを溜め込んでいた女子が、ベッドの上で飛び起きる。
  reset(); lift(120); const k = easeOut(clamp((t - 0.3) / 0.5)); sitUp(JOSHI, k); JOSHI.position.y = 0.62 + Math.sin(clamp((t - 0.3) / 0.5) * Math.PI) * 0.25;
  PA.draw('price', scrLikes(0, true)); if (t > 0.9) say(tobiokiru, t, 0.9, 0.6, 2.45, -1.0, 1.0);
  bedCam(0.4 + ease(clamp(t / d)) * 0.6);
  return S;
}
function menCam(u = 0) { look(BX + lerp(0.3, 0, u), 1.9, lerp(5.6, 5.0, u), BX, 1.4, -0.4, 50); }
function sMen(t, d) { // 男たちの不満から。こっちは毎月払って、既読もつかない。
  reset(); lift(120); JOSHI.visible = false;
  MEN_P.forEach((P, i) => P.draw('c' + i, scrChat(true, false)));
  say(maitsuki, t, 0.4, BX, 2.75, -0.6, 1.2); MIDOKU.forEach((l, i) => { if (t > d * 0.45 + i * 0.25) say(l, t, d * 0.45 + i * 0.25, BX - 1.6 + i * 1.6, 2.25, -0.4, 0.5); });
  menCam(ease(clamp(t / d)));
  return S;
}
function sDay1(t, d) { // 1日目。女子は1,000件のいいねを、3件まで絞る。
  reset(); lift(120); sitUp(JOSHI, 1); JOSHI.userData.arms[1].rotation.set(-1.2, 0, 0.3);
  const n = t < 0.6 ? 1000 : Math.max(3, Math.round(1000 * (1 - easeOut(clamp((t - 0.6) / 1.4))))); PA.draw('l' + n, scrLikes(n));
  if (t > 2.0) say(shiboru, t, 2.0, -1.3, 3.1, -0.5, 0.8);
  setHud('女性も有料になって', '1日目', 1); bedCam(1);
  return S;
}
function sDay3(t, d) { // 3日目。プロフィールの 年収600万以上 が、そっと消える。
  reset(); lift(120); sitUp(JOSHI, 1); JOSHI.userData.arms[1].rotation.set(-1.2, 0, 0.3); JOSHI.userData.head.rotation.y = 0.3;
  const k = clamp((t - 0.8) / 1.0); PA.draw('p' + k.toFixed(2), scrProfile(k));
  if (t > 1.9) say(sotto, t, 1.9, -1.3, 3.1, -0.5, 0.9);
  setHud('女性も有料になって', '3日目', 1); bedCam(1);
  return S;
}
function sWeek(t, d) { // 1週間後。初めて自分から、こんにちは と送る。
  reset(); lift(120); sitUp(JOSHI, 1); JOSHI.userData.arms[1].rotation.set(-1.4, 0, 0.3);
  PA.draw('ch' + (t > 0.8 ? 1 : 0), scrChat(t > 0.8, false)); if (t > 1.2) say(hajimete, t, 1.2, -1.3, 3.1, -0.5, 1.3);
  setHud('女性も有料になって', '1週間後', 1); bedCam(1);
  return S;
}
function sKidoku(t, d) { // 返事が来ない。既読もつかない。
  reset(); lift(120); sitUp(JOSHI, 1); JOSHI.userData.head.rotation.x = 0.2 + 0.1 * Math.sin(t * 2); PA.draw('ch1', scrChat(true, false));
  say(kidoku, t, 0.5, 0.4, 2.45, -1.0, 1.2);
  const u = ease(clamp(t / d)); look(lerp(-0.3, 0.1, u), 2.2, lerp(4.2, 3.2, u), -0.2, 1.5, -1.0, 50);
  return S;
}
function sShiru(t, d) { // 女子は知る。これを男は、毎月払ってやっていた。
  reset(); lift(120); sitUp(JOSHI, 1); JOSHI.userData.head.rotation.x = 0.3; JOSHI.userData.arms.forEach(a => a.rotation.set(-0.4, 0, 0)); PA.draw('ch1', scrChat(true, false));
  say(shiru, t, 0.6, 0.3, 2.45, -1.0, 1.4);
  look(0.1, 2.0, 3.0, 0.1, 1.5, -1.2, 50);
  return S;
}
function kakinCam(u = 0) { look(CX + lerp(0.9, 0.7, u), 1.9, lerp(4.4, 3.8, u), CX + 0.6, 1.4, -0.8, 50); }
function sKakin(t, d) { // 一方、課金で勝っていたつもりの男。
  reset(); lift(120); JOSHI.visible = false; PC.draw('m0', scrMenChat(0));
  KAKIN.userData.head.rotation.x = -0.1; say(kachi, t, 0.4, CX + 0.2, 2.2, -0.8, 1.4);
  kakinCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sTomaru(t, d) { // 返事が全部止まる。
  reset(); lift(120); JOSHI.visible = false; const k = clamp((t - 0.3) / 1.2); PC.draw('m' + k.toFixed(2), scrMenChat(k)); sweatK.userData.set(k, t);
  if (t > 1.0) say(tomaru, t, 1.0, CX + 0.4, 2.3, -0.8, 1.7);
  kakinCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sPhotos(t, d) { // 女子が払うようになって、男の写真をちゃんと見始めたから。
  reset(); lift(120); sitUp(JOSHI, 1); JOSHI.userData.arms[1].rotation.set(-1.3, 0, 0.3); JOSHI.userData.head.rotation.y = 0.35; PA.draw('ph', scrPhotos());
  if (t > 1.0) say(mamoru, t, 1.0, -0.1, 2.55, -0.9, 1.0);
  bedCam(1);
  return S;
}
function sKekka(t, d) { // 結果：女性も有料になって、一番困ったのは、課金だけが取り柄の男だった。
  reset(); lift(120); JOSHI.visible = false; PC.draw('m1', scrMenChat(1)); sweatK.userData.set(1, t); KAKIN.userData.head.rotation.x = 0.45; KAKIN.userData.arms[1].rotation.set(-0.4, 0, 0.1);
  if (t > d * 0.5) say(komatta, t, d * 0.5, CX + 0.2, 2.25, -0.8, 1.9);
  const u = ease(clamp(t / d)); look(CX + lerp(1.4, 0.4, u), lerp(2.4, 1.9, u), lerp(5.2, 3.6, u), CX + 0.3, 1.3, -0.9, 50);
  return S;
}
function sHoseki(t, d) { // 無料の いいね は、女子が自分を高く見せるための、値札のない宝石
  reset(); lift(120); JOSHI.visible = false; GEM.rotation.y = t * 0.8; sparkD.set((t * 0.4) % 1);
  if (t > 0.6) say(nefuda, t, 0.6, DX + 0.6, 1.15, -0.2, 0.6); if (t > d * 0.55) say(hoseki, t, d * 0.55, DX, 2.65, -0.6, 1.5);
  const u = ease(clamp(t / d)); look(DX, lerp(2.0, 1.8, u), lerp(4.4, 3.6, u), DX, 1.55, -0.6, 50);
  return S;
}
function sAsk(t) { // マッチングアプリ、女性も有料にすべき？（冒頭と同じ構図。画面は有料のまま）
  reset(); lift(0); sitUp(JOSHI, 1); JOSHI.userData.head.rotation.y = 0.5; PA.draw('price', scrLikes(0, true)); bedCam(0);
  return S;
}

const NARR = { '1,000件': 'せんけん', '3件': 'さんけん', '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '年収600万以上': 'ねんしゅうろっぴゃくまんいじょう', '既読': 'きどく', '毎月': 'まいつき', '一方': 'いっぽう', '課金': 'かきん', '取り柄': 'とりえ', '結果：': '結果、', '一番': 'いちばん', '値札': 'ねふだ', '宝石': 'ほうせき', '女子': 'じょし', '溜め込んで': 'ためこんで', '飛び起きる': 'とびおきる', '女性': 'じょせい', '有料': 'ゆうりょう' };
const P = planTimes([
  ['いいねを溜め込んでいた女子が、<br>ベッドの上で飛び起きる。', sTobiokiru],
  ['男たちの不満から。こっちは<br>毎月払って、既読もつかない。', sMen],
  ['1日目。女子は1,000件の<br>いいねを、3件まで絞る。', sDay1],
  ['3日目。プロフィールの', (t, d) => sDay3(t, 2 * d)],
  ['年収600万以上 が、<br>そっと消える。', (t, d) => sDay3(t + d, 2 * d)],
  ['1週間後。初めて自分から、<br>こんにちは と送る。', sWeek],
  ['返事が来ない。<br>既読もつかない。', sKidoku],
  ['女子は知る。これを男は、<br>毎月払ってやっていた。', sShiru],
  ['一方、課金で勝っていた<br>つもりの男。', sKakin],
  ['返事が全部止まる。', sTomaru],
  ['女子が払うようになって、', (t, d) => sPhotos(t, 2 * d)],
  ['男の写真を<br>ちゃんと見始めたから。', (t, d) => sPhotos(t + d, 2 * d)],
  ['結果：女性も有料になって、<br>一番困ったのは、', (t, d) => sKekka(t, 2 * d)],
  ['課金だけが取り柄の男だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['無料の いいね は、女子が<br>自分を高く見せるための、', sHoseki],
  ['値札のない宝石', (t, d) => sHoseki(t + 3.2, d + 3.2)],
  ['だったのかもしれない。', (t, d) => sHoseki(t + 5.5, d + 5.5)],
  ['マッチングアプリ、<br>女性も有料にすべき？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0673',
    v2: true,
    tt: 'main',
    hookLine: 'スマホの いいね1,000件 の通知が、レジの金額にパッと変わる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもマッチングアプリが女性も有料だったら？',
    titleHtml: 'もしもマッチング<br>アプリが女性も<br>有料だったら？',
    mood: 'tension', seed: 673, hits: [TP, P.at(12), P.at(15)], risers: [P.at(7)], impacts: [P.at(2, 1.2), P.at(4, 0.4), P.at(9, 0.6)],
    sfx: [[TP, 'poof'], [P.at(0, 0.3), 'whoosh'], [P.at(1, 0.4), 'buzz'], [P.at(2, 0.6), 'meter', 0.3], [P.at(4, 0.3), 'poof'], [P.at(5, 0.8), 'bubble'], [P.at(6, 0.3), 'meter', 0.4], [P.at(9, 0.3), 'alarm'], [P.at(14, 0.6), 'whoosh']],
    narr: NARR,
    ask: 'マッチングアプリ、女性も有料にすべき？',
    caption: 'もしもマッチングアプリが女性も有料だったら？\n\nいいねを溜め込んでいた女子が、ベッドの上で飛び起きる。\n男たちの不満から。こっちは毎月払って、既読もつかない。\n1日目。女子は1,000件のいいねを、3件まで絞る。\n3日目。プロフィールの 年収600万以上 が、そっと消える。\n1週間後。初めて自分から、こんにちは と送る。\n返事が来ない。既読もつかない。\n女子は知る。これを男は、毎月払ってやっていた。\n一方、課金で勝っていたつもりの男。返事が全部止まる。\n女子が払うようになって、男の写真をちゃんと見始めたから。\n\n結果：女性も有料になって、一番困ったのは、課金だけが取り柄の男だった。\n無料の いいね は、女子が自分を高く見せるための、値札のない宝石だったのかもしれない。\n\nマッチングアプリ、女性も有料にすべき？ コメントで教えて。\n\n※風刺ネタです。女性も有料になるのは、もしもの設定です。アプリ・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'マッチングアプリ', '婚活', '恋愛'],
    endStats: [['変わったこと', '女性も有料', 'もしもの設定'], ['一番困ったのは', '課金だけが取り柄の男', 'もしもの結果'], ['無料のいいねの正体', '値札のない宝石', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
