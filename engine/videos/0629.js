import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';

// もしも疲れが数字で見えたら？（皮肉回・台本 S05）
// 2026/11/02 ゆうと承認。元ネタ：ガルちゃん「仕事で疲れてるからお前がやれと言う夫」
// 数字：6歳未満の子がいる夫婦の1日の家事関連時間（総務省統計局「令和3年社会生活基本調査結果における6歳未満の子供を持つ夫の家事関連時間の増加について」2023年12月）
//  夫 114分（1時間54分）、共働きの妻 393分（6時間33分）、無業の妻 565分（9時間25分）
// 疲れのメーター（62・98）は演出（実在の数値ではない）

const GOLD = '#ffd27a', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a', PINK = '#ff9ec7';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2436'); S.fog = new THREE.Fog(0x2a2436, 40, 160);
const hemi = new THREE.HemisphereLight(0xfff4e6, 0x3a3040, 1.1); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(8, 18, 12); S.add(sun);

// ---------- 家（原点）：玄関側とリビング ----------
const room = makeRoom({ w: 11, d: 8, wall: '#efe6d8', floor: '#b48a5e' }); room.userData.rw.visible = false; S.add(room);
const door = box(1.3, 2.4, 0.1, mat('#7a5a3a')); door.position.set(-3.8, 1.2, -3.9); S.add(door);
const sofa = new THREE.Group(); { const b = box(3.2, 0.55, 1.1, mat('#5a6b8a')); b.position.y = 0.4; sofa.add(b); const bk = box(3.2, 0.9, 0.3, mat('#4f5f7c')); bk.position.set(0, 0.95, -0.45); sofa.add(bk); } sofa.position.set(2.2, 0, -2.6); S.add(sofa);
const sink = box(2.2, 0.95, 0.7, mat('#d6dbe4')); sink.position.set(-1.2, 0.47, -3.5); S.add(sink);
const HUS = makeMan({ shirt: '#ffffff', hair: '#1d1a19' }); S.add(HUS);
const tie = box(0.08, 0.38, 0.02, mat('#2f4a7a')); tie.position.set(0, 1.24, 0.15); HUS.add(tie);
const jacket = []; for (const s of [-1, 1]) { const j = box(0.2, 0.62, 0.3, mat('#2b3346')); j.position.set(s * 0.17, 1.17, 0.0); HUS.add(j); jacket.push(j); }
const WIFE = makeWoman({ shirt: '#c9a8d8', hair: '#3a2620' }); S.add(WIFE);
const BABY = new THREE.Group(); { const b = box(0.34, 0.5, 0.28, mat('#fff3c0')); BABY.add(b); const h = box(0.26, 0.26, 0.24, mat('#f5d3b5')); h.position.y = 0.36; BABY.add(h); } S.add(BABY);
const KID = makeMan({ shirt: '#f2c14e', hair: '#3a2620', scale: 0.55 }); S.add(KID);
// 疲れのメーター（頭の上）
function makeMeter() {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.22), new THREE.MeshBasicMaterial({ color: '#1a1a22', transparent: true, opacity: 0.85, depthTest: false })); bg.renderOrder = 8; g.add(bg);
  const fillM = new THREE.MeshBasicMaterial({ color: '#9be86a', depthTest: false, transparent: true, opacity: 1 }); const fill = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.15), fillM); fill.renderOrder = 9; fill.position.z = 0.01; fill.geometry.translate(0.71, 0, 0); fill.position.x = -0.71; g.add(fill);
  const num = label('0', { w: 512, h: 192, size: 150, color: '#fff', stroke: 16, strokeColor: '#1a1a22', sx: 1.0 }); num.position.y = 0.34; num.material.depthTest = false; num.renderOrder = 9; g.add(num);
  const cap = label('疲れ', { w: 512, h: 160, size: 100, color: '#fff', bg: 'rgba(30,30,40,.85)', sx: 0.6 }); cap.position.set(-0.55, 0.34, 0); cap.material.depthTest = false; cap.renderOrder = 9; g.add(cap);
  S.add(g);
  function set(v, blink = 0) { const u = clamp(v / 100); fill.scale.x = Math.max(0.001, u); fillM.color.set(u < 0.5 ? '#9be86a' : u < 0.8 ? '#ffd27a' : (blink && Math.floor(blink * 4) % 2 ? '#ff2a2a' : '#ff5a5a')); num.userData.set(String(Math.round(v))); }
  return { g, set };
}
const MH = makeMeter(), MW = makeMeter();
const sorry = label('俺は仕事で疲れてるから', { w: 1024, size: 92, color: '#fff', bg: 'rgba(60,70,90,.95)', sx: 2.6 }); S.add(sorry);
const batsu = label('×', { w: 256, h: 256, size: 230, color: '#ff3b3b', sx: 1.0 }); S.add(batsu);
const wakaru = label('分かってもらえる', { w: 1024, size: 96, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 2.2 }); S.add(wakaru);
const kyukei = label('休憩中', { size: 120, color: '#fff', bg: 'rgba(60,90,160,.92)', sx: 1.1 }); S.add(kyukei);
const kado = label('稼働中', { size: 120, color: '#fff', bg: 'rgba(200,60,60,.92)', sx: 1.1 }); S.add(kado);
const clock = label('21:00', { w: 512, h: 192, size: 150, color: '#fff', bg: 'rgba(20,20,30,.9)', sx: 1.3 }); S.add(clock);
const gyaa = label('ギャー', { size: 140, color: '#fff', bg: 'rgba(230,80,80,.92)', sx: 1.0 }); S.add(gyaa);
const PHONE = box(0.12, 0.22, 0.02, mat('#15161c')); S.add(PHONE);
const laundry = []; for (let i = 0; i < 5; i++) { const l = box(0.4, 0.06, 0.3, mat(['#9fc7e8', '#ffffff', '#f2c14e', '#c9a8d8', '#9fdcae'][i])); S.add(l); laundry.push(l); }
// ---------- 比べる（x=60）：家事・育児の時間のバー ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2640', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, 0); bfloor.renderOrder = -0.8; S.add(bfloor);
const barH = box(1.4, 1, 1.2, mat('#7fb0e8')); barH.geometry.translate(0, 0.5, 0); barH.position.set(BX - 1.3, 0, 0); S.add(barH);
const barW = box(1.4, 1, 1.2, mat('#ff8ab0')); /* 共働きの妻 6.55時間 */ barW.geometry.translate(0, 0.5, 0); barW.position.set(BX + 1.3, 0, 0); S.add(barW);
const lbH = label('夫', { size: 130, color: '#fff', bg: 'rgba(40,40,50,.85)', sx: 0.8 }); lbH.position.set(BX - 1.3, -0.2, 1.0); S.add(lbH);
const lbW = label('妻', { size: 130, color: '#fff', bg: 'rgba(40,40,50,.85)', sx: 0.8 }); lbW.position.set(BX + 1.3, -0.2, 1.0); S.add(lbW);
const vH = label('1時間54分', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#1a1a22', sx: 1.7 }); S.add(vH);
const vW = label('6時間33分', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#1a1a22', sx: 1.7 }); S.add(vW);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#1e1a28', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

function holdBaby(p, b) { p.userData.arms.forEach(a => { a.rotation.x = -1.2; a.rotation.z = 0; }); p.updateMatrixWorld(true); const v = new THREE.Vector3(0, 1.15, 0.32); p.localToWorld(v); b.position.copy(v); b.rotation.set(0, p.rotation.y, 0.25); }
function reset() {
  HUS.position.set(-3.2, 0, -2.6); HUS.rotation.set(0, 0.3, 0); HUS.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); HUS.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); HUS.userData.head.rotation.set(0, 0, 0); jacket.forEach(j => j.visible = true);
  WIFE.position.set(0.4, 0, -0.6); WIFE.rotation.set(0, -0.4, 0); WIFE.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); WIFE.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); WIFE.userData.head.rotation.set(0, 0, 0);
  holdBaby(WIFE, BABY); KID.position.set(1.2, 0, -0.2); KID.rotation.y = -0.6;
  MH.g.visible = false; MW.g.visible = false; sorry.visible = false; batsu.visible = false; wakaru.visible = false; kyukei.visible = false; kado.visible = false; clock.visible = false; gyaa.visible = false; PHONE.visible = false; laundry.forEach(l => l.visible = false);
  vH.visible = false; vW.visible = false; barH.scale.y = 0.001; barW.scale.y = 0.001;
  hemi.intensity = 1.1; S.background.set('#2a2436'); el.flash.style.opacity = 0; setHud('', '', 0);
}
function meterOn(M, p, v, blink = 0) { M.g.visible = true; M.g.position.set(p.position.x, p.position.y + 2.25, p.position.z); M.set(v, blink); }
// メーターは最後にカメラの方へ向ける（look のあとに呼ぶ）
function fin() { for (const M of [MH, MW]) if (M.g.visible) M.g.quaternion.copy(cam.quaternion); return S; }
const TP = 0.5;
function doorCam(t, d = 0) { look(lerp(-1.6, -1.9, d), lerp(2.6, 2.7, d), lerp(2.0, 2.6, d), -3.2, 2.5, -2.6, 56); }
function shot0(t) { // 0秒＝サムネ：玄関でネクタイをゆるめる夫。0.5秒で頭の上にメーター
  reset(); lift(60); HUS.userData.arms[1].rotation.x = -2.2; HUS.userData.arms[1].rotation.z = 0.5 + Math.sin(t * 6) * 0.1; doorCam(t, ease(clamp(t / 3.2)));
  const k = t - TP; if (k > 0) { meterOn(MH, HUS, 62 * easeOut(clamp(k / 0.8))); const s = easeBack(clamp(k / 0.3)); MH.g.scale.setScalar(s); } else MH.g.scale.setScalar(1);
  el.flash.style.opacity = k > 0 ? 0.35 * Math.max(0, 1 - k / 0.25) : 0;
  return fin();
}
function shot1(t) { // ある日、人の疲れが数字で見えるようになった
  reset(); lift(80); MH.g.scale.setScalar(1); MW.g.scale.setScalar(1);
  look(0.2, 3.4, 6.6, -1.2, 1.6, -1.6, 52); meterOn(MH, HUS, 62); meterOn(MW, WIFE, 98 * easeOut(clamp(t / 1.2)));
  setTop('人の疲れが', '数字で見える', fade(t, 0.15, 3.2, 0.25), GOLD);
  return fin();
}
function shot2(t) { // 夫は喜ぶ。これで仕事の大変さを分かってもらえる
  reset(); lift(80); MH.g.scale.setScalar(1); HUS.userData.arms.forEach(a => { a.rotation.x = -2.8; }); HUS.position.y = Math.abs(Math.sin(t * 5)) * 0.15;
  meterOn(MH, HUS, 62); wakaru.position.set(HUS.position.x, 3.4, HUS.position.z); pop(wakaru, t, 0.6, 0.35, 1.8); wakaru.position.y = 3.3;
  doorCam(t, 1);
  return fin();
}
function shot3(t) { // 夫の疲れ、62
  reset(); lift(80); MH.g.scale.setScalar(1.3); meterOn(MH, HUS, 62); MH.g.position.y = 2.35;
  look(-2.5, 2.5, 1.4, -3.2, 2.2, -2.6, 46);
  setTop('夫の疲れ', '62', fade(t, 0.15, 3.2, 0.25), GOLD);
  return fin();
}
function shot4(t) { // ふと隣を見ると、子どもを抱いた妻の疲れ、98
  reset(); lift(80); MW.g.scale.setScalar(1.15); meterOn(MW, WIFE, 30 + 68 * easeOut(clamp((t - 0.6) / 1.4)), t); KID.userData.arms[0].rotation.x = -1.5 + Math.sin(t * 6) * 0.3;
  HUS.userData.head.rotation.y = 0.9;
  const u = ease(clamp(t / 1.2)); look(lerp(-2.5, 1.4, u), 2.5, lerp(1.4, 4.4, u), lerp(-3.2, 0.4, u), 2.0, lerp(-2.6, -0.6, u), 48);
  setTop('子どもを抱いた妻の疲れ', '98', fade(t, 0.9, 3.4, 0.25), RED);
  return fin();
}
function shot5(t) { // 夫は言いかけた。俺は仕事で疲れてるから
  reset(); lift(80); HUS.position.set(-1.6, 0, -1.2); HUS.rotation.y = 0.9; HUS.userData.arms[1].rotation.x = -0.9; meterOn(MH, HUS, 62); meterOn(MW, WIFE, 98, t); MH.g.scale.setScalar(1); MW.g.scale.setScalar(1);
  sorry.position.set(-0.7, 3.55, -1.0); pop(sorry, t, 0.5, 0.35, 2.0);
  look(-0.5, 2.7, 5.6, -0.6, 2.1, -0.8, 52);
  return fin();
}
function shot6(t) { // メーターが赤く光る。言い訳は通じない
  reset(); lift(80); HUS.position.set(-1.6, 0, -1.2); HUS.rotation.y = 0.9; HUS.userData.head.rotation.x = 0.3; meterOn(MH, HUS, 62); meterOn(MW, WIFE, 98, t * 2); MH.g.scale.setScalar(1); MW.g.scale.setScalar(1.15 + Math.sin(t * 10) * 0.05);
  sorry.position.set(-0.7, 3.55, -1.0); sorry.visible = true; sorry.userData.size(2.0); batsu.position.set(-0.7, 3.55, -0.9); pop(batsu, t, 0.6, 0.3, 0.9);
  hemi.intensity = 0.9;
  look(-0.5, 2.7, 5.6, -0.6, 2.1, -0.8, 52);
  return fin();
}
function bars(t, which) { reset(); lift(200); S.background.set('#141228'); const H = 0.55;
  const uH = easeOut(clamp((t - 0.3) / 1.2)); barH.scale.y = Math.max(0.001, 1.9 * H * uH); vH.visible = true; vH.position.set(BX - 1.3, 1.9 * H * uH + 0.5, 0.6);
  if (which > 0) { const uW = easeOut(clamp((t - 0.3) / 1.6)); barW.scale.y = Math.max(0.001, 6.55 * H * uW); vW.visible = true; vW.position.set(BX + 1.3, 6.55 * H * uW + 0.5, 0.6); }
  look(BX, 2.8, 9.6, BX, 2.6, 0, 52); }
