import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeWoman, label, pop, makeRoom, makePhone } from '../satire-kit.js';
import { poseClear } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしもタワマンの階がくじ引きだったら？（皮肉回・台本 S38・図星／大人の本音）
// 2026/11/04 ゆうと承認（投稿サーバーで ok）。元ネタ：はてな・Togetter で定期的に話題になる タワマン文学・タワマンの階数カースト の話
// 数字は使わない（風刺だけで組む）。建物・チャットの画面は架空（実在のマンション・アプリの見た目に似せない）

const GOLD = '#ffd27a', RED = '#ff5a5a', BLUE = '#7fd4ff';
const S = new THREE.Scene();
S.background = new THREE.Color('#141a2e'); S.fog = new THREE.Fog(0x141a2e, 60, 260);
const hemi = new THREE.HemisphereLight(0xdfe6ff, 0x30303a, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(8, 18, 14); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 800), mat('#2a2e38', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
// ママ（52階→2階）と、ママ（2階→52階）
const MAMA_A = () => makeWoman({ shirt: '#e8c07a', hair: '#6a4028', pants: '#3a3046', skirt: true });
const MAMA_B = () => makeWoman({ shirt: '#8fc4e8', hair: '#2a1c18', pants: '#2b3346' });
function handHip(p, k = 1) { p.userData.arms[0].rotation.set(-0.2 * k, 0, 0.7 * k); p.userData.arms[1].rotation.set(-0.2 * k, 0, -0.7 * k); }
function chin(p, k = 1) { p.userData.head.rotation.x = -0.18 * k; }
function slump(p, k = 1) { p.userData.head.rotation.x = 0.35 * k; p.userData.arms.forEach(a => a.rotation.set(0.05, 0, 0)); }

// ---------- 窓の外の絵（canvas）：夜景 / 隣の壁 / 見下ろす夜景 ----------
function viewTex(kind) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const g = c.getContext('2d'); const r = rng(kind.length * 31 + 5);
  if (kind === 'yakei' || kind === 'shita') {
    const gr = g.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, '#0e1430'); gr.addColorStop(1, '#2a2050'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 640);
    const hz = kind === 'shita' ? 120 : 330;
    for (let i = 0; i < 70; i++) { const w = 20 + r() * 60, h = (kind === 'shita' ? 40 : 60) + r() * (kind === 'shita' ? 120 : 260), x = r() * 1024, y = kind === 'shita' ? hz + r() * 520 : 640 - h; g.fillStyle = '#1a1e34'; g.fillRect(x, y, w, h); for (let k = 0; k < h * w / 140; k++) { g.fillStyle = r() < 0.5 ? '#ffd27a' : '#fff2c8'; g.fillRect(x + r() * w, y + r() * h, 3, 3); } }
    for (let i = 0; i < 900; i++) { g.fillStyle = ['#ffd27a', '#ffffff', '#ff9a6a', '#9ad4ff'][i % 4]; const y = kind === 'shita' ? hz + r() * 520 : hz + 60 + r() * 250; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(r() * 1024, y, 2 + r() * 3, 2 + r() * 3); }
    g.globalAlpha = 1;
    if (kind === 'shita') { g.strokeStyle = '#ff9a3a'; g.lineWidth = 6; for (const y of [300, 480]) { g.globalAlpha = 0.7; g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y - 60); g.stroke(); } g.globalAlpha = 1; }
  } else { // 隣のマンションの壁（すぐ目の前）
    g.fillStyle = '#8a8c90'; g.fillRect(0, 0, 1024, 640);
    for (let y = 0; y < 640; y += 40) { g.fillStyle = y % 80 ? '#84868a' : '#7e8084'; g.fillRect(0, y, 1024, 40); }
    g.fillStyle = '#5a5e66'; for (const [x, y] of [[120, 120], [700, 360]]) { g.fillRect(x, y, 200, 150); g.fillStyle = '#6a7080'; g.fillRect(x + 10, y + 10, 180, 130); g.fillStyle = '#5a5e66'; }
    g.fillStyle = '#6a6c70'; g.fillRect(470, 0, 26, 640); // 雨どい
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TEX = { yakei: viewTex('yakei'), kabe: viewTex('kabe'), shita: viewTex('shita') };

// ---------- A：タワマンの前の広場（原点）。くじの抽選器と表札 ----------
const towerC = document.createElement('canvas'); towerC.width = 256; towerC.height = 2048;
{ const g = towerC.getContext('2d'); g.fillStyle = '#2a3048'; g.fillRect(0, 0, 256, 2048); const r = rng(38);
  for (let f = 0; f < 53; f++) for (let k = 0; k < 6; k++) { g.fillStyle = r() < 0.62 ? (r() < 0.5 ? '#ffd890' : '#fff0c8') : '#3a4260'; g.fillRect(8 + k * 41, 10 + f * 38.4, 34, 26); } }
const towerT = new THREE.CanvasTexture(towerC); towerT.colorSpace = THREE.SRGBColorSpace;
const TOWER = new THREE.Group(); S.add(TOWER);
{ const tm = new THREE.MeshLambertMaterial({ map: towerT, emissive: '#ffffff', emissiveMap: towerT, emissiveIntensity: 0.55 });
  const t = new THREE.Mesh(new THREE.BoxGeometry(9, 80, 9), tm); t.position.set(0, 40, -26); TOWER.add(t);
  const crown = box(9.6, 1.2, 9.6, mat('#9aa4c0')); crown.position.set(0, 80.6, -26); TOWER.add(crown);
  const lobby = box(12, 4.2, 10, mat('#3a3a44')); lobby.position.set(0, 2.1, -24); TOWER.add(lobby);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), new THREE.MeshBasicMaterial({ color: '#ffe6b0' })); glass.position.set(0, 1.8, -18.94); TOWER.add(glass);
  const r = rng(7);
  for (let i = 0; i < 26; i++) { const h = 10 + r() * 34, w = 6 + r() * 6; const x = (i % 2 ? 1 : -1) * (14 + r() * 70), z = -40 - r() * 80; const b = box(w, h, w, new THREE.MeshLambertMaterial({ color: '#252b40', emissive: '#3a3a50', emissiveIntensity: 0.4 })); b.position.set(x, h / 2, z); TOWER.add(b); }
}
const plaza = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), mat('#4a4e5a', { depthWrite: false })); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.02, -6); plaza.renderOrder = -0.8; S.add(plaza);
// 抽選器（八角形の箱がガラガラ回る）
const DRUM = new THREE.Group(); S.add(DRUM);
const drumBody = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.1, 8), mat('#c8342c')); drumBody.rotation.z = Math.PI / 2;
const drumSpin = new THREE.Group(); drumSpin.add(drumBody); drumSpin.position.y = 1.55; DRUM.add(drumSpin);
for (const x of [-0.58, 0.58]) { const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, 0.06, 8), mat('#f2c14e')); rim.rotation.z = Math.PI / 2; rim.position.x = x; drumSpin.add(rim); }
const crank = box(0.08, 0.7, 0.08, mat('#c9ced8')); crank.position.set(0.72, 0.35, 0); drumSpin.add(crank);
const knob = box(0.3, 0.14, 0.14, mat('#2a2a30')); knob.position.set(0.86, 0.7, 0); drumSpin.add(knob);
for (const z of [-0.9, 0.9]) { const leg = box(0.12, 1.6, 0.12, mat('#6a4a30')); leg.position.set(0, 0.8, z * 0.7); leg.rotation.x = z > 0 ? 0.18 : -0.18; DRUM.add(leg); }
const DT = box(2.6, 1.0, 1.8, mat('#e9e4da')); DT.position.set(0, -0.5, 0); DRUM.add(DT); const DTc = box(2.64, 0.4, 1.84, mat('#c8342c')); DTc.position.set(0, -0.25, 0); DRUM.add(DTc);
const tray = box(0.6, 0.1, 0.9, mat('#6a4a30')); tray.position.set(0, 0.55, 0.9); DRUM.add(tray);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mat('#ffffff')); DRUM.add(ball);
DRUM.scale.setScalar(0.7); DRUM.position.set(0, 1.0, 2);
// 表札（金の札）
const PLATE = label('53階', { w: 640, size: 200, color: '#3a2200', bg: 'rgba(255,210,110,.98)', sx: 2.2 }); S.add(PLATE);
const PLATE2 = label('2階', { w: 640, size: 200, color: '#fff', bg: 'rgba(90,96,112,.98)', sx: 2.2 }); S.add(PLATE2);
const KUJI = label('部屋のくじ', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.6 }); S.add(KUJI);
const sparkA = makeSparkles(120, 0.18, 0xffe6a0); S.add(sparkA.points); sparkA.init([[0, 2.8, 2.6]], 1.0, 1.0);

