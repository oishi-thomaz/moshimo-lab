import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #109 太陽の末裔 Love Under The Sun（ドラマ・韓国・2016年・KBS2。U-NEXT で見放題、
//   U-NEXT の作品ページ video.unext.jp/title/SID0028118（見放題の札）と Filmarks の動画配信欄（U-NEXT 見放題）で2026/11/19確認。
//   Filmarks 4.4・レビュー32,986件 filmarks.com/dramas/768/1871）
// 確かめた事実（Filmarks のあらすじ filmarks.com/dramas/768/1871、Wikipedia 日本語版 太陽の末裔 の 冒頭・あらすじ・出演。2026/11/19）：
//   ・休暇中の軍人ふたりが、バイクの窃盗犯を捕まえる。そのとき仲間の携帯電話が盗まれてしまう（Wikipedia・Filmarks）
//   ・窃盗犯を追って病院へ。治療にあたっていた外科医に一目惚れするが、窃盗犯の仲間（Filmarks ではヤクザ）と勘違いされ、冷たくされる（Wikipedia・Filmarks）
//   ・誤解を解いてデートに誘い、2人は急接近するが、突然の任務などですれ違い、短い恋は終わる（Wikipedia）
//   ・8か月後、医師は医療奉仕団のリーダーとして紛争地帯へ。空港で軍人と再会する。彼は現地の中隊長として派兵され、医療奉仕団の警護を任されていた（Wikipedia）
//   ・2016年に韓国の KBS2 で放送。中国の動画配信サイト iQiyi での視聴回数は24億回を突破（Wikipedia）。出演 ソン・ジュンギ、ソン・ヘギョ（Wikipedia）
// 構成（ヒント6段）：1 休みの日に泥棒を捕まえた・でも仲間のスマホを盗まれた → 2 追いかけた病院で外科医にひと目ぼれ・泥棒の仲間と勘違いされる
//   → 3 デートの途中で突然の任務・短い恋は終わった → 4 8か月後、医療チームを率いて紛争地帯へ・空港で待っていたのはあの軍人
//   → 5 2016年の韓国ドラマ・中国の配信サイトで再生24億回 → 6 決め手：主演はソン・ジュンギとソン・ヘギョ・タイトルに「太陽」
// その後の2人・事件・結末は言わない。登場人物の名前・現地の国名・地名は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図（敬礼・車の中の場面など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#a8c4dc', floor: '#8a8a86', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(10910);

const SOL = { skin: '#e8b98f', hair: '#1a1410', shirt: '#4a5a3a', pants: '#2e3440' };
const SOL2 = { skin: '#f1c9a5', hair: '#2a2420', shirt: '#2a3a4a', pants: '#3a3a40' };
const DOC = { skin: '#f4d3b5', hair: '#3a2a20', shirt: '#f4f4f0', pants: '#5a7aa0', long: true };
const NURSE = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#9ad0c8', pants: '#9ad0c8' };
const THIEF = { skin: '#e8c4a0', hair: '#c8a050', shirt: '#c83a3a', pants: '#2a2a2e' };
const CAMO = { skin: '#e8b98f', hair: '#1a1410', shirt: '#7a7a4a', pants: '#6a6a3e' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function heart(c = '#ff5a7a') { const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35); sh.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
  return new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, depthTest: false })); }
function phone() { const g = new THREE.Group(); g.add(box(0.1, 0.18, 0.02, mat('#1a1a1e'))); const s = box(0.085, 0.15, 0.005, gl('#7ac8ff')); s.position.z = 0.012; g.add(s); return g; }
function moto(c = '#2a2a30') { const g = new THREE.Group();
  for (const z of [-0.55, 0.55]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 18), mat('#1a1a1a')); w.rotation.y = Math.PI / 2; w.position.set(0, 0.32, z); g.add(w); }
  const b = box(0.24, 0.3, 1.0, mat(c)); b.position.y = 0.6; g.add(b); const st = box(0.26, 0.08, 0.5, mat('#1a1a1e')); st.position.set(0, 0.78, -0.15); g.add(st);
  const hb = box(0.7, 0.05, 0.05, mat('#8a8a90')); hb.position.set(0, 1.0, 0.45); g.add(hb); return g; }

