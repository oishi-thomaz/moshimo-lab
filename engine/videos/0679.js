import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBed, makeAlarm, makeMirror, makeFridge, makeTable } from '../scenes/home.js';

// もしも1か月ずっと4時間睡眠だったら？（台本 S69・人体の限界・作り直し 0010）
// 2026/11/11 ゆうと承認（投稿サーバーで ok）。plan/remake.md の4：0010 毎日4時間睡眠を1か月続けたら（インスタ22.7万・TikTok 4,337。あなた視点の宣言から入っていた）
// 作り直しの入り：宣言の一文は使わず、1日目のクマ→3日目の会議→1週間後の冷蔵庫→1か月後の もう慣れた を絵で先に。数字は20秒より後
// 数字（0010 で確認済み）：成人は少なくとも6時間以上（厚生労働省 健康づくりのための睡眠ガイド2023）
//  4時間・6時間の睡眠を14日間続けると頭の働き（注意の課題の成績）は毎日下がり、最大で徹夜2晩分に相当。本人の眠気の自覚はわずか（Van Dongen ほか 2003, Sleep）
//  睡眠を4時間に削ると食欲ホルモン（グレリン）+28%（Spiegel ほか 2004, Ann Intern Med）
// 真似しないで と画面に出す。題名・言い換え（眠いと感じなくなった怖さ）は元の回と変えた

const BLUE = '#7fd4ff', RED = '#ff6a5a', GOLD = '#ffd27a';
const { S, flat, room, hemi, sun } = makeSet({ bg: '#c8d8e8' }); hemi.intensity = 1.35;
const ME = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }); S.add(ME);
const PAJAMA = makeMan({ shirt: '#8fa3b8', pants: '#5d6b80', hair: '#1d1a19' }); S.add(PAJAMA);
// 目の下のクマ（顔に付ける）
function kuma(p) { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#5a4a6a', transparent: true }); for (const s of [-1, 1]) { const b = box(0.09, 0.03, 0.01, m); b.position.set(s * 0.085, 0.205, 0.197); g.add(b); } p.userData.head.add(g); g.userData.set = (k) => { g.visible = k > 0.01; m.opacity = clamp(k); }; return g; }
const KUMA_M = kuma(ME), KUMA_P = kuma(PAJAMA);

// ---------- A：寝室（原点）：目覚まし ----------
const roomA = room({ x: 0, w: 7, d: 5, h: 3, wall: '#dfe4ee', floor: '#b48a5e' });
const BED = makeBed(); BED.position.set(0.6, 0, -1.2); S.add(BED);
const ns = box(0.6, 0.55, 0.5, mat('#a07e5c')); ns.position.set(-0.6, 0.275, -1.9); S.add(ns);
const ALARM = makeAlarm(); ALARM.scale.setScalar(0.7); ALARM.position.set(-0.6, 0.55, -1.85); ALARM.rotation.y = 0.3; S.add(ALARM);
const nightL = new THREE.PointLight(0x9fb4ff, 0, 6, 1.4); nightL.position.set(0, 2.2, 0.5); S.add(nightL);
const RING = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 6, 24), new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true })); r.position.set(-0.6, 0.72, -1.82); S.add(r); return r; });
const yonjikan = label('睡眠 4時間', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(yonjikan);
const mane = label('真似しないで', { w: 640, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(mane);

// ---------- B：洗面所（x=40）：クマ ----------
const BX = 40;
const roomB = room({ x: BX, w: 5, d: 4, h: 3, wall: '#e6eef2', floor: '#c8ccd4' });
const MIRROR = makeMirror(1.2, 1.3); MIRROR.position.set(BX, 0, -1.9); S.add(MIRROR);
const kumaL = label('うっすらクマ', { w: 640, size: 100, color: '#fff', bg: 'rgba(90,74,106,.96)', sx: 1.0 }); S.add(kumaL);
const kezuru = label('寝る時間を削るしかない', { w: 1100, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.0 }); S.add(kezuru);

// ---------- C：会議室（x=80）：首がカクン ----------
const CX = 80;
const MR = makeMeetingRoom(); MR.position.set(CX, 0, 0); S.add(MR);
const OTHERS = [makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }), makeSuit({ old: true, bald: true, jacket: '#2a2e38' })]; OTHERS.forEach(p => S.add(p));
const PEN = box(0.02, 0.16, 0.02, mat('#2a2a30')); S.add(PEN);
const kakun = label('カクン', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.8 }); S.add(kakun);

