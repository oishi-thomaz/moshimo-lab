import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setHud, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makeDishes } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも残業代が、仕事を振った上司の給料から引かれたら？（皮肉回・台本 S87・図星／大人の本音）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：定時前の 今日中にお願い（はてな匿名ダイアリー・なんJ・ガルちゃんで繰り返し燃える）
// 数字は使わない（30枚・3枚・17時55分は筋の中の数）。実在の会社・ソフトの画面は出さない（表計算は色のマス目だけ）。お札は架空の色
// 上司叩きから入り、後半で 生活残業の若手 に軽く返す両叩き。三段は 17時55分 引っ込める→18時 電気が消える→1週間後 自分で開く。言い換えは 会社の食べ放題

const { S, flat, room, hemi } = makeSet({ bg: '#c8d0dc', ground: '#8a8f99' });
const KACHO = makeSuit({ old: true, bald: true, jacket: '#2a2e38', glasses: true }); S.add(KACHO);
const sweatK = makeSweat(); KACHO.userData.head.add(sweatK);
const PALE = box(0.41, 0.2, 0.39, new THREE.MeshBasicMaterial({ color: '#8fb0d8', transparent: true, opacity: 0.55 })); PALE.position.y = 0.33; KACHO.userData.head.add(PALE); // 青ざめる
const BUKA = [0, 1, 2].map(i => { const p = makeSuit({ woman: i === 1, jacket: ['#3a4256', '#5a4a6a', '#3a5a6a'][i], tie: ['#3a6ab2', undefined, '#5a8a4a'][i], hair: i === 1 ? '#3a2620' : undefined }); S.add(p); return p; });
const WAKATE = BUKA[2];

