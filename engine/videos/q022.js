import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #022 ミステリと言う勿れ（ドラマ・日本・2022年・フジテレビ月9。FODで見放題、justwatch.com/jp/テレビ番組/misuteritoyan-uwu-re で2026/11/3確認。
//   Filmarks 4.1・レビュー33,645件 filmarks.com/dramas/10765/15007）
// 確かめた事実：
//   ・原作は田村由美の漫画（小学館）。フジテレビの月9ドラマ。主人公は大学生の久能整。天然パーマがトレードマーク、友だちも恋人もいない、カレーが大好物（cinematoday.jp/page/A0008209）
//   ・第1話：身に覚えのない殺人事件の容疑をかけられ、任意同行を求められて刑事たちの取り調べを受ける。不利な証拠が次々に見つかる（cinematoday・ciatr.jp/topics/316567）
//   ・整は淡々と自分の考えを述べるだけだが、その言葉が事件の解決へつながっていく。バスジャックや爆破予告などの事件にも巻きこまれる（Filmarks の作品ページ）
// 構成（ヒント6段）：1 刑事がやってきて任意同行 → 2 友だちも恋人もいない大学生、好物はカレー → 3 取調室、不利な証拠が次々 → 4 淡々と話すだけで謎がほどける
//   → 5 日本の月9、人気漫画が原作、バスジャック・爆破予告 → 6 決め手：もじゃもじゃの天然パーマ、しゃべるだけで事件が解ける
// 天然パーマは6段目まで見せない（それまではニット帽）。犯人・事件の真相には触れない。俳優・ポスター・ロゴ・ドラマの部屋の作りは使わない。人が傷つく描写はなし

const S = quizStage({ bg: '#2a3040', floor: '#3a3a40', fogNear: 22, fogFar: 70 });
const qs = S.scene;
const R = rng(2222);

const HERO = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#c9b48a', pants: '#3a4050' };
const COP = (i) => ({ skin: ['#e8b98f', '#efcfae', '#d9a57c'][i % 3], hair: ['#1d1a19', '#5a5a5a', '#2c2421'][i % 3], shirt: ['#3a3e48', '#4a4038', '#2e3440'][i % 3], pants: '#22262f', tie: true });
const wood = mat('#6a4e38');

// 主人公：最初はニット帽（髪を見せない）。6段目で帽子を取ると、もじゃもじゃの髪
function makeHero() {
  const p = makePerson(HERO);
  const hairHex = new THREE.Color(HERO.hair).getHex();
  const head = p.userData.head;
  const plain = head.children.filter(o => o.material && o.material.color && o.material.color.getHex() === hairHex);
  const beanie = new THREE.Group(); head.add(beanie);
  { const b = box(0.46, 0.24, 0.44, mat('#3a5a7a')); b.position.y = 0.52; beanie.add(b); const r = box(0.48, 0.08, 0.46, mat('#2e4a66')); r.position.y = 0.42; beanie.add(r); }
  const curls = new THREE.Group(); head.add(curls); curls.visible = false;
  const cm = mat('#3a2a20'), geo = new THREE.SphereGeometry(0.1, 10, 8);
  const rr = rng(77);
  for (let i = 0; i < 70; i++) {
    const a = rr() * Math.PI * 2, e = rr() * Math.PI * 0.62;
    const x = Math.cos(a) * Math.sin(e) * 0.3, y = 0.3 + Math.cos(e) * 0.34, z = Math.sin(a) * Math.sin(e) * 0.3 - 0.03;
    if (z > 0.14 && y < 0.5) continue; // 顔にかからない
    const s = new THREE.Mesh(geo, cm); s.position.set(x, y, z); s.scale.setScalar(0.8 + rr() * 0.6); curls.add(s);
  }
  p.userData.setHair = (k) => { plain.forEach(o => o.visible = false); beanie.visible = k < 0.5; curls.visible = k >= 0.5; const s = 0.6 + easeOut(clamp((k - 0.5) * 2)) * 0.4; curls.scale.setScalar(s); };
  p.userData.setHair(0);
  return p;
}

