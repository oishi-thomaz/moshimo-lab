import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #038 天体観測（曲・BUMP OF CHICKEN・2001年）。曲の回の1本目（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/4）：
//   ・シングル発売 2001年3月14日（トイズファクトリー TFCC-87080。billboard-japan.com/goods/detail/322824）
//   ・日本レコード協会のストリーミング認定 ダブル・プラチナ（2億回以上。2025年10月度。riaj.or.jp/data/st/search/ で「天体観測」）
// 物語：曲が描く状況（真夜中にこっそり出かけ、あの子とふたりで夜空を見る → 気持ちは言えないまま → 大人になっても空を見上げる）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（歌詞と見比べて、重なる言葉がないことを確かめた）。音源・ジャケット・歌手の見た目は使わない
// 構成（ヒント6段）：1 真夜中にこっそり家を出る → 2 ふたりだけのないしょの計画 → 3 息をひそめて空を見上げる → 4 言えなかった気持ち・大人になっても空を見る
//   → 5 2001年のロックバンドの曲・ストリーミング2億回 → 6 決め手：夜空をのぞく道具（望遠鏡の3D）・タイトルは漢字4文字

const S = quizStage({ bg: '#0e1430', floor: '#141a30', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(3838);

const BOY = { skin: '#efcfae', hair: '#1d1a19', shirt: '#3f6fb0', pants: '#2a2f3c' };
const GIRL = { skin: '#f2d4b8', hair: '#3a2a20', shirt: '#e8b04a', pants: '#3a3448', long: true };
const MAN = { skin: '#efcfae', hair: '#1d1a19', shirt: '#4a5468', pants: '#22262f' };

// 星空（各段の奥に置く）
function starSky(x, z = -40, w = 90, h = 44, seed = 1) {
  const r = rng(seed);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(256, 512, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05071a'); gr.addColorStop(0.7, '#14204a'); gr.addColorStop(1, '#2a3466'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`; const s = r() < 0.08 ? 2.4 : 1.2; g.fillRect(r() * W, r() * H * 0.85, s, s); }
  }) }));
  sky.position.set(x, 14, z); qs.add(sky); return sky;
}
function sitPose(p) { p.userData.legs.forEach(l => l.rotation.x = -1.45); p.position.y -= 0.32; }

// ---------- 1段目. 真夜中の家（x=0）。窓の灯りはひとつだけ。こっそり出ていく子ども ----------
starSky(0, -40, 90, 44, 1);
const MOON = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ color: '#f4ecc8', fog: false })); MOON.position.set(9, 8.5, -38); qs.add(MOON);
const HOUSES = [];
for (let i = 0; i < 4; i++) {
  const g = new THREE.Group(); const w = 3.4, h = 2.8;
  const body = box(w, h, 3, mat(['#5a5a6e', '#6a5e58', '#4e5a6a', '#5e6458'][i])); body.position.y = h / 2; g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.4, 4), mat('#2e2a34')); roof.rotation.y = Math.PI / 4; roof.position.y = h + 0.7; roof.scale.set(1, 1, 0.8); g.add(roof);
  for (const s of [-0.8, 0.8]) { const wn = box(0.7, 0.6, 0.04, new THREE.MeshBasicMaterial({ color: '#1a1e2a' })); wn.position.set(s, 1.9, 1.52); g.add(wn); g.userData.win = (g.userData.win || []).concat(wn); }
  g.position.set(-7 + i * 4.6, 0, -6 - (i % 2) * 1.5); qs.add(g); HOUSES.push(g);
}
const HOME = HOUSES[1];
const DOOR = box(0.8, 1.5, 0.05, mat('#3a2a20')); DOOR.position.set(0, 0.75, 1.53); HOME.add(DOOR);
const LIT = HOME.userData.win[1]; LIT.material = new THREE.MeshBasicMaterial({ color: '#ffd890' });
const boy1 = makePerson(BOY); boy1.scale.setScalar(0.82); qs.add(boy1);
const PACK = box(0.34, 0.4, 0.18, mat('#2e5a3a')); PACK.position.set(0, 1.05, -0.2); boy1.add(PACK);
const tNight = tag('真夜中', { size: 84, w: 360, bg: '#14161c', sx: 1.6 }); tNight.position.set(-1.4, 2.35, -0.6); qs.add(tNight);
const tSneak = tag('こっそり外へ', { size: 72, w: 460, bg: SONG_GREEN, sx: 1.7 }); tSneak.position.set(-1.4, 2.7, -0.6); qs.add(tSneak);

