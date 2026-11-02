import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom } from '../satire-kit.js';

// もしも昭和の家族が今の物価で暮らしたら？（皮肉回・台本 S08）
// 2026/11/02 ゆうと承認。元ネタ：Togetter「24歳で結婚して子ども3人、家も車も。親世代の財力が信じられない」
// 数字（裏取り済み）：
//  厚生年金の保険料率 12.4%（1985年）→ 18.3%（2017年9月〜）※当時は標準報酬月額、今は総報酬にかかる率
//  国立大学の授業料 18万円（1980年）→ 53万5,800円（標準額）文部科学省
//  首都圏の新築マンション平均価格 9,182万円（2025年）不動産経済研究所

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#20242e'); S.fog = new THREE.Fog(0x20242e, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3440, 1.1); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(8, 18, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#2a2e38', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// ---------- 昭和の一家（場面ごとに置き直す） ----------
function family() {
  const dad = makeMan({ shirt: '#e8e0c8', hair: '#1d1a19' }); const hara = box(0.5, 0.2, 0.36, mat('#c8a040')); hara.position.set(0, 0.92, 0); dad.add(hara);
  const mom = makeWoman({ shirt: '#c46a5a', hair: '#2a1a14' }); const ap = box(0.44, 0.6, 0.04, mat('#f4efe2')); ap.position.set(0, 0.95, 0.16); mom.add(ap);
  const kids = [makeMan({ shirt: '#5a8ad0' }), makeWoman({ shirt: '#f0a040' }), makeMan({ shirt: '#6ab070' })]; kids.forEach(k => k.scale.setScalar(0.6));
  return { dad, mom, kids, all: [dad, mom, ...kids] };
}
const F = family(); F.all.forEach(p => S.add(p));
function placeFam(x, z, ry = 0) { const off = [[-0.9, 0], [0.9, 0], [-1.6, 0.9], [0, 0.9], [1.6, 0.9]]; F.all.forEach((p, i) => { p.position.set(x + off[i][0], 0, z + off[i][1]); p.rotation.set(0, ry, 0); }); }
function poseReset(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.position.y = 0; }

// ---------- A：令和のスーパー（原点） ----------
const SHELF_C = ['#e85a5a', '#f0c040', '#5ab0e8', '#7ad07a', '#f5f5f5'];
for (let s = 0; s < 2; s++) { const sh = box(7, 2.4, 0.8, mat('#d6dbe4')); sh.position.set(0, 1.2, -4 - s * 0.0); if (s) sh.position.set(-5.5, 1.2, -1.5), sh.rotation.y = Math.PI / 2; S.add(sh);
  const r = rng(30 + s); for (let i = 0; i < 26; i++) { const g = box(0.38, 0.42, 0.3, mat(SHELF_C[Math.floor(r() * 5)])); const row = i % 3, col = Math.floor(i / 3); if (s) g.position.set(-5.05, 0.45 + row * 0.75, -4.5 + col * 0.72); else g.position.set(-3.1 + col * 0.72, 0.45 + row * 0.75, -3.55); S.add(g); } }
const reg = box(2.2, 1.0, 0.8, mat('#3a4050')); reg.position.set(2.6, 0.5, -1.2); S.add(reg);
const regScr = label('お会計', { w: 512, h: 192, size: 110, color: '#9be86a', bg: 'rgba(10,20,10,.95)', sx: 0.9 }); regScr.position.set(2.6, 1.45, -1.2); S.add(regScr);
const chabu = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 28), mat('#8a5a32')); chabu.position.set(0, 0.42, 0.4); S.add(chabu);
const chLeg = box(0.1, 0.4, 0.1, mat('#5a3a20')); chLeg.position.set(0, 0.2, 0.4); S.add(chLeg);
const warp = makeSparkles(260, 0.22, 0xffd27a); S.add(warp.points); warp.init([[0, 1.4, 0.4]], 3.2, 2.4);
const basket = box(0.7, 0.4, 0.5, mat('#e85a5a')); S.add(basket);
const over = label('予算オーバー', { w: 768, size: 120, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 1.8 }); over.position.set(2.6, 2.4, -1.2); S.add(over);
const orera = label('俺らの頃は…', { w: 768, size: 120, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 1.7 }); S.add(orera);

