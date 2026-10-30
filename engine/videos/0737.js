import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { stage, makeCrowd } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも日本人全員に毎月10万円配られたら？（お財布のもしも・0022 の続編。公式統計からの単純計算。政策のすすめではない）
// 数字：
//  総人口 1億2,269万人（総務省統計局 人口推計 2026年10月1日現在 概算値・2026年10月20日公表）
//   https://www.stat.go.jp/data/jinsui/index.htm
//   → 10万円×12か月×1億2,269万人＝147兆2,280億円/年 ≒ 約147兆円（推計）。1人あたり年120万円、4人家族で月40万円・年480万円（計算）
//  国の一般会計予算 122兆3,092億円（財務省 令和8年度予算フレーム・当初予算。2026年4月7日に政府案どおり成立）
//   https://www.mof.go.jp/policy/budget/budger_workflow/budget/fy2026/seifuan2026/02.pdf
//   https://www.mof.go.jp/policy/budget/budger_workflow/budget/fy2026/index.html
//  社会保障給付費 138兆3,019億円（国立社会保障・人口問題研究所 令和6（2024）年度 社会保障費用統計・2026年7月29日公表。年金57.9兆・医療44.8兆・福祉その他35.6兆）
//   https://www.ipss.go.jp/ss-cost/j/fsss-R06/R06-houdou.pdf
//   → 147.2兆円−138.3兆円＝約9兆円（単純計算）
//  フィンランドのベーシックインカム実験（2017年1月〜2018年12月）：失業中の2,000人をくじで選び、月560ユーロ（非課税）を2年間。
//   2年目（2017年11月〜2018年10月）に働いた日数は平均78日で、もらっていない人より6日多い。生活の満足度が高く、ストレス・落ち込み・孤独感が少なかった（アンケート）。
//   ただし2年目は同じ年に始まった別の制度（活性化モデル）の影響と切り分けられないと研究者が注記（フィンランド社会保健省・Kela 2020年5月6日発表）
//   https://stm.fi/en/-/perustulokokeilun-tulokset-tyollisyysvaikutukset-vahaisia-toimeentulo-ja-psyykkinen-terveys-koettiin-paremmaksi
//   https://tietotarjotin.fi/en/publication/116455/evaluation-of-the-finnish-basic-income-experiment

const RED = '#ff8a7a', GOLD = '#ffd27a', GREEN = '#7ff0c8', BLUE = '#7fd4ff';

// ---------- bills (generic paper, not real banknotes; same look as 0022) ----------
const billTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#efe6c8'; g.fillRect(0, 0, 128, 64); g.strokeStyle = '#8fb58a'; g.lineWidth = 6; g.strokeRect(5, 5, 118, 54); g.fillStyle = '#b9cfa8'; g.beginPath(); g.arc(88, 32, 15, 0, Math.PI * 2); g.fill(); g.fillStyle = '#6f8f6a'; g.fillRect(16, 22, 44, 8); g.fillRect(16, 36, 30, 6); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const billGeo = new THREE.PlaneGeometry(0.62, 0.31);
const billM = new THREE.MeshLambertMaterial({ map: billTex, side: THREE.DoubleSide });
const NB = 220;
const bills = new THREE.InstancedMesh(billGeo, billM, NB); bills.frustumCulled = false; stage.add(bills);
const BR = rng(737); const BD = []; for (let i = 0; i < NB; i++) BD.push({ x: (BR() - .5), z: (BR() - .5), ph: BR(), sp: 0.6 + BR() * 0.6, rx: BR() * 6, ry: BR() * 6, vx: (BR() - .5), vz: (BR() - .5), vy: 0.6 + BR() });
const dm = new THREE.Object3D();
// 'burst': out from (cx, cy, cz) at time t / 'rain': falling over w×d / 'off'
function setBills(mode, t, { w = 10, d = 8, top = 12, cx = 0, cy = 1.8, cz = 0, n = NB, spread = 8 } = {}) {
  bills.visible = mode !== 'off'; if (!bills.visible) return;
  for (let i = 0; i < NB; i++) {
    const b = BD[i];
    if (i >= n) dm.position.set(0, -50, 0);
    else if (mode === 'burst') {
      const u = Math.max(0, t); const k = Math.min(u, 3);
      dm.position.set(cx + b.vx * spread * k, clamp(cy + b.vy * 2.2 * k - 2.0 * k * k, 0.32, 12), cz + 1.2 + b.vz * 3 * k + 1.2 * k);
      dm.rotation.set(b.rx + u * 4 * b.sp, b.ry + u * 3, 0);
      if (u <= 0) dm.position.y = -50;
    } else {
      const y = top - ((t * b.sp * 3 + b.ph * top) % top);
      dm.position.set(cx + b.x * w, Math.max(0.32, y), cz + b.z * d); dm.rotation.set(b.rx + t * 2 * b.sp, b.ry + t * 1.5, 0);
    }
    dm.updateMatrix(); bills.setMatrixAt(i, dm.matrix);
  }
  bills.instanceMatrix.needsUpdate = true;
}

