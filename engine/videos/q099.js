import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #099 コンフィデンスマンJP（ドラマ・日本・フジテレビ系 2018年4月9日〜6月11日。FOD・Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/konhuidensumanjp（FOD・Disney+・Netflix・Prime Video）と
//   Filmarks の動画配信欄（FOD・Disney+・Netflix・Prime Video 見放題）で2026/11/17確認。Filmarks 4.3・レビュー39,793件 filmarks.com/dramas/907/2039）
// 確かめた事実（ザテレビジョン thetv.jp/program/0000934901。2026/11/17）：
//   ・2018年4月9日〜6月11日、フジテレビ系で放送。脚本は古沢良太
//   ・主人公は信用詐欺を働く3人の詐欺師（長澤まさみ・東出昌大・小日向文世）。一見ごく平凡だが、さまざまな職業の人物になりすます
//   ・奇想天外で大規模な計画を立て、悪徳富豪から大金をだまし取る。1話完結のコンゲーム（だまし合い）
//   ・のちに映画にもなった（JustWatch 日本版の映画ページ コンフィデンスマンJP ロマンス編 2019年）
// 構成（ヒント6段）：1 悪いうわさの大金持ち・そこへ見知らぬ新人が近づく → 2 主人公は3人組・ふつうに見えて何にでもなりすます
//   → 3 きらびやかなパーティー・だまされているのは誰？ → 4 ねらうのは悪い大金持ちだけ・大がかりな作戦で大金をだまし取る
//   → 5 2018年の日本のドラマ・脚本はリーガル・ハイの古沢良太 → 6 決め手：主演は長澤まさみ・3人の職業は信用詐欺師
// 各話の作戦の中身・どんでん返し・結末は言わない。役名・ゲスト・地名は出さない。俳優の顔・ポスター・ロゴ・劇中の有名な場面は使わない。人は汎用の3D
const S = quizStage({ bg: '#1a1626', floor: '#221e2c', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(9999);

const RICH = { skin: '#e8b98f', hair: '#9a9a9a', shirt: '#c8a040', pants: '#2a2a30', tie: true };
const A = { skin: '#f4d3b5', hair: '#1d1a19', shirt: '#c8202c', pants: '#2a2a30', long: true, skirt: true };
const B = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#4a7ad8', pants: '#2a2e3a' };
const C = { skin: '#e8b98f', hair: '#9a9a9a', shirt: '#5a5a62', pants: '#2a2e3a' };
const GUEST = [
  { skin: '#f1c9a5', hair: '#2c2421', shirt: '#1a1a22', pants: '#1a1a22', tie: true },
  { skin: '#f4d3b5', hair: '#6a4a2a', shirt: '#8e5bd0', pants: '#5a3a7a', long: true, skirt: true },
  { skin: '#d9a57c', hair: '#1a1410', shirt: '#1a1a22', pants: '#1a1a22', tie: true },
  { skin: '#f4d3b5', hair: '#2c2421', shirt: '#2e8a6a', pants: '#1a4a3a', long: true, skirt: true },
];
function gl(c) { return new THREE.MeshBasicMaterial({ color: c }); }
function gold() { return new THREE.MeshStandardMaterial({ color: '#e6c050', metalness: 0.7, roughness: 0.3, emissive: '#5a4010' }); }

// ---------- 1段目. 夜の豪邸の門の前（x=0）。金色の服の大金持ちと、頭を下げる新人 ----------
{ const fl = box(30, 0.04, 30, mat('#2a2a30')); fl.position.set(0, 0.02, -8); qs.add(fl);
  const hs = box(14, 6, 6, mat('#e8e0d0')); hs.position.set(0, 3, -12); qs.add(hs);
  for (let i = 0; i < 6; i++) { const w = box(1.2, 1.4, 0.06, gl('#ffe0a0')); w.position.set(-5 + i * 2, 4.2, -8.95); qs.add(w); const w2 = w.clone(); w2.position.y = 1.8; if (i !== 2 && i !== 3) qs.add(w2); }
  for (let i = 0; i < 4; i++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 12), mat('#f4f0e6')); pl.position.set(-2.4 + i * 1.6, 2, -8.6); qs.add(pl); }
  const door = box(1.8, 2.6, 0.1, mat('#5a3a2a')); door.position.set(0, 1.3, -8.94); qs.add(door);
  for (const x of [-4, 4]) { const p = box(0.6, 2.4, 0.6, mat('#c8c0b0')); p.position.set(x, 1.2, -2); qs.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), gl('#ffe0a0')); l.position.set(x, 2.6, -2); qs.add(l); }
  const car = box(2, 0.9, 4.4, new THREE.MeshStandardMaterial({ color: '#14161c', metalness: 0.6, roughness: 0.3 })); car.position.set(3.4, 0.6, -5); qs.add(car); }
