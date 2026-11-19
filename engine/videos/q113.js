import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #113 Nのために（ドラマ・日本・2014年・TBS 金曜ドラマ・全10話。U-NEXT・Hulu ほかで見放題、
//   U-NEXT の作品ページ video.unext.jp/title/SID0003660（見放題の札）と Filmarks の動画配信欄（Prime Video・U-NEXT・Lemino・Hulu 見放題）で2026/11/19確認。
//   Filmarks 4.2・レビュー39,317件 filmarks.com/dramas/1672/3163）
// 確かめた事実（TBS 公式サイト tbs.co.jp/Nnotameni/intro/、Wikipedia 日本語版 Nのために の 冒頭・テレビドラマ、Filmarks の紹介。2026/11/19）：
//   ・高層マンションに住む夫妻が殺害された。現場に居合わせたのは大学生の4人。その場で1人が逮捕され、自供から有罪が確定した（TBS 公式）
//   ・それから10年後、判決に疑いを抱く元警察官が真相を追い始める。事件は15年前の夏、海に浮かぶ島で、主人公の女性ともうひとりの男性が
//     起こした“ある事件”からすべてが始まっていると確信していた（TBS 公式。公式では 瀬戸内海に浮かぶ島）
//   ・登場人物たちに共通するイニシャル N（TBS 公式）。湊かなえ原作の純愛ミステリー（TBS 公式・Filmarks）
//   ・2014年10月17日〜12月19日、TBS系 金曜ドラマ、全10回（Wikipedia）
// 構成（ヒント6段）：1 高層マンションの部屋で夫婦が亡くなった・その場にいたのは4人の若者 → 2 主人公はその場にいた大学生のひとり・ひとりが捕まり罪を認めた
//   → 3 10年後、判決を疑う元警察官・海に浮かぶ小さな島へ → 4 島で育った女の子と男の子・すべては15年前の夏に始まっていた
//   → 5 2014年の金曜ドラマ全10話・湊かなえ原作の純愛ミステリー → 6 決め手：登場人物はみんな同じイニシャル・タイトルはアルファベット1文字から
// 事件の真相・誰が何をしたか・島の事件の中身・結末は言わない。登場人物の名前・地名は出さない。アルファベットの文字そのものも出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。血や残酷な描写はしない。人は汎用の3D
const S = quizStage({ bg: '#0e1220', floor: '#1e2230', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(11310);

const HER = { skin: '#f4d3b5', hair: '#2a2020', shirt: '#e8e0d8', pants: '#4a5a7a', long: true, skirt: true };
const HIM = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#3a4a5a', pants: '#2a2e3a' };
const YM = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#2a2420', '#1a1410', '#4a3426'][i % 3], shirt: ['#7a6a5a', '#5a7a8a', '#8a5a5a'][i % 3], pants: '#2a2e3a' });
const OLD = { skin: '#e8c4a0', hair: '#9a9a9a', shirt: '#6a6458', pants: '#4a4640' };
const COP = { skin: '#e8b98f', hair: '#1a1410', shirt: '#2a3a5a', pants: '#2a3048' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function sky(x, c1, c2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(49, 60), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); m.position.set(x, 18, -48 - x * 0.002); qs.add(m); return m; }

// ---------- 1段目. 夜の高層マンション（x=0）。最上階近くの1部屋だけ明かり。下に赤い回転灯と、4人の若者 ----------
sky(0, '#05070e', '#1a2440');
const TOWER = new THREE.Mesh(new THREE.BoxGeometry(6, 34, 6), new THREE.MeshLambertMaterial({ map: canvasTex(128, 512, (g, w, h) => { g.fillStyle = '#20263a'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 40; r++) for (let c = 0; c < 6; c++) { g.fillStyle = (r * 7 + c * 3) % 11 === 0 ? '#b8a878' : '#3a4664'; g.fillRect(6 + c * 20, 6 + r * 12.6, 14, 7); } }) }));
TOWER.position.set(0, 17, -18); qs.add(TOWER);
const LIT1 = box(1.6, 1.0, 0.05, gl('#ffd890')); LIT1.position.set(0.6, 22.5, -14.97); qs.add(LIT1);
{ const gr = box(30, 0.04, 30, mat('#2a2e38')); gr.position.set(0, 0.02, -8); qs.add(gr);
  const ent = box(4, 3, 0.3, mat('#3a4050')); ent.position.set(0, 1.5, -14.8); qs.add(ent); const gd = box(2, 2.4, 0.05, gl('#e8e0c0')); gd.position.set(0, 1.2, -14.6); qs.add(gd);
  for (let i = 0; i < 2; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 8), mat('#5a5a60')); s.position.set(-4 + i * 8, 1.5, -8); qs.add(s); } }
