import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #079 レ・ミゼラブル（映画・イギリス・2012年・158分。U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/les-miserables で2026/11/12確認（Filmarks の動画配信欄も U-NEXT 見放題）。
//   Filmarks 4.1・レビュー228,757件 filmarks.com/movies/52973）
// 確かめた事実（Filmarks・JustWatch の作品紹介、ja.wikipedia.org/wiki/レ・ミゼラブル_(2012年の映画)・ja.wikipedia.org/wiki/レ・ミゼラブル。2026/11/12）：
//   ・19世紀のフランス。パンを盗んだ罪で19年間服役した男は、仮釈放されたものの世間の風は冷たく、再び盗みを働いてしまう（JustWatch・Filmarks）
//   ・その罪を見逃してくれた司教の真心に触れて更生を誓う。名前を改め、善行を積み、人望を集める市長の座にまで上り詰める（JustWatch）
//   ・昔の彼を知る警部が執拗にその後をつきまとう（JustWatch）
//   ・2012年公開のイギリス・アメリカ合作のミュージカル映画。ほぼ全編を歌唱パートが占める。
//     日本で累計興収55億円を突破し、日本で公開されたミュージカル映画として歴代1位の記録となった（Wikipedia）
//   ・原題 Les Misérables は「悲惨な人々」「哀れな人々」を意味する（Wikipedia の原作小説の項）
// 構成（ヒント6段）：1 パン1つを盗んだ罪で19年、外に出ても世間は冷たい → 2 また盗みを働くが見逃され、生まれ変わると誓う
//   → 3 石畳の古い街、名前を変えた男は市長に → 4 昔の男を知る警部が執拗に後を追う
//   → 5 2012年のイギリス映画・セリフのほとんどが歌、日本でミュージカル映画の大ヒット記録 → 6 決め手：19世紀のフランス・タイトルの意味は 哀れな人々
// 人物名は出さない。俳優の顔・ポスター（少女の絵）・ロゴ・衣装の再現・有名な場面（バリケードに旗を立てる場面など）の構図は使わない。
// 歌詞・曲は使わない。人は汎用の3D。結末（主人公たちのその後）は言わない

const S = quizStage({ bg: '#8a96a8', floor: '#6a6458', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(7979);

const MAN = { skin: '#e8b98f', hair: '#5a4a3a', shirt: '#7a7468', pants: '#5a5448' };
const MAYOR = { skin: '#e8b98f', hair: '#6a6a6a', shirt: '#2a3046', pants: '#2a3046', tie: true };
const BISHOP = { skin: '#f1c9a5', hair: '#d8d8d8', shirt: '#4a2a3a', pants: '#4a2a3a', long: false, skirt: true };
const COP = { skin: '#f1c9a5', hair: '#14161c', shirt: '#14161c', pants: '#14161c' };
const TOWN = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#d9a57c'][i % 3], hair: ['#4a3426', '#1d1a19', '#9a9a9a', '#6b4a33'][i % 4], shirt: ['#7a6a55', '#5a6a7a', '#8a5a4a', '#6a7a5a'][i % 4], pants: '#4a4438', long: i % 2 === 1, skirt: i % 2 === 1 });

function hat() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), mat('#0c0c10')); g.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.3, 16), mat('#0c0c10')); c.position.y = 0.16; g.add(c); return g; }

// ---------- 1段目. 石の壁の鉄の門（x=0）。雨の中、外へ出てくる男 ----------
{ const gr = box(20, 0.04, 16, mat('#5a5a58')); gr.position.set(0, 0.02, -3); qs.add(gr);
  const wl = box(20, 6, 1.0, mat('#7a766c')); wl.position.set(0, 3, -6); qs.add(wl);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 14; c++) { const st = box(1.3, 0.7, 0.05, mat(['#8a867c', '#6e6a62', '#7e7a70'][(r + c) % 3])); st.position.set(-9 + c * 1.4 + (r % 2) * 0.7, 0.4 + r * 0.74, -5.47); qs.add(st); }
  const arch = box(3.2, 4.2, 0.2, mat('#14161c')); arch.position.set(0, 2.1, -5.4); qs.add(arch); }