const rich1 = makePerson(RICH); rich1.position.set(-0.8, 0, -4.6); rich1.scale.set(1.12, 1, 1.12); qs.add(rich1);
const new1 = makePerson({ ...B, shirt: '#e8e4dc', pants: '#2a2e3a', tie: true }); new1.position.set(1.2, 0, -3.2); new1.rotation.y = -2.2; qs.add(new1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.42 }); qs.add(Q1);
const tRich = tag('悪いうわさの、大金持ち', { size: 54, w: 700, bg: '#14161c', sx: 2.3 }); tRich.position.set(0.1, 3.5, -3.8); qs.add(tRich);
const tNew = tag('近づく、見知らぬ新人', { size: 56, w: 660, bg: '#c8202c', sx: 2.3 }); tNew.position.set(0.1, 3.5, -3.8); qs.add(tNew);

// ---------- 2段目. 楽屋のような部屋（x=50）。3人。服がつぎつぎ変わる（なりすまし） ----------
const AX = 50;
{ const fl = box(12, 0.04, 9, mat('#4a3a34')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#2a2e3a')); wl.position.set(AX, 2.5, -5); qs.add(wl);
  const rack = box(4.4, 0.08, 0.08, mat('#9a9ea8')); rack.position.set(AX, 2.3, -4.4); qs.add(rack);
  ['#c8202c', '#f4f0e6', '#2e8a6a', '#1a1a22', '#e6b450', '#4a7ad8', '#8e5bd0', '#7a5a3a'].forEach((c, i) => { const h = box(0.42, 0.9, 0.08, mat(c)); h.position.set(AX - 1.9 + i * 0.54, 1.8, -4.4); qs.add(h); });
  const mir = box(1.4, 1.8, 0.05, new THREE.MeshStandardMaterial({ color: '#c8d8e8', metalness: 0.9, roughness: 0.1 })); mir.position.set(AX + 3.6, 1.8, -4.85); qs.add(mir);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gl('#fff0c0')); b.position.set(AX + 2.95 + (i % 2) * 1.3, 0.9 + Math.floor(i / 2) * 0.9, -4.8); qs.add(b); } }
const TRIO2 = [A, B, C].map((c, i) => { const p = makePerson(c); p.position.set(AX - 1.3 + i * 1.3, 0, -2.2); qs.add(p); return p; });
const OUTFITS = [['#c8202c', '#f4f0e6', '#2e8a6a', '#e6b450'], ['#4a7ad8', '#1a1a22', '#7a5a3a', '#f4f0e6'], ['#5a5a62', '#e6b450', '#1a1a22', '#8e5bd0']];
const tTrio = tag('主人公は、3人組', { size: 60, w: 540, bg: '#14161c', sx: 1.9 }); tTrio.position.set(AX, 3.1, -2.2); qs.add(tTrio);
const tAny = tag('何にでも、なりすます', { size: 58, w: 620, bg: '#c8202c', sx: 2.2 }); tAny.position.set(AX, 3.1, -2.2); qs.add(tAny);