// ---------- 2段目. 街灯の下の待ち合わせ（x=40） ----------
const KX = 40;
starSky(KX, -40, 90, 44, 2);
{ const rd = box(6, 0.04, 30, mat('#2a2e3c')); rd.position.set(KX, 0.03, -8); qs.add(rd); }
const LAMP2 = new THREE.Group(); { const p = box(0.1, 3.6, 0.1, mat('#2a2a2e')); p.position.y = 1.8; LAMP2.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffe6a8' })); l.position.y = 3.7; LAMP2.add(l); } LAMP2.position.set(KX + 1.3, 0, -1.6); qs.add(LAMP2);
const LP2 = new THREE.PointLight(0xffd890, 0, 9, 1.4); LP2.position.set(KX + 1.3, 3.4, -1.4); qs.add(LP2);
const boy2 = makePerson(BOY); boy2.scale.setScalar(0.82); boy2.position.set(KX - 0.5, 0, -1); boy2.rotation.y = 0.5; qs.add(boy2);
const girl2 = makePerson(GIRL); girl2.scale.setScalar(0.8); girl2.position.set(KX + 3.6, 0, -4); qs.add(girl2);
const tPlan = tag('ないしょの計画', { size: 66, w: 520, bg: '#14161c', sx: 1.8 }); tPlan.position.set(KX, 2.9, -1); qs.add(tPlan);
const tTwo = tag('ふたりだけ', { size: 80, w: 420, bg: SONG_GREEN, sx: 1.6 }); tTwo.position.set(KX, 2.9, -1); qs.add(tTwo);

// ---------- 3段目. 空き地で空を見上げる（x=90） ----------
const CX = 90;
const SKY3 = starSky(CX, -30, 80, 50, 3);
{ const gr = box(20, 0.04, 20, mat('#1e2a24')); gr.position.set(CX, 0.02, -4); qs.add(gr); }
const GRASS = []; for (let i = 0; i < 40; i++) { const b = box(0.05, 0.3 + R() * 0.3, 0.05, mat('#2a4a34')); b.position.set(CX - 8 + R() * 16, 0.2, -10 + R() * 9); qs.add(b); GRASS.push(b); }
const boy3 = makePerson(BOY); boy3.scale.setScalar(0.82); boy3.position.set(CX - 0.4, 0, -1); boy3.rotation.y = Math.PI; sitPose(boy3); qs.add(boy3);
const girl3 = makePerson(GIRL); girl3.scale.setScalar(0.8); girl3.position.set(CX + 0.4, 0, -1); girl3.rotation.y = Math.PI; sitPose(girl3); qs.add(girl3);
const tHush = tag('息をひそめて', { size: 70, w: 480, bg: '#14161c', sx: 1.8 }); tHush.position.set(CX, 3.0, -1.6); qs.add(tHush);
const tYet = tag('まだ現れない', { size: 70, w: 480, bg: '#4a5a9a', sx: 1.8 }); tYet.position.set(CX, 3.0, -1.6); qs.add(tYet);

// ---------- 4段目. 大人になって、ひとりでベランダから空を見る（x=130） ----------
const BX = 130;
starSky(BX, -40, 90, 44, 4);
const CITY4 = []; for (let i = 0; i < 12; i++) { const w = 2 + R() * 1.6, h = 4 + R() * 9; const wt = windowTextures(3800 + i, ['#2a3048', '#323a54', '#262c40'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0.5 })); b.position.set(BX - 16 + i * 2.9, h / 2 - 5, -18 - (i % 3) * 2.5); qs.add(b); CITY4.push(b); }
{ const fl = box(5, 0.1, 2.4, mat('#4a4e58')); fl.position.set(BX, 0, -0.6); qs.add(fl); const rail = box(5, 0.06, 0.06, mat('#9aa0aa')); rail.position.set(BX, 1.05, -1.75); qs.add(rail); for (let i = 0; i < 9; i++) { const v = box(0.04, 1.05, 0.04, mat('#9aa0aa')); v.position.set(BX - 2.4 + i * 0.6, 0.52, -1.75); qs.add(v); } }
const man4 = makePerson(MAN); man4.position.set(BX - 0.2, 0.05, -1.2); man4.rotation.y = Math.PI; qs.add(man4);
const tWords = tag('言えなかった気持ち', { size: 62, w: 600, bg: '#14161c', sx: 1.25 }); tWords.position.set(BX - 0.2, 3.7, -2.0); qs.add(tWords);
const tGrown = tag('大人になっても', { size: 70, w: 520, bg: '#4a5a9a', sx: 1.2 }); tGrown.position.set(BX - 0.2, 3.7, -2.0); qs.add(tGrown);

