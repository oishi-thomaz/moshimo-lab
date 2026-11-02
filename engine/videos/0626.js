import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';

// もしも競馬と競艇が消えたら？（v2・風刺回）
// 2026/11/02 ゆうと：はてな匿名ダイアリーの見立て（公営ギャンブル＝独身おぢから取る隠れ子育て税）を、現実の筋に直して台本化。表記は「おぢ」
// 数字：
//  ・JRA は売上（売得金）の10%を国庫に納める（東洋経済オンライン 2022/1/3。使い道は畜産振興 3/4・社会福祉 1/4）
//  ・北九州市：競艇・競輪の収益から一般会計へ 2024年度 50億円、そのうち子ども医療費支給事業に 約27億円（北九州市「公営競技の社会貢献」）
//  ※「子育て支援に回る」は北九州市の実例で言う。全国一律の話にはしない

const GOLD = '#ffd27a', RED = '#ff6a6a', BLUE = '#7fd4ff', PINK = '#ff9ec7', GREEN = '#9be86a', GRAY = '#cfd3dc';

const S = new THREE.Scene();
S.background = new THREE.Color('#8fc3ef'); S.fog = new THREE.Fog(0x8fc3ef, 80, 260);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5a6a, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(14, 30, 20); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat('#6f8f5a')); ground.rotation.x = -Math.PI / 2; ground.material.depthWrite = false; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); m.renderOrder = ro; S.add(m); return m; }

// ---------- A：競艇場（原点）：水面・ボート・スタンドのおぢ ----------
const pool = flat(40, 14, '#3f8fd0', 0, -9, -0.8);
const lane = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.75, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', depthWrite: false })); lane.rotation.x = -Math.PI / 2; lane.scale.set(3, 1, 1); lane.position.set(0, 0.03, -9); lane.renderOrder = -0.7; S.add(lane);
const BOATS = []; const BCOL = ['#ffffff', '#222222', '#e04040', '#3060d0', '#f2d040', '#3fa060'];
for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const hull = box(1.2, 0.3, 0.55, mat(BCOL[i])); hull.position.y = 0.2; g.add(hull); const p = box(0.25, 0.4, 0.25, mat('#1d1a19')); p.position.set(-0.2, 0.55, 0); g.add(p); S.add(g); BOATS.push(g); }
const stand = new THREE.Group(); S.add(stand);
for (let r = 0; r < 3; r++) { const st = box(26, 0.5, 1.6, mat('#bfc4cc')); st.position.set(0, 0.25 + r * 0.6, 1.2 + r * 1.6); stand.add(st); }
const roof = box(28, 0.3, 6, mat('#e4e7ec')); roof.position.set(0, 5.6, 3); stand.add(roof);
const CROWD = []; const TICKETS = [];
{ const r = rng(26); for (let i = 0; i < 27; i++) { const row = Math.floor(i / 9), col = i % 9; const p = makeOji(r); p.position.set(-9.6 + col * 2.4 + (r() - .5) * .4, 0.5 + row * 0.6, 1.4 + row * 1.6); p.rotation.y = Math.PI; S.add(p); CROWD.push(p);
  const tk = box(0.3, 0.18, 0.02, mat('#ffffff')); tk.position.set(0, -0.62, 0.05); p.userData.arms[1].add(tk); TICKETS.push(tk); } }
