import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #136 パイレーツ・オブ・カリビアン／呪われた海賊たち（映画・アメリカ・2003年製作・143分。Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/pairetsuobukaribian-zhou-waretahai-zei-tachi（見放題：Disney Plus）と
//   Filmarks の動画配信欄（ディズニープラス 見放題。Prime Video・DMM TV はレンタル。2026年10月更新）で2026/11/24確認。
//   Filmarks 3.9・レビュー197,100件 filmarks.com/movies/30147）
// 確かめた事実（2026/11/24）：
//   ・映画.com eiga.com/movie/1148 ：2003年製作／143分／アメリカ。ディズニーランドの人気アトラクション「カリブの海賊」をモチーフにしたアクションアドベンチャー。
//     カリブ海の港町。冷酷な船長率いる海賊たちが町を襲撃し、総督の娘が連れ去られる。彼女にひそかな恋心を抱く鍛冶職人の青年は、
//     一匹狼の海賊と手を組んで救出に向かう
//   ・JustWatch 日本版の紹介文：17世紀、海賊たちが大海原を荒らしまわっていた時代。総督の娘は、かつて海上で助けた少年が身につけていた黄金のメダルを
//     今も密かに保管していた。ある日、海賊たちが町に現われ、彼女がさらわれる。海賊の目的は、彼女が身につけていたメダルだった。
//     鍛冶屋で働く逞しい若者へと成長した少年は、一匹狼の海賊と手を組み、救出に向かう
// 構成（ヒント6段）：1 海の上でひとりの少年が助けられる・その首には金色のメダル → 2 主人公は鍛冶屋で働く青年・ひそかに想う人は総督の娘
//   → 3 17世紀、海賊が海をあらしまわった時代・ある日、港町に海賊があらわれる → 4 総督の娘がさらわれる・青年は一匹狼の海賊と手を組む
//   → 5 2003年のアメリカ映画・舞台はカリブ海 → 6 決め手：もとはディズニーランドの人気アトラクション・海賊がねらうのはあの金色のメダル
// 呪いの正体・結末は言わない。登場人物の名前・船の名前は出さない。俳優の顔・ポスター・ロゴ・衣装（海賊船長の髪型や帽子の飾り）・
// アトラクションの絵は使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#2a3a4a', floor: null, fogNear: 20, fogFar: 90 });
const qs = S.scene;
const R = rng(13610);

const WILL = { skin: '#f1c9a5', hair: '#4a3020', shirt: '#e8e0d0', pants: '#5a4a3a' };
const BOY = { skin: '#f1c9a5', hair: '#4a3020', shirt: '#c8c0b0', pants: '#5a4a3a', scale: 0.62 };
const LADY = { skin: '#f6d8c0', hair: '#c8a060', shirt: '#e8d8e0', pants: '#d8c8d8', long: true, skirt: true };
const GIRL = { skin: '#f6d8c0', hair: '#c8a060', shirt: '#e8d8e0', pants: '#d8c8d8', long: true, skirt: true, scale: 0.66 };
const PIRATE = { skin: '#d8a880', hair: '#2a2018', shirt: '#6a3a2a', pants: '#3a3028' };
const PIR2 = { skin: '#c89870', hair: '#3a3a3a', shirt: '#3a4a3a', pants: '#2a2420' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function hat(p, c = '#1a1612') { const b = box(0.6, 0.04, 0.6, mat(c)); b.position.y = 0.52; p.userData.head.add(b); const t = box(0.36, 0.2, 0.36, mat(c)); t.position.y = 0.64; p.userData.head.add(t); }
function sea(x, z, w = 80, d = 80, c = '#1e4a6a') { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), mat(c)); s.rotation.x = -Math.PI / 2; s.position.set(x, 0, z); qs.add(s); return s; }
function waves(x, z, n, c = '#3a6a8a') { const arr = []; for (let i = 0; i < n; i++) { const w = box(1.2 + R() * 1.6, 0.06, 0.18, mat(c)); w.position.set(x - 14 + R() * 28, 0.04, z - R() * 30); w.userData.p = R() * 6; qs.add(w); arr.push(w); } return arr; }
function ship(sail = '#e8e0cc', hull = '#5a3a24', s = 1) { const g = new THREE.Group();
  const h = box(2.4, 1.4, 8, mat(hull)); h.position.y = 0.5; g.add(h); const dk = box(2.2, 0.1, 7.6, mat('#7a5a3a')); dk.position.y = 1.22; g.add(dk);
  const bw = box(1.6, 1.0, 1.2, mat(hull)); bw.position.set(0, 1.6, -3.2); g.add(bw);
  for (const [z, hh] of [[1.6, 7], [-1.2, 6]]) { const m = box(0.18, hh, 0.18, mat('#4a3020')); m.position.set(0, 1.2 + hh / 2, z); g.add(m);
    for (const k of [0.45, 0.78]) { const sl = new THREE.Mesh(new THREE.PlaneGeometry(2.8 - k, hh * 0.32), new THREE.MeshLambertMaterial({ color: sail, side: THREE.DoubleSide })); sl.position.set(0, 1.2 + hh * k, z + 0.12); sl.rotation.y = Math.PI / 2; g.add(sl); } }
  g.scale.setScalar(s); return g; }