// ---------- 1段目. 昼の街角（x=0）。休みの日の軍人ふたりが、倒れたバイクの泥棒を押さえる。その横でスマホが持ち去られる ----------
{ const rd = box(16, 0.04, 6, mat('#5a5a5e')); rd.position.set(0, 0.02, -2); qs.add(rd);
  const sw = box(16, 0.16, 2.6, mat('#b8b0a4')); sw.position.set(0, 0.08, -6.2); qs.add(sw);
  for (let i = 0; i < 5; i++) { const sh = box(3.0, 4.2, 1.2, mat(['#d8c8b0', '#c8d0d8', '#e0d0c0', '#b8c8c0', '#d8c0c0'][i])); sh.position.set(-6.4 + i * 3.2, 2.1, -8.2); qs.add(sh);
    const wn = box(2.2, 1.3, 0.05, gl(['#f0e0b0', '#a8c8e0'][i % 2])); wn.position.set(-6.4 + i * 3.2, 1.0, -7.58); qs.add(wn);
    const aw = box(2.8, 0.12, 0.8, mat(['#c84a3a', '#3a7ab0', '#e0b040', '#4a9a6a', '#8a5aa0'][i])); aw.position.set(-6.4 + i * 3.2, 2.0, -7.3); aw.rotation.x = 0.3; qs.add(aw); }
  for (let i = 0; i < 8; i++) { const l = box(0.8, 0.01, 0.12, mat('#e8e4d8')); l.position.set(-7 + i * 2, 0.045, -2); qs.add(l); } }
const MOTO1 = moto('#3a6ab0'); MOTO1.position.set(1.6, 0, -3.0); MOTO1.rotation.set(0, 0.4, Math.PI / 2 - 0.12); MOTO1.position.y = 0.3; qs.add(MOTO1);
const thief1 = makePerson(THIEF); thief1.position.set(0.1, 0.2, -3.1); qs.add(thief1);
const sol1 = makePerson(SOL); sol1.position.set(-0.4, 0, -2.5); qs.add(sol1);
const sol1b = makePerson(SOL2); sol1b.position.set(-1.4, 0, -2.9); qs.add(sol1b);
const runner1 = makePerson({ ...THIEF, shirt: '#3a3a3a', hair: '#1a1410', scale: 0.92 }); runner1.position.set(-1.2, 0, -4.2); qs.add(runner1);
const PH1 = phone(); PH1.scale.setScalar(1.8); qs.add(PH1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tCatch = tag('休みの日、泥棒を捕まえた', { size: 52, w: 760, bg: '#14161c', sx: 2.1 }); tCatch.position.set(-0.3, 2.3, -3.4); qs.add(tCatch);
const tStolen = tag('でも、スマホを盗まれた', { size: 54, w: 700, bg: '#c8202c', sx: 2.0 }); tStolen.position.set(-0.3, 2.3, -3.4); qs.add(tStolen);

// ---------- 2段目. 病院の救急外来（x=50）。ベッドとカーテン。白衣の外科医に、軍人がひと目ぼれ ----------
const AX = 50;
{ const fl = box(12, 0.04, 9, mat('#d8dcd8')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 3.8, 0.2, mat('#e8eef0')); wl.position.set(AX, 1.9, -5.5); qs.add(wl);
  const stripe = box(12, 0.12, 0.05, mat('#4aa8a0')); stripe.position.set(AX, 1.1, -5.38); qs.add(stripe);
  for (let i = 0; i < 3; i++) { const bx = AX - 3.6 + i * 3.6;
    const bed = box(1.0, 0.5, 2.0, mat('#f4f4f4')); bed.position.set(bx, 0.55, -4.0); qs.add(bed); const fr = box(1.05, 0.3, 2.05, mat('#8a9aa8')); fr.position.set(bx, 0.2, -4.0); qs.add(fr);
    const pl = box(0.5, 0.12, 0.35, mat('#ffffff')); pl.position.set(bx, 0.86, -4.75); qs.add(pl);
    if (i !== 1) { const cu = box(0.04, 2.4, 2.2, gl('#a8d8d0', 0.85)); cu.position.set(bx + 1.6, 1.4, -4.0); qs.add(cu); } }
  for (let i = 0; i < 3; i++) { const l = box(1.4, 0.05, 0.3, gl('#ffffff')); l.position.set(AX - 3.6 + i * 3.6, 3.7, -2.5); qs.add(l); } }
const doc2 = makePerson(DOC); doc2.position.set(AX + 0.6, 0, -3.0); qs.add(doc2);
const COAT2 = box(0.56, 0.9, 0.32, mat('#ffffff')); COAT2.position.y = 1.0; doc2.add(COAT2);
const STETH2 = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 6, 16, Math.PI), mat('#2a3a4a')); STETH2.position.set(0, 1.38, 0.17); STETH2.rotation.z = Math.PI; doc2.add(STETH2);
const pat2 = makePerson({ ...THIEF, scale: 0.95 }); pat2.position.set(AX - 0.2, 0.82, -4.0); pat2.rotation.x = -Math.PI / 2; qs.add(pat2);
const sol2 = makePerson(SOL); sol2.position.set(AX - 1.6, 0, -1.6); qs.add(sol2);
const H2 = heart(); H2.renderOrder = 9; qs.add(H2);
const tLove = tag('病院で、ひと目ぼれ', { size: 56, w: 600, bg: '#d84a6a', sx: 2.0 }); tLove.position.set(AX - 0.4, 2.9, -3.2); qs.add(tLove);
const tWrongG = tag('泥棒の仲間と、勘違い', { size: 54, w: 660, bg: '#14161c', sx: 2.1 }); tWrongG.position.set(AX - 0.4, 2.9, -3.2); qs.add(tWrongG);

