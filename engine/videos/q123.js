import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #123 スタンド・バイ・ミー（映画・アメリカ・1986年製作・89分。U-NEXT・Prime Video で見放題、
//   Filmarks の動画配信欄（Prime Video・U-NEXT 見放題。2026年10月更新）と JustWatch 日本版 justwatch.com/jp/映画/sutandobaimi
//   （サブスクリプション：Amazon Prime Video・U-NEXT、1時間29分）で2026/11/21確認。Filmarks 4.0・レビュー246,389件 filmarks.com/movies/2568）
// 確かめた事実（映画.com eiga.com/movie/45887 の解説・あらすじ。2026/11/21）：
//   ・スティーブン・キングの短編小説「死体」をロブ・ライナー監督が映画化したノスタルジックな青春ドラマ。1986年製作／アメリカ
//   ・オレゴン州の小さな田舎町。それぞれに家庭の問題を抱える4人の少年たち
//   ・町から30キロばかり離れたところに、列車の事故で亡くなった人が放置されているという噂を聞き、探しに旅に出る
// 構成（ヒント6段）：1 ある日、町にひとつのうわさが広がった・森の向こうに、あるものがあるらしい → 2 主人公は小さな田舎町の少年4人組・みんな家に悩みを抱えている
//   → 3 ちょっと昔ののどかな田舎町・大人にはないしょの計画 → 4 うわさを確かめに4人だけで旅に出る・町から30キロ先の森の奥へ
//   → 5 1986年のアメリカ映画・原作はスティーブン・キングの小説 → 6 決め手：線路の上を歩いていく・タイトルは そばにいて という意味
// 探しているものの中身（遺体）は字幕・映像で見せない（うわさ・あるもの とだけ言う）。旅の途中の出来事・結末・登場人物のその後は言わない。登場人物の名前・地名（5段目より前）は出さない。
// 俳優の顔・ポスター・ロゴは使わない。劇中・ポスターで有名な 4人が線路を向こうへ歩いていく後ろ姿の構図はなぞらず、6段目は横から足もとと1人の綱渡りだけを撮る。人は汎用の3D
const S = quizStage({ bg: '#a8c8e0', floor: '#7a8a5a', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(12310);

const KIDS = [
  { skin: '#f1c9a5', hair: '#6a4a2a', shirt: '#4a6a8a', pants: '#3a4a6a' },
  { skin: '#e8b98f', hair: '#c8a060', shirt: '#e8e0d0', pants: '#4a4a5a' },
  { skin: '#f4d3b5', hair: '#2a2018', shirt: '#8a4a3a', pants: '#3a3a3a' },
  { skin: '#e0b088', hair: '#4a2a1a', shirt: '#5a7a4a', pants: '#5a5040' },
];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function kid(i, x, z) { const p = makePerson(KIDS[i]); p.scale.setScalar(0.82); p.position.set(x, 0, z); qs.add(p); return p; }
function pine(x, z, s = 1) { const g = new THREE.Group(); const t = box(0.3, 1.2, 0.3, mat('#5a3a20')); t.position.y = 0.6; g.add(t);
  for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.3 - k * 0.3, 1.6, 8), mat(['#2a5a3a', '#346a42', '#3a7a4a'][k])); c.position.y = 1.6 + k * 0.9; g.add(c); }
  g.position.set(x, 0, z); g.scale.setScalar(s); qs.add(g); return g; }
function house(x, z, c, rot = 0) { const g = new THREE.Group(); const b = box(3, 2.4, 2.6, mat(c)); b.position.y = 1.2; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.2, 4), mat('#5a4a40')); r.rotation.y = Math.PI / 4; r.position.y = 3.0; r.scale.set(1, 1, 0.85); g.add(r);
  const pr = box(3.2, 0.12, 1.0, mat('#8a6a4a')); pr.position.set(0, 0.3, 1.8); g.add(pr); const d = box(0.6, 1.2, 0.05, mat('#5a3a2a')); d.position.set(0, 0.9, 1.31); g.add(d);
  g.position.set(x, 0, z); g.rotation.y = rot; qs.add(g); return g; }

