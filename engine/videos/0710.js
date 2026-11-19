import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, hudTime, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makeRoom } from '../satire-kit.js';
import { makeDoc } from '../scenes/hanko.js';
import { makeSweat } from '../scenes/office.js';
import { addKnees, fitReset, poseOneLeg, makeTimer, makeSink, makeToothbrush, makeWallSet, planTimes } from '../scenes/fitness.js';

// もしもお父さんが、片足で10秒立てなかったら？（人体の限界・台本 S106・作り直し 0654）
// 2026/11/18 ゆうと承認（投稿サーバーで ok）。plan/remake.md の10：独り言と宣言を使わず、0秒で父がぐらっと倒れかける→見ていた娘が固まる の二人の絵から入る
// 数字（一次資料で確認・2026/11/19）：
//  Araujo CG ほか. Br J Sports Med 2022（doi:10.1136/bjsports-2021-105360）51〜75歳の1,702人。10秒立てなかったのは20.4%。中央値7年の追跡で、
//   年齢・性別・BMI・持病をそろえた全死亡の危険度（HR）1.84倍（Leicester 大の公開ページで確認）
//  日本整形外科学会 ロコモ チャレンジ！ ロコトレ（locomo-joa.jp/assets/files/locotre.pdf）：片脚立ち 左右1分で1セット・1日3セット、つかまる物がある場所で
//  練習で死亡リスクが下がるとは言わない。7秒・2週間後は筋の中の描写。場面の多くは 0654 から流用

const GOLD = '#ffd27a', RED = '#ff5a5a', GREEN = '#9be86a', BLUE = '#7fd4ff';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 30, 150);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(7, 14, 10); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.95; S.add(ground);

function me() { return addKnees(makeMan({ shirt: '#4f8fb3', pants: '#3a3f4e', hair: '#2a211c' })); }
function papa() { return addKnees(makePerson({ skin: '#eac3a0', hair: '#9a9a9a', shirt: '#8a7a68', pants: '#3a3f4e', scale: 1.0 })); }

// ---------- A：洗面所（原点）：壁は z=0、洗面台の前に立つ ----------
const BATH = makeWallSet({ w: 7, h: 3.2, color: '#e6eef2', floor: '#c9c2b4' }); S.add(BATH);
const tilesB = new THREE.Group(); S.add(tilesB); for (let i = 0; i < 12; i++) { const l = box(0.02, 3.2, 0.01, mat('#cdd8de')); l.position.set(-3.3 + i * 0.6, 1.6, 0.005); tilesB.add(l); }
const SINK = makeSink(); SINK.position.set(0, 0, 0.3); S.add(SINK);
const towel = box(0.5, 0.7, 0.05, mat('#f0a0a8')); towel.position.set(1.0, 1.25, 0.05); S.add(towel);
const ME = papa(); S.add(ME); const sweatM = makeSweat(); ME.userData.head.add(sweatM);
const BRUSH = makeToothbrush(); BRUSH.position.set(0, -0.62, 0.12); BRUSH.rotation.x = -1.3; ME.userData.arms[1].add(BRUSH);
const TIMER = makeTimer({ w: 1.0, h: 0.44 }); TIMER.position.set(-2.0, 1.55, 0.06); S.add(TIMER);
const LR = [label('左 1分', { w: 500, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.85 }), label('右 1分', { w: 500, size: 100, color: '#fff', bg: 'rgba(230,110,60,.96)', sx: 0.85 })]; LR.forEach(l => S.add(l));
const guraLab = label('ぐらっ', { w: 500, size: 120, color: '#ffd27a', stroke: 16, strokeColor: '#2a1a00', sx: 0.95 }); guraLab.material.depthTest = false; guraLab.renderOrder = 8; S.add(guraLab);

// ---------- B：実家の段差（x=60） ----------
const BX = 60;
const ROOM = makeRoom({ w: 9, d: 7, wall: '#efe6d6', floor: '#b8966a' }); ROOM.position.set(BX, 0, -1); ROOM.userData.rw.visible = false; S.add(ROOM);
const stepB = box(2.4, 0.18, 1.0, mat('#8a6a48')); stepB.position.set(BX - 0.6, 0.09, -1.6); S.add(stepB);
const PARENT = addKnees(makePerson({ skin: '#eac3a0', hair: '#c8c8c8', shirt: '#9a7a58', pants: '#4a4a52', scale: 0.92 })); S.add(PARENT);
const CHILD = addKnees(makeWoman({ shirt: '#e07a6a', pants: '#2b3346' })); S.add(CHILD);
const hatena = label('？', { w: 260, size: 200, color: '#ffd27a', stroke: 16, strokeColor: '#2a1a00', sx: 0.5 }); hatena.material.depthTest = false; hatena.renderOrder = 8; S.add(hatena);
const abunai = label('あぶない！', { w: 700, size: 110, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.2 }); S.add(abunai);

