import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #057 ワンダヴィジョン（ドラマ・アメリカ・2021年・Disney+・全9話。Disney+で見放題、
//   justwatch.com/jp/テレビ番組/wandavuiziyon で2026/11/4確認。Filmarks 4.1・レビュー32,800件 filmarks.com/dramas/7264/10454）
// 確かめた事実（Filmarks のエピソード一覧・ja.wikipedia.org/wiki/ワンダヴィジョン。2026/11/4）：
//   ・2021年1月15日〜3月5日にDisney+で配信、全9話。マーベル・シネマティック・ユニバース（MCU）のテレビシリーズ第1作
//   ・長い交際の末に結婚したふたりが、郊外の小さな町に引っ越してくる。夫はシンセゾイド（人造人間）
//   ・1950年代のシットコム風に始まり、話が進むと60年代・70年代・80年代と時代が新しくなる。映像も白黒からカラーへ（第3話「カラー放送」）
// 構成（ヒント6段）：1 白黒の画面、どこからか笑い声 → 2 郊外に越してきた新婚夫婦、妻には不思議な力 → 3 回を追うごとに時代が進む、白黒からカラーへ
//   → 4 夫は人間ではない、幸せな毎日に違和感 → 5 2021年のアメリカのドラマ・全9話、映画シリーズから生まれた → 6 決め手：マーベル初のドラマシリーズ、魔法の妻と人造人間の夫
// マーベル・人物名・町の名前は6段目まで出さない。キャラクターの見た目（衣装・顔の色）は使わない。結末・正体の中身は言わない。人は汎用の3D

const S = quizStage({ bg: '#2a2a2e', floor: '#3a3a3e', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(5757);

const G = (v) => '#' + [v, v, v].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
const WIFE_G = { skin: G(200), hair: G(70), shirt: G(150), pants: G(110), long: true, skirt: true };
const HUS_G = { skin: G(185), hair: G(40), shirt: G(225), pants: G(80), tie: true };
const WIFE_C = { skin: '#f2d4b8', hair: '#6a3a24', shirt: '#e88a6a', pants: '#3a6a9a', long: true, skirt: true };
const HUS_C = { skin: '#efcfae', hair: '#2a2420', shirt: '#f2e8c8', pants: '#5a4a3a', tie: true };

function makeRoom(x0, color) { // 古いホームドラマの居間（color=false で白黒）
  const c = (hex, g) => color ? hex : G(g);
  const fl = box(10, 0.04, 8, mat(c('#8a5a3a', 120))); fl.position.set(x0, 0.02, -1); qs.add(fl);
  const wl = box(10, 5, 0.2, mat(c('#e8d8a8', 190))); wl.position.set(x0, 2.5, -3.5); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.6), new THREE.MeshBasicMaterial({ color: c('#bfe0f0', 225) })); win.position.set(x0 - 2.6, 2.6, -3.38); qs.add(win);
  for (const s of [-1, 1]) { const cu = box(0.4, 2.0, 0.05, mat(c('#c84a4a', 90))); cu.position.set(x0 - 2.6 + s * 1.1, 2.6, -3.34); qs.add(cu); }
  const sofa = box(2.6, 0.5, 0.9, mat(c('#3a7a6a', 100))); sofa.position.set(x0, 0.45, -2.4); qs.add(sofa); const bk = box(2.6, 0.7, 0.25, mat(c('#3a7a6a', 90))); bk.position.set(x0, 0.95, -2.85); qs.add(bk);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.4, 14), mat(c('#f2e0b0', 235))); lamp.position.set(x0 + 2.4, 1.6, -2.8); qs.add(lamp); const lp = box(0.06, 1.4, 0.06, mat(c('#5a4a3a', 60))); lp.position.set(x0 + 2.4, 0.7, -2.8); qs.add(lp);
  const frame = box(1.0, 0.7, 0.04, mat(c('#b8903a', 150))); frame.position.set(x0 + 0.2, 2.9, -3.38); qs.add(frame);
  const tb = box(1.2, 0.06, 0.6, mat(c('#6a4a2a', 90))); tb.position.set(x0, 0.45, -1.2); qs.add(tb);
}

