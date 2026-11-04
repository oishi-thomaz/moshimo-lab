import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #043 Pretender（曲・Official髭男dism・2019年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/4）：
//   ・配信開始 2019年4月17日（CD は 2019年5月15日）、日本レコード協会のストリーミング認定 ダイヤモンド（5億回以上。2022年2月度。riaj.or.jp/data/st/search/ で「Pretender」）
//   ・映画『コンフィデンスマンJP ロマンス編』（2019年5月17日公開）の主題歌（billboard-japan.com/d_news/detail/107042/2 ほか）
// 物語：曲が描く状況（片思いの相手と過ごす時間 → うまくいく姿は思い描けないのに、そばにいられるのがうれしい → 言えないまま別れの時間 → 本音をかくして平気なふり）を
//   自分の言葉で作り直したもの。歌詞の言葉・言い回しは使わない（歌詞と見比べて、重なる言葉がないことを確かめた）。映画の場面・音源・ジャケット・歌手の見た目は使わない
// 構成（ヒント6段）：1 片思いの相手と出かけた日・ため息 → 2 うまくいく姿は思い描けない・それでもうれしい → 3 駅までの静かな時間・胸にしまったまま
//   → 4 告白の勇気が出ない・さよならの時間 → 5 2019年・映画の主題歌・ストリーミング5億回 → 6 決め手：本音をかくして平気なふりをする人・それを表す英語のひと言

const S = quizStage({ bg: '#3a2a48', floor: '#3a3448', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(4343);

const ME = { skin: '#efcfae', hair: '#2a2420', shirt: '#4a6a9a', pants: '#2a2f3c' };
const YOU = { skin: '#f2d4b8', hair: '#5a3a28', shirt: '#f2e0c8', pants: '#8a5a6a', long: true, skirt: true };
const BLUE = '#4a7ad8';

// ---------- 1段目. 夕方の公園（x=0）。並んで座るふたりと、ため息 ----------
const SKY = (x, c1, c2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 44), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); m.position.set(x, 14, -40); qs.add(m); return m; };
SKY(0, '#4a3a7a', '#f2a070');
{ const gr = box(16, 0.04, 16, mat('#4a6a44')); gr.position.set(0, 0.02, -4); qs.add(gr); const pond = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshStandardMaterial({ color: '#6a8ab8', roughness: 0.2, metalness: 0.3 })); pond.rotation.x = -Math.PI / 2; pond.position.set(0, 0.05, -6); qs.add(pond);
  const seat = box(2.0, 0.08, 0.5, mat('#6a4a32')); seat.position.set(0, 0.48, -1.4); qs.add(seat); const back = box(2.0, 0.5, 0.06, mat('#6a4a32')); back.position.set(0, 0.8, -1.15); qs.add(back);
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const tr = box(0.2, 2, 0.2, mat('#5a3e28')); tr.position.y = 1; g.add(tr); const lf = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), mat('#3a6a3a')); lf.position.y = 2.6; g.add(lf); g.position.set(-6 + i * 3, 0, -10 - (i % 2) * 2); qs.add(g); } }
const me1 = makePerson(ME); me1.position.set(0.4, 0.16, -1.35); me1.rotation.y = Math.PI; me1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(me1);
const you1 = makePerson(YOU); you1.position.set(-0.4, 0.16, -1.35); you1.rotation.y = Math.PI; you1.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(you1);
const SIGH = []; for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.08 + i * 0.03, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true })); qs.add(p); SIGH.push(p); }
const tWith = tag('片思いの相手と', { size: 66, w: 520, bg: '#14161c', sx: 1.4 }); tWith.position.set(0, 2.2, -1.0); qs.add(tWith);
const tSigh = tag('なぜかため息', { size: 70, w: 460, bg: BLUE, sx: 1.4 }); tSigh.position.set(0, 2.6, -1.0); qs.add(tSigh);

// ---------- 2段目. カフェの窓ぎわ（x=40）。消えていく「ふたりの絵」 ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#6a5040')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#d8c8b0')); wl.position.set(KX, 3, -4); qs.add(wl);
  const tb = box(1.4, 0.06, 0.8, mat('#e8dcc8')); tb.position.set(KX, 0.8, -1.5); qs.add(tb); const lg = box(0.08, 0.8, 0.08, mat('#2a2a2e')); lg.position.set(KX, 0.4, -1.5); qs.add(lg);
  for (const s of [-0.3, 0.3]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 14), mat('#ffffff')); cup.position.set(KX + s, 0.9, -1.5); qs.add(cup); } }
