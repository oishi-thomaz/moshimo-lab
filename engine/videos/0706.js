import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSuit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeCounter, makePot, makeTrash, makeTable } from '../scenes/home.js';

// もしも専業主婦の家事に、毎月請求書が届いたら？（皮肉回・台本 S107・図星／男と女のもしも）
// 2026/11/18 ゆうと承認（投稿サーバーで ok）。専業主婦は楽 と言う夫を、請求書が届くブーメランの形で。後半は夫が動く側に寄せて説教にしない
// 数字（一次資料で確認・2026/11/19）：内閣府 経済社会総合研究所「無償労働の貨幣評価」（2023年公表・2021年の値。2021musyou00.pdf）
//  家事活動の1人あたり年間評価額（機会費用法）：無業有配偶の女性 298万9千円、男性 60万4千円（女性全体は194万3千円）
//  約299万円・約60万円・約300万円（298.9万円の丸め）。画面に 2021年・内閣府の推計 と出す
// 請求書の内訳・金額の伏せ字は筋の中の描写。実在の会社・ロゴは出さない

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#e8dccc', ground: '#a8988a' }); hemi.intensity = 1.3;
const OTTO = makeSuit({ jacket: '#3a4256', tie: '#b23a3a' }); S.add(OTTO);
const sweatO = makeSweat(); OTTO.userData.head.add(sweatO);
const TSUMA = makeWoman({ shirt: '#d88a6a', hair: '#3a2620', pants: '#4a4f5e', scale: 0.97 }); S.add(TSUMA);
const APRON = box(0.42, 0.55, 0.04, mat('#f0e0c0')); APRON.position.set(0, 1.0, 0.16); TSUMA.add(APRON);
const BAG = box(0.34, 0.26, 0.1, mat('#3a3028')); BAG.position.set(0, -0.72, 0.05); OTTO.userData.arms[0].add(BAG);

// 請求書（canvas）。rows の行を順に書き、cross 本まで線で消す
const INVC = document.createElement('canvas'); INVC.width = 640; INVC.height = 860; const INVT = new THREE.CanvasTexture(INVC); INVT.colorSpace = THREE.SRGBColorSpace; let invKey = '';
const ROWS = ['朝ごはん', 'お弁当', '晩ごはん', '洗濯', '掃除', '子どもの送り迎え', 'トイレットペーパーの補充', 'ゴミ袋のセット'];
function drawInv(n, cross = 0, total = true) {
  const k = n + ':' + cross + ':' + total; if (k === invKey) return; invKey = k; const g = INVC.getContext('2d');
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 640, 860); g.fillStyle = '#c8242c'; g.fillRect(0, 0, 640, 120);
  g.fillStyle = '#fff'; g.font = '900 70px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('家事の請求書', 320, 62);
  g.textAlign = 'left';
  for (let i = 0; i < Math.min(n, ROWS.length); i++) {
    const y = 170 + i * 68; g.fillStyle = '#2a2e38'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText(ROWS[i], 40, y); g.fillStyle = '#9aa0aa'; g.fillText('¥', 540, y);
    g.strokeStyle = '#d8d0c0'; g.lineWidth = 2; g.beginPath(); g.moveTo(30, y + 30); g.lineTo(610, y + 30); g.stroke();
    if (i < cross) { g.strokeStyle = '#2a8a4a'; g.lineWidth = 8; g.beginPath(); g.moveTo(30, y); g.lineTo(600, y); g.stroke(); }
  }
  if (total) { g.fillStyle = '#c8242c'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('合計 ¥ ???,???', 320, 790); }
  INVT.needsUpdate = true;
}
const INV = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.61), new THREE.MeshBasicMaterial({ map: INVT, side: THREE.DoubleSide })); S.add(INV);
const ENVS = []; for (let i = 0; i < 3; i++) { const e = box(0.5, 0.02, 0.3, mat(['#f4ecd8', '#e8e0d0', '#f8f0e0'][i])); S.add(e); ENVS.push(e); }