// ---------- C：カレンダー（x=120） ----------
const CX = 120;
const calC = document.createElement('canvas'); calC.width = 1024; calC.height = 900;
const calT = new THREE.CanvasTexture(calC); calT.colorSpace = THREE.SRGBColorSpace; let calKey = -1;
function drawCal(n) {
  if (n === calKey) return; calKey = n; const g = calC.getContext('2d');
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 1024, 900); g.fillStyle = '#3480e6'; g.fillRect(0, 0, 1024, 150);
  g.fillStyle = '#fff'; g.font = '900 84px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('片足立ち 左右1分', 512, 78);
  for (let i = 0; i < 30; i++) {
    const cx = 74 + (i % 7) * 146, cy = 230 + Math.floor(i / 7) * 146;
    g.strokeStyle = '#c8ccd4'; g.lineWidth = 4; g.strokeRect(cx - 66, cy - 62, 132, 128);
    g.fillStyle = '#6a7080'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText(String(i + 1), cx - 30, cy - 34);
    if (i < n) { g.strokeStyle = '#c8242c'; g.lineWidth = 12; g.beginPath(); g.arc(cx + 10, cy + 14, 36, 0, 7); g.stroke(); }
  }
  calT.needsUpdate = true;
}
const cal = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.0), new THREE.MeshBasicMaterial({ map: calT })); cal.position.set(CX, 2.2, -1); S.add(cal);
const calFrame = box(3.56, 3.16, 0.06, mat('#3a3e4a')); calFrame.position.set(CX, 2.2, -1.04); S.add(calFrame);

// ---------- F：研究の人たち（x=180） ----------
const FX = 180;
const ffloor = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), mat('#343a4c', { depthWrite: false })); ffloor.rotation.x = -Math.PI / 2; ffloor.position.set(FX, 0.01, -3); ffloor.renderOrder = -0.8; S.add(ffloor);
const CROWD = (() => { const n = 1702, cols = 46; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), mat('#c8ccd8'), n); const M = new THREE.Matrix4(); const r = rng(54); const col = new THREE.Color('#c8ccd8'); for (let i = 0; i < n; i++) { M.makeTranslation(FX - 8.2 + (i % cols) * 0.36 + (r() - 0.5) * 0.08, 0.28, -2.4 - Math.floor(i / cols) * 0.36); m.setMatrixAt(i, M); m.setColorAt(i, col); } S.add(m); return m; })();
const RED20 = new Set(); { const r = rng(17); for (let i = 0; i < 1702; i++) if (r() < 0.204) RED20.add(i); }
let crowdKey = -1;
function crowdRed(k) { const kk = Math.round(k * 20); if (kk === crowdKey) return; crowdKey = kk; const c = new THREE.Color(), a = new THREE.Color('#c8ccd8'), b = new THREE.Color('#ff5a5a'); for (let i = 0; i < 1702; i++) CROWD.setColorAt(i, RED20.has(i) ? c.copy(a).lerp(b, kk / 20) : a); CROWD.instanceColor.needsUpdate = true; }
const FRONT = Array.from({ length: 5 }, (_, i) => { const p = addKnees(makePerson({ skin: ['#f1c9a5', '#eac3a0', '#d9a87e', '#f5d3b5', '#e0b08a'][i], hair: ['#8a8a8a', '#3a3330', '#c8c8c8', '#5a4a3a', '#9a9a9a'][i], shirt: ['#4f6a8f', '#9a7a58', '#6b7a5a', '#a35d4f', '#59606e'][i], pants: '#2b3346', bald: i === 2, scale: 0.95 })); S.add(p); return p; });
const tatenai = label('10秒 立てなかった', { w: 1000, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.75 }); S.add(tatenai);

