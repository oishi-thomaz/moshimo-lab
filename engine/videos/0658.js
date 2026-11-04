import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom, makePhone } from '../satire-kit.js';
import { poseClear, makeSuit } from '../scenes/office.js';
import { makeDoc } from '../scenes/hanko.js';
import { planTimes } from '../scenes/fitness.js';

// もしも子どもに出演料を払う決まりだったら？（皮肉回・台本 S52・図星／大人の本音）
// 2026/11/04 ゆうと承認（投稿サーバーで ok）。元ネタ：ガルちゃん「相次ぐ「家族系YouTuber」の収益化停止 欧州では「子どもの肖像権保護」の法規制も」
//  https://girlschannel.net/topics/6324026/（2026/11/01、898コメント）
// 事実（一次資料で確認済み 2026/11/05）：フランス LOI n° 2020-1266 du 19 octobre 2020（16歳未満の子どもの画像のオンラインでの商業利用を規制。Légifrance JORFTEXT000042439054）
//  第3条 III：決められた額を超えた収入は Caisse des dépôts et consignations に払い込まれ、成年か独立まで預けられる（一部は親に残してよい）。
//  第8条：公布の6か月後に施行（＝2021年4月）。なので台本の 2020年から は 2020年の法律で と言い直した（施行は2021年4月とキャプションに書く）
// 実在のチャンネル・人・動画サービスの見た目は出さない（再生画面は架空）

const GOLD = '#ffd27a', RED = '#ff5a5a';
const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xfff6ea, 0x4a4a5a, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 600), mat('#3a3e48', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { poseClear(p); p.rotation.set(0, 0, 0); }
const MAMA = () => makeWoman({ shirt: '#e8a0b8', hair: '#5a3a28', pants: '#3a3f4e' });
const KID = () => makeMan({ shirt: '#f2c14e', pants: '#4f6a8f', hair: '#2a1c18', scale: 0.55 });
const TEEN = () => makeMan({ shirt: '#59606e', pants: '#2b3346', hair: '#1a1a22', scale: 0.85 });
function holdPhone(p, ph, k = 1) { p.userData.arms[0].rotation.set(-1.45 * k, 0, 0.25 * k); p.userData.arms[1].rotation.set(-1.45 * k, 0, -0.25 * k); ph.visible = k > 0.3; }
// ママが構えるスマホ（両手の先。カメラは子どもに向ける）
function makeHandPhone() { const g = new THREE.Group(); const b = box(0.2, 0.36, 0.03, mat('#15161c')); g.add(b); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), new THREE.MeshBasicMaterial({ color: '#4a5060' })); lens.position.set(0.05, 0.12, 0.017); g.add(lens); const rec = new THREE.Mesh(new THREE.CircleGeometry(0.02, 12), new THREE.MeshBasicMaterial({ color: '#ff3a3a' })); rec.position.set(-0.05, 0.14, 0.017); g.add(rec); return g; }
function tears(n = 4) { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#7fd0ff' }); const ds = []; for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m); d.scale.y = 1.4; g.add(d); ds.push(d); } g.userData.set = (k, t) => { g.visible = k > 0; ds.forEach((d, i) => { const s = i % 2 ? 1 : -1; const u = (t * 1.6 + i * 0.37) % 1; d.position.set(s * (0.12 + u * 0.08), 0.22 - u * 0.4, 0.2); }); }; return g; }

// ---------- A：リビング（原点）。ソファ・テレビ・おもちゃ ----------
const ROOM = makeRoom({ w: 9, d: 7, h: 3.4, wall: '#f2ebe0', floor: '#c8a878' }); S.add(ROOM);
const sofa = new THREE.Group(); { const sb = box(2.4, 0.45, 0.9, mat('#7a9ab8')); sb.position.y = 0.25; sofa.add(sb); const sbk = box(2.4, 0.6, 0.22, mat('#6a8aa8')); sbk.position.set(0, 0.7, -0.36); sofa.add(sbk); } sofa.position.set(-2.4, 0, -2.6); S.add(sofa);
const rug = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24), mat('#e8c8a0', { depthWrite: false })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, 0); rug.renderOrder = -0.7; S.add(rug);
const blocks = []; { const cols = ['#e05a4f', '#4fa3d1', '#f2c14e', '#5d8c3a']; for (let i = 0; i < 6; i++) { const b = box(0.22, 0.22, 0.22, mat(cols[i % 4])); b.position.set(-2.2 + (i % 3) * 0.3, 0.11 + Math.floor(i / 3) * 0.22, -0.9); S.add(b); blocks.push(b); } }
const ringLight = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: '#fff8e0' })); const rlPole = box(0.05, 1.6, 0.05, mat('#2a2a30')); rlPole.position.set(1.9, 0.8, 0.6); S.add(rlPole); ringLight.position.set(1.9, 1.75, 0.6); ringLight.rotation.y = -0.6; S.add(ringLight);
const A_MAMA = MAMA(); S.add(A_MAMA); const A_KID = KID(); S.add(A_KID);
const PHONE = makeHandPhone(); S.add(PHONE);
const INV = makeDoc({ title: '請求書', rows: ['出演料'], head: '#c8242c', w: 0.62, h: 0.5, cw: 384 }); S.add(INV);
const T_KID = tears(); A_KID.userData.head.add(T_KID);
const MGR = makeSuit({ glasses: true }); S.add(MGR);
const clip = makeDoc({ title: 'スケジュール', rows: ['撮影', 'NG'], head: '#2a3a6a', w: 0.5, h: 0.62, cw: 320 }); MGR.userData.arms[1].add(clip); clip.position.set(0, -0.62, 0.12); clip.rotation.x = -1.2;

