import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #092 アメリ（映画・フランス・2001年・120分。U-NEXT・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/ameri で2026/11/15確認（Filmarks の動画配信欄も U-NEXT・Hulu 見放題）。
//   Filmarks 3.8・レビュー176,041件 filmarks.com/movies/34444）
// 確かめた事実（Filmarks の作品紹介、ja.wikipedia.org/wiki/アメリ_(映画) の 概要・あらすじ。2026/11/15）：
//   ・自宅のバスルームのタイルの中から小さな箱を見つける。中には子どもの宝物。前の住人を探して持ち主に返す（Wikipedia）
//   ・主人公は空想好きの女性（Filmarks）。22歳でアパートに住み、カフェで働き始める。ひとり遊びと空想にふける毎日。運河で石を投げて水切りをする（Wikipedia）
//   ・箱を返して喜ばれたことで、人を幸せにすることに喜びを見出す。人々に様々なおせっかいを始める（Filmarks・Wikipedia）
//   ・2001年公開のフランス映画。フランスだけでなく日本でも記録的な大ヒット。ロマンティック・コメディ（Filmarks・Wikipedia）
//   ・実家の庭の人形を、父親に内緒で世界旅行させる（Wikipedia）。原題は「アメリ・プーランの素晴らしい運命」で、タイトルは主人公の名前（Wikipedia）
// 構成（ヒント6段）：1 浴室の壁の中から古い小さな箱・中には昔の子どもの宝物 → 2 主人公はカフェで働く空想好きの女性・ひとり遊びが楽しみ
//   → 3 坂の多い街の小さなアパート・運河で水切り → 4 箱を持ち主に返したら喜ばれた・こっそり人を幸せにし始める
//   → 5 2001年のフランス映画・日本でも大ヒットのロマンティック・コメディ → 6 決め手：庭の人形の世界旅行の写真・タイトルは主人公の名前
// 恋の行方・結末は言わない。人物名・地名（パリ・モンマルトル）・店名は出さない。俳優の顔・ポスター・ロゴ・髪型や衣装の再現はしない。
// 有名な場面の構図はなぞらない（人形の写真は名所ではなく汎用の風景）。人は汎用の3D
const S = quizStage({ bg: '#1e2a22', floor: '#2a3026', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(9292);

const AM = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#b8302a', pants: '#2e4a32', long: false, skirt: true };
const OLD = { skin: '#e8b98f', hair: '#b8b8b8', shirt: '#6a5a4a', pants: '#3a3a40' };
const PEOPLE = [{ skin: '#f1c9a5', hair: '#4a3426', shirt: '#4a6a8a', pants: '#2b3346', long: true, skirt: true }, { skin: '#e8b98f', hair: '#1d1a19', shirt: '#8a6a3a', pants: '#3b3f4a' }];
const GREEN = '#2e6a3a', RED = '#b8302a', GOLD = '#e6b450';

function heart() { const t = tag('♥', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#ff6a8a', sx: 0.3 }); qs.add(t); return t; }
function tinBox() { const g = new THREE.Group(); const b = box(0.36, 0.14, 0.24, new THREE.MeshStandardMaterial({ color: '#b89a5a', metalness: 0.6, roughness: 0.4 })); g.add(b);
  const lid = new THREE.Group(); const l = box(0.37, 0.03, 0.25, new THREE.MeshStandardMaterial({ color: '#c8a050', metalness: 0.6, roughness: 0.35 })); l.position.z = 0.125; lid.add(l); lid.position.set(0, 0.085, -0.125); g.add(lid);
  const toys = new THREE.Group(); [['#e04848', -0.1], ['#4fa3d1', 0], ['#f2c14e', 0.1]].forEach(([c, x]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mat(c)); m.position.set(x, 0.08, 0.04); toys.add(m); });
  const car = box(0.1, 0.04, 0.05, mat('#3a8a5a')); car.position.set(0.02, 0.08, -0.06); toys.add(car); g.add(toys);
  g.userData = { lid, toys }; return g; }

// ---------- 1段目. 浴室（x=0）。緑と白のタイルの壁。1枚が外れ、中から古い箱 ----------
const BOX1 = tinBox();
{ const fl = box(6, 0.04, 5, mat('#d8d0c4')); fl.position.set(0, 0.02, -1.5); qs.add(fl);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ map: canvasTex(600, 400, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) { g.fillStyle = (x + y) % 2 ? '#e8ece4' : '#3a7a5a'; g.fillRect(x * 50, y * 50, 50, 50); g.strokeStyle = '#c8c8c0'; g.strokeRect(x * 50, y * 50, 50, 50); } }) }));
  wall.position.set(0, 2, -3.2); qs.add(wall);
  const hole = box(0.5, 0.5, 0.05, mat('#1a120c')); hole.position.set(0.25, 0.75, -3.17); qs.add(hole);
  const tub = box(1.8, 0.6, 0.8, mat('#f4f4f0')); tub.position.set(-1.8, 0.3, -2.7); qs.add(tub);
  const sink = box(0.7, 0.15, 0.45, mat('#f4f4f0')); sink.position.set(1.8, 0.9, -2.9); qs.add(sink); const sp = box(0.12, 0.9, 0.12, mat('#f4f4f0')); sp.position.set(1.8, 0.45, -2.9); qs.add(sp);
  const mir = box(0.6, 0.8, 0.03, new THREE.MeshStandardMaterial({ color: '#c8d8e0', metalness: 0.8, roughness: 0.1 })); mir.position.set(1.8, 1.8, -3.15); qs.add(mir); }
