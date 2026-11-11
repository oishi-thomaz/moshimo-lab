import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #071 silent（ドラマ・日本・2022年・フジテレビ 木曜劇場・全11話。FOD で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/silent で2026/11/11確認（FOD Channel）。Filmarks の動画配信欄も FOD 見放題・作品ページ fod.fujitv.co.jp/title/f056/ へのリンクあり。
//   Filmarks 4.1・レビュー34,621件 filmarks.com/dramas/12598/17369）
// 確かめた事実（JustWatch・Filmarks の作品紹介、ja.wikipedia.org/wiki/Silent_(テレビドラマ)。2026/11/11）：
//   ・主人公の女性は8年前、恋人との別れを経験した。高校2年の秋、朝礼で作文を読む男子生徒の声に惹かれたのが出会い（Filmarks・JustWatch）
//   ・3年で同じクラスになり付き合う。音楽好きという趣味で通じ合った。卒業後のある日、彼は理由も言わずに別れを告げて姿を消した（Filmarks・JustWatch）
//   ・8年後、主人公は東京の大型CDショップで働き、弟と暮らす。駅で彼を見かけて声をかけたが届かなかった（Wikipedia）
//   ・彼はほとんど聴力を失っていた（JustWatch）。彼は手話で応答し、主人公は手話を学び始める（Wikipedia）
//   ・フジテレビ系 木曜劇場、2022年10月6日〜12月22日・全11話。TVer の見逃し配信で民放ドラマの歴代記録を更新（Wikipedia）
// 構成（ヒント6段）：1 駅の人ごみで8年前の恋人を見かける、声をかけても届かない → 2 CDショップで働く、8年前に彼は理由も言わずに去った
//   → 3 出会いは高校2年、作文を読む彼の声。音楽好きどうしで付き合った → 4 もう一度話したい、でも彼の返事は声ではなかった
//   → 5 2022年の日本のドラマ、見逃し配信の記録 → 6 決め手：耳がほとんど聞こえなくなっていた、言葉は手話・タイトルは英語6文字
// 人物名・地名・店名は出さない。俳優の顔・ポスター・主題歌・有名な場面の構図は使わない。人は汎用の3D。結末は言わない

const S = quizStage({ bg: '#c8d4e0', floor: '#9a9aa0', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(7171);

const HER = { skin: '#f4d3b5', hair: '#4a3426', shirt: '#e8d8b0', pants: '#5a5a6a', long: true };
const HIM = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#e8e4d8', pants: '#2b2b30' };
const HER_HS = { skin: '#f4d3b5', hair: '#4a3426', shirt: '#2a3046', pants: '#3a3a5a', long: true, skirt: true };
const HIM_HS = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#2a3046', pants: '#2a3046' };
const CROWD = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#d9a57c'][i % 3], hair: ['#1d1a19', '#2c2421', '#5a4a3a'][i % 3], shirt: ['#5a5a6a', '#2a3a4a', '#7a6a5a', '#4a4a4a', '#8a8a90'][i % 5], pants: ['#2b2b30', '#3a3a44'][i % 2], long: i % 4 === 1 });
const STU = (i) => ({ skin: ['#f1c9a5', '#e8b98f'][i % 2], hair: ['#1d1a19', '#2c2421'][i % 2], shirt: '#2a3046', pants: '#2a3046', long: i % 2 === 1, skirt: i % 2 === 1 });

// ---------- 1段目. 駅のコンコース（x=0）。人ごみの中、遠くの背中に声をかける ----------
{ const fl = box(26, 0.04, 22, mat('#b8b4ac')); fl.position.set(0, 0.02, -6); qs.add(fl);
  for (let i = 0; i < 7; i++) { const pl = box(0.5, 6, 0.5, mat('#d8d4cc')); pl.position.set(-6 + i * 2, 3, -10 + (i % 2) * 2); pl.position.x = (i % 2 ? 1 : -1) * 4.5; pl.position.z = -2 - Math.floor(i / 2) * 4; qs.add(pl); }
  const ceil = box(26, 0.2, 22, mat('#e8e4dc')); ceil.position.set(0, 6, -6); qs.add(ceil);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(400, 90, (g, w, h) => { g.fillStyle = '#1a1e28'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c14e'; for (let i = 0; i < 3; i++) g.fillRect(20, 14 + i * 24, 120, 12); g.fillStyle = '#9ad0ff'; for (let i = 0; i < 3; i++) g.fillRect(170, 14 + i * 24, 200, 12); }) })); board.position.set(0, 4.4, -12); qs.add(board);
  const gate = box(10, 1.1, 0.4, mat('#6a6e78')); gate.position.set(0, 0.55, -13); qs.add(gate); }
const CROWD1 = []; for (let i = 0; i < 16; i++) { const p = makePerson(CROWD(i)); p.userData.x0 = -5 + R() * 10; p.userData.z0 = -1 - R() * 10; p.userData.d = R() < 0.5 ? 1 : -1; p.userData.sp = 0.6 + R() * 0.6; qs.add(p); CROWD1.push(p); }
const her1 = makePerson(HER); her1.position.set(-0.55, 0, 0.9); her1.rotation.y = Math.PI; qs.add(her1);
const him1 = makePerson(HIM); him1.position.set(0.0, 0, -8.0); him1.rotation.y = Math.PI; qs.add(him1);
const RINGS = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false })); qs.add(r); RINGS.push(r); }
const tSaw = tag('8年ぶりの、あの人', { size: 60, w: 600, bg: '#14161c', sx: 2.0 }); tSaw.position.set(-0.2, 2.6, -1.6); qs.add(tSaw);
const tVoice = tag('声が、届かない', { size: 66, w: 520, bg: '#3a7ad8', sx: 1.8 }); tVoice.position.set(-0.2, 2.6, -1.6); qs.add(tVoice);

