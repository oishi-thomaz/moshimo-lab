import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #135 東京リベンジャーズ（アニメ・日本・2021年4月〜・全24話。Netflix・U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/dong-jing-ribenziyazu（見放題：Netflix・U-NEXT・Prime Video・Hulu・FOD・Disney Plus ほか）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・DMM TV・FOD・Hulu・Netflix ほか見放題。2026年10月更新）で2026/11/24確認。
//   Filmarks 3.9・レビュー36,730件 filmarks.com/animes/1436/1907）
// 確かめた事実（2026/11/24）：
//   ・Netflix 作品ページ netflix.com/jp/title/81442520 ：2021年・24エピソード。人生どん底のダメ男は中学時代にタイムリープし、恋人を死の運命から救うべく
//     未来で彼女を殺すことになる不良集団に加入。時を超えた人生のリベンジが始まる。第1話：フリーターの主人公は中学時代の恋人が亡くなったことを知る。
//     駅のホームで何者かに突き飛ばされ、12年前にタイムリープしてしまう
//   ・JustWatch 日本版の紹介文：人生どん底のダメフリーター。中学時代に付き合っていた人生唯一の恋人が、最凶最悪の悪党連合に殺されたことを知る。
//     恋人を救うため、逃げ続けた自分を変えるため、人生のリベンジを開始する
//   ・映画.com eiga.com/movie/92746 ：和久井健の人気コミックを実写映画化。主人公は恋人が殺されたことをニュースで知る
//   ・Filmarks：2021年製作・公開日 2021年04月11日・日本・原作 和久井健
// 構成（ヒント6段）：1 夜のニュースに見覚えのある名前・中学時代のただひとりの恋人だった → 2 主人公は人生どん底のフリーター・逃げてばかりの毎日
//   → 3 次の日の駅のホーム・だれかに背中を押された → 4 目を開けると12年前・彼女を死なせないために
//   → 5 2021年の日本のアニメ・原作は実写映画にもなった漫画 → 6 決め手：未来で彼女の命をうばう最凶の不良集団・その中に飛びこんで人生のリベンジ
// 犯人・黒幕・結末は言わない。登場人物の名前・チーム名・地名は出さない（タイトルの 東京 も言わない）。
// 俳優の顔・ポスター・ロゴ・アニメの絵や人物のデザイン（髪型・特攻服の刺しゅう）は使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#1a1e2a', floor: '#2a2c34', fogNear: 18, fogFar: 70 });
const qs = S.scene;
const R = rng(13510);

const HERO = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#6a7a8a', pants: '#3a3e48' };
const HERO_K = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#1e2230', pants: '#1e2230' };   // 中学生のころ（黒い学生服）
const GANG = { skin: '#e8c0a0', hair: '#1a1410', shirt: '#14161c', pants: '#14161c' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
// 札をカメラの前に置く（画面の上のほう・幅は画面の9割まで）
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function coat(p) { const c = box(0.56, 0.9, 0.32, mat('#101218')); c.position.y = 0.95; p.add(c); return c; }

// ---------- 1段目. 夜のワンルーム（x=0）。床に座る青年。テレビのニュース（文字のない画面） ----------
{ const fl = box(8, 0.04, 7, mat('#4a4038')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(8, 3.2, 0.2, mat('#3a3a44')); wl.position.set(0, 1.6, -5.4); qs.add(wl);
  const wl2 = box(0.2, 3.2, 7, mat('#34343e')); wl2.position.set(-3.9, 1.6, -2); qs.add(wl2);
  const st = box(1.6, 0.5, 0.6, mat('#2a2420')); st.position.set(0.3, 0.25, -4.6); qs.add(st);
  const tv = box(1.5, 0.95, 0.1, mat('#101014')); tv.position.set(0.3, 1.0, -4.6); qs.add(tv);
  const bd = box(2.0, 0.4, 3.0, mat('#5a5a6a')); bd.position.set(-2.6, 0.2, -3.6); qs.add(bd);
  for (let i = 0; i < 5; i++) { const c = box(0.3, 0.06, 0.2, mat(['#c8c0b0', '#8a5a4a', '#5a6a7a'][i % 3])); c.position.set(-1 + R() * 3, 0.06, -1.6 - R() * 2); c.rotation.y = R() * 3; qs.add(c); } }
const SCR1 = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.8), new THREE.MeshBasicMaterial({ map: canvasTex(272, 160, (g) => {
  g.fillStyle = '#2a4a7a'; g.fillRect(0, 0, 272, 160); g.fillStyle = '#c8d4e4'; g.fillRect(16, 18, 110, 80);
  g.fillStyle = '#e8e8ec'; g.fillRect(0, 118, 272, 30); g.fillStyle = '#c83a3a'; g.fillRect(0, 118, 46, 30);
  g.fillStyle = '#6a7a90'; g.fillRect(140, 24, 110, 12); g.fillRect(140, 46, 90, 12); g.fillRect(140, 68, 100, 12); }) }));
