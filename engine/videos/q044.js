import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #044 セブン（映画・アメリカ・日本公開1996年・126分・サスペンス。Netflix・U-NEXT・Hulu で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/sebun）で2026/11/4確認。Filmarks 4.0・レビュー250,491件 filmarks.com/movies/9361）
// 確かめた事実（Filmarks の作品ページのあらすじ・ja.wikipedia「セブン (映画)」。2026/11/4）：
//   ・2人の刑事が追うのは、怜悧な頭脳を持つしたたかな連続殺人鬼。男は七つの大罪のいずれかに該当する者を狙い、殺人を繰り返していた（Filmarks）
//   ・退職まであと1週間のベテラン刑事サマセットと、血気盛んな新人刑事ミルズ。舞台は名前の出ない雨の多い大都会。
//     サマセットは図書館で『神曲』『カンタベリー物語』などを調べる（wikipedia）
//   ・監督 デヴィッド・フィンチャー、出演 ブラッド・ピット、モーガン・フリーマン。米公開1995年9月、日本公開1996年1月27日
// 構成（ヒント6段）：1 雨の街の事件・現場に残された言葉 → 2 退職まで1週間のベテランと新人のコンビ → 3 雨がやまない名前のない大都会
//   → 4 夜の図書館で古い本を調べる・犯人の次を読む → 5 1995年のアメリカのサスペンス・ブラッド・ピットとモーガン・フリーマン
//   → 6 決め手：犯人が狙うのは七つの大罪、監督はデヴィッド・フィンチャー
// 事件の中身（遺体・現場の様子）は見せない。結末・犯人・最後の箱には絶対に触れない。作品の映像・俳優・ポスター・有名な場面の構図は使わない

const S = quizStage({ bg: '#1a1e26', floor: '#22262e', fogNear: 18, fogFar: 70 });
const qs = S.scene;
const R = rng(4444);

const VET = { skin: '#8a5a3a', hair: '#3a3a3a', shirt: '#6a5a48', pants: '#2a2a30', tie: true };
const NEW = { skin: '#efcfae', hair: '#8a6a3a', shirt: '#2a2e38', pants: '#22242a' };

// 雨（どの場面でも使う。カメラのまわりに置き直す）
const RAIN = []; { const rm = new THREE.MeshBasicMaterial({ color: '#a8b8d0', transparent: true, opacity: 0.45 });
  for (let i = 0; i < 260; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.5, 0.015), rm); d.userData = { x: R() * 16 - 8, z: R() * 14 - 10, o: R() }; qs.add(d); RAIN.push(d); } }
function rain(cx, cz, t, on = true, sp = 9) { RAIN.forEach(d => { d.visible = on; if (!on) return; const y = 9 - ((t * sp + d.userData.o * 9) % 9); d.position.set(cx + d.userData.x, y, cz + d.userData.z); }); }

// ---------- 1段目. 雨の夜の部屋（x=0）。懐中電灯と、壁のメモ ----------
{ const fl = box(9, 0.04, 8, mat('#3a3430')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(12, 9, 0.2, mat('#5a5448')); wl.position.set(0, 4.5, -4.4); qs.add(wl);
  const tb = box(1.8, 0.08, 1.0, mat('#4a3a2e')); tb.position.set(-1.4, 0.8, -2.6); qs.add(tb); for (const [x, z] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) { const l = box(0.08, 0.8, 0.08, mat('#3a2a20')); l.position.set(-1.4 + x, 0.4, -2.6 + z); qs.add(l); }
  const fr = box(0.9, 2.0, 0.7, mat('#c8c4b4')); fr.position.set(1.8, 1.0, -3.9); qs.add(fr);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshBasicMaterial({ color: '#2a3448' })); win.position.set(-1.2, 3.0, -4.28); qs.add(win); }
