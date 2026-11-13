import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #081 ジョーカー（映画・アメリカ・2019年・122分。Hulu・U-NEXT で見放題（Prime Video も）、
//   JustWatch 日本版 justwatch.com/jp/映画/ziyoka で2026/11/13確認（Filmarks の動画配信欄も U-NEXT・Hulu 見放題）。
//   Filmarks 4.0・レビュー379,291件 filmarks.com/movies/80819）
// 確かめた事実（Filmarks の作品紹介、ja.wikipedia.org/wiki/ジョーカー_(映画)。2026/11/13）：
//   ・主人公は、緊張すると発作的に笑い出してしまう病気を抱え、定期的にカウンセリングを受けている（Wikipedia）
//   ・ピエロ姿で店の看板を持ってセールの宣伝をするなど、派遣ピエロとしてわずかな金を稼ぐ（Wikipedia）
//   ・舞台の大都市は財政の崩壊で失業者や犯罪者があふれ、貧富の差は大きくなるばかり（Wikipedia）
//   ・年老いた母とつつましく暮らし、一流のコメディアンになる夢がある。ネタをノートに書き、憧れの司会者のトークショーを見る（Wikipedia・Filmarks）
//   ・2019年のアメリカ映画、122分（Filmarks）。ヴェネツィア国際映画祭で金獅子賞、アカデミー賞で主演男優賞と作曲賞（Wikipedia）
//   ・孤独だが心優しい男が、なぜ狂気あふれる悪のカリスマに変貌したのか（Filmarks）。DCコミックス「バットマン」の悪役が元（Wikipedia）
// 構成（ヒント6段）：1 笑ってはいけない場面で笑いが止まらない男 → 2 主人公はピエロの格好で看板を回して稼ぐ
//   → 3 ゴミがあふれ貧富の差が広がる大都市 → 4 年老いた母と二人暮らし、夢はコメディアン
//   → 5 2019年のアメリカ映画、金獅子賞とアカデミー賞2部門 → 6 決め手：心優しい男が、アメコミの有名な悪役になるまで
// 事件・暴力の場面は見せない。結末・真実の中身は言わない。人物名・都市名は出さない。
// 俳優の顔・ポスター・ロゴ・有名な場面（階段など）の構図・あの化粧は使わない。人は汎用の3D、ピエロは赤い鼻と三角帽子だけ

const S = quizStage({ bg: '#1a1c22', floor: '#26282c', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8181);

const HERO = { skin: '#efd2b8', hair: '#2a2420', shirt: '#7a6a58', pants: '#3a3630' };
const CLOWN = { skin: '#f4ece4', hair: '#2a2420', shirt: '#e2483c', pants: '#2a5aa8' };
const MOM = { skin: '#f1d8c0', hair: '#c8c4c0', shirt: '#b8a8c8', pants: '#5a5468', long: true, skirt: true };
const CROWD = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5', '#d9a57c'][i % 4], hair: ['#1d1a19', '#9a9a9a', '#4a3426', '#6b4a33'][i % 4], shirt: ['#4a5060', '#6a5a4a', '#3b4a3a', '#5a4a5a', '#3a3f4a'][i % 5], pants: ['#2b3346', '#3b3f4a', '#4a3a2a'][i % 3], long: i % 3 === 1, skirt: i % 3 === 1 });

function clownUp(p) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#e2282c')); n.position.set(0, 0.2, 0.21); p.userData.head.add(n);
  const h = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 14), mat('#f2c14e')); h.position.y = 0.72; p.userData.head.add(h);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#ffffff')); b.position.y = 0.95; p.userData.head.add(b); }
function haTag() { return tag('ハハハ', { size: 70, w: 300, h: 130, bg: '#e6b450', color: '#14161c', sx: 0.62 }); }

