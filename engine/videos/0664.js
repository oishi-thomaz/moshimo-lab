import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, makeChair, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';

// もしも夫の扶養が消えたら？（皮肉回・台本 S65・社会の消えたら）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。元ネタ：ガルちゃん「今更、共働きが当たり前と言われて困っている方」https://girlschannel.net/topics/6327276/（2026/11/04）
//  ＋「8時間勤務っておかしくないですか？」https://girlschannel.net/topics/6325212/
// 数字は使わない（年収の壁の金額・制度の改正の中身は画面に出さない）。店・会社・保育園は架空。女叩き（逃げ切りたい扶養内の妻）から入り、着地で夫に返る

const S = new THREE.Scene();
S.background = new THREE.Color('#a8cce8'); S.fog = new THREE.Fog(0xa8cce8, 60, 220);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a5a66, 1.25); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800), mat('#8a9078', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.01) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
const APRON = '#5a9a6a';
function makeTsuma() { const p = makeWoman({ shirt: '#e9e4da', hair: '#4a3020', pants: '#3a3f4e' }); const ap = box(0.44, 0.7, 0.04, mat(APRON)); ap.position.set(0, 1.0, 0.16); p.add(ap); p.userData.apron = ap; return p; }

// ---------- A：スーパーのバックヤード（原点）：シフト表 ----------
flat(12, 10, '#c8c4bc', 0, 0);
const aWall = box(12, 3.4, 0.2, mat('#e6e2da')); aWall.position.set(0, 1.7, -2.2); S.add(aWall);
const shiftC = document.createElement('canvas'); shiftC.width = 1200; shiftC.height = 860; const shiftT = new THREE.CanvasTexture(shiftC); shiftT.colorSpace = THREE.SRGBColorSpace;
const SHIFT = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.15), new THREE.MeshBasicMaterial({ map: shiftT })); SHIFT.position.set(0, 1.85, -2.08); S.add(SHIFT);
const SF = box(3.15, 2.3, 0.05, mat('#7a7e88')); SF.position.set(0, 1.85, -2.12); S.add(SF);
const NAMES = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺'], DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const OFF = [[1, 0, 1, 1, 0, 0, 1], [0, 1, 1, 0, 1, 1, 0], [1, 1, 0, 1, 1, 0, 1], [0, 0, 1, 1, 0, 1, 1], [1, 0, 0, 1, 1, 1, 0], [0, 1, 1, 0, 0, 1, 1]];
let shiftKey = '';
function drawShift(fuyo, fill) { const k = fuyo.toFixed(2) + '|' + fill.toFixed(2); if (k === shiftKey) return; shiftKey = k; const g = shiftC.getContext('2d');
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 1200, 860); g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, 1200, 120); g.fillStyle = '#fff'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('12月のシフト表', 600, 62);
  const x0 = 250, cw = 135, y0 = 130, rh = 118;
  g.fillStyle = '#333'; g.font = '800 46px "Noto Sans CJK JP", sans-serif'; DAYS.forEach((d, j) => g.fillText(d, x0 + cw * j + cw / 2, y0 + 30));
  let cell = 0;
  NAMES.forEach((n, i) => { const y = y0 + 64 + i * rh; g.fillStyle = '#333'; g.textAlign = 'left'; g.font = '800 46px "Noto Sans CJK JP", sans-serif'; g.fillText(n, 24, y + rh / 2 - 6);
    if (fuyo > 0) { g.globalAlpha = fuyo; g.fillStyle = '#d62a2a'; g.font = '900 38px "Noto Sans CJK JP", sans-serif'; g.fillText('扶養内', 122, y + rh / 2 - 6); g.globalAlpha = 1; }
    g.textAlign = 'center';
    DAYS.forEach((d, j) => { const x = x0 + cw * j; const off = OFF[i][j]; const filled = !off || (cell++ / 22) < fill; g.fillStyle = filled ? '#7ec08a' : '#e4e4e0'; g.fillRect(x + 8, y + 8, cw - 16, rh - 22); if (filled) { g.fillStyle = '#fff'; g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.fillText('出', x + cw / 2, y + rh / 2 - 6); } }); });
  shiftT.needsUpdate = true; }
