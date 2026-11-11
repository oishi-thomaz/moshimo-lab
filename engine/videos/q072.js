import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #072 レオン（映画・フランス・1994年・完全版133分。U-NEXT・Netflix で見放題（Prime Video も）、
//   JustWatch 日本版 justwatch.com/jp/映画/reon で2026/11/11確認（Filmarks の動画配信欄も U-NEXT・Netflix 見放題）。
//   Filmarks（完全版）4.3・レビュー354,089件 filmarks.com/movies/33501）
// 確かめた事実（Filmarks・JustWatch の作品紹介、ja.wikipedia.org/wiki/レオン_(映画)。2026/11/11）：
//   ・家族を惨殺された12歳の少女が、隣の部屋に住む殺し屋に助けを求める。そこから二人の奇妙な共同生活が始まる（Filmarks）
//   ・弟の仇を討ちたいという少女に男は仕方なく殺しのテクニックを教え、少女は読み書きのできない男に文字を教える（Filmarks）
//   ・男は決まった時間に決まったことをするストイックな毎日。観葉植物を友達のように大切にし、好物は牛乳（Wikipedia）
//   ・舞台はニューヨーク。大都会の片隅で出会った孤独なふたり（JustWatch）。リュック・ベッソンが初めてアメリカで製作（JustWatch）
//   ・製作国フランス、1994年（Wikipedia）
// 構成（ヒント6段）：1 12歳の少女が隣の部屋のドアをたたく、家族を襲われ助けを求めて → 2 隣の男は決まった毎日、好物は牛乳
//   → 3 大都会の片隅、孤独なふたりの奇妙な共同生活 → 4 少女の願いは弟の仇、男は仕事を教え少女は文字を教える
//   → 5 1994年のフランス映画、舞台はニューヨーク → 6 決め手：男の正体は凄腕の殺し屋、友達は鉢植えの観葉植物
// 暴力の場面・銃は映さない。人物名は出さない。俳優の顔・ポスター・人物の服装や小物（帽子・丸いサングラス・首飾り）・有名な場面の構図は使わない。人は汎用の3D。結末は言わない

const S = quizStage({ bg: '#2a2a30', floor: '#4a4038', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(7272);

const GIRL = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#c86a3a', pants: '#3a3a5a', scale: 0.78 };
const MAN = { skin: '#e8c8a8', hair: '#3a3028', shirt: '#4a4a40', pants: '#2b2b30' };

function plant() { const g = new THREE.Group(); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 16), mat('#c87a4a')); pot.position.y = 0.15; g.add(pot); for (let i = 0; i < 9; i++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.55, 6), mat(i % 2 ? '#3f8f4b' : '#4fa35a')); const a = i * 0.7; lf.position.set(Math.cos(a) * 0.08, 0.5 + (i % 3) * 0.06, Math.sin(a) * 0.08); lf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(lf); } return g; }

// ---------- 1段目. 古いアパートの廊下（x=0）。少女が隣の部屋のドアをたたく ----------
{ const fl = box(4, 0.04, 20, mat('#6a5a48')); fl.position.set(0, 0.02, -6); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.2, 4, 20, mat('#8a7a62')); wl.position.set(s * 2, 2, -6); qs.add(wl); }
  const ceil = box(4, 0.1, 20, mat('#5a4e40')); ceil.position.set(0, 4, -6); qs.add(ceil);
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); lp.position.set(0, 3.85, -1 - i * 4); qs.add(lp); }
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const d = box(0.08, 2.3, 1.0, mat('#4a3020')); d.position.set(s * 1.9, 1.15, -2.6 - i * 4); qs.add(d); const nb = box(0.04, 0.12, 0.2, mat('#d8c070')); nb.position.set(s * 1.85, 2.0, -2.6 - i * 4); qs.add(nb); } }
const DOOR1 = box(0.1, 2.3, 1.0, mat('#3a2418')); DOOR1.position.set(1.88, 1.15, -2.6); qs.add(DOOR1);
const girl1 = makePerson(GIRL); girl1.position.set(1.15, 0, -2.6); girl1.rotation.y = Math.PI / 2; qs.add(girl1);
const KNOCK = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false })); r.rotation.y = Math.PI / 2; qs.add(r); KNOCK.push(r); }
const tDoor = tag('隣の部屋のドア', { size: 62, w: 540, bg: '#14161c', sx: 1.7 }); tDoor.position.set(0.9, 2.0, -3.2); qs.add(tDoor);
const tHelp = tag('助けて', { size: 84, w: 340, bg: '#c43a3a', sx: 1.2 }); tHelp.position.set(0.9, 2.0, -3.2); qs.add(tHelp);

