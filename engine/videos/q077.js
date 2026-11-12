import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #077 タイタニック（映画・アメリカ・1997年・189分。Disney+・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/taitanitsuku で2026/11/12確認（Filmarks の動画配信欄も Hulu 見放題）。
//   Filmarks 4.2・レビュー334,428件 filmarks.com/movies/10955）
// 確かめた事実（JustWatch の作品紹介、ja.wikipedia.org/wiki/タイタニック_(1997年の映画)。2026/11/12）：
//   ・1912年、処女航海に出た当時史上最大の豪華客船。画家志望の青年と上流階級の娘が船上で出会い、身分違いの恋（JustWatch・Wikipedia）
//   ・物語の始まりは1996年。深海の沈没船の調査で金庫が見つかり、中にあったのは探していた宝石ではなく1枚の絵（Wikipedia）
//   ・画家を目指す貧しい青年は、出港直前に勝った賭けポーカーで三等船室の乗船チケットを手に入れる（Wikipedia）
//   ・名家の一人娘は、母に半ば強制された婚約に気分が晴れないでいた（Wikipedia）
//   ・1997年のアメリカ映画。アカデミー賞で作品賞・監督賞を含む11部門を受賞（Wikipedia）
// 構成（ヒント6段）：1 海の底で見つかった金庫、中には宝石ではなく1枚の絵 → 2 主人公は画家を目指す貧しい青年、賭けで船の切符
//   → 3 巨大な船の上、豪華な上の階とにぎやかな下の階 → 4 婚約を強いられた名家の娘と出会い、身分を越えて惹かれ合う
//   → 5 1997年のアメリカ映画、アカデミー賞11部門 → 6 決め手：1912年、史上最大の豪華客船の最初の航海
// 人物名・船の名前は出さない。俳優の顔・ポスター・ロゴ・衣装の再現・有名な場面（船首で腕を広げる場面・絵のモデルの場面など）の構図は使わない。
// 絵は白紙に線だけ。人は汎用の3D。結末（事故のその後・人物の生死）は言わない

const S = quizStage({ bg: '#a8c8e0', floor: null, fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(7777);

const JACK = { skin: '#f1c9a5', hair: '#c8a070', shirt: '#e9e4da', pants: '#5a4a3a' };
const ROSE = { skin: '#f4d3b5', hair: '#b4502e', shirt: '#e8dcc8', pants: '#e8dcc8', long: true, skirt: true };
const RICH = (i) => ({ skin: ['#f1c9a5', '#f4d3b5', '#e8b98f'][i % 3], hair: ['#2c2421', '#9a9a9a', '#6b4a33'][i % 3], shirt: i % 2 ? '#d8c8e8' : '#14161c', pants: i % 2 ? '#d8c8e8' : '#14161c', long: i % 2 === 1, skirt: i % 2 === 1, tie: i % 2 === 0 });
const POOR = (i) => ({ skin: ['#e8b98f', '#f1c9a5', '#d9a57c'][i % 3], hair: ['#4a3426', '#1d1a19', '#6b4a33'][i % 3], shirt: ['#7a6a55', '#5d8c3a', '#d97a3a', '#59606e'][i % 4], pants: '#3b3f4a', long: i % 3 === 1, skirt: i % 3 === 1 });

// ---------- 1段目. 深い海の底（x=0）。小さな潜水艇のライトが、沈んだ金庫を照らす ----------
{ const sb = box(30, 0.2, 30, mat('#2a3a4a')); sb.position.set(0, -0.1, -6); qs.add(sb);
  for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + R() * 0.5), mat('#3a4a58')); r.position.set(-6 + R() * 12, 0.1, -2 - R() * 12); qs.add(r); }
  const wreck = box(8, 3, 1.0, mat('#3a3028')); wreck.position.set(-1.5, 1.4, -8); wreck.rotation.z = 0.15; qs.add(wreck);
  for (let i = 0; i < 5; i++) { const ph = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), mat('#1a1410')); ph.position.set(-4 + i * 1.6, 2.0 + i * 0.22, -7.48); qs.add(ph); } }
