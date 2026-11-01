import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, makeQ, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #007 君の名は。（映画・日本・2016年・107分のアニメ。Netflixで見放題、justwatch.com/jp/映画/jun-noming-ha で2026/11/1確認。Filmarks 3.9）
// 設定：山深い田舎町で暮らし都会にあこがれる女子高校生が、東京の男の子になる夢を見る。東京の男子高校生も、山奥の町の女の子になる夢を見ていた。
//       眠っている間に入れ替わっていると気づき、スマホのメモや日記でやりとりする。女の子は古い神社の娘（crank-in 作品紹介・ciatr 作品紹介）
// 作品の映像・キャラクターの見た目・ロゴ・有名な場面の構図（空を分けたポスター、階段の場面など）は使わない。物語の後半にかかわる要素（空のできごと・時間のこと）には一切ふれない

const S = quizStage({ bg: '#9cc4e4', floor: '#6f9a58', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(707);

const GIRL = { skin: '#f5d3b5', hair: '#1d1a19', shirt: '#f2f2f0', pants: '#3a3f5a', long: true, skirt: true };
const BOY = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#f2f2f0', pants: '#2b3040' };
const TOWN = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f'][i % 3], hair: ['#2c2421', '#9a9a9a', '#4a3426'][i % 3], shirt: ['#7a9a6a', '#c9a26a', '#8a7a9a'][i % 3], pants: '#4a4a4a' });
const CITY = (i) => ({ skin: ['#f1c9a5', '#efcfae', '#e8b98f', '#f5d3b5'][i % 4], hair: ['#1d1a19', '#2c2421', '#4a3426'][i % 3], shirt: ['#2b3040', '#e9e4da', '#59606e', '#c94f7c', '#4fa3d1'][i % 5], pants: ['#2b3346', '#1f2430', '#3b3f4a'][i % 3], long: i % 3 === 1, skirt: i % 5 === 3 });
function wonder(p, k) { p.userData.head.rotation.y = Math.sin(k * 2.2) * 0.5; p.userData.head.rotation.x = -0.25; }
function lookHands(p, k) { p.userData.arms.forEach(a => { a.rotation.x = lerp(0, -1.3, k); }); p.userData.head.rotation.x = lerp(0, 0.45, k); }

// ---------- 1. 山奥の湖の町（x=0） ----------
const LAKE = new THREE.Group(); LAKE.position.set(0, 0, -10); qs.add(LAKE);
{ const water = new THREE.Mesh(new THREE.CircleGeometry(6.5, 40), new THREE.MeshLambertMaterial({ color: '#4f86b8' })); water.rotation.x = -Math.PI / 2; water.position.y = 0.04; LAKE.add(water);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.2; const h = 5 + R() * 4; const m = new THREE.Mesh(new THREE.ConeGeometry(4 + R() * 2, h, 6), mat(['#4f7a4a', '#5d8a52', '#46703f'][i % 3])); m.position.set(Math.cos(a) * 11, h / 2, Math.sin(a) * 9 - 3); if (Math.sin(a) > 0.5) continue; LAKE.add(m); }
  for (let i = 0; i < 9; i++) { const hx = -7 + i * 1.8 + R() * 0.4, hz = 7.0 + (i % 2) * 1.2; const hw = box(1.1, 0.8, 1.0, mat(['#e8dcc4', '#d9cdb4', '#efe4cc'][i % 3])); hw.position.set(hx, 0.4, hz); LAKE.add(hw); const rf = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.6, 4), mat(['#5a4a5a', '#3a4a6a', '#6a3a3a'][i % 3])); rf.rotation.y = Math.PI / 4; rf.position.set(hx, 1.1, hz); LAKE.add(rf); } }
// 神社の鳥居（汎用の形）
function torii(x, z, s = 1) { const g = new THREE.Group(); const red = mat('#c8402e'); for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.12 * s, 2.2 * s, 10), red); p.position.set(sx * 0.9 * s, 1.1 * s, 0); p.castShadow = true; g.add(p); } const top = box(2.6 * s, 0.16 * s, 0.24 * s, mat('#2a2a2a')); top.position.y = 2.25 * s; g.add(top); const t2 = box(2.3 * s, 0.14 * s, 0.2 * s, red); t2.position.y = 2.05 * s; g.add(t2); const nuki = box(2.1 * s, 0.1 * s, 0.14 * s, red); nuki.position.y = 1.7 * s; g.add(nuki); g.position.set(x, 0, z); qs.add(g); return g; }
torii(4.2, -1.6, 1.0);
const girl1 = makePerson(GIRL); girl1.position.set(0.5, 0, 1.6); girl1.rotation.y = 0.5; qs.add(girl1);
const fence1 = box(6, 0.5, 0.1, mat('#8a6a4a')); fence1.position.set(-0.6, 0.55, 0.7); qs.add(fence1);
const tTown = tag('山奥の小さな町', { size: 66, w: 520, bg: '#e6b450', color: '#14161c' }); tTown.position.set(0.5, 2.6, 1.6); qs.add(tTown);
const tCity = tag('都会にあこがれ', { size: 66, w: 520 }); tCity.position.set(0.5, 2.6, 1.6); qs.add(tCity);

