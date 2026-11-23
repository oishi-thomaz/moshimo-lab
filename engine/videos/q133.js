import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #133 ガンニバル（ドラマ・日本・2022年・ディズニープラス「スター」の日本発オリジナルシリーズ。Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/gannibaru（見放題：Disney Plus）と Filmarks の動画配信欄（ディズニープラス 見放題）で2026/11/23確認。
//   Filmarks 4.2・レビュー33,184件 filmarks.com/dramas/11380/15787）
// 確かめた事実（2026/11/23）：
//   ・ディズニープラス公式 disneyplus.com/ja-jp/explore/articles/gannibal ：原作は二宮正明の漫画（累計発行部数400万部超）。主演 柳楽優弥。
//     舞台は都会から遠い山あいの供花村。主人公は家族（妻と娘）とともに駐在の警察官として赴任する。森で村の一族の祖母が、歯型の付いた遺体で見つかる。
//     村を支配する一族は、村人から関わらない方がいいと忠告されるほど恐れられている。村には「この村では人が喰われるらしい」という噂がある
//   ・映画.com 特集 eiga.com/l/8CUWh ：2022年にディズニープラスで世界配信。前任の駐在が噂を追った末に失踪した
// 構成（ヒント6段）：1 森の奥でおばあさんが見つかる・体には奇妙なあと → 2 主人公は山あいの村に来た駐在の警察官・妻と娘といっしょに
//   → 3 深い山にかこまれた静かな村・村人はある一族をおそれている → 4 前の駐在はゆくえ不明・村のひみつを追いはじめる
//   → 5 2022年の日本のドラマ・原作は400万部をこえる漫画 → 6 決め手：村に伝わるおそろしいうわさ・この村では人が食われる
// 一族の正体・うわさの真相・結末は言わない。村の名前・登場人物の名前は出さない。血や遺体の姿は見せない（白い布と警察のテープだけ）。
// 俳優の顔・ポスター・ロゴ・漫画の絵は使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#2a3428', floor: '#3a4230', fogNear: 14, fogFar: 60 });
const qs = S.scene;
const R = rng(13310);

const COP = { skin: '#e0b088', hair: '#1a1410', shirt: '#2a3a5a', pants: '#1e2638' };
const WIFE = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#c8b8a0', pants: '#6a5a4a', long: true, skirt: true };
const GIRL = { skin: '#f4d3b5', hair: '#2a2018', shirt: '#e8a0a8', pants: '#5a4a6a', long: true, skirt: true, scale: 0.6 };
const VIL = [{ skin: '#d8a880', hair: '#3a3a3a', shirt: '#5a4a3a', pants: '#3a3028' }, { skin: '#e0b090', hair: '#8a8a8a', shirt: '#6a5a4a', pants: '#3a3a3a' }, { skin: '#d8a880', hair: '#1a1410', shirt: '#4a4a3a', pants: '#2a2a24' }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
function cap(p) { const c = box(0.44, 0.1, 0.44, mat('#1e2638')); c.position.y = 0.53; p.userData.head.add(c); const b = box(0.44, 0.03, 0.18, mat('#14182a')); b.position.set(0, 0.49, 0.28); p.userData.head.add(b); return c; }
function tree(x, z, h = 6) { const g = new THREE.Group(); const tk = box(0.3, h * 0.5, 0.3, mat('#3a2a1e')); tk.position.y = h * 0.25; g.add(tk);
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.4 - i * 0.35, h * 0.35, 7), mat(['#1e3a24', '#24442a', '#1a3220'][i])); c.position.y = h * 0.42 + i * h * 0.2; g.add(c); }
  g.position.set(x, 0, z); qs.add(g); return g; }
function house(x, z, ry = 0, s = 1) { const g = new THREE.Group(); const w = box(4, 2.4, 3, mat('#7a6a54')); w.position.y = 1.2; g.add(w);
  const r = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 4), mat('#3a3a40')); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.8); r.position.y = 3.2; g.add(r);
  g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); qs.add(g); return g; }

