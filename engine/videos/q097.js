import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #097 進撃の巨人（日本のアニメ・Season1 は2013年。U-NEXT・Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/jin-ji-noju-ren/シーズン-1（U-NEXT・Netflix・Prime Video・Disney+・FOD ほか）と
//   Filmarks の動画配信欄（U-NEXT・DMM TV・Hulu・Netflix 見放題）で2026/11/17確認。Filmarks Season1 4.4・レビュー57,982件 filmarks.com/animes/314/467）
// 話題：TVアニメは完結し、完結編は劇場版『進撃の巨人 完結編 THE LAST ATTACK』として映画館で上映された（gamepedia.jp/story/archives/4034）
// 確かめた事実（バンダイチャンネルの作品紹介 b-ch.com/titles/5585。2026/11/17）：
//   ・巨人がすべてを支配する世界。人類は高さ50メートルの巨大な壁を築き、壁の外への自由と引き換えに侵略を防いでいた
//   ・主人公は、まだ見ぬ壁の外の世界を夢見る10歳の少年
//   ・少年は、仮初めの平和に満足して外へ出ることを諦めた人々に違和感を抱く。周りの人々は彼を異物とみなす
//   ・そこへ壁をも超える超大型巨人が現れ、少年の夢も人々の平和も崩れ去る
//   ・2013年のアニメ。アニメーション制作 WIT STUDIO
// 構成（ヒント6段）：1 町をぐるりと囲む高い壁・外へ出る自由はない → 2 主人公は10歳の少年・まだ見ぬ壁の外を夢見る
//   → 3 大人たちは今の平和に満足・外を夢見る少年は変わり者あつかい → 4 ある日、壁より大きな影が現れる・夢も平和も崩れ去る
//   → 5 2013年に始まった日本のアニメ・最後は映画館で完結 → 6 決め手：壁の高さは50メートル・外の世界を支配しているのは巨人
// 人物名・兵団・装置・その後の展開・巨人の正体・結末は言わない。巨人の顔や体は出さない（大きな影と土ぼこりだけ）。
// 壁から巨人がのぞく有名な場面の構図は使わない。キャラクターの髪型・服・紋章・ロゴは使わない。人は汎用の3D
const S = quizStage({ bg: '#8fb0cc', floor: '#6a7a5a', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(9797);

const BOY = { skin: '#f1c9a5', hair: '#3a2a1a', shirt: '#d8d0c0', pants: '#5a4a3a', scale: 0.72 };
const TOWN = [
  { skin: '#f1c9a5', hair: '#6a4a2a', shirt: '#8a6a4a', pants: '#3a3a40' },
  { skin: '#f4d3b5', hair: '#2c2421', shirt: '#a8506a', pants: '#3a3a40', long: true, skirt: true },
  { skin: '#e8b98f', hair: '#9a9a9a', shirt: '#5a6a4a', pants: '#2a2e3a' },
  { skin: '#f4d3b5', hair: '#4a3426', shirt: '#c8a050', pants: '#3a3a40', long: true },
  { skin: '#d9a57c', hair: '#1a1410', shirt: '#6a5a8a', pants: '#2a2e3a' },
];
const STONE = '#9a958a';
function wallRing(cx, cz, r, h, seg = 40, col = STONE) {
  const g = new THREE.Group();
  for (let i = 0; i < seg; i++) {
    const a = i / seg * Math.PI * 2, w = 2 * Math.PI * r / seg + 0.15;
    const b = box(w, h, 1.6, mat(i % 2 ? col : '#8f8a80')); b.position.set(cx + Math.cos(a) * r, h / 2, cz + Math.sin(a) * r); b.rotation.y = -a + Math.PI / 2; g.add(b);
  }
  return g;
}
function house(x, z, c = '#c8b090', roof = '#8a3a2a', s = 1) {
  const g = new THREE.Group();
  const b = box(1.6 * s, 1.4 * s, 1.4 * s, mat(c)); b.position.y = 0.7 * s; g.add(b);
  const r = box(1.8 * s, 0.35 * s, 1.6 * s, mat(roof)); r.position.y = 1.55 * s; g.add(r);
  const d = box(0.4 * s, 0.7 * s, 0.05, mat('#4a3020')); d.position.set(0, 0.35 * s, 0.71 * s); g.add(d);
  g.position.set(x, 0, z); qs.add(g); return g;
}
function bird() { const g = new THREE.Group(); for (const s of [-1, 1]) { const w = box(0.5, 0.04, 0.16, mat('#f4f0e6')); w.position.x = s * 0.25; g.add(w); g.userData[s] = w; } const b = box(0.16, 0.1, 0.28, mat('#f4f0e6')); g.add(b); return g; }

// ---------- 1段目. 町（x=0）。ぐるりと囲む高い壁。鳥だけが壁を越えていく ----------
{ const fl = box(80, 0.04, 80, mat('#7a8a5a')); fl.position.set(0, 0.02, -20); qs.add(fl);
  qs.add(wallRing(0, -20, 26, 18));
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, r = 4 + R() * 16; house(Math.cos(a) * r, -20 + Math.sin(a) * r, ['#c8b090', '#d8c8a8', '#b8a080'][i % 3], ['#8a3a2a', '#6a4a3a', '#9a5a3a'][i % 3]); } }
const BIRDS1 = []; for (let i = 0; i < 5; i++) { const b = bird(); b.userData.o = [R() * 6 - 3, R() * 2, R() * 0.5]; qs.add(b); BIRDS1.push(b); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.7 }); qs.add(Q1);
const tWall = tag('町をぐるりと囲む、高い壁', { size: 54, w: 760, bg: '#14161c', sx: 5.2 }); tWall.position.set(0, 11.6, -12); qs.add(tWall);
const tNoOut = tag('外へ出る自由は、ない', { size: 58, w: 640, bg: '#c8202c', sx: 4.6 }); tNoOut.position.set(0, 11.6, -12); qs.add(tNoOut);

