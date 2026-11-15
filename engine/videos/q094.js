import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #094 グリーンブック（映画・アメリカ・2018年・130分。U-NEXT・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/gurinbutsuku で2026/11/15確認（Filmarks の動画配信欄も U-NEXT・Hulu 見放題）。
//   Filmarks 4.2・レビュー300,531件 filmarks.com/movies/80582）
// 確かめた事実（Filmarks の作品紹介、ja.wikipedia.org/wiki/グリーンブック_(映画) の 冒頭・概要。2026/11/15）：
//   ・1962年。ナイトクラブで用心棒を務める主人公は、腕っぷしもハッタリも得意。ガサツで無学だが、家族や周囲から愛されていた（Filmarks）
//   ・天才ピアニストのコンサートツアーの運転手として雇われる。人種差別が根強く残る時代に、黒人にとって制約と危険の多い南部を目指す（Filmarks）
//   ・何もかも正反対なふたりが、黒人用旅行ガイド〈グリーンブック〉を頼りにツアーへ旅立つ（Filmarks）
//   ・2018年のアメリカ映画。1962年に実際に行われたコンサートツアーにインスパイアされた作品。アカデミー賞 作品賞・助演男優賞など3部門（Wikipedia）
//   ・題名は、アフリカ系アメリカ人旅行者のためのガイドブックにちなむ（Wikipedia）
// 構成（ヒント6段）：1 腕っぷし自慢の男に運転手の仕事・行き先は危険の多い南の地方 → 2 主人公はクラブの用心棒でハッタリも得意・ガサツだけど家族に愛される
//   → 3 差別がまだ根強く残る時代・ある人たちには制約と危険の多い道 → 4 雇い主は天才的なピアニスト・何もかも正反対のふたり旅
//   → 5 2018年のアメリカ映画・アカデミー賞で作品賞など3部門 → 6 決め手：旅の頼りは緑の表紙のガイドブック・1962年に実際にあった旅がもと
// 旅先での出来事・結末は言わない。人物名・地名・店名は出さない。差別の場面そのものは描かない。俳優の顔・ポスター・ロゴ・劇中の車の色や有名な場面は使わない。人は汎用の3D
const S = quizStage({ bg: '#1c1a22', floor: '#26242a', fogNear: 28, fogFar: 100 });
const qs = S.scene;
const R = rng(9494);

const TONY = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#2a2e3a', pants: '#2a2e3a', tie: true };
const DOC = { skin: '#8a5a3a', hair: '#1a1410', shirt: '#e8e4dc', pants: '#1a1a1e', tie: true };
const WIFE = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#c8705a', pants: '#3a3a40', long: true, skirt: true };
const KIDA = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#4a7ad8', pants: '#3a3a40', scale: 0.62 };
const KIDB = { skin: '#f4d3b5', hair: '#2c2421', shirt: '#e6b450', pants: '#3a3a40', scale: 0.55 };
const GUEST = { skin: '#f1c9a5', hair: '#6a4a2a', shirt: '#8a2a2a', pants: '#2b2f3a' };
const GREEN = '#2e8a4a';

function car(col = '#2a3a5a') { const g = new THREE.Group();
  const b = box(3.6, 0.55, 1.5, mat(col)); b.position.y = 0.55; g.add(b);
  const cab = box(1.9, 0.5, 1.4, mat(col)); cab.position.set(-0.2, 1.05, 0); g.add(cab);
  const gl = box(1.92, 0.36, 1.42, new THREE.MeshStandardMaterial({ color: '#9ab8d0', transparent: true, opacity: 0.6 })); gl.position.set(-0.2, 1.06, 0); g.add(gl);
  const ch = box(3.7, 0.08, 1.52, mat('#d8dce4')); ch.position.y = 0.36; g.add(ch);
  for (const [x, z] of [[1.2, 0.75], [-1.2, 0.75], [1.2, -0.75], [-1.2, -0.75]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), mat('#141416')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.3, z); g.add(w); }
  for (const z of [-0.5, 0.5]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), new THREE.MeshBasicMaterial({ color: '#fff4c0' })); l.rotation.y = Math.PI / 2; l.position.set(1.81, 0.6, z); g.add(l); }
  return g; }