const GATE = new THREE.Group(); for (let i = 0; i < 7; i++) { const b = box(0.08, 4.0, 0.08, mat('#3a3a40')); b.position.set(-1.35 + i * 0.45, 2.0, 0); GATE.add(b); } { const h = box(3.0, 0.1, 0.1, mat('#3a3a40')); h.position.y = 3.2; GATE.add(h); const h2 = box(3.0, 0.1, 0.1, mat('#3a3a40')); h2.position.y = 1.0; GATE.add(h2); }
GATE.position.set(0, 0, -4.7); qs.add(GATE);
const man1 = makePerson(MAN); man1.position.set(0, 0, -6); qs.add(man1);
const BAG1 = box(0.36, 0.42, 0.22, mat('#8a7a5a')); qs.add(BAG1);
const BREAD = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 6, 10), mat('#c8904a')); BREAD.rotation.z = Math.PI / 2; qs.add(BREAD);
const RAIN = []; for (let i = 0; i < 60; i++) { const d = box(0.012, 0.3, 0.012, new THREE.MeshBasicMaterial({ color: '#c8d4e4', transparent: true, opacity: 0.55 })); d.userData.x = -4 + R() * 8; d.userData.z = -5 + R() * 6; d.userData.o = R(); qs.add(d); RAIN.push(d); }
const t19 = tag('パン1つで、19年', { size: 62, w: 560, bg: '#14161c', sx: 1.9 }); t19.position.set(0, 3.1, -2.6); qs.add(t19);
const tCold = tag('世間は、冷たい', { size: 64, w: 500, bg: '#3a5a8a', sx: 1.8 }); tCold.position.set(0, 3.1, -2.6); qs.add(tCold);

// ---------- 2段目. ろうそくの灯る部屋（x=40）。袋を抱えた男と、それを見逃す老人 ----------
const AX = 40;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#c8b898')); wl.position.set(AX, 2.5, -4); qs.add(wl);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#2a3a5a' })); win.position.set(AX, 3.0, -3.88); qs.add(win);
  const wb = box(1.6, 1.6, 0.05, new THREE.MeshBasicMaterial({ color: '#2a3a5a' })); wb.position.set(AX, 2.2, -3.89); qs.add(wb);
  const tb = box(2.0, 0.08, 0.8, mat('#6a4a2a')); tb.position.set(AX - 1.8, 0.8, -2.6); qs.add(tb); const tl = box(1.8, 0.78, 0.7, mat('#5a3a20')); tl.position.set(AX - 1.8, 0.4, -2.6); qs.add(tl); }
const FLAMES = []; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), mat('#f4f0e4')); c.position.set(AX - 2.4 + i * 0.4, 1.0, -2.6); qs.add(c); const f = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), new THREE.MeshBasicMaterial({ color: '#ffc850' })); f.position.set(AX - 2.4 + i * 0.4, 1.22, -2.6); qs.add(f); FLAMES.push(f); }
const CANDLE = new THREE.PointLight(0xffb060, 0, 8, 1.6); CANDLE.position.set(AX - 1.8, 1.6, -2.2); qs.add(CANDLE);
const man2 = makePerson(MAN); man2.position.set(AX + 0.5, 0, -1.6); man2.rotation.y = -0.5; qs.add(man2);
const SACK = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat('#8a7a5a')); SACK.scale.y = 1.2; qs.add(SACK);
const bishop = makePerson(BISHOP); bishop.position.set(AX - 0.6, 0, -2.0); bishop.rotation.y = 0.6; qs.add(bishop);
const GLOW2 = []; for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshBasicMaterial({ color: '#ffe8a0' })); qs.add(s); GLOW2.push(s); }
const tAgain = tag('また、盗んでしまう', { size: 60, w: 580, bg: '#14161c', sx: 1.9 }); tAgain.position.set(AX, 2.75, -1.8); qs.add(tAgain);
const tForgive = tag('罪を、見逃した人', { size: 60, w: 560, bg: '#c8902a', sx: 1.9 }); tForgive.position.set(AX, 2.75, -1.8); qs.add(tForgive);