const SAFE = new THREE.Group(); { const b = box(0.9, 0.9, 0.8, mat('#4a4a44')); b.position.y = 0.45; SAFE.add(b); const k = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), mat('#c8b060')); k.rotation.x = Math.PI / 2; k.position.set(0.2, 0.5, 0.42); SAFE.add(k); } SAFE.position.set(0.3, 0, -2.4); qs.add(SAFE);
const DOOR = box(0.86, 0.86, 0.06, mat('#55554e')); DOOR.geometry.translate(0.43, 0, 0); DOOR.position.set(-0.13, 0.45, -1.98); qs.add(DOOR);
const SUB = new THREE.Group(); { const h = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), mat('#e8e4d8')); h.scale.set(1.4, 1, 1); SUB.add(h); const w = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), new THREE.MeshBasicMaterial({ color: '#3a6a8a' })); w.position.set(0.9, 0.05, 0.3); w.rotation.y = 1.2; SUB.add(w);
  const lt = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff8d0' })); lt.position.set(0.98, -0.3, 0); SUB.add(lt); } SUB.position.set(2.6, 1.8, -3.4); SUB.rotation.y = Math.PI * 0.85; qs.add(SUB);
const BEAM = new THREE.SpotLight(0xfff0c0, 0, 14, 0.5, 0.4, 1); BEAM.position.set(1.8, 1.8, -3); BEAM.target.position.set(0.3, 0.4, -2.4); qs.add(BEAM); qs.add(BEAM.target);
const SKETCH = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(300, 400, (g, w, h) => { g.fillStyle = '#efe6cc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(60,50,40,.7)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(40 + i * 8, 80 + i * 30); g.bezierCurveTo(120, 60 + i * 34, 200, 110 + i * 26, 260 - i * 6, 90 + i * 32); g.stroke(); } g.fillStyle = 'rgba(60,90,160,.8)'; g.beginPath(); g.arc(w / 2, h / 2, 14, 0, Math.PI * 2); g.fill(); }), side: THREE.DoubleSide })); qs.add(SKETCH);
const BUB = []; for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.04 + (i % 3) * 0.02, 6, 4), new THREE.MeshBasicMaterial({ color: '#c8e8ff', transparent: true, opacity: 0.6 })); qs.add(b); BUB.push(b); }
const tSafe = tag('海の底の金庫', { size: 66, w: 460, bg: '#14161c', sx: 1.7 }); tSafe.position.set(0.3, 2.2, -2.8); qs.add(tSafe);
const tPic = tag('中には、1枚の絵', { size: 62, w: 540, bg: '#3a7ad8', sx: 1.7 }); tPic.position.set(0.3, 2.45, -2.8); qs.add(tPic);

// ---------- 2段目. 港の酒場（x=40）。カードの賭けに勝って、切符を手に入れる ----------
const AX = 40;
{ const fl = box(12, 0.04, 10, mat('#6a4a30')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#8a6a48')); wl.position.set(AX, 2.5, -6); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ color: '#c8e0f0' })); win.position.set(AX + 2.4, 2.8, -5.88); qs.add(win);
  const wb = box(12, 5, 0.2, mat('#8a6a48')); wb.position.set(AX, 2.5, 3.0); qs.add(wb);
  for (let i = 0; i < 4; i++) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), mat(['#3a6a3a', '#8a3a2a', '#c8a050'][i % 3])); bt.position.set(AX - 1.5 + i * 0.6, 1.6, 2.8); qs.add(bt); }
  const sh = box(3, 0.08, 0.4, mat('#4a3424')); sh.position.set(AX - 0.6, 1.38, 2.8); qs.add(sh);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 24), mat('#2f6a3a')); tb.position.set(AX, 0.8, -1.6); qs.add(tb);
  const lg = box(0.15, 0.8, 0.15, mat('#3a2a1a')); lg.position.set(AX, 0.4, -1.6); qs.add(lg); }
