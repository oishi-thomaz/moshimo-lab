import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #155 チェンソーマン（アニメ・日本・2022年10月11日〜・第1期 全12話。Netflix・Prime Video で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/chiensoman/シーズン-1（Netflix, Amazon Prime Video, Disney Plus, Hulu, U-NEXT ほかで配信中・12話）と
//   Netflix の作品ページ netflix.com/jp/title/81215627（日本で配信中）で2026/11/28確認。Filmarks 4.1・レビュー56,073件 filmarks.com/animes/1874/2452）
// 確かめた事実（2026/11/28）：
//   ・Filmarks のあらすじ：「チェンソーの悪魔」と共にデビルハンターとして暮らす少年。親が遺した借金返済のため、貧乏な生活を送る中、裏切りに遭い殺されてしまう。
//     薄れる意識の中、相棒の悪魔と契約し、悪魔の心臓を持つものとして蘇る
//   ・Netflix の紹介：デビルハンターの少年は裏切りにあって殺されるが、相棒であるチェンソーの悪魔と契約して生き返る。その身に悪魔の力を宿した少年は公安に
//     スカウトされ、壮絶な悪魔狩りに身を投じてゆく
//   ・Filmarks filmarks.com/movies/113963 ：劇場版 チェンソーマン レゼ篇（2025年製作の映画）
// 構成（ヒント6段）：1 ボロ小屋に少年と小さな相棒・親の借金を返すだけの毎日 → 2 仕事は悪魔を退治すること・ある夜、裏切られてしまう
//   → 3 悪魔が人をおそう世界・悪魔と契約すれば力が手に入る → 4 相棒と契約してよみがえる・悪魔を狩る組織にスカウトされる
//   → 5 2022年に放送された日本のアニメ・続きの物語は映画にもなった → 6 決め手：相棒は頭にチェンソーのついた悪魔・変身すると頭と腕からチェンソー
// 後の展開・結末は言わない。登場人物の名前は出さない。アニメの絵・キャラクターの見た目・ロゴは使わない。血や残酷な場面は出さない。人は汎用の3D
const S = quizStage({ bg: '#1a1a20', floor: '#2a2824', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(15510);

const BOY = { skin: '#f1c9a5', hair: '#d8a040', shirt: '#e8e4d8', pants: '#2a2a30' };
const BOYS = { ...BOY, shirt: '#ffffff', pants: '#1a1a1e', tie: true };
const SUIT = [{ skin: '#e8c09a', hair: '#1a1a1a', shirt: '#1a1a1e', pants: '#1a1a1e', tie: true }, { skin: '#f1c9a5', hair: '#2a2420', shirt: '#1a1a1e', pants: '#1a1a1e', tie: true, long: true }, { skin: '#e0b08a', hair: '#3a2a20', shirt: '#1a1a1e', pants: '#1a1a1e', tie: true }];
const SHADY = { skin: '#c8a888', hair: '#0a0a0a', shirt: '#2a2a30', pants: '#2a2a30' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function saw(len = 0.7) { const g = new THREE.Group(); const bar = box(0.12, len, 0.05, mat('#9aa0a8')); bar.position.y = len / 2; g.add(bar);
  const teeth = []; for (let i = 0; i < 8; i++) { const tt = box(0.04, 0.05, 0.06, mat('#d8dce0')); tt.position.set(i % 2 ? 0.07 : -0.07, 0.05 + i * len / 8, 0); g.add(tt); teeth.push(tt); }
  const eng = box(0.2, 0.18, 0.16, mat('#d86a1a')); eng.position.y = 0.02; g.add(eng); g.userData.teeth = teeth; return g; }
function buddy(withSaw) { const g = new THREE.Group(); const o = mat('#e8862a');
  const body = box(0.42, 0.3, 0.55, o); body.position.y = 0.3; g.add(body); const head = box(0.36, 0.3, 0.32, o); head.position.set(0, 0.48, 0.3); g.add(head);
  for (const s of [-1, 1]) { const e = box(0.05, 0.05, 0.02, mat('#1a1a1a')); e.position.set(s * 0.08, 0.5, 0.465); g.add(e); }
  const tg = box(0.08, 0.02, 0.06, mat('#e06080')); tg.position.set(0, 0.38, 0.47); g.add(tg);
  for (const [x, z] of [[-0.14, -0.18], [0.14, -0.18], [-0.14, 0.18], [0.14, 0.18]]) { const l = box(0.09, 0.16, 0.09, o); l.position.set(x, 0.08, z); g.add(l); }
  const tail = box(0.06, 0.06, 0.2, o); tail.position.set(0, 0.36, -0.36); tail.rotation.x = 0.5; g.add(tail);
  if (withSaw) { const s = saw(0.5); s.position.set(0, 0.62, 0.32); s.rotation.x = 0.35; g.add(s); g.userData.saw = s; }
  g.userData.tail = tail; return g; }
function monster(c = '#5a3a6a', s = 1) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat(c)); b.scale.set(1.2, 1.4, 1); b.position.y = 1.4; g.add(b);
  const eyes = []; for (let i = 0; i < 5; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09 + R() * 0.06, 8, 6), gl('#f0e040')); e.position.set(-0.5 + i * 0.25, 1.6 + Math.sin(i * 2) * 0.25, 0.92); g.add(e); eyes.push(e); }
  for (let i = 0; i < 4; i++) { const a = box(0.18, 1.0, 0.18, mat(c)); a.position.set(-0.9 + i * 0.6, 0.4, 0.3); a.rotation.z = (i - 1.5) * 0.3; g.add(a); }
  g.scale.setScalar(s); g.userData.eyes = eyes; return g; }