// ---------- 2段目. 大きなCDショップ（x=40）。棚を整える彼女 ----------
const AX = 40;
{ const fl = box(16, 0.04, 12, mat('#d8d0c0')); fl.position.set(AX, 0.02, -1); qs.add(fl);
  const wl = box(16, 6, 0.2, mat('#f0ece4')); wl.position.set(AX, 3, -5); qs.add(wl);
  const CDC = ['#e2483c', '#3a7ad8', '#f2c14e', '#3f8f6b', '#8e6bbf', '#e9e4da', '#14161c', '#d97a3a'];
  for (let k = 0; k < 3; k++) { const sx = AX - 4 + k * 4; const sh = box(2.8, 2.0, 0.6, mat('#a07850')); sh.position.set(sx, 1.0, -3.6 + (k === 1 ? 0 : 0.4)); qs.add(sh);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) { const cd = box(0.26, 0.26, 0.04, mat(CDC[(r * 9 + c + k * 3) % CDC.length])); cd.position.set(sx - 1.2 + c * 0.3, 0.45 + r * 0.6, sh.position.z + 0.32); cd.rotation.x = -0.2; qs.add(cd); } }
  const hp = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 20, Math.PI), mat('#14161c')); hp.position.set(AX + 2.4, 2.4, -3.0); qs.add(hp); }
const her2 = makePerson(HER); her2.position.set(AX - 0.4, 0, -2.2); her2.rotation.y = Math.PI; qs.add(her2);
const CDIN = box(0.26, 0.26, 0.04, mat('#e2483c')); qs.add(CDIN);
const tShop = tag('CDショップで働く', { size: 62, w: 560, bg: '#14161c', sx: 1.9 }); tShop.position.set(AX - 0.2, 2.75, -1.6); qs.add(tShop);
const tLeft = tag('8年前、突然の別れ', { size: 60, w: 600, bg: '#3a7ad8', sx: 2.0 }); tLeft.position.set(AX - 0.2, 2.75, -1.6); qs.add(tLeft);

// ---------- 3段目. 高校の体育館の朝礼（x=80）。壇上で作文を読む男子、列の中で振り向く女子 ----------
const BX = 80;
{ const fl = box(16, 0.04, 14, mat('#c8a070')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 8; i++) { const ln = box(16, 0.045, 0.04, mat('#e9e4da')); ln.position.set(BX, 0.04, -7 + i * 1.6); qs.add(ln); }
  const wl = box(16, 7, 0.2, mat('#e8dcc4')); wl.position.set(BX, 3.5, -8.6); qs.add(wl);
  const st = box(8, 1.0, 3, mat('#8a6a48')); st.position.set(BX, 0.5, -7); qs.add(st);
  const cur = box(8, 3.5, 0.1, mat('#8a2a3a')); cur.position.set(BX, 2.75, -8.45); qs.add(cur);
  const pod = box(0.9, 1.1, 0.6, mat('#6a4a30')); pod.position.set(BX, 1.55, -6.0); qs.add(pod);
  const mic = box(0.04, 0.4, 0.04, mat('#24262b')); mic.position.set(BX, 2.25, -5.8); qs.add(mic); }