const SIREN1 = new THREE.Group(); { const car = box(1.8, 0.9, 3.6, mat('#e8e8ec')); car.position.y = 0.7; SIREN1.add(car); const top = box(1.5, 0.5, 1.8, mat('#1a1a1e')); top.position.y = 1.35; SIREN1.add(top);
  const r = box(0.5, 0.15, 0.25, gl('#ff2a2a')); r.position.set(-0.3, 1.68, 0); SIREN1.add(r); SIREN1.userData.r = r; } SIREN1.position.set(4.2, 0, -10); SIREN1.rotation.y = 0.5; qs.add(SIREN1);
const RED1 = new THREE.PointLight(0xff2a2a, 0, 14); RED1.position.set(4.0, 2.2, -10); qs.add(RED1);
const FOUR1 = [0, 1, 2, 3].map(i => { const p = makePerson(i === 0 ? HER : YM(i)); p.position.set(-1.8 + i * 1.1, 0, -11.5 + (i % 2) * 0.4); p.rotation.y = Math.PI; qs.add(p); return p; });
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 2.6 }); qs.add(Q1);
const tTower = tag('高層マンションで、夫婦が死亡', { size: 50, w: 820, bg: '#14161c', sx: 13 }); tTower.position.set(0, 6.0, -12); qs.add(tTower);
const tFour = tag('その場にいた、4人の若者', { size: 54, w: 720, bg: '#c8202c', sx: 3.2 }); tFour.position.set(0, 6.0, -12); qs.add(tFour);

// ---------- 2段目. 夜の警察署の前（x=50）。連れていかれる若者。見送る女子大学生 ----------
const AX = 50;
sky(AX, '#06080e', '#1a2030');
{ const gr = box(20, 0.04, 14, mat('#2a2e36')); gr.position.set(AX, 0.02, -4); qs.add(gr);
  const st = box(14, 6, 2, mat('#5a5e68')); st.position.set(AX, 3, -10); qs.add(st);
  for (let i = 0; i < 6; i++) { const w = box(1.2, 0.9, 0.05, gl(i % 2 ? '#c8d0e0' : '#3a4050')); w.position.set(AX - 5 + i * 2, 3.8, -8.97); qs.add(w); }
  const dr = box(2.4, 2.4, 0.05, gl('#e8e4d0')); dr.position.set(AX, 1.2, -8.97); qs.add(dr);
  for (let i = 0; i < 3; i++) { const s = box(3.2, 0.15, 0.6, mat('#7a7e88')); s.position.set(AX, 0.075 + i * 0.15, -8.3 - i * 0.2); qs.add(s); } }
const accused2 = makePerson(YM(1)); accused2.position.set(AX - 0.3, 0, -6.2); accused2.rotation.y = Math.PI; qs.add(accused2);
const CUFF2 = box(0.36, 0.08, 0.14, mat('#c8ccd4')); CUFF2.position.set(0, 0.85, -0.18); accused2.add(CUFF2);
const COPS2 = [-0.75, 0.75].map(dx => { const p = makePerson(COP); p.position.set(AX - 0.3 + dx, 0, -6.4); p.rotation.y = Math.PI; qs.add(p); return p; });
const her2 = makePerson(HER); her2.position.set(AX + 1.6, 0, -3.8); her2.rotation.y = Math.PI + 0.3; qs.add(her2);
const tOne = tag('主人公は、その場にいたひとり', { size: 50, w: 820, bg: '#14161c', sx: 2.8 }); tOne.position.set(AX, 3.6, -6.4); qs.add(tOne);
const tConf = tag('ひとりが捕まり、罪を認めた', { size: 52, w: 780, bg: '#c8202c', sx: 2.7 }); tConf.position.set(AX, 3.6, -6.4); qs.add(tConf);

