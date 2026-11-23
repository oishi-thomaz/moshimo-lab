import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #130 流星の絆（ドラマ・日本・TBS 2008年10〜12月・全10話。Netflix・U-NEXT・Prime Video で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/liu-xing-noban（見放題：Netflix・U-NEXT・Prime Video）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・Netflix 見放題）で2026/11/23確認。Filmarks 4.2・レビュー39,861件 filmarks.com/dramas/2529/4223）
// 確かめた事実（2026/11/23）：
//   ・ザテレビジョン thetv.jp/program/0000004397/ ：TBS 金曜ドラマ、2008/10/17〜12/19、全10話。14年前、洋食店を経営する両親を何者かに殺された
//     3人兄妹は、いつか親の仇を自分たちで討つと誓い合う。妹が金をだまし取られたことをきっかけに、3人は共謀して詐欺を働くようになっていた
//   ・講談社 原作文庫の内容紹介 kodansha.co.jp/book/products/0000427405・0000205631（東野圭吾）：流星群を見に夜に家を抜け出した3人兄妹。
//     星を見られずに家に帰ると両親が殺されていた。14年後、詐欺で暮らす3人が狙ったのは、両親の店と同じハヤシライスを出すレストランの御曹司
// 構成（ヒント6段）：1 真夜中にこっそり家を抜け出す3人の子ども・その夜すべてが変わった → 2 洋食店の両親を亡くした3きょうだい・14年後
//   → 3 夜の街・3人は人をだましてお金をとる → 4 両親の事件の犯人を追う・自分たちの手でかたきを
//   → 5 2008年の日本のドラマ・原作は人気作家のミステリー小説 → 6 決め手：あの店と同じハヤシライスの味・あの夜3人は流れ星を見に
// 犯人・事件の真相・妹の恋の行方・結末は言わない。登場人物の名前・店の名前は出さない（看板は無地）。
// 俳優の顔・ポスター・ロゴは使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#1a2238', floor: '#2a2e3a', fogNear: 26, fogFar: 100 });
const qs = S.scene;
const R = rng(13010);

const K1 = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#3a5a8a', pants: '#2a2e38', scale: 0.72 };
const K2 = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#8a3a3a', pants: '#2a2e38', scale: 0.62 };
const K3 = { skin: '#f4d3b5', hair: '#2a2018', shirt: '#e8c8d8', pants: '#5a4a6a', long: true, skirt: true, scale: 0.52 };
const A1 = { skin: '#eac2a0', hair: '#1a1410', shirt: '#2a2e3a', pants: '#1a1c24' };
const A2 = { skin: '#eac2a0', hair: '#4a3020', shirt: '#6a5a4a', pants: '#2a2e38' };
const A3 = { skin: '#f4d3b5', hair: '#2a2018', shirt: '#c8a0b0', pants: '#3a2a3a', long: true, skirt: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function stars(cx, cz, n = 120, w = 40, y0 = 6, y1 = 26) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05 + R() * 0.07, 5, 4), gl('#f4f0e0', fog0())); s.position.set(cx - w / 2 + R() * w, y0 + R() * (y1 - y0), cz); g.add(s); } qs.add(g); return g; }
function fog0() { return undefined; }
// 洋食店（看板は無地。文字は出さない）
function shop(x, z) { const g = new THREE.Group(); const w = box(5, 3.2, 3, mat('#c8b498')); w.position.y = 1.6; g.add(w);
  const rf = box(5.6, 0.3, 3.4, mat('#6a3a2a')); rf.position.y = 3.35; g.add(rf);
  const aw = box(4.6, 0.12, 0.9, mat('#a8402a')); aw.position.set(0, 2.5, 1.9); aw.rotation.x = 0.35; g.add(aw);
  const sg = box(2.4, 0.5, 0.1, mat('#e8dcc0')); sg.position.set(0, 2.95, 1.56); g.add(sg);
  const dr = box(0.9, 1.8, 0.06, mat('#5a3a24')); dr.position.set(-1.2, 0.9, 1.53); g.add(dr);
  const wn = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), gl('#3a3020')); wn.position.set(0.9, 1.4, 1.52); g.add(wn);
  g.position.set(x, 0, z); qs.add(g); g.userData.win = wn; return g; }

