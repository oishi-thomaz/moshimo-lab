import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #062 薬屋のひとりごと（テレビアニメ・日本・2023年10月〜。FOD・U-NEXT で見放題（Netflix・Prime Video・Hulu・Disney+ も）、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/yao-wu-nohitorigoto で2026/11/9確認。Netflix 日本のトップ10（10/26〜11/1 番組4位・第3期）
//   Filmarks 第1期 4.1・レビュー40,769件 filmarks.com/animes/3964/5360）
// 確かめた事実（Filmarks の作品紹介・ja.wikipedia.org/wiki/薬屋のひとりごと。2026/11/9）：
//   ・花街で薬師をしていた娘が、薬草採りに出かけた森で人さらいにあい、帝の妃たちが住む後宮に下働きとして売られる
//   ・年季が明けるまで目立たず過ごすつもりだった。後宮は噂と陰謀の絶えない女の園
//   ・帝の御子たちが短命で、いまいる御子も病で弱っていると聞き、興味本位で原因を調べ始める
//   ・美形の宦官が娘を寵妃の毒見役にする。人間には興味がないが毒と薬への執着は異常。宦官から面倒事を押し付けられる
//   ・テレビアニメ第1期は2023年10月〜（日本テレビ系）。第3期の第1クールは2026年10月から放送。劇場版は2026年12月11日公開予定
// 構成（ヒント6段）：1 薬草つみの少女がさらわれた → 2 町の薬師、目立たず年季明けを待つ → 3 帝の妃たちが暮らす場所、うわさと陰謀
//   → 4 帝の子が弱っていく、原因に気づく → 5 2023年からの日本のテレビアニメ・第3期放送中・12月に劇場版 → 6 決め手：毒見役の薬師の娘、美しい宦官
// 「後宮」「毒見」「宦官」は6段目まで出さない。人物名・国名・建物の名前は出さない。謎の答え（子が弱った原因）や物語の先は言わない。
// アニメの絵・キャラクターの見た目（髪型・服・そばかす）・ロゴは使わない。人は汎用の3D、宮殿はどこにでもある形

