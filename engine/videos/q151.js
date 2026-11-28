import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #151 SPEC〜警視庁公安部公安第五課 未詳事件特別対策係事件簿〜（ドラマ・日本・2010年10月〜 TBS 金曜ドラマ・全10話。Netflix・U-NEXT で見放題、
//   Netflix の作品ページ netflix.com/jp/title/81781650（日本で配信中）と Filmarks の動画配信欄（Prime Video・U-NEXT・Lemino・Hulu・Netflix 見放題。
//   2026年10月更新）で2026/11/28確認。Filmarks 4.3・レビュー51,242件 filmarks.com/dramas/1154/2437）
// 確かめた事実（2026/11/28）：
//   ・TBS 公式 tbs.co.jp/spec2010/ ：金曜ドラマ・2010年10月8日スタート・#1〜#10。はじめに：通常の人間の能力や常識では計り知れない特殊能力(スペック)を
//     持った人間が潜んでいる。凡人にはない特殊能力を持っている犯罪者に立ち向かう、若き刑事たちの物語。スペシャルドラマ＆映画化（劇場版）あり
//   ・TBS 公式 #1 あらすじ：警視庁は公安部に未詳事件特別対策係を設立。証拠がほとんどなく目撃証言もほとんどない事件など、捜査一課では手に余る事件を扱う。
//     係長は嘱託の老刑事。部下はトラブルを起こして飛ばされてきた二人。一人は IQ201 の変わり種の女性刑事で、犯人と格闘して大けがを負い今でも左手はギプス。
//     もう一人は警視庁特殊部隊(SIT)の小隊長まで上り詰めた凄腕だが、ある事件が理由で飛ばされた男。二人は犯人の特殊な能力は何かを推理し、
//     ケンカし協力し合いながら犯人を追い詰めていく
//   ・Filmarks：大ヒットドラマ「ケイゾク」のスタッフが11年の時を経て集結。Netflix の紹介：ずば抜けたIQを有する型破りな刑事と左遷された元特殊部隊の司令塔
// 構成（ヒント6段）：1 証拠も目撃者もない、ふしぎな事件・犯人はどうやって？ → 2 主人公は頭が良すぎる変わり者の女性刑事・左手にはずっとギプス
//   → 3 配属先は、だれも来ない小さな係・あつかうのは、説明のつかない事件 → 4 相棒は元特殊部隊のこわもて刑事・ケンカしながら犯人を追う
//   → 5 2010年の日本のドラマ・のちに映画にもなった人気シリーズ → 6 決め手：犯人はふつうの人にはない特殊能力の持ち主・IQ201の頭脳でその能力を推理する
// 犯人の正体・結末は言わない。登場人物の名前・係の名前は出さない。俳優の顔・ポスター・ロゴは使わない。有名な場面の構図（餃子を食べる場面・指を鳴らす決めポーズなど）は
// なぞらない。人は汎用の3D
const S = quizStage({ bg: '#141a22', floor: '#262a30', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(15110);

const HER = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#4a4440', pants: '#2a2a30', long: true };
const PART = { skin: '#e8c09a', hair: '#141210', shirt: '#1a1a1e', pants: '#1a1a1e', tie: true, scale: 1.08 };
const BOSS = { skin: '#eac4a0', hair: '#d8d8d8', shirt: '#6a5a48', pants: '#3a3430', tie: true };
const COPS = [{ skin: '#f1c9a5', hair: '#1a1a1a', shirt: '#2a3040', pants: '#2a3040', tie: true }, { skin: '#e8c09a', hair: '#2a2018', shirt: '#3a3a3e', pants: '#2a2a2e', tie: true }];
const VIL = { skin: '#d8c8b8', hair: '#0e0e10', shirt: '#0e0e12', pants: '#0e0e12' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function cast(p) { const arm = p.userData.arms[0]; const c = box(0.17, 0.4, 0.2, mat('#f4f4f0')); c.position.y = -0.42; arm.add(c); arm.rotation.x = -0.9; arm.rotation.z = 0.5;
  const sl = box(0.5, 0.06, 0.04, mat('#e8e8e4')); sl.position.set(0, 1.32, 0.16); sl.rotation.z = -0.6; p.add(sl); return c; }
function room(cx, w, d, wallC, floorC) { const fl = box(w, 0.04, d, mat(floorC)); fl.position.set(cx, 0.02, -d / 2 + 2); qs.add(fl);
  const bw = box(w, 3.6, 0.2, mat(wallC)); bw.position.set(cx, 1.8, -d + 2); qs.add(bw);
  for (const s of [-1, 1]) { const sw = box(0.2, 3.6, d, mat(wallC)); sw.position.set(cx + s * w / 2, 1.8, -d / 2 + 2); qs.add(sw); } }
function desk(x, z, ry = 0) { const g = new THREE.Group(); const tp = box(1.4, 0.06, 0.7, mat('#6a5a46')); tp.position.y = 0.76; g.add(tp);
  for (const [a, b] of [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]]) { const l = box(0.06, 0.76, 0.06, mat('#3a3430')); l.position.set(a, 0.38, b); g.add(l); }
  for (let i = 0; i < 3; i++) { const pp = box(0.3, 0.06 + i * 0.04, 0.22, mat('#e8e4d8')); pp.position.set(-0.4 + i * 0.12, 0.82 + i * 0.03, 0); pp.rotation.y = i * 0.3; g.add(pp); }
  g.position.set(x, 0, z); g.rotation.y = ry; qs.add(g); return g; }

// ---------- 1段目. 夜のマンションの一室（x=0）。黄色い立入禁止テープ、床に白いテープの人型、窓は閉じたまま ----------
room(0, 7, 8, '#4a4e56', '#5a4a3a');
{ const win = box(1.6, 1.2, 0.05, gl('#1a2a44')); win.position.set(1.4, 1.9, -5.88); qs.add(win); const wf = box(0.08, 1.2, 0.08, mat('#888888')); wf.position.set(1.4, 1.9, -5.84); qs.add(wf);
  const lk = box(0.2, 0.08, 0.08, mat('#c8a040')); lk.position.set(1.4, 1.9, -5.82); qs.add(lk);
  const dr = box(1.0, 2.2, 0.06, mat('#3a2e26')); dr.position.set(-1.8, 1.1, -5.86); qs.add(dr); const ch = box(0.24, 0.06, 0.1, mat('#c8a040')); ch.position.set(-1.45, 1.1, -5.78); qs.add(ch);
  for (const [x, z, r] of [[-1.2, -2.2, 0.2], [1.6, -2.6, -0.4]]) { const tp = box(3.2, 0.12, 0.02, mat('#f0d020')); tp.position.set(x, 0.9, z); tp.rotation.y = r; qs.add(tp); }
  const lamp = box(0.5, 0.5, 0.5, mat('#3a3430')); lamp.position.set(-2.6, 0.25, -4.4); qs.add(lamp);
  const L = new THREE.PointLight('#c8d8ff', 1.8, 9); L.position.set(0, 3, -2); qs.add(L); }
const OUT1 = new THREE.Group(); { const w = mat('#f4f4f0');
  for (const [x, z, l, r] of [[0, 0, 1.2, 0], [0.42, -0.3, 0.6, 0.6], [-0.42, -0.3, 0.6, -0.6], [0.16, 0.85, 0.7, 0.15], [-0.16, 0.85, 0.7, -0.15]]) { const s = box(0.05, 0.01, l, w); s.position.set(x, 0.05, z); s.rotation.y = r; OUT1.add(s); }
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 4, 20), w); hd.rotation.x = -Math.PI / 2; hd.position.set(0, 0.05, -0.82); OUT1.add(hd); }
OUT1.position.set(0.3, 0, -3.6); OUT1.rotation.y = 0.4; qs.add(OUT1);
const DET1 = [person(COPS[0], -1.3, -4.4, 0.6), person(COPS[1], 1.8, -4.6, -0.5)];
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tNone = tag('証拠も目撃者もない、ふしぎな事件', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tNone);
const tHow = tag('犯人は、どうやって？', { size: 56, w: 640, bg: '#3478e6', sx: 1.6 }); qs.add(tHow);

