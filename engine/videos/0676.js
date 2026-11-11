import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeGift, makeTable, makeShelf } from '../scenes/home.js';

// もしもクリスマスプレゼントに、値札を付けたまま渡す決まりだったら？（皮肉回・台本 S74・図星／男と女のもしも）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。元ネタ：毎年12月に燃える クリスマスプレゼントの予算は？ 彼氏からのプレゼントが安かった 系のトピ（ガルちゃん・Xの季節ネタ）
// 数字は使わない（値札の金額は画面に出さない。値札は ¥ だけ）。実在のブランドは出さない。店・人物は架空
// 女叩き（値段で愛を測る彼女）から入り、高い物で済ます彼氏にも返す両叩き。三段は 12月1日 見比べる→10日 自分の値札→20日 彼氏が青ざめる。言い換えは 愛の証明書

const { S, flat, room, hemi, sun } = makeSet({ bg: '#1c2238', ground: '#3a3a48', fogFar: 160 }); hemi.intensity = 1.35; hemi.color.set('#fff0e0');
const KANOJO = makeWoman({ shirt: '#c8242c', hair: '#3a2018', pants: '#2a2a34', skirt: true }); S.add(KANOJO);
const KARESHI = makeMan({ shirt: '#3a4256', hair: '#1d1a19', pants: '#2a2a34' }); S.add(KARESHI);
const tagTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 140; const g = c.getContext('2d'); g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 256, 140); g.fillStyle = '#c8242c'; g.font = '900 100px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('¥', 128, 74); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
function yenTag(G) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.13), new THREE.MeshBasicMaterial({ map: tagTex })); m.position.z = 0.006; G.userData.tag.add(m); return G; }
function tree(x, z, s = 1) { const g = new THREE.Group(); const m = mat('#2f6a3a'); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 - i * 0.22, 1.0, 10), m); c.position.y = 0.9 + i * 0.55; g.add(c); } const st = box(0.16, 0.5, 0.16, mat('#6a4a2a')); st.position.y = 0.25; g.add(st);
  for (let i = 0; i < 18; i++) { const a = i * 2.4, y = 0.6 + (i % 6) * 0.3; const r = 0.85 - (y - 0.6) * 0.42; const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: ['#ffd27a', '#ff6a6a', '#7fd4ff'][i % 3] })); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); g.add(b); }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshBasicMaterial({ color: '#ffd27a' })); star.position.y = 2.45; g.add(star); g.position.set(x, 0, z); g.scale.setScalar(s); S.add(g); return g; }

