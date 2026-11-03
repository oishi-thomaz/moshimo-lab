import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #024 逃げるは恥だが役に立つ（ドラマ・日本・2016年・TBS火曜ドラマ。Prime Video・Netflixで見放題、justwatch.com/jp/テレビ番組/tao-geruhachi-dagayi-nili-tsu で2026/11/3確認。
//   Filmarks 4.2・レビュー6.8万件 filmarks.com/dramas/834/1951）
// 確かめた事実：
//   ・主人公みくりは大学院を出て臨床心理士の資格をとったが就職できず、派遣切りにもあう。相手の平匡はIT企業の会社員で「プロの独身」を自称。
//     雇用主と従業員の関係として「契約結婚」をする。みくりの提案で結婚を「仕事」にする。TBS系 火曜よる10時（cinematoday.jp/news/N0087750）
//   ・みくりは会社員・津崎の家事代行として働いていたが、その職を失いそうになり契約結婚を提案。原作は海野つなみ、ジャンルは社会派ラブコメディー（thetv.jp/program/0000911020/4/）
//   ・夫が雇用主で妻が従業員という契約結婚（Filmarks の作品紹介）
//   ・エンディングで主題歌に合わせてキャストがダンスを披露し、大きな話題に。フルバージョンは1日で100万回再生（mdpr.jp/news/1624213）
// 構成（ヒント6段）：1 不採用の通知が次々、派遣も切られる → 2 家事代行の仕事、それもなくなりそう → 3 都会のマンション、プロの独身の会社員
//   → 4 契約の結婚、夫が雇い主で妻が従業員 → 5 日本の火曜ドラマ、社会派ラブコメ → 6 決め手：お給料の出る結婚、エンディングのダンスが話題に
// 歌詞・曲名は使わない。ダンスの振り付けはなぞらない（汎用の体ゆらしだけ）。俳優・ポスター・ロゴは使わない。結末には触れない

const S = quizStage({ bg: '#f0d8c8', floor: '#d8c0a8', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(2424);

const HER = { skin: '#f5d3b5', hair: '#2c2421', shirt: '#e8a8a0', pants: '#5a6a8a', long: true };
const HIM = { skin: '#efcfae', hair: '#1d1a19', shirt: '#e8ecf0', pants: '#3a4050', tie: true };
const wood = mat('#b08a62');
function sit(p) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = -0.38; return p; }
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }
function room(g, wall = '#f4e8dc', floor = '#c8a880') { const fl = box(9, 0.1, 7, mat(floor)); fl.position.y = 0.05; g.add(fl); const wl = box(9, 3.6, 0.2, mat(wall)); wl.position.set(0, 1.8, -2.6); g.add(wl); }

// ---------- 1. 不採用の通知が降ってくる（x=0）。0秒目がサムネ ----------
{ const g = new THREE.Group(); qs.add(g); room(g, '#e8dccc');
  const desk = box(1.6, 0.06, 0.8, wood); desk.position.set(0, 0.75, -0.6); g.add(desk);
  for (const [x, z] of [[-0.72, -0.92], [0.72, -0.92], [-0.72, -0.28], [0.72, -0.28]]) { const l = box(0.06, 0.75, 0.06, wood); l.position.set(x, 0.375, z); g.add(l); }
  const lap = box(0.6, 0.03, 0.4, mat('#3a3e48')); lap.position.set(0, 0.8, -0.6); g.add(lap); const scr = box(0.6, 0.4, 0.03, mat('#3a3e48')); scr.position.set(0, 1.0, -0.8); g.add(scr);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ color: '#cfe0f0' })); sc.position.set(0, 1.0, -0.78); g.add(sc); }
const her1 = sit(makePerson(HER)); her1.position.set(0, -0.36, 0.05); her1.rotation.y = Math.PI; qs.add(her1);
const NGTEX = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,40,40,.3)'; for (let y = 60; y < 300; y += 30) g.fillRect(24, y, w - 48 - ((y * 7) % 60), 10); g.strokeStyle = '#d0261d'; g.lineWidth = 8; g.strokeRect(46, 120, 164, 92); g.fillStyle = '#d0261d'; g.font = '900 52px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('不採用', 128, 168); });
const NG = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshBasicMaterial({ map: NGTEX, side: THREE.DoubleSide })); m.userData = { x: (R() - 0.5) * 2.6, z: -0.2 + (R() - 0.5) * 1.6, d: i * 0.32, r: R() * 6, s: 0.6 + R() * 0.5 }; qs.add(m); NG.push(m); }
const tHaken = tag('派遣切り', { size: 84, w: 400, bg: '#e2483c', sx: 1.0 }); tHaken.position.set(0, 2.45, 0); qs.add(tHaken);

