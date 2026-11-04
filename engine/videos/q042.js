import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #042 うっせぇわ（曲・Ado・2020年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/4）：
//   ・配信開始 2020年10月23日（Ado のメジャーデビュー曲。Ado は 2002年10月24日生まれで、配信の日は17歳）
//   ・日本レコード協会のストリーミング認定 トリプル・プラチナ（3億回以上。2023年1月度。riaj.or.jp/data/st/search/ で「うっせぇわ」）
// 物語：曲が描く状況（会社の飲み会で上の人の説教と細かい決まりごとに付き合わされる新人 → 笑顔の下でたまるイライラ → 口には出さず心の中で叫ぶ）を
//   自分の言葉で作り直したもの。歌詞の言葉・言い回し・歌詞に出てくる小物は使わない（歌詞と見比べて、重なる言葉がないことを確かめた）。音源・ジャケット・歌手の見た目は使わない
// 構成（ヒント6段）：1 飲み会で上司のお説教・新人は愛想笑い → 2 細かすぎる決まりごと・すぐ小言 → 3 居酒屋のいちばん端の席・イライラがたまる
//   → 4 心の中で何かが切れる・心の中で叫ぶ → 5 2020年・当時17歳のデビュー曲・ストリーミング3億回 → 6 決め手：うるさい！の乱暴な言い方・ひらがな5文字

const S = quizStage({ bg: '#2a1e18', floor: '#3a2a20', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(4242);

const NEW = { skin: '#f2d4b8', hair: '#2a2430', shirt: '#e8eef4', pants: '#2a2e3a', long: true };
const BOSS = { skin: '#e8c4a0', hair: '#5a5a5a', shirt: '#3a4050', pants: '#22262f', tie: true };
const RED = '#e2483c';

function bubble(w = 0.9) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 24), new THREE.MeshBasicMaterial({ color: '#ffffff' })); b.scale.y = 0.62; g.add(b); for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), new THREE.MeshBasicMaterial({ color: '#2a2a30' })); d.position.set(-0.18 + i * 0.18, 0, 0.01); g.add(d); } return g; }
function lantern(x, y, z) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshBasicMaterial({ color: '#e8503c' })); b.scale.y = 1.3; g.add(b); for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), mat('#2a2020')); c.position.y = s * 0.42; g.add(c); } g.position.set(x, y, z); qs.add(g); return g; }

// ---------- 1段目. 飲み会の席（x=0）。お説教する上司と、愛想笑いの新人 ----------
{ const fl = box(10, 0.04, 8, mat('#6a5038')); fl.position.set(0, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#8a6a48')); wl.position.set(0, 3, -4); qs.add(wl);
  const tb = box(2.6, 0.08, 1.2, mat('#5a3a24')); tb.position.set(0, 0.78, -1.6); qs.add(tb); const lg = box(2.4, 0.74, 0.08, mat('#3a2418')); lg.position.set(0, 0.38, -1.6); qs.add(lg);
  for (let i = 0; i < 4; i++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.05, 16), mat('#f4f0e8')); pl.position.set(-0.9 + i * 0.6, 0.85, -1.6); qs.add(pl); } }
lantern(-2.6, 3.2, -2.8); lantern(2.6, 3.2, -2.8);
const boss1 = makePerson(BOSS); boss1.position.set(-0.7, -0.32, -2.5); boss1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(boss1);
const new1 = makePerson(NEW); new1.position.set(0.7, -0.32, -0.7); new1.rotation.y = Math.PI; new1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(new1);
const BUB1 = [0, 1, 2].map(() => { const b = bubble(); qs.add(b); return b; });
const tTalk = tag('止まらないお説教', { size: 66, w: 560, bg: '#14161c', sx: 1.7 }); tTalk.position.set(-0.2, 2.15, -1.6); qs.add(tTalk);
const tSmile = tag('ずっと愛想笑い', { size: 70, w: 520, bg: RED, sx: 1.7 }); tSmile.position.set(-0.2, 2.15, -1.6); qs.add(tSmile);