// ---------- 1段目. 夜のナイトクラブの裏口（x=0）。黒い服の男に、車のキーが差し出される。南を指す矢印 ----------
{ const fl = box(14, 0.04, 10, mat('#2a2a2e')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#5a3a3a')); wl.position.set(0, 3, -4.6); qs.add(wl);
  const door = box(1.4, 2.4, 0.06, mat('#2a1a1a')); door.position.set(-1.6, 1.2, -4.48); qs.add(door);
  const neon = box(3.2, 0.7, 0.06, new THREE.MeshBasicMaterial({ color: '#ff5a8a' })); neon.position.set(1.4, 3.6, -4.45); qs.add(neon);
  const neon2 = box(3.0, 0.5, 0.07, new THREE.MeshBasicMaterial({ color: '#2a0a1a' })); neon2.position.set(1.4, 3.6, -4.44); qs.add(neon2);
  for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); st.position.set(0.0 + i * 0.55, 3.6, -4.4); qs.add(st); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' })); lamp.position.set(-1.6, 2.7, -4.3); qs.add(lamp); }
const tony1 = makePerson(TONY); tony1.position.set(-0.6, 0, -2.2); tony1.rotation.y = 0.5; qs.add(tony1);
const man1 = makePerson(GUEST); man1.position.set(0.6, 0, -2.0); man1.rotation.y = -0.9; qs.add(man1);
const KEY1 = new THREE.Group(); { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), mat('#d8dce4')); KEY1.add(ring); const k = box(0.03, 0.14, 0.01, new THREE.MeshStandardMaterial({ color: '#e6c050', metalness: 0.8, roughness: 0.3 })); k.position.y = -0.1; KEY1.add(k); }
qs.add(KEY1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.4 }); Q1.position.set(-0.6, 2.25, -2.2); qs.add(Q1);
const tJob = tag('運転手の、仕事', { size: 60, w: 520, bg: '#14161c', sx: 1.6 }); tJob.position.set(0, 2.75, -2.6); qs.add(tJob);
const tSouth = tag('行き先は、南へ ↓', { size: 60, w: 560, bg: '#c8202c', sx: 1.7 }); tSouth.position.set(0, 2.75, -2.6); qs.add(tSouth);

