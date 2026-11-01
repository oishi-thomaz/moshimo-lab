import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom, makePhone, makeShop, makeCage } from '../satire-kit.js';

// もしもパチンコ屋が消えたら？（v2・風刺回）
// 2026/11/02 ゆうとと決めた台本1。筋は現実寄り：店が消えてもパチンカスは治らず、スマホの公営競技に移るだけ
// 数字：
//  ・ぱちんこ営業所数 6,706（令和6年末。令和2年末 9,035 → 5年で約2,300減）警察庁「令和6年における風俗営業等の現状と風俗関係事犯等の取締り状況について」
//  ・風営法：深夜（午前0時〜6時）は営業できない（条例で例外あり）
//  ・2024年度 競馬の売上 約4.5兆円、ネット投票 約9割（財務省 広報誌ファイナンス 2026年8月号の図表。出典 JRA・地方競馬全国協会ほか）

const GOLD = '#ffd27a', RED = '#ff5a5a', BLUE = '#7fd4ff', PINK = '#ff9ec7', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#0b0f1d'); S.fog = new THREE.Fog(0x0b0f1d, 50, 180);
const hemi = new THREE.HemisphereLight(0xc4ceff, 0x2a2434, 1.0); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(12, 30, 22); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#23252f')); ground.rotation.x = -Math.PI / 2; S.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(50, 10), mat('#2d2f3a')); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 3); S.add(road);
const lot = new THREE.Mesh(new THREE.PlaneGeometry(11, 6), mat('#3a3a40')); lot.rotation.x = -Math.PI / 2; lot.position.set(0, 0.015, -4); S.add(lot);
const lamp = new THREE.PointLight(0xffe2b0, 10, 24, 1.5); lamp.position.set(-3, 7, 6); S.add(lamp);

// ---------- A：パチンコ屋と開店待ちの列（原点） ----------
const shop = makeShop({ w: 9, h: 7, d: 4, body: '#3a1f2a', neon: '#ffc233', text: 'パチンコ', textColor: '#fff' });
shop.g.position.set(0, 0, -4); S.add(shop.g);
const shopSide = [];
for (const s of [-1, 1]) { const b = box(3, 4.5, 3.4, mat('#2a2e3a')); b.position.set(s * 7.6, 2.25, -4); S.add(b); shopSide.push(b); }
const poof = makeSparkles(400, 0.5, 0xffd27a); S.add(poof.points); poof.init([[0, 2, -4], [0, 5, -4], [-3, 3, -3], [3, 3, -3]], 4, 6);
const QUEUE = [];
{ const r = rng(24); for (let i = 0; i < 11; i++) { const p = r() < 0.5 ? makeOji(r) : makeMan({ shirt: ['#5a5f6b', '#2f4a7a', '#6b4a3a', '#3f3f46'][i % 4], hair: ['#1d1a19', '#5a4632', '#9a9a9a'][i % 3] }); p.position.set(-5 + i * 1.05, 0, 0.6 + (i % 2) * 0.15); p.rotation.y = -Math.PI / 2 - 0.25; S.add(p); QUEUE.push(p); } }
const HERO = QUEUE[5]; // この人を最後まで追う
const QZ = QUEUE.map(p => p.position.z); // shot14 で動かすので毎回もどす
const kasLab = label('パチンカス', { size: 104, bg: 'rgba(30,30,36,.88)', sx: 2.4 }); S.add(kasLab);
// 門限の夜（月と閉店の札）
const moon = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), new THREE.MeshBasicMaterial({ color: '#fff6c8' })); moon.position.set(6, 12, -14); S.add(moon);
const closed = label('閉店', { size: 130, bg: 'rgba(30,30,36,.95)', sx: 2.2 }); closed.position.set(0, 2.3, -1.6); S.add(closed);
const lawLab = label('深夜は営業できない（風営法）', { w: 1024, size: 72, bg: 'rgba(200,60,60,.92)', sx: 6 }); lawLab.position.set(0, 9.0, -4); S.add(lawLab);
// 檻（最後のひねり）
const cage = makeCage(11.5, 8.6, 6, '#d6dbe4'); cage.position.set(0, 0, -4); S.add(cage);
const cageLab = label('門限付きの檻', { size: 120, color: '#fff', bg: 'rgba(30,110,170,.95)', sx: 5 }); cageLab.position.set(0, 10.2, -4); S.add(cageLab);
const hoursLab = label('深夜0時〜6時 営業禁止', { w: 1024, size: 80, bg: 'rgba(30,30,36,.9)', sx: 5.4 }); hoursLab.position.set(0, 0.9, -0.6); S.add(hoursLab);
// 打ちたい…（ふきだし）
const want = label('打ちたい…', { size: 120, color: '#fff', bg: 'rgba(120,60,160,.9)', sx: 2.0 }); S.add(want);