// ---------- big phone (same bank app look as 0022) ----------
const phone = new THREE.Group(); stage.add(phone); phone.position.set(0, 0.3, 0);
const pBody = box(3.3, 6.4, 0.3, mat('#1a1d24')); pBody.position.y = 3.6; phone.add(pBody);
const pc = document.createElement('canvas'); pc.width = 512; pc.height = 1000;
const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace;
const pScr = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.86), new THREE.MeshBasicMaterial({ map: pTex })); pScr.position.set(0, 3.6, 0.16); phone.add(pScr);
let pLast = '';
// note: { head, amount, foot } or null. pop: 0..1 scale-in of the notice
function drawPhone(account, yen, note, pop = 1) {
  const key = [account, yen, note && note.head, note && note.amount, note && note.foot, Math.round(pop * 20)].join('|'); if (key === pLast) return; pLast = key;
  const g = pc.getContext('2d');
  g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 512, 1000);
  g.fillStyle = '#1fb3a1'; g.fillRect(0, 0, 512, 150);
  g.fillStyle = '#fff'; g.font = '900 48px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.fillText('もしも銀行', 256, 98);
  g.fillStyle = '#59606e'; g.font = '700 38px "Noto Sans CJK JP"'; g.fillText(account, 256, 250);
  g.fillStyle = '#1a1d24'; g.font = '900 66px "Noto Sans CJK JP"'; g.fillText(comma(yen) + '円', 256, 345);
  g.fillStyle = '#e3e8ee'; g.fillRect(40, 400, 432, 4);
  if (note && pop > 0) {
    g.save(); g.translate(256, 600); const s = 0.6 + 0.4 * pop; g.scale(s, s); g.globalAlpha = Math.min(1, pop * 1.5);
    g.fillStyle = '#fff4d6'; g.beginPath(); g.roundRect(-236, -170, 472, 340, 30); g.fill();
    g.strokeStyle = '#f0b43c'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#b07a12'; g.font = '700 40px "Noto Sans CJK JP"'; g.fillText(note.head, 0, -90);
    g.fillStyle = '#1a1d24'; g.font = '900 78px "Noto Sans CJK JP"'; g.fillText(note.amount, 0, 20);
    g.fillStyle = '#59606e'; g.font = '700 36px "Noto Sans CJK JP"'; g.fillText(note.foot, 0, 110);
    g.restore();
  }
  pTex.needsUpdate = true;
}
const BASE_YEN = 52340;
const NOTE_HOOK = { head: '入金がありました', amount: '+100,000円', foot: '毎月の給付金' };