// ---------- 3段目. 石畳の街の広場（x=80）。立派な服の男を、人々が拍手で迎える ----------
const BX = 80;
{ const st = new THREE.Mesh(new THREE.PlaneGeometry(16, 20), new THREE.MeshStandardMaterial({ map: canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#7a7468'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 14) for (let x = (y / 14) % 2 * 9; x < w; x += 18) { g.fillStyle = ['#8a8478', '#7e786c', '#948e82'][(x + y) % 3]; g.fillRect(x + 1, y + 1, 16, 12); } }) })); st.rotation.x = -Math.PI / 2; st.position.set(BX, 0.03, -4); qs.add(st);
  const hall = box(8, 5, 2, mat('#d8ccb0')); hall.position.set(BX, 2.5, -9); qs.add(hall);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.6, 4), mat('#5a6070')); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.4; rf.position.set(BX, 5.8, -9); qs.add(rf);
  for (let i = 0; i < 5; i++) { const c = box(0.4, 3.6, 0.4, mat('#efe6d0')); c.position.set(BX - 3 + i * 1.5, 1.8, -7.9); qs.add(c); }
  const clk = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#f4f0e4' })); clk.position.set(BX, 4.4, -7.98); qs.add(clk);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const b = box(3, 4 + i % 2, 3, mat(['#c8b898', '#b8a888', '#d0c0a0'][i])); b.position.set(BX + s * 6.5, 2.2, -2 - i * 3.2); qs.add(b); } }
const STEP = box(3, 0.5, 1.6, mat('#bab09a')); STEP.position.set(BX, 0.25, -6.6); qs.add(STEP);
const mayor = makePerson(MAYOR); mayor.position.set(BX, 0.5, -6.6); qs.add(mayor);
const CROWD3 = []; for (let i = 0; i < 8; i++) { const p = makePerson(TOWN(i)); const a = -1.0 + i * 0.28; p.position.set(BX + Math.sin(a) * 2.6, 0, -5.6 + Math.cos(a) * 2.2); p.rotation.y = a + Math.PI; qs.add(p); CROWD3.push(p); }
const tNewName = tag('名前を変えた男', { size: 64, w: 520, bg: '#14161c', sx: 1.9 }); tNewName.position.set(BX, 3.1, -6.4); qs.add(tNewName);
const tMayor = tag('街の市長に', { size: 70, w: 420, bg: '#c8902a', sx: 1.7 }); tMayor.position.set(BX, 3.1, -6.4); qs.add(tMayor);

// ---------- 4段目. 夜の路地（x=120）。前を急ぐ男、後ろから帽子の警部 ----------
const CX = 120;
{ const st = box(4, 0.04, 30, mat('#4a4844')); st.position.set(CX, 0.02, -10); qs.add(st);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const b = box(2.4, 5 + (i % 2), 4.6, mat(['#5a5650', '#4e4a44', '#625e56'][i % 3])); b.position.set(CX + s * 3.2, 2.6, -2 - i * 4.8); qs.add(b);
    const w = box(0.05, 0.8, 0.6, new THREE.MeshBasicMaterial({ color: i % 3 ? '#2a2a30' : '#e8b860' })); w.position.set(CX + s * 1.98, 2.2, -2 - i * 4.8); qs.add(w); }
  for (let i = 0; i < 3; i++) { const p = box(0.08, 2.6, 0.08, mat('#24262b')); p.position.set(CX - 1.6, 1.3, -3 - i * 7); qs.add(p); const l = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.26), new THREE.MeshBasicMaterial({ color: '#ffd890' })); l.position.set(CX - 1.6, 2.7, -3 - i * 7); qs.add(l); } }
