import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight } from '../scenes/room.js';
import { stage, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも日本人全員に1億円配られたら？（公式統計からの試算。投資助言ではない）
// 数字：総人口 1億2,265万人（総務省 人口推計 2026年9月1日現在 概算値）
//       → 1億円×1億2,265万人＝1京2,265兆円（推計）
//       日本銀行券発行高 114兆6,005億円（日本銀行 マネタリーベース 2026年9月 平均残高）→ 総額の約0.9%（推計）
//       一般会計予算 122兆3,092億円（財務省「ファイナンス」2026年3月号 令和8年度予算）→ 総額はその約100倍（推計）
//       家計の金融資産 2,519兆円（日本銀行 資金循環統計 2026年第2四半期速報 2026年6月末）→ 総額はその約4.9倍（推計）
// 着地（人への影響）：家計の金融資産 2,519兆円＋配った 1京2,265兆円 ＝ 1京4,784兆円 → 約5.9倍（計算）。物（お米・家）は増えない。
//   物価が同じ割合で上がると仮定した単純計算で、1億円の価値は 1億÷5.87 ≒ 約1,700万円（今のお金で）。単純計算であることを画面とキャプションに明記

const TOTAL = 12265; // 兆円
const fmtCho = v => v >= 10000 ? `${Math.floor(v / 10000)}京${comma(v % 10000)}兆円` : `${comma(v)}兆円`;

// ---------- the button (stage) ----------
const btn = new THREE.Group(); stage.add(btn); btn.position.set(0, 0.3, 0);
const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 1.3, 32), mat('#d9dee6')); ped.position.y = 0.65; ped.castShadow = true; btn.add(ped);
const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 32), mat('#2b2f3a')); ring.position.y = 1.36; btn.add(ring);
const capM = new THREE.MeshLambertMaterial({ color: '#e5383b', emissive: 0x5a0a0a, emissiveIntensity: 0.4 });
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.42, 32), capM); cap.castShadow = true; btn.add(cap);
const plate = textSprite('全員に1億円', { w: 512, h: 128, size: 66, bg: '#1b2b4a', color: '#ffffff', sx: 2.0 }); plate.position.set(0, 0.7, 1.55); btn.add(plate);
function setButton(pressed) { cap.position.y = 1.55 - 0.22 * pressed; capM.emissiveIntensity = 0.4 + 0.9 * pressed; }

// ---------- bills (generic paper, not real banknotes) ----------
const billTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#efe6c8'; g.fillRect(0, 0, 128, 64); g.strokeStyle = '#8fb58a'; g.lineWidth = 6; g.strokeRect(5, 5, 118, 54); g.fillStyle = '#b9cfa8'; g.beginPath(); g.arc(88, 32, 15, 0, Math.PI * 2); g.fill(); g.fillStyle = '#6f8f6a'; g.fillRect(16, 22, 44, 8); g.fillRect(16, 36, 30, 6); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const billGeo = new THREE.PlaneGeometry(0.62, 0.31);
const billM = new THREE.MeshLambertMaterial({ map: billTex, side: THREE.DoubleSide });
const NB = 220;
const bills = new THREE.InstancedMesh(billGeo, billM, NB); bills.frustumCulled = false; stage.add(bills);
const BR = rng(22); const BD = []; for (let i = 0; i < NB; i++) BD.push({ x: (BR() - .5), z: (BR() - .5), ph: BR(), sp: 0.6 + BR() * 0.6, rx: BR() * 6, ry: BR() * 6, vx: (BR() - .5), vz: (BR() - .5), vy: 0.6 + BR() });
const dm = new THREE.Object3D();
// mode 'burst': out of the button at time u (s) / 'rain': falling over area w×d from height top / 'rest': on the floor
function setBills(mode, t, { w = 10, d = 8, top = 12, cx = 0, cz = 0, n = NB } = {}) {
  bills.visible = mode !== 'off'; if (!bills.visible) return;
  for (let i = 0; i < NB; i++) {
    const b = BD[i];
    if (i >= n) { dm.position.set(0, -50, 0); }
    else if (mode === 'burst') {
      const u = Math.max(0, t); const k = Math.min(u, 3);
      dm.position.set(cx + b.vx * 8 * k, clamp(1.8 + b.vy * 1.5 * k - 2.0 * k * k, 0.32, 2.5), cz + b.vz * 4 * k - 0.8 * k);
      dm.rotation.set(b.rx + u * 4 * b.sp, b.ry + u * 3, 0);
      if (u <= 0) dm.position.y = -50;
    } else if (mode === 'rain') {
      const y = top - ((t * b.sp * 3 + b.ph * top) % top);
      dm.position.set(cx + b.x * w, Math.max(0.32, y), cz + b.z * d); dm.rotation.set(b.rx + t * 2 * b.sp, b.ry + t * 1.5, 0);
    } else { // rest
      dm.position.set(cx + b.x * w, 0.32 + (i % 5) * 0.004, cz + b.z * d); dm.rotation.set(-Math.PI / 2, 0, b.ry);
    }
    dm.updateMatrix(); bills.setMatrixAt(i, dm.matrix);
  }
  bills.instanceMatrix.needsUpdate = true;
}

