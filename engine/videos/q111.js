import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #111 ライオンの隠れ家（ドラマ・日本・2024年・TBS 金曜ドラマ・全11話。Netflix・Hulu ほかで見放題、
//   Netflix の作品ページ netflix.com/jp/title/81927743 と Filmarks の動画配信欄（Prime Video・U-NEXT・Lemino・Hulu・Netflix 見放題）で2026/11/19確認。
//   Filmarks 4.2・レビュー32,882件 filmarks.com/dramas/15464/20947）
// 確かめた事実（Wikipedia 日本語版 ライオンの隠れ家 の あらすじ・出演者・放送、Netflix の作品紹介。2026/11/19）：
//   ・市役所で働く兄は、両親を事故で亡くしてから、弟と2人で暮らしている（Wikipedia）
//   ・弟は画家（Netflix の紹介文）。兄は弟の毎日の決まった流れ（ルーティーン）に合わせて送り迎えをしてから出勤する生活を何年も続けていた（Wikipedia）
//   ・ある日、謎の少年が突然ふたりの前に現れる（Netflix）。少年は「ライオン」と名乗る（Wikipedia）
//   ・兄は一晩だけ預かるつもりだったが、やがて3人で暮らすことを決める（Wikipedia）
//   ・2024年10月11日〜12月20日、TBS系 金曜ドラマ、全11回。出演 柳楽優弥ほか（Wikipedia）
// 構成（ヒント6段）：1 静かに暮らす兄弟の前に、突然あらわれた男の子 → 2 主人公は市役所で働く兄・両親を亡くし弟とふたり暮らし
//   → 3 弟は絵が得意な画家・毎日同じ順番の決まった暮らし → 4 一晩だけ預かるつもりが・3人で暮らすことに
//   → 5 2024年の金曜ドラマ全11話・主演は柳楽優弥 → 6 決め手：男の子が名乗ったのは、百獣の王の名前
// 男の子の正体・事件・結末は言わない。登場人物の名前・地名は出さない（弟の特性の名前も出さない）。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。人は汎用の3D
const S = quizStage({ bg: '#1c2230', floor: '#3a3a40', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(11110);

const BRO = { skin: '#e8b98f', hair: '#1a1410', shirt: '#f0f0f0', pants: '#2a3040', tie: true };
const BRO_H = { skin: '#e8b98f', hair: '#1a1410', shirt: '#7a8a9a', pants: '#2a3040' };
const YOU = { skin: '#f1c9a5', hair: '#2a2420', shirt: '#e8c050', pants: '#4a5a7a' };
const KID = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#d8503a', pants: '#3a4a6a', scale: 0.6 };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function painting(w, h, draw) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(256, Math.round(256 * h / w), draw) })); }
function easel(x, z) { const g = new THREE.Group(); for (const s of [-1, 1]) { const l = box(0.06, 2.0, 0.06, mat('#8a6a48')); l.position.set(s * 0.45, 1.0, 0); l.rotation.z = s * 0.12; g.add(l); }
  const bl = box(0.06, 1.9, 0.06, mat('#8a6a48')); bl.position.set(0, 0.95, -0.4); bl.rotation.x = 0.25; g.add(bl); const sh = box(1.0, 0.05, 0.12, mat('#8a6a48')); sh.position.set(0, 0.9, 0.04); g.add(sh);
  g.position.set(x, 0, z); qs.add(g); return g; }

// ---------- 1段目. 夜の小さな家の玄関（x=0）。門の前に、リュックを背負った小さな男の子 ----------
{ const gr = box(20, 0.04, 14, mat('#4a4a48')); gr.position.set(0, 0.02, -3); qs.add(gr);
  const hs = box(7, 3.4, 4, mat('#c8b8a0')); hs.position.set(0, 1.7, -7.5); qs.add(hs);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(5.4, 1.8, 4), mat('#4a3a3a')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.6); rf.position.set(0, 4.3, -7.5); qs.add(rf);
  const dr = box(1.1, 2.1, 0.06, mat('#6a4a30')); dr.position.set(0.6, 1.05, -5.47); qs.add(dr);
  const lt = box(1.2, 2.2, 0.05, gl('#ffd890')); lt.position.set(0.6, 1.1, -5.5); qs.add(lt);
  const wn = box(1.6, 1.0, 0.05, gl('#ffe0a0')); wn.position.set(-2.0, 1.8, -5.47); qs.add(wn);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), gl('#fff0c0')); lamp.position.set(1.4, 2.3, -5.4); qs.add(lamp);
  for (const s of [-1, 1]) { const fn = box(3.2, 1.0, 0.15, mat('#8a8a84')); fn.position.set(s * 2.6 + 0.6, 0.5, -2.6); qs.add(fn); }
  const stp = box(1.6, 0.16, 0.8, mat('#9a9890')); stp.position.set(0.6, 0.08, -5.0); qs.add(stp); }