// ---------- E：エレベーターの中（x=100） ----------
const EX = 100;
const ELEV = new THREE.Group(); ELEV.position.set(EX, 0, 0); S.add(ELEV);
{ const wm = mat('#b9bec8'), fm = mat('#6a6e78');
  const fl = box(2.6, 0.1, 2.4, fm); fl.position.y = -0.05; ELEV.add(fl);
  const back = box(2.6, 2.8, 0.1, wm); back.position.set(0, 1.4, -1.2); ELEV.add(back);
  for (const s of [-1, 1]) { const sd = box(0.1, 2.8, 2.4, wm); sd.position.set(s * 1.3, 1.4, 0); ELEV.add(sd); }
  const ceilE = box(2.6, 0.1, 2.4, mat('#e8eaf0')); ceilE.position.set(0, 2.85, 0); ELEV.add(ceilE);
  const rail = box(2.4, 0.06, 0.08, mat('#e0e4ea')); rail.position.set(0, 0.95, -1.1); ELEV.add(rail);
  const panel = box(0.34, 0.9, 0.04, mat('#2a2e38')); panel.position.set(1.24, 1.3, -0.3); panel.rotation.y = -Math.PI / 2; ELEV.add(panel);
  for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), new THREE.MeshBasicMaterial({ color: i === 3 ? '#ffd27a' : '#c9ced8' })); b.position.set(1.215, 0.95 + i * 0.075, -0.3 + (i % 2 ? 0.07 : -0.07)); b.rotation.y = -Math.PI / 2; ELEV.add(b); }
}
const E_A = MAMA_A(); ELEV.add(E_A); const E_B = MAMA_B(); ELEV.add(E_B);
const nankai = label('何階ですか？', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.25 }); S.add(nankai);
const nikai = label('…2階です', { w: 640, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(nikai);
const tsurai = label('つらい', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 0.75 }); S.add(tsurai);
const shiin = label('シーン…', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 1.0 }); S.add(shiin);