// ---------- D：夜中の台所（x=120）：菓子パン2個目 ----------
const DX = 120;
const roomD = room({ x: DX, w: 6, d: 5, h: 3, wall: '#c8ccd8', floor: '#8a8e9a' });
const FRIDGE = makeFridge(); FRIDGE.position.set(DX + 0.6, 0, -1.9); S.add(FRIDGE);
const BREAD = [0, 1].map(() => { const b = new THREE.Group(); const m = box(0.22, 0.1, 0.16, mat('#d8a45a')); b.add(m); const bag = box(0.24, 0.12, 0.18, new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })); b.add(bag); S.add(b); return b; });
const nikome = label('2個目', { w: 384, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.65 }); S.add(nikome);
const dLight = new THREE.PointLight(0x9fb4ff, 4, 8, 1.4); dLight.position.set(DX - 1, 2.6, 1); S.add(dLight);

// ---------- E：職場の机（x=160）：もう慣れた／結果 ----------
const EX = 160;
const roomE = room({ x: EX, w: 7, d: 5, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const DESK = makeTable({ w: 1.4, d: 0.8, h: TABLE_Y - 0.03, color: '#e8e4dc' }); DESK.position.set(EX, 0, -0.6); S.add(DESK);
const MON = new THREE.Group(); { const sc = box(0.7, 0.45, 0.04, mat('#22252c')); sc.position.y = 0.3; MON.add(sc); const gl = box(0.64, 0.39, 0.01, new THREE.MeshBasicMaterial({ color: '#6aa8e8' })); gl.position.set(0, 0.3, -0.025); MON.add(gl); const st = box(0.06, 0.1, 0.06, mat('#22252c')); st.position.y = 0.05; MON.add(st); } MON.position.set(EX - 0.55, TABLE_Y, -0.75); MON.rotation.y = Math.PI / 2 + 0.3; S.add(MON);
const nareta = label('もう慣れた', { w: 640, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 1.0 }); S.add(nareta);
const kowai = label('眠いと感じない', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.3 }); S.add(kowai);

// ---------- F：グラフ（x=200）：14日間 ----------
const FX = 200;
flat(16, 12, '#1f2433', FX, 0);
const fWall = box(16, 6, 0.2, mat('#262c3e')); fWall.position.set(FX, 3, -3); S.add(fWall);
const GBARS = []; for (let i = 0; i < 14; i++) { const b = box(0.32, 1, 0.3, mat(i < 7 ? '#7fd4ff' : '#ff9a6a')); S.add(b); GBARS.push(b); }
function setGraph(k) { GBARS.forEach((b, i) => { const v = 2.6 * (1 - 0.65 * (i / 13)); const h = Math.max(0.02, v * clamp(k * 14 - i)); b.scale.y = h; b.position.set(FX - 2.35 + i * 0.34, h / 2, -1); b.visible = k * 14 - i > 0; }); }
const tetsuya = label('徹夜2晩分', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(tetsuya);
const METER = new THREE.Group(); { const f = box(0.5, 2.4, 0.1, mat('#3a4256')); f.position.y = 1.2; METER.add(f); } METER.position.set(FX + 2.2, 0, -1); S.add(METER);
const MFILL = box(0.36, 1, 0.12, mat('#9be86a')); S.add(MFILL);
const nemuke = label('眠気', { w: 384, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.6 }); S.add(nemuke);
const BREADS = []; for (let i = 0; i < 10; i++) { const b = box(0.4, 0.18, 0.3, mat('#d8a45a')); S.add(b); BREADS.push(b); }

const PEOPLE = [ME, PAJAMA, ...OTHERS];
const LABELS = [yonjikan, mane, kumaL, kezuru, kakun, nikome, nareta, kowai, tetsuya, nemuke];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = true; });
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; KUMA_M.userData.set(0); KUMA_P.userData.set(0);
  RING.forEach(r => r.visible = false); nightL.intensity = 0; ALARM.userData.set('2:00', '#ff5a4a'); FRIDGE.userData.open(0); PEN.visible = false; BREAD.forEach(b => b.visible = false);
  PAJAMA.position.set(0.55, 0.16, -1.85); PAJAMA.rotation.set(0, -0.35, 0); poseSit(PAJAMA); PAJAMA.position.y = 0.16; PAJAMA.userData.head.rotation.y = -0.4; BED.userData.blanket.visible = true;
  ME.position.set(EX, 0, -1.3); poseSit(ME);
  const st = MR.userData.seats; OTHERS.forEach((p, i) => { const s = st[[1, 3][i]]; p.position.set(CX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  setGraph(0); GBARS.forEach(b => b.visible = false); METER.visible = false; MFILL.visible = false; BREADS.forEach(b => b.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function bedCam(u = 0) { look(lerp(0.0, -0.1, u), lerp(1.85, 1.7, u), lerp(3.8, 3.2, u), 0.1, lerp(1.95, 1.3, u), -1.6, 46); }
function shot0(t) { // 0秒＝サムネ：目覚まし時計が 2:00 から 6:00 に一瞬で飛んで鳴る
  reset(); lift(0); nightL.intensity = 3;
  ALARM.userData.set(t < TP ? '2:00' : '6:00', '#ff5a4a');
  if (t > TP) { RING.forEach((r, i) => { const u = ((t - TP) * 1.6 + i * 0.5) % 1; r.visible = true; r.scale.setScalar(0.6 + u * 1.4); r.material.opacity = 1 - u; }); ALARM.rotation.z = Math.sin(t * 40) * 0.05; el.flash.style.opacity = t < TP + 0.08 ? 0.3 : 0; say(yonjikan, t, TP + 0.1, -0.1, 1.3, -1.3, 0.8); }
  bedCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function mirrorCam(u = 0) { look(BX + lerp(0.25, 0.15, u), 1.75, lerp(0.4, 0.0, u), BX, 1.7, -1.9, 50); }
function sDay1(t, d) { // 1日目の朝。鏡の前の会社員の目の下に、うっすらクマ。
  reset(); lift(120); ME.position.set(BX, 0, -1.05); ME.rotation.y = 0; ME.userData.legs.forEach(l => l.rotation.x = 0); ME.position.y = 0; KUMA_M.userData.set(0.35 * clamp(t / 1.2));
  if (t > d * 0.5) say(kumaL, t, d * 0.5, BX + 0.45, 2.15, -0.9, 0.85);
  setHud('4時間睡眠', '1日目', 1); look(BX + 0.25, 1.75, 0.9, BX, 1.65, -1.2, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。忙しいから、寝る時間を削るしかない。
  reset(); lift(120); ME.position.set(BX, 0, -1.05); ME.rotation.y = 0; ME.userData.legs.forEach(l => l.rotation.x = 0); ME.position.y = 0; KUMA_M.userData.set(0.35); ME.userData.arms[0].rotation.set(0, 0, -0.5); ME.userData.arms[1].rotation.set(0, 0, 0.5);
  if (t > d * 0.35) say(kezuru, t, d * 0.35, BX, 2.05, -0.9, 1.25);
  look(BX + 0.2, 1.8, 1.5, BX, 1.55, -1.1, 50);
  return S;
}
function meetCam(u = 0) { const s = MR.userData.seats[2]; look(CX + s.x + lerp(0.5, 0.3, u), 1.75, s.z + lerp(2.4, 2.0, u), CX + s.x, 1.25, s.z, 50); }
function sDay3(t, d) { // 3日目。昼すぎの会議で、ペンを持ったまま首がカクン。
  reset(); lift(120); const s = MR.userData.seats[2]; ME.position.set(CX + s.x, 0, s.z); ME.rotation.y = s.ry; poseSit(ME); KUMA_M.userData.set(0.6);
  const nod = (t % 1.6) < 1.2 ? 0 : Math.sin(((t % 1.6) - 1.2) / 0.4 * Math.PI); ME.userData.head.rotation.x = 0.15 + 0.55 * nod; ME.userData.arms[1].rotation.set(-1.0, 0, 0.1);
  ME.updateMatrixWorld(); const v = new THREE.Vector3(0.32, 0.86, 0.6); ME.localToWorld(v); PEN.visible = true; PEN.position.copy(v);
  if (t > 1.2) say(kakun, t, 1.2, CX + s.x + 0.45, 1.75, s.z + 0.2, 0.55);
  MR.userData.board.set(['']);
  setHud('4時間睡眠', '3日目', 1); meetCam(ease(clamp(t / d)));
  return S;
}
function sWeek(t, d) { // 1週間後。夜中の冷蔵庫の前で、菓子パンを2個目。
  reset(); lift(120); ME.visible = false; PAJAMA.position.set(DX + 0.2, 0, -0.7); PAJAMA.rotation.set(0, 0.5, 0); PAJAMA.userData.legs.forEach(l => l.rotation.x = 0); PAJAMA.userData.head.rotation.y = 0; KUMA_P.userData.set(0.8);
  FRIDGE.userData.open(1); PAJAMA.userData.arms[1].rotation.set(-1.5, 0, 0.1); PAJAMA.updateMatrixWorld(); const v = new THREE.Vector3(0.32, 0.86, 0.62); PAJAMA.localToWorld(v);
  BREAD[0].visible = true; BREAD[0].position.copy(v); if (t > 1.0) { BREAD[1].visible = true; BREAD[1].position.set(DX + 0.1, 0.95, -1.5); }
  if (t > 1.2) say(nikome, t, 1.2, DX + 0.15, 2.05, -0.7, 0.5);
  setHud('4時間睡眠', '1週間後', 1); look(DX - 1.0, 1.8, 2.9, DX + 0.3, 1.3, -1.2, 50);
  return S;
}
function deskCam(u = 0) { look(EX + lerp(0.5, 0.35, u), 1.75, lerp(1.9, 1.5, u), EX, 1.35, -1.1, 50); }
function sMonth(t, d) { // 1か月後。本人は言う。もう慣れた。
  reset(); lift(120); KUMA_M.userData.set(1); ME.userData.arms[1].rotation.set(0, 0, 0.6); ME.userData.head.rotation.z = 0.08;
  if (t > d * 0.4) say(nareta, t, d * 0.4, EX + 0.25, 1.95, -1.1, 0.75);
  setHud('4時間睡眠', '1か月後', 1); deskCam(ease(clamp(t / d)));
  return S;
}
function sMeyasu(t, d) { // でも、国の目安は大人で6時間以上。
  reset(); lift(150); KUMA_M.userData.set(1);
  setTop('大人の睡眠の目安', '6時間以上', fade(t, 0.3, d, 0.25), BLUE); setHud('厚生労働省', '睡眠ガイド2023', 1);
  deskCam(1);
  return S;
}
function graphCam(u = 0) { look(FX - 0.15, lerp(2.0, 1.8, u), lerp(12, 11, u), FX - 0.15, 1.4, -1, 50); }
function sJikken(t, d) { // 4時間や6時間の睡眠を2週間続けた実験がある。
  reset(); lift(150); ME.visible = false; setGraph(0.25 + 0.3 * clamp(t / d));
  setTop('4時間・6時間の睡眠を続けた実験', '14日間', fade(t, 0.3, d, 0.25), GOLD); setHud('Van Dongen ほか', '2003年', 1);
  graphCam(ease(clamp(t / d)) * 0.5);
  return S;
}
function sTetsuya(t, d) { // 頭の働きは毎日下がり続け、徹夜2晩分まで落ちた。
  reset(); lift(150); ME.visible = false; setGraph(0.55 + 0.45 * easeOut(clamp(t / (d * 0.7))));
  if (t > d * 0.6) say(tetsuya, t, d * 0.6, FX + 1.8, 1.7, -0.8, 1.0);
  setTop('14日後の頭の働き（注意の課題）', '最大で徹夜2晩分', fade(t, 0.3, d, 0.25), RED); setHud('Van Dongen ほか', '2003年', 1);
  graphCam(0.5 + ease(clamp(t / d)) * 0.5);
  return S;
}
function sNemuke(t, d) { // なのに本人は、ほとんど眠気を感じていなかった。
  reset(); lift(150); ME.visible = false; setGraph(1); METER.visible = true; MFILL.visible = true; const h = 0.35 + 0.1 * Math.sin(t * 2); MFILL.scale.y = h; MFILL.position.set(FX + 2.2, 0.1 + h / 2, -0.94);
  say(nemuke, t, 0.3, FX + 2.2, 2.85, -0.9, 0.55);
  setHud('本人の眠気', 'ほとんど感じない', 1);
  look(FX + 0.6, 1.8, 6.4, FX + 0.6, 1.4, -1, 50);
  return S;
}
function sGhrelin(t, d) { // 夜中の菓子パンもそのせい。食欲ホルモンは28%増えた。
  reset(); lift(150); ME.visible = false; PAJAMA.position.set(DX + 0.2, 0, -0.7); PAJAMA.rotation.set(0, 0.5, 0); PAJAMA.userData.legs.forEach(l => l.rotation.x = 0); PAJAMA.userData.head.rotation.y = 0; KUMA_P.userData.set(0.8); FRIDGE.userData.open(1);
  BREADS.forEach((b, i) => { const k = clamp((t - 0.3 - i * 0.12) / 0.3); b.visible = k > 0; b.position.set(DX - 0.6 + (i % 4) * 0.42, 0.09 + Math.floor(i / 4) * 0.19 + (1 - k) * 0.6, -0.2); });
  setTop('睡眠を4時間に削ると 食欲ホルモン', '+28%', fade(t, 0.3, d, 0.25), GOLD); setHud('Spiegel ほか', '2004年', 1);
  look(DX - 0.9, 1.7, 3.2, DX + 0.0, 1.0, -0.8, 50);
  return S;
}
function sKekka(t, d) { // 結果：慣れたと思った1か月、頭は徹夜2晩分のまま働いていた。
  reset(); lift(120); KUMA_M.userData.set(1); setHud('4時間睡眠', '真似しないで', 1); ME.userData.head.rotation.x = 0.12 + Math.sin(t * 1.5) * 0.04;
  const u = ease(clamp(t / d)); look(EX + lerp(1.4, 0.4, u), lerp(2.2, 1.8, u), lerp(3.2, 1.6, u), EX, 1.3, -1.1, 50);
  return S;
}
function sKowai(t, d) { // いちばん怖いのは、眠いと感じなくなったこと。
  reset(); lift(120); KUMA_M.userData.set(1); ME.userData.head.rotation.x = -0.05;
  if (t > 0.6) say(kowai, t, 0.6, EX, 1.9, -1.2, 0.95); setHud('4時間睡眠', '真似しないで', 1);
  deskCam(1);
  return S;
}
function sAsk(t) { // あなたは毎日、何時間寝てる？（冒頭と同じ構図。時計は 6:00 のまま）
  reset(); lift(0); nightL.intensity = 3; ALARM.userData.set('6:00', '#ff5a4a'); bedCam(0);
  return S;
}

const NARR = { '1日目': 'いちにちめ', '3日目': 'みっかめ', '1週間後': 'いっしゅうかんご', '1か月後': 'いっかげつご', '1か月': 'いっかげつ', '4時間': 'よじかん', '6時間': 'ろくじかん', '6時間以上': 'ろくじかんいじょう', '2週間': 'にしゅうかん', '徹夜2晩分': 'てつやふたばんぶん', '28%': 'にじゅうはちパーセント', '2個目': 'にこめ', '言い分': 'いいぶん', '会社員': 'かいしゃいん', '昼すぎ': 'ひるすぎ', '菓子パン': 'かしパン', '夜中': 'よなか', '目安': 'めやす', '眠気': 'ねむけ', '結果：': '結果、', '怖い': 'こわい', '何時間': 'なんじかん', '慣れた': 'なれた', '首': 'くび' };
const P = planTimes([
  ['1日目の朝。鏡の前の会社員の<br>目の下に、うっすらクマ。', sDay1],
  ['本人の言い分から。忙しいから、', (t, d) => sIibun(t, 2 * d)],
  ['寝る時間を削るしかない。', (t, d) => sIibun(t + d, 2 * d)],
  ['3日目。昼すぎの会議で、ペンを<br>持ったまま首がカクン。', sDay3],
  ['1週間後。夜中の冷蔵庫の前で、<br>菓子パンを2個目。', sWeek],
  ['1か月後。本人は言う。<br>もう慣れた。', sMonth],
  ['でも、国の目安は<br>大人で6時間以上。', sMeyasu],
  ['4時間や6時間の睡眠を<br>2週間続けた実験がある。', sJikken],
  ['頭の働きは毎日下がり続け、<br>徹夜2晩分まで落ちた。', sTetsuya],
  ['なのに本人は、ほとんど<br>眠気を感じていなかった。', sNemuke],
  ['夜中の菓子パンもそのせい。<br>食欲ホルモンは28%増えた。', sGhrelin],
  ['結果：慣れたと思った1か月、', (t, d) => sKekka(t, 2 * d)],
  ['頭は徹夜2晩分のまま<br>働いていた。', (t, d) => sKekka(t + d, 2 * d)],
  ['いちばん怖いのは、<br>眠いと感じなくなったこと。', sKowai],
  ['あなたは毎日、<br>何時間寝てる？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0679',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0010',
    hookLine: '目覚まし時計が 2:00 から 6:00 に一瞬で飛んで鳴る。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月ずっと4時間睡眠だったら？',
    titleHtml: 'もしも1か月<br>ずっと4時間睡眠<br>だったら？',
    mood: 'tension', seed: 679, hits: [TP, P.at(11), P.at(13)], risers: [P.at(6)], impacts: [P.at(6, 0.4), P.at(8, 0.6), P.at(10, 0.6)],
    sfx: [[TP, 'alarm'], [P.at(0, 0.8), 'meter', 0.3], [P.at(3, 1.2), 'poof'], [P.at(4, 0.4), 'bubble'], [P.at(5, 0.6), 'buzz'], [P.at(9, 0.3), 'meter', 0.4], [P.at(13, 0.6), 'whoosh']],
    narr: NARR,
    ask: 'あなたは毎日、何時間寝てる？',
    caption: 'もしも1か月ずっと4時間睡眠だったら？\n\n1日目の朝。鏡の前の会社員の目の下に、うっすらクマ。\n本人の言い分から。忙しいから、寝る時間を削るしかない。\n3日目。昼すぎの会議で、ペンを持ったまま首がカクン。\n1週間後。夜中の冷蔵庫の前で、菓子パンを2個目。\n1か月後。本人は言う。もう慣れた。\nでも、国の目安は大人で6時間以上。\n4時間や6時間の睡眠を2週間続けた実験がある。頭の働きは毎日下がり続け、徹夜2晩分まで落ちた。なのに本人は、ほとんど眠気を感じていなかった。\n夜中の菓子パンもそのせい。睡眠を4時間に削ると、食欲ホルモンは28%増えた。\n\n結果：慣れたと思った1か月、頭は徹夜2晩分のまま働いていた。\nいちばん怖いのは、眠いと感じなくなったこと。\n\nあなたは毎日、何時間寝てる？ コメントで教えて。\n\n※真似しないでください\n出典：厚生労働省 健康づくりのための睡眠ガイド2023、Van Dongen HP ほか. Sleep 2003、Spiegel K ほか. Ann Intern Med 2004',
    hashtags: ['もしもラボ', 'もしも', '睡眠不足', '4時間睡眠', '睡眠'],
    endStats: [['大人の睡眠の目安', '6時間以上', '睡眠ガイド2023'], ['14日後の頭の働き', '最大で徹夜2晩分', 'Van Dongen ほか 2003年'], ['食欲ホルモン（4時間睡眠）', '+28%', 'Spiegel ほか 2004年']],
    sources: '出典：厚生労働省 睡眠ガイド2023、Van Dongen ほか（2003）、Spiegel ほか（2004）',
  },
});
