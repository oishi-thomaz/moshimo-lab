import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #121 すずめの戸締まり（映画・日本のアニメ映画・2022年11月11日公開。U-NEXT・Netflix で見放題、
//   Filmarks の動画配信欄（U-NEXT 見放題。2026年10月更新）と JustWatch 日本版 justwatch.com/jp/映画/suzumenohu-di-mari
//   （サブスクリプション：Disney Plus・Netflix・U-NEXT）で2026/11/21確認。Filmarks 3.8・レビュー213,864件 filmarks.com/movies/100650）
// 選んだ理由：日本で社会現象になった映画が強い（鬼滅・ゴジラ-1.0。notes/quiz-insights.md 2026/11/15〜16）
// 確かめた事実（公式サイト suzume-tojimari-movie.jp のイントロダクション・ストーリー。2026/11/21）：
//   ・九州の静かな町で暮らす17歳の少女は、「扉を探してるんだ」という旅の青年に出会う。後を追って迷い込んだ山中の廃墟で、ぽつんとたたずむ古ぼけた扉を見つける
//   ・扉の向こう側からは災いが訪れてしまうため、青年は扉を閉めて鍵をかける“閉じ師”として旅を続けている
//   ・青年は、少女が幼い頃に使っていた、脚が1本欠けた小さな椅子に姿を変えられてしまう。3本脚の椅子の姿で走り出す
//   ・日本各地で次々に開き始める扉。九州、四国、関西、そして東京と、日本列島を巻き込んでいく“戸締まりの旅”。監督 新海誠、2022年11月11日公開
// 構成（ヒント6段）：1 学校へ行く途中、旅の青年とすれ違った・探しものがあると言い残して → 2 主人公は海辺の町で暮らす17歳の女の子・気になって追いかけた
//   → 3 山の中の誰もいない廃墟・ぽつんと立つ古いドアだけ → 4 青年はドアを閉めてまわる旅人・ふたりの旅が始まる
//   → 5 2022年の日本のアニメ映画・九州から四国、関西、東京へ → 6 決め手：青年は3本脚の小さな椅子に変えられた・タイトルはドアにカギをかけること
// 旅の終わりの場所・忘れられていた真実・結末は言わない。災いの中身（地震など）・しゃべる猫・登場人物の名前・地名（5段目の地方名より前）は出さない。
// 俳優の声・ポスター・ロゴ・劇中の有名な場面の構図・アニメの絵は使わない。人と物は汎用の3D
const S = quizStage({ bg: '#9ac0e0', floor: '#6a8a5a', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(12110);

const GIRL = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#f4f4f0', pants: '#2a3a5a', long: true, skirt: true };
const BOY = { skin: '#f1c9a5', hair: '#1a1418', shirt: '#2a2e3a', pants: '#2a2e3a', long: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function tie(p) { const t = box(0.12, 0.08, 0.02, mat('#c83a4a')); t.position.set(0, 1.4, 0.15); p.add(t); }
// 古い白いドア（枠ごと立っている）
function door(c = '#e8e4dc') { const g = new THREE.Group(); const m = mat('#8a8478');
  const l = box(0.14, 2.4, 0.2, m); l.position.set(-0.62, 1.2, 0); g.add(l); const r = l.clone(); r.position.x = 0.62; g.add(r); const t = box(1.38, 0.14, 0.2, m); t.position.y = 2.42; g.add(t);
  const pv = new THREE.Group(); pv.position.set(-0.55, 0, 0); const d = box(1.1, 2.3, 0.08, mat(c)); d.position.set(0.55, 1.17, 0); pv.add(d);
  const kn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat('#c8a040')); kn.position.set(0.98, 1.1, 0.07); pv.add(kn); g.add(pv); g.userData.pv = pv; return g; }
// 3本脚の黄色い子ども用の椅子（6段目だけ）
function chair() { const g = new THREE.Group(); const y = mat('#f0c838');
  const seat = box(0.5, 0.06, 0.5, y); seat.position.y = 0.5; g.add(seat); const back = box(0.5, 0.46, 0.06, y); back.position.set(0, 0.76, -0.22); g.add(back);
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2]]) { const l = box(0.06, 0.5, 0.06, y); l.position.set(x, 0.25, z); g.add(l); }
  for (const s of [-1, 1]) { const e = box(0.05, 0.08, 0.02, mat('#2a2a2a')); e.position.set(s * 0.1, 0.84, -0.18); g.add(e); } qs.add(g); return g; }