const TILE1 = box(0.48, 0.48, 0.04, mat('#3a7a5a')); qs.add(TILE1);
BOX1.position.set(0.25, 0.75, -3.15); qs.add(BOX1);
const am1 = makePerson(AM); am1.position.set(-0.45, 0, -2.0); am1.rotation.z = 0; am1.rotation.y = Math.PI + 0.5; qs.add(am1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.36 }); Q1.position.set(0.95, 1.45, -2.9); qs.add(Q1);
const tWall = tag('壁の中から、小さな箱', { size: 56, w: 640, bg: '#14161c', sx: 1.6 }); tWall.position.set(0.3, 1.9, -2.7); qs.add(tWall);
const tTreasure = tag('昔の子どもの、宝物', { size: 58, w: 620, bg: RED, sx: 1.55 }); tTreasure.position.set(0.3, 1.9, -2.7); qs.add(tTreasure);

// ---------- 2段目. カフェ（x=40）。赤と緑の店内。カップを運ぶ主人公、頭の上に空想の雲 ----------
const AX = 40;
{ const fl = box(10, 0.04, 8, mat('#8a5a3a')); fl.position.set(AX, 0.02, -1.5); qs.add(fl);
  const wl = box(10, 4.5, 0.2, mat('#3a6a3a')); wl.position.set(AX, 2.25, -4.6); qs.add(wl);
  const ct = box(4, 1.0, 0.7, mat(RED)); ct.position.set(AX - 1.2, 0.5, -3.6); qs.add(ct);
  const top = box(4.2, 0.06, 0.8, mat('#d8c8a8')); top.position.set(AX - 1.2, 1.03, -3.6); qs.add(top);
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 10), mat(['#2a5a3a', '#e6b450', '#8a2a2a', '#e8e4d8'][i % 4])); b.position.set(AX - 2.8 + i * 0.45, 2.3, -4.45); qs.add(b); }
  const sh = box(3.8, 0.05, 0.25, mat('#5a3a20')); sh.position.set(AX - 1, 2.1, -4.45); qs.add(sh);
  for (const [x, z] of [[1.6, -1.6], [-1.6, -0.6]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), mat('#e8e4d8')); t.position.set(AX + x, 0.75, z); qs.add(t); const lg = box(0.06, 0.75, 0.06, mat('#2a2a2e')); lg.position.set(AX + x, 0.37, z); qs.add(lg); }
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lp.position.set(AX - 3 + i * 2, 3.6, -2.5); qs.add(lp); } }
const cust2 = makePerson(PEOPLE[1]); cust2.position.set(AX + 2.2, -0.3, -1.6); cust2.rotation.y = -Math.PI / 2; cust2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(cust2);
const am2 = makePerson(AM); am2.position.set(AX - 0.4, 0, -1.6); qs.add(am2);
{ const ap = box(0.42, 0.55, 0.02, mat('#f4f0e8')); ap.position.set(0, 0.95, 0.15); am2.add(ap); }
const TRAY2 = new THREE.Group(); { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), mat('#c8c8d0')); TRAY2.add(t); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 12), mat('#ffffff')); c.position.y = 0.05; TRAY2.add(c); }
TRAY2.position.set(0.32, 1.25, 0.25); am2.add(TRAY2);
const CLOUD2 = new THREE.Group(); { for (const [x, y, r] of [[0, 0, 0.35], [0.35, 0.05, 0.28], [-0.35, 0.03, 0.27], [0.15, 0.25, 0.25], [-0.15, 0.22, 0.24]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshBasicMaterial({ color: '#f4f4f8' })); s.position.set(x, y, 0); CLOUD2.add(s); }
  for (const [x, y, r] of [[-0.25, -0.45, 0.07], [-0.35, -0.6, 0.05]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: '#f4f4f8' })); s.position.set(x, y, 0); CLOUD2.add(s); }
  const st = tag('★', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: GOLD, sx: 0.3 }); st.visible = true; st.position.set(-0.12, 0.08, 0.36); CLOUD2.add(st); const st2 = tag('♪', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#4fa3d1', sx: 0.28 }); st2.visible = true; st2.position.set(0.22, 0.12, 0.36); CLOUD2.add(st2); }
qs.add(CLOUD2);
const tCafe = tag('カフェで働く、女性', { size: 58, w: 600, bg: '#14161c', sx: 1.9 }); tCafe.position.set(AX - 0.2, 3.0, -2.2); qs.add(tCafe);
const tDream = tag('空想が、大好き', { size: 62, w: 500, bg: GREEN, sx: 1.7 }); tDream.position.set(AX - 0.2, 3.0, -2.2); qs.add(tDream);

// ---------- 3段目. 夕方の運河（x=80）。坂の上のアパート群。石を投げて水切り ----------
const BX = 80;
{ const gr = box(30, 0.06, 20, mat('#6a6a64')); gr.position.set(BX, 0.03, -8); qs.add(gr);
  const water = box(30, 0.04, 3.2, new THREE.MeshStandardMaterial({ color: '#2a5a6a', metalness: 0.3, roughness: 0.2 })); water.position.set(BX, 0.07, -3.6); qs.add(water);
  for (const z of [-1.95, -5.25]) { const ed = box(30, 0.3, 0.2, mat('#a89a84')); ed.position.set(BX, 0.15, z); qs.add(ed); }
  // 鉄の橋（アーチ）
  const br = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.08, 8, 24, Math.PI), mat('#3a5a4a')); br.position.set(BX + 3.2, 0.1, -3.6); br.rotation.y = Math.PI / 2; qs.add(br);
  const deck = box(0.3, 0.08, 3.6, mat('#3a5a4a')); deck.position.set(BX + 3.2, 1.9, -3.6); qs.add(deck);
  for (const z of [-2.0, -5.2]) { const st = box(0.6, 1.9, 0.5, mat('#3a5a4a')); st.position.set(BX + 3.2, 0.95, z); qs.add(st); }
  // 坂の上の家並み（段々に高くなる）
  const cols = ['#e8dcc0', '#d8c8a8', '#f0e4cc', '#c8b898', '#e0d0b0'];
  for (let i = 0; i < 12; i++) { const h = 2.2 + R() * 1.4, y = (i % 6) * 0.5; const b = box(1.4, h, 1.4, mat(cols[i % 5])); b.position.set(BX - 8 + i * 1.5, y + h / 2, -10 - (i % 3)); qs.add(b);
    const rf = box(1.5, 0.25, 1.5, mat('#4a5a6a')); rf.position.set(BX - 8 + i * 1.5, y + h + 0.12, -10 - (i % 3)); qs.add(rf);
    for (let k = 0; k < 2; k++) { const w = box(0.3, 0.4, 0.05, new THREE.MeshBasicMaterial({ color: '#ffd890' })); w.position.set(BX - 8.3 + i * 1.5 + k * 0.6, y + h * 0.6, -9.28 - (i % 3)); qs.add(w); } }
  const hill = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#4a6a3a')); hill.scale.set(1.4, 0.45, 0.6); hill.position.set(BX, 0, -16); qs.add(hill);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f0ece4')); dome.position.set(BX + 1, 4.6, -16); qs.add(dome); }
