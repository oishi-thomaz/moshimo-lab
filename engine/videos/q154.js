import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #154 グッド・ウィル・ハンティング／旅立ち（映画・アメリカ・1997年製作・127分。Prime Video・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/gutsudouiruhanteingu-lu-li-chi（Amazon Prime Video, Hulu, U-NEXT で配信中）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・Hulu 見放題。2026年10月更新）で2026/11/28確認。Filmarks 4.2・レビュー173,026件 filmarks.com/movies/29792）
// 確かめた事実（2026/11/28）：
//   ・映画.com eiga.com/movie/10725 ：1997年製作／127分／アメリカ。幼少期のトラウマから荒んだ生活を送る天才青年が、心に傷を抱える心理学者との交流を通して
//     成長していく姿を描いたヒューマンドラマ。主演の二人が共同で脚本を初執筆し、第70回アカデミー賞で脚本賞を受賞。数学教授は、教え子たちが苦戦していた
//     証明問題を清掃員の青年が完璧に解いたことを知り驚がくする。天涯孤独な青年は幾度も里親が変わるなかで愛を知らずに育ち、傷害事件などの問題行動を
//     繰り返していた。教授は彼を更生させようとセラピーに通わせる。やがて出会った心理学者は最愛の妻を亡くし深い悲しみを抱えていて、その交流を通し、
//     青年は自分自身の心の傷と向き合うようになっていく。心理学者を演じた俳優がアカデミー助演男優賞を受賞
//   ・Filmarks：実際に親友同士の二人が脚本・出演し、アカデミー脚本賞含む数々の映画賞を受賞したヒューマン・ドラマ
// 構成（ヒント6段）：1 大学の黒板にだれも解けない問題・ある朝、だれかが解いていた → 2 主人公は大学で働く清掃員の青年・実はとんでもない天才
//   → 3 仲間とつるんでケンカざんまい・心を開ける場所がどこにもない → 4 才能を見抜いた教授がカウンセリングへ・出会ったのは妻を亡くした心理学者
//   → 5 1997年のアメリカ映画・アカデミー賞で脚本賞と助演男優賞 → 6 決め手：天才青年と心理学者が心の傷に向き合う・脚本は親友どうしの若手俳優ふたり
// 結末（青年の選ぶ道）は言わない。登場人物の名前・大学名・地名は出さない。俳優の顔・ポスター・ロゴは使わない。有名な場面の構図（夜の廊下で青年が黒板に
// 書きこむ姿・池のほとりのベンチで並んで座る場面など）はなぞらない。黒板の数式は意味のない飾り。人は汎用の3D
const S = quizStage({ bg: '#1a1e26', floor: '#2a2a2e', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(15410);

const WILL = { skin: '#f1c9a5', hair: '#5a3a1e', shirt: '#6a7a8a', pants: '#3a4a6a' };
const JAN = { skin: '#f1c9a5', hair: '#5a3a1e', shirt: '#4a5a4a', pants: '#4a5a4a' };
const PROF = { skin: '#f0c49c', hair: '#c8c0b0', shirt: '#7a5a3a', pants: '#4a3a2a', tie: true };
const DOC = { skin: '#e8b890', hair: '#8a8a88', shirt: '#8a7a5a', pants: '#4a4034' };
const PALS = [{ skin: '#f4d3b5', hair: '#2a1a10', shirt: '#2a3a5a', pants: '#3a4a6a' }, { skin: '#e8c09a', hair: '#8a6a3a', shirt: '#5a2a2a', pants: '#3a3a40' }, { skin: '#f1c9a5', hair: '#1a1410', shirt: '#2a2a2e', pants: '#3a4a6a' }];
const STU = [{ skin: '#f1c9a5', hair: '#3a2418', shirt: '#c8c0b0', pants: '#4a4a52' }, { skin: '#e0b08a', hair: '#1a1410', shirt: '#5a6a8a', pants: '#3a3a40', long: true }, { skin: '#f4d3b5', hair: '#8a5a2a', shirt: '#7a3a3a', pants: '#3a3a40' }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const SYM = ['∑', '∫', 'x', 'y', 'n', 'Γ', '√', 'π', '=', '+', '(', ')', 'λ', '∞', 'k', '²'];
function chalk(full, seed) { const r = rng(seed); return canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#24402e'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(240,240,230,0.88)';
  const rows = full ? 9 : 4; for (let k = 0; k < rows; k++) { let x = 40 + (k % 2) * 30; const y = 60 + k * 50; while (x < (full ? w - 60 : w * 0.7)) { g.font = `${26 + Math.floor(r() * 14)}px serif`; const s = SYM[Math.floor(r() * SYM.length)]; g.fillText(s, x, y); x += 22 + r() * 26; } }
  if (!full) { g.font = 'bold 120px serif'; g.fillText('?', w * 0.8, h * 0.6); } }); }
function armchair(c = '#6a4a3a') { const g = new THREE.Group(); const s = box(0.9, 0.45, 0.8, mat(c)); s.position.y = 0.3; g.add(s); const b = box(0.9, 0.8, 0.2, mat(c)); b.position.set(0, 0.8, -0.35); g.add(b);
  for (const x of [-0.45, 0.45]) { const a = box(0.14, 0.3, 0.8, mat(c)); a.position.set(x, 0.62, 0); g.add(a); } return g; }
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = -0.32; }
function oscar() { const g = new THREE.Group(); const gm = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3, emissive: '#4a3a10' });
  const bs = box(0.3, 0.14, 0.3, mat('#2a2a2a')); g.add(bs); const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 10), gm); bd.position.y = 0.37; g.add(bd); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), gm); hd.position.y = 0.74; g.add(hd); return g; }