// ---------- 2段目. クラブの中（x=40）。騒ぐ客をつまみ出す用心棒 → 家の食卓、家族にかこまれる ----------
const AX = 40;
{ const fl = box(12, 0.04, 8, mat('#3a1e22')); fl.position.set(AX, 0.02, -1.5); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#2a1a1e')); wl.position.set(AX, 2.5, -4.6); qs.add(wl);
  const stg = box(4, 0.4, 1.6, mat('#5a2a2a')); stg.position.set(AX, 0.2, -3.6); qs.add(stg);
  const cur = box(4.4, 3.4, 0.1, mat('#8a1a2a')); cur.position.set(AX, 2.1, -4.4); qs.add(cur);
  for (const x of [-3.5, 3.5]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 18), mat('#e8e4d8')); t.position.set(AX + x, 0.75, -1.8); qs.add(t); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' })); c.position.set(AX + x, 0.84, -1.8); qs.add(c); }
  // 家（右側）
  const hf = box(7, 0.04, 6, mat('#a8885a')); hf.position.set(AX + 14, 0.03, -1.5); qs.add(hf);
  const hw = box(7, 4, 0.2, mat('#e8d8b8')); hw.position.set(AX + 14, 2, -4.2); qs.add(hw);
  const tb = box(2.4, 0.06, 1.1, mat('#e8e4dc')); tb.position.set(AX + 14, 0.75, -2.4); qs.add(tb);
  const tbl = box(2.3, 0.7, 1.0, mat('#8a6a4a')); tbl.position.set(AX + 14, 0.37, -2.4); qs.add(tbl);
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14), mat('#ffffff')); p.position.set(AX + 13.1 + i * 0.6, 0.8, -2.4 + (i % 2 ? 0.25 : -0.25)); qs.add(p); }
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.2, 16), mat('#c84a2a')); pot.position.set(AX + 14, 0.88, -2.4); qs.add(pot); }
const tony2 = makePerson(TONY); tony2.position.set(AX - 0.4, 0, -1.6); qs.add(tony2);
const guest2 = makePerson(GUEST); guest2.position.set(AX + 0.2, 0, -1.6); qs.add(guest2);
const FAM2 = [[TONY, -1.4, 0], [WIFE, 1.4, 0], [KIDA, -0.4, -0.9], [KIDB, 0.4, -0.9]].map(([o, x, z]) => { const p = makePerson(o); p.position.set(AX + 14 + x, 0, -2.4 + z); p.rotation.y = x < -1 ? Math.PI / 2 : x > 1 ? -Math.PI / 2 : 0; qs.add(p); return p; });
const HEART2 = []; for (let i = 0; i < 3; i++) { const h = tag('♥', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#ff6a8a', sx: 0.3 }); qs.add(h); HEART2.push(h); }
const tBouncer = tag('腕っぷしの強い、用心棒', { size: 54, w: 680, bg: '#14161c', sx: 2.1 }); tBouncer.position.set(AX, 3.0, -2.4); qs.add(tBouncer);
const tFamily = tag('家族に、愛されている', { size: 58, w: 620, bg: '#c8902c', sx: 1.9 }); tFamily.position.set(AX + 14, 2.75, -2.9); qs.add(tFamily);

// ---------- 3段目. 南へのびる田舎道（x=80）。曇り空、道ばたの注意の看板。一台の車 ----------
const BX = 80;
{ const gr = box(40, 0.04, 40, mat('#7a8a4a')); gr.position.set(BX, 0.02, -14); qs.add(gr);
  const road = box(3, 0.03, 40, mat('#3a3a3e')); road.position.set(BX, 0.05, -14); qs.add(road);
  for (let i = 0; i < 12; i++) { const ln = box(0.12, 0.01, 1.0, mat('#e6c050')); ln.position.set(BX, 0.07, 2 - i * 3); qs.add(ln); }
  for (let i = 0; i < 14; i++) { const s = i % 2 ? 1 : -1; const t = new THREE.Group(); const tk = box(0.25, 2.6, 0.25, mat('#3a2a1a')); tk.position.y = 1.3; t.add(tk); const c = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), mat('#3a5a2a')); c.scale.y = 0.7; c.position.y = 3.0; t.add(c); t.position.set(BX + s * (4 + R() * 3), 0, -4 - i * 2.6); qs.add(t); }
  const post = box(0.08, 1.8, 0.08, mat('#8a8a84')); post.position.set(BX + 2.2, 0.9, -5); qs.add(post);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(180, 180, (g, w, h) => { g.fillStyle = '#e6b450'; g.translate(90, 90); g.rotate(Math.PI / 4); g.fillRect(-58, -58, 116, 116); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#14161c'; g.font = '900 90px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 90, 96); }), transparent: true })); sign.position.set(BX + 2.2, 2.0, -4.95); qs.add(sign); }
const CLOUD3 = []; for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(2 + R() * 1.5, 10, 8), mat('#5a5e68')); c.scale.y = 0.4; c.position.set(BX - 12 + i * 3.5, 9 + R() * 2, -26); qs.add(c); CLOUD3.push(c); }
const CAR3 = car(); CAR3.rotation.y = Math.PI / 2; CAR3.position.set(BX + 0.7, 0, -2); qs.add(CAR3);
const tEra = tag('差別が、根強い時代', { size: 58, w: 600, bg: '#14161c', sx: 2.4 }); tEra.position.set(BX, 3.4, -4); qs.add(tEra);
const tDanger = tag('制約と危険の多い、道', { size: 56, w: 660, bg: '#c8202c', sx: 2.6 }); tDanger.position.set(BX, 3.4, -4); qs.add(tDanger);

// ---------- 4段目. コンサートホール（x=120）。スポットライトの中のピアノと演奏者 → 舞台そでで待つ運転手 ----------
const CX = 120;
{ const fl = box(14, 0.04, 12, mat('#3a2418')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const stg = box(8, 0.5, 4, mat('#6a4428')); stg.position.set(CX, 0.25, -3.6); qs.add(stg);
  const back = box(10, 6, 0.2, mat('#2a1418')); back.position.set(CX, 3, -5.8); qs.add(back);
  for (const s of [-1, 1]) { const c = box(1.6, 5.4, 0.2, mat('#8a1a2a')); c.position.set(CX + s * 4.2, 2.7, -5.5); qs.add(c); } }
const PIANO4 = new THREE.Group();
{ const body = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.35, 24, 1, false, 0, Math.PI), mat('#0e0e12')); body.scale.set(1.0, 1, 0.8); body.position.y = 1.05; PIANO4.add(body);
  const bb = box(2.0, 0.35, 0.6, mat('#0e0e12')); bb.position.set(0, 1.05, -0.28); PIANO4.add(bb);
  const lid = box(1.9, 0.04, 1.4, mat('#14141a')); lid.position.set(0, 1.55, 0.3); lid.rotation.x = -0.5; PIANO4.add(lid);
  const keys = box(1.6, 0.06, 0.28, mat('#f4f4f0')); keys.position.set(0, 1.0, -0.65); PIANO4.add(keys);
  for (const [x, z] of [[-0.8, -0.3], [0.8, -0.3], [0, 0.6]]) { const l = box(0.1, 0.9, 0.1, mat('#0e0e12')); l.position.set(x, 0.45, z); PIANO4.add(l); } }
