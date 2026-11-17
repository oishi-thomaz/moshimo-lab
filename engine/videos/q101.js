import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc } from './quiz-kit.js';

// タイトル当てクイズ #101 First Love 初恋（ドラマ・日本・Netflix シリーズ・2022年11月24日配信・全9話。Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/first-love-chu-lian（Netflix）と Filmarks の動画配信欄（Netflix 見放題）で2026/11/17確認。
//   Filmarks 4.3・レビュー71,554件 filmarks.com/dramas/9990/14028）
// 確かめた事実（Netflix 公式 about.netflix.com/ja/news/netflix-announces-production-of-first-love-co-starring-hikari-mitsushima-and、
//   札幌市 city.sapporo.jp/keizai/tokku/firstlove.html、ciatr.jp/topics/316801 の序盤の設定。2026/11/17）：
//   ・宇多田ヒカルの楽曲「First Love」（1999年）と「初恋」（2018年）から着想を得たドラマ。主演 満島ひかり・佐藤健、監督・脚本 寒竹ゆり（Netflix）
//   ・1990年代後半、2000年代、現在の3つの時代を行き来しながら、20年以上にわたる初恋の記憶をたどる男女の物語（Netflix）
//   ・90年代後半、高校時代に運命的に出会い恋に落ちる。通学途中の出会い（札幌市・ciatr）
//   ・高校卒業後、彼女は東京の大学へ、彼は航空学生として自衛隊に入り、離れ離れになる（札幌市）
//   ・現在、彼女はタクシードライバー、彼は自衛官を経てセキュリティ会社の職員（札幌市）。舞台は北海道・札幌（札幌市のロケ地紹介・ciatr）
// 構成（ヒント6段）：1 雪の夜の街をタクシーが走る・運転するのはひとりの女性 → 2 20年前、彼女は高校生・忘れられない初めての恋があった
//   → 3 90年代の終わりの雪の町・通学の途中で出会ったふたり → 4 卒業して別々の道へ・彼は空を飛ぶ仕事をめざす
//   → 5 2022年の日本のドラマ・3つの時代を行き来する物語 → 6 決め手：宇多田ヒカルの2つの名曲から生まれた・主演は満島ひかりと佐藤健
// 事故の中身・ふたりのその後・結末は言わない。人物名・地名は出さない。歌詞・音源・俳優の顔・ポスター・ロゴ・劇中の有名な場面は使わない。人は汎用の3D
const S = quizStage({ bg: '#1a2030', floor: '#e8ecf2', fogNear: 20, fogFar: 70 });
const qs = S.scene;
const R = rng(10110);

const HER = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#3a4a6a', pants: '#2a2e3a', long: true };
const GIRL = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#1a2a4a', pants: '#3a3a5a', long: true, skirt: true };
const BOY = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#1a1a22', pants: '#1a1a22' };
function gl(c) { return new THREE.MeshBasicMaterial({ color: c }); }
function snow(n, w, h, d) { const a = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), gl('#ffffff')); s.userData.o = [R() * w - w / 2, R() * h, -R() * d, 0.4 + R() * 0.6]; qs.add(s); a.push(s); } return a; }
function moveSnow(a, cx, cz, t, h = 6) { a.forEach(s => { const [ox, oy, oz, sp] = s.userData.o; s.visible = true; s.position.set(cx + ox + Math.sin(t + oy) * 0.2, h - ((oy + t * sp) % h), cz + oz); }); }
const ALLSNOW = [];

// ---------- 1段目. 雪の夜の街（x=0）。黄色いタクシーが走る。運転席に女性 ----------
{ const rd = box(10, 0.04, 60, mat('#3a3e48')); rd.position.set(0, 0.03, -20); qs.add(rd);
  for (const s of [-1, 1]) { const sw = box(4, 0.2, 60, mat('#e8ecf2')); sw.position.set(s * 7, 0.1, -20); qs.add(sw);
    for (let i = 0; i < 10; i++) { const h = 4 + R() * 6; const b = box(4, h, 4, mat(['#3a3e4a', '#4a4e5a', '#2e3240'][i % 3])); b.position.set(s * 11, h / 2, -2 - i * 5.5); qs.add(b);
      for (let k = 0; k < 6; k++) if (R() > 0.4) { const w = box(0.5, 0.6, 0.05, gl(R() > 0.5 ? '#ffe0a0' : '#ffd090')); w.position.set(s * (11 - 2.03), 1 + (k % 3) * 1.4, -3 - i * 5.5 + Math.floor(k / 3) * 1.6); w.rotation.y = Math.PI / 2; qs.add(w); } }
    for (let i = 0; i < 6; i++) { const lp = box(0.12, 3.6, 0.12, mat('#2a2e38')); lp.position.set(s * 5.4, 1.8, -i * 9); qs.add(lp); const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), gl('#fff0c8')); l.position.set(s * 5.4, 3.7, -i * 9); qs.add(l); } } }
