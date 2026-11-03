import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { japan, setDots, setMapEnv, makeRing, ll, CITY } from '../scenes/japan.js';

// もしも日本からデートの奢りが消えたら？（皮肉回・台本 S14・社会の消えたら）
// 2026/11/03 ゆうと承認。元ネタ：ガルちゃん・Togetter で定期的に燃える 奢り奢られ論争
// 数字（一次資料で確認）：
//  「恋人として交際」した人がいない 20〜30代の独身 男性37.6%・女性24.1%
//  内閣府 男女共同参画局「令和4年版 男女共同参画白書」特集 第2節（元の調査：令和3年度 人生100年時代における結婚・仕事・収入に関する調査）
//  https://www.gender.go.jp/about_danjo/whitepaper/r04/zentai/html/honpen/b1_s00_02.html

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#241c24'); S.fog = new THREE.Fog(0x241c24, 40, 160);
const hemi = new THREE.HemisphereLight(0xfff0e0, 0x5a4a4a, 1.3); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#2c2228', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function dinnerTable(x, z, { cloth = '#f4efe6', candle = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const top = box(1.4, 0.06, 0.9, mat(cloth)); top.position.y = 0.76; g.add(top);
  const leg = box(0.12, 0.74, 0.12, mat('#4a3a30')); leg.position.y = 0.37; g.add(leg);
  for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), mat('#ffffff')); pl.position.set(s * 0.42, 0.8, 0); g.add(pl);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.18, 10), mat('#d8e8f4', { transparent: true, opacity: 0.7 })); gl.position.set(s * 0.42, 0.89, -0.25); g.add(gl);
    const ch = new THREE.Group(); const seat = box(0.45, 0.06, 0.45, mat('#6a3a3a')); seat.position.y = 0.47; ch.add(seat); const back = box(0.45, 0.6, 0.06, mat('#6a3a3a')); back.position.set(0, 0.78, -0.21); ch.add(back); const cl = box(0.06, 0.45, 0.06, mat('#3a2a20')); cl.position.y = 0.23; ch.add(cl); ch.position.set(s * 1.05, 0, 0); ch.rotation.y = -s * Math.PI / 2; g.add(ch); }
  if (candle) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), mat('#fff8e8')); c.position.set(0, 0.87, 0.1); g.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffcf5a' })); f.position.set(0, 0.97, 0.1); g.add(f); g.userData.flame = f; }
  return g;
}
function seat(p, x, z, side) { p.position.set(x + side * 0.95, -0.39 * p.scale.y, z); p.rotation.set(0, -side * Math.PI / 2, 0); p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); }

// ---------- A：レストラン（原点） ----------
const rfl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat('#5a3a30', { depthWrite: false })); rfl.rotation.x = -Math.PI / 2; rfl.position.set(0, 0.02, 1); rfl.renderOrder = -0.8; S.add(rfl);
const rwall = box(14, 3.6, 0.2, mat('#a8665a')); rwall.position.set(0, 1.8, -3); S.add(rwall);
for (let i = 0; i < 4; i++) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffd89a' })); lamp.position.set(-3 + i * 2, 2.6, -2.85); S.add(lamp); }
const T0 = dinnerTable(0, 0); S.add(T0);
const HIM = makeMan({ shirt: '#3a4a6a', hair: '#1d1a19' }); S.add(HIM);
const HER = makeWoman({ shirt: '#e86a8a', hair: '#4a2c1e', skirt: true }); S.add(HER);
// 伝票（左右の半分を別の板に）
function receiptHalf(side) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 640; const g = c.getContext('2d');
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 256, 640); g.fillStyle = '#222'; g.textBaseline = 'middle';
  g.save(); g.translate(side < 0 ? 0 : -256, 0);
  g.textAlign = 'center'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText('お会計', 256, 80);
  g.fillStyle = '#999'; for (let i = 0; i < 6; i++) g.fillRect(60, 170 + i * 56, 392 - (i % 3) * 60, 18);
  g.fillStyle = '#c03040'; g.fillRect(40, 520, 432, 6); g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.fillStyle = '#222'; g.fillText('合計', 256, 580);
  g.restore();
  // ギザギザの切れ目
  g.fillStyle = 'rgba(0,0,0,0)';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const RL = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.25), new THREE.MeshBasicMaterial({ map: receiptHalf(-1), side: THREE.DoubleSide })); S.add(RL);
