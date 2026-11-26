import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #148 セッション（映画・アメリカ・2014年製作・107分。U-NEXT・Hulu で見放題、
//   Filmarks の動画配信欄（U-NEXT・ABEMA・Hulu 見放題）と Hulu の作品ページ hulu.jp/whiplash で2026/11/26確認。
//   Filmarks 4.0・レビュー277,968件 filmarks.com/movies/59751）
// 確かめた事実（2026/11/26）：
//   ・映画.com eiga.com/movie/80985 ：2014年製作／107分／アメリカ。デイミアン・チャゼル監督の長編2作目。サンダンス映画祭のグランプリ＆観客賞、
//     第87回アカデミー賞で助演男優賞ほか計3部門を受賞。世界的ジャズドラマーを目指して名門音楽学校に入学した若者は、伝説の教師と言われる
//     指導者の指導を受けることに。待ち受けていたのは、天才を生み出すことに取り憑かれた教師の常軌を逸した厳しいレッスン。
//     常に完璧を求める教師は容赦ない罵声を浴びせ、若者の精神は次第に追い詰められていく
// 構成（ヒント6段）：1 夜の練習室にひとりきりの若者・ひたすら叩きつづける → 2 主人公は名門の音楽学校の新入生・目指すは世界的なドラマー
//   → 3 バンドの練習室は張りつめた空気・だれも目を合わせない → 4 伝説の教師の指導を受ける・でも常識はずれの厳しさ
//   → 5 2014年のアメリカ映画・アカデミー賞で助演男優賞など3部門 → 6 決め手：ジャズドラムにすべてをかける・完璧を求める教師に追いつめられていく
// 結末（最後の演奏の中身）は言わない。登場人物の名前・学校の名前は出さない。俳優の顔・ポスター・ロゴは使わない。
// 有名な場面の構図（血のにじむ手のアップ・平手打ち・椅子を投げる・事故など）はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#1a1a22', floor: '#2a2420', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(14810);

const KID = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#e8e4dc', pants: '#2a2e38' };
const TEACH = { skin: '#f0c49c', hair: '#2a2420', shirt: '#121216', pants: '#121216', bald: true };
const BAND = [{ skin: '#f4d3b5', hair: '#3a2418', shirt: '#1e1e24', pants: '#1e1e24' }, { skin: '#c89a78', hair: '#1a1410', shirt: '#1e1e24', pants: '#1e1e24' }, { skin: '#f1c9a5', hair: '#5a3a1a', shirt: '#1e1e24', pants: '#1e1e24', long: true }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const metal = () => new THREE.MeshStandardMaterial({ color: '#d8c070', metalness: 0.85, roughness: 0.25 });
function drums(c = '#8a1a24') { const g = new THREE.Group(); const sh = mat(c), hd = mat('#f0ece4');
  const bass = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 24), sh); bass.rotation.x = Math.PI / 2; bass.position.set(0, 0.45, 0); g.add(bass);
  const bf = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), hd); bf.position.set(0, 0.45, 0.21); g.add(bf);
  const sn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 20), sh); sn.position.set(-0.45, 0.72, 0.45); g.add(sn);
  const tm = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.18, 18), sh); tm.position.set(0.05, 0.98, 0.1); tm.rotation.x = 0.3; g.add(tm);
  const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 20), sh); fl.position.set(0.5, 0.55, 0.45); g.add(fl);
  const cy = []; for (const [x, y, z, r] of [[-0.75, 1.2, 0.35, 0.24], [0.6, 1.4, -0.1, 0.3]]) { const c2 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.015, 24), metal()); c2.position.set(x, y, z); g.add(c2); cy.push(c2); const st = box(0.025, y, 0.025, mat('#888888')); st.position.set(x, y / 2, z); g.add(st); }
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12), mat('#1a1a1a')); stool.position.set(0, 0.25, 1.0); g.add(stool);
  g.userData.cym = cy; return g; }
function drummer(o, kit) { const p = makePerson(o); p.position.set(0, 0.08, 1.0); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.4); kit.add(p); return p; }
function hit(p, t, sp = 9) { p.userData.arms[0].rotation.x = -1.1 + Math.sin(t * sp) * 0.45; p.userData.arms[1].rotation.x = -1.1 + Math.sin(t * sp + Math.PI) * 0.45; }

