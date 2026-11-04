import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #051 ボヘミアン・ラプソディ（映画・イギリス／アメリカ・2018年・135分・音楽。U-NEXT で見放題、
//   apis.justwatch.com（JustWatch 日本版 /jp/映画/bohemianrapusodei）と Filmarks の配信欄で2026/11/4確認。Filmarks 4.2・レビュー370,752件 filmarks.com/movies/73709）
// 確かめた事実（Filmarks の作品ページのあらすじ・ja.wikipedia「ボヘミアン・ラプソディ (映画)」・en.wikipedia「Bohemian Rhapsody (film)」。2026/11/4）：
//   ・伝説のバンド クイーンのフレディ・マーキュリーの成功と波乱万丈の人生を描く（Filmarks）
//   ・1970年代初頭、移民の青年（のちのフレディ）は空港で荷物係として働き、厳格な父と折り合いが悪い。ボーカルが抜けたバンド「スマイル」に自分を売り込み、
//     クイーンを結成する（ja/en wikipedia）
//   ・日本公開2018年11月9日。日本の興行収入 約131億円（再上映を含め約135億円）。第91回アカデミー賞 主演男優賞など4部門
// 構成（ヒント6段）：1 空港で荷物を運ぶ青年・頭の中は音楽 → 2 移民の家に生まれ厳しい父とぶつかってばかり → 3 1970年代・小さなライブハウスに通う日々
//   → 4 ボーカルが抜けたバンドに自分を売り込む → 5 実在のバンドを描いたイギリスとアメリカの映画・日本で130億円超え → 6 決め手：バンドはクイーン、ボーカルはフレディ・マーキュリー
// 国名（イギリス）・人物名・曲名は5〜6段目まで出さない。歌詞は使わない。後半の展開・結末（病気・最後のライブ）には触れない。作品の映像・俳優・
//   ポスター・有名な場面の構図（大観衆のスタジアムでのピアノ・拳を突き上げるポーズなど）は使わない。人と空港とステージは汎用の3D

const S = quizStage({ bg: '#22202c', floor: '#3a3640', fogNear: 22, fogFar: 80 });
const qs = S.scene;
const R = rng(5151);

const HERO = { skin: '#c8946a', hair: '#141414', shirt: '#e8e4dc', pants: '#2a2a34' };
const FATHER = { skin: '#b8845a', hair: '#8a8a8a', shirt: '#6a5a48', pants: '#3a3430' };
const BAND = (i) => ({ skin: ['#f2d4b8', '#efcfae', '#f2d4b8'][i], hair: ['#3a2a20', '#d8b870', '#6a4a2a'][i], shirt: ['#3a3a4a', '#8a3a3a', '#4a5a3a'][i], pants: '#22222a', long: i < 2 });

