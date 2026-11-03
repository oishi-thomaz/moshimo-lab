import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #026 VIVANT（ドラマ・日本・2023年・TBS日曜劇場・全10話。Disney+・Hulu・U-NEXT・Prime Video・Netflixで見放題、justwatch.com/jp/テレビ番組/vivant で2026/11/3確認。
//   Filmarks 4.3・レビュー8.7万件 filmarks.com/dramas/13313/18304）
// 確かめた事実：
//   ・第1話：丸菱商事エネルギー事業部の社員・乃木憂助が、1千万ドルを1億ドルと誤って送金した件で犯人と間違われる。中央アジアのバルカ共和国へ向かう途中、
//     タクシーの運転手にだまされて砂漠に置き去りにされる。爆発事件の犯人として現地警察に追われ、日本人医師の柚木薫・公安の刑事の野崎守らと日本大使館を目指す
//     （news.allabout.co.jp/articles/o/64048/）
//   ・TBS系 日曜劇場。全10話。第1話は「VIVANTとは何者なのか。敵か味方かもわからないまま」始まる。第2話で野崎は「ヴィヴァン」という言葉に引っかかる（Filmarks の各話紹介）
// 構成（ヒント6段）：1 送金の金額にゼロがひとつ多い → 2 疑われたのはまじめな商社マン、異国へ → 3 灼熱の砂漠に置き去り
//   → 4 公安の刑事と日本人の医師、爆発事件の犯人として追われる → 5 日本の日曜劇場、中央アジアの国、敵か味方か → 6 決め手：日本大使館を目指して逃げる、タイトルは謎の言葉
// 第2話以降の正体・どんでん返し（組織の名前・家族の秘密など）には一切触れない。爆発の場面・けが・人が亡くなる場面は出さない。俳優・ポスター・ロゴ・実在の会社名は使わない

