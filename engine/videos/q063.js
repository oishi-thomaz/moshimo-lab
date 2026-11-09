import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #063 ヴィンチェンツォ（ドラマ・韓国・2021年・tvN・全20話。Netflix で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/binsenjo で2026/11/9確認。Filmarks 4.3・レビュー32,248件 filmarks.com/dramas/10178/14272）
// 確かめた事実（Filmarks の作品紹介・ja.wikipedia.org/wiki/ヴィンチェンツォ_(テレビドラマ)。2026/11/9）：
//   ・幼い頃にイタリアンマフィアの養子となった韓国系イタリア人。長じてマフィア組織の顧問弁護士となるが、仲間の裏切りにあい故郷の韓国へ
//   ・渡韓の目的のひとつは、ソウルの雑居ビルに隠されている大量の金塊を手に入れること
//   ・ところがビルは、不正や犯罪に手を染める巨大企業グループの建設会社の手に渡ってしまう。住人や弁護士の協力で巨大企業に戦いを挑む
//   ・毒をもって毒を制す。法律では倒せない悪党を痛快に成敗していくダークヒーロー（ジャンルにダークコメディ）
//   ・韓国 tvN で2021年2月20日〜5月2日、全20話。Netflix でも同日から配信
// 構成（ヒント6段）：1 古いビルの中に金塊、男が海を越えてやってきた → 2 ある組織の顧問弁護士、仲間に裏切られた
//   → 3 くせの強い住人たち、ビルが大企業に奪われかけている → 4 相手は悪事を重ねる巨大企業、悪には悪で
//   → 5 2021年の韓国ドラマ・全20話、痛快ダークヒーロー → 6 決め手：イタリアのマフィアの顧問弁護士、韓国生まれのイタリア人
// 「イタリア」「マフィア」は6段目まで出さない。人物名・ビルや会社の名前・地名は出さない。物語の先や結末は言わない。俳優・ロゴ・有名な場面の構図は使わない。人は汎用の3D