// ---------- 1段目. 真夜中の住宅街のはずれ（x=0）。懐中電灯を持って、こっそり坂道をのぼる3人の子ども ----------
{ const gr = box(30, 0.04, 30, mat('#2a3028')); gr.position.set(0, 0.02, -8); qs.add(gr);
  const rd = box(2.2, 0.03, 24, mat('#4a4a50')); rd.position.set(0, 0.04, -8); qs.add(rd);
  for (let i = 0; i < 6; i++) { const h = box(3, 2.6, 3, mat(['#3a3e4a', '#44485a', '#363a46'][i % 3])); h.position.set(i < 3 ? -4.6 : 4.6, 1.3, 2 - (i % 3) * 5); qs.add(h);
    const r = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), mat('#2a2a34')); r.rotation.y = Math.PI / 4; r.position.set(h.position.x, 3.2, h.position.z); qs.add(r);
    if (i === 1) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), gl('#e8c870')); w.position.set(h.position.x + 1.51, 1.6, h.position.z); w.rotation.y = Math.PI / 2; qs.add(w); } }
  for (let i = 0; i < 2; i++) { const pl = box(0.12, 4, 0.12, mat('#5a5a60')); pl.position.set(1.6 * (i ? 1 : -1), 2, -3 - i * 8); qs.add(pl); const lp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), gl('#f0e0b0')); lp.position.set(pl.position.x, 4, pl.position.z); qs.add(lp); } }
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(44, 50), skyTex('#060a1c', '#22304e')); SKY1.position.set(0, 12, -40); qs.add(SKY1);
stars(0, -38, 140);
const C1 = person(K1, -0.5, -1.0, Math.PI), C2 = person(K2, 0.3, -0.6, Math.PI), C3 = person(K3, 0.9, -0.2, Math.PI);
const TORCH1 = new THREE.Group(); { const b = box(0.06, 0.06, 0.24, mat('#d0d0d0')); TORCH1.add(b); const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gl('#fff2b0')); lens.position.z = -0.13; TORCH1.add(lens); }
C1.userData.arms[1].add(TORCH1); TORCH1.position.set(0, -0.66, 0.1); TORCH1.rotation.x = Math.PI / 2 - 0.2;
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tSneak = tag('真夜中、こっそり家を出る', { size: 52, w: 720, bg: '#14161c', sx: 2.2 }); qs.add(tSneak);
const tNight = tag('その夜、すべてが変わった', { size: 52, w: 720, bg: '#e24050', sx: 2.2 }); qs.add(tNight);

// ---------- 2段目. 小さな洋食店（x=50）。閉まった店の前に立つ3人の子ども → 14年後、同じ場所に立つ3人の大人 ----------
const AX = 50;
{ const gr = box(24, 0.04, 16, mat('#3a3a40')); gr.position.set(AX, 0.02, -3); qs.add(gr);
  const sw = box(24, 0.1, 3, mat('#5a5a60')); sw.position.set(AX, 0.05, 0); qs.add(sw); }
const SHOP2 = shop(AX, -3.4);
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(44, 40), skyTex('#5a6a8a', '#c8c0b0')); SKY2.position.set(AX, 12, -39); qs.add(SKY2);
const KID2 = [person(K1, AX - 0.7, 0.4, Math.PI), person(K2, AX, 0.6, Math.PI), person(K3, AX + 0.6, 0.8, Math.PI)];
const ADU2 = [person(A1, AX - 0.9, 0.4, Math.PI), person(A2, AX, 0.6, Math.PI), person(A3, AX + 0.9, 0.5, Math.PI)];
const FLOW2 = new THREE.Group(); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(['#f0f0f0', '#e8e0a0', '#f0c8d0'][i % 3])); f.position.set(-0.3 + i * 0.15, 0.1, 0); FLOW2.add(f); }
FLOW2.position.set(AX - 0.4, 0.05, -1.7); qs.add(FLOW2);
const tLost = tag('両親を亡くした、3人きょうだい', { size: 50, w: 800, bg: '#14161c', sx: 2.2 }); tLost.position.set(AX, 2.6, -0.4); qs.add(tLost);
const t14 = tag('14年後…', { size: 66, w: 380, bg: '#e24050', sx: 1.3 }); t14.position.set(AX, 2.6, -0.4); qs.add(t14);