const RR = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.25), new THREE.MeshBasicMaterial({ map: receiptHalf(1), side: THREE.DoubleSide })); S.add(RR);
function receipt(u, y = 1.75, z = 0.1, s = 1) { const e = easeOut(clamp(u)); RL.scale.setScalar(s); RR.scale.setScalar(s); RL.position.set(-0.25 * s - e * 0.55, y - e * 0.12, z); RR.position.set(0.25 * s + e * 0.55, y - e * 0.12, z); RL.rotation.set(0, 0, e * 0.25); RR.rotation.set(0, 0, -e * 0.25); RL.visible = RR.visible = true; }
const rip = makeSparkles(160, 0.14, 0xffffff); S.add(rip.points); rip.init([[0, 1.75, 0.2]], 0.3, 1.2);
const warikan = label('割り勘', { w: 512, size: 150, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 1.4 }); S.add(warikan);
const mainichi = label('毎回 奢り', { w: 768, size: 120, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.5 }); S.add(mainichi);
const muri = label('もう無理', { w: 512, size: 140, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 1.4 }); S.add(muri);
const wallet = box(0.26, 0.18, 0.04, mat('#3a2a20')); S.add(wallet);
const ha = label('は？ 割り勘？', { w: 768, size: 120, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 1.7 }); S.add(ha);
const nedan = label('わたしの値段', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(nedan);
const down = label('↓', { w: 256, h: 256, size: 220, color: '#3a7ae8', sx: 0.7 }); S.add(down);
const OGORI = [0, 1, 2, 3, 4].map(i => { const m = makeMan({ shirt: ['#3a4a6a', '#5a6a4a', '#6a4a5a', '#4a5a6a', '#2a3a4a'][i], hair: '#1d1a19' }); m.scale.setScalar(0.55); S.add(m); return m; });
const sweat = new THREE.Group(); { const m = new THREE.MeshBasicMaterial({ color: '#7fd0ff' }); [[0.24, 0.3], [-0.24, 0.22]].forEach(([x, y]) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), m); d.scale.y = 1.5; d.position.set(x, y, 0.1); sweat.add(d); }); } HIM.userData.head.add(sweat);

// ---------- B：高級店（x=60） ----------
const BX = 60;
const bfl = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), mat('#3a2a26', { depthWrite: false })); bfl.rotation.x = -Math.PI / 2; bfl.position.set(BX, 0.02, -2); bfl.renderOrder = -0.8; S.add(bfl);
const bwall = box(16, 4, 0.2, mat('#4a2a2a')); bwall.position.set(BX, 2, -8); S.add(bwall);
const FANCY = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const t = dinnerTable(BX - 3.2 + c * 3.2, -1.5 - r * 2.4, { cloth: '#fbf6ee' }); S.add(t); FANCY.push(t); }
const course = label('高級コース', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.7 }); course.position.set(BX, 3.4, -7.8); S.add(course);
const garagara = label('予約 ガラガラ', { w: 768, size: 120, color: '#fff', bg: 'rgba(90,90,100,.94)', sx: 1.9 }); S.add(garagara);
const waiter = makeMan({ shirt: '#f4f4f4', pants: '#1a1a1a', hair: '#1d1a19' }); S.add(waiter);