// ---------- 1段目. ボロ小屋（x=0）。古いふとん、空っぽの箱、請求書の束、少年とオレンジ色の小さな相棒 ----------
{ const fl = box(6, 0.04, 6, mat('#6a5a46')); fl.position.set(0, 0.02, -3); qs.add(fl); const wl = box(6, 2.8, 0.2, mat('#7a6a54')); wl.position.set(0, 1.4, -6); qs.add(wl);
  const sw = box(0.2, 2.8, 6, mat('#6e5e4a')); sw.position.set(-3, 1.4, -3); qs.add(sw);
  for (let i = 0; i < 4; i++) { const pl = box(0.6, 0.6, 0.04, mat(['#8a7a60', '#5a4a3a'][i % 2])); pl.position.set(-2 + i * 1.3, 1.6 + (i % 2) * 0.4, -5.88); pl.rotation.z = (R() - 0.5) * 0.3; qs.add(pl); }
  const fu = box(1.4, 0.12, 2.0, mat('#a8a090')); fu.position.set(-1.4, 0.08, -3.6); qs.add(fu);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gl('#ffe0a0')); bulb.position.set(0, 2.5, -3.2); qs.add(bulb);
  const L = new THREE.PointLight('#ffd890', 3.0, 7); L.position.set(0, 2.4, -3.0); qs.add(L); }
const BILLS1 = []; for (let i = 0; i < 9; i++) { const b = box(0.3, 0.01, 0.4, mat(i % 3 ? '#f0ece0' : '#f0c8c0')); b.position.set(0.8 + (R() - 0.5) * 0.8, 0.04 + i * 0.012, -3.0 + (R() - 0.5) * 0.6); b.rotation.y = R() * 3; qs.add(b); BILLS1.push(b); }
const BOY1 = person(BOY, -0.3, -3.4, 0.5); BOY1.userData.legs.forEach(l => l.rotation.x = -1.4); BOY1.position.y = -0.45;
const BUD1 = buddy(false); BUD1.position.set(0.4, 0, -3.8); BUD1.rotation.y = -0.6; qs.add(BUD1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tHut = tag('ボロ小屋に、少年と小さな相棒', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tHut);
const tDebt = tag('親の借金を、返すだけの毎日', { size: 48, w: 820, bg: '#8e5bd0', sx: 1.85 }); qs.add(tDebt);

// ---------- 2段目. 夜の森（x=50）。目がたくさんある黒い怪物に向かう少年 → 背後に忍び寄る黒い服の男たち ----------
const AX = 50;
{ const gr = box(24, 0.04, 24, mat('#1e2a1e')); gr.position.set(AX, 0.02, -6); qs.add(gr);
  for (let i = 0; i < 14; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 5, 8), mat('#2a2018')); t.position.set(AX - 7 + R() * 14, 2.5, -4 - R() * 10); qs.add(t); const c = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 8), mat('#16241a')); c.position.set(t.position.x, 4.6, t.position.z); qs.add(c); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), new THREE.MeshBasicMaterial({ color: '#e8e0c0', fog: false })); moon.position.set(AX + 6, 12, -40); qs.add(moon);
  const L = new THREE.PointLight('#a8b8e0', 2.2, 14); L.position.set(AX, 4, -2); qs.add(L); }
