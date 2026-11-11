import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #073 エミリー、パリへ行く（ドラマ・アメリカ・2020年〜・シーズン1は全10話。Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/emily-in-paris で2026/11/11確認（Filmarks の動画配信欄も Netflix 見放題）。
//   Filmarks シーズン1 4.1・レビュー41,774件 filmarks.com/dramas/7561/10906）
// 確かめた事実（Filmarks・JustWatch の作品紹介、ja.wikipedia.org/wiki/エミリー、パリへ行く。2026/11/11）：
//   ・主人公はシカゴのマーケティング会社で働いていた29歳。インスタグラマー（Wikipedia）
//   ・会社がパリの老舗マーケティング会社を子会社として買収し、主人公はその会社の SNS 戦略の担当として派遣される（Wikipedia）
//   ・思いがけずパリで念願の職を手に入れ、仕事に恋に友情に全力投球（Filmarks・JustWatch）
//   ・アメリカとフランスの文化の違いに戸惑いながら仕事に取り組む。フランス語教室に通う（Wikipedia）
//   ・Netflix オリジナル。2020年10月2日配信開始。シーズン1は全10話、パリ市内と近郊で撮影（Wikipedia）
// 構成（ヒント6段）：1 ある日突然、海外で働くことに。会社が外国の会社を買収 → 2 主人公は29歳のマーケター、SNSの投稿が得意
//   → 3 石畳とカフェの古い街、言葉は学び始めたばかり → 4 老舗の会社で文化のちがいに戸惑う、仕事に恋に友情に全力
//   → 5 2020年に配信が始まったアメリカのドラマ、撮影は本当にその街で → 6 決め手：エッフェル塔の見える街・タイトルにはその街の名前
// 人物名・地名（6段目まで）・会社名は出さない。俳優の顔・ポスター・ロゴ・衣装の再現・有名な場面の構図は使わない。人は汎用の3D。結末は言わない