// ---------- 1段目. 夜の練習室（x=0）。裸電球ひとつ、防音の壁、ドラムを叩きつづける若者 ----------
{ const fl = box(8, 0.04, 8, mat('#3a3028')); fl.position.set(0, 0.02, -3); qs.add(fl);
  const wl = box(8, 4, 0.3, mat('#4a4a52')); wl.position.set(0, 2, -6); qs.add(wl); const sw = box(0.3, 4, 8, mat('#44444c')); sw.position.set(-3, 2, -3); qs.add(sw);
  for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) { const pn = box(0.9, 0.9, 0.08, mat(k % 2 ? '#3a3a42' : '#55555e')); pn.position.set(-2.5 + i * 1.0, 0.9 + k * 1.0, -5.82); qs.add(pn); } }
const KIT1 = drums(); KIT1.position.set(0.2, 0, -3.4); KIT1.rotation.y = Math.PI; qs.add(KIT1);
const KID1 = drummer(KID, KIT1);
const BULB1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gl('#ffd898')); BULB1.position.set(0.2, 3.0, -3.4); qs.add(BULB1);
const L1 = new THREE.PointLight('#ffc878', 6, 8); L1.position.set(0.2, 2.8, -3.2); qs.add(L1);
const BEATS1 = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.22, 24), gl('#ffd898', 0.6)); r.position.set(0.65, 0.8, -3.85); r.rotation.x = -Math.PI / 2; qs.add(r); BEATS1.push(r); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tAlone = tag('夜の練習室に、ひとりきりの若者', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tAlone);
const tBeat = tag('ひたすら、叩きつづける', { size: 54, w: 680, bg: '#e24050', sx: 1.7 }); qs.add(tBeat);

// ---------- 2段目. 名門の音楽学校の廊下（x=50）。楽器ケースを持って行き交う学生たち、ポスターのない掲示板 ----------
const AX = 50;
{ const fl = box(6, 0.04, 40, mat('#8a7a68')); fl.position.set(AX, 0.02, -12); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.3, 4, 40, mat('#c8bca8')); wl.position.set(AX + s * 3, 2, -12); qs.add(wl);
    for (let i = 0; i < 6; i++) { const dr = box(0.06, 2.4, 1.1, mat('#5a3a28')); dr.position.set(AX + s * 2.84, 1.2, -2 - i * 5); qs.add(dr); const pl = box(0.06, 0.8, 0.5, mat('#e8e0c8')); pl.position.set(AX + s * 2.84, 1.6, -4.4 - i * 5); qs.add(pl); } }
  for (let i = 0; i < 8; i++) { const lp = box(0.9, 0.04, 0.3, gl('#fff0d0')); lp.position.set(AX, 3.95, -1 - i * 4); qs.add(lp); }
  const lt = new THREE.PointLight('#ffe8c8', 2.4, 14); lt.position.set(AX, 3.5, -4); qs.add(lt); }
const KID2 = person(KID, AX - 0.4, -3.0, Math.PI);
const STU2 = [0, 1, 2, 3].map(i => person(BAND[i % 3], AX + (i % 2 ? 1.2 : -1.4), -7 - i * 2.2, i % 2 ? 0 : Math.PI));
const CASES2 = STU2.map((p, i) => { const c = box(0.3, i % 2 ? 0.9 : 0.5, 0.14, mat('#1a1a1a')); c.position.set(0, -0.5, 0); p.userData.arms[1].add(c); return c; });
const STICK2 = box(0.03, 0.42, 0.03, mat('#e8d8b0')); STICK2.position.set(0, -0.68, 0.06); KID2.userData.arms[1].add(STICK2);
const tNew = tag('主人公は、名門音楽学校の新入生', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tNew);
const tDream = tag('目指すのは、世界的なドラマー', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tDream);

// ---------- 3段目. バンドの練習室（x=100）。譜面台と椅子、だまって座る演奏者たち ----------
const BX = 100;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  const wl = box(12, 4.5, 0.3, mat('#6a6a72')); wl.position.set(BX, 2.25, -7); qs.add(wl);
  const lt = new THREE.PointLight('#f0e0c0', 2.0, 12); lt.position.set(BX, 3.6, -3); qs.add(lt); }
