import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight } from '../scenes/room.js';
import { stage } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも宝くじ1等が当たったら手取りはいくら？（公式資料からの試算。購入をすすめるものではない）
// 数字：年末ジャンボ（第1082回、2025年11/21〜12/23発売）1等7億円・前後賞 各1億5,000万円＝合計10億円、1枚300円（福岡市・愛知県 発売団体の告知）
//       発売総額 1,380億円・うち当せん金 690億円（50.0%）・1等最高額7億円（総務省 地方財政審議会 2025年7月29日 付議資料）
//       1等 23本（愛知県 告知）→ 1,380億円÷300円＝4.6億枚÷23本＝2,000万枚に1本（推計）
//       当せん金品には所得税を課さない（当せん金付証票法 第13条：e-Gov 法令）
//       贈与税（暦年課税）基礎控除110万円、特例税率 4,500万円超 55%・控除額640万円（18歳以上の子・孫が父母・祖父母から：国税庁 No.4408）
//         → 1億円を18歳以上の子に：(1億−110万)×55%−640万＝4,799.5万円 → 約4,800万円（推計）
//       預貯金の利子 所得税・復興特別所得税15.315%＋地方税5%＝20.315%（国税庁 No.1310）

const TICKET_W = 6.4, TICKET_H = 3.2;
// ---------- ticket (generic, fictional design) ----------
const tc = document.createElement('canvas'); tc.width = 1024; tc.height = 512;
const tTex = new THREE.CanvasTexture(tc); tTex.colorSpace = THREE.SRGBColorSpace;
let tLast = '';
function drawTicket(last, hit) {
  const key = last + '|' + hit; if (key === tLast) return; tLast = key;
  const g = tc.getContext('2d');
  g.fillStyle = '#f6f1e3'; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#2f7f86'; g.fillRect(0, 0, 1024, 110);
  g.fillStyle = '#fff'; g.font = '900 64px "Noto Sans CJK JP"'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('もしもくじ', 40, 58);
  g.textAlign = 'right'; g.font = '700 40px "Noto Sans CJK JP"'; g.fillText('1枚 300円', 984, 58);
  g.textAlign = 'left'; g.fillStyle = '#59606e'; g.font = '700 40px "Noto Sans CJK JP"';
  g.fillText('当せん番号', 40, 190); g.fillText('あなたの番号', 40, 330);
  g.fillStyle = '#1a1d24'; g.font = '900 84px "Noto Sans CJK JP"'; g.textAlign = 'right';
  g.fillText('08組 123456', 984, 190);
  g.fillStyle = hit ? '#d6332f' : '#1a1d24';
  g.fillText('08組 12345' + last, 984, 330);
  g.fillStyle = '#d9d2bd'; g.fillRect(40, 400, 944, 4);
  g.fillStyle = '#8a8f99'; g.font = '700 30px "Noto Sans CJK JP"'; g.textAlign = 'left'; g.fillText('※イメージ（架空のくじ）', 40, 456);
  tTex.needsUpdate = true;
}
const ticket = new THREE.Group(); stage.add(ticket);
{
  const back = box(TICKET_W, TICKET_H, 0.06, mat('#e8e0c8')); ticket.add(back);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(TICKET_W, TICKET_H), new THREE.MeshBasicMaterial({ map: tTex })); face.position.z = 0.035; ticket.add(face);
}
const stamp = textSprite('1等', { w: 256, h: 256, size: 130, color: '#ffffff', bg: '#d6332f', radius: 128, sx: 1.4, depthTest: false }); stamp.renderOrder = 8; ticket.add(stamp); stamp.position.set(2.3, -1.3, 0.2);
drawTicket('0', false);