function shot7(t) { bars(t, 0); setTop('6歳未満の子がいる夫（2021年）', '1時間54分', fade(t, 0.15, 3.5, 0.25), BLUE); return fin(); } // 夫は1日2時間弱
function shot8(t) { bars(t + 3, 1); barW.scale.y = Math.max(0.001, 6.55 * 0.55 * easeOut(clamp((t - 0.2) / 1.6))); vW.position.y = barW.scale.y + 0.5; setTop('共働きの妻（家事・育児など）', '6時間33分', fade(t, 0.15, 3.5, 0.25), PINK); return fin(); } // 妻は7時間半
function shot9(t) { // 疲れてるのはお互い様。休んでいたのは片方だけ
  reset(); lift(110); HUS.position.set(2.2, 0.4, -2.5); HUS.rotation.y = 0; HUS.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); jacket.forEach(j => j.visible = false);
  HUS.userData.arms[0].rotation.x = -1.3; HUS.updateMatrixWorld(true); const v = new THREE.Vector3(0, -0.62, 0.08); HUS.userData.arms[0].localToWorld(v); PHONE.visible = true; PHONE.position.copy(v);
  WIFE.position.set(-1.2, 0, -2.7); WIFE.rotation.y = Math.PI; holdBaby(WIFE, BABY); WIFE.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 6) * 0.3;
  kyukei.position.set(2.2, 2.6, -2.4); pop(kyukei, t, 0.4, 0.3, 1.0); kado.position.set(-1.2, 2.6, -2.6); pop(kado, t, 1.2, 0.3, 1.0);
  look(0.5, 2.8, 6.2, 0.5, 1.6, -2.4, 54);
  return fin();
}
function nightRoom() { hemi.intensity = 0.45; S.background.set('#0e0c18'); }
function shot10(t) { // 夫は初めて、寝かしつけをやってみる
  reset(); lift(110); nightRoom(); jacket.forEach(j => j.visible = false); HUS.position.set(0.6, 0, -1.4); HUS.rotation.y = 0.3 + Math.sin(t * 2) * 0.15; holdBaby(HUS, BABY); WIFE.position.set(-6, 0, 0);
  clock.position.set(0.8, 3.25, -3.8); clock.visible = true; clock.userData.set('21:00'); clock.userData.size(1.2);
  look(1.6, 2.2, 3.6, 0.4, 1.5, -1.6, 52);
  setTop('夫の寝かしつけ', '予定 30分', fade(t, 0.15, 3.5, 0.25), GOLD);
  return fin();
}
function shot11(t) { // 30分のはずが、2時間たっても寝ない
  reset(); lift(110); nightRoom(); jacket.forEach(j => j.visible = false); HUS.position.set(0.6, 0, -1.4); HUS.rotation.y = 0.3 + Math.sin(t * 4) * 0.25; holdBaby(HUS, BABY); HUS.userData.head.rotation.x = 0.35; WIFE.position.set(-6, 0, 0);
  const h = 21 + Math.floor(clamp(t / 3) * 2); const m = Math.floor((clamp(t / 3) * 120) % 60); clock.visible = true; clock.userData.set(h + ':' + String(m).padStart(2, '0')); clock.position.set(0.8, 3.25, -3.8); clock.userData.size(1.2);
  gyaa.position.set(0.2, 1.25, -0.2); pop(gyaa, t, 0.8, 0.3, 0.9); MH.g.scale.setScalar(1); meterOn(MH, HUS, 62 + 37 * clamp(t / 3.4), t);
  look(1.6, 2.2, 3.6, 0.4, 1.6, -1.6, 52);
  return fin();
}
function shot12(t) { // 結果：仕事で疲れてる、はただの席取りだった
  reset(); lift(110); nightRoom(); jacket.forEach(j => j.visible = false); HUS.position.set(0.4, 0.0, -1.0); HUS.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); HUS.position.y = -0.35; HUS.userData.head.rotation.x = 0.5; WIFE.position.set(-6, 0, 0); BABY.position.set(-6, 0, 0);
  MH.g.scale.setScalar(1); meterOn(MH, HUS, 99, t); MH.g.position.y = 2.1;
  const u = ease(clamp(t / 6)); look(lerp(2.4, 1.6, u), lerp(2.4, 2.0, u), lerp(4.4, 3.4, u), 0.4, 1.2, -1.0, 50);
  setTop('結果', 'ただの席取り', fade(t, 0.15, 5.8, 0.25), RED);
  return fin();
}
function shot13(t) { // 一番疲れていたのは、何も言わずに動いていた人
  reset(); lift(30); nightRoom(); hemi.intensity = 0.55; HUS.position.set(-6, 0, 0); BABY.position.set(-6, 0, 0);
  WIFE.position.set(1.8, 0, -0.4); WIFE.rotation.y = -0.5; WIFE.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); WIFE.position.y = -0.38; WIFE.userData.arms.forEach((a, i) => { a.rotation.x = -0.9 + Math.sin(t * 3 + i) * 0.2; });
  laundry.forEach((l, i) => { l.visible = true; l.position.set(2.3 + (i % 3) * 0.45 - 0.45, 0.04 + Math.floor(i / 3) * 0.07, 0.2 + Math.floor(i / 3) * 0.1); });
  MW.g.scale.setScalar(1); meterOn(MW, WIFE, 98); MW.g.position.y = 2.1;
  look(4.4, 2.2, 3.4, 2.0, 1.2, -0.3, 50);
  setTop('何も言わずに', '動いていた人', fade(t, 0.3, 6.0, 0.25), PINK);
  return fin();
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（玄関の夫、メーター付き）
  reset(); lift(60); HUS.userData.arms[1].rotation.x = -2.2; HUS.userData.arms[1].rotation.z = 0.5; MH.g.scale.setScalar(1); meterOn(MH, HUS, 62);
  doorCam(0, 0);
  return fin();
}

