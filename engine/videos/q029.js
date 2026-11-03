import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #029 バック・トゥ・ザ・フューチャー（映画・アメリカ・1985年・116分・SF。U-NEXT・Hulu・Prime Videoで見放題、
//   justwatch.com/jp/映画/batsukutouzahuyuchiya で2026/11/3確認。Filmarks 4.3・レビュー289,250件 filmarks.com/movies/7420）
// 確かめた事実（movie.jorudan.co.jp/film/07235/ の解説とあらすじ・上映時間116分）：
//   ・1985年10月25日、音楽好きの高校生マーティは、知り合いの一風変わった科学者ブラウン博士に、夜中の1時すぎに広場へ来るよう言われる。そこには改造車デロリアン。実はタイムマシン。
//   ・マーティはデロリアンで逃げ、時速140キロをこえたためタイムスリップ。着いた所は1955年。パパとママがまだ知り合う前。
//   ・ところがママがマーティに一目ぼれ。ママがパパを好きにならないと、マーティはこの世に存在しなくなってしまう。
//   ・街の大広場には時計台がある。エグゼクティブ・プロデューサーはスティーブン・スピルバーグほか。監督はロバート・ゼメキス
//   ・主人公マーティが親友の科学者ドクとデロリアンで30年前へタイムスリップ（ciatr.jp/topics/228482）
// 構成（ヒント6段）：1 夜中の1時すぎ、駐車場に呼び出された。待っていたのは変わり者の科学者 → 2 音楽好きの高校生、気がつくと30年前の町
//   → 3 丸っこい車と昔ながらの店、広場には時計台 → 4 若い頃のママが自分に一目ぼれ、このままだと自分が消える
//   → 5 1985年のアメリカのSF、製作総指揮スピルバーグ → 6 決め手：改造した車がタイムマシン、時速140キロで時を超える
// 車は実在の車種の形にしない（汎用の箱の車）。雷の時計台・炎のタイヤのあと・主人公の服装など有名な場面や見た目はなぞらない。結末には触れない。俳優・ポスター・ロゴは使わない

const S = quizStage({ bg: '#121826', floor: '#1e2430', fogNear: 22, fogFar: 80 });
const qs = S.scene;
const R = rng(2929);

const BOY = { skin: '#f1cfb0', hair: '#5a3a22', shirt: '#3f7f6b', pants: '#2b3a5a' };
const SCI = { skin: '#efd2b8', hair: '#e8e8ec', shirt: '#f2f2f0', pants: '#4a4a52' };
const MOM = { skin: '#f3d2b4', hair: '#8a4a2a', shirt: '#e88aa0', pants: '#f2e8f0', long: true, skirt: true };
const DAD = { skin: '#efcfae', hair: '#2a2220', shirt: '#c8b890', pants: '#5a5040' };
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }
// 汎用の箱の車（実在の車種の形にしない）
function makeCar(body = '#b8bcc4', round = false) {
  const g = new THREE.Group(); const bm = new THREE.MeshStandardMaterial({ color: body, metalness: 0.5, roughness: 0.35 });
  const b = box(1.9, 0.5, 4.0, bm); b.position.y = 0.55; g.add(b);
  const cab = box(1.6, 0.48, round ? 1.9 : 1.6, bm); cab.position.set(0, 1.02, round ? -0.1 : -0.3); g.add(cab);
  const gl = new THREE.MeshStandardMaterial({ color: '#223044', metalness: 0.2, roughness: 0.1 });
  const ws = box(1.5, 0.38, 0.04, gl); ws.position.set(0, 1.02, (round ? -0.1 : -0.3) + (round ? 0.96 : 0.81)); g.add(ws);
  for (const s of [-1, 1]) { const sw = box(0.04, 0.34, round ? 1.5 : 1.2, gl); sw.position.set(s * 0.81, 1.02, round ? -0.1 : -0.3); g.add(sw); }
  for (const [x, z] of [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.3], [0.9, -1.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16), mat('#1a1a1e')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w); }
  for (const s of [-1, 1]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.04), new THREE.MeshBasicMaterial({ color: '#fff4c8' })); hl.position.set(s * 0.62, 0.62, 2.01); g.add(hl); const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.04), new THREE.MeshBasicMaterial({ color: '#d02a2a' })); tl.position.set(s * 0.62, 0.62, -2.01); g.add(tl); }
  if (round) { for (const s of [-1, 1]) { const fn = box(0.12, 0.3, 1.2, bm); fn.position.set(s * 0.95, 0.85, -1.5); g.add(fn); } }
  return g;
}