// ---------- 1. 冬の朝のアパート（x=0）。玄関に刑事が2人。0秒目がサムネ ----------
const APT = new THREE.Group(); qs.add(APT);
{ const fl = box(9, 0.1, 8, mat('#8a7458')); fl.position.set(0, 0.05, 0); APT.add(fl);
  const wl = box(9, 3.4, 0.2, mat('#d8d0c0')); wl.position.set(0, 1.7, -3); APT.add(wl);
  const wr = box(0.2, 3.4, 8, mat('#cfc6b4')); wr.position.set(3.6, 1.7, 0); APT.add(wr);
  const kitchen = box(2.6, 0.9, 0.7, mat('#e8e4dc')); kitchen.position.set(-2.2, 0.45, -2.5); APT.add(kitchen);
  const stove = box(0.7, 0.04, 0.5, mat('#2a2a2e')); stove.position.set(-2.4, 0.92, -2.5); APT.add(stove);
  const door = box(0.08, 2.2, 1.0, mat('#7a5a40')); door.position.set(3.48, 1.1, 0.4); APT.add(door);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ color: '#c8d8e8' })); win.position.set(0.6, 1.9, -2.88); APT.add(win); }
const POT = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.26, 20), mat('#9aa0a8')); b.position.y = 0.13; POT.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20), mat('#8a5a1e')); c.position.y = 0.24; POT.add(c); } POT.position.set(-2.4, 0.94, -2.5); qs.add(POT);
const STEAM = [0, 1, 2].map(i => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 })); qs.add(s); return s; });
const hero1 = makeHero(); hero1.position.set(-0.7, 0, -1.4); hero1.rotation.y = Math.PI; qs.add(hero1);
const COPS1 = [0, 1].map(i => { const p = makePerson(COP(i)); p.position.set(2.2, 0, -0.3 + i * 0.7); p.rotation.y = -Math.PI / 2; qs.add(p); return p; });
const tKnock = tag('任意同行', { size: 84, w: 440, bg: '#e2483c', sx: 1.1 }); tKnock.position.set(1.25, 2.55, 0.1); qs.add(tKnock);

// ---------- 2. ひとりの部屋（x=30）。友だち0・恋人0、好物はカレー ----------
{ const g = new THREE.Group(); g.position.set(30, 0, 0); qs.add(g);
  const fl = box(8, 0.1, 7, mat('#7a6a58')); fl.position.y = 0.05; g.add(fl);
  const wl = box(8, 3.4, 0.2, mat('#d4ccbc')); wl.position.set(0, 1.7, -2.6); g.add(wl);
  const desk = box(1.6, 0.06, 0.8, wood); desk.position.set(0.3, 0.75, -1.4); g.add(desk);
  for (const [x, z] of [[-0.42, -1.75], [1.02, -1.75], [-0.42, -1.05], [1.02, -1.05]]) { const l = box(0.06, 0.75, 0.06, wood); l.position.set(x, 0.375, z); g.add(l); }
  const shelf = box(1.2, 2.0, 0.4, mat('#5a4430')); shelf.position.set(-2.4, 1.0, -2.3); g.add(shelf);
  for (let i = 0; i < 12; i++) { const bk = box(0.08, 0.32, 0.26, mat(['#a83a3a', '#3a5a8a', '#e6b450', '#3a7a5a'][i % 4])); bk.position.set(-2.9 + (i % 6) * 0.18, 0.55 + Math.floor(i / 6) * 0.6, -2.2); g.add(bk); } }