// ---------- 1段目. 昼の家のポーチ（x=0）。腰かける3人の少年。走ってきたもう1人が、何かを告げる ----------
{ const gr = box(16, 0.04, 14, mat('#8a9a5a')); gr.position.set(0, 0.02, -2); qs.add(gr);
  house(0, -5.2, '#d8c8a8'); house(-6, -6, '#c8d0c0', 0.3); house(6.5, -6, '#e0d0b8', -0.3);
  const fn = box(16, 0.6, 0.06, mat('#e8e4dc')); fn.position.set(0, 0.3, 1.2); qs.add(fn);
  pine(-5, -1, 1.1); pine(5, -1.5, 1.2); }
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(48, 40), skyTex('#6aa8e0', '#eef4f8')); SKY1.position.set(0, 12, -50); qs.add(SKY1);
const SIT1 = [0, 1, 2].map(i => { const p = kid(i, -0.9 + i * 0.9, -3.3); p.userData.legs.forEach(l => l.rotation.x = -1.4); return p; });
const RUN1 = kid(3, 3.6, 0.4);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tRumor = tag('町に、ひとつのうわさ', { size: 56, w: 640, bg: '#14161c', sx: 2.4 }); tRumor.position.set(0, 2.9, -3.0); qs.add(tRumor);
const tBeyond = tag('森の向こうに、何かがある', { size: 52, w: 740, bg: '#e24050', sx: 2.6 }); tBeyond.position.set(0, 2.9, -3.0); qs.add(tBeyond);

// ---------- 2段目. 夕方、それぞれの家の前（x=50）。うつむく4人。家の窓に明かり ----------
const AX = 50;
{ const gr = box(20, 0.04, 14, mat('#7a8a50')); gr.position.set(AX, 0.02, -2); qs.add(gr);
  for (let i = 0; i < 4; i++) house(AX - 6 + i * 4, -5.4, ['#d8c8a8', '#c8c0b8', '#d0d8c8', '#e0c8b0'][i]); }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(48, 40), skyTex('#7a7ab0', '#f0b070')); SKY2.position.set(AX, 12, -50); qs.add(SKY2);
const FOUR2 = [0, 1, 2, 3].map(i => { const p = kid(i, AX - 6 + i * 4, -3.0); return p; });
const CLOUD2 = [0, 1, 2, 3].map(i => { const c = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), gl('#5a5a6a', 0.85)); c.scale.set(1.4, 0.7, 1); c.position.set(AX - 6 + i * 4, 2.2, -3.0); qs.add(c); return c; });
const tFour = tag('田舎町の、少年4人組', { size: 56, w: 640, bg: '#14161c', sx: 2.6 }); tFour.position.set(AX, 2.7, -3.6); qs.add(tFour);
const tWorry = tag('みんな、家に悩みを', { size: 58, w: 580, bg: '#e24050', sx: 2.4 }); tWorry.position.set(AX, 2.7, -3.6); qs.add(tWorry);

