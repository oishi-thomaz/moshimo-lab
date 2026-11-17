import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #098 花束みたいな恋をした（映画・日本・2021年1月29日公開・124分。Prime Video・U-NEXT・FOD で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/hua-shu-mitainalian-woshita と Filmarks の動画配信欄（Prime Video・U-NEXT・FOD 見放題）で2026/11/17確認。
//   Filmarks 3.9・レビュー254,813件 filmarks.com/movies/87476）
// 確かめた事実（映画.com eiga.com/movie/92102 の解説。2026/11/17）：
//   ・坂元裕二（「東京ラブストーリー」など）のオリジナル脚本。主演は菅田将暉と有村架純。監督 土井裕泰
//   ・終電を逃した駅で出会った大学生の男女。好きな音楽や映画の趣味がほぼ同じで、惹かれ合う
//   ・大学卒業後はフリーターとして働きながら同棲を始め、現状維持を目標に就職活動を続けるが、思うようにいかず、ふたりの関係は変化していく
//   ・偶然の出会いから始まった、恋の5年間の行方を描く
// 構成（ヒント6段）：1 終電を逃した夜・駅で見知らぬふたりが出会う → 2 ふたりは大学生・好きな音楽も映画もほとんど同じ
//   → 3 卒業して小さな部屋でふたり暮らし・目標は今の暮らしを続けること → 4 働きながら就職活動・思うようにいかず関係が変わっていく
//   → 5 2021年の日本映画・脚本は「東京ラブストーリー」の坂元裕二 → 6 決め手：菅田将暉と有村架純・偶然から始まった恋の5年間
// 恋の結末は言わない。駅名・地名・人物名・作品名は出さない。俳優の顔・ポスター・ロゴ・劇中の有名な場面（同じ靴など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#141a2a', floor: '#1e2230', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(9898);

const HE = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#5a6a8a', pants: '#2a2e3a' };
const SHE = { skin: '#f4d3b5', hair: '#4a3426', shirt: '#d8c8a8', pants: '#6a5a4a', long: true, skirt: true };
function gl(c) { return new THREE.MeshBasicMaterial({ color: c }); }

// ---------- 1段目. 夜の駅のホーム（x=0）。終電が出ていく。ホームにふたりだけ ----------
{ const pf = box(8, 1.0, 30, mat('#5a5e68')); pf.position.set(-1, 0.5, -8); qs.add(pf);
  const edge = box(0.3, 0.02, 30, gl('#e6c050')); edge.position.set(2.7, 1.01, -8); qs.add(edge);
  for (let i = 0; i < 5; i++) { const pl = box(0.25, 4, 0.25, mat('#3a3e48')); pl.position.set(-3.5, 3, -2 - i * 6); qs.add(pl); const lt = box(1.6, 0.1, 0.3, gl('#f4f0d8')); lt.position.set(-2.8, 4.8, -2 - i * 6); qs.add(lt); }
  const roof = box(8, 0.2, 30, mat('#2a2e38')); roof.position.set(-1, 5.0, -8); qs.add(roof);
  for (const x of [4.2, 5.6]) { const r = box(0.12, 0.1, 40, mat('#6a6a6a')); r.position.set(x, 0.05, -8); qs.add(r); } }
const TRAIN1 = new THREE.Group();
{ for (let c = 0; c < 3; c++) { const b = box(2.6, 2.8, 12, mat('#c8ccd4')); b.position.set(0, 1.6, -c * 12.3); TRAIN1.add(b);
    const st = box(2.62, 0.3, 12, gl('#3a8a5a')); st.position.set(0, 1.0, -c * 12.3); TRAIN1.add(st);
    for (let w = 0; w < 4; w++) { const wn = box(2.64, 0.9, 1.6, gl('#f4ecc8')); wn.position.set(0, 2.2, -c * 12.3 - 4.5 + w * 3); TRAIN1.add(wn); } } }