// ---------- R：部屋の中（x=200）。窓の外が 夜景 / 壁 / 見下ろす夜景 ----------
const RX = 200;
const ROOM = makeRoom({ w: 8, d: 6, h: 3.4, wall: '#efe9e0', floor: '#c8b090' }); ROOM.position.set(RX, 0, 0); S.add(ROOM);
const winM = new THREE.MeshBasicMaterial({ map: TEX.yakei });
const WIN = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.7), winM); WIN.position.set(RX, 1.75, -2.88); S.add(WIN);
for (const x of [-3.2, -1.07, 1.07, 3.2]) { const f = box(0.1, 2.8, 0.1, mat('#e8e8ea')); f.position.set(RX + x, 1.75, -2.84); S.add(f); }
const sill = box(6.6, 0.1, 0.24, mat('#e8e8ea')); sill.position.set(RX, 0.38, -2.8); S.add(sill);
const sofa = new THREE.Group(); { const sb = box(2.2, 0.45, 0.9, mat('#8a6a9a')); sb.position.y = 0.25; sofa.add(sb); const sbk = box(2.2, 0.6, 0.2, mat('#7a5a8a')); sbk.position.set(0, 0.7, -0.38); sofa.add(sbk); } sofa.position.set(RX + 2.6, 0, 1.2); sofa.rotation.y = -Math.PI / 2; S.add(sofa);
const R_A = MAMA_A(); S.add(R_A); const R_B = MAMA_B(); S.add(R_B);
const mushi = label('低い階って、虫が出るんでしょ？', { w: 1280, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.6 }); S.add(mushi);
const kabeL = label('隣のマンションの壁', { w: 1024, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.9 }); S.add(kabeL);
const yakeiL = label('52階の夜景', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(yakeiL);
const ikkagetsu = label('1か月前', { w: 512, size: 100, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.9 }); S.add(ikkagetsu);
const IMA = label('今', { w: 384, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 0.55 }); S.add(IMA);
const arrow = label('↓', { w: 256, size: 200, color: '#ffd27a', stroke: 16, strokeColor: '#2a1a00', sx: 0.5 }); arrow.material.depthTest = false; arrow.renderOrder = 8; S.add(arrow);

// ---------- P：スマホ（x=300）。ママ友のグループのチャット（架空の画面） ----------
const PX = 300;
const PH = makePhone({ w: 1.9, h: 3.8, cw: 600, ch: 1200 }); PH.g.position.set(PX, 2.0, 0); S.add(PH.g);
const P_BG = box(14, 10, 0.2, mat('#3a3248')); P_BG.position.set(PX, 3, -3); S.add(P_BG);
function drawChat(n, typing) {
  PH.draw(`c${n}${typing}`, (g, w, h) => {
    g.fillStyle = '#f4f1ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a5e70'; g.fillRect(0, 0, w, 120);
    g.fillStyle = '#fff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ママ友（8）', w / 2, 64);
    const msgs = [['明日の幼稚園、雨かな', 0], ['ランチどこにする？', 1], ['新しいお部屋どう？', 0], ['うーん、まあまあ', 1], ['体操着の名前つけた？', 0], ['つけたよー', 1]];
    msgs.slice(0, n).forEach(([s, side], i) => {
      g.font = '700 40px "Noto Sans CJK JP", sans-serif'; const tw = g.measureText(s).width + 50; const y = 170 + i * 150;
      const x = side ? w - 30 - tw : 30; g.fillStyle = side ? '#ffe2a8' : '#ffffff'; g.beginPath(); g.roundRect(x, y, tw, 96, 30); g.fill();
      g.fillStyle = '#2a2a30'; g.textAlign = 'left'; g.fillText(s, x + 25, y + 50);
      if (!side) { g.fillStyle = '#c9ced8'; g.beginPath(); g.arc(x - 0 + 0, y - 14, 0, 0, 7); g.fill(); }
    });
    if (typing) { g.fillStyle = '#9aa0b0'; g.font = '700 36px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('何階になった？ ← 打って消す', w / 2, h - 80); }
  });
}
const darenimo = label('何階かは、誰も言わない', { w: 1024, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.2 }); S.add(darenimo);

// ---------- K：くじ2回目（x=400）。表札が入れ替わる ----------
const KX = 400;
const DRUM2 = DRUM.clone(true); DRUM2.position.set(KX, 0, 2); S.add(DRUM2);
const drumSpin2 = DRUM2.children[0];
const kp = (t, bg, fg) => label(t, { w: 640, size: 200, color: fg, bg, sx: 1.6 });
const K52 = kp('52階', 'rgba(255,210,110,.98)', '#3a2200'), K2 = kp('2階', 'rgba(90,96,112,.98)', '#fff'); S.add(K52); S.add(K2);
const K_A = MAMA_A(); S.add(K_A); const K_B = MAMA_B(); S.add(K_B);
const tsugi = label('次の年', { w: 512, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 0.9 }); S.add(tsugi);

// ---------- 結果：タワマン全体（原点の塔を引きで） ----------
const kekkaL = label('上も下も、どっちも味わった', { w: 1280, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.5 }); S.add(kekkaL);
const takasa = label('ただの高さ', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.4 }); S.add(takasa);
const ruler = new THREE.Group(); { const pole = box(0.5, 80, 0.5, mat('#ffd27a')); pole.position.y = 40; ruler.add(pole); for (let i = 0; i <= 8; i++) { const tk = box(2.0, 0.4, 0.5, mat('#ffd27a')); tk.position.set(1.0, i * 10, 0); ruler.add(tk); } } ruler.position.set(8.5, 0, -21); S.add(ruler);

