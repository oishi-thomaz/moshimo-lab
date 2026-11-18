import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #103 3年A組 ―今から皆さんは、人質です―（ドラマ・日本・2019年。Hulu・Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/3nian-azu-jin-karajie-sanha-ren-zhi-desu（Netflix）と
//   Filmarks の動画配信欄（Hulu・Netflix 見放題）で2026/11/18確認。Filmarks 3.8・レビュー50,806件 filmarks.com/dramas/5506/7950）
// 確かめた事実（Filmarks の作品紹介 filmarks.com/dramas/5506/7950、JustWatch の放送年。2026/11/18）：
//   ・卒業まで残り10日。担任の教師が、受け持ちの生徒29人を集めて、突然 今から皆さんは僕の人質です と告げる（Filmarks）
//   ・そこから教師と29人の人質生徒の 最後の授業 が始まる。最後の授業は、数か月前に亡くなった ある一人の生徒の死の真相 について（Filmarks）
//   ・担任 柊一颯 役は菅田将暉（Filmarks の出演者）。2019年の日本のドラマ（JustWatch）
// 構成（ヒント6段）：1 卒業まであと10日・担任がクラス全員を集めた → 2 主人公は高校の担任の先生・受け持ちは3年生の29人
//   → 3 先生のひと言で空気が変わる・生徒たちは教室から出られない → 4 始まるのは最後の授業・テーマはひとりの生徒の死の真相
//   → 5 2019年の日本のドラマ・担任役は菅田将暉 → 6 決め手：担任がクラス全員を人質に・タイトルにはクラスの名前が入る
// 亡くなった生徒の真相・犯人・先生の正体や目的の答え・結末は言わない。人物名・学校名・タイトルの文字は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。人は汎用の3D
const S = quizStage({ bg: '#1c2028', floor: '#262a32', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(10310);

const TEACHER = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#2a2e3a', pants: '#1e2028', tie: true };
const UNI = (i) => (i % 2
  ? { skin: ['#f4d3b5', '#f1c9a5', '#e8b98f'][i % 3], hair: ['#1a1410', '#3a2a20', '#2c2421'][i % 3], shirt: '#2a3448', pants: '#3a3e52', skirt: true, long: i % 4 === 1 }
  : { skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#1a1410', '#2c2421', '#3a2a20'][i % 3], shirt: '#1e2230', pants: '#1e2230' });
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }

// 教室ひとつ（黒板・窓・机）。x を変えて何度か建てる
function classroom(X, { light = '#e8e2d2', board = '#1f3a2c' } = {}) {
  const fl = box(12, 0.04, 12, mat('#8a6a4a')); fl.position.set(X, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.2, 0.2, mat(light)); wl.position.set(X, 2.1, -6); qs.add(wl);
  const bd = box(5.2, 1.6, 0.06, mat(board)); bd.position.set(X, 2.2, -5.87); qs.add(bd);
  const fr = box(5.4, 0.1, 0.12, mat('#6a5a40')); fr.position.set(X, 1.38, -5.84); qs.add(fr);
  const sw = box(0.2, 4.2, 12, mat(light)); sw.position.set(X - 6, 2.1, -2); qs.add(sw);
  for (let i = 0; i < 3; i++) { const w = box(0.06, 1.6, 2.2, gl('#a8c8e8')); w.position.set(X + 5.9, 2.3, -4.2 + i * 2.8); qs.add(w);
    const f = box(0.08, 1.7, 0.1, mat('#d8d8d8')); f.position.set(X + 5.9, 2.3, -5.35 + i * 2.8); qs.add(f); }
  const desks = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const dx = X - 3.2 + c * 1.6, dz = -2.6 + r * 1.5;
    const top = box(0.9, 0.05, 0.6, mat('#c8a070')); top.position.set(dx, 0.76, dz); qs.add(top);
    const lg = box(0.06, 0.74, 0.5, mat('#8a8e96')); lg.position.set(dx, 0.37, dz); qs.add(lg);
    desks.push([dx, dz]);
  }
  const pod = box(1.2, 1.05, 0.6, mat('#7a5a3a')); pod.position.set(X, 0.52, -4.6); qs.add(pod);
  return desks;
}

// ---------- 1段目. 教室（x=0）。壁の日めくりが 10 に。先生が前に立ち、生徒が席に着く ----------
const D1 = classroom(0);
const CAL1 = new THREE.Group();
{ const bk = box(0.9, 1.1, 0.04, mat('#ffffff')); CAL1.add(bk);
  const hd = box(0.9, 0.22, 0.05, mat('#c8202c')); hd.position.y = 0.44; CAL1.add(hd); }
const CALN1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.78), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(200, 196, (g, w, h) => { g.fillStyle = '#c8202c'; g.font = '900 150px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10', w / 2, h / 2 + 6); }) }));
CALN1.position.set(0, -0.1, 0.03); CAL1.add(CALN1);
const PAGE1 = box(0.9, 0.88, 0.02, mat('#ffffff')); PAGE1.position.set(0, -0.1, 0.05); CAL1.add(PAGE1);
CAL1.position.set(3.15, 2.5, -5.85); qs.add(CAL1);
const teacher1 = makePerson(TEACHER); teacher1.position.set(0.4, 0, -5.0); qs.add(teacher1);
const ST1 = D1.slice(0, 15).map((d, i) => { const p = makePerson(UNI(i)); p.position.set(d[0], 0, d[1] + 0.5); p.rotation.y = Math.PI; qs.add(p); return p; });
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const t10 = tag('卒業まで、あと10日', { size: 56, w: 640, bg: '#14161c', sx: 3.4 }); t10.position.set(0.8, 3.75, -4.4); qs.add(t10);
const tAll = tag('担任が、全員を集めた', { size: 56, w: 640, bg: '#c8202c', sx: 3.4 }); tAll.position.set(0.8, 3.75, -4.4); qs.add(tAll);

