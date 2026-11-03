import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makeQ } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, hudTime, el } from '../story.js';
import { makeWoman, label, pop } from '../satire-kit.js';

// もしも職場からお局が消えたら？（皮肉回・台本 S16・社会の消えたら）
// 2026/11/03 ゆうと承認。元ネタ：ガルちゃんで定期的に立つ 職場のお局がしんどい トピ
// 数字（裏取り済み）：
//  役員を除く女性の雇用者のうち、非正規の職員・従業員の割合 53.2%（2023年平均。男性は22.6%）
//  総務省「労働力調査（詳細集計）」（厚生労働省「令和5年版 働く女性の実情」の付表） https://www.mhlw.go.jp/content/11909000/001388697.pdf
//  ※2025年は約52%（労働経済白書 令和8年版の人数から計算）。台本どおり 2023年の 53.2% を年つきで使う

const GOLD = '#ffd27a', RED = '#ff5a5a', PINK = '#ff7ab8', MINT = '#7ff0c8';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2e3a'); S.fog = new THREE.Fog(0x2a2e3a, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4a5a, 1.2); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#30343e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; p.rotation.set(0, 0, 0); }
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = -0.36; p.userData.arms.forEach(a => a.rotation.x = -0.9); }
// カーディガンと眼鏡（お局の印。若手にも後で付ける）
function dress(p, col = '#c8b48a') {
  const g = new THREE.Group(); p.add(g);
  for (const s of [-1, 1]) { const f = box(0.2, 0.64, 0.3, mat(col)); f.position.set(s * 0.17, 1.17, 0.0); g.add(f); }
  for (const a of p.userData.arms) { const sl = box(0.16, 0.5, 0.19, mat(col)); sl.position.y = -0.25; a.add(sl); sl.userData.card = true; }
  const gl = new THREE.Group(); for (const s of [-1, 1]) { const l = box(0.13, 0.07, 0.02, mat('#202020')); l.position.set(s * 0.085, 0.27, 0.205); gl.add(l); } const br = box(0.06, 0.02, 0.02, mat('#202020')); br.position.set(0, 0.29, 0.205); gl.add(br); p.userData.head.add(gl);
  const set = (on) => { g.visible = on; gl.visible = on; p.userData.arms.forEach(a => a.children.forEach(c => { if (c.userData.card) c.visible = on; })); };
  return set;
}

