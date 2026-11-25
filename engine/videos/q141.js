import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #141 九条の大罪（ドラマ・日本・2026年・Netflix シリーズ・全10話。Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/jiu-tiao-noda-zui（見放題：Netflix）と
//   Filmarks の動画配信欄（Netflix 見放題）で2026/11/25確認。Filmarks 4.0・レビュー51,049件 filmarks.com/dramas/17023/22900。
//   Filmarks の日本のドラマの人気ランキングで上位＝今まさに話題）
// 確かめた事実（2026/11/25）：
//   ・Netflix 公式 about.netflix.com/ja/news/sins-of-kujo-main-trailer ：2026年4月2日 Netflix で世界独占配信。原作は「闇金ウシジマくん」作者の
//     真鍋昌平による漫画（ビッグコミックスピリッツ連載、累計400万部超）。主演 柳楽優弥が、厄介でグレーな案件ばかりを引き受ける弁護士を演じる。
//     その元で働くことになった優秀なエリート弁護士を松村北斗。全10話
//   ・Netflix 作品ページ netflix.com/jp/title/81581947 ：半グレにヤクザ。厄介な依頼人の案件を請け負う弁護士は、法の力を武器に自らの正義を追求する。
//     バディとなったエリート弁護士は、その型破りな手法を疑問視しながらも、共に社会の闇に迫っていく。
//     第1話：半グレのリーダーの依頼で、手下のひき逃げ犯の弁護を担当する
//   ・JustWatch 日本版の紹介文：“悪徳”と非難されながらも、法の力を武器に自らの正義を追求し、堕落した者たちを法で守る
// 構成（ヒント6段）：1 ある夜ひき逃げ事件・犯人の弁護を引き受けたのはひとりの弁護士 → 2 主人公は小さな事務所の弁護士・やっかいな依頼ばかり
//   → 3 依頼人は半グレやヤクザ・悪徳と非難される → 4 エリート弁護士がやってくる・やり方を疑いながらも組む
//   → 5 2026年の日本のドラマ・原作は400万部をこえる漫画 → 6 決め手：法の力を武器に自分の正義をつらぬく・作者はあの闇金漫画と同じ人
// 事件の真相・結末は言わない。事故の被害者・血・暴力は見せない（三角コーンと警察のテープだけ）。登場人物の名前・事務所や組の名前は出さない。
// 俳優の顔・ポスター・キーアート・ロゴ・漫画の絵は使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#141822', floor: '#22252c', fogNear: 18, fogFar: 80 });
const qs = S.scene;
const R = rng(14110);

const KJ = { skin: '#e8c0a0', hair: '#1a1410', shirt: '#2a2a2e', pants: '#24242a', long: false };
const ELITE = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#3a4a6a', pants: '#2a3040', tie: true };
const TOUGH = [{ skin: '#d8a888', hair: '#c8a878', shirt: '#14141a', pants: '#14141a' }, { skin: '#e0b090', hair: '#0e0e0e', shirt: '#3a2a2a', pants: '#1a1a1e', bald: true }, { skin: '#e8c0a0', hair: '#1a1a1a', shirt: '#e8e8ec', pants: '#2a2a30' }];
const COP = { skin: '#f0c8a8', hair: '#1a1410', shirt: '#2a3450', pants: '#2a3450' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -1.4); p.position.y += 0.05; }
function badge() { const g = new THREE.Group(); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 16), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3, emissive: '#3a2a08' })); d.rotation.x = Math.PI / 2; g.add(d); return g; }

// ---------- 1段目. 夜の交差点（x=0）。止まったパトカー、三角コーン、黄色いテープ。現場を見る刑事。少し離れて立つ黒いスーツの男 ----------
{ const rd = box(30, 0.04, 14, mat('#24262c')); rd.position.set(0, 0.03, -4); qs.add(rd);
  for (let i = 0; i < 7; i++) { const zb = box(0.5, 0.02, 4, mat('#c8c8c8')); zb.position.set(-3 + i * 1.0, 0.06, -4); qs.add(zb); }
  for (let i = 0; i < 6; i++) { const b = box(3 + R() * 3, 6 + R() * 10, 3, mat(['#2a2c34', '#30323a', '#26282e'][i % 3])); b.position.set(-12 + i * 5, 4, -16); qs.add(b);
    for (let k = 0; k < 6; k++) if (R() < 0.6) { const w = box(0.6, 0.5, 0.05, gl('#f0d890')); w.position.set(b.position.x - 1 + (k % 3), 2 + Math.floor(k / 3) * 2, -14.45); qs.add(w); } }
  const sp = box(0.12, 4.4, 0.12, mat('#3a3a40')); sp.position.set(3.6, 2.2, -1.8); qs.add(sp); const sg = box(0.5, 1.2, 0.3, mat('#2a2a30')); sg.position.set(3.6, 3.8, -1.8); qs.add(sg);
  const sl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), gl('#ff3a2a')); sl.position.set(3.6, 4.2, -1.62); qs.add(sl); }