// ---------- 3段目. 夜の街のホテルのラウンジ（x=100）。男と話す妹。少し離れたテーブルから、ようすを見守る兄ふたり ----------
const BX = 100;
{ const fl = box(16, 0.04, 12, mat('#3a2a24')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(16, 5, 0.2, mat('#2a2230')); wl.position.set(BX, 2.5, -6); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.4), skyTex('#0a1030', '#2a2a50')); win.position.set(BX, 2.6, -5.88); qs.add(win);
  for (let i = 0; i < 40; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), gl(['#f0d890', '#c8d8f0', '#f0a870'][i % 3])); l.position.set(BX - 5.8 + R() * 11.6, 1.0 + R() * 2.4, -5.85); qs.add(l); }
  for (const [x, z] of [[BX - 0.6, -2.6], [BX + 2.0, -0.4]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20), mat('#e8e0d0')); t.position.set(x, 0.75, z); qs.add(t);
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.74, 8), mat('#a08050')); lg.position.set(x, 0.37, z); qs.add(lg);
    for (const s of [-1, 1]) { const gls = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.18, 10), gl('#d8e8f0', 0.7)); gls.position.set(x + s * 0.2, 0.87, z); qs.add(gls); } }
  const lp = new THREE.PointLight('#ffc880', 4, 8); lp.position.set(BX, 3, -1.5); qs.add(lp); }
const SIS3 = person(A3, BX - 1.2, -2.6, Math.PI / 2);
const MAN3 = person({ skin: '#eac2a0', hair: '#3a3a3a', shirt: '#2a2a2a', pants: '#1a1a1a', tie: true }, BX + 0.0, -2.6, -Math.PI / 2);
const BRO3 = [person(A1, BX + 1.7, -0.1, -2.6), person(A2, BX + 2.4, -0.6, -2.3)];
const ENV3 = box(0.3, 0.02, 0.2, mat('#e8dcc0')); ENV3.position.set(BX - 0.6, 0.79, -2.6); qs.add(ENV3);
const tGrown = tag('大人になった、3人', { size: 56, w: 560, bg: '#14161c', sx: 1.8 }); tGrown.position.set(BX + 0.4, 3.0, -2.0); qs.add(tGrown);
const tCon = tag('人をだまして、お金をとる', { size: 52, w: 720, bg: '#e24050', sx: 2.2 }); tCon.position.set(BX + 0.4, 3.0, -2.0); qs.add(tCon);

// ---------- 4段目. 小さなアパートの部屋（x=150）。壁いっぱいの古い新聞の切り抜きと写真、赤い糸 ----------
const CX = 150;
{ const fl = box(10, 0.04, 8, mat('#6a5a48')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.4, 0.2, mat('#b8b0a0')); wl.position.set(CX, 2.2, -4.6); qs.add(wl);
  const lp = new THREE.PointLight('#ffe0b0', 4, 7); lp.position.set(CX, 3.4, -2); qs.add(lp); }
const BOARD4 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshLambertMaterial({ map: canvasTex(420, 240, (g) => { g.fillStyle = '#a8865a'; g.fillRect(0, 0, 420, 240);
  const pts = []; for (let i = 0; i < 9; i++) { const x = 30 + (i % 3) * 140 + R() * 40, y = 20 + Math.floor(i / 3) * 75 + R() * 14; pts.push([x + 30, y + 22]);
    g.fillStyle = i % 2 ? '#ece6d8' : '#d8d0c0'; g.fillRect(x, y, 70, 46); g.fillStyle = '#8a8478'; for (let k = 0; k < 4; k++) g.fillRect(x + 6, y + 8 + k * 9, 40 + R() * 18, 3); g.fillStyle = '#d03030'; g.beginPath(); g.arc(x + 35, y + 3, 4, 0, 7); g.fill(); }
  g.strokeStyle = '#d03030'; g.lineWidth = 2; g.beginPath(); g.moveTo(...pts[0]); [4, 2, 6, 8, 4].forEach(i => g.lineTo(...pts[i])); g.stroke(); }) }));