const HERO = CROWD[13];
const confetti = makeSparkles(500, 0.35, 0xffffff); S.add(confetti.points); confetti.init(CROWD.map(p => [p.position.x, 2.6, p.position.z]), 1.4, 4);
const vanish = makeSparkles(300, 0.5, 0xffd27a); S.add(vanish.points); vanish.init(BOATS.map((b, i) => [Math.cos(i) * 12, 0.5, -9 + Math.sin(i) * 4]), 2, 4);
const chi = label('チッ', { size: 150, color: '#fff', bg: 'rgba(200,50,60,.92)', sx: 1.2 }); S.add(chi);
const medal = label('日本一まじめな納税者', { w: 1024, size: 92, color: '#fff', bg: 'rgba(200,150,40,.95)', sx: 4.4 }); S.add(medal);
const heroSp = makeSparkles(220, 0.32, 0xfff2c0); S.add(heroSp.points); heroSp.init([[HERO.position.x, HERO.position.y + 1.8, HERO.position.z]], 1.6, 2);
function boats(t, on = 1) { BOATS.forEach((b, i) => { b.visible = on > 0; const a = t * 0.9 + i * 0.22; b.position.set(Math.cos(a) * 13.9, 0, -9 + Math.sin(a) * 4.7); b.rotation.y = -a - Math.PI / 2; }); }
function cheer(t, k = 1) { CROWD.forEach((p, i) => { p.userData.arms[1].rotation.x = -2.6 * k + Math.sin(t * 7 + i) * 0.25 * k; }); }

// ---------- B：世間（x=-60）：公園のベンチの人たち ----------
const WX = -60;
flat(16, 10, '#9a8a6a', WX, 0, -0.8);
const bench = box(4.2, 0.5, 1, mat('#7a5a3a')); bench.position.set(WX, 0.25, -0.4); S.add(bench);
const SEKEN = [makeWoman({ shirt: '#c9a8d8' }), makeMan({ shirt: '#4f6a8f' }), makeWoman({ shirt: '#9fc7a8', hair: '#6b4a33' })];
SEKEN.forEach((p, i) => { p.position.set(WX - 1.5 + i * 1.5, 0, 0.4); S.add(p); });
const medetashi = label('めでたし', { size: 120, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 2.2 }); medetashi.position.set(WX, 3.0, 0.6); S.add(medetashi);

// ---------- C：お金の行き先（x=60〜110）：国・北九州市・子どもの病院 ----------
function bldg(x, z, w, h, d, color, name, nameBg) { const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g); const b = box(w, h, d, mat(color)); b.position.y = h / 2; g.add(b);
  for (let i = 0; i < Math.floor(w / 1.4); i++) for (let j = 0; j < Math.floor((h - 1.2) / 1.3); j++) { const wi = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.75), new THREE.MeshBasicMaterial({ color: '#cfe6ff' })); wi.position.set(-w / 2 + (i + 0.6) * 1.4, 1.4 + j * 1.3, d / 2 + 0.02); g.add(wi); }
  const sg = label(name, { w: 1024, size: 100, color: '#fff', bg: nameBg, sx: Math.min(w, 5.2) }); sg.position.set(0, h + 1.0, d / 2); g.add(sg); return g; }
const NATION = bldg(60, -4, 10, 6, 6, '#e8e4da', '国（国庫）', 'rgba(60,70,90,.92)');
const dome = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d6d0c2')); dome.position.set(60, 6, -4); S.add(dome);
const CITY = bldg(85, -4, 8, 9, 6, '#cfd6de', '北九州市', 'rgba(30,110,170,.92)');
const HOSP = bldg(110, -4, 9, 6, 6, '#f6f4f0', '子ども医療費', 'rgba(220,90,120,.92)');
const cross = box(1.4, 0.4, 0.1, mat('#e04050')); cross.position.set(110, 4.8, -0.9); S.add(cross); const cross2 = box(0.4, 1.4, 0.1, mat('#e04050')); cross2.position.set(110, 4.8, -0.9); S.add(cross2);
const MOM = makeWoman({ shirt: '#9fc7a8' }); MOM.position.set(109, 0, 1.2); S.add(MOM);
const KID = makeMan({ shirt: '#f2c14e', hair: '#3a2620', scale: 0.55 }); KID.position.set(110.2, 0, 1.4); S.add(KID);
const coinG = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 18), coinM = mat('#e8b84a');
const COINS = []; for (let i = 0; i < 24; i++) { const c = new THREE.Mesh(coinG, coinM); c.rotation.x = Math.PI / 2; S.add(c); COINS.push(c); }
function coinFlow(t, from, to, n = 24, speed = 0.6, arc = 3) { COINS.forEach((c, i) => { c.visible = i < n; if (i >= n) return; const u = ((t * speed + i / n) % 1); c.position.set(lerp(from.x, to.x, u), lerp(from.y, to.y, u) + Math.sin(u * Math.PI) * arc, lerp(from.z, to.z, u)); c.rotation.z = t * 1.5 + i; }); }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// 金庫の穴
const safe = box(3, 3, 2.4, mat('#5a5f6b')); safe.position.set(85, 1.5, 3.5); S.add(safe);
const hole = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), new THREE.MeshBasicMaterial({ color: '#111' })); hole.position.set(85, 0.9, 4.72); S.add(hole);
const holeLab = label('財源に穴', { size: 120, color: '#fff', bg: 'rgba(200,50,60,.92)', sx: 2.0 }); holeLab.position.set(85, 3.9, 4.0); S.add(holeLab);