// ---------- 2段目. 警察署の廊下（x=50）。左手にギプスをした長い髪の女性刑事が、ひとりだけ違うペースで歩く ----------
const AX = 50;
{ const fl = box(6, 0.04, 40, mat('#7a7a72')); fl.position.set(AX, 0.02, -12); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.3, 4, 40, mat('#b8bcc0')); wl.position.set(AX + s * 3, 2, -12); qs.add(wl);
    for (let i = 0; i < 6; i++) { const dr = box(0.06, 2.4, 1.1, mat('#5a6070')); dr.position.set(AX + s * 2.84, 1.2, -2 - i * 5); qs.add(dr); } }
  for (let i = 0; i < 8; i++) { const lp = box(0.9, 0.04, 0.3, gl('#8a929c')); lp.position.set(AX, 3.95, -1 - i * 4); qs.add(lp); }
  const lt = new THREE.PointLight('#e8f0ff', 2.2, 14); lt.position.set(AX, 3.5, -4); qs.add(lt); }
const HER2 = person(HER, AX - 0.3, -3.0, Math.PI); const CAST2 = cast(HER2);
const COP2 = [0, 1, 2].map(i => person(COPS[i % 2], AX + (i % 2 ? 1.2 : -1.3), -6 - i * 2.6, Math.PI));
const tOdd = tag('主人公は、頭が良すぎる変わり者の刑事', { size: 42, w: 940, bg: '#14161c', sx: 2.05 }); qs.add(tOdd);
const tCast = tag('左手には、ずっとギプス', { size: 54, w: 680, bg: '#3478e6', sx: 1.7 }); qs.add(tCast);

