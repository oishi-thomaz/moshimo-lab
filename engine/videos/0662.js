import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';
import { planTimes } from '../scenes/fitness.js';

// もしも公営ギャンブルが全部消えたら？（皮肉回・台本 S60・沼が消えたら・作り直し 0626）
// 2026/11/10 ゆうと承認（投稿サーバーで ok）。plan/remake.md の1：0626 はインスタ27.0万・TikTok 2,288（平均視聴17.1秒・おすすめ67%）
// 作り直しの入り：消えた→おぢが日曜の朝に行き場をなくす→嫁は大喜び→ベンチ・掃除機・最終レースの三段を先に。数字は20秒より後
// ギャンブルを見せる絵は入れない（馬・舟・自転車のレース・券売機・レースの画面は出さない。おぢの姿だけ）
// 数字（0626 で確認済み）：北九州市「公営競技の社会貢献」2024年度 競艇・競輪の収益から一般会計へ50億円・うち子ども医療費支給事業に約27億円
//  ※北九州市の実例として言う（全国一律の話にはしない）。お知らせの紙は想像（※風刺）

const GOLD = '#ffd27a', RED = '#ff6a6a', BLUE = '#7fd4ff', PINK = '#ff9ec7';
const S = new THREE.Scene();
S.background = new THREE.Color('#9fc8ee'); S.fog = new THREE.Fog(0x9fc8ee, 80, 260);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5a6a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(14, 30, 20); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 800), mat('#7f9a68', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);
function flat(w, d, color, x, z, ro = -0.8, y = 0.02) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = ro; S.add(m); return m; }
const OJI_OPT = { shirt: '#7a6a55', pants: '#3b3f4a' };
const mkOji = () => { const p = makeOji(rng(60), OJI_OPT); // 帽子
  const cap = box(0.46, 0.12, 0.44, mat('#2a3a5a')); cap.position.y = 0.5; p.userData.head.add(cap); const brim = box(0.44, 0.03, 0.2, mat('#2a3a5a')); brim.position.set(0, 0.45, 0.28); p.userData.head.add(brim); return p; };
// 耳の赤ペンと、手の新聞
function addPenPaper(p) {
  const pen = box(0.03, 0.03, 0.26, mat('#d62a2a')); pen.position.set(0.23, 0.3, 0.02); pen.rotation.x = 0.2; p.userData.head.add(pen);
  const c = document.createElement('canvas'); c.width = 256; c.height = 340; const g = c.getContext('2d'); g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, 256, 340); g.fillStyle = '#333'; for (let i = 0; i < 14; i++) g.fillRect(16, 20 + i * 22, 100 + (i * 37) % 110, 8); g.fillStyle = '#d62a2a'; g.beginPath(); g.arc(170, 120, 34, 0, 7); g.lineWidth = 6; g.strokeStyle = '#d62a2a'; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); paper.position.set(0, -0.62, 0.16); paper.rotation.x = -0.2; p.userData.arms[1].add(paper);
  return { pen, paper };
}