// ---------- 1段目. 夜のバスの中（x=0）。笑いが止まらない男と、冷たい目の乗客 ----------
{ const fl = box(4, 0.04, 14, mat('#4a4a50')); fl.position.set(0, 0.02, -3); qs.add(fl);
  for (const x of [-2, 2]) { const wl = box(0.1, 3, 14, mat('#c8c4b8')); wl.position.set(x, 1.5, -3); qs.add(wl);
    for (let i = 0; i < 5; i++) { const w = box(0.05, 0.9, 1.8, new THREE.MeshBasicMaterial({ color: '#1a2438' })); w.position.set(x * 0.97, 1.8, 1 - i * 2.4); qs.add(w); } }
  const ce = box(4, 0.1, 14, mat('#d8d4c8')); ce.position.set(0, 3, -3); qs.add(ce);
  for (let i = 0; i < 4; i++) { const lt = box(0.3, 0.04, 1.6, new THREE.MeshBasicMaterial({ color: '#f4f0d8' })); lt.position.set(0, 2.94, 0.5 - i * 3); qs.add(lt); }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 14, 8), mat('#c8c8c8')); rail.rotation.x = Math.PI / 2; rail.position.set(0.6, 2.5, -3); qs.add(rail); }
const SEATS = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const st = box(0.9, 0.5, 0.6, mat('#2a4a6a')); st.position.set(s * 1.35, 0.45, 0.5 - i * 2.2); qs.add(st); const bk = box(0.9, 0.8, 0.12, mat('#2a4a6a')); bk.position.set(s * 1.35, 0.95, 0.8 - i * 2.2); qs.add(bk); }
const man1 = makePerson(HERO); man1.position.set(-1.35, 0.2, -1.7); man1.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(man1);
const RIDERS = []; [[1.35, -1.7], [1.35, -3.9], [-1.35, -3.9], [1.35, -6.1], [-1.35, -6.1]].forEach(([x, z], i) => { const p = makePerson(CROWD(i)); p.position.set(x, 0.2, z); p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); RIDERS.push(p); });
const HA1 = []; for (let i = 0; i < 3; i++) { const h = haTag(); qs.add(h); HA1.push(h); }
const tLaugh = tag('止まらない笑い', { size: 64, w: 480, bg: '#14161c', sx: 1.8 }); tLaugh.position.set(-0.7, 2.7, -3.6); qs.add(tLaugh);
const tStare = tag('まわりの冷たい目', { size: 60, w: 540, bg: '#2a5aa8', sx: 1.9 }); tStare.position.set(-0.7, 2.7, -3.6); qs.add(tStare);

// ---------- 2段目. 昼の商店街（x=40）。ピエロの格好で看板を回す男 ----------
const AX = 40;
{ const gr = box(16, 0.04, 12, mat('#8a8680')); gr.position.set(AX, 0.02, -2); qs.add(gr);
  for (let i = 0; i < 4; i++) { const sh = box(3.6, 4.5, 1.5, mat(['#8a6a58', '#6a7a8a', '#9a8a6a', '#7a5a5a'][i])); sh.position.set(AX - 5.4 + i * 3.6, 2.25, -5); qs.add(sh);
    const win = box(2.6, 1.6, 0.05, new THREE.MeshBasicMaterial({ color: '#e8d8a8' })); win.position.set(AX - 5.4 + i * 3.6, 1.2, -4.24); qs.add(win);
    const aw = box(3.4, 0.12, 0.8, mat(['#c84a3a', '#3a7ad8', '#e6b450', '#3f8f6b'][i])); aw.position.set(AX - 5.4 + i * 3.6, 2.3, -3.9); aw.rotation.x = 0.25; qs.add(aw); } }