// ---------- 1段目. 空港の荷物置き場（x=0）。ベルトコンベアとスーツケース ----------
{ const fl = box(12, 0.04, 9, mat('#5a5a60')); fl.position.set(0, 0.02, -1); qs.add(fl); const wl = box(12, 6, 0.2, mat('#7a7a84')); wl.position.set(0, 3, -4.2); qs.add(wl);
  const belt = box(8, 0.5, 1.2, mat('#2a2a2e')); belt.position.set(0, 0.5, -2.2); qs.add(belt);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(200, 60, (g, w, h) => { g.fillStyle = '#2a2a30'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c14e'; g.beginPath(); g.moveTo(30, 30); g.lineTo(70, 14); g.lineTo(70, 46); g.fill(); g.fillRect(80, 24, 90, 12); }) })); pl.position.set(-2.5, 3.6, -4.08); qs.add(pl); }
const BAGS = []; for (let i = 0; i < 7; i++) { const b = box(0.7 + R() * 0.3, 0.45 + R() * 0.2, 0.3, mat(['#b23a3a', '#3a5a8a', '#f2c14e', '#3f8f6b', '#5a4a6a', '#e86a8a', '#8a6a4a'][i])); b.userData.o = i / 7; qs.add(b); BAGS.push(b); }
const hero1 = makePerson(HERO); hero1.position.set(0.3, 0, -0.9); hero1.rotation.y = Math.PI; qs.add(hero1);
const CARRY = box(0.7, 0.45, 0.3, mat('#4fa3d1')); qs.add(CARRY);
const NOTES = []; for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#e6b450' })); h.scale.set(1.3, 1, 1); g.add(h); const st = box(0.02, 0.24, 0.02, new THREE.MeshBasicMaterial({ color: '#e6b450' })); st.position.set(0.08, 0.12, 0); g.add(st); g.userData.o = i / 8; qs.add(g); NOTES.push(g); }
const tBag = tag('空港の荷物係', { size: 76, w: 480, bg: '#14161c', sx: 1.6 }); tBag.position.set(0.2, 2.55, -1.6); qs.add(tBag);
const tMusic = tag('頭の中は 音楽でいっぱい', { size: 58, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.75 }); tMusic.position.set(0.3, 2.55, -1.6); qs.add(tMusic);

// ---------- 2段目. 家の食卓（x=40）。厳しい父 ----------
const KX = 40;
{ const fl = box(9, 0.04, 7, mat('#7a5a3e')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#c8b490')); wl.position.set(KX, 3, -3.6); qs.add(wl);
  const tb = box(2.4, 0.08, 1.1, mat('#5a3a24')); tb.position.set(KX, 0.8, -1.6); qs.add(tb); const tl = box(2.2, 0.76, 0.9, mat('#4a2e1c')); tl.position.set(KX, 0.4, -1.6); qs.add(tl);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(80, 60, (g, w, h) => { g.fillStyle = '#5a3a20'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8c8a0'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = '#8a7a5a'; g.beginPath(); g.arc(w / 2, h / 2, 12, 0, Math.PI * 2); g.fill(); }) })); pic.position.set(KX - 1.6, 2.6, -3.48); qs.add(pic); }
const father = makePerson(FATHER); father.position.set(KX + 0.9, -0.42, -2.2); father.userData.legs.forEach(l => l.rotation.x = -1.5); father.rotation.y = -0.4; qs.add(father);
const hero2 = makePerson(HERO); hero2.position.set(KX - 0.8, 0, -0.9); hero2.rotation.y = Math.PI * 0.8; qs.add(hero2);
const BOLT = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0.4); s.lineTo(0.2, 0.05); s.lineTo(0.05, 0.05); s.lineTo(0.15, -0.4); s.lineTo(-0.15, 0.0); s.lineTo(0.0, 0.0); s.lineTo(-0.1, 0.4); s.closePath(); return s; })()), new THREE.MeshBasicMaterial({ color: '#f2c14e', side: THREE.DoubleSide })); BOLT.position.set(KX + 0.05, 2.2, -1.5); qs.add(BOLT);
const tImm = tag('移民の家に生まれた青年', { size: 58, w: 680, bg: '#14161c', sx: 2.1 }); tImm.position.set(KX, 2.95, -1.5); qs.add(tImm);
const tClash = tag('厳しい父と ぶつかる', { size: 64, w: 600, bg: '#b23a3a', sx: 2.0 }); tClash.position.set(KX, 2.95, -1.5); qs.add(tClash);

// ---------- 3段目. 小さなライブハウス（x=90）。煙と色の照明 ----------
const CX = 90;
{ const fl = box(10, 0.04, 9, mat('#2a2228')); fl.position.set(CX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#2a2030')); wl.position.set(CX, 3, -4.4); qs.add(wl);
  const st = box(6, 0.5, 2.4, mat('#3a2a2a')); st.position.set(CX, 0.25, -3.2); qs.add(st);
  for (let i = 0; i < 2; i++) { const am = box(0.8, 1.2, 0.6, mat('#1a1a1e')); am.position.set(CX + (i ? 2.4 : -2.4), 1.1, -3.6); qs.add(am); }
  const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 18), mat('#c8c8d0')); dr.position.set(CX, 0.85, -3.8); dr.rotation.x = Math.PI / 2; qs.add(dr); }
const LIGHTS3 = ['#e2483c', '#4fa3d1', '#8e6bbf'].map((c, i) => { const l = new THREE.SpotLight(c, 0, 12, 0.5, 0.6, 1); l.position.set(CX - 2 + i * 2, 5, -1); l.target.position.set(CX - 1 + i, 0.5, -3.2); qs.add(l); qs.add(l.target); return l; });
const SMOKE = []; for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.4), new THREE.MeshBasicMaterial({ color: '#8a80a0', transparent: true, opacity: 0.12, depthWrite: false })); s.position.set(CX - 4 + i, 2 + (i % 3) * 0.6, -2 - (i % 2)); qs.add(s); SMOKE.push(s); }
const CROWD3 = []; for (let i = 0; i < 7; i++) { const p = makePerson({ skin: '#1a1820', hair: '#121016', shirt: '#1a1820', pants: '#1a1820', long: i % 3 === 0 }); p.position.set(CX - 2.6 + i * 0.85, 0, -0.6 + (i % 2) * 0.5); p.rotation.y = Math.PI; qs.add(p); CROWD3.push(p); }
const hero3 = makePerson(HERO); hero3.position.set(CX + 0.4, 0, 0.6); hero3.rotation.y = Math.PI; qs.add(hero3);
const t70 = tag('1970年代', { size: 84, w: 400, bg: '#8e6bbf', sx: 2.0 }); t70.position.set(CX, 3.0, -2.2); qs.add(t70);
const tLive = tag('小さなライブハウス通い', { size: 60, w: 660, bg: '#14161c', sx: 2.4 }); tLive.position.set(CX, 3.0, -2.2); qs.add(tLive);