// ---------- family of four ----------
const FAM = [
  { x: -2.4, s: 1.0, skin: SKIN[0], hair: HAIR[0], shirt: '#3f6fb5', pants: '#2b3346' },
  { x: -0.8, s: 0.98, skin: SKIN[1], hair: HAIR[2], shirt: '#e05a4f', pants: '#3b3f4a' },
  { x: 0.8, s: 0.74, skin: SKIN[0], hair: HAIR[1], shirt: '#f2c14e', pants: '#2b3346' },
  { x: 2.4, s: 0.62, skin: SKIN[1], hair: HAIR[0], shirt: '#5fbf8f', pants: '#3b3f4a' },
].map((o, i) => {
  const p = makePerson({ skin: o.skin, hair: o.hair, shirt: o.shirt, pants: o.pants, scale: o.s }); p.position.set(o.x, 0.3, 0); stage.add(p);
  const tag = textSprite('10万円', { w: 384, h: 128, size: 80, color: '#1a1d24', bg: '#ffd27a', sx: 1.5, depthTest: false }); tag.renderOrder = 8; tag.position.set(o.x, 0.3 + 2.0 * o.s + 0.55, 0.2); stage.add(tag);
  return { ...o, p, tag };
});
function family(on, t = 0) {
  FAM.forEach((f, i) => {
    f.p.visible = on; f.tag.visible = false; if (!on) return;
    f.p.userData.arms.forEach((a, j) => { a.rotation.x = -0.3 - 0.25 * Math.sin(t * 4 + i + j); });
    const k = clamp((t - 0.25 - i * 0.28) / 0.3);
    f.tag.visible = k > 0; const s = 1.5 * easeOut(k) * (1 + 0.12 * Math.max(0, 1 - Math.abs(k - 0.8) * 5));
    f.tag.scale.set(s, s / 3, 1);
  });
}

// ---------- crowd ----------
const crowd = makeCrowd(110, 9, { w: 16, d: 9, x: 0, z: 0 }); crowd.g.visible = false;

// ---------- money bars (兆円) ----------
const TOTAL = 147.2;
const BARS = [
  { name: '国の1年の予算', v: 122.3, txt: '122.3兆円', color: '#4fa3d1', x: -3.4 },
  { name: '年金・医療などの給付', v: 138.3, txt: '138.3兆円', color: '#8fb58a', x: 0 },
  { name: '毎月10万円の総額', v: TOTAL, txt: '約147兆円', color: '#ff6b6b', x: 3.4 },
].map(o => {
  const g = new THREE.Group(); g.position.set(o.x, 0.3, 0); stage.add(g);
  const b = box(2.3, 1, 2.3, mat(o.color)); b.geometry.translate(0, 0.5, 0); g.add(b);
  const name = textSprite(o.name, { w: 768, h: 128, size: 60, color: '#ffffff', bg: 'rgba(15,26,43,.85)', sx: 3.1, depthTest: false }); name.renderOrder = 6; g.add(name);
  const val = textSprite(o.txt, { w: 640, h: 128, size: 88, color: '#ffffff', stroke: 10, sx: 2.9, depthTest: false }); val.renderOrder = 7; g.add(val);
  g.visible = false;
  return { ...o, g, b, name, val };
});
const UNIT = 6.0 / TOTAL;
function setBar(i, k) {
  const B = BARS[i]; B.g.visible = k > 0;
  const h = Math.max(0.02, B.v * UNIT * k); B.b.scale.y = h;
  B.name.position.set(0, -0.45, 1.5);
  B.val.position.y = h + 0.6; B.val.visible = k > 0.6; B.val.material.opacity = clamp((k - 0.6) / 0.3);
}
// red gap marker between 給付 and 総額 (約9兆円)
const gapM = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.95 });
const gap = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1, 2.42), gapM); stage.add(gap); gap.visible = false;
const gapTxt = textSprite('約9兆円 足りない', { w: 640, h: 128, size: 66, color: '#1a1d24', bg: '#ffd27a', sx: 2.6, depthTest: false }); gapTxt.renderOrder = 9; stage.add(gapTxt); gapTxt.visible = false;
function hideBars() { BARS.forEach(B => B.g.visible = false); gap.visible = false; gapTxt.visible = false; }