// ---------- A：日曜の朝の駅前（原点） ----------
flat(30, 20, '#c9c2b0', 0, 0);
const station = box(14, 6, 5, mat('#e4e0d6')); station.position.set(0, 3, -8); S.add(station);
const roofA = box(15, 0.4, 7, mat('#7a8796')); roofA.position.set(0, 6.2, -7.5); S.add(roofA);
const stSign = label('もしも台駅', { w: 900, size: 110, color: '#fff', bg: 'rgba(40,60,110,.96)', sx: 3.2 }); stSign.position.set(0, 5.2, -5.3); S.add(stSign);
const clockPole = new THREE.Group(); { const pl = box(0.15, 3.2, 0.15, mat('#5a5e66')); pl.position.y = 1.6; clockPole.add(pl); const cf = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 24), mat('#f4f4f2')); cf.rotation.x = Math.PI / 2; cf.position.y = 3.3; clockPole.add(cf); for (const [a, l] of [[0, 0.32], [2.2, 0.24]]) { const h = box(0.04, l, 0.02, mat('#222')); h.position.set(Math.sin(a) * l / 2, 3.3 + Math.cos(a) * l / 2, 0.07); h.rotation.z = -a; clockPole.add(h); } } clockPole.position.set(-4.5, 0, -1); S.add(clockPole);
const PASS = []; { const r = rng(7); for (let i = 0; i < 6; i++) { const p = r() < 0.5 ? makeWoman({ shirt: ['#9fc7a8', '#e9b8c8', '#c9a8d8'][i % 3] }) : makeMan({ shirt: ['#4f6a8f', '#d97a3a', '#59606e'][i % 3] }); S.add(p); PASS.push({ p, x0: -10 + r() * 20, z: -6.5 + r() * 3, sp: (r() < 0.5 ? -1 : 1) * (0.8 + r() * 0.6) }); } }
const A_OJI = mkOji(); S.add(A_OJI); const PP = addPenPaper(A_OJI);
const sparkA = makeSparkles(160, 0.2, 0xfff2c0); S.add(sparkA.points);
const pon = label('ポン', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.7 }); S.add(pon);
const nichi = label('日曜の朝', { w: 640, size: 110, color: '#fff', bg: 'rgba(60,110,200,.95)', sx: 1.2 }); S.add(nichi);
const ikiba = label('行き場がない', { w: 768, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(ikiba);

// ---------- B：家（x=60）：玄関前の嫁・リビング（掃除機・テレビ） ----------
const BX = 60;
const room = makeRoom({ w: 9, d: 7, wall: '#efe6d6', floor: '#b48a5e' }); room.position.set(BX, 0, 0); room.userData.rw.visible = false; S.add(room);
const sofa = new THREE.Group(); { const b = box(2.4, 0.45, 0.9, mat('#6a7fa0')); b.position.y = 0.32; sofa.add(b); const bk = box(2.4, 0.6, 0.25, mat('#6a7fa0')); bk.position.set(0, 0.75, -0.35); sofa.add(bk); } sofa.position.set(BX - 0.5, 0, 1.2); S.add(sofa);
const tv = new THREE.Group(); { const st = box(1.6, 0.5, 0.45, mat('#5a4030')); st.position.y = 0.25; tv.add(st); const sc = box(1.7, 1.0, 0.08, mat('#15161c')); sc.position.y = 1.05; tv.add(sc); } tv.position.set(BX - 0.5, 0, -3.2); S.add(tv);
const tvC = document.createElement('canvas'); tvC.width = 400; tvC.height = 230; const tvT = new THREE.CanvasTexture(tvC); tvT.colorSpace = THREE.SRGBColorSpace;
const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.88), new THREE.MeshBasicMaterial({ map: tvT })); tvScr.position.set(BX - 0.5, 1.05, -3.15); S.add(tvScr);
let tvKey = ''; function tvDraw(mode, t) { const k = mode + (mode === 'snow' ? Math.floor(t * 12) : ''); if (k === tvKey) return; tvKey = k; const g = tvC.getContext('2d');
  if (mode === 'snow') { const r = rng(Math.floor(t * 12) + 3); for (let y = 0; y < 230; y += 10) for (let x = 0; x < 400; x += 10) { const v = Math.floor(80 + r() * 150); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 10, 10); } g.fillStyle = 'rgba(20,24,34,.85)'; g.fillRect(60, 80, 280, 70); g.fillStyle = '#fff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('放送はありません', 200, 116); }
  tvT.needsUpdate = true; }
const vac = new THREE.Group(); { const b = box(0.35, 0.22, 0.45, mat('#d84a6a')); b.position.y = 0.12; vac.add(b); const pipe = box(0.05, 1.0, 0.05, mat('#9aa0aa')); pipe.position.set(0, 0.6, 0.25); pipe.rotation.x = 0.5; vac.add(pipe); const head = box(0.5, 0.06, 0.16, mat('#3a3a40')); head.position.set(0, 0.04, 0.6); vac.add(head); } S.add(vac);
const door = box(1.1, 2.2, 0.08, mat('#6a4a30')); door.position.set(BX + 3.0, 1.1, -3.44); S.add(door);
const B_OJI = mkOji(); S.add(B_OJI);
const YOME = makeWoman({ shirt: '#e9b8c8', hair: '#5a3a28', pants: '#4a4f60' }); S.add(YOME);
const daiyorokobi = label('嫁は大喜び', { w: 768, size: 110, color: '#fff', bg: 'rgba(240,100,150,.96)', sx: 1.5 }); S.add(daiyorokobi);
const kyuryo = label('給料', { w: 400, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.8 }); S.add(kyuryo);
const jama = label('ジャマ', { w: 400, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(jama);
const saishu = label('最終レース…', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.3 }); S.add(saishu);
const winLight = new THREE.PointLight(0xffb070, 0, 12, 1.4); winLight.position.set(BX, 2.8, 1.5); S.add(winLight);

// ---------- C：公園のベンチ（x=-60） ----------
const PX = -60;
flat(16, 12, '#9a8a6a', PX, 0);
const bench = new THREE.Group(); { const st = box(2.2, 0.1, 0.6, mat('#8a5a34')); st.position.y = 0.48; bench.add(st); const bk = box(2.2, 0.5, 0.08, mat('#8a5a34')); bk.position.set(0, 0.8, -0.28); bench.add(bk); for (const x of [-0.95, 0.95]) { const l = box(0.1, 0.48, 0.5, mat('#3a3a40')); l.position.set(x, 0.24, 0); bench.add(l); } } bench.position.set(PX, 0, 0); S.add(bench);
for (let i = 0; i < 5; i++) { const tr = new THREE.Group(); const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 8), mat('#6a4a30')); tk.position.y = 1; tr.add(tk); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), mat('#5a9a5a')); lf.position.y = 2.6; tr.add(lf); tr.position.set(PX - 6 + i * 3, 0, -4 - (i % 2) * 2); S.add(tr); }
const pigeon = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat('#8a8e9a')); b.scale.set(1, 0.8, 1.4); b.position.y = 0.14; pigeon.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#5a6070')); h.position.set(0, 0.26, 0.16); pigeon.add(h); } pigeon.position.set(PX + 1.2, 0, 1.0); S.add(pigeon);
const C_OJI = mkOji(); S.add(C_OJI);
const kara = label('からっぽ', { w: 640, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.1 }); S.add(kara);

