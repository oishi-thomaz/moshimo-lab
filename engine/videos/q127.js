import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #127 SPY×FAMILY（アニメ・日本・Season1 2022年4月〜。Netflix・FOD で見放題、
//   Filmarks の動画配信欄（Netflix・FOD・U-NEXT・DMM TV ほか見放題。2026年10月更新）と JustWatch 日本版 justwatch.com/jp/テレビ番組/spyxfamily
//   （見放題：Netflix・FOD・Hulu・Prime Video・Disney Plus ほか）で2026/11/22確認。Filmarks Season1 第1クール 4.1・レビュー55,187件 filmarks.com/animes/3243/4112）
// 確かめた事実（2026/11/22）：
//   ・東国と西国は十数年にわたる冷戦状態。水面下で熾烈な情報戦。西国の凄腕スパイが、“一週間以内に家族を作り、名門校の懇親会に潜入せよ”という任務を課される。
//     精神科医に扮して家族を作る。娘は心を読める超能力者、妻は殺し屋。お互いの正体を隠しながら共に暮らす仮初めの家族（Filmarks の作品紹介）
//   ・名門校に子供を入学させるため、孤児の女の子を引き取る（Hulu の第1話のページ hulu.jp/watch/100108733）
//   ・2022年4月9日 放送開始・日本（Filmarks の作品情報）
// 構成（ヒント6段）：1 男が施設から女の子を引き取った・本当の目的はひみつ → 2 主人公は凄腕のスパイ・表の顔は精神科医
//   → 3 ふたつの国がにらみ合う時代・水面下で情報戦 → 4 任務は1週間以内に家族を作ること・名門校に子どもを入学させるため
//   → 5 2022年に放送が始まった日本のアニメ・3人とも正体を隠している → 6 決め手：娘は心が読めて妻は殺し屋・スパイと家族
// 登場人物の名前・国の名前・作戦名・組織名は出さない。キャラクターの髪型・髪の色・服・顔は似せない（女の子は茶色の髪、母は黒い服にしない）。
// アニメの絵・ポスター・ロゴは使わない。有名な場面の構図はなぞらない。人は汎用の3D。物語の後半の出来事は言わない
const S = quizStage({ bg: '#c8ccd8', floor: '#7a7a80', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(12710);

const DAD = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#4a5a6a', pants: '#2a3040', tie: true };
const DOC = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#f0f0f0', pants: '#3a4050' };
const MOM = { skin: '#f4d3b5', hair: '#9a5a30', shirt: '#4a7a8a', pants: '#e8e0d0', skirt: true };
const KID = { skin: '#f4d3b5', hair: '#8a5a3a', shirt: '#e8d0a0', pants: '#5a4a6a', long: true, skirt: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, s = 1) { const p = makePerson(o); p.scale.setScalar(s); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function bubble(c = '#ffffff') { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = c; g.beginPath(); g.ellipse(64, 54, 56, 42, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(30, 104, 10, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(16, 120, 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3a3a48'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(40 + i * 24, 54, 7, 0, Math.PI * 2); g.fill(); } }), transparent: true, depthTest: false }));
  s.renderOrder = 7; s.scale.set(0.6, 0.6, 1); qs.add(s); return s; }

// ---------- 1段目. 古い施設の前（x=0）。コートの男が、小さな女の子の手を引いて出てくる ----------
{ const gr = box(20, 0.04, 14, mat('#8a8a84')); gr.position.set(0, 0.02, -2); qs.add(gr);
  const bd = box(10, 5, 3, mat('#9a8a7a')); bd.position.set(0, 2.5, -7); qs.add(bd);
  const dr = box(1.6, 2.4, 0.1, mat('#5a3a2a')); dr.position.set(0, 1.2, -5.45); qs.add(dr);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), gl('#5a6a7a')); w.position.set(-4 + i * (i < 2 ? 1.6 : 2.4) + (i > 1 ? 1.6 : 0), 3.4, -5.48); qs.add(w); }
  const fn = box(20, 1.2, 0.1, mat('#6a6a66')); fn.position.set(0, 0.6, -5.3); fn.scale.x = 0.35; fn.position.x = -6; qs.add(fn); const fn2 = fn.clone(); fn2.position.x = 6; qs.add(fn2); }
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), skyTex('#8a9ab0', '#e0e4ea')); SKY1.position.set(0, 12, -40); qs.add(SKY1);
const DAD1 = person(DAD, -0.35, -4.4, 0);
const COAT1 = box(0.56, 0.9, 0.34, mat('#5a5a4a')); COAT1.position.y = 1.0; DAD1.add(COAT1);
const KID1 = person(KID, 0.35, -4.4, 0, 0.62);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tTake = tag('女の子を、引き取った男', { size: 54, w: 680, bg: '#14161c', sx: 2.2 }); qs.add(tTake);
const tSecret = tag('本当の目的は、ひみつ', { size: 56, w: 640, bg: '#e24050', sx: 2.1 }); qs.add(tSecret);

// ---------- 2段目. 診察室（x=50）。白衣の男。部屋が暗くなると、机の下の秘密の書類と通信機 ----------
const AX = 50;
{ const fl = box(10, 0.04, 8, mat('#b8a890')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.4, 0.2, mat('#e8e4dc')); wl.position.set(AX, 2.2, -4.6); qs.add(wl);
  const dk = box(2.4, 0.1, 1.2, mat('#8a6a4a')); dk.position.set(AX, 0.9, -2.8); qs.add(dk); const dl = box(2.2, 0.86, 1.0, mat('#6a4a30')); dl.position.set(AX, 0.43, -2.8); qs.add(dl);
  const sh = box(1.6, 2.6, 0.5, mat('#7a5a3a')); sh.position.set(AX + 3, 1.3, -4.2); qs.add(sh);
  for (let i = 0; i < 10; i++) { const b = box(0.12, 0.5, 0.36, mat(['#4a5a8a', '#8a4a3a', '#4a7a5a'][i % 3])); b.position.set(AX + 2.4 + (i % 5) * 0.28, 1.0 + Math.floor(i / 5) * 0.8, -4.1); qs.add(b); }
  const cc = box(0.8, 0.5, 0.8, mat('#a8c0b8')); cc.position.set(AX - 2.6, 0.25, -2.6); qs.add(cc); const cb = box(2.0, 0.3, 0.8, mat('#a8c0b8')); cb.position.set(AX - 2.6, 0.5, -2.2); qs.add(cb); }
const DOC2 = person(DOC, AX, -3.6, 0); DOC2.userData.legs.forEach(l => l.rotation.x = -1.45); DOC2.position.y = -0.36;
const CHAIR2 = box(0.6, 0.48, 0.6, mat('#3a3a40')); CHAIR2.position.set(AX, 0.24, -3.75); qs.add(CHAIR2);
const FILE2 = new THREE.Group(); { const f = box(0.6, 0.03, 0.44, mat('#c8a060')); FILE2.add(f); const ph = box(0.22, 0.031, 0.28, mat('#3a3a40')); ph.position.set(-0.12, 0.01, 0); FILE2.add(ph); }
FILE2.position.set(AX + 0.2, 0.97, -2.6); qs.add(FILE2);
const RADIO2 = box(0.3, 0.16, 0.2, mat('#2a2a2a')); RADIO2.position.set(AX - 0.6, 1.03, -2.8); qs.add(RADIO2);
const ANT2 = box(0.02, 0.4, 0.02, mat('#8a8a8a')); ANT2.position.set(AX - 0.5, 1.3, -2.8); qs.add(ANT2);
const LED2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), gl('#ff3030')); LED2.position.set(AX - 0.68, 1.06, -2.69); qs.add(LED2);
const tSpy = tag('凄腕の、スパイ', { size: 58, w: 480, bg: '#14161c', sx: 1.8 }); tSpy.position.set(AX, 2.7, -3.4); qs.add(tSpy);
const tDoc = tag('表の顔は、精神科医', { size: 56, w: 600, bg: '#e24050', sx: 2.1 }); tDoc.position.set(AX, 2.7, -3.4); qs.add(tDoc);

