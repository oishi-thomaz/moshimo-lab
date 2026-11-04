import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #052 イカゲーム（ドラマ・韓国・2021年・全9話。Netflixで見放題、
//   justwatch.com/jp/テレビ番組/ojingeo-geim で2026/11/4確認。Filmarks シーズン1 3.8・レビュー102,648件 filmarks.com/dramas/11249/15619）
// 確かめた事実（Filmarks のエピソード紹介・ja.wikipedia.org/wiki/イカゲーム。2026/11/4）：
//   ・2021年9月17日に全9話を配信。参加者は456人、最後の1人が456億ウォンを得る
//   ・主人公は47歳、運転代行の仕事。借金に追われ、離婚して娘の親権を失っていて、娘のために参加を決める
//   ・スーツの男に勝負を持ちかけられ、勝って招待状（カード）を受け取る。運営はピンクのジャンプスーツ、○△□の黒い覆面
//   ・第1ゲームは だるまさんがころんだ（子どもの遊び）。公開28日で1億4,200万世帯以上が視聴、Netflix史上最大のヒット
// 構成（ヒント6段）：1 借金まみれの男に、電話番号だけのカード → 2 40代・運転代行、娘のためにお金がいる → 3 目が覚めると巨大な部屋、並ぶベッドと同じ服の人
//   → 4 参加者456人、子どもの遊びで勝負 → 5 2021年の韓国ドラマ・全9話、世界中で大ヒット → 6 決め手：賞金456億ウォン、ピンクの服と○△□の覆面
// ○△□・ピンクの服・456億は6段目まで出さない（カードは無地）。駅のめんこ勝負・人形のゲームなど有名な場面の構図は使わない。脱落の中身は言わない。人は汎用の3D

const S = quizStage({ bg: '#1c2230', floor: '#2a2e38', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(5252);

const MAN = { skin: '#eccaa8', hair: '#1a1614', shirt: '#6a5a48', pants: '#2a2a30' };
const TRACK = { skin: '#eccaa8', hair: '#1a1614', shirt: '#2f8a7a', pants: '#2f8a7a' };

// ---------- 1段目. 夜の路地（x=0）。男の手に、電話番号だけの黒いカード ----------
{ const fl = box(14, 0.04, 14, mat('#30323a')); fl.position.set(0, 0.02, -2); qs.add(fl);
  for (const s of [-1, 1]) { const wt = windowTextures(5201 + s, '#5a5048'); wt.map.repeat.set(3, 4); wt.emi.repeat.set(3, 4); const b = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 14), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd8a0'), emissiveIntensity: 0.4 })); b.position.set(s * 4.6, 6, -4); qs.add(b); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a8' })); lamp.position.set(-1.6, 4.2, -3); qs.add(lamp); const pole = box(0.1, 4.2, 0.1, mat('#2a2a2e')); pole.position.set(-1.6, 2.1, -3); qs.add(pole); }
