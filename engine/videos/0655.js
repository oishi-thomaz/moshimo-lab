import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, makePerson, poseWalk, SKIN } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeWoman, makeMan, label, pop, makeRoom, makePhone } from '../satire-kit.js';
import { poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { makeHanko, hankoSlam, makeMark, makeDoc } from '../scenes/hanko.js';
import { planTimes } from '../scenes/fitness.js';

// もしもオトナのホテルが消えたら？（皮肉回・台本 S54・社会の消えたら）
// 2026/11/05 作り直し：ゆうとの修正の指示（多目的トイレの張り込み・満車のような、消えたくらいでは起きない絵はやめる。
//  行き先は分散するだけで溢れかえらない。人間のことをちゃんと知って、エビデンスで肉付けし、起承転結で、消えるとどうなるかまで）
//  と、オトナのホテル に言い換える指示を受けて、ゆうと確認済みの台本をそのまま字幕にした。
//  画面・読み上げ・キャプション・ハッシュタグ・カバーのどこにも元のネットの呼び方を出さない。警察庁の区分名は 届出 とだけ書く。
// たとえ：大人のお城（ネオンのお城 → 消える → 城を追われた2人はビジホ・民泊・一人暮らしの部屋に静かに散る（どこも混まない）
//  → 実家暮らしは駅で解散 → 子育て中の夫婦は籠城できない → 探偵は見張り台を失う → 一番得したのは浮気している人だけ）
// 数字（一次資料で確認済み）：
//  ・届出 4,425（2025年末）。警察庁 生活安全局保安課「令和7年における風俗営業等の現状と風俗関係事犯等の取締り状況について」（令和8年4月）
//    https://www.npa.go.jp/publications/statistics/safetylife/080423huzokukankeitoukei.pdf
//  ・売上（利用料ベース）7,114億円（2014年度・推計）。矢野経済研究所の推計（Xビジネス 2017/03/30） https://xbusiness.jp/post/131
//  ・未婚者の親との同居：男性65.9%（1,339/2,033）・女性72.1%（1,480/2,053）、男女合わせて69.0%＝約7割。
//    国立社会保障・人口問題研究所 第16回出生動向基本調査（2021年）報告書 図表10-2-1 の数値データ
//    https://www.ipss.go.jp/ps-doukou/j/db_16/16HoukokuBaseData/houkokuFigure10_2_1.csv
//  ・婚姻関係にある人の51.9%がレス。日本家族計画協会 ジャパン・セックスサーベイ2020
//  ・出入りの写真：2人で入り一定時間いたことを示せれば有力な証拠になりやすい。一般のホテルは出張など他の目的も考えられ、
//    出入りの写真だけでは弱いことが多い（弁護士ドットコム 不倫の証拠） https://www.bengo4.com/c_3/guides/furin-shoko/
// 性的な描写はしない（露骨な言葉・体の表現・行為の描写なし）。ホテル・チェーン・探偵社・人物は全部架空。
// 多目的トイレ・公園・車・ネットカフェは出さない。行き先はどこも混まない、ふつうの街で描く。

const PINK = '#ff5fae', GOLD = '#ffd27a', BLUE = '#7fd4ff', GREEN = '#7be38f', RED = '#ff5a5a';

const S = new THREE.Scene();
S.background = new THREE.Color('#0c1022'); S.fog = new THREE.Fog(0x0c1022, 40, 120);
const hemi = new THREE.HemisphereLight(0xc4ceff, 0x2a2434, 1.15); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(12, 30, 22); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 400), mat('#262a36')); ground.rotation.x = -Math.PI / 2; ground.position.x = 300; ground.renderOrder = -1; S.add(ground);
const overM = (c) => new THREE.MeshLambertMaterial({ color: c, depthWrite: false });
function flat(w, d, c, x, z, ro = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), overM(c)); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.renderOrder = ro; S.add(m); return m; }
const cyl = (rt, rb, h, c, seg = 16) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c));
const cone = (r, h, c, seg = 16) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c));
const glowM = (c) => new THREE.MeshBasicMaterial({ color: c });
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
const bubble = (s, sx = 2.2) => { const b = label(s, { size: 100, color: '#222', bg: 'rgba(255,255,255,.97)', sx }); S.add(b); return b; };
const tag = (s, c, sx = 2.6) => { const b = label(s, { size: 96, color: '#fff', bg: hexA(c, .95), sx }); S.add(b); return b; };

// ---------- 人 ----------
function couple(r, x, z, ry = 0, { heart = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  const m = makeMan({ shirt: ['#4f6a8f', '#3f8f6b', '#59606e', '#8e6bbf'][Math.floor(r() * 4)], skin: SKIN[Math.floor(r() * 3)] }); m.position.x = -0.34; g.add(m);
  const w = makeWoman({ shirt: ['#f29bbb', '#f2c14e', '#e9e4da', '#c58bff'][Math.floor(r() * 4)], hair: ['#3a2620', '#6b4a33', '#1d1a19'][Math.floor(r() * 3)] }); w.position.x = 0.34; g.add(w);
  m.userData.arms[1].rotation.z = 0.25; w.userData.arms[0].rotation.z = -0.25;
  const h = label('♡', { w: 192, h: 192, size: 150, color: PINK, stroke: 14, strokeColor: '#2a0f1e', sx: 0.7 }); h.position.set(0, 2.35, 0); h.visible = heart; g.add(h);
  g.userData = { m, w, h, ph: r() * 6.28 };
  return g;
}
function walkCouple(c, t, amp = 1) { poseWalk(c.userData.m, t * 8 + c.userData.ph, amp); poseWalk(c.userData.w, t * 8 + c.userData.ph + 0.4, amp); c.userData.h.position.y = 2.35 + Math.sin(t * 4 + c.userData.ph) * 0.08; }
function standCouple(c) { walkCouple(c, 0, 0); }
function makeDetective() {
  const p = makePerson({ skin: '#e8b98f', hair: '#2a2421', shirt: '#b89a6a', pants: '#3a3226' });
  const coat = box(0.6, 0.55, 0.34, mat('#a88a5c')); coat.position.y = 0.72; p.add(coat);
  const brim = cyl(0.42, 0.42, 0.04, '#3b2f24'); brim.position.y = 0.5; p.userData.head.add(brim);
  const crown = cyl(0.24, 0.27, 0.24, '#3b2f24'); crown.position.y = 0.63; p.userData.head.add(crown);
  const camB = box(0.34, 0.22, 0.2, mat('#1b1d22')); camB.position.set(0, 0.22, 0.42); p.userData.head.add(camB);
  const lens = cyl(0.08, 0.08, 0.2, '#3a3d46'); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.22, 0.58); p.userData.head.add(lens);
  p.userData.camB = camB; p.userData.lens = lens;
  const sw = makeSweat(); p.userData.head.add(sw); p.userData.sweat = sw;
  return p;
}
function aim(p, k = 1) { const a = p.userData.arms; a[0].rotation.set(-1.75 * k, 0, 0.45 * k); a[1].rotation.set(-1.75 * k, 0, -0.45 * k); p.userData.camB.visible = p.userData.lens.visible = k > 0.3; }
function walker(r, x, z, sp) { const p = makePerson({ skin: SKIN[Math.floor(r() * 3)], hair: ['#1d1a19', '#3a2620', '#6b4a33'][Math.floor(r() * 3)], shirt: ['#59606e', '#3b6fb6', '#e9e4da', '#7a6a55', '#a35d4f'][Math.floor(r() * 5)], pants: '#2b3346', long: r() < 0.5, scale: 0.94 + r() * 0.1 }); S.add(p); p.position.set(x, 0, z); p.userData.x0 = x; p.userData.z0 = z; p.userData.sp = sp; p.userData.ph = r() * 6; return p; }
function stroll(p, t, x0, x1) { const L = x1 - x0, sp = p.userData.sp; let x = p.userData.x0 + sp * t; x = x0 + (((x - x0) % L) + L) % L; p.position.set(x, 0, p.userData.z0); p.rotation.y = sp > 0 ? Math.PI / 2 : -Math.PI / 2; poseWalk(p, t * 7 + p.userData.ph); }

