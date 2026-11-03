import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom, makePhone } from '../satire-kit.js';

// もしもSNSの写真が加工できなくなったら？（皮肉回・台本 S12・図星）
// 2026/11/03 ゆうと承認。元ネタ：ガルちゃん・はてなで燃える 加工詐欺・会ったら別人 の話
// 数字（一次資料で確認）：
//  SNSやマッチングアプリなどネットで知り合った夫婦が最近の結婚の13.6%（2018年7月〜2021年6月に結婚した初婚どうしの夫婦。2015年7月〜2018年6月の結婚は6.0%。報告書 第Ⅱ部 JNFS16_Report04.pdf）
//  国立社会保障・人口問題研究所「第16回出生動向基本調査（結婚と出産に関する全国調査）」2021年調査・2022年9月公表
//  https://www.ipss.go.jp/ps-doukou/j/doukou16/doukou16_gaiyo.asp
// 画面のいいねの数は数字を出さない（作り話の数字を出さないため、矢印だけ）

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2236'); S.fog = new THREE.Fog(0x2a2236, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a4050, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 16, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#30283e', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// ---------- 顔の絵（スマホの画面用）。edit=1 で加工（大きい目・ツヤ肌・小さいあご・キラキラ） ----------
function face(g, cx, cy, R, { kind = 'girl', edit = 0 } = {}) {
  const e = clamp(edit);
  const skin = kind === 'old' ? '#e2b48e' : '#f2cdb0';
  const hair = kind === 'girl' ? '#4a2c1e' : kind === 'young' ? '#1d1a19' : '#9a9a9a';
  // 髪（後ろ）
  if (kind === 'girl') { g.fillStyle = hair; g.beginPath(); g.ellipse(cx, cy + R * 0.25, R * 1.12, R * 1.35, 0, 0, Math.PI * 2); g.fill(); }
  // 顔の形（加工であごが細くなる）
  const wx = R * lerp(0.95, 0.84, e), wy = R * lerp(1.05, 1.08, e);
  g.fillStyle = e > 0.5 ? '#fbe0d0' : skin; g.beginPath(); g.ellipse(cx, cy, wx, wy, 0, 0, Math.PI * 2); g.fill();
  if (e > 0.01) { g.fillStyle = `rgba(255,255,255,${0.22 * e})`; g.beginPath(); g.ellipse(cx - R * 0.3, cy - R * 0.35, R * 0.35, R * 0.22, -0.4, 0, Math.PI * 2); g.fill(); }
  // 髪（上）
  g.fillStyle = hair;
  if (kind === 'old') { g.beginPath(); g.ellipse(cx - R * 0.85, cy - R * 0.1, R * 0.18, R * 0.4, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(cx + R * 0.85, cy - R * 0.1, R * 0.18, R * 0.4, 0, 0, Math.PI * 2); g.fill(); }
  else { g.beginPath(); g.ellipse(cx, cy - R * 0.72, R * 1.0, R * 0.48, 0, Math.PI, Math.PI * 2); g.fill(); g.fillRect(cx - R, cy - R * 0.75, R * 2, R * 0.22); }
  // 目
  const ew = R * lerp(0.13, 0.24, e), eh = R * lerp(0.1, 0.28, e), ey = cy - R * 0.05;
  for (const s of [-1, 1]) {
    const ex = cx + s * R * 0.38;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, ew * 1.25, eh * 1.15, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = e > 0.5 ? '#3a2418' : '#1c1410'; g.beginPath(); g.ellipse(ex, ey + eh * 0.1, ew, eh, 0, 0, Math.PI * 2); g.fill();
    if (e > 0.01) { g.fillStyle = `rgba(255,255,255,${e})`; g.beginPath(); g.arc(ex - ew * 0.35, ey - eh * 0.35, ew * 0.35, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(ex + ew * 0.3, ey + eh * 0.3, ew * 0.18, 0, Math.PI * 2); g.fill(); }
    if (kind === 'old') { g.strokeStyle = '#a07a5a'; g.lineWidth = R * 0.03; g.beginPath(); g.moveTo(ex - ew * 1.5, ey + eh * 2.0); g.lineTo(ex + ew * 1.2, ey + eh * 2.3); g.stroke(); }
  }
  // 眉
  g.strokeStyle = hair === '#9a9a9a' ? '#6a6a6a' : hair; g.lineWidth = R * 0.05; g.lineCap = 'round';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * R * 0.25, cy - R * 0.33 - eh * 0.6); g.lineTo(cx + s * R * 0.55, cy - R * 0.36 - eh * 0.6); g.stroke(); }
  // 鼻・口・ほお
  g.strokeStyle = '#c08a6a'; g.lineWidth = R * 0.035; g.beginPath(); g.moveTo(cx, cy + R * 0.12); g.lineTo(cx - R * 0.05, cy + R * lerp(0.32, 0.25, e)); g.stroke();
  g.fillStyle = e > 0.5 ? '#ff6a8a' : '#c0605a'; g.beginPath(); g.ellipse(cx, cy + R * 0.55, R * lerp(0.2, 0.14, e), R * 0.06, 0, 0, Math.PI * 2); g.fill();
  if (e > 0.01) { g.fillStyle = `rgba(255,120,150,${0.45 * e})`; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * R * 0.55, cy + R * 0.3, R * 0.18, R * 0.1, 0, 0, Math.PI * 2); g.fill(); } }
  else if (kind === 'girl') { g.fillStyle = 'rgba(150,90,60,.35)'; [[0.45, 0.25], [0.52, 0.32], [-0.5, 0.28]].forEach(([x, y]) => { g.beginPath(); g.arc(cx + x * R, cy + y * R, R * 0.025, 0, Math.PI * 2); g.fill(); }); }
  if (kind === 'old') { g.fillStyle = '#5a4a40'; g.fillRect(cx - R * 0.28, cy + R * 0.38, R * 0.56, R * 0.07); }
  if (kind === 'girl' && e < 0.5) { g.fillStyle = hair; g.fillRect(cx - R * 1.05, cy - R * 0.3, R * 0.22, R * 1.2); g.fillRect(cx + R * 0.83, cy - R * 0.3, R * 0.22, R * 1.2); }
  if (kind === 'girl' && e >= 0.5) { g.fillStyle = hair; g.fillRect(cx - R * 1.0, cy - R * 0.3, R * 0.2, R * 1.2); g.fillRect(cx + R * 0.8, cy - R * 0.3, R * 0.2, R * 1.2); }
  // キラキラ
  if (e > 0.3) { g.fillStyle = `rgba(255,240,150,${e})`; [[-1.1, -0.9, 1], [1.05, -0.6, 0.8], [0.9, 0.9, 0.6]].forEach(([x, y, s]) => star(g, cx + x * R, cy + y * R, R * 0.14 * s)); }
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
function header(g, w, txt, col = '#ff5a8a') { g.fillStyle = col; g.fillRect(0, 0, w, 110); g.fillStyle = '#fff'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, 58); }
function heart(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); g.fill(); }
function post(g, w, h, opt) { // 投稿の画面：顔＋下にいいね
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); header(g, w, opt.head || 'SNS');
  g.fillStyle = opt.bg || '#ffe4ee'; g.fillRect(20, 250, w - 40, 800);
  face(g, w / 2, 630, 220, opt);
  heart(g, 120, 185, 46, opt.likeCol || '#ff3a6a');
  g.textBaseline = 'middle';
  if (opt.down) { g.fillStyle = '#222'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText('いいね', 190, 185); g.fillStyle = '#2a5ad0'; g.font = '900 130px "Noto Sans CJK JP", sans-serif'; g.fillText('↓', 400, 185); }
  else { g.fillStyle = '#222'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText('いいね', 190, 185); }
}