const S = quizStage({ bg: '#1a2028', floor: '#26302a', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(6262);

const GIRL = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#7a8a6a', pants: '#5a6a4a', long: true, skirt: true, scale: 0.92 };
const LADY = (i) => ({ skin: '#f5d3b5', hair: ['#1d1a19', '#2c2421', '#1a1a22'][i % 3], shirt: ['#c94f7c', '#8e6bbf', '#e9a03a', '#4fa3d1', '#d97a3a'][i % 5], pants: ['#a83a5a', '#6a4a9a', '#c8802a', '#3a7ab0', '#b85a2a'][i % 5], long: true, skirt: true });
const DARK = { skin: '#d9a57c', hair: '#1a1a1a', shirt: '#2a2a2e', pants: '#1e1e22' };
const ROBE = { skin: '#f1d0b0', hair: '#1a1622', shirt: '#6a4a9a', pants: '#4a2e7a', long: true, scale: 1.08 };

function roofHall(w, d, wall, roof) { // どこにでもある宮殿風の建物（赤い柱と反った屋根）
  const g = new THREE.Group();
  const base = box(w + 0.6, 0.4, d + 0.6, mat('#c8c0b0')); base.position.y = 0.2; g.add(base);
  const body = box(w, 2.6, d, mat(wall)); body.position.y = 1.7; g.add(body);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 10), mat('#b8322a')); p.position.set(-w / 2 + 0.2 + i * (w - 0.4) / 5, 1.7, d / 2 + 0.25); g.add(p); }
  const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.6, 4), mat(roof)); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, d / w + 0.25); rf.position.y = 3.8; g.add(rf);
  const eave = box(w + 1.4, 0.16, d + 1.4, mat(roof)); eave.position.y = 3.05; g.add(eave);
  return g;
}
function lantern() { const g = new THREE.Group(); const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffb050' })); l.scale.y = 1.3; g.add(l); const c = box(0.12, 0.06, 0.12, mat('#3a2a1a')); c.position.y = 0.3; g.add(c); return g; }

// ---------- 1段目. 夕方の森（x=0）。薬草のかごを落として、少女が荷車で連れ去られる ----------
{ const fl = box(16, 0.04, 14, mat('#3a4a32')); fl.position.set(0, 0.02, -2); qs.add(fl);
  for (let i = 0; i < 22; i++) { const x = (R() - 0.5) * 15, z = -3 - R() * 7; const tr = new THREE.Mesh(new THREE.ConeGeometry(0.8 + R() * 0.6, 3 + R() * 2, 7), mat(['#2a4a32', '#33553a', '#24402c'][i % 3])); tr.position.set(x, 1.6 + R(), z); qs.add(tr); const tk = box(0.2, 0.8, 0.2, mat('#4a3424')); tk.position.set(x, 0.4, z); qs.add(tk); }
  const path = box(2.2, 0.03, 14, mat('#7a6a4a')); path.position.set(0.6, 0.05, -2); qs.add(path); }
const BASKET = new THREE.Group(); qs.add(BASKET);
{ const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.28, 12, 1, true), new THREE.MeshLambertMaterial({ color: '#b08a4a', side: THREE.DoubleSide })); b.position.y = 0.14; BASKET.add(b); }
const HERBS = []; for (let i = 0; i < 9; i++) { const h = box(0.06, 0.02, 0.22, mat(['#5a9a4a', '#7ab05a', '#4a8a3a'][i % 3])); h.userData = { a: R() * 6.28, r: 0.3 + R() * 0.6 }; qs.add(h); HERBS.push(h); }
const g1 = makePerson(GIRL); qs.add(g1);
const MEN = [makePerson(DARK), makePerson(DARK)]; MEN.forEach(m => qs.add(m));
const CART = new THREE.Group(); qs.add(CART);
{ const bed = box(1.6, 0.3, 1.0, mat('#5a4030')); bed.position.y = 0.6; CART.add(bed); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14), mat('#3a2a1a')); w.rotation.x = Math.PI / 2; w.position.set(0, 0.42, s * 0.56); CART.add(w); } const cov = box(1.5, 0.7, 0.95, mat('#3a3630')); cov.position.y = 1.1; CART.add(cov); }
const tWay = tag('薬草つみの帰り道', { size: 64, w: 580, bg: '#14161c', sx: 2.0 }); tWay.position.set(0.3, 2.25, -0.4); qs.add(tWay);
const tGone = tag('少女が、さらわれた', { size: 64, w: 600, bg: '#e2483c', sx: 2.0 }); tGone.position.set(0.3, 2.25, -0.4); qs.add(tGone);

// ---------- 2段目. 小さな薬の部屋（x=40）。薬研で薬をひく少女 ----------
const OX = 40;
{ const fl = box(10, 0.04, 8, mat('#6a5640')); fl.position.set(OX, 0.02, -1); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#d8ccb4')); wl.position.set(OX, 2.5, -3.6); qs.add(wl);
  for (let r = 0; r < 3; r++) { const sh = box(4.4, 0.08, 0.5, mat('#5a4030')); sh.position.set(OX - 0.6, 1.6 + r * 0.8, -3.3); qs.add(sh); for (let i = 0; i < 8; i++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 10), mat(['#c8b088', '#8a6a4a', '#d8d0c0', '#6a8a6a', '#a87a5a'][(i + r) % 5])); j.position.set(OX - 2.4 + i * 0.52, 1.84 + r * 0.8, -3.25); qs.add(j); } }
  const tb = box(2.2, 0.08, 1.1, mat('#7a5a3a')); tb.position.set(OX + 0.2, 0.8, -1.0); qs.add(tb); for (const x of [-0.95, 0.95]) for (const z of [-0.45, 0.45]) { const lg = box(0.08, 0.8, 0.08, mat('#5a4030')); lg.position.set(OX + 0.2 + x, 0.4, -1.0 + z); qs.add(lg); }
  const boat = box(0.8, 0.18, 0.24, mat('#5a5a5e')); boat.position.set(OX + 0.2, 0.93, -1.1); qs.add(boat);
  for (let i = 0; i < 5; i++) { const h = box(0.18, 0.02, 0.12, mat(['#5a9a4a', '#c89a4a', '#8a5a3a'][i % 3])); h.position.set(OX + 0.85 + (i % 2) * 0.2, 0.86, -1.25 + i * 0.12); qs.add(h); } }