PIANO4.position.set(CX, 0.5, -3.4); PIANO4.rotation.y = Math.PI; qs.add(PIANO4);
const doc4 = makePerson(DOC); doc4.position.set(CX, 0.5 - 0.3, -2.45); doc4.rotation.y = Math.PI; doc4.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(doc4);
const tony4 = makePerson(TONY); tony4.position.set(CX + 2.2, 0, -1.6); tony4.rotation.y = -0.6; qs.add(tony4);
const SPOT4 = new THREE.SpotLight(0xfff0d0, 0, 12, 0.4, 0.5, 1); SPOT4.position.set(CX, 7, -1.5); SPOT4.target.position.set(CX, 0.5, -3.0); qs.add(SPOT4); qs.add(SPOT4.target);
const NOTES4 = []; for (let i = 0; i < 5; i++) { const n = tag('♪', { size: 90, w: 130, h: 130, bg: 'rgba(0,0,0,0)', color: '#f2c14e', sx: 0.34 }); qs.add(n); NOTES4.push(n); }
const tPiano = tag('雇い主は、天才ピアニスト', { size: 54, w: 720, bg: '#14161c', sx: 2.4 }); tPiano.position.set(CX, 3.4, -3.0); qs.add(tPiano);
const tOpp = tag('正反対の、ふたり旅', { size: 60, w: 600, bg: '#2a6ab0', sx: 2.0 }); tOpp.position.set(CX + 1.6, 3.0, -2.2); qs.add(tOpp);

// ---------- 5段目. 映画館（x=180）。2018年・アメリカ映画 ----------
const TX = 180;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8ab4d8'); gr.addColorStop(1, '#e8d8b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7a8a4a'; g.fillRect(0, h - 120, w, 120); g.fillStyle = '#3a3a3e'; g.beginPath(); g.moveTo(320, h - 120); g.lineTo(400, h - 120); g.lineTo(560, h); g.lineTo(160, h); g.fill();
  g.fillStyle = '#2a3a5a'; g.fillRect(300, h - 100, 120, 40); g.fillRect(320, h - 125, 80, 26); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t2018 = tag('2018年 アメリカ映画', { size: 56, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.0 }); t2018.position.set(TX, 6.0, -4.4); qs.add(t2018);
const tOscar = tag('アカデミー賞 作品賞', { size: 56, w: 640, bg: '#c8902c', sx: 3.0 }); tOscar.position.set(TX, 6.0, -4.4); qs.add(tOscar);

