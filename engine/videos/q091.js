import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #091 大豆田とわ子と三人の元夫（ドラマ・日本・カンテレ制作 フジテレビ系 火曜21時・2021年4月13日〜6月15日・全10話。
//   FOD・Prime Video・U-NEXT・Hulu・Netflix で見放題、JustWatch 日本版 justwatch.com/jp/テレビ番組/da-dou-tian-towazi-tosan-ren-noyuan-fu で2026/11/15確認
//   （Filmarks の動画配信欄も FOD・Prime Video ほか見放題）。Filmarks 4.4・レビュー65,047件 filmarks.com/dramas/10332/14440）
// 確かめた事実（ja.wikipedia.org/wiki/大豆田とわ子と三人の元夫 の 概要・あらすじ 第1章・主要人物。2026/11/15）：
//   ・主人公は建設会社の新社長。3度の離婚歴があり、娘（中学3年生）とふたり暮らし
//   ・亡くなった母のパソコンのパスワードロックを解くため、設定したと思われる元夫三人に連絡を取らざるを得なくなる
//   ・元夫は、レストランのオーナー（最初の夫）・カメラマン・弁護士。そのレストランで元夫たちと度々顔を合わせるようになる
//   ・元夫たちはそれぞれ周囲の女性たちに振り回されてゆく
//   ・2021年にカンテレ制作・フジテレビ系で放送。“新感覚”ロマンティック・コメディ
// 構成（ヒント6段）：1 亡くなった母のパソコン・パスワードがわからない・知っていそうなのは昔の家族 → 2 建設会社の新しい社長・中学生の娘とふたり暮らし
//   → 3 夜のレストランに集まる男たち・店主とカメラマンと弁護士 → 4 3人とも主人公をよく知る男・それぞれ女性に振り回される
//   → 5 2021年の日本の連続ドラマ・新感覚のロマンティック・コメディ → 6 決め手：3回結婚して3回離婚・集まる3人は全員元夫
// 第2章の出来事・親友のこと・結末は言わない。人物名・会社名・店名・地名は出さない。俳優の顔・ポスター・ロゴ・タイトルコールの演出は使わない。人は汎用の3D
const S = quizStage({ bg: '#1e1c24', floor: '#26242c', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(9191);

const TOWA = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#e8d8c0', pants: '#4a4a5a', long: true };
const UTA = { skin: '#f4d3b5', hair: '#1d1a19', shirt: '#2a3a5a', pants: '#2a3a5a', long: true, skirt: true, scale: 0.86 };
const M1 = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#f4f4f0', pants: '#1a1a1e' };          // 店主（白いシャツ・黒いエプロン）
const M2 = { skin: '#e8b98f', hair: '#4a3426', shirt: '#7a8a5a', pants: '#3b3f4a' };          // カメラマン
const M3 = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#2a2e3a', pants: '#2a2e3a', tie: true }; // 弁護士
const MEN = [M1, M2, M3];
const W1 = { skin: '#f4d3b5', hair: '#6a3a2a', shirt: '#c94f7c', pants: '#3a2a3a', long: true, skirt: true };
const W2 = { skin: '#f1c9a5', hair: '#e0c08a', shirt: '#e6b450', pants: '#2a2a2e', long: true };
const W3 = { skin: '#f4d3b5', hair: '#1d1a19', shirt: '#4fa3d1', pants: '#3b3f4a', long: true, skirt: true };
const WOMEN = [W1, W2, W3];

function camera() { const g = new THREE.Group(); const b = box(0.22, 0.14, 0.1, mat('#1a1a1e')); g.add(b); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), mat('#3a3a40')); l.rotation.x = Math.PI / 2; l.position.z = 0.09; g.add(l); return g; }
function bag() { const b = box(0.36, 0.26, 0.09, mat('#3a2418')); const h = box(0.12, 0.04, 0.03, mat('#1a1a1e')); h.position.y = 0.15; b.add(h); return b; }
function apron(p) { const a = box(0.42, 0.7, 0.02, mat('#1a1a1e')); a.position.set(0, 0.9, 0.15); p.add(a); }