// ---------- B：子ども部屋（x=100）。ベッドと時計 ----------
const BX = 100;
const BROOM = makeRoom({ w: 7, d: 6, h: 3.2, wall: '#e8eef8', floor: '#b8966a' }); BROOM.position.set(BX, 0, 0); S.add(BROOM);
const bed = new THREE.Group(); { const f = box(1.3, 0.4, 2.2, mat('#c9a87a')); f.position.y = 0.2; bed.add(f); const mt = box(1.2, 0.18, 2.1, mat('#fbfaf5')); mt.position.y = 0.48; bed.add(mt); const pil = box(0.7, 0.14, 0.4, mat('#ffffff')); pil.position.set(0, 0.62, -0.8); bed.add(pil); const fut = box(1.22, 0.16, 1.3, mat('#8fc4e8')); fut.position.set(0, 0.62, 0.3); bed.add(fut); } bed.position.set(BX - 0.6, 0, -1.4); S.add(bed);
const clockC = document.createElement('canvas'); clockC.width = 256; clockC.height = 128; const clockT = new THREE.CanvasTexture(clockC); clockT.colorSpace = THREE.SRGBColorSpace;
{ const g = clockC.getContext('2d'); g.fillStyle = '#1a1e2a'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#ff6a5a'; g.font = '700 84px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('5:30', 128, 68); clockT.needsUpdate = true; }
const CLOCK = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: clockT })); CLOCK.position.set(BX - 0.9, 2.05, -2.9); S.add(CLOCK);
const B_KID = KID(); S.add(B_KID); const B_MAMA = MAMA(); S.add(B_MAMA); const B_PHONE = makeHandPhone(); S.add(B_PHONE);
const T_B = tears(); B_KID.userData.head.add(T_B);
// 反抗期の部屋のドア
const DOOR = new THREE.Group(); { const fr = box(1.1, 2.2, 0.1, mat('#e8e0d0')); fr.position.y = 1.1; DOOR.add(fr); const d = box(0.96, 2.06, 0.08, mat('#9a7a58')); d.position.set(0, 1.05, 0.06); DOOR.add(d); const kn = box(0.08, 0.08, 0.1, mat('#d8c070')); kn.position.set(0.35, 1.0, 0.13); DOOR.add(kn); } DOOR.position.set(BX + 2.2, 0, -2.85); S.add(DOOR);
const keepOut = label('入るな', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,60,70,.96)', sx: 0.7 }); keepOut.position.set(BX + 2.2, 1.7, -2.7); S.add(keepOut);
const C_TEEN = TEEN(); S.add(C_TEEN);