const me2 = makePerson(ME); me2.position.set(KX + 0.95, -0.32, -1.5); me2.rotation.y = -Math.PI / 2; me2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(me2);
const you2 = makePerson(YOU); you2.position.set(KX - 0.95, -0.32, -1.5); you2.rotation.y = Math.PI / 2; you2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(you2);
const PIC = new THREE.Group(); PIC.position.set(KX + 0.5, 2.6, -1.6); qs.add(PIC);
{ const fr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })); PIC.add(fr); PIC.userData.fr = fr;
  const a = makePerson(ME); a.scale.setScalar(0.3); a.position.set(0.12, -0.38, 0.02); PIC.add(a); const b = makePerson(YOU); b.scale.setScalar(0.3); b.position.set(-0.12, -0.38, 0.02); PIC.add(b); PIC.userData.ppl = [a, b];
  const hr = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: '#ff7aa8' })); hr.position.set(0, 0.25, 0.03); PIC.add(hr); }
const tCant = tag('うまくいく姿が見えない', { size: 56, w: 660, bg: '#14161c', sx: 1.4 }); tCant.position.set(KX - 0.2, 2.65, -1.2); qs.add(tCant);
const tGlad = tag('それでも、うれしい', { size: 62, w: 580, bg: BLUE, sx: 1.4 }); tGlad.position.set(KX - 0.2, 2.65, -1.2); qs.add(tGlad);

// ---------- 3段目. 駅までの道（x=90）。並んで歩くふたり ----------
const CX = 90;
SKY(CX, '#2a2a5a', '#c8789a');
{ const rd = box(6, 0.04, 40, mat('#4a4658')); rd.position.set(CX, 0.03, -10); qs.add(rd); }
const ST = new THREE.Group(); ST.position.set(CX, 0, -22); qs.add(ST);
{ const wt = windowTextures(4300, '#8a8a9a'); wt.map.repeat.set(4, 2); wt.emi.repeat.set(4, 2); const b = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 3), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe0a0'), emissiveIntensity: 0.6 })); b.position.y = 2; ST.add(b); const rf = box(11, 0.4, 3.6, mat('#3a3a48')); rf.position.y = 4.2; ST.add(rf); const ck = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), new THREE.MeshBasicMaterial({ color: '#f4f0e0' })); ck.position.set(0, 5.2, 1.6); ST.add(ck); const ckb = box(1.4, 1.4, 0.1, mat('#3a3a48')); ckb.position.set(0, 5.2, 1.5); ST.add(ckb); }
const LAMPS3 = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const g = new THREE.Group(); const p = box(0.08, 3.2, 0.08, mat('#2a2a2e')); p.position.y = 1.6; g.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); l.position.y = 3.3; g.add(l); g.position.set(CX + s * 2.6, 0, 2 - i * 5); qs.add(g); LAMPS3.push(g); }
const me3 = makePerson(ME); me3.position.set(CX + 0.35, 0, 0); me3.rotation.y = Math.PI; qs.add(me3);
const you3 = makePerson(YOU); you3.position.set(CX - 0.35, 0, 0); you3.rotation.y = Math.PI; qs.add(you3);
const tStation = tag('駅までの静かな時間', { size: 58, w: 620, bg: '#14161c', sx: 1.9 }); tStation.position.set(CX, 2.7, -0.4); qs.add(tStation);
const tKeep = tag('言いたいことは胸の中', { size: 56, w: 640, bg: BLUE, sx: 1.9 }); tKeep.position.set(CX, 2.7, -0.4); qs.add(tKeep);

// ---------- 4段目. 改札の前（x=130）。手をふって別れる ----------
const BX = 130;
{ const fl = box(12, 0.04, 8, mat('#8a8a90')); fl.position.set(BX, 0.02, -1); qs.add(fl); const wl = box(12, 6, 0.2, mat('#c8c8cc')); wl.position.set(BX, 3, -5); qs.add(wl);
  for (let i = 0; i < 5; i++) { const g = box(0.3, 1.0, 1.4, mat('#5a6070')); g.position.set(BX - 2.4 + i * 1.2, 0.5, -3); qs.add(g); const lt = box(0.2, 0.06, 0.2, new THREE.MeshBasicMaterial({ color: '#6ae08a' })); lt.position.set(BX - 2.4 + i * 1.2, 1.04, -2.4); qs.add(lt); }
  const bd = box(4, 0.7, 0.1, new THREE.MeshBasicMaterial({ color: '#1a1e2a' })); bd.position.set(BX, 3.9, -4.85); qs.add(bd); }
