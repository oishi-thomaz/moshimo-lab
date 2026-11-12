import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #075 サイコだけど大丈夫（ドラマ・韓国・2020年。Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/saikojiman-gwaencanha で2026/11/12確認（Filmarks の動画配信欄も Netflix 見放題）。
//   Filmarks 4.2・レビュー30,131件 filmarks.com/dramas/9249/13133）
// 確かめた事実（Filmarks・JustWatch・Netflix の作品ページ netflix.com/jp/title/81243992、ja.wikipedia.org/wiki/サイコだけど大丈夫。2026/11/12）：
//   ・愛を知らない人気童話作家と、精神病棟で献身的に働く男。互いの心に癒やしをもたらす（Filmarks・JustWatch・Netflix）
//   ・第1話：勤務する病院で、兄が大好きな作家に出会った主人公は、作家の朗読会で起きた思わぬ事件に巻き込まれる（Netflix）
//   ・第2話：故郷で働き口があることを耳にする。第3話：勤務先を変えた主人公を作家が追いかけてくる（Netflix）
//   ・主人公は幼少期に両親を亡くした。兄は作家の大ファン。人生の重さを抱えて愛を拒否してきた主人公と、愛が何かわからない作家が、
//     互いの傷を治癒していくロマンティックコメディ（Wikipedia）
//   ・2020年6月20日から tvN で放送された韓国ドラマ（Wikipedia）。各話のタイトルは 悪夢を食べて育った少年・美女と野獣 など童話の題（Netflix）
// 構成（ヒント6段）：1 人気作家の朗読会で思わぬ事件 → 2 主人公は病院で働く青年、両親を亡くし兄を守ってきた
//   → 3 新しい職場は故郷の町の病院、そこへ作家が追ってくる → 4 愛を知らない作家と愛を拒む青年、兄は作家の大ファン
//   → 5 2020年の韓国ドラマ、心の傷を癒やすラブコメ → 6 決め手：各話のタイトルが童話の題・タイトルに 大丈夫
// 人物名・病院名・地名は出さない。俳優の顔・ポスター・ロゴ・衣装の再現・有名な場面の構図は使わない。患者さんを笑いものにする描き方はしない。人は汎用の3D。結末は言わない

const S = quizStage({ bg: '#d8e4ec', floor: '#b8c0b0', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(7575);

const HERO = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#e9e4da', pants: '#2b3346' };
const WRITER = { skin: '#f4d3b5', hair: '#1a1a22', shirt: '#8a1f2c', pants: '#8a1f2c', long: true, skirt: true };
const BRO = { skin: '#e8b98f', hair: '#2c2421', shirt: '#4fa3d1', pants: '#5a4a3a' };
const AUD = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#1d1a19', '#4a3426', '#2c2421', '#6b4a33'][i % 4], shirt: ['#e9e4da', '#f2c14e', '#c94f7c', '#4fa3d1', '#59606e'][i % 5], pants: '#3b3f4a', long: i % 2 === 0, skirt: i % 3 === 0 });

function book(c = '#e6b450') { const g = new THREE.Group(); const cv = box(0.34, 0.46, 0.06, mat(c)); g.add(cv); const pg = box(0.3, 0.42, 0.065, mat('#f8f4ea')); pg.position.x = 0.02; g.add(pg); return g; }

// ---------- 1段目. 朗読会（x=0）。並んだ椅子、壇上の作家、会場のうしろに青年 ----------
{ const fl = box(16, 0.04, 14, mat('#a08a70')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(16, 6, 0.2, mat('#efe6d8')); wl.position.set(0, 3, -6.5); qs.add(wl);
  const st = box(5, 0.4, 2.4, mat('#6a4a34')); st.position.set(0, 0.2, -5.0); qs.add(st);
  const bn = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(440, 120, (g, w, h) => { g.fillStyle = '#2a3a5a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6b450'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(30 + i * 48, h / 2, 8, 0, Math.PI * 2); g.fill(); } }) })); bn.position.set(0, 4.2, -6.38); qs.add(bn);
  const lec = box(0.7, 1.1, 0.5, mat('#4a3424')); lec.position.set(0.9, 0.95, -4.6); qs.add(lec);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const ch = box(0.5, 0.08, 0.5, mat('#3a4a6a')); ch.position.set(-2.5 + c * 1.0, 0.45, -2.6 + r * 1.2); qs.add(ch); const bk = box(0.5, 0.5, 0.06, mat('#3a4a6a')); bk.position.set(-2.5 + c * 1.0, 0.72, -2.35 + r * 1.2); qs.add(bk); } }
