import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #095 アンメット ある脳外科医の日記（ドラマ・日本・カンテレ制作 フジテレビ系 月曜22時・2024年4月15日〜・全11話。
//   FOD・Netflix・Hulu で見放題、JustWatch 日本版 justwatch.com/jp/テレビ番組/anmetsuto-arunoy-wai-ke-yi-nori-ji/シーズン-1 で2026/11/16確認
//   （Filmarks の動画配信欄も FOD・Netflix・Hulu・Prime Video・U-NEXT ほか見放題）。Filmarks 4.4・レビュー39,532件 filmarks.com/dramas/14862/20206）
// 話題：続編が2027年1月期（カンテレ・フジテレビ系 月曜22時）に放送決定（cinematoday.jp/news/N0157777、2026/11/4）
// 確かめた事実（bunshun.jp/articles/-/70991、cinematoday.jp/news/N0157777。2026/11/16）：
//   ・主人公は脳外科医。事故で脳を損傷し、過去2年間の記憶がなく、今日の出来事も明日には忘れてしまう記憶障害（cinematoday）
//   ・毎朝早く起き、時計の裏に貼ったメモに従って、前の夜に自分で書いた日記を読み返してから病院へ向かう（文春）
//   ・主治医の教授に医療行為を禁じられ、看護助手として働いている。同僚や患者にやさしく接する（文春）
//   ・アメリカで腕を磨いた超高度な技術の脳外科医が配属され、看護師長の制止を無視して主人公に手術の助手を任せる。髪はボサボサ・サンダル履き（文春）
//   ・2024年4月期。ザテレビジョンドラマアカデミー賞で最優秀作品賞を含む主要6部門（cinematoday）
// 構成（ヒント6段）：1 目覚まし時計の裏に自分あてのメモ・毎朝まず日記を読み返す → 2 事故で2年分の記憶をなくした・今日のことも明日には消える
//   → 3 職場は大きな病院・看護助手として働く・患者にも同僚にもやさしい → 4 アメリカ帰りの腕のいい医師・手術の助手を彼女にまかせる
//   → 5 2024年の日本の医療ドラマ・ドラマ賞で最優秀作品賞など6部門 → 6 決め手：じつは彼女も脳外科医・2027年1月に続編
// 恋のゆくえ・記憶障害の原因の真相・結末は言わない。人物名・病院名・地名は出さない。俳優の顔・ポスター・ロゴ・劇中の有名な場面は使わない。人は汎用の3D
const S = quizStage({ bg: '#1c2028', floor: '#262a32', fogNear: 28, fogFar: 100 });
const qs = S.scene;
const R = rng(9595);

const MIYA = { skin: '#f6d8bc', hair: '#2a201c', shirt: '#e8dce8', pants: '#8a8ab0', long: true };          // パジャマ
const MIYA_W = { skin: '#f6d8bc', hair: '#2a201c', shirt: '#f0a8b8', pants: '#f0a8b8', long: true };        // 看護助手の服
const DOC = { skin: '#f1c9a5', hair: '#1a1614', shirt: '#f4f4f0', pants: '#2a3a5a' };                         // ボサボサ頭の医師
const PAT = { skin: '#f0caa8', hair: '#8a8a8a', shirt: '#a8c8e0', pants: '#a8c8e0' };
const NURSE = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#2a4a8a', pants: '#2a4a8a', long: true };
const YEL = '#f2d24a';

function bed(col = '#e8ecf0') { const g = new THREE.Group();
  const fr = box(1.2, 0.4, 2.2, mat('#8a7a6a')); fr.position.y = 0.2; g.add(fr);
  const mt = box(1.14, 0.18, 2.1, mat(col)); mt.position.y = 0.49; g.add(mt);
  const pl = box(0.7, 0.14, 0.4, mat('#ffffff')); pl.position.set(0, 0.64, -0.8); g.add(pl);
  const bl = box(1.16, 0.08, 1.2, mat('#a8b8d8')); bl.position.set(0, 0.6, 0.4); g.add(bl);
  return g; }