const S = quizStage({ bg: '#c8a878', floor: '#c89a62', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(2626);

const HERO = { skin: '#efcfae', hair: '#1d1a19', shirt: '#2e3644', pants: '#2a2e38', tie: true };
const COP = { skin: '#e8b98f', hair: '#2c2421', shirt: '#3a3a3a', pants: '#2a2a2a', tie: true, scale: 1.08 };
const DOC = { skin: '#f5d3b5', hair: '#2c2421', shirt: '#f4f4f4', pants: '#4a5a7a', long: true };
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.55 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.55 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.45 * k; }

// ---------- 1. 送金の画面（x=0）。0秒目がサムネ ----------
{ const g = new THREE.Group(); qs.add(g);
  const fl = box(10, 0.1, 7, mat('#4a4e58')); fl.position.y = 0.05; g.add(fl);
  const wl = box(10, 4, 0.2, mat('#2a2e38')); wl.position.set(0, 2, -2.4); g.add(wl);
  const desk = box(2.4, 0.06, 0.9, mat('#d8d8d4')); desk.position.set(0, 0.75, 0.2); g.add(desk);
  const mon = box(2.6, 1.5, 0.08, mat('#14161c')); mon.position.set(0, 2.1, -2.2); g.add(mon); }
const MON_C = document.createElement('canvas'); MON_C.width = 1024; MON_C.height = 576; const MON_T = new THREE.CanvasTexture(MON_C); MON_T.colorSpace = THREE.SRGBColorSpace;
let lastMon = '';
function drawMon(n, red) { const k = n + (red ? 'r' : ''); if (k === lastMon) return; lastMon = k; const g = MON_C.getContext('2d'); g.fillStyle = '#e8eef4'; g.fillRect(0, 0, 1024, 576); g.fillStyle = '#2a4a7a'; g.fillRect(0, 0, 1024, 96); g.fillStyle = '#ffffff'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('送金', 512, 50); g.fillStyle = red ? '#d0261d' : '#1a1a22'; g.font = `900 ${n.length > 12 ? 104 : 116}px "Noto Sans CJK JP", sans-serif`; g.fillText(n, 512, 300); g.fillStyle = '#5a6070'; g.font = '700 44px "Noto Sans CJK JP", sans-serif'; g.fillText('USドル', 512, 440); if (red) { g.strokeStyle = '#d0261d'; g.lineWidth = 14; g.strokeRect(20, 120, 984, 420); } MON_T.needsUpdate = true; }
drawMon('$10,000,000', false);
const SCREEN = new THREE.Mesh(new THREE.PlaneGeometry(2.44, 1.37), new THREE.MeshBasicMaterial({ map: MON_T, fog: false })); SCREEN.position.set(0, 2.1, -2.15); qs.add(SCREEN);
const hero1 = makePerson(HERO); hero1.position.set(1.15, 0, 0.9); hero1.rotation.y = Math.PI; qs.add(hero1);
const WORK = [0, 1].map(i => { const p = makePerson({ skin: '#e8b98f', hair: ['#2c2421', '#5a5a5a'][i], shirt: ['#f4f4f4', '#3a4050'][i], pants: '#2a2e38', tie: true }); p.position.set(i ? 1.9 : -1.4, 0, 0.5 + i * 0.4); p.rotation.y = Math.PI + (i ? 0.3 : -0.3); qs.add(p); return p; });
const tZero = tag('ゼロがひとつ多い', { size: 64, w: 560, bg: '#e2483c', sx: 1.6 }); tZero.position.set(0, 3.25, -1.9); qs.add(tZero);

// ---------- 2. 空港の滑走路と飛行機（x=30） ----------
{ const g = new THREE.Group(); g.position.set(30, 0, 0); qs.add(g);
  const rw = box(40, 0.04, 6, mat('#5a5a5e')); rw.position.y = 0.02; g.add(rw);
  for (let i = 0; i < 12; i++) { const l = box(1.4, 0.05, 0.16, mat('#f4f4f4')); l.position.set(-16 + i * 3, 0.05, 0); g.add(l); } }
const PLANE = new THREE.Group(); { const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 7, 16), mat('#f4f4f4')); body.rotation.z = Math.PI / 2; PLANE.add(body); const nose = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10), mat('#f4f4f4')); nose.position.x = 3.5; nose.scale.x = 1.4; PLANE.add(nose); const wing = box(1.6, 0.08, 7, mat('#d8dce0')); wing.position.set(0.2, -0.1, 0); PLANE.add(wing); const tail = box(1.0, 1.6, 0.08, mat('#3a5a8a')); tail.position.set(-3.1, 0.9, 0); PLANE.add(tail); const st = box(7, 0.14, 1.12, mat('#3a5a8a')); st.position.y = 0.1; st.scale.z = 1; PLANE.add(st); } qs.add(PLANE);
const hero2 = makePerson(HERO); qs.add(hero2);
const CASE = box(0.42, 0.3, 0.1, mat('#2a1e16')); qs.add(CASE);
const tSus = tag('疑われた商社マン', { size: 64, w: 560, bg: '#14161c', sx: 1.15 }); qs.add(tSus);
const tAbroad = tag('遠い異国へ', { size: 76, w: 420, bg: '#e6b450', color: '#14161c', sx: 2.0 }); qs.add(tAbroad);