const jack2 = makePerson(JACK); jack2.position.set(AX - 0.2, -0.4, -0.7); jack2.rotation.y = Math.PI; jack2.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(jack2);
const OPP = []; for (let i = 0; i < 2; i++) { const p = makePerson(POOR(i + 2)); p.position.set(AX - 1.4 + i * 2.8, -0.4, -2.2); p.rotation.y = (i ? -0.5 : 0.5); p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); OPP.push(p); }
const CARDS = []; for (let i = 0; i < 5; i++) { const c = box(0.16, 0.01, 0.22, mat(i % 2 ? '#f4f0e4' : '#e9e4da')); c.position.set(AX - 0.5 + i * 0.25, 0.86, -1.4); c.rotation.y = (i - 2) * 0.2; qs.add(c); CARDS.push(c); }
const TICKET = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(240, 120, (g, w, h) => { g.fillStyle = '#e6d8a8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a3a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#8a6a3a'; for (let i = 0; i < 4; i++) g.fillRect(30, 34 + i * 16, 120 - i * 18, 6); }), side: THREE.DoubleSide })); qs.add(TICKET);
const SKBOOK = box(0.4, 0.04, 0.3, mat('#5a4030')); SKBOOK.position.set(AX + 0.6, 0.87, -1.0); qs.add(SKBOOK);
const tPainter = tag('画家志望の青年', { size: 64, w: 520, bg: '#14161c', sx: 1.4 }); tPainter.position.set(AX - 0.2, 2.35, -0.1); qs.add(tPainter);
const tBet = tag('賭けで、船の切符', { size: 62, w: 540, bg: '#c8902a', sx: 1.4 }); tBet.position.set(AX - 0.2, 2.35, -0.1); qs.add(tBet);

// ---------- 3段目. 船の断面（x=80）。上は金色の豪華な広間、下はにぎやかな大部屋 ----------
const BX = 80;
{ const hull = box(10, 7, 0.3, mat('#1a1a1e')); hull.position.set(BX, 3.2, -4.4); qs.add(hull);
  const up = box(9, 2.8, 0.2, mat('#e8d8b0')); up.position.set(BX, 4.7, -4.2); qs.add(up);
  const lo = box(9, 2.8, 0.2, mat('#a89070')); lo.position.set(BX, 1.6, -4.2); qs.add(lo);
  const mid = box(10, 0.3, 4, mat('#5a4030')); mid.position.set(BX, 3.15, -2.2); qs.add(mid);
  const flU = box(9, 0.04, 4, mat('#8a2a2a')); flU.position.set(BX, 3.32, -2.2); qs.add(flU);
  const flL = box(9, 0.04, 4, mat('#7a6040')); flL.position.set(BX, 0.12, -2.2); qs.add(flL);
  for (let i = 0; i < 3; i++) { const ch = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 10), new THREE.MeshBasicMaterial({ color: '#ffe08a' })); ch.rotation.x = Math.PI; ch.position.set(BX - 3 + i * 3, 5.8, -2.4); qs.add(ch); }
  for (let i = 0; i < 4; i++) { const pl = box(0.2, 2.8, 0.2, mat('#c8a050')); pl.position.set(BX - 4.2 + i * 2.8, 4.7, -3.9); qs.add(pl); }
  for (let i = 0; i < 6; i++) { const pt = new THREE.Mesh(new THREE.CircleGeometry(0.25, 14), mat('#3a4a5a')); pt.position.set(BX - 4 + i * 1.6, 1.8, -4.08); qs.add(pt); } }
const UPS = []; for (let i = 0; i < 4; i++) { const p = makePerson(RICH(i)); p.position.set(BX - 2.6 + i * 1.6, 3.34, -2.4); p.rotation.y = (i % 2 ? -0.4 : 0.4); qs.add(p); UPS.push(p); }
const LOWS = []; for (let i = 0; i < 6; i++) { const p = makePerson(POOR(i)); p.position.set(BX - 3.2 + i * 1.25, 0.14, -2.2 + (i % 2) * 0.5); qs.add(p); LOWS.push(p); }
const NOTES = []; for (let i = 0; i < 6; i++) { const n = tag('♪', { size: 90, w: 130, h: 130, bg: '#e6b450', color: '#14161c', sx: 0.42 }); qs.add(n); NOTES.push(n); }
const tUp = tag('豪華な上の階', { size: 64, w: 460, bg: '#14161c', sx: 1.6 }); tUp.position.set(BX, 6.2, -1.6); qs.add(tUp);
const tLow = tag('にぎやかな下の階', { size: 60, w: 540, bg: '#c8641e', sx: 1.8 }); tLow.position.set(BX, 2.75, -1.0); qs.add(tLow);