const DOOR1 = (() => { const d = box(1.1, 2.1, 0.08, mat('#6a4a30')); d.position.set(0.6, 1.05, -5.44); qs.add(d); return d; })();
const bro1 = makePerson(BRO); bro1.position.set(0.35, 0.16, -5.0); qs.add(bro1);
const you1 = makePerson(YOU); you1.position.set(1.05, 0.16, -5.2); qs.add(you1);
const kid1 = makePerson(KID); kid1.position.set(0.6, 0, -2.2); kid1.rotation.y = Math.PI; qs.add(kid1);
const PACK1 = box(0.42, 0.5, 0.22, mat('#3a7ab0')); PACK1.position.set(0, 1.15, -0.25); kid1.add(PACK1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tBoy = tag('突然あらわれた、男の子', { size: 54, w: 700, bg: '#14161c', sx: 2.2 }); tBoy.position.set(0.6, 2.5, -4.4); qs.add(tBoy);
const tWho = tag('いったい、どこの子？', { size: 58, w: 620, bg: '#c8202c', sx: 2.0 }); tWho.position.set(0.6, 2.5, -4.4); qs.add(tWho);

// ---------- 2段目. 昼の市役所（x=50）。窓口の机でパソコンに向かう兄。机の上に家族写真 ----------
const AX = 50;
{ const fl = box(12, 0.04, 9, mat('#b8b8b0')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 3.8, 0.2, mat('#e8e8e0')); wl.position.set(AX, 1.9, -5.5); qs.add(wl);
  for (let i = 0; i < 3; i++) { const w = box(2.2, 1.4, 0.05, gl('#c8e0f0')); w.position.set(AX - 3.6 + i * 3.6, 2.3, -5.38); qs.add(w); }
  const ct = box(9, 1.0, 0.6, mat('#c8c0b0')); ct.position.set(AX, 0.5, -0.6); qs.add(ct); const ctt = box(9.1, 0.06, 0.7, mat('#e8e4d8')); ctt.position.set(AX, 1.02, -0.6); qs.add(ctt);
  for (let i = 0; i < 3; i++) { const d = box(1.6, 0.06, 0.9, mat('#d8d0c0')); d.position.set(AX - 3 + i * 3, 0.75, -2.8); qs.add(d); const dl = box(1.5, 0.72, 0.8, mat('#9a9a94')); dl.position.set(AX - 3 + i * 3, 0.36, -2.8); qs.add(dl);
    const pc = box(0.6, 0.4, 0.04, mat('#2a2a2e')); pc.position.set(AX - 3 + i * 3, 1.05, -3.05); qs.add(pc); const sc = box(0.54, 0.34, 0.01, gl('#a8c8e8')); sc.position.set(AX - 3 + i * 3, 1.05, -3.02); qs.add(sc);
    for (let k = 0; k < 3; k++) { const pp = box(0.28, 0.03, 0.36, mat('#ffffff')); pp.position.set(AX - 3.5 + i * 3, 0.8 + k * 0.03, -2.6); qs.add(pp); } }
  for (let i = 0; i < 4; i++) { const s = box(0.9, 0.24, 0.05, mat(['#3a7ab0', '#4a9a6a', '#e0a030', '#c84a3a'][i])); s.position.set(AX - 4.5 + i * 3, 3.3, -5.38); qs.add(s); } }
const bro2 = makePerson(BRO); bro2.position.set(AX, 0, -2.0); bro2.rotation.y = Math.PI; qs.add(bro2);
const col2 = [-3, 3].map((x, i) => { const p = makePerson({ skin: '#f1c9a5', hair: i ? '#5a4030' : '#2a2420', shirt: i ? '#e8d8e8' : '#c8d8e8', pants: '#3a3a4a', long: i === 1, skirt: i === 1 }); p.position.set(AX + x, 0, -2.0); p.rotation.y = Math.PI; qs.add(p); return p; });
const PHOTO2 = new THREE.Group(); { const f = box(0.34, 0.26, 0.03, mat('#6a4a30')); PHOTO2.add(f); const pic = painting(0.29, 0.21, (g, w, h) => { g.fillStyle = '#f0e0c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#8ab0d8'; g.fillRect(0, 0, w, h * 0.5);
  [[60, '#7a5a40'], [110, '#c86a5a'], [160, '#3a6a9a'], [200, '#e8c050']].forEach(([x, c], i) => { const s = i < 2 ? 1 : 0.7; g.fillStyle = c; g.fillRect(x - 14 * s, h - 110 * s, 28 * s, 110 * s); g.fillStyle = '#f1c9a5'; g.beginPath(); g.arc(x, h - 122 * s, 15 * s, 0, 7); g.fill(); }); }); pic.position.z = 0.02; PHOTO2.add(pic); }
PHOTO2.position.set(AX + 0.62, 0.92, -2.95); PHOTO2.rotation.set(0.15, Math.PI - 0.45, 0); qs.add(PHOTO2);
const tWork = tag('主人公は、市役所で働く兄', { size: 52, w: 760, bg: '#14161c', sx: 1.9 }); tWork.position.set(AX, 2.55, -2.0); qs.add(tWork);
const tTwo = tag('弟と、ふたり暮らし', { size: 58, w: 580, bg: '#2a6ab0', sx: 1.3 }); tTwo.position.set(AX + 0.1, 2.25, -2.3); qs.add(tTwo);

// ---------- 3段目. 明るいアトリエ（x=100）。イーゼルに向かう弟、色とりどりの絵、壁の時計と予定表 ----------
const BX = 100;
{ const fl = box(10, 0.04, 8, mat('#c8b090')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#f4f0e8')); wl.position.set(BX, 2, -5); qs.add(wl);
  const win = box(2.6, 1.8, 0.05, gl('#d8ecf8')); win.position.set(BX + 2.8, 2.2, -4.88); qs.add(win);
  const pals = [['#f0a030', '#3a7ab0'], ['#7ab040', '#e04a6a'], ['#8a5ab0', '#f0d040'], ['#3ab0b0', '#e86a3a']];
  pals.forEach(([a, b], i) => { const p = painting(1.0, 0.8, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let k = 0; k < 16; k++) { g.fillStyle = k % 2 ? a : b; g.globalAlpha = 0.8; g.fillRect((k * 53) % w, (k * 37) % h, 30 + (k % 3) * 20, 30 + (k % 4) * 14); } });
    p.position.set(BX - 3.6 + (i % 2) * 1.2, 2.6 - Math.floor(i / 2) * 1.0, -4.88); qs.add(p); });
  const clk = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), mat('#ffffff')); clk.position.set(BX - 0.2, 3.2, -4.88); qs.add(clk);
  const hh = box(0.03, 0.2, 0.01, mat('#111')); hh.position.set(BX - 0.2, 3.28, -4.86); qs.add(hh); const mh = box(0.02, 0.28, 0.01, mat('#111')); mh.position.set(BX - 0.12, 3.2, -4.86); mh.rotation.z = -1.2; qs.add(mh);
  const bd = box(1.6, 1.1, 0.04, mat('#ffffff')); bd.position.set(BX + 0.9, 2.2, -4.88); qs.add(bd); }
