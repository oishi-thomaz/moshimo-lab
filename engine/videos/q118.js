import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #118 スパイダーマン：ノー・ウェイ・ホーム（映画・アメリカ・2021年製作・日本公開2022年1月7日・149分。Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/spider-man-no-way-home（サブスクリプション：Disney Plus）と
//   disneyplus.com/ja-jp/explore/articles/spider-man-movies-shows（実写映画を全作見放題で配信中）で2026/11/21確認。
//   Filmarks の動画配信欄は U-NEXT・Hulu 見放題（2026年10月更新）だったが JustWatch には出ていないので、答えのカードは Disney+ だけ。
//   Filmarks 4.4・レビュー160,221件 filmarks.com/movies/86717）
// 選んだ理由：アベンジャーズ／エンドゲーム（q096）が初日2万回をこえた。世界中で見られた大ヒット映画の同じシリーズの作品（notes/quiz-insights.md 2026/11/20）
// 確かめた事実（映画.com eiga.com/movie/94629 の解説・あらすじ。2026/11/21）：
//   ・ミステリオが残した映像をタブロイド紙が世界に公開し、正体も暴かれてしまう。マスコミに騒ぎ立てられ、ピーターの生活は一変
//   ・身近な大切な人にも危険が及ぶことを恐れ、ドクター・ストレンジに、魔術の力で自分がスパイダーマンだと知られていない世界にしてほしいと頼む
//   ・過去のシリーズ作品から悪役たちが登場する。MCU の スパイダーマン シリーズの第3弾。2021年製作／149分／アメリカ
// 構成（ヒント6段）：1 ある日、ニュースで自分の秘密がばらされた・世界中が知った → 2 主人公はふつうの高校生・家の前にはカメラとマイクの山
//   → 3 ビルが立ち並ぶ大都会・大切な人まで巻きこまれる → 4 魔術の使い手に助けを求めた・みんなの記憶から秘密を消してほしい
//   → 5 2021年のアメリカ映画・シリーズ3作目・別の世界から敵がやってくる → 6 決め手：クモの力を持つ高校生ヒーロー・タイトルは 帰る道がない という意味
// 魔術のあとに何が起きるか・誰が来るか（過去のシリーズの主人公たち）・誰が犠牲になるか・結末は言わない。人物の名前・スーツ・マスク・ロゴ・敵の姿は出さない。
// 俳優の顔・ポスター・劇中の有名な場面の構図は使わない。人は汎用の3D。前半（1〜4段）ではクモ・糸を出さない
const S = quizStage({ bg: '#141a28', floor: '#1e2230', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(11810);

const BOY = { skin: '#f1c9a5', hair: '#5a3a22', shirt: '#7a8090', pants: '#2b3346' };
const MJ = { skin: '#c89a70', hair: '#2a1a14', shirt: '#3a5a4a', pants: '#2a2a30', long: true };
const PAL = { skin: '#e0b088', hair: '#1a1410', shirt: '#c8a040', pants: '#3a3e4a' };
const MAGE = { skin: '#e8c0a0', hair: '#3a3030', shirt: '#2a3a6a', pants: '#2a3a6a' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
const WINTEX = canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#1a2030'; g.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 12) for (let x = 4; x < w; x += 12) { g.fillStyle = Math.random() < 0.45 ? '#ffd890' : '#2a3448'; g.fillRect(x, y, 6, 7); } });
function tower(x, z, w, h, d, c = '#3a4050') {
  const g = new THREE.Group(); const b = box(w, h, d, mat(c)); b.position.y = h / 2; g.add(b);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.94), new THREE.MeshBasicMaterial({ map: WINTEX })); f.position.set(0, h / 2, d / 2 + 0.01); g.add(f);
  g.position.set(x, 0, z); qs.add(g); return g;
}

// ---------- 1段目. 夜の部屋（x=0）。壁のテレビに 速報 と、？の顔の人影。立ちつくす高校生。まわりに飛びかう通知 ----------
{ const fl = box(10, 0.04, 9, mat('#5a4a3e')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.4, 0.2, mat('#3a4258')); wl.position.set(0, 2.2, -5.6); qs.add(wl);
  const wl2 = box(0.2, 4.4, 9, mat('#343a50')); wl2.position.set(-4.2, 2.2, -2); qs.add(wl2);
  const bed = box(2.0, 0.5, 3.0, mat('#4a5a7a')); bed.position.set(-3.0, 0.25, -2.6); qs.add(bed);
  const pil = box(1.4, 0.2, 0.5, mat('#e8e8f0')); pil.position.set(-3.0, 0.6, -3.8); qs.add(pil);
  const desk = box(1.6, 0.8, 0.7, mat('#6a5038')); desk.position.set(2.8, 0.4, -4.9); qs.add(desk);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), gl('#ffe0a0')); lamp.position.set(3.3, 1.1, -4.9); qs.add(lamp);
  const win = box(1.4, 1.2, 0.06, gl('#20304a')); win.position.set(-4.08, 2.4, -1.4); win.rotation.y = Math.PI / 2; qs.add(win); }
