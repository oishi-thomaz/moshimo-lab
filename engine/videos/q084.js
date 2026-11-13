import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #084 葬送のフリーレン（アニメ・日本・2023年〜。Netflix・Hulu で見放題（Prime Video・U-NEXT なども）、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/zang-song-nohuriren で2026/11/13確認（Filmarks の動画配信欄も Netflix・Hulu ほか見放題）。
//   Filmarks 第1期 4.3・レビュー43,973件 filmarks.com/animes/3844/5200）
// 確かめた事実（Filmarks の作品紹介、ja.wikipedia.org/wiki/葬送のフリーレン・葬送のフリーレン_(アニメ)。2026/11/13）：
//   ・勇者・僧侶・戦士・魔法使いの4人のパーティーが、10年に及ぶ冒険の末に魔王を倒し、世界に平和をもたらした（Filmarks・Wikipedia）
//   ・主人公の魔法使いは、千年以上生きるエルフ。50年後に再会した仲間の勇者は老い、残りわずかだった（Filmarks）
//   ・勇者の死を目の当たりにし、人を知ろうとしてこなかった自分を悔いて、人を知るための旅に出る（Filmarks）
//   ・旅には、仲間の僧侶が引き取った少女が弟子として加わる（Wikipedia）
//   ・テレビアニメ第1期は2023年9月から2024年3月、第2期は2026年1月から3月まで日本テレビ系列ほかで放送（Wikipedia）
//   ・原作漫画は第14回マンガ大賞を受賞（Wikipedia）
// 構成（ヒント6段）：1 魔王を倒した4人、10年の冒険が終わる → 2 主人公は千年以上生きる魔法使い、50年後に仲間は老いていた
//   → 3 仲間を見送り、もっと人を知ればよかったと気づく → 4 人を知るための新しい旅、若い弟子と
//   → 5 2023年からのアニメ・原作はマンガ大賞、第2期は2026年1月から → 6 決め手：勇者一行のその後の物語、タイトルは漢字2文字と主人公の名前
// 先の展開・結末は言わない。人物名・地名は6段目まで出さない（6段目も名前そのものは言わない）。
// アニメの絵・キャラクターの見た目・ポスター・ロゴ・有名な場面（流星群・花畑など）の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#1c2230', floor: '#2a3428', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8484);

const ELF = { skin: '#f6e2d0', hair: '#e8e4dc', shirt: '#f4f0e8', pants: '#2a2a34', long: true, skirt: true };
const HERO = { skin: '#f1c9a5', hair: '#6a8ac8', shirt: '#2a4a8a', pants: '#2a2a34' };
const PRIEST = { skin: '#f1c9a5', hair: '#8a6a4a', shirt: '#e8e4d8', pants: '#3a3a44' };
const DWARF = { skin: '#e8b98f', hair: '#9a9a9a', shirt: '#8a5a3a', pants: '#4a3a2a', scale: 0.72 };
const OLD = (o) => Object.assign({}, o, { hair: '#d8d8d8' });
const PUPIL = { skin: '#f4d3b5', hair: '#6a4a8a', shirt: '#2a2a3a', pants: '#2a2a3a', long: true, skirt: true, scale: 0.92 };

function elfEars(p) { for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), mat(ELF.skin)); e.rotation.z = -s * 1.2; e.position.set(s * 0.26, 0.3, 0); p.userData.head.add(e); } }
function staff(color = '#c8a050') { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8), mat('#6a4a30')); s.position.y = 0.75; g.add(s); const o = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: '#c8e8ff' })); o.position.y = 1.55; g.add(o); const r = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 16), mat(color)); r.position.y = 1.55; g.add(r); return g; }
function sword() { const g = new THREE.Group(); const b = box(0.06, 0.9, 0.02, new THREE.MeshStandardMaterial({ color: '#dfe6ee', metalness: 0.8, roughness: 0.2 })); b.position.y = 0.55; g.add(b); const h = box(0.28, 0.05, 0.05, mat('#c8a050')); h.position.y = 0.1; g.add(h); return g; }
function axe() { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), mat('#6a4a30')); s.position.y = 0.5; g.add(s); const h = box(0.36, 0.3, 0.04, new THREE.MeshStandardMaterial({ color: '#b8c0c8', metalness: 0.7, roughness: 0.3 })); h.position.set(0.14, 0.9, 0); g.add(h); return g; }
function cane() { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 8), mat('#6a4a30')); return c; }
function holdIn(p, obj, side = 1, y = -0.62) { obj.position.set(0, y, 0.06); p.userData.arms[side].add(obj); return obj; }