const PLAY3 = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const x = BX - 2.4 + i * 1.4 + r * 0.6, z = -3.0 - r * 1.6;
  const ch = box(0.5, 0.06, 0.5, mat('#2a2a2a')); ch.position.set(x, 0.48, z); qs.add(ch); const ms = box(0.5, 0.36, 0.03, mat('#1a1a1e')); ms.position.set(x, 1.2, z + 0.6); ms.rotation.x = -0.3; qs.add(ms); const pole = box(0.03, 1.0, 0.03, mat('#1a1a1e')); pole.position.set(x, 0.55, z + 0.62); qs.add(pole);
  const p = person(BAND[(i + r) % 3], x, z, 0); p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = -0.32; PLAY3.push(p);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 12, 1, true), metal()); horn.rotation.x = Math.PI / 2; horn.position.set(0.18, -0.55, 0.15); p.userData.arms[1].add(horn); }
const KIT3 = drums(); KIT3.position.set(BX + 3.0, 0, -5.4); KIT3.rotation.y = Math.PI - 0.5; qs.add(KIT3); const KID3 = drummer(KID, KIT3);
const tTense = tag('バンドの練習室は、張りつめた空気', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tTense);
const tEyes = tag('だれも、目を合わせない', { size: 54, w: 680, bg: '#e24050', sx: 1.7 }); qs.add(tEyes);

// ---------- 4段目. 練習室の前（x=150）。黒い服の教師が手をあげて音を止める、こわばる若者 ----------
const CX = 150;
{ const fl = box(12, 0.04, 10, mat('#4a3a2e')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const wl = box(12, 4.5, 0.3, mat('#5a5a62')); wl.position.set(CX, 2.25, -7); qs.add(wl);
  const lt = new THREE.PointLight('#f0d8b0', 2.2, 10); lt.position.set(CX, 3.4, -3.4); qs.add(lt); }
const KIT4 = drums(); KIT4.position.set(CX + 0.9, 0, -4.6); KIT4.rotation.y = Math.PI - 0.3; qs.add(KIT4); const KID4 = drummer(KID, KIT4);
const T4 = person(TEACH, CX - 0.9, -3.2, 0.9);
const tLegend = tag('伝説の教師に、指導を受ける', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tLegend);
const tHarsh = tag('でも、常識はずれの厳しさ', { size: 52, w: 720, bg: '#e24050', sx: 1.75 }); qs.add(tHarsh);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーンとならんだ赤い座席、金色の像 ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#8a1a24')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#7a1620')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#6a7a9a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const TROPHY5 = []; for (let i = 0; i < 3; i++) { const g = new THREE.Group(); const gm = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3, emissive: '#4a3a10' });
  const bs = box(0.3, 0.14, 0.3, mat('#2a2a2a')); g.add(bs); const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 10), gm); bd.position.y = 0.37; g.add(bd); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), gm); hd.position.y = 0.74; g.add(hd);
  g.position.set(DX - 0.9 + i * 0.9, 1.6, -3.2); qs.add(g); TROPHY5.push(g); }
const t2014 = tag('2014年の、アメリカ映画', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2014);
const tOscar = tag('アカデミー賞で、助演男優賞など3部門', { size: 42, w: 920, bg: '#e24050', sx: 2.0 }); qs.add(tOscar);

// ---------- 6段目. スポットライトのステージ（x=250）。汗を飛ばして叩く若者、暗がりで拳をにぎる教師の影 ----------
const EX = 250;
{ const fl = box(14, 0.04, 12, mat('#140e0c')); fl.position.set(EX, 0.02, -2); qs.add(fl);
  const st = box(8, 0.4, 5, mat('#3a2a20')); st.position.set(EX, 0.2, -4.6); qs.add(st);
  const wl = box(14, 6, 0.3, mat('#0c0a0c')); wl.position.set(EX, 3, -7.4); qs.add(wl); }