TRAIN1.position.set(4.9, 0, 0); qs.add(TRAIN1);
const CLOCK1 = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(260, 120, (g, w, h) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff8a3a'; g.font = '900 84px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0:21', w / 2, h / 2 + 4); }) }));
CLOCK1.position.set(-1.5, 4.3, -5.9); qs.add(CLOCK1);
const he1 = makePerson(HE); he1.position.set(-0.5, 1.0, -4.0); qs.add(he1);
const she1 = makePerson(SHE); she1.position.set(1.0, 1.0, -4.3); qs.add(she1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.4 }); qs.add(Q1);
const tLast = tag('終電を、逃した夜', { size: 60, w: 560, bg: '#14161c', sx: 1.9 }); tLast.position.set(0.25, 3.9, -4.1); qs.add(tLast);
const tMeet = tag('見知らぬふたりが、出会う', { size: 54, w: 720, bg: '#c8507a', sx: 2.3 }); tMeet.position.set(0.25, 3.9, -4.1); qs.add(tMeet);

// ---------- 2段目. 夜のお店のテーブル（x=50）。ふたりの前に、同じ色の本と同じ色のディスク ----------
const AX = 50;
{ const fl = box(12, 0.04, 10, mat('#3a2e28')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#4a3a34')); wl.position.set(AX, 2.5, -5); qs.add(wl);
  const tb = box(2.4, 0.08, 1.2, mat('#8a6a4a')); tb.position.set(AX, 0.95, -2.2); qs.add(tb);
  const lg = box(0.1, 0.9, 0.1, mat('#5a4a3a')); lg.position.set(AX, 0.45, -2.2); qs.add(lg);
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), gl('#ffd890')); lp.position.set(AX - 3 + i * 2, 3.6, -3.4); qs.add(lp); } }
const he2 = makePerson(HE); he2.position.set(AX - 1.0, -0.3, -2.2); he2.rotation.y = Math.PI / 2; he2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(he2);
const she2 = makePerson(SHE); she2.position.set(AX + 1.0, -0.3, -2.2); she2.rotation.y = -Math.PI / 2; she2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(she2);
const ITEMS2 = [];
for (const s of [-1, 1]) {
  ['#c8505a', '#4a7ad8', '#e6b450'].forEach((c, i) => { const b = box(0.32, 0.07, 0.44, mat(c)); b.position.set(AX + s * 0.5, 1.03 + i * 0.075, -2.35); qs.add(b); ITEMS2.push(b); });
  const d = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), mat('#2eaa5a')); d.position.set(AX + s * 0.5, 1.0, -1.9); qs.add(d); ITEMS2.push(d);
}
const EQ2 = tag('＝', { size: 100, w: 140, h: 140, bg: '#e6b450', color: '#14161c', sx: 0.45 }); EQ2.position.set(AX, 1.7, -2.2); qs.add(EQ2);
const tUni = tag('ふたりは、大学生', { size: 60, w: 540, bg: '#14161c', sx: 1.6 }); tUni.position.set(AX, 2.9, -2.4); qs.add(tUni);
const tSame = tag('好きなものが、ほとんど同じ', { size: 52, w: 760, bg: '#c8507a', sx: 2.1 }); tSame.position.set(AX, 2.9, -2.4); qs.add(tSame);