const SCHED3 = []; for (let i = 0; i < 6; i++) { const c = box(0.4, 0.18, 0.02, gl(['#e04a6a', '#f0a030', '#7ab040', '#3a7ab0', '#8a5ab0', '#3ab0b0'][i])); c.position.set(BX + 0.65 + (i % 2) * 0.5, 2.55 - Math.floor(i / 2) * 0.3, -4.84); qs.add(c); SCHED3.push(c); }
easel(BX - 0.4, -2.6);
const CANVAS3 = painting(1.0, 1.2, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); const c = ['#3a7ab0', '#7ab040', '#f0a030', '#e04a6a']; for (let k = 0; k < 9; k++) { g.fillStyle = c[k % 4]; g.globalAlpha = 0.85; g.beginPath(); g.arc(40 + (k * 61) % 180, 50 + (k * 47) % 200, 26 + (k % 3) * 10, 0, 7); g.fill(); } });
CANVAS3.position.set(BX - 0.4, 1.55, -2.55); qs.add(CANVAS3);
const you3 = makePerson(YOU); you3.position.set(BX + 0.4, 0, -1.6); you3.rotation.y = Math.PI + 0.7; qs.add(you3);
const BRUSH3 = box(0.03, 0.3, 0.03, mat('#c84a3a')); BRUSH3.position.set(0, -0.72, 0.08); you3.userData.arms[1].add(BRUSH3);
const tArt = tag('弟は、絵が得意な画家', { size: 56, w: 640, bg: '#14161c', sx: 2.3 }); tArt.position.set(BX - 0.2, 3.1, -3.4); qs.add(tArt);
const tRoutine = tag('毎日、同じ順番の暮らし', { size: 54, w: 700, bg: '#7ab040', sx: 2.4 }); tRoutine.position.set(BX - 0.2, 3.1, -3.4); qs.add(tRoutine);