// ---------- 3段目. 昼の海（x=100）。フェリーの甲板に立つ年配の男。遠くに小さな島 ----------
const BX = 100;
sky(BX, '#6aa0d8', '#d8ecf8');
const SEA3 = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), new THREE.MeshStandardMaterial({ color: '#2a7ab0', roughness: 0.35, metalness: 0.2 })); SEA3.rotation.x = -Math.PI / 2; SEA3.position.set(BX, 0.05, -30); qs.add(SEA3);
{ const isl = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#4a7a3a')); isl.scale.y = 0.45; isl.position.set(BX + 2, 0, -40); qs.add(isl);
  const isl2 = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#5a8a4a')); isl2.scale.y = 0.4; isl2.position.set(BX - 9, 0, -44); qs.add(isl2);
  for (let i = 0; i < 6; i++) { const h = box(0.6, 0.5, 0.6, mat(['#f0ece0', '#c8b8a0'][i % 2])); h.position.set(BX - 2 + i * 1.0, 0.3, -34.5); qs.add(h); }
  const deck = box(8, 0.3, 6, mat('#e8e4dc')); deck.position.set(BX, 1.0, 0); qs.add(deck);
  const rail = box(8, 0.08, 0.08, mat('#c8c8c8')); rail.position.set(BX, 2.1, -2.9); qs.add(rail);
  for (let i = 0; i < 9; i++) { const p = box(0.06, 0.95, 0.06, mat('#c8c8c8')); p.position.set(BX - 4 + i, 1.62, -2.9); qs.add(p); } }
const WAVE3 = []; for (let i = 0; i < 24; i++) { const w = box(0.8, 0.02, 0.06, gl('#e8f4ff', 0.7)); w.userData.p = [R() * 24 - 12, -6 - R() * 26, R()]; qs.add(w); WAVE3.push(w); }
const old3 = makePerson(OLD); old3.position.set(BX - 0.6, 1.15, -2.3); old3.rotation.y = Math.PI; qs.add(old3);
const HAT3 = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 18), mat('#5a5040')); HAT3.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.18, 16), mat('#5a5040')); c.position.y = 0.1; HAT3.add(c); }
HAT3.position.set(0, 0.52, 0); old3.userData.head.add(HAT3);
const FILE3 = box(0.24, 0.32, 0.04, mat('#c8a060')); FILE3.position.set(0, -0.6, 0.12); old3.userData.arms[1].add(FILE3);
const tDoubt = tag('10年後、判決を疑う元警察官', { size: 50, w: 800, bg: '#14161c', sx: 3.0 }); tDoubt.position.set(BX + 0.3, 3.9, -4.0); qs.add(tDoubt);
const tIsle = tag('海に浮かぶ、小さな島へ', { size: 54, w: 700, bg: '#2a7ab0', sx: 2.7 }); tIsle.position.set(BX - 0.3, 3.9, -4.0); qs.add(tIsle);

// ---------- 4段目. 夏の夕方の島の坂道（x=150）。海を見下ろす石垣に座る、高校生の女の子と男の子 ----------
const CX = 150;
sky(CX, '#f08a58', '#f8d8a0');
const SEA4 = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#d8885a', roughness: 0.3, metalness: 0.3 })); SEA4.rotation.x = -Math.PI / 2; SEA4.position.set(CX, -2.0, -30); qs.add(SEA4);
{ const hill = box(14, 2.0, 8, mat('#6a8a4a')); hill.position.set(CX, -1.0, -1); qs.add(hill);
  const wall = box(6, 0.8, 0.6, mat('#9a948a')); wall.position.set(CX, 0.4, -3.0); qs.add(wall);
  for (let i = 0; i < 12; i++) { const s = box(0.45, 0.3, 0.05, mat(['#8a847a', '#aaa49a'][i % 2])); s.position.set(CX - 2.7 + (i % 6) * 0.95 + (Math.floor(i / 6) ? 0.45 : 0), 0.2 + Math.floor(i / 6) * 0.35, -2.68); qs.add(s); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 8), mat('#5a4a3a')); pole.position.set(CX + 3.2, 2, -3); qs.add(pole);
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), mat('#3a6a2a')); t.position.set(CX - 4.8 + i * 0.9, 1.4 + i * 0.3, -2.4 - i * 0.6); qs.add(t); } }
const SUN4 = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: '#fff0c0', fog: false })); SUN4.position.set(CX + 4, 4, -46); qs.add(SUN4);
const girl4 = makePerson({ ...HER, shirt: '#ffffff', pants: '#2a3a6a' }); girl4.position.set(CX - 0.4, 0.4, -3.0); girl4.rotation.y = Math.PI; qs.add(girl4);
const boy4 = makePerson({ ...HIM, shirt: '#ffffff', pants: '#2a2e3a' }); boy4.position.set(CX + 0.5, 0.4, -3.0); boy4.rotation.y = Math.PI; qs.add(boy4);
const tGrew = tag('島で育った、女の子と男の子', { size: 50, w: 800, bg: '#14161c', sx: 2.8 }); tGrew.position.set(CX, 3.0, -4.0); qs.add(tGrew);
const tSummer = tag('すべては、15年前の夏から', { size: 52, w: 760, bg: '#d8603a', sx: 2.7 }); tSummer.position.set(CX, 3.0, -4.0); qs.add(tSummer);