// ---------- A：レストラン（原点）：値札が飛び出す ----------
const roomA = room({ x: 0, w: 8, d: 6, h: 3.2, wall: '#5a2a30', floor: '#6a4a3a' });
const warm = new THREE.PointLight(0xffd8a8, 18, 10, 1.3); warm.position.set(0, 2.8, 1.0); S.add(warm);
tree(-2.6, -2.0, 1.1);
const TA = makeTable({ w: 1.2, d: 0.8, color: '#f4efe6' }); TA.position.set(0, 0, -0.6); S.add(TA);
const GIFT = yenTag(makeGift({ color: '#c8242c', ribbon: '#f2c14e', s: 0.42 })); S.add(GIFT);
const sparkA = makeSparkles(100, 0.12, 0xfff2c0); S.add(sparkA.points);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.45 }); S.add(katamaru);
const nefudaL = label('値札つき', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(nefudaL);
const shiraberu = label('まず値段を調べる', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(shiraberu);
const PHONE = box(0.12, 0.22, 0.02, mat('#15161c')); S.add(PHONE);

// ---------- B：イルミネーションの街（x=60） ----------
const BX = 60;
flat(30, 16, '#3a3a48', BX, 0);
for (let i = 0; i < 5; i++) { const b = box(5, 6 + (i % 2) * 2, 4, mat('#2a3048')); b.position.set(BX - 10 + i * 5, 3 + (i % 2), -7); S.add(b); }
const ILLU = []; for (let i = 0; i < 60; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: ['#ffe9a8', '#9fd8ff', '#ffffff'][i % 3] })); b.position.set(BX - 6 + (i % 20) * 0.6, 3.0 + Math.sin(i) * 0.15 + Math.floor(i / 20) * 0.5, -3.5); S.add(b); ILLU.push(b); }
tree(BX, -4, 1.8);
const COUPLES = []; { const r = rng(74); for (let i = 0; i < 3; i++) { const w = makeWoman({ shirt: ['#e9b8c8', '#c9a8d8', '#9fc7a8'][i], hair: ['#3a2620', '#6b4a33', '#2a2020'][i] }); const m = makeMan({ shirt: ['#4f6a8f', '#59606e', '#7a6a55'][i] }); const gw = yenTag(makeGift({ color: ['#3a7fd0', '#6ac46a', '#c58bff'][i], s: 0.3 })); const gm = yenTag(makeGift({ color: ['#f2c14e', '#e85a7a', '#5a9ae8'][i], s: 0.3 })); [w, m, gw, gm].forEach(o => S.add(o)); COUPLES.push({ w, m, gw, gm }); } }
const mikuraberu = label('値札を見比べる', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.6 }); S.add(mikuraberu);
const streetL = new THREE.PointLight(0xffe0c0, 18, 14, 1.2); streetL.position.set(BX, 3.5, 3); S.add(streetL);

// ---------- C：彼女の部屋（x=120）：自分の値札も ----------
const CX = 120;
const roomC = room({ x: CX, w: 6, d: 5, h: 3, wall: '#f6e6ef', floor: '#c9a27a' });
const cLight = new THREE.PointLight(0xfff0e0, 12, 9, 1.3); cLight.position.set(CX, 2.6, 1.2); S.add(cLight);
const MYGIFT = yenTag(makeGift({ color: '#3a7fd0', ribbon: '#ffffff', s: 0.4 })); S.add(MYGIFT);
const TC = makeTable({ w: 1.0, d: 0.6, color: '#f4efe6' }); TC.position.set(CX, 0, -0.6); S.add(TC);
const kakusenai = label('自分のも 隠せない', { w: 1024, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.8 }); S.add(kakusenai);

// ---------- D：お店（x=180）：高い物を選んだ彼氏が青ざめる ----------
const DX = 180;
flat(12, 8, '#e8e2d8', DX, 0);
const dWall = box(12, 3.4, 0.2, mat('#f6f0e8')); dWall.position.set(DX, 1.7, -2.6); S.add(dWall);
const SHELF = makeShelf({ w: 4, h: 2.0, colors: ['#c8242c', '#f2c14e', '#3a7fd0', '#e8e2d4'], seed: 5 }); SHELF.position.set(DX, 0, -2.2); S.add(SHELF);
const COUNTER = box(1.8, 0.95, 0.6, mat('#2a2a30')); COUNTER.position.set(DX + 0.4, 0.475, -0.6); S.add(COUNTER);
const dLight = new THREE.PointLight(0xffffff, 12, 10, 1.2); dLight.position.set(DX, 2.8, 1.5); S.add(dLight);
const BIGGIFT = yenTag(makeGift({ color: '#2a2a30', ribbon: '#f2c14e', s: 0.5 })); S.add(BIGGIFT);
const sweatK = makeSweat(); KARESHI.userData.head.add(sweatK);
const KF = KARESHI.userData.head.children[0]; KF.material = KF.material.clone(); const KSKIN = KF.material.color.clone();
const tegami = label('手紙が書けない', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.5 }); S.add(tegami);
const shopSign = label('もしもギフト', { w: 768, size: 96, color: '#fff', bg: 'rgba(200,60,60,.95)', sx: 1.5 }); shopSign.position.set(DX, 2.85, -2.3); S.add(shopSign);

