import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard, setTop } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #010 今際の国のアリス（ドラマ・日本・シーズン1〜3。Netflixで見放題、justwatch.com/jp/テレビ番組/jin-ji-noguo-noarisu で2026/11/1確認。Filmarks シーズン1 3.9）
// 設定：優秀な弟と比べられ、人生に意味を見いだせない青年が、親友2人と渋谷へ。突然の閃光のあと、街は無人に。
//       生き延びるには命がけの「ゲーム」に参加するしかない。勝つとビザ（滞在の日数）がのびる。期限が切れると命の危険。
//       トランプのマークはゲームの種類、数字は難しさ（Filmarks 作品ページ・アシストオール の作品解説）
// 作品の映像・衣装・ロゴ・有名な場面の構図は使わない。実在の建物や看板も出さない。人が傷つく描写・血は一切出さない

const S = quizStage({ bg: '#8a96a8', floor: '#5a5e66', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(1010);

const HERO = { skin: '#f1c9a5', hair: '#1d1a19', shirt: '#3a4a5e', pants: '#2b3346' };
const PAL1 = { skin: '#e8b98f', hair: '#6b4a33', shirt: '#d97a3a', pants: '#3b3f4a' };
const PAL2 = { skin: '#f1c9a5', hair: '#1a1a22', shirt: '#2a2a2a', pants: '#5a4a3a' };
const PED = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f', '#f5d3b5', '#d9a57c'][i % 5], hair: ['#1d1a19', '#2c2421', '#4a3426', '#6b4a33', '#9a9a9a'][i % 5], shirt: ['#2f4a7a', '#e05a4f', '#3f8f6b', '#f2c14e', '#8e6bbf', '#e9e4da', '#4fa3d1', '#59606e'][i % 8], pants: ['#2b3346', '#3b3f4a', '#5a4a3a', '#1f2430'][i % 4], long: i % 3 === 1, skirt: i % 6 === 4 });

// トランプ（自作の図柄。マークと数字だけ）
const SUITS = { s: ['♠', '#1a1a22'], h: ['♥', '#d6283a'], d: ['♦', '#d6283a'], c: ['♣', '#1a1a22'] };
function cardTex(suit, num) { const [sym, col] = SUITS[suit]; return canvasTex(256, 360, (g, w, h) => { g.fillStyle = '#fbfaf5'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 22); g.fill(); g.strokeStyle = '#c9c4b4'; g.lineWidth = 4; g.stroke(); g.fillStyle = col; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(num, 22, 16); g.font = '900 150px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, w / 2, h / 2 + 14); }); }
function card(suit, num, s = 1) { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0 * s, 1.4 * s), new THREE.MeshBasicMaterial({ map: cardTex(suit, num), transparent: true, side: THREE.FrontSide })); g.add(f); const bk = new THREE.Mesh(new THREE.PlaneGeometry(1.0 * s, 1.4 * s), new THREE.MeshBasicMaterial({ color: '#7a1a24' })); bk.rotation.y = Math.PI; g.add(bk); return g; }

// ---------- 1〜3段目. 交差点（x=0） ----------
const CITY = new THREE.Group(); CITY.position.set(0, 0, 0); qs.add(CITY);
const SCREENS = [];
{ const road = box(30, 0.04, 30, mat('#3a3c44')); road.position.y = 0.02; CITY.add(road);
  for (let i = 0; i < 8; i++) { const zb = box(0.5, 0.05, 4.2, mat('#e8e8e8')); zb.position.set(-3.5 + i * 1.0, 0.05, 0.4); CITY.add(zb); const zb2 = box(4.2, 0.05, 0.5, mat('#e8e8e8')); zb2.position.set(-6.2, 0.05, -3.0 + i * 0.9); zb2.visible = i < 6; CITY.add(zb2); }
  for (let i = 0; i < 10; i++) { const w = 2.6 + R() * 1.4, h = 8 + R() * 10, d = 3; const wt = windowTextures(200 + i, ['#7a8498', '#9aa2b2', '#6a7284'][i % 3]); wt.map.repeat.set(w / 2, h / 2.5); wt.emi.repeat.set(w / 2, h / 2.5); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 0.3 })); b.position.set(-11 + i * 2.6, h / 2, -7 - (i % 2) * 1.6); b.castShadow = true; CITY.add(b); b.userData.wt = b.material; SCREENS.push(b.material); }
  // 大型ビジョン（無地の色だけ）
  const vis = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshBasicMaterial({ color: '#4fa3d1' })); vis.position.set(-5.0, 5.0, -5.4); CITY.add(vis); CITY.userData.vis = vis;
  for (const [x, z] of [[-4.6, 3.2], [4.4, 3.4], [-4.6, -2.2]]) { const pole = box(0.12, 3.2, 0.12, mat('#4a4a50')); pole.position.set(x, 1.6, z); CITY.add(pole); const sig = box(0.3, 0.7, 0.24, mat('#222')); sig.position.set(x, 3.0, z); CITY.add(sig); } }
