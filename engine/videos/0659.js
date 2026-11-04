import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも婚活がアウトレットだったら？（皮肉回・台本 S48・図星／男と女のもしも）
// 2026/11/04 ゆうと承認（投稿サーバーで ok）。元ネタ：ガルちゃん「アラサーの良い男、残ってなさすぎる！！！」https://girlschannel.net/topics/6324247/（2026/11/01）
//  ＋ posfie「婚活してて思うけど、普通の人って本当に普通に生活してたら出会えないの？」https://posfie.com/@kalofollow/p/o1XN8XI（2026/10/29）
// 数字は使わない（風刺だけで組む）。店・ブランドは架空（実在のアウトレットモールの見た目・ロゴに似せない）。女叩き（男にも返す）

const GOLD = '#ffd27a', RED = '#ff5a5a';
const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xfffaf0, 0x5a5a66, 1.3); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(6, 16, 12); S.add(sun);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
const HER = () => makeWoman({ shirt: '#f2a0b8', hair: '#4a3020', pants: '#3a3f4e', skirt: true });
function lookAround(p, t) { p.userData.head.rotation.y = Math.sin(t * 2.2) * 0.5; }
function handHip(p, k = 1) { p.userData.arms[0].rotation.set(-0.2 * k, 0, 0.7 * k); p.userData.arms[1].rotation.set(-0.2 * k, 0, -0.7 * k); }
// 値札（ひもつきの札）
function tag(text, bg = 'rgba(255,255,255,.98)', fg = '#c8242c', sx = 0.7) { const l = label(text, { w: 512, size: 96, color: fg, bg, sx }); S.add(l); return l; }

// ---------- 床と店（原点）。婚活パーティー ⇔ アウトレットの売り場を切り替える ----------
const floorM = mat('#d8d0c4', { depthWrite: false });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), floorM); floor.rotation.x = -Math.PI / 2; floor.renderOrder = -0.9; S.add(floor);
const back = box(30, 6, 0.3, mat('#efe8dc')); back.position.set(0, 3, -6); S.add(back);
// パーティー：丸テーブルと風船
const PARTY = new THREE.Group(); S.add(PARTY);
{ for (const [x, z] of [[-3, -2.5], [3, -2.5], [-3.6, 1.6], [3.6, 1.6]]) { const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 20), mat('#fbfaf5')); top.position.set(x, 0.75, z); PARTY.add(top); const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.75, 8), mat('#c9c2b0')); leg.position.set(x, 0.37, z); PARTY.add(leg); const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.16, 10), mat('#ffe6b0')); gl.position.set(x + 0.3, 0.86, z); PARTY.add(gl); }
  const cols = ['#ff8ab0', '#ffd27a', '#9ad4ff', '#c8a0f0']; for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(cols[i % 4])); b.scale.y = 1.2; b.position.set(-6 + i * 0.95, 4.6 + (i % 2) * 0.3, -5.6); PARTY.add(b); } }