// ---------- 4段目. ライブのあとの裏口（x=130）。ふたりのメンバーに売り込む ----------
const BX = 130;
{ const fl = box(10, 0.04, 8, mat('#3a3a3e')); fl.position.set(BX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#5a4a44')); wl.position.set(BX, 3, -3.4); qs.add(wl);
  const dr = box(1.2, 2.2, 0.1, mat('#2a3a4a')); dr.position.set(BX - 2.0, 1.1, -3.28); qs.add(dr); const lt = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); lt.position.set(BX - 2.0, 2.5, -3.2); qs.add(lt);
  for (let i = 0; i < 3; i++) { const bn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 14), mat('#4a5a4a')); bn.position.set(BX + 2.6 + (i % 2) * 0.4, 0.4, -2.8 + i * 0.3); qs.add(bn); } }
const MEMB = [0, 1].map(i => { const p = makePerson(BAND(i)); p.position.set(BX - 0.5 + i * 0.9, 0, -2.0); p.rotation.y = 0.2 - i * 0.4; qs.add(p); return p; });
const CASE = box(0.3, 1.0, 0.12, mat('#1a1a1e')); CASE.position.set(BX - 0.18, 0.6, -1.85); qs.add(CASE);
const hero4 = makePerson(HERO); hero4.position.set(BX + 0.1, 0, -0.4); hero4.rotation.y = Math.PI; qs.add(hero4);
const MIC4 = new THREE.Group(); { const s = box(0.03, 1.4, 0.03, mat('#c8c8d0')); s.position.y = 0.7; MIC4.add(s); const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#2a2a2e')); h.position.y = 1.45; MIC4.add(h); } MIC4.position.set(BX, 0, -1); MIC4.visible = false; qs.add(MIC4);
const tGone = tag('ボーカルが抜けたバンド', { size: 60, w: 660, bg: '#14161c', sx: 1.6 }); tGone.position.set(BX + 0.15, 2.7, -1.6); qs.add(tGone);
const tPitch = tag('自分を 売り込む', { size: 74, w: 520, bg: '#e2483c', sx: 1.5 }); tPitch.position.set(BX + 0.15, 2.7, -1.6); qs.add(tPitch);

// ---------- 5段目. フィルムと金色の数字（x=170）。実在のバンドの映画・日本で130億円超え ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1a1424' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const FILM = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(560, 104, (g, w, h) => { g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d4c8'; for (let x = 6; x < w; x += 22) { g.fillRect(x, 6, 10, 10); g.fillRect(x, h - 16, 10, 10); } for (let k = 0; k < 6; k++) { g.fillStyle = ['#5a3a5a', '#3a4458', '#5a4a3a'][k % 3]; g.fillRect(8 + k * 92, 24, 84, 56); g.fillStyle = 'rgba(255,255,255,.5)'; for (let j = 0; j < 4; j++) g.fillRect(20 + k * 92 + j * 16, 56 - j * 4, 8, 20 + j * 4); } }) })); FILM.material.map.wrapS = THREE.RepeatWrapping; FILM.position.set(FX, 2.0, -1.5); qs.add(FILM);
const BARS5 = []; for (let i = 0; i < 6; i++) { const b = box(0.5, 1, 0.3, new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.7, roughness: 0.3, emissive: '#3a2808' })); b.position.set(FX - 1.5 + i * 0.6, 0, -0.8); b.userData.h = 0.3 + i * 0.35; qs.add(b); BARS5.push(b); }
const tReal = tag('実在のバンドを描いた映画', { size: 56, w: 720, bg: '#8e6bbf', sx: 3.2 }); tReal.position.set(FX, 4.5, -1.2); qs.add(tReal);
const tYen = tag('日本で 興行収入130億円超え', { size: 52, w: 760, bg: '#e6b450', color: '#14161c', sx: 3.4 }); tYen.position.set(FX, 4.5, -1.2); qs.add(tYen);