// ---------- confetti ----------
const NC = 260;
const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), NC); conf.frustumCulled = false; stage.add(conf);
const CR = rng(28); const CD = [];
const CC = ['#ff6b6b', '#ffd166', '#7ff0c8', '#4fa3d1', '#ffffff', '#c792ea'].map(c => new THREE.Color(c));
for (let i = 0; i < NC; i++) { CD.push({ x: CR() - .5, z: CR() - .5, ph: CR(), sp: 0.5 + CR() * 0.7, rx: CR() * 6, ry: CR() * 6 }); conf.setColorAt(i, CC[i % CC.length]); }
const dm = new THREE.Object3D();
// mode 'fall' (falling over w×d from top) / 'rest' (on the floor) / 'off'
function setConfetti(mode, t, { w = 14, d = 6, top = 10, cx = 0, cz = 0, y0 = 0.32, n = NC } = {}) {
  conf.visible = mode !== 'off'; if (!conf.visible) return;
  for (let i = 0; i < NC; i++) {
    const c = CD[i];
    if (i >= n) dm.position.set(0, -50, 0);
    else if (mode === 'fall') { const y = top - ((t * c.sp * 2.2 + c.ph * top) % top); dm.position.set(cx + c.x * w + Math.sin(t * 2 + i) * 0.2, Math.max(y0, y), cz + c.z * d); dm.rotation.set(c.rx + t * 3 * c.sp, c.ry + t * 2, 0); }
    else { dm.position.set(cx + c.x * w, y0 + (i % 4) * 0.003, cz + c.z * d); dm.rotation.set(-Math.PI / 2, 0, c.ry); }
    dm.updateMatrix(); conf.setMatrixAt(i, dm.matrix);
  }
  conf.instanceMatrix.needsUpdate = true;
}

// ---------- money stacks (generic bundles, not real banknotes) ----------
const bundleM = mat('#efe6c8'), bandM = mat('#c9504a');
function makeStack(n = 10) { // one stack = 1億円（10段）
  const g = new THREE.Group(); const bs = [];
  for (let i = 0; i < n; i++) {
    const b = new THREE.Group();
    const p = box(0.9, 0.16, 0.45, bundleM); b.add(p);
    const band = box(0.12, 0.165, 0.455, bandM); b.add(band);
    b.position.y = 0.08 + i * 0.165; g.add(b); bs.push(b);
  }
  g.userData.bs = bs; return g;
}
const STACKS = []; // 10 stacks = 10億円
const pile = new THREE.Group(); stage.add(pile);
for (let i = 0; i < 10; i++) { const s = makeStack(); s.position.set((i % 5 - 2) * 1.2, 0.3, Math.floor(i / 5) * 0.9 - 0.45); pile.add(s); STACKS.push(s); }
function setPile(k) { // k: 0..10 stacks appear
  STACKS.forEach((s, i) => { const u = clamp(k - i); s.visible = u > 0; s.scale.y = Math.max(0.001, easeOut(u)); });
}
const pileLab = textSprite('10億円', { w: 512, h: 128, size: 90, color: '#ffffff', stroke: 10, sx: 3.0, depthTest: false }); pileLab.renderOrder = 7; pile.add(pileLab); pileLab.position.set(0, 2.6, 0);

// ---------- gift shot: me, child, tax box ----------
const me = makePerson({ skin: SKIN[0], hair: HAIR[2], shirt: '#e05a4f', pants: '#2b3346' }); stage.add(me);
const kid = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#4fa3d1', pants: '#3b3f4a', long: true }); stage.add(kid);
const meLab = textSprite('あなた', { w: 384, h: 128, size: 66, color: '#fff', bg: 'rgba(15,26,43,.85)', sx: 1.7, depthTest: false }); meLab.renderOrder = 6; stage.add(meLab);
const kidLab = textSprite('子ども（18歳以上）', { w: 640, h: 128, size: 60, color: '#fff', bg: 'rgba(15,26,43,.85)', sx: 2.7, depthTest: false }); kidLab.renderOrder = 6; stage.add(kidLab);
const gift = makeStack(); stage.add(gift);
const taxBox = new THREE.Group(); stage.add(taxBox);
{ const b = box(1.6, 1.2, 1.2, mat('#59606e')); b.position.y = 0.6; taxBox.add(b); const slot = box(1.0, 0.05, 0.2, mat('#1a1d24')); slot.position.y = 1.22; taxBox.add(slot); }
const taxLab = textSprite('贈与税', { w: 384, h: 128, size: 70, color: '#fff', bg: '#c9504a', sx: 2.1, depthTest: false }); taxLab.renderOrder = 6; taxBox.add(taxLab); taxLab.position.set(0, 0.6, 0.75);
const flyTax = makeStack(5); stage.add(flyTax); // about half of the gift flies to the tax box
function giftSet(on) { [me, kid, meLab, kidLab, gift, taxBox, flyTax].forEach(o => o.visible = on); }