const S = quizStage({ bg: '#c8dcf0', floor: '#b8b0a0', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(7373);

const EM = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#e86a9a', pants: '#f4f0e4', long: true, skirt: true };
const BOSS = { skin: '#f1c9a5', hair: '#c8a070', shirt: '#2a3046', pants: '#2a3046', long: true, skirt: true };
const COL = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#1d1a19', '#5a4a3a', '#2c2421'][i % 3], shirt: ['#1a1a1e', '#3a3a44', '#e9e4da', '#14161c'][i % 4], pants: '#1a1a1e', long: i % 2 === 0, skirt: i % 2 === 0, tie: i % 2 === 1 });

// ---------- 1段目. アメリカのオフィス（x=0）。上司に呼ばれた彼女に、スーツケースと飛行機 ----------
{ const fl = box(16, 0.04, 12, mat('#9aa0a8')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(16, 6, 0.2, mat('#e8ecf0')); wl.position.set(0, 3, -4.5); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: canvasTex(400, 200, (g, w, h) => { g.fillStyle = '#9ac4e8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { const bw = 20 + (i * 11) % 18, bh = 50 + (i * 37) % 120; g.fillStyle = ['#7a8aa0', '#8a9ab0'][i % 2]; g.fillRect(i * 26, h - bh, bw, bh); } }) })); win.position.set(-1.5, 3.2, -4.38); qs.add(win);
  const dk = box(2.4, 0.08, 1.0, mat('#e8e4dc')); dk.position.set(0.6, 0.78, -2.2); qs.add(dk); const dl = box(2.2, 0.74, 0.9, mat('#c8c4bc')); dl.position.set(0.6, 0.37, -2.2); qs.add(dl);
  const pc = box(0.7, 0.45, 0.04, mat('#14161c')); pc.position.set(0.9, 1.06, -2.5); qs.add(pc); }
const boss1 = makePerson(BOSS); boss1.position.set(0.9, 0, -3.1); qs.add(boss1);
const em1 = makePerson(EM); em1.position.set(0.0, 0, -0.8); em1.rotation.y = Math.PI; qs.add(em1);
const SUIT = new THREE.Group(); { const b = box(0.5, 0.7, 0.24, mat('#e2483c')); b.position.y = 0.45; SUIT.add(b); const h = box(0.2, 0.06, 0.06, mat('#14161c')); h.position.y = 0.86; SUIT.add(h); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#14161c')); w.position.set(s * 0.18, 0.06, 0); SUIT.add(w); } } SUIT.position.set(0.8, 0, -0.6); qs.add(SUIT);
const PLANE = new THREE.Group(); { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 12), mat('#f4f4f8')); f.rotation.z = Math.PI / 2; PLANE.add(f); const w = box(0.3, 0.03, 1.2, mat('#d8dce4')); PLANE.add(w); const tl = box(0.2, 0.3, 0.04, mat('#3a7ad8')); tl.position.set(-0.55, 0.15, 0); PLANE.add(tl); const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat('#f4f4f8')); nose.position.x = 0.6; PLANE.add(nose); } qs.add(PLANE);
const tSudden = tag('突然の、海外勤務', { size: 62, w: 560, bg: '#14161c', sx: 2.0 }); tSudden.position.set(0.3, 2.2, -1.4); qs.add(tSudden);
const tMe = tag('行くのは、わたし', { size: 64, w: 540, bg: '#e86a9a', sx: 2.0 }); tMe.position.set(0.3, 2.2, -1.4); qs.add(tMe);

// ---------- 2段目. 部屋で自撮り（x=40）。スマホのまわりにハートといいねが浮かぶ ----------
const AX = 40;
{ const fl = box(12, 0.04, 10, mat('#e8d8c8')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#f8e8f0')); wl.position.set(AX, 2.5, -3.4); qs.add(wl);
  const mr = box(1.2, 1.8, 0.05, mat('#d8e8f4')); mr.position.set(AX + 1.8, 1.8, -3.27); qs.add(mr); const mf = box(1.3, 1.9, 0.04, mat('#e6b450')); mf.position.set(AX + 1.8, 1.8, -3.3); qs.add(mf);
  for (let i = 0; i < 4; i++) { const b = box(0.4, 0.6, 0.3, mat(['#e86a9a', '#f2c14e', '#8e6bbf', '#4fa3d1'][i])); b.position.set(AX - 2.6 + i * 0.5, 0.3, -2.9); qs.add(b); } }
const em2 = makePerson(EM); em2.position.set(AX, 0, -1.4); qs.add(em2);
const PHONE = box(0.16, 0.3, 0.02, mat('#14161c')); qs.add(PHONE);
const HEARTS = []; for (let i = 0; i < 9; i++) { const h = tag(i % 3 ? '♥' : '★', { size: 80, w: 130, h: 130, bg: i % 3 ? '#e2483c' : '#3a7ad8', sx: 0.45 }); h.userData.a = R() * 6; h.userData.r = 0.5 + R() * 0.7; qs.add(h); HEARTS.push(h); }
const t29 = tag('29歳のマーケター', { size: 62, w: 560, bg: '#14161c', sx: 2.0 }); t29.position.set(AX, 2.75, -1.4); qs.add(t29);
const tSNS = tag('SNSが、得意', { size: 70, w: 460, bg: '#e86a9a', sx: 1.7 }); tSNS.position.set(AX, 2.75, -1.4); qs.add(tSNS);

// ---------- 3段目. 石畳とカフェの古い街並み（x=80） ----------
const BX = 80;
{ const st = new THREE.Mesh(new THREE.PlaneGeometry(14, 30), new THREE.MeshStandardMaterial({ map: canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#8a8478'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 * 10; x < w; x += 20) { g.fillStyle = ['#a09a8c', '#968f82', '#aaa496'][(x + y) % 3]; g.fillRect(x + 1, y + 1, 18, 14); } }) })); st.rotation.x = -Math.PI / 2; st.position.set(BX, 0.03, -8); qs.add(st);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const h = 6 + (i % 2); const b = box(4, h, 4.4, mat(['#e8dcc0', '#dcd0b0', '#efe4cc'][(i + (s > 0)) % 3])); b.position.set(BX + s * 5, h / 2, -2 - i * 4.6); qs.add(b);
    const rf = box(4.2, 1.2, 4.6, mat('#5a6a7a')); rf.position.set(BX + s * 5, h + 0.6, -2 - i * 4.6); qs.add(rf);
    for (let f = 0; f < 3; f++) for (let k = 0; k < 2; k++) { const w = box(0.05, 0.9, 0.6, mat('#3a4a5a')); w.position.set(BX + s * 2.98, 1.5 + f * 1.6, -2 - i * 4.6 + (k ? 1 : -1)); qs.add(w); const bl = box(0.2, 0.06, 0.8, mat('#2a2e38')); bl.position.set(BX + s * 2.9, 1.0 + f * 1.6, -2 - i * 4.6 + (k ? 1 : -1)); qs.add(bl); } }
  for (let i = 0; i < 3; i++) { const aw = box(1.0, 0.08, 2.6, mat(i % 2 ? '#c43a3a' : '#2f6f4a')); aw.position.set(BX - 2.5, 2.4, -1 - i * 4.6); aw.rotation.z = -0.3; qs.add(aw);
    for (let k = 0; k < 2; k++) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), mat('#e9e4da')); tb.position.set(BX - 2.0, 0.75, -0.4 - i * 4.6 - k * 1.2); qs.add(tb); const lg = box(0.05, 0.75, 0.05, mat('#24262b')); lg.position.set(BX - 2.0, 0.37, -0.4 - i * 4.6 - k * 1.2); qs.add(lg); } } }
const em3 = makePerson(EM); qs.add(em3);
const SPEECH = []; for (let i = 0; i < 3; i++) { const b = tag('？', { size: 90, w: 140, h: 140, bg: '#ffffff', color: '#14161c', sx: 0.5 }); qs.add(b); SPEECH.push(b); }
const tOld = tag('石畳の古い街', { size: 66, w: 480, bg: '#14161c', sx: 1.7 }); qs.add(tOld);
const tLang = tag('言葉は、まだ勉強中', { size: 58, w: 600, bg: '#3a7ad8', sx: 2.0 }); qs.add(tLang);

// ---------- 4段目. 老舗の会社（x=120）。黒い服の同僚たちの中、ピンクの彼女。そして夜のパーティ ----------
const CX = 120;
{ const fl = box(14, 0.04, 10, mat('#8a6a4a')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#f0e8d8')); wl.position.set(CX, 3, -4); qs.add(wl);
  for (let i = 0; i < 4; i++) { const m = box(1.4, 0.05, 2.0, mat('#e6c870')); m.position.set(CX - 4.5 + i * 3, 5.7, -1); qs.add(m); }
  for (let i = 0; i < 3; i++) { const win = box(1.0, 2.6, 0.05, mat('#d8e4ec')); win.position.set(CX - 3 + i * 3, 2.6, -3.88); qs.add(win); }
  const mt = box(3.2, 0.08, 1.2, mat('#5a4030')); mt.position.set(CX, 0.78, -1.8); qs.add(mt); const ml = box(3.0, 0.74, 1.0, mat('#4a3424')); ml.position.set(CX, 0.37, -1.8); qs.add(ml); }
const COLS = []; for (let i = 0; i < 4; i++) { const p = makePerson(COL(i)); p.position.set(CX - 1.2 + i * 0.8, 0, -2.8); qs.add(p); COLS.push(p); }
const em4 = makePerson(EM); em4.position.set(CX, 0, -0.6); em4.rotation.y = Math.PI; qs.add(em4);
const SPARK = []; for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: ['#ffd84a', '#e86a9a', '#ffffff'][i % 3] })); qs.add(s); SPARK.push(s); }
const tCulture = tag('文化のちがい', { size: 68, w: 460, bg: '#14161c', sx: 1.6 }); tCulture.position.set(CX, 2.75, -1.6); qs.add(tCulture);
const tAll = tag('仕事も恋も、全力', { size: 62, w: 560, bg: '#e86a9a', sx: 1.9 }); tAll.position.set(CX, 2.75, -1.6); qs.add(tAll);