const TAXI1 = new THREE.Group();
{ const bd = box(1.8, 0.7, 4.0, mat('#e6b450')); bd.position.y = 0.6; TAXI1.add(bd); const tp = box(1.6, 0.08, 2.0, mat('#e6b450')); tp.position.set(0, 1.52, -0.2); TAXI1.add(tp); for (const [px, pz] of [[-0.76, 0.75], [0.76, 0.75], [-0.76, -1.15], [0.76, -1.15]]) { const pl = box(0.08, 0.6, 0.1, mat('#e6b450')); pl.position.set(px, 1.22, pz); TAXI1.add(pl); } const bw = box(1.5, 0.5, 0.05, gl('#4a6a8a')); bw.position.set(0, 1.25, -1.2); TAXI1.add(bw); const sw2 = box(0.05, 0.45, 1.6, gl('#4a6a8a')); sw2.position.set(-0.81, 1.25, -0.2); TAXI1.add(sw2);
  const ws = box(1.5, 0.5, 0.05, gl('#4a6a8a')); ws.position.set(0, 1.25, 0.81); ws.rotation.x = -0.25; TAXI1.add(ws);
  const sw = box(0.05, 0.45, 1.6, new THREE.MeshBasicMaterial({ color: '#4a6a8a', transparent: true, opacity: 0.3 })); sw.position.set(0.81, 1.25, -0.2); TAXI1.add(sw);
  const lamp = box(0.6, 0.22, 0.3, gl('#fff4d0')); lamp.position.set(0, 1.68, -0.2); TAXI1.add(lamp);
  for (const x of [-0.6, 0.6]) { const hl = box(0.3, 0.16, 0.05, gl('#fffbe8')); hl.position.set(x, 0.65, 2.01); TAXI1.add(hl); }
  for (const [x, z] of [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 14), mat('#14161c')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); TAXI1.add(w); }
  const drv = makePerson(HER); drv.scale.setScalar(0.62); drv.position.set(0.35, 0.12, 0.1); drv.userData.legs.forEach(l => l.rotation.x = -1.45); drv.userData.arms.forEach(a => a.rotation.x = -1.2); TAXI1.add(drv); TAXI1.userData.drv = drv;
  const il = new THREE.PointLight(0xfff0d0, 0, 3); il.position.set(0.3, 1.4, 0.1); TAXI1.add(il); TAXI1.userData.il = il; }
qs.add(TAXI1);
const SNOW1 = snow(160, 12, 7, 14); ALLSNOW.push(SNOW1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tTaxi = tag('雪の夜、タクシーが走る', { size: 54, w: 700, bg: '#14161c', sx: 2.6 }); qs.add(tTaxi);
const tDriver = tag('運転するのは、ひとりの女性', { size: 50, w: 780, bg: '#2a6ab0', sx: 0.9 }); qs.add(tDriver);

// ---------- 2段目. 夜の部屋（x=50）。大人の彼女が、光の中で高校生の姿に戻る ----------
const AX = 50;
{ const fl = box(10, 0.04, 8, mat('#5a4a3a')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#3a3e4a')); wl.position.set(AX, 2.5, -5); qs.add(wl);
  const win = box(2.4, 1.8, 0.06, gl('#2a3a5a')); win.position.set(AX + 2.2, 2.6, -4.87); qs.add(win); }
const her2 = makePerson(HER); her2.position.set(AX, 0, -2.4); qs.add(her2);
const girl2 = makePerson(GIRL); girl2.position.set(AX, 0, -2.4); girl2.scale.setScalar(0.92); qs.add(girl2);
const RING2 = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 40), new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, side: THREE.DoubleSide })); RING2.rotation.x = -Math.PI / 2; RING2.position.set(AX, 0.05, -2.4); qs.add(RING2);
const SPARK2 = []; for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), gl('#fff0c8')); s.userData.o = [R() * Math.PI * 2, R() * 2, 0.6 + R() * 0.6]; qs.add(s); SPARK2.push(s); }
const SNOW2 = snow(60, 3, 3, 0.5); ALLSNOW.push(SNOW2);
const t20 = tag('20年前、高校生だった', { size: 56, w: 660, bg: '#14161c', sx: 2.0 }); t20.position.set(AX, 2.75, -2.6); qs.add(t20);
const tFirst = tag('忘れられない、初めての恋', { size: 54, w: 720, bg: '#c8507a', sx: 2.2 }); tFirst.position.set(AX, 2.75, -2.6); qs.add(tFirst);