// ---------- C：戻ってくる男たち（x=110） ----------
const CX = 110;
const cfl = new THREE.Mesh(new THREE.PlaneGeometry(30, 60), mat('#3a3440', { depthWrite: false })); cfl.rotation.x = -Math.PI / 2; cfl.position.set(CX, 0.02, -20); cfl.renderOrder = -0.8; S.add(cfl);
const MEN = []; { const r = rng(9); for (let i = 0; i < 18; i++) { const m = makeMan({ shirt: ['#4a5a7a', '#6a6a5a', '#5a4a6a', '#3a5a5a', '#7a5a4a'][i % 5], hair: r() < 0.2 ? '#4a3a2a' : '#1d1a19', pants: '#2b3346' }); m.userData.x0 = CX - 4 + (i % 6) * 1.6 + (r() - 0.5) * 0.6; m.userData.z0 = -6 - Math.floor(i / 6) * 2.4 - r() * 0.8; m.userData.ph = r() * 6; S.add(m); MEN.push(m); } }
const modoru = label('恋愛に戻ってくる', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 2.1 }); S.add(modoru);
const gate = new THREE.Group(); { const l = box(0.3, 3, 0.3, mat('#e86a8a')); l.position.set(-2.6, 1.5, 0); gate.add(l); const r = box(0.3, 3, 0.3, mat('#e86a8a')); r.position.set(2.6, 1.5, 0); gate.add(r); const t = box(5.6, 0.4, 0.3, mat('#e86a8a')); t.position.set(0, 3.1, 0); gate.add(t); } gate.position.set(CX, 0, -1); gate.visible = false; S.add(gate);
const renai = label('恋愛', { w: 512, size: 140, color: '#fff', bg: 'rgba(230,90,130,.96)', sx: 1.3 }); renai.position.set(CX, 3.9, -1); renai.visible = false; S.add(renai);

// ---------- D：37.6%（x=160） ----------
const DX = 160;
const PIE_R = 2.2, SHARE = 0.376;
const pieBase = new THREE.Mesh(new THREE.CylinderGeometry(PIE_R, PIE_R, 0.4, 64, 1, false, 0, Math.PI * 2 * (1 - SHARE)), new THREE.MeshBasicMaterial({ color: '#7a8098' })); pieBase.rotation.x = Math.PI / 2; S.add(pieBase);
const pieNo = new THREE.Mesh(new THREE.CylinderGeometry(PIE_R, PIE_R, 0.4, 48, 1, false, Math.PI * 2 * (1 - SHARE), Math.PI * 2 * SHARE), new THREE.MeshBasicMaterial({ color: '#4a8ae8' })); pieNo.rotation.x = Math.PI / 2; S.add(pieNo);
const noL = label('恋人がいたことがない', { w: 1024, size: 92, color: '#fff', bg: 'rgba(60,110,200,.96)', sx: 2.3 }); S.add(noL);
const dmen = label('20〜30代の独身男性', { w: 1024, size: 92, color: '#fff', bg: 'rgba(60,60,80,.92)', sx: 2.3 }); S.add(dmen);

