import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeGlass } from '../scenes/home.js';
import { makeMark } from '../scenes/hanko.js';

// もしもマッチングアプリから既婚者が消えたら？（皮肉回・台本 S88・社会の消えたら）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：マッチングアプリの既婚者（ガルちゃん・はてなで定番の燃えネタ）
// 数字は使わない（既婚者の割合の調査は出さない）。実在のアプリ名・画面・ロゴは出さない（アプリは架空の もしもマッチ、写真は色の四角）
// 男叩き（独身のふりの既婚男）。三段は 1日目 土日に会えない男→3日目 夜の電話に出ない男→1週間後 部屋の写真を見せない男。言い換えは 売約済みの商品

const PINK = '#ff7ab8';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d8ea' }); hemi.intensity = 1.35;
const JOSHI = makeWoman({ shirt: '#f29bbb', hair: '#3a2018', pants: '#4a5a7a' }); S.add(JOSHI);
const KIKON = makeMan({ shirt: '#59606e', hair: '#1d1a19' }); S.add(KIKON); // 独身のふりの既婚の男
const TSUMA = makeWoman({ shirt: '#8fb87a', hair: '#2a1a14', pants: '#3a3f4e' }); S.add(TSUMA);
const DATE = makeMan({ shirt: '#3f8f6b', hair: '#2c2421' }); S.add(DATE); // 残った独身の人
const sweatK = makeSweat(); KIKON.userData.head.add(sweatK);

// 大きなスマホの画面（看板として浮かべる）
const FONT = (w, px) => `${w} ${px}px "Noto Sans CJK JP", sans-serif`;
function bigPhone(w = 1.1) { const P = makePhone({ w, h: w * 2, cw: 540, ch: 1080 }); S.add(P.g); return P; }
function header(g, W, title, col = PINK) { g.fillStyle = col; g.fillRect(0, 0, W, 130); g.fillStyle = '#fff'; g.font = FONT(900, 58); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, W / 2, 68); }
const CARDS = [
  { name: 'ケンタ 34', tag: '独身', col: '#c8d8f0', kikon: true, why: '土日 会えない' },
  { name: 'ユウキ 29', tag: '独身', col: '#d8e8c8', kikon: false },
  { name: 'タクヤ 36', tag: '独身', col: '#f0e0c8', kikon: true, why: '夜 電話NG' },
  { name: 'ショウ 31', tag: '独身', col: '#e0d0f0', kikon: false },
  { name: 'マサト 38', tag: '独身', col: '#f0d0d8', kikon: true, why: '部屋の写真 なし' },
  { name: 'リョウ 33', tag: '独身', col: '#d0ecec', kikon: false },
];
// gone[i]：0..1 で i 枚目が消える（白く抜けて 退会 の灰色に）。showWhy で消える男の特徴の札
function scrCards(gone, { showWhy = -1, likes = null } = {}) {
  return (g, W, H) => {
    g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'もしもマッチ');
    CARDS.forEach((c, i) => {
      const x = 30 + (i % 2) * 245, y = 160 + Math.floor(i / 2) * 290, w = 235, h = 275, k = gone[i] || 0;
      g.globalAlpha = 1 - k * 0.85;
      g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h);
      g.fillStyle = c.col; g.fillRect(x + 12, y + 12, w - 24, 160);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + w / 2, y + 80, 42, 0, 7); g.fill(); g.fillRect(x + w / 2 - 55, y + 125, 110, 47);
      g.fillStyle = '#333'; g.font = FONT(800, 38); g.textAlign = 'center'; g.fillText(c.name, x + w / 2, y + 205);
      g.fillStyle = PINK; g.font = FONT(900, 34); g.fillText(c.tag, x + w / 2, y + 248);
      g.globalAlpha = 1;
      if (k > 0.5) { g.fillStyle = 'rgba(120,124,136,.9)'; g.fillRect(x, y, w, h); g.fillStyle = '#fff'; g.font = FONT(900, 46); g.fillText('退会しました', x + w / 2, y + h / 2); }
      if (showWhy === i && k < 0.5) { g.fillStyle = '#d23a3a'; g.fillRect(x + 6, y + 110, w - 12, 64); g.fillStyle = '#fff'; g.font = FONT(900, 34); g.fillText(c.why, x + w / 2, y + 143); }
    });
    if (likes != null) { g.fillStyle = 'rgba(255,255,255,.96)'; g.fillRect(40, 900, W - 80, 140); g.fillStyle = PINK; g.font = FONT(900, 72); g.fillText('♥ いいね ' + likes, W / 2, 972); }
  };
}
function scrGone() { return (g, W, H) => { g.fillStyle = '#2a2e38'; g.fillRect(0, 0, W, H); header(g, W, 'もしもマッチ', '#6a6e7a'); g.fillStyle = '#fff'; g.font = FONT(900, 56); g.textAlign = 'center'; g.fillText('既婚者のため', W / 2, 440); g.fillText('退会しました', W / 2, 530); g.fillStyle = '#ff6a6a'; g.font = FONT(900, 120); g.fillText('×', W / 2, 720); }; }
function scrHome() { return (g, W, H) => { g.fillStyle = '#e8eef6'; g.fillRect(0, 0, W, H); g.fillStyle = '#9aa6b8'; for (let i = 0; i < 12; i++) { g.fillRect(50 + (i % 3) * 160, 200 + Math.floor(i / 3) * 170, 120, 120); } }; }

