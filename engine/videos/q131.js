import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #131 マトリックス（映画・アメリカ・1999年製作・136分。U-NEXT・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/matoritsukusu（見放題：U-NEXT・Hulu ほか）と
//   Filmarks の動画配信欄（U-NEXT・Hulu・WOWOWオンデマンド 見放題。Prime Video はレンタル・購入だけ）で2026/11/23確認。
//   Filmarks 3.9・レビュー162,230件 filmarks.com/movies/19078）
// 確かめた事実（2026/11/23）：
//   ・映画.com eiga.com/movie/49688 ：1999年製作／136分／アメリカ。キアヌ・リーブス主演、仮想現実空間を舞台に人類とコンピュータの戦いを描いたSFアクション。
//     ソフト会社に勤めるプログラマで、凄腕ハッカーでもある主人公。ある日、謎の美女から接触を受け、彼を探していたという男と会う。
//     人類が現実だと思っている世界は、コンピュータが作り出した仮想世界だという真実を明かされる。ワイヤーアクションやバレットタイムで世界的大ヒット
//   ・Filmarks の紹介：起きてもまだ夢を見ているような感覚に悩まされていた。ある日、自宅のコンピュータ画面に不思議なメッセージが届く
// 構成（ヒント6段）：1 真夜中、パソコンの画面に謎のメッセージ・送り主はだれ？ → 2 昼は会社のプログラマー・夜は凄腕のハッカー
//   → 3 どこか作りものめいた大きな街・黒いスーツの男たちに追われる → 4 謎の男が待っていた・この世界は本物じゃない？
//   → 5 1999年のアメリカ映画・世界中で大ヒットしたSFアクション → 6 決め手：赤い薬か青い薬か・選んだらもう戻れない
// 主人公の正体・戦いの行方・結末は言わない。登場人物の名前は出さない。画面の文字は出さない（光る線だけ）。
// 俳優の顔・ポスター・ロゴは使わない。有名な場面の構図（弾をよける場面など）はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#0c1410', floor: '#18201a', fogNear: 24, fogFar: 90 });
const qs = S.scene;
const R = rng(13110);

