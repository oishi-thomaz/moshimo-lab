import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBed, makeTable } from '../scenes/home.js';

// もしもライブ配信から、投げ銭が消えたら？（皮肉回・台本 S137・図星／沼が消えたら）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。給料日に高い投げ銭を送って名前を読んでもらうおぢが、金色のロケットが消えて固まる回。後半で ランキング1位を張り合っていた2位のおぢ にも返す
// 数字は使わない。実在の配信アプリ・ギフトの見た目・ロゴは出さない（架空の もしもLIVE。画面は文字と色だけ）。配信者は笑われる側にしない（顔ははっきり出さない）。性的にきわどい配信の絵は出さない

const GOLD = '#ffd27a', LIVE = '#ff4a6a';
const { S, flat, room, hemi } = makeSet({ bg: '#1e2030', ground: '#3a3640' }); hemi.intensity = 1.15;
const OJI = makeOji(rng(137), { shirt: '#59606e' }); S.add(OJI); const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const OJI2 = makeOji(rng(237), { shirt: '#8a6a4a' }); S.add(OJI2); const sweat2 = makeSweat(); OJI2.userData.head.add(sweat2);
const VIEWERS = [makeWoman({ shirt: '#a8c8e8', hair: '#3a2018' }), makeMan({ shirt: '#3f8f6b' }), makeWoman({ shirt: '#e8b0c8', hair: '#2a1a14' })]; VIEWERS.forEach(p => S.add(p));

const FONT = (w, px) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function bigPhone(w = 0.9) { const P = makePhone({ w, h: w * 2, cw: 540, ch: 1080 }); S.add(P.g); return P; }
function liveBase(g, W, H) { g.fillStyle = '#2a2438'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a3450'; g.fillRect(0, 0, W, 560);
  // 配信者（顔をはっきり出さないシルエット）
  g.fillStyle = '#6a6488'; g.beginPath(); g.arc(W / 2, 250, 90, 0, 7); g.fill(); g.beginPath(); g.roundRect(W / 2 - 150, 340, 300, 240, 60); g.fill();
  g.fillStyle = LIVE; g.beginPath(); g.roundRect(24, 24, 130, 56, 12); g.fill(); g.fillStyle = '#fff'; g.font = FONT(900, 36); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LIVE', 89, 53);
  g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.roundRect(W - 230, 24, 206, 56, 12); g.fill(); g.fillStyle = '#fff'; g.font = FONT(800, 30); g.fillText('もしもLIVE', W - 127, 53); }