// ---------- 2段目. 屋根の上（x=60）。10歳の少年が、壁の向こうの空を見上げる ----------
const AX = 60;
{ const fl = box(30, 0.04, 30, mat('#7a8a5a')); fl.position.set(AX, 0.02, -8); qs.add(fl);
  const roof = box(4, 0.3, 3, mat('#8a3a2a')); roof.position.set(AX, 2.2, -2); qs.add(roof);
  const hb = box(3.6, 2.1, 2.6, mat('#c8b090')); hb.position.set(AX, 1.05, -2); qs.add(hb);
  for (let i = 0; i < 6; i++) house(AX - 9 + i * 3.6, -9, '#d8c8a8', '#6a4a3a');
  const w = box(60, 18, 1.6, mat(STONE)); w.position.set(AX, 9, -18); qs.add(w); }
const boy2 = makePerson(BOY); boy2.position.set(AX - 0.3, 2.35, -1.6); boy2.rotation.y = Math.PI * 0.9; qs.add(boy2);
const BIRDS2 = []; for (let i = 0; i < 4; i++) { const b = bird(); b.userData.o = [R() * 8 - 4, R() * 2]; qs.add(b); BIRDS2.push(b); }
const tBoy = tag('主人公は、10歳の少年', { size: 58, w: 640, bg: '#14161c', sx: 1.6 }); tBoy.position.set(AX - 0.3, 4.3, -1.6); qs.add(tBoy);
const tDream = tag('まだ見ぬ、壁の外', { size: 60, w: 540, bg: '#2a6ab0', sx: 5.2 }); tDream.position.set(AX, 12, -15); qs.add(tDream);

// ---------- 3段目. 町の広場（x=120）。大人たちはのんびり。少年だけ、ひとり離れて立つ ----------
const BX = 120;
{ const fl = box(30, 0.04, 24, mat('#b8a888')); fl.position.set(BX, 0.02, -4); qs.add(fl);
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.7, 16), mat('#8a857a')); well.position.set(BX, 0.35, -4); qs.add(well);
  for (let i = 0; i < 4; i++) house(BX - 7 + i * 4.6, -10, '#d8c8a8', ['#8a3a2a', '#6a4a3a'][i % 2]);
  const st = box(2.4, 0.9, 1.0, mat('#8a6a4a')); st.position.set(BX - 3.6, 0.45, -5.5); qs.add(st);
  for (let i = 0; i < 5; i++) { const ap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(['#c83a2a', '#e6b450'][i % 2])); ap.position.set(BX - 4.4 + i * 0.4, 1.0, -5.3); qs.add(ap); } }
