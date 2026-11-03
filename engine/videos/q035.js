import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #035 ニュー・シネマ・パラダイス（映画・イタリア／フランス・日本公開1989年・124分。U-NEXTで見放題、
//   justwatch.com/jp/映画/niyushinemaparadaisu で2026/11/4確認。Filmarks 4.1・レビュー126,281件 filmarks.com/movies/27515）
// 確かめた事実（Filmarks の作品ページのあらすじ・受賞。2026/11/4）：
//   ・シチリア島の小さな村にある映画館・パラダイス座。親の目を盗んではここに通いつめる少年トトは、大の映画好き。映写技師の老人アルフレードと心を通わせ、
//     ますます映画に魅せられていく。初恋、兵役を経て成長し、映画監督として活躍するようになった彼のもとにアルフレードの訃報が。30年ぶりにトトはシチリアに帰ってきた
//   ・監督・脚本 ジュゼッペ・トルナトーレ。アカデミー賞（1990年・第62回）外国語映画賞、カンヌ国際映画祭（1989年）審査員特別グランプリ。日本公開1989年12月16日
// 構成（ヒント6段）：1 映画監督のもとに、ふるさとから届いた知らせ → 2 子どものころ、親の目を盗んで通った場所 → 3 海に囲まれた小さな村の、たったひとつの映画館
//   → 4 映写室の年老いた映写技師と心を通わせる → 5 1989年日本公開のイタリア映画・アカデミー賞外国語映画賞 → 6 決め手：シチリア島の村の映画館、パラダイス座。30年ぶりの帰郷
// 地名（シチリア）・映画館の名前・人物の名前は6段目まで字幕にも札にも出さない（看板は無地）。知らせの中身（訃報）は言わない。結末には触れない
// 作品の映像・俳優・ポスター・有名な場面の構図（映写の光を広場の壁に映す場面など）は使わない。人と村は汎用の3D

const S = quizStage({ bg: '#2a2230', floor: '#3a3028', fogNear: 24, fogFar: 90 });
const qs = S.scene;
const R = rng(3535);

const MAN = { skin: '#e8c4a0', hair: '#4a4a4a', shirt: '#2a2a30', pants: '#1c1c22' };
const BOY = { skin: '#e8c4a0', hair: '#1a1410', shirt: '#c8b48a', pants: '#4a3a2a', scale: 0.68 };
const OLD = { skin: '#e4c0a0', hair: '#d8d8d8', shirt: '#6a5a48', pants: '#3a3228' };

function beam(len, rad, color = '#fff2c8', op = 0.22) { const m = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 24, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.rotation.z = Math.PI / 2; return m; }

// ---------- 1段目. 夜の都会の部屋（x=0）。電話が鳴る ----------
{ const fl = box(10, 0.04, 8, mat('#2a2a32')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(10, 6, 0.2, mat('#3a3a46')); wl.position.set(0, 3, -4); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 228, (g, w, h) => { g.fillStyle = '#0e1426'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const bw = 18 + (i * 37) % 22, bh = 60 + (i * 53) % 120; g.fillStyle = '#1c2436'; g.fillRect(i * 29, h - bh, bw, bh); g.fillStyle = '#ffd890'; for (let y = h - bh + 8; y < h - 6; y += 12) for (let x = i * 29 + 4; x < i * 29 + bw - 4; x += 8) if ((x * 7 + y * 3) % 5 < 2) g.fillRect(x, y, 3, 4); } }) })); win.position.set(-1.6, 3.2, -3.88); qs.add(win);
  const desk = box(2.2, 0.08, 1.0, mat('#4a3a2e')); desk.position.set(1.0, 0.85, -2.6); qs.add(desk);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.3, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd890', side: THREE.DoubleSide })); lamp.position.set(1.8, 1.4, -2.7); qs.add(lamp); }