function diary(col = '#c8503a') { const g = new THREE.Group();
  const c = box(0.36, 0.05, 0.48, mat(col)); g.add(c);
  const pg = box(0.33, 0.04, 0.45, mat('#f6f2e6')); pg.position.set(0.012, 0.004, 0); g.add(pg);
  const c2 = box(0.36, 0.01, 0.48, mat(col)); c2.position.y = 0.03; g.add(c2);
  const band = box(0.36, 0.012, 0.05, mat('#e6c050')); band.position.set(0, 0.037, 0.14); g.add(band);
  return g; }
function openDiary() { const g = new THREE.Group();
  const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshStandardMaterial({ map: canvasTex(450, 300, (c, w, h) => {
    c.fillStyle = '#f6f2e6'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8b8a0'; c.fillRect(w / 2 - 2, 0, 4, h);
    c.strokeStyle = '#7a8aa8'; c.lineWidth = 3; for (let s = 0; s < 2; s++) for (let i = 0; i < 7; i++) { const x0 = 24 + s * (w / 2); c.beginPath(); c.moveTo(x0, 40 + i * 36); c.lineTo(x0 + 150 - (i * 23 % 60), 40 + i * 36); c.stroke(); } }) }));
  pg.rotation.x = -Math.PI / 2; g.add(pg);
  const cv = box(0.94, 0.02, 0.64, mat('#c8503a')); cv.position.y = -0.012; g.add(cv);
  return g; }

// ---------- 1段目. 朝の寝室（x=0）。ベッドの横の目覚まし時計、その裏に黄色いメモ。手には日記 ----------
{ const fl = box(12, 0.04, 9, mat('#b89a78')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#e8e0d4')); wl.position.set(0, 2.5, -4.6); qs.add(wl);
  const win = box(1.8, 1.4, 0.06, new THREE.MeshBasicMaterial({ color: '#cfe4f4' })); win.position.set(2.0, 2.4, -4.47); qs.add(win);
  const wf = box(1.95, 0.08, 0.08, mat('#ffffff')); wf.position.set(2.0, 2.4, -4.44); qs.add(wf);
  const cu = box(0.5, 1.8, 0.06, mat('#f0d0a0')); cu.position.set(0.85, 2.3, -4.42); qs.add(cu); }
const BED1 = bed(); BED1.position.set(-0.4, 0, -3.0); qs.add(BED1);
{ const ns = box(0.6, 0.6, 0.5, mat('#9a7a5a')); ns.position.set(0.65, 0.3, -3.9); qs.add(ns); }
const CLOCK1 = new THREE.Group();
{ const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 24), mat('#e8584a')); b.rotation.x = Math.PI / 2; CLOCK1.add(b);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), new THREE.MeshBasicMaterial({ map: canvasTex(140, 140, (c, w, h) => { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(70, 70, 68, 0, 7); c.fill(); c.strokeStyle = '#14161c'; c.lineWidth = 7; c.beginPath(); c.moveTo(70, 70); c.lineTo(70, 26); c.stroke(); c.beginPath(); c.moveTo(70, 70); c.lineTo(102, 82); c.stroke(); }) }));
  face.position.z = 0.051; CLOCK1.add(face);
  for (const s of [-1, 1]) { const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#d8dce4')); bell.position.set(s * 0.11, 0.17, 0); CLOCK1.add(bell); }
  for (const s of [-1, 1]) { const lg = box(0.03, 0.06, 0.03, mat('#14161c')); lg.position.set(s * 0.1, -0.18, 0); CLOCK1.add(lg); } }
CLOCK1.position.set(0.6, 0.81, -3.85); CLOCK1.rotation.y = -0.2; qs.add(CLOCK1);
const MEMO1 = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshStandardMaterial({ color: YEL, side: THREE.DoubleSide })); qs.add(MEMO1);
const miya1 = makePerson(MIYA); qs.add(miya1);
const DIARY1 = diary(); qs.add(DIARY1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.4 }); qs.add(Q1);
const tMemo = tag('時計の裏に、メモ', { size: 58, w: 560, bg: '#14161c', sx: 1.6 }); tMemo.position.set(0.3, 2.75, -3.0); qs.add(tMemo);
const tRead = tag('毎朝まず、日記を読む', { size: 56, w: 640, bg: '#c8202c', sx: 1.8 }); tRead.position.set(0.3, 2.75, -3.0); qs.add(tRead);