// ---------- 1段目. 大学の廊下（x=0）。壁の大きな黒板、朝の光、見上げる学生たち。数式が書き足されていく ----------
{ const fl = box(8, 0.04, 14, mat('#8a7a64')); fl.position.set(0, 0.02, -3); qs.add(fl); const wl = box(10, 4.2, 0.3, mat('#c8bca4')); wl.position.set(0, 2.1, -6); qs.add(wl);
  const sw = box(0.3, 4.2, 14, mat('#b8ac94')); sw.position.set(-4, 2.1, -3); qs.add(sw);
  for (let i = 0; i < 3; i++) { const w = box(0.05, 1.8, 1.1, gl('#fff4d8')); w.position.set(-3.84, 2.2, -4 + i * 2.2); qs.add(w); }
  const L = new THREE.DirectionalLight('#fff0d0', 1.0); L.position.set(-6, 5, 0); qs.add(L); }
const BOARD1 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: chalk(false, 7) })); BOARD1.position.set(0.4, 2.0, -5.83); qs.add(BOARD1);
const BOARD1B = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: chalk(true, 7) })); BOARD1B.position.set(0.4, 2.0, -5.82); qs.add(BOARD1B);
{ const fr = box(4.4, 2.3, 0.06, mat('#6a4a2a')); fr.position.set(0.4, 2.0, -5.87); qs.add(fr); const tray = box(4.2, 0.05, 0.12, mat('#6a4a2a')); tray.position.set(0.4, 0.93, -5.78); qs.add(tray); }
const STU1 = STU.map((o, i) => person(o, -0.6 + i * 0.9, -3.4 - (i % 2) * 0.3, Math.PI + (i - 1) * 0.15));
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tHard = tag('大学の黒板に、だれも解けない問題', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tHard);
const tSolved = tag('ある朝、だれかが解いていた', { size: 50, w: 780, bg: '#e24050', sx: 1.85 }); qs.add(tSolved);

// ---------- 2段目. 夜の大学の床（x=50）。モップをかける清掃員の青年、まわりに浮かぶ数字と記号 ----------
const AX = 50;
{ const fl = box(8, 0.04, 30, mat('#9a8a70')); fl.position.set(AX, 0.02, -8); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.3, 4, 30, mat('#b8ac94')); wl.position.set(AX + s * 3, 2, -8); qs.add(wl); for (let i = 0; i < 5; i++) { const d = box(0.06, 2.4, 1.1, mat('#5a3a28')); d.position.set(AX + s * 2.84, 1.2, -2 - i * 5); qs.add(d); } }
  for (let i = 0; i < 6; i++) { const lp = box(0.9, 0.04, 0.3, gl('#a89c84')); lp.position.set(AX, 3.95, -1 - i * 5); qs.add(lp); }
  const L = new THREE.PointLight('#e8e0c8', 2.0, 12); L.position.set(AX, 3.4, -3); qs.add(L); }