// ---------- 2. 東京の街（x=26）：夢の中で、東京の男の子に ----------
const TOKYO = new THREE.Group(); TOKYO.position.set(26, 0, 0); qs.add(TOKYO);
{ const road = box(16, 0.04, 4, mat('#3a3c44')); road.position.set(0, 0.02, 1.6); TOKYO.add(road);
  for (let i = 0; i < 6; i++) { const zb = box(0.5, 0.05, 3.6, mat('#e8e8e8')); zb.position.set(-2.5 + i * 1.0, 0.05, 1.6); TOKYO.add(zb); }
  for (let i = 0; i < 9; i++) { const w = 2.0 + R() * 1.2, h = 7 + R() * 9, d = 2.2; const wt = windowTextures(70 + i, ['#8a94a8', '#a8b0bf', '#6f7a8e'][i % 3]); wt.map.repeat.set(w / 2, h / 2.5); wt.emi.repeat.set(w / 2, h / 2.5); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 0.25 })); b.position.set(-8 + i * 2.1, h / 2, -3.6 - (i % 2) * 1.6); b.castShadow = true; TOKYO.add(b); } }
const CROWD = []; for (let i = 0; i < 10; i++) { const p = makePerson(CITY(i)); p.position.set(21.5 + i * 0.95, 0, 0.6); qs.add(p); CROWD.push({ p, x0: 21.5 + i * 0.95, z: 0.4 + (i % 3) * 0.55, dir: i % 2 ? 1 : -1, ph: R() * 6 }); }
const boy2 = makePerson(BOY); boy2.position.set(26, 0, 3.0); boy2.rotation.y = 0; qs.add(boy2);
const tTokyo = tag('東京の男子高校生', { size: 68, bg: '#e6b450', color: '#14161c' }); tTokyo.position.set(26, 3.1, 2.4); qs.add(tTokyo);

// ---------- 3. 町の家（x=50）：東京の男子も、山奥の女の子に ----------
const ROOM = new THREE.Group(); ROOM.position.set(50, 0, 0); qs.add(ROOM);
{ const back = box(9, 4, 0.2, mat('#d9c9a8')); back.position.set(0, 2, -2.6); ROOM.add(back);
  const tat = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#c9c08a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a6a3a'; g.lineWidth = 8; for (let i = 0; i <= 2; i++) { g.strokeRect(0, i * h / 2, w / 2, h / 2); g.strokeRect(w / 2, 0, w / 2, h); } });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshLambertMaterial({ map: tat })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.04; ROOM.add(fl);
  const shoji = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a4a'; g.lineWidth = 6; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); } });
  for (const x of [-2.6, -1.2]) { const sj = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), new THREE.MeshLambertMaterial({ map: shoji })); sj.position.set(x, 1.3, -2.48); ROOM.add(sj); }
  const futon = box(1.2, 0.18, 2.2, mat('#e8e2f0')); futon.position.set(1.6, 0.1, -0.8); ROOM.add(futon);
  const quilt = box(1.24, 0.12, 1.4, mat('#c96a7a')); quilt.position.set(1.6, 0.24, -0.4); ROOM.add(quilt);
  const mirror = box(0.7, 1.2, 0.06, mat('#c9dce8')); mirror.position.set(3.2, 1.3, -2.45); ROOM.add(mirror); }
const girl3 = makePerson({ ...GIRL, shirt: '#e8d8e8', pants: '#e8d8e8', skirt: false }); girl3.position.set(50.2, 0, 0.4); girl3.rotation.y = 0.2; qs.add(girl3);
const Q3 = makeQ(); Q3.position.set(50.65, 2.55, 0.4); qs.add(Q3);
const tInner = tag('中身は東京の男子', { size: 68, bg: '#e2483c' }); tInner.position.set(50.2, 3.0, 0.4); qs.add(tInner);