const S = quizStage({ bg: '#121620', floor: '#1e222a', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(6363);

const HERO = { skin: '#eccaa8', hair: '#1a1614', shirt: '#2a2a30', pants: '#1e1e24', tie: true };
const MOB = (i) => ({ skin: ['#e8b98f', '#d9a57c', '#eccaa8'][i % 3], hair: ['#1a1614', '#5a5a5a', '#3a2a20'][i % 3], shirt: '#141418', pants: '#141418', tie: true });
const TENANT = (i) => ({ skin: ['#f1c9a5', '#e8b98f', '#d9a57c', '#f5d3b5'][i % 4], hair: ['#1d1a19', '#9a9a9a', '#4a3426', '#6b4a33', '#2c2421'][i % 5], shirt: ['#e05a4f', '#f2c14e', '#3f8f6b', '#8e6bbf', '#4fa3d1', '#d97a3a'][i % 6], pants: ['#2b3346', '#5a4a3a', '#6b7a8f'][i % 3], long: i % 3 === 1, skirt: i % 3 === 1 });
const EXEC = { skin: '#eccaa8', hair: '#141414', shirt: '#e8e4dc', pants: '#2a2a2e', tie: true, scale: 1.05 };

function oldBuilding(floors = 4, w = 6, wallC = '#8a7a68') { // どこにでもある古い雑居ビル
  const g = new THREE.Group();
  const body = box(w, floors * 1.6, 3, mat(wallC)); body.position.y = floors * 0.8; g.add(body);
  for (let f = 0; f < floors; f++) for (let i = 0; i < 4; i++) { const lit = R() < 0.6; const win = box(0.9, 0.8, 0.05, lit ? new THREE.MeshBasicMaterial({ color: ['#ffd98a', '#fff1c9'][i % 2] }) : mat('#3a4250')); win.position.set(-w / 2 + 0.9 + i * (w - 1.8) / 3, 0.9 + f * 1.6, 1.53); g.add(win); }
  const roof = box(w + 0.3, 0.2, 3.3, mat('#5a5048')); roof.position.y = floors * 1.6 + 0.1; g.add(roof);
  return g;
}

// ---------- 1段目. 夜の古いビル（x=0）。1階の断面の奥に光る金塊。スーツケースの男が歩いてくる ----------
const BLD = oldBuilding(3, 6); BLD.position.set(0, 1.6, -3); qs.add(BLD); // 2階から上。1階は前の壁を外した断面にして、奥の金塊を見せる
{ const back = box(6, 1.6, 0.2, mat('#3a2e26')); back.position.set(0, 0.8, -4.4); qs.add(back);
  for (const x of [-2.9, 2.9]) { const sw = box(0.2, 1.6, 3, mat('#6a5a4a')); sw.position.set(x, 0.8, -3); qs.add(sw); }
  const fl0 = box(5.6, 0.06, 2.8, mat('#2a221c')); fl0.position.set(0, 0.05, -3); qs.add(fl0);
  for (const x of [-2.95, 2.95]) { const fr = box(0.12, 1.6, 0.12, mat('#c8a050')); fr.position.set(x, 0.8, -1.5); qs.add(fr); }
  const lintel = box(6.0, 0.12, 0.12, mat('#c8a050')); lintel.position.set(0, 1.56, -1.5); qs.add(lintel); }
{ const gr = box(16, 0.04, 6, mat('#2a2c32')); gr.position.set(0, 0.02, 1.5); qs.add(gr);
  for (const x of [-7, 7]) { const nb = oldBuilding(3, 5, '#5a5a62'); nb.position.set(x, 0, -4); qs.add(nb); }
  for (let i = 0; i < 3; i += 2) { const lp = box(0.1, 3, 0.1, mat('#3a3a40')); lp.position.set(-4 + i * 4, 1.5, 0.8); qs.add(lp); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c0' })); bulb.position.set(-4 + i * 4, 3.05, 0.8); qs.add(bulb); } }
const GOLD = new THREE.Group(); GOLD.position.set(0, 0.16, -3.6); qs.add(GOLD);
{ const gm = new THREE.MeshPhongMaterial({ color: '#e6b450', emissive: '#8a5a10', shininess: 90 });
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9 - r; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.22), gm); b.position.set(-1.7 + i * 0.44 + r * 0.22, r * 0.17, 0); GOLD.add(b); }
  const glow = new THREE.PointLight(0xffc860, 6, 5); glow.position.set(0, 0.6, 0.6); GOLD.add(glow); }
const h1 = makePerson(HERO); qs.add(h1);
const CASE = box(0.42, 0.32, 0.14, mat('#5a3a24')); qs.add(CASE);
const tGold = tag('古いビルに、金塊', { size: 62, w: 620, bg: '#14161c', sx: 2.6 }); tGold.position.set(0, 2.45, -1.2); qs.add(tGold);
const tSea = tag('男が、海を越えてきた', { size: 60, w: 660, bg: '#e2483c', sx: 2.6 }); tSea.position.set(0, 2.45, -1.2); qs.add(tSea);

// ---------- 2段目. 暗い会議室（x=40）。黒いスーツの男たちが背を向ける ----------
const OX = 40;
{ const fl = box(12, 0.04, 10, mat('#2a2420')); fl.position.set(OX, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#3a2e28')); wl.position.set(OX, 3, -4); qs.add(wl);
  const tb = box(3.6, 0.1, 1.4, mat('#4a2e1e')); tb.position.set(OX, 0.85, -1.6); qs.add(tb); for (const x of [-1.6, 1.6]) { const lg = box(0.12, 0.85, 1.2, mat('#2a1a10')); lg.position.set(OX + x, 0.42, -1.6); qs.add(lg); }
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.4, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#c89a5a', side: THREE.DoubleSide })); lamp.position.set(OX, 3.4, -1.6); qs.add(lamp);
  const cord = box(0.03, 2.4, 0.03, mat('#1a1a1a')); cord.position.set(OX, 4.8, -1.6); qs.add(cord); }
const MOBS = []; for (let i = 0; i < 4; i++) { const p = makePerson(MOB(i)); p.position.set(OX - 1.5 + i * 1.0, 0, -2.7); qs.add(p); MOBS.push(p); }
const h2 = makePerson(HERO); h2.position.set(OX, 0, -0.1); h2.rotation.y = Math.PI; qs.add(h2);
const tCouns = tag('ある組織の、顧問弁護士', { size: 58, w: 720, bg: '#14161c', sx: 1.7 }); tCouns.position.set(OX - 0.2, 2.9, -2.6); qs.add(tCouns);
const tBetray = tag('仲間に、裏切られた', { size: 62, w: 600, bg: '#e2483c', sx: 1.6 }); tBetray.position.set(OX - 0.2, 2.9, -2.6); qs.add(tBetray);

// ---------- 3段目. ビルの中の商店街（x=80）。くせの強い住人たち。入口に赤い差し押さえの紙 ----------
const BX = 80;
{ const fl = box(14, 0.04, 10, mat('#8a8070')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#c8bca8')); wl.position.set(BX, 2.5, -5.5); qs.add(wl);
  const cols = ['#e05a4f', '#3f8f6b', '#f2c14e', '#4fa3d1', '#8e6bbf'];
  for (let i = 0; i < 5; i++) { const sh = box(2.3, 2.4, 0.3, mat('#e8e0d0')); sh.position.set(BX - 5.2 + i * 2.6, 1.2, -5.2); qs.add(sh); const sg = box(2.3, 0.5, 0.3, mat(cols[i])); sg.position.set(BX - 5.2 + i * 2.6, 2.7, -5.15); qs.add(sg); const dr = box(1.0, 1.9, 0.05, mat('#7a8a9a')); dr.position.set(BX - 5.2 + i * 2.6, 0.95, -5.03); qs.add(dr); }
  for (let i = 0; i < 6; i++) { const lt = box(1.2, 0.08, 0.3, new THREE.MeshBasicMaterial({ color: '#fff4d8' })); lt.position.set(BX - 5 + i * 2, 4.6, -2.5); qs.add(lt); } }
const NOTICE = new THREE.Group(); NOTICE.position.set(BX - 0.0, 1.6, -4.98); qs.add(NOTICE);
{ const pp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), new THREE.MeshBasicMaterial({ map: canvasTex(110, 80, (g, w, h) => { g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d83a32'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#d83a32'; g.fillRect(15, 18, w - 30, 10); g.fillStyle = '#b8b4aa'; for (let y = 38; y < h - 10; y += 9) g.fillRect(15, y, w - 30, 3); }) })); NOTICE.add(pp); }
const TEN = []; for (let i = 0; i < 7; i++) { const p = makePerson(TENANT(i)); p.position.set(BX - 4.5 + i * 1.5, 0, -2.6 - (i % 2) * 0.9); p.rotation.y = (i % 2 ? -0.3 : 0.3); qs.add(p); TEN.push(p); }
const tTen = tag('くせの強い住人たち', { size: 62, w: 600, bg: '#14161c', sx: 2.5 }); tTen.position.set(BX, 3.6, -2.5); qs.add(tTen);
const tTake = tag('ビルが、奪われかけている', { size: 56, w: 740, bg: '#e2483c', sx: 2.8 }); tTake.position.set(BX, 3.6, -2.5); qs.add(tTake);

// ---------- 4段目. そびえるガラスの高層ビル（x=120）。見上げる男 ----------
const CX = 120;
{ const fl = box(20, 0.04, 20, mat('#3a3c44')); fl.position.set(CX, 0.02, -4); qs.add(fl);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 30, 5), new THREE.MeshPhongMaterial({ map: canvasTex(128, 512, (g, w, h) => { g.fillStyle = '#1a2a3a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 16) { g.fillStyle = R() < 0.3 ? '#ffe0a0' : '#2a4a6a'; g.fillRect(x + 2, y + 2, 12, 8); } }), shininess: 80 })); tower.position.set(CX, 15, -10); qs.add(tower);
  for (const s of [-1, 1]) { const t2 = box(5, 18, 4, mat('#2a3440')); t2.position.set(CX + s * 7, 9, -12); qs.add(t2); } }
const h4 = makePerson(HERO); h4.position.set(CX, 0, 0); h4.rotation.y = Math.PI; qs.add(h4);
const EXECS = []; for (let i = 0; i < 3; i++) { const p = makePerson(EXEC); p.position.set(CX - 1.2 + i * 1.2, 0, -6.6); qs.add(p); EXECS.push(p); }
const tCorp = tag('相手は、巨大企業', { size: 66, w: 560, bg: '#14161c', sx: 2.4 }); tCorp.position.set(CX, 3.4, -2); qs.add(tCorp);
const tEvil = tag('悪には、悪で', { size: 72, w: 540, bg: '#e2483c', sx: 2.2 }); tEvil.position.set(CX, 3.4, -2); qs.add(tEvil);

// ---------- 5段目. テレビの前（x=160）。2021年の韓国ドラマ・全20話・痛快ダークヒーロー ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#181a22' })); bg.position.set(TX, 4, -3); qs.add(bg);
  const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#4a3a5a'); gr.addColorStop(1, '#141018'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(40 + (i % 10) * 48, 105 + Math.floor(i / 10) * 80, 16, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
const tKR = tag('2021年 韓国ドラマ', { size: 64, w: 620, bg: '#e6b450', color: '#14161c', sx: 3.1 }); tKR.position.set(TX, 4.6, -1.2); qs.add(tKR);
const t20 = tag('全20話', { size: 80, w: 340, bg: '#3a7ad8', sx: 2.0 }); t20.position.set(TX, 4.6, -1.2); qs.add(t20);
const tDark = tag('痛快ダークヒーロー', { size: 62, w: 620, bg: '#e2483c', sx: 3.0 }); tDark.position.set(TX, 3.75, -1.0); qs.add(tDark);

// ---------- 6段目. 石畳の広場とブドウ畑の丘（x=200）。緑・白・赤の帯の旗。小さなカップを手にした男 ----------
const DX = 200;
{ const fl = box(16, 0.04, 12, mat('#b8a888')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) { const st = box(1.1, 0.02, 1.1, mat((i + j) % 2 ? '#a89878' : '#c0b090')); st.position.set(DX - 6.6 + i * 1.2, 0.05, -1 - j * 1.2); qs.add(st); }
  const hill = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#6a8a4a')); hill.scale.y = 0.4; hill.position.set(DX, 0, -18); qs.add(hill);
  for (let r = 0; r < 5; r++) { const row = box(14 - r * 2, 0.3, 0.3, mat('#3a5a2a')); row.position.set(DX, 0.6 + r * 0.7, -10 - r * 1.3); qs.add(row); }
  const wall = box(5, 3.4, 0.3, mat('#e0c8a0')); wall.position.set(DX - 3.6, 1.7, -4.2); qs.add(wall);
  const pole = box(0.08, 3.6, 0.08, mat('#3a3a3a')); pole.position.set(DX + 2.6, 1.8, -3.0); qs.add(pole); }
const FLAG = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 12, 1), new THREE.MeshBasicMaterial({ map: canvasTex(90, 60, (g, w, h) => { g.fillStyle = '#2a8a4a'; g.fillRect(0, 0, 30, h); g.fillStyle = '#f4f2ea'; g.fillRect(30, 0, 30, h); g.fillStyle = '#d83a32'; g.fillRect(60, 0, 30, h); }), side: THREE.DoubleSide })); FLAG.position.set(DX + 3.36, 3.1, -3.0); qs.add(FLAG);
const FLAG_BASE = FLAG.geometry.attributes.position.array.slice();
const h6 = makePerson(HERO); h6.position.set(DX, 0, -0.6); qs.add(h6);
const CUP = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.08, 12), mat('#f4f2ea')); qs.add(CUP);
const tITA = tag('イタリアのマフィアの顧問', { size: 56, w: 740, bg: '#14161c', sx: 1.9 }); tITA.position.set(DX + 0.3, 2.75, -0.6); qs.add(tITA);
const tBorn = tag('韓国生まれのイタリア人', { size: 58, w: 720, bg: '#2a8a4a', sx: 1.9 }); tBorn.position.set(DX + 0.3, 2.75, -0.6); qs.add(tBorn);