// ---------- 2段目. 職員室の机（x=50）。名簿に29人。先生が名簿を閉じる ----------
const AX = 50;
{ const fl = box(14, 0.04, 12, mat('#9a8a70')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(14, 4.2, 0.2, mat('#d8d4c8')); wl.position.set(AX, 2.1, -5); qs.add(wl);
  for (let i = 0; i < 3; i++) { const d = box(1.6, 0.06, 0.9, mat('#9aa0a8')); d.position.set(AX - 3 + i * 3, 0.76, -3.6); qs.add(d);
    const l = box(1.5, 0.74, 0.06, mat('#7a8088')); l.position.set(AX - 3 + i * 3, 0.37, -4.0); qs.add(l); }
  const sh = box(3.6, 2.2, 0.5, mat('#8a9098')); sh.position.set(AX + 4.2, 1.1, -4.6); qs.add(sh);
  for (let i = 0; i < 8; i++) { const b = box(0.18, 0.5, 0.4, mat(['#c8202c', '#2a6ab0', '#e6b450', '#3a8a5a'][i % 4])); b.position.set(AX + 2.8 + i * 0.36, 1.55, -4.5); qs.add(b); } }
const BOOK2 = new THREE.Group();
const PG2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.75), new THREE.MeshBasicMaterial({ map: canvasTex(440, 300, (g, w, h) => {
  g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8aa0c0'; g.lineWidth = 2;
  for (let i = 0; i < 15; i++) { g.beginPath(); g.moveTo(10, 20 + i * 18); g.lineTo(w - 10, 20 + i * 18); g.stroke(); }
  g.fillStyle = '#3a3e48'; for (let i = 0; i < 29; i++) { const c = i < 15 ? 0 : 1; const r = i % 15; g.fillRect(30 + c * 210, 10 + r * 18, 120 + ((i * 37) % 40), 6); } }) }));
