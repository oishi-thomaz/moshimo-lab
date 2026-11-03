import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #033 シン・ゴジラ（映画・日本・2016年・特撮。U-NEXT・Hulu・Prime Video・Netflixで見放題、
//   justwatch.com/jp/映画/shingozira で2026/11/3確認。Filmarks 3.9・レビュー243,057件 filmarks.com/movies/60579）
// 確かめた事実：
//   ・東京湾・羽田沖。東京湾アクアトンネルが轟音とともに大量の浸水に巻き込まれ崩落する原因不明の事故。首相官邸で緊急会議、内閣官房副長官・矢口蘭堂は
//     海中に棲む巨大生物による可能性を指摘。周囲は一笑に付すが、直後、海上に巨大不明生物の姿。上陸し、普段と変わらない生活の人々の前に現れる。
//     政府は緊急対策本部を設置し、自衛隊に防衛出動命令（b-ch.com/titles/5545/）
//   ・世界各国も日本の対応を注視、米国は大統領特使を派遣。「ゴジラ FINAL WARS」以来12年ぶりに日本で製作されたシリーズ第29作。「エヴァンゲリオン」シリーズの庵野秀明と
//     樋口真嗣が組んだ。シリーズ最大の体長118.5メートル。ドキュメンタリータッチの演出（movie.jorudan.co.jp/film/84597/）
//   ・庵野秀明が総監督、樋口真嗣が監督。不気味に赤く発光するビジュアル（cinematoday.jp/movie/T0020635）
// 構成（ヒント6段）：1 海の下のトンネルが突然水びたし、原因不明 → 2 緊急会議で若い政治家が、海の中に巨大な生き物がいるのではと口にする
//   → 3 直後、海の上に巨大な影、普段どおりの街が大混乱 → 4 会議に次ぐ会議、自衛隊に防衛出動の命令
//   → 5 2016年の日本映画、総監督は庵野秀明、日本で12年ぶりのシリーズ作 → 6 決め手：体長118.5メートル、赤く光る巨大不明生物
// 生物の姿は一切見せない（影・水しぶき・赤い光・足あとだけ）。キャラクターのデザイン・ロゴ・有名な場面の構図（熱線・会議室の配置など）はなぞらない。けが人・戦闘の描写なし。結末には触れない

const S = quizStage({ bg: '#18202c', floor: '#222a36', fogNear: 30, fogFar: 140 });
const qs = S.scene;
const R = rng(3333);

const SUIT = (i) => ({ skin: ['#efcfae', '#e8c4a0', '#f0d0b0', '#e4c0a0'][i % 4], hair: ['#1a1a1a', '#3a3a3a', '#8a8a8a', '#2a2420'][i % 4], shirt: ['#22262f', '#2b3040', '#1e2229', '#30343e'][i % 4], pants: '#1c1e24', tie: true });
const HERO = { skin: '#efcfae', hair: '#1a1616', shirt: '#2a3044', pants: '#1c1e24', tie: true };
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }
function car(c) { const g = new THREE.Group(); const b = box(1.7, 0.5, 3.6, mat(c)); b.position.y = 0.55; g.add(b); const t = box(1.5, 0.45, 1.8, mat(c)); t.position.set(0, 1.0, -0.2); g.add(t); for (const s of [-1, 1]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.04), new THREE.MeshBasicMaterial({ color: '#d02a2a' })); hl.position.set(s * 0.55, 0.62, -1.82); g.add(hl); } return g; }