const HERO = { skin: '#eac2a0', hair: '#1a1410', shirt: '#2a2c30', pants: '#1a1c20' };
const OFF = { skin: '#eac2a0', hair: '#1a1410', shirt: '#d8dce4', pants: '#3a3e48', tie: true };
const SUIT = { skin: '#e8c0a0', hair: '#2a2420', shirt: '#14161a', pants: '#14161a', tie: true };
const COAT = { skin: '#8a5a40', hair: '#1a1410', shirt: '#2a1a1a', pants: '#14141a', bald: true };
const ETC = [{ skin: '#f1c9a5', hair: '#2a2018', shirt: '#5a6070', pants: '#2a2e38' }, { skin: '#f4d3b5', hair: '#5a3a2a', shirt: '#8a7a6a', pants: '#3a3a44', long: true, skirt: true }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
function shades(p) { const g = box(0.34, 0.07, 0.03, mat('#050505')); g.position.set(0, 0.27, 0.205); p.userData.head.add(g); return g; }
// 光る線だけの画面（文字は出さない）。lines(k) で行数を変える
function screen(w = 1.2, h = 0.8) { const c = document.createElement('canvas'); c.width = 240; c.height = 160; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; let last = -1;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  m.userData.lines = (n, blink = true) => { n = Math.floor(n); const key = n * 2 + (blink ? 1 : 0); if (key === last) return; last = key; const g = c.getContext('2d'); g.fillStyle = '#04100a'; g.fillRect(0, 0, 240, 160);
    g.fillStyle = '#4af07a'; for (let i = 0; i < n; i++) g.fillRect(14, 16 + i * 18, 60 + ((i * 53) % 130), 8); if (blink) g.fillRect(14 + (n ? ((n - 1) * 53 % 130) + 66 : 0), 16 + Math.max(0, n - 1) * 18, 10, 10); tex.needsUpdate = true; };
  m.userData.lines(0); return m; }
function desk(x, z, ry = 0) { const g = new THREE.Group(); const t = box(1.8, 0.08, 0.9, mat('#3a3a40')); t.position.y = 0.76; g.add(t); for (const s of [-1, 1]) { const l = box(0.06, 0.76, 0.8, mat('#2a2a30')); l.position.set(s * 0.85, 0.38, 0); g.add(l); }
  const mon = box(1.0, 0.7, 0.08, mat('#1a1a1e')); mon.position.set(0, 1.2, -0.25); g.add(mon); const kb = box(0.6, 0.03, 0.2, mat('#2a2a2e')); kb.position.set(0, 0.81, 0.1); g.add(kb);
  g.position.set(x, 0, z); g.rotation.y = ry; qs.add(g); return g; }
// 上から降る緑の光の粒（文字は使わない）
function rain(cx, cz, n = 60, w = 8, h = 7) { const arr = []; for (let i = 0; i < n; i++) { const r = box(0.05, 0.3 + R() * 0.5, 0.02, gl(R() > 0.8 ? '#c8ffd0' : '#3ad06a', 0.85)); r.userData.x = cx - w / 2 + R() * w; r.userData.z = cz - R() * 1.5; r.userData.v = 1.5 + R() * 2.5; r.userData.p = R() * h; r.userData.h = h; qs.add(r); arr.push(r); } return arr; }
function rainStep(arr, t, on = true) { arr.forEach(r => { r.visible = on; const y = r.userData.h - ((t * r.userData.v + r.userData.p) % r.userData.h); r.position.set(r.userData.x, y, r.userData.z); }); }

// ---------- 1段目. 真夜中のアパートの部屋（x=0）。机につっぷして眠る男。パソコンの画面にだけ、光る文字の線 ----------
{ const fl = box(10, 0.04, 8, mat('#1e2220')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.4, 0.2, mat('#2a302c')); wl.position.set(0, 2.2, -4.6); qs.add(wl);
  for (let i = 0; i < 6; i++) { const cb = box(0.04, 0.04, 2 + R() * 2, mat('#0a0a0a')); cb.position.set(-1.4 + i * 0.5, 0.06, -2.6); cb.rotation.y = R() - 0.5; qs.add(cb); }
  const sp = box(0.5, 1.2, 0.5, mat('#1a1a1e')); sp.position.set(1.4, 0.6, -3.6); qs.add(sp); }
desk(0, -3.4);
const SCR1 = screen(0.92, 0.62); SCR1.position.set(0, 1.2, -3.6); qs.add(SCR1);
const GLOW1 = new THREE.PointLight('#4af07a', 3, 4); GLOW1.position.set(0, 1.3, -3.0); qs.add(GLOW1);
const MAN1 = person(HERO, 0, -2.6, Math.PI);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tMsg = tag('真夜中、画面に謎のメッセージ', { size: 48, w: 800, bg: '#14161c', sx: 1.6 }); tMsg.position.set(-0.2, 2.5, -3.0); qs.add(tMsg);
const tWho = tag('送り主は、だれ？', { size: 58, w: 540, bg: '#e24050', sx: 1.2 }); tWho.position.set(-0.2, 2.5, -3.0); qs.add(tWho);

// ---------- 2段目. 昼のオフィス（x=50）。同じ机が並ぶ。→ 夜、暗い部屋でキーボードを打つ ----------
const AX = 50;
{ const fl = box(16, 0.04, 12, mat('#8a8c90')); fl.position.set(AX, 0.02, -3); qs.add(fl);
  const wl = box(16, 4, 0.2, mat('#c8ccd0')); wl.position.set(AX, 2, -8); qs.add(wl);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { if (r === 0 && i === 1) continue; desk(AX - 4.5 + i * 3, -2 - r * 2); const pt = box(1.9, 1.3, 0.06, mat('#9aa0a8')); pt.position.set(AX - 4.5 + i * 3, 0.65, -2.5 - r * 2); qs.add(pt); }
  for (let i = 0; i < 4; i++) { const lp = box(2, 0.06, 0.4, gl('#f0f4f8')); lp.position.set(AX - 4.5 + i * 3, 3.9, -6.5); qs.add(lp); } }
desk(AX - 1.5, -2);
const SCR2 = screen(0.92, 0.62); SCR2.position.set(AX - 1.5, 1.2, -2.21); SCR2.rotation.y = 0; qs.add(SCR2);
const MAN2 = person(OFF, AX - 1.5, -1.2, Math.PI);
const CO2 = [person(ETC[0], AX + 1.5, -1.2, Math.PI), person(ETC[1], AX - 4.5, -3.2, Math.PI)];
const tDay = tag('昼は、会社のプログラマー', { size: 52, w: 720, bg: '#14161c', sx: 1.5 }); tDay.position.set(AX - 1.6, 2.4, -2.0); qs.add(tDay);
const tNight = tag('夜は、凄腕のハッカー', { size: 56, w: 640, bg: '#e24050', sx: 1.4 }); tNight.position.set(AX - 1.6, 2.4, -2.0); qs.add(tNight);

// ---------- 3段目. 緑がかった大きな街（x=100）。人ごみのなか、黒いスーツとサングラスの男たちが近づく ----------
const BX = 100;
{ const rd = box(30, 0.04, 40, mat('#2a302c')); rd.position.set(BX, 0.02, -10); qs.add(rd);
  for (let i = 0; i < 14; i++) { const h = 8 + R() * 16; const b = box(3.6, h, 3.4, mat(['#3a463e', '#2e3a34', '#44524a'][i % 3])); b.position.set(i < 7 ? BX - 7 - R() * 2 : BX + 7 + R() * 2, h / 2, -2 - (i % 7) * 4.5); qs.add(b);
    for (let k = 0; k < 10; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), gl(R() > 0.7 ? '#9ad8a8' : '#2a4a36')); w.position.set(b.position.x + (i < 7 ? 1.81 : -1.81), 1 + R() * (h - 1.5), b.position.z - 1.4 + R() * 2.8); w.rotation.y = i < 7 ? Math.PI / 2 : -Math.PI / 2; qs.add(w); } } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ fog: false, color: '#5a7a64' })); SKY3.position.set(BX, 14, -40); qs.add(SKY3);