// ---------- A：2枚の給与明細（原点） ----------
const roomA = room({ x: 0, w: 9, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const SLIP_K = makeDoc({ title: '課長の給与明細', rows: ['基本給', '残業代', '差し引き'], head: '#2a2e38', w: 0.92, h: 1.1 }); SLIP_K.position.set(-0.55, 1.85, -1.6); S.add(SLIP_K);
const SLIP_B = makeDoc({ title: '部下の給与明細', rows: ['基本給', '残業代', '差し引き'], head: '#3a6ab2', w: 0.92, h: 1.1 }); SLIP_B.position.set(0.55, 1.85, -1.6); S.add(SLIP_B);
const BILLS = []; { for (let i = 0; i < 8; i++) { const b = box(0.3, 0.15, 0.01, mat(['#8ac08a', '#c8b07a'][i % 2])); S.add(b); BILLS.push(b); } }
function bills(t, t0, dur = 0.8) { BILLS.forEach((b, i) => { const k = clamp((t - t0 - i * 0.06) / dur); b.visible = k > 0 && k < 1; const e = easeOut(k); b.position.set(lerp(-0.55, 0.55, e), 1.85 + Math.sin(k * Math.PI) * 0.55 + (i % 3 - 1) * 0.12, -1.5 + (i % 2) * 0.05); b.rotation.z = k * 6 + i; }); }
const sparkA = makeSparkles(120, 0.1, 0xfff2c0); S.add(sparkA.points); sparkA.init([[0.55, 1.85, -1.5]], 0.5, 0.8);
const MINUS = label('−残業代', { w: 512, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.6 }); S.add(MINUS);
const aozameru = label('青ざめる', { w: 512, size: 110, color: '#fff', bg: 'rgba(58,127,208,.97)', sx: 0.7 }); S.add(aozameru);

// ---------- B：オフィス（x=60） ----------
const BX = 60;
const roomB = room({ x: BX, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(BX, 0, -0.6); S.add(ISL);
const BOSS_DESK = makeTable({ w: 1.6, d: 0.8, h: TABLE_Y, color: '#8a6a4c' }); BOSS_DESK.position.set(BX, 0, -2.6); S.add(BOSS_DESK);
const CEIL = [0, 1, 2].map(i => { const l = box(1.6, 0.05, 0.3, new THREE.MeshBasicMaterial({ color: '#ffffff' })); l.position.set(BX - 2.5 + i * 2.5, 3.1, -0.8); S.add(l); return l; });
const CLOCK = label('17:55', { w: 512, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.75 }); S.add(CLOCK);
const SHIRYO = makeDoc({ title: '資料 今日中', rows: ['', ''], head: '#c8242c', w: 0.45, h: 0.55 }); S.add(SHIRYO);
const sotto = label('そっと 引っ込める', { w: 900, size: 100, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 1.3 }); S.add(sotto);
const fuman = label('頼む人は 残らない', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(fuman);
const MONS = []; ISL.userData.monitors.forEach(m => MONS.push(m.userData.glass));
const PC = new THREE.Group(); { const sc = box(0.7, 0.45, 0.04, mat('#22252c')); sc.position.y = 0.3; PC.add(sc); const c = document.createElement('canvas'); c.width = 280; c.height = 180; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 280, 180); g.fillStyle = '#3a8a5a'; g.fillRect(0, 0, 280, 22); g.strokeStyle = '#9aa0aa'; g.lineWidth = 2; for (let x = 0; x <= 280; x += 40) { g.beginPath(); g.moveTo(x, 22); g.lineTo(x, 180); g.stroke(); } for (let y = 22; y <= 180; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(280, y); g.stroke(); } const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.4), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 0.3, 0.025); PC.add(scr); } S.add(PC);
const jibun = label('自分で 表計算', { w: 768, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.1 }); S.add(jibun);
const STACK = []; for (let i = 0; i < 30; i++) { const p = box(0.42, 0.012, 0.3, mat(i % 5 === 0 ? '#e8e4dc' : '#f8f6f0')); S.add(p); STACK.push(p); }
const MAISU = label('30枚', { w: 512, size: 130, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.75 }); S.add(MAISU);
const hanbun = label('半分は 要らなかった', { w: 1024, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); S.add(hanbun);

// ---------- C：若手の給料日（オフィスを使う） ----------
const SLIP_W = makeDoc({ title: '若手の給与明細', rows: ['基本給', '残業代', '家賃'], head: '#5a8a4a', w: 0.9, h: 1.1 }); S.add(SLIP_W);
const zero = label('残業代 ほぼ0円', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.2 }); S.add(zero);
const yachin = label('家賃の分を 残業で', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.3 }); S.add(yachin);
const sweatW = makeSweat(); WAKATE.userData.head.add(sweatW);
const kieta = label('消えたのは 要らない仕事', { w: 1100, size: 92, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.6 }); S.add(kieta);

// ---------- D：食べ放題（x=120） ----------
const DX = 120;
const roomD = room({ x: DX, w: 8, d: 6, h: 3.2, wall: '#efe6d6', floor: '#b48a5e' });
const BUF = makeTable({ w: 2.6, d: 0.8, h: 0.85, color: '#e8e2d4' }); BUF.position.set(DX, 0, -1.6); S.add(BUF);
const TRAYS = []; for (let i = 0; i < 4; i++) { const tr = makeDoc({ title: ['資料', '会議', '報告', '急ぎ'][i], rows: [''], head: ['#c8242c', '#3a6ab2', '#5a8a4a', '#d87a3a'][i], w: 0.5, h: 0.42 }); tr.rotation.x = -Math.PI / 2 + 0.5; tr.position.set(DX - 0.95 + i * 0.63, 0.98, -1.6); S.add(tr); TRAYS.push(tr); }
const tabehoudai = label('残業 食べ放題', { w: 900, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.5 }); tabehoudai.position.set(DX, 2.35, -1.9); S.add(tabehoudai);
const tadaLab = label('上司の財布は 痛まない', { w: 1024, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.5 }); S.add(tadaLab);

const PEOPLE = [KACHO, ...BUKA];
const LABELS = [MINUS, aozameru, CLOCK, sotto, fuman, jibun, MAISU, hanbun, zero, yachin, kieta, tadaLab];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatK.userData.set(0); sweatW.userData.set(0); PALE.visible = false;
  hemi.intensity = 1.3; CEIL.forEach(c => c.material.color.set('#ffffff')); MONS.forEach(m => m.material.color.set('#6aa8e8'));
  BILLS.forEach(b => b.visible = false); SHIRYO.visible = false; SLIP_K.position.set(-0.55, 1.85, -1.6); SLIP_K.scale.setScalar(1); SLIP_B.visible = true; PC.visible = false; STACK.forEach(p => p.visible = false); SLIP_W.visible = false;
  SLIP_K.userData.fill(0, ''); SLIP_K.userData.fill(1, ''); SLIP_K.userData.fill(2, ''); SLIP_B.userData.fill(0, ''); SLIP_B.userData.fill(1, ''); SLIP_B.userData.fill(2, '');
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function officeSet() {
  const st = ISL.userData.seats; BUKA.forEach((p, i) => { const s = st[[0, 2, 1][i]]; p.visible = true; p.position.set(BX + s.x, 0, -0.6 + s.z); p.rotation.y = s.ry; poseSit(p); p.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); });
  KACHO.visible = true; KACHO.position.set(BX, 0, -3.25); poseSit(KACHO);
}
const TP = 0.3;
function slipCam(u = 0) { look(lerp(0.05, 0.0, u), lerp(2.25, 2.2, u), lerp(2.75, 2.55, u), 0, lerp(2.2, 2.15, u), -1.6, 50); }
function shot0(t) { // 0秒＝サムネ：上司の給与明細から、お金が部下の明細へビュンと飛んでいく
  reset(); lift(0); SLIP_K.userData.fill(1, '−残業代'); SLIP_B.userData.fill(1, t > TP + 0.3 ? '+残業代' : '');
  bills(t, -0.25, 0.7);
  if (t > TP + 0.5) { sparkA.set(clamp((t - TP - 0.5) / 1.0)); el.flash.style.opacity = t < TP + 0.6 ? 0.2 : 0; }
  slipCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sAozame(t, d) { // 定時5分前に資料を頼んだ課長が、明細を見て青ざめる
  reset(); lift(120); KACHO.visible = true; KACHO.position.set(0, 0, -0.7); KACHO.userData.arms.forEach(a => a.rotation.set(-1.3, 0, 0)); SLIP_K.userData.fill(1, '−残業代');
  SLIP_K.position.set(0, 1.45, -0.15); SLIP_K.scale.setScalar(0.6); SLIP_B.visible = false;
  if (t > d * 0.4) { PALE.visible = true; sweatK.userData.set(1, t); say(aozameru, t, d * 0.4, 0.55, 2.05, -0.7, 0.6); }
  look(0.6, 1.75, 1.6, 0.0, 1.55, -0.6, 50);
  return S;
}
function sFuman(t, d) { // 部下たちの不満から。定時前に頼む人は、自分では残らない
  reset(); lift(120); officeSet(); KACHO.userData.head.rotation.x = -0.1;
  if (t > d * 0.35) say(fuman, t, d * 0.35, BX, 2.25, -1.4, 1.2);
  look(BX + 0.3, 2.4, 2.6, BX, 1.2, -1.6, 50);
  return S;
}
function sHikkomeru(t, d) { // 17時55分。課長が、頼みかけた資料をそっと引っ込める
  reset(); lift(120); officeSet(); const st = ISL.userData.seats; KACHO.position.set(BX + st[0].x + 0.5, 0, -0.6 + st[0].z - 0.4); KACHO.rotation.y = -0.5; KACHO.position.y = 0; KACHO.userData.legs.forEach(l => l.rotation.x = 0);
  const k = clamp((t - d * 0.45) / 0.6); KACHO.userData.arms[1].rotation.set(lerp(-1.4, -0.4, k), 0, 0);
  KACHO.updateMatrixWorld(); const v = new THREE.Vector3(0.32, lerp(1.1, 0.9, k), lerp(0.62, 0.25, k)); KACHO.localToWorld(v); SHIRYO.visible = true; SHIRYO.position.copy(v); SHIRYO.rotation.y = KACHO.rotation.y;
  say(CLOCK, t, 0.2, KACHO.position.x - 1.0, 1.9, KACHO.position.z - 0.6, 0.55); if (t > d * 0.55) say(sotto, t, d * 0.55, KACHO.position.x - 0.3, 2.2, KACHO.position.z, 1.0);
  setHud('上司の財布から', '17:55', 1);
  look(KACHO.position.x - 0.9, 1.95, KACHO.position.z + 3.6, KACHO.position.x - 0.4, 1.3, KACHO.position.z - 0.4, 50);
  return S;
}
function sDenki(t, d) { // 18時。フロアの電気が、一斉に消える
  reset(); lift(120); const k = clamp((t - d * 0.3) / 0.15); hemi.intensity = lerp(1.3, 0.35, k); CEIL.forEach(c => c.material.color.set(k > 0.5 ? '#3a3e48' : '#ffffff')); MONS.forEach(m => m.material.color.set(k > 0.5 ? '#1a1c22' : '#6aa8e8'));
  CLOCK.visible = true; CLOCK.userData.set('18:00'); CLOCK.position.set(BX - 0.9, 2.2, -2.9); CLOCK.userData.size(0.65);
  setHud('上司の財布から', '18:00', 1);
  look(BX + 0.4, 2.6, 3.4, BX, 1.3, -1.4, 50);
  return S;
}
function sJibun(t, d) { // 1週間後。課長が自分で、表計算のソフトを開いている
  reset(); lift(120); KACHO.visible = true; KACHO.position.set(BX, 0, -3.25); poseSit(KACHO); KACHO.userData.arms.forEach(a => a.rotation.set(-1.1, 0, 0)); KACHO.userData.head.rotation.x = 0.1;
  PC.visible = true; PC.position.set(BX, TABLE_Y + 0.02, -2.4); PC.rotation.y = Math.PI;
  if (t > d * 0.4) say(jibun, t, d * 0.4, BX, 2.1, -3.0, 1.0);
  setHud('上司の財布から', '1週間後', 1);
  look(BX + 1.0, 1.75, -1.0, BX, 1.25, -2.9, 50);
  return S;
}
function stack(n, x, z) { STACK.forEach((p, i) => { p.visible = i < n; p.position.set(x, TABLE_Y + 0.04 + i * 0.013, z); p.rotation.y = (i % 3) * 0.03; }); }
function sHanbun(t, d) { // 課長は気づく。頼んでいた仕事の半分は、要らなかった
  reset(); lift(120); KACHO.visible = true; KACHO.position.set(BX, 0, -3.25); poseSit(KACHO); KACHO.userData.head.rotation.x = 0.3;
  const n = t < d * 0.4 ? 30 : Math.round(lerp(30, 15, clamp((t - d * 0.4) / 0.8))); stack(n, BX + 0.35, -2.5);
  if (t > d * 0.5) say(hanbun, t, d * 0.5, BX, 2.05, -2.9, 1.3);
  look(BX + 0.9, 1.65, -1.2, BX + 0.2, 1.1, -2.7, 50);
  return S;
}
function sMaisu(t, d) { // 会議の資料が、30枚から3枚になる
  reset(); lift(120); const n = Math.round(lerp(30, 3, easeOut(clamp((t - 0.6) / 1.2)))); stack(n, BX + 0.35, -2.5);
  MAISU.visible = true; MAISU.userData.set(n + '枚'); MAISU.position.set(BX + 0.35, 1.15, -2.5); MAISU.userData.size(0.45);
  look(BX + 0.9, 1.55, -0.9, BX + 0.35, 0.95, -2.5, 50);
  return S;
}
function wakateCam(u = 0) { const st = ISL.userData.seats[1]; const x = BX + st.x, z = -0.6 + st.z; look(x + lerp(0.7, 0.5, u), 1.85, z + lerp(2.8, 2.5, u), x, 1.25, z, 50); }
function wakateFace() { const st = ISL.userData.seats[1]; WAKATE.visible = true; WAKATE.position.set(BX + st.x, 0, -0.6 + st.z); WAKATE.rotation.y = 0; poseSit(WAKATE); WAKATE.userData.arms.forEach(a => a.rotation.set(-1.3, 0, 0)); return st; }
function sIppou(t, d) { // 一方、残業代で稼いでいた若手
  reset(); lift(120); hemi.intensity = 0.9; const st = wakateFace(); WAKATE.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0));
  wakateCam(ease(clamp(t / d)));
  return S;
}
function slipW() { SLIP_W.visible = true; WAKATE.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.2, 0.62); WAKATE.localToWorld(v); SLIP_W.position.copy(v); SLIP_W.scale.setScalar(0.5); SLIP_W.rotation.set(-0.3, 0, 0); }
function sKyuryo(t, d) { // 給料日。明細の残業代が、ほぼ0円
  reset(); lift(120); wakateFace(); SLIP_W.userData.fill(1, '0円'); SLIP_W.userData.fill(2, ''); slipW();
  if (t > d * 0.45) { say(zero, t, d * 0.45, WAKATE.position.x, 1.9, WAKATE.position.z, 0.9); sweatW.userData.set(1, t); }
  setHud('若手', '給料日', 1);
  wakateCam(1);
  return S;
}
function sYachin(t, d) { // 若手は気づく。家賃の分を、残業で埋めていた
  reset(); lift(120); wakateFace(); SLIP_W.userData.fill(1, '0円'); SLIP_W.userData.fill(2, '足りない'); slipW(); sweatW.userData.set(1, t); WAKATE.userData.head.rotation.x = 0.3;
  if (t > d * 0.4) say(yachin, t, d * 0.4, WAKATE.position.x, 2.1, WAKATE.position.z, 1.1);
  wakateCam(1);
  return S;
}
function sKekka(t, d) { // 結果：残業代が上司の財布から出ることになって、消えたのは残業ではなく、要らない仕事だった
  reset(); lift(120); hemi.intensity = 0.35; CEIL.forEach(c => c.material.color.set('#3a3e48')); MONS.forEach(m => m.material.color.set('#1a1c22')); stack(3, BX + 0.35, -2.5);
  CLOCK.visible = true; CLOCK.userData.set('18:00'); CLOCK.position.set(BX - 0.9, 2.2, -2.9); CLOCK.userData.size(0.65);
  if (t > d * 0.55) say(kieta, t, d * 0.55, BX, 1.95, -1.4, 1.4);
  const u = ease(clamp(t / d)); look(BX + lerp(0.4, 0.8, u), lerp(2.6, 3.0, u), lerp(3.4, 4.4, u), BX, 1.3, -1.4, 50);
  return S;
}
function sTabehoudai(t, d) { // 残業は、上司が自分の財布を痛めずに頼める、会社の食べ放題だったのかもしれない
  reset(); lift(120); KACHO.visible = true; KACHO.position.set(DX - 0.6, 0, -0.7); KACHO.rotation.y = Math.PI * 0.9; KACHO.userData.arms[1].rotation.set(-1.3, 0, 0.2);
  tabehoudai.visible = t > d * 0.45; if (t > d * 0.45) pop(tabehoudai, t, d * 0.45, 0.25, 1.4);
  if (t < d * 0.45) say(tadaLab, t, 0.3, DX, 2.35, -1.9, 1.4);
  look(DX + 0.8, 1.9, 2.2, DX, 1.4, -1.5, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); SLIP_K.userData.fill(1, '−残業代'); SLIP_B.userData.fill(1, '+残業代'); slipCam(0); return S; }