// ---------- Finland experiment: two groups + days-worked bars ----------
const grpA = makeCrowd(12, 31, { w: 3.8, d: 2.8, x: -2.9, z: 0.6 }); grpA.g.visible = false;
const grpB = makeCrowd(12, 47, { w: 3.8, d: 2.8, x: 2.9, z: 0.6 }); grpB.g.visible = false;
const padA = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.06, 40), mat('#c99a2e')); padA.position.set(-2.9, 0.33, 0.6); stage.add(padA);
const padB = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.06, 40), mat('#3a4b6e')); padB.position.set(2.9, 0.33, 0.6); stage.add(padB);
const labA = textSprite('もらった人 2,000人', { w: 768, h: 128, size: 62, color: '#1a1d24', bg: '#ffd27a', sx: 2.8, depthTest: false }); labA.renderOrder = 8; labA.position.set(-2.9, 2.75, 1.4); stage.add(labA);
const labB = textSprite('もらってない人', { w: 768, h: 128, size: 62, color: '#ffffff', bg: 'rgba(15,26,43,.88)', sx: 2.8, depthTest: false }); labB.renderOrder = 8; labB.position.set(2.9, 2.75, 1.4); stage.add(labB);
const DAYS = [
  { v: 78, txt: '78日', color: '#ffd27a', x: -2.9 },
  { v: 72, txt: '72日', color: '#7f93b8', x: 2.9 },
].map(o => {
  const g = new THREE.Group(); g.position.set(o.x, 0.3, -2.3); stage.add(g);
  const b = box(2.4, 1, 1.2, mat(o.color)); b.geometry.translate(0, 0.5, 0); g.add(b);
  const val = textSprite(o.txt, { w: 512, h: 128, size: 92, color: '#ffffff', stroke: 10, sx: 2.3, depthTest: false }); val.renderOrder = 7; g.add(val);
  g.visible = false; return { ...o, g, b, val };
});
const DUNIT = 4.8 / 78;
function setDays(k) { DAYS.forEach(D => { D.g.visible = k > 0; const h = Math.max(0.02, D.v * DUNIT * k); D.b.scale.y = h; D.val.position.y = h + 0.55; D.val.visible = k > 0.7; }); }
function groups(on, t = 0, { cheer = 0 } = {}) {
  [grpA, grpB].forEach((G, gi) => { G.g.visible = on; if (!on) return; G.people.forEach((p, i) => { p.userData.head.rotation.x = -0.1 + 0.08 * Math.sin(t * 2 + i); const up = gi === 0 ? cheer : 0; p.userData.arms.forEach((a, j) => { a.rotation.x = lerp(-0.2, -2.6, up) + 0.25 * Math.sin(t * 4 + i + j); }); }); });
  padA.visible = padB.visible = labA.visible = labB.visible = on;
}

const SUBS = [
  [2.6, 5.2, '4人家族なら、<br>毎月40万円。'],
  [5.3, 8.6, 'でも必要なお金は、<br>国の予算より多い。'],
  [8.7, 12.4, '1年で480万円。<br>1人なら年120万円。'],
  [12.5, 16.6, '1億2,269万人、全員に<br>1年配ると、いくら？'],
  [16.7, 20.6, '約147兆円（推計）。<br>毎年、この額が要る。'],
  [20.7, 24.4, '国の1年の予算、<br>122.3兆円より多い。'],
  [24.5, 28.2, 'じゃあ、今の年金などを<br>置きかえたら？'],
  [28.3, 32.0, '年金・医療・介護などの<br>給付は、全部で138.3兆円。'],
  [32.1, 36.0, '全部置きかえても、<br>まだ約9兆円足りない。'],
  [36.1, 40.0, 'じゃあ、もらった人は<br>働かなくなる？'],
  [40.1, 44.0, '実際に試した国がある。<br>フィンランドだ。'],
  [44.1, 48.0, '失業中の2,000人に、<br>月560ユーロを2年間。'],
  [48.1, 53.8, '結果：働いた日数は少し増え、<br>ストレスは減った。'],
  [53.9, 56.1, 'でも毎年147兆円が要る。'],
  [56.2, 59.4, '毎月10万円もらえたら、<br>仕事つづける？'],
];