// ---------- 2段目. 決まりごとの紙が飛んでくる（x=40） ----------
const KX = 40;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ color: '#3a2a22' })); bg.position.set(KX, 3.5, -3.6); qs.add(bg); }
const new2 = makePerson(NEW); new2.position.set(KX, 0, -1.4); qs.add(new2);
const CARDS = []; for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: canvasTex(128, 92, (g, w, h) => { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a8a90'; for (let k = 0; k < 4; k++) g.fillRect(30, 16 + k * 18, 80 - (k % 2) * 20, 5); g.strokeStyle = '#e2483c'; g.lineWidth = 5; g.beginPath(); g.moveTo(8, 30); g.lineTo(14, 38); g.lineTo(24, 20); g.stroke(); }), side: THREE.DoubleSide })); c.userData.a = i / 9 * Math.PI * 2; c.userData.r = 1.0 + (i % 3) * 0.25; c.userData.y = 0.9 + (i % 4) * 0.35; qs.add(c); CARDS.push(c); }
const BANG = []; for (let i = 0; i < 3; i++) { const b = tag('！', { size: 110, w: 150, h: 150, bg: 'rgba(0,0,0,0)', color: RED, sx: 0.55 }); qs.add(b); BANG.push(b); }
const tRule = tag('細かすぎる決まりごと', { size: 58, w: 640, bg: '#14161c', sx: 1.8 }); tRule.position.set(KX, 2.95, -1.0); qs.add(tRule);
const tNag = tag('外れるとすぐ小言', { size: 64, w: 560, bg: RED, sx: 1.7 }); tNag.position.set(KX, 2.95, -1.0); qs.add(tNag);

// ---------- 3段目. 居酒屋の端の席（x=90）。イライラのメーター ----------
const CX = 90;
{ const fl = box(14, 0.04, 10, mat('#6a5038')); fl.position.set(CX, 0.02, -2); qs.add(fl); const wl = box(14, 6, 0.2, mat('#7a5a40')); wl.position.set(CX, 3, -5); qs.add(wl);
  const tb = box(5.2, 0.08, 1.2, mat('#5a3a24')); tb.position.set(CX, 0.78, -2.4); qs.add(tb); const lg = box(5, 0.74, 0.08, mat('#3a2418')); lg.position.set(CX, 0.38, -2.4); qs.add(lg); }
for (let i = 0; i < 4; i++) lantern(CX - 4.5 + i * 3, 3.6, -4.2);
const STAFF = []; for (let i = 0; i < 4; i++) { const p = makePerson({ skin: ['#e8c4a0', '#ecc9a6', '#c8946a', '#e8c4a0'][i], hair: ['#5a5a5a', '#2a2420', '#1a1a1a', '#4a3a2a'][i], shirt: ['#3a4050', '#4a4a5a', '#2a3044', '#5a4a3a'][i], pants: '#22262f', tie: i % 2 === 0 }); p.position.set(CX - 1.8 + i * 1.1, -0.32, -3.3); p.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(p); STAFF.push(p); }
const new3 = makePerson(NEW); new3.position.set(CX + 2.4, -0.32, -1.5); new3.rotation.y = Math.PI; new3.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(new3);
const METER = new THREE.Group(); METER.position.set(CX + 3.0, 1.9, -1.3); qs.add(METER);
{ const fr = box(0.24, 1.2, 0.06, mat('#14161c')); METER.add(fr); const fill = box(0.16, 1.1, 0.07, new THREE.MeshBasicMaterial({ color: '#f2c14e' })); fill.position.y = -0.55; fill.geometry.translate(0, 0.55, 0); METER.add(fill); METER.userData.fill = fill; }
const tEdge = tag('いちばん端の席', { size: 66, w: 520, bg: '#14161c', sx: 1.8 }); tEdge.position.set(CX + 1.7, 2.9, -1.4); qs.add(tEdge);
const tAnger = tag('イライラがたまる', { size: 64, w: 560, bg: RED, sx: 1.8 }); tAnger.position.set(CX + 1.7, 2.9, -1.4); qs.add(tAnger);

// ---------- 4段目. 心の中（x=130）。ぷつんと切れる糸と、内なる叫び ----------
const BX = 130;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ color: '#1a0e10' })); bg.position.set(BX, 3.5, -3.6); qs.add(bg); }
const new4 = makePerson(NEW); new4.position.set(BX, 0, -1.4); qs.add(new4);
const ROPE = [-1, 1].map(s => { const r = box(0.03, 0.9, 0.03, mat('#f2e8d0')); r.geometry.translate(0, s * 0.45, 0); r.position.set(BX + 0.7, 2.3, -1.3); qs.add(r); return r; });
const SPARK = []; for (let i = 0; i < 10; i++) { const sp = box(0.04, 0.3, 0.04, new THREE.MeshBasicMaterial({ color: '#ffe06a' })); sp.userData.a = i / 10 * Math.PI * 2; qs.add(sp); SPARK.push(sp); }
const RINGS4 = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 40), new THREE.MeshBasicMaterial({ color: RED, transparent: true })); r.position.set(BX, 1.75, -1.35); qs.add(r); RINGS4.push(r); }
const tSnap = tag('何かが切れた', { size: 72, w: 460, bg: '#14161c', sx: 1.3 }); tSnap.position.set(BX - 0.3, 2.95, -1.0); qs.add(tSnap);
const tShout = tag('心の中で叫ぶ', { size: 72, w: 460, bg: RED, sx: 1.3 }); tShout.position.set(BX - 0.3, 2.95, -1.0); qs.add(tShout);

