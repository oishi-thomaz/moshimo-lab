import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #050 余命10年（映画・日本・2022年・125分・恋愛。Netflix・Prime Video・U-NEXT で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/the-last-10-years）と Filmarks の配信欄で2026/11/4確認。Filmarks 3.9・レビュー97,664件 filmarks.com/movies/98638）
// 確かめた事実（Filmarks の作品ページのあらすじ・ja.wikipedia「余命10年」。2026/11/4）：
//   ・20歳で不治の病にかかり、もう恋はしないと心に決めた余命10年の茉莉。生きることに迷い、自分の居場所を見失った和人。同窓会で再会した2人は惹かれあい、
//     ありふれた毎日が嘘みたいに輝き出す（Filmarks）
//   ・2022年3月4日公開。監督 藤井道人、音楽・主題歌 RADWIMPS。約1年かけて四季を撮影し、桜・雪・夏の海はVFXでなく本物を撮った（wikipedia）
// 構成（ヒント6段）：1 久しぶりの同窓会・誰にも言えない秘密 → 2 20歳で治らない病気・もう恋はしないと決めた → 3 桜が咲いて雪が降る・めぐる季節
//   → 4 生きる意味を見失った彼・ふたりの毎日が輝き出す → 5 2022年の日本映画・1年かけて四季を撮影 → 6 決め手：残された時間は10年、音楽はRADWIMPS
// 病名・人物名・地名は出さない。後半の展開・結末（ふたりが選んだ道）には絶対に触れない。作品の映像・俳優・ポスター・有名な場面の構図は使わない。
//   曲名・歌詞は使わない。人と街と季節は汎用の3D

const S = quizStage({ bg: '#e8d8d0', floor: '#b8aca0', fogNear: 22, fogFar: 80 });
const qs = S.scene;
const R = rng(5050);

const HER = { skin: '#f4dcc4', hair: '#2a1a14', shirt: '#f4ece0', pants: '#8a9ab8', long: true, skirt: true };
const HIM = { skin: '#efcfae', hair: '#1a1a1a', shirt: '#4a5a6a', pants: '#2a2a30' };
const PINK = ['#f8c8d4', '#f4b0c0', '#fcdce4'];

function sakura(x, z, s = 1) { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 2.6 * s, 8), mat('#5a3a2a')); tr.position.y = 1.3 * s; g.add(tr); for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry((0.9 + R() * 0.5) * s, 12, 10), mat(PINK[i % 3])); b.position.set((R() - 0.5) * 2.2 * s, (2.6 + R() * 1.2) * s, (R() - 0.5) * 1.6 * s); g.add(b); } g.position.set(x, 0, z); qs.add(g); return g; }

// ---------- 1段目. 同窓会の居酒屋（x=0）。笑い声の中で、ひとり静かに ----------
{ const fl = box(10, 0.04, 8, mat('#8a6a4a')); fl.position.set(0, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#c8a880')); wl.position.set(0, 3, -4); qs.add(wl);
  const tb = box(3.6, 0.08, 1.2, mat('#6a4a2a')); tb.position.set(0, 0.75, -1.6); qs.add(tb); const tl = box(3.4, 0.7, 1.0, mat('#4a3420')); tl.position.set(0, 0.36, -1.6); qs.add(tl);
  for (let i = 0; i < 6; i++) { const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.22, 12), new THREE.MeshLambertMaterial({ color: '#f2c14e', transparent: true, opacity: 0.85 })); gl.position.set(-1.4 + i * 0.56, 0.9, -1.6 + (i % 2) * 0.3); qs.add(gl); }
  for (let i = 0; i < 4; i++) { const lp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); lp.position.set(-2.4 + i * 1.6, 3.4, -2.6); qs.add(lp); } }
