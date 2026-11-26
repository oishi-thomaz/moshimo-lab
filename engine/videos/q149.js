import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #149 僕のヒーローアカデミア（アニメ・日本・第1期 2016年4月〜。Hulu・DMM TV で見放題、
//   Hulu の作品ページ hulu.jp/my-hero-academia と DMM TV の作品ページ（info.tv.dmm.com/pr/season/nypit0qew7myqpcgf0dax8crq）、
//   Filmarks の動画配信欄（Prime Video・U-NEXT・DMM TV・FOD・Lemino・Hulu・Netflix 見放題）で2026/11/26確認。
//   Filmarks 4.2・レビュー43,840件 filmarks.com/animes/342/505（第1期・2016年04月03日〜））
// 確かめた事実（2026/11/26）：
//   ・MBS 公式 mbs.jp/heroaca/ ：「週刊少年ジャンプ」（集英社刊）で連載中の堀越耕平によるアクションコミック。名立たるヒーローを多く輩出する高校への
//     入学を目指していた少年は、総人口の二割にあたる、何の特異体質も持たない“無個性”な落ちこぼれだった。ある日、憧れてやまないNo.1ヒーローと出会い、
//     運命を大きく変えていく
//   ・Filmarks 第1期 第1話のあらすじ：総人口の約8割が何らかの超常能力を持ち、その能力によって社会を守る“ヒーロー”という存在が確立された世界。
//     少年はヒーローになることを夢見て名門高校のヒーロー科入学を目指していた。ある日、強盗をして逃亡中だった敵に襲われ、そこに現れたのはNo.1のヒーローだった
// 構成（ヒント6段）：1 町でどろぼうが逃げていく・そこへ空から人が飛んでくる → 2 主人公は人を助ける仕事にあこがれる少年・でも何の力もない
//   → 3 人口の8割がふしぎな力をもつ世界・力を使って町を守る仕事がある → 4 憧れのナンバーワンと出会う・名門の高校を目指してきたえはじめる
//   → 5 2016年に始まった日本のテレビアニメ・原作は少年ジャンプの漫画 → 6 決め手：力のない少年がヒーローを目指す・タイトルには「学園」という意味の言葉
// 結末・力を受けつぐ展開の中身は言わない。登場人物の名前・ヒーロー名・学校名・校章は出さない。アニメの絵・キャラクターの見た目・ロゴは使わない。人は汎用の3D
const S = quizStage({ bg: '#bcd8f0', floor: '#9aa0a8', fogNear: 30, fogFar: 120 });
const qs = S.scene;
const R = rng(14910);

const BOY = { skin: '#f1c9a5', hair: '#2a4a3a', shirt: '#1a1e2a', pants: '#1a1e2a' };
const THIEF = { skin: '#d8b090', hair: '#1a1a1a', shirt: '#3a3a40', pants: '#2a2a2e' };
const FLY = { skin: '#f0c49c', hair: '#3a2a1a', shirt: '#2a5ad8', pants: '#2a3a8a', scale: 1.15 };
const TOWN = [{ skin: '#f4d3b5', hair: '#5a3a1a', shirt: '#e8a040', pants: '#3a3a5a' }, { skin: '#c89a78', hair: '#1a1410', shirt: '#6ac0a0', pants: '#2a2e38', long: true, skirt: true }, { skin: '#f1c9a5', hair: '#8a5a2a', shirt: '#d86a6a', pants: '#3a3a44' }, { skin: '#f4d3b5', hair: '#2a2018', shirt: '#8a8ad8', pants: '#2a2e38' }];
const MATE = (i) => ({ ...BOY, hair: ['#5a3a1a', '#1a1410', '#8a5a2a', '#3a2418'][i % 4], long: i % 2 === 1, skirt: i % 2 === 1 });
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function cape(p, c = '#d83a3a') { const cp = box(0.5, 1.1, 0.04, mat(c)); cp.position.set(0, 0.95, -0.17); cp.rotation.x = 0.15; p.add(cp); return cp; }
function orb(c, r = 0.12) { return new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), gl(c, 0.85)); }
function street(x, sky = ['#6ab0ec', '#e0eef8']) { const s = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex(...sky)); s.position.set(x, 12, -45); qs.add(s);
  const rd = box(8, 0.04, 40, mat('#6a6a72')); rd.position.set(x, 0.03, -10); qs.add(rd);
  for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { const h = 5 + R() * 7; const b = box(4, h, 4, mat(['#c8ccd4', '#a8b4c4', '#d8d0c4', '#b8c0c8'][i % 4])); b.position.set(x + sd * 6.2, h / 2, -2 - i * 5.2); qs.add(b);
    for (let k = 0; k < Math.floor(h / 1.6); k++) { const wn = box(0.05, 0.7, 2.6, gl('#8ab0d0')); wn.position.set(x + sd * 4.17, 1.2 + k * 1.6, -2 - i * 5.2); qs.add(wn); } } }