// ---------- 1段目. 朝の海辺の坂道（x=0）。制服の女の子と、すれ違う長い髪の青年 ----------
{ const rd = box(4, 0.04, 30, mat('#9a948a')); rd.position.set(0, 0.03, -6); qs.add(rd);
  const sea = box(80, 0.04, 40, mat('#3a8ac8')); sea.position.set(0, -0.6, -40); qs.add(sea);
  const wl = box(0.3, 0.8, 30, mat('#c8c0b0')); wl.position.set(-2.2, 0.4, -6); qs.add(wl);
  for (let i = 0; i < 5; i++) { const h = box(2.4, 2.2, 2.4, mat(['#e8dcc8', '#d8e0e8', '#f0e0d0'][i % 3])); h.position.set(3.8, 1.1, -2 - i * 4); qs.add(h); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 4), mat(['#5a6a8a', '#8a4a3a', '#4a6a5a'][i % 3])); rf.rotation.y = Math.PI / 4; rf.position.set(3.8, 2.7, -2 - i * 4); qs.add(rf); }
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 8), mat('#9a9890')); p.position.set(-1.8, 3, -4 - i * 7); qs.add(p); } }
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#5aa0e8', '#e8f4fa')); SKY1.position.set(0, 12, -50); qs.add(SKY1);
const girl1 = makePerson(GIRL); tie(girl1); girl1.position.set(-0.5, 0, 0); girl1.rotation.y = Math.PI; qs.add(girl1);
const BAG1 = box(0.4, 0.3, 0.12, mat('#3a2a1a')); BAG1.position.set(0, -0.6, 0.08); girl1.userData.arms[0].add(BAG1);
const boy1 = makePerson(BOY); boy1.scale.setScalar(1.12); boy1.position.set(0.6, 0, -8); qs.add(boy1);
const PACK1 = box(0.42, 0.56, 0.24, mat('#5a4a3a')); PACK1.position.set(0, 1.15, -0.26); boy1.add(PACK1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tPass = tag('旅の青年と、すれ違った', { size: 54, w: 700, bg: '#14161c', sx: 3.0 }); tPass.position.set(0, 3.0, -3.0); qs.add(tPass);
const tSeek = tag('探しものが、ある', { size: 58, w: 540, bg: '#e24050', sx: 2.6 }); tSeek.position.set(0, 3.0, -3.0); qs.add(tSeek);

// ---------- 2段目. 坂の上（x=50）。振り返って、駆け出す女の子。遠くを歩く青年の背中 ----------
const AX = 50;
{ const rd = box(4, 0.04, 30, mat('#9a948a')); rd.position.set(AX, 0.03, -8); qs.add(rd);
  const sea = box(80, 0.04, 40, mat('#3a8ac8')); sea.position.set(AX, -0.6, 20); qs.add(sea);
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), mat('#3a7a3a')); t.position.set(AX + (i % 2 ? 4 : -4), 1.6, -4 - i * 4); qs.add(t); }
  const mt = new THREE.Mesh(new THREE.ConeGeometry(14, 10, 8), mat('#4a7a4a')); mt.position.set(AX, 4, -40); qs.add(mt); }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#6aaae8', '#f0f6fa')); SKY2.position.set(AX, 12, -52); qs.add(SKY2);
const girl2 = makePerson(GIRL); tie(girl2); girl2.position.set(AX, 0, -1); qs.add(girl2);
const boy2 = makePerson(BOY); boy2.scale.setScalar(1.12); boy2.position.set(AX + 0.3, 0, -12); boy2.rotation.y = Math.PI; qs.add(boy2);
const tSeventeen = tag('海辺の町の、17歳', { size: 58, w: 560, bg: '#14161c', sx: 2.2 }); tSeventeen.position.set(AX, 2.9, -2.4); qs.add(tSeventeen);
const tFollow = tag('気になって、追いかけた', { size: 54, w: 680, bg: '#e24050', sx: 2.1 }); tFollow.position.set(AX + 0.3, 2.9, -2.4); qs.add(tFollow);