// ---------- 3・6・クイズ. 砂漠（x=60〜） ----------
const DX = 60;
const DUNES = []; for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(5 + R() * 4, 18, 10), mat(['#d8a868', '#c89a5a', '#e0b478'][i % 3])); d.position.set(DX - 24 + i * 7, -3.6, -10 - (i % 3) * 5); d.scale.y = 0.55; qs.add(d); DUNES.push(d); }
const SUN = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: '#fff0c0', fog: false })); SUN.position.set(DX + 4, 11, -30); qs.add(SUN);
const MOON = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ color: '#f4f0dc', fog: false })); MOON.position.set(DX + 4, 11, -30); qs.add(MOON);
const HEAT = new THREE.PointLight(0xffa040, 0, 20, 1); HEAT.position.set(DX, 6, 4); qs.add(HEAT);
const hero3 = makePerson(HERO); qs.add(hero3);
const TAXI = new THREE.Group(); { const b = box(2.4, 0.6, 1.2, mat('#d8c040')); b.position.y = 0.55; TAXI.add(b); const c = box(1.3, 0.5, 1.1, mat('#d8c040')); c.position.set(-0.1, 1.1, 0); TAXI.add(c); const w = box(1.2, 0.36, 1.14, mat('#2a3440')); w.position.set(-0.1, 1.12, 0); TAXI.add(w); for (const x of [-0.8, 0.8]) for (const z of [-0.62, 0.62]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 14), mat('#1a1a1c')); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.28, z); TAXI.add(wh); } } qs.add(TAXI);
const DUSTP = [0, 1, 2, 3, 4].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: '#e8d0a0', transparent: true, opacity: 0.6 })); qs.add(d); return d; });
const tLeft = tag('砂漠に置き去り', { size: 70, w: 520, bg: '#e2483c', sx: 1.7 }); qs.add(tLeft);

// ---------- 4. 夜の街角（x=100）：公安の刑事と、日本人の医師。追ってくる赤い光 ----------
const NX = 100;
{ const g = new THREE.Group(); g.position.set(NX, 0, 0); qs.add(g);
  const st = box(16, 0.04, 8, mat('#8a7a62')); st.position.y = 0.02; g.add(st);
  for (let i = 0; i < 6; i++) { const h = 3 + (i % 3) * 0.8; const b = box(2.6, h, 2.6, mat(['#c8a878', '#b89868', '#d0b080'][i % 3])); b.position.set(-6.5 + i * 2.7, h / 2, -4.2); g.add(b); const dm = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#8aa0a8')); dm.position.set(-6.5 + i * 2.7, h, -4.2); dm.visible = i % 2 === 0; g.add(dm);
    const dr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), new THREE.MeshBasicMaterial({ color: '#ffd890' })); dr.position.set(-6.5 + i * 2.7, 0.6, -2.88); g.add(dr); } }
const TRIO = [HERO, COP, DOC].map((o, i) => { const p = makePerson(o); qs.add(p); return p; });
const SIREN = new THREE.PointLight(0xff2a1a, 0, 14, 1.0); SIREN.position.set(NX - 5, 2, 2); qs.add(SIREN);
const SIREN2 = new THREE.PointLight(0x2a5aff, 0, 14, 1.0); SIREN2.position.set(NX - 5, 2, 2); qs.add(SIREN2);
const tCop = tag('公安の刑事', { size: 66, w: 400, bg: '#14161c', sx: 1.0 }); qs.add(tCop);
const tDoc = tag('日本人の医師', { size: 66, w: 440, bg: '#14161c', sx: 1.1 }); qs.add(tDoc);
const tChase = tag('爆発事件の犯人に', { size: 64, w: 560, bg: '#e2483c', sx: 1.5 }); qs.add(tChase);

