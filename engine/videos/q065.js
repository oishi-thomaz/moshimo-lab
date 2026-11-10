import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #065 キム秘書はいったい、なぜ？（ドラマ・韓国・2018年・tvN・全16話。Prime Video・Disney+・Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/gimbiseoga-wae-geureolgga で2026/11/10確認。Filmarks 4.1・レビュー55,285件 filmarks.com/dramas/4158/6235）
// 確かめた事実（Filmarks の作品紹介・ja.wikipedia.org/wiki/キム秘書はいったい、なぜ？。2026/11/10）：
//   ・完璧なルックスと卓越した経営能力を持つ大企業の副会長。筋金入りのナルシスト（Wikipedia）
//   ・その彼が唯一そばに置く、9年間彼を支えてきた女性秘書。熟年夫婦のような阿吽の呼吸（Filmarks）
//   ・ある日突然、秘書が退社を宣言。新たな人生を歩みたいという彼女を、副会長はあの手この手で引き留める（Wikipedia）
//   ・2018年6月6日〜7月26日 韓国 tvN、全16話。原作は2013年のウェブ小説、ロマンティック・コメディ（Wikipedia・Filmarks の話数）
// 構成（ヒント6段）：1 9年支えた秘書が突然、辞めますと言った → 2 上司は大企業の副会長、完璧で自分が大好き
//   → 3 言わなくても通じ合う、まるで長年連れそった夫婦 → 4 新しい人生を歩みたい彼女、あの手この手で引き留める
//   → 5 2018年の韓国ドラマ・全16話、ウェブ小説が原作のラブコメ → 6 決め手：辞める理由がわからない副会長、タイトルは秘書の名前と なぜ？
// 人物名・会社名は出さない（6段目も名前そのものは言わない）。物語の先や結末は言わない。俳優の顔・ロゴ・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#1a1e2a', floor: '#2a2e38', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(6565);

const BOSS = { skin: '#f0cfae', hair: '#1a1614', shirt: '#3a3e4e', pants: '#2a2c36', tie: true };
const BOSS_W = { skin: '#f0cfae', hair: '#1a1614', shirt: '#e8e4dc', pants: '#d8d4cc', tie: true };
const SEC = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#f4efe6', pants: '#2a2a34', long: true, skirt: true };
const STAFF = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f5d3b5'][i % 3], hair: ['#1d1a19', '#4a3426', '#2c2421'][i % 3], shirt: ['#5a6a8a', '#8a6a5a', '#6a8a7a', '#9a7a9a'][i % 4], pants: '#2b3346', long: i % 2 === 1, skirt: i % 2 === 1 });

const glass = (c = '#9ec4e8') => new THREE.MeshPhongMaterial({ color: c, transparent: true, opacity: 0.35, shininess: 100 });
function nightWindow(w, h, seed) { return canvasTex(512, Math.round(512 * h / w), (g, W, H) => { g.fillStyle = '#0e1626'; g.fillRect(0, 0, W, H); const r = rng(seed); for (let i = 0; i < 26; i++) { const bw = 20 + r() * 50, bh = 80 + r() * H * 0.7, x = r() * W; g.fillStyle = '#1c2840'; g.fillRect(x, H - bh, bw, bh); for (let y = H - bh + 8; y < H - 6; y += 14) for (let xx = x + 4; xx < x + bw - 6; xx += 10) if (r() < 0.45) { g.fillStyle = r() < 0.5 ? '#ffd890' : '#fff2cc'; g.fillRect(xx, y, 5, 7); } } }); }
function envelope(label) { return canvasTex(400, 260, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8d0c0'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#1a1a1a'; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, w / 2, h / 2 + 6); }); }