// ---------- 5段目. 2001年・ロックバンド・ストリーミング2億回（x=170） ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#141a36' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 3.2, -1.6); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 4.35, -1.4); BARS.scale.set(0.8, 0.4, 0.8); qs.add(BARS);
const tYear = tag('2001年 ロックバンドの曲', { size: 56, w: 720, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tYear.position.set(FX, 5.6, -1.2); qs.add(tYear);
const tPlay = tag('ストリーミング 2億回超え', { size: 56, w: 740, bg: SONG_GREEN, sx: 3.0 }); tPlay.position.set(FX, 5.6, -1.2); qs.add(tPlay);

// ---------- 6段目. 夜空をのぞく道具（x=210）。三脚の望遠鏡と、ふたり ----------
const NX = 210;
starSky(NX, -36, 90, 50, 6);
{ const gr = box(20, 0.04, 20, mat('#1e2a24')); gr.position.set(NX, 0.02, -4); qs.add(gr); }
const SCOPE = new THREE.Group(); SCOPE.position.set(NX, 0, -1.2); qs.add(SCOPE);
{ for (let i = 0; i < 3; i++) { const lg = box(0.05, 1.5, 0.05, mat('#2a2a2e')); const a = i / 3 * Math.PI * 2; lg.position.set(Math.cos(a) * 0.3, 0.7, Math.sin(a) * 0.3); lg.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); SCOPE.add(lg); }
  const tube = new THREE.Group(); tube.position.y = 1.5; SCOPE.add(tube); SCOPE.userData.tube = tube;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.5, 20), new THREE.MeshStandardMaterial({ color: '#e8ecf2', metalness: 0.3, roughness: 0.4 })); body.rotation.z = Math.PI / 2; tube.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 20), mat('#1a1e2a')); lens.rotation.z = Math.PI / 2; lens.position.x = 0.78; tube.add(lens);
  const ep = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12), mat('#1a1e2a')); ep.rotation.z = Math.PI / 2; ep.position.x = -0.82; tube.add(ep);
  tube.rotation.z = 0.6; }