// ---------- 6段目. 車の中（x=220）。ダッシュボードの上に、緑の表紙の本。前の席のふたり ----------
const DX = 220;
{ const gr = box(40, 0.04, 40, mat('#7a8a4a')); gr.position.set(DX, 0.02, -14); qs.add(gr);
  const road = box(3, 0.03, 40, mat('#3a3a3e')); road.position.set(DX, 0.05, -14); qs.add(road); }
const CAR6 = car(); CAR6.rotation.y = Math.PI / 2; CAR6.position.set(DX, 0, -2); qs.add(CAR6);
const D6 = makePerson(TONY); D6.scale.setScalar(0.8); D6.position.set(DX + 0.35, 0.05, -2.0); D6.rotation.y = Math.PI; qs.add(D6);
const P6 = makePerson(DOC); P6.scale.setScalar(0.8); P6.position.set(DX - 0.35, 0.05, -2.0); P6.rotation.y = Math.PI; qs.add(P6);
const BOOK6 = new THREE.Group(); { const c = box(0.5, 0.06, 0.7, mat(GREEN)); BOOK6.add(c); const pg = box(0.46, 0.05, 0.66, mat('#f4f0e4')); pg.position.set(0.01, 0, 0); BOOK6.add(pg); const c2 = box(0.5, 0.012, 0.7, mat(GREEN)); c2.position.y = 0.032; BOOK6.add(c2); const band = box(0.5, 0.014, 0.12, mat('#e6c050')); band.position.set(0, 0.04, -0.2); BOOK6.add(band); }
BOOK6.position.set(DX, 1, -2); BOOK6.scale.setScalar(1.3); qs.add(BOOK6);
const tBook = tag('旅の頼りは、緑の本', { size: 58, w: 600, bg: GREEN, sx: 1.3 }); qs.add(tBook);
const tTrue = tag('1962年、本当にあった旅', { size: 54, w: 680, bg: '#14161c', sx: 2.4 }); qs.add(tTrue);