function comments(g, W, rows, y0 = 600) { g.textAlign = 'left'; rows.forEach((r, i) => { const [name, txt, hl, big] = r; const y = y0 + i * 92; g.fillStyle = hl ? 'rgba(255,210,122,.95)' : 'rgba(255,255,255,.12)'; g.beginPath(); g.roundRect(20, y, W - 40, 78, 16); g.fill(); g.fillStyle = hl ? '#3a2600' : '#cfd0e0'; g.font = FONT(900, big ? 34 : 30); g.fillText(name, 40, y + 40); g.fillStyle = hl ? '#3a2600' : '#ffffff'; g.font = FONT(800, 30); g.fillText(txt, 40 + Math.min(200, g.measureText(name).width + 24), y + 40); }); g.textAlign = 'center'; }
function rocket(g, W, k = 1) { if (k <= 0) return; g.save(); g.globalAlpha = k; g.translate(W / 2, 470); g.scale(k, k); g.fillStyle = '#ffd23a'; g.beginPath(); g.moveTo(0, -150); g.quadraticCurveTo(70, -60, 55, 90); g.lineTo(-55, 90); g.quadraticCurveTo(-70, -60, 0, -150); g.fill(); g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(0, -40, 28, 0, 7); g.fill(); g.fillStyle = '#ff8a3a'; g.beginPath(); g.moveTo(-35, 90); g.lineTo(0, 170); g.lineTo(35, 90); g.fill(); g.fillStyle = '#c89a1a'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 50, 20); g.lineTo(s * 100, 110); g.lineTo(s * 50, 90); g.fill(); } g.restore(); }
const scrRocket = (k) => (g, W, H) => { liveBase(g, W, H); comments(g, W, [['おぢ', 'ロケット送ったよ', true, true], ['みる', 'こんばんは', false], ['ゆき', 'かわいい', false]], 700); rocket(g, W, k); };
const scrFlow = (g, W, H) => { liveBase(g, W, H); comments(g, W, [['みる', 'こんばんは', false], ['ゆき', '今日なにする？', false], ['たろ', '初見です', false], ['あや', 'おつかれ', false], ['けん', 'こんばんは', false]]); };
const scrOrder = (n) => (g, W, H) => { liveBase(g, W, H); comments(g, W, [['みる', 'こんばんは', n === 0], ['ゆき', '今日なにする？', n === 1], ['たろ', '初見です', n === 2], ['あや', 'おつかれ', n === 3]]); };
const scrText = (g, W, H) => { liveBase(g, W, H); comments(g, W, [['みる', 'こんばんは', false], ['ゆき', 'おつかれ', false], ['おぢ', 'きょうも見てるよ', false], ['たろ', '初見です', false]]); };
const scrReply = (g, W, H) => { liveBase(g, W, H); comments(g, W, [['ゆき', 'おつかれ', false], ['おぢ', 'きょうも見てるよ', false]], 760); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(40, 590, W - 80, 120, 30); g.fill(); g.fillStyle = '#3a2438'; g.font = FONT(900, 34); g.fillText('おぢさん、いつもありがとう', W / 2, 652); };
const scrCount = (k) => (g, W, H) => { liveBase(g, W, H); g.fillStyle = '#fff'; g.font = FONT(900, 46); g.fillText('見に来てくれた人', W / 2, 650); const n = Math.round(4 + k * 16); for (let i = 0; i < n; i++) { const x = 70 + (i % 10) * 44, y = 740 + Math.floor(i / 10) * 90; g.fillStyle = ['#7ad0a0', '#ffd27a', '#7ab0e8', '#e8a0c8'][i % 4]; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.beginPath(); g.roundRect(x - 18, y + 20, 36, 40, 10); g.fill(); } };
const scrRank = (k) => (g, W, H) => { g.fillStyle = '#2a2438'; g.fillRect(0, 0, W, H); g.fillStyle = GOLD; g.fillRect(0, 0, W, 130); g.fillStyle = '#3a2600'; g.font = FONT(900, 56); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('投げ銭ランキング', W / 2, 68);
  g.globalAlpha = 1 - k; [['1位', 'おぢ'], ['2位', 'おぢ2'], ['3位', '---']].forEach(([a, b], i) => { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(30, 200 + i * 150, W - 60, 120); g.fillStyle = i === 0 ? GOLD : '#fff'; g.font = FONT(900, 60); g.fillText(a + '  ' + b, W / 2, 262 + i * 150); }); g.globalAlpha = 1;
  if (k > 0.5) { g.fillStyle = '#ff8a8a'; g.font = FONT(900, 60); g.fillText('ランキング 終了', W / 2, 760); } };
const scrBank = (k) => (g, W, H) => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a8a5a'; g.fillRect(0, 0, W, 130); g.fillStyle = '#fff'; g.font = FONT(900, 54); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('もしも銀行', W / 2, 68); g.fillStyle = '#333'; g.font = FONT(800, 48); g.fillText('給料日の次の週', W / 2, 260); g.fillStyle = '#e0e4e8'; g.fillRect(60, 380, W - 120, 90); g.fillStyle = '#3a8a5a'; g.fillRect(60, 380, (W - 120) * (0.1 + 0.6 * k), 90); g.fillStyle = '#3a8a5a'; g.font = FONT(900, 70); g.fillText(k > 0.5 ? 'まだ 残ってる' : '', W / 2, 640); };

