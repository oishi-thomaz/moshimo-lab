import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop, makePhone } from '../satire-kit.js';
import { makeSuit, makeSweat, poseSit, makeDeskIsland } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeTable, makePipeChair, makeShelf } from '../scenes/home.js';
import { makeDoc } from '../scenes/hanko.js';

// もしも日本から、情報商材が消えたら？（皮肉回・台本 S109・社会の消えたら）
// 2026/11/18 ゆうと承認（投稿サーバーで ok）。前半は稼ぎ方を売る情報商材屋、後半は楽して稼ぎたかった会社員に返す
// 数字は使わない（30万円・月収100万円は筋の中の額。消費者相談の件数は出さない）。実在の人物・サービス・車種・ロゴは出さない
// 特定の副業（せどり・投資など）は悪く言わない。投資のチャート・お金をばらまく絵は出さない

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a';
const { S, flat, room, hemi } = makeSet({ bg: '#cfe0ee', ground: '#9aa4ac' }); hemi.intensity = 1.3;

// 情報商材屋（派手なシャツ・サングラス）
const SHOU = makeMan({ shirt: '#e8c040', pants: '#1f2430', hair: '#6a4a2a' }); S.add(SHOU);
const GLASS = box(0.36, 0.08, 0.04, mat('#15161c')); GLASS.position.set(0, 0.27, 0.2); SHOU.userData.head.add(GLASS);
const CHAIN = box(0.22, 0.03, 0.02, mat('#ffd860')); CHAIN.position.set(0, 1.38, 0.15); SHOU.add(CHAIN);
const sweatS = makeSweat(); SHOU.userData.head.add(sweatS);
const SPHONE = box(0.09, 0.17, 0.02, mat('#15161c')); SPHONE.position.set(0, -0.66, 0.08); SHOU.userData.arms[1].add(SPHONE);
// 会社員
const KAI = makeSuit({ jacket: '#4a5266', tie: '#3a6ab2' }); S.add(KAI);
const sweatK = makeSweat(); KAI.userData.head.add(sweatK);
const KPHONE = box(0.09, 0.17, 0.02, mat('#15161c')); KPHONE.position.set(0, -0.66, 0.08); KAI.userData.arms[1].add(KPHONE);
const APRON = box(0.46, 0.5, 0.04, mat('#4a8a5a')); APRON.position.set(0, 1.05, 0.16); KAI.add(APRON);