// ---------- C：お金の流れ（x=200）。スマホから子どもの口座へ硬貨 ----------
const CX = 200;
const cFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#4a4458', { depthWrite: false })); cFloor.rotation.x = -Math.PI / 2; cFloor.position.set(CX, 0.03, 0); cFloor.renderOrder = -0.8; S.add(cFloor);
const BIG = makePhone({ w: 1.5, h: 2.9, cw: 480, ch: 928 }); BIG.g.position.set(CX - 1.4, 2.0, 0); BIG.g.rotation.y = 0.25; S.add(BIG.g);
function drawVideo(kind, t = 0) { // 架空の動画アプリの再生画面（再生ボタン・ハート）
  BIG.draw(kind + Math.floor(t * 4), (g, w, h) => {
    g.fillStyle = '#101218'; g.fillRect(0, 0, w, h);
    g.fillStyle = kind === 'off' ? '#3a3e48' : '#f2d0a8'; g.fillRect(20, 140, w - 40, h * 0.5);
    if (kind !== 'off') { g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(w / 2, 140 + h * 0.22, 70, 0, 7); g.fill(); g.fillStyle = '#2a1c18'; g.fillRect(w / 2 - 70, 140 + h * 0.22 - 80, 140, 40); g.fillStyle = '#121212'; g.fillRect(w / 2 - 30, 140 + h * 0.22 - 10, 14, 20); g.fillRect(w / 2 + 16, 140 + h * 0.22 - 10, 14, 20); if (kind === 'cry') { g.fillStyle = '#7fd0ff'; g.fillRect(w / 2 - 30, 140 + h * 0.22 + 14 + (t * 60 % 30), 10, 18); g.fillRect(w / 2 + 20, 140 + h * 0.22 + 14 + ((t * 60 + 15) % 30), 10, 18); } }
    else { g.fillStyle = '#9aa0b0'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('更新お休み中', w / 2, 140 + h * 0.25); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(w / 2 - 34, h * 0.75 - 40); g.lineTo(w / 2 + 44, h * 0.75); g.lineTo(w / 2 - 34, h * 0.75 + 40); g.fill();
    g.fillStyle = '#ff4a6a'; for (let i = 0; i < 3; i++) { const x = 70 + i * 120, y = h - 90; g.beginPath(); g.arc(x - 14, y, 16, 0, 7); g.arc(x + 14, y, 16, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 30, y + 6); g.lineTo(x, y + 40); g.lineTo(x + 30, y + 6); g.fill(); }
  });
}
const BANK = new THREE.Group(); { const b = box(1.6, 1.3, 1.0, mat('#3a7ab8')); b.position.y = 0.65; BANK.add(b); const slot = box(0.6, 0.06, 0.3, mat('#1a2a3a')); slot.position.set(0, 1.31, 0); BANK.add(slot); } BANK.position.set(CX + 1.3, 0, 0.2); S.add(BANK);
const kouza = label('子どもの口座', { w: 900, size: 100, color: '#fff', bg: 'rgba(52,128,230,.96)', sx: 1.45 }); kouza.position.set(CX + 1.3, 1.9, 0.75); S.add(kouza);
const COINS = []; for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), mat('#e8c060')); c.rotation.x = Math.PI / 2; S.add(c); COINS.push(c); }
const saisei = label('再生は変わらない', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.6 }); S.add(saisei);
const C_MAMA = MAMA(); S.add(C_MAMA);

// ---------- D：家族チャンネルの一覧（x=300）。更新が止まる ----------
const DX = 300;
const dWall = box(16, 9, 0.2, mat('#2a2e3a')); dWall.position.set(DX, 4.5, -3); S.add(dWall);
function thumbTex(i, off) { const c = document.createElement('canvas'); c.width = 320; c.height = 200; const g = c.getContext('2d'); const cols = ['#f2d0a8', '#c8e0f0', '#f0d8e8', '#d8f0c8', '#f8e8b8', '#e0d8f8']; g.fillStyle = off ? '#4a4e58' : cols[i % 6]; g.fillRect(0, 0, 320, 200); if (!off) { g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(110, 100, 46, 0, 7); g.fill(); g.fillStyle = '#e8a0b8'; g.beginPath(); g.arc(210, 90, 52, 0, 7); g.fill(); } else { g.fillStyle = '#c9ced8'; g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('更新停止', 160, 100); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const THUMBS = []; for (let i = 0; i < 12; i++) { const on = thumbTex(i, false), off = thumbTex(i, true); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: on })); m.position.set(DX - 3.9 + (i % 3) * 2.6 + 1.3, 6.6 - Math.floor(i / 3) * 1.7, -2.85); S.add(m); THUMBS.push({ m, on, off }); }
const tomaru = label('更新が止まる', { w: 900, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 2.6 }); S.add(tomaru);

// ---------- E：結果（x=400）。収支の看板が赤字に ----------
const EX = 400;
const eFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#3a3448', { depthWrite: false })); eFloor.rotation.x = -Math.PI / 2; eFloor.position.set(EX, 0.03, 0); eFloor.renderOrder = -0.8; S.add(eFloor);
const boardC = document.createElement('canvas'); boardC.width = 640; boardC.height = 480; const boardT = new THREE.CanvasTexture(boardC); boardT.colorSpace = THREE.SRGBColorSpace; let boardK = -1;
function drawBoard(k) { const q = Math.round(k * 20); if (q === boardK) return; boardK = q; const g = boardC.getContext('2d'); g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 640, 480); g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, 640, 90); g.fillStyle = '#fff'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('家族チャンネルの収支', 320, 48);
  g.strokeStyle = '#c9ced8'; g.lineWidth = 4; g.beginPath(); g.moveTo(60, 280); g.lineTo(600, 280); g.stroke();
  g.strokeStyle = k < 0.5 ? '#3a9a5a' : '#d8242c'; g.lineWidth = 14; g.lineJoin = 'round'; g.beginPath(); const pts = [[70, 200], [190, 170], [310, 150], [400, 140]]; const drop = [[480, 230], [560, 360], [600, 420]]; pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); const n = Math.floor(clamp((k - 0.3) / 0.6) * 3.99); drop.slice(0, n).forEach(([x, y]) => g.lineTo(x, y)); g.stroke();
  boardT.needsUpdate = true; }