const A_TSUMA = makeTsuma(); S.add(A_TSUMA);
const sparkA = makeSparkles(160, 0.14, 0xffd0d0); S.add(sparkA.points); sparkA.init([[-1.15, 1.85, -2.0], [-1.15, 1.2, -2.0], [-1.15, 2.4, -2.0]], 0.5, 0.8);
const pon = label('扶養内 消滅', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(pon);
const umaru = label('全部うまる', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.2 }); S.add(umaru);

// ---------- B：レジ（x=60）：今更！？ ----------
const BX = 60;
flat(12, 10, '#e4e2dc', BX, 0);
const bWall = box(12, 3.4, 0.2, mat('#f2f0ea')); bWall.position.set(BX, 1.7, -3); S.add(bWall);
const regi = new THREE.Group(); { const c = box(1.8, 0.9, 0.7, mat('#d8d8d4')); c.position.y = 0.45; regi.add(c); const m = box(0.5, 0.35, 0.3, mat('#2a2e38')); m.position.set(0.4, 1.1, 0); regi.add(m); const scr = box(0.42, 0.26, 0.01, new THREE.MeshBasicMaterial({ color: '#7fd4ff' })); scr.position.set(0.4, 1.12, 0.16); regi.add(scr); } regi.position.set(BX, 0, -0.6); S.add(regi);
const regiSign = label('レジ', { w: 400, size: 110, color: '#fff', bg: 'rgba(200,60,50,.95)', sx: 0.7 }); regiSign.position.set(BX - 1.6, 2.6, -2.8); S.add(regiSign);
const B_TSUMA = makeTsuma(); S.add(B_TSUMA);
const imasara = label('今更！？', { w: 640, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(imasara);
const COWORK = [makeSuit({ woman: true, jacket: '#3a4256', hair: '#2a2020' }), makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#6b4a33' })]; COWORK.forEach(p => S.add(p));
const hoken = label('うちは2人とも保険料', { w: 1024, size: 92, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.2 }); S.add(hoken);

// ---------- C：面接（x=120） ----------
const CX = 120;
flat(10, 8, '#8a8a90', CX, 0);
const cWall = box(10, 3.2, 0.2, mat('#e6e2da')); cWall.position.set(CX, 1.6, -2.4); S.add(cWall);
const cDesk = box(1.6, 0.08, 0.8, mat('#e8e4dc')); cDesk.position.set(CX, 0.74, -0.8); S.add(cDesk);
const cDeskLeg = box(1.5, 0.7, 0.05, mat('#9aa0aa')); cDeskLeg.position.set(CX, 0.37, -0.45); S.add(cDeskLeg);
const ITV = makeSuit({ old: true, glasses: true }); S.add(ITV);
const C_TSUMA = makeSuit({ woman: true, jacket: '#2e3442', hair: '#4a3020' }); S.add(C_TSUMA);
const seishain = label('正社員の面接', { w: 768, size: 100, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 1.15 }); seishain.position.set(CX - 0.3, 2.45, -2.2); S.add(seishain);

// ---------- D：家（x=180）：連絡帳・洗濯物 ----------
const DX = 180;
flat(12, 10, '#c8a878', DX, 0);
const dWall = box(12, 3.2, 0.2, mat('#efe8da')); dWall.position.set(DX, 1.6, -2.6); S.add(dWall);
const table = box(1.6, 0.74, 1.0, mat('#a8743a')); table.position.set(DX - 2, 0.37, -0.6); S.add(table);
const nbC = document.createElement('canvas'); nbC.width = 600; nbC.height = 420; { const g = nbC.getContext('2d'); g.fillStyle = '#fff6d8'; g.fillRect(0, 0, 600, 420); g.fillStyle = '#e07a3a'; g.fillRect(0, 0, 600, 90); g.fillStyle = '#fff'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('れんらくちょう', 300, 48); g.strokeStyle = '#c8b890'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(30, 150 + i * 56); g.lineTo(570, 150 + i * 56); g.stroke(); } g.fillStyle = '#555'; g.font = '700 34px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText('今日のおひるね：', 40, 130); g.fillText('おうちでのようす：', 40, 242); }
const nbT = new THREE.CanvasTexture(nbC); nbT.colorSpace = THREE.SRGBColorSpace;
const NOTE = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.49), new THREE.MeshBasicMaterial({ map: nbT })); NOTE.rotation.x = -Math.PI / 2; NOTE.position.set(DX - 2, 0.752, -0.5); S.add(NOTE);
const OTTO = makeMan({ shirt: '#4f6a8f', hair: '#2a2420' }); S.add(OTTO); const sweatO = makeSweat(); OTTO.userData.head.add(sweatO);
const D_TSUMA = makeWoman({ shirt: '#e9b8c8', hair: '#4a3020', pants: '#3a3f4e' }); S.add(D_TSUMA);
const hajimete = label('はじめて', { w: 512, size: 110, color: '#fff', bg: 'rgba(140,80,220,.95)', sx: 0.95 }); S.add(hajimete);
const rack = new THREE.Group(); { for (const x of [-1.1, 1.1]) { const p = box(0.06, 1.7, 0.06, mat('#c8ccd4')); p.position.set(x, 0.85, 0); rack.add(p); } const bar = box(2.3, 0.05, 0.05, mat('#c8ccd4')); bar.position.y = 1.68; rack.add(bar); const cols = ['#f4f4f2', '#7aa0d8', '#f2c14e', '#e98aa8', '#9fc7a8']; for (let i = 0; i < 5; i++) { const c = box(0.34, 0.5, 0.03, mat(cols[i])); c.position.set(-0.85 + i * 0.42, 1.38, 0); c.rotation.z = (i % 2 ? 1 : -1) * 0.12; rack.add(c); } } rack.position.set(DX + 1.4, 0, -1.4); S.add(rack);
const chigau = label('干し方ちがう', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(chigau);
const kenka = label('ムッ', { w: 384, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 0.6 }); S.add(kenka);
const tedori = label('妻の手取り ↑', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(tedori);
const jiyu = label('夫の自由時間 ↓', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(jiyu);
const KAJI = ['洗濯', '連絡帳', 'お迎え', '晩ごはん'].map(s => { const l = label(s, { w: 512, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.9 }); S.add(l); return l; });
const fuyoTag = label('扶養に入っていたのは…', { w: 1024, size: 92, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 2.2 }); S.add(fuyoTag);
// 見えない契約書（透ける紙）
const kC = document.createElement('canvas'); kC.width = 700; kC.height = 960; { const g = kC.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 0, 700, 960); g.strokeStyle = '#2a3a6a'; g.lineWidth = 10; g.strokeRect(24, 24, 652, 912); g.fillStyle = '#2a3a6a'; g.textAlign = 'center'; g.font = '900 84px "Noto Sans CJK JP", sans-serif'; g.fillText('契約書', 350, 140);
  g.font = '800 46px "Noto Sans CJK JP", sans-serif'; ['家のことは', 'ぜんぶ妻にあずける', '', '夫は仕事だけ'].forEach((s, i) => g.fillText(s, 350, 300 + i * 90)); g.fillStyle = '#d62a2a'; g.beginPath(); g.arc(520, 780, 70, 0, 7); g.lineWidth = 8; g.strokeStyle = '#d62a2a'; g.stroke(); g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.fillText('夫', 520, 798); }
const kT = new THREE.CanvasTexture(kC); kT.colorSpace = THREE.SRGBColorSpace;
const KEIYAKU = new THREE.Sprite(new THREE.SpriteMaterial({ map: kT, transparent: true, depthTest: false })); KEIYAKU.renderOrder = 7; KEIYAKU.scale.set(1.3, 1.3 * 960 / 700, 1); S.add(KEIYAKU);

// ---------- E：会社（x=240）：夕方6時のお迎え ----------
const EX = 240;
flat(14, 10, '#8a8a90', EX, 0);
const eWall = box(14, 3.2, 0.2, mat('#e6e2da')); eWall.position.set(EX, 1.6, -3.0); S.add(eWall);
const ISL = makeDeskIsland(3); ISL.position.set(EX, 0, -0.8); S.add(ISL);
const clockE = label('18:00', { w: 512, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 1.0 }); clockE.position.set(EX + 2.6, 2.5, -2.8); S.add(clockE);
const E_OTTO = makeSuit({ jacket: '#2e3442', tie: '#3a6ab2' }); S.add(E_OTTO);
const BOSS = makeSuit({ old: true, bald: true, jacket: '#3a3f4e' }); S.add(BOSS);
const WORKERS = [0, 1, 2].map(i => { const p = makeSuit({ jacket: ['#4a5060', '#5a4a3a', '#3a4a5a'][i], tie: '#c8423a' }); S.add(p); return p; });
const omukae = label('子どものお迎えなので', { w: 1024, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 2.1 }); S.add(omukae);
const okusan = label('え、奥さんは？', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(okusan);
const BAG = box(0.4, 0.3, 0.1, mat('#2a2018')); S.add(BAG);

const PEOPLE = [A_TSUMA, B_TSUMA, ...COWORK, ITV, C_TSUMA, OTTO, D_TSUMA, E_OTTO, BOSS, ...WORKERS];
const LABELS = [pon, umaru, imasara, hoken, hajimete, chigau, kenka, tedori, jiyu, ...KAJI, fuyoTag, omukae, okusan];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); KEIYAKU.visible = false; KEIYAKU.material.opacity = 1; sweatO.userData.set(0); BAG.visible = false;
  A_TSUMA.position.set(1.0, 0, 0.2); A_TSUMA.rotation.y = -0.4;
  B_TSUMA.position.set(BX, 0, -1.4); B_TSUMA.rotation.y = 0; COWORK.forEach((p, i) => { p.position.set(BX - 2.2 + i * 0.7, 0, 0.6); p.rotation.y = 0.5; });
  ITV.position.set(CX, 0, -1.5); poseSit(ITV); C_TSUMA.position.set(CX, 0, 0.2); C_TSUMA.rotation.y = Math.PI; poseSit(C_TSUMA);
  OTTO.position.set(DX - 2, 0, 0.2); OTTO.rotation.y = Math.PI; D_TSUMA.position.set(DX + 2.6, 0, -0.6); D_TSUMA.rotation.y = -0.6;
  const st = ISL.userData.seats; [E_OTTO, ...WORKERS].forEach((p, i) => { const s = st[i]; p.position.set(EX + s.x, 0, -0.8 + s.z); p.rotation.y = s.ry; poseSit(p); });
  BOSS.position.set(EX + 2.6, 0, 0.6); BOSS.rotation.y = -1.0;
  drawShift(1, 0); el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.45;
function shiftCam(u = 0) { look(lerp(0.9, 0.6, u), 1.8, lerp(5.4, 5.0, u), 0.15, 2.25, -1.6, 50); }
function shot0(t) { // 0秒＝サムネ：年末のパートのシフト表から、扶養内 の文字がポンと消える
  reset(); lift(0); A_TSUMA.userData.arms[1].rotation.set(-1.3, 0, 0.3); drawShift(t < TP ? 1 : clamp(1 - (t - TP) / 0.15), 0);
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.3)); el.flash.style.opacity = t < TP + 0.1 ? 0.35 : 0; say(pon, t, TP + 0.05, 0.0, 3.2, -1.8, 1.5); A_TSUMA.userData.head.rotation.x = -0.1; }
  shiftCam(ease(clamp(t / 3)));
  return S;
}
function regiCam(u = 0) { look(BX + lerp(0.6, 0.3, u), 1.9, lerp(3.4, 3.0, u), BX, 1.5, -1.2, 50); }
function sRegi(t) { // 扶養内パートの妻が、レジの前で叫ぶ。
  reset(); lift(120); B_TSUMA.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); regiCam(ease(clamp(t / 3)));
  return S;
}
function sImasara(t) { // 今更！？
  reset(); lift(120); B_TSUMA.userData.arms[0].rotation.set(0, 0, -2.6); B_TSUMA.userData.arms[1].rotation.set(0, 0, 2.6); B_TSUMA.userData.head.rotation.x = -0.2; B_TSUMA.position.y = Math.abs(Math.sin(t * 8)) * 0.06;
  say(imasara, t, 0.15, BX, 2.65, -1.2, 1.3); el.flash.style.opacity = t > 0.15 && t < 0.25 ? 0.3 : 0;
  regiCam(1);
  return S;
}
function sFuman(t) { // 正社員で共働きの妻たちの不満から。
  reset(); lift(120); COWORK.forEach((p, i) => { p.userData.arms[i].rotation.set(-0.6, 0, i ? -0.4 : 0.4); p.userData.head.rotation.y = 0.2; });
  look(BX - 1.2, 1.8, 4.2, BX - 1.6, 1.4, 0.2, 50);
  return S;
}
function sHoken(t) { // うちは2人とも保険料を払ってるのに。
  reset(); lift(120); COWORK.forEach((p, i) => { p.userData.arms[1].rotation.set(-1.2, 0, 0); });
  say(hoken, t, 0.3, BX - 1.6, 2.3, 0.6, 1.5);
  look(BX - 1.2, 1.8, 4.2, BX - 1.6, 1.4, 0.2, 50);
  return S;
}
function sShift(t) { // 12月。いつもは働き控えでスカスカのシフト表が、
  reset(); lift(80); drawShift(0, 0); A_TSUMA.visible = false;
  setHud('12月', '年末', 1); lift(200); look(0, 1.9, 3.8, 0, 1.75, -2.0, 50);
  return S;
}
function sUmaru(t, d) { // 全部埋まる。
  reset(); lift(80); drawShift(0, clamp(t / (d - 0.6))); A_TSUMA.visible = false;
  if (t > d - 0.8) say(umaru, t, d - 0.8, 0.0, 3.1, -1.8, 1.1);
  setHud('12月', '年末', 1); lift(200); look(0, 1.9, 3.8, 0, 1.75, -2.0, 50);
  return S;
}
function sMensetsu(t) { // 年明け。妻は正社員の面接へ。
  reset(); lift(150); ITV.userData.head.rotation.x = 0.1; C_TSUMA.userData.arms.forEach(a => a.rotation.set(-0.5, 0, 0));
  setHud('年明け', '1月', 1); look(CX + 1.8, 1.9, 2.6, CX, 1.1, -0.6, 50);
  return S;
}
function sRenraku(t) { // 夫は初めて、保育園の連絡帳を開く。
  reset(); lift(150); poseSit(OTTO); OTTO.position.z = 0.2; OTTO.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); OTTO.userData.head.rotation.x = 0.45; sweatO.userData.set(clamp((t - 0.6) / 0.4), t);
  if (t > 0.5) say(hajimete, t, 0.5, DX - 2.7, 2.0, -0.4, 0.95);
  setHud('年明け', '1月', 1); look(DX - 0.5, 2.1, -0.4, DX - 2.1, 0.85, -0.4, 50);
  return S;
}
function officeCam(u = 0) { look(EX + lerp(1.4, 1.0, u), 2.2, lerp(4.2, 3.8, u), EX + 0.6, 1.2, -0.6, 50); }
function sHaru(t) { // 春。夕方6時。夫が会社で
  reset(); lift(120); [E_OTTO, ...WORKERS].forEach(p => p.userData.arms.forEach(a => a.rotation.set(-1.2 + Math.sin(t * 9 + p.id) * 0.04, 0, 0)));
  setHud('春', '夕方6時', 1); officeCam(ease(clamp(t / 3)));
  return S;
}
function sTachi(t) { // 子どものお迎えなので と立ち上がる。
  reset(); lift(120); const k = easeOut(clamp(t / 0.5)); poseClear(E_OTTO); E_OTTO.position.y = 0; if (k < 1) poseSit(E_OTTO); E_OTTO.userData.arms[0].rotation.set(-0.3, 0, 0); BAG.visible = true; { const s = ISL.userData.seats[0]; BAG.position.set(EX + s.x + 0.35, 0.8, -0.8 + s.z); }
  say(omukae, t, 0.5, EX + 0.5, 2.4, -0.4, 1.7);
  setHud('春', '夕方6時', 1); officeCam(1);
  return S;
}
function sJoshi(t) { // 上司が目を丸くする。え、奥さんは？
  reset(); lift(120); poseClear(E_OTTO); E_OTTO.position.y = 0; BAG.visible = true; { const s = ISL.userData.seats[0]; BAG.position.set(EX + s.x + 0.35, 0.8, -0.8 + s.z); }
  BOSS.userData.head.rotation.x = -0.1; BOSS.userData.arms[1].rotation.set(-1.3, 0, 0.3); BOSS.rotation.x = -0.1;
  say(okusan, t, 0.6, EX + 1.7, 2.5, 0.4, 1.25);
  look(EX + 3.6, 1.9, 3.6, EX + 1.6, 1.4, 0.0, 50);
  return S;
}
function homeCam() { look(DX + 1.6, 2.0, 4.6, DX + 1.4, 1.3, -1.0, 50); }
function sKenka(t) { // 家では、洗濯物の干し方で夫婦げんか。
  reset(); lift(120); OTTO.position.set(DX + 0.6, 0, -0.6); OTTO.rotation.y = 0.6; OTTO.userData.arms[1].rotation.set(-1.4, 0, 0); D_TSUMA.position.set(DX + 2.4, 0, -0.5); D_TSUMA.rotation.y = -0.7; D_TSUMA.userData.arms[1].rotation.set(-1.4, 0, -0.2);
  say(chigau, t, 0.5, DX + 1.9, 2.45, -0.5, 1.1); if (t > 1.3) say(kenka, t, 1.3, DX + 0.5, 2.3, -0.6, 0.6);
  homeCam();
  return S;
}
function sTedori(t) { // 妻の手取りは増え、夫の自由時間は減る。
  reset(); lift(120); OTTO.position.set(DX + 0.6, 0, -0.6); OTTO.rotation.y = 0.2; OTTO.rotation.x = 0.15; OTTO.userData.head.rotation.x = 0.3; D_TSUMA.position.set(DX + 2.4, 0, -0.5); D_TSUMA.rotation.y = -0.3; D_TSUMA.userData.head.rotation.x = -0.1;
  say(tedori, t, 0.3, DX + 2.0, 2.55, -0.5, 1.1); say(jiyu, t, 1.3, DX + 0.9, 2.2, -0.6, 1.15);
  homeCam();
  return S;
}
function sShiru(t) { // 夫は知る。扶養に入っていたのは、
  reset(); lift(120); OTTO.position.set(DX + 0.6, 0, -0.2); OTTO.rotation.y = 0.0; OTTO.userData.head.rotation.x = 0.1; D_TSUMA.visible = false;
  say(fuyoTag, t, 0.4, DX + 0.75, 2.3, -0.2, 1.3);
  look(DX + 0.9, 1.8, 3.4, DX + 0.6, 1.5, -0.2, 46);
  return S;
}
function sKaji(t, d) { // 妻ではなく自分の家事だった。
  reset(); lift(120); OTTO.position.set(DX + 0.6, 0, -0.2); OTTO.rotation.y = 0.0; OTTO.userData.head.rotation.x = 0.1; sweatO.userData.set(1, t); D_TSUMA.visible = false;
  KAJI.forEach((l, i) => { const a = i / 4 * Math.PI * 2 + t * 0.6; say(l, t, 0.2 + i * 0.3, DX + 0.75 + Math.cos(a) * 0.75, 1.6 + Math.sin(a) * 0.8, 0.0, 0.7); });
  look(DX + 0.9, 1.8, 4.4, DX + 0.6, 1.5, -0.2, 46);
  return S;
}
function sKekka(t, d) { // 結果：扶養が消えて、一番働き方が変わったのは、
  reset(); lift(120); poseClear(E_OTTO); E_OTTO.position.y = 0; BAG.visible = true; { const s = ISL.userData.seats[0]; E_OTTO.position.set(EX + s.x + lerp(0, 2.0, ease(clamp(t / 4))), 0, -0.8 + s.z + 0.4); E_OTTO.rotation.y = Math.PI / 2; const ph = t * 6; E_OTTO.userData.legs[0].rotation.x = Math.sin(ph) * 0.4; E_OTTO.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4; BAG.position.set(E_OTTO.position.x, 0.75, E_OTTO.position.z + 0.3); }
  setHud('夕方6時', '退社', 1); const u = ease(clamp(t / d)); look(EX + lerp(1.4, 2.0, u), 2.3, lerp(4.4, 5.2, u), EX + 0.8, 1.2, -0.4, 50);
  return S;
}
function sKekka2(t, d) { // 妻ではなく夫だった。
  reset(); lift(120); OTTO.position.set(DX + 0.6, 0, -0.6); OTTO.rotation.y = 0.4; OTTO.userData.arms.forEach(a => a.rotation.set(-1.5, 0, 0)); D_TSUMA.position.set(CX + 1000, 0, 0);
  look(DX + 1.4, 1.9, 3.2, DX + 1.0, 1.3, -1.0, 50);
  return S;
}
function sKeiyaku(t, d) { // 扶養は、夫が家のことを妻に預けるための、
  reset(); lift(120); OTTO.position.set(DX + 0.2, 0, -0.2); OTTO.rotation.y = 0.3; D_TSUMA.position.set(DX + 1.4, 0, -0.4); D_TSUMA.rotation.y = -0.3;
  KEIYAKU.visible = true; KEIYAKU.position.set(DX + 0.8, 2.25, 0.2); const k = easeOut(clamp((t - 0.2) / 0.4)); KEIYAKU.scale.set(1.3 * k, 1.3 * 960 / 700 * k, 1);
  look(DX + 0.9, 1.9, 4.4, DX + 0.8, 1.6, -0.2, 50);
  return S;
}
function sKamo(t, d) { // 見えない契約書だったのかもしれない。
  reset(); lift(120); OTTO.position.set(DX + 0.2, 0, -0.2); OTTO.rotation.y = 0.3; D_TSUMA.position.set(DX + 1.4, 0, -0.4); D_TSUMA.rotation.y = -0.3;
  KEIYAKU.visible = true; KEIYAKU.position.set(DX + 0.8, 2.25 + t * 0.1, 0.2); KEIYAKU.scale.set(1.3, 1.3 * 960 / 700, 1); KEIYAKU.material.opacity = clamp(1 - t / (d * 0.9)) * 0.9 + 0.1;
  const u = ease(clamp(t / d)); look(DX + 0.9, 1.9, lerp(4.4, 5.2, u), DX + 0.8, 1.6, -0.2, 50);
  return S;
}
function sAsk(t) { // 扶養内パート、続けたい？やめたい？（冒頭と同じ構図。シフト表は扶養内の文字が消えたまま）
  reset(); lift(0); drawShift(0, 1); A_TSUMA.userData.arms[1].rotation.set(-1.3, 0, 0.3); shiftCam(0);
  return S;
}

