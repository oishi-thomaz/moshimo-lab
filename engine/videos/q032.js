import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #032 プリズン・ブレイク（ドラマ・アメリカ・2005年〜・サスペンス。Disney+・Prime Videoで見放題、
//   justwatch.com/jp/テレビ番組/prison-break で2026/11/3確認。Filmarks シーズン1 4.4・レビュー34,626件 filmarks.com/dramas/88/335）
// 確かめた事実（itmedia.co.jp/news/article/0605/01/1060501020/）：
//   ・副大統領の兄弟を殺した罪で死刑を宣告された兄リンカーン。無実の罪で投獄された兄の命を救おうと、頭脳明晰な弟マイケルはみずから銀行強盗を働いて刑務所に入り、
//     兄を連れての脱獄を目指す。悪徳看守の嫌がらせ、手に負えない囚人たち。塀の外ではリンカーンの元恋人の弁護士が無実の証拠を探す。死刑執行までわずか30日間。
//   ・2005年8月に全米フォックスで放映スタート、全22話のTVシリーズ（シーズン1）。第63回ゴールデン・グローブ賞の作品賞・主演男優賞にノミネート。
//   ・マイケルはこの刑務所の改築工事に携わった建築技師。全身に彫られたタトゥーには、刑務所の設計図などが隠されている
//   ・全身に刑務所の見取り図のタトゥーを入れ、銀行強盗として刑務所に入った（ciatr.jp/topics/95062）
// 構成（ヒント6段）：1 頭のいい男が自分から銀行強盗、狙いは刑務所に入ること → 2 兄は無実の罪で死刑判決、執行まであと30日
//   → 3 高い塀の刑務所、悪い看守と危ない囚人 → 4 目指すのは兄を連れての脱獄、塀の外では弁護士が証拠を探す
//   → 5 2005年に始まったアメリカの連続ドラマ、シーズン1は全22話 → 6 決め手：全身のタトゥーに隠された刑務所の設計図
// 武器・けが・死刑の場面は出さない（銀行は警報だけ）。俳優の見た目・ポスター・ロゴ・タトゥーの実際の柄はなぞらない（汎用の青い線）。脱獄の成否・黒幕・結末には触れない

const S = quizStage({ bg: '#1a1e26', floor: '#262a32', fogNear: 24, fogFar: 90 });
const qs = S.scene;
const R = rng(3232);

const HERO = { skin: '#efcfae', hair: '#2a2420', shirt: '#2a3040', pants: '#1e222a', tie: true };
const HERO_P = { skin: '#efcfae', hair: '#2a2420', shirt: '#5a7aa0', pants: '#3a4a6a' };
const BRO = { skin: '#e8c4a0', hair: '#3a2a20', shirt: '#d8742a', pants: '#d8742a' };
const INM = (i) => ({ skin: ['#e8c4a0', '#8a5a3a', '#f0d0b0', '#6a4a30'][i % 4], hair: ['#2a2420', '#121212', '#6a4a2a', '#1a1a1a'][i % 4], shirt: '#5a7aa0', pants: '#3a4a6a' });
const GUARD = { skin: '#efcfae', hair: '#3a3a3a', shirt: '#2a3a5a', pants: '#1a2236' };
const LAWYER = { skin: '#f3d2b4', hair: '#5a3a24', shirt: '#3a3a44', pants: '#2a2a32', long: true, skirt: true };
const TELLER = { skin: '#f1cfb0', hair: '#3a2a20', shirt: '#e8e4dc', pants: '#3a3a44', long: true };
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }

// ---------- 1段目. 銀行（x=0）。頭のいい男が、自分から銀行強盗。赤い警報 ----------
{ const fl = box(12, 0.04, 9, mat('#c8c0b0')); fl.position.set(0, 0.02, 0); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#d8d4cc')); wl.position.set(0, 2.5, -2.8); qs.add(wl);
  const ctr = box(6, 1.1, 0.8, mat('#6a4a32')); ctr.position.set(0, 0.55, -1.2); qs.add(ctr);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshLambertMaterial({ color: '#cfe6f0', transparent: true, opacity: 0.25 })); glass.position.set(0, 1.7, -1.2); qs.add(glass);
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 32), new THREE.MeshStandardMaterial({ color: '#a8acb4', metalness: 0.8, roughness: 0.3 })); vault.rotation.x = Math.PI / 2; vault.position.set(2.8, 1.6, -2.65); qs.add(vault); }
const ALARM = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshBasicMaterial({ color: '#ff2a1a' })); ALARM.position.set(-2.2, 3.6, -2.6); qs.add(ALARM);
const ALARML = new THREE.PointLight(0xff2a1a, 0, 14, 1.2); ALARML.position.set(-2.2, 3.4, -1.8); qs.add(ALARML);
const teller = makePerson(TELLER); teller.position.set(0.2, 0, -1.9); qs.add(teller);
const hero1 = makePerson(HERO); hero1.position.set(0.2, 0, 0.0); hero1.rotation.y = Math.PI; qs.add(hero1);
const NOTE = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.24), new THREE.MeshBasicMaterial({ color: '#f8f6ee' })); NOTE.rotation.x = -Math.PI / 2; NOTE.position.set(0.15, 1.115, -0.95); qs.add(NOTE);
const tRob = tag('自分から銀行強盗', { size: 64, w: 560, bg: '#e2483c', sx: 1.5 }); tRob.position.set(0.5, 2.3, 0.2); qs.add(tRob);
const tAim = tag('狙いは刑務所', { size: 70, w: 460, bg: '#14161c', sx: 1.4 }); tAim.position.set(0.5, 2.3, 0.2); qs.add(tAim);

// ---------- 2段目. 独房の兄（x=30）。無実の罪で死刑判決、あと30日 ----------
const CX = 30;
{ const fl = box(8, 0.04, 6, mat('#5a5a5e')); fl.position.set(CX, 0.02, 0); qs.add(fl);
  const back = box(8, 4, 0.2, mat('#6a6a70')); back.position.set(CX, 2, -2.0); qs.add(back);
  for (const s of [-1, 1]) { const sd = box(0.2, 4, 3, mat('#606066')); sd.position.set(CX + s * 2.2, 2, -0.6); qs.add(sd); }
  const bed = box(1.8, 0.45, 0.8, mat('#8a8a8a')); bed.position.set(CX - 1.0, 0.25, -1.4); qs.add(bed);
  for (let i = 0; i < 11; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.6, 8), new THREE.MeshStandardMaterial({ color: '#4a4c52', metalness: 0.7, roughness: 0.4 })); b.position.set(CX - 2.0 + i * 0.4, 1.8, 0.9); qs.add(b); } }
const bro = makePerson(BRO); bro.position.set(CX - 0.6, 0.45, -1.3); bro.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(bro);
const DAYC = document.createElement('canvas'); DAYC.width = 256; DAYC.height = 300; const DAYT = new THREE.CanvasTexture(DAYC); DAYT.colorSpace = THREE.SRGBColorSpace;
let lastDay = -1;
function setDay(n) { if (n === lastDay) return; lastDay = n; const g = DAYC.getContext('2d'); g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, 256, 300); g.fillStyle = '#c8261d'; g.fillRect(0, 0, 256, 70); g.fillStyle = '#ffffff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('あと', 128, 38); g.fillStyle = '#1a1a1e'; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.fillText(String(n), 128, 172); g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.fillText('日', 128, 270); DAYT.needsUpdate = true; }
const DAY = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.17), new THREE.MeshBasicMaterial({ map: DAYT })); DAY.position.set(CX + 1.0, 2.2, -1.88); qs.add(DAY);
const tInno = tag('無実の罪で死刑', { size: 64, w: 520, bg: '#14161c', sx: 1.5 }); tInno.position.set(CX - 0.2, 2.7, 0.6); qs.add(tInno);