// ---------- 2段目. 記憶の部屋（x=40）。2年分のカレンダーが消えていく → 今日のページも夜には消える ----------
const AX = 40;
{ const fl = box(14, 0.04, 10, mat('#22262e')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(14, 7, 0.2, mat('#2a2e38')); wl.position.set(AX, 3.5, -5); qs.add(wl); }
const CAL2 = [];
for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) {
  const n = r * 6 + i;
  const c = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(124, 124, (g, w, h) => { g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8503a'; g.fillRect(0, 0, w, 28); g.fillStyle = '#5a5e68'; for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) g.fillRect(12 + x * 27, 42 + y * 26, 16, 14); }) }));
  c.position.set(AX - 2.0 + i * 0.8, 3.05 + r * 0.66, -4.85); qs.add(c); CAL2.push(c); }
const miya2 = makePerson(MIYA_W); miya2.position.set(AX + 0.8, 0, -1.9); qs.add(miya2);
const PAGE2 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(200, 200, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a6ab0'; g.fillRect(0, 0, w, 44); g.fillStyle = '#14161c'; g.font = '900 110px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 100, 124); }) }));
PAGE2.position.set(AX - 0.6, 1.9, -2.4); qs.add(PAGE2);
const tTwo = tag('2年分の、記憶がない', { size: 56, w: 640, bg: '#14161c', sx: 2.6 }); tTwo.position.set(AX, 5.75, -4.4); qs.add(tTwo);
const tGone = tag('今日も、明日には消える', { size: 54, w: 680, bg: '#2a6ab0', sx: 2.1 }); tGone.position.set(AX + 0.1, 3.0, -2.4); qs.add(tGone);

// ---------- 3段目. 大きな病院の廊下（x=80）。看護助手がシーツのカートを押す。患者にあいさつ ----------
const BX = 80;
{ const fl = box(6, 0.04, 30, mat('#d8dce0')); fl.position.set(BX, 0.02, -10); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.2, 4, 30, mat('#eef0f2')); wl.position.set(BX + s * 3, 2, -10); qs.add(wl);
    const rail = box(0.08, 0.08, 30, mat('#9ab0c0')); rail.position.set(BX + s * 2.88, 0.9, -10); qs.add(rail);
    for (let i = 0; i < 5; i++) { const d = box(0.06, 2.2, 1.2, mat('#8ab0c8')); d.position.set(BX + s * 2.9, 1.1, -2 - i * 5); qs.add(d); } }
  for (let i = 0; i < 8; i++) { const l = box(1.2, 0.04, 0.4, new THREE.MeshBasicMaterial({ color: '#ffffff' })); l.position.set(BX, 3.98, 1 - i * 3.5); qs.add(l); }
  const line = box(0.12, 0.01, 30, mat('#6ab08a')); line.position.set(BX - 1.2, 0.05, -10); qs.add(line); }
const CART3 = new THREE.Group();
{ const b = box(0.7, 0.6, 1.0, mat('#c8d0d8')); b.position.y = 0.6; CART3.add(b);
  for (let i = 0; i < 3; i++) { const s = box(0.62, 0.12, 0.9, mat(['#ffffff', '#cfe0f0', '#ffffff'][i])); s.position.y = 0.96 + i * 0.13; CART3.add(s); }
  for (const [x, z] of [[0.3, 0.45], [-0.3, 0.45], [0.3, -0.45], [-0.3, -0.45]]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#24262b')); w.position.set(x, 0.07, z); CART3.add(w); }
  const pole = box(0.04, 0.3, 0.04, mat('#24262b')); pole.position.set(0, 0.25, 0); CART3.add(pole); }
qs.add(CART3);
const miya3 = makePerson(MIYA_W); qs.add(miya3);
const pat3 = makePerson(PAT); pat3.position.set(BX - 1.6, 0, -9); pat3.rotation.y = Math.PI / 2; qs.add(pat3);
const HEART3 = []; for (let i = 0; i < 2; i++) { const h = tag('♥', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#ff6a8a', sx: 0.3 }); qs.add(h); HEART3.push(h); }
const tHosp = tag('職場は、大きな病院', { size: 58, w: 600, bg: '#14161c', sx: 2.0 }); qs.add(tHosp);
const tAide = tag('看護助手として、働く', { size: 56, w: 640, bg: '#d0607a', sx: 2.1 }); qs.add(tAide);

// ---------- 4段目. 手術室の前（x=120）。サンダル履きのボサボサ頭の医師が、手術着を彼女にわたす ----------
const CX = 120;
{ const fl = box(14, 0.04, 12, mat('#c8d4d8')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#d8e4e8')); wl.position.set(CX, 3, -5); qs.add(wl);
  for (const s of [-1, 1]) { const d = box(1.4, 2.6, 0.08, mat('#7a9aa8')); d.position.set(CX + s * 0.72, 1.3, -4.88); qs.add(d); const wn = box(0.4, 0.4, 0.09, new THREE.MeshBasicMaterial({ color: '#bfe0ee' })); wn.position.set(CX + s * 0.72, 1.8, -4.86); qs.add(wn); }
  const lamp = box(1.6, 0.36, 0.08, new THREE.MeshBasicMaterial({ color: '#e84a3a' })); lamp.position.set(CX, 3.1, -4.86); qs.add(lamp); }
const doc4 = makePerson(DOC); doc4.position.set(CX + 0.7, 0, -2.4); doc4.rotation.y = -0.5; qs.add(doc4);
{ const mess = new THREE.Group(); for (let i = 0; i < 7; i++) { const m = box(0.1, 0.12, 0.1, mat('#1a1614')); m.position.set(-0.18 + R() * 0.36, 0.53 + R() * 0.07, -0.16 + R() * 0.32); m.rotation.set(R(), R(), R()); mess.add(m); } doc4.userData.head.add(mess);
  doc4.children.forEach(c => { if (c.isGroup) c.children.forEach(m => { if (m.geometry && m.geometry.parameters && m.geometry.parameters.depth === 0.3 && m.position.y < -0.7) { m.material = mat('#4a7ad8'); m.scale.y = 0.5; } }); }); }
const miya4 = makePerson(MIYA_W); miya4.position.set(CX - 0.7, 0, -2.3); miya4.rotation.y = 0.5; qs.add(miya4);
const nurse4 = makePerson(NURSE); nurse4.position.set(CX - 2.2, 0, -2.8); nurse4.rotation.y = 0.6; qs.add(nurse4);
const GOWN4 = box(0.4, 0.08, 0.3, mat('#3a8a8a')); qs.add(GOWN4);
const tUS = tag('アメリカ帰りの、医師', { size: 56, w: 640, bg: '#14161c', sx: 2.0 }); tUS.position.set(CX + 0.5, 2.65, -2.2); qs.add(tUS);
const tOpe = tag('手術の、助手に', { size: 60, w: 480, bg: '#2a8a8a', sx: 1.6 }); tOpe.position.set(CX, 2.65, -1.9); qs.add(tOpe);
const tStop = tag('！', { size: 100, w: 140, h: 140, bg: '#e6b450', color: '#14161c', sx: 0.36 }); tStop.position.set(CX - 2.0, 2.3, -2.8); qs.add(tStop);

// ---------- 5段目. 夜のリビングのテレビ（x=180）。2024年・日本のドラマ ----------
const TX = 180;
{ const fl = box(14, 0.04, 14, mat('#5a4a3a')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a3a44')); wl.position.set(TX, 4, -5); qs.add(wl);
  const rack = box(4.6, 0.6, 0.8, mat('#2a2420')); rack.position.set(TX, 0.3, -4.4); qs.add(rack);
  const sofa = box(3.2, 0.5, 1.0, mat('#7a5a4a')); sofa.position.set(TX, 0.25, 1.8); qs.add(sofa);
  const sb = box(3.2, 0.7, 0.3, mat('#7a5a4a')); sb.position.set(TX, 0.6, 2.3); qs.add(sb);
  const tv = box(4.2, 2.5, 0.12, mat('#0e0e12')); tv.position.set(TX, 2.2, -4.5); qs.add(tv); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.3), new THREE.MeshBasicMaterial({ map: canvasTex(640, 368, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a3a4a'); gr.addColorStop(1, '#0e1a22'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#4ae0a0'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 200);
  const pts = [[150, 200], [190, 200], [215, 110], [245, 290], [270, 160], [295, 200], [420, 200], [450, 200], [475, 120], [500, 270], [522, 200], [640, 200]];
  pts.forEach(([x, y]) => g.lineTo(x, y)); g.stroke(); }) }));
SCR5.position.set(TX, 2.2, -4.43); qs.add(SCR5);
const t2024 = tag('2024年 日本のドラマ', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.6 }); t2024.position.set(TX, 4.2, -4.0); qs.add(t2024);
const tAward = tag('最優秀作品賞など、6部門', { size: 52, w: 720, bg: '#c8902c', sx: 3.9 }); tAward.position.set(TX, 4.2, -4.0); qs.add(tAward);
const STAR5 = []; for (let i = 0; i < 6; i++) { const s = tag('★', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#f2c14e', sx: 0.34 }); qs.add(s); STAR5.push(s); }

// ---------- 6段目. 夜の机（x=220）。脳の断面の写真を見ながら、日記を書く彼女 → 来年1月に続編 ----------
const DX = 220;
{ const fl = box(12, 0.04, 9, mat('#3a3028')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#2a2a34')); wl.position.set(DX, 2.5, -4.6); qs.add(wl);
  const desk = box(2.6, 0.08, 1.1, mat('#8a6a4a')); desk.position.set(DX, 0.78, -3.4); qs.add(desk);
  const dl = box(2.4, 0.74, 1.0, mat('#6a5040')); dl.position.set(DX, 0.37, -3.4); qs.add(dl);
  const arm = box(0.04, 0.7, 0.04, mat('#24262b')); arm.position.set(DX + 1.0, 1.15, -3.7); qs.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 16, 1, true), mat('#24262b')); shade.position.set(DX + 0.85, 1.5, -3.6); shade.rotation.z = 0.6; qs.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' })); bulb.position.set(DX + 0.8, 1.42, -3.55); qs.add(bulb); }
const LIGHT6 = new THREE.PointLight(0xffe0b0, 0, 6, 1.5); LIGHT6.position.set(DX + 0.6, 1.6, -3.2); qs.add(LIGHT6);
const SCAN6 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(320, 240, (g, w, h) => {
  g.fillStyle = '#0a0e14'; g.fillRect(0, 0, w, h);
  for (const [cx, k] of [[85, 0], [235, 1]]) { g.fillStyle = '#c8d4dc'; g.beginPath(); g.ellipse(cx, 120, 62, 82, 0, 0, 7); g.fill(); g.fillStyle = '#5a6670'; g.beginPath(); g.ellipse(cx, 120, 50, 70, 0, 0, 7); g.fill();
    g.strokeStyle = '#c8d4dc'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 54); g.lineTo(cx, 186); g.stroke();
    g.fillStyle = '#8a96a0'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(cx + (i % 2 ? 22 : -22), 74 + i * 16, 14, 6, 0, 0, 7); g.fill(); } if (k) { g.strokeStyle = '#f2d24a'; g.lineWidth = 4; g.beginPath(); g.arc(cx + 22, 100, 16, 0, 7); g.stroke(); } } }) }));