// =====================================================
// 1) 大人のお城（原点）と見張り台
// =====================================================
const CASTLE = new THREE.Group(); S.add(CASTLE);
const WALLC = '#f6d9ea', ROOFC = '#c8367e';
const gateM = mat('#5a1f3c');
{
  const body = box(7, 5, 4, mat(WALLC)); body.position.y = 2.5; CASTLE.add(body);
  for (const x of [-3.6, 3.6]) { const tw = cyl(1.05, 1.05, 7.2, WALLC); tw.position.set(x, 3.6, 0.3); CASTLE.add(tw); const rf = cone(1.35, 2.4, ROOFC); rf.position.set(x, 8.4, 0.3); CASTLE.add(rf); }
  const mid = cyl(1.3, 1.3, 8.8, WALLC); mid.position.set(0, 4.4, -0.6); CASTLE.add(mid);
  const mr = cone(1.7, 3, ROOFC); mr.position.set(0, 10.3, -0.6); CASTLE.add(mr);
  for (let i = 0; i < 7; i++) { const b = box(0.6, 0.5, 0.6, mat(WALLC)); b.position.set(-3 + i * 1, 5.25, 1.7); CASTLE.add(b); }
  const gate = box(1.8, 2.3, 0.1, gateM); gate.position.set(0, 1.15, 2.03); CASTLE.add(gate);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 20), gateM); arch.rotation.x = Math.PI / 2; arch.position.set(0, 2.3, 2.03); CASTLE.add(arch);
  for (const x of [-2.4, 2.4]) for (const y of [2.6, 4.0]) { const w = box(0.7, 0.8, 0.08, glowM('#ffd9a0')); w.position.set(x, y, 2.03); CASTLE.add(w); }
}
const castleNeonM = new THREE.MeshBasicMaterial({ color: PINK });
for (const [w, h, x, y] of [[6.6, 0.12, 0, 4.95], [0.12, 4.8, -3.35, 2.5], [0.12, 4.8, 3.35, 2.5]]) { const n = box(w, h, 0.12, castleNeonM); n.position.set(x, y, 2.08); CASTLE.add(n); }
const castleSign = label('HOTEL ♡', { size: 120, color: '#fff', stroke: 18, strokeColor: PINK, sx: 4.2 }); castleSign.position.set(0, 6.6, 2.4); castleSign.material.depthTest = false; castleSign.renderOrder = 4; CASTLE.add(castleSign);
const vacancy = label('空室', { size: 110, color: '#fff', bg: 'rgba(40,170,90,.95)', sx: 1.5 }); vacancy.position.set(2.4, 1.3, 2.3); CASTLE.add(vacancy);
const castleLight = new THREE.PointLight(0xff5fae, 40, 18, 1.6); castleLight.position.set(0, 4, 6); CASTLE.add(castleLight);
const castleDark = new THREE.Color('#3a2a34'), castleCol = new THREE.Color(PINK);
function castleOn(k) { castleNeonM.color.copy(castleDark).lerp(castleCol, k); castleSign.material.opacity = 0.15 + 0.85 * k; castleLight.intensity = 40 * k; vacancy.visible = k > 0.5; }
function castleAt(u) { CASTLE.visible = u < 1; CASTLE.position.y = -12 * ease(u); }
const castleSpark = makeSparkles(160, 0.45, 0xffb0dc); S.add(castleSpark.points); castleSpark.init([[0, 3, 0], [-3.6, 6, 0.3], [3.6, 6, 0.3], [0, 9, -0.6]], 3, 6);
const heartsP = makeSparkles(160, 0.5, 0xff7ac0); S.add(heartsP.points); heartsP.init([[0, 5, 2]], 6, 5);
// 籠城の札と旗
const rojo = label('籠城中', { size: 110, color: '#fff', bg: 'rgba(200,54,126,.96)', sx: 3.2 }); rojo.position.set(0, 3.2, 2.5); S.add(rojo);
const flagPole = cyl(0.05, 0.05, 2.0, '#d8d8d8'); flagPole.position.set(0, 12.6, -0.6); S.add(flagPole);
const flag = box(1.2, 0.7, 0.04, mat(PINK)); flag.position.set(0.62, 13.2, -0.6); S.add(flag);
const KEEP = couple(rng(41), 0, 5.5, 0); KEEP.position.set(0, 5.5, 1.75); // 城壁の上の夫婦
// 道・街灯
flat(40, 7, '#2f3240', 0, 6.5, -0.8);
const lampL = new THREE.PointLight(0xffe2b0, 30, 24, 1.3); lampL.position.set(-2, 6, 9); S.add(lampL);
const lot = flat(9, 6, '#3a3430', 0, 0, -0.7);
const lotSign = label('閉業', { size: 110, color: '#fff', bg: 'rgba(50,50,60,.95)', sx: 1.6 }); lotSign.position.set(0, 3.4, -0.8); S.add(lotSign);
const FRONT = couple(rng(3), 0, 4.2, 0);
const frontQ = label('？', { w: 200, h: 200, size: 150, color: '#fff', stroke: 14, strokeColor: '#222', sx: 1.5 }); S.add(frontQ);
const lotLight = new THREE.PointLight(0xffd6ea, 0, 12, 1.2); lotLight.position.set(0, 3.5, 8); S.add(lotLight);
// 見張り台（探偵の）
const TOWER = new THREE.Group(); S.add(TOWER);
const TWX = -7.5, TWZ = 10.5, TWH = 3.2;
{
  const wood = mat('#8a5a32'), dark = mat('#5e3c22');
  for (const [x, z] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) { const l = box(0.16, TWH, 0.16, wood); l.position.set(x, TWH / 2, z); TOWER.add(l); }
  for (const y of [1.1, 2.2]) for (const s of [-1, 1]) { const b = box(1.6, 0.08, 0.08, dark); b.position.set(0, y, s * 0.75); TOWER.add(b); const c = box(0.08, 0.08, 1.6, dark); c.position.set(s * 0.75, y, 0); TOWER.add(c); }
  const pl = box(1.9, 0.14, 1.9, wood); pl.position.y = TWH; TOWER.add(pl);
  for (const s of [-1, 1]) { const r1 = box(1.9, 0.08, 0.08, dark); r1.position.set(0, TWH + 0.7, s * 0.9); TOWER.add(r1); const r2 = box(0.08, 0.08, 1.9, dark); r2.position.set(s * 0.9, TWH + 0.7, 0); TOWER.add(r2); }
  for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) { const p = box(0.08, 0.75, 0.08, dark); p.position.set(x, TWH + 0.37, z); TOWER.add(p); }
}
const towerTag = tag('見張り台', '#8a5a32', 2.2);
const DET = makeDetective(); S.add(DET);
const photo = label('IN 21:03 → OUT 23:10', { size: 80, color: '#222', bg: 'rgba(255,250,235,.97)', sx: 5.4 }); S.add(photo);
const camFlash = new THREE.PointLight(0xffffff, 0, 14, 1.2); S.add(camFlash);
const towerSpark = makeSparkles(120, 0.4, 0xd8c0a0); S.add(towerSpark.points); towerSpark.init([[TWX, 0.4, TWZ], [TWX + 1.5, 0.3, TWZ], [TWX + 2.8, 0.3, TWZ]], 1.2, 2.2);
function towerFall(k) { // 右に倒れる（根元の右端を軸に）
  const a = -1.45 * ease(k); TOWER.rotation.set(0, 0, a);
  const px = 0.75; TOWER.position.set(TWX + px - px * Math.cos(a), -px * Math.sin(a), TWZ);
}