// ---------- B：給料と天引き・学費のバー（x=60） ----------
const BX = 60;
const bfloor = new THREE.Mesh(new THREE.CircleGeometry(6, 40), mat('#2a2640', { depthWrite: false })); bfloor.rotation.x = -Math.PI / 2; bfloor.position.set(BX, 0.02, -6); bfloor.renderOrder = -0.8; S.add(bfloor);
const barA = box(1.4, 1, 1.2, mat('#9aa4b8')); barA.geometry.translate(0, 0.5, 0); barA.position.set(BX - 1.3, 0, -6); S.add(barA);
const barB = box(1.4, 1, 1.2, mat('#ff8a6a')); barB.geometry.translate(0, 0.5, 0); barB.position.set(BX + 1.3, 0, -6); S.add(barB);
const vA = label('', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.6 }); S.add(vA);
const vB = label('', { w: 768, size: 110, color: '#fff', stroke: 12, strokeColor: '#111', sx: 1.6 }); S.add(vB);
const yA = label('', { w: 512, size: 100, color: '#ddd', sx: 1.0 }); S.add(yA);
const yB = label('', { w: 512, size: 100, color: '#ddd', sx: 1.0 }); S.add(yB);
// 給与明細（手取りの矢印が横ばい）
const slipC = document.createElement('canvas'); slipC.width = 512; slipC.height = 720; { const g = slipC.getContext('2d'); g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 512, 720); g.fillStyle = '#3f7fd0'; g.fillRect(0, 0, 512, 110); g.fillStyle = '#fff'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('給与明細', 256, 56);
  [['総支給', '#222'], ['健康保険', '#c33'], ['厚生年金', '#c33'], ['税金', '#c33'], ['手取り', '#222']].forEach(([s, c], i) => { g.fillStyle = c; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText(s, 40, 190 + i * 110); g.fillStyle = '#ccc'; g.fillRect(330, 170 + i * 110, 140, 40); }); }
const slipT = new THREE.CanvasTexture(slipC); slipT.colorSpace = THREE.SRGBColorSpace;
const SLIP = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.375), new THREE.MeshBasicMaterial({ map: slipT })); SLIP.position.set(BX + 30, 2.4, 0); S.add(SLIP);
const flat = label('手取り → 横ばい', { w: 1024, size: 100, color: '#fff', bg: 'rgba(90,90,100,.92)', sx: 2.0 }); flat.position.set(BX + 30, 4.45, 0.1); S.add(flat);

// ---------- C：家（x=110） ----------
const CX = 110;
const cfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#2e3a2e', { depthWrite: false })); cfloor.rotation.x = -Math.PI / 2; cfloor.position.set(CX, 0.02, -3); cfloor.renderOrder = -0.8; S.add(cfloor);
const tower = new THREE.Group(); for (let i = 0; i < 9; i++) { const f = box(3.2, 0.62, 2.4, mat(i % 2 ? '#d9dde4' : '#c4cad4')); f.position.y = 0.31 + i * 0.64; tower.add(f); for (let w = 0; w < 4; w++) { const wi = box(0.5, 0.34, 0.04, mat('#7fb0d8')); wi.position.set(-1.1 + w * 0.74, 0.34 + i * 0.64, 1.22); tower.add(wi); } } tower.position.set(CX, 0, -4); S.add(tower);
const price = label('首都圏 平均9,182万円', { w: 1024, size: 120, color: '#fff', bg: 'rgba(210,50,60,.95)', sx: 2.6 }); price.position.set(CX, 6.6, -2.6); S.add(price);
const kinri = label('金利は低い', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.92)', sx: 1.6 }); kinri.position.set(CX - 1.2, 2.7, 0.2); S.add(kinri);

// ---------- D：家の中（x=160） ----------
const HX = 160;
const home = makeRoom({ w: 10, d: 8, wall: '#e4d8c0', floor: '#9a7a52' }); home.position.set(HX, 0, 0); home.userData.rw.visible = false; S.add(home);
const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 28), mat('#8a5a32')); tbl.position.set(HX, 0.42, -0.6); S.add(tbl);
const tLeg = box(0.1, 0.4, 0.1, mat('#5a3a20')); tLeg.position.set(HX, 0.2, -0.6); S.add(tLeg);
const ENV = [0, 1, 2].map(i => { const l = label('授業料のご請求', { w: 768, size: 90, color: '#222', bg: 'rgba(250,248,240,.98)', sx: 1.4 }); S.add(l); return l; });
const mawara = label('専業主婦じゃ回らない', { w: 1024, size: 100, color: '#fff', bg: 'rgba(200,90,120,.92)', sx: 2.4 }); S.add(mawara);
const tsucho = label('残高 0円', { w: 768, size: 140, color: '#d23a3a', bg: 'rgba(250,248,240,.98)', sx: 1.8 }); S.add(tsucho);
const tsujinai = label('俺らの頃は', { w: 768, size: 120, color: '#888', bg: 'rgba(255,255,255,.9)', sx: 1.5 }); S.add(tsujinai);
const xmark = label('×', { w: 256, h: 256, size: 240, color: '#d23a3a', sx: 0.9 }); S.add(xmark);