PG2.rotation.x = -Math.PI / 2; BOOK2.add(PG2);
const CV2 = box(1.14, 0.03, 0.78, mat('#2a3a6a')); CV2.position.y = -0.02; BOOK2.add(CV2);
BOOK2.position.set(AX, 0.81, -3.4); qs.add(BOOK2);
const teacher2 = makePerson(TEACHER); teacher2.position.set(AX, 0, -2.5); teacher2.rotation.y = Math.PI; qs.add(teacher2);
const tHero = tag('主人公は、高校の担任', { size: 56, w: 640, bg: '#14161c', sx: 2.0 }); qs.add(tHero);
const t29 = tag('受け持ちは、3年生の29人', { size: 52, w: 720, bg: '#2a6ab0', sx: 2.2 }); qs.add(t29);

// ---------- 3段目. 夕方の教室（x=100）。扉が閉まり、窓の外が暗くなる。生徒が立ち上がる ----------
const BX = 100;
const D3 = classroom(BX, { light: '#c8bca8' });
const DOOR3 = box(1.1, 2.2, 0.08, mat('#8a6a4a')); qs.add(DOOR3);
const DGL3 = box(0.4, 0.5, 0.09, gl('#a8c8e8')); qs.add(DGL3);
const SKY3 = box(0.04, 1.7, 8.4, gl('#e89a5a')); SKY3.position.set(BX + 6.0, 2.3, -1.4); qs.add(SKY3);
const ST3 = D3.slice(0, 12).map((d, i) => { const p = makePerson(UNI(i + 3)); p.position.set(d[0], 0, d[1] + 0.5); p.rotation.y = Math.PI; qs.add(p); return p; });
const teacher3 = makePerson(TEACHER); teacher3.position.set(BX, 0, -5.0); qs.add(teacher3);
const tAir = tag('先生のひと言で、空気が変わる', { size: 52, w: 820, bg: '#14161c', sx: 4.4 }); tAir.position.set(BX - 0.2, 3.9, -3.2); qs.add(tAir);
const tOut = tag('教室から、出られない', { size: 56, w: 640, bg: '#c8202c', sx: 3.6 }); tOut.position.set(BX - 0.2, 3.9, -3.2); qs.add(tOut);

// ---------- 4段目. 空いた席（x=150）。白い花の花びん。黒板の前に先生、静かに見つめる生徒 ----------
const CX = 150;
const D4 = classroom(CX, { light: '#d0ccc0' });
const SEAT4 = D4[7];
const VASE4 = new THREE.Group();
{ const v = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.36, 16), new THREE.MeshStandardMaterial({ color: '#cfe0f0', transparent: true, opacity: 0.6, roughness: 0.1 })); v.position.y = 0.18; VASE4.add(v);
  for (let i = 0; i < 5; i++) { const st = box(0.02, 0.5, 0.02, mat('#3a7a3a')); const a = i / 5 * Math.PI * 2; st.position.set(Math.cos(a) * 0.05, 0.5, Math.sin(a) * 0.05); st.rotation.z = Math.cos(a) * 0.2; VASE4.add(st);
    const fw = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat('#ffffff')); fw.position.set(Math.cos(a) * 0.1, 0.78, Math.sin(a) * 0.1); VASE4.add(fw); } }
VASE4.position.set(SEAT4[0], 0.79, SEAT4[1]); qs.add(VASE4);
const ST4 = D4.filter((d, i) => i !== 7).slice(0, 14).map((d, i) => { const p = makePerson(UNI(i + 6)); p.position.set(d[0], 0, d[1] + 0.5); p.rotation.y = Math.PI; qs.add(p); return p; });
const teacher4 = makePerson(TEACHER); teacher4.position.set(CX - 0.6, 0, -5.0); qs.add(teacher4);
const tLast = tag('始まるのは、最後の授業', { size: 54, w: 700, bg: '#14161c', sx: 2.0 }); tLast.position.set(SEAT4[0] - 0.7, 2.75, SEAT4[1] - 2.6); qs.add(tLast);
const tTruth = tag('ひとりの生徒の、死の真相', { size: 54, w: 720, bg: '#2a6ab0', sx: 2.1 }); tTruth.position.set(SEAT4[0] - 0.7, 2.75, SEAT4[1] - 2.6); qs.add(tTruth);