// ---------- 3段目. だれも来ない小さな係（x=100）。古い机と書類の山、湯のみを持つ年配の係長、裸電球 ----------
const BX = 100;
room(BX, 7, 7, '#5a5448', '#4a4034');
const DESK3 = [desk(BX - 1.9, -2.6, 0.1), desk(BX + 1.9, -2.4, -0.15), desk(BX, -3.8, 0)];
{ for (let i = 0; i < 6; i++) { const bx = box(0.6, 0.4, 0.45, mat(i % 2 ? '#a8946c' : '#94805a')); bx.position.set(BX + 3.0, 0.2 + i * 0.4, -4.4 + (i % 3) * 0.1); bx.rotation.y = (R() - 0.5) * 0.3; qs.add(bx); }
  for (let i = 0; i < 4; i++) { const sh = box(0.4, 1.8, 0.4, mat('#6a6458')); sh.position.set(BX - 3.2, 0.9, -1.6 - i * 0.9); qs.add(sh); } }
const BULB3 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gl('#ffd898')); BULB3.position.set(BX, 3.0, -3.0); qs.add(BULB3);
const L3 = new THREE.PointLight('#ffc878', 4, 9); L3.position.set(BX, 2.8, -3.6); qs.add(L3);
const BOSS3 = person(BOSS, BX, -4.4, 0); BOSS3.userData.legs.forEach(l => l.rotation.x = -1.5); BOSS3.position.y = -0.32;
const CUP3 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 12), mat('#4a6a5a')); CUP3.position.set(0, -0.66, 0.06); BOSS3.userData.arms[1].add(CUP3);
const HER3 = person(HER, BX + 0.85, -1.7, -0.7); cast(HER3);
const tSmall = tag('配属先は、だれも来ない小さな係', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tSmall);
const tStrange = tag('あつかうのは、説明のつかない事件', { size: 44, w: 900, bg: '#3478e6', sx: 2.0 }); qs.add(tStrange);

