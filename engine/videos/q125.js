import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #125 クリスマスソング（曲・back number・2015年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/22）：
//   ・シングル CD の発売日 2015年11月18日・ユニバーサル ミュージック（日本レコード協会 ゴールドディスク認定 ゴールド 2018年12月度。
//     riaj.or.jp の認定検索 API f/data/api/GdProducts で「クリスマスソング」）
//   ・日本レコード協会のストリーミング認定 トリプル・プラチナ（3億回以上。2024年5月度。riaj.or.jp/data/st/search/ で「クリスマスソング」、配信開始日 2018-11-29）
// 物語：曲が描く状況（冬の街の夜にひとり → 想いを伝えられないままの片思い → 光る街と行き交う人たち
//   → いつも考えてしまうのはその人のこと・あの人のとなりを歩けたらと思う）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が曲名と文法の切れ端だけなのを確かめた）。
//   音源・ジャケット・MV の映像や設定・ドラマの映像・歌手の見た目は使わない。人は汎用の3D
// 構成（ヒント6段）：1 光であふれる冬の夜の街・ひとり歩きながらある人のことを考える → 2 主人公は片思い中の男の人・胸の内をまだ言えずにいる
//   → 3 手をつなぐ人たちが行き交う通り・ショーウィンドウの前で立ち止まる → 4 頭に浮かぶのはいつもあの人・あの人のとなりを歩けたら
//   → 5 2015年に出たシングル・ストリーミング3億回 → 6 決め手：12月のあの日のための1曲・タイトルはカタカナ8文字
const S = quizStage({ bg: '#141a2e', floor: '#2a2e3a', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(12510);

const ME = { skin: '#f1c9a5', hair: '#2a2018', shirt: '#3a4a6a', pants: '#2a2e38' };
const PAIR = [{ skin: '#f4d3b5', hair: '#5a3a2a', shirt: '#c84a4a', pants: '#3a3a4a', long: true, skirt: true }, { skin: '#f1c9a5', hair: '#2a2018', shirt: '#8a7a6a', pants: '#2a2e38' },
  { skin: '#eacbb0', hair: '#3a2a20', shirt: '#e8e0d0', pants: '#5a5a6a', long: true }, { skin: '#f1c9a5', hair: '#4a3020', shirt: '#4a6a5a', pants: '#2a2e38' }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
function scarf(p, c = '#e8e0d0') { const s = box(0.46, 0.12, 0.32, mat(c)); s.position.set(0, 1.46, 0); p.add(s); return p; }
// 電球の飾り（小さく光る玉を線の上に並べる）
function lights(x0, x1, y, z, n, cols = ['#ffd27a', '#fff2c0', '#ffb86a']) { const out = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1); const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), gl(cols[i % cols.length])); b.position.set(lerp(x0, x1, u), y - Math.sin(u * Math.PI * 3) * 0.12, z); qs.add(b); out.push(b); } return out; }
function shop(x, z, w, h, c, win = '#ffcf80') { const b = box(w, h, 2, mat(c)); b.position.set(x, h / 2, z); qs.add(b);
  for (let f = 0; f < Math.floor(h / 1.6); f++) for (let i = 0; i < Math.floor(w / 1.2); i++) { if (R() < 0.35) continue; const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7), gl(win)); wn.position.set(x - w / 2 + 0.6 + i * 1.2, 1.2 + f * 1.6, z + 1.01); qs.add(wn); } }
// 雪（落ちてくる白いつぶ）
function snow(cx, cz, n = 120) { const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); const seed = [];
  for (let i = 0; i < n; i++) seed.push([R() * 14 - 7, R() * 8, R() * 10 - 8, R()]);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 0.07, transparent: true, opacity: 0.9 })); pts.frustumCulled = false; qs.add(pts);
  pts.userData.update = (t) => { seed.forEach(([x, y, z, s], i) => { pos[i * 3] = cx + x + Math.sin(t * 0.8 + s * 6) * 0.2; pos[i * 3 + 1] = ((y - t * (0.5 + s * 0.4)) % 8 + 8) % 8; pos[i * 3 + 2] = cz + z; }); g.attributes.position.needsUpdate = true; };
  return pts; }