// ---------- 4段目. 夜の甲板（x=120）。手すりのそばで出会う2人 ----------
const CX = 120;
{ const dk = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ map: canvasTex(256, 160, (g, w, h) => { for (let i = 0; i < 20; i++) { g.fillStyle = ['#b89868', '#a88858', '#c0a070'][i % 3]; g.fillRect(0, i * 8, w, 8); } }) })); dk.rotation.x = -Math.PI / 2; dk.position.set(CX, 0.02, -1); qs.add(dk);
  const rail = box(14, 0.08, 0.08, mat('#f4f0e4')); rail.position.set(CX, 1.1, -3.6); qs.add(rail);
  for (let i = 0; i < 15; i++) { const p = box(0.05, 1.1, 0.05, mat('#f4f0e4')); p.position.set(CX - 7 + i, 0.55, -3.6); qs.add(p); }
  const sea = box(80, 0.02, 60, mat('#0a1828')); sea.position.set(CX, -2, -35); qs.add(sea);
  for (let i = 0; i < 40; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' })); st.position.set(CX - 30 + R() * 60, 6 + R() * 14, -40); qs.add(st); }
  const lp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); lp.position.set(CX + 2.2, 2.6, -3.4); qs.add(lp); }
const jack4 = makePerson(JACK); jack4.position.set(CX + 0.65, 0, -2.4); jack4.rotation.y = -Math.PI / 2 + 0.4; qs.add(jack4);
const rose4 = makePerson(ROSE); rose4.position.set(CX - 0.65, 0, -2.4); rose4.rotation.y = Math.PI / 2 - 0.4; qs.add(rose4);
const RING = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20), new THREE.MeshBasicMaterial({ color: '#ffd84a' })); qs.add(RING);
const HEART = tag('♥', { size: 100, w: 150, h: 150, bg: '#e2483c', sx: 0.5 }); qs.add(HEART);
const tEngaged = tag('婚約を強いられた娘', { size: 58, w: 620, bg: '#14161c', sx: 2.0 }); tEngaged.position.set(CX, 2.7, -2.4); qs.add(tEngaged);
const tBeyond = tag('身分を、越えて', { size: 64, w: 500, bg: '#c94f7c', sx: 1.8 }); tBeyond.position.set(CX, 2.7, -2.4); qs.add(tBeyond);

// ---------- 5段目. 夜の部屋のテレビと金色のトロフィー（x=180）。1997年のアメリカ映画、アカデミー賞11部門 ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#2e3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(4.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.2, -3.6); qs.add(tvb); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2a48'); gr.addColorStop(0.6, '#3a5a80'); gr.addColorStop(1, '#0a1828'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 131) % w, (i * 37) % (h * 0.55), 2, 0, Math.PI * 2); g.fill(); } }) }));
TV.position.set(TX, 2.2, -3.52); qs.add(TV);
const CUPS = []; for (let i = 0; i < 11; i++) { const g = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3, emissive: '#5a3a10' }); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.06, 0.22, 12), gold); c.position.y = 0.32; g.add(c); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8), gold); st.position.y = 0.15; g.add(st); const b = box(0.16, 0.08, 0.16, mat('#14161c')); b.position.y = 0.04; g.add(b); g.position.set(TX - 2.1 + i * 0.42, 0.6, -3.25); qs.add(g); CUPS.push(g); }
const t1997 = tag('1997年 アメリカ映画', { size: 58, w: 660, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t1997.position.set(TX, 4.2, -3.0); qs.add(t1997);
const tAward = tag('アカデミー賞 11部門', { size: 58, w: 660, bg: '#8a1f2c', sx: 2.5 }); tAward.position.set(TX, 4.2, -3.0); qs.add(tAward);

// ---------- 6段目. 港を出る巨大な客船（x=220）。4本の煙突 ----------
const DX = 220;
{ const sea = box(120, 0.04, 80, mat('#3a6a98')); sea.position.set(DX, 0.0, -30); qs.add(sea);
  const pier = box(30, 1.0, 4, mat('#8a8070')); pier.position.set(DX - 4, 0.5, 4); qs.add(pier); }
const SHIP = new THREE.Group(); {
  const hull = box(24, 3.2, 3.0, mat('#14161c')); hull.position.y = 1.6; SHIP.add(hull);
  const red = box(24.05, 0.6, 3.05, mat('#8a1f1f')); red.position.y = 0.3; SHIP.add(red);
  const sup = box(20, 2.4, 2.6, mat('#f4f0e4')); sup.position.y = 4.4; SHIP.add(sup);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 26; i++) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshBasicMaterial({ color: '#ffe8a0' })); w.position.set(-11 + i * 0.85, 1.6 + f * 0.8, 1.52); SHIP.add(w); }
  for (let i = 0; i < 4; i++) { const fn = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 3.2, 14), mat('#d8a040')); fn.position.set(-6 + i * 3.6, 7.2, 0); fn.rotation.z = -0.1; SHIP.add(fn); const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.61, 0.61, 0.6, 14), mat('#14161c')); tp.position.set(-6 + i * 3.6 + 0.15, 8.6, 0); tp.rotation.z = -0.1; SHIP.add(tp); }
  for (const x of [-10, 10]) { const ms = box(0.15, 6, 0.15, mat('#3a3028')); ms.position.set(x, 7, 0); SHIP.add(ms); } }