const am3 = makePerson(AM); am3.position.set(BX - 0.8, 0, -1.4); am3.rotation.y = Math.PI - 0.3; qs.add(am3);
const STONE3 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#8a8a84')); qs.add(STONE3);
const RIP3 = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.14, 20), new THREE.MeshBasicMaterial({ color: '#d8f0f8', transparent: true, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; qs.add(r); RIP3.push(r); }
const tTown = tag('坂の街の、アパート', { size: 58, w: 600, bg: '#14161c', sx: 2.1 }); tTown.position.set(BX - 0.3, 3.0, -3.0); qs.add(tTown);
const tSkip = tag('運河で、水切り', { size: 62, w: 500, bg: '#2a6ab0', sx: 1.8 }); tSkip.position.set(BX - 0.3, 3.0, -3.0); qs.add(tSkip);

// ---------- 4段目. 街角（x=120）。箱を受け取って喜ぶおじいさん → 物陰からのぞく主人公。人々にハート ----------
const CX = 120;
{ const gr = box(16, 0.06, 12, mat('#8a8278')); gr.position.set(CX, 0.03, -3); qs.add(gr);
  for (let i = 0; i < 5; i++) { const b = box(2.4, 4 + (i % 2), 2, mat(['#e8dcc0', '#d8c8a8', '#f0e4cc'][i % 3])); b.position.set(CX - 5 + i * 2.5, 2 + (i % 2) / 2, -6.2); qs.add(b);
    for (let k = 0; k < 3; k++) { const w = box(0.4, 0.6, 0.05, mat('#4a5a6a')); w.position.set(CX - 5.7 + i * 2.5 + k * 0.7, 3, -5.18); qs.add(w); } }
  const wl = box(0.6, 3, 2, mat('#c8b898')); wl.position.set(CX - 2.6, 1.5, -1.6); qs.add(wl);
  const awn = box(2.2, 0.1, 0.9, mat(GREEN)); awn.position.set(CX + 2.6, 2.6, -4.7); awn.rotation.x = 0.25; qs.add(awn); }
const old4 = makePerson(OLD); old4.position.set(CX + 0.6, 0, -2.6); old4.rotation.y = 0.3; qs.add(old4);
const BOX4 = tinBox(); BOX4.position.set(0, -0.62, 0.12); BOX4.rotation.x = -0.3; old4.userData.arms[0].add(BOX4);
const am4 = makePerson(AM); am4.position.set(CX - 2.9, 0, -2.3); am4.rotation.y = Math.PI / 2; qs.add(am4);
const P4 = PEOPLE.map((o, i) => { const p = makePerson(o); p.position.set(CX + 2.4 + i * 1.2, 0, -3.6 + i * 0.6); p.rotation.y = -0.5; qs.add(p); return p; });
const HEART4 = [heart(), heart(), heart(), heart()];
const tReturn = tag('持ち主に、返したら', { size: 58, w: 600, bg: '#14161c', sx: 2.0 }); tReturn.position.set(CX + 0.5, 2.55, -2.3); qs.add(tReturn);
const tHappy = tag('こっそり、人を幸せに', { size: 58, w: 640, bg: '#c94f7c', sx: 2.2 }); tHappy.position.set(CX + 0.4, 3.1, -2.4); qs.add(tHappy);

// ---------- 5段目. 映画館（x=180）。2001年・フランス映画 ----------
const TX = 180;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a6a3a'); gr.addColorStop(1, '#c8a050'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#b8302a'; g.fillRect(0, h - 60, w, 60);
  for (let i = 0; i < 9; i++) { g.fillStyle = ['#e8dcc0', '#d8c8a8', '#f0e4cc'][i % 3]; const hh = 90 + (i % 3) * 30; g.fillRect(i * 80 + 4, h - 60 - hh, 72, hh); }
  g.fillStyle = '#ff7aa8'; g.font = '900 70px sans-serif'; g.fillText('♥', 40, 90); g.fillStyle = '#f2c14e'; g.fillText('★', 620, 90); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t2001 = tag('2001年 フランス映画', { size: 56, w: 640, bg: GOLD, color: '#14161c', sx: 3.0 }); t2001.position.set(TX, 6.0, -4.4); qs.add(t2001);
const tRomCom = tag('ロマンティック・コメディ', { size: 54, w: 700, bg: '#c94f7c', sx: 3.2 }); tRomCom.position.set(TX, 6.0, -4.4); qs.add(tRomCom);

// ---------- 6段目. 庭（x=220）。赤い帽子の小さな庭の人形 → 人形が旅先で写った写真が次々に届く ----------
const DX = 220;
{ const gr = box(14, 0.06, 12, mat('#4a8a3a')); gr.position.set(DX, 0.03, -2); qs.add(gr);
  const fence = box(10, 0.8, 0.08, mat('#f4f0e8')); fence.position.set(DX, 0.4, -4.5); qs.add(fence);
  for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(['#e04848', '#f2c14e', '#ff9ab8'][i % 3])); f.position.set(DX - 3 + i * 0.66, 0.2, -3.8 + (i % 2) * 0.3); qs.add(f); } }
