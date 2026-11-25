import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, poseClear, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable } from '../scenes/home.js';
import { makeDoc, makeMark } from '../scenes/hanko.js';

// もしもSNSから、ステマが消えたら？（皮肉回・台本 S144・社会の消えたら）
// 2026/11/24 ゆうと承認（投稿サーバーで ok）。使ってもいない美容液を 私物です と紹介するインフルエンサーの頭に 広告 の札が出る回。後半で フォロワーを買っていた男のインフルエンサー にも返す
// 数字（一次資料で確認・2026/11/25）：令和5年10月1日からステルスマーケティングは景品表示法違反。規制の対象は商品・サービスを供給する事業者（広告主）で、
//  企業から依頼を受けたインフルエンサー等の第三者は規制の対象とならない（消費者庁 ステルスマーケティングに関する景品表示法違反 のページ）。罰の中身・件数は使わない
// 実在の化粧品・アプリの画面・ロゴ・実在のインフルエンサーは出さない（架空の画面 もしもグラム）。若い女性のフォロワーは笑わない（だまされた側）。肌や体を見せる絵は出さない。フォロワー数の数字は出さない（棒で見せる）

const GOLD = '#ffd27a', RED = '#ff6a6a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#2a2a3a', ground: '#4a4652' }); hemi.intensity = 1.25;
const INF = makeWoman({ shirt: '#f4e4d4', hair: '#8a5a3a', pants: '#e8d8c8' }); S.add(INF); const sweatI = makeSweat(); INF.userData.head.add(sweatI);
const MINF = makeMan({ shirt: '#2a2a2a', hair: '#c8a060', pants: '#3a3a4a' }); S.add(MINF); const sweatM = makeSweat(); MINF.userData.head.add(sweatM);
const FANS = [makeWoman({ shirt: '#a8c8e8', hair: '#2a1a14' }), makeMan({ shirt: '#3f8f6b' }), makeWoman({ shirt: '#e8b0c8', hair: '#3a2018' })]; FANS.forEach(p => S.add(p));
const BOSS = makeSuit({ old: true, bald: true }); S.add(BOSS);
const BOTTLE = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 14), mat('#f2c8d8')); BOTTLE.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10), mat('#d8b070')); c.position.y = 0.16; BOTTLE.add(c); } BOTTLE.position.set(0, -0.68, 0.12); INF.userData.arms[1].add(BOTTLE);
const FONT = (w, px) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;