SCR1.position.set(0.3, 1.0, -4.54); qs.add(SCR1);
const GLOW1 = new THREE.PointLight('#8ab0ff', 4, 6); GLOW1.position.set(0.3, 1.1, -3.8); qs.add(GLOW1);
const HERO1 = person(HERO, 0.3, -1.6, Math.PI);
HERO1.userData.legs.forEach(l => l.rotation.x = -1.4); HERO1.position.y = -0.55;
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tNews = tag('夜のニュースに、見覚えのある名前', { size: 46, w: 860, bg: '#14161c', sx: 1.9 }); qs.add(tNews);
const tEx = tag('中学時代の、ただひとりの恋人', { size: 48, w: 820, bg: '#e24050', sx: 1.8 }); qs.add(tEx);

// ---------- 2段目. 夜の店の裏口（x=50）。段ボールを運ぶ青年。うつむいたまま ----------
const AX = 50;
{ const gr = box(20, 0.04, 14, mat('#34343a')); gr.position.set(AX, 0.02, -3); qs.add(gr);
  const wl = box(14, 4, 0.3, mat('#5a5a62')); wl.position.set(AX, 2, -6); qs.add(wl);
  const dr = box(1.4, 2.4, 0.1, mat('#8a8a90')); dr.position.set(AX - 2.4, 1.2, -5.8); qs.add(dr);
  const lp = box(0.6, 0.15, 0.3, gl('#fff4d0')); lp.position.set(AX - 2.4, 2.7, -5.7); qs.add(lp);
  for (let i = 0; i < 6; i++) { const b = box(0.7, 0.5, 0.5, mat('#b08a5a')); b.position.set(AX + 1.6 + (i % 3) * 0.75, 0.25 + Math.floor(i / 3) * 0.5, -5.2); qs.add(b); }
  const bin = box(1.2, 1.1, 0.8, mat('#2a5a3a')); bin.position.set(AX + 4.4, 0.55, -5.0); qs.add(bin);
  const l2 = new THREE.PointLight('#ffe8b0', 3, 8); l2.position.set(AX - 2.4, 2.6, -4.6); qs.add(l2); }
const HERO2 = person(HERO, AX - 0.2, -2.6, 0.4);
const APRON2 = box(0.52, 0.6, 0.05, mat('#2a6a4a')); APRON2.position.set(0, 1.05, 0.16); HERO2.add(APRON2);
const BOX2 = box(0.6, 0.4, 0.45, mat('#b08a5a')); BOX2.position.set(0, 1.0, 0.45); HERO2.add(BOX2);
const tLow = tag('主人公は、人生どん底のフリーター', { size: 46, w: 880, bg: '#14161c', sx: 1.9 }); tLow.position.set(AX + 0.5, 2.6, -1.4); qs.add(tLow);
const tRun = tag('逃げてばかりの、毎日', { size: 54, w: 620, bg: '#e24050', sx: 1.5 }); tRun.position.set(AX + 0.5, 2.6, -1.4); qs.add(tRun);