// ---------- A：大きいスマホ（原点） ----------
const PH = makePhone({ w: 2.6, h: 5.2 }); PH.g.position.set(0, 2.9, 0); S.add(PH.g);
const pfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#3a3050', { depthWrite: false })); pfloor.rotation.x = -Math.PI / 2; pfloor.position.set(0, 0.02, 0); pfloor.renderOrder = -0.8; S.add(pfloor);
const glitch = makeSparkles(200, 0.2, 0xff9ad0); S.add(glitch.points); glitch.init([[0, 3.2, 0.4]], 2.4, 2.2);
const kakouOff = label('加工 OFF', { w: 768, size: 130, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 1.9 }); S.add(kakouOff);
const kinshi = label('加工禁止', { w: 768, size: 150, color: '#fff', bg: 'rgba(210,50,60,.96)', sx: 2.2 }); S.add(kinshi);
const modoru = label('元の顔に戻ります', { w: 1024, size: 100, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 2.3 }); S.add(modoru);

// ---------- B：待ち合わせの広場（x=60） ----------
const MX = 60;
const plaza = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), mat('#c8bfb0', { depthWrite: false })); plaza.rotation.x = -Math.PI / 2; plaza.position.set(MX, 0.02, 0); plaza.renderOrder = -0.8; S.add(plaza);
const bwall = box(30, 5, 0.3, mat('#a8b4c8')); bwall.position.set(MX, 2.5, -5); S.add(bwall);
for (let i = 0; i < 6; i++) { const w = box(2.2, 1.4, 0.05, new THREE.MeshBasicMaterial({ color: '#d8e6f4' })); w.position.set(MX - 10 + i * 4, 3.2, -4.83); S.add(w); }
const pole = box(0.18, 3.0, 0.18, mat('#5a5f6a')); pole.position.set(MX - 0.4, 1.5, -3); S.add(pole);
const CLK = label('10:00', { w: 512, size: 150, color: '#222', bg: 'rgba(250,250,250,.98)', sx: 1.0 }); CLK.position.set(MX - 0.4, 3.3, -3); S.add(CLK);
const HIM = makeMan({ shirt: '#5a7aa8', hair: '#1d1a19' }); S.add(HIM);
const HER = makeWoman({ shirt: '#f29bbb', hair: '#4a2c1e', skirt: true }); S.add(HER);
const dare = label('え、誰？', { w: 512, size: 130, color: '#222', bg: 'rgba(255,255,255,.97)', sx: 1.3 }); S.add(dare);
const doori = label('写真どおり', { w: 768, size: 120, color: '#fff', bg: 'rgba(60,160,110,.95)', sx: 1.7 }); S.add(doori);
const yakusoku = label('次の約束 決定', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.9 }); S.add(yakusoku);
const hearts = makeSparkles(90, 0.25, 0xff7aa8); S.add(hearts.points); hearts.init([[MX, 2.2, 0]], 1.4, 1.6);
const FRAME_PH = makePhone({ w: 0.5, h: 1.0, cw: 270, ch: 540 }); S.add(FRAME_PH.g); // 男が持つ小さいスマホ（写真）