const WHEEL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), mat('#7a7a80')); WHEEL.rotation.x = Math.PI / 2; qs.add(WHEEL);
const g2 = makePerson(GIRL); g2.position.set(OX + 0.2, 0, -1.75); g2.rotation.y = 0; qs.add(g2);
const tKusu = tag('町の薬師', { size: 76, w: 380, bg: '#14161c', sx: 1.1 }); tKusu.position.set(OX + 0.2, 2.75, -1.2); qs.add(tKusu);
const tQuiet = tag('目立たず、静かに', { size: 64, w: 520, bg: '#3a7a5a', sx: 1.4 }); tQuiet.position.set(OX + 0.2, 2.75, -1.2); qs.add(tQuiet);

// ---------- 3段目. 宮殿の中庭（x=80）。着飾った女性たちが行き交い、ささやき合う ----------
const BX = 80;
{ const fl = box(22, 0.04, 18, mat('#bcb4a4')); fl.position.set(BX, 0.02, -5); qs.add(fl);
  for (let i = 0; i < 7; i++) { const st = box(22, 0.02, 0.06, mat('#a8a090')); st.position.set(BX, 0.05, -12 + i * 2); qs.add(st); }
  const h1 = roofHall(9, 3, '#e8dcc4', '#2e4a5a'); h1.position.set(BX, 0, -11); qs.add(h1);
  const h2 = roofHall(5, 3, '#e8dcc4', '#2e4a5a'); h2.position.set(BX - 8, 0, -7); h2.rotation.y = 0.9; qs.add(h2);
  const h3 = roofHall(5, 3, '#e8dcc4', '#2e4a5a'); h3.position.set(BX + 8, 0, -7); h3.rotation.y = -0.9; qs.add(h3);
  for (let i = 0; i < 5; i++) { const l = lantern(); l.position.set(BX - 4 + i * 2, 3.0, -9.0); qs.add(l); } }
const LADIES = []; for (let i = 0; i < 9; i++) { const p = makePerson(LADY(i)); p.userData.p = [BX - 6 + (i % 5) * 3 + (i > 4 ? 1.5 : 0), -3.5 - (i > 4 ? 2.6 : 0) + (i % 2) * 0.5]; p.userData.walk = i % 3 === 0; p.position.set(p.userData.p[0], 0, p.userData.p[1]); qs.add(p); LADIES.push(p); }
const g3 = makePerson({ ...GIRL, shirt: '#8a8a7a', pants: '#6a6a5a' }); g3.position.set(BX + 1.2, 0, -1.0); qs.add(g3);
const BASIN = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.2, 14), mat('#8a6a4a')); qs.add(BASIN);
const tWho = tag('帝の妃たちが、暮らす場所', { size: 58, w: 760, bg: '#14161c', sx: 2.9 }); tWho.position.set(BX, 3.9, -3.5); qs.add(tWho);
const tRumor = tag('うわさと陰謀', { size: 74, w: 480, bg: '#8e3a6a', sx: 2.3 }); tRumor.position.set(BX, 3.9, -3.5); qs.add(tRumor);

// ---------- 4段目. 夜の寝所（x=120）。小さな寝台のそばの母、戸口からのぞく少女 ----------
const CX = 120;
{ const fl = box(10, 0.04, 8, mat('#4a3a30')); fl.position.set(CX, 0.02, -1); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#6a4a3a')); wl.position.set(CX, 2.5, -3.6); qs.add(wl);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(110, 120, (g, w, h) => { g.fillStyle = '#e8d8b0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a4a2a'; g.lineWidth = 4; for (let x = 0; x <= w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }) })); scr.position.set(CX - 2.6, 1.8, -3.48); qs.add(scr);
  const crib = box(1.3, 0.5, 0.8, mat('#8a5a3a')); crib.position.set(CX + 0.4, 0.55, -1.6); qs.add(crib); for (const x of [-0.6, 0.6]) for (const z of [-0.35, 0.35]) { const lg = box(0.08, 0.3, 0.08, mat('#6a4028')); lg.position.set(CX + 0.4 + x, 0.15, -1.6 + z); qs.add(lg); }
  const cloth = box(1.1, 0.12, 0.62, mat('#f0e8e0')); cloth.position.set(CX + 0.4, 0.86, -1.6); qs.add(cloth);
  const baby = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat('#f5d3b5')); baby.position.set(CX + 0.05, 0.98, -1.6); qs.add(baby); }