// ---------- 3段目. ちょっと昔の田舎町の通り（x=100）。給水塔、古い車、雑貨屋。こっそり相談する4人 ----------
const BX = 100;
{ const rd = box(30, 0.04, 5, mat('#a89a7a')); rd.position.set(BX, 0.03, -1); qs.add(rd);
  const sh = box(5, 3, 3, mat('#b8986a')); sh.position.set(BX - 4, 1.5, -6); qs.add(sh); const aw = box(5.2, 0.12, 1.2, mat('#c84a3a')); aw.position.set(BX - 4, 2.4, -4.2); aw.rotation.x = 0.3; qs.add(aw);
  house(BX + 4, -6.4, '#d8d0c0');
  const tw = new THREE.Group(); const tk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.8, 16), mat('#9aa8b0')); tk.position.y = 7; tw.add(tk); const tp = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 16), mat('#7a8890')); tp.position.y = 8.3; tw.add(tp);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.12, 6.2, 0.12, mat('#6a6a6a')); l.position.set(x, 3.1, z); tw.add(l); } tw.position.set(BX + 8, 0, -12); qs.add(tw);
  const car = new THREE.Group(); const cb = box(3.2, 0.7, 1.5, mat('#5a8a9a')); cb.position.y = 0.6; car.add(cb); const ct = box(1.6, 0.6, 1.4, mat('#5a8a9a')); ct.position.set(-0.3, 1.2, 0); car.add(ct);
  for (const [x, z] of [[-1, 0.76], [1, 0.76], [-1, -0.76], [1, -0.76]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12), mat('#1a1a1a')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.32, z); car.add(w); }
  car.position.set(BX + 3.4, 0, 0.6); qs.add(car); pine(BX - 9, -7, 1.3); pine(BX + 10, -5, 1.2); }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(48, 40), skyTex('#6aa8e0', '#f4ecd8')); SKY3.position.set(BX, 12, -50); qs.add(SKY3);
const HUD3 = [0, 1, 2, 3].map(i => { const a = i / 4 * Math.PI * 2 + 0.4; const p = kid(i, BX - 0.6 + Math.cos(a) * 0.7, -2.4 + Math.sin(a) * 0.7); p.rotation.y = -a - Math.PI / 2; return p; });
const tOld = tag('ちょっと昔の、田舎町', { size: 56, w: 640, bg: '#14161c', sx: 2.5 }); tOld.position.set(BX - 0.6, 2.6, -2.8); qs.add(tOld);
const tSecret = tag('大人には、ないしょ', { size: 58, w: 580, bg: '#e24050', sx: 2.3 }); tSecret.position.set(BX - 0.6, 2.6, -2.8); qs.add(tSecret);

// ---------- 4段目. 森の入口（x=150）。リュックをしょって、森の奥へ入っていく4人 ----------
const CX = 150;
{ const gr = box(24, 0.04, 20, mat('#5a7a3a')); gr.position.set(CX, 0.02, -6); qs.add(gr);
  const pth = box(1.6, 0.03, 20, mat('#8a7a5a')); pth.position.set(CX, 0.04, -8); qs.add(pth);
  for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * 20; if (Math.abs(x) < 1.6) continue; pine(CX + x, -3 - R() * 16, 0.9 + R() * 0.6); }
  const sg = box(0.1, 1.2, 0.1, mat('#6a4a2a')); sg.position.set(CX + 1.2, 0.6, -1); qs.add(sg); const sb = box(0.8, 0.4, 0.06, mat('#c8a878')); sb.position.set(CX + 1.2, 1.2, -1); qs.add(sb); }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(48, 40), skyTex('#7ab0e0', '#f0f4e8')); SKY4.position.set(CX, 12, -50); qs.add(SKY4);
const WALK4 = [0, 1, 2, 3].map(i => { const p = kid(i, CX, 0); const pk = box(0.4, 0.5, 0.22, mat(['#6a5a3a', '#3a5a3a', '#7a3a2a', '#4a4a6a'][i])); pk.position.set(0, 1.15, -0.24); p.add(pk); p.rotation.y = Math.PI; return p; });
const tGo = tag('4人だけで、旅に出る', { size: 56, w: 620, bg: '#14161c', sx: 2.4 }); tGo.position.set(CX, 2.8, -3.6); qs.add(tGo);
const t30 = tag('町から30キロ先の、森の奥へ', { size: 50, w: 780, bg: '#e24050', sx: 2.8 }); t30.position.set(CX, 2.8, -3.6); qs.add(t30);