// ---------- 1段目. 夜の副会長室（x=0）。机の上に、白い封筒。秘書と副会長 ----------
{ const fl = box(14, 0.04, 10, mat('#3a3430')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.4), new THREE.MeshBasicMaterial({ map: nightWindow(12, 5.4, 11) })); win.position.set(0, 2.9, -4.4); qs.add(win);
  for (const x of [-4, 0, 4]) { const f = box(0.08, 5.4, 0.08, mat('#1a1a1e')); f.position.set(x, 2.9, -4.35); qs.add(f); }
  const desk = box(3.2, 0.12, 1.4, mat('#2a1e18')); desk.position.set(0, 0.9, -1.6); qs.add(desk);
  const dfront = box(3.2, 0.84, 0.08, mat('#1e1612')); dfront.position.set(0, 0.45, -0.95); qs.add(dfront);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.24, 16), new THREE.MeshBasicMaterial({ color: '#ffe2a8' })); lamp.position.set(-1.2, 1.3, -1.9); qs.add(lamp);
  const ls = box(0.03, 0.3, 0.03, mat('#2a2a2a')); ls.position.set(-1.2, 1.06, -1.9); qs.add(ls);
  const chair = box(0.8, 1.4, 0.2, mat('#1a1a1e')); chair.position.set(0, 1.0, -2.75); qs.add(chair); }
const ENV = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.585), new THREE.MeshBasicMaterial({ map: envelope('辞表') })); ENV.rotation.x = -Math.PI / 2.8; ENV.position.set(-0.3, 1.1, -1.25); qs.add(ENV);
const boss1 = makePerson(BOSS); boss1.position.set(0, 0, -2.3); qs.add(boss1);
const sec1 = makePerson(SEC); sec1.position.set(1.1, 0, -0.5); sec1.rotation.y = Math.PI - 0.5; qs.add(sec1);
const tNine = tag('9年、支えてきた秘書', { size: 58, w: 640, bg: '#14161c', sx: 2.2 }); tNine.position.set(-0.4, 2.6, -0.4); qs.add(tNine);
const tQuit = tag('突然、辞めます', { size: 70, w: 560, bg: '#e2483c', sx: 2.0 }); tQuit.position.set(-0.4, 2.6, -0.4); qs.add(tQuit);

// ---------- 2段目. 鏡の前（x=40）。白いスーツの副会長が、自分にうっとり ----------
const MX = 40;
{ const fl = box(12, 0.04, 10, mat('#c8c0b4')); fl.position.set(MX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#e8e0d4')); wl.position.set(MX, 3, -3.2); qs.add(wl);
  const frame = box(2.4, 3.4, 0.12, mat('#c8a050')); frame.position.set(MX, 1.9, -3.05); qs.add(frame); }
const MIRROR = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.1), new THREE.MeshPhongMaterial({ color: '#cfe0ee', shininess: 120, emissive: '#3a4a58' })); MIRROR.position.set(MX, 1.9, -2.97); qs.add(MIRROR);
const boss2 = makePerson(BOSS_W); boss2.position.set(MX, 0, -1.4); boss2.rotation.y = Math.PI; qs.add(boss2);
const boss2m = makePerson(BOSS_W); boss2m.position.set(MX, 0, -4.55); boss2m.visible = false; qs.add(boss2m); // 鏡の中（壁の向こうに置いて、鏡を半透明に）
{ const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.1), new THREE.MeshBasicMaterial({ color: '#e8e0d4', side: THREE.BackSide })); hole.position.set(MX, 1.9, -3.31); qs.add(hole); }
const SPARK = []; { const sm = new THREE.MeshBasicMaterial({ color: '#fff2a0' }); for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), sm); s.userData.a = R() * 6; s.userData.r = 0.5 + R() * 0.6; s.position.set(MX, 1.9, -1.4); qs.add(s); SPARK.push(s); } }
const tVice = tag('大企業の副会長', { size: 66, w: 560, bg: '#14161c', sx: 1.5 }); tVice.position.set(MX + 0.1, 2.75, -1.6); qs.add(tVice);
const tLove = tag('自分が大好き', { size: 74, w: 520, bg: '#e85a8a', sx: 1.4 }); tLove.position.set(MX + 0.1, 2.75, -1.6); qs.add(tLove);

// ---------- 3段目. 明るいオフィスの廊下（x=80）。並んで歩く二人。言わなくても書類が出てくる ----------
const OX = 80;
{ const fl = box(14, 0.04, 12, mat('#b8bcc4')); fl.position.set(OX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4), glass()); p.position.set(OX - 5.5 + i * 2.3, 2, -4.5); qs.add(p); const f = box(0.06, 4, 0.06, mat('#8a8e98')); f.position.set(OX - 6.6 + i * 2.3, 2, -4.45); qs.add(f); }
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), new THREE.MeshBasicMaterial({ color: '#d8e4ee' })); bk.position.set(OX, 3, -6); qs.add(bk);
  for (let i = 0; i < 4; i++) { const d = box(1.4, 0.75, 0.7, mat('#e8e4dc')); d.position.set(OX - 4.5 + i * 3, 0.38, -5.4); qs.add(d); } }