// ---------- 5段目. 夜の居間（x=200）。テレビで日曜の夜のドラマ ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#7a5a40')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#e0d4bc')); wl.position.set(TX, 2.5, -4); qs.add(wl);
  const rack = box(3.6, 0.6, 0.6, mat('#4a3a2a')); rack.position.set(TX, 0.3, -3.5); qs.add(rack);
  const sofa = box(3.0, 0.5, 1.0, mat('#4a5a7a')); sofa.position.set(TX, 0.4, 2.2); qs.add(sofa);
  const sb = box(3.0, 0.8, 0.3, mat('#4a5a7a')); sb.position.set(TX, 0.8, 2.75); qs.add(sb); }
const TV5 = box(3.2, 1.9, 0.12, mat('#121418')); TV5.position.set(TX, 1.65, -3.5); qs.add(TV5);
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.7), new THREE.MeshBasicMaterial({ map: canvasTex(600, 340, (g, w, h) => {
  g.fillStyle = '#2a3a2c'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8a070'; for (let i = 0; i < 4; i++) g.fillRect(60 + i * 130, 230, 90, 20);
  g.fillStyle = '#1f3a2c'; g.fillRect(100, 40, 400, 120); g.fillStyle = '#e8e2d2'; g.fillRect(0, 0, 40, h); g.fillRect(w - 40, 0, 40, h); }) }));
SCR5.position.set(TX, 1.65, -3.43); qs.add(SCR5);
const VIEW5 = [0, 1].map(i => { const p = makePerson(i ? { skin: '#f4d3b5', hair: '#3a2a20', shirt: '#c8a050', pants: '#3a3e52', long: true } : { skin: '#e8b98f', hair: '#1a1410', shirt: '#5a6a3a', pants: '#2a2e3a' }); p.position.set(TX - 0.6 + i * 1.2, 0.2, 2.1); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.4); qs.add(p); return p; });
const t2019 = tag('2019年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.4 }); t2019.position.set(TX, 3.3, -3.2); qs.add(t2019);
const tSuda = tag('担任役は、菅田将暉', { size: 56, w: 620, bg: '#2a6ab0', sx: 3.2 }); tSuda.position.set(TX, 3.3, -3.2); qs.add(tSuda);

// ---------- 6段目. 夜の教室（x=250）。扉に鎖と錠。先生の前に29の席 ----------
const DX = 250;
const D6 = classroom(DX, { light: '#a8a49a', board: '#1a2e24' });
const DOOR6 = box(1.1, 2.2, 0.08, mat('#8a6a4a')); DOOR6.position.set(DX - 4.4, 1.1, -5.88); qs.add(DOOR6);
const CHAIN6 = []; for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 12), mat("#c8ccd4")); c.position.set(DX - 4.4 - 0.85 + i * 0.21, 1.2 + Math.sin(i / 8 * Math.PI) * -0.12, -5.8); c.rotation.y = i % 2 ? Math.PI / 2 : 0; qs.add(c); CHAIN6.push(c); }
const LOCK6 = new THREE.Group();
{ const b = box(0.24, 0.22, 0.08, mat('#c8a040')); LOCK6.add(b); const s = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI), mat('#b0b4bc')); s.position.y = 0.11; LOCK6.add(s); }
LOCK6.position.set(DX - 4.4, 1.0, -5.78); LOCK6.scale.setScalar(1.8); qs.add(LOCK6);
const ST6 = D6.slice(0, 18).map((d, i) => { const p = makePerson(UNI(i + 1)); p.position.set(d[0], 0, d[1] + 0.5); p.rotation.y = Math.PI; qs.add(p); return p; });
const teacher6 = makePerson(TEACHER); teacher6.position.set(DX, 0, -5.0); qs.add(teacher6);
const tHost = tag('担任が、クラス全員を人質に', { size: 52, w: 780, bg: '#c8202c', sx: 4.0 }); tHost.position.set(DX - 1.7, 3.9, -4.0); qs.add(tHost);
const tName = tag('タイトルに、クラスの名前', { size: 54, w: 720, bg: '#2a6ab0', sx: 3.8 }); tName.position.set(DX - 1.7, 3.9, -4.0); qs.add(tName);

