import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #064 ゴジラ-1.0（映画・日本・2023年・東宝。Netflix・Prime Video・U-NEXT・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/gozira-1-0 で2026/11/10確認。Filmarks 3.9・レビュー144,717件 filmarks.com/movies/106496）
//   Netflix 日本の週間トップ10（top10.netflix.com/japan、10/26〜11/1）の映画7位に入っている（2週目）
// 確かめた事実（Filmarks の作品紹介・ja.wikipedia.org/wiki/ゴジラ-1.0。2026/11/10）：
//   ・1945年、特攻へ向かう途中で機体の故障を偽って島の守備隊基地に降りた主人公は、海岸に大量の深海魚の死骸が浮かぶのを見る。その夜、島の伝説の生き物が基地を襲う
//   ・同年冬、東京へ帰った主人公は空襲で両親を亡くしたと知る。闇市で、空襲で親を失った女性と、彼女が見知らぬ人から託された赤ん坊に出会い、共同生活を始める
//   ・戦争と島での出来事のトラウマを抱えている。1946年、戦時中に残された機雷を撤去する仕事に就き、小さな船の仲間と出会う
//   ・1947年、巨大化した生き物が日本へ向かい、東京に上陸する。占領下で軍を持たない日本は、民間人だけで立ち向かう
//   ・タイトルの -1.0 は「戦後、無（ゼロ）になった日本へ追い打ちをかけるように現れたゴジラがこの国を負（マイナス）に叩き落とす」という意味
//   ・第96回アカデミー賞で、邦画・アジア映画史上初の視覚効果賞を受賞
// 構成（ヒント6段）：1 海に深海の魚が大量に浮かぶ、その夜島の基地に何かが来た → 2 戦争から生きて帰った男、心に深い傷
//   → 3 焼け野原、闇市で出会った女性と赤ちゃんと3人の暮らし → 4 小さな木の船で海に残った機雷を片付ける仕事、船の仲間
//   → 5 戦後まもない日本・1947年の東京、巨大な生き物が上陸、軍のない国は民間人だけで → 6 決め手：ゼロになった日本をマイナスに、アカデミー賞の視覚効果賞
// 生き物の姿・形（背びれ・顔・しっぽ・熱線）は一切出さない（足あとと影と波だけ）。作品名・人物名・地名・船の名前・戦闘機の形は出さない。
// 有名な場面の構図（船を追う場面・街を見下ろす場面）はなぞらない。結末や作戦の中身は言わない。俳優・ロゴ・ポスターは使わない。人は汎用の3D

const S = quizStage({ bg: '#0e1622', floor: '#18202a', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(6464);

const HERO = { skin: '#e8c4a0', hair: '#1a1614', shirt: '#5a5a48', pants: '#3e3e34' };
const WOMAN = { skin: '#f1cba8', hair: '#1d1a19', shirt: '#8a6a5a', pants: '#4a3e3a', long: true, skirt: true };
const CREW = (i) => ({ skin: ['#e0b48c', '#d9a57c', '#eccaa8'][i % 3], hair: ['#2a2420', '#5a5a5a', '#1a1614'][i % 3], shirt: ['#3e4a5a', '#5a4a3a', '#4a5a4a'][i % 3], pants: '#2e3036' });

// 海（頂点を揺らす）
function makeSea(w, d, color, seg = 40) {
  const g = new THREE.PlaneGeometry(w, d, seg, seg); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color, shininess: 60, flatShading: true }));
  m.userData.base = g.attributes.position.array.slice();
  m.userData.wave = (t, amp = 0.12) => { const a = g.attributes.position; for (let i = 0; i < a.count; i++) { const x = m.userData.base[i * 3], z = m.userData.base[i * 3 + 2]; a.array[i * 3 + 1] = Math.sin(x * 0.7 + t * 1.3) * amp + Math.cos(z * 0.9 + t * 1.1) * amp * 0.7; } a.needsUpdate = true; g.computeVertexNormals(); };
  return m;
}