const boss3 = makePerson(BOSS); boss3.position.set(OX - 0.45, 0, -2); qs.add(boss3);
const sec3 = makePerson(SEC); sec3.position.set(OX + 0.45, 0, -2); qs.add(sec3);
const DOC = box(0.34, 0.03, 0.46, mat('#f4f4f0')); DOC.position.set(OX, 0.9, -2); qs.add(DOC);
const STAFF3 = []; for (let i = 0; i < 3; i++) { const p = makePerson(STAFF(i)); p.position.set(OX - 4.5 + i * 3, 0, -4.9); qs.add(p); STAFF3.push(p); }
const tSync = tag('言わなくても、通じる', { size: 60, w: 640, bg: '#14161c', sx: 1.8 }); tSync.position.set(OX, 2.75, 0.4); qs.add(tSync);
const tCouple = tag('まるで、長年の夫婦', { size: 62, w: 620, bg: '#e6b450', color: '#14161c', sx: 1.8 }); tCouple.position.set(OX, 2.75, 0.4); qs.add(tCouple);

// ---------- 4段目. エレベーターの前（x=120）。荷物の箱を持った秘書と、花束で引き留める副会長 ----------
const EX = 120;
{ const fl = box(14, 0.04, 10, mat('#4a4a52')); fl.position.set(EX, 0.02, -1); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#6a6a74')); wl.position.set(EX, 3, -3.2); qs.add(wl);
  for (const s of [-1, 1]) { const d = box(0.9, 2.4, 0.06, new THREE.MeshPhongMaterial({ color: '#c8ccd4', shininess: 90 })); d.position.set(EX + s * 0.46, 1.2, -3.06); qs.add(d); }
  const fr = box(2.2, 2.7, 0.04, mat('#2a2a30')); fr.position.set(EX, 1.35, -3.1); qs.add(fr);
  const ind = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshBasicMaterial({ color: '#ffb040' })); ind.position.set(EX, 2.95, -3.05); qs.add(ind); }
const sec4 = makePerson(SEC); sec4.position.set(EX + 0.9, 0, -1.6); sec4.rotation.y = 0.4; qs.add(sec4);
const BOXC = box(0.6, 0.36, 0.4, mat('#c8a878')); BOXC.position.set(EX, 1, -1); qs.add(BOXC);
const boss4 = makePerson(BOSS); boss4.position.set(EX - 0.6, 0, -1.0); qs.add(boss4);
const BOUQ = new THREE.Group(); { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 12), mat('#f4e8d8')); cone.rotation.x = Math.PI; BOUQ.add(cone); for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(['#e2483c', '#f28ab0', '#ffffff'][i % 3])); f.position.set((R() - 0.5) * 0.3, 0.3 + R() * 0.12, (R() - 0.5) * 0.3); BOUQ.add(f); } } BOUQ.position.set(EX, 1, -1); qs.add(BOUQ);
const tNew = tag('新しい人生へ', { size: 72, w: 500, bg: '#14161c', sx: 2.1 }); tNew.position.set(EX + 0.2, 2.75, -0.6); qs.add(tNew);
const tStop = tag('あの手この手で', { size: 70, w: 540, bg: '#e2483c', sx: 2.2 }); tStop.position.set(EX + 0.2, 2.75, -0.6); qs.add(tStop);

// ---------- 5段目. テレビの前（x=160）。2018年の韓国ドラマ・全16話・ラブコメ ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#241c28' })); bg.position.set(TX, 4, -3); qs.add(bg);
  const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f2a0b8'); gr.addColorStop(1, '#7a4a8a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; const heart = (x, y, s) => { g.beginPath(); g.moveTo(x, y + s * 0.3); g.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3); g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s); g.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3); g.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3); g.fill(); }; for (let i = 0; i < 16; i++) heart(40 + (i % 8) * 62, 70 + Math.floor(i / 8) * 100, 40); }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