// ---------- E：昭和の正体（x=210） ----------
const EX = 210;
const efloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#2a2640', { depthWrite: false })); efloor.rotation.x = -Math.PI / 2; efloor.position.set(EX, 0.02, -2); efloor.renderOrder = -0.8; S.add(efloor);
const STEPS = []; for (let i = 0; i < 6; i++) { const s = box(0.7, 0.5 + i * 0.5, 0.7, mat('#7fb0e8')); s.geometry.translate(0, (0.5 + i * 0.5) / 2, 0); s.position.set(EX - 3.4 + i * 0.75, 0, -3); S.add(s); STEPS.push(s); }
const kyuryo = label('上がる給料', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,110,200,.92)', sx: 1.6 }); kyuryo.position.set(EX - 1.6, 4.0, -2.6); S.add(kyuryo);
const tada = label('母のタダ働き', { w: 768, size: 110, color: '#fff', bg: 'rgba(200,90,120,.92)', sx: 1.7 }); tada.position.set(EX + 1.3, 2.9, -1.4); S.add(tada);
const bonus = label('時代のボーナス', { w: 1024, size: 120, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 2.4 }); bonus.position.set(EX, 5.2, -2.6); S.add(bonus);
const confetti = makeSparkles(200, 0.2, 0xffd27a); S.add(confetti.points); confetti.init([[EX, 3.4, -2]], 4, 3);

