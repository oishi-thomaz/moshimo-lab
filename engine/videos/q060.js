import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #060 真夏の夜の淫夢（2001年7月20日のビデオ作品。ネットの名言で語り継がれるオマージュ回。ゆうとの依頼 2026/11/08）
// 作り方の決めごと（ゆうとと合意）：
// - 出演者には似せない（顔・体つき・服装をなぞらない。先輩・後輩は配色も別の、いつものブロック人形）。出演者の名前・呼び名は出さない
// - 睡眠薬・眠らせる場面、性的な場面・声は一切入れない。名言は ラーメン屋の屋台／アイスティー／屋上／こ↑こ↓／やりますねぇ だけ
// - 家は取り壊し済み（ゆうと）。外観は坂の上の大きな家・タイルの階段・屋上の手すり・アンテナ程度の、どこにでもある形にとどめる
// - 配信サービスはどこもやっていないので、答えのカードは 2001年｜ビデオ作品

const S = quizStage({ bg: '#8fc3ea', floor: '#8a8478', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(1060);

const SENPAI = { skin: '#e8b98f', hair: '#1a1a1e', shirt: '#c8463c', pants: '#3b3f4a' };
const KOUHAI = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#4fa3d1', pants: '#8a7a5a' };
const glassMat = new THREE.MeshPhongMaterial({ color: '#dfeef7', transparent: true, opacity: 0.35, shininess: 90 });
function icedTea(s = 1) { // グラスのアイスティー（氷とストロー）
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.1 * s, 0.34 * s, 16, 1, true), glassMat); cup.position.y = 0.17 * s; g.add(cup);
  const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * s, 0.095 * s, 0.26 * s, 16), new THREE.MeshLambertMaterial({ color: '#b5651d', transparent: true, opacity: 0.88 })); tea.position.y = 0.14 * s; g.add(tea);
  for (let i = 0; i < 3; i++) { const ic = box(0.07 * s, 0.07 * s, 0.07 * s, new THREE.MeshPhongMaterial({ color: '#f4fbff', transparent: true, opacity: 0.8 })); ic.position.set((i - 1) * 0.05 * s, 0.27 * s, (i % 2) * 0.03 * s); ic.rotation.set(i, i * 0.7, 0); g.add(ic); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.46 * s, 6), mat('#e84a5f')); st.position.set(0.04 * s, 0.32 * s, 0); st.rotation.z = -0.22; g.add(st);
  return g;
}