// ---------- A：玄関（原点） ----------
const roomA = room({ x: 0, w: 8, d: 6, h: 3.2, wall: '#efe6d6', floor: '#b8a48a' });
const DOOR = box(1.1, 2.2, 0.08, mat('#8a6a48')); DOOR.position.set(0, 1.1, -2.94); S.add(DOOR);
const SLOT = box(0.4, 0.06, 0.04, mat('#c8b070')); SLOT.position.set(0, 1.1, -2.88); S.add(SLOT);
const STEP = box(8, 0.18, 2.2, mat('#d8ccb8')); STEP.position.set(0, 0.09, 1.0); S.add(STEP);
const SHOES = [[-0.5, '#2a2a30'], [0.5, '#c84a5a']].map(([x, c]) => { const s = box(0.18, 0.1, 0.3, mat(c)); s.position.set(x, 0.05, -0.6); S.add(s); return s; });
const basa = label('バサッ', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.55 }); S.add(basa);
const sparkA = makeSparkles(80, 0.05, 0xffffff); S.add(sparkA.points); sparkA.init([[0.1, 0.5, -1.2]], 0.5, 0.5);
const raku = label('専業主婦は 楽でいいよな', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(raku);

// ---------- B：台所（x=60） ----------
const BX = 60;
room({ x: BX, w: 9, d: 7, h: 3.0, wall: '#f2ece0', floor: '#c9b8a0' });
const CNT = makeCounter(); CNT.position.set(BX - 0.5, 0, -2.9); S.add(CNT);
const POT = makePot(); POT.position.set(BX - 0.5 + 1.2, 0.97, -2.9); S.add(POT);
const BENTO = new THREE.Group(); { const b = box(0.5, 0.12, 0.34, mat('#2a2e38')); BENTO.add(b); const rice = box(0.22, 0.02, 0.28, mat('#fbfbf6')); rice.position.set(-0.12, 0.07, 0); BENTO.add(rice); ['#f0a030', '#5ab04a', '#e8503a'].forEach((c, i) => { const o = box(0.08, 0.04, 0.08, mat(c)); o.position.set(0.06 + (i % 2) * 0.1, 0.08, -0.07 + i * 0.07); BENTO.add(o); }); } BENTO.position.set(BX - 1.4, 0.98, -2.8); S.add(BENTO);
const WASHER = new THREE.Group(); { const b = box(0.8, 1.0, 0.7, mat('#f4f4f2')); b.position.y = 0.5; WASHER.add(b); const d = new THREE.Mesh(new THREE.CircleGeometry(0.25, 20), mat('#9ab8d0')); d.position.set(0, 0.55, 0.36); WASHER.add(d); } WASHER.position.set(BX + 2.6, 0, -2.9); S.add(WASHER);
const TP_ROLL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 14), mat('#fbfbf6')); TP_ROLL.rotation.z = Math.PI / 2; S.add(TP_ROLL);
const KID = makeWoman({ shirt: '#f2c14e', hair: '#3a2620', pants: '#3a5a8a', scale: 0.6 }); S.add(KID);
const SCHOOLBAG = box(0.3, 0.32, 0.16, mat('#c8242c')); SCHOOLBAG.position.set(0, 1.15, -0.2); KID.add(SCHOOLBAG);
const BLAB = ['1枚目', '2枚目', '3枚目'].map(s => { const l = label(s, { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(l); return l; });
const namae = label('名前のない家事', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.15 }); S.add(namae);

// ---------- C：国の計算（x=120） ----------
const CX = 120;
flat(30, 20, '#3a3448', CX, -2);
const BACKC = box(16, 8, 0.2, mat('#2c2838')); BACKC.position.set(CX, 4, -6); S.add(BACKC);
const BC = [['専業主婦（妻）', '#e85a7a'], ['男性 1人あたり', '#5a9ae8']].map(([n, c]) => { const b = box(0.9, 1, 0.5, mat(c)); S.add(b); const l = label(n, { w: 760, size: 84, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.95 }); S.add(l); const v = label('', { w: 640, size: 110, color: c, stroke: 14, strokeColor: '#1a1a22', sx: 0.95 }); v.material.depthTest = false; v.renderOrder = 9; S.add(v); return { b, l, v }; });
const naikaku = label('内閣府の推計（2021年）', { w: 1000, size: 84, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 1.5 }); S.add(naikaku);

// ---------- D：ゴミ出し（x=180） ----------
const DX = 180;
room({ x: DX, w: 8, d: 6, h: 3.0, wall: '#f2ece0', floor: '#c9b8a0' });
const TRASH = makeTrash(); TRASH.position.set(DX + 0.6, 0, -1.6); S.add(TRASH);
const GBAG = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat('#e8eef2')); GBAG.scale.set(1, 1.2, 1); S.add(GBAG);
const NEWBAG = box(0.6, 0.02, 0.6, mat('#dfe8ee')); S.add(NEWBAG);
const set_ = label('袋まで セット', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.0 }); S.add(set_);