// ---------- A：撮影部屋（原点） ----------
room({ x: 0, w: 7, d: 5, h: 3, wall: '#f4ece4', floor: '#d8c8b0' });
const RING = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 10, 32), new THREE.MeshBasicMaterial({ color: '#fff8e8' })); S.add(RING);
const RLIGHT = new THREE.PointLight(0xfff4e0, 5, 6, 1.4); S.add(RLIGHT);
const STANDP = box(0.04, 1.4, 0.04, mat('#2a2a2a')); S.add(STANDP);
const PLANT = new THREE.Group(); { const pot = box(0.4, 0.4, 0.4, mat('#e8e0d4')); pot.position.y = 0.2; PLANT.add(pot); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), mat('#6aa86a', { flatShading: true })); lf.position.y = 0.8; PLANT.add(lf); } PLANT.position.set(-1.6, 0, -1.8); S.add(PLANT);
const AD = label('広告', { w: 384, size: 150, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(AD);
const shibutsu = label('私物です♡', { w: 640, size: 110, color: '#d83a6a', bg: 'rgba(255,255,255,.96)', sx: 0.75 }); S.add(shibutsu);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const hensou = label('友だちの声に 見せる変装', { w: 1100, size: 88, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(hensou);

// ---------- B：大きな画面（x=60） ----------
const BX = 60;
flat(20, 12, '#2a2a3a', BX, -2); const BACKB = box(16, 8, 0.2, mat('#22222e')); BACKB.position.set(BX, 4, -4); S.add(BACKB);
const SCR = makePhone({ w: 1.5, h: 3.0, cw: 540, ch: 1080 }); S.add(SCR.g);
function appBar(g, W) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, 110); g.fillStyle = '#d83a6a'; g.font = FONT(900, 46); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('もしもグラム', W / 2, 58); }
function post(name, item, color, ad, k = 1) { return (g, W, H) => { g.fillStyle = '#f4f4f8'; g.fillRect(0, 0, W, H); appBar(g, W);
  g.fillStyle = '#e8dcd4'; g.fillRect(30, 140, W - 60, 400); g.fillStyle = color; g.beginPath(); g.roundRect(W / 2 - 60, 220, 120, 280, 30); g.fill(); g.fillStyle = '#d8b070'; g.fillRect(W / 2 - 35, 180, 70, 45);
  g.fillStyle = '#222'; g.font = FONT(900, 46); g.textAlign = 'left'; g.fillText(name, 40, 590); g.font = FONT(800, 40); g.fillStyle = '#444'; g.fillText(item, 40, 650); g.fillStyle = '#e8506a'; g.font = FONT(900, 44); g.fillText('♡ 本当に良かった', 40, 715);
  if (ad && k > 0) { g.save(); g.translate(W - 130, 250); g.rotate(-0.2); g.scale(k, k); g.fillStyle = '#d8242c'; g.beginPath(); g.roundRect(-110, -60, 220, 120, 20); g.fill(); g.fillStyle = '#fff'; g.font = FONT(900, 80); g.textAlign = 'center'; g.fillText('広告', 0, 6); g.restore(); } }; }
function followers(k) { return (g, W, H) => { g.fillStyle = '#f4f4f8'; g.fillRect(0, 0, W, H); appBar(g, W); g.fillStyle = '#222'; g.font = FONT(900, 52); g.textAlign = 'center'; g.fillText('フォロワー', W / 2, 220);
  const h = lerp(640, 90, k); g.fillStyle = k > 0.5 ? '#9aa0aa' : '#e8506a'; g.fillRect(W / 2 - 110, 900 - h, 220, h); g.fillStyle = '#555'; g.font = FONT(900, 46); if (k > 0.6) g.fillText('本当の数', W / 2, 960); }; }
function feed(k) { return (g, W, H) => { g.fillStyle = '#f4f4f8'; g.fillRect(0, 0, W, H); appBar(g, W); [['広告', '#f2c8d8', true], ['使ってみた 正直', '#c8e0f2', false], ['広告', '#f2e0b0', true], ['自腹で買った', '#d0f0c8', false]].forEach(([t, c, ad], i) => { const y = 140 + i * 230; g.globalAlpha = ad ? 0.45 : 1; g.fillStyle = '#fff'; g.fillRect(30, y, W - 60, 210); g.fillStyle = c; g.fillRect(50, y + 20, 170, 170);
    g.fillStyle = ad ? '#d8242c' : '#222'; g.font = FONT(900, 40); g.textAlign = 'left'; g.fillText(t, 245, y + 70); if (!ad) { g.fillStyle = '#e8506a'; g.font = FONT(900, 40); g.fillText('♡ ' + '♡'.repeat(Math.round(k * 4)), 245, y + 140); } g.globalAlpha = 1; }); }; }

// ---------- C：フォロワーたち（x=120） ----------
const CX = 120;
room({ x: CX, w: 7, d: 5, h: 3, wall: '#e0e4ec', floor: '#a89a88' });
const FP = FANS.map(() => { const P = makePhone({ w: 0.2, h: 0.4 }); S.add(P.g); return P; });
const shinjita = label('本当に良かった を信じた', { w: 1100, size: 88, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.3 }); S.add(shinjita);
const kawaranai = label('何も 変わらない', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(kawaranai);
const atsumaru = label('札のない おすすめへ', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.15 }); S.add(atsumaru);

// ---------- D：会社と法律（x=180） ----------
const DX = 180;
room({ x: DX, w: 8, d: 5, h: 3.2, wall: '#dfe3e8', floor: '#8a8f99' });
const DESK = makeTable({ w: 1.6, d: 0.8, color: '#6a5a48' }); DESK.position.set(DX - 0.6, 0, -0.9); S.add(DESK);
const LAW = makeDoc({ title: 'ステマ規制', rows: ['いつから', 'どの法律', '対象'], head: '#2a3a5a', w: 1.4, h: 1.7 }); LAW.position.set(DX + 0.9, 1.5, -2.38); S.add(LAW);
LAW.userData.fill(0, '2023年10月'); LAW.userData.fill(1, '景品表示法'); LAW.userData.fill(2, '広告主の会社');
const MARK = makeMark('違反'); MARK.scale.setScalar(0.9); MARK.position.set(DX + 1.2, 1.1, -2.3); S.add(MARK);
const ihan = label('違反は 会社のほう', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.05 }); S.add(ihan);
const taishou = label('インフルエンサーは 対象外', { w: 1100, size: 88, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.3 }); S.add(taishou);
const demo = label('札は 彼女だけじゃない', { w: 1000, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.15 }); S.add(demo);
const honto = label('本当の数まで 減る', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.05 }); S.add(honto);