// ---------- 1段目. 昼の海（x=0）。帆船の手すりから見下ろす女の子。波間にただよう板と、その上の少年 ----------
sea(0, -20, 90, 90, '#2a5a7a'); const W1 = waves(0, 4, 40);
const SHIP1 = ship(); SHIP1.position.set(-2.6, 0, -4); SHIP1.rotation.y = 0.1; qs.add(SHIP1);
const GIRL1 = person(GIRL, -1.5, -3.0, Math.PI / 2 + 0.3, 1.27);
const RAFT1 = new THREE.Group(); { const pl = box(1.4, 0.12, 0.9, mat('#6a4a30')); RAFT1.add(pl); const pl2 = box(0.9, 0.1, 0.4, mat('#5a3a24')); pl2.position.set(0.6, 0.02, 0.5); pl2.rotation.y = 0.4; RAFT1.add(pl2); }
RAFT1.position.set(1.4, 0.08, -2.0); qs.add(RAFT1);
const BOY1 = person(BOY, 1.4, -2.0, -Math.PI / 2, 0.2); BOY1.rotation.z = Math.PI / 2; BOY1.rotation.x = 0; BOY1.position.y = 0.32;
const MEDAL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 20), new THREE.MeshStandardMaterial({ color: '#e8c050', metalness: 0.8, roughness: 0.25, emissive: '#6a4a10' })); qs.add(MEDAL1);
const GLINT1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gl('#fff8c0', 0.9)); qs.add(GLINT1);
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), new THREE.MeshBasicMaterial({ fog: false, color: '#a8c8e0' })); SKY1.position.set(0, 14, -60); qs.add(SKY1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tSave = tag('海の上で、少年が助けられる', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tSave);
const tMedal = tag('その首には、金色のメダル', { size: 52, w: 720, bg: '#e24050', sx: 1.75 }); qs.add(tMedal);

// ---------- 2段目. 鍛冶屋の工房（x=50）。炉の火、金床、剣をたたく青年 ----------
const AX = 50;
{ const fl = box(12, 0.04, 10, mat('#4a3e34')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const wl = box(12, 5, 0.3, mat('#5a4a3e')); wl.position.set(AX, 2.5, -7); qs.add(wl);
  const fg = box(2.2, 1.4, 1.6, mat('#6a6060')); fg.position.set(AX - 2.8, 0.7, -5.6); qs.add(fg);
  const ch = box(1.2, 3.6, 1.0, mat('#5a5050')); ch.position.set(AX - 2.8, 3.2, -5.8); qs.add(ch);
  for (let i = 0; i < 7; i++) { const sw = box(0.08, 1.0 + R() * 0.3, 0.02, mat('#b8bcc4')); sw.position.set(AX + 1.6 + i * 0.35, 2.4, -6.8); qs.add(sw); const hd = box(0.3, 0.06, 0.06, mat('#6a4a2a')); hd.position.set(AX + 1.6 + i * 0.35, 1.85, -6.78); qs.add(hd); }
  const bar = box(3.0, 0.08, 0.1, mat('#5a4030')); bar.position.set(AX + 2.65, 2.95, -6.8); qs.add(bar); }
const FIRE2 = box(1.4, 0.5, 0.2, gl('#ff8a2a')); FIRE2.position.set(AX - 2.8, 1.0, -4.8); qs.add(FIRE2);
const FL2 = new THREE.PointLight('#ff9a4a', 6, 10); FL2.position.set(AX - 2.4, 1.6, -4.2); qs.add(FL2);
const ANVIL2 = new THREE.Group(); { const a = box(0.9, 0.3, 0.4, mat('#3a3a40')); a.position.y = 0.85; ANVIL2.add(a); const b = box(0.4, 0.7, 0.3, mat('#2a2a30')); b.position.y = 0.35; ANVIL2.add(b); } ANVIL2.position.set(AX, 0, -3.4); qs.add(ANVIL2);
const BLADE2 = box(0.9, 0.03, 0.08, gl('#ffb060')); BLADE2.position.set(AX, 1.02, -3.4); qs.add(BLADE2);
const WILL2 = person(WILL, AX - 0.1, -2.6, Math.PI - 0.1);
const HAM2 = new THREE.Group(); { const hd = box(0.24, 0.14, 0.14, mat('#4a4a50')); hd.position.y = -0.7; HAM2.add(hd); const hl = box(0.05, 0.5, 0.05, mat('#6a4a2a')); hl.position.y = -0.5; HAM2.add(hl); } WILL2.userData.arms[1].add(HAM2);
const SPARK2 = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), gl('#ffd080')); qs.add(s); SPARK2.push(s); }
const tSmith = tag('主人公は、鍛冶屋で働く青年', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tSmith);
const tLove = tag('ひそかに想う人は、総督の娘', { size: 50, w: 760, bg: '#e24050', sx: 1.8 }); qs.add(tLove);