// ---------- 1段目. 海の下のトンネル（x=0）。突然、水が流れこむ ----------
const TUN = new THREE.Group(); qs.add(TUN);
{ const tube = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 60, 32, 1, true, Math.PI * 0.05, Math.PI * 1.9), new THREE.MeshLambertMaterial({ color: '#c8ccc4', side: THREE.BackSide })); tube.rotation.x = Math.PI / 2; tube.position.set(0, 2.6, -20); TUN.add(tube);
  const road = box(7, 0.06, 60, mat('#3a3c42')); road.position.set(0, 0.03, -20); TUN.add(road);
  for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.9), new THREE.MeshBasicMaterial({ color: '#ffd890' })); l.position.set(-2.4, 5.4, 6 - i * 4); TUN.add(l); const l2 = l.clone(); l2.position.x = 2.4; TUN.add(l2); }
  for (let i = 0; i < 12; i++) { const ln = box(0.12, 0.01, 1.4, new THREE.MeshBasicMaterial({ color: '#e8e8e0' })); ln.position.set(0, 0.07, 6 - i * 5); TUN.add(ln); } }
const CARS1 = [['#c8c8cc', -1.6, -6], ['#3a5a8a', 1.6, -9], ['#8a2a2a', -1.6, -14]].map(([c, x, z]) => { const g = car(c); g.position.set(x, 0, z); qs.add(g); return g; });
const WATER = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1, 60), new THREE.MeshStandardMaterial({ color: '#2a5a7a', transparent: true, opacity: 0.85, roughness: 0.2, metalness: 0.1 })); WATER.position.set(0, 0, -20); qs.add(WATER);
const JET = []; for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: '#9ad8f8', transparent: true, opacity: 0.85 })); d.userData.o = R(); d.userData.a = R(); qs.add(d); JET.push(d); }
const RED1 = new THREE.PointLight(0xff3020, 0, 20, 1.2); RED1.position.set(0, 4.5, -6); qs.add(RED1);
const tFlood = tag('トンネルが水びたし', { size: 62, w: 600, bg: '#e2483c', sx: 2.2 }); tFlood.position.set(-0.1, 2.35, -1.5); qs.add(tFlood);
const tWhy = tag('原因不明', { size: 84, w: 380, bg: '#14161c', sx: 1.6 }); tWhy.position.set(0.5, 2.1, -1.5); qs.add(tWhy);