const TV1 = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), new THREE.MeshBasicMaterial({ map: canvasTex(360, 200, (g, w, h) => {
  g.fillStyle = '#0e1626'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d83a3a'; g.fillRect(0, 152, w, 48); g.fillStyle = '#ffffff'; g.font = '900 30px sans-serif'; g.textBaseline = 'middle'; g.fillText('速報', w - 86, 176);
  g.fillStyle = '#5a6a8a'; g.beginPath(); g.arc(180, 62, 30, 0, 7); g.fill(); g.fillRect(140, 92, 80, 60);
  g.fillStyle = '#ffffff'; g.font = '900 44px sans-serif'; g.textAlign = 'center'; g.fillText('？', 180, 64); }) }));
TV1.position.set(0, 2.3, -5.48); qs.add(TV1);
const TVF1 = box(3.8, 2.2, 0.1, mat('#101014')); TVF1.position.set(0, 2.3, -5.55); qs.add(TVF1);
const boy1 = makePerson(BOY); boy1.position.set(-1.1, 0, -2.6); boy1.rotation.y = Math.PI; qs.add(boy1);
const PH1 = box(0.1, 0.18, 0.02, mat('#1a1a1a')); PH1.position.set(0, -0.66, 0.08); boy1.userData.arms[1].add(PH1);
const NOTE1 = []; for (let i = 0; i < 9; i++) { const n = box(0.46, 0.16, 0.02, gl(['#ffffff', '#e6e6ee', '#ffd8d8'][i % 3])); n.userData.p = [R(), R(), R()]; qs.add(n); NOTE1.push(n); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#d83a3a', sx: 0.5 }); qs.add(Q1);
const tLeak = tag('秘密が、ばらされた', { size: 56, w: 600, bg: '#14161c', sx: 2.4 }); tLeak.position.set(0, 4.1, -4.6); qs.add(tLeak);
const tWorld = tag('世界中が、知った', { size: 58, w: 560, bg: '#d83a3a', sx: 2.3 }); tWorld.position.set(0, 4.1, -4.6); qs.add(tWorld);

// ---------- 2段目. 昼の家の前（x=50）。玄関から出てくる高校生。押し寄せるカメラとマイク ----------
const AX = 50;
{ const gr = box(16, 0.04, 12, mat('#6a6a66')); gr.position.set(AX, 0.02, -2); qs.add(gr);
  const hs = box(8, 5, 0.3, mat('#b8a088')); hs.position.set(AX, 2.5, -6); qs.add(hs);
  const dr = box(1.1, 2.1, 0.08, mat('#5a3a2a')); dr.position.set(AX, 1.05, -5.82); qs.add(dr);
  for (const s of [-1, 1]) { const w = box(1.2, 1.0, 0.08, mat('#8aa8c8')); w.position.set(AX + s * 2.4, 3.2, -5.82); qs.add(w); }
  const st = box(2.2, 0.2, 1.0, mat('#8a8a86')); st.position.set(AX, 0.1, -5.3); qs.add(st); }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ fog: false, color: '#9ab8d8' })); SKY2.position.set(AX, 10, -30); qs.add(SKY2);