const NOTE = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(256, 170, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a2a20'; g.lineWidth = 7; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(26, 50 + i * 42); for (let x = 26; x < 226; x += 18) g.lineTo(x, 50 + i * 42 + Math.sin(x * 0.3 + i) * 7); g.stroke(); } }) })); NOTE.position.set(0.6, 1.8, -4.28); NOTE.scale.setScalar(1.5); qs.add(NOTE);
const vet1 = makePerson(VET); vet1.position.set(-0.6, 0, -0.4); vet1.rotation.y = Math.PI * 0.95; qs.add(vet1);
const new1 = makePerson(NEW); new1.position.set(0.9, 0, 0.2); new1.rotation.y = Math.PI * 1.1; qs.add(new1);
const TORCH = new THREE.SpotLight(0xfff2d0, 0, 10, 0.28, 0.4, 1.0); qs.add(TORCH); qs.add(TORCH.target);
const tCase = tag('雨の夜の事件', { size: 80, w: 460, bg: '#b23a3a', sx: 1.9 }); tCase.position.set(0, 2.5, -1.6); qs.add(tCase);
const tWord = tag('残されていた言葉', { size: 72, w: 560, bg: '#14161c', sx: 1.75 }); tWord.position.set(0.35, 2.5, -1.6); qs.add(tWord);

// ---------- 2段目. 警察署の机（x=40）。退職までの日めくり ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#4a4a48')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#7a7a6e')); wl.position.set(KX, 3, -4); qs.add(wl);
  const dk = box(2.6, 0.08, 1.2, mat('#5a4a3a')); dk.position.set(KX, 0.8, -1.6); qs.add(dk); const dl = box(2.4, 0.76, 1.0, mat('#4a3a2e')); dl.position.set(KX, 0.4, -1.6); qs.add(dl);
  for (let i = 0; i < 4; i++) { const f = box(0.5, 0.06 + i * 0.02, 0.36, mat(['#c8b890', '#d8c8a0', '#b8a880', '#e0d4b0'][i])); f.position.set(KX - 0.8, 0.88 + i * 0.07, -1.7); qs.add(f); }
  const lamp = box(0.12, 0.5, 0.12, mat('#2a3a2a')); lamp.position.set(KX + 1.0, 1.1, -1.9); qs.add(lamp); }
const CAL = []; for (let i = 0; i < 7; i++) { const g = new THREE.Group(); const c = box(0.5, 0.5, 0.03, mat('#f0ece0')); g.add(c); const x = new THREE.Group(); for (const s of [-1, 1]) { const b = box(0.06, 0.55, 0.02, new THREE.MeshBasicMaterial({ color: '#b23a3a' })); b.rotation.z = s * 0.78; x.add(b); } x.position.z = 0.03; g.add(x); g.userData.x = x; g.position.set(KX - 1.8 + i * 0.6, 3.1, -3.85); qs.add(g); CAL.push(g); }
const vet2 = makePerson(VET); vet2.position.set(KX - 0.5, 0, -2.4); qs.add(vet2);
const new2 = makePerson(NEW); new2.position.set(KX + 2.6, 0, 0.6); new2.rotation.y = -Math.PI / 2; qs.add(new2);
const tRetire = tag('退職まで あと1週間', { size: 64, w: 600, bg: '#14161c', sx: 2.0 }); tRetire.position.set(KX, 2.3, -0.8); qs.add(tRetire);
const tRookie = tag('相棒は 新人刑事', { size: 70, w: 540, bg: '#4fa3d1', sx: 1.9 }); tRookie.position.set(KX, 2.3, -0.8); qs.add(tRookie);