// ---------- 1段目. 夜中の駐車場（x=0）。呼び出された高校生と、変わり者の科学者。シートをかけた何か ----------
{ const lot = box(16, 0.04, 14, mat('#2c2f36')); lot.position.set(0, 0.02, -1); qs.add(lot);
  for (let i = -4; i <= 4; i++) { const ln = box(0.08, 0.01, 2.6, new THREE.MeshBasicMaterial({ color: '#d8d8c8' })); ln.position.set(i * 1.6, 0.05, -3.2); qs.add(ln); }
  const mall = box(16, 4, 1, mat('#4a4a58')); mall.position.set(0, 2, -6.5); qs.add(mall);
  for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ color: i % 2 ? '#3a4458' : '#e8c890' })); w.position.set(-6 + i * 2.4, 1.6, -5.98); qs.add(w); }
  for (const x of [-3.2, 3.2]) { const pl = box(0.12, 4, 0.12, mat('#3a3c44')); pl.position.set(x, 2, -1.8); qs.add(pl); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.3), new THREE.MeshBasicMaterial({ color: '#ffe8b8' })); bl.position.set(x, 4, -1.8); qs.add(bl); } }
const GLOW = new THREE.PointLight(0x6ac8ff, 0, 6, 1.5); GLOW.position.set(0.3, 0.3, -1.2); qs.add(GLOW);
const LOTLIGHT = new THREE.SpotLight(0xfff0d0, 0, 14, 0.8, 0.5, 0.8); LOTLIGHT.position.set(0, 5, 1); LOTLIGHT.target.position.set(0, 0, -0.5); qs.add(LOTLIGHT); qs.add(LOTLIGHT.target);
const boy1 = makePerson(BOY); boy1.position.set(-1.6, 0, 0.8); qs.add(boy1);
const sci1 = makePerson(SCI); sci1.position.set(1.3, 0, -0.6); sci1.rotation.y = -0.6; qs.add(sci1);
const SHEET = new THREE.Group(); SHEET.position.set(0.3, 0, -2.6); qs.add(SHEET);
{ const sm = mat('#c8c4b8'); const a = box(2.1, 0.75, 4.2, sm); a.position.y = 0.48; SHEET.add(a); const c = box(1.7, 0.5, 1.9, sm); c.position.set(0, 1.05, -0.3); SHEET.add(c); SHEET.rotation.y = 1.2; }
const tNight = tag('夜中の1時すぎ', { size: 70, w: 480, bg: '#14161c', sx: 1.6 }); tNight.position.set(-0.4, 2.7, 0.6); qs.add(tNight);
const tOdd = tag('変わり者の科学者', { size: 60, w: 560, bg: '#e2483c', sx: 1.5 }); tOdd.position.set(0.9, 2.45, -0.4); qs.add(tOdd);