// ---------- 4段目. 夜の居間（x=150）。ちゃぶ台を囲む兄・弟・男の子。茶の間の明かり ----------
const CX = 150;
{ const fl = box(9, 0.04, 8, mat('#c8b080')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 4; i++) { const ln = box(0.02, 0.01, 8, mat('#a8905a')); ln.position.set(CX - 3 + i * 2, 0.045, -2); qs.add(ln); }
  const wl = box(9, 3.4, 0.2, mat('#e0d4bc')); wl.position.set(CX, 1.7, -5); qs.add(wl);
  const tb = box(1.8, 0.06, 1.2, mat('#7a5a3a')); tb.position.set(CX, 0.4, -2.6); qs.add(tb); const tl = box(1.6, 0.36, 1.0, mat('#5a3a2a')); tl.position.set(CX, 0.2, -2.6); qs.add(tl);
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.1, 14), mat('#f4f0e8')); b.position.set(CX - 0.5 + i * 0.5, 0.48, -2.5); qs.add(b); }
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.3, 16, 1, true), gl('#ffe0a0')); lamp.position.set(CX, 2.7, -2.6); qs.add(lamp);
  const fu = box(1.0, 0.12, 2.0, mat('#e8e4f0')); fu.position.set(CX + 2.8, 0.06, -2.2); qs.add(fu); const pl = box(0.5, 0.1, 0.3, mat('#a8c8e8')); pl.position.set(CX + 2.8, 0.15, -3.0); qs.add(pl); }
const SIT4 = [[BRO_H, -1.2, 0, Math.PI / 2], [YOU, 1.2, 0, -Math.PI / 2], [KID, 0, 0.95, Math.PI]].map(([c, dx, dz, ry]) => { const p = makePerson(c); p.position.set(CX + dx, 0, -2.6 + dz); p.rotation.y = ry; qs.add(p); return p; });
const tOne = tag('一晩だけ、預かるつもりが', { size: 52, w: 760, bg: '#14161c', sx: 2.4 }); tOne.position.set(CX, 2.2, -3.6); qs.add(tOne);
const tThree = tag('3人で、暮らすことに', { size: 58, w: 620, bg: '#e6b450', color: '#14161c', sx: 2.2 }); tThree.position.set(CX, 2.2, -3.6); qs.add(tThree);