// ---------- E：ハードル・断る・結果（x=210） ----------
const EX = 210;
const efl = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), mat('#c8b8a0', { depthWrite: false })); efl.rotation.x = -Math.PI / 2; efl.position.set(EX, 0.02, -1); efl.renderOrder = -0.8; S.add(efl);
const ewall = box(20, 3.6, 0.2, mat('#e8d8c0')); ewall.position.set(EX, 1.8, -5); S.add(ewall);
const hurdle = new THREE.Group(); { const a = box(0.12, 1, 0.12, mat('#d8d8d8')); a.geometry.translate(0, 0.5, 0); a.position.x = -1.2; hurdle.add(a); const b = box(0.12, 1, 0.12, mat('#d8d8d8')); b.geometry.translate(0, 0.5, 0); b.position.x = 1.2; hurdle.add(b); const bar = box(2.6, 0.2, 0.12, mat('#e84a5a')); hurdle.add(bar); hurdle.userData = { a, b, bar }; } hurdle.position.set(EX - 4, 0, -1); S.add(hurdle);
function setHurdle(h) { hurdle.userData.a.scale.y = h; hurdle.userData.b.scale.y = h; hurdle.userData.bar.position.y = h; }
const sasou = label('誘うハードル', { w: 768, size: 110, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 1.6 }); S.add(sasou);
const kotowari = label('今日はやめとくね', { w: 768, size: 100, color: '#222', bg: 'rgba(255,255,255,.97)', sx: 1.7 }); S.add(kotowari);
const okL = label('OK！', { w: 512, size: 130, color: '#fff', bg: 'rgba(60,160,110,.95)', sx: 1.0 }); S.add(okL);
const CAFE = [0, 1, 2].map(i => { const t = dinnerTable(EX + 3 + (i - 1) * 3.0, -2.2 + (i % 2) * 0.4, { cloth: '#ffffff', candle: false }); S.add(t); return t; });
const COUPLES = CAFE.map((t, i) => { const m = makeMan({ shirt: ['#5a7a5a', '#7a6a4a', '#4a6a8a'][i], hair: '#1d1a19' }); const w = makeWoman({ shirt: ['#d8a0c0', '#a0c8d8', '#e8c890'][i], hair: ['#3a2418', '#1d1a19', '#5a3a28'][i] }); S.add(m); S.add(w); return [m, w, t]; });
const futsuu = label('普通の男と普通の女', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.2 }); S.add(futsuu);
const nyujo = label('奢り ＝ 入場料？', { w: 1024, size: 110, color: '#fff', bg: 'rgba(120,70,160,.95)', sx: 2.1 }); S.add(nyujo);
const coinsFx = makeSparkles(120, 0.2, 0xffd27a); S.add(coinsFx.points);

// ---------- 日本地図 ----------
const tk = ll(...CITY.tokyo); const ring = makeRing('#ff9ab8', 0.9);