// ---------- 1段目・6段目・クイズ. 坂の上の家（x=0） ----------
const HOUSE = new THREE.Group(); qs.add(HOUSE);
const LIT = [];
{ const road = box(30, 0.04, 6, mat('#5a5c62')); road.position.set(0, 0.02, 5.2); HOUSE.add(road);
  const ground = box(30, 2.2, 12, mat('#b9b4a8')); ground.position.set(0, 1.1, -5.2); HOUSE.add(ground); // 道より一段高い敷地
  const wallL = box(5.6, 2.3, 0.4, mat('#c9c6be')); wallL.position.set(-3.6, 1.15, 0.95); HOUSE.add(wallL);
  const wallR = box(4.2, 2.3, 0.4, mat('#c9c6be')); wallR.position.set(3.9, 1.15, 0.95); HOUSE.add(wallR);
  const stoneR = box(1.6, 2.6, 2.6, mat('#a8a49a')); stoneR.position.set(6.6, 1.3, 0.2); HOUSE.add(stoneR);
  // タイルの階段（道から敷地へ）
  for (let i = 0; i < 7; i++) { const st = box(2.0, 0.32, 0.5, mat(i % 2 ? '#c99a62' : '#bf8f58')); st.position.set(0.8, 0.16 + i * 0.32, 1.9 - i * 0.48); HOUSE.add(st); const side = box(0.3, 0.6 + i * 0.32, 0.5, mat('#c9c6be')); side.position.set(-0.35, (0.6 + i * 0.32) / 2, 1.9 - i * 0.48); HOUSE.add(side); const side2 = side.clone(); side2.position.x = 1.95; HOUSE.add(side2); }
  // 門（格子の扉）
  const gate = box(1.4, 1.9, 0.08, mat('#3a3630')); gate.position.set(0.8, 3.1, -1.6); HOUSE.add(gate);
  for (let i = 0; i < 6; i++) { const b = box(0.06, 1.7, 0.1, mat('#8a7a5a')); b.position.set(0.25 + i * 0.22, 3.1, -1.55); HOUSE.add(b); }
  const post = box(0.5, 2.4, 0.5, mat('#d8d4ca')); post.position.set(-0.2, 3.4, -1.6); HOUSE.add(post);
  // 家本体（茶色の横じまの壁・3階建て・屋上の手すり・アンテナ）
  // 茶色の横じまの外壁（窓は数か所だけ。マンションに見えないように）
  const siding = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#8a6e5a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,28,20,.35)'; g.lineWidth = 3; for (let y = 8; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }); siding.repeat.set(3, 3);
  const body = new THREE.Mesh(new THREE.BoxGeometry(9, 6.6, 5), new THREE.MeshLambertMaterial({ map: siding })); body.position.set(-1.2, 2.2 + 3.3, -5.6); body.castShadow = true; HOUSE.add(body);
  const winM = new THREE.MeshLambertMaterial({ color: '#2e3a46', emissive: new THREE.Color('#ffd89a'), emissiveIntensity: 0 }); LIT.push(winM);
  for (const [x, y, w, h] of [[-4.2, 4.0, 1.6, 1.0], [-1.6, 4.0, 1.0, 1.2], [-4.2, 6.6, 1.0, 1.0], [-2.0, 6.6, 1.4, 1.0], [0.6, 7.0, 2.2, 1.2], [2.4, 4.6, 0.6, 1.4]]) { const wn = box(w, h, 0.06, winM); wn.position.set(x, y, -3.08); HOUSE.add(wn); const fr = box(w + 0.12, 0.08, 0.1, mat('#e8e6e0')); fr.position.set(x, y - h / 2 - 0.04, -3.06); HOUSE.add(fr); }
  const balc = box(4.4, 0.1, 1.0, mat('#d8d4ca')); balc.position.set(-3.2, 7.95, -2.6); HOUSE.add(balc);
  for (let i = 0; i < 12; i++) { const r = box(0.05, 0.7, 0.05, mat('#e8e6e0')); r.position.set(-5.3 + i * 0.38, 8.35, -2.1); HOUSE.add(r); }
  const brail = box(4.4, 0.06, 0.06, mat('#e8e6e0')); brail.position.set(-3.2, 8.7, -2.1); HOUSE.add(brail);
  const roofDeck = box(9.2, 0.2, 5.2, mat('#9a9690')); roofDeck.position.set(-1.2, 8.9, -5.6); HOUSE.add(roofDeck);
  for (let i = 0; i < 19; i++) { const r = box(0.06, 0.8, 0.06, mat('#e8e6e0')); r.position.set(-5.6 + i * 0.49, 9.4, -3.05); HOUSE.add(r); }
  const rail = box(9.2, 0.08, 0.08, mat('#e8e6e0')); rail.position.set(-1.2, 9.8, -3.05); HOUSE.add(rail);
  const pent = box(2.4, 1.8, 2.0, mat('#7a6250')); pent.position.set(1.8, 9.9, -6.4); HOUSE.add(pent);
  const ant = box(0.06, 2.2, 0.06, mat('#444')); ant.position.set(-0.4, 10.1, -6.6); HOUSE.add(ant);
  for (let i = 0; i < 4; i++) { const a = box(1.2 - i * 0.2, 0.04, 0.04, mat('#444')); a.position.set(-0.4, 10.6 + i * 0.35, -6.6); HOUSE.add(a); }
  const entry = box(1.6, 2.6, 0.1, new THREE.MeshBasicMaterial({ color: '#2a2622' })); entry.position.set(1.6, 3.5, -3.05); HOUSE.add(entry);
  // 右の木
  for (let i = 0; i < 4; i++) { const tr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + R() * 0.6, 0), mat(['#3f7a3a', '#4a8a42', '#356a32'][i % 3])); tr.position.set(5.6 + R() * 1.6, 3.6 + i * 1.1, -2.4 - R() * 2); HOUSE.add(tr); }
  const lamp = new THREE.PointLight(0xffd8a0, 0, 10, 1.4); lamp.position.set(0.8, 4.4, -0.6); HOUSE.add(lamp); HOUSE.userData.lamp = lamp; }
