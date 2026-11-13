import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #082 社内お見合い（ドラマ・韓国・2022年・全12話。Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/a-business-proposal で2026/11/13確認（Filmarks の動画配信欄も Netflix 見放題）。
//   Filmarks 4.1・レビュー30,989件 filmarks.com/dramas/11839/16375）
// 確かめた事実（ja.wikipedia.org/wiki/社内お見合い・Filmarks。2026/11/13）：
//   ・主人公は、財閥令嬢の親友から縁談を壊してほしいと頼まれ、親友のふりをしてお見合いに出る。嫌われ役を演じて断られようとする
//   ・お見合いの相手は、主人公が勤める会社の新社長だった。社長は、これ以上見合いをしたくないので結婚を宣言する
//   ・主人公は食品会社の食品開発チームの研究員。社長は親会社の会長の孫で、海外支社から帰ってきたばかり
//   ・韓国SBSで2022年2月28日から4月5日まで、全12話。原作は同名の小説・ウェブ漫画
// 構成（ヒント6段）：1 親友に頼まれて代わりにお見合い、わざと嫌われたい → 2 主人公は食品会社の研究員、相手は自分の会社の新しい社長
//   → 3 きらびやかな大企業、社長はまさかの結婚宣言 → 4 会社では地味な研究員、お見合いでは別人。二つの顔
//   → 5 2022年の韓国ドラマ・全12話、ウェブ漫画が原作のラブコメ → 6 決め手：お見合いの相手が同じ会社の社長、タイトルは会社の中のお見合い
// 正体がばれる場面・恋の行方・結末は言わない。人物名・会社名は出さない。
// 俳優の顔・ポスター・ロゴ・原作の絵・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#22202a', floor: '#2c2a30', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(8282);

const HER_FANCY = { skin: '#f4d3b5', hair: '#6a3a22', shirt: '#d8283c', pants: '#d8283c', long: true, skirt: true };
const HER_LAB = { skin: '#f4d3b5', hair: '#3a2a22', shirt: '#f4f4f0', pants: '#5a6a8a', long: true };
const BOSS = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#1e2a44', pants: '#1e2a44', tie: true };
const STAFF = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#f4d3b5'][i % 3], hair: ['#1d1a19', '#4a3426', '#2c2421'][i % 3], shirt: ['#5a6a7a', '#7a6a8a', '#4a5a5a', '#8a7a6a'][i % 4], pants: '#2b3346', long: i % 2 === 1, skirt: i % 2 === 1, tie: i % 2 === 0 });

function shades(p) { const g = new THREE.Group(); for (const s of [-1, 1]) { const l = box(0.15, 0.09, 0.02, mat('#0c0c10')); l.position.set(s * 0.09, 0.27, 0.205); g.add(l); } const b = box(0.06, 0.02, 0.02, mat('#0c0c10')); b.position.set(0, 0.29, 0.205); g.add(b); p.userData.head.add(g); return g; }
function hat(p) { const g = new THREE.Group(); const br = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 24), mat('#f2e0c8')); g.add(br); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.2, 18), mat('#f2e0c8')); c.position.y = 0.1; g.add(c); const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.05, 18), mat('#d8283c')); rb.position.y = 0.03; g.add(rb); g.position.y = 0.55; p.userData.head.add(g); return g; }
function glasses(p) { const g = new THREE.Group(); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), mat('#2a2a2a')); r.position.set(s * 0.085, 0.27, 0.21); g.add(r); } p.userData.head.add(g); return g; }
function ring() { const g = new THREE.Group(); const r = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.07, 10, 28), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.85, roughness: 0.2 })); g.add(r); const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), new THREE.MeshStandardMaterial({ color: '#dff4ff', metalness: 0.3, roughness: 0.05, emissive: '#3a5a7a' })); d.position.y = 0.42; g.add(d); return g; }