SHIP.position.set(DX + 4, 0, -14); qs.add(SHIP);
const SMOKE = []; for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: '#d8d8d8', transparent: true, opacity: 0.6 })); qs.add(s); SMOKE.push(s); }
const CROWD = []; for (let i = 0; i < 8; i++) { const p = makePerson(i % 2 ? POOR(i) : RICH(i)); p.position.set(DX - 4 + i * 1.1, 1.0, 3.2); p.rotation.y = Math.PI; qs.add(p); CROWD.push(p); }
const t1912 = tag('1912年 豪華客船', { size: 62, w: 560, bg: '#14161c', sx: 2.0 }); t1912.position.set(DX - 3.6, 6.2, 2.4); qs.add(t1912);
const tFirst = tag('はじめての航海', { size: 64, w: 520, bg: '#3a7ad8', sx: 2.0 }); tFirst.position.set(DX - 3.6, 6.2, 2.4); qs.add(tFirst);

// ---------- shots ----------
const ALL = [tSafe, tPic, tPainter, tBet, tUp, tLow, tEngaged, tBeyond, t1997, tAward, t1912, tFirst];
function base() { S.reset(); S.hemi.intensity = 1.2; ALL.forEach(x => x.visible = false); BUB.forEach(b => b.visible = false); NOTES.forEach(n => n.visible = false); SMOKE.forEach(s => s.visible = false); SKETCH.visible = false; TICKET.visible = false; RING.visible = false; HEART.visible = false; BEAM.intensity = 0; }