const writer1 = makePerson(WRITER); writer1.position.set(0.9, 0.4, -5.2); qs.add(writer1);
const BOOK1 = book('#8e6bbf'); BOOK1.position.set(0.9, 1.6, -4.85); BOOK1.rotation.x = -0.5; qs.add(BOOK1);
const AUDS = []; for (let i = 0; i < 10; i++) { const p = makePerson(AUD(i)); const c = i % 5, r = Math.floor(i / 5); p.position.set(-2.0 + c * 1.0 + (r ? 0.5 : 0), 0.0, -2.6 + r * 1.2); p.rotation.y = Math.PI; p.scale.setScalar(0.96); qs.add(p); AUDS.push(p); }
AUDS.forEach(p => { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = -0.4; });
const hero1 = makePerson(HERO); hero1.position.set(-3.4, 0, -1.0); hero1.rotation.y = Math.PI - 0.5; qs.add(hero1);
const BANGS = []; for (let i = 0; i < 5; i++) { const b = tag('！', { size: 96, w: 150, h: 150, bg: '#e2483c', sx: 0.55 }); qs.add(b); BANGS.push(b); }
const tEvent = tag('朗読会で、事件', { size: 64, w: 520, bg: '#14161c', sx: 1.9 }); tEvent.position.set(0.6, 3.9, -4.6); qs.add(tEvent);
const tThere = tag('居合わせた青年', { size: 62, w: 520, bg: '#3a7ad8', sx: 1.9 }); tThere.position.set(-2.6, 2.75, -1.3); qs.add(tThere);

// ---------- 2段目. 病院の廊下（x=40）。患者さんの車いすを押す青年、そして兄と歩く ----------
const AX = 40;
{ const fl = box(6, 0.04, 30, mat('#d8dcd4')); fl.position.set(AX, 0.02, -10); qs.add(fl);
  for (const s of [-1, 1]) { const wl = box(0.2, 4, 30, mat('#eef2ee')); wl.position.set(AX + s * 2.6, 2, -10); qs.add(wl); const ln = box(0.22, 0.12, 30, mat('#7ab8a0')); ln.position.set(AX + s * 2.6, 1.0, -10); qs.add(ln);
    for (let i = 0; i < 5; i++) { const d = box(0.05, 2.2, 1.0, mat('#b8c8d0')); d.position.set(AX + s * 2.48, 1.1, -2 - i * 5); qs.add(d); } }
  for (let i = 0; i < 6; i++) { const lp = box(1.2, 0.05, 0.4, new THREE.MeshBasicMaterial({ color: '#ffffff' })); lp.position.set(AX, 3.95, -1 - i * 4); qs.add(lp); } }
const CHAIR = new THREE.Group(); { const m = mat('#59606e'); const s = box(0.5, 0.06, 0.5, mat('#2f4a7a')); s.position.y = 0.5; CHAIR.add(s); const b = box(0.5, 0.5, 0.06, mat('#2f4a7a')); b.position.set(0, 0.78, 0.25); CHAIR.add(b);
  for (const x of [-1, 1]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 20), m); wh.rotation.y = Math.PI / 2; wh.position.set(x * 0.3, 0.3, 0.05); CHAIR.add(wh); const hd = box(0.04, 0.04, 0.2, m); hd.position.set(x * 0.2, 1.0, 0.36); CHAIR.add(hd); } } qs.add(CHAIR);
const pat2 = makePerson({ skin: '#e8b98f', hair: '#9a9a9a', shirt: '#9ac4e8', pants: '#9ac4e8' }); pat2.userData.legs.forEach(l => l.rotation.x = -1.4); qs.add(pat2);
const hero2 = makePerson(HERO); hero2.position.set(AX, 0, -3); qs.add(hero2);
const bro2 = makePerson(BRO); bro2.position.set(AX + 0.5, 0, -5); qs.add(bro2);
CHAIR.position.set(AX, 0, -2); pat2.position.set(AX, 0, -2);
const tWork = tag('病院で働く青年', { size: 62, w: 520, bg: '#14161c', sx: 1.9 }); qs.add(tWork);
const tBro = tag('兄を、守ってきた', { size: 62, w: 540, bg: '#2f8f6b', sx: 1.9 }); qs.add(tBro);