const CONES1 = []; for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 12), mat('#f06a20')); c.position.set(-1.6 + i * 0.9, 0.25, -3.0 - (i % 2) * 0.6); qs.add(c); CONES1.push(c); }
const TAPE1 = box(4.4, 0.06, 0.02, gl('#f0d020')); TAPE1.position.set(0.2, 0.7, -2.6); qs.add(TAPE1);
const CAR1 = new THREE.Group(); { const b = box(1.8, 0.7, 4.0, mat('#e8e8ec')); b.position.y = 0.6; CAR1.add(b); const t = box(1.6, 0.6, 2.0, mat('#1a1a20')); t.position.set(0, 1.25, -0.2); CAR1.add(t);
  const lo = box(1.82, 0.36, 4.02, mat('#1a1a20')); lo.position.y = 0.45; CAR1.add(lo); } CAR1.position.set(-3.4, 0, -5.4); CAR1.rotation.y = 1.1; qs.add(CAR1);
const SIREN1 = box(0.7, 0.14, 0.24, gl('#ff2a2a')); SIREN1.position.set(0, 1.62, -0.2); CAR1.add(SIREN1);
const RED1 = new THREE.PointLight('#ff3030', 5, 10); RED1.position.set(-3.0, 2.2, -4.6); qs.add(RED1);
const COPS1 = [person(COP, -0.8, -4.4, 0.4), person(COP, 1.4, -5.0, -0.6)];
const KJ1 = person(KJ, 2.4, -1.4, -0.6);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tHit = tag('ある夜、ひき逃げ事件が起きる', { size: 50, w: 800, bg: '#14161c', sx: 1.85 }); qs.add(tHit);
const tTake = tag('犯人の弁護を、引き受けたのは…', { size: 50, w: 800, bg: '#e24050', sx: 1.85 }); qs.add(tTake);