// ---------- 3段目. 夜の国境（x=100）。高い壁と見張り台、サーチライト。両側の街 ----------
const BX = 100;
{ const gr = box(40, 0.04, 30, mat('#4a4a50')); gr.position.set(BX, 0.02, -8); qs.add(gr);
  const wl = box(40, 3.2, 0.5, mat('#8a8a88')); wl.position.set(BX, 1.6, -6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const tw = box(1.2, 6, 1.2, mat('#6a6a6a')); tw.position.set(BX - 8 + i * 8, 3, -6); qs.add(tw); const cab = box(1.8, 1.0, 1.8, mat('#5a5a5a')); cab.position.set(BX - 8 + i * 8, 6.4, -6); qs.add(cab); }
  for (let i = 0; i < 16; i++) { const h = 2 + R() * 7; const b = box(2, h, 2, mat(i % 2 ? '#3a3e4a' : '#4a3e3a')); b.position.set(BX - 20 + i * 2.6, h / 2, i % 2 ? -16 : 2.0 + R()); if (i % 2 === 0) b.position.z = -12 - R() * 3; qs.add(b);
    for (let k = 0; k < 4; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), gl('#ffd890')); w.position.set(b.position.x - 0.5 + R(), 0.8 + R() * (h - 1), b.position.z + 1.01); qs.add(w); } } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#0e1428', '#2a3048')); SKY3.position.set(BX, 12, -38); qs.add(SKY3);