function poseClear(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; p.rotation.set(0, 0, 0); }
const ALL = [HIM, HER, ...OGORI, waiter, ...MEN, ...COUPLES.flatMap(c => [c[0], c[1]])];
function reset() {
  ALL.forEach(p => { poseClear(p); p.visible = false; });
  [warikan, mainichi, muri, ha, nedan, down, garagara, modoru, noL, dmen, sasou, kotowari, okL, futsuu, nyujo, renai].forEach(l => l.visible = false);
  RL.visible = RR.visible = false; wallet.visible = false; sweat.visible = false; rip.set(0); coinsFx.set(0);
  pieBase.scale.setScalar(0.001); pieNo.scale.setScalar(0.001); setHurdle(1.2);
  hemi.intensity = 1.3; S.background.set('#241c24'); el.flash.style.opacity = 0; setHud('', '', 0);
}
function couple() { HIM.visible = HER.visible = true; seat(HIM, 0, 0, -1); seat(HER, 0, 0, 1); }
const TP = 0.15;
function tableCam(d) { look(lerp(0.0, 0.05, d), 2.9, lerp(7.4, 8.0, d), 0, 2.05, -0.2, 52); }
function shot0(t) { // 0秒＝サムネ：レストランの伝票が、テーブルの真ん中でぴったり半分に裂ける
  reset(); lift(0); couple(); const u = clamp((t - TP) / 0.35); receipt(u, 1.95, 0.25, 1.15);
  el.flash.style.opacity = t > TP + 0.1 && t < TP + 0.25 ? 0.3 : 0; rip.set(clamp((t - TP) / 1.2));
  HIM.userData.head.rotation.y = t > 0.6 ? -0.3 : 0; HER.userData.head.rotation.y = t > 0.6 ? 0.3 : 0;
  warikan.position.set(0, 0.95, 1.0); pop(warikan, t, TP + 0.3, 0.25, 1.3);
  tableCam(ease(clamp(t / 3.4)));
  return S;
}
function shot1(t) { // 男たちの不満が限界を超えた
  reset(); lift(0); couple(); sweat.visible = true; HIM.userData.head.rotation.x = 0.3;
  RL.visible = RR.visible = true; RL.position.set(-0.12, 0.8, 0.15); RR.position.set(0.12, 0.8, 0.15); RL.rotation.set(-Math.PI / 2, 0, 0); RR.rotation.set(-Math.PI / 2, 0, 0); RL.scale.setScalar(0.5); RR.scale.setScalar(0.5);
  mainichi.position.set(-0.8, 2.3, 0); pop(mainichi, t, 0.5, 0.3, 1.1);
  look(-0.4, 2.2, 4.8, -0.5, 1.5, 0, 52);
  return S;
}
function shot2(t) { // 毎回奢るのは、もう無理
  reset(); lift(0); couple(); HIM.userData.arms[1].rotation.x = -1.8; wallet.visible = true; wallet.position.set(-0.75, 1.55, 0.35);
  muri.position.set(-0.8, 2.35, 0); pop(muri, t, 0.3, 0.25, 1.0); el.flash.style.opacity = t > 0.3 && t < 0.42 ? 0.2 : 0;
  look(-0.4, 2.2, 4.8, -0.5, 1.5, 0, 52);
  return S;
}
function shot3(t) { // ある日、日本からデートの奢りが消えた
  setMapEnv('dusk'); const u = clamp(t / 2.6), R = u * 220;
  setDots((i, x, z, q) => { const d = Math.hypot(x - tk.x, z - tk.z); const on = d < R; return { color: on ? '#ff6a9a' : '#ffd27a', s: on ? 1.3 : 1, y: on ? 0.25 : 0 }; });
  ring.visible = true; ring.position.set(tk.x, ring.position.y, tk.z); ring.scale.setScalar(Math.max(0.1, R)); ring.material.opacity = 0.9 * (1 - u);
  const e = ease(clamp(t / 3.4)); look(lerp(-8, -4, e), lerp(300, 280, e), lerp(95, 85, e), -4, 0, -30, 50);
  setTop('日本から', 'デートの奢りが消えた', fade(t, 0.3, 3.3, 0.25), PINK);
  return japan;
}
function shot4(t) { // 会計は全部、割り勘
  reset(); lift(0); couple(); receipt(1, 1.95, 0.25, 1.15);
  warikan.position.set(0, 2.95, 0.3); warikan.visible = true; warikan.userData.size(1.3);
  HIM.userData.arms[1].rotation.x = -1.2; HER.userData.arms[0].rotation.x = -1.2;
  tableCam(1);
  return S;
}
function shot5(t) { // 怒ったのは、奢られて当然だった女子たち
  reset(); lift(0); couple(); HER.userData.arms[0].rotation.set(-1.3, 0, 1.2); HER.userData.arms[1].rotation.set(-1.3, 0, -1.2); HER.userData.head.rotation.x = -0.15;
  ha.position.set(0.7, 2.35, 0); pop(ha, t, 0.4, 0.3, 1.2);
  look(0.5, 2.2, 4.8, 0.5, 1.5, 0, 52);
  return S;
}
function shot6(t) { // 奢ってくれる人の数で、自分の値段を測っていた
  reset(); lift(0); HER.visible = true; HER.position.set(0.0, 0, 1.0); HER.rotation.set(0, 0, 0); HER.userData.head.rotation.x = -0.1;
  OGORI.forEach((m, i) => { m.visible = i < Math.min(5, 1 + Math.floor(t * 1.6)); m.position.set(-1.6 + i * 0.8, 0, -0.3); m.rotation.y = 0.0; m.userData.head.rotation.x = 0.2; });
  nedan.position.set(0, 2.6, 1.0); pop(nedan, t, 0.3, 0.3, 1.6);
  down.position.set(1.05, 2.6, 1.05); pop(down, t, 2.8, 0.25, 0.7);
  if (t > 2.8) OGORI.forEach((m, i) => { m.visible = i < Math.max(0, 5 - Math.floor((t - 2.8) * 4)); });
  look(0, 2.2, 5.0, 0, 1.6, 0, 52);
  return S;
}
function shot7(t) { // 高いコースのお店は、予約がガラガラに
  reset(); lift(0); waiter.visible = true; waiter.position.set(BX + 1.6, 0, -0.5); waiter.rotation.y = -0.3; waiter.userData.head.rotation.x = 0.25;
  garagara.position.set(BX, 2.4, -1.0); pop(garagara, t, 0.8, 0.3, 1.9); hemi.intensity = 0.85;
  look(BX, 4.2, 6.0, BX, 1.3, -4.0, 52);
  return S;
}
function shot8(t) { // 一方、お金がなくて恋愛から降りていた男たちが戻ってくる
  reset(); lift(0); MEN.forEach((m, i) => { m.visible = true; const z = m.userData.z0 + t * 1.3; m.position.set(m.userData.x0, 0, z); m.rotation.y = 0; const s = Math.sin(t * 8 + m.userData.ph) * 0.5; m.userData.legs[0].rotation.x = s; m.userData.legs[1].rotation.x = -s; m.userData.arms[0].rotation.x = -s; m.userData.arms[1].rotation.x = s; });
  modoru.position.set(CX, 3.1, -3); pop(modoru, t, 1.8, 0.3, 2.0); hemi.intensity = 1.5;
  look(CX, 2.2, 5.0, CX, 1.6, -6, 52);
  return S;
}
function pieCam() { look(DX, 3.6, 6.6, DX, 3.6, -4, 52); }
function shot9(t) { // 20〜30代の独身男性の37.6%は、
  reset(); lift(300); const u = easeOut(clamp((t - 0.2) / 0.8)); pieBase.scale.setScalar(Math.max(0.001, u)); pieNo.scale.setScalar(Math.max(0.001, u));
  pieBase.position.set(DX, 3.0, -4); pieNo.position.set(DX, 3.0, -4 + 0.6 * easeOut(clamp((t - 1.2) / 0.5)));
  dmen.position.set(DX, 5.45, -3.4); pop(dmen, t, 0.2, 0.3, 2.2);
  pieCam(); setTop('20〜30代の独身男性（2021年度調査）', '37.6%', fade(t, 0.3, 5.7, 0.25), BLUE);
  return S;
}
function shot10(t) { // 恋人として付き合った経験がない
  reset(); lift(300); pieBase.scale.setScalar(1); pieNo.scale.setScalar(1); pieBase.position.set(DX, 3.0, -4); pieNo.position.set(DX, 3.0, -3.4);
  noL.position.set(DX, 5.45, -3.4); pop(noL, t, 0.2, 0.3, 2.2);
  pieCam(); setTop('恋人として付き合った経験なし', '37.6%', fade(t, 0.1, 2.8, 0.25), BLUE);
  return S;
}
function shot11(t) { // 割り勘なら、誘うハードルがぐっと下がる
  reset(); lift(260); const h = lerp(1.2, 0.35, easeOut(clamp((t - 0.8) / 1.0))); setHurdle(h);
  HIM.visible = true; HIM.position.set(EX - 5.6 + clamp((t - 1.8) / 1.4) * 3.2, Math.sin(clamp((t - 2.4) / 0.5) * Math.PI) * 0.4, -0.9); HIM.rotation.set(0, Math.PI / 2, 0);
  const s = Math.sin(t * 9) * 0.5 * (t > 1.8 ? 1 : 0); HIM.userData.legs[0].rotation.x = s; HIM.userData.legs[1].rotation.x = -s;
  sasou.position.set(EX - 4, h + 0.75, -0.8); sasou.visible = true; sasou.userData.size(1.6);
  look(EX - 4, 2.2, 5.2, EX - 4, 1.3, -1, 52);
  return S;
}
function shot12(t) { // 女性の側も、気をつかわずに断れるようになる
  reset(); lift(0); HIM.visible = HER.visible = true; HIM.position.set(EX - 1.0, 0, -0.6); HIM.rotation.y = 0.8; HER.position.set(EX + 0.4, 0, -0.6); HER.rotation.y = -0.8;
  HER.userData.arms[1].rotation.set(-1.2, 0, 0); HER.userData.head.rotation.x = 0.15 * Math.sin(clamp((t - 0.6) / 0.6) * Math.PI);
  kotowari.position.set(EX + 0.05, 2.45, -0.5); pop(kotowari, t, 0.5, 0.3, 1.45);
  okL.position.set(EX - 1.1, 2.1, -0.5); pop(okL, t, 2.2, 0.3, 1.0); if (t > 2.2) HIM.userData.arms[1].rotation.set(-2.6, 0, 0.3);
  look(EX - 0.3, 2.1, 4.4, EX - 0.3, 1.5, -0.6, 52);
  return S;
}
function cafe(t) { COUPLES.forEach(([m, w, tb], i) => { m.visible = w.visible = true; seat(m, tb.position.x, tb.position.z, -1); seat(w, tb.position.x, tb.position.z, 1); m.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 3 + i) * 0.2; w.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 3 + i + 1) * 0.2; }); }
function shot13(t) { // 結果：奢りが消えて得をしたのは、
  reset(); lift(0); cafe(t); hemi.intensity = 1.2;
  const u = ease(clamp(t / 3.4)); look(EX + 3, lerp(3.4, 3.0, u), lerp(7.2, 6.4, u), EX + 3, 1.3, -2.0, 52);
  setTop('結果', '得をしたのは…', fade(t, 0.15, 3.4, 0.25), RED);
  return S;
}
function shot14(t) { // 普通の男と普通の女だった
  reset(); lift(0); cafe(t + 3); futsuu.position.set(EX + 3, 2.75, -2.0); pop(futsuu, t, 0.3, 0.35, 2.2); coinsFx.init([[EX + 3, 2.4, -2]], 4, 1.4); coinsFx.set(clamp(t / 3.3));
  look(EX + 3, 3.0, 6.4, EX + 3, 1.6, -2.0, 52);
  setTop('結果', '普通の男と普通の女', fade(t, 0.1, 3.3, 0.25), RED);
  return S;
}
function shot15(t) { // 奢りは愛情じゃなく、入場料だったのかもしれない
  reset(); lift(0); couple(); receipt(1, 1.95, 0.25, 1.15); hemi.intensity = 0.9;
  nyujo.position.set(0, 2.95, 0.3); pop(nyujo, t, 0.6, 0.35, 2.1);
  const u = ease(clamp(t / 4.3)); look(0, lerp(3.0, 3.4, u), lerp(6.6, 7.6, u), 0, 1.8, -0.2, 52);
  return S;
}
function shot16(t) { // 質問。最後は冒頭と同じ構図（伝票は裂けたまま）
  reset(); lift(0); couple(); receipt(1, 1.95, 0.25, 1.15); tableCam(0);
  return S;
}