// ---------- 3段目. 小さな部屋（x=100）。窓の外は川。ふたり暮らし ----------
const BX = 100;
{ const fl = box(8, 0.04, 7, mat('#a8885a')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(8, 4, 0.2, mat('#e8e0d0')); wl.position.set(BX, 2, -5); qs.add(wl);
  const wl2 = box(0.2, 4, 7, mat('#ddd4c4')); wl2.position.set(BX - 4, 2, -2); qs.add(wl2);
  const win = box(2.6, 1.6, 0.06, gl('#9ac8e8')); win.position.set(BX + 1.4, 2.3, -4.87); qs.add(win);
  const riv = box(2.6, 0.4, 0.07, gl('#5a8ab8')); riv.position.set(BX + 1.4, 1.75, -4.85); qs.add(riv);
  const sofa = box(2.4, 0.45, 0.9, mat('#c88a5a')); sofa.position.set(BX - 1.2, 0.23, -3.8); qs.add(sofa);
  const sb = box(2.4, 0.7, 0.25, mat('#c88a5a')); sb.position.set(BX - 1.2, 0.75, -4.2); qs.add(sb);
  const sh = box(1.2, 2.2, 0.4, mat('#8a6a4a')); sh.position.set(BX - 3.5, 1.1, -4.6); qs.add(sh);
  for (let i = 0; i < 12; i++) { const b = box(0.08, 0.32, 0.26, mat(['#c8505a', '#4a7ad8', '#e6b450', '#3a8a5a'][i % 4])); b.position.set(BX - 3.95 + (i % 6) * 0.17, 0.6 + Math.floor(i / 6) * 0.8, -4.45); qs.add(b); }
  const cat = box(0.5, 0.3, 0.3, mat('#8a8a8a')); cat.position.set(BX + 0.6, 0.15, -2.6); qs.add(cat); }
const he3 = makePerson(HE); he3.position.set(BX - 1.7, -0.25, -3.7); he3.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(he3);
const she3 = makePerson(SHE); she3.position.set(BX - 0.7, -0.25, -3.7); she3.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(she3);
const tTwo = tag('小さな部屋で、ふたり暮らし', { size: 52, w: 760, bg: '#14161c', sx: 2.3 }); tTwo.position.set(BX - 0.6, 3.1, -3.6); qs.add(tTwo);
const tKeep = tag('目標は、この毎日が続くこと', { size: 52, w: 760, bg: '#3a8a5a', sx: 2.3 }); tKeep.position.set(BX - 0.6, 3.1, -3.6); qs.add(tKeep);

// ---------- 4段目. 夜の部屋（x=150）。テーブルの両はしに離れて座る。書類の山とノートパソコン ----------
const CX = 150;
{ const fl = box(10, 0.04, 8, mat('#5a4a3a')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#3a3e4a')); wl.position.set(CX, 2, -5); qs.add(wl);
  const tb = box(2.6, 0.08, 1.0, mat('#8a6a4a')); tb.position.set(CX, 0.75, -2.4); qs.add(tb);
  const pc = box(0.6, 0.04, 0.45, mat('#9a9ea8')); pc.position.set(CX - 0.8, 0.81, -2.4); qs.add(pc);
  const scr = box(0.6, 0.4, 0.03, gl('#bfe0ff')); scr.position.set(CX - 0.8, 1.02, -2.62); qs.add(scr);
  for (let i = 0; i < 6; i++) { const p = box(0.4, 0.03, 0.55, mat('#f4f0e6')); p.position.set(CX + 0.8 + (R() - 0.5) * 0.1, 0.8 + i * 0.035, -2.4); p.rotation.y = (R() - 0.5) * 0.3; qs.add(p); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), gl('#ffe0a0')); lamp.position.set(CX, 2.8, -2.4); qs.add(lamp); }
const he4 = makePerson({ ...HE, shirt: '#2a2e3a', tie: true }); he4.position.set(CX - 1.55, -0.3, -2.4); he4.rotation.y = Math.PI / 2; he4.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(he4);
const she4 = makePerson(SHE); she4.position.set(CX + 1.55, -0.3, -2.4); she4.rotation.y = -Math.PI / 2; she4.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(she4);
const tJob = tag('働きながら、就職活動', { size: 56, w: 640, bg: '#14161c', sx: 2.0 }); tJob.position.set(CX, 2.4, -2.6); qs.add(tJob);
const tDrift = tag('ふたりの関係が、変わっていく', { size: 50, w: 780, bg: '#5a6a8a', sx: 2.3 }); tDrift.position.set(CX, 2.4, -2.6); qs.add(tDrift);

// ---------- 5段目. 映画館（x=200）。夕焼けの空の映像。2021年・日本映画 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f4a8a0'); gr.addColorStop(0.6, '#f8d8a8'); gr.addColorStop(1, '#8a9ac8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a3a5a'; for (let i = 0; i < 14; i++) { const bh = 40 + (i * 37 % 90); g.fillRect(i * 52, h - bh, 46, bh); } }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t2021 = tag('2021年の、日本映画', { size: 56, w: 640, bg: '#e6b450', color: '#14161c', sx: 3.8 }); t2021.position.set(TX, 6.0, -4.4); qs.add(t2021);
const tWriter = tag('脚本は、坂元裕二', { size: 60, w: 560, bg: '#c8507a', sx: 3.6 }); tWriter.position.set(TX, 6.0, -4.4); qs.add(tWriter);

// ---------- 6段目. 夜の並木道（x=250）。ふたりが並んで歩く。カレンダーが 5年 めくれる ----------
const DX = 250;
{ const fl = box(14, 0.04, 30, mat('#3a3a40')); fl.position.set(DX, 0.02, -8); qs.add(fl);
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const t = new THREE.Group(); const tk = box(0.22, 2.2, 0.22, mat('#4a3a2a')); tk.position.y = 1.1; t.add(tk); const c = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), mat(i % 2 ? '#c8a050' : '#d8805a')); c.position.y = 2.7; t.add(c); t.position.set(DX + s * 3.2, 0, -i * 3.4); qs.add(t); }
  for (let i = 0; i < 8; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), gl('#ffe0a0')); lp.position.set(DX + (i % 2 ? 2.2 : -2.2), 3.4, -1 - i * 3.4); qs.add(lp); } }
