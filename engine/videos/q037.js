import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #037 ラ・ラ・ランド（映画・アメリカ・日本公開2017年・126分・恋愛／ミュージカル。Hulu・Prime Video・U-NEXT・FOD・Netflixで見放題、
//   justwatch.com/jp/映画/la-la-land で2026/11/4確認。Filmarks 3.9・レビュー412,281件 filmarks.com/movies/62215）
// 確かめた事実（Filmarks の作品ページのあらすじ・受賞。2026/11/4）：
//   ・夢を叶えたい人々が集まる街、ロサンゼルス。映画スタジオのカフェで働くミアは女優を目指していたが、何度オーディションを受けても落ちてばかり。
//     ある日、場末の店で、あるピアニストの演奏に魅せられる。彼の名はセブ、いつか自分の店を持ち、大好きなジャズを思う存分演奏したいと願っていた。
//     やがて二人は恋におち、互いの夢を応援し合う
//   ・監督・脚本 デイミアン・チャゼル。第89回アカデミー賞（2017年）で監督賞・主演女優賞・美術賞・撮影賞・歌曲賞・作曲賞の6部門。日本公開2017年2月24日
// 構成（ヒント6段）：1 何度オーディションを受けても落ちてばかり → 2 昼は映画スタジオのカフェで働き、女優を目指す → 3 夢を叶えたい人たちが集まる街
//   → 4 場末の店でピアノの音に足を止める・彼の夢は自分の店でジャズを弾くこと → 5 恋とミュージカルのアメリカ映画・アカデミー賞6部門
//   → 6 決め手：舞台はロサンゼルス、女優志望の女性とジャズピアニストの恋、監督はデイミアン・チャゼル
// 地名・人物の名前・店の名前は6段目まで字幕にも札にも出さない。後半の展開・結末には触れない。作品の映像・俳優・ポスター・有名な場面の構図
//   （夜景の丘でのダンス・渋滞の高速道路で踊る場面・プラネタリウムなど）は使わない。人と街は汎用の3D

const S = quizStage({ bg: '#2a2448', floor: '#3a3448', fogNear: 24, fogFar: 90 });
const qs = S.scene;
const R = rng(3737);

const MIA = { skin: '#f2d4b8', hair: '#a8452a', shirt: '#f2c14e', pants: '#2a3a6a', long: true, skirt: true };
const SEB = { skin: '#efcfae', hair: '#8a6a3a', shirt: '#e8e2d8', pants: '#2a2a30', tie: true };

// ---------- 1段目. オーディションの部屋（x=0）。審査員の机と、不合格の印 ----------
{ const fl = box(10, 0.04, 8, mat('#5a5048')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(10, 6, 0.2, mat('#d8d0c0')); wl.position.set(0, 3, -4.6); qs.add(wl);
  const desk = box(3.6, 0.8, 0.9, mat('#3a3a40')); desk.position.set(0, 0.4, -3); qs.add(desk); }
const JURY = [-1.1, 0, 1.1].map((x, i) => { const p = makePerson({ skin: '#e8c4a0', hair: ['#1a1a1a', '#8a8a8a', '#3a2a20'][i], shirt: ['#22262f', '#5a4a6a', '#2a3044'][i], pants: '#1c1e24' }); p.position.set(x, -0.3, -3.7); p.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(p); return p; });
const mia1 = makePerson(MIA); mia1.position.set(0, 0, 0.4); mia1.rotation.y = Math.PI; qs.add(mia1);
const XS = []; for (let i = 0; i < 5; i++) { const g = new THREE.Group(); for (const s of [-1, 1]) { const b = box(0.12, 0.7, 0.04, new THREE.MeshBasicMaterial({ color: '#e2483c' })); b.rotation.z = s * 0.78; g.add(b); } g.position.set(-1.8 + i * 0.9, 3.4, -4.45); qs.add(g); XS.push(g); }
const tFail = tag('また不合格', { size: 84, w: 420, bg: '#e2483c', sx: 1.7 }); tFail.position.set(0, 2.4, -1.4); qs.add(tFail);
const tCount = tag('何度受けても', { size: 72, w: 460, bg: '#14161c', sx: 1.7 }); tCount.position.set(0, 2.4, -1.4); qs.add(tCount);

// ---------- 2段目. 撮影所のカフェ（x=40）。エプロン姿で働く ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#8a6a4e')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#e8dcc4')); wl.position.set(KX, 3, -4); qs.add(wl);
  const ct = box(4.2, 1.0, 0.8, mat('#5a3e2a')); ct.position.set(KX, 0.5, -1.6); qs.add(ct); const tp = box(4.4, 0.06, 1.0, mat('#e8e2d8')); tp.position.set(KX, 1.03, -1.6); qs.add(tp);
  for (let i = 0; i < 5; i++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.18, 14), mat('#ffffff')); cup.position.set(KX - 1.4 + i * 0.6, 1.15, -1.4); qs.add(cup); }
  const mach = box(0.8, 0.7, 0.5, mat('#a8acb4')); mach.position.set(KX + 1.5, 1.4, -1.8); qs.add(mach); }