// ---------- 5段目. 2020年・当時17歳のデビュー曲・ストリーミング3億回（x=170） ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#241a1a' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 3.2, -1.6); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 4.35, -1.4); BARS.scale.set(0.8, 0.4, 0.8); qs.add(BARS);
const tYear = tag('2020年 17歳のデビュー曲', { size: 56, w: 720, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tYear.position.set(FX, 5.6, -1.2); qs.add(tYear);
const tPlay = tag('ストリーミング 3億回超え', { size: 56, w: 740, bg: SONG_GREEN, sx: 3.0 }); tPlay.position.set(FX, 5.6, -1.2); qs.add(tPlay);

// ---------- 6段目. 叫びの波（x=210）。耳をふさぐ人たちと、両手を広げる新人 ----------
const NX = 210;
{ const fl = box(14, 0.04, 10, mat('#6a5038')); fl.position.set(NX, 0.02, -2); qs.add(fl); const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ color: '#3a1a14' })); bg.position.set(NX, 3.5, -5); qs.add(bg); }
const new6 = makePerson(NEW); new6.position.set(NX, 0, -1.6); qs.add(new6);
const EARS = []; for (let i = 0; i < 4; i++) { const p = makePerson({ ...BOSS, hair: ['#5a5a5a', '#2a2420', '#1a1a1a', '#4a3a2a'][i] }); p.position.set(NX + [-2.4, -1.5, 1.5, 2.4][i], 0, -2.6 - (i % 2) * 0.6); p.rotation.y = i < 2 ? 0.5 : -0.5; qs.add(p); EARS.push(p); }
const WAVES = []; for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 48), new THREE.MeshBasicMaterial({ color: '#ffe06a', transparent: true })); r.position.set(NX, 1.8, -1.4); qs.add(r); WAVES.push(r); }
const tRude = tag('「うるさい！」の乱暴な言い方', { size: 52, w: 780, bg: '#e6b450', color: '#14161c', sx: 2.5 }); tRude.position.set(NX, 3.6, -1.0); qs.add(tRude);
const tHira = tag('タイトルはひらがな5文字', { size: 56, w: 700, bg: SONG_GREEN, sx: 2.3 }); tHira.position.set(NX, 2.9, -1.0); qs.add(tHira);

// ---------- shots ----------
const ALL = [tTalk, tSmile, tRule, tNag, tEdge, tAnger, tSnap, tShout, tYear, tPlay, tRude, tHira];
function base() { S.reset(); ALL.forEach(x => x.visible = false); BUB1.forEach(b => b.visible = false); BANG.forEach(b => b.visible = false); CARDS.forEach(c => c.visible = false); SPARK.forEach(s => s.visible = false); RINGS4.forEach(r => r.visible = false); WAVES.forEach(w => w.visible = false); }