// ---------- E：24日のレストラン（x=240）：2つのテーブル ----------
const EX = 240;
const roomE = room({ x: EX, w: 9, d: 6, h: 3.2, wall: '#5a2a30', floor: '#6a4a3a' });
const eLight = new THREE.PointLight(0xffd8a8, 20, 11, 1.2); eLight.position.set(EX, 2.8, 1.2); S.add(eLight);
tree(EX + 3.2, -2.0, 1.0);
const T1 = makeTable({ w: 1.2, d: 0.8, color: '#f4efe6' }); T1.position.set(EX - 1.4, 0, -0.6); S.add(T1);
const T2 = makeTable({ w: 1.2, d: 0.8, color: '#f4efe6' }); T2.position.set(EX + 1.4, 0, -0.6); S.add(T2);
const TAGS = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.11), new THREE.MeshBasicMaterial({ map: tagTex })); m.rotation.x = -Math.PI / 2; g.add(m); g.position.set(EX - 1.75 + (i % 3) * 0.32, TA.userData.topY + 0.01, -0.75 + Math.floor(i / 3) * 0.25); S.add(g); TAGS.push(g); }
const C2W = makeWoman({ shirt: '#9fc7a8', hair: '#6b4a33', pants: '#3a3f4e' }); const C2M = makeMan({ shirt: '#7a6a55', hair: '#2c2421' }); S.add(C2W); S.add(C2M);
const LETTER = new THREE.Group(); { const e = box(0.3, 0.01, 0.2, mat('#fffaf0')); LETTER.add(e); const h = box(0.08, 0.012, 0.08, mat('#e85a7a')); h.position.set(0, 0.002, 0); LETTER.add(h); } LETTER.position.set(EX + 1.25, T2.userData.topY + 0.01, -0.6); S.add(LETTER);
const TICKET = box(0.26, 0.012, 0.12, mat('#7fd4ff')); TICKET.position.set(EX + 1.6, T2.userData.topY + 0.01, -0.55); S.add(TICKET);
const damaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.45 }); S.add(damaru);
const warau = label('笑ってる', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(warau);
const nakami = label('手紙と 二人の約束', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(nakami);
const yasui = label('値段で比べると 愛は安い', { w: 1100, size: 92, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.1 }); S.add(yasui);
const hakatte = label('値段で愛を測っていた人', { w: 1100, size: 92, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 2.1 }); S.add(hakatte);
const shomei = label('愛の証明書', { w: 640, size: 110, color: '#fff', bg: 'rgba(200,36,44,.97)', sx: 1.2 }); S.add(shomei);
const CERT = new THREE.Group(); { const p = box(0.9, 0.62, 0.02, mat('#fffaf0')); CERT.add(p); const b = box(0.84, 0.56, 0.01, mat('#d8b860')); b.position.z = -0.006; CERT.add(b); const s = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), mat('#c8242c')); s.position.set(0.28, -0.18, 0.012); CERT.add(s); } S.add(CERT);