const PEOPLE = [INF, MINF, BOSS, ...FANS];
const LABELS = [AD, shibutsu, katamaru, hensou, shinjita, kawaranai, atsumaru, ihan, taishou, demo, honto];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweatI.userData.set(0); sweatM.userData.set(0);
  [SCR, ...FP].forEach(P => P.g.visible = false); SCR.g.scale.setScalar(0.68); RING.visible = false; STANDP.visible = false; RLIGHT.intensity = 0; BOTTLE.visible = true; MARK.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
function ringAt(x) { x += 0.3; RING.visible = true; RING.position.set(x, 1.65, 0.6); STANDP.visible = true; STANDP.position.set(x, 0.7, 0.6); RLIGHT.intensity = 5; RLIGHT.position.set(x, 1.7, 1.6); }
function infPose(smile = 1) { stand(INF, 0, -0.6, 0); INF.userData.arms[1].rotation.set(-1.9, 0, 0.35); INF.userData.arms[0].rotation.set(-0.2, 0, -0.15); INF.userData.head.rotation.z = 0.08 * smile; }
const TP = 0.3;
function roomCam(u = 0) { look(lerp(0.45, 0.4, u), lerp(1.75, 1.7, u), lerp(4.8, 4.5, u), 0.15, 1.95, -0.6, 50); }
function shot0(t) { // 0秒＝サムネ：私物です と言って美容液をかかげたインフルエンサーの頭の上に、赤い 広告 の札がパッと出る
  reset(); lift(0); infPose(); ringAt(0.9);
  say(shibutsu, t, -1, -0.45, 1.25, 0.0, 0.7);
  if (t >= TP) { say(AD, t, TP, 0.05, 2.3, -0.5, 0.65); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; }
  roomCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 笑顔のまま、インフルエンサーがスマホに向かって固まる
  reset(); lift(140); infPose(); ringAt(0.9); AD.visible = true; AD.position.set(0.05, 2.35, -0.5); AD.userData.size(0.55); sweatI.userData.set(1, t);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, -0.55, 2.0, -0.5, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.4, u), 1.75, lerp(3.4, 3.0, u), 0.1, 1.5, -0.6, 50);
  return S;
}
function fansAt(x0) { FANS.forEach((p, i) => { stand(p, x0 - 1.1 + i * 1.1, -0.8, 0); p.userData.arms[1].rotation.set(-1.3, 0, 0.25); p.userData.arms[0].rotation.set(-1.1, 0, -0.25); p.userData.head.rotation.x = 0.25; p.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.2, 0.45); p.localToWorld(v); FP[i].g.visible = true; FP[i].g.position.copy(v); }); }
function sFuman(t, d) { // フォロワーたちの不満から。本当に良かった を信じて買ったのに、何も変わらない
  reset(); lift(140); fansAt(CX); FP.forEach(P => P.draw('p', post('みき', '愛用の美容液', '#f2c8d8', false)));
  say(shinjita, t, 0.3, CX, 2.55, -0.6, 1.25); if (t > d * 0.55) say(kawaranai, t, d * 0.55, CX, 2.1, -0.3, 0.95);
  look(CX, 1.85, 5.2, CX, 1.5, -0.8, 50);
  return S;
}
function scrCam(u = 0) { look(BX + lerp(0.1, 0, u), 1.7, lerp(3.6, 3.3, u), BX, 1.65, -0.5, 50); }
function sDay(name, item, color, day) { return (t, d) => { reset(); lift(190); SCR.g.visible = true; SCR.g.position.set(BX, 1.7, -0.5); const k = easeOut(clamp((t - d * 0.35) / 0.25)); SCR.draw(day + Math.round(k * 10), post(name, item, color, true, k));
  setHud('ステマが消えて', day, 1); scrCam(ease(clamp(t / d))); return S; }; }