// ---------- A：オフィス（原点） ----------
const ofloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), mat('#7d8798', { depthWrite: false })); ofloor.rotation.x = -Math.PI / 2; ofloor.position.set(0, 0.01, 0); ofloor.renderOrder = -0.8; S.add(ofloor);
const wall = box(16, 3.6, 0.2, mat('#e6e9ed')); wall.position.set(0, 1.8, -5.2); S.add(wall);
const wallL = box(0.2, 3.6, 12, mat('#dfe3e8')); wallL.position.set(-7.0, 1.8, 0.8); S.add(wallL);
const winB = box(5, 1.4, 0.05, mat('#9fc8e8')); winB.position.set(2.0, 2.1, -5.08); S.add(winB);
function desk(x, z, ry = 0) {
  const g = new THREE.Group(); const top = box(1.5, 0.06, 0.8, mat('#d8d2c6')); top.position.y = 0.74; g.add(top);
  const leg = box(1.4, 0.7, 0.05, mat('#9a9aa2')); leg.position.set(0, 0.36, -0.35); g.add(leg);
  const mon = box(0.62, 0.42, 0.05, mat('#20242c')); mon.position.set(0, 1.04, -0.22); g.add(mon); const st = box(0.08, 0.14, 0.08, mat('#20242c')); st.position.set(0, 0.84, -0.22); g.add(st);
  const chair = new THREE.Group(); const seat = box(0.5, 0.08, 0.5, mat('#3a4050')); seat.position.y = 0.46; chair.add(seat); const back = box(0.5, 0.6, 0.08, mat('#3a4050')); back.position.set(0, 0.8, 0.27); chair.add(back); const pole = box(0.06, 0.4, 0.06, mat('#6a6a72')); pole.position.y = 0.22; chair.add(pole);
  chair.position.set(0, 0, 0.62); g.add(chair);
  g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  return { g, chair, seat: [x, z + 0.62 * Math.cos(ry)] };
}
// お局の席（奥の真ん中・こちら向き）
const BOSS = desk(0, -3.4); BOSS.g.rotation.y = 0; // 椅子は奥側
BOSS.chair.position.set(0, 0, -0.62); BOSS.chair.rotation.y = Math.PI; BOSS.g.children[2].visible = BOSS.g.children[3].visible = false;
const papers = []; for (let i = 0; i < 4; i++) { const p = box(0.4, 0.05, 0.3, mat('#f4f4f0')); p.position.set(-0.45 + (i % 2) * 0.9, 0.79 + Math.floor(i / 2) * 0.05, -3.25); S.add(p); papers.push(p); }
const plant = new THREE.Group(); { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.25, 12), mat('#c86a4a')); pot.position.y = 0.88; plant.add(pot); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat('#4a9a5a')); lf.position.y = 1.15; plant.add(lf); } plant.position.set(0.6, 0, -3.5); S.add(plant);
const DESKS = [[-1.0, -0.9], [1.0, -0.9], [-1.0, 1.3], [1.0, 1.3]].map(([x, z]) => desk(x, z, 0));
// 若手の席の机：DESKS の椅子は手前（-z 向きに座る）
const OTS = makeWoman({ shirt: '#c86a7a', hair: '#4a3830' }); S.add(OTS); const otsDress = dress(OTS, '#e8d8a8'); otsDress(true);
const YW = makeWoman({ shirt: '#f0b0c8', hair: '#3a2620' }); S.add(YW); const ywDress = dress(YW, '#e8d8a8'); ywDress(false);
const MATES = [makeWoman({ shirt: '#a8d0f0', hair: '#2a1e1a' }), makeWoman({ shirt: '#f6dca8', hair: '#5a3a28' }), makeWoman({ shirt: '#c8e8b0', hair: '#1d1a19' })]; MATES.forEach(m => S.add(m));
const NEWS = [makeWoman({ shirt: '#ffffff', hair: '#2a1e1a', pants: '#20242e' }), makeWoman({ shirt: '#ffffff', hair: '#5a3a28', pants: '#20242e' })]; NEWS.forEach(m => S.add(m));
const tagO = label('お局', { w: 512, size: 130, color: '#fff', bg: 'rgba(200,40,60,.96)', sx: 1.0 }); S.add(tagO);
const tagY = label('お局', { w: 512, size: 130, color: '#fff', bg: 'rgba(200,40,60,.96)', sx: 1.0 }); S.add(tagY);
const poof = makeSparkles(220, 0.16, 0xfff2c0); S.add(poof.points); poof.init([[0, 1.2, -4.0]], 1.0, 1.4);
const confetti = makeSparkles(200, 0.16, 0xffb0d0); S.add(confetti.points); confetti.init([[0, 2.0, 0.6]], 3.6, 2.0);
const yay = label('やったー！', { w: 768, size: 120, color: '#fff', bg: 'rgba(230,90,140,.95)', sx: 1.5 }); S.add(yay);
const NOS = ['細かい注意', 'ため息', '給湯室の噂話'].map((s, i) => label(s, { w: 768, size: 110, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.6 }));
const XS = NOS.map(() => label('×', { w: 256, h: 256, size: 240, color: '#ff3b3b', sx: 0.75 })); NOS.forEach(n => S.add(n)); XS.forEach(x => S.add(x));
const QS = [0, 1, 2, 3, 4].map(() => { const q = makeQ(); S.add(q); return q; });
const calLab = label('経費精算の締め切り？', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,80,120,.95)', sx: 2.2 }); S.add(calLab);
const telLab = label('取引先から電話', { w: 768, size: 100, color: '#fff', bg: 'rgba(200,90,60,.95)', sx: 1.7 }); S.add(telLab);
const bihin = label('備品の注文は？', { w: 768, size: 100, color: '#fff', bg: 'rgba(90,90,100,.95)', sx: 1.6 }); S.add(bihin);
const phone = box(0.3, 0.1, 0.2, mat('#e8e8ee')); S.add(phone);
const PILE = []; for (let i = 0; i < 14; i++) { const p = box(0.42, 0.07, 0.32, mat(i % 3 ? '#f4f4f0' : '#e8e0c0')); S.add(p); PILE.push(p); }
// コピー機
const copier = new THREE.Group(); { const b = box(1.0, 1.0, 0.8, mat('#d8dce2')); b.position.y = 0.5; copier.add(b); const t = box(1.0, 0.12, 0.8, mat('#b8bcc4')); t.position.y = 1.06; copier.add(t); const tray = box(0.5, 0.05, 0.4, mat('#9aa0aa')); tray.position.set(0.7, 0.8, 0); copier.add(tray); } copier.position.set(-5.4, 0, -3.6); S.add(copier);
const sheet = box(0.34, 0.012, 0.46, mat('#ffffff')); S.add(sheet);
const arrow = label('→', { w: 256, h: 256, size: 220, color: '#ff3b3b', sx: 0.6 }); S.add(arrow);
const muki = label('向き、逆じゃない？', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,40,60,.95)', sx: 2.1 }); S.add(muki);
const free = label('向きは自由', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,150,90,.95)', sx: 1.5 }); S.add(free);
const omoi = label('仕事だけ増える', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,40,60,.95)', sx: 1.7 }); S.add(omoi);