const sen = makePerson(SENPAI); qs.add(sen);
const kou = makePerson(KOUHAI); qs.add(kou);
const tHouse = tag('先輩の家', { size: 84, bg: '#e6b450', color: '#14161c' }); tHouse.position.set(-1.6, 7.0, -2.6); qs.add(tHouse);
const tKoko = tag('こ↑こ↓', { size: 120, w: 540, sx: 3.4, bg: '#e2483c' }); tKoko.position.set(-0.4, 5.2, 0.4); qs.add(tKoko);
const tYari = tag('やりますねぇ', { size: 92, w: 620, sx: 3.2, bg: '#14161c' }); tYari.position.set(1.8, 3.3, 4.2); qs.add(tYari);

// ---------- 1段目. ソファのインタビュー（x=122）。出演者には似せない（服の色・髪・体つきは別。顔もいつものブロック） ----------
const INTV = new THREE.Group(); INTV.position.set(122, 0, 0); qs.add(INTV);
{ const fl = box(8, 0.06, 6, mat('#b8b0a2')); fl.position.y = 0.03; INTV.add(fl);
  const wall = box(8, 4, 0.2, mat('#e9e8e4')); wall.position.set(0, 2, -1.9); INTV.add(wall);
  const blind = box(2.2, 2.2, 0.04, mat('#c9d6dc')); blind.position.set(-1.9, 2.4, -1.78); INTV.add(blind);
  for (let i = 0; i < 13; i++) { const sl = box(2.2, 0.035, 0.03, mat('#9fb0b8')); sl.position.set(-1.9, 1.35 + i * 0.17, -1.74); INTV.add(sl); }
  const sofa = box(2.6, 0.5, 0.95, mat('#7c8088')); sofa.position.set(0.2, 0.42, -0.9); INTV.add(sofa);
  const sb = box(2.6, 0.8, 0.28, mat('#6e727a')); sb.position.set(0.2, 0.95, -1.35); INTV.add(sb);
  for (const x of [-1.15, 1.55]) { const arm = box(0.3, 0.7, 0.95, mat('#6e727a')); arm.position.set(x, 0.55, -0.9); INTV.add(arm); }
 }
const GUEST = makePerson({ skin: '#e8b98f', hair: '#1d1a19', shirt: '#3f8f6b', pants: '#4a5a7a' }); GUEST.position.set(122.2, 0.12, -0.75); qs.add(GUEST);
const t24 = tag('24歳・学生', { size: 86, w: 520, bg: '#e6b450', color: '#14161c' }); t24.position.set(122.2, 2.35, -0.6); qs.add(t24);

// ---------- 2段目. 畳の部屋で3人（x=26） ----------
const TATAMI = new THREE.Group(); TATAMI.position.set(26, 0, 0); qs.add(TATAMI);
{ const ttex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#c9c48a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,80,40,.25)'; g.lineWidth = 2; for (let x = 0; x < w; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = '#4a5a3a'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); }); ttex.repeat.set(3, 2);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(9, 0.06, 7), new THREE.MeshLambertMaterial({ map: ttex })); fl.position.y = 0.03; TATAMI.add(fl);
  const wall = box(9, 3.4, 0.2, mat('#d8cdb4')); wall.position.set(0, 1.7, -2.6); TATAMI.add(wall);
  const shoji = box(2.4, 1.8, 0.05, mat('#f2ede0')); shoji.position.set(-2.0, 1.6, -2.48); TATAMI.add(shoji);
  for (let i = 1; i < 4; i++) { const v = box(0.04, 1.8, 0.06, mat('#8a6a4a')); v.position.set(-3.2 + i * 0.6, 1.6, -2.45); TATAMI.add(v); const hz = box(2.4, 0.04, 0.06, mat('#8a6a4a')); hz.position.set(-2.0, 0.7 + i * 0.45, -2.45); TATAMI.add(hz); }
  const table = box(1.6, 0.08, 1.0, mat('#7a5232')); table.position.set(0, 0.4, -0.4); TATAMI.add(table); for (const [x, z] of [[-0.7, -0.8], [0.7, -0.8], [-0.7, 0], [0.7, 0]]) { const lg = box(0.08, 0.36, 0.08, mat('#6a4628')); lg.position.set(x, 0.2, z); TATAMI.add(lg); }
  for (let i = 0; i < 3; i++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 10), mat('#e8e2d0')); cup.position.set(-0.5 + i * 0.5, 0.51, -0.4); TATAMI.add(cup); }
  const lampT = new THREE.PointLight(0xffe0b0, 0, 8, 1.3); lampT.position.set(0, 2.8, 0); TATAMI.add(lampT); TATAMI.userData.lamp = lampT; }