// ---------- 3段目. 山の中の廃墟（x=100）。崩れた壁と柱、水たまり。まん中に、ぽつんと立つ古いドア ----------
const BX = 100;
{ const fl = box(20, 0.04, 16, mat('#7a8a6a')); fl.position.set(BX, 0.02, -4); qs.add(fl);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshStandardMaterial({ color: '#8ab0c8', metalness: 0.6, roughness: 0.15 })); pool.rotation.x = -Math.PI / 2; pool.position.set(BX, 0.05, -4.6); qs.add(pool);
  [[-5, -7, 3, 4], [5.5, -8, 2.4, 3], [-2, -11, 6, 5], [6, -3, 1.2, 2]].forEach(([x, z, w, h]) => { const b = box(w, h, 0.5, mat('#b8b0a0')); b.position.set(BX + x, h / 2, z); b.rotation.z = (R() - 0.5) * 0.08; qs.add(b); });
  for (let i = 0; i < 5; i++) { const c = box(0.5, 2 + R() * 2.4, 0.5, mat('#a8a090')); c.position.set(BX - 6 + i * 3, c.geometry.parameters.height / 2, -9); qs.add(c); }
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), mat('#4a7a4a')); t.position.set(BX - 14 + i * 4, 2.6, -16); qs.add(t); } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#8ab0d0', '#e8eef2')); SKY3.position.set(BX, 12, -50); qs.add(SKY3);
const DOOR3 = door(); DOOR3.position.set(BX, 0.05, -4.6); qs.add(DOOR3);
const girl3 = makePerson(GIRL); tie(girl3); girl3.position.set(BX + 1.4, 0, 0.2); girl3.rotation.y = Math.PI; qs.add(girl3);
const tRuin = tag('山の中の、廃墟', { size: 58, w: 520, bg: '#14161c', sx: 2.2 }); tRuin.position.set(BX, 3.6, -4.6); qs.add(tRuin);
const tDoor = tag('古いドアが、ぽつんと', { size: 56, w: 640, bg: '#e24050', sx: 2.5 }); tDoor.position.set(BX, 3.6, -4.6); qs.add(tDoor);

// ---------- 4段目. 夕方の廃墟（x=150）。少し開いたドアからあふれる光。ふたりで押して閉める。光るカギ ----------
const CX = 150;
{ const fl = box(20, 0.04, 16, mat('#5a5a4a')); fl.position.set(CX, 0.02, -4); qs.add(fl);
  [[-5, -7, 3, 4], [5.5, -8, 2.4, 3], [-2, -11, 6, 5]].forEach(([x, z, w, h]) => { const b = box(w, h, 0.5, mat('#8a8070')); b.position.set(CX + x, h / 2, z); qs.add(b); }); }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#5a5a8a', '#f0a070')); SKY4.position.set(CX, 12, -50); qs.add(SKY4);
const DOOR4 = door(); DOOR4.position.set(CX, 0.05, -4.2); qs.add(DOOR4);
const LIGHT4 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), gl('#ffe8b0', 0.9)); LIGHT4.position.set(CX, 1.22, -4.24); qs.add(LIGHT4);
const boy4 = makePerson(BOY); boy4.scale.setScalar(1.12); boy4.position.set(CX - 0.2, 0, -3.2); boy4.rotation.y = Math.PI; qs.add(boy4);
const girl4 = makePerson(GIRL); tie(girl4); girl4.position.set(CX + 0.75, 0, -3.3); girl4.rotation.y = Math.PI; qs.add(girl4);
const KEY4 = new THREE.Group(); { const r = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 16), gl('#ffe080')); KEY4.add(r); const s = box(0.03, 0.22, 0.03, gl('#ffe080')); s.position.y = -0.18; KEY4.add(s); }
KEY4.position.set(CX - 0.2, 1.5, -3.6); qs.add(KEY4);
const tCloser = tag('ドアを閉めて、まわる旅人', { size: 52, w: 740, bg: '#14161c', sx: 2.8 }); tCloser.position.set(CX + 0.2, 3.2, -4.0); qs.add(tCloser);
const tJourney = tag('ふたりの旅が、始まる', { size: 56, w: 640, bg: '#e24050', sx: 2.5 }); tJourney.position.set(CX + 0.2, 3.2, -4.0); qs.add(tJourney);