// ---------- 2. 家事代行（x=30）。会社員の部屋をきれいにする ----------
{ const g = new THREE.Group(); g.position.set(30, 0, 0); qs.add(g); room(g, '#eef0f2', '#a8a090');
  const sofa = box(1.8, 0.45, 0.7, mat('#5a6a7a')); sofa.position.set(1.2, 0.3, -1.8); g.add(sofa); const back = box(1.8, 0.5, 0.2, mat('#5a6a7a')); back.position.set(1.2, 0.75, -2.15); g.add(back);
  const kitchen = box(2.0, 0.9, 0.6, mat('#e8e4dc')); kitchen.position.set(-2.4, 0.45, -2.2); g.add(kitchen); }
const her2 = makePerson({ ...HER, shirt: '#f4f0e8' }); her2.position.set(29.4, 0, -0.4); qs.add(her2);
{ const apron = box(0.46, 0.7, 0.02, mat('#7a9ab8')); apron.position.set(0, 1.0, 0.15); her2.add(apron); }
const MOP = new THREE.Group(); { const st = box(0.04, 1.2, 0.04, mat('#c8a060')); st.position.y = 0.6; MOP.add(st); const hd = box(0.4, 0.06, 0.14, mat('#e8e8e8')); MOP.add(hd); } qs.add(MOP);
const DUST = [0, 1, 2, 3, 4, 5].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); qs.add(d); return d; });
const tJob = tag('家事代行', { size: 84, w: 400, bg: '#14161c', sx: 1.0 }); tJob.position.set(29.6, 2.5, -0.4); qs.add(tJob);
const tLose = tag('この仕事もなくなる？', { size: 60, w: 640, bg: '#e2483c', sx: 1.5 }); tLose.position.set(29.8, 2.5, -0.4); qs.add(tLose);

// ---------- 3. 都会のマンション（x=60）。プロの独身の会社員 ----------
const MX = 60;
{ for (let i = 0; i < 7; i++) { const w = 2.4 + R(), h = 6 + R() * 9; const wt = windowTextures(600 + i, ['#5a6478', '#6a7284', '#4e5668'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.8 })); b.position.set(MX - 9 + i * 3, h / 2, -12 - (i % 2) * 2); qs.add(b); }
  const bal = box(4, 0.1, 2, mat('#c8ccd2')); bal.position.set(MX, 0.05, 0); qs.add(bal); const rail = box(4, 0.06, 0.06, mat('#8a8e96')); rail.position.set(MX, 1.0, 0.95); qs.add(rail);
  for (let i = 0; i < 9; i++) { const p = box(0.04, 1.0, 0.04, mat('#8a8e96')); p.position.set(MX - 2 + i * 0.5, 0.5, 0.95); qs.add(p); } }
const him3 = makePerson(HIM); him3.position.set(MX, 0, 0.2); him3.rotation.y = Math.PI; qs.add(him3);
const tPro = tag('プロの独身', { size: 80, w: 440, bg: '#14161c', sx: 1.2 }); tPro.position.set(MX, 2.55, 0.2); qs.add(tPro);
const tNoLove = tag('恋愛はいらない', { size: 64, w: 520, bg: '#e6b450', color: '#14161c', sx: 1.3 }); tNoLove.position.set(MX, 2.55, 0.2); qs.add(tNoLove);

// ---------- 4・6. テーブルの契約書（x=90）：雇い主と従業員、お給料 ----------
const TX = 90;
{ const g = new THREE.Group(); g.position.set(TX, 0, 0); qs.add(g); room(g, '#f4ece0');
  const tb = box(1.6, 0.06, 0.9, wood); tb.position.set(0, 0.72, 0); g.add(tb);
  for (const [x, z] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) { const l = box(0.06, 0.72, 0.06, wood); l.position.set(x, 0.36, z); g.add(l); } }