// ---------- 結果・ひねり ----------
const harawazu = label('払わずに済んでいた 約300万円', { w: 1300, size: 84, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.85 }); S.add(harawazu);
const nefuda = label('値札のない 年300万円の仕事', { w: 1300, size: 84, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.85 }); S.add(nefuda);
const TAG = new THREE.Group(); { const t = box(0.5, 0.3, 0.02, mat('#f4ecd8')); TAG.add(t); const h = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), mat('#3a2a1a')); h.position.set(-0.2, 0, 0.012); TAG.add(h); } S.add(TAG);

const LABELS = [basa, raku, ...BLAB, namae, naikaku, set_, harawazu, nefuda, ...BC.flatMap(x => [x.l, x.v])];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; }
function reset() {
  [OTTO, TSUMA, KID].forEach(clearP); LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0);
  INV.visible = false; INV.rotation.set(0, 0, 0); ENVS.forEach(e => e.visible = false); BAG.visible = true; TP_ROLL.visible = false; BC.forEach(x => x.b.visible = false); GBAG.visible = false; NEWBAG.visible = false; TAG.visible = false; TRASH.userData.open(0);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function ottoAt(x, z, ry = 0) { OTTO.visible = true; OTTO.position.set(x, 0.18, z); OTTO.rotation.y = ry; }