const hero2 = makeHero(); hero2.position.set(30.3, 0, -0.75); hero2.rotation.y = Math.PI; qs.add(hero2);
const PLATE = new THREE.Group(); { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.04, 24), mat('#f4f4f0')); PLATE.add(p); const rice = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#fbfaf2')); rice.position.set(-0.07, 0.02, 0); PLATE.add(rice); const ru = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 20), mat('#9a5a1a')); ru.position.set(0.08, 0.035, 0); PLATE.add(ru); } PLATE.position.set(30.3, 0.8, -1.35); qs.add(PLATE);
const tFriend = tag('友だち 0人', { size: 74, w: 420, bg: '#14161c', sx: 0.9 }); tFriend.position.set(29.75, 2.45, -1.0); qs.add(tFriend);
const tLove = tag('恋人 0人', { size: 74, w: 380, bg: '#14161c', sx: 0.82 }); tLove.position.set(30.85, 2.45, -1.0); qs.add(tLove);
const tCurry = tag('大好物はカレー', { size: 70, w: 520, bg: '#e6b450', color: '#14161c', sx: 1.15 }); tCurry.position.set(30.3, 2.45, -1.0); qs.add(tCurry);

// ---------- 3・4・クイズ. 取調室（x=60） ----------
const IX = 60;
{ const g = new THREE.Group(); g.position.set(IX, 0, 0); qs.add(g);
  const fl = box(7, 0.1, 7, mat('#5a5a5e')); fl.position.y = 0.05; g.add(fl);
  const wl = box(7, 3.4, 0.2, mat('#9a9c9e')); wl.position.set(0, 1.7, -2.6); g.add(wl);
  for (const s of [-1, 1]) { const w = box(0.2, 3.4, 7, mat('#8a8c90')); w.position.set(s * 3.5, 1.7, 0); g.add(w); }
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.0), new THREE.MeshBasicMaterial({ color: '#2a2e36' })); mirror.position.set(0.6, 1.9, -2.48); g.add(mirror);
  const tb = box(1.8, 0.08, 1.0, mat('#7a7066')); tb.position.set(0, 0.78, 0); g.add(tb);
  for (const [x, z] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) { const l = box(0.06, 0.78, 0.06, mat('#4a4a4e')); l.position.set(x, 0.39, z); g.add(l); }
  const lampArm = box(0.04, 0.5, 0.04, mat('#2a2a2e')); lampArm.position.set(-0.6, 1.07, -0.2); g.add(lampArm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 16, 1, true), mat('#2a2a2e')); shade.position.set(-0.6, 1.3, -0.2); g.add(shade); }
const DESKL = new THREE.PointLight(0xfff0d0, 0, 6, 1.2); DESKL.position.set(IX - 0.6, 1.25, -0.2); qs.add(DESKL);
const hero3 = makeHero(); hero3.position.set(IX, -0.36, 0.85); hero3.rotation.y = Math.PI; hero3.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); qs.add(hero3);
const COPS3 = [0, 1, 2].map(i => { const p = makePerson(COP(i)); p.position.set(IX - 0.7 + i * 0.7, 0, -1.15 - (i === 1 ? 0.25 : 0)); qs.add(p); return p; });
COPS3[1].position.y = -0.36; COPS3[1].userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); COPS3[1].position.z = -0.85;
const EVID = [0, 1, 2, 3].map(i => { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), new THREE.MeshLambertMaterial({ color: ['#f4f0e4', '#e8eef4', '#f4ece0', '#eef4ea'][i] })); d.rotation.x = -Math.PI / 2; d.rotation.z = (R() - 0.5) * 0.5; d.userData.home = new THREE.Vector3(IX - 0.6 + i * 0.4, 0.83, 0.05); qs.add(d); return d; });
const tRoom = tag('取調室', { size: 84, w: 360, bg: '#14161c', sx: 0.9 }); tRoom.position.set(IX + 0.2, 2.75, -2.0); qs.add(tRoom);
const tEvid = tag('不利な証拠が次々', { size: 64, w: 560, bg: '#e2483c', sx: 1.3 }); tEvid.position.set(IX, 2.75, -1.6); qs.add(tEvid);
const QM = [0, 1, 2].map(i => { const t = tag('？', { size: 100, w: 170, h: 170, bg: '#3a3e48', sx: 0.4 }); t.position.set(IX - 0.7 + i * 0.7, 2.6, -1.0); qs.add(t); return t; });
const EX = [0, 1, 2].map(i => { const t = tag('！', { size: 100, w: 170, h: 170, bg: '#e6b450', color: '#14161c', sx: 0.4 }); t.position.set(IX - 0.7 + i * 0.7, 2.6, -1.0); qs.add(t); return t; });
const BUB = [0, 1, 2].map(i => { const t = tag('…', { size: 90, w: 200, h: 150, bg: '#ffffff', color: '#14161c', sx: 0.42 }); t.position.set(IX + 0.45 + i * 0.18, 1.9 + i * 0.3, 0.9); qs.add(t); return t; });
const tSolve = tag('話すだけで謎がほどける', { size: 60, w: 700, bg: '#e6b450', color: '#14161c', sx: 1.5 }); tSolve.position.set(IX, 3.15, -1.4); qs.add(tSolve);