const boy6 = makePerson(BOY); boy6.scale.setScalar(0.82); boy6.position.set(NX - 1.05, 0, -1.2); boy6.rotation.y = Math.PI / 2; qs.add(boy6);
const girl6 = makePerson(GIRL); girl6.scale.setScalar(0.8); girl6.position.set(NX - 1.3, 0, -0.4); girl6.rotation.y = Math.PI * 0.75; qs.add(girl6);
const SHOOT = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.06), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, fog: false })); SHOOT.position.set(NX + 6, 12, -34); SHOOT.rotation.z = -0.35; qs.add(SHOOT);
const tTool = tag('夜空をのぞく道具', { size: 62, w: 580, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tTool.position.set(NX, 3.05, -0.6); qs.add(tTool);
const tKanji = tag('タイトルは漢字4文字', { size: 58, w: 640, bg: SONG_GREEN, sx: 1.7 }); tKanji.position.set(NX, 2.55, -0.6); qs.add(tKanji);

// ---------- shots ----------
const ALL = [tNight, tSneak, tPlan, tTwo, tHush, tYet, tWords, tGrown, tYear, tPlay, tTool, tKanji];
function base() { S.reset(); ALL.forEach(x => x.visible = false); LP2.intensity = 0; }
function walk(p, t, k = 1) { const ph = t * 8; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.5 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.4 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.4 * k; }

function shotHouse(t) { // 1段目 0〜9：みんなが寝しずまった、真夜中。こっそり家を出て、待ち合わせ場所へ（0秒目がサムネ）
  base(); S.aim(0, -4); lift(-40); S.hemi.intensity = 0.55; S.key.intensity = 0.35; S.darken(0.4, '#05071a');
  const out = clamp((t - 0.2) / 0.5); DOOR.rotation.y = -1.2 * out; DOOR.position.x = -0.4 * out;
  const w = clamp((t - 0.4) / 8.6);
  boy1.position.set(HOME.position.x + lerp(0, -3.6, w), 0, HOME.position.z + 1.9 + lerp(0, 2.6, ease(w)));
  boy1.rotation.y = lerp(0, -Math.PI / 2.6, clamp(w * 4)); walk(boy1, t, 0.8);
  boy1.userData.head.rotation.y = t < 3.5 ? 0.7 * Math.sin(t * 2.4) : 0.3;
  LIT.material.color.set(t > 3 ? '#1a1e2a' : '#ffd890');
  tNight.userData.pop(1); if (t > 4.6) tNight.visible = false;
  tSneak.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(-0.6, -1.4, u), lerp(1.9, 1.8, u), lerp(4.6, 3.9, u), lerp(-1.4, -2.2, u), 1.4, -4.2, 56);
  return qs;
}
function shotMeet(t) { // 2段目 9〜17：ふたりだけの、ないしょの計画。空のいちばん遠くを、この目で確かめたい
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 0.5; S.key.intensity = 0.3; S.darken(0.45, '#05071a'); LP2.intensity = 7;
  const w = ease(clamp(t / 2.4)); girl2.position.set(KX + lerp(3.6, 0.6, w), 0, lerp(-4, -1.2, w)); girl2.rotation.y = lerp(-Math.PI * 0.8, -0.6, w); walk(girl2, t, 1 - w);
  boy2.userData.arms[1].rotation.x = t > 2.6 && t < 3.6 ? -2.6 : 0;
  if (t > 4.2) { boy2.userData.head.rotation.x = -0.5 * ease((t - 4.2) / 0.8); girl2.userData.head.rotation.x = -0.5 * ease((t - 4.4) / 0.8); }
  tPlan.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tPlan.visible = false;
  tTwo.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.4, 0, u), lerp(1.8, 1.7, u), lerp(3.8, 3.2, u), KX, 1.4, -1.2, 56);
  return qs;
}
function shotField(t) { // 3段目 17〜25：息をひそめて、ふたりで空を見上げる。お目当てのものは、なかなか現れない
  base(); S.aim(CX, -2); lift(-20); S.hemi.intensity = 0.8; S.key.intensity = 0.3; S.darken(0.5, '#05071a');
  for (const p of [boy3, girl3]) p.userData.head.rotation.x = -0.6;
  boy3.userData.head.rotation.y = t > 5 ? 0.25 * ease((t - 5) / 0.6) : 0;
  SKY3.position.x = CX + t * 0.05;
  tHush.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tHush.visible = false;
  tYet.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX, lerp(1.5, 1.6, u), lerp(3.8, 3.4, u), CX, lerp(2.6, 4.0, u), -10, 60);
  return qs;
}
function shotBalcony(t) { // 4段目 25〜33：あの夜の気持ちは、言葉にできなかった。大人になった今でも、ときどき夜空を見上げる
  base(); S.aim(BX, 2); lift(-30); S.hemi.intensity = 0.85; S.key.intensity = 0.7; S.darken(0.45, '#05071a');
  man4.userData.arms.forEach(a => a.rotation.x = -0.9); man4.userData.head.rotation.x = t > 4.2 ? -0.55 * ease((t - 4.2) / 1.0) : 0;
  tWords.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tWords.visible = false;
  tGrown.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.7, 0.5, u), lerp(2.2, 2.3, u), lerp(2.8, 2.4, u), BX - 0.4, lerp(3.0, 3.5, u), -6, 58);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2001年に発売された、ロックバンドの曲。ストリーミングでも、2億回を超えた
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1;
  DISC.rotation.z = -t * 2.2; BARS.userData.update(t);
  tYear.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tYear.visible = false;
  tPlay.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(FX, 3.4, lerp(7.8, 7.2, u), FX, 3.5, -1.5, 56);
  return qs;
}
function shotScope(t, quiz = 0) { // 6段目 42〜49（決め手）：持ってきたのは、夜空をのぞく道具。タイトルは、漢字4文字
  base(); S.aim(NX, -2); lift(-30); S.hemi.intensity = 0.6; S.key.intensity = 0.4; S.darken(0.45, '#05071a');
  boy6.userData.head.rotation.x = -0.15; boy6.userData.arms.forEach(a => a.rotation.x = -1.2);
  girl6.userData.head.rotation.x = -0.5;
  const k = (t % 5) / 5; SHOOT.visible = k < 0.25; SHOOT.material.opacity = 1 - k * 4; SHOOT.position.set(NX + 6 - k * 24, 12 - k * 8, -34);
  if (!quiz) { tTool.userData.pop((t - 0.4) / 0.35); tKanji.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(1.6, 1.2, u), lerp(1.5, 1.7, u), lerp(3.4, 3.0, u), NX - 0.3, 1.8, -2, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？
  shotScope(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.6, 0.2, d);
  S.spot.color.set(0xd8e4ff); S.spot.position.set(NX, 6, 2); S.spot.target.position.set(NX - 0.4, 1, -1.2); S.spot.intensity = lerp(0, 45, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(1.8, 1.4, k), lerp(1.4, 1.3, k), lerp(3.8, 3.3, k), NX - 0.4, 1.4, -1.2, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotHouse },
  { a: 9, b: 17, f: shotMeet },
  { a: 17, b: 25, f: shotField },
  { a: 25, b: 33, f: shotBalcony },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: (t) => shotScope(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'みんなが寝しずまった、<br>真夜中。'],
  [5.6, 9.0, 'こっそり家を出て、<br>待ち合わせ場所へ。'],
  [9.2, 13.2, 'ふたりだけの、<br>ないしょの計画。'],
  [13.2, 17.0, '空のいちばん遠くを、<br>この目で確かめたい。'],
  [17.2, 21.0, '息をひそめて、<br>ふたりで空を見上げる。'],
  [21.0, 25.0, 'お目当てのものは、<br>なかなか現れない。'],
  [25.2, 29.0, 'あの夜の気持ちは、結局、<br>言葉にできなかった。'],
  [29.0, 33.0, '大人になった今でも、<br>ときどき夜空を見上げる。'],
  [33.2, 37.4, '2001年に発売された、<br>ロックバンドの曲。'],
  [37.4, 41.8, 'ストリーミングでも、<br>2億回を超えた。'],
  [42.2, 45.4, '持ってきたのは、<br>夜空をのぞく道具。'],
  [45.4, 49.0, 'タイトルは、<br>漢字4文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、BUMP OF CHICKENの、天体観測。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q038', v2: true, answer: '天体観測', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 3838,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'BUMP OF CHICKEN': 'バンプオブチキン', '天体観測': 'てんたいかんそく', '寝しずまった': 'ねしずまった', '真夜中': 'まよなか', 'お目当て': 'おめあて', '夜空': 'よぞら', '2001年': 'にせんいちねん', '2億回': 'におくかい', '漢字4文字': 'かんじよんもじ', '何秒': 'なんびょう' },
    caption: 'この曲のタイトル、わかる？\nみんなが寝しずまった、真夜中。こっそり家を出て、待ち合わせ場所へ。ふたりだけの、ないしょの計画。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '平成ソング'],
  },
});
applyQuizCards({ answer: '天体観測', info: 'BUMP OF CHICKEN｜2001年', answerSize: 140, kind: '曲' });