// ---------- 1段目. 光であふれる冬の夜の通り（x=0）。ひとりで歩く主人公 ----------
{ const rd = box(8, 0.04, 34, mat('#3a3e4a')); rd.position.set(0, 0.03, -8); qs.add(rd);
  for (let i = 0; i < 5; i++) { shop(-5.2, -2 - i * 5, 3, 4 + R() * 3, ['#4a4458', '#3a3a4a', '#544a50'][i % 3]); shop(5.2, -4 - i * 5, 3, 4 + R() * 3, ['#3e4a58', '#4a4050', '#3a4048'][i % 3]); }
  for (let i = 0; i < 6; i++) lights(-3.6, 3.6, 3.6, -2 - i * 4, 18); }
const ME1 = scarf(person(ME, 0, -1.6, Math.PI));
const SNOW1 = snow(0, -2);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: SONG_GREEN, sx: 0.5 }); qs.add(Q1);
const tNight = tag('光であふれる、冬の夜', { size: 56, w: 640, bg: '#14161c', sx: 2.3 }); qs.add(tNight);
const tThink = tag('頭に浮かぶ、ある人', { size: 56, w: 600, bg: SONG_GREEN, sx: 2.2 }); qs.add(tThink);

// ---------- 2段目. 夜の部屋の窓辺（x=50）。送れないままの携帯電話を見つめる主人公 ----------
const AX = 50;
{ const fl = box(10, 0.04, 8, mat('#5a4a3e')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.4, 0.2, mat('#3a3a48')); wl.position.set(AX, 2.2, -4.6); qs.add(wl);
  const wn = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.0), gl('#1a2240')); wn.position.set(AX + 1.2, 2.3, -4.48); qs.add(wn);
  const fr = box(3.0, 0.1, 0.1, mat('#8a7a6a')); fr.position.set(AX + 1.2, 1.25, -4.44); qs.add(fr);
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), gl(['#ffd27a', '#fff2c0'][i % 2])); s.position.set(AX + 0.0 + R() * 2.4, 1.5 + R() * 1.6, -4.46); qs.add(s); }
  const bd = box(2.2, 0.5, 1.6, mat('#6a7a9a')); bd.position.set(AX - 2.2, 0.25, -3.2); qs.add(bd);
  const lp = new THREE.PointLight('#ffc070', 4, 6); lp.position.set(AX - 1, 1.6, -2); qs.add(lp); }
const ME2 = person(ME, AX + 0.2, -2.6, 0.2); ME2.userData.legs.forEach(l => l.rotation.x = -1.45); ME2.position.y = -0.4;
const STOOL2 = box(0.6, 0.48, 0.6, mat('#7a5a3a')); STOOL2.position.set(AX + 0.2, 0.24, -2.75); qs.add(STOOL2);
const PH2 = box(0.14, 0.26, 0.02, mat('#1a1a1a')); const PS2 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.22), gl('#a8d0f0')); PS2.position.z = 0.011; PH2.add(PS2); qs.add(PH2);
const tOne = tag('片思い中の、男の人', { size: 56, w: 600, bg: '#14161c', sx: 1.9 }); tOne.position.set(AX + 0.2, 2.5, -2.8); qs.add(tOne);
const tYet = tag('まだ、言えずにいる', { size: 56, w: 560, bg: SONG_GREEN, sx: 1.8 }); tYet.position.set(AX + 0.2, 2.5, -2.8); qs.add(tYet);

// ---------- 3段目. 手をつなぐ人たちの通り（x=100）。ショーウィンドウの前で立ち止まる主人公 ----------
const BX = 100;
{ const rd = box(16, 0.04, 14, mat('#3a3e4a')); rd.position.set(BX, 0.03, -2); qs.add(rd);
  const sw = box(9, 4.2, 1, mat('#5a3a3a')); sw.position.set(BX, 2.1, -5); qs.add(sw);
  const gls = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), gl('#ffe0a8')); gls.position.set(BX, 1.5, -4.48); qs.add(gls);
  for (let i = 0; i < 5; i++) { const gb = box(0.6 + R() * 0.3, 0.5 + R() * 0.3, 0.5, mat(['#c83a3a', '#3a8a5a', '#e8c050', '#4a6ab0', '#e8e0d0'][i])); gb.position.set(BX - 2.2 + i * 1.1, 0.7, -4.7); qs.add(gb);
    const rb = box(0.08, 0.62, 0.52, mat('#f4f0e0')); rb.position.copy(gb.position); qs.add(rb); }
  lights(BX - 4.4, BX + 4.4, 4.0, -4.4, 26); }