const ADULTS3 = TOWN.map((c, i) => { const p = makePerson(c); p.position.set(BX - 4.5 + (i % 3) * 1.2 + (i > 2 ? 0.6 : 0), 0, -3.6 - (i > 2 ? 1.2 : 0)); p.rotation.y = (i % 2 ? -0.6 : 0.6); qs.add(p); return p; });
const boy3 = makePerson(BOY); boy3.position.set(BX + 3.6, 0, -2.6); boy3.rotation.y = -0.9; qs.add(boy3);
const tPeace = tag('今の平和に、満足', { size: 60, w: 540, bg: '#14161c', sx: 2.6 }); tPeace.position.set(BX - 2.0, 3.3, -4.2); qs.add(tPeace);
const tOdd = tag('変わり者あつかい', { size: 60, w: 540, bg: '#7a5a3a', sx: 2.0 }); tOdd.position.set(BX + 2.0, 2.6, -2.6); qs.add(tOdd);

// ---------- 4段目. 夕方の町（x=180）。壁の向こうから、壁より大きな影。土ぼこり ----------
const CX = 180;
{ const fl = box(40, 0.04, 40, mat('#6a6a5a')); fl.position.set(CX, 0.02, -10); qs.add(fl);
  for (let i = 0; i < 8; i++) house(CX - 12 + i * 3.4, -6 - (i % 2) * 2.5, '#c8b090', '#6a4a3a'); }
const WALL4 = box(60, 18, 1.6, mat(STONE)); WALL4.position.set(CX, 9, -20); qs.add(WALL4);
const SHADOW4 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(128, 256, (g, w, h) => { const gr = g.createRadialGradient(64, 150, 10, 64, 150, 120); gr.addColorStop(0, 'rgba(30,10,14,0.95)'); gr.addColorStop(0.6, 'rgba(40,14,18,0.6)'); gr.addColorStop(1, 'rgba(40,14,18,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SHADOW4.position.set(CX + 2, 0, -26); qs.add(SHADOW4);
const DUST4 = []; for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.9 + R() * 1.2, 8, 6), new THREE.MeshBasicMaterial({ color: '#c8b8a0', transparent: true, opacity: 0.0 })); d.userData.o = [R() * 14 - 7, R() * 10, R() * 4, 0.6 + R()]; qs.add(d); DUST4.push(d); }
const CRACK4 = []; for (let i = 0; i < 7; i++) { const c = box(0.25, 2.2 + R() * 2, 0.1, mat('#2a2622')); c.position.set(CX + 2 + (R() - 0.5) * 3, 3 + i * 1.6, -19.15); c.rotation.z = (R() - 0.5) * 0.9; qs.add(c); CRACK4.push(c); }
const RUN4 = TOWN.map((c, i) => { const p = makePerson(c); p.position.set(CX - 3 + i * 1.4, 0, -5 + (i % 2)); p.rotation.y = 0; qs.add(p); return p; });
const tBig = tag('壁より大きな、影', { size: 60, w: 540, bg: '#14161c', sx: 7.0 }); tBig.position.set(CX - 2, 13, -12); qs.add(tBig);
const tBreak = tag('夢も平和も、崩れ去る', { size: 56, w: 640, bg: '#c8202c', sx: 8.0 }); tBreak.position.set(CX - 2, 13, -12); qs.add(tBreak);