// ---------- shots ----------
const ALL = [tJob, tSouth, tBouncer, tFamily, tEra, tDanger, tPiano, tOpp, t2018, tOscar, tBook, tTrue, Q1, ...HEART2, ...NOTES4];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotClub(t, quiz = 0) { // 1段目 0〜9：腕っぷし自慢の男に、運転手の仕事が来た。行き先は、危険の多い南の地方（0秒目がサムネ）
  base(); S.aim(0, -2.5); lift(0); S.hemi.intensity = 0.6; S.darken(0.45, '#0a0610');
  const k = quiz ? 1 : ease(clamp((t - 0.6) / 1.0));
  man1.userData.arms[0].rotation.x = -1.3 * k; KEY1.position.set(lerp(0.4, 0.05, k), 1.32 + Math.sin(t * 3) * 0.02, -1.75); KEY1.rotation.z = Math.sin(t * 4) * 0.3;
  tony1.userData.head.rotation.x = 0.25; tony1.userData.arms[1].rotation.x = t > 5.5 && !quiz ? -1.0 : 0; tony1.userData.arms[1].rotation.z = 0;
  Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3);
  if (!quiz) { tJob.userData.pop((t - 0.8) / 0.35); if (t > 4.1) tJob.visible = false; tSouth.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, 0.1, u), lerp(1.9, 1.85, u), lerp(2.6, 2.1, u), 0, 1.5, -2.2, 62);
  return qs;
}
function shotBouncer(t) { // 2段目 9〜17：主人公は、クラブの用心棒。ハッタリも得意。ガサツだけど、家族に愛されている
  base(); lift(0);
  if (t < 4.0) { S.aim(AX, -2); S.hemi.intensity = 0.7; S.darken(0.35, '#0c0608');
    const k = ease(clamp((t - 0.8) / 2.6));
    guest2.position.set(AX + lerp(0.2, 2.4, k), 0, -1.6); guest2.rotation.y = Math.PI / 2; poseWalk(guest2, t * 8, k > 0 && k < 1 ? 0.8 : 0); guest2.userData.arms.forEach(a => a.rotation.x = -0.4 + Math.sin(t * 7) * 0.5);
    tony2.position.set(AX + lerp(-0.4, 1.7, k), 0, -1.6); tony2.rotation.y = Math.PI / 2; poseWalk(tony2, t * 8, k > 0 && k < 1 ? 0.8 : 0); tony2.userData.arms[1].rotation.x = -1.3;
    tBouncer.userData.pop((t - 0.4) / 0.35);
    look(AX + lerp(0.2, 1.2, ease(t / 4)), 2.0, 2.6, AX + lerp(0.2, 1.4, ease(t / 4)), 1.3, -1.8, 62);
  } else { S.aim(AX + 14, -2); S.hemi.intensity = 1.0;
    FAM2.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.5 + i) * 0.25; });
    FAM2[0].userData.arms[1].rotation.x = -1.0 + Math.sin(t * 4) * 0.3;
    HEART2.forEach((h, i) => { h.visible = t > 4.6 + i * 0.4; if (h.visible) { h.userData.pop(1); h.position.set(AX + 13.2 + i * 0.8, 1.75 + ((t * 0.3 + i * 0.3) % 0.3), -2.4); } });
    tFamily.userData.pop((t - 4.3) / 0.35);
    const u = ease((t - 4) / 4); look(AX + 14, 2.3, lerp(1.9, 1.5, u), AX + 14, 1.0, -2.4, 62);
  }
  return qs;
}
function shotRoad(t) { // 3段目 17〜25：差別がまだ根強く残る時代。ある人たちにとって、制約と危険の多い道
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.8; S.scene.background.set('#8a8e98'); S.scene.fog.color.set('#8a8e98');
  CAR3.position.set(BX + 0.7, 0, lerp(-2, -16, ease(clamp(t / 8))));
  CLOUD3.forEach((c, i) => { c.position.x = BX - 12 + i * 3.5 + t * 0.3; });
  tEra.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tEra.visible = false; tDanger.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0.3, u), lerp(2.6, 3.0, u), lerp(3.6, 3.0, u), BX, 1.6, -12, 62);
  return qs;
}
function shotHall(t) { // 4段目 25〜33：雇い主は、天才的なピアニスト。何もかも正反対の、ふたり旅
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.4; S.darken(0.55, '#08060a');
  SPOT4.intensity = 60;
  doc4.userData.arms.forEach((a, i) => { a.rotation.x = -1.1 + Math.sin(t * 9 + i * 1.7) * 0.12; });
  NOTES4.forEach((n, i) => { n.visible = true; n.userData.pop(1); const k = (t * 0.3 + i / 5) % 1; n.position.set(CX - 1.4 + i * 0.7, 2.0 + k * 1.4, -3.2); });
  tPiano.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPiano.visible = false; tOpp.userData.pop((t - 4.3) / 0.35);
  tony4.userData.arms.forEach(a => a.rotation.x = 0); tony4.userData.head.rotation.y = -0.3;
  const u = ease(t / 8);
  if (t < 4) look(CX + lerp(-0.4, 0.2, u), 2.2, lerp(1.6, 1.2, u), CX, 1.5, -3.0, 62);
  else look(CX + 1.0, 2.1, lerp(2.8, 2.4, ease((t - 4) / 4)), CX + 1.6, 1.3, -2.4, 64);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2018年の、アメリカ映画。アカデミー賞で、作品賞など3部門
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  t2018.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2018.visible = false; tOscar.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.4, 5.4, u), TX, 3.8, -4.8, 62);
  return qs;
}
function shotBook(t) { // 6段目 42〜49（決め手）：旅の頼りは、緑の表紙のガイドブック。1962年に、実際にあった旅がもとになった
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 1.2; S.scene.background.set('#9ac0e0'); S.scene.fog.color.set('#9ac0e0');
  const z = -2 - t * 0.6; CAR6.position.z = z; D6.position.z = z + 0.15; P6.position.z = z + 0.15;
  if (t < 3.3) { BOOK6.position.set(DX - 0.3, 1.36, z - 0.75); BOOK6.rotation.set(-0.25, 0, 0); P6.userData.arms.forEach(a => a.rotation.x = -1.0); P6.userData.head.rotation.x = 0.4;
    tBook.position.set(DX - 0.1, 2.05, z + 0.8); tBook.userData.pop((t - 0.3) / 0.35);
    look(DX - 0.3, 2.3, z - 2.7, DX - 0.2, 1.1, z - 0.3, 62);
  } else { BOOK6.position.set(DX - 0.35, 0.98, z - 0.5); BOOK6.rotation.set(0, 0, 0); P6.userData.head.rotation.x = 0; P6.userData.arms[0].rotation.x = -0.5;
    tTrue.position.set(DX, 2.4, z - 0.6); tTrue.userData.pop((t - 3.5) / 0.3);
    const u = ease((t - 3.3) / 3.7); look(DX + lerp(2.4, 2.8, u), lerp(2.4, 2.8, u), z + lerp(4.4, 5.2, u), DX, 1.0, z - 1.0, 62);
  }
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（ナイトクラブの裏口に戻る）
  shotClub(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(0.1, 1.85, lerp(2.5, 2.0, k), 0, 1.5, -2.2, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotClub(t, 0) },
  { a: 9, b: 17, f: shotBouncer },
  { a: 17, b: 25, f: shotRoad },
  { a: 25, b: 33, f: shotHall },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotBook },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '腕っぷし自慢の男に、<br>運転手の仕事が来た。'],
  [5.6, 9.0, '行き先は、危険の多い<br>南の地方。'],
  [9.2, 13.2, '主人公は、クラブの用心棒。<br>ハッタリも得意。'],
  [13.2, 17.0, 'ガサツだけど、<br>家族に愛されている。'],
  [17.2, 21.0, '差別がまだ、<br>根強く残る時代。'],
  [21.0, 25.0, 'ある人たちにとっては、<br>制約と危険の多い道。'],
  [25.2, 29.0, '雇い主は、<br>天才的なピアニスト。'],
  [29.0, 33.0, '何もかも正反対の、<br>ふたり旅。'],
  [33.2, 37.4, '2018年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>作品賞など3部門。'],
  [42.2, 45.4, '旅の頼りは、<br>緑の表紙のガイドブック。'],
  [45.4, 49.0, '1962年に実際にあった<br>旅がもとになった。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>グリーンブック。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q094', v2: true, answer: 'グリーンブック',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 9494,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '腕っぷし自慢': 'うでっぷしじまん', '男': 'おとこ', '運転手': 'うんてんしゅ', '仕事': 'しごと', '来た': 'きた', '行き先': 'いきさき', '危険': 'きけん', '多い': 'おおい', '南': 'みなみ', '地方': 'ちほう', '主人公': 'しゅじんこう', '用心棒': 'ようじんぼう', '得意': 'とくい', '家族': 'かぞく', '愛されて': 'あいされて', '差別': 'さべつ', '根強く': 'ねづよく', '残る': 'のこる', '時代': 'じだい', '人たち': 'ひとたち', '制約': 'せいやく', '道': 'みち', '雇い主': 'やといぬし', '天才的': 'てんさいてき', '何もかも': 'なにもかも', '正反対': 'せいはんたい', 'ふたり旅': 'ふたりたび', '2018年': 'にせんじゅうはちねん', '映画': 'えいが', 'アカデミー賞': 'アカデミーしょう', '作品賞': 'さくひんしょう', '3部門': 'さんぶもん', '旅': 'たび', '頼り': 'たより', '緑': 'みどり', '表紙': 'ひょうし', '1962年': 'せんきゅうひゃくろくじゅうにねん', '実際': 'じっさい', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n腕っぷし自慢の男に、運転手の仕事が来た。行き先は、危険の多い南の地方。主人公は、クラブの用心棒。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'UNEXT', 'Hulu', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'グリーンブック', info: 'U-NEXT・Hulu｜映画・130分', answerSize: 112 });