// ---------- 1段目. 白黒の居間（x=0）。笑い声が聞こえる ----------
makeRoom(0, false);
const w1 = makePerson(WIFE_G); w1.position.set(-0.6, -0.32, -2.3); w1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(w1);
const h1 = makePerson(HUS_G); h1.position.set(0.6, -0.32, -2.3); h1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(h1);
const HAHA = []; for (let i = 0; i < 6; i++) { const t = tag('HA', { size: 70, w: 160, h: 110, bg: 'rgba(0,0,0,0)', color: '#f4f4f4', sx: 0.5 }); t.userData.o = i; qs.add(t); HAHA.push(t); }
const tBW = tag('白黒の世界', { size: 76, w: 440, bg: G(30), sx: 1.6 }); tBW.position.set(0, 2.05, -1.6); qs.add(tBW);
const tLaugh = tag('どこからか笑い声', { size: 64, w: 560, bg: G(230), color: '#141414', sx: 1.9 }); tLaugh.position.set(0, 2.05, -1.6); qs.add(tLaugh);

// ---------- 2段目. 白黒の郊外の家の前（x=40）。新婚夫婦と、宙に浮く皿 ----------
const HX = 40;
{ const fl = box(16, 0.04, 14, mat(G(140))); fl.position.set(HX, 0.02, -3); qs.add(fl);
  const house = box(6, 3.2, 4, mat(G(215))); house.position.set(HX, 1.6, -6); qs.add(house);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.8, 4), mat(G(80))); roof.position.set(HX, 4.1, -6); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.7; qs.add(roof);
  const door = box(0.9, 1.9, 0.1, mat(G(60))); door.position.set(HX, 0.95, -3.95); qs.add(door);
  for (const x of [-2, 2]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), new THREE.MeshBasicMaterial({ color: G(235) })); w.position.set(HX + x, 1.9, -3.94); qs.add(w); }
  for (let i = 0; i < 10; i++) { const p = box(0.08, 0.6, 0.08, mat(G(245))); p.position.set(HX - 4.5 + i, 0.3, -2.2); qs.add(p); } const rail = box(9.2, 0.08, 0.06, mat(G(245))); rail.position.set(HX, 0.5, -2.2); qs.add(rail);
  for (const x of [-6, 6]) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 10), mat(G(100))); tr.position.set(HX + x, 2.6, -5); qs.add(tr); const tk = box(0.3, 2, 0.3, mat(G(70))); tk.position.set(HX + x, 1, -5); qs.add(tk); } }
const w2 = makePerson(WIFE_G); w2.position.set(HX - 0.6, 0, -0.6); w2.rotation.y = 0.2; qs.add(w2);
const h2 = makePerson(HUS_G); h2.position.set(HX + 0.6, 0, -0.6); h2.rotation.y = -0.2; qs.add(h2);
const DISH = []; for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), mat(G(250))); d.userData.o = i; qs.add(d); DISH.push(d); }
const SPARK = []; for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: G(255) })); s.userData.o = R() * 6; qs.add(s); SPARK.push(s); }
const tNew = tag('郊外に越してきた新婚夫婦', { size: 56, w: 720, bg: G(30), sx: 2.0 }); tNew.position.set(HX, 2.6, -0.6); qs.add(tNew);
const tPow = tag('妻には、不思議な力', { size: 62, w: 600, bg: G(230), color: '#141414', sx: 1.8 }); tPow.position.set(HX, 2.6, -0.6); qs.add(tPow);

// 白黒の世界ではネクタイも灰色に（makePerson のネクタイは赤固定なので、材質を複製して色を変える）
for (const p of [h1, h2]) p.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0xb23a3a) { o.material = o.material.clone(); o.material.color.set(G(70)); } });