const CROWD = []; for (let i = 0; i < 26; i++) { const p = makePerson(PED(i)); const a = R() * Math.PI * 2, r = 1.8 + R() * 4.5; p.userData.base = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r * 0.7 - 0.6); p.userData.dir = R() * Math.PI * 2; p.position.copy(p.userData.base); qs.add(p); CROWD.push(p); }
const hero = makePerson(HERO); hero.position.set(0, 0, 1.6); qs.add(hero);
const pal1 = makePerson(PAL1); pal1.position.set(-0.9, 0, 1.9); pal1.rotation.y = 0.3; qs.add(pal1);
const pal2 = makePerson(PAL2); pal2.position.set(0.9, 0, 1.9); pal2.rotation.y = -0.3; qs.add(pal2);
const tPals = tag('親友2人と', { size: 80, bg: '#e6b450', color: '#14161c' }); tPals.position.set(0, 2.6, 1.8); qs.add(tPals);
const tEmpty = tag('人が消えた', { size: 84, bg: '#e2483c' }); tEmpty.position.set(0, 2.6, 1.8); qs.add(tEmpty);
const FLASH = new THREE.PointLight(0xffffff, 0, 60, 0.6); FLASH.position.set(0, 12, 2); qs.add(FLASH);
const MOONL = new THREE.PointLight(0xb8c8ff, 0, 12, 1.2); MOONL.position.set(0, 3.2, 4.5); qs.add(MOONL);

// ---------- 4段目. 夜のゲーム会場（x=26） ----------
const VENUE = new THREE.Group(); VENUE.position.set(26, 0, 0); qs.add(VENUE);
let LAMPS = [];
{ const bld = box(9, 6, 4, mat('#3a3e48')); bld.position.set(0, 3, -4.2); VENUE.add(bld);
  const door = box(2.4, 2.6, 0.1, new THREE.MeshBasicMaterial({ color: '#ffe8b0' })); door.position.set(0, 1.3, -2.15); VENUE.add(door);
  const sT = canvasTex(1024, 192, (g, w, h) => { g.fillStyle = '#1a1a22'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff5a4a'; g.font = '900 108px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ゲ ー ム 会 場', w / 2, h / 2 + 6); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.94), new THREE.MeshBasicMaterial({ map: sT })); sign.position.set(0, 3.6, -2.14); VENUE.add(sign);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff5a4a' })); l.position.set(-2.5 + i * 1.0, 4.4, -2.12); VENUE.add(l); LAMPS.push(l); }
  const gl = new THREE.PointLight(0xffd8a0, 0, 10, 1.3); gl.position.set(0, 2.2, -0.6); VENUE.add(gl); VENUE.userData.gl = gl; }