// ---------- 3段目. 冬の朝のバス停（x=100）。雪の積もった道。制服の2人 ----------
const BX = 100;
{ const fl = box(30, 0.04, 30, mat('#eef2f6')); fl.position.set(BX, 0.02, -8); qs.add(fl);
  const rd = box(5, 0.03, 30, mat('#c8ccd4')); rd.position.set(BX + 3, 0.05, -8); qs.add(rd);
  const sh = box(2.6, 0.12, 1.2, mat('#5a6a7a')); sh.position.set(BX - 0.6, 2.4, -3.4); qs.add(sh);
  for (const x of [-1.8, 0.6]) { const p = box(0.08, 2.4, 0.08, mat('#5a6a7a')); p.position.set(BX + x, 1.2, -3.9); qs.add(p); }
  const bk = box(2.4, 2.2, 0.06, new THREE.MeshBasicMaterial({ color: '#bcd0e0', transparent: true, opacity: 0.5 })); bk.position.set(BX - 0.6, 1.2, -3.95); qs.add(bk);
  const sign = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 20), mat('#2a6ab0')); sign.rotation.x = Math.PI / 2; sign.position.set(BX + 1.4, 2.2, -3.2); qs.add(sign);
  const sp = box(0.06, 2.2, 0.06, mat('#9a9ea8')); sp.position.set(BX + 1.4, 1.1, -3.2); qs.add(sp);
  for (let i = 0; i < 8; i++) { const t = new THREE.Group(); const tk = box(0.25, 2.4, 0.25, mat('#4a3a2a')); tk.position.y = 1.2; t.add(tk); const c = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.4, 8), mat('#e8ecf2')); c.position.y = 3.2; t.add(c); t.position.set(BX - 6 + (i % 4) * 1.6, 0, -8 - Math.floor(i / 4) * 2.4); qs.add(t); } }
const girl3 = makePerson(GIRL); girl3.position.set(BX - 1.1, 0, -3.0); girl3.rotation.y = 0.5; qs.add(girl3);
const boy3 = makePerson(BOY); boy3.position.set(BX + 4, 0, -2.6); qs.add(boy3);
const SCARF3 = box(0.5, 0.14, 0.32, mat('#c8202c')); SCARF3.position.set(BX + 4, 1.47, -2.6); qs.add(SCARF3);
const SNOW3 = snow(120, 10, 6, 8); ALLSNOW.push(SNOW3);
const t90 = tag('90年代の終わり、雪の町', { size: 54, w: 720, bg: '#14161c', sx: 2.6 }); t90.position.set(BX - 0.4, 3.3, -3.4); qs.add(t90);
const tMeet = tag('通学の途中で、出会う', { size: 56, w: 660, bg: '#c8507a', sx: 2.6 }); tMeet.position.set(BX - 0.4, 3.3, -3.4); qs.add(tMeet);

// ---------- 4段目. 分かれ道（x=150）。彼女は駅へ、彼は飛行機の見える方へ ----------
const CX = 150;
{ const fl = box(30, 0.04, 30, mat('#d8dce4')); fl.position.set(CX, 0.02, -8); qs.add(fl);
  for (const s of [-1, 1]) { const rd = box(1.6, 0.03, 16, mat('#9a9ea8')); rd.position.set(CX + s * 3, 0.05, -10); rd.rotation.y = s * -0.4; qs.add(rd); }
  const st = box(4, 2.4, 2, mat('#c8b8a0')); st.position.set(CX - 7, 1.2, -16); qs.add(st);
  const rail = box(16, 0.1, 0.2, mat('#5a5e68')); rail.position.set(CX - 7, 0.05, -17.4); qs.add(rail); }