SCAN6.position.set(DX - 0.5, 2.3, -4.44); qs.add(SCAN6);
const SCANL6 = box(1.7, 1.3, 0.04, new THREE.MeshBasicMaterial({ color: '#e8f0f8' })); SCANL6.position.set(DX - 0.5, 2.3, -4.5); qs.add(SCANL6);
const miya6 = makePerson(MIYA); miya6.position.set(DX - 0.1, -0.3, -2.75); miya6.rotation.y = Math.PI; miya6.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(miya6);
{ const ch = box(0.6, 0.08, 0.6, mat('#4a3a30')); ch.position.set(DX - 0.1, 0.5, -2.7); qs.add(ch); }
const OD6 = openDiary(); OD6.position.set(DX - 0.1, 0.83, -3.35); qs.add(OD6);
const PEN6 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), mat('#1a2a5a')); qs.add(PEN6);
const tBrain = tag('じつは彼女も、脳外科医', { size: 54, w: 720, bg: '#14161c', sx: 2.2 }); tBrain.position.set(DX - 0.3, 3.05, -3.8); qs.add(tBrain);
const tNext = tag('2027年1月、続編', { size: 60, w: 560, bg: '#c8202c', sx: 1.8 }); tNext.position.set(DX - 0.2, 3.05, -3.6); qs.add(tNext);