// ---------- 3段目. 並んだ3台のテレビ（x=80）。時代が進み、白黒からカラーへ ----------
const DX = 80;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), new THREE.MeshBasicMaterial({ color: '#1e1e24' })); bg.position.set(DX, 4, -3); qs.add(bg); const shelf = box(9, 0.2, 1.2, mat('#5a4030')); shelf.position.set(DX, 0.9, -1.8); qs.add(shelf); }
const ERA = [];
for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.position.set(DX - 2.5 + i * 2.5, 0, -1.8); qs.add(g);
  const cab = box(2.2, 1.9, 1.0, mat(['#6a4a2a', '#c8a060', '#8a5a3a'][i])); cab.position.y = 1.95; g.add(cab);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(180, 130, (c, w, h) => { const col = i === 0 ? ['#d8d8d8', '#8a8a8a', '#3a3a3a'] : i === 1 ? ['#e8c8a0', '#c87a5a', '#5a7a9a'] : ['#f2a040', '#a85ad8', '#3ab8a8']; c.fillStyle = col[0]; c.fillRect(0, 0, w, h); c.fillStyle = col[1]; c.fillRect(20, 60, 60, 70); c.fillRect(100, 50, 60, 80); c.fillStyle = col[2]; c.beginPath(); c.arc(50, 45, 16, 0, Math.PI * 2); c.arc(130, 35, 16, 0, Math.PI * 2); c.fill(); }) })); scr.position.set(0, 2.0, 0.51); g.add(scr);
  for (const x of [-0.9, 0.9]) { const lg = box(0.1, 1.0, 0.1, mat('#3a2a1a')); lg.position.set(x, 0.5, 0.3); g.add(lg); }
  const lab = tag(['50年代', '60年代', '70年代'][i], { size: 70, w: 340, bg: ['#5a5a5a', '#c87a5a', '#a85ad8'][i], sx: 1.3 }); lab.position.set(DX - 2.5 + i * 2.5, 3.4, -1.2); qs.add(lab); ERA.push(lab); g.userData.scr = scr; }
const tTime = tag('回を追うごとに、時代が進む', { size: 56, w: 760, bg: '#14161c', sx: 4.6 }); tTime.position.set(DX, 4.6, -1.2); qs.add(tTime);
const tColor = tag('白黒から、カラーへ', { size: 64, w: 600, bg: '#e2483c', sx: 3.8 }); tColor.position.set(DX, 4.6, -1.2); qs.add(tColor);

// ---------- 4段目. カラーになった居間（x=120）。夫は人間ではない ----------
const CX = 120;
makeRoom(CX, true);
const w4 = makePerson(WIFE_C); w4.position.set(CX - 0.9, 0, -0.8); w4.rotation.y = 0.4; qs.add(w4);
const h4 = makePerson(HUS_C); h4.position.set(CX + 0.9, 0, -0.8); h4.rotation.y = -0.4; qs.add(h4);
const GEARS = []; for (let i = 0; i < 4; i++) { const gr = new THREE.Mesh(new THREE.TorusGeometry(0.18 + i * 0.03, 0.05, 6, 10), new THREE.MeshStandardMaterial({ color: '#c8d0d8', metalness: 0.7, roughness: 0.3 })); gr.userData.o = i; qs.add(gr); GEARS.push(gr); }
const tNotH = tag('夫は、人間じゃない', { size: 62, w: 600, bg: '#3a7ad8', sx: 1.9 }); tNotH.position.set(CX, 2.75, -0.8); qs.add(tNotH);
const tOdd = tag('何かが、おかしい', { size: 66, w: 520, bg: '#e2483c', sx: 1.8 }); tOdd.position.set(CX, 2.75, -0.8); qs.add(tOdd);