const PEOPLE = [KANOJO, KARESHI, ...COUPLES.flatMap(c => [c.w, c.m]), C2W, C2M];
const LABELS = [katamaru, nefudaL, shiraberu, mikuraberu, kakusenai, tegami, damaru, warau, nakami, yasui, hakatte, shomei];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatK.userData.set(0); KF.material.color.copy(KSKIN);
  KANOJO.position.set(0.0, 0, -1.3); KANOJO.rotation.y = 0; poseSit(KANOJO); KARESHI.position.set(1.4, 0, -0.6); KARESHI.rotation.y = -Math.PI / 2; poseSit(KARESHI);
  GIFT.position.set(0, TA.userData.topY, -0.75); GIFT.rotation.set(0, 0.3, 0); GIFT.userData.tagOut(1); PHONE.visible = false;
  COUPLES.forEach((c, i) => { const x = BX - 3 + i * 3; c.w.position.set(x - 0.45, 0, 0); c.m.position.set(x + 0.45, 0, 0); c.w.rotation.y = 0.5; c.m.rotation.y = -0.5; c.w.userData.arms[1].rotation.set(-1.1, 0, 0); c.m.userData.arms[0].rotation.set(-1.1, 0, 0);
    c.gw.position.set(x - 0.25, 0.85, 0.45); c.gm.position.set(x + 0.25, 0.85, 0.45); c.gw.userData.tagOut(1); c.gm.userData.tagOut(1); });
  MYGIFT.position.set(CX, TC.userData.topY, -0.6); MYGIFT.userData.tagOut(1); BIGGIFT.position.set(DX + 0.4, 0.95, -0.6); BIGGIFT.userData.tagOut(1);
  CERT.visible = false; TAGS.forEach(g => g.visible = true);
  C2W.position.set(EX + 1.4, 0, -1.3); poseSit(C2W); C2M.position.set(EX + 2.8, 0, -0.6); C2M.rotation.y = -Math.PI / 2; poseSit(C2M);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.35;