const MATES = []; for (let i = 0; i < 5; i++) { const p = makePerson({ skin: '#efcfae', hair: ['#1a1a1a', '#5a3a2a', '#2a2018', '#3a2a20', '#1a1a1a'][i], shirt: ['#e05a4f', '#3f8f6b', '#4fa3d1', '#f2c14e', '#8e6bbf'][i], pants: '#2b3346', long: i % 2 === 1, skirt: i === 3 }); const side = i < 3 ? -1 : 1; p.position.set(-1.2 + (i % 3) * 1.2 + (i >= 3 ? 0.6 : 0), -0.4, -1.6 + side * 0.95); p.rotation.y = side < 0 ? 0 : Math.PI; p.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(p); MATES.push(p); }
const her1 = makePerson(HER); her1.position.set(1.75, -0.4, -2.55); her1.rotation.y = -0.15; her1.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(her1);
const SECRET = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#6a5a8a'; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 32, 35); }), transparent: true })); qs.add(SECRET);
const tReunion = tag('久しぶりの同窓会', { size: 66, w: 560, bg: '#14161c', sx: 1.9 }); tReunion.position.set(0.7, 2.25, -1.6); qs.add(tReunion);
const tSecret = tag('誰にも言えない秘密', { size: 62, w: 600, bg: '#6a5a8a', sx: 1.7 }); tSecret.position.set(1.3, 2.4, -1.2); qs.add(tSecret);

// ---------- 2段目. 病院の窓辺（x=40）。点滴と、窓の外の空 ----------
const KX = 40;
{ const fl = box(8, 0.04, 7, mat('#d8d4cc')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(9, 6, 0.2, mat('#eef0ee')); wl.position.set(KX, 3, -3.6); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({ color: '#a8c8e8' })); win.position.set(KX + 0.6, 2.2, -3.48); qs.add(win); const wf = box(2.6, 0.1, 0.1, mat('#c8c8c8')); wf.position.set(KX + 0.6, 2.2, -3.44); qs.add(wf);
  const bed = box(1.2, 0.5, 2.2, mat('#f4f4f0')); bed.position.set(KX - 1.2, 0.5, -2.0); qs.add(bed); const fr = box(1.3, 0.3, 2.3, mat('#a8acb4')); fr.position.set(KX - 1.2, 0.15, -2.0); qs.add(fr);
  const st = box(0.04, 2.2, 0.04, mat('#a8acb4')); st.position.set(KX - 2.0, 1.1, -2.6); qs.add(st); const bag = box(0.22, 0.32, 0.06, new THREE.MeshLambertMaterial({ color: '#e8f0f8', transparent: true, opacity: 0.8 })); bag.position.set(KX - 2.0, 2.1, -2.6); qs.add(bag); }
const her2 = makePerson(HER); her2.position.set(KX + 0.5, 0, -2.2); qs.add(her2);
const NOTE2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ color: '#f4ecd8' })); NOTE2.position.set(KX + 0.82, 1.0, -1.85); qs.add(NOTE2);
const tSick = tag('20歳で 治らない病気', { size: 62, w: 620, bg: '#14161c', sx: 1.9 }); tSick.position.set(KX, 2.85, -1.6); qs.add(tSick);
const tNoLove = tag('もう恋はしない', { size: 74, w: 520, bg: '#e86a8a', sx: 1.8 }); tNoLove.position.set(KX, 2.85, -1.6); qs.add(tNoLove);

// ---------- 3段目. 桜並木（x=90）。花びらが、やがて雪に ----------
const CX = 90;
const TREES3 = []; for (let i = 0; i < 8; i++) TREES3.push(sakura(CX + (i % 2 ? 3.2 : -3.2), 2 - (i >> 1) * 4, 1.1));
{ const rd = box(4, 0.04, 20, mat('#c8bca8')); rd.position.set(CX, 0.03, -4); qs.add(rd); }
const FLAKES = []; for (let i = 0; i < 160; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.05 + R() * 0.03, 6), new THREE.MeshBasicMaterial({ color: PINK[i % 3], side: THREE.DoubleSide })); f.userData = { x: R() * 10 - 5, z: R() * 14 - 12, o: R(), s: 0.4 + R() * 0.5 }; qs.add(f); FLAKES.push(f); }
function flakes(cx, cz, t, snow, on = true) { FLAKES.forEach(f => { f.visible = on; if (!on) return; const u = f.userData; const y = 6 - ((t * u.s + u.o * 6) % 6); f.position.set(cx + u.x + Math.sin(t + u.o * 9) * 0.3, y, cz + u.z); f.rotation.set(t * u.s * 2, t * u.s, 0); f.material.color.set(snow ? '#ffffff' : PINK[0]); }); }
const her3 = makePerson({ ...HER, shirt: '#f2c14e' }); her3.position.set(CX, 0, -1.0); her3.rotation.y = Math.PI; qs.add(her3);
const tSakura = tag('桜が咲いて', { size: 80, w: 440, bg: '#e86a8a', sx: 2.0 }); tSakura.position.set(CX, 3.1, -0.4); qs.add(tSakura);
const tSnow = tag('雪が降って めぐる季節', { size: 60, w: 640, bg: '#4fa3d1', sx: 1.95 }); tSnow.position.set(CX, 3.1, -0.4); qs.add(tSnow);

