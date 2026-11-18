import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #105 凪のお暇（ドラマ・日本・2019年 TBS 金曜ドラマ。Prime Video・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/ci-nooxia（Prime Video・Hulu・U-NEXT）と
//   Filmarks の動画配信欄（Prime Video・Hulu・U-NEXT・Lemino 見放題）で2026/11/18確認。Filmarks 4.1・レビュー35,261件 filmarks.com/dramas/6540/9359）
// 確かめた事実（Filmarks の作品紹介、Wikipedia 日本語版 凪のお暇 の あらすじ・登場人物。2026/11/18）：
//   ・コナリミサトの同名漫画が原作。主演 黒木華（大島凪）。2019年に TBS の金曜ドラマ枠で放送（Filmarks・Wikipedia）
//   ・いつも人の顔色をうかがい、周囲に合わせてきた28歳の OL。ある日、無理がたたって倒れる（過呼吸）（Filmarks・Wikipedia）
//   ・会社を辞め、家財を処分し、都心から郊外の六畳一間のアパートへ。すべての人間関係を断ち、ゼロから新しい生活を始める（Wikipedia）
//   ・ひどいくせ毛を毎朝1時間かけてストレートに整えていたが、本来のモジャモジャ頭がトレードマークに。拾った扇風機を黄色に塗る（Wikipedia）
// 構成（ヒント6段）：1 まわりの顔色をうかがう毎日・ある日無理がたたって倒れる → 2 主人公は28歳の会社員・空気を読みすぎる
//   → 3 会社を辞めた・持ち物もほとんど手放す → 4 人間関係もリセット・郊外の古いアパートでゼロから
//   → 5 2019年の日本のドラマ・主演は黒木華・原作は人気漫画 → 6 決め手：毎朝のばしていた髪をもじゃもじゃのままに・タイトルは人生のお休み
// 恋の行方・元恋人や隣人との結末は言わない。人物名・地名・アパート名・タイトルの文字は出さない。俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。人は汎用の3D
const S = quizStage({ bg: '#6a7a92', floor: '#d8dee6', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(10510);

const HAIR = '#3a2a20';
const NAGI = { skin: '#f4d3b5', hair: HAIR, shirt: '#e8e0f0', pants: '#5a6a8a', skirt: true, long: true };
const NAGI_CASUAL = { skin: '#f4d3b5', hair: HAIR, shirt: '#f0d070', pants: '#6a8aa8' };
const CO = [{ skin: '#f1c9a5', hair: '#1a1410', shirt: '#ffffff', pants: '#2a2e3a', tie: true }, { skin: '#e8b98f', hair: '#6a4a30', shirt: '#f0c8d0', pants: '#3a3e52', skirt: true, long: true }, { skin: '#f4d3b5', hair: '#2c2421', shirt: '#d0e0f0', pants: '#2a2e3a', skirt: true }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
// もじゃもじゃの髪（頭にのせる球のかたまり）
function curls(p) { const g = new THREE.Group(); const m = mat(HAIR);
  for (let i = 0; i < 34; i++) { const a = i * 2.39996, y = 0.18 + (i % 7) * 0.065, r = 0.27 - Math.max(0, y - 0.45) * 0.5; const s = new THREE.Mesh(new THREE.SphereGeometry(0.1 + (i % 3) * 0.02, 8, 6), m); s.position.set(Math.cos(a) * r, y + 0.1, Math.sin(a) * r * 0.95 - 0.04); if (s.position.z > 0.12 && y < 0.4) continue; g.add(s); }
  p.userData.head.add(g); return g; }
function fan(x, y, z, s = 1) { const g = new THREE.Group(); const ye = mat('#f0c830');
  const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.08, 16), ye); g.add(bs); const pl = box(0.06, 0.7, 0.06, ye); pl.position.y = 0.38; g.add(pl);
  const cg = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 24), ye); cg.position.set(0, 0.8, 0.05); g.add(cg);
  const bl = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = box(0.1, 0.26, 0.02, gl('#fff6c8', 0.9)); b.position.y = 0.13; const h = new THREE.Group(); h.add(b); h.rotation.z = i * 2.094; bl.add(h); } bl.position.set(0, 0.8, 0.06); g.add(bl);
  g.userData.blade = bl; g.position.set(x, y, z); g.scale.setScalar(s); qs.add(g); return g; }