// ---------- 3段目. 夜の駅のホーム（x=100）。白線の内側に立つ青年。うしろに黒い人影 ----------
const BX = 100;
{ const pf = box(6, 1.0, 30, mat('#6a6a70')); pf.position.set(BX - 1, 0.5, -10); qs.add(pf);
  const ln = box(0.25, 0.02, 30, mat('#e8d040')); ln.position.set(BX + 1.3, 1.01, -10); qs.add(ln);
  const ed = box(0.3, 0.02, 30, mat('#e8e8e8')); ed.position.set(BX + 1.85, 1.01, -10); qs.add(ed);
  const tr = box(5, 0.04, 30, mat('#2a2622')); tr.position.set(BX + 4.5, 0.02, -10); qs.add(tr);
  for (const dx of [3.6, 5.2]) { const rl = box(0.1, 0.12, 30, mat('#8a8a90')); rl.position.set(BX + dx, 0.1, -10); qs.add(rl); }
  for (let i = 0; i < 14; i++) { const sl = box(2.4, 0.08, 0.3, mat('#4a3a2e')); sl.position.set(BX + 4.4, 0.05, 4 - i * 2.1); qs.add(sl); }
  for (let i = 0; i < 4; i++) { const pl = box(0.25, 3.2, 0.25, mat('#4a4a52')); pl.position.set(BX - 2.6, 2.6, -2 - i * 6); qs.add(pl);
    const lt = box(0.2, 0.08, 2.4, gl('#eef4ff')); lt.position.set(BX - 0.4, 3.9, -2 - i * 6); qs.add(lt); }
  const rf = box(6.4, 0.2, 30, mat('#3a3a42')); rf.position.set(BX - 1, 4.1, -10); qs.add(rf);
  const l3 = new THREE.PointLight('#dfe8ff', 4, 12); l3.position.set(BX, 3.6, -2); qs.add(l3); }
const HERO3 = person(HERO, BX + 0.8, -1.6, Math.PI / 2); HERO3.position.y = 1.0;
const SHADOW3 = person(GANG, BX - 0.6, -1.6, Math.PI / 2); SHADOW3.position.y = 1.0; coat(SHADOW3);
const HOOD3 = box(0.46, 0.5, 0.44, mat('#0a0a0e')); HOOD3.position.set(0, 0.26, -0.02); SHADOW3.userData.head.add(HOOD3);
const TRAINL3 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), gl('#fff8d0')); qs.add(TRAINL3);
const tNext = tag('次の日、駅のホームで', { size: 54, w: 640, bg: '#14161c', sx: 1.6 }); tNext.position.set(BX + 1.4, 3.3, -0.8); qs.add(tNext);
const tPush = tag('だれかに、背中を押された', { size: 52, w: 720, bg: '#e24050', sx: 1.7 }); tPush.position.set(BX + 1.4, 3.3, -0.8); qs.add(tPush);
const FLASH3 = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), gl('#ffffff', 0)); qs.add(FLASH3);

// ---------- 4段目. 明るい昼の通学路（x=150）。学生服の自分。青い空と、古い家並み ----------
const CX = 150;
{ const gr = box(30, 0.04, 30, mat('#9a9488')); gr.position.set(CX, 0.02, -8); qs.add(gr);
  const rd = box(4, 0.03, 30, mat('#7a7670')); rd.position.set(CX, 0.04, -8); qs.add(rd);
  for (let i = 0; i < 6; i++) { for (const s of [-1, 1]) { const h = box(3.2, 2.6 + R() * 1.2, 3, mat(['#d8d0c0', '#c8b8a0', '#e0d8c8'][i % 3])); h.position.set(CX + s * 4.4, 1.4, -2 - i * 4); qs.add(h);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.0, 4), mat(['#5a5a6a', '#7a4a3a', '#4a5a6a'][(i + (s > 0 ? 1 : 0)) % 3])); rf.rotation.y = Math.PI / 4; rf.position.set(CX + s * 4.4, 3.4, -2 - i * 4); qs.add(rf); } }
  for (let i = 0; i < 5; i++) { const pl = box(0.18, 5, 0.18, mat('#8a7a6a')); pl.position.set(CX + 2.4, 2.5, -1 - i * 5); qs.add(pl); }
  const wire = box(0.02, 0.02, 25, mat('#3a3a3a')); wire.position.set(CX + 2.4, 4.6, -11); qs.add(wire); }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ fog: false, color: '#8ac4f0' })); SKY4.position.set(CX, 12, -40); qs.add(SKY4);
const HERO4 = person(HERO_K, CX, -1.6, Math.PI);
{ const col = box(0.22, 0.12, 0.3, mat('#1e2230')); col.position.set(0, 1.5, 0); HERO4.add(col); for (let i = 0; i < 4; i++) { const bt = box(0.05, 0.05, 0.02, mat('#d8c060')); bt.position.set(0, 1.4 - i * 0.14, 0.15); HERO4.add(bt); } }
const t12 = tag('目を開けると、12年前', { size: 54, w: 680, bg: '#14161c', sx: 1.7 }); t12.position.set(CX, 2.85, -1.8); qs.add(t12);
const tSave = tag('彼女を、死なせないために', { size: 52, w: 720, bg: '#e24050', sx: 1.7 }); tSave.position.set(CX, 2.85, -1.8); qs.add(tSave);