// ---------- H：死亡リスク（x=240） ----------
const HX = 240;
const hfloor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), mat('#2e3446', { depthWrite: false })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(HX, 0.02, -1); hfloor.renderOrder = -0.8; S.add(hfloor);
const HB = [['立てた人', '#7fd4ff', -1.2], ['立てなかった人', '#ff5a5a', 1.2]].map(([name, col, dx]) => {
  const b = box(1.5, 1, 0.8, mat(col)); b.geometry.translate(0, 0.5, 0); b.position.set(HX + dx, 0.3, -1); S.add(b);
  const n = label(name, { w: 800, size: 90, color: '#fff', bg: 'rgba(40,46,60,.95)', sx: 1.4 }); n.position.set(HX + dx, 0.6, -0.4); S.add(n);
  const v = label('', { w: 700, size: 120, color: col, stroke: 16, strokeColor: '#1a1a22', sx: 1.2 }); v.material.depthTest = false; v.renderOrder = 9; S.add(v);
  return { b, n, v, dx };
});
function setHB(k1, k2) { const H = 1.1; const h1 = Math.max(0.001, H * k1), h2 = Math.max(0.001, H * (1 + 0.84 * k2) * (k1 > 0.99 ? 1 : k1)); HB[0].b.scale.y = h1; HB[1].b.scale.y = h2; HB.forEach(B => B.b.visible = k1 > 0.01); HB[0].v.visible = k1 > 0.9; HB[0].v.position.set(HX - 1.2, 0.3 + h1 + 0.35, -0.5); HB[0].v.userData.set('1倍'); HB[1].v.visible = k1 > 0.9; HB[1].v.position.set(HX + 1.2, 0.3 + h2 + 0.35, -0.5); HB[1].v.userData.set(k2 < 0.01 ? '1倍' : `${(1 + 0.84 * k2).toFixed(2)}倍`); }
const hTitle = label('約7年後の死亡リスク', { w: 1000, size: 86, color: '#e8ecf4', sx: 2.0 }); hTitle.position.set(HX, 3.25, -1); S.add(hTitle);
const hNote = label('※年齢・性別・BMI・持病をそろえた比較', { w: 1500, size: 70, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 2.75 }); hNote.position.set(HX, 3.7, -1); S.add(hNote);

// ---------- I：整形外科の学会のすすめ（x=300） ----------
const IX = 300;
const ifloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#3a3448', { depthWrite: false })); ifloor.rotation.x = -Math.PI / 2; ifloor.position.set(IX, 0.02, -1); ifloor.renderOrder = -0.8; S.add(ifloor);
const DOC = makeDoc({ title: '片脚立ちのすすめ', rows: ['時間', '回数'], head: '#3a8a5a', w: 2.6, h: 1.9 }); DOC.position.set(IX, 2.4, -1.2); S.add(DOC);
const docStand = box(0.1, 1.5, 0.1, mat('#5a5e68')); docStand.position.set(IX, 0.75, -1.25); S.add(docStand);
const GUIDE = me(); S.add(GUIDE);
const clocks = [0, 1, 2].map(i => { const l = label(['朝', '昼', '夜'][i], { w: 300, size: 110, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 0.55 }); l.position.set(IX - 1.0 + i * 1.0, 0.95, -0.4); S.add(l); return l; });

// ---------- J：机に手をついて（x=360） ----------
const JX = 360;
const JR = makeRoom({ w: 9, d: 7, wall: '#efe6d6', floor: '#b8966a' }); JR.position.set(JX, 0, -1); JR.userData.rw.visible = false; S.add(JR);
const desk = box(1.4, 0.06, 0.7, mat('#9a7a58')); desk.position.set(JX - 0.35, 0.82, -1.0); S.add(desk);
for (const [dx, dz] of [[-0.62, -0.3], [0.62, -0.3], [-0.62, 0.3], [0.62, 0.3]]) { const l = box(0.06, 0.8, 0.06, mat('#7a5a38')); l.position.set(JX - 0.35 + dx, 0.4, -1.0 + dz); S.add(l); }
const HOLD = papa(); S.add(HOLD);
const teOK = label('手をついてOK', { w: 800, size: 100, color: '#fff', bg: 'rgba(58,168,106,.96)', sx: 1.35 }); S.add(teOK);
const sukoshi = label('床から少しだけ', { w: 900, size: 96, color: '#2a1a00', bg: 'rgba(255,214,90,.97)', sx: 1.45 }); S.add(sukoshi);
const takasugi = label('高く上げすぎない', { w: 1000, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.6 }); S.add(takasugi);
const arrowUp = label('↕', { w: 220, size: 160, color: '#ffd27a', stroke: 14, strokeColor: '#2a1a00', sx: 0.38 }); arrowUp.material.depthTest = false; arrowUp.renderOrder = 8; S.add(arrowUp);