// ---------- 1段目. 夜の小さな島の基地（x=0）。浜の先の海に、白い深海魚が大量に浮かぶ ----------
const SEA1 = makeSea(60, 40, '#1a3048'); SEA1.position.set(0, 0.05, -18); qs.add(SEA1);
{ const sand = box(40, 0.3, 8, mat('#8a7e64')); sand.position.set(0, 0.0, 2); qs.add(sand);
  const pad = box(18, 0.06, 4, mat('#4a4a42')); pad.position.set(-4, 0.18, 5.5); qs.add(pad);
  // 格納庫（かまぼこ型）
  for (const x of [-11, 9]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 6, 20, 1, false, 0, Math.PI), mat('#5a5e52')); h.rotation.z = Math.PI / 2; h.rotation.y = Math.PI / 2; h.position.set(x, 0.1, 7); qs.add(h); }
  // 見張り台
  const tw = box(0.25, 5, 0.25, mat('#3a3428')); for (const dx of [-0.8, 0.8]) for (const dz of [-0.8, 0.8]) { const p = tw.clone(); p.position.set(6 + dx, 2.5, 3 + dz); qs.add(p); }
  const deck = box(2.2, 0.2, 2.2, mat('#4a4030')); deck.position.set(6, 5, 3); qs.add(deck); }
const LAMP1 = new THREE.SpotLight(0xfff2c8, 0, 40, 0.22, 0.5, 0.6); LAMP1.position.set(6, 5.4, 3); qs.add(LAMP1); qs.add(LAMP1.target);
const FISH = [];
{ const fm = new THREE.MeshLambertMaterial({ color: '#e8ecdc', emissive: '#6a7266' });
  for (let i = 0; i < 90; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), fm); f.scale.set(2.2, 0.5, 0.8); const x = (R() - 0.5) * 18, z = -1.5 - R() * 10; f.position.set(x, 0.12, z); f.rotation.y = R() * Math.PI; f.userData.p = R() * 6; qs.add(f); FISH.push(f); } }
const guard1 = makePerson({ ...CREW(0), shirt: '#4a5040' }); guard1.position.set(-1.8, 0.15, 3.0); guard1.rotation.y = Math.PI; qs.add(guard1);
const hero1 = makePerson(HERO); hero1.position.set(2.0, 0.15, 3.4); hero1.rotation.y = Math.PI; qs.add(hero1);
// 沖から近づく、大きな波の盛り上がり（姿は見せない）
const SWELL = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhongMaterial({ color: '#16283c', shininess: 40, flatShading: true })); SWELL.scale.set(1.6, 0.5, 1); qs.add(SWELL);
const tFish = tag('深海の魚が、大量に', { size: 60, w: 620, bg: '#14161c', sx: 2.6 }); tFish.position.set(0.6, 2.9, 2.2); qs.add(tFish);
const tNight = tag('その夜、何かが来た', { size: 60, w: 620, bg: '#e2483c', sx: 2.6 }); tNight.position.set(0.6, 2.9, 2.2); qs.add(tNight);

// ---------- 2段目. 夕暮れの焼けあと（x=40）。ひとり立つ男 ----------
const AX = 40;
{ const gr = box(24, 0.06, 20, mat('#3a3430')); gr.position.set(AX, 0.03, -4); qs.add(gr);
  for (let i = 0; i < 14; i++) { const h = 0.6 + R() * 2.2; const p = box(0.18, h, 0.18, mat('#1e1a18')); p.position.set(AX - 9 + R() * 18, h / 2, -2 - R() * 12); p.rotation.z = (R() - 0.5) * 0.4; qs.add(p); }
  for (let i = 0; i < 18; i++) { const r = box(0.5 + R(), 0.2 + R() * 0.3, 0.4 + R() * 0.6, mat(['#4a4038', '#2a2622', '#5a4e44'][i % 3])); r.position.set(AX - 8 + R() * 16, 0.12, -1 - R() * 10); r.rotation.y = R() * 3; qs.add(r); }
  const chim = box(0.7, 6, 0.7, mat('#4a3a32')); chim.position.set(AX + 5, 3, -10); qs.add(chim); }