const tKR = tag('2018年 韓国ドラマ', { size: 64, w: 620, bg: '#e6b450', color: '#14161c', sx: 3.1 }); tKR.position.set(TX, 4.6, -1.2); qs.add(tKR);
const t16 = tag('全16話', { size: 80, w: 340, bg: '#3a7ad8', sx: 2.0 }); t16.position.set(TX, 4.6, -1.2); qs.add(t16);
const tRom = tag('ウェブ小説が原作のラブコメ', { size: 54, w: 760, bg: '#e85a8a', sx: 3.4 }); tRom.position.set(TX, 3.7, -1.0); qs.add(tRom);

// ---------- 6段目. 机の上の封筒に、大きな ？（x=200） ----------
const QX = 200;
{ const fl = box(12, 0.04, 10, mat('#2a2622')); fl.position.set(QX, 0.02, -1); qs.add(fl);
  const desk = box(3.2, 0.12, 1.6, mat('#2a1e18')); desk.position.set(QX, 0.9, -1.2); qs.add(desk);
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ color: '#141822' })); bk.position.set(QX, 3, -4); qs.add(bk); }
const ENV6 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.715), new THREE.MeshLambertMaterial({ map: envelope('辞表') })); ENV6.rotation.x = -Math.PI / 2.6; ENV6.position.set(QX, 1.12, -1.0); qs.add(ENV6);
const QM = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e2483c'; g.font = '900 230px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('？', w / 2, h / 2 + 10); }), transparent: true, depthWrite: false })); QM.position.set(QX, 2.4, -1.2); qs.add(QM);
const boss6 = makePerson(BOSS); boss6.position.set(QX - 1.3, 0, -0.4); boss6.rotation.y = 0.9; qs.add(boss6);
const tWhy = tag('辞める理由が、わからない', { size: 56, w: 720, bg: '#14161c', sx: 2.6 }); tWhy.position.set(QX - 0.2, 3.55, -0.6); qs.add(tWhy);
const tTitle = tag('タイトルは なぜ？で終わる', { size: 56, w: 740, bg: '#e2483c', sx: 2.6 }); tTitle.position.set(QX - 0.2, 3.55, -0.6); qs.add(tTitle);