// ---------- 3段目. 雨の大都会（x=90）。傘の人たち ----------
const CX = 90;
const BLDG = []; for (let i = 0; i < 12; i++) { const w = 2 + R() * 1.6, h = 6 + R() * 10; const wt = windowTextures(4400 + i, ['#3a3e48', '#2e323a', '#44484e'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#e8d8a0'), emissiveIntensity: 0.45 })); const side = i % 2 ? 1 : -1; b.position.set(CX + side * (4.2 + (i >> 1) * 0.3), h / 2, 2 - (i >> 1) * 3.4); qs.add(b); BLDG.push(b); }
{ const rd = box(6, 0.04, 30, mat('#2a2c32')); rd.position.set(CX, 0.03, -6); qs.add(rd); for (let i = 0; i < 6; i++) { const pd = new THREE.Mesh(new THREE.CircleGeometry(0.4 + R() * 0.5, 16), new THREE.MeshBasicMaterial({ color: '#4a5468', transparent: true, opacity: 0.6 })); pd.rotation.x = -Math.PI / 2; pd.position.set(CX - 2 + R() * 4, 0.06, -R() * 14); qs.add(pd); } }
const UMB = []; for (let i = 0; i < 8; i++) { const p = makePerson({ skin: ['#ecc9a6', '#c8946a', '#e8c4a0', '#8a5a3a'][i % 4], hair: '#2a2420', shirt: ['#3a3a40', '#4a3e34', '#2a3040', '#504840'][i % 4], pants: '#22242a', long: i % 3 === 0 }); const u = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.3, 10, 1, true), new THREE.MeshLambertMaterial({ color: ['#1a1a1e', '#2a2a30', '#3a2a2a'][i % 3], side: THREE.DoubleSide })); u.position.y = 2.35; p.add(u); const st = box(0.03, 0.8, 0.03, mat('#1a1a1a')); st.position.set(0.12, 1.9, 0); p.add(st); p.userData.arms[1].rotation.x = -1.0; p.userData.x = CX - 1.8 + (i % 4) * 1.2; p.userData.z0 = -i * 1.6; p.userData.dir = i % 2 ? 1 : -1; p.position.set(p.userData.x, 0, p.userData.z0); qs.add(p); UMB.push(p); }
const tRain = tag('雨がやまない街', { size: 72, w: 520, bg: '#14161c', sx: 2.4 }); tRain.position.set(CX, 3.6, 0); qs.add(tRain);
const tNoName = tag('名前の出てこない大都会', { size: 56, w: 680, bg: '#5a6478', sx: 2.6 }); tNoName.position.set(CX, 3.6, 0); qs.add(tNoName);

// ---------- 4段目. 夜の図書館（x=130）。古い本を調べる ----------
const BX = 130;
{ const fl = box(12, 0.04, 9, mat('#3a2a22')); fl.position.set(BX, 0.02, -1); qs.add(fl); const wl = box(12, 7, 0.2, mat('#2a201a')); wl.position.set(BX, 3.5, -5); qs.add(wl); }
const SHELF = []; for (let k = 0; k < 4; k++) { const g = new THREE.Group(); const fr = box(2.0, 4.0, 0.5, mat('#4a3020')); fr.position.y = 2.0; g.add(fr); for (let r = 0; r < 5; r++) for (let j = 0; j < 9; j++) { const bk = box(0.16, 0.55 + R() * 0.15, 0.36, mat(['#7a2a2a', '#2a4a3a', '#3a3a6a', '#8a6a3a', '#5a3a4a'][(j + r + k) % 5])); bk.position.set(-0.8 + j * 0.2, 0.45 + r * 0.78, 0.1); g.add(bk); } g.position.set(BX - 4.2 + k * 2.6 + (k > 1 ? 0.8 : 0), 0, -4.4); qs.add(g); SHELF.push(g); }
{ const dk = box(2.4, 0.08, 1.2, mat('#5a3a24')); dk.position.set(BX, 0.85, -1.4); qs.add(dk); const dl = box(2.2, 0.8, 1.0, mat('#4a2e1c')); dl.position.set(BX, 0.42, -1.4); qs.add(dl);
  for (let i = 0; i < 4; i++) { const b = box(0.5, 0.1, 0.36, mat(['#7a2a2a', '#3a3a6a', '#2a4a3a', '#8a6a3a'][i])); b.position.set(BX - 0.9 + (i % 2) * 0.1, 0.94 + i * 0.1, -1.6); b.rotation.y = i * 0.2; qs.add(b); } }
const OPEN = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(256, 160, (g, w, h) => { g.fillStyle = '#efe6cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a7a60'; g.fillRect(w / 2 - 1, 0, 2, h); for (let r = 0; r < 9; r++) for (const s of [0, 1]) g.fillRect(14 + s * 128, 16 + r * 15, 96 - (r % 3) * 12, 4); }) })); OPEN.rotation.x = -Math.PI / 2; OPEN.position.set(BX + 0.1, 0.9, -1.3); qs.add(OPEN);
const LAMP4 = new THREE.PointLight(0xffd890, 0, 6, 1.4); LAMP4.position.set(BX + 0.8, 1.8, -1.4); qs.add(LAMP4);
{ const lp = box(0.08, 0.6, 0.08, mat('#2a3a2a')); lp.position.set(BX + 0.8, 1.2, -1.8); qs.add(lp); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.22, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#3a6a3a', side: THREE.DoubleSide })); sh.position.set(BX + 0.8, 1.55, -1.8); qs.add(sh); }
const vet4 = makePerson(VET); vet4.position.set(BX, -0.32, -0.55); vet4.rotation.y = Math.PI; vet4.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(vet4);
const tLib = tag('夜の図書館', { size: 80, w: 420, bg: '#14161c', sx: 1.6 }); tLib.position.set(BX, 2.7, -2.6); qs.add(tLib);
const tNext = tag('犯人の次の一手を読む', { size: 58, w: 660, bg: '#b23a3a', sx: 2.0 }); tNext.position.set(BX, 2.7, -2.6); qs.add(tNext);

// ---------- 5段目. フィルムと星条旗の色（x=170）。1995年のアメリカのサスペンス ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#16181e' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const FILM = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(560, 104, (g, w, h) => { g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d4c8'; for (let x = 6; x < w; x += 22) { g.fillRect(x, 6, 10, 10); g.fillRect(x, h - 16, 10, 10); } for (let k = 0; k < 6; k++) { g.fillStyle = ['#3a4458', '#4a3a3a', '#2e3a3a'][k % 3]; g.fillRect(8 + k * 92, 24, 84, 56); } }) })); FILM.material.map.wrapS = THREE.RepeatWrapping; FILM.position.set(FX, 2.0, -1.5); qs.add(FILM);
const DUO = [VET, NEW].map((o, i) => { const p = makePerson({ ...o, skin: '#0e0f12', hair: '#0e0f12', shirt: '#0e0f12', pants: '#0e0f12' }); p.position.set(FX + (i ? 0.7 : -0.7), 0, -0.4); p.rotation.y = i ? -0.2 : 0.2; qs.add(p); return p; });
const BACKLIT = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), new THREE.MeshBasicMaterial({ color: '#c8d4e8', transparent: true, opacity: 0.85 })); BACKLIT.position.set(FX, 1.4, -1.6); qs.add(BACKLIT);
const tUS = tag('1995年 アメリカのサスペンス', { size: 54, w: 760, bg: '#e6b450', color: '#14161c', sx: 4.0 }); tUS.position.set(FX, 4.6, -1.2); qs.add(tUS);
const tStar = tag('ブラッド・ピット × モーガン・フリーマン', { size: 50, w: 940, bg: '#14161c', sx: 4.0 }); tStar.position.set(FX, 4.6, -1.2); qs.add(tStar);