// ---------- 1段目. オフィス（x=0）。同僚の輪のなかで、ひとりだけ笑顔を作る女性。やがて、ひざをつく ----------
{ const fl = box(14, 0.04, 12, mat('#c8ccd4')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(14, 4.2, 0.2, mat('#f0f0ec')); wl.position.set(0, 2.1, -6); qs.add(wl);
  for (let i = 0; i < 4; i++) { const d = box(1.6, 0.06, 0.8, mat('#e8e8e8')); d.position.set(-4.2 + i * 2.8, 0.74, -4.4); qs.add(d);
    const m = box(0.7, 0.45, 0.04, mat('#2a2e38')); m.position.set(-4.2 + i * 2.8, 1.05, -4.7); qs.add(m); }
  for (let i = 0; i < 3; i++) { const w = box(2.2, 1.6, 0.06, gl('#b8d8f0')); w.position.set(-4 + i * 4, 2.6, -5.88); qs.add(w); } }
const nagi1 = makePerson(NAGI); nagi1.position.set(0, 0, -2.2); qs.add(nagi1);
const CO1 = CO.map((c, i) => { const p = makePerson(c); const a = -0.9 + i * 0.9; p.position.set(Math.sin(a) * 1.5, 0, -2.2 - Math.cos(a) * 1.3); p.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); qs.add(p); return p; });
const BUB1 = CO1.map(() => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), gl('#ffffff', 0.9)); b.scale.set(1.4, 0.8, 0.3); qs.add(b); return b; });
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tFace = tag('まわりの顔色を、うかがう毎日', { size: 50, w: 800, bg: '#14161c', sx: 3.0 }); tFace.position.set(0, 3.15, -3.2); qs.add(tFace);
const tFall = tag('ある日、倒れてしまう', { size: 56, w: 620, bg: '#c8202c', sx: 2.4 }); tFall.position.set(0, 3.15, -3.2); qs.add(tFall);

// ---------- 2段目. 自分の机（x=50）。笑顔で書類を受け取りつづける ----------
const AX = 50;
{ const fl = box(12, 0.04, 10, mat('#c8ccd4')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.2, 0.2, mat('#f0f0ec')); wl.position.set(AX, 2.1, -5); qs.add(wl);
  const d = box(1.8, 0.06, 0.9, mat('#e8e8e8')); d.position.set(AX, 0.74, -2.8); qs.add(d);
  const l = box(1.7, 0.72, 0.06, mat('#b8bcc4')); l.position.set(AX, 0.37, -3.2); qs.add(l);
  const m = box(0.7, 0.45, 0.04, mat('#2a2e38')); m.position.set(AX + 0.4, 1.05, -3.1); qs.add(m); }
const nagi2 = makePerson(NAGI); nagi2.position.set(AX - 0.2, 0, -2.0); nagi2.rotation.y = Math.PI; qs.add(nagi2);
const PAPER2 = []; for (let i = 0; i < 14; i++) { const p = box(0.5, 0.04, 0.36, mat(i % 3 ? '#ffffff' : '#f0f0d8')); p.position.set(AX, 0.8, -2.8); qs.add(p); PAPER2.push(p); }
const CO2 = [0, 1].map(i => { const p = makePerson(CO[i * 2]); p.position.set(AX + (i ? 1.5 : -1.7), 0, -3.4); p.rotation.y = (i ? -1 : 1) * 0.6; qs.add(p); return p; });
const t28 = tag('主人公は、28歳の会社員', { size: 54, w: 700, bg: '#14161c', sx: 2.6 }); t28.position.set(AX, 2.9, -3.6); qs.add(t28);
const tAir = tag('空気を、読みすぎる', { size: 58, w: 580, bg: '#2a6ab0', sx: 2.2 }); tAir.position.set(AX, 2.9, -3.6); qs.add(tAir);