const man4 = makePerson(MAYOR); man4.position.set(CX, 0, -8); qs.add(man4);
const cop = makePerson(COP); cop.position.set(CX, 0, -6); qs.add(cop);
const HAT = hat(); HAT.position.set(CX, 2, -6); qs.add(HAT);
const tCop = tag('昔を知る警部', { size: 66, w: 460, bg: '#14161c', sx: 1.7 }); qs.add(tCop);
const tChase = tag('追う者と、逃げる者', { size: 60, w: 580, bg: '#8a1f2c', sx: 2.0 }); qs.add(tChase);

// ---------- 5段目. 劇場の舞台（x=180）。スポットライトと音符。2012年のイギリス映画、ほぼ全編が歌 ----------
const TX = 180;
{ const fl = box(14, 0.04, 12, mat('#2a1a1e')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const stg = box(8, 0.6, 3.6, mat('#6a4a30')); stg.position.set(TX, 0.3, -3.4); qs.add(stg);
  for (const s of [-1, 1]) { const cu = box(2.4, 6, 0.2, mat('#8a1f2c')); cu.position.set(TX + s * 4.2, 3, -4.6); qs.add(cu); }
  const bk = box(10, 6, 0.2, mat('#14161c')); bk.position.set(TX, 3, -5.2); qs.add(bk); }
const SINGER = makePerson(MAN); SINGER.position.set(TX, 0.6, -3.4); qs.add(SINGER);
const SPOT5 = new THREE.SpotLight(0xfff0d0, 0, 12, 0.3, 0.4, 1); SPOT5.position.set(TX, 6, -1); SPOT5.target.position.set(TX, 0.6, -3.4); qs.add(SPOT5); qs.add(SPOT5.target);
const NOTES5 = []; for (let i = 0; i < 8; i++) { const n = tag(i % 2 ? '♪' : '♫', { size: 90, w: 130, h: 130, bg: '#e6b450', color: '#14161c', sx: 0.42 }); qs.add(n); NOTES5.push(n); }
const t2012 = tag('2012年 イギリス映画', { size: 58, w: 640, bg: '#e6b450', color: '#14161c', sx: 2.4 }); t2012.position.set(TX, 4.6, -3.0); qs.add(t2012);
const tSing = tag('セリフのほとんどが、歌', { size: 54, w: 700, bg: '#8a1f2c', sx: 2.5 }); tSing.position.set(TX, 4.6, -3.0); qs.add(tSing);

// ---------- 6段目. 夕暮れの古い都の川辺（x=220）。2本の塔の聖堂と、三色の旗 ----------
const DX = 220;
{ const gr = box(40, 0.04, 40, mat('#6a6458')); gr.position.set(DX, 0.02, -10); qs.add(gr);
  const rv = box(40, 0.05, 6, mat('#3a5a7a')); rv.position.set(DX, 0.04, -9); qs.add(rv);
  const ch = new THREE.Group(); const m = mat('#c8b898');
  const nave = box(5, 5, 4, m); nave.position.y = 2.5; ch.add(nave);
  for (const s of [-1, 1]) { const tw = box(1.6, 8, 1.6, m); tw.position.set(s * 1.7, 4, 1.2); ch.add(tw); const top = box(1.7, 0.3, 1.7, mat('#a89878')); top.position.set(s * 1.7, 8.1, 1.2); ch.add(top); }
  const rose = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), mat('#5a4a6a')); rose.position.set(0, 4.6, 2.01); ch.add(rose);
  const sp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 4, 8), mat('#5a6070')); sp.position.set(0, 7, -1); ch.add(sp);
  ch.position.set(DX + 2, 0, -18); qs.add(ch);
  for (let i = 0; i < 6; i++) { const b = box(2.6, 4 + (i % 3), 3, mat(['#d8ccb0', '#c8bca0', '#e0d4b8'][i % 3])); b.position.set(DX - 9 + i * 3.2 - (i > 2 ? -3 : 0), 2.2, -15 - (i % 2) * 2); if (Math.abs(b.position.x - (DX + 2)) > 3.5) qs.add(b);
    const rf = box(2.7, 0.8, 3.1, mat('#5a6070')); rf.position.set(b.position.x, b.position.y + b.geometry.parameters.height / 2 + 0.4, b.position.z); if (Math.abs(b.position.x - (DX + 2)) > 3.5) qs.add(rf); } }