// ---------- B：数字（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#3a3448', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, -4); bfloor.renderOrder = -0.8; S.add(bfloor);
const ringBase = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.0, 64), new THREE.MeshBasicMaterial({ color: '#5a6070' })); ringBase.position.set(BX, 2.6, -4); S.add(ringBase);
let ringArc = null; const arcM = new THREE.MeshBasicMaterial({ color: '#ff6a8a', side: THREE.DoubleSide });
function setArc(k) { if (ringArc) { S.remove(ringArc); ringArc.geometry.dispose(); } ringArc = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.0, 64, 1, Math.PI / 2 - Math.PI * 2 * Math.max(0.001, k), Math.PI * 2 * Math.max(0.001, k)), arcM); ringArc.position.set(BX, 2.6, -3.98); S.add(ringArc); }
const arcLab = label('非正規', { w: 512, size: 110, color: '#fff', stroke: 12, strokeColor: '#1a1a22', sx: 1.0 }); arcLab.position.set(BX + 1.75, 1.1, -3.9); S.add(arcLab);
const midLab = label('53.2%', { w: 512, size: 150, color: '#fff', stroke: 14, strokeColor: '#1a1a22', sx: 1.4 }); midLab.position.set(BX, 2.6, -3.9); S.add(midLab);

// ---------- C：給湯室（x=110） ----------
const CX = 110;
const kfloor = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), mat('#eef0f2', { depthWrite: false })); kfloor.rotation.x = -Math.PI / 2; kfloor.position.set(CX, 0.02, -1.5); kfloor.renderOrder = -0.8; S.add(kfloor);
const kwall = box(8, 3.4, 0.2, mat('#e8e2d6')); kwall.position.set(CX, 1.7, -4.6); S.add(kwall);
const sink = box(2.6, 0.95, 0.7, mat('#c8ccd4')); sink.position.set(CX - 0.4, 0.47, -4.1); S.add(sink);
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.36, 14), mat('#f0f0f0')); pot.position.set(CX + 0.4, 1.13, -4.1); S.add(pot);
const kSign = label('給湯室', { w: 512, size: 110, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 1.0 }); kSign.position.set(CX + 0.75, 2.9, -4.45); S.add(kSign);
const hiso = label('ひそひそ…', { w: 640, size: 100, color: '#fff', bg: 'rgba(120,70,110,.92)', sx: 1.3 }); S.add(hiso);
const ghost = makeWoman({ shirt: '#8a4a5a', hair: '#4a3830' }); const ghostDress = dress(ghost); ghostDress(true); S.add(ghost);
ghost.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; o.material.depthWrite = false; } });
const mirai = label('未来の自分', { w: 768, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.7 }); S.add(mirai);