const KIT6 = drums('#1a1a22'); KIT6.position.set(EX, 0.4, -4.2); KIT6.rotation.y = Math.PI; qs.add(KIT6); const KID6 = drummer(KID, KIT6);
const SPOT6 = new THREE.SpotLight('#ffe0b0', 45, 14, 0.38, 0.5, 1.2); SPOT6.position.set(EX, 7, -2.6); SPOT6.target.position.set(EX, 0.4, -4.2); qs.add(SPOT6); qs.add(SPOT6.target);
const BEAM6 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6.5, 24, 1, true), gl('#fff0c8', 0.08)); BEAM6.position.set(EX, 3.8, -3.6); BEAM6.rotation.x = 0.25; qs.add(BEAM6);
const T6 = person(TEACH, EX - 2.2, -2.0, 0.6);
const SWEAT6 = []; for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), gl('#cfe8ff')); qs.add(d); SWEAT6.push(d); }
const tAll = tag('ジャズドラムに、すべてをかける', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tAll);
const tPush = tag('完璧を求める教師に、追いつめられる', { size: 44, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tPush);

// ---------- shots ----------
const ALL = [tAlone, tBeat, tNew, tDream, tTense, tEyes, tLegend, tHarsh, t2014, tOscar, tAll, tPush, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotNight(t, quiz = 0) { // 1段目 0〜9：夜の練習室に、ひとりきりの若者。ドラムを、ひたすら叩きつづける（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.3; S.darken(0.7, '#050406');
  hit(KID1, t, quiz ? 0 : 10); KID1.userData.head.rotation.x = 0.3 + Math.sin(t * 10) * 0.05;
  KIT1.userData.cym.forEach((c, i) => c.rotation.z = Math.sin(t * 12 + i) * 0.08);
  L1.intensity = 5.5 + Math.sin(t * 13) * 0.4;
  BEATS1.forEach((r, i) => { const s = ((t * 1.6 + i / 4) % 1); r.scale.setScalar(1 + s * 3); r.material.opacity = 0.6 * (1 - s); });
  Q1.position.set(1.0, 2.0, -4.4); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tAlone, 1.05); pin(tBeat, 1.05);
  if (!quiz) { tAlone.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tAlone.visible = false; tBeat.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.2, 0.8, u), lerp(1.9, 1.8, u), lerp(0.4, -0.4, u), 0.1, 1.2, -4.2, 62);
  return qs;
}
function shotSchool(t) { // 2段目 9〜17：主人公は、名門の音楽学校の新入生。目指すのは、世界的なドラマー
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 0.9;
  KID2.position.z = -3.0 - t * 0.25; poseWalk(KID2, t * 5, 0.7); KID2.userData.head.rotation.y = Math.sin(t * 0.8) * 0.35;
  STU2.forEach((p, i) => { const d = i % 2 ? 1 : -1; p.position.z = -7 - i * 2.2 + d * -t * 0.5; poseWalk(p, t * 5 + i, 0.7); });
  const u = ease(t / 8);
  look(AX + lerp(0.6, 0.4, u), lerp(1.8, 1.8, u), KID2.position.z + lerp(3.2, 2.8, u), AX - 0.4, 1.4, KID2.position.z - 2.0, 62);
  pin(tNew, 1.05); pin(tDream, 1.05);
  tNew.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNew.visible = false; tDream.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotBand(t) { // 3段目 17〜25：バンドの練習室は、張りつめた空気。だれも、目を合わせない
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.6; S.darken(0.2, '#14100c');
  PLAY3.forEach((p, i) => { p.userData.head.rotation.x = 0.35; p.userData.arms[1].rotation.x = -0.9; p.userData.arms[0].rotation.x = -0.9; });
  KID3.userData.arms.forEach(a => a.rotation.x = -1.0); KID3.userData.head.rotation.x = 0.3;
  const u = ease(t / 8);
  look(BX + lerp(-2.6, -1.8, u), lerp(2.1, 2.0, u), lerp(1.4, 0.8, u), BX + 0.8, 1.0, -4.2, 62);
  pin(tTense, 1.05); pin(tEyes, 1.05);
  tTense.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTense.visible = false; tEyes.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTeacher(t) { // 4段目 25〜33：伝説の教師に、指導を受ける。でもレッスンは、常識はずれの厳しさ
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.75; S.key.intensity = 0.6; S.darken(0.25, '#100c0a');
  const stop = t > 4.3; hit(KID4, t, stop ? 0 : 9); if (stop) { KID4.userData.arms.forEach(a => a.rotation.x = -0.6); KID4.userData.head.rotation.x = 0.35; } else KID4.userData.head.rotation.x = 0.1;
  T4.userData.arms[1].rotation.x = stop ? -2.9 : -0.2; T4.userData.arms[1].rotation.z = 0; T4.userData.head.rotation.x = stop ? -0.1 : 0.1;
  const u = ease(t / 8);
  look(CX + lerp(-2.0, -1.6, u), lerp(1.8, 1.7, u), lerp(0.6, 0.0, u), CX + 0.2, 1.3, -4.0, 62);
  pin(tLegend, 1.05); pin(tHarsh, 1.05);
  tLegend.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLegend.visible = false; tHarsh.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2014年の、アメリカ映画。アカデミー賞で、助演男優賞など3部門を受賞
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCREEN5.material.color.setHSL(0.6, 0.22, 0.42 + Math.sin(t * 2.3) * 0.06);
  TROPHY5.forEach((g, i) => { g.visible = t > 4.3 + i * 0.25; g.rotation.y = t * 1.2; });
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.4, 2.3, u), lerp(2.4, 1.6, u), DX, 1.8, -4.5, 62);
  pin(t2014, 1.05); pin(tOscar, 1.05);
  t2014.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2014.visible = false; tOscar.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：ジャズドラムに、すべてをかける。完璧を求める教師に、追いつめられていく
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.2; S.key.intensity = 0.1; S.darken(0.92, '#030202');
  hit(KID6, t, 14); KID6.userData.head.rotation.x = 0.25 + Math.sin(t * 14) * 0.08;
  KIT6.userData.cym.forEach((c, i) => c.rotation.z = Math.sin(t * 16 + i) * 0.1);
  SWEAT6.forEach((d, i) => { const s = ((t * 1.4 + i / 8) % 1); const a = i / 8 * Math.PI * 2; d.position.set(EX + Math.cos(a) * s * 0.7, 2.1 + 0.4 + s * 0.4 - s * s * 1.2, -4.2 - 1.0 + Math.sin(a) * s * 0.5); });
  T6.userData.arms[1].rotation.x = t > 3.7 ? -1.6 : -0.3; T6.userData.head.rotation.y = 0.2;
  const u = ease(t / 7);
  look(EX + lerp(-1.4, -1.0, u), lerp(1.8, 1.9, u), lerp(1.2, 0.4, u), EX - 0.4, 1.4, -3.8, 62);
  pin(tAll, 1.05); pin(tPush, 1.05);
  if (t < 3.6) tAll.userData.pop((t - 0.3) / 0.35); else tPush.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の練習室に戻る）
  shotNight(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotNight(t, 0) },
  { a: 9, b: 17, f: shotSchool },
  { a: 17, b: 25, f: shotBand },
  { a: 25, b: 33, f: shotTeacher },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '夜の練習室に、<br>ひとりきりの若者。'],
  [5.6, 9.0, 'ドラムを、ひたすら<br>叩きつづける。'],
  [9.2, 13.2, '主人公は、名門の<br>音楽学校の新入生。'],
  [13.2, 17.0, '目指すのは、<br>世界的なドラマー。'],
  [17.2, 21.0, 'バンドの練習室は、<br>張りつめた空気。'],
  [21.0, 25.0, 'だれも、<br>目を合わせない。'],
  [25.2, 29.0, '伝説の教師に、<br>指導を受ける。'],
  [29.0, 33.0, 'でもレッスンは、<br>常識はずれの厳しさ。'],
  [33.2, 37.4, '2014年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>助演男優賞など3部門。'],
  [42.2, 45.4, 'ジャズドラムに、<br>すべてをかける。'],
  [45.4, 49.0, '完璧を求める教師に、<br>追いつめられていく。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>セッション。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q148', v2: true, answer: 'セッション',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 14810,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone', 0.4], [25.0, 'whoosh'], [29.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ジャズドラム': 'ジャズドラム', 'アカデミー賞': 'アカデミーしょう', '助演男優賞': 'じょえんだんゆうしょう', '常識はずれ': 'じょうしきはずれ', '追いつめられて': 'おいつめられて', '叩きつづける': 'たたきつづける', '張りつめた': 'はりつめた', '音楽学校': 'おんがくがっこう', 'アメリカ映画': 'アメリカえいが', '2014年': 'にせんじゅうよねん', '新入生': 'しんにゅうせい', '練習室': 'れんしゅうしつ', '目指す': 'めざす', '世界的': 'せかいてき', '合わせない': 'あわせない', '受ける': 'うける', '求める': 'もとめる', '3部門': 'さんぶもん', '主人公': 'しゅじんこう', '聞かせて': 'きかせて', '当てて': 'あてて', '若者': 'わかもの', '名門': 'めいもん', '空気': 'くうき', '伝説': 'でんせつ', '教師': 'きょうし', '指導': 'しどう', '厳しさ': 'きびしさ', '完璧': 'かんぺき', '夜': 'よる', '目': 'め', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう' },
    caption: 'この映画のタイトル、わかる？\n夜の練習室に、ひとりきりの若者。ドラムを、ひたすら叩きつづける。主人公は、名門の音楽学校の新入生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Hulu', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'セッション', info: 'U-NEXT・Hulu｜映画・107分', answerSize: 128 });