const BILLS = []; for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), new THREE.MeshBasicMaterial({ map: canvasTex(96, 128, (g, w, h) => { g.fillStyle = '#f4efe4'; g.fillRect(0, 0, w, h); g.fillStyle = '#d23a32'; g.fillRect(8, 8, w - 16, 18); g.fillStyle = '#b8b2a6'; for (let y = 40; y < h - 10; y += 14) g.fillRect(10, y, w - 20, 3); }), side: THREE.DoubleSide })); p.userData = { x: (R() - 0.5) * 3.2, y: 0.6 + R() * 2.6, z: -1.2 - R() * 1.4, o: R() * 6 }; qs.add(p); BILLS.push(p); }
const m1 = makePerson(MAN); m1.position.set(0, 0, 0); qs.add(m1);
const CARD = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.28), new THREE.MeshBasicMaterial({ map: canvasTex(256, 156, (g, w, h) => { g.fillStyle = '#c9a77a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2016'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('*** - **** - ****', w / 2, h / 2 + 10); }), side: THREE.DoubleSide })); qs.add(CARD);
const GLOW = new THREE.PointLight(0xffe0a0, 0, 4, 1.5); qs.add(GLOW);
const tDebt = tag('借金まみれ', { size: 80, w: 420, bg: '#e2483c', sx: 1.45 }); tDebt.position.set(0, 2.28, 0.3); qs.add(tDebt);
const tCard = tag('電話番号だけのカード', { size: 58, w: 620, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tCard.position.set(0.1, 2.3, 0.3); qs.add(tCard);

// ---------- 2段目. 夜の駐車場（x=40）。運転代行の男と、遠くの娘 ----------
const PX = 40;
{ const fl = box(16, 0.04, 16, mat('#34363e')); fl.position.set(PX, 0.02, -3); qs.add(fl);
  for (let i = -2; i <= 2; i++) { const ln = box(0.08, 0.02, 2.4, mat('#d8d4c8')); ln.position.set(PX + i * 2.4, 0.05, -4); qs.add(ln); } }
const CAR = new THREE.Group(); CAR.position.set(PX + 1.6, 0, -1); qs.add(CAR);
{ const b = box(1.7, 0.6, 3.6, mat('#2a3448')); b.position.y = 0.55; CAR.add(b); const t = box(1.5, 0.5, 1.9, mat('#3a465c')); t.position.set(0, 1.1, -0.2); CAR.add(t);
  for (const x of [-0.8, 0.8]) for (const z of [-1.2, 1.2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), mat('#141414')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.3, z); CAR.add(w); }
  for (const x of [-0.55, 0.55]) { const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); hl.position.set(x, 0.6, 1.81); CAR.add(hl); } }
CAR.rotation.y = -0.4;
const m2 = makePerson(MAN); m2.position.set(PX - 0.4, 0, 0.4); qs.add(m2);
const KEYS = box(0.1, 0.14, 0.03, mat('#c8c8cc')); qs.add(KEYS);
const girl = makePerson({ skin: '#f2d4b8', hair: '#2a1a14', shirt: '#e88aa0', pants: '#3a3a5a', long: true, skirt: true, scale: 0.66 }); girl.position.set(PX - 2.3, 0, -3.2); qs.add(girl);
const HEART = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: '#ff8aa8' })); HEART.position.set(PX - 2.3, 1.45, -3.2); qs.add(HEART);
const tJob = tag('仕事は運転代行', { size: 70, w: 520, bg: '#14161c', sx: 1.5 }); tJob.position.set(PX - 0.2, 2.45, 0.4); qs.add(tJob);
const tDau = tag('娘のために大金がいる', { size: 60, w: 640, bg: '#e2483c', sx: 1.6 }); tDau.position.set(PX - 0.2, 2.45, 0.4); qs.add(tDau);

// ---------- 3段目. 巨大な部屋（x=80）。高く積まれたベッドと、同じ服の人たち ----------
const BX = 80;
{ const fl = box(22, 0.04, 18, mat('#cfd2d0')); fl.position.set(BX, 0.02, -4); qs.add(fl);
  const wl = box(22, 14, 0.3, mat('#e8ecea')); wl.position.set(BX, 7, -12); qs.add(wl);
  for (const s of [-1, 1]) { const sw = box(0.3, 14, 18, mat('#dfe4e2')); sw.position.set(BX + s * 11, 7, -4); qs.add(sw); } }
