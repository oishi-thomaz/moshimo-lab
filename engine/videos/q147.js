import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #147 コウノドリ（ドラマ・日本・2015年・TBS 金曜ドラマ。Netflix・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/kounodori（定額：Netflix・Hulu・Prime Video）と
//   Filmarks の動画配信欄（U-NEXT・Lemino・Hulu・Netflix 見放題）で2026/11/26確認。
//   Filmarks 4.2・レビュー31,153件 filmarks.com/dramas/939/2072）
// 確かめた事実（2026/11/26）：
//   ・TBS 公式 tbs.co.jp/kounodori/intro/ （続編の告知ページ）：2015年10月期に放送した『コウノドリ』の続編を2017年10月期に放送。
//     原作は講談社「モーニング」連載の鈴ノ木ユウの同名のヒューマン医療漫画。テーマは“生まれること、そして生きること”。
//     主人公は、冷静な判断力と患者に寄り添うことをポリシーとする産婦人科医、またあるときは情熱的で謎多き天才ピアニストという2つの顔を持つ
//   ・TBS 公式 人物相関図 tbs.co.jp/kounodori/chart/ ：病院の産婦人科・新生児科・助産師のチーム
// 構成（ヒント6段）：1 真夜中の病院に1本の電話・医師が走り出す → 2 主人公はおだやかな医師・赤ちゃんを取り上げる産婦人科医
//   → 3 小さな命を守る新生児の部屋・モニターの音だけがひびく → 4 仲間の医師や助産師と命に向き合う・母と子どちらも救いたい
//   → 5 2015年の日本のドラマ・漫画が原作の医療ドラマ → 6 決め手：医師とピアニスト、2つの顔をもつ・夜はステージに立つ
// 結末・各話の患者の結果は言わない。登場人物の名前・病院の名前・ピアニストの名前は出さない。俳優の顔・髪型・ポスター・ロゴは使わない。人は汎用の3D
const S = quizStage({ bg: '#dfe8ee', floor: '#c8ccd0', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(14710);

const DOC = { skin: '#f1c9a5', hair: '#1e1a18', shirt: '#f6f6f4', pants: '#3a4a6a' };
const DOC2 = { skin: '#f4d3b5', hair: '#2a2018', shirt: '#f6f6f4', pants: '#2a2e38' };
const MID = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#e89ab0', pants: '#e89ab0', long: true };
const MOM = { skin: '#f4d3b5', hair: '#4a2a1a', shirt: '#c8d8e8', pants: '#c8d8e8', long: true };
const NIGHT = { skin: '#f1c9a5', hair: '#1e1a18', shirt: '#1a1a22', pants: '#1a1a22' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function coat(p) { const c = box(0.56, 0.72, 0.32, mat('#ffffff')); c.position.y = 1.05; p.add(c); return p; } // 白衣のすそ
function baby() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat('#f4f0e8')); b.scale.set(1.5, 1, 1); g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#f6d2b8')); h.position.set(0.22, 0.03, 0); g.add(h); return g; }
function monitor(x, y, z, ry = 0) { const g = new THREE.Group(); const sc = box(0.6, 0.45, 0.08, mat('#1a1e24')); g.add(sc); const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), gl('#0a2a1a')); ln.position.z = 0.045; g.add(ln);
  const wv = []; for (let i = 0; i < 10; i++) { const d = box(0.04, 0.03, 0.01, gl('#4af07a')); d.position.set(-0.22 + i * 0.05, 0, 0.05); g.add(d); wv.push(d); } g.userData.wave = wv; g.position.set(x, y, z); g.rotation.y = ry; qs.add(g); return g; }
function beat(m, t, k = 1) { m.userData.wave.forEach((d, i) => { const ph = ((t * 1.3 * k + i * 0.1) % 1); d.position.y = ph < 0.08 ? 0.1 : (ph < 0.14 ? -0.06 : 0); }); }