const PEOPLE = [OTS, YW, ...MATES, ...NEWS, ghost];
function reset() {
  PEOPLE.forEach(p => { poseReset(p); p.visible = true; });
  OTS.position.set(0, 0, -4.0); sit(OTS); otsDress(true); BOSS.chair.visible = true;
  YW.position.set(-1.0, 0, -0.28); YW.rotation.y = Math.PI; sit(YW); ywDress(false);
  [[1.0, -0.28], [-1.0, 1.92], [1.0, 1.92]].forEach(([x, z], i) => { MATES[i].position.set(x, 0, z); MATES[i].rotation.y = Math.PI; sit(MATES[i]); });
  NEWS.forEach(n => n.visible = false); ghost.visible = false;
  tagO.visible = tagY.visible = false; poof.set(0); confetti.set(0); yay.visible = false; NOS.forEach(n => n.visible = false); XS.forEach(x => x.visible = false); QS.forEach(q => q.visible = false);
  calLab.visible = telLab.visible = bihin.visible = false; phone.visible = false; PILE.forEach(p => p.visible = false); sheet.visible = false; arrow.visible = false; muki.visible = free.visible = omoi.visible = false;
  hiso.visible = false; mirai.visible = false; kSign.visible = true; papers.forEach(p => p.visible = true); midLab.visible = arcLab.visible = false;
  hemi.intensity = 1.2; S.background.set('#2a2e3a'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.45;
function bossCam(d = 0) { look(lerp(0.15, 0.05, d), 1.95, lerp(-0.6, -0.9, d), 0, 1.62, -4.0, 50); }
function shot0(t) { // 0秒＝サムネ：奥の席のお局が、椅子とカーディガンごとふっと消える
  reset(); lift(0); const k = t - TP;
  OTS.userData.head.rotation.x = 0.1; OTS.userData.head.rotation.y = Math.sin(t * 2) * 0.15;
  tagO.position.set(-0.46, 1.74, -3.7); tagO.visible = k < 0.05; tagO.userData.size(0.55);
  if (k > 0) { OTS.visible = false; BOSS.chair.visible = false; poof.set(clamp(k / 1.4)); }
  el.flash.style.opacity = k > 0 && k < 0.12 ? 0.3 : 0;
  bossCam(ease(clamp(t / 3.0)));
  return S;
}
function officeCam(d = 0) { look(lerp(0.3, 0.0, d), 3.6, lerp(-4.4, -4.1, d), 0, 0.9, 1.0, 55); }
function shot1(t) { // 若手女子たちの願いが叶った
  reset(); lift(60); OTS.visible = false; BOSS.chair.visible = false;
  [YW, ...MATES].forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = -2.8 + Math.sin(t * 7 + i) * 0.2); p.position.y = -0.36 + Math.abs(Math.sin(t * 5 + i)) * 0.08; });
  confetti.set(clamp((t - 0.3) / 2.8)); yay.position.set(0, 2.4, 0.8); pop(yay, t, 0.4, 0.3, 1.5);
  officeCam(0);
  return S;
}
function shot2(t) { // 細かい注意も、ため息も、給湯室の噂話も、もうない
  reset(); lift(110); OTS.visible = false; BOSS.chair.visible = false;
  NOS.forEach((n, i) => { n.position.set(-0.2, 2.75 - i * 0.62, -3.3); pop(n, t, 0.3 + i * 0.9, 0.25, 1.4); XS[i].position.set(0.75, 2.75 - i * 0.62, -3.2); pop(XS[i], t, 0.7 + i * 0.9, 0.2, 0.5); });
  look(0.2, 2.3, 1.2, 0, 1.75, -3.6, 52);
  return S;
}
function shot3(t) { // ある日、職場からお局が消えた
  reset(); lift(0); OTS.visible = false; BOSS.chair.visible = false;
  const u = ease(clamp(t / 3.4)); look(lerp(-0.9, 0.1, u), 2.0, lerp(-0.3, -1.0, u), 0, 1.45, -3.8, 50);
  setTop('職場から', 'お局が消えた', fade(t, 0.2, 3.3, 0.25), MINT);
  return S;
}
function copyCam() { look(-2.6, 2.3, 0.4, -4.9, 1.5, -3.5, 52); }
function shot4(t) { // もう誰にも、コピーの向きで怒られない
  reset(); lift(80); OTS.visible = false; BOSS.chair.visible = false;
  poseReset(YW); YW.position.set(-4.55, 0, -3.65); YW.rotation.y = -Math.PI / 2; YW.userData.arms[0].rotation.x = -1.0; YW.userData.head.rotation.x = 0.2;
  sheet.visible = true; sheet.position.set(-5.4, 1.13, -3.6); sheet.rotation.y = Math.PI / 2 * clamp((t - 0.6) / 0.4);
  free.position.set(-4.7, 2.25, -3.4); pop(free, t, 1.2, 0.3, 1.5);
  copyCam();
  return S;
}
function qs(pos, t, t0) { QS.forEach((q, i) => { if (i >= pos.length) return; q.position.set(...pos[i]); q.visible = t > t0 + i * 0.25; q.position.y += Math.sin(t * 3 + i) * 0.04; }); }
function shot5(t) { // ところが1週間後、経費精算の締め切りを誰も知らない
  reset(); lift(60); OTS.visible = false; BOSS.chair.visible = false;
  [YW, ...MATES].forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 2 + i * 1.7) * 0.6; });
  qs([[-1.0, 1.85, -0.28], [1.0, 1.85, -0.28], [-1.0, 1.85, 1.92], [1.0, 1.85, 1.92]], t, 0.9);
  calLab.position.set(0, 2.62, 0.8); pop(calLab, t, 0.4, 0.3, 2.2);
  hudTime('1週間後', fade(t, 0.1, 3.9, 0.2));
  officeCam(0.5);
  return S;
}
function shot6(t) { // 取引先の担当者の名前も、備品の頼み方も、誰も知らない
  reset(); lift(60); OTS.visible = false; BOSS.chair.visible = false; phone.visible = true; phone.position.set(0, 0.82 + (Math.floor(t * 8) % 2) * 0.03, -3.0);
  telLab.position.set(0, 2.15, -3.0); pop(telLab, t, 0.2, 0.25, 1.6); bihin.position.set(0, 2.85, -2.6); pop(bihin, t, 1.6, 0.25, 1.5);
  qs([[-1.0, 1.95, -0.28], [1.0, 1.95, -0.28]], t, 0.8);
  look(0.2, 3.0, 3.6, 0, 1.4, -2.6, 52);
  return S;
}
function pileAt(n, x, z) { PILE.forEach((p, i) => { p.visible = i < n; p.position.set(x + (i % 2 ? 0.05 : -0.05), 0.8 + i * 0.075, z); p.rotation.y = (i * 0.37) % 0.3; }); }
function shot7(t) { // お局の仕事は、一番下の若手女子にまとめて回ってくる
  reset(); lift(80); OTS.visible = false; BOSS.chair.visible = false; papers.forEach(p => p.visible = false);
  const n = Math.floor(clamp((t - 0.3) / 3.0) * PILE.length); pileAt(n, -0.7, -0.95);
  const fly = (t - 0.3) * PILE.length / 3.0 - n; if (n < PILE.length && t > 0.3) { const p = PILE[n]; p.visible = true; p.position.set(lerp(0, -0.7, fly), 0.9 + Math.sin(fly * Math.PI) * 1.6 + n * 0.075, lerp(-3.3, -0.95, fly)); }
  YW.userData.head.rotation.x = 0.35; YW.userData.head.rotation.y = -0.4;
  omoi.position.set(-0.8, 2.5, -0.6); pop(omoi, t, 2.2, 0.3, 1.5);
  look(0.4, 2.6, -3.0, -0.6, 1.1, -0.4, 52);
  return S;
}
function shot8(t) { // 働く女性の53.2%は非正規。給料は増えず、仕事だけ増える
  reset(); lift(150); setArc(0.532 * easeOut(clamp((t - 0.2) / 1.4))); midLab.visible = t > 1.0; arcLab.visible = t > 1.2;
  look(BX, 2.6, 6.0, BX, 2.4, -4, 52);
  setTop('働く女性のうち非正規（2023年）', '53.2%', fade(t, 0.15, 4.2, 0.25), PINK);
  return S;
}
function shot9(t) { // 半年後、その子は新人のコピーの向きが気になって仕方ない
  reset(); lift(80); OTS.visible = false; BOSS.chair.visible = false;
  poseReset(YW); YW.position.set(-2.95, 0, -2.75); YW.rotation.y = -2.17; YW.userData.head.rotation.x = 0.15; YW.userData.arms[1].rotation.x = t > 1.4 ? -1.3 : 0;
  const N = NEWS[0]; N.visible = true; N.position.set(-4.55, 0, -3.65); N.rotation.y = -Math.PI / 2; N.userData.arms[0].rotation.x = -1.0;
  sheet.visible = true; sheet.position.set(-5.4, 1.13, -3.6); sheet.rotation.y = Math.PI / 2;
  arrow.position.set(-5.4, 1.55, -3.6); pop(arrow, t, 0.8, 0.2, 0.6); muki.position.set(-3.55, 2.35, -2.9); pop(muki, t, 1.4, 0.3, 2.0);
  hudTime('半年後', fade(t, 0.1, 4.0, 0.2));
  look(-2.0, 2.5, 1.2, -3.85, 1.5, -3.2, 52);
  return S;
}
function shot10(t) { // 新人たちが、給湯室でひそひそ話す
  reset(); lift(60); NEWS.forEach((n, i) => { n.visible = true; n.position.set(CX - 0.5 + i * 0.75, 0, -2.6); n.rotation.y = i ? -1.0 : 1.0; n.userData.head.rotation.z = (i ? 1 : -1) * 0.15; n.userData.arms[i ? 0 : 1].rotation.x = -1.2 - Math.sin(t * 6) * 0.1; });
  hiso.position.set(CX + 0.1, 2.25, -2.4); pop(hiso, t, 0.5, 0.3, 1.3);
  look(CX + 0.4, 2.0, 1.4, CX - 0.1, 1.5, -2.8, 52);
  return S;
}
function shot11(t) { // あの人、お局っぽくない？（奥の席に座ったその子に、お局の札）
  reset(); lift(0); OTS.visible = false; BOSS.chair.visible = true; ywDress(true);
  YW.rotation.y = 0; YW.position.set(0, 0, -4.0); sit(YW); YW.userData.head.rotation.x = 0.1;
  tagY.position.set(-0.46, 1.74, -3.7); pop(tagY, t, 1.0, 0.25, 0.55); el.flash.style.opacity = t > 1.0 && t < 1.1 ? 0.2 : 0;
  bossCam(0.5);
  return S;
}
function shot12(t) { // 結果：お局は消えなかった。席が空いたら、次の人が座っただけ
  reset(); lift(60); S.background.set('#22242e'); OTS.visible = false; BOSS.chair.visible = true; ywDress(true);
  YW.position.set(0, 0, -4.0); sit(YW); YW.userData.head.rotation.y = Math.sin(t * 1.4) * 0.3;
  tagY.visible = true; tagY.position.set(0, 2.2, -3.8); tagY.userData.size(0.7);
  MATES.forEach(m => m.visible = false); NEWS.forEach((n, i) => { n.visible = true; n.position.set(i ? 1.0 : -1.0, 0, -0.28); n.rotation.y = Math.PI; sit(n); });
  const u = ease(clamp(t / 5.8)); look(lerp(0.4, 0.8, u), lerp(2.4, 3.8, u), lerp(1.6, 6.4, u), 0, 1.3, -2.4, 52);
  setTop('結果', '次の人が座っただけ', fade(t, 0.15, 5.8, 0.25), RED);
  return S;
}
function shot13(t) { // お局を笑っていたのは、未来の自分だったのかもしれない
  reset(); lift(60); NEWS.forEach(n => n.visible = false); ghost.visible = true; kSign.visible = false;
  poseReset(YW); ywDress(false); YW.position.set(CX - 0.6, 0, -2.4); YW.rotation.y = 0.3;
  ghost.position.set(CX + 0.6, 0, -2.6); ghost.rotation.y = -0.3; ghost.traverse(o => { if (o.material && o.material.transparent && o.material.depthWrite === false && o.isMesh) o.material.opacity = 0.15 + 0.35 * clamp((t - 0.4) / 1.2); });
  mirai.position.set(CX + 0.1, 2.75, -2.5); pop(mirai, t, 1.4, 0.3, 1.5);
  look(CX, 1.9, 2.0, CX, 1.4, -2.6, 52);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（奥の席にはまた誰かが座っている）
  reset(); lift(0); OTS.visible = false; ywDress(true); YW.rotation.y = 0; YW.position.set(0, 0, -4.0); sit(YW);
  tagY.visible = true; tagY.position.set(-0.46, 1.74, -3.7); tagY.userData.size(0.55);
  bossCam(0);
  return S;
}

