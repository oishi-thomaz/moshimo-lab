import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, makeSweat, poseSit, makeDeskIsland, makeMeetingRoom } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしもSNSから、匿名が消えたら？（皮肉回・台本 S114・社会の消えたら）
// 2026/11/18 ゆうと承認（投稿サーバーで ok）。迷惑をかける側（クソリプおじさん）が自分の顔を見て止まる回。後半で裏垢で愚痴る若手に返す両叩き
// 数字は使わない（誹謗中傷の相談件数は出さない）。実在のSNS・アプリのロゴ・画面の配色・実在の人物の投稿は出さない（架空の画面）
// 実名や顔をさらすことをよいこととして描かない（自分の名前が出るだけ）。悪口の文面は まずそう・説教 程度にとどめる。名前は架空

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#d8d4e0', ground: '#9a98a8' }); hemi.intensity = 1.3;
const OJI = makeOji(rng(14), { shirt: '#7a6a55', bald: true }); S.add(OJI);
const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const OPHONE = box(0.09, 0.17, 0.02, mat('#15161c')); OPHONE.position.set(0, -0.66, 0.08); OJI.userData.arms[1].add(OPHONE);
const WAKATE = makeMan({ shirt: '#e8e4dc', hair: '#3a2a1e', pants: '#3a3f4e' }); S.add(WAKATE);
const sweatW = makeSweat(); WAKATE.userData.head.add(sweatW);
const WPHONE = box(0.09, 0.17, 0.02, mat('#15161c')); WPHONE.position.set(0, -0.66, 0.08); WAKATE.userData.arms[1].add(WPHONE);
const BOSS = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2', old: true }); S.add(BOSS);