// ---------- B：家（x=60）：リビング・寝室・トイレ ----------
const HX = 60;
const room = makeRoom({ w: 9, d: 7, wall: '#efe6d8', floor: '#b48a5e' }); room.position.set(HX, 0, 0); S.add(room); room.userData.rw.visible = false;
const sofa = new THREE.Group(); { const b = box(3.4, 0.6, 1.2, mat('#5a6b8a')); b.position.y = 0.45; sofa.add(b); const bk = box(3.4, 0.9, 0.3, mat('#4f5f7c')); bk.position.set(0, 1.0, -0.5); sofa.add(bk); for (const s of [-1, 1]) { const a = box(0.3, 0.7, 1.2, mat('#4f5f7c')); a.position.set(s * 1.7, 0.7, 0); sofa.add(a); } } sofa.position.set(HX - 1.5, 0, -2.2); S.add(sofa);
const tv = box(2.4, 1.4, 0.15, mat('#121318')); tv.position.set(HX + 2.6, 1.7, -3.3); S.add(tv);
const wife = makeWoman({ shirt: '#f2a0b8', hair: '#3a2620' }); wife.position.set(HX + 1.2, 0, 0.4); S.add(wife);
const payLab = label('旦那の給料', { size: 110, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 3 }); S.add(payLab);
const yen = makeSparkles(160, 0.5, 0xfff2a0); S.add(yen.points); yen.init([[HX + 1.2, 2.6, 0.4]], 1.4, 3);
// 寝室（x=85）
const BX = 85;
const bed = makeRoom({ w: 7, d: 6, wall: '#2c3348', floor: '#3a3226' }); bed.position.set(BX, 0, 0); S.add(bed); bed.userData.rw.visible = false;
const futon = box(3.6, 0.3, 4.2, mat('#e8e4dc')); futon.position.set(BX, 0.15, -0.6); S.add(futon);
const blanket = box(3.4, 0.25, 2.8, mat('#7d8fb8')); blanket.position.set(BX, 0.42, 0.0); S.add(blanket);
for (const x of [-0.85, 0.85]) { const pl = box(1.1, 0.25, 0.6, mat('#ffffff')); pl.position.set(BX + x, 0.42, -2.2); S.add(pl); }
const wifeBed = makeWoman({ shirt: '#c9a8d8' }); wifeBed.rotation.x = -Math.PI / 2; wifeBed.position.set(BX - 0.85, 0.42, -2.25); S.add(wifeBed);
const hus = makeMan({ shirt: '#5a5f6b', hair: '#1d1a19' }); S.add(hus);
const glow = new THREE.PointLight(0x7fc8ff, 0, 5, 1.6); S.add(glow);
const tsuppa = label('全ツッパ', { size: 140, color: '#fff', bg: 'rgba(220,40,50,.95)', sx: 2.0 }); S.add(tsuppa);
const phoneS = makePhone({ w: 0.22, h: 0.44, cw: 270, ch: 540 }); S.add(phoneS.g);
// トイレ（x=105）
const TX = 105;
const toi = makeRoom({ w: 2.6, d: 2.6, h: 3, wall: '#dfe7ee', floor: '#c8d2da' }); toi.position.set(TX, 0, 0); S.add(toi); toi.userData.rw.visible = false;
const bowl = box(0.6, 0.45, 0.8, mat('#ffffff')); bowl.position.set(TX, 0.22, -0.7); S.add(bowl);
const tank = box(0.7, 0.8, 0.3, mat('#f4f6f8')); tank.position.set(TX, 0.75, -1.15); S.add(tank);
// 運動会（x=140）
const FX = 140;
const field = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat('#7a5a3a')); field.rotation.x = -Math.PI / 2; field.position.set(FX, 0.02, 0); S.add(field);
const track = new THREE.Mesh(new THREE.RingGeometry(7.6, 7.8, 64), new THREE.MeshBasicMaterial({ color: '#ffffff' })); track.rotation.x = -Math.PI / 2; track.position.set(FX, 0.04, -6); track.scale.set(1.6, 1, 1); S.add(track);
const flags = label('▲▲▲ 運動会 ▲▲▲', { w: 1024, size: 90, color: '#fff', bg: 'rgba(220,70,70,.9)', sx: 9 }); flags.position.set(FX, 6, -18); S.add(flags);
const KIDS = []; { for (let i = 0; i < 4; i++) { const k = makeMan({ shirt: ['#e05a4f', '#ffffff', '#4fa3d1', '#f2c14e'][i], hair: '#1d1a19', scale: 0.62 }); S.add(k); KIDS.push(k); } }
const PARENTS = []; { const r = rng(77); for (let i = 0; i < 9; i++) { const p = i % 2 ? makeWoman({ shirt: ['#e9e4da', '#c9a8d8', '#9fc7a8'][i % 3] }) : makeMan({ shirt: ['#2f4a7a', '#8a8f99'][i % 2] }); p.position.set(FX - 9 + i * 2.1, 0, 4.2 + r() * 0.5); p.rotation.y = Math.PI; S.add(p); PARENTS.push(p); } }
const cheer = label('がんばれー！', { size: 110, color: '#fff', bg: 'rgba(240,120,60,.92)', sx: 2.8 }); cheer.position.set(FX - 1.8, 2.9, 4.5); S.add(cheer);
const betLab = label('11R 投票', { w: 1024, size: 100, color: '#fff', bg: 'rgba(30,140,70,.95)', sx: 3.0 }); S.add(betLab);
const relay = new THREE.Vector3();