// ---------- 2段目. めくれていくカレンダー（x=30）。気がつくと30年前 ----------
const MX = 30;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1a2036' })); bg.position.set(MX, 4, -3.5); qs.add(bg); }
const boy2 = makePerson(BOY); boy2.position.set(MX - 0.9, 0, 0.6); boy2.rotation.y = 0.3; qs.add(boy2);
const GUITAR = new THREE.Group(); { const b = box(0.36, 0.48, 0.1, mat('#c8402a')); GUITAR.add(b); const n = box(0.07, 0.6, 0.06, mat('#3a2a1a')); n.position.y = 0.52; GUITAR.add(n); } GUITAR.position.set(0.05, 1.05, 0.2); GUITAR.rotation.z = -0.9; boy2.add(GUITAR);
const CAL = new THREE.Group(); CAL.position.set(MX + 0.9, 2.1, -1.5); qs.add(CAL);
{ const back = box(1.8, 2.2, 0.1, mat('#e8e4d8')); CAL.add(back); const top = box(1.8, 0.4, 0.14, mat('#c8261d')); top.position.y = 1.0; CAL.add(top); }
function calTex(txt) { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f8f6ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${txt.length > 3 ? 70 : 92}px "Noto Sans CJK JP", sans-serif`; g.fillText(txt, w / 2, h / 2 + 6); }); }
const PAGE_T = ['今日', '1年前', '5年前', '10年前', '15年前', '20年前', '25年前'].map(x => calTex(x));
const PAGE_LAST = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f8f6ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8261d'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 76px "Noto Sans CJK JP", sans-serif'; g.fillText('30年前', w / 2, h / 2 + 4); });
const PAGE = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: PAGE_T[0] })); PAGE.position.set(0, -0.15, 0.07); CAL.add(PAGE);
const FLIP = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: '#f8f6ee', side: THREE.DoubleSide })); FLIP.geometry.translate(0, 0.8, 0); FLIP.position.set(0, -0.95, 0.09); CAL.add(FLIP);
const tMusic = tag('音楽好きの高校生', { size: 60, w: 560, bg: '#14161c', sx: 1.5 }); tMusic.position.set(MX - 0.9, 2.45, 0.7); qs.add(tMusic);
const t30 = tag('気がつくと30年前', { size: 62, w: 580, bg: '#e2483c', sx: 1.6 }); t30.position.set(MX, 3.75, -1.0); qs.add(t30);

// ---------- 3段目. ひと昔前の町（x=60）：丸っこい車、昔ながらの店、広場の時計台 ----------
const TX = 60;
{ const rd = box(26, 0.04, 10, mat('#4a4a50')); rd.position.set(TX, 0.02, 0); qs.add(rd);
  const sq = box(10, 0.06, 4, mat('#5a7a4a')); sq.position.set(TX, 0.03, -6); qs.add(sq);
  const shopC = ['#d8a8a0', '#a8c8d8', '#f0d8a0', '#b8d8b0'];
  for (let i = 0; i < 4; i++) { const sx = TX - 9 + i * 2.6 + (i > 1 ? 8 : 0); const b = box(2.4, 3.2, 2, mat(shopC[i])); b.position.set(sx, 1.6, -3.6); qs.add(b);
    const aw = box(2.4, 0.12, 0.8, mat(i % 2 ? '#c8402a' : '#2a6a8a')); aw.position.set(sx, 2.3, -2.3); aw.rotation.x = 0.35; qs.add(aw);
    const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: '#f0e0b0' })); wn.position.set(sx, 1.3, -2.59); qs.add(wn);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), new THREE.MeshBasicMaterial({ color: ['#e85a8a', '#4ad8e8', '#f0b840', '#8ae860'][i] })); sg.position.set(sx, 2.9, -2.59); qs.add(sg); } }
const HALL = new THREE.Group(); HALL.position.set(TX, 0, -9); qs.add(HALL);
{ const b = box(7, 4.5, 2.6, mat('#d8ccb0')); b.position.y = 2.25; HALL.add(b); const tw = box(2, 3.6, 2, mat('#d0c4a8')); tw.position.y = 6.3; HALL.add(tw); const rf = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.2, 4), mat('#6a4a3a')); rf.position.y = 8.7; rf.rotation.y = Math.PI / 4; HALL.add(rf);
  for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) { const c = box(0.3, 3.4, 0.3, mat('#f0e8d8')); c.position.set(x, 1.9, 1.35); HALL.add(c); } }
const CLOCK = new THREE.Group(); CLOCK.position.set(TX, 6.6, -7.95); qs.add(CLOCK);
{ const f = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 32), new THREE.MeshBasicMaterial({ color: '#f8f2e0' })); f.rotation.x = Math.PI / 2; CLOCK.add(f); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const tk = box(0.04, 0.14, 0.02, mat('#2a2a2e')); tk.position.set(Math.sin(a) * 0.6, Math.cos(a) * 0.6, 0.04); tk.rotation.z = -a; CLOCK.add(tk); } }
const CH1 = box(0.05, 0.5, 0.03, mat('#2a2a2e')); CH1.geometry.translate(0, 0.22, 0); CH1.position.z = 0.06; CLOCK.add(CH1);
const CH2 = box(0.06, 0.36, 0.03, mat('#2a2a2e')); CH2.geometry.translate(0, 0.16, 0); CH2.position.z = 0.07; CLOCK.add(CH2);
const OLDCARS = [['#7ac8c0', -1], ['#e86a6a', 1], ['#f0e0b0', -1]].map(([c, d], i) => { const car = makeCar(c, true); car.scale.setScalar(0.85); car.rotation.y = d * Math.PI / 2; car.userData.d = d; car.userData.x0 = TX - 6 + i * 6; car.userData.z = d > 0 ? 1.4 : -0.4; qs.add(car); return car; });
const boy3 = makePerson(BOY); boy3.position.set(TX, 0, 2.4); boy3.rotation.y = Math.PI; qs.add(boy3);
const tOld = tag('ひと昔前の町', { size: 70, w: 460, bg: '#e6b450', color: '#14161c', sx: 2.2 }); tOld.position.set(TX, 4.8, -2); qs.add(tOld);
const tClock = tag('広場の時計台', { size: 66, w: 460, bg: '#14161c', sx: 2.2 }); tClock.position.set(TX, 9.6, -7.8); qs.add(tClock);

// ---------- 4段目. 若い頃のママとパパ（x=90）。ママが自分に一目ぼれ、自分が消えそうに ----------
const PX = 90;
{ const fl = box(12, 0.04, 8, mat('#8a6a4a')); fl.position.set(PX, 0.02, 0); qs.add(fl); const wl = box(12, 5, 0.2, mat('#e8d8c0')); wl.position.set(PX, 2.5, -2.6); qs.add(wl);
  for (let i = 0; i < 6; i++) { const t = box(1.6, 0.12, 0.04, mat(['#e86a6a', '#7ac8c0'][i % 2])); t.position.set(PX - 5 + i * 2, 3.6, -2.48); qs.add(t); }
  const ctr = box(5, 1.0, 0.7, mat('#d84a4a')); ctr.position.set(PX - 3.5, 0.5, -1.8); qs.add(ctr); }
const boy4 = makePerson(BOY); boy4.position.set(PX, 0, 0.3); qs.add(boy4);
const mom = makePerson(MOM); mom.position.set(PX - 1.15, 0, 0.1); mom.rotation.y = 0.7; qs.add(mom);
const dad = makePerson(DAD); dad.position.set(PX + 1.25, 0, -0.2); dad.rotation.y = -0.5; qs.add(dad);
{ const gl = box(0.42, 0.08, 0.04, mat('#1a1a1a')); gl.position.set(0, 0.27, 0.2); dad.userData.head.add(gl); }
const boyMats = []; boy4.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; boyMats.push(o.material); } });
const HEARTTEX = canvasTex(128, 128, (g) => { g.fillStyle = '#ff4a7a'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(10, 70, 6, 30, 36, 22); g.bezierCurveTo(52, 18, 62, 30, 64, 40); g.bezierCurveTo(66, 30, 76, 18, 92, 22); g.bezierCurveTo(122, 30, 118, 70, 64, 112); g.fill(); });
const HEARTS = []; for (let i = 0; i < 5; i++) { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: HEARTTEX, transparent: true, depthTest: false })); h.scale.setScalar(0.32); h.renderOrder = 6; qs.add(h); HEARTS.push(h); }
const tMom = tag('若い頃のママ', { size: 58, w: 420, bg: '#e88aa0', color: '#14161c', sx: 1.2 }); tMom.position.set(PX - 1.15, 2.35, 0.1); qs.add(tMom);
const tDad = tag('若い頃のパパ', { size: 58, w: 420, bg: '#c8b890', color: '#14161c', sx: 1.2 }); tDad.position.set(PX + 1.25, 2.35, -0.2); qs.add(tDad);
const tVanish = tag('自分が消える！', { size: 70, w: 500, bg: '#e2483c', sx: 1.5 }); tVanish.position.set(PX, 2.7, 0.3); qs.add(tVanish);

// ---------- 5段目. 映画館（x=120）。1985年のアメリカのSF ----------
const CX = 120;
{ const fl = box(14, 0.04, 10, mat('#3a1a22')); fl.position.set(CX, 0.02, 0); qs.add(fl);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.2), new THREE.MeshBasicMaterial({ color: '#16224a' })); scr.position.set(CX, 3.0, -4); qs.add(scr);
  for (const s of [-1, 1]) { const cu = box(1.2, 6, 0.3, mat('#8a1a22')); cu.position.set(CX + s * 4.6, 3, -3.9); qs.add(cu); } }
const SEATS = []; for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const s = box(0.7, 0.8, 0.6, mat('#a8202a')); s.position.set(CX - 3 + i * 1.0, 0.4 + r * 0.25, 1.0 + r * 1.2); qs.add(s); SEATS.push(s); }
const AUD = []; for (let i = 0; i < 4; i++) { const p = makePerson({ skin: '#e8c8a8', hair: ['#2a2220', '#6a4a2a', '#1a1a1a', '#8a6a4a'][i], shirt: ['#3a5a8a', '#8a5a4a', '#4a6a4a', '#6a4a7a'][i], pants: '#2a2a32' }); p.position.set(CX - 2 + i * 1.3 + (i > 1 ? 0.3 : 0), 0.15, 1.3); p.rotation.y = Math.PI; p.scale.setScalar(0.9); qs.add(p); AUD.push(p); }
const STARS = []; for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshBasicMaterial({ color: '#ffffff' })); s.userData.a = R() * Math.PI * 2; s.userData.r = R(); s.userData.o = R(); qs.add(s); STARS.push(s); }
const tUSA = tag('1985年 アメリカ映画', { size: 62, w: 680, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tUSA.position.set(CX, 5.6, -3.6); qs.add(tUSA);
const tSF = tag('SF × 青春の冒険', { size: 66, w: 600, bg: '#e2483c', sx: 3.0 }); tSF.position.set(CX, 5.6, -3.6); qs.add(tSF);

// ---------- 6段目. 夜の一本道（x=150）。改造した車がタイムマシン、時速140キロで ----------
const RX = 150;
{ const rd = box(6, 0.04, 80, mat('#2a2c32')); rd.position.set(RX, 0.02, -20); qs.add(rd);
  for (let i = 0; i < 20; i++) { const ln = box(0.12, 0.01, 1.4, new THREE.MeshBasicMaterial({ color: '#e8d870' })); ln.position.set(RX, 0.05, 10 - i * 4); qs.add(ln); } }
const car6 = makeCar('#c8ccd4'); car6.position.set(RX, 0, 0); car6.rotation.y = Math.PI; qs.add(car6);
const CARLIGHT = new THREE.PointLight(0xdfe8ff, 0, 10, 1.2); qs.add(CARLIGHT);
const COILS = []; for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 20), new THREE.MeshBasicMaterial({ color: '#7ad8ff' })); c.position.set(0, 0.95, -1.4 - i * 0.22); car6.add(c); COILS.push(c); }
const GAUGE_TEX = (v) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#14161c'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e6b450'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 104, Math.PI * 0.75, Math.PI * 2.25); g.stroke(); });
const GAUGE = new THREE.Sprite(new THREE.SpriteMaterial({ map: GAUGE_TEX(0), depthTest: false })); GAUGE.scale.setScalar(1.3); GAUGE.renderOrder = 7; qs.add(GAUGE);
const NEEDLE = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.5), new THREE.MeshBasicMaterial({ color: '#e2483c', depthTest: false })); NEEDLE.geometry.translate(0, 0.22, 0); NEEDLE.renderOrder = 8; qs.add(NEEDLE);
const SPEEDC = document.createElement('canvas'); SPEEDC.width = 512; SPEEDC.height = 160; const SPEEDT = new THREE.CanvasTexture(SPEEDC); SPEEDT.colorSpace = THREE.SRGBColorSpace;
const SPEED = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPEEDT, depthTest: false, transparent: true })); SPEED.scale.set(1.6, 0.5, 1); SPEED.renderOrder = 9; qs.add(SPEED);
let lastSpeed = -1;
function setSpeed(v) { if (v === lastSpeed) return; lastSpeed = v; const g = SPEEDC.getContext('2d'); g.clearRect(0, 0, 512, 160); g.fillStyle = 'rgba(10,12,18,.88)'; g.beginPath(); g.roundRect(6, 6, 500, 148, 30); g.fill(); g.fillStyle = v >= 140 ? '#ff5a4a' : '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 92px "Noto Sans CJK JP", sans-serif'; g.fillText(`時速${v}キロ`, 256, 84); SPEEDT.needsUpdate = true; }
const FLASH = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0, depthWrite: false })); qs.add(FLASH);
const SPARK = []; for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ color: '#9ae0ff', transparent: true })); s.userData.v = new THREE.Vector3(R() - 0.5, R() * 0.8, R() - 0.5).multiplyScalar(4); qs.add(s); SPARK.push(s); }
const tMachine = tag('この車がタイムマシン', { size: 60, w: 660, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tMachine);

// ---------- クイズ：夜の町の広場。時計台を見上げる高校生（x=60 を夜に） ----------

// ---------- shots ----------
const ALL = [tNight, tOdd, tMusic, t30, tOld, tClock, tMom, tDad, tVanish, tUSA, tSF, tMachine];
function base() { S.reset(); GLOW.intensity = 0; CARLIGHT.intensity = 0; ALL.forEach(x => x.visible = false); LOTLIGHT.intensity = 0; HEARTS.forEach(h => h.visible = false); STARS.forEach(s => s.visible = false); GAUGE.visible = false; NEEDLE.visible = false; SPEED.visible = false; FLASH.visible = false; SPARK.forEach(s => s.visible = false); OLDCARS.forEach(c => c.visible = false); car6.visible = true; }

function shotLot(t, T) { // 1段目 0〜9：夜中の1時すぎ、駐車場に呼び出された。待っていたのは、変わり者の科学者（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-60);
  S.hemi.intensity = 0.6; S.key.intensity = 0.3; S.darken(0.7, '#05070e'); LOTLIGHT.intensity = 60; GLOW.intensity = 6 + 4 * Math.sin(T * 5);
  const k = ease(T / 3.2); boy1.position.set(lerp(-1.6, -1.0, k), 0, lerp(1.0, 0.5, k)); boy1.rotation.y = lerp(0.6, 1.0, k); walk(boy1, T * 7, T < 3.2 ? 1 : 0);
  sci1.userData.arms[1].rotation.x = T > 4.4 ? -2.6 * ease((T - 4.4) / 0.5) : 0; sci1.userData.arms[1].rotation.z = T > 4.4 ? 0.3 : 0;
  SHEET.children.forEach((c, i) => { c.position.x = Math.sin(T * 3 + i) * 0.01; });
  tNight.userData.pop(1); tNight.position.set(boy1.position.x + 0.5, 2.45, boy1.position.z); if (T > 4.2) tNight.visible = false;
  tOdd.userData.pop((T - 4.6) / 0.35);
  const u = ease(T / 9);
  look(lerp(-0.6, -0.2, u), lerp(2.6, 2.4, u), lerp(8.2, 7.4, u), lerp(-0.4, 0.0, u), 1.2, -0.8, 54);
  return qs;
}
function shotYears(t) { // 2段目 9〜17：音楽好きの高校生。気がつくと、30年前の町にいた（カレンダーが逆にめくれる）
  base(); S.aim(MX, 0); lift(-40); S.hemi.intensity = 1.2;
  const idx = clamp(Math.floor((t - 2.6) / 0.4), -1, 6);
  PAGE.material.map = idx >= 6 ? PAGE_LAST : PAGE_T[Math.max(0, idx)]; PAGE.visible = true; if (idx < 0) PAGE.material.map = PAGE_T[0];
  const fk = ((t - 2.6) / 0.4) % 1; FLIP.visible = t > 2.6 && idx < 6; FLIP.rotation.x = -fk * Math.PI;
  boy2.userData.head.rotation.y = t > 4.4 ? 0.6 * ease((t - 4.4) / 0.6) : 0;
  tMusic.userData.pop((t - 0.5) / 0.35); if (t > 3.9) tMusic.visible = false;
  t30.userData.pop((t - 5.3) / 0.35);
  const u = ease(t / 8);
  look(MX + lerp(-0.6, 0.0, u), lerp(1.9, 2.2, u), lerp(6.4, 6.0, u), MX, lerp(1.6, 1.9, u), -0.6, 54);
  return qs;
}
function shotTown(t, night = 0) { // 3段目 17〜25：丸っこい車に、昔ながらの店。広場には大きな時計台
  base(); S.aim(TX, 0); lift(night ? -60 : -20);
  if (!night) { S.scene.background.set('#8ab4d8'); S.scene.fog.color.copy(S.scene.background); S.hemi.intensity = 1.4; }
  OLDCARS.forEach(c => { c.visible = true; const x = c.userData.x0 + c.userData.d * t * 1.6; c.position.set(TX + (((x - TX + 12) % 24) + 24) % 24 - 12, 0, c.userData.z); });
  CH1.rotation.z = -t * 0.4; CH2.rotation.z = -t * 0.04;
  boy3.userData.head.rotation.x = -0.2 * ease((t - 4.4) / 0.8);
  if (!night) { tOld.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tOld.visible = false; tClock.userData.pop((t - 4.6) / 0.35); }
  const pan = ease((t - 3.8) / 1.6);
  if (!night) look(TX, lerp(2.2, 3.4, pan), lerp(9.0, 8.4, pan), TX, lerp(1.8, 5.6, pan), lerp(-1, -6, pan), 56);
  return qs;
}
function shotParents(t) { // 4段目 25〜33：若い頃のママが、自分に一目ぼれ。このままだと、自分が消えてしまう
  base(); S.aim(PX, 0); lift(-40); S.hemi.intensity = 1.3;
  tMom.userData.pop((t - 0.4) / 0.35); tDad.userData.pop((t - 0.9) / 0.35); if (t > 2.6) { tMom.visible = false; tDad.visible = false; }
  HEARTS.forEach((h, i) => { const k = (t - 2.6 - i * 0.35); h.visible = k > 0 && t < 4.2 + 3; const u = clamp(k / 1.2); h.position.set(lerp(PX - 0.95, PX - 0.15, u) + Math.sin(k * 4 + i) * 0.08, 2.0 + u * 0.5 + i * 0.06, 0.3); h.material.opacity = 1 - clamp((k - 2.2) / 0.6); });
  mom.userData.head.rotation.y = 0.3; mom.userData.arms[1].rotation.x = t > 2.6 ? -0.5 : 0;
  dad.userData.head.rotation.x = 0.25;
  const fade = 1 - 0.75 * ease((t - 4.6) / 2.0) + 0.08 * Math.sin(t * 18) * clamp((t - 4.6) / 0.5);
  boyMats.forEach(m => { m.opacity = clamp(fade); m.depthWrite = fade > 0.98; });
  boy4.userData.head.rotation.x = t > 4.6 ? 0.4 : 0; boy4.userData.arms[0].rotation.x = t > 4.6 ? -1.2 : 0;
  tVanish.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 8);
  look(PX + lerp(-0.2, 0.2, u), lerp(1.9, 2.0, u), lerp(7.0, 6.4, u), PX, 1.4, 0, 54);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1985年公開の、アメリカのSF映画。製作総指揮はスピルバーグ
  base(); S.aim(CX, 0); lift(-20); S.hemi.intensity = 0.5; S.key.intensity = 0.3; S.darken(0.75, '#05060a');
  STARS.forEach(s => { s.visible = true; const r = ((s.userData.r + t * 0.25) % 1); s.position.set(CX + Math.cos(s.userData.a) * r * 3.8, 3.0 + Math.sin(s.userData.a) * r * 2.0, -3.95); s.scale.setScalar(0.5 + r * 2); s.material.color.set('#ffffff'); });
  tUSA.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUSA.visible = false;
  tSF.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(CX, lerp(2.6, 2.8, u), lerp(7.2, 6.4, u), CX, lerp(2.4, 3.0, u), -3, 58);
  return qs;
}
function z0(t) { return -(t * 3 + Math.max(0, t - 1.8) ** 2 * 1.4); }
function shotDrive(t) { // 6段目 42〜49（決め手）：改造した車が、タイムマシン。時速140キロで、時を超える
  base(); S.aim(RX, z0(t)); lift(200); S.hemi.intensity = 1.1; S.key.intensity = 0.8; S.darken(0.6, '#04060c');
  const v = Math.min(140, Math.round(40 + 100 * easeOut(clamp((t - 1.8) / 3.2))));
  const z = -(t * 3 + Math.max(0, t - 1.8) ** 2 * 1.4);
  const gone = t > 5.2;
  car6.position.set(RX, 0, z); car6.visible = !gone;
  CARLIGHT.intensity = gone ? 0 : 14; CARLIGHT.position.set(RX + 1.5, 3, z + 3);
  COILS.forEach((c, i) => { c.material.color.set(v >= 120 ? '#ffffff' : '#7ad8ff'); c.scale.setScalar(1 + (v >= 120 ? 0.15 * Math.sin(t * 30 + i) : 0)); });
  tMachine.position.set(RX, 2.1, z); tMachine.userData.pop((t - 0.4) / 0.35); if (t > 3.0) tMachine.visible = false;
  SPEED.visible = t > 3.0 && !gone; setSpeed(v); SPEED.position.set(RX, 2.1, z);
  if (t > 5.0) { const k = clamp((t - 5.0) / 0.9); FLASH.visible = true; FLASH.position.set(RX, 0.9, -(5.2 * 3 + (3.4) ** 2 * 1.4)); FLASH.scale.setScalar(0.5 + k * 3.5); FLASH.material.opacity = (1 - k) * 0.9;
    SPARK.forEach(s => { s.visible = true; const kk = t - 5.0; s.position.copy(FLASH.position).addScaledVector(s.userData.v, kk); s.material.opacity = clamp(1 - kk / 1.6); s.lookAt(s.position.x, s.position.y, s.position.z + 1); }); }
  if (t > 5.0 && t < 5.4) { S.scene.background.lerp(new THREE.Color('#9ac8ff'), (1 - (t - 5.0) / 0.4) * 0.8); }
  const cz = gone ? -(5.2 * 3 + 3.4 ** 2 * 1.4) : z;
  look(RX + 1.8, 2.6, cz + 7.6, RX, 1.0, cz - 1, 54);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の広場。時計台を見上げる高校生）
  shotTown(t + 6, 1);
  const d = ease(t / 1.0);
  S.scene.background.set('#0a0e1c'); S.scene.fog.color.copy(S.scene.background);
  S.hemi.intensity = lerp(0.6, 0.18, d); S.key.intensity = lerp(0.4, 0, d);
  S.spot.position.set(TX, 6, 4); S.spot.target.position.set(TX, 1, 2.4); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  OLDCARS.forEach(c => c.visible = false);
  boy3.userData.head.rotation.x = -0.35;
  const k = ease(t / 7);
  look(TX + 0.8, lerp(1.8, 2.0, k), lerp(8.0, 7.2, k), TX, lerp(3.0, 3.8, k), -3, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotLot },
  { a: 9, b: 17, f: shotYears },
  { a: 17, b: 25, f: (t) => shotTown(t, 0) },
  { a: 25, b: 33, f: shotParents },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotDrive },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '夜中の1時すぎ、<br>駐車場に呼び出された。'],
  [5.6, 9.0, '待っていたのは、<br>変わり者の科学者。'],
  [9.2, 13.2, '音楽が好きな、<br>ふつうの高校生。'],
  [13.2, 17.0, '気がつくと、<br>30年前の町にいた。'],
  [17.2, 21.0, '丸っこい車に、<br>昔ながらのお店。'],
  [21.0, 25.0, '広場には、<br>大きな時計台。'],
  [25.2, 29.0, '若い頃のママが、<br>自分に一目ぼれ。'],
  [29.0, 33.0, 'このままだと、<br>自分が消えてしまう。'],
  [33.2, 37.4, '1985年公開の、<br>アメリカのSF映画。'],
  [37.4, 41.8, '製作総指揮は、<br>スティーブン・スピルバーグ。'],
  [42.2, 45.4, '改造した車が、<br>タイムマシン。'],
  [45.4, 49.0, '時速140キロで、<br>時を超える。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、バック・トゥ・ザ・フューチャー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q029', v2: true, answer: 'バック・トゥ・ザ・フューチャー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 2929,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [4.6, 13.0, 15.4, 21.6, 27.6, 29.8, 37.4, 47.2, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [12.6, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.8, 'buzz'], [33.0, 'whoosh'], [42.0, 'whoosh'], [47.0, 'poof'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '夜中': 'よなか', '1時すぎ': 'いちじすぎ', '駐車場': 'ちゅうしゃじょう', '呼び出された': 'よびだされた', '待って': 'まって', '変わり者': 'かわりもの', '科学者': 'かがくしゃ', '音楽': 'おんがく', '好き': 'すき', '高校生': 'こうこうせい', '30年前': 'さんじゅうねんまえ', '町': 'まち', '丸っこい': 'まるっこい', '車': 'くるま', '昔ながら': 'むかしながら', 'お店': 'おみせ', '広場': 'ひろば', '大きな': 'おおきな', '時計台': 'とけいだい', '若い頃': 'わかいころ', '自分': 'じぶん', '一目ぼれ': 'ひとめぼれ', '消えて': 'きえて', '1985年': 'せんきゅうひゃくはちじゅうごねん', '公開': 'こうかい', '映画': 'えいが', '製作総指揮': 'せいさくそうしき', '改造': 'かいぞう', '時速140キロ': 'じそくひゃくよんじゅっキロ', '時を超える': 'ときをこえる', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n夜中の1時すぎ、駐車場に呼び出された。待っていたのは、変わり者の科学者。音楽が好きなふつうの高校生は、気がつくと30年前の町にいた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Hulu', '映画好き', '名作映画'],
  },
});
applyQuizCards({ answer: 'バック・トゥ・<br>ザ・フューチャー', info: 'U-NEXT・Hulu｜映画・116分', answerSize: 104 });