const NARR = { '扶養内': 'ふようない', '扶養': 'ふよう', '今更': 'いまさら', '共働き': 'ともばたらき', '2人': 'ふたり', '保険料': 'ほけんりょう', '12月': 'じゅうにがつ', '働き控え': 'はたらきびかえ', '年明け': 'としあけ', '連絡帳': 'れんらくちょう', '夕方6時': 'ゆうがたろくじ', '洗濯物': 'せんたくもの', '干し方': 'ほしかた', '手取り': 'てどり', '結果：': '結果、', '契約書': 'けいやくしょ', '奥さん': 'おくさん', '一番': 'いちばん' };
const P = planTimes([
  ['扶養内パートの妻が、<br>レジの前で叫ぶ。', sRegi],
  ['今更！？', sImasara],
  ['正社員で共働きの<br>妻たちの不満から。', sFuman],
  ['うちは2人とも<br>保険料を払ってるのに。', sHoken],
  ['12月。いつもは働き控えで<br>スカスカのシフト表が、', sShift],
  ['全部埋まる。', sUmaru],
  ['年明け。妻は正社員の面接へ。', sMensetsu],
  ['夫は初めて、<br>保育園の連絡帳を開く。', sRenraku],
  ['春。夕方6時。夫が会社で', sHaru],
  ['子どものお迎えなので<br>と立ち上がる。', sTachi],
  ['上司が目を丸くする。<br>え、奥さんは？', sJoshi],
  ['家では、洗濯物の干し方で<br>夫婦げんか。', sKenka],
  ['妻の手取りは増え、<br>夫の自由時間は減る。', sTedori],
  ['夫は知る。<br>扶養に入っていたのは、', sShiru],
  ['妻ではなく<br>自分の家事だった。', sKaji],
  ['結果：扶養が消えて、一番<br>働き方が変わったのは、', sKekka],
  ['妻ではなく夫だった。', sKekka2],
  ['扶養は、夫が家のことを<br>妻に預けるための、', sKeiyaku],
  ['見えない契約書<br>だったのかもしれない。', sKamo],
  ['扶養内パート、<br>続けたい？やめたい？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0664',
    v2: true,
    tt: 'main',
    hookLine: '年末のパートのシフト表から、扶養内の文字がポンと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも夫の扶養が消えたら？',
    titleHtml: 'もしも夫の扶養が<br>消えたら？',
    mood: 'tension', seed: 664, hits: [TP, P.at(15), P.at(17)], risers: [P.at(12)], impacts: [P.at(1, 0.15), P.at(5, 1.2), P.at(10, 0.6), P.at(14, 0.2), P.at(16, 0.1)],
    sfx: [[TP, 'poof'], [P.at(1, 0.15), 'alarm'], [P.at(5, 0.2), 'meter', 0.3], [P.at(7, 0.5), 'bubble'], [P.at(9, 0.5), 'whoosh'], [P.at(10, 0.6), 'buzz'], [P.at(11, 1.3), 'buzz'], [P.at(14, 0.2), 'bubble'], [P.at(17, 0.2), 'whoosh']],
    narr: NARR,
    ask: '扶養内パート、続けたい？やめたい？',
    caption: 'もしも夫の扶養が消えたら？\n\n扶養内パートの妻が、レジの前で叫ぶ。今更！？\n正社員で共働きの妻たちの不満から。うちは2人とも保険料を払ってるのに。\n12月。いつもは働き控えでスカスカのシフト表が、全部埋まる。\n年明け。妻は正社員の面接へ。夫は初めて、保育園の連絡帳を開く。\n春。夕方6時。夫が会社で子どものお迎えなので、と立ち上がる。上司が目を丸くする。え、奥さんは？\n家では、洗濯物の干し方で夫婦げんか。\n妻の手取りは増え、夫の自由時間は減る。\n夫は知る。扶養に入っていたのは、妻ではなく自分の家事だった。\n\n結果：扶養が消えて、一番働き方が変わったのは、妻ではなく夫だった。\n扶養は、夫が家のことを妻に預けるための、見えない契約書だったのかもしれない。\n\n扶養内パート、続けたい？やめたい？ コメントで教えて。\n\n※風刺ネタです。扶養が消えるのは、もしもの設定です。実際の制度とは関係ありません。登場する人物・店・会社は架空です',
    hashtags: ['もしもラボ', 'もしも', '扶養', '共働き', 'パート'],
    endStats: [['消えたもの', '夫の扶養', 'もしもの設定'], ['一番働き方が変わったのは', '夫', 'もしもの結果'], ['扶養の正体', '見えない契約書', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