// ---------- 1段目. 魔王の城を背に（x=0）。冒険を終えた4人 ----------
const FIRE1 = [];
{ const gr = box(18, 0.04, 14, mat('#3a4430')); gr.position.set(0, 0.02, -3); qs.add(gr);
  const cast = new THREE.Group(); const k = box(5, 6, 3, mat('#2a2230')); k.position.y = 3; cast.add(k); for (const x of [-3, 3]) { const t = box(1.4, 8, 1.4, mat('#2a2230')); t.position.set(x, 4, 0); cast.add(t); const r = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 4), mat('#3a2a40')); r.position.set(x, 8.9, 0); r.rotation.y = Math.PI / 4; cast.add(r); }
  cast.position.set(0, 0, -16); qs.add(cast);
  for (let i = 0; i < 5; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + (i % 2) * 0.3), mat('#5a5a58')); rk.position.set(-5 + i * 2.6, 0.3, -6 - (i % 3)); qs.add(rk); } }
const P1 = [HERO, PRIEST, DWARF, ELF].map((o, i) => { const p = makePerson(o); p.position.set(-1.35 + i * 0.9, 0, -2.0 - (i % 2) * 0.2); qs.add(p); return p; });
elfEars(P1[3]); holdIn(P1[0], sword(), 1); holdIn(P1[2], axe(), 1); holdIn(P1[3], staff(), 0); holdIn(P1[1], staff('#e8e4d8'), 0);
for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: ['#f2c14e', '#ffffff', '#8ad0ff'][i % 3] })); qs.add(f); FIRE1.push(f); }
const tFour = tag('魔王を倒した4人', { size: 62, w: 520, bg: '#14161c', sx: 1.9 }); tFour.position.set(0, 3.0, -2.4); qs.add(tFour);
const tTen = tag('10年の冒険が、終わる', { size: 58, w: 620, bg: '#3a5aa8', sx: 2.1 }); tTen.position.set(0, 3.0, -2.4); qs.add(tTen);

// ---------- 2段目. 50年後の村の広場（x=40）。年老いた仲間と、変わらない魔法使い ----------
const AX = 40;
{ const gr = box(16, 0.04, 12, mat('#8a8070')); gr.position.set(AX, 0.02, -2); qs.add(gr);
  for (let i = 0; i < 4; i++) { const h = box(2.6, 2.6, 2.4, mat(['#c8b898', '#b8a888', '#d0c0a0', '#a89878'][i])); h.position.set(AX - 5 + i * 3.4, 1.3, -6); qs.add(h); const r = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.3, 4), mat(['#8a3a2a', '#5a4a3a', '#7a5a3a', '#6a3a3a'][i])); r.rotation.y = Math.PI / 4; r.position.set(AX - 5 + i * 3.4, 3.25, -6); qs.add(r); }
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.7, 16), mat('#8a8a88')); well.position.set(AX + 2.8, 0.35, -3.4); qs.add(well); }
const P2 = [OLD(HERO), OLD(PRIEST), DWARF, ELF].map((o, i) => { const p = makePerson(o); p.position.set(AX - 1.35 + i * 0.9, 0, -2.0); qs.add(p); return p; });
elfEars(P2[3]); holdIn(P2[3], staff(), 0); holdIn(P2[0], cane(), 1, -0.75); holdIn(P2[1], cane(), 1, -0.75);
const tLong = tag('千年を生きる魔法使い', { size: 58, w: 620, bg: '#14161c', sx: 2.1 }); tLong.position.set(AX, 3.0, -2.4); qs.add(tLong);
const tFifty = tag('50年後、仲間は老いた', { size: 58, w: 620, bg: '#8a6a3a', sx: 2.1 }); tFifty.position.set(AX, 3.0, -2.4); qs.add(tFifty);