// ---------- 4段目. 夜の路地（x=150）。黒いスーツの大柄な相棒とギプスの女性、言い合いながら同じ方へ走る ----------
const CX = 150;
{ const fl = box(8, 0.04, 40, mat('#2e3036')); fl.position.set(CX, 0.02, -12); qs.add(fl);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const h = 4 + R() * 4; const b = box(3, h, 5, mat(s < 0 ? '#3a3e48' : '#44424a')); b.position.set(CX + s * 4.6, h / 2, -2 - i * 6); qs.add(b);
    for (let k = 0; k < 3; k++) { const w = box(0.05, 0.6, 0.8, gl(R() > 0.4 ? '#ffd890' : '#2a3040')); w.position.set(CX + s * 3.08, 1.6 + k * 1.4, -1 - i * 6 + (k % 2) * 1.6); qs.add(w); } }
  for (let i = 0; i < 4; i++) { const lp = new THREE.PointLight('#ffd8a0', 1.6, 8); lp.position.set(CX + (i % 2 ? 2 : -2), 3.2, -2 - i * 7); qs.add(lp); } }
const HER4 = person(HER, CX - 0.5, -3, Math.PI); cast(HER4);
const PART4 = person(PART, CX + 0.6, -3.4, Math.PI);
const tPart = tag('相棒は、元特殊部隊のこわもて刑事', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tPart);
const tFight = tag('ケンカしながら、犯人を追う', { size: 50, w: 780, bg: '#3478e6', sx: 1.85 }); qs.add(tFight);

// ---------- 5段目. 夜の居間のテレビ（x=200）。光る画面、ソファ、宙に浮かぶカチンコ（映画にもなった） ----------
const DX = 200;
room(DX, 8, 7, '#3a3440', '#4a3e34');
const TV5 = box(2.6, 1.5, 0.12, mat('#121214')); TV5.position.set(DX, 1.6, -4.7); qs.add(TV5);
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.32), new THREE.MeshBasicMaterial({ color: '#6a8aba' })); SCR5.position.set(DX, 1.6, -4.63); qs.add(SCR5);
const STAND5 = box(2.2, 0.6, 0.5, mat('#4a3a2e')); STAND5.position.set(DX, 0.3, -4.6); qs.add(STAND5);
{ const sofa = box(2.6, 0.5, 0.9, mat('#6a3a3a')); sofa.position.set(DX, 0.3, -0.6); qs.add(sofa); const sb = box(2.6, 0.7, 0.2, mat('#5a3030')); sb.position.set(DX, 0.75, -0.15); qs.add(sb); }
const L5 = new THREE.PointLight('#8ab0ff', 3, 8); L5.position.set(DX, 1.6, -3.6); qs.add(L5);
const CLAP5 = new THREE.Group(); { const b = box(0.9, 0.6, 0.04, mat('#1a1a1a')); CLAP5.add(b); const tp = new THREE.Group(); tp.position.set(-0.45, 0.32, 0); const st = box(0.9, 0.12, 0.04, mat('#f0f0f0')); st.position.x = 0.45; tp.add(st);
  for (let i = 0; i < 4; i++) { const k = box(0.1, 0.12, 0.045, mat('#1a1a1a')); k.position.set(0.1 + i * 0.22, 0, 0); k.rotation.z = 0.5; tp.add(k); } CLAP5.add(tp); CLAP5.userData.top = tp;
  for (let i = 0; i < 3; i++) { const ln = box(0.7, 0.02, 0.05, mat('#e8e8e8')); ln.position.set(0, 0.12 - i * 0.16, 0.01); CLAP5.add(ln); } }
CLAP5.position.set(DX + 1.0, 2.7, -3.4); qs.add(CLAP5);
const t2010 = tag('2010年の、日本のドラマ', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2010);
const tMovie = tag('のちに映画にもなった人気シリーズ', { size: 44, w: 900, bg: '#3478e6', sx: 2.0 }); qs.add(tMovie);