// ---------- C：部屋（x=110） ----------
const RX = 110;
const room = makeRoom({ w: 9, d: 7, wall: '#f4e4ec', floor: '#c8a882' }); room.position.set(RX, 0, 0); room.userData.rw.visible = false; S.add(room);
const bed = box(2.2, 0.5, 1.4, mat('#f8d0e0')); bed.position.set(RX + 2.4, 0.25, -2.2); S.add(bed);
const mirror = box(0.9, 1.6, 0.06, mat('#c8e4f4')); mirror.position.set(RX - 2.6, 1.6, -3.4); S.add(mirror);
const GIRL = makeWoman({ shirt: '#f6a6c8', hair: '#4a2c1e' }); S.add(GIRL);
const HPH = makePhone({ w: 1.5, h: 3.0, cw: 540, ch: 1080 }); S.add(HPH.g); // 部屋で浮かぶ画面
const matte = label('待って待って', { w: 768, size: 110, color: '#222', bg: 'rgba(255,255,255,.96)', sx: 1.8 }); S.add(matte);

// ---------- D：おじさん（x=160） ----------
const OX = 160;
const ofl = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#3a4050', { depthWrite: false })); ofl.rotation.x = -Math.PI / 2; ofl.position.set(OX, 0.02, 0); ofl.renderOrder = -0.8; S.add(ofl);
const OJI = makeOji(rng(7), { shirt: '#7a6a55' }); S.add(OJI);
const OPH = makePhone({ w: 1.7, h: 3.4, cw: 540, ch: 1080 }); OPH.g.position.set(OX + 0.8, 2.6, -0.4); S.add(OPH.g);
const nijuu = label('20年前の写真', { w: 768, size: 110, color: '#fff', bg: 'rgba(90,90,100,.94)', sx: 1.8 }); S.add(nijuu);
const ozas = makeSparkles(120, 0.18, 0xffffff); S.add(ozas.points); ozas.init([[OX + 0.8, 2.9, -0.2]], 1.4, 1.2);