// ---------- 1段目. 昼の町の大通り（x=0）。かばんをかかえて逃げるどろぼう、空からマントの人が飛んでくる ----------
street(0);
const THIEF1 = person(THIEF, 0.4, -6, 0); const BAG1 = box(0.4, 0.3, 0.2, mat('#7a4a2a')); BAG1.position.set(0, -0.6, 0.12); THIEF1.userData.arms[0].add(BAG1);
const FLY1 = person(FLY, -3, 6, 0.6); const CAPE1 = cape(FLY1);
const CROWD1 = TOWN.map((o, i) => person(o, (i % 2 ? 2.6 : -2.6), -2.5 - i * 1.3, i % 2 ? -1.2 : 1.2));
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#8e5bd0', sx: 0.5 }); qs.add(Q1);
const tThief = tag('町で、どろぼうが逃げていく', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tThief);
const tFly = tag('そこへ、空から人が飛んでくる', { size: 48, w: 820, bg: '#8e5bd0', sx: 1.85 }); qs.add(tFly);

// ---------- 2段目. 放課後の校庭（x=50）。手から光や火の玉を出してはしゃぐ同級生と、ノートをにぎってそれを見ている少年 ----------
const AX = 50;
{ const s = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#e8a878', '#f8e0c0')); s.position.set(AX, 12, -45); qs.add(s);
  const gd = box(30, 0.04, 24, mat('#c8b48a')); gd.position.set(AX, 0.03, -8); qs.add(gd);
  const sc = box(20, 6, 4, mat('#ece6da')); sc.position.set(AX, 3, -20); qs.add(sc);
  for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) { const wn = box(1.4, 1.1, 0.05, gl('#9ab8d0')); wn.position.set(AX - 7.7 + i * 2.2, 2.0 + k * 2.2, -17.97); qs.add(wn); } }
const MATES2 = [0, 1, 2].map(i => person(MATE(i), AX + 0.6 + i * 1.1, -5.6 - (i % 2) * 0.6, -0.3 - i * 0.2));
const ORBS2 = [orb('#ff7a2a', 0.16), orb('#7ad8ff', 0.16), orb('#ffe060', 0.16)]; ORBS2.forEach(o => qs.add(o));
const BOY2 = person(BOY, AX - 1.4, -3.4, 0.6);
const NOTE2 = box(0.3, 0.4, 0.05, mat('#f0e6c8')); NOTE2.position.set(0, -0.62, 0.12); BOY2.userData.arms[1].add(NOTE2);
const tDream = tag('主人公は、人を助ける仕事にあこがれる', { size: 42, w: 920, bg: '#14161c', sx: 2.0 }); qs.add(tDream);
const tNone = tag('でも、彼には何の力もない', { size: 52, w: 720, bg: '#8e5bd0', sx: 1.75 }); qs.add(tNone);

