import * as THREE from 'three';
import { clamp, lerp, ease, easeBack, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #036 リーガル・ハイ（ドラマ・日本・2012年・フジテレビ。FODで見放題、
//   justwatch.com/jp/テレビ番組/rigaruhai で2026/11/4確認。Filmarks 4.4・レビュー35,613件 filmarks.com/dramas/1201/2496）
// 確かめた事実（Filmarks の作品ページのあらすじ。2026/11/4）：
//   ・主人公の古美門研介は、偏屈・毒舌・皮肉屋・気分屋・浪費家・人格破綻者だが、訴訟の勝率は100％。勝つためには手段を選ばない、駆け引きと策略の天才。
//     金銭と名誉と女性をこよなく愛し、法曹業界内での評判は最悪。教科書通りの正義を振りかざす青二才の弁護士を嫌い、「勝った者が正義」がモットー
//   ・社会正義・弱者救済の使命に燃える女性弁護士・黛真知子が、ひょんなことから古美門とともに働くことになる。「六法全書を丸暗記した女」の異名を持つ超ガリ勉。
//     古美門＝堺雅人、黛＝新垣結衣。脚本 古沢良太。2012年製作
// 構成（ヒント6段）：1 裁判で一度も負けたことがない男、勝つためなら手段を選ばない → 2 偏屈・毒舌・皮肉屋・浪費家、評判は最悪 → 3 愛するのはお金と名誉、教科書通りの正義は大嫌い
//   → 4 正義感に燃える若い女性弁護士と組むことに → 5 2012年の日本のドラマ、堺雅人と新垣結衣 → 6 決め手：モットーは勝った者が正義、六法全書を丸暗記した女
// 人物の名前・事務所の名前は字幕にも札にも出さない。実在の裁判所や事件は出さない。作品の映像・俳優・ロゴ・有名な場面の構図は使わない。人と法廷は汎用の3D

const S = quizStage({ bg: '#2a2620', floor: '#4a3a2e', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(3636);

const KOMI = { skin: '#efcfae', hair: '#1a1616', shirt: '#3a3a42', pants: '#2a2a30', tie: true };
const MAYU = { skin: '#f2d4b8', hair: '#2a1a14', shirt: '#2a3044', pants: '#2a3044', skirt: true };

// ---------- 1段目. 法廷（x=0）。壁の勝ち星がずらり ----------
{ const fl = box(12, 0.04, 10, mat('#6a5240')); fl.position.set(0, 0.02, -1); qs.add(fl);
  const wl = box(12, 6, 0.2, mat('#8a6a4e')); wl.position.set(0, 3, -5); qs.add(wl);
  const bench = box(5, 1.4, 1.2, mat('#5a3e2a')); bench.position.set(0, 0.9, -3.6); qs.add(bench);
  const bt = box(5.2, 0.1, 1.4, mat('#4a321e')); bt.position.set(0, 1.65, -3.6); qs.add(bt);
  for (const s of [-1, 1]) { const tb = box(2.0, 0.8, 0.8, mat('#6a4a32')); tb.position.set(s * 2.2, 0.4, -0.6); qs.add(tb); } }
const JUDGE = makePerson({ skin: '#e8c4a0', hair: '#8a8a8a', shirt: '#141418', pants: '#141418' }); JUDGE.position.set(0, 0.6, -4.1); qs.add(JUDGE);
const komi1 = makePerson(KOMI); komi1.position.set(-1.5, 0, 0.3); komi1.rotation.y = 0.3; qs.add(komi1);
const opp1 = makePerson({ skin: '#e8c4a0', hair: '#2a2420', shirt: '#22262f', pants: '#1c1e24', tie: true }); opp1.position.set(1.4, 0, 0.3); opp1.rotation.y = -0.3; qs.add(opp1);
const WINS = []; for (let i = 0; i < 14; i++) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: '#e6b450' })); w.position.set(-3.9 + (i % 7) * 1.3, 4.2 - Math.floor(i / 7) * 0.7, -4.88); qs.add(w); WINS.push(w); }
const tUndef = tag('一度も負けない', { size: 72, w: 500, bg: '#e6b450', color: '#14161c', sx: 1.9 }); tUndef.position.set(-0.4, 2.6, 0); qs.add(tUndef);
const tAny = tag('手段は選ばない', { size: 72, w: 500, bg: '#e2483c', sx: 1.9 }); tAny.position.set(-0.4, 2.6, 0); qs.add(tAny);