// ---------- 1段目. 真夜中の病院の廊下（x=0）。ナースステーションで鳴る電話、白衣で走り出す医師 ----------
{ const fl = box(6, 0.04, 40, mat('#b8c0c4')); fl.position.set(0, 0.02, -12); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.3, 3.2, 40, mat('#d8dee2')); wl.position.set(s * 3, 1.6, -12); qs.add(wl); for (let i = 0; i < 6; i++) { const dr = box(0.06, 2.1, 1.0, mat('#8aa0b0')); dr.position.set(s * 2.84, 1.05, -2 - i * 5); qs.add(dr); } }
  for (let i = 0; i < 8; i++) { const lp = box(0.8, 0.04, 0.3, gl(i % 3 === 1 ? '#5a6068' : '#f0f4f8')); lp.position.set(0, 3.15, -1 - i * 4); qs.add(lp); }
  const ds = box(2.2, 1.0, 0.7, mat('#e8e4dc')); ds.position.set(-1.6, 0.5, -3.0); qs.add(ds); const dt = box(2.3, 0.06, 0.8, mat('#b8a888')); dt.position.set(-1.6, 1.02, -3.0); qs.add(dt);
  const lp1 = new THREE.PointLight('#c8d8f0', 2.2, 10); lp1.position.set(0, 2.8, -3); qs.add(lp1); }
const PHONE1 = new THREE.Group(); PHONE1.position.set(-1.3, 1.1, -3.0); qs.add(PHONE1);
{ const b = box(0.3, 0.1, 0.24, mat('#2a2e34')); PHONE1.add(b); const r = box(0.32, 0.08, 0.08, mat('#3a3e44')); r.position.set(0, 0.09, 0); PHONE1.add(r); const l = box(0.06, 0.03, 0.06, gl('#f04a4a')); l.position.set(0.1, 0.06, 0.1); PHONE1.add(l); }
const RING1 = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.12, 0.012, 6, 24, Math.PI), gl('#f04a4a', 0.8)); r.position.set(-1.3, 1.25, -3.0); qs.add(r); RING1.push(r); }
const DOC1 = coat(person(DOC, 0.6, -5.0, 0));
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#3480e6', sx: 0.5 }); qs.add(Q1);
const tCall = tag('真夜中の病院に、1本の電話', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tCall);
const tRun = tag('医師が、走り出す', { size: 56, w: 560, bg: '#3480e6', sx: 1.45 }); qs.add(tRun);

// ---------- 2段目. 分べん室（x=50）。ベッドとモニター、生まれたばかりの赤ちゃんをそっと抱く医師 ----------
const AX = 50;
{ const fl = box(10, 0.04, 8, mat('#c8d4d8')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const wl = box(10, 4, 0.3, mat('#e0ecee')); wl.position.set(AX, 2, -6); qs.add(wl);
  const bd = box(1.2, 0.8, 2.2, mat('#e8eef0')); bd.position.set(AX - 1.8, 0.4, -4.0); qs.add(bd);
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.2, 16), gl('#fffbe8')); lp.position.set(AX - 1.0, 3.4, -3.6); qs.add(lp);
  const pl = new THREE.PointLight('#fff4e0', 3, 8); pl.position.set(AX - 0.6, 3, -3); qs.add(pl); }
const MON2 = monitor(AX + 1.4, 1.6, -5.6);
const DOC2a = coat(person(DOC, AX - 0.2, -3.4, 0.3));
const MID2 = person(MID, AX + 0.9, -3.8, -0.5);
const BABY2 = baby(); BABY2.scale.setScalar(0.7); BABY2.children[0].material = mat('#f8e4ec'); qs.add(BABY2);
const tCalm = tag('主人公は、いつもおだやかな医師', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tCalm);
const tObgyn = tag('赤ちゃんを取り上げる、産婦人科医', { size: 46, w: 860, bg: '#3480e6', sx: 1.95 }); qs.add(tObgyn);

// ---------- 3段目. 新生児の部屋（x=100）。ならんだ保育器とモニターの小さな光 ----------
const BX = 100;
{ const fl = box(12, 0.04, 10, mat('#d0dce0')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  const wl = box(12, 4, 0.3, mat('#e8f0f0')); wl.position.set(BX, 2, -7); qs.add(wl);
  const pl = new THREE.PointLight('#e0f0ff', 2, 10); pl.position.set(BX, 3, -3); qs.add(pl); }
const INC3 = []; const MONS3 = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const x = BX - 2.2 + i * 2.2, z = -2.6 - r * 2.4;
  const st = box(1.0, 0.8, 0.6, mat('#c8ccd4')); st.position.set(x, 0.4, z); qs.add(st);
  const cv = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: '#d8eef8', transparent: true, opacity: 0.35 })); cv.position.set(x, 1.05, z); qs.add(cv);
  const b = baby(); b.position.set(x, 0.9, z); b.scale.setScalar(0.7); qs.add(b); INC3.push(b);
  MONS3.push(monitor(x + 0.7, 1.4, z - 0.2, -0.3)); }