const BOARD = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshBasicMaterial({ map: boardT })); BOARD.position.set(EX, 2.4, -0.5); S.add(BOARD);
const bStand = box(0.12, 1.3, 0.12, mat('#3a3a40')); bStand.position.set(EX, 0.65, -0.55); S.add(bStand);
const akaji = label('赤字', { w: 512, size: 160, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(akaji);
const E_MAMA = MAMA(); S.add(E_MAMA);
// 子役（スポットライト）
const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.4, 4, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); spot.position.set(EX + 6, 2, 0); S.add(spot);
const spotDisk = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.35, depthWrite: false })); spotDisk.rotation.x = -Math.PI / 2; spotDisk.position.set(EX + 6, 0.05, 0); spotDisk.renderOrder = -0.6; S.add(spotDisk);
const E_KID = KID(); S.add(E_KID);
const koyaku = label('ギャラなしの子役', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(koyaku);
// フランスの法律：大人になるまで開かない金庫
const SAFE = new THREE.Group(); { const b = box(1.4, 1.5, 1.2, mat('#8a92a4')); b.position.y = 0.75; SAFE.add(b); const d = box(1.2, 1.3, 0.06, mat('#a8b0bc')); d.position.set(0, 0.75, 0.62); SAFE.add(d); const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 18), mat('#c9ced8')); dial.rotation.x = Math.PI / 2; dial.position.set(0.25, 0.85, 0.67); SAFE.add(dial); const lock = box(0.36, 0.3, 0.12, mat('#d8b040')); lock.position.set(-0.25, 0.85, 0.7); SAFE.add(lock); } SAFE.position.set(EX + 12, 0, 0); S.add(SAFE);
const france = label('フランス 2020年の法律', { w: 1100, size: 96, color: '#fff', bg: 'rgba(42,58,106,.96)', sx: 2.2 }); S.add(france);
const otona = label('大人になるまで 親は使えない', { w: 1300, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.4 }); S.add(otona);
const SAFE_COINS = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), mat('#e8c060')); c.rotation.x = Math.PI / 2; S.add(c); SAFE_COINS.push(c); }

// 吹き出し・札
const L = (t, bg, fg = '#fff', sx = 1.1, size = 110, w = 640) => { const l = label(t, { w, size, color: fg, bg, sx }); S.add(l); return l; };
const neoki = L('寝起き', 'rgba(140,80,220,.95)', '#fff', 0.8, 110, 512);
const oonaki = L('大泣き', 'rgba(60,110,200,.95)', '#fff', 0.8, 110, 512);
const fuman = L('またよその子の動画…', 'rgba(255,255,255,.97)', '#2a1a00', 1.9, 92, 1000);
const shuen = L('出演料', 'rgba(214,30,40,.98)', '#fff', 0.95, 120, 512);
const manager = L('マネージャー', 'rgba(42,58,106,.96)', '#fff', 1.2, 100, 768);
const souchou = L('早朝料金', 'rgba(214,30,40,.98)', '#fff', 1.15, 120, 640);
const tsuika = L('追加料金', 'rgba(214,30,40,.98)', '#fff', 1.15, 120, 640);
const NG = L('NG', 'rgba(214,30,40,.98)', '#fff', 0.7, 150, 384);
const oku = L('スマホを置く', 'rgba(70,76,92,.96)', '#fff', 1.3, 100, 768);
const riyuu = L('撮る理由がない', 'rgba(255,255,255,.97)', '#2a1a00', 1.5, 100, 900);