// ---------- E：13.6%（x=210） ----------
const EX = 210;
const efl = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2e2840', { depthWrite: false })); efl.rotation.x = -Math.PI / 2; efl.position.set(EX, 0.02, -4); efl.renderOrder = -0.8; S.add(efl);
const PIE_R = 2.2, SHARE = 0.136;
const pieBase = new THREE.Mesh(new THREE.CylinderGeometry(PIE_R, PIE_R, 0.4, 64, 1, false, 0, Math.PI * 2 * (1 - SHARE)), new THREE.MeshBasicMaterial({ color: '#7a8098' })); pieBase.rotation.x = Math.PI / 2; S.add(pieBase);
const pieNet = new THREE.Mesh(new THREE.CylinderGeometry(PIE_R, PIE_R, 0.4, 32, 1, false, Math.PI * 2 * (1 - SHARE), Math.PI * 2 * SHARE), new THREE.MeshBasicMaterial({ color: '#ff4a86' })); pieNet.rotation.x = Math.PI / 2; S.add(pieNet);
const netL = label('ネットで出会った', { w: 1024, size: 96, color: '#fff', bg: 'rgba(230,70,120,.96)', sx: 2.1 }); S.add(netL);
const APPS = [0, 1, 2, 3, 4, 5].map(() => makePhone({ w: 1.0, h: 2.0, cw: 270, ch: 540 }));
APPS.forEach((p, i) => { p.g.position.set(EX + 30 - 2.4 + (i % 3) * 2.4, 4.1 - Math.floor(i / 3) * 2.4, 0); S.add(p.g); });
const suppin = label('全部すっぴん', { w: 768, size: 120, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 2.0 }); S.add(suppin);

// ---------- 結果・ひねり ----------
const gakkari = label('がっかり', { w: 768, size: 120, color: '#fff', bg: 'rgba(90,90,100,.94)', sx: 1.6 }); S.add(gakkari);
const made = label('会うまでの間だけ', { w: 1024, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.2 }); S.add(made);

let kinshiOn = false;
function drawMain(e, opt = {}) { PH.draw('m' + e.toFixed(2) + JSON.stringify(opt), (g, w, h) => { post(g, w, h, { edit: e, ...opt }); if (opt.ban) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 110, w, h - 110); g.strokeStyle = '#ff3a3a'; g.lineWidth = 28; g.beginPath(); g.arc(w / 2, 480, 200, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 140, 340); g.lineTo(w / 2 + 140, 620); g.stroke(); } }); }