// ---------- 5段目. 夜の部屋のテレビ（x=180）。2020年配信、アメリカのドラマ ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(3.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.1, -3.5); qs.add(tvb); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f8c8d8'); gr.addColorStop(1, '#f4e4c8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 24; i++) { g.beginPath(); g.arc((i * 131) % w, (i * 83) % h, 6 + i % 5, 0, Math.PI * 2); g.fill(); } }) }));
TV.position.set(TX, 2.1, -3.42); qs.add(TV);
const CAM = new THREE.Group(); { const b = box(0.5, 0.34, 0.3, mat('#24262b')); CAM.add(b); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.24, 14), mat('#14161c')); l.rotation.x = Math.PI / 2; l.position.z = 0.26; CAM.add(l); } CAM.position.set(TX + 2.4, 1.2, -1.4); CAM.rotation.y = -0.6; qs.add(CAM);
const t2020 = tag('2020年 アメリカのドラマ', { size: 56, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.7 }); t2020.position.set(TX, 4.1, -3.0); qs.add(t2020);
const tShot = tag('撮影は、本当にその街で', { size: 54, w: 720, bg: '#e86a9a', sx: 2.7 }); tShot.position.set(TX, 4.1, -3.0); qs.add(tShot);

// ---------- 6段目. 鉄の塔が見える広場（x=220）。スマホをかかげる彼女 ----------
const DX = 220;
{ const gr = box(24, 0.04, 30, mat('#9ab878')); gr.position.set(DX, 0.02, -10); qs.add(gr);
  const path = box(3, 0.05, 30, mat('#d8ccb0')); path.position.set(DX, 0.04, -10); qs.add(path); }