// ---------- 1段目. 朝もやの森（x=0）。木の根元に白い布。黄色いテープ。立ちつくす村人たち ----------
{ const gr = box(30, 0.04, 30, mat('#2e3a26')); gr.position.set(0, 0.02, -8); qs.add(gr);
  for (let i = 0; i < 26; i++) tree(-10 + R() * 20, -3 - R() * 16, 5 + R() * 4); }
const SHEET1 = box(1.4, 0.18, 0.7, mat('#e8e8e4')); SHEET1.position.set(0.2, 0.1, -3.2); qs.add(SHEET1);
const TAPE1 = new THREE.Group(); for (const [x1, z1, x2, z2] of [[-1.4, -2.0, 1.8, -2.0], [1.8, -2.0, 1.8, -4.6], [-1.4, -2.0, -1.4, -4.6]]) { const l = Math.hypot(x2 - x1, z2 - z1); const t = box(l, 0.06, 0.02, mat('#e8c820')); t.position.set((x1 + x2) / 2, 0.85, (z1 + z2) / 2); t.rotation.y = -Math.atan2(z2 - z1, x2 - x1); TAPE1.add(t); }
for (const [x, z] of [[-1.4, -2.0], [1.8, -2.0], [-1.4, -4.6], [1.8, -4.6]]) { const p = box(0.06, 0.9, 0.06, mat('#5a4a3a')); p.position.set(x, 0.45, z); TAPE1.add(p); } qs.add(TAPE1);
const VIL1 = [person(VIL[0], -2.4, -4.4, 1.2), person(VIL[1], 2.6, -4.2, -1.3), person(VIL[2], -2.2, -1.6, 2.2)];
const COP1 = person(COP, 0.9, -1.2, Math.PI + 0.3); cap(COP1);
const MIST1 = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), gl('#c8d0c4', 0.18)); m.position.set(-6 + R() * 12, 0.6 + R() * 1.4, -5 - R() * 8); qs.add(m); MIST1.push(m); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tFound = tag('森の奥で、おばあさんが…', { size: 52, w: 720, bg: '#14161c', sx: 2.0 }); qs.add(tFound);
const tMark = tag('その体には、奇妙なあと', { size: 52, w: 700, bg: '#e24050', sx: 2.0 }); qs.add(tMark);

// ---------- 2段目. 山あいの駐在所（x=50）。家族3人で引っ越してくる ----------
const AX = 50;
{ const gr = box(30, 0.04, 20, mat('#4a5238')); gr.position.set(AX, 0.02, -4); qs.add(gr);
  const rd = box(3, 0.03, 20, mat('#8a8070')); rd.position.set(AX, 0.04, -2); qs.add(rd);
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(5 + R() * 4, 6 + R() * 6, 6), mat(['#2a4a2e', '#24402a', '#30502e'][i % 3])); m.position.set(AX - 24 + i * 5.4, 3, -24 - R() * 6); qs.add(m); } }
const BOX2 = house(AX + 3.2, -4.6, -0.3, 0.8);
const LAMP2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), gl('#e83a2a')); LAMP2.position.set(AX + 1.9, 2.0, -3.3); qs.add(LAMP2); { const br = box(0.08, 0.08, 0.5, mat('#3a3a3a')); br.position.set(AX + 1.9, 2.0, -3.55); qs.add(br); }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), new THREE.MeshBasicMaterial({ fog: false, color: '#9aa8a8' })); SKY2.position.set(AX, 10, -32); qs.add(SKY2);
const COP2 = person(COP, AX - 0.6, -1.4, Math.PI - 0.3); cap(COP2);
const WIFE2 = person(WIFE, AX + 0.2, -1.0, Math.PI - 0.1); const GIRL2 = person(GIRL, AX + 0.8, -0.8, Math.PI);
const tCop = tag('主人公は、村に来た駐在さん', { size: 50, w: 780, bg: '#14161c', sx: 1.8 }); tCop.position.set(AX, 2.6, -1.6); qs.add(tCop);
const tFam = tag('妻と娘と、いっしょに', { size: 54, w: 620, bg: '#e24050', sx: 1.6 }); tFam.position.set(AX, 2.6, -1.6); qs.add(tFam);