const her4 = sit(makePerson(HER)); her4.position.set(TX - 0.95, -0.36, 0); her4.rotation.y = Math.PI / 2; qs.add(her4);
const him4 = sit(makePerson(HIM)); him4.position.set(TX + 0.95, -0.36, 0); him4.rotation.y = -Math.PI / 2; qs.add(him4);
const KTEX = canvasTex(512, 690, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2b2b'; g.textAlign = 'center'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.fillText('契約書', w / 2, 110); g.fillStyle = 'rgba(40,40,40,.3)'; for (let y = 180; y < 600; y += 44) g.fillRect(64, y, w - 128 - ((y * 7) % 96), 14); });
const KDOC = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.67), new THREE.MeshLambertMaterial({ map: KTEX })); KDOC.rotation.x = -Math.PI / 2; KDOC.position.set(TX, 0.755, 0.05); qs.add(KDOC);
const ENV = new THREE.Group(); { const e = box(0.36, 0.02, 0.2, mat('#f4f0e4')); ENV.add(e); const b = box(0.08, 0.022, 0.2, mat('#c84a3a')); ENV.add(b); } qs.add(ENV);
const tKeiyaku = tag('契約結婚', { size: 88, w: 420, bg: '#e2483c', sx: 1.1 }); tKeiyaku.position.set(TX, 2.3, 0); qs.add(tKeiyaku);
const tBoss = tag('夫＝雇い主', { size: 64, w: 380, bg: '#14161c', sx: 0.9 }); tBoss.position.set(TX + 0.5, 2.0, 0.3); qs.add(tBoss);
const tStaff = tag('妻＝従業員', { size: 64, w: 380, bg: '#e6b450', color: '#14161c', sx: 0.9 }); tStaff.position.set(TX - 0.5, 2.45, 0.3); qs.add(tStaff);
const tPay = tag('お給料の出る結婚', { size: 62, w: 560, bg: '#e2483c', sx: 1.4 }); tPay.position.set(TX, 2.3, 0); qs.add(tPay);

// ---------- 5. 火曜の夜のテレビ（x=120）：日本の社会派ラブコメ ----------
const VX = 120;
{ const g = new THREE.Group(); g.position.set(VX, 0, 0); qs.add(g); room(g, '#3a3448', '#5a4a40');
  const tv = box(2.4, 1.4, 0.1, mat('#1a1a1e')); tv.position.set(0, 1.6, -2.4); g.add(tv);
  const stand = box(2.0, 0.5, 0.5, mat('#5a4430')); stand.position.set(0, 0.25, -2.3); g.add(stand);
  const sofa = box(2.2, 0.45, 0.8, mat('#8a5a5a')); sofa.position.set(0, 0.3, 1.0); g.add(sofa); const back = box(2.2, 0.55, 0.2, mat('#8a5a5a')); back.position.set(0, 0.8, 1.4); g.add(back); }
const TVS = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.24), new THREE.MeshBasicMaterial({ color: '#f4a8b8' })); TVS.position.set(VX, 1.6, -2.34); qs.add(TVS);
const VIEW = [0, 1, 2].map(i => { const p = sit(makePerson({ skin: ['#f5d3b5', '#efcfae', '#e8b98f'][i], hair: ['#2c2421', '#1d1a19', '#6a6a6a'][i], shirt: ['#e8a040', '#4a6a9a', '#7a5a8a'][i], pants: '#3a3e48', long: i === 0 })); p.position.set(VX - 0.7 + i * 0.7, 0.1, 0.9); p.rotation.y = Math.PI; qs.add(p); return p; });
const HEARTS = [0, 1, 2, 3, 4].map(i => { const t = tag('♥', { size: 110, w: 160, h: 160, bg: 'rgba(0,0,0,0)', color: '#ff6a8a', sx: 0.45 }); qs.add(t); return t; });
const tTue = tag('火曜の夜10時', { size: 66, w: 480, bg: '#14161c', sx: 1.6 }); tTue.position.set(VX, 2.75, -1.6); qs.add(tTue);
const tGenre = tag('日本の社会派ラブコメ', { size: 60, w: 680, bg: '#e6b450', color: '#14161c', sx: 2.0 }); tGenre.position.set(VX, 2.75, -1.6); qs.add(tGenre);