// ---------- 2段目. 男の部屋の台所（x=40）。牛乳、腕立て。決まった毎日 ----------
const AX = 40;
{ const fl = box(12, 0.04, 10, mat('#7a6650')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#b8a888')); wl.position.set(AX, 2.5, -3.6); qs.add(wl);
  const ct = box(3.2, 0.9, 0.8, mat('#6a5a48')); ct.position.set(AX - 2.4, 0.45, -3.0); qs.add(ct);
  const fr = box(1.0, 2.0, 0.8, mat('#e8e4dc')); fr.position.set(AX - 4.4, 1.0, -3.0); qs.add(fr);
  const clk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 24), mat('#f4f0e4')); clk.rotation.x = Math.PI / 2; clk.position.set(AX + 1.6, 3.4, -3.47); qs.add(clk);
  const hd = box(0.03, 0.22, 0.02, mat('#14161c')); hd.position.set(AX + 1.6, 3.48, -3.43); qs.add(hd); const hd2 = box(0.16, 0.03, 0.02, mat('#14161c')); hd2.position.set(AX + 1.66, 3.4, -3.43); qs.add(hd2); }
const MILK = new THREE.Group(); { const c = box(0.18, 0.36, 0.18, mat('#f4f4f0')); c.position.y = 0.18; MILK.add(c); const tp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.12, 4), mat('#f4f4f0')); tp.rotation.y = Math.PI / 4; tp.position.y = 0.42; MILK.add(tp); const bd = box(0.185, 0.1, 0.185, mat('#3a7ad8')); bd.position.y = 0.16; MILK.add(bd); } qs.add(MILK);
const MILK2 = MILK.clone(); qs.add(MILK2);
const man2 = makePerson(MAN); man2.position.set(AX - 1.8, 0, -2.2); qs.add(man2);
const tDaily = tag('決まった毎日', { size: 68, w: 460, bg: '#14161c', sx: 1.2 }); tDaily.position.set(AX - 1.3, 1.45, -0.9); qs.add(tDaily);
const tMilk = tag('好物は、牛乳', { size: 66, w: 460, bg: '#3a7ad8', sx: 1.6 }); tMilk.position.set(AX - 1.0, 2.6, -2.0); qs.add(tMilk);

// ---------- 3段目. 夕暮れの大都会の路地（x=80）。れんがのビルの谷間を、ふたりが歩く ----------
const BX = 80;
{ const st = box(10, 0.04, 30, mat('#3a3a40')); st.position.set(BX, 0.02, -8); qs.add(st);
  const sw = box(10, 0.1, 30, mat('#5a5650')); sw.position.set(BX - 3.5, 0.05, -8); sw.scale.x = 0.3; qs.add(sw);
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const h = 9 + (i * 5 + (s > 0 ? 3 : 0)) % 8; const b = box(4, h, 4.2, mat(['#7a4a3a', '#8a5a44', '#6a4234'][(i + (s > 0 ? 1 : 0)) % 3])); b.position.set(BX + s * 5.2, h / 2, -2 - i * 4.4); qs.add(b);
    for (let f = 0; f < Math.floor(h / 1.6); f++) { const w = box(0.05, 0.7, 0.6, new THREE.MeshBasicMaterial({ color: (f + i) % 3 ? '#2a2420' : '#ffcf7a' })); w.position.set(BX + s * 3.18, 1.2 + f * 1.6, -2 - i * 4.4 + (f % 2 ? 0.8 : -0.8)); qs.add(w); }
    const fe = box(0.6, 0.06, 1.4, mat('#24262b')); fe.position.set(BX + s * 2.9, 3.4 + (i % 2) * 1.6, -2 - i * 4.4); qs.add(fe); } }