const LAMP = lantern(); LAMP.position.set(CX + 1.7, 1.6, -2.2); qs.add(LAMP);
const mom = makePerson(LADY(1)); mom.position.set(CX + 1.3, 0, -1.0); mom.rotation.y = -1.9; qs.add(mom);
const g4 = makePerson({ ...GIRL, shirt: '#8a8a7a', pants: '#6a6a5a' }); g4.position.set(CX - 1.6, 0, -0.4); g4.rotation.y = 1.2; qs.add(g4);
const QM = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (g) => { g.fillStyle = '#e6b450'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('！', 32, 34); }), transparent: true, depthTest: false })); QM.renderOrder = 9; qs.add(QM);
const tWeak = tag('帝の子が、弱っていく', { size: 62, w: 640, bg: '#14161c', sx: 1.9 }); tWeak.position.set(CX, 2.7, -0.8); qs.add(tWeak);
const tCause = tag('原因に、気づいた', { size: 66, w: 540, bg: '#e2483c', sx: 1.75 }); tCause.position.set(CX, 2.7, -0.8); qs.add(tCause);

// ---------- 5段目. テレビの前（x=160）。2023年からの日本のテレビアニメ・第3期放送中・12月に劇場版 ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#181a22' })); bg.position.set(TX, 4, -3); qs.add(bg);
  const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a6a5a'); gr.addColorStop(1, '#14201c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 3; i++) { g.fillRect(40 + i * 150, 70, 120, 150); } g.fillStyle = '#e6b450'; for (let i = 0; i < 3; i++) { g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.fillText(String(i + 1), 100 + i * 150, 170); } }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
const tJP = tag('2023年〜 日本のアニメ', { size: 60, w: 680, bg: '#e6b450', color: '#14161c', sx: 3.3 }); tJP.position.set(TX, 4.6, -1.2); qs.add(tJP);
const tS3 = tag('いま 第3期を放送中', { size: 62, w: 640, bg: '#3a7ad8', sx: 3.1 }); tS3.position.set(TX, 4.6, -1.2); qs.add(tS3);
const tMovie = tag('12月に 劇場版', { size: 66, w: 520, bg: '#e2483c', sx: 2.6 }); tMovie.position.set(TX, 3.75, -1.0); qs.add(tMovie);

// ---------- 6段目. 妃の部屋（x=200）。器を口にする少女（毒見）と、うしろに立つ紫の衣の宦官 ----------
const DX = 200;
{ const fl = box(10, 0.04, 8, mat('#5a3a2e')); fl.position.set(DX, 0.02, -1); qs.add(fl);
  const wl = box(10, 5, 0.2, mat('#b8322a')); wl.position.set(DX, 2.5, -3.6); qs.add(wl);
  const pnl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(210, 110, (g, w, h) => { g.fillStyle = '#e8d8a8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8922a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#c8a050'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(30 + i * 38, 55, 12, 0, Math.PI * 2); g.fill(); } }) })); pnl.position.set(DX, 2.8, -3.48); qs.add(pnl);
  const tb = box(1.8, 0.08, 0.9, mat('#3a2418')); tb.position.set(DX - 0.2, 0.7, -0.9); qs.add(tb); for (const x of [-0.8, 0.8]) { const lg = box(0.1, 0.7, 0.8, mat('#2a1a10')); lg.position.set(DX - 0.2 + x, 0.35, -0.9); qs.add(lg); }
  for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.08, 14), mat('#f0ece4')); d.position.set(DX - 0.8 + i * 0.4, 0.78, -0.95); qs.add(d); } }
