import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #080 グランメゾン東京（ドラマ・日本・2019年。Prime Video・U-NEXT で見放題（Netflix も）、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/guranmezondong-jing で2026/11/13確認（Filmarks の動画配信欄も Prime Video・U-NEXT・Netflix 見放題）。
//   Filmarks 4.2・レビュー44,048件 filmarks.com/dramas/6625/9501）
// 確かめた事実（ja.wikipedia.org/wiki/グランメゾン東京。2026/11/13）：
//   ・主人公はパリの三つ星店で修業した日本人シェフ。独立した自分の店で二つ星を獲得するが、首脳会談の昼食会で出した料理に
//     アレルギー食材が混入した騒ぎで、店も名声も信用もすべてを失う
//   ・それから3年後、借金取りに追われるほど落ちぶれていた主人公は、三つ星店の面接に落ちた女性シェフと共に、
//     東京で新しいレストランを開き、三つ星獲得を目指して動き出す
//   ・TBS系 日曜劇場、2019年10月20日から12月29日まで放送。2024年12月30日にパリを舞台とする映画版が公開
// 構成（ヒント6段）：1 大切な食事会の一皿が、すべてを壊した → 2 主人公は店も名声も失った料理人、借金取りに追われる
//   → 3 湯気と火の厨房、一皿のために何度も作り直す → 4 面接に落ちた女性シェフと手を組み新しい店、目標は星3つ
//   → 5 2019年の日本のドラマ・日曜劇場、2024年に映画に → 6 決め手：東京で開くフランス料理店、店の名前がタイトル
// 混入の真相（誰のミスか）・星がとれるか・結末は言わない。人物名・店名・地名は6段目まで出さない（6段目も 東京 だけ）。
// 俳優の顔・ポスター・ロゴ・有名な場面の構図は使わない。料理は汎用の白い皿と色の点だけ。人は汎用の3D

const S = quizStage({ bg: '#1c1a20', floor: '#2a2624', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8080);

const CHEF = { skin: '#f1c9a5', hair: '#2a2220', shirt: '#f4f4f0', pants: '#2b2f3a' };
const CHEF_DOWN = { skin: '#f1c9a5', hair: '#2a2220', shirt: '#4a4640', pants: '#2b2f3a' };
const SHE = { skin: '#f4d3b5', hair: '#3a2a22', shirt: '#f4f4f0', pants: '#2b2f3a', long: true };
const GUEST = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5', '#d9a57c'][i % 4], hair: ['#1d1a19', '#9a9a9a', '#4a3426', '#c8a070', '#6b4a33'][i % 5], shirt: ['#2b2f3a', '#3b3f4a', '#1e2430', '#4a3a3a'][i % 4], pants: '#1e2026', tie: true });
const COOK = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#1d1a19', '#4a3426', '#2c2421'][i % 3], shirt: '#f4f4f0', pants: ['#2b2f3a', '#3b3f4a'][i % 2], long: i % 3 === 1 });

function plate(dots = true) { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.03, 28), mat('#fbfbf8')); g.add(p);
  if (dots) for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(['#c84a3a', '#5a9a4a', '#e6b450', '#8a5a3a'][i])); d.position.set(Math.cos(i * 1.6) * 0.07, 0.03, Math.sin(i * 1.6) * 0.07); g.add(d); }
  return g; }