function sDemo(t, d) { // でも、札が出たのは、彼女だけじゃなかった
  reset(); lift(140); stand(MINF, -0.8, -0.6, 0.2); MINF.userData.arms[1].rotation.set(-1.3, 0, 0.25);
  stand(INF, 0.7, -0.6, -0.2); INF.userData.arms[1].rotation.set(-1.2, 0, 0.2); BOTTLE.visible = false;
  if (t > d * 0.35) say(demo, t, d * 0.35, 0, 2.5, -0.6, 1.1);
  look(0, 1.75, 5.0, 0, 1.4, -0.6, 50);
  return S;
}
function sMinf(t, d) { // フォロワーを買っていた男のインフルエンサーは、数字が本当の数まで減る
  reset(); lift(190); const ph = t / d; const k = easeOut(clamp((ph - 0.5) / 0.25));
  SCR.g.visible = true; SCR.g.position.set(BX + 0.45, 1.7, -0.5); SCR.draw('f' + Math.round(k * 20), followers(k));
  stand(MINF, BX - 0.8, -0.2, 0.4); MINF.userData.arms[1].rotation.set(-0.3, 0, 0.2); if (ph > 0.55) sweatM.userData.set(1, t);
  if (ph > 0.7) say(honto, t, d * 0.7, BX - 0.6, 2.45, 0.0, 0.95);
  look(BX, 1.75, 4.2, BX, 1.65, -0.5, 50);
  return S;
}
function lawCam(u = 0) { look(DX + lerp(0.6, 0.4, u), 1.7, lerp(4.4, 4.0, u), DX + 0.3, 1.4, -1.6, 50); }
function sLaw(t, d) { // 実はステマは、2023年10月から法律違反（景品表示法）
  reset(); lift(140); MARK.visible = t > d * 0.55; if (MARK.visible) { const s = easeOut(clamp((t - d * 0.55) / 0.2)); MARK.scale.setScalar(0.9 * (1.6 - 0.6 * s)); }
  setTop('景品表示法（2023年10月〜）', 'ステマは 違反', fade(t, 0.3, d, 0.25), RED);
  lawCam(ease(clamp(t / d)));
  return S;
}
function sTaisho(t, d) { // でも違反になるのは、お金を出した会社のほう。頼まれたインフルエンサーは対象外
  reset(); lift(140); const ph = t / d; MARK.visible = true;
  stand(BOSS, DX - 0.6, -1.6, 0); stand(INF, DX + 1.6, -0.2, -0.3); BOTTLE.visible = true; INF.userData.arms[1].rotation.set(-0.6, 0, 0.1);
  if (ph < 0.5) say(ihan, t, 0.3, DX - 0.6, 2.55, -1.4, 1.0); else { ihan.visible = true; say(taishou, t, d * 0.5, DX + 1.2, 2.3, -0.2, 1.2); }
  setTop('違反になるのは', ph < 0.5 ? '広告を出した会社' : '頼まれた側は 対象外', fade(t, 0.3, d, 0.25), ph < 0.5 ? RED : BLUE);
  look(DX + 0.5, 1.8, 5.2, DX + 0.5, 1.45, -1.0, 50);
  return S;
}
function sGather(t, d) { // 札の出ないおすすめに、フォロワーが集まり始める
  reset(); lift(140); fansAt(CX); const k = easeOut(clamp((t - 0.4) / (d * 0.7))); FP.forEach(P => P.draw('g' + Math.round(k * 4), feed(k)));
  if (t > d * 0.45) say(atsumaru, t, d * 0.45, CX, 2.55, -0.6, 1.1);
  look(CX, 1.85, 5.2, CX, 1.5, -0.8, 50);
  return S;
}
function sKekka(t, d) { // 結果：ステマが消えて、売れなくなったのは、使ってもいないのに 私物です と言っていたおすすめだった
  reset(); lift(190); SCR.g.visible = true; SCR.g.position.set(BX, 1.7, -0.5); SCR.draw('k', post('みき', '私物です♡ 美容液', '#f2c8d8', true, 1));
  setTop('結果', '私物です が売れない', fade(t, 0.3, d, 0.25), GOLD); scrCam(0.5);
  return S;
}
function sHensou(t, d) { // 私物です は、正直な感想じゃなく、広告を、友だちの声に見せるための、変装だったのかもしれない
  reset(); lift(140); infPose(0); ringAt(0.9); AD.visible = true; AD.position.set(0.05, 2.35, -0.5); AD.userData.size(0.55); INF.userData.head.rotation.x = 0.2;
  if (t > d * 0.45) say(hensou, t, d * 0.45, 0.1, 1.15, 0.2, 1.2);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.4, u), 1.75, lerp(4.0, 3.4, u), 0.1, 1.45, -0.6, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); infPose(); ringAt(0.9); AD.visible = true; AD.position.set(0.05, 2.35, -0.5); AD.userData.size(0.65); roomCam(0); return S; }