// ---------- 3段目. パーティー会場（x=100）。シャンデリアと、グラスを持つ客 ----------
const BX = 100;
{ const fl = box(18, 0.04, 14, mat('#5a2a2e')); fl.position.set(BX, 0.02, -3); qs.add(fl);
  const wl = box(18, 7, 0.2, mat('#3a2a3a')); wl.position.set(BX, 3.5, -9); qs.add(wl);
  for (let i = 0; i < 5; i++) { const cl = box(0.4, 7, 0.3, mat('#c8a050')); cl.position.set(BX - 8 + i * 4, 3.5, -8.8); qs.add(cl); }
  const ch = new THREE.Group(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), gl('#fff4d0')); c.position.set(Math.cos(a) * 0.9, -Math.abs(Math.sin(a * 2)) * 0.3, Math.sin(a) * 0.9); ch.add(c); } const cb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), gold()); ch.add(cb); ch.position.set(BX, 5.2, -4); qs.add(ch);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 20), mat('#f4f0e6')); tb.position.set(BX + 2.6, 1.0, -4); qs.add(tb);
  const tl = box(0.15, 1.0, 0.15, mat('#c8c0b0')); tl.position.set(BX + 2.6, 0.5, -4); qs.add(tl);
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.42 - i * 0.1, 0.42 - i * 0.1, 0.22, 16), mat('#f4e8d8')); t.position.set(BX + 2.6, 1.15 + i * 0.22, -4); qs.add(t); } }
const GUESTS3 = []; for (let i = 0; i < 8; i++) { const p = makePerson(GUEST[i % 4]); p.position.set(BX - 4.5 + (i % 4) * 2.0 + (i > 3 ? 1 : 0), 0, -3.0 - (i > 3 ? 2.2 : 0)); p.rotation.y = (i % 2 ? 0.7 : -0.7); qs.add(p); p.userData.arms[1].rotation.x = -1.2; const g = box(0.08, 0.2, 0.08, gl('#e8d890')); g.position.set(0.32, 0.85, 0.35); p.add(g); GUESTS3.push(p); }
const a3 = makePerson({ ...A, shirt: '#c8202c' }); a3.position.set(BX - 0.4, 0, -1.6); qs.add(a3);
const tParty = tag('きらびやかな、パーティー', { size: 54, w: 720, bg: '#14161c', sx: 3.6 }); tParty.position.set(BX, 3.4, -3.6); qs.add(tParty);
const tWho = tag('だまされているのは、誰？', { size: 54, w: 720, bg: '#c8202c', sx: 3.6 }); tWho.position.set(BX, 3.4, -3.6); qs.add(tWho);

// ---------- 4段目. 金庫室（x=150）。金の延べ棒の山が、3人の側に流れていく ----------
const CX = 150;
{ const fl = box(12, 0.04, 10, mat('#3a3e48')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#4a4e58')); wl.position.set(CX, 2.5, -5); qs.add(wl);
  const vd = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 32), new THREE.MeshStandardMaterial({ color: '#9a9ea8', metalness: 0.8, roughness: 0.3 })); vd.rotation.x = Math.PI / 2; vd.position.set(CX - 3.2, 2.0, -4.8); qs.add(vd);
  const hd = box(1.6, 0.18, 0.2, mat('#5a5e68')); hd.position.set(CX - 3.2, 2.0, -4.55); qs.add(hd); }
const BARS4 = []; for (let i = 0; i < 18; i++) { const b = box(0.5, 0.18, 0.24, gold()); const r = Math.floor(i / 6), c = i % 6; b.userData.a = new THREE.Vector3(CX - 1.0 + (c - 2.5) * 0.4, 0.09 + r * 0.19, -2.8 + (r % 2) * 0.1); b.userData.b = new THREE.Vector3(CX + 0.2 + c * 0.42, 0.09 + r * 0.19, -1.7); qs.add(b); BARS4.push(b); }
const rich4 = makePerson(RICH); rich4.position.set(CX - 1.6, 0, -2.4); rich4.rotation.y = 0.5; qs.add(rich4);
const TRIO4 = [A, B, C].map((c, i) => { const p = makePerson(c); p.position.set(CX + 0.5 + i * 0.68, 0, -3.4 + (i === 1 ? -0.3 : 0)); p.rotation.y = -0.3; p.scale.setScalar(0.9); qs.add(p); return p; });
const tTarget = tag('ねらうのは、悪い大金持ち', { size: 54, w: 720, bg: '#14161c', sx: 2.4 }); tTarget.position.set(CX, 2.75, -3.0); qs.add(tTarget);
const tTake = tag('大金を、だまし取る', { size: 58, w: 600, bg: '#c8902c', sx: 1.9 }); tTake.position.set(CX, 2.75, -3.0); qs.add(tTake);