const him3 = makePerson(HIM_HS); him3.position.set(BX, 1.0, -6.6); qs.add(him3);
const PAPER = box(0.36, 0.26, 0.02, mat('#f8f6f0')); qs.add(PAPER);
const ROWS = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { if (r === 2 && c === 3) continue; const p = makePerson(STU(r * 6 + c)); p.position.set(BX - 3.0 + c * 1.2, 0, -3.8 + r * 1.3); p.rotation.y = Math.PI; qs.add(p); ROWS.push(p); }
const her3 = makePerson(HER_HS); her3.position.set(BX - 3.0 + 3 * 1.2, 0, -3.8 + 2 * 1.3); her3.rotation.y = Math.PI; qs.add(her3);
const NOTES = []; for (let i = 0; i < 5; i++) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd84a' })); qs.add(n); NOTES.push(n); }
const tMorning = tag('高校の朝礼で', { size: 66, w: 480, bg: '#14161c', sx: 1.7 }); tMorning.position.set(BX + 0.2, 3.3, -3.4); qs.add(tMorning);
const tDrawn = tag('その声に、惹かれた', { size: 60, w: 600, bg: '#e2483c', sx: 2.0 }); tDrawn.position.set(BX + 0.2, 3.3, -3.4); qs.add(tDrawn);

// ---------- 4段目. 冬の夜の歩道（x=120）。向かい合うふたり。彼女が話しかけ、彼は答える ----------
const CX = 120;
{ const fl = box(16, 0.04, 12, mat('#8a8a90')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const rd = box(16, 0.03, 4, mat('#3a3a40')); rd.position.set(CX, 0.03, -5); qs.add(rd);
  for (let i = 0; i < 3; i++) { const lp = box(0.12, 3.6, 0.12, mat('#2a2e38')); lp.position.set(CX - 4 + i * 4, 1.8, -2.8); qs.add(lp); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); bl.position.set(lp.position.x, 3.7, -2.8); qs.add(bl); }
  for (let i = 0; i < 5; i++) { const bd = box(2.6, 4 + (i % 3), 2, mat(['#5a6070', '#6a5a5a', '#4a5060'][i % 3])); bd.position.set(CX - 6 + i * 3, (4 + (i % 3)) / 2, -9); qs.add(bd); } }
const SNOW = []; { const sm = new THREE.MeshBasicMaterial({ color: '#ffffff' }); for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), sm); d.userData.x = CX - 3 + R() * 6; d.userData.z = -4 + R() * 6; d.userData.o = R() * 5; qs.add(d); SNOW.push(d); } }
const her4 = makePerson(HER); her4.position.set(CX - 0.55, 0, -1.2); her4.rotation.y = Math.PI / 2; qs.add(her4);
const him4 = makePerson(HIM); him4.position.set(CX + 0.55, 0, -1.2); him4.rotation.y = -Math.PI / 2; qs.add(him4);
const BUBBLE = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })); b.scale.set(1.3, 0.9, 0.4); BUBBLE.add(b); for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat('#3a3a40')); d.position.set(-0.12 + i * 0.12, 0, 0.12); BUBBLE.add(d); } } qs.add(BUBBLE);
const tTalk = tag('もう一度、話したい', { size: 60, w: 600, bg: '#14161c', sx: 1.7 }); tTalk.position.set(CX - 0.1, 2.7, -1.2); qs.add(tTalk);
const tNoVoice = tag('返事は、声ではなく', { size: 60, w: 600, bg: '#3a7ad8', sx: 2.0 }); tNoVoice.position.set(CX, 2.75, -1.2); qs.add(tNoVoice);