const LIGHTS = []; for (let i = 0; i < 3; i++) { const g = new THREE.Group(); const st = box(0.06, 2.2, 0.06, mat('#2a2a2e')); st.position.y = 1.1; g.add(st); const hd = box(0.5, 0.4, 0.4, mat('#2a2a2e')); hd.position.y = 2.3; g.add(hd); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); lens.position.set(0, 2.3, 0.21); g.add(lens); g.position.set(KX + [-2.8, 2.6, 3.8][i], 0, -3.4); g.rotation.y = (i - 1) * -0.3; qs.add(g); LIGHTS.push(g); }
const mia2 = makePerson(MIA); mia2.position.set(KX, 0, -2.3); qs.add(mia2);
const APRON = box(0.46, 0.6, 0.02, mat('#2a2a2e')); APRON.position.set(KX, 1.05, -2.15); qs.add(APRON);
const tCafe = tag('映画スタジオのカフェ', { size: 60, w: 640, bg: '#14161c', sx: 1.9 }); tCafe.position.set(KX, 2.75, -2.0); qs.add(tCafe);
const tAct = tag('夢は女優', { size: 84, w: 380, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tAct.position.set(KX, 2.75, -2.0); qs.add(tAct);

// ---------- 3段目. 夕暮れの街（x=90）。ヤシの木と、夢を追う人たち ----------
const CX = 90;
const SKY = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2a6a'); gr.addColorStop(0.5, '#c86a8a'); gr.addColorStop(1, '#f2a860'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), fog: false })); SKY.position.set(CX, 14, -40); qs.add(SKY);
const BLDG = []; for (let i = 0; i < 10; i++) { const w = 2 + R() * 1.6, h = 3 + R() * 7; const wt = windowTextures(3700 + i, ['#4a3a5a', '#5a4a6a', '#3a3450'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0.6 })); b.position.set(CX - 14 + i * 3.1, h / 2, -14 - (i % 3) * 2); qs.add(b); BLDG.push(b); }
const PALMS = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 5.5, 8), mat('#5a4030')); tr.position.y = 2.75; g.add(tr); for (let k = 0; k < 7; k++) { const lf = box(0.2, 0.04, 1.6, mat('#2a5a3a')); lf.position.set(Math.sin(k / 7 * Math.PI * 2) * 0.7, 5.4, Math.cos(k / 7 * Math.PI * 2) * 0.7); lf.rotation.y = k / 7 * Math.PI * 2; lf.rotation.x = 0.4; g.add(lf); } g.position.set(CX + (i % 2 ? 3.2 : -3.2), 0, 2 - Math.floor(i / 2) * 5); qs.add(g); PALMS.push(g); }
{ const rd = box(5, 0.04, 30, mat('#4a4658')); rd.position.set(CX, 0.03, -6); qs.add(rd); }
const WALKERS = []; for (let i = 0; i < 8; i++) { const p = makePerson({ skin: ['#ecc9a6', '#c8946a', '#e8c4a0', '#8a5a3a'][i % 4], hair: ['#2a2420', '#4a3a2a', '#1a1a1a', '#a8452a'][i % 4], shirt: ['#e05a4f', '#3f8f6b', '#f2c14e', '#4fa3d1', '#8e6bbf'][i % 5], pants: '#2b3346', long: i % 3 === 0 }); p.userData.x = CX - 1.8 + (i % 4) * 1.2; p.userData.z0 = -i * 1.5; p.userData.dir = i % 2 ? 1 : -1; qs.add(p); WALKERS.push(p); }
const STARS = []; for (let i = 0; i < 14; i++) { const st = new THREE.Mesh(new THREE.CircleGeometry(0.08, 6), new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, fog: false })); st.position.set(CX - 12 + R() * 24, 12 + R() * 8, -39); qs.add(st); STARS.push(st); }
const tDream = tag('夢を叶えたい人たちの街', { size: 58, w: 700, bg: '#14161c', sx: 2.6 }); tDream.position.set(CX, 3.4, 0); qs.add(tDream);
const tGather = tag('夢を追う人たち', { size: 64, w: 520, bg: '#8e6bbf', sx: 2.4 }); tGather.position.set(CX, 3.4, 0); qs.add(tGather);