// ---------- A：スマホの画面（原点）：プロフィールが消える ----------
flat(30, 20, '#d8cce0', 0, 0);
const PA = bigPhone(1.15);
const sparkA = makeSparkles(160, 0.14, 0xffd0e8); S.add(sparkA.points); sparkA.init([[-0.27, 2.35, 0.1], [0.27, 1.5, 0.1], [-0.27, 0.95, 0.1]], 0.4, 0.8);

// ---------- B：既婚の男の家のリビング（x=60）：隣には妻 ----------
const BX = 60;
const roomB = room({ x: BX, w: 8, d: 5, h: 3, wall: '#efe6d6', floor: '#b48a5e' });
const sofa = new THREE.Group(); { const sm = mat('#6a7a5a'); const a = box(2.6, 0.45, 0.9, sm); a.position.y = 0.23; sofa.add(a); const b = box(2.6, 0.6, 0.25, sm); b.position.set(0, 0.75, -0.35); sofa.add(b); } sofa.position.set(BX, 0, -1.4); S.add(sofa);
const PB = makePhone({ w: 0.2, h: 0.4 }); S.add(PB.g);
const katamaru = label('…！', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.5 }); S.add(katamaru);
const tonari = label('隣には 妻', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(tonari);
const sumaho = label('最近、スマホ見ないね', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.7 }); S.add(sumaho);

// ---------- C：女子の部屋（x=120） ----------
const CX = 120;
const roomC = room({ x: CX, w: 7, d: 5, h: 3, wall: '#f6e6ef', floor: '#c9a27a' });
const deskC = makeTable({ w: 1.4, d: 0.7, h: 0.72, color: '#e8e2d4' }); deskC.position.set(CX, 0, -1.1); S.add(deskC);
const PC = bigPhone(0.95);
const dokushin = label('独身って書いてあったのに', { w: 1100, size: 90, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.0 }); S.add(dokushin);
const yubiwa = label('指輪の跡', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(yubiwa);
// 大きな手（指輪の跡）
const HAND = new THREE.Group(); { const sk = mat('#f1c9a5'); const palm = box(0.9, 0.9, 0.22, sk); HAND.add(palm); for (let i = 0; i < 4; i++) { const f = box(0.17, 0.75, 0.18, sk); f.position.set(-0.32 + i * 0.215, 0.8, 0); HAND.add(f); } const th = box(0.18, 0.5, 0.18, sk); th.position.set(0.55, 0.1, 0.02); th.rotation.z = -0.6; HAND.add(th); const mark = box(0.19, 0.08, 0.2, mat('#fff4e8')); mark.position.set(-0.32 + 1 * 0.215 + 0.215, 0.62, 0.005); HAND.add(mark); } S.add(HAND);
const heru = label('いいね 減った？', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.5 }); S.add(heru);