// ---------- 3段目. 故郷の町の病院（x=80）。坂道の先の白い建物、そこへ作家がやってくる ----------
const BX = 80;
{ const gr = box(30, 0.04, 40, mat('#9ab878')); gr.position.set(BX, 0.02, -12); qs.add(gr);
  const rd = box(3, 0.05, 40, mat('#c8bca4')); rd.position.set(BX, 0.04, -12); qs.add(rd);
  const hb = box(12, 5, 4, mat('#f4f4ee')); hb.position.set(BX, 2.5, -20); qs.add(hb);
  const rf = box(12.4, 0.3, 4.4, mat('#3a7ab0')); rf.position.set(BX, 5.15, -20); qs.add(rf);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 6; i++) { const w = box(1.0, 0.9, 0.05, mat('#8ab8d8')); w.position.set(BX - 4.6 + i * 1.84, 1.6 + f * 2.0, -17.97); qs.add(w); }
  const dr = box(1.8, 2.2, 0.06, mat('#5a7a90')); dr.position.set(BX, 1.1, -17.95); qs.add(dr);
  const sea = box(80, 0.02, 30, mat('#4f8ac0')); sea.position.set(BX, 0.01, -45); qs.add(sea);
  for (let i = 0; i < 8; i++) { const s = (i % 2) ? 1 : -1; const tr = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.4, 8), mat('#3f7a4a')); tr.position.set(BX + s * (3 + (i % 3)), 1.2, -3 - i * 2); qs.add(tr); } }
const hero3 = makePerson(HERO); hero3.position.set(BX + 0.6, 0, -15.5); qs.add(hero3);
const writer3 = makePerson(WRITER); writer3.position.set(BX, 0, -6); qs.add(writer3);
const BAG3 = box(0.34, 0.5, 0.2, mat('#14161c')); BAG3.position.set(BX, 0.9, -6); qs.add(BAG3);
const tHome = tag('故郷の町の病院', { size: 62, w: 520, bg: '#14161c', sx: 1.9 }); qs.add(tHome);
const tCome = tag('あの作家が、来た', { size: 62, w: 540, bg: '#8a1f2c', sx: 1.9 }); qs.add(tCome);

// ---------- 4段目. 病院の庭（x=120）。作家と青年が向き合う。兄は本を抱えてうれしそう ----------
const CX = 120;
{ const gr = box(16, 0.04, 12, mat('#a8c890')); gr.position.set(CX, 0.02, -2); qs.add(gr);
  const wl = box(16, 5, 0.2, mat('#f4f4ee')); wl.position.set(CX, 2.5, -6); qs.add(wl);
  const bn = box(1.8, 0.08, 0.5, mat('#8a6a4a')); bn.position.set(CX + 2.4, 0.48, -2.6); qs.add(bn);
  for (let i = 0; i < 6; i++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(['#f2c14e', '#e86a9a', '#ffffff'][i % 3])); fl.position.set(CX - 4 + i * 1.4, 0.2, -5.4); qs.add(fl); } }
const hero4 = makePerson(HERO); hero4.position.set(CX + 0.65, 0, -1.6); hero4.rotation.y = -Math.PI / 2 - 0.3; qs.add(hero4);
const writer4 = makePerson(WRITER); writer4.position.set(CX - 0.65, 0, -1.6); writer4.rotation.y = Math.PI / 2 + 0.3; qs.add(writer4);
const bro4 = makePerson(BRO); bro4.position.set(CX + 2.2, 0, -2.4); qs.add(bro4);
const BOOK4 = book('#8e6bbf'); BOOK4.position.set(CX + 2, 1.3, -2); qs.add(BOOK4);
const STARS = []; for (let i = 0; i < 7; i++) { const s = tag('★', { size: 80, w: 120, h: 120, bg: '#e6b450', sx: 0.36 }); qs.add(s); STARS.push(s); }
const SPLIT = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 2.4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })); SPLIT.position.set(CX, 1.2, -1.6); qs.add(SPLIT);
const tOpp = tag('正反対のふたり', { size: 64, w: 520, bg: '#14161c', sx: 1.9 }); tOpp.position.set(CX, 2.9, -1.8); qs.add(tOpp);
const tFan = tag('兄は、大ファン', { size: 64, w: 500, bg: '#2f8f6b', sx: 1.8 }); tFan.position.set(CX + 1.6, 2.9, -2.2); qs.add(tFan);