const JAN2 = person(JAN, AX, -3.6, 0.4);
const MOP2 = new THREE.Group(); { const st = box(0.04, 1.4, 0.04, mat('#c8b890')); st.position.y = -0.5; MOP2.add(st); const hd = box(0.4, 0.1, 0.16, mat('#d8d4c8')); hd.position.set(0, -1.2, 0.05); MOP2.add(hd); }
MOP2.position.set(0, -0.5, 0.25); MOP2.rotation.x = 0.5; JAN2.userData.arms[1].add(MOP2);
const BUCK2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 14), mat('#e8c020')); BUCK2.position.set(AX + 0.9, 0.2, -3.2); qs.add(BUCK2);
const SYM2 = SYM.slice(0, 10).map((s, i) => { const m = tag(s, { size: 80, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#e8e8d0', sx: 0.4 }); m.renderOrder = 6; qs.add(m); return m; });
const tJan = tag('主人公は、大学で働く清掃員の青年', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tJan);
const tGenius = tag('実は、とんでもない天才', { size: 54, w: 680, bg: '#e24050', sx: 1.7 }); qs.add(tGenius);

// ---------- 3段目. 夜のれんがの裏通り（x=100）。たむろする若者たち、つかみかかる手、街灯 ----------
const BX = 100;
{ const rd = box(10, 0.04, 30, mat('#3a3a3e')); rd.position.set(BX, 0.02, -8); qs.add(rd);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const h = 4 + R() * 3; const b = box(3, h, 6, mat(s < 0 ? '#7a3a2a' : '#6a3428')); b.position.set(BX + s * 4.4, h / 2, -2 - i * 6.5); qs.add(b);
    for (let k = 0; k < 4; k++) { const w = box(0.05, 0.7, 0.8, gl(R() > 0.5 ? '#ffd890' : '#2a2a34')); w.position.set(BX + s * 2.88, 1.6 + (k % 2) * 1.6, -1 - i * 6.5 + Math.floor(k / 2) * 2); qs.add(w); } }
  const lp = box(0.1, 3.4, 0.1, mat('#2a2a2a')); lp.position.set(BX + 1.6, 1.7, -4.5); qs.add(lp); const lh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), gl('#ffe0a0')); lh.position.set(BX + 1.6, 3.45, -4.5); qs.add(lh);
  const L = new THREE.PointLight('#ffd8a0', 3.4, 10); L.position.set(BX + 1.4, 3.2, -4.0); qs.add(L); }
const WILL3 = person({ ...WILL, shirt: '#3a4a5a' }, BX - 0.2, -4.0, 0.2);
const PALS3 = PALS.map((o, i) => person(o, BX - 1.4 + i * 0.7, -4.8 - (i % 2) * 0.4, 0.3));
const RIVAL3 = person({ skin: '#e8c09a', hair: '#1a1a1a', shirt: '#1a1a1e', pants: '#2a2a30', scale: 1.08 }, BX + 0.8, -4.3, -1.3);
const tGang = tag('仲間とつるんで、ケンカざんまい', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tGang);
const tNoPlace = tag('心を開ける場所が、どこにもない', { size: 46, w: 860, bg: '#e24050', sx: 1.95 }); qs.add(tNoPlace);

// ---------- 4段目. 左：教授の研究室（本棚と机）／右：窓のある診察室、向かい合う二つのひじかけ椅子と、ひげの心理学者 ----------
const CX = 150;
{ const fl = box(12, 0.04, 8, mat('#6a4a34')); fl.position.set(CX, 0.02, -3); qs.add(fl); const wl = box(12, 4, 0.3, mat('#d8ccb0')); wl.position.set(CX, 2, -7); qs.add(wl);
  for (let i = 0; i < 3; i++) { const sh = box(1.2, 3.0, 0.4, mat('#4a3020')); sh.position.set(CX - 4.8 + i * 1.25, 1.5, -6.6); qs.add(sh);
    for (let k = 0; k < 5; k++) { const bk = box(1.0, 0.4, 0.3, mat(['#8a2a2a', '#2a4a6a', '#6a6a2a', '#3a6a4a'][(i + k) % 4])); bk.position.set(CX - 4.8 + i * 1.25, 0.4 + k * 0.58, -6.45); qs.add(bk); } }
  const dk = box(1.6, 0.8, 0.9, mat('#5a3a24')); dk.position.set(CX - 3.4, 0.4, -4.4); qs.add(dk);
  const win = box(1.8, 1.8, 0.05, gl('#c8dcef')); win.position.set(CX + 3.2, 2.1, -6.82); qs.add(win);
  const L = new THREE.PointLight('#fff0d8', 2.6, 14); L.position.set(CX, 3.4, -2.6); qs.add(L); }
const PROF4 = person(PROF, CX - 3.9, -3.4, 0.6); const WILL4A = person(WILL, CX - 2.6, -3.2, -0.6);
const CH4 = [armchair('#6a4a3a'), armchair('#5a5a3a')]; CH4[0].position.set(CX + 2.2, 0, -4.4); CH4[0].rotation.y = 0.9; CH4[1].position.set(CX + 4.2, 0, -4.6); CH4[1].rotation.y = -0.9; CH4.forEach(c => qs.add(c));
const DOC4 = person(DOC, CX + 4.2, -4.6, -0.9); sit(DOC4); { const bd = box(0.36, 0.14, 0.06, mat('#6a6a66')); bd.position.set(0, 0.1, 0.2); DOC4.userData.head.add(bd); }
const WILL4B = person(WILL, CX + 2.2, -4.4, 0.9); sit(WILL4B);
const tProf = tag('才能を見抜いた教授が、カウンセリングへ', { size: 40, w: 980, bg: '#14161c', sx: 2.1 }); qs.add(tProf);
const tDoc = tag('出会ったのは、妻を亡くした心理学者', { size: 42, w: 940, bg: '#e24050', sx: 2.05 }); qs.add(tDoc);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーン、赤い座席、金色の像が2つ ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.03, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#8a1a24')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#7a1620')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#6a7a9a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const TROPHY5 = [0, 1].map(i => { const g = oscar(); g.position.set(DX - 0.5 + i * 1.0, 1.6, -3.2); qs.add(g); return g; });
const t1997 = tag('1997年の、アメリカ映画', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t1997);
const tAward = tag('アカデミー賞で、脚本賞と助演男優賞', { size: 42, w: 940, bg: '#e24050', sx: 2.05 }); qs.add(tAward);

// ---------- 6段目. 窓辺の診察室（x=250）。向かい合って話す青年と心理学者 → 机でタイプライターを打つ若者ふたり ----------
const EX = 250;
{ const fl = box(12, 0.04, 8, mat('#6a4a34')); fl.position.set(EX, 0.02, -3); qs.add(fl); const wl = box(12, 4, 0.3, mat('#c8bca0')); wl.position.set(EX, 2, -7); qs.add(wl);
  const win = box(2.2, 2.0, 0.05, gl('#f0e0b8')); win.position.set(EX - 1.6, 2.1, -6.82); qs.add(win);
  const L = new THREE.PointLight('#ffd8a8', 3.0, 12); L.position.set(EX - 1.6, 2.6, -5); qs.add(L);
  const dk = box(2.0, 0.76, 0.9, mat('#5a3a24')); dk.position.set(EX + 3.0, 0.38, -4.6); qs.add(dk); }
const CH6 = [armchair('#6a4a3a'), armchair('#5a5a3a')]; CH6[0].position.set(EX - 2.4, 0, -4.2); CH6[0].rotation.y = 0.9; CH6[1].position.set(EX - 0.6, 0, -4.4); CH6[1].rotation.y = -0.9; CH6.forEach(c => qs.add(c));
const WILL6 = person(WILL, EX - 2.4, -4.2, 0.9); sit(WILL6); const DOC6 = person(DOC, EX - 0.6, -4.4, -0.9); sit(DOC6); { const bd = box(0.36, 0.14, 0.06, mat('#6a6a66')); bd.position.set(0, 0.1, 0.2); DOC6.userData.head.add(bd); }
const HEART6 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), gl('#ffb0a0', 0.8)); HEART6.position.set(EX - 2.4, 1.35, -4.0); qs.add(HEART6);
const TW6 = box(0.5, 0.2, 0.4, mat('#2a2a2a')); TW6.position.set(EX + 3.0, 0.86, -4.5); qs.add(TW6); const PAPER6 = box(0.36, 0.4, 0.01, mat('#f4f0e6')); PAPER6.position.set(EX + 3.0, 1.12, -4.62); PAPER6.rotation.x = -0.2; qs.add(PAPER6);
const WR6 = [person(PALS[0], EX + 2.6, -3.7, Math.PI), person(WILL, EX + 3.4, -3.7, Math.PI)]; WR6.forEach(sit);
const PAGES6 = []; for (let i = 0; i < 6; i++) { const p = box(0.3, 0.4, 0.01, mat('#f4f0e6')); qs.add(p); PAGES6.push(p); }
const tWound = tag('天才青年と心理学者が、心の傷に向き合う', { size: 40, w: 980, bg: '#14161c', sx: 2.1 }); qs.add(tWound);
const tPair = tag('脚本は、親友どうしの若手俳優ふたり', { size: 42, w: 940, bg: '#e6b450', color: '#14161c', sx: 2.05 }); qs.add(tPair);