// ---------- D：土曜の昼のカフェ（x=180） ----------
const DX = 180;
flat(16, 10, '#d8cfc0', DX, 0);
const dWall = box(16, 3.2, 0.2, mat('#f2e8d8')); dWall.position.set(DX, 1.6, -2.6); S.add(dWall);
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.3, 0.05, new THREE.MeshBasicMaterial({ color: '#bfe0f8' })); w.position.set(DX - 4 + i * 4, 1.9, -2.48); S.add(w); }
const cafeT = makeTable({ w: 1.0, d: 0.8, h: 0.72, color: '#b08a63' }); cafeT.position.set(DX, 0, -0.6); S.add(cafeT);
const CUPS = [0, 1].map(i => { const c = makeGlass({ beer: false, h: 0.16 }); c.position.set(DX - 0.25 + i * 0.5, cafeT.userData.topY, -0.6); S.add(c); return c; });
const doyou = label('土曜の昼', { w: 640, size: 110, color: '#fff', bg: 'rgba(240,120,60,.96)', sx: 1.0 }); S.add(doyou);

// ---------- E：見抜く技のノート（x=240） ----------
const EX = 240;
flat(14, 10, '#c9a27a', EX, 0);
const eWall = box(14, 3.2, 0.2, mat('#f6e6ef')); eWall.position.set(EX, 1.6, -2.4); S.add(eWall);
const WAZA = ['土日に会える？', '夜に電話できる？', '部屋の写真ある？', '指輪の跡は？'].map(s => { const l = label('□ ' + s, { w: 1024, size: 92, color: '#2a2e38', bg: 'rgba(255,255,255,.97)', sx: 1.7 }); S.add(l); return l; });
const WAZA_X = WAZA.map(() => { const l = label('不要', { w: 384, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.55 }); S.add(l); return l; });
const wazaT = label('既婚者を見抜く技', { w: 900, size: 100, color: '#fff', bg: 'rgba(255,122,184,.98)', sx: 1.6 }); S.add(wazaT);
const utagau = label('疑う時間 0分', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); S.add(utagau);