const BUNK = new THREE.Group(); BUNK.position.set(BX, 0, -9); qs.add(BUNK);
for (let c = -3; c <= 3; c++) for (let lv = 0; lv < 5; lv++) { const fr = box(1.9, 0.12, 1.2, mat('#5a6a78')); fr.position.set(c * 2.6, 0.5 + lv * 1.6, 0); BUNK.add(fr); const mt = box(1.8, 0.16, 1.1, mat('#f4f2ec')); mt.position.set(c * 2.6, 0.64 + lv * 1.6, 0); BUNK.add(mt); const bl = box(1.1, 0.32, 1.24, mat(['#e8c860', '#d86a5a', '#6aa0d8', '#f0f0ea'][(c + lv + 8) % 4])); bl.position.set(c * 2.6 + 0.3, 0.8 + lv * 1.6, 0.04); BUNK.add(bl); const pl = box(0.4, 0.14, 0.7, mat('#ffffff')); pl.position.set(c * 2.6 - 0.62, 0.78 + lv * 1.6, 0); BUNK.add(pl); for (const sx of [-0.95, 0.95]) { const po = box(0.08, 1.6, 0.08, mat('#4a5a68')); po.position.set(c * 2.6 + sx, 0.8 + lv * 1.6, 0.55); BUNK.add(po); } }
const CROWD = []; for (let i = 0; i < 26; i++) { const p = makePerson({ ...TRACK, hair: ['#1a1614', '#3a2a20', '#6a6a6a', '#1a1614'][i % 4], long: i % 3 === 0 }); p.position.set(BX - 7 + (i % 9) * 1.7 + (R() - 0.5) * 0.4, 0, -5.6 + Math.floor(i / 9) * 1.6); p.rotation.y = (R() - 0.5) * 1.2; qs.add(p); CROWD.push(p); }
const m3 = makePerson({ ...TRACK, hair: MAN.hair }); m3.position.set(BX, 0, 0.6); qs.add(m3);
const tWake = tag('目が覚めると…', { size: 72, w: 500, bg: '#14161c', sx: 1.6 }); tWake.position.set(BX, 2.45, 0.6); qs.add(tWake);
const tSame = tag('全員、同じ服', { size: 72, w: 460, bg: '#2f8a7a', sx: 2.2 }); tSame.position.set(BX, 5.0, -1); qs.add(tSame);

// ---------- 4段目. 大きな遊び場（x=120）。子どもの遊びで勝負する大勢の人 ----------
const GX = 120;
{ const fl = box(26, 0.04, 22, mat('#d8b884')); fl.position.set(GX, 0.02, -6); qs.add(fl);
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), new THREE.MeshBasicMaterial({ map: canvasTex(512, 240, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8ec8f0'); gr.addColorStop(1, '#d8eef8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(40 + i * 75, 50 + (i % 2) * 30, 34, 14, 0, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#6ab06a'; g.fillRect(0, h - 40, w, 40); }) })); wl.position.set(GX, 6, -16); qs.add(wl);
  const sl = box(0.8, 0.1, 4, mat('#e85a4a')); sl.position.set(GX + 6, 1.4, -9); sl.rotation.x = 0.4; qs.add(sl); const tw = box(1.4, 2.8, 1.4, mat('#f2c14e')); tw.position.set(GX + 6, 1.4, -11.4); qs.add(tw);
  const sw = box(3, 0.12, 0.12, mat('#3a7ad8')); sw.position.set(GX - 6, 2.6, -10); qs.add(sw); for (const s of [-1, 1]) { const lg = box(0.12, 2.6, 0.12, mat('#3a7ad8')); lg.position.set(GX - 6 + s * 1.5, 1.3, -10); qs.add(lg); } }
const PLAYERS = []; for (let i = 0; i < 40; i++) { const p = makePerson({ ...TRACK, hair: ['#1a1614', '#3a2a20', '#6a6a6a'][i % 3], long: i % 4 === 0, scale: 0.9 }); p.position.set(GX - 9 + (i % 10) * 2 + (R() - 0.5) * 0.6, 0, -9 + Math.floor(i / 10) * 1.8 + (R() - 0.5) * 0.5); p.userData.ph = R() * 6; qs.add(p); PLAYERS.push(p); }
const BALLS = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshStandardMaterial({ color: ['#e85a4a', '#3a7ad8', '#f2c14e'][i % 3], roughness: 0.2, metalness: 0.1 })); b.position.set(GX - 1.2 + i * 0.5, 0.14, 1.4 + (i % 2) * 0.3); qs.add(b); BALLS.push(b); }
const t456 = tag('参加者 456人', { size: 76, w: 480, bg: '#14161c', sx: 2.6 }); t456.position.set(GX, 3.4, 0); qs.add(t456);
const tPlay = tag('子どもの遊びで勝負', { size: 62, w: 600, bg: '#e6b450', color: '#14161c', sx: 2.8 }); tPlay.position.set(GX, 3.4, 0); qs.add(tPlay);