// 大きなスマホ（アップ用。広告の画面）
const BIG = makePhone({ w: 1.25, h: 2.45, cw: 540, ch: 1060 }); S.add(BIG.g);
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
function screenAds(k) { // k=1 広告あり、0 消えた
  BIG.draw('ads' + (k > 0.5 ? 1 : 0), (g, w, h) => {
    g.fillStyle = '#f4f5f8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8dce4'; g.fillRect(0, 0, w, 90);
    g.fillStyle = '#9aa0aa'; for (let i = 0; i < 3; i++) rr(g, 30, 130 + i * 300, w - 60, 40, 12);
    g.fillStyle = '#c8ccd4'; for (let i = 0; i < 3; i++) { rr(g, 30, 190 + i * 300, w - 140, 26, 10); rr(g, 30, 232 + i * 300, w - 220, 26, 10); }
    if (k > 0.5) {
      const ads = [['月収100万円', '#e8202a', '#fff'], ['楽して稼ぐ', '#ffd21a', '#2a1a00'], ['誰でもできる', '#e8202a', '#fff']];
      ads.forEach(([s, bg, fg], i) => { g.fillStyle = bg; rr(g, 24, 112 + i * 300, w - 48, 250, 26); g.fillStyle = fg; g.font = '900 76px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, w / 2, 200 + i * 300); g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.fillText('今すぐ 無料登録 ▶', w / 2, 300 + i * 300); });
    }
  });
}
function screenJob() {
  BIG.draw('job', (g, w, h) => {
    g.fillStyle = '#f4f5f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a8a5a'; g.fillRect(0, 0, w, 150);
    g.fillStyle = '#fff'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('求人さがし', w / 2, 78);
    ['倉庫の仕分け', 'お店の品出し', 'ホールスタッフ'].forEach((s, i) => { g.fillStyle = '#fff'; rr(g, 26, 190 + i * 260, w - 52, 220, 22); g.fillStyle = '#2a2e38'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.fillText(s, w / 2, 260 + i * 260); g.fillStyle = '#3a8a5a'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText('未経験OK', w / 2, 340 + i * 260); });
  });
}
function screenSearch() {
  BIG.draw('search', (g, w, h) => {
    g.fillStyle = '#f4f5f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; rr(g, 24, 60, w - 48, 110, 55); g.strokeStyle = '#9aa0aa'; g.lineWidth = 4; g.beginPath(); g.roundRect(24, 60, w - 48, 110, 55); g.stroke();
    g.fillStyle = '#2a2e38'; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('副業 楽して 稼ぐ', 60, 116);
    g.fillStyle = '#c8ccd4'; for (let i = 0; i < 6; i++) { rr(g, 30, 230 + i * 130, w - 60, 34, 10); rr(g, 30, 278 + i * 130, w - 200, 24, 10); }
  });
}

// ---------- A：路上の自撮り（原点）。架空の金色の車 ----------
flat(40, 30, '#8a9098', 0, -2);
const WALLA = box(30, 6, 0.3, mat('#d8d2c8')); WALLA.position.set(0, 3, -6); S.add(WALLA);
function makeSports(color) {
  const g = new THREE.Group();
  const b = box(4.2, 0.6, 1.9, mat(color)); b.position.y = 0.55; g.add(b);
  const nose = box(1.2, 0.3, 1.8, mat(color)); nose.position.set(1.9, 0.5, 0); nose.rotation.z = -0.18; g.add(nose);
  const c = box(1.7, 0.45, 1.6, mat('#2a3040')); c.position.set(-0.3, 1.05, 0); g.add(c);
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6d0 }); for (const s of [-1, 1]) { const l = box(0.05, 0.12, 0.4, hl); l.position.set(2.45, 0.6, s * 0.6); g.add(l); }
  for (const x of [-1.35, 1.35]) for (const s of [-1, 1]) { const w = box(0.7, 0.7, 0.26, mat('#1b1d22')); w.position.set(x, 0.35, s * 0.88); g.add(w); }
  return g;
}
const CAR = makeSports('#d8b040'); CAR.position.set(0.6, 0, -2.6); S.add(CAR);
const kieta = label('広告が 消えた', { w: 768, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.0 }); S.add(kieta);
const pa = label('パッ', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(pa);
const sparkA = makeSparkles(90, 0.06, 0xffffff); S.add(sparkA.points); sparkA.init([[0, 1.55, 0.7]], 0.7, 0.6);
const henkyaku = label('レンタル 返却', { w: 768, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(henkyaku);
const KEY = box(0.08, 0.16, 0.03, mat('#d8dde4')); KEY.position.set(0, -0.66, 0.08); SHOU.userData.arms[0].add(KEY);
const BENCH = box(1.6, 0.08, 0.5, mat('#8a6a48')); BENCH.position.set(-3.2, 0.45, -1.2); S.add(BENCH);
for (const dx of [-0.65, 0.65]) { const l = box(0.08, 0.45, 0.4, mat('#5a4a3a')); l.position.set(-3.2 + dx, 0.22, -1.2); S.add(l); }

// ---------- B：だまされた人たち（x=60） ----------
const BX = 60;
room({ x: BX, w: 10, d: 7, h: 3.2, wall: '#e9e2d8', floor: '#b8a48a' });
const VIC = [makeWoman({ shirt: '#7a9ac8', hair: '#3a2620' }), makeMan({ shirt: '#8a7a6a' }), makeMan({ shirt: '#5a8a6a', hair: '#3a3330' })]; VIC.forEach(p => S.add(p));
const DOCB = makeDoc({ title: '楽に稼げる方法', rows: ['お値段', '中身'], head: '#c8242c', w: 1.6, h: 1.4 }); DOCB.position.set(BX, 2.0, -3.3); S.add(DOCB);
const sanjuu = label('30万円', { w: 512, size: 130, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.75 }); S.add(sanjuu);

// ---------- C：誰も来ないセミナー（x=120） ----------
const CX = 120;
room({ x: CX, w: 12, d: 9, h: 3.4, wall: '#e6e9ee', floor: '#7d8798' });
const CHAIRS = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const ch = makePipeChair('#5a6a8a'); ch.position.set(CX - 2.5 + c * 1.0, 0, -0.6 + r * 1.1); ch.rotation.y = Math.PI; S.add(ch); CHAIRS.push(ch); }
const BANNER = label('無料セミナー', { w: 900, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 2.6 }); BANNER.position.set(CX, 2.75, -4.3); S.add(BANNER);
const PODIUM = box(0.8, 1.0, 0.5, mat('#5a4a3a')); PODIUM.position.set(CX, 0.5, -3.2); S.add(PODIUM);
const zero = label('参加者 0人', { w: 768, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.1 }); S.add(zero);

// ---------- D：会社員の机（x=180） ----------
const DX = 180;
room({ x: DX, w: 9, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(DX, 0, -0.8); S.add(ISL);
const yamerare = label('検索が やめられない', { w: 1000, size: 96, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.4 }); S.add(yamerare);
const demo = label('売る側 だけじゃない', { w: 1000, size: 96, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.4 }); S.add(demo);

// ---------- E：近所の店（x=240） ----------
const EX = 240;
flat(30, 20, '#a8a49a', EX, -2);
const SHOP = box(8, 3.6, 0.3, mat('#efe6d6')); SHOP.position.set(EX, 1.8, -3.2); S.add(SHOP);
const AWN = box(8.2, 0.25, 1.2, mat('#3a8a5a')); AWN.position.set(EX, 3.0, -2.6); S.add(AWN);
const DOOR = box(1.4, 2.2, 0.06, mat('#9fc6e8')); DOOR.position.set(EX - 1.6, 1.1, -3.0); S.add(DOOR);
const SHELF = makeShelf({ w: 2.6, h: 1.8, colors: ['#e85a5a', '#5a9ae8', '#f2c14e', '#6ac46a', '#ffffff'], rows: 3, seed: 7 }); SHELF.position.set(EX + 1.6, 0, -2.7); S.add(SHELF);
const BOSHU = makeDoc({ title: '週末スタッフ募集', rows: ['時間', '曜日'], head: '#3a8a5a', w: 1.3, h: 1.2 }); BOSHU.position.set(EX - 1.6, 2.1, -2.95); S.add(BOSHU);
const TENCHO = makeWoman({ shirt: '#f4f4f2', hair: '#4a3022', pants: '#3a3f4e' }); S.add(TENCHO);
const oubo = label('応募します', { w: 768, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.95 }); S.add(oubo);
const ENV = new THREE.Group(); { const e = box(0.5, 0.32, 0.03, mat('#f4ecd8')); ENV.add(e); const f = box(0.5, 0.1, 0.032, mat('#e0d4b8')); f.position.y = 0.11; ENV.add(f); } S.add(ENV);
const sparkE = makeSparkles(70, 0.06, 0xfff2c0); S.add(sparkE.points); sparkE.init([[EX, 1.7, -0.6]], 0.4, 0.4);
const nokoru = label('副業のお金が 残った', { w: 1000, size: 96, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.4 }); S.add(nokoru);

// ---------- F：約束と時給（x=300） ----------
const FX = 300;
flat(30, 20, '#3a3448', FX, -2);
const BACKF = box(16, 8, 0.2, mat('#2c2838')); BACKF.position.set(FX, 4, -6); S.add(BACKF);
const BF = [['広告の約束', '#e8202a'], ['バイトの時給', '#4aa86a']].map(([n, c]) => { const b = box(1.0, 1, 0.6, mat(c)); S.add(b); const l = label(n, { w: 700, size: 90, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.95 }); S.add(l); return { b, l }; });
const nanjuu = label('何十分の一', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.0 }); S.add(nanjuu);

// ---------- 結果・ひねり ----------
const urite = label('楽に稼げるのは 売る人だけ', { w: 1200, size: 90, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.75 }); S.add(urite);
const kietanoha = label('消えたのは 売る人', { w: 900, size: 100, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.25 }); S.add(kietanoha);

const PEOPLE = [SHOU, KAI, TENCHO, ...VIC];
const LABELS = [kieta, pa, henkyaku, sanjuu, zero, yamerare, demo, oubo, nokoru, nanjuu, urite, kietanoha, ...BF.map(x => x.l)];
function clearP(p) { p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; }
function reset() {
  PEOPLE.forEach(clearP); LABELS.forEach(l => l.visible = false); sparkA.set(0); sparkE.set(0); el.flash.style.opacity = 0; sweatS.userData.set(0); sweatK.userData.set(0);
  BIG.g.visible = false; BIG.g.rotation.set(0, 0, 0); BIG.g.scale.setScalar(1); CAR.visible = true; ENV.visible = false; APRON.visible = false; KEY.visible = false; SPHONE.visible = true; KPHONE.visible = true;
  BF.forEach(x => x.b.visible = false);
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function selfie(p) { p.userData.arms[1].rotation.set(-2.3, 0, -0.35); p.userData.arms[0].rotation.set(0, 0, 0.1); }
function shouAt(x, z, ry = 0) { SHOU.visible = true; SHOU.position.set(x, 0, z); SHOU.rotation.y = ry; }
function phoneCam(u = 0) { look(lerp(0.3, 0.1, u), 1.55, lerp(5.6, 5.2, u), 0.1, 1.2, -0.4, 50); }
function shot0(t) { // 0秒＝サムネ：スマホの 月収100万円 の広告が、画面から一斉にパッと消える
  reset(); lift(0); shouAt(-1.3, -1.4, 0.35); selfie(SHOU);
  BIG.g.visible = true; BIG.g.position.set(0.5, 1.3, 0.4); BIG.g.rotation.y = -0.12; BIG.g.scale.setScalar(0.52);
  const gone = t > TP; screenAds(gone ? 0 : 1);
  if (gone) { sparkA.set(clamp((t - TP) / 0.7)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; say(pa, t, TP, 0.95, 2.05, 0.7, 0.36); }
  if (t > TP + 0.3) say(kieta, t, TP + 0.3, 0.5, 0.42, 0.6, 0.7);
  phoneCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function streetCam(u = 0) { look(lerp(1.0, 0.6, u), 1.9, lerp(6.8, 6.0, u), 0.1, 1.05, -1.8, 50); }
function sKatamaru(t, d) { // 借りた高級車の前で、自撮りしていた情報商材屋が、スマホを構えたまま固まる
  reset(); lift(120); shouAt(-0.6, -0.8, 0.25); selfie(SHOU); if (t > d * 0.5) sweatS.userData.set(1, t);
  SHOU.userData.head.rotation.x = t > d * 0.5 ? -0.15 : 0;
  streetCam(ease(clamp(t / d)));
  return S;
}
function vicCam(u = 0) { look(BX + lerp(0.4, 0.2, u), 1.8, lerp(4.6, 4.2, u), BX, 1.5, -1.6, 50); }
function sFuman(t, d) { // だまされた人たちの不満から。楽に稼げる方法、が30万円だった
  reset(); lift(120); VIC.forEach((p, i) => { p.visible = true; p.position.set(BX - 1.3 + i * 1.3, 0, -1.2 + (i === 1 ? -0.3 : 0)); p.rotation.y = (i - 1) * -0.25; p.userData.head.rotation.x = 0.15; p.userData.arms[i % 2].rotation.set(-0.5, 0, 0); });
  DOCB.userData.fill(0, t > d * 0.5 ? '300,000円' : ''); DOCB.userData.fill(1, t > d * 0.75 ? '？？？' : '');
  if (t > d * 0.55) say(sanjuu, t, d * 0.55, BX + 1.15, 2.6, -3.0, 0.6);
  vicCam(ease(clamp(t / d)));
  return S;
}
function semCam(u = 0) { look(CX + lerp(0.4, 0.1, u), lerp(2.6, 2.3, u), lerp(5.6, 4.8, u), CX, 1.2, -2.0, 50); }
function sSeminar(t, d) { // 1日目。情報商材屋の 無料セミナー に、誰も来ない
  reset(); lift(120); shouAt(CX, -2.6, 0); SHOU.userData.arms[1].rotation.set(-1.4, 0, 0.2); SHOU.userData.arms[0].rotation.set(-0.3, 0, -0.3);
  if (t > d * 0.5) { SHOU.userData.arms[1].rotation.set(-0.2, 0, 0); SHOU.userData.head.rotation.x = 0.25; sweatS.userData.set(1, t); say(zero, t, d * 0.5, CX, 2.15, -2.4, 0.9); }
  setHud('情報商材が消えて', '1日目', 1);
  semCam(ease(clamp(t / d)));
  return S;
}
function sHenkyaku(t, d) { // 3日目。借りていた高級車を、返しに行く
  reset(); lift(120); const k = clamp(t / d); shouAt(lerp(-2.2, -1.2, k), -1.2, Math.PI / 2 - 0.3); SHOU.userData.head.rotation.x = 0.25; KEY.visible = true; SPHONE.visible = false;
  SHOU.userData.arms[0].rotation.set(-0.9, 0, 0); SHOU.userData.legs[0].rotation.x = Math.sin(t * 6) * 0.3; SHOU.userData.legs[1].rotation.x = -Math.sin(t * 6) * 0.3;
  if (t > d * 0.35) say(henkyaku, t, d * 0.35, 1.0, 2.1, -2.4, 0.9);
  setHud('情報商材が消えて', '3日目', 1);
  streetCam(0.5);
  return S;
}
function sKyujin(t, d) { // 1週間後。情報商材屋が、求人アプリを開く
  reset(); lift(120); CAR.visible = false; shouAt(-3.2, -1.4, 0.3); poseSit(SHOU); SHOU.position.y += 0.1; SHOU.userData.arms[1].rotation.set(-1.3, 0, 0.1); SHOU.userData.head.rotation.x = 0.35;
  BIG.g.visible = true; screenJob(); BIG.g.position.set(-2.35, 1.5, 0.5); BIG.g.rotation.y = -0.1; BIG.g.scale.setScalar(0.45 + 0.07 * easeOut(clamp(t / 0.6)));
  setHud('情報商材が消えて', '1週間後', 1);
  look(-2.75, 1.6, 3.8, -2.85, 1.25, -0.6, 50);
  return S;
}
function deskKai() { const st = ISL.userData.seats[1]; KAI.visible = true; KAI.position.set(DX + st.x, 0, -0.8 + st.z); KAI.rotation.y = 0; poseSit(KAI); KAI.userData.arms[1].rotation.set(-1.35, 0, 0.1); KAI.userData.arms[0].rotation.set(-1.1, 0, 0); KAI.userData.head.rotation.x = 0.3; return st; }
function sDemo(t, d) { // でも、困ったのは、売る側だけじゃなかった
  reset(); lift(120); const st = deskKai();
  if (t > d * 0.45) say(demo, t, d * 0.45, DX + st.x, 2.15, -0.8 + st.z, 1.0);
  const u = ease(clamp(t / d)); look(DX + st.x + lerp(1.2, 0.5, u), lerp(2.4, 2.0, u), -0.8 + st.z + lerp(5.0, 3.8, u), DX + st.x, 1.4, -0.8 + st.z, 50);
  return S;
}
function sKensaku(t, d) { // 楽して稼ぎたかった会社員は、副業の検索がやめられない
  reset(); lift(230); const st = deskKai(); sweatK.userData.set(t > d * 0.5 ? 1 : 0, t);
  BIG.g.visible = true; screenSearch(); BIG.g.position.set(DX + st.x + 0.6, 1.5, -0.8 + st.z + 0.9); BIG.g.rotation.y = -0.15; BIG.g.scale.setScalar(0.36);
  if (t > d * 0.45) say(yamerare, t, d * 0.45, DX + st.x + 0.15, 2.2, -0.8 + st.z + 0.3, 0.95);
  look(DX + st.x + 0.35, 1.75, -0.8 + st.z + 3.8, DX + st.x + 0.25, 1.5, -0.8 + st.z, 50);
  return S;
}
function shopCam(u = 0) { look(EX + lerp(0.2, 0.0, u), 1.8, lerp(5.0, 4.4, u), EX - 0.2, 1.4, -1.6, 50); }
function sOubo(t, d) { // 結局、会社員は、近所の店の週末のバイトに応募する
  reset(); lift(120); KAI.visible = true; KAI.position.set(EX - 1.0, 0, -1.2); KAI.rotation.y = 0.5; KAI.userData.arms[1].rotation.set(-1.3, 0, 0.2);
  TENCHO.visible = true; TENCHO.position.set(EX + 0.4, 0, -1.6); TENCHO.rotation.y = -0.6;
  BOSHU.userData.fill(0, '土日'); BOSHU.userData.fill(1, '未経験OK');
  if (t > d * 0.45) say(oubo, t, d * 0.45, EX - 0.45, 2.3, -0.7, 0.8);
  shopCam(ease(clamp(t / d)));
  return S;
}
function bfCam() { look(FX, 1.7, 8.6, FX, 1.45, 0, 50); }
function sJikyu(t, d) { // 時給は、広告が約束した額の、何十分の一
  reset(); lift(260); const k = easeOut(clamp((t - 0.2) / 1.0)); const hs = [2.7 * k, 0.1 * k + 0.01];
  BF.forEach((x, i) => { const h = Math.max(0.01, hs[i]); x.b.visible = true; x.b.scale.y = h; x.b.position.set(FX - 0.85 + i * 1.7, h / 2, 0); x.l.visible = true; x.l.position.set(FX - 0.85 + i * 1.7, h + 0.35, 0.4); x.l.userData.size(0.8); });
  if (t > d * 0.5) say(nanjuu, t, d * 0.5, FX + 0.85, 1.05, 0.4, 0.9);
  bfCam();
  return S;
}
function sNokoru(t, d) { // それでも1か月後、手元には初めて、副業のお金が残る
  reset(); lift(120); KAI.visible = true; KAI.position.set(EX, 0, -0.9); KAI.rotation.y = 0; APRON.visible = true; KPHONE.visible = false; KAI.userData.arms.forEach((a, i) => a.rotation.set(-1.2, 0, i ? 0.25 : -0.25));
  ENV.visible = true; ENV.position.set(EX, 1.32, -0.35); sparkE.set(clamp((t - d * 0.3) / 1.2));
  if (t > d * 0.45) say(nokoru, t, d * 0.45, EX, 2.25, -0.9, 1.15);
  setHud('週末のバイト', '1か月後', 1);
  look(EX + 0.3, 1.7, 2.4, EX, 1.45, -0.9, 50);
  return S;
}
function sKekka(t, d) { // 結果：情報商材が消えて、消えたのは稼ぎ方じゃなく、稼ぎ方を売って稼いでいた人たちだった
  reset(); lift(120); shouAt(CX + 0.0, -2.6, 0); SHOU.userData.head.rotation.x = 0.3; SHOU.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); sweatS.userData.set(0.6, t);
  BANNER.visible = true;
  if (t > d * 0.5) say(kietanoha, t, d * 0.5, CX, 2.45, -1.2, 1.6);
  setTop('結果', '売る人が 消えた', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(CX + lerp(0.1, 0.5, u), lerp(2.3, 2.8, u), lerp(4.0, 6.2, u), CX, 1.2, -2.0, 50);
  return S;
}
function sUrite(t, d) { // 楽して稼げる方法は、それを売っている人だけが、楽に稼げる方法だったのかもしれない
  reset(); lift(120); shouAt(-0.6, -0.8, 0.25); selfie(SHOU);
  BIG.g.visible = true; screenAds(1); BIG.g.position.set(1.2, 1.5, -0.4); BIG.g.rotation.y = -0.3; BIG.g.scale.setScalar(0.65);
  if (t > d * 0.4) say(urite, t, d * 0.4, 0.3, 2.65, -0.6, 1.45);
  look(0.5, 1.75, 4.4, 0.2, 1.45, -1.0, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); shouAt(-1.3, -1.4, 0.35); selfie(SHOU); sweatS.userData.set(1, t); BIG.g.visible = true; BIG.g.position.set(0.5, 1.3, 0.4); BIG.g.rotation.y = -0.12; BIG.g.scale.setScalar(0.52); screenAds(0); phoneCam(0); return S; }

const NARR = { '借りた': 'かりた', '高級車': 'こうきゅうしゃ', '前': 'まえ', '自撮り': 'じどり', '情報商材屋': 'じょうほうしょうざいや', '情報商材': 'じょうほうしょうざい', '構えた': 'かまえた', '固まる': 'かたまる', '人たち': 'ひとたち', '不満': 'ふまん', '楽に': 'らくに', '稼げる': 'かせげる', '方法': 'ほうほう', '30万円': 'さんじゅうまんえん', '1日目': 'いちにちめ', '無料': 'むりょう', '誰も来ない': 'だれもこない', '3日目': 'みっかめ', '返しに行く': 'かえしにいく', '1週間後': 'いっしゅうかんご', '求人': 'きゅうじん', '開く': 'ひらく', '困った': 'こまった', '売る側': 'うるがわ', '楽して': 'らくして', '稼ぎたかった': 'かせぎたかった', '会社員': 'かいしゃいん', '副業': 'ふくぎょう', '検索': 'けんさく', '結局': 'けっきょく', '近所': 'きんじょ', '店': 'みせ', '週末': 'しゅうまつ', '応募': 'おうぼ', '時給': 'じきゅう', '広告': 'こうこく', '約束': 'やくそく', '額': 'がく', '何十分の一': 'なんじゅうぶんのいち', '1か月後': 'いっかげつご', '手元': 'てもと', '初めて': 'はじめて', '残る': 'のこる', '結果：': '結果、', '消えて': 'きえて', '消えた': 'きえた', '稼ぎ方': 'かせぎかた', '売って': 'うって', '稼いでいた': 'かせいでいた', '売っている人': 'うっているひと', '見た': 'みた' };
const P = planTimes([
  ['借りた高級車の前で、<br>自撮りしていた情報商材屋が、', (t, d) => sKatamaru(t, 2 * d)],
  ['スマホを構えたまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['だまされた人たちの<br>不満から。', (t, d) => sFuman(t, 2 * d)],
  ['楽に稼げる方法、が<br>30万円だった。', (t, d) => sFuman(t + d, 2 * d)],
  ['1日目。情報商材屋の<br>無料セミナー に、誰も来ない。', sSeminar],
  ['3日目。借りていた<br>高級車を、返しに行く。', sHenkyaku],
  ['1週間後。情報商材屋が、<br>求人アプリを開く。', sKyujin],
  ['でも、困ったのは、<br>売る側だけじゃなかった。', sDemo],
  ['楽して稼ぎたかった会社員は、<br>副業の検索がやめられない。', sKensaku],
  ['結局、会社員は、近所の店の<br>週末のバイトに応募する。', sOubo],
  ['時給は、広告が約束した額の、<br>何十分の一。', sJikyu],
  ['それでも1か月後、手元には<br>初めて、副業のお金が残る。', sNokoru],
  ['結果：情報商材が消えて、<br>消えたのは稼ぎ方じゃなく、', (t, d) => sKekka(t, 2 * d)],
  ['稼ぎ方を売って稼いでいた<br>人たちだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['楽して稼げる方法は、それを<br>売っている人だけが、', (t, d) => sUrite(t, 2 * d)],
  ['楽に稼げる方法<br>だったのかもしれない。', (t, d) => sUrite(t + d, 2 * d)],
  ['楽して稼げる の広告、<br>見たことある？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0698',
    v2: true,
    tt: 'main',
    hookLine: 'スマホの 月収100万円 の広告が、画面から一斉にパッと消える。',
    series: '社会の消えたら',
    hookType: 'H2',
    cat: '日本の社会・人口・仕事',
    title: 'もしも日本から、情報商材が消えたら？',
    titleHtml: 'もしも日本から、<br>情報商材が<br>消えたら？',
    mood: 'tension', seed: 698, hits: [TP, P.at(12), P.at(15)], risers: [P.at(7)], impacts: [P.at(3, 0.5), P.at(10, 0.6)],
    sfx: [[TP, 'poof'], [P.at(1, 0.4), 'meter', 0.3], [P.at(4, 1.0), 'meter', 0.4], [P.at(5, 0.6), 'whoosh'], [P.at(8, 0.6), 'alarm'], [P.at(11, 0.8), 'bubble'], [P.at(15, 0.3), 'whoosh']],
    narr: NARR,
    ask: '楽して稼げる の広告、見たことある？',
    caption: 'もしも日本から、情報商材が消えたら？\n\n借りた高級車の前で、自撮りしていた情報商材屋が、スマホを構えたまま固まる。\nだまされた人たちの不満から。楽に稼げる方法、が30万円だった。\n1日目。情報商材屋の 無料セミナー に、誰も来ない。\n3日目。借りていた高級車を、返しに行く。\n1週間後。情報商材屋が、求人アプリを開く。\nでも、困ったのは、売る側だけじゃなかった。\n楽して稼ぎたかった会社員は、副業の検索がやめられない。\n結局、会社員は、近所の店の週末のバイトに応募する。\n時給は、広告が約束した額の、何十分の一。\nそれでも1か月後、手元には初めて、副業のお金が残る。\n\n結果：情報商材が消えて、消えたのは稼ぎ方じゃなく、稼ぎ方を売って稼いでいた人たちだった。\n楽して稼げる方法は、それを売っている人だけが、楽に稼げる方法だったのかもしれない。\n\n楽して稼げる の広告、見たことある？ コメントで教えて。\n\n※風刺ネタです。情報商材が消えるのは、もしもの設定です。金額は物語の中の額で、登場する人物・広告・店は架空です',
    hashtags: ['もしもラボ', 'もしも', '情報商材', '副業', '社会の消えたら'],
    endStats: [['消えたもの', '情報商材', 'もしもの設定'], ['会社員に残ったもの', '副業のお金', '週末のバイト'], ['楽に稼げる方法の正体', '売る人だけが 楽に稼げる', 'かもしれない']],
    sources: '※風刺ネタです（もしもの設定・登場するものは架空）',
  },
});