function chefHat() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.2, 0.12, 16), mat('#ffffff')); g.add(b); const t = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), mat('#ffffff')); t.position.y = 0.16; t.scale.set(1, 0.7, 1); g.add(t); return g; }
function wearHat(p) { const h = chefHat(); h.position.y = 0.62; p.userData.head.add(h); return h; }
function star() { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.16 : 0.38; const a = Math.PI / 2 + i * Math.PI / 5; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath();
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#e6b450', emissive: '#6a4a10', metalness: 0.6, roughness: 0.3 })); }

// ---------- 1段目. 大切な食事会（x=0）。長いテーブル、白い皿、立ち上がる客 ----------
{ const fl = box(16, 0.04, 12, mat('#5a3a2a')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(16, 5, 0.2, mat('#d8ccb4')); wl.position.set(0, 2.5, -6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff0c8' })); ch.position.set(-3 + i * 3, 3.6, -3.4); qs.add(ch); }
  const tb = box(6.4, 0.08, 1.4, mat('#f8f6f0')); tb.position.set(0, 0.76, -2.4); qs.add(tb);
  const cloth = box(6.5, 0.6, 1.5, mat('#f0ece2')); cloth.position.set(0, 0.46, -2.4); qs.add(cloth);
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 8), mat('#e6d8b0')); c.position.set(-2.4 + i * 1.2, 0.95, -2.4); qs.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd070' })); f.position.set(-2.4 + i * 1.2, 1.14, -2.4); qs.add(f); } }
const GUESTS = []; for (let i = 0; i < 8; i++) { const p = makePerson(GUEST(i)); const side = i < 4 ? -1 : 1; p.position.set(-2.4 + (i % 4) * 1.6, -0.4, -2.4 + side * 1.0); p.rotation.y = side < 0 ? 0 : Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); GUESTS.push(p); }
const PLATES1 = []; for (let i = 0; i < 8; i++) { const pl = plate(); const side = i < 4 ? -1 : 1; pl.position.set(-2.4 + (i % 4) * 1.6, 0.82, -2.4 + side * 0.45); qs.add(pl); PLATES1.push(pl); }
const chef1 = makePerson(CHEF); wearHat(chef1); chef1.position.set(3.9, 0, -1.2); chef1.rotation.y = -1.2; qs.add(chef1);
const WARN1 = []; for (let i = 0; i < 4; i++) { const w = tag('！', { size: 100, w: 140, h: 140, bg: '#c8282c', sx: 0.5 }); qs.add(w); WARN1.push(w); }
const tLunch = tag('大切な食事会', { size: 66, w: 460, bg: '#14161c', sx: 1.8 }); tLunch.position.set(0, 2.6, -2.4); qs.add(tLunch);
const tPlate = tag('その一皿が、事件に', { size: 60, w: 600, bg: '#c8282c', sx: 2.1 }); tPlate.position.set(0, 2.6, -2.4); qs.add(tPlate);

// ---------- 2段目. 夜の裏通り（x=40）。木箱に座りこむ男、舞う請求書 ----------
const AX = 40;
{ const gr = box(14, 0.04, 12, mat('#3a3a40')); gr.position.set(AX, 0.02, -2); qs.add(gr);
  const wl = box(14, 6, 0.3, mat('#6a5a50')); wl.position.set(AX, 3, -4.5); qs.add(wl);
  for (let i = 0; i < 5; i++) { const br = box(1.2, 0.04, 0.02, mat('#5a4a40')); br.position.set(AX - 4 + i * 2, 1.2 + (i % 3) * 1.4, -4.33); qs.add(br); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lamp.position.set(AX + 1.6, 3.4, -4.1); qs.add(lamp);
  const cr = box(0.8, 0.5, 0.6, mat('#8a6a48')); cr.position.set(AX, 0.25, -2.6); qs.add(cr);
  for (let i = 0; i < 3; i++) { const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12), mat('#4a5048')); bin.position.set(AX - 2.6 + i * 0.7, 0.4, -3.8); qs.add(bin); } }