// 大きなスマホ（架空のSNSの画面）
const BIG = makePhone({ w: 1.25, h: 2.45, cw: 540, ch: 1060 }); S.add(BIG.g);
const F = (px, w = 900) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
function anonIcon(g, x, y, r) { g.fillStyle = '#b8bcc8'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#e8eaf0'; g.beginPath(); g.arc(x, y - r * 0.2, r * 0.38, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y + r * 0.62, r * 0.62, r * 0.4, 0, Math.PI, 0); g.fill(); }
function faceIcon(g, x, y, r) { g.fillStyle = '#f0d0b0'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#9a9a9a'; g.fillRect(x - r * 0.95, y - r * 0.5, r * 0.25, r * 0.6); g.fillRect(x + r * 0.7, y - r * 0.5, r * 0.25, r * 0.6); g.fillStyle = '#1a1a1a'; g.fillRect(x - r * 0.38, y - r * 0.15, r * 0.16, r * 0.24); g.fillRect(x + r * 0.22, y - r * 0.15, r * 0.16, r * 0.24); g.fillStyle = '#2a2220'; g.fillRect(x - r * 0.3, y + r * 0.32, r * 0.6, r * 0.1); }
function header(g, w) { g.fillStyle = '#f4f5f8'; g.fillRect(0, 0, w, 1060); g.fillStyle = '#5a5e8a'; g.fillRect(0, 0, w, 90); g.fillStyle = '#fff'; g.font = F(46); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('もしもSNS（架空）', w / 2, 47); }
function post(g, w, y, who, body, pic) { g.fillStyle = '#fff'; rr(g, 16, y, w - 32, pic ? 330 : 190, 18); anonIcon(g, 70, y + 56, 34); g.fillStyle = '#2a2e38'; g.textAlign = 'left'; g.font = F(34); g.fillText(who, 120, y + 52); g.font = F(34, 700); g.fillText(body, 40, y + 130); if (pic) { g.fillStyle = pic; rr(g, 40, y + 170, w - 80, 140, 14); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, y + 240, 50, 0, 7); g.fill(); g.fillStyle = '#e88a3a'; g.beginPath(); g.arc(w / 2, y + 240, 34, 0, 7); g.fill(); } }
function replyBox(g, w, y, face, text, del) {
  g.fillStyle = '#fff'; rr(g, 16, y, w - 32, 300, 18); if (face) faceIcon(g, 80, y + 70, 48); else anonIcon(g, 80, y + 70, 48);
  g.fillStyle = face ? '#c8242c' : '#6a7080'; g.textAlign = 'left'; g.font = F(face ? 42 : 36); g.fillText(face ? '田中 一郎（実名）' : 'ななしさん', 145, y + 72);
  g.fillStyle = '#2a2e38'; g.font = F(52); g.fillText(text, 40, y + 190); if (del) { g.strokeStyle = '#c8242c'; g.lineWidth = 8; g.beginPath(); g.moveTo(36, y + 190); g.lineTo(60 + g.measureText(text).width, y + 190); g.stroke(); }
  g.fillStyle = '#5a5e8a'; rr(g, w - 200, y + 230, 160, 52, 26); g.fillStyle = '#fff'; g.font = F(32); g.textAlign = 'center'; g.fillText('送信', w - 120, y + 257);
}
function scr(mode, a = {}) {
  const key = mode + JSON.stringify(a);
  BIG.draw(key, (g, w, h) => {
    header(g, w);
    if (mode === 'reply') { post(g, w, 110, a.who || '料理好き', a.body || '今日の晩ごはん', a.pic); replyBox(g, w, 480, a.face, a.text || '', a.del); }
    if (mode === 'like') { post(g, w, 110, '旅行好き', '初めての一人旅', '#7fc8e8'); g.fillStyle = '#fff'; rr(g, 16, 470, w - 32, 140, 18); g.fillStyle = '#e85a7a'; g.font = F(96); g.textAlign = 'center'; g.fillText('♥', w / 2 - 70, 545); g.fillStyle = '#2a2e38'; g.font = F(48); g.fillText('いいね', w / 2 + 70, 545); faceIcon(g, 80, 700, 40); g.fillStyle = '#c8242c'; g.font = F(36); g.textAlign = 'left'; g.fillText('田中 一郎（実名）', 135, 702); }
    if (mode === 'ura') { g.fillStyle = '#fff'; rr(g, 16, 110, w - 32, 340, 18); faceIcon(g, 80, 175, 46); g.fillStyle = '#c8242c'; g.font = F(38); g.textAlign = 'left'; g.fillText(a.real ? '佐藤 健太（実名）' : '会社やめたい垢', 140, 178); g.fillStyle = '#2a2e38'; g.font = F(46); g.fillText('うちの上司、', 40, 290); g.fillText('ほんとに無理…', 40, 360); if (!a.real) { g.fillStyle = '#3a3e4a'; g.beginPath(); g.arc(80, 175, 48, 0, 7); g.fill(); } }
    if (mode === 'quiet') { for (let i = 0; i < 4; i++) { g.fillStyle = '#fff'; rr(g, 16, 110 + i * 230, w - 32, 200, 18); anonIcon(g, 70, 165 + i * 230, 30); g.fillStyle = '#c8ccd4'; rr(g, 120, 150 + i * 230, 260, 26, 10); rr(g, 40, 220 + i * 230, w - 120, 26, 10); } g.fillStyle = '#9aa0aa'; g.font = F(40); g.textAlign = 'center'; g.fillText('新しい返信は ありません', w / 2, 1010); }
    if (mode === 'thanks') { post(g, w, 110, '道案内した人', '駅で迷ってた人を案内した', null); replyBox(g, w, 340, true, 'ありがとう', false); }
  });
}

// ---------- A：夜の居間（原点） ----------
room({ x: 0, w: 9, d: 7, h: 3.0, wall: '#d8d0c4', floor: '#8a7a68' });
const SOFA = new THREE.Group(); { const b = box(2.2, 0.45, 0.9, mat('#5a6a8a')); b.position.y = 0.22; SOFA.add(b); const bk = box(2.2, 0.6, 0.2, mat('#4a5a7a')); bk.position.set(0, 0.7, -0.4); SOFA.add(bk); } SOFA.position.set(-0.4, 0, -1.6); S.add(SOFA);
const LAMP = new THREE.PointLight(0xffd8a0, 2.2, 8, 1.5); LAMP.position.set(-1.6, 2.4, 0); S.add(LAMP);
const pa = label('パッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(pa);
const jitsumei = label('実名になった', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(jitsumei);
const sparkA = makeSparkles(90, 0.05, 0xffffff); S.add(sparkA.points); sparkA.init([[0.3, 1.9, 0.6]], 0.5, 0.6);
const iitai = label('顔が見えないと 言いたい放題', { w: 1200, size: 88, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.75 }); S.add(iitai);
const VICT = [makeWoman({ shirt: '#e8a0b8', hair: '#3a2620' }), makeMan({ shirt: '#7aa0c8', hair: '#2a2220' }), makeWoman({ shirt: '#9ad0a0', hair: '#5a3a28' })]; VICT.forEach(p => S.add(p));
const TSU = ['1通目', '2通目', '3通目'].map(s => { const l = label(s, { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(l); return l; });

// ---------- B：若手の机（x=60） ----------
const BX = 60;
room({ x: BX, w: 9, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(BX, 0, -0.8); S.add(ISL);
const demo = label('名前が出たのは おぢだけじゃない', { w: 1300, size: 84, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.85 }); S.add(demo);
const uraaka = label('裏垢も 実名', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(uraaka);

// ---------- C：会議室（x=120） ----------
const CX = 120;
const MR = makeMeetingRoom(); MR.position.set(CX, 0, 0); S.add(MR);
const soudan = label('相談の時間 ください', { w: 1000, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(soudan);

// ---------- 結果・ひねり ----------
const shizuka = label('なぜか 静か', { w: 640, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.85 }); S.add(shizuka);
const ienai = label('顔を出しては 言えない言葉', { w: 1200, size: 88, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.7 }); S.add(ienai);
const fukumen = label('匿名のアイコン ＝ 覆面', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(fukumen);
const MASK = new THREE.Group(); { const m = box(0.46, 0.22, 0.06, mat('#2a2e38')); MASK.add(m); for (const s of [-1, 1]) { const h = box(0.1, 0.05, 0.07, mat('#f4f4f2')); h.position.set(s * 0.1, 0.02, 0.01); MASK.add(h); } } S.add(MASK);

const LABELS = [pa, jitsumei, iitai, demo, uraaka, soudan, shizuka, ienai, fukumen, ...TSU];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; }
function reset() {
  [OJI, WAKATE, BOSS, ...VICT].forEach(clearP); LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); sweatW.userData.set(0);
  BIG.g.visible = false; BIG.g.rotation.set(0, 0, 0); BIG.g.scale.setScalar(1); MASK.visible = false; OPHONE.visible = true; WPHONE.visible = true;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function ojiSofa() { OJI.visible = true; OJI.position.set(-0.4, 0.05, -1.45); OJI.rotation.y = 0.15; poseSit(OJI); OJI.position.y += 0.06; OJI.userData.arms[1].rotation.set(-1.25, 0, 0.15); OJI.userData.head.rotation.x = 0.3; }
function bigAt(x, y, z, s, ry = -0.1) { BIG.g.visible = true; BIG.g.position.set(x, y, z); BIG.g.scale.setScalar(s); BIG.g.rotation.y = ry; }
function sofaCam(u = 0) { look(lerp(0.4, 0.3, u), 1.75, lerp(4.4, 4.0, u), 0.05, 1.42, -1.0, 50); }
function shot0(t) { // 0秒＝サムネ：クソリプを送った瞬間、おじさんのアイコンが、本人の顔写真と実名にパッと変わる
  reset(); lift(0); ojiSofa(); const on = t > TP;
  scr('reply', { pic: '#f4d8a8', text: 'まずそう', face: on }); bigAt(0.45, 1.12, 0.6, 0.5);
  if (on) { sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(pa, t, TP, 0.75, 1.82, 0.8, 0.34); }
  if (t > TP + 0.4) say(jitsumei, t, TP + 0.4, 0.45, 0.32, 0.8, 0.65);
  sofaCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // スマホに映った自分の顔を見て、おじさんが親指を止めたまま固まる
  reset(); lift(150); ojiSofa(); OJI.userData.arms[1].rotation.set(-1.45, 0, 0.1); if (t > d * 0.4) sweatO.userData.set(1, t); OJI.userData.head.rotation.x = 0.15;
  scr('reply', { pic: '#f4d8a8', text: 'まずそう', face: true }); bigAt(0.35, 1.45, -0.2, 0.42, -0.2);
  const u = ease(clamp(t / d)); look(lerp(0.5, 0.35, u), 1.6, lerp(2.4, 2.0, u), -0.1, 1.3, -1.0, 50);
  return S;
}
function sIitai(t, d) { // リプを送られた人たちの不満から。顔が見えないと思って、言いたい放題
  reset(); lift(150); VICT.forEach((p, i) => { p.visible = true; p.position.set(-1.3 + i * 1.3, 0, -1.0 - (i === 1 ? 0.3 : 0)); p.rotation.y = (i - 1) * -0.25; p.userData.arms[1].rotation.set(-1.2, 0, 0.1); p.userData.head.rotation.x = 0.2; });
  if (t > d * 0.3) say(iitai, t, d * 0.3, 0, 2.45, -1.1, 1.45);
  look(0.1, 1.85, 4.2, 0, 1.4, -1.1, 50);
  return S;
}
function phoneCam(u = 0) { look(lerp(0.15, 0.05, u), 1.45, lerp(2.2, 2.0, u), 0.05, 1.42, 0.3, 50); }
function sTsu(i, t, d) {
  reset(); lift(225); ojiSofa(); bigAt(-0.05, 1.42, 0.3, 0.3, 0);
  const k = clamp((t - 0.2) / (d * 0.45)); const del = t > d * 0.7;
  if (i === 0) { const s = 'まずそう'; scr('reply', { pic: '#f4d8a8', text: del ? '' : s.slice(0, Math.ceil(k * s.length)), face: true }); }
  if (i === 1) { const s = '最近の若者は…'; scr('reply', { who: '新社会人', body: '初めてのお給料！', pic: null, text: del ? '' : s.slice(0, Math.ceil(k * s.length)), face: true }); }
  if (i === 2) scr('like');
  say(TSU[i], t, 0.1, 0.27, 1.74, 0.5, 0.15);
  setHud('匿名が消えて', ['1通目', '2通目', '3通目'][i], 1);
  phoneCam(ease(clamp(t / d)));
  return S;
}
function deskW() { const st = ISL.userData.seats[1]; WAKATE.visible = true; WAKATE.position.set(BX + st.x, 0, -0.8 + st.z); WAKATE.rotation.y = 0; poseSit(WAKATE); WAKATE.userData.arms[1].rotation.set(-1.35, 0, 0.1); WAKATE.userData.arms[0].rotation.set(-1.1, 0, 0); WAKATE.userData.head.rotation.x = 0.3; return st; }
function sDemo(t, d) { // でも、名前が出たのは、クソリプおじさんだけじゃなかった
  reset(); lift(150); const st = deskW();
  if (t > d * 0.4) say(demo, t, d * 0.4, BX + st.x, 2.2, -0.8 + st.z, 1.55);
  const u = ease(clamp(t / d)); look(BX + st.x + lerp(1.4, 0.5, u), lerp(2.4, 2.0, u), -0.8 + st.z + lerp(5.2, 4.0, u), BX + st.x, 1.35, -0.8 + st.z, 50);
  return S;
}
function sUra(t, d) { // 裏垢で会社の愚痴を書いていた若手の名前も、出る
  reset(); lift(230); const st = deskW(); const real = t > d * 0.5; if (real) sweatW.userData.set(1, t);
  scr('ura', { real }); bigAt(BX + st.x + 0.6, 1.5, -0.8 + st.z + 0.9, 0.36, -0.15);
  if (real) { el.flash.style.opacity = t < d * 0.5 + 0.08 ? 0.2 : 0; say(uraaka, t, d * 0.5, BX + st.x + 0.1, 2.2, -0.8 + st.z + 0.3, 0.9); }
  look(BX + st.x + 0.35, 1.75, -0.8 + st.z + 3.8, BX + st.x + 0.25, 1.5, -0.8 + st.z, 50);
  return S;
}
function sSoudan(t, d) { // 若手は愚痴を書く代わりに、上司に相談の時間を取ってもらう
  reset(); lift(150); WAKATE.visible = true; WAKATE.position.set(CX - 0.7, 0, -0.6); WAKATE.rotation.y = 0.9; WAKATE.userData.arms[1].rotation.set(-0.6, 0, 0.2); WPHONE.visible = false;
  BOSS.visible = true; BOSS.position.set(CX + 0.7, 0, -0.9); BOSS.rotation.y = -0.9; BOSS.userData.head.rotation.x = 0.1;
  if (t > d * 0.35) say(soudan, t, d * 0.35, CX - 0.4, 2.35, -0.6, 1.2);
  look(CX + 0.1, 1.8, 3.6, CX, 1.3, -0.8, 50);
  return S;
}
function sShizuka(t, d) { // 1か月後。タイムラインが、なぜか静かになる
  reset(); lift(225); ojiSofa(); scr("quiet"); bigAt(-0.05, 1.42, 0.3, 0.3, 0);
  if (t > d * 0.45) say(shizuka, t, d * 0.45, 0.24, 1.74, 0.5, 0.2);
  setHud('匿名が消えて', '1か月後', 1);
  phoneCam(ease(clamp(t / d)));
  return S;
}
function sArigatou(t, d) { // おじさんは実名のまま、初めて知らない人に ありがとう と送る
  reset(); lift(150); ojiSofa(); OJI.userData.head.rotation.x = 0.2; scr('thanks'); bigAt(0.4, 1.4, -0.2, 0.42, -0.2);
  look(0.5, 1.7, 2.6, 0.0, 1.35, -0.8, 50);
  return S;
}
function sKekka(t, d) { // 結果：匿名が消えて、減ったのは言いたいことじゃなく、顔を出しては言えない言葉だった
  reset(); lift(150); ojiSofa(); OPHONE.visible = true; OJI.userData.head.rotation.x = 0.1; scr('quiet'); bigAt(0.6, 1.35, -0.3, 0.38, -0.25);
  if (t > d * 0.55) say(ienai, t, d * 0.55, 0.05, 2.45, -1.0, 1.55);
  setTop('結果', '言えない言葉が 減った', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.5, u), lerp(1.8, 2.0, u), lerp(3.4, 4.2, u), 0.05, 1.3, -1.0, 50);
  return S;
}
function sFukumen(t, d) { // 匿名のアイコンは、ふだん言えないことを言うための、覆面だったのかもしれない
  reset(); lift(150); ojiSofa(); OJI.userData.head.rotation.x = 0.0; const k = clamp((t - d * 0.35) / 0.4);
  MASK.visible = k > 0; OJI.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.78 + (1 - easeOut(k)) * 0.5, 0.2); OJI.localToWorld(v); MASK.position.copy(v); MASK.rotation.y = OJI.rotation.y;
  if (k > 0.5) say(fukumen, t, d * 0.35 + 0.2, -0.3, 2.5, -1.2, 1.45);
  look(0.0, 1.7, 2.6, -0.3, 1.45, -1.3, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); ojiSofa(); scr('reply', { pic: '#f4d8a8', text: 'まずそう', face: true }); bigAt(0.45, 1.12, 0.6, 0.5); sofaCam(0); return S; }

const NARR = { 'スマホ': 'スマホ', '映った': 'うつった', '自分': 'じぶん', '顔': 'かお', '見て': 'みて', '親指': 'おやゆび', '止めた': 'とめた', '固まる': 'かたまる', '送られた': 'おくられた', '人たち': 'ひとたち', '不満': 'ふまん', '見えない': 'みえない', '思って': 'おもって', '言いたい放題': 'いいたいほうだい', '1通目': 'いっつうめ', '料理': 'りょうり', '写真': 'しゃしん', '書きかけて': 'かきかけて', '消す': 'けす', '2通目': 'にとおめ', '若い人': 'わかいひと', '投稿': 'とうこう', '説教': 'せっきょう', '3通目': 'さんつうめ', '結局': 'けっきょく', '押す': 'おす', '名前': 'なまえ', '出た': 'でた', '裏垢': 'うらあか', '会社': 'かいしゃ', '愚痴': 'ぐち', '書いていた': 'かいていた', '若手': 'わかて', '出る': 'でる', '書く': 'かく', '代わりに': 'かわりに', '上司': 'じょうし', '相談': 'そうだん', '時間': 'じかん', '取って': 'とって', '1か月後': 'いっかげつご', '静か': 'しずか', '実名': 'じつめい', '初めて': 'はじめて', '知らない人': 'しらないひと', '送る': 'おくる', '結果：': '結果、', '匿名': 'とくめい', '消えて': 'きえて', '減った': 'へった', '言いたいこと': 'いいたいこと', '出しては': 'だしては', '言えない': 'いえない', '言葉': 'ことば', '言う': 'いう', '覆面': 'ふくめん', 'クソリプ': 'クソリプ' };
const P = planTimes([
  ['スマホに映った<br>自分の顔を見て、', (t, d) => sKatamaru(t, 2 * d)],
  ['おじさんが親指を止めたまま<br>固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['リプを送られた人たちの<br>不満から。', (t, d) => sIitai(t, 2 * d)],
  ['顔が見えないと思って、<br>言いたい放題。', (t, d) => sIitai(t + d, 2 * d)],
  ['1通目。料理の写真に<br>まずそう と書きかけて、', (t, d) => sTsu(0, t, 2 * d)],
  ['消す。', (t, d) => sTsu(0, t + d, 2 * d)],
  ['2通目。若い人の投稿に、<br>説教を書きかけて、消す。', (t, d) => sTsu(1, t, d)],
  ['3通目。結局、<br>いいね だけ押す。', (t, d) => sTsu(2, t, d)],
  ['でも、名前が出たのは、', (t, d) => sDemo(t, 2 * d)],
  ['クソリプおじさんだけ<br>じゃなかった。', (t, d) => sDemo(t + d, 2 * d)],
  ['裏垢で会社の愚痴を書いて<br>いた若手の名前も、出る。', sUra],
  ['若手は愚痴を書く代わりに、', (t, d) => sSoudan(t, 2 * d)],
  ['上司に相談の時間を<br>取ってもらう。', (t, d) => sSoudan(t + d, 2 * d)],
  ['1か月後。タイムラインが、<br>なぜか静かになる。', sShizuka],
  ['おじさんは実名のまま、', (t, d) => sArigatou(t, 2 * d)],
  ['初めて知らない人に<br>ありがとう と送る。', (t, d) => sArigatou(t + d, 2 * d)],
  ['結果：匿名が消えて、', (t, d) => sKekka(t, 3 * d)],
  ['減ったのは<br>言いたいことじゃなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['顔を出しては<br>言えない言葉だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['匿名のアイコンは、ふだん<br>言えないことを言うための、', (t, d) => sFukumen(t, 2 * d)],
  ['覆面だったのかもしれない。', (t, d) => sFukumen(t + d, 2 * d)],
  ['クソリプ、<br>もらったことある？', sAsk],
], { shot0, endCard, start: 2.6, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0707',
    v2: true,
    tt: 'main',
    hookLine: 'クソリプを送った瞬間、おじさんのアイコンが、本人の顔写真と実名にパッと変わる。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: 'テクノロジー・ネット',
    title: 'もしもSNSから、匿名が消えたら？',
    titleHtml: 'もしもSNSから、<br>匿名が<br>消えたら？',
    mood: 'tension', seed: 707, hits: [TP, P.at(16), P.at(20)], risers: [P.at(8)], impacts: [P.at(10, 0.6), P.at(18, 0.4)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'meter', 0.3], [P.at(5, 0.2), 'whoosh'], [P.at(6, 1.4), 'whoosh'], [P.at(7, 0.6), 'bubble'], [P.at(10, 1.0), 'alarm'], [P.at(20, 0.2), 'whoosh']],
    narr: NARR,
    ask: 'クソリプ、もらったことある？',
    caption: 'もしもSNSから、匿名が消えたら？\n\nスマホに映った自分の顔を見て、おじさんが親指を止めたまま固まる。\nリプを送られた人たちの不満から。顔が見えないと思って、言いたい放題。\n1通目。料理の写真に まずそう と書きかけて、消す。\n2通目。若い人の投稿に、説教を書きかけて、消す。\n3通目。結局、いいね だけ押す。\nでも、名前が出たのは、クソリプおじさんだけじゃなかった。\n裏垢で会社の愚痴を書いていた若手の名前も、出る。\n若手は愚痴を書く代わりに、上司に相談の時間を取ってもらう。\n1か月後。タイムラインが、なぜか静かになる。\nおじさんは実名のまま、初めて知らない人に ありがとう と送る。\n\n結果：匿名が消えて、減ったのは言いたいことじゃなく、顔を出しては言えない言葉だった。\n匿名のアイコンは、ふだん言えないことを言うための、覆面だったのかもしれない。\n\nクソリプ、もらったことある？ コメントで教えて。\n\n※風刺ネタです。匿名が消えるのは、もしもの設定です。SNSの画面・名前・登場する人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'クソリプ', 'SNS', '社会の消えたら'],
    endStats: [['消えたもの', 'SNSの匿名', 'もしもの設定'], ['減ったもの', '顔を出しては 言えない言葉', 'もしもの結果'], ['匿名のアイコンの正体', '覆面', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