// ---------- 4段目. 場末の店（x=130）。ピアノを弾く男と、足を止める女性 ----------
const BX = 130;
{ const fl = box(10, 0.04, 8, mat('#2a1e1e')); fl.position.set(BX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#3a2a30')); wl.position.set(BX, 3, -4); qs.add(wl);
  for (let i = 0; i < 3; i++) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 16), mat('#4a3a2e')); tb.position.set(BX - 2.6 + i * 1.2, 0.8, 0.8); qs.add(tb); const lg = box(0.06, 0.8, 0.06, mat('#2a2a2e')); lg.position.set(BX - 2.6 + i * 1.2, 0.4, 0.8); qs.add(lg); } }
const PIANO = new THREE.Group(); PIANO.position.set(BX + 0.8, 0, -2.0); qs.add(PIANO);
{ const body = box(1.6, 1.3, 0.6, mat('#141416')); body.position.y = 0.95; PIANO.add(body); const keys = box(1.5, 0.05, 0.3, mat('#f4f0e6')); keys.position.set(0, 0.95, 0.42); PIANO.add(keys); for (let i = 0; i < 9; i++) { const bk = box(0.06, 0.04, 0.16, mat('#141416')); bk.position.set(-0.64 + i * 0.16, 0.99, 0.36); PIANO.add(bk); } const bench = box(0.8, 0.08, 0.36, mat('#3a2a20')); bench.position.set(0, 0.5, 0.95); PIANO.add(bench); }
const seb4 = makePerson(SEB); seb4.position.set(BX + 0.8, -0.32, -0.95); seb4.rotation.y = Math.PI; seb4.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(seb4);
const SPOT4 = new THREE.SpotLight(0xfff0c8, 0, 12, 0.5, 0.5, 1.2); SPOT4.position.set(BX + 0.8, 6, 1); SPOT4.target.position.set(BX + 0.8, 0.8, -1.4); qs.add(SPOT4); qs.add(SPOT4.target);
const NOTES = []; for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: '#e6b450' })); h.scale.set(1.3, 1, 1); g.add(h); const st = box(0.02, 0.28, 0.02, new THREE.MeshBasicMaterial({ color: '#e6b450' })); st.position.set(0.09, 0.14, 0); g.add(st); g.userData.o = i / 8; qs.add(g); NOTES.push(g); }
const mia4 = makePerson(MIA); mia4.position.set(BX - 3.4, 0, 0.4); qs.add(mia4);
const tStop = tag('ピアノの音に足を止める', { size: 58, w: 680, bg: '#14161c', sx: 2.0 }); tStop.position.set(BX, 2.75, -0.4); qs.add(tStop);
const tJazz = tag('夢は自分の店でジャズ', { size: 58, w: 660, bg: '#e6b450', color: '#14161c', sx: 2.0 }); tJazz.position.set(BX, 2.75, -0.4); qs.add(tJazz);