const PHONE = new THREE.Group(); PHONE.position.set(0.6, 0.92, -2.5); qs.add(PHONE);
{ const b = box(0.5, 0.14, 0.34, mat('#1a1a1e')); PHONE.add(b); const hs = box(0.56, 0.1, 0.12, mat('#1a1a1e')); hs.position.set(0, 0.14, 0); PHONE.add(hs); }
const RING = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4 + i * 0.25, 0.025, 6, 32), new THREE.MeshBasicMaterial({ color: '#ffd890', transparent: true, opacity: 0.8 })); r.position.set(0.6, 1.2, -2.5); qs.add(r); RING.push(r); }
const PL = new THREE.PointLight(0xffd890, 0, 6, 1.4); PL.position.set(0.6, 1.4, -2.2); qs.add(PL);
const man = makePerson(MAN); man.position.set(-0.6, 0, -1.2); man.rotation.y = 0.6; qs.add(man);
const tDir = tag('成功した映画監督', { size: 64, w: 560, bg: '#14161c', sx: 1.5 }); tDir.position.set(0.1, 2.4, -1.2); qs.add(tDir);
const tCall = tag('ふるさとからの知らせ', { size: 60, w: 640, bg: '#e2483c', sx: 1.6 }); tCall.position.set(0.1, 2.5, -1.6); qs.add(tCall);

// ---------- 2段目. 路地（x=40）。親の目を盗んで駆けていく少年 ----------
const AX = 40;
{ const rd = box(4, 0.04, 30, mat('#8a7a64')); rd.position.set(AX, 0.02, -10); qs.add(rd);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const h = 3.4 + R() * 1.6; const b = box(2.4, h, 4.4, mat(['#e6d4b0', '#d8c098', '#ead8bc'][i % 3])); b.position.set(AX + s * 3.2, h / 2, -i * 4.8); qs.add(b); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), mat('#5a7a8a')); w.position.set(AX + s * 1.99, 2.2, -i * 4.8); w.rotation.y = -s * Math.PI / 2; qs.add(w); } }
const boy2 = makePerson(BOY); boy2.position.set(AX, 0, 0); qs.add(boy2);
const mom = makePerson({ skin: '#e8c4a0', hair: '#2a2018', shirt: '#4a4a5a', pants: '#2a2a32', long: true, skirt: true }); mom.position.set(AX - 0.6, 0, 3.6); mom.rotation.y = Math.PI; qs.add(mom);
const DOORLIGHT = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ color: '#ffe8b0' })); DOORLIGHT.position.set(AX, 1.2, -22); qs.add(DOORLIGHT);
const tSneak = tag('親の目を盗んで', { size: 66, w: 500, bg: '#14161c', sx: 1.4 }); tSneak.position.set(AX, 2.0, 0); qs.add(tSneak);
const tFan = tag('大の映画好き', { size: 72, w: 460, bg: '#e6b450', color: '#14161c', sx: 1.3 }); tFan.position.set(AX, 2.0, 0); qs.add(tFan);

// ---------- 3段目. 海に囲まれた小さな村（x=90） ----------
const VX = 90;
const SEA = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.MeshStandardMaterial({ color: '#3a7aa8', roughness: 0.3, metalness: 0.1 })); SEA.rotation.x = -Math.PI / 2; SEA.position.set(VX, 0.01, -30); qs.add(SEA);
const HILL = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b8a478')); HILL.scale.set(1.3, 0.42, 0.8); HILL.position.set(VX, 0, -12); qs.add(HILL);
const HOUSES = []; for (let i = 0; i < 22; i++) { const a = R() * Math.PI - Math.PI / 2, r = 3 + R() * 9; const x = VX + Math.sin(a) * r * 1.2, z = -12 + Math.cos(a) * r * 0.55 + 2; const y = Math.max(0, 5.8 * (1 - ((x - VX) / 18) ** 2 - ((z + 12) / 11) ** 2)) * 0.9; const h = box(1.4, 1.2, 1.2, mat(['#f2e6cc', '#ead2a8', '#f6eee0', '#e8c8a0'][i % 4])); h.position.set(x, y + 0.6, z); qs.add(h); const rf = box(1.5, 0.18, 1.3, mat('#b8643a')); rf.position.set(x, y + 1.25, z); qs.add(rf); HOUSES.push(h); }
const CINEMA = new THREE.Group(); CINEMA.position.set(VX + 0.5, 0, -2.5); qs.add(CINEMA);
{ const b = box(3.4, 3.2, 2.4, mat('#f0dcb4')); b.position.y = 1.6; CINEMA.add(b); const pd = box(3.6, 0.6, 2.6, mat('#d8b884')); pd.position.y = 3.5; CINEMA.add(pd); const sign = box(2.2, 0.5, 0.1, new THREE.MeshBasicMaterial({ color: '#ffd890' })); sign.position.set(0, 2.7, 1.25); CINEMA.add(sign); const dr = box(1.0, 1.8, 0.06, mat('#6a2a2a')); dr.position.set(0, 0.9, 1.22); CINEMA.add(dr); }
const tSea = tag('海に囲まれた 小さな村', { size: 60, w: 680, bg: '#14161c', sx: 6.0 }); tSea.position.set(VX, 7.4, -2); qs.add(tSea);
const tOne = tag('たったひとつの映画館', { size: 60, w: 640, bg: '#e2483c', sx: 2.6 }); tOne.position.set(VX + 0.5, 5.0, -1.4); qs.add(tOne);