BOARD4.position.set(CX, 2.3, -4.48); qs.add(BOARD4);
const ROOM4 = [person(A1, CX - 0.4, -2.6, Math.PI), person(A2, CX + 0.6, -2.2, Math.PI - 0.3), person(A3, CX - 1.4, -2.2, Math.PI + 0.3)];
const tChase = tag('両親の事件の、犯人を追う', { size: 52, w: 740, bg: '#14161c', sx: 2.2 }); tChase.position.set(CX, 3.9, -3.2); qs.add(tChase);
const tVow = tag('自分たちの手で、かたきを', { size: 52, w: 720, bg: '#e24050', sx: 2.2 }); tVow.position.set(CX, 3.9, -3.2); qs.add(tVow);

// ---------- 5段目. 夜の本棚（x=200）。古いテレビと、背表紙が無地の文庫本 ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#3a2e26')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#2a2228')); wl.position.set(TX, 2.5, -4.6); qs.add(wl);
  for (let r = 0; r < 3; r++) { const sh = box(3.6, 0.08, 0.6, mat('#5a3a22')); sh.position.set(TX + 2.0, 0.9 + r * 0.9, -4.2); qs.add(sh);
    for (let i = 0; i < 14; i++) { const bk = box(0.18, 0.62 + R() * 0.12, 0.42, mat(['#8a3a3a', '#3a4a6a', '#d8c8a0', '#2a2a30', '#6a7a5a'][(i + r) % 5])); bk.position.set(TX + 0.45 + i * 0.22, 1.25 + r * 0.9, -4.1); qs.add(bk); } }
  const tv = box(1.6, 1.2, 1.0, mat('#3a3a40')); tv.position.set(TX - 1.6, 1.3, -3.4); qs.add(tv);
  const st = box(1.8, 0.7, 1.1, mat('#4a3424')); st.position.set(TX - 1.6, 0.35, -3.4); qs.add(st); }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), gl('#6a88c0')); SCR5.position.set(TX - 1.6, 1.32, -2.89); qs.add(SCR5);
const t2008 = tag('2008年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.3 }); t2008.position.set(TX, 3.3, -2.8); qs.add(t2008);
const tNovel = tag('原作は、人気作家のミステリー', { size: 50, w: 800, bg: '#e24050', sx: 2.4 }); tNovel.position.set(TX, 3.3, -2.8); qs.add(tNovel);

// ---------- 6段目. 夜のレストラン（x=250）。湯気の立つハヤシライス。窓の外の夜空を、流れ星が横切る ----------
const DX = 250;
{ const fl = box(14, 0.04, 10, mat('#5a3a2a')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#d8c8b0')); wl.position.set(DX, 2.5, -5); qs.add(wl);
  const tb = box(2.2, 0.08, 1.2, mat('#f4f0e8')); tb.position.set(DX, 0.78, -1.6); qs.add(tb); const tl = box(0.12, 0.76, 0.12, mat('#6a4a30')); tl.position.set(DX, 0.38, -1.6); qs.add(tl); }
const WIN6 = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), skyTex('#040818', '#1a2a50')); WIN6.position.set(DX, 2.7, -4.88); qs.add(WIN6);
const WF6 = box(4.6, 2.6, 0.06, mat('#5a3a24')); WF6.position.set(DX, 2.7, -4.94); qs.add(WF6);
const STARS6 = []; for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), gl('#f4f0e0')); s.position.set(DX - 2.1 + R() * 4.2, 1.6 + R() * 2.2, -4.85); qs.add(s); STARS6.push(s); }
const METEOR6 = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.04), gl('#fff8d0', 0.9)); m.rotation.z = -0.5; qs.add(m); METEOR6.push(m); }
const PLATE6 = new THREE.Group(); { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.04, 28), mat('#ffffff')); PLATE6.add(pl);
  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4f0e4')); rice.position.set(-0.08, 0.02, 0); PLATE6.add(rice);
  const sauce = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 24), mat('#6a2a14')); sauce.position.set(0.09, 0.04, 0.02); PLATE6.add(sauce); }
PLATE6.position.set(DX - 0.2, 0.84, -1.6); qs.add(PLATE6);
const STEAM6 = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), gl('#ffffff', 0.4)); qs.add(s); STEAM6.push(s); }
const EAT6 = person(A1, DX - 0.6, -2.35, 0.3);
const SPOON6 = box(0.04, 0.02, 0.24, mat('#c8c8d0')); SPOON6.position.set(0, -0.66, 0.1); EAT6.userData.arms[1].add(SPOON6);
const tTaste = tag('あの店と同じ、ハヤシライスの味', { size: 48, w: 860, bg: '#14161c', sx: 1.55 }); qs.add(tTaste);
const tStar = tag('あの夜、3人は流れ星を見に', { size: 50, w: 760, bg: '#e6b450', color: '#14161c', sx: 1.45 }); qs.add(tStar);