// ---------- 5段目. 夜のリビング（x=200）。テレビに、夜の海と島の明かり ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a3440')); wl.position.set(TX, 3, -4.5); qs.add(wl);
  const sofa = box(3.6, 0.7, 1.0, mat('#6a5a4a')); sofa.position.set(TX, 0.35, 2.6); qs.add(sofa);
  const st = box(4.2, 0.6, 0.8, mat('#2a2228')); st.position.set(TX, 0.3, -4.0); qs.add(st);
  const fr = box(5.8, 3.4, 0.16, mat('#101014')); fr.position.set(TX, 2.4, -4.3); qs.add(fr);
  const bk = box(0.9, 0.12, 0.6, mat('#c8a060')); bk.position.set(TX + 1.4, 0.66, -3.9); qs.add(bk); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.1), new THREE.MeshBasicMaterial({ map: canvasTex(640, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1020'); gr.addColorStop(0.6, '#1a2a4a'); gr.addColorStop(1, '#0a1428'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#121a2a'; g.beginPath(); g.ellipse(330, 220, 200, 50, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#ffd890'; for (let i = 0; i < 14; i++) g.fillRect(180 + (i * 41) % 300, 190 + (i * 13) % 25, 5, 4);
  g.fillStyle = '#f8f0d0'; g.beginPath(); g.arc(520, 70, 22, 0, 7); g.fill(); g.fillStyle = 'rgba(248,240,208,0.3)'; g.fillRect(500, 230, 40, 120); }) }));
SCR5.position.set(TX, 2.4, -4.2); qs.add(SCR5);
const t2014 = tag('2014年の、金曜ドラマ', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.6 }); t2014.position.set(TX, 4.9, -4.0); qs.add(t2014);
const tPure = tag('湊かなえ原作、純愛ミステリー', { size: 50, w: 820, bg: '#2a4a8a', sx: 4.4 }); tPure.position.set(TX, 4.9, -4.0); qs.add(tPure);

// ---------- 6段目. 暗い部屋（x=250）。宙に浮かぶ6枚の名札。名前はぼかし、頭の1文字だけが同じ金色に光る ----------
const DX = 250;
{ const fl = box(12, 0.04, 10, mat('#14161e')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 7, 0.2, mat('#1a1c26')); wl.position.set(DX, 3.5, -5); qs.add(wl); }
const CARDS6 = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(300, 124, (g, w, h) => {
    g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6b450'; g.fillRect(14, 22, 80, 80); g.fillStyle = '#14161c'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('？', 54, 64);
    g.fillStyle = 'rgba(40,40,50,0.35)'; for (let k = 0; k < 3; k++) g.fillRect(110 + k * 60, 44, 48, 36); }) }));
  c.userData.p = [(i % 2 ? 1 : -1) * (0.68 + (i % 3) * 0.08), 3.35 - Math.floor(i / 2) * 0.62, i]; qs.add(c); CARDS6.push(c); }
const tSame = tag('登場人物は、みんな同じ頭文字', { size: 50, w: 820, bg: '#14161c', sx: 3.0 }); tSame.position.set(DX, 4.0, -3.4); qs.add(tSame);
const tAlpha = tag('タイトルは、英字1文字から', { size: 52, w: 760, bg: '#e6b450', color: '#14161c', sx: 2.8 }); tAlpha.position.set(DX, 4.0, -3.4); qs.add(tAlpha);