const clown2 = makePerson(CLOWN); clownUp(clown2); clown2.position.set(AX, 0, -1.8); qs.add(clown2);
const SIGN = new THREE.Group(); { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(280, 120, (g, w, h) => { g.fillStyle = '#f2c14e'; g.fillRect(0, 0, w, h); g.fillStyle = '#e2483c'; g.beginPath(); g.moveTo(20, h / 2); g.lineTo(70, 20); g.lineTo(70, 100); g.fill(); g.fillRect(70, 46, 180, 28); }), side: THREE.DoubleSide })); SIGN.add(b); }
SIGN.position.set(AX, 1.5, -1.5); qs.add(SIGN);
const PASS2 = []; for (let i = 0; i < 4; i++) { const p = makePerson(CROWD(i + 2)); p.position.set(AX, 0, -3); qs.add(p); PASS2.push(p); }
const COINS = []; for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.7, roughness: 0.3 })); c.rotation.x = Math.PI / 2; qs.add(c); COINS.push(c); }
const tClown = tag('ピエロの仕事', { size: 66, w: 440, bg: '#e2483c', sx: 1.7 }); tClown.position.set(AX, 3.3, -1.8); qs.add(tClown);
const tPay = tag('稼ぎは、わずか', { size: 64, w: 460, bg: '#14161c', sx: 1.8 }); tPay.position.set(AX, 3.3, -1.8); qs.add(tPay);

// ---------- 3段目. 夜の大都市（x=80）。積み上がるゴミ袋、高いビルと暗い路地 ----------
const BX = 80;
const RICH = [];
{ const gr = box(30, 0.04, 30, mat('#2a2a30')); gr.position.set(BX, 0.02, -8); qs.add(gr);
  for (let i = 0; i < 7; i++) { const h = 6 + (i * 5) % 10; const b = box(2.4, h, 2.4, mat('#3a3a42')); b.position.set(BX - 9 + i * 3, h / 2, -12); qs.add(b);
    for (let k = 0; k < 6; k++) { const w = box(0.4, 0.5, 0.05, new THREE.MeshBasicMaterial({ color: (i + k) % 4 ? '#2a3040' : '#c8a868' })); w.position.set(BX - 9 + i * 3 + ((k % 2) - 0.5) * 0.9, 1.5 + Math.floor(k / 2) * 1.5, -10.77); qs.add(w); } }
  for (let i = 0; i < 2; i++) { const tw = box(3, 20, 3, mat('#5a5a68')); tw.position.set(BX - 5 + i * 10, 10, -20); qs.add(tw);
    for (let k = 0; k < 10; k++) { const w = box(2.4, 0.4, 0.05, new THREE.MeshBasicMaterial({ color: '#f4e0a0' })); w.position.set(BX - 5 + i * 10, 2 + k * 1.8, -18.47); qs.add(w); RICH.push(w); } } }
const BAGS = []; for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.35 + R() * 0.15, 8, 6), mat(['#1a1a1e', '#2a3a2a', '#3a3a40'][i % 3])); b.scale.y = 0.8; b.position.set(BX - 4 + (i % 9) * 1.0 + R() * 0.3, 0.3 + Math.floor(i / 9) * 0.4, -5 - (i % 3) * 0.6 + R() * 0.4); qs.add(b); BAGS.push(b); }
const walk3 = makePerson(HERO); walk3.position.set(BX - 3, 0, -3.8); walk3.rotation.y = Math.PI / 2; qs.add(walk3);
const tTrash = tag('ゴミがあふれる街', { size: 62, w: 540, bg: '#14161c', sx: 2.0 }); tTrash.position.set(BX, 4.4, -4); qs.add(tTrash);
const tGap = tag('広がる貧富の差', { size: 64, w: 500, bg: '#8a1f2c', sx: 1.9 }); tGap.position.set(BX, 4.4, -4); qs.add(tGap);

// ---------- 4段目. 小さなアパートの部屋（x=120）。母と、テレビのトーク番組と、ネタ帳 ----------
const CX = 120;
{ const fl = box(10, 0.04, 8, mat('#6a5a48')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#8a9a88')); wl.position.set(CX, 2, -3.5); qs.add(wl);
  const bed = box(1.2, 0.5, 2.2, mat('#d8d0c0')); bed.position.set(CX - 2.4, 0.25, -2.0); qs.add(bed);
  const tvs = box(1.2, 0.5, 0.5, mat('#3a2a20')); tvs.position.set(CX + 1.8, 0.25, -3.0); qs.add(tvs);
  const tvb = box(1.4, 1.0, 0.5, mat('#2a2a2a')); tvb.position.set(CX + 1.8, 1.0, -3.0); qs.add(tvb);
  const dsk = box(1.2, 0.08, 0.7, mat('#8a6a48')); dsk.position.set(CX, 0.75, -0.3); qs.add(dsk); for (const x of [-0.55, 0.55]) { const lg = box(0.06, 0.74, 0.6, mat('#6a4a30')); lg.position.set(CX + x, 0.37, -0.3); qs.add(lg); } const chr = box(0.5, 0.42, 0.5, mat('#5a3a2a')); chr.position.set(CX, 0.21, -1.4); qs.add(chr);
  const lmp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); lmp.position.set(CX + 0.45, 1.1, -0.4); qs.add(lmp); }