// ---------- 3段目. 夕方のカフェ（x=100）。テーブルの2人。鳴りだすスマホ、席を立つ軍人 ----------
const BX = 100;
{ const fl = box(10, 0.04, 8, mat('#a8885a')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#e8d8c0')); wl.position.set(BX, 2, -5); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f0a868'); gr.addColorStop(1, '#f8d8a0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8885a'; for (let i = 0; i < 8; i++) g.fillRect(i * 34, 70 - (i % 3) * 14, 26, 60); }) })); win.position.set(BX, 2.2, -4.88); qs.add(win);
  for (let i = 0; i < 5; i++) { const f = box(0.06, 2.2, 0.06, mat('#5a3a2a')); f.position.set(BX - 2.2 + i * 1.1, 2.2, -4.84); qs.add(f); }
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 24), mat('#f4ece0')); tb.position.set(BX, 0.75, -2.6); qs.add(tb);
  const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8), mat('#3a3a3a')); lg.position.set(BX, 0.37, -2.6); qs.add(lg);
  for (const x of [-0.2, 0.22]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 12), mat('#ffffff')); c.position.set(BX + x, 0.84, -2.6); qs.add(c); }
  for (const x of [-1.0, 1.0]) { const ch = box(0.5, 0.06, 0.5, mat('#5a3a2a')); ch.position.set(BX + x, 0.48, -2.6); qs.add(ch); const bk = box(0.5, 0.6, 0.06, mat('#5a3a2a')); bk.position.set(BX + x * 1.22, 0.8, -2.6); bk.rotation.y = Math.PI / 2; qs.add(bk); } }
const sol3 = makePerson(SOL2); sol3.position.set(BX - 0.85, 0, -2.6); sol3.rotation.y = Math.PI / 2; qs.add(sol3);
const doc3 = makePerson({ ...DOC, shirt: '#e8a0a8' }); doc3.position.set(BX + 0.85, 0, -2.6); doc3.rotation.y = -Math.PI / 2; qs.add(doc3);
const PH3 = phone(); PH3.rotation.x = -Math.PI / 2; PH3.position.set(BX - 0.35, 0.79, -2.45); qs.add(PH3);
const RING3 = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.14, 24), gl('#7ac8ff', 0.8)); r.rotation.x = -Math.PI / 2; r.position.set(BX - 0.35, 0.8, -2.45); qs.add(r); RING3.push(r); }
const tDate = tag('デートの途中で…', { size: 58, w: 540, bg: '#14161c', sx: 1.8 }); tDate.position.set(BX, 2.25, -3.3); qs.add(tDate);
const tMission = tag('突然の任務', { size: 66, w: 440, bg: '#c8202c', sx: 1.5 }); tMission.position.set(BX, 2.25, -3.3); qs.add(tMission);