function holdInv(p, s = 0.42, dy = 0) { p.userData.arms.forEach((a, i) => a.rotation.set(-1.25, 0, i ? 0.25 : -0.25)); p.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.25 + dy, 0.5); p.localToWorld(v); INV.visible = true; INV.position.copy(v); INV.rotation.set(-0.15, p.rotation.y, 0); INV.scale.setScalar(s); }
function doorCam(u = 0) { look(lerp(0.45, 0.3, u), 2.05, lerp(5.2, 4.8, u), 0.05, 1.55, -1.1, 50); }
function shot0(t) { // 0秒＝サムネ：帰ってきた夫の足もとに、ポストから 家事 の請求書がバサッと落ちる
  reset(); lift(0); ottoAt(0.1, -1.5, 0); OTTO.userData.head.rotation.x = 0.35;
  drawInv(8, 0, true); const k = easeOut(clamp((t - 0.05) / 0.25));
  INV.visible = true; INV.position.set(lerp(0.45, 0.15, k), lerp(1.0, 0.5, k), lerp(-0.6, -0.45, k)); INV.rotation.set(-Math.PI / 2 * lerp(0.3, 0.6, k), 0, lerp(0.4, 0.12, k)); INV.scale.setScalar(1.3);
  ENVS.forEach((e, i) => { e.visible = t > TP; e.position.set(-0.45 + i * 0.45, 0.2 + i * 0.01, -0.85 + (i % 2) * 0.25); e.rotation.y = (i - 1) * 0.4; });
  if (t > TP) { sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.2 : 0; say(basa, t, TP, 0.85, 1.05, -0.4, 0.45); }
  doorCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 請求書を開いた夫が、金額を見て靴をはいたまま固まる
  reset(); lift(150); ottoAt(0.1, -1.3, 0); BAG.visible = false; drawInv(8, 0, true); holdInv(OTTO, 0.42); OTTO.userData.head.rotation.x = 0.35; if (t > d * 0.4) sweatO.userData.set(1, t);
  const u = ease(clamp(t / d)); look(lerp(0.5, 0.35, u), 1.85, lerp(2.4, 2.0, u), 0.1, 1.55, -1.3, 50);
  return S;
}
function sFuman(t, d) { // 妻たちの不満から。専業主婦は楽でいいよな、と言われる
  reset(); lift(150); ottoAt(-0.5, -1.2, 0.35); OTTO.userData.arms[1].rotation.set(-0.6, 0, 0.4); OTTO.userData.head.rotation.x = -0.1;
  TSUMA.visible = true; TSUMA.position.set(0.8, 0.18, -1.5); TSUMA.rotation.y = -0.5; TSUMA.userData.head.rotation.x = 0.15;
  if (t > d * 0.3) say(raku, t, d * 0.3, 0.1, 2.3, -1.2, 1.3);
  look(0.2, 1.8, 4.2, 0.15, 1.35, -1.3, 50);
  return S;
}
function kitchenCam(u = 0, x = 0) { look(BX + x + lerp(0.6, 0.4, u), 1.9, lerp(4.4, 4.0, u), BX + x, 1.4, -2.0, 50); }
function wifeAt(x, z, ry = Math.PI - 1.3) { TSUMA.visible = true; TSUMA.position.set(x, 0, z); TSUMA.rotation.y = ry; }
function invSide(n, x, y, z) { drawInv(n, 0, false); INV.visible = true; INV.position.set(x * 0.6 + BX * 0.4 + 0.35, y - 0.05, z + 0.3); INV.rotation.set(0, -0.2, 0); INV.scale.setScalar(0.72); }
function sMai1(t, d) { // 1枚目。朝ごはん、お弁当、晩ごはん。毎日3回分
  reset(); lift(150); wifeAt(BX - 0.2, -2.0); TSUMA.userData.arms.forEach((a, i) => a.rotation.set(-1.0 + Math.sin(t * 6 + i) * 0.15, 0, 0)); POT.userData.lid.position.y = 0.26 + Math.max(0, Math.sin(t * 9)) * 0.03;
  invSide(Math.min(3, 1 + Math.floor(t / (d / 3.2))), BX + 1.35, 1.75, -1.6);
  say(BLAB[0], t, 0.1, BX + 1.35, 2.75, -1.6, 0.5);
  setHud('家事の請求書', '1枚目', 1);
  kitchenCam(ease(clamp(t / d)), 0.4);
  return S;
}
function sMai2(t, d) { // 2枚目。洗濯、掃除、子どもの送り迎え
  reset(); lift(150); wifeAt(BX + 1.6, -2.0, Math.PI - 0.6); TSUMA.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0));
  KID.visible = true; KID.position.set(BX + 1.0, 0, -1.4); KID.rotation.y = 0.4; KID.userData.arms[1].rotation.set(-0.8, 0, 0);
  invSide(Math.min(6, 4 + Math.floor(t / (d / 3.2))), BX - 0.6, 1.75, -1.6); drawInv(Math.min(6, 4 + Math.floor(t / (d / 3.2))), 0, false);
  say(BLAB[1], t, 0.1, BX - 0.6, 2.75, -1.6, 0.5);
  setHud('家事の請求書', '2枚目', 1);
  kitchenCam(ease(clamp(t / d)), 0.6);
  return S;
}
function sMai3(t, d) { // 3枚目。名前のない家事。トイレットペーパーの補充まで
  reset(); lift(150); wifeAt(BX - 0.9, -1.8, Math.PI - 1.3); TSUMA.userData.arms[1].rotation.set(-1.3, 0, 0.2);
  TSUMA.updateMatrixWorld(); const v = new THREE.Vector3(0.25, 0.85, 0.45); TSUMA.localToWorld(v); TP_ROLL.visible = true; TP_ROLL.position.copy(v);
  invSide(t > d * 0.5 ? 8 : 7, BX + 0.6, 1.75, -1.6); drawInv(t > d * 0.5 ? 8 : 7, 0, false);
  say(BLAB[2], t, 0.1, BX + 0.6, 2.75, -1.6, 0.5); if (t > d * 0.3) say(namae, t, d * 0.3, BX - 1.4, 2.35, -1.8, 0.95);
  setHud('家事の請求書', '3枚目', 1);
  kitchenCam(ease(clamp(t / d)), -0.2);
  return S;
}
function sHontou(t, d) { // でも、本当はいくらになるのか
  reset(); lift(150); ottoAt(0.1, -1.3, 0); BAG.visible = false; drawInv(8, 0, true); holdInv(OTTO, 0.42); OTTO.userData.head.rotation.x = 0.35;
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.15, u), lerp(1.75, 1.6, u), lerp(1.6, 0.9, u), 0.12, 1.45, -1.0, 50);
  return S;
}
function barCam() { look(CX, 1.7, 8.2, CX, 1.5, 0, 50); }
function bars(k1, k2) {
  const hs = [2.4 * k1, 2.4 * (60.4 / 298.9) * k2];
  BC.forEach((x, i) => { const h = Math.max(0.01, hs[i]); x.b.visible = true; x.b.scale.y = h; x.b.position.set(CX - 0.8 + i * 1.6, h / 2, 0); x.l.visible = true; x.l.position.set(CX - 0.8 + i * 1.6, -0.0 + 0.0, 0.7); x.l.userData.size(0.8); x.l.position.y = 0.25; });
}
function sKuni(t, d) { // 国の計算では、専業主婦の家事は1年で約299万円分
  reset(); lift(230); const k = easeOut(clamp((t - d * 0.3) / 1.2)); bars(k, 0); BC[1].b.visible = false;
  if (k > 0.05) { BC[0].v.visible = true; BC[0].v.userData.set('約' + Math.round(299 * k) + '万円'); BC[0].v.position.set(CX - 0.8, 2.4 * k + 0.35, 0.3); }
  naikaku.visible = true; naikaku.position.set(CX, 3.3, 0); naikaku.userData.size(1.3);
  setTop('家事の値段（無業の妻・1人1年・2021年）', '約' + Math.round(299 * k) + '万円', fade(t, d * 0.3, d, 0.25), RED); setHud('内閣府', '無償労働の貨幣評価', 1);
  barCam();
  return S;
}
function sDansei(t, d) { // 男性1人あたりの家事は、1年で約60万円分
  reset(); lift(230); const k = easeOut(clamp((t - 0.3) / 1.0)); bars(1, k);
  BC[0].v.visible = true; BC[0].v.userData.set('約299万円'); BC[0].v.position.set(CX - 0.8, 2.75, 0.3);
  if (k > 0.05) { BC[1].v.visible = true; BC[1].v.userData.set('約' + Math.round(60 * k) + '万円'); BC[1].v.position.set(CX + 0.8, 2.4 * (60.4 / 298.9) * k + 0.35, 0.3); }
  naikaku.visible = true; naikaku.position.set(CX, 3.3, 0); naikaku.userData.size(1.3);
  setTop('家事の値段（男性・1人1年・2021年）', '約' + Math.round(60 * k) + '万円', fade(t, 0.3, d, 0.25), BLUE); setHud('内閣府', '無償労働の貨幣評価', 1);
  barCam();
  return S;
}
function sGomi(t, d) { // 次の日。夫が、ゴミ出しのついでに、新しいゴミ袋までセットする
  reset(); lift(150); ottoAt(DX + 0.0, -1.2, 0.6); OTTO.position.y = 0; BAG.visible = false;
  const late = t > d * 0.5;
  if (!late) { OTTO.userData.arms[1].rotation.set(-0.5, 0, 0.2); OTTO.updateMatrixWorld(); const v = new THREE.Vector3(0.32, 0.55, 0.15); OTTO.localToWorld(v); GBAG.visible = true; GBAG.position.copy(v); }
  else { OTTO.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); OTTO.rotation.x = 0.25; TRASH.userData.open(1); NEWBAG.visible = true; NEWBAG.position.set(DX + 0.6, lerp(1.3, 0.85, clamp((t - d * 0.5) / 0.6)), -1.6); say(set_, t, d * 0.6, DX + 0.3, 2.15, -1.4, 0.9); }
  setHud('請求書のあと', '次の日', 1);
  look(DX + 0.4, 1.8, 2.9, DX + 0.3, 1.1, -1.4, 50);
  return S;
}
function sGyou(t, d) { // 請求書の行が、1行ずつ減っていく
  reset(); lift(280); INV.visible = true; drawInv(8, Math.min(5, Math.floor(t / (d / 6))), true); INV.position.set(DX, 1.7, -1.2); INV.rotation.set(0, 0, 0); INV.scale.setScalar(1.15);
  look(DX, 1.7, 3.1, DX, 1.7, -1.2, 50);
  return S;
}
function sKekka(t, d) { // 結果：家事に値段がついて、夫が知ったのは、楽な人がいたんじゃなく、払わずに済んでいた約300万円だった
  reset(); lift(150); ottoAt(-0.4, -1.3, 0.3); TSUMA.visible = true; TSUMA.position.set(0.7, 0.18, -1.5); TSUMA.rotation.y = -0.4; OTTO.userData.head.rotation.x = 0.25; BAG.visible = false;
  drawInv(8, 5, true); holdInv(OTTO, 0.38);
  if (t > d * 0.6) say(harawazu, t, d * 0.6, 0.15, 2.5, -1.3, 1.6);
  setTop('結果', '約300万円', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(0.15, lerp(1.8, 2.0, u), lerp(3.0, 3.8, u), 0.15, 1.4, -1.3, 50);
  return S;
}
function sNefuda(t, d) { // 専業主婦の家事は、値札が付いていないだけの、年300万円の仕事だったのかもしれない
  reset(); lift(150); wifeAt(BX - 0.2, -2.0); TSUMA.userData.arms.forEach((a, i) => a.rotation.set(-1.0 + Math.sin(t * 6 + i) * 0.15, 0, 0));
  TAG.visible = true; TAG.position.set(BX + 0.25, 1.25, -1.75); TAG.rotation.z = Math.sin(t * 2) * 0.1;
  if (t > d * 0.4) say(nefuda, t, d * 0.4, BX - 0.1, 2.5, -1.8, 1.6);
  kitchenCam(0.6, 0);
  return S;
}
function sAsk(t) { reset(); lift(0); ottoAt(0.1, -1.5, 0); OTTO.userData.head.rotation.x = 0.35; drawInv(8, 0, true); INV.visible = true; INV.position.set(0.15, 0.5, -0.45); INV.rotation.set(-Math.PI / 2 * 0.6, 0, 0.12); INV.scale.setScalar(1.3); ENVS.forEach((e, i) => { e.visible = true; e.position.set(-0.45 + i * 0.45, 0.2 + i * 0.01, -0.85 + (i % 2) * 0.25); e.rotation.y = (i - 1) * 0.4; }); doorCam(0); return S; }

const NARR = { '請求書': 'せいきゅうしょ', '開いた': 'ひらいた', '夫': 'おっと', '金額': 'きんがく', '見て': 'みて', '靴': 'くつ', '固まる': 'かたまる', '妻たち': 'つまたち', '不満': 'ふまん', '専業主婦': 'せんぎょうしゅふ', '楽': 'らく', '言われる': 'いわれる', '1枚目': 'いちまいめ', '朝ごはん': 'あさごはん', 'お弁当': 'おべんとう', '晩ごはん': 'ばんごはん', '毎日': 'まいにち', '3回分': 'さんかいぶん', '2枚目': 'にまいめ', '洗濯': 'せんたく', '掃除': 'そうじ', '子ども': 'こども', '送り迎え': 'おくりむかえ', '3枚目': 'さんまいめ', '名前': 'なまえ', '家事': 'かじ', '補充': 'ほじゅう', '本当は': 'ほんとうは', '国': 'くに', '計算': 'けいさん', '1年': 'いちねん', '約299万円分': 'やくにひゃくきゅうじゅうきゅうまんえんぶん', '男性1人あたり': 'だんせいひとりあたり', '約60万円分': 'やくろくじゅうまんえんぶん', '次の日': 'つぎのひ', 'ゴミ出し': 'ごみだし', '新しい': 'あたらしい', 'ゴミ袋': 'ごみぶくろ', '行': 'ぎょう', '1行ずつ': 'いちぎょうずつ', '減っていく': 'へっていく', '結果：': '結果、', '値段': 'ねだん', '知った': 'しった', '人': 'ひと', '払わずに': 'はらわずに', '済んでいた': 'すんでいた', '約300万円': 'やくさんびゃくまんえん', '値札': 'ねふだ', '付いていない': 'ついていない', '年300万円': 'ねんさんびゃくまんえん', '仕事': 'しごと', '月': 'つき', '払う': 'はらう' };
const P = planTimes([
  ['請求書を開いた夫が、<br>金額を見て', (t, d) => sKatamaru(t, 2 * d)],
  ['靴をはいたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['妻たちの不満から。専業主婦は<br>楽でいいよな、と言われる。', sFuman],
  ['1枚目。朝ごはん、お弁当、<br>晩ごはん。毎日3回分。', sMai1],
  ['2枚目。洗濯、掃除、<br>子どもの送り迎え。', sMai2],
  ['3枚目。名前のない家事。', (t, d) => sMai3(t, 2 * d)],
  ['トイレットペーパーの<br>補充まで。', (t, d) => sMai3(t + d, 2 * d)],
  ['でも、本当は<br>いくらになるのか。', sHontou],
  ['国の計算では、専業主婦の<br>家事は1年で約299万円分。', sKuni],
  ['男性1人あたりの家事は、<br>1年で約60万円分。', sDansei],
  ['次の日。夫が、ゴミ出しの<br>ついでに、', (t, d) => sGomi(t, 2 * d)],
  ['新しいゴミ袋までセットする。', (t, d) => sGomi(t + d, 2 * d)],
  ['請求書の行が、<br>1行ずつ減っていく。', sGyou],
  ['結果：家事に値段がついて、<br>夫が知ったのは、', (t, d) => sKekka(t, 3 * d)],
  ['楽な人がいたんじゃなく、', (t, d) => sKekka(t + d, 3 * d)],
  ['払わずに済んでいた<br>約300万円だった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['専業主婦の家事は、値札が<br>付いていないだけの、', (t, d) => sNefuda(t, 2 * d)],
  ['年300万円の仕事<br>だったのかもしれない。', (t, d) => sNefuda(t + d, 2 * d)],
  ['家事、月いくらなら払う？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0706',
    v2: true,
    tt: 'main',
    hookLine: '帰ってきた夫の足もとに、ポストから 家事 の請求書がバサッと落ちる。',
    series: '男と女のもしも',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも専業主婦の家事に、毎月請求書が届いたら？',
    titleHtml: 'もしも専業主婦の<br>家事に、毎月<br>請求書が届いたら？',
    mood: 'tension', seed: 706, hits: [TP, P.at(13), P.at(17)], risers: [P.at(7)], impacts: [P.at(8, 1.2), P.at(9, 1.0), P.at(15, 0.3)],
    sfx: [[0.05, 'whoosh'], [TP, 'poof'], [P.at(1, 0.3), 'meter', 0.3], [P.at(3, 0.3), 'bubble'], [P.at(4, 0.3), 'bubble'], [P.at(5, 0.3), 'bubble'], [P.at(11, 0.3), 'whoosh'], [P.at(17, 0.3), 'alarm']],
    narr: NARR,
    ask: '家事、月いくらなら払う？',
    caption: 'もしも専業主婦の家事に、毎月請求書が届いたら？\n\n請求書を開いた夫が、金額を見て靴をはいたまま固まる。\n妻たちの不満から。専業主婦は楽でいいよな、と言われる。\n1枚目。朝ごはん、お弁当、晩ごはん。毎日3回分。\n2枚目。洗濯、掃除、子どもの送り迎え。\n3枚目。名前のない家事。トイレットペーパーの補充まで。\nでも、本当はいくらになるのか。\n国の計算では、専業主婦の家事は1年で約299万円分。\n男性1人あたりの家事は、1年で約60万円分。\n次の日。夫が、ゴミ出しのついでに、新しいゴミ袋までセットする。\n請求書の行が、1行ずつ減っていく。\n\n結果：家事に値段がついて、夫が知ったのは、楽な人がいたんじゃなく、払わずに済んでいた約300万円だった。\n専業主婦の家事は、値札が付いていないだけの、年300万円の仕事だったのかもしれない。\n\n家事、月いくらなら払う？ コメントで教えて。\n\n※風刺ネタです。請求書が届くのは、もしもの設定です。登場する人物は架空です\n出典：内閣府 経済社会総合研究所「無償労働の貨幣評価」（2023年公表・2021年の値。家事活動の1人あたり年間評価額・機会費用法：無業有配偶の女性 298.9万円、男性 60.4万円）',
    hashtags: ['もしもラボ', 'もしも', '専業主婦', '家事', '夫婦'],
    endStats: [['専業主婦の家事', '約299万円／年', '内閣府の推計・2021年'], ['男性1人あたりの家事', '約60万円／年', '内閣府の推計・2021年'], ['家事の正体', '値札のない仕事', 'かもしれない']],
    sources: '出典：内閣府 経済社会総合研究所「無償労働の貨幣評価」（2021年の値）',
  },
});