// ---------- C：スタジオ（x=-60）：大きなスマホと通帳 ----------
const SX = -60;
const studio = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: '#141a2c' })); studio.position.set(SX, 10, -8); S.add(studio);
const big = makePhone({ w: 5.2, h: 10.4 }); big.g.position.set(SX, 6, -3); S.add(big.g);
const bigLight = new THREE.PointLight(0x9fd0ff, 0, 18, 1.4); bigLight.position.set(SX, 6, 2); S.add(bigLight);
const tapper = makeMan({ shirt: '#5a5f6b', hair: '#1d1a19' }); tapper.position.set(SX + 3.6, 0, -1.2); tapper.rotation.y = -Math.PI / 2 - 0.4; S.add(tapper);
function appScreen(mode, t) {
  const k = mode + ':' + Math.floor(t * 4);
  big.draw(k, (g, w, h) => {
    g.fillStyle = '#0f1a14'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1e8f4e'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(mode === 'night' ? '24時間 投票OK' : '競馬・ボート 投票', w / 2, 62);
    if (mode === 'night') {
      g.fillStyle = '#9fd0ff'; g.font = '900 170px "Noto Sans CJK JP", sans-serif'; g.fillText('3:' + String(12 + Math.floor(t * 2) % 40).padStart(2, '0'), w / 2, 360);
      g.fillStyle = '#fff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.fillText('深夜でも買える', w / 2, 520);
      g.fillText('布団の中でも買える', w / 2, 590); g.fillText('トイレでも買える', w / 2, 660);
    } else {
      const rows = [['競馬', '11R', '15:40'], ['ボート', '12R', '16:30'], ['競馬', '12R', '16:15'], ['ボート', '9R', '20:45'], ['海外競馬', '', '23:05']];
      rows.forEach(([a, b, c], i) => { const y = 190 + i * 130; g.fillStyle = i === Math.floor(t * 1.5) % 5 ? '#24472f' : '#16261c'; g.fillRect(24, y, w - 48, 112); g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '900 42px "Noto Sans CJK JP", sans-serif'; g.fillText(a + ' ' + b, 50, y + 56); g.textAlign = 'right'; g.fillStyle = '#9be86a'; g.fillText(c, w - 50, y + 56); g.textAlign = 'center'; });
    }
    g.fillStyle = '#e8383d'; g.fillRect(60, h - 210, w - 120, 130); g.fillStyle = '#fff'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText('投票する', w / 2, h - 145);
  });
}
// 通帳
const bookC = document.createElement('canvas'); bookC.width = 1024; bookC.height = 720;
const bookT = new THREE.CanvasTexture(bookC); bookT.colorSpace = THREE.SRGBColorSpace;
const book = new THREE.Mesh(new THREE.PlaneGeometry(8, 5.62), new THREE.MeshBasicMaterial({ map: bookT })); book.position.set(SX, 7.0, 0.2); S.add(book);
let bookKey = -1;
function drawBook(stage) {
  if (stage === bookKey) return; bookKey = stage;
  const g = bookC.getContext('2d'), w = 1024, h = 720;
  g.fillStyle = '#f3efe2'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a6f8f'; g.fillRect(0, 0, w, 90);
  g.fillStyle = '#fff'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('普通預金 通帳', w / 2, 46);
  g.strokeStyle = '#c9c2ad'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(30, 140 + i * 96); g.lineTo(w - 30, 140 + i * 96); g.stroke(); }
  const rows = stage < 1 ? [['10/25', 'パチンコ', '-30,000'], ['10/26', 'パチンコ', '-20,000'], ['10/27', 'パチンコ', '-25,000']] : [['11/01', '競馬', '-30,000'], ['11/02', 'ボート', '-20,000'], ['11/03', '海外競馬', '-25,000']];
  rows.forEach(([d, s, v], i) => { const y = 188 + i * 96; g.fillStyle = '#333'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText(d, 50, y); g.fillText(s, 260, y); g.textAlign = 'right'; g.fillStyle = '#d23a3a'; g.fillText(v, w - 50, y); });
  if (stage >= 1) { g.fillStyle = 'rgba(210,58,58,.9)'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('名前が変わっただけ', w / 2, 640); }
  bookT.needsUpdate = true;
}
const lossFx = []; for (let i = 0; i < 6; i++) { const l = label('-' + comma([12000, 8000, 30000, 5000, 20000, 15000][i]) + '円', { size: 100, color: '#ff6a6a', stroke: 12, strokeColor: '#2a0a0a', sx: 2.2 }); S.add(l); lossFx.push(l); }
const pocketPhone = makePhone({ w: 0.42, h: 0.84, cw: 270, ch: 540 }); S.add(pocketPhone.g);
const pocketLab = label('負ける場所：店 → ポケット', { w: 1024, size: 80, color: '#fff', bg: 'rgba(200,50,60,.92)', sx: 5.4 }); S.add(pocketLab);