const H3 = [HERO, PAL1, PAL2].map((o, i) => { const p = makePerson(o); p.position.set(25.1 + i * 0.9, 0, 1.2); p.rotation.y = Math.PI; qs.add(p); return p; });
const tLife = tag('命がけ', { size: 90, bg: '#e2483c' }); tLife.position.set(26, 2.45, -0.4); qs.add(tLife);

// ---------- 6段目（決め手）. トランプのルール（x=50） ----------
const RULES = new THREE.Group(); RULES.position.set(50, 0, 0); qs.add(RULES);
const CARDS = [['s', 'A', '体力'], ['h', '7', '心理'], ['d', 'Q', '知能'], ['c', '3', 'バランス']].map(([su, n, lab], i) => { const c = card(su, n, 0.72); const x = 48.08 + i * 0.95, y = 2.7; c.userData.home = new THREE.Vector3(x, y, -0.5); c.position.copy(c.userData.home); qs.add(c); const t = tag(lab, { size: lab.length > 2 ? 46 : 60, w: 250, bg: '#14161c' }); t.position.set(x, 3.55 + (i % 2) * 0.0, -0.3); qs.add(t); c.userData.t = t; return c; });
const NUMS = [['s', '2'], ['s', '5'], ['s', '9'], ['s', 'K']].map(([su, n], i) => { const c = card(su, n, 0.7); c.position.set(48.0 + i * 1.0, 2.6, -0.5); qs.add(c); return c; });
const tNum = tag('数字＝むずかしさ', { size: 66, w: 560 }); tNum.position.set(49.5, 3.75, -0.3); qs.add(tNum);
const ARROW = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 3), new THREE.MeshBasicMaterial({ color: '#e6b450' })); ARROW.rotation.z = -Math.PI / 2; qs.add(ARROW);
const BAR = box(3.0, 0.08, 0.02, new THREE.MeshBasicMaterial({ color: '#e6b450' })); qs.add(BAR);

// ---------- 5段目. ビザの日数（x=74） ----------
const ROOM = new THREE.Group(); ROOM.position.set(74, 0, 0); qs.add(ROOM);
const VISA_C = document.createElement('canvas'); VISA_C.width = 768; VISA_C.height = 512;
const VISA_T = new THREE.CanvasTexture(VISA_C); VISA_T.colorSpace = THREE.SRGBColorSpace;
let lastVisa = '';
function drawVisa(days, warn) { const key = days + (warn ? 'w' : ''); if (key === lastVisa) return; lastVisa = key; const g = VISA_C.getContext('2d'); const w = 768, h = 512; g.fillStyle = '#101218'; g.fillRect(0, 0, w, h); g.strokeStyle = warn ? '#e2483c' : '#e6b450'; g.lineWidth = 12; g.strokeRect(14, 14, w - 28, h - 28); g.fillStyle = '#cfd6df'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ビザの残り', w / 2, 120); g.fillStyle = warn ? '#e2483c' : '#ffffff'; g.font = '900 210px "Noto Sans CJK JP", sans-serif'; g.fillText(`${days}日`, w / 2, 320); VISA_T.needsUpdate = true; }
drawVisa(1, false);
{ const back = box(10, 4.6, 0.2, mat('#2a2e36')); back.position.set(0, 2.3, -3); ROOM.add(back);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), new THREE.MeshBasicMaterial({ map: VISA_T })); scr.position.set(0, 2.6, -2.88); ROOM.add(scr);
  const gl = new THREE.PointLight(0xc8d8ff, 4, 8, 1.3); gl.position.set(0, 2.4, -1.0); ROOM.add(gl); }
const hero5 = makePerson(HERO); hero5.position.set(75.2, 0, 0.9); hero5.rotation.y = Math.PI * 0.92; qs.add(hero5);
const tVisa = tag('勝てば日数がのびる', { size: 64, w: 600, bg: '#e6b450', color: '#14161c' }); tVisa.position.set(74, 4.25, -2.6); qs.add(tVisa);
const tOut = tag('切れたら終わり', { size: 70, w: 520, bg: '#e2483c' }); tOut.position.set(74, 4.25, -2.6); qs.add(tOut);