// ---------- 3段目. 都心のワンルーム（x=100）。家具が消え、段ボールが積まれていく ----------
const BX = 100;
{ const fl = box(10, 0.04, 8, mat('#c8a888')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#f4f0e8')); wl.position.set(BX, 2, -5); qs.add(wl);
  const win = box(2.4, 1.8, 0.06, gl('#a8c8f0')); win.position.set(BX + 1.6, 2.4, -4.88); qs.add(win);
  for (let i = 0; i < 6; i++) { const b = box(0.24, 2.8, 0.24, mat('#8a96a8')); b.position.set(BX + 0.6 + i * 0.4, 2.0 + (i % 3) * 0.3, -4.95); qs.add(b); } }
const FURN3 = [box(1.6, 0.5, 2.0, mat('#e8d8c8')), box(1.0, 1.6, 0.4, mat('#a87a50')), box(1.2, 0.5, 0.6, mat('#6a4a3a')), box(0.6, 0.9, 0.5, mat('#8a9aa8'))];
const FPOS3 = [[BX - 2.6, 0.25, -3.2], [BX - 0.6, 0.8, -4.6], [BX + 1.6, 0.25, -3.6], [BX + 2.8, 0.45, -2.6]];
FURN3.forEach((f, i) => { f.position.set(...FPOS3[i]); qs.add(f); });
const BOX3 = []; for (let i = 0; i < 5; i++) { const b = box(0.6, 0.45, 0.45, mat('#c8a070')); const tp = box(0.62, 0.02, 0.08, mat('#e8dcb0')); tp.position.y = 0.23; b.add(tp); b.position.set(BX, 0, -2.6); qs.add(b); BOX3.push(b); }
const nagi3 = makePerson(NAGI); nagi3.position.set(BX, 0, -1.6); qs.add(nagi3);
const tQuit = tag('会社を、辞めた', { size: 60, w: 480, bg: '#14161c', sx: 2.2 }); tQuit.position.set(BX, 3.3, -3.0); qs.add(tQuit);
const tThrow = tag('持ち物も、ほとんど手放す', { size: 54, w: 720, bg: '#c8202c', sx: 3.0 }); tThrow.position.set(BX, 3.3, -3.0); qs.add(tThrow);

// ---------- 4段目. 郊外の古いアパート（x=150）。スーツケースを引いて歩いてくる ----------
const CX = 150;
{ const gr = box(30, 0.04, 24, mat('#b8c8a0')); gr.position.set(CX, 0.02, -6); qs.add(gr);
  const rd = box(30, 0.05, 2.4, mat('#9a9a92')); rd.position.set(CX, 0.03, 0.6); qs.add(rd);
  const ap = box(6.4, 4.4, 2.6, mat('#d8ccb0')); ap.position.set(CX, 2.2, -7); qs.add(ap);
  const rf = box(6.8, 0.2, 3.0, mat('#7a5a4a')); rf.position.set(CX, 4.5, -7); qs.add(rf);
  const cor = box(6.4, 0.12, 0.8, mat('#9a8a78')); cor.position.set(CX, 2.2, -5.4); qs.add(cor);
  const rl = box(6.4, 0.5, 0.05, mat('#7a6a5a')); rl.position.set(CX, 2.5, -5.02); qs.add(rl);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) { const d = box(0.8, 1.6, 0.06, mat('#8a6a50')); d.position.set(CX - 2 + i * 2, 0.8 + f * 2.2, -5.68); qs.add(d); }
  const st = box(0.8, 0.1, 3.0, mat('#7a6a5a')); st.position.set(CX + 3.6, 1.1, -5.6); st.rotation.x = 0.7; qs.add(st);
  for (let i = 0; i < 4; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), mat('#5a8a4a')); tr.position.set(CX - 8 + i * 5 + (i > 1 ? 2 : 0), 2.2, -10); qs.add(tr); } }
const nagi4 = makePerson(NAGI); nagi4.position.set(CX, 0, 0); qs.add(nagi4);
const SUIT4 = box(0.4, 0.55, 0.22, mat('#c8202c')); SUIT4.position.set(CX, 0.3, 0.5); qs.add(SUIT4);
const tReset = tag('人間関係も、リセット', { size: 56, w: 620, bg: '#14161c', sx: 4.0 }); tReset.position.set(CX, 5.2, -5.4); qs.add(tReset);
const tZero = tag('郊外のアパートで、ゼロから', { size: 52, w: 780, bg: '#2a8a4a', sx: 4.6 }); tZero.position.set(CX, 5.2, -5.4); qs.add(tZero);