// ---------- big phone (stage) ----------
const phone = new THREE.Group(); stage.add(phone); phone.position.set(0, 0.3, 0);
const pBody = box(3.3, 6.4, 0.3, mat('#1a1d24')); pBody.position.y = 3.6; phone.add(pBody);
const pc = document.createElement('canvas'); pc.width = 512; pc.height = 1000;
const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace;
const pScr = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.86), new THREE.MeshBasicMaterial({ map: pTex })); pScr.position.set(0, 3.6, 0.16); phone.add(pScr);
let pLast = '';
function drawPhone(yen, note) {
  const key = yen + '|' + note; if (key === pLast) return; pLast = key;
  const g = pc.getContext('2d');
  g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 512, 1000);
  g.fillStyle = '#1fb3a1'; g.fillRect(0, 0, 512, 150);
  g.fillStyle = '#fff'; g.font = '900 48px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.fillText('もしも銀行', 256, 98);
  g.fillStyle = '#59606e'; g.font = '700 38px "Noto Sans CJK JP"'; g.fillText('普通預金 残高', 256, 300);
  g.fillStyle = '#1a1d24'; g.font = '900 58px "Noto Sans CJK JP"'; g.fillText(comma(yen) + '円', 256, 400);
  g.fillStyle = '#e3e8ee'; g.fillRect(40, 470, 432, 4);
  if (note) {
    g.fillStyle = '#fff4d6'; g.beginPath(); g.roundRect(30, 520, 452, 220, 26); g.fill();
    g.fillStyle = '#b07a12'; g.font = '700 36px "Noto Sans CJK JP"'; g.fillText('入金がありました', 256, 590);
    g.fillStyle = '#1a1d24'; g.font = '900 54px "Noto Sans CJK JP"'; g.fillText('+100,000,000円', 256, 680);
  }
  pTex.needsUpdate = true;
}
const BASE_YEN = 52340;
drawPhone(BASE_YEN, false);

// ---------- crowd (stage) ----------
const crowd = makeCrowd(110, 9, { w: 16, d: 9, x: 0, z: 0 }); crowd.g.visible = false;

// ---------- bars (own labels so long values fit) ----------
const BARS = [
  { name: '日本中のお札', v: 114.6, txt: '114.6兆円', color: '#8fb58a', x: -4.2 },
  { name: '国の1年の予算', v: 122.3, txt: '122.3兆円', color: '#4fa3d1', x: -1.4 },
  { name: '家計の金融資産', v: 2519, txt: '2,519兆円', color: '#f2c14e', x: 1.4 },
  { name: '配った総額', v: TOTAL, txt: '約1京2,265兆円', color: '#ff6b6b', x: 4.2 },
].map(o => {
  const g = new THREE.Group(); g.position.set(o.x, 0.3, 0); stage.add(g);
  const b = box(2.1, 1, 2.1, mat(o.color)); b.geometry.translate(0, 0.5, 0); g.add(b);
  const name = textSprite(o.name, { w: 640, h: 128, size: 66, color: '#ffffff', bg: 'rgba(15,26,43,.85)', sx: 2.6, depthTest: false }); name.renderOrder = 6; g.add(name);
  const val = textSprite(o.txt, { w: 768, h: 128, size: 84, color: '#ffffff', stroke: 10, sx: o.v > 10000 ? 3.8 : 2.9, depthTest: false }); val.renderOrder = 7; g.add(val);
  g.visible = false;
  return { ...o, g, b, name, val };
});
// unit: scene height per 兆円. k: 0..1 grow of this bar
function setBar(i, unit, k, showVal = true) {
  const B = BARS[i]; B.g.visible = k > 0;
  const h = Math.max(0.02, B.v * unit * k); B.b.scale.y = h;
  B.name.position.set(0, -0.35, 1.3);
  B.val.position.y = h + 0.6; B.val.visible = showVal && k > 0.6; B.val.material.opacity = clamp((k - 0.6) / 0.3);
}
function hideBars() { BARS.forEach(B => B.g.visible = false); }
const U1 = 5 / 114.6, U2 = 6.5 / 2519, U3 = 9.5 / TOTAL;