const man2 = makePerson(CHEF_DOWN); man2.position.set(AX, 0.1, -2.5); man2.userData.legs.forEach(l => l.rotation.x = -1.4); man2.userData.head.rotation.x = 0.45; qs.add(man2);
const COLL = []; for (let i = 0; i < 2; i++) { const p = makePerson({ skin: '#e8b98f', hair: '#1d1a19', shirt: '#1a1a1e', pants: '#1a1a1e' }); p.position.set(AX - 3 + i * 6, 0, -1.2); qs.add(p); COLL.push(p); }
const BILLS = []; for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ map: canvasTex(90, 120, (g, w, h) => { g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8282c'; g.fillRect(10, 10, 70, 14); g.strokeStyle = '#555'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(12, 44 + k * 18); g.lineTo(78, 44 + k * 18); g.stroke(); } }), side: THREE.DoubleSide })); qs.add(b); BILLS.push(b); }
const tLost = tag('すべてを失った料理人', { size: 58, w: 640, bg: '#14161c', sx: 2.2 }); tLost.position.set(AX, 3.0, -2.4); qs.add(tLost);
const tDebt = tag('借金取りに追われる', { size: 60, w: 600, bg: '#8a1f2c', sx: 2.1 }); tDebt.position.set(AX, 3.0, -2.4); qs.add(tDebt);

// ---------- 3段目. 厨房（x=80）。火と湯気、白い服の料理人たち ----------
const BX = 80;
const FLAMES = [], STEAM = [];
{ const fl = box(14, 0.04, 10, mat('#8a8a88')); fl.position.set(BX, 0.02, -1.5); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#c8ccd0')); wl.position.set(BX, 2.5, -5); qs.add(wl);
  for (let i = 0; i < 12; i++) { const t = box(1.0, 1.0, 0.02, mat(i % 2 ? '#dfe3e6' : '#cfd4d8')); t.position.set(BX - 5.5 + i, 1.8, -4.88); qs.add(t); }
  const st = box(6.4, 0.9, 1.0, mat('#8a9098')); st.position.set(BX, 0.45, -3.6); qs.add(st);
  const hood = box(6.6, 0.6, 1.4, mat('#a8b0b8')); hood.position.set(BX, 3.6, -3.8); qs.add(hood);
  for (let i = 0; i < 4; i++) { const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.14, 18), mat('#3a3a40')); pan.position.set(BX - 2.4 + i * 1.6, 1.0, -3.6); qs.add(pan);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 10), new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.85 })); f.position.set(BX - 2.4 + i * 1.6, 0.95, -3.6); qs.add(f); FLAMES.push(f);
    for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })); qs.add(s); STEAM.push([s, i, k]); } }
  const pass = box(5, 0.08, 0.8, mat('#d0d4d8')); pass.position.set(BX, 1.0, -0.6); qs.add(pass);
  const pl = box(0.1, 0.96, 0.1, mat('#8a9098')); for (const x of [-2.3, 2.3]) { const l = pl.clone(); l.position.set(BX + x, 0.5, -0.6); qs.add(l); } }
const COOKS = []; for (let i = 0; i < 4; i++) { const p = makePerson(COOK(i)); wearHat(p); p.position.set(BX - 2.4 + i * 1.6, 0, -2.7); p.rotation.y = Math.PI; qs.add(p); COOKS.push(p); }
const PASSPL = []; for (let i = 0; i < 5; i++) { const p = plate(); p.position.set(BX - 1.8 + i * 0.9, 1.06, -0.6); qs.add(p); PASSPL.push(p); }
const tKitchen = tag('火と湯気の厨房', { size: 64, w: 500, bg: '#14161c', sx: 1.9 }); tKitchen.position.set(BX - 0.4, 3.0, -2.6); qs.add(tKitchen);
const tAgain = tag('一皿を、何度でも', { size: 62, w: 540, bg: '#c86a1a', sx: 2.0 }); tAgain.position.set(BX - 0.4, 3.0, -2.6); qs.add(tAgain);

// ---------- 4段目. 改装中の店（x=120）。手を組む男女のシェフ、浮かぶ3つの星 ----------
const CX = 120;
{ const fl = box(12, 0.04, 10, mat('#8a6a4a')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#e8e0d0')); wl.position.set(CX, 2.5, -4); qs.add(wl);
  for (let i = 0; i < 2; i++) { const win = box(1.8, 2.4, 0.05, new THREE.MeshBasicMaterial({ color: '#9ac0e0' })); win.position.set(CX - 3.4 + i * 6.8, 2.2, -3.88); qs.add(win); }
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 20), mat('#f8f6f0')); t.position.set(CX - 2.4 + i * 2.4, 0.76, -2.6 + (i % 2) * 0.3); qs.add(t); const l = box(0.08, 0.74, 0.08, mat('#3a2a24')); l.position.set(CX - 2.4 + i * 2.4, 0.37, -2.6 + (i % 2) * 0.3); qs.add(l); }
  const lad = box(0.06, 2.4, 0.5, mat('#c8a050')); lad.position.set(CX + 4.2, 1.2, -3.4); lad.rotation.z = 0.2; qs.add(lad);
  for (let i = 0; i < 3; i++) { const b = box(0.6, 0.45, 0.5, mat('#c89a5a')); b.position.set(CX - 4.2 + i * 0.4, 0.23 + (i === 1 ? 0.45 : 0), -3.3); qs.add(b); } }
