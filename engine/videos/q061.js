import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #061 トップガン マーヴェリック（映画・アメリカ・2022年・131分。Prime Video・Hulu で見放題
//   （U-NEXT も）、JustWatch 日本版 justwatch.com/jp/映画/top-gun-maverick で2026/11/9確認。
//   Filmarks 4.4・レビュー201,373件 filmarks.com/movies/75103）
// 確かめた事実（Filmarks の作品紹介＝配給の紹介文・ja.wikipedia.org/wiki/トップガン_マーヴェリック。2026/11/9）：
//   ・主人公は伝説のパイロット。組織に縛られない振る舞いから一向に昇進せず（昇進を拒み続け）、現役であり続ける
//   ・冒頭、極超音速の試験機の計画が凍結されると告げられ、言い渡しに来る前に離陸して目標の速度に挑む
//   ・エリート・パイロットチーム「トップガン」に教官として三十数年ぶりに呼び戻され、選りすぐられた若い精鋭に、不可能に近い任務の訓練をする
//   ・参加するパイロットの中に、かつて事故で亡くなった親友（相棒）の息子がいる
//   ・2022年5月27日公開のアメリカ映画、1986年の『トップガン』の36年振りの続編。日本の興行収入137.7億円
// 構成（ヒント6段）：1 計画は今日で中止、その前にひとりで限界の速さへ → 2 昇進を断り続けて30年以上、現役のまま
//   → 3 教官として呼び戻された、相手は選び抜かれた若者 → 4 亡き相棒の息子、不可能に近い任務
//   → 5 2022年のアメリカ映画・36年ぶりの続編・興行収入137億円 → 6 決め手：海軍のエリートパイロット養成校、伝説のパイロットが帰ってきた
// 戦闘機・海軍・養成校は6段目まで出さない（1〜5段は計器・部屋・格納庫・説明の板・映画館だけ）。人物名・コールサイン・機体名・基地名は出さない。
// 作戦の結末は言わない。俳優・ロゴ・ポスター・有名な場面の構図（空母の甲板の夕日・谷を抜ける場面・バイクなど）は使わない。人は汎用の3D