// ---------- 3段目. 夕暮れの村（x=100）。古い家々と、ひときわ大きな屋敷。家の陰から、こちらを見る村人たち ----------
const BX = 100;
{ const gr = box(40, 0.04, 30, mat('#3a4030')); gr.position.set(BX, 0.02, -8); qs.add(gr);
  house(BX - 5, -6, 0.3); house(BX + 5.5, -5, -0.4); house(BX - 2, -12, 0.1, 0.9);
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(6 + R() * 4, 8 + R() * 6, 6), mat(['#1e3424', '#223a26', '#1a2e20'][i % 3])); m.position.set(BX - 26 + i * 6.5, 3.5, -28 - R() * 4); qs.add(m); } }
const MANOR3 = new THREE.Group(); { const w = box(9, 3.2, 4, mat('#4a3a2e')); w.position.y = 1.6; MANOR3.add(w); const r = box(10, 0.6, 5, mat('#24242a')); r.position.y = 3.5; MANOR3.add(r); const r2 = box(7, 0.5, 3.6, mat('#2a2a30')); r2.position.y = 4.0; MANOR3.add(r2);
  const gt = box(2.4, 2.6, 0.3, mat('#2a2018')); gt.position.set(0, 1.3, 2.3); MANOR3.add(gt); const wl = box(12, 1.4, 0.3, mat('#5a5048')); wl.position.set(0, 0.7, 2.4); MANOR3.add(wl); }
MANOR3.position.set(BX + 1, 0, -16); qs.add(MANOR3);
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ fog: false, color: '#c88a5a' })); SKY3.position.set(BX, 12, -36); qs.add(SKY3);
const VIL3 = [person(VIL[0], BX - 3.2, -4.0, 0.6), person(VIL[1], BX + 3.6, -3.2, -0.5), person(VIL[2], BX - 1.0, -8.0, 0.2), person(VIL[0], BX + 2.0, -9.0, -0.2)];
const tCalm = tag('深い山にかこまれた、静かな村', { size: 48, w: 820, bg: '#14161c', sx: 1.8 }); tCalm.position.set(BX, 2.9, -2.4); qs.add(tCalm);
const tFear = tag('村人は、ある一族をおそれている', { size: 48, w: 840, bg: '#e24050', sx: 1.6 }); tFear.position.set(BX, 2.9, -2.4); qs.add(tFear);

// ---------- 4段目. 夜の駐在所の机（x=150）。前の駐在が残した古いノート。懐中電灯の光 ----------
const CX = 150;
{ const fl = box(10, 0.04, 8, mat('#4a3e30')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4, 0.2, mat('#6a5e4e')); wl.position.set(CX, 2, -4.6); qs.add(wl);
  const dk = box(2.0, 0.08, 1.0, mat('#5a4430')); dk.position.set(CX, 0.8, -2.6); qs.add(dk); const dl = box(1.9, 0.78, 0.9, mat('#4a3424')); dl.position.set(CX, 0.39, -2.6); qs.add(dl);
  const lp = new THREE.PointLight('#ffe0a0', 3, 5); lp.position.set(CX + 0.4, 2.0, -2.0); qs.add(lp);
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshLambertMaterial({ map: canvasTex(160, 110, (g) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, 160, 110); g.strokeStyle = '#7a6a50'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 20 + i * 16); g.bezierCurveTo(50, 10 + i * 18, 100, 30 + i * 14, 160, 15 + i * 17); g.stroke(); } g.fillStyle = '#c03030'; g.beginPath(); g.arc(104, 52, 6, 0, 7); g.fill(); }) }));
  mp.position.set(CX + 1.6, 2.0, -4.48); qs.add(mp); }