const TOWER = new THREE.Group(); { const m = mat('#6a5a4a');
  const fr = (rb, rt, h, y) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 4, 1), m); g.rotation.y = Math.PI / 4; g.position.y = y + h / 2; TOWER.add(g); };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 4.6, 4), m); leg.position.set(sx * 1.9, 2.1, sz * 1.9); leg.rotation.z = sx * 0.38; leg.rotation.x = -sz * 0.38; TOWER.add(leg); }
  const p1 = box(3.4, 0.35, 3.4, m); p1.position.y = 4.3; TOWER.add(p1);
  fr(1.5, 0.75, 4.2, 4.45); const p2 = box(1.7, 0.25, 1.7, m); p2.position.y = 8.7; TOWER.add(p2);
  fr(0.7, 0.18, 7.0, 8.8); const p3 = box(0.6, 0.25, 0.6, m); p3.position.y = 15.9; TOWER.add(p3);
  const sp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.6, 8), m); sp.position.y = 16.8; TOWER.add(sp);
  for (const r of [0, Math.PI / 2]) { const ar = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.18, 8, 20, Math.PI), m); ar.position.y = 2.0; ar.rotation.y = r; ar.scale.y = 1.4; TOWER.add(ar); } }
TOWER.position.set(DX + 1.5, 0, -22); qs.add(TOWER);
const em6 = makePerson(EM); em6.position.set(DX - 0.15, 0, -1.0); em6.rotation.y = Math.PI - 0.3; qs.add(em6);
const PHONE6 = box(0.16, 0.3, 0.02, mat('#14161c')); qs.add(PHONE6);
const tTower = tag('エッフェル塔の街', { size: 64, w: 540, bg: '#14161c', sx: 1.5 }); tTower.position.set(DX + 0.5, 2.7, -2.0); qs.add(tTower);
const tName = tag('タイトルに、街の名前', { size: 58, w: 640, bg: '#e86a9a', sx: 1.7 }); tName.position.set(DX + 0.5, 2.7, -2.0); qs.add(tName);

// ---------- shots ----------
const ALL = [tSudden, tMe, t29, tSNS, tOld, tLang, tCulture, tAll, t2020, tShot, tTower, tName];
function base() { S.reset(); ALL.forEach(x => x.visible = false); HEARTS.forEach(h => h.visible = false); SPEECH.forEach(b => b.visible = false); SPARK.forEach(s => s.visible = false); PLANE.visible = false; PHONE.visible = false; PHONE6.visible = false; }