const S = quizStage({ bg: '#141a26', floor: '#1e2430', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(6161);

const HERO = { skin: '#eccaa8', hair: '#2a2220', shirt: '#6a5a44', pants: '#3a3a3e' };
const SON = { skin: '#e8c09a', hair: '#3a2a20', shirt: '#5e6a4a', pants: '#4a4e3e' };
const SUIT = { skin: '#eccaa8', hair: '#5a5a5a', shirt: '#2a3044', pants: '#1e2026', tie: true };
const CADET = (i) => ({ skin: ['#eccaa8', '#d9a57c', '#f1c9a5', '#c8946a'][i % 4], hair: ['#1a1614', '#6b4a33', '#2c2421', '#9a7a4a', '#1d1a19', '#4a3426'][i % 6], shirt: '#5e6a4a', pants: '#4a4e3e', long: i === 2 || i === 4 });

// ---------- 1段目. 夜の管制室（x=0）。大きな速度計の針が赤い所へ。警告灯が回る ----------
const DIAL_C = new THREE.Vector3(0, 3.0, -3.8);
{ const fl = box(14, 0.04, 10, mat('#22262e')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(14, 7, 0.2, mat('#2a2e38')); wl.position.set(0, 3.5, -4); qs.add(wl);
  const face = new THREE.Mesh(new THREE.CircleGeometry(2.0, 64), new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#0c1018'; g.beginPath(); g.arc(256, 256, 252, 0, Math.PI * 2); g.fill();
    g.lineWidth = 34; const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ar = a0 + (a1 - a0) * 0.78;
    g.strokeStyle = '#3a8a5a'; g.beginPath(); g.arc(256, 256, 200, a0, ar); g.stroke();
    g.strokeStyle = '#e2483c'; g.beginPath(); g.arc(256, 256, 200, ar, a1); g.stroke();
    g.strokeStyle = '#e8ecf2'; g.lineWidth = 6; for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * i / 20, r1 = i % 5 ? 170 : 150; g.beginPath(); g.moveTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1); g.lineTo(256 + Math.cos(a) * 186, 256 + Math.sin(a) * 186); g.stroke(); }
  }) })); face.position.copy(DIAL_C); qs.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.02, 0.08, 8, 64), mat('#8a909c')); rim.position.copy(DIAL_C); qs.add(rim);
  for (const x of [-4.6, 4.6]) { const sc = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(260, 160, (g, w, h) => { g.fillStyle = '#0e1a22'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4ac8a0'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 26; i++) { const x2 = i * 10, y2 = h - 20 - i * i * 0.18 - (i % 3) * 4; i ? g.lineTo(x2, y2) : g.moveTo(x2, y2); } g.stroke(); }) })); sc.position.set(x, 3.4, -3.88); qs.add(sc); }
  for (let i = 0; i < 3; i++) { const c = box(2.6, 0.95, 0.9, mat('#3a3e48')); c.position.set(-3.2 + i * 3.2, 0.48, -0.6); qs.add(c); const tp = box(2.6, 0.06, 1.0, mat('#1a1e26')); tp.position.set(-3.2 + i * 3.2, 0.98, -0.6); qs.add(tp); for (let k = 0; k < 4; k++) { const b = box(0.22, 0.03, 0.12, new THREE.MeshBasicMaterial({ color: ['#4ac8a0', '#e6b450', '#3a7ad8', '#e2483c'][k] })); b.position.set(-4.1 + i * 3.2 + k * 0.5, 1.02, -0.4); qs.add(b); } } }
const NEEDLE = new THREE.Group(); NEEDLE.position.copy(DIAL_C).add(new THREE.Vector3(0, 0, 0.05)); qs.add(NEEDLE);
{ const n = box(0.1, 1.7, 0.04, new THREE.MeshBasicMaterial({ color: '#f4f6fa' })); n.position.y = 0.75; NEEDLE.add(n); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24), mat('#c8ccd4')); hub.rotation.x = Math.PI / 2; NEEDLE.add(hub); }
const LAMPS = []; for (const x of [-2.2, 2.2]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({ color: '#ff3a2e' })); l.position.set(x, 5.4, -3.7); qs.add(l); LAMPS.push(l); }
const OPS = []; for (let i = 0; i < 3; i++) { const p = makePerson({ skin: ['#eccaa8', '#d9a57c', '#f1c9a5'][i], hair: ['#1a1614', '#6b4a33', '#2c2421'][i], shirt: ['#4a5a7a', '#59606e', '#3f5a6b'][i], pants: '#2b3346', long: i === 1 }); p.position.set([-3.0, 2.9, 3.6][i], 0, [0.4, 0.4, -0.2][i]); p.rotation.y = Math.PI + [0.3, -0.3, -0.5][i]; qs.add(p); OPS.push(p); }
const tStop = tag('計画は、今日で中止', { size: 64, w: 640, bg: '#14161c', sx: 2.4 }); tStop.position.set(0, 0.6, 0.6); qs.add(tStop);
const tLimit = tag('その前に、限界の速さへ', { size: 58, w: 720, bg: '#e2483c', sx: 2.6 }); tLimit.position.set(0, 0.6, 0.6); qs.add(tLimit);

// ---------- 2段目. 小さな事務室（x=40）。昇進の通知を机に戻す男。棚には古い記念の盾 ----------
const OX = 40;
{ const fl = box(12, 0.04, 10, mat('#4a3e34')); fl.position.set(OX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#c8c0b0')); wl.position.set(OX, 3, -4); qs.add(wl);
  const desk = box(2.4, 0.9, 1.1, mat('#5a4030')); desk.position.set(OX + 0.3, 0.45, -1.6); qs.add(desk);
  const shelf = box(3.2, 0.08, 0.5, mat('#3a2a20')); shelf.position.set(OX - 0.4, 2.7, -3.7); qs.add(shelf);
  for (let i = 0; i < 6; i++) { const pl = box(0.36, 0.5 + (i % 2) * 0.12, 0.06, mat(i % 3 ? '#b8923a' : '#8a6a4a')); pl.position.set(OX - 1.6 + i * 0.48, 3.0 + (i % 2) * 0.06, -3.68); qs.add(pl); }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ color: '#a8c4e0' })); win.position.set(OX + 3.0, 3.2, -3.88); qs.add(win);
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(100, 120, (g, w, h) => { g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8463c'; g.fillRect(0, 0, w, 24); g.fillStyle = '#9aa0aa'; for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) g.fillRect(8 + x * 15, 34 + y * 16, 10, 10); }) })); cal.position.set(OX + 1.5, 3.3, -3.88); qs.add(cal); }
const LETTER = new THREE.Group(); qs.add(LETTER);
{ const env = box(0.6, 0.02, 0.42, mat('#f2ead8')); LETTER.add(env); const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), mat('#b8923a')); seal.position.set(0, 0.02, 0); LETTER.add(seal); }
const SUITM = makePerson(SUIT); SUITM.position.set(OX + 1.5, 0, -0.9); SUITM.rotation.y = -0.9; qs.add(SUITM);
const h2 = makePerson(HERO); h2.position.set(OX - 0.6, 0, -0.7); h2.rotation.y = 0.5; qs.add(h2);
const tPromo = tag('昇進を、断り続けた', { size: 64, w: 600, bg: '#14161c', sx: 1.6 }); tPromo.position.set(OX + 0.2, 2.6, -0.6); qs.add(tPromo);
const t30 = tag('30年以上、現役のまま', { size: 58, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.75 }); t30.position.set(OX + 0.2, 2.6, -0.6); qs.add(t30);