const NOTE4 = new THREE.Group(); { const c = box(0.5, 0.04, 0.36, mat('#3a2e24')); NOTE4.add(c); const pg = box(0.46, 0.05, 0.32, mat('#e8e0cc')); pg.position.y = 0.01; NOTE4.add(pg); for (let i = 0; i < 5; i++) { const ln = box(0.34, 0.052, 0.01, mat('#6a6050')); ln.position.set(0, 0.012, -0.1 + i * 0.05); NOTE4.add(ln); } }
NOTE4.position.set(CX - 0.2, 0.86, -2.5); qs.add(NOTE4);
const PH4 = box(0.22, 0.01, 0.3, mat('#cfc8b8')); PH4.position.set(CX + 0.4, 0.85, -2.4); PH4.rotation.y = 0.3; qs.add(PH4);
const COP4 = person(COP, CX - 0.2, -1.6, Math.PI); cap(COP4);
const tGone = tag('前の駐在は、ゆくえ不明', { size: 52, w: 680, bg: '#14161c', sx: 1.5 }); tGone.position.set(CX, 2.45, -2.6); qs.add(tGone);
const tDig = tag('村のひみつを、追いはじめる', { size: 50, w: 740, bg: '#e24050', sx: 1.6 }); tDig.position.set(CX, 2.45, -2.6); qs.add(tDig);

// ---------- 5段目. 夜の本棚（x=200）。古いテレビと、背表紙が無地の漫画本の列 ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#2a2622')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#221e1c')); wl.position.set(TX, 2.5, -4.6); qs.add(wl);
  for (let r = 0; r < 3; r++) { const sh = box(3.6, 0.08, 0.6, mat('#4a3424')); sh.position.set(TX + 2.0, 0.9 + r * 0.9, -4.2); qs.add(sh);
    for (let i = 0; i < 18; i++) { const bk = box(0.15, 0.5, 0.36, mat(['#8a2a2a', '#2a2a30', '#d8c8a8', '#3a4a3a'][(i + r) % 4])); bk.position.set(TX + 0.4 + i * 0.18, 1.2 + r * 0.9, -4.1); qs.add(bk); } }
  const tv = box(1.6, 1.2, 1.0, mat('#3a3a40')); tv.position.set(TX - 1.6, 1.3, -3.4); qs.add(tv);
  const st = box(1.8, 0.7, 1.1, mat('#3a2a1e')); st.position.set(TX - 1.6, 0.35, -3.4); qs.add(st); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), gl('#4a6a4a')); SCR5.position.set(TX - 1.6, 1.32, -2.89); qs.add(SCR5);
const t2022 = tag('2022年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.3 }); t2022.position.set(TX, 3.3, -2.8); qs.add(t2022);
const tManga = tag('原作は、400万部をこえる漫画', { size: 48, w: 820, bg: '#e24050', sx: 2.4 }); tManga.position.set(TX, 3.3, -2.8); qs.add(tManga);

// ---------- 6段目. 夜の山道（x=250）。木々のあいだに、いくつもの懐中電灯の光。立ちすくむ駐在さん ----------
const DX = 250;
{ const gr = box(30, 0.04, 30, mat('#1e2618')); gr.position.set(DX, 0.02, -8); qs.add(gr);
  for (let i = 0; i < 28; i++) { const x = DX - 9 + R() * 18; if (Math.abs(x - DX) < 1.2) continue; tree(x, -2 - R() * 16, 5 + R() * 4); } }
const LIGHTS6 = []; for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), gl('#fff0b0')); l.userData.x = DX - 4 + i * 1.3; l.userData.z = -6 - R() * 4; qs.add(l); LIGHTS6.push(l); }
const COP6 = person(COP, DX, -1.4, Math.PI); cap(COP6);
const tRumor = tag('村に伝わる、おそろしいうわさ', { size: 48, w: 820, bg: '#14161c', sx: 1.9 }); qs.add(tRumor);
const tEat = tag('この村では、人が食われる', { size: 52, w: 720, bg: '#e6b450', color: '#14161c', sx: 1.8 }); qs.add(tEat);