// ---------- 3段目. 夜の港町（x=100）。石の家並みと砦。沖に、帆をはった黒っぽい船があらわれる ----------
const BX = 100;
sea(BX, -40, 90, 60, '#14283a'); const W3 = waves(BX, -14, 30, '#24405a');
{ const qy = box(30, 0.6, 12, mat('#6a6458')); qy.position.set(BX, 0.3, 2); qs.add(qy);
  for (let i = 0; i < 7; i++) { const h = box(2.6, 2.4 + R() * 1.6, 2.4, mat(['#c8b898', '#b8a888', '#d0c0a0'][i % 3])); h.position.set(BX - 9 + i * 3, 1.8, 4.5); qs.add(h);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 4), mat('#8a4a3a')); rf.rotation.y = Math.PI / 4; rf.position.set(BX - 9 + i * 3, 3.6 + R() * 0.6, 4.5); qs.add(rf);
    const wn = box(0.5, 0.6, 0.05, gl('#ffd890')); wn.position.set(BX - 9 + i * 3, 1.8, 3.28); qs.add(wn); }
  const ft = box(5, 3, 4, mat('#8a8478')); ft.position.set(BX + 11, 1.5, -2); qs.add(ft);
  for (let i = 0; i < 5; i++) { const cr = box(0.6, 0.6, 0.6, mat('#8a8478')); cr.position.set(BX + 9 + i * 1.0, 3.3, -0.2); qs.add(cr); } }
const SHIP3 = ship('#2a2a30', '#1a1612', 1.3); SHIP3.rotation.y = Math.PI / 2; SHIP3.position.set(BX - 14, 0, -16); qs.add(SHIP3);
const MOON3 = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ fog: false, color: '#f0ecd8' })); MOON3.position.set(BX - 8, 12, -60); qs.add(MOON3);
const TOWN3 = [person(PIR2, BX - 0.9, -2.6, Math.PI, 0.6), person(LADY, BX + 0.1, -2.4, Math.PI, 0.6)];
const tAge = tag('海賊が、海をあらしまわった時代', { size: 48, w: 840, bg: '#14161c', sx: 1.9 }); qs.add(tAge);
const tCome = tag('ある日、港町に海賊があらわれる', { size: 48, w: 840, bg: '#e24050', sx: 1.9 }); qs.add(tCome);

// ---------- 4段目. 夕暮れの海（x=150）。小舟の上の青年と、帽子の海賊。その先に遠ざかる船 ----------
const CX = 150;
sea(CX, -30, 90, 80, '#3a4a6a'); const W4 = waves(CX, 2, 34, '#5a6a8a');
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), new THREE.MeshBasicMaterial({ fog: false, color: '#e8a070' })); SKY4.position.set(CX, 12, -60); qs.add(SKY4);
const SUN4 = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), new THREE.MeshBasicMaterial({ fog: false, color: '#ffd8a0' })); SUN4.position.set(CX + 6, 4, -58); qs.add(SUN4);
const BOAT4 = new THREE.Group(); { const h = box(1.4, 0.5, 3.6, mat('#6a4a30')); h.position.y = 0.2; BOAT4.add(h); const m = box(0.1, 3.2, 0.1, mat('#4a3020')); m.position.set(0, 1.9, 0.6); BOAT4.add(m);
  const sl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshLambertMaterial({ color: '#e8dcc0', side: THREE.DoubleSide })); sl.position.set(0, 2.2, 0.7); BOAT4.add(sl); }