// ---------- 4・6段目. 映画館の中（x=140）。客席・映写室・スクリーン ----------
const CX = 140;
{ const fl = box(12, 0.04, 16, mat('#4a2a26')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wb = box(12, 7, 0.2, mat('#5a2a2a')); wb.position.set(CX, 3.5, 6); qs.add(wb);
  for (const s of [-1, 1]) { const wl = box(0.2, 7, 16, mat('#6a3430')); wl.position.set(CX + s * 6, 3.5, -2); qs.add(wl); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.8), new THREE.MeshBasicMaterial({ color: '#f4ecd8' })); SCREEN.position.set(CX, 3.4, -9.8); qs.add(SCREEN);
{ const cur = box(8.4, 4.8, 0.1, mat('#7a1a1e')); cur.position.set(CX, 3.4, -9.9); qs.add(cur); }
const SEATS = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) { const st = box(0.6, 0.5, 0.5, mat('#8a2a2a')); st.position.set(CX - 2.8 + c * 0.8, 0.25, -5 + r * 1.3); qs.add(st); SEATS.push(st); }
const AUD = []; for (let i = 0; i < 16; i++) { const p = makePerson({ skin: '#e8c4a0', hair: ['#1a1a1a', '#3a2a20', '#8a8a8a', '#4a3a2a'][i % 4], shirt: ['#5a4a3a', '#3a4a5a', '#6a5a48', '#4a3a3a'][i % 4], pants: '#2a2a2e' }); p.position.set(CX - 2.8 + (i % 8) * 0.8, -0.3, -5 + Math.floor(i / 8) * 2.6 + 0.2); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(p); AUD.push(p); }
const BOOTH = new THREE.Group(); BOOTH.position.set(CX, 4.6, 5.2); qs.add(BOOTH);
{ const b = box(3.6, 2.2, 1.6, mat('#4a3a32')); b.position.y = 0; BOOTH.add(b); const hole = box(0.5, 0.4, 0.1, new THREE.MeshBasicMaterial({ color: '#fff2c8' })); hole.position.set(0, 0.2, -0.82); BOOTH.add(hole); }
const BEAM = beam(15, 1.2, '#fff2c8', 0.12); BEAM.rotation.set(Math.PI / 2 + 0.08, 0, 0); BEAM.position.set(CX, 4.0, -2.3); qs.add(BEAM);
const tPara = tag('シチリア島の村の映画館', { size: 58, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tPara.position.set(CX, 6.0, -5); qs.add(tPara);
const tName = tag('パラダイス座', { size: 80, w: 480, bg: '#e2483c', sx: 2.6 }); tName.position.set(CX, 5.1, -5); qs.add(tName);

// 映写室（x=180）：大きな映写機、年老いた映写技師と少年
const PX = 180;
{ const fl = box(8, 0.04, 6, mat('#3a3028')); fl.position.set(PX, 0.02, -1); qs.add(fl); const wl = box(8, 5, 0.2, mat('#5a4a3e')); wl.position.set(PX, 2.5, -3); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); win.position.set(PX - 1.6, 1.7, -2.88); qs.add(win);
  for (let i = 0; i < 6; i++) { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 20), mat('#8a8e94')); can.position.set(PX + 2.6, 0.9 + i * 0.1, -2.4); qs.add(can); }
  const shelf = box(1.2, 0.06, 0.8, mat('#6a4a32')); shelf.position.set(PX + 2.6, 0.84, -2.4); qs.add(shelf); }