// ---------- 6段目. 暗い倉庫（x=250）。黒い影の犯人のまわりで物が宙に止まる、ギプスの刑事が考える（数式が浮かぶ） ----------
const EX = 250;
room(EX, 10, 9, '#2a2a30', '#2a2622');
const VIL6 = person(VIL, EX + 1.2, -5.0, -0.3);
const EYE6 = [-1, 1].map(s => { const e = box(0.06, 0.04, 0.02, gl('#a0f0ff')); e.position.set(s * 0.085, 0.27, 0.2); VIL6.userData.head.add(e); return e; });
const AURA6 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 14), gl('#5ad0ff', 0.12)); AURA6.position.set(EX + 1.2, 1.2, -5.0); qs.add(AURA6);
const FLOAT6 = []; for (let i = 0; i < 9; i++) { const o = i % 3 === 0 ? new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 10), mat('#c8c8c0')) : box(0.15 + R() * 0.2, 0.1 + R() * 0.2, 0.15, mat(['#8a6a4a', '#6a7a8a', '#a0a098'][i % 3]));
  o.userData.p = new THREE.Vector3(EX + 1.2 + (R() - 0.5) * 3, 0.6 + R() * 2.0, -5.0 + (R() - 0.5) * 2); qs.add(o); FLOAT6.push(o); }