// ---------- A：おぢの部屋（原点・夜） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#4a4458', floor: '#5a4a40' });
const BED = makeBed({ blanket: '#5a5a7a' }); BED.position.set(-1.6, 0, -1.4); S.add(BED);
const LAMP = new THREE.PointLight(0xffe0b0, 6, 8, 1.4); LAMP.position.set(0.5, 2.6, 1.0); S.add(LAMP);
const PA = bigPhone(0.85);
const sparkA = makeSparkles(160, 0.12, 0xffe08a); S.add(sparkA.points); sparkA.init([[0.55, 1.62, -0.25]], 0.5, 0.8);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const ROCKET_GONE = label('ロケット 消滅', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(ROCKET_GONE);
const nagarenai = label('名前が 流れない', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(nagarenai);
const junban = label('上から 順に', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.8 }); S.add(junban);
const mojidake = label('文字だけ', { w: 512, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.7 }); S.add(mojidake);
const yobareru = label('名前を 呼ばれる', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,90,140,.97)', sx: 1.0 }); S.add(yobareru);
const nokoru = label('初めて 残っている', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.05 }); S.add(nokoru);
const shimei = label('名前を呼ばせる 指名料', { w: 1100, size: 90, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(shimei);

// ---------- B：見るだけの人たち（x=60） ----------
const BX = 60;
flat(16, 10, '#3a3a48', BX, 0); const bWall = box(16, 3.2, 0.2, mat('#4a4a5a')); bWall.position.set(BX, 1.6, -2.6); S.add(bWall);
const VP = VIEWERS.map(() => { const P = makePhone({ w: 0.2, h: 0.4 }); S.add(P.g); return P; });
const yomarenai = label('名前 読まれない', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.0 }); S.add(yomarenai);
const takai = label('高い投げ銭の人だけ', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.2 }); S.add(takai);

// ---------- C：2位のおぢの部屋（x=120） ----------
const CX = 120;
room({ x: CX, w: 7, d: 5, h: 3, wall: '#44485a', floor: '#4a4038' });
const LAMP2 = new THREE.PointLight(0xffe0b0, 6, 8, 1.4); LAMP2.position.set(CX + 0.5, 2.6, 1.0); S.add(LAMP2);
const PC = bigPhone(0.85);
const demo = label('困ったのは おぢだけじゃない', { w: 1200, size: 86, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.45 }); S.add(demo);
const aite = label('競う相手 いない', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(aite);
const kazoeru = label('見に来た人を 数える', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.15 }); S.add(kazoeru);