// ---------- D：お知らせの紙（x=-110） ----------
const NX = -110;
const desk = box(6, 0.3, 4, mat('#b48a5e')); desk.position.set(NX, 1.0, 0); S.add(desk);
const noticeC = document.createElement('canvas'); noticeC.width = 720; noticeC.height = 1000;
{ const g = noticeC.getContext('2d'); g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 720, 1000); g.fillStyle = '#222'; g.textAlign = 'center'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.fillText('お知らせ', 360, 110);
  g.font = '700 40px "Noto Sans CJK JP", sans-serif'; ['子ども医療費の助成を', '縮小します', '', '財源が不足したため'].forEach((s, i) => g.fillText(s, 360, 260 + i * 80));
  g.font = '700 34px "Noto Sans CJK JP", sans-serif'; g.fillText('〇〇市 子育て支援課', 360, 900); g.strokeStyle = '#d23a3a'; g.lineWidth = 6; g.strokeRect(80, 200, 560, 200); }
const noticeT = new THREE.CanvasTexture(noticeC); noticeT.colorSpace = THREE.SRGBColorSpace;
const notice = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.6), new THREE.MeshBasicMaterial({ map: noticeT })); notice.rotation.x = -Math.PI / 2; notice.position.set(NX, 1.17, 0); S.add(notice);
const PARENT = makeWoman({ shirt: '#e9e4da' }); PARENT.position.set(NX - 0.2, 0, -2.6); S.add(PARENT);
const PARENT2 = makeMan({ shirt: '#59606e' }); PARENT2.position.set(NX + 1.6, 0, -2.6); S.add(PARENT2);
const taxLab = label('ギャンブルしない人の税金', { w: 1024, size: 88, color: '#fff', bg: 'rgba(90,90,100,.95)', sx: 4.6 }); taxLab.position.set(NX, 4.4, -2.2); S.add(taxLab);

// ---------- E：焼肉（x=150）：浮いたお金でちょっといい焼肉 ----------
const YX = 150;
const yroom = makeRoom({ w: 8, d: 6, wall: '#5a3a2a', floor: '#3a2a20' }); yroom.position.set(YX, 0, 0); yroom.userData.rw.visible = false; S.add(yroom);
const ytable = box(3.2, 0.9, 2, mat('#2a1a14')); ytable.position.set(YX, 0.45, -0.5); S.add(ytable);
const grill = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 24), mat('#3a3a3a')); grill.position.set(YX, 0.96, -0.5); S.add(grill);
const MEAT = []; for (let i = 0; i < 6; i++) { const m = box(0.36, 0.05, 0.22, mat('#c0504a')); m.position.set(YX - 0.35 + (i % 3) * 0.35, 1.04, -0.75 + Math.floor(i / 3) * 0.45); m.rotation.y = i; S.add(m); MEAT.push(m); }
const yLight = new THREE.PointLight(0xffb070, 10, 10, 1.4); yLight.position.set(YX, 3, 1); S.add(yLight);
const smoke = makeSparkles(150, 0.4, 0xdddddd); S.add(smoke.points); smoke.init([[YX, 1.2, -0.5]], 0.6, 3);
const yumLab = label('ちょっといい焼肉', { w: 1024, size: 96, color: '#fff', bg: 'rgba(200,110,40,.92)', sx: 3.4 }); yumLab.position.set(YX, 3.0, -0.5); S.add(yumLab);
const EATER = makeOji(rng(5), { shirt: '#59606e' }); S.add(EATER);