// ---------- 1段目. ホテルのラウンジ（x=0）。派手な服で、わざと嫌われようとする女性 ----------
{ const fl = box(14, 0.04, 12, mat('#8a6a52')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#e8dcc8')); wl.position.set(0, 2.5, -5.5); qs.add(wl);
  for (let i = 0; i < 3; i++) { const win = box(2.2, 3, 0.05, new THREE.MeshBasicMaterial({ color: '#b8d4ec' })); win.position.set(-4 + i * 4, 2.4, -5.38); qs.add(win); }
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 24), mat('#f8f6f0')); tb.position.set(0, 0.76, -2.2); qs.add(tb);
  const lg = box(0.12, 0.74, 0.12, mat('#c8a050')); lg.position.set(0, 0.37, -2.2); qs.add(lg);
  for (const x of [-1.25, 1.25]) { const ch = box(0.6, 0.45, 0.6, mat('#8a2a3a')); ch.position.set(x, 0.23, -2.2); qs.add(ch); const bk = box(0.12, 0.7, 0.6, mat('#8a2a3a')); bk.position.set(x * 1.24, 0.6, -2.2); qs.add(bk); }
  for (let i = 0; i < 2; i++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 12), mat('#ffffff')); cup.position.set(-0.25 + i * 0.5, 0.84, -2.2); qs.add(cup); }
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.6, 12), mat('#c8a050')); pl.position.set(-3.6, 0.3, -3.6); qs.add(pl); const pt = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), mat('#3a7a4a')); pt.position.set(-3.6, 1.2, -3.6); qs.add(pt); }
const her1 = makePerson(HER_FANCY); her1.position.set(-1.2, -0.3, -2.2); her1.rotation.y = Math.PI / 2; her1.userData.legs.forEach(l => l.rotation.x = -1.5); shades(her1); hat(her1); qs.add(her1);
const boss1 = makePerson(BOSS); boss1.position.set(1.2, -0.3, -2.2); boss1.rotation.y = -Math.PI / 2; boss1.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(boss1);
const SWEAT1 = []; for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#8ad0ff' })); d.scale.y = 1.5; qs.add(d); SWEAT1.push(d); }
const tProxy = tag('代わりのお見合い', { size: 62, w: 540, bg: '#14161c', sx: 1.9 }); tProxy.position.set(0, 2.25, -2.4); qs.add(tProxy);
const tHate = tag('わざと嫌われたい', { size: 62, w: 540, bg: '#d8283c', sx: 1.9 }); tHate.position.set(0, 2.25, -2.4); qs.add(tHate);

// ---------- 2段目. 食品会社の研究室（x=40）。白衣の研究員と、入ってくる社長 ----------
const AX = 40;
{ const fl = box(12, 0.04, 10, mat('#c8ccd0')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(12, 4.5, 0.2, mat('#eef2f4')); wl.position.set(AX, 2.25, -4); qs.add(wl);
  const bench = box(4, 0.9, 1, mat('#dfe6ea')); bench.position.set(AX - 0.6, 0.45, -2.6); qs.add(bench);
  const top = box(4.1, 0.06, 1.05, mat('#3a4a5a')); top.position.set(AX - 0.6, 0.92, -2.6); qs.add(top);
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.28, 12), new THREE.MeshStandardMaterial({ color: ['#8ad0a0', '#f2c14e', '#e88aa0', '#8ab0e0', '#d0a070'][i], transparent: true, opacity: 0.8 })); f.position.set(AX - 2.2 + i * 0.7, 1.09, -2.8); qs.add(f); }
  for (let i = 0; i < 3; i++) { const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.12, 14), mat('#ffffff')); bw.position.set(AX - 1.4 + i * 0.6, 1.01, -2.35); qs.add(bw); }
  const door = box(1.2, 2.4, 0.06, mat('#8a9aa8')); door.position.set(AX + 3.4, 1.2, -3.88); qs.add(door);
  const shelf = box(2, 1.6, 0.4, mat('#b8c4cc')); shelf.position.set(AX - 3.8, 0.8, -3.7); qs.add(shelf); }
const her2 = makePerson(HER_LAB); her2.position.set(AX - 0.6, 0, -1.8); her2.rotation.y = Math.PI; glasses(her2); qs.add(her2);
const boss2 = makePerson(BOSS); boss2.position.set(AX + 3.4, 0, -3.2); qs.add(boss2);
const EXCL2 = tag('！', { size: 100, w: 140, h: 140, bg: '#d8283c', sx: 0.5 }); qs.add(EXCL2);
const tLab = tag('食品会社の研究員', { size: 60, w: 540, bg: '#14161c', sx: 1.9 }); tLab.position.set(AX, 2.9, -2.0); qs.add(tLab);
const tBoss = tag('相手は、うちの社長', { size: 60, w: 580, bg: '#2a5aa8', sx: 2.0 }); tBoss.position.set(AX, 2.9, -2.0); qs.add(tBoss);