function tableCam(u = 0) { look(lerp(0.35, 0.25, u), lerp(1.75, 1.65, u), lerp(2.6, 2.1, u), 0.15, lerp(1.5, 1.2, u), -0.9, 46); }
function shot0(t) { // 0秒＝サムネ：きれいに包まれたプレゼントのリボンから、値札がぴょこんと飛び出す
  reset(); lift(0); GIFT.userData.tagOut(t < TP ? 0 : easeOut(clamp((t - TP) / 0.25))); KANOJO.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0));
  if (t > TP) { sparkA.init([[0.2, TA.userData.topY + 0.45, -0.6]], 0.3, 0.6); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; say(nefudaL, t, TP + 0.2, -0.25, 1.15, -0.4, 0.5); }
  tableCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 開けた彼女が、値札を見て固まる。
  reset(); lift(120); KANOJO.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); KANOJO.userData.head.rotation.x = 0.3;
  if (t > 1.0) say(katamaru, t, 1.0, 0.45, 1.95, -1.2, 0.4);
  const u = ease(clamp(t / d)); look(lerp(0.6, 0.4, u), 1.55, lerp(1.0, 0.6, u), 0.0, 1.25, -1.1, 50);
  return S;
}
function sShiraberu(t, d) { // 彼氏たちの不満から。何を渡しても、まず値段を調べられる。
  reset(); lift(120); KANOJO.userData.arms[1].rotation.set(-1.5, 0, 0.2); KANOJO.userData.head.rotation.x = 0.35; PHONE.visible = true; KANOJO.updateMatrixWorld(); const v = new THREE.Vector3(0.3, 0.95, 0.5); KANOJO.localToWorld(v); PHONE.position.copy(v); PHONE.rotation.x = -0.6;
  KARESHI.userData.head.rotation.x = 0.2;
  if (t > d * 0.4) say(shiraberu, t, d * 0.4, 0.0, 1.95, -1.0, 1.4);
  look(-1.4, 1.7, 0.6, 0.0, 1.15, -0.6, 50);
  return S;
}
function streetCam(u = 0) { look(BX + lerp(0.4, 0.2, u), lerp(2.2, 2.0, u), lerp(6.4, 5.6, u), BX, 1.5, -0.5, 50); }
function sDec1(t, d) { // 12月1日。街中のカップルが、値札の数字を見比べ始める。
  reset(); lift(120); COUPLES.forEach((c, i) => { c.w.userData.head.rotation.y = Math.sin(t * 2 + i) * 0.4; c.m.userData.head.rotation.y = -Math.sin(t * 2 + i) * 0.4; });
  say(mikuraberu, t, 0.6, BX, 2.6, 0, 1.5);
  setHud('値札つきの冬', '12月1日', 1); streetCam(ease(clamp(t / d)));
  return S;
}
function sDec10(t, d) { // 12月10日。彼女は自分のプレゼントの値札も、隠せないと気づく。
  reset(); lift(120); KANOJO.position.set(CX, 0, -1.2); KANOJO.rotation.y = 0; KANOJO.userData.legs.forEach(l => l.rotation.x = 0); KANOJO.position.y = 0; KANOJO.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); KANOJO.userData.head.rotation.x = 0.35;
  MYGIFT.userData.tagOut(0.4 + 0.6 * easeOut(clamp((t - 0.4) / 0.5)));
  if (t > d * 0.45) say(kakusenai, t, d * 0.45, CX, 2.35, -1.1, 1.6);
  setHud('値札つきの冬', '12月10日', 1);
  const u = ease(clamp(t / d)); look(CX + lerp(0.7, 0.4, u), 1.7, lerp(2.0, 1.6, u), CX, 1.2, -0.8, 50);
  return S;
}
function sDec20(t, d) { // 12月20日。高い物を選んだ彼氏が、店で青ざめる。手紙が書けない。
  reset(); lift(120); KANOJO.visible = false; KARESHI.position.set(DX - 0.7, 0, -0.1); KARESHI.rotation.y = 0.6; KARESHI.userData.legs.forEach(l => l.rotation.x = 0); KARESHI.position.y = 0;
  const k = clamp((t - 0.8) / 1.0); KF.material.color.copy(KSKIN).lerp(new THREE.Color('#a8c0e0'), k); sweatK.userData.set(k, t); KARESHI.userData.head.rotation.x = 0.25 * k;
  if (t > d * 0.55) say(tegami, t, d * 0.55, DX - 0.4, 2.2, -0.2, 1.2);
  setHud('値札つきの冬', '12月20日', 1);
  const u = ease(clamp(t / d)); look(DX + lerp(0.6, 0.4, u), 1.8, lerp(3.8, 3.3, u), DX - 0.1, 1.35, -0.4, 50);
  return S;
}
function restCam(u = 0) { look(EX + lerp(0.2, 0.0, u), lerp(2.6, 2.4, u), lerp(7.0, 6.4, u), EX, 1.1, -0.6, 50); }
function seatCouple() { KANOJO.position.x = EX - 1.4; KANOJO.position.z = -1.3; KARESHI.position.x = EX - 2.8; KARESHI.position.z = -0.6; KARESHI.rotation.y = Math.PI / 2; }
function sDec24(t, d) { // 24日。値札だけを並べたカップルが、黙って向かい合う。
  reset(); lift(120); seatCouple(); KANOJO.userData.head.rotation.x = 0.3; KARESHI.userData.head.rotation.x = 0.3;
  if (t > 1.0) say(damaru, t, 1.0, EX - 1.1, 1.85, -1.0, 0.4);
  setHud('値札つきの冬', '12月24日', 1); restCam(ease(clamp(t / d)) * 0.5); look(EX - 1.0, 1.9, 2.4, EX - 1.4, 1.0, -0.6, 50);
  return S;
}
function sWarau(t, d) { // 隣の席で、値札が一番安いカップルだけが笑っている。
  reset(); lift(120); seatCouple(); KANOJO.userData.head.rotation.x = 0.3; KARESHI.userData.head.rotation.x = 0.3;
  [C2W, C2M].forEach((p, i) => { p.userData.head.rotation.z = Math.sin(t * 8 + i) * 0.12; p.userData.arms[i].rotation.set(-0.6, 0, (i ? 1 : -1) * (0.4 + Math.sin(t * 8) * 0.15)); });
  if (t > 0.8) say(warau, t, 0.8, EX + 1.4, 2.25, -0.6, 0.8);
  restCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sNakami(t, d) { // 中身は、手書きの手紙と、二人で行く約束。
  reset(); lift(120); seatCouple(); C2W.userData.arms[1].rotation.set(-0.9, 0, 0.1);
  say(nakami, t, 0.5, EX + 1.4, 1.34, -0.35, 0.7);
  look(EX + 1.5, 1.95, 1.5, EX + 1.4, 0.95, -0.7, 50);
  return S;
}
function sYasui(t, d) { // 彼女は気づく。値段で比べると、愛は一番安く見える。
  reset(); lift(120); seatCouple(); KANOJO.userData.head.rotation.y = 0.7; KANOJO.userData.head.rotation.x = 0.1;
  if (t > d * 0.45) say(yasui, t, d * 0.45, EX - 1.4, 2.1, -1.2, 1.8);
  const u = ease(clamp(t / d)); look(EX - lerp(0.9, 1.1, u), 1.6, lerp(0.8, 0.5, u), EX - 1.4, 1.25, -1.2, 50);
  return S;
}
function sKekka(t, d) { // 結果：値札を付けたまま渡すことになって、一番困ったのは、値段で愛を測っていた人だった。
  reset(); lift(120); seatCouple(); KANOJO.userData.head.rotation.x = 0.4; KARESHI.userData.head.rotation.x = 0.4;
  if (t > d * 0.55) say(hakatte, t, d * 0.55, EX - 1.2, 1.9, -0.8, 1.6);
  const u = ease(clamp(t / d)); look(EX + lerp(0.6, -0.6, u), lerp(2.6, 2.1, u), lerp(4.8, 3.0, u), EX - 1.2, 1.0, -0.6, 50);
  return S;
}
function sShomei(t, d) { // 値札は、自分の気持ちに自信がない人のための、愛の証明書
  reset(); lift(120); KARESHI.visible = false; CERT.visible = true; const k = easeOut(clamp((t - 0.4) / 0.8)); CERT.position.set(0.8, lerp(TA.userData.topY + 0.3, 1.15, k), -0.4); CERT.rotation.y = -0.4; CERT.scale.multiplyScalar(0.7); CERT.scale.setScalar(0.4 + 0.6 * k); GIFT.visible = false;
  KANOJO.userData.head.rotation.x = -0.15;
  if (t > 1.4) say(shomei, t, 1.4, 0, 2.05, -0.6, 1.0);
  look(0.3, 1.6, 2.4, 0.2, 1.35, -0.8, 50);
  return S;
}
function sAsk(t) { // クリスマスプレゼント、値段は気になる？（冒頭と同じ構図。値札は出たまま）
  reset(); lift(0); GIFT.visible = true; KANOJO.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); tableCam(0);
  return S;
}

