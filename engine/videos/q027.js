import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #027 ズートピア（映画・アメリカ・2016年・109分・アニメ。Disney+で見放題、justwatch.com/jp/映画/zutopia で2026/11/3確認。
//   Filmarks 4.0・レビュー31万件 filmarks.com/movies/60103）
// 確かめた事実（movie.jorudan.co.jp/cinema/29629/ の解説・Filmarks の作品紹介）：
//   ・動物が人間のように暮らす大都会が舞台。田舎町で育ったウサギのジュディは、警察学校を首席で卒業し、ウサギで初めての警察官として大都会に赴任する。
//   ・動物たちの連続行方不明事件が起きている。ジュディは失踪事件の捜査を名乗り出て、署長から期限は2日間、失敗したらクビと言いわたされる。
//   ・詐欺師のキツネのニックにだまされたことから関わり、街にくわしい彼と捜査をすることになる
// 構成（ヒント6段）：1 首席で卒業、でもまわりは体の大きい仲間ばかり → 2 田舎育ちの小さな新人、大都会の警察署へ → 3 大きな住人も小さな住人もひとつの街に
//   → 4 口のうまい詐欺師と手を組む、連続行方不明事件 → 5 アメリカの長編アニメ映画、期限は2日、失敗したらクビ → 6 決め手：耳が出てウサギ初の警察官と、キツネの詐欺師
// 動物の姿（耳・しっぽ）は6段目まで見せない。キャラクターのデザイン・ロゴ・映像・有名な場面の構図は使わない（汎用の箱の人形に耳を足しただけ）。黒幕・結末には触れない

const S = quizStage({ bg: '#8ab0d0', floor: '#7a8a7a', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(2727);

const HERO = { skin: '#c8c4c4', hair: '#c8c4c4', shirt: '#3a5a9a', pants: '#2a3a6a', scale: 0.62 };
const FOX = { skin: '#d8783a', hair: '#d8783a', shirt: '#8ab870', pants: '#6a6a7a', tie: true, scale: 0.85 };
const BIG = (i) => ({ skin: ['#8a7a6a', '#6a6a70', '#a08a6a', '#5a5048'][i % 4], hair: ['#5a4a3a', '#3a3a40', '#6a5a40', '#2a2420'][i % 4], shirt: '#3a5a9a', pants: '#2a3a6a', scale: 1.6 + (i % 3) * 0.2 });
const CIT = (i) => ({ skin: ['#c8a070', '#8a8a8a', '#e8c8a0', '#6a5040', '#d8b080', '#a0a0b0'][i % 6], hair: ['#4a3a2a', '#5a5a5a', '#c8a070', '#3a2a20', '#8a6a40', '#7a7a8a'][i % 6], shirt: ['#e05a4f', '#3f8f6b', '#f2c14e', '#8e6bbf', '#4fa3d1', '#e9e4da'][i % 6], pants: ['#2b3346', '#5a4a3a', '#3b3f4a'][i % 3], scale: [0.35, 2.2, 0.8, 1.5, 0.5, 1.1, 2.6, 0.6][i % 8] });
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.5 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.5 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.4 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.4 * k; }
function cap(p, c = '#2a3a6a') { const b = box(0.46, 0.12, 0.44, mat(c)); b.position.y = 0.52; p.userData.head.add(b); const v = box(0.46, 0.04, 0.2, mat(c)); v.position.set(0, 0.47, 0.28); p.userData.head.add(v); return p; }
// 6段目で出す耳としっぽ
function addRabbit(p) { const g = new THREE.Group(); p.userData.head.add(g); for (const s of [-1, 1]) { const e = box(0.12, 0.62, 0.08, mat('#c8c4c4')); e.position.set(s * 0.11, 0.86, -0.04); e.rotation.z = -s * 0.08; g.add(e); const inn = box(0.06, 0.48, 0.02, mat('#e8a8b0')); inn.position.set(s * 0.11, 0.86, 0.01); inn.rotation.z = -s * 0.08; g.add(inn); } g.visible = false; p.userData.ears = g; return p; }
function addFox(p) { const g = new THREE.Group(); p.userData.head.add(g); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 4), mat('#d8783a')); e.position.set(s * 0.14, 0.62, 0); g.add(e); } const sn = box(0.18, 0.12, 0.16, mat('#f4e8dc')); sn.position.set(0, 0.16, 0.25); g.add(sn); const tail = new THREE.Group(); const t1 = box(0.18, 0.18, 0.56, mat('#d8783a')); t1.position.set(0, 0, -0.28); tail.add(t1); const t2 = box(0.16, 0.16, 0.16, mat('#f4f0e8')); t2.position.set(0, 0, -0.6); tail.add(t2); tail.position.set(0, 0.85, -0.16); tail.rotation.x = 0.5; p.add(tail); g.visible = false; tail.visible = false; p.userData.ears = g; p.userData.tail = tail; return p; }
function popEars(p, k) { const e = p.userData.ears; e.visible = k > 0; e.scale.setScalar(Math.max(0.01, easeBack(clamp(k)))); if (p.userData.tail) { p.userData.tail.visible = k > 0; p.userData.tail.scale.setScalar(Math.max(0.01, easeBack(clamp(k)))); } }