const PEOPLE = [E_A, E_B, R_A, R_B, K_A, K_B];
const LABELS = [PLATE, PLATE2, KUJI, nankai, nikai, tsurai, shiin, mushi, kabeL, yakeiL, ikkagetsu, IMA, arrow, darenimo, K52, K2, tsugi, kekkaL, takasa];
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; }); K_A.position.set(KX - 2.4, 0, 2.6); K_B.position.set(KX + 2.4, 0, 2.6);
  LABELS.forEach(l => l.visible = false); sparkA.set(0); ruler.visible = false;
  drumSpin.rotation.x = 0; ball.visible = false; drumSpin2.rotation.x = 0; el.flash.style.opacity = 0;
  winM.map = TEX.yakei; R_A.visible = false; R_B.visible = false; S.fog.near = 60; S.fog.far = 260;
}
const TP = 0.45; // 0.45秒で表札が 53階 → 2階 に落ちる
function hookCam(u = 0) { look(lerp(1.8, 2.3, u), 3.0, lerp(7.4, 7.0, u), 0, 2.95, 2, 50); }
function plateDrop(t, t0 = TP, p0 = PLATE, p1 = PLATE2, x = 0, y = 3.0, z = 2.6, sx = 1.7) {
  // くじの玉みたいにくるくる回って（横に縮む）、t0 で 2階 に入れ替わって下に落ちる
  const spin = t < t0 ? Math.abs(Math.cos(t * 16)) : 1;
  p0.visible = t < t0; p0.position.set(x, y, z); p0.userData.size(sx * Math.max(0.12, spin));
  if (t >= t0) { const k = easeOut(clamp((t - t0) / 0.35)); p1.visible = true; p1.position.set(x, y - 0.22 * k, z); p1.userData.size(sx * (k < 1 ? 1.15 - 0.15 * k : 1)); }
}
function shot0(t) { // 0秒＝サムネ：タワマンの53階の表札が、くじの玉みたいにガラガラ回って、2階に落ちる
  reset(); lift(0); drumSpin.rotation.x = -t * 9; plateDrop(t);
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  hookCam(ease(clamp(t / 3)));
  return S;
}
// エレベーター
function elevCam(d = 0) { look(EX + 0.15, 1.7, 4.4 + d, EX, 1.5, -0.4, 46); }
function sHikui(t) { // 低い階の住人の不満から。
  reset(); lift(80); E_A.position.set(-0.55, 0, -0.5); E_B.position.set(0.55, 0, -0.4); E_A.rotation.y = 0.35; E_B.rotation.y = -0.25; slump(E_B, clamp(t / 0.8));
  elevCam(lerp(0.4, 0, ease(clamp(t / 2.5))));
  return S;
}
function sNankai(t) { // エレベーターで、何階ですか？と聞かれるのがつらい。
  reset(); lift(80); E_A.position.set(-0.55, 0, -0.5); E_B.position.set(0.55, 0, -0.4); E_A.rotation.y = 0.5; E_B.rotation.y = -0.25; chin(E_A, 1); handHip(E_A, 0.6);
  nankai.position.set(EX - 0.45, 2.55, -0.3); pop(nankai, t, 0.2, 0.25, 1.05);
  elevCam(0);
  return S;
}
function sTsurai(t) { // 聞かれるのがつらい。
  reset(); lift(80); E_A.position.set(-0.55, 0, -0.5); E_B.position.set(0.55, 0, -0.4); E_A.rotation.y = 0.5; E_B.rotation.y = -0.25; chin(E_A, 1); handHip(E_A, 0.6); slump(E_B, 1);
  nikai.position.set(EX + 0.45, 2.55, -0.2); pop(nikai, t, 0.2, 0.25, 0.95);
  tsurai.position.set(EX + 0.6, 1.75, 0.3); pop(tsurai, t, 1.0, 0.25, 0.65);
  elevCam(0);
  return S;
}
function sAruhi(t) { // ある日、タワマンの部屋は
  reset(); lift(0); drumSpin.rotation.x = -t * 5;
  KUJI.position.set(0, 3.1, 2.6); pop(KUJI, t, 0.3, 0.3, 1.7);
  look(lerp(4, 2.6, ease(clamp(t / 3))), 2.6, lerp(11, 8.2, ease(clamp(t / 3))), 0, 3.0, 0, 52);
  return S;
}
function sMainen(t) { // 毎年くじで入れ替わることになった。
  reset(); lift(0); drumSpin.rotation.x = -t * 9;
  ball.visible = t > 1.0; ball.position.set(0, 0.78, 0.75 + 0.2 * Math.min(1, (t - 1.0) * 2));
  plateDrop(t, 1.0);
  hookCam(1);
  return S;
}
// 部屋（52階→2階のママ）
function roomCam(u = 0) { look(RX + lerp(1.6, 1.2, u), 1.7, lerp(4.4, 3.8, u), RX - 0.2, 1.5, -2.0, 52); }
function sA2kai(t) { // 52階のママ、くじで2階へ。
  reset(); lift(0); plateDrop(t, 0.6); PLATE.userData.set('52階');
  drumSpin.rotation.x = -t * 6; hookCam(1);
  return S;
}
function sKabe(t) { // 窓の外は、夜景ではなく隣のマンションの壁。
  reset(); lift(0); R_A.visible = true; R_A.position.set(RX - 0.3, 0, -1.6); R_A.rotation.y = Math.PI; slump(R_A, clamp((t - 1.2) / 0.6));
  winM.map = t < 1.2 ? TEX.yakei : TEX.kabe; el.flash.style.opacity = t > 1.2 && t < 1.3 ? 0.3 : 0;
  if (t > 1.3) { kabeL.position.set(RX, 2.95, -2.4); pop(kabeL, t, 1.3, 0.25, 1.9); }
  roomCam(ease(clamp(t / 3.5)));
  return S;
}
function sLine(t) { // ママ友のLINEで、何階になったか誰も言わなくなる。
  reset(); lift(0); drawChat(Math.min(4, 2 + Math.floor(t * 1.2)), t > 1.6);
  if (t > 2.4) { darenimo.position.set(PX, 3.55, 0.6); pop(darenimo, t, 2.4, 0.3, 2.1); }
  look(PX + 0.3, 2.3, 5.6, PX, 2.2, 0, 50);
  return S;
}
// 部屋（2階→52階のママ）
function sB52(t) { // 一方、2階のママは52階へ。
  reset(); lift(0); PLATE.userData.set('52階'); const spin = t < 0.6 ? Math.abs(Math.cos(t * 16)) : 1; PLATE2.visible = t < 0.6; PLATE2.position.set(0, 3.0, 2.6); PLATE2.userData.size(1.7 * Math.max(0.12, spin));
  if (t > 0.6) { PLATE.visible = true; const k = easeOut(clamp((t - 0.6) / 0.4)); PLATE.position.set(0, 3.0, 2.6); PLATE.userData.size(k < 1 ? 2.0 - 0.3 * k : 1.7); sparkA.set(clamp((t - 0.6) / 1.2)); }
  drumSpin.rotation.x = t * 6; hookCam(1);
  return S;
}
function sMiorosu(t) { // 夜景を見下ろして、思わず口から出る。
  reset(); lift(0); winM.map = TEX.shita; R_B.visible = true; R_B.position.set(RX + 0.4, 0, -1.7); R_B.rotation.y = Math.PI + 0.25; handHip(R_B, 1); R_B.userData.head.rotation.x = 0.25;
  yakeiL.position.set(RX - 1.4, 2.9, -2.4); pop(yakeiL, t, 0.4, 0.25, 1.4);
  roomCam(ease(clamp(t / 3)));
  return S;
}
function sMushi(t) { // 低い階って、虫が出るんでしょ？
  reset(); lift(0); winM.map = TEX.shita; R_B.visible = true; R_B.position.set(RX + 0.2, 0, -1.2); R_B.rotation.y = 0.35; handHip(R_B, 1); chin(R_B, 1);
  mushi.position.set(RX + 0.1, 2.75, -0.9); pop(mushi, t, 0.2, 0.3, 2.0);
  look(RX + 0.9, 1.8, 3.4, RX + 0.1, 1.8, -1.2, 50);
  return S;
}
function sMaeA(t) { // 1か月前まで自分が言われていた言葉を、
  reset(); lift(0); E_A.position.set(-0.55, 0, -0.5); E_B.position.set(0.55, 0, -0.4); E_A.rotation.y = 0.5; E_B.rotation.y = -0.25; chin(E_A, 1); handHip(E_A, 1); slump(E_B, 1);
  mushi.position.set(EX, 2.7, -0.3); pop(mushi, t, 0.2, 0.3, 1.95);
  ikkagetsu.position.set(EX - 0.55, 2.25, -0.2); pop(ikkagetsu, t, 0.6, 0.25, 0.85);
  elevCam(0.2);
  return S;
}
function sImaB(t) { // 今は自分が言っている。
  reset(); lift(0); E_A.position.set(-0.55, 0, -0.5); E_B.position.set(0.55, 0, -0.4); E_A.rotation.y = 0.35; E_B.rotation.y = -0.5; chin(E_B, 1); handHip(E_B, 1); slump(E_A, 1);
  mushi.position.set(EX, 2.7, -0.3); pop(mushi, t, 0.1, 0.3, 1.95);
  IMA.position.set(EX + 0.55, 2.25, -0.2); pop(IMA, t, 0.5, 0.25, 0.55);
  elevCam(0.2);
  return S;
}
// くじ2回目
function sTsugi(t) { // 次の年のくじ。また入れ替わる。
  reset(); lift(0); drumSpin2.rotation.x = -t * 9;
  K_A.position.set(KX - 1.5, 0, 2.6); K_B.position.set(KX + 1.5, 0, 2.6); K_A.rotation.y = 0.5; K_B.rotation.y = -0.5;
  tsugi.position.set(KX, 3.9, 2.3); pop(tsugi, t, 0.1, 0.25, 0.9);
  const k = ease(clamp((t - 1.2) / 1.2));
  K52.visible = K2.visible = true; K52.userData.size(1.1); K2.userData.size(1.1);
  K52.position.set(KX + lerp(1.5, -1.5, k), 2.75 + Math.sin(k * Math.PI) * 0.6, 2.8); K2.position.set(KX + lerp(-1.5, 1.5, k), 2.75 - Math.sin(k * Math.PI) * 0.3, 2.8);
  look(KX, 2.4, 10.5, KX, 2.1, 1.5, 50);
  return S;
}
function sNikaime(t) { // 2回目のくじのあと、
  reset(); lift(0); drumSpin2.rotation.x = -t * 3;
  K_A.position.set(KX - 1.1, 0, 3.0); K_B.position.set(KX + 1.1, 0, 3.0); K_A.rotation.y = 0.25; K_B.rotation.y = -0.25; slump(K_A, 0.5); slump(K_B, 0.5);
  look(KX, 2.0, 8.5, KX, 1.6, 1.5, 52);
  return S;
}
function sShiin(t) { // エレベーターで何階か聞く人はいなくなった。
  reset(); lift(80); E_A.position.set(-0.55, 0, -0.5); E_B.position.set(0.55, 0, -0.4); E_A.rotation.y = 0; E_B.rotation.y = 0;
  E_A.userData.head.rotation.x = 0.1; E_B.userData.head.rotation.x = 0.1;
  shiin.position.set(EX, 2.55, -0.3); pop(shiin, t, 0.6, 0.3, 1.0);
  elevCam(lerp(0, 0.5, ease(clamp(t / 3))));
  return S;
}
function sKekka(t, d) { // 結果：階数マウントは、全員が上と下の両方を味わって消えた
  reset(); lift(0); S.fog.near = 120; S.fog.far = 420;
  const u = ease(clamp(t / Math.max(3, d)));
  look(lerp(16, 30, u), lerp(10, 26, u), lerp(30, 52, u), 0, lerp(26, 34, u), -26, 52);
  return S;
}
function sKekka2(t) {
  reset(); lift(0); S.fog.near = 120; S.fog.far = 420;
  kekkaL.position.set(2, 44, -14); pop(kekkaL, t, 0.3, 0.3, 30);
  look(30, 26, 52, 0, 34, -26, 52);
  return S;
}
function sTakasa(t) { // 見下ろしていたのは人の価値じゃなく、
  reset(); lift(0); winM.map = TEX.shita; R_B.visible = true; R_B.position.set(RX + 0.4, 0, -1.7); R_B.rotation.y = Math.PI + 0.25; R_B.userData.head.rotation.x = 0.3;
  look(RX + 1.0, 1.9, 3.4, RX - 0.1, 1.4, -2.2, 52);
  return S;
}
function sTakasa2(t) { // ただの高さだったのかもしれない。
  reset(); lift(0); S.fog.near = 120; S.fog.far = 420; ruler.visible = true; ruler.scale.y = easeOut(clamp(t / 1.2));
  takasa.position.set(-2, 40, -12); pop(takasa, t, 0.5, 0.3, 22);
  look(34, 30, 60, 2, 36, -24, 52);
  return S;
}
function sAsk(t) { // タワマン、住むなら何階？（最後は冒頭と同じ構図）
  reset(); lift(0); drumSpin.rotation.x = -t * 4; PLATE.visible = true; PLATE.position.set(0, 3.0, 2.6); PLATE.userData.size(1.7); PLATE.userData.set('？階');
  hookCam(0);
  return S;
}