// ---------- big phone (bank app, fictional bank) ----------
const phone = new THREE.Group(); stage.add(phone);
const pBody = box(3.3, 6.4, 0.3, mat('#1a1d24')); pBody.position.y = 3.6; phone.add(pBody);
const pc = document.createElement('canvas'); pc.width = 512; pc.height = 1000;
const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace;
const pScr = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.86), new THREE.MeshBasicMaterial({ map: pTex })); pScr.position.set(0, 3.6, 0.16); phone.add(pScr);
let pLast = '';
function drawPhone(k) { // k: 0..1 how far the interest line is shown
  const key = Math.round(k * 20); if (key === pLast) return; pLast = key;
  const g = pc.getContext('2d');
  g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 512, 1000);
  g.fillStyle = '#2f7f86'; g.fillRect(0, 0, 512, 150);
  g.fillStyle = '#fff'; g.font = '900 48px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.fillText('もしも銀行', 256, 98);
  g.fillStyle = '#59606e'; g.font = '700 38px "Noto Sans CJK JP"'; g.fillText('普通預金 残高', 256, 270);
  g.fillStyle = '#1a1d24'; g.font = '900 56px "Noto Sans CJK JP"'; g.fillText('1,000,000,000円', 256, 360);
  g.fillStyle = '#e3e8ee'; g.fillRect(40, 430, 432, 4);
  g.globalAlpha = clamp(k * 2);
  g.fillStyle = '#eef6f6'; g.beginPath(); g.roundRect(30, 480, 452, 150, 24); g.fill();
  g.fillStyle = '#2f7f86'; g.font = '700 38px "Noto Sans CJK JP"'; g.fillText('お知らせ', 256, 535);
  g.fillStyle = '#1a1d24'; g.font = '900 46px "Noto Sans CJK JP"'; g.fillText('利息が入金されました', 256, 595);
  g.globalAlpha = clamp(k * 2 - 1);
  g.fillStyle = '#fdecea'; g.beginPath(); g.roundRect(30, 660, 452, 190, 24); g.fill();
  g.fillStyle = '#c9504a'; g.font = '700 36px "Noto Sans CJK JP"'; g.fillText('税金として引かれる', 256, 725);
  g.font = '900 64px "Noto Sans CJK JP"'; g.fillText('−20.315%', 256, 805);
  g.globalAlpha = 1;
  pTex.needsUpdate = true;
}
drawPhone(0);

// ---------- bars: sales vs prize money ----------
const BARS = [
  { name: '売り上げ', v: 1380, txt: '1,380億円', color: '#4fa3d1', x: -1.6 },
  { name: '当せん金', v: 690, txt: '690億円', color: '#ffd166', x: 1.6 },
].map(o => {
  const g = new THREE.Group(); g.position.set(o.x, 0.3, 0); stage.add(g);
  const b = box(2.2, 1, 2.2, mat(o.color)); b.geometry.translate(0, 0.5, 0); g.add(b);
  const name = textSprite(o.name, { w: 512, h: 128, size: 70, color: '#ffffff', bg: 'rgba(15,26,43,.85)', sx: 2.2, depthTest: false }); name.renderOrder = 6; g.add(name); name.position.set(0, -0.35, 1.35);
  const val = textSprite(o.txt, { w: 640, h: 128, size: 84, color: '#ffffff', stroke: 10, sx: 2.8, depthTest: false }); val.renderOrder = 7; g.add(val);
  return { ...o, g, b, val };
});
const BU = 5.4 / 1380;
function setBar(i, k) { const B = BARS[i]; B.g.visible = k > 0; const h = Math.max(0.02, B.v * BU * k); B.b.scale.y = h; B.val.position.y = h + 0.6; B.val.visible = k > 0.6; B.val.material.opacity = clamp((k - 0.6) / 0.3); }