// ---------- 5. 地図（x=130）：日本から中央アジアへ ----------
const MX = 130;
{ const board = box(8, 0.1, 6, mat('#2a2e36')); board.position.set(MX, 0.05, 0); qs.add(board);
  const tex = canvasTex(800, 600, (g, w, h) => { g.fillStyle = '#a8c8dc'; g.fillRect(0, 0, w, h); g.fillStyle = '#e4d6b4'; g.beginPath(); g.moveTo(0, 80); g.bezierCurveTo(200, 40, 520, 60, 640, 120); g.bezierCurveTo(660, 260, 600, 420, 520, 470); g.bezierCurveTo(380, 520, 200, 560, 0, 540); g.closePath(); g.fill(); g.beginPath(); g.moveTo(700, 230); g.bezierCurveTo(740, 250, 760, 330, 720, 400); g.bezierCurveTo(700, 420, 690, 360, 700, 230); g.fill(); g.fillStyle = '#d8b878'; g.beginPath(); g.ellipse(250, 260, 120, 80, 0, 0, Math.PI * 2); g.fill(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 5.85), new THREE.MeshLambertMaterial({ map: tex })); m.rotation.x = -Math.PI / 2; m.position.set(MX, 0.11, 0); qs.add(m); }
const PIN_J = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), mat('#e2483c')); PIN_J.position.set(MX + 3.25, 0.17, 0.4); qs.add(PIN_J);
const PIN_C = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), mat('#e2483c')); PIN_C.position.set(MX - 1.45, 0.17, -0.3); qs.add(PIN_C);
const ARC = []; for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#e6b450' })); const u = i / 13; d.position.set(lerp(MX + 3.25, MX - 1.45, u), 0.2 + Math.sin(u * Math.PI) * 1.2, lerp(0.4, -0.3, u)); qs.add(d); ARC.push(d); }
const tSun = tag('日本の日曜劇場', { size: 66, w: 520, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tSun.position.set(MX + 0.2, 1.0, -2.4); qs.add(tSun);
const tAsia = tag('中央アジアの国が舞台', { size: 60, w: 660, bg: '#14161c', sx: 3.6 }); tAsia.position.set(MX + 0.2, 1.0, -1.2); qs.add(tAsia);
const tTrust = tag('敵か味方か', { size: 80, w: 440, bg: '#e2483c', sx: 2.8 }); tTrust.position.set(MX + 0.2, 1.0, -2.0); qs.add(tTrust);

// 6. 夜の砂漠の先に、日の丸の旗の建物
const EMB = new THREE.Group(); EMB.position.set(DX + 6, 0, -7); qs.add(EMB);
{ const b = box(5, 2.4, 2.4, mat('#e8e0d0')); b.position.y = 1.2; EMB.add(b); const wl = box(9, 1.2, 0.3, mat('#d8d0c0')); wl.position.set(0, 0.6, 1.6); EMB.add(wl); const pole = box(0.08, 4, 0.08, mat('#c8c8c8')); pole.position.set(2.0, 2.0, 1.6); EMB.add(pole);
  const flagT = canvasTex(300, 200, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#bc002d'; g.beginPath(); g.arc(w / 2, h / 2, 60, 0, Math.PI * 2); g.fill(); });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: flagT, side: THREE.DoubleSide })); flag.position.set(2.62, 3.55, 1.6); EMB.add(flag); EMB.userData.flag = flag;
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); w.position.set(-1.8 + i * 0.9, 1.5, 1.21); EMB.add(w); } }
const tEmb = tag('目指すは日本大使館', { size: 62, w: 600, bg: '#14161c', sx: 2.3 }); qs.add(tEmb);
const tWord = tag('タイトル＝謎の言葉', { size: 62, w: 600, bg: '#e6b450', color: '#14161c', sx: 2.3 }); qs.add(tWord);

// ---------- shots ----------
const ALL = [tZero, tSus, tAbroad, tLeft, tCop, tDoc, tChase, tSun, tAsia, tTrust, tEmb, tWord];
function base() { S.reset(); ALL.forEach(x => x.visible = false); HEAT.intensity = 0; SIREN.intensity = 0; SIREN2.intensity = 0; SUN.visible = false; MOON.visible = false; EMB.visible = false; TAXI.visible = false; TRIO.forEach(p => p.visible = false); hero2.visible = false; hero3.visible = false; CASE.visible = false; DUSTP.forEach(d => d.visible = false); PLANE.visible = false; }

function shotMoney(t, T) { // 0〜9：送金の金額に、ゼロがひとつ多い（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-60);
  S.darken(0.6, '#0e1220'); S.hemi.intensity = 0.8;
  const zeros = T < 2.0 ? '$10,000,000' : '$100,000,000';
  drawMon(zeros, T >= 2.0);
  SCREEN.scale.setScalar(T >= 2.0 && T < 2.3 ? 1.04 : 1);
  WORK.forEach((p, i) => { p.userData.head.rotation.y = T > 2.4 ? (i ? 0.5 : -0.5) * ease((T - 2.4) / 0.5) : 0; });
  hero1.userData.head.rotation.x = -0.1; hero1.userData.arms.forEach(a => a.rotation.x = T > 2.2 ? -0.5 : 0);
  tZero.userData.pop((T - 2.4) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.0, 0.1, u), lerp(2.6, 2.5, u), lerp(5.2, 4.4, u), 0.1, 1.9, -1.6, 54);
  return qs;
}
function shotFly(t) { // 9〜17：疑われたのは、まじめな商社マン。真相を確かめに、遠い異国へ
  base(); S.aim(30, 0); lift(-60);
  S.darken(0.15, '#f0d0a0');
  PLANE.visible = true;
  if (t < 4.0) { hero2.visible = true; hero2.position.set(30 - 1 + t * 0.4, 0, 1.4); hero2.rotation.y = Math.PI / 2; walk(hero2, t * 5, 0.8); CASE.visible = true; CASE.position.set(hero2.position.x + 0.05, 0.62, 1.75); PLANE.position.set(34, 1.6, -3); PLANE.rotation.set(0, 0, 0); }
  else { hero2.visible = false; CASE.visible = false; const k = ease((t - 4.0) / 3.6); PLANE.position.set(lerp(27, 32, k), lerp(1.6, 5.6, k), -3); PLANE.rotation.z = 0.18 * clamp((t - 4) / 0.6); }
  tSus.position.set(30, 2.55, 1.4); tAbroad.position.set(30.5, 6.4, -1);
  tSus.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tSus.visible = false;
  tAbroad.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 8);
  if (t < 4.0) look(lerp(29.6, 30.2, u), 1.8, 5.2, lerp(29.6, 30.2, u), 1.5, 0.6, 54);
  else { const k2 = ease((t - 4) / 3.6); look(lerp(29.5, 30.5, k2), 2.4, 10.5, lerp(28.5, 30.8, k2), lerp(2.2, 4.4, k2), -3, 56); }
  return qs;
}
function desert(night = 0) { SUN.visible = night < 0.5; MOON.visible = night >= 0.5; S.scene.background.set(night < 0.5 ? '#e8c890' : '#141a30'); S.scene.background.lerp(new THREE.Color('#141a30'), night); S.scene.fog.color.copy(S.scene.background); S.hemi.intensity = lerp(1.3, 0.35, night); S.key.intensity = lerp(1.8, 0.2, night); }
function shotDesert(t) { // 17〜25：どこまでも続く灼熱の砂漠。だまされて、ひとり置き去りに
  base(); S.aim(DX, 0); lift(-60); desert(0); HEAT.intensity = 6;
  hero3.visible = true; hero3.position.set(DX, 0, 0.6); hero3.rotation.y = 0.6;
  TAXI.visible = true; { const k = clamp((t - 2.6) / 4.0); TAXI.position.set(lerp(DX + 1.6, DX + 14, ease(k)), 0, -0.6); TAXI.rotation.y = 0; DUSTP.forEach((d, i) => { d.visible = k > 0 && k < 1; d.position.set(TAXI.position.x - 1.6 - i * 0.6, 0.3 + i * 0.1, -0.6 + Math.sin(i) * 0.3); d.material.opacity = 0.5 * (1 - i / 5); }); }
  if (t > 3.2) { hero3.userData.arms[1].rotation.x = -2.4 + Math.sin(t * 8) * 0.3; hero3.rotation.y = lerp(0.6, -1.0, ease((t - 3.2) / 1)); }
  tLeft.position.set(DX, 2.6, 0.6); tLeft.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(DX + 0.9, DX + 1.4, u), lerp(2.0, 3.4, u), lerp(5.0, 8.4, u), lerp(DX + 0.5, DX + 1.4, u), lerp(1.3, 1.6, u), 0, 54);
  return qs;
}
function shotTrio(t, T) { // 25〜33：出会ったのは、公安の刑事と日本人の医師。爆発事件の犯人として追われる
  base(); S.aim(NX, 0); lift(-60);
  S.darken(0.7, '#141828'); S.hemi.intensity = 0.7; S.key.intensity = 0.4;
  const run = t > 4.0;
  TRIO.forEach(p => p.visible = true); TRIO.forEach((p, i) => { const x = NX - 0.9 + i * 0.9; if (!run) { p.position.set(x, 0, 0.4 + (i === 1 ? -0.2 : 0)); p.rotation.y = 0; walk(p, 0, 0); } else { const k = (t - 4.0); p.position.set(x + k * 0.9, 0, 0.4); p.rotation.y = Math.PI / 2; walk(p, T * 9 + i, 1); } });
  tCop.position.set(NX, 2.55, 0.2); tDoc.position.set(NX + 0.9, 2.15, 0.4);
  tCop.userData.pop((t - 0.6) / 0.35); tDoc.userData.pop((t - 1.8) / 0.35);
  if (run) { tCop.visible = false; tDoc.visible = false; const f = Math.sin(T * 12) > 0; SIREN.intensity = f ? 30 : 0; SIREN2.intensity = f ? 0 : 30; SIREN.position.x = SIREN2.position.x = NX - 4 + (t - 4) * 0.8; }
  tChase.position.set(NX + 0.4 + Math.max(0, t - 4) * 0.9, 2.6, 0.4); tChase.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(NX, NX + 2.6, u), 1.9, lerp(6.2, 6.4, u), lerp(NX, NX + 2.6, u), 1.4, 0.2, 54);
  return qs;
}
function shotMap(t) { // 33〜42：日本の日曜劇場。舞台は中央アジアの国。敵か味方か、誰も信じられない
  base(); S.aim(MX, 0); lift(200); S.hemi.intensity = 1.2;
  ARC.forEach((d, i) => { d.visible = t > 0.6 + i * 0.12; });
  tSun.userData.pop((t - 0.4) / 0.35); tAsia.userData.pop((t - 1.8) / 0.35);
  if (t > 4.2) { tSun.visible = false; tAsia.visible = false; }
  tTrust.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(MX + 0.2, lerp(12.6, 12.0, u), lerp(6.0, 5.6, u), MX + 0.2, 0, lerp(-0.6, -0.4, u), 56);
  return qs;
}
function shotEmb(t, T) { // 42〜49：決め手。日本大使館を目指して、砂漠の国を逃げる。タイトルは謎の言葉そのもの
  base(); S.aim(DX + 3, -3); lift(-60); desert(0.85);
  EMB.visible = true; EMB.userData.flag.rotation.y = Math.sin(T * 3) * 0.15;
  TRIO.forEach(p => p.visible = true); TRIO.forEach((p, i) => { p.position.set(DX + 5.0 + i * 0.7, 0, 0.6 - t * 0.5 - (i % 2) * 0.3); p.rotation.y = Math.PI; walk(p, T * 8 + i, 1); });
  tEmb.position.set(DX + 6.4, 4.6, -4.0); tWord.position.set(DX + 6.4, 4.6, -4.0);
  tEmb.userData.pop((t - 0.4) / 0.35); if (t > 3.4) tEmb.visible = false;
  tWord.userData.pop((t - 3.6) / 0.35);
  const u = ease(t / 7);
  look(lerp(DX + 6.2, DX + 6.4, u), lerp(2.6, 2.7, u), lerp(5.8, 5.2, u), DX + 6.6, 2.4, -4.0, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の砂漠に、ひとり立つ男）
  base(); S.aim(DX, 0); lift(-60); desert(1);
  hero3.visible = true; hero3.position.set(DX, 0, 0.6); hero3.rotation.y = 0.0; hero3.userData.arms.forEach(a => a.rotation.x = 0);
  S.spot.color.set(0xc8d8ff); S.spot.position.set(DX + 0.4, 5, 2.4); S.spot.target.position.set(DX, 0.8, 0.6); S.spot.intensity = lerp(0, 40, ease((t - 0.3) / 1.0));
  const k = ease(t / 7);
  look(lerp(DX + 0.5, DX + 0.3, k), lerp(1.8, 1.7, k), lerp(5.0, 4.0, k), DX, 1.4, 0.4, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotMoney(t, T) },
  { a: 9, b: 17, f: shotFly },
  { a: 17, b: 25, f: shotDesert },
  { a: 25, b: 33, f: (t, T) => shotTrio(t, T) },
  { a: 33, b: 42, f: shotMap },
  { a: 42, b: 49, f: (t, T) => shotEmb(t, T) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '送ったはずの金額に、<br>ゼロがひとつ多い。'],
  [5.6, 9.0, '1千万ドルのはずが、<br>1億ドルに。'],
  [9.2, 13.2, '疑われたのは、<br>まじめな商社マン。'],
  [13.2, 17.0, '真相を確かめに、<br>遠い異国へ向かう。'],
  [17.2, 21.0, 'どこまでも続く、<br>灼熱の砂漠。'],
  [21.0, 25.0, 'だまされて、<br>ひとり置き去りにされる。'],
  [25.2, 29.0, '出会ったのは、公安の<br>刑事と、日本人の医師。'],
  [29.0, 33.0, '爆発事件の犯人として、<br>警察に追われる。'],
  [33.2, 37.4, '日本の日曜劇場。<br>舞台は中央アジアの国。'],
  [37.4, 41.8, '敵か味方か、<br>誰も信じられない。'],
  [42.2, 45.4, '日本大使館を目指して、<br>砂漠の国を逃げる。'],
  [45.4, 49.0, 'タイトルは、<br>謎の言葉そのもの。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ヴィヴァン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q026', v2: true, answer: 'VIVANT',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 2626,
    hits: [2.0, 21.0, 42.2, 56.4], risers: [29.0, 52.0],
    impacts: [2.0, 5.6, 21.4, 29.4, 37.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [2.0, 'alarm'], [9.0, 'whoosh'], [13.4, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.2, 'alarm'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ヴィヴァン': 'ヴィヴァン', '送った': 'おくった', '金額': 'きんがく', '1千万ドル': 'いっせんまんドル', '1億ドル': 'いちおくドル', '疑われた': 'うたがわれた', '商社マン': 'しょうしゃマン', '真相': 'しんそう', '確かめ': 'たしかめ', '遠い': 'とおい', '異国': 'いこく', '向かう': 'むかう', '続く': 'つづく', '灼熱': 'しゃくねつ', '砂漠': 'さばく', '置き去り': 'おきざり', '出会った': 'であった', '公安': 'こうあん', '刑事': 'けいじ', '日本人': 'にほんじん', '医師': 'いし', '爆発事件': 'ばくはつじけん', '犯人': 'はんにん', '警察': 'けいさつ', '追われる': 'おわれる', '日本': 'にほん', '日曜劇場': 'にちようげきじょう', '舞台': 'ぶたい', '中央アジア': 'ちゅうおうアジア', '国': 'くに', '敵': 'てき', '味方': 'みかた', '誰も': 'だれも', '信じられない': 'しんじられない', '大使館': 'たいしかん', '目指して': 'めざして', '逃げる': 'にげる', '謎': 'なぞ', '言葉': 'ことば', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n送ったはずの金額に、ゼロがひとつ多い。1千万ドルのはずが、1億ドルに。疑われたのは、まじめな商社マン。真相を確かめに、遠い異国へ向かう。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'Hulu', '日曜劇場', 'ドラマ好き'],
  },
});
applyQuizCards({ answer: 'VIVANT', info: 'Disney+・Hulu｜日本・全10話', answerSize: 140 });