// =====================================================
// 2) 全国のお城（俯瞰の街に並ぶ小さなお城・x=480）
// =====================================================
const FX = 480;
flat(60, 50, '#1c2030', FX, -8, -0.8);
for (let i = -2; i <= 2; i++) { flat(0.5, 50, '#2c3142', FX + i * 6, -8, -0.7); flat(60, 0.5, '#2c3142', FX, -8 + i * 7, -0.7); }
function miniCastle() {
  const g = new THREE.Group();
  const b = box(1.4, 1.0, 0.9, mat(WALLC)); b.position.y = 0.5; g.add(b);
  for (const x of [-0.6, 0.6]) { const t = cyl(0.22, 0.22, 1.5, WALLC, 10); t.position.set(x, 0.75, 0); g.add(t); const r = cone(0.3, 0.55, ROOFC, 10); r.position.set(x, 1.78, 0); g.add(r); }
  const n = box(1.3, 0.06, 0.06, castleNeonM); n.position.set(0, 1.0, 0.47); g.add(n);
  return g;
}
const MINIS = [];
{ const r = rng(91); for (let i = 0; i < 64; i++) { const g = miniCastle(); const gx = (i % 8) - 3.5, gz = Math.floor(i / 8); g.position.set(FX + gx * 3.2 + (r() - .5) * 1.2, 0, 4 - gz * 3.6 + (r() - .5) * 1.4); g.rotation.y = (r() - .5) * 0.6; g.userData.d = gz / 7 + r() * 0.12; S.add(g); MINIS.push(g); } }
const miniSpark = makeSparkles(320, 0.5, 0xffb0dc); S.add(miniSpark.points); miniSpark.init(MINIS.map(m => [m.position.x, 1.2, m.position.z]), 1.2, 4);
const fieldLight = new THREE.PointLight(0xff8ac8, 50, 60, 1.2); fieldLight.position.set(FX, 12, 0); S.add(fieldLight);
function minisShow(u) { u *= 1.15; for (const m of MINIS) { const k = clamp((u - m.userData.d * 0.85) / 0.15); m.visible = k > 0; m.scale.setScalar(easeOut(k)); } }
function minisVanish(u) { for (const m of MINIS) { const k = clamp((u - m.userData.d * 0.7) / 0.2); m.visible = k < 1; m.position.y = -2.2 * ease(k); m.scale.setScalar(1 - 0.6 * k); } }
// 売上のコイン（x=420）
const GX = 420;
flat(30, 20, '#1a1830', GX, 0, -0.8);
const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.14, 24), coinM = mat('#f2c14e');
const STACKS = [];
{ const r = rng(77); for (let i = 0; i < 26; i++) { const g = new THREE.Group(); const a = r() * 6.28, d = 0.5 + r() * 4.5; g.position.set(GX + Math.cos(a) * d * 1.3, 0, Math.sin(a) * d * 0.7 - 1); S.add(g); const n = Math.round(lerp(26, 6, d / 5) + r() * 5); const cs = []; for (let k = 0; k < n; k++) { const c = new THREE.Mesh(coinGeo, coinM); c.position.set((r() - .5) * 0.06, 0.07 + k * 0.145, (r() - .5) * 0.06); g.add(c); cs.push(c); } STACKS.push({ cs, d }); } }
function coins(u) { for (const s of STACKS) { const k = Math.round(s.cs.length * clamp(u * 1.6 - s.d / 9)); s.cs.forEach((c, i) => c.visible = i < k); } }
const MINI = CASTLE.clone(true); MINI.scale.setScalar(0.42); MINI.position.set(GX, 0, -6); S.add(MINI);
const gLight = new THREE.PointLight(0xffd27a, 40, 26, 1.3); gLight.position.set(GX, 8, 5); S.add(gLight);
const coinSpark = makeSparkles(260, 0.5, 0xffe39a); S.add(coinSpark.points); coinSpark.init([[GX, 2, -1]], 7, 4);

// =====================================================
// 3) ふつうの街（ビジホ・民泊・一人暮らしの部屋・x=50〜80）
// =====================================================
flat(60, 6, '#2f3240', 64, 3.4, -0.8);
flat(60, 2.2, '#4a4e5a', 64, -0.5, -0.7);
for (let i = 0; i < 12; i++) flat(1.4, 0.16, '#d8d8d0', 38 + i * 5, 3.4, -0.6);
// ビジネスホテル（1階はガラス張りのロビーとフロント）
const HX = 55;
{
  const up = box(6.4, 7, 4, mat('#b9c0cc')); up.position.set(HX, 6.5, -3.6); S.add(up);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const w = box(0.9, 0.9, 0.06, glowM((r + c) % 3 ? '#ffe2a8' : '#556070')); w.position.set(HX - 2.25 + c * 1.5, 4.0 + r * 1.6, -1.58); S.add(w); }
  const back = box(6.4, 3, 0.2, mat('#e9e2d2')); back.position.set(HX, 1.5, -5.5); S.add(back);
  for (const s of [-1, 1]) { const sd = box(0.2, 3, 4, mat('#9aa3b2')); sd.position.set(HX + s * 3.1, 1.5, -3.6); S.add(sd); }
  const counter = box(2.6, 1.0, 0.6, mat('#7a5a3e')); counter.position.set(HX, 0.5, -4.3); S.add(counter);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.9, 0.05), new THREE.MeshLambertMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.18, depthWrite: false })); glass.position.set(HX, 1.5, -1.65); glass.renderOrder = 2; S.add(glass);
  const lobby = new THREE.PointLight(0xfff0d0, 14, 8, 1.4); lobby.position.set(HX, 2.6, -3); S.add(lobby);
}
const CLERK = makePerson({ skin: '#f5d3b5', hair: '#1d1a19', shirt: '#2e3442', pants: '#252a36' }); CLERK.position.set(HX, 0, -4.95); S.add(CLERK);
const hotelSign = tag('ビジネスホテル', '#283c6e', 3.4); hotelSign.position.set(HX, 3.55, -1.3);
const frontTag = tag('フロント', '#7a5a3e', 1.8);
// 民泊（ふつうの一軒家）
const MPX = 62.6;
const HOUSE = new THREE.Group(); HOUSE.position.set(MPX, 0, -3.6); S.add(HOUSE);
{ const b = box(4.6, 3.2, 4, mat('#e9e0cf')); b.position.y = 1.6; HOUSE.add(b); const rf = new THREE.Mesh(new THREE.ConeGeometry(3.7, 1.8, 4), mat('#7a3b2e', { flatShading: true })); rf.rotation.y = Math.PI / 4; rf.position.y = 4.1; HOUSE.add(rf); const d = box(1, 2, 0.08, mat('#5a3a2a')); d.position.set(-0.8, 1, 2.03); HOUSE.add(d); for (const x of [1.3]) { const w = box(1.2, 0.8, 0.06, glowM('#ffd9a0')); w.position.set(x, 1.9, 2.03); HOUSE.add(w); } const kb = box(0.25, 0.3, 0.12, mat('#3a3d46')); kb.position.set(0.0, 1.2, 2.06); HOUSE.add(kb); }
const mpSign = tag('民泊', '#8c5ac8', 2.0); mpSign.position.set(MPX + 0.3, 3.0, -1.2);
const mpLight = new THREE.PointLight(0xffe2b0, 10, 10, 1.4); mpLight.position.set(MPX, 3, 1); S.add(mpLight);
// 一人暮らしのアパート（2階建て・ドア4つずつ）
const AX = 73;
const aptWin = [];
{
  const b = box(7.6, 5.6, 3.4, mat('#d9cdb8')); b.position.set(AX, 2.8, -3.3); S.add(b);
  const rf = box(8.0, 0.2, 3.8, mat('#6a5a4a')); rf.position.set(AX, 5.7, -3.3); S.add(rf);
  const bal = box(7.8, 0.15, 1.0, mat('#8a8070')); bal.position.set(AX, 2.85, -1.1); S.add(bal);
  const rail = box(7.8, 0.6, 0.06, mat('#8a8070')); rail.position.set(AX, 3.2, -0.62); S.add(rail);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 4; i++) {
    const x = AX - 2.85 + i * 1.9, y = f * 2.85;
    const d = box(0.8, 1.9, 0.06, mat('#4a5568')); d.position.set(x - 0.35, y + 0.95, -1.57); S.add(d);
    const wm = new THREE.MeshBasicMaterial({ color: '#3a3f52' }); const w = box(0.6, 0.6, 0.06, wm); w.position.set(x + 0.45, y + 1.5, -1.57); S.add(w); aptWin.push(wm);
  }
}
const aptTag = tag('一人暮らしの部屋', '#3f8f6b', 3.4); aptTag.position.set(AX - 0.9, 6.5, -1.4);
const aptLight = new THREE.PointLight(0xffe6c0, 12, 12, 1.4); aptLight.position.set(AX, 4, 2); S.add(aptLight);
const streetLight = new THREE.PointLight(0xffe2b0, 26, 30, 1.2); streetLight.position.set(62, 7, 5); S.add(streetLight);
for (const x of [50, 67, 80]) { const p = cyl(0.1, 0.12, 5, '#7a7f8a'); p.position.set(x, 2.5, 0.9); S.add(p); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), glowM('#ffe6b0')); bl.position.set(x, 5.1, 0.9); S.add(bl); }
const CA = couple(rng(12), HX - 3, 2.2, 0); // ビジホへ
const CB = couple(rng(13), MPX + 4, 2.4, 0); // 民泊へ
const CC = couple(rng(14), AX + 4, 2.3, 0); // 一人暮らしの部屋へ
const WALKERS = []; { const r = rng(21); for (let i = 0; i < 6; i++) WALKERS.push(walker(r, 40 + r() * 40, i % 2 ? -0.2 : 0.4, (i % 2 ? -1 : 1) * (0.9 + r() * 0.5))); }