// ---------- shots ----------
const ALL = [tTower, tFour, tOne, tConf, tDoubt, tIsle, tGrew, tSummer, t2014, tPure, tSame, tAlpha, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); RED1.intensity = 0; }

function shotTower(t, quiz = 0) { // 1段目 0〜9：高層マンションの部屋で、夫婦が亡くなった。その場にいたのは4人の若者（0秒目がサムネ）
  base(); S.aim(0, -12); lift(0); S.hemi.intensity = 0.55; S.darken(0.4, '#04060c');
  const fl = Math.sin(t * 9) > 0; SIREN1.userData.r.material.color.set(fl ? '#ff2a2a' : '#2a5aff'); RED1.color.set(fl ? 0xff2a2a : 0x2a5aff); RED1.intensity = 5;
  LIT1.material.color.set(Math.sin(t * 2) > -0.6 ? '#ffd890' : '#b89a60');
  FOUR1.forEach((p, i) => { p.userData.head.rotation.x = -0.5; p.rotation.y = Math.PI + (i - 1.5) * 0.08; });
  Q1.position.set(0.6, 25.0, -14.6); Q1.userData.pop(1); if (!quiz && t > 4.5) Q1.visible = false;
  if (!quiz) { tTower.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tTower.visible = false; tFour.userData.pop((t - 4.8) / 0.35); }
  const k = quiz ? 0 : ease(clamp((t - 4.4) / 1.8)); const u = ease(t / 9);
  // はじめは明かりの部屋を見上げる → 下の4人へ
  look(lerp(2.2, 0.2, k), lerp(1.4, 2.2, k), lerp(-5.0, -3.0, k) - u * 0.4, lerp(0.4, 0.2, k), lerp(19, 1.2, k), lerp(-15, -11.5, k), lerp(70, 62, k));
  tTower.position.set(0.3, 17.5, -14.0); tFour.position.set(0.1, 3.2, -11.4);
  return qs;
}
function shotStation(t) { // 2段目 9〜17：主人公は、その場にいた大学生のひとり。ひとりが捕まり、罪を認めた
  base(); S.aim(AX, -6); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#04060c');
  const w = ease(clamp((t - 3.8) / 3.6));
  [accused2, ...COPS2].forEach((p, i) => { p.position.z = -6.2 - (i ? 0.2 : 0) - w * 1.6; poseWalk(p, t * 5 + i, w > 0 && w < 1 ? 0.5 : 0); });
  accused2.userData.arms.forEach((a, i) => { a.rotation.x = -0.5; a.rotation.z = (i ? -1 : 1) * 0.35; }); accused2.userData.head.rotation.x = 0.35;
  her2.userData.head.rotation.x = 0.1;
  tOne.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOne.visible = false; tConf.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(2.6, 2.3, u), lerp(2.2, 2.1, u), lerp(0.8, 0.0, u), AX + 0.2, 1.3, -6.4, 62);
  return qs;
}
function shotFerry(t) { // 3段目 17〜25：10年後、判決を疑う元警察官。真相を追って、海に浮かぶ小さな島へ
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.35;
  WAVE3.forEach((w, i) => { const p = w.userData.p; w.position.set(BX + p[0] + ((t * 0.6 + p[2] * 10) % 4), 0.08, p[1]); });
  old3.userData.arms[1].rotation.x = t > 4.2 ? -0.9 : -0.2; old3.userData.head.rotation.x = t > 4.2 ? -0.05 : 0.25;
  tDoubt.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tDoubt.visible = false; tIsle.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.0, 0.4, u), lerp(2.8, 2.7, u), lerp(1.8, 1.0, u), BX - 0.2, 2.2, -8, 62);
  return qs;
}
function shotIsland(t) { // 4段目 25〜33：島で育った、女の子と男の子。すべては、15年前の夏に始まっていた
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.0; S.darken(0.3, '#f08a58');
  [girl4, boy4].forEach((p, i) => { p.userData.legs.forEach(l => l.rotation.x = -1.4); p.position.y = 0.8 - 0.42; p.userData.arms.forEach(a => a.rotation.x = -0.3); p.userData.head.rotation.y = t > 4.2 ? (i ? 0.35 : -0.35) : 0; });
  tGrew.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGrew.visible = false; tSummer.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(2.0, 1.9, u), lerp(2.0, 1.3, u), CX, 1.1, -6, 62);
  return qs;
}
function shotTv(t) { // 5段目 33〜42：2014年の金曜ドラマ・全10話。湊かなえ原作の純愛ミステリー
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.6, '#08060a');
  t2014.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2014.visible = false; tPure.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 2.9, u), lerp(5.6, 4.6, u), TX, 3.0, -4.2, 66);
  return qs;
}
function shotCards(t) { // 6段目 42〜49（決め手）：登場人物は、みんな同じイニシャル。タイトルはアルファベット1文字から
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.5, '#04060c');
  CARDS6.forEach((c, i) => { const p = c.userData.p; const k = ease(clamp((t - 0.3 - i * 0.18) / 0.5)); c.visible = k > 0; c.scale.setScalar(k); c.position.set(DX + p[0], p[1] + Math.sin(t * 1.4 + i) * 0.05, -3.0); c.rotation.y = Math.sin(t + i) * 0.12; });
  if (t < 3.6) tSame.userData.pop((t - 0.3) / 0.35); else tAlpha.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX, 2.3, lerp(1.8, 1.5, u), DX, 2.5, -3.0, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の高層マンションに戻る）
  shotTower(0.5, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotTower(t, 0) },
  { a: 9, b: 17, f: shotStation },
  { a: 17, b: 25, f: shotFerry },
  { a: 25, b: 33, f: shotIsland },
  { a: 33, b: 42, f: shotTv },
  { a: 42, b: 49, f: shotCards },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '高層マンションの部屋で、<br>夫婦が亡くなった。'],
  [5.6, 9.0, 'その場にいたのは、<br>4人の若者。'],
  [9.2, 13.2, '主人公は、その場にいた<br>大学生のひとり。'],
  [13.2, 17.0, 'ひとりが捕まり、<br>罪を認めた。'],
  [17.2, 21.0, '10年後。判決を疑う<br>元警察官が、真相を追う。'],
  [21.0, 25.0, '向かったのは、<br>海に浮かぶ小さな島。'],
  [25.2, 29.0, 'その島で育った、<br>女の子と男の子。'],
  [29.0, 33.0, 'すべては、15年前の夏に<br>始まっていた。'],
  [33.2, 37.4, '2014年の金曜ドラマ。<br>全10話。'],
  [37.4, 41.8, '湊かなえ原作の、<br>純愛ミステリー。'],
  [42.2, 45.4, '登場人物には、みんな<br>同じイニシャル。'],
  [45.4, 49.0, 'タイトルは、<br>アルファベット1文字から。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>Nのために。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q113', v2: true, answer: 'Nのために',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 11310,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'Nのために': 'エヌのために', '高層': 'こうそう', '部屋': 'へや', '夫婦': 'ふうふ', '亡くなった': 'なくなった', '場': 'ば', '4人': 'よにん', '若者': 'わかもの', '主人公': 'しゅじんこう', '大学生': 'だいがくせい', '捕まり': 'つかまり', '罪': 'つみ', '認めた': 'みとめた', '10年後': 'じゅうねんご', '判決': 'はんけつ', '疑う': 'うたがう', '元警察官': 'もとけいさつかん', '真相': 'しんそう', '追う': 'おう', '向かった': 'むかった', '海': 'うみ', '浮かぶ': 'うかぶ', '小さな': 'ちいさな', '島': 'しま', '育った': 'そだった', '女の子': 'おんなのこ', '男の子': 'おとこのこ', '15年前': 'じゅうごねんまえ', '夏': 'なつ', '始まっていた': 'はじまっていた', '2014年': 'にせんじゅうよねん', '金曜': 'きんよう', '全10話': 'ぜんじゅうわ', '湊かなえ': 'みなとかなえ', '原作': 'げんさく', '純愛': 'じゅんあい', '登場人物': 'とうじょうじんぶつ', '同じ': 'おなじ', '1文字': 'ひともじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n高層マンションの部屋で、夫婦が亡くなった。その場にいたのは、4人の若者。主人公は、その場にいた大学生のひとり。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Hulu', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'Nのために', info: 'U-NEXT・Hulu｜日本のドラマ・全10話', answerSize: 140 });