// ---------- 6. 決め手（x=150）：エンディングのダンス ----------
const DX = 150;
{ const st = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 48), mat('#f4e4d4')); st.position.set(DX, 0.15, 0); qs.add(st);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshBasicMaterial({ color: '#f8c8d0' })); back.position.set(DX, 3, -3.2); qs.add(back); }
const DANCERS = [HER, HIM, { skin: '#efcfae', hair: '#4a3426', shirt: '#7ab8a0', pants: '#3a4050' }, { skin: '#f5d3b5', hair: '#1d1a19', shirt: '#f2c14e', pants: '#5a4a3a', long: true, skirt: true }, { skin: '#e8b98f', hair: '#2c2421', shirt: '#8e6bbf', pants: '#2b3346' }].map((o, i) => { const p = makePerson(o); p.position.set(DX + [-1.2, 1.2, -2.2, 0, 2.2][i], 0.3, [0, 0, -0.8, -1.0, -0.8][i]); qs.add(p); return p; });
const NOTES = [0, 1, 2, 3].map(i => { const t = tag('♪', { size: 110, w: 160, h: 160, bg: 'rgba(0,0,0,0)', color: '#e2483c', sx: 0.5 }); qs.add(t); return t; });
const tDance = tag('エンディングのダンス', { size: 62, w: 680, bg: '#e2483c', sx: 2.0 }); tDance.position.set(DX, 3.15, 0); qs.add(tDance);

// ---------- shots ----------
const ALL = [tHaken, tJob, tLose, tPro, tNoLove, tKeiyaku, tBoss, tStaff, tPay, tTue, tGenre, tDance, ...HEARTS, ...NOTES];
function base() { S.reset(); ALL.forEach(x => x.visible = false); NG.forEach(n => n.visible = false); DUST.forEach(d => d.visible = false); ENV.visible = false; }