const MON2 = monster(); MON2.position.set(AX + 0.6, 0, -7.0); qs.add(MON2);
const BOY2 = person(BOY, AX - 0.3, -3.6, Math.PI);
const AXE2 = new THREE.Group(); { const h = box(0.05, 0.8, 0.05, mat('#7a5a3a')); h.position.y = -0.3; AXE2.add(h); const bl = box(0.04, 0.22, 0.26, mat('#b8c0c8')); bl.position.set(0, -0.68, 0.12); AXE2.add(bl); }
AXE2.position.set(0, -0.55, 0.05); BOY2.userData.arms[1].add(AXE2);
const SHADY2 = [0, 1, 2].map(i => person(SHADY, AX - 1.6 + i * 1.4, -0.6 - (i % 2) * 0.4, Math.PI));
const tHunt = tag('仕事は、悪魔を退治すること', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tHunt);
const tBetray = tag('ある夜、裏切られてしまう', { size: 52, w: 720, bg: '#8e5bd0', sx: 1.75 }); qs.add(tBetray);

// ---------- 3段目. 夜の街（x=100）。ビルの上にのしかかる巨大な影、逃げる人たち、紙に光る印（契約） ----------
const BX = 100;
{ const rd = box(14, 0.04, 30, mat('#3a3a3e')); rd.position.set(BX, 0.02, -10); qs.add(rd);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const h = 5 + R() * 6; const b = box(4, h, 4, mat('#3a3e48')); b.position.set(BX + s * 5.5, h / 2, -2 - i * 5.5); qs.add(b);
    for (let k = 0; k < 6; k++) if (R() > 0.4) { const w = box(0.05, 0.5, 0.6, gl('#ffd890')); w.position.set(BX + s * 3.48, 1.2 + k * 1.2, -1 - i * 5.5 + (k % 2) * 1.2); qs.add(w); } }
  const L = new THREE.PointLight('#c8a0ff', 2.4, 20); L.position.set(BX, 6, -8); qs.add(L); }
const MON3 = monster('#3a1e3a', 3.2); MON3.position.set(BX + 1, 0, -22); qs.add(MON3);
const RUN3 = [0, 1, 2, 3].map(i => person([BOY, ...SUIT][i % 4], BX - 1.5 + i * 1.0, -6 - i * 0.8, 0));
const PACT3 = new THREE.Group(); { const pp = box(0.6, 0.8, 0.01, mat('#f0e8d0')); PACT3.add(pp); const seal = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.18, 24), gl('#e04040')); seal.position.z = 0.01; PACT3.add(seal);
  for (let i = 0; i < 5; i++) { const l = box(0.4, 0.015, 0.005, mat('#5a4a3a')); l.position.set(0, 0.3 - i * 0.07, 0.008); PACT3.add(l); } }
PACT3.position.set(BX, 2.2, -3.4); qs.add(PACT3);
const PGLOW3 = new THREE.PointLight('#ff6060', 0, 4); PGLOW3.position.set(BX, 2.2, -3.0); qs.add(PGLOW3);
const tWorld = tag('悪魔が、人をおそう世界', { size: 52, w: 720, bg: '#14161c', sx: 1.75 }); qs.add(tWorld);
const tPact = tag('悪魔と契約すれば、力が手に入る', { size: 46, w: 860, bg: '#8e5bd0', sx: 1.95 }); qs.add(tPact);