// ---------- D：お金の行き先（x=120〜170）：北九州市・子ども医療費 ----------
function bldg(x, z, w, h, d, color, name, nameBg) { const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g); const b = box(w, h, d, mat(color)); b.position.y = h / 2; g.add(b);
  for (let i = 0; i < Math.floor(w / 1.4); i++) for (let j = 0; j < Math.floor((h - 1.2) / 1.3); j++) { const wi = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.75), new THREE.MeshBasicMaterial({ color: '#cfe6ff' })); wi.position.set(-w / 2 + (i + 0.6) * 1.4, 1.4 + j * 1.3, d / 2 + 0.02); g.add(wi); }
  const sg = label(name, { w: 1024, size: 100, color: '#fff', bg: nameBg, sx: Math.min(w, 5.2) }); sg.position.set(0, h + 1.0, d / 2); g.add(sg); return g; }
flat(80, 30, '#c9c4b8', 145, 0);
const CITY = bldg(130, -4, 8, 9, 6, '#cfd6de', '北九州市', 'rgba(30,110,170,.92)');
const HOSP = bldg(155, -4, 9, 6, 6, '#f6f4f0', '子ども医療費', 'rgba(220,90,120,.92)');
const cross = box(1.4, 0.4, 0.1, mat('#e04050')); cross.position.set(155, 4.8, -0.9); S.add(cross); const cross2 = box(0.4, 1.4, 0.1, mat('#e04050')); cross2.position.set(155, 4.8, -0.9); S.add(cross2);
const MOM = makeWoman({ shirt: '#9fc7a8' }); MOM.position.set(154, 0, 1.2); S.add(MOM);
const KID = makeMan({ shirt: '#f2c14e', hair: '#3a2620', scale: 0.55 }); KID.position.set(155.2, 0, 1.4); S.add(KID);
const D_OJI = mkOji(); S.add(D_OJI);
const coinG = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 18), coinM = mat('#e8b84a');
const COINS = []; for (let i = 0; i < 24; i++) { const c = new THREE.Mesh(coinG, coinM); c.rotation.x = Math.PI / 2; S.add(c); COINS.push(c); }
function coinFlow(t, from, to, n = 12, speed = 0.22, arc = 3) { COINS.forEach((c, i) => { c.visible = i < n; if (i >= n) return; const u = ((t * speed + i / n) % 1); c.position.set(lerp(from.x, to.x, u), lerp(from.y, to.y, u) + Math.sin(u * Math.PI) * arc, lerp(from.z, to.z, u)); c.rotation.z = t * 1.5 + i; }); }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const nazo = label('どこへ？', { w: 512, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.0 }); S.add(nazo);

// ---------- E：お知らせの紙（x=-120） ----------
const NX = -120;
flat(12, 10, '#c8a878', NX, 0);
const desk = box(6, 0.3, 4, mat('#b48a5e')); desk.position.set(NX, 1.0, 0); S.add(desk);
const noticeC = document.createElement('canvas'); noticeC.width = 720; noticeC.height = 1000;
{ const g = noticeC.getContext('2d'); g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 720, 1000); g.fillStyle = '#222'; g.textAlign = 'center'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText('お知らせ', 360, 120);
  g.font = '800 48px "Noto Sans CJK JP", sans-serif'; ['子ども医療費の', '助成を縮小します'].forEach((s, i) => g.fillText(s, 360, 290 + i * 80));
  g.font = '700 38px "Noto Sans CJK JP", sans-serif'; g.fillText('財源が不足したため', 360, 520); g.font = '700 34px "Noto Sans CJK JP", sans-serif'; g.fillText('〇〇市 子育て支援課', 360, 900); g.strokeStyle = '#d23a3a'; g.lineWidth = 8; g.strokeRect(60, 210, 600, 210); }