const HERO3 = person(HERO, BX, -1.0, Math.PI);
const CROWD3 = []; for (let i = 0; i < 12; i++) CROWD3.push(person(ETC[i % 2], BX - 3.5 + R() * 7, -3 - R() * 10, R() > 0.5 ? 0 : Math.PI));
const AGENT3 = [0, 1, 2].map(i => { const p = person(SUIT, BX - 1.4 + i * 1.4, -9, 0); shades(p); return p; });
const tCity = tag('どこか作りものめいた、大きな街', { size: 46, w: 840, bg: '#14161c', sx: 2.3 }); tCity.position.set(BX, 2.7, -2.0); qs.add(tCity);
const tChase = tag('黒いスーツの男たちに、追われる', { size: 46, w: 840, bg: '#e24050', sx: 2.3 }); tChase.position.set(BX, 2.7, -2.0); qs.add(tChase);

// ---------- 4段目. 雨の夜の古い部屋（x=150）。向かい合う2つの椅子。長いコートの男が待っている ----------
const CX = 150;
{ const fl = box(12, 0.04, 10, mat('#3a2a24')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#4a3a34')); wl.position.set(CX, 2.5, -5); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6), gl('#16202a')); win.position.set(CX + 2.6, 2.6, -4.88); qs.add(win);
  for (const [x, ry] of [[CX - 1.3, Math.PI / 2 - 0.3], [CX + 1.3, -Math.PI / 2 + 0.3]]) { const g = new THREE.Group(); const st = box(0.9, 0.5, 0.9, mat('#6a1a1a')); st.position.y = 0.45; g.add(st); const bk = box(0.9, 0.9, 0.2, mat('#6a1a1a')); bk.position.set(0, 0.95, -0.4); g.add(bk);
    for (const s of [-1, 1]) { const a = box(0.16, 0.3, 0.9, mat('#5a1414')); a.position.set(s * 0.45, 0.8, 0); g.add(a); } g.position.set(x, 0, -2.2); g.rotation.y = ry; qs.add(g); }
  const lp = new THREE.PointLight('#ffd0a0', 3, 7); lp.position.set(CX, 3.4, -1.6); qs.add(lp); }
const RAIN4 = []; for (let i = 0; i < 30; i++) { const d = box(0.012, 0.25, 0.01, gl('#8aa0b8', 0.6)); d.userData.x = CX + 1.5 + R() * 2.2; d.userData.p = R() * 2.4; qs.add(d); RAIN4.push(d); }
const MAN4 = person(HERO, CX - 1.25, -2.15, Math.PI / 2 - 0.3);
const COAT4 = person(COAT, CX + 1.25, -2.15, -Math.PI / 2 + 0.3); shades(COAT4);
const CT4 = box(0.6, 1.1, 0.34, mat('#2a1a1a')); CT4.position.set(0, 0.5, 0); COAT4.add(CT4);
[MAN4, COAT4].forEach(p => { p.position.y = 0.0; p.userData.legs.forEach(l => l.rotation.x = -1.4); p.position.y = -0.38; });
const tWait = tag('謎の男が、待っていた', { size: 54, w: 640, bg: '#14161c', sx: 2.0 }); tWait.position.set(CX, 2.9, -2.4); qs.add(tWait);
const tFake = tag('この世界は、本物じゃない？', { size: 50, w: 760, bg: '#e24050', sx: 2.2 }); tFake.position.set(CX, 2.9, -2.4); qs.add(tFake);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーンと、並ぶ赤い座席 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1012')); fl.position.set(TX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) { const s = box(0.6, 0.8, 0.6, mat('#7a1a22')); s.position.set(TX - 2.8 + i * 0.8, 0.4 + r * 0.25, 0.6 + r * 1.0); qs.add(s); } }
const SCRN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.4), gl('#2a6a44')); SCRN5.position.set(TX, 3.0, -5); qs.add(SCRN5);
const RAIN5 = rain(TX, -4.8, 70, 6.6, 4.6); RAIN5.forEach(r => r.userData.base = 1.3);
const t1999 = tag('1999年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.3 }); t1999.position.set(TX, 2.6, -1.2); qs.add(t1999);
const tHit = tag('世界中で大ヒットした、SFアクション', { size: 46, w: 900, bg: '#e24050', sx: 2.5 }); tHit.position.set(TX, 2.6, -1.2); qs.add(tHit);

// ---------- 6段目. 暗い部屋（x=250）。小さな台に、赤い薬と青い薬。うしろには降りそそぐ緑の光 ----------
const DX = 250;
{ const fl = box(12, 0.04, 10, mat('#101410')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 28), mat('#2a2a2e')); tb.position.set(DX, 0.9, -1.6); qs.add(tb);
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.9, 10), mat('#1a1a1e')); tl.position.set(DX, 0.45, -1.6); qs.add(tl); }
const PILLS6 = []; for (const [c, x] of [['#e02a2a', -0.28], ['#2a5ae0', 0.28]]) { const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.04, 20), mat('#d8d8dc')); dish.position.set(DX + x, 0.95, -1.55); qs.add(dish);
  const pill = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 4, 10), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.4, roughness: 0.3 })); pill.rotation.z = Math.PI / 2; pill.position.set(DX + x, 1.0, -1.55); qs.add(pill); PILLS6.push(pill); }