// ---------- 3段目. 高い塀の刑務所（x=60）。悪い看守と、危ない囚人たち ----------
const PX = 60;
{ const yard = box(20, 0.04, 14, mat('#7a7468')); yard.position.set(PX, 0.02, -2); qs.add(yard);
  const wallM = mat('#9a948a'); const w1 = box(20, 6, 0.6, wallM); w1.position.set(PX, 3, -8); qs.add(w1);
  for (const s of [-1, 1]) { const ws = box(0.6, 6, 14, wallM); ws.position.set(PX + s * 10, 3, -2); qs.add(ws); }
  for (let i = 0; i < 20; i++) { const wire = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 6, 14), mat('#8a8c92')); wire.position.set(PX - 9.5 + i, 6.25, -8); qs.add(wire); }
  const tower = box(1.6, 8.5, 1.6, mat('#7a746a')); tower.position.set(PX + 7.5, 4.25, -7.6); qs.add(tower); const cab = box(2.2, 1.4, 2.2, mat('#5a5650')); cab.position.set(PX + 7.5, 9.1, -7.6); qs.add(cab);
  const bld = box(8, 7, 3, mat('#8a8478')); bld.position.set(PX - 4, 3.5, -10.5); qs.add(bld); }
const SEARCH = new THREE.SpotLight(0xfff4d0, 0, 30, 0.18, 0.4, 1); SEARCH.position.set(PX + 7.5, 9.6, -6.8); qs.add(SEARCH); qs.add(SEARCH.target);
const INMATES = [0, 1, 2, 3, 4, 5].map(i => { const p = makePerson(INM(i)); p.userData.x0 = PX - 5 + i * 2; p.userData.z = -3 + (i % 3) * 1.4; p.userData.d = i % 2 ? 1 : -1; qs.add(p); return p; });
const guard = makePerson(GUARD); guard.position.set(PX + 2.6, 0, 0.6); guard.rotation.y = -0.6; qs.add(guard);
{ const capp = box(0.46, 0.12, 0.46, mat('#1a2236')); capp.position.y = 0.52; guard.userData.head.add(capp); const bat = box(0.06, 0.5, 0.06, mat('#121212')); bat.position.set(0, -0.6, 0.1); guard.userData.arms[1].add(bat); }
const tWall = tag('高い塀の刑務所', { size: 68, w: 520, bg: '#14161c', sx: 2.4 }); tWall.position.set(PX, 4.2, -1.5); qs.add(tWall);
const tGuard = tag('悪い看守', { size: 66, w: 340, bg: '#e2483c', sx: 1.4 }); tGuard.position.set(PX + 1.8, 2.5, 0.6); qs.add(tGuard);
const tCons = tag('危ない囚人たち', { size: 62, w: 480, bg: '#e6b450', color: '#14161c', sx: 1.8 }); tCons.position.set(PX - 1.0, 3.2, -1.2); qs.add(tCons);

// ---------- 4段目. 塀の中と外（x=90）。兄を連れての脱獄、外では弁護士が証拠を探す ----------
const WX = 90;
{ const inside = box(10, 0.04, 8, mat('#7a7468')); inside.position.set(WX - 3.2, 0.02, 0); qs.add(inside);
  const outside = box(6, 0.04, 8, mat('#4a6a3a')); outside.position.set(WX + 5, 0.02, 0); qs.add(outside);
  const wall = box(0.6, 3.2, 8, mat('#9a948a')); wall.position.set(WX + 1.8, 1.6, 0); qs.add(wall); }