// ---------- 5段目. テレビの前（x=160）。2021年のアメリカのドラマ・全9話 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#181a24' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.5, '#e8b070'); gr.addColorStop(1, '#a85ad8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.88)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(56 + i * 50, h / 2, 18, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const tUS = tag('2021年 アメリカのドラマ', { size: 60, w: 820, bg: '#e6b450', color: '#14161c', sx: 3.5 }); tUS.position.set(TX, 4.6, -1.2); qs.add(tUS);
const t9 = tag('全9話', { size: 80, w: 320, bg: '#3a7ad8', sx: 1.9 }); t9.position.set(TX, 4.6, -1.2); qs.add(t9);
const tFilm = tag('映画シリーズから誕生', { size: 60, w: 640, bg: '#e2483c', sx: 2.9 }); tFilm.position.set(TX, 3.75, -1.0); qs.add(tFilm);

// ---------- 6段目. 夜の町の上に浮かぶふたり（x=200） ----------
const MX = 200;
{ const fl = box(30, 0.04, 30, mat('#2a3a2a')); fl.position.set(MX, 0.02, -8); qs.add(fl);
  for (let i = 0; i < 9; i++) { const hx = MX - 10 + (i % 5) * 5, hz = -6 - Math.floor(i / 5) * 6; const hs = box(3, 2.2, 3, mat(['#e8d8c0', '#c8d8e8', '#e8c8c0'][i % 3])); hs.position.set(hx, 1.1, hz); qs.add(hs); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), mat('#5a4040')); rf.position.set(hx, 2.8, hz); rf.rotation.y = Math.PI / 4; qs.add(rf); const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); wn.position.set(hx, 1.2, hz + 1.52); qs.add(wn); } }
const w6 = makePerson(WIFE_C); w6.position.set(MX - 0.7, 2.0, 0); qs.add(w6);
const h6 = makePerson(HUS_C); h6.position.set(MX + 0.7, 2.0, 0); qs.add(h6);
const MAGIC = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: '#ff5a7a', transparent: true, opacity: 0.85 })); m.userData.o = R() * 6; m.userData.r = 0.3 + R() * 0.4; qs.add(m); MAGIC.push(m); }
const GEM = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: '#ffd24a' })); GEM.position.set(0, 0.36, 0.2); h6.userData.head.add(GEM);
const tMarvel = tag('マーベル初のドラマシリーズ', { size: 56, w: 760, bg: '#c8202a', sx: 3.0 }); tMarvel.position.set(MX, 5.2, -0.4); qs.add(tMarvel);
const tPair = tag('魔法の妻と、人造人間の夫', { size: 56, w: 720, bg: '#14161c', sx: 2.9 }); tPair.position.set(MX, 4.45, -0.2); qs.add(tPair);

// ---------- shots ----------
const ALL = [tBW, tLaugh, tNew, tPow, tTime, tColor, ...ERA, tNotH, tOdd, tUS, t9, tFilm, tMarvel, tPair];
function base() { S.reset(); ALL.forEach(x => x.visible = false); HAHA.forEach(x => x.visible = false); MAGIC.forEach(m => m.visible = false); DISH.forEach(d => d.visible = false); SPARK.forEach(s => s.visible = false); GEARS.forEach(g => g.visible = false); }