const CUP = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.12, 12), mat('#f0ece4')); qs.add(CUP);
const g6 = makePerson(GIRL); g6.position.set(DX - 0.3, 0, -0.2); g6.rotation.y = 0.2; qs.add(g6);
const eunuch = makePerson(ROBE); eunuch.position.set(DX + 1.3, 0, -1.6); eunuch.rotation.y = -0.6; qs.add(eunuch);
const SCROLLS = []; for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10), mat('#e8dcc0')); s.rotation.z = Math.PI / 2; qs.add(s); SCROLLS.push(s); }
const tPoison = tag('毒見役の、薬師の娘', { size: 60, w: 640, bg: '#14161c', sx: 1.9 }); tPoison.position.set(DX, 2.55, -0.4); qs.add(tPoison);
const tEunuch = tag('美しい宦官から、難題', { size: 60, w: 660, bg: '#6a4a9a', sx: 1.95 }); tEunuch.position.set(DX, 2.55, -0.4); qs.add(tEunuch);

// ---------- shots ----------
const ALL = [tWay, tGone, tKusu, tQuiet, tWho, tRumor, tWeak, tCause, tJP, tS3, tMovie, tPoison, tEunuch];
function base() { S.reset(); ALL.forEach(x => x.visible = false); QM.visible = false; }