function shotOffice(t, quiz = 0) { // 1段目 0〜9：ある日突然、海外で働くことになった。会社が外国の会社を買収したから（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.25;
  boss1.userData.arms[1].rotation.x = -1.3; boss1.userData.arms[1].rotation.z = 0.3;
  const jump = quiz ? 0 : Math.max(0, Math.sin(clamp((t - 4.8) * 4, 0, Math.PI))) * 0.3;
  em1.position.y = jump; em1.userData.arms.forEach(a => a.rotation.x = t > 4.8 ? -2.6 : -0.2);
  if (t > 4.6 || quiz) { PLANE.visible = true; const k = quiz ? 0.5 : clamp((t - 4.6) / 3.5); PLANE.position.set(lerp(-3.5, 3.5, k), 2.4 + k * 1.2, -3.9); PLANE.rotation.z = 0.25; }
  SUIT.rotation.y = Math.sin(t * 2) * 0.1;
  if (!quiz) { tSudden.userData.pop(1); if (t > 4.4) tSudden.visible = false; tMe.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.4, -0.3, u), lerp(1.9, 1.8, u), lerp(3.4, 2.8, u), 0.4, 1.4, -2.4, 58);
  return qs;
}
function shotSelfie(t) { // 2段目 9〜17：主人公は29歳、マーケティングの仕事。SNSの投稿が何より得意
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.35;
  em2.userData.arms[1].rotation.x = -2.2; em2.userData.arms[1].rotation.z = 0.2; em2.userData.head.rotation.z = Math.sin(t * 1.5) * 0.1;
  PHONE.visible = true; PHONE.position.set(AX + 0.42, 2.08, -0.95); PHONE.rotation.x = 0.3;
  if (t > 4.2) HEARTS.forEach((h, i) => { const k = ((t - 4.2) * 0.5 + i * 0.11) % 1; h.visible = true; h.position.set(AX + Math.cos(h.userData.a) * h.userData.r, 1.0 + k * 1.6, -1.2 + Math.sin(h.userData.a) * 0.3); h.material.opacity = 1 - k; });
  t29.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t29.visible = false; tSNS.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.3, 0.2, u), lerp(1.8, 1.7, u), lerp(2.8, 2.3, u), AX, 1.5, -1.4, 58);
  return qs;
}
function shotStreet(t) { // 3段目 17〜25：石畳とカフェが続く古い街並み。その国の言葉は、学び始めたばかり
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.3;
  const z = lerp(0.5, -3.0, clamp(t / 8)); em3.position.set(BX + 0.3, 0, z); em3.rotation.y = Math.PI; poseWalk(em3, t * 6, t < 4.2 ? 0.8 : 0);
  if (t > 4.2) { em3.rotation.y = Math.PI + 1.2; em3.userData.head.rotation.x = 0.1; SPEECH.forEach((b, i) => { b.visible = true; b.userData.pop((t - 4.4 - i * 0.25) / 0.3); b.position.set(BX - 0.5 + i * 0.45, 1.75 + (i % 2) * 0.25, z - 0.5); }); }
  tOld.position.set(BX + 0.3, 2.95, z - 1.0); tLang.position.set(BX + 0.3, 2.95, z - 1.0);
  tOld.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOld.visible = false; tLang.userData.pop((t - 4.2) / 0.35);
  look(BX + 0.6, 2.0, z + 3.6, BX, 2.0, z - 6, 60);
  return qs;
}
function shotCompany(t) { // 4段目 25〜33：老舗の会社で、文化のちがいに戸惑う毎日。仕事に恋に友情に、全力投球
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 1.2;
  COLS.forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = 0); p.userData.arms[0].rotation.x = -0.5; p.userData.arms[0].rotation.z = 0.4; p.userData.head.rotation.y = Math.sin(t * 0.7 + i) * 0.3; });
  if (t > 4.2) { S.darken(0.45, '#2a1a30'); S.hemi.intensity = 0.8; em4.userData.arms.forEach(a => a.rotation.x = -2.6 + Math.sin(t * 6) * 0.2); em4.position.y = Math.abs(Math.sin(t * 5)) * 0.08;
    SPARK.forEach((s, i) => { const a = i * 0.4 + t * 1.5; s.visible = true; s.position.set(CX + Math.cos(a) * (0.8 + (i % 4) * 0.3), 1.0 + ((i * 0.37 + t * 0.4) % 1) * 2.2, -0.6 + Math.sin(a) * 0.6); s.rotation.y = t * 3; }); }
  else em4.userData.arms.forEach(a => a.rotation.x = 0);
  em4.rotation.y = t > 4.2 ? 0 : Math.PI;
  tCulture.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCulture.visible = false; tAll.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.4, 0.3, u), lerp(2.0, 1.9, u), lerp(3.4, 2.8, u), CX, 1.4, -1.8, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2020年に配信が始まったアメリカのドラマ。撮影は本当にその街で
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#0a0810');
  CAM.visible = t > 4.2;
  t2020.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2020.visible = false; tShot.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.8, 3.0, u), lerp(5.4, 4.6, u), TX, 2.6, -3.4, 58);
  return qs;
}
function shotTower(t) { // 6段目 42〜49（決め手）：仕事場はエッフェル塔の見える街。タイトルには、その街の名前
  base(); S.aim(DX, -6); lift(0); S.hemi.intensity = 1.35; S.key.intensity = 1.5;
  em6.userData.arms[1].rotation.x = -2.4; PHONE6.visible = true; PHONE6.position.set(DX + 0.05, 2.15, -1.35);
  tTower.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tTower.visible = false; tName.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.7, 0.6, u), lerp(1.5, 1.4, u), lerp(3.2, 2.7, u), DX + 0.9, 4.2, -18, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（オフィスに戻る）
  shotOffice(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.25, 0.6, d); S.darken(0.4 * d, '#2a2030');
  const k = ease(t / 7);
  look(lerp(-0.3, -0.2, k), lerp(1.8, 1.7, k), lerp(2.8, 2.3, k), 0.4, 1.4, -2.4, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotOffice(t, 0) },
  { a: 9, b: 17, f: shotSelfie },
  { a: 17, b: 25, f: shotStreet },
  { a: 25, b: 33, f: shotCompany },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotTower },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ある日突然、海外で<br>働くことになった。'],
  [5.6, 9.0, '会社が、外国の会社を<br>買収したから。'],
  [9.2, 13.2, '主人公は29歳。<br>マーケティングの仕事。'],
  [13.2, 17.0, 'SNSの投稿が、<br>何より得意。'],
  [17.2, 21.0, '石畳とカフェが続く、<br>古い街並み。'],
  [21.0, 25.0, 'その国の言葉は、<br>学び始めたばかり。'],
  [25.2, 29.0, '老舗の会社で、文化の<br>ちがいに戸惑う毎日。'],
  [29.0, 33.0, '仕事に恋に友情に、<br>全力投球。'],
  [33.2, 37.4, '2020年に配信が始まった、<br>アメリカのドラマ。'],
  [37.4, 41.8, '撮影は、本当に<br>その街で行われた。'],
  [42.2, 45.4, '仕事場は、<br>エッフェル塔の見える街。'],
  [45.4, 49.0, 'タイトルには、<br>その街の名前。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、エミリー、<br>パリへ行く。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q073', v2: true, answer: 'エミリー、パリへ行く',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 7373,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '突然': 'とつぜん', '海外': 'かいがい', '働く': 'はたらく', '会社': 'かいしゃ', '外国': 'がいこく', '買収': 'ばいしゅう', '主人公': 'しゅじんこう', '29歳': 'にじゅうきゅうさい', '仕事': 'しごと', 'SNS': 'エスエヌエス', '投稿': 'とうこう', '何より': 'なにより', '得意': 'とくい', '石畳': 'いしだたみ', '続く': 'つづく', '古い': 'ふるい', '街並み': 'まちなみ', '国': 'くに', '言葉': 'ことば', '学び始めた': 'まなびはじめた', '老舗': 'しにせ', '文化': 'ぶんか', '戸惑う': 'とまどう', '毎日': 'まいにち', '恋': 'こい', '友情': 'ゆうじょう', '全力投球': 'ぜんりょくとうきゅう', '2020年': 'にせんにじゅうねん', '配信': 'はいしん', '始まった': 'はじまった', '撮影': 'さつえい', '本当に': 'ほんとうに', '街': 'まち', '行われた': 'おこなわれた', '仕事場': 'しごとば', '塔': 'とう', '見える': 'みえる', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '行く': 'いく', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nある日突然、海外で働くことになった。会社が、外国の会社を買収したから。主人公は29歳、SNSの投稿が何より得意。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'お仕事ドラマ'],
  },
});
applyQuizCards({ answer: 'エミリー、<br>パリへ行く', info: 'Netflix｜アメリカのドラマ', answerSize: 116 });