// ---------- 2段目. スポットライトの男（x=40）。悪口の札が次々に ----------
const MX = 40;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1a18' })); bg.position.set(MX, 4, -3); qs.add(bg); const st = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 32), mat('#5a4a3e')); st.position.set(MX, 0.05, 0); qs.add(st); }
const komi2 = makePerson(KOMI); komi2.position.set(MX, 0.1, 0); qs.add(komi2);
const WORDS = ['偏屈', '毒舌', '皮肉屋', '浪費家'].map((w, i) => { const t = tag(w, { size: 76, w: 300, bg: ['#14161c', '#e2483c', '#14161c', '#e2483c'][i], sx: 1.05 }); qs.add(t); return t; });
const WPOS = [[-0.6, 2.55], [0.6, 2.35], [-0.65, 1.6], [0.65, 1.3]];
const tBad = tag('評判は最悪', { size: 80, w: 440, bg: '#e2483c', sx: 1.7 }); tBad.position.set(MX, 2.55, 0.3); qs.add(tBad);

// ---------- 3段目. 豪華な部屋（x=80）。金貨の山とトロフィー ----------
const OX = 80;
{ const fl = box(10, 0.04, 8, mat('#7a2a2a')); fl.position.set(OX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#3a4a3a')); wl.position.set(OX, 3, -4); qs.add(wl);
  for (const x of [-3, 3]) { const fr = box(1.6, 2.0, 0.08, mat('#c89a3a')); fr.position.set(OX + x, 3.2, -3.85); qs.add(fr); const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.7), mat(x < 0 ? '#5a7a8a' : '#8a6a4a')); pic.position.set(OX + x, 3.2, -3.8); qs.add(pic); }
  const desk = box(2.6, 0.9, 1.2, mat('#4a2e1e')); desk.position.set(OX, 0.45, -1.8); qs.add(desk); }
const COINS = []; for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3 })); c.userData.x = (R() - 0.5) * 1.6; c.userData.z = -1.8 + (R() - 0.5) * 0.6; c.userData.h = 0.92 + Math.floor(i / 8) * 0.045 + R() * 0.02; c.userData.o = R(); qs.add(c); COINS.push(c); }
const CUP = new THREE.Group(); CUP.position.set(OX + 0.9, 0.9, -2.0); qs.add(CUP);
{ const gold = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.85, roughness: 0.25 }); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.1, 0.35, 20), gold); c.position.y = 0.45; CUP.add(c); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10), gold); st.position.y = 0.18; CUP.add(st); const bs = box(0.3, 0.08, 0.3, gold); bs.position.y = 0.04; CUP.add(bs); }
const komi3 = makePerson(KOMI); komi3.position.set(OX - 0.8, 0, -0.6); komi3.rotation.y = 0.4; qs.add(komi3);
const BOOK3 = box(0.5, 0.12, 0.36, mat('#3a5a8a')); qs.add(BOOK3);
const tMoney = tag('お金と名誉が大好き', { size: 62, w: 600, bg: '#e6b450', color: '#14161c', sx: 2.0 }); tMoney.position.set(OX, 2.7, -0.6); qs.add(tMoney);
const tHate = tag('教科書通りの正義が大嫌い', { size: 54, w: 700, bg: '#14161c', sx: 2.2 }); tHate.position.set(OX, 2.7, -0.6); qs.add(tHate);

