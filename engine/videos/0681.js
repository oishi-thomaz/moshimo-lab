import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { addKnees, fitReset, poseRun, poseFastWalk, makeStairs, planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしも1か月タバコをやめたら？（人体の限界・台本 S81）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/12 の解析の種（0648 お酒1か月の型×ヤニカス）
// 数字（一次資料で確認・2026/11/14）：厚生労働省 e-ヘルスネット 禁煙開始からまだ間もない方へ《実行期編》の 禁煙の効果
//  禁煙後20分 血圧と脈拍が正常に／12時間 血液中の一酸化炭素が正常に／2〜3週間 心機能が改善・肺機能が回復／1〜9か月 咳・息切れ・疲れやすさが改善
//  1か月後の階段は 1〜9か月 の息切れの改善の範囲として描く（個人差あり と画面に出す）。タバコを吸う絵はかっこよく見せない（タバコそのものは出さない）

const GOLD = '#ffd27a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d0dc', ground: '#8a8f99' }); hemi.intensity = 1.3;
const YANI = makeOji(rng(81), { shirt: '#8a8f99' }); addKnees(YANI); S.add(YANI); // 禁煙中のヤニカス（主役）
const sweatY = makeSweat(); YANI.userData.head.add(sweatY);

// ---------- A：会社の廊下と喫煙所（原点） ----------
const awall = box(16, 3.6, 0.2, mat('#e6e9ee')); awall.position.set(0, 1.8, -3.4); S.add(awall);
flat(16, 10, '#7d8798', 0, 0);
const booth = new THREE.Group(); S.add(booth); booth.position.set(0, 0, -2.0);
const glassM = new THREE.MeshLambertMaterial({ color: '#bfd8e8', transparent: true, opacity: 0.3, depthWrite: false });
{ const back = box(3.4, 2.6, 0.06, mat('#c9ced8')); back.position.set(0, 1.3, -1.3); booth.add(back);
  for (const x of [-1.7, 1.7]) { const s = box(0.06, 2.6, 2.6, glassM); s.position.set(x, 1.3, 0); booth.add(s); }
  const roof = box(3.5, 0.12, 2.7, mat('#9aa0aa')); roof.position.set(0, 2.66, 0); booth.add(roof);
  for (const x of [-1.7, 1.7]) for (const z of [-1.3, 1.3]) { const f = box(0.08, 2.6, 0.08, mat('#8a8f99')); f.position.set(x, 1.3, z); booth.add(f); } }
const ASH = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.95, 16), mat('#5a5e66')); c.position.y = 0.475; ASH.add(c); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.1, 16), mat('#c0c4cc')); top.position.y = 1.0; ASH.add(top); } ASH.position.set(0, 0, -1.6); S.add(ASH);
const boothSign = label('喫煙所', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,70,90,.96)', sx: 0.95 }); boothSign.position.set(0, 2.95, -1.0); S.add(boothSign);
const sparkA = makeSparkles(150, 0.16, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0, 0.9, -1.6]], 0.6, 1.0);
const POCKET = [0, 1, 2].map(i => { const l = label(['1回目', '2回目', '3回目'][i], { w: 400, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.55 }); S.add(l); return l; });
const itsudemo = label('いつでも やめられる', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.8 }); S.add(itsudemo);
const ashiga = label('足が勝手に止まる', { w: 1024, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.8 }); S.add(ashiga);