// ---------- living room: someone checks the ticket ----------
const viewer = makePerson({ skin: SKIN[2], hair: HAIR[1], shirt: '#3f8f6b', pants: '#2b3346' }); room.add(viewer);
viewer.position.set(0.2, -0.38, 0.55); viewer.rotation.y = Math.PI;
viewer.userData.legs.forEach(l => { l.rotation.x = -Math.PI / 2; });
viewer.userData.arms.forEach(a => { a.rotation.x = -1.1; });
viewer.userData.arms[0].rotation.z = 0.35; viewer.userData.arms[1].rotation.z = -0.35;
const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: tTex, side: THREE.DoubleSide })); room.add(paper);
paper.position.set(0.2, 0.92, -0.05); paper.rotation.set(-0.5, Math.PI, 0);
viewer.visible = false; paper.visible = false;

function stageOnly() {
  ticket.visible = false; setConfetti('off'); pile.visible = false; giftSet(false); phone.visible = false; BARS.forEach(B => B.g.visible = false);
}
const HIT = 1.3;
function ticketShot(t, matched, cam) {
  stageOnly(); ticket.visible = true; ticket.position.set(0, 3.4, 0); ticket.rotation.set(-0.08, 0, 0);
  const rolling = !matched; const d = rolling ? String(Math.floor(t * 23) % 10) : '6';
  drawTicket(d, !rolling);
  stamp.visible = !rolling; const s = matched === true ? 1 : easeOut(clamp(matched / 0.25)); stamp.scale.set(1.4 * s, 1.4 * s, 1);
  const u = ease(t / cam); look(lerp(0.5, 0, u), 3.0, lerp(15.6, 15.0, u), 0, 1.9, 0, 50);
}

const SUBS = [
  [2.6, 6.0, '年末のくじを、<br>なんとなく確認したら…'],
  [6.2, 10.1, '1等と前後賞で、<br>合わせて10億円。'],
  [10.1, 14, '当たるのは2,000万枚に<br>1枚（推計）。'],
  [14.2, 18.1, '気になる税金は…'],
  [18.1, 22, '所得税0円。<br>法律で非課税と決まっている。'],
  [22.2, 26.1, '大人の子どもに<br>1億円あげると…'],
  [26.1, 30, '贈与税が<br>約4,800万円（推計）'],
  [30.2, 34.6, '残りを銀行に<br>預けておくと…'],
  [34.6, 39, '利息からは<br>20.315%が引かれる。'],
  [39.2, 43.6, 'そもそも年末のくじ<br>1,380億円分のうち…'],
  [43.6, 47.8, '当せん金に回るのは<br>半分の690億円。'],
  [48.1, 52.6, '結果：10億円は税金0円で<br>まるごと手元に残った。'],
  [52.6, 55.4, 'でも人にあげると、<br>半分近くが税金に。'],
  [55.6, 59.4, '10億円当たったら、<br>まず何に使う？'],
];