// ---------- 2段目. 小さな法律事務所（x=50）。書類の山の机、古い電話、窓のブラインド。机の前の黒いスーツの弁護士 ----------
const AX = 50;
{ const fl = box(10, 0.04, 8, mat('#4a4440')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const wl = box(10, 4, 0.3, mat('#6a6a64')); wl.position.set(AX, 2, -6); qs.add(wl);
  for (let i = 0; i < 10; i++) { const sl = box(2.4, 0.06, 0.04, mat('#c8c4b8')); sl.position.set(AX + 2.2, 1.4 + i * 0.18, -5.8); qs.add(sl); }
  const dk = box(2.4, 0.08, 1.1, mat('#5a4a3a')); dk.position.set(AX - 0.4, 0.9, -3.6); qs.add(dk); const dl = box(2.2, 0.86, 0.9, mat('#3a3028')); dl.position.set(AX - 0.4, 0.43, -3.6); qs.add(dl);
  for (let i = 0; i < 4; i++) { const pp = box(0.5, 0.1 + i * 0.06, 0.36, mat('#e8e4d8')); pp.position.set(AX - 1.2 + (i % 2) * 0.1, 0.98 + i * 0.12, -3.7); qs.add(pp); }
  const ph = box(0.34, 0.12, 0.24, mat('#1a1a1a')); ph.position.set(AX + 0.4, 1.0, -3.4); qs.add(ph);
  const sh = box(1.4, 2.4, 0.5, mat('#4a4a50')); sh.position.set(AX - 3.0, 1.2, -5.4); qs.add(sh);
  for (let i = 0; i < 12; i++) { const f = box(0.1, 0.4, 0.36, mat(['#8a3a3a', '#3a5a8a', '#c8b878'][i % 3])); f.position.set(AX - 3.5 + (i % 6) * 0.18, 0.6 + Math.floor(i / 6) * 0.9, -5.3); qs.add(f); }
  const lp = new THREE.PointLight('#ffe0b0', 3, 7); lp.position.set(AX, 3, -3); qs.add(lp); }
const KJ2 = person(KJ, AX - 0.4, -4.5, 0); sit(KJ2);
const tSmall = tag('主人公は、小さな事務所の弁護士', { size: 48, w: 840, bg: '#14161c', sx: 1.9 }); qs.add(tSmall);
const tTrouble = tag('引き受けるのは、やっかいな依頼ばかり', { size: 44, w: 900, bg: '#e24050', sx: 1.95 }); qs.add(tTrouble);

// ---------- 3段目. 夜の裏通り（x=100）。看板の文字のないネオン、黒い車、こわもての男たち ----------
const BX = 100;
{ const rd = box(16, 0.04, 8, mat('#1e2026')); rd.position.set(BX, 0.03, -3); qs.add(rd);
  for (const s of [-1, 1]) { const w = box(0.3, 7, 10, mat('#2a2a30')); w.position.set(BX + s * 3.6, 3.5, -4); qs.add(w); }
  const nc = ['#e83a8a', '#3ad8e8', '#e8c83a', '#8a3ae8'];
  for (let i = 0; i < 6; i++) { const n = box(0.08, 0.5 + R() * 0.6, 1.2, gl(nc[i % 4])); n.position.set(BX + (i % 2 ? 3.4 : -3.4), 2.4 + Math.floor(i / 2) * 1.1, -2 - i * 0.8); qs.add(n); }
  const l1 = new THREE.PointLight('#e83a8a', 3, 7); l1.position.set(BX - 2.6, 2.6, -3); qs.add(l1); const l2 = new THREE.PointLight('#3ad8e8', 3, 7); l2.position.set(BX + 2.6, 3.0, -5); qs.add(l2); }
const CAR3 = new THREE.Group(); { const b = box(1.9, 0.75, 4.6, mat('#0e0e12')); b.position.y = 0.6; CAR3.add(b); const t = box(1.7, 0.6, 2.2, mat('#08080a')); t.position.set(0, 1.28, -0.2); CAR3.add(t); } CAR3.position.set(BX + 1.6, 0, -6.4); qs.add(CAR3);
const MEN3 = TOUGH.map((o, i) => person(o, BX - 1.2 + i * 1.1, -4.6 + (i === 1 ? -0.5 : 0), 0.0));
const KJ3 = person(KJ, BX + 1.5, -1.6, Math.PI + 0.5);
const tClient = tag('依頼人は、半グレやヤクザ', { size: 52, w: 720, bg: '#14161c', sx: 1.75 }); qs.add(tClient);
const tEvil = tag('まわりからは、悪徳と非難される', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tEvil);

// ---------- 4段目. 事務所の入口（x=150）。ドアから入ってくる、きちんとしたスーツのエリート弁護士。向かいあうふたり ----------
const CX = 150;
{ const fl = box(10, 0.04, 8, mat('#4a4440')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const wl = box(10, 4, 0.3, mat('#6a6a64')); wl.position.set(CX, 2, -6); qs.add(wl);
  const dr = box(1.1, 2.2, 0.1, mat('#5a4a3a')); dr.position.set(CX + 2.4, 1.1, -5.8); qs.add(dr);
  const ds = box(1.0, 2.1, 0.02, gl('#f0e8d0')); ds.position.set(CX + 2.4, 1.05, -5.84); qs.add(ds);
  const lp = new THREE.PointLight('#ffe0b0', 3, 7); lp.position.set(CX, 3, -3); qs.add(lp); }
const ELITE4 = person(ELITE, CX + 2.4, -5.2, Math.PI * 0);
const KJ4 = person(KJ, CX - 0.8, -3.0, Math.PI / 2);
const BADGE4a = badge(); BADGE4a.position.set(-0.14, 1.38, 0.15); ELITE4.add(BADGE4a);
const BADGE4b = badge(); BADGE4b.position.set(-0.14, 1.38, 0.15); KJ4.add(BADGE4b);
const tElite = tag('そこへ、エリート弁護士がやってくる', { size: 46, w: 880, bg: '#14161c', sx: 1.95 }); qs.add(tElite);
const tDoubt = tag('やり方を疑いながらも、組むことに', { size: 46, w: 880, bg: '#e24050', sx: 1.95 }); qs.add(tDoubt);

// ---------- 5段目. 夜の部屋のテレビ（x=200）。光る画面と、ソファ、積みあげた漫画の単行本 ----------
const DX = 200;
{ const fl = box(12, 0.04, 10, mat('#3a3430')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.3, mat('#2a2a30')); wl.position.set(DX, 2.5, -6); qs.add(wl);
  const tvb = box(3.4, 0.5, 0.6, mat('#3a2e26')); tvb.position.set(DX, 0.25, -5.2); qs.add(tvb);
  const so = box(2.6, 0.5, 1.0, mat('#4a5a6a')); so.position.set(DX, 0.35, 0.2); qs.add(so); const sb = box(2.6, 0.7, 0.24, mat('#4a5a6a')); sb.position.set(DX, 0.85, 0.6); qs.add(sb); }
const TV5 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ color: '#4a5a8a' })); TV5.position.set(DX, 1.6, -5.4); qs.add(TV5);
const TVL5 = new THREE.PointLight('#a8b8ff', 3, 9); TVL5.position.set(DX, 1.6, -4); qs.add(TVL5);
const BOOKS5 = []; for (let i = 0; i < 15; i++) { const b = box(0.36, 0.06, 0.5, mat(['#c83a3a', '#e8e4d8', '#2a2a30', '#d8b040'][i % 4])); b.position.set(DX - 2.6 + (i >= 8 ? 0.5 : 0), 0.05 + (i % 8) * 0.07, -3.2); b.rotation.y = R() * 0.3; qs.add(b); BOOKS5.push(b); }
const t2026 = tag('2026年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 1.7 }); qs.add(t2026);
const tManga = tag('原作は、400万部をこえる漫画', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tManga);

// ---------- 6段目. 法廷（x=250）。正面の高い台、金色の天秤。証言台の前に立つ黒いスーツの弁護士 ----------
const EX = 250;
{ const fl = box(14, 0.04, 12, mat('#6a5240')); fl.position.set(EX, 0.02, -3); qs.add(fl);
  const wl = box(14, 6, 0.3, mat('#8a7458')); wl.position.set(EX, 3, -8); qs.add(wl);
  const bench = box(7, 1.4, 1.2, mat('#5a3e2a')); bench.position.set(EX, 0.7, -6.4); qs.add(bench); const bt = box(7.2, 0.1, 1.3, mat('#4a3020')); bt.position.set(EX, 1.45, -6.4); qs.add(bt);
  for (let i = 0; i < 3; i++) { const ch = box(0.8, 1.4, 0.2, mat('#2a1e18')); ch.position.set(EX - 1.6 + i * 1.6, 2.0, -7.2); qs.add(ch); }
  for (const s of [-1, 1]) { const tb = box(2.6, 0.9, 1.0, mat('#5a3e2a')); tb.position.set(EX + s * 3.6, 0.45, -2.6); qs.add(tb); }
  const lp = new THREE.PointLight('#fff0d0', 3, 12); lp.position.set(EX, 4, -3); qs.add(lp); }
const SCALE6 = new THREE.Group(); { const gm = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3, emissive: '#4a3a10' });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 10), gm); post.position.y = 0.8; SCALE6.add(post);
  const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.08, 20), gm); SCALE6.add(ft);
  const beam = new THREE.Group(); beam.position.y = 1.55; SCALE6.add(beam); const bm = box(1.4, 0.05, 0.05, gm); beam.add(bm);
  for (const s of [-1, 1]) { const ch = box(0.02, 0.5, 0.02, gm); ch.position.set(s * 0.68, -0.25, 0); beam.add(ch); const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.06, 18), gm); pan.position.set(s * 0.68, -0.52, 0); beam.add(pan); }
  SCALE6.userData.beam = beam; }