function shotForest(t) { // 1段目 0〜9：薬草つみの帰り道。少女が、さらわれた（0秒目がサムネ。男たちがもう背後に）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 0.8; S.darken(0.35, '#2a1a20');
  S.key.color.set(0xffb070);
  const grab = clamp((t - 3.4) / 1.0);
  // かご：少女の手から落ちて転がる
  BASKET.position.set(0.9, 0, 0.6); BASKET.rotation.z = grab > 0.3 ? 1.4 : 0; BASKET.visible = true;
  HERBS.forEach(h => { const u = h.userData, k = grab > 0.3 ? 1 : 0; h.visible = k > 0; h.position.set(0.9 + Math.cos(u.a) * u.r, 0.05, 0.6 + Math.sin(u.a) * u.r * 0.6); h.rotation.y = u.a; });
  if (t < 4.4) { g1.visible = true; g1.position.set(0.6, 0, 0.4); g1.rotation.y = t < 3.4 ? 0.3 : 2.6; g1.userData.arms.forEach(a => a.rotation.x = t > 3.4 ? -1.6 : -0.2); g1.userData.head.rotation.x = 0; }
  else g1.visible = false;
  MEN[0].position.set(lerp(-1.2, -0.3, ease(clamp(t / 3.4))), 0, lerp(-1.6, 0.0, ease(clamp(t / 3.4)))); MEN[0].rotation.y = 1.0; MEN[0].userData.arms.forEach(a => a.rotation.x = t > 3.2 ? -1.4 : -0.3);
  MEN[1].position.set(lerp(2.4, 1.6, ease(clamp(t / 3.4))), 0, lerp(-1.8, -0.4, ease(clamp(t / 3.4)))); MEN[1].rotation.y = -1.2;
  const go = clamp((t - 4.6) / 4.2);
  CART.position.set(lerp(-1.6, -1.6, go), 0, lerp(-2.4, -7.5, ease(go))); CART.rotation.y = Math.PI / 2;
  if (t > 4.4) { MEN.forEach((m, i) => { m.position.set(-1.6 + (i ? 0.7 : -0.7), 0, lerp(-1.6, -6.8, ease(go))); m.rotation.y = Math.PI; poseWalk(m, t * 6, go < 1 ? 1 : 0); }); }
  tWay.userData.pop(1); if (t > 4.4) tWay.visible = false;
  tGone.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(lerp(1.6, 1.2, u), lerp(2.4, 2.6, u), lerp(5.2, 4.8, u), 0.2, 1.1, -1.2, 56);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：町の薬師。目立たず、静かに
  base(); S.aim(OX, -1); lift(-40); S.hemi.intensity = 1.15;
  const ph = t * 3.0; WHEEL.position.set(OX + 0.2 + Math.sin(ph) * 0.25, 1.06, -1.1); WHEEL.rotation.y = 0;
  g2.userData.arms.forEach((a, i) => { a.rotation.x = -1.1 + Math.sin(ph) * 0.15; a.rotation.z = (i ? -1 : 1) * 0.25; });
  g2.userData.head.rotation.x = 0.35;
  tKusu.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKusu.visible = false;
  tQuiet.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(OX + lerp(0.9, 0.5, u), lerp(2.0, 1.9, u), lerp(3.4, 2.8, u), OX + 0.2, 1.4, -1.4, 56);
  return qs;
}
function shotCourt(t) { // 3段目 17〜25：帝の妃たちが、暮らす場所。うわさと陰謀
  base(); S.aim(BX, -5); lift(-30); S.hemi.intensity = 1.25;
  LADIES.forEach((p, i) => { const [x, z] = p.userData.p; if (p.userData.walk) { p.position.set(x + Math.sin(t * 0.4 + i) * 1.2, 0, z); p.rotation.y = Math.cos(t * 0.4 + i) > 0 ? Math.PI / 2 : -Math.PI / 2; poseWalk(p, t * 4, 0.5); } else { p.position.set(x, 0, z); p.rotation.y = (i % 2 ? -0.8 : 0.8); p.userData.head.rotation.y = Math.sin(t * 1.3 + i) * 0.3; p.userData.arms[i % 2].rotation.x = -0.8; } });
  g3.userData.arms.forEach(a => a.rotation.x = -1.0); BASIN.position.set(BX + 1.2, 1.05, -0.65);
  g3.userData.head.rotation.y = Math.sin(t * 0.8) * 0.5;
  tWho.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWho.visible = false;
  tRumor.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.4, 0.6, u), lerp(2.8, 2.6, u), lerp(4.8, 4.0, u), BX, 1.8, -4.5, 58);
  return qs;
}
function shotNight(t) { // 4段目 25〜33：帝の子が、弱っていく。原因に、気づいた
  base(); S.aim(CX, -1); lift(-40); S.hemi.intensity = 0.55; S.darken(0.55, '#06070a');
  S.spot.color.set(0xffc080); S.spot.position.set(CX + 1.5, 4, 0); S.spot.target.position.set(CX + 0.4, 0.8, -1.6); S.spot.intensity = 22 + Math.sin(t * 7) * 2;
  mom.userData.head.rotation.x = 0.5; mom.userData.arms.forEach(a => a.rotation.x = -0.7);
  g4.userData.head.rotation.y = 0.2; g4.userData.arms[0].rotation.x = t > 4.4 ? -1.4 : -0.2;
  QM.visible = t > 4.4; QM.position.set(CX - 1.6, 2.35 + Math.sin(t * 5) * 0.03, -0.4);
  tWeak.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWeak.visible = false;
  tCause.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.3, -0.4, u), lerp(2.1, 2.0, u), lerp(5.8, 5.2, u), CX - 0.25, 1.2, -1.0, 58);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2023年からの日本のアニメ。第3期を放送中。12月に劇場版
  base(); S.aim(TX, 0); lift(-30); S.hemi.intensity = 1.1;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false;
  tS3.userData.pop((t - 4.2) / 0.35); tMovie.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, 2.8, lerp(8.0, 7.2, u), TX + 0.4, 2.7, -1.5, 56);
  return qs;
}
function shotTaste(t, quiz = 0) { // 6段目 42〜49（決め手）：毒見役の、薬師の娘。美しい宦官から、難題
  base(); S.aim(DX, -1); lift(-40); S.hemi.intensity = 1.1;
  const sip = clamp((t - 0.6) / 0.8) * (1 - clamp((t - 2.8) / 0.6));
  g6.userData.arms[1].rotation.x = -0.5 - 1.2 * sip; g6.userData.head.rotation.x = -0.1 * sip;
  CUP.position.set(DX - 0.3 + 0.1, lerp(0.8, 1.55, sip), lerp(-0.85, -0.05, sip));
  const hand = clamp((t - 3.6) / 0.8);
  eunuch.userData.arms[0].rotation.x = -1.0 * hand; eunuch.userData.head.rotation.x = 0.1;
  SCROLLS.forEach((s, i) => { s.visible = t > 3.6; const k = clamp((t - 3.8 - i * 0.35) / 0.5); s.position.set(lerp(DX + 1.0, DX + 0.3 + (i % 2) * 0.12, k), lerp(1.3, 0.8 + i * 0.12, k), lerp(-1.2, -0.95, k)); });
  if (!quiz) { tPoison.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tPoison.visible = false; tEunuch.userData.pop((t - 3.6) / 0.3); }
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.4, u), lerp(2.0, 1.9, u), lerp(4.6, 3.8, u), DX + 0.3, 1.3, -0.9, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（宮殿の中庭）
  shotCourt(5.0);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.25, 0.25, d);
  S.spot.color.set(0xffe0c0); S.spot.position.set(BX, 7, -1); S.spot.target.position.set(BX, 1, -5); S.spot.intensity = lerp(0, 70, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(BX + lerp(0.8, 0.4, k), lerp(2.6, 2.3, k), lerp(5.0, 4.2, k), BX, 1.8, -5, 56);
  countdown(t);
  return qs;
}
const warm = (f) => (t) => { S.key.color.set(0xfff0dc); return f(t); };