const he4 = makePerson(CHEF); wearHat(he4); he4.position.set(CX + 0.5, 0, -1.4); he4.rotation.y = -0.5; qs.add(he4);
const she4 = makePerson(SHE); wearHat(she4); she4.position.set(CX - 0.5, 0, -1.4); she4.rotation.y = 0.5; qs.add(she4);
const STARS = []; for (let i = 0; i < 3; i++) { const s = star(); s.position.set(CX - 0.9 + i * 0.9, 3.0, -1.6); qs.add(s); STARS.push(s); }
const tPair = tag('ふたりで、新しい店を', { size: 58, w: 620, bg: '#14161c', sx: 2.1 }); tPair.position.set(CX, 3.9, -1.6); qs.add(tPair);
const tGoal = tag('目標は、星3つ', { size: 66, w: 500, bg: '#b8861c', sx: 1.9 }); tGoal.position.set(CX, 3.9, -1.6); qs.add(tGoal);

// ---------- 5段目. 日曜の夜のテレビ（x=180）。2019年の日本のドラマ ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#2e3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(3.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.1, -3.5); qs.add(tvb);
  const sofa = box(3.2, 0.5, 1.0, mat('#6a4a3a')); sofa.position.set(TX, 0.25, 1.4); qs.add(sofa); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { g.fillStyle = '#1a1820'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3; i++) { const cx = 210 + i * 210, cy = 250; g.fillStyle = '#fbfbf8'; g.beginPath(); g.ellipse(cx, cy, 90, 40, 0, 0, Math.PI * 2); g.fill(); ['#c84a3a', '#5a9a4a', '#e6b450'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(cx - 30 + k * 30, cy - 4, 12, 0, Math.PI * 2); g.fill(); }); } }) }));
TV.position.set(TX, 2.1, -3.42); qs.add(TV);
const VIEW5 = []; for (let i = 0; i < 2; i++) { const p = makePerson(GUEST(i + 1)); p.position.set(TX - 0.5 + i, 0.05, 1.4); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); VIEW5.push(p); }
const t2019 = tag('2019年 日本のドラマ', { size: 58, w: 640, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2019.position.set(TX, 4.6, -3.0); qs.add(t2019);
const tSunday = tag('日曜劇場', { size: 70, w: 400, bg: '#2a5aa8', sx: 1.7 }); tSunday.position.set(TX, 4.6, -3.0); qs.add(tSunday);
const tMovie = tag('2024年 映画にも', { size: 60, w: 520, bg: '#8a1f2c', sx: 2.0 }); tMovie.position.set(TX, 4.6, -3.0); qs.add(tMovie);

// ---------- 6段目. 夜の街角のレストラン（x=220）。灯りのともる店の前 ----------
const DX = 220;
const CITY = [];
{ const gr = box(30, 0.04, 20, mat('#2a2a30')); gr.position.set(DX, 0.02, -4); qs.add(gr);
  const shop = box(6, 4.2, 2, mat('#2a2420')); shop.position.set(DX, 2.1, -5); qs.add(shop);
  const glass = box(4.6, 2.2, 0.05, new THREE.MeshBasicMaterial({ color: '#f4c878' })); glass.position.set(DX, 1.4, -3.98); qs.add(glass);
  const awn = box(6.2, 0.18, 1.0, mat('#1e3a2a')); awn.position.set(DX, 3.0, -3.6); awn.rotation.x = 0.2; qs.add(awn);
  const sign = box(3.2, 0.5, 0.06, mat('#e6b450')); sign.position.set(DX, 3.7, -3.95); qs.add(sign);
  for (let i = 0; i < 2; i++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.5, 12), mat('#5a4a3a')); pot.position.set(DX - 2.7 + i * 5.4, 0.25, -3.6); qs.add(pot); const tr = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat('#2a6a3a')); tr.position.set(DX - 2.7 + i * 5.4, 0.85, -3.6); qs.add(tr); }
  for (let i = 0; i < 8; i++) { const h = 8 + (i * 7) % 12; const b = box(3, h, 3, mat('#3a4050')); b.position.set(DX - 14 + i * 4, h / 2, -14); qs.add(b);
    for (let k = 0; k < 5; k++) { const w = box(0.5, 0.4, 0.05, new THREE.MeshBasicMaterial({ color: (i + k) % 3 ? '#f4d890' : '#3a4050' })); w.position.set(DX - 14 + i * 4 + ((k % 2) - 0.5), 2 + k * 1.6, -12.47); qs.add(w); CITY.push(w); } }
  const tw = box(1.2, 22, 1.2, mat('#d8584a')); tw.position.set(DX + 9, 11, -18); qs.add(tw); }