// ---------- 4. スマホのメモ（x=74） ----------
const DESK = new THREE.Group(); DESK.position.set(74, 0, 0); qs.add(DESK);
const PHONE_T = canvasTex(400, 760, (g, w, h) => {
  g.fillStyle = '#16181f'; g.fillRect(0, 0, w, h); g.fillStyle = '#f7f5ee'; g.fillRect(18, 60, w - 36, h - 120);
  g.fillStyle = '#e6b450'; g.fillRect(18, 60, w - 36, 80); g.fillStyle = '#14161c'; g.font = '900 48px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('メモ', w / 2, 102);
  g.textAlign = 'left'; g.font = '800 34px "Noto Sans CJK JP", sans-serif';
  for (let i = 0; i < 7; i++) { g.fillStyle = '#c9ccd4'; g.fillRect(48, 186 + i * 70, 250 - (i % 3) * 40, 18); g.fillStyle = '#e2483c'; g.fillText('・', 22, 196 + i * 70); }
});
const PHONE = new THREE.Group(); qs.add(PHONE);
{ const body = box(0.9, 1.7, 0.08, mat('#16181f')); PHONE.add(body); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.6), new THREE.MeshBasicMaterial({ map: PHONE_T })); scr.position.z = 0.045; PHONE.add(scr); }
{ const desk = box(4.4, 0.9, 1.8, mat('#8a6a4a')); desk.position.set(0, 0.45, -1.0); DESK.add(desk);
  const back = box(9, 4, 0.2, mat('#cfd6df')); back.position.set(0, 2, -2.6); DESK.add(back);
  const note = box(0.9, 0.04, 0.66, mat('#f7f1e2')); note.position.set(-1.0, 0.92, -0.9); note.rotation.y = 0.2; DESK.add(note);
  const noteT = canvasTex(256, 192, (g, w, h) => { g.fillStyle = '#f7f1e2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8b8d8'; g.lineWidth = 3; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 24); g.lineTo(w, i * 24); g.stroke(); } g.fillStyle = '#e2483c'; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('？', w / 2, h / 2 + 6); });
  const nt = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.64), new THREE.MeshLambertMaterial({ map: noteT })); nt.rotation.x = -Math.PI / 2; nt.rotation.z = -0.2; nt.position.set(-1.0, 0.945, -0.9); DESK.add(nt); }
const tNote = tag('知らない書きこみ', { size: 66, w: 560 }); tNote.position.set(73.4, 2.0, -0.9); qs.add(tNote);
const tMemo = tag('スマホのメモ', { size: 74, bg: '#e6b450', color: '#14161c' }); tMemo.position.set(74.4, 3.2, -0.2); qs.add(tMemo);

// ---------- 5. 2つの暮らし（x=98） ----------
const TWO = new THREE.Group(); TWO.position.set(98, 0, 0); qs.add(TWO);
{ // 左：神社（汎用）
  const hall = box(3.2, 1.6, 2.0, mat('#7a5a3a')); hall.position.set(-2.6, 0.8 + 0.3, -2.4); TWO.add(hall);
  const plat = box(3.6, 0.3, 2.4, mat('#6a6a6a')); plat.position.set(-2.6, 0.15, -2.4); TWO.add(plat);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.2, 4), mat('#3a3a3a')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.7); rf.position.set(-2.6, 2.5, -2.4); TWO.add(rf);
  // 右：都会のビル
  for (let i = 0; i < 3; i++) { const h = 6 + i * 1.5; const wt = windowTextures(90 + i, '#9aa4b8'); wt.map.repeat.set(1, h / 2.5); wt.emi.repeat.set(1, h / 2.5); const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.6), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#fff2c0'), emissiveIntensity: 0.25 })); b.position.set(1.6 + i * 1.7, h / 2, -3.2); TWO.add(b); } }
torii(95.4, -0.4, 0.8);
const boy5 = makePerson(BOY); boy5.position.set(99.2, 0, 0.6); boy5.rotation.y = -0.3; qs.add(boy5);
const girl5 = makePerson({ ...GIRL, shirt: '#f2f2f0', pants: '#c8402e' }); girl5.position.set(96.8, 0, 0.6); girl5.rotation.y = 0.3; qs.add(girl5);
const tShrine = tag('神社の娘', { size: 70, w: 400, bg: '#e6b450', color: '#14161c' }); tShrine.position.set(96.8, 2.6, 0.6); qs.add(tShrine);
const tTk = tag('東京の高校生', { size: 66, w: 480 }); tTk.position.set(99.2, 2.6, 0.6); qs.add(tTk);