const HER6 = person(HER, EX - 1.2, -2.6, 0.5); cast(HER6);
const MATH6 = ['∫', 'x²', '√', 'π', '∑', '?'].map((s, i) => { const m = tag(s, { size: 80, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#e6d070', sx: 0.42 }); m.renderOrder = 6; qs.add(m); return m; });
const L6 = new THREE.PointLight('#7ad8ff', 3, 8); L6.position.set(EX + 1.2, 2.2, -4.2); qs.add(L6);
const tAbility = tag('犯人は、ふつうの人にはない特殊能力', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tAbility);
const tIQ = tag('IQ201の頭脳で、その能力を推理', { size: 46, w: 860, bg: '#e6b450', color: '#14161c', sx: 1.95 }); qs.add(tIQ);

// ---------- shots ----------
const ALL = [tNone, tHow, tOdd, tCast, tSmall, tStrange, tPart, tFight, t2010, tMovie, tAbility, tIQ, Q1, ...MATH6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotRoom(t, quiz = 0) { // 1段目 0〜9：証拠も目撃者もない、ふしぎな事件。犯人は、どうやって？（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.35; S.darken(0.5, '#05060a');
  DET1[0].userData.head.rotation.y = Math.sin(t * 0.7) * 0.5; DET1[1].userData.head.rotation.x = 0.4; DET1[1].userData.arms[1].rotation.x = -0.6 + Math.sin(t) * 0.1;
  DET1[0].userData.arms[0].rotation.x = -0.4;
  Q1.position.set(0.3, 1.5, -3.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tNone, 1.05); pin(tHow, 1.05);
  if (!quiz) { tNone.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tNone.visible = false; tHow.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.5, -0.2, u), lerp(3.0, 2.8, u), lerp(2.2, 1.6, u), 0.3, 0.7, -3.8, 66);
  return qs;
}
function shotHall(t) { // 2段目 9〜17：主人公は、頭が良すぎる変わり者の刑事。左手には、ずっとギプス
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 0.8;
  HER2.position.z = -3.0 - t * 0.2; poseWalk(HER2, t * 3, 0.45); HER2.userData.arms[0].rotation.x = -0.9; HER2.position.x = AX - 0.3 + Math.sin(t * 1.5) * 0.08;
  HER2.userData.head.rotation.z = Math.sin(t * 1.5) * 0.12;
  COP2.forEach((p, i) => { p.position.z = -6 - i * 2.6 + t * 0.6; poseWalk(p, t * 6 + i, 0.8); });
  const u = ease(t / 8), cz = HER2.position.z;
  if (t < 4.3) look(AX + lerp(0.8, 0.6, u), 1.6, cz - lerp(3.2, 2.8, u), AX - 0.3, 1.3, cz, 62);
  else look(AX + 0.9, 1.45, cz - 3.1, AX - 0.35, 1.25, cz, 60);
  pin(tOdd, 1.05); pin(tCast, 1.05);
  tOdd.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOdd.visible = false; tCast.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotOffice(t) { // 3段目 17〜25：配属先は、だれも来ない小さな係。あつかうのは、説明のつかない事件
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.4; S.darken(0.3, '#0c0a08');
  BOSS3.userData.arms[1].rotation.x = -1.1 + Math.sin(t * 0.8) * 0.1; BOSS3.userData.head.rotation.x = 0.1 + Math.sin(t * 0.5) * 0.05;
  HER3.userData.head.rotation.y = Math.sin(t * 0.9) * 0.6;
  L3.intensity = 4 + Math.sin(t * 7) * 0.3;
  const u = ease(t / 8);
  look(BX + lerp(-1.2, -0.7, u), lerp(2.2, 2.0, u), lerp(2.6, 1.8, u), BX + 0.2, 1.0, -3.6, 62);
  pin(tSmall, 1.05); pin(tStrange, 1.05);
  tSmall.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSmall.visible = false; tStrange.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotAlley(t) { // 4段目 25〜33：相棒は、元特殊部隊のこわもて刑事。ケンカしながら、犯人を追う
  base(); S.aim(CX, -6); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.3; S.darken(0.6, '#05060a');
  const run = t > 4.3, z = -3 - (run ? (t - 4.3) * 2.2 : t * 0.3);
  HER4.position.z = z; PART4.position.z = z - 0.3;
  poseWalk(HER4, t * (run ? 10 : 4), run ? 1.0 : 0.4); poseWalk(PART4, t * (run ? 10 : 4) + 1, run ? 1.1 : 0.4); HER4.userData.arms[0].rotation.x = -0.9;
  HER4.rotation.y = Math.PI + (run ? 0 : 0.6); PART4.rotation.y = Math.PI - (run ? 0 : 0.6);
  if (!run) { PART4.userData.arms[1].rotation.x = -1.2 + Math.sin(t * 6) * 0.2; HER4.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 7 + 1) * 0.3; }
  const u = ease(t / 8);
  look(CX + lerp(1.4, 1.0, u), lerp(1.8, 1.9, u), z - lerp(5.2, 5.8, u), CX, 1.1, z, 62);
  pin(tPart, 1.05); pin(tFight, 1.05);
  tPart.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPart.visible = false; tFight.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2010年の、日本のドラマ。のちに映画にもなった人気シリーズ
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.35; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCR5.material.color.setHSL(0.6, 0.3, 0.45 + Math.sin(t * 3.1) * 0.08); L5.intensity = 3 + Math.sin(t * 3.1) * 0.6;
  CLAP5.visible = t > 4.3; CLAP5.rotation.y = -0.3 + Math.sin(t) * 0.2; CLAP5.userData.top.rotation.z = Math.max(0, Math.sin(t * 3)) * 0.4;
  const u = ease(t / 9);
  look(DX + lerp(-0.3, 0.3, u), lerp(1.7, 1.6, u), lerp(1.8, 0.8, u), DX + 0.2, 1.5, -4.6, 62);
  pin(t2010, 1.05); pin(tMovie, 1.05);
  t2010.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2010.visible = false; tMovie.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotPower(t) { // 6段目 42〜49（決め手）：犯人は、ふつうの人にはない特殊能力の持ち主。IQ201の頭脳で、その能力を推理する
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.35; S.key.intensity = 0.2; S.darken(0.85, '#020306');
  FLOAT6.forEach((o, i) => { o.position.copy(o.userData.p); o.position.y += Math.sin(t * 0.6 + i) * 0.04; o.rotation.set(i, i * 0.7, 0); });
  AURA6.scale.setScalar(1 + Math.sin(t * 3) * 0.08); VIL6.userData.arms[1].rotation.x = -1.4; VIL6.userData.arms[1].rotation.z = 0.2;
  const think = t > 3.6; HER6.userData.arms[1].rotation.x = think ? -2.2 : -0.2; HER6.userData.head.rotation.x = think ? -0.15 : 0;
  MATH6.forEach((m, i) => { m.visible = think; const a = i / 6 * Math.PI * 2 + t * 0.8; m.position.set(EX - 1.2 + Math.cos(a) * 0.9, 2.3 + Math.sin(a * 1.3) * 0.25, -2.6 + Math.sin(a) * 0.5); });
  const u = ease(t / 7);
  if (!think) look(EX + lerp(-0.6, -0.2, u), lerp(1.8, 1.7, u), lerp(2.6, 2.0, u), EX + 0.9, 1.3, -4.8, 62);
  else look(EX - 0.2, 1.9, 0.9, EX - 0.8, 1.7, -3.0, 62);
  pin(tAbility, 1.05); pin(tIQ, 1.05);
  if (t < 3.6) tAbility.userData.pop((t - 0.3) / 0.35); else tIQ.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（事件の部屋に戻る）
  shotRoom(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRoom(t, 0) },
  { a: 9, b: 17, f: shotHall },
  { a: 17, b: 25, f: shotOffice },
  { a: 25, b: 33, f: shotAlley },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotPower },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '証拠も目撃者もない、<br>ふしぎな事件。'],
  [5.6, 9.0, '犯人は、<br>どうやって？'],
  [9.2, 13.2, '主人公は、頭が良すぎる<br>変わり者の刑事。'],
  [13.2, 17.0, '左手には、<br>ずっとギプス。'],
  [17.2, 21.0, '配属先は、だれも<br>来ない小さな係。'],
  [21.0, 25.0, 'あつかうのは、<br>説明のつかない事件。'],
  [25.2, 29.0, '相棒は、元特殊部隊の<br>こわもて刑事。'],
  [29.0, 33.0, 'ケンカしながら、<br>犯人を追う。'],
  [33.2, 37.4, '2010年の、<br>日本のドラマ。'],
  [37.4, 41.8, 'のちに映画にもなった、<br>人気シリーズ。'],
  [42.2, 45.4, '犯人は、ふつうの人には<br>ない特殊能力の持ち主。'],
  [45.4, 49.0, 'IQ201の頭脳で、<br>その能力を推理する。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>SPEC。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q151', v2: true, answer: 'SPEC',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 15110,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone', 0.4], [25.0, 'whoosh'], [29.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [45.4, 'drone', 0.4], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'SPEC': 'スペック', 'IQ201': 'アイキューにひゃくいち', '2010年': 'にせんじゅうねん', '証拠': 'しょうこ', '目撃者': 'もくげきしゃ', '事件': 'じけん', '犯人': 'はんにん', '主人公': 'しゅじんこう', '頭が良すぎる': 'あたまがよすぎる', '変わり者': 'かわりもの', '刑事': 'けいじ', '左手': 'ひだりて', '配属先': 'はいぞくさき', '来ない': 'こない', '小さな係': 'ちいさなかかり', '説明': 'せつめい', '相棒': 'あいぼう', '元特殊部隊': 'もととくしゅぶたい', '追う': 'おう', '日本': 'にほん', '映画': 'えいが', '人気': 'にんき', '特殊能力': 'とくしゅのうりょく', '持ち主': 'もちぬし', '頭脳': 'ずのう', '能力': 'のうりょく', '推理': 'すいり', '人': 'ひと', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n証拠も目撃者もない、ふしぎな事件。犯人は、どうやって？主人公は、頭が良すぎる変わり者の刑事。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'U-NEXT', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'SPEC<span style="display:block;font-size:36px;line-height:1.4;margin-top:16px">〜警視庁公安部公安第五課<br>未詳事件特別対策係事件簿〜</span>', info: 'Netflix・U-NEXT｜日本のドラマ・全10話', answerSize: 140 });