// ---------- 5段目. 書斎（x=200）。机の上の、表紙に何も書いていない古い本。ランプの光 ----------
const TX = 200;
{ const fl = box(14, 0.04, 12, mat('#6a4a30')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#5a4a3e')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 4; r++) { const sh = box(5, 0.08, 0.5, mat('#4a3020')); sh.position.set(TX + 3.6, 1.0 + r * 1.0, -4.6); qs.add(sh);
    for (let i = 0; i < 12; i++) { const b = box(0.18, 0.7, 0.4, mat(['#8a3a2a', '#3a5a3a', '#2a3a6a', '#8a7a4a'][(i + r) % 4])); b.position.set(TX + 1.4 + i * 0.36, 1.4 + r * 1.0, -4.6); qs.add(b); } }
  const dk = box(3, 0.12, 1.6, mat('#7a5030')); dk.position.set(TX - 0.6, 1.2, -2.6); qs.add(dk); const dl = box(2.8, 1.2, 1.4, mat('#5a3a20')); dl.position.set(TX - 0.6, 0.6, -2.6); qs.add(dl);
  const lp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 12, 1, true), gl('#e8c070')); lp.position.set(TX - 1.6, 1.9, -3.0); qs.add(lp); const lb = box(0.04, 0.6, 0.04, mat('#3a3a3a')); lb.position.set(TX - 1.6, 1.55, -3.0); qs.add(lb); }
const BOOK5 = new THREE.Group(); { const c = box(0.9, 0.16, 1.2, mat('#6a2a2a')); BOOK5.add(c); const pg = box(0.84, 0.12, 1.14, mat('#f0e8d0')); pg.position.set(0.04, 0, 0); BOOK5.add(pg); }
BOOK5.position.set(TX - 0.4, 1.34, -2.5); BOOK5.rotation.y = 0.3; qs.add(BOOK5);
const t1986 = tag('1986年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.3 }); t1986.position.set(TX - 0.4, 2.6, -3.4); qs.add(t1986);
const tKing = tag('原作は、スティーブン・キング', { size: 50, w: 800, bg: '#e24050', sx: 2.4 }); tKing.position.set(TX - 0.4, 2.6, -3.4); qs.add(tKing);

// ---------- 6段目. 森の中の線路（x=250）。横から見た、レールの上を両手を広げて歩く少年の足もと ----------
const DX = 250;
{ const gr = box(40, 0.04, 20, mat('#6a7a4a')); gr.position.set(DX, 0.02, -4); qs.add(gr);
  const bal = box(40, 0.16, 3.2, mat('#8a8278')); bal.position.set(DX, 0.08, -2); qs.add(bal);
  for (let i = 0; i < 44; i++) { const t = box(0.24, 0.12, 2.6, mat('#5a4030')); t.position.set(DX - 20 + i * 0.9, 0.2, -2); qs.add(t); }
  for (const z of [-2.7, -1.3]) { const r = box(40, 0.14, 0.1, new THREE.MeshStandardMaterial({ color: '#9a9aa0', metalness: 0.7, roughness: 0.35 })); r.position.set(DX, 0.33, z); qs.add(r); }
  for (let i = 0; i < 24; i++) pine(DX - 20 + i * 1.8 + R(), -6 - R() * 6, 1.0 + R() * 0.6);
  for (let i = 0; i < 10; i++) pine(DX - 20 + i * 4 + R(), 3.5 + R() * 2, 1.0); }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(48, 40), skyTex('#6a8ad0', '#f8c890')); SKY6.position.set(DX, 12, -50); qs.add(SKY6);
const BAL6 = kid(1, DX, -1.3); BAL6.position.y = 0.4; BAL6.rotation.y = Math.PI / 2;
const BEH6 = kid(2, DX - 1.6, -2.0); BEH6.position.y = 0.26; BEH6.rotation.y = Math.PI / 2;
const tRail = tag('線路の上を、どこまでも', { size: 54, w: 700, bg: '#14161c', sx: 2.5 }); qs.add(tRail);
const tStand = tag('タイトルは、そばにいて', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.5 }); qs.add(tStand);