BOAT4.position.set(CX, 0, -2.6); qs.add(BOAT4);
const WILL4 = makePerson(WILL); WILL4.position.set(-0.3, 0.45, -0.8); WILL4.rotation.y = Math.PI; BOAT4.add(WILL4);
const PIR4 = makePerson(PIRATE); PIR4.position.set(0.3, 0.45, -1.4); PIR4.rotation.y = Math.PI + 0.2; BOAT4.add(PIR4); hat(PIR4);
const SHIP4 = ship('#2a2a30', '#1a1612', 1.0); SHIP4.position.set(CX + 4, 0, -32); SHIP4.rotation.y = 0.6; qs.add(SHIP4);
const tTaken = tag('総督の娘が、海賊にさらわれる', { size: 48, w: 820, bg: '#14161c', sx: 1.9 }); qs.add(tTaken);
const tTeam = tag('青年は、一匹狼の海賊と手を組む', { size: 48, w: 840, bg: '#e24050', sx: 1.9 }); qs.add(tTeam);

// ---------- 5段目. 船長室の机（x=200）。古い海図・コンパス・ろうそく ----------
const DX = 200;
{ const fl = box(10, 0.04, 8, mat('#4a3424')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#5a4030')); wl.position.set(DX, 2, -5); qs.add(wl);
  const win = box(1.6, 1.0, 0.05, gl('#8aa8c8')); win.position.set(DX + 2.2, 2.4, -4.88); qs.add(win);
  const tb = box(2.6, 0.1, 1.5, mat('#6a4a2e')); tb.position.set(DX, 0.9, -2.6); qs.add(tb); const tl = box(2.4, 0.85, 1.3, mat('#4a3020')); tl.position.set(DX, 0.42, -2.6); qs.add(tl); }
const MAP5 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshLambertMaterial({ map: canvasTex(360, 220, (g) => {
  g.fillStyle = '#d8c8a0'; g.fillRect(0, 0, 360, 220); g.fillStyle = '#a8b8a0';
  for (const [x, y, r] of [[80, 70, 30], [150, 120, 18], [220, 60, 24], [290, 140, 34], [120, 180, 14], [250, 190, 12]]) { g.beginPath(); g.ellipse(x, y, r * 1.4, r, 0.4, 0, 7); g.fill(); }
  g.strokeStyle = '#8a6a4a'; g.lineWidth = 2; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(30, 200); g.bezierCurveTo(120, 140, 200, 120, 290, 140); g.stroke();
  g.setLineDash([]); g.strokeStyle = '#c03030'; g.lineWidth = 5; g.beginPath(); g.moveTo(280, 130); g.lineTo(300, 150); g.moveTo(300, 130); g.lineTo(280, 150); g.stroke(); }) }));
MAP5.rotation.x = -Math.PI / 2; MAP5.position.set(DX, 0.96, -2.6); qs.add(MAP5);
const COMP5 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 20), mat('#a88a4a')); COMP5.position.set(DX + 0.75, 1.0, -2.2); qs.add(COMP5);
const CANDLE5 = box(0.08, 0.3, 0.08, mat('#f0e8d0')); CANDLE5.position.set(DX - 0.9, 1.1, -2.9); qs.add(CANDLE5);
const FLAME5 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gl('#ffd070')); FLAME5.position.set(DX - 0.9, 1.3, -2.9); qs.add(FLAME5);
const CL5 = new THREE.PointLight('#ffc070', 3, 5); CL5.position.set(DX - 0.9, 1.6, -2.6); qs.add(CL5);
const t2003 = tag('2003年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 1.8 }); qs.add(t2003);
const tSea = tag('舞台は、カリブ海', { size: 56, w: 560, bg: '#e24050', sx: 1.5 }); qs.add(tSea);

// ---------- 6段目. 洞くつの宝の山（x=250）。金貨の山の上の、金色のメダル ----------
const EX = 250;
{ const fl = box(16, 0.04, 14, mat('#2a2622')); fl.position.set(EX, 0.02, -4); qs.add(fl);
  for (let i = 0; i < 14; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 + R() * 1.6, 0), mat(['#3a3430', '#2e2a26', '#443c36'][i % 3])); const a = i / 14 * Math.PI * 1.2 - 0.1; rk.position.set(EX + Math.cos(a) * 7, 1.0 + R() * 3, -6 - Math.sin(a) * 4); qs.add(rk); }
  const wa = sea(EX, 0.5, 16, 3, '#1a3040'); wa.position.y = 0.04; }