const TVS = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: canvasTex(240, 160, (g, w, h) => { g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c14e'; for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 14, 28); g.fillStyle = '#8a4a2a'; g.fillRect(120, 96, 90, 30); g.fillStyle = '#e8d8c8'; g.beginPath(); g.arc(60, 90, 18, 0, 7); g.fill(); g.beginPath(); g.arc(170, 80, 18, 0, 7); g.fill(); g.fillStyle = '#999'; g.fillRect(100, 60, 4, 50); }) }));
TVS.position.set(CX + 1.8, 1.0, -2.74); qs.add(TVS);
const mom4 = makePerson(MOM); mom4.position.set(CX - 2.4, 0.4, -2.2); mom4.rotation.y = 0.9; mom4.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(mom4);
const man4 = makePerson(HERO); man4.position.set(CX, -0.22, -1.3); man4.rotation.y = 0; man4.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(man4);
const NOTE = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(160, 120, (g, w, h) => { g.fillStyle = '#f8f4e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a3a44'; g.lineWidth = 3; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(14, 22 + k * 20); g.lineTo(140 - (k % 2) * 30, 22 + k * 20); g.stroke(); } }) })); NOTE.rotation.x = -Math.PI / 2; NOTE.position.set(CX, 0.8, -0.3); qs.add(NOTE);
const MIC = new THREE.Group(); { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8), mat('#888')); st.position.y = 0.7; MIC.add(st); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#2a2a2a')); hd.position.y = 1.45; MIC.add(hd); }
const tMom = tag('年老いた母と二人', { size: 60, w: 540, bg: '#14161c', sx: 1.9 }); tMom.position.set(CX - 0.5, 2.6, -1.8); qs.add(tMom);
const tDream = tag('夢は、コメディアン', { size: 60, w: 560, bg: '#e6b450', color: '#14161c', sx: 1.9 }); tDream.position.set(CX - 0.5, 2.6, -1.8); qs.add(tDream);

// ---------- 5段目. 映画祭の赤い道（x=180）。2019年のアメリカ映画 ----------
const TX = 180;
const FLASH = [];
{ const fl = box(12, 0.04, 14, mat('#1e1e24')); fl.position.set(TX, 0.02, -2); qs.add(fl);
  const carpet = box(2.4, 0.03, 14, mat('#a8202a')); carpet.position.set(TX, 0.05, -2); qs.add(carpet);
  const wl = box(12, 6, 0.2, mat('#14161c')); wl.position.set(TX, 3, -8); qs.add(wl);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), mat('#e6b450')); post.position.set(TX + s * 1.5, 0.45, 2 - i * 1.8); qs.add(post);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); f.position.set(TX + s * 3.2, 1.6 + (i % 2) * 0.5, 1.5 - i * 1.6); qs.add(f); FLASH.push(f); } }