// ---------- 5段目. 夜のリビング（x=200）。テレビに、夜の家の明かり ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a3440')); wl.position.set(TX, 3, -4.5); qs.add(wl);
  const sofa = box(3.6, 0.7, 1.0, mat('#4a5a7a')); sofa.position.set(TX, 0.35, 2.6); qs.add(sofa);
  const st = box(4.2, 0.6, 0.8, mat('#2a2228')); st.position.set(TX, 0.3, -4.0); qs.add(st);
  const fr = box(5.8, 3.4, 0.16, mat('#101014')); fr.position.set(TX, 2.4, -4.3); qs.add(fr); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.1), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2440'); gr.addColorStop(1, '#3a4a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c8b8a0'; g.fillRect(200, 170, 240, 150); g.fillStyle = '#4a3a3a'; g.beginPath(); g.moveTo(180, 172); g.lineTo(320, 100); g.lineTo(460, 172); g.fill();
  g.fillStyle = '#ffd890'; g.fillRect(230, 210, 70, 50); g.fillRect(340, 230, 50, 90);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) g.fillRect((i * 97) % 640, (i * 41) % 90, 3, 3); }) }));
SCR5.position.set(TX, 2.4, -4.2); qs.add(SCR5);
const t2024 = tag('2024年の、金曜ドラマ', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.6 }); t2024.position.set(TX, 4.9, -4.0); qs.add(t2024);
const tStar = tag('主演は、柳楽優弥', { size: 60, w: 560, bg: '#c8202c', sx: 3.2 }); tStar.position.set(TX, 4.9, -4.0); qs.add(tStar);

// ---------- 6段目. 夕方のアトリエ（x=250）。弟が描く大きな絵：たてがみのある動物の顔。となりで男の子が見上げる ----------
const DX = 250;
{ const fl = box(10, 0.04, 8, mat('#c8b090')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#f0e4d0')); wl.position.set(DX, 2, -5); qs.add(wl);
  const win = box(2.6, 1.8, 0.05, gl('#f8c890')); win.position.set(DX + 3.0, 2.2, -4.88); qs.add(win); }
easel(DX - 0.3, -2.8);
const LION6 = painting(1.4, 1.4, (g, w, h) => { g.fillStyle = '#fff8ec'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; g.fillStyle = i % 2 ? '#d8782a' : '#e89a3a'; g.beginPath(); g.ellipse(128 + Math.cos(a) * 70, 128 + Math.sin(a) * 70, 34, 22, a, 0, 7); g.fill(); }
  g.fillStyle = '#f2c060'; g.beginPath(); g.arc(128, 128, 62, 0, 7); g.fill();
  g.fillStyle = '#f2c060'; for (const s of [-1, 1]) { g.beginPath(); g.arc(128 + s * 46, 76, 16, 0, 7); g.fill(); }
  g.fillStyle = '#2a1a10'; for (const s of [-1, 1]) { g.beginPath(); g.arc(128 + s * 22, 118, 7, 0, 7); g.fill(); }
  g.beginPath(); g.moveTo(116, 140); g.lineTo(140, 140); g.lineTo(128, 154); g.fill();
  g.strokeStyle = '#2a1a10'; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 154); g.lineTo(128, 164); g.moveTo(128, 164); g.quadraticCurveTo(116, 174, 106, 166); g.moveTo(128, 164); g.quadraticCurveTo(140, 174, 150, 166); g.stroke(); });
LION6.position.set(DX - 0.3, 1.75, -2.75); qs.add(LION6);
const you6 = makePerson(YOU); you6.position.set(DX + 0.6, 0, -2.0); you6.rotation.y = Math.PI + 0.8; qs.add(you6);
const kid6 = makePerson(KID); kid6.position.set(DX - 1.3, 0, -1.8); kid6.rotation.y = Math.PI - 0.5; qs.add(kid6);
const tName = tag('男の子が名乗った名前は…', { size: 54, w: 720, bg: '#14161c', sx: 2.4 }); tName.position.set(DX - 0.2, 3.3, -3.2); qs.add(tName);
const tKing = tag('百獣の王の、カタカナ4文字', { size: 52, w: 780, bg: '#d8782a', sx: 2.5 }); tKing.position.set(DX - 0.2, 3.3, -3.2); qs.add(tKing);