const NURSE3 = person(MID, BX + 0.4, -4.0, Math.PI * 0.8);
const tNicu = tag('小さな命を守る、新生児の部屋', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tNicu);
const tBeep = tag('モニターの音だけが、ひびく', { size: 50, w: 760, bg: '#3480e6', sx: 1.8 }); qs.add(tBeep);

// ---------- 4段目. 病室（x=150）。ベッドの母親をかこむ医師たちと助産師 ----------
const CX = 150;
{ const fl = box(10, 0.04, 8, mat('#c8d0d4')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const wl = box(10, 4, 0.3, mat('#dde6ea')); wl.position.set(CX, 2, -6.5); qs.add(wl);
  const bd = box(1.2, 0.7, 2.2, mat('#eef2f4')); bd.position.set(CX, 0.35, -4.4); qs.add(bd);
  const wn = box(2, 1.4, 0.05, gl('#9ab8d8')); wn.position.set(CX + 2.4, 2.2, -6.32); qs.add(wn);
  const pl = new THREE.PointLight('#fff0e0', 2.4, 9); pl.position.set(CX, 3, -3.4); qs.add(pl); }
const MOM4 = person(MOM, CX, -3.45, 0); MOM4.rotation.x = -Math.PI / 2; MOM4.position.y = 0.74;
const TEAM4 = [coat(person(DOC, CX - 1.0, -3.4, -0.6)), coat(person(DOC2, CX + 1.0, -3.6, 0.7)), person(MID, CX - 0.9, -5.4, 0.8)];
const MON4 = monitor(CX + 1.3, 1.5, -5.6, -0.4);
const tTeam = tag('仲間の医師や助産師と、命に向き合う', { size: 42, w: 920, bg: '#14161c', sx: 2.0 }); qs.add(tTeam);
const tBoth = tag('母と子、どちらも救いたい', { size: 52, w: 720, bg: '#3480e6', sx: 1.75 }); qs.add(tBoth);

// ---------- 5段目. 夜のリビング（x=200）。テレビと、テーブルにつんだ漫画本 ----------
const DX = 200;
{ const fl = box(10, 0.04, 8, mat('#8a6e54')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.3, mat('#d8ccb8')); wl.position.set(DX, 2, -5.5); qs.add(wl);
  const tb = box(3.2, 0.5, 0.6, mat('#5a4434')); tb.position.set(DX, 0.25, -4.8); qs.add(tb);
  const tv = box(2.6, 1.5, 0.1, mat('#111114')); tv.position.set(DX, 1.4, -4.9); qs.add(tv);
  const lt = new THREE.PointLight('#ffd8a8', 1.8, 8); lt.position.set(DX - 2, 2.6, -1.5); qs.add(lt);
  const ct = box(1.6, 0.4, 0.9, mat('#a88a68')); ct.position.set(DX, 0.2, -2.2); qs.add(ct); }
const TVS5 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), new THREE.MeshBasicMaterial({ color: '#7ab0d8' })); TVS5.position.set(DX, 1.4, -4.84); qs.add(TVS5);
const BOOKS5 = []; for (let i = 0; i < 6; i++) { const b = box(0.36, 0.07, 0.5, mat(['#e85a5a', '#5a8ae8', '#e8c040', '#6ac07a', '#c87ad8', '#f0a060'][i])); b.position.set(DX - 0.3, 0.44 + i * 0.075, -2.2); b.rotation.y = (R() - 0.5) * 0.3; qs.add(b); BOOKS5.push(b); }
const t2015 = tag('2015年の、日本のドラマ', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2015);
const tManga = tag('漫画が原作の、医療ドラマ', { size: 52, w: 720, bg: '#3480e6', sx: 1.75 }); qs.add(tManga);