// ---------- 5段目. 夕暮れの海を行くフェリー（x=200）。甲板に立つ女の子。遠くの島々 ----------
const TX = 200;
{ const sea = box(90, 0.04, 80, mat('#3a6a9a')); sea.position.set(TX, -0.02, -20); qs.add(sea);
  for (let i = 0; i < 5; i++) { const is = new THREE.Mesh(new THREE.ConeGeometry(3 + i % 2 * 2, 2.4, 7), mat('#3a5a4a')); is.position.set(TX - 20 + i * 10, 0.8, -36 - (i % 2) * 6); qs.add(is); } }
const SKY5 = new THREE.Mesh(new THREE.PlaneGeometry(100, 40), skyTex('#4a4a7a', '#f8a868')); SKY5.position.set(TX, 12, -56); qs.add(SKY5);
const SHIP5 = new THREE.Group(); { const h = box(4, 1.2, 12, mat('#f0f0f0')); h.position.y = 0.6; SHIP5.add(h); const st = box(4.02, 0.2, 12.02, mat('#2a5aa8')); st.position.y = 0.3; SHIP5.add(st);
  const dk = box(3.8, 0.06, 11.8, mat('#a87a4a')); dk.position.y = 1.23; SHIP5.add(dk); const cab = box(3, 1.6, 4, mat('#e8e8e8')); cab.position.set(0, 2.0, 2.5); SHIP5.add(cab);
  for (const s of [-1, 1]) { const rl = box(0.04, 0.6, 11.8, mat('#8a8a8a')); rl.position.set(s * 1.88, 1.55, 0); SHIP5.add(rl); } }
SHIP5.position.set(TX, 0, -2); qs.add(SHIP5);
const girl5 = makePerson(GIRL); tie(girl5); girl5.position.set(TX + 1.2, 1.26, -5.2); girl5.rotation.y = -Math.PI / 2; qs.add(girl5);
const WAKE5 = []; for (let i = 0; i < 8; i++) { const w = box(0.6, 0.02, 0.2, gl('#ffffff', 0.7)); w.userData.p = R(); qs.add(w); WAKE5.push(w); }
const t2022 = tag('2022年の、日本のアニメ映画', { size: 52, w: 780, bg: '#e6b450', color: '#14161c', sx: 3.8 }); t2022.position.set(TX + 1.2, 4.0, -6.2); qs.add(t2022);
const tRoute = tag('九州から四国、関西、東京へ', { size: 52, w: 780, bg: '#e24050', sx: 3.8 }); tRoute.position.set(TX + 1.2, 4.0, -6.2); qs.add(tRoute);

// ---------- 6段目. 港町の道（x=250）。走っていく3本脚の黄色い小さな椅子。追いかける女の子 ----------
const DX = 250;
{ const rd = box(6, 0.04, 30, mat('#8a8478')); rd.position.set(DX, 0.03, -6); qs.add(rd);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const h = box(2.6, 2.4 + (i % 2), 2.4, mat(['#e8dcc8', '#c8d8e0', '#f0d8c0'][(i + (s > 0)) % 3])); h.position.set(DX + s * 4.4, (2.4 + (i % 2)) / 2, -2 - i * 4); qs.add(h); }
  const sea = box(80, 0.04, 40, mat('#3a8ac8')); sea.position.set(DX, -0.6, -40); qs.add(sea); }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), skyTex('#5aa0e8', '#e8f4fa')); SKY6.position.set(DX, 12, -50); qs.add(SKY6);
const CHAIR6 = chair(); CHAIR6.position.set(DX, 0, -3); qs.add(CHAIR6);
const girl6 = makePerson(GIRL); tie(girl6); girl6.position.set(DX + 0.3, 0, -0.4); girl6.rotation.y = Math.PI; qs.add(girl6);
const tChair = tag('青年は、3本脚の椅子に', { size: 54, w: 700, bg: '#14161c', sx: 2.6 }); tChair.position.set(DX, 2.7, -3.6); qs.add(tChair);
const tLock = tag('タイトルは、カギをかけること', { size: 50, w: 800, bg: '#e6b450', color: '#14161c', sx: 2.3 }); tLock.position.set(DX, 2.7, -3.6); qs.add(tLock);