const PEOPLE = [A_MAMA, A_KID, MGR, B_KID, B_MAMA, C_TEEN, C_MAMA, E_MAMA, E_KID];
const LABELS = [kouza, saisei, tomaru, akaji, koyaku, france, otona, neoki, oonaki, fuman, shuen, manager, souchou, tsuika, NG, oku, riyuu];
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; });
  LABELS.forEach(l => l.visible = false); kouza.visible = true; keepOut.visible = true;
  A_MAMA.position.set(0.75, 0, 0.4); A_MAMA.rotation.y = -Math.PI / 2; A_KID.position.set(-0.45, 0, 0.4); A_KID.rotation.y = Math.PI / 2; MGR.visible = false; MGR.position.set(-1.1, 0, -0.4); MGR.rotation.y = 0.6;
  PHONE.visible = false; INV.visible = false; T_KID.userData.set(0, 0); T_B.userData.set(0, 0); B_PHONE.visible = false;
  B_KID.position.set(BX - 0.6, 0.62, -1.55); B_KID.rotation.set(-Math.PI / 2, 0, 0); B_MAMA.position.set(BX + 0.6, 0, -0.2); B_MAMA.rotation.y = -2.2;
  C_TEEN.position.set(BX + 2.2, 0, -2.5); C_TEEN.visible = false;
  C_MAMA.visible = false; E_MAMA.visible = false; E_KID.position.set(EX + 6, 0, 0); E_MAMA.position.set(EX - 1.6, 0, 0.6);
  COINS.forEach(c => c.visible = false); SAFE_COINS.forEach(c => c.visible = false); THUMBS.forEach(x => x.m.material.map = x.on);
  drawVideo('play', 0); drawBoard(0); el.flash.style.opacity = 0;
}
// ママのスマホを、ママの手の先・子どもに向けて置く
function phoneAt(ph, p, k = 1) { holdPhone(p, ph, k); const fwd = new THREE.Vector3(Math.sin(p.rotation.y), 0, Math.cos(p.rotation.y)); ph.position.set(p.position.x + fwd.x * 0.62, p.position.y + 1.42, p.position.z + fwd.z * 0.62); ph.rotation.set(0, p.rotation.y + Math.PI, 0); }
const TP = 0.45; // 0.45秒で請求書がスッと出る
function kneel(p) { p.userData.legs.forEach(l => l.rotation.x = Math.PI / 2); p.position.y = -0.7; }
function hookCam(u = 0) { look(lerp(0.05, 0.15, u), 1.25, lerp(3.9, 3.6, u), 0.15, 0.95, 0.4, 50); }
function invoiceOut(t, t0 = TP) { const k = easeOut(clamp((t - t0) / 0.3)); INV.visible = t > t0 - 0.05; A_KID.userData.arms[1].rotation.x = -1.4 * k; A_KID.userData.arms[0].rotation.x = -1.2 * k; INV.position.set(A_KID.position.x + 0.3 + 0.25 * k, 0.62 + 0.12 * k, A_KID.position.z + 0.12); INV.rotation.set(0, -0.35, 0); INV.scale.setScalar(0.5 + 0.5 * k); INV.userData.fill(0, k > 0.9 ? 'お願いします' : ''); }
function shot0(t) { // 0秒＝サムネ：スマホを構えたママの前で、子どもが小さな請求書をスッと差し出す
  reset(); lift(0); kneel(A_MAMA); phoneAt(PHONE, A_MAMA); invoiceOut(t);
  if (t > TP) { el.flash.style.opacity = t < TP + 0.1 ? 0.3 : 0; }
  hookCam(ease(clamp(t / 3)));
  return S;
}
function sFuman(t) { // 見ている人の不満から。
  reset(); lift(0); A_MAMA.visible = A_KID.visible = false; drawVideo('play', t);
  BIG.g.position.set(CX - 1.4, 2.0, 0); C_MAMA.visible = false; kouza.visible = false;
  fuman.position.set(CX - 1.4, 3.7, 0.4); pop(fuman, t, 0.5, 0.3, 1.7);
  look(CX - 1.2, 2.2, 5.0, CX - 1.4, 2.2, 0, 50);
  return S;
}
function sNaki(t) { // よその子の寝起きや大泣きが、毎日流れてくる。
  reset(); lift(0); kouza.visible = false; drawVideo(t < 1.6 ? 'play' : 'cry', t);
  neoki.position.set(CX - 2.0, 3.65, 0.4); pop(neoki, t, 0.3, 0.25, 0.75);
  if (t > 1.6) { oonaki.position.set(CX - 0.8, 3.65, 0.4); pop(oonaki, t, 1.6, 0.25, 0.75); }
  look(CX - 1.2, 2.2, 5.0, CX - 1.4, 2.2, 0, 50);
  return S;
}
function sAruhi(t) { // ある日、動画に映る子どもにも、
  reset(); lift(0); kneel(A_MAMA); phoneAt(PHONE, A_MAMA);
  look(lerp(1.6, 0.6, ease(clamp(t / 3))), 1.3, 3.4, 0.2, 0.95, 0.4, 50);
  return S;
}
function sShutsuen(t) { // 出演料を払う決まりになった。
  reset(); lift(0); kneel(A_MAMA); phoneAt(PHONE, A_MAMA); invoiceOut(t, 0.2);
  shuen.position.set(0.05, 1.5, 0.5); pop(shuen, t, 0.7, 0.25, 0.85); el.flash.style.opacity = t > 0.7 && t < 0.8 ? 0.3 : 0;
  hookCam(1);
  return S;
}
function sManager(t) { // 子どもに、マネージャーがつく。
  reset(); lift(0); kneel(A_MAMA); MGR.visible = true; MGR.position.set(-1.0, 0, -0.1 + (1 - easeOut(clamp(t / 0.8))) * -1.2); MGR.rotation.y = 0.3; MGR.userData.arms[1].rotation.x = -0.9; phoneAt(PHONE, A_MAMA); A_KID.rotation.y = 1.2;
  manager.position.set(-0.55, 2.35, 0.0); pop(manager, t, 0.7, 0.25, 1.05);
  look(-0.1, 1.5, 4.6, -0.2, 1.15, 0.2, 50);
  return S;
}
function bCam(u = 0) { look(BX + lerp(1.9, 1.6, u), 2.2, lerp(2.4, 2.1, u), BX - 0.3, 1.0, -1.5, 52); }
function sSouchou(t) { // 寝起きドッキリは、早朝料金。
  reset(); lift(0); B_MAMA.position.set(BX + 0.45, 0, -1.2); B_MAMA.rotation.y = -1.9; phoneAt(B_PHONE, B_MAMA);
  souchou.position.set(BX - 0.5, 1.75, -1.2); pop(souchou, t, 0.8, 0.25, 1.05); el.flash.style.opacity = t > 0.8 && t < 0.9 ? 0.3 : 0;
  bCam(ease(clamp(t / 3)));
  return S;
}
function sTsuika(t) { // 大泣きの瞬間は、追加料金。
  reset(); lift(0); B_KID.position.set(BX - 0.4, 0, -0.2); B_KID.rotation.set(0, 0.6, 0); B_KID.userData.head.rotation.x = -0.2; B_KID.userData.arms[0].rotation.set(-2.4, 0, 0.3); B_KID.userData.arms[1].rotation.set(-2.4, 0, -0.3); T_B.userData.set(1, t);
  B_MAMA.position.set(BX + 0.8, 0, 0.6); B_MAMA.rotation.y = -2.3; phoneAt(B_PHONE, B_MAMA);
  tsuika.position.set(BX - 0.35, 1.45, 0.1); pop(tsuika, t, 0.7, 0.25, 1.05); el.flash.style.opacity = t > 0.7 && t < 0.8 ? 0.3 : 0;
  look(BX - 1.8, 1.4, 2.8, BX - 0.1, 0.8, -0.1, 50);
  return S;
}
function sNG(t) { // 反抗期の部屋に入るのは、NG。
  reset(); lift(0); B_KID.visible = false; C_TEEN.visible = true; C_TEEN.position.set(BX + 2.2, 0, -2.4); C_TEEN.rotation.y = 0; C_TEEN.userData.arms[1].rotation.set(-1.4, 0, 0.3);
  B_MAMA.position.set(BX + 0.6, 0, -1.2); B_MAMA.rotation.y = 2.21; phoneAt(B_PHONE, B_MAMA);
  NG.position.set(BX + 2.25, 2.35, -2.2); pop(NG, t, 0.9, 0.2, 0.65); el.flash.style.opacity = t > 0.9 && t < 1.0 ? 0.3 : 0;
  look(BX + 1.4, 1.75, 1.3, BX + 1.8, 1.35, -2.4, 50);
  return S;
}
function cCam(u = 0) { look(CX + lerp(0.2, 0, u), 2.2, lerp(8.6, 8.0, u), CX, 1.8, 0, 50); }
function coinsFlow(t, n = COINS.length) { COINS.forEach((c, i) => { const u = (t * 0.8 + i / COINS.length) % 1; c.visible = i < n; const x = lerp(CX - 1.2, CX + 1.3, u), y = 2.2 + Math.sin(u * Math.PI) * 0.9 - u * 0.9; c.position.set(x, y, 0.1); c.rotation.z = t * 6 + i; }); }
function sSaisei(t) { // 再生は変わらない。
  reset(); lift(0); drawVideo('play', t); coinsFlow(t, 0);
  saisei.position.set(CX - 1.4, 3.8, 0.4); pop(saisei, t, 0.3, 0.25, 1.5);
  cCam(0);
  return S;
}
function sMouke(t) { // でも、もうけは子どもの口座に消えていく。
  reset(); lift(0); drawVideo('play', t); coinsFlow(t);
  cCam(ease(clamp(t / 3)));
  return S;
}
function sOku(t) { // 撮る理由がなくなったママは、スマホを置く。
  reset(); lift(0); const k = ease(clamp((t - 0.8) / 0.8));
  A_MAMA.rotation.y = -Math.PI / 2; holdPhone(A_MAMA, PHONE, 1 - k); PHONE.visible = true;
  const fwd = new THREE.Vector3(Math.sin(A_MAMA.rotation.y), 0, Math.cos(A_MAMA.rotation.y));
  PHONE.position.set(A_MAMA.position.x + fwd.x * lerp(0.62, 0.5, k), lerp(1.42, 0.03, k), A_MAMA.position.z + fwd.z * lerp(0.62, 0.5, k)); PHONE.rotation.set(-Math.PI / 2 * k, A_MAMA.rotation.y + Math.PI, 0);
  if (t < 1.7) { riyuu.position.set(0.4, 2.35, 0.5); pop(riyuu, t, 0.2, 0.25, 1.3); }
  else { oku.position.set(0.4, 2.35, 0.5); pop(oku, t, 1.7, 0.25, 1.1); }
  look(0.1, 1.6, 4.6, 0.2, 1.1, 0.4, 50);
  return S;
}
function sTomaru(t) { // 家族チャンネルの更新が、次々と止まる。
  reset(); lift(0); THUMBS.forEach((x, i) => { x.m.material.map = t > 0.4 + i * 0.16 ? x.off : x.on; });
  if (t > 2.2) { tomaru.position.set(DX, 8.05, -2.4); pop(tomaru, t, 2.2, 0.25, 4.2); }
  look(DX, 4.4, 14.5, DX, 4.1, -2.85, 50);
  return S;
}
function sKekka(t) { // 結果：子どもにギャラを払った瞬間、
  reset(); lift(0); drawBoard(clamp(t / 2.5) * 0.5); E_MAMA.visible = true; E_MAMA.rotation.y = 0.5;
  look(EX - 0.4, 2.3, 7.6, EX - 0.2, 1.9, -0.5, 50);
  return S;
}
function sAkaji(t) { // 家族チャンネルは赤字になった。
  reset(); lift(0); drawBoard(0.5 + clamp(t / 1.2) * 0.5); E_MAMA.visible = true; E_MAMA.rotation.y = 0.5; E_MAMA.userData.head.rotation.x = 0.3; E_MAMA.userData.arms[0].rotation.set(-2.6, 0, 0.3);
  if (t > 1.0) { akaji.position.set(EX + 0.9, 3.4, -0.2); pop(akaji, t, 1.0, 0.25, 1.0); el.flash.style.opacity = t < 1.1 ? 0.3 : 0; }
  look(EX - 0.4, 2.3, 7.6, EX - 0.2, 1.9, -0.5, 50);
  return S;
}
function sIchiban(t) { // 一番働いていたのは、
  reset(); lift(0); E_KID.rotation.y = 0;
  const u = ease(clamp(t / 3)); look(EX + 6, lerp(1.6, 1.3, u), lerp(4.6, 3.6, u), EX + 6, 0.8, 0, 50);
  return S;
}
function sKoyaku(t) { // ギャラなしの子役だったのかもしれない。
  reset(); lift(0); E_KID.rotation.y = 0; E_KID.userData.arms[1].rotation.set(-0.3, 0, -0.4);
  koyaku.position.set(EX + 6, 1.6, 0.4); pop(koyaku, t, 0.4, 0.3, 1.5);
  look(EX + 6, 1.3, 3.6, EX + 6, 0.8, 0, 50);
  return S;
}
function sFrance(t) { // 実はフランスでは、2020年の法律で
  reset(); lift(0); france.position.set(EX + 12, 2.6, 0.5); pop(france, t, 0.3, 0.3, 2.1);
  look(EX + 12.4, 1.9, 6.6, EX + 12, 1.45, 0, 50);
  return S;
}
function sSafe(t) { // 子どもが動画で稼いだお金の一部は、大人になるまで
  reset(); lift(0); france.visible = true; france.position.set(EX + 12, 2.6, 0.5); france.userData.size(2.1);
  SAFE_COINS.forEach((c, i) => { const u = clamp((t - i * 0.35) / 0.8); c.visible = u > 0 && u < 1; c.position.set(EX + 12 - 0.2 + i * 0.08, lerp(2.0, 0.9, u), lerp(1.4, 0.7, u)); c.rotation.z = t * 5; });
  look(EX + 12.4, 1.9, 6.6, EX + 12, 1.45, 0, 50);
  return S;
}
function sOya(t) { // 親が使えない口座に入る。
  reset(); lift(0); otona.position.set(EX + 12, 2.6, 0.5); pop(otona, t, 0.2, 0.3, 2.3);
  look(EX + 12.4, 1.9, 6.6, EX + 12, 1.45, 0, 50);
  return S;
}
function sAsk(t) { // 子どもを動画に出す親、あり？なし？（冒頭と同じ構図）
  reset(); lift(0); kneel(A_MAMA); phoneAt(PHONE, A_MAMA); invoiceOut(1);
  hookCam(0);
  return S;
}