// ---------- 4段目. 夕暮れの街の歩道橋（x=130）。ならんで歩くふたり ----------
const BX = 130;
const BLD4 = []; for (let i = 0; i < 10; i++) { const w = 2 + R() * 1.5, h = 3 + R() * 6; const wt = windowTextures(5000 + i, ['#8a7a8a', '#7a7a8a', '#9a8a8a'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0.5 })); b.position.set(BX - 14 + i * 3.1, h / 2, -12 - (i % 3) * 2); qs.add(b); BLD4.push(b); }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(32, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a7ab8'); gr.addColorStop(0.55, '#f0a8a0'); gr.addColorStop(1, '#f8d8a0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); SKY4.position.set(BX, 10, -36); qs.add(SKY4);
{ const br = box(8, 0.2, 2, mat('#d8d0c8')); br.position.set(BX, 1.6, -1); qs.add(br); for (const z of [-1.9, -0.1]) { const rl = box(8, 0.06, 0.06, mat('#8a8a90')); rl.position.set(BX, 2.6, z); qs.add(rl); for (let i = 0; i < 9; i++) { const pp = box(0.05, 1.0, 0.05, mat('#8a8a90')); pp.position.set(BX - 4 + i, 2.1, z); qs.add(pp); } } }
const her4 = makePerson(HER); her4.position.set(BX - 0.35, 1.7, -1); qs.add(her4);
const him4 = makePerson(HIM); him4.position.set(BX + 0.35, 1.7, -1); qs.add(him4);
const SPARK = []; for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.05, 6), new THREE.MeshBasicMaterial({ color: '#fff2c0', transparent: true })); s.userData.o = i / 16; qs.add(s); SPARK.push(s); }
const tLost = tag('居場所をなくした彼', { size: 64, w: 600, bg: '#14161c', sx: 2.1 }); tLost.position.set(BX, 4.5, -1.2); qs.add(tLost);
const tShine = tag('毎日が 輝き出す', { size: 72, w: 520, bg: '#f2c14e', color: '#14161c', sx: 2.0 }); tShine.position.set(BX, 4.5, -1.2); qs.add(tShine);

// ---------- 5段目. 四季の窓（x=170）。2022年の日本映画・1年かけて四季を撮影 ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#2a2430' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const SEASONS = [['#f8c8d4', '#a8d8f0'], ['#3a8ad8', '#f8e8a0'], ['#e8803a', '#f8d8a0'], ['#ffffff', '#a8b8d0']].map(([a, b], i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshBasicMaterial({ map: canvasTex(90, 120, (g, w, h) => { g.fillStyle = b; g.fillRect(0, 0, w, h); g.fillStyle = a; if (i === 1) { g.fillRect(0, 70, w, 50); } else { for (let k = 0; k < 30; k++) { g.beginPath(); g.arc((k * 37) % w, (k * 53) % h, 4 + (k % 3) * 2, 0, Math.PI * 2); g.fill(); } } g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); }) })); p.position.set(FX + (i - 1.5) * 0.95, 3.3, -1.5); p.userData.y = p.position.y; qs.add(p); return p; });
const tJP = tag('2022年 日本映画', { size: 70, w: 560, bg: '#e86a8a', sx: 3.0 }); tJP.position.set(FX, 4.7, -1.2); qs.add(tJP);
const tYear = tag('1年かけて 四季を撮影', { size: 60, w: 640, bg: '#14161c', sx: 3.2 }); tYear.position.set(FX, 4.7, -1.2); qs.add(tYear);