// ---------- 1段目. 夜の部屋（x=0）。ノートパソコンの画面にパスワードの欄・赤い×。のぞきこむ主人公 ----------
{ const fl = box(8, 0.04, 7, mat('#5a4a3a')); fl.position.set(0, 0.02, -1.5); qs.add(fl);
  const wl = box(8, 4, 0.2, mat('#3a3442')); wl.position.set(0, 2, -4); qs.add(wl);
  const desk = box(2.2, 0.06, 1.0, mat('#8a6a4a')); desk.position.set(0, 0.78, -2.4); qs.add(desk);
  for (const [x, z] of [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]]) { const lg = box(0.06, 0.78, 0.06, mat('#6a4a30')); lg.position.set(x, 0.39, -2.4 + z); qs.add(lg); }
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 16, 1, true), mat('#e8dcc0')); lamp.position.set(-0.85, 1.3, -2.6); qs.add(lamp);
  const lb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); lb.position.set(-0.85, 1.2, -2.6); qs.add(lb);
  const st = box(0.03, 0.5, 0.03, mat('#3a3a40')); st.position.set(-0.85, 1.05, -2.6); qs.add(st);
  const ph = box(0.3, 0.38, 0.03, mat('#c8b890')); ph.position.set(0.85, 1.0, -2.75); ph.rotation.x = -0.15; qs.add(ph);
  const pi = box(0.24, 0.3, 0.01, mat('#d8c8a8')); pi.position.set(0.85, 1.0, -2.73); pi.rotation.x = -0.15; qs.add(pi);
  const fl2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#e8a0b0')); fl2.position.set(0.6, 0.86, -2.6); qs.add(fl2); }
const LAP1 = new THREE.Group();
{ const base = box(0.7, 0.03, 0.48, mat('#b8bcc4')); LAP1.add(base);
  const lid = box(0.7, 0.46, 0.02, mat('#b8bcc4')); lid.position.set(0, 0.23, -0.24); lid.rotation.x = -0.15; LAP1.add(lid);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.4), new THREE.MeshBasicMaterial({ map: canvasTex(640, 400, (g, w, h) => {
    g.fillStyle = '#2a4a7a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8eef4'; g.beginPath(); g.arc(w / 2, 110, 46, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(140, 200, 360, 64); g.fillStyle = '#1a1a1e'; g.font = '900 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('＊＊＊＊＊＊', w / 2, 234);
    g.fillStyle = '#e04848'; g.font = '900 70px sans-serif'; g.fillText('✕', w / 2, 330); }) }));
  scr.position.set(0, 0.235, -0.225); scr.rotation.x = -0.15; LAP1.add(scr); }
LAP1.position.set(0, 0.82, -2.3); qs.add(LAP1);
const towa1 = makePerson(TOWA); towa1.position.set(-0.35, 0, -1.45); towa1.rotation.y = Math.PI; qs.add(towa1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.3 }); Q1.position.set(0.45, 1.55, -2.5); qs.add(Q1);
const tPass = tag('パスワードが、わからない', { size: 54, w: 720, bg: '#14161c', sx: 1.25 }); tPass.position.set(0.1, 1.95, -2.9); qs.add(tPass);
const tFam = tag('知るのは、昔の家族', { size: 58, w: 620, bg: '#c8202c', sx: 1.15 }); tFam.position.set(0.1, 1.95, -2.9); qs.add(tFam);