const hero2 = makePerson(HERO); hero2.position.set(AX, 0, 0); qs.add(hero2);
const tBack = tag('生きて帰った', { size: 72, w: 500, bg: '#14161c', sx: 2.1 }); tBack.position.set(AX, 2.6, 0); qs.add(tBack);
const tScar = tag('心に、深い傷', { size: 72, w: 500, bg: '#e2483c', sx: 2.1 }); tScar.position.set(AX, 2.6, 0); qs.add(tScar);

// ---------- 3段目. 焼け野原のバラック（x=80）。女性と赤ちゃんと、3人の暮らし ----------
const BX = 80;
{ const gr = box(24, 0.06, 20, mat('#4a4238')); gr.position.set(BX, 0.03, -4); qs.add(gr);
  const wallM = mat('#6a5a46'), roofM = mat('#4a4a4e');
  const back = box(4.4, 2.4, 0.12, wallM); back.position.set(BX, 1.2, -2.4); qs.add(back);
  for (const s of [-1, 1]) { const sd = box(0.12, 2.4, 2.6, wallM); sd.position.set(BX + s * 2.2, 1.2, -1.1); qs.add(sd); }
  const roof = box(4.8, 0.08, 3.2, roofM); roof.position.set(BX, 2.5, -1.1); roof.rotation.x = 0.12; qs.add(roof);
  for (let i = 0; i < 5; i++) { const pl = box(0.9, 0.04, 0.5, mat(['#5a5a5e', '#6a5a46', '#3a3a3e'][i % 3])); pl.position.set(BX - 1.8 + i * 0.9, 2.56, -1.1 + (i % 2) * 0.2); qs.add(pl); }
  const tbl = box(1.0, 0.36, 0.6, mat('#5a4430')); tbl.position.set(BX, 0.18, -1.0); qs.add(tbl);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.2, 14), mat('#3a3a3a')); pot.position.set(BX, 0.46, -1.0); qs.add(pot);
  for (let i = 0; i < 8; i++) { const h = 1 + R() * 2; const sh = box(1.8, h, 1.4, mat(['#5a4c3e', '#4a4440', '#6a5a4a'][i % 3])); sh.position.set(BX - 10 + (i % 4) * 2.6 + (i > 3 ? 13 : 0), h / 2, -6 - R() * 4); qs.add(sh); } }
const hero3 = makePerson(HERO); hero3.position.set(BX - 0.9, 0, -0.6); qs.add(hero3);
const woman3 = makePerson(WOMAN); woman3.position.set(BX + 0.9, 0, -0.6); qs.add(woman3);
const BABY = new THREE.Group(); { const cloth = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat('#e8e0d0')); cloth.scale.set(1, 0.8, 1.4); BABY.add(cloth); const fc = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat('#f4d0b0')); fc.position.set(0, 0.08, 0.2); BABY.add(fc); } qs.add(BABY);
const tAsh = tag('焼け野原', { size: 80, w: 420, bg: '#14161c', sx: 2.4 }); tAsh.position.set(BX, 3.3, 1.5); qs.add(tAsh);
const tThree = tag('3人の暮らし', { size: 76, w: 480, bg: '#e6b450', color: '#14161c', sx: 2.0 }); tThree.position.set(BX, 2.45, 0.2); qs.add(tThree);