// =====================================================
// 4) 実家の玄関（x=130）
// =====================================================
const JX = 130;
flat(16, 10, '#2f332e', JX, 1, -0.8);
const JIKKA = new THREE.Group(); JIKKA.position.set(JX, 0, -2.5); S.add(JIKKA);
{ const b = box(6, 3.4, 4, mat('#efe6d6')); b.position.y = 1.7; JIKKA.add(b); const rf = new THREE.Mesh(new THREE.ConeGeometry(4.7, 2.0, 4), mat('#4a5a6a', { flatShading: true })); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.75; rf.position.y = 4.4; JIKKA.add(rf); for (const x of [-1.9, 1.9]) { const w = box(1.1, 0.9, 0.06, glowM('#ffe0a8')); w.position.set(x, 2.0, 2.03); JIKKA.add(w); } const step = box(1.8, 0.16, 0.8, mat('#b0a898')); step.position.set(0, 0.08, 2.4); JIKKA.add(step); }
const jDoorPivot = new THREE.Group(); jDoorPivot.position.set(JX - 0.6, 0, -0.47); S.add(jDoorPivot);
{ const d = box(1.2, 2.2, 0.08, mat('#6a4a32')); d.position.set(0.6, 1.1, 0); jDoorPivot.add(d); }
const jIn = box(1.2, 2.2, 0.04, glowM('#ffe8c0')); jIn.position.set(JX, 1.1, -0.5); S.add(jIn);
const jTag = tag('実家', '#4a5a6a', 1.6); jTag.position.set(JX, 3.7, -0.3);
const DAD = makeOji(rng(17), { shirt: '#7a6a55' }); DAD.position.set(JX, 0, -0.75); S.add(DAD);
const okaeri = bubble('おかえり〜', 2.4);
const jLight = new THREE.PointLight(0xffe2b0, 16, 14, 1.4); jLight.position.set(JX, 4, 4); S.add(jLight);
const CJ = couple(rng(15), JX, 3.6, Math.PI);

// =====================================================
// 5) 10人の未婚者（x=180）
// =====================================================
const RX = 180;
flat(14, 8, '#232838', RX, 0, -0.8);
const step2 = box(7, 0.5, 1.2, mat('#3a4054')); step2.position.set(RX, 0.25, -1.3); S.add(step2);
const ROW = [], ROOFS = [];
{ const r = rng(33); const roofOn = [1, 1, 0, 1, 1, 1, 0, 1, 1, 0];
  for (let i = 0; i < 10; i++) { const back = i >= 5; const x = RX - 2.4 + (i % 5) * 1.2; const z = back ? -1.3 : 0.4; const y = back ? 0.5 : 0;
    const p = i % 2 ? makeWoman({ shirt: ['#f29bbb', '#f2c14e', '#e9e4da', '#c58bff', '#7fc4d8'][i % 5], hair: ['#3a2620', '#1d1a19'][i % 2] }) : makeMan({ shirt: ['#4f6a8f', '#3f8f6b', '#59606e', '#8e6bbf', '#a35d4f'][i % 5], skin: SKIN[i % 3] });
    p.position.set(x, y, z); S.add(p); ROW.push(p);
    if (roofOn[i]) { const g = new THREE.Group(); const rf = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.55, 4), mat('#b5523a', { flatShading: true })); rf.rotation.y = Math.PI / 4; g.add(rf); const ch = box(0.12, 0.25, 0.12, mat('#8a3a2a')); ch.position.set(0.22, 0.2, 0); g.add(ch); g.userData = { x, y: y + 2.35, z, d: r() * 0.4 }; S.add(g); ROOFS.push(g); }
  } }
const rowLight = new THREE.PointLight(0xfff0d8, 26, 20, 1.3); rowLight.position.set(RX, 6, 6); S.add(rowLight);

// =====================================================
// 6) 駅の改札（x=230）
// =====================================================
const SX = 230;
flat(18, 10, '#5a5e68', SX, 0, -0.8);
const stWall = box(16, 5.5, 0.4, mat('#cfd4dc')); stWall.position.set(SX, 2.75, -4); S.add(stWall);
const stSign = tag('もしも台駅', '#2a3a5a', 3.0); stSign.position.set(SX, 4.6, -3.6);
const clockF = cyl(0.55, 0.55, 0.1, '#ffffff', 24); clockF.rotation.x = Math.PI / 2; clockF.position.set(SX + 4, 4.4, -3.75); S.add(clockF);
const hands = []; for (const [len, w] of [[0.32, 0.06], [0.45, 0.04]]) { const h = box(w, len, 0.02, mat('#222')); h.geometry.translate(0, len / 2, 0); h.position.set(SX + 4, 4.4, -3.68); S.add(h); hands.push(h); }
hands[0].rotation.z = -Math.PI * 0.75 * 1.0 - 0.2; hands[1].rotation.z = Math.PI;
for (let i = 0; i < 5; i++) { const g = box(0.28, 1.0, 1.5, mat('#9aa3b2')); g.position.set(SX - 2.4 + i * 1.2, 0.5, 0); S.add(g); const top = box(0.3, 0.06, 1.5, mat('#3a3f52')); top.position.set(SX - 2.4 + i * 1.2, 1.03, 0); S.add(top); const lt = box(0.2, 0.1, 0.1, glowM(i === 2 ? '#7be38f' : '#7fd4ff')); lt.position.set(SX - 2.4 + i * 1.2, 1.1, 0.7); S.add(lt); }
const stLight = new THREE.PointLight(0xffffff, 26, 20, 1.3); stLight.position.set(SX, 5, 4); S.add(stLight);
const SM = makeMan({ shirt: '#3f8f6b' }); S.add(SM);
const SW = makeWoman({ shirt: '#f2c14e' }); S.add(SW);
const matane = bubble('またね', 1.8);
const RIDERS = []; { const r = rng(55); for (let i = 0; i < 3; i++) RIDERS.push(walker(r, SX - 6 + i * 4, -2.4, (i % 2 ? -1 : 1) * 0.8)); }

// =====================================================
// 7) 子育て中の家（x=290・室内）
// =====================================================
const KX = 290;
const ROOM = makeRoom({ w: 8, d: 6, h: 3.2, wall: '#efe4d0', floor: '#c9a77a' }); ROOM.position.set(KX, 0, 0); S.add(ROOM);
ROOM.userData.rw.visible = false;
const futon = box(2.6, 0.16, 2.0, mat('#f4f1ea')); futon.position.set(KX - 1.0, 0.08, -1.3); S.add(futon);
const kake = box(2.2, 0.12, 1.2, mat('#8fb8e0')); kake.position.set(KX - 1.0, 0.26, -0.95); S.add(kake);
const KIDS = [];
for (const [x, c] of [[-1.6, '#f2c14e'], [-0.5, '#7be38f']]) { const k = makePerson({ skin: '#f5d3b5', hair: '#2a2220', shirt: c, pants: '#5a7aa8', scale: 0.5 }); k.rotation.x = -Math.PI / 2; k.position.set(KX + x, 0.3, -0.55); S.add(k); KIDS.push(k); }
const zz = label('Zz', { size: 110, color: '#fff', stroke: 12, strokeColor: '#334', sx: 1.0 }); zz.position.set(KX - 1.0, 1.2, -1.7); S.add(zz);
const table = box(1.6, 0.4, 0.8, mat('#8a5a32')); table.position.set(KX + 1.5, 0.2, 0.9); S.add(table);
const PA = makeMan({ shirt: '#59606e' }); S.add(PA);
const MA = makeWoman({ shirt: '#c58bff', hair: '#3a2620' }); S.add(MA);
const homeLight = new THREE.PointLight(0xffe2b8, 18, 14, 1.4); homeLight.position.set(KX, 2.8, 2); S.add(homeLight);
const sigh1 = bubble('はぁ…', 1.6), sigh2 = bubble('はぁ…', 1.6);
const PH = makePhone({ w: 1.6, h: 3.0, cw: 540, ch: 1000 }); S.add(PH.g);
PH.draw('price', (g, w, h) => {
  g.fillStyle = '#f6f7fb'; g.fillRect(0, 0, w, h); g.fillStyle = '#283c6e'; g.fillRect(0, 0, w, 150);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.fillText('ビジネスホテル', w / 2, 52); g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.fillText('料金表', w / 2, 112);
  const rows = [['シングル', '¥¥'], ['ツイン', '¥¥¥'], ['駐車場', '¥'], ['平日も週末も', '1泊']];
  rows.forEach(([a, b], i) => { const y = 250 + i * 150; g.fillStyle = '#333'; g.textAlign = 'left'; g.font = '900 50px "Noto Sans CJK JP", sans-serif'; g.fillText(a, 40, y); g.textAlign = 'right'; g.fillStyle = '#e0335a'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.fillText(b, w - 40, y); g.fillStyle = '#d0d4de'; g.fillRect(30, y + 60, w - 60, 4); });
  g.fillStyle = '#e0335a'; g.textAlign = 'center'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.fillText('割高…', w / 2, h - 110);
});
const gap = label('←  →', { size: 140, color: '#fff', stroke: 14, strokeColor: '#334', sx: 1.4 }); S.add(gap);