const SUBS = [
  [3.2, 6.5, 'ある日、人の疲れが<br>数字で見えるようになった。'],
  [6.6, 9.9, '夫は喜ぶ。これで仕事の<br>大変さが分かってもらえる。'],
  [10.0, 13.3, '夫の疲れ、62。'],
  [13.4, 16.8, 'ふと隣を見ると、<br>子どもを抱いた妻の疲れ、98。'],
  [16.9, 20.4, '夫は言いかけた。<br>俺は仕事で疲れてるから。'],
  [20.5, 24.0, 'メーターが赤く光る。<br>言い訳は通じない。'],
  [24.1, 27.7, '夫の家事と育児は、<br>1日2時間弱。'],
  [27.8, 31.4, '共働きの妻でも、<br>1日6時間半。'],
  [31.5, 35.1, '疲れてるのはお互い様。<br>休んでいたのは片方だけ。'],
  [35.2, 38.8, '夫は初めて、<br>寝かしつけをやってみる。'],
  [38.9, 42.6, '30分のはずが、<br>2時間たっても寝ない。'],
  [42.7, 48.6, '結果：仕事で疲れてる、は<br>ただの席取りだった。'],
  [48.7, 55.0, '一番疲れていたのは、<br>何も言わずに動いていた人。'],
  [55.1, 61.3, '仕事で疲れてる、<br>家で言っていい？ダメ？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.4, f: shot3 },
  { a: 13.4, b: 16.9, f: shot4 }, { a: 16.9, b: 20.5, f: shot5 }, { a: 20.5, b: 24.1, f: shot6 }, { a: 24.1, b: 27.8, f: shot7 },
  { a: 27.8, b: 31.5, f: shot8 }, { a: 31.5, b: 35.2, f: shot9 }, { a: 35.2, b: 38.9, f: shot10 }, { a: 38.9, b: 42.7, f: shot11 },
  { a: 42.7, b: 48.7, f: shot12 }, { a: 48.7, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0629',
    v2: true,
    hookLine: '疲れが、数字で見えるようになった。',
    series: '',  // 消えたら回ではないのでバッジなし（皮肉回の柱名は未定）
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも疲れが数字で見えたら？',
    titleHtml: 'もしも疲れが<br>数字で見えたら？',
    mood: 'tension', seed: 629, hits: [0.5, 42.7, 48.7], risers: [38.9], impacts: [10.0, 13.4, 20.5, 24.1, 27.8, 38.9, 42.7, 48.7],
    sfx: [[0.5, 'bubble'], [14.6, 'alarm'], [20.8, 'buzz'], [24.4, 'bubble'], [28.0, 'bubble'], [39.7, 'alarm'], [49.0, 'whoosh']],
    narr: { '62': 'ろくじゅうに', '98': 'きゅうじゅうはち', '結果：': '結果、' },
    ask: '仕事で疲れてる、家で言っていい？ダメ？',
    caption: 'もしも人の疲れが、頭の上に数字で見えたら？\n\n夫は喜ぶ。これで仕事の大変さが分かってもらえる。夫の疲れ、62。\nふと隣を見ると、子どもを抱いた妻の疲れ、98。\n6歳未満の子がいる家で、夫の家事と育児は1日1時間54分。共働きの妻でも6時間33分。\n夫は初めて寝かしつけをやってみる。30分のはずが、2時間たっても寝ない。\n\n結果：仕事で疲れてる、はただの席取りだった。\n一番疲れていたのは、何も言わずに動いていた人。\n\n仕事で疲れてる、家で言っていい？ダメ？ コメントで教えて。\n\n※風刺ネタです。疲れの数字は演出です\n出典：総務省統計局「令和3年社会生活基本調査」6歳未満の子供を持つ夫婦の家事関連時間（2023年12月の資料）',
    hashtags: ['もしもラボ', 'もしも', '育児', '夫婦', '家事分担'],
    endStats: [['夫の家事・育児（1日）', '1時間54分', '6歳未満の子がいる家'], ['共働きの妻（1日）', '6時間33分', '総務省 2021年'], ['仕事で疲れてる', 'ただの席取り', 'かもしれない']],
    sources: '出典：総務省「令和3年社会生活基本調査」',
  },
});