const BEAMS3 = [0, 1, 2].map(i => { const c = new THREE.Mesh(new THREE.ConeGeometry(1.4, 12, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff6d0', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); c.position.set(BX - 8 + i * 8, 6.4, -6); qs.add(c); return c; });
const tTwo = tag('にらみ合う、ふたつの国', { size: 54, w: 680, bg: '#14161c', sx: 1.9 }); tTwo.position.set(BX, 3.55, 0.6); qs.add(tTwo);
const tIntel = tag('水面下で、情報戦', { size: 58, w: 540, bg: '#e24050', sx: 1.6 }); tIntel.position.set(BX, 3.55, 0.6); qs.add(tIntel);

// ---------- 4段目. 立派な学校の門の前（x=150）。7日分の日めくり。父・母・娘の3人が並ぶ ----------
const CX = 150;
{ const gr = box(24, 0.04, 16, mat('#9aa08a')); gr.position.set(CX, 0.02, -4); qs.add(gr);
  const sc = box(16, 6, 3, mat('#e8e0d0')); sc.position.set(CX, 3, -12); qs.add(sc);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(9.4, 2.4, 4), mat('#6a4a4a')); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.25; rf.position.set(CX, 7.2, -12); qs.add(rf);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 12), mat('#f4f0e8')); c.position.set(CX - 5 + i * 2, 2.5, -10.3); qs.add(c); }
  for (const s of [-1, 1]) { const p = box(0.8, 3.2, 0.8, mat('#a89a88')); p.position.set(CX + s * 2.6, 1.6, -6); qs.add(p); }
  const gt = box(4.4, 0.3, 0.2, mat('#3a3a3a')); gt.position.set(CX, 3.0, -6); qs.add(gt);
  for (let i = 0; i < 4; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), mat('#4a7a4a')); tr.position.set(CX + (i < 2 ? -6 - i * 2 : 6 + (i - 2) * 2), 2.2, -7); qs.add(tr); } }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#6aa0e0', '#e8f0f8')); SKY4.position.set(CX, 12, -40); qs.add(SKY4);
const FAM4 = [person(DAD, CX - 0.7, -2.6, Math.PI), person(KID, CX, -2.6, Math.PI, 0.62), person(MOM, CX + 0.7, -2.6, Math.PI)];
const DAYS4 = []; for (let i = 0; i < 7; i++) { const d = tag(String(7 - i), { size: 80, w: 130, h: 150, bg: '#f4f0e8', color: '#c83a3a', sx: 0.42 }); qs.add(d); DAYS4.push(d); }
const tWeek = tag('1週間以内に、家族を作れ', { size: 52, w: 740, bg: '#14161c', sx: 2.0 }); tWeek.position.set(CX, 3.4, -3.2); qs.add(tWeek);
const tSchool = tag('名門校に、入学させるため', { size: 52, w: 740, bg: '#e24050', sx: 2.0 }); tSchool.position.set(CX, 3.4, -3.2); qs.add(tSchool);