// ---------- 4段目. 砂ぼこりの空港（x=150）。輸送機、医療チームの3人、迎えに立つ迷彩服の軍人 ----------
const CX = 150;
{ const gr = box(40, 0.04, 30, mat('#d8c098')); gr.position.set(CX, 0.02, -8); qs.add(gr);
  const rw = box(6, 0.05, 30, mat('#8a8478')); rw.position.set(CX + 4, 0.03, -10); qs.add(rw);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(140, 50), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6aa0d8'); gr.addColorStop(1, '#f0dcb0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
  sky.position.set(CX, 12, -45); qs.add(sky);
  for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.ConeGeometry(6 + i * 2, 3 + i, 4), mat('#c8a878')); h.position.set(CX - 20 + i * 14, 1.2, -36); qs.add(h); } }
const PLANE4 = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 12, 16), mat('#8a9078')); b.rotation.x = Math.PI / 2; b.position.y = 2.2; PLANE4.add(b);
  const wg = box(18, 0.2, 2.4, mat('#7a8068')); wg.position.set(0, 3.4, -1); PLANE4.add(wg);
  const tl = box(0.2, 2.6, 2.0, mat('#7a8068')); tl.position.set(0, 4.2, -5.6); PLANE4.add(tl);
  const rp = box(2.0, 0.12, 2.6, mat('#5a6050')); rp.position.set(0, 0.6, 6.9); rp.rotation.x = -0.45; PLANE4.add(rp);
  for (const x of [-5, 5]) { const en = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 12), mat('#5a6050')); en.rotation.x = Math.PI / 2; en.position.set(x, 3.0, 0); PLANE4.add(en); } }
PLANE4.position.set(CX + 4, 0, -14); qs.add(PLANE4);
const TEAM4 = [DOC, NURSE, { ...NURSE, skin: '#e8b98f', hair: '#4a3020' }].map((c, i) => { const p = makePerson(c); if (i === 0) { const ct = box(0.56, 0.9, 0.32, mat('#ffffff')); ct.position.y = 1.0; p.add(ct); } p.position.set(CX + 3.2 + i * 0.8, 0, -6.5); qs.add(p); return p; });
const BAG4 = TEAM4.map((p, i) => { const b = box(0.4, 0.3, 0.25, mat(i ? '#2a6ab0' : '#c83a3a')); b.position.set(0.32, 0.75, 0.05); p.add(b); return b; });
const CROSS4 = new THREE.Group(); { const a = box(0.2, 0.06, 0.02, gl('#ffffff')); const b2 = box(0.06, 0.2, 0.02, gl('#ffffff')); CROSS4.add(a, b2); } CROSS4.position.set(0, 0, 0.14); BAG4[0].add(CROSS4);
const sol4 = makePerson(CAMO); sol4.position.set(CX - 0.4, 0, -4.0); qs.add(sol4);
const CAP4 = box(0.46, 0.12, 0.5, mat('#6a6a3e')); CAP4.position.set(0, 0.56, 0.04); sol4.userData.head.add(CAP4);
const JEEP4 = new THREE.Group(); { const b = box(1.6, 0.8, 2.8, mat('#6a6a3e')); b.position.y = 0.8; JEEP4.add(b); const c = box(1.5, 0.6, 1.2, mat('#5a5a34')); c.position.set(0, 1.5, -0.4); JEEP4.add(c);
  for (const [x, z] of [[-0.8, -0.9], [0.8, -0.9], [-0.8, 0.9], [0.8, 0.9]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 14), mat('#1a1a1a')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.35, z); JEEP4.add(w); } }
JEEP4.position.set(CX - 2.4, 0, -5.0); JEEP4.rotation.y = 0.4; qs.add(JEEP4);
const DUST4 = []; for (let i = 0; i < 24; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.08 + R() * 0.08, 6, 4), gl('#e8d8b8', 0.5)); d.userData.p = [R() * 12 - 6, R() * 2, -2 - R() * 8, R()]; qs.add(d); DUST4.push(d); }
const tFar = tag('8か月後、遠い紛争地帯へ', { size: 52, w: 740, bg: '#14161c', sx: 2.6 }); tFar.position.set(CX + 1.4, 3.2, -5.4); qs.add(tFar);
const tAgain = tag('空港で、まさかの再会', { size: 54, w: 660, bg: '#d84a6a', sx: 2.4 }); tAgain.position.set(CX + 1.4, 3.2, -5.4); qs.add(tAgain);