// ---------- 2・4段目. 会議室（x=40）。長い机とスーツの人たち ----------
const MX = 40;
{ const fl = box(14, 0.04, 10, mat('#5a4a3e')); fl.position.set(MX, 0.02, 0); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#d4ccbc')); wl.position.set(MX, 2.5, -3.6); qs.add(wl);
  const tbl = box(7.5, 0.75, 1.6, mat('#6a4a32')); tbl.position.set(MX, 0.38, -0.6); qs.add(tbl);
  for (let i = 0; i < 6; i++) { const mic = box(0.05, 0.3, 0.05, mat('#2a2a2e')); mic.position.set(MX - 3 + i * 1.2, 0.92, -0.2); qs.add(mic); const pp = box(0.3, 0.01, 0.4, mat('#f4f2ec')); pp.position.set(MX - 3 + i * 1.2, 0.77, -0.5); qs.add(pp); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.3), new THREE.MeshBasicMaterial({ map: canvasTex(512, 280, (g, w, h) => { g.fillStyle = '#0e2a4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a6a4a'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.55, 0); g.lineTo(w * 0.42, h * 0.45); g.lineTo(w * 0.62, h * 0.7); g.lineTo(w, h * 0.55); g.lineTo(w, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, h * 0.4); g.lineTo(w * 0.25, h * 0.55); g.lineTo(w * 0.3, h); g.lineTo(0, h); g.fill(); g.strokeStyle = '#cfe6ff'; g.lineWidth = 2; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 56) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#ff3a2a'; g.beginPath(); g.arc(w * 0.52, h * 0.72, 12, 0, Math.PI * 2); g.fill(); }) })); SCREEN.position.set(MX + 1.8, 2.8, -3.48); qs.add(SCREEN);
const MEMBERS = []; for (let i = 0; i < 6; i++) { const p = makePerson(SUIT(i)); const back = i < 3; p.position.set(MX - 2.4 + (i % 3) * 2.4 + (back ? 0 : 0.6), 0, back ? -1.9 : 0.7); p.rotation.y = back ? 0 : Math.PI; p.userData.back = back; qs.add(p); MEMBERS.push(p); }
const hero = makePerson(HERO); hero.position.set(MX + 3.3, 0, 0.5); hero.rotation.y = -Math.PI / 2 - 0.4; qs.add(hero);
const tYoung = tag('若い政治家', { size: 72, w: 420, bg: '#14161c', sx: 1.4 }); tYoung.position.set(MX + 3.3, 2.45, 0.5); qs.add(tYoung);
const tCreature = tag('海の中に巨大な生き物？', { size: 58, w: 700, bg: '#e2483c', sx: 2.1 }); tCreature.position.set(MX + 1.6, 3.0, 0.2); qs.add(tCreature);
const tMeet = tag('会議に次ぐ会議', { size: 66, w: 520, bg: '#14161c', sx: 1.8 }); tMeet.position.set(MX, 3.3, -0.6); qs.add(tMeet);
const tOrder = tag('自衛隊に出動命令', { size: 64, w: 560, bg: '#e2483c', sx: 2.0 }); tOrder.position.set(MX, 3.3, -0.6); qs.add(tOrder);

// ---------- 3段目. 湾と街（x=90）。海の上に巨大な影、普段どおりの街が大混乱 ----------
const BX = 90;
const SEA = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshStandardMaterial({ color: '#2a4a64', roughness: 0.35, metalness: 0.2 })); SEA.rotation.x = -Math.PI / 2; SEA.position.set(BX, 0.01, -30); qs.add(SEA);
{ const shore = box(60, 0.6, 10, mat('#6a6a64')); shore.position.set(BX, 0.3, 4); qs.add(shore); }
const CITY = []; for (let i = 0; i < 12; i++) { const w = 2 + R() * 1.4, h = 4 + R() * 10; const wt = windowTextures(3300 + i, ['#6a7488', '#7a8090', '#5a6478'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.4 })); const bx = BX - 16 + i * 2.9; b.position.set(bx + (bx > BX - 5 && bx < BX + 5 ? (bx < BX ? -6 : 6) : 0), h / 2 + 0.6, 7 + (i % 2) * 1.6); qs.add(b); CITY.push(b); }
const WAKE = new THREE.Group(); qs.add(WAKE);
{ const bump = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1a2a36', roughness: 0.4 })); bump.scale.set(1.6, 0.5, 1); WAKE.add(bump);
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(4 + i * 2, 0.15, 6, 40), new THREE.MeshBasicMaterial({ color: '#cfe6f0', transparent: true, opacity: 0.6 - i * 0.15 })); r.rotation.x = Math.PI / 2; r.position.y = 0.05; WAKE.add(r); } }
const SPRAY = []; for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshLambertMaterial({ color: '#e8f2f8', transparent: true, opacity: 0.8 })); d.userData.a = R() * Math.PI * 2; d.userData.o = R(); qs.add(d); SPRAY.push(d); }
const CROWD = []; for (let i = 0; i < 10; i++) { const p = makePerson({ skin: '#ecc9a6', hair: ['#2a2420', '#4a3a2a', '#1a1a1a'][i % 3], shirt: ['#e05a4f', '#3f8f6b', '#f2c14e', '#4fa3d1', '#8e6bbf'][i % 5], pants: '#2b3346' }); p.userData.x0 = BX - 8 + i * 1.7; p.userData.z = 2.2 + (i % 3) * 0.6; qs.add(p); CROWD.push(p); }
const tShadow = tag('海の上に巨大な影', { size: 64, w: 560, bg: '#14161c', sx: 5.6 }); tShadow.position.set(BX - 2, 5.5, -6); qs.add(tShadow);
const tPanic = tag('街は大混乱', { size: 72, w: 420, bg: '#e2483c', sx: 2.6 }); tPanic.position.set(BX - 1, 3.6, 1.5); qs.add(tPanic);