// ---------- 5段目. 夜の部屋のテレビとスマホ（x=180）。2022年の日本のドラマ、見逃し配信の記録 ----------
const TX = 180;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(TX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a3440')); wl.position.set(TX, 3, -4); qs.add(wl);
  const stand = box(3.6, 0.6, 0.6, mat('#2a2018')); stand.position.set(TX, 0.3, -3.4); qs.add(stand);
  const tvb = box(4.4, 2.6, 0.12, mat('#0c0e12')); tvb.position.set(TX, 2.1, -3.5); qs.add(tvb); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(840, 480, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#9ab8d8'); gr.addColorStop(1, '#e8eef4'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc((i * 137) % w, (i * 71) % h, 3 + i % 4, 0, Math.PI * 2); g.fill(); } }) }));
TV.position.set(TX, 2.1, -3.42); qs.add(TV);
const BARS = []; for (let i = 0; i < 6; i++) { const b = box(0.4, 1, 0.3, new THREE.MeshBasicMaterial({ color: i === 5 ? '#e6b450' : '#6a7a90' })); b.position.set(TX - 1.6 + i * 0.64, 0, -1.8); qs.add(b); BARS.push(b); }
const t2022 = tag('2022年 日本のドラマ', { size: 60, w: 660, bg: '#e6b450', color: '#14161c', sx: 2.6 }); t2022.position.set(TX, 4.1, -3.0); qs.add(t2022);
const tRec = tag('見逃し配信の記録', { size: 62, w: 580, bg: '#3a7ad8', sx: 2.3 }); tRec.position.set(TX, 4.1, -3.0); qs.add(tRec);

// ---------- 6段目. 静かな白い部屋（x=220）。向かい合って手で話すふたり ----------
const DX = 220;
{ const fl = box(14, 0.04, 10, mat('#e8e4dc')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#f4f2ee')); wl.position.set(DX, 3, -4); qs.add(wl);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: '#dceaf6' })); win.position.set(DX, 2.6, -3.88); qs.add(win); }
const her6 = makePerson(HER); her6.position.set(DX - 0.6, 0, -1.4); her6.rotation.y = Math.PI / 2; qs.add(her6);
const him6 = makePerson(HIM); him6.position.set(DX + 0.6, 0, -1.4); him6.rotation.y = -Math.PI / 2; qs.add(him6);
const MUTE = new THREE.Group(); { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 10, 32), new THREE.MeshBasicMaterial({ color: '#e2483c' })); MUTE.add(ring); const bar = box(0.7, 0.08, 0.04, new THREE.MeshBasicMaterial({ color: '#e2483c' })); bar.rotation.z = Math.PI / 4; MUTE.add(bar); const ear = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 20, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: '#14161c' })); ear.rotation.z = -0.4; MUTE.add(ear); } MUTE.position.set(DX + 0.6, 2.35, -1.4); qs.add(MUTE);
const tEar = tag('耳が、ほとんど聞こえない', { size: 54, w: 720, bg: '#14161c', sx: 2.2 }); tEar.position.set(DX, 3.05, -1.4); qs.add(tEar);
const tSign = tag('言葉は、手話で', { size: 66, w: 520, bg: '#3a7ad8', sx: 1.7 }); tSign.position.set(DX, 3.05, -1.4); qs.add(tSign);

// ---------- shots ----------
const ALL = [tSaw, tVoice, tShop, tLeft, tMorning, tDrawn, tTalk, tNoVoice, t2022, tRec, tEar, tSign];
function base() { S.reset(); ALL.forEach(x => x.visible = false); MUTE.visible = false; RINGS.forEach(r => r.visible = false); BUBBLE.visible = false; CDIN.visible = false; PAPER.visible = false; NOTES.forEach(n => n.visible = false); }