// ---------- 4段目. 左：倒れた少年の胸に灯るオレンジの光／右：大きな役所の建物の前、黒いスーツの組織の人たち ----------
const CX = 150;
{ const gr = box(14, 0.04, 14, mat('#2a2a2e')); gr.position.set(CX, 0.02, -5); qs.add(gr);
  const bd = box(8, 7, 3, mat('#8a8a8e')); bd.position.set(CX + 4, 3.5, -11); qs.add(bd);
  for (let i = 0; i < 18; i++) { const w = box(0.7, 0.8, 0.05, gl('#c8d8e8')); w.position.set(CX + 1 + (i % 6) * 1.2, 1.4 + Math.floor(i / 6) * 1.8, -9.47); qs.add(w); }
  for (let i = 0; i < 4; i++) { const c = box(0.4, 2.0, 0.4, mat('#a8a8aa')); c.position.set(CX + 1.4 + i * 1.8, 1.0, -9.3); qs.add(c); }
  const L = new THREE.PointLight('#e8e8f0', 2.4, 14); L.position.set(CX + 3, 4, -5); qs.add(L); }
const BOY4 = person(BOY, CX - 3.0, -4.0, 0); BOY4.rotation.x = -Math.PI / 2; BOY4.position.y = 0.2;
const CORE4 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), gl('#ff9a30')); CORE4.position.set(0.05, 1.22, 0.16); BOY4.add(CORE4);
const CL4 = new THREE.PointLight('#ff9a30', 0, 5); CL4.position.set(CX - 3.0, 1.0, -2.8); qs.add(CL4);
const BOY4B = person(BOYS, CX + 2.4, -5.2, 0);
const SUIT4 = SUIT.map((o, i) => person(o, CX + 3.4 + i * 0.9, -6.2 - (i % 2) * 0.3, -0.4));
const tRevive = tag('相棒と契約して、よみがえる', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tRevive);
const tScout = tag('悪魔を狩る組織に、スカウトされる', { size: 44, w: 900, bg: '#8e5bd0', sx: 2.0 }); qs.add(tScout);

// ---------- 5段目. 夜の居間のテレビ（x=200）。光る画面とソファ、宙に浮かぶカチンコ ----------
const DX = 200;
{ const fl = box(8, 0.04, 7, mat('#3a3430')); fl.position.set(DX, 0.03, -2); qs.add(fl); const wl = box(8, 3.6, 0.2, mat('#2e2a34')); wl.position.set(DX, 1.8, -5.2); qs.add(wl);
  const sofa = box(2.6, 0.5, 0.9, mat('#5a3a3a')); sofa.position.set(DX, 0.3, -0.4); qs.add(sofa); }
const TV5 = box(2.6, 1.5, 0.12, mat('#121214')); TV5.position.set(DX, 1.6, -4.9); qs.add(TV5);
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.32), new THREE.MeshBasicMaterial({ color: '#8a6aba' })); SCR5.position.set(DX, 1.6, -4.83); qs.add(SCR5);
const STAND5 = box(2.2, 0.6, 0.5, mat('#4a3a2e')); STAND5.position.set(DX, 0.3, -4.8); qs.add(STAND5);
const L5 = new THREE.PointLight('#b08aff', 3, 8); L5.position.set(DX, 1.6, -3.8); qs.add(L5);
const CLAP5 = new THREE.Group(); { const b = box(0.9, 0.6, 0.04, mat('#1a1a1a')); CLAP5.add(b); const tp = new THREE.Group(); tp.position.set(-0.45, 0.32, 0); const st = box(0.9, 0.12, 0.04, mat('#f0f0f0')); st.position.x = 0.45; tp.add(st);
  for (let i = 0; i < 4; i++) { const k = box(0.1, 0.12, 0.045, mat('#1a1a1a')); k.position.set(0.1 + i * 0.22, 0, 0); k.rotation.z = 0.5; tp.add(k); } CLAP5.add(tp); CLAP5.userData.top = tp;
  for (let i = 0; i < 3; i++) { const ln = box(0.7, 0.02, 0.05, mat('#e8e8e8')); ln.position.set(0, 0.12 - i * 0.16, 0.01); CLAP5.add(ln); } }