// ---------- shots ----------
const ALL = [tBoy, tWho, tWork, tTwo, tArt, tRoutine, tOne, tThree, t2024, tStar, tName, tKing, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotDoor(t, quiz = 0) { // 1段目 0〜9：静かに暮らす兄弟の前に、突然あらわれた男の子（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.6; S.darken(0.5, '#05070e');
  bro1.userData.head.rotation.x = 0.25; you1.userData.head.rotation.x = 0.2; you1.userData.arms[0].rotation.x = -0.3;
  kid1.userData.head.rotation.x = -0.2; kid1.position.y = Math.abs(Math.sin(t * 1.5)) * 0.01;
  bro1.userData.arms[1].rotation.x = !quiz && t > 4.6 ? -0.5 : 0;
  Q1.position.set(1.0, 1.4, -2.4); Q1.userData.pop(1); if (!quiz && t > 4.4) Q1.visible = false;
  if (!quiz) { tBoy.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tBoy.visible = false; tWho.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-1.0, -0.7, u), lerp(2.3, 2.2, u), lerp(1.0, 0.4, u), 0.6, 1.0, -3.8, 60);
  return qs;
}
function shotOffice(t) { // 2段目 9〜17：主人公は、市役所で働く兄。両親を亡くし、弟とふたり暮らし
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.3;
  bro2.userData.arms.forEach((a, i) => a.rotation.x = -1.1 + Math.sin(t * 9 + i * 2) * 0.06);
  bro2.userData.head.rotation.y = t > 4.2 ? 0.5 : 0; bro2.userData.arms[0].rotation.x = t > 4.2 ? -0.6 : bro2.userData.arms[0].rotation.x;
  col2.forEach((p, i) => p.userData.arms[i].rotation.x = -1.0 + Math.sin(t * 7 + i) * 0.05);
  tWork.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWork.visible = false; tTwo.userData.pop((t - 4.3) / 0.35);
  const w = ease(clamp((t - 4.0) / 1.4)); const u = ease(t / 8);
  look(AX + lerp(2.2, 1.7, w) - u * 0.2, lerp(2.3, 1.9, w), lerp(-5.2, -5.0, w), AX + lerp(0, 0.3, w), lerp(1.2, 1.1, w), lerp(-2.2, -2.6, w), lerp(58, 62, w));
  return qs;
}
function shotAtelier(t) { // 3段目 17〜25：弟は、絵が得意な画家。毎日、同じ順番の決まった暮らし
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.35;
  you3.userData.arms[1].rotation.x = -1.4 + Math.sin(t * 5) * 0.2; you3.userData.arms[1].rotation.z = Math.sin(t * 3) * 0.2;
  SCHED3.forEach((c, i) => { const k = clamp((t - 4.3 - i * 0.25) / 0.3); c.scale.set(1, 1, 1); c.visible = t < 4.2 || k > 0; });
  tArt.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tArt.visible = false; tRoutine.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.8, 1.2, u), lerp(2.2, 2.2, u), lerp(2.2, 1.4, u), BX, 1.9, -3.6, 62);
  return qs;
}
function shotTable(t) { // 4段目 25〜33：一晩だけ預かるつもりだったのに。3人で暮らすことに
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.9; S.darken(0.3, '#2a2010');
  SIT4.forEach((p, i) => { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = -0.42 * p.scale.x; p.userData.arms[i % 2].rotation.x = t > 4.2 ? -0.9 - Math.abs(Math.sin(t * 3 + i)) * 0.3 : -0.3; p.userData.head.rotation.z = t > 4.2 ? Math.sin(t * 4 + i) * 0.08 : 0; });
  tOne.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOne.visible = false; tThree.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(3.2, 3.0, u), lerp(2.4, 1.8, u), CX, 0.5, -2.7, 60);
  return qs;
}
function shotTv(t) { // 5段目 33〜42：2024年のTBS金曜ドラマ・全11話。主演は柳楽優弥
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.6, '#08060a');
  t2024.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2024.visible = false; tStar.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.9, u), lerp(5.6, 4.6, u), TX, 3.0, -4.2, 66);
  return qs;
}
function shotLion(t) { // 6段目 42〜49（決め手）：男の子が名乗った名前は、百獣の王の名前
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.1; S.darken(0.2, '#f0a070');
  you6.userData.arms[1].rotation.x = -1.3 + Math.sin(t * 4) * 0.15;
  kid6.userData.head.rotation.x = -0.35; kid6.userData.arms[1].rotation.x = t > 3.6 ? -2.4 : 0;
  if (t < 3.6) tName.userData.pop((t - 0.3) / 0.35); else tKing.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.9, 0.5, u), lerp(1.9, 1.8, u), lerp(2.2, 1.3, u), DX - 0.3, 1.7, -2.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の玄関に戻る）
  shotDoor(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotDoor(t, 0) },
  { a: 9, b: 17, f: shotOffice },
  { a: 17, b: 25, f: shotAtelier },
  { a: 25, b: 33, f: shotTable },
  { a: 33, b: 42, f: shotTv },
  { a: 42, b: 49, f: shotLion },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '静かに暮らす兄弟の前に、<br>突然あらわれた男の子。'],
  [5.6, 9.0, 'いったい、<br>どこの子なのか…'],
  [9.2, 13.2, '主人公は、<br>市役所で働く兄。'],
  [13.2, 17.0, '両親を亡くし、<br>弟とふたりで暮らしている。'],
  [17.2, 21.0, '弟は、絵を描くのが<br>得意な画家。'],
  [21.0, 25.0, '毎日、同じ順番の<br>決まった暮らし。'],
  [25.2, 29.0, '一晩だけ預かる、<br>つもりだったのに…'],
  [29.0, 33.0, '3人で暮らすことに<br>なった。'],
  [33.2, 37.4, '2024年放送の、<br>金曜ドラマ。全11話。'],
  [37.4, 41.8, '主演は、<br>柳楽優弥。'],
  [42.2, 45.4, '男の子が名乗った<br>名前は…'],
  [45.4, 49.0, '百獣の王の、<br>カタカナ4文字。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ライオンの隠れ家。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q111', v2: true, answer: 'ライオンの隠れ家',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 11110,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ライオンの隠れ家': 'らいおんのかくれが', '静かに': 'しずかに', '暮らす': 'くらす', '兄弟': 'きょうだい', '前': 'まえ', '突然': 'とつぜん', '男の子': 'おとこのこ', '子': 'こ', '主人公': 'しゅじんこう', '市役所': 'しやくしょ', '働く': 'はたらく', '兄': 'あに', '両親': 'りょうしん', '亡くし': 'なくし', '弟': 'おとうと', '暮らしている': 'くらしている', '絵': 'え', '描く': 'かく', '得意': 'とくい', '画家': 'がか', '毎日': 'まいにち', '同じ': 'おなじ', '順番': 'じゅんばん', '決まった': 'きまった', '暮らし': 'くらし', '一晩': 'ひとばん', '預かる': 'あずかる', '3人': 'さんにん', '暮らすこと': 'くらすこと', '2024年': 'にせんにじゅうよねん', '放送': 'ほうそう', '金曜': 'きんよう', '全11話': 'ぜんじゅういちわ', '主演': 'しゅえん', '柳楽優弥': 'やぎらゆうや', '名乗った': 'なのった', '名前': 'なまえ', '百獣の王': 'ひゃくじゅうのおう', '4文字': 'よんもじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n静かに暮らす兄弟の前に、突然あらわれた男の子。いったい、どこの子なのか…。主人公は、市役所で働く兄。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'Hulu', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'ライオンの隠れ家', info: 'Netflix・Hulu｜日本のドラマ・全11話', answerSize: 100 });