// ---------- 5段目. 夜の家のリビング（x=200）。テーブルを囲む3人。テレビの光 ----------
const TX = 200;
{ const fl = box(10, 0.04, 8, mat('#a08060')); fl.position.set(TX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.2, 0.2, mat('#d8cfc0')); wl.position.set(TX, 2.1, -4.6); qs.add(wl);
  const tb = box(2.2, 0.08, 1.2, mat('#8a6040')); tb.position.set(TX, 0.8, -2.4); qs.add(tb); const tl = box(2.0, 0.78, 1.0, mat('#6a4a30')); tl.position.set(TX, 0.39, -2.4); qs.add(tl);
  const lamp = new THREE.PointLight('#ffd090', 5, 7); lamp.position.set(TX, 2.6, -2.2); qs.add(lamp);
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.3, 16, 1, true), gl('#f0d0a0')); lp.position.set(TX, 2.6, -2.4); qs.add(lp); }
const FAM5 = [person(DAD, TX - 1.3, -2.4, Math.PI / 2), person(KID, TX, -1.55, Math.PI, 0.62), person(MOM, TX + 1.3, -2.4, -Math.PI / 2)];
FAM5.forEach(p => { p.userData.legs.forEach(l => l.rotation.x = -1.45); });
FAM5[0].position.y = -0.36; FAM5[2].position.y = -0.36; FAM5[1].position.y = 0.05;
const MASK5 = FAM5.map(() => { const m = tag('？', { size: 80, w: 110, h: 110, bg: '#3a3a48', sx: 0.3 }); qs.add(m); return m; });
const t2022 = tag('2022年から、日本のアニメ', { size: 52, w: 740, bg: '#e6b450', color: '#14161c', sx: 2.4 }); t2022.position.set(TX, 3.0, -2.6); qs.add(t2022);
const tHide = tag('3人とも、正体をかくす', { size: 54, w: 680, bg: '#e24050', sx: 2.2 }); tHide.position.set(TX, 3.0, -2.6); qs.add(tHide);

// ---------- 6段目. 家の前（x=250）。女の子のまわりに、家族の心の声の吹き出し。母の影には細い刃物 ----------
const DX = 250;
{ const gr = box(16, 0.04, 12, mat('#9a9a90')); gr.position.set(DX, 0.02, -2); qs.add(gr);
  const hs = box(8, 5, 3, mat('#d8c8b0')); hs.position.set(DX, 2.5, -6.5); qs.add(hs);
  const dr = box(1.2, 2.2, 0.1, mat('#6a4a30')); dr.position.set(DX, 1.1, -4.95); qs.add(dr);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), gl('#ffe0a0')); w.position.set(DX + s * 2.4, 2.6, -4.98); qs.add(w); } }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), skyTex('#e8906a', '#f8d8b0')); SKY6.position.set(DX, 12, -40); qs.add(SKY6);
const FAM6 = [person(DAD, DX - 0.8, -2.4, 0), person(KID, DX, -2.0, 0, 0.62), person(MOM, DX + 0.8, -2.4, 0)];
const BUB6 = [bubble(), bubble(), bubble()];
const BLADE6 = new THREE.Group(); { const b = box(0.04, 0.5, 0.01, new THREE.MeshBasicMaterial({ color: '#e0e4ec' })); b.position.y = 0.3; BLADE6.add(b); const h = box(0.06, 0.14, 0.04, mat('#3a2a2a')); BLADE6.add(h); }
qs.add(BLADE6);
const SHADOW6 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshBasicMaterial({ map: canvasTex(128, 256, (g) => { g.fillStyle = 'rgba(20,10,20,0.75)'; g.fillRect(34, 40, 60, 120); g.beginPath(); g.arc(64, 28, 24, 0, Math.PI * 2); g.fill(); g.fillRect(38, 160, 20, 90); g.fillRect(70, 160, 20, 90);
  g.fillRect(90, 60, 36, 14); g.fillStyle = 'rgba(220,40,60,0.9)'; g.fillRect(118, 20, 6, 50); }), transparent: true }));
SHADOW6.position.set(DX + 1.4, 1.0, -4.9); qs.add(SHADOW6);
const tPower = tag('娘は心が読めて、妻は殺し屋', { size: 50, w: 800, bg: '#14161c', sx: 2.5 }); qs.add(tPower);
const tFake = tag('スパイと、家族', { size: 58, w: 460, bg: '#e6b450', color: '#14161c', sx: 1.7 }); qs.add(tFake);