const heroW = makePerson(HERO_P); heroW.position.set(WX - 2.2, 0, 0.6); heroW.rotation.y = Math.PI / 2; qs.add(heroW);
const broW = makePerson(BRO); broW.position.set(WX - 3.0, 0, 0.0); broW.rotation.y = Math.PI / 2; qs.add(broW);
const lawyer = makePerson(LAWYER); lawyer.position.set(WX + 4.0, 0, 0.4); lawyer.rotation.y = -0.6; qs.add(lawyer);
const DOCS = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ color: '#f8f6ee', side: THREE.DoubleSide })); qs.add(DOCS);
const DOTS = []; for (let i = 0; i < 12; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), new THREE.MeshBasicMaterial({ color: '#e6b450' })); d.rotation.x = -Math.PI / 2; const k = i / 11; d.position.set(lerp(WX - 1.8, WX + 1.4, k), 0.06, lerp(0.6, -0.6, k) + Math.sin(k * Math.PI) * 1.2); qs.add(d); DOTS.push(d); }
const tEscape = tag('兄を連れて脱獄', { size: 64, w: 520, bg: '#e2483c', sx: 1.6 }); tEscape.position.set(WX - 1.8, 2.6, 0.4); qs.add(tEscape);
const tLaw = tag('外では弁護士が', { size: 60, w: 500, bg: '#14161c', sx: 1.5 }); tLaw.position.set(WX + 3.4, 2.5, 0.4); qs.add(tLaw);