// ---------- 1. 卒業式（x=0）。0秒目がサムネ：体の大きな仲間の中に、小さな新人 ----------
{ const st = box(10, 0.4, 4, mat('#6a4e38')); st.position.set(0, 0.2, -0.6); qs.add(st);
  const back = box(12, 6, 0.2, mat('#2a3a5a')); back.position.set(0, 3, -3); qs.add(back);
  for (let i = 0; i < 5; i++) { const fl = box(0.9, 1.6, 0.04, mat(['#e6b450', '#3a5a9a'][i % 2])); fl.position.set(-4 + i * 2, 4.2, -2.86); qs.add(fl); } }
const BIGS = [0, 1, 2, 3].map(i => { const p = cap(makePerson(BIG(i)), '#2a3a6a'); p.position.set([-2.6, -1.4, 1.4, 2.6][i], 0.4, -0.9); qs.add(p); return p; });
const hero1 = addRabbit(cap(makePerson(HERO))); hero1.position.set(0, 0.4, -0.5); qs.add(hero1);
const MEDAL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), new THREE.MeshBasicMaterial({ color: '#f4c840' })); MEDAL.rotation.x = Math.PI / 2; qs.add(MEDAL);
const tTop = tag('首席で卒業', { size: 80, w: 440, bg: '#e6b450', color: '#14161c', sx: 1.3 }); tTop.position.set(0, 2.35, -0.3); qs.add(tTop);

// ---------- 2. 大都会の警察署へ（x=30） ----------
const CX = 30;
const TOWERS = []; for (let i = 0; i < 9; i++) { const w = 2.4 + R() * 1.4, h = 8 + R() * 14; const wt = windowTextures(700 + i, ['#5a7a9a', '#7a6a9a', '#4a8a8a'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.6), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe8b0'), emissiveIntensity: 0.4 })); b.position.set(CX - 13 + i * 3.3, h / 2, -12 - (i % 3) * 2); qs.add(b); TOWERS.push(b); }
{ const ps = box(6, 3.4, 2.4, mat('#d8d4c8')); ps.position.set(CX, 1.7, -4); qs.add(ps); const door = box(1.2, 1.8, 0.1, mat('#3a5a9a')); door.position.set(CX, 0.9, -2.76); qs.add(door);
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 6), mat('#e6b450')); badge.rotation.x = Math.PI / 2; badge.position.set(CX, 2.7, -2.74); qs.add(badge); }
const hero2 = addRabbit(cap(makePerson(HERO))); qs.add(hero2);
const BAG = box(0.3, 0.22, 0.14, mat('#c84a3a')); qs.add(BAG);
const tCountry = tag('田舎育ちの新人', { size: 64, w: 520, bg: '#14161c', sx: 1.0 }); qs.add(tCountry);
const tCity = tag('大都会の警察署', { size: 64, w: 520, bg: '#e6b450', color: '#14161c', sx: 1.6 }); qs.add(tCity);