// ---------- 5段目. テレビの前（x=200）。月曜の夜。2018年・日本のドラマ ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#4a3a30')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#5a4a5a')); wl.position.set(TX, 4, -5); qs.add(wl);
  const tv = box(5.6, 3.3, 0.3, mat('#14161c')); tv.position.set(TX, 3.2, -4.75); qs.add(tv);
  const sofa = box(3.6, 0.6, 1.2, mat('#6a4a3a')); sofa.position.set(TX, 0.3, 1.6); qs.add(sofa); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.9), new THREE.MeshBasicMaterial({ map: canvasTex(520, 290, (g, w, h) => {
  g.fillStyle = '#2a1a2e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(230,192,80,${0.3 + (i % 5) * 0.12})`; g.beginPath(); g.arc((i * 97) % w, (i * 53) % h, 6 + (i % 4) * 3, 0, 7); g.fill(); }
  g.fillStyle = '#c8202c'; g.fillRect(w / 2 - 70, h / 2 - 70, 140, 140); g.fillStyle = '#fff'; g.font = '900 120px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', w / 2, h / 2 + 6); }) }));
SCR5.position.set(TX, 3.2, -4.58); qs.add(SCR5);
const FANS5 = [0, 1, 3].map(i => { const p = makePerson(GUEST[i]); p.position.set(TX - 1.1 + [0, 1, 3].indexOf(i) * 1.1, -0.2, 1.6); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.4); qs.add(p); return p; });
const t2018 = tag('2018年、日本のドラマ', { size: 56, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.4 }); t2018.position.set(TX, 5.7, -4.4); qs.add(t2018);
const tWriter = tag('脚本は、古沢良太', { size: 60, w: 560, bg: '#c8202c', sx: 3.2 }); tWriter.position.set(TX, 5.7, -4.4); qs.add(tWriter);

// ---------- 6段目. 夜のステージ（x=250）。スポットライトの中の3人。まん中に主演 ----------
const DX = 250;
{ const fl = box(16, 0.04, 12, mat('#1a1a22')); fl.position.set(DX, 0.02, -3); qs.add(fl);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 40), mat('#2a2a34')); st.position.set(DX, 0.15, -3); qs.add(st);
  for (let i = 0; i < 30; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), gl('#ffe08a')); const a = i / 30 * Math.PI * 2; b.position.set(DX + Math.cos(a) * 3.25, 0.32, -3 + Math.sin(a) * 3.25); qs.add(b); } }
const SPOT6 = new THREE.SpotLight(0xfff0d0, 0, 14, 0.45, 0.4, 1); SPOT6.position.set(DX, 8, 0); SPOT6.target.position.set(DX, 0, -3); qs.add(SPOT6); qs.add(SPOT6.target);
const TRIO6 = [B, A, C].map((c, i) => { const p = makePerson(c); p.position.set(DX - 1.2 + i * 1.2, 0.3, -3 - (i === 1 ? 0 : 0.5)); qs.add(p); return p; });
const tStar = tag('主演は、長澤まさみ', { size: 58, w: 600, bg: '#c8902c', sx: 2.4 }); tStar.position.set(DX, 3.3, -3); qs.add(tStar);
const tJob = tag('3人の職業は、信用詐欺師', { size: 52, w: 740, bg: '#c8202c', sx: 2.8 }); tJob.position.set(DX, 3.3, -3); qs.add(tJob);

// ---------- shots ----------
const ALL = [tRich, tNew, tTrio, tAny, tParty, tWho, tTarget, tTake, t2018, tWriter, tStar, tJob, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPOT6.intensity = 0; }