const NARR = { '定時5分前': 'ていじごふんまえ', '資料': 'しりょう', '課長': 'かちょう', '明細': 'めいさい', '青ざめる': 'あおざめる', '部下': 'ぶか', '不満': 'ふまん', '定時前': 'ていじまえ', '自分': 'じぶん', '17時55分': 'じゅうしちじごじゅうごふん', '18時': 'じゅうはちじ', '電気': 'でんき', '一斉に': 'いっせいに', '1週間後': 'いっしゅうかんご', '表計算': 'ひょうけいさん', '半分': 'はんぶん', '要らなかった': 'いらなかった', '要らない': 'いらない', '会議': 'かいぎ', '30枚': 'さんじゅうまい', '3枚': 'さんまい', '一方': 'いっぽう', '残業代': 'ざんぎょうだい', '若手': 'わかて', '給料日': 'きゅうりょうび', '0円': 'ぜろえん', '家賃': 'やちん', '結果：': '結果、', '財布': 'さいふ', '食べ放題': 'たべほうだい', '上司': 'じょうし' };
const P = planTimes([
  ['定時5分前に資料を頼んだ課長が、', (t, d) => sAozame(t, 2 * d)],
  ['明細を見て青ざめる。', (t, d) => sAozame(t + d, 2 * d)],
  ['部下たちの不満から。定時前に<br>頼む人は、自分では残らない。', sFuman],
  ['17時55分。課長が、頼みかけた<br>資料をそっと引っ込める。', sHikkomeru],
  ['18時。フロアの電気が、<br>一斉に消える。', sDenki],
  ['1週間後。課長が自分で、<br>表計算のソフトを開いている。', sJibun],
  ['課長は気づく。頼んでいた<br>仕事の半分は、要らなかった。', sHanbun],
  ['会議の資料が、<br>30枚から3枚になる。', sMaisu],
  ['一方、残業代で<br>稼いでいた若手。', sIppou],
  ['給料日。明細の残業代が、<br>ほぼ0円。', sKyuryo],
  ['若手は気づく。家賃の分を、<br>残業で埋めていた。', sYachin],
  ['結果：残業代が上司の<br>財布から出ることになって、', (t, d) => sKekka(t, 2 * d)],
  ['消えたのは残業ではなく、<br>要らない仕事だった。', (t, d) => sKekka(t + d, 2 * d)],
  ['残業は、上司が自分の財布を<br>痛めずに頼める、', (t, d) => sTabehoudai(t, 2 * d)],
  ['会社の食べ放題<br>だったのかもしれない。', (t, d) => sTabehoudai(t + d, 2 * d)],
  ['定時前に仕事を振る上司、<br>いる？', sAsk],
], { shot0, endCard, start: 3.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0688',
    v2: true,
    tt: 'main',
    hookLine: '上司の給与明細から、お金が部下の明細へビュンと飛んでいく。',
    series: '大人の本音',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも残業代が、仕事を振った上司の給料から引かれたら？',
    titleHtml: 'もしも残業代が、<br>仕事を振った<br>上司の給料から<br>引かれたら？',
    mood: 'tension', seed: 688, hits: [TP + 0.5, P.at(11), P.at(14)], risers: [P.at(8)], impacts: [P.at(4, 0.6), P.at(7, 1.2), P.at(9, 1.2)],
    sfx: [[0.1, 'whoosh'], [TP + 0.5, 'poof'], [P.at(1, 0.6), 'meter', 0.3], [P.at(3, 0.3), 'alarm'], [P.at(4, 0.6), 'poof'], [P.at(10, 0.5), 'meter', 0.3]],
    narr: NARR,
    ask: '定時前に仕事を振る上司、いる？',
    caption: 'もしも残業代が、仕事を振った上司の給料から引かれたら？\n\n定時5分前に資料を頼んだ課長が、明細を見て青ざめる。\n部下たちの不満から。定時前に頼む人は、自分では残らない。\n17時55分。課長が、頼みかけた資料をそっと引っ込める。\n18時。フロアの電気が、一斉に消える。\n1週間後。課長が自分で、表計算のソフトを開いている。\n課長は気づく。頼んでいた仕事の半分は、要らなかった。\n会議の資料が、30枚から3枚になる。\n一方、残業代で稼いでいた若手。\n給料日。明細の残業代が、ほぼ0円。\n若手は気づく。家賃の分を、残業で埋めていた。\n\n結果：残業代が上司の財布から出ることになって、消えたのは残業ではなく、要らない仕事だった。\n残業は、上司が自分の財布を痛めずに頼める、会社の食べ放題だったのかもしれない。\n\n定時前に仕事を振る上司、いる？ コメントで教えて。\n\n※風刺ネタです。残業代が上司の給料から引かれるのは、もしもの設定です。登場する人物・会社は架空です',
    hashtags: ['もしもラボ', 'もしも', '残業', '上司', '会社あるある'],
    endStats: [['残業代を払うのは', '仕事を振った上司', 'もしもの設定'], ['消えたのは', '要らない仕事', 'もしもの結果'], ['残業の正体', '会社の食べ放題', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