// ---------- 3段目. ふしぎな力があふれる町（x=100）。宙に浮く人、手が光る人、ビルの屋上に立つマントの人たち ----------
const BX = 100;
street(BX, ['#4a98e8', '#d8ecf8']);
const TOWN3 = TOWN.map((o, i) => person(o, BX - 2.4 + i * 1.6, -4 - (i % 2) * 1.6, Math.PI * 0.95));
const AURA3 = TOWN3.map((p, i) => { const o = orb(['#ff7a2a', '#7ad8ff', '#a8f07a', '#ffe060'][i], 0.2); qs.add(o); return o; });
[8.4, 9.0].forEach((h, i) => { const b = box(4.1, h, 4.1, mat('#b8c0cc')); b.position.set(BX + (i ? 6.2 : -6.2), h / 2, -7.2); qs.add(b); });
const ROOF3 = [0, 1].map(i => { const p = person({ ...FLY, scale: 1, shirt: ['#d83a3a', '#2aa86a'][i] }, BX + (i ? 6.2 : -6.2), -7.2, i ? -0.6 : 0.6, 0); cape(p, ['#f0c040', '#e8e8f0'][i]); return p; });
const tWorld = tag('人口の8割が、ふしぎな力をもつ', { size: 46, w: 880, bg: '#14161c', sx: 1.95 }); qs.add(tWorld);
const tGuard = tag('力を使って、町を守る仕事がある', { size: 46, w: 880, bg: '#8e5bd0', sx: 1.95 }); qs.add(tGuard);

// ---------- 4段目. 夕焼けの河原（x=150）。大きなマントの人と向き合う少年、そのあと走りこみ ----------
const CX = 150;
{ const s = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#e8784a', '#f8d0a0')); s.position.set(CX, 12, -45); qs.add(s);
  const gr = box(40, 0.04, 14, mat('#7a9a5a')); gr.position.set(CX, 0.03, -2); qs.add(gr);
  const rv = box(60, 0.05, 12, mat('#5a8ab0')); rv.position.set(CX, 0.01, -15); qs.add(rv);
  const br = box(40, 0.4, 2, mat('#8a8a90')); br.position.set(CX, 3.4, -24); qs.add(br); for (let i = 0; i < 6; i++) { const pl = box(0.5, 3.4, 0.5, mat('#7a7a80')); pl.position.set(CX - 15 + i * 6, 1.7, -24); qs.add(pl); } }
const BIG4 = person(FLY, CX + 0.9, -4.0, -0.7); cape(BIG4);
const BOY4 = person(BOY, CX - 0.5, -3.6, 0.7);
const tMeet = tag('憧れのナンバーワンと、出会う', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tMeet);
const tTrain = tag('名門の高校を目指して、きたえる', { size: 46, w: 860, bg: '#8e5bd0', sx: 1.95 }); qs.add(tTrain);

// ---------- 5段目. 夜の部屋（x=200）。光るテレビと、床につんだ厚い漫画雑誌 ----------
const DX = 200;
{ const fl = box(10, 0.04, 8, mat('#7a5e48')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.3, mat('#c8c0d8')); wl.position.set(DX, 2, -5.5); qs.add(wl);
  const tb = box(3.2, 0.5, 0.6, mat('#4a3a34')); tb.position.set(DX, 0.25, -4.8); qs.add(tb);
  const tv = box(2.6, 1.5, 0.1, mat('#111114')); tv.position.set(DX, 1.4, -4.9); qs.add(tv);
  const lt = new THREE.PointLight('#d8c8ff', 1.8, 8); lt.position.set(DX - 2, 2.6, -1.5); qs.add(lt); }
const TVS5 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), new THREE.MeshBasicMaterial({ color: '#8a7ad8' })); TVS5.position.set(DX, 1.4, -4.84); qs.add(TVS5);
const MAGS5 = []; for (let i = 0; i < 8; i++) { const b = box(0.5, 0.12, 0.7, mat(['#e8c040', '#e85a5a', '#5a8ae8', '#f0f0f0'][i % 4])); b.position.set(DX + 0.9, 0.08 + i * 0.125, -2.6); b.rotation.y = (R() - 0.5) * 0.4; qs.add(b); MAGS5.push(b); }
const t2016 = tag('2016年に始まった、テレビアニメ', { size: 46, w: 860, bg: '#e6b450', color: '#14161c', sx: 1.95 }); qs.add(t2016);
const tJump = tag('原作は、少年ジャンプの人気漫画', { size: 46, w: 860, bg: '#8e5bd0', sx: 1.95 }); qs.add(tJump);