const FLAG = new THREE.Group(); { const pole = box(0.06, 2.6, 0.06, mat('#3a3028')); pole.position.y = 1.3; FLAG.add(pole); const cols = ['#2a4a9a', '#f4f4f0', '#d83a3a']; for (let i = 0; i < 3; i++) { const p = box(0.36, 0.7, 0.02, mat(cols[i])); p.position.set(0.21 + i * 0.36, 2.2, 0); FLAG.add(p); FLAG.userData['p' + i] = p; } } FLAG.position.set(DX - 1.6, 0, -3.4); qs.add(FLAG);
const man6 = makePerson(MAN); man6.position.set(DX - 0.3, 0, -2.4); man6.rotation.y = Math.PI - 0.3; qs.add(man6);
const t1800 = tag('19世紀のフランス', { size: 62, w: 560, bg: '#14161c', sx: 2.2 }); t1800.position.set(DX + 0.4, 4.6, -5); qs.add(t1800);
const tMean = tag('題名の意味は「哀れな人々」', { size: 50, w: 760, bg: '#3a5a8a', sx: 2.8 }); tMean.position.set(DX + 0.4, 4.6, -5); qs.add(tMean);

// ---------- shots ----------
const ALL = [t19, tCold, tAgain, tForgive, tNewName, tMayor, tCop, tChase, t2012, tSing, t1800, tMean];
function base() { S.reset(); ALL.forEach(x => x.visible = false); RAIN.forEach(d => d.visible = false); GLOW2.forEach(s => s.visible = false); NOTES5.forEach(n => n.visible = false); BREAD.visible = false; SACK.visible = false; BAG1.visible = false; CANDLE.intensity = 0; SPOT5.intensity = 0; }