const noticeT = new THREE.CanvasTexture(noticeC); noticeT.colorSpace = THREE.SRGBColorSpace;
const notice = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.6), new THREE.MeshBasicMaterial({ map: noticeT })); notice.rotation.x = -Math.PI / 2; notice.position.set(NX, 1.17, 0); S.add(notice);
const PARENT = makeWoman({ shirt: '#e9e4da' }); PARENT.position.set(NX - 0.4, 0, -2.6); S.add(PARENT);
const PARENT2 = makeMan({ shirt: '#59606e' }); PARENT2.position.set(NX + 1.0, 0, -2.6); S.add(PARENT2);
const KID2 = makeMan({ shirt: '#8fd0f0', hair: '#3a2620', scale: 0.55 }); KID2.position.set(NX + 0.3, 0, -2.4); S.add(KID2);
const nozei = label('ギャンブルをしない納税者', { w: 1100, size: 92, color: '#fff', bg: 'rgba(90,90,100,.95)', sx: 4.2 }); S.add(nozei);

// ---------- 外れ券 → 診察券（どのショットでも使える札） ----------
function makeCard(title, sub, col) {
  const c = document.createElement('canvas'); c.width = 900; c.height = 560; const g = c.getContext('2d');
  g.fillStyle = '#fbfaf6'; g.beginPath(); g.roundRect(8, 8, 884, 544, 40); g.fill(); g.fillStyle = col; g.fillRect(8, 8, 884, 150);
  g.fillStyle = '#fff'; g.font = '900 110px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, 450, 88);
  g.fillStyle = '#333'; g.font = '800 64px "Noto Sans CJK JP", sans-serif'; sub.forEach((s, i) => g.fillText(s, 450, 280 + i * 100));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); sp.renderOrder = 8; sp.scale.set(2.0, 2.0 * 560 / 900, 1); return sp;
}
const HAZURE = makeCard('外れ券', ['ハズレ', 'ハズレ'], '#7a7e88'); S.add(HAZURE);
const SHINSATSU = makeCard('診察券', ['よその子', '小児科'], '#e0607a'); S.add(SHINSATSU);
const sparkK = makeSparkles(140, 0.22, 0xffd0e0); S.add(sparkK.points);

const PEOPLE = [A_OJI, B_OJI, C_OJI, D_OJI, YOME];
const LABELS = [pon, nichi, ikiba, daiyorokobi, kyuryo, jama, saishu, kara, nazo, nozei];
function poseReset(p) { const u = p.userData; u.arms.forEach(a => a.rotation.set(0, 0, 0)); u.legs.forEach(l => l.rotation.set(0, 0, 0)); u.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.y = 0; }
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkK.set(0); COINS.forEach(c => c.visible = false); HAZURE.visible = SHINSATSU.visible = false;
  PP.pen.visible = PP.paper.visible = false; PASS.forEach(o => o.p.visible = false);
  A_OJI.position.set(0.3, 0, 1.2); B_OJI.position.set(BX + 1.2, 0, 0.6); YOME.position.set(BX - 1.2, 0, 0.6); C_OJI.position.set(PX, 0, 0.2); D_OJI.position.set(140, 0, 3); D_OJI.visible = false;
  vac.visible = false; sofa.visible = false; winLight.intensity = 0; hemi.intensity = 1.2; S.background.set('#9fc8ee'); el.flash.style.opacity = 0;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function passers(t) { PASS.forEach((o, i) => { o.p.visible = true; const x = ((o.x0 + t * o.sp + 30) % 20 + 20) % 20 - 10; o.p.position.set(x, 0, o.z); o.p.rotation.y = o.sp > 0 ? Math.PI / 2 : -Math.PI / 2; const ph = t * 7 + i; o.p.userData.legs[0].rotation.x = Math.sin(ph) * 0.5; o.p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5; }); }