const NARR = { '寝起き': 'ねおき', '大泣き': 'おおなき', '出演料': 'しゅつえんりょう', '寝起きドッキリ': 'ねおきどっきり', '早朝料金': 'そうちょうりょうきん', '追加料金': 'ついかりょうきん', '反抗期': 'はんこうき', 'NG': 'エヌジー', '再生': 'さいせい', '口座': 'こうざ', '家族チャンネル': 'かぞくチャンネル', '結果：': '結果、', '子役': 'こやく', '一番': 'いちばん', '2020年': 'にせんにじゅうねん', '稼いだ': 'かせいだ', '一部': 'いちぶ', '出す': 'だす', '撮る': 'とる' };
const P = planTimes([
  ['見ている人の不満から。', sFuman],
  ['よその子の寝起きや大泣きが、<br>毎日流れてくる。', sNaki],
  ['ある日、動画に映る<br>子どもにも、', sAruhi],
  ['出演料を払う決まりになった。', sShutsuen],
  ['子どもに、<br>マネージャーがつく。', sManager],
  ['寝起きドッキリは、<br>早朝料金。', sSouchou],
  ['大泣きの瞬間は、<br>追加料金。', sTsuika],
  ['反抗期の部屋に入るのは、<br>NG。', sNG],
  ['再生は変わらない。', sSaisei],
  ['でも、もうけは子どもの<br>口座に消えていく。', sMouke],
  ['撮る理由がなくなったママは、<br>スマホを置く。', sOku],
  ['家族チャンネルの更新が、<br>次々と止まる。', sTomaru],
  ['結果：子どもにギャラを<br>払った瞬間、', sKekka],
  ['家族チャンネルは<br>赤字になった。', sAkaji],
  ['一番働いていたのは、', sIchiban],
  ['ギャラなしの子役だった<br>のかもしれない。', sKoyaku],
  ['実はフランスでは、<br>2020年の法律で', sFrance],
  ['子どもが動画で稼いだお金の<br>一部は、大人になるまで', sSafe],
  ['親が使えない口座に入る。', sOya],
  ['子どもを動画に出す親、<br>あり？なし？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0658',
    v2: true,
    hookLine: 'スマホを構えたママの前で、子どもが小さな請求書をスッと差し出す。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも子どもに出演料を払う決まりだったら？',
    titleHtml: 'もしも子どもに<br>出演料を払う<br>決まりだったら？',
    mood: 'tension', seed: 658, hits: [0.45, P.at(12), P.at(14)], risers: [P.at(10)], impacts: [P.at(3, 0.7), P.at(5, 0.8), P.at(6, 0.7), P.at(7, 0.9), P.at(13, 1.0), P.at(16, 0.3)],
    sfx: [[0.45, 'poof'], [P.at(1, 1.6), 'bubble'], [P.at(3, 0.7), 'poof'], [P.at(4, 0.3), 'whoosh'], [P.at(5, 0.8), 'alarm'], [P.at(6, 0.7), 'alarm'], [P.at(7, 0.9), 'buzz'], [P.at(9, 0.2), 'whoosh'], [P.at(10, 1.0), 'poof'], [P.at(11, 0.4), 'meter', 0.3], [P.at(13, 1.0), 'poof'], [P.at(17, 0.2), 'whoosh']],
    narr: NARR,
    ask: '子どもを動画に出す親、あり？なし？',
    caption: 'もしも子どもに出演料を払う決まりだったら？\n\n見ている人の不満から。よその子の寝起きや大泣きが、毎日流れてくる。\nある日、動画に映る子どもにも、出演料を払う決まりになった。\n子どもに、マネージャーがつく。\n寝起きドッキリは、早朝料金。大泣きの瞬間は、追加料金。反抗期の部屋に入るのは、NG。\n再生は変わらない。でも、もうけは子どもの口座に消えていく。\n撮る理由がなくなったママは、スマホを置く。家族チャンネルの更新が、次々と止まる。\n\n結果：子どもにギャラを払った瞬間、家族チャンネルは赤字になった。\n一番働いていたのは、ギャラなしの子役だったのかもしれない。\n実はフランスでは、2020年の法律で、子どもが動画で稼いだお金の一部は、大人になるまで親が使えない口座に入る。\n\n子どもを動画に出す親、あり？なし？ コメントで教えて。\n\n※風刺ネタです。日本で子どもに出演料を払う決まりは、もしもの設定です。登場する人物・チャンネルは架空です\n出典：フランス 2020年10月19日の法律 第2020-1266号（16歳未満の子どもの画像のオンラインでの商業利用を規制。決められた額を超えた収入は預金供託公庫に払い込まれ、成年か独立まで預けられる。施行は2021年4月）',
    hashtags: ['もしもラボ', 'もしも', '家族チャンネル', '子どもの肖像権', '出演料'],
    endStats: [['フランスの法律', '2020年10月19日', '施行は2021年4月'], ['対象', '16歳未満の子ども', 'オンラインの商業利用'], ['稼いだお金の一部', '大人になるまで預ける', '成年か独立まで']],
    sources: '出典：フランス 2020年10月19日の法律 第2020-1266号（Légifrance）',
  },
});