// ---------- 5段目. テレビの前（x=160）。2021年の韓国ドラマ・全9話 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#181a24' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2f8a7a'); gr.addColorStop(1, '#1a3a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(56 + i * 50, h / 2, 18, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const GLOBE = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 16), new THREE.MeshStandardMaterial({ color: '#3a7ad8', roughness: 0.6 })); GLOBE.position.set(TX + 2.4, 0.9, -0.4); qs.add(GLOBE);
const LAND = []; for (let i = 0; i < 6; i++) { const l = box(0.4 + R() * 0.3, 0.3, 0.1, mat('#6ab06a')); LAND.push(l); GLOBE.add(l); const a = i * 1.05, b = (R() - 0.5) * 1.2; l.position.set(Math.cos(a) * Math.cos(b) * 0.88, Math.sin(b) * 0.88, Math.sin(a) * Math.cos(b) * 0.88); l.lookAt(0, 0, 0); }
const tKR = tag('2021年 韓国ドラマ', { size: 64, w: 600, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tKR.position.set(TX, 4.6, -1.2); qs.add(tKR);
const t9 = tag('全9話', { size: 80, w: 320, bg: '#3a7ad8', sx: 1.8 }); t9.position.set(TX + 0.6, 4.6, -1.2); qs.add(t9);
const tWorld = tag('世界中で大ヒット', { size: 64, w: 560, bg: '#e2483c', sx: 2.8 }); tWorld.position.set(TX + 0.6, 3.75, -1.0); qs.add(tWorld);

// ---------- 6段目. 見張りと、宙に吊られた賞金（x=200） ----------
const DX = 200;
{ const fl = box(20, 0.04, 14, mat('#2a2a32')); fl.position.set(DX, 0.02, -3); qs.add(fl); }
const BANK = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 20), new THREE.MeshStandardMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.2 })); BANK.position.set(DX, 4.9, -3); qs.add(BANK);
const CASH = []; for (let i = 0; i < 70; i++) { const c = box(0.34, 0.06, 0.18, mat(['#d8c060', '#c8b050', '#e6d278'][i % 3])); const a = R() * 6.28, r = Math.sqrt(R()) * 1.2, y = -1.3 + R() * 1.4 * (r < 0.8 ? 1 : 0.6); c.position.set(DX + Math.cos(a) * r, 4.9 + y, -3 + Math.sin(a) * r); c.rotation.set(R() * 3, R() * 3, R() * 3); qs.add(c); CASH.push(c); }
const CORD = box(0.04, 4, 0.04, mat('#8a8a90')); CORD.position.set(DX, 8.3, -3); qs.add(CORD);
const shapeTex = (k) => canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#111114'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f4f4f4'; g.lineWidth = 9; g.beginPath(); if (k === 0) { g.arc(w / 2, h / 2, 30, 0, Math.PI * 2); g.closePath(); } else if (k === 1) { g.moveTo(w / 2, 30); g.lineTo(w / 2 + 34, 94); g.lineTo(w / 2 - 34, 94); g.closePath(); } else g.rect(34, 34, 60, 60); g.stroke(); });
const GUARDS = []; for (let i = 0; i < 3; i++) { const p = makePerson({ skin: '#111114', hair: '#111114', shirt: '#f0588a', pants: '#f0588a', scale: 1.3 }); p.position.set(DX - 1.7 + i * 1.7, 0, 0.6 - (i === 1 ? 0.5 : 0)); qs.add(p); const fc = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.42), new THREE.MeshBasicMaterial({ map: shapeTex(i) })); fc.position.set(0, 0.24, 0.222); p.userData.head.add(fc); const hood = box(0.46, 0.5, 0.44, mat('#f0588a')); hood.position.set(0, 0.26, -0.03); p.userData.head.add(hood); GUARDS.push(p); }
const tPrize = tag('賞金 456億ウォン', { size: 66, w: 580, bg: '#e6b450', color: '#14161c', sx: 3.6 }); tPrize.position.set(DX, 6.9, -3); qs.add(tPrize);
const tMask = tag('ピンクの服と ○△□の覆面', { size: 54, w: 720, bg: '#c8306a', sx: 3.2 }); tMask.position.set(DX, 3.45, 0.8); qs.add(tMask);