const CLOCK4 = new THREE.Group(); CLOCK4.position.set(BX + 2.6, 3.6, -4.8); qs.add(CLOCK4);
{ const f = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: '#f4f0e0' })); CLOCK4.add(f); const h = box(0.04, 0.3, 0.02, mat('#1a1a1a')); h.geometry.translate(0, 0.15, 0); h.position.z = 0.02; CLOCK4.add(h); CLOCK4.userData.h = h; }
const you4 = makePerson(YOU); you4.position.set(BX - 0.2, 0, -2.0); qs.add(you4);
const me4 = makePerson(ME); me4.position.set(BX + 0.4, 0, 0); me4.rotation.y = Math.PI; qs.add(me4);
const tBrave = tag('告白の勇気が出ない', { size: 60, w: 600, bg: '#14161c', sx: 1.4 }); tBrave.position.set(BX + 0.2, 2.75, -1.0); qs.add(tBrave);
const tBye = tag('さよならの時間', { size: 66, w: 520, bg: BLUE, sx: 1.4 }); tBye.position.set(BX + 0.2, 2.75, -1.0); qs.add(tBye);

// ---------- 5段目. 2019年・映画の主題歌・ストリーミング5億回（x=170） ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#221e34' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX - 1.2, 3.2, -1.6); DISC.scale.setScalar(0.8); qs.add(DISC);
const FILM = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(190, 130, (g, w, h) => { g.fillStyle = '#14161c'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f0e0'; for (let i = 0; i < 9; i++) { g.fillRect(8 + i * 20, 6, 10, 12); g.fillRect(8 + i * 20, h - 18, 10, 12); } g.fillStyle = '#4a7ad8'; g.fillRect(14, 28, w - 28, h - 56); }) })); FILM.position.set(FX + 1.2, 3.2, -1.6); qs.add(FILM);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 4.4, -1.4); BARS.scale.set(0.8, 0.4, 0.8); qs.add(BARS);
const tYear = tag('2019年 映画の主題歌', { size: 58, w: 680, bg: '#e6b450', color: '#14161c', sx: 2.9 }); tYear.position.set(FX, 5.6, -1.2); qs.add(tYear);
const tPlay = tag('ストリーミング 5億回超え', { size: 56, w: 740, bg: SONG_GREEN, sx: 3.0 }); tPlay.position.set(FX, 5.6, -1.2); qs.add(tPlay);

// ---------- 6段目. 笑う仮面と泣く仮面（x=210）。平気なふりをする人 ----------
const NX = 210;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ color: '#1a1828' })); bg.position.set(NX, 3.5, -3.6); qs.add(bg); }
const me6 = makePerson(ME); me6.position.set(NX, 0, -1.6); qs.add(me6);
function face(happy) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CircleGeometry(0.3, 28), mat(happy ? '#fff4e0' : '#c8d8f0')); g.add(m); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 6, 12, Math.PI), mat('#2a2a30')); e.position.set(s * 0.1, 0.06, 0.01); if (!happy) e.rotation.z = Math.PI; g.add(e); } const mo = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 16, Math.PI), mat(happy ? '#e8487a' : '#4a5a7a')); mo.position.set(0, happy ? -0.06 : -0.14, 0.01); if (happy) mo.rotation.z = Math.PI; g.add(mo); if (!happy) { const tr = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#6ab8ff' })); tr.position.set(0.1, -0.03, 0.02); g.add(tr); } qs.add(g); return g; }
const HAPPY = face(true), SAD = face(false);
const tPretend = tag('平気なふりをする人', { size: 60, w: 600, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tPretend.position.set(NX, 3.0, -0.8); qs.add(tPretend);
const tEng = tag('タイトルは英語のひと言', { size: 56, w: 680, bg: SONG_GREEN, sx: 1.7 }); tEng.position.set(NX, 2.5, -0.8); qs.add(tEng);

// ---------- shots ----------
const ALL = [tWith, tSigh, tCant, tGlad, tStation, tKeep, tBrave, tBye, tYear, tPlay, tPretend, tEng];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SIGH.forEach(p => p.visible = false); HAPPY.visible = SAD.visible = false; }
function walk(p, t, k = 1) { const ph = t * 6; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.4 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }

function shotPark(t) { // 1段目 0〜9：片思いの相手と、ふたりで出かけた日。楽しいはずなのに、ため息がこぼれる（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.0; S.darken(0.15, '#f2a070');
  you1.userData.head.rotation.y = 0.3 + Math.sin(t * 1.4) * 0.15; you1.userData.arms[0].rotation.x = -0.4 + Math.sin(t * 2) * 0.3;
  me1.userData.head.rotation.y = t < 4.4 ? -0.4 : -0.4 + 0.5 * ease((t - 4.4) / 0.6); me1.userData.head.rotation.x = t > 4.4 ? 0.25 : 0;
  SIGH.forEach((p, i) => { const k = clamp((t - 4.8 - i * 0.12) / 1.6); p.visible = k > 0 && k < 1; p.position.set(0.4 + k * 0.5 + i * 0.05, 2.0 + k * 0.4, -1.1 + k * 0.3); p.material.opacity = 0.9 * (1 - k); });
  tWith.userData.pop(1); if (t > 4.6) tWith.visible = false;
  tSigh.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.8, 0.5, u), lerp(1.8, 1.7, u), lerp(3.8, 3.2, u), 0, 1.3, -1.8, 56);
  return qs;
}
function shotCafe(t) { // 2段目 9〜17：ふたりがうまくいく姿は、どうしても思い描けない。それでも、となりにいられる時間がうれしい
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.15;
  you2.userData.arms[0].rotation.x = -0.9; me2.userData.arms[1].rotation.x = -0.9; you2.userData.head.rotation.x = Math.sin(t * 2) * 0.05;
  const fade = ease(clamp((t - 1.6) / 2.4)); PIC.userData.fr.material.opacity = 0.85 * (1 - fade); PIC.userData.ppl.forEach(p => p.visible = fade < 0.7); PIC.visible = fade < 0.98; PIC.position.y = 2.6 + fade * 0.3;
  me2.userData.head.rotation.x = t > 4.2 ? -0.1 : 0.15;
  tCant.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tCant.visible = false;
  tGlad.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.3, 0.1, u), lerp(1.9, 1.8, u), lerp(2.9, 2.4, u), KX, 1.5, -1.5, 56);
  return qs;
}
function shotWalk(t) { // 3段目 17〜25：何気ない会話と、駅までの静かな時間。胸の内は、今日もしまったまま
  base(); S.aim(CX, -4); lift(-30); S.hemi.intensity = 0.8; S.key.intensity = 0.5; S.darken(0.3, '#2a1a3a');
  for (const [p, o] of [[me3, 0], [you3, 1]]) { p.position.z = -t * 0.45; walk(p, t + o * 0.5, 1); }
  you3.userData.head.rotation.y = 0.35 + Math.sin(t * 1.3) * 0.1; me3.userData.head.rotation.y = t > 4.2 ? 0 : -0.3;
  tStation.position.z = -0.4 - t * 0.45; tKeep.position.z = -0.4 - t * 0.45;
  tStation.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tStation.visible = false;
  tKeep.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + 0.4, lerp(1.8, 1.9, u), 3.6 - t * 0.45, CX, 1.7, -8 - t * 0.45, 58);
  return qs;
}
function shotGate(t) { // 4段目 25〜33：告白する勇気は、最後まで出ない。さよならの時間が、近づいてくる
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 1.05;
  CLOCK4.userData.h.rotation.z = -t * 0.4;
  you4.userData.arms[1].rotation.x = t > 4.2 ? -2.6 : 0; you4.userData.arms[1].rotation.z = t > 4.2 ? Math.sin(t * 6) * 0.25 : 0;
  me4.userData.arms[0].rotation.x = t > 5.0 ? -1.6 : -0.2; me4.userData.head.rotation.x = t < 4 ? 0.2 : 0;
  if (t > 5.6) { you4.rotation.y = lerp(0, Math.PI, ease(clamp((t - 5.6) / 0.8))); you4.position.z = -2.0 - ease(clamp((t - 6.2) / 1.8)) * 1.0; }
  else { you4.rotation.y = 0; you4.position.z = -2.0; }
  tBrave.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tBrave.visible = false;
  tBye.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(2.4, 2.1, u), lerp(1.8, 1.7, u), lerp(2.2, 1.8, u), BX - 0.1, 1.4, -1.3, 56);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2019年に配信された、映画の主題歌。ストリーミングでも、5億回を超えた
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1;
  DISC.rotation.z = -t * 2.2; BARS.userData.update(t); FILM.rotation.y = Math.sin(t) * 0.2;
  tYear.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tYear.visible = false;
  tPlay.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(FX, 3.4, lerp(7.8, 7.2, u), FX, 3.5, -1.5, 56);
  return qs;
}
function shotMask(t, quiz = 0) { // 6段目 42〜49（決め手）：本音をかくして、平気なふりをする人。タイトルは、それを表す英語のひと言
  base(); S.aim(NX, -1); lift(-30); S.hemi.intensity = 0.95;
  const head = new THREE.Vector3(NX, 1.98, -1.35);
  const sw = (Math.sin(t * 1.3) + 1) / 2;
  HAPPY.visible = SAD.visible = true; HAPPY.position.set(head.x, head.y, head.z + 0.05); HAPPY.scale.setScalar(1.15);
  SAD.position.set(NX + 0.75, 2.5 + Math.sin(t * 1.6) * 0.05, -1.5); SAD.rotation.z = Math.sin(t) * 0.1; SAD.scale.setScalar(0.85 + sw * 0.1);
  me6.userData.arms[1].rotation.x = -2.0; me6.userData.arms[1].rotation.z = 0.25;
  if (!quiz) { tPretend.userData.pop((t - 0.4) / 0.35); tEng.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX, lerp(2.0, 1.9, u), lerp(3.6, 3.1, u), NX + 0.15, 1.8, -1.5, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？
  shotMask(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.95, 0.25, d);
  S.spot.color.set(0xe8e0ff); S.spot.position.set(NX, 6, 1); S.spot.target.position.set(NX, 1, -1.6); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.8, 0.5, k), lerp(1.9, 1.8, k), lerp(3.4, 2.9, k), NX + 0.1, 1.8, -1.5, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotPark },
  { a: 9, b: 17, f: shotCafe },
  { a: 17, b: 25, f: shotWalk },
  { a: 25, b: 33, f: shotGate },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: (t) => shotMask(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '片思いの相手と、<br>ふたりで出かけた日。'],
  [5.6, 9.0, '楽しいはずなのに、<br>ため息がこぼれる。'],
  [9.2, 13.2, 'ふたりがうまくいく姿は、<br>どうしても思い描けない。'],
  [13.2, 17.0, 'それでも、となりにいられる<br>時間がうれしい。'],
  [17.2, 21.0, '何気ない会話と、<br>駅までの静かな時間。'],
  [21.0, 25.0, '胸の内は、<br>今日もしまったまま。'],
  [25.2, 29.0, '告白する勇気は、<br>最後まで出ない。'],
  [29.0, 33.0, 'さよならの時間が、<br>近づいてくる。'],
  [33.2, 37.4, '2019年に配信された、<br>映画の主題歌。'],
  [37.4, 41.8, 'ストリーミングでも、<br>5億回を超えた。'],
  [42.2, 45.4, '本音をかくして、<br>平気なふりをする人。'],
  [45.4, 49.0, 'タイトルは、それを表す<br>英語のひと言。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、Official髭男dismの、Pretender。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q043', v2: true, answer: 'Pretender', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 4343,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'Official髭男dism': 'オフィシャルヒゲダンディズム', 'Pretender': 'プリテンダー', '片思い': 'かたおもい', '相手': 'あいて', '出かけた日': 'でかけたひ', '楽しい': 'たのしい', '姿': 'すがた', '思い描けない': 'おもいえがけない', '何気ない': 'なにげない', '会話': 'かいわ', '駅': 'えき', '胸の内': 'むねのうち', '今日も': 'きょうも', '告白': 'こくはく', '勇気': 'ゆうき', '最後': 'さいご', '2019年': 'にせんじゅうきゅうねん', '主題歌': 'しゅだいか', '5億回': 'ごおくかい', '本音': 'ほんね', '平気': 'へいき', '英語': 'えいご', '何秒': 'なんびょう' },
    caption: 'この曲のタイトル、わかる？\n片思いの相手と、ふたりで出かけた日。楽しいはずなのに、ため息がこぼれる。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '片思いソング'],
  },
});
applyQuizCards({ answer: 'Pretender', info: 'Official髭男dism｜2019年', answerSize: 130, kind: '曲' });