function shotDeep(t, quiz = 0) { // 1段目 0〜9：海の底で見つかった、古い金庫。中にあったのは、宝石ではなく1枚の絵（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.darken(0.82, '#04121e'); S.hemi.intensity = 0.45; BEAM.intensity = 40;
  SUB.position.y = 1.8 + Math.sin(t * 1.2) * 0.08;
  BUB.forEach((b, i) => { b.visible = true; const k = (t * 0.25 + i * 0.063) % 1; b.position.set(2.2 + Math.sin(i * 2.1) * 0.6, 1.6 + k * 3.5, -3.2 + Math.cos(i) * 0.4); });
  const op = quiz ? 1 : clamp((t - 4.2) / 1.0); DOOR.rotation.y = -op * 1.9;
  if (op > 0.5) { SKETCH.visible = true; const k = quiz ? 1 : clamp((t - 5.0) / 1.6); SKETCH.position.set(0.3, lerp(0.5, 1.45, ease(k)), lerp(-2.2, -1.5, ease(k))); SKETCH.rotation.y = Math.sin(t * 0.8) * 0.15; }
  if (!quiz) { tSafe.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSafe.visible = false; tPic.userData.pop((t - 5.2) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.4, -0.1, u), lerp(1.4, 1.5, u), lerp(2.6, 2.0, u), 0.3, 1.0, -2.4, 60);
  return qs;
}
function shotBar(t) { // 2段目 9〜17：主人公は、画家を目指す貧しい青年。ポーカーの賭けで、船の切符を手に入れた
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.0;
  jack2.userData.arms.forEach(a => a.rotation.x = -1.2);
  if (t > 4.2) { jack2.userData.arms[1].rotation.x = -2.6; TICKET.visible = true; TICKET.position.set(AX - 0.55, 2.15 + Math.sin(t * 4) * 0.04, -0.75); TICKET.rotation.set(0, Math.PI, Math.sin(t * 3) * 0.2);
    OPP.forEach(p => { p.userData.head.rotation.x = 0.4; }); }
  tPainter.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPainter.visible = false; tBet.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.5, 0.3, u), 2.4, lerp(-3.8, -3.3, u), AX - 0.2, 1.3, -0.7, 58);
  return qs;
}
function shotDecks(t) { // 3段目 17〜25：巨大な船の上。豪華な上の階と、にぎやかな下の階
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.2; S.darken(0.3, '#1a1a24');
  UPS.forEach((p, i) => { p.userData.arms[0].rotation.x = -0.6; p.userData.head.rotation.y = Math.sin(t * 0.5 + i) * 0.2; });
  LOWS.forEach((p, i) => { const ph = t * 6 + i; p.position.y = 0.14 + (t > 4.2 ? Math.abs(Math.sin(ph)) * 0.18 : 0); p.rotation.y = t > 4.2 ? Math.sin(t * 2 + i) * 0.8 : 0; p.userData.arms.forEach(a => a.rotation.x = t > 4.2 ? -2.4 + Math.sin(ph) * 0.4 : 0); });
  if (t > 4.2) NOTES.forEach((n, i) => { n.visible = true; const k = ((t - 4.2) * 0.5 + i * 0.17) % 1; n.position.set(BX - 3 + i * 1.2, 1.6 + k * 1.2, -1.6); n.material.opacity = 1 - k; });
  tUp.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUp.visible = false; tLow.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.0) look(BX + 0.3, 4.6, lerp(5.4, 4.8, u), BX, 4.4, -2.4, 58);
  else look(BX + 0.3, 1.7, lerp(5.0, 4.6, u), BX, 1.5, -2.2, 58);
  return qs;
}
function shotDeckNight(t) { // 4段目 25〜33：婚約を強いられた、名家の娘と出会う。身分の差を越えて、惹かれ合うふたり
  base(); S.aim(CX, -2); lift(0); S.darken(0.75, '#0a1020'); S.hemi.intensity = 0.65;
  rose4.userData.head.rotation.x = t < 4.2 ? 0.25 : 0; rose4.userData.arms[1].rotation.x = t < 4.2 ? -0.5 : -0.3;
  if (t < 4.2) { RING.visible = true; RING.position.set(CX - 0.4, 1.0, -2.1); RING.rotation.y = t; }
  const k = clamp((t - 4.2) / 2.0); jack4.position.x = CX + lerp(0.9, 0.5, ease(k)); rose4.position.x = CX - lerp(0.9, 0.5, ease(k));
  if (t > 5.5) { HEART.visible = true; HEART.userData.pop((t - 5.5) / 0.4); HEART.position.set(CX, 2.15 + Math.sin(t * 2) * 0.05, -2.4); }
  tEngaged.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tEngaged.visible = false; tBeyond.userData.pop((t - 4.2) / 0.35);
  if (t > 4.2) tBeyond.position.y = 2.9;
  const u = ease(t / 8);
  look(CX + lerp(0.3, 0.2, u), lerp(1.7, 1.6, u), lerp(1.6, 1.0, u), CX, 1.5, -2.4, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：1997年の、アメリカ映画。アカデミー賞で、11部門を受賞
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#0a0810');
  CUPS.forEach((c, i) => { c.visible = t > 4.2 && t - 4.2 > i * 0.15; c.position.y = 0.6 + (c.visible ? Math.max(0, 0.3 - (t - 4.2 - i * 0.15) * 1.5) : 0); });
  t1997.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t1997.visible = false; tAward.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.6, 2.8, u), lerp(5.4, 4.6, u), TX, 2.2, -3.4, 58);
  return qs;
}
function shotShip(t) { // 6段目 42〜49（決め手）：1912年。史上最大の豪華客船の、最初の航海
  base(); S.aim(DX, -10); lift(0); S.hemi.intensity = 1.35; S.key.intensity = 1.6;
  SHIP.position.x = DX + 4 + t * 0.35;
  SMOKE.forEach((s, i) => { s.visible = true; const f = i % 4, k = ((t * 0.3 + i * 0.25) % 1); s.position.set(SHIP.position.x - 6 + f * 3.6 + 0.4 - k * 3, 9.0 + k * 2.4, -14); s.scale.setScalar(0.6 + k * 1.2); s.material.opacity = 0.6 * (1 - k); });
  CROWD.forEach((p, i) => { p.userData.arms[1].rotation.x = -2.6 + Math.sin(t * 6 + i) * 0.4; });
  t1912.userData.pop((t - 0.3) / 0.35); if (t > 3.2) t1912.visible = false; tFirst.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-6, -5, u), lerp(4.0, 4.4, u), lerp(9, 8, u), DX + 3, 5.0, -14, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（海の底に戻る）
  shotDeep(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.45, 0.3, d); S.darken(0.82 + 0.1 * d, '#04121e');
  const k = ease(t / 7);
  look(lerp(-0.1, 0.0, k), 1.5, lerp(2.0, 1.6, k), 0.3, 1.0, -2.4, 60);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotDeep(t, 0) },
  { a: 9, b: 17, f: shotBar },
  { a: 17, b: 25, f: shotDecks },
  { a: 25, b: 33, f: shotDeckNight },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotShip },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '海の底で見つかった、<br>古い金庫。'],
  [5.6, 9.0, '中にあったのは、宝石<br>ではなく1枚の絵。'],
  [9.2, 13.2, '主人公は、画家を<br>目指す貧しい青年。'],
  [13.2, 17.0, 'ポーカーの賭けで、<br>船の切符を手に入れた。'],
  [17.2, 21.0, '巨大な船の上。<br>豪華な上の階と、'],
  [21.0, 25.0, '歌と踊りでにぎやかな、<br>下の階。'],
  [25.2, 29.0, '母に婚約を強いられた、<br>名家の娘と出会う。'],
  [29.0, 33.0, '身分の差を越えて、<br>惹かれ合うふたり。'],
  [33.2, 37.4, '1997年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>11部門を受賞。'],
  [42.2, 45.4, '1912年。史上最大の<br>豪華客船の、'],
  [45.4, 49.0, 'はじめての航海。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>タイタニック。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q077', v2: true, answer: 'タイタニック',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 7777,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '海の底': 'うみのそこ', '見つかった': 'みつかった', '古い': 'ふるい', '金庫': 'きんこ', '中': 'なか', '宝石': 'ほうせき', '1枚': 'いちまい', '絵': 'え', '主人公': 'しゅじんこう', '画家': 'がか', '目指す': 'めざす', '貧しい': 'まずしい', '青年': 'せいねん', '賭け': 'かけ', '船': 'ふね', '切符': 'きっぷ', '手に入れた': 'てにいれた', '巨大': 'きょだい', '上': 'うえ', '豪華': 'ごうか', '階': 'かい', '歌': 'うた', '踊り': 'おどり', '下': 'した', '母': 'はは', '婚約': 'こんやく', '強いられた': 'しいられた', '名家': 'めいか', '娘': 'むすめ', '出会う': 'であう', '身分': 'みぶん', '差': 'さ', '越えて': 'こえて', '惹かれ合う': 'ひかれあう', '1997年': 'せんきゅうひゃくきゅうじゅうななねん', 'アメリカ映画': 'アメリカえいが', 'アカデミー賞': 'アカデミーしょう', '11部門': 'じゅういちぶもん', '受賞': 'じゅしょう', '1912年': 'せんきゅうひゃくじゅうにねん', '史上最大': 'しじょうさいだい', '客船': 'きゃくせん', '航海': 'こうかい', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n海の底で見つかった、古い金庫。中にあったのは、宝石ではなく1枚の絵。主人公は、画家を目指す貧しい青年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'Hulu', '映画好き', '名作映画'],
  },
});
applyQuizCards({ answer: 'タイタニック', info: 'Disney+・Hulu｜映画・189分', answerSize: 124 });