const GNOME6 = new THREE.Group();
{ const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.45, 14), mat('#2e6a9a')); body.position.y = 0.3; GNOME6.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), mat('#f4d3b5')); head.position.y = 0.66; GNOME6.add(head);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.22, 14), mat('#f4f4f4')); beard.rotation.x = Math.PI; beard.position.set(0, 0.5, 0.11); GNOME6.add(beard);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), mat('#121212')); e.position.set(sx * 0.055, 0.69, 0.135); GNOME6.add(e); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat('#e8a080')); nose.position.set(0, 0.63, 0.15); GNOME6.add(nose);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 14), mat('#d8302a')); hat.position.y = 0.95; GNOME6.add(hat);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.08, 16), mat('#8a7a6a')); base.position.y = 0.04; GNOME6.add(base); }
GNOME6.position.set(DX, 0.06, -1.6); GNOME6.scale.setScalar(1.4); qs.add(GNOME6);
function photo(draw) { const g = new THREE.Group(); const fr = box(0.62, 0.72, 0.01, mat('#f8f8f4')); g.add(fr);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.54), new THREE.MeshBasicMaterial({ map: canvasTex(216, 216, (gg, w, h) => { draw(gg, w, h);
    gg.fillStyle = '#2e6a9a'; gg.fillRect(96, 150, 24, 40); gg.fillStyle = '#f4d3b5'; gg.beginPath(); gg.arc(108, 142, 11, 0, 7); gg.fill(); gg.fillStyle = '#d8302a'; gg.beginPath(); gg.moveTo(96, 136); gg.lineTo(120, 136); gg.lineTo(108, 108); gg.fill(); gg.fillStyle = '#ffffff'; gg.beginPath(); gg.moveTo(98, 146); gg.lineTo(118, 146); gg.lineTo(108, 166); gg.fill(); }) }));
  p.position.set(0, 0.05, 0.007); g.add(p); qs.add(g); return g; }