// ---------- 5. 日本の夜（x=100）：バスと、爆破予告のタイマー ----------
const BX = 100;
{ const g = new THREE.Group(); g.position.set(BX, 0, 0); qs.add(g);
  const road = box(30, 0.04, 6, mat('#34363c')); road.position.set(0, 0.02, 0); g.add(road);
  for (let i = 0; i < 10; i++) { const l = box(1.2, 0.05, 0.12, mat('#e8e8e8')); l.position.set(-12 + i * 2.8, 0.05, 0); g.add(l); } }
const BUS = new THREE.Group(); { const b = box(5.6, 2.0, 2.0, mat('#e8eaee')); b.position.y = 1.35; BUS.add(b); const st = box(5.62, 0.22, 2.02, mat('#3a7a5a')); st.position.y = 0.7; BUS.add(st); const w = box(4.6, 0.6, 2.04, mat('#1c2430')); w.position.set(-0.3, 1.75, 0); BUS.add(w); const fw = box(0.04, 0.9, 1.7, mat('#1c2430')); fw.position.set(2.81, 1.65, 0); BUS.add(fw); for (const x of [-1.8, 1.8]) for (const z of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 16), mat('#1a1a1c')); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.36, z); BUS.add(wh); } } qs.add(BUS);
const TIMER = new THREE.Group(); TIMER.position.set(BX + 1.0, 2.9, 1.6); qs.add(TIMER);
const TIMER_C = document.createElement('canvas'); TIMER_C.width = 512; TIMER_C.height = 220; const TIMER_T = new THREE.CanvasTexture(TIMER_C); TIMER_T.colorSpace = THREE.SRGBColorSpace;
let lastTm = '';
function drawTimer(s) { const v = `00:${String(Math.max(0, s)).padStart(2, '0')}`; if (v === lastTm) return; lastTm = v; const g = TIMER_C.getContext('2d'); g.fillStyle = '#0c0e12'; g.fillRect(0, 0, 512, 220); g.strokeStyle = '#e2483c'; g.lineWidth = 10; g.strokeRect(8, 8, 496, 204); g.fillStyle = '#ff4a3a'; g.font = '900 150px "Noto Sans CJK JP", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(v, 256, 118); TIMER_T.needsUpdate = true; }
drawTimer(59);
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.78), new THREE.MeshBasicMaterial({ map: TIMER_T, fog: false })); TIMER.add(m); }
const tJP = tag('日本の月9ドラマ', { size: 66, w: 560, sx: 3.2, bg: '#e6b450', color: '#14161c' }); tJP.position.set(BX, 5.0, 1.2); qs.add(tJP);
const tManga = tag('人気漫画が原作', { size: 62, w: 520, sx: 3.0, bg: '#14161c' }); tManga.position.set(BX, 4.2, 1.2); qs.add(tManga);
const tBus = tag('バスジャック', { size: 70, w: 460, bg: '#e2483c', sx: 2.8 }); tBus.position.set(BX + 0.3, 4.9, 1.2); qs.add(tBus);
const tBomb = tag('爆破予告', { size: 70, w: 360, bg: '#e2483c', sx: 2.2 }); tBomb.position.set(BX + 1.0, 3.75, 1.6); qs.add(tBomb);