const man3 = makePerson(MAN); man3.position.set(BX + 0.4, 0, -1); qs.add(man3);
const girl3 = makePerson(GIRL); girl3.position.set(BX - 0.35, 0, -0.8); qs.add(girl3);
const tCity = tag('大都会の片隅', { size: 68, w: 460, bg: '#14161c', sx: 1.6 }); tCity.position.set(BX, 2.7, -3.0); qs.add(tCity);
const tLonely = tag('孤独なふたり', { size: 68, w: 460, bg: '#8a5a44', sx: 1.6 }); tLonely.position.set(BX, 2.7, -3.0); qs.add(tLonely);

// ---------- 4段目. 部屋のテーブル（x=120）。少女が紙に文字を書いて見せる ----------
const CX = 120;
{ const fl = box(12, 0.04, 10, mat('#6a5a48')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#9a8a70')); wl.position.set(CX, 2.5, -3.6); qs.add(wl);
  const tb = box(1.8, 0.07, 1.0, mat('#5a4030')); tb.position.set(CX, 0.75, -1.6); qs.add(tb);
  for (const x of [-0.8, 0.8]) for (const z of [-0.4, 0.4]) { const lg = box(0.07, 0.75, 0.07, mat('#3a2a20')); lg.position.set(CX + x, 0.37, -1.6 + z); qs.add(lg); }
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 14, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe0a0', side: THREE.DoubleSide })); lamp.position.set(CX, 2.6, -1.6); qs.add(lamp);
  const ph = box(0.3, 0.4, 0.03, mat('#e8e0c8')); ph.position.set(CX - 2.4, 1.8, -3.48); qs.add(ph); const ph2 = box(0.22, 0.3, 0.02, mat('#8aa0b8')); ph2.position.set(CX - 2.4, 1.8, -3.46); qs.add(ph2); }
const girl4 = makePerson(GIRL); girl4.position.set(CX - 0.5, 0.18, -0.9); girl4.rotation.y = Math.PI - 0.3; qs.add(girl4);
const man4 = makePerson(MAN); man4.position.set(CX + 0.4, 0.0, -2.4); man4.rotation.y = -0.2; qs.add(man4);
const PAPER4 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(280, 200, (g, w, h) => { g.fillStyle = '#f8f4e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a40'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.fillText('A B C', w / 2, 90); g.font = '700 40px sans-serif'; g.fillText('a b c', w / 2, 160); }), side: THREE.DoubleSide })); qs.add(PAPER4);
const tBro = tag('弟の仇を討ちたい', { size: 62, w: 560, bg: '#14161c', sx: 1.9 }); tBro.position.set(CX - 0.1, 2.35, -1.6); qs.add(tBro);
const tABC = tag('少女は、文字を教える', { size: 58, w: 640, bg: '#c86a3a', sx: 1.8 }); tABC.position.set(CX - 0.3, 2.35, -1.6); qs.add(tABC);