function shotGate(t, quiz = 0) { // 1段目 0〜9：悪いうわさの大金持ち。そこへ、見知らぬ新人が近づいてくる（0秒目がサムネ）
  base(); S.aim(0, -5); lift(0); S.hemi.intensity = 0.6; S.darken(0.3, '#08060c');
  rich1.userData.head.rotation.y = 0.4 + Math.sin(t) * 0.1; rich1.rotation.y = 0.6;
  const bow = quiz ? 0.5 : clamp((t - 5.2) / 0.5) * (t < 7.2 ? 1 : clamp(1 - (t - 7.2) / 0.5)); new1.userData.head.rotation.x = bow * 0.6; new1.rotation.x = 0; new1.rotation.z = 0;
  new1.position.set(lerp(2.6, 1.0, quiz ? 1 : ease(clamp((t - 0.4) / 4.4))), 0, lerp(-1.6, -3.6, quiz ? 1 : ease(clamp((t - 0.4) / 4.4)))); poseWalk(new1, t * 8, quiz || t > 4.8 ? 0 : 0.8);
  Q1.position.set(1.0, 2.6, -3.6); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3);
  if (!quiz) { tRich.userData.pop((t - 1.0) / 0.35); if (t > 4.6) tRich.visible = false; tNew.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.2, u), lerp(2.4, 2.2, u), lerp(2.6, 1.8, u), 0.1, 1.9, -4.2, 62);
  return qs;
}
function shotDress(t) { // 2段目 9〜17：主人公は、3人組。ふつうの人に見えて、何にでもなりすます
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.8;
  const n = t < 4.2 ? 0 : Math.floor((t - 4.2) / 0.9) % 4;
  TRIO2.forEach((p, i) => { p.children.forEach(ch => { if (ch.material && ch.material.color && ch.userData.isShirt) ch.material.color.set(OUTFITS[i][n]); }); p.userData.head.rotation.y = Math.sin(t * 1.5 + i) * 0.25; });
  tTrio.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tTrio.visible = false; tAny.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.6, 0.6, u), 2.0, lerp(3.4, 2.8, u), AX, 1.6, -2.4, 60);
  return qs;
}
function shotParty(t) { // 3段目 17〜25：きらびやかなパーティー。いま、だまされているのは誰？
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.8; S.darken(0.2, '#100a10');
  GUESTS3.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.2 + i) * 0.4; });
  a3.rotation.y = Math.sin(t * 0.8) * 0.6; a3.userData.head.rotation.y = t > 4.2 ? 0.6 : 0;
  tParty.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tParty.visible = false; tWho.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-2, 2, u), lerp(3.2, 2.8, u), 4.4, BX + lerp(-0.8, 0.8, u), 1.8, -3.6, 62);
  return qs;
}
function shotVault(t) { // 4段目 25〜33：ねらうのは、悪い大金持ちだけ。大がかりな作戦で、大金をだまし取る
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.7;
  const k = clamp((t - 4.2) / 3.0);
  BARS4.forEach((b, i) => { const kk = ease(clamp(k * 1.6 - i / 18 * 0.6)); b.position.lerpVectors(b.userData.a, b.userData.b, kk); b.position.y += Math.sin(kk * Math.PI) * 0.8; });
  rich4.userData.head.rotation.y = -0.3; rich4.userData.arms[1].rotation.x = t > 4.2 ? 0 : -0.4;
  TRIO4.forEach((p, i) => p.userData.head.rotation.y = Math.sin(t * 2 + i) * 0.2);
  tTarget.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTarget.visible = false; tTake.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.3, 0.3, u), lerp(2.2, 2.4, u), lerp(3.0, 2.6, u), CX, 1.2, -2.8, 70);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2018年の、日本のドラマ。脚本は「リーガル・ハイ」の古沢良太
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.55, '#08060a');
  t2018.userData.pop((t - 0.4) / 0.35); if (t > 4.4) t2018.visible = false; tWriter.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, lerp(3.0, 3.4, u), lerp(6.0, 5.0, u), TX, 3.6, -4.6, 62);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：主演は、長澤まさみ。3人の職業は、信用詐欺師
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.35; S.darken(0.6, '#06060a'); SPOT6.intensity = 60;
  TRIO6.forEach((p, i) => { p.userData.head.rotation.y = (i - 1) * -0.2; if (t > 3.6) p.userData.arms[i === 0 ? 0 : 1].rotation.x = -0.5; });
  if (t < 3.6) tStar.userData.pop((t - 0.3) / 0.35); else tJob.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.4, 0.4, u), 2.0, lerp(3.4, 2.6, u), DX, 1.7, -3.2, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（豪邸の前に戻る）
  shotGate(6.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(0.3, 2.3, lerp(2.4, 1.8, k), 0.1, 1.9, -4.2, 62);
  countdown(t);
  return qs;
}