// ---------- 5段目. 居間（x=200）。テレビと、漫画の本の山 ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#8a6a4a')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#e8dcc4')); wl.position.set(TX, 2.5, -4); qs.add(wl);
  const rack = box(3.6, 0.6, 0.6, mat('#5a4a3a')); rack.position.set(TX, 0.3, -3.5); qs.add(rack); }
const TV5 = box(3.2, 1.9, 0.12, mat('#121418')); TV5.position.set(TX, 1.65, -3.5); qs.add(TV5);
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.7), new THREE.MeshBasicMaterial({ map: canvasTex(600, 340, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ad0f0'); gr.addColorStop(1, '#e8f4d8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a8a4a'; g.fillRect(0, h - 70, w, 70); g.fillStyle = '#d8ccb0'; g.fillRect(180, 120, 240, 150); }) }));
SCR5.position.set(TX, 1.65, -3.43); qs.add(SCR5);
const BOOKS5 = []; for (let i = 0; i < 7; i++) { const b = box(0.5, 0.08, 0.36, mat(['#e8506a', '#4a8ad8', '#f0c830', '#5ab87a'][i % 4])); b.position.set(TX + 2.4, 0.08 + i * 0.09, -2.2); b.rotation.y = (i % 3 - 1) * 0.15; qs.add(b); BOOKS5.push(b); }
const t2019 = tag('2019年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.4 }); t2019.position.set(TX, 3.3, -3.2); qs.add(t2019);
const tKuroki = tag('主演は、黒木華', { size: 60, w: 520, bg: '#2a6ab0', sx: 2.6 }); tKuroki.position.set(TX, 3.3, -3.2); qs.add(tKuroki);

// ---------- 6段目. 六畳一間（x=250）。鏡の前で、まっすぐな髪が もじゃもじゃ に。黄色い扇風機 ----------
const DX = 250;
{ const fl = box(8, 0.04, 8, mat('#c8b48a')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 4; i++) { const ln = box(0.02, 0.01, 8, mat('#a8946a')); ln.position.set(DX - 3 + i * 2, 0.045, -2); qs.add(ln); }
  const wl = box(8, 4, 0.2, mat('#e8dcc0')); wl.position.set(DX, 2, -5); qs.add(wl);
  const win = box(2.0, 1.6, 0.06, gl('#bfe0f8')); win.position.set(DX - 1.8, 2.3, -4.88); qs.add(win);
  const mf = box(1.0, 1.7, 0.08, mat('#8a6a4a')); mf.position.set(DX + 1.2, 1.5, -4.82); qs.add(mf);
  const mr = box(0.84, 1.54, 0.02, new THREE.MeshStandardMaterial({ color: '#dfe8f0', metalness: 0.7, roughness: 0.1 })); mr.position.set(DX + 1.2, 1.5, -4.76); qs.add(mr); }
const FAN6 = fan(DX - 1.6, 0, -3.6, 1.3);
const nagiS6 = makePerson(NAGI); nagiS6.position.set(DX + 0.4, 0, -2.4); qs.add(nagiS6);
const nagiC6 = makePerson(NAGI_CASUAL); nagiC6.position.set(DX + 0.4, 0, -2.4); curls(nagiC6); qs.add(nagiC6);
const POOF6 = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), gl('#fff4c0', 0.9)); s.position.set(DX, 2, -2.4); qs.add(s); POOF6.push(s); }
const tCurl = tag('毎朝のばした髪を、もじゃもじゃのままに', { size: 48, w: 980, bg: '#c8202c', sx: 2.9 }); tCurl.position.set(DX + 0.25, 3.5, -3.4); qs.add(tCurl);
const tRest = tag('タイトルは、人生のお休み', { size: 54, w: 720, bg: '#2a6ab0', sx: 2.4 }); tRest.position.set(DX + 0.25, 3.5, -3.4); qs.add(tRest);

// ---------- shots ----------
const ALL = [tFace, tFall, t28, tAir, tQuit, tThrow, tReset, tZero, t2019, tKuroki, tCurl, tRest, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotOffice(t, quiz = 0) { // 1段目 0〜9：まわりの顔色をうかがう毎日。ある日、無理がたたって倒れてしまう（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.2;
  const k = quiz ? 0 : ease(clamp((t - 5.0) / 1.0));
  CO1.forEach((p, i) => { p.userData.arms[i % 2].rotation.x = -0.5 - Math.sin(t * 3 + i) * 0.3; });
  BUB1.forEach((b, i) => { const p = CO1[i]; b.visible = k < 0.5; b.position.set(p.position.x * 0.8, 2.25 + Math.sin(t * 3 + i) * 0.05, p.position.z + 0.2); });
  nagi1.userData.head.rotation.y = quiz ? 0 : Math.sin(t * 1.6) * 0.5 * (1 - k);
  nagi1.userData.legs.forEach(l => l.rotation.x = -k * 1.5); nagi1.position.y = -k * 0.55; nagi1.rotation.x = k * 0.3; nagi1.rotation.z = k * 0.3;
  nagi1.userData.arms.forEach((a, i) => { a.rotation.x = -k * 0.8; a.rotation.z = (i ? 1 : -1) * k * 0.3; });
  Q1.position.set(0.75, 2.35, -2.2); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { tFace.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tFace.visible = false; tFall.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(2.2, 2.0, u), lerp(3.6, 2.8, u), 0, 1.5, -2.6, 60);
  return qs;
}
function shotDesk(t) { // 2段目 9〜17：主人公は、28歳の会社員。空気を、読みすぎる
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.2;
  const n = Math.min(14, Math.floor(t * 2.2));
  PAPER2.forEach((p, i) => { p.visible = i < n; p.position.set(AX - 0.3 + (i % 2) * 0.05, 0.79 + i * 0.045, -2.8); p.rotation.y = (i * 0.37) % 0.3 - 0.15; });
  CO2.forEach((p, i) => { p.userData.arms[i].rotation.x = -1.2 + Math.sin(t * 4 + i * 3) * 0.3; });
  nagi2.userData.head.rotation.x = 0.15 + Math.sin(t * 5) * 0.12;
  t28.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t28.visible = false; tAir.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.6, -0.2, u), lerp(2.1, 2.0, u), lerp(1.8, 1.2, u), AX - 0.1, 1.6, -2.6, 62);
  return qs;
}
function shotRoom(t) { // 3段目 17〜25：会社を、辞めた。持ち物も、ほとんど手放す
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.2;
  FURN3.forEach((f, i) => { const k = clamp((t - 3.8 - i * 0.6) / 0.5); f.visible = k < 1; f.scale.setScalar(Math.max(0.01, 1 - k)); });
  BOX3.forEach((b, i) => { const k = ease(clamp((t - 4.2 - i * 0.5) / 0.4)); b.visible = k > 0; b.position.set(BX - 1.6 + (i % 3) * 0.66, 0.23 + Math.floor(i / 3) * 0.46 + (1 - k) * 1.5, -2.6); });
  nagi3.rotation.y = Math.sin(t * 0.7) * 0.4;
  tQuit.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tQuit.visible = false; tThrow.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0.2, u), lerp(2.6, 2.4, u), lerp(3.6, 3.0, u), BX, 1.5, -2.8, 66);
  return qs;
}
function shotApart(t) { // 4段目 25〜33：人間関係も、リセット。郊外の古いアパートで、ゼロから
  base(); S.aim(CX, -5); lift(0); S.hemi.intensity = 1.3;
  const z = lerp(0.8, -3.6, ease(clamp(t / 7)));
  nagi4.position.set(CX - 0.6, 0, z); nagi4.rotation.y = Math.PI; poseWalk(nagi4, t * 6, t < 7 ? 0.6 : 0); nagi4.userData.arms[1].rotation.x = 0.3;
  SUIT4.position.set(CX - 0.3, 0.3, z + 0.55);
  tReset.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tReset.visible = false; tZero.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.4, 0.8, u), lerp(1.8, 2.2, u), lerp(5.4, 4.4, u), CX, 2.6, -5.5, 66);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2019年の、日本のドラマ。主演は黒木華。原作は人気漫画
  base(); S.aim(TX, 0); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#2a2e38');
  t2019.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2019.visible = false; tKuroki.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.6, lerp(2.6, 2.4, u), lerp(5.4, 4.6, u), TX + 0.3, 1.9, -3.2, 62);
  return qs;
}
function shotCurl(t) { // 6段目 42〜49（決め手）：毎朝まっすぐにのばしていた髪を、もじゃもじゃのままに。タイトルは、人生のお休み
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.3;
  FAN6.userData.blade.rotation.z = t * 14;
  const sw = t > 1.6;
  nagiS6.visible = !sw; nagiC6.visible = sw;
  [nagiS6, nagiC6].forEach(p => { p.rotation.y = sw ? lerp(Math.PI, 0.3, ease(clamp((t - 2.4) / 0.8))) : Math.PI; });
  nagiC6.userData.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * 0.5 * clamp((t - 2.8) / 0.4); });
  POOF6.forEach((s, i) => { const k = clamp((t - 1.6) / 0.6); s.visible = k > 0 && k < 1; const a = i / 10 * Math.PI * 2; s.position.set(DX + 0.4 + Math.cos(a) * (0.3 + k * 0.6), 2.0 + Math.sin(a) * (0.3 + k * 0.5), -2.4); });
  if (t < 3.6) tCurl.userData.pop((t - 0.3) / 0.35); else tRest.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.6, -0.2, u), lerp(2.0, 1.9, u), lerp(2.6, 1.8, u), DX + 0.2, 1.6, -3.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（オフィスに戻る）
  shotOffice(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotOffice(t, 0) },
  { a: 9, b: 17, f: shotDesk },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotApart },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotCurl },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'いつも、まわりの<br>顔色をうかがう毎日。'],
  [5.6, 9.0, 'ある日、無理がたたって<br>倒れてしまう。'],
  [9.2, 13.2, '主人公は、<br>28歳の会社員。'],
  [13.2, 17.0, '空気を、<br>読みすぎてしまう。'],
  [17.2, 21.0, '彼女は、<br>会社を辞めた。'],
  [21.0, 25.0, '持ち物も、<br>ほとんど手放す。'],
  [25.2, 29.0, '人間関係も、<br>すべてリセット。'],
  [29.0, 33.0, '郊外の古いアパートで、<br>ゼロから暮らす。'],
  [33.2, 37.4, '2019年の、<br>日本のドラマ。'],
  [37.4, 41.8, '主演は黒木華。<br>原作は人気漫画。'],
  [42.2, 45.4, '毎朝のばしていた髪を、<br>もじゃもじゃのままに。'],
  [45.4, 49.0, 'タイトルは、<br>人生のお休み。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>凪のお暇。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q105', v2: true, answer: '凪のお暇',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 10510,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '凪のお暇': 'なぎのおいとま', '顔色': 'かおいろ', '毎日': 'まいにち', '無理': 'むり', '倒れて': 'たおれて', '主人公': 'しゅじんこう', '28歳': 'にじゅうはっさい', '会社員': 'かいしゃいん', '空気': 'くうき', '読みすぎて': 'よみすぎて', '彼女': 'かのじょ', '会社': 'かいしゃ', '辞めた': 'やめた', '持ち物': 'もちもの', '手放す': 'てばなす', '人間関係': 'にんげんかんけい', '郊外': 'こうがい', '古い': 'ふるい', '暮らす': 'くらす', '2019年': 'にせんじゅうきゅうねん', '日本': 'にほん', '主演': 'しゅえん', '黒木華': 'くろきはる', '原作': 'げんさく', '人気漫画': 'にんきまんが', '毎朝': 'まいあさ', '髪': 'かみ', '人生': 'じんせい', 'お休み': 'おやすみ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nいつも、まわりの顔色をうかがう毎日。ある日、無理がたたって倒れてしまう。主人公は、28歳の会社員。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'Hulu', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: '凪のお暇', info: 'Prime Video・Hulu｜日本のドラマ', answerSize: 136 });