const SHOTS = [
  { a: 0, b: 9, f: shotForest },
  { a: 9, b: 17, f: warm(shotRoom) },
  { a: 17, b: 25, f: warm(shotCourt) },
  { a: 25, b: 33, f: warm(shotNight) },
  { a: 33, b: 42, f: warm(shotTV) },
  { a: 42, b: 49, f: warm((t) => shotTaste(t, 0)) },
  { a: 49, b: 56, f: warm(shotQuiz) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '薬草をつみに出た少女が、<br>森でさらわれた。'],
  [5.6, 9.0, '売られた先は、<br>きらびやかな宮殿の奥。'],
  [9.2, 13.2, '少女は、町で薬を<br>作っていた薬師。'],
  [13.2, 17.0, '目立たず、年季が<br>明けるのを待つつもりだった。'],
  [17.2, 21.0, 'そこは、帝の妃たちが<br>暮らす女の園。'],
  [21.0, 25.0, 'うわさと陰謀が、<br>絶えない場所。'],
  [25.2, 29.0, '帝の子どもたちが、<br>病で弱っていく。'],
  [29.0, 33.0, '少女は、その原因に<br>気づいてしまう。'],
  [33.2, 37.4, '2023年からの、<br>日本のテレビアニメ。'],
  [37.4, 41.8, 'いま、第3期を放送中。<br>12月には劇場版も。'],
  [42.2, 45.4, '毒と薬が大好きな娘が、<br>毒見役に。'],
  [45.4, 49.0, '美しい宦官に、<br>難題を押しつけられる。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>薬屋のひとりごと。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q062', v2: true, answer: '薬屋のひとりごと',
    title: 'この作品のタイトルは？',
    titleHtml: 'この作品の<br>タイトルは？',
    mood: 'mystery', seed: 6262,
    hits: [5.6, 13.2, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.5, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.3, 'drone'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '2023年': 'にせんにじゅうさんねん', '第3期': 'だいさんき', '12月': 'じゅうにがつ', '薬草': 'やくそう', '出た少女': 'でたしょうじょ', '少女': 'しょうじょ', '森': 'もり', '売られた先': 'うられたさき', '宮殿の奥': 'きゅうでんのおく', '町で薬を': 'まちでくすりを', '作っていた': 'つくっていた', '薬師': 'くすし', '目立たず': 'めだたず', '年季': 'ねんき', '明ける': 'あける', '待つ': 'まつ', '帝の妃': 'みかどのきさき', '暮らす女の園': 'くらすおんなのその', '陰謀': 'いんぼう', '絶えない場所': 'たえないばしょ', '帝の子ども': 'みかどのこども', '病で弱って': 'やまいでよわって', '原因': 'げんいん', '気づいて': 'きづいて', '日本': 'にほん', '放送中': 'ほうそうちゅう', '劇場版': 'げきじょうばん', '毒と薬': 'どくとくすり', '大好きな娘': 'だいすきなむすめ', '毒見役': 'どくみやく', '美しい宦官': 'うつくしいかんがん', '難題': 'なんだい', '押しつけられる': 'おしつけられる', 'この作品': 'このさくひん', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '薬屋のひとりごと': 'くすりやのひとりごと', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この作品のタイトル、わかる？\n薬草をつみに出た少女が、森でさらわれた。売られた先は、きらびやかな宮殿の奥。少女は、町で薬を作っていた薬師。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'U-NEXT', 'アニメ好き', 'ミステリー'],
  },
});
applyQuizCards({ answer: '薬屋の<br>ひとりごと', info: 'FOD・U-NEXT｜日本のアニメ・第1〜3期', answerSize: 130 });