// ---------- 5段目. テレビの前（x=240）。2013年・日本のアニメ。映画館で完結 ----------
const TX = 240;
{ const fl = box(14, 0.04, 14, mat('#4a3a30')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#5a4a5a')); wl.position.set(TX, 4, -5); qs.add(wl);
  const tv = box(5.6, 3.3, 0.3, mat('#14161c')); tv.position.set(TX, 3.2, -4.75); qs.add(tv);
  const sofa = box(3.6, 0.6, 1.2, mat('#6a4a3a')); sofa.position.set(TX, 0.3, 1.6); qs.add(sofa); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.9), new THREE.MeshBasicMaterial({ map: canvasTex(520, 290, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e89a5a'); gr.addColorStop(1, '#5a2a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a2a2a'; g.fillRect(0, h * 0.55, w, h * 0.45); g.fillStyle = '#7a6a60'; g.fillRect(0, h * 0.38, w, h * 0.22);
  for (let i = 0; i < 12; i++) { g.fillStyle = '#2a1a1a'; g.fillRect(20 + i * 42, h * 0.62, 26, 30); } }) }));
SCR5.position.set(TX, 3.2, -4.58); qs.add(SCR5);
const FANS5 = [0, 1, 2].map(i => { const p = makePerson(TOWN[i + 1]); p.position.set(TX - 1.1 + i * 1.1, -0.2, 1.6); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.4); qs.add(p); return p; });
const t2013 = tag('2013年、日本のアニメ', { size: 56, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.4 }); t2013.position.set(TX, 5.7, -4.4); qs.add(t2013);
const tFin = tag('最後は、映画館で完結', { size: 56, w: 640, bg: '#8e5bd0', sx: 3.4 }); tFin.position.set(TX, 5.7, -4.4); qs.add(tFin);

// ---------- 6段目. 壁のふもと（x=300）。見上げるほど高い壁と、50m の目盛り ----------
const DX = 300;
{ const fl = box(30, 0.04, 30, mat('#7a8a5a')); fl.position.set(DX, 0.02, -6); qs.add(fl);
  const w = box(40, 50, 2.0, mat(STONE)); w.position.set(DX, 25, -12); qs.add(w);
  for (let r = 0; r < 25; r++) { const ln = box(40.1, 0.08, 2.05, mat('#7a766c')); ln.position.set(DX, r * 2, -12); qs.add(ln); }
  for (let i = 0; i <= 5; i++) { const tk = box(1.2, 0.18, 0.1, new THREE.MeshBasicMaterial({ color: '#e6b450' })); tk.position.set(DX + 4, i * 10, -10.9); qs.add(tk); } }
const ROD6 = box(0.16, 50, 0.1, new THREE.MeshBasicMaterial({ color: '#e6b450' })); ROD6.position.set(DX + 4, 25, -10.9); qs.add(ROD6);
const boy6 = makePerson(BOY); boy6.position.set(DX + 1.4, 0, -6); boy6.rotation.y = Math.PI; qs.add(boy6);
const t50 = tag('壁の高さ、50メートル', { size: 56, w: 660, bg: '#c8902c', sx: 9.0 }); t50.position.set(DX - 1, 16, -10.4); qs.add(t50);
const tRule = tag('外を支配するのは、巨人', { size: 54, w: 700, bg: '#c8202c', sx: 11.0 }); tRule.position.set(DX - 1, 26, -10.4); qs.add(tRule);