// ---------- 5段目. 楽譜とフィルム（x=170）。恋とミュージカルのアメリカ映画・アカデミー賞6部門 ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1a30' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const STAFF = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 136, (g, w, h) => { g.fillStyle = '#1e1a30'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e8e2d8'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, 28 + i * 20); g.lineTo(w, 28 + i * 20); g.stroke(); } g.fillStyle = '#e6b450'; for (let i = 0; i < 10; i++) { const x = 30 + i * 48, y = 38 + ((i * 37) % 70); g.beginPath(); g.ellipse(x, y, 9, 7, -0.3, 0, Math.PI * 2); g.fill(); g.fillRect(x + 7, y - 40, 3, 40); } }), transparent: true })); STAFF.position.set(FX, 2.2, -1.5); qs.add(STAFF);
const AWARD = []; for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.14 : 0.34, a = k / 10 * Math.PI * 2 + Math.PI / 2; if (k) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath(); return sh; })(), { depth: 0.08, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.25, emissive: '#5a4010' })); st.position.set(FX - 2.0 + i * 0.8, 3.6, -1.2); qs.add(st); AWARD.push(st); }
const tUS = tag('恋とミュージカル アメリカ映画', { size: 52, w: 780, bg: '#e6b450', color: '#14161c', sx: 3.4 }); tUS.position.set(FX, 4.8, -1.2); qs.add(tUS);
const tAca = tag('アカデミー賞 6部門', { size: 66, w: 600, bg: '#e2483c', sx: 3.0 }); tAca.position.set(FX, 4.8, -1.2); qs.add(tAca);

// ---------- 6段目. 夜の大通り（x=210）。ふたり並んで歩く ----------
const NX = 210;
{ const rd = box(14, 0.04, 30, mat('#2a2838')); rd.position.set(NX, 0.02, -8); qs.add(rd); }
const NB = []; for (let i = 0; i < 10; i++) { const w = 2.4 + R() * 1.4, h = 6 + R() * 12; const wt = windowTextures(3750 + i, '#3a3458'); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.6), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0.75 })); const side = i % 2 ? 1 : -1; b.position.set(NX + side * (4.4 + (i >> 1) * 0.5), h / 2, -3 - (i >> 1) * 4.5); qs.add(b); NB.push(b); }
const LAMPS = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const g = new THREE.Group(); const p = box(0.08, 3.4, 0.08, mat('#2a2a2e')); p.position.y = 1.7; g.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); l.position.y = 3.5; g.add(l); g.position.set(NX + s * 2.8, 0, 1 - i * 4); qs.add(g); LAMPS.push(g); }
const mia6 = makePerson(MIA); mia6.position.set(NX - 0.35, 0, 0); mia6.rotation.y = Math.PI; qs.add(mia6);
const seb6 = makePerson(SEB); seb6.position.set(NX + 0.35, 0, 0); seb6.rotation.y = Math.PI; qs.add(seb6);
const tLA = tag('舞台はロサンゼルス', { size: 64, w: 600, bg: '#e6b450', color: '#14161c', sx: 1.4 }); tLA.position.set(NX, 2.95, 0.4); qs.add(tLA);
const tPair = tag('女優志望 × ジャズピアニスト', { size: 54, w: 760, bg: '#8e6bbf', sx: 1.5 }); tPair.position.set(NX, 2.5, 0.4); qs.add(tPair);

// ---------- shots ----------
const ALL = [tFail, tCount, tCafe, tAct, tDream, tGather, tStop, tJazz, tUS, tAca, tLA, tPair];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPOT4.intensity = 0; NOTES.forEach(n => n.visible = false); XS.forEach(x => x.visible = false); AWARD.forEach(a => a.visible = false); }