const TP = 0.45;
function ekiCam(u = 0) { look(lerp(1.5, 1.2, u), 1.9, lerp(6.6, 6.0, u), 0.3, 2.05, 1.0, 50); }
function shot0(t) { // 0秒＝サムネ：日曜の朝の駅前、おぢの耳の赤ペンと新聞が、ポンと消える
  reset(); lift(170); passers(t); A_OJI.rotation.y = 0.1; A_OJI.userData.arms[1].rotation.set(-1.2, 0, 0.15); A_OJI.userData.head.rotation.x = 0.25;
  PP.pen.visible = PP.paper.visible = t < TP;
  if (t > TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.1 ? 0.35 : 0; say(pon, t, TP, 1.15, 2.4, 1.2, 0.7); A_OJI.userData.arms[1].rotation.set(-1.0, 0, 0.15); A_OJI.userData.head.rotation.x = -0.05; }
  ekiCam(ease(clamp(t / 3)));
  return S;
}
// sparkA.init はショットの外で1回だけ呼ぶ（チラつき防止）
sparkA.init([[0.55, 3.3, 1.2], [0.62, 1.3, 1.6]], 0.35, 0.9);
function sEki(t, d) { // おぢは駅前で、行き場をなくして立ち尽くす。
  reset(); lift(150); passers(t + 3); A_OJI.userData.head.rotation.y = Math.sin(t * 1.8) * 0.6; A_OJI.userData.arms.forEach(a => a.rotation.set(0.05, 0, 0));
  if (t > 1.2) say(ikiba, t, 1.2, 0.3, 2.7, 1.2, 1.25);
  const u = ease(clamp(t / d)); look(lerp(2.5, 4.0, u), lerp(2.2, 3.0, u), lerp(7, 10, u), 0.3, 1.4, 0.5, 50);
  return S;
}
function homeCam(u = 0) { look(BX + lerp(0.6, 0.2, u), 2.1, lerp(6.6, 6.0, u), BX, 1.3, -0.4, 50); }
function sYome(t) { // 嫁は大喜び。
  reset(); lift(150); B_OJI.visible = false; YOME.position.set(BX, 0, 0.4); const k = t * 6; YOME.userData.arms[0].rotation.set(0, 0, -2.6 + Math.sin(k) * 0.3); YOME.userData.arms[1].rotation.set(0, 0, 2.6 - Math.sin(k) * 0.3); YOME.position.y = Math.abs(Math.sin(t * 5)) * 0.15;
  say(daiyorokobi, t, 0.3, BX, 2.75, 0.4, 1.5);
  homeCam(ease(clamp(t / 3)));
  return S;
}
function sKyuryo(t) { // これで給料が家に帰ってくる。
  reset(); lift(150); B_OJI.visible = false; YOME.position.set(BX - 0.6, 0, 0.4); YOME.rotation.y = 0.5; YOME.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0));
  coinFlow(t, V(BX + 3.0, 1.6, -3.0), V(BX - 0.4, 1.3, 0.8), 10, 0.35, 1.0);
  say(kyuryo, t, 0.3, BX + 1.8, 2.6, -1.0, 0.8);
  homeCam(0.5);
  return S;
}
function sBench(t) { // 午前10時。公園のベンチで、空っぽの手を見つめる。
  reset(); lift(150); C_OJI.position.set(PX, -0.39 * C_OJI.scale.y + 0.1, 0.1); C_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); C_OJI.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); C_OJI.userData.head.rotation.x = 0.55;
  pigeon.position.x = PX + 1.2 + Math.sin(t) * 0.2; pigeon.children[1].position.y = 0.26 - Math.abs(Math.sin(t * 4)) * 0.08;
  if (t > 1.3) say(kara, t, 1.3, PX + 0.8, 2.4, 0.3, 1.05);
  setHud('午前', '10:00', 1);
  look(PX + 1.2, 1.7, 4.2, PX, 1.1, 0.1, 50);
  return S;
}
function sIbasho(t) { // 正午。家に帰ると、居場所がなくて
  reset(); lift(150); const k = clamp(t / 1.6); B_OJI.position.set(lerp(BX + 3.0, BX + 1.4, ease(k)), 0, lerp(-2.9, 0.4, ease(k))); B_OJI.rotation.y = Math.atan2(-1.6, 3.3); if (k < 1) { const ph = t * 7; B_OJI.userData.legs[0].rotation.x = Math.sin(ph) * 0.4; B_OJI.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4; } else B_OJI.rotation.y = -0.4;
  YOME.position.set(BX - 1.3, 0, 0.6); YOME.rotation.y = 0.6; YOME.userData.head.rotation.x = -0.05;
  setHud('正午', '12:00', 1); homeCam(0.3);
  return S;
}
function sSouji(t) { // 掃除機をかけられる。
  reset(); lift(150); vac.visible = true; const x = BX + 0.2 + Math.sin(t * 2.4) * 0.6; vac.position.set(x, 0, 0.0); vac.rotation.y = 0;
  YOME.position.set(x, 0, -0.9); YOME.rotation.y = 0; YOME.userData.arms[1].rotation.set(-0.7, 0, 0);
  const dodge = clamp((t - 0.4) / 0.4); B_OJI.position.set(BX + 0.8 + dodge * 1.0, dodge * 0.2 * Math.abs(Math.sin(t * 9)), 0.8); B_OJI.rotation.y = -0.5; B_OJI.userData.legs[0].rotation.x = -0.6 * dodge; B_OJI.userData.arms.forEach(a => a.rotation.set(0, 0, 0.5 * dodge));
  if (t > 0.6) say(jama, t, 0.6, BX - 0.4, 2.4, -0.4, 0.75);
  setHud('正午', '12:00', 1); homeCam(0.4);
  return S;
}
function sTV(t) { // 夕方。テレビの前で、
  reset(); lift(150); sofa.visible = true; hemi.intensity = 0.8; winLight.intensity = 6; B_OJI.position.set(BX - 0.5, 0, 1.3); B_OJI.rotation.y = Math.PI; YOME.visible = false; B_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); B_OJI.position.y = -0.39 * B_OJI.scale.y + 0.32;
  tvDraw('snow', t);
  setHud('夕方', '17:00', 1); look(BX + 0.9, 2.3, 5.2, BX - 0.5, 1.0, -1.2, 50);
  return S;
}
function sMatsu(t) { // 来るはずのない最終レースを待つ。
  reset(); lift(150); sofa.visible = true; hemi.intensity = 0.75; winLight.intensity = 6; B_OJI.position.set(BX - 0.5, 0, 1.3); B_OJI.rotation.y = Math.PI; YOME.visible = false; B_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); B_OJI.position.y = -0.39 * B_OJI.scale.y + 0.32; B_OJI.userData.arms[1].rotation.set(-1.4, 0, 0);
  tvDraw('snow', t + 5); if (t > 1.0) say(saishu, t, 1.0, BX - 0.5, 2.1, -2.0, 1.25);
  const u = ease(clamp(t / 3)); look(BX + lerp(3.4, 3.0, u), 1.8, lerp(0.4, -0.2, u), BX - 0.5, 1.0, -0.9, 50);
  setHud('夕方', '17:00', 1);
  return S;
}
function sDoko(t) { // でも、おぢが毎週負けていたお金は、どこへ行っていたのか。
  reset(); lift(150); A_OJI.position.set(0.3, 0, 1.2); A_OJI.userData.head.rotation.x = -0.1;
  coinFlow(t, V(0.3, 1.6, 1.4), V(8, 7, -10), 12, 0.25, 1.5);
  if (t > 1.2) say(nazo, t, 1.2, 1.8, 3.2, 0, 1.0);
  look(2.6, 2.2, 6.8, 0.8, 1.8, 0, 50);
  return S;
}
function sKita(t, d) { // たとえば北九州市。
  reset(); lift(80); const u = ease(clamp(t / d)); look(130, lerp(8, 7, u), lerp(20, 16, u), 130, 5, -3, 50);
  return S;
}
function s50(t, d) { // 競艇と競輪から、1年に50億円が市の財布へ。
  reset(); lift(80); coinFlow(t, V(123, 9, 4), V(130, 4.5, -0.8), 12, 0.22, 2.5);
  look(128, 7, 16, 130, 5, -3, 50);
  setTop('北九州市の一般会計へ（2024年度）', Math.round(50 * ease(clamp((t - 0.3) / 1.4))) + '億円', fade(t, 0.15, d, 0.25), BLUE);
  return S;
}
function s27(t, d) { // そのうち約27億円が、子どもの医療費に。
  reset(); lift(110); coinFlow(t, V(139, 8, 3), V(155, 3, -0.8), 12, 0.22, 3);
  KID.userData.arms.forEach((a, i) => { a.rotation.x = -0.3 - Math.abs(Math.sin(t * 4)) * 0.3 * i; }); KID.position.y = Math.abs(Math.sin(t * 5)) * 0.12;
  look(157.5, 4.4, 12.5, 155, 3.8, -1, 50);
  setTop('子ども医療費に（2024年度）', '約' + Math.round(27 * ease(clamp((t - 0.3) / 1.4))) + '億円', fade(t, 0.15, d, 0.25), PINK);
  return S;
}
function sYoso(t, d) { // 子どももいないおぢが、よその子の病院代を払っていた。
  reset(); lift(150); D_OJI.visible = true; D_OJI.position.set(152.2, 0, 2.6); D_OJI.rotation.y = 0.8; D_OJI.userData.head.rotation.y = -0.4;
  coinFlow(t, V(152.3, 1.6, 2.7), V(155, 1.2, 1.4), 8, 0.4, 0.8);
  look(153.4, 2.4, 9.0, 153.4, 1.5, 1.6, 50);
  return S;
}
function sOshirase(t, d) { // 消えた日、市役所から届くお知らせ。
  reset(); lift(80); [PARENT, PARENT2].forEach(p => p.userData.head.rotation.x = 0.5); KID2.userData.head.rotation.x = 0.3;
  const u = ease(clamp(t / d)); look(NX, lerp(6.5, 5.6, u), lerp(2.6, 1.8, u), NX, 1.1, -0.1, 50);
  return S;
}
function sShukusho(t, d) { // 子ども医療費の助成、縮小。
  reset(); lift(80); [PARENT, PARENT2].forEach(p => p.userData.head.rotation.x = 0.5);
  const u = ease(clamp(t / d)); look(NX, lerp(5.4, 4.6, u), lerp(1.6, 1.0, u), NX, 1.1, -0.2, 50);
  if (t > 0.3 && t < 0.4) el.flash.style.opacity = 0.25;
  return S;
}
function sKekka(t, d) { // 結果：損をしたのは、おぢではなく、
  reset(); lift(260); A_OJI.position.set(0.3, 0, 1.2); A_OJI.userData.head.rotation.y = Math.sin(t * 1.5) * 0.4; passers(t);
  const u = ease(clamp(t / d)); look(lerp(2.6, 3.4, u), 2.0, lerp(6.6, 8.0, u), 0.3, 1.5, 0.8, 50);
  return S;
}
function sNozei(t, d) { // ギャンブルをしない納税者。
  reset(); lift(150); [PARENT, PARENT2].forEach(p => { p.userData.head.rotation.x = 0.35; p.userData.arms.forEach(a => a.rotation.x = -0.6); });
  coinFlow(t, V(NX, 2.2, -2.6), V(NX + 10, 5, -10), 12, 0.22, 1.5);
  nozei.position.set(NX + 0.3, 3.7, -2.2); pop(nozei, t, 0.3, 0.35, 2.6);
  look(NX + 1.2, 3.2, 5.8, NX + 0.3, 2.2, -2.4, 52);
  return S;
}
function cardCam() { look(PX + 1.2, 1.7, 4.2, PX, 1.1, 0.1, 50); }
function sShinsatsu(t, d) { // おぢの外れ券は、よその子の診察券
  reset(); lift(60); C_OJI.position.set(PX, -0.39 * C_OJI.scale.y + 0.1, 0.1); C_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); C_OJI.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); C_OJI.userData.head.rotation.x = 0.45;
  const sw = 1.3; const k = clamp((t - sw) / 0.3);
  HAZURE.visible = k < 0.5; SHINSATSU.visible = k >= 0.5; const s = 1 - Math.abs(k - 0.5) * 2; const card = k < 0.5 ? HAZURE : SHINSATSU; card.position.set(PX + 0.2, 2.05, 0.6); card.scale.set(1.5 * (1 - s * 0.9), 1.5 * 560 / 900, 1);
  if (t > sw) sparkK.set(clamp((t - sw) / 1.4));
  cardCam();
  return S;
}
sparkK.init([[PX + 0.2, 2.05, 0.6]], 0.8, 1.2);
function sKamo(t, d) { // だったのかもしれない。
  reset(); lift(60); C_OJI.position.set(PX, -0.39 * C_OJI.scale.y + 0.1, 0.1); C_OJI.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); C_OJI.userData.arms.forEach(a => a.rotation.set(-1.0, 0, 0)); C_OJI.userData.head.rotation.x = 0.45;
  SHINSATSU.visible = true; SHINSATSU.position.set(PX + 0.2, 2.05 + t * 0.08, 0.6); SHINSATSU.scale.set(1.5, 1.5 * 560 / 900, 1);
  const u = ease(clamp(t / d)); look(PX + lerp(1.2, 2.0, u), lerp(1.7, 2.1, u), lerp(4.2, 5.4, u), PX, 1.2, 0.1, 50);
  return S;
}
function sAsk(t) { // 公営ギャンブル、なくすべき？残すべき？（冒頭と同じ構図。赤ペンと新聞は消えたまま）
  reset(); lift(220); passers(t + 9); A_OJI.rotation.y = 0.1; A_OJI.userData.arms[1].rotation.set(-1.0, 0, 0.15);
  ekiCam(0);
  return S;
}