// ---------- 2段目. 会社（x=40）。並んで頭を下げる社員 → 家で娘とふたり ----------
const AX = 40;
{ const fl = box(12, 0.04, 8, mat('#8a8a90')); fl.position.set(AX, 0.02, -1.5); qs.add(fl);
  const wl = box(12, 4.5, 0.2, mat('#d8dce4')); wl.position.set(AX, 2.25, -4.6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const w = box(1.6, 1.8, 0.05, new THREE.MeshBasicMaterial({ color: '#9ac0e0' })); w.position.set(AX - 3 + i * 3, 2.4, -4.48); qs.add(w); }
  // 壁の設計図（家の形の線）
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(280, 200, (g, w, h) => { g.fillStyle = '#2a5a9a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8f0ff'; g.lineWidth = 5; g.beginPath(); g.moveTo(60, 170); g.lineTo(60, 90); g.lineTo(140, 30); g.lineTo(220, 90); g.lineTo(220, 170); g.closePath(); g.stroke(); g.strokeRect(120, 115, 40, 55); }) }));
  plan.position.set(AX + 4.5, 2.2, -4.45); qs.add(plan);
  // 家（右側）
  const hf = box(6, 0.04, 6, mat('#a8885a')); hf.position.set(AX + 14, 0.03, -1.5); qs.add(hf);
  const hw = box(6, 4, 0.2, mat('#e8dcc8')); hw.position.set(AX + 14, 2, -4.2); qs.add(hw);
  const tb = box(1.6, 0.06, 0.9, mat('#c8a878')); tb.position.set(AX + 14, 0.75, -2.4); qs.add(tb);
  for (const [x, z] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) { const lg = box(0.06, 0.75, 0.06, mat('#8a6a4a')); lg.position.set(AX + 14 + x, 0.37, -2.4 + z); qs.add(lg); }
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.08, 14), mat('#ffffff')); b.position.set(AX + 14 + s * 0.4, 0.82, -2.4); qs.add(b); } }
const towa2 = makePerson(TOWA); towa2.position.set(AX, 0, -1.4); qs.add(towa2);
const STAFF2 = []; for (let i = 0; i < 5; i++) { const p = makePerson({ skin: '#f1c9a5', hair: i % 2 ? '#1d1a19' : '#3a2a20', shirt: ['#3a4a6a', '#e8e8e8', '#5a5a64', '#e8e8e8', '#3a4a6a'][i], pants: '#2b3346', long: i === 1 || i === 3, tie: i % 2 === 0 }); p.position.set(AX - 2.4 + i * 1.2, 0, -3.3); qs.add(p); STAFF2.push(p); }
const towa2h = makePerson(TOWA); towa2h.position.set(AX + 13.4, -0.3, -2.0); towa2h.rotation.y = Math.PI / 2 + 0.3; towa2h.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(towa2h);
const uta2 = makePerson(UTA); uta2.position.set(AX + 14.6, -0.26, -2.0); uta2.rotation.y = -Math.PI / 2 - 0.3; uta2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(uta2);
const tBoss = tag('建設会社の、新しい社長', { size: 54, w: 700, bg: '#14161c', sx: 2.4 }); tBoss.position.set(AX, 3.0, -2.6); qs.add(tBoss);
const tDaughter = tag('娘と、ふたり暮らし', { size: 58, w: 600, bg: '#c8902c', sx: 1.8 }); tDaughter.position.set(AX + 14, 2.15, -2.8); qs.add(tDaughter);

// ---------- 3段目. 夜のレストラン（x=80）。カウンターに集まる男3人（店主・カメラマン・弁護士） ----------
const BX = 80;
{ const fl = box(12, 0.04, 9, mat('#4a3426')); fl.position.set(BX, 0.02, -1.5); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#2e3a32')); wl.position.set(BX, 2.5, -5.2); qs.add(wl);
  const ct = box(5, 1.0, 0.7, mat('#6a4a2a')); ct.position.set(BX, 0.5, -3.0); qs.add(ct);
  const top = box(5.2, 0.06, 0.8, mat('#d8c8a8')); top.position.set(BX, 1.03, -3.0); qs.add(top);
  const shelf = box(4, 0.05, 0.3, mat('#6a4a2a')); shelf.position.set(BX, 2.4, -5.0); qs.add(shelf);
  for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 10), mat(['#2a5a3a', '#6a2a2a', '#c8a050', '#2a3a5a'][i % 4])); b.position.set(BX - 1.8 + i * 0.33, 2.6, -5.0); qs.add(b); }
  for (let i = 0; i < 5; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lp.position.set(BX - 2 + i, 3.4, -3.0); qs.add(lp); const cd = box(0.01, 0.8, 0.01, mat('#1a1a1e')); cd.position.set(BX - 2 + i, 3.9, -3.0); qs.add(cd); }
  for (let i = 0; i < 2; i++) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.14, 10), new THREE.MeshStandardMaterial({ color: '#e8c0c8', transparent: true, opacity: 0.7 })); g.position.set(BX - 0.4 + i * 0.9, 1.13, -2.8); qs.add(g); } }