const boy2 = makePerson(BOY); boy2.position.set(AX, 0, -4.9); qs.add(boy2);
const BAG2 = box(0.4, 0.5, 0.2, mat('#3a4a3a')); BAG2.position.set(0, 1.15, -0.25); boy2.add(BAG2);
const PRESS2 = [];
for (let i = 0; i < 9; i++) {
  const p = makePerson({ skin: ['#e8b98f', '#d8a880', '#f1c9a5', '#c89a70'][i % 4], hair: ['#1a1410', '#4a3a2a', '#2a2a2a'][i % 3], shirt: ['#3a3e4a', '#5a5a6a', '#2a3a5a', '#6a5a4a'][i % 4], pants: '#2a2a30', long: i % 3 === 1 });
  const a = -1.0 + (i % 5) * 0.5; const r = 2.4 + Math.floor(i / 5) * 1.1;
  p.userData.home = [AX + Math.sin(a) * r, -4.6 + Math.cos(a) * r]; p.position.set(p.userData.home[0], 0, p.userData.home[1]); p.rotation.y = Math.PI + a; qs.add(p); PRESS2.push(p);
  if (i % 2) { const cm = box(0.3, 0.26, 0.46, mat('#1a1a1e')); cm.position.set(0, -0.62, 0.2); p.userData.arms[1].add(cm); }
  else { const mk = box(0.05, 0.05, 0.36, mat('#2a2a2e')); mk.position.set(0, -0.62, 0.2); p.userData.arms[1].add(mk); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#5a5a60')); hd.position.set(0, -0.62, 0.42); p.userData.arms[1].add(hd); }
}
const FLASH2 = []; for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), gl('#ffffff', 0.9)); f.userData.p = R(); qs.add(f); FLASH2.push(f); }
const tNorm = tag('ふつうの、高校生', { size: 58, w: 560, bg: '#14161c', sx: 2.2 }); tNorm.position.set(AX, 3.9, -5.2); qs.add(tNorm);
const tPress = tag('カメラとマイクの山', { size: 56, w: 600, bg: '#d83a3a', sx: 2.4 }); tPress.position.set(AX, 3.9, -5.2); qs.add(tPress);

// ---------- 3段目. 夜の大都会の歩道（x=100）。フードをかぶって歩く高校生。スマホを向ける人たち。後ろを歩くふたり ----------
const BX = 100;
{ const rd = box(30, 0.04, 6, mat('#2a2a30')); rd.position.set(BX, 0.02, 1.5); qs.add(rd);
  const sw = box(30, 0.16, 4, mat('#5a5a5e')); sw.position.set(BX, 0.08, -3.4); qs.add(sw);
  for (let i = 0; i < 6; i++) { const ln = box(1.4, 0.02, 0.14, mat('#e8e8e8')); ln.position.set(BX - 10 + i * 4, 0.05, 1.5); qs.add(ln); }
  [[-10, -9, 3, 16], [-5.5, -10, 4, 24], [-0.5, -9.5, 3.4, 18], [4.2, -10, 4, 28], [9, -9, 3.2, 15], [13, -10, 3.6, 22]].forEach(([x, z, w, h], i) => tower(BX + x, z, w, h, 3, ['#3a4050', '#2e3444', '#444a5a'][i % 3]));
  for (let i = 0; i < 3; i++) { const lp = box(0.1, 3.6, 0.1, mat('#3a3a40')); lp.position.set(BX - 6 + i * 6, 1.8, -1.6); qs.add(lp); const lb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), gl('#ffe8b0')); lb.position.set(BX - 6 + i * 6, 3.6, -1.6); qs.add(lb); } }