// ---------- 6段目. 夜の桜の下のベンチ（x=210）。砂時計と、ならんで座るふたり ----------
const NX = 210;
const TREE6 = sakura(NX, -2.4, 1.3);
{ const bn = box(2.0, 0.08, 0.5, mat('#8a6a4a')); bn.position.set(NX, 0.5, -0.6); qs.add(bn); for (const x of [-0.8, 0.8]) { const l = box(0.08, 0.5, 0.4, mat('#4a4a4a')); l.position.set(NX + x, 0.25, -0.6); qs.add(l); } const bk = box(2.0, 0.5, 0.06, mat('#8a6a4a')); bk.position.set(NX, 0.85, -0.85); qs.add(bk);
  const lp = box(0.1, 3.4, 0.1, mat('#3a3a40')); lp.position.set(NX + 2.0, 1.7, -1.2); qs.add(lp); const lb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff0c8' })); lb.position.set(NX + 2.0, 3.5, -1.2); qs.add(lb); }
const LAMP6 = new THREE.PointLight(0xfff0c8, 0, 8, 1.3); LAMP6.position.set(NX + 1.6, 3.2, -0.8); qs.add(LAMP6);
const her6 = makePerson(HER); her6.position.set(NX - 0.4, 0.1, -0.6); her6.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(her6);
const him6 = makePerson(HIM); him6.position.set(NX + 0.4, 0.1, -0.6); him6.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(him6);
const HOUR = new THREE.Group(); { const gm = new THREE.MeshLambertMaterial({ color: '#e8f0f8', transparent: true, opacity: 0.55 }); const t1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.55, 20), gm); t1.position.y = 0.3; t1.rotation.x = Math.PI; HOUR.add(t1); const t2 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.55, 20), gm); t2.position.y = -0.3; HOUR.add(t2); const sand = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 16), mat('#e6b450')); sand.position.y = -0.42; HOUR.add(sand); HOUR.userData.sand = sand; const sandT = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 16), mat('#e6b450')); sandT.rotation.x = Math.PI; sandT.position.y = 0.2; HOUR.add(sandT); HOUR.userData.sandT = sandT; for (const y of [-0.62, 0.62]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), mat('#6a4a2a')); c.position.y = y; HOUR.add(c); } } HOUR.position.set(NX - 1.05, 1.15, 0.1); qs.add(HOUR);
const tTen = tag('残された時間は 10年', { size: 64, w: 620, bg: '#e86a8a', sx: 2.1 }); tTen.position.set(NX, 2.85, -0.4); qs.add(tTen);
const tRad = tag('音楽 RADWIMPS', { size: 72, w: 540, bg: '#14161c', sx: 1.6 }); tRad.position.set(NX, 2.85, -0.4); qs.add(tRad);

// ---------- shots ----------
const ALL = [tReunion, tSecret, tSick, tNoLove, tSakura, tSnow, tLost, tShine, tJP, tYear, tTen, tRad];
function base() { S.reset(); ALL.forEach(x => x.visible = false); flakes(0, 0, 0, false, false); LAMP6.intensity = 0; SPARK.forEach(s => s.visible = false); SECRET.visible = false; S.floor.visible = true; }