const PL6 = plate(); PL6.scale.setScalar(2.4); qs.add(PL6);
const TABLE6 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 24), mat('#f8f6f0')); TABLE6.position.set(DX, 0.78, -1.6); qs.add(TABLE6);
{ const l = box(0.1, 0.76, 0.1, mat('#2a2018')); l.position.set(DX, 0.38, -1.6); qs.add(l); }
const tFrench = tag('東京のフランス料理店', { size: 58, w: 640, bg: '#1e3a2a', sx: 2.3 }); tFrench.position.set(DX, 3.75, -2.6); qs.add(tFrench);
const tName = tag('店の名前が、タイトル', { size: 58, w: 640, bg: '#b8861c', sx: 2.3 }); tName.position.set(DX, 3.75, -2.6); qs.add(tName);

// ---------- shots ----------
const ALL = [tLunch, tPlate, tLost, tDebt, tKitchen, tAgain, tPair, tGoal, t2019, tSunday, tMovie, tFrench, tName];
function base() { S.reset(); ALL.forEach(x => x.visible = false); WARN1.forEach(w => w.visible = false); BILLS.forEach(b => b.visible = false); STARS.forEach(s => s.visible = false); PL6.visible = false; STEAM.forEach(([s]) => s.visible = false); }

function shotLunch(t, quiz = 0) { // 1段目 0〜9：大切な食事会に出された、一皿の料理。それが、すべてを壊してしまった（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.15;
  const bad = !quiz && t > 4.4;
  GUESTS.forEach((p, i) => { p.userData.arms[1].rotation.x = -0.7 + Math.sin(t * 3 + i) * 0.08; p.userData.head.rotation.x = 0.25; p.position.y = -0.4; p.userData.legs.forEach(l => l.rotation.x = -1.5); });
  chef1.userData.arms.forEach(a => a.rotation.x = 0); chef1.rotation.y = -1.2;
  if (bad) { const k = clamp((t - 4.4) / 0.4);
    const g = GUESTS[5]; g.position.y = lerp(-0.4, 0, k); g.userData.legs.forEach(l => l.rotation.x = lerp(-1.5, 0, k)); g.userData.arms[0].rotation.x = -2.0; g.userData.arms[1].rotation.x = -1.6; g.userData.head.rotation.x = -0.3;
    [4, 6, 1, 2].forEach((j, n) => { GUESTS[j].userData.head.rotation.y = (j < 4 ? -0.6 : 0.6); GUESTS[j].userData.arms[0].rotation.x = -1.2 - n * 0.1; });
    chef1.rotation.y = -1.5; chef1.userData.arms.forEach(a => a.rotation.x = -0.6);
    WARN1.forEach((w, i) => { w.visible = true; w.userData.pop((t - 4.6 - i * 0.15) / 0.3); w.position.set(-1.6 + i * 1.1 + 0.4, 1.9 + (i % 2) * 0.3, -2.0); });
    S.spot.intensity = 26; S.spot.position.set(0.8, 5, 0); S.spot.target.position.set(0.8, 0.8, -2.4); }
  if (!quiz) { tLunch.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tLunch.visible = false; tPlate.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.9, 0.5, u), lerp(4.5, 4.1, u), lerp(3.0, 2.3, u), 0.3, 0.8, -2.4, 62);
  return qs;
}
function shotAlley(t) { // 2段目 9〜17：主人公は、店も名声も失った料理人。いまは、借金取りに追われる毎日
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.55, '#06070c');
  S.spot.intensity = 18; S.spot.color.set('#ffd890'); S.spot.position.set(AX + 1.2, 5, -1); S.spot.target.position.set(AX, 0.5, -2.5);
  man2.userData.head.rotation.x = 0.45 + Math.sin(t * 0.8) * 0.05; man2.userData.arms.forEach(a => a.rotation.x = -0.5);
  BILLS.forEach((b, i) => { b.visible = true; const k = (t * 0.22 + i / 9) % 1; b.position.set(AX - 1.5 + (i % 5) * 0.75 + Math.sin(t + i) * 0.2, 3.2 - k * 3.0, -2.2 + (i % 3) * 0.3); b.rotation.set(t * 1.3 + i, t * 0.9 + i, i); });
  COLL.forEach((p, i) => { const s = i ? -1 : 1; const k = clamp((t - 4.2) / 3.0); p.position.x = AX + s * lerp(-3.2, -1.3, k) * -1; p.position.x = i ? lerp(AX + 2.4, AX + 1.05, k) : lerp(AX - 2.4, AX - 1.05, k); p.position.z = -2.1; p.rotation.y = i ? -1.4 : 1.4; poseWalk(p, t * 6, k < 1 ? 0.8 : 0); });
  tLost.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLost.visible = false; tDebt.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.6, 0.3, u), lerp(2.0, 1.9, u), lerp(3.4, 2.8, u), AX, 1.2, -2.6, 60);
  return qs;
}
function shotKitchen(t, quiz = 0) { // 3段目 17〜25：白い湯気と、火の音が響く厨房。一皿のために、何度も作り直す
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.2;
  FLAMES.forEach((f, i) => { f.scale.set(1, 0.8 + Math.abs(Math.sin(t * 9 + i * 2)) * 0.6, 1); });
  STEAM.forEach(([s, i, k]) => { s.visible = true; const ph = (t * 0.35 + k / 3 + i * 0.1) % 1; s.position.set(BX - 2.4 + i * 1.6 + Math.sin(t + k) * 0.15, 1.3 + ph * 2.0, -3.6); s.scale.setScalar(0.6 + ph * 1.4); s.material.opacity = 0.22 * (1 - ph); });
  COOKS.forEach((p, i) => { p.userData.arms[1].rotation.x = -1.1 + Math.sin(t * 7 + i * 1.7) * 0.35; p.userData.arms[0].rotation.x = -0.8; });
  if (!quiz && t > 4.2) { PASSPL.forEach((p, i) => { p.visible = ((Math.floor(t * 1.6) + i) % 5) !== 0; }); } else PASSPL.forEach(p => p.visible = true);
  if (!quiz) { tKitchen.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKitchen.visible = false; tAgain.userData.pop((t - 4.2) / 0.35); }
  const u = ease(t / 8);
  look(BX + lerp(3.4, 3.0, u), lerp(3.2, 3.0, u), lerp(1.2, 0.6, u), BX - 0.6, 1.2, -3.2, 62);
  return qs;
}
function shotPartner(t) { // 4段目 25〜33：面接に落ちた女性シェフと手を組み、新しい店を開く。目指すのは、最高の評価、星3つ
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 1.3;
  const shake = t > 1.0 && t < 4.0; he4.userData.arms[0].rotation.x = shake ? -1.0 + Math.sin(t * 8) * 0.12 : 0; she4.userData.arms[1].rotation.x = shake ? -1.0 + Math.sin(t * 8) * 0.12 : 0;
  if (t > 4.2) { he4.userData.head.rotation.x = -0.35; she4.userData.head.rotation.x = -0.35; he4.userData.arms[1].rotation.x = -2.6; }
  STARS.forEach((s, i) => { if (t > 4.6 + i * 0.4) { s.visible = true; const k = clamp((t - 4.6 - i * 0.4) / 0.35); s.scale.setScalar(ease(k)); s.rotation.y = t * 1.6 + i; } });
  tPair.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPair.visible = false; tGoal.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.5, 0.2, u), lerp(2.0, 2.2, u), lerp(4.2, 3.6, u), CX, 2.0, -1.6, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2019年の日本のドラマ。日曜劇場で放送。2024年には、続きが映画になった
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#0a0810');
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 2.6) t2019.visible = false;
  tSunday.userData.pop((t - 2.8) / 0.35); if (t > 4.2) tSunday.visible = false;
  tMovie.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.8, 3.0, u), lerp(5.6, 4.8, u), TX, 2.8, -3.4, 58);
  return qs;
}
function shotShop(t) { // 6段目 42〜49（決め手）：東京で開く、フランス料理のレストラン。その店の名前が、そのままタイトル
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.6, '#070a14');
  PL6.visible = true; PL6.position.set(DX, 0.86, -1.6); PL6.rotation.y = t * 0.4;
  S.spot.intensity = 24; S.spot.color.set('#fff0d0'); S.spot.position.set(DX, 4.5, -0.5); S.spot.target.position.set(DX, 0.8, -1.6);
  tFrench.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tFrench.visible = false; tName.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.6, 0.4, u), lerp(1.9, 2.1, u), lerp(4.6, 3.8, u), DX, 1.5, -3.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（厨房に戻る）
  shotKitchen(6.0 + t, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.2, 0.6, d); S.darken(0.4 * d, '#1a1020');
  const k = ease(t / 7);
  look(BX + lerp(3.0, 2.6, k), 3.0, lerp(0.6, 0.2, k), BX - 0.6, 1.2, -3.2, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotLunch(t, 0) },
  { a: 9, b: 17, f: shotAlley },
  { a: 17, b: 25, f: (t) => shotKitchen(t, 0) },
  { a: 25, b: 33, f: shotPartner },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotShop },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '大切な食事会に出された、<br>一皿の料理。'],
  [5.6, 9.0, 'それが、すべてを<br>壊してしまった。'],
  [9.2, 13.2, '主人公は、店も名声も<br>失った料理人。'],
  [13.2, 17.0, 'いまは、借金取りに<br>追われる毎日。'],
  [17.2, 21.0, '白い湯気と、<br>火の音が響く厨房。'],
  [21.0, 25.0, '一皿のために、<br>何度も作り直す。'],
  [25.2, 29.0, '面接に落ちた女性シェフと<br>手を組み、新しい店を開く。'],
  [29.0, 33.0, '目指すのは、<br>最高の評価、星3つ。'],
  [33.2, 37.4, '2019年の日本のドラマ。<br>日曜劇場で放送。'],
  [37.4, 41.8, '2024年には、<br>続きが映画になった。'],
  [42.2, 45.4, '東京で開く、<br>フランス料理のレストラン。'],
  [45.4, 49.0, 'その店の名前が、<br>そのままタイトル。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>グランメゾン東京。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q080', v2: true, answer: 'グランメゾン東京',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 8080,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '大切な': 'たいせつな', '食事会': 'しょくじかい', '出された': 'だされた', '一皿': 'ひとさら', '料理人': 'りょうりにん', '料理': 'りょうり', '壊して': 'こわして', '主人公': 'しゅじんこう', '店': 'みせ', '名声': 'めいせい', '失った': 'うしなった', '借金取り': 'しゃっきんとり', '追われる': 'おわれる', '毎日': 'まいにち', '白い': 'しろい', '湯気': 'ゆげ', '火': 'ひ', '音': 'おと', '響く': 'ひびく', '厨房': 'ちゅうぼう', '何度も': 'なんども', '作り直す': 'つくりなおす', '面接': 'めんせつ', '落ちた': 'おちた', '女性': 'じょせい', '手を組み': 'てをくみ', '新しい': 'あたらしい', '開く': 'ひらく', '目指す': 'めざす', '最高': 'さいこう', '評価': 'ひょうか', '星3つ': 'ほしみっつ', '2019年': 'にせんじゅうきゅうねん', '日本': 'にほん', '日曜劇場': 'にちようげきじょう', '放送': 'ほうそう', '2024年': 'にせんにじゅうよねん', '続き': 'つづき', '映画': 'えいが', '東京': 'とうきょう', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n大切な食事会に出された、一皿の料理。それが、すべてを壊してしまった。主人公は、店も名声も失った料理人。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'U-NEXT', 'ドラマ好き', 'お仕事ドラマ'],
  },
});
applyQuizCards({ answer: 'グランメゾン東京', info: 'Prime Video・U-NEXT｜日本のドラマ', answerSize: 104 });