// ---------- 5段目. 夜の高架下（x=200）。並んだバイクと、ネオンの光 ----------
const DX = 200;
{ const gr = box(24, 0.04, 18, mat('#24262c')); gr.position.set(DX, 0.02, -4); qs.add(gr);
  const br = box(24, 0.8, 6, mat('#3a3a42')); br.position.set(DX, 5, -6); qs.add(br);
  for (const s of [-1, 1]) { const pl = box(0.8, 5, 0.8, mat('#4a4a52')); pl.position.set(DX + s * 6, 2.5, -6); qs.add(pl); }
  const wl = box(24, 4.6, 0.3, mat('#2e3038')); wl.position.set(DX, 2.3, -9); qs.add(wl);
  const ne = box(4, 0.12, 0.05, gl('#e83a8a')); ne.position.set(DX - 2, 3.4, -8.8); qs.add(ne); const ne2 = box(2.6, 0.12, 0.05, gl('#3ac8e8')); ne2.position.set(DX + 3, 2.8, -8.8); qs.add(ne2);
  const l5 = new THREE.PointLight('#e85aa0', 3, 10); l5.position.set(DX - 2, 3, -7); qs.add(l5); const l6 = new THREE.PointLight('#5ac8e8', 3, 10); l6.position.set(DX + 3, 2.6, -7); qs.add(l6); }
function bike(x, z, ry, col) { const g = new THREE.Group();
  for (const dz of [-0.6, 0.6]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 8, 16), mat('#18181c')); w.rotation.y = Math.PI / 2; w.position.set(0, 0.36, dz); g.add(w); }
  const bd = box(0.32, 0.36, 1.0, mat(col)); bd.position.set(0, 0.7, 0.05); g.add(bd); const st = box(0.3, 0.12, 0.6, mat('#202024')); st.position.set(0, 0.92, -0.25); g.add(st);
  const hb = box(0.8, 0.06, 0.06, mat('#c8c8d0')); hb.position.set(0, 1.1, 0.55); g.add(hb); const lt = box(0.18, 0.18, 0.06, gl('#fff6c8')); lt.position.set(0, 0.9, 0.7); g.add(lt);
  g.position.set(x, 0, z); g.rotation.y = ry; qs.add(g); return g; }
const BIKES5 = []; for (let i = 0; i < 6; i++) BIKES5.push(bike(DX - 3.6 + i * 1.45, -4.2, 0.35, ['#2a2a30', '#8a1a2a', '#2a2a30', '#c8c8d0', '#2a2a30', '#1a3a6a'][i]));
const t2021 = tag('2021年の、日本のアニメ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.1 }); t2021.position.set(DX, 2.6, -1.6); qs.add(t2021);
const tLive = tag('原作は、実写映画にもなった漫画', { size: 46, w: 860, bg: '#e24050', sx: 2.0 }); tLive.position.set(DX, 2.6, -1.6); qs.add(tLive);

// ---------- 6段目. 夜の空き地（x=250）。ヘッドライトの逆光に、長いコートの若者たち。その前に立つ主人公 ----------
const EX = 250;
{ const gr = box(30, 0.04, 30, mat('#2a2a2a')); gr.position.set(EX, 0.02, -8); qs.add(gr);
  const fn = box(30, 2, 0.1, mat('#3a3a40')); fn.position.set(EX, 1, -16); qs.add(fn); }
const LIGHTS6 = []; for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), gl('#fff8d8')); l.position.set(EX - 4 + i * 2, 0.9, -12); qs.add(l); LIGHTS6.push(l); }
const BEAM6 = new THREE.PointLight('#fff0d0', 6, 20); BEAM6.position.set(EX, 1.5, -11); qs.add(BEAM6);
const GANG6 = []; for (let i = 0; i < 7; i++) { const p = person(GANG, EX - 3.6 + i * 1.2, -7.6 - (i % 2) * 0.6, 0); coat(p); GANG6.push(p); }
const HERO6 = person(HERO_K, EX, -2.8, Math.PI);
const tWorst = tag('未来で彼女の命をうばう、不良集団', { size: 44, w: 880, bg: '#14161c', sx: 2.0 }); qs.add(tWorst);
const tRevenge = tag('その中に飛びこんで、人生のリベンジ', { size: 44, w: 900, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tRevenge);

// ---------- shots ----------
const ALL = [tNews, tEx, tLow, tRun, tNext, tPush, t12, tSave, t2021, tLive, tWorst, tRevenge, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); FLASH3.material.opacity = 0; SKY4.visible = false; }