// ---------- 4段目. 灰色の海の小さな木の船（x=120）。引き上げた機雷と船の仲間 ----------
const CX = 120;
const SEA4 = makeSea(60, 50, '#4a5a66'); SEA4.position.set(CX, 0.05, -10); qs.add(SEA4);
const BOAT = new THREE.Group(); BOAT.position.set(CX, 0, -1.5); qs.add(BOAT);
{ const wood = mat('#7a5a3a');
  const hull = box(6.4, 0.9, 2.2, wood); hull.position.y = 0.35; BOAT.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.6, 4), wood); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.scale.set(1, 1, 0.72); bow.position.set(4.0, 0.35, 0); BOAT.add(bow);
  const deck = box(6.2, 0.06, 2.0, mat('#a08060')); deck.position.y = 0.82; BOAT.add(deck);
  const cab = box(1.6, 1.2, 1.4, mat('#d8d0c0')); cab.position.set(-1.6, 1.45, 0); BOAT.add(cab);
  const cw = box(1.2, 0.3, 0.02, mat('#2a3a48')); cw.position.set(-1.6, 1.6, 0.71); BOAT.add(cw);
  const mast = box(0.1, 2.6, 0.1, mat('#5a4a3a')); mast.position.set(0.4, 2.1, 0); BOAT.add(mast); }
const MINES = [];
{ const mm = new THREE.MeshPhongMaterial({ color: '#2a2e30', shininess: 50 }), sm = mat('#1a1c1e');
  for (let i = 0; i < 2; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), mm); g.add(b); for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.22, 6), sm); const a = k * Math.PI / 4; sp.position.set(Math.cos(a) * 0.46, Math.sin(a) * 0.46 * (k % 2 ? 0.4 : 1), Math.sin(a) * 0.3); sp.lookAt(0, 0, 0); sp.rotateX(Math.PI / 2); g.add(sp); } g.position.set(1.4 + i * 1.1, 1.3, 0); BOAT.add(g); MINES.push(g); }
  const fl = box(0.1, 1, 0.1, mat('#3a3a3a')); fl.position.set(-3.6, 0.5, -4); qs.add(fl); }
const CREWS = []; for (let i = 0; i < 3; i++) { const p = makePerson(CREW(i)); p.position.set(-0.3 + i * 0.9 - 2.2 + 1.6 * (i === 2), 0.85, 0.3 - (i % 2) * 0.5); BOAT.add(p); CREWS.push(p); }
const hero4 = makePerson(HERO); hero4.position.set(1.0, 0.85, 0.6); BOAT.add(hero4);
const tMine = tag('海に残った機雷', { size: 64, w: 560, bg: '#14161c', sx: 3.0 }); tMine.position.set(CX + 0.1, 3.4, 1.0); qs.add(tMine);
const tCrew = tag('小さな船の仲間', { size: 64, w: 560, bg: '#3a7ad8', sx: 3.0 }); tCrew.position.set(CX + 0.1, 3.4, 1.0); qs.add(tCrew);

// ---------- 5段目. 夜の木造の街（x=160）。通りの真ん中に巨大な足あと、大きな影が横切る ----------
const DX = 160;
{ const gr = box(30, 0.06, 30, mat('#5a5048')); gr.position.set(DX, 0.03, -8); qs.add(gr);
  for (let i = 0; i < 16; i++) { const left = i % 2 === 0; const h = 2 + R() * 2.2, w = 2 + R() * 1.2; const hs = box(w, h, 2.4, mat(['#4a3e32', '#5a4a3a', '#3e3630'][i % 3])); hs.position.set(DX + (left ? -4.6 : 4.6) + (R() - 0.5) * 0.4, h / 2, 2 - Math.floor(i / 2) * 3.0); qs.add(hs);
    const rf = box(w + 0.3, 0.16, 2.8, mat('#2a2a30')); rf.position.set(hs.position.x, h + 0.08, hs.position.z); qs.add(rf);
    if (R() < 0.6) { const wn = box(0.6, 0.5, 0.05, new THREE.MeshBasicMaterial({ color: '#ffcc80' })); wn.position.set(hs.position.x + (left ? 1.05 : -1.05) * (w / 2.1), h * 0.6, hs.position.z + 0.2); wn.rotation.y = Math.PI / 2; qs.add(wn); } } }