const PROJ = new THREE.Group(); PROJ.position.set(PX - 1.0, 0, -1.6); qs.add(PROJ);
{ const body = box(0.9, 0.9, 1.4, mat('#3a3e44')); body.position.y = 1.4; PROJ.add(body); const stand = box(0.5, 0.95, 0.5, mat('#2a2c30')); stand.position.y = 0.48; PROJ.add(stand); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 16), mat('#1a1a1e')); lens.rotation.x = Math.PI / 2; lens.position.set(-0.3, 1.5, -0.9); PROJ.add(lens); }
const REELS = [0, 1].map(i => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 28), new THREE.MeshStandardMaterial({ color: '#a8acb4', metalness: 0.7, roughness: 0.3 })); r.rotation.z = Math.PI / 2; r.position.set(PX - 1.0, 2.2 + i * 0.05, -1.6 + (i ? -0.45 : 0.45)); r.position.y = 2.25; qs.add(r); return r; });
const PBEAM = beam(0.5, 0.22, '#fff2c8', 0.35); PBEAM.rotation.set(Math.PI / 2, 0, 0); PBEAM.position.set(PX - 1.3, 1.5, -2.65); qs.add(PBEAM);
const old = makePerson(OLD); old.position.set(PX + 0.3, 0, -0.6); old.rotation.y = -0.5; qs.add(old);
const boy4 = makePerson(BOY); boy4.position.set(PX + 1.2, 0, -0.2); boy4.rotation.y = -0.9; qs.add(boy4);
const tOld = tag('年老いた映写技師', { size: 62, w: 560, bg: '#14161c', sx: 1.9 }); tOld.position.set(PX + 0.5, 2.5, -0.4); qs.add(tOld);
const tAge = tag('年の差をこえて', { size: 66, w: 500, bg: '#e6b450', color: '#14161c', sx: 1.8 }); tAge.position.set(PX + 0.6, 2.5, -0.4); qs.add(tAge);

// ---------- 5段目. フィルムと星（x=220）。1989年日本公開のイタリア映画・アカデミー賞外国語映画賞 ----------
const FX = 220;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1a22' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const FREELS = [-1.2, 1.2].map(dx => { const g = new THREE.Group(); g.position.set(FX + dx, 2.6, -1.5); const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 36), new THREE.MeshStandardMaterial({ color: '#a8acb4', metalness: 0.8, roughness: 0.3 })); disc.rotation.x = Math.PI / 2; g.add(disc); for (let i = 0; i < 5; i++) { const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16), mat('#1e1a22')); hole.rotation.x = Math.PI / 2; const a = i / 5 * Math.PI * 2; hole.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0); g.add(hole); } qs.add(g); return g; });
const STAR = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.22 : 0.55, a = i / 10 * Math.PI * 2 + Math.PI / 2; if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath(); return sh; })(), { depth: 0.12, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.25, emissive: '#5a4010' })); STAR.position.set(FX, 2.6, -0.6); qs.add(STAR);
const tIT = tag('1989年日本公開 イタリア映画', { size: 54, w: 760, bg: '#e6b450', color: '#14161c', sx: 3.4 }); tIT.position.set(FX, 4.6, -1.2); qs.add(tIT);
const tAca = tag('アカデミー賞 外国語映画賞', { size: 56, w: 740, bg: '#e2483c', sx: 3.4 }); tAca.position.set(FX, 4.6, -1.2); qs.add(tAca);

// ---------- shots ----------
const ALL = [tDir, tCall, tSneak, tFan, tSea, tOne, tPara, tName, tOld, tAge, tIT, tAca];
function base() { S.reset(); ALL.forEach(x => x.visible = false); RING.forEach(r => r.visible = false); PL.intensity = 0; SEA.visible = false; }