// =====================================================
// 8) 探偵の報告書の山（x=330）
// =====================================================
const DX = 330;
flat(14, 10, '#3a3430', DX, 0, -0.8);
const dBack = box(14, 4, 0.2, mat('#5a5048')); dBack.position.set(DX, 2, -3); S.add(dBack);
const desk = box(4.4, 0.12, 2.2, mat('#7a5a3e')); desk.position.set(DX, 0.9, 0); S.add(desk);
for (const [x, z] of [[-2, -0.9], [2, -0.9], [-2, 0.9], [2, 0.9]]) { const l = box(0.12, 0.9, 0.12, mat('#5e4430')); l.position.set(DX + x, 0.45, z); S.add(l); }
const PILES = [];
for (const [x, z, n] of [[-1.3, -0.3, 22], [1.4, -0.4, 16], [0.1, -0.6, 10]]) { const g = new THREE.Group(); g.position.set(DX + x, 0.96, z); S.add(g); const sh = []; for (let k = 0; k < n; k++) { const s = box(1.3, 0.05, 1.7, mat(k % 2 ? '#fbfaf5' : '#ecebe4')); s.position.set((Math.sin(k * 2.3) * 0.05), 0.025 + k * 0.055, Math.cos(k * 1.7) * 0.05); s.rotation.y = Math.sin(k * 3.1) * 0.06; g.add(s); sh.push(s); } PILES.push(sh); }
const DOC = makeDoc({ title: '調査報告書', rows: ['対象', '場所', '写真', '結論'], head: '#3a4a6a', w: 1.4, h: 1.8 }); DOC.rotation.x = -Math.PI / 2 + 0.5; DOC.position.set(DX + 0.1, 1.55, 0.65); S.add(DOC);
DOC.userData.fill(0, '夫と女性'); DOC.userData.fill(1, 'ビジネスホテル'); DOC.userData.fill(2, '出入りのみ');
const HANKO = makeHanko({ r: 0.32 }); S.add(HANKO);
const MARKS = [0, 1, 2].map(() => { const m = makeMark('決め手なし', { sx: 1.0 }); S.add(m); return m; });
const DET2 = makeDetective(); S.add(DET2);
const dLight = new THREE.PointLight(0xffe8c8, 22, 14, 1.3); dLight.position.set(DX, 4.5, 3); S.add(dLight);

// =====================================================
// 9) ふつうのホテルの前（探偵と言い逃れ・x=360, z=-20）
// =====================================================
const BX = 360;
const BE = new THREE.Group(); BE.position.set(BX, 0, -20); S.add(BE);
{ const b = box(10, 9, 4, mat('#b9c0cc')); b.position.y = 4.5; BE.add(b); for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const w = box(0.9, 0.9, 0.06, glowM((r + c) % 3 ? '#ffe2a8' : '#556070')); w.position.set(-3.8 + c * 1.5, 4 + r * 1.6, 2.03); BE.add(w); } const d = box(2.4, 2.4, 0.08, mat('#2a3a4a')); d.position.set(0, 1.2, 2.03); BE.add(d); }
const beSign = tag('ビジネスホテル', '#283c6e', 4.0); beSign.position.set(BX + 0.2, 4.3, -16.6);
flat(20, 8, '#2f3240', BX, -14, -0.8);
const BECOUPLE = couple(rng(13), BX - 0.6, -15.8, 0.3, { heart: false });
const ex1 = bubble('出張です', 2.2), ex2 = bubble('打ち合わせです', 3.0);
const DET3 = makeDetective(); S.add(DET3);
const detQ = label('？', { w: 200, h: 200, size: 150, color: '#fff', stroke: 14, strokeColor: '#222', sx: 1.5 }); S.add(detQ);
const beLight = new THREE.PointLight(0xfff0c0, 22, 22, 1.4); beLight.position.set(BX, 5, -10); S.add(beLight);
const noProof = label('証拠なし', { size: 120, color: '#fff', bg: 'rgba(40,170,90,.96)', sx: 2.4 }); S.add(noProof);
const niyari = bubble('ニヤリ', 1.8);

// 動くまで原点（お城の跡地）に残らないよう、各場面の位置に置いておく
SM.position.set(SX - 1.8, 0, 1.9); SW.position.set(SX - 0.6, 0, 0.4); PA.position.set(KX + 1.0, 0, 0.15); MA.position.set(KX + 2.0, 0, 0.15);
HANKO.position.set(DX, 3, 0); DET2.position.set(DX + 2.7, 0, 1.3); DET3.position.set(BX + 3.2, 0, -12.6);
function reset() {
  S.background.set('#0c1022'); hemi.intensity = 1.15;
  castleAt(0); castleOn(1); castleSpark.set(0); heartsP.set(0); lot.visible = false; lotSign.visible = false; rojo.visible = false; flagPole.visible = flag.visible = false; KEEP.visible = false;
  FRONT.visible = true; frontQ.visible = false; lotLight.intensity = 0;
  TOWER.visible = true; TOWER.rotation.set(0, 0, 0); TOWER.position.set(TWX, 0, TWZ); towerTag.visible = false; towerSpark.set(0);
  DET.visible = false; photo.visible = false; camFlash.intensity = 0; DET.userData.sweat.userData.set(0);
  minisShow(2); miniSpark.set(0); coins(0); coinSpark.set(0);
  CA.visible = CB.visible = CC.visible = false; frontTag.visible = false; aptWin.forEach(m => m.color.set('#3a3f52'));
  okaeri.visible = false; jDoorPivot.rotation.y = 0;
  ROOFS.forEach(g => g.visible = false);
  matane.visible = false;
  sigh1.visible = sigh2.visible = false; PH.g.visible = false; gap.visible = false; zz.visible = true;
  MARKS.forEach(m => m.visible = false); DET2.userData.sweat.userData.set(0);
  ex1.visible = ex2.visible = false; detQ.visible = false; DET3.visible = false; DET3.userData.sweat.userData.set(0); BECOUPLE.visible = true; noProof.visible = niyari.visible = false;
  el.flash.style.opacity = 0;
}