const RAIN6 = rain(DX, -4.2, 90, 9, 6.5);
const tPill = tag('赤い薬か、青い薬か', { size: 58, w: 600, bg: '#14161c', sx: 1.05 }); qs.add(tPill);
const tBack = tag('選んだら、もう戻れない', { size: 54, w: 660, bg: '#e6b450', color: '#14161c', sx: 1.1 }); qs.add(tBack);

// ---------- shots ----------
const ALL = [tMsg, tWho, tDay, tNight, tCity, tChase, tWait, tFake, t1999, tHit, tPill, tBack, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotDesk(t, quiz = 0) { // 1段目 0〜9：真夜中、パソコンの画面に謎のメッセージが届く。送り主は、だれ？（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.25; S.key.intensity = 0.2; S.key.color.set('#8ab0a0');
  const w = quiz ? 4 : t;
  SCR1.userData.lines(2 + clamp((w - 0.3) / 2.6) * 5, Math.floor(w * 3) % 2 === 0);
  const wake = ease(clamp((w - 3.8) / 0.8));
  MAN1.userData.legs.forEach(l => l.rotation.x = -1.4); MAN1.position.y = -0.38;
  MAN1.rotation.x = 0; MAN1.userData.head.rotation.x = lerp(0.9, 0.1, wake);
  MAN1.userData.arms.forEach(a => a.rotation.x = lerp(-1.4, -0.9, wake));
  Q1.position.set(-0.2, 1.95, -3.0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tMsg.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tMsg.visible = false; tWho.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(2.4, 2.1, u), lerp(1.9, 1.8, u), lerp(-0.4, -0.9, u), -0.2, 1.3, -3.2, 62);
  return qs;
}
function shotOffice(t) { // 2段目 9〜17：主人公は、昼は会社のプログラマー。でも夜は、凄腕のハッカー
  base(); S.aim(AX, -3); lift(0);
  const night = t > 4.2;
  if (night) { S.hemi.intensity = 0.2; S.key.intensity = 0.15; S.darken(0.85, '#020604'); CO2.forEach(p => p.visible = false); } else { S.hemi.intensity = 1.2; CO2.forEach(p => p.visible = true); }
  MAN2.userData.legs.forEach(l => l.rotation.x = -1.4); MAN2.position.y = -0.38;
  MAN2.userData.arms.forEach((a, i) => a.rotation.x = -1.2 + (night ? Math.sin(t * 18 + i * 2) * 0.12 : 0));
  SCR2.userData.lines(night ? 6 : 3, night && Math.floor(t * 3) % 2 === 0);
  tDay.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDay.visible = false; tNight.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX - 1.5 + lerp(2.9, 2.6, u), lerp(2.3, 2.2, u), lerp(1.4, 1.0, u), AX - 1.7, 1.1, -2.0, 62);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：舞台は、どこか作りものめいた大きな街。黒いスーツの男たちに追われる
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.9; S.key.color.set('#c8f0d0'); S.darken(0.2, '#0a2a14');
  CROWD3.forEach((p, i) => { poseWalk(p, t * 4 + i, 0.6); p.position.z += (p.rotation.y === 0 ? 1 : -1) * 0.004; });
  AGENT3.forEach((p, i) => { p.visible = t > 3.6; p.position.z = -9 + clamp((t - 3.6) / 4.4) * 4.5; poseWalk(p, t * 5 + i, 0.7); });
  HERO3.userData.head.rotation.y = t > 4.6 ? Math.PI * 0.0 : 0; HERO3.rotation.y = t > 4.4 ? 0.0 : Math.PI;
  tCity.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCity.visible = false; tChase.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.8, 0.5, u), lerp(2.0, 1.9, u), lerp(2.6, 2.0, u), BX, 1.4, -6, 62);
  return qs;
}
function shotRoom(t) { // 4段目 25〜33：謎の男が、主人公を待っていた。この世界は、本物じゃないかもしれない
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.4, '#0a0606');
  RAIN4.forEach(d => { d.position.set(d.userData.x, 1.4 + 2.4 - ((t * 3 + d.userData.p) % 2.4), -4.85); });
  COAT4.userData.arms[0].rotation.x = t > 4.3 ? -1.3 : -0.6;
  tWait.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWait.visible = false; tFake.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.3, 0.3, u), lerp(2.0, 1.9, u), lerp(3.6, 3.0, u), CX, 1.1, -2.2, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1999年の、アメリカ映画。世界中で大ヒットした、SFアクション
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.35; S.darken(0.6, '#020202');
  rainStep(RAIN5, t); RAIN5.forEach(r => r.position.y += 1.0);
  t1999.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1999.visible = false; tHit.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.4, 0.3, u), lerp(2.6, 2.5, u), lerp(4.2, 3.6, u), TX, 2.4, -3, 62);
  return qs;
}
function shotPills(t) { // 6段目 42〜49（決め手）：赤い薬か、青い薬か。選んだら、もう戻れない
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.4; S.darken(0.7, '#010402');
  rainStep(RAIN6, t);
  PILLS6.forEach((p, i) => { p.rotation.y = t * 0.8 + i; p.position.y = 1.0 + Math.sin(t * 2 + i) * 0.01; });
  tPill.position.set(DX, 1.75, -1.8); tBack.position.set(DX, 1.75, -1.8);
  if (t < 3.6) tPill.userData.pop((t - 0.3) / 0.35); else tBack.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.2, 0.0, u), lerp(1.75, 1.65, u), lerp(0.6, 0.1, u), DX, 1.05, -1.8, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（真夜中の部屋に戻る）
  shotDesk(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotDesk(t, 0) },
  { a: 9, b: 17, f: shotOffice },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotRoom },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotPills },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '真夜中、パソコンの画面に<br>謎のメッセージが届く。'],
  [5.6, 9.0, '送り主は、<br>いったいだれ？'],
  [9.2, 13.2, '主人公は、昼は<br>会社のプログラマー。'],
  [13.2, 17.0, 'でも夜は、<br>凄腕のハッカー。'],
  [17.2, 21.0, '舞台は、どこか<br>作りものめいた大きな街。'],
  [21.0, 25.0, '黒いスーツの<br>男たちに追われる。'],
  [25.2, 29.0, '謎の男が、<br>主人公を待っていた。'],
  [29.0, 33.0, 'この世界は、<br>本物じゃないかもしれない。'],
  [33.2, 37.4, '1999年の、<br>アメリカ映画。'],
  [37.4, 41.8, '世界中で大ヒットした、<br>SFアクション。'],
  [42.2, 45.4, '赤い薬か、<br>青い薬か。'],
  [45.4, 49.0, '選んだら、<br>もう戻れない。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>マトリックス。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q131', v2: true, answer: 'マトリックス',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 13110,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [2.2, 'buzz', 0.3], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '真夜中': 'まよなか', '画面': 'がめん', '謎': 'なぞ', '届く': 'とどく', '送り主': 'おくりぬし', '主人公': 'しゅじんこう', '昼': 'ひる', '会社': 'かいしゃ', '夜': 'よる', '凄腕': 'すごうで', '舞台': 'ぶたい', '作りもの': 'つくりもの', '大きな': 'おおきな', '街': 'まち', '黒い': 'くろい', '男たち': 'おとこたち', '追われる': 'おわれる', '男': 'おとこ', '待って': 'まって', '世界': 'せかい', '本物': 'ほんもの', '1999年': 'せんきゅうひゃくきゅうじゅうきゅうねん', '映画': 'えいが', '世界中': 'せかいじゅう', '大ヒット': 'だいヒット', '赤い': 'あかい', '青い': 'あおい', '薬': 'くすり', '選んだら': 'えらんだら', '戻れない': 'もどれない', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n真夜中、パソコンの画面に謎のメッセージが届く。送り主は、いったいだれ？主人公は、昼は会社のプログラマー。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Hulu', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'マトリックス', info: 'U-NEXT・Hulu｜映画・136分', answerSize: 120 });