const NARR = { 'おぢ': 'おじ', '嫁': 'よめ', '午前10時': 'ごぜんじゅうじ', '正午': 'しょうご', '居場所': 'いばしょ', '北九州市': 'きたきゅうしゅうし', '競艇': 'きょうてい', '競輪': 'けいりん', '1年に': 'いちねんに', '50億円': 'ごじゅうおくえん', '27億円': 'にじゅうななおくえん', '市役所': 'しやくしょ', '助成': 'じょせい', '縮小': 'しゅくしょう', '結果：': '結果、', '納税者': 'のうぜいしゃ', '外れ券': 'はずれけん', '診察券': 'しんさつけん', '公営': 'こうえい', '最終レース': 'さいしゅうレース', '立ち尽くす': 'たちつくす', '病院代': 'びょういんだい' };
const P = planTimes([
  ['おぢは駅前で、行き場を<br>なくして立ち尽くす。', sEki],
  ['嫁は大喜び。', sYome],
  ['これで給料が<br>家に帰ってくる。', sKyuryo],
  ['午前10時。公園のベンチで、<br>空っぽの手を見つめる。', sBench],
  ['正午。家に帰ると、<br>居場所がなくて', sIbasho],
  ['掃除機をかけられる。', sSouji],
  ['夕方。テレビの前で、', sTV],
  ['来るはずのない<br>最終レースを待つ。', sMatsu],
  ['でも、おぢが毎週負けていた<br>お金は、どこへ行っていたのか。', sDoko],
  ['たとえば北九州市。', sKita],
  ['競艇と競輪から、1年に<br>50億円が市の財布へ。', s50],
  ['そのうち約27億円が、<br>子どもの医療費に。', s27],
  ['子どももいないおぢが、<br>よその子の病院代を払っていた。', sYoso],
  ['消えた日、市役所から<br>届くお知らせ。', sOshirase],
  ['子ども医療費の助成、縮小。', sShukusho],
  ['結果：損をしたのは、<br>おぢではなく、', sKekka],
  ['ギャンブルをしない納税者。', sNozei],
  ['おぢの外れ券は、<br>よその子の診察券', sShinsatsu],
  ['だったのかもしれない。', sKamo],
  ['公営ギャンブル、<br>なくすべき？残すべき？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0662',
    v2: true,
    trial: true,
    tt: 'main',
    remakeOf: '0626',
    hookLine: '日曜の朝、おぢの耳の赤ペンと新聞が、ポンと消える。',
    series: '沼が消えたら',
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしも公営ギャンブルが全部消えたら？',
    titleHtml: 'もしも公営<br>ギャンブルが<br>全部消えたら？',
    mood: 'tension', seed: 662, hits: [TP, P.at(15), P.at(17, 1.3)], risers: [P.at(8)], impacts: [P.at(10, 0.3), P.at(11, 0.3), P.at(14, 0.3), P.at(16, 0.3), P.at(17, 1.3)],
    sfx: [[TP, 'poof'], [P.at(1, 0.3), 'bubble'], [P.at(2, 0.3), 'bubble'], [P.at(5, 0.6), 'buzz'], [P.at(7, 1.0), 'meter', 0.3], [P.at(8, 0.4), 'whoosh'], [P.at(10, 0.4), 'bubble'], [P.at(11, 0.4), 'bubble'], [P.at(14, 0.3), 'alarm'], [P.at(17, 1.3), 'poof']],
    narr: NARR,
    ask: '公営ギャンブル、なくすべき？残すべき？',
    caption: 'もしも公営ギャンブルが全部消えたら？\n\nおぢは駅前で、行き場をなくして立ち尽くす。\n嫁は大喜び。これで給料が家に帰ってくる。\n午前10時。公園のベンチで、空っぽの手を見つめる。\n正午。家に帰ると、居場所がなくて掃除機をかけられる。\n夕方。テレビの前で、来るはずのない最終レースを待つ。\nでも、おぢが毎週負けていたお金は、どこへ行っていたのか。\nたとえば北九州市。競艇と競輪から、1年に50億円が市の財布へ。そのうち約27億円が、子どもの医療費に。\n子どももいないおぢが、よその子の病院代を払っていた。\n消えた日、市役所から届くお知らせ。子ども医療費の助成、縮小。\n\n結果：損をしたのは、おぢではなく、ギャンブルをしない納税者。\nおぢの外れ券は、よその子の診察券だったのかもしれない。\n\n公営ギャンブル、なくすべき？残すべき？ コメントで教えて。\n\n※風刺ネタです。公営ギャンブルが消えるのは、もしもの設定です。お知らせの紙は想像です。登場する人物は架空です\n出典：北九州市「公営競技の社会貢献」（2024年度 一般会計へ50億円・子ども医療費 約27億円）',
    hashtags: ['もしもラボ', 'もしも', '公営ギャンブル', 'おぢ', '北九州市'],
    endStats: [['北九州市の一般会計へ（2024年度）', '50億円', '競艇・競輪の収益'], ['そのうち子ども医療費', '約27億円', '北九州市'], ['おぢの外れ券の正体', 'よその子の診察券', 'かもしれない']],
    sources: '出典：北九州市「公営競技の社会貢献」（2024年度）',
  },
});