// 2段目で服の色を変えるため、胴と腕の箱に印をつける（makePerson の胴は1つ目の shirt 色の箱）
TRIO2.forEach((p, i) => { const col = [A, B, C][i].shirt; p.traverse(o => { if (o.isMesh && o.material && o.material.color && '#' + o.material.color.getHexString() === col.toLowerCase()) { o.material = o.material.clone(); o.userData.isShirt = true; } }); });
TRIO2.forEach(p => { const list = []; p.traverse(o => { if (o.userData.isShirt) list.push(o); }); p.userData.shirts = list; });
// traverse で見つけた箱を children の判定でも拾えるよう、腕の中の箱も直接たどる
const _shotDress = shotDress;
function shotDress2(t) { const r = _shotDress(t); const n = t < 4.2 ? 0 : Math.floor((t - 4.2) / 0.9) % 4; TRIO2.forEach((p, i) => p.userData.shirts.forEach(o => o.material.color.set(OUTFITS[i][n]))); return r; }

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotGate(t, 0) },
  { a: 9, b: 17, f: shotDress2 },
  { a: 17, b: 25, f: shotParty },
  { a: 25, b: 33, f: shotVault },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '悪いうわさの、<br>大金持ち。'],
  [5.6, 9.0, 'そこへ、見知らぬ新人が<br>近づいてくる。'],
  [9.2, 13.2, '主人公は、<br>3人組。'],
  [13.2, 17.0, 'ふつうの人に見えて、<br>何にでもなりすます。'],
  [17.2, 21.0, 'きらびやかな、<br>パーティー。'],
  [21.0, 25.0, 'いま、だまされているのは<br>誰？'],
  [25.2, 29.0, 'ねらうのは、<br>悪い大金持ちだけ。'],
  [29.0, 33.0, '大がかりな作戦で、<br>大金をだまし取る。'],
  [33.2, 37.4, '2018年の、<br>日本のドラマ。'],
  [37.4, 41.8, '脚本は、リーガル・ハイの<br>古沢良太。'],
  [42.2, 45.4, '主演は、<br>長澤まさみ。'],
  [45.4, 49.0, '3人の職業は、<br>信用詐欺師。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>コンフィデンスマンJP。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q099', v2: true, answer: 'コンフィデンスマンJP',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 9999,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '悪い': 'わるい', '大金持ち': 'おおがねもち', '見知らぬ': 'みしらぬ', '新人': 'しんじん', '近づいて': 'ちかづいて', '主人公': 'しゅじんこう', '3人組': 'さんにんぐみ', '人に': 'ひとに', '見えて': 'みえて', '何にでも': 'なんにでも', '誰': 'だれ', '大がかり': 'おおがかり', '作戦': 'さくせん', '大金': 'たいきん', '取る': 'とる', '2018年': 'にせんじゅうはちねん', '日本': 'にほん', '脚本': 'きゃくほん', 'リーガル・ハイ': 'リーガルハイ', '古沢良太': 'こさわりょうた', '主演': 'しゅえん', '長澤まさみ': 'ながさわまさみ', '3人': 'さんにん', '職業': 'しょくぎょう', '信用詐欺師': 'しんようさぎし', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', 'コンフィデンスマンJP': 'コンフィデンスマンジェーピー', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n悪いうわさの大金持ち。そこへ、見知らぬ新人が近づいてくる。主人公は3人組。ふつうの人に見えて、何にでもなりすます。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'ディズニープラス', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'コンフィデンスマンJP', info: 'FOD・Disney+｜日本のドラマ', answerSize: 96 });