const NARR = { '笑顔': 'えがお', '固まる': 'かたまる', '不満': 'ふまん', '本当に良かった': 'ほんとうによかった', '信じて': 'しんじて', '買った': 'かった', '何も': 'なにも', '変わらない': 'かわらない', '月曜': 'げつよう', '愛用': 'あいよう', '化粧水': 'けしょうすい', '広告': 'こうこく', '札': 'ふだ', '水曜': 'すいよう', '正直': 'しょうじき', '金曜': 'きんよう', '毎日': 'まいにち', '飲んでる': 'のんでる', '出た': 'でた', '彼女': 'かのじょ', '男': 'おとこ', '数字': 'すうじ', '本当の数': 'ほんとうのかず', '減る': 'へる', '実は': 'じつは', '2023年10月': 'にせんにじゅうさんねんじゅうがつ', '法律違反': 'ほうりついはん', '違反': 'いはん', 'お金': 'おかね', '会社': 'かいしゃ', '頼まれた': 'たのまれた', '対象外': 'たいしょうがい', '集まり始める': 'あつまりはじめる', '結果：': '結果、', '売れなくなった': 'うれなくなった', '使って': 'つかって', '私物': 'しぶつ', '言っていた': 'いっていた', '感想': 'かんそう', '友だち': 'ともだち', '声': 'こえ', '見せる': 'みせる', '変装': 'へんそう', '失敗': 'しっぱい' };
const P = planTimes([
  ['笑顔のまま、インフルエンサーが', (t, d) => sKatamaru(t, 2 * d)],
  ['スマホに向かって固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['フォロワーたちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['本当に良かった を信じて<br>買ったのに、何も変わらない。', (t, d) => sFuman(t + d, 2 * d)],
  ['月曜。愛用の化粧水 にも、<br>広告 の札。', sDay('みき', '愛用の化粧水', '#c8e0f2', '月曜')],
  ['水曜。正直レビュー にも、<br>広告 の札。', sDay('みき', '正直レビュー', '#f2e0b0', '水曜')],
  ['金曜。毎日飲んでるサプリ にも、<br>広告 の札。', sDay('みき', '毎日飲んでるサプリ', '#d0f0c8', '金曜')],
  ['でも、札が出たのは、<br>彼女だけじゃなかった。', sDemo],
  ['フォロワーを買っていた<br>男のインフルエンサーは、', (t, d) => sMinf(t, 2 * d)],
  ['数字が本当の数まで減る。', (t, d) => sMinf(t + d, 2 * d)],
  ['実はステマは、2023年10月から<br>法律違反（景品表示法）。', sLaw],
  ['でも違反になるのは、<br>お金を出した会社のほう。', (t, d) => sTaisho(t, 2 * d)],
  ['頼まれたインフルエンサーは<br>対象外。', (t, d) => sTaisho(t + d, 2 * d)],
  ['札の出ないおすすめに、<br>フォロワーが集まり始める。', sGather],
  ['結果：ステマが消えて、<br>売れなくなったのは、', (t, d) => sKekka(t, 2 * d)],
  ['使ってもいないのに 私物です<br>と言っていたおすすめだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['私物です は、<br>正直な感想じゃなく、', (t, d) => sHensou(t, 3 * d)],
  ['広告を、友だちの声に<br>見せるための、', (t, d) => sHensou(t + d, 3 * d)],
  ['変装だったのかもしれない。', (t, d) => sHensou(t + 2 * d, 3 * d)],
  ['インフルエンサーのおすすめで<br>買って、失敗したことある？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0745',
    v2: true,
    tt: 'main',
    hookLine: '私物です と言って美容液をかかげたインフルエンサーの頭の上に、赤い 広告 の札がパッと出る。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: 'テクノロジー・ネット',
    title: 'もしもSNSから、ステマが消えたら？',
    titleHtml: 'もしもSNSから、<br>ステマが<br>消えたら？',
    mood: 'mystery', seed: 745, hits: [TP, P.at(14), P.at(18)], risers: [P.at(7)], impacts: [P.at(10, 0.6), P.at(11, 0.3), P.at(12, 0.3)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.8), 'alarm'], [P.at(5, 0.8), 'alarm'], [P.at(6, 0.8), 'alarm'], [P.at(9, 0.4), 'poof'], [P.at(13, 0.6), 'bubble']],
    narr: NARR,
    ask: 'インフルエンサーのおすすめで買って、失敗したことある？',
    caption: 'もしもSNSから、ステマが消えたら？\n\n笑顔のまま、インフルエンサーがスマホに向かって固まる。\nフォロワーたちの不満から。本当に良かった を信じて買ったのに、何も変わらない。\n月曜。愛用の化粧水 にも、広告 の札。\n水曜。正直レビュー にも、広告 の札。\n金曜。毎日飲んでるサプリ にも、広告 の札。\nでも、札が出たのは、彼女だけじゃなかった。\nフォロワーを買っていた男のインフルエンサーは、数字が本当の数まで減る。\n実はステマは、2023年10月から法律違反（景品表示法）。\nでも違反になるのは、お金を出した会社のほう。頼まれたインフルエンサーは対象外。\n札の出ないおすすめに、フォロワーが集まり始める。\n\n結果：ステマが消えて、売れなくなったのは、使ってもいないのに 私物です と言っていたおすすめだった。\n私物です は、正直な感想じゃなく、広告を、友だちの声に見せるための、変装だったのかもしれない。\n\nインフルエンサーのおすすめで買って、失敗したことある？ コメントで教えて。\n\n※風刺ネタです。ステマが消えるのは、もしもの設定です。アプリ・商品・登場する人物は架空です\n出典：消費者庁 ステルスマーケティングに関する景品表示法違反（令和5年10月1日から。規制の対象は広告主の事業者で、依頼を受けたインフルエンサー等の第三者は対象外）',
    hashtags: ['もしもラボ', 'もしも', 'ステマ', 'インフルエンサー', '社会の消えたら'],
    endStats: [['ステマ規制', '2023年10月〜', '景品表示法・消費者庁'], ['違反になるのは', '広告を出した会社', '消費者庁'], ['私物です の正体', '広告の変装', 'かもしれない']],
    sources: '出典：消費者庁 ステルスマーケティングに関する景品表示法違反<br>※風刺ネタです（アプリ・商品・人物は架空）',
  },
});