// ---------- 3段目. 大きな格納庫（x=80）。並んだ若者たちの前を歩く男 ----------
const BX = 80;
{ const fl = box(20, 0.04, 16, mat('#8a8a86')); fl.position.set(BX, 0.02, -4); qs.add(fl);
  for (let i = 0; i < 7; i++) { const ln = box(0.12, 0.01, 16, mat('#d8c060')); ln.position.set(BX - 9 + i * 3, 0.05, -4); ln.visible = i === 3; qs.add(ln); }
  const back = box(20, 9, 0.3, mat('#6a7078')); back.position.set(BX, 4.5, -12); qs.add(back);
  for (const s of [-1, 1]) { const sw = box(0.3, 9, 16, mat('#5a6068')); sw.position.set(BX + s * 10, 4.5, -4); qs.add(sw); }
  for (let i = 0; i < 8; i++) { const r = box(20, 0.25, 0.25, mat('#4a4e56')); r.position.set(BX, 8.6, -11 + i * 1.8); qs.add(r); }
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), new THREE.MeshBasicMaterial({ color: '#fff2d0' })); lp.position.set(BX - 4.5 + i * 3, 8.3, -5); qs.add(lp); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshBasicMaterial({ color: '#c8dcec' })); door.position.set(BX, 3.2, -11.8); qs.add(door); }
const CADETS = []; for (let i = 0; i < 6; i++) { const p = makePerson(CADET(i)); p.position.set(BX - 3.75 + i * 1.5, 0, -4.2); qs.add(p); CADETS.push(p); }
const h3 = makePerson(HERO); h3.position.set(BX - 4, 0, -2.2); qs.add(h3);
const tCoach = tag('教官として、呼び戻された', { size: 56, w: 760, bg: '#14161c', sx: 2.8 }); tCoach.position.set(BX, 3.5, -3); qs.add(tCoach);
const tElite = tag('相手は、選び抜かれた若者', { size: 56, w: 760, bg: '#3a7ad8', sx: 2.8 }); tElite.position.set(BX, 3.5, -3); qs.add(tElite);

// ---------- 4段目. 説明の部屋（x=120）。向き合う男と若者。奥の板には、ジグザグの赤い道筋 ----------
const CX = 120;
{ const fl = box(12, 0.04, 10, mat('#2e3440')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a4250')); wl.position.set(CX, 3, -4); qs.add(wl);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(440, 240, (g, w, h) => {
    g.fillStyle = '#1a2a22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a5a42'; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(i * 55 - 20, h); g.lineTo(i * 55 + 20, 40 + (i % 3) * 30); g.lineTo(i * 55 + 60, h); g.fill(); }
    g.strokeStyle = '#e2483c'; g.lineWidth = 7; g.setLineDash([16, 10]); g.beginPath(); g.moveTo(14, 200); const P = [[80, 150], [130, 205], [190, 140], [250, 200], [310, 130], [370, 170], [420, 60]]; P.forEach(([x, y]) => g.lineTo(x, y)); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#e6b450'; g.beginPath(); g.arc(420, 60, 12, 0, Math.PI * 2); g.fill();
  }) })); board.position.set(CX, 3.1, -3.88); qs.add(board);
  const fr = box(4.6, 2.6, 0.08, mat('#14161c')); fr.position.set(CX, 3.1, -3.94); qs.add(fr); }