// ---------- 5段目. 夜の部屋のテレビ（x=180）。2020年の韓国ドラマ ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#2e3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(3.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.1, -3.5); qs.add(tvb);
  const so = box(2.4, 0.5, 0.9, mat('#6a7a8f')); so.position.set(TX, 0.25, 1.2); qs.add(so); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f4c8b8'); gr.addColorStop(1, '#c8d8f0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 14; i++) { const x = (i * 157) % w, y = (i * 97) % h, r = 14 + (i % 4) * 6; g.beginPath(); g.moveTo(x, y + r * 0.4); g.bezierCurveTo(x - r, y - r * 0.5, x - r * 0.4, y - r, x, y - r * 0.3); g.bezierCurveTo(x + r * 0.4, y - r, x + r, y - r * 0.5, x, y + r * 0.4); g.fill(); } }) }));
TV.position.set(TX, 2.1, -3.42); qs.add(TV);
const BAND = new THREE.Group(); { for (let i = 0; i < 3; i++) { const b = box(0.7, 0.18, 0.18, mat('#f4f0e4')); b.position.x = (i - 1) * 0.5; b.rotation.z = (i - 1) * 0.6; BAND.add(b); } } BAND.position.set(TX, 4.3, -3.2); qs.add(BAND);
const t2020 = tag('2020年 韓国ドラマ', { size: 58, w: 620, bg: '#e6b450', color: '#14161c', sx: 2.4 }); t2020.position.set(TX, 4.1, -3.0); qs.add(t2020);
const tHeal = tag('心の傷を、癒やす', { size: 58, w: 600, bg: '#e86a9a', sx: 2.4 }); tHeal.position.set(TX, 4.1, -3.0); qs.add(tHeal);

// ---------- 6段目. 大きな絵本（x=220）。ページがめくれ、その前にふたり ----------
const DX = 220;
{ const fl = box(16, 0.04, 14, mat('#3a3050')); fl.position.set(DX, 0.02, -3); qs.add(fl); }
const BIGBOOK = new THREE.Group(); {
  const pageTex = (k) => canvasTex(400, 520, (g, w, h) => { g.fillStyle = '#fbf6e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8c8a0'; g.lineWidth = 10; g.strokeRect(20, 20, w - 40, h - 40);
    if (k === 0) { g.fillStyle = '#3a2a4a'; g.beginPath(); g.moveTo(w / 2, 90); g.lineTo(w / 2 + 110, 300); g.lineTo(w / 2 - 110, 300); g.closePath(); g.fill(); g.fillRect(w / 2 - 80, 300, 160, 140); g.fillStyle = '#e6b450'; g.fillRect(w / 2 - 20, 360, 40, 80); }
    else { g.fillStyle = '#8a1f2c'; for (let i = 0; i < 2; i++) { g.beginPath(); g.ellipse(140 + i * 120, 400, 40, 22, 0, 0, Math.PI * 2); g.fill(); g.fillRect(110 + i * 120, 300, 60, 100); } g.fillStyle = '#e6b450'; g.beginPath(); g.arc(w / 2, 150, 60, 0, Math.PI * 2); g.fill(); } });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshBasicMaterial({ map: pageTex(s < 0 ? 0 : 1), side: THREE.DoubleSide })); p.position.set(s * 1.32, 0, 0); p.rotation.y = -s * 0.18; BIGBOOK.add(p); }
  const sp = box(0.12, 3.4, 0.12, mat('#8a1f2c')); BIGBOOK.add(sp); }