// ---------- shots ----------
const ALL = [tNine, tQuit, tVice, tLove, tSync, tCouple, tNew, tStop, tKR, t16, tRom, tWhy, tTitle];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotOffice(t, quiz = 0) { // 1段目 0〜9：9年支えた秘書が、突然 辞めますと言った（0秒目がサムネ。封筒はもう机の上）
  base(); S.aim(0, -1); lift(0); S.hemi.intensity = 0.8; S.darken(0.4, '#05060a');
  const jump = quiz ? 1 : ease(clamp((t - 5.4) / 0.4));
  boss1.position.y = jump * 0.12 * Math.max(0, 1 - (t - 5.8) * 2) ; boss1.userData.arms.forEach(a => { a.rotation.x = -0.9 * jump; a.rotation.z = 0; }); boss1.userData.arms[0].rotation.z = 0.5 * jump; boss1.userData.arms[1].rotation.z = -0.5 * jump;
  sec1.userData.head.rotation.x = 0.15; sec1.userData.arms[1].rotation.x = t < 3.0 && !quiz ? -0.8 * Math.sin(Math.PI * clamp(t / 3.0)) : 0;
  if (!quiz) { tNine.userData.pop(1); if (t > 4.4) tNine.visible = false; tQuit.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.6, -0.4, u), lerp(2.5, 2.3, u), lerp(5.0, 4.2, u), 0.0, 1.1, -1.6, 56);
  return qs;
}
function shotMirror(t) { // 2段目 9〜17：上司は大企業の副会長。完璧で、自分が大好き
  base(); S.aim(MX, -1); lift(0); S.hemi.intensity = 1.25;
  const k = Math.sin(t * 2.2) * 0.12;
  boss2.userData.arms[1].rotation.x = -2.2 + k; boss2.userData.arms[1].rotation.z = 0.3; boss2m.userData.arms[0].rotation.x = -2.2 + k; boss2m.userData.arms[0].rotation.z = -0.3;
  boss2.userData.head.rotation.y = Math.sin(t * 1.2) * 0.2; boss2m.userData.head.rotation.y = -Math.sin(t * 1.2) * 0.2;
  SPARK.forEach((s, i) => { const a = s.userData.a + t * 1.5; s.position.set(MX + Math.cos(a) * s.userData.r, 1.9 + Math.sin(a * 1.3) * 0.5, -1.4 + Math.sin(a) * 0.3); s.rotation.y = t * 3; s.visible = t > 4.2; s.scale.setScalar(0.7 + 0.5 * Math.abs(Math.sin(t * 4 + i))); });
  tVice.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tVice.visible = false; tLove.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(MX + lerp(1.9, 1.5, u), lerp(2.0, 1.9, u), lerp(2.4, 1.9, u), MX - 0.3, 1.7, -2.6, 56);
  return qs;
}
function shotHall(t) { // 3段目 17〜25：言わなくても通じ合う。まるで長年の夫婦
  base(); S.aim(OX, -2); lift(0); S.hemi.intensity = 1.3;
  const z = lerp(-2.6, 0.2, clamp(t / 8));
  boss3.position.set(OX - 0.45, 0, z); sec3.position.set(OX + 0.45, 0, z - 0.25); boss3.rotation.y = 0; sec3.rotation.y = 0;
  poseWalk(boss3, t * 6, 0.8); poseWalk(sec3, t * 6, 0.8);
  const hand = ease(clamp((t - 4.4) / 0.6));
  boss3.userData.arms[1].rotation.x = lerp(boss3.userData.arms[1].rotation.x, -1.2, hand); sec3.userData.arms[0].rotation.x = lerp(sec3.userData.arms[0].rotation.x, -1.2, hand); sec3.userData.arms[0].rotation.z = 0.3 * hand; boss3.userData.arms[1].rotation.z = -0.3 * hand;
  DOC.position.set(OX, 0.88 + 0.12 * hand, z + 0.35); DOC.visible = t > 3.6;
  STAFF3.forEach((p, i) => { p.rotation.y = 0.3 * Math.sin(t + i); });
  tSync.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSync.visible = false; tCouple.userData.pop((t - 4.4) / 0.35);
  tSync.position.z = z - 0.2; tCouple.position.z = z - 0.2;
  look(OX + 0.4, 1.9, z + 3.6, OX, 1.3, z - 0.4, 56);
  return qs;
}
function shotLift(t) { // 4段目 25〜33：新しい人生を歩みたい彼女。あの手この手で引き留める
  base(); S.aim(EX, -1); lift(0); S.hemi.intensity = 1.1;
  sec4.userData.arms.forEach(a => { a.rotation.x = -1.0; }); BOXC.position.set(sec4.position.x + 0.12, 1.05, sec4.position.z + 0.42);
  const step = ease(clamp((t - 4.2) / 0.6));
  boss4.position.x = lerp(EX - 0.6, EX + 0.1, step); boss4.rotation.y = lerp(0.2, 0.9, step);
  boss4.userData.arms[1].rotation.x = -1.3 * step; BOUQ.visible = t > 4.2; BOUQ.position.set(boss4.position.x + 0.42, 1.2, boss4.position.z + 0.45);
  sec4.userData.head.rotation.y = t > 4.8 ? -0.4 : 0;
  tNew.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNew.visible = false; tStop.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(EX + lerp(0.6, 0.3, u), lerp(1.9, 1.8, u), lerp(4.6, 3.8, u), EX + 0.2, 1.3, -1.4, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2018年の韓国ドラマ。全16話。ウェブ小説が原作のラブコメ
  base(); S.aim(TX, 0); lift(0); S.hemi.intensity = 1.1;
  tKR.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKR.visible = false;
  t16.userData.pop((t - 4.2) / 0.35); tRom.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, 2.8, lerp(8.0, 7.2, u), TX + 0.4, 2.7, -1.5, 56);
  return qs;
}
function shotWhy(t) { // 6段目 42〜49（決め手）：辞める理由がわからない副会長。タイトルは秘書の名前と なぜ？
  base(); S.aim(QX, -1); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#05060a');
  const q = ease(clamp((t - 3.4) / 0.4)); QM.scale.setScalar(Math.max(1e-4, q * (1 + 0.05 * Math.sin(t * 6)))); QM.visible = q > 0.01;
  boss6.userData.arms[0].rotation.x = -2.6; boss6.userData.arms[0].rotation.z = 0.2; boss6.userData.head.rotation.z = Math.sin(t * 1.5) * 0.15;
  tWhy.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tWhy.visible = false; tTitle.userData.pop((t - 3.4) / 0.3);
  const u = ease(t / 7);
  look(QX + lerp(0.4, 0.2, u), lerp(2.6, 2.5, u), lerp(5.6, 4.8, u), QX - 0.3, 1.8, -1.0, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の副会長室。封筒にだけ光）
  shotOffice(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.8, 0.3, d);
  S.spot.color.set(0xffe8c0); S.spot.position.set(0.2, 4, -0.6); S.spot.target.position.set(0.15, 0.95, -1.3); S.spot.intensity = lerp(0, 40, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(lerp(0.8, 0.5, k), lerp(2.1, 2.3, k), lerp(3.8, 3.2, k), 0.15, 1.0, -1.4, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotOffice(t, 0) },
  { a: 9, b: 17, f: shotMirror },
  { a: 17, b: 25, f: shotHall },
  { a: 25, b: 33, f: shotLift },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotWhy },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '9年間、そばで<br>支えてきた秘書が、'],
  [5.6, 9.0, 'ある日突然、<br>辞めますと言った。'],
  [9.2, 13.2, '上司は、大企業の<br>副会長。'],
  [13.2, 17.0, '見た目も仕事も完璧で、<br>自分が大好きな男。'],
  [17.2, 21.0, '二人は、言葉がなくても<br>通じ合う名コンビ。'],
  [21.0, 25.0, 'まるで、長年<br>連れそった夫婦のよう。'],
  [25.2, 29.0, '彼女は、新しい人生を<br>歩みたいという。'],
  [29.0, 33.0, '副会長は、あの手この手で<br>引き留めようとする。'],
  [33.2, 37.4, '2018年の韓国ドラマ。<br>全16話。'],
  [37.4, 41.8, 'ウェブ小説が原作の、<br>ラブコメディ。'],
  [42.2, 45.4, '辞める理由がわからず、<br>完璧な男が大混乱。'],
  [45.4, 49.0, 'タイトルは、秘書の名前と<br>なぜ？という言葉。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、キム秘書は<br>いったい、なぜ？'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q065', v2: true, answer: 'キム秘書はいったい、なぜ？',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 6565,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '9年間': 'きゅうねんかん', '支えてきた': 'ささえてきた', '秘書': 'ひしょ', '突然': 'とつぜん', '辞めます': 'やめます', '辞める': 'やめる', '言った': 'いった', '上司': 'じょうし', '大企業': 'だいきぎょう', '副会長': 'ふくかいちょう', '見た目': 'みため', '仕事': 'しごと', '完璧': 'かんぺき', '自分': 'じぶん', '大好き': 'だいすき', '二人': 'ふたり', '言葉': 'ことば', '通じ合う': 'つうじあう', '名コンビ': 'めいコンビ', '長年': 'ながねん', '連れそった': 'つれそった', '夫婦': 'ふうふ', '彼女': 'かのじょ', '新しい人生': 'あたらしいじんせい', '歩みたい': 'あゆみたい', 'あの手この手': 'あのてこのて', '引き留め': 'ひきとめ', '2018年': 'にせんじゅうはちねん', '韓国': 'かんこく', '全16話': 'ぜんじゅうろくわ', 'ウェブ小説': 'ウェブしょうせつ', '原作': 'げんさく', '理由': 'りゆう', '大混乱': 'だいこんらん', '名前': 'なまえ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', 'キム秘書': 'キムひしょ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n9年間、そばで支えてきた秘書が、ある日突然、辞めますと言った。上司は、大企業の副会長。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'ディズニープラス', '韓国ドラマ', 'ラブコメ'],
  },
});
applyQuizCards({ answer: 'キム秘書は<br><span style="font-size:76px">いったい、なぜ？</span>', info: 'Prime Video・Disney+｜韓国ドラマ・全16話', answerSize: 112 });