// ---------- shots ----------
const ALL = [tMemo, tRead, tTwo, tGone, tHosp, tAide, tUS, tOpe, tStop, t2024, tAward, tBrain, tNext, Q1, ...HEART3, ...STAR5];
function base() { S.reset(); ALL.forEach(x => x.visible = false); LIGHT6.intensity = 0; }

function shotMorning(t, quiz = 0) { // 1段目 0〜9：目覚まし時計の裏に、自分あてのメモ。毎朝まず、ゆうべ書いた日記を読み返す（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.1; S.scene.background.set('#d8e4ee'); S.scene.fog.color.set('#d8e4ee');
  miya1.position.set(0.05, 0.12, -3.2); miya1.rotation.y = 0.35; miya1.userData.legs.forEach(l => l.rotation.x = -1.45);
  const k = quiz ? 1 : ease(clamp((t - 4.2) / 1.2));
  // 時計の裏のメモ（前半は時計を少し回してメモを見せる）
  const turn = quiz ? 0.9 : ease(clamp((t - 0.6) / 1.0)) * (1 - k * 0.6);
  CLOCK1.rotation.y = -0.2 - turn * 0.9;
  const back = new THREE.Vector3(0, 0, -0.07).applyEuler(CLOCK1.rotation); MEMO1.position.set(0.6 + back.x, 1.0, -3.85 + back.z); MEMO1.rotation.y = CLOCK1.rotation.y + Math.PI;
  miya1.userData.arms[1].rotation.x = -1.1 * (quiz ? 0 : ease(clamp((t - 0.6) / 0.8)) * (1 - k));
  miya1.userData.arms[1].rotation.z = 0.3;
  miya1.userData.arms[0].rotation.x = -1.2 * k; miya1.userData.arms[1].rotation.x += -1.2 * k;
  DIARY1.position.set(lerp(0.75, 0.15, k), lerp(0.66, 1.24, k), lerp(-3.6, -2.75, k)); DIARY1.rotation.set(lerp(0, -0.9, k), lerp(0, 0.35, k), 0);
  miya1.userData.head.rotation.x = lerp(0.1, 0.45, k); miya1.userData.head.rotation.y = lerp(-0.5, 0, k);
  Q1.position.set(-0.45, 2.05, -3.2); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3);
  if (!quiz) { tMemo.userData.pop((t - 0.8) / 0.35); if (t > 4.1) tMemo.visible = false; tRead.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(2.2, 1.6, u), lerp(2.1, 2.0, u), lerp(1.0, 0.5, u), lerp(0.45, 0.2, u), 1.25, -3.4, 62);
  return qs;
}
function shotMemory(t) { // 2段目 9〜17：主人公は事故で、2年分の記憶をなくした。今日のことも、明日には消えてしまう
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#0a0c14');
  CAL2.forEach((c, i) => { const f = clamp((t - 0.8 - i * 0.12) / 0.6); c.material.opacity = 1 - f; c.visible = f < 1; c.position.y = 3.05 + Math.floor(i / 6) * 0.66 + f * 0.4; });
  miya2.rotation.y = 0.2; miya2.visible = t >= 4; miya2.userData.head.rotation.x = -0.1; miya2.userData.head.rotation.y = Math.sin(t * 0.8) * 0.2;
  const g = clamp((t - 5.6) / 2.0); PAGE2.visible = t > 4.0; PAGE2.material.opacity = 1 - g; PAGE2.scale.setScalar(t > 4.0 ? ease(clamp((t - 4.0) / 0.4)) : 0.01);
  tTwo.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tTwo.visible = false; tGone.userData.pop((t - 4.3) / 0.35);
  if (t < 4) { const u = ease(t / 4); look(AX + 0.3, lerp(2.9, 3.0, u), lerp(2.2, 1.8, u), AX + 0.2, 3.7, -4.6, 62); }
  else { const u = ease((t - 4) / 4); look(AX + 0.4, 2.1, lerp(2.6, 2.2, u), AX + 0.3, 1.9, -2.4, 62); }
  return qs;
}
function shotWard(t) { // 3段目 17〜25：職場は、大きな病院。看護助手として働く。患者にも同僚にも、いつもやさしい
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.3; S.scene.background.set('#e8eef2'); S.scene.fog.color.set('#e8eef2');
  const z = lerp(-1, -7.6, ease(clamp(t / 5.5)));
  miya3.position.set(BX - 0.4, 0, z + 1.0); miya3.rotation.y = Math.PI; poseWalk(miya3, t * 7, t < 5.5 ? 0.7 : 0);
  miya3.userData.arms.forEach(a => a.rotation.x = t < 5.5 ? -0.9 : 0);
  CART3.position.set(BX - 0.4, 0, z); CART3.rotation.y = 0;
  if (t > 5.5) { miya3.rotation.y = Math.PI * 1.5; miya3.position.y = 0; miya3.userData.head.rotation.x = 0.15; miya3.userData.arms[0].rotation.x = -1.2 + Math.sin(t * 6) * 0.3;
    pat3.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 5) * 0.3; }
  pat3.position.z = -8.6;
  HEART3.forEach((h, i) => { h.visible = t > 5.9 + i * 0.4; if (h.visible) { h.userData.pop(1); h.position.set(BX - 1.0 + i * 0.4, 2.2 + ((t * 0.3 + i * 0.2) % 0.3), -8.6); } });
  tHosp.position.set(BX, 3.0, z - 1.5); tAide.position.set(BX, 3.0, z - 1.5);
  tHosp.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHosp.visible = false; tAide.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.2, 1.4, u), lerp(2.6, 2.3, u), z + lerp(4.2, 3.4, u), BX - 0.4, 1.4, z - 2.0, 62);
  return qs;
}
function shotOR(t) { // 4段目 25〜33：そこへアメリカ帰りの、腕のいい医師。手術の助手を、彼女にまかせる
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.1;
  const k = ease(clamp((t - 4.4) / 1.4));
  doc4.userData.arms[0].rotation.x = -1.2 * (t > 4.2 ? 1 : 0); doc4.userData.head.rotation.y = t < 4 ? Math.sin(t) * 0.15 : 0;
  GOWN4.position.set(lerp(CX + 0.35, CX - 0.3, k), 1.15, -2.0); GOWN4.visible = t > 4.2;
  miya4.userData.arms[1].rotation.x = -1.1 * k; miya4.userData.head.rotation.x = 0.1;
  nurse4.userData.arms[1].rotation.x = t > 5.2 ? -1.6 : 0;
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false; tOpe.userData.pop((t - 4.3) / 0.35); tStop.userData.pop((t - 5.4) / 0.3);
  if (t < 4) { const u = ease(t / 4); look(CX + lerp(1.4, 1.1, u), 2.0, lerp(1.8, 1.3, u), CX + 0.6, 1.6, -2.4, 62); }
  else { const u = ease((t - 4) / 4); look(CX - 0.7, 2.2, lerp(4.0, 3.5, u), CX - 0.6, 1.5, -2.4, 64); }
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2024年の、日本の医療ドラマ。ドラマ賞で、最優秀作品賞など6部門
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.55, '#08060a');
  t2024.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2024.visible = false; tAward.userData.pop((t - 4.3) / 0.35);
  STAR5.forEach((s, i) => { s.visible = t > 4.8 + i * 0.25; if (s.visible) { s.userData.pop((t - 4.8 - i * 0.25) / 0.3); s.position.set(TX - 1.7 + i * 0.68, 3.45, -4.0); } });
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.4, 2.7, u), lerp(5.2, 3.6, u), TX, 2.8, -4.5, 62);
  return qs;
}
function shotDesk(t) { // 6段目 42〜49（決め手）：じつは彼女も、脳の手術をする医師。2027年1月、続編が始まる
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#06080e'); LIGHT6.intensity = 5;
  miya6.userData.arms[1].rotation.x = -1.2 + Math.sin(t * 9) * 0.06; miya6.userData.arms[0].rotation.x = -1.0;
  miya6.userData.head.rotation.x = t < 3.4 ? -0.25 : 0.4;
  PEN6.position.set(DX + 0.0 + Math.sin(t * 9) * 0.05, 0.9, -3.3); PEN6.rotation.set(0.5, 0, 0.4);
  tBrain.userData.pop((t - 0.3) / 0.35); if (t > 3.4) tBrain.visible = false; tNext.userData.pop((t - 3.6) / 0.3);
  if (t < 3.4) { const u = ease(t / 3.4); look(DX + lerp(1.5, 1.2, u), 2.1, lerp(-0.2, -0.6, u), DX - 0.3, 1.8, -4.0, 62); }
  else { const u = ease((t - 3.4) / 3.6); look(DX + lerp(1.8, 2.2, u), lerp(2.4, 2.7, u), lerp(1.2, 1.8, u), DX - 0.2, 1.6, -3.4, 62); }
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（朝の寝室に戻る）
  shotMorning(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(lerp(1.9, 1.6, k), 2.0, lerp(0.9, 0.5, k), 0.2, 1.25, -3.3, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotMorning(t, 0) },
  { a: 9, b: 17, f: shotMemory },
  { a: 17, b: 25, f: shotWard },
  { a: 25, b: 33, f: shotOR },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotDesk },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '目覚まし時計の裏に、<br>自分あてのメモ。'],
  [5.6, 9.0, '毎朝まず、ゆうべ書いた<br>日記を読み返す。'],
  [9.2, 13.2, '主人公は事故で、<br>2年分の記憶をなくした。'],
  [13.2, 17.0, '今日のことも、<br>明日には消えてしまう。'],
  [17.2, 21.0, '職場は、大きな病院。<br>看護助手として働く。'],
  [21.0, 25.0, '患者にも同僚にも、<br>いつもやさしい。'],
  [25.2, 29.0, 'そこへアメリカ帰りの、<br>腕のいい医師が来た。'],
  [29.0, 33.0, '手術の助手を、<br>彼女にまかせる。'],
  [33.2, 37.4, '2024年の、<br>日本の医療ドラマ。'],
  [37.4, 41.8, 'ドラマ賞で、<br>最優秀作品賞など6部門。'],
  [42.2, 45.4, 'じつは彼女も、<br>脳の手術をする医師。'],
  [45.4, 49.0, '2027年1月、<br>続編が始まる。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、アンメット<br>ある脳外科医の日記。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q095', v2: true, answer: 'アンメット ある脳外科医の日記',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 9595,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '目覚まし時計': 'めざましどけい', '裏': 'うら', '自分あて': 'じぶんあて', '毎朝': 'まいあさ', '書いた': 'かいた', '日記': 'にっき', '読み返す': 'よみかえす', '主人公': 'しゅじんこう', '事故': 'じこ', '2年分': 'にねんぶん', '記憶': 'きおく', '今日': 'きょう', '明日': 'あした', '消えて': 'きえて', '職場': 'しょくば', '大きな': 'おおきな', '病院': 'びょういん', '看護助手': 'かんごじょしゅ', '働く': 'はたらく', '患者': 'かんじゃ', '同僚': 'どうりょう', 'アメリカ帰り': 'アメリカがえり', '腕': 'うで', '医師': 'いし', '来た': 'きた', '手術': 'しゅじゅつ', '助手': 'じょしゅ', '彼女': 'かのじょ', '2024年': 'にせんにじゅうよねん', '日本': 'にほん', '医療': 'いりょう', 'ドラマ賞': 'ドラマしょう', '最優秀作品賞': 'さいゆうしゅうさくひんしょう', '6部門': 'ろくぶもん', '脳': 'のう', '2027年1月': 'にせんにじゅうななねんいちがつ', '続編': 'ぞくへん', '始まる': 'はじまる', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '脳外科医': 'のうげかい', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n目覚まし時計の裏に、自分あてのメモ。毎朝まず、ゆうべ書いた日記を読み返す。主人公は事故で、2年分の記憶をなくした。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'Netflix', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'アンメット<br><span style="font-size:64px">ある脳外科医の日記</span>', info: 'FOD・Netflix｜日本のドラマ・全11話', answerSize: 120 });