// ---------- 3段目. 夕方の丘（x=80）。仲間を見送って、ひとり立ちつくす ----------
const BX = 80;
const PETALS = [];
{ const gr = box(24, 0.04, 20, mat('#4a5a3a')); gr.position.set(BX, 0.02, -5); qs.add(gr);
  const hill = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#5a6a44')); hill.scale.y = 0.25; hill.position.set(BX, 0, -6); qs.add(hill);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.6, 28), new THREE.MeshBasicMaterial({ color: '#f4b070' })); sun.position.set(BX + 3, 2.6, -24); qs.add(sun);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.2, 8), mat('#5a4030')); tr.position.set(BX - 2.6, 2.4, -6.6); qs.add(tr); const lv = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), mat('#3a5a3a')); lv.position.set(BX - 2.6, 3.9, -6.6); qs.add(lv); }
const MOURN = []; for (let i = 0; i < 6; i++) { const p = makePerson({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#1d1a19', '#4a3426', '#9a9a9a'][i % 3], shirt: '#1e1e26', pants: '#1e1e26', long: i % 2 === 1, skirt: i % 2 === 1 }); p.position.set(BX + 0.6 + (i % 3) * 0.8, 1.2, -6.4 - Math.floor(i / 3) * 0.8); p.rotation.y = Math.PI; qs.add(p); MOURN.push(p); }
const elf3 = makePerson(ELF); elfEars(elf3); holdIn(elf3, staff(), 0); elf3.position.set(BX - 0.6, 0.6, -3.6); elf3.rotation.y = Math.PI * 0.9; qs.add(elf3);
for (let i = 0; i < 24; i++) { const pt = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.06), new THREE.MeshBasicMaterial({ color: ['#8ab0f0', '#f4f0f8', '#b8c8f8'][i % 3], side: THREE.DoubleSide })); pt.position.set(BX, 2, -4); qs.add(pt); PETALS.push(pt); }
const tSee = tag('仲間を、見送って', { size: 62, w: 540, bg: '#14161c', sx: 1.9 }); tSee.position.set(BX + 0.2, 3.2, -5.2); qs.add(tSee);
const tKnow = tag('人を、知らなかった', { size: 60, w: 560, bg: '#5a6aa8', sx: 2.0 }); tKnow.position.set(BX + 0.2, 3.2, -5.2); qs.add(tKnow);

// ---------- 4段目. 草原の一本道（x=120）。魔法使いと若い弟子の旅 ----------
const CX = 120;
const GRASS = [];
{ const gr = box(30, 0.04, 30, mat('#6a8a4a')); gr.position.set(CX, 0.02, -8); qs.add(gr);
  const road = box(1.6, 0.03, 30, mat('#c8b088')); road.position.set(CX, 0.04, -8); qs.add(road);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(4 + i, 5 + (i % 2) * 2, 5), mat(['#6a7a9a', '#7a8aa8', '#5a6a8a'][i % 3])); m.position.set(CX - 12 + i * 6, 2.5, -24); qs.add(m); }
  for (let i = 0; i < 40; i++) { const g = box(0.05, 0.3, 0.05, mat('#4a7a3a')); g.position.set(CX - 6 + R() * 12, 0.15, -1 - R() * 12); if (Math.abs(g.position.x - CX) > 1) { qs.add(g); GRASS.push(g); } } }
const elf4 = makePerson(ELF); elfEars(elf4); holdIn(elf4, staff(), 0); elf4.position.set(CX, 0, -2); qs.add(elf4);
const pupil4 = makePerson(PUPIL); holdIn(pupil4, staff('#8a6ab8'), 1); pupil4.position.set(CX, 0, -2); qs.add(pupil4);
const BAG4 = box(0.3, 0.35, 0.18, mat('#8a5a3a')); BAG4.position.set(CX, 1.2, -2); qs.add(BAG4);
const tJourney = tag('人を知るための旅', { size: 62, w: 540, bg: '#14161c', sx: 1.9 }); tJourney.position.set(CX, 3.0, -3.0); qs.add(tJourney);
const tPupil = tag('若い弟子といっしょに', { size: 58, w: 620, bg: '#6a4a8a', sx: 2.1 }); tPupil.position.set(CX, 3.0, -3.0); qs.add(tPupil);

// ---------- 5段目. 夜のテレビ（x=180）。2023年からの日本のアニメ ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#2e3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(3.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.1, -3.5); qs.add(tvb); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8ab8e8'); gr.addColorStop(1, '#e8f0f8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7a8aa8'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(i * 200 - 60, 330); g.lineTo(i * 200 + 60, 170 + (i % 2) * 40); g.lineTo(i * 200 + 180, 330); g.fill(); }
  g.fillStyle = '#6a9a4a'; g.fillRect(0, 320, w, 160); g.fillStyle = '#d8c098'; g.beginPath(); g.moveTo(380, h); g.lineTo(410, 320); g.lineTo(430, 320); g.lineTo(460, h); g.fill(); }) }));