// ---------- 5段目. フィルムのリール（x=130）。2016年の日本映画、総監督は庵野秀明 ----------
const FX = 130;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#141824' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const REELS = [-1.2, 1.2].map(dx => { const g = new THREE.Group(); g.position.set(FX + dx, 2.6, -1.5); const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 36), new THREE.MeshStandardMaterial({ color: '#a8acb4', metalness: 0.8, roughness: 0.3 })); disc.rotation.x = Math.PI / 2; g.add(disc); for (let i = 0; i < 5; i++) { const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16), mat('#141824')); hole.rotation.x = Math.PI / 2; const a = i / 5 * Math.PI * 2; hole.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0); g.add(hole); } qs.add(g); return g; });
const STRIP = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 52, (g, w, h) => { g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0e8d0'; for (let x = 6; x < w; x += 20) { g.fillRect(x, 4, 10, 8); g.fillRect(x, h - 12, 10, 8); } g.fillStyle = '#4a4a56'; for (let x = 10; x < w; x += 64) g.fillRect(x, 16, 54, 20); }) })); STRIP.position.set(FX, 1.2, -1.3); qs.add(STRIP);
const tJP = tag('2016年 日本映画', { size: 66, w: 560, bg: '#e6b450', color: '#14161c', sx: 3.4 }); tJP.position.set(FX, 4.6, -1.2); qs.add(tJP);
const tAnno = tag('総監督は庵野秀明', { size: 62, w: 580, bg: '#e2483c', sx: 3.4 }); tAnno.position.set(FX, 4.6, -1.2); qs.add(tAnno);
const t12 = tag('12年ぶりのシリーズ作', { size: 56, w: 640, bg: '#14161c', sx: 3.2 }); t12.position.set(FX, 3.75, -0.8); qs.add(t12);

// ---------- 6段目. 夜の街（x=170）。体長118.5メートル、赤く光る巨大不明生物（姿は見せない） ----------
const NX = 170;
{ const rd = box(30, 0.04, 20, mat('#2a2c32')); rd.position.set(NX, 0.02, -4); qs.add(rd); }
const NCITY = []; for (let i = 0; i < 10; i++) { const w = 2.4 + R() * 1.4, h = 8 + R() * 16; const wt = windowTextures(3400 + i, '#3a4458'); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.6), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0.7 })); const side = i % 2 ? 1 : -1; b.position.set(NX + side * (4 + (i >> 1) * 0.6), h / 2, -2 - (i >> 1) * 4.5); qs.add(b); NCITY.push(b); }
const GLOW = new THREE.Mesh(new THREE.PlaneGeometry(40, 50), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, w / 2); gr.addColorStop(0, 'rgba(255,90,40,1)'); gr.addColorStop(0.4, 'rgba(255,40,20,.55)'); gr.addColorStop(1, 'rgba(255,20,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); GLOW.position.set(NX, 18, -40); qs.add(GLOW);
const REDL = new THREE.PointLight(0xff3a1a, 0, 80, 1.0); REDL.position.set(NX, 20, -34); qs.add(REDL);
const RULER = new THREE.Group(); RULER.position.set(NX + 2.4, 0, -12); qs.add(RULER);
{ const bar = box(0.25, 37, 0.25, new THREE.MeshBasicMaterial({ color: '#e6b450' })); bar.position.y = 18.5; RULER.add(bar); for (let i = 0; i <= 12; i++) { const tk = box(i % 4 === 0 ? 1.4 : 0.8, 0.14, 0.14, new THREE.MeshBasicMaterial({ color: '#e6b450' })); tk.position.set(0, i * 3.08, 0); RULER.add(tk); } }
const FOOT = new THREE.Mesh(new THREE.CircleGeometry(2.6, 6), mat('#121418')); FOOT.rotation.x = -Math.PI / 2; FOOT.scale.set(1, 1.6, 1); FOOT.position.set(NX - 0.6, 0.05, -6); qs.add(FOOT);
const t118 = tag('体長118.5メートル', { size: 64, w: 600, bg: '#e6b450', color: '#14161c', sx: 4.4 }); t118.position.set(NX, 7.6, 0); qs.add(t118);
const tRed = tag('赤く光る巨大不明生物', { size: 58, w: 700, bg: '#e2483c', sx: 4.8 }); tRed.position.set(NX, 5.8, 0.5); qs.add(tRed);
const watcher = makePerson(HERO); watcher.position.set(NX, 0, 3); watcher.rotation.y = Math.PI; qs.add(watcher);

// ---------- shots ----------
const ALL = [tFlood, tWhy, tYoung, tCreature, tMeet, tOrder, tShadow, tPanic, tJP, tAnno, t12, t118, tRed];
function base() { S.reset(); CROWD.forEach(p => p.visible = false); SEA.visible = false; ALL.forEach(x => x.visible = false); RED1.intensity = 0; JET.forEach(d => d.visible = false); SPRAY.forEach(d => d.visible = false); REDL.intensity = 0; GLOW.material.opacity = 0; }

function shotTunnel(t, T) { // 1段目 0〜9：ある日、海の下のトンネルが突然水びたしに。原因は、まったくわからない（0秒目がサムネ）
  base(); S.aim(0, -6); lift(-40); S.hemi.intensity = 0.9; S.key.intensity = 0.4; S.darken(0.4, '#0a0e14');
  RED1.intensity = 8 + 6 * Math.sin(T * 6);
  WATER.scale.y = Math.max(0.01, 0.25 + 0.9 * ease(T / 9)); WATER.position.y = WATER.scale.y / 2;
  JET.forEach((d, i) => { d.visible = true; const k = ((T * 0.9 + d.userData.o) % 1); d.position.set(3.6 - k * 3.2, 4.0 - k * k * 3.6, -10 + (d.userData.a - 0.5) * 3); d.scale.setScalar(0.6 + k); });
  CARS1.forEach((c, i) => { c.rotation.z = Math.sin(T * 2 + i) * 0.03; });
  tFlood.userData.pop(1); if (T > 4.6) tFlood.visible = false;
  tWhy.userData.pop((T - 4.8) / 0.35);
  const u = ease(T / 9);
  look(lerp(-0.6, 0.0, u), lerp(2.6, 2.4, u), lerp(4.0, 2.6, u), lerp(0.4, 0.8, u), lerp(1.8, 1.6, u), -14, 58);
  return qs;
}
function shotMeeting(t) { // 2段目 9〜17：緊急会議で、若い政治家がひとつの可能性を口にする。海の中に、巨大な生き物がいるのでは
  base(); S.aim(MX, 0); lift(-40); S.hemi.intensity = 1.25;
  MEMBERS.forEach((p, i) => { p.userData.head.rotation.y = t > 4.4 ? (p.userData.back ? 0.6 : -0.6) * ease((t - 4.4) / 0.6) : Math.sin(t + i) * 0.1; });
  hero.userData.arms[1].rotation.x = t > 4 ? -1.2 * ease((t - 4) / 0.5) : 0;
  tYoung.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tYoung.visible = false;
  tCreature.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(MX + lerp(0.6, 1.6, u), lerp(2.6, 2.2, u), lerp(6.4, 5.2, u), MX + lerp(0.8, 2.0, u), 1.3, -0.4, 56);
  return qs;
}
function shotBay(t) { // 3段目 17〜25：その直後、海の上に巨大な影。普段どおりの街が、大混乱に
  base(); S.aim(BX, -10); lift(-20); S.hemi.intensity = 1.2; S.darken(0.15, '#2a3444'); SEA.visible = true;
  const k = clamp(t / 8); WAKE.position.set(BX + lerp(-10, 2, k), 0, lerp(-30, -14, k)); WAKE.children.forEach((c, i) => { if (i) { c.scale.setScalar(1 + ((t * 0.6 + i * 0.3) % 1) * 0.4); } });
  SPRAY.forEach(d => { d.visible = true; const kk = (t * 0.8 + d.userData.o) % 1; d.position.set(WAKE.position.x + Math.cos(d.userData.a) * (3 + kk * 2), Math.sin(kk * Math.PI) * 3, WAKE.position.z + Math.sin(d.userData.a) * (2 + kk * 2)); d.material.opacity = 0.8 * (1 - kk); });
  CROWD.forEach(p => p.visible = true);
  CROWD.forEach((p, i) => { const run = t > 4.2; const x = p.userData.x0 + (run ? -(t - 4.2) * 2.2 : Math.sin(t + i) * 0.2); p.position.set(x, 0.6, p.userData.z); p.rotation.y = run ? -Math.PI / 2 : Math.PI; walk(p, t * (run ? 10 : 2) + i, run ? 1 : 0.2); });
  tShadow.userData.pop((t - 0.8) / 0.35); if (t > 4.0) tShadow.visible = false;
  tPanic.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0, -1, u), lerp(4.0, 3.4, u), lerp(10, 8.5, u), BX + lerp(-2, -3, u), lerp(1.4, 1.8, u), -16, 56);
  return qs;
}
function shotOrder(t) { // 4段目 25〜33：会議に次ぐ会議。自衛隊に、防衛出動の命令が下る
  base(); S.aim(MX, 0); lift(-40); S.hemi.intensity = 1.0; S.darken(0.3, '#0e1420');
  MEMBERS.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 3 + i) * 0.4; p.userData.arms[i % 2].rotation.x = -0.5 - Math.abs(Math.sin(t * 2.4 + i)) * 0.5; });
  hero.userData.arms[1].rotation.x = 0; hero.rotation.y = -Math.PI / 2 - 0.4;
  if (t > 4.2) { const k = Math.max(0, Math.sin((t - 4.2) * Math.PI * 2.2)) * clamp(1 - (t - 4.2) / 3); S.scene.background.lerp(new THREE.Color('#5a1a16'), 0.5 * k); S.scene.fog.color.copy(S.scene.background); }
  tMeet.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMeet.visible = false;
  tOrder.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(MX + lerp(-1.4, -0.6, u), lerp(3.6, 3.2, u), lerp(7.6, 7.0, u), MX + 0.2, 1.4, -1.2, 56);
  return qs;
}
function shotFilm(t) { // 5段目 33〜42：2016年の日本映画。総監督は庵野秀明。日本で12年ぶりに作られた、あのシリーズ
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.2;
  REELS.forEach((g, i) => { g.rotation.z = -t * (1.5 + i * 0.2); });
  STRIP.material.map.offset.x = t * 0.2; STRIP.material.map.wrapS = THREE.RepeatWrapping;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  tAnno.userData.pop((t - 4.2) / 0.35); t12.userData.pop((t - 5.6) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.8, lerp(7.4, 6.8, u), FX, 3.0, -1.5, 56);
  return qs;
}
function shotCity(t, quiz = 0) { // 6段目 42〜49（決め手）：体長118.5メートル、シリーズ史上最大。赤く光る、巨大不明生物
  base(); S.aim(NX, -10); lift(-20); S.hemi.intensity = 0.5; S.key.intensity = 0.2; S.darken(0.85, '#06070c');
  const g = ease((t - 0.3) / 1.2);
  GLOW.material.opacity = (quiz ? 0.35 : 0.5) * g * (0.85 + 0.15 * Math.sin(t * 4)); REDL.intensity = 260 * g;
  RULER.visible = !quiz; RULER.scale.y = Math.max(0.01, ease((t - 0.4) / 1.6));
  if (!quiz) { t118.userData.pop((t - 1.6) / 0.35); tRed.userData.pop((t - 3.4) / 0.35); }
  watcher.userData.head.rotation.x = -0.5;
  const u = ease(t / 7);
  if (!quiz) look(NX + 1.0, lerp(2.0, 2.4, u), lerp(14, 12.5, u), NX, lerp(7, 11, u), -20, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（赤く染まる夜の街を見上げる男）
  shotCity(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.5, 0.15, d);
  S.spot.position.set(NX, 6, 6); S.spot.target.position.set(NX, 1, 3); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + 0.6, lerp(1.6, 1.4, k), lerp(7.4, 6.4, k), NX, lerp(3.0, 5.0, k), -10, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotTunnel },
  { a: 9, b: 17, f: shotMeeting },
  { a: 17, b: 25, f: shotBay },
  { a: 25, b: 33, f: shotOrder },
  { a: 33, b: 42, f: shotFilm },
  { a: 42, b: 49, f: (t) => shotCity(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '海の下のトンネルが、<br>突然、水びたしに。'],
  [5.6, 9.0, '原因は、<br>まったくわからない。'],
  [9.2, 13.2, '緊急会議で、若い政治家が<br>ある可能性を口にする。'],
  [13.2, 17.0, '海の中に、巨大な生き物が<br>いるのではないか。'],
  [17.2, 21.0, 'その直後、海の上に、<br>巨大な影。'],
  [21.0, 25.0, '普段どおりの街が、<br>大混乱に。'],
  [25.2, 29.0, '会議に次ぐ会議。<br>政府は、どう動くのか。'],
  [29.0, 33.0, '自衛隊に、<br>防衛出動の命令が下る。'],
  [33.2, 37.4, '2016年の日本映画。<br>総監督は、庵野秀明。'],
  [37.4, 41.8, '日本で12年ぶりに作られた、<br>あのシリーズ。'],
  [42.2, 45.4, '体長118.5メートル。<br>シリーズ史上最大。'],
  [45.4, 49.0, '赤く光る、<br>巨大不明生物。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、シン・ゴジラ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q033', v2: true, answer: 'シン・ゴジラ',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 3333,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'alarm'], [9.0, 'whoosh'], [17.0, 'whoosh'], [17.4, 'drone'], [21.2, 'alarm'], [25.0, 'whoosh'], [29.2, 'alarm'], [33.0, 'whoosh'], [42.0, 'drone'], [45.4, 'howl'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '118.5メートル': 'ひゃくじゅうはってんごメートル', '庵野秀明': 'あんのひであき', '巨大不明生物': 'きょだいふめいせいぶつ', '防衛出動': 'ぼうえいしゅつどう', '史上最大': 'しじょうさいだい', '自衛隊': 'じえいたい', '12年ぶり': 'じゅうにねんぶり', '2016年': 'にせんじゅうろくねん', '総監督': 'そうかんとく', '海の下': 'うみのした', '水びたし': 'みずびたし', '突然': 'とつぜん', '原因': 'げんいん', '緊急会議': 'きんきゅうかいぎ', '若い政治家': 'わかいせいじか', '可能性': 'かのうせい', '口にする': 'くちにする', '巨大': 'きょだい', '生き物': 'いきもの', '直後': 'ちょくご', '影': 'かげ', '普段': 'ふだん', '大混乱': 'だいこんらん', '次ぐ': 'つぐ', '政府': 'せいふ', '命令': 'めいれい', '下る': 'くだる', '日本映画': 'にほんえいが', '作られた': 'つくられた', '体長': 'たいちょう', '赤く光る': 'あかくひかる', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n海の下のトンネルが、突然水びたしに。原因は、まったくわからない。緊急会議で、若い政治家がある可能性を口にする。海の中に、巨大な生き物がいるのではないか。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Hulu', '映画好き', '邦画'],
  },
});
applyQuizCards({ answer: 'シン・ゴジラ', info: 'U-NEXT・Hulu｜日本映画', answerSize: 128 });