function shotCall(t) { // 1段目 0〜9：成功した映画監督のもとに、ある知らせが届く。30年帰っていない、ふるさとから（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.5, '#08090e');
  RING.forEach((r, i) => { r.visible = true; const k = (t * 1.2 + i / 3) % 1; r.scale.setScalar(0.5 + k * 1.2); r.material.opacity = 0.8 * (1 - k); r.lookAt(0, 2.4, 6); });
  PL.intensity = 6 + 4 * Math.sin(t * 14);
  PHONE.children[1].position.y = 0.14 + Math.abs(Math.sin(t * 28)) * 0.03;
  man.userData.head.rotation.y = 0.5; man.userData.arms[1].rotation.x = t > 5 ? -0.8 * ease((t - 5) / 0.8) : 0;
  tDir.userData.pop(1); if (t > 4.6) tDir.visible = false;
  tCall.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(2.4, 2.1, u), lerp(4.4, 3.4, u), 0.1, 1.4, -2.0, 56);
  return qs;
}
function shotAlley(t) { // 2段目 9〜17：子どものころ、親の目を盗んで通った場所。彼は、大の映画好きの少年だった
  base(); S.aim(AX, -6); lift(-30); S.hemi.intensity = 1.3; S.darken(0.05, '#e8c890');
  const z = 1.2 - t * 1.6; boy2.position.set(AX + Math.sin(t * 0.7) * 0.3, 0, z); boy2.rotation.y = Math.PI; const ph = t * 12; boy2.userData.legs[0].rotation.x = Math.sin(ph) * 0.7; boy2.userData.legs[1].rotation.x = -Math.sin(ph) * 0.7; boy2.userData.arms[0].rotation.x = -Math.sin(ph) * 0.6; boy2.userData.arms[1].rotation.x = Math.sin(ph) * 0.6;
  boy2.userData.head.rotation.y = t < 3 ? Math.sin(t * 3) * 0.6 : 0;
  tSneak.position.set(AX + 0.5, 1.7, z); tFan.position.set(AX + 0.5, 1.7, z);
  tSneak.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSneak.visible = false;
  tFan.userData.pop((t - 4.2) / 0.35);
  look(AX + 0.6, 1.5, z + 3.6, AX, 1.0, z - 2, 58);
  return qs;
}
function shotVillage(t) { // 3段目 17〜25：海に囲まれた、小さな村。村でたったひとつの、映画館
  base(); S.aim(VX, -6); lift(-20); S.hemi.intensity = 1.4; S.darken(0.08, '#f0c890'); SEA.visible = true;
  tSea.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSea.visible = false;
  tOne.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4) look(VX, lerp(9, 8, u * 2), lerp(16, 14, u * 2), VX, 2.5, -8, 56);
  else { const k = ease((t - 4) / 4); look(VX + 0.5, lerp(3.4, 2.6, k), lerp(6.6, 5.2, k), VX + 0.5, 2.2, -2.5, 56); }
  return qs;
}
function shotBooth(t) { // 4段目 25〜33：映写室には、年老いた映写技師。ふたりは、年の差をこえて心を通わせていく
  base(); S.aim(PX, -1); lift(-40); S.hemi.intensity = 0.9; S.darken(0.35, '#1a1008');
  REELS.forEach((r, i) => r.rotation.x = t * (2 + i * 0.3));
  PBEAM.material.opacity = 0.3 + 0.06 * Math.sin(t * 20);
  old.userData.arms[1].rotation.x = -0.6 - 0.2 * Math.sin(t * 2); boy4.userData.head.rotation.x = -0.25;
  if (t > 4.2) { old.rotation.y = lerp(-0.5, 0.5, ease((t - 4.2) / 1)); old.userData.arms[0].rotation.x = -1.0 * ease((t - 4.4) / 0.8); old.userData.arms[0].rotation.z = 0.6 * ease((t - 4.4) / 0.8); }
  tOld.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOld.visible = false;
  tAge.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(PX + lerp(1.8, 1.2, u), lerp(2.0, 1.8, u), lerp(4.6, 3.8, u), PX + 0.5, 1.3, -1.0, 54);
  return qs;
}
function shotFilm(t) { // 5段目 33〜42：1989年に日本で公開された、イタリア映画。アカデミー賞の外国語映画賞を受賞
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.2;
  FREELS.forEach((g, i) => { g.rotation.z = -t * (1.5 + i * 0.2); });
  STAR.rotation.y = t * 0.8; STAR.position.y = 2.4 + ease((t - 4.0) / 1.2) * 0.2;
  STAR.visible = t > 4.0; STAR.scale.setScalar(Math.max(0.01, ease((t - 4.0) / 0.6)) * 1.1);
  tIT.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tIT.visible = false;
  tAca.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.8, lerp(7.4, 6.8, u), FX, 2.8, -1.5, 56);
  return qs;
}
function shotCinema(t, quiz = 0) { // 6段目 42〜49（決め手）：シチリア島の村の映画館、パラダイス座。30年ぶりに、彼は帰ってくる
  base(); S.aim(CX, -2); lift(-30); S.hemi.intensity = 0.55; S.key.intensity = 0.3; S.darken(0.6, '#0a0606');
  BEAM.material.opacity = 0.09 + 0.02 * Math.sin(t * 18);
  SCREEN.material.color.setHSL(0.11, 0.4, 0.75 + 0.12 * Math.sin(t * 3));
  AUD.forEach((p, i) => { p.userData.head.rotation.x = -0.12 + 0.05 * Math.sin(t * 2 + i); });
  if (!quiz) { tPara.userData.pop((t - 0.4) / 0.35); tName.userData.pop((t - 2.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(CX + lerp(1.2, 0.6, u), lerp(3.6, 3.2, u), lerp(5.4, 4.4, u), CX, 3.0, -9, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（暗い客席に、映写の光だけ）
  shotCinema(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.55, 0.15, d);
  S.spot.color.set(0xfff0c8); S.spot.position.set(CX, 6, 2); S.spot.target.position.set(CX, 0.5, -3); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(CX + lerp(0.4, 0.2, k), lerp(2.4, 2.2, k), lerp(4.0, 3.0, k), CX, 2.6, -9, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotCall },
  { a: 9, b: 17, f: shotAlley },
  { a: 17, b: 25, f: shotVillage },
  { a: 25, b: 33, f: shotBooth },
  { a: 33, b: 42, f: shotFilm },
  { a: 42, b: 49, f: (t) => shotCinema(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '成功した映画監督のもとに、<br>ある知らせが届く。'],
  [5.6, 9.0, '長いあいだ帰っていない、<br>ふるさとからだった。'],
  [9.2, 13.2, '子どものころ、親の目を<br>盗んでは通った場所。'],
  [13.2, 17.0, '彼は、大の映画好きの<br>少年だった。'],
  [17.2, 21.0, '海に囲まれた、<br>小さな村。'],
  [21.0, 25.0, '村でたったひとつの、<br>映画館。'],
  [25.2, 29.0, '映写室には、<br>年老いた映写技師。'],
  [29.0, 33.0, 'ふたりは、年の差をこえて<br>心を通わせていく。'],
  [33.2, 37.4, '1989年に日本で公開された、<br>イタリア映画。'],
  [37.4, 41.8, 'アカデミー賞の、<br>外国語映画賞を受賞。'],
  [42.2, 45.4, 'シチリア島の村の映画館、<br>パラダイス座。'],
  [45.4, 49.0, '30年ぶりに、<br>彼は帰ってくる。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ニュー・シネマ・パラダイス。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q035', v2: true, answer: 'ニュー・シネマ・パラダイス',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 3535,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'alarm'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ニュー・シネマ・パラダイス': 'ニューシネマパラダイス', '1989年': 'せんきゅうひゃくはちじゅうきゅうねん', '30年ぶり': 'さんじゅうねんぶり', '外国語映画賞': 'がいこくごえいがしょう', 'パラダイス座': 'パラダイスざ', 'シチリア島': 'シチリアとう', '映画監督': 'えいがかんとく', '映写技師': 'えいしゃぎし', '映写室': 'えいしゃしつ', '映画好き': 'えいがずき', '映画館': 'えいがかん', '年老いた': 'としおいた', '年の差': 'としのさ', '通わせて': 'かよわせて', '通った': 'かよった', '盗んでは': 'ぬすんでは', '成功した': 'せいこうした', '知らせ': 'しらせ', '少年': 'しょうねん', '小さな村': 'ちいさなむら', '村で': 'むらで', '村の': 'むらの', '囲まれた': 'かこまれた', '日本で公開': 'にほんでこうかい', '受賞': 'じゅしょう', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n成功した映画監督のもとに、ある知らせが届く。長いあいだ帰っていない、ふるさとからだった。子どものころ、親の目を盗んでは通った場所。彼は、大の映画好きの少年だった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', '映画好き', '名作映画', 'イタリア映画'],
  },
});
applyQuizCards({ answer: 'ニュー・シネマ・<br>パラダイス', info: 'U-NEXT｜イタリア映画・124分', answerSize: 112 });