// ---------- shots ----------
const ALL = [tWall, tNoOut, tBoy, tDream, tPeace, tOdd, tBig, tBreak, t2013, tFin, t50, tRule, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotTown(t, quiz = 0) { // 1段目 0〜9：町をぐるりと囲む、高い高い壁。外へ出る自由は、ない（0秒目がサムネ）
  base(); S.aim(0, -20); lift(0);
  BIRDS1.forEach((b, i) => { const [ox, oy, sp] = b.userData.o; const k = (t * (0.9 + sp) * 0.22 + i * 0.13) % 1; b.position.set(ox + Math.sin(k * 6) * 1.5, 6 + oy + k * 16, -10 - k * 34); b.userData[-1].rotation.z = Math.sin(t * 9 + i) * 0.6; b.userData[1].rotation.z = -Math.sin(t * 9 + i) * 0.6; });
  Q1.position.set(0, 9.6, -12); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3);
  if (!quiz) { tWall.userData.pop((t - 1.0) / 0.35); if (t > 4.6) tWall.visible = false; tNoOut.userData.pop((t - 4.8) / 0.35); if (t > 4.6) Q1.visible = false; }
  const u = ease(t / 9);
  look(lerp(-1, 1, u), lerp(13, 14, u), lerp(-1, -2.5, u), 0, 6, -30, 66);
  return qs;
}
function shotRoof(t) { // 2段目 9〜17：主人公は、10歳の少年。まだ見ぬ壁の外を、夢見ている
  base(); S.aim(AX, -6); lift(0);
  boy2.userData.head.rotation.x = -0.5;
  BIRDS2.forEach((b, i) => { const [ox, oy] = b.userData.o; const k = ((t * 0.12) + i * 0.2) % 1; b.position.set(AX + ox, 8 + oy + k * 14, -10 - k * 14); b.userData[-1].rotation.z = Math.sin(t * 9 + i) * 0.6; b.userData[1].rotation.z = -Math.sin(t * 9 + i) * 0.6; });
  tBoy.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tBoy.visible = false; tDream.userData.pop((t - 4.3) / 0.35);
  if (t < 4) { const u = ease(t / 4); look(AX + lerp(1.6, 1.2, u), 3.6, lerp(2.6, 2.0, u), AX - 0.3, 3.2, -1.6, 60); }
  else { const u = ease((t - 4) / 4); look(AX + 0.2, lerp(3.4, 3.0, u), lerp(1.8, 2.6, u), AX, lerp(6, 9, u), -16, 64); }
  return qs;
}
function shotPlaza(t) { // 3段目 17〜25：町の大人たちは、今の平和に満足している。外を夢見る少年は、変わり者あつかい
  base(); S.aim(BX, -4); lift(0);
  ADULTS3.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.4 + i) * 0.3; p.userData.arms[0].rotation.x = Math.sin(t * 2 + i) * 0.2; });
  const turn = clamp((t - 4.2) / 0.8); ADULTS3.forEach((p, i) => { if (i % 2 === 0) p.userData.head.rotation.y = lerp(p.userData.head.rotation.y, -0.9, turn); });
  boy3.userData.head.rotation.x = -0.3;
  tPeace.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPeace.visible = false; tOdd.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1, 1, u), lerp(3.6, 3.2, u), lerp(6.6, 5.6, u), BX + lerp(-1.6, 1.4, u), 1.4, -3.4, 60);
  return qs;
}
function shotShadow(t) { // 4段目 25〜33：ある日、壁より大きな影があらわれる。少年の夢も、町の平和も、崩れ去った
  base(); S.aim(CX, -10); lift(0);
  const sky = new THREE.Color('#e8a070').lerp(new THREE.Color('#6a3a3a'), clamp(t / 6)); S.scene.background.copy(sky); S.scene.fog.color.copy(sky); S.hemi.intensity = 0.9;
  const k = ease(clamp((t - 0.3) / 3));
  SHADOW4.scale.set(22, 44 * k + 0.01, 1); SHADOW4.position.set(CX + 2, 22 * k - 4, -24);
  const br = clamp((t - 3.8) / 0.6);
  CRACK4.forEach((c, i) => { c.visible = br > i / 7; });
  DUST4.forEach((d, i) => { const [ox, oy, oz, sp] = d.userData.o; const g = clamp((t - 4.0) / 3); d.material.opacity = g > 0 ? 0.75 * (1 - g * 0.3) : 0; d.position.set(CX + 2 + ox * (0.4 + g), 1 + oy * g * 0.8, -18.5 + oz * g * 2); d.scale.setScalar(0.5 + g * sp); });
  RUN4.forEach((p, i) => { if (t > 4.4) { p.rotation.y = 0; p.position.z = -5 + (i % 2) + (t - 4.4) * 1.6; poseWalk(p, t * 12 + i, 1); } else { p.rotation.y = Math.PI; p.userData.head.rotation.x = -0.5; } });
  tBig.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tBig.visible = false; tBreak.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX - 2, lerp(3, 4, u), lerp(10, 12, u), CX, lerp(11, 12, u), -18, 66);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2013年に始まった、日本のアニメ。最後は、映画館で完結した
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.55, '#08060a');
  t2013.userData.pop((t - 0.4) / 0.35); if (t > 4.4) t2013.visible = false; tFin.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, lerp(3.0, 3.4, u), lerp(6.0, 5.0, u), TX, 3.6, -4.6, 62);
  return qs;
}
function shotWall(t) { // 6段目 42〜49（決め手）：壁の高さは、50メートル。外の世界を支配しているのは、巨人
  base(); S.aim(DX, -8); lift(0);
  boy6.userData.head.rotation.x = -0.6;
  ROD6.scale.y = clamp(t / 2.4) + 0.001; ROD6.position.y = 25 * ROD6.scale.y;
  t50.userData.pop((t - 0.5) / 0.35); if (t > 3.6) t50.visible = false; tRule.userData.pop((t - 3.8) / 0.3);
  if (t < 3.6) { const u = ease(t / 3.6); look(DX + 0.5, lerp(1.5, 6, u), 4, DX, lerp(8, 20, u), -11, 70); }
  else { const u = ease((t - 3.6) / 3.4); look(DX + 0.5, lerp(6, 9, u), lerp(4, 6, u), DX, lerp(22, 28, u), -11, 72); }
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（町に戻る）
  shotTown(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(0, lerp(13, 14, k), lerp(-1, -2.5, k), 0, 6, -30, 66);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotTown(t, 0) },
  { a: 9, b: 17, f: shotRoof },
  { a: 17, b: 25, f: shotPlaza },
  { a: 25, b: 33, f: shotShadow },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotWall },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '町をぐるりと囲む、<br>高い高い壁。'],
  [5.6, 9.0, '外へ出る自由は、<br>ない。'],
  [9.2, 13.2, '主人公は、<br>10歳の少年。'],
  [13.2, 17.0, 'まだ見ぬ壁の外を、<br>夢見ている。'],
  [17.2, 21.0, '町の大人たちは、<br>今の平和に満足している。'],
  [21.0, 25.0, '外を夢見る少年は、<br>変わり者あつかい。'],
  [25.2, 29.0, 'ある日、壁より大きな<br>影があらわれる。'],
  [29.0, 33.0, '少年の夢も、町の平和も、<br>崩れ去った。'],
  [33.2, 37.4, '2013年に始まった、<br>日本のアニメ。'],
  [37.4, 41.8, '最後は、<br>映画館で完結した。'],
  [42.2, 45.4, '壁の高さは、<br>50メートル。'],
  [45.4, 49.0, '外の世界を支配しているのは、<br>巨人。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>進撃の巨人。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q097', v2: true, answer: '進撃の巨人',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'tension', seed: 9797,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [25.2, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '町': 'まち', '囲む': 'かこむ', '高い': 'たかい', '壁': 'かべ', '外へ': 'そとへ', '出る': 'でる', '自由': 'じゆう', '主人公': 'しゅじんこう', '10歳': 'じゅっさい', '少年': 'しょうねん', '見ぬ': 'みぬ', '外を': 'そとを', '夢見て': 'ゆめみて', '大人': 'おとな', '今の': 'いまの', '平和': 'へいわ', '満足': 'まんぞく', '変わり者': 'かわりもの', 'ある日': 'あるひ', '大きな': 'おおきな', '影': 'かげ', '夢も': 'ゆめも', '崩れ去った': 'くずれさった', '2013年': 'にせんじゅうさんねん', '始まった': 'はじまった', '日本': 'にほん', '最後': 'さいご', '映画館': 'えいがかん', '完結': 'かんけつ', '50メートル': 'ごじゅうメートル', '外の世界': 'そとのせかい', '支配': 'しはい', '巨人': 'きょじん', '作品': 'さくひん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '進撃': 'しんげき', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この作品のタイトル、わかる？\n町をぐるりと囲む、高い高い壁。外へ出る自由は、ない。主人公は、まだ見ぬ壁の外を夢見る10歳の少年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'ネトフリ', 'アニメ好き', 'ダークファンタジー'],
  },
});
applyQuizCards({ answer: '進撃の巨人', info: 'U-NEXT・Netflix｜日本のアニメ', answerSize: 128 });