CLAP5.position.set(DX + 0.9, 2.7, -3.4); qs.add(CLAP5);
const t2022 = tag('2022年に放送された、日本のアニメ', { size: 44, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(t2022);
const tFilm = tag('続きの物語は、映画にもなった', { size: 46, w: 860, bg: '#8e5bd0', sx: 1.95 }); qs.add(tFilm);

// ---------- 6段目. 夜の倉庫（x=250）。頭にチェンソーのついたオレンジの相棒 → 頭と腕からチェンソーが出た少年、飛び散る火花 ----------
const EX = 250;
{ const fl = box(12, 0.04, 10, mat('#2a2622')); fl.position.set(EX, 0.03, -3); qs.add(fl); const wl = box(12, 5, 0.3, mat('#2a2a30')); wl.position.set(EX, 2.5, -8); qs.add(wl);
  for (let i = 0; i < 5; i++) { const c = box(1.0, 1.0, 1.0, mat('#5a4a36')); c.position.set(EX - 5 + i * 0.6, 0.5 + (i % 2) * 1.0, -7); qs.add(c); }
  const L = new THREE.PointLight('#ff9a50', 3.4, 12); L.position.set(EX, 3.4, -2); qs.add(L); }
const BUD6 = buddy(true); BUD6.position.set(EX - 1.4, 0, -3.4); BUD6.rotation.y = 0.5; qs.add(BUD6);
const BOY6 = person(BOY, EX + 0.9, -4.0, -0.3);
const HSAW6 = saw(0.6); HSAW6.position.set(0, 0.45, 0.05); HSAW6.rotation.x = 0.3; BOY6.userData.head.add(HSAW6);
const ASAW6 = [0, 1].map(i => { const s = saw(0.7); s.rotation.x = Math.PI; s.position.set(0, -0.62, 0); BOY6.userData.arms[i].add(s); return s; });
const SPARK6 = []; for (let i = 0; i < 18; i++) { const sp = box(0.03, 0.03, 0.03, gl(i % 2 ? '#ffd040' : '#ff8030')); qs.add(sp); SPARK6.push(sp); }
const tBud = tag('相棒は、頭にチェンソーのついた悪魔', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tBud);
const tSaw = tag('変身すると、頭と腕からチェンソー', { size: 44, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tSaw);

// ---------- shots ----------
const ALL = [tHut, tDebt, tHunt, tBetray, tWorld, tPact, tRevive, tScout, t2022, tFilm, tBud, tSaw, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotHut(t, quiz = 0) { // 1段目 0〜9：ボロ小屋に、少年と小さな相棒。親の借金を、返すだけの毎日（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.35; S.darken(0.4, '#060606');
  BUD1.userData.tail.rotation.y = Math.sin(t * 8) * 0.5; BUD1.position.y = Math.abs(Math.sin(t * 3)) * 0.05;
  BOY1.userData.arms[0].rotation.x = -0.8; BOY1.userData.head.rotation.y = 0.5 + Math.sin(t * 0.6) * 0.15; BOY1.userData.head.rotation.x = 0.2;
  BILLS1.forEach((b, i) => b.visible = quiz || t > 4.8 ? true : i < 3);
  Q1.position.set(0.9, 1.5, -4.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tHut, 1.05); pin(tDebt, 1.05);
  if (!quiz) { tHut.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tHut.visible = false; tDebt.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.4, 1.0, u), lerp(1.6, 1.5, u), lerp(0.4, -0.4, u), 0.0, 0.6, -3.5, 62);
  return qs;
}
function shotForest(t) { // 2段目 9〜17：仕事は、悪魔を退治すること。ある夜、裏切られてしまう
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.4; S.darken(0.6, '#04060a');
  MON2.userData.eyes.forEach((e, i) => e.scale.setScalar(1 + Math.sin(t * 4 + i) * 0.2)); MON2.rotation.y = Math.sin(t * 0.8) * 0.2;
  BOY2.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 3) * 0.3;
  const bt = t > 4.3; SHADY2.forEach((p, i) => { p.visible = bt; p.position.z = -0.6 - (i % 2) * 0.4 - (bt ? (t - 4.3) * 0.35 : 0); poseWalk(p, t * 4 + i, 0.5); });
  const u = ease(t / 8);
  if (!bt) look(AX + lerp(-2.6, -2.2, u), lerp(1.3, 1.4, u), lerp(-1.6, -2.0, u), AX + 0.4, 1.8, -6.4, 64);
  else { const v = ease(clamp((t - 4.3) / 3.7)); look(AX + lerp(2.2, 1.8, v), lerp(1.8, 1.7, v), lerp(-5.4, -5.8, v), AX - 0.2, 1.2, -1.8, 64); }
  pin(tHunt, 1.05); pin(tBetray, 1.05);
  tHunt.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHunt.visible = false; tBetray.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：悪魔が、人をおそう世界。悪魔と契約すれば、力が手に入る
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.5; S.key.intensity = 0.3; S.darken(0.65, '#06040a');
  MON3.position.z = -22 + t * 0.6; MON3.userData.eyes.forEach((e, i) => e.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.2));
  RUN3.forEach((p, i) => { p.position.z = -6 - i * 0.8 + t * 1.6; poseWalk(p, t * 10 + i, 1.0); });
  const pc = t > 4.3; PACT3.visible = pc; PACT3.rotation.y = Math.sin(t) * 0.3; PGLOW3.intensity = pc ? 3 + Math.sin(t * 6) : 0;
  const u = ease(t / 8);
  if (!pc) look(BX + lerp(1.2, 0.8, u), lerp(1.4, 1.6, u), lerp(2.0, 1.4, u), BX, 3.6, -14, 62);
  else { const v = ease(clamp((t - 4.3) / 3.7)); look(BX + lerp(0.6, 0.4, v), lerp(2.3, 2.2, v), lerp(-1.0, -1.6, v), BX, 2.1, -3.4, 62); }
  pin(tWorld, 1.05); pin(tPact, 1.05);
  tWorld.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWorld.visible = false; tPact.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotRevive(t) { // 4段目 25〜33：相棒と契約して、よみがえる。悪魔を狩る組織に、スカウトされる
  base(); S.aim(CX, -5); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.5; S.darken(0.4, '#06060a');
  const sc = t > 4.3, up = clamp((t - 1.4) / 2.2);
  CORE4.visible = !sc; CORE4.scale.setScalar(1 + up * 0.5 + Math.sin(t * 8) * 0.1); CORE4.getWorldPosition(CL4.position); CL4.intensity = sc ? 0 : 1 + up * 5;
  BOY4.rotation.x = -Math.PI / 2 * (1 - ease(clamp((t - 2.6) / 1.4))); BOY4.position.y = 0.2 * (1 - ease(clamp((t - 2.6) / 1.4)));
  SUIT4.forEach((p, i) => { p.userData.head.rotation.y = -0.4; p.userData.arms[1].rotation.x = i === 0 ? -1.2 : 0; });
  BOY4B.userData.head.rotation.y = 0.5;
  const u = ease(clamp((t - (sc ? 4.3 : 0)) / 4));
  if (!sc) look(CX - 3.0 + lerp(1.4, 1.2, u), lerp(1.6, 1.7, u), lerp(-1.0, 0.2, u), CX - 3.0, lerp(0.5, 1.1, u), -4.4, 62);
  else look(CX + 2.8 + lerp(-0.6, -0.4, u), lerp(1.8, 1.9, u), lerp(-0.6, -1.2, u), CX + 3.4, 1.4, -5.8, 62);
  pin(tRevive, 1.05); pin(tScout, 1.05);
  tRevive.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tRevive.visible = false; tScout.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2022年に放送された、日本のアニメ。続きの物語は、映画にもなった
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.35; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCR5.material.color.setHSL(0.72, 0.3, 0.45 + Math.sin(t * 3.1) * 0.08); L5.intensity = 3 + Math.sin(t * 3.1) * 0.6;
  CLAP5.visible = t > 4.3; CLAP5.rotation.y = -0.3 + Math.sin(t) * 0.2; CLAP5.userData.top.rotation.z = Math.max(0, Math.sin(t * 3)) * 0.4;
  const u = ease(t / 9);
  look(DX + lerp(-0.3, 0.3, u), lerp(1.7, 1.6, u), lerp(1.8, 0.8, u), DX + 0.2, 1.6, -4.8, 62);
  pin(t2022, 1.05); pin(tFilm, 1.05);
  t2022.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2022.visible = false; tFilm.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotSaw(t) { // 6段目 42〜49（決め手）：相棒は、頭にチェンソーのついた悪魔。変身すると、頭と腕からチェンソー
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.6, '#060404');
  const on = t > 3.6;
  BUD6.userData.tail.rotation.y = Math.sin(t * 8) * 0.5; BUD6.userData.saw.userData.teeth.forEach((tt, i) => tt.position.y = 0.05 + ((i / 8 + t * 2) % 1) * 0.5 * 7 / 8);
  HSAW6.visible = on; ASAW6.forEach(s => s.visible = on);
  [HSAW6, ...ASAW6].forEach(s => s.userData.teeth.forEach((tt, i) => tt.position.y = 0.05 + ((i / 8 + t * 3) % 1) * 0.6));
  BOY6.userData.arms[0].rotation.x = on ? -1.3 : 0; BOY6.userData.arms[1].rotation.x = on ? -1.5 : 0; BOY6.userData.arms[0].rotation.z = on ? -0.3 : 0;
  SPARK6.forEach((sp, i) => { const s = ((t * 2 + i / 18) % 1); const a = i * 2.4; sp.visible = on; sp.position.set(EX + 0.9 + Math.cos(a) * s * 1.0, 2.0 + s * 0.8 - s * s * 1.6, -3.4 + Math.sin(a) * s * 0.6); });
  const u = ease(t / 7);
  if (!on) look(EX - 1.4 + lerp(0.8, 0.6, u), lerp(1.1, 1.0, u), lerp(-1.6, -2.0, u), EX - 1.4, 0.5, -3.4, 60);
  else { const v = ease(clamp((t - 3.6) / 1.2)); look(EX + lerp(-0.4, 0.6, v), lerp(1.4, 1.8, v), lerp(-1.4, -0.6, v), EX + 0.8, 1.6, -4.0, 62); }
  pin(tBud, 1.05); pin(tSaw, 1.05);
  if (t < 3.6) tBud.userData.pop((t - 0.3) / 0.35); else tSaw.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（ボロ小屋に戻る）
  shotHut(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotHut(t, 0) },
  { a: 9, b: 17, f: shotForest },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotRevive },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotSaw },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ボロ小屋に、<br>少年と小さな相棒。'],
  [5.6, 9.0, '親の借金を、<br>返すだけの毎日。'],
  [9.2, 13.2, '仕事は、悪魔を<br>退治すること。'],
  [13.2, 17.0, 'ある夜、<br>裏切られてしまう。'],
  [17.2, 21.0, '悪魔が、<br>人をおそう世界。'],
  [21.0, 25.0, '悪魔と契約すれば、<br>力が手に入る。'],
  [25.2, 29.0, '相棒と契約して、<br>よみがえる。'],
  [29.0, 33.0, '悪魔を狩る組織に、<br>スカウトされる。'],
  [33.2, 37.4, '2022年に放送された、<br>日本のアニメ。'],
  [37.4, 41.8, '続きの物語は、<br>映画にもなった。'],
  [42.2, 45.4, '相棒は、頭にチェンソーの<br>ついた悪魔。'],
  [45.4, 49.0, '変身すると、頭と腕から<br>チェンソー。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>チェンソーマン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q155', v2: true, answer: 'チェンソーマン',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'tension', seed: 15510,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [13.2, 'drone', 0.4], [17.0, 'whoosh'], [21.0, 'bubble'], [25.0, 'whoosh'], [29.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [45.4, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'チェンソーマン': 'チェンソーマン', 'チェンソー': 'チェンソー', '2022年': 'にせんにじゅうにねん', 'ボロ小屋': 'ボロごや', '少年': 'しょうねん', '小さな': 'ちいさな', '相棒': 'あいぼう', '親の借金': 'おやのしゃっきん', '返す': 'かえす', '毎日': 'まいにち', '仕事': 'しごと', '悪魔': 'あくま', '退治': 'たいじ', 'ある夜': 'あるよる', '裏切られて': 'うらぎられて', '人': 'ひと', '世界': 'せかい', '契約': 'けいやく', '力が手に入る': 'ちからがてにはいる', '狩る': 'かる', '組織': 'そしき', '放送': 'ほうそう', '日本': 'にほん', '続き': 'つづき', '物語': 'ものがたり', '映画': 'えいが', '頭': 'あたま', '変身': 'へんしん', '腕': 'うで', '作品': 'さくひん', '間に': 'あいだに', '当ててみて': 'あててみて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この作品のタイトル、わかる？\nボロ小屋に、少年と小さな相棒。親の借金を、返すだけの毎日。仕事は、悪魔を退治すること。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'PrimeVideo', 'アニメ好き', '日本のアニメ'],
  },
});
applyQuizCards({ answer: 'チェンソーマン', info: 'Netflix・Prime Video｜日本のアニメ', answerSize: 108 });