// ---------- K：7年後の分かれ道（x=420） ----------
const KX = 420;
const kfloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat('#5a7a4a', { depthWrite: false })); kfloor.rotation.x = -Math.PI / 2; kfloor.position.set(KX, 0.01, -8); kfloor.renderOrder = -0.8; S.add(kfloor);
const roadM = mat('#c8b898', { depthWrite: false });
const road0 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6), roadM); road0.rotation.x = -Math.PI / 2; road0.position.set(KX, 0.02, 1.0); road0.renderOrder = -0.7; S.add(road0);
for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 14), roadM); r.rotation.x = -Math.PI / 2; r.rotation.z = s * 0.45; r.position.set(KX + s * 3.0, 0.02, -4.8); r.renderOrder = -0.7; S.add(r); }
const signL = label('10秒 立てた', { w: 800, size: 96, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.3 }); signL.position.set(KX - 1.35, 1.55, -2.6); S.add(signL);
const signR = label('立てなかった', { w: 800, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.3 }); signR.position.set(KX + 1.35, 1.55, -2.6); S.add(signR);
const nen7 = label('7年後', { w: 500, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.95 }); nen7.position.set(KX, 2.35, -3.0); S.add(nen7);
const FORK = papa(); S.add(FORK);
const sparkK = makeSparkles(80, 0.16, 0xfff2c0); S.add(sparkK.points); sparkK.init([[KX, 1.2, 0.2]], 1.0, 1.3);
const trees = [-6, -4.5, 4.5, 6, -7, 7].map((dx, i) => { const g = new THREE.Group(); const tr = box(0.2, 1.0, 0.2, mat('#7a5a38')); tr.position.y = 0.5; g.add(tr); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), mat('#3a7a3a')); lf.position.y = 1.5; g.add(lf); g.position.set(KX + dx, 0, -2 - i * 1.6); S.add(g); return g; });