// ---------- B：オフィスの机（x=60）：ガム ----------
const BX = 60;
const roomB = room({ x: BX, w: 9, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(BX, 0, -0.8); S.add(ISL);
const GUM = new THREE.Group(); { const pk = box(0.22, 0.06, 0.12, mat('#3fb27a')); GUM.add(pk); for (let i = 0; i < 4; i++) { const w = box(0.08, 0.012, 0.03, mat('#f4f4f2')); w.position.set(-0.15 + i * 0.1, -0.02, 0.15 + (i % 2) * 0.05); GUM.add(w); } } S.add(GUM);
const gum = label('ガム 10個目', { w: 640, size: 100, color: '#fff', bg: 'rgba(63,178,122,.97)', sx: 1.0 }); S.add(gum);

// ---------- C：会議室（x=120）：ペンをくわえる ----------
const CX = 120;
const MR = makeMeetingRoom(); MR.position.set(CX, 0, 0); S.add(MR);
const MEET = [0, 1, 2].map(i => { const p = makeSuit({ woman: i === 1, jacket: ['#3a4256', '#5a4a6a', '#56504a'][i], hair: i === 1 ? '#3a2620' : undefined }); S.add(p); return p; });
const PEN = box(0.035, 0.035, 0.3, mat('#f2c14e')); PEN.position.set(0.1, 0.1, 0.3); PEN.rotation.y = 0.9; YANI.userData.head.add(PEN);
const kuwaeru = label('気づけば ペン', { w: 768, size: 100, color: '#fff', bg: 'rgba(90,138,232,.96)', sx: 1.2 }); S.add(kuwaeru);

// ---------- D：体の中（x=180）：心臓と肺 ----------
const DX = 180;
flat(12, 10, '#2a3040', DX, 0);
const dwall = box(12, 5, 0.2, mat('#323a4e')); dwall.position.set(DX, 2.5, -2.6); S.add(dwall);
const BODY = new THREE.Group(); BODY.position.set(DX, 0, -1.2); S.add(BODY);
{ const ghost = new THREE.MeshLambertMaterial({ color: '#9ab8d8', transparent: true, opacity: 0.22, depthWrite: false });
  const torso = box(1.3, 1.6, 0.6, ghost); torso.position.y = 1.6; BODY.add(torso); const head = box(0.7, 0.7, 0.6, ghost); head.position.y = 2.8; BODY.add(head);
  for (const s of [-1, 1]) { const arm = box(0.3, 1.4, 0.3, ghost); arm.position.set(s * 0.85, 1.6, 0); BODY.add(arm); const leg = box(0.4, 0.8, 0.4, ghost); leg.position.set(s * 0.3, 0.4, 0); BODY.add(leg); } }
const LUNGS = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshLambertMaterial({ color: '#8a8a8a' })); m.scale.set(0.8, 1.35, 0.7); m.position.set(s * 0.3, 1.75, 0); BODY.add(m); return m; });
const HEART = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), new THREE.MeshLambertMaterial({ color: '#c8323a', emissive: 0x400000 })); HEART.position.set(0.08, 1.55, 0.2); BODY.add(HEART);
const VEINS = []; for (let i = 0; i < 8; i++) { const v = box(0.05, 0.9, 0.05, new THREE.MeshLambertMaterial({ color: '#7a4a6a' })); v.position.set(-0.55 + i * 0.16, 1.0 + (i % 2) * 0.2, 0.1); BODY.add(v); VEINS.push(v); }
const CO = []; { const r = rng(5); for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#555' })); m.userData.p = [(r() - 0.5) * 1.0, 0.7 + r() * 1.5, 0.32]; BODY.add(m); CO.push(m); } }
const sparkD = makeSparkles(120, 0.14, 0xc8ffd8); S.add(sparkD.points); sparkD.init([[DX, 1.6, -0.9]], 1.0, 0.8);

// ---------- E：駅の階段（x=240） ----------
const EX = 240, N = 18, RISE = 0.17, RUN = 0.3, TOPY = N * RISE;
flat(12, 12, '#b9b4aa', EX, 2);
const STAIRS = makeStairs({ n: N, rise: RISE, run: RUN, w: 1.8 }); STAIRS.position.set(EX, 0, 0); S.add(STAIRS);
const ewall = box(0.2, 8, 14, mat('#e2ded6')); ewall.position.set(EX - 1.4, 4, -2); S.add(ewall);
const landing = box(4, TOPY, 4, mat('#b9b4aa')); landing.position.set(EX, TOPY / 2 - 0.002, -N * RUN - 2); S.add(landing);
const ekiSign = label('もしも台駅', { w: 600, size: 110, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 1.1 }); ekiSign.position.set(EX - 1.0, TOPY + 2.6, -N * RUN - 1.4); S.add(ekiSign);
const kirenai = label('息が 切れていない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.7 }); S.add(kirenai);
const kosa = label('個人差あり', { w: 512, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 0.75 }); S.add(kosa);

// ---------- F：カレンダー（x=300）：いつ は 今日 ----------
const FX = 300;
flat(10, 8, '#e6dccb', FX, 0);
const fwall = box(10, 4, 0.2, mat('#f2ece0')); fwall.position.set(FX, 2, -2.2); S.add(fwall);
const CAL = (() => { const c = document.createElement('canvas'); c.width = 700; c.height = 600; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.8), new THREE.MeshBasicMaterial({ map: tex })); let k = -1;
  m.userData.draw = (circle) => { if (circle === k) return; k = circle; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 700, 600); g.fillStyle = '#c8242c'; g.fillRect(0, 0, 700, 100); g.fillStyle = '#fff'; g.font = '900 60px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('カレンダー', 350, 52); g.fillStyle = '#333'; g.font = '800 44px "Noto Sans CJK JP"'; for (let i = 0; i < 28; i++) { g.fillText(String(i + 1), 60 + (i % 7) * 97, 150 + Math.floor(i / 7) * 110); } if (circle > 0) { g.strokeStyle = '#c8242c'; g.lineWidth = 10; g.beginPath(); g.arc(60 + 2 * 97, 150 + 110, 46 * Math.min(1, circle), 0, Math.PI * 2 * Math.min(1, circle)); g.stroke(); } tex.needsUpdate = true; }; return m; })();
CAL.position.set(FX, 2.0, -2.08); S.add(CAL);
const kyou = label('今日', { w: 400, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.8 }); S.add(kyou);

const PEOPLE = [YANI, ...MEET];
const LABELS = [...POCKET, itsudemo, ashiga, gum, kuwaeru, kirenai, kosa, kyou];
function reset() {
  fitReset(YANI); YANI.visible = true; YANI.rotation.order = 'YXZ'; MEET.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); boothSign.visible = true; sparkA.set(0); sparkD.set(0); el.flash.style.opacity = 0; sweatY.userData.set(0);
  ASH.visible = true; ASH.scale.setScalar(1.3); GUM.visible = false; PEN.visible = false;
  YANI.position.set(0.9, 0, 0.2); YANI.rotation.y = -0.3;
  LUNGS.forEach(l => l.material.color.set('#8a8a8a')); HEART.scale.setScalar(1); VEINS.forEach(v => v.material.color.set('#7a4a6a')); CO.forEach(m => m.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function pat(p, t, t0, n = 3) { // 胸ポケットを探る（右手が胸に行って戻る）
  const k = clamp((t - t0) / (n * 0.7)); const ph = k * n * Math.PI; const a = Math.abs(Math.sin(ph));
  p.userData.arms[1].rotation.set(-0.9 - 0.9 * a, 0, -0.55 - 0.35 * a); p.userData.head.rotation.x = 0.35 * a;
  return Math.min(n - 1, Math.floor(k * n));
}
const TP = 0.3;
function boothCam(u = 0) { look(lerp(0.55, 0.5, u), lerp(1.95, 1.9, u), lerp(2.9, 2.7, u), 0.4, lerp(1.6, 1.55, u), -1.1, 50); }
function shot0(t) { // 0秒＝サムネ：喫煙所の灰皿が、パッと消える（ヤニカスが手を伸ばしたまま）
  reset(); lift(0); boothSign.visible = false; YANI.userData.arms[1].rotation.set(-1.3, 0, 0.3); YANI.rotation.y = -0.6; YANI.position.set(0.75, 0, -1.0);
  const k = clamp((t - TP) / 0.18); ASH.scale.setScalar(1.3 * (1 - k)); ASH.visible = k < 1;
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; YANI.userData.head.rotation.x = 0.3; }
  boothCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sPocket(t, d) { // 禁煙1日目のヤニカスが、胸ポケットを3回探る。
  reset(); lift(120); ASH.visible = false; YANI.position.set(0.5, 0, -0.2); YANI.rotation.y = 0.15;
  const i = pat(YANI, t, 0.3); for (let j = 0; j <= i; j++) say(POCKET[j], t, 0.3 + j * 0.7 + 0.3, 0.5 + (j - 1) * 0.4, 2.05, 0.0, 0.36);
  setHud('禁煙', '1日目', 1);
  const u = ease(clamp(t / d)); look(lerp(0.9, 0.7, u), 1.75, lerp(2.9, 2.5, u), 0.5, 1.45, -0.2, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。やめようと思えば、いつでもやめられる。
  reset(); lift(120); ASH.visible = false; YANI.position.set(0.5, 0, -0.2); YANI.rotation.y = 0.15; YANI.userData.arms.forEach((a, i) => a.rotation.set(0, 0, i ? -0.25 : 0.25)); YANI.userData.head.rotation.x = -0.15;
  say(itsudemo, t, 0.4, 0.5, 2.2, -0.2, 1.4);
  look(0.7, 1.7, 2.9, 0.5, 1.55, -0.2, 50);
  return S;
}
function sGum(t, d) { // 1日目の昼。口がさみしくて、ガムを噛み続ける。
  reset(); lift(120); const st = ISL.userData.seats[0]; YANI.position.set(BX + st.x, 0, -0.8 + st.z); YANI.rotation.y = st.ry; poseSit(YANI);
  YANI.userData.head.rotation.x = 0.05 + Math.abs(Math.sin(t * 9)) * 0.08; YANI.userData.arms[1].rotation.set(-0.9, 0, 0);
  GUM.visible = true; YANI.updateMatrixWorld(); const v = new THREE.Vector3(0.1, 0.3, 0.75); YANI.localToWorld(v); GUM.position.set(v.x, TABLE_Y + 0.05, v.z);
  if (t > d * 0.35) say(gum, t, d * 0.35, YANI.position.x, 1.75, YANI.position.z, 0.8);
  setHud('禁煙', '1日目の昼', 1);
  look(YANI.position.x + 1.2, 1.7, YANI.position.z + 2.6, YANI.position.x, 1.15, YANI.position.z, 50);
  return S;
}
function sPen(t, d) { // 3日目。会議中、気づけばペンを口にくわえている。
  reset(); lift(120); const st = MR.userData.seats;
  YANI.position.set(CX + st[2].x, 0, st[2].z); YANI.rotation.y = st[2].ry; poseSit(YANI);
  MEET.forEach((p, i) => { const s = st[[0, 4, 5][i]]; p.visible = true; p.position.set(CX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  MR.userData.board.set(['定例会議']);
  YANI.updateMatrixWorld(); PEN.visible = true;
  YANI.userData.arms[1].rotation.set(-0.6, 0, 0.2);
  if (t > d * 0.4) say(kuwaeru, t, d * 0.4, YANI.position.x, 2.25, YANI.position.z, 1.1);
  setHud('禁煙', '3日目', 1);
  YANI.updateMatrixWorld(); const f = new THREE.Vector3(0.6, 0, 1.5); YANI.localToWorld(f);
  look(f.x, 1.75, f.z, YANI.position.x, 1.15, YANI.position.z, 50);
  return S;
}
function sAshi(t, d) { // 1週間後。喫煙所の前を通るたび、足が勝手に止まる。
  reset(); lift(120); ASH.visible = true; YANI.rotation.y = -Math.PI / 2; const k = clamp(t / (d * 0.5)); YANI.position.set(lerp(3.5, 0.6, easeOut(k)), 0, 0.4);
  if (k < 1) poseFastWalk(YANI, t * 7); else { YANI.userData.head.rotation.y = 0.9; YANI.rotation.y = -Math.PI / 2 + 0.3; }
  if (t > d * 0.55) say(ashiga, t, d * 0.55, 0.6, 2.35, 0.4, 1.6);
  setHud('禁煙', '1週間後', 1);
  look(0.9, 1.9, 4.4, 0.7, 1.4, -0.4, 50);
  return S;
}
function bodyCam(u = 0) { look(DX + lerp(0.3, 0.1, u), lerp(1.9, 1.8, u), lerp(3.4, 3.0, u), DX, 1.75, -1.2, 50); }
function sBody(t, d) { // でも体の中では、もう変化が始まっていた。
  reset(); lift(120); YANI.visible = false; CO.forEach(m => { m.visible = true; m.position.set(...m.userData.p); });
  HEART.scale.setScalar(1 + Math.max(0, Math.sin(t * 9)) * 0.15); sparkD.set(clamp((t - d * 0.4) / 1.5));
  bodyCam(ease(clamp(t / d)));
  return S;
}
function sData(i) { // 20分・12時間・2〜3週間
  return (t, d) => {
    reset(); lift(120); YANI.visible = false; const k = easeOut(clamp((t - 0.3) / 1.2));
    const beat = i === 0 ? lerp(13, 7, k) : 7; HEART.scale.setScalar(1 + Math.max(0, Math.sin(t * beat)) * 0.15);
    CO.forEach((m, j) => { const gone = i >= 2 || (i === 1 && j / CO.length < k); m.visible = !gone; m.position.set(...m.userData.p); m.position.y += i === 1 ? k * 0.3 : 0; });
    if (i === 0) VEINS.forEach(v => v.material.color.set('#c8323a').lerp(new THREE.Color('#7a4a6a'), 1 - k));
    if (i >= 1) VEINS.forEach(v => v.material.color.set('#c8323a'));
    if (i === 2) { LUNGS.forEach(l => l.material.color.set('#8a8a8a').lerp(new THREE.Color('#f29bab'), k)); sparkD.set(clamp((t - 0.3) / 1.5)); }
    const lab = ['禁煙して20分', '禁煙して12時間', '禁煙して2〜3週間'][i];
    const val = ['血圧と脈が正常に', '一酸化炭素が正常に', '心臓と肺が回復へ'][i];
    setTop(lab, val, fade(t, 0.3, d, 0.25), [GOLD, BLUE, GREEN][i]); setHud('e-ヘルスネット', '厚生労働省', 1);
    bodyCam(0.6 + i * 0.2);
    return S;
  };
}
function stairCam(s, dd = 5.4, dy = 0.9) { const [y, z] = STAIRS.userData.at(s); const ty = y + 1.2, tz = z - RUN * 0.5; look(EX + 0.3 + dd, ty + dy, tz + 1.6, EX + 0.3, ty, tz, 50); }
function sStairs(t, d) { // 1か月後。駅の階段を上りきって、息が切れていない。
  reset(); lift(120); const s = clamp(t / (d * 0.6)) * N; const [y, z] = STAIRS.userData.at(Math.min(N, s));
  YANI.position.set(EX + 0.3, y, z - RUN * 0.5); YANI.rotation.y = Math.PI;
  if (s < N) poseRun(YANI, t * 8, 0.7); else { YANI.rotation.y = Math.PI / 2; YANI.userData.arms.forEach((a, i) => a.rotation.set(0, 0, i ? -0.3 : 0.3)); }
  if (t > d * 0.62) { say(kirenai, t, d * 0.62, EX + 0.3, y + 2.15, z - 0.2, 1.4); say(kosa, t, d * 0.75, EX + 1.15, y + 1.45, z - 0.2, 0.65); }
  setHud('禁煙', '1か月後', 1);
  stairCam(Math.min(N, s), 3.4, 0.5);
  return S;
}
function sKekka(t, d) { // 結果：1か月タバコをやめて、体は1日目から、もう取り戻し始めていた
  reset(); lift(120); const [y, z] = STAIRS.userData.at(N); YANI.position.set(EX + 0.3, y, z - RUN * 0.5 - 0.6); YANI.rotation.y = Math.PI / 2 - 0.4; YANI.userData.arms[1].rotation.set(-2.6, 0, -0.3);
  setTop('結果', '体は1日目から回復', fade(t, 0.4, d, 0.25), GREEN);
  const u = ease(clamp(t / d)); look(EX + 0.3 + lerp(2.6, 4.2, u), y + lerp(1.8, 2.6, u), z + lerp(1.4, 2.4, u), EX + 0.3, y + 1.1, z - 0.6, 50);
  return S;
}
function sKyou(t, d) { // いつでもやめられる の いつ は、今日だった
  reset(); lift(120); YANI.position.set(FX + 1.0, 0, -0.9); YANI.rotation.y = -0.5; YANI.userData.head.rotation.y = 0.4;
  CAL.userData.draw(clamp((t - d * 0.3) / 0.8)); if (t > d * 0.55) say(kyou, t, d * 0.55, FX - 0.75, 2.12, -1.9, 0.5);
  look(FX + 0.3, 1.9, 3.6, FX + 0.1, 1.85, -1.6, 50);
  return S;
}
function sAsk(t) { // 冒頭と同じ構図（灰皿は消えたまま）
  reset(); lift(0); ASH.visible = false; boothSign.visible = false; YANI.userData.arms[1].rotation.set(-1.3, 0, 0.3); YANI.rotation.y = -0.6; YANI.position.set(0.75, 0, -1.0); YANI.userData.head.rotation.x = 0.3; boothCam(0); return S;
}

const NARR = { '禁煙': 'きんえん', '1日目': 'いちにちめ', '胸': 'むね', '3回': 'さんかい', '本人': 'ほんにん', '言い分': 'いいぶん', '昼': 'ひる', '噛み': 'かみ', '3日目': 'みっかめ', '会議中': 'かいぎちゅう', '1週間後': 'いっしゅうかんご', '喫煙所': 'きつえんじょ', '20分': 'にじっぷん', '脈': 'みゃく', '12時間': 'じゅうにじかん', '一酸化炭素': 'いっさんかたんそ', '2〜3週間': 'にさんしゅうかん', '1か月後': 'いっかげつご', '1か月': 'いっかげつ', '結果：': '結果、', '今日': 'きょう', '血の中': 'ちのなか', '働き': 'はたらき' };
const P = planTimes([
  ['禁煙1日目のヤニカスが、<br>胸ポケットを3回探る。', sPocket],
  ['本人の言い分から。<br>やめようと思えば、', (t, d) => sIibun(t, 2 * d)],
  ['いつでもやめられる。', (t, d) => sIibun(t + d, 2 * d)],
  ['1日目の昼。口がさみしくて、<br>ガムを噛み続ける。', sGum],
  ['3日目。会議中、気づけば<br>ペンを口にくわえている。', sPen],
  ['1週間後。喫煙所の前を<br>通るたび、足が勝手に止まる。', sAshi],
  ['でも体の中では、<br>もう変化が始まっていた。', sBody],
  ['やめて20分で、<br>血圧と脈がふつうに戻る。', sData(0)],
  ['12時間で、血の中の<br>一酸化炭素がふつうに戻る。', sData(1)],
  ['2〜3週間で、心臓と肺の<br>働きが良くなってくる。', sData(2)],
  ['1か月後。駅の階段を<br>上りきって、息が切れていない。', sStairs],
  ['結果：1か月タバコをやめて、', (t, d) => sKekka(t, 3 * d)],
  ['体は1日目から、<br>もう取り戻し始めていた。', (t, d) => sKekka(t + d, 3 * d)],
  ['いつでもやめられる の いつ は、', (t, d) => sKyou(t, 2 * d)],
  ['今日だった。', (t, d) => sKyou(t + d, 2 * d)],
  ['タバコ、<br>やめたことある？', sAsk],
], { shot0, endCard, start: 3.0, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0681',
    v2: true,
    tt: 'main',
    hookLine: '喫煙所の灰皿が、パッと消える。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月タバコをやめたら？',
    titleHtml: 'もしも1か月<br>タバコを<br>やめたら？',
    mood: 'hopeful', seed: 681, hits: [TP, P.at(11), P.at(14)], risers: [P.at(6)], impacts: [P.at(7, 0.3), P.at(8, 0.3), P.at(9, 0.3), P.at(11, 0.4)],
    sfx: [[TP, 'poof'], [P.at(0, 0.6), 'whoosh'], [P.at(3, 0.5), 'bubble'], [P.at(5, 1.5), 'meter', 0.3], [P.at(6, 0.4), 'drone']],
    narr: NARR,
    ask: 'タバコ、やめたことある？',
    caption: 'もしも1か月タバコをやめたら？\n\n禁煙1日目のヤニカスが、胸ポケットを3回探る。\n本人の言い分から。やめようと思えば、いつでもやめられる。\n1日目の昼。口がさみしくて、ガムを噛み続ける。\n3日目。会議中、気づけばペンを口にくわえている。\n1週間後。喫煙所の前を通るたび、足が勝手に止まる。\nでも体の中では、もう変化が始まっていた。\nやめて20分で、血圧と脈がふつうに戻る。\n12時間で、血の中の一酸化炭素がふつうに戻る。\n2〜3週間で、心臓と肺の働きが良くなってくる。\n1か月後。駅の階段を上りきって、息が切れていない（変化には個人差があります）。\n\n結果：1か月タバコをやめて、体は1日目から、もう取り戻し始めていた。\nいつでもやめられる の いつ は、今日だった。\n\nタバコ、やめたことある？ コメントで教えて。\n\n出典：厚生労働省 e-ヘルスネット「禁煙開始からまだ間もない方へ《実行期編》」（禁煙の効果）',
    hashtags: ['もしもラボ', 'もしも', '禁煙', 'タバコ', '人体の限界'],
    endStats: [['禁煙して20分', '血圧と脈が正常に', 'e-ヘルスネット'], ['禁煙して12時間', '一酸化炭素が正常に', 'e-ヘルスネット'], ['禁煙して2〜3週間', '心臓と肺が回復へ', 'e-ヘルスネット']],
    sources: '出典：厚生労働省 e-ヘルスネット<br>「禁煙開始からまだ間もない方へ《実行期編》」',
  },
});