// ---------- 5段目. 22話ぶんの光るパネル（x=120）。2005年に始まったアメリカの連続ドラマ ----------
const EX = 120;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#141a28' })); bg.position.set(EX, 4, -3); qs.add(bg); }
const EPS = []; for (let i = 0; i < 22; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.06), new THREE.MeshBasicMaterial({ color: '#2a3248' })); m.position.set(EX - 2.4 + (i % 6) * 0.96, 3.4 - Math.floor(i / 6) * 0.6, -1.5); qs.add(m); EPS.push(m); }
const tUSA = tag('2005年〜 アメリカのドラマ', { size: 56, w: 760, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tUSA.position.set(EX, 4.6, -1.2); qs.add(tUSA);
const t22 = tag('シーズン1は全22話', { size: 62, w: 620, bg: '#e2483c', sx: 2.6 }); t22.position.set(EX, 4.6, -1.2); qs.add(t22);

// ---------- 6段目. 全身のタトゥー（x=150）。隠されているのは刑務所の設計図 ----------
const TX = 150;
const BLUE = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e8c8a8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a4a8a'; g.lineWidth = 5; for (let i = 0; i < 9; i++) { g.strokeRect(14 + (i * 37) % 180, 12 + (i * 53) % 190, 40 + (i * 17) % 50, 30 + (i * 23) % 50); } g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(0, 40 * i + 10); g.lineTo(w, 40 * i + 30); } g.stroke(); });
const hero6 = makePerson({ ...HERO_P, shirt: '#e8c8a8' });
hero6.traverse(o => { if (o.isMesh && o.material.color && (o.material.color.getHexString() === 'e8c8a8')) { o.material = new THREE.MeshLambertMaterial({ map: BLUE }); } });
hero6.position.set(TX, 0, 0); qs.add(hero6);
{ const fl = new THREE.Mesh(new THREE.CircleGeometry(3, 40), mat('#2a2e38')); fl.rotation.x = -Math.PI / 2; fl.position.set(TX, 0.02, 0); qs.add(fl); }
const PLAN = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ map: canvasTex(512, 360, (g, w, h) => { g.fillStyle = '#1a3a7a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#cfe6ff'; g.lineWidth = 4; g.strokeRect(20, 20, w - 40, h - 40); for (let i = 0; i < 5; i++) g.strokeRect(50 + i * 85, 60, 60, 90); g.strokeRect(50, 200, 400, 100); g.setLineDash([12, 10]); g.strokeStyle = '#ffd860'; g.lineWidth = 6; g.beginPath(); g.moveTo(80, 120); g.lineTo(80, 250); g.lineTo(420, 250); g.lineTo(470, 330); g.stroke(); }), transparent: true, opacity: 0, side: THREE.DoubleSide })); PLAN.position.set(TX, 3.0, -0.6); qs.add(PLAN);
const tTat = tag('全身のタトゥー', { size: 66, w: 500, bg: '#14161c', sx: 1.5 }); tTat.position.set(TX, 2.55, 0.3); qs.add(tTat);
const tPlan = tag('刑務所の設計図', { size: 66, w: 520, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tPlan.position.set(TX, 1.85, 0.6); qs.add(tPlan);

// ---------- shots ----------
const ALL = [tRob, tAim, tInno, tWall, tGuard, tCons, tEscape, tLaw, tUSA, t22, tTat, tPlan];
function base() { S.reset(); INMATES.forEach(p => p.visible = false); ALL.forEach(x => x.visible = false); ALARML.intensity = 0; SEARCH.intensity = 0; }

function shotBank(t, T) { // 1段目 0〜9：頭のいい男が、自分から銀行強盗。狙いは、刑務所に入ること（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-200); S.hemi.intensity = 1.0;
  const blink = 0.5 + 0.5 * Math.sin(T * 7);
  ALARML.intensity = 10 + 15 * blink; ALARM.material.color.setRGB(1, 0.15 + 0.2 * blink, 0.1);
  S.scene.background.lerp(new THREE.Color('#3a1010'), 0.2 * blink); S.scene.fog.color.copy(S.scene.background);
  teller.userData.arms[0].rotation.x = -2.6; teller.userData.arms[1].rotation.x = -2.6; teller.userData.arms[0].rotation.z = -0.3; teller.userData.arms[1].rotation.z = 0.3;
  hero1.rotation.y = Math.PI + lerp(0, Math.PI - 0.3, ease((T - 4.6) / 1.0));
  tRob.userData.pop(1); if (T > 4.6) tRob.visible = false;
  tAim.userData.pop((T - 4.8) / 0.35);
  const u = ease(T / 9);
  look(lerp(3.0, 2.6, u), lerp(2.3, 2.2, u), lerp(3.6, 3.2, u), lerp(-0.1, 0.0, u), 1.15, -0.8, 54);
  return qs;
}
function shotCell(t) { // 2段目 9〜17：兄は、無実の罪で死刑を言い渡された。執行まで、あと30日
  base(); S.aim(CX, 0); lift(-40); S.hemi.intensity = 0.7; S.key.intensity = 0.5; S.darken(0.4, '#0a0c12');
  setDay(t < 4.2 ? 30 : 30);
  bro.userData.head.rotation.x = 0.4; bro.userData.arms[0].rotation.x = -0.6; bro.userData.arms[1].rotation.x = -0.6;
  tInno.userData.pop((t - 0.5) / 0.35);
  DAY.scale.setScalar(t > 4.2 ? 1 + 0.12 * Math.max(0, 1 - (t - 4.2) * 2) : 1);
  const u = ease(t / 8);
  look(CX + lerp(0.3, 0.1, u), lerp(1.9, 1.8, u), lerp(5.4, 4.8, u), CX + 0.1, 1.6, -1.2, 56);
  return qs;
}
function shotYard(t) { // 3段目 17〜25：高い塀に囲まれた刑務所。悪い看守に、危ない囚人たち
  base(); S.aim(PX, -2); lift(-30); S.hemi.intensity = 1.4; S.darken(0.15, '#2a2a30');
  SEARCH.intensity = 120; SEARCH.target.position.set(PX + Math.sin(t * 0.8) * 5, 0, -3 + Math.cos(t * 0.6) * 2);
  INMATES.forEach(p => p.visible = true);
  INMATES.forEach((p, i) => { const x = p.userData.x0 + p.userData.d * t * 0.5; p.position.set(PX + (((x - PX + 7) % 14) + 14) % 14 - 7, 0, p.userData.z); p.rotation.y = p.userData.d * Math.PI / 2; walk(p, t * 4 + i, 0.7); });
  guard.userData.arms[1].rotation.x = -0.3 + Math.sin(t * 2) * 0.1;
  tWall.userData.pop((t - 0.5) / 0.35); if (t > 3.9) tWall.visible = false;
  tGuard.userData.pop((t - 4.1) / 0.35); tCons.userData.pop((t - 4.6) / 0.35);
  const u = ease(t / 8);
  look(PX + lerp(-0.6, 0.6, u), lerp(3.4, 2.8, u), lerp(10.0, 9.0, u), PX, lerp(3.0, 1.8, u), -3, 56);
  return qs;
}
function shotPlan(t) { // 4段目 25〜33：目指すのは、兄を連れての脱獄。塀の外では、弁護士が無実の証拠を探す
  base(); S.aim(WX, 0); lift(-20); S.hemi.intensity = 1.3;
  DOTS.forEach((d, i) => { d.visible = t > 0.8 + i * 0.15; });
  heroW.userData.arms[1].rotation.x = -1.2; heroW.userData.head.rotation.y = -0.3;
  DOCS.position.set(lawyer.position.x - 0.3, 1.2, lawyer.position.z + 0.3); DOCS.rotation.set(-0.6, -0.6, 0);
  lawyer.userData.arms[0].rotation.x = -1.0; lawyer.userData.arms[1].rotation.x = -1.0; lawyer.userData.head.rotation.x = 0.3;
  tEscape.userData.pop((t - 0.8) / 0.35); if (t > 4.0) tEscape.visible = false;
  tLaw.userData.pop((t - 4.2) / 0.35);
  const pan = ease((t - 3.6) / 1.4);
  look(lerp(WX - 1.4, WX + 2.6, pan), 5.6, 6.8, lerp(WX - 1.4, WX + 2.6, pan), 0.6, 0, 54);
  return qs;
}
function shotEps(t) { // 5段目 33〜42：2005年に始まった、アメリカの連続ドラマ。シーズン1は、全22話
  base(); S.aim(EX, 0); lift(-20);
  EPS.forEach((m, i) => { const on = t > 4.4 + i * 0.09; m.material.color.set(on ? (i === 0 ? '#e2483c' : '#e6b450') : '#2a3248'); m.scale.setScalar(on ? 1 + 0.15 * Math.max(0, 1 - (t - 4.4 - i * 0.09) * 4) : 1); });
  tUSA.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tUSA.visible = false;
  t22.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(EX, 2.8, lerp(8.4, 7.8, u), EX, 3.0, -1.5, 56);
  return qs;
}
function shotTattoo(t) { // 6段目 42〜49（決め手）：全身のタトゥーに隠されているのは、刑務所の設計図
  base(); S.aim(TX, 0); lift(-40); S.hemi.intensity = 1.1; S.darken(0.5, '#0a0e1a');
  hero6.rotation.y = Math.sin(t * 0.5) * 0.25; hero6.userData.arms[0].rotation.z = -0.25; hero6.userData.arms[1].rotation.z = 0.25;
  tTat.userData.pop((t - 0.4) / 0.35); if (t > 3.2) tTat.visible = false;
  PLAN.material.opacity = 0.92 * ease((t - 3.3) / 0.8); PLAN.position.y = 3.0 + 0.05 * Math.sin(t * 2);
  tPlan.userData.pop((t - 3.4) / 0.35);
  const u = ease(t / 7);
  look(TX, lerp(1.8, 2.2, u), lerp(3.6, 4.6, u), TX, lerp(1.4, 2.0, u), 0, 56);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の塀。サーチライトの下に男）
  base(); S.aim(PX, -2); lift(-30);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.0, 0.18, d); S.key.intensity = lerp(1.0, 0, d); S.darken(lerp(0.3, 1, d), '#05060a');
  INMATES.forEach(p => p.visible = false); guard.visible = false;
  heroW.position.set(PX, 0, -4); heroW.rotation.y = 0; heroW.userData.arms[1].rotation.x = 0; heroW.userData.head.rotation.set(-0.3, 0, 0);
  S.spot.position.set(PX, 6, -1); S.spot.target.position.set(PX, 1, -4); S.spot.intensity = lerp(0, 70, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(PX + 0.4, lerp(2.0, 2.3, k), lerp(0.2, -1.0, k), PX, lerp(1.6, 2.6, k), -8, 56);
  countdown(t);
  return qs;
}
function restore() { guard.visible = true; heroW.position.set(WX - 2.2, 0, 0.6); heroW.rotation.y = Math.PI / 2; heroW.userData.head.rotation.set(0, 0, 0); }

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => { restore(); return shotBank(t, T); } },
  { a: 9, b: 17, f: (t) => { restore(); return shotCell(t); } },
  { a: 17, b: 25, f: (t) => { restore(); return shotYard(t); } },
  { a: 25, b: 33, f: (t) => { restore(); return shotPlan(t); } },
  { a: 33, b: 42, f: (t) => { restore(); return shotEps(t); } },
  { a: 42, b: 49, f: (t) => { restore(); return shotTattoo(t); } },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '頭のいい男が、<br>自分から銀行強盗。'],
  [5.6, 9.0, '狙いは、<br>刑務所に入ること。'],
  [9.2, 13.2, '兄は、無実の罪で<br>死刑を言い渡された。'],
  [13.2, 17.0, '執行まで、<br>あと30日。'],
  [17.2, 21.0, '高い塀に囲まれた、<br>刑務所。'],
  [21.0, 25.0, '悪い看守に、<br>危ない囚人たち。'],
  [25.2, 29.0, '目指すのは、<br>兄を連れての脱獄。'],
  [29.0, 33.0, '塀の外では、弁護士が<br>無実の証拠を探す。'],
  [33.2, 37.4, '2005年に始まった、<br>アメリカの連続ドラマ。'],
  [37.4, 41.8, 'シーズン1は、<br>全22話。'],
  [42.2, 45.4, '全身のタトゥーに<br>隠されているのは、'],
  [45.4, 49.0, 'その刑務所の、<br>設計図。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、プリズン・ブレイク。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q032', v2: true, answer: 'プリズン・ブレイク',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 3232,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [5.0, 9.6, 13.4, 21.2, 25.8, 29.2, 37.6, 45.6, 56.4],
    sfx: [[0.2, 'alarm'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.4, 'meter', 0.4], [42.0, 'whoosh'], [45.4, 'poof'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '頭のいい': 'あたまのいい', '男': 'おとこ', '自分から': 'じぶんから', '銀行強盗': 'ぎんこうごうとう', '狙い': 'ねらい', '刑務所': 'けいむしょ', '入る': 'はいる', '兄': 'あに', '無実': 'むじつ', '罪': 'つみ', '死刑': 'しけい', '言い渡された': 'いいわたされた', '執行': 'しっこう', '30日': 'さんじゅうにち', '高い塀': 'たかいへい', '囲まれた': 'かこまれた', '悪い': 'わるい', '看守': 'かんしゅ', '危ない': 'あぶない', '囚人': 'しゅうじん', '目指す': 'めざす', '連れて': 'つれて', '脱獄': 'だつごく', '塀の外': 'へいのそと', '弁護士': 'べんごし', '証拠': 'しょうこ', '探す': 'さがす', '2005年': 'にせんごねん', '始まった': 'はじまった', '連続': 'れんぞく', '全22話': 'ぜんにじゅうにわ', '全身': 'ぜんしん', '隠されて': 'かくされて', '設計図': 'せっけいず', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n頭のいい男が、自分から銀行強盗。狙いは、刑務所に入ること。兄は無実の罪で死刑を言い渡され、執行まであと30日。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', 'DisneyPlus', '海外ドラマ', 'ドラマ好き'],
  },
});
applyQuizCards({ answer: 'プリズン・<br>ブレイク', info: 'Disney+｜アメリカのドラマ', answerSize: 124 });