SCALE6.position.set(EX, 1.5, -6.4); qs.add(SCALE6);
const KJ6 = person(KJ, EX + 0.9, -3.4, -0.4);
const tLaw = tag('法の力を武器に、自分の正義をつらぬく', { size: 44, w: 920, bg: '#14161c', sx: 2.0 }); qs.add(tLaw);
const tAuthor = tag('作者は、あの闇金漫画と同じ人', { size: 48, w: 820, bg: '#e6b450', color: '#14161c', sx: 1.85 }); qs.add(tAuthor);

// ---------- shots ----------
const ALL = [tHit, tTake, tSmall, tTrouble, tClient, tEvil, tElite, tDoubt, t2026, tManga, tLaw, tAuthor, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotCross(t, quiz = 0) { // 1段目 0〜9：ある夜、ひき逃げ事件が起きる。犯人の弁護を引き受けたのは、ひとりの弁護士（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.5; S.key.color.set('#a8b8e0'); S.darken(0.5, '#04060a');
  const on = Math.sin(t * 9) > 0; RED1.intensity = on ? 6 : 1.5; SIREN1.material.color.set(on ? '#ff2a2a' : '#5a1010');
  COPS1[0].userData.head.rotation.x = 0.4; COPS1[1].userData.arms[1].rotation.x = -0.8;
  KJ1.userData.head.rotation.y = t > 5 ? 0.4 : 0;
  const u = ease(t / 9);
  look(lerp(3.2, 2.6, u), lerp(2.0, 1.9, u), lerp(2.6, 1.6, u), 0.6, 1.0, -3.6, 62);
  Q1.position.set(0.3, 1.5, -3.0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tHit, 1.05); pin(tTake, 1.05);
  if (!quiz) { tHit.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tHit.visible = false; tTake.userData.pop((t - 5.5) / 0.35); }
  return qs;
}
function shotOffice(t) { // 2段目 9〜17：主人公は、小さな事務所の弁護士。引き受けるのは、やっかいな依頼ばかり
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.6; S.darken(0.3, '#08080a');
  KJ2.userData.arms[1].rotation.x = t > 4.4 ? -1.9 : -0.9; KJ2.userData.arms[0].rotation.x = -0.9; KJ2.userData.head.rotation.x = t > 4.4 ? 0 : 0.35;
  const u = ease(t / 8);
  look(AX + lerp(0.8, 0.5, u), lerp(1.9, 1.8, u), lerp(-0.2, -1.2, u), AX - 0.4, 1.5, -4.4, 62);
  pin(tSmall, 1.05); pin(tTrouble, 1.05);
  tSmall.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSmall.visible = false; tTrouble.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotAlley(t) { // 3段目 17〜25：依頼人は、半グレやヤクザ。まわりからは、悪徳と非難される
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.55, '#06040a');
  MEN3.forEach((m, i) => { m.userData.head.rotation.x = -0.05; m.userData.arms.forEach(a => a.rotation.x = i === 1 ? -0.3 : 0); });
  KJ3.position.z = -1.6 - clamp(t / 4) * 1.2; poseWalk(KJ3, t * 6, t < 4 ? 0.7 : 0);
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0.3, u), lerp(1.8, 1.7, u), lerp(1.8, 1.0, u), BX - 0.1, 1.5, -4.4, 62);
  pin(tClient, 1.05); pin(tEvil, 1.05);
  tClient.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tClient.visible = false; tEvil.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotDoor(t) { // 4段目 25〜33：そこへ、エリート弁護士がやってくる。そのやり方を疑いながらも、組むことに
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.85; S.key.intensity = 0.6;
  const k = clamp(t / 3.4); ELITE4.position.set(CX + 2.4 - k * 1.6, 0, -5.2 + k * 2.0); ELITE4.rotation.y = -0.6 - (t > 3.4 ? 0.9 : 0); poseWalk(ELITE4, t * 6, k < 1 ? 0.8 : 0);
  if (t > 4.4) ELITE4.userData.arms[0].rotation.x = -0.6;
  const u = ease(t / 8);
  look(CX + lerp(0.2, 0.3, u), lerp(1.9, 1.8, u), lerp(1.6, 0.8, u), CX + 0.2, 1.4, -3.4, 62);
  pin(tElite, 1.05); pin(tDoubt, 1.05);
  tElite.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tElite.visible = false; tDoubt.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2026年の、日本のドラマ。原作は、400万部をこえる漫画
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.25; S.darken(0.75, '#020204');
  TV5.material.color.setHSL(0.62, 0.3, 0.38 + Math.sin(t * 2.6) * 0.07); TVL5.intensity = 2.5 + Math.sin(t * 2.6);
  const u = ease(t / 9);
  look(DX + lerp(-1.0, -0.4, u), lerp(2.0, 1.9, u), lerp(2.2, 1.4, u), DX - 0.6, 1.2, -4.4, 62);
  pin(t2026, 1.05); pin(tManga, 1.05);
  t2026.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2026.visible = false; tManga.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotCourt(t) { // 6段目 42〜49（決め手）：法の力を武器に、自分の正義をつらぬく。作者は、あの闇金漫画と同じ人
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.7; S.key.color.set('#ffe8c8');
  SCALE6.userData.beam.rotation.z = Math.sin(t * 1.4) * 0.12;
  KJ6.userData.arms[1].rotation.x = t > 1.0 ? -0.9 : 0;
  const u = ease(t / 7);
  look(EX + lerp(1.8, 1.4, u), lerp(1.9, 1.85, u), lerp(1.0, 0.2, u), EX + 0.3, 1.7, -4.6, 62);
  pin(tLaw, 1.05); pin(tAuthor, 1.05);
  if (t < 3.6) tLaw.userData.pop((t - 0.3) / 0.35); else tAuthor.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の交差点に戻る）
  shotCross(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotCross(t, 0) },
  { a: 9, b: 17, f: shotOffice },
  { a: 17, b: 25, f: shotAlley },
  { a: 25, b: 33, f: shotDoor },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotCourt },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある夜、<br>ひき逃げ事件が起きる。'],
  [5.6, 9.0, '犯人の弁護を引き受けたのは、<br>ひとりの弁護士。'],
  [9.2, 13.2, '主人公は、<br>小さな事務所の弁護士。'],
  [13.2, 17.0, '引き受けるのは、<br>やっかいな依頼ばかり。'],
  [17.2, 21.0, '依頼人は、<br>半グレやヤクザ。'],
  [21.0, 25.0, 'まわりからは、<br>悪徳と非難される。'],
  [25.2, 29.0, 'そこへ、エリート弁護士が<br>やってくる。'],
  [29.0, 33.0, 'そのやり方を疑いながらも、<br>組むことに。'],
  [33.2, 37.4, '2026年の、<br>日本のドラマ。'],
  [37.4, 41.8, '原作は、400万部を<br>こえる漫画。'],
  [42.2, 45.4, '法の力を武器に、<br>自分の正義をつらぬく。'],
  [45.4, 49.0, '作者は、あの闇金漫画と<br>同じ人。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>九条の大罪。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q141', v2: true, answer: '九条の大罪',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 14110,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'alarm', 0.3], [5.6, 'drone', 0.4], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'drone', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'エリート弁護士': 'エリートべんごし', '引き受けた': 'ひきうけた', '引き受ける': 'ひきうける', '400万部': 'よんひゃくまんぶ', '2026年': 'にせんにじゅうろくねん', '九条の大罪': 'くじょうのたいざい', 'ひき逃げ': 'ひきにげ', '聞かせて': 'きかせて', '半グレ': 'はんグレ', '弁護士': 'べんごし', '主人公': 'しゅじんこう', '事務所': 'じむしょ', '依頼人': 'いらいにん', '起きる': 'おきる', '小さな': 'ちいさな', '当てて': 'あてて', '疑い': 'うたがい', '闇金': 'やみきん', '非難': 'ひなん', '悪徳': 'あくとく', '事件': 'じけん', '犯人': 'はんにん', '弁護': 'べんご', '依頼': 'いらい', '組む': 'くむ', '日本': 'にほん', '原作': 'げんさく', '漫画': 'まんが', '武器': 'ぶき', '自分': 'じぶん', '正義': 'せいぎ', '作者': 'さくしゃ', '同じ': 'おなじ', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '夜': 'よる', '法': 'ほう', '力': 'ちから', '人': 'ひと' },
    caption: 'このドラマのタイトル、わかる？\nある夜、ひき逃げ事件が起きる。犯人の弁護を引き受けたのは、ひとりの弁護士。主人公は、小さな事務所の弁護士。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'ドラマ好き', '日本のドラマ', 'サスペンス'],
  },
});
applyQuizCards({ answer: '九条の大罪', info: 'Netflix｜日本のドラマ・全10話', answerSize: 128 });