// ---------- 共通 ----------
const KNEE = [ME, PARENT, CHILD, ...FRONT, GUIDE, HOLD, FORK];
const LABELS = [...LR, guraLab, hatena, abunai, tatenai, teOK, sukoshi, takasugi, arrowUp];
function reset() {
  KNEE.forEach(p => { fitReset(p); p.visible = true; });
  ME.position.set(0, 0, 1.05); ME.rotation.y = Math.PI * 0.78; BRUSH.visible = false; sweatM.userData.set(0);
  PARENT.position.set(BX - 0.6, 0, -0.8); CHILD.position.set(BX + 1.1, 0, 0.0);
  FRONT.forEach((p, i) => p.position.set(FX - 2.4 + i * 1.2, 0, 0.2));
  GUIDE.position.set(IX + 1.75, 0, -0.6); HOLD.position.set(JX + 0.45, 0, -1.0); FORK.position.set(KX, 0, 0.6);
  LABELS.forEach(l => l.visible = false); TIMER.userData.set('10.0'); crowdRed(0); setHB(0, 0); sparkK.set(0);
  DOC.userData.fill(0, ''); DOC.userData.fill(1, ''); hemi.intensity = 1.25; el.flash.style.opacity = 0;
}
// ---------- 娘（洗面所の外から見る） ----------
const MUSUME = addKnees(makeWoman({ shirt: '#e07a6a', pants: '#2b3346' })); S.add(MUSUME);
const MBRUSH = makeToothbrush(); MBRUSH.position.set(0.04, 0.12, 0.3); MBRUSH.rotation.set(0, Math.PI / 2, 0); MUSUME.userData.head.add(MBRUSH);
const sweatD = makeSweat(); MUSUME.userData.head.add(sweatD);
const wakai = label('俺はまだ 体は若い', { w: 1000, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(wakai);
const nana = label('7秒', { w: 384, size: 130, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 0.55 }); S.add(nana);
const kowai = label('もっと怖い意味', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.25 }); S.add(kowai);
const omoikomi = label('まだ若い ＝ 思い込み', { w: 1000, size: 96, color: '#fff', bg: 'rgba(200,36,44,.96)', sx: 1.45 }); S.add(omoikomi);
const NEWL = [wakai, nana, kowai, omoikomi];
function reset2() { reset(); fitReset(MUSUME); MUSUME.visible = false; MUSUME.position.set(0, -50, 0); MBRUSH.visible = true; sweatD.userData.set(0); NEWL.forEach(l => l.visible = false); }
// 洗面所を横から（片足が見える角度。カメラは +x 側）
function bathCam(u = 0, zoom = 0, ty = 1.05) { const d = lerp(5.2, 4.8, u) - zoom; look(-0.35 + 0.62 * d, ty + 0.1 * d, 0.85 + 0.78 * d, -0.35, ty, 0.85, 46); }
const fmt1 = (x) => Math.max(0, x).toFixed(1);
function musumeAt(x, z, ry) { MUSUME.visible = true; MUSUME.position.set(x, 0, z); MUSUME.rotation.y = ry; }
const TP = 0.45;
function shot0(t) { // 0秒＝サムネ：歯みがき中の父が片足を上げた瞬間、10.0 のタイマーの途中でぐらっと横に倒れかける
  reset2(); lift(0); BRUSH.visible = true;
  const down = t >= TP; const remain = 10 - Math.min(TP, Math.max(0, t - 0.05)) * 6;
  if (!down) poseOneLeg(ME, 1, { side: 1, wobble: 0.5 + clamp(t / TP) * 1.6, t, arms: 'brush', lift: 0.6 });
  else { poseOneLeg(ME, 0.6, { side: 1, wobble: 0.2, t, arms: 'brush', lift: 0.6 }); ME.rotation.z = -0.22 * clamp((t - TP) / 0.25); ME.userData.arms[0].rotation.set(0, 0, -1.2); sweatM.userData.set(1, t); }
  TIMER.userData.set(down ? fmt1(10 - (TP - 0.05) * 6) : fmt1(remain), down ? RED : '#7dff8a');
  el.flash.style.opacity = down && t < TP + 0.1 ? 0.22 : 0;
  if (down) { guraLab.position.set(0.6, 1.85, 1.3); pop(guraLab, t, TP, 0.25, 0.85); }
  bathCam(ease(clamp(t / 3)), 0, 1.72);
  return S;
}
function sMusume(t, d) { // 洗面所の外から見ていた娘が、歯ブラシをくわえたまま固まる
  reset2(); lift(150); poseOneLeg(ME, 0.6, { side: 1, wobble: 0.2, t, arms: 'brush', lift: 0.6 }); ME.rotation.z = -0.22; BRUSH.visible = true;
  musumeAt(-1.3, 2.3, 2.34); if (t > d * 0.45) sweatD.userData.set(1, t); MUSUME.userData.head.rotation.x = t > d * 0.45 ? -0.1 : 0;
  look(-0.2, 1.75, 6.6, -0.6, 1.3, 1.6, 46);
  return S;
}
function sWakai(t, d) { // 父の言い分から。俺はまだ、体は若い
  reset2(); lift(150); ME.rotation.y = 0.4; ME.position.set(-0.3, 0, 1.05); ME.userData.arms[1].rotation.set(-1.3, 0, 0.2); ME.userData.arms[0].rotation.set(-0.4, 0, -0.5); ME.userData.head.rotation.x = -0.12;
  if (t > d * 0.3) say2(wakai, t, d * 0.3, -0.3, 2.25, 1.0, 1.15);
  look(0.6, 1.75, 4.4, -0.3, 1.4, 1.0, 46);
  return S;
}
function say2(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function sDay1(t, d) { // 1日目。目を開けているのに、父は7秒で足がつく
  reset2(); lift(200); const sec = Math.min(7, t * 7 / (d * 0.7)); const dn = sec >= 7;
  poseOneLeg(ME, dn ? 0.15 : 1, { side: 1, wobble: 0.4 + sec / 7 * 1.8, t, arms: 'out', lift: 0.6 }); sweatM.userData.set(clamp(sec / 5), t);
  TIMER.userData.set(fmt1(10 - sec), dn ? RED : '#7dff8a');
  if (dn) say2(nana, t, d * 0.7, 0.5, 2.05, 1.3, 0.5);
  hudTime('1日目'); bathCam(0.5, ease(clamp(t / d)) * 0.4); return S;
}
function sMusumeToo(t, d) { // 笑っていた娘もやってみる。こっちもぐらつく
  reset2(); lift(200); ME.visible = false; MBRUSH.visible = false; musumeAt(0, 1.05, Math.PI * 0.78); MUSUME.position.set(0, 0, 1.05);
  poseOneLeg(MUSUME, 1, { side: 1, wobble: 0.6 + clamp(t / d) * 1.8, t, arms: 'out', lift: 0.6 }); if (t > d * 0.5) { sweatD.userData.set(1, t); guraLab.position.set(0.55, 2.0, 1.3); pop(guraLab, t, d * 0.5, 0.25, 0.9); }
  TIMER.userData.set(fmt1(10 - Math.min(10, t * 2.2)), '#7dff8a');
  hudTime('1日目'); bathCam(0.5, 0.2); return S;
}
function sWeek2(t, d) { // 2週間後。歯みがきの2分、父がぐらつかずに立っている
  reset2(); lift(200); BRUSH.visible = true; poseOneLeg(ME, 1, { side: 1, wobble: 0.05, t, arms: 'brush', lift: 0.6 });
  const sec = Math.max(0, 120 - t * 9); TIMER.userData.set(`${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`, '#7dff8a');
  hudTime('2週間後'); bathCam(0.5, 0.2); return S;
}
function sKowai(t, d) { // でも、この10秒には、もっと怖い意味があった
  reset2(); lift(150); poseOneLeg(ME, 0.3, { side: 1, wobble: 0.5, t, arms: 'out', lift: 0.6 }); TIMER.userData.set('10.0', GOLD);
  if (t > d * 0.5) say2(kowai, t, d * 0.5, -2.0, 2.3, 0.3, 1.0);
  const u = ease(clamp(t / d)); look(lerp(-0.4, -1.5, u), lerp(1.7, 1.6, u), lerp(4.2, 2.6, u), lerp(-0.9, -2.0, u), lerp(1.3, 1.55, u), 0.05, 46); return S;
}
function studyCam(u = 0) { look(FX, lerp(4.6, 5.0, u), lerp(8.6, 9.4, u), FX, 0.6, -2.6, 50); }
function sStudy(t, d) { // 51〜75歳の1,702人に、片足で10秒立ってもらった研究
  reset2(); lift(170); const late = t > d * 0.5;
  if (!late) { FRONT.forEach(p => p.visible = false); setTop('51〜75歳（2022年）', '1,702人', fade(t, 0.4, d * 0.5, 0.25), BLUE); }
  else FRONT.forEach((p, i) => poseOneLeg(p, clamp((t - d * 0.5 - i * 0.12) / 0.4), { side: 1, wobble: 0.6, t: t + i, arms: 'out' }));
  studyCam(ease(clamp(t / d))); return S;
}
function sFive(t, d) { // 5人に1人は、10秒立てなかった
  reset2(); lift(170); crowdRed(clamp((t - 0.6) / 1.0));
  FRONT.forEach((p, i) => { const fall = i === 3 && t > 0.6; poseOneLeg(p, fall ? 0 : 1, { side: 1, wobble: fall ? 0 : 0.5, t: t + i, arms: 'out', lift: 0.6 }); if (fall) { p.userData.arms.forEach((a, j) => a.rotation.set(-0.6, 0, (j ? -1 : 1) * 0.8)); p.rotation.z = 0.08; } });
  tatenai.position.set(FX - 2.4 + 3 * 1.2, 2.05, 0.5); pop(tatenai, t, 0.8, 0.3, 1.3);
  studyCam(1); setTop('10秒 立てなかった人（2022年）', '20.4%', fade(t, 0.8, d, 0.25), RED); return S;
}
function hbCam() { look(HX, 2.0, 8.6, HX, 1.75, -1, 46); }
function sBai(t, d) { // 約7年後、立てなかった人の死亡リスクは、条件をそろえても1.84倍
  reset2(); lift(250); setHB(easeOut(clamp((t - 0.2) / 1.0)), easeOut(clamp((t - d * 0.45) / 1.2))); hbCam();
  if (t > d * 0.45) setTop('立てなかった人の死亡リスク（2022年）', '1.84倍', fade(t, d * 0.45 + 0.8, d, 0.25), RED);
  setHud('Araujo ほか', 'Br J Sports Med 2022年', 1);
  return S;
}
function sGakkai(t, d) { // 学会が勧めるのは、左右1分ずつを1日3回。机に手をついてOK
  reset2(); const late = t > d * 0.55;
  if (!late) { lift(200); DOC.userData.fill(0, t > 0.3 ? '左右 1分ずつ' : ''); DOC.userData.fill(1, t > 1.0 ? '1日 3回' : ''); GUIDE.rotation.y = -0.5; GUIDE.userData.arms[0].rotation.set(-1.3, 0, 0.3); clocks.forEach((c, i) => pop(c, t, 1.2 + i * 0.3, 0.25, 0.55)); look(IX + 0.55, 2.2, 7.0, IX + 0.55, 1.75, -1, 48); }
  else { lift(260); HOLD.rotation.y = -Math.PI / 2; poseOneLeg(HOLD, clamp((t - d * 0.55) / 0.5), { side: 1, wobble: 0.1, t, arms: 'desk', lift: 0.4 }); teOK.position.set(JX - 0.55, 1.35, -0.6); pop(teOK, t, d * 0.6, 0.3, 1.15); look(JX - 0.15, 1.55, 4.7, JX - 0.15, 1.0, -1.0, 46); }
  setHud('日本整形外科学会', 'ロコトレ', 1);
  return S;
}
function forkCam(u = 0) { look(KX + lerp(0.3, 0.1, u), lerp(3.0, 3.4, u), lerp(6.6, 7.4, u), KX, 1.25, -1.4, 48); }
function sKekka(t, d) { // 結果：たった10秒の片足立ちが、7年後の分かれ道になっていた
  reset2(); lift(200); FORK.rotation.y = Math.PI + 0.45; poseOneLeg(FORK, 1, { side: 1, wobble: 0.12, t, arms: 'out', lift: 0.6 }); sparkK.set(clamp((t - d * 0.4) / 3));
  signL.visible = signR.visible = true; nen7.visible = false; if (t > d * 0.4) pop(nen7, t, d * 0.4, 0.3);
  forkCam(ease(clamp(t / d)));
  setTop('結果', '7年後の分かれ道', fade(t, 0.3, d, 0.25), GREEN); return S;
}
function sOmoikomi(t, d) { // 体はまだ若い は、片足で立ってみるまでの、思い込みだったのかもしれない
  reset2(); lift(200); BRUSH.visible = true; const k = clamp((t - d * 0.35) / 0.5);
  poseOneLeg(ME, k > 0 ? 0.6 : 1, { side: 1, wobble: 0.5 + k, t, arms: 'brush', lift: 0.6 }); ME.rotation.z = -0.22 * k;
  if (t > d * 0.45) say2(omoikomi, t, d * 0.45, -0.2, 2.45, 0.9, 1.25);
  bathCam(0.4, 0, 1.35); return S;
}
function sAsk(t, d) { reset2(); lift(0); BRUSH.visible = true; poseOneLeg(ME, 0.6, { side: 1, wobble: 0.2, t, arms: 'brush', lift: 0.6 }); ME.rotation.z = -0.22; TIMER.userData.set(fmt1(10 - (TP - 0.05) * 6), RED); bathCam(0, 0, 1.72); return S; }

const NARR = { '洗面所': 'せんめんじょ', '外': 'そと', '見ていた': 'みていた', '娘': 'むすめ', '歯ブラシ': 'はブラシ', '固まる': 'かたまる', '父': 'ちち', '言い分': 'いいぶん', '俺': 'おれ', '体': 'からだ', '若い': 'わかい', '1日目': 'いちにちめ', '目': 'め', '開けている': 'あけている', '7秒': 'ななびょう', '足': 'あし', '笑っていた': 'わらっていた', '2週間後': 'にしゅうかんご', '歯みがき': 'はみがき', '2分': 'にふん', '立っている': 'たっている', '10秒': 'じゅうびょう', '怖い': 'こわい', '意味': 'いみ', '51〜75歳': 'ごじゅういちからななじゅうごさい', '1,702人': 'せんななひゃくににん', '片足': 'かたあし', '立って': 'たって', '研究': 'けんきゅう', '5人に1人': 'ごにんにひとり', '立てなかった': 'たてなかった', '約7年後': 'やくななねんご', '7年後': 'ななねんご', '死亡': 'しぼう', '条件': 'じょうけん', '1.84倍': 'いってんはちよんばい', '学会': 'がっかい', '勧める': 'すすめる', '左右1分ずつ': 'さゆういっぷんずつ', '1日3回': 'いちにちさんかい', '机': 'つくえ', '手': 'て', '結果：': '結果、', '分かれ道': 'わかれみち', '思い込み': 'おもいこみ', '何秒': 'なんびょう', '立てる': 'たてる' };
const P = planTimes([
  ['洗面所の外から見ていた娘が、', (t, d) => sMusume(t, 2 * d)],
  ['歯ブラシをくわえたまま<br>固まる。', (t, d) => sMusume(t + d, 2 * d)],
  ['父の言い分から。<br>俺はまだ、体は若い。', sWakai],
  ['1日目。目を開けているのに、<br>父は7秒で足がつく。', sDay1],
  ['笑っていた娘もやってみる。<br>こっちもぐらつく。', sMusumeToo],
  ['2週間後。歯みがきの2分、<br>父がぐらつかずに立っている。', sWeek2],
  ['でも、この10秒には、<br>もっと怖い意味があった。', sKowai],
  ['51〜75歳の1,702人に、', (t, d) => sStudy(t, 2 * d)],
  ['片足で10秒<br>立ってもらった研究。', (t, d) => sStudy(t + d, 2 * d)],
  ['5人に1人は、<br>10秒立てなかった。', sFive],
  ['約7年後、立てなかった人の<br>死亡リスクは、', (t, d) => sBai(t, 2 * d)],
  ['条件をそろえても1.84倍。', (t, d) => sBai(t + d, 2 * d)],
  ['学会が勧めるのは、左右1分<br>ずつを1日3回。', (t, d) => sGakkai(t, 2 * d)],
  ['机に手をついてOK。', (t, d) => sGakkai(t + d, 2 * d)],
  ['結果：たった10秒の<br>片足立ちが、', (t, d) => sKekka(t, 2 * d)],
  ['7年後の分かれ道に<br>なっていた。', (t, d) => sKekka(t + d, 2 * d)],
  ['体はまだ若い は、<br>片足で立ってみるまでの、', (t, d) => sOmoikomi(t, 2 * d)],
  ['思い込み<br>だったのかもしれない。', (t, d) => sOmoikomi(t + d, 2 * d)],
  ['お父さん、<br>片足で何秒立てる？', sAsk],
], { shot0, endCard, start: 2.9, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0710',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0654',
    hookLine: '歯みがき中の父が片足を上げた瞬間、10.0 のタイマーの途中でぐらっと横に倒れかける。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしもお父さんが、片足で10秒立てなかったら？',
    titleHtml: 'もしもお父さんが、<br>片足で10秒<br>立てなかったら？',
    mood: 'tension', seed: 710, hits: [TP, P.at(14), P.at(17)], risers: [P.at(6)], impacts: [P.at(7, 0.6), P.at(9, 1.0), P.at(11, 0.8)],
    sfx: [[TP, 'alarm'], [P.at(1, 0.3), 'meter', 0.3], [P.at(3, 2.0), 'poof'], [P.at(4, 1.4), 'whoosh'], [P.at(9, 0.6), 'poof'], [P.at(12, 1.2), 'bubble'], [P.at(17, 0.2), 'whoosh']],
    narr: NARR,
    ask: 'お父さん、片足で何秒立てる？',
    caption: 'もしもお父さんが、片足で10秒立てなかったら？\n\n洗面所の外から見ていた娘が、歯ブラシをくわえたまま固まる。\n父の言い分から。俺はまだ、体は若い。\n1日目。目を開けているのに、父は7秒で足がつく。\n笑っていた娘もやってみる。こっちもぐらつく。\n2週間後。歯みがきの2分、父がぐらつかずに立っている。\nでも、この10秒には、もっと怖い意味があった。\n51〜75歳の1,702人に、片足で10秒立ってもらった研究。\n5人に1人は、10秒立てなかった。\n約7年後、立てなかった人の死亡リスクは、条件をそろえても1.84倍。\n学会が勧めるのは、左右1分ずつを1日3回。机に手をついてOK。\n\n結果：たった10秒の片足立ちが、7年後の分かれ道になっていた。\n体はまだ若い は、片足で立ってみるまでの、思い込みだったのかもしれない。\n\nお父さん、片足で何秒立てる？ コメントで教えて。\n\n※転ばないよう、つかまれる物のそばでやってください。研究は 立てるかどうか と死亡の関係を見たもので、練習で死亡リスクが下がると示したものではありません\n出典：Araujo ほか British Journal of Sports Medicine 2022（51〜75歳の1,702人。10秒立てなかった20.4%、中央値7年の追跡で死亡リスク1.84倍）、日本整形外科学会 ロコモ チャレンジ！ ロコトレ（片脚立ち 左右1分・1日3回）',
    hashtags: ['もしもラボ', '片足立ち', 'バランス', '親', '人体の限界'],
    endStats: [['片足で10秒立てなかった人', '20.4%', '51〜75歳・1,702人'], ['立てなかった人の死亡リスク', '1.84倍', '約7年後・条件をそろえて'], ['学会のすすめ', '左右1分×1日3回', '机につかまってOK']],
    sources: '出典：Araujo ほか British Journal of Sports Medicine 2022、日本整形外科学会 ロコトレ',
  },
});