const GOLD6 = []; for (let i = 0; i < 70; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 10), new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 0.7, roughness: 0.35, emissive: '#4a3008' }));
  const a = R() * 6.28, r = R() * 1.4; c.position.set(EX + Math.cos(a) * r, 0.05 + (1.4 - r) * 0.45 + R() * 0.05, -3.4 + Math.sin(a) * r * 0.6); c.rotation.set(R(), R(), R()); qs.add(c); GOLD6.push(c); }
const HEAP6 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 16), new THREE.MeshStandardMaterial({ color: '#c8982a', metalness: 0.6, roughness: 0.45, emissive: '#3a2406' })); HEAP6.position.set(EX, 0.35, -3.4); qs.add(HEAP6);
const CHEST6 = new THREE.Group(); { const b = box(1.0, 0.6, 0.6, mat('#5a3a20')); b.position.y = 0.3; CHEST6.add(b); const l = box(1.02, 0.12, 0.62, mat('#6a4a2a')); l.position.set(0, 0.75, -0.2); l.rotation.x = -0.9; CHEST6.add(l); } CHEST6.position.set(EX + 1.8, 0, -4.2); CHEST6.rotation.y = -0.4; qs.add(CHEST6);
const MTEX6 = canvasTex(128, 128, (g) => { g.fillStyle = '#e8b840'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#8a5a10'; g.lineWidth = 5; for (const r of [58, 44, 22]) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); }
  g.lineWidth = 4; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(64 + Math.cos(a) * 26, 64 + Math.sin(a) * 26); g.lineTo(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42); g.stroke(); } });
const MEDAL6 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 32), [new THREE.MeshStandardMaterial({ color: '#c89830', metalness: 0.8, roughness: 0.3, emissive: '#5a3a08' }), new THREE.MeshStandardMaterial({ map: MTEX6, metalness: 0.5, roughness: 0.35, emissive: '#4a3008' }), new THREE.MeshStandardMaterial({ map: MTEX6, metalness: 0.5, roughness: 0.35, emissive: '#4a3008' })]); MEDAL6.position.set(EX, 0.85, -3.4); qs.add(MEDAL6);
const ML6 = new THREE.PointLight('#ffd060', 2.5, 6); ML6.position.set(EX, 1.6, -2.8); qs.add(ML6);
const BEAM6 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.4, 6, 16, 1, true), gl('#fff0c0', 0.08)); BEAM6.position.set(EX, 3.4, -3.4); qs.add(BEAM6);
const tRide = tag('もとは、ディズニーランドの人気アトラクション', { size: 40, w: 940, bg: '#14161c', sx: 2.0 }); qs.add(tRide);
const tAim = tag('海賊がねらうのは、あの金色のメダル', { size: 44, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tAim);

// ---------- shots ----------
const ALL = [tSave, tMedal, tSmith, tLove, tAge, tCome, tTaken, tTeam, t2003, tSea, tRide, tAim, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); [SKY1, SKY4, SUN4, MOON3].forEach(x => x.visible = false); }
function bob(arr, t) { arr.forEach(w => { w.position.y = 0.05 + Math.sin(t * 1.6 + w.userData.p) * 0.04; }); }