BIGBOOK.position.set(DX, 2.6, -5.0); qs.add(BIGBOOK);
const FLIP = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshBasicMaterial({ color: '#fbf6e8', side: THREE.DoubleSide })); FLIP.geometry.translate(1.3, 0, 0); FLIP.position.set(DX, 2.6, -4.95); qs.add(FLIP);
const hero6 = makePerson(HERO); hero6.position.set(DX + 0.5, 0, -1.6); hero6.rotation.y = -0.25; qs.add(hero6);
const writer6 = makePerson(WRITER); writer6.position.set(DX - 0.5, 0, -1.6); writer6.rotation.y = 0.25; qs.add(writer6);
const GLOW = []; for (let i = 0; i < 18; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), new THREE.MeshBasicMaterial({ color: ['#ffd84a', '#ffffff', '#f4a8c8'][i % 3] })); qs.add(s); GLOW.push(s); }
const tFairy = tag('各話の題は、童話', { size: 60, w: 560, bg: '#14161c', sx: 2.3 }); tFairy.position.set(DX, 4.75, -3.6); qs.add(tFairy);
const tOk = tag('タイトルに「大丈夫」', { size: 58, w: 640, bg: '#8a1f2c', sx: 2.5 }); tOk.position.set(DX, 4.75, -3.6); qs.add(tOk);

// ---------- shots ----------
const ALL = [tEvent, tThere, tWork, tBro, tHome, tCome, tOpp, tFan, t2020, tHeal, tFairy, tOk];
function base() { S.reset(); ALL.forEach(x => x.visible = false); BANGS.forEach(b => b.visible = false); STARS.forEach(s => s.visible = false); GLOW.forEach(s => s.visible = false); BAND.visible = false; SPLIT.visible = false; }