TV.position.set(TX, 2.1, -3.42); qs.add(TV);
const BOOK5 = new THREE.Group(); { const c = box(0.9, 0.08, 1.2, mat('#c8282c')); BOOK5.add(c); const pg = box(0.84, 0.06, 1.14, mat('#f8f4e8')); pg.position.y = 0.06; BOOK5.add(pg); }
BOOK5.position.set(TX + 2.6, 0.7, -2.4); qs.add(BOOK5);
const t2023 = tag('2023年〜 日本のアニメ', { size: 56, w: 660, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2023.position.set(TX, 4.4, -3.0); qs.add(t2023);
const tAward = tag('原作はマンガ大賞', { size: 60, w: 540, bg: '#c8282c', sx: 2.0 }); tAward.position.set(TX, 4.4, -3.0); qs.add(tAward);
const t2nd = tag('第2期は2026年1月から', { size: 56, w: 660, bg: '#3a5aa8', sx: 2.4 }); t2nd.position.set(TX, 4.4, -3.0); qs.add(t2nd);

// ---------- 6段目. 夜明けの分かれ道（x=220）。冒険のあとから始まる旅 ----------
const DX = 220;
{ const gr = box(30, 0.04, 30, mat('#4a5a3a')); gr.position.set(DX, 0.02, -8); qs.add(gr);
  const r1 = box(1.4, 0.03, 16, mat('#b8a078')); r1.position.set(DX - 1.4, 0.04, -9); r1.rotation.y = 0.25; qs.add(r1);
  const r2 = box(1.4, 0.03, 16, mat('#b8a078')); r2.position.set(DX + 1.4, 0.04, -9); r2.rotation.y = -0.25; qs.add(r2);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 8), mat('#6a4a30')); post.position.set(DX, 0.9, -2.6); qs.add(post);
  for (const s of [-1, 1]) { const ar = box(0.8, 0.22, 0.05, mat('#8a6a48')); ar.position.set(DX + s * 0.35, 1.5 - (s > 0 ? 0.3 : 0), -2.6); ar.rotation.z = s * 0.1; qs.add(ar); }
  const sun = new THREE.Mesh(new THREE.CircleGeometry(2.2, 28), new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); sun.position.set(DX, 1.2, -26); qs.add(sun); }
const elf6 = makePerson(ELF); elfEars(elf6); holdIn(elf6, staff(), 0); elf6.position.set(DX - 0.5, 0, -1.6); elf6.rotation.y = Math.PI; qs.add(elf6);
const pupil6 = makePerson(PUPIL); holdIn(pupil6, staff('#8a6ab8'), 1); pupil6.position.set(DX + 0.4, 0, -1.4); pupil6.rotation.y = Math.PI; qs.add(pupil6);
const SPARK6 = []; for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#c8e8ff' })); s.position.set(DX, 1.5, -2); qs.add(s); SPARK6.push(s); }
const tAfter = tag('冒険の、その後の物語', { size: 58, w: 620, bg: '#14161c', sx: 2.1 }); tAfter.position.set(DX, 2.9, -2.6); qs.add(tAfter);
const tName = tag('漢字2文字＋主人公の名前', { size: 52, w: 700, bg: '#3a5aa8', sx: 2.4 }); tName.position.set(DX, 2.9, -2.6); qs.add(tName);

// ---------- shots ----------
const ALL = [tFour, tTen, tLong, tFifty, tSee, tKnow, tJourney, tPupil, t2023, tAward, t2nd, tAfter, tName];
function base() { S.reset(); ALL.forEach(x => x.visible = false); FIRE1.forEach(f => f.visible = false); PETALS.forEach(p => p.visible = false); SPARK6.forEach(s => s.visible = false); }