const boy3 = makePerson({ ...BOY, shirt: '#3a3e4a' }); boy3.position.set(BX, 0.16, -3.0); boy3.rotation.y = Math.PI / 2; qs.add(boy3);
const HOOD3 = box(0.48, 0.5, 0.46, mat('#3a3e4a')); HOOD3.position.set(0, 0.28, -0.04); boy3.userData.head.add(HOOD3);
const mj3 = makePerson(MJ); mj3.rotation.y = Math.PI / 2; mj3.position.set(BX, 0.16, -2.6); qs.add(mj3);
const pal3 = makePerson(PAL); pal3.rotation.y = Math.PI / 2; pal3.position.set(BX, 0.16, -3.2); pal3.scale.setScalar(1.05); qs.add(pal3);
const FANS3 = [0, 1, 2, 3].map(i => { const p = makePerson({ skin: ['#e8b98f', '#d8a880', '#f1c9a5', '#c89a70'][i], hair: '#2a2420', shirt: ['#8a4a4a', '#4a6a8a', '#6a6a4a', '#7a5a8a'][i], pants: '#2a2a30', long: i % 2 === 1 });
  p.position.set(BX - 3.6 + i * 2.6 + (i > 1 ? 1.4 : 0), 0.16, -4.6); p.rotation.y = i < 2 ? 0.6 : -0.6; qs.add(p);
  const ph = box(0.1, 0.18, 0.02, gl('#cfe0ff')); ph.position.set(0, -0.66, 0.1); p.userData.arms[1].add(ph); return p; });
const tCity = tag('大都会、どこでも注目', { size: 54, w: 660, bg: '#14161c', sx: 2.9 }); tCity.position.set(BX, 3.6, -3.6); qs.add(tCity);
const tDear = tag('大切な人まで、巻きこむ', { size: 54, w: 700, bg: '#d83a3a', sx: 3.0 }); tDear.position.set(BX, 3.6, -3.6); qs.add(tDear);

// ---------- 4段目. 古い屋敷の広間（x=150）。長い上着の魔術の使い手と、向き合う高校生。床に光る輪 ----------
const CX = 150;
{ const fl = box(14, 0.04, 12, mat('#4a3a30')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), mat('#5a2a2a')); rug.rotation.x = -Math.PI / 2; rug.position.set(CX, 0.05, -3); qs.add(rug);
  const wl = box(14, 7, 0.2, mat('#3a3038')); wl.position.set(CX, 3.5, -8); qs.add(wl);
  for (let i = 0; i < 4; i++) { const c = box(0.5, 7, 0.5, mat('#5a4a40')); c.position.set(CX - 5.4 + i * 3.6, 3.5, -7.6); qs.add(c); }
  const st = box(4, 0.4, 1.4, mat('#5a4a40')); st.position.set(CX + 3.6, 0.2, -6.6); qs.add(st);
  const rw = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), gl('#8aa0c8', 0.8)); rw.position.set(CX - 3.6, 4.2, -7.88); qs.add(rw);
  for (let i = 0; i < 8; i++) { const sp = box(0.04, 2.6, 0.04, mat('#2a2028')); sp.position.set(CX - 3.6, 4.2, -7.86); sp.rotation.z = i * Math.PI / 8; qs.add(sp); } }
const mage4 = makePerson(MAGE); mage4.position.set(CX + 1.2, 0, -4.0); mage4.rotation.y = -0.9; qs.add(mage4);
const COAT4 = box(0.6, 1.2, 0.34, mat('#2a3a6a')); COAT4.position.set(0, 0.6, -0.02); mage4.add(COAT4);
const boy4 = makePerson(BOY); boy4.position.set(CX - 1.2, 0, -3.2); boy4.rotation.y = 0.9; qs.add(boy4);
const RING4 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 6, 64), gl('#8af0ff', 0.9)); RING4.rotation.x = Math.PI / 2; RING4.position.set(CX, 0.08, -3.6); qs.add(RING4);
const RING4b = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 6, 48), gl('#c8f8ff', 0.8)); RING4b.rotation.x = Math.PI / 2; RING4b.position.set(CX, 0.08, -3.6); qs.add(RING4b);
const DOTS4 = []; for (let i = 0; i < 20; i++) { const d = box(0.06, 0.06, 0.06, gl('#bff6ff')); d.userData.p = [R(), R()]; qs.add(d); DOTS4.push(d); }
const tMage = tag('魔術の使い手に、頼む', { size: 54, w: 660, bg: '#14161c', sx: 2.9 }); tMage.position.set(CX, 3.4, -4.0); qs.add(tMage);
const tErase = tag('秘密を、消してほしい', { size: 56, w: 640, bg: '#d83a3a', sx: 2.8 }); tErase.position.set(CX, 3.4, -4.0); qs.add(tErase);