// ---------- shots ----------
const ALL = [t10, tAll, tHero, t29, tAir, tOut, tLast, tTruth, t2019, tSuda, tHost, tName, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotRoom(t, quiz = 0) { // 1段目 0〜9：卒業まで、あと10日。担任が、クラス全員を集めた（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.0;
  const k = quiz ? 1 : ease(clamp((t - 0.6) / 1.0));
  PAGE1.position.y = -0.1 + k * 1.4; PAGE1.rotation.x = -k * 1.2; PAGE1.visible = k < 0.98;
  ST1.forEach((p, i) => { p.userData.head.rotation.x = 0.05; p.userData.legs.forEach(l => l.rotation.x = 0); });
  teacher1.userData.arms[1].rotation.x = quiz ? 0 : -clamp((t - 4.6) / 0.6) * 1.4;
  Q1.position.set(1.6, 2.4, -4.4); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { t10.userData.pop((t - 1.8) / 0.35); if (t > 4.6) t10.visible = false; tAll.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.6, 1.2, u), lerp(3.0, 2.8, u), lerp(4.6, 3.6, u), 1.0, 1.9, -4.6, 62);
  return qs;
}
function shotDesk(t) { // 2段目 9〜17：主人公は、高校の担任の先生。受け持ちは、3年生の29人
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.1;
  teacher2.userData.head.rotation.x = 0.5; teacher2.userData.arms.forEach(a => a.rotation.x = -0.9);
  tHero.position.set(AX, 3.0, -4.2); t29.position.set(AX, 3.0, -4.2);
  tHero.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tHero.visible = false; t29.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-1.4, -0.9, u), lerp(3.4, 3.2, u), lerp(1.8, 1.3, u), AX, 1.5, -3.3, 58);
  return qs;
}
function shotDoor(t) { // 3段目 17〜25：先生のひと言で、空気が変わる。生徒たちは、教室から出られない
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = lerp(1.0, 0.55, clamp(t / 6)); S.darken(clamp(t / 6) * 0.45, '#0a0a14');
  SKY3.material.color.set(new THREE.Color('#e89a5a').lerp(new THREE.Color('#2a2a48'), clamp(t / 6)));
  const k = ease(clamp((t - 3.6) / 0.8));
  DOOR3.position.set(BX - 4.4 + (1 - k) * 1.1, 1.1, -5.88); DGL3.position.set(DOOR3.position.x, 1.6, -5.86);
  ST3.forEach((p, i) => { const up = clamp((t - 1.2 - i * 0.12) / 0.5); p.position.y = 0; p.userData.head.rotation.y = up * (i % 2 ? 0.4 : -0.4) * Math.sin(t * 2 + i); });
  tAir.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAir.visible = false; tOut.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(2.6, 2.0, u), lerp(3.2, 3.0, u), lerp(4.2, 3.6, u), BX - 1.2, 1.8, -4.6, 62);
  return qs;
}
function shotSeat(t) { // 4段目 25〜33：始まるのは、最後の授業。テーマは、ひとりの生徒の死の真相
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.25, '#0a0a14');
  ST4.forEach((p, i) => p.userData.head.rotation.x = 0.2);
  tLast.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLast.visible = false; tTruth.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(SEAT4[0] + lerp(1.4, 0.9, u), lerp(1.9, 1.7, u), SEAT4[1] + lerp(3.0, 2.3, u), SEAT4[0], 1.2, SEAT4[1] - 0.6, 60);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2019年の、日本のドラマ。担任を演じたのは、菅田将暉
  base(); S.aim(TX, 0); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#08080e');
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2019.visible = false; tSuda.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(3.2, 3.0, u), lerp(5.6, 4.8, u), TX, 2.0, -3.4, 62);
  return qs;
}
function shotLock(t) { // 6段目 42〜49（決め手）：担任が、クラス全員を人質に。タイトルには、クラスの名前が入る
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.6; S.darken(0.45, '#08080e');
  LOCK6.rotation.z = Math.sin(t * 5) * 0.08 * clamp(1 - t / 2);
  ST6.forEach((p, i) => p.userData.head.rotation.x = -0.05);
  if (t < 3.6) tHost.userData.pop((t - 0.3) / 0.35); else tName.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(1.4, 0.8, u), lerp(3.0, 2.8, u), lerp(4.4, 3.8, u), DX - 2.0, 1.7, -4.8, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（教室に戻る）
  shotRoom(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRoom(t, 0) },
  { a: 9, b: 17, f: shotDesk },
  { a: 17, b: 25, f: shotDoor },
  { a: 25, b: 33, f: shotSeat },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotLock },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '卒業まで、<br>あと10日。'],
  [5.6, 9.0, '担任が、クラス全員を<br>教室に集めた。'],
  [9.2, 13.2, '主人公は、<br>高校の担任の先生。'],
  [13.2, 17.0, '受け持ちは、<br>3年生の29人。'],
  [17.2, 21.0, '先生のひと言で、<br>空気が変わる。'],
  [21.0, 25.0, '生徒たちは、<br>教室から出られない。'],
  [25.2, 29.0, '始まるのは、<br>最後の授業。'],
  [29.0, 33.0, 'テーマは、ひとりの<br>生徒の死の真相。'],
  [33.2, 37.4, '2019年の、<br>日本のドラマ。'],
  [37.4, 41.8, '担任を演じたのは、<br>菅田将暉。'],
  [42.2, 45.4, '担任が、クラス全員を<br>人質にとる。'],
  [45.4, 49.0, 'タイトルには、<br>クラスの名前が入る。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>3年A組。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q103', v2: true, answer: '3年A組 ―今から皆さんは、人質です―',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 10310,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '卒業': 'そつぎょう', '10日': 'とおか', '担任': 'たんにん', '全員': 'ぜんいん', '教室': 'きょうしつ', '集めた': 'あつめた', '主人公': 'しゅじんこう', '高校': 'こうこう', '先生': 'せんせい', '受け持ち': 'うけもち', '3年生': 'さんねんせい', '29人': 'にじゅうくにん', 'ひと言': 'ひとこと', '空気': 'くうき', '変わる': 'かわる', '生徒': 'せいと', '出られない': 'でられない', '始まる': 'はじまる', '最後': 'さいご', '授業': 'じゅぎょう', '死': 'し', '真相': 'しんそう', '2019年': 'にせんじゅうきゅうねん', '日本': 'にほん', '演じた': 'えんじた', '菅田将暉': 'すだまさき', '人質': 'ひとじち', '名前': 'なまえ', '入る': 'はいる', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '3年A組': 'さんねんエーぐみ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n卒業まで、あと10日。担任が、クラス全員を教室に集めた。主人公は、高校の担任の先生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'Netflix', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: '3年A組<br><span style="font-size:58px">―今から皆さんは、人質です―</span>', info: 'Hulu・Netflix｜日本のドラマ', answerSize: 136 });
