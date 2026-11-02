import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom, makePhone } from '../satire-kit.js';

// もしも男女の給料が逆転したら？（皮肉回・台本 S03）
// 2026/11/02 ゆうと承認。元ネタ：Togetter「専業主夫を養う妻が、自分のモラハラ気質に気づく」
// 数字：男女間賃金格差（男性＝100）で女性は 76.6（厚生労働省「令和7年 賃金構造基本統計調査」2026年3月24日公表）

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#1e2230'); S.fog = new THREE.Fog(0x1e2230, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3440, 1.1); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(8, 18, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#262a36', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// ---------- A：給与明細（原点） ----------
function slip(name, amt, col) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 720; const g = c.getContext('2d');
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 512, 720); g.fillStyle = col; g.fillRect(0, 0, 512, 110); g.fillStyle = '#fff'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('給与明細', 256, 56);
  g.fillStyle = '#333'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText(name, 256, 220); g.font = '700 34px "Noto Sans CJK JP", sans-serif'; g.fillStyle = '#888'; g.fillText('支給額', 256, 360); g.fillStyle = '#222'; g.font = '900 76px "Noto Sans CJK JP", sans-serif'; g.fillText(amt, 256, 450);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TX = { m0: slip('夫', '373,400円', '#3f7fd0'), m1: slip('夫', '285,900円', '#3f7fd0'), w0: slip('妻', '285,900円', '#e05a8a'), w1: slip('妻', '373,400円', '#e05a8a') };
const SLIP_M = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.8125), new THREE.MeshBasicMaterial({ map: TX.m0, side: THREE.DoubleSide })); S.add(SLIP_M);
const SLIP_W = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.8125), new THREE.MeshBasicMaterial({ map: TX.w0, side: THREE.DoubleSide })); S.add(SLIP_W);
const swapFx = makeSparkles(260, 0.25, 0xffd27a); S.add(swapFx.points); swapFx.init([[0, 2.6, 0]], 2.4, 2);
function slips(u) { const e = ease(clamp(u)); const r = e < 0.5 ? Math.PI * e : Math.PI * (e - 1); const k = e < 0.5 ? 0 : 1;
  SLIP_M.position.set(-1.15, 2.5, 0); SLIP_W.position.set(1.15, 2.5, 0); SLIP_M.rotation.y = r; SLIP_W.rotation.y = -r;
  SLIP_M.material.map = k ? TX.m1 : TX.m0; SLIP_W.material.map = k ? TX.w1 : TX.w0; }
// 賃金のバー
const barM = box(1.4, 1, 1.2, mat('#7fb0e8')); barM.geometry.translate(0, 0.5, 0); barM.position.set(-1.3, 0, -6); S.add(barM);
const barF = box(1.4, 1, 1.2, mat('#ff8ab0')); barF.geometry.translate(0, 0.5, 0); barF.position.set(1.3, 0, -6); S.add(barF);
const vM = label('男性 100', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.6 }); S.add(vM);
const vF = label('女性 76.6', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.6 }); S.add(vF);