// ---------- 3. いろんな大きさの住人が行き交う通り（x=60） ----------
const SX = 60;
{ const rd = box(30, 0.04, 10, mat('#8a8a8a')); rd.position.set(SX, 0.02, 0); qs.add(rd);
  for (let i = 0; i < 6; i++) { const h = 3 + (i % 3) * 1.5; const b = box(3.4, h, 2, mat(['#e8a8a0', '#a8d0e0', '#f0d890', '#b8e0a8', '#d8b8e8', '#f4c8a0'][i])); b.position.set(SX - 8.5 + i * 3.4, h / 2, -5); qs.add(b);
    const dr = box(0.6 + (i % 3) * 0.5, 0.8 + (i % 3) * 0.9, 0.06, mat('#5a4a3a')); dr.position.set(SX - 8.5 + i * 3.4, (0.8 + (i % 3) * 0.9) / 2, -3.97); qs.add(dr); } }
const CROWD = []; for (let i = 0; i < 12; i++) { const p = makePerson(CIT(i)); p.userData.x0 = SX - 6 + (i * 1.3) % 12; p.userData.z = -2.6 + (i % 4) * 1.0; p.userData.d = i % 2 ? 1 : -1; p.userData.sp = 0.5 + R() * 0.5; qs.add(p); CROWD.push(p); }
const tBigSmall = tag('大きい住人も 小さい住人も', { size: 58, w: 760, bg: '#14161c', sx: 2.6 }); tBigSmall.position.set(SX, 4.4, 0); qs.add(tBigSmall);
const tOne = tag('ひとつの街で暮らす', { size: 62, w: 600, bg: '#e6b450', color: '#14161c', sx: 2.2 }); tOne.position.set(SX, 4.4, 0); qs.add(tOne);

// ---------- 4・6. 路地の掲示板（x=90）：詐欺師と手を組む、行方不明のはり紙 ----------
const AX = 90;
{ const wl = box(10, 4, 0.3, mat('#b8a890')); wl.position.set(AX, 2, -1.8); qs.add(wl);
  const gr = box(10, 0.04, 6, mat('#7a7a7a')); gr.position.set(AX, 0.02, 0.6); qs.add(gr); }
const POSTERTEX = canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#f8f4e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8261d'; g.fillRect(0, 0, w, 70); g.fillStyle = '#ffffff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('さがしています', w / 2, 36); g.fillStyle = '#4a4a4a'; g.beginPath(); g.arc(w / 2, 170, 58, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8f4e8'; g.font = '900 80px "Noto Sans CJK JP", sans-serif'; g.fillText('?', w / 2, 176); g.fillStyle = 'rgba(40,40,40,.35)'; for (let y = 250; y < 320; y += 24) g.fillRect(30, y, w - 60, 10); });
const POSTERS = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshBasicMaterial({ map: POSTERTEX })); m.position.set(AX - 1.9 + (i % 3) * 0.75 + (i > 2 ? 0.35 : 0), 1.55 + (i > 2 ? 0.9 : 0), -1.64); m.rotation.z = (R() - 0.5) * 0.12; qs.add(m); POSTERS.push(m); }
const hero4 = addRabbit(cap(makePerson(HERO))); hero4.position.set(AX - 0.5, 0, 0.3); qs.add(hero4);
const fox4 = addFox(makePerson(FOX)); fox4.position.set(AX + 0.55, 0, 0.3); qs.add(fox4);
const tCon = tag('口のうまい詐欺師', { size: 62, w: 560, bg: '#14161c', sx: 1.05 }); tCon.position.set(AX + 0.25, 2.25, 0.4); qs.add(tCon);
const tMiss = tag('連続行方不明事件', { size: 62, w: 560, bg: '#e2483c', sx: 1.5 }); tMiss.position.set(AX - 0.2, 3.25, -1.2); qs.add(tMiss);
const tRabbit = tag('ウサギ初の警察官', { size: 60, w: 560, bg: '#e6b450', color: '#14161c', sx: 1.1 }); tRabbit.position.set(AX - 0.25, 1.95, 0.6); qs.add(tRabbit);
const tFox = tag('キツネの詐欺師', { size: 60, w: 500, bg: '#e2483c', sx: 1.0 }); tFox.position.set(AX + 0.25, 2.45, 0.6); qs.add(tFox);