function shotRescue(t, quiz = 0) { // 1段目 0〜9：海の上で、ひとりの少年が助けられる。その首には、金色のメダル（0秒目がサムネ）
  base(); SKY1.visible = true; S.aim(0, -3); lift(0); S.hemi.intensity = 1.1; S.key.intensity = 1.2; S.scene.background.set('#a8c8e0'); S.scene.fog.color.set('#a8c8e0');
  bob(W1, t); RAFT1.position.y = 0.08 + Math.sin(t * 1.4) * 0.05; BOY1.position.y = RAFT1.position.y + 0.24;
  GIRL1.userData.head.rotation.x = 0.4;
  const hp = new THREE.Vector3(); BOY1.updateMatrixWorld(); BOY1.userData.head.getWorldPosition(hp);
  MEDAL1.position.set(hp.x - 0.45, hp.y + 0.04, hp.z + 0.05); MEDAL1.rotation.x = 0;
  GLINT1.position.set(MEDAL1.position.x, MEDAL1.position.y + 0.04, MEDAL1.position.z + 0.02); GLINT1.scale.setScalar(0.6 + Math.abs(Math.sin(t * 3)) * 0.8); GLINT1.visible = t > 4.8 || quiz;
  Q1.position.set(1.1, 1.25, -2.0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  const u = ease(t / 9);
  look(lerp(2.7, 2.3, u), lerp(2.4, 1.9, u), lerp(1.4, 0.5, u), 0.6, 0.6, -2.6, 62);
  pin(tSave, 1.05); pin(tMedal, 1.05);
  if (!quiz) { tSave.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tSave.visible = false; tMedal.userData.pop((t - 5.5) / 0.35); }
  return qs;
}
function shotForge(t) { // 2段目 9〜17：主人公は、鍛冶屋で働く青年。ひそかに想う人は、総督の娘
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5; S.darken(0.5, '#0a0604');
  FL2.intensity = 5 + Math.sin(t * 11) * 1.2; const hit = (t * 1.4) % 1; WILL2.userData.arms[1].rotation.x = -2.2 + Math.sin(hit * Math.PI) * 1.4;
  WILL2.userData.head.rotation.x = 0.35; if (t > 4.6) { WILL2.userData.head.rotation.x = 0; WILL2.userData.head.rotation.y = -0.4; }
  SPARK2.forEach((s, i) => { const k = ((t * 1.4) % 1) * 1.6 + i * 0.03; s.position.set(AX + Math.cos(i * 2.3) * k * 0.7, 1.05 + Math.sin(i) * 0.2 + k * 0.5 - k * k * 0.6, -3.4 + Math.sin(i * 1.7) * k * 0.5); s.visible = k < 1.2; });
  const u = ease(t / 8);
  look(AX + lerp(2.4, 1.9, u), lerp(2.0, 1.9, u), lerp(1.4, 0.8, u), AX - 0.5, 1.2, -3.6, 62);
  pin(tSmith, 1.05); pin(tLove, 1.05);
  tSmith.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSmith.visible = false; tLove.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotPort(t) { // 3段目 17〜25：17世紀、海賊が海をあらしまわった時代。ある日、港町に海賊たちがあらわれる
  base(); MOON3.visible = true; S.aim(BX, -6); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.key.color.set('#a8b8e0'); S.darken(0.55, '#04060c');
  bob(W3, t); SHIP3.position.set(BX - 7 + clamp(t / 7) * 6, 0, -16); SHIP3.position.y = Math.sin(t) * 0.08;
  TOWN3.forEach((p, i) => { p.rotation.y = t > 4.2 ? Math.PI : Math.PI + (i ? 0.6 : -0.6); });
  const u = ease(t / 8);
  look(BX + lerp(0.6, 1.0, u), lerp(3.0, 2.8, u), lerp(2.4, 1.6, u), BX - 1.0, 1.2, -12, 62);
  pin(tAge, 1.05); pin(tCome, 1.05);
  tAge.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAge.visible = false; tCome.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotBoat(t) { // 4段目 25〜33：総督の娘が、海賊にさらわれる。青年は、一匹狼の海賊と手を組む
  base(); SKY4.visible = true; SUN4.visible = true; S.aim(CX, -3); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 1.0; S.key.color.set('#ffc898'); S.scene.background.set('#e8a070'); S.scene.fog.color.set('#d89878');
  bob(W4, t); BOAT4.position.y = Math.sin(t * 1.3) * 0.06; BOAT4.rotation.z = Math.sin(t * 1.1) * 0.03;
  PIR4.userData.arms[0].rotation.x = t > 4.4 ? -1.3 : -0.2; WILL4.userData.head.rotation.y = t > 4.4 ? -0.5 : 0;
  const u = ease(t / 8);
  look(CX + lerp(3.8, 3.4, u), lerp(2.0, 1.9, u), lerp(-0.2, -0.8, u), CX - 0.4, 1.55, -5.0, 62);
  pin(tTaken, 1.05); pin(tTeam, 1.05);
  tTaken.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTaken.visible = false; tTeam.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotMap(t) { // 5段目 33〜42：2003年の、アメリカ映画。舞台は、カリブ海
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5; S.darken(0.4, '#0a0604');
  CL5.intensity = 2.6 + Math.sin(t * 9) * 0.5; FLAME5.scale.y = 1 + Math.sin(t * 13) * 0.2; COMP5.rotation.y = t * 0.4;
  const u = ease(t / 9);
  look(DX + lerp(-0.3, 0.3, u), lerp(2.6, 2.3, u), lerp(-0.6, -1.0, u), DX, 0.9, -2.7, 62);
  pin(t2003, 0.95); pin(tSea, 0.95);
  t2003.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2003.visible = false; tSea.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotGold(t) { // 6段目 42〜49（決め手）：もとになったのは、ディズニーランドの人気アトラクション。海賊たちがねらうのは、あの金色のメダル
  base(); S.aim(EX, -3); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.3; S.darken(0.7, '#030202');
  MEDAL6.rotation.set(1.25, 0, Math.sin(t * 0.9) * 0.35); MEDAL6.position.y = 0.95 + Math.sin(t * 1.5) * 0.03; ML6.intensity = 2.4 + Math.sin(t * 4) * 0.6; BEAM6.material.opacity = 0.07 + Math.sin(t * 2) * 0.02;
  const u = ease(t / 7);
  look(EX + lerp(0.8, 0.3, u), lerp(2.0, 1.7, u), lerp(1.0, -0.6, u), EX, 0.75, -3.4, 62);
  pin(tRide, 1.0); pin(tAim, 1.0);
  if (t < 3.6) tRide.userData.pop((t - 0.3) / 0.35); else tAim.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（昼の海に戻る）
  shotRescue(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRescue(t, 0) },
  { a: 9, b: 17, f: shotForge },
  { a: 17, b: 25, f: shotPort },
  { a: 25, b: 33, f: shotBoat },
  { a: 33, b: 42, f: shotMap },
  { a: 42, b: 49, f: shotGold },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '海の上で、ひとりの<br>少年が助けられる。'],
  [5.6, 9.0, 'その首には、<br>金色のメダル。'],
  [9.2, 13.2, '主人公は、鍛冶屋で働く<br>たくましい青年。'],
  [13.2, 17.0, 'ひそかに想う人は、<br>港町の総督の娘。'],
  [17.2, 21.0, '17世紀、海賊たちが<br>海をあらしまわった時代。'],
  [21.0, 25.0, 'ある日、港町に<br>海賊たちがあらわれる。'],
  [25.2, 29.0, '総督の娘が、<br>海賊にさらわれる。'],
  [29.0, 33.0, '青年は、一匹狼の海賊と<br>手を組む。'],
  [33.2, 37.4, '2003年の、<br>アメリカ映画。'],
  [37.4, 41.8, '舞台は、<br>カリブ海。'],
  [42.2, 45.4, 'もとになったのは、ディズニー<br>ランドの人気アトラクション。'],
  [45.4, 49.0, '海賊たちがねらうのは、<br>あの金色のメダル。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、パイレーツ・オブ・<br>カリビアン 呪われた海賊たち。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q136', v2: true, answer: 'パイレーツ・オブ・カリビアン／呪われた海賊たち',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 13610,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble', 0.4], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.2, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.6, 'bubble', 0.4], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '海': 'うみ', '上': 'うえ', '少年': 'しょうねん', '助けられる': 'たすけられる', '首': 'くび', '金色': 'きんいろ', '主人公': 'しゅじんこう', '鍛冶屋': 'かじや', '働く': 'はたらく', '青年': 'せいねん', '想う': 'おもう', '人': 'ひと', '港町': 'みなとまち', '総督': 'そうとく', '娘': 'むすめ', '17世紀': 'じゅうななせいき', '海賊': 'かいぞく', '時代': 'じだい', '一匹狼': 'いっぴきおおかみ', '手を組む': 'てをくむ', '2003年': 'にせんさんねん', '映画': 'えいが', '舞台': 'ぶたい', '人気': 'にんき', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '呪われた': 'のろわれた', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n海の上で、ひとりの少年が助けられる。その首には、金色のメダル。主人公は、鍛冶屋で働くたくましい青年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', '映画好き', '洋画', 'アドベンチャー'],
  },
});
applyQuizCards({ answer: 'パイレーツ・オブ・<br>カリビアン<br><span style="font-size:0.62em">呪われた海賊たち</span>', info: 'Disney+｜映画・143分', answerSize: 104 });