// ---------- 6段目. 捜査の壁（x=210）。七枚のカード ----------
const NX = 210;
{ const wl = box(12, 9, 0.2, mat('#3a3630')); wl.position.set(NX, 4.5, -3); qs.add(wl); const fl = box(10, 0.04, 6, mat('#2a2622')); fl.position.set(NX, 0.02, -0.5); qs.add(fl); }
const SINS = ['暴食', '強欲', '怠惰', '肉欲', '高慢', '嫉妬', '憤怒'];
const CARDS = SINS.map((w, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.62), new THREE.MeshBasicMaterial({ map: canvasTex(200, 138, (g, ww, hh) => { g.fillStyle = '#ece4cc'; g.fillRect(0, 0, ww, hh); g.fillStyle = '#8a1e1e'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(w, ww / 2, hh / 2 + 4); }) })); const r = i < 4 ? 0 : 1; c.position.set(NX - 1.65 + (r ? 0.55 : 0) + (i - (r ? 4 : 0)) * 1.1, r ? 3.3 : 4.2, -2.88); c.rotation.z = (R() - 0.5) * 0.12; qs.add(c); return c; });
const PINS = CARDS.map(c => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#e2483c' })); p.position.copy(c.position).add(new THREE.Vector3(0, 0.26, 0.02)); qs.add(p); return p; });
const vet6 = makePerson(VET); vet6.position.set(NX - 0.5, 0, 0.6); vet6.rotation.y = Math.PI; qs.add(vet6);
const new6 = makePerson(NEW); new6.position.set(NX + 0.6, 0, 0.7); new6.rotation.y = Math.PI; qs.add(new6);
const tSins = tag('狙いは 七つの大罪', { size: 66, w: 600, bg: '#b23a3a', sx: 3.0 }); tSins.position.set(NX, 5.15, -2.6); qs.add(tSins);
const tDir = tag('監督 デヴィッド・フィンチャー', { size: 54, w: 800, bg: '#14161c', sx: 3.6 }); tDir.position.set(NX, 5.15, -2.6); qs.add(tDir);

// ---------- shots ----------
const ALL = [tCase, tWord, tRetire, tRookie, tRain, tNoName, tLib, tNext, tUS, tStar, tSins, tDir];
function base() { S.reset(); ALL.forEach(x => x.visible = false); TORCH.intensity = 0; LAMP4.intensity = 0; rain(0, 0, 0, false); }

function shotRoom(t) { // 1段目 0〜9：雨の街で、奇妙な事件が起きた。現場には、ある言葉が残されていた（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.4, '#06080c');
    TORCH.intensity = 40; TORCH.position.set(-0.4, 1.5, -0.2);
  const k = ease(clamp((t - 3.6) / 1.4)); TORCH.target.position.set(lerp(-1.4, 0.6, k), lerp(0.9, 1.8, k), lerp(-2.6, -4.28, k));
  vet1.userData.arms[1].rotation.x = -1.3; vet1.userData.head.rotation.x = lerp(0.3, -0.1, k); new1.userData.head.rotation.y = lerp(0.3, -0.2, k);
  tCase.userData.pop(1); if (t > 4.6) tCase.visible = false;
  tWord.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.1, 0.3, u), lerp(2.0, 2.1, u), lerp(3.4, 2.9, u), lerp(-0.3, 0.4, k), lerp(1.5, 1.8, k), -3, 58);
  return qs;
}
function shotOffice(t) { // 2段目 9〜17：主人公は、退職まであと1週間のベテラン刑事。組まされたのは、血気盛んな新人
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.0; S.darken(0.15, '#2a2e36');
  const n = Math.min(6, Math.floor(t / 0.55));
  CAL.forEach((c, i) => { c.userData.x.visible = i < n; });
  vet2.userData.head.rotation.x = 0.2; vet2.userData.arms[0].rotation.x = -0.5;
  const w = ease(clamp((t - 3.6) / 2.4)); new2.position.x = KX + lerp(2.8, 1.0, w); const ph = t * 8; new2.userData.legs[0].rotation.x = Math.sin(ph) * 0.5 * (1 - w); new2.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5 * (1 - w);
  vet2.userData.head.rotation.y = t > 4.5 ? -0.6 * ease((t - 4.5) / 0.6) : 0;
  tRetire.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tRetire.visible = false;
  tRookie.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.4, 0.2, u), lerp(2.2, 2.0, u), lerp(4.0, 3.4, u), KX, 1.8, -2.2, 58);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：毎日のように雨が降る街。名前の出てこない、大都会
  base(); S.aim(CX, -4); lift(-20); S.hemi.intensity = 0.8; S.darken(0.3, '#10141c');
  rain(CX, -2, t, true, 10);
  UMB.forEach((p, i) => { const z = p.userData.z0 + p.userData.dir * t * 1.0; p.position.set(p.userData.x, 0, ((z + 12) % 14 + 14) % 14 - 12); p.rotation.y = p.userData.dir > 0 ? 0 : Math.PI; const ph = t * 8 + i; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.5; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5; });
  tRain.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tRain.visible = false;
  tNoName.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX, lerp(2.4, 3.2, u), lerp(8.4, 7.0, u), CX, lerp(2.8, 3.8, u), -10, 58);
  return qs;
}
function shotLibrary(t) { // 4段目 25〜33：ベテランは、夜の図書館で古い本を調べる。犯人の次の一手を読むために
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 0.35; S.key.intensity = 0.25; S.darken(0.55, '#060406');
  LAMP4.intensity = 14;
  vet4.userData.arms.forEach((a, i) => a.rotation.x = -1.2 + (i ? 0.1 * Math.sin(t * 1.5) : 0)); vet4.userData.head.rotation.x = 0.45;
  OPEN.material.map.offset.x = 0;
  tLib.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tLib.visible = false;
  tNext.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.6, 0.8, u), lerp(2.4, 2.1, u), lerp(3.2, 2.4, u), BX, 1.1, -1.4, 56);
  return qs;
}
function shotFilm(t) { // 5段目 33〜42：1995年の、アメリカのサスペンス映画。ブラッド・ピットと、モーガン・フリーマン
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 0.9;
  FILM.material.map.offset.x = t * 0.06;
  BACKLIT.material.opacity = 0.6 + 0.25 * Math.sin(t * 1.2);
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false;
  tStar.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.6, lerp(7.6, 6.8, u), FX, 2.7, -1.5, 56);
  return qs;
}
function shotWall(t, quiz = 0) { // 6段目 42〜49（決め手）：犯人が狙うのは、七つの大罪。監督は、デヴィッド・フィンチャー
  base(); S.aim(NX, -1); lift(-30); S.hemi.intensity = 0.7; S.key.intensity = 0.6; S.darken(0.4, '#08080a');
  CARDS.forEach((c, i) => { const k = quiz ? 1 : ease(clamp((t - 0.3 - i * 0.25) / 0.3)); c.visible = k > 0.01; c.scale.setScalar(Math.max(0.01, k)); PINS[i].visible = c.visible; });
  vet6.userData.head.rotation.x = -0.15; new6.userData.head.rotation.x = -0.15; new6.userData.arms[0].rotation.x = -1.6 + 0.1 * Math.sin(t * 2);
  if (!quiz) { tSins.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tSins.visible = false; tDir.userData.pop((t - 3.6) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(0.5, 0.1, u), lerp(3.2, 3.3, u), lerp(5.6, 4.8, u), NX, 3.5, -2.8, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（雨の中のふたりの刑事）
  shotWall(7, 1);
  rain(NX, 0, t, true);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.7, 0.2, d);
  S.spot.color.set(0xffe8c8); S.spot.position.set(NX, 6, 3); S.spot.target.position.set(NX, 1, 0.6); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.4, 0.1, k), lerp(1.9, 1.8, k), lerp(4.6, 3.8, k), NX, 1.6, 0.6, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotRoom },
  { a: 9, b: 17, f: shotOffice },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotLibrary },
  { a: 33, b: 42, f: shotFilm },
  { a: 42, b: 49, f: (t) => shotWall(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '雨の街で、<br>奇妙な事件が起きた。'],
  [5.6, 9.0, '現場には、ある言葉が<br>残されていた。'],
  [9.2, 13.2, '主人公は、退職まで<br>あと1週間のベテラン刑事。'],
  [13.2, 17.0, '組まされたのは、<br>血気盛んな新人。'],
  [17.2, 21.0, '毎日のように、<br>雨が降る街。'],
  [21.0, 25.0, '名前の出てこない、<br>大都会。'],
  [25.2, 29.0, 'ベテランは、夜の図書館で<br>古い本を調べる。'],
  [29.0, 33.0, '犯人の、<br>次の一手を読むために。'],
  [33.2, 37.4, '1995年の、<br>アメリカのサスペンス映画。'],
  [37.4, 41.8, 'ブラッド・ピットと、<br>モーガン・フリーマン。'],
  [42.2, 45.4, '犯人が狙うのは、<br>七つの大罪。'],
  [45.4, 49.0, '監督は、<br>デヴィッド・フィンチャー。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、セブン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q044', v2: true, answer: 'セブン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 4444,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.8, 56.4],
    sfx: [[0.2, 'buzz'], [4.8, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'セブン': 'セブン', 'デヴィッド・フィンチャー': 'デヴィッドフィンチャー', 'ブラッド・ピット': 'ブラッドピット', 'モーガン・フリーマン': 'モーガンフリーマン', '1995年': 'せんきゅうひゃくきゅうじゅうごねん', '七つの大罪': 'ななつのたいざい', '血気盛ん': 'けっきさかん', '退職': 'たいしょく', '1週間': 'いっしゅうかん', '組まされた': 'くまされた', '新人': 'しんじん', '奇妙な': 'きみょうな', '現場': 'げんば', '残されて': 'のこされて', '雨の街': 'あめのまち', '雨が降る': 'あめがふる', '毎日': 'まいにち', '大都会': 'だいとかい', '名前': 'なまえ', '夜の図書館': 'よるのとしょかん', '古い本': 'ふるいほん', '調べる': 'しらべる', '次の一手': 'つぎのいって', '読む': 'よむ', '犯人': 'はんにん', '狙う': 'ねらう', '主人公': 'しゅじんこう', '刑事': 'けいじ', '監督': 'かんとく', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n雨の街で、奇妙な事件が起きた。現場には、ある言葉が残されていた。主人公は、退職まであと1週間のベテラン刑事。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'U-NEXT', '映画好き', 'サスペンス映画'],
  },
});
applyQuizCards({ answer: 'セブン', info: 'Netflix・U-NEXT｜映画・126分', answerSize: 150 });