// ---------- 6段目. 王冠とマイクのステージ（x=210）。バンドはクイーン ----------
const NX = 210;
{ const fl = box(12, 0.04, 10, mat('#1a1820')); fl.position.set(NX, 0.02, -2); qs.add(fl); const st = box(7, 0.6, 3, mat('#2a2430')); st.position.set(NX, 0.3, -2.6); qs.add(st); }
const CROWN = new THREE.Group(); { const gm = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.85, roughness: 0.25, emissive: '#4a3008' }); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 30, 1, true), gm); band.material.side = THREE.DoubleSide; CROWN.add(band); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 8), gm); sp.position.set(Math.cos(a) * 0.9, 0.48, Math.sin(a) * 0.9); CROWN.add(sp); const jw = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: ['#e2483c', '#4fa3d1'][i % 2] })); jw.position.set(Math.cos(a) * 0.92, 0.05, Math.sin(a) * 0.92); CROWN.add(jw); } } CROWN.position.set(NX, 4.0, -3.4); qs.add(CROWN);
const MEMB6 = [0, 1, 2].map(i => { const p = makePerson(BAND(i)); p.position.set(NX - 2.2 + i * 2.2 + (i === 1 ? 2.2 : 0) - (i === 2 ? 2.2 : 0), 0.6, -3.2); qs.add(p); return p; });
MEMB6[0].position.set(NX - 2.2, 0.6, -3.0); MEMB6[1].position.set(NX + 2.2, 0.6, -3.0); MEMB6[2].position.set(NX + 1.0, 0.6, -3.7);
const hero6 = makePerson({ ...HERO, shirt: '#f4f4f0', pants: '#f4f4f0' }); hero6.position.set(NX, 0.6, -2.2); qs.add(hero6);
const MIC6 = new THREE.Group(); { const s = box(0.03, 1.4, 0.03, mat('#c8c8d0')); s.position.y = 0.7; MIC6.add(s); const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#2a2a2e')); h.position.y = 1.45; MIC6.add(h); } MIC6.position.set(NX, 0.6, -1.75); qs.add(MIC6);
const SPOTS6 = [0xffe8c8, 0xe2483c, 0x4fa3d1].map((c, i) => { const l = new THREE.SpotLight(c, 0, 14, 0.4, 0.5, 1); l.position.set(NX - 3 + i * 3, 7, 1); l.target.position.set(NX + (i - 1) * 1.6, 0.6, -3); qs.add(l); qs.add(l.target); return l; });
const tQueen = tag('バンドは クイーン', { size: 70, w: 560, bg: '#e6b450', color: '#14161c', sx: 2.2 }); tQueen.position.set(NX, 4.05, -2.0); qs.add(tQueen);
const tFreddie = tag('ボーカル フレディ・マーキュリー', { size: 52, w: 800, bg: '#14161c', sx: 2.9 }); tFreddie.position.set(NX, 4.05, -2.0); qs.add(tFreddie);

// ---------- shots ----------
const ALL = [tBag, tMusic, tImm, tClash, t70, tLive, tGone, tPitch, tReal, tYen, tQueen, tFreddie];
function base() { S.reset(); ALL.forEach(x => x.visible = false); NOTES.forEach(n => n.visible = false); LIGHTS3.forEach(l => l.intensity = 0); SPOTS6.forEach(l => l.intensity = 0); S.floor.visible = true; }

function shotAirport(t) { // 1段目 0〜9：空港で、荷物を運ぶ青年。でも、頭の中は音楽でいっぱい（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.1; S.darken(0.15, '#4a4a54');
  BAGS.forEach((b, i) => { const k = (t * 0.12 + b.userData.o) % 1; b.position.set(-4 + k * 8, 0.98, -2.2); b.rotation.y = i * 0.3; });
  const lift1 = Math.abs(Math.sin(t * 1.6)); hero1.userData.arms.forEach(a => a.rotation.x = -1.2 - lift1 * 0.6); CARRY.position.set(0.3, 1.5 + lift1 * 0.45, -1.35); hero1.userData.head.rotation.y = t > 4.6 ? Math.sin(t * 6) * 0.25 : 0; hero1.userData.head.rotation.x = t > 4.6 ? -0.15 : 0.1;
  NOTES.forEach((n, i) => { n.visible = t > 4.6; const k = (t * 0.4 + n.userData.o) % 1; n.position.set(0.3 + Math.sin(k * 6 + i) * 0.7, 2.0 + k * 1.4, -1.0); n.scale.setScalar(1 - k * 0.4); });
  tBag.userData.pop(1); if (t > 4.6) tBag.visible = false;
  tMusic.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(0.8, 0.5, u), lerp(2.0, 1.9, u), lerp(3.4, 2.7, u), 0.2, 1.6, -1.8, 58);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：移民の家に生まれた青年。厳しい父と、ぶつかってばかり
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.0; S.darken(0.15, '#5a4a3a');
  father.userData.arms[1].rotation.x = t > 4.2 ? -1.4 - 0.2 * Math.sin(t * 8) : -0.6; father.userData.head.rotation.y = 0.3;
  hero2.userData.arms[0].rotation.x = t > 4.4 ? -0.9 : 0; hero2.userData.head.rotation.y = t > 4.4 ? -0.3 : 0;
  BOLT.visible = t > 4.4; BOLT.scale.setScalar(t > 4.4 ? 1 + 0.15 * Math.sin(t * 14) : 0.01);
  tImm.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tImm.visible = false;
  tClash.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(0.2, 0.1, u), lerp(2.0, 1.9, u), lerp(3.8, 3.2, u), KX, 1.4, -1.6, 58);
  return qs;
}
function shotClub(t) { // 3段目 17〜25：舞台は、1970年代。小さなライブハウスに、通う日々
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.6, '#0a0810');
  LIGHTS3.forEach((l, i) => { l.intensity = 30; l.target.position.x = CX - 1 + i + Math.sin(t * 1.4 + i * 2) * 1.2; });
  SMOKE.forEach((s, i) => s.position.x = CX - 4 + i + Math.sin(t * 0.5 + i) * 0.4);
  CROWD3.forEach((p, i) => { p.position.y = Math.max(0, Math.sin(t * 6 + i)) * 0.08; p.userData.arms[i % 2].rotation.x = -2.4 + 0.3 * Math.sin(t * 6 + i); });
  hero3.userData.head.rotation.x = -0.1;
  t70.userData.pop((t - 0.6) / 0.35); if (t > 4.0) t70.visible = false;
  tLive.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.8, 0.4, u), lerp(3.2, 3.3, u), lerp(4.6, 4.0, u), CX, 1.3, -3.0, 58);
  return qs;
}
function shotPitch(t) { // 4段目 25〜33：ボーカルが抜けたバンドに、自分を売り込む。ここから、すべてが始まる
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 0.7; S.darken(0.45, '#0e0e16');
  MEMB.forEach((p, i) => { p.userData.head.rotation.x = 0.1; p.userData.arms[i].rotation.x = t > 4.4 ? -0.4 : 0; p.userData.head.rotation.y = t > 4.4 ? (i ? 0.3 : -0.3) : 0; });
  hero4.userData.arms[1].rotation.x = t > 4.2 ? -1.8 - 0.3 * Math.sin(t * 5) : -0.3; hero4.userData.arms[0].rotation.x = t > 4.2 ? -0.9 : 0;
  MIC4.visible = false;
  tGone.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tGone.visible = false;
  tPitch.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.2, 0.8, u), lerp(1.9, 1.8, u), lerp(2.8, 2.2, u), BX + 0.1, 1.6, -1.6, 58);
  return qs;
}
function shotFilm(t) { // 5段目 33〜42：実在のバンドを描いた、イギリスとアメリカの映画。日本で、興行収入130億円を超えた
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.0; S.floor.visible = false; S.darken(1, '#1a1424');
  FILM.material.map.offset.x = t * 0.06;
  BARS5.forEach((b, i) => { const k = t > 4.2 ? ease(clamp((t - 4.2 - i * 0.15) / 0.5)) : 0; b.visible = k > 0.01; b.scale.y = Math.max(0.01, b.userData.h * k); b.position.y = 0.3 + b.userData.h * k / 2; });
  tReal.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tReal.visible = false;
  tYen.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.6, lerp(7.2, 6.4, u), FX, 2.6, -1.5, 56);
  return qs;
}
function shotStage(t, quiz = 0) { // 6段目 42〜49（決め手）：バンドの名前は、クイーン。ボーカルは、フレディ・マーキュリー
  base(); S.aim(NX, -3); lift(-30); S.hemi.intensity = 0.6; S.key.intensity = 0.4; S.darken(0.8, '#06060a');
  SPOTS6.forEach((l, i) => { l.intensity = 40; l.target.position.x = NX + (i - 1) * 1.6 + Math.sin(t + i) * 0.4; });
  CROWN.rotation.y = t * 0.5; CROWN.position.y = 3.0 + Math.sin(t * 1.5) * 0.06; CROWN.scale.setScalar(0.8); CROWN.visible = !quiz;
  hero6.userData.arms[1].rotation.x = -2.2 + 0.25 * Math.sin(t * 3); hero6.userData.arms[0].rotation.x = -0.6; hero6.userData.head.rotation.x = -0.15;
  MEMB6.forEach((p, i) => { p.userData.arms.forEach((a, k) => a.rotation.x = -0.9 - 0.2 * Math.sin(t * 7 + i + k)); p.userData.head.rotation.x = 0.15 * Math.sin(t * 4 + i); });
  if (!quiz) { tQueen.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tQueen.visible = false; tFreddie.userData.pop((t - 3.6) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(0.3, 0.1, u), lerp(1.9, 2.0, u), lerp(4.6, 4.0, u), NX, 2.15, -3, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（マイクの前に立つボーカル）
  shotStage(t + 7, 1);
  SPOTS6.forEach(l => l.intensity = lerp(40, 8, ease(t)));
  S.spot.color.set(0xffe8c8); S.spot.position.set(NX, 7, 1); S.spot.target.position.set(NX, 1.2, -2.2); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(0.6, 0.3, k), lerp(2.0, 1.9, k), lerp(1.4, 0.9, k), NX, 1.9, -2.2, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotAirport },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotClub },
  { a: 25, b: 33, f: shotPitch },
  { a: 33, b: 42, f: shotFilm },
  { a: 42, b: 49, f: (t) => shotStage(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '空港で、<br>荷物を運ぶ青年。'],
  [5.6, 9.0, 'でも、頭の中は、<br>音楽でいっぱい。'],
  [9.2, 13.2, '移民の家に生まれ、'],
  [13.2, 17.0, '厳しい父と、<br>ぶつかってばかり。'],
  [17.2, 21.0, '舞台は、<br>1970年代。'],
  [21.0, 25.0, '小さなライブハウスに、<br>通う日々。'],
  [25.2, 29.0, 'ボーカルが抜けたバンドに、<br>自分を売り込む。'],
  [29.0, 33.0, 'ここから、<br>すべてが始まる。'],
  [33.2, 37.4, '実在のバンドを描いた、<br>イギリスとアメリカの映画。'],
  [37.4, 41.8, '日本で、興行収入<br>130億円を超えた。'],
  [42.2, 45.4, 'バンドの名前は、<br>クイーン。'],
  [45.4, 49.0, 'ボーカルは、<br>フレディ・マーキュリー。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ボヘミアン・ラプソディ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q051', v2: true, answer: 'ボヘミアン・ラプソディ',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 5151,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [4.8, 'bubble'], [9.0, 'whoosh'], [13.4, 'buzz'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ボヘミアン・ラプソディ': 'ボヘミアンラプソディ', 'フレディ・マーキュリー': 'フレディマーキュリー', 'クイーン': 'クイーン', '1970年代': 'せんきゅうひゃくななじゅうねんだい', '130億円': 'ひゃくさんじゅうおくえん', '空港': 'くうこう', '荷物': 'にもつ', '運ぶ': 'はこぶ', '青年': 'せいねん', '頭の中': 'あたまのなか', '音楽': 'おんがく', '移民の家': 'いみんのいえ', '生まれ': 'うまれ', '厳しい父': 'きびしいちち', '舞台': 'ぶたい', 'ライブハウス': 'ライブハウス', '通う日々': 'かようひび', 'ボーカル': 'ボーカル', '抜けた': 'ぬけた', '自分を': 'じぶんを', '売り込む': 'うりこむ', 'すべてが始まる': 'すべてがはじまる', '実在': 'じつざい', '描いた': 'えがいた', 'イギリス': 'イギリス', 'アメリカ': 'アメリカ', '日本で': 'にほんで', '興行収入': 'こうぎょうしゅうにゅう', '超えた': 'こえた', '名前': 'なまえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n空港で、荷物を運ぶ青年。でも、頭の中は、音楽でいっぱい。移民の家に生まれ、厳しい父と、ぶつかってばかり。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', '映画好き', '音楽映画', '洋画'],
  },
});
applyQuizCards({ answer: 'ボヘミアン・<br>ラプソディ', info: 'U-NEXT｜映画・135分', answerSize: 104 });