const PEOPLE = [OJI, OJI2, ...VIEWERS];
const LABELS = [katamaru, ROCKET_GONE, nagarenai, junban, mojidake, yobareru, nokoru, shimei, yomarenai, takai, demo, aite, kazoeru];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); sweat2.userData.set(0);
  [PA, PC, ...VP].forEach(P => P.g.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function holdPhone(p, thumb = 0) { p.userData.arms[1].rotation.set(-1.3 - thumb, 0, 0.25); p.userData.arms[0].rotation.set(-1.1, 0, -0.25); p.userData.head.rotation.x = 0.25; }
function phoneAt(P, x, y, z, ry = 0, s = 1) { P.g.visible = true; P.g.position.set(x, y, z); P.g.rotation.set(0, ry, 0); P.g.scale.setScalar(s); }
const TP = 0.3;
function ojiBase(thumb = 0) { stand(OJI, -0.5, -0.4, 0.3); holdPhone(OJI, thumb); }
function roomCam(u = 0) { look(lerp(0.1, 0.05, u), lerp(1.75, 1.7, u), lerp(4.4, 4.0, u), 0.05, 1.5, -0.5, 50); }
function shot0(t) { // 0秒＝サムネ：スマホの配信画面で、おぢが送った金色のロケットが、パッと消える
  reset(); lift(0); ojiBase(t < TP ? 0.15 : 0); phoneAt(PA, 0.55, 1.45, -0.25, -0.2); const k = t < TP ? 1 : 1 - clamp((t - TP) / 0.15); PA.draw('r' + Math.round(k * 10), scrRocket(k));
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; say(ROCKET_GONE, t, TP + 0.15, -0.35, 0.95, 0.2, 0.75); }
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 送るボタンを押したおぢが、親指を浮かせたまま固まる
  reset(); lift(140); ojiBase(0.15); phoneAt(PA, 0.55, 1.45, -0.25, -0.2); PA.draw('r0', scrRocket(0)); sweatO.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, -0.5, 2.2, -0.4, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.0, -0.2, u), 1.75, lerp(2.8, 2.4, u), -0.05, 1.5, -0.4, 50);
  return S;
}
function sFuman(t, d) { // 見るだけの人たちの不満から。高い投げ銭の人の名前しか、読まれない
  reset(); lift(140); VIEWERS.forEach((p, i) => { stand(p, BX - 1.3 + i * 1.3, -0.8, 0); holdPhone(p); p.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.2, 0.45); p.localToWorld(v); phoneAt(VP[i], v.x, v.y, v.z, 0); VP[i].draw('f', scrFlow); });
  say(takai, t, 0.3, BX, 2.55, -1.0, 1.5); if (t > d * 0.55) say(yomarenai, t, d * 0.55, BX, 2.1, -0.6, 0.9);
  look(BX, 1.9, 5.8, BX, 1.5, -0.8, 50);
  return S;
}
function phoneCam(x, u = 0) { look(x + lerp(0.1, 0.0, u), 1.6, lerp(3.6, 3.3, u), x, 1.55, -0.3, 50); }
function sDay1(t, d) { // 1日目。おぢの名前が、画面に流れない
  reset(); lift(120); phoneAt(PA, 0, 1.4, -0.3, 0, 0.8); PA.draw('flow', scrFlow);
  if (t > d * 0.4) say(nagarenai, t, d * 0.4, 0, 2.5, -0.2, 0.95);
  setHud('投げ銭が消えて', '1日目', 1);
  phoneCam(0, ease(clamp(t / d)));
  return S;
}
function sDay3(t, d) { // 3日目。配信者が、コメントを上から順に読み始める
  reset(); lift(120); phoneAt(PA, 0, 1.4, -0.3, 0, 0.8); const n = Math.min(3, Math.floor(t / d * 4.5)); PA.draw('o' + n, scrOrder(n));
  if (t > d * 0.35) say(junban, t, d * 0.35, 0, 2.5, -0.2, 0.75);
  setHud('投げ銭が消えて', '3日目', 1);
  phoneCam(0, ease(clamp(t / d)));
  return S;
}
function sWeek(t, d) { // 1週間後。おぢは、初めて文字だけでコメントを打つ
  reset(); lift(140); ojiBase(); phoneAt(PA, 0.55, 1.45, -0.25, -0.2); PA.draw('txt', scrText); OJI.userData.arms[1].rotation.x = -1.3 + Math.sin(t * 14) * 0.06;
  if (t > d * 0.4) say(mojidake, t, d * 0.4, -0.3, 2.3, -0.4, 0.65);
  setHud('投げ銭が消えて', '1週間後', 1);
  look(0.1, 1.8, 4.0, 0.05, 1.5, -0.4, 50);
  return S;
}
function oji2Base() { stand(OJI2, CX - 0.5, -0.4, 0.3); holdPhone(OJI2); }
function sDemo(t, d) { // でも、困ったのは、おぢだけじゃなかった
  reset(); lift(140); oji2Base(); phoneAt(PC, CX + 0.55, 1.45, -0.25, -0.2); PC.draw('rk0', scrRank(0));
  if (t > d * 0.35) say(demo, t, d * 0.35, CX, 2.45, -0.4, 1.2);
  look(CX + 0.05, 1.75, 3.6, CX + 0.05, 1.5, -0.4, 50);
  return S;
}
function sNii(t, d) { // ランキングで1位を張り合っていた2位のおぢも、競う相手がいなくなる
  reset(); lift(120); const ph = t / d; const k = easeOut(clamp((ph - 0.45) / 0.2)); phoneAt(PC, CX, 1.4, -0.3, 0, 0.8); PC.draw('rk' + Math.round(k * 10), scrRank(k));
  if (ph > 0.6) say(aite, t, d * 0.6, CX, 2.5, -0.2, 0.95);
  phoneCam(CX, ease(clamp(t / d)));
  return S;
}
function sCount(t, d) { // 配信者は、投げ銭の額じゃなく、見に来てくれた人の数を数え始める
  reset(); lift(120); const k = easeOut(clamp((t - 0.3) / (d * 0.7))); phoneAt(PA, 0, 1.4, -0.3, 0, 0.8); PA.draw('c' + Math.round(k * 16), scrCount(k));
  if (t > d * 0.45) say(kazoeru, t, d * 0.45, 0, 2.5, -0.2, 1.05);
  phoneCam(0, ease(clamp(t / d)));
  return S;
}
function sReply(t, d) { // おぢの文字だけのコメントに、配信者が名前を呼んで返事をする
  reset(); lift(140); ojiBase(); phoneAt(PA, 0.55, 1.45, -0.25, -0.2); PA.draw(t > d * 0.3 ? 'rep' : 'txt', t > d * 0.3 ? scrReply : scrText); OJI.userData.head.rotation.x = t > d * 0.4 ? 0.05 : 0.25;
  if (t > d * 0.45) say(yobareru, t, d * 0.45, -0.2, 2.3, -0.4, 0.9);
  look(0.1, 1.8, 4.0, 0.05, 1.5, -0.4, 50);
  return S;
}
function sBank(t, d) { // 給料日の次の週。おぢの口座に、初めてお金が残っている
  reset(); lift(120); const k = easeOut(clamp((t - 0.3) / (d * 0.5))); phoneAt(PA, 0, 1.4, -0.3, 0, 0.8); PA.draw('b' + Math.round(k * 10), scrBank(k));
  if (t > d * 0.55) say(nokoru, t, d * 0.55, 0, 2.5, -0.2, 1.0);
  setHud('投げ銭が消えて', '給料日の次の週', 1);
  phoneCam(0, ease(clamp(t / d)));
  return S;
}
function sKekka(t, d) { // 結果：投げ銭が消えて、減ったのはおぢの出費で、増えたのはお金を払わない人の名前が呼ばれる回数だった
  reset(); lift(140); const ph = t / d;
  if (ph < 0.5) { ojiBase(); phoneAt(PA, 0.55, 1.45, -0.25, -0.2); PA.draw('rep', scrReply); setTop('結果', 'おぢの出費が 減った', fade(t, 0.3, d * 0.5, 0.25), GOLD); roomCam(0.6); return S; }
  phoneAt(PA, 0, 1.4, -0.3, 0, 0.8); PA.draw('o3', scrOrder(3)); setTop('結果', '呼ばれる名前が 増えた', fade(t, d * 0.5, d, 0.25), GOLD); phoneCam(0, 1);
  return S;
}
function sShimei(t, d) { // 投げ銭は、応援じゃなく、名前を呼んでもらうための、指名料だったのかもしれない
  reset(); lift(140); ojiBase(); phoneAt(PA, 0.55, 1.45, -0.25, -0.2); PA.draw('r0', scrRocket(0)); OJI.userData.head.rotation.x = 0.35;
  if (t > d * 0.45) say(shimei, t, d * 0.45, 0.0, 2.35, -0.3, 1.2);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), 1.8, lerp(3.6, 3.0, u), 0.05, 1.55, -0.4, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); ojiBase(0.15); phoneAt(PA, 0.55, 1.45, -0.25, -0.2); PA.draw('r0', scrRocket(0)); roomCam(0); return S; }