const h4 = makePerson(HERO); h4.position.set(CX - 0.9, 0, -0.6); h4.rotation.y = 1.15; qs.add(h4);
const son = makePerson(SON); son.position.set(CX + 0.9, 0, -0.6); son.rotation.y = -1.15; qs.add(son);
const PHOTO = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: canvasTex(100, 72, (g, w, h) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); g.fillStyle = '#a89878'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = '#5a4a3a'; for (const x of [32, 66]) { g.beginPath(); g.arc(x, 30, 10, 0, Math.PI * 2); g.fill(); g.fillRect(x - 12, 42, 24, 30); } }) })); qs.add(PHOTO);
const tSon = tag('亡き相棒の、息子', { size: 66, w: 560, bg: '#14161c', sx: 1.75 }); tSon.position.set(CX, 2.7, -0.5); qs.add(tSon);
const tMission = tag('不可能に近い任務', { size: 66, w: 560, bg: '#e2483c', sx: 1.75 }); tMission.position.set(CX, 2.7, -0.5); qs.add(tMission);

// ---------- 5段目. 満席の映画館（x=160）。2022年のアメリカ映画・36年ぶりの続編・興行収入137億円 ----------
const TX = 160;
{ const fl = box(16, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.8), new THREE.MeshBasicMaterial({ map: canvasTex(512, 216, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ac4ea'); gr.addColorStop(1, '#f2e2c8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(60 + i * 85, 150 + (i % 2) * 20, 50, 14, 0, 0, Math.PI * 2); g.fill(); } }) })); scr.position.set(TX, 3.6, -6); qs.add(scr);
  const cur = box(10.4, 4.6, 0.1, mat('#5a1a22')); cur.position.set(TX, 3.6, -6.1); qs.add(cur); }
const SEATS = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const x = TX - 4 + c * 1.0, z = -2.4 + r * 1.3; const st = box(0.8, 0.9, 0.2, mat('#8a1e2a')); st.position.set(x, 0.45 + r * 0.25, z + 0.3); qs.add(st); const hd = box(0.36, 0.42, 0.36, mat(['#1a1614', '#4a3426', '#2c2421', '#6b4a33'][(r + c) % 4])); hd.position.set(x, 1.15 + r * 0.25, z + 0.2); qs.add(hd); SEATS.push(hd); }
const tUS = tag('2022年 アメリカ映画', { size: 62, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.4 }); tUS.position.set(TX, 6.3, -4.5); qs.add(tUS);
const t36 = tag('36年ぶりの続編', { size: 70, w: 540, bg: '#3a7ad8', sx: 2.8 }); t36.position.set(TX, 6.3, -4.5); qs.add(t36);
const t137 = tag('興行収入 137億円', { size: 66, w: 580, bg: '#e2483c', sx: 3.0 }); t137.position.set(TX, 5.25, -4.3); qs.add(t137);

// ---------- 6段目. 雲の上を編隊で飛ぶ戦闘機（x=200）。ここで初めて戦闘機と海軍を出す ----------
const DX = 200;
{ const sky = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a5a9a'); gr.addColorStop(0.6, '#7ab0e0'); gr.addColorStop(1, '#e8f0f6'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), fog: false })); sky.position.set(DX, 6, -60); qs.add(sky); }
const CLOUDS = []; for (let i = 0; i < 26; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshLambertMaterial({ color: '#f4f7fa', emissive: '#6a7a8a' })); c.scale.set(2 + R() * 3, 0.7 + R() * 0.6, 1.4 + R() * 1.5); c.userData = { x: (R() - 0.5) * 40, z: -2 - R() * 16, y: -1.5 - R() * 1.5 }; c.position.set(DX + c.userData.x, c.userData.y + 3.2, c.userData.z - 4); qs.add(c); CLOUDS.push(c); }
function makeJet() { // 汎用の戦闘機（実在の機体に似せない）
  const g = new THREE.Group(); const gray = mat('#8a949e'), dark = mat('#5a646e');
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 3.2, 12), gray); body.rotation.x = Math.PI / 2; g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 12), gray); nose.rotation.x = -Math.PI / 2; nose.position.z = -2.05; g.add(nose);
  const can = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshPhongMaterial({ color: '#2a3a4a', shininess: 90 })); can.scale.set(0.9, 0.8, 2.2); can.position.set(0, 0.22, -1.0); g.add(can);
  const wingGeo = new THREE.BufferGeometry(); wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.7, 2.1, 0, 0.9, 0, 0, 1.0, 0, 0, -0.7, 0, 0, 1.0, -2.1, 0, 0.9], 3)); wingGeo.computeVertexNormals();
  const wing = new THREE.Mesh(wingGeo, new THREE.MeshLambertMaterial({ color: '#7a848e', side: THREE.DoubleSide })); g.add(wing);
  for (const s of [-1, 1]) { const fin = box(0.04, 0.5, 0.45, dark); fin.position.set(s * 0.26, 0.36, 1.3); fin.rotation.z = s * 0.25; g.add(fin); const hs = box(0.9, 0.04, 0.45, dark); hs.position.set(s * 0.6, 0, 1.45); g.add(hs); }
  const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12), new THREE.MeshBasicMaterial({ color: '#ffb060' })); ex.rotation.x = Math.PI / 2; ex.position.z = 1.65; g.add(ex);
  return g;
}
const JETS = [makeJet(), makeJet(), makeJet()]; JETS.forEach(j => qs.add(j));
const tNavy = tag('海軍のエリート養成校', { size: 60, w: 680, bg: '#14161c', sx: 3.0 }); qs.add(tNavy);
const tLegend = tag('伝説のパイロット', { size: 72, w: 580, bg: '#e2483c', sx: 2.7 }); qs.add(tLegend);