// ---------- B：家（x=60） ----------
const HX = 60;
const home = makeRoom({ w: 10, d: 8, wall: '#efe6d8', floor: '#b48a5e' }); home.position.set(HX, 0, 0); home.userData.rw.visible = false; S.add(home);
const door = box(1.3, 2.4, 0.1, mat('#7a5a3a')); door.position.set(HX - 3.2, 1.2, -3.9); S.add(door);
const dtable = box(1.8, 0.8, 1.1, mat('#c9a27a')); dtable.position.set(HX + 1.6, 0.4, -1.6); S.add(dtable);
const micro = box(0.8, 0.5, 0.55, mat('#e4e7ec')); micro.position.set(HX + 3.6, 1.25, -3.5); S.add(micro);
const counter = box(2.4, 1.0, 0.7, mat('#d6dbe4')); counter.position.set(HX + 3.4, 0.5, -3.5); S.add(counter);
const sofa = box(3, 0.6, 1.1, mat('#5a6b8a')); sofa.position.set(HX - 1.2, 0.3, -2.6); S.add(sofa);
const WIFE = makeWoman({ shirt: '#2b3346', hair: '#3a2620' }); S.add(WIFE);
const wtie = box(0.07, 0.36, 0.02, mat('#b23a3a')); wtie.position.set(0, 1.24, 0.15); WIFE.add(wtie);
const HUS = makeMan({ shirt: '#e9e4da', hair: '#1d1a19' }); S.add(HUS);
const apron = box(0.46, 0.7, 0.04, mat('#ff9ec7')); apron.position.set(0, 1.0, 0.16); HUS.add(apron);
const dare = label('誰が食わせてると思ってるの', { w: 1024, size: 80, color: '#fff', bg: 'rgba(200,50,60,.92)', sx: 2.6 }); S.add(dare);
const kiwo = label('気をつかう', { size: 120, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 1.2 }); S.add(kiwo);
const clock = label('23:30', { w: 512, h: 192, size: 150, color: '#fff', bg: 'rgba(20,20,30,.9)', sx: 1.1 }); clock.position.set(HX + 3.0, 2.4, -3.85); S.add(clock);
const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 18), mat('#ffffff')); S.add(plate);
const steam = makeSparkles(80, 0.18, 0xffffff); S.add(steam.points); steam.init([[HX + 3.6, 1.6, -3.4]], 0.3, 1.2);
const PHRASES = ['家事くらいやって', '若いうちに結婚しないと', '料理できないの？', '男は愛嬌'].map(s => { const l = label(s, { w: 1024, size: 86, color: '#fff', bg: 'rgba(200,90,120,.92)', sx: 1.9 }); S.add(l); return l; });
// 掲示板と婚活のスマホ（x=110）
const PX = 110;
const big = makePhone({ w: 2.6, h: 5.2 }); big.g.position.set(PX, 2.8, -0.4); S.add(big.g);
const pfloor = new THREE.Mesh(new THREE.CircleGeometry(5, 40), mat('#2a2640', { depthWrite: false })); pfloor.rotation.x = -Math.PI / 2; pfloor.position.set(PX, 0.02, 0); pfloor.renderOrder = -0.8; S.add(pfloor);
function bbs(t) { big.draw('bbs' + Math.min(5, Math.floor(t * 1.6)), (g, w, h) => { g.fillStyle = '#eef2f7'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a6a90'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.font = '900 46px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('夫たちの本音掲示板', w / 2, 62);
  const posts = ['妻が家事を手伝ってくれない', '飲み会で毎晩遅い', '誰が食わせてるのって言われた', '僕も外で働きたかった', '妻の実家がつらい'];
  posts.slice(0, Math.min(5, Math.floor(t * 1.6) + 1)).forEach((p, i) => { const y = 150 + i * 150; g.fillStyle = '#fff'; g.fillRect(24, y, w - 48, 130); g.fillStyle = '#888'; g.font = '700 26px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText('名無しの夫さん', 44, y + 34); g.fillStyle = '#222'; g.font = '900 36px "Noto Sans CJK JP", sans-serif'; g.fillText(p, 44, y + 86); }); }); }
function konkatsu(t) { big.draw('kk' + (t > 1.2 ? 1 : t > 0.6 ? 's' : 0), (g, w, h) => { g.fillStyle = '#f0f6ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#3f7fd0'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.font = '900 46px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('女性が男性に求める条件', w / 2, 62);
  const rows = t > 1.2 ? ['家事ができる', '優しい', '料理が上手', '実家に帰れる'] : ['年収', '学歴', '身長', '職業']; rows.forEach((r, i) => { const y = 170 + i * 150; g.fillStyle = '#fff'; g.fillRect(30, y, w - 60, 130); g.fillStyle = '#222'; g.font = '900 50px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText(r, 60, y + 66); if (t <= 1.2 && i === 0 && t > 0.6) { g.strokeStyle = '#d23a3a'; g.lineWidth = 8; g.beginPath(); g.moveTo(50, y + 66); g.lineTo(w - 60, y + 66); g.stroke(); } }); }); }
// 稼ぐ女たちの飲み会（x=160）
const IX = 160;
const izk = makeRoom({ w: 10, d: 7, wall: '#c8a878', floor: '#6a4a30' }); izk.position.set(IX, 0, 0); izk.userData.rw.visible = false; S.add(izk);
const itable = box(3.6, 0.75, 1.4, mat('#5a3a24')); itable.position.set(IX, 0.37, 0); S.add(itable);
const LADIES = []; for (let i = 0; i < 4; i++) { const p = makeWoman({ shirt: ['#2b3346', '#3f3f46', '#4f5a6a', '#2b3346'][i], hair: ['#3a2620', '#1d1a19'][i % 2] }); p.position.set(IX - 1.2 + (i % 2) * 2.4, 0, i < 2 ? -1.2 : 1.2); p.rotation.y = i < 2 ? 0 : Math.PI; S.add(p); LADIES.push(p); }
const kuchi = label('稼ぐと口が悪くなる', { w: 1024, size: 96, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 2.4 }); kuchi.position.set(IX, 2.8, 0); S.add(kuchi);
// 財布の綱引き（x=210）
const WX = 210;
const wfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2640', { depthWrite: false })); wfloor.rotation.x = -Math.PI / 2; wfloor.position.set(WX, 0.02, 0); wfloor.renderOrder = -0.8; S.add(wfloor);
const wallet = box(1.6, 1.0, 0.3, mat('#7a4a2a')); wallet.position.set(WX, 1.2, 0); S.add(wallet);
const yen = label('¥', { w: 256, h: 256, size: 220, color: '#ffd27a', sx: 0.8 }); yen.position.set(WX, 1.2, 0.2); S.add(yen);
const ropeL = box(0.9, 0.06, 0.06, mat('#c9a070')); ropeL.position.set(WX - 1.25, 1.2, 0); S.add(ropeL);
const ropeR = box(0.9, 0.06, 0.06, mat('#c9a070')); ropeR.position.set(WX + 1.25, 1.2, 0); S.add(ropeR);
const PM = makeMan({ shirt: '#e9e4da' }); PM.position.set(WX - 3.2, 0, 0); PM.rotation.y = Math.PI / 2; S.add(PM);
const PW = makeWoman({ shirt: '#2b3346' }); PW.position.set(WX + 3.2, 0, 0); PW.rotation.y = -Math.PI / 2; S.add(PW);
const saifu = label('財布の争い', { size: 120, color: '#fff', bg: 'rgba(200,150,40,.95)', sx: 1.8 }); saifu.position.set(WX, 2.8, 0); S.add(saifu);

function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; }
function reset() {
  slips(0); swapFx.set(0); barM.scale.y = 0.001; barF.scale.y = 0.001; vM.visible = false; vF.visible = false;
  [WIFE, HUS, ...LADIES, PM, PW].forEach(poseReset); WIFE.position.set(HX - 3.0, 0, -2.8); WIFE.rotation.set(0, 0.4, 0); HUS.position.set(HX - 0.6, 0, -0.8); HUS.rotation.set(0, -0.6, 0);
  dare.visible = false; kiwo.visible = false; clock.visible = false; plate.visible = false; steam.set(0); PHRASES.forEach(l => l.visible = false); kuchi.visible = false; saifu.visible = false;
  hemi.intensity = 1.1; S.background.set('#1e2230'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function slipCam(t, d = 0) { look(0, 2.4, lerp(8.6, 9.2, d), 0, 2.3, 0, 52); }
function shot0(t) { // 0秒＝サムネ：夫と妻の給与明細。0.5秒でくるっと入れ替わる
  reset(); lift(0); const k = t - TP; slips(k > 0 ? clamp(k / 0.7) : 0); swapFx.set(k > 0 ? clamp(k / 1.4) : 0); el.flash.style.opacity = k > 0.6 && k < 0.8 ? 0.25 : 0;
  slipCam(t, ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // ある日、日本中の男女の給料がまるごと入れ替わった
  reset(); lift(0); slips(1); swapFx.set(0.4 + 0.2 * Math.sin(t)); slipCam(t, 1);
  setTop('男女の給料', 'まるごと逆転', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function barsAt(t, swapped) { const H = 0.042; const a = swapped ? 76.6 : 100, b = swapped ? 100 : 76.6; const u = easeOut(clamp((t - 0.2) / 1.2)); barM.scale.y = Math.max(0.001, a * H * u); barF.scale.y = Math.max(0.001, b * H * u);
  vM.visible = vF.visible = true; vM.userData.set('男性 ' + (swapped ? '76.6' : '100')); vF.userData.set('女性 ' + (swapped ? '100' : '76.6')); vM.position.set(-1.3, a * H * u + 0.5, -5.4); vF.position.set(1.3, b * H * u + 0.5, -5.4);
  look(0, 2.8, 4.2, 0, 2.6, -6, 52); }
function shot2(t) { // 今、女性の賃金は男性の約77%
  reset(); lift(150); SLIP_M.position.y = -10; SLIP_W.position.y = -10; barsAt(t, false);
  setTop('女性の賃金（男性＝100・2025年）', '76.6', fade(t, 0.15, 3.2, 0.25), PINK);
  return S;
}
function shot3(t) { // それがひっくり返る。女性は大喜び
  reset(); lift(150); SLIP_M.position.y = -10; SLIP_W.position.y = -10; barsAt(t + 2, t > 0.8); if (t > 0.8 && t < 1.0) el.flash.style.opacity = 0.2;
  return S;
}
function homeCam(t) { look(HX + 1.0, 2.4, 4.4, HX - 1.4, 1.5, -1.8, 52); }
function shot4(t) { // 1か月後、帰宅した妻が言う。誰が食わせてると思ってるの
  reset(); lift(110); WIFE.userData.arms[1].rotation.x = -1.0; WIFE.userData.arms[1].rotation.z = -0.3; HUS.userData.head.rotation.x = 0.3;
  dare.position.set(HX - 1.4, 3.0, -2.2); pop(dare, t, 0.5, 0.35, 2.1);
  homeCam(t);
  return S;
}
function shot5(t) { // 夫は、機嫌の悪い妻に気をつかい始める
  reset(); lift(110); WIFE.position.set(HX - 1.2, 0.3, -2.5); WIFE.rotation.y = 0; WIFE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); HUS.position.set(HX + 0.2, 0, -1.2); HUS.rotation.y = -1.0; HUS.userData.head.rotation.x = 0.4; HUS.userData.arms.forEach(a => a.rotation.x = -0.6);
  kiwo.position.set(HX + 0.2, 2.5, -1.0); pop(kiwo, t, 0.6, 0.3, 1.1);
  look(HX + 1.8, 2.2, 3.4, HX - 0.4, 1.3, -1.8, 52);
  return S;
}
function shot6(t) { // 飲み会で遅くなる妻。晩ごはんを温め直す夫
  reset(); lift(110); hemi.intensity = 0.5; S.background.set('#0e0c18'); WIFE.position.set(HX - 8, 0, 0); HUS.position.set(HX + 3.0, 0, -2.6); HUS.rotation.y = Math.PI * 0.85; HUS.userData.arms.forEach(a => a.rotation.x = -1.2);
  clock.visible = true; clock.userData.size(1.1); clock.userData.set(t < 1.8 ? '23:30' : '0:15'); steam.set(0);
  look(HX + 1.4, 2.2, 2.2, HX + 2.8, 1.4, -2.8, 52);
  return S;
}
function shot7(t) { // 夫たちは掲示板に集まって、妻の愚痴を書き込み始める
  reset(); lift(60); bbs(t); look(PX, 2.9, 6.6, PX, 2.8, -0.4, 52);
  return S;
}
function shot8(t) { konkatsu(Math.min(t * 0.4, 1.1)); return shot7c(t, '婚活の条件欄', '男性の年収が消える'); } // 婚活の条件欄から、男性の年収が消える
function shot9(t) { konkatsu(t + 2); return shot7c(t, '代わりに求められる', '家事・優しさ'); } // 代わりに書かれるのは、家事ができる人・優しい人
function shot7c(t, a, b) { lift(60); look(PX, 2.9, 6.6, PX, 2.8, -0.4, 52); setTop(a, b, fade(t, 0.15, 3.4, 0.25), BLUE); return S; }
function shot10(t) { // 女が言われてきたことを、今度は男が全部言われる
  reset(); lift(110); HUS.position.set(HX, 0, -0.8); HUS.rotation.y = 0; HUS.userData.head.rotation.x = 0.3;
  PHRASES.forEach((l, i) => { l.position.set(HX + (i % 2 ? 0.55 : -0.55), 3.9 - i * 0.5, -0.4); pop(l, t, 0.3 + i * 0.6, 0.3, 1.85); });
  look(HX, 2.2, 6.4, HX, 2.1, -0.8, 52);
  return S;
}
function shot11(t) { // 女は稼ぐと口が悪くなる、と言われ始める
  reset(); lift(110); S.background.set('#c8a878'); LADIES.forEach((p, i) => { p.userData.arms[1].rotation.x = -1.6 + Math.sin(t * 6 + i) * 0.4; p.userData.head.rotation.x = -0.2; });
  pop(kuchi, t, 0.6, 0.35, 2.2);
  look(IX + 0.6, 3.0, 5.2, IX, 1.3, 0, 52);
  return S;
}
function shot12(t) { // 結果：口が悪くなったのは、男ではなく稼いでる側
  reset(); lift(110); WIFE.position.set(HX - 1.2, 0.3, -2.5); WIFE.rotation.y = 0; WIFE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); WIFE.userData.arms[1].rotation.x = -1.0;
  HUS.position.set(HX + 0.4, 0, -1.4); HUS.rotation.y = -1.2; HUS.userData.arms.forEach(a => a.rotation.x = -1.3); plate.visible = true; plate.position.set(HX + 0.0, 1.15, -1.25);
  const u = ease(clamp(t / 6)); look(HX + lerp(2.4, 1.6, u), 2.4, lerp(4.2, 3.4, u), HX - 0.4, 1.2, -2.0, 52);
  setTop('結果', '口が悪いのは稼ぐ側', fade(t, 0.15, 5.8, 0.25), RED);
  return S;
}
function shot13(t) { // 男女の争いだと思ったものは、財布の争いだったのかも
  reset(); lift(110); S.background.set('#141228'); const s = Math.sin(t * 3) * 0.25; wallet.position.x = WX + s; ropeL.position.x = WX - 1.25 + s * 0.6; ropeR.position.x = WX + 1.25 + s * 0.6; wallet.position.x = WX + s * 0.6; yen.position.x = WX + s * 0.6; PM.position.x = WX - 1.75 + s * 0.6; PW.position.x = WX + 1.75 + s * 0.6;
  [PM, PW].forEach(p => { p.userData.arms.forEach(a => { a.rotation.x = -1.5; }); p.rotation.z = 0; }); PM.rotation.x = 0; pop(saifu, t, 0.5, 0.35, 1.6);
  look(WX, 2.2, 8.4, WX, 1.6, 0, 52);
  setTop('男女の争いの正体', '財布の争い', fade(t, 0.3, 5.8, 0.25), GOLD);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（給与明細は入れ替わったまま）
  reset(); lift(0); slips(1); look(0, 2.0, 8.6, 0, 1.7, 0, 52);
  return S;
}

const SUBS = [
  [3.2, 6.5, 'ある日、日本中の男女の<br>給料がまるごと入れ替わった。'],
  [6.6, 9.9, '今、女性の賃金は<br>男性の約77%。'],
  [10.0, 13.4, 'それがひっくり返る。<br>女性は大喜び。'],
  [13.5, 17.0, '1か月後、帰宅した妻が言う。<br>誰が食わせてると思ってるの。'],
  [17.1, 20.6, '夫は、機嫌の悪い妻に<br>気をつかい始める。'],
  [20.7, 24.2, '飲み会で遅くなる妻。<br>晩ごはんを温め直す夫。'],
  [24.3, 27.9, '夫たちは掲示板に集まって、<br>妻の愚痴を書き込み始める。'],
  [28.0, 31.6, '婚活の条件欄から、<br>男性の年収が消える。'],
  [31.7, 35.3, '代わりに書かれるのは、<br>家事ができる人・優しい人。'],
  [35.4, 39.0, '女が言われてきたことを、<br>今度は男が全部言われる。'],
  [39.1, 42.8, '女は稼ぐと口が悪くなる、<br>と言われ始める。'],
  [42.9, 48.8, '結果：口が悪くなったのは、<br>男ではなく稼いでる側。'],
  [48.9, 55.0, '男女の争いだと思ったものは、<br>財布の争いだったのかも。'],
  [55.1, 61.3, '稼いでる方が偉くなるのは、<br>仕方ない？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.5, f: shot3 },
  { a: 13.5, b: 17.1, f: shot4 }, { a: 17.1, b: 20.7, f: shot5 }, { a: 20.7, b: 24.3, f: shot6 }, { a: 24.3, b: 28.0, f: shot7 },
  { a: 28.0, b: 31.7, f: shot8 }, { a: 31.7, b: 35.4, f: shot9 }, { a: 35.4, b: 39.1, f: shot10 }, { a: 39.1, b: 42.9, f: shot11 },
  { a: 42.9, b: 48.9, f: shot12 }, { a: 48.9, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0631',
    v2: true,
    hookLine: '男女の給料が、まるごと入れ替わった。',
    series: '',  // 消えたら回ではないのでバッジなし（皮肉回の柱名は未定）
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしも男女の給料が逆転したら？',
    titleHtml: 'もしも男女の給料が<br>逆転したら？',
    mood: 'tension', seed: 631, hits: [0.5, 42.9, 48.9], risers: [39.1], impacts: [6.6, 10.0, 13.5, 24.3, 28.0, 35.4, 42.9, 48.9],
    sfx: [[0.5, 'whoosh'], [10.8, 'bubble'], [14.0, 'buzz'], [21.0, 'bubble'], [28.6, 'buzz'], [35.8, 'bubble'], [49.2, 'whoosh']],
    narr: { '約77%': 'やくななじゅうななパーセント', '結果：': '結果、' },
    ask: '稼いでる方が偉くなるのは仕方ない？',
    caption: 'もしも日本中の男女の給料が、まるごと入れ替わったら？\n\n今、女性の賃金は男性の約77%。それがひっくり返る。女性は大喜び。\n1か月後、帰宅した妻が言う。誰が食わせてると思ってるの。\n飲み会で遅くなる妻。晩ごはんを温め直す夫。夫たちは掲示板に集まって、妻の愚痴を書き込み始める。\n婚活の条件欄から男性の年収が消えて、代わりに書かれるのは、家事ができる人・優しい人。\n\n結果：口が悪くなったのは、男ではなく稼いでる側。\n男女の争いだと思ったものは、財布の争いだったのかもしれない。\n\n稼いでる方が偉くなるのは仕方ない？ コメントで教えて。\n\n※風刺ネタです。給与明細の金額は令和7年の一般労働者の男女の賃金（月額）をもとにした演出です\n出典：厚生労働省「令和7年 賃金構造基本統計調査」（男女間賃金格差 男性＝100で女性76.6）',
    hashtags: ['もしもラボ', 'もしも', '男女の賃金', '共働き', '夫婦'],
    endStats: [['女性の賃金（男性＝100）', '76.6', '厚労省 2025年'], ['逆転した家で言われる', '誰が食わせてるの', '稼いでる側'], ['男女の争いの正体', '財布の争い', 'かもしれない']],
    sources: '出典：厚生労働省「令和7年 賃金構造基本統計調査」',
  },
});