// ---------- shots ----------
const ALL = [tHard, tSolved, tJan, tGenius, tGang, tNoPlace, tProf, tDoc, t1997, tAward, tWound, tPair, Q1, ...SYM2];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotBoard(t, quiz = 0) { // 1段目 0〜9：大学の黒板に、だれも解けない問題。ある朝、だれかが解いていた（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.6;
  const solved = quiz ? 0 : clamp((t - 5.3) / 0.6); BOARD1B.material.transparent = true; BOARD1B.material.opacity = solved; BOARD1B.visible = solved > 0;
  STU1.forEach((p, i) => { p.userData.head.rotation.x = -0.25; p.userData.head.rotation.y = Math.sin(t * 0.6 + i) * 0.25; if (solved > 0.5) p.userData.arms[1].rotation.x = i === 1 ? -2.2 : -0.3; });
  Q1.position.set(-1.6, 2.9, -5.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tHard, 1.05); pin(tSolved, 1.05);
  if (!quiz) { tHard.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tHard.visible = false; tSolved.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.4, 1.0, u), lerp(1.8, 1.7, u), lerp(1.6, 0.8, u), 0.2, 1.7, -5.6, 62);
  return qs;
}
function shotMop(t) { // 2段目 9〜17：主人公は、大学で働く清掃員の青年。実は、とんでもない天才
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.4, '#0a0a0e');
  MOP2.rotation.z = Math.sin(t * 2.4) * 0.5; JAN2.userData.arms[1].rotation.x = -0.4; JAN2.userData.arms[0].rotation.x = -0.3; JAN2.rotation.y = 0.4 + Math.sin(t * 2.4) * 0.15;
  const g = t > 4.3; JAN2.userData.head.rotation.x = g ? -0.3 : 0.3;
  SYM2.forEach((m, i) => { m.visible = g && i < (t - 4.3) * 8; const a = i / 10 * Math.PI * 2 + t * 0.5; m.position.set(AX + Math.cos(a) * 1.3, 1.9 + Math.sin(a * 1.7) * 0.5, -3.6 + Math.sin(a) * 0.8); });
  const u = ease(t / 8);
  look(AX + lerp(1.6, 1.2, u), lerp(1.7, 1.8, u), lerp(-0.2, -0.6, u), AX, 1.4, -3.6, 62);
  pin(tJan, 1.05); pin(tGenius, 1.05);
  tJan.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJan.visible = false; tGenius.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotAlley(t) { // 3段目 17〜25：仲間とつるんで、ケンカざんまい。心を開ける場所が、どこにもない
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.3; S.darken(0.6, '#06060a');
  const alone = t > 4.3;
  PALS3.forEach((p, i) => { p.visible = !alone; p.userData.arms[1].rotation.x = -0.6 + Math.sin(t * 3 + i) * 0.4; p.userData.head.rotation.y = Math.sin(t + i) * 0.3; });
  RIVAL3.visible = !alone; RIVAL3.userData.arms[1].rotation.x = -1.3 + Math.sin(t * 5) * 0.2; WILL3.userData.arms[1].rotation.x = alone ? 0 : -1.4 + Math.sin(t * 5 + 1) * 0.3;
  WILL3.userData.head.rotation.x = alone ? 0.4 : 0; WILL3.rotation.y = alone ? 0.6 : 1.3;
  const u = ease(t / 8);
  look(BX + lerp(1.8, 1.2, u), lerp(1.8, 1.7, u), lerp(-0.6, -1.2, u), BX - 0.2, 1.2, -4.2, 62);
  pin(tGang, 1.05); pin(tNoPlace, 1.05);
  tGang.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGang.visible = false; tNoPlace.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotOffice(t) { // 4段目 25〜33：才能を見抜いた教授が、カウンセリングへ。出会ったのは、妻を亡くした心理学者
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 0.7;
  const second = t > 4.3;
  PROF4.userData.arms[1].rotation.x = -1.1 + Math.sin(t * 2) * 0.15; WILL4A.userData.arms.forEach(a => { a.rotation.x = -0.2; });
  DOC4.userData.head.rotation.x = 0.15 + Math.sin(t * 0.6) * 0.05; WILL4B.userData.head.rotation.y = -0.3;
  const u = ease(clamp((t - (second ? 4.3 : 0)) / 4));
  if (!second) look(CX - 3.2 + lerp(0.4, 0.2, u), 1.8, lerp(0.0, -0.6, u), CX - 3.2, 1.3, -3.6, 62);
  else look(CX + 3.2 + lerp(0.2, 0, u), 1.7, lerp(-0.6, -1.2, u), CX + 3.2, 1.0, -4.6, 62);
  pin(tProf, 1.05); pin(tDoc, 1.05);
  tProf.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tProf.visible = false; tDoc.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：1997年の、アメリカ映画。アカデミー賞で、脚本賞と助演男優賞
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCREEN5.material.color.setHSL(0.6, 0.22, 0.42 + Math.sin(t * 2.3) * 0.06);
  TROPHY5.forEach((g, i) => { g.visible = t > 4.3 + i * 0.25; g.rotation.y = t * 1.2; });
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.4, 2.3, u), lerp(2.4, 1.6, u), DX, 1.8, -4.5, 62);
  pin(t1997, 1.05); pin(tAward, 1.05);
  t1997.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1997.visible = false; tAward.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTalk(t) { // 6段目 42〜49（決め手）：天才青年と心理学者が、心の傷に向き合う。脚本は、親友どうしの若手俳優ふたり
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.5;
  const write = t > 3.6;
  DOC6.userData.arms[1].rotation.x = -0.8 + Math.sin(t * 1.5) * 0.15; WILL6.userData.head.rotation.x = 0.3 - clamp(t / 3) * 0.3;
  HEART6.visible = false; HEART6.scale.setScalar(1 + Math.sin(t * 3) * 0.15); HEART6.material.opacity = 0.4 + clamp(t / 3) * 0.5;
  WR6.forEach((p, i) => { p.userData.arms.forEach((a, k) => a.rotation.x = -1.2 + Math.sin(t * 14 + k + i) * 0.12); });
  PAGES6.forEach((p, i) => { const s = ((t * 0.5 + i / 6) % 1); p.visible = write; p.position.set(EX + 3.0 + Math.sin(i * 2 + t) * 0.6, 1.3 + s * 1.6, -4.6 + Math.cos(i) * 0.3); p.rotation.set(s * 2, i, s); });
  const u = ease(t / 7);
  if (!write) look(EX - 1.5 + lerp(0.2, 0, u), 1.7, lerp(-0.6, -1.2, u), EX - 1.5, 1.0, -4.3, 62);
  else { const v = ease(clamp((t - 3.6) / 1.2)); look(EX + lerp(-1.5, 3.0, v), lerp(1.7, 1.9, v), lerp(-1.2, -1.0, v), EX + lerp(-1.5, 3.0, v), 1.1, -4.4, 62); }
  pin(tWound, 1.05); pin(tPair, 1.05);
  if (t < 3.6) tWound.userData.pop((t - 0.3) / 0.35); else tPair.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（黒板の廊下に戻る）
  shotBoard(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotBoard(t, 0) },
  { a: 9, b: 17, f: shotMop },
  { a: 17, b: 25, f: shotAlley },
  { a: 25, b: 33, f: shotOffice },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotTalk },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '大学の黒板に、<br>だれも解けない問題。'],
  [5.6, 9.0, 'ある朝、だれかが<br>解いていた。'],
  [9.2, 13.2, '主人公は、大学で働く<br>清掃員の青年。'],
  [13.2, 17.0, '実は、とんでもない<br>天才。'],
  [17.2, 21.0, '仲間とつるんで、<br>ケンカざんまい。'],
  [21.0, 25.0, '心を開ける場所が、<br>どこにもない。'],
  [25.2, 29.0, '才能を見抜いた教授が、<br>カウンセリングへ。'],
  [29.0, 33.0, '出会ったのは、妻を<br>亡くした心理学者。'],
  [33.2, 37.4, '1997年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>脚本賞と助演男優賞。'],
  [42.2, 45.4, '天才青年と心理学者が、<br>心の傷に向き合う。'],
  [45.4, 49.0, '脚本は、親友どうしの<br>若手俳優ふたり。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、グッド・ウィル・<br>ハンティング。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q154', v2: true, answer: 'グッド・ウィル・ハンティング／旅立ち',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 15410,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [13.2, 'bubble'], [17.0, 'whoosh'], [21.0, 'drone', 0.4], [25.0, 'whoosh'], [29.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [45.4, 'bubble'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'グッド・ウィル・ハンティング': 'グッドウィルハンティング', 'カウンセリング': 'カウンセリング', 'アカデミー賞': 'アカデミーしょう', '助演男優賞': 'じょえんだんゆうしょう', '脚本賞': 'きゃくほんしょう', 'アメリカ映画': 'アメリカえいが', '1997年': 'せんきゅうひゃくきゅうじゅうななねん', '大学': 'だいがく', '黒板': 'こくばん', '解けない': 'とけない', '問題': 'もんだい', 'ある朝': 'あるあさ', '解いていた': 'といていた', '主人公': 'しゅじんこう', '働く': 'はたらく', '清掃員': 'せいそういん', '天才青年': 'てんさいせいねん', '青年': 'せいねん', '実は': 'じつは', '天才': 'てんさい', '仲間': 'なかま', '心を開ける': 'こころをひらける', '場所': 'ばしょ', '才能': 'さいのう', '見抜いた': 'みぬいた', '教授': 'きょうじゅ', '出会った': 'であった', '妻': 'つま', '亡くした': 'なくした', '心理学者': 'しんりがくしゃ', '心の傷': 'こころのきず', '向き合う': 'むきあう', '脚本': 'きゃくほん', '親友': 'しんゆう', '若手俳優': 'わかてはいゆう', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n大学の黒板に、だれも解けない問題。ある朝、だれかが解いていた。主人公は、大学で働く清掃員の青年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'Hulu', '映画好き', '名作映画'],
  },
});
applyQuizCards({ answer: 'グッド・ウィル・<br>ハンティング<span style="display:block;font-size:56px;margin-top:10px">／旅立ち</span>', info: 'Prime Video・Hulu｜映画・127分', answerSize: 92 });