// ---------- 6〜7. 夜空と、遠く離れた2人（x=124） ----------
const NIGHT = new THREE.Group(); NIGHT.position.set(124, 0, 0); qs.add(NIGHT);
const STARS = [];
{ for (let i = 0; i < 90; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03 + R() * 0.04, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff6dc' })); s.position.set(-10 + R() * 20, 2.6 + R() * 9, -9 - R() * 4); NIGHT.add(s); STARS.push(s); }
  for (let i = 0; i < 7; i++) { const h = 3 + R() * 2; const m = new THREE.Mesh(new THREE.ConeGeometry(3 + R() * 1.5, h, 6), mat('#1e2a36')); m.position.set(-12 + i * 4, h / 2, -8); NIGHT.add(m); } }
const g6 = makePerson(GIRL); g6.position.set(122.2, 0, 0.2); g6.rotation.y = 0.5; qs.add(g6);
const b6 = makePerson(BOY); b6.position.set(125.8, 0, 0.2); b6.rotation.y = -0.5; qs.add(b6);
const L6a = new THREE.PointLight(0xaac8ff, 0, 5, 1.4); L6a.position.set(122.2, 2.6, 1.4); qs.add(L6a);
const L6b = new THREE.PointLight(0xffd0a0, 0, 5, 1.4); L6b.position.set(125.8, 2.6, 1.4); qs.add(L6b);
const tNever = tag('会ったことがない', { size: 72, bg: '#e6b450', color: '#14161c' }); tNever.position.set(124, 3.2, 0.2); qs.add(tNever);

// ---------- shots ----------
const ALLTAG = [tTown, tCity, tTokyo, tInner, tNote, tMemo, tShrine, tTk, tNever];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); Q3.visible = false; L6a.intensity = 0; L6b.intensity = 0; }