// ---------- クイズの間：夜の無人の街に、浮かぶカード（x=0 の交差点を夜に） ----------
const SKYCARDS = [['h', 'K'], ['s', '10'], ['d', '4'], ['c', 'J'], ['h', '2']].map(([su, n], i) => { const c = card(su, n, 1.3); c.userData.a = i / 5 * Math.PI * 2; qs.add(c); return c; });

// ---------- 1段目の光（空に浮かぶ白い光。だんだん大きくなる） ----------
const glowTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,250,235,.9)'); gr.addColorStop(0.6, 'rgba(220,235,255,.35)'); gr.addColorStop(1, 'rgba(200,220,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const GLOW = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
GLOW.position.set(0.5, 5.7, -3.0); GLOW.renderOrder = 5; qs.add(GLOW);

// ---------- shots ----------
const ALLTAG = [tPals, tEmpty, tLife, tNum, tVisa, tOut, ...CARDS.map(c => c.userData.t)];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); FLASH.intensity = 0; MOONL.intensity = 0; VENUE.userData.gl.intensity = 0; SKYCARDS.forEach(c => c.visible = false); ARROW.visible = false; BAR.visible = false; GLOW.visible = false; CARDS.forEach(c => c.visible = false); NUMS.forEach(c => c.visible = false); CITY.userData.vis.visible = true; CROWD.forEach(p => p.visible = true); [hero, pal1, pal2].forEach(p => { p.visible = true; p.userData.head.rotation.set(0, 0, 0); }); }
function walkCrowd(T) { CROWD.forEach((p, i) => { const d = p.userData.dir, s = ((T * 0.7 + i * 0.37) % 4) - 2; p.position.set(p.userData.base.x + Math.cos(d) * s, 0, p.userData.base.z + Math.sin(d) * s * 0.6); p.rotation.y = Math.atan2(Math.cos(d), Math.sin(d) * 0.6); const ph = T * 8 + i; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45; }); }
function whiteOut(k) { if (k <= 0) return; S.scene.background.lerp(new THREE.Color('#ffffff'), k); S.scene.fog.color.copy(S.scene.background); }