function shotParty(t) { // 1段目 0〜9：久しぶりの同窓会。彼女には、誰にも言えない秘密があった（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.1; S.darken(0.1, '#a87850');
  MATES.forEach((p, i) => { p.userData.arms[i % 2].rotation.x = -1.2 - 0.4 * Math.max(0, Math.sin(t * 3 + i)); p.userData.head.rotation.x = -0.15 * Math.max(0, Math.sin(t * 5 + i)); p.position.y = -0.4 + Math.max(0, Math.sin(t * 6 + i)) * 0.03; });
  her1.userData.head.rotation.x = 0.35; her1.userData.arms.forEach(a => a.rotation.x = -0.4);
  SECRET.visible = t > 4.8; SECRET.position.set(1.75, 2.05, -2.5); SECRET.scale.setScalar(t > 4.8 ? ease(clamp((t - 4.8) / 0.3)) : 0.01);
  tReunion.userData.pop(1); if (t > 4.6) tReunion.visible = false;
  tSecret.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9); const k = ease(clamp((t - 4.4) / 1.6));
  look(lerp(0.7, 1.2, k), lerp(2.1, 1.9, u), lerp(4.4, 3.2, u), lerp(0.7, 1.4, k), lerp(1.2, 1.4, k), -1.2, 58);
  return qs;
}
function shotHospital(t) { // 2段目 9〜17：20歳で、治らない病気がわかった。もう恋はしないと、心に決めた
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.2; S.darken(0.05, '#e8e8f0');
  her2.userData.head.rotation.x = -0.1 + (t > 4.2 ? 0.3 : 0); her2.userData.arms[1].rotation.x = t > 4.2 ? -0.9 : -0.2;
  NOTE2.visible = t > 4.2; NOTE2.position.set(KX + 0.5 + 0.32, 1.0, -1.85); NOTE2.rotation.x = -0.4;
  tSick.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSick.visible = false;
  tNoLove.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.4, 0.0, u), lerp(1.9, 1.8, u), lerp(3.4, 2.6, u), KX + 0.4, 1.7, -2.4, 58);
  return qs;
}
function shotSeasons(t) { // 3段目 17〜25：桜が咲いて、雪が降る。季節は、めぐっていく
  base(); S.aim(CX, -4); lift(-20); const snow = t > 4.2; S.hemi.intensity = 1.25; S.darken(snow ? 0.35 : 0.0, '#a8b8d0');
  flakes(CX, 0, t, snow);
  TREES3.forEach(g => g.children.forEach((c, i) => { if (i) c.material.color.set(snow ? '#f4f6f8' : PINK[i % 3]); }));
  her3.userData.head.rotation.x = -0.4;
  tSakura.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSakura.visible = false;
  tSnow.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.4, 0.4, u), lerp(1.8, 2.2, u), lerp(4.0, 3.4, u), CX, 2.4, -6, 58);
  return qs;
}
function shotBridge(t) { // 4段目 25〜33：出会ったのは、生きる意味を見失った彼。ふたりの毎日が、輝き出す
  base(); S.aim(BX, -4); lift(-20); S.hemi.intensity = 1.0; S.darken(0.2, '#f0a8a0');
  const w = t < 4.2 ? 0 : 1; const ph = t * 6;
  for (const [p, o] of [[her4, 0], [him4, Math.PI]]) { p.userData.legs[0].rotation.x = Math.sin(ph + o) * 0.35 * w; p.userData.legs[1].rotation.x = -Math.sin(ph + o) * 0.35 * w; p.position.x = (p === her4 ? BX - 0.35 : BX + 0.35) + (t - 4.2) * 0.25 * w; }
  him4.userData.head.rotation.x = t < 4.2 ? 0.35 : 0; him4.userData.head.rotation.y = t < 4.2 ? 0 : -0.35; her4.userData.head.rotation.y = t < 4.2 ? 0 : 0.35;
  SPARK.forEach((s, i) => { s.visible = t > 4.2; const k = (t * 0.3 + s.userData.o) % 1; s.position.set(BX + Math.sin(i * 2.3) * 2.2, 2.0 + k * 3.0, -1 + Math.cos(i * 1.7) * 0.8); s.material.opacity = 1 - k; });
  tLost.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tLost.visible = false;
  tShine.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.6, 0.6, u), lerp(3.0, 3.2, u), lerp(5.4, 4.8, u), BX + lerp(0, 0.6, u), 3.1, -1, 58);
  return qs;
}
function shotFilm(t) { // 5段目 33〜42：2022年の、日本映画。四季を、1年かけて撮影した
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1; S.floor.visible = false; S.darken(1, '#2a2430');
  SEASONS.forEach((p, i) => { const k = t < 4.2 ? 1 : ease(clamp((t - 4.2 - i * 0.4) / 0.35)); p.scale.setScalar(t < 4.2 ? 0.5 : 0.5 + 0.08 * k); p.position.y = p.userData.y + (t > 4.2 ? 0.06 * Math.sin(t * 2 + i) : 0); });
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  tYear.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 3.6, lerp(7.0, 6.4, u), FX, 3.6, -1.5, 56);
  return qs;
}
function shotBench(t, quiz = 0) { // 6段目 42〜49（決め手）：残された時間は、10年。音楽は、RADWIMPS
  base(); S.aim(NX, -2); lift(-20); S.hemi.intensity = 0.55; S.key.intensity = 0.4; S.darken(0.75, '#1a1430');
  LAMP6.intensity = 12; flakes(NX, 2, t, false);
  her6.userData.head.rotation.y = 0.25; him6.userData.head.rotation.y = -0.25; her6.userData.arms[1].rotation.x = -0.3; him6.userData.arms[0].rotation.x = -0.3;
  HOUR.visible = !quiz; const k = clamp(t / 7); HOUR.userData.sand.scale.setScalar(0.4 + 0.6 * k); HOUR.userData.sandT.scale.setScalar(1 - 0.7 * k); HOUR.rotation.y = t * 0.3;
  if (!quiz) { tTen.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tTen.visible = false; tRad.userData.pop((t - 3.6) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(0.4, 0.1, u), lerp(1.5, 1.6, u), lerp(4.6, 4.0, u), NX, 1.15, -0.8, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜桜の下のベンチのふたり）
  shotBench(t + 7, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.55, 0.25, d);
  S.spot.color.set(0xffe8d8); S.spot.position.set(NX, 6, 3); S.spot.target.position.set(NX, 0.8, -0.6); S.spot.intensity = lerp(0, 50, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.4, 0.2, k), lerp(1.5, 1.4, k), lerp(3.6, 3.0, k), NX, 1.2, -0.6, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotParty },
  { a: 9, b: 17, f: shotHospital },
  { a: 17, b: 25, f: shotSeasons },
  { a: 25, b: 33, f: shotBridge },
  { a: 33, b: 42, f: shotFilm },
  { a: 42, b: 49, f: (t) => shotBench(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '久しぶりの、<br>同窓会。'],
  [5.6, 9.0, '彼女には、誰にも言えない<br>秘密があった。'],
  [9.2, 13.2, '20歳で、<br>治らない病気がわかった。'],
  [13.2, 17.0, 'もう恋はしないと、<br>心に決めた。'],
  [17.2, 21.0, '桜が咲いて、<br>雪が降る。'],
  [21.0, 25.0, '季節は、<br>めぐっていく。'],
  [25.2, 29.0, '出会ったのは、<br>生きる意味を見失った彼。'],
  [29.0, 33.0, 'ふたりの毎日が、<br>輝き出す。'],
  [33.2, 37.4, '2022年の、<br>日本映画。'],
  [37.4, 41.8, '四季を、<br>1年かけて撮影した。'],
  [42.2, 45.4, '残された時間は、<br>10年。'],
  [45.4, 49.0, '音楽は、<br>RADWIMPS。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、余命10年。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q050', v2: true, answer: '余命10年',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 5050,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'bubble'], [4.8, 'buzz'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.2, 'bubble'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '余命10年': 'よめいじゅうねん', 'RADWIMPS': 'ラッドウィンプス', '10年': 'じゅうねん', '20歳': 'はたち', '2022年': 'にせんにじゅうにねん', '1年': 'いちねん', '久しぶり': 'ひさしぶり', '同窓会': 'どうそうかい', '彼女': 'かのじょ', '誰にも': 'だれにも', '言えない': 'いえない', '秘密': 'ひみつ', '治らない': 'なおらない', '病気': 'びょうき', 'もう恋は': 'もうこいは', '心に決めた': 'こころにきめた', '桜が咲いて': 'さくらがさいて', '雪が降る': 'ゆきがふる', '季節': 'きせつ', 'めぐって': 'めぐって', '出会った': 'であった', '生きる意味': 'いきるいみ', '見失った彼': 'みうしなったかれ', 'ふたりの毎日': 'ふたりのまいにち', '輝き出す': 'かがやきだす', '日本映画': 'にほんえいが', '四季': 'しき', '撮影': 'さつえい', '残された時間': 'のこされたじかん', '音楽': 'おんがく', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n久しぶりの、同窓会。彼女には、誰にも言えない秘密があった。20歳で、治らない病気がわかった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '邦画', '恋愛映画'],
  },
});
applyQuizCards({ answer: '余命10年', info: 'Netflix・Prime Video｜日本映画・125分', answerSize: 140 });