const P3 = MEN.map((o, i) => { const p = makePerson(o); qs.add(p); return p; });
apron(P3[0]); P3[0].position.set(BX, 0, -3.8);
P3[1].position.set(BX - 1.1, 0, -2.2); P3[1].rotation.y = 0.5; { const c = camera(); c.position.set(0, 1.55, 0.18); P3[1].add(c); const st = box(0.03, 0.6, 0.02, mat('#1a1a1e')); st.position.set(0.14, 1.3, 0.16); st.rotation.z = 0.5; P3[1].add(st); }
P3[2].position.set(BX + 1.1, 0, -2.2); P3[2].rotation.y = -0.5; { const b = bag(); b.position.set(0.32, 0.7, 0.05); P3[2].add(b); }
const tMen = tag('夜のレストランに、男たち', { size: 54, w: 720, bg: '#14161c', sx: 2.4 }); tMen.position.set(BX, 3.1, -2.6); qs.add(tMen);
const TJOB3 = [['店主', '#8a6a4a'], ['カメラマン', '#4a7a5a'], ['弁護士', '#3a4a7a']].map(([s, c], i) => { const t = tag(s, { size: 58, w: 120 + s.length * 64, bg: c, sx: (120 + s.length * 64) / 420 }); qs.add(t); return t; });

// ---------- 4段目. 夜道（x=120）。男3人それぞれに、詰め寄る女性。男は汗 ----------
const CX = 120;
{ const fl = box(14, 0.04, 9, mat('#2a2a30')); fl.position.set(CX, 0.02, -1.5); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#3a3a46')); wl.position.set(CX, 2.5, -5.0); qs.add(wl);
  for (let i = 0; i < 6; i++) { const w = box(0.8, 1.0, 0.05, new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffd890' : '#c8a060' })); w.position.set(CX - 5 + i * 2, 3.0, -4.88); qs.add(w); }
  for (const x of [-4, 4]) { const p = box(0.08, 3.4, 0.08, mat('#3a3a40')); p.position.set(CX + x, 1.7, -3.6); qs.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' })); l.position.set(CX + x, 3.45, -3.6); qs.add(l); } }
const PAIRS4 = MEN.map((o, i) => { const m = makePerson(o); if (i === 0) apron(m); const w = makePerson(WOMEN[i]); const x = CX - 1.3 + i * 1.3, z = -1.6 - i * 1.1; m.position.set(x - 0.35, 0, z); m.rotation.y = 0.9; w.position.set(x + 0.35, 0, z); m.userData.x0 = x; m.userData.z0 = z; w.rotation.y = -0.9; qs.add(m); qs.add(w);
  const sw = tag('💦', { size: 80, w: 120, h: 120, bg: 'rgba(0,0,0,0)', sx: 0.36 }); sw.position.set(x - 0.6, 2.1, z); qs.add(sw); return { m, w, sw }; });
const tKnow = tag('主人公を、よく知る3人', { size: 54, w: 700, bg: '#14161c', sx: 1.9 }); tKnow.position.set(CX, 2.75, -2.2); qs.add(tKnow);
const tSwing = tag('女性に、振り回される', { size: 58, w: 640, bg: '#c94f7c', sx: 1.8 }); tSwing.position.set(CX, 2.75, -2.2); qs.add(tSwing);

// ---------- 5段目. 夜の部屋のテレビ（x=180）。2021年・日本の連続ドラマ ----------
const TX = 180;
{ const fl = box(10, 0.04, 10, mat('#3a3028')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(10, 6, 0.2, mat('#4a4038')); wl.position.set(TX, 3, -4); qs.add(wl);
  const rack = box(3.4, 0.6, 0.6, mat('#2a2018')); rack.position.set(TX, 0.3, -3.5); qs.add(rack);
  const sofa = box(3.0, 0.5, 0.9, mat('#7a6a5a')); sofa.position.set(TX, 0.25, 1.6); qs.add(sofa); }
const TV5 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f4d8c8'); gr.addColorStop(1, '#e8a8b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c8a878'; g.fillRect(0, h - 70, w, 70);
  [[170, '#1a1420'], [320, '#3a2a1a'], [470, '#2a2a3a']].forEach(([x, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x, 150, 26, 0, 7); g.fill(); g.fillRect(x - 26, 178, 52, 112); });
  g.fillStyle = '#ff7aa8'; g.font = '900 64px sans-serif'; g.fillText('♥', 40, 90); g.fillStyle = '#f2c14e'; g.fillText('♪', 560, 90); }) }));