// ---------- 6段目. 夜のライブのステージ（x=250）。スポットライトの下でピアノを弾く男と、客席のシルエット ----------
const EX = 250;
{ const fl = box(14, 0.04, 12, mat('#1a1418')); fl.position.set(EX, 0.02, -2); qs.add(fl);
  const st = box(6, 0.5, 4, mat('#3a2a22')); st.position.set(EX, 0.25, -5.0); qs.add(st);
  const wl = box(14, 6, 0.3, mat('#120e14')); wl.position.set(EX, 3, -7.2); qs.add(wl); }
const PIANO6 = new THREE.Group(); PIANO6.position.set(EX + 0.3, 0.5, -5.2); qs.add(PIANO6);
{ const pm = new THREE.MeshStandardMaterial({ color: '#0c0c10', metalness: 0.4, roughness: 0.25 });
  const bd = box(1.6, 0.36, 1.9, pm); bd.position.set(0, 0.86, 0); PIANO6.add(bd); const lid = box(1.6, 0.04, 1.8, pm); lid.position.set(0.3, 1.5, -0.1); lid.rotation.z = 0.55; PIANO6.add(lid);
  const ky = box(1.4, 0.05, 0.22, mat('#f4f2ee')); ky.position.set(0, 0.86, 1.05); PIANO6.add(ky);
  for (const [x, z] of [[-0.7, 0.8], [0.7, 0.8], [0, -0.8]]) { const l = box(0.1, 0.7, 0.1, pm); l.position.set(x, 0.35, z); PIANO6.add(l); } }
const PLAYER6 = person(NIGHT, EX + 0.3, -3.6, Math.PI, 0.5); PLAYER6.userData.legs.forEach(l => l.rotation.x = -1.5); PLAYER6.position.y = 0.18;
const SPOT6 = new THREE.SpotLight('#ffe8c0', 40, 14, 0.4, 0.5, 1.2); SPOT6.position.set(EX + 0.3, 6.5, -2.0); SPOT6.target.position.set(EX + 0.3, 0.5, -4.6); qs.add(SPOT6); qs.add(SPOT6.target);
const BEAM6 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6, 24, 1, true), gl('#fff0c8', 0.09)); BEAM6.position.set(EX + 0.3, 3.6, -3.6); BEAM6.rotation.x = 0.35; qs.add(BEAM6);
const CROWD6 = []; for (let i = 0; i < 7; i++) { const p = person(NIGHT, EX - 3 + i, 0.6 + (i % 2) * 0.5, Math.PI); CROWD6.push(p); }
const NOTES6 = []; for (let i = 0; i < 6; i++) { const n = tag('♪', { size: 80, w: 110, h: 110, bg: 'rgba(0,0,0,0)', color: '#ffd860', sx: 0.26 }); qs.add(n); NOTES6.push(n); }
const tTwo = tag('医師とピアニスト、2つの顔', { size: 50, w: 760, bg: '#14161c', sx: 1.8 }); qs.add(tTwo);
const tStage = tag('夜は、ステージに立つ', { size: 54, w: 640, bg: '#e6b450', color: '#14161c', sx: 1.6 }); qs.add(tStage);