function shotBW(t) { // 1段目 0〜9：白黒の画面。どこからか笑い声（0秒目がサムネ）
  base(); S.aim(0, -1); lift(-40); S.hemi.intensity = 1.2; S.darken(0.3, '#111111');
  w1.userData.head.rotation.y = 0.3 + Math.sin(t * 2) * 0.1; h1.userData.head.rotation.y = -0.3;
  h1.userData.arms[0].rotation.x = -0.6 - Math.abs(Math.sin(t * 3)) * 0.3; w1.position.y = -0.32 + Math.abs(Math.sin(t * 4)) * 0.02;
  HAHA.forEach((x, i) => { const k = (t * 0.45 + i / 6) % 1; x.visible = true; const side = i % 2 ? 1 : -1; x.position.set(side * (1.25 + (i % 3) * 0.12), 0.8 + k * 1.0, -1.4); const s = Math.sin(k * Math.PI); x.material.opacity = s; x.scale.set(0.55, 0.55 * 110 / 160, 1); });
  tBW.userData.pop(1); if (t > 4.6) tBW.visible = false;
  tLaugh.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.2, 0, u), lerp(1.9, 1.75, u), lerp(4.8, 3.9, u), 0, 1.2, -2, 54);
  return qs;
}
function shotHouse(t) { // 2段目 9〜17：郊外に越してきた新婚夫婦。妻には不思議な力
  base(); S.aim(HX, -2); lift(-40); S.hemi.intensity = 1.2; S.darken(0.4, '#777777');
  w2.userData.arms[0].rotation.x = t > 4.2 ? -1.8 : 0; w2.userData.arms[0].rotation.z = t > 4.2 ? 0.2 : 0;
  DISH.forEach((d, i) => { d.visible = t > 4.4; const a = t * 1.4 + i * Math.PI / 2; d.position.set(HX - 0.6 + Math.cos(a) * 0.55, 2.0 + Math.sin(t * 2 + i) * 0.12, -0.3 + Math.sin(a) * 0.4); d.rotation.x = Math.sin(t + i) * 0.4; });
  SPARK.forEach((s, i) => { s.visible = t > 4.4; const a = t * 2 + s.userData.o; s.position.set(HX - 0.75 + Math.cos(a) * 0.35, 1.6 + Math.sin(a * 1.3) * 0.25, -0.1 + Math.sin(a) * 0.3); });
  tNew.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNew.visible = false;
  tPow.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(HX + lerp(0.4, 0.1, u), lerp(2.0, 1.9, u), lerp(5.4, 4.6, u), HX, 1.55, -1, 56);
  return qs;
}
function shotEras(t) { // 3段目 17〜25：回を追うごとに時代が進む。白黒からカラーへ
  base(); S.aim(DX, 0); lift(-30); S.hemi.intensity = 1.1;
  ERA.forEach((x, i) => { x.userData.pop((t - 0.6 - i * 0.6) / 0.3); });
  tTime.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tTime.visible = false;
  tColor.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(DX, 3.0, lerp(11.2, 10.4, u), DX, 1.7, -1.5, 58);
  return qs;
}
function shotColor(t) { // 4段目 25〜33：夫は人間じゃない。何かがおかしい
  base(); S.aim(CX, -1); lift(-40); S.hemi.intensity = 1.2;
  GEARS.forEach((g, i) => { g.visible = t > 0.8 && t < 4.2; const a = t * 1.5 + i * Math.PI / 2; g.position.set(CX + 0.9 + Math.cos(a) * 0.55, 1.4 + i * 0.22, -0.8 + Math.sin(a) * 0.4); g.rotation.set(t * 2 + i, t, 0); });
  const glitch = t > 4.2 && (Math.sin(t * 17) > 0.6); S.darken(glitch ? 0.6 : 0, '#3a0a2a'); w4.position.x = CX - 0.9 + (glitch ? 0.08 : 0);
  w4.userData.head.rotation.y = 0.3; h4.userData.head.rotation.y = -0.3; h4.userData.arms[0].rotation.x = -0.5;
  tNotH.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNotH.visible = false;
  tOdd.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.3, 0, u), lerp(2.0, 1.9, u), lerp(5.4, 4.6, u), CX, 1.5, -1.2, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2021年のアメリカのドラマ。全9話。映画シリーズから誕生
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false;
  t9.userData.pop((t - 4.2) / 0.35); tFilm.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX, 2.8, lerp(7.8, 7.0, u), TX, 2.7, -1.5, 56);
  return qs;
}
function shotSky(t, quiz = 0) { // 6段目 42〜49（決め手）：マーベル初のドラマシリーズ。魔法の妻と人造人間の夫
  base(); S.aim(MX, -2); lift(-30); S.hemi.intensity = 0.8; S.darken(0.6, '#0a0a2a');
  w6.position.y = 2.0 + Math.sin(t * 1.5) * 0.1; h6.position.y = 2.0 + Math.sin(t * 1.5 + 1) * 0.1;
  w6.userData.legs.forEach((l, i) => l.rotation.x = i ? 0.2 : -0.2); h6.userData.legs.forEach((l, i) => l.rotation.x = i ? -0.15 : 0.15);
  w6.userData.arms[0].rotation.x = -1.4; w6.userData.arms[0].rotation.z = 0.3;
  MAGIC.forEach((m, i) => { m.visible = true; const a = t * 2.4 + m.userData.o; m.position.set(MX - 0.95 + Math.cos(a) * m.userData.r, w6.position.y + 1.0 + Math.sin(a * 1.3) * 0.3, 0.45 + Math.sin(a) * m.userData.r); });
  GEM.scale.setScalar(1 + Math.sin(t * 4) * 0.25);
  if (!quiz) { tMarvel.userData.pop((t - 0.4) / 0.35); tPair.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(MX + lerp(0.4, 0.2, u), lerp(2.4, 2.2, u), lerp(7.2, 6.4, u), MX, 3.2, -0.5, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（白黒の居間）
  shotBW(7.9);
  ALL.forEach(x => x.visible = false); HAHA.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.2, 0.25, d);
  S.spot.color.set(0xf0f0f0); S.spot.position.set(0, 5.5, 2); S.spot.target.position.set(0, 1, -2.3); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(lerp(0.6, 0.3, k), lerp(1.8, 1.7, k), lerp(4.2, 3.4, k), 0, 1.2, -2.2, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotBW },
  { a: 9, b: 17, f: shotHouse },
  { a: 17, b: 25, f: shotEras },
  { a: 25, b: 33, f: shotColor },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotSky(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '白黒の画面の中。<br>仲よく笑う夫婦。'],
  [5.6, 9.0, 'どこからか、<br>観客の笑い声が聞こえる。'],
  [9.2, 13.2, '郊外の町に越してきた、<br>新婚のふたり。'],
  [13.2, 17.0, '妻には、<br>不思議な力がある。'],
  [17.2, 21.0, '回を追うごとに、<br>時代が進んでいく。'],
  [21.0, 25.0, 'そしてある回から、<br>白黒がカラーに。'],
  [25.2, 29.0, '夫は、<br>人間ではない。'],
  [29.0, 33.0, '幸せな毎日。<br>でも、何かがおかしい。'],
  [33.2, 37.4, '2021年のアメリカのドラマ。<br>全9話。'],
  [37.4, 41.8, '大ヒット映画シリーズから、<br>生まれたドラマ。'],
  [42.2, 45.4, 'マーベル初の、<br>ドラマシリーズ。'],
  [45.4, 49.0, '魔法を操る妻と、<br>人造人間の夫。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ワンダヴィジョン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q057', v2: true, answer: 'ワンダヴィジョン',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 5757,
    hits: [5.6, 21.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'drone'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '白黒': 'しろくろ', '画面': 'がめん', '仲よく': 'なかよく', '笑う': 'わらう', '夫婦': 'ふうふ', '観客': 'かんきゃく', '笑い声': 'わらいごえ', '聞こえる': 'きこえる', '郊外': 'こうがい', '町': 'まち', '越してきた': 'こしてきた', '新婚': 'しんこん', '妻': 'つま', '不思議': 'ふしぎ', '力': 'ちから', '回を追う': 'かいをおう', '時代': 'じだい', '進んでいく': 'すすんでいく', '夫': 'おっと', '人間': 'にんげん', '幸せ': 'しあわせ', '毎日': 'まいにち', '2021年': 'にせんにじゅういちねん', '全9話': 'ぜんきゅうわ', '大ヒット': 'だいヒット', '映画': 'えいが', '生まれた': 'うまれた', '初': 'はつ', '魔法': 'まほう', '操る': 'あやつる', '人造人間': 'じんぞうにんげん', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n白黒の画面の中。仲よく笑う夫婦。どこからか、観客の笑い声が聞こえる。郊外の町に越してきた、新婚のふたり。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'DisneyPlus', '海外ドラマ', 'ドラマ好き'],
  },
});
applyQuizCards({ answer: 'ワンダヴィジョン', info: 'Disney+｜アメリカのドラマ・全9話', answerSize: 100 });