// ---------- 5段目. 夜の屋上（x=200）。空に開く3つの光の輪。中に ？ の影 ----------
const TX = 200;
{ const rf = box(14, 0.3, 10, mat('#3a3e48')); rf.position.set(TX, 0.15, -2); qs.add(rf);
  for (let i = 0; i < 3; i++) { const ac = box(1.2, 0.8, 0.8, mat('#5a5e68')); ac.position.set(TX - 4 + i * 1.6, 0.7, 1.4); qs.add(ac); }
  const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 16), mat('#6a5040')); tk.position.set(TX + 4.6, 1.1, -4.4); qs.add(tk);
  [[-12, -22, 5, 30], [-5, -24, 6, 40], [3, -22, 5, 34], [10, -24, 6, 44]].forEach(([x, z, w, h]) => tower(TX + x, z, w, h, 4, '#2a3040')); }
const PORT5 = [-1, 0, 1].map(i => { const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 48), gl(['#ff8a3a', '#8af0ff', '#b88aff'][i + 1])); g.add(r);
  const d = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40), gl('#0a0a14', 0.85)); g.add(d);
  const q = tag('？', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', sx: 0.6 }); q.position.z = 0.05; g.add(q); g.userData.q = q;
  g.position.set(TX + i * 2.5, 4.2 - Math.abs(i) * 0.3, -6); qs.add(g); return g; });
const boy5 = makePerson(BOY); boy5.position.set(TX + 1.3, 0.3, -1.6); boy5.rotation.y = Math.PI; qs.add(boy5);
const t2021 = tag('2021年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 4.6 }); t2021.position.set(TX, 6.8, -6.0); qs.add(t2021);
const tFoe = tag('別の世界から、敵が', { size: 56, w: 620, bg: '#d83a3a', sx: 4.2 }); tFoe.position.set(TX, 6.8, -6.0); qs.add(tFoe);

// ---------- 6段目. ビルとビルのあいだ（x=250）。張りめぐらされた白い糸。糸を下りてくる小さなクモ。屋上の縁にしゃがむ高校生 ----------
const DX = 250;
{ [[-6, -6, 5, 22], [6, -6, 5, 26], [-6, -18, 6, 34], [6, -18, 6, 30], [0, -26, 7, 40]].forEach(([x, z, w, h]) => tower(DX + x, z, w, h, 5, '#2e3444'));
  const low = box(4, 10.2, 4, mat('#3a3e4a')); low.position.set(DX - 3.6, 5.1, -4.4); qs.add(low); }
const WEB6 = new THREE.Group(); qs.add(WEB6);
{ const pts = [[-3.5, 14, -5], [3.5, 16, -5], [-3.5, 8, -7], [3.5, 9, -7], [-3.5, 18, -9], [3.5, 12, -9]];
  const c = new THREE.Vector3(DX, 12.2, -6.4);
  pts.forEach(([x, y, z]) => { const a = new THREE.Vector3(DX + x, y, z); const L = a.distanceTo(c); const ln = box(0.03, 0.03, L, gl('#f0f4ff')); ln.position.copy(a).lerp(c, 0.5); ln.lookAt(c); WEB6.add(ln); });
  for (let k = 1; k <= 3; k++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(k * 0.9, 0.015, 4, 6), gl('#f0f4ff')); ring.position.copy(c); ring.rotation.y = 0.1; WEB6.add(ring); } }
const THREAD6 = box(0.015, 1, 0.015, gl('#ffffff')); THREAD6.position.set(DX, 14, -4.6); qs.add(THREAD6);
const SPIDER6 = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat('#c83a3a')); SPIDER6.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#2a4aa8')); h.position.y = -0.1; SPIDER6.add(h);
  for (let i = 0; i < 8; i++) { const l = box(0.2, 0.015, 0.015, mat('#1a1a1a')); const s = i < 4 ? -1 : 1; l.position.set(s * 0.12, -0.02 + (i % 4) * 0.02 - 0.03, 0); l.rotation.z = s * (0.5 - (i % 4) * 0.3); SPIDER6.add(l); } }