// ---------- shots ----------
const ALL = [tCall, tRun, tCalm, tObgyn, tNicu, tBeep, tTeam, tBoth, t2015, tManga, tTwo, tStage, Q1, ...NOTES6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotHall(t, quiz = 0) { // 1段目 0〜9：真夜中の病院に、1本の電話が鳴る。白衣の医師が、走り出す（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.5; S.darken(0.55, '#0e1420');
  const ring = !quiz && t < 5.5 || quiz; PHONE1.position.y = 1.1 + (ring ? Math.abs(Math.sin(t * 30)) * 0.02 : 0); PHONE1.rotation.z = ring ? Math.sin(t * 40) * 0.06 : 0;
  RING1.forEach((r, i) => { r.visible = ring && Math.sin(t * 6 - i) > -0.2; r.material.opacity = 0.8 - i * 0.2; });
  const k = quiz ? 0 : clamp((t - 5.2) / 3.5); DOC1.position.set(lerp(0.6, 0.3, k), 0, lerp(-5.0, -1.2, k)); DOC1.rotation.y = 0; poseWalk(DOC1, t * 11, k > 0 && k < 1 ? 1.2 : 0);
  DOC1.userData.head.rotation.y = k === 0 ? -0.5 : 0;
  Q1.position.set(-1.3, 1.9, -3.0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tCall, 1.05); pin(tRun, 1.05);
  if (!quiz) { tCall.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tCall.visible = false; tRun.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.6, 1.4, u), lerp(1.9, 1.8, u), lerp(1.6, 1.0, u), -0.4, 1.2, -4.0, 62);
  return qs;
}
function shotBirth(t) { // 2段目 9〜17：主人公は、いつもおだやかな医師。赤ちゃんを取り上げる、産婦人科医
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.2; S.key.intensity = 1.1;
  beat(MON2, t, 1.6);
  const hold = t > 4.3; DOC2a.userData.arms.forEach((a, i) => { a.rotation.x = hold ? -1.2 : -0.3; a.rotation.z = hold ? (i ? -0.4 : 0.4) : 0; });
  BABY2.visible = hold; BABY2.position.set(AX - 0.2 + Math.sin(0.3) * 0.5, 1.12, -3.4 + Math.cos(0.3) * 0.5); BABY2.rotation.y = 0.3;
  DOC2a.userData.head.rotation.x = hold ? 0.35 : 0; MID2.userData.head.rotation.y = 0.4;
  const u = ease(t / 8);
  look(AX + lerp(0.8, 0.5, u), lerp(1.8, 1.7, u), lerp(0.4, -0.6, u), AX - 0.1, 1.2, -3.4, 62);
  pin(tCalm, 1.05); pin(tObgyn, 1.05);
  tCalm.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCalm.visible = false; tObgyn.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotNicu(t) { // 3段目 17〜25：小さな命を守る、新生児の部屋。モニターの音だけが、ひびく
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.6; S.darken(0.25, '#1a2a3a');
  MONS3.forEach((m, i) => beat(m, t + i * 0.37, 1.8)); INC3.forEach((b, i) => b.scale.y = 0.7 + Math.sin(t * 2.4 + i) * 0.02);
  NURSE3.userData.head.rotation.x = 0.3; NURSE3.userData.arms[1].rotation.x = -0.7;
  const u = ease(t / 8);
  look(BX + lerp(-2.6, -1.8, u), lerp(2.0, 1.9, u), lerp(0.6, 0.2, u), BX + 0.2, 1.0, -3.6, 62);
  pin(tNicu, 1.05); pin(tBeep, 1.05);
  tNicu.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNicu.visible = false; tBeep.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotWard(t) { // 4段目 25〜33：仲間の医師や助産師と、ひとつの命に向き合う。母と子、どちらも救いたい
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.1; S.key.intensity = 0.9;
  beat(MON4, t, 2.0);
  TEAM4.forEach((p, i) => { p.userData.head.rotation.x = 0.3; p.userData.arms[i % 2].rotation.x = -0.6 + Math.sin(t * 2 + i) * 0.15; });
  MOM4.userData.head.rotation.z = Math.sin(t * 0.8) * 0.2;
  const u = ease(t / 8);
  look(CX + lerp(0.3, 0.0, u), lerp(2.4, 2.3, u), lerp(0.4, -0.4, u), CX, 1.0, -4.4, 62);
  pin(tTeam, 1.05); pin(tBoth, 1.05);
  tTeam.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTeam.visible = false; tBoth.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotLiving(t) { // 5段目 33〜42：2015年の、日本のドラマ。漫画が原作の、医療ドラマ
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.4; S.darken(0.6, '#0a0a10');
  TVS5.material.color.setHSL(0.56 + Math.sin(t * 0.7) * 0.04, 0.4, 0.55 + Math.sin(t * 3.1) * 0.05);
  BOOKS5.forEach((b, i) => b.visible = t > 4.2 + i * 0.12);
  const u = ease(t / 9);
  look(DX + lerp(-0.6, 0.4, u), lerp(1.9, 1.8, u), lerp(2.0, 1.2, u), DX, 1.0, -3.4, 62);
  pin(t2015, 1.05); pin(tManga, 1.05);
  t2015.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2015.visible = false; tManga.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：医師とピアニスト、2つの顔をもつ。夜は、ステージに立つ
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.25; S.key.intensity = 0.1; S.darken(0.9, '#050306');
  PLAYER6.userData.arms.forEach((a, i) => { a.rotation.x = -1.1 + Math.sin(t * 9 + i * 2) * 0.12; }); PLAYER6.userData.head.rotation.z = Math.sin(t * 2) * 0.12;
  NOTES6.forEach((n, i) => { const s = ((t * 0.5 + i / 6) % 1); n.position.set(EX + 0.3 + Math.sin(i * 2.1) * 1.2, 2.0 + s * 1.6, -4.8); n.userData.pop(clamp((t - 0.8 - i * 0.2) / 0.3)); n.material.opacity = 1 - s; });
  const u = ease(t / 7);
  look(EX + lerp(-1.0, -0.6, u), lerp(1.9, 1.9, u), lerp(1.8, 1.0, u), EX + 0.3, 1.3, -4.6, 62);
  pin(tTwo, 1.05); pin(tStage, 1.05);
  if (t < 3.6) tTwo.userData.pop((t - 0.3) / 0.35); else tStage.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（真夜中の廊下に戻る）
  shotHall(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotHall(t, 0) },
  { a: 9, b: 17, f: shotBirth },
  { a: 17, b: 25, f: shotNicu },
  { a: 25, b: 33, f: shotWard },
  { a: 33, b: 42, f: shotLiving },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '真夜中の病院に、<br>1本の電話が鳴る。'],
  [5.6, 9.0, '白衣の医師が、<br>走り出す。'],
  [9.2, 13.2, '主人公は、いつも<br>おだやかな医師。'],
  [13.2, 17.0, '赤ちゃんを取り上げる、<br>産婦人科医。'],
  [17.2, 21.0, '小さな命を守る、<br>新生児の部屋。'],
  [21.0, 25.0, 'モニターの音だけが、<br>ひびいている。'],
  [25.2, 29.0, '仲間の医師や助産師と、<br>ひとつの命に向き合う。'],
  [29.0, 33.0, '母と子、<br>どちらも救いたい。'],
  [33.2, 37.4, '2015年の、<br>日本のドラマ。'],
  [37.4, 41.8, '漫画が原作の、<br>医療ドラマ。'],
  [42.2, 45.4, '医師とピアニスト、<br>2つの顔をもつ。'],
  [45.4, 49.0, '夜は、<br>ステージに立つ。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>コウノドリ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q147', v2: true, answer: 'コウノドリ',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 14710,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [2.0, 'bubble'], [5.6, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'コウノドリ': 'コウノドリ', 'ピアニスト': 'ピアニスト', '産婦人科医': 'さんふじんかい', '取り上げる': 'とりあげる', 'ステージ': 'ステージ', 'モニター': 'モニター', '2015年': 'にせんじゅうごねん', '真夜中': 'まよなか', '助産師': 'じょさんし', '新生児': 'しんせいじ', '向き合う': 'むきあう', '救いたい': 'すくいたい', '走り出す': 'はしりだす', '医療': 'いりょう', '原作': 'げんさく', '漫画': 'まんが', '赤ちゃん': 'あかちゃん', '主人公': 'しゅじんこう', '聞かせて': 'きかせて', '当てて': 'あてて', '1本': 'いっぽん', '2つ': 'ふたつ', '病院': 'びょういん', '電話': 'でんわ', '白衣': 'はくい', '医師': 'いし', '仲間': 'なかま', '部屋': 'へや', '小さな': 'ちいさな', '命': 'いのち', '守る': 'まもる', '音': 'おと', '母': 'はは', '子': 'こ', '顔': 'かお', '夜': 'よる', '立つ': 'たつ', '日本': 'にほん', '鳴る': 'なる', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう' },
    caption: 'このドラマのタイトル、わかる？\n真夜中の病院に、1本の電話が鳴る。白衣の医師が、走り出す。主人公は、いつもおだやかな医師。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'Hulu', 'ドラマ好き', '医療ドラマ'],
  },
});
applyQuizCards({ answer: 'コウノドリ', info: 'Netflix・Hulu｜日本のドラマ', answerSize: 128 });