function shotAudition(t) { // 1段目 0〜9：また、オーディションに落ちた。何度受けても、落ちてばかり（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.1; S.darken(0.1, '#3a2a40');
  const n = t < 4.6 ? 1 : 1 + Math.min(4, Math.floor((t - 4.6) / 0.6) + 1);
  XS.forEach((x, i) => { x.visible = i < n; x.scale.setScalar(i === 0 ? 1 : Math.max(0.01, ease(clamp((t - 4.6 - (i - 1) * 0.6) / 0.3)))); });
  JURY.forEach((p, i) => { p.userData.head.rotation.x = 0.4; p.userData.head.rotation.y = Math.sin(t + i) * 0.1; });
  mia1.userData.head.rotation.x = 0.25 + (t > 1 ? 0.1 : 0); mia1.userData.arms.forEach(a => a.rotation.x = 0);
  tFail.userData.pop(1); if (t > 4.6) tFail.visible = false;
  tCount.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(2.2, 2.0, u), lerp(3.4, 2.8, u), 0, 1.6, -3, 56);
  return qs;
}
function shotCafe(t) { // 2段目 9〜17：昼は、映画スタジオのカフェで働いている。目指しているのは、女優
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.3;
  mia2.userData.arms[1].rotation.x = -0.8 - 0.3 * Math.sin(t * 3); mia2.userData.head.rotation.y = t > 4.2 ? -0.7 * ease((t - 4.2) / 0.6) : 0;
  LIGHTS.forEach((g, i) => g.rotation.y = (i - 1) * -0.3 + Math.sin(t * 0.5 + i) * 0.1);
  tCafe.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tCafe.visible = false;
  tAct.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.6, -0.2, u), lerp(2.0, 1.9, u), lerp(2.8, 2.0, u), KX, 1.6, -2.3, 56);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：夢を叶えたい人たちが、集まる街。今日も誰かが、ここで夢を追いかけている
  base(); S.aim(CX, -4); lift(-20); S.hemi.intensity = 1.2; S.darken(0.15, '#c86a8a');
  WALKERS.forEach((p, i) => { const z = p.userData.z0 + p.userData.dir * t * 1.1; p.position.set(p.userData.x, 0, ((z + 12) % 14 + 14) % 14 - 12); p.rotation.y = p.userData.dir > 0 ? 0 : Math.PI; const ph = t * 8 + i; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.5; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.4; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.4; });
  STARS.forEach((s, i) => s.material.opacity = 0.4 + 0.4 * Math.sin(t * 2 + i));
  tDream.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tDream.visible = false;
  tGather.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX, lerp(2.4, 3.0, u), lerp(8.4, 7.2, u), CX, lerp(2.8, 3.6, u), -10, 58);
  return qs;
}
function shotBar(t) { // 4段目 25〜33：ある夜、場末の店で、ピアノの音に足を止める。彼の夢は、自分の店でジャズを弾くこと
  base(); S.aim(BX, -1); lift(-40); S.hemi.intensity = 0.55; S.key.intensity = 0.3; S.darken(0.5, '#0a0610');
  SPOT4.intensity = 60;
  seb4.userData.arms.forEach((a, i) => { a.rotation.x = -1.1 + 0.12 * Math.sin(t * 9 + i * 1.7); });
  NOTES.forEach(n => { n.visible = true; const k = (t * 0.35 + n.userData.o) % 1; n.position.set(BX + 0.8 + Math.sin(k * 6 + n.userData.o * 9) * 0.6 - k * 1.2, 1.8 + k * 1.6, -1.6 + k * 1.2); n.scale.setScalar(1 - k * 0.4); });
  const w = ease(t / 2.4); mia4.position.set(BX + lerp(-3.4, -1.0, w), 0, 0.4); mia4.rotation.y = lerp(Math.PI / 2, Math.PI * 0.85, ease((t - 2.0) / 0.8)); const ph = t * 8 * (1 - w); mia4.userData.legs[0].rotation.x = Math.sin(ph) * 0.5 * (1 - w); mia4.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5 * (1 - w);
  tStop.userData.pop((t - 0.8) / 0.35); if (t > 4.0) tStop.visible = false;
  tJazz.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0, u), lerp(2.0, 1.8, u), lerp(4.8, 4.0, u), BX, 1.3, -1.0, 56);
  return qs;
}
function shotMusic(t) { // 5段目 33〜42：恋とミュージカルの、アメリカ映画。アカデミー賞で、監督賞など6部門
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.2;
  STAFF.material.map.offset.x = t * 0.08; STAFF.material.map.wrapS = THREE.RepeatWrapping;
  AWARD.forEach((a, i) => { a.visible = t > 4.2 + i * 0.25; a.scale.setScalar(Math.max(0.01, ease(clamp((t - 4.2 - i * 0.25) / 0.3)))); a.rotation.y = t * 0.8 + i; });
  tUS.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUS.visible = false;
  tAca.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.8, lerp(7.4, 6.8, u), FX, 2.9, -1.5, 56);
  return qs;
}
function shotNight(t, quiz = 0) { // 6段目 42〜49（決め手）：舞台はロサンゼルス。女優志望の女性と、ジャズピアニストの恋。監督は、デイミアン・チャゼル
  base(); S.aim(NX, -4); lift(-30); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.55, '#0a0820');
  const ph = (t + 3) * 4;
  for (const [p, o] of [[mia6, 0], [seb6, Math.PI]]) { p.position.z = -t * 0.5; p.userData.legs[0].rotation.x = Math.sin(ph + o) * 0.4; p.userData.legs[1].rotation.x = -Math.sin(ph + o) * 0.4; }
  mia6.userData.arms[1].rotation.x = -0.3; seb6.userData.arms[0].rotation.x = -0.3; mia6.userData.head.rotation.y = 0.3; seb6.userData.head.rotation.y = -0.3;
  if (!quiz) { tLA.position.z = 0.4 - t * 0.5; tPair.position.z = 0.4 - t * 0.5; tLA.userData.pop((t - 0.4) / 0.35); tPair.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + 0.3, lerp(1.9, 2.1, u), 3.6 - t * 0.5, NX, 1.8, -6, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の大通りを歩くふたり）
  shotNight(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.7, 0.2, d);
  const z = mia6.position.z;
  S.spot.color.set(0xffe8c8); S.spot.position.set(NX, 6, z + 3); S.spot.target.position.set(NX, 1, z); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.6, 0.3, k), lerp(1.8, 1.7, k), z + lerp(-3.4, -2.8, k), NX, 1.5, z, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotAudition },
  { a: 9, b: 17, f: shotCafe },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotBar },
  { a: 33, b: 42, f: shotMusic },
  { a: 42, b: 49, f: (t) => shotNight(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'また、オーディションに<br>落ちた。'],
  [5.6, 9.0, '何度受けても、<br>落ちてばかり。'],
  [9.2, 13.2, '昼は、映画スタジオの<br>カフェで働いている。'],
  [13.2, 17.0, '目指しているのは、<br>女優。'],
  [17.2, 21.0, '夢を叶えたい人たちが、<br>集まる街。'],
  [21.0, 25.0, '今日も誰かが、<br>ここで夢を追いかけている。'],
  [25.2, 29.0, 'ある夜、場末の店で、<br>ピアノの音に足を止める。'],
  [29.0, 33.0, '彼の夢は、自分の店で<br>ジャズを弾くこと。'],
  [33.2, 37.4, '恋とミュージカルの、<br>アメリカ映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>監督賞など6部門。'],
  [42.2, 45.4, '舞台はロサンゼルス。<br>女優志望とジャズピアニスト。'],
  [45.4, 49.0, '監督は、<br>デイミアン・チャゼル。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ラ・ラ・ランド。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q037', v2: true, answer: 'ラ・ラ・ランド',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 3737,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'buzz'], [4.8, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ラ・ラ・ランド': 'ララランド', 'デイミアン・チャゼル': 'デイミアンチャゼル', 'ロサンゼルス': 'ロサンゼルス', 'ジャズピアニスト': 'ジャズピアニスト', '女優志望': 'じょゆうしぼう', 'オーディション': 'オーディション', '6部門': 'ろくぶもん', '映画スタジオ': 'えいがスタジオ', '監督賞': 'かんとくしょう', '監督': 'かんとく', '場末': 'ばすえ', '足を止める': 'あしをとめる', '叶えたい': 'かなえたい', '集まる': 'あつまる', '目指して': 'めざして', '女優': 'じょゆう', '何度': 'なんど', '受けても': 'うけても', '落ちた': 'おちた', '落ちて': 'おちて', '昼は': 'ひるは', '働いて': 'はたらいて', '今日も誰か': 'きょうもだれか', '追いかけて': 'おいかけて', 'ある夜': 'あるよる', '自分の店': 'じぶんのみせ', '弾く': 'ひく', '彼の夢': 'かれのゆめ', '夢を': 'ゆめを', '恋と': 'こいと', '舞台': 'ぶたい', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nまた、オーディションに落ちた。何度受けても、落ちてばかり。昼は、映画スタジオのカフェで働いている。目指しているのは、女優。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'Hulu', 'PrimeVideo', '映画好き', 'ミュージカル映画'],
  },
});
applyQuizCards({ answer: 'ラ・ラ・ランド', info: 'Hulu・Prime Video｜映画・126分', answerSize: 124 });