const SIT = [{ skin: '#e8b98f', hair: '#c9976f', shirt: '#2f4a7a', pants: '#3b3f4a', bald: true }, { skin: '#f1c9a5', hair: '#2c2421', shirt: '#4fa3d1', pants: '#8a7a5a' }, { skin: '#efcfae', hair: '#4a3426', shirt: '#e9e4da', pants: '#59606e' }]
  .map((o, i) => { const p = makePerson(o); p.position.set([24.9, 26.0, 27.1][i], -0.55, [-0.05, 0.55, -0.05][i]); p.rotation.y = [0.7, Math.PI, -0.7][i]; qs.add(p); return p; });
const tRamen = tag('うまいラーメン屋の屋台', { size: 66, w: 760, bg: '#e6b450', color: '#14161c' }); tRamen.position.set(26, 2.05, -0.9); qs.add(tRamen);

// ---------- 3段目. 家の中・アイスティー（x=50） ----------
const ROOM = new THREE.Group(); ROOM.position.set(50, 0, 0); qs.add(ROOM);
{ const fl = box(10, 0.06, 8, mat('#c9b08a')); fl.position.y = 0.03; ROOM.add(fl);
  const back = box(10, 4, 0.2, mat('#eae6dc')); back.position.set(0, 2, -2.6); ROOM.add(back);
  const win = box(2.6, 1.6, 0.05, new THREE.MeshBasicMaterial({ color: '#bfe2f6' })); win.position.set(-2.2, 2.2, -2.48); ROOM.add(win);
  for (let i = 0; i < 9; i++) { const sl = box(2.6, 0.04, 0.03, mat('#d8dde2')); sl.position.set(-2.2, 1.5 + i * 0.17, -2.44); ROOM.add(sl); } // ブラインド
  const sofa = box(2.8, 0.5, 0.9, mat('#6a7a8a')); sofa.position.set(1.6, 0.45, -1.6); ROOM.add(sofa);
  const sb = box(2.8, 0.7, 0.25, mat('#5e6e7e')); sb.position.set(1.6, 0.95, -2.0); ROOM.add(sb);
  const tbl = box(1.4, 0.42, 0.8, mat('#7a5a3a')); tbl.position.set(0.4, 0.21, -0.2); ROOM.add(tbl);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), mat('#4a8a42')); plant.position.set(-4, 1.1, -2.1); ROOM.add(plant); const pot = box(0.4, 0.6, 0.4, mat('#a86a4a')); pot.position.set(-4, 0.3, -2.1); ROOM.add(pot); }
const sen3 = makePerson(SENPAI); sen3.position.set(49.4, 0, 0.6); qs.add(sen3);
const kou3 = makePerson(KOUHAI); kou3.position.set(51.2, 0.18, -1.45); qs.add(kou3); // ソファに座る後輩
const TRAY = box(0.6, 0.03, 0.4, mat('#c9c6be')); qs.add(TRAY);
const TEA = icedTea(1.0); qs.add(TEA);
const TEA_BIG = icedTea(3.2); TEA_BIG.position.set(49.9, 0.42, 0.1); qs.add(TEA_BIG);
const tTea = tag('アイスティー', { size: 92, w: 620, bg: '#b5651d' }); tTea.position.set(50.4, 2.75, 1.2); qs.add(tTea);