// ---------- shots ----------
const ALL = [tTake, tSecret, tSpy, tDoc, tTwo, tIntel, tWeek, tSchool, t2022, tHide, tPower, tFake, Q1, ...DAYS4, ...MASK5, ...BUB6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotGate(t, quiz = 0) { // 1段目 0〜9：ある日、男が施設から女の子を引き取った。でも本当の目的は、ひみつ（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.05;
  const k = quiz ? 0.4 : clamp(t / 9);
  [DAD1, KID1].forEach((p, i) => { p.position.z = -4.4 + k * 2.2; poseWalk(p, t * 4 + i, quiz ? 0 : 0.6); });
  DAD1.userData.arms[1].rotation.x = -0.4; KID1.userData.arms[0].rotation.set(-0.9, 0, 0.3); KID1.userData.head.rotation.x = -0.35;
  if (t > 4.6 && !quiz) DAD1.userData.head.rotation.y = 0.6; else DAD1.userData.head.rotation.y = 0;
  const z = DAD1.position.z;
  Q1.position.set(0.95, 1.55, z); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tTake.position.set(0, 2.9, z - 0.4); tSecret.position.set(0, 2.9, z - 0.4);
  if (!quiz) { tTake.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tTake.visible = false; tSecret.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(1.7, 1.6, u), z + lerp(4.0, 3.4, u), 0, 1.3, z - 0.5, 62);
  return qs;
}
function shotClinic(t) { // 2段目 9〜17：主人公は、凄腕のスパイ。表の顔は、精神科医
  base(); S.aim(AX, -2); lift(0);
  const spy = t < 4.2;
  if (spy) { S.darken(0.75, '#08080e'); S.hemi.intensity = 0.35; S.key.intensity = 0.25; DOC2.userData.head.rotation.y = Math.sin(t * 1.4) * 0.5; DOC2.userData.arms[1].rotation.x = -1.2; LED2.visible = Math.floor(t * 3) % 2 === 0; }
  else { S.hemi.intensity = 1.25; DOC2.userData.head.rotation.y = 0; DOC2.userData.arms[1].rotation.x = -0.9; LED2.visible = false; }
  FILE2.visible = RADIO2.visible = ANT2.visible = spy;
  tSpy.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSpy.visible = false; tDoc.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.8, -0.4, u), lerp(2.2, 2.1, u), lerp(1.2, 0.6, u), AX, 1.4, -3.2, 62);
  return qs;
}
function shotBorder(t) { // 3段目 17〜25：舞台は、ふたつの国がにらみ合う時代。水面下で、情報戦がくり広げられている
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.35;
  BEAMS3.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.8 + i * 2) * 0.6; b.rotation.x = 0.3; b.position.y = 6.4 - 5.6 * Math.cos(b.rotation.z) * 0.0; });
  tTwo.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTwo.visible = false; tIntel.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  const cx = BX + 4 + lerp(-1.0, 1.0, u); tTwo.position.x = tIntel.position.x = cx;
  look(cx, lerp(3.0, 2.9, u), lerp(5.2, 4.6, u), cx, 3.2, -6, 62);
  return qs;
}
function shotSchool(t) { // 4段目 25〜33：任務は、1週間以内に家族を作ること。名門校に、子どもを入学させるため
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.25;
  const late = t > 4.2;
  DAYS4.forEach((d, i) => { if (late) return; const k = clamp((t - 0.6 - i * 0.45) / 0.3); d.visible = k > 0 && i === Math.min(6, Math.floor((t - 0.6) / 0.45)); d.position.set(CX + 1.1, 2.3, -2.4); d.userData.pop(1); });
  FAM4.forEach((p, i) => { p.userData.head.rotation.x = late ? -0.25 : 0; });
  tWeek.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWeek.visible = false; tSchool.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  if (!late) look(CX + 0.2, 1.8, 1.2, CX + 0.2, 1.7, -3, 62);
  else look(CX + lerp(0.4, 0.2, u), 1.4, lerp(2.0, 1.2, u), CX, 2.6, -8, 64);
  return qs;
}
function shotHome(t) { // 5段目 33〜42：2022年に放送が始まった、日本のアニメ。家族3人とも、正体をかくしている
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#1a1410');
  FAM5.forEach((p, i) => { p.userData.arms[i % 2].rotation.x = -1.0 + Math.sin(t * 3 + i) * 0.15; });
  if (t > 4.2) MASK5.forEach((m, i) => { const p = FAM5[i]; m.position.set(p.position.x + (i === 1 ? 0.35 : 0.0), (i === 1 ? 1.25 : 1.75) + Math.sin(t * 2 + i) * 0.03, p.position.z - (i === 1 ? 0 : 0) + (i === 1 ? 0 : 0.0)); m.position.y += 0.35; m.userData.pop((t - 4.4 - i * 0.2) / 0.3); });
  t2022.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2022.visible = false; tHide.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.4, 0.3, u), lerp(2.4, 2.3, u), lerp(2.6, 2.0, u), TX, 1.4, -2.4, 62);
  return qs;
}
function shotDoor(t) { // 6段目 42〜49（決め手）：娘は人の心が読めて、妻は殺し屋！ スパイと、家族
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.1;
  BUB6.forEach((b, i) => { const p = FAM6[[0, 2, 1][i]]; const k = clamp((t - 0.6 - i * 0.4) / 0.4); b.visible = k > 0; b.material.opacity = k; b.position.set(p.position.x + (i === 2 ? 0.4 : 0.3), (i === 2 ? 1.5 : 2.3) + Math.sin(t * 2 + i) * 0.04, p.position.z); });
  FAM6[1].userData.head.rotation.y = Math.sin(t * 1.6) * 0.5;
  BLADE6.position.set(DX + 1.18, 0.55, -2.25); BLADE6.rotation.z = 0.2; BLADE6.visible = t > 2.0;
  FAM6[2].userData.arms[0].rotation.x = -0.2;
  tPower.position.set(DX, 3.3, -2.4); tFake.position.set(DX, 3.3, -2.4);
  if (t < 3.6) tPower.userData.pop((t - 0.3) / 0.35); else tFake.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.3, 0.1, u), lerp(1.8, 1.9, u), lerp(2.8, 2.3, u), DX, 1.7, -2.4, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（施設の前に戻る）
  shotGate(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotGate(t, 0) },
  { a: 9, b: 17, f: shotClinic },
  { a: 17, b: 25, f: shotBorder },
  { a: 25, b: 33, f: shotSchool },
  { a: 33, b: 42, f: shotHome },
  { a: 42, b: 49, f: shotDoor },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、男が施設から<br>女の子を引き取った。'],
  [5.6, 9.0, 'でも、本当の目的は<br>ひみつ。'],
  [9.2, 13.2, '主人公は、<br>凄腕のスパイ。'],
  [13.2, 17.0, '表の顔は、<br>精神科医。'],
  [17.2, 21.0, '舞台は、ふたつの国が<br>にらみ合う時代。'],
  [21.0, 25.0, '水面下で、情報戦が<br>くり広げられている。'],
  [25.2, 29.0, '任務は、1週間以内に<br>家族を作ること。'],
  [29.0, 33.0, '名門校に、子どもを<br>入学させるため。'],
  [33.2, 37.4, '2022年に放送が始まった、<br>日本のアニメ。'],
  [37.4, 41.8, '家族3人とも、<br>正体をかくしている。'],
  [42.2, 45.4, '娘は人の心が読めて、<br>妻は殺し屋！'],
  [45.4, 49.0, 'タイトルは、<br>スパイと、家族。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>スパイファミリー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q127', v2: true, answer: 'SPY×FAMILY',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'hopeful', seed: 12710,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [9.6, 'buzz', 0.3], [17.0, 'whoosh'], [17.6, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.8, 'bubble', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ある日': 'あるひ', '男': 'おとこ', '施設': 'しせつ', '女の子': 'おんなのこ', '引き取った': 'ひきとった', '本当': 'ほんとう', '目的': 'もくてき', '主人公': 'しゅじんこう', '凄腕': 'すごうで', '表の顔': 'おもてのかお', '精神科医': 'せいしんかい', '舞台': 'ぶたい', '国': 'くに', '時代': 'じだい', '水面下': 'すいめんか', '情報戦': 'じょうほうせん', '広げられて': 'ひろげられて', '任務': 'にんむ', '1週間以内': 'いっしゅうかんいない', '家族': 'かぞく', '作る': 'つくる', '名門校': 'めいもんこう', '子ども': 'こども', '入学': 'にゅうがく', '2022年': 'にせんにじゅうにねん', '放送': 'ほうそう', '始まった': 'はじまった', '日本': 'にほん', '3人': 'さんにん', '正体': 'しょうたい', '娘': 'むすめ', '人の心': 'ひとのこころ', '読めて': 'よめて', '妻': 'つま', '殺し屋': 'ころしや', '作品': 'さくひん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この作品のタイトル、わかる？\nある日、男が施設から女の子を引き取った。でも、本当の目的はひみつ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'FOD', 'アニメ好き', '日本のアニメ'],
  },
});
applyQuizCards({ answer: 'SPY×FAMILY', info: 'Netflix・FOD｜日本のアニメ', answerSize: 112 });