function shotLake(t, T) { // 0〜9：山奥の湖の町（0秒目がサムネ）
  base(); S.aim(0, -2); lift(150);
  girl1.userData.head.rotation.y = Math.sin(T * 0.6) * 0.2;
  tTown.userData.pop((T - 2.7) / 0.35);
  if (T > 5.6) { tTown.visible = false; tCity.userData.pop((T - 5.7) / 0.35); }
  const u = ease(T / 9);
  look(lerp(1.3, 0.8, u), lerp(2.8, 2.5, u), lerp(7.6, 6.4, u), 0.5, lerp(2.3, 1.9, u), -4, 54);
  return qs;
}
function shotTokyo(t) { // 9〜17：夢の中で、東京の男の子に
  base(); S.aim(26, 0); lift(200);
  CROWD.forEach((c, i) => { const x = c.x0 + c.dir * ((t * 0.9 + c.ph) % 6 - 3); c.p.position.set(x, 0, c.z); c.p.rotation.y = c.dir * Math.PI / 2; const ph = t * 8 + i; c.p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45; c.p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45; });
  boy2.position.x = 25.8 + t * 0.06; boy2.rotation.y = Math.PI / 2 * 0.6; const ph = t * 8; boy2.userData.legs[0].rotation.x = Math.sin(ph) * 0.45; boy2.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45; boy2.userData.arms[0].rotation.x = -Math.sin(ph) * 0.35; boy2.userData.arms[1].rotation.x = Math.sin(ph) * 0.35;
  tTokyo.position.set(26.0, 3.15, 3.0); tTokyo.userData.pop((t - 0.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(26.3, 26.0, u), lerp(1.8, 2.0, u), lerp(9.4, 8.8, u), 26, lerp(2.3, 2.0, u), 0, 56);
  return qs;
}
function shotRoom(t) { // 17〜25：東京の男子も、山奥の女の子になる夢
  base(); S.aim(50, 0); lift(200);
  lookHands(girl3, ease((t - 0.6) / 0.8));
  Q3.visible = t > 1.4; Q3.scale.setScalar(0.55 * easeOut(clamp((t - 1.4) / 0.3)));
  tInner.userData.pop((t - 4.0) / 0.35);
  if (t > 4.0) Q3.visible = false;
  const u = ease(t / 8);
  look(lerp(50.8, 50.4, u), lerp(2.4, 2.2, u), lerp(6.8, 6.0, u), 50.2, 1.6, -0.4, 52);
  return qs;
}
function shotMemo(t) { // 25〜33：知らない書きこみ。スマホのメモでやりとり
  base(); S.aim(74, 0); lift(200);
  const k = easeOut(clamp((t - 3.8) / 0.6));
  PHONE.position.set(lerp(74.6, 74.4, k), lerp(0.95, 2.05, k), lerp(-0.6, -0.2, k)); PHONE.rotation.set(lerp(-Math.PI / 2, -0.1, k), 0, lerp(0.3, 0, k));
  tNote.userData.pop((t - 0.6) / 0.35);
  if (t > 4.0) tNote.visible = false;
  tMemo.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(73.8, 74.4, u), lerp(3.4, 2.8, u), lerp(4.8, 5.6, u), lerp(73.6, 74.4, u), lerp(0.9, 1.9, u), -0.8, 52);
  return qs;
}
function shotTwo(t) { // 33〜42：知らない町で、知らない人生を代わりに生きる
  base(); S.aim(98, -1); lift(200);
  tShrine.userData.pop((t - 0.6) / 0.35);
  tTk.userData.pop((t - 1.6) / 0.35);
  const u = ease(t / 9);
  look(98, lerp(2.8, 2.6, u), lerp(9.8, 9.2, u), 98, 1.8, -0.6, 54);
  return qs;
}
const DARK = '#0b1024';
function shotNight(t) { // 42〜49：会ったことのない2人
  base(); S.aim(124, 0); lift(190);
  const d = ease(t / 1.3);
  S.hemi.intensity = lerp(1.25, 0.25, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  L6a.intensity = lerp(0, 6, ease((t - 0.4) / 1)); L6b.intensity = lerp(0, 6, ease((t - 0.4) / 1));
  STARS.forEach((s, i) => s.visible = (Math.floor(t * 2 + i) % 9) !== 0);
  tNever.userData.pop((t - 0.9) / 0.35);
  const k = ease(t / 6.5);
  look(124, lerp(2.4, 2.0, k), lerp(9.6, 8.0, k), 124, lerp(1.9, 2.2, k), 0, 54);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画わかった？
  base(); S.aim(124, 0); lift(190);
  S.hemi.intensity = 0.25; S.key.intensity = 0; S.darken(1, DARK); L6a.intensity = 6; L6b.intensity = 6;
  const k = ease(t / 7);
  look(124, lerp(2.0, 4.4, k), lerp(8.0, 11.0, k), 124, lerp(2.2, 2.8, k), 0, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotLake(t, T) },
  { a: 9, b: 17, f: shotTokyo },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotMemo },
  { a: 33, b: 42, f: shotTwo },
  { a: 42, b: 49, f: shotNight },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '山奥の小さな町で暮らす、<br>女子高校生。'],
  [5.6, 9.0, '都会の暮らしに、<br>あこがれている。'],
  [9.2, 13.2, 'いっぽう、東京で暮らす<br>男子高校生。'],
  [13.2, 17.0, '学校にバイトに、<br>いそがしい毎日。'],
  [17.2, 21.0, 'ある日、目がさめると、<br>知らない部屋。'],
  [21.0, 25.0, '体は、山奥の町の<br>女の子になっていた。'],
  [25.2, 29.0, '目がさめると、<br>知らない書きこみ。'],
  [29.0, 33.0, '2人は、スマホのメモで<br>やりとりを始める。'],
  [33.2, 37.4, '眠っている間に、<br>入れ替わる2人。'],
  [37.4, 41.8, '知らない町で、<br>知らない誰かとして生きる。'],
  [42.2, 45.4, 'まだ一度も、<br>会ったことのない2人。'],
  [45.4, 49.0, 'その物語が、<br>動き出す。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>君の名は。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotTokyo || f === shotRoom || f === shotMemo || f === shotTwo,
  meta: {
    id: 'q007', v2: true, answer: '君の名は。',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 707,
    hits: [5.6, 21.0, 56.4], risers: [52.0],
    impacts: [0.3, 21.0, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '山奥': 'やまおく', '女子高校生': 'じょしこうこうせい', '男子高校生': 'だんしこうこうせい', '2人': 'ふたり', '書きこみ': 'かきこみ', '一度': 'いちど', '暮らす': 'くらす', '誰か': 'だれか', '眠って': 'ねむって', '入れ替わる': 'いれかわる' },
    caption: 'この映画のタイトル、わかる？\n山奥の小さな町で暮らす女子高校生と、東京の男子高校生。眠っている間に入れ替わる2人は、スマホのメモでやりとりを始める。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'アニメ映画', '名作映画'],
  },
});
applyQuizCards({ answer: '君の名は。', info: 'Netflix｜アニメ映画・107分', answerSize: 128 });