const NARR = { '値札': 'ねふだ', '彼女': 'かのじょ', '彼氏': 'かれし', '不満': 'ふまん', '値段': 'ねだん', '12月1日': 'じゅうにがつついたち', '12月10日': 'じゅうにがつとおか', '12月20日': 'じゅうにがつはつか', '24日': 'にじゅうよっか', '街中': 'まちじゅう', '見比べ': 'みくらべ', '青ざめる': 'あおざめる', '手紙': 'てがみ', '黙って': 'だまって', '向かい合う': 'むかいあう', '隣': 'となり', '一番': 'いちばん', '中身': 'なかみ', '手書き': 'てがき', '二人': 'ふたり', '結果：': '結果、', '測って': 'はかって', '証明書': 'しょうめいしょ', '自信': 'じしん' };
const P = planTimes([
  ['開けた彼女が、<br>値札を見て固まる。', sKatamaru],
  ['彼氏たちの不満から。', (t, d) => sShiraberu(t, 2.4 * d)],
  ['何を渡しても、<br>まず値段を調べられる。', (t, d) => sShiraberu(t + 1.0, 2.4 * d)],
  ['12月1日。街中のカップルが、<br>値札の数字を見比べ始める。', sDec1],
  ['12月10日。彼女は自分の<br>プレゼントの値札も、', (t, d) => sDec10(t, 2 * d)],
  ['隠せないと気づく。', (t, d) => sDec10(t + d, 2 * d)],
  ['12月20日。高い物を選んだ<br>彼氏が、店で青ざめる。', (t, d) => sDec20(t, 1.7 * d)],
  ['手紙が書けない。', (t, d) => sDec20(t + d, 1.7 * d)],
  ['24日。値札だけを並べた<br>カップルが、黙って向かい合う。', sDec24],
  ['隣の席で、値札が一番安い<br>カップルだけが笑っている。', sWarau],
  ['中身は、手書きの手紙と、<br>二人で行く約束。', sNakami],
  ['彼女は気づく。値段で比べると、<br>愛は一番安く見える。', sYasui],
  ['結果：値札を付けたまま<br>渡すことになって、', (t, d) => sKekka(t, 3 * d)],
  ['一番困ったのは、', (t, d) => sKekka(t + d, 3 * d)],
  ['値段で愛を<br>測っていた人だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['値札は、自分の気持ちに<br>自信がない人のための、', sShomei],
  ['愛の証明書', (t, d) => sShomei(t + 3.0, d)],
  ['だったのかもしれない。', (t, d) => sShomei(t + 5.0, d)],
  ['クリスマスプレゼント、<br>値段は気になる？', sAsk],
], { shot0, endCard, start: 4.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0676',
    v2: true,
    tt: 'main',
    hookLine: 'きれいに包まれたプレゼントのリボンから、値札がぴょこんと飛び出す。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもクリスマスプレゼントに、値札を付けたまま渡す決まりだったら？',
    titleHtml: 'もしもクリスマス<br>プレゼントに値札を<br>付けたまま渡す<br>決まりだったら？',
    mood: 'emotional', seed: 676, hits: [TP, P.at(12), P.at(16)], risers: [P.at(8)], impacts: [P.at(3, 0.6), P.at(6, 1.2), P.at(11, 1.6)],
    sfx: [[TP, 'poof'], [P.at(0, 1.0), 'buzz'], [P.at(2, 0.4), 'whoosh'], [P.at(4, 0.6), 'poof'], [P.at(6, 1.0), 'meter', 0.4], [P.at(9, 0.4), 'bubble'], [P.at(15, 0.5), 'whoosh']],
    narr: NARR,
    ask: 'クリスマスプレゼント、値段は気になる？',
    caption: 'もしもクリスマスプレゼントに、値札を付けたまま渡す決まりだったら？\n\n開けた彼女が、値札を見て固まる。\n彼氏たちの不満から。何を渡しても、まず値段を調べられる。\n12月1日。街中のカップルが、値札の数字を見比べ始める。\n12月10日。彼女は自分のプレゼントの値札も、隠せないと気づく。\n12月20日。高い物を選んだ彼氏が、店で青ざめる。手紙が書けない。\n24日。値札だけを並べたカップルが、黙って向かい合う。\n隣の席で、値札が一番安いカップルだけが笑っている。中身は、手書きの手紙と、二人で行く約束。\n彼女は気づく。値段で比べると、愛は一番安く見える。\n\n結果：値札を付けたまま渡すことになって、一番困ったのは、値段で愛を測っていた人だった。\n値札は、自分の気持ちに自信がない人のための、愛の証明書だったのかもしれない。\n\nクリスマスプレゼント、値段は気になる？ コメントで教えて。\n\n※風刺ネタです。値札を付けたまま渡すのは、もしもの設定です。登場する人物・店は架空です',
    hashtags: ['もしもラボ', 'もしも', 'クリスマス', 'クリスマスプレゼント', 'カップル'],
    endStats: [['決まり', '値札を付けたまま渡す', 'もしもの設定'], ['一番困ったのは', '値段で愛を測っていた人', 'もしもの結果'], ['値札の正体', '愛の証明書', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