// ---------- shots ----------
const ALL = [tDebt, tCard, tJob, tDau, tWake, tSame, t456, tPlay, tKR, t9, tWorld, tPrize, tMask];
function base() { S.reset(); ALL.forEach(x => x.visible = false); GLOW.intensity = 0; }

function shotAlley(t) { // 1段目 0〜9：借金まみれの男に、電話番号だけのカード（0秒目がサムネ）
  base(); S.aim(0, -1); lift(-40); S.hemi.intensity = 0.8; S.key.intensity = 0.8; S.darken(0.55, '#0a0c16');
  BILLS.forEach(b => { b.visible = true; const f = (t * 0.35 + b.userData.o) % 1; b.position.set(b.userData.x + Math.sin(t + b.userData.o) * 0.2, b.userData.y - f * 0.4, b.userData.z); b.rotation.set(Math.sin(t * 1.3 + b.userData.o) * 0.5, b.userData.o, Math.cos(t + b.userData.o) * 0.3); });
  m1.userData.arms[1].rotation.x = -1.2; m1.userData.head.rotation.x = 0.35;
  CARD.position.set(0.3, 1.32, 0.48); CARD.rotation.set(-0.7, 0, 0.1); GLOW.position.set(0.3, 1.5, 0.8); GLOW.intensity = 3 + Math.sin(t * 3) * 0.8;
  tDebt.userData.pop(1); if (t > 4.6) tDebt.visible = false;
  tCard.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(2.3, 2.0, u), lerp(4.6, 3.4, u), 0.1, 1.5, 0, 54);
  return qs;
}
function shotLot(t) { // 2段目 9〜17：40代・運転代行の男。娘のためにお金がいる
  base(); S.aim(PX, -2); lift(-40); S.hemi.intensity = 1.35; S.key.intensity = 1.2; S.darken(0.35, '#0a0c16');
  m2.userData.arms[0].rotation.x = -0.6; KEYS.position.set(PX - 0.72, 1.0, 0.62);
  m2.userData.head.rotation.y = t > 4 ? lerp(0, 0.9, ease((t - 4) / 1.2)) : 0;
  HEART.visible = t > 4.4; HEART.scale.setScalar(1 + Math.sin(t * 4) * 0.12);
  tJob.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJob.visible = false;
  tDau.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(PX + lerp(0.9, 0.5, u), lerp(2.0, 1.9, u), lerp(4.8, 4.2, u), PX - 0.9, 1.35, -1.2, 56);
  return qs;
}
function shotHall(t) { // 3段目 17〜25：目が覚めると巨大な部屋。並ぶベッドと同じ服の人たち
  base(); S.aim(BX, -4); lift(-30); S.hemi.intensity = 1.3; S.key.intensity = 1.1;
  m3.userData.head.rotation.y = Math.sin(t * 0.9) * 0.6;
  CROWD.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.7 + i) * 0.4; });
  tWake.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWake.visible = false;
  tSame.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0, u), lerp(2.0, 3.6, u), lerp(4.6, 7.4, u), BX, lerp(1.7, 3.4, u), -6, 58);
  return qs;
}
function shotPlay(t) { // 4段目 25〜33：参加者は456人。子どもの遊びで勝負
  base(); S.aim(GX, -5); lift(-30); S.hemi.intensity = 1.4; S.darken(0, '#8ec8f0');
  PLAYERS.forEach(p => { poseWalk(p, t * 4 + p.userData.ph, 0.4); });
  BALLS.forEach((b, i) => { b.position.y = 0.14 + Math.abs(Math.sin(t * 3 + i)) * 0.3; });
  t456.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t456.visible = false;
  tPlay.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(GX, lerp(5.0, 4.0, u), lerp(9.0, 7.8, u), GX, 1.6, -6, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2021年の韓国ドラマ。全9話。世界中で大ヒット
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.2;
  GLOBE.rotation.y = t * 0.6;
  tKR.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKR.visible = false;
  t9.userData.pop((t - 4.2) / 0.35); tWorld.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.6, 2.8, lerp(7.8, 7.0, u), TX + 0.6, 2.7, -1.5, 56);
  return qs;
}
function shotGuards(t, quiz = 0) { // 6段目 42〜49（決め手）：賞金456億ウォン。ピンクの服と○△□の覆面
  base(); S.aim(DX, 0); lift(-30); S.hemi.intensity = 1.5; S.key.intensity = 1.6; S.darken(0.4, '#0a0a12');
  BANK.rotation.y = t * 0.3; S.spot.color.set(0xfff0c8); S.spot.position.set(DX, 9, 2); S.spot.target.position.set(DX, 4.7, -3); S.spot.intensity = 80;
  GUARDS.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.6 + i) * 0.15; });
  if (!quiz) { tPrize.userData.pop((t - 0.4) / 0.35); tMask.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(DX, lerp(1.7, 1.9, u), lerp(8.6, 8.0, u), DX, 3.2, -2, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（同じ服の人たちの部屋）
  shotHall(7.9);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.3, 0.25, d); S.key.intensity = lerp(1.1, 0.2, d);
  S.spot.color.set(0xffe0c0); S.spot.position.set(BX, 6, 4); S.spot.target.position.set(BX, 1, 0.6); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(BX + lerp(0.8, 0.4, k), lerp(2.0, 1.8, k), lerp(4.8, 3.8, k), BX, 1.6, 0.4, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotAlley },
  { a: 9, b: 17, f: shotLot },
  { a: 17, b: 25, f: shotHall },
  { a: 25, b: 33, f: shotPlay },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotGuards(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '借金まみれの男に、<br>一枚のカードが届いた。'],
  [5.6, 9.0, '書いてあるのは、<br>電話番号だけ。'],
  [9.2, 13.2, '男は40代。<br>仕事は運転代行。'],
  [13.2, 17.0, '別れて暮らす娘のために、<br>大金がいる。'],
  [17.2, 21.0, '目が覚めると、<br>見知らぬ巨大な部屋。'],
  [21.0, 25.0, 'ずらりと並ぶベッドと、<br>同じ服の人たち。'],
  [25.2, 29.0, '参加者は456人。<br>勝てば、大金が手に入る。'],
  [29.0, 33.0, '勝負するのは、<br>子どものころの遊び。'],
  [33.2, 37.4, '2021年の韓国ドラマ。<br>全9話。'],
  [37.4, 41.8, '世界中で、<br>大ヒットした。'],
  [42.2, 45.4, '賞金は、<br>456億ウォン。'],
  [45.4, 49.0, 'ピンクの服と、<br>○△□の覆面。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、イカゲーム。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q052', v2: true, answer: 'イカゲーム',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 5252,
    hits: [5.6, 25.2, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [17.4, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.4, 'drone'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '借金': 'しゃっきん', '一枚': 'いちまい', '電話番号': 'でんわばんごう', '40代': 'よんじゅうだい', '運転代行': 'うんてんだいこう', '別れて': 'わかれて', '娘': 'むすめ', '大金': 'たいきん', '見知らぬ': 'みしらぬ', '巨大': 'きょだい', '部屋': 'へや', '参加者': 'さんかしゃ', '456人': 'よんひゃくごじゅうろくにん', '勝負': 'しょうぶ', '遊び': 'あそび', '2021年': 'にせんにじゅういちねん', '韓国': 'かんこく', '全9話': 'ぜんきゅうわ', '世界中': 'せかいじゅう', '賞金': 'しょうきん', '456億ウォン': 'よんひゃくごじゅうろくおくウォン', '○△□': 'まるさんかくしかく', '覆面': 'ふくめん', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n借金まみれの男に、一枚のカードが届いた。書いてあるのは、電話番号だけ。目が覚めると、見知らぬ巨大な部屋。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', 'サスペンス'],
  },
});
applyQuizCards({ answer: 'イカゲーム', info: 'Netflix｜韓国ドラマ・全9話', answerSize: 136 });