// ---------- 5. 期限は2日（x=120）：大きな時計 ----------
const TX = 120;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshBasicMaterial({ color: '#2a3048' })); bg.position.set(TX, 4, -3); qs.add(bg); }
const CLOCK = new THREE.Group(); CLOCK.position.set(TX, 1.9, -1); qs.add(CLOCK);
{ const face = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.12, 48), mat('#f4f0e4')); face.rotation.x = Math.PI / 2; CLOCK.add(face); const rim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.08, 10, 48), mat('#e6b450')); CLOCK.add(rim);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const tk = box(0.06, 0.2, 0.04, mat('#2a2a2e')); tk.position.set(Math.sin(a) * 1.1, Math.cos(a) * 1.1, 0.08); tk.rotation.z = -a; CLOCK.add(tk); } }
const HANDL = box(0.06, 0.95, 0.04, mat('#2a2a2e')); HANDL.geometry.translate(0, 0.45, 0); HANDL.position.set(0, 0, 0.12); CLOCK.add(HANDL);
const HANDS = box(0.08, 0.6, 0.04, mat('#c8261d')); HANDS.geometry.translate(0, 0.28, 0); HANDS.position.set(0, 0, 0.13); CLOCK.add(HANDS);
const tUSA = tag('アメリカの長編アニメ', { size: 62, w: 640, bg: '#e6b450', color: '#14161c', sx: 2.0 }); tUSA.position.set(TX, 4.4, -1); qs.add(tUSA);
const tLimit = tag('期限は2日', { size: 80, w: 420, bg: '#14161c', sx: 1.4 }); tLimit.position.set(TX, 4.4, -1); qs.add(tLimit);
const tFire = tag('失敗したらクビ', { size: 66, w: 500, bg: '#e2483c', sx: 1.6 }); tFire.position.set(TX, 3.65, -0.6); qs.add(tFire);

// ---------- クイズ：夜の大都会を見上げるふたり（x=30 を夜に） ----------
const heroQ = addRabbit(cap(makePerson(HERO))); qs.add(heroQ);
const foxQ = addFox(makePerson(FOX)); qs.add(foxQ);

// ---------- shots ----------
const ALL = [tTop, tCountry, tCity, tBigSmall, tOne, tCon, tMiss, tRabbit, tFox, tUSA, tLimit, tFire];
function base() { S.reset(); ALL.forEach(x => x.visible = false); hero2.visible = false; BAG.visible = false; heroQ.visible = false; foxQ.visible = false; MEDAL.visible = false; popEars(hero4, 0); popEars(fox4, 0); CROWD.forEach(p => p.visible = false); }