// ---------- F：売約済みの商品（x=300） ----------
const FX = 300;
flat(10, 8, '#2a2a3a', FX, 0);
const fWall = box(10, 4, 0.2, mat('#3a3a50')); fWall.position.set(FX, 2, -2.5); S.add(fWall);
const ped = box(1.2, 0.9, 0.9, mat('#e8e2d4')); ped.position.set(FX, 0.45, -0.6); S.add(ped);
const fLight = new THREE.PointLight(0xfff0d0, 14, 8, 1.3); fLight.position.set(FX, 3.0, 1.4); S.add(fLight);
const PF = bigPhone(0.62);
const nefuda = label('独身', { w: 384, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.98)', sx: 0.6 }); S.add(nefuda);
const BAIYAKU = makeMark('売約済', { sub: '' }); S.add(BAIYAKU);
const shohin = label('売約済みの商品', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(shohin);

const PEOPLE = [JOSHI, KIKON, TSUMA, DATE];
const LABELS = [katamaru, tonari, sumaho, dokushin, yubiwa, heru, doyou, ...WAZA, ...WAZA_X, wazaT, utagau, nefuda, shohin];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatK.userData.set(0);
  PA.g.visible = true; PA.g.position.set(0, 1.65, 0); PA.g.rotation.set(0, 0, 0);
  PB.g.visible = false; HAND.visible = false; BAIYAKU.visible = false;
  PC.g.position.set(CX + 0.75, 1.7, -0.9); PC.g.rotation.set(0, -0.3, 0); PF.g.position.set(FX, 1.55, -0.6);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.25;
const G3 = (k) => [k, 0, k, 0, k, 0];
function phoneCam(u = 0) { look(0, lerp(2.4, 2.25, u), lerp(4.1, 3.9, u), 0, lerp(2.25, 2.15, u), 0, 50); }
function listCam(u = 0) { look(0, 1.3, lerp(4.8, 4.5, u), 0, 1.15, 0, 50); }
function shot0(t) { // 0秒＝サムネ：アプリの男性のプロフィールが、何枚かまとめてパッと消える
  reset(); lift(0); const k = clamp((t - TP) / 0.2);
  PA.draw('g' + k.toFixed(2), scrCards(G3(k)));
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  phoneCam(ease(clamp(t / 3)) * 0.4);
  return S;
}
// B：リビング
function livingSet() {
  KIKON.visible = true; KIKON.position.set(BX - 0.45, 0, -1.25); poseSit(KIKON); KIKON.userData.arms[1].rotation.set(-1.2, 0, 0.25); KIKON.userData.head.rotation.x = 0.3;
  TSUMA.visible = true; TSUMA.position.set(BX + 0.55, 0, -1.25); poseSit(TSUMA); TSUMA.userData.head.rotation.y = 0;
  KIKON.updateMatrixWorld(); KIKON.userData.arms[0].rotation.set(-1.2, 0, -0.25); const v = new THREE.Vector3(0.0, 1.3, 0.68); KIKON.localToWorld(v); PB.g.visible = true; PB.g.position.copy(v); PB.g.rotation.set(-0.5, 0, 0);
}
function sKatamaru(t, d) { // 消えたプロフィールの持ち主。リビングでスマホを持つ手が固まる。隣には妻。
  reset(); lift(120); livingSet(); PB.draw('gone', scrGone()); sweatK.userData.set(clamp(t / 1.5), t);
  if (t > 0.5) say(katamaru, t, 0.5, BX - 0.45, 1.75, -1.25, 0.4);
  if (t > d * 0.55) { say(tonari, t, d * 0.55, BX + 0.25, 1.95, -1.25, 0.9); TSUMA.userData.head.rotation.y = -0.5; }
  const u = ease(clamp(t / d)); look(BX + lerp(-0.2, 0.1, u), 1.55, lerp(1.9, 2.6, u), BX + lerp(-0.4, 0.05, u), 1.0, -1.25, 50);
  return S;
}
function joshiSet() { JOSHI.visible = true; JOSHI.position.set(CX - 0.2, 0, -1.6); poseSit(JOSHI); JOSHI.userData.head.rotation.x = 0.15; JOSHI.userData.arms[1].rotation.set(-1.2, 0, 0.2); }
function sFuman(t, d) { // 女子たちの不満から。独身って書いてあったのに、指に指輪の跡があった。
  reset(); lift(120); PA.g.visible = false; joshiSet(); PC.draw('c0', scrCards([]));
  say(dokushin, t, 0.3, CX + 0.25, 2.55, -1.2, 1.55);
  if (t > d * 0.5) { HAND.visible = true; const k = easeOut(clamp((t - d * 0.5) / 0.5)); PC.g.visible = false; HAND.position.set(CX + 0.7, lerp(0.6, 1.35, k), -0.6); HAND.scale.setScalar(0.5); say(yubiwa, t, d * 0.55, CX + 0.7, 2.1, -0.6, 0.75); }
  const u = ease(clamp(t / d)); look(CX + 0.3, 1.75, lerp(3.4, 3.1, u), CX + 0.3, 1.45, -0.8, 50);
  return S;
}
function stepShot(i, hud) { // 三段：消える男の特徴の札 → そのカードが消える
  return (t, d) => {
    reset(); lift(120); const gone = [0, 0, 0, 0, 0, 0]; const order = [0, 2, 4];
    order.forEach((c, j) => { if (j < i) gone[c] = 1; });
    const k = clamp((t - d * 0.55) / 0.25); gone[order[i]] = k;
    PA.draw('s' + i + k.toFixed(2), scrCards(gone, { showWhy: order[i] }));
    if (k > 0 && k < 1) { sparkA.init([[order[i] % 2 ? 0.27 : -0.27, 2.35 - Math.floor(order[i] / 2) * 0.62, 0.1]], 0.3, 0.6); }
    if (t > d * 0.55) sparkA.set(clamp((t - d * 0.55) / 1.0));
    setHud('アプリから既婚者が消えて', hud, 1);
    listCam(ease(clamp(t / d)));
    return S;
  };
}
function sLikes(t, d) { // 女子は気づく。いいねの数が、なんだか減った。
  reset(); lift(120); PA.g.visible = false; joshiSet();
  const n = Math.round(lerp(48, 31, easeOut(clamp((t - 0.5) / 1.5)))); PC.draw('l' + n, scrCards([1, 0, 1, 0, 1, 0], { likes: n }));
  if (t > d * 0.45) { say(heru, t, d * 0.45, CX - 0.2, 2.2, -1.4, 1.3); JOSHI.userData.head.rotation.z = 0.25; }
  look(CX + 0.4, 1.7, 2.8, CX + 0.5, 1.45, -0.8, 50);
  return S;
}
function sCafe(t, d) { // でも、残った人とは、土曜の昼に会える。
  reset(); lift(120); PA.g.visible = false;
  JOSHI.visible = true; JOSHI.position.set(DX - 0.75, 0, -0.6); JOSHI.rotation.y = Math.PI / 2; poseSit(JOSHI);
  DATE.visible = true; DATE.position.set(DX + 0.75, 0, -0.6); DATE.rotation.y = -Math.PI / 2; poseSit(DATE);
  [JOSHI, DATE].forEach((p, i) => { p.userData.arms[1].rotation.set(-1.0 - 0.15 * Math.sin(t * 3 + i), 0, 0); p.userData.head.rotation.x = -0.05 + 0.05 * Math.sin(t * 2 + i); });
  say(doyou, t, 0.4, DX, 2.1, -0.9, 0.9); setHud('残った人と', '土曜の昼', 1);
  const u = ease(clamp(t / d)); look(DX + lerp(0.3, 0, u), 1.6, lerp(3.2, 2.8, u), DX, 1.0, -0.6, 50);
  return S;
}
function sIppou(t, d) { // 一方、消えた既婚の男たち
  reset(); lift(120); PA.g.visible = false; livingSet(); PB.draw('home', scrHome()); KIKON.userData.head.rotation.x = 0.1;
  const u = ease(clamp(t / d)); look(BX + lerp(1.5, 0.6, u), lerp(2.6, 2.0, u), lerp(4.2, 3.2, u), BX, 1.0, -1.25, 50);
  return S;
}
function sTsuma(t, d) { // 家で妻に聞かれる。最近、スマホ見ないね
  reset(); lift(120); PA.g.visible = false; livingSet(); PB.g.visible = false; KIKON.userData.arms[1].rotation.set(0, 0, 0); KIKON.userData.head.rotation.x = 0;
  TSUMA.userData.head.rotation.y = -0.55; if (t > d * 0.4) { say(sumaho, t, d * 0.4, BX + 0.05, 2.1, -1.25, 1.25); KIKON.userData.head.rotation.y = 0.5; sweatK.userData.set(1, t); }
  look(BX + 0.05, 1.55, 2.9, BX + 0.05, 1.15, -1.25, 50);
  return S;
}
function wazaShot(t, d, kOff = 0) {
  reset(); lift(120); PA.g.visible = false;
  JOSHI.visible = true; JOSHI.position.set(EX + 1.5, 0, -1.0); JOSHI.rotation.y = -0.4;
  say(wazaT, t, 0.2, EX - 0.4, 2.85, -1.5, 1.5);
  WAZA.forEach((l, i) => { say(l, t, 0.4 + i * 0.25, EX - 0.4, 2.25 - i * 0.42, -1.5, 1.5); if (t > d * 0.5 + i * 0.25 - kOff) say(WAZA_X[i], t, d * 0.5 + i * 0.25 - kOff, EX + 0.6, 2.25 - i * 0.42, -1.4, 0.48); });
  look(EX + 0.2, 1.7, 3.6, EX + 0.1, 1.55, -1.3, 50);
  return S;
}
function sWaza(t, d) { return wazaShot(t, d); } // 女子が身につけた 既婚者を見抜く技 が、要らなくなる
function sKekka(t, d) { // 結果：アプリから既婚者が消えて、減ったのはいいねの数じゃなく、女子が疑う時間だった
  reset(); lift(120); PA.g.visible = false; joshiSet(); JOSHI.userData.head.rotation.x = -0.1; JOSHI.userData.arms[0].rotation.set(-0.3, 0, 0.5);
  PC.draw('kekka', scrCards([1, 0, 1, 0, 1, 0]));
  if (t > d * 0.55) say(utagau, t, d * 0.55, CX - 0.2, 2.25, -1.3, 1.2);
  const u = ease(clamp(t / d)); look(CX + lerp(0.6, 0.3, u), 1.75, lerp(3.6, 3.0, u), CX + 0.3, 1.4, -0.9, 50);
  return S;
}
function sBaiyaku(t, d) { // アプリの既婚者は、独身の値札を貼った、売約済みの商品だったのかもしれない
  reset(); lift(120); PA.g.visible = false; PF.g.position.set(FX, 1.55, -0.6); PF.g.rotation.set(0, 0, 0); PF.draw('one', (g, W, H) => { g.fillStyle = '#fff5f9'; g.fillRect(0, 0, W, H); header(g, W, 'プロフィール'); g.fillStyle = '#c8d8f0'; g.fillRect(70, 200, 400, 400); g.fillStyle = '#fff'; g.beginPath(); g.arc(270, 360, 90, 0, 7); g.fill(); g.fillRect(150, 470, 240, 130); g.fillStyle = '#333'; g.font = FONT(800, 60); g.textAlign = 'center'; g.fillText('ケンタ 34', W / 2, 700); });
  say(nefuda, t, 0.3, FX + 0.5, 2.3, -0.4, 0.55);
  if (t > d * 0.35) { BAIYAKU.visible = true; const k = easeOut(clamp((t - d * 0.35) / 0.3)); BAIYAKU.position.set(FX, 1.55, -0.4); BAIYAKU.scale.setScalar(lerp(1.8, 0.75, k)); BAIYAKU.rotation.z = 0.25; }
  const u = ease(clamp(t / d)); look(FX, 1.6, lerp(3.4, 3.0, u), FX, 1.45, -0.6, 50);
  return S;
}
function sAsk(t) { // 冒頭と同じ構図（消えたまま）
  reset(); lift(0); PA.draw('ask', scrCards(G3(1))); phoneCam(0); return S;
}

const NARR = { '既婚者': 'きこんしゃ', '既婚': 'きこん', '妻': 'つま', '隣': 'となり', '女子': 'じょし', '不満': 'ふまん', '独身': 'どくしん', '指輪': 'ゆびわ', '跡': 'あと', '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '土日': 'どにち', '一枚': 'いちまい', '土曜': 'どよう', '昼': 'ひる', '一方': 'いっぽう', '技': 'わざ', '要らなく': 'いらなく', '結果：': '結果、', '値札': 'ねふだ', '売約済み': 'ばいやくずみ', '持ち主': 'もちぬし' };
const P = planTimes([
  ['消えたプロフィールの持ち主。', (t, d) => sKatamaru(t, 3 * d)],
  ['リビングで<br>スマホを持つ手が固まる。', (t, d) => sKatamaru(t + d, 3 * d)],
  ['隣には妻', (t, d) => sKatamaru(t + d * 2, 3 * d)],
  ['女子たちの不満から。<br>独身って書いてあったのに、', (t, d) => sFuman(t, 2 * d)],
  ['指に指輪の跡があった。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。土日に会えない男が、<br>アプリから消える。', stepShot(0, '1日目')],
  ['3日目。夜は電話に<br>出られない男も消える。', stepShot(1, '3日目')],
  ['1週間後。部屋の写真を<br>一枚も見せない男も消える。', stepShot(2, '1週間後')],
  ['女子は気づく。いいねの数が、<br>なんだか減った。', sLikes],
  ['でも、残った人とは、<br>土曜の昼に会える。', sCafe],
  ['一方、消えた既婚の男たち。', sIppou],
  ['家で妻に聞かれる。<br>最近、スマホ見ないね。', sTsuma],
  ['女子が身につけた<br>既婚者を見抜く技が、', (t, d) => sWaza(t, 2 * d)],
  ['要らなくなる。', (t, d) => wazaShot(t + d, 2 * d)],
  ['結果：アプリから<br>既婚者が消えて、', (t, d) => sKekka(t, 3 * d)],
  ['減ったのは<br>いいねの数じゃなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['女子が疑う時間だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['アプリの既婚者は、<br>独身の値札を貼った、', (t, d) => sBaiyaku(t, 2.4 * d)],
  ['売約済みの商品<br>だったのかもしれない。', (t, d) => sBaiyaku(t + d * 1.2, 2.4 * d)],
  ['アプリで既婚者に会ったこと、<br>ある？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0680',
    v2: true,
    tt: 'main',
    hookLine: 'アプリの男性のプロフィールが、何枚かまとめてパッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしもマッチングアプリから既婚者が消えたら？',
    titleHtml: 'もしも<br>マッチングアプリ<br>から既婚者が<br>消えたら？',
    mood: 'tension', seed: 680, hits: [TP, P.at(14), P.at(18)], risers: [P.at(10)], impacts: [P.at(5, 1.9), P.at(6, 1.8), P.at(7, 2.2), P.at(16, 0.3)],
    sfx: [[TP, 'poof'], [P.at(0, 0.5), 'alarm'], [P.at(5, 1.9), 'poof'], [P.at(6, 1.8), 'poof'], [P.at(7, 2.2), 'poof'], [P.at(11, 0.8), 'meter', 0.3], [P.at(13, 0.3), 'whoosh'], [P.at(18, 0.3), 'whoosh']],
    narr: NARR,
    ask: 'アプリで既婚者に会ったこと、ある？',
    caption: 'もしもマッチングアプリから既婚者が消えたら？\n\n消えたプロフィールの持ち主。リビングでスマホを持つ手が固まる。隣には妻。\n女子たちの不満から。独身って書いてあったのに、指に指輪の跡があった。\n1日目。土日に会えない男が、アプリから消える。\n3日目。夜は電話に出られない男も消える。\n1週間後。部屋の写真を一枚も見せない男も消える。\n女子は気づく。いいねの数が、なんだか減った。\nでも、残った人とは、土曜の昼に会える。\n一方、消えた既婚の男たち。家で妻に聞かれる。最近、スマホ見ないね。\n女子が身につけた 既婚者を見抜く技 が、要らなくなる。\n\n結果：アプリから既婚者が消えて、減ったのはいいねの数じゃなく、女子が疑う時間だった。\nアプリの既婚者は、独身の値札を貼った、売約済みの商品だったのかもしれない。\n\nアプリで既婚者に会ったこと、ある？ コメントで教えて。\n\n※風刺ネタです。既婚者が消えるのは、もしもの設定です。登場する人物・アプリは架空です',
    hashtags: ['もしもラボ', 'もしも', 'マッチングアプリ', '既婚者', '婚活あるある'],
    endStats: [['アプリから消えたのは', '既婚者', 'もしもの設定'], ['減ったのは', '女子が疑う時間', 'もしもの結果'], ['アプリの既婚者の正体', '売約済みの商品', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