const PH6 = [
  photo((g, w, h) => { g.fillStyle = '#f2c070'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8a050'; g.beginPath(); g.moveTo(20, 190); g.lineTo(90, 70); g.lineTo(160, 190); g.fill(); g.fillStyle = '#e8c070'; g.fillRect(0, 190, w, 26); }),
  photo((g, w, h) => { g.fillStyle = '#8ac0e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f4f8'; g.beginPath(); g.moveTo(0, 170); g.lineTo(70, 50); g.lineTo(140, 150); g.lineTo(216, 60); g.lineTo(216, 216); g.lineTo(0, 216); g.fill(); }),
  photo((g, w, h) => { g.fillStyle = '#6ac0e0'; g.fillRect(0, 0, w, 140); g.fillStyle = '#2a7ab0'; g.fillRect(0, 140, w, 40); g.fillStyle = '#f0dca0'; g.fillRect(0, 180, w, 36); g.fillStyle = '#3a8a3a'; g.fillRect(20, 60, 10, 120); g.beginPath(); g.arc(25, 60, 34, 0, 7); g.fill(); }),
];
const tTrip = tag('庭の人形が、世界旅行', { size: 56, w: 640, bg: '#14161c', sx: 1.0 }); tTrip.position.set(DX, 1.72, -0.6); qs.add(tTrip);
const tName = tag('タイトルは、主人公の名前', { size: 54, w: 720, bg: RED, sx: 1.1 }); tName.position.set(DX, 1.72, -0.6); qs.add(tName);

// ---------- shots ----------
const ALL = [tWall, tTreasure, tCafe, tDream, tTown, tSkip, tReturn, tHappy, t2001, tRomCom, tTrip, tName, Q1, ...HEART4];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotBath(t, quiz = 0) { // 1段目 0〜9：浴室の壁の中から、古い小さな箱が出てきた。中には、昔の子どもの宝物（0秒目がサムネ）
  base(); S.aim(0, -2.5); lift(0); S.hemi.intensity = 1.0;
  const off = quiz ? 1 : ease(clamp(t / 0.4));
  TILE1.position.set(0.25 + off * 0.25, 0.75 - off * 0.68, -3.1 + off * 0.3); TILE1.rotation.set(-off * 1.4, 0, off * 0.3);
  const pull = quiz ? 1 : ease(clamp((t - 2.6) / 1.2));
  BOX1.position.set(0.25, lerp(0.75, 1.15, pull), lerp(-3.12, -2.55, pull));
  const open = quiz ? 0 : ease(clamp((t - 4.3) / 0.6)); BOX1.userData.lid.rotation.x = -open * 1.6; BOX1.userData.toys.visible = open > 0.2;
  am1.position.y = lerp(-0.38, 0, pull); am1.userData.legs.forEach(l => l.rotation.x = lerp(-1.2, -0.2, pull)); am1.userData.arms.forEach(a => a.rotation.x = lerp(-0.9, -1.25, pull));
  am1.userData.head.rotation.x = 0.2;
  Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3);
  if (!quiz) { tWall.userData.pop((t - 0.8) / 0.35); if (t > 4.1) tWall.visible = false; tTreasure.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.7, 1.5, u), lerp(1.9, 1.85, u), lerp(0.7, 0.3, u), 0.3, 1.0, -2.9, 64);
  return qs;
}
function shotCafe(t) { // 2段目 9〜17：主人公は、カフェで働く空想好きの女性。ひとり遊びと空想が、毎日の楽しみ
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.0; S.darken(0.2, '#100c0a');
  const k = clamp(t / 3.8);
  am2.position.set(AX + lerp(-1.2, 1.1, ease(k)), 0, -1.6); am2.rotation.y = Math.PI / 2; poseWalk(am2, t * 6, k < 1 ? 0.7 : 0); am2.userData.arms[0].rotation.x = -1.2;
  if (t > 4.0) { am2.rotation.y = lerp(Math.PI / 2, 0, ease(clamp((t - 4) / 0.5))); am2.userData.head.rotation.x = -0.25; am2.userData.head.rotation.z = Math.sin(t * 1.3) * 0.12; }
  else am2.userData.head.rotation.set(0, 0, 0);
  const c = ease(clamp((t - 4.3) / 0.6)); CLOUD2.visible = c > 0; CLOUD2.scale.setScalar(Math.max(0.01, c)); CLOUD2.position.set(am2.position.x - 0.3, 2.65 + Math.sin(t * 1.5) * 0.05, -1.5);
  tCafe.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCafe.visible = false; tDream.userData.pop((t - 4.6) / 0.35); tDream.position.set(am2.position.x - 0.2, 3.45, -1.7);
  const u = ease(t / 8);
  look(AX + lerp(-0.6, 0.6, u), 2.0, lerp(2.8, 2.4, u), AX + lerp(-0.4, 0.8, u), 1.5, -1.8, 62);
  return qs;
}
function shotCanal(t) { // 3段目 17〜25：坂の多い街の、小さなアパート。石を投げて、水切りをする運河
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.95; S.scene.background.set('#e8b890'); S.scene.fog.color.set('#e8b890');
  const tt = t - 4.6; // 投げる
  am3.userData.arms[1].rotation.x = tt > -0.6 && tt < 0.3 ? lerp(0.6, -1.6, clamp((tt + 0.6) / 0.9)) : 0; am3.userData.arms[1].rotation.z = tt > -0.6 && tt < 0.3 ? -0.4 : 0;
  STONE3.visible = tt > 0 && tt < 2.2; if (STONE3.visible) { const k = tt / 2.2; const hop = Math.abs(Math.sin(k * Math.PI * 4)) * 0.35 * (1 - k); STONE3.position.set(BX - 0.4 + k * 4.2, 0.12 + hop, -2.2 - k * 2.6); }
  RIP3.forEach((r, i) => { const tk = tt - (i + 1) * 0.55; r.visible = tk > 0 && tk < 1.6; if (r.visible) { const k = (i + 1) / 4; r.position.set(BX - 0.4 + k * 4.2, 0.1, -2.2 - k * 2.6); r.scale.setScalar(1 + tk * 3); r.material.opacity = 1 - tk / 1.6; } });
  tTown.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTown.visible = false; tSkip.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4) look(BX + lerp(-0.6, 0.2, u), lerp(2.4, 2.8, u), lerp(2.4, 2.0, u), BX, 2.8, -10, 62);
  else look(BX + 1.4, 1.7, 0.6, BX + 0.6, 0.3, -3.6, 62);
  return qs;
}
function shotStreet(t) { // 4段目 25〜33：箱を持ち主に返したら、とても喜ばれた。それから、こっそり人を幸せにし始める
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.05;
  old4.userData.arms[0].rotation.x = -1.1; old4.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 3) * 0.1; old4.userData.head.rotation.x = 0.3;
  am4.userData.head.rotation.y = 0.4; am4.position.x = CX - 2.6 + Math.sin(t * 0.8) * 0.05;
  HEART4[0].visible = t > 1.4; if (HEART4[0].visible) { HEART4[0].userData.pop(1); HEART4[0].position.set(CX + 0.6, 2.3 + ((t * 0.3) % 0.4), -2.6); }
  P4.forEach((p, i) => { const h = HEART4[i + 1]; h.visible = t > 5.0 + i * 0.6; if (h.visible) { h.userData.pop(1); h.position.set(p.position.x, 2.3 + ((t * 0.3 + i * 0.2) % 0.4), p.position.z); } p.userData.arms[0].rotation.x = h.visible ? -0.6 : 0; });
  tReturn.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tReturn.visible = false; tHappy.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  if (t < 4) look(CX + lerp(-0.2, 0.1, u), 1.9, lerp(1.0, 0.7, u), CX + 0.5, 1.3, -2.6, 62);
  else look(CX + lerp(0.2, 0.6, ease((t - 4) / 4)), 2.2, lerp(3.6, 3.3, ease((t - 4) / 4)), CX + 0.8, 1.4, -3.0, 64);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2001年の、フランス映画。日本でも大ヒットした、ロマンティック・コメディ
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  t2001.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2001.visible = false; tRomCom.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.4, 5.4, u), TX, 3.8, -4.8, 62);
  return qs;
}
function shotGnome(t) { // 6段目 42〜49（決め手）：庭の人形の、世界旅行の写真。タイトルは、主人公の名前
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.2; S.scene.background.set('#a8d0e8'); S.scene.fog.color.set('#a8d0e8');
  PH6.forEach((p, i) => { const k = ease(clamp((t - 0.6 - i * 0.6) / 0.5)); p.visible = k > 0; p.position.set(DX + (i - 1) * 0.7, lerp(2.6, 1.85 + (i === 1 ? 0.08 : 0), k), -2.2); p.rotation.z = (i - 1) * -0.12 * k; p.scale.setScalar(Math.max(0.01, k)); });
  tTrip.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tTrip.visible = false; tName.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.1, 0.1, u), lerp(0.95, 1.0, u), lerp(1.7, 1.4, u), DX, 0.75, -1.8, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（浴室に戻る）
  shotBath(3.2, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(1.6, 1.85, lerp(0.6, 0.1, k), 0.3, 1.0, -2.9, 64);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotBath(t, 0) },
  { a: 9, b: 17, f: shotCafe },
  { a: 17, b: 25, f: shotCanal },
  { a: 25, b: 33, f: shotStreet },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotGnome },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '浴室の壁の中から、<br>古い小さな箱が出てきた。'],
  [5.6, 9.0, '中には、昔の子どもの<br>宝物が入っていた。'],
  [9.2, 13.2, '主人公は、カフェで働く<br>空想好きの女性。'],
  [13.2, 17.0, 'ひとり遊びと空想が、<br>毎日の楽しみ。'],
  [17.2, 21.0, '坂の多い街の、<br>小さなアパート。'],
  [21.0, 25.0, '石を投げて、<br>運河で水切り。'],
  [25.2, 29.0, '箱を持ち主に返したら、<br>とても喜ばれた。'],
  [29.0, 33.0, 'それから、こっそり<br>人を幸せにし始める。'],
  [33.2, 37.4, '2001年の、<br>フランス映画。'],
  [37.4, 41.8, '日本でも大ヒットした、<br>ロマンティック・コメディ。'],
  [42.2, 45.4, '庭の人形の、<br>世界旅行の写真。'],
  [45.4, 49.0, 'タイトルは、<br>主人公の名前。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>アメリ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q092', v2: true, answer: 'アメリ',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 9292,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '浴室': 'よくしつ', '壁': 'かべ', '中': 'なか', '古い': 'ふるい', '小さな': 'ちいさな', '箱': 'はこ', '出てきた': 'でてきた', '昔': 'むかし', '子ども': 'こども', '宝物': 'たからもの', '入って': 'はいって', '主人公': 'しゅじんこう', '働く': 'はたらく', '空想好き': 'くうそうずき', '女性': 'じょせい', '遊び': 'あそび', '空想': 'くうそう', '毎日': 'まいにち', '楽しみ': 'たのしみ', '坂': 'さか', '多い': 'おおい', '街': 'まち', '石': 'いし', '投げて': 'なげて', '運河': 'うんが', '水切り': 'みずきり', '持ち主': 'もちぬし', '返したら': 'かえしたら', '喜ばれた': 'よろこばれた', '人': 'ひと', '幸せ': 'しあわせ', '始める': 'はじめる', '2001年': 'にせんいちねん', '映画': 'えいが', '日本': 'にほん', '大ヒット': 'だいヒット', '庭': 'にわ', '人形': 'にんぎょう', '世界旅行': 'せかいりょこう', '写真': 'しゃしん', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n浴室の壁の中から、古い小さな箱が出てきた。中には、昔の子どもの宝物が入っていた。主人公は、カフェで働く空想好きの女性。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'UNEXT', 'Hulu', '映画好き', 'フランス映画'],
  },
});
applyQuizCards({ answer: 'アメリ', info: 'U-NEXT・Hulu｜フランス映画・120分', answerSize: 128 });