const LION = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.4, 16), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.25 })); LION.add(b);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.25 })); top.position.y = 0.5; LION.add(top); }
LION.position.set(TX, 2.0, -4); qs.add(LION);
const t2019 = tag('2019年 アメリカ映画', { size: 58, w: 640, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2019.position.set(TX, 3.9, -4); qs.add(t2019);
const tAward = tag('アカデミー賞 2部門', { size: 60, w: 600, bg: '#8a1f2c', sx: 2.3 }); tAward.position.set(TX, 3.9, -4); qs.add(tAward);

// ---------- 6段目. 暗い舞台（x=220）。スポットライトのマイク、舞い落ちるトランプ ----------
const DX = 220;
{ const fl = box(12, 0.04, 10, mat('#141418')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const stg = box(6, 0.4, 3, mat('#3a2a24')); stg.position.set(DX, 0.2, -2.4); qs.add(stg);
  const cur = box(8, 6, 0.2, mat('#6a1420')); cur.position.set(DX, 3, -4); qs.add(cur);
  for (let i = 0; i < 9; i++) { const f = box(0.12, 6, 0.3, mat('#5a1018')); f.position.set(DX - 3.6 + i * 0.9, 3, -3.85); qs.add(f); } }
const MIC6 = MIC; MIC6.position.set(DX, 0.4, -2.0); qs.add(MIC6);
const CARDS = []; for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.46), new THREE.MeshBasicMaterial({ map: canvasTex(64, 92, (g, w, h) => { g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = i % 2 ? '#c8282c' : '#2a8a4a'; g.beginPath(); g.arc(w / 2, h / 2, 14, 0, 7); g.fill(); }), side: THREE.DoubleSide })); c.position.set(DX, 2, -1.6); qs.add(c); CARDS.push(c); }
const man6 = makePerson(HERO); man6.position.set(DX + 1.4, 0.4, -2.2); man6.rotation.y = -0.6; qs.add(man6);
const SPOT6 = new THREE.SpotLight(0xfff0d0, 0, 10, 0.35, 0.5, 1); SPOT6.position.set(DX, 6, -0.5); SPOT6.target.position.set(DX, 0.4, -2.0); qs.add(SPOT6); qs.add(SPOT6.target);
const tKind = tag('心優しい男が、なぜ', { size: 60, w: 580, bg: '#14161c', sx: 2.0 }); tKind.position.set(DX, 2.9, -2.0); qs.add(tKind);
const tVillain = tag('アメコミの悪役に', { size: 64, w: 540, bg: '#3f8f3b', sx: 2.0 }); tVillain.position.set(DX, 2.9, -2.0); qs.add(tVillain);

// ---------- shots ----------
const ALL = [tLaugh, tStare, tClown, tPay, tTrash, tGap, tMom, tDream, t2019, tAward, tKind, tVillain];
function base() { S.reset(); ALL.forEach(x => x.visible = false); HA1.forEach(h => h.visible = false); COINS.forEach(c => c.visible = false); SPOT6.intensity = 0; }