const show = (...ps) => ps.forEach(p => p.visible = true);
function poseClear(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; p.rotation.set(0, 0, 0); }
function reset() {
  [HIM, HER, GIRL, OJI].forEach(p => { poseClear(p); p.visible = false; });
  [kakouOff, kinshi, modoru, dare, doori, yakusoku, matte, nijuu, netL, suppin, gakkari, made].forEach(l => l.visible = false);
  glitch.set(0); hearts.set(0); ozas.set(0); PH.g.position.set(0, 2.9, 0); PH.g.rotation.set(0, 0, 0); PH.g.scale.setScalar(1); FRAME_PH.g.visible = false; HPH.g.visible = false;
  pieBase.scale.setScalar(0.001); pieNet.scale.setScalar(0.001); pieNet.position.set(EX, 3.0, -4); pieBase.position.set(EX, 3.0, -4);
  hemi.intensity = 1.15; S.background.set('#2a2236'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.25;
function phoneCam2(d) { look(lerp(0.1, 0.0, d), 2.3, lerp(10.2, 10.8, d), 0, 1.6, 0, 52); }
function phoneCam(d) { look(lerp(0.15, 0.05, d), 4.0, lerp(13.6, 14.2, d), 0, 4.3, 0, 52); }
function shot0(t) { // 0秒＝サムネ：加工した自撮りから、大きな目とツヤ肌が一瞬で消える
  reset(); lift(0); const k = clamp((t - TP) / 0.3); drawMain(1 - easeOut(k), { head: 'SNS' });
  el.flash.style.opacity = t > TP && t < TP + 0.15 ? 0.35 : 0; glitch.set(clamp((t - TP) / 1.6));
  kakouOff.position.set(0, 1.0, 0.6); pop(kakouOff, t, TP + 0.15, 0.25, 1.9);
  phoneCam(ease(clamp(t / 2.9)));
  return S;
}
function plazaCam(x = 0, z = 6.2) { look(MX + x, 2.0, z, MX + x * 0.6, 1.45, -1.2, 52); }
function shot1(t) { // 会ったら別人、という苦情が多すぎて（待ち合わせ）
  reset(); lift(0); show(HIM, HER); HIM.position.set(MX - 1.6, 0, -1.2); HIM.rotation.y = 0.6; HER.position.set(MX + 0.6, 0, -0.6); HER.rotation.y = -0.9;
  FRAME_PH.g.visible = true; FRAME_PH.g.position.set(MX - 1.2, 1.25, -0.9); FRAME_PH.g.rotation.y = 0.4; FRAME_PH.draw('fp', (g, w, h) => { g.fillStyle = '#ffe4ee'; g.fillRect(0, 0, w, h); face(g, w / 2, h / 2, 95, { edit: 1 }); });
  HIM.userData.arms[1].rotation.x = -1.2; HIM.userData.head.rotation.y = t > 1.0 ? 0.0 : -0.6;
  dare.position.set(MX - 1.5, 2.55, -1.2); pop(dare, t, 1.2, 0.3, 1.2);
  look(MX - 0.5, 2.1, 6.6, MX - 0.5, 1.5, -1.2, 52);
  return S;
}
function shot1b(t) { // SNSの写真は、加工禁止になった
  reset(); lift(0); drawMain(1, { head: 'SNS', ban: true });
  kinshi.position.set(0, 0.75, 0.6); pop(kinshi, t, 0.3, 0.3, 2.2);
  phoneCam2(1);
  return S;
}
function shot2(t) { // 加工した写真は、上げた瞬間に元の顔に戻る
  reset(); lift(0); const k = clamp((t - 1.2) / 0.5); drawMain(1 - k, { head: '投稿する' });
  el.flash.style.opacity = t > 1.2 && t < 1.32 ? 0.3 : 0;
  modoru.position.set(0, 0.75, 0.6); pop(modoru, t, 1.6, 0.3, 2.3);
  PH.g.rotation.y = Math.sin(t * 1.4) * 0.1; phoneCam2(0.5);
  return S;
}
function shot3(t) { // 一番慌てたのは、盛りに盛っていた女子たち
  reset(); lift(0); show(GIRL); GIRL.position.set(RX - 0.4, 0, -0.6); GIRL.rotation.y = 0.3;
  GIRL.userData.arms[0].rotation.set(-2.6 + Math.sin(t * 9) * 0.2, 0, -0.3); GIRL.userData.arms[1].rotation.set(-2.6 - Math.sin(t * 9) * 0.2, 0, 0.3); GIRL.position.y = Math.abs(Math.sin(t * 6)) * 0.08;
  HPH.g.visible = true; HPH.g.position.set(RX + 1.3, 2.3, -0.6); HPH.g.rotation.y = -0.3; HPH.draw('h0', (g, w, h) => post(g, w, h, { edit: 0, head: '投稿' }));
  matte.position.set(RX - 0.2, 2.65, -0.4); pop(matte, t, 0.6, 0.3, 1.5);
  look(RX + 0.45, 2.3, 6.6, RX + 0.45, 1.85, -0.6, 52);
  return S;
}
function shot4(t) { // いいねの数が、一晩でガクッと減る
  reset(); lift(0); drawMain(0, { head: '翌朝', down: t > 0.8, likeCol: t > 0.8 ? '#9aa0aa' : '#ff3a6a' });
  PH.g.position.y = 2.9 - (t > 0.8 ? easeOut(clamp((t - 0.8) / 0.3)) * 0.25 : 0);
  setHud('経過時間', '一晩', fade(t, 0.05, 3.0, 0.2));
  phoneCam2(0.7);
  return S;
}
function shot5(t) { // 一方、20年前の写真をアイコンにしていたおじさんも
  reset(); lift(200); show(OJI); OJI.position.set(OX - 0.9, 0, 0.2); OJI.rotation.y = 0.5; OJI.userData.arms[1].rotation.x = -1.3; OJI.userData.head.rotation.y = 0.5;
  const k = clamp((t - 2.6) / 0.4);
  OPH.draw('o' + (k > 0.5 ? 1 : 0), (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); header(g, w, 'アイコン', '#3a6ad0'); g.fillStyle = '#dfe8f4'; g.fillRect(20, 130, w - 40, 640); face(g, w / 2, 450, 200, { kind: k > 0.5 ? 'old' : 'young' }); });
  el.flash.style.opacity = t > 2.6 && t < 2.72 ? 0.3 : 0; ozas.set(clamp((t - 2.6) / 1.5));
  nijuu.position.set(OX + 0.4, 4.7, -0.3); pop(nijuu, t, 0.6, 0.3, 1.7);
  look(OX, 2.6, 7.6, OX, 2.5, -0.3, 52);
  return S;
}
function shot5b(t) { // 青ざめる
  reset(); lift(0); show(OJI); OJI.position.set(OX - 1.0, 0, 0); OJI.rotation.y = 0.5; OJI.userData.arms[1].rotation.x = -1.3; OJI.userData.head.rotation.y = 0.5; OJI.userData.head.rotation.x = 0.15;
  OPH.draw('o1', (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); header(g, w, 'アイコン', '#3a6ad0'); g.fillStyle = '#dfe8f4'; g.fillRect(20, 130, w - 40, 640); face(g, w / 2, 450, 200, { kind: 'old' }); });
  hemi.intensity = 0.8; S.background.set('#1e2a3a');
  look(OX - 0.6, 2.1, 2.8, OX - 0.8, 1.75, 0, 52);
  return S;
}
function shot6(t) { // 最近の結婚の13.6%は、ネットで知り合った夫婦
  reset(); lift(150); const u = easeOut(clamp((t - 0.2) / 0.8)); pieBase.scale.setScalar(Math.max(0.001, u)); pieNet.scale.setScalar(Math.max(0.001, u));
  const pop2 = easeOut(clamp((t - 1.2) / 0.5)); pieNet.position.set(EX, 3.0, -4 + 0.6 * pop2);
  pieBase.rotation.set(Math.PI / 2, 0, 0); pieNet.rotation.set(Math.PI / 2, 0, 0);
  netL.position.set(EX, 5.85, -3.4); pop(netL, t, 1.4, 0.3, 2.0);
  look(EX, 3.6, 6.4, EX, 3.6, -4, 52);
  setTop('最近の結婚（2021年調査）', 'ネット出会い 13.6%', fade(t, 0.3, 5.7, 0.25), PINK);
  return S;
}
function shot7(t) { // その出会いの入口が、全部すっぴんになった
  reset(); lift(80); APPS.forEach((p, i) => { const k = clamp((t - 0.6 - i * 0.18) / 0.25); p.draw('a' + i + (k > 0.5 ? 1 : 0), (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff5a8a'; g.fillRect(0, 0, w, 54); g.fillStyle = ['#ffe4ee', '#e4f0ff', '#f0ffe4'][i % 3]; g.fillRect(10, 64, w - 20, 330); face(g, w / 2, 225, 100, { kind: i % 2 ? 'young' : 'girl', edit: k > 0.5 ? 0 : 1 }); g.fillStyle = '#222'; g.font = '900 34px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('いいかも', w / 2, 460); }); });
  suppin.position.set(EX + 30, 6.0, 0.4); pop(suppin, t, 1.8, 0.3, 2.0);
  look(EX + 30, 3.8, 11.5, EX + 30, 3.4, 0, 52);
  return S;
}
function meet(t, happy) { HIM.position.set(MX - 0.7, 0, -0.6); HIM.rotation.y = 0.7; HER.position.set(MX + 0.7, 0, -0.6); HER.rotation.y = -0.7; if (happy) { HIM.userData.arms[1].rotation.x = -1.0 - Math.sin(t * 5) * 0.2; HER.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 5) * 0.2; } }
function shot8(t) { // ところが、初めて会った瞬間のがっかりが消える
  reset(); lift(0); show(HIM, HER); meet(t, true); FRAME_PH.g.visible = true; FRAME_PH.g.position.set(MX - 0.35, 1.25, -0.25); FRAME_PH.g.rotation.y = 0.3; FRAME_PH.draw('fp0', (g, w, h) => { g.fillStyle = '#ffe4ee'; g.fillRect(0, 0, w, h); face(g, w / 2, h / 2, 95, { edit: 0 }); });
  doori.position.set(MX, 2.65, -0.4); pop(doori, t, 0.8, 0.3, 1.7);
  plazaCam(0, 5.6);
  return S;
}
function shot9(t) { // 写真どおりの人が来る。それだけで、次の約束が決まる
  reset(); lift(0); show(HIM, HER); meet(t, true); HIM.position.x += Math.min(t, 3) * 0.4; HER.position.x += Math.min(t, 3) * 0.4; HIM.rotation.y = HER.rotation.y = Math.PI / 2; HIM.position.z = HER.position.z = -0.6; HER.position.x = HIM.position.x - 1.0 + 0.0;
  const ph = t * 7; [HIM, HER].forEach((p, i) => { const s = Math.sin(ph + i) * 0.5; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; });
  hearts.set(clamp((t - 0.6) / 3.5)); hearts.points.position.set(Math.min(t, 3) * 0.4 - 0.2, 0, -0.6);
  yakusoku.position.set(MX + 0.9, 2.65, -0.6); pop(yakusoku, t, 2.0, 0.3, 1.9);
  plazaCam(0.6, 5.8);
  return S;
}
function shot10(t) { // 結果：加工が消えて減ったのは、いいねとがっかりの数
  reset(); lift(0); show(HIM, HER); drawMain(0, { head: '加工なし', down: true, likeCol: '#9aa0aa' }); PH.g.position.x = -1.0; PH.g.scale.setScalar(0.8);
  meet(t, true); HIM.position.set(1.4, 0, 0.6); HER.position.set(2.4, 0, 0.6); HIM.rotation.y = 0.4; HER.rotation.y = -0.4;
  gakkari.position.set(1.9, 2.65, 0.6); pop(gakkari, t, 1.8, 0.3, 1.6);
  const s = clamp((t - 3.0) / 0.4); if (s > 0) { gakkari.userData.size(1.6 * (1 - s * 0.3)); gakkari.position.y = 2.65 - s * 0.3; }
  look(0.6, 3.0, 9.6, 0.6, 2.6, 0, 52);
  setTop('結果', 'いいね↓ がっかり↓', fade(t, 0.15, 5.6, 0.25), RED);
  return S;
}
function shot11(t) { // 盛った顔で勝てるのは、会うまでの間だけだったのかもしれない
  reset(); lift(0); show(GIRL); GIRL.position.set(RX - 0.6, 0, -0.6); GIRL.rotation.y = 0.25; GIRL.userData.arms[1].rotation.x = -1.4;
  const k = clamp((t - 1.2) / 2.2);
  HPH.g.visible = true; HPH.g.position.set(RX + 0.9, 2.4, -0.4); HPH.g.rotation.y = -0.25; HPH.draw('t' + Math.round(k * 10), (g, w, h) => post(g, w, h, { edit: 1 - k, head: '会うまで' }));
  made.position.set(RX + 0.3, 4.4, -0.4); pop(made, t, 0.6, 0.35, 2.2);
  look(RX + 0.3, 2.5, 5.8, RX + 0.3, 2.5, -0.6, 52);
  return S;
}
function shot12(t) { // 質問。最後は冒頭と同じ構図（加工のない顔）
  reset(); lift(0); drawMain(0, { head: 'SNS' }); phoneCam(0);
  return S;
}

const SUBS = [
  [3.5, 7.4, '会ったら別人、という<br>苦情が多すぎて、'],
  [7.45, 10.9, 'SNSの写真は、<br>加工禁止になった。'],
  [11.0, 15.0, '加工した写真は、上げた<br>瞬間に元の顔に戻る。'],
  [15.1, 18.9, '一番慌てたのは、盛りに<br>盛っていた女子たち。'],
  [19.0, 22.1, 'いいねの数が、<br>一晩でガクッと減る。'],
  [22.2, 27.3, '一方、20年前の写真を<br>アイコンにしていたおじさんも'],
  [27.35, 28.7, '青ざめる。'],
  [28.8, 34.8, '最近の結婚の13.6%は、<br>ネットで知り合った夫婦。'],
  [34.9, 38.6, 'その出会いの入口が、<br>全部すっぴんになった。'],
  [38.7, 42.8, 'ところが、初めて会った<br>瞬間のがっかりが消える。'],
  [42.9, 47.9, '写真どおりの人が来る。<br>それだけで、次の約束が決まる。'],
  [48.0, 53.0, '結果：加工が消えて減ったのは、<br>いいねとがっかりの数。'],
  [53.1, 58.4, '盛った顔で勝てるのは、<br>会うまでの間だけだったのかも。'],
  [58.5, 61.6, '写真の加工、<br>どこまでならOK？'],
];
const shots = [
  { a: 0, b: 3.5, f: shot0 }, { a: 3.5, b: 7.45, f: shot1 }, { a: 7.45, b: 11.0, f: shot1b }, { a: 11.0, b: 15.1, f: shot2 },
  { a: 15.1, b: 19.0, f: shot3 }, { a: 19.0, b: 22.2, f: shot4 }, { a: 22.2, b: 27.35, f: shot5 }, { a: 27.35, b: 28.8, f: shot5b },
  { a: 28.8, b: 34.9, f: shot6 }, { a: 34.9, b: 38.7, f: shot7 }, { a: 38.7, b: 42.9, f: shot8 }, { a: 42.9, b: 48.0, f: shot9 },
  { a: 48.0, b: 53.1, f: shot10 }, { a: 53.1, b: 58.5, f: shot11 }, { a: 58.5, b: 61.9, f: shot12 }, { a: 61.9, b: 65.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.0, camera: cam,
  meta: {
    id: '0636',
    v2: true,
    hookLine: 'SNSの写真は、加工禁止になった。',
    series: '図星',
    hookType: 'H2',
    cat: 'テクノロジー・ネット',
    title: 'もしもSNSの写真が加工できなくなったら？',
    titleHtml: 'もしもSNSの写真が<br>加工できなく<br>なったら？',
    mood: 'tension', seed: 636, hits: [0.25, 48.0, 53.1], risers: [42.9], impacts: [7.05, 12.0, 19.0, 25.0, 28.8, 38.7, 48.0],
    sfx: [[0.25, 'whoosh'], [7.4, 'alarm'], [11.9, 'whoosh'], [15.7, 'buzz'], [19.8, 'meter', 0.4], [24.8, 'whoosh'], [35.5, 'bubble'], [35.9, 'bubble'], [36.3, 'bubble'], [39.5, 'bubble'], [44.9, 'bubble'], [53.7, 'whoosh']],
    narr: { 'SNS': 'エスエヌエス', '13.6%': 'じゅうさんてんろくパーセント', '20年前': 'にじゅうねんまえ', '一晩': 'ひとばん', 'OK': 'オーケー', '結果：': '結果、', '盛りに<br>盛って': 'もりにもって', '盛った顔': 'もったかお', 'だったのかも。': 'だったのかもしれない。', '別人': 'べつじん' },
    ask: '写真の加工、どこまでならOK？',
    caption: 'もしも、SNSの写真が加工できなくなったら？\n\n会ったら別人、という苦情が多すぎて、SNSの写真は加工禁止に。加工した写真は、上げた瞬間に元の顔に戻る。\n一番慌てたのは、盛りに盛っていた女子たち。いいねの数が、一晩でガクッと減る。\n一方、20年前の写真をアイコンにしていたおじさんも青ざめる。\n最近の結婚の13.6%は、ネットで知り合った夫婦。その出会いの入口が、全部すっぴんになった。\nところが、初めて会った瞬間のがっかりが消える。写真どおりの人が来る。それだけで、次の約束が決まる。\n\n結果：加工が消えて減ったのは、いいねとがっかりの数。\n盛った顔で勝てるのは、会うまでの間だけだったのかもしれない。\n\n写真の加工、どこまでならOK？ コメントで教えて。\n\n※風刺ネタです\n出典：国立社会保障・人口問題研究所「第16回出生動向基本調査」（2021年調査。SNSやマッチングアプリなどネットで知り合った夫婦が、2018年7月〜2021年6月に結婚した夫婦の13.6%。2015〜18年の結婚では6.0%）',
    hashtags: ['もしもラボ', 'もしも', '加工', 'マッチングアプリ', '自撮り'],
    endStats: [['ネットで知り合った夫婦', '13.6%', '2018〜21年に結婚'], ['その前の3年（2015〜18年に結婚）', '6.0%', ''], ['加工が消えて減ったのは', 'いいねとがっかり', '']],
    sources: '出典：国立社会保障・人口問題研究所「第16回出生動向基本調査」',
  },
});