const partySign = label('婚活パーティー', { w: 1024, size: 110, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 2.4 }); partySign.position.set(0, 3.8, -5.6); S.add(partySign);
// アウトレット：台座（人が並ぶ）・ラック・セールの札
const OUT = new THREE.Group(); S.add(OUT);
const outSign = label('アウトレット', { w: 900, size: 120, color: '#fff', bg: 'rgba(200,36,44,.97)', sx: 2.4 }); outSign.position.set(0, 3.9, -5.6); S.add(outSign);
const sale = [label('SALE', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }), label('SALE', { w: 512, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 })]; sale[0].position.set(-4.2, 3.3, -5.6); sale[1].position.set(4.2, 3.3, -5.6); sale.forEach(l => S.add(l));
const PED = []; // 台座：左右2列×3
for (let i = 0; i < 6; i++) { const side = i < 3 ? -1 : 1, k = i % 3; const p = new THREE.Group(); const b = box(1.0, 0.35, 1.0, mat('#3a3e48')); b.position.y = 0.175; p.add(b); const tp = box(1.04, 0.04, 1.04, mat('#c9a040')); tp.position.y = 0.37; p.add(tp); p.position.set(side * 1.9, 0, -3.6 + k * 2.0); OUT.add(p); PED.push(p); }
for (const x of [-5.4, 5.4]) { const rack = new THREE.Group(); const bar = box(0.06, 0.06, 4.0, mat('#c9ced8')); bar.position.y = 1.7; rack.add(bar); for (const z of [-2, 2]) { const leg = box(0.06, 1.7, 0.06, mat('#c9ced8')); leg.position.set(0, 0.85, z); rack.add(leg); } const cols = ['#e05a4f', '#4fa3d1', '#f2c14e', '#8e6bbf', '#5d8c3a', '#e9e4da']; for (let i = 0; i < 9; i++) { const c = box(0.5, 0.8, 0.08, mat(cols[i % 6])); c.position.set(0, 1.25, -1.8 + i * 0.45); c.rotation.y = Math.PI / 2; rack.add(c); } rack.position.set(x, 0, -1); OUT.add(rack); }
// 台座の上の男たち（商品）。型落ち・訳ありの札
const MEN = []; { const shirts = ['#59606e', '#7a6a55', '#8a8f99', '#6b7a5a', '#4f6a8f', '#a35d4f']; for (let i = 0; i < 6; i++) { const m = makeMan({ shirt: shirts[i], hair: i % 3 ? '#2a2420' : '#5a5a5a', bald: i === 4 }); S.add(m); MEN.push(m); } }
const MTAG = MEN.map((m, i) => tag(['型落ち', '型落ち', '型落ち', '型落ち', '型落ち', '型落ち'][i]));
// 売り切れの札
const SOLD = [tag('売り切れ', 'rgba(70,76,92,.97)', '#fff', 0.95), tag('売り切れ', 'rgba(70,76,92,.97)', '#fff', 0.95), tag('予約済み', 'rgba(52,128,230,.97)', '#fff', 0.95)];
const SOLDSUB = [label('清潔感のある人', { w: 768, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.25 }), label('誠実な人', { w: 640, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.9 }), label('会話のできる人', { w: 768, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 1.25 })]; SOLDSUB.forEach(l => S.add(l));
const WHERE = [label('大学で', { w: 512, size: 100, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.8 }), label('職場で', { w: 512, size: 100, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.8 }), label('友達の紹介で', { w: 768, size: 100, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 1.2 })]; WHERE.forEach(l => S.add(l));
// 訳あり品のワゴン
const WAGON = new THREE.Group(); { const b = box(2.2, 0.8, 1.2, mat('#c9a040')); b.position.y = 0.6; WAGON.add(b); const inner = box(2.0, 0.1, 1.0, mat('#6a5030')); inner.position.y = 0.96; WAGON.add(inner); for (const [x, z] of [[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10), mat('#2a2a30')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.1, z); WAGON.add(w); } } S.add(WAGON);
const wakeari = label('訳あり品', { w: 640, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(wakeari);
const W_MEN = [makeMan({ shirt: '#6a6a70', hair: '#3a3330' }), makeMan({ shirt: '#8a7a6a', hair: '#9a9a9a', bald: true })]; W_MEN.forEach(m => S.add(m));
// 彼女と店員
const HERP = HER(); S.add(HERP);
const herTag = tag('値札', 'rgba(255,255,255,.98)', '#c8242c', 0.7);
const CLERK = makeMan({ shirt: '#3a7a5a', hair: '#1d1a19' }); S.add(CLERK);
const apron = box(0.44, 0.5, 0.04, mat('#2a4a3a')); apron.position.set(0, 1.02, 0.15); CLERK.add(apron);
// 吹き出し
const B = (t, sx = 1.6, w = 900, size = 96) => { const l = label(t, { w, size, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx }); S.add(l); return l; };
const futsuu = B('普通の人でいいのに', 1.9, 1000);
const inai = label('いない', { w: 512, size: 120, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.9 }); S.add(inai);
const joken = [label('清潔感', { w: 512, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.8 }), label('会話', { w: 384, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.6 }), label('誠実', { w: 384, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.6 })]; joken.forEach(l => S.add(l));
const futsuuHa = B('普通の人は？', 1.4, 768);
const tenin = B('店に並ぶ前に売れます', 2.0, 1100);
const futsuuKo = B('普通の子がいない', 1.7, 1000);
const otagai = label('お互いに', { w: 640, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(otagai);
const urete = label('並ぶ前に売れた人', { w: 1000, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.0 }); S.add(urete);
const sparkA = makeSparkles(140, 0.2, 0xffe6a0); S.add(sparkA.points); sparkA.init([[0, 2.0, -1]], 4.0, 1.4);

// ---------- 隣の売り場（x=60）：男たちが女性の台座を見ている ----------
const NX = 60;
const back2 = box(30, 6, 0.3, mat('#e4ecf4')); back2.position.set(NX, 3, -6); S.add(back2);
const outSign2 = label('アウトレット', { w: 900, size: 120, color: '#fff', bg: 'rgba(52,128,230,.97)', sx: 2.4 }); outSign2.position.set(NX, 3.9, -5.6); S.add(outSign2);
const PED2 = []; for (let i = 0; i < 4; i++) { const p = new THREE.Group(); const b = box(1.0, 0.35, 1.0, mat('#3a3e48')); b.position.y = 0.175; p.add(b); const tp = box(1.04, 0.04, 1.04, mat('#c9a040')); tp.position.y = 0.37; p.add(tp); p.position.set(NX - 3 + i * 2, 0, -3.6); S.add(p); PED2.push(p); }
const WOMEN = []; { const sh = ['#e9e4da', '#c94f7c', '#4fa3d1', '#f2c14e']; for (let i = 0; i < 4; i++) { const w = makeWoman({ shirt: sh[i], hair: i % 2 ? '#3a2620' : '#6b4a33' }); w.position.set(NX - 3 + i * 2, 0.39, -3.6); S.add(w); WOMEN.push(w); } }
const WTAG = WOMEN.map(() => tag('型落ち'));
const SHOPPERS = []; { const sh = ['#4f6a8f', '#59606e', '#7a6a55']; for (let i = 0; i < 3; i++) { const m = makeMan({ shirt: sh[i], hair: '#2a2420' }); m.position.set(NX - 1.8 + i * 1.8, 0, 0.4); m.rotation.y = Math.PI; S.add(m); SHOPPERS.push(m); } }
const S_TAGS = SHOPPERS.map(() => tag('値札'));

const LABELS = [futsuu, inai, ...joken, futsuuHa, tenin, futsuuKo, otagai, urete, herTag, wakeari, ...SOLD, ...SOLDSUB, ...WHERE, ...MTAG, ...WTAG, ...S_TAGS];
function setMode(out) { PARTY.visible = partySign.visible = !out; OUT.visible = outSign.visible = out; sale.forEach(l => l.visible = out); MEN.forEach(m => m.visible = out); floorM.color.set(out ? '#c8c0b4' : '#d8c8b0'); }
function reset() {
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0;
  [HERP, CLERK, ...MEN, ...W_MEN, ...WOMEN, ...SHOPPERS].forEach(p => { poseReset(p); p.visible = true; });
  WOMEN.forEach((w, i) => w.position.set(NX - 3 + i * 2, 0.39, -3.6)); SHOPPERS.forEach((m, i) => { m.position.set(NX - 1.8 + i * 1.8, 0, 0.4); m.rotation.y = Math.PI; });
  HERP.position.set(0, 0, 1.2); CLERK.position.set(1.4, 0, 0.2); CLERK.rotation.y = -0.6; CLERK.visible = false;
  MEN.forEach((m, i) => { m.position.set(PED[i].position.x, 0.39, PED[i].position.z); m.rotation.y = (i < 3 ? 1 : -1) * Math.PI / 2; m.visible = true; });
  PED.forEach(p => p.visible = true); WAGON.position.set(0, 0, -4.6); WAGON.visible = false; W_MEN.forEach(m => m.visible = false);
  setMode(true);
}
function menTags(on = true) { MEN.forEach((m, i) => { const l = MTAG[i]; l.visible = on && m.visible; l.position.set(m.position.x + (i < 3 ? 0.5 : -0.5), 1.55, m.position.z + 0.1); l.userData.size(0.6); }); }
const TP = 0.45; // 0.45秒で会場がアウトレットに変わる
function hookCam(u = 0) { look(lerp(0.3, 0.15, u), 2.2, lerp(5.0, 4.6, u), 0, 1.3, -1.0, 52); }
function shot0(t) { // 0秒＝サムネ：婚活パーティーの会場が、アウトレットモールの売り場にパッと変わる
  reset(); lift(0); setMode(t > TP); lookAround(HERP, t);
  if (t > TP) { menTags(); sparkA.set(clamp((t - TP) / 1.3)); el.flash.style.opacity = t < TP + 0.12 ? 0.45 : 0; }
  hookCam(ease(clamp(t / 3)));
  return S;
}
function sFuman(t) { // 婚活女子の不満から。
  reset(); lift(0); setMode(false); HERP.rotation.y = 0.2; handHip(HERP, 1);
  look(0.6, 1.7, 4.4, 0, 1.4, 1.2, 50);
  return S;
}
function sJoken(t) { // 清潔感があって、会話ができて、誠実。
  reset(); lift(0); setMode(false); HERP.rotation.y = 0.1; HERP.userData.arms[1].rotation.set(-1.0, 0, 0);
  joken.forEach((l, i) => { l.position.set(-0.75 + i * 0.75, 2.45 + (i % 2) * 0.3, 1.4); pop(l, t, 0.3 + i * 0.7, 0.2, l.userData.sx * 0.9); });
  look(0.3, 1.75, 6.0, 0, 1.6, 1.2, 50);
  return S;
}
function sInai(t) { // 普通の人でいいのに、いない。
  reset(); lift(0); setMode(false); lookAround(HERP, t);
  futsuu.position.set(0, 2.5, 1.4); pop(futsuu, t, 0.2, 0.25, 1.5);
  if (t > 1.5) { inai.position.set(0.6, 1.9, 1.6); pop(inai, t, 1.5, 0.25, 0.8); }
  look(0.4, 1.7, 4.8, 0, 1.5, 1.2, 50);
  return S;
}
function sHontou(t) { // ある日、婚活は本当にアウトレットになった。
  reset(); lift(0); const k = 0.6; setMode(t > k); if (t > k) { menTags(); sparkA.set(clamp((t - k) / 1.3)); el.flash.style.opacity = t < k + 0.12 ? 0.4 : 0; }
  look(0, 3.2, lerp(9.5, 8.2, ease(clamp(t / 3))), 0, 1.7, -2, 52);
  return S;
}
function sKataochi(t) { // 並んでいるのは、新作ではなく型落ち。
  reset(); lift(0); menTags();
  const u = ease(clamp(t / 3)); look(lerp(-0.6, 0.4, u), 1.9, lerp(1.4, 0.6, u), -2.4, 1.3, -2.6, 50);
  return S;
}
function sFutsuuHa(t) { // 普通の人は？
  reset(); lift(0); menTags(); CLERK.visible = true; HERP.rotation.y = 0.6; HERP.position.set(0.2, 0, 0.6); CLERK.position.set(1.2, 0, -0.2); CLERK.rotation.y = -2.2;
  futsuuHa.position.set(0.3, 2.5, 0.8); pop(futsuuHa, t, 0.2, 0.25, 1.3);
  look(-0.4, 1.8, 4.2, 0.6, 1.45, 0.2, 50);
  return S;
}
function sTenin(t) { // 店員は答える。普通の人は、店に並ぶ前に売れます。
  reset(); lift(0); menTags(); CLERK.visible = true; HERP.rotation.y = 0.6; HERP.position.set(0.2, 0, 0.6); CLERK.position.set(1.2, 0, -0.2); CLERK.rotation.y = -2.2; CLERK.userData.arms[0].rotation.set(-0.9, 0, -0.3);
  tenin.position.set(0.5, 2.55, 0.0); pop(tenin, t, 0.6, 0.3, 1.6);
  look(-0.4, 1.8, 4.2, 0.6, 1.45, 0.2, 50);
  return S;
}
// 売り切れの台座（右の列を空にして札）
function soldShot(t, n) {
  reset(); lift(160); HERP.visible = false; for (let i = 3; i < 6; i++) MEN[i].visible = false; menTags();
  for (let i = 0; i < n; i++) { const p = PED[3 + i]; const t0 = i === n - 1 ? 0.3 : -1; SOLD[i].position.set(p.position.x, 1.0, p.position.z + 0.3); pop(SOLD[i], t, t0, 0.25, 1.0); SOLDSUB[i].position.set(p.position.x, 1.55, p.position.z + 0.3); pop(SOLDSUB[i], t, t0, 0.25, SOLDSUB[i].userData.sx * 1.15); if (i === n - 1) { WHERE[i].position.set(p.position.x, 2.15, p.position.z + 0.3); pop(WHERE[i], t, 1.1, 0.25, WHERE[i].userData.sx); } }
  const q = PED[3 + n - 1].position; look(q.x - 1.8, 2.1, q.z + 3.8, q.x, 1.2, q.z, 50);
  return S;
}
function sDaigaku(t) { return soldShot(t, 1); } // 清潔感のある人は、大学で売り切れ。
function sShokuba(t) { return soldShot(t, 2); } // 誠実な人は、職場で売り切れ。
function sYoyaku(t) { return soldShot(t, 3); } // 会話のできる人は、友達の紹介で予約済み。
function sWagon(t) { // 残っているのは、訳あり品のワゴン。
  reset(); lift(0); HERP.visible = false; PED.forEach(p => p.visible = false); MEN.forEach(m => m.visible = false); WAGON.visible = true; WAGON.position.set(0, 0, -2.2);
  W_MEN.forEach((m, i) => { m.visible = true; m.position.set(-0.5 + i * 1.0, 0.0, -2.9); m.userData.head.rotation.x = 0.25; });
  wakeari.position.set(0, 1.75, -1.5); pop(wakeari, t, 0.4, 0.25, 1.1);
  look(0.3, 2.0, 3.6, 0, 1.2, -2.3, 50);
  return S;
}
function sSenaka(t) { // ふと自分の背中を見る。
  reset(); lift(0); HERP.position.set(0, 0, 0.8); HERP.rotation.y = 0; HERP.userData.head.rotation.y = lerp(0, 2.0, ease(clamp(t / 1.2))); HERP.userData.head.rotation.x = 0.2; menTags();
  look(1.0, 1.75, 3.8, 0, 1.4, 0.8, 50);
  return S;
}
function sNefuda(t) { // そこにも値札がついている。
  reset(); lift(0); HERP.position.set(0, 0, 0.8); HERP.rotation.y = 0; HERP.userData.head.rotation.y = 2.0; HERP.userData.head.rotation.x = 0.2; menTags();
  herTag.position.set(0.05, 1.3, 0.55); pop(herTag, t, 0.3, 0.25, 0.75); herTag.userData.set('型落ち');
  look(0.6, 1.6, -1.6, 0, 1.35, 0.8, 50); // 背中から
  return S;
}
// 隣の売り場
function sTonari(t) { // 隣の売り場では、男たちが同じことを言っている。
  reset(); lift(0); setMode(true); WTAG.forEach((l, i) => { l.visible = true; l.position.set(WOMEN[i].position.x + 0.5, 1.55, WOMEN[i].position.z + 0.1); l.userData.size(0.6); });
  look(NX + lerp(-1, 0, ease(clamp(t / 3))), 2.2, -6.0 + 12, NX, 1.5, -2, 50);
  return S;
}
function sFutsuuKo(t) { // 普通の子がいない。
  reset(); lift(0); WTAG.forEach((l, i) => { l.visible = true; l.position.set(WOMEN[i].position.x + 0.5, 1.55, WOMEN[i].position.z + 0.1); l.userData.size(0.6); });
  SHOPPERS[1].userData.arms[1].rotation.set(-0.3, 0, 0); handHip(SHOPPERS[0], 1);
  futsuuKo.position.set(NX, 2.6, 0.8); pop(futsuuKo, t, 0.2, 0.25, 1.7);
  S_TAGS.forEach((l, i) => { l.position.set(SHOPPERS[i].position.x, 1.3, SHOPPERS[i].position.z + 0.3); pop(l, t, 1.2 + i * 0.2, 0.2, 0.6); l.userData.set('型落ち'); });
  look(NX + 0.4, 1.9, 4.6, NX, 1.4, -0.4, 50); // 男たちの背中から、背中の値札が見える
  return S;
}
function sKekka(t) { // 結果：アウトレットに普通の人はいなかった。
  reset(); lift(0); menTags(); HERP.position.set(0, 0, 0.8); HERP.userData.head.rotation.x = 0.25; herTag.visible = true; herTag.position.set(0.05, 1.3, 0.55); herTag.userData.set('型落ち'); herTag.userData.size(0.75);
  const u = ease(clamp(t / 4)); look(lerp(0.3, 0, u), lerp(3.0, 4.0, u), lerp(6.5, 8.5, u), 0, 1.4, -1.5, 52);
  return S;
}
function sOtagai(t) { // お互いに。
  reset(); lift(0); WTAG.forEach((l, i) => { l.visible = true; l.position.set(WOMEN[i].position.x + 0.5, 1.55, WOMEN[i].position.z + 0.1); l.userData.size(0.6); });
  S_TAGS.forEach((l, i) => { l.visible = true; l.position.set(SHOPPERS[i].position.x, 1.3, SHOPPERS[i].position.z + 0.3); l.userData.set('型落ち'); l.userData.size(0.6); });
  otagai.position.set(NX, 2.9, -1.2); pop(otagai, t, 0.2, 0.25, 1.3); el.flash.style.opacity = t > 0.2 && t < 0.3 ? 0.3 : 0;
  look(NX + 0.3, 2.6, 6.4, NX, 1.45, -1.6, 50);
  return S;
}
function sUrete(t) { // 普通の人とは、店に並ぶ前に売れた人のことだった
  reset(); lift(0); for (let i = 0; i < 6; i++) MEN[i].visible = false; menTags(false);
  PED.forEach((p, i) => { SOLD[i % 3].visible = false; });
  urete.position.set(0, 2.9, -1.0); pop(urete, t, 0.4, 0.3, 1.9);
  look(0, 3.0, 6.0, 0, 1.0, -1.5, 50);
  return S;
}
function sKamo(t) { // のかもしれない。
  reset(); lift(0); for (let i = 0; i < 6; i++) MEN[i].visible = false; menTags(false); urete.visible = true; urete.position.set(0, 2.9, -1.0); urete.userData.size(1.9);
  look(0, lerp(3.0, 3.6, ease(clamp(t / 2.5))), lerp(6.0, 7.4, ease(clamp(t / 2.5))), 0, 1.0, -1.5, 50);
  return S;
}
function sAsk(t) { // 普通の人、婚活で出会える？出会えない？（冒頭と同じ構図）
  reset(); lift(0); menTags(); lookAround(HERP, t);
  hookCam(0);
  return S;
}

const NARR = { '婚活': 'こんかつ', '清潔感': 'せいけつかん', '誠実': 'せいじつ', '型落ち': 'かたおち', '新作': 'しんさく', '店員': 'てんいん', '売り切れ': 'うりきれ', '職場': 'しょくば', '予約済み': 'よやくずみ', '訳あり品': 'わけありひん', '値札': 'ねふだ', '結果：': '結果、', '普通': 'ふつう', '隣': 'となり', '売り場': 'うりば', '出会える': 'であえる', '出会えない': 'であえない', '並ぶ': 'ならぶ' };
const P = planTimes([
  ['婚活女子の不満から。', sFuman],
  ['清潔感があって、<br>会話ができて、誠実。', sJoken],
  ['普通の人でいいのに、<br>いない。', sInai],
  ['ある日、婚活は本当に<br>アウトレットになった。', sHontou],
  ['並んでいるのは、<br>新作ではなく型落ち。', sKataochi],
  ['普通の人は？', sFutsuuHa],
  ['店員は答える。普通の人は、<br>店に並ぶ前に売れます。', sTenin],
  ['清潔感のある人は、<br>大学で売り切れ。', sDaigaku],
  ['誠実な人は、<br>職場で売り切れ。', sShokuba],
  ['会話のできる人は、<br>友達の紹介で予約済み。', sYoyaku],
  ['残っているのは、<br>訳あり品のワゴン。', sWagon],
  ['ふと自分の背中を見る。', sSenaka],
  ['そこにも値札がついている。', sNefuda],
  ['隣の売り場では、男たちが<br>同じことを言っている。', sTonari],
  ['普通の子がいない。', sFutsuuKo],
  ['結果：アウトレットに<br>普通の人はいなかった。', sKekka],
  ['お互いに。', sOtagai],
  ['普通の人とは、店に並ぶ前に<br>売れた人のことだった', sUrete],
  ['のかもしれない。', sKamo],
  ['普通の人、婚活で<br>出会える？出会えない？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0659',
    v2: true,
    hookLine: '婚活パーティーの会場が、アウトレットモールの売り場にパッと変わる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも婚活がアウトレットだったら？',
    titleHtml: 'もしも婚活が<br>アウトレット<br>だったら？',
    mood: 'tension', seed: 659, hits: [0.45, P.at(15), P.at(16)], risers: [P.at(11)], impacts: [P.at(3, 0.6), P.at(6, 0.6), P.at(7, 0.3), P.at(8, 0.3), P.at(9, 0.3), P.at(12, 0.3), P.at(16, 0.2)],
    sfx: [[0.45, 'poof'], [P.at(1, 0.3), 'bubble'], [P.at(1, 1.0), 'bubble'], [P.at(1, 1.7), 'bubble'], [P.at(2, 1.5), 'buzz'], [P.at(3, 0.6), 'poof'], [P.at(7, 0.3), 'alarm'], [P.at(8, 0.3), 'alarm'], [P.at(9, 0.3), 'alarm'], [P.at(10, 0.4), 'buzz'], [P.at(12, 0.3), 'poof'], [P.at(13, 0.2), 'whoosh'], [P.at(16, 0.2), 'poof']],
    narr: NARR,
    ask: '普通の人、婚活で出会える？出会えない？',
    caption: 'もしも婚活がアウトレットだったら？\n\n婚活女子の不満から。清潔感があって、会話ができて、誠実。普通の人でいいのに、いない。\nある日、婚活は本当にアウトレットになった。\n並んでいるのは、新作ではなく型落ち。\n普通の人は？ 店員は答える。普通の人は、店に並ぶ前に売れます。\n清潔感のある人は、大学で売り切れ。誠実な人は、職場で売り切れ。会話のできる人は、友達の紹介で予約済み。\n残っているのは、訳あり品のワゴン。\nふと自分の背中を見る。そこにも値札がついている。\n隣の売り場では、男たちが同じことを言っている。普通の子がいない。\n\n結果：アウトレットに普通の人はいなかった。お互いに。\n普通の人とは、店に並ぶ前に売れた人のことだったのかもしれない。\n\n普通の人、婚活で出会える？出会えない？ コメントで教えて。\n\n※風刺ネタです。婚活がアウトレットになるのは、もしもの設定です。登場する人物・店は架空です',
    hashtags: ['もしもラボ', 'もしも', '婚活', 'アウトレット', '普通の人'],
    endStats: [['清潔感のある人', '大学で売り切れ', 'もしもの売り場'], ['誠実な人', '職場で売り切れ', 'もしもの売り場'], ['会話のできる人', '友達の紹介で予約済み', 'もしもの売り場']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