// =====================================================
// ショット
// =====================================================
function castleCam(d = 0) { look(lerp(1.0, 0, d), lerp(3.0, 2.6, d), lerp(38, 13, d), 0, lerp(5.6, 2.2, d), lerp(0, 3, d), 46); }
function frontPose(k) { FRONT.position.set(0, 0, 4.2); FRONT.rotation.y = 0; standCouple(FRONT); FRONT.userData.h.visible = k < 0.5; }
function shot0(t) { // 0秒＝サムネ：ネオンのお城の前にカップル。0.45秒でお城がボンと消える
  reset(); lift(0); const k = t - 0.45; TOWER.visible = false;
  castleAt(k < 0 ? 0 : clamp(k / 0.5)); castleOn(k < 0 ? 1 : 0.3); castleSpark.set(k < 0 ? 0 : clamp(k / 1.1));
  el.flash.style.opacity = k > 0 ? 0.45 * Math.max(0, 1 - k / 0.3) : 0;
  lot.visible = lotSign.visible = k > 0.5; frontPose(k > 0 ? 1 : 0);
  FRONT.rotation.y = k > 0.6 ? Math.sin(t * 3) * 0.5 : 0;
  frontQ.position.set(1.0, 2.7, 4.2); pop(frontQ, t, 0.9);
  castleCam(ease(clamp((t - 0.9) / 1.8)) * 0.85); lotLight.intensity = k > 0.3 ? 14 : 0;
  if (k > 0 && k < 0.4) cam.position.x += Math.sin(t * 80) * 0.06;
  return S;
}
function shotCastle(t, d) { // 一夜を華やかにしてくれる、大人のお城（ありし日の姿）
  reset(); lift(60); TOWER.visible = false; castleOn(0.85 + 0.15 * Math.sin(t * 6)); vacancy.visible = false; heartsP.set((t * 0.28) % 1);
  FRONT.position.set(0, 0, lerp(6.5, 3.2, clamp(t / d))); walkCouple(FRONT, t); FRONT.rotation.y = Math.PI;
  const u = ease(clamp(t / d)); look(lerp(-5, 3, u), lerp(2.2, 3.4, u), lerp(20, 22, u), 0, 4.6, 0, 50);
  return S;
}
function fieldCam(t, d) { const u = ease(clamp(t / d)); look(FX + lerp(-2, 2, u), lerp(21, 23, u), lerp(20, 22, u), FX, 0, -11, 50); }
function shotCount(t, d) { // 全国に4,425軒（届出・2025年末）
  reset(); lift(150); minisShow(clamp(t / 1.5)); fieldCam(t, d);
  const v = Math.round(4425 * easeOut(clamp((t - 0.1) / 1.4)));
  setTop('全国（届出・2025年末）', `${v.toLocaleString('en-US')}軒`, fade(t, 0.1, d - 0.1, 0.2), PINK);
  return S;
}
function shotSales(t, d) { // 売上は推計で年7,114億円（推計・2014年度）
  reset(); lift(260); coins(clamp(t / 2.0)); coinSpark.set(clamp((t - 1.4) / 1.6));
  const u = ease(clamp(t / d)); look(GX, lerp(6.5, 8.5, u), lerp(15, 17, u), GX, 1.6, -3, 50);
  const v = Math.round(7114 * easeOut(clamp((t - 0.1) / 1.2)));
  setTop('売上（推計・2014年度）', `年${v.toLocaleString('en-US')}億円`, fade(t, 0.1, d - 0.1, 0.2), GOLD);
  return S;
}
function shotVanish(t, d) { // そのお城が全国から消えた
  reset(); lift(150); const u = clamp((t - 0.3) / 1.8); minisVanish(u); miniSpark.set(clamp((t - 0.3) / 2.2));
  fieldLight.intensity = 50 * (1 - u * 0.8); fieldCam(t, d);
  return S;
}
function streetBase(t) { WALKERS.forEach(p => stroll(p, t + 20, 36, 92)); }
function toward(c, t, d, [x0, z0], [x1, z1], t0 = 0, t1 = 2.4) { const e = clamp((t - t0) / (t1 - t0)); c.visible = e < 0.98; c.position.set(lerp(x0, x1, e), 0, lerp(z0, z1, e)); c.rotation.y = Math.atan2(x1 - x0, z1 - z0); walkCouple(c, t); c.userData.h.visible = false; }
function shotSplit(t, d) { // ビジホと民泊に静かに分かれる
  reset(); lift(150); streetBase(t);
  toward(CA, t, d, [HX - 3.5, 2.4], [HX, -1.6], 0.1, d - 0.4); toward(CB, t, d, [MPX + 3.5, 2.6], [MPX - 0.8, -1.5], 0.3, d - 0.2);
  frontTag.position.set(HX + 1.6, 1.6, -1.2); pop(frontTag, t, 0.8);
  const u = ease(clamp(t / d)); look(lerp(58.4, 59.0, u), lerp(6.5, 7.0, u), lerp(27, 26, u), 58.9, 3.4, -1.8, 52);
  return S;
}
function shotApt(t, d) { // 一人暮らしの恋人がいる人は、そっちの部屋へ
  reset(); lift(180); streetBase(t);
  toward(CC, t, d, [AX + 3.6, 2.4], [AX - 1.25, -1.4], 0, d * 0.62);
  if (t > d * 0.68) aptWin[1].color.set('#ffd98a');
  const u = ease(clamp(t / d)); look(lerp(AX + 2.2, AX + 1.2, u), lerp(4.2, 4.6, u), lerp(15.5, 14.5, u), AX, 3.4, -1.5, 52);
  return S;
}
function shotCalm(t, d) { // 街は何も変わらない。……と、誰もが思った
  reset(); lift(120); streetBase(t); aptWin[1].color.set('#ffd98a');
  const late = clamp((t - (d - 1.3)) / 1.0); hemi.intensity = 1.15 - 0.45 * late; streetLight.intensity = 26 - 10 * late;
  const u = ease(clamp(t / d)); look(lerp(60, 64, u), lerp(13, 12, u), lerp(27, 26, u), 62, 2.4, -2, 52);
  return S;
}
function shotJikka(t, d) { // 実家暮らしのカップル：玄関に親がいて Uターン
  reset(); lift(140);
  const open = clamp((t - 1.0) / 0.4); jDoorPivot.rotation.y = 1.4 * ease(open);
  DAD.visible = open > 0.3; DAD.rotation.y = 0; DAD.userData.arms[1].rotation.set(-2.4, 0, -0.2);
  okaeri.position.set(JX - 0.9, 2.75, -0.2); pop(okaeri, t, 1.3);
  const turn = clamp((t - 1.9) / 0.4);
  const zA = lerp(4.0, 1.9, clamp(t / 1.1)); const zB = zA + 2.4 * clamp((t - 2.2) / 1.4);
  CJ.position.set(JX + 1.0, 0, t < 2.2 ? zA : zB); CJ.rotation.y = Math.PI + Math.PI * ease(turn); CJ.userData.h.visible = t < 1.4;
  if (t < 1.1 || t > 2.2) walkCouple(CJ, t); else standCouple(CJ);
  const u = ease(clamp(t / d)); look(lerp(JX + 4.2, JX + 3.8, u), 4.0, lerp(11.5, 11, u), JX + 0.2, 1.6, 0.2, 50);
  return S;
}
function shotRow(t, d) { // 未婚者の約7割は、親と同居
  reset(); lift(230);
  ROW.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 1.5 + i) * 0.15; });
  ROOFS.forEach(g => { const k = clamp((t - 0.4 - g.userData.d) / 0.45); g.visible = k > 0; g.position.set(g.userData.x, g.userData.y + 2.5 * (1 - easeOut(k)), g.userData.z); });
  const u = ease(clamp(t / d)); look(RX, lerp(3.8, 3.6, u), lerp(14, 13.4, u), RX, 1.7, -0.4, 50);
  setTop('未婚者の親との同居（2021年 出生動向基本調査）', '約7割', fade(t, 0.2, d - 0.1, 0.2), GOLD);
  setHud('男女別', '男65.9%・女72.1%', fade(t, 0.5, d - 0.1, 0.2));
  return S;
}
function shotStation(t, d) { // デートは毎回、駅で解散
  reset(); lift(230); RIDERS.forEach(p => stroll(p, t, SX - 7, SX + 7));
  const LX = SX - 0.6; poseClear(SW); poseClear(SM);
  let z, ry;
  if (t < 1.0) { z = lerp(1.6, 0.4, t / 1.0); ry = Math.PI; poseWalk(SW, t * 7); }
  else if (t < 2.2) { z = 0.4; ry = t < 1.3 ? Math.PI : 0; }
  else { z = 0.4 - 1.2 * (t - 2.2); ry = Math.PI; poseWalk(SW, t * 7); }
  SW.position.set(LX, 0, z); SW.rotation.y = ry;
  SM.position.set(SX - 1.8, 0, 1.9); SM.rotation.y = Math.PI * 0.9;
  const wave = Math.sin(t * 9) * 0.35;
  if (t > 1.2) SM.userData.arms[1].rotation.set(-2.8, 0, -0.3 + wave);
  if (t > 1.3 && t < 2.2) SW.userData.arms[0].rotation.set(-2.8, 0, 0.3 + wave);
  matane.position.set(SX - 2.0, 2.75, 1.9); pop(matane, t, 1.3);
  setHud('時刻', '21:30', fade(t, 0.2, d - 0.1, 0.2));
  const u = ease(clamp(t / d)); look(lerp(SX + 0.4, SX, u), 3.6, lerp(10.5, 10, u), SX - 1.2, 1.5, 0.2, 50);
  return S;
}
function family({ apart = 0 } = {}) {
  poseClear(PA); poseClear(MA); poseSit(PA); poseSit(MA);
  PA.position.set(KX + lerp(1.0, 2.7, apart), PA.position.y, lerp(0.15, 0.4, apart)); PA.rotation.y = lerp(0, Math.PI / 2 - 0.3, apart);
  MA.position.set(KX + lerp(2.0, 0.3, apart), MA.position.y, lerp(0.15, 0.4, apart)); MA.rotation.y = lerp(0, -Math.PI / 2 + 0.3, apart);
  for (const p of [PA, MA]) { p.userData.arms.forEach(a => a.rotation.x = -1.0); p.userData.head.rotation.x = 0.25; }
}
function shotHome(t, d) { // 子育て中の夫婦。家には子ども
  reset(); lift(260); family(); zz.position.y = 1.3 + Math.sin(t * 2) * 0.08;
  KIDS.forEach((k, i) => { k.position.y = 0.3 + Math.sin(t * 2 + i) * 0.01; });
  const u = ease(clamp(t / d)); look(lerp(KX + 0.6, KX + 0.4, u), lerp(4.4, 4.2, u), lerp(8.8, 8.4, u), KX + 0.4, 0.5, -0.6, 52);
  return S;
}
function shotPrice(t, d) { // ビジホは割高（料金表を見てため息）
  reset(); lift(160); family(); PH.g.visible = true; PH.g.position.set(KX + 1.5, 2.9, 1.2); PH.g.scale.setScalar(0.62); PH.g.rotation.set(-0.1, 0, 0);
  sigh1.position.set(KX + 0.4, 1.55, 0.4); pop(sigh1, t, 0.9); sigh2.position.set(KX + 2.6, 1.55, 0.4); pop(sigh2, t, 1.3);
  const u = ease(clamp(t / d)); look(KX + 1.5, lerp(2.6, 2.5, u), lerp(7.6, 7.2, u), KX + 1.5, 1.9, 0.4, 50);
  return S;
}
function shotLess(t, d) { // もともと夫婦の半数以上がレス（51.9%・2020年調査）
  reset(); lift(260); family({ apart: ease(clamp(t / 1.2)) }); gap.position.set(KX + 1.5, 1.5, 0.5); pop(gap, t, 1.1);
  const u = ease(clamp(t / d)); look(lerp(KX + 0.7, KX + 0.9, u), lerp(4.8, 4.6, u), lerp(10, 9.6, u), KX + 0.6, 0.5, -0.4, 52);
  setTop('婚姻関係にある人のレス（2020年調査）', '51.9%', fade(t, 0.2, d - 0.1, 0.2), PINK);
  return S;
}
function shotKeep(t, d) { // お城は、夫婦が籠城できる最後の場所だった（回想）
  reset(); lift(250); TOWER.visible = false; FRONT.visible = false; castleOn(0.9 + 0.1 * Math.sin(t * 5)); vacancy.visible = false;
  KEEP.visible = true; standCouple(KEEP); KEEP.userData.m.userData.arms[0].rotation.set(-2.7, 0, Math.sin(t * 6) * 0.3); KEEP.userData.h.position.y = 2.4 + Math.sin(t * 3) * 0.08;
  flagPole.visible = flag.visible = true; flag.scale.x = 1 + Math.sin(t * 5) * 0.06;
  rojo.position.set(0, 8.3, 1.0); pop(rojo, t, 0.7); heartsP.set((t * 0.25) % 1);
  const u = ease(clamp(t / d)); look(lerp(3, 2, u), lerp(5.5, 5.8, u), lerp(25, 23.5, u), 0, 5.6, 0, 50);
  return S;
}
function detOnTower(p) { poseClear(p); p.position.set(TWX, TWH + 0.07, TWZ); p.rotation.y = Math.PI * 0.82; }
function shotDetective(t, d) { // そして一番困ったのは、浮気調査の探偵（今：お城は跡地）
  reset(); lift(80); castleAt(1); lot.visible = lotSign.visible = true; FRONT.visible = false;
  DET.visible = true; detOnTower(DET); aim(DET, 0.2 + 0.6 * ease(clamp(t / 0.8))); DET.userData.head.rotation.y = Math.sin(t * 2.2) * 0.35; DET.userData.sweat.userData.set(clamp((t - 1.0) / 0.5), t);
  towerTag.position.set(TWX, TWH + 2.75, TWZ); pop(towerTag, t, 0.4);
  const u = ease(clamp(t / d)); look(lerp(-4.0, -4.6, u), lerp(5.0, 5.2, u), lerp(19.5, 20, u), TWX, 3.2, TWZ, 46);
  setTop('浮気調査の探偵', 'ピンチ', fade(t, 0.3, d - 0.1, 0.2), GOLD);
  return S;
}
function shotPhoto(t, d) { // オトナのホテルに入る2人の写真は、ほぼ一発の証拠だった（回想）
  reset(); lift(60); castleOn(1); FRONT.rotation.y = Math.PI; FRONT.position.set(0, 0, lerp(5.2, 2.6, clamp(t / 1.6))); walkCouple(FRONT, t); FRONT.visible = t < 1.7; FRONT.userData.h.visible = false;
  DET.visible = true; detOnTower(DET); aim(DET, 1);
  const f = (t > 0.9 && t < 1.05) || (t > 1.3 && t < 1.42); camFlash.intensity = f ? 30 : 0; camFlash.position.set(TWX + 0.5, TWH + 2, TWZ - 1); el.flash.style.opacity = f ? 0.25 : 0;
  photo.position.set(-4.6, 6.4, 7.0); pop(photo, t, 1.6, 0.4, 4.4);
  const u = ease(clamp(t / d)); look(lerp(-10.5, -11, u), lerp(4.2, 4.6, u), lerp(19, 20, u), -2.0, 3.8, 3, 50);
  setTop('オトナのホテルの出入りの写真', '有力な証拠', fade(t, 0.3, d - 0.1, 0.2), GOLD);
  return S;
}
function detPose(p, x, z, ry, k = 1) { poseClear(p); p.position.set(x, 0, z); p.rotation.y = ry; aim(p, k); }
function beCam(t, d) { const u = ease(clamp(t / d)); look(lerp(BX + 6.0, BX + 5.6, u), 2.8, lerp(-1.0, -1.6, u), BX + 0.9, 3.0, -15.0, 50); }
function shotExcuse(t, d) { // ビジホだと、出張です、打ち合わせです、で逃げられる
  reset(); lift(170); BECOUPLE.position.set(BX - 0.6, 0, -15.8); BECOUPLE.rotation.y = 0.3; standCouple(BECOUPLE);
  ex1.position.set(BX - 1.4, 2.55, -15.0); pop(ex1, t, 0.3); ex2.position.set(BX + 0.4, 3.25, -15.3); pop(ex2, t, 1.3);
  DET3.visible = true; detPose(DET3, BX + 3.2, -12.6, -Math.PI * 0.75, clamp(1 - (t - 1.8) / 0.5)); detQ.position.set(BX + 3.2, 2.9, -12.6); pop(detQ, t, 2.0);
  beCam(t, d);
  setTop('ふつうのホテルの出入りの写真', 'それだけでは弱い', fade(t, 0.3, d - 0.1, 0.2), GOLD);
  return S;
}
function shotReport(t, d) { // 探偵の報告書は、決め手なし、の山
  reset(); lift(240);
  const n = clamp(t / d); PILES.forEach((sh, j) => sh.forEach((s, k) => s.visible = k < sh.length * (0.45 + 0.55 * n) + j));
  DOC.userData.fill(3, t > 0.75 ? '決め手なし' : '');
  const hits = [0.7, 1.5, 2.3];
  const last = hits.filter(h => t >= h).length;
  const tgt = [[DX + 0.1, 1.62, 0.7], [DX - 1.3, 2.25, -0.3], [DX + 1.4, 1.95, -0.4]];
  const i = t < hits[0] + 0.5 ? 0 : t < hits[1] + 0.5 ? 1 : 2;
  hankoSlam(HANKO, tgt[i], t, hits[i], { from: 1.6, up: 0.9 });
  MARKS.forEach((m, j) => { const k = clamp((t - hits[j]) / 0.15); m.visible = k > 0; m.position.set(tgt[j][0], tgt[j][1] + 0.05, tgt[j][2] + 0.2); m.userData.size(1.0 + 0.3 * (1 - k)); });
  DET2.visible = true; poseClear(DET2); DET2.position.set(DX + 2.7, 0, 1.3); DET2.rotation.y = -0.6; DET2.userData.camB.visible = DET2.userData.lens.visible = false; DET2.userData.head.rotation.x = 0.4; DET2.userData.sweat.userData.set(1, t);
  const u = ease(clamp(t / d)); look(lerp(DX + 1.4, DX + 1.0, u), lerp(5.4, 5.2, u), lerp(9.0, 8.6, u), DX + 0.8, 1.2, -0.2, 50);
  return S;
}
function shotLost(t, d) { // 籠城できなくなった夫婦と、見張り台を失った探偵
  reset(); lift(180); castleAt(1); lot.visible = lotSign.visible = true; FRONT.visible = true; FRONT.position.set(TWX - 2.5, 0, TWZ + 1.0); FRONT.rotation.y = 0.3; standCouple(FRONT); FRONT.userData.h.visible = false;
  FRONT.userData.m.userData.head.rotation.x = 0.3; FRONT.userData.w.userData.head.rotation.x = 0.3;
  const k = clamp((t - 1.2) / 0.7); towerFall(k); towerSpark.set(clamp((t - 1.75) / 1.1));
  DET.visible = true; detPose(DET, TWX + 1.0, TWZ + 2.2, -0.2, 0); DET.userData.head.rotation.y = 0.6; DET.userData.sweat.userData.set(clamp((t - 1.5) / 0.4), t);
  const u = ease(clamp(t / d)); look(lerp(-7.4, -7.6, u), lerp(5.0, 5.2, u), lerp(27, 28, u), TWX + 0.1, 1.8, TWZ, 58);
  return S;
}
function shotResult(t, d, chip) { // 結果：お城が消えて一番得したのは、浮気している人だけだった
  reset(); lift(170); BECOUPLE.position.set(BX - 0.6, 0, -15.8); BECOUPLE.rotation.y = 0.35; standCouple(BECOUPLE);
  BECOUPLE.userData.m.userData.arms[0].rotation.set(-2.6, 0, -0.3);
  noProof.position.set(BX - 0.6, 3.2, -15.2); pop(noProof, t, 0.4); niyari.position.set(BX - 2.2, 2.35, -15.0); pop(niyari, t, 1.0);
  DET3.visible = true; poseClear(DET3); DET3.position.set(BX + 3.2, 0, -12.6); DET3.rotation.y = -Math.PI * 0.75; DET3.userData.head.rotation.x = 0.4; DET3.userData.camB.visible = DET3.userData.lens.visible = false; DET3.userData.sweat.userData.set(1, t);
  beCam(t, d + 3);
  if (chip) setTop('一番得したのは', '浮気している人だけ', fade(t, 0.2, d - 0.1, 0.2), GREEN);
  return S;
}
function shotAsk(t) { // 質問。最後は冒頭と同じ構図（お城が消えたまま）でループ
  reset(); lift(200); TOWER.visible = false; castleAt(1); lot.visible = lotSign.visible = true; frontPose(1); FRONT.rotation.y = Math.sin(t * 2) * 0.4;
  frontQ.position.set(1.0, 2.7, 4.2); frontQ.visible = true; frontQ.userData.size(1.5);
  castleCam(0.85); lotLight.intensity = 14;
  return S;
}