function stageOnly() { phone.visible = false; family(false); crowd.g.visible = false; hideBars(); groups(false); setDays(0); setBills('off'); }
const POP = 0.35; // 0.35秒で入金の通知がポン
function hookCam(t, d = 2.6, L = 0) { lift(L); const u = ease(t / d); look(lerp(0.0, 0.3, u), lerp(4.35, 4.3, u), lerp(21.2, 20.0, u), 0, 4.3, 0, 50); }
function phoneHook(t, loop = false) {
  stageOnly(); phone.visible = true;
  const k = loop ? 1 : easeOut(clamp((t - POP) / 0.9));
  const pop = loop ? 1 : (t < POP ? 0.85 : clamp(0.85 + (t - POP) / 0.18 * 0.15) + 0.12 * Math.max(0, Math.sin(Math.min(1, (t - POP) / 0.35) * Math.PI)));
  drawPhone('普通預金 残高', Math.round(BASE_YEN + 100000 * k), NOTE_HOOK, Math.min(pop, 1.12));
  const shake = !loop && t > POP && t < POP + 0.35 ? Math.sin((t - POP) * 70) * 0.06 : 0;
  phone.rotation.set(0, Math.sin(t * 0.6) * 0.05, shake); phone.position.y = 0.3;
  if (!loop) setBills('burst', t - POP, { cy: 6.6, cz: -3.4, spread: 11, n: 160 });
  else setBills('rain', t + 4, { w: 16, d: 6, top: 12, cz: -3, n: 90 });
  el.flash.style.opacity = !loop && t >= POP ? 0.5 * Math.max(0, 1 - (t - POP) / 0.3) : 0;
  hookCam(loop ? t + 0.6 : t, loop ? 3.4 : 2.6, loop ? 260 : 0);
  return stage;
}
function shot0(t) { return phoneHook(t); }
function shot1(t) { // family of four: 10万円 tags pop -> 40万円
  stageOnly(); family(true, t);
  setBills('rain', t, { w: 9, d: 4, top: 9, cz: -1.5, n: 70 });
  lift(300); const u = ease(t / 6);
  look(lerp(0.3, -0.2, u), lerp(3.0, 3.3, u), lerp(14.0, 15.0, u), 0, 1.7, 0, 50);
  setTop('1人10万円×4人（毎月）', countUp(t, 40, 0.3, 1.3) + '万円', fade(t, 0.2, 6.05, 0.25), GOLD);
  return stage;
}
function shot2(t) { // phone: one year of the family account
  stageOnly(); phone.visible = true;
  const mo = Math.min(12, 1 + Math.floor(clamp((t - 0.1) / 1.1) * 11.999));
  drawPhone('家族の口座（1年分）', 400000 * mo, { head: `${mo}か月目`, amount: '+400,000円', foot: '4人分の給付金' }, 1);
  phone.rotation.set(0, Math.sin(t * 0.5) * 0.07, 0);
  setBills('rain', t, { w: 16, d: 7, top: 12, cz: -3, n: 140 });
  lift(330); const u = ease(t / 3.8);
  look(lerp(0.5, -0.3, u), 4.3, lerp(16.6, 16.0, u), 0, 3.9, 0, 50);
  setTop('4人家族の1年（10万円×4人×12か月）', (40 * mo) + '万円', fade(t, 0.15, 3.8, 0.25), GOLD);
  return stage;
}
function shot3(t) { // everyone in Japan: population -> total per year
  stageOnly(); crowd.g.visible = true;
  crowd.people.forEach((p, i) => { p.userData.head.rotation.x = -0.35 - 0.1 * Math.sin(t * 2 + i); p.userData.arms.forEach((a, j) => { a.rotation.x = -2.6 + 0.3 * Math.sin(t * 5 + i + j); }); });
  setBills('rain', t + 3, { w: 18, d: 11, top: 13, n: NB });
  lift(330); const u = ease(t / 8.2);
  look(0, lerp(17, 19, u), lerp(19, 21, u), 0, 0, -1.5, 50);
  setHud('', '全員分', 1);
  if (t < 4.2) { const v = countUp(t, 12269, 0.2, 1.6); setTop('日本の総人口（2026年10月1日・概算）', `${Math.floor(v / 10000)}億${comma(v % 10000)}万人`, fade(t, 0.1, 4.2, 0.2)); }
  else setTop('必要なお金（1年・推計）', '約' + countUp(t - 4.25, 147, 0.0, 1.4) + '兆円', fade(t, 4.25, 8.2, 0.2), RED);
  return stage;
}
function barCam(t, d, z0, z1, L = 380) { lift(L); const u = ease(t / d); look(lerp(0.4, 0.0, u), 5.4, lerp(z0, z1, u), 0, 3.8, 0, 50); }
function shot4(t) { // vs the national budget
  stageOnly();
  setBar(0, easeOut(clamp((t - 0.1) / 1.2)));
  setBar(2, easeOut(clamp((t - 0.9) / 1.6)));
  barCam(t, 7.6, 23.5, 22.5);
  setHud('くらべると', '国の予算', 1);
  if (t < 3.85) setTop('国の一般会計予算（2026年度 当初）', (countUp(t, 1223, 0.1, 1.3) / 10).toFixed(1) + '兆円', fade(t, 0.1, 3.85, 0.2), BLUE);
  else setTop('毎月10万円に必要なお金（1年・推計）', '約147兆円', fade(t, 3.85, 7.6, 0.2), RED);
  return stage;
}
function shot5(t) { // vs social security benefits: still ~9兆円 short
  stageOnly();
  setBar(0, 1); setBar(2, 1); setBar(1, easeOut(clamp((t - 0.1) / 1.4)));
  const g = clamp((t - 3.85) / 0.4);
  gap.visible = g > 0; gapTxt.visible = g > 0;
  if (gap.visible) {
    const y0 = 0.3 + BARS[1].v * UNIT, y1 = 0.3 + TOTAL * UNIT;
    gap.position.set(BARS[2].x, (y0 + y1) / 2, 0); gap.scale.set(1, y1 - y0, 1); gapM.opacity = 0.95 * g;
    gapTxt.position.set(BARS[2].x, y0 - 1.6, 1.5); gapTxt.material.opacity = g;
  }
  barCam(t, 7.8, 22.5, 22.0);
  setHud('くらべると', '社会保障', 1);
  if (t < 3.85) setTop('社会保障給付費（2024年度）', (countUp(t, 1383, 0.1, 1.4) / 10).toFixed(1) + '兆円', fade(t, 0.1, 3.85, 0.2), GREEN);
  else setTop('全部置きかえても足りない額（単純計算）', '約9兆円', fade(t, 3.85, 7.8, 0.2), RED);
  return stage;
}
function finCam(t, d, a, b, L = 330) { lift(L); const u = ease(t / d); look(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), 0, 1.6, 0, 50); }
function shot6(t) { // Finland experiment: two groups, money for one
  stageOnly(); groups(true, t, { cheer: clamp((t - 8.2) / 0.6) * 0.6 });
  setBills('rain', t, { w: 4.2, d: 2.6, top: 8, cx: -2.9, cz: 0.6, n: t > 8.0 ? 60 : 0 });
  finCam(t, 12, [0.6, 6.6, 21.0], [0, 6.2, 19.5]);
  if (t >= 4.05) setHud('実験', 'フィンランド', 1);
  if (t >= 8.05) setTop('フィンランドの実験（2017〜2018年）', '月560ユーロ×2年', fade(t, 8.05, 12, 0.2), GOLD);
  else if (t >= 4.05) setTop('くじで選んだ失業中の人（2017〜2018年）', '2,000人', fade(t, 4.05, 8.05, 0.2));
  return stage;
}
function shot7(t) { // result: days worked 78 vs 72
  stageOnly(); groups(true, t + 12, { cheer: 0.6 }); setDays(easeOut(clamp((t - 0.2) / 1.4)));
  finCam(t, 8.1, [0, 8.4, 21.0], [0, 8.8, 22.0], 300);
  setHud('実験の結果', '2年目', 1);
  if (t < 5.85) setTop('働いた日数（2年目の1年間・平均）', '78日（＋6日）', fade(t, 0.15, 5.85, 0.2), GOLD);
  else setTop('毎月10万円に必要なお金（1年・推計）', '約147兆円', fade(t, 5.85, 8.1, 0.2), RED);
  return stage;
}
function shot8(t) { return phoneHook(t, true); } // loop: same phone as the opening