// ---------- shots ----------
const ALL = [tGold, tSea, tCouns, tBetray, tTen, tTake, tCorp, tEvil, tKR, t20, tDark, tITA, tBorn];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotStreet(t, quiz = 0) { // 1段目 0〜9：ビルの地下に、金塊。男が、海を越えてきた（0秒目がサムネ。金塊はもう光っている）
  base(); S.aim(0, -2); lift(-30); S.hemi.intensity = 0.6; S.darken(0.5, '#05060a');
  const z = lerp(4.5, 0.9, ease(clamp((t - 3.0) / 4.0))); const moving = t > 3.0 && t < 7.0;
  h1.position.set(1.6, 0, z); h1.rotation.y = Math.PI; poseWalk(h1, t * 5, moving ? 0.9 : 0); h1.visible = !!(t > 3.0 || quiz);
  CASE.position.set(1.6 + 0.4, 0.5, z); CASE.visible = h1.visible;
  if (!quiz) { tGold.userData.pop(1); if (t > 4.4) tGold.visible = false; tSea.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 1.0, u), lerp(1.6, 1.9, u), lerp(9.0, 8.0, u), 0.2, 0.9, -2.4, 56);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：ある組織の、顧問弁護士。仲間に、裏切られた
  base(); S.aim(OX, -1); lift(-40); S.hemi.intensity = 0.7; S.darken(0.4, '#06070a');
  S.spot.color.set(0xffd8a0); S.spot.position.set(OX, 3.3, -1.6); S.spot.target.position.set(OX, 0, -1.6); S.spot.intensity = 30;
  const turn = clamp((t - 4.2) / 0.8);
  MOBS.forEach((p, i) => { p.rotation.y = lerp(0, Math.PI, ease(clamp(turn - i * 0.15))); });
  h2.userData.head.rotation.x = t > 4.6 ? 0.2 : 0;
  tCouns.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCouns.visible = false;
  tBetray.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(OX + lerp(1.4, 1.0, u), lerp(2.4, 2.3, u), lerp(2.6, 2.0, u), OX - 0.2, 1.4, -1.8, 58);
  return qs;
}
function shotArcade(t) { // 3段目 17〜25：くせの強い住人たち。ビルが、奪われかけている
  base(); S.aim(BX, -3); lift(-30); S.hemi.intensity = 1.2;
  TEN.forEach((p, i) => { p.userData.arms[i % 2].rotation.x = -0.6 - Math.abs(Math.sin(t * 3 + i)) * 0.7; p.userData.head.rotation.y = Math.sin(t * 1.5 + i) * 0.4; p.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.05; });
  NOTICE.visible = t > 4.2; NOTICE.scale.setScalar(1 + (t > 4.2 ? 0.15 * Math.max(0, 1 - (t - 4.2) * 3) : 0));
  if (t > 4.2) TEN.forEach(p => { p.userData.head.rotation.y = 0; });
  tTen.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTen.visible = false;
  tTake.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0.2, u), lerp(2.6, 2.4, u), lerp(4.6, 3.8, u), BX, 1.6, -3.6, 58);
  return qs;
}
function shotTower(t) { // 4段目 25〜33：相手は、巨大企業。悪には、悪で
  base(); S.aim(CX, -6); lift(-20); S.hemi.intensity = 0.9; S.darken(0.3, '#06070a');
  h4.userData.head.rotation.x = -0.35; h4.userData.arms.forEach(a => a.rotation.x = 0);
  EXECS.forEach((p, i) => { p.userData.head.rotation.x = 0.1; p.rotation.y = 0; });
  if (t > 4.2) { h4.userData.head.rotation.x = 0; h4.rotation.y = Math.PI + 0.25; }
  tCorp.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCorp.visible = false;
  tEvil.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.2) look(CX + 0.6, lerp(0.8, 0.9, u), lerp(3.4, 3.0, u), CX, 4.5, -8, 60);
  else look(CX - 1.0, 1.8, lerp(-3.4, -3.8, ease((t - 4.2) / 4)), CX, 1.5, 0, 52);
  if (t >= 4.2) { tEvil.position.set(CX - 0.1, 2.5, 0.2); tEvil.scale.multiplyScalar(0.6); }
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2021年の韓国ドラマ。全20話。痛快ダークヒーロー
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  tKR.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKR.visible = false;
  t20.userData.pop((t - 4.2) / 0.35); tDark.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, 2.8, lerp(8.0, 7.2, u), TX + 0.4, 2.7, -1.5, 56);
  return qs;
}
function shotPlaza(t) { // 6段目 42〜49（決め手）：イタリアのマフィアの顧問。韓国生まれのイタリア人
  base(); S.aim(DX, -2); lift(-40); S.hemi.intensity = 1.35; S.key.intensity = 1.7;
  qs.background.set('#9cc4ea'); qs.fog.color.set('#9cc4ea');
  const a = FLAG.geometry.attributes.position; for (let i = 0; i < a.count; i++) { const x = FLAG_BASE[i * 3]; a.array[i * 3 + 2] = Math.sin(x * 3 + t * 5) * 0.08 * (x + 0.75); } a.needsUpdate = true;
  const sip = clamp((t - 1.0) / 0.6) * (1 - clamp((t - 2.6) / 0.6));
  h6.userData.arms[1].rotation.x = -0.6 - 1.0 * sip; h6.userData.head.rotation.x = -0.05;
  CUP.position.set(DX + 0.32, lerp(0.95, 1.6, sip), lerp(-0.15, 0.0, sip) - 0.6 + 0.6);
  tITA.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tITA.visible = false; tBorn.userData.pop((t - 3.6) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.8, 0.5, u), lerp(1.9, 1.8, u), lerp(4.4, 3.4, u), DX + 0.3, 1.6, -1.2, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の古いビル。金塊だけが光る）
  shotStreet(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.6, 0.15, d);
  S.spot.color.set(0xffe0c0); S.spot.position.set(0, 5, 2); S.spot.target.position.set(0, 0.3, -3.4); S.spot.intensity = lerp(0, 40, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(lerp(0.4, 0.2, k), lerp(1.6, 1.4, k), lerp(8.2, 7.0, k), 0.1, 0.8, -3.0, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStreet(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotArcade },
  { a: 25, b: 33, f: shotTower },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotPlaza },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '古いビルの中に、<br>大量の金塊が隠されている。'],
  [5.6, 9.0, 'それを知る男が、<br>海を越えてやってきた。'],
  [9.2, 13.2, '男は、ある組織の<br>顧問弁護士。'],
  [13.2, 17.0, '仲間に裏切られ、<br>生まれた国へ戻ってきた。'],
  [17.2, 21.0, 'ビルにいるのは、<br>くせの強い住人たち。'],
  [21.0, 25.0, 'ところがビルは、<br>大企業に奪われかけていた。'],
  [25.2, 29.0, '相手は、悪事を重ねる<br>巨大企業。'],
  [29.0, 33.0, '男は、悪には悪で<br>立ち向かうと決めた。'],
  [33.2, 37.4, '2021年の韓国ドラマ。<br>全20話。'],
  [37.4, 41.8, '笑えて痛快な、<br>ダークヒーローもの。'],
  [42.2, 45.4, '幼いころイタリアに渡り、<br>マフィアの顧問になった。'],
  [45.4, 49.0, '主人公は、韓国生まれの<br>イタリア人弁護士。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ヴィンチェンツォ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q063', v2: true, answer: 'ヴィンチェンツォ',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 6363,
    hits: [5.6, 13.2, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.5, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.3, 'drone'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '2021年': 'にせんにじゅういちねん', '全20話': 'ぜんにじゅうわ', '古い': 'ふるい', '中に': 'なかに', '大量': 'たいりょう', '金塊': 'きんかい', '隠されて': 'かくされて', '知る男': 'しるおとこ', '海を越えて': 'うみをこえて', '男は': 'おとこは', '組織': 'そしき', '顧問弁護士': 'こもんべんごし', '仲間': 'なかま', '裏切られ': 'うらぎられ', '生まれた国': 'うまれたくに', '戻ってきた': 'もどってきた', '強い住人': 'つよいじゅうにん', '大企業': 'だいきぎょう', '奪われ': 'うばわれ', '相手': 'あいて', '悪事を重ねる': 'あくじをかさねる', '巨大企業': 'きょだいきぎょう', '悪には悪で': 'あくにはあくで', '立ち向かう': 'たちむかう', '決めた': 'きめた', '韓国生まれ': 'かんこくうまれ', '韓国': 'かんこく', '笑えて': 'わらえて', '痛快': 'つうかい', '幼いころ': 'おさないころ', '渡り': 'わたり', '顧問': 'こもん', '主人公': 'しゅじんこう', 'イタリア人弁護士': 'イタリアじんべんごし', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n古いビルの中に、大量の金塊が隠されている。それを知る男が、海を越えてやってきた。男は、ある組織の顧問弁護士。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '韓国ドラマ', 'ダークヒーロー'],
  },
});
applyQuizCards({ answer: 'ヴィンチェンツォ', info: 'Netflix｜韓国ドラマ・全20話', answerSize: 100 });