const SUBS = [
  [3.4, 6.2, '男たちの不満が<br>限界を超えた。'],
  [6.25, 8.45, '毎回奢るのは、<br>もう無理。'],
  [8.5, 11.9, 'ある日、日本から<br>デートの奢りが消えた。'],
  [11.95, 14.05, '会計は全部、<br>割り勘。'],
  [14.1, 17.7, '怒ったのは、奢られて<br>当然だった女子たち。'],
  [17.75, 22.0, '奢ってくれる人の数で、<br>自分の値段を測っていた。'],
  [22.05, 25.4, '高いコースのお店は、<br>予約がガラガラに。'],
  [25.45, 30.95, '一方、お金がなくて恋愛から<br>降りていた男たちが戻ってくる。'],
  [31.0, 36.9, '20〜30代の独身男性の<br>37.6%は、'],
  [36.95, 39.95, '恋人として付き合った<br>経験がない。'],
  [40.0, 43.35, '割り勘なら、誘う<br>ハードルがぐっと下がる。'],
  [43.4, 47.35, '女性の側も、気をつかわずに<br>断れるようになる。'],
  [47.4, 50.8, '結果：奢りが消えて<br>得をしたのは、'],
  [50.85, 54.2, '普通の男と<br>普通の女だった。'],
  [54.25, 58.6, '奢りは愛情じゃなく、<br>入場料だったのかも。'],
  [58.65, 61.75, '初デート、<br>奢る？割り勘？'],
];
const shots = [
  { a: 0, b: 3.4, f: shot0 }, { a: 3.4, b: 6.25, f: shot1 }, { a: 6.25, b: 8.5, f: shot2 }, { a: 8.5, b: 11.95, f: shot3 },
  { a: 11.95, b: 14.1, f: shot4 }, { a: 14.1, b: 17.75, f: shot5 }, { a: 17.75, b: 22.05, f: shot6 }, { a: 22.05, b: 25.45, f: shot7 },
  { a: 25.45, b: 31.0, f: shot8 }, { a: 31.0, b: 36.95, f: shot9 }, { a: 36.95, b: 40.0, f: shot10 }, { a: 40.0, b: 43.4, f: shot11 },
  { a: 43.4, b: 47.4, f: shot12 }, { a: 47.4, b: 50.85, f: shot13 }, { a: 50.85, b: 54.25, f: shot14 }, { a: 54.25, b: 58.65, f: shot15 },
  { a: 58.65, b: 61.9, f: shot16 }, { a: 61.9, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0638',
    v2: true,
    hookLine: '日本から、デートの奢りが消えた。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本からデートの奢りが消えたら？',
    titleHtml: 'もしも日本から<br>デートの奢りが<br>消えたら？',
    mood: 'tension', seed: 638, hits: [0.3, 47.4, 54.25], risers: [43.4], impacts: [6.25, 11.95, 14.1, 22.05, 31.0, 40.0, 47.4],
    sfx: [[0.3, 'whoosh'], [6.6, 'buzz'], [9.0, 'whoosh'], [14.6, 'buzz'], [20.6, 'poof'], [22.9, 'meter', 0.3], [27.0, 'whoosh'], [41.0, 'whoosh'], [45.7, 'bubble'], [51.2, 'whoosh'], [54.9, 'whoosh']],
    narr: { '20〜30代': 'にじゅうからさんじゅうだい', '37.6%': 'さんじゅうななてんろくパーセント', '結果：': '結果、', '奢り': 'おごり', '奢る': 'おごる', '奢って': 'おごって', '奢られて': 'おごられて', '割り勘': 'わりかん', '入場料だったのかも。': 'にゅうじょうりょうだったのかもしれない。' },
    ask: '初デート、奢る？割り勘？',
    caption: 'もしも、日本からデートの奢りが消えたら？\n\n男たちの不満が限界を超えた。毎回奢るのは、もう無理。\nある日、日本からデートの奢りが消えた。会計は全部、割り勘。\n怒ったのは、奢られて当然だった女子たち。奢ってくれる人の数で、自分の値段を測っていた。高いコースのお店は、予約がガラガラに。\n一方、お金がなくて恋愛から降りていた男たちが戻ってくる。20〜30代の独身男性の37.6%は、恋人として付き合った経験がない。\n割り勘なら、誘うハードルがぐっと下がる。女性の側も、気をつかわずに断れるようになる。\n\n結果：奢りが消えて得をしたのは、普通の男と普通の女だった。\n奢りは愛情じゃなく、入場料だったのかもしれない。\n\n初デート、奢る？割り勘？ コメントで教えて。\n\n※風刺ネタです\n出典：内閣府「令和4年版 男女共同参画白書」（恋人として交際した人がいない20〜30代の独身 男性37.6%・女性24.1%。令和3年度 人生100年時代における結婚・仕事・収入に関する調査）',
    hashtags: ['もしもラボ', 'もしも', '奢り', '割り勘', '初デート'],
    endStats: [['恋人がいたことがない独身男性', '37.6%', '20〜30代'], ['同じく独身女性', '24.1%', '20〜30代'], ['奢りが消えて得をしたのは', '普通の男と普通の女', '']],
    sources: '出典：内閣府「令和4年版 男女共同参画白書」',
  },
});