TV5.position.set(TX, 1.6, -3.5); qs.add(TV5);
{ const fr = box(3.36, 1.96, 0.08, mat('#121216')); fr.position.set(TX, 1.6, -3.56); qs.add(fr); }
const t2021 = tag('2021年 日本の連続ドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2021.position.set(TX, 3.3, -3.2); qs.add(t2021);
const tRom = tag('ロマンティック・コメディ', { size: 54, w: 700, bg: '#c94f7c', sx: 2.5 }); tRom.position.set(TX, 3.3, -3.2); qs.add(tRom);

// ---------- 6段目. 白い部屋（x=220）。主人公の前に、指輪が3つ → 3つともパキッ。後ろに男3人 ----------
const DX = 220;
{ const fl = box(12, 0.04, 10, mat('#e8e4dc')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#f2ece0')); wl.position.set(DX, 3, -5); qs.add(wl); }
const towa6 = makePerson(TOWA); towa6.position.set(DX, 0, -1.6); qs.add(towa6);
const MEN6 = MEN.map((o, i) => { const p = makePerson(o); if (i === 0) apron(p); p.position.set(DX - 1.5 + i * 1.5, 0, -3.4); qs.add(p); return p; });
const RINGS6 = []; for (let i = 0; i < 3; i++) { const g = new THREE.Group(); for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#e6c050', metalness: 0.7, roughness: 0.3 })); h.rotation.z = s > 0 ? 0 : Math.PI; g.add(h); g.userData[s > 0 ? 'a' : 'b'] = h; } g.position.set(DX - 0.9 + i * 0.9, 2.45, -1.2); qs.add(g); RINGS6.push(g); }
const tThree = tag('結婚3回、離婚3回', { size: 60, w: 600, bg: '#14161c', sx: 1.6 }); tThree.position.set(DX, 3.2, -1.6); qs.add(tThree);
const tEx = tag('3人とも、元夫', { size: 66, w: 520, bg: '#c8202c', sx: 2.0 }); tEx.position.set(DX, 3.3, -1.6); qs.add(tEx);
const EXN6 = MEN6.map((p, i) => { const t = tag(`元夫${i + 1}`, { size: 56, w: 300, bg: '#8a3a4a', sx: 0.75 }); t.position.set(DX - 1.5 + i * 1.5, 2.35, -3.2); qs.add(t); return t; });

// ---------- shots ----------
const ALL = [tPass, tFam, tBoss, tDaughter, tMen, ...TJOB3, tKnow, tSwing, t2021, tRom, tThree, tEx, ...EXN6, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); PAIRS4.forEach(p => p.sw.visible = false); }

function shotPC(t, quiz = 0) { // 1段目 0〜9：亡くなった母のパソコン。パスワードがわからない。知っていそうなのは、昔の家族だけ（0秒目がサムネ）
  base(); S.aim(0, -2.5); lift(0); S.hemi.intensity = 0.6; S.darken(0.45, '#0a0814');
  towa1.userData.head.rotation.x = 0.25; towa1.userData.head.rotation.z = Math.sin(t * 1.2) * 0.12;
  towa1.userData.arms.forEach((a, i) => a.rotation.x = -1.0 + Math.sin(t * 8 + i * 2) * 0.12 * (t < 4 ? 1 : 0));
  Q1.userData.pop(quiz ? 1 : (t - 0.2) / 0.3);
  if (!quiz) { tPass.userData.pop((t - 0.6) / 0.35); if (t > 4.1) tPass.visible = false; tFam.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.9, 0.7, u), lerp(1.95, 1.85, u), lerp(-0.2, -0.6, u), 0.05, 1.2, -2.45, 64);
  return qs;
}
function shotBoss(t) { // 2段目 9〜17：主人公は、建設会社の新しい社長。中学生の娘と、ふたり暮らし
  base(); lift(0);
  if (t < 4.0) { S.aim(AX, -2); S.hemi.intensity = 1.1;
    STAFF2.forEach((p, i) => { const b = clamp((t - 0.8 - i * 0.1) / 0.4) * (t < 2.6 ? 1 : clamp((3.2 - t) / 0.4)); p.rotation.x = 0; p.userData.head.rotation.x = b * 0.6; p.position.z = -3.3; p.rotation.y = 0; });
    STAFF2.forEach((p, i) => { const b = clamp((t - 0.8 - i * 0.1) / 0.4); p.children.forEach(() => {}); p.rotation.x = b * 0.45 * (t < 2.8 ? 1 : 0.4); });
    towa2.rotation.y = Math.PI; towa2.userData.head.rotation.x = 0.1; towa2.userData.arms[0].rotation.x = t > 2.0 ? -0.6 : 0;
    tBoss.userData.pop((t - 0.5) / 0.35);
    const u = ease(t / 4); look(AX + lerp(-0.3, 0.3, u), 2.0, lerp(1.4, 1.0, u), AX, 1.4, -3.2, 62);
  } else { S.aim(AX + 14, -2); S.hemi.intensity = 0.95;
    uta2.userData.head.rotation.x = 0.15 + Math.sin(t * 2) * 0.05; towa2h.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 3) * 0.2;
    tDaughter.userData.pop((t - 4.2) / 0.35);
    const u = ease((t - 4) / 4); look(AX + 14 + lerp(-0.2, 0.2, u), 1.9, lerp(2.0, 1.6, u), AX + 14, 1.0, -2.2, 62);
  }
  return qs;
}
function shotBar(t) { // 3段目 17〜25：夜のレストランに、なぜか集まる男たち。レストランの店主、カメラマン、弁護士
  base(); S.aim(BX, -2.5); lift(0); S.hemi.intensity = 0.7; S.darken(0.4, '#0a0806');
  P3[0].userData.arms[1].rotation.x = -0.6 + Math.sin(t * 2) * 0.2;
  P3[1].userData.head.rotation.y = Math.sin(t * 0.9) * 0.3; P3[2].userData.head.rotation.y = -Math.sin(t * 0.9 + 1) * 0.3;
  tMen.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMen.visible = false;
  TJOB3.forEach((tg, i) => { tg.userData.pop((t - 4.3 - i * 0.5) / 0.3); tg.position.set(P3[i].position.x, 2.35 + (i === 0 ? 0.2 : 0), P3[i].position.z + 0.3); });
  const u = ease(t / 8);
  look(BX + lerp(0.3, -0.2, u), lerp(2.2, 2.0, u), lerp(3.6, 3.1, u), BX, 1.4, -2.8, 62);
  return qs;
}
function shotNight(t) { // 4段目 25〜33：3人とも、主人公をよく知る男たち。それぞれ、別の女性に振り回されている
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.45, '#08080e');
  const sw = t > 4.2;
  PAIRS4.forEach(({ m, w, sw: s }, i) => { const k = sw ? ease(clamp((t - 4.4 - i * 0.3) / 0.6)) : 0;
    w.userData.arms[0].rotation.x = -1.2 * k + Math.sin(t * 6 + i) * 0.2 * k; w.userData.arms[1].rotation.x = -0.4 * k;
    w.position.x = m.userData.x0 + 0.35 - 0.12 * k;
    m.userData.head.rotation.z = k * Math.sin(t * 3 + i) * 0.15; m.position.x = m.userData.x0 - 0.35 - 0.1 * k; m.userData.arms[0].rotation.x = -0.5 * k;
    s.visible = k > 0.5; if (s.visible) s.userData.pop(1); s.position.y = 2.1 + Math.sin(t * 4 + i) * 0.04; });
  tKnow.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKnow.visible = false; tSwing.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.6, -0.2, u), lerp(2.2, 2.0, u), lerp(3.4, 3.0, u), CX, 1.2, -2.6, 64);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2021年に放送された、日本の連続ドラマ。新感覚の、ロマンティック・コメディ
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t2021.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2021.visible = false; tRom.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(1.6, 1.8, u), lerp(3.4, 2.8, u), TX, 1.3, -3.5, 62);
  return qs;
}
function shotRings(t) { // 6段目 42〜49（決め手）：主人公は、3回結婚して3回離婚した。集まる3人の男は、全員が元夫
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.2;
  RINGS6.forEach((g, i) => { const k = ease(clamp((t - 1.0 - i * 0.5) / 0.4)); g.userData.a.position.x = k * 0.12; g.userData.b.position.x = -k * 0.12; g.userData.a.rotation.z = -k * 0.4; g.userData.b.rotation.z = Math.PI + k * 0.4; g.rotation.y = Math.sin(t + i) * 0.3; g.visible = t < 3.4; });
  towa6.userData.head.rotation.y = t > 3.4 ? Math.sin((t - 3.4) * 1.5) * 0.6 : 0; towa6.userData.arms[0].rotation.x = t > 3.6 ? -0.8 : 0;
  MEN6.forEach((p, i) => { p.userData.arms[1].rotation.x = t > 3.6 ? -2.6 + Math.sin(t * 5 + i) * 0.2 : 0; });
  tThree.userData.pop((t - 0.3) / 0.35); if (t > 3.3) tThree.visible = false; tEx.userData.pop((t - 3.5) / 0.3);
  EXN6.forEach((x, i) => x.userData.pop((t - 3.8 - i * 0.3) / 0.3));
  const u = ease(t / 7);
  if (t < 3.4) look(DX + lerp(-0.2, 0.2, u), 2.5, lerp(2.6, 2.3, u), DX, 2.3, -1.4, 62);
  else look(DX, lerp(2.0, 2.2, ease((t - 3.4) / 3.6)), lerp(3.6, 3.2, ease((t - 3.4) / 3.6)), DX, 1.6, -2.6, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜のレストランに戻る）
  shotBar(3.0);
  ALL.forEach(x => x.visible = false);
  const k = ease(t / 7);
  look(BX, 2.0, lerp(3.2, 2.6, k), BX, 1.4, -2.8, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotPC(t, 0) },
  { a: 9, b: 17, f: shotBoss },
  { a: 17, b: 25, f: shotBar },
  { a: 25, b: 33, f: shotNight },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotRings },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '亡くなった母のパソコン。<br>パスワードがわからない。'],
  [5.6, 9.0, '知っていそうなのは、<br>昔の家族だけ。'],
  [9.2, 13.2, '主人公は、建設会社の<br>新しい社長。'],
  [13.2, 17.0, '中学生の娘と、<br>ふたり暮らし。'],
  [17.2, 21.0, '夜のレストランに、<br>なぜか集まる男たち。'],
  [21.0, 25.0, '店主に、カメラマンに、<br>弁護士。'],
  [25.2, 29.0, '3人とも、主人公を<br>よく知る男たち。'],
  [29.0, 33.0, 'それぞれ、別の女性に<br>振り回されている。'],
  [33.2, 37.4, '2021年に放送された、<br>日本の連続ドラマ。'],
  [37.4, 41.8, '新感覚の、<br>ロマンティック・コメディ。'],
  [42.2, 45.4, '主人公は、3回結婚して<br>3回離婚した。'],
  [45.4, 49.0, '集まる3人の男は、<br>全員が元夫。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、大豆田とわ子と<br>三人の元夫。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q091', v2: true, answer: '大豆田とわ子と三人の元夫',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 9191,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '大豆田とわ子と三人の元夫': 'おおまめだとわことさんにんのもとおっと', '亡くなった': 'なくなった', '母': 'はは', '知って': 'しって', '昔': 'むかし', '家族': 'かぞく', '主人公': 'しゅじんこう', '建設会社': 'けんせつがいしゃ', '新しい': 'あたらしい', '社長': 'しゃちょう', '中学生': 'ちゅうがくせい', '娘': 'むすめ', '暮らし': 'くらし', '夜': 'よる', '集まる': 'あつまる', '男たち': 'おとこたち', '店主': 'てんしゅ', '弁護士': 'べんごし', '3人': 'さんにん', '別の': 'べつの', '女性': 'じょせい', '振り回されて': 'ふりまわされて', '2021年': 'にせんにじゅういちねん', '放送': 'ほうそう', '日本': 'にほん', '連続': 'れんぞく', '新感覚': 'しんかんかく', '3回': 'さんかい', '結婚': 'けっこん', '離婚': 'りこん', '男': 'おとこ', '全員': 'ぜんいん', '元夫': 'もとおっと', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n亡くなった母のパソコン。パスワードがわからない。主人公は、建設会社の新しい社長。中学生の娘と、ふたり暮らし。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'PrimeVideo', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: '大豆田とわ子と<br>三人の元夫', info: 'FOD・Prime Video｜日本のドラマ・全10話', answerSize: 96 });