// ---------- 5段目. 夜のリビング（x=200）。テレビに、砂漠に昇る太陽。数字のバーが伸びる ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a3440')); wl.position.set(TX, 3, -4.5); qs.add(wl);
  const sofa = box(3.6, 0.7, 1.0, mat('#7a5a6a')); sofa.position.set(TX, 0.35, 2.6); qs.add(sofa); const sb = box(3.6, 0.8, 0.3, mat('#6a4a5a')); sb.position.set(TX, 0.9, 3.0); qs.add(sb);
  const st = box(4.2, 0.6, 0.8, mat('#2a2228')); st.position.set(TX, 0.3, -4.0); qs.add(st);
  const fr = box(5.8, 3.4, 0.16, mat('#101014')); fr.position.set(TX, 2.4, -4.3); qs.add(fr); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.1), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f08848'); gr.addColorStop(0.6, '#f8c878'); gr.addColorStop(1, '#c89058'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(320, 230, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#b07848'; g.beginPath(); g.moveTo(0, 270); g.quadraticCurveTo(160, 220, 330, 268); g.quadraticCurveTo(480, 300, 640, 250); g.lineTo(640, 360); g.lineTo(0, 360); g.fill();
  g.fillStyle = '#8a5a38'; g.beginPath(); g.moveTo(0, 320); g.quadraticCurveTo(300, 280, 640, 330); g.lineTo(640, 360); g.lineTo(0, 360); g.fill(); }) }));
SCR5.position.set(TX, 2.4, -4.2); qs.add(SCR5);
const BARS5 = []; for (let i = 0; i < 6; i++) { const b = box(0.32, 1, 0.32, gl(['#e6b450', '#f08848', '#e6b450', '#f08848', '#e6b450', '#ffd890'][i])); b.position.set(TX - 1.6 + i * 0.64, 0, -2.4); qs.add(b); BARS5.push(b); }
const t2016 = tag('2016年の、韓国ドラマ', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.6 }); t2016.position.set(TX, 4.9, -4.0); qs.add(t2016);
const tViews = tag('再生、24億回', { size: 66, w: 480, bg: '#c8202c', sx: 3.0 }); tViews.position.set(TX, 4.9, -4.0); qs.add(tViews);