function shotStation(t, quiz = 0) { // 1段目 0〜9：駅の人ごみで8年前の恋人を見かけた。声をかけても、届かない（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 1.15;
  CROWD1.forEach((p, i) => { const x = p.userData.x0 + p.userData.d * ((t * p.userData.sp + i) % 10 - 5) * 0.8; p.position.set(Math.max(-6, Math.min(6, x)), 0, p.userData.z0); p.rotation.y = p.userData.d > 0 ? Math.PI / 2 : -Math.PI / 2; poseWalk(p, t * 6 + i, 0.8); });
  him1.position.z = -7.0 - (quiz ? 3 : t * 0.25); poseWalk(him1, t * 6, 0.8);
  S.spot.color.set(0xfff4d0); S.spot.position.set(0, 5.8, him1.position.z + 1.5); S.spot.target.position.set(0, 0, him1.position.z); S.spot.intensity = 40;
  const call = quiz || t > 4.6;
  her1.userData.arms[1].rotation.x = call ? -2.4 : 0; her1.userData.head.rotation.x = call ? -0.1 : 0;
  if (call && !quiz) RINGS.forEach((r, i) => { const k = ((t - 4.6) * 0.9 + i * 0.33) % 1; r.visible = true; r.position.set(-0.55 + k * 0.55, 1.75, 0.5 - k * 6); r.scale.setScalar(1 + k * 2.5); r.material.opacity = 0.7 * (1 - k); });
  if (!quiz) { tSaw.userData.pop(1); if (t > 4.4) tSaw.visible = false; tVoice.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.9, 0.7, u), lerp(2.6, 2.5, u), lerp(5.2, 4.6, u), -0.2, 1.2, -5, 56);
  return qs;
}
function shotShop(t) { // 2段目 9〜17：大きなCDショップで働く。8年前、彼は理由も言わずに去った
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.3;
  const put = clamp((t % 2.4) / 2.4); her2.userData.arms[1].rotation.x = -1.4 + Math.sin(put * Math.PI) * 0.3;
  CDIN.position.set(her2.position.x + 0.32, 1.25, her2.position.z - 0.45); CDIN.rotation.x = -0.2;
  if (t > 4.2) { her2.userData.arms[1].rotation.x = -0.2; her2.userData.head.rotation.x = 0.35; CDIN.visible = false; S.darken(0.25, '#3a4a6a'); } else CDIN.visible = true;
  tShop.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tShop.visible = false; tLeft.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(1.4, 1.1, u), lerp(2.0, 1.9, u), lerp(2.6, 2.0, u), AX - 0.4, 1.4, -2.8, 58);
  return qs;
}
function shotAssembly(t) { // 3段目 17〜25：出会いは高校2年、作文を読む彼の声。音楽好きどうし、ふたりは付き合った
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 1.25;
  PAPER.visible = true; PAPER.position.set(BX, 2.25, -6.25); PAPER.rotation.x = -0.6;
  him3.userData.arms.forEach(a => a.rotation.x = -0.9); him3.userData.head.rotation.x = 0.25 + Math.sin(t * 2) * 0.05;
  her3.userData.head.rotation.x = -0.15;
  NOTES.forEach((n, i) => { const k = ((t * 0.5 + i * 0.2) % 1); n.visible = t > 4.2; n.position.set(BX - 0.4 + Math.sin(i * 2 + t) * 0.4, 2.0 + k * 1.4, -4.6 + k * 0.6); });
  if (t > 4.2) { her3.rotation.y = Math.PI; S.spot.color.set(0xfff0c0); S.spot.position.set(her3.position.x, 6, her3.position.z + 1); S.spot.target.position.copy(her3.position); S.spot.intensity = 25; }
  tMorning.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMorning.visible = false; tDrawn.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.8, 1.4, u), lerp(2.9, 2.8, u), lerp(1.6, 0.8, u), BX + 0.1, 1.5, -5.0, 58);
  return qs;
}
function shotMeet(t) { // 4段目 25〜33：もう一度ちゃんと話がしたい。でも彼の返事は、声ではなかった
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 0.75; S.darken(0.45, '#1a2030');
  SNOW.forEach(d => { const y = 4 - ((t * 0.9 + d.userData.o) % 4); d.position.set(d.userData.x + Math.sin(t + d.userData.o) * 0.2, y, d.userData.z); });
  if (t < 4.2) { BUBBLE.visible = true; BUBBLE.position.set(CX - 0.3, 2.15 + Math.sin(t * 3) * 0.04, -1.2); her4.userData.arms[0].rotation.x = -0.6; }
  else { const a = t * 5; him4.userData.arms[0].rotation.x = -1.4 + Math.sin(a) * 0.25; him4.userData.arms[1].rotation.x = -1.3 + Math.cos(a) * 0.25; him4.userData.arms[0].rotation.z = -0.3; him4.userData.arms[1].rotation.z = 0.3; }
  tTalk.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTalk.visible = false; tNoVoice.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.2, 0.0, u), lerp(1.9, 1.8, u), lerp(3.8, 3.2, u), CX, 1.5, -1.2, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2022年に放送された日本のドラマ。見逃し配信の記録を次々にぬりかえた
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#0a0810');
  BARS.forEach((b, i) => { const h = Math.max(0.01, ease(clamp((t - 4.4 - i * 0.12) / 0.5))) * (0.3 + i * 0.28 + (i === 5 ? 0.5 : 0)); b.scale.y = h; b.position.y = h / 2; b.visible = t > 4.3; });
  t2022.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t2022.visible = false; tRec.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.3, lerp(2.8, 3.0, u), lerp(5.4, 4.6, u), TX, 2.4, -3.0, 58);
  return qs;
}
function shotSign(t) { // 6段目 42〜49（決め手）：彼の耳は、ほとんど聞こえなくなっていた。言葉は手話で。タイトルは英語6文字
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 1.35;
  MUTE.visible = t < 3.3; MUTE.scale.setScalar(Math.max(1e-4, ease(clamp((t - 0.4) / 0.4)))); MUTE.rotation.y = 0;
  if (t > 3.3) { const a = t * 4.5; [her6, him6].forEach((p, j) => { p.userData.arms[0].rotation.x = -1.3 + Math.sin(a + j) * 0.3; p.userData.arms[1].rotation.x = -1.2 + Math.cos(a * 1.2 + j) * 0.3; p.userData.arms[0].rotation.z = -0.25; p.userData.arms[1].rotation.z = 0.25; }); }
  tEar.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tEar.visible = false; tSign.userData.pop((t - 3.5) / 0.3);
  const u = ease(t / 7);
  look(DX + 0.1, lerp(1.9, 1.8, u), lerp(4.0, 3.4, u), DX, 1.7, -1.4, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（駅の人ごみに戻る）
  shotStation(8.0, 1);
  ALL.forEach(x => x.visible = false); RINGS.forEach(r => r.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.15, 0.6, d); S.darken(0.4 * d, '#2a2030');
  const k = ease(t / 7);
  look(lerp(0.7, 0.6, k), lerp(2.5, 2.3, k), lerp(4.6, 4.0, k), -0.2, 1.2, -5, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStation(t, 0) },
  { a: 9, b: 17, f: shotShop },
  { a: 17, b: 25, f: shotAssembly },
  { a: 25, b: 33, f: shotMeet },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotSign },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '駅の人ごみで、8年前の<br>恋人を見かけた。'],
  [5.6, 9.0, '声をかけても、<br>届かない。'],
  [9.2, 13.2, '彼女は、大きな<br>CDショップで働いている。'],
  [13.2, 17.0, '8年前、彼は理由も<br>言わずに去った。'],
  [17.2, 21.0, '出会いは高校2年。<br>作文を読む、彼の声。'],
  [21.0, 25.0, '音楽好きどうし、<br>ふたりは付き合った。'],
  [25.2, 29.0, 'もう一度ちゃんと、<br>彼と話がしたい。'],
  [29.0, 33.0, 'でも彼の返事は、<br>声ではなかった。'],
  [33.2, 37.4, '2022年に放送された、<br>日本のドラマ。'],
  [37.4, 41.8, '見逃し配信の記録を、<br>次々にぬりかえた。'],
  [42.2, 45.4, '彼の耳は、ほとんど<br>聞こえなくなっていた。'],
  [45.4, 49.0, '言葉は、手話で。<br>タイトルは英語6文字。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>サイレント。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q071', v2: true, answer: 'silent',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 7171,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '駅': 'えき', '人ごみ': 'ひとごみ', '8年前': 'はちねんまえ', '恋人': 'こいびと', '見かけた': 'みかけた', '声': 'こえ', '届かない': 'とどかない', '彼女': 'かのじょ', '大きな': 'おおきな', 'CDショップ': 'シーディーショップ', '働いて': 'はたらいて', '彼': 'かれ', '理由': 'りゆう', '言わずに': 'いわずに', '去った': 'さった', '出会い': 'であい', '高校2年': 'こうこうにねん', '作文': 'さくぶん', '読む': 'よむ', '音楽好き': 'おんがくずき', '付き合った': 'つきあった', '一度': 'いちど', '話': 'はなし', '返事': 'へんじ', '2022年': 'にせんにじゅうにねん', '放送': 'ほうそう', '日本': 'にほん', '見逃し配信': 'みのがしはいしん', '記録': 'きろく', '次々': 'つぎつぎ', '耳': 'みみ', '聞こえなく': 'きこえなく', '言葉': 'ことば', '手話': 'しゅわ', '英語6文字': 'えいごろくもじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n駅の人ごみで、8年前の恋人を見かけた。声をかけても、届かない。彼女は、大きなCDショップで働いている。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'ドラマ好き', '日本のドラマ', '恋愛ドラマ'],
  },
});
applyQuizCards({ answer: 'silent', info: 'FOD｜日本のドラマ・全11話', answerSize: 150 });