const NARR = { '送る': 'おくる', '押した': 'おした', '親指': 'おやゆび', '浮かせた': 'うかせた', '固まる': 'かたまる', '見るだけ': 'みるだけ', '不満': 'ふまん', '高い': 'たかい', '投げ銭': 'なげせん', '名前': 'なまえ', '読まれない': 'よまれない', '1日目': 'いちにちめ', '画面': 'がめん', '流れない': 'ながれない', '3日目': 'みっかめ', '配信者': 'はいしんしゃ', '上から順に': 'うえからじゅんに', '読み始める': 'よみはじめる', '1週間後': 'いっしゅうかんご', '初めて': 'はじめて', '文字だけ': 'もじだけ', '打つ': 'うつ', '困った': 'こまった', '1位': 'いちい', '張り合っていた': 'はりあっていた', '2位': 'にい', '競う相手': 'きそうあいて', '額': 'がく', '見に来てくれた': 'みにきてくれた', '数え始める': 'かぞえはじめる', '呼んで': 'よんで', '返事': 'へんじ', '給料日': 'きゅうりょうび', '次の週': 'つぎのしゅう', '口座': 'こうざ', '残っている': 'のこっている', '結果：': '結果、', '消えて': 'きえて', '減った': 'へった', '出費': 'しゅっぴ', '増えた': 'ふえた', '払わない': 'はらわない', '呼ばれる': 'よばれる', '回数': 'かいすう', '応援': 'おうえん', '指名料': 'しめいりょう', 'ライブ配信': 'ライブはいしん' };
const P = planTimes([
  ['送るボタンを押したおぢが、', (t, d) => sKatamaru(t, 2 * d)],
  ['親指を浮かせたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['見るだけの人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['高い投げ銭の人の名前しか、<br>読まれない。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。おぢの名前が、<br>画面に流れない。', sDay1],
  ['3日目。配信者が、コメントを<br>上から順に読み始める。', sDay3],
  ['1週間後。おぢは、初めて<br>文字だけでコメントを打つ。', sWeek],
  ['でも、困ったのは、<br>おぢだけじゃなかった。', sDemo],
  ['ランキングで1位を<br>張り合っていた2位のおぢも、', (t, d) => sNii(t, 2 * d)],
  ['競う相手がいなくなる。', (t, d) => sNii(t + d, 2 * d)],
  ['配信者は、投げ銭の額じゃなく、', (t, d) => sCount(t, 2 * d)],
  ['見に来てくれた人の数を<br>数え始める。', (t, d) => sCount(t + d, 2 * d)],
  ['おぢの文字だけのコメントに、', (t, d) => sReply(t, 2 * d)],
  ['配信者が名前を呼んで<br>返事をする。', (t, d) => sReply(t + d, 2 * d)],
  ['給料日の次の週。おぢの口座に、<br>初めてお金が残っている。', sBank],
  ['結果：投げ銭が消えて、<br>減ったのはおぢの出費で、', (t, d) => sKekka(t, 2 * d)],
  ['増えたのはお金を払わない人の<br>名前が呼ばれる回数だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['投げ銭は、応援じゃなく、', (t, d) => sShimei(t, 3 * d)],
  ['名前を呼んでもらうための、', (t, d) => sShimei(t + d, 3 * d)],
  ['指名料だったのかもしれない。', (t, d) => sShimei(t + 2 * d, 3 * d)],
  ['ライブ配信の投げ銭、<br>したことある？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0739',
    v2: true,
    tt: 'main',
    hookLine: 'スマホの配信画面で、おぢが送った金色のロケットが、パッと消える。',
    series: '沼が消えたら',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしもライブ配信から、投げ銭が消えたら？',
    titleHtml: 'もしもライブ配信<br>から、投げ銭が<br>消えたら？',
    mood: 'tension', seed: 739, hits: [TP, P.at(15), P.at(19)], risers: [P.at(7)], impacts: [P.at(9, 0.5), P.at(14, 1.0)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'meter', 0.25], [P.at(4, 0.6), 'whoosh'], [P.at(5, 0.6), 'bubble'], [P.at(9, 0.4), 'alarm'], [P.at(12, 0.6), 'bubble']],
    narr: NARR,
    ask: 'ライブ配信の投げ銭、したことある？',
    caption: 'もしもライブ配信から、投げ銭が消えたら？\n\n送るボタンを押したおぢが、親指を浮かせたまま固まる。\n見るだけの人たちの不満から。高い投げ銭の人の名前しか、読まれない。\n1日目。おぢの名前が、画面に流れない。\n3日目。配信者が、コメントを上から順に読み始める。\n1週間後。おぢは、初めて文字だけでコメントを打つ。\nでも、困ったのは、おぢだけじゃなかった。\nランキングで1位を張り合っていた2位のおぢも、競う相手がいなくなる。\n配信者は、投げ銭の額じゃなく、見に来てくれた人の数を数え始める。\nおぢの文字だけのコメントに、配信者が名前を呼んで返事をする。\n給料日の次の週。おぢの口座に、初めてお金が残っている。\n\n結果：投げ銭が消えて、減ったのはおぢの出費で、増えたのはお金を払わない人の名前が呼ばれる回数だった。\n投げ銭は、応援じゃなく、名前を呼んでもらうための、指名料だったのかもしれない。\n\nライブ配信の投げ銭、したことある？ コメントで教えて。\n\n※風刺ネタです。投げ銭が消えるのは、もしもの設定です。配信アプリ・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', '投げ銭', 'ライブ配信', '沼が消えたら'],
    endStats: [['減ったもの', 'おぢの出費', 'もしもの結果'], ['増えたもの', '呼ばれる名前', 'もしもの結果'], ['投げ銭の正体', '名前を呼ばせる指名料', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