SPIDER6.position.set(DX, 14, -4.6); qs.add(SPIDER6);
const boy6 = makePerson({ ...BOY, shirt: '#3a3e4a' }); boy6.position.set(DX - 2.4, 10.2, -3.4); boy6.rotation.y = 0.7; qs.add(boy6);
const tPower = tag('クモの力の、高校生', { size: 58, w: 600, bg: '#14161c', sx: 2.6 }); tPower.position.set(DX - 1.2, 14.4, -5.4); qs.add(tPower);
const tHome = tag('タイトルは、帰る道がない', { size: 52, w: 740, bg: '#e6b450', color: '#14161c', sx: 2.8 }); tHome.position.set(DX - 1.2, 14.4, -5.4); qs.add(tHome);

// ---------- shots ----------
const ALL = [tLeak, tWorld, tNorm, tPress, tCity, tDear, tMage, tErase, t2021, tFoe, tPower, tHome, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); NOTE1.forEach(n => n.visible = false); FLASH2.forEach(f => f.visible = false); DOTS4.forEach(d => d.visible = false); }

function shotNews(t, quiz = 0) { // 1段目 0〜9：ある日、ニュースで自分の秘密がばらされた。世界中が、その名前を知った（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#05070c');
  const turn = quiz ? 1 : ease(clamp((t - 0.4) / 1.2));
  boy1.rotation.y = Math.PI - 0.5 + turn * 0.5; boy1.userData.arms[1].rotation.x = -1.1; boy1.userData.head.rotation.x = 0.05;
  boy1.userData.arms[0].rotation.x = quiz ? -0.3 : (t > 5.4 ? -2.0 * ease(clamp((t - 5.4) / 0.6)) : -0.2);
  const k = quiz ? 0 : clamp((t - 5.2) / 3.0);
  NOTE1.forEach((n, i) => { const q = n.userData.p; const kk = clamp(k * 1.4 - q[0] * 0.4); n.visible = kk > 0; const a = q[1] * 6.28 + t * 0.4; n.position.set(-1.1 + Math.cos(a) * (0.6 + kk * 1.0), 1.4 + q[2] * 1.4, -2.4 + Math.sin(a) * 0.5); n.lookAt(-1.1, 1.8, 3); });
  Q1.position.set(0.9, 1.4, -3.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tLeak.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tLeak.visible = false; tWorld.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(2.3, 2.4, u), lerp(3.0, 2.2, u), -0.4, 1.9, -4.6, 62);
  return qs;
}
function shotPress(t) { // 2段目 9〜17：主人公は、ふつうの高校生。家の前には、カメラとマイクの山
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.2;
  const w = ease(clamp(t / 2.2)); boy2.position.z = -5.2 + w * 0.7; poseWalk(boy2, t * 5, w < 1 ? 0.6 : 0);
  if (t > 3.6) { boy2.userData.arms[0].rotation.x = -2.2 * ease(clamp((t - 3.6) / 0.5)); boy2.userData.head.rotation.x = 0.2; }
  const crowd = ease(clamp((t - 3.4) / 1.4));
  PRESS2.forEach((p, i) => { const [hx, hz] = p.userData.home; p.position.x = lerp(hx + (hx - AX) * 0.8, hx, crowd); p.position.z = lerp(hz + 2.0, hz, crowd); p.visible = t > 3.2; p.userData.arms[1].rotation.x = -1.4; poseWalk(p, t * 6 + i, crowd < 1 ? 0.6 : 0); p.userData.arms[1].rotation.x = -1.4; });
  FLASH2.forEach((f, i) => { f.visible = t > 4.4 && Math.sin(t * 9 + f.userData.p * 30) > 0.85; const p = PRESS2[(i * 2 + 1) % 9]; f.position.set(p.position.x, 1.6, p.position.z - 0.5); });
  tNorm.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNorm.visible = false; tPress.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.8, 0.5, u), lerp(4.2, 4.0, u), lerp(2.4, 1.6, u), AX, 1.4, -4.6, 62);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：ビルが立ち並ぶ大都会。どこへ行っても注目の的。大切な人まで、巻きこまれていく
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 0.6; S.darken(0.55, '#06080e');
  const x = BX - 3 + t * 0.7; boy3.position.x = x; poseWalk(boy3, t * 5.5, 1); boy3.position.y += 0.16;
  boy3.userData.head.rotation.x = 0.2;
  mj3.visible = pal3.visible = t > 3.8;
  mj3.position.set(x - 1.4, 0.16, -2.6); pal3.position.set(x - 2.2, 0.16, -3.2); poseWalk(mj3, t * 5.5 + 1, 1); poseWalk(pal3, t * 5.5 + 2, 1); mj3.position.y += 0.16; pal3.position.y += 0.16;
  if (t > 4.4) { const turn = ease(clamp((t - 4.4) / 0.6)); FANS3.forEach(p => { p.userData.arms[1].rotation.x = -1.6 * turn; }); mj3.userData.head.rotation.y = -0.6 * turn; }
  else FANS3.forEach(p => { p.userData.arms[1].rotation.x = -1.6 * ease(clamp((t - 1.0) / 0.6)); });
  tCity.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCity.visible = false; tDear.userData.pop((t - 4.3) / 0.35);
  tCity.position.x = tDear.position.x = x - 0.4;
  const u = ease(t / 8);
  look(x + lerp(1.8, 1.4, u), lerp(2.0, 2.2, u), lerp(2.8, 2.2, u), x - 0.6, 1.6, -3.4, 62);
  return qs;
}
function shotMage(t) { // 4段目 25〜33：彼は、魔術の使い手に助けを求めた。みんなの記憶から、秘密を消してほしい
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.6, '#060510');
  boy4.userData.arms[0].rotation.x = t < 3.6 ? -0.6 - Math.sin(t * 2) * 0.2 : -0.2; boy4.userData.head.rotation.x = -0.1;
  const g = ease(clamp((t - 3.8) / 1.2));
  mage4.userData.arms.forEach((a, i) => a.rotation.set(-1.4 * g, 0, (i ? 0.4 : -0.4) * g));
  RING4.visible = RING4b.visible = t > 3.6; RING4.position.y = 0.08 + g * 1.0; RING4b.position.y = 0.08 + g * 1.6; RING4.rotation.z = t * 0.8; RING4b.rotation.z = -t * 1.1;
  RING4.material.opacity = 0.9 * g; RING4b.material.opacity = 0.8 * g;
  DOTS4.forEach((d) => { const q = d.userData.p; d.visible = g > 0.05; const a = q[0] * 6.28 + t * 1.6; d.position.set(CX + Math.cos(a) * 1.3, 0.2 + ((q[1] + t * 0.3) % 1) * 2.4, -3.6 + Math.sin(a) * 1.3); });
  tMage.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMage.visible = false; tErase.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.2, 0, u), lerp(2.2, 2.4, u), lerp(2.6, 1.8, u), CX, 1.7, -3.8, 62);
  return qs;
}
function shotPortals(t) { // 5段目 33〜42：2021年の、アメリカ映画。シリーズ3作目。別の世界から、敵がやってくる
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.65, '#05060c');
  PORT5.forEach((p, i) => { const k = ease(clamp((t - 3.6 - i * 0.4) / 0.6)); p.visible = k > 0; p.scale.setScalar(Math.max(0.001, k)); p.rotation.z = Math.sin(t + i) * 0.05; p.children[0].rotation.z = t * (1 + i * 0.3); });
  boy5.userData.head.rotation.x = -0.35; boy5.userData.arms[0].rotation.x = t > 4.6 ? -0.4 : 0;
  t2021.userData.pop((t - 0.4) / 0.35); if (t > 3.9) t2021.visible = false; tFoe.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(0.8, 0.6, u), lerp(1.6, 1.4, u), lerp(3.6, 3.0, u), TX, 4.2, -6.0, 66);
  return qs;
}
function shotWeb(t) { // 6段目 42〜49（決め手）：正体は、クモの力を持つ高校生ヒーロー。タイトルは、帰る道がない という意味
  base(); S.aim(DX, -6); lift(0); S.hemi.intensity = 0.6; S.darken(0.55, '#04060c');
  const d = ease(clamp(t / 2.6)); const top = 15.6, y = top - d * 2.4;
  SPIDER6.position.set(DX - 1.6, y, -4.6); SPIDER6.rotation.y = t * 0.6;
  THREAD6.scale.y = top + 0.4 - y; THREAD6.position.set(DX - 1.6, (top + 0.4 + y) / 2, -4.6);
  boy6.userData.legs.forEach(l => l.rotation.x = -1.2); boy6.position.y = 10.2 - 0.25; boy6.userData.arms.forEach(a => a.rotation.x = -0.9);
  boy6.userData.head.rotation.x = -0.2;
  if (t < 3.6) tPower.userData.pop((t - 0.3) / 0.35); else tHome.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.2, u), lerp(12.6, 12.4, u), lerp(1.8, 1.0, u), DX - 1.4, 12.4, -5.0, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の部屋に戻る）
  shotNews(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotNews(t, 0) },
  { a: 9, b: 17, f: shotPress },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotMage },
  { a: 33, b: 42, f: shotPortals },
  { a: 42, b: 49, f: shotWeb },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、ニュースで<br>自分の秘密がばらされた。'],
  [5.6, 9.0, '世界中が、<br>その名前を知った。'],
  [9.2, 13.2, '主人公は、<br>ふつうの高校生。'],
  [13.2, 17.0, '家の前には、<br>カメラとマイクの山。'],
  [17.2, 21.0, 'ビルが立ち並ぶ大都会。<br>どこへ行っても注目の的。'],
  [21.0, 25.0, '大切な人まで、<br>巻きこまれていく。'],
  [25.2, 29.0, '彼は、魔術の使い手に<br>助けを求めた。'],
  [29.0, 33.0, 'みんなの記憶から、<br>秘密を消してほしい。'],
  [33.2, 37.4, '2021年の、<br>アメリカ映画。シリーズ3作目。'],
  [37.4, 41.8, 'そして、別の世界から<br>敵がやってくる。'],
  [42.2, 45.4, '正体は、クモの力を持つ<br>高校生ヒーロー。'],
  [45.4, 49.0, 'タイトルは、<br>帰る道がない という意味。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、スパイダーマン<br>ノー・ウェイ・ホーム。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q118', v2: true, answer: 'スパイダーマン：ノー・ウェイ・ホーム',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 11810,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.4, 'buzz'], [9.0, 'whoosh'], [13.6, 'meter', 0.4], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'drone'], [33.0, 'whoosh'], [37.2, 'poof'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '自分': 'じぶん', '秘密': 'ひみつ', '世界中': 'せかいじゅう', '名前': 'なまえ', '知った': 'しった', '主人公': 'しゅじんこう', '高校生': 'こうこうせい', '家': 'いえ', '前': 'まえ', '山': 'やま', '立ち並ぶ': 'たちならぶ', '大都会': 'だいとかい', '行っても': 'いっても', '注目の的': 'ちゅうもくのまと', '大切な': 'たいせつな', '人': 'ひと', '巻きこまれて': 'まきこまれて', '彼': 'かれ', '魔術': 'まじゅつ', '使い手': 'つかいて', '助け': 'たすけ', '求めた': 'もとめた', '記憶': 'きおく', '消して': 'けして', '2021年': 'にせんにじゅういちねん', 'アメリカ映画': 'アメリカえいが', 'シリーズ3作目': 'シリーズさんさくめ', '別': 'べつ', '世界': 'せかい', '敵': 'てき', '正体': 'しょうたい', '力': 'ちから', '持つ': 'もつ', '帰る': 'かえる', '道': 'みち', '意味': 'いみ', '映画': 'えいが', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nある日、ニュースで自分の秘密がばらされた。世界中が、その名前を知った。主人公は、ふつうの高校生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', '映画好き', '洋画', 'アクション映画'],
  },
});
applyQuizCards({ answer: 'スパイダーマン<br><span style="font-size:76px">ノー・ウェイ・ホーム</span>', info: 'Disney+｜映画・149分', answerSize: 112 });