// ---------- 4段目. 屋上（x=74） ----------
const ROOF = new THREE.Group(); ROOF.position.set(74, 0, 0); qs.add(ROOF);
{ const deck = box(12, 0.2, 9, mat('#a8a49c')); deck.position.y = 0.1; ROOF.add(deck);
  for (let i = 0; i < 25; i++) { const r = box(0.06, 0.9, 0.06, mat('#e8e6e0')); r.position.set(-6 + i * 0.5, 0.65, -3.8); ROOF.add(r); }
  const rail = box(12, 0.08, 0.08, mat('#e8e6e0')); rail.position.set(0, 1.1, -3.8); ROOF.add(rail);
  for (const x of [-1.0, 1.0]) { const ch = box(0.8, 0.12, 2.0, mat('#f2efe8')); ch.position.set(x, 0.45, -0.6); ROOF.add(ch); const bk = box(0.8, 0.9, 0.12, mat('#f2efe8')); bk.position.set(x, 0.75, -1.6); bk.rotation.x = -0.5; ROOF.add(bk); for (const z of [-1.4, 0.2]) { const lg = box(0.08, 0.35, 0.08, mat('#c9c6be')); lg.position.set(x, 0.27, z); ROOF.add(lg); } }
  const towel = box(0.7, 0.02, 1.4, mat('#e6b450')); towel.position.set(1.0, 0.52, -0.5); ROOF.add(towel);
  for (let i = 0; i < 6; i++) { const b = box(3, 3 + R() * 6, 3, mat(['#d9d4c8', '#c8c2b4', '#e2ddd2'][i % 3])); b.position.set(-12 + i * 5, -2, -14); ROOF.add(b); } }
const SUN = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 16), new THREE.MeshBasicMaterial({ color: '#fff3b0', fog: false })); SUN.position.set(80, 13, -20); qs.add(SUN);
const sen4 = makePerson(SENPAI); sen4.position.set(73.4, 0.2, 1.4); qs.add(sen4);
const kou4 = makePerson(KOUHAI); kou4.position.set(74.8, 0.2, 1.4); qs.add(kou4);
const tRoof = tag('屋上', { size: 100, bg: '#e2483c' }); tRoof.position.set(74, 3.5, -0.6); qs.add(tRoof);

// ---------- 5段目. 2001年→今（x=98）：ビデオテープと、名言が流れるスマホ ----------
const ERA = new THREE.Group(); ERA.position.set(98, 0, 0); qs.add(ERA);
const TAPE = new THREE.Group(); { const c = box(1.9, 1.05, 0.25, mat('#1c1c20')); TAPE.add(c); const lb = box(1.3, 0.42, 0.02, mat('#f2efe8')); lb.position.set(0, 0.18, 0.14); TAPE.add(lb); for (const x of [-0.42, 0.42]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), mat('#e8e6e0')); w.rotation.x = Math.PI / 2; w.position.set(x, -0.2, 0.14); TAPE.add(w); } } TAPE.position.set(98, 2.4, 0); qs.add(TAPE);
const PHONES = [];
const COMMENTS = ['草', 'やりますねぇ', 'こ↑こ↓', '名言すぎる', '25年経っても', 'アイスティー'];
function phoneTex(i) { return canvasTex(300, 560, (g, w, h) => { g.fillStyle = '#14161c'; g.beginPath(); g.roundRect(0, 0, w, h, 40); g.fill(); g.fillStyle = '#f2f4f7'; g.beginPath(); g.roundRect(16, 40, w - 32, h - 80, 20); g.fill(); for (let k = 0; k < 4; k++) { const t = COMMENTS[(i + k) % COMMENTS.length]; g.fillStyle = k % 2 ? '#dde6f2' : '#ffe8b8'; g.beginPath(); g.roundRect(32, 70 + k * 108, w - 64, 84, 18); g.fill(); g.fillStyle = '#14161c'; g.font = '900 34px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, 112 + k * 108); } }); }
for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.87), new THREE.MeshBasicMaterial({ map: phoneTex(i), transparent: true })); p.userData.a = (i - 2) * 1.25; qs.add(p); PHONES.push(p); }
const tYear = tag('2001年', { size: 110, w: 440, bg: '#14161c' }); tYear.position.set(98, 4.1, 0); qs.add(tYear);
const tNow = tag('25年たっても語り継がれる', { size: 62, w: 820, bg: '#e6b450', color: '#14161c' }); tNow.position.set(98, 4.4, 0.4); qs.add(tNow);

// ---------- shots ----------
const ALLTAG = [tHouse, tKoko, tYari, tRamen, tTea, tRoof, tYear, tNow, t24];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); HOUSE.userData.lamp.intensity = 0; LIT.forEach(m => m.emissiveIntensity = 0); TATAMI.userData.lamp.intensity = 0; PHONES.forEach(p => p.visible = false); TAPE.visible = false; TRAY.visible = false; TEA.visible = false; TEA_BIG.visible = false; SUN.visible = false; sen.visible = true; kou.visible = true;
  for (const p of [sen, kou, sen3, kou3, sen4, kou4, GUEST, ...SIT]) { p.userData.head.rotation.set(0, 0, 0); p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); } }