const ME3 = scarf(person(ME, BX + 0.6, -2.4, Math.PI));
const COUPLES3 = [[-3.2, -0.6], [3.4, 0.2], [-5.6, 0.8]].map(([dx, dz], i) => [person(PAIR[(i * 2) % 4], BX + dx, dz, Math.PI / 2), person(PAIR[(i * 2 + 1) % 4], BX + dx + 0.1, dz + 0.55, Math.PI / 2)]);
const SNOW3 = snow(BX, -1);
const tPairs = tag('手をつなぐ、人たち', { size: 58, w: 560, bg: '#14161c', sx: 2.1 }); tPairs.position.set(BX + 0.2, 3.3, -3.0); qs.add(tPairs);
const tStop = tag('ふと、立ち止まる', { size: 58, w: 520, bg: SONG_GREEN, sx: 2.0 }); tStop.position.set(BX + 0.2, 3.3, -3.0); qs.add(tStop);

// ---------- 4段目. 夜の橋の上（x=150）。手すりにもたれる主人公。となりの空いた場所に、うっすら浮かぶ人影 ----------
const CX = 150;
{ const br = box(14, 0.3, 4, mat('#4a4a54')); br.position.set(CX, 0.15, -2); qs.add(br);
  const rl = box(14, 0.08, 0.08, mat('#8a8a94')); rl.position.set(CX, 1.1, -3.8); qs.add(rl);
  for (let i = 0; i < 15; i++) { const p = box(0.06, 1.0, 0.06, mat('#8a8a94')); p.position.set(CX - 7 + i, 0.6, -3.8); qs.add(p); }
  const wt = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), gl('#0e1424')); wt.rotation.x = -Math.PI / 2; wt.position.set(CX, -0.6, -16); qs.add(wt);
  for (let i = 0; i < 12; i++) { const h = 3 + R() * 9; const b = box(2.4, h, 2, mat('#22283a')); b.position.set(CX - 16 + i * 3, h / 2 - 0.6, -26); qs.add(b);
    for (let k = 0; k < 6; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), gl(R() < 0.5 ? '#ffd27a' : '#fff2c0')); w.position.set(CX - 16.8 + i * 3 + R() * 1.6, R() * h - 0.4, -24.98); qs.add(w); } } }
const ME4 = scarf(person(ME, CX - 0.4, -3.3, Math.PI));
const GHOST4 = person({ skin: '#ffffff', hair: '#ffffff', shirt: '#ffffff', pants: '#ffffff', long: true, skirt: true }, CX + 0.45, -3.3, Math.PI);
GHOST4.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; o.material.emissive = new THREE.Color('#9ab0ff'); o.castShadow = false; } });
const SNOW4 = snow(CX, -3);
const tAlways = tag('浮かぶのは、いつもあの人', { size: 52, w: 720, bg: '#14161c', sx: 2.5 }); tAlways.position.set(CX, 2.6, -3.3); qs.add(tAlways);
const tBeside = tag('となりを、歩けたら', { size: 54, w: 680, bg: SONG_GREEN, sx: 2.4 }); tBeside.position.set(CX, 2.6, -3.3); qs.add(tBeside);

// ---------- 5段目. 記録（x=200）。ジャケットのない無地のディスクと音のバー ----------
const FX = 200;
{ const fl = box(14, 0.04, 12, mat('#2a2e3a')); fl.position.set(FX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#1e222c')); wl.position.set(FX, 4, -5); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const t2015 = tag('2015年に出た、シングル', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.5 }); t2015.position.set(FX, 4.4, -2.0); qs.add(t2015);
const tPlay = tag('ストリーミング 3億回超え', { size: 54, w: 740, bg: SONG_GREEN, sx: 2.7 }); tPlay.position.set(FX, 4.4, -2.0); qs.add(tPlay);

// ---------- 6段目. 広場の大きなツリー（x=250）。てっぺんに星。見上げる主人公。カレンダーの12月 ----------
const NX = 250;
{ const gr = box(20, 0.04, 14, mat('#3a3e4a')); gr.position.set(NX, 0.02, -3); qs.add(gr);
  const tr = box(0.5, 1.2, 0.5, mat('#5a3a20')); tr.position.set(NX, 0.6, -5); qs.add(tr);
  for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(2.4 - k * 0.5, 2.0, 12), mat('#2a6a3a')); c.position.set(NX, 1.8 + k * 1.2, -5); qs.add(c); }
  for (let i = 0; i < 40; i++) { const h = R() * 5; const a = R() * Math.PI * 2; const r = (2.3 - h * 0.42) * 0.92; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), gl(['#ff5a5a', '#ffd27a', '#7ac0ff', '#fff2c0'][i % 4])); b.position.set(NX + Math.cos(a) * r, 1.2 + h, -5 + Math.sin(a) * r); qs.add(b); } }