// ---------- shots ----------
const ALL = [tStop, tLimit, tPromo, t30, tCoach, tElite, tSon, tMission, tUS, t36, t137, tNavy, tLegend];
function base() { S.reset(); ALL.forEach(x => x.visible = false); PHOTO.visible = false; JETS.forEach(j => j.visible = false); }

function shotControl(t) { // 1段目 0〜9：計画は今日で中止。その前に、限界の速さへ（0秒目がサムネ。針はもう赤の手前）
  base(); S.aim(0, -1); lift(-40); S.hemi.intensity = 0.7; S.darken(0.5, '#08090e');
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25; // 文字盤の角度（キャンバスは時計回り）
  const k = 0.62 + 0.36 * ease(clamp((t - 0.8) / 6.5)) + (t > 6 ? Math.sin(t * 40) * 0.006 : 0);
  const ang = a0 + (a1 - a0) * k; NEEDLE.rotation.z = -ang - Math.PI / 2; // キャンバスの角度（時計回り）→ 3D（反時計回り）。針は +y 向きに作ってある
  const blink = (Math.sin(t * 9) > 0) ? 1 : 0.25; LAMPS.forEach(l => l.material.color.setRGB(blink, 0.2 * blink, 0.15 * blink));
  S.spot.color.set(0xff3b2e); S.spot.position.set(0, 6, 1); S.spot.target.position.set(0, 2.5, -3.8); S.spot.intensity = 30 * blink;
  OPS.forEach((p, i) => { p.userData.head.rotation.x = -0.25; p.userData.arms[i % 2].rotation.x = t > 5 ? -1.3 : -0.4; });
  tStop.userData.pop(1); if (t > 4.6) tStop.visible = false;
  tLimit.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.3, 0.1, u), lerp(2.2, 2.4, u), lerp(6.6, 5.6, u), 0, 2.4, -2.5, 56);
  return qs;
}
function shotOffice(t) { // 2段目 9〜17：昇進を、断り続けた。30年以上、現役のまま
  base(); S.aim(OX, -1); lift(-40); S.hemi.intensity = 1.1;
  const k = ease(clamp((t - 1.6) / 1.2));
  LETTER.position.set(lerp(OX - 0.1, OX + 0.9, k), 0.92, lerp(-1.3, -1.5, k)); LETTER.rotation.y = lerp(0.2, -0.4, k);
  h2.userData.arms[1].rotation.x = t > 1.2 && t < 3.2 ? -1.0 : -0.1; h2.userData.head.rotation.y = t > 3.4 ? -0.4 : 0;
  SUITM.userData.arms[0].rotation.x = t > 3.6 ? -0.4 : -0.8; SUITM.userData.head.rotation.x = t > 3.2 ? 0.15 : 0;
  tPromo.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPromo.visible = false;
  t30.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(OX + lerp(0.6, 0.3, u), lerp(2.2, 2.0, u), lerp(4.8, 4.0, u), OX + 0.2, 1.4, -1.4, 56);
  return qs;
}
function shotHangar(t) { // 3段目 17〜25：教官として、呼び戻された。相手は、選び抜かれた若者
  base(); S.aim(BX, -4); lift(-30); S.hemi.intensity = 1.25;
  const x = lerp(BX - 2.2, BX + 1.4, clamp(t / 7.0)); const moving = t < 7.0;
  h3.position.set(x, 0, -2.0); h3.rotation.y = moving ? Math.PI / 2 : 0; poseWalk(h3, t * 5, moving ? 0.8 : 0);
  CADETS.forEach((p, i) => { p.userData.head.rotation.y = clamp((x - p.position.x) * 0.25, -0.6, 0.6); p.userData.arms.forEach(a => a.rotation.x = 0); });
  tCoach.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCoach.visible = false;
  tElite.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.0, 1.0, u), lerp(2.6, 2.4, u), lerp(5.2, 4.4, u), BX, 1.6, -3.4, 58);
  return qs;
}
function shotBrief(t) { // 4段目 25〜33：亡き相棒の、息子。不可能に近い任務
  base(); S.aim(CX, -1); lift(-40); S.hemi.intensity = 0.95;
  PHOTO.visible = t < 4.2; PHOTO.position.set(CX - 0.55, 1.05, -0.4); PHOTO.rotation.set(-0.3, 1.0, 0);
  h4.userData.arms[1].rotation.x = t < 4.2 ? -0.9 : -0.1; h4.userData.head.rotation.x = t < 2.0 ? 0.35 : 0;
  son.userData.head.rotation.x = -0.05; son.userData.arms.forEach(a => a.rotation.x = 0);
  tSon.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSon.visible = false;
  tMission.userData.pop((t - 4.2) / 0.35); if (t > 4.0) { tMission.position.set(CX, 4.7, -3.2); }
  const u = ease(t / 8);
  if (t < 4.2) look(CX + lerp(0.2, 0, u), lerp(1.9, 1.8, u), lerp(3.6, 3.2, u), CX, 1.5, -0.6, 54);
  else look(CX + 0.3, 2.6, lerp(4.4, 3.6, ease((t - 4.2) / 4)), CX, 3.0, -3.2, 56);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2022年のアメリカ映画。36年ぶりの続編。興行収入137億円
  base(); S.aim(TX, -2); lift(-30); S.hemi.intensity = 0.55; S.darken(0.6, '#06070a');
  SEATS.forEach((h, i) => { h.rotation.y = Math.sin(t * 0.6 + i) * 0.08; });
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false;
  t36.userData.pop((t - 4.2) / 0.35); t137.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(3.4, 3.2, u), lerp(7.2, 6.4, u), TX, 3.8, -4, 58);
  return qs;
}
function shotSky(t, quiz = 0) { // 6段目 42〜49（決め手）：海軍のエリート養成校。伝説のパイロット
  base(); S.aim(DX, -6); S.hemi.intensity = 1.35; S.key.intensity = 1.6; scene_fog(true); if (S.floor) S.floor.visible = false; qs.background.set('#b8d2ea'); qs.fog.color.set('#b8d2ea');
  const fx = DX + (t - 3.5) * 0.6;
  JETS.forEach((j, i) => { j.visible = true; const off = [[0, 0, 0], [-2.2, -0.2, 2.0], [-2.2, -0.2, -2.0]][i]; j.position.set(fx + off[0], 3.2 + off[1] + Math.sin(t * 1.4 + i) * 0.06, -6 + off[2]); j.rotation.set(0, -Math.PI / 2 + 0.35, Math.sin(t * 1.1 + i) * 0.08); });
  CLOUDS.forEach((c, i) => { const u = c.userData; c.position.set(DX + ((u.x - t * 4.5 + 200) % 40) - 20, u.y + 3.2, u.z - 4); });
  tNavy.position.set(fx, 5.4, -6); tLegend.position.set(fx, 5.4, -6);
  if (!quiz) { tNavy.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tNavy.visible = false; tLegend.userData.pop((t - 3.6) / 0.3); }
  const u = ease(t / 7);
  look(fx + lerp(5.0, 4.0, u), lerp(8.4, 7.6, u), lerp(5.0, 3.8, u), fx - 1.6, 3.0, -6, 60);
  return qs;
}
function scene_fog(on) { if (!on && S.floor) S.floor.visible = true; qs.fog.near = on ? 40 : 24; qs.fog.far = on ? 140 : 80; }
function shotQuiz(t) { // 49〜56：この映画、わかった？（格納庫。並んだ若者たちだけ）
  shotHangar(7.9);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.25, 0.25, d);
  S.spot.color.set(0xffe0c0); S.spot.position.set(BX, 8, -1); S.spot.target.position.set(BX, 1, -4); S.spot.intensity = lerp(0, 70, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(BX + lerp(0.6, 0.2, k), lerp(2.4, 2.1, k), lerp(5.4, 4.6, k), BX, 1.6, -4, 56);
  countdown(t);
  return qs;
}
const wrap = (f) => (t) => { scene_fog(false); return f(t); };