const NARR = { 'タワマン': 'たわまん', '52階': 'ごじゅうにかい', '2階': 'にかい', '何階': 'なんがい', 'LINE': 'ライン', '1か月前': 'いっかげつまえ', '2回目': 'にかいめ', '結果：': '結果、', '隣': 'となり', '夜景': 'やけい', '見下ろして': 'みおろして', '見下ろしていた': 'みおろしていた', '階数': 'かいすう', '味わって': 'あじわって', '住む': 'すむ', '毎年': 'まいとし', '入れ替わる': 'いれかわる', '入れ替わること': 'いれかわること' };
const P = planTimes([
  ['低い階の住人の<br>不満から。', sHikui],
  ['エレベーターで、<br>何階ですか？と', sNankai],
  ['聞かれるのがつらい。', sTsurai],
  ['ある日、タワマンの部屋は', sAruhi],
  ['毎年くじで<br>入れ替わることになった。', sMainen],
  ['52階のママ、<br>くじで2階へ。', sA2kai],
  ['窓の外は、夜景ではなく<br>隣のマンションの壁。', sKabe],
  ['ママ友のLINEで、何階に<br>なったか誰も言わなくなる。', sLine],
  ['一方、2階のママは52階へ。', sB52],
  ['夜景を見下ろして、<br>思わず口から出る。', sMiorosu],
  ['低い階って、<br>虫が出るんでしょ？', sMushi],
  ['1か月前まで自分が<br>言われていた言葉を、', sMaeA],
  ['今は自分が言っている。', sImaB],
  ['次の年のくじ。<br>また入れ替わる。', sTsugi],
  ['2回目のくじのあと、', sNikaime],
  ['エレベーターで何階か<br>聞く人はいなくなった。', sShiin],
  ['結果：階数マウントは、', sKekka],
  ['全員が上と下の両方を<br>味わって消えた。', sKekka2],
  ['見下ろしていたのは<br>人の価値じゃなく、', sTakasa],
  ['ただの高さだったのかも<br>しれない。', sTakasa2],
  ['タワマン、<br>住むなら何階？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0656',
    v2: true,
    hookLine: 'タワマンの53階の表札が、くじの玉みたいにガラガラ回って、2階に落ちる。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもタワマンの階がくじ引きだったら？',
    titleHtml: 'もしもタワマンの<br>階が<br>くじ引きだったら？',
    mood: 'tension', seed: 656, hits: [0.45, P.at(15), P.at(17)], risers: [P.at(12)], impacts: [P.at(4, 0.6), P.at(5, 1.2), P.at(9, 0.2), P.at(12, 1.2), P.at(16, 0.3)],
    sfx: [[0.45, 'poof'], [P.at(1, 0.2), 'bubble'], [P.at(1, 1.6), 'buzz'], [P.at(3, 1.0), 'whoosh'], [P.at(4, 0.6), 'poof'], [P.at(5, 1.2), 'whoosh'], [P.at(6, 1.0), 'bubble'], [P.at(7, 0.6), 'poof'], [P.at(9, 0.2), 'bubble'], [P.at(12, 1.2), 'whoosh'], [P.at(14, 0.6), 'meter', 0.3]],
    narr: NARR,
    ask: 'タワマン、住むなら何階？',
    caption: 'もしもタワマンの階がくじ引きだったら？\n\n低い階の住人の不満から。エレベーターで、何階ですか？と聞かれるのがつらい。\nある日、タワマンの部屋は毎年くじで入れ替わることになった。\n52階のママ、くじで2階へ。窓の外は、夜景ではなく隣のマンションの壁。\nママ友のLINEで、何階になったか誰も言わなくなる。\n一方、2階のママは52階へ。夜景を見下ろして、思わず口から出る。低い階って、虫が出るんでしょ？\n1か月前まで自分が言われていた言葉を、今は自分が言っている。\n次の年のくじ。また入れ替わる。2回目のくじのあと、エレベーターで何階か聞く人はいなくなった。\n\n結果：階数マウントは、全員が上と下の両方を味わって消えた。\n見下ろしていたのは人の価値じゃなく、ただの高さだったのかもしれない。\n\nタワマン、住むなら何階？ コメントで教えて。\n\n※風刺ネタです。部屋がくじで入れ替わるのは、もしもの設定です。登場する建物・人物は架空です',
    hashtags: ['もしもラボ', 'もしも', 'タワマン', 'タワマン文学', 'マウント'],
    endStats: [['くじ1回目', '52階 → 2階', 'ママA'], ['くじ1回目', '2階 → 52階', 'ママB'], ['2回目のあと', '階数マウント 消滅', 'もしもの結果']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