// ---------- 3段目. ガラス張りの大企業（x=80）。社長室の窓と、飛び出す指輪 ----------
const BX = 80;
{ const gr = box(30, 0.04, 30, mat('#3a3a42')); gr.position.set(BX, 0.02, -8); qs.add(gr);
  for (let i = 0; i < 3; i++) { const h = [16, 22, 14][i]; const b = box(5, h, 4, new THREE.MeshStandardMaterial({ color: '#6a8aaa', metalness: 0.6, roughness: 0.2 })); b.position.set(BX - 6 + i * 6, h / 2, -14); qs.add(b);
    for (let f = 0; f < h / 1.2; f++) { const s = box(5.02, 0.06, 4.02, mat('#c8d8e8')); s.position.set(BX - 6 + i * 6, f * 1.2 + 0.6, -14); qs.add(s); } }
  const office = box(6, 0.04, 4, mat('#4a4a54')); office.position.set(BX, 0.02, -3); qs.add(office);
  const desk = box(2.2, 0.8, 0.9, mat('#3a2a24')); desk.position.set(BX, 0.4, -3.2); qs.add(desk); }
const boss3 = makePerson(BOSS); boss3.position.set(BX, 0, -2.4); qs.add(boss3);
const STAFF3 = []; for (let i = 0; i < 4; i++) { const p = makePerson(STAFF(i)); p.position.set(BX + [-2.4, -1.4, 1.4, 2.4][i], 0, -1.0); p.rotation.y = Math.PI; qs.add(p); STAFF3.push(p); }
const RING3 = ring(); RING3.position.set(BX, 2.4, -2.4); qs.add(RING3);
const tCorp = tag('きらびやかな大企業', { size: 60, w: 580, bg: '#14161c', sx: 2.0 }); tCorp.position.set(BX, 3.6, -2.4); qs.add(tCorp);
const tMarry = tag('まさかの結婚宣言', { size: 62, w: 560, bg: '#d8283c', sx: 2.0 }); tMarry.position.set(BX, 3.6, -2.4); qs.add(tMarry);

// ---------- 4段目. 鏡の前（x=120）。地味な研究員と、派手な別人。二つの顔 ----------
const CX = 120;
{ const fl = box(10, 0.04, 8, mat('#6a5a68')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(10, 4.5, 0.2, mat('#d8cce0')); wl.position.set(CX, 2.25, -3.5); qs.add(wl);
  const fr = box(1.6, 2.6, 0.08, mat('#c8a050')); fr.position.set(CX, 1.5, -3.36); qs.add(fr);
  const mir = box(1.4, 2.4, 0.02, new THREE.MeshStandardMaterial({ color: '#c8d8e8', metalness: 0.9, roughness: 0.05 })); mir.position.set(CX, 1.5, -3.3); qs.add(mir); }
const her4a = makePerson(HER_LAB); her4a.position.set(CX - 1.0, 0, -1.6); her4a.rotation.y = 0.35; glasses(her4a); qs.add(her4a);
const her4b = makePerson(HER_FANCY); her4b.position.set(CX + 1.0, 0, -1.6); her4b.rotation.y = -0.35; shades(her4b); hat(her4b); qs.add(her4b);
const SWAP = tag('⇄', { size: 110, w: 170, h: 150, bg: '#e6b450', color: '#14161c', sx: 0.6 }); SWAP.position.set(CX, 1.4, -1.4); qs.add(SWAP);
const tPlain = tag('会社では、地味な研究員', { size: 54, w: 660, bg: '#14161c', sx: 2.2 }); tPlain.position.set(CX, 3.0, -1.8); qs.add(tPlain);
const tTwo = tag('お見合いでは、別人', { size: 60, w: 580, bg: '#d8283c', sx: 2.0 }); tTwo.position.set(CX, 3.0, -1.8); qs.add(tTwo);

// ---------- 5段目. スマホの縦読み漫画（x=180）。2022年の韓国ドラマ ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#3a2a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#2a2434')); wl.position.set(TX, 3, -4); qs.add(wl); }
const PHONE = new THREE.Group(); { const b = box(1.5, 2.9, 0.12, mat('#14161c')); PHONE.add(b); }
const SCROLL = canvasTex(300, 1200, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { const y = 20 + i * 196; g.fillStyle = ['#f4e0e8', '#e0ecf8', '#f8f0d8'][i % 3]; g.fillRect(16, y, w - 32, 176); g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; g.strokeRect(16, y, w - 32, 176);
    g.fillStyle = '#e88aa0'; g.beginPath(); const cx = 80 + (i % 2) * 140, cy = y + 88; g.moveTo(cx, cy + 22); g.bezierCurveTo(cx - 40, cy - 8, cx - 16, cy - 36, cx, cy - 14); g.bezierCurveTo(cx + 16, cy - 36, cx + 40, cy - 8, cx, cy + 22); g.fill();
    g.fillStyle = '#ffffff'; g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.beginPath(); g.ellipse(w - 80 - (i % 2) * 120, y + 50, 46, 26, 0, 0, 7); g.fill(); g.stroke(); } });