const JET4 = new THREE.Group();
{ const f = box(0.4, 0.4, 3.2, mat('#e8ecf2')); JET4.add(f); const w = box(3.6, 0.08, 0.8, mat('#c8ccd4')); w.position.z = 0.2; JET4.add(w); const tl = box(1.2, 0.06, 0.4, mat('#c8ccd4')); tl.position.z = -1.4; JET4.add(tl); const fn = box(0.06, 0.6, 0.5, mat('#2a6ab0')); fn.position.set(0, 0.3, -1.4); JET4.add(fn); }
JET4.position.set(CX, 6, -14); qs.add(JET4);
const girl4 = makePerson({ ...GIRL, shirt: '#c8a080', pants: '#5a4a3a' }); girl4.position.set(CX, 0, -3); qs.add(girl4);
const BAG4 = box(0.5, 0.6, 0.25, mat('#8a5a3a')); BAG4.position.set(CX, 0.4, -3); qs.add(BAG4);
const boy4 = makePerson({ ...BOY, shirt: '#3a4a3a', pants: '#3a4a3a' }); boy4.position.set(CX, 0, -3); qs.add(boy4);
const tPart = tag('卒業して、別々の道へ', { size: 56, w: 640, bg: '#14161c', sx: 2.6 }); tPart.position.set(CX, 3.0, -4); qs.add(tPart);
const tSky = tag('彼は、空を飛ぶ仕事をめざす', { size: 50, w: 780, bg: '#2a6ab0', sx: 2.8 }); tSky.position.set(CX, 3.0, -4); qs.add(tSky);

// ---------- 5段目. テレビの前（x=200）。画面に3つの時代 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#4a3a30')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a3e4a')); wl.position.set(TX, 4, -5); qs.add(wl);
  const tv = box(5.6, 3.3, 0.3, mat('#14161c')); tv.position.set(TX, 3.2, -4.75); qs.add(tv);
  const sofa = box(3.6, 0.6, 1.2, mat('#6a4a3a')); sofa.position.set(TX, 0.3, 1.6); qs.add(sofa); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.9), new THREE.MeshBasicMaterial({ map: canvasTex(520, 290, (g, w, h) => {
  const cols = [['#c8d8e8', '#e8ecf2'], ['#e8c8a0', '#f4e0c8'], ['#2a3a5a', '#4a5a7a']];
  cols.forEach(([a, b], i) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(i * w / 3 + 4, 4, w / 3 - 8, h - 8); });
  g.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) g.fillRect((i * 53) % w, (i * 37) % h, 3, 3); }) }));