// ---------- living room ----------
const me = makePerson({ skin: SKIN[0], hair: HAIR[2], shirt: '#e05a4f', pants: '#2b3346' }); room.add(me);
me.position.set(0.2, -0.38, 0.55); me.rotation.y = Math.PI;
me.userData.legs.forEach(l => { l.rotation.x = -Math.PI / 2; });
me.userData.arms.forEach(a => { a.rotation.x = -1.1; a.rotation.z = 0; });
me.userData.arms[0].rotation.z = 0.35; me.userData.arms[1].rotation.z = -0.35;
const minic = document.createElement('canvas'); minic.width = 128; minic.height = 240;
const miniTex = new THREE.CanvasTexture(minic); miniTex.colorSpace = THREE.SRGBColorSpace;
{ const g = minic.getContext('2d'); g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 128, 240); g.fillStyle = '#1fb3a1'; g.fillRect(0, 0, 128, 40); g.fillStyle = '#1a1d24'; g.font = '900 20px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.fillText('52,340円', 64, 120); miniTex.needsUpdate = true; }
const mini = new THREE.Group(); { const bd = box(0.2, 0.38, 0.03, mat('#1a1d24')); mini.add(bd); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.34), new THREE.MeshBasicMaterial({ map: miniTex })); s.position.z = -0.017; s.rotation.y = Math.PI; mini.add(s); }
room.add(mini); mini.position.set(0.2, 0.86, -0.02); mini.rotation.x = 0.6; mini.rotation.y = 0;

const SUBS = [
  [2.6, 6.0, 'いつもの夜。<br>スマホで残高チェック。'],
  [6.2, 10.1, '全員の口座に、<br>1億円が着金。'],
  [10.1, 14, '赤ちゃんからお年寄りまで、<br>1億2,265万人。'],
  [14.2, 18.1, '配った総額は…'],
  [18.1, 22, '約1京2,265兆円（推計）。<br>京は、兆の1万倍。'],
  [22.2, 26.1, '日本中のお札を<br>全部集めても…'],
  [26.1, 30, '114.6兆円。<br>配った額の1%もない。'],
  [30.2, 34.6, '国の1年の予算は、<br>122.3兆円。'],
  [34.6, 39, '配った額は、その<br>約100倍（推計）。'],
  [39.2, 43.6, '日本の家計が持つ<br>預金や株の合計は…'],
  [43.6, 47.8, '2,519兆円。それでも<br>配った額の約5分の1。'],
  [48.1, 53.8, '結果：家計のお金は約5.9倍。<br>でもモノは1つも増えない。'],
  [53.9, 56.1, '値段も同じだけ上がれば、<br>1億円は今の約1,700万円。'],
  [56.2, 59.4, '1億円もらったら、<br>仕事つづける？'],
];