// ---------- 6段目. 夕暮れの砂漠（x=250）。大きな太陽を背に、迷彩服の軍人と白衣の外科医が向かい合う ----------
const DX = 250;
{ const gr = box(60, 0.04, 40, mat('#c89060')); gr.position.set(DX, 0.02, -10); qs.add(gr);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a4a7a'); gr.addColorStop(0.55, '#f08848'); gr.addColorStop(1, '#f8d090'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
  sky.position.set(DX, 14, -50); qs.add(sky);
  for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(6 + i * 1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b87848')); d.scale.y = 0.25; d.position.set(DX - 24 + i * 12, 0, -30 - (i % 2) * 6); qs.add(d); } }
const SUN6 = new THREE.Mesh(new THREE.CircleGeometry(4.5, 40), new THREE.MeshBasicMaterial({ color: '#fff0b8', fog: false })); SUN6.position.set(DX, 5, -46); qs.add(SUN6);
const GLOW6 = new THREE.Mesh(new THREE.CircleGeometry(7, 40), new THREE.MeshBasicMaterial({ color: '#ffd080', transparent: true, opacity: 0.35, fog: false })); GLOW6.position.set(DX, 5, -46.2); qs.add(GLOW6);
const sol6 = makePerson(CAMO); sol6.position.set(DX - 0.7, 0, -4.0); sol6.rotation.y = 1.2; qs.add(sol6);
const CAP6 = box(0.46, 0.12, 0.5, mat('#6a6a3e')); CAP6.position.set(0, 0.56, 0.04); sol6.userData.head.add(CAP6);
const doc6 = makePerson(DOC); doc6.position.set(DX + 0.7, 0, -4.0); doc6.rotation.y = -1.2; qs.add(doc6);
const COAT6 = box(0.56, 0.9, 0.32, mat('#ffffff')); COAT6.position.y = 1.0; doc6.add(COAT6);
const tPair = tag('軍人 × 外科医の恋', { size: 56, w: 620, bg: '#14161c', sx: 2.3 }); tPair.position.set(DX, 3.0, -4.6); qs.add(tPair);
const tSun = tag('タイトルに「太陽」', { size: 58, w: 600, bg: '#e6b450', color: '#14161c', sx: 2.3 }); tSun.position.set(DX, 3.0, -4.6); qs.add(tSun);

// ---------- shots ----------
const ALL = [tCatch, tStolen, tLove, tWrongG, tDate, tMission, tFar, tAgain, t2016, tViews, tPair, tSun, Q1, H2];
function base() { S.reset(); ALL.forEach(x => x.visible = false); DUST4.forEach(d => d.visible = false); RING3.forEach(r => r.visible = false); }

function shotCatch(t, quiz = 0) { // 1段目 0〜9：休みの日、軍人ふたりがバイク泥棒を押さえる。そのすきに、スマホが持ち去られる（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.25;
  thief1.rotation.set(0, 0.2, Math.PI / 2); thief1.position.set(0.9, 0.2, -3.2); thief1.userData.arms.forEach(a => a.rotation.x = -2.8); thief1.userData.legs.forEach((l, i) => l.rotation.x = i ? 0.3 : -0.2);
  sol1.rotation.y = 0.9; sol1.userData.legs[0].rotation.x = -1.2; sol1.position.y = -0.25; sol1.userData.arms.forEach(a => a.rotation.x = -1.2);
  sol1b.rotation.y = 0.8; sol1b.userData.arms[1].rotation.x = -0.8;
  const k = quiz ? 0 : clamp((t - 4.4) / 2.6);
  // 走り去る人の手の中にスマホ（最初は地面に落ちている）
  runner1.visible = quiz ? false : t > 3.6; runner1.rotation.y = -1.7; runner1.position.set(lerp(-0.2, -5.5, ease(k)), 0, lerp(-2.2, -4.0, k)); poseWalk(runner1, t * 11, k > 0 && k < 1 ? 1 : 0);
  if (!quiz && t > 4.4) { PH1.position.set(runner1.position.x - 0.1, 0.95, runner1.position.z + 0.3); PH1.rotation.set(0, -1.7, 0); }
  else { PH1.position.set(0.15, 0.03, -2.0); PH1.rotation.set(-Math.PI / 2, 0, 0.4); }
  sol1b.userData.head.rotation.y = !quiz && t > 5.0 ? 0.9 : 0; sol1b.userData.arms[0].rotation.x = !quiz && t > 5.4 ? -1.6 : 0;
  Q1.position.set(0.3, 0.75, -2.0); Q1.userData.pop(quiz ? 1 : 1 - 0 * t); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tCatch.userData.pop((t - 1.6) / 0.35); if (t > 4.4) tCatch.visible = false; tStolen.userData.pop((t - 4.7) / 0.35); }
  const u = ease(t / 9); const pan = quiz ? 0 : ease(clamp((t - 4.6) / 2.6));
  tCatch.position.x = tStolen.position.x = -0.3 - pan * 1.4;
  look(lerp(1.0, 0.6, u) - pan * 1.6, lerp(3.4, 3.2, u), lerp(2.4, 1.8, u) + pan * 0.6, 0.0 - pan * 1.6, 0.2, -3.2, 60);
  return qs;
}
function shotHospital(t) { // 2段目 9〜17：泥棒を追って病院へ。治療中の外科医にひと目ぼれ。でも泥棒の仲間と勘違いされる
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.35;
  doc2.rotation.y = t < 4 ? -0.6 : 0.6; doc2.userData.arms[1].rotation.x = t < 4 ? -0.9 : 0; doc2.userData.arms[0].rotation.x = t < 4 ? -0.6 : 0;
  doc2.userData.arms.forEach((a, i) => a.rotation.z = t > 4.2 ? (i ? -0.5 : 0.5) : 0); if (t > 4.2) doc2.userData.arms.forEach(a => a.rotation.x = -0.5);
  sol2.rotation.y = 0.75; sol2.userData.head.rotation.x = Math.sin(t * 2) * 0.03;
  const hk = clamp((t - 1.0) / 0.5); H2.visible = t > 1.0 && t < 4.2; H2.scale.setScalar(0.4 * ease(hk) * (1 + Math.sin(t * 8) * 0.08)); H2.position.set(AX - 1.05, 2.2, -1.6);
  sol2.userData.arms[1].rotation.x = t > 4.4 ? -1.2 : 0; sol2.userData.arms[1].rotation.z = t > 4.4 ? -0.4 : 0;
  tLove.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tLove.visible = false; tWrongG.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-2.6, -2.2, u), lerp(2.0, 1.9, u), lerp(1.8, 1.0, u), AX - 0.2, 1.3, -3.0, 60);
  return qs;
}
function shotCafe(t) { // 3段目 17〜25：誤解がとけてデートへ。でも途中で突然の任務。短い恋は終わった
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.15; S.darken(0.15, '#f0a868');
  [sol3, doc3].forEach(p => { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = -0.38; });
  doc3.userData.arms[0].rotation.x = -0.9 - Math.abs(Math.sin(t * 2)) * 0.2;
  const ring = t > 3.2; RING3.forEach((r, i) => { const k = ((t * 1.4 + i / 3) % 1); r.visible = ring && t < 6.2; r.scale.setScalar(1 + k * 2.5); r.material.opacity = 0.8 * (1 - k); });
  PH3.position.y = 0.79 + (ring && t < 6.2 ? Math.abs(Math.sin(t * 40)) * 0.01 : 0);
  const up = ease(clamp((t - 5.0) / 0.8)); sol3.position.y = lerp(-0.38, 0, up); sol3.userData.legs.forEach(l => l.rotation.x = lerp(-1.5, 0, up));
  const go = ease(clamp((t - 6.0) / 1.6)); sol3.rotation.y = lerp(Math.PI / 2, Math.PI * 0.9, clamp((t - 5.6) / 0.5)); sol3.position.x = BX - 0.85 - go * 1.6; sol3.position.z = -2.6 + go * 1.6; poseWalk(sol3, t * 7, go > 0 && go < 1 ? 0.8 : 0);
  doc3.userData.head.rotation.y = t > 6 ? -0.4 : 0;
  tDate.userData.pop((t - 0.5) / 0.35); if (t > 3.2) tDate.visible = false; tMission.userData.pop((t - 3.4) / 0.3);
  const u = ease(t / 8);
  look(BX + lerp(0.2, 0.0, u), lerp(2.0, 2.0, u), lerp(1.9, 1.3, u), BX, 1.1, -2.7, 58);
  return qs;
}
function shotAirport(t) { // 4段目 25〜33：8か月後、医療チームのリーダーとして紛争地帯へ。空港で待っていたのは、あの軍人
  base(); S.aim(CX, -6); lift(0); S.hemi.intensity = 1.4; S.darken(0.12, '#f0dcb0');
  TEAM4.forEach((p, i) => { const w = ease(clamp((t - 0.6 - i * 0.2) / 3.0)); p.position.z = lerp(-8.0, -5.2, w) - i * 0.2; p.position.x = CX + 2.6 + i * 0.75 - w * 0.8; p.rotation.y = lerp(0, -0.5, clamp((t - 4.0) / 0.6)); poseWalk(p, t * 6 + i, w > 0 && w < 1 ? 0.6 : 0); });
  sol4.rotation.y = 0.7; sol4.userData.arms[1].rotation.x = t > 4.6 ? -2.4 + Math.sin(t * 6) * 0.15 : 0;
  DUST4.forEach((d, i) => { d.visible = true; const p = d.userData.p; const k = (t * 0.15 + p[3]) % 1; d.position.set(CX + p[0] + k * 4, 0.2 + p[1] * 0.5, p[2]); d.material.opacity = 0.5 * Math.sin(k * Math.PI); });
  tFar.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tFar.visible = false; tAgain.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(2.4, 1.0, u), lerp(2.4, 1.9, u), lerp(2.2, 0.6, u), CX + lerp(2.2, 0.8, u), 1.6, -6.0, 62);
  return qs;
}
function shotTv(t) { // 5段目 33〜42：2016年の韓国ドラマ。中国の配信サイトで再生24億回
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.6, '#08060a');
  BARS5.forEach((b, i) => { const h = 0.2 + ease(clamp((t - 4.4 - i * 0.12) / 0.8)) * (0.6 + i * 0.32); b.scale.y = h; b.position.y = h / 2; });
  t2016.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2016.visible = false; tViews.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.9, u), lerp(5.6, 4.6, u), TX, 3.0, -4.2, 66);
  return qs;
}
function shotDesert(t) { // 6段目 42〜49（決め手）：主演はソン・ジュンギとソン・ヘギョ。タイトルに「太陽」
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 1.0; S.darken(0.25, '#f08848');
  const s = 1 + Math.sin(t * 1.5) * 0.02; SUN6.scale.setScalar(s); GLOW6.scale.setScalar(s * (1 + Math.sin(t * 2) * 0.04));
  doc6.userData.arms[0].rotation.x = t > 3.6 ? -0.5 : 0;
  if (t < 3.6) tPair.userData.pop((t - 0.3) / 0.35); else tSun.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.4, 0.0, u), lerp(1.6, 1.4, u), lerp(3.2, 2.2, u), DX, 2.4, -12, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（昼の街角に戻る）
  shotCatch(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotCatch(t, 0) },
  { a: 9, b: 17, f: shotHospital },
  { a: 17, b: 25, f: shotCafe },
  { a: 25, b: 33, f: shotAirport },
  { a: 33, b: 42, f: shotTv },
  { a: 42, b: 49, f: shotDesert },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '休みの日の、軍人ふたり。<br>バイク泥棒を捕まえた。'],
  [5.6, 9.0, 'ところが、仲間のスマホを<br>盗まれてしまう。'],
  [9.2, 13.2, '追いかけた病院で、<br>外科医にひと目ぼれ。'],
  [13.2, 17.0, 'でも、泥棒の仲間だと<br>勘違いされてしまう。'],
  [17.2, 21.0, '誤解がとけて、<br>やっとデートへ。'],
  [21.0, 25.0, 'でも、突然の任務で<br>短い恋は終わった。'],
  [25.2, 29.0, '8か月後。医療チームを<br>率いて、遠い紛争地帯へ。'],
  [29.0, 33.0, '空港で待っていたのは、<br>あの軍人だった。'],
  [33.2, 37.4, '2016年に放送された、<br>韓国のドラマ。'],
  [37.4, 41.8, '中国の配信サイトで、<br>再生24億回を突破。'],
  [42.2, 45.4, '主演は、ソン・ジュンギと<br>ソン・ヘギョ。'],
  [45.4, 49.0, 'タイトルには、<br>「太陽」の文字。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>太陽の末裔。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q109', v2: true, answer: '太陽の末裔 Love Under The Sun',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 10910,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.4, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '太陽の末裔': 'たいようのまつえい', '休み': 'やすみ', '日': 'ひ', '軍人': 'ぐんじん', '泥棒': 'どろぼう', '捕まえた': 'つかまえた', '仲間': 'なかま', '盗まれて': 'ぬすまれて', '追いかけた': 'おいかけた', '病院': 'びょういん', '外科医': 'げかい', '目ぼれ': 'めぼれ', '勘違い': 'かんちがい', '誤解': 'ごかい', '突然': 'とつぜん', '任務': 'にんむ', '短い': 'みじかい', '恋': 'こい', '終わった': 'おわった', '8か月後': 'はちかげつご', '医療': 'いりょう', '率いて': 'ひきいて', '遠い': 'とおい', '紛争地帯': 'ふんそうちたい', '空港': 'くうこう', '待っていた': 'まっていた', '2016年': 'にせんじゅうろくねん', '放送': 'ほうそう', '韓国': 'かんこく', '中国': 'ちゅうごく', '配信': 'はいしん', '再生24億回': 'さいせいにじゅうよんおくかい', '突破': 'とっぱ', '主演': 'しゅえん', '文字': 'もじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n休みの日の、軍人ふたり。バイク泥棒を捕まえた。ところが、仲間のスマホを盗まれてしまう。追いかけた病院で、外科医にひと目ぼれ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', '韓国ドラマ', 'ドラマ好き', 'ラブストーリー'],
  },
});
applyQuizCards({ answer: '太陽の末裔<br><span style="font-size:58px">Love Under The Sun</span>', info: 'U-NEXT｜韓国ドラマ', answerSize: 128 });