function shotReading(t, quiz = 0) { // 1段目 0〜9：人気作家の朗読会で、思わぬ事件。その場に居合わせた青年（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.2;
  const hit = quiz ? 1 : (t > 1.2 ? 1 : 0);
  writer1.userData.arms.forEach(a => { a.rotation.x = hit ? -0.3 : -1.0; });
  writer1.rotation.y = hit ? -0.4 : 0;
  BOOK1.visible = !hit;
  if (hit) { S.darken(0.25, '#3a0a10'); S.hemi.intensity = 1.0;
    AUDS.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(i * 1.7) * 0.6; p.position.y = -0.4 + Math.abs(Math.sin(t * 6 + i)) * 0.06; });
    BANGS.forEach((b, i) => { b.visible = true; b.userData.pop(quiz ? 1 : (t - 1.3 - i * 0.12) / 0.25); b.position.set(-1.4 + i * 0.95 + (i > 1 ? 0.6 : 0), 2.9 + (i % 2) * 0.45, -4.4); }); }
  hero1.userData.head.rotation.y = hit ? 0.4 : 0;
  if (t > 4.6 && !quiz) { hero1.position.x = lerp(-3.4, -2.6, clamp((t - 4.6) / 1.5)); poseWalk(hero1, t * 7, t < 6.1 ? 1 : 0); }
  if (!quiz) { tEvent.userData.pop((t - 1.4) / 0.35); if (t > 4.4) tEvent.visible = false; tThere.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  if (t < 4.4 || quiz) look(lerp(0.4, 0.2, u), 2.4, lerp(1.4, 0.8, u), 0.7, 1.9, -5, 58);
  else look(-1.2, 2.0, 2.4, -2.6, 1.5, -1.6, 58);
  return qs;
}
function shotCorridor(t) { // 2段目 9〜17：青年の仕事は、病院で患者を支えること。幼いころに両親を亡くし、兄を守って生きてきた
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.35;
  if (t < 4.2) { const z = lerp(-1.0, -3.4, clamp(t / 4.2));
    CHAIR.visible = true; pat2.visible = true; bro2.visible = false;
    CHAIR.position.set(AX - 0.2, 0, z); CHAIR.rotation.y = 0; pat2.position.set(AX - 0.2, 0.0, z + 0.05); pat2.rotation.y = Math.PI;
    hero2.position.set(AX - 0.2, 0, z + 0.75); hero2.rotation.y = Math.PI; poseWalk(hero2, t * 6, 0.6); hero2.userData.arms.forEach(a => a.rotation.x = -1.1);
    tWork.position.set(AX, 2.6, z - 0.6); tWork.userData.pop((t - 0.5) / 0.35);
    look(AX + 1.3, 1.8, z + 3.4, AX - 0.2, 1.1, z - 0.4, 58);
  } else { CHAIR.visible = false; pat2.visible = false; bro2.visible = true;
    const z = lerp(-6.0, -4.4, clamp((t - 4.2) / 3.8));
    hero2.position.set(AX - 0.4, 0, z); hero2.rotation.y = 0; poseWalk(hero2, t * 5, 0.7); hero2.userData.arms[1].rotation.x = -0.3; hero2.userData.arms[1].rotation.z = -0.5;
    bro2.position.set(AX + 0.4, 0, z); bro2.rotation.y = 0; poseWalk(bro2, t * 5 + 1, 0.7); bro2.userData.head.rotation.y = -0.3;
    tBro.position.set(AX, 2.5, z - 0.4); tBro.userData.pop((t - 4.4) / 0.35);
    look(AX + 0.2, 1.7, z + 3.4, AX, 1.3, z, 56); }
  return qs;
}
function shotHome(t) { // 3段目 17〜25：新しい職場は、故郷の町の病院。そこへ、あの作家が追いかけてきた
  base(); S.aim(BX, -10); lift(0); S.hemi.intensity = 1.4; S.key.intensity = 1.6;
  hero3.rotation.y = t > 4.4 ? 0 : Math.PI; hero3.userData.head.rotation.y = 0;
  const wz = lerp(-4, -12.5, clamp((t - 3.6) / 4.4));
  writer3.visible = t > 3.6; writer3.position.set(BX - 0.3, 0, wz); writer3.rotation.y = Math.PI; poseWalk(writer3, t * 6, t < 8 ? 0.9 : 0);
  BAG3.visible = writer3.visible; BAG3.position.set(BX - 0.65, 0.95, wz);
  tHome.position.set(BX + 0.6, 3.0, -15.2); tCome.position.set(BX - 0.3, 2.7, wz - 0.4);
  tHome.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHome.visible = false; tCome.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.0) look(BX + 1.0, lerp(3.2, 2.8, u), lerp(-6, -8, u), BX, 2.2, -18, 58);
  else look(BX + 0.2, 2.0, wz + 3.8, BX - 0.3, 1.6, wz - 3, 58);
  return qs;
}
function shotGarden(t) { // 4段目 25〜33：愛を知らない作家と、愛を拒んできた青年。兄は、その作家の大ファンだった
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 1.3;
  SPLIT.visible = t < 4.2; hero4.userData.arms.forEach(a => a.rotation.x = 0); writer4.userData.arms[0].rotation.x = -0.4;
  hero4.rotation.y = t < 4.2 ? Math.PI / 2 + 0.6 : -Math.PI / 2 - 0.3;
  bro4.rotation.y = -0.4; bro4.userData.arms.forEach(a => a.rotation.x = t > 4.2 ? -1.3 : -0.2);
  BOOK4.position.set(CX + 2.05, 1.35 + (t > 4.2 ? Math.abs(Math.sin(t * 5)) * 0.08 : 0), -2.05); BOOK4.rotation.y = -0.4;
  if (t > 4.4) STARS.forEach((s, i) => { s.visible = true; const a = i * 0.9 + t * 1.2; s.position.set(CX + 2.2 + Math.cos(a) * 0.7, 2.0 + Math.sin(a * 1.3) * 0.3 + i * 0.05, -2.2 + Math.sin(a) * 0.2); });
  tOpp.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOpp.visible = false; tFan.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(CX, lerp(1.9, 1.8, u), lerp(3.6, 3.2, u), CX, 1.4, -1.6, 56);
  else look(CX + 1.0, 1.8, 2.4, CX + 1.4, 1.5, -2.2, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2020年の韓国のドラマ。互いの心の傷を癒やす、大人のラブコメ
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#0a0810');
  BAND.visible = t > 4.2; BAND.rotation.z = Math.sin(t * 2) * 0.1;
  t2020.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2020.visible = false; tHeal.userData.pop((t - 4.2) / 0.35);
  if (t > 4.2) tHeal.position.set(TX, 3.75, -3.0);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.8, 3.0, u), lerp(5.4, 4.6, u), TX, 2.6, -3.4, 58);
  return qs;
}
function shotBook(t) { // 6段目 42〜49（決め手）：毎回のタイトルは、童話の名前。その心は、本当に大丈夫？
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.1; S.darken(0.3, '#1a1030');
  const k = clamp(t / 2.0); FLIP.rotation.y = -Math.PI * ease(k) * 0.95; FLIP.visible = k < 1;
  hero6.userData.head.rotation.x = -0.2; writer6.userData.head.rotation.x = -0.2;
  if (t > 3.4) { writer6.userData.arms[0].rotation.x = -0.6; hero6.userData.arms[1].rotation.x = -0.6; }
  GLOW.forEach((s, i) => { s.visible = true; const a = i * 0.35 + t * 0.8; s.position.set(DX + Math.cos(a) * (2.0 + (i % 3) * 0.4), 1.4 + ((i * 0.31 + t * 0.25) % 1) * 3.2, -3.6 + Math.sin(a) * 0.6); s.rotation.y = t * 2; });
  tFairy.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tFairy.visible = false; tOk.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX, lerp(1.9, 2.0, u), lerp(4.4, 3.8, u), DX, 2.4, -4.4, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（朗読会に戻る）
  shotReading(8.0, 1);
  ALL.forEach(x => x.visible = false); BANGS.forEach(b => b.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.0, 0.55, d); S.darken(0.25 + 0.3 * d, '#2a1020');
  const k = ease(t / 7);
  look(lerp(0.2, 0.3, k), 2.4, lerp(0.8, 0.2, k), 0.7, 1.9, -5, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotReading(t, 0) },
  { a: 9, b: 17, f: shotCorridor },
  { a: 17, b: 25, f: shotHome },
  { a: 25, b: 33, f: shotGarden },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotBook },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '人気作家の朗読会で、<br>思わぬ事件が起きた。'],
  [5.6, 9.0, 'その場に居合わせた、<br>ひとりの青年。'],
  [9.2, 13.2, '青年の仕事は、病院で<br>患者さんを支えること。'],
  [13.2, 17.0, '幼いころに両親を亡くし、<br>兄を守って生きてきた。'],
  [17.2, 21.0, '新しい職場は、<br>故郷の町の病院。'],
  [21.0, 25.0, 'そこへ、あの作家が<br>追いかけてきた。'],
  [25.2, 29.0, '愛を知らない作家と、<br>愛を遠ざけてきた青年。'],
  [29.0, 33.0, '兄は、その作家の<br>大ファンだった。'],
  [33.2, 37.4, '2020年の、<br>韓国のドラマ。'],
  [37.4, 41.8, '互いの心の傷を癒やす、<br>大人のラブコメ。'],
  [42.2, 45.4, '毎回のタイトルは、<br>童話の名前。'],
  [45.4, 49.0, 'タイトルには、<br>大丈夫 の3文字。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、サイコだけど<br>大丈夫。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q075', v2: true, answer: 'サイコだけど大丈夫',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 7575,
    hits: [2.0, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [1.4, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '人気作家': 'にんきさっか', '朗読会': 'ろうどくかい', '思わぬ': 'おもわぬ', '事件': 'じけん', '起きた': 'おきた', '居合わせた': 'いあわせた', '青年': 'せいねん', '仕事': 'しごと', '病院': 'びょういん', '患者': 'かんじゃ', '支える': 'ささえる', '幼い': 'おさない', '両親': 'りょうしん', '亡くし': 'なくし', '兄': 'あに', '守って': 'まもって', '生きて': 'いきて', '新しい': 'あたらしい', '職場': 'しょくば', '故郷': 'こきょう', '町': 'まち', '作家': 'さっか', '追いかけて': 'おいかけて', '愛': 'あい', '知らない': 'しらない', '遠ざけて': 'とおざけて', '大ファン': 'だいファン', '2020年': 'にせんにじゅうねん', '韓国': 'かんこく', '互い': 'たがい', '心': 'こころ', '傷': 'きず', '癒やす': 'いやす', '大人': 'おとな', '毎回': 'まいかい', '童話': 'どうわ', '名前': 'なまえ', '大丈夫': 'だいじょうぶ', '3文字': 'さんもじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n人気作家の朗読会で、思わぬ事件が起きた。その場に居合わせたのは、病院で患者さんを支える青年。幼いころに両親を亡くし、兄を守って生きてきた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', '韓ドラ'],
  },
});
applyQuizCards({ answer: 'サイコだけど<br>大丈夫', info: 'Netflix｜韓国ドラマ', answerSize: 112 });