function shotRoom(t, quiz = 0) { // 1段目 0〜9：夜のニュースに、見覚えのある名前。中学時代の、ただひとりの恋人だった（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.3; S.darken(0.5, '#05060a');
  GLOW1.intensity = 3.6 + Math.sin(t * 7) * 0.6;
  HERO1.userData.head.rotation.x = t > 5.4 && !quiz ? 0.25 : -0.1;
  Q1.position.set(0.3, 1.75, -4.4); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tNews.position.set(0.5, 2.25, -2.2); tEx.position.copy(tNews.position);
  if (!quiz) { tNews.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tNews.visible = false; tEx.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(2.0, 1.7, u), lerp(1.7, 1.6, u), lerp(0.6, 0.1, u), -0.1, 1.1, -3.6, 62);
  return qs;
}
function shotWork(t) { // 2段目 9〜17：主人公は、人生どん底のフリーター。逃げてばかりの毎日
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5; S.darken(0.4, '#05060a');
  const k = clamp(t / 6); HERO2.position.x = AX - 0.2 + k * 1.4; poseWalk(HERO2, t * 4, k < 1 ? 0.5 : 0); HERO2.userData.arms.forEach(a => a.rotation.x = -1.2);
  HERO2.userData.head.rotation.x = 0.4;
  tLow.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLow.visible = false; tRun.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.8, -0.2, u), lerp(2.0, 1.9, u), lerp(2.2, 1.4, u), AX + 0.6, 1.3, -3.6, 62);
  pin(tLow); pin(tRun);
  return qs;
}
function shotPlatform(t) { // 3段目 17〜25：次の日、駅のホームで。だれかに、背中を押された
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.55, '#04050a');
  const k = clamp((t - 0.5) / 4); SHADOW3.position.x = BX - 2.4 + k * 2.6; poseWalk(SHADOW3, t * 5, k < 1 ? 0.5 : 0);
  if (t > 4.6) { SHADOW3.userData.arms.forEach(a => a.rotation.x = -1.5); HERO3.rotation.z = -clamp((t - 4.6) / 1.2) * 0.35; HERO3.position.x = BX + 0.8 + clamp((t - 4.6) / 1.2) * 0.3; }
  else { HERO3.rotation.z = 0; HERO3.position.x = BX + 0.8; }
  TRAINL3.position.set(BX + 4.4, 1.2, -40 + clamp((t - 2) / 6) * 30);
  const f = clamp((t - 6.4) / 1.4); FLASH3.material.opacity = f;
  tNext.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNext.visible = false; tPush.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  const cx = BX + lerp(3.6, 3.2, u), cz = lerp(1.6, 0.9, u);
  look(cx, 2.4, cz, BX + 0.1, 1.9, -2.0, 62);
  FLASH3.position.set(cx - 0.4, 2.4, cz - 0.4); FLASH3.lookAt(cx, 2.4, cz);
  pin(tNext); pin(tPush);
  return qs;
}
function shotPast(t) { // 4段目 25〜33：目を開けると、12年前。彼女を、死なせないために
  base(); SKY4.visible = true; S.aim(CX, -3); lift(0); S.hemi.intensity = 1.35; S.key.intensity = 1.6; S.scene.background.set('#8ac4f0'); S.scene.fog.color.set('#bcd8f0');
  HERO4.userData.head.rotation.y = t < 3 ? Math.sin(t * 2.2) * 0.6 : 0; HERO4.userData.arms[1].rotation.x = t < 3 ? -0.4 : -0.1;
  if (t > 4.2) { const k = clamp((t - 4.2) / 3.5); HERO4.position.z = -1.6 - k * 2.2; poseWalk(HERO4, t * 6, 0.9); HERO4.rotation.y = Math.PI + (k > 0 ? Math.PI : 0); }
  else { HERO4.position.z = -1.6; HERO4.rotation.y = Math.PI; poseWalk(HERO4, 0, 0); }
  t12.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t12.visible = false; tSave.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(1.7, 1.9, u), lerp(1.2, 2.2, u), CX, 1.6, -4.5, 62);
  return qs;
}
function shotBikes(t) { // 5段目 33〜42：2021年の、日本のアニメ。原作は、実写映画にもなった漫画
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.7; S.darken(0.5, '#06040a');
  t2021.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2021.visible = false; tLive.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(DX + lerp(-0.6, 0.6, u), lerp(2.3, 2.1, u), lerp(2.8, 2.0, u), DX, 0.8, -4.4, 62);
  pin(t2021); pin(tLive);
  return qs;
}
function shotGang(t) { // 6段目 42〜49（決め手）：未来で彼女の命をうばう、最凶の不良集団。その中に飛びこんで、人生のリベンジ
  base(); S.aim(EX, -6); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.5; S.darken(0.6, '#030306');
  LIGHTS6.forEach((l, i) => l.visible = t > 0.3 + i * 0.2);
  const k = clamp((t - 3.6) / 2.6); HERO6.position.z = -2.8 - k * 2.4; poseWalk(HERO6, t * 6, k > 0 && k < 1 ? 0.9 : 0);
  tWorst.position.set(EX, 2.55, -1.8); tRevenge.position.set(EX, 2.55, -1.8);
  if (t < 3.6) tWorst.userData.pop((t - 0.3) / 0.35); else tRevenge.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(EX + lerp(0.6, 0.2, u), lerp(1.6, 1.8, u), lerp(1.4, 0.6, u), EX, 1.4, -6, 62);
  pin(tWorst); pin(tRevenge);
  return qs;
}
function shotQuiz(t) { // 49〜56：このアニメ、わかった？（夜の部屋に戻る）
  shotRoom(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRoom(t, 0) },
  { a: 9, b: 17, f: shotWork },
  { a: 17, b: 25, f: shotPlatform },
  { a: 25, b: 33, f: shotPast },
  { a: 33, b: 42, f: shotBikes },
  { a: 42, b: 49, f: shotGang },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '夜のニュースに、<br>見覚えのある名前。'],
  [5.6, 9.0, '中学時代に付き合った、<br>ただひとりの恋人だった。'],
  [9.2, 13.2, '主人公は、人生どん底の<br>フリーター。'],
  [13.2, 17.0, '何からも逃げてばかりの、<br>毎日だった。'],
  [17.2, 21.0, '次の日、<br>駅のホームで。'],
  [21.0, 25.0, 'だれかに、<br>背中を押された。'],
  [25.2, 29.0, '目を開けると、<br>そこは12年前。'],
  [29.0, 33.0, '今度こそ、<br>彼女を死なせない。'],
  [33.2, 37.4, '2021年の、<br>日本のアニメ。'],
  [37.4, 41.8, '原作は、実写映画にも<br>なった漫画。'],
  [42.2, 45.4, '未来で彼女の命をうばう、<br>最凶の不良集団。'],
  [45.4, 49.0, 'その中に飛びこんで、<br>人生のリベンジ。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>東京リベンジャーズ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q135', v2: true, answer: '東京リベンジャーズ',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'tension', seed: 13510,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.6, 'drone', 0.5], [23.4, 'alarm', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'drone', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '夜': 'よる', '見覚え': 'みおぼえ', '名前': 'なまえ', '中学時代': 'ちゅうがくじだい', '付き合った': 'つきあった', '恋人': 'こいびと', '主人公': 'しゅじんこう', '人生': 'じんせい', '何から': 'なにから', '逃げて': 'にげて', '毎日': 'まいにち', '次の日': 'つぎのひ', '駅': 'えき', '背中': 'せなか', '押された': 'おされた', '目を開ける': 'めをあける', '12年前': 'じゅうにねんまえ', '今度': 'こんど', '彼女': 'かのじょ', '死なせない': 'しなせない', '2021年': 'にせんにじゅういちねん', '日本': 'にほん', '原作': 'げんさく', '実写映画': 'じっしゃえいが', '漫画': 'まんが', '未来': 'みらい', '命': 'いのち', '最凶': 'さいきょう', '不良集団': 'ふりょうしゅうだん', '飛びこんで': 'とびこんで', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '東京': 'とうきょう', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この作品のタイトル、わかる？\n夜のニュースに、見覚えのある名前。中学時代に付き合った、ただひとりの恋人だった。主人公は、人生どん底のフリーター。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'U-NEXT', 'アニメ好き', '日本のアニメ'],
  },
});
applyQuizCards({ answer: '東京<br>リベンジャーズ', info: 'Netflix・U-NEXT｜日本のアニメ・全24話', answerSize: 120 });