// ---------- 5段目. 映画館のスクリーン（x=180）。1994年のフランス映画、舞台はニューヨーク ----------
const TX = 180;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: '#1a1420' })); bg.position.set(TX, 4, -4); qs.add(bg);
  for (const s of [-1, 1]) { const cu = box(1.2, 5, 0.2, mat('#2a3a7a')); cu.position.set(TX + s * 3.4, 2.9, -3.7); qs.add(cu); }
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const st = box(0.6, 0.7, 0.6, mat('#2a3a6a')); st.position.set(TX - 2.7 + i * 0.9, 0.35, 0.6 + r * 1.1); qs.add(st); } }
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), new THREE.MeshBasicMaterial({ map: canvasTex(560, 320, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f4a860'); gr.addColorStop(1, '#6a3a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1a2a'; for (let i = 0; i < 22; i++) { const bw = 18 + (i * 13) % 22, bh = 60 + (i * 47) % 180; g.fillRect(i * 26, h - bh, bw, bh); } }) })); SCREEN.position.set(TX, 2.9, -3.6); qs.add(SCREEN);
const t1994 = tag('1994年 フランス映画', { size: 62, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.2 }); t1994.position.set(TX, 5.0, -2.8); qs.add(t1994);
const tNY = tag('舞台は、ニューヨーク', { size: 62, w: 660, bg: '#3a7ad8', sx: 3.2 }); tNY.position.set(TX, 5.0, -2.8); qs.add(tNY);

// ---------- 6段目. 窓辺（x=220）。黒い影の男と、朝日を浴びる鉢植え ----------
const DX = 220;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#7a6a58')); wl.position.set(DX, 2.5, -3.6); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), new THREE.MeshBasicMaterial({ color: '#ffe8b8' })); win.position.set(DX + 0.6, 2.2, -3.48); qs.add(win);
  for (const x of [-0.4, 0.6, 1.6]) { const fr = box(0.06, 2.2, 0.06, mat('#3a2a20')); fr.position.set(DX + x, 2.2, -3.44); qs.add(fr); }
  const sill = box(2.4, 0.08, 0.4, mat('#3a2a20')); sill.position.set(DX + 0.6, 1.08, -3.3); qs.add(sill); }
const PLANT = plant(); PLANT.position.set(DX + 0.6, 1.12, -3.3); qs.add(PLANT);
const man6 = makePerson({ skin: '#1a1a1e', hair: '#0e0e10', shirt: '#14141a', pants: '#0e0e12' }); man6.position.set(DX - 1.0, 0, -1.8); man6.rotation.y = 0.5; qs.add(man6);
const tPro = tag('正体は、凄腕の殺し屋', { size: 56, w: 680, bg: '#14161c', sx: 1.7 }); tPro.position.set(DX - 0.3, 2.9, -2.2); qs.add(tPro);
const tPlant = tag('友達は、鉢植え', { size: 66, w: 500, bg: '#3f8f4b', sx: 1.8 }); tPlant.position.set(DX, 3.75, -2.4); qs.add(tPlant);

// ---------- shots ----------
const ALL = [tDoor, tHelp, tDaily, tMilk, tCity, tLonely, tBro, tABC, t1994, tNY, tPro, tPlant];
function base() { S.reset(); ALL.forEach(x => x.visible = false); KNOCK.forEach(k => k.visible = false); MILK.visible = false; MILK2.visible = false; PAPER4.visible = false; }

function shotHall(t, quiz = 0) { // 1段目 0〜9：12歳の少女が隣の部屋のドアをたたく。家族を襲われ、助けを求めて（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.75; S.key.intensity = 0.6; S.darken(0.3);
  S.spot.color.set(0xffd890); S.spot.position.set(0.6, 3.8, -2.6); S.spot.target.position.set(1.2, 0, -2.6); S.spot.intensity = 30;
  const kn = !quiz && Math.floor(t * 2.2) % 2 === 0;
  girl1.userData.arms[1].rotation.x = quiz ? -0.3 : (kn ? -1.9 : -1.5); girl1.userData.arms[0].rotation.x = -0.2;
  girl1.userData.head.rotation.y = quiz ? 0.6 : Math.sin(t * 1.6) * 0.3;
  if (!quiz) KNOCK.forEach((r, i) => { const k = ((t * 1.1 + i * 0.33) % 1); r.visible = true; r.position.set(1.8, 1.45, -2.6); r.scale.setScalar(1 + k * 2.2); r.material.opacity = 0.8 * (1 - k); });
  if (!quiz) { tDoor.userData.pop(1); if (t > 4.4) tDoor.visible = false; tHelp.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-1.0, -0.8, u), lerp(1.7, 1.6, u), lerp(1.4, 0.6, u), 1.4, 1.2, -3.0, 60);
  return qs;
}
function shotDaily(t) { // 2段目 9〜17：隣に住む男は毎日決まったことをくり返す。好物は牛乳、ストイックな一人暮らし
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.0; S.darken(0.15, '#a08060');
  if (t < 4.2) { // 腕立て
    const k = (Math.sin(t * 5) + 1) / 2; man2.rotation.set(Math.PI / 2 - 0.2 * k - 0.05, Math.PI / 2, 0, 'YXZ'); man2.position.set(AX - 2.3, 0.2 + k * 0.2, -0.6);
    man2.userData.arms.forEach(a => a.rotation.x = -Math.PI / 2 + 0.2 * k);
  } else { man2.rotation.set(0, Math.PI / 6, 0); man2.position.set(AX - 1.9, 0, -2.2); man2.userData.arms.forEach(a => a.rotation.x = 0); man2.userData.arms[1].rotation.x = -1.6;
    MILK.visible = true; MILK.position.set(AX - 1.55, 1.05, -1.85); MILK2.visible = true; MILK2.position.set(AX - 2.6, 0.92, -2.9); }
  tDaily.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDaily.visible = false; tMilk.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(AX - 0.2, 1.7, lerp(3.4, 3.0, u), AX - 1.3, 0.5, -0.6, 58); else look(AX + lerp(1.2, 1.0, u), lerp(2.0, 1.9, u), lerp(2.8, 2.3, u), AX - 1.2, 1.0, -1.8, 58);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：大都会の片隅で出会った孤独なふたり。奇妙な共同生活が始まった
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.8; S.darken(0.15, '#c87a4a'); S.scene.background.set('#d8905a'); S.scene.fog.color.set('#d8905a');
  const z = lerp(-1.0, -4.0, clamp(t / 8));
  man3.position.set(BX + 0.4, 0, z); man3.rotation.y = Math.PI; poseWalk(man3, t * 5, 0.7);
  girl3.position.set(BX - 0.35, 0, z + 0.2); girl3.rotation.y = Math.PI; poseWalk(girl3, t * 6.5, 0.8);
  tCity.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCity.visible = false; tLonely.userData.pop((t - 4.2) / 0.35);
  tCity.position.z = z - 0.8; tLonely.position.z = z - 0.8;
  look(BX + 0.3, 1.5, z + 3.4, BX, 2.0, z - 4, 60);
  return qs;
}
function shotLesson(t) { // 4段目 25〜33：少女の願いは幼い弟の仇を討つこと。男は「仕事」を教え、少女は文字を教える
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#2a2018');
  S.spot.color.set(0xffd890); S.spot.position.set(CX, 2.6, -1.6); S.spot.target.position.set(CX, 0, -1.6); S.spot.intensity = 22;
  if (t > 4.2) { PAPER4.visible = true; const k = ease(clamp((t - 4.4) / 0.6)); PAPER4.position.set(CX - 0.2, lerp(0.8, 1.5, k), -1.3); PAPER4.rotation.set(0, Math.PI - 0.2 - 0.3, 0); PAPER4.rotation.y = lerp(0, 0.35, k); girl4.userData.arms.forEach(a => a.rotation.x = -1.5 * k);
    man4.userData.head.rotation.x = 0.1; }
  else { girl4.userData.head.rotation.x = 0.3; man4.userData.arms[0].rotation.x = -0.5; }
  tBro.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBro.visible = false; tABC.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(2.0, 1.8, u), lerp(2.1, 2.0, u), lerp(1.8, 1.4, u), CX - 0.2, 1.2, -1.6, 58);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1994年のフランス映画。舞台はニューヨーク
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#06070a');
  t1994.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t1994.visible = false; tNY.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.6, 2.8, u), lerp(6.4, 5.6, u), TX, 3.2, -3.6, 58);
  return qs;
}
function shotPlant(t) { // 6段目 42〜49（決め手）：男の正体は凄腕の殺し屋。友達は、いつも抱える鉢植えの観葉植物
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.5, '#0a0806');
  S.spot.color.set(0xffe8b0); S.spot.position.set(DX + 0.6, 3.4, -2.2); S.spot.target.position.set(DX + 0.6, 1.1, -3.3); S.spot.intensity = t > 3.3 ? 40 : 6;
  PLANT.rotation.y = t * 0.3; PLANT.scale.setScalar(t > 3.3 ? 1 + ease(clamp((t - 3.3) / 0.5)) * 0.25 : 1);
  tPro.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tPro.visible = false; tPlant.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  if (t < 3.3) look(DX + 0.6, 1.8, lerp(2.6, 2.3, u), DX - 0.6, 1.4, -2.0, 58);
  else look(DX + 0.5, 1.6, lerp(-1.2, -1.6, u), DX + 0.6, 1.4, -3.3, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（廊下に戻る）
  shotHall(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.75, 0.45, d); S.darken(0.3 + 0.3 * d);
  const k = ease(t / 7);
  look(lerp(-0.8, -0.7, k), lerp(1.6, 1.5, k), lerp(0.6, 0.0, k), 1.4, 1.2, -3.0, 60);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotHall(t, 0) },
  { a: 9, b: 17, f: shotDaily },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotLesson },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotPlant },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '12歳の少女が、<br>隣の部屋のドアをたたく。'],
  [5.6, 9.0, '家族を襲われ、<br>助けを求めて。'],
  [9.2, 13.2, '隣に住む男は、毎日<br>決まったことをくり返す。'],
  [13.2, 17.0, '好物は、牛乳。<br>ストイックな一人暮らし。'],
  [17.2, 21.0, '大都会の片隅で、<br>出会った孤独なふたり。'],
  [21.0, 25.0, '奇妙な共同生活が、<br>始まった。'],
  [25.2, 29.0, '少女の願いは、<br>幼い弟の仇を討つこと。'],
  [29.0, 33.0, '男は仕事の技を教え、<br>少女は文字を教える。'],
  [33.2, 37.4, '1994年の、<br>フランス映画。'],
  [37.4, 41.8, '舞台は、<br>ニューヨーク。'],
  [42.2, 45.4, '男の正体は、<br>凄腕の殺し屋。'],
  [45.4, 49.0, '友達は、大切に育てる<br>鉢植えの観葉植物。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>レオン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q072', v2: true, answer: 'レオン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 7272,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '12歳': 'じゅうにさい', '少女': 'しょうじょ', '隣': 'となり', '部屋': 'へや', '家族': 'かぞく', '襲われ': 'おそわれ', '助け': 'たすけ', '求めて': 'もとめて', '住む': 'すむ', '男': 'おとこ', '毎日': 'まいにち', '決まった': 'きまった', '好物': 'こうぶつ', '牛乳': 'ぎゅうにゅう', '一人暮らし': 'ひとりぐらし', '大都会': 'だいとかい', '片隅': 'かたすみ', '出会った': 'であった', '孤独': 'こどく', '奇妙': 'きみょう', '共同生活': 'きょうどうせいかつ', '始まった': 'はじまった', '願い': 'ねがい', '幼い': 'おさない', '弟': 'おとうと', '仇': 'かたき', '討つ': 'うつ', '仕事': 'しごと', '技': 'わざ', '教え': 'おしえ', '文字': 'もじ', '1994年': 'せんきゅうひゃくきゅうじゅうよねん', 'フランス映画': 'フランスえいが', '舞台': 'ぶたい', '正体': 'しょうたい', '凄腕': 'すごうで', '殺し屋': 'ころしや', '友達': 'ともだち', '大切': 'たいせつ', '育てる': 'そだてる', '鉢植え': 'はちうえ', '観葉植物': 'かんようしょくぶつ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n12歳の少女が、隣の部屋のドアをたたく。隣に住む男は、毎日決まったことをくり返す。好物は、牛乳。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'ネトフリ', '映画好き', '名作映画'],
  },
});
applyQuizCards({ answer: 'レオン', info: 'U-NEXT・Netflix｜映画・133分', answerSize: 150 });