// ---------- shots ----------
const ALL = [tFound, tMark, tCop, tFam, tCalm, tFear, tGone, tDig, t2022, tManga, tRumor, tEat, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); LIGHTS6.forEach(l => l.visible = false); }

function shotForest(t, quiz = 0) { // 1段目 0〜9：森の奥で、ひとりのおばあさんが亡くなって見つかる。その体には、奇妙なあとが残っていた（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.6; S.darken(0.2, '#c8d0c4');
  MIST1.forEach((m, i) => { m.position.x = -6 + ((i * 1.7 + t * 0.3) % 12); });
  COP1.userData.head.rotation.x = 0.35; VIL1.forEach((v, i) => v.userData.head.rotation.x = 0.2);
  Q1.position.set(0.2, 1.4, -3.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tFound.position.set(0.2, 2.55, -3.0); tMark.position.copy(tFound.position);
  if (!quiz) { tFound.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tFound.visible = false; tMark.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-0.6, -0.2, u), lerp(2.4, 2.2, u), lerp(2.6, 2.0, u), 0.2, 0.9, -3.4, 62);
  return qs;
}
function shotArrive(t) { // 2段目 9〜17：主人公は、山あいの村に来た駐在の警察官。妻と娘と、いっしょに
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.0;
  const k = clamp(t / 6); [COP2, WIFE2, GIRL2].forEach((p, i) => { p.position.z = [-1.4, -1.0, -0.8][i] - k * 1.4; poseWalk(p, t * 4 + i, k < 1 ? 0.6 : 0); });
  GIRL2.userData.head.rotation.y = Math.sin(t) * 0.5;
  tCop.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCop.visible = false; tFam.userData.pop((t - 4.3) / 0.35);
  tCop.position.z = tFam.position.z = -1.6 - k * 1.4;
  const u = ease(t / 8);
  look(AX + lerp(-0.6, -0.2, u), lerp(1.9, 1.9, u), lerp(1.8, 1.0, u), AX + 0.4, 1.4, -4.0, 62);
  return qs;
}
function shotVillage(t) { // 3段目 17〜25：深い山にかこまれた、静かな村。村人はみな、ある一族をおそれている
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.8; S.key.color.set('#ffb080');
  VIL3.forEach((v, i) => { v.rotation.y = t > 4.2 ? Math.atan2(BX - v.position.x, 6 - v.position.z) : [0.6, -0.5, 0.2, -0.2][i]; });
  tCalm.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCalm.visible = false; tFear.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.3, 0.2, u), lerp(2.2, 2.1, u), lerp(1.4, 0.8, u), BX + 0.2, 1.8, -10, 62);
  return qs;
}
function shotDesk(t) { // 4段目 25〜33：前の駐在は、ゆくえ不明になっていた。主人公は、村のひみつを追いはじめる
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.4; S.darken(0.5, '#0a0a08');
  COP4.userData.head.rotation.x = 0.45; COP4.userData.arms[1].rotation.x = t > 4.4 ? -1.2 : -0.6; COP4.userData.arms[0].rotation.x = -0.9;
  tGone.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGone.visible = false; tDig.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(2.0, 1.6, u), lerp(2.3, 2.2, u), lerp(1.6, 1.1, u), CX - 0.1, 1.3, -2.5, 62);
  return qs;
}
function shotShelf(t) { // 5段目 33〜42：2022年の、日本のドラマ。原作は、400万部をこえる漫画
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#0a0a08');
  SCR5.material.color.setHSL(0.3, 0.2, 0.36 + Math.sin(t * 5) * 0.04);
  t2022.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2022.visible = false; tManga.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.4, 0.3, u), lerp(2.4, 2.3, u), lerp(2.6, 2.0, u), TX + 0.2, 2.0, -3.6, 62);
  return qs;
}
function shotNight(t) { // 6段目 42〜49（決め手）：村に伝わる、おそろしいうわさ。この村では、人が食われる
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.4; S.key.color.set('#8aa0c0'); S.darken(0.6, '#020304');
  LIGHTS6.forEach((l, i) => { const k = clamp((t - 0.5 - i * 0.25) / 5); l.position.set(l.userData.x + Math.sin(t * 1.3 + i) * 0.3, 1.2 + Math.sin(t * 2 + i) * 0.05, l.userData.z + k * 2.5); l.visible = t > 0.5 + i * 0.25; });
  COP6.userData.head.rotation.y = Math.sin(t * 0.9) * 0.4;
  tRumor.position.set(DX, 2.75, -1.6); tEat.position.set(DX, 2.75, -1.6);
  if (t < 3.6) tRumor.userData.pop((t - 0.3) / 0.35); else tEat.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.4, 0.2, u), lerp(1.8, 1.9, u), lerp(1.6, 1.2, u), DX, 1.5, -4.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（朝もやの森に戻る）
  shotForest(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotForest(t, 0) },
  { a: 9, b: 17, f: shotArrive },
  { a: 17, b: 25, f: shotVillage },
  { a: 25, b: 33, f: shotDesk },
  { a: 33, b: 42, f: shotShelf },
  { a: 42, b: 49, f: shotNight },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '森の奥で、ひとりの<br>おばあさんが見つかる。'],
  [5.6, 9.0, 'その体には、<br>奇妙なあとが残っていた。'],
  [9.2, 13.2, '主人公は、山あいの村に来た<br>駐在の警察官。'],
  [13.2, 17.0, '妻と娘と、<br>いっしょに。'],
  [17.2, 21.0, '深い山にかこまれた、<br>静かな村。'],
  [21.0, 25.0, '村人はみな、<br>ある一族をおそれている。'],
  [25.2, 29.0, '前の駐在は、<br>ゆくえ不明になっていた。'],
  [29.0, 33.0, '主人公は、<br>村のひみつを追いはじめる。'],
  [33.2, 37.4, '2022年の、<br>日本のドラマ。'],
  [37.4, 41.8, '原作は、400万部を<br>こえる漫画。'],
  [42.2, 45.4, '村に伝わる、<br>おそろしいうわさ。'],
  [45.4, 49.0, 'この村では、<br>人が食われる。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ガンニバル。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q133', v2: true, answer: 'ガンニバル',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 13310,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'drone', 0.4], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [42.6, 'drone', 0.5], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '森': 'もり', '奥': 'おく', '見つかる': 'みつかる', '体': 'からだ', '奇妙': 'きみょう', '残って': 'のこって', '主人公': 'しゅじんこう', '山あい': 'やまあい', '村': 'むら', '来た': 'きた', '駐在': 'ちゅうざい', '警察官': 'けいさつかん', '妻': 'つま', '娘': 'むすめ', '深い': 'ふかい', '山': 'やま', '静かな': 'しずかな', '村人': 'むらびと', '一族': 'いちぞく', '前': 'まえ', '不明': 'ふめい', '追い': 'おい', '2022年': 'にせんにじゅうにねん', '日本': 'にほん', '原作': 'げんさく', '400万部': 'よんひゃくまんぶ', '漫画': 'まんが', '伝わる': 'つたわる', '人': 'ひと', '食われる': 'くわれる', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n森の奥で、ひとりのおばあさんが見つかる。その体には、奇妙なあとが残っていた。主人公は、山あいの村に来た駐在の警察官。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'ドラマ好き', '日本のドラマ', 'サスペンス'],
  },
});
applyQuizCards({ answer: 'ガンニバル', info: 'Disney+｜日本のドラマ', answerSize: 140 });