const SHOTS = [
  { a: 0, b: 9, f: wrap(shotControl) },
  { a: 9, b: 17, f: wrap(shotOffice) },
  { a: 17, b: 25, f: wrap(shotHangar) },
  { a: 25, b: 33, f: wrap(shotBrief) },
  { a: 33, b: 42, f: wrap(shotCinema) },
  { a: 42, b: 49, f: (t) => shotSky(t, 0) },
  { a: 49, b: 56, f: wrap(shotQuiz) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '計画は、今日で中止。<br>そう告げられる前に、'],
  [5.6, 9.0, '男はひとりで、<br>限界の速さに挑んだ。'],
  [9.2, 13.2, '主人公は、昇進を<br>断り続けてきた男。'],
  [13.2, 17.0, '30年以上たっても、<br>現役のままだ。'],
  [17.2, 21.0, '彼は、教官として<br>呼び戻された。'],
  [21.0, 25.0, '教える相手は、<br>選び抜かれた若者たち。'],
  [25.2, 29.0, 'その中には、<br>亡き相棒の息子がいた。'],
  [29.0, 33.0, '待っているのは、<br>不可能に近い任務。'],
  [33.2, 37.4, '2022年のアメリカ映画。<br>36年ぶりの続編。'],
  [37.4, 41.8, '日本でも、興行収入<br>137億円の大ヒット。'],
  [42.2, 45.4, '舞台は、海軍の<br>エリートパイロット養成校。'],
  [45.4, 49.0, '伝説のパイロットが、<br>帰ってきた。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、トップガン<br>マーヴェリック。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q061', v2: true, answer: 'トップガン マーヴェリック',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 6161,
    hits: [5.6, 13.2, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.5, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.3, 'drone'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '30年以上': 'さんじゅうねんいじょう', '2022年': 'にせんにじゅうにねん', '36年ぶり': 'さんじゅうろくねんぶり', '137億円': 'ひゃくさんじゅうななおくえん', '計画': 'けいかく', '今日': 'きょう', '中止': 'ちゅうし', '告げられる': 'つげられる', '男はひとりで': 'おとこはひとりで', '限界': 'げんかい', '速さ': 'はやさ', '挑んだ': 'いどんだ', '主人公': 'しゅじんこう', '昇進': 'しょうしん', '断り続けてきた': 'ことわりつづけてきた', '男。': 'おとこ。', '現役': 'げんえき', '彼は': 'かれは', '教官': 'きょうかん', '呼び戻された': 'よびもどされた', '教える相手': 'おしえるあいて', '選び抜かれた': 'えらびぬかれた', '若者': 'わかもの', '中には': 'なかには', '亡き相棒': 'なきあいぼう', '息子': 'むすこ', '待っている': 'まっている', '不可能': 'ふかのう', '近い任務': 'ちかいにんむ', 'アメリカ映画': 'アメリカえいが', '続編': 'ぞくへん', '日本': 'にほん', '興行収入': 'こうぎょうしゅうにゅう', '大ヒット': 'だいヒット', '舞台': 'ぶたい', '海軍': 'かいぐん', '養成校': 'ようせいこう', '伝説': 'でんせつ', '帰ってきた': 'かえってきた', 'この映画': 'このえいが', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n計画は、今日で中止。そう告げられる前に、男はひとりで、限界の速さに挑んだ。主人公は、昇進を断り続けてきた男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'Hulu', '映画好き', 'アクション映画'],
  },
});
applyQuizCards({ answer: 'トップガン<br>マーヴェリック', info: 'Prime Video・Hulu｜映画・131分', answerSize: 120 });