const SUBS = [
  [2.7, 5.3, '若手女子たちの<br>願いが叶った。'],
  [5.4, 10.2, '細かい注意も、ため息も、<br>給湯室の噂話も、もうない。'],
  [10.3, 13.3, 'ある日、職場から<br>お局が消えた。'],
  [13.4, 16.7, 'もう誰にも、<br>コピーの向きで怒られない。'],
  [16.8, 20.8, 'ところが1週間後、経費精算の<br>締め切りを誰も知らない。'],
  [20.9, 25.7, '取引先の担当者の名前も、<br>備品の頼み方も、誰も知らない。'],
  [25.8, 29.9, 'お局の仕事は、一番下の<br>若手女子にまとめて回ってくる。'],
  [30.0, 35.6, '働く女性の53.2%は非正規。<br>給料は増えず、仕事だけ増える。'],
  [35.7, 37.4, '半年後、その子は'],
  [37.5, 40.2, '新人のコピーの向きが<br>気になって仕方ない。'],
  [40.3, 43.3, '新人たちが、給湯室で<br>ひそひそ話す。'],
  [43.4, 46.0, 'あの人、<br>お局っぽくない？'],
  [46.1, 49.6, '結果：お局は<br>消えなかった。'],
  [49.7, 52.8, '席が空いたら、<br>次の人が座っただけ。'],
  [52.9, 57.2, 'お局を笑っていたのは、未来の<br>自分だったのかもしれない。'],
  [57.3, 61.3, 'あなたの職場に、<br>お局いる？'],
];
const shots = [
  { a: 0, b: 2.7, f: shot0 }, { a: 2.7, b: 5.4, f: shot1 }, { a: 5.4, b: 10.3, f: shot2 }, { a: 10.3, b: 13.4, f: shot3 }, { a: 13.4, b: 16.8, f: shot4 }, { a: 16.8, b: 20.9, f: shot5 }, { a: 20.9, b: 25.8, f: shot6 }, { a: 25.8, b: 30.0, f: shot7 }, { a: 30.0, b: 35.7, f: shot8 }, { a: 35.7, b: 40.3, f: shot9 }, { a: 40.3, b: 43.4, f: shot10 }, { a: 43.4, b: 46.1, f: shot11 }, { a: 46.1, b: 52.9, f: shot12 }, { a: 52.9, b: 57.3, f: shot13 }, { a: 57.3, b: 61.6, f: shot14 }, { a: 61.6, b: 64.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.8, camera: cam,
  meta: {
    id: '0640',
    v2: true,
    hookLine: '奥の席のお局が、椅子ごとふっと消えた。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '社会・仕事',
    title: 'もしも職場からお局が消えたら？',
    titleHtml: 'もしも職場から<br>お局が<br>消えたら？',
    mood: 'mystery', seed: 640, hits: [0.45, 46.1, 52.9], risers: [40.3], impacts: [10.3, 16.8, 25.8, 30.0, 43.4, 46.1],
    sfx: [[0.45, 'poof'], [3.1, 'bubble'], [6.1, 'poof'], [7.0, 'poof'], [7.9, 'poof'], [21.1, 'alarm'], [26.4, 'whoosh'], [27.4, 'whoosh'], [37.1, 'buzz'], [40.8, 'bubble'], [44.4, 'poof'], [54.3, 'whoosh']],
    narr: { 'お局': 'おつぼね', '53.2%': 'ごじゅうさんてんにパーセント', '噂話': 'うわさばなし', '結果：': '結果、', '若手女子': 'わかてじょし', '経費精算': 'けいひせいさん' },
    ask: 'あなたの職場に、お局いる？',
    caption: 'もしも職場から、お局が消えたら？\n\n若手女子たちの願いが叶った。細かい注意も、ため息も、給湯室の噂話も、もうない。\nもう誰にも、コピーの向きで怒られない。\nところが1週間後、経費精算の締め切りを誰も知らない。取引先の担当者の名前も、備品の頼み方も。\nお局の仕事は、一番下の若手女子にまとめて回ってくる。働く女性の53.2%は非正規。給料は増えず、仕事だけ増える。\n半年後、その子は新人のコピーの向きが気になって仕方ない。給湯室で新人たちがひそひそ。あの人、お局っぽくない？\n\n結果：お局は消えなかった。席が空いたら、次の人が座っただけ。\nお局を笑っていたのは、未来の自分だったのかもしれない。\n\nあなたの職場に、お局いる？ コメントで教えて。\n\n※風刺ネタです\n出典：総務省「労働力調査（詳細集計）」2023年平均（役員を除く女性の雇用者のうち非正規の職員・従業員 53.2%）',
    hashtags: ['もしもラボ', 'もしも', 'お局', '職場あるある', '女の職場'],
    endStats: [['働く女性のうち非正規', '53.2%', '2023年平均'], ['同じ年の男性', '22.6%', '2023年平均'], ['お局の席', '次の人が座る', 'かもしれない']],
    sources: '出典：総務省「労働力調査（詳細集計）」',
  },
});