// ---------- 4段目. 事務所の入り口（x=120）。分厚い本を抱えた若い女性弁護士が来る ----------
const EX = 120;
{ const fl = box(10, 0.04, 10, mat('#8a7a64')); fl.position.set(EX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#d8ccb4')); wl.position.set(EX, 3, -4); qs.add(wl);
  const dr = box(1.4, 2.6, 0.1, mat('#5a3e2a')); dr.position.set(EX + 1.8, 1.3, -3.85); qs.add(dr); }
const komi4 = makePerson(KOMI); komi4.position.set(EX - 0.9, 0, -0.6); komi4.rotation.y = 0.5; qs.add(komi4);
const mayu4 = makePerson(MAYU); mayu4.position.set(EX + 2, 0, -3.2); qs.add(mayu4);
const BOOK4 = box(0.5, 0.36, 0.62, mat('#2a4a8a')); qs.add(BOOK4);
const tJust = tag('正義感に燃える弁護士', { size: 62, w: 640, bg: '#3a7ad8', sx: 1.7 }); tJust.position.set(EX, 2.6, -0.4); qs.add(tJust);
const tOpp = tag('真逆のふたり', { size: 76, w: 460, bg: '#e2483c', sx: 1.7 }); tOpp.position.set(EX, 2.6, -0.4); qs.add(tOpp);

// ---------- 5段目. テレビ（x=160）。2012年の日本のドラマ・堺雅人と新垣結衣 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e1a18' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { g.fillStyle = '#6a4a32'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a321e'; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#3a2a1e'; g.fillRect(w * 0.3, h * 0.3, w * 0.4, h * 0.34); g.fillStyle = '#e6b450'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(70 + i * 62, 50, 14, 0, Math.PI * 2); g.fill(); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
{ const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const tJP = tag('2012年 日本のドラマ', { size: 62, w: 600, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tJP.position.set(TX, 4.6, -1.2); qs.add(tJP);
const tCast = tag('堺雅人 × 新垣結衣', { size: 64, w: 600, bg: '#e2483c', sx: 3.2 }); tCast.position.set(TX, 4.6, -1.2); qs.add(tCast);

// ---------- 6段目. 法廷でふたり（x=0 を使い回し）。勝った者が正義・六法全書を丸暗記した女 ----------
const BIG = box(0.62, 0.78, 0.4, mat('#2a4a8a')); qs.add(BIG);
const BIGP = box(0.58, 0.72, 0.36, mat('#f4f0e6')); qs.add(BIGP);
const mayu6 = makePerson(MAYU); mayu6.position.set(-0.9, 0, 1.0); qs.add(mayu6);
const tMotto = tag('モットーは 勝った者が正義', { size: 56, w: 760, bg: '#e6b450', color: '#14161c', sx: 2.1 }); tMotto.position.set(-1.15, 3.1, 0); qs.add(tMotto);
const tRoppo = tag('六法全書を丸暗記した女', { size: 56, w: 700, bg: '#3a7ad8', sx: 2.0 }); tRoppo.position.set(-1.15, 2.5, 0); qs.add(tRoppo);

// ---------- shots ----------
const ALL = [tUndef, tAny, tBad, tMoney, tHate, tJust, tOpp, tJP, tCast, tMotto, tRoppo, ...WORDS];
function base() { S.reset(); ALL.forEach(x => x.visible = false); BIG.visible = false; BIGP.visible = false; mayu6.visible = false; BOOK3.visible = false; BOOK4.visible = false; WINS.forEach(w => w.visible = true); }

function shotCourt(t) { // 1段目 0〜9：その男は、裁判で一度も負けたことがない。勝つためなら、手段を選ばない（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.2; S.darken(0.15, '#2a1a10');
  WINS.forEach((w, i) => { const k = clamp(t * 4 - i * 0.25 + 3); w.scale.setScalar(Math.max(0.01, easeBack(clamp(k)))); });
  komi1.userData.arms[1].rotation.x = -1.6 + 0.2 * Math.sin(t * 3); komi1.userData.arms[1].rotation.z = 0.2;
  opp1.userData.head.rotation.x = 0.3 + (t > 4.6 ? 0.2 : 0);
  tUndef.userData.pop(1); if (t > 4.6) tUndef.visible = false;
  tAny.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(-0.4, -0.8, u), lerp(2.6, 2.3, u), lerp(7.0, 5.8, u), -0.4, 2.0, -2, 56);
  return qs;
}
function shotWords(t) { // 2段目 9〜17：偏屈、毒舌、皮肉屋。おまけに浪費家。業界での評判は、最悪
  base(); S.aim(MX, 0); lift(-40); S.hemi.intensity = 0.6; S.key.intensity = 0.4;
  S.spot.color.set(0xfff0d8); S.spot.position.set(MX, 6, 3); S.spot.target.position.set(MX, 1, 0); S.spot.intensity = 50;
  komi2.userData.head.rotation.y = Math.sin(t * 1.2) * 0.3; komi2.userData.arms.forEach((a, i) => a.rotation.x = -0.3 - 0.2 * Math.sin(t * 2 + i));
  WORDS.forEach((w, i) => { w.position.set(MX + WPOS[i][0], WPOS[i][1], 0.4); if (t < 4.0) w.userData.pop((t - 0.3 - i * 0.8) / 0.3); });
  tBad.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(MX, lerp(1.8, 1.7, u), lerp(5.6, 4.8, u), MX, 1.5, 0, 52);
  return qs;
}
function shotRoom(t) { // 3段目 17〜25：彼が愛するのは、お金と名誉。教科書通りの正義は、大嫌い
  base(); S.aim(OX, -2); lift(-40); S.hemi.intensity = 1.3; S.darken(0.05, '#6a4a2a');
  COINS.forEach((c, i) => { const f = clamp(t * 2 - c.userData.o * 3); c.position.set(OX + c.userData.x, lerp(3.2, c.userData.h, ease(f)), c.userData.z); c.rotation.x = (1 - f) * 4; });
  CUP.rotation.y = t * 0.6;
  BOOK3.visible = t > 4.0; const th = ease((t - 4.2) / 0.8); BOOK3.position.set(OX - 0.4 + th * 0.9, lerp(1.3, 0.2, th), lerp(-0.4, 0.4, th)); BOOK3.rotation.z = th * 2.4;
  komi3.userData.arms[1].rotation.x = t > 4.0 ? -1.4 * (1 - th) - 0.3 : -0.6; komi3.userData.head.rotation.y = t > 4.0 ? 0.5 : 0;
  tMoney.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMoney.visible = false;
  tHate.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(OX + lerp(0.8, 0.4, u), lerp(2.2, 2.0, u), lerp(4.8, 4.0, u), OX, 1.3, -1.4, 54);
  return qs;
}
function shotEnter(t) { // 4段目 25〜33：そこへ現れた、正義感に燃える若い女性弁護士。真逆のふたりが、組むことになる
  base(); S.aim(EX, -2); lift(-40); S.hemi.intensity = 1.3;
  const w = ease(t / 3); mayu4.position.set(EX + lerp(2.0, 0.6, w), 0, lerp(-3.2, -0.6, w)); mayu4.rotation.y = lerp(Math.PI * 0.85, -0.5, ease((t - 2.6) / 0.8));
  const ph = t * 9 * (1 - w); mayu4.userData.legs[0].rotation.x = Math.sin(ph) * 0.5 * (1 - w); mayu4.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5 * (1 - w);
  mayu4.userData.arms.forEach(a => a.rotation.x = -1.2);
  BOOK4.visible = true; BOOK4.position.copy(mayu4.position).add(new THREE.Vector3(0, 1.1, 0)); BOOK4.rotation.y = mayu4.rotation.y; BOOK4.translateZ(0.3);
  komi4.userData.head.rotation.x = t > 4.2 ? -0.15 : 0; komi4.userData.arms.forEach(a => { a.rotation.x = t > 4.2 ? -0.6 : 0; a.rotation.z = 0; });
  tJust.userData.pop((t - 1.0) / 0.35); if (t > 4.0) tJust.visible = false;
  tOpp.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(EX + lerp(0.2, 0, u), lerp(2.2, 1.9, u), lerp(5.2, 4.4, u), EX, 1.3, -0.8, 56);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2012年の、日本の弁護士ドラマ。主演は、堺雅人と新垣結衣
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.2;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  tCast.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX, 2.8, lerp(7.6, 6.8, u), TX, 2.7, -1.5, 56);
  return qs;
}
function shotFinal(t, quiz = 0) { // 6段目 42〜49（決め手）：モットーは、勝った者が正義。六法全書を丸暗記した女と、勝率100パーセントの男
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.1; S.darken(0.25, '#2a1a10');
  WINS.forEach(w => w.scale.setScalar(1));
  komi1.userData.arms[1].rotation.x = -1.6; komi1.userData.arms[1].rotation.z = 0.2; opp1.userData.head.rotation.x = 0.4;
  mayu6.visible = true; mayu6.position.set(-0.45, 0, 1.0); mayu6.rotation.y = 0.2; mayu6.userData.arms.forEach(a => a.rotation.x = -1.2);
  BIG.visible = BIGP.visible = true; BIG.position.set(-0.45, 1.05, 1.38); BIGP.position.set(-0.45, 1.05, 1.42);
  if (!quiz) { tMotto.userData.pop((t - 0.4) / 0.35); tRoppo.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(lerp(-0.6, -0.9, u), lerp(2.4, 2.2, u), lerp(6.4, 5.6, u), -1.2, 1.6, -0.2, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（勝ち星の並ぶ法廷）
  shotFinal(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.1, 0.25, d);
  S.spot.color.set(0xfff0d8); S.spot.position.set(-1.4, 6, 4); S.spot.target.position.set(-1.6, 1, 0.6); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(lerp(-1.0, -1.2, k), lerp(2.0, 1.9, k), lerp(5.4, 4.6, k), -1.4, 1.5, 0, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotCourt },
  { a: 9, b: 17, f: shotWords },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotEnter },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: (t) => shotFinal(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'その男は、裁判で<br>一度も負けたことがない。'],
  [5.6, 9.0, '勝つためなら、<br>手段を選ばない。'],
  [9.2, 13.2, '偏屈、毒舌、皮肉屋。<br>おまけに浪費家。'],
  [13.2, 17.0, '業界での評判は、<br>最悪。'],
  [17.2, 21.0, '彼が愛するのは、<br>お金と名誉。'],
  [21.0, 25.0, '教科書通りの正義は、<br>大嫌い。'],
  [25.2, 29.0, 'そこへ現れたのは、<br>正義感に燃える女性弁護士。'],
  [29.0, 33.0, '真逆のふたりが、<br>一緒に働くことになる。'],
  [33.2, 37.4, '2012年の、<br>日本の弁護士ドラマ。'],
  [37.4, 41.8, '主演は、<br>堺雅人と新垣結衣。'],
  [42.2, 45.4, 'モットーは、<br>勝った者が正義。'],
  [45.4, 49.0, '相棒は、六法全書を<br>丸暗記した女。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、リーガル・ハイ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q036', v2: true, answer: 'リーガル・ハイ',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 3636,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 9.6, 10.4, 11.2, 12.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.2, 'buzz'], [17.0, 'whoosh'], [17.4, 'bubble'], [21.2, 'poof'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'リーガル・ハイ': 'リーガルハイ', '2012年': 'にせんじゅうにねん', '六法全書': 'ろっぽうぜんしょ', '丸暗記': 'まるあんき', '堺雅人': 'さかいまさと', '新垣結衣': 'あらがきゆい', '弁護士': 'べんごし', '一度も': 'いちども', '手段': 'しゅだん', '選ばない': 'えらばない', '偏屈': 'へんくつ', '毒舌': 'どくぜつ', '皮肉屋': 'ひにくや', '浪費家': 'ろうひか', '業界': 'ぎょうかい', '評判': 'ひょうばん', '最悪': 'さいあく', '名誉': 'めいよ', '教科書通り': 'きょうかしょどおり', '正義感': 'せいぎかん', '正義': 'せいぎ', '燃える': 'もえる', '真逆': 'まぎゃく', '主演': 'しゅえん', '勝った者': 'かったもの', '相棒': 'あいぼう', '裁判': 'さいばん', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nその男は、裁判で一度も負けたことがない。勝つためなら、手段を選ばない。偏屈、毒舌、皮肉屋。おまけに浪費家。業界での評判は、最悪。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'FOD', 'ドラマ好き', '名作ドラマ', 'コメディ'],
  },
});
applyQuizCards({ answer: 'リーガル・ハイ', info: 'FOD｜日本のドラマ', answerSize: 124 });