function shotGate(t, quiz = 0) { // 1段目 0〜9：パン1つを盗んだ罪で、19年間の牢屋暮らし。やっと外に出ても、世間の風は冷たかった（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.8; S.darken(0.35, '#3a4250');
  const k = quiz ? 1 : clamp((t - 4.2) / 3.0);
  GATE.position.x = k > 0 ? -k * 2.4 : 0;
  man1.position.set(0, 0, lerp(-5.1, -2.4, ease(k))); man1.rotation.y = 0; poseWalk(man1, t * 4, k > 0 && k < 1 ? 0.6 : 0); man1.userData.head.rotation.x = 0.25;
  BAG1.visible = true; BAG1.position.set(man1.position.x + 0.42, 0.9, man1.position.z);
  if (t < 4.2 && !quiz) { BREAD.visible = true; BREAD.position.set(0.7, 2.3 + Math.sin(t * 2) * 0.08, -3.6); BREAD.rotation.y = t; man1.position.z = -5.1; }
  if (t > 4.2 || quiz) RAIN.forEach(d => { d.visible = true; const y = 6 - ((t * 1.6 + d.userData.o) % 1) * 6; d.position.set(d.userData.x, y, d.userData.z); });
  if (!quiz) { t19.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t19.visible = false; tCold.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.4, u), lerp(1.9, 1.7, u), lerp(2.6, 1.6, u), 0, 1.6, -4.4, 58);
  return qs;
}
function shotCandle(t) { // 2段目 9〜17：男はまた盗みを働く。でも、その罪は見逃された。その真心に触れて、生まれ変わると誓う
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.6, '#0a0806'); CANDLE.intensity = 6;
  FLAMES.forEach((f, i) => f.scale.y = 1 + Math.sin(t * 9 + i) * 0.2);
  SACK.visible = true; SACK.position.set(AX + 0.85, 1.0, -1.4);
  man2.userData.head.rotation.x = t > 4.2 ? 0.35 : 0; man2.userData.arms[1].rotation.x = -0.6;
  bishop.userData.arms[1].rotation.x = t > 4.2 ? -1.2 : -0.3;
  if (t > 4.6) GLOW2.forEach((s, i) => { s.visible = true; const a = i * 0.52 + t; s.position.set(AX + Math.cos(a) * 0.9, 0.6 + ((i * 0.27 + t * 0.2) % 1) * 2.0, -1.8 + Math.sin(a) * 0.6); });
  tAgain.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAgain.visible = false; tForgive.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.4, 0.2, u), lerp(1.8, 1.7, u), lerp(2.8, 2.3, u), AX, 1.4, -1.8, 58);
  return qs;
}
function shotTown(t) { // 3段目 17〜25：石畳の古い街。名前を変えた男は、やがて人望を集め、市長にまでなった
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.3;
  mayor.userData.arms[1].rotation.x = t > 4.2 ? -2.2 : 0;
  CROWD3.forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = t > 4.2 ? -1.4 + Math.sin(t * 10 + i) * 0.15 : 0); p.userData.arms[0].rotation.z = t > 4.2 ? 0.4 : 0; p.userData.arms[1].rotation.z = t > 4.2 ? -0.4 : 0; });
  tNewName.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNewName.visible = false; tMayor.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(3.6, 3.0, u), lerp(3.0, 2.7, u), lerp(-1.6, -2.4, u), BX - 0.3, 1.5, -6.0, 58);
  return qs;
}
function shotAlley(t) { // 4段目 25〜33：昔の男を知る警部が、執拗に後を追う。追う者と、逃げる者
  base(); S.aim(CX, -8); lift(0); S.hemi.intensity = 0.45; S.darken(0.75, '#06080e');
  const z = lerp(-4, -12, t / 8);
  man4.position.set(CX + 0.2, 0, z - 3.0); man4.rotation.y = Math.PI; poseWalk(man4, t * 8, 1);
  cop.position.set(CX - 0.3, 0, z); cop.rotation.y = Math.PI; poseWalk(cop, t * 7, 0.9);
  if (t > 4.2) { man4.userData.head.rotation.y = Math.sin(t * 2) * 0.6; }
  HAT.position.set(cop.position.x, cop.position.y + 2.0, cop.position.z);
  tCop.position.set(CX + 0.3, 2.75, z - 0.6); tChase.position.set(CX, 2.9, z - 1.5);
  tCop.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCop.visible = false; tChase.userData.pop((t - 4.2) / 0.35);
  look(CX + 0.8, 2.2, z + 3.2, CX, 1.3, z - 3.0, 58);
  return qs;
}
function shotStage(t) { // 5段目 33〜42：2012年のイギリス映画。セリフのほとんどが歌。日本でも、ミュージカル映画の大ヒット記録に
  base(); S.aim(TX, -3); lift(0); S.hemi.intensity = 0.45; S.darken(0.7, '#08060a'); SPOT5.intensity = 50;
  SINGER.userData.arms.forEach(a => { a.rotation.x = -1.6 + Math.sin(t * 2) * 0.2; }); SINGER.userData.arms[0].rotation.z = 0.5; SINGER.userData.arms[1].rotation.z = -0.5; SINGER.userData.head.rotation.x = -0.2;
  NOTES5.forEach((n, i) => { n.visible = true; const k = (t * 0.35 + i / 8) % 1; n.position.set(TX - 1.6 + i * 0.46, 1.8 + k * 2.2, -3.0); n.material.opacity = 1 - k; });
  t2012.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2012.visible = false; tSing.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.4, 2.6, u), lerp(4.6, 3.8, u), TX, 2.0, -3.4, 58);
  return qs;
}
function shotRiver(t) { // 6段目 42〜49（決め手）：舞台は、19世紀のフランス。タイトルの意味は、哀れな人々
  base(); S.aim(DX, -8); lift(0); S.hemi.intensity = 1.0; S.darken(0.25, '#e8a070');
  for (let i = 0; i < 3; i++) FLAG.userData['p' + i].rotation.y = Math.sin(t * 3 + i * 0.8) * 0.3;
  man6.userData.head.rotation.x = -0.15;
  t1800.userData.pop((t - 0.3) / 0.35); if (t > 3.2) t1800.visible = false; tMean.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.6, -0.2, u), lerp(1.8, 2.2, u), lerp(1.4, 0.8, u), DX + 1.4, 4.0, -18, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（門の前に戻る）
  shotGate(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.8, 0.5, d); S.darken(0.35 + 0.3 * d, '#20242c');
  const k = ease(t / 7);
  look(0.4, 1.7, lerp(1.6, 1.0, k), 0, 1.6, -4.4, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotGate(t, 0) },
  { a: 9, b: 17, f: shotCandle },
  { a: 17, b: 25, f: shotTown },
  { a: 25, b: 33, f: shotAlley },
  { a: 33, b: 42, f: shotStage },
  { a: 42, b: 49, f: shotRiver },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'パン1つを盗んだ罪で、<br>19年間の牢屋暮らし。'],
  [5.6, 9.0, 'やっと外に出ても、<br>世間の風は冷たかった。'],
  [9.2, 13.2, '男はまた盗みを働く。<br>でも、その罪は見逃された。'],
  [13.2, 17.0, 'その真心に触れて、<br>生まれ変わると誓う。'],
  [17.2, 21.0, '石畳の古い街。<br>名前を変えた男は、'],
  [21.0, 25.0, 'やがて人望を集め、<br>市長にまでなった。'],
  [25.2, 29.0, '昔の男を知る警部が、<br>しつこく後を追う。'],
  [29.0, 33.0, '追う者と、<br>逃げる者。'],
  [33.2, 37.4, '2012年のイギリス映画。<br>セリフのほとんどが歌。'],
  [37.4, 41.8, '日本でも、ミュージカル<br>映画の大ヒット記録に。'],
  [42.2, 45.4, '舞台は、<br>19世紀のフランス。'],
  [45.4, 49.0, 'タイトルの意味は、<br>「哀れな人々」。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>レ・ミゼラブル。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q079', v2: true, answer: 'レ・ミゼラブル',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 7979,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '1つ': 'ひとつ', '盗んだ': 'ぬすんだ', '罪': 'つみ', '19年間': 'じゅうきゅうねんかん', '牢屋暮らし': 'ろうやぐらし', '外': 'そと', '出て': 'でて', '世間': 'せけん', '風': 'かぜ', '冷たかった': 'つめたかった', '男': 'おとこ', '盗み': 'ぬすみ', '働く': 'はたらく', '見逃された': 'みのがされた', '真心': 'まごころ', '触れて': 'ふれて', '生まれ変わる': 'うまれかわる', '誓う': 'ちかう', '石畳': 'いしだたみ', '古い': 'ふるい', '街': 'まち', '名前': 'なまえ', '変えた': 'かえた', '人望': 'じんぼう', '集め': 'あつめ', '市長': 'しちょう', '昔': 'むかし', '知る': 'しる', '警部': 'けいぶ', '後': 'あと', '追う': 'おう', '者': 'もの', '逃げる': 'にげる', '2012年': 'にせんじゅうにねん', 'イギリス映画': 'イギリスえいが', 'セリフ': 'せりふ', '歌': 'うた', '日本': 'にほん', '大ヒット': 'だいヒット', '記録': 'きろく', '舞台': 'ぶたい', '19世紀': 'じゅうきゅうせいき', '意味': 'いみ', '哀れな': 'あわれな', '人々': 'ひとびと', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nパン1つを盗んだ罪で、19年間の牢屋暮らし。やっと外に出ても、世間の風は冷たかった。男はまた盗みを働く。でも、その罪は見逃された。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', '映画好き', 'ミュージカル映画', '名作映画'],
  },
});
applyQuizCards({ answer: 'レ・ミゼラブル', info: 'U-NEXT｜映画・158分', answerSize: 112 });