// ---------- 6. 決め手（x=130）：帽子を取ると、もじゃもじゃの天然パーマ ----------
const FX = 130;
{ const back = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: '#e6b450' })); back.position.set(FX, 1.9, -1.6); qs.add(back);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(3, 48), mat('#2e3444')); fl.rotation.x = -Math.PI / 2; fl.position.set(FX, 0.02, 0); qs.add(fl); }
const hero6 = makeHero(); hero6.position.set(FX, 0, 0); qs.add(hero6);
const tPerm = tag('天然パーマ', { size: 84, w: 440, bg: '#e2483c', sx: 1.2 }); tPerm.position.set(FX, 2.75, 0.3); qs.add(tPerm);
const tTalk = tag('しゃべるだけで解決', { size: 62, w: 600, bg: '#14161c', sx: 1.5 }); tTalk.position.set(FX, 3.2, 0.3); qs.add(tTalk);

// ---------- shots ----------
const ALL = [tKnock, tFriend, tLove, tCurry, tRoom, tEvid, tSolve, tJP, tManga, tBus, tBomb, tPerm, tTalk, ...QM, ...EX, ...BUB];
function base() { S.reset(); ALL.forEach(x => x.visible = false); DESKL.intensity = 0; EVID.forEach(e => e.visible = false); STEAM.forEach(s => s.visible = false); TIMER.visible = false; BUS.visible = false; }
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }

function shotDoor(t, T) { // 0〜9：朝の部屋に、刑事がやってくる（0秒目がサムネ：振り向く青年と、玄関の刑事）
  base(); S.aim(0, 0); lift(-110);
  S.hemi.intensity = 1.1;
  STEAM.forEach((s, i) => { s.visible = true; const u = ((T * 0.5 + i / 3) % 1); s.position.set(-2.4 + Math.sin(u * 6 + i) * 0.05, 1.25 + u * 0.7, -2.5); s.material.opacity = 0.5 * (1 - u); });
  const k = ease(T / 2.2); COPS1.forEach((p, i) => { p.position.x = lerp(1.9, 1.1 + i * 0.3, k); walk(p, T * 7, T < 2.2 ? 1 : 0); });
  hero1.rotation.y = lerp(Math.PI * 0.75, 0.6, ease((T - 0.0) / 0.6));
  if (T > 3.2) COPS1[0].userData.arms[1].rotation.x = -1.3 * ease((T - 3.2) / 0.5);
  tKnock.userData.pop((T - 3.4) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.45, 0.5, u), lerp(2.0, 1.9, u), lerp(7.6, 6.9, u), lerp(0.4, 0.45, u), 1.2, -0.8, 54);
  return qs;
}
function shotAlone(t) { // 9〜17：友だちも恋人もいない大学生。大好物はカレー
  base(); S.aim(30, -1); lift(60);
  S.hemi.intensity = 1.2;
  hero2.userData.arms[1].rotation.x = -0.9 + Math.sin(t * 4) * 0.12; hero2.userData.head.rotation.x = 0.25;
  tFriend.userData.pop((t - 0.6) / 0.35); tLove.userData.pop((t - 1.6) / 0.35);
  if (t > 4.0) { tFriend.visible = false; tLove.visible = false; }
  tCurry.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(30.9, 30.6, u), lerp(2.2, 2.0, u), lerp(3.4, 2.8, u), 30.3, 1.35, -1.2, 58);
  return qs;
}
function roomLight(d = 0) { S.darken(0.55 + d * 0.35, '#0c0e14'); S.hemi.intensity = 0.8 - d * 0.5; S.key.intensity = 0.5 - d * 0.4; DESKL.intensity = 3; }
function shotRoom(t) { // 17〜25：取調室。刑事に囲まれ、不利な証拠が次々に置かれる
  base(); S.aim(IX, 0); lift(80); roomLight();
  hero3.rotation.y = Math.PI; COPS3.forEach((p, i) => { p.rotation.y = 0; });
  tRoom.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tRoom.visible = false;
  EVID.forEach((e, i) => { const k = easeOut(clamp((t - 4.0 - i * 0.45) / 0.3)); e.visible = k > 0; e.position.copy(e.userData.home); e.position.y += (1 - k) * 0.5; });
  if (t > 4.0) COPS3[0].userData.arms[1].rotation.x = -0.8 * Math.max(0, Math.sin((t - 4.0) * 3));
  tEvid.userData.pop((t - 5.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(IX + 2.4, IX + 2.0, u), lerp(2.4, 2.2, u), lerp(3.8, 3.4, u), IX, 1.15, -0.4, 54);
  return qs;
}
function shotTalk(t) { // 25〜33：彼は淡々と話すだけ。その言葉が、事件の謎をほどいていく
  base(); S.aim(IX, 0); lift(60); roomLight();
  EVID.forEach(e => { e.visible = true; e.position.copy(e.userData.home); });
  hero3.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 2.2) * 0.2;
  BUB.forEach((b, i) => { const k = (t - 0.5 - i * 0.6); b.userData.pop(k / 0.3); if (t > 3.6) b.visible = false; });
  QM.forEach((q, i) => { q.userData.pop((t - 1.0 - i * 0.25) / 0.3); if (t > 4.6 + i * 0.25) q.visible = false; });
  EX.forEach((q, i) => q.userData.pop((t - 4.6 - i * 0.25) / 0.3));
  COPS3.forEach((p, i) => { p.userData.head.rotation.x = t > 4.6 + i * 0.25 ? -0.15 : 0.12; });
  tSolve.userData.pop((t - 5.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(IX - 0.4, IX - 0.2, u), lerp(2.3, 2.4, u), lerp(4.4, 4.0, u), IX, 1.5, -0.6, 56);
  return qs;
}
function shotJapan(t) { // 33〜42：日本の月9ドラマ、人気漫画が原作。バスジャックに爆破予告まで
  base(); S.aim(BX, 0); lift(120);
  S.darken(0.7, '#0e1424'); S.hemi.intensity = 0.8; S.key.intensity = 0.6;
  BUS.visible = true; BUS.position.set(BX - 3 + t * 0.9, 0, -0.4); BUS.children.forEach(c => { if (c.geometry && c.geometry.type === 'CylinderGeometry') c.rotation.y = 0; });
  tJP.userData.pop((t - 0.4) / 0.35); tManga.userData.pop((t - 1.6) / 0.35);
  if (t > 4.2) { tJP.visible = false; tManga.visible = false; }
  tBus.userData.pop((t - 4.4) / 0.35);
  TIMER.visible = t > 5.6; drawTimer(59 - Math.floor(Math.max(0, t - 5.6) * 2));
  tBomb.userData.pop((t - 5.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(BX - 0.6, BX + 0.6, u), lerp(3.0, 3.2, u), lerp(10.5, 10.0, u), lerp(BX - 0.2, BX + 0.8, u), 2.4, 0, 56);
  return qs;
}
function shotPerm(t) { // 42〜49：決め手。帽子を取ると、もじゃもじゃの天然パーマ。しゃべるだけで事件が解ける
  base(); S.aim(FX, 0); lift(40);
  S.darken(0.5, '#141826'); S.hemi.intensity = 1.2;
  const off = ease((t - 0.6) / 0.6);
  hero6.userData.arms[1].rotation.x = -2.6 * Math.sin(Math.PI * clamp((t - 0.3) / 1.2));
  hero6.userData.setHair(clamp((t - 0.6) / 1.0));
  tPerm.userData.pop((t - 1.8) / 0.35);
  tTalk.userData.pop((t - 3.6) / 0.35);
  if (t > 3.6) hero6.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 3) * 0.2;
  const u = ease(t / 7);
  look(FX, lerp(2.0, 1.95, u), lerp(5.4, 4.8, u), FX, 1.85, 0, 50);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（暗い取調室で、ひとり話しつづける）
  base(); S.aim(IX, 0); lift(220); roomLight(ease(t / 1.0));
  EVID.forEach(e => { e.visible = true; e.position.copy(e.userData.home); });
  S.spot.position.set(IX, 3.2, 1.6); S.spot.target.position.set(IX, 1.3, 0.85); S.spot.intensity = lerp(0, 14, ease((t - 0.4) / 1.0)); S.spot.color.set(0xffe0a0);
  hero3.userData.setHair(1);
  hero3.userData.arms[0].rotation.x = -0.5 + Math.sin(t * 2.2) * 0.2;
  const k = ease(t / 7);
  look(lerp(IX + 1.6, IX + 0.9, k), lerp(2.6, 2.3, k), lerp(4.4, 3.6, k), IX, 1.5, 0.4, 50);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotDoor(t, T) },
  { a: 9, b: 17, f: shotAlone },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotTalk },
  { a: 33, b: 42, f: shotJapan },
  { a: 42, b: 49, f: shotPerm },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'ある朝、突然<br>刑事がやってきた。'],
  [5.6, 9.0, '身に覚えのない、<br>殺人事件の容疑。'],
  [9.2, 13.2, '友だちも恋人もいない、<br>ひとりの大学生。'],
  [13.2, 17.0, '大好物は、<br>カレー。'],
  [17.2, 21.0, '連れていかれたのは、<br>警察の取調室。'],
  [21.0, 25.0, '不利な証拠が、<br>次々に出てくる。'],
  [25.2, 29.0, '彼はただ淡々と、<br>自分の考えを話すだけ。'],
  [29.0, 33.0, 'その言葉が、<br>事件の謎をほどいていく。'],
  [33.2, 37.4, '日本の月9ドラマ。<br>人気漫画が原作。'],
  [37.4, 41.8, 'バスジャックに、<br>爆破予告まで。'],
  [42.2, 45.6, 'トレードマークは、<br>もじゃもじゃの天然パーマ。'],
  [45.6, 49.0, '推理じゃなく、<br>おしゃべりで事件が解ける。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ミステリと言う勿れ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q022', v2: true, answer: 'ミステリと言う勿れ',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 2222,
    hits: [5.6, 21.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 3.4, 21.0, 29.6, 37.4, 42.8, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'alarm'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '勿れ': 'なかれ', '言う': 'いう', '突然': 'とつぜん', '刑事': 'けいじ', '身に覚え': 'みにおぼえ', '殺人事件': 'さつじんじけん', '容疑': 'ようぎ', '友だち': 'ともだち', '恋人': 'こいびと', '大学生': 'だいがくせい', '大好物': 'だいこうぶつ', '連れて': 'つれて', '警察': 'けいさつ', '取調室': 'とりしらべしつ', '不利': 'ふり', '証拠': 'しょうこ', '次々': 'つぎつぎ', '淡々': 'たんたん', '自分': 'じぶん', '考え': 'かんがえ', '言葉': 'ことば', '事件': 'じけん', '謎': 'なぞ', '日本': 'にほん', '月9': 'げっく', '人気漫画': 'にんきまんが', '原作': 'げんさく', '爆破予告': 'ばくはよこく', '天然パーマ': 'てんねんパーマ', '推理': 'すいり', '解ける': 'とける', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nある朝、突然刑事がやってきた。身に覚えのない、殺人事件の容疑。友だちも恋人もいない、ひとりの大学生。連れていかれたのは、警察の取調室だった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'FOD', '月9', 'ドラマ好き', '謎解き'],
  },
});
applyQuizCards({ answer: 'ミステリと言う勿れ', info: 'FOD｜日本のドラマ', answerSize: 96 });