SCROLL.wrapT = THREE.RepeatWrapping; SCROLL.repeat.set(1, 0.4);
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.7), new THREE.MeshBasicMaterial({ map: SCROLL })); SCREEN.position.z = 0.065; PHONE.add(SCREEN);
PHONE.position.set(TX, 2.2, -2.2); qs.add(PHONE);
const HEARTS5 = []; for (let i = 0; i < 6; i++) { const h = tag('♥', { size: 80, w: 120, h: 120, bg: '#e86a9a', sx: 0.34 }); qs.add(h); HEARTS5.push(h); }
const t2022 = tag('2022年 韓国ドラマ', { size: 58, w: 600, bg: '#e6b450', color: '#14161c', sx: 2.3 }); t2022.position.set(TX, 4.1, -2.0); qs.add(t2022);
const tWeb = tag('ウェブ漫画が原作', { size: 60, w: 540, bg: '#2a5aa8', sx: 2.0 }); tWeb.position.set(TX, 4.1, -2.0); qs.add(tWeb);

// ---------- 6段目. 会社の会議室（x=220）。同じ会社の、社長と研究員のお見合い ----------
const DX = 220;
{ const fl = box(12, 0.04, 10, mat('#5a5a64')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const wl = box(12, 4.5, 0.2, mat('#d8dce4')); wl.position.set(DX, 2.25, -4); qs.add(wl);
  for (let i = 0; i < 4; i++) { const w = box(1.4, 2.2, 0.05, new THREE.MeshBasicMaterial({ color: '#a8c4e0' })); w.position.set(DX - 3 + i * 2, 2.3, -3.88); qs.add(w); }
  const tb = box(2.2, 0.08, 1.4, mat('#f4f0e8')); tb.position.set(DX, 0.76, -1.8); qs.add(tb);
  for (const x of [-0.95, 0.95]) for (const z of [-2.4, -1.2]) { const l = box(0.08, 0.74, 0.08, mat('#59606e')); l.position.set(DX + x, 0.37, z); qs.add(l); } }
const her6 = makePerson(HER_LAB); her6.position.set(DX - 1.45, -0.3, -1.8); her6.rotation.y = Math.PI / 2; her6.userData.legs.forEach(l => l.rotation.x = -1.5); glasses(her6); qs.add(her6);
const boss6 = makePerson(BOSS); boss6.position.set(DX + 1.45, -0.3, -1.8); boss6.rotation.y = -Math.PI / 2; boss6.userData.legs.forEach(l => l.rotation.x = -1.5); qs.add(boss6);
const HEART6 = tag('♥', { size: 90, w: 140, h: 140, bg: '#e86a9a', sx: 0.5 }); HEART6.position.set(DX, 1.5, -1.8); qs.add(HEART6);
const tSame = tag('相手は、同じ会社の社長', { size: 54, w: 680, bg: '#14161c', sx: 2.3 }); tSame.position.set(DX, 2.45, -1.8); qs.add(tSame);
const tInHouse = tag('会社の中の、お見合い', { size: 58, w: 640, bg: '#d8283c', sx: 2.2 }); tInHouse.position.set(DX, 2.45, -1.8); qs.add(tInHouse);

// ---------- shots ----------
const ALL = [tProxy, tHate, tLab, tBoss, tCorp, tMarry, tPlain, tTwo, t2022, tWeb, tSame, tInHouse];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SWEAT1.forEach(d => d.visible = false); EXCL2.visible = false; RING3.visible = false; SWAP.visible = false; HEARTS5.forEach(h => h.visible = false); HEART6.visible = false; }