function shotNG(t, T) { // 0〜9：不採用の通知が次々に降ってくる。派遣の仕事も切られる（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-120);
  NG.forEach((n, i) => { const k = (T + 0.9 - n.userData.d) / 1.1; n.visible = k > 0; const kk = easeOut(clamp(k)); n.position.set(n.userData.x * 0.7, lerp(3.4, 0.82 + i * 0.004, kk), n.userData.z); n.rotation.set(lerp(0.3, -Math.PI / 2, kk), 0, n.userData.r + k * (1 - kk) * 3); });
  her1.userData.head.rotation.x = 0.2 + Math.sin(T * 2) * 0.05; her1.userData.arms.forEach(a => a.rotation.x = T > 4 ? -2.4 : -0.9);
  tHaken.userData.pop((T - 5.6) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.4, 0.2, u), lerp(2.2, 2.1, u), lerp(4.6, 4.0, u), 0, 1.2, -0.3, 56);
  return qs;
}
function shotClean(t) { // 9〜17：始めたのは、ある会社員の家事代行。でもその仕事も、なくなりそう
  base(); S.aim(30, 0); lift(-80);
  her2.position.x = 29.4 + Math.sin(t * 1.4) * 0.5; her2.rotation.y = Math.PI * 0.15; her2.userData.arms.forEach(a => a.rotation.x = -0.9 + Math.sin(t * 6) * 0.15);
  MOP.position.set(her2.position.x + 0.1, 0.06, 0.25); MOP.rotation.x = -0.4;
  DUST.forEach((d, i) => { d.visible = t < 3.6; d.position.set(her2.position.x + Math.sin(i * 2 + t) * 0.4, 0.2 + ((t * 0.6 + i / 6) % 1) * 0.8, 0.3 + Math.cos(i) * 0.2); });
  tJob.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tJob.visible = false;
  tLose.userData.pop((t - 4.4) / 0.35);
  if (t > 4.4) { her2.userData.arms.forEach(a => a.rotation.x = -0.2); her2.userData.head.rotation.x = 0.35; }
  const u = ease(t / 8);
  look(lerp(29.8, 29.7, u), lerp(1.9, 1.8, u), lerp(4.4, 3.8, u), 29.6, 1.3, -0.4, 56);
  return qs;
}
function shotCity(t) { // 17〜25：都会のマンションに住む、恋愛をしない会社員。自分をプロの独身と呼ぶ
  base(); S.aim(MX, 0); lift(-80);
  S.darken(0.75, '#1a2238'); S.hemi.intensity = 0.7; S.key.intensity = 0.4;
  tPro.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tPro.visible = false;
  tNoLove.userData.pop((t - 4.4) / 0.35);
  him3.rotation.y = lerp(Math.PI, Math.PI * 0.0 + 0.0001, ease((t - 3.8) / 0.8)) ;
  const u = ease(t / 8);
  look(lerp(MX + 0.6, MX + 0.3, u), lerp(1.8, 1.9, u), lerp(4.6, 4.0, u), MX, 1.45, 0, 56);
  return qs;
}
function shotContract(t) { // 25〜33：彼女の提案は、契約の結婚。夫が雇い主で、妻が従業員
  base(); S.aim(TX, 0); lift(90);
  her4.userData.arms[1].rotation.x = t < 3 ? -1.2 : -0.3; him4.userData.head.rotation.x = t < 2 ? 0.2 : -0.1;
  KDOC.position.x = lerp(TX - 0.4, TX, ease((t - 0.4) / 0.8));
  tKeiyaku.userData.pop((t - 1.0) / 0.35); if (t > 4.0) tKeiyaku.visible = false;
  tBoss.userData.pop((t - 4.4) / 0.35); tStaff.userData.pop((t - 5.2) / 0.35);
  const u = ease(t / 8);
  look(TX, lerp(2.7, 2.6, u), lerp(6.0, 5.5, u), TX, 1.2, 0, 54);
  return qs;
}
function shotTV(t) { // 33〜42：火曜の夜10時、日本の社会派ラブコメディ
  base(); S.aim(VX, 0); lift(-60);
  S.darken(0.5, '#140e1a'); S.hemi.intensity = 0.7; S.key.intensity = 0.3;
  TVS.material.color.setHSL(0.95, 0.7, 0.75 + Math.sin(t * 3) * 0.04);
  tTue.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tTue.visible = false;
  tGenre.userData.pop((t - 4.4) / 0.35);
  HEARTS.forEach((h, i) => { const k = ((t * 0.5 + i / 5) % 1); h.visible = t > 4.4; h.position.set(VX - 0.9 + i * 0.45, 1.2 + k * 1.2, -1.8); h.material.opacity = 1 - k; });
  VIEW.forEach((p, i) => { p.userData.head.rotation.z = Math.sin(t * 2 + i) * 0.08; });
  const u = ease(t / 9);
  look(VX, lerp(2.4, 2.3, u), lerp(4.8, 4.2, u), VX, 1.6, -1.2, 56);
  return qs;
}
function shotPay(t) { // 42〜49：決め手。お給料の出る結婚。エンディングのダンスが大きな話題に
  base();
  if (t < 3.4) { // テーブルで給料袋を渡す
    S.aim(TX, 0); lift(90);
    ENV.visible = true; const k = ease((t - 0.4) / 1.0); ENV.position.set(lerp(TX + 0.6, TX - 0.5, k), 0.77, 0.15);
    him4.userData.arms[0].rotation.x = t < 1.6 ? -1.1 : -0.2; her4.userData.arms[1].rotation.x = t > 1.2 ? -1.0 : -0.3;
    tPay.userData.pop((t - 0.6) / 0.35);
    look(TX, 2.5, 5.4, TX, 1.1, 0, 54);
  } else { // ステージで、みんなが体をゆらして踊る
    const d = t - 3.4;
    S.aim(DX, 0); lift(-100); S.hemi.intensity = 1.3;
    DANCERS.forEach((p, i) => { const ph = d * 5.2 + i * 0.0; p.position.y = 0.3 + Math.abs(Math.sin(ph)) * 0.06; p.rotation.y = Math.sin(ph * 0.5) * 0.35; p.userData.arms[0].rotation.z = -0.5 - Math.sin(ph) * 0.4; p.userData.arms[1].rotation.z = 0.5 + Math.sin(ph) * 0.4; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.2; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.2; });
    NOTES.forEach((n, i) => { const k = ((d * 0.6 + i / 4) % 1); n.visible = true; n.position.set(DX - 2.4 + i * 1.6, 2.0 + k * 1.0, 0.4); n.material.opacity = 1 - k; });
    tDance.userData.pop((d - 0.3) / 0.35);
    look(DX, 2.4, lerp(7.6, 7.2, ease(d / 3.6)), DX, 1.4, -0.4, 54);
  }
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜のテーブルに、契約書とふたり）
  base(); S.aim(TX, 0); lift(90);
  const d = ease(t / 1.0); S.hemi.intensity = lerp(1.25, 0.3, d); S.key.intensity = lerp(1.5, 0.1, d); S.darken(d * 0.85, '#1a1020');
  S.spot.color.set(0xffd8b0); S.spot.position.set(TX, 3.4, 0.6); S.spot.target.position.set(TX, 0.7, 0); S.spot.intensity = lerp(0, 30, ease((t - 0.3) / 1.0));
  her4.userData.arms[1].rotation.x = -0.3; him4.userData.arms[0].rotation.x = -0.2;
  const k = ease(t / 7);
  look(TX, lerp(2.6, 2.4, k), lerp(5.8, 5.2, k), TX, 1.1, 0, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotNG(t, T) },
  { a: 9, b: 17, f: shotClean },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotContract },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotPay },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '大学院まで出たのに、<br>就職先が見つからない。'],
  [5.6, 9.0, '派遣の仕事も、<br>切られてしまった。'],
  [9.2, 13.2, '始めたのは、ある<br>会社員の家事代行。'],
  [13.2, 17.0, 'でもその仕事も、<br>なくなりそうになる。'],
  [17.2, 21.0, '相手は、恋愛を<br>必要としない会社員。'],
  [21.0, 25.0, '自分のことを、<br>プロの独身と呼ぶ男。'],
  [25.2, 29.0, '彼女の提案は、<br>契約の結婚。'],
  [29.0, 33.0, '夫が雇い主で、<br>妻が従業員。'],
  [33.2, 37.4, '火曜の夜に放送された、<br>日本のドラマ。'],
  [37.4, 41.8, 'ジャンルは、<br>社会派ラブコメディ。'],
  [42.2, 45.4, '家事をして、<br>お給料をもらう結婚。'],
  [45.4, 49.0, 'エンディングのダンスが、<br>大きな話題になった。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、逃げるは恥だが<br>役に立つ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q024', v2: true, answer: '逃げるは恥だが役に立つ',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 2424,
    hits: [5.6, 25.2, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.8, 13.6, 26.0, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [45.4, 'poof'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '逃げる': 'にげる', '恥': 'はじ', '役に立つ': 'やくにたつ', '大学院': 'だいがくいん', '出た': 'でた', '就職先': 'しゅうしょくさき', '見つからない': 'みつからない', '派遣': 'はけん', '仕事': 'しごと', '切られて': 'きられて', '始めた': 'はじめた', '会社員': 'かいしゃいん', '家事代行': 'かじだいこう', '相手': 'あいて', '恋愛': 'れんあい', '必要': 'ひつよう', '自分': 'じぶん', '独身': 'どくしん', '呼ぶ': 'よぶ', '男': 'おとこ', '彼女': 'かのじょ', '提案': 'ていあん', '契約': 'けいやく', '結婚': 'けっこん', '夫': 'おっと', '雇い主': 'やといぬし', '妻': 'つま', '従業員': 'じゅうぎょういん', '火曜': 'かよう', '夜': 'よる', '放送': 'ほうそう', '日本': 'にほん', '社会派': 'しゃかいは', '家事': 'かじ', '給料': 'きゅうりょう', '大きな': 'おおきな', '話題': 'わだい', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n大学院まで出たのに、就職先が見つからない。派遣の仕事も切られてしまった。始めたのは、ある会社員の家事代行。でもその仕事も、なくなりそうになる。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'アマプラ', 'ドラマ好き', 'ラブコメ'],
  },
});
applyQuizCards({ answer: '逃げるは恥だが<br>役に立つ', info: 'Prime Video・Netflix｜日本のドラマ', answerSize: 104 });