// ---------- shots ----------
const ALL = [tPass, tSeek, tSeventeen, tFollow, tRuin, tDoor, tCloser, tJourney, t2022, tRoute, tChair, tLock, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotPass(t, quiz = 0) { // 1段目 0〜9：学校へ行く途中、旅の青年とすれ違った。「探しものがある」と言い残して…（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.3;
  const k = quiz ? 0.45 : clamp(t / 8); girl1.position.z = 0.6 - k * 3.4; poseWalk(girl1, t * 4, quiz ? 0 : 0.8);
  boy1.position.z = -7 + k * 7.2; poseWalk(boy1, t * 3.6, quiz ? 0 : 0.8);
  const near = clamp(1 - Math.abs(girl1.position.z - boy1.position.z) / 2.0);
  girl1.userData.head.rotation.y = quiz ? 0.5 : 0.8 * near; boy1.userData.head.rotation.y = quiz ? -0.4 : -0.6 * near;
  Q1.position.set(1.1, 2.3, -3.4); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tPass.userData.pop((t - 1.6) / 0.35); if (t > 5.0) tPass.visible = false; tSeek.userData.pop((t - 5.3) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.0, 0.8, u), lerp(2.1, 2.0, u), lerp(5.6, 4.6, u), 0, 1.4, -3.0, 62);
  return qs;
}
function shotChase(t) { // 2段目 9〜17：主人公は、海辺の町で暮らす17歳の女の子。気になって、青年のあとを追いかけた
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.3;
  const turn = ease(clamp((t - 0.6) / 0.8)); girl2.rotation.y = Math.PI * turn;
  if (t > 4.2) { const r = (t - 4.2); girl2.position.z = -1 - r * 1.2; poseWalk(girl2, t * 9, 1.2); } else girl2.position.z = -1;
  girl2.userData.head.rotation.y = t < 2.6 ? 0 : 0;
  boy2.position.z = -12 - t * 0.25; poseWalk(boy2, t * 3.5, 0.8);
  tSeventeen.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSeventeen.visible = false; tFollow.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(1.4, 0.8, u), lerp(1.9, 2.1, u), lerp(2.6, 1.6, u), AX, 1.4, -4, 62);
  return qs;
}
function shotRuin(t) { // 3段目 17〜25：山の中の、誰もいない廃墟。ぽつんと立つ、古いドアだけがあった
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 1.1; S.darken(0.1, '#c8d0d8');
  girl3.position.z = 0.2 - ease(clamp(t / 6)) * 2.0; poseWalk(girl3, t * 3.4, t < 6 ? 0.6 : 0);
  tRuin.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tRuin.visible = false; tDoor.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(2.2, 1.2, u), lerp(2.6, 2.2, u), lerp(4.0, 2.6, u), BX, 1.5, -4.4, 62);
  return qs;
}
function shotShut(t) { // 4段目 25〜33：青年は、そのドアを閉めてまわる旅人だった。ふたりの旅が始まる
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#2a1a2a');
  const shut = ease(clamp((t - 1.0) / 2.6)); DOOR4.userData.pv.rotation.y = -1.0 * (1 - shut);
  LIGHT4.material.opacity = 0.9 * (1 - shut); LIGHT4.visible = shut < 0.98;
  [boy4, girl4].forEach(p => { p.userData.arms.forEach(a => a.rotation.x = -1.4); });
  KEY4.visible = t > 3.8; KEY4.rotation.z = Math.sin(t * 3) * 0.2; KEY4.position.y = 1.5 + Math.sin(t * 2) * 0.03;
  if (t > 4.6) { girl4.userData.head.rotation.y = -0.6; boy4.userData.head.rotation.y = 0.5; }
  tCloser.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCloser.visible = false; tJourney.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(2.6, 2.2, u), lerp(2.4, 2.3, u), lerp(2.6, 2.0, u), CX, 1.4, -4.0, 62);
  return qs;
}
function shotFerry(t) { // 5段目 33〜42：2022年の、日本のアニメ映画。九州から四国、関西、そして東京へ
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.9; S.darken(0.2, '#4a2a3a');
  SHIP5.rotation.z = Math.sin(t * 1.2) * 0.02; girl5.userData.head.rotation.y = 0.3;
  WAKE5.forEach((w, i) => { const q = w.userData.p; const k = (t * 0.4 + q) % 1; w.position.set(TX + (q - 0.5) * 3, 0.03, 4.4 + k * 6); w.material.opacity = 0.7 * (1 - k); });
  t2022.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2022.visible = false; tRoute.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(5.4, 4.6, u), lerp(3.4, 3.0, u), lerp(1.4, 0.0, u), TX + 0.8, 2.6, -6.0, 62);
  return qs;
}
function shotChair(t) { // 6段目 42〜49（決め手）：青年は、3本脚の小さな椅子に変えられてしまった。タイトルは、ドアにカギをかけること
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.3;
  const run = t * 1.2; CHAIR6.position.set(DX + Math.sin(t * 1.4) * 0.3, Math.abs(Math.sin(t * 10)) * 0.18, -2.6 - run); CHAIR6.rotation.set(0, Math.PI + Math.sin(t * 10) * 0.15, Math.sin(t * 10) * 0.12);
  girl6.position.z = -0.2 - run * 0.95; poseWalk(girl6, t * 9, 1.2); girl6.userData.arms[1].rotation.x = -1.6;
  tChair.position.z = tLock.position.z = CHAIR6.position.z + 0.6; tChair.position.y = tLock.position.y = 2.3;
  if (t < 3.6) tChair.userData.pop((t - 0.3) / 0.35); else tLock.userData.pop((t - 3.7) / 0.3);
  look(DX + 1.2, 1.3, CHAIR6.position.z - 3.4, DX, 0.9, CHAIR6.position.z + 0.8, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（海辺の坂道に戻る）
  shotPass(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotPass(t, 0) },
  { a: 9, b: 17, f: shotChase },
  { a: 17, b: 25, f: shotRuin },
  { a: 25, b: 33, f: shotShut },
  { a: 33, b: 42, f: shotFerry },
  { a: 42, b: 49, f: shotChair },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '学校へ行く途中、<br>旅の青年とすれ違った。'],
  [5.6, 9.0, '探しものがある、と<br>言い残して…'],
  [9.2, 13.2, '主人公は、海辺の町で<br>暮らす17歳の女の子。'],
  [13.2, 17.0, '気になって、青年のあとを<br>追いかけた。'],
  [17.2, 21.0, '山の中の、<br>誰もいない廃墟。'],
  [21.0, 25.0, 'ぽつんと立つ、<br>古いドアだけがあった。'],
  [25.2, 29.0, '青年は、そのドアを<br>閉めてまわる旅人だった。'],
  [29.0, 33.0, 'ふたりの旅が、<br>ここから始まる。'],
  [33.2, 37.4, '2022年の、<br>日本のアニメ映画。'],
  [37.4, 41.8, '九州から四国、関西、<br>そして東京へ。'],
  [42.2, 45.4, '青年は、3本脚の<br>小さな椅子に変えられた。'],
  [45.4, 49.0, 'タイトルは、<br>ドアにカギをかけること。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>すずめの戸締まり。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q121', v2: true, answer: 'すずめの戸締まり',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'mystery', seed: 12110,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone'], [25.0, 'whoosh'], [28.6, 'poof'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '学校': 'がっこう', '行く': 'いく', '途中': 'とちゅう', '旅の青年': 'たびのせいねん', '青年': 'せいねん', '違った': 'ちがった', '探しもの': 'さがしもの', '言い残して': 'いいのこして', '主人公': 'しゅじんこう', '海辺': 'うみべ', '町': 'まち', '暮らす': 'くらす', '17歳': 'じゅうななさい', '女の子': 'おんなのこ', '気になって': 'きになって', '追いかけた': 'おいかけた', '山の中': 'やまのなか', '誰も': 'だれも', '廃墟': 'はいきょ', '立つ': 'たつ', '古い': 'ふるい', '閉めて': 'しめて', '旅人': 'たびびと', '旅': 'たび', '始まる': 'はじまる', '2022年': 'にせんにじゅうにねん', '日本': 'にほん', 'アニメ映画': 'アニメえいが', '九州': 'きゅうしゅう', '四国': 'しこく', '関西': 'かんさい', '東京': 'とうきょう', '3本脚': 'さんぼんあし', '小さな': 'ちいさな', '椅子': 'いす', '変えられた': 'かえられた', '映画': 'えいが', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '戸締まり': 'とじまり', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n学校へ行く途中、旅の青年とすれ違った。探しものがある、と言い残して…。主人公は、海辺の町で暮らす17歳の女の子。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Netflix', '映画好き', 'アニメ映画'],
  },
});
applyQuizCards({ answer: 'すずめの戸締まり', info: 'U-NEXT・Netflix｜日本のアニメ映画', answerSize: 112 });