function reset() {
  shop.g.visible = true; shop.g.scale.set(1, 1, 1); shop.on(1); poof.set(0); kasLab.visible = false; moon.visible = false; closed.visible = false; lawLab.visible = false;
  cage.visible = false; cageLab.visible = false; hoursLab.visible = false; want.visible = false; QUEUE.forEach((p, i) => { p.visible = true; p.position.z = QZ[i]; p.userData.head.rotation.set(0, 0, 0); p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.rotation.y = -Math.PI / 2 - 0.25; });
  big.g.visible = true; tapper.visible = true; wife.position.y = 0; wife.userData.arms.forEach(a => a.rotation.set(0, 0, 0));
  payLab.visible = false; yen.set(0); tsuppa.visible = false; glow.intensity = 0; phoneS.g.visible = false; hus.visible = false; hus.rotation.set(0, 0, 0);
  hus.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); hus.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); hus.userData.head.rotation.set(0, 0, 0);
  cheer.visible = false; betLab.visible = false; bigLight.intensity = 0; book.visible = false; lossFx.forEach(l => l.visible = false); pocketPhone.g.visible = false; pocketLab.visible = false;
  hemi.intensity = 1.0; S.background.set('#0b0f1d'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function streetCam(t, d = 0) { look(lerp(4.5, 3.6, d), lerp(3.4, 3.8, d), lerp(13, 14.5, d), 0, 2.8, -2, 50); }
function heroLab(op = 1) { kasLab.visible = op > 0; kasLab.position.set(HERO.position.x, 2.75, HERO.position.z); }
// 立ったまま、右手でハンドルをひねる手つき
function handle(p, t) { const a = p.userData.arms[1]; a.rotation.x = -1.2; a.rotation.z = 0.2 + Math.sin(t * 9) * 0.35; }
function phoneInHand(p, ph, lit = 1) { p.updateMatrixWorld(true); const a = p.userData.arms[0]; a.rotation.x = -1.3; a.rotation.z = 0.25; a.updateMatrixWorld(true); ph.g.visible = true; const v = new THREE.Vector3(0.0, -0.62, 0.0); a.localToWorld(v); ph.g.position.copy(v); ph.g.position.y += 0.12; ph.g.rotation.set(-0.5, p.rotation.y, 0); }

function shot0(t) { // 0秒＝サムネ：開店待ちの列。0.5秒で店ごと消える
  reset(); lift(120); const k = t - TP;
  const u = clamp(k / 0.35); shop.g.visible = u < 1; shop.g.scale.set(1 - u, 1 - u * 0.4, 1 - u);
  poof.set(k > 0 ? clamp(k / 1.6) : 0); el.flash.style.opacity = k > 0 ? 0.45 * Math.max(0, 1 - k / 0.25) : 0;
  QUEUE.forEach((p, i) => { p.userData.head.rotation.x = k > 0.3 ? -0.25 : 0; });
  streetCam(t, ease(clamp(t / 3.2)));
  if (k > 0 && k < 0.5) cam.position.x += Math.sin(t * 80) * 0.06;
  setHud('開店まで', k < 0 ? '0:00.' + String(Math.floor((TP - t) * 100)).padStart(2, '0') : '──', 1, { mono: true, color: k < 0 ? '#fff' : RED });
  return S;
}
function shot1(t) { // 空き地。店舗数カウントダウン
  reset(); lift(120); shop.g.visible = false;
  QUEUE.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.5 + i) * 0.6; });
  look(lerp(0, 1, ease(clamp(t / 3.3))), 6, 15, 0, 1.5, -2, 50);
  setTop('全国のパチンコ店（2024年末）', comma(Math.round(6706 * (1 - ease(clamp((t - 0.6) / 2))))) + '軒', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function shot2(t) { // 嫁は大喜び
  reset(); lift(150); wife.position.set(HX + 0.6, Math.abs(Math.sin(t * 6)) * 0.35, 0.4); wife.rotation.y = 0.3;
  wife.userData.arms.forEach((a, i) => { a.rotation.x = -2.9; a.rotation.z = (i ? -1 : 1) * 0.3 * Math.sin(t * 6); });
  payLab.position.set(HX + 0.6, 3.4 + Math.sin(t * 2) * 0.1, 0.4); pop(payLab, t, 0.4); yen.set(((t - 0.3) * 0.5) % 1);
  look(HX + 2.6, 2.6, 8.4, HX + 0.4, 1.6, 0, 50);
  return S;
}
function shot3(t) { // でもパチンカスはやめてない
  reset(); lift(150); shop.g.visible = false; QUEUE.forEach(p => p.visible = p === HERO); HERO.rotation.y = 0.2; heroLab(); handle(HERO, t);
  const u = ease(clamp(t / 3.3)); look(lerp(HERO.position.x + 3, HERO.position.x + 2.2, u), 2.4, lerp(7, 5.5, u), HERO.position.x, 1.6, HERO.position.z, 50);
  setTop('パチンカスの右手', '勝手に回る', fade(t, 0.15, 3.2, 0.25), RED);
  return S;
}
function shot4(t) { // 打ちたい気持ちはそのまま
  reset(); lift(150); shop.g.visible = false; QUEUE.forEach(p => p.visible = p === HERO); HERO.rotation.y = 0.2; handle(HERO, t * 1.5);
  want.position.set(HERO.position.x - 0.2, 2.55 + Math.sin(t * 3) * 0.05, HERO.position.z + 0.2); pop(want, t, 0.5, 0.35, 1.1);
  look(HERO.position.x + 1.6, 1.9, HERO.position.z + 3.6, HERO.position.x, 1.75, HERO.position.z, 46);
  return S;
}
function shot5(t) { // スマホの競馬とボート
  reset(); lift(80); S.background.set('#141a2c'); appScreen('day', t); bigLight.intensity = 30;
  phoneInHand(tapper, phoneS); phoneS.g.visible = false; tapper.userData.arms[0].rotation.x = -1.5 - Math.abs(Math.sin(t * 5)) * 0.2;
  look(SX + 1.2, 6, 13, SX + 0.8, 5.6, -3, 52);
  if (t < 2.0) setTop('競馬の売上（2024年度）', '約4.5兆円', fade(t, 0.15, 2.0, 0.25), GREEN);
  else setTop('そのうちネット投票', '約9割', fade(t, 2.0, 3.8, 0.25), GREEN);
  return S;
}
function shot6(t) { // パチンコ屋には深夜の門限があった（消える前の夜）
  reset(); lift(120); hemi.intensity = 0.6; shop.on(0.15); moon.visible = true; QUEUE.forEach(p => p.visible = false);
  pop(closed, t, 0.5); pop(lawLab, t, 1.1); const sl = 6 * easeBack(clamp((t - 1.1) / 0.35)); lawLab.scale.set(sl, sl * 192 / 1024, 1);
  look(0, 4.4, 16, 0, 4.2, -4, 52);
  return S;
}
function shot7(t) { // スマホの馬券に門限はない
  reset(); lift(80); S.background.set('#0d1120'); appScreen('night', t); bigLight.intensity = 34;
  tapper.userData.arms[0].rotation.x = -1.5;
  look(SX + 0.6, 6, 12.5, SX + 0.4, 5.8, -3, 52);
  setTop('スマホの馬券', '門限なし', fade(t, 0.15, 3.2, 0.25), BLUE);
  return S;
}
function inBed(t, sit = 0) { hus.visible = true; hus.position.set(BX + 0.85, 0.42 + sit * 0.0, -2.25 + sit * 0.4); hus.rotation.set(-Math.PI / 2 * (1 - sit), 0, 0); hus.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2 * sit); phoneInHand(hus, phoneS); phoneS.draw('bed', (g, w, h) => { g.fillStyle = '#1e8f4e'; g.fillRect(0, 0, w, h); }); glow.position.set(BX + 0.85, 1.4, -1.6); glow.intensity = 6 + Math.sin(t * 9) * 0.6; }
function shot8(t) { // 布団で1レース／トイレで1レース
  reset(); lift(140);
  if (t < 1.8) { hemi.intensity = 0.35; inBed(t, 1); look(BX + 2.2, 2.2, 2.4, BX + 0.6, 1.0, -1.6, 50); pop(betLab, t, 0.4, 0.35, 1.5); betLab.position.set(BX + 0.6, 1.6, -0.9); betLab.userData.set('布団で1レース'); }
  else { const k = t - 1.8; hus.visible = true; hus.position.set(TX, 0.0, -0.45); hus.rotation.set(0, 0, 0); hus.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); hus.position.y = -0.38; phoneInHand(hus, phoneS); phoneS.draw('toi', (g, w, h) => { g.fillStyle = '#1e8f4e'; g.fillRect(0, 0, w, h); });
    look(TX + 0.9, 1.6, 2.4, TX, 0.9, -0.6, 52); pop(betLab, k, 0.2, 0.35, 1.2); betLab.position.set(TX, 1.85, -0.2); betLab.userData.set('トイレで1レース'); }
  return S;
}
function shot9(t) { // 運動会のリレー中にも1レース
  reset(); lift(150); hemi.intensity = 1.25; S.background.set('#8fc3ef');
  KIDS.forEach((k, i) => { const a = t * 0.9 + i * 0.35 + 1.2; k.position.set(FX + Math.cos(a) * 7.7 * 1.6, 0, -6 + Math.sin(a) * 7.7); k.rotation.y = -a; const ph = t * 14 + i; const s = Math.sin(ph) * 0.8; k.userData.legs[0].rotation.x = s; k.userData.legs[1].rotation.x = -s; k.userData.arms[0].rotation.x = -s; k.userData.arms[1].rotation.x = s; });
  PARENTS.forEach((p, i) => { p.userData.arms.forEach(a => { a.rotation.x = -2.6 + Math.sin(t * 8 + i) * 0.3; }); });
  hus.visible = true; hus.position.set(FX + 0.2, 0, 4.4); hus.rotation.y = Math.PI; hus.userData.head.rotation.x = 0.5; phoneInHand(hus, phoneS); phoneS.draw('field', (g, w, h) => { g.fillStyle = '#1e8f4e'; g.fillRect(0, 0, w, h); });
  pop(cheer, t, 0.3, 0.35, 1.6); pop(betLab, t, 1.0, 0.35, 1.5); betLab.userData.set('11R 投票'); betLab.position.set(FX + 0.6, 2.55, 4.2);
  look(FX + 2.2, 2.0, 0.2, FX + 0.2, 1.5, 4.4, 52);
  return S;
}
function shot10(t) { // 深夜、寝ている嫁の横で全ツッパ
  reset(); lift(140); hemi.intensity = 0.3; inBed(t, 1); glow.intensity = 9;
  tsuppa.position.set(BX + 0.9, 1.8, -1.0); pop(tsuppa, t, 1.0, 0.35, 1.3);
  look(BX + 3.0, 2.8, 3.0, BX + 0.2, 0.9, -1.6, 50);
  setTop('深夜の海外レース', '全ツッパ', fade(t, 0.15, 3.7, 0.25), RED);
  return S;
}
function shot11(t) { // 通帳：名前が変わっただけ
  reset(); lift(60); S.background.set('#141a2c'); book.visible = true; big.g.visible = false; tapper.visible = false; drawBook(t < 1.6 ? 0 : 1);
  if (t > 1.5 && t < 1.7) el.flash.style.opacity = 0.25;
  look(SX, 6, 19, SX, 6, 0, 46);
  return S;
}
function shot12(t) { // 店に行かなくても負けられる（ソファでごろごろ）
  reset(); lift(140); hus.visible = true; hus.position.set(HX - 1.5, 0.75, -2.2); hus.rotation.set(0, 0.3, 0); hus.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); phoneInHand(hus, phoneS); phoneS.draw('sofa', (g, w, h) => { g.fillStyle = '#1e8f4e'; g.fillRect(0, 0, w, h); });
  lossFx.forEach((l, i) => { const u = ((t * 0.6 + i / 6) % 1); l.visible = true; l.position.set(HX - 1.2 + (i - 2.5) * 0.45, 2.0 + u * 2.0, -1.6); l.material.opacity = 1 - u; });
  wife.position.set(HX + 1.4, 0, 0.2); wife.rotation.y = -2.2; wife.userData.arms.forEach((a, i) => { a.rotation.x = -0.3; a.rotation.z = (i ? -1 : 1) * 0.9; });
  look(HX + 2.4, 2.8, 5.5, HX - 1.0, 1.6, -2.0, 52);
  setTop('家から一歩も出ずに', '負けられる', fade(t, 0.15, 3.5, 0.25), RED);
  return S;
}
function shot13(t) { // 結果：負ける場所がポケットに移るだけ
  reset(); lift(120); shop.g.visible = false; QUEUE.forEach(p => p.visible = p === HERO); hemi.intensity = 0.7;
  HERO.rotation.y = Math.PI; heroLab();
  HERO.updateMatrixWorld(true); pocketPhone.g.visible = true; const v = new THREE.Vector3(-0.12, 0.85, -0.17); HERO.localToWorld(v); pocketPhone.g.position.copy(v); pocketPhone.g.rotation.set(0, 0, 0);
  pocketPhone.draw('loss', (g, w, h) => { g.fillStyle = '#2a0a0a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff5a5a'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('-75,000', w / 2, h / 2); });
  pocketLab.position.set(HERO.position.x, 1.95, HERO.position.z + 0.9); pop(pocketLab, t, 0.8, 0.35, 1.15);
  const u = ease(clamp(t / 6)); look(lerp(HERO.position.x + 1.4, HERO.position.x + 0.9, u), 1.8, lerp(HERO.position.z + 3.6, HERO.position.z + 2.6, u), HERO.position.x, 1.3, HERO.position.z, 50);
  setTop('結果', 'パチンカスは治らない', fade(t, 0.15, 5.9, 0.25), RED);
  return S;
}
function shot14(t) { // パチンコ屋とは門限付きの檻だった
  reset(); lift(110); hemi.intensity = 0.8; QUEUE.forEach(p => { p.position.z = -2.0; });
  const u = clamp((t - 0.3) / 0.6); cage.visible = u > 0; cage.position.y = (1 - easeOut(u)) * 9;
  pop(cageLab, t, 1.0); pop(hoursLab, t, 1.6); const hs = 5.4 * easeBack(clamp((t - 1.6) / 0.35)); hoursLab.scale.set(hs, hs * 192 / 1024, 1);
  look(0, 6.5, 19, 0, 4.2, -3, 52);
  setTop('パチンコ屋の正体', '門限付きの檻', fade(t, 0.3, 4.4, 0.25), BLUE);
  return S;
}
function shot15(t) { // 質問。最後は冒頭と同じ構図（店は消えたまま。スマホを見つめるパチンカス）
  reset(); lift(120); shop.g.visible = false; QUEUE.forEach(p => p.visible = p === HERO); hemi.intensity = 0.7;
  HERO.rotation.y = 0.3; phoneInHand(HERO, phoneS); phoneS.draw('loop', (g, w, h) => { g.fillStyle = '#1e8f4e'; g.fillRect(0, 0, w, h); }); glow.position.set(HERO.position.x, 1.8, HERO.position.z + 0.6); glow.intensity = 5;
  streetCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.5, '日本中のパチンコ屋が、<br>この世から消えた。'],
  [6.6, 9.9, '嫁は大喜び。旦那の給料が、<br>やっと家に帰ってくる。'],
  [10.0, 13.3, 'でもパチンカスは、<br>ギャンブルをやめていない。'],
  [13.4, 16.7, '打つ場所が消えただけ。<br>打ちたい気持ちはそのまま。'],
  [16.8, 20.6, '行き着いた先は、スマホの<br>競馬とボートレース。'],
  [20.7, 24.3, 'パチンコ屋には、法律で<br>深夜の門限があった。'],
  [24.4, 27.7, 'でもスマホの馬券に、<br>門限はない。'],
  [27.8, 31.4, '布団の中で1レース。<br>トイレで1レース。'],
  [31.5, 35.1, '子どもの運動会の<br>リレー中にも1レース。'],
  [35.2, 39.0, '深夜、寝ている嫁の横で<br>海外レースに全ツッパ。'],
  [39.1, 43.2, '通帳を見た嫁は気づく。<br>名前が変わっただけ。'],
  [43.3, 46.9, 'しかも今度は、店に<br>行かなくても負けられる。'],
  [47.0, 53.0, '結果：パチンカスは治らない。<br>負ける場所が変わるだけ。'],
  [53.1, 57.6, 'パチンコ屋とは、パチンカスを<br>閉じこめる門限付きの檻だった。'],
  [57.7, 61.4, 'パチンコ屋、ないほうがマシ？<br>あるほうがマシ？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.4, f: shot3 },
  { a: 13.4, b: 16.8, f: shot4 }, { a: 16.8, b: 20.7, f: shot5 }, { a: 20.7, b: 24.4, f: shot6 }, { a: 24.4, b: 27.8, f: shot7 },
  { a: 27.8, b: 31.5, f: shot8 }, { a: 31.5, b: 35.2, f: shot9 }, { a: 35.2, b: 39.1, f: shot10 }, { a: 39.1, b: 43.3, f: shot11 },
  { a: 43.3, b: 47.0, f: shot12 }, { a: 47.0, b: 53.1, f: shot13 }, { a: 53.1, b: 57.7, f: shot14 }, { a: 57.7, b: 61.6, f: shot15 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0624',
    v2: true,
    hookLine: 'パチンコ屋が、全部消えた。',
    series: 'もしも消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもパチンコ屋が消えたら？',
    titleHtml: 'もしもパチンコ屋が<br>消えたら？',
    mood: 'tension', seed: 624, hits: [0.5, 47.0, 53.1], risers: [43.3], impacts: [10.0, 16.8, 24.4, 35.2, 39.1, 47.0, 53.1],
    sfx: [[0.5, 'poof'], [6.9, 'bubble'], [17.0, 'whoosh'], [21.2, 'buzz'], [28.2, 'bubble'], [36.2, 'alarm'], [40.7, 'buzz'], [53.5, 'whoosh']],
    narr: { 'パチンカス': 'ぱちんかす', '全ツッパ': 'ぜんツッパ', '1レース': 'ひとレース', '嫁': 'よめ', '旦那': 'だんな', '結果：': '結果、' },
    ask: 'パチンコ屋、ないほうがマシ？あるほうがマシ？',
    caption: 'もしも日本中のパチンコ屋が消えたら？\n\n嫁は大喜び。旦那の給料がやっと家に帰ってくる…はずだった。\nでもパチンカスはギャンブルをやめたわけじゃない。行き着いた先はスマホの競馬とボートレース。\nパチンコ屋には法律で深夜の門限があった。でもスマホの馬券に門限はない。\n布団で1レース、トイレで1レース、子どもの運動会のリレー中にも1レース。\n\n結果：パチンカスは治らない。負ける場所が、店からポケットに移るだけ。\nパチンコ屋とは、パチンカスを閉じこめる門限付きの檻だったのかもしれない。\n\nパチンコ屋、ないほうがマシ？あるほうがマシ？ コメントで教えて。\n\n※風刺ネタです\n出典：警察庁「令和6年における風俗営業等の現状」（パチンコ店 6,706軒・2024年末）、財務省 広報誌ファイナンス（競馬の売上 約4.5兆円・ネット投票 約9割・2024年度）',
    hashtags: ['もしもラボ', 'もしも', 'パチンコ', '競馬', 'ギャンブル'],
    endStats: [['全国のパチンコ店（2024年末）', '6,706軒', '5年で約2,300軒減'], ['競馬の売上（2024年度）', '約4.5兆円', 'ネット投票 約9割'], ['パチンコ屋の正体', '門限付きの檻', 'かもしれない']],
    sources: '出典：警察庁「令和6年における風俗営業等の現状」、<br>財務省 広報誌ファイナンス（2026年8月号）',
  },
});