function shotGlow(t) { // 1段目 0〜9：人であふれる交差点の空に、白い光（0秒目がサムネ）
  base(); S.aim(0, 0); lift(120);
  walkCrowd(3.1); // 歩いていた人がみんな足を止めて、空を見上げている
  CROWD.forEach((p, i) => { p.userData.legs[0].rotation.x = 0; p.userData.legs[1].rotation.x = 0; p.rotation.y = Math.PI + (i % 5 - 2) * 0.25; p.userData.head.rotation.x = -0.55; });
  [hero, pal1, pal2].forEach(p => { p.rotation.y = Math.PI; p.userData.head.rotation.x = -0.55; });
  CITY.userData.vis.visible = false;
  GLOW.visible = true; const gs = lerp(5.5, 10, ease(t / 6.5)) * (1 + 0.06 * Math.sin(t * 9)); GLOW.scale.set(gs, gs, 1);
  const fl = clamp((t - 6.0) / 2.2);
  FLASH.intensity = 30 + fl * 260; whiteOut(0.15 + fl * 0.85);
  const u = ease(t / 9);
  look(lerp(0.6, 0.2, u), lerp(1.6, 1.3, u), lerp(10.4, 9.0, u), 0.3, lerp(4.6, 5.4, u), -2.0, 58);
  return qs;
}
function shotFlash(t) { // 2段目 9〜17：光が消えると、街から人が消えていた（主人公と親友2人）
  base(); S.aim(0, 0); lift(200);
  CROWD.forEach(p => p.visible = false);
  whiteOut(1 - clamp(t / 1.4)); FLASH.intensity = (1 - clamp(t / 1.4)) * 200;
  CITY.userData.vis.material.color.set('#1a1c22');
  [hero, pal1, pal2].forEach((p, i) => { p.rotation.y = 0; p.userData.head.rotation.y = t > 1.6 ? Math.sin(t * 1.5 + i * 2) * 0.6 : 0; });
  tEmpty.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(0.4, 0.2, u), lerp(3.4, 5.6, u), lerp(8.0, 9.6, u), 0, lerp(2.0, 1.4, u), 0, 54);
  return qs;
}
const DARK = '#05070e';
function shotEmpty(t) { // 3段目 17〜25：静まり返った無人の街。日が暮れていく
  base(); S.aim(0, 0); lift(170);
  CROWD.forEach(p => p.visible = false); CITY.userData.vis.material.color.set('#1a1c22');
  const d = 0.35 + 0.45 * ease(t / 8);
  S.hemi.intensity = lerp(1.25, 0.25, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK); MOONL.intensity = 5 * d;
  [hero, pal1, pal2].forEach((p, i) => { p.rotation.y = Math.PI + (i - 1) * 0.5; p.userData.head.rotation.y = Math.sin(t * 0.8 + i) * 0.4; });
  const u = ease(t / 8);
  look(lerp(-3.0, 3.0, u), lerp(7.5, 6.0, u), lerp(14.0, 12.5, u), 0, 1.6, -1.0, 56);
  return qs;
}
function shotVenue(t) { // 4段目 25〜33：生き延びるには、命がけのゲームに参加するしかない
  base(); S.aim(26, -1); lift(200);
  S.hemi.intensity = 0.35; S.key.intensity = 0.2; S.darken(0.75, '#0a0c14');
  VENUE.userData.gl.intensity = 8;
  LAMPS.forEach((l, i) => l.material.color.set(Math.floor(t * 4 + i) % 2 ? '#ff5a4a' : '#5a1a14'));
  H3.forEach((p, i) => { const k = ease((t - 1) / 4); p.position.z = lerp(1.6, 0.4, k); const ph = t * 6 + i; const mv = t > 1 && t < 5 ? 1 : 0; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.4 * mv; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.4 * mv; });
  tLife.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(26.6, 26.0, u), lerp(2.4, 2.6, u), lerp(7.8, 7.0, u), 26, 2.0, -1.6, 54);
  return qs;
}
function shotVisa(t) { // 5段目 33〜42：舞台は人の消えた渋谷。勝てばビザの日数がのびていく
  base(); S.aim(74, 0); lift(200);
  S.hemi.intensity = 0.35; S.key.intensity = 0.2; S.darken(0.75, '#0a0c14');
  drawVisa(t < 4.6 ? 1 : t < 6.4 ? 4 : 7, false);
  tVisa.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 9);
  look(lerp(74.8, 74.2, u), lerp(2.4, 2.6, u), lerp(6.8, 6.2, u), 74, 2.5, -1.8, 54);
  return qs;
}
function shotRules(t) { // 6段目 42〜49（決め手）：トランプのマークは種類、数字はむずかしさ
  base(); S.aim(50, 0); lift(200);
  S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.85, '#0c0e16');
  const phase2 = t > 3.4;
  CARDS.forEach((c, i) => { const k = easeOut(clamp((t - 0.3 - i * 0.35) / 0.4)); c.visible = !phase2 && k > 0; c.position.copy(c.userData.home); c.rotation.y = (1 - k) * Math.PI; c.userData.t.visible = !phase2 && k >= 1; });
  NUMS.forEach((c, i) => { const k = easeOut(clamp((t - 3.5 - i * 0.25) / 0.35)); c.visible = phase2 && k > 0; c.rotation.y = (1 - k) * Math.PI; c.position.y = 2.4 + i * 0.12; });
  if (phase2) { tNum.userData.pop((t - 4.6) / 0.35); BAR.visible = t > 4.4; BAR.position.set(49.5, 1.7, -0.45); ARROW.visible = BAR.visible; ARROW.position.set(51.05, 1.7, -0.45); }
  const u = ease(t / 7);
  look(lerp(49.6, 49.5, u), 2.6, lerp(7.6, 6.9, u), 49.5, 2.6, -0.5, 54);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマわかった？（夜の無人の街に浮かぶカード）
  base(); S.aim(0, 0); lift(190);
  S.hemi.intensity = 0.2; S.key.intensity = 0; S.darken(1, DARK); MOONL.intensity = 6;
  CROWD.forEach(p => p.visible = false); CITY.userData.vis.material.color.set('#1a1c22');
  [hero, pal1, pal2].forEach(p => { p.userData.head.rotation.x = -0.5; });
  SKYCARDS.forEach((c, i) => { c.visible = true; const a = c.userData.a + (t + 7) * 0.25; c.position.set(Math.cos(a) * 2.6, 4.3 + Math.sin(t + 7 + i) * 0.2, Math.sin(a) * 1.4 - 1.4); c.rotation.y = Math.sin(a) * 0.35; c.scale.setScalar(easeOut(clamp((t - i * 0.15) / 0.5))); });
  const k = ease(t / 7);
  look(0, lerp(1.8, 3.0, k), lerp(8.8, 11.4, k), 0, lerp(3.4, 3.2, k), 0, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotGlow },
  { a: 9, b: 17, f: shotFlash },
  { a: 17, b: 25, f: shotEmpty },
  { a: 25, b: 33, f: shotVenue },
  { a: 33, b: 42, f: shotVisa },
  { a: 42, b: 49, f: shotRules },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '人であふれる、<br>いつもの交差点。'],
  [5.6, 9.0, 'その時、<br>突然の閃光。'],
  [9.2, 13.2, '人生に意味を見いだせない<br>青年と、親友2人。'],
  [13.2, 17.0, '気がつくと、<br>街から人が消えていた。'],
  [17.2, 21.0, '静まり返った、<br>無人の街。'],
  [21.0, 25.0, 'ここは、いったい<br>どこなのか。'],
  [25.2, 29.0, '生き延びるには、'],
  [29.0, 33.0, '命がけのゲームに、<br>参加するしかない。'],
  [33.2, 37.4, '舞台は、人の消えた<br>渋谷の街。'],
  [37.4, 41.8, '勝てば、ビザの日数が<br>のびていく。'],
  [42.2, 45.6, 'トランプのマークは、<br>ゲームの種類。'],
  [45.6, 49.0, '数字は、むずかしさ。<br>誰が、何のために？'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>今際の国のアリス。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotVenue || f === shotRules || f === shotVisa,
  meta: {
    id: 'q010', v2: true, answer: '今際の国のアリス',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 1010,
    hits: [7.6, 29.0, 42.2, 56.4], risers: [5.6, 52.0],
    impacts: [0.3, 7.6, 13.4, 42.2, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '見いだせない': 'みいだせない', '静まり返った': 'しずまりかえった', '生き延びる': 'いきのびる', '今際の国': 'いまわのくに', '交差点': 'こうさてん', '命がけ': 'いのちがけ', '親友': 'しんゆう', '2人': 'ふたり', '渋谷': 'しぶや', '閃光': 'せんこう', '種類': 'しゅるい', '誰': 'だれ' },
    caption: 'このドラマのタイトル、わかる？\n人であふれるいつもの交差点に、突然の閃光。人生に意味を見いだせない青年と親友2人が気がつくと、街から人が消えていた。ここは、いったいどこなのか。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '日本のドラマ', 'サバイバル'],
  },
});
applyQuizCards({ answer: '今際の国の<br>アリス', info: 'Netflix｜日本・シーズン1〜3', answerSize: 112 });