const he6 = makePerson(HE); he6.position.set(DX, 0, 0); qs.add(he6);
const she6 = makePerson(SHE); she6.position.set(DX, 0, 0); qs.add(she6);
const YEARS6 = [1, 2, 3, 4, 5].map(n => { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(160, 160, (g, w, h) => { g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8507a'; g.fillRect(0, 0, w, 36); g.fillStyle = '#14161c'; g.font = '900 70px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n + '年', 80, 102); }) })); qs.add(c); return c; });
const tStar = tag('菅田将暉と、有村架純', { size: 56, w: 660, bg: '#c8902c', sx: 2.2 }); qs.add(tStar);
const t5y = tag('偶然から始まった、恋の5年間', { size: 50, w: 800, bg: '#c8507a', sx: 2.6 }); qs.add(t5y);

// ---------- shots ----------
const ALL = [tLast, tMeet, tUni, tSame, EQ2, tTwo, tKeep, tJob, tDrift, t2021, tWriter, tStar, t5y, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotStation(t, quiz = 0) { // 1段目 0〜9：終電を逃した夜。駅のホームで、見知らぬふたりが出会う（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.7;
  TRAIN1.position.z = quiz ? -60 : -ease(clamp((t - 0.6) / 4.5)) * 60;
  he1.rotation.y = lerp(-0.2, 1.0, clamp((t - 4.6) / 0.8)); she1.rotation.y = lerp(0.3, -1.0, clamp((t - 5.0) / 0.8));
  he1.userData.head.rotation.y = t < 4 ? 0.5 : -0.2; she1.userData.head.rotation.y = t < 4 ? -0.4 : 0.2;
  Q1.position.set(0.25, 3.0, -4.1); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { tLast.userData.pop((t - 1.0) / 0.35); if (t > 4.6) tLast.visible = false; tMeet.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.2, 0.4, u), lerp(2.7, 2.5, u), lerp(3.0, 2.2, u), 0.25, 2.3, -4.2, 60);
  return qs;
}
function shotTable(t) { // 2段目 9〜17：ふたりは、大学生。好きな音楽も映画も、ほとんど同じ
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.3, '#1a1010');
  he2.userData.head.rotation.x = 0.25; she2.userData.head.rotation.x = 0.25;
  he2.userData.arms.forEach(a => a.rotation.x = -0.9); she2.userData.arms.forEach(a => a.rotation.x = -0.9);
  tUni.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tUni.visible = false; tSame.userData.pop((t - 4.3) / 0.35); EQ2.userData.pop((t - 4.8) / 0.3);
  if (t < 4) { const u = ease(t / 4); look(AX + lerp(0.8, 0.4, u), 2.2, lerp(2.4, 1.8, u), AX, 1.6, -2.3, 60); }
  else { const u = ease((t - 4) / 4); look(AX + 0.1, lerp(2.6, 2.8, u), lerp(0.6, 0.2, u), AX, 1.2, -2.3, 60); }
  return qs;
}
function shotRoom(t) { // 3段目 17〜25：卒業して、小さな部屋でふたり暮らし。目標は、この毎日がずっと続くこと
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.1; S.scene.background.set('#c8d8e8'); S.scene.fog.color.set('#c8d8e8');
  he3.userData.head.rotation.y = 0.3 + Math.sin(t * 1.3) * 0.1; she3.userData.head.rotation.y = -0.3;
  tTwo.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTwo.visible = false; tKeep.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.8, 1.2, u), lerp(2.3, 2.1, u), lerp(2.4, 1.6, u), BX - 0.8, 1.6, -3.8, 60);
  return qs;
}
function shotNight(t) { // 4段目 25〜33：働きながら、就職活動。思うようにいかず、ふたりの関係が変わっていく
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.5, '#06070c');
  he4.userData.head.rotation.x = 0.4; she4.userData.head.rotation.x = 0.4; she4.userData.head.rotation.y = lerp(0, 0.6, clamp((t - 4) / 1));
  tJob.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJob.visible = false; tDrift.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.3, 0.3, u), lerp(2.3, 2.5, u), lerp(2.9, 3.4, u), CX, 1.3, -2.4, 66);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2021年の、日本映画。脚本は「東京ラブストーリー」の、坂元裕二
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  t2021.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2021.visible = false; tWriter.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.4, 5.4, u), TX, 3.8, -4.8, 62);
  return qs;
}
function shotWalk(t) { // 6段目 42〜49（決め手）：菅田将暉と、有村架純。偶然から始まった、恋の5年間
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.55; S.darken(0.45, '#06070c');
  const z = -t * 0.9;
  he6.position.set(DX - 0.4, 0, z); she6.position.set(DX + 0.4, 0, z); he6.rotation.y = she6.rotation.y = Math.PI; poseWalk(he6, t * 7, 0.6); poseWalk(she6, t * 7 + 0.5, 0.6);
  const n = t < 3.6 ? -1 : Math.min(4, Math.floor((t - 3.6) / 0.6)); YEARS6.forEach((c, i) => { c.visible = i === n; c.position.set(DX + 1.05, 2.45, z - 3.0); });
  tStar.position.set(DX, 2.75, z - 0.6); t5y.position.set(DX, 3.3, z - 0.6);
  if (t < 3.6) tStar.userData.pop((t - 0.3) / 0.35); else t5y.userData.pop((t - 3.7) / 0.3);
  look(DX + 0.6, 2.1, z + 3.4, DX, 1.9, z - 1.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（駅に戻る）
  shotStation(6.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  const k = ease(t / 7);
  look(0.2, 2.6, lerp(2.8, 2.2, k), 0.25, 2.3, -4.2, 60);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStation(t, 0) },
  { a: 9, b: 17, f: shotTable },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotNight },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotWalk },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '終電を逃した夜、<br>駅のホームで。'],
  [5.6, 9.0, '見知らぬふたりが、<br>出会う。'],
  [9.2, 13.2, 'ふたりは、<br>大学生。'],
  [13.2, 17.0, '好きな音楽も映画も、<br>ほとんど同じ。'],
  [17.2, 21.0, '卒業して、小さな部屋で<br>ふたり暮らし。'],
  [21.0, 25.0, '目標は、この毎日が<br>ずっと続くこと。'],
  [25.2, 29.0, '働きながら、<br>就職活動。'],
  [29.0, 33.0, '思うようにいかず、<br>ふたりの関係が変わっていく。'],
  [33.2, 37.4, '2021年の、<br>日本映画。'],
  [37.4, 41.8, '脚本は、東京ラブストーリーの<br>坂元裕二。'],
  [42.2, 45.4, '菅田将暉と、<br>有村架純。'],
  [45.4, 49.0, '偶然から始まった、<br>恋の5年間。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、花束みたいな<br>恋をした。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q098', v2: true, answer: '花束みたいな恋をした',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 9898,
    hits: [5.6, 13.2, 21.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '終電': 'しゅうでん', '逃した': 'のがした', '夜': 'よる', '駅': 'えき', '見知らぬ': 'みしらぬ', '出会う': 'であう', '大学生': 'だいがくせい', '好きな': 'すきな', '音楽': 'おんがく', '映画': 'えいが', '同じ': 'おなじ', '卒業': 'そつぎょう', '小さな': 'ちいさな', '部屋': 'へや', '暮らし': 'ぐらし', '目標': 'もくひょう', '毎日': 'まいにち', '続く': 'つづく', '働きながら': 'はたらきながら', '就職活動': 'しゅうしょくかつどう', '思う': 'おもう', '関係': 'かんけい', '変わって': 'かわって', '2021年': 'にせんにじゅういちねん', '日本映画': 'にほんえいが', '脚本': 'きゃくほん', '東京ラブストーリー': 'とうきょうラブストーリー', '坂元裕二': 'さかもとゆうじ', '菅田将暉': 'すだまさき', '有村架純': 'ありむらかすみ', '偶然': 'ぐうぜん', '始まった': 'はじまった', '恋': 'こい', '5年間': 'ごねんかん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '花束': 'はなたば', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n終電を逃した夜、駅のホームで、見知らぬふたりが出会う。ふたりは大学生。好きな音楽も映画も、ほとんど同じ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'U-NEXT', '映画好き', '恋愛映画'],
  },
});
applyQuizCards({ answer: '花束みたいな<br>恋をした', info: 'Prime Video・U-NEXT｜日本映画・124分', answerSize: 112 });