// ---------- 6段目. 大きな高校の門の前（x=250）。そびえる校舎を見上げる少年 ----------
const EX = 250;
{ const s = new THREE.Mesh(new THREE.PlaneGeometry(100, 50), skyTex('#2a7ad8', '#c8e4f8')); s.position.set(EX, 14, -50); qs.add(s);
  const gd = box(40, 0.04, 30, mat('#a8a8b0')); gd.position.set(EX, 0.03, -10); qs.add(gd);
  const gt = box(9, 3.2, 0.5, mat('#5a5a68')); gt.position.set(EX, 1.6, -8); qs.add(gt); const go = box(3.4, 2.6, 0.6, gl('#c8e4f8')); go.position.set(EX, 1.3, -8); qs.add(go);
  for (let i = 0; i < 4; i++) { const tw = box(5, 14 + i * 2, 5, mat(['#e8ecf2', '#d8e0ea'][i % 2])); tw.position.set(EX - 7.5 + i * 5, 7 + i, -24); qs.add(tw);
    for (let k = 0; k < 7; k++) { const wn = box(4.2, 0.4, 0.05, gl('#7aa8d8')); wn.position.set(EX - 7.5 + i * 5, 2 + k * 2, -21.47); qs.add(wn); } } }
const BOY6 = person(BOY, EX - 0.2, -4.0, Math.PI);
const tNoPow = tag('力のない少年が、ヒーローを目指す', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tNoPow);
const tAcad = tag('タイトルには、学園という意味の言葉', { size: 42, w: 920, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tAcad);

// ---------- shots ----------
const ALL = [tThief, tFly, tDream, tNone, tWorld, tGuard, tMeet, tTrain, t2016, tJump, tNoPow, tAcad, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotStreet(t, quiz = 0) { // 1段目 0〜9：町で、どろぼうが逃げていく。そこへ、空から人が飛んでくる（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.5;
  THIEF1.position.z = -7 + t * 0.6; poseWalk(THIEF1, t * 12, 1.3); THIEF1.userData.head.rotation.y = Math.sin(t * 3) * 0.4;
  const k = quiz ? 0 : clamp((t - 5.0) / 2.5); FLY1.position.set(lerp(-5, -0.6, k), lerp(7, 1.0, k), lerp(-12, THIEF1.position.z - 1.2, k)); FLY1.rotation.x = lerp(-1.2, -0.3, k);
  FLY1.userData.arms.forEach(a => a.rotation.x = -2.9); FLY1.visible = k > 0;
  CROWD1.forEach((p, i) => { p.userData.head.rotation.y = (i % 2 ? 0.6 : -0.6); p.userData.arms[i % 2].rotation.x = t > 5.5 ? -2.4 : -0.2; });
  Q1.position.set(1.4, 2.4, -5.0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tThief, 1.05); pin(tFly, 1.05);
  if (!quiz) { tThief.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tThief.visible = false; tFly.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.8, 0.4, u), lerp(2.0, 2.2, u), lerp(1.4, 0.8, u), 0.0, 2.0, -6, 62);
  return qs;
}
function shotYard(t) { // 2段目 9〜17：主人公は、人を助ける仕事にあこがれる少年。でも、彼には何の力もない
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.2; S.key.intensity = 1.2; S.key.color.set('#ffd8a8');
  MATES2.forEach((p, i) => { p.userData.arms[1].rotation.x = -2.0 + Math.sin(t * 3 + i) * 0.3; p.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.06;
    const hp = new THREE.Vector3(); p.updateMatrixWorld(); p.userData.arms[1].localToWorld(hp.set(0, -0.7, 0)); ORBS2[i].position.copy(hp); ORBS2[i].scale.setScalar(1 + Math.sin(t * 6 + i) * 0.2); });
  BOY2.userData.arms[1].rotation.x = -0.6; BOY2.userData.head.rotation.y = 0.3; BOY2.userData.head.rotation.x = t > 4.3 ? 0.35 : 0;
  const u = ease(t / 8);
  look(AX + lerp(-2.6, -2.2, u), lerp(1.8, 1.75, u), lerp(0.4, -0.2, u), AX + 0.2, 1.3, -4.6, 62);
  pin(tDream, 1.05); pin(tNone, 1.05);
  tDream.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDream.visible = false; tNone.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotPowers(t) { // 3段目 17〜25：人口の8割が、ふしぎな力をもつ世界。力を使って、町を守る仕事がある
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.5;
  TOWN3.forEach((p, i) => { p.position.y = i === 1 ? 0.6 + Math.sin(t * 2) * 0.15 : 0; p.userData.arms[0].rotation.x = i === 2 ? -1.6 : -0.2;
    const hp = new THREE.Vector3(); p.updateMatrixWorld(); p.userData.arms[0].localToWorld(hp.set(0, -0.7, 0)); AURA3[i].position.copy(hp); AURA3[i].scale.setScalar(1 + Math.sin(t * 5 + i) * 0.25); });
  ROOF3.forEach((p, i) => { p.position.y = i ? 9.0 : 8.4; p.userData.arms[0].rotation.z = 0.5; });
  const u = ease(t / 8);
  look(BX + lerp(0.4, 0.0, u), lerp(1.8, 2.0, u), lerp(1.8, 1.0, u), BX, lerp(1.8, 3.6, u), -6, 62);
  pin(tWorld, 1.05); pin(tGuard, 1.05);
  tWorld.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWorld.visible = false; tGuard.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotRiver(t) { // 4段目 25〜33：憧れのナンバーワンと、出会う。名門の高校を目指して、きたえはじめる
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.1; S.key.intensity = 1.2; S.key.color.set('#ffb880');
  const run = t > 4.3;
  if (!run) { BOY4.position.set(CX - 0.5, 0, -3.6); BOY4.rotation.y = 0.7; poseWalk(BOY4, 0, 0); BOY4.userData.head.rotation.x = -0.25; BIG4.userData.arms[1].rotation.x = -0.4; }
  else { const k = t - 4.3; BOY4.position.set(CX - 2.6 + k * 1.3, 0, -2.4); BOY4.rotation.y = Math.PI / 2; poseWalk(BOY4, t * 11, 1.3); BOY4.userData.head.rotation.x = 0; BIG4.userData.arms[1].rotation.x = -1.6; }
  const u = ease(t / 8);
  look(CX + lerp(-0.6, 0.0, u), lerp(1.7, 1.8, u), lerp(1.2, 1.8, u), CX + 0.2, 1.4, -3.6, 62);
  pin(tMeet, 1.05); pin(tTrain, 1.05);
  tMeet.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMeet.visible = false; tTrain.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTv(t) { // 5段目 33〜42：2016年に始まった、日本のテレビアニメ。原作は、少年ジャンプの人気漫画
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.4; S.darken(0.6, '#0a0a14');
  TVS5.material.color.setHSL(0.72 + Math.sin(t * 0.7) * 0.05, 0.5, 0.55 + Math.sin(t * 3.1) * 0.05);
  MAGS5.forEach((b, i) => b.visible = t > 4.2 + i * 0.1);
  const u = ease(t / 9);
  look(DX + lerp(-0.6, 0.4, u), lerp(1.9, 1.8, u), lerp(2.0, 1.2, u), DX + 0.2, 1.0, -3.4, 62);
  pin(t2016, 1.05); pin(tJump, 1.05);
  t2016.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2016.visible = false; tJump.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotGate(t) { // 6段目 42〜49（決め手）：まだ力のない少年が、ヒーローを目指す。タイトルには、学園という意味の言葉
  base(); S.aim(EX, -6); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.5;
  BOY6.userData.head.rotation.x = -0.35; BOY6.userData.arms[0].rotation.x = t > 3.7 ? -0.3 : 0; BOY6.userData.arms[1].rotation.z = t > 3.7 ? 0.25 : 0;
  BOY6.position.z = -4.0 - clamp((t - 3.7) / 3) * 1.2; poseWalk(BOY6, t * 6, t > 3.7 && t < 6.7 ? 0.7 : 0);
  const u = ease(t / 7);
  look(EX + lerp(1.4, 1.0, u), lerp(1.6, 1.4, u), lerp(2.2, 1.2, u), EX, lerp(3.4, 5.0, u), -16, 62);
  pin(tNoPow, 1.05); pin(tAcad, 1.05);
  if (t < 3.6) tNoPow.userData.pop((t - 0.3) / 0.35); else tAcad.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（昼の大通りに戻る）
  shotStreet(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStreet(t, 0) },
  { a: 9, b: 17, f: shotYard },
  { a: 17, b: 25, f: shotPowers },
  { a: 25, b: 33, f: shotRiver },
  { a: 33, b: 42, f: shotTv },
  { a: 42, b: 49, f: shotGate },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '町で、どろぼうが<br>逃げていく。'],
  [5.6, 9.0, 'そこへ、空から<br>人が飛んでくる。'],
  [9.2, 13.2, '主人公は、人を助ける<br>仕事にあこがれる少年。'],
  [13.2, 17.0, 'でも、彼には<br>何の力もない。'],
  [17.2, 21.0, '人口の8割が、<br>ふしぎな力をもつ世界。'],
  [21.0, 25.0, '力を使って、<br>町を守る仕事がある。'],
  [25.2, 29.0, '憧れのナンバーワンと、<br>出会う。'],
  [29.0, 33.0, '名門の高校を目指して、<br>きたえはじめる。'],
  [33.2, 37.4, '2016年に始まった、<br>日本のテレビアニメ。'],
  [37.4, 41.8, '原作は、少年ジャンプの<br>人気漫画。'],
  [42.2, 45.4, '力のない少年が、<br>ヒーローを目指す。'],
  [45.4, 49.0, 'タイトルには、学園という<br>意味の言葉が入る。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、僕の<br>ヒーローアカデミア。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q149', v2: true, answer: '僕のヒーローアカデミア',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'hopeful', seed: 14910,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'whoosh'], [9.0, 'whoosh'], [13.2, 'bubble'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ヒーローアカデミア': 'ヒーローアカデミア', 'ナンバーワン': 'ナンバーワン', '少年ジャンプ': 'しょうねんジャンプ', 'テレビアニメ': 'テレビアニメ', 'あこがれる': 'あこがれる', '2016年': 'にせんじゅうろくねん', '始まった': 'はじまった', '飛んでくる': 'とんでくる', '逃げていく': 'にげていく', '目指して': 'めざして', '目指す': 'めざす', '人気漫画': 'にんきまんが', '主人公': 'しゅじんこう', '聞かせて': 'きかせて', '当てて': 'あてて', '憧れ': 'あこがれ', '人口': 'じんこう', '8割': 'はちわり', '世界': 'せかい', '使って': 'つかって', '守る': 'まもる', '仕事': 'しごと', '助ける': 'たすける', '少年': 'しょうねん', '何の': 'なんの', '出会う': 'であう', '名門': 'めいもん', '高校': 'こうこう', '原作': 'げんさく', '学園': 'がくえん', '意味': 'いみ', '言葉': 'ことば', '入る': 'はいる', '日本': 'にほん', '作品': 'さくひん', '僕の': 'ぼくの', '彼': 'かれ', '力': 'ちから', '町': 'まち', '空': 'そら', '人': 'ひと', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう' },
    caption: 'この作品のタイトル、わかる？\n町で、どろぼうが逃げていく。そこへ、空から人が飛んでくる。主人公は、人を助ける仕事にあこがれる少年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'DMMTV', 'アニメ好き', '日本のアニメ'],
  },
});
applyQuizCards({ answer: '僕のヒーロー<br>アカデミア', info: 'Hulu・DMM TV｜日本のアニメ', answerSize: 104 });