SCR5.position.set(TX, 3.2, -4.58); qs.add(SCR5);
const FANS5 = [0, 1].map(i => { const p = makePerson(i ? HER : BOY); p.position.set(TX - 0.6 + i * 1.2, -0.2, 1.6); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.4); qs.add(p); return p; });
const t2022 = tag('2022年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.4 }); t2022.position.set(TX, 5.7, -4.4); qs.add(t2022);
const t3era = tag('3つの時代を、行き来する', { size: 54, w: 700, bg: '#2a6ab0', sx: 3.4 }); t3era.position.set(TX, 5.7, -4.4); qs.add(t3era);

// ---------- 6段目. 夜の窓辺（x=250）。2枚の無地のディスクがゆっくり回る ----------
const DX = 250;
{ const fl = box(12, 0.04, 10, mat('#2a2a34')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#1a2030')); wl.position.set(DX, 3, -5); qs.add(wl);
  const win = box(4.4, 3.2, 0.06, gl('#2a3a5a')); win.position.set(DX, 3.0, -4.87); qs.add(win); }
const DISC6 = [makeDisc('#c8507a'), makeDisc('#2a6ab0')]; DISC6.forEach((d, i) => { d.position.set(DX + (i ? 1.0 : -1.0), 2.0, -3.4); qs.add(d); });
const SNOW6 = snow(80, 4.4, 3.2, 0.3); ALLSNOW.push(SNOW6);
const tUtada = tag('宇多田ヒカルの、2つの名曲から', { size: 50, w: 840, bg: '#c8507a', sx: 3.0 }); tUtada.position.set(DX, 3.45, -3.4); qs.add(tUtada);
const tCast = tag('主演は、満島ひかりと佐藤健', { size: 50, w: 800, bg: '#c8902c', sx: 3.0 }); tCast.position.set(DX, 3.45, -3.4); qs.add(tCast);

// ---------- shots ----------
const ALL = [tTaxi, tDriver, t20, tFirst, t90, tMeet, tPart, tSky, t2022, t3era, tUtada, tCast, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); ALLSNOW.forEach(a => a.forEach(s => s.visible = false)); }

function shotTaxi(t, quiz = 0) { // 1段目 0〜9：雪の夜の街を、タクシーが走る。運転するのは、ひとりの女性（0秒目がサムネ）
  base(); S.aim(0, -6); lift(0); S.hemi.intensity = 0.6;
  const z = -2 - t * 1.6;
  TAXI1.position.set(1.4, 0, z); TAXI1.rotation.y = Math.PI;
  moveSnow(SNOW1, 1.4, z + 6, t, 7);
  Q1.position.set(1.4, 2.4, z); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  tTaxi.position.set(1.4, 3.0, z - 0.4); tDriver.position.set(0.7, 1.8, z - 0.1);
  if (!quiz) { tTaxi.userData.pop((t - 2.0) / 0.35); if (t > 4.6) tTaxi.visible = false; tDriver.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  if (t < 4.6 || quiz) look(lerp(-1.4, -0.6, u), lerp(2.6, 2.2, u), z - 5.6, 1.4, 1.2, z, 60);
  else look(-2.3, 1.55, z + 0.4, 1.0, 1.0, z - 0.1, 48);
  TAXI1.userData.drv.userData.head.rotation.y = (!quiz && t > 5.6) ? lerp(0, 0.9, clamp((t - 5.6) / 0.6)) : 0; TAXI1.userData.il.intensity = (!quiz && t > 4.6) ? 3 : 0;
  return qs;
}
function shotBack(t) { // 2段目 9〜17：20年前、彼女は高校生だった。忘れられない、初めての恋があった
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#06070c');
  const k = clamp((t - 2.2) / 1.6);
  her2.visible = k < 0.5; girl2.visible = k >= 0.5;
  RING2.material.opacity = Math.sin(k * Math.PI); RING2.scale.setScalar(1 + k * 0.6);
  SPARK2.forEach(s => { const [a, h, r] = s.userData.o; s.visible = k > 0 && k < 1; s.position.set(AX + Math.cos(a + t * 2) * r, h * k * 1.2, -2.4 + Math.sin(a + t * 2) * r); });
  moveSnow(SNOW2, AX + 2.2, -4.7, t, 3.4); SNOW2.forEach(s => s.position.y += 1);
  [her2, girl2].forEach(p => { p.rotation.y = 0.2; p.userData.head.rotation.x = -0.1; });
  t20.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t20.visible = false; tFirst.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.8, 0.4, u), lerp(2.0, 1.8, u), lerp(2.6, 1.8, u), AX, 1.5, -2.4, 60);
  return qs;
}
function shotStop(t) { // 3段目 17〜25：90年代の終わり、雪の多い町。通学の途中で、ふたりは出会う
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 1.0; S.scene.background.set('#c8d4e2'); S.scene.fog.color.set('#c8d4e2');
  const k = ease(clamp((t - 3.4) / 2.4));
  boy3.position.set(BX + lerp(4.0, 0.3, k), 0, -2.6); boy3.rotation.y = -Math.PI / 2 + k * 1.0; poseWalk(boy3, t * 8, k < 1 ? 0.8 : 0);
  SCARF3.position.set(boy3.position.x, 1.47, -2.6); SCARF3.rotation.y = boy3.rotation.y;
  girl3.userData.head.rotation.y = t > 5 ? -0.4 : 0;
  moveSnow(SNOW3, BX, -0.5, t, 6);
  t90.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t90.visible = false; tMeet.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.6, 0.6, u), lerp(2.2, 2.0, u), lerp(3.6, 2.8, u), BX - 0.4, 1.4, -3.0, 62);
  return qs;
}
function shotFork(t) { // 4段目 25〜33：高校を卒業して、別々の道へ。彼は、空を飛ぶ仕事をめざす
  base(); S.aim(CX, -6); lift(0); S.hemi.intensity = 1.0; S.scene.background.set('#a8c8e8'); S.scene.fog.color.set('#a8c8e8');
  const k = clamp((t - 0.6) / 7);
  girl4.position.set(CX - 0.5 - k * 1.5, 0, -3 - k * 4); girl4.rotation.y = Math.PI + 0.45; poseWalk(girl4, t * 7, 0.7);
  BAG4.position.set(girl4.position.x + 0.42, 0.4, girl4.position.z);
  boy4.position.set(CX + 0.5 + k * 1.5, 0, -3 - k * 4); boy4.rotation.y = Math.PI - 0.45; poseWalk(boy4, t * 7 + 1, 0.7);
  JET4.visible = t > 3.8; JET4.position.set(CX + 9 - (t - 3.8) * 2.2, 6 + (t - 3.8) * 0.5, -14); JET4.rotation.set(-0.15, -Math.PI / 2 + 0.2, 0);
  tPart.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPart.visible = false; tSky.userData.pop((t - 4.3) / 0.35);
  look(CX, lerp(2.4, 2.8, k), lerp(1.6, 1.2, k), CX, lerp(1.4, 2.4, k), -8, 62);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2022年の、日本のドラマ。3つの時代を、行き来する物語
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.55, '#08060a');
  t2022.userData.pop((t - 0.4) / 0.35); if (t > 4.4) t2022.visible = false; t3era.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, lerp(3.0, 3.4, u), lerp(6.0, 5.0, u), TX, 3.6, -4.6, 62);
  return qs;
}
function shotDiscs(t) { // 6段目 42〜49（決め手）：宇多田ヒカルの、2つの名曲から生まれた。主演は、満島ひかりと佐藤健
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.6; S.darken(0.45, '#06070c');
  DISC6.forEach((d, i) => { d.rotation.y = Math.sin(t * 0.8 + i) * 0.5; d.children[0].rotation.y = t * 2; d.position.y = 2.0 + Math.sin(t * 1.4 + i * 2) * 0.12; d.scale.setScalar(0.62 * ease(clamp((t - 0.2 - i * 0.3) / 0.5))); });
  moveSnow(SNOW6, DX, -4.7, t, 3.2); SNOW6.forEach(s => s.position.y += 1.4);
  if (t < 3.6) tUtada.userData.pop((t - 0.3) / 0.35); else tCast.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.2, 0.2, u), 2.6, lerp(1.6, 1.1, u), DX, 2.5, -3.4, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（雪の夜の街に戻る）
  shotTaxi(2.0 + t * 0.3, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotTaxi(t, 0) },
  { a: 9, b: 17, f: shotBack },
  { a: 17, b: 25, f: shotStop },
  { a: 25, b: 33, f: shotFork },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotDiscs },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '雪の夜の街を、<br>タクシーが走る。'],
  [5.6, 9.0, '運転するのは、<br>ひとりの女性。'],
  [9.2, 13.2, '20年前、彼女は<br>高校生だった。'],
  [13.2, 17.0, '忘れられない、<br>初めての恋があった。'],
  [17.2, 21.0, '90年代の終わり、<br>雪の多い町。'],
  [21.0, 25.0, '通学の途中で、<br>ふたりは出会う。'],
  [25.2, 29.0, '高校を卒業して、<br>別々の道へ。'],
  [29.0, 33.0, '彼は、空を飛ぶ仕事を<br>めざす。'],
  [33.2, 37.4, '2022年の、<br>日本のドラマ。'],
  [37.4, 41.8, '3つの時代を、<br>行き来する物語。'],
  [42.2, 45.4, '宇多田ヒカルの、<br>2つの名曲から生まれた。'],
  [45.4, 49.0, '主演は、<br>満島ひかりと佐藤健。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ファーストラブ 初恋。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q101', v2: true, answer: 'First Love 初恋',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 10110,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '初恋': 'はつこい', '初めて': 'はじめて', '雪': 'ゆき', '夜': 'よる', '街': 'まち', '走る': 'はしる', '運転': 'うんてん', '女性': 'じょせい', '20年前': 'にじゅうねんまえ', '彼女': 'かのじょ', '高校生': 'こうこうせい', '忘れられない': 'わすれられない', '恋': 'こい', '90年代': 'きゅうじゅうねんだい', '終わり': 'おわり', '多い': 'おおい', '町': 'まち', '通学': 'つうがく', '途中': 'とちゅう', '出会う': 'であう', '高校': 'こうこう', '卒業': 'そつぎょう', '別々': 'べつべつ', '道': 'みち', '彼は': 'かれは', '空': 'そら', '飛ぶ': 'とぶ', '仕事': 'しごと', '2022年': 'にせんにじゅうにねん', '日本': 'にほん', '3つ': 'みっつ', '時代': 'じだい', '行き来': 'いきき', '物語': 'ものがたり', '宇多田ヒカル': 'うただひかる', '2つ': 'ふたつ', '名曲': 'めいきょく', '生まれた': 'うまれた', '主演': 'しゅえん', '満島ひかり': 'みつしまひかり', '佐藤健': 'さとうたける', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n雪の夜の街を、タクシーが走る。運転するのは、ひとりの女性。20年前、彼女は高校生だった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'ドラマ好き', '恋愛ドラマ', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'First Love<br>初恋', info: 'Netflix｜日本のドラマ・全9話', answerSize: 120 });