const STAR6 = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), gl('#ffe070')); STAR6.position.set(NX, 6.7, -5); qs.add(STAR6);
const ME6 = scarf(person(ME, NX + 0.8, -1.6, Math.PI + 0.3)); ME6.userData.head.rotation.x = -0.5;
const CAL6 = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 300, (g) => { g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, 256, 300); g.fillStyle = '#c83a3a'; g.fillRect(0, 0, 256, 80);
  g.fillStyle = '#fff'; g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('12月', 128, 44);
  g.fillStyle = '#c83a3a'; g.font = '900 140px "Noto Sans CJK JP", sans-serif'; g.fillText('25', 128, 196); }), depthTest: false }));
CAL6.renderOrder = 7; CAL6.scale.set(0.9, 1.05, 1); qs.add(CAL6);
const SNOW6 = snow(NX, -2);
const tDay = tag('12月の、あの日の1曲', { size: 56, w: 620, bg: '#14161c', sx: 2.4 }); qs.add(tDay);
const tKana = tag('タイトルは、カタカナ8文字', { size: 52, w: 760, bg: SONG_GREEN, sx: 2.7 }); qs.add(tKana);

// ---------- shots ----------
const ALL = [tNight, tThink, tOne, tYet, tPairs, tStop, tAlways, tBeside, t2015, tPlay, tDay, tKana, Q1, CAL6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotStreet(t, quiz = 0) { // 1段目 0〜9：街が光であふれる、冬のある夜。ひとりで歩きながら、ある人のことを考える（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.5;
  const z = quiz ? -2.0 : -1.6 - t * 0.15; ME1.position.z = z; poseWalk(ME1, t * 4, quiz ? 0 : 0.7);
  ME1.userData.head.rotation.x = t > 4.6 || quiz ? -0.25 : 0;
  SNOW1.userData.update(t + 3);
  Q1.position.set(0.75, 2.1, z - 0.1); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tNight.position.set(0, 2.85, z - 0.8); tThink.position.set(0, 2.85, z - 0.8);
  if (!quiz) { tNight.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tNight.visible = false; tThink.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 0.3, u), lerp(1.6, 1.7, u), z + lerp(3.6, 3.0, u), 0, 1.9, z - 2.0, 62);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：主人公は、片思い中の男の人。胸の内はまだだれにも言えずにいる
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.4;
  ME2.userData.arms.forEach(a => a.rotation.x = -1.2); ME2.userData.head.rotation.x = 0.35;
  PH2.position.set(AX + 0.2 + Math.sin(0.2) * 0.45, 1.0, -2.6 + 0.45); PH2.rotation.set(-0.6, 0.2, 0); PS2.material.color.set(t > 4.4 && Math.floor(t * 2) % 2 ? '#7aa0c0' : '#a8d0f0');
  tOne.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOne.visible = false; tYet.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-1.0, -0.6, u), lerp(2.1, 2.0, u), lerp(1.6, 1.1, u), AX + 0.3, 1.5, -2.8, 62);
  return qs;
}
function shotWindow(t) { // 3段目 17〜25：手をつなぐ人たちが行き交う通り。ショーウィンドウの前で、ふと立ち止まる
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5;
  COUPLES3.forEach(([a, b], i) => { const x = BX + [-3.2, 3.4, -5.6][i] + ((t * 0.7 + i * 2) % 12) - 6; a.position.x = x; b.position.x = x + 0.05; poseWalk(a, t * 4 + i, 0.6); poseWalk(b, t * 4 + i + 0.4, 0.6);
    a.userData.arms[0].rotation.x = 0; b.userData.arms[1].rotation.x = 0; });
  const stop = ease(clamp((t - 4.0) / 1.0)); ME3.position.x = BX + lerp(2.2, 0.4, stop); poseWalk(ME3, t * 4, stop < 1 ? 0.7 : 0); ME3.rotation.y = Math.PI - (stop < 1 ? Math.PI / 2 : 0);
  SNOW3.userData.update(t);
  tPairs.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPairs.visible = false; tStop.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(1.2, 0.6, u), lerp(2.0, 1.9, u), lerp(3.6, 2.8, u), BX + 0.2, 1.6, -3.0, 62);
  return qs;
}
function shotBridge(t) { // 4段目 25〜33：頭に浮かぶのは、いつもあの人。あの人のとなりを歩けたら
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.5; S.key.intensity = 0.4;
  ME4.userData.arms.forEach(a => a.rotation.x = -0.9); ME4.userData.head.rotation.y = t > 4.2 ? -0.6 : 0;
  const g = t > 4.4 ? ease(clamp((t - 4.4) / 1.4)) * (0.35 + Math.sin(t * 2) * 0.05) : 0; GHOST4.traverse(o => { if (o.material) o.material.opacity = g; });
  SNOW4.userData.update(t + 7);
  tAlways.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAlways.visible = false; tBeside.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.4, 0.1, u), lerp(1.8, 1.7, u), lerp(1.2, 0.8, u), CX + 0.1, 1.6, -4.5, 62);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2015年に出たシングル。ストリーミングは、3億回をこえた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.9;
  DISC.rotation.z = t * 1.2; BARS.userData.update(t);
  t2015.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2015.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(FX + lerp(-0.4, 0.3, u), lerp(2.7, 2.6, u), lerp(4.6, 4.0, u), FX, 2.7, -2.2, 62);
  return qs;
}
function shotTree(t) { // 6段目 42〜49（決め手）：12月の、あの日のための1曲。タイトルは、カタカナ8文字
  base(); S.aim(NX, -3); lift(0); S.hemi.intensity = 0.6; S.key.intensity = 0.5;
  STAR6.rotation.y = t * 1.5; SNOW6.userData.update(t + 2);
  CAL6.visible = true; CAL6.position.set(NX - 1.15, 3.1 + Math.sin(t * 1.4) * 0.05, -2.2);
  tDay.position.set(NX, 4.6, -3.0); tKana.position.set(NX, 4.6, -3.0);
  if (t < 3.6) tDay.userData.pop((t - 0.3) / 0.35); else tKana.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(NX + lerp(0.6, 0.2, u), lerp(2.4, 2.5, u), lerp(3.4, 3.0, u), NX, 3.4, -4.0, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（冬の通りに戻る）
  shotStreet(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStreet(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotWindow },
  { a: 25, b: 33, f: shotBridge },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: shotTree },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '街が光であふれる、<br>冬のある夜。'],
  [5.6, 9.0, 'ひとりで歩きながら、<br>ある人のことを考える。'],
  [9.2, 13.2, '主人公は、<br>片思い中の男の人。'],
  [13.2, 17.0, '胸の内は、まだ<br>だれにも言えずにいる。'],
  [17.2, 21.0, '手をつなぐ人たちが<br>行き交う通り。'],
  [21.0, 25.0, 'ショーウィンドウの前で、<br>ふと立ち止まる。'],
  [25.2, 29.0, '頭に浮かぶのは、<br>いつもあの人。'],
  [29.0, 33.0, 'あの人のとなりを<br>歩けたら。'],
  [33.2, 37.4, '2015年に出た、<br>冬のシングル。'],
  [37.4, 41.8, 'ストリーミングは、<br>3億回をこえた。'],
  [42.2, 45.4, '12月の、あの日のための<br>1曲。'],
  [45.4, 49.0, 'タイトルは、<br>カタカナ8文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、back numberの、<br>クリスマスソング。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q125', v2: true, answer: 'クリスマスソング', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'emotional', seed: 12510,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.4, 'bubble'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '街': 'まち', '光': 'ひかり', '冬': 'ふゆ', '夜': 'よる', '歩きながら': 'あるきながら', '人': 'ひと', '考える': 'かんがえる', '主人公': 'しゅじんこう', '片思い中': 'かたおもいちゅう', '男の人': 'おとこのひと', '気持ち': 'きもち', '胸の内': 'むねのうち', '言えずに': 'いえずに', '手': 'て', '人たち': 'ひとたち', '行き交う': 'いきかう', '通り': 'とおり', '前': 'まえ', '立ち止まる': 'たちどまる', '頭': 'あたま', '浮かぶ': 'うかぶ', '2015年': 'にせんじゅうごねん', '出た': 'でた', '3億回': 'さんおくかい', '12月': 'じゅうにがつ', '日': 'ひ', '1曲': 'いっきょく', '8文字': 'はちもじ', '曲': 'きょく', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', 'back number': 'バックナンバー', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この曲のタイトル、わかる？\n街が光であふれる、冬のある夜。ひとりで歩きながら、ある人のことを考える。主人公は、片思い中の男の人。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '冬ソング'],
  },
});
applyQuizCards({ answer: 'クリスマスソング', info: 'back number｜2015年', answerSize: 104, kind: '曲' });