const NARR = { '4,425軒': 'よんせんよんひゃくにじゅうごけん', '7,114億円': 'ななせんひゃくじゅうよんおくえん', '約7割': 'やくななわり', '一夜': 'いちや', 'お城': 'おしろ', '城を': 'しろを', '民泊': 'みんぱく', '一人暮らし': 'ひとりぐらし', '実家暮らし': 'じっかぐらし', '2人きり': 'ふたりきり', '2人の': 'ふたりの', '割高': 'わりだか', '籠城': 'ろうじょう', '一発': 'いっぱつ', '決め手': 'きめて', '見張り台': 'みはりだい', '浮気': 'うわき', '結果：': '結果、', '質問：': '質問、', '……': '' };
let RT = 0; // 結果の1つ目の長さ（2つ目で続きから動かす）
const P = planTimes([
  ['一夜を華やかにしてくれる、<br>大人のお城。', shotCastle],
  ['全国に4,425軒。', shotCount],
  ['売上は推計で<br>年7,114億円。', shotSales],
  ['ある日、そのお城が<br>全国から消えた。', shotVanish],
  ['城を追われたカップルは、<br>ビジホと民泊に静かに分かれる。', shotSplit],
  ['一人暮らしの恋人がいる人は、<br>そっちの部屋へ。', shotApt],
  ['街は何も変わらない。<br>……と、誰もが思った。', shotCalm],
  ['最初に困ったのは、<br>実家暮らしのカップル。', shotJikka],
  ['未婚者の約7割は、<br>親と同居。', shotRow],
  ['2人きりになれる場所が消えて、<br>デートは毎回、駅で解散。', shotStation],
  ['次に困ったのは、<br>子育て中の夫婦。', shotHome],
  ['家には子ども、<br>ビジホは割高。', shotPrice],
  ['もともと夫婦の<br>半数以上がレス。', shotLess],
  ['お城は、夫婦が籠城できる<br>最後の場所だった。', shotKeep],
  ['そして一番困ったのは、<br>浮気調査の探偵。', shotDetective],
  ['オトナのホテルに入る2人の<br>写真は、ほぼ一発の証拠だった。', shotPhoto],
  ['ビジホだと、出張です、<br>打ち合わせです、で逃げられる。', shotExcuse],
  ['探偵の報告書は、<br>決め手なし、の山。', shotReport],
  ['籠城できなくなった夫婦と、<br>見張り台を失った探偵。', shotLost],
  ['結果：お城が消えて<br>一番得したのは、', (t, d) => { RT = d; return shotResult(t, d, false); }],
  ['浮気している<br>人だけだった。', (t, d) => shotResult(t + RT, d + RT, true)],
  ['質問：最後にお城に<br>行ったのは、誰とだった？', shotAsk],
], { start: 2.7, end: 61.6, shot0, card: 65.6, endCard, narr: NARR });
// 2つ目の結果のショットのために、1つ目の長さを先に入れておく
RT = P.subs[20][0] - P.subs[19][0];
const at = P.at;