function shotVictory(t, quiz = 0) { // 1段目 0〜9：魔王を倒し、世界を救った4人の仲間。10年の冒険が、いま終わる（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.0; S.darken(0.25, '#141020');
  P1.forEach((p, i) => { p.rotation.y = 0; p.userData.arms[i === 3 ? 1 : 0].rotation.x = (quiz || t > 4.2) ? -2.7 : -0.2; p.position.y = (!quiz && t > 4.2) ? Math.abs(Math.sin(t * 4 + i)) * 0.08 : 0; });
  P1[3].userData.head.rotation.y = (quiz || t > 4.2) ? 0 : -0.4;
  FIRE1.forEach((f, i) => { f.visible = quiz || t > 4.2; const k = ((t - 4.2) * 0.5 + i / 10) % 1; const a = i * 0.63; f.position.set(Math.cos(a) * k * 2.4, 4.0 + Math.sin(a) * k * 1.6 - k * k * 0.6, -6); f.scale.setScalar(1.6 - k); });
  if (!quiz) { tFour.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tFour.visible = false; tTen.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.2, 0.0, u), lerp(1.5, 1.6, u), lerp(3.6, 3.0, u), 0.0, 1.6, -3.0, 64);
  return qs;
}
function shotFifty(t) { // 2段目 9〜17：主人公は、千年以上生きるエルフの魔法使い。50年後、仲間は年老いていた
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.25;
  const old = t > 4.2;
  P2.forEach((p, i) => { if (i < 3) { p.visible = true; p.userData.head.rotation.x = old ? 0.2 : 0; p.rotation.x = old && i < 2 ? 0.15 : 0; } });
  P2[0].visible = old; P2[1].visible = old; P2[2].visible = old;
  P2[3].position.x = old ? AX + 1.35 : AX; P2[3].rotation.y = old ? -0.5 : 0; P2[3].userData.head.rotation.x = old ? 0.1 : 0;
  tLong.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLong.visible = false; tFifty.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.6, 0.2, u), lerp(1.8, 1.9, u), lerp(3.2, 3.6, u), AX + (old ? 0.2 : 0.2), 1.4, -2.0, 62);
  return qs;
}
function shotHill(t, quiz = 0) { // 3段目 17〜25：仲間を見送り、初めて気づく。もっと、人を知ればよかった
  base(); S.aim(BX, -5); lift(0); S.hemi.intensity = 0.85; S.darken(0.35, '#2a1a20');
  MOURN.forEach((p, i) => { p.userData.head.rotation.x = 0.35; });
  elf3.userData.head.rotation.x = (quiz || t > 4.2) ? 0.45 : 0.1;
  PETALS.forEach((p, i) => { p.visible = true; const k = (t * 0.12 + i / 24) % 1; p.position.set(BX - 3 + (i % 8) * 0.8 + Math.sin(t * 0.8 + i) * 0.4, 3.6 - k * 3.4, -3.0 - (i % 3) * 1.0); p.rotation.set(t + i, t * 1.3 + i, i); });
  if (!quiz) { tSee.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSee.visible = false; tKnow.userData.pop((t - 4.2) / 0.35); }
  const u = ease(t / 8);
  look(BX + lerp(-1.8, -1.2, u), lerp(2.1, 2.2, u), lerp(1.4, 0.6, u), BX, 1.5, -5.0, 60);
  return qs;
}
function shotRoad(t) { // 4段目 25〜33：人を知るための、新しい旅へ。若い弟子と、ふたりで歩く
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.3;
  const z = -1.4 - t * 0.35;
  elf4.position.set(CX - 0.35, 0, z); elf4.rotation.y = Math.PI; poseWalk(elf4, t * 4, 0.5);
  pupil4.visible = t > 4.0; pupil4.position.set(CX + 0.35, 0, z + (t > 4.0 ? lerp(1.2, 0.1, ease(clamp((t - 4.0) / 1.2))) : 0)); pupil4.rotation.y = Math.PI; poseWalk(pupil4, t * 4 + 1, 0.5);
  BAG4.position.set(CX - 0.35, 1.2, z + 0.2);
  tJourney.position.set(CX, 2.55, z - 1.6); tPupil.position.set(CX, 2.55, z - 1.6);
  tJourney.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJourney.visible = false; tPupil.userData.pop((t - 4.2) / 0.35);
  look(CX + 0.6, 2.0, z + 3.4, CX, 1.3, z - 1.0, 60);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2023年からの日本のアニメ。原作は、マンガ大賞の漫画。第2期は、2026年1月から放送
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#0a0810');
  t2023.userData.pop((t - 0.4) / 0.35); if (t > 2.8) t2023.visible = false;
  tAward.userData.pop((t - 3.0) / 0.35); if (t > 4.2) tAward.visible = false;
  t2nd.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.8, 3.0, u), lerp(5.6, 4.8, u), TX, 2.6, -3.4, 58);
  return qs;
}
function shotDawn(t) { // 6段目 42〜49（決め手）：勇者たちの冒険の、その後を描く物語。タイトルは、漢字2文字と主人公の名前
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.9; S.darken(0.2, '#2a1c20');
  elf6.userData.arms[1].rotation.x = t > 3.5 ? -1.6 : 0; pupil6.userData.head.rotation.y = -0.3;
  SPARK6.forEach((s, i) => { s.visible = t > 3.5; const a = t * 2 + i * 0.52; s.position.set(DX - 0.5 + 0.2 + Math.cos(a) * 0.3, 1.7 + Math.sin(a * 1.3) * 0.25 + (i % 3) * 0.1, -1.4 + Math.sin(a) * 0.3); });
  tAfter.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tAfter.visible = false; tName.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.4, 0.2, u), lerp(1.7, 1.9, u), lerp(2.6, 2.0, u), DX, 1.5, -4.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（夕方の丘に戻る）
  shotHill(6.0 + t, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.85, 0.55, d); S.darken(0.35 + 0.2 * d, '#1a1020');
  const k = ease(t / 7);
  look(BX - 1.2, 2.2, lerp(0.6, 0.0, k), BX, 1.5, -5.0, 60);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotVictory(t, 0) },
  { a: 9, b: 17, f: shotFifty },
  { a: 17, b: 25, f: (t) => shotHill(t, 0) },
  { a: 25, b: 33, f: shotRoad },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotDawn },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '魔王を倒し、世界を<br>救った4人の仲間。'],
  [5.6, 9.0, '10年の冒険が、<br>いま終わる。'],
  [9.2, 13.2, '主人公は、千年以上<br>生きる魔法使い。'],
  [13.2, 17.0, '50年後、仲間たちは<br>年老いていた。'],
  [17.2, 21.0, '仲間を見送って、<br>初めて気づく。'],
  [21.0, 25.0, 'もっと、人を<br>知ればよかった。'],
  [25.2, 29.0, '人を知るための、<br>新しい旅へ。'],
  [29.0, 33.0, '若い弟子と、<br>ふたりで歩く。'],
  [33.2, 37.4, '2023年からの日本のアニメ。<br>原作はマンガ大賞の漫画。'],
  [37.4, 41.8, '第2期は、<br>2026年1月から放送。'],
  [42.2, 45.4, '勇者たちの冒険の、<br>その後を描く物語。'],
  [45.4, 49.0, 'タイトルは、漢字2文字と<br>主人公の名前。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>葬送のフリーレン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q084', v2: true, answer: '葬送のフリーレン',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'emotional', seed: 8484,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '葬送': 'そうそう', '魔王': 'まおう', '倒し': 'たおし', '世界': 'せかい', '救った': 'すくった', '4人': 'よにん', '仲間': 'なかま', '10年': 'じゅうねん', '冒険': 'ぼうけん', '終わる': 'おわる', '主人公': 'しゅじんこう', '千年以上': 'せんねんいじょう', '生きる': 'いきる', '魔法使い': 'まほうつかい', '50年後': 'ごじゅうねんご', '年老いて': 'としおいて', '見送って': 'みおくって', '初めて': 'はじめて', '気づく': 'きづく', '人を': 'ひとを', '知れば': 'しれば', '知る': 'しる', '新しい': 'あたらしい', '旅': 'たび', '若い': 'わかい', '弟子': 'でし', '歩く': 'あるく', '2023年': 'にせんにじゅうさんねん', '日本': 'にほん', '原作': 'げんさく', 'マンガ大賞': 'マンガたいしょう', '漫画': 'まんが', '第2期': 'だいにき', '2026年1月': 'にせんにじゅうろくねんいちがつ', '放送': 'ほうそう', '勇者': 'ゆうしゃ', '描く': 'えがく', '物語': 'ものがたり', '漢字2文字': 'かんじにもじ', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この作品のタイトル、わかる？\n魔王を倒し、世界を救った4人の仲間。10年の冒険が、いま終わる。主人公は、千年以上生きる魔法使い。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Hulu', 'アニメ好き', 'ファンタジー'],
  },
});
applyQuizCards({ answer: '葬送の<br>フリーレン', info: 'Netflix・Hulu｜日本のアニメ', answerSize: 124 });