function shotBus(t, quiz = 0) { // 1段目 0〜9：笑ってはいけない場面で、なぜか笑いが止まらない男（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.0;
  man1.rotation.y = Math.PI / 2; man1.userData.head.rotation.x = -0.2 + Math.sin(t * 14) * 0.08; man1.userData.arms[0].rotation.x = -1.9; man1.userData.arms[1].rotation.x = -0.6 + Math.sin(t * 12) * 0.2;
  RIDERS.forEach((p, i) => { p.rotation.y = p.position.x > 0 ? -Math.PI / 2 : Math.PI / 2; p.userData.head.rotation.y = (t > 4.2 || quiz) ? (p.position.x > 0 ? 0.0 : 0.0) : 0; p.userData.arms.forEach(a => a.rotation.x = -0.4); });
  if (t > 4.2 || quiz) { RIDERS.forEach((p) => { const dx = man1.position.x - p.position.x, dz = man1.position.z - p.position.z; p.rotation.y = Math.atan2(dx, dz); }); }
  HA1.forEach((h, i) => { h.visible = true; h.userData.pop(quiz ? 1 : (t - 0.2 - i * 0.5) / 0.3); h.position.set(-1.45 + (i - 1) * 0.22, 2.1 + i * 0.2 + Math.sin(t * 6 + i) * 0.04, -1.7); });
  if (!quiz) { tLaugh.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tLaugh.visible = false; tStare.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.0, 0.8, u), lerp(2.2, 2.1, u), lerp(3.0, 2.4, u), -0.9, 1.3, -2.4, 60);
  return qs;
}
function shotStreet(t) { // 2段目 9〜17：主人公は、ピエロの格好で看板を回して稼ぐ男
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.3;
  clown2.userData.arms[0].rotation.x = -0.3; clown2.userData.arms[1].rotation.x = -1.0; clown2.rotation.y = -0.25; clown2.position.y = Math.abs(Math.sin(t * 4)) * 0.06;
  SIGN.position.set(AX + 0.75, 1.35 + Math.abs(Math.sin(t * 4)) * 0.06, -1.5); SIGN.rotation.z = t * 5; SIGN.rotation.y = Math.sin(t * 2) * 0.3;
  PASS2.forEach((p, i) => { const dir = i % 2 ? -1 : 1; const x = ((t * 0.9 + i * 2.2) % 9) - 4.5; p.position.set(AX + x * dir, 0, -2.9 - (i % 2) * 0.6); p.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; poseWalk(p, t * 6 + i, 1); });
  if (t > 4.2) COINS.forEach((c, i) => { c.visible = true; const k = clamp((t - 4.6 - i * 0.4) / 0.6); c.position.set(AX + 0.9 + i * 0.12, lerp(2.4, 0.06, ease(k)), -1.2 + i * 0.1); c.rotation.z = t * 6; });
  tClown.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tClown.visible = false; tPay.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.6, 0.4, u), lerp(1.8, 1.9, u), lerp(3.6, 3.0, u), AX, 1.6, -1.8, 58);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：ゴミがあふれ、貧しい人が増え続ける大都市
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.65; S.darken(0.55, '#08080c');
  walk3.position.x = BX - 2.4 + t * 0.35; poseWalk(walk3, t * 5, 0.8); walk3.userData.head.rotation.x = 0.3;
  RICH.forEach((w, i) => { w.visible = t > 4.2; });
  if (t > 4.2) { S.spot.intensity = 0; }
  tTrash.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTrash.visible = false; tGap.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.2, 0.8, u), lerp(2.0, 3.4, u), lerp(3.6, 3.2, u), BX, lerp(1.6, 4.0, ease(clamp((t - 3.8) / 2))), -8, 62);
  return qs;
}
function shotRoom(t, quiz = 0) { // 4段目 25〜33：年老いた母と、二人暮らし。夢は、コメディアンになること
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#0a0a10');
  man4.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 6) * 0.15; man4.userData.head.rotation.x = 0.4;
  man4.rotation.y = 0; if (t > 4.2 && !quiz) { man4.userData.head.rotation.x = 0; man4.rotation.y = 2.34; }
  mom4.userData.head.rotation.x = 0.1;
  if (!quiz) { tMom.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMom.visible = false; tDream.userData.pop((t - 4.2) / 0.35); }
  const u = ease(t / 8);
  look(CX + lerp(-0.2, 0.4, u), lerp(2.7, 2.5, u), lerp(3.6, 3.0, u), CX - 0.5, 1.0, -1.6, 66);
  return qs;
}
function shotRed(t) { // 5段目 33〜42：2019年のアメリカ映画。映画祭の最高賞と、アカデミー賞2部門
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.5, '#08080c');
  FLASH.forEach((f, i) => { f.visible = Math.sin(t * 13 + i * 2.7) > 0.75; });
  LION.rotation.y = t * 0.8; LION.position.y = 2.0 + Math.sin(t * 2) * 0.05;
  S.spot.intensity = 20; S.spot.color.set('#fff0d0'); S.spot.position.set(TX, 6, -2); S.spot.target.position.set(TX, 2, -4);
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t2019.visible = false; tAward.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(1.8, 2.2, u), lerp(4.2, 3.0, u), TX, 2.2, -4, 58);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：心優しい男は、なぜ悪のカリスマになったのか。アメコミの有名な悪役、その誕生の物語
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.3; S.darken(0.8, '#040406'); SPOT6.intensity = 45;
  man6.userData.head.rotation.x = 0.35; man6.position.x = DX + lerp(1.6, 1.1, ease(t / 7));
  CARDS.forEach((c, i) => { const k = (t * 0.25 + i / 10) % 1; c.position.set(DX - 1.6 + (i % 5) * 0.8 + Math.sin(t + i) * 0.2, 3.4 - k * 3.2, -1.6 + (i % 3) * 0.3); c.rotation.set(t * 2 + i, t * 1.4 + i, i); });
  tKind.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tKind.visible = false; tVillain.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.8, 0.0, u), lerp(1.8, 1.9, u), lerp(3.2, 2.6, u), DX + 0.3, 1.4, -2.0, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（部屋に戻る）
  shotRoom(6.0 + t, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.8, 0.45, d); S.darken(0.3 + 0.3 * d, '#100a14');
  const k = ease(t / 7);
  look(CX + lerp(0.4, 0.1, k), 2.5, lerp(3.0, 2.5, k), CX - 0.5, 1.0, -1.6, 66);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotBus(t, 0) },
  { a: 9, b: 17, f: shotStreet },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: (t) => shotRoom(t, 0) },
  { a: 33, b: 42, f: shotRed },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '笑ってはいけない場面で、<br>笑いが止まらない男。'],
  [5.6, 9.0, 'まわりの人は、<br>冷たい目を向ける。'],
  [9.2, 13.2, '主人公は、ピエロの格好で<br>看板を回して稼ぐ男。'],
  [13.2, 17.0, 'もらえるお金は、<br>ほんのわずか。'],
  [17.2, 21.0, 'ゴミがあふれ、<br>貧しい人が増え続ける大都市。'],
  [21.0, 25.0, '持つ者と持たない者の差は、<br>広がるばかり。'],
  [25.2, 29.0, '年老いた母と、<br>二人きりの暮らし。'],
  [29.0, 33.0, '夢は、テレビに出る<br>コメディアンになること。'],
  [33.2, 37.4, '2019年のアメリカ映画。<br>映画祭で最高賞を受賞。'],
  [37.4, 41.8, 'アカデミー賞でも、<br>主演男優賞など2部門。'],
  [42.2, 45.4, '心優しい男は、なぜ<br>悪のカリスマになったのか。'],
  [45.4, 49.0, 'アメコミの有名な悪役、<br>その誕生の物語。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ジョーカー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q081', v2: true, answer: 'ジョーカー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 8181,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '主演男優賞': 'しゅえんだんゆうしょう', '笑って': 'わらって', '場面': 'ばめん', '笑い': 'わらい', '止まらない': 'とまらない', '男': 'おとこ', '人は': 'ひとは', '冷たい': 'つめたい', '目': 'め', '向ける': 'むける', '主人公': 'しゅじんこう', '格好': 'かっこう', '看板': 'かんばん', '回して': 'まわして', '稼ぐ': 'かせぐ', 'お金': 'おかね', '貧しい人': 'まずしいひと', '増え続ける': 'ふえつづける', '大都市': 'だいとし', '持つ者': 'もつもの', '持たない者': 'もたないもの', '差': 'さ', '広がる': 'ひろがる', '年老いた': 'としおいた', '母': 'はは', '二人きり': 'ふたりきり', '暮らし': 'くらし', '夢': 'ゆめ', '出る': 'でる', '2019年': 'にせんじゅうきゅうねん', '映画祭': 'えいがさい', '最高賞': 'さいこうしょう', '受賞': 'じゅしょう', 'アカデミー賞': 'アカデミーしょう', '2部門': 'にぶもん', '心優しい': 'こころやさしい', '悪のカリスマ': 'あくのカリスマ', '有名': 'ゆうめい', '悪役': 'あくやく', '誕生': 'たんじょう', '物語': 'ものがたり', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n笑ってはいけない場面で、笑いが止まらない男。主人公は、ピエロの格好で看板を回して稼ぐ男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'U-NEXT', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'ジョーカー', info: 'Hulu・U-NEXT｜映画・122分', answerSize: 140 });