runStory({
  shots: P.shots, subs: P.subs, duration: 65.6, camera: cam,
  meta: {
    id: '0655',
    v2: true,
    hookLine: '大人のお城が、全国から消えた。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしもオトナのホテルが消えたら？',
    titleHtml: 'もしも<br>オトナのホテルが<br>消えたら？',
    mood: 'mystery', seed: 655,
    hits: [0.45, at(3), at(19)], risers: [at(6), at(14)],
    impacts: [at(1, 0.4), at(2, 0.4), at(8, 0.3), at(12, 0.3), at(19)],
    sfx: [[0.45, 'poof'], [at(3, 0.3), 'poof'], [at(4, 0.2), 'whoosh'], [at(6, 1.2), 'meter', 0.6], [at(7, 1.0), 'bubble'], [at(9, 1.4), 'whoosh'], [at(11, 0.9), 'bubble'], [at(15, 0.9), 'whoosh'], [at(16, 0.3), 'bubble'], [at(17, 0.7), 'buzz'], [at(18, 1.3), 'poof'], [at(19, 0.4), 'bubble']],
    narr: NARR,
    ask: '最後にお城に行ったのは、誰とだった？',
    caption: 'もしもオトナのホテルが消えたら？\n\n一夜を華やかにしてくれる、大人のお城。全国に4,425軒（届出・2025年末）、売上は推計で年7,114億円（2014年度）。\nある日、そのお城が全国から消えた。城を追われたカップルは、ビジホと民泊、一人暮らしの部屋に静かに分かれる。街は何も変わらない。……と、誰もが思った。\n\n最初に困ったのは、実家暮らしのカップル。未婚者の約7割は親と同居（2021年）。2人きりになれる場所が消えて、デートは毎回、駅で解散。\n次に困ったのは、子育て中の夫婦。家には子ども、ビジホは割高。もともと夫婦の半数以上がレス（51.9%・2020年調査）。お城は、夫婦が籠城できる最後の場所だった。\nそして一番困ったのは、浮気調査の探偵。オトナのホテルに入る2人の写真は、ほぼ一発の証拠だった。ビジホだと 出張です 打ち合わせです で逃げられる。\n\n結果：お城が消えて一番得したのは、浮気している人だけだった。\n\n最後にお城に行ったのは、誰とだった？ コメントで教えて。\n\n出典：警察庁 生活安全局保安課「令和7年における風俗営業等の現状」（届出 4,425・2025年末）／矢野経済研究所の推計（7,114億円・2014年度・利用料）／国立社会保障・人口問題研究所「第16回出生動向基本調査」（2021年・未婚者の親との同居 男性65.9%・女性72.1%）／日本家族計画協会「ジャパン・セックスサーベイ2020」（婚姻関係にある人の51.9%）／弁護士ドットコム「不倫の証拠」\n※風刺ネタです。',
    hashtags: ['もしもラボ', 'もしも', 'オトナのホテル', '浮気調査', '探偵'],
    endStats: [['全国のオトナのホテル（届出）', '4,425軒', '2025年末・警察庁'], ['親と同居する未婚者', '約7割', '2021年・出生動向基本調査'], ['一番得したのは', '浮気している人だけ', '風刺です']],
    sources: '出典：警察庁 風俗営業等の現状（2025年末）／矢野経済研究所の推計（2014年度）／社人研 第16回出生動向基本調査（2021年）／ジャパン・セックスサーベイ2020／弁護士ドットコム',
  },
});