function walk(p, ph, amp = 0.45) { p.userData.legs[0].rotation.x = Math.sin(ph) * amp; p.userData.legs[1].rotation.x = -Math.sin(ph) * amp; p.userData.arms[0].rotation.x = -Math.sin(ph) * amp * 0.7; p.userData.arms[1].rotation.x = Math.sin(ph) * amp * 0.7; }
// 階段の高さ（z から）
const stairY = (z) => clamp((1.9 - z) / 0.48, 0, 6.5) * 0.32 + 0.0;

function shotInterview(t) { // 1段目 0〜9：ソファに座った若い男のインタビュー。24歳、学生です（0秒目から座っている）
  base(); S.aim(122, 0); lift(150);
  S.hemi.intensity = 1.15; S.key.intensity = 1.0;
  GUEST.rotation.y = 0; GUEST.userData.legs.forEach(l => l.rotation.x = -1.45);
  GUEST.userData.arms[0].rotation.x = -0.5; GUEST.userData.arms[1].rotation.x = -0.5;
  GUEST.userData.head.rotation.x = Math.sin(t * 2.4) * 0.05; GUEST.userData.head.rotation.y = Math.sin(t * 0.7) * 0.12;
  t24.userData.pop((t - 1.6) / 0.35);
  const u = ease(t / 9);
  look(lerp(122.9, 122.5, u), lerp(1.7, 1.6, u), lerp(5.2, 4.2, u), 122.2, 1.2, -0.8, 50);
  return qs;
}
function shotTatami(t) { // 2段目 9〜17：畳の部屋に座りこんだ3人。この辺にぃ、うまいラーメン屋の屋台、来てるらしいっすよ
  base(); S.aim(26, 0); lift(170);
  S.hemi.intensity = 0.95; S.key.intensity = 0.7; TATAMI.userData.lamp.intensity = 4;
  SIT.forEach((p, i) => { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.userData.arms.forEach(a => a.rotation.x = -0.6); p.userData.head.rotation.y = Math.sin(t * 1.1 + i * 2) * 0.25; });
  const talk = SIT[1]; if (t > 3.4) { talk.userData.arms[1].rotation.x = -1.3; talk.userData.arms[1].rotation.z = 0.4; talk.userData.head.rotation.y = 0.3; SIT[0].userData.head.rotation.y = 0.5; SIT[2].userData.head.rotation.y = -0.5; }
  tRamen.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(26.6, 26.2, u), lerp(2.8, 2.5, u), lerp(5.8, 5.2, u), 26, 0.6, -0.2, 54);
  return qs;
}
function shotTea(t) { // 3段目 17〜25：家に着くと、先輩がグラスを差し出す
  base(); S.aim(50, 0); lift(180);
  S.hemi.intensity = 1.1; S.key.intensity = 1.1;
  kou3.rotation.y = 0; kou3.userData.legs.forEach(l => l.rotation.x = -1.45); // 座る
  const k = ease(clamp((t - 0.4) / 3.2));
  sen3.position.set(lerp(48.6, 50.2, k), 0, lerp(1.0, -0.4, k)); sen3.rotation.y = lerp(0.6, 2.4, k); if (k < 1) walk(sen3, t * 6, 0.35);
  sen3.userData.arms.forEach(a => { a.rotation.x = -1.2; });
  const hand = new THREE.Vector3(0, 0.95, 0.45).applyAxisAngle(new THREE.Vector3(0, 1, 0), sen3.rotation.y).add(sen3.position);
  TRAY.visible = true; TRAY.position.copy(hand); TRAY.rotation.y = sen3.rotation.y;
  TEA.visible = true; TEA.position.set(hand.x, hand.y + 0.02, hand.z);
  kou3.userData.head.rotation.y = 0.35;
  if (t > 4.2) { TEA_BIG.visible = true; const s = easeOut(clamp((t - 4.2) / 0.5)); TEA_BIG.scale.setScalar(s * 0.75); TEA_BIG.rotation.y = t * 0.6; tTea.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 8);
  look(lerp(52.4, 50.6, u), lerp(2.4, 2.2, u), lerp(6.4, 6.8, u), 50.4, 1.2, -0.6, 54);
  return qs;
}
function shotRoof(t) { // 4段目 25〜33：まず、うちさぁ、屋上あんだけど、焼いてかない？
  base(); S.aim(74, 0); lift(120);
  S.scene.background.set('#6fb4ea'); S.scene.fog.color.copy(S.scene.background); S.key.intensity = 1.9;
  SUN.visible = true;
  sen4.rotation.y = 0.45; kou4.rotation.y = -0.45;
  sen4.userData.arms[0].rotation.x = t < 4 ? -1.5 : 0; sen4.userData.arms[0].rotation.z = t < 4 ? -0.4 : 0; // 空を指す
  if (t > 4.4) { kou4.userData.head.rotation.x = Math.sin((t - 4.4) * 3) * 0.12; } // ゆるくうなずく
  tRoof.userData.pop((t - 1.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(75.6, 74.4, u), lerp(1.8, 2.6, u), lerp(7.4, 8.4, u), 74.4, lerp(2.4, 3.6, u), -2.0, 56);
  return qs;
}
function shotEra(t) { // 5段目 33〜42：2001年の夏の作品。25年たった今も、ネットで語り継がれる
  base(); S.aim(98, 0); lift(200);
  S.hemi.intensity = 0.5; S.key.intensity = 0.4; S.darken(0.8, '#121624');
  if (t < 4.4) { TAPE.visible = true; TAPE.position.set(98, 2.4 + Math.sin(t * 2) * 0.05, 0); TAPE.rotation.y = Math.sin(t * 0.8) * 0.5; tYear.userData.pop((t - 0.6) / 0.35); }
  else { PHONES.forEach((p, i) => { const k = easeOut(clamp((t - 4.4 - i * 0.18) / 0.4)); p.visible = k > 0; p.position.set(98 + p.userData.a, 2.2 + (i % 2) * 0.25 + (1 - k) * -1.2, -0.2 - Math.abs(p.userData.a) * 0.3); p.rotation.y = -p.userData.a * 0.18; p.scale.setScalar(k); }); tNow.userData.pop((t - 5.2) / 0.35); }
  const u = ease(t / 9);
  look(98, lerp(2.4, 2.6, u), lerp(6.4, 7.4, u), 98, 2.6, 0, 54);
  return qs;
}
function shotKoko(t) { // 6段目 42〜49（決め手）：家を指さして こ↑こ↓。名言の数は数えきれない。やりますねぇ
  base(); S.aim(0, -1); lift(150);
  S.scene.background.set('#f0a86a'); S.scene.fog.color.copy(S.scene.background); S.key.intensity = 1.2; S.hemi.intensity = 1.0;
  sen.position.set(0.0, 0.02, 2.9); sen.rotation.y = Math.PI * 0.85; kou.position.set(1.4, 0.02, 3.2); kou.rotation.y = Math.PI * 1.1;
  sen.userData.arms[1].rotation.x = -2.2; sen.userData.arms[1].rotation.z = -0.2; // 家を指さす
  kou.userData.head.rotation.x = -0.35;
  tKoko.userData.pop((t - 0.6) / 0.3);
  if (t > 3.6) { kou.rotation.y = Math.PI * 0.35; kou.userData.arms[0].rotation.x = -0.6; tYari.userData.pop((t - 3.8) / 0.3); }
  const u = ease(t / 7);
  look(lerp(3.4, 2.8, u), lerp(2.6, 3.0, u), lerp(10.4, 11.2, u), 0.4, lerp(2.6, 3.2, u), -1.0, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品、わかった？（夏の夜の、坂の上の家）
  base(); S.aim(0, -1); lift(190);
  S.hemi.intensity = 0.35; S.key.intensity = 0.1; S.darken(0.85, '#0c1024');
  LIT.forEach(m => m.emissiveIntensity = 0.9); HOUSE.userData.lamp.intensity = 6;
  sen.visible = false; kou.visible = false;
  const k = ease(t / 7);
  look(lerp(2.0, 0.6, k), lerp(3.0, 4.2, k), lerp(11.0, 13.0, k), -0.6, 5.0, -4.0, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotInterview },
  { a: 9, b: 17, f: shotTatami },
  { a: 17, b: 25, f: shotTea },
  { a: 25, b: 33, f: shotRoof },
  { a: 33, b: 42, f: shotEra },
  { a: 42, b: 49, f: shotKoko },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [1.0, 4.6, '24歳、<br>学生です。'],
  [4.6, 9.0, 'ソファで始まる、<br>あるインタビュー。'],
  [9.2, 12.6, '畳の部屋に、<br>座りこんだ3人。'],
  [12.6, 15.0, 'この辺にぃ、<br>うまいラーメン屋の屋台、'],
  [15.0, 17.0, '来てるらしいっすよ。'],
  [17.2, 21.0, '後輩を家に招いた先輩が、<br>グラスを差し出す。'],
  [21.0, 25.0, 'アイスティーしか<br>なかったんだけど、いいかな？'],
  [25.2, 29.4, 'まず、うちさぁ、屋上<br>あんだけど、焼いてかない？'],
  [29.4, 33.0, 'あぁ〜、<br>いいっすね〜。'],
  [33.2, 37.4, '2001年の夏に<br>出た作品。'],
  [37.4, 41.8, '25年たった今も、<br>ネットで語り継がれる。'],
  [42.2, 45.6, '坂の上の家を指さして、<br>こ↑こ↓。'],
  [45.6, 49.0, '名言の数は、数えきれない。<br>やりますねぇ。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>真夏の夜の淫夢。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>好きな名言も教えて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotEra,
  meta: {
    id: 'q060', v2: true, answer: '真夏の夜の淫夢',
    title: 'この作品名はなに？',
    titleHtml: 'この作品名は<br>なに？',
    mood: 'hopeful', seed: 1060,
    hits: [5.6, 21.0, 42.6, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 21.0, 25.4, 42.6, 45.8, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.2, 'poof'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [42.7, 'poof'], [45.9, 'poof'], [49.0, 'meter', 0.5]],
    narr: { 'こ↑こ↓': 'ここ', '淫夢': 'いんむ', '真夏の夜': 'まなつのよる', '屋台': 'やたい', '屋上': 'おくじょう', '焼いてかない': 'やいてかない', '先輩': 'せんぱい', '後輩': 'こうはい', '語り継がれる': 'かたりつがれる', 'この辺にぃ': 'このへんにぃ', '2001年': 'にせんいちねん', '25年': 'にじゅうごねん', '24歳': 'にじゅうよんさい', '畳': 'たたみ', '3人': 'さんにん', '招かれた': 'まねかれた', '指さして': 'ゆびさして', '作品名': 'さくひんめい' },
    caption: 'この作品名、わかる？\n24歳、学生です。ソファで始まる、あるインタビュー。畳の部屋では3人が、うまいラーメン屋の屋台のうわさ。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。',
    hashtags: ['タイトル当てクイズ', 'ネットミーム', '名言', '伝説', '2001年'],
  },
});
applyQuizCards({ answer: '真夏の夜の<br>淫夢', info: '2001年｜ビデオ作品', answerSize: 120 });
// この回は観るのをすすめない（配信もない）。答えのカードの呼びかけを名言に変える
{ const end = document.getElementById('end');
  end.querySelector('.ask').innerHTML = '何秒でわかった？<br>どこでわかった？<small>好きな名言もコメントで教えて</small>';
  end.querySelector('.nx').innerHTML = 'わかった人は<small>友だちにも出してみて</small>';
  end.querySelector('.src').innerHTML = '作品の映像・画像は使っていません<br>名言をもとにしたオマージュです'; }