function shotParty(t) { // 1段目 0〜9：会社の飲み会で、上司のお説教が止まらない。新人は、ずっと愛想笑いを続けている（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.1; S.darken(0.15, '#3a2010');
  boss1.userData.arms[1].rotation.x = -1.3 + Math.sin(t * 7) * 0.35; boss1.userData.arms[0].rotation.x = -0.9; boss1.userData.head.rotation.y = Math.sin(t * 2.2) * 0.15;
  BUB1.forEach((b, i) => { const k = (t * 0.5 + i / 3) % 1; b.visible = true; b.position.set(-1.4, 2.0 + k * 0.5, -2.2 + k * 0.4); b.scale.setScalar(Math.sin(k * Math.PI) * 0.8 + 0.01); });
  new1.userData.head.rotation.x = Math.sin(t * 2.6) * 0.08; new1.userData.head.rotation.y = 0.2;
  tTalk.userData.pop(1); if (t > 4.6) tTalk.visible = false;
  tSmile.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(1.4, 1.8, u), lerp(2.0, 1.9, u), lerp(2.6, 2.0, u), lerp(-0.4, 0.1, u), 1.5, -1.8, 56);
  return qs;
}
function shotRules(t) { // 2段目 9〜17：誰も教えてくれない、細かすぎる決まりごと。少しでも外れると、すぐに小言が飛んでくる
  base(); S.aim(KX, -1); lift(-40); S.hemi.intensity = 1.1;
  CARDS.forEach((c, i) => { c.visible = true; const a = c.userData.a + t * 0.7; const r = c.userData.r * (1 - 0.15 * ease(clamp((t - 4) / 2))); c.position.set(KX + Math.cos(a) * r, c.userData.y + Math.sin(t * 2 + i) * 0.08, -1.4 + Math.sin(a) * r * 0.6); c.lookAt(KX, c.userData.y, 3); });
  new2.userData.head.rotation.y = Math.sin(t * 2.4) * 0.5; new2.userData.arms.forEach((a, i) => a.rotation.z = (i ? -1 : 1) * 0.2);
  BANG.forEach((b, i) => { const k = t - 4.4 - i * 0.5; b.visible = k > 0; if (k > 0) { b.position.set(KX + [-0.8, 0.9, -0.2][i], 2.1 + [0, 0.2, 0.5][i], -1.0); b.userData.pop(k / 0.25); } });
  tRule.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tRule.visible = false;
  tNag.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.3, 0, u), lerp(1.8, 1.7, u), lerp(3.6, 3.0, u), KX, 1.5, -1.4, 56);
  return qs;
}
function shotCorner(t) { // 3段目 17〜25：にぎやかな居酒屋の、いちばん端の席。笑顔の下で、イライラがたまっていく
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 1.05; S.darken(0.15, '#3a2010');
  STAFF.forEach((p, i) => { p.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 3 + i * 1.7) * 0.5; p.userData.head.rotation.y = Math.sin(t * 1.4 + i) * 0.3; });
  const k = clamp(t / 8); METER.userData.fill.scale.y = Math.max(0.02, k); METER.userData.fill.material.color.setHSL(0.13 - 0.13 * k, 0.85, 0.55);
  new3.userData.head.rotation.x = 0.1; new3.position.y = -0.32 + (k > 0.6 ? Math.sin(t * 40) * 0.01 : 0);
  tEdge.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tEdge.visible = false;
  tAnger.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.0, 1.3, u), lerp(2.0, 1.9, u), lerp(2.9, 2.4, u), CX + 2.0, 1.4, -2.0, 58);
  return qs;
}
function shotSnap(t) { // 4段目 25〜33：ついに、心の中で何かが切れた。口には出さない。でも、胸の内では叫んでいる
  base(); S.aim(BX, -1); lift(-40); S.hemi.intensity = 0.8; S.darken(0.3, '#1a0608');
  const cut = t > 2.0; const k = ease(clamp((t - 2.0) / 0.6));
  ROPE[0].rotation.z = cut ? k * 0.9 : 0; ROPE[1].rotation.z = cut ? -k * 0.9 : 0; ROPE[0].position.y = 2.2 + (cut ? k * 0.1 : 0); ROPE[1].position.y = 2.2 - (cut ? k * 0.1 : 0);
  SPARK.forEach(sp => { sp.visible = t > 2.0 && t < 3.2; const r = 0.1 + (t - 2.0) * 0.8; sp.position.set(BX + 0.7 + Math.cos(sp.userData.a) * r, 2.2 + Math.sin(sp.userData.a) * r, -1.3); sp.rotation.z = sp.userData.a - Math.PI / 2; });
  new4.userData.arms.forEach(a => a.rotation.x = t > 4.2 ? 0 : 0); new4.userData.head.rotation.x = t > 4.2 ? -0.1 : 0.15;
  RINGS4.forEach((r, i) => { const q = ((t - 4.2) * 0.6 + i / 4) % 1; r.visible = t > 4.2; r.scale.setScalar(0.4 + q * 2.4); r.material.opacity = 1 - q; });
  tSnap.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSnap.visible = false;
  tShout.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.3, 0, u), lerp(1.8, 1.7, u), lerp(3.6, 3.0, u), BX + 0.2, 1.6, -1.4, 56);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2020年に配信された、当時17歳のデビュー曲。ストリーミングでも、3億回を超えた
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1;
  DISC.rotation.z = -t * 2.2; BARS.userData.update(t);
  tYear.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tYear.visible = false;
  tPlay.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(FX, 3.4, lerp(7.8, 7.2, u), FX, 3.5, -1.5, 56);
  return qs;
}
function shotShout(t, quiz = 0) { // 6段目 42〜49（決め手）：心の叫びは、うるさい！を思いっきり乱暴に言ったひと言。タイトルは、ひらがな5文字
  base(); S.aim(NX, -2); lift(-30); S.hemi.intensity = 1.0; S.darken(0.15, '#3a1010');
  new6.userData.arms.forEach((a, i) => { a.rotation.x = -0.4; a.rotation.z = (i ? -1 : 1) * (1.0 + Math.sin(t * 8) * 0.08); }); new6.userData.head.rotation.x = -0.25;
  EARS.forEach((p, i) => { p.userData.arms.forEach((a, j) => { a.rotation.x = -2.6; a.rotation.z = (j ? -1 : 1) * 0.5; }); p.position.x = NX + [-2.4, -1.5, 1.5, 2.4][i] + Math.sin(t * 30 + i) * 0.01; });
  WAVES.forEach((w, i) => { const q = (t * 0.7 + i / 5) % 1; w.visible = true; w.scale.setScalar(0.5 + q * 2.2); w.material.opacity = 0.55 * (1 - q); });
  if (!quiz) { tRude.userData.pop((t - 0.4) / 0.35); tHira.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX, lerp(2.0, 1.9, u), lerp(4.6, 4.0, u), NX, 1.7, -1.6, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？
  shotShout(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.0, 0.3, d);
  S.spot.color.set(0xffe0d0); S.spot.position.set(NX, 6, 1); S.spot.target.position.set(NX, 1, -1.6); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(1.0, 0.6, k), lerp(1.9, 1.8, k), lerp(4.4, 3.8, k), NX, 1.6, -1.6, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotParty },
  { a: 9, b: 17, f: shotRules },
  { a: 17, b: 25, f: shotCorner },
  { a: 25, b: 33, f: shotSnap },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: (t) => shotShout(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '会社の飲み会で、<br>上司のお説教が止まらない。'],
  [5.6, 9.0, '新人は、ずっと<br>愛想笑いを続けている。'],
  [9.2, 13.2, '誰も教えてくれない、<br>細かすぎる決まりごと。'],
  [13.2, 17.0, '少しでも外れると、<br>すぐに小言が飛んでくる。'],
  [17.2, 21.0, 'にぎやかな居酒屋の、<br>いちばん端の席。'],
  [21.0, 25.0, '笑顔の下で、<br>イライラがたまっていく。'],
  [25.2, 29.0, 'ついに、心の中で<br>何かが切れた。'],
  [29.0, 33.0, '口には出さない。でも、<br>胸の内では叫んでいる。'],
  [33.2, 37.4, '2020年に配信された、<br>当時17歳のデビュー曲。'],
  [37.4, 41.8, 'ストリーミングでも、<br>3億回を超えた。'],
  [42.2, 45.4, '心の叫びは、うるさい！を<br>思いっきり乱暴に言ったひと言。'],
  [45.4, 49.0, 'タイトルは、<br>ひらがな5文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、Adoの、うっせぇわ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q042', v2: true, answer: 'うっせぇわ', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'tension', seed: 4242,
    hits: [5.6, 27.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 27.0, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.6, 'buzz'], [17.0, 'whoosh'], [25.0, 'whoosh'], [27.0, 'buzz'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'Ado': 'アド', 'うっせぇわ': 'うっせえわ', '上司': 'じょうし', 'お説教': 'おせっきょう', '新人': 'しんじん', '愛想笑い': 'あいそわらい', '誰も': 'だれも', '細かすぎる': 'こまかすぎる', '決まりごと': 'きまりごと', '外れる': 'はずれる', '小言': 'こごと', '居酒屋': 'いざかや', '端の席': 'はしのせき', '笑顔': 'えがお', '何か': 'なにか', '口には': 'くちには', '胸の内': 'むねのうち', '叫んで': 'さけんで', '2020年': 'にせんにじゅうねん', '17歳': 'じゅうななさい', '3億回': 'さんおくかい', '心の叫び': 'こころのさけび', '乱暴': 'らんぼう', 'ひらがな5文字': 'ひらがなごもじ', '何秒': 'なんびょう' },
    caption: 'この曲のタイトル、わかる？\n会社の飲み会で、上司のお説教が止まらない。新人は、ずっと愛想笑いを続けている。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '令和ソング'],
  },
});
applyQuizCards({ answer: 'うっせぇわ', info: 'Ado｜2020年', answerSize: 140, kind: '曲' });