function reset() {
  boats(0, 1); CROWD.forEach(p => { p.visible = true; p.userData.head.rotation.set(0, 0, 0); p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.rotation.y = Math.PI; }); TICKETS.forEach(tk => tk.visible = true); cheer(0, 1);
  confetti.set(0); vanish.set(0); chi.visible = false; medal.visible = false; heroSp.set(0); medetashi.visible = false; COINS.forEach(c => c.visible = false);
  holeLab.visible = false; safe.visible = false; hole.visible = false; taxLab.visible = false; yumLab.visible = false; smoke.set(0); EATER.position.set(YX, 0, 0.8); EATER.rotation.y = Math.PI;
  hemi.intensity = 1.15; S.background.set('#8fc3ef'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function standCam(t, d = 0) { look(lerp(3, 2, d), lerp(5.2, 5.6, d), lerp(14, 15.5, d), 0, 2.4, -2, 52); }
function shot0(t) { // 0秒＝サムネ：満員の競艇場。0.5秒で舟券とボートが消える
  reset(); lift(110); const k = t - TP; boats(t, k < 0 ? 1 : 0); cheer(t, k < 0 ? 1 : 0.2);
  TICKETS.forEach(tk => tk.visible = k < 0); confetti.set(k > 0 ? clamp(k / 1.6) : 0); vanish.set(k > 0 ? clamp(k / 1.4) : 0);
  el.flash.style.opacity = k > 0 ? 0.45 * Math.max(0, 1 - k / 0.25) : 0;
  CROWD.forEach((p, i) => { p.userData.head.rotation.y = k > 0.3 ? Math.sin(t * 2 + i) * 0.5 : 0; });
  standCam(t, ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // 競馬・競艇・競輪が消えた
  reset(); lift(110); boats(t, 0); TICKETS.forEach(tk => tk.visible = false); cheer(t, 0);
  CROWD.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.5 + i) * 0.6; });
  look(0, lerp(9, 12, ease(clamp(t / 3.3))), lerp(16, 20, ease(clamp(t / 3.3))), 0, 0.5, -6, 50);
  setTop('この世の競馬・競艇・競輪', 'ぜんぶ消滅', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function shot2(t) { // 世間「めでたし」
  reset(); lift(150); SEKEN.forEach((p, i) => { p.userData.arms.forEach((a, j) => { a.rotation.x = -0.4 - Math.abs(Math.sin(t * 6 + i)) * 0.4 * (j === i % 2 ? 1 : 0); }); });
  pop(medetashi, t, 0.5, 0.35, 1.8);
  look(WX + 1.6, 2.4, 6.6, WX, 1.6, 0.2, 50);
  setTop('世間の声', 'これで平和', fade(t, 0.15, 3.2, 0.25), GREEN);
  return S;
}
function shot3(t) { // おぢが毎週負けていたお金はどこへ
  reset(); lift(150); boats(0, 0); TICKETS.forEach(tk => tk.visible = false); CROWD.forEach(p => p.visible = p === HERO);
  HERO.userData.arms.forEach(a => { a.rotation.x = -0.5; a.rotation.z = 0; }); HERO.userData.head.rotation.x = 0.3;
  coinFlow(t, V(HERO.position.x, 2.2, HERO.position.z), V(HERO.position.x + 8, 6, HERO.position.z - 10), 12, 0.22, 1.5);
  look(HERO.position.x + 3.2, 3.0, HERO.position.z + 5.2, HERO.position.x + 1, 2.2, HERO.position.z - 2, 52);
  setTop('おぢが負けたお金', 'どこへ？', fade(t, 0.15, 3.3, 0.25), GOLD);
  return S;
}
function shot4(t) { // JRAの売上の約10%が国へ
  reset(); lift(80); coinFlow(t, V(52, 7, 4), V(60, 4.5, -0.8), 12, 0.22, 2.5);
  look(56, 6.5, 15, 59, 4.5, -3, 50);
  setTop('JRAの売上のうち', '約10%が国へ', fade(t, 0.15, 3.6, 0.25), GOLD);
  return S;
}
function shot5(t) { // 北九州市：競艇と競輪で1年に50億円
  reset(); lift(80); coinFlow(t, V(78, 9, 4), V(85, 4.5, -0.8), 12, 0.22, 2.5);
  look(83, 7, 16, 85, 5, -3, 50);
  setTop('北九州市の一般会計へ（2024年度）', countUp2(t, 50) + '億円', fade(t, 0.15, 3.6, 0.25), BLUE);
  return S;
}
function countUp2(t, v) { return Math.round(v * ease(clamp((t - 0.3) / 1.4))); }
function shot6(t) { // そのうち約27億円が子どもの医療費に
  reset(); lift(110); coinFlow(t, V(94, 8, 3), V(110, 3, -0.8), 12, 0.22, 3);
  KID.userData.arms.forEach((a, i) => { a.rotation.x = -0.3 - Math.abs(Math.sin(t * 4)) * 0.3 * i; }); KID.position.y = Math.abs(Math.sin(t * 5)) * 0.12;
  look(112.5, 4.4, 12.5, 110, 3.8, -1, 50);
  setTop('子ども医療費に', '約' + countUp2(t, 27) + '億円', fade(t, 0.15, 3.8, 0.25), PINK);
  return S;
}
function shot7(t) { // 子どももいないおぢが、よその子の病院代を払っていた
  reset(); lift(150); boats(t, 1); cheer(t, 1); CROWD.forEach(p => p.visible = p === HERO);
  HERO.userData.arms[1].rotation.x = -1.4 + Math.sin(t * 5) * 0.4;
  coinFlow(t, V(HERO.position.x, 2.4, HERO.position.z), V(HERO.position.x + 6, 7, HERO.position.z - 8), 12, 0.22, 1.2);
  look(HERO.position.x - 2.4, 2.3, HERO.position.z + 3.6, HERO.position.x + 0.6, 2.0, HERO.position.z, 50);
  setTop('おぢの外れ券が', 'よその子の病院代に', fade(t, 0.15, 3.8, 0.25), PINK);
  return S;
}
function shot8(t) { // 本人は自覚ゼロ。外れた瞬間、舌打ちするだけ
  reset(); lift(150); boats(t, 1); CROWD.forEach(p => p.visible = p === HERO);
  const u = clamp((t - 0.9) / 0.3); HERO.userData.arms[1].rotation.x = -1.2 + u * 1.0; TICKETS[13].visible = t < 1.2;
  chi.position.set(HERO.position.x + 0.45, HERO.position.y + 2.25, HERO.position.z - 0.3); pop(chi, t, 1.1, 0.3, 0.7);
  look(HERO.position.x + 0.9, HERO.position.y + 1.9, HERO.position.z - 3.0, HERO.position.x, HERO.position.y + 1.6, HERO.position.z, 46);
  return S;
}
function shot9(t) { // ギャンブルが消えた日、自治体の金庫に穴があく
  reset(); lift(110); safe.visible = hole.visible = true; COINS.forEach((c, i) => { c.visible = i < 14; const u = ((t * 0.7 + i / 14) % 1); c.position.set(85 + Math.sin(i * 2) * 0.3, 0.9 - u * 0.9, 4.8 + u * 0.8); c.rotation.z = t * 1.5 + i; });
  pop(holeLab, t, 0.6, 0.35, 2.0);
  look(88, 3.6, 12, 85, 2.0, 3, 50);
  setTop('ギャンブルが消えた日', '財源に穴', fade(t, 0.15, 3.6, 0.25), RED);
  return S;
}
function shot10(t) { // 市役所から届くお知らせ
  reset(); lift(80); PARENT.userData.head.rotation.x = 0.5; PARENT2.userData.head.rotation.x = 0.5;
  const u = ease(clamp(t / 3.6)); look(NX, lerp(6.5, 5.2, u), lerp(2.6, 1.6, u), NX, 1.1, -0.1, 50);
  return S;
}
function shot11(t) { // その穴を埋めるのは、ギャンブルをしない人の税金
  reset(); lift(110); coinFlow(t, V(NX, 2.2, -2.6), V(NX + 10, 5, -10), 12, 0.22, 1.5);
  [PARENT, PARENT2].forEach(p => { p.userData.head.rotation.x = 0.35; p.userData.arms.forEach(a => a.rotation.x = -0.6); });
  taxLab.position.set(NX + 0.7, 4.0, -2.2); pop(taxLab, t, 0.5, 0.35, 2.3);
  look(NX + 1.2, 3.0, 4.6, NX + 0.6, 2.2, -2.4, 52);
  setTop('穴を埋めるのは', 'みんなの税金', fade(t, 0.15, 3.5, 0.25), RED);
  return S;
}
function shot12(t) { // 一方おぢは、浮いたお金でちょっといい焼肉
  reset(); lift(150); hemi.intensity = 0.8; smoke.set((t * 0.4) % 1); EATER.userData.arms[1].rotation.x = -1.1 + Math.sin(t * 4) * 0.4; EATER.position.y = Math.abs(Math.sin(t * 3)) * 0.04;
  yumLab.position.set(YX, 2.35, 0.4); pop(yumLab, t, 0.6, 0.35, 1.9);
  look(YX + 1.3, 2.3, -2.6, YX, 1.4, 0.5, 52);
  return S;
}
function shot13(t) { // 結果：損をしたのはおぢではなく納税者全員
  reset(); lift(110); coinFlow(t, V(NX, 2.2, -2.6), V(NX + 10, 6, -10), 12, 0.22, 1.5); [PARENT, PARENT2].forEach(p => { p.userData.head.rotation.x = 0.4; });
  const u = ease(clamp(t / 6)); look(NX + lerp(2, 4, u), lerp(4.5, 6, u), lerp(7, 10, u), NX + 0.4, 1.6, -1.2, 50);
  setTop('結果', '損したのは納税者全員', fade(t, 0.15, 5.9, 0.25), RED);
  return S;
}
function shot14(t) { // 外れ券を握りしめるおぢは、日本一まじめな納税者
  reset(); lift(120); boats(t, 1); CROWD.forEach(p => p.visible = p === HERO); HERO.userData.arms[1].rotation.x = -2.4;
  medal.position.set(HERO.position.x, HERO.position.y + 2.6, HERO.position.z - 0.3); pop(medal, t, 0.6, 0.35, 2.3);
  heroSp.set((t * 0.18) % 1);
  look(HERO.position.x + 1.0, HERO.position.y + 2.1, HERO.position.z - 4.4, HERO.position.x, HERO.position.y + 1.9, HERO.position.z, 50);
  setTop('外れ券を握りしめるおぢ', '納税者の鑑', fade(t, 0.3, 4.6, 0.25), GOLD);
  return S;
}
function shot15(t) { // 質問。最後は冒頭と同じ構図（ボートも舟券も消えたまま）
  reset(); lift(110); boats(t, 0); TICKETS.forEach(tk => tk.visible = false); cheer(t, 0);
  standCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.5, '日本中の競馬・競艇・競輪が、<br>この世から消えた。'],
  [6.6, 9.9, '世間は言う。身を滅ぼすおぢが<br>いなくなって、めでたし。'],
  [10.0, 13.4, 'でも、おぢが毎週負けていた<br>お金はどこへ行っていたのか。'],
  [13.5, 17.2, '実は、売上の一部は<br>国や自治体に入っていた。'],
  [17.3, 21.0, '北九州市では、<br>1年に50億円。'],
  [21.1, 25.0, 'そのうち約27億円が、<br>子どもの医療費に。'],
  [25.1, 29.0, '子どももいないおぢが、<br>よその子の病院代を払っていた。'],
  [29.1, 32.6, 'しかも本人は自覚ゼロ。<br>外れた瞬間、舌打ちするだけ。'],
  [32.7, 36.4, 'ギャンブルが消えた日、<br>自治体の金庫に穴があく。'],
  [36.5, 40.2, '市役所から届くお知らせ。<br>子ども医療費の助成、縮小。'],
  [40.3, 43.9, 'その穴を埋めるのは、<br>ギャンブルをしない人の税金。'],
  [44.0, 47.6, '一方おぢは、浮いたお金で<br>ちょっといい焼肉。'],
  [47.7, 53.6, '結果：損をしたのは、<br>おぢではなく納税者全員。'],
  [53.7, 58.4, '外れ券を握りしめるおぢは、<br>日本一まじめな納税者だった。'],
  [58.5, 61.4, '公営ギャンブル、<br>なくすべき？残すべき？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.5, f: shot3 },
  { a: 13.5, b: 17.3, f: shot4 }, { a: 17.3, b: 21.1, f: shot5 }, { a: 21.1, b: 25.1, f: shot6 }, { a: 25.1, b: 29.1, f: shot7 },
  { a: 29.1, b: 32.7, f: shot8 }, { a: 32.7, b: 36.5, f: shot9 }, { a: 36.5, b: 40.3, f: shot10 }, { a: 40.3, b: 44.0, f: shot11 },
  { a: 44.0, b: 47.7, f: shot12 }, { a: 47.7, b: 53.7, f: shot13 }, { a: 53.7, b: 58.5, f: shot14 }, { a: 58.5, b: 61.6, f: shot15 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0626',
    v2: true,
    hookLine: '競馬と競艇が、全部消えた。',
    series: 'もしも消えたら',
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしも競馬と競艇が消えたら？',
    titleHtml: 'もしも競馬と競艇が<br>消えたら？',
    mood: 'tension', seed: 626, hits: [0.5, 47.7, 53.7], risers: [44.0], impacts: [10.0, 13.5, 17.3, 21.1, 32.7, 40.3, 47.7, 53.7],
    sfx: [[0.5, 'poof'], [13.8, 'bubble'], [17.6, 'bubble'], [21.4, 'bubble'], [30.2, 'buzz'], [33.2, 'alarm'], [44.3, 'bubble'], [54.0, 'whoosh']],
    narr: { 'おぢ': 'おじ', '50億円': 'ごじゅうおくえん', '27億円': 'にじゅうななおくえん', '結果：': '結果、' },
    ask: '公営ギャンブル、なくすべき？残すべき？',
    caption: 'もしも日本中の競馬・競艇・競輪が消えたら？\n\n世間は言う。身を滅ぼすおぢがいなくなって、めでたし。\nでも、おぢが毎週負けていたお金はどこへ行っていたのか。\n実は売上の一部は国や自治体に入っていた。JRAは売上の10%を国へ。\nたとえば北九州市は、競艇と競輪の収益から1年に50億円。そのうち約27億円が子どもの医療費に。\n子どももいないおぢが、よその子の病院代を払っていた。しかも本人は自覚ゼロ。\n\n結果：損をしたのは、おぢではなく納税者全員。\n外れ券を握りしめるおぢは、日本一まじめな納税者だったのかもしれない。\n\n公営ギャンブル、なくすべき？残すべき？ コメントで教えて。\n\n※風刺ネタです。お知らせの紙は想像です\n出典：北九州市「公営競技の社会貢献」（2024年度 一般会計へ50億円・子ども医療費 約27億円）、東洋経済オンライン（JRAは売上の10%を国庫へ）',
    hashtags: ['もしもラボ', 'もしも', '競馬', '競艇', 'おぢ'],
    endStats: [['JRAの売上のうち国へ', '10%', '畜産振興・社会福祉'], ['北九州市の一般会計へ（2024年度）', '50億円', '競艇・競輪の収益'], ['そのうち子ども医療費', '約27億円', '北九州市']],
    sources: '出典：北九州市「公営競技の社会貢献」、東洋経済オンライン（2022年1月3日）',
  },
});