const shots = [
  { a: 0, b: 2.6, f: shot0 }, { a: 2.6, b: 8.65, f: shot1 }, { a: 8.65, b: 12.45, f: shot2 }, { a: 12.45, b: 20.65, f: shot3 },
  { a: 20.65, b: 28.25, f: shot4 }, { a: 28.25, b: 36.05, f: shot5 }, { a: 36.05, b: 48.05, f: shot6 }, { a: 48.05, b: 56.15, f: shot7 },
  { a: 56.15, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0737',
    v2: true,
    hookLine: '毎月10万円、何もしなくても振り込まれる。',
    series: 'お財布のもしも',
    hookType: 'H4',
    cat: 'お金・経済',
    title: '日本人全員に毎月10万円配られたら？',
    titleHtml: '日本人全員に毎月<br>10万円配られたら？',
    mood: 'mystery', seed: 737, hits: [0.35, 48.1], risers: [15.2, 46.5],
    impacts: [3.0, 17.0, 32.3, 48.4],
    sfx: [[0.35, 'whoosh'], [36.2, 'meter', 0.35]],
    narr: { '1億2,269万人': '1億2269万人', '2,000人': '2000人' },
    ask: '毎月10万円もらえたら仕事つづける？',
    caption: 'ベーシックインカムで毎月10万円、日本人全員に配ったら？\n4人家族なら毎月40万円、1年で480万円。でも全員分だと1年で約147兆円（1億2,269万人×10万円×12か月・推計）。国の一般会計予算122.3兆円（2026年度当初）より多く、年金・医療・介護などの社会保障給付費138.3兆円（2024年度）を全部置きかえても約9兆円足りない（単純計算）。\nフィンランドでは2017〜2018年に、くじで選んだ失業中の2,000人に月560ユーロを2年間配る実験をした。2年目に働いた日数は平均78日で、もらっていない人より6日多かった（同じ年に始まった別の制度の影響と切り分けられないと研究者は注記）。生活の満足度は高く、ストレスや落ち込みは少なかった（アンケート）。\n結果：働いた日数は少し増え、ストレスは減った。でも毎年147兆円が要る。\n※公式統計と実験の公表結果をもとにした単純計算です。特定の政策をすすめるものではありません。\n\n毎月10万円もらえたら仕事つづける？ コメントで教えて。\n\n出典：総務省 人口推計（2026年10月概算）、財務省 令和8年度予算フレーム、国立社会保障・人口問題研究所 令和6年度社会保障費用統計、フィンランド社会保健省・Kela ベーシックインカム実験の結果（2020年5月）',
    hashtags: ['もしもラボ', 'もしも', '雑学', 'ベーシックインカム', 'お金'],
    endStats: [['4人家族なら', '月40万円・年480万円', '計算'], ['全員分の総額（推計）', '約147兆円/年', '2026年10月の人口'], ['国の一般会計予算', '122.3兆円', '2026年度当初'], ['社会保障給付費', '138.3兆円', '2024年度'], ['フィンランドの実験', '働いた日数 78日（＋6日）', '2年目']],
    sources: '出典：総務省 人口推計（2026年10月概算）、財務省 令和8年度予算、<br>社人研 社会保障費用統計（2024年度）、フィンランド社会保健省・Kela（2020年）',
  },
});