// 足あと（3本指のくぼみ。地面に暗い形）
const PRINT = new THREE.Group(); PRINT.position.set(DX, 0.07, -5); qs.add(PRINT);
{ const pm = new THREE.MeshBasicMaterial({ color: '#0c0a08' });
  const heel = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), pm); heel.rotation.x = -Math.PI / 2; heel.scale.set(1, 1.3, 1); PRINT.add(heel);
  for (const [x, z, r] of [[-1.2, -2.2, 0.35], [0, -2.7, 0], [1.2, -2.2, -0.35]]) { const toe = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), pm); toe.rotation.x = -Math.PI / 2; toe.scale.set(1, 1.8, 1); toe.position.set(x, 0.001, z); toe.rotation.z = r; PRINT.add(toe); }
  for (let i = 0; i < 14; i++) { const d = box(0.3 + R() * 0.4, 0.2, 0.3 + R() * 0.4, mat('#3a3028')); const a = R() * Math.PI * 2; d.position.set(Math.cos(a) * (1.8 + R() * 1.2), 0.05, Math.sin(a) * (2 + R()) - 0.8); d.rotation.y = R() * 3; PRINT.add(d); } }
const SHADOW = new THREE.Mesh(new THREE.PlaneGeometry(14, 30), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.0, depthWrite: false })); SHADOW.rotation.x = -Math.PI / 2; SHADOW.position.set(DX, 4.6, -6); qs.add(SHADOW);
const RUN5 = []; for (let i = 0; i < 4; i++) { const p = makePerson(CREW(i + 1)); p.position.set(DX - 1.2 + i * 0.8, 0, 3 + (i % 2) * 0.6); qs.add(p); RUN5.push(p); }
const WARN = new THREE.PointLight(0xff3a2a, 0, 20, 1.2); WARN.position.set(DX, 4, 0); qs.add(WARN);
const tJP = tag('戦後まもない日本', { size: 64, w: 600, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tJP.position.set(DX, 3.6, 0.5); qs.add(tJP);
const tLand = tag('巨大な生き物が上陸', { size: 60, w: 640, bg: '#e2483c', sx: 3.1 }); tLand.position.set(DX, 3.6, 0.5); qs.add(tLand);

// ---------- 6段目. 暗いステージ（x=200）。0 から マイナスへ落ちる数字と、金のトロフィー ----------
const EX = 200;
{ const st = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.4, 40), mat('#1e2028')); st.position.set(EX, 0.2, -1); qs.add(st);
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: '#0c0e14' })); bk.position.set(EX, 5, -6); qs.add(bk); }
const NUM = (s, c) => canvasTex(512, 300, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = c; g.font = '900 230px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, w / 2, h / 2 + 10); });
const N0 = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.1), new THREE.MeshBasicMaterial({ map: NUM('0', '#ffffff'), transparent: true, depthWrite: false })); N0.position.set(EX - 2.0, 3.6, -1.5); qs.add(N0);
const NM = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.36), new THREE.MeshBasicMaterial({ color: '#e2483c', transparent: true, depthWrite: false })); NM.position.set(EX + 2.0, 3.6, -1.5); qs.add(NM);
const ARROW6 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 3), new THREE.MeshBasicMaterial({ color: '#e6b450' })); ARROW6.rotation.z = -Math.PI / 2; ARROW6.scale.setScalar(1.3); ARROW6.position.set(EX, 3.6, -1.5); qs.add(ARROW6);
const TROPHY = new THREE.Group(); TROPHY.position.set(EX, 0.4, -1); qs.add(TROPHY);
{ const gm = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.25, emissive: '#4a3208' });
  const base = box(0.9, 0.35, 0.9, mat('#1a1a1a')); base.position.y = 0.18; TROPHY.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.7, 16), gm); stem.position.y = 0.7; TROPHY.add(stem);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.2, 0.8, 24, 1, true), gm); cup.position.y = 1.45; TROPHY.add(cup);
  for (const s of [-1, 1]) { const hd = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16, Math.PI), gm); hd.position.set(s * 0.58, 1.5, 0); hd.rotation.z = s * -Math.PI / 2; TROPHY.add(hd); }
  const sl = new THREE.SpotLight(0xffe0a0, 40, 12, 0.5, 0.5, 1); sl.position.set(EX, 6, 2); sl.target = TROPHY; qs.add(sl); TROPHY.userData.light = sl; }