function shotGrad(t, T) { // 0〜9：警察学校を首席で卒業。でもまわりは、体の大きい仲間ばかり（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-80);
  S.darken(0.35, '#1a2238'); S.hemi.intensity = 1.0;
  S.spot.color.set(0xfff0c8); S.spot.position.set(0, 5, 1.5); S.spot.target.position.set(0, 0.4, -0.5); S.spot.intensity = 40;
  BIGS.forEach((p, i) => { p.userData.head.rotation.y = (p.position.x < 0 ? 0.5 : -0.5) * ease((T - 4) / 0.8); });
  hero1.userData.arms[1].rotation.x = T > 1.0 ? -2.8 * ease((T - 1.0) / 0.5) : 0;
  MEDAL.visible = T > 1.2; MEDAL.position.set(0, 0.4 + 1.0 * 0.62, -0.5 + 0.16);
  tTop.userData.pop((T - 1.4) / 0.35);
  const u = ease(T / 9);
  look(lerp(0, 0, u), lerp(1.6, 1.8, u), lerp(5.2, 6.6, u), 0, lerp(1.1, 1.5, u), -0.6, 54);
  return qs;
}
function shotArrive(t) { // 9〜17：田舎町で育った小さな新人。配属されたのは、大都会の警察署
  base(); S.aim(CX, -2); lift(-80);
  hero2.visible = true; BAG.visible = true;
  const k = clamp(t / 6); hero2.position.set(CX - 1.2 + k * 1.2, 0, lerp(1.6, -1.6, ease(k))); hero2.rotation.y = Math.PI * 0.85; walk(hero2, t * 7, k < 1 ? 1 : 0);
  BAG.position.set(hero2.position.x + 0.22, 0.32, hero2.position.z);
  tCountry.position.set(hero2.position.x, 1.45, hero2.position.z); tCountry.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tCountry.visible = false;
  tCity.position.set(CX, 4.0, -2.6); tCity.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(CX - 0.7, CX, u), lerp(1.4, 2.6, u), lerp(4.6, 6.4, u), lerp(CX - 0.8, CX, u), lerp(1.0, 2.6, u), -3, 56);
  return qs;
}
function shotStreet(t) { // 17〜25：大きな住人も、小さな住人も、ひとつの街で暮らす
  base(); S.aim(SX, 0); lift(-80); S.hemi.intensity = 1.3;
  CROWD.forEach(p => p.visible = true);
  CROWD.forEach((p, i) => { const x = p.userData.x0 + p.userData.d * t * p.userData.sp; p.position.set(SX + (((x - SX + 7) % 14) + 14) % 14 - 7, 0, p.userData.z); p.rotation.y = p.userData.d * Math.PI / 2; walk(p, t * 5 + i, 1); });
  tBigSmall.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tBigSmall.visible = false;
  tOne.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(SX - 0.4, SX + 0.4, u), 2.6, lerp(9.6, 9.0, u), SX, 2.0, -1.4, 56);
  return qs;
}
function shotDuo(t) { // 25〜33：手を組んだのは、口のうまい詐欺師。追うのは連続行方不明事件
  base(); S.aim(AX, 0); lift(-80); S.hemi.intensity = 1.1;
  fox4.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 3) * 0.2; fox4.userData.head.rotation.y = -0.3 + Math.sin(t * 1.3) * 0.15;
  hero4.userData.head.rotation.y = 0.4; hero4.rotation.y = 0.2; fox4.rotation.y = -0.2;
  tCon.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tCon.visible = false;
  POSTERS.forEach((p, i) => { p.scale.setScalar(t > 4.0 + i * 0.2 ? Math.max(0.01, easeBack(clamp((t - 4.0 - i * 0.2) / 0.3))) : 0.01); });
  tMiss.userData.pop((t - 5.4) / 0.35);
  hero4.userData.head.rotation.x = t > 4 ? -0.3 : 0;
  const u = ease(t / 8);
  look(lerp(AX + 0.3, AX, u), lerp(1.5, 1.9, u), lerp(3.6, 4.6, u), AX, lerp(0.9, 1.5, u), -0.6, 56);
  return qs;
}
function shotClock(t) { // 33〜42：アメリカの長編アニメ映画。期限は2日、失敗したらクビ
  base(); S.aim(TX, 0); lift(130); S.hemi.intensity = 1.2;
  HANDL.rotation.z = -t * 2.2; HANDS.rotation.z = -t * 0.18;
  tUSA.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tUSA.visible = false;
  tLimit.userData.pop((t - 4.2) / 0.35); tFire.userData.pop((t - 5.6) / 0.35);
  CLOCK.position.x = TX + (t > 5.6 && t < 6.4 ? Math.sin(t * 60) * 0.04 : 0);
  const u = ease(t / 9);
  look(TX, 2.3, lerp(7.2, 6.6, u), TX, 2.3, -1, 54);
  return qs;
}
function shotEars(t) { // 42〜49：決め手。主人公はウサギ初の警察官、相棒はキツネの詐欺師
  base(); S.aim(AX, 0); lift(140); S.hemi.intensity = 1.2;
  POSTERS.forEach(p => p.scale.setScalar(1));
  hero4.rotation.y = 0.1; fox4.rotation.y = -0.1; hero4.userData.head.rotation.set(0, 0, 0);
  popEars(hero4, (t - 0.4) / 0.4); popEars(fox4, (t - 3.4) / 0.4);
  tRabbit.userData.pop((t - 0.9) / 0.35); tFox.userData.pop((t - 3.8) / 0.35);
  const u = ease(t / 7);
  look(AX, lerp(1.6, 1.7, u), lerp(4.4, 4.0, u), AX, 1.3, 0, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の大都会を見上げるふたり）
  base(); S.aim(CX, -2); lift(-180);
  const d = ease(t / 1.0); S.darken(d * 0.75, '#0a1028'); S.hemi.intensity = lerp(1.25, 0.7, d); S.key.intensity = lerp(1.5, 0.2, d);
  TOWERS.forEach(b => b.material.emissiveIntensity = lerp(0.4, 1.2, d));
  heroQ.visible = true; foxQ.visible = true; heroQ.position.set(CX - 0.4, 0, 0.8); foxQ.position.set(CX + 0.4, 0, 0.8); heroQ.rotation.y = Math.PI; foxQ.rotation.y = Math.PI; popEars(heroQ, 1); popEars(foxQ, 1);
  heroQ.userData.head.rotation.x = -0.4; foxQ.userData.head.rotation.x = -0.3;
  const k = ease(t / 7);
  look(CX, lerp(1.5, 1.6, k), lerp(6.6, 5.8, k), CX, lerp(2.3, 2.8, k), -4, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotGrad(t, T) },
  { a: 9, b: 17, f: shotArrive },
  { a: 17, b: 25, f: shotStreet },
  { a: 25, b: 33, f: shotDuo },
  { a: 33, b: 42, f: shotClock },
  { a: 42, b: 49, f: shotEars },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '警察学校を、<br>首席で卒業。'],
  [5.6, 9.0, 'でもまわりは、<br>体の大きい仲間ばかり。'],
  [9.2, 13.2, '田舎町で育った、<br>小さな新人警察官。'],
  [13.2, 17.0, '配属されたのは、<br>大都会の警察署。'],
  [17.2, 21.0, '大きな住人も、<br>小さな住人も。'],
  [21.0, 25.0, 'みんなが、<br>ひとつの街で暮らしている。'],
  [25.2, 29.0, '手を組んだのは、<br>口のうまい詐欺師。'],
  [29.0, 33.0, '追うのは、<br>連続行方不明事件。'],
  [33.2, 37.4, 'アメリカの、<br>長編アニメ映画。'],
  [37.4, 41.8, '期限は2日。<br>失敗したら、クビ。'],
  [42.2, 45.4, '主人公は、<br>ウサギ初の警察官。'],
  [45.4, 49.0, '相棒は、<br>キツネの詐欺師。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ズートピア。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q027', v2: true, answer: 'ズートピア',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 2727,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [1.4, 5.6, 13.4, 29.4, 38.8, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'alarm'], [42.0, 'whoosh'], [42.6, 'poof'], [45.6, 'poof'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '警察学校': 'けいさつがっこう', '首席': 'しゅせき', '卒業': 'そつぎょう', '体': 'からだ', '大きい': 'おおきい', '仲間': 'なかま', '田舎町': 'いなかまち', '育った': 'そだった', '小さな': 'ちいさな', '新人': 'しんじん', '警察官': 'けいさつかん', '配属': 'はいぞく', '大都会': 'だいとかい', '警察署': 'けいさつしょ', '大きな': 'おおきな', '住人': 'じゅうにん', '街': 'まち', '暮らして': 'くらして', '手を組んだ': 'てをくんだ', '口': 'くち', '詐欺師': 'さぎし', '追う': 'おう', '連続': 'れんぞく', '行方不明': 'ゆくえふめい', '事件': 'じけん', '長編': 'ちょうへん', '映画': 'えいが', '期限': 'きげん', '2日': 'ふつか', '失敗': 'しっぱい', '主人公': 'しゅじんこう', '初': 'はつ', '相棒': 'あいぼう', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n警察学校を首席で卒業。でもまわりは、体の大きい仲間ばかり。田舎町で育った小さな新人警察官が配属されたのは、大都会の警察署だった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'DisneyPlus', '映画好き', 'アニメ映画'],
  },
});
applyQuizCards({ answer: 'ズートピア', info: 'Disney+｜アメリカのアニメ映画・109分', answerSize: 128 });