// ---------- shots ----------
const ALL = [tSneak, tNight, tLost, t14, tGrown, tCon, tChase, tVow, t2008, tNovel, tTaste, tStar, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); METEOR6.forEach(m => m.visible = false); STEAM6.forEach(m => m.visible = false); }

function shotNight(t, quiz = 0) { // 1段目 0〜9：真夜中、3人の子どもがこっそり家を抜け出した。その夜、すべてが変わってしまう（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 0.45; S.key.intensity = 0.35; S.key.color.set('#9ab0ff');
  const w = quiz ? 0 : t;
  const z0 = -1.0 - w * 0.32;
  [C1, C2, C3].forEach((c, i) => { c.position.z = z0 + i * 0.45; poseWalk(c, w * 5 + i, quiz ? 0 : 0.6); });
  C1.userData.arms[1].rotation.x = -1.1; C2.userData.head.rotation.y = quiz ? 0 : Math.sin(t * 1.5) * 0.5;
  Q1.position.set(0.25, 1.95, z0); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tSneak.position.set(0.2, 2.75, z0 - 0.4); tNight.position.copy(tSneak.position);
  if (!quiz) { tSneak.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tSneak.visible = false; tNight.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.0, 0.7, u), lerp(2.3, 2.1, u), z0 + lerp(5.4, 4.6, u), 0.2, 1.7, z0 - 2.0, 62);
  return qs;
}
function shotShop(t) { // 2段目 9〜17：主人公は、洋食店を営む両親を亡くした3人きょうだいの長男。それから14年
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.9;
  const grown = t > 4.2;
  KID2.forEach(k => k.visible = !grown); ADU2.forEach(a => a.visible = grown);
  if (grown) { S.darken(0.25, '#2a1a10'); SHOP2.userData.win.material.color.set('#1a1a20'); } else SHOP2.userData.win.material.color.set('#2a2418');
  KID2.forEach((k, i) => { k.userData.head.rotation.x = 0.25; k.userData.arms[0].rotation.x = i === 2 ? -0.4 : 0; });
  tLost.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLost.visible = false; t14.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.5, 0.3, u), lerp(2.0, 2.1, u), lerp(6.4, 5.6, u), AX, 1.5, -1.2, 62);
  return qs;
}
function shotLounge(t) { // 3段目 17〜25：大人になった3人は、人をだましてお金をとって暮らしている
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.2, '#1a0e08');
  SIS3.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 2) * 0.1; MAN3.userData.head.rotation.x = Math.sin(t * 1.4) * 0.08;
  ENV3.position.x = BX - 0.6 + clamp((t - 4.4) / 1.2) * 0.9;
  BRO3[0].userData.head.rotation.y = -0.3; BRO3[1].userData.arms[1].rotation.x = -1.2;
  tGrown.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGrown.visible = false; tCon.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.9, 0.6, u), lerp(2.3, 2.2, u), lerp(4.8, 4.2, u), BX + 0.6, 1.3, -1.6, 62);
  return qs;
}
function shotBoard(t) { // 4段目 25〜33：3人は、両親の事件の犯人を追っている。自分たちの手で、かたきを討つために
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.45, '#0a0a14');
  ROOM4[0].userData.arms[1].rotation.x = t > 4.4 ? -2.4 : -0.3; ROOM4[0].userData.head.rotation.x = -0.15;
  tChase.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tChase.visible = false; tVow.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.4, 0.3, u), lerp(2.2, 2.3, u), lerp(1.8, 1.2, u), CX, 2.0, -4.0, 62);
  return qs;
}
function shotShelf(t) { // 5段目 33〜42：2008年の、日本のドラマ。原作は、人気作家のミステリー小説
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.3, '#0a0a14');
  SCR5.material.color.setHSL(0.6, 0.4, 0.45 + Math.sin(t * 5) * 0.05);
  t2008.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2008.visible = false; tNovel.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.4, 0.3, u), lerp(2.4, 2.3, u), lerp(2.6, 2.0, u), TX + 0.2, 2.0, -3.6, 62);
  return qs;
}
function shotDinner(t) { // 6段目 42〜49（決め手）：両親の店と同じ、ハヤシライスの味。あの夜、3人は流れ星を見に行っていた
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.8;
  EAT6.userData.arms[1].rotation.x = t < 3.4 ? -1.0 - Math.abs(Math.sin(t * 1.6)) * 0.8 : -0.6; EAT6.userData.head.rotation.x = t > 1.6 && t < 3.6 ? 0.35 : 0;
  STEAM6.forEach((s, i) => { s.visible = true; const k = (t * 0.5 + i / 6) % 1; s.position.set(DX - 0.15 + Math.sin(i * 2 + t) * 0.06, 0.92 + k * 0.6, -1.6); s.material.opacity = 0.4 * (1 - k); });
  METEOR6.forEach((m, i) => { const k = ((t - 3.6) * 0.7 - i * 0.28); m.visible = k > 0 && k < 1; m.position.set(DX + 1.8 - k * 3.6 + i * 0.3, 3.7 - k * 1.6 - i * 0.1, -4.84); });
  tTaste.position.set(DX, 2.6, -1.8); tStar.position.set(DX, 2.6, -1.8);
  if (t < 3.6) tTaste.userData.pop((t - 0.3) / 0.35); else tStar.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.3, u), 1.7, lerp(1.2, 0.9, u), DX - 0.1, 1.7, -3.0, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（真夜中の坂道に戻る）
  shotNight(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotNight(t, 0) },
  { a: 9, b: 17, f: shotShop },
  { a: 17, b: 25, f: shotLounge },
  { a: 25, b: 33, f: shotBoard },
  { a: 33, b: 42, f: shotShelf },
  { a: 42, b: 49, f: shotDinner },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '真夜中、3人の子どもが<br>こっそり家を抜け出した。'],
  [5.6, 9.0, 'その夜、すべてが<br>変わってしまう。'],
  [9.2, 13.2, '主人公は、両親を亡くした<br>3人きょうだいの長男。'],
  [13.2, 17.0, 'それから、<br>14年。'],
  [17.2, 21.0, '大人になった3人は、<br>夜の街にいた。'],
  [21.0, 25.0, '人をだまして、<br>お金をとって暮らしている。'],
  [25.2, 29.0, '3人が追っているのは、<br>両親の事件の犯人。'],
  [29.0, 33.0, '自分たちの手で、<br>かたきを討つために。'],
  [33.2, 37.4, '2008年の、<br>日本のドラマ。'],
  [37.4, 41.8, '原作は、人気作家の<br>ミステリー小説。'],
  [42.2, 45.4, '両親の店と同じ、<br>ハヤシライスの味。'],
  [45.4, 49.0, 'あの夜、3人は<br>流れ星を見に行っていた。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>流星の絆。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q130', v2: true, answer: '流星の絆',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 13010,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.2, 'drone', 0.4], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '真夜中': 'まよなか', '3人': 'さんにん', '子ども': 'こども', '家': 'いえ', '抜け出した': 'ぬけだした', '夜': 'よる', '変わって': 'かわって', '主人公': 'しゅじんこう', '両親': 'りょうしん', '亡くした': 'なくした', '長男': 'ちょうなん', '14年': 'じゅうよねん', '大人': 'おとな', '街': 'まち', '暮らして': 'くらして', '追って': 'おって', '事件': 'じけん', '犯人': 'はんにん', '自分': 'じぶん', '手': 'て', '討つ': 'うつ', '2008年': 'にせんはちねん', '日本': 'にほん', '原作': 'げんさく', '人気作家': 'にんきさっか', '小説': 'しょうせつ', '店': 'みせ', '同じ': 'おなじ', '味': 'あじ', '流れ星': 'ながれぼし', '見に': 'みに', '行って': 'いって', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '流星の絆': 'りゅうせいのきずな', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n真夜中、3人の子どもがこっそり家を抜け出した。その夜、すべてが変わってしまう。主人公は、両親を亡くした3人きょうだいの長男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'Netflix', 'U-NEXT', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: '流星の絆', info: 'Netflix・U-NEXT｜日本のドラマ・全10話', answerSize: 140 });