const tZero = tag('ゼロから、マイナスへ', { size: 60, w: 640, bg: '#14161c', sx: 3.6 }); tZero.position.set(EX, 5.3, -1.5); qs.add(tZero);
const tVFX = tag('アカデミー賞 視覚効果賞', { size: 56, w: 720, bg: '#e6b450', color: '#14161c', sx: 3.4 }); tVFX.position.set(EX, 5.3, -1.5); qs.add(tVFX);

// ---------- shots ----------
const ALL = [tFish, tNight, tBack, tScar, tAsh, tThree, tMine, tCrew, tJP, tLand, tZero, tVFX];
function base() { S.reset(); ALL.forEach(x => x.visible = false); LAMP1.intensity = 0; WARN.intensity = 0; TROPHY.userData.light.intensity = 0; }

function shotIsland(t, quiz = 0) { // 1段目 0〜9：海に深海の魚が大量に浮かぶ。その夜、何かが来た（0秒目がサムネ。魚はもう浮いている）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.75; S.key.intensity = 0.5; S.darken(0.45, '#04060c');
  SEA1.userData.wave(t, 0.1);
  FISH.forEach(f => { f.position.y = 0.14 + Math.sin(t * 1.4 + f.userData.p) * 0.06; });
  LAMP1.intensity = 120; const sw = Math.sin(t * 0.6) * 6; LAMP1.target.position.set(sw, 0, -8);
  const k = clamp((t - 4.4) / 4.0); SWELL.position.set(-2 + k * 1.5, -0.6 + k * 0.5, -24 + k * 8); SWELL.visible = t > 4.0 || quiz;
  if (t > 5.0 || quiz) { hero1.userData.head.rotation.x = -0.1; guard1.rotation.y = Math.PI + 0.3; }
  if (!quiz) { tFish.userData.pop((t - 0.0) / 0.01 + 1); if (t > 4.4) tFish.visible = false; tNight.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.8, 0.3, u), lerp(4.2, 3.8, u), lerp(9.6, 8.8, u), 0, 0.2, -5, 56);
  return qs;
}
function shotRuins(t) { // 2段目 9〜17：戦争から生きて帰った男。心に深い傷を抱えている
  base(); S.aim(AX, -2); lift(0); S.darken(0.3, '#c2683a'); S.hemi.intensity = 0.9; S.key.intensity = 0.9; S.key.color.set('#ffb070');
  hero2.rotation.y = lerp(0.4, 0, ease(t / 3)); hero2.userData.head.rotation.x = t > 4.4 ? lerp(0, 0.4, ease((t - 4.4) / 0.8)) : 0;
  hero2.userData.arms.forEach(a => a.rotation.x = 0);
  tBack.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBack.visible = false; tScar.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(1.4, 0.8, u), lerp(1.7, 1.6, u), lerp(5.6, 4.4, u), AX, 1.4, -0.5, 54);
  return qs;
}
function shotHome(t) { // 3段目 17〜25：焼け野原。闇市で出会った女性と赤ちゃんと、3人の暮らし
  base(); S.aim(BX, -2); lift(0); S.darken(0.15, '#8a7a6a'); S.hemi.intensity = 1.1;
  woman3.userData.arms[0].rotation.x = -1.2; woman3.userData.arms[1].rotation.x = -1.2; woman3.userData.arms[0].rotation.z = 0.35; woman3.userData.arms[1].rotation.z = -0.35;
  BABY.position.set(woman3.position.x, 1.15 + Math.sin(t * 2.5) * 0.02, woman3.position.z + 0.3); BABY.rotation.z = Math.sin(t * 2.5) * 0.1;
  hero3.rotation.y = lerp(0, 0.6, ease((t - 4.2) / 0.8)); woman3.rotation.y = lerp(0, -0.5, ease((t - 4.6) / 0.8));
  tAsh.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAsh.visible = false; tThree.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  if (t < 4.0) look(BX + lerp(-4, -3, u), lerp(4.2, 3.6, u), lerp(9, 8, u), BX, 1.2, -2, 56);
  else look(BX + 0.2, 1.8, lerp(4.6, 4.0, ease((t - 4) / 4)), BX, 1.2, -0.6, 54);
  return qs;
}
function shotBoat(t) { // 4段目 25〜33：小さな木の船で、海に残った機雷を片付ける。船の仲間
  base(); S.aim(CX, -2); lift(0); S.darken(0.2, '#7a8a96'); S.hemi.intensity = 1.0; S.key.intensity = 1.0;
  SEA4.userData.wave(t, 0.14);
  BOAT.position.y = Math.sin(t * 1.4) * 0.08 - 0.05; BOAT.rotation.z = Math.sin(t * 1.1) * 0.025; BOAT.rotation.x = Math.sin(t * 0.9) * 0.02;
  CREWS.forEach((p, i) => { p.userData.arms[0].rotation.x = -0.4 - Math.abs(Math.sin(t * 2 + i)) * 0.6; p.rotation.y = i === 2 ? 0.4 : -0.2; });
  if (t > 4.2) CREWS.forEach((p, i) => { p.rotation.y = lerp(p.rotation.y, 0.9 - i * 0.5, ease((t - 4.2) / 0.8)); });
  tMine.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMine.visible = false; tCrew.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.6, 1.0, u), lerp(3.8, 3.4, u), lerp(9.4, 8.6, u), CX + 0.2, 1.2, -1.5, 56);
  return qs;
}
function shotTown(t) { // 5段目 33〜42：戦後まもない日本。巨大な生き物が上陸する
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.7; S.darken(0.4, '#06070a');
  const k = ease(clamp((t - 4.2) / 3.6));
  SHADOW.material.opacity = t > 4.2 ? 0.55 * Math.sin(Math.PI * clamp((t - 4.2) / 4.2)) : 0; SHADOW.position.x = DX + lerp(-14, 14, k);
  if (t > 4.2) { const p = Math.max(0, Math.sin((t - 4.2) * Math.PI * 1.8)); WARN.intensity = 40 * p; PRINT.position.y = 0.07; }
  const sh = t > 4.4 && t < 6.5 ? Math.sin(t * 40) * 0.03 * (1 - (t - 4.4) / 2.1) : 0;
  RUN5.forEach((p, i) => { const run = t > 4.6; p.rotation.y = run ? 0 : Math.PI; p.position.z = 3 + (i % 2) * 0.6 + (run ? (t - 4.6) * 1.6 : 0); poseWalk(p, t * 9 + i, run ? 1.2 : 0); });
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false; tLand.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(DX + sh, lerp(6.4, 5.8, u) + sh, lerp(8.0, 7.2, u), DX, 0.2, -4.0, 58);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：ゼロになった日本を、マイナスに。アカデミー賞の視覚効果賞
  base(); S.aim(EX, -2); lift(0); S.hemi.intensity = 0.5; S.key.intensity = 0.3; S.darken(0.7, '#05060a');
  const a = ease(clamp((t - 0.3) / 0.5)), b = ease(clamp((t - 1.4) / 0.5));
  N0.material.opacity = a; ARROW6.visible = t > 1.0; NM.material.opacity = b; NM.position.y = 3.6 - 0.3 * b;
  const tro = ease(clamp((t - 3.4) / 0.8)); TROPHY.scale.setScalar(Math.max(1e-4, tro * 1.5)); TROPHY.rotation.y = t * 0.6; TROPHY.userData.light.intensity = 60 * tro;
  tZero.userData.pop((t - 0.3) / 0.35); if (t > 3.6) tZero.visible = false; tVFX.userData.pop((t - 3.8) / 0.35);
  const u = ease(t / 7);
  look(EX, lerp(3.0, 2.8, u), lerp(10.4, 9.6, u), EX, 2.9, -1.5, 52);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の島。沖の盛り上がりがゆっくり近づく）
  shotIsland(8.6, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.75, 0.4, d); LAMP1.intensity = lerp(120, 70, d);
  SEA1.userData.wave(8.6 + t, 0.1);
  const k = clamp(t / 7); SWELL.position.set(-0.5, -0.1 + k * 0.2, -16 + k * 2);
  look(lerp(0.3, 0.1, ease(t / 7)), lerp(3.8, 3.2, ease(t / 7)), lerp(8.8, 7.8, ease(t / 7)), 0, 0.4, -8, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotIsland(t, 0) },
  { a: 9, b: 17, f: shotRuins },
  { a: 17, b: 25, f: shotHome },
  { a: 25, b: 33, f: shotBoat },
  { a: 33, b: 42, f: shotTown },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '海に、深海の魚が<br>大量に浮かんでいた。'],
  [5.6, 9.0, 'その夜、小さな島の基地に<br>何かがやってきた。'],
  [9.2, 13.2, '主人公は、戦争から<br>生きて帰ってきた男。'],
  [13.2, 17.0, 'でも、心には<br>深い傷を抱えている。'],
  [17.2, 21.0, '帰ってきた街は、<br>一面の焼け野原。'],
  [21.0, 25.0, '出会った女性と赤ちゃんと、<br>3人の暮らしが始まった。'],
  [25.2, 29.0, '仕事は、海に残った<br>機雷を片付けること。'],
  [29.0, 33.0, '小さな木の船で、<br>仲間たちと海に出る。'],
  [33.2, 37.4, '舞台は、戦争が終わって<br>まもない日本。'],
  [37.4, 41.8, '巨大な生き物が、<br>街に上陸する。'],
  [42.2, 45.4, 'ゼロになった日本を、<br>マイナスに落とす。'],
  [45.4, 49.0, '日本映画で初めて、<br>アカデミー賞の視覚効果賞。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ゴジラマイナスワン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q064', v2: true, answer: 'ゴジラ-1.0',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 6464,
    hits: [5.6, 13.2, 37.4, 45.4, 56.4], risers: [33.2, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [0.5, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'alarm'], [42.0, 'whoosh'], [45.3, 'drone'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '深海': 'しんかい', '大量': 'たいりょう', '浮かんで': 'うかんで', '小さな島': 'ちいさなしま', '基地': 'きち', '何かが': 'なにかが', '主人公': 'しゅじんこう', '戦争': 'せんそう', '生きて帰って': 'いきてかえって', '心には': 'こころには', '深い傷': 'ふかいきず', '抱えて': 'かかえて', '帰ってきた街': 'かえってきたまち', '一面': 'いちめん', '焼け野原': 'やけのはら', '出会った': 'であった', '女性': 'じょせい', '赤ちゃん': 'あかちゃん', '3人': 'さんにん', '暮らし': 'くらし', '始まった': 'はじまった', '仕事': 'しごと', '残った': 'のこった', '機雷': 'きらい', '片付ける': 'かたづける', '木の船': 'きのふね', '仲間': 'なかま', '海に出る': 'うみにでる', '舞台': 'ぶたい', '終わって': 'おわって', '日本映画': 'にほんえいが', '日本': 'にっぽん', '巨大な生き物': 'きょだいないきもの', '上陸': 'じょうりく', '落とす': 'おとす', '初めて': 'はじめて', '視覚効果賞': 'しかくこうかしょう', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n海に、深海の魚が大量に浮かんでいた。その夜、小さな島の基地に何かがやってきた。主人公は、戦争から生きて帰ってきた男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'PrimeVideo', '邦画', '映画好き'],
  },
});
applyQuizCards({ answer: 'ゴジラ-1.0', info: 'Netflix・Prime Video｜日本映画・125分', answerSize: 128 });