// ---------- shots ----------
const ALL = [tRumor, tBeyond, tFour, tWorry, tOld, tSecret, tGo, t30, t1986, tKing, tRail, tStand, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotPorch(t, quiz = 0) { // 1段目 0〜9：ある日、町にひとつのうわさが広がった。森の向こうに、あるものがあるらしい（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.25;
  const k = quiz ? 1 : ease(clamp((t - 0.4) / 2.2)); RUN1.position.set(lerp(3.6, 1.6, k), 0, lerp(0.4, -2.6, k)); RUN1.rotation.y = -2.4; poseWalk(RUN1, t * 9, k < 1 ? 1.2 : 0);
  if (k >= 1) { RUN1.userData.arms[0].rotation.set(-1.8 + Math.sin(t * 6) * 0.3, 0, 0); RUN1.userData.arms[1].rotation.x = -0.6; }
  SIT1.forEach((p, i) => { p.position.y = -0.28; p.userData.head.rotation.y = 0.5 * (quiz ? 1 : ease(clamp((t - 1.6) / 0.6))); if (!quiz && t > 3.0) { p.position.y = -0.28 + Math.max(0, Math.sin((t - 3.0) * 4 + i)) * 0.03; } });
  Q1.position.set(1.25, 1.95, -3.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tRumor.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tRumor.visible = false; tBeyond.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.8, 0.4, u), lerp(1.8, 1.7, u), lerp(2.6, 1.8, u), 0.2, 1.1, -3.0, 62);
  return qs;
}
function shotHomes(t) { // 2段目 9〜17：主人公は、小さな田舎町の少年4人組。みんな、家に悩みを抱えている
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.95; S.darken(0.2, '#4a2a3a');
  FOUR2.forEach((p, i) => { p.userData.head.rotation.x = t > 4.0 ? 0.35 : 0; p.rotation.y = Math.sin(t * 0.5 + i) * 0.1; });
  CLOUD2.forEach((c, i) => { c.visible = t > 4.2; c.position.y = 2.1 + Math.sin(t * 2 + i) * 0.05; });
  tFour.position.x = tWorry.position.x = AX + lerp(-2.2, 2.2, ease(t / 8));
  tFour.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFour.visible = false; tWorry.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-2.2, 2.2, u), lerp(1.8, 1.9, u), lerp(3.2, 2.8, u), AX + lerp(-2.2, 2.2, u), 1.2, -3.4, 64);
  return qs;
}
function shotTown(t) { // 3段目 17〜25：舞台は、ちょっと昔の、のどかな田舎町。大人たちには、ないしょの計画
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.25;
  HUD3.forEach((p, i) => { p.userData.head.rotation.x = 0.3; p.userData.arms[i % 2].rotation.x = t > 4.4 ? -0.9 + Math.sin(t * 4 + i) * 0.2 : -0.2; });
  if (t > 4.4) HUD3[0].userData.arms[1].rotation.set(-2.6, 0, 0.2);
  tOld.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOld.visible = false; tSecret.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.8, 1.2, u), lerp(2.6, 2.4, u), lerp(2.8, 2.0, u), BX - 0.4, 1.2, -2.8, 62);
  return qs;
}
function shotForest(t) { // 4段目 25〜33：うわさを確かめに、4人だけで旅に出る。町から30キロ先の、森の奥へ
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.1;
  WALK4.forEach((p, i) => { p.position.set(CX + (i % 2 ? 0.35 : -0.35), 0, -1.6 - Math.floor(i / 2) * 1.0 - t * 0.5 + (i === 0 ? 0.3 : 0)); poseWalk(p, t * 4 + i, 0.8); });
  tGo.position.z = t30.position.z = -3.4 - t * 0.5;
  tGo.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGo.visible = false; t30.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.4, 0.8, u), lerp(1.4, 1.6, u), lerp(1.6, 0.4, u) - t * 0.25, CX, 1.0, -4.0 - t * 0.5, 64);
  return qs;
}
function shotBook(t) { // 5段目 33〜42：1986年の、アメリカ映画。原作は、スティーブン・キングの小説
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#1a1008');
  BOOK5.rotation.y = 0.3 + Math.sin(t * 0.4) * 0.05;
  t1986.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1986.visible = false; tKing.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(0.6, 0.2, u), lerp(2.6, 2.5, u), lerp(2.6, 2.0, u), TX - 0.4, 1.7, -2.6, 62);
  return qs;
}
function shotRail(t) { // 6段目 42〜49（決め手）：4人で、どこまでも線路の上を歩いていく。タイトルは、そばにいて という意味
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.0; S.darken(0.12, '#6a4a3a');
  const x = DX - 1.0 + t * 0.4; BAL6.position.x = x; BAL6.userData.arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * (1.4 + Math.sin(t * 3) * 0.15)));
  BAL6.userData.legs[0].rotation.x = Math.sin(t * 3.2) * 0.35; BAL6.userData.legs[1].rotation.x = -Math.sin(t * 3.2) * 0.35; BAL6.rotation.z = Math.sin(t * 2.4) * 0.06;
  BEH6.position.x = x - 1.5; poseWalk(BEH6, t * 3.2, 0.6); BEH6.position.y += 0.26;
  tRail.position.set(x - 0.4, 2.9, -2.6); tStand.position.set(x - 0.4, 2.9, -2.6);
  if (t < 3.6) tRail.userData.pop((t - 0.3) / 0.35); else tStand.userData.pop((t - 3.7) / 0.3);
  look(x + 0.2, 1.2, 3.8, x - 0.4, 1.4, -1.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（ポーチに戻る）
  shotPorch(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotPorch(t, 0) },
  { a: 9, b: 17, f: shotHomes },
  { a: 17, b: 25, f: shotTown },
  { a: 25, b: 33, f: shotForest },
  { a: 33, b: 42, f: shotBook },
  { a: 42, b: 49, f: shotRail },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、町に<br>ひとつのうわさが広がった。'],
  [5.6, 9.0, '森の向こうに、<br>あるものがあるらしい。'],
  [9.2, 13.2, '主人公は、小さな田舎町の<br>少年4人組。'],
  [13.2, 17.0, 'みんな、家に<br>悩みを抱えている。'],
  [17.2, 21.0, '舞台は、ちょっと昔の、<br>のどかな田舎町。'],
  [21.0, 25.0, '大人たちには、<br>ないしょの計画。'],
  [25.2, 29.0, 'うわさを確かめに、<br>4人だけで旅に出る。'],
  [29.0, 33.0, '町から30キロ先の、<br>森の奥へ。'],
  [33.2, 37.4, '1986年の、<br>アメリカ映画。'],
  [37.4, 41.8, '原作は、<br>スティーブン・キングの小説。'],
  [42.2, 45.4, '4人で、どこまでも<br>線路の上を歩いていく。'],
  [45.4, 49.0, 'タイトルは、<br>そばにいて という意味。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>スタンド・バイ・ミー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q123', v2: true, answer: 'スタンド・バイ・ミー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 12310,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.6, 'skitter'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '田舎町': 'いなかまち', 'ある日': 'あるひ', '町': 'まち', '広がった': 'ひろがった', '森の向こう': 'もりのむこう', '主人公': 'しゅじんこう', '小さな': 'ちいさな', '少年4人組': 'しょうねんよにんぐみ', '家': 'いえ', '悩み': 'なやみ', '抱えて': 'かかえて', '舞台': 'ぶたい', '昔': 'むかし', '大人': 'おとな', '計画': 'けいかく', '確かめ': 'たしかめ', '4人': 'よにん', '旅': 'たび', '出る': 'でる', '30キロ先': 'さんじゅっキロさき', '森の奥': 'もりのおく', '1986年': 'せんきゅうひゃくはちじゅうろくねん', 'アメリカ映画': 'アメリカえいが', '原作': 'げんさく', '小説': 'しょうせつ', '線路': 'せんろ', '上': 'うえ', '歩いて': 'あるいて', '意味': 'いみ', '映画': 'えいが', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nある日、町にひとつのうわさが広がった。森の向こうに、あるものがあるらしい。主人公は、小さな田舎町の少年4人組。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'PrimeVideo', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'スタンド・<br>バイ・ミー', info: 'U-NEXT・Prime Video｜映画・89分', answerSize: 112 });