function stageOnly() { phone.visible = false; btn.visible = false; crowd.g.visible = false; hideBars(); setBills('off'); }
const PRESS = 1.2;
function btnCam(t, d0, d1) { lift(230); const u = ease(t / d0); look(lerp(0.3, 0, u), lerp(4.9, 5.2, u), lerp(10.4, 11.0, u) + d1, 0, 1.2, 0, 50); }
function shot0(t, T) { // hook: the button gets pressed
  stageOnly(); btn.visible = true;
  setButton(t >= PRESS - 0.08 && t < PRESS + 0.45 ? 1 : 0);
  btn.scale.setScalar(t < PRESS ? 1 + 0.03 * Math.sin(t * 9) : 1);
  setBills('burst', t - PRESS);
  el.flash.style.opacity = t >= PRESS ? 0.6 * Math.max(0, 1 - (t - PRESS) / 0.3) : 0;
  btnCam(t, 2.5, 0);
  el.title.style.opacity = 1;
  setHud('', t < PRESS ? '押す？' : 'ポチッ', 1, { color: t < PRESS ? '#fff' : '#ff8a7a' });
  return stage;
}
function shot1(t, T) { // everyday: checking the balance at night
  lift(120);
  setRoom({ sets: ['living'] }); setLight('evening', { ceil: 9, hemi: 1.05, glow: 1.2, glowPos: [0.2, 1.1, -0.4] });
  const u = ease(t / 3.5);
  look(lerp(-2.4, -2.1, u), lerp(2.1, 2.0, u), lerp(-3.6, -3.3, u), 0.2, 1.0, 0.3, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  return room;
}
function shot2(t, T) { // +1min deposit lands
  lift(360);
  stageOnly(); phone.visible = true; btn.scale.setScalar(1);
  const k = easeOut(clamp((t - 0.6) / 1.6));
  drawPhone(Math.round(BASE_YEN + 100000000 * k), t > 0.6);
  phone.rotation.y = Math.sin(t * 0.5) * 0.08; phone.position.y = 0.3 + (t > 0.6 && t < 0.9 ? Math.sin((t - 0.6) * 60) * 0.04 : 0);
  setBills('rain', t, { w: 16, d: 7, top: 12, cz: -3, n: 140 });
  const u = ease(t / 8);
  look(lerp(0.5, -0.4, u), 4.3, lerp(15.8, 15.2, u), 0, 3.9, 0, 50);
  hudTime('+1分');
  const v = countUp(t, 12265, 0.3, 1.6);
  setTop('配られた人（2026年9月の総人口）', `${Math.floor(v / 10000)}億${comma(v % 10000)}万人`, fade(t, 0.15, 8, 0.25));
  return stage;
}
function shot3(t, T) { // total across everyone
  lift(330);
  stageOnly(); crowd.g.visible = true;
  crowd.people.forEach((p, i) => { p.userData.head.rotation.x = -0.35 - 0.1 * Math.sin(t * 2 + i); p.userData.arms.forEach((a, j) => { a.rotation.x = -2.6 + 0.3 * Math.sin(t * 5 + i + j); }); });
  setBills('rain', t + 3, { w: 18, d: 11, top: 13, n: NB });
  const u = ease(t / 8);
  look(0, lerp(17, 19, u), lerp(19, 21, u), 0, 0, -1.5, 50);
  setHud('', '全員分', 1);
  const v = countUp(t, TOTAL, 4.0, 1.8);
  setTop('配った総額（推計）', '約' + fmtCho(v), fade(t, 3.9, 8, 0.25), '#ff8a7a');
  return stage;
}
function barCam(t, d, cx0, cx1, z0, z1, ty = 3.2, L = 470) { lift(L); const u = ease(t / d); const cx = lerp(cx0, cx1, u); look(cx, ty + 1.6, lerp(z0, z1, u), cx, ty, 0, 50); }
function shot4(t, T) { // vs all the bills in Japan
  stageOnly();
  setBar(0, U1, easeOut(clamp((t - 0.6) / 3.6)), t > 3.9);
  setBills('rain', t, { w: 4, d: 3, top: 11, cx: BARS[0].x, n: Math.round(70 * clamp((4.5 - t) / 1.5)) });
  barCam(t, 8, -3.0, -2.8, 20, 19.5, 3.2, 340);
  setHud('くらべると', 'お札ぜんぶ', 1);
  const v = countUp(t, 1146, 4.0, 1.4);
  setTop('日本銀行券の発行高（2026年9月平均）', (v / 10).toFixed(1) + '兆円', fade(t, 3.9, 8, 0.25), '#cfe8c8');
  return stage;
}
function shot5(t, T) { // vs the national budget
  stageOnly();
  setBar(0, U1, 1); setBar(1, U1, easeOut(clamp((t - 0.4) / 1.4)));
  barCam(t, 9.2, -2.8, -2.8, 19.5, 20, 3.2, 340);
  setHud('くらべると', '国の予算', 1);
  const v = countUp(t, 1223, 0.4, 1.4);
  setTop('国の一般会計予算（2026年度）', (v / 10).toFixed(1) + '兆円', fade(t, 0.15, 9.2, 0.25));
  return stage;
}
function shot6(t, T) { // vs household financial assets: rescale
  stageOnly();
  const s = ease(clamp(t / 1.2)); const unit = lerp(U1, U2, s);
  setBar(0, unit, 1, s < 0.1 || s > 0.9); setBar(1, unit, 1, s < 0.1 || s > 0.9);
  setBar(2, U2, easeOut(clamp((t - 1.1) / 1.6)));
  barCam(t, 8.8, -2.8, -1.4, 20, 22, 3.2, 400);
  setHud('くらべると', '家計の資産', 1);
  const v = countUp(t, 2519, 1.2, 1.6);
  setTop('家計の金融資産（2026年6月末）', comma(v) + '兆円', fade(t, 1.1, 8.8, 0.25), '#ffe08a');
  return stage;
}
function shot7(t, T) { // result: the payout dwarfs everything
  stageOnly();
  const s = ease(clamp(t / 1.0)); const unit = lerp(U2, U3, s);
  for (let i = 0; i < 3; i++) setBar(i, unit, 1, s < 0.1 || s > 0.9);
  setBar(3, U3, easeOut(clamp((t - 0.8) / 2.0)));
  setBills('rain', t, { w: 14, d: 4, top: 14, cz: -4, n: Math.round(NB * clamp((t - 2.5) / 1.5)) });
  barCam(t, 7.5, 0.2, 0.6, 27, 28.5, 4.8, 400);
  if (t < 5.8) setTop('家計のお金（配る前とくらべて・推計）', '約' + (countUp(t, 59, 0.9, 1.6) / 10).toFixed(1) + '倍', fade(t, 0.15, 5.8, 0.2), '#ff8a7a');
  else setTop('1億円の今の価値（物価も同じだけ上がると・単純計算）', '約' + comma(10000 - countUp(t - 5.8, 8300, 0.1, 1.2)) + '万円', fade(t, 5.8, 7.5, 0.2), '#ffe08a');
  return stage;
}
function shot8(t, T) { // loop: the pressed button, bills everywhere
  stageOnly(); btn.visible = true; setButton(0); btn.scale.setScalar(1);
  setBills('rest', 0, { w: 9, d: 5, cz: -0.6 });
  btnCam(t, 4, 0);
  setHud('', '押す？', 1);
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
    id: '0022',
    title: '日本人全員に1億円配られたら？',
    titleHtml: '日本人全員に<br>1億円配られたら？',
    mood: 'mystery', seed: 23, hits: [1.2, 18.1, 48.1], risers: [1.2, 46.5],
    impacts: [18.1, 48.1, 52.6],
    ask: '1億円もらったら仕事つづける？',
    narr: { '1京': 'いっけい', '京は': 'けいは', '1万倍': 'いちまんばい', '1,700万円': '1700万円', '5.9倍': '5.9ばい' },
    caption: 'もしも日本人全員に1億円配られたら？\n1億2,265万人に1億円ずつ配ると、総額は約1京2,265兆円（推計）。日本中のお札114.6兆円、国の予算122.3兆円、家計の金融資産2,519兆円とくらべてみた。\n\n結果：家計のお金は一晩で約5.9倍。でもお米も家も1つも増えない。値段も同じだけ上がると、1億円の価値は今の約1,700万円（単純計算）。\n\n公式統計からの試算です（投資のすすめではありません）。\n\n1億円もらったら仕事つづける？ コメントで教えて。\n\n出典：総務省 人口推計（2026年9月概算）、日本銀行 マネタリーベース（2026年9月）・資金循環統計（2026年第2四半期速報）、財務省 令和8年度予算',
    hashtags: ['もしもラボ', '1億円', 'お金', 'ベーシックインカム', '雑学'],
    endStats: [['配った総額（推計）', '約1京2,265兆円', '2026年9月の人口'], ['日本中のお札', '114.6兆円', '2026年9月平均'], ['国の一般会計予算', '122.3兆円', '2026年度'], ['家計の金融資産', '2,519兆円', '2026年6月末'], ['1億円の価値（単純計算）', '約1,700万円', '今のお金で']],
    sources: '出典：総務省 人口推計（2026年9月概算）、日本銀行 マネタリーベース・<br>資金循環統計（2026年第2四半期速報）、財務省 令和8年度予算',
  },
});