function reset() {
  F.all.forEach(poseReset); placeFam(0, 0.8, 0); F.all.forEach(p => p.visible = true);
  warp.set(0); confetti.set(0); chabu.visible = chLeg.visible = true; basket.visible = false; over.visible = false; orera.visible = false; regScr.userData.set('お会計');
  barA.scale.y = barB.scale.y = 0.001; [vA, vB, yA, yB].forEach(l => l.visible = false); flat.visible = false; price.visible = false; kinri.visible = false;
  ENV.forEach(l => l.visible = false); mawara.visible = false; tsucho.visible = false; tsujinai.visible = false; xmark.visible = false;
  STEPS.forEach(s => s.scale.y = 1); kyuryo.visible = tada.visible = bonus.visible = false;
  hemi.intensity = 1.1; S.background.set('#20242e'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function storeCam(d) { look(lerp(0.4, 0.6, d), 2.6, lerp(8.4, 9.0, d), 0.4, 1.4, -0.4, 52); }
function shot0(t) { // 0秒＝サムネ：ちゃぶ台の一家が、令和のスーパーに瞬間移動
  reset(); lift(0); const k = t - TP; warp.set(k > 0 ? clamp(k / 1.6) : 0); el.flash.style.opacity = k > 0 && k < 0.25 ? 0.35 : 0;
  F.all.forEach(p => { p.userData.head.rotation.y = k > 0.6 ? Math.sin(k * 3 + p.position.x) * 0.5 : 0; });
  storeCam(ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // 昭和の一家が、令和にやって来た
  reset(); lift(0); F.all.forEach(p => { p.userData.head.rotation.y = Math.sin(t * 1.5 + p.position.x) * 0.5; }); storeCam(1);
  setTop('昭和の一家', '令和で暮らす', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function shot2(t) { // お父さんは言う。俺らの頃は、若いうちに家も車も買えた
  reset(); lift(0); F.dad.userData.arms[1].rotation.x = -2.2 + Math.sin(t * 4) * 0.2; F.dad.userData.head.rotation.x = -0.2; F.dad.position.y = 0;
  orera.position.set(-0.9, 2.6, 0.8); pop(orera, t, 0.4, 0.3, 1.5);
  look(-0.2, 1.9, 4.2, -0.9, 1.5, 0.6, 52);
  return S;
}
function shot3(t) { // スーパーでは、卵と牛乳とお米だけで予算オーバー
  reset(); lift(0); chabu.visible = chLeg.visible = false; placeFam(1.0, 0.4, -0.5); F.mom.position.set(1.6, 0, -0.3); F.mom.rotation.y = 0.2;
  basket.visible = true; basket.position.set(2.0, 1.15, -1.0); regScr.userData.set(t < 1.6 ? 'ピッ' : '合計');
  if (t > 1.6) { F.dad.userData.head.rotation.x = -0.25; F.dad.userData.arms.forEach(a => a.rotation.z = 0); F.dad.userData.arms[0].rotation.x = -2.6; F.dad.userData.arms[1].rotation.x = -2.6; }
  pop(over, t, 1.7, 0.3, 1.8);
  look(1.6, 2.4, 4.8, 2.2, 1.5, -1.0, 52);
  return S;
}
function slipCam() { look(BX + 30, 2.7, 8.4, BX + 30, 2.4, 0, 52); }
function shot4(t) { // 次に給料。手取りは、思ったほど増えていない
  reset(); lift(150); slipCam(); pop(flat, t, 0.9, 0.3, 2.0);
  return S;
}
function bars(t, a, b, la, lb, ya, yb, H) { const u = easeOut(clamp((t - 0.2) / 1.2)); barA.scale.y = Math.max(0.001, a * H * u); barB.scale.y = Math.max(0.001, b * H * u);
  [vA, vB].forEach(l => l.visible = true); vA.userData.set(la); vB.userData.set(lb); yA.userData.set(ya); yB.userData.set(yb);
  vA.position.set(BX - 1.3, a * H * u + 0.5, -5.4); vB.position.set(BX + 1.3, b * H * u + 0.5, -5.4); yA.position.set(BX - 1.3, -0.35, -5.2); yB.position.set(BX + 1.3, -0.35, -5.2);
  look(BX, 2.8, 4.4, BX, 2.5, -6, 52); }
function shot5(t) { // 厚生年金の保険料率は、12.4%から18.3%へ
  reset(); lift(150); bars(t, 12.4, 18.3, '1985年 12.4%', '今 18.3%', '', '', 0.22);
  setTop('厚生年金の保険料率', '12.4% → 18.3%', fade(t, 0.15, 3.4, 0.25), RED);
  return S;
}
function shot6(t) { // 金利は低い。でも新築は、首都圏で平均9,182万円
  reset(); lift(110); placeFam(CX, 0.6, 0); F.all.forEach(p => p.userData.head.rotation.x = -0.5);
  pop(kinri, t, 0.3, 0.3, 2.0); pop(price, t, 1.4, 0.35, 3.6);
  const u = ease(clamp(t / 3.6)); look(CX + 0.4, lerp(2.2, 4.4, u), lerp(7.4, 12.6, u), CX, lerp(2.0, 4.0, u), -3, 52);
  return S;
}
function homeCam(t) { look(HX + 0.6, 2.6, 4.6, HX, 1.3, -0.8, 52); }
function shot7(t) { // 子ども3人を大学へ。学費の請求書が3通届く
  reset(); lift(110); placeFam(HX, 0.6, 0); F.all.forEach(p => p.position.z -= 0.2); F.kids.forEach((k, i) => { k.position.set(HX - 1.5 + i * 1.5, 0, -2.6); k.scale.setScalar(0.85); });
  ENV.forEach((l, i) => { l.position.set(HX + 0.3 + (i - 1) * 0.35, 2.8 - i * 0.42, 0.0); pop(l, t, 0.4 + i * 0.7, 0.3, 1.2); });
  homeCam(t);
  return S;
}
function shot8(t) { // 国立大学の授業料は、18万円から53万円台に
  reset(); lift(150); bars(t, 18, 53.58, '1980年 18万円', '今 53万5,800円', '', '', 0.075);
  setTop('国立大学の授業料（1年）', '約3倍', fade(t, 0.15, 3.4, 0.25), BLUE);
  return S;
}
function shot9(t) { // そしてお母さんが気づく。専業主婦じゃ回らない
  reset(); lift(110); F.all.forEach(p => p.visible = false); F.mom.visible = true; F.mom.position.set(HX, 0.3, -1.6); F.mom.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); F.mom.userData.arms[1].rotation.x = -1.2; F.mom.userData.head.rotation.x = t > 1.4 ? -0.15 : 0.35;
  ENV.forEach((l, i) => { l.visible = true; l.userData.size(0.8); l.position.set(HX - 0.6 + i * 0.6, 0.55, -0.4 + i * 0.1); });
  mawara.position.set(HX, 2.5, -1.4); pop(mawara, t, 1.5, 0.35, 1.7);
  look(HX + 0.3, 2.1, 3.8, HX, 1.5, -1.2, 52);
  return S;
}
function shot10(t) { // 1か月後、一家の貯金はゼロに
  reset(); lift(110); hemi.intensity = 0.55; S.background.set('#12101a'); placeFam(HX, -0.6, 0); F.all.forEach(p => { p.userData.head.rotation.x = 0.45; });
  tsucho.position.set(HX, 2.7, -0.4); pop(tsucho, t, 0.8, 0.35, 1.8);
  homeCam(t);
  return S;
}
function shot11(t) { // お父さんの俺らの頃は、今では一言も通じない
  reset(); lift(110); placeFam(HX, -0.6, 0); F.dad.position.set(HX - 1.2, 0, 0.2); F.dad.rotation.y = 0.5; F.dad.userData.arms[1].rotation.x = -1.8;
  [F.mom, ...F.kids].forEach(p => { p.rotation.y = Math.PI; });
  tsujinai.position.set(HX - 1.2, 2.5, 0.3); pop(tsujinai, t, 0.3, 0.3, 1.4); xmark.position.set(HX - 1.2, 2.5, 0.4); pop(xmark, t, 1.4, 0.25, 0.9);
  look(HX - 0.3, 2.2, 4.8, HX - 0.8, 1.6, -0.4, 52);
  return S;
}
function shot12(t) { // 結果：俺らの頃はの正体は、上がる給料と、母のタダ働き
  reset(); lift(110); S.background.set('#141228'); STEPS.forEach((s, i) => s.scale.y = Math.max(0.001, easeOut(clamp((t - 0.2 - i * 0.12) / 0.5))));
  F.all.forEach(p => p.visible = false); F.mom.visible = true; F.mom.position.set(EX + 1.5, 0, -1.2); F.mom.rotation.y = -0.4; F.mom.userData.arms.forEach((a, i) => a.rotation.x = -1.0 + Math.sin(t * 5 + i * 3) * 0.4);
  pop(kyuryo, t, 1.0, 0.3, 1.6); pop(tada, t, 2.0, 0.3, 1.7);
  const u = ease(clamp(t / 5.6)); look(EX + lerp(0.6, 0.2, u), 3.0, lerp(7.4, 8.4, u), EX - 0.4, 2.2, -2.4, 52);
  setTop('結果', '昇給＋母のタダ働き', fade(t, 0.15, 5.4, 0.25), RED);
  return S;
}
function shot13(t) { // 根性じゃなくて、時代のボーナスだったのかも
  reset(); lift(110); S.background.set('#141228'); F.all.forEach(p => p.visible = false); kyuryo.visible = true; kyuryo.userData.size(1.6); tada.visible = true; tada.userData.size(1.7);
  pop(bonus, t, 0.5, 0.35, 2.4); confetti.set(clamp((t - 0.5) / 4));
  look(EX, 3.6, 9.4, EX, 3.0, -2.4, 52);
  setTop('俺らの頃はの正体', '時代のボーナス', fade(t, 0.3, 4.0, 0.25), GOLD);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図
  reset(); lift(0); F.all.forEach(p => { p.userData.head.rotation.y = Math.sin(t * 1.2 + p.position.x) * 0.4; }); storeCam(0);
  return S;
}

const SUBS = [
  [3.2, 6.6, '昭和の一家が、<br>令和にやって来た。'],
  [6.7, 10.3, 'お父さんは言う。俺らの頃は、<br>若いうちに家も車も買えた。'],
  [10.4, 14.0, 'スーパーでは、卵と牛乳と<br>お米だけで予算オーバー。'],
  [14.1, 17.5, '次に給料。手取りは、<br>思ったほど増えていない。'],
  [17.6, 21.4, '厚生年金は、<br>12.4%から18.3%に。'],
  [21.5, 25.3, '金利は低い。でも新築は、<br>平均9,182万円。'],
  [25.4, 29.2, '子ども3人を大学へ。<br>学費の請求書が3通届く。'],
  [29.3, 33.0, '国立大の授業料は、<br>18万から53万台に。'],
  [33.1, 36.9, 'そしてお母さんが気づく。<br>専業主婦じゃ回らない。'],
  [37.0, 40.6, '1か月後、<br>一家の貯金はゼロに。'],
  [40.7, 44.8, 'お父さんの俺らの頃は、<br>今では一言も通じない。'],
  [44.9, 50.6, '結果：俺らの頃はの正体は、<br>上がる給料と、母のタダ働き。'],
  [50.7, 55.0, '根性じゃなくて、<br>時代のボーナスだったのかも。'],
  [55.1, 61.3, '昔の方が生きやすかった？<br>今の方がマシ？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.7, f: shot1 }, { a: 6.7, b: 10.4, f: shot2 }, { a: 10.4, b: 14.1, f: shot3 },
  { a: 14.1, b: 17.6, f: shot4 }, { a: 17.6, b: 21.5, f: shot5 }, { a: 21.5, b: 25.4, f: shot6 }, { a: 25.4, b: 29.3, f: shot7 },
  { a: 29.3, b: 33.1, f: shot8 }, { a: 33.1, b: 37.0, f: shot9 }, { a: 37.0, b: 40.7, f: shot10 }, { a: 40.7, b: 44.9, f: shot11 },
  { a: 44.9, b: 50.7, f: shot12 }, { a: 50.7, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0633',
    v2: true,
    hookLine: '昭和の一家が、令和にやって来た。',
    series: '',  // 消えたら回ではないのでバッジなし（皮肉回の柱名は未定）
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしも昭和の家族が今の物価で暮らしたら？',
    titleHtml: 'もしも昭和の家族が<br>今の物価で<br>暮らしたら？',
    mood: 'tension', seed: 633, hits: [0.5, 44.9, 50.7], risers: [40.7], impacts: [6.7, 10.4, 17.6, 21.5, 25.4, 29.3, 37.0, 44.9],
    sfx: [[0.5, 'whoosh'], [12.1, 'buzz'], [15.0, 'bubble'], [22.9, 'buzz'], [25.8, 'bubble'], [26.5, 'bubble'], [27.2, 'bubble'], [37.8, 'buzz'], [42.1, 'buzz'], [51.2, 'whoosh']],
    narr: { '12.4%': 'じゅうにてんよん', '18.3%': 'じゅうはちてんさんパーセント', '9,182万円': 'きゅうせんひゃくはちじゅうにまんえん', '18万から': 'じゅうはちまんから', '53万台': 'ごじゅうさんまんだい', '結果：': '結果、', '俺らの頃はの正体': 'おれらのころは、の正体', '昭和': 'しょうわ', '令和': 'れいわ' },
    ask: '昔の方が生きやすかった？今の方がマシ？',
    caption: 'もしも昭和の一家が、令和の物価で暮らしたら？\n\nお父さんは言う。俺らの頃は、若いうちに家も車も買えた。\nスーパーでは卵と牛乳とお米だけで予算オーバー。手取りは思ったほど増えていない。\n厚生年金の保険料率は12.4%から18.3%へ。新築マンションは首都圏で平均9,182万円。\n国立大学の授業料は18万円から53万円台に。子ども3人なら請求書は3通。\nそしてお母さんが気づく。専業主婦じゃ回らない。\n\n結果：俺らの頃はの正体は、上がる給料と、母のタダ働き。\n根性じゃなくて、時代のボーナスだったのかも。\n\n昔の方が生きやすかった？今の方がマシ？ コメントで教えて。\n\n※風刺ネタです。厚生年金の料率は1985年が標準報酬月額、今は賞与込みの総報酬にかかる率で、単純比較はできません\n出典：日本年金機構・厚生労働省（厚生年金保険料率の推移）／文部科学省（国立大学の授業料 1980年18万円・標準額53万5,800円）／不動産経済研究所（首都圏新築マンション 2025年平均 9,182万円）',
    hashtags: ['もしもラボ', 'もしも', '昭和', '物価高', '手取り'],
    endStats: [['厚生年金の保険料率', '12.4%→18.3%', '1985年→今'], ['国立大学の授業料', '18万→53.58万', '1980年→今'], ['首都圏の新築マンション', '9,182万円', '2025年平均']],
    sources: '出典：日本年金機構／文部科学省／不動産経済研究所',
  },
});