function shotLounge(t, quiz = 0) { // 1段目 0〜9：親友に頼まれて、代わりにお見合いへ。目的は、わざと嫌われて断られること（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.25;
  const act = !quiz && t > 4.2;
  her1.userData.arms[0].rotation.x = act ? -1.4 + Math.sin(t * 7) * 0.5 : -0.6; her1.userData.arms[1].rotation.x = act ? -2.4 + Math.sin(t * 6 + 1) * 0.4 : -0.6;
  her1.userData.head.rotation.y = act ? Math.sin(t * 3) * 0.3 : 0; her1.userData.head.rotation.x = act ? -0.2 : 0;
  boss1.userData.arms.forEach(a => a.rotation.x = -0.5); boss1.userData.head.rotation.x = act ? 0.15 : 0;
  if (act) SWEAT1.forEach((d, i) => { d.visible = true; const k = (t * 0.8 + i / 3) % 1; d.position.set(1.2 + 0.25 - i * 0.12, 1.8 - k * 0.3, -2.1); });
  if (!quiz) { tProxy.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tProxy.visible = false; tHate.userData.pop((t - 4.2) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.2, 0.0, u), lerp(2.3, 2.2, u), lerp(2.4, 1.9, u), 0, 1.1, -2.2, 62);
  return qs;
}
function shotLab(t) { // 2段目 9〜17：主人公は、食品会社の研究員。ところが相手は、自分の会社の新しい社長
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.35;
  her2.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 5) * 0.2; her2.userData.arms[0].rotation.x = -0.9;
  const k = clamp((t - 3.8) / 2.0); boss2.position.set(lerp(AX + 3.4, AX + 1.6, k), 0, lerp(-3.2, -1.8, k)); boss2.rotation.y = lerp(0, -1.2, k); poseWalk(boss2, t * 6, k < 1 && k > 0 ? 0.8 : 0);
  if (t > 4.2) { her2.rotation.y = lerp(Math.PI, Math.PI - 2.0, clamp((t - 5.2) / 0.4)); her2.userData.arms.forEach(a => a.rotation.x = t > 5.4 ? -0.3 : a.rotation.x);
    if (t > 5.5) { EXCL2.visible = true; EXCL2.userData.pop((t - 5.5) / 0.3); EXCL2.position.set(AX - 0.6, 2.35, -1.8); } }
  tLab.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLab.visible = false; tBoss.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.2, 0.3, u), lerp(2.1, 2.2, u), lerp(3.0, 2.7, u), AX + 0.5, 1.3, -2.0, 62);
  return qs;
}
function shotCorp(t) { // 3段目 17〜25：きらびやかな大企業。社長はなんと、結婚すると言い出す
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 1.2;
  STAFF3.forEach((p, i) => { p.userData.head.rotation.x = -0.2; });
  if (t > 4.2) { boss3.userData.arms[1].rotation.x = -2.6; RING3.visible = true; const k = clamp((t - 4.4) / 0.4); RING3.scale.setScalar(ease(k)); RING3.rotation.y = t * 1.5; RING3.position.set(BX, 2.9, -2.4);
    STAFF3.forEach((p, i) => { p.userData.arms.forEach(a => a.rotation.x = -0.4); p.position.y = Math.abs(Math.sin(t * 8 + i)) * 0.05; }); }
  tCorp.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCorp.visible = false; tMarry.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0.2, u), lerp(1.7, 1.9, u), lerp(3.6, 2.9, u), BX, 2.2, -3.5, 62);
  return qs;
}
function shotTwo(t, quiz = 0) { // 4段目 25〜33：会社では地味な研究員、お見合いの席では別人。二つの顔を持つことになった
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 1.2;
  SWAP.visible = true; SWAP.userData.pop(quiz ? 1 : (t - 1.0) / 0.3); SWAP.position.y = 1.4 + Math.sin(t * 3) * 0.05;
  her4a.userData.arms[1].rotation.x = -0.3; her4b.userData.arms[0].rotation.x = -2.5; her4b.userData.arms[1].rotation.x = -0.4;
  if (!quiz) { her4a.visible = true; her4b.position.y = 0; const a = t > 4.2 ? 1 : 0; her4b.userData.head.rotation.z = a * Math.sin(t * 4) * 0.15; }
  if (!quiz) { tPlain.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPlain.visible = false; tTwo.userData.pop((t - 4.2) / 0.35); }
  const u = ease(t / 8);
  look(CX + lerp(-0.3, 0.3, u), lerp(1.9, 2.0, u), lerp(3.8, 3.2, u), CX, 1.4, -1.8, 60);
  return qs;
}
function shotPhone(t) { // 5段目 33〜42：2022年の韓国ドラマ。全12話。ウェブ漫画が原作のラブコメディ
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.9; S.darken(0.3, '#100a14');
  SCROLL.offset.y = 0.6 - (t * 0.06) % 0.6;
  PHONE.rotation.y = Math.sin(t * 0.6) * 0.15; PHONE.position.y = 2.2 + Math.sin(t * 1.2) * 0.04;
  HEARTS5.forEach((h, i) => { h.visible = true; const k = (t * 0.3 + i / 6) % 1; h.position.set(TX - 1.3 + (i % 3) * 1.3 + Math.sin(t + i) * 0.1, 1.0 + k * 2.6, -1.9); h.userData.pop(1); });
  t2022.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t2022.visible = false; tWeb.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX, lerp(2.4, 2.5, u), lerp(4.4, 3.8, u), TX, 2.6, -2.2, 58);
  return qs;
}
function shotMeet(t) { // 6段目 42〜49（決め手）：お見合いの相手が、同じ会社の社長だった。タイトルは、会社の中のお見合い
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.25;
  her6.userData.arms.forEach(a => a.rotation.x = -0.6); boss6.userData.arms.forEach(a => a.rotation.x = -0.6);
  her6.userData.head.rotation.x = t > 3.5 ? 0.25 : 0; boss6.userData.head.rotation.y = t > 3.5 ? 0.15 : 0;
  if (t > 3.6) { HEART6.visible = true; HEART6.userData.pop((t - 3.7) / 0.3); HEART6.position.y = 1.5 + Math.sin(t * 4) * 0.05; }
  tSame.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tSame.visible = false; tInHouse.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.2, 0.2, u), lerp(2.3, 2.2, u), lerp(4.4, 3.8, u), DX, 1.0, -1.8, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（ラウンジに戻る）
  shotLounge(3.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.25, 0.6, d); S.darken(0.4 * d, '#1a1020');
  const k = ease(t / 7);
  look(0.0, 2.2, lerp(1.9, 1.5, k), 0, 1.1, -2.2, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotLounge(t, 0) },
  { a: 9, b: 17, f: shotLab },
  { a: 17, b: 25, f: shotCorp },
  { a: 25, b: 33, f: (t) => shotTwo(t, 0) },
  { a: 33, b: 42, f: shotPhone },
  { a: 42, b: 49, f: shotMeet },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '親友に頼まれて、<br>代わりにお見合いへ。'],
  [5.6, 9.0, '目的は、わざと<br>嫌われて断られること。'],
  [9.2, 13.2, '主人公は、<br>食品会社の研究員。'],
  [13.2, 17.0, 'ところが相手は、<br>自分の会社の新しい社長。'],
  [17.2, 21.0, 'きらびやかな、<br>大きな会社。'],
  [21.0, 25.0, '社長はなんと、<br>結婚すると言い出す。'],
  [25.2, 29.0, '会社では、<br>地味な研究員。'],
  [29.0, 33.0, 'お見合いの席では、<br>まったくの別人。'],
  [33.2, 37.4, '2022年の韓国ドラマ。<br>全12話。'],
  [37.4, 41.8, 'ウェブ漫画が原作の<br>ラブコメディ。'],
  [42.2, 45.4, 'お見合いの相手が、<br>同じ会社の社長だった。'],
  [45.4, 49.0, 'タイトルは、<br>会社の中のお見合い。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>社内お見合い。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q082', v2: true, answer: '社内お見合い',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 8282,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '社内お見合い': 'しゃないおみあい', '親友': 'しんゆう', '頼まれて': 'たのまれて', '代わり': 'かわり', 'お見合い': 'おみあい', '目的': 'もくてき', '嫌われて': 'きらわれて', '断られる': 'ことわられる', '主人公': 'しゅじんこう', '食品会社': 'しょくひんがいしゃ', '研究員': 'けんきゅういん', '相手': 'あいて', '自分': 'じぶん', '会社': 'かいしゃ', '新しい': 'あたらしい', '社長': 'しゃちょう', '大きな': 'おおきな', '結婚': 'けっこん', '言い出す': 'いいだす', '地味': 'じみ', '席': 'せき', '別人': 'べつじん', '2022年': 'にせんにじゅうにねん', '韓国': 'かんこく', '全12話': 'ぜんじゅうにわ', '漫画': 'まんが', '原作': 'げんさく', '同じ': 'おなじ', '中': 'なか', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n親友に頼まれて、代わりにお見合いへ。目的は、わざと嫌われて断られること。主人公は、食品会社の研究員。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', 'ラブコメ'],
  },
});
applyQuizCards({ answer: '社内お見合い', info: 'Netflix｜韓国ドラマ・全12話', answerSize: 124 });