function shot0(t, T) { // hook: number matches, confetti
  const m = t >= HIT ? (t - HIT) : false;
  ticketShot(t, m === false ? false : (m > 0.25 ? true : m), 2.5);
  setConfetti('fall', Math.max(0, t - HIT) + 0.01, { w: 12, d: 4, top: 5.6, cz: 1, n: t >= HIT ? Math.round(NC * clamp((t - HIT) / 0.3)) : 0 });
  el.flash.style.opacity = t >= HIT ? 0.55 * Math.max(0, 1 - (t - HIT) / 0.3) : 0;
  el.title.style.opacity = 1;
  setHud('', t < HIT ? '照合中…' : '1等！', 1, { color: t < HIT ? '#fff' : '#ff8a7a' });
  return stage;
}
function shot1(t, T) { // everyday: checking the ticket on the sofa
  lift(120);
  setRoom({ sets: ['living'] }); setLight('evening', { ceil: 9, hemi: 1.05 });
  viewer.visible = true; paper.visible = true; drawTicket('0', false); stamp.visible = false;
  const u = ease(t / 3.5);
  look(lerp(-2.4, -2.1, u), lerp(2.1, 2.0, u), lerp(-3.6, -3.3, u), 0.2, 1.0, 0.3, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  return room;
}
function shot2(t, T) { // +1min: 1等＋前後賞＝10億円, odds
  stageOnly(); pile.visible = true; setPile(10 * easeOut(clamp((t - 0.3) / 2.2)));
  pileLab.visible = t > 2.3; pileLab.material.opacity = clamp((t - 2.3) / 0.4);
  setConfetti('fall', t + 3, { w: 12, d: 5, top: 9 });
  const u = ease(t / 8); look(lerp(-1.0, 0.8, u), 4.0, lerp(13.2, 12.8, u), 0, -0.6, 0, 50);
  hudTime('+1分');
  if (t < 4) setTop('1等＋前後賞（2025年 年末のジャンボくじ）', countUp(t, 10, 0.3, 2.0) + '億円', fade(t, 0.15, 4, 0.2), '#ffe08a');
  else setTop('1等が当たる確率（2025年・推計）', '2,000万分の1', fade(t, 4, 8, 0.2));
  return stage;
}
function shot3(t, T) { // +1day: income tax 0
  stageOnly(); pile.visible = true; setPile(10); pileLab.visible = true; pileLab.material.opacity = 1;
  const u = ease(t / 8); look(lerp(0.8, -0.6, u), lerp(4.0, 5.0, u), lerp(12.8, 13.4, u), 0, -0.6, 0, 50);
  hudTime('+1日');
  setTop('当せん金にかかる所得税（2026年）', '0円', fade(t, 3.9, 8, 0.25), '#7ff0c8');
  return stage;
}
function shot4(t, T) { // +1month: give 1億 to the child → gift tax
  stageOnly(); giftSet(true);
  me.position.set(-2.0, 0.3, 0); me.rotation.y = 0.5; kid.position.set(1.2, 0.3, 0); kid.rotation.y = -0.5;
  meLab.position.set(-2.0, 2.5, 0); kidLab.position.set(1.0, 2.5, 0);
  taxBox.position.set(3.2, 0.3, -1.8);
  const g1 = easeOut(clamp((t - 0.5) / 1.8)); gift.position.set(lerp(-1.2, 0.3, g1), 0.3, 0.4);
  me.userData.arms.forEach(a => a.rotation.x = -0.9 * clamp(1 - Math.abs(t - 1.2)));
  // about half of the gift flies into the tax box
  const f = clamp((t - 4.4) / 1.3), fu = ease(f);
  flyTax.visible = t > 4.4; flyTax.position.set(lerp(0.4, 3.2, fu), 0.3 + 1.0 + Math.sin(fu * Math.PI) * 1.6, lerp(0.4, -1.8, fu));
  flyTax.scale.setScalar(f >= 1 ? 0.001 : 1);
  gift.userData.bs.forEach((b, i) => b.visible = t < 4.4 || i < 5);
  const u = ease(t / 8); look(lerp(0.5, 0.8, u), 4.0, lerp(16.0, 15.4, u), 0.6, -0.2, 0, 50);
  hudTime('+1か月');
  setTop('1億円をあげたときの贈与税（2026年・推計）', '約' + comma(countUp(t, 4800, 4.2, 1.6)) + '万円', fade(t, 3.9, 8, 0.25), '#ff8a7a');
  return stage;
}
function shot5(t, T) { // +1year: interest is taxed 20.315%
  stageOnly(); phone.visible = true; phone.position.set(0, 0.3, 0);
  drawPhone(clamp((t - 0.6) / 4.6));
  phone.rotation.y = Math.sin(t * 0.5) * 0.08;
  const u = ease(t / 9.2); look(lerp(0.5, -0.4, u), 3.9, lerp(17.0, 16.4, u), 0, 1.0, 0, 50);
  hudTime('+1年');
  setTop('預金の利息にかかる税（2026年）', (countUp(t, 20315, 4.4, 1.4) / 1000).toFixed(3) + '%', fade(t, 4.3, 9.2, 0.25), '#ff8a7a');
  return stage;
}
function shot6(t, T) { // twist: half of sales goes to prizes
  stageOnly();
  setBar(0, easeOut(clamp((t - 0.4) / 1.6))); setBar(1, easeOut(clamp((t - 4.4) / 1.4)));
  const u = ease(t / 8.8); look(lerp(-0.6, 0.4, u), 3.5, lerp(23.4, 22.8, u), 0, -0.9, 0, 50);
  setHud('', '売り上げの行方', 1);
  if (t < 4.4) setTop('発売総額（2025年 年末のジャンボくじ）', comma(countUp(t, 1380, 0.4, 1.6)) + '億円', fade(t, 0.15, 4.4, 0.2));
  else setTop('当せん金に回る割合（2025年）', (countUp(t - 4.4, 500, 0.1, 1.2) / 10).toFixed(1) + '%', fade(t, 4.4, 8.8, 0.2), '#ffe08a');
  return stage;
}
function shot7(t, T) { // result: 10億 untouched by tax
  stageOnly(); pile.visible = true; setPile(10); pileLab.visible = true; pileLab.material.opacity = 1;
  setConfetti('rest', 0, { w: 9, d: 5, cz: 0.4 });
  const u = ease(t / 7.5); look(lerp(-1.2, 1.0, u), lerp(5.0, 4.0, u), lerp(13.6, 12.9, u), 0, -0.6, 0, 50);
  if (t < 4.4) setTop('手取り（2025年 1等＋前後賞）', countUp(t, 10, 0.2, 1.2) + '億円', fade(t, 0.15, 4.4, 0.2), '#7ff0c8');
  else setTop('1億円をあげると残るのは（2026年・推計）', '約' + comma(countUp(t - 4.4, 5200, 0.1, 1.0)) + '万円', fade(t, 4.4, 7.5, 0.2), '#ff8a7a');
  return stage;
}
function shot8(t, T) { // loop: the matched ticket, confetti on the floor (result state)
  ticketShot(t, true, 4);
  setHud('', '1等！', 1, { color: '#ff8a7a' });
  return stage;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0028',
    title: '宝くじ1等が当たったら手取りはいくら？',
    titleHtml: '宝くじ1等が当たったら<br>手取りはいくら？',
    mood: 'hopeful', seed: 28, hits: [1.3, 18.1, 26.1, 48.1], risers: [1.3, 46.5],
    ask: '10億円当たったら、まず何に使う？',
    narr: { '2,000万枚': 'にせんまんまい', '20.315%': 'にじってんさんいちごパーセント', '690億円': 'ろっぴゃくきゅうじゅうおくえん', '1,380億円分': 'せんさんびゃくはちじゅうおくえんぶん' },
    caption: 'もしも宝くじ1等が当たったら、手取りはいくら？\n2025年の年末のジャンボくじは1等と前後賞で10億円。当せん金には所得税がかからず、まるごと手元に残る。でも18歳以上の子どもに1億円あげると、贈与税は約4,800万円（推計）。預金の利息からは20.315%が引かれる。そもそも売り上げ1,380億円のうち当せん金は半分の690億円、1等は2,000万枚に1枚（推計）。公式資料からの試算です（購入をすすめるものではありません）。\n\n10億円当たったら、まず何に使う？ コメントで教えて。\n\n出典：総務省 地方財政審議会資料（2025年7月）、当せん金付証票法 第13条、国税庁 タックスアンサー No.4408・No.1310、福岡市・愛知県 年末ジャンボ告知（2025年）',
    hashtags: ['もしもラボ', '宝くじ', '手取り', '贈与税', '雑学'],
    endStats: [['1等＋前後賞', '10億円', '2025年 年末'], ['当せん金の所得税', '0円', '2026年'], ['1億円をあげたときの贈与税', '約4,800万円', '推計'], ['売り上げのうち当せん金', '50.0%', '2025年 年末']],
    sources: '出典：総務省 地方財政審議会資料（2025年7月）、当せん金付証票法 第13条、<br>国税庁 No.4408・No.1310、福岡市・愛知県 年末ジャンボ告知（2025年）',
  },
});
