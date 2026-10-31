import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson } from '../lib.js';
import { cam, lift, look, runStory, endCard, setTop, el, textSprite } from '../story.js';

// タイトル当てクイズ #001（映画・ドラマ紹介アカウントの試作）
// お題：地面師たち（Netflix・全7話）。作品の映像・キャラクター・ロゴは使わず、設定だけを汎用の3Dで見せる
// もしもラボのエンジンを流用。ロゴとまとめカードはこのファイルの中で差し替える（エンジン本体は触らない）

const qs = new THREE.Scene();
const BG = new THREE.Color('#1a2130');
qs.background = BG.clone();
qs.fog = new THREE.Fog(0x1a2130, 22, 60);
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x2a2418, 1.25); qs.add(hemi);
const key = new THREE.DirectionalLight(0xfff0dc, 1.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 }); qs.add(key); qs.add(key.target);
const spot = new THREE.SpotLight(0xff3b2e, 0, 16, 0.42, 0.5, 1.2); spot.castShadow = true; qs.add(spot); qs.add(spot.target);
const warn = new THREE.PointLight(0xff3a2a, 0, 14, 1.2); warn.position.set(60, 3, 4); qs.add(warn);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 80), mat('#20283a')); floor.rotation.x = -Math.PI / 2; floor.position.x = 90; floor.receiveShadow = true; qs.add(floor);

// ---------- 1. 売地と金塊（x=0） ----------
const plot = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), mat('#55703f')); plot.rotation.x = -Math.PI / 2; plot.position.y = 0.02; plot.receiveShadow = true; qs.add(plot);
const wood = mat('#c9b48c');
for (let i = -4; i <= 4; i += 1) for (const [x, z] of [[i, -4], [i, 4], [-4, i], [4, i]]) { const p = box(0.1, 0.6, 0.1, wood); p.position.set(x, 0.3, z); qs.add(p); }
for (const [x, z, r] of [[0, -4, 0], [0, 4, 0], [-4, 0, 1], [4, 0, 1]]) for (const y of [0.25, 0.48]) { const b = box(8, 0.05, 0.05, wood); b.position.set(x, y, z); if (r) b.rotation.y = Math.PI / 2; qs.add(b); }
const signTex = canvasTex(512, 320, (g, w, h) => {
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c4302b'; g.lineWidth = 16; g.strokeRect(16, 16, w - 32, h - 32);
  g.fillStyle = '#c4302b'; g.font = '900 176px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('売地', w / 2, h / 2 + 10);
});
for (const x of [2.15, 3.25]) { const p = box(0.1, 1.7, 0.1, wood); p.position.set(x, 0.85, 1.9); p.rotation.y = 0.3; qs.add(p); }
const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), new THREE.MeshLambertMaterial({ map: signTex })); sign.position.set(2.7, 1.3, 1.95); sign.rotation.y = 0.3; sign.castShadow = true; qs.add(sign);
const goldM = new THREE.MeshStandardMaterial({ color: '#e0ad3e', metalness: 0.6, roughness: 0.3, emissive: '#3a2a08' });
const barGeo = new THREE.BoxGeometry(0.8, 0.22, 0.36);
const BARS = [];
const PILES = [[-1.2, -0.7], [0, -0.7], [1.2, -0.7], [-1.2, 0.6], [0, 0.6], [1.2, 0.6]];
for (let L = 0; L < 6; L++) PILES.forEach(([px, pz], pi) => { for (let k = 0; k < 2; k++) {
  const b = new THREE.Mesh(barGeo, goldM); b.castShadow = true; b.receiveShadow = true; const off = (k - 0.5) * 0.4;
  if (L % 2 === 0) b.position.set(px, 0.13 + L * 0.22, pz + off); else { b.position.set(px + off, 0.13 + L * 0.22, pz); b.rotation.y = Math.PI / 2; }
  b.userData.y = b.position.y; b.userData.d = L * 0.09 + pi * 0.012 + k * 0.004 - 0.2; qs.add(b); BARS.push(b);
} });
function setGold(t) { // 0.0〜0.6秒で上からドンと落ちる
  for (const b of BARS) { const u = clamp((t - b.userData.d) / 0.32); b.visible = u > 0; b.position.y = b.userData.y + (1 - easeOut(u)) * 3.2; }
}
const SUIT = { skin: '#efcfae', hair: '#1d1a19', shirt: '#2b3040', pants: '#22262f', tie: true };
const seller = makePerson({ ...SUIT, shirt: '#3a4152' }); seller.position.set(-1.0, 0, 2.5); seller.rotation.y = 0.5; qs.add(seller);
const sellerQ = textSprite('？', { size: 110, w: 160, h: 160, sx: 0.55, bg: '#ffffff', color: '#e04848', radius: 80, depthTest: false }); sellerQ.position.set(-1.0, 2.55, 2.5); sellerQ.renderOrder = 8; qs.add(sellerQ);

// ---------- 2. 本物の地主とニセモノ（x=20） ----------
const rug = new THREE.Mesh(new THREE.CircleGeometry(2.8, 48), mat('#2b3450')); rug.rotation.x = -Math.PI / 2; rug.position.set(20, 0.02, 0); rug.receiveShadow = true; qs.add(rug);
const OWNER = { skin: '#ecc9a6', hair: '#a8a8a8', shirt: '#7a6650', pants: '#3b3f4a' };
const owner = makePerson(OWNER); owner.position.set(19.4, 0, 0); qs.add(owner);
const fake = makePerson(OWNER); fake.position.set(20.6, 0, 0); qs.add(fake);
const fakeMats = []; fake.traverse(o => { if (o.isMesh && !fakeMats.includes(o.material)) fakeMats.push(o.material); });
fakeMats.forEach(m => { m.userData.base = m.color.clone(); });
const ownerMats = []; owner.traverse(o => { if (o.isMesh && !ownerMats.includes(o.material)) { o.material.transparent = true; ownerMats.push(o.material); } });
const BLACK = new THREE.Color('#07080b');
function tintFake(k) { fakeMats.forEach(m => m.color.copy(BLACK).lerp(m.userData.base, k)); }
const tagReal = textSprite('本物', { size: 84, w: 320, h: 150, sx: 0.95, bg: 'rgba(10,12,18,.85)', depthTest: false }); tagReal.position.set(19.4, 2.45, 0); tagReal.renderOrder = 8; qs.add(tagReal);
const tagFake = textSprite('ニセモノ', { size: 84, w: 440, h: 150, sx: 1.3, bg: '#e2483c', depthTest: false }); tagFake.position.set(20.6, 2.45, 0); tagFake.renderOrder = 8; qs.add(tagFake);
const baseScale = (sp) => { const v = sp.scale.clone(); return (k) => { const s = easeBack(clamp(k)); sp.visible = k > 0; sp.scale.set(v.x * s, v.y * s, 1); }; };
const popReal = baseScale(tagReal), popFake = baseScale(tagFake), popQ = baseScale(sellerQ);

// ---------- 3. 偽造書類とハンコ（x=40） ----------
const desk = box(4.6, 0.9, 2.8, mat('#4a3426')); desk.position.set(40, 0.45, 0); qs.add(desk);
const DOCS = [['旅券', 'PASSPORT', '#22365c', '#e3cf96'], ['印鑑登録証明書', 'CERTIFICATE', '#f3efe4', '#2b2b2b'], ['登記済証', 'REGISTRY', '#f3efe4', '#2b2b2b']];
const DX = [38.75, 40, 41.25];
const SEALS = [];
const sealTex = canvasTex(256, 256, (g) => { g.strokeStyle = '#d0261d'; g.lineWidth = 18; g.beginPath(); g.arc(128, 128, 106, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#d0261d'; g.font = '900 150px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('偽', 128, 136); });
DOCS.forEach(([jp, en, bg, ink], i) => {
  const tex = canvasTex(512, 690, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = ink; g.textAlign = 'center';
    g.font = `900 ${jp.length > 4 ? 56 : 84}px "Noto Sans CJK JP", sans-serif`; g.fillText(jp, w / 2, i === 0 ? 270 : 130);
    g.font = '700 32px "Noto Sans CJK JP", sans-serif'; g.fillText(en, w / 2, i === 0 ? 330 : 182);
    if (i === 0) { g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.arc(w / 2, 460, 72, 0, Math.PI * 2); g.stroke(); }
    else { g.fillStyle = 'rgba(40,40,40,.3)'; for (let y = 240; y < 630; y += 44) g.fillRect(64, y, w - 128 - ((y * 7) % 96), 14); }
  });
  const d = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.4), new THREE.MeshLambertMaterial({ map: tex })); d.rotation.x = -Math.PI / 2; d.rotation.z = (i - 1) * -0.07; d.position.set(DX[i], 0.905, 0); d.receiveShadow = true; qs.add(d);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), new THREE.MeshBasicMaterial({ map: sealTex, transparent: true, opacity: 0, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.position.set(DX[i] + 0.2, 0.913, 0.34); qs.add(s); SEALS.push(s);
});
const hanko = new THREE.Group();
{ const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.64, 24), mat('#dcb98c')); b.position.y = 0.32; b.castShadow = true; hanko.add(b);
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.05, 24), mat('#c0221a')); r.position.y = 0.025; hanko.add(r); }
qs.add(hanko);
const STAMP = [1.0, 2.3, 3.6];
function setStamps(t) {
  let hx = DX[0] - 1.0 + 0.2, hy = 1.15;
  STAMP.forEach((st, i) => {
    const d = t - st, prev = i ? DX[i - 1] + 0.2 : DX[0] - 1.0 + 0.2;
    if (d > -0.5 && d < 0.7) { hx = lerp(prev, DX[i] + 0.2, ease((d + 0.5) / 0.4)); hy = d < 0 ? 1.15 : d < 0.12 ? lerp(1.15, 0.915, d / 0.12) : d < 0.3 ? 0.915 : lerp(0.915, 1.15, ease((d - 0.3) / 0.3)); }
    else if (d >= 0.7) { hx = DX[i] + 0.2; hy = 1.15; }
    SEALS[i].material.opacity = d >= 0.12 ? 1 : 0;
  });
  hanko.position.set(hx, hy, 0.34);
}

// ---------- 4. 大手デベロッパーのビル（x=60） ----------
const TOWERS = [[60, -6, 3.4, 16, 3.4, 11], [56, -8.5, 2.6, 10, 2.6, 12], [64.2, -9, 2.8, 12.5, 2.8, 13], [52.6, -10, 2.2, 7, 2.2, 14], [67.8, -11, 2.4, 8.5, 2.4, 15]];
for (const [x, z, w, h, d, seed] of TOWERS) {
  const { map, emi } = windowTextures(seed, '#3a4458'); map.repeat.set(w / 1.4, h / 1.4); emi.repeat.set(w / 1.4, h / 1.4);
  const side = new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: emi, emissiveIntensity: 0.9 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, mat('#262d3c'), mat('#262d3c'), side, side]); m.position.set(x, h / 2, z); m.castShadow = true; qs.add(m);
}
const team3 = [['#2b3040', -0.9, 2.2, 0.15], ['#3d4558', 0, 2.5, 0], ['#463c34', 0.9, 2.2, -0.15]];
const watchers = team3.map(([c, dx, z, r]) => { const p = makePerson({ ...SUIT, shirt: c }); p.position.set(60 + dx, 0, z); p.rotation.y = Math.PI + r; qs.add(p); return p; });

// ---------- 5〜7. 円卓のチーム（x=80） ----------
const table = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.1, 48), mat('#4a3426')); table.position.set(80, 0.88, 0); table.castShadow = true; table.receiveShadow = true; qs.add(table);
const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.84, 20), mat('#2e2118')); leg.position.set(80, 0.42, 0); qs.add(leg);
const cash = new THREE.Mesh(barGeo, goldM); cash.position.set(80.2, 1.05, 0.1); cash.rotation.y = 0.4; qs.add(cash);
const ROLES = ['リーダー', '交渉役', '法律屋', '手配師', '偽造屋'];
const ROLE_C = ['#1f2229', '#3d4a66', '#6b4d3a', '#3e5a58', '#5a4c6b'];
const TEAM = [], ROLE_TAG = [];
for (let i = 0; i < 5; i++) {
  const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
  const x = 80 + Math.cos(a) * 2.25, z = Math.sin(a) * 2.25;
  const p = makePerson({ ...SUIT, shirt: ROLE_C[i], hair: i === 0 ? '#121212' : '#2c2421' });
  p.position.set(x, 0, z); p.userData.face = Math.atan2(80 - x, -z); p.rotation.y = p.userData.face; qs.add(p); TEAM.push(p);
  const tg = textSprite(ROLES[i], { size: 80, w: 420, h: 150, sx: 1.6, bg: i === 0 ? '#e6b450' : 'rgba(10,12,18,.86)', color: i === 0 ? '#14161c' : '#ffffff', depthTest: false });
  tg.position.set(x, 2.75, z); tg.renderOrder = 8; qs.add(tg); ROLE_TAG.push(baseScale(tg));
}
const leader = TEAM[0];
spot.position.set(80, 5.2, 0.4); spot.target.position.set(80, 1.3, leader.position.z);

// ---------- shots ----------
function reset() {
  qs.background.copy(BG); qs.fog.color.copy(BG);
  hemi.intensity = 1.25; key.intensity = 1.5; spot.intensity = 0; warn.intensity = 0;
  sellerQ.visible = false; tagReal.visible = false; tagFake.visible = false; ROLE_TAG.forEach(f => f(0));
  hanko.visible = false;
}
function aim(cx) { key.position.set(cx + 6, 12, 8); key.target.position.set(cx, 0, 0); }

function shotLand(t, T) { // 0〜9：売地に金塊がドン（0秒目がサムネ）
  reset(); aim(0); lift(150);
  setGold(T);
  popQ((T - 3.0) / 0.35);
  const u = ease(T / 9);
  look(lerp(4.2, 3.2, u), lerp(4.4, 3.7, u), lerp(10.2, 8.4, u), 0, 1.15, -0.6, 50);
  return qs;
}
function shotFake(t) { // 9〜17：本物の横にニセモノが現れる
  reset(); aim(20); lift(260); setGold(99);
  const k = ease((t - 0.7) / 1.0); fake.scale.setScalar(Math.max(1e-4, k)); fake.visible = k > 0.001;
  tintFake(ease((t - 1.8) / 1.6));
  const fadeOwner = lerp(1, 0.3, ease((t - 5.4) / 1.2)); ownerMats.forEach(m => { m.opacity = fadeOwner; m.depthWrite = fadeOwner > 0.98; });
  popReal((t - 0.3) / 0.4); tagReal.material.opacity = fadeOwner;
  popFake((t - 4.4) / 0.4);
  const u = ease(t / 8);
  look(20, lerp(2.1, 1.8, u), lerp(8.6, 7.0, u), 20, 1.25, 0, 42);
  return qs;
}
function shotDocs(t) { // 17〜25：書類に次々ハンコ
  reset(); aim(40); lift(300); hanko.visible = true;
  setStamps(t);
  const u = ease(t / 8);
  look(40, lerp(5.2, 4.0, u), lerp(3.6, 2.6, u), 40, 0.9, 0.15, 46);
  return qs;
}
function shotTarget(t) { // 25〜33：大手デベロッパーを見上げる。ミスで終わる、で赤い警告
  reset(); aim(60); lift(180);
  const u = ease(t / 8);
  look(60, lerp(2.7, 2.4, u), lerp(9.8, 8.0, u), 60, lerp(5, 9.5, u), -5, 52);
  if (t > 4.1) { const k = t - 4.1; const p = Math.max(0, Math.sin(k * Math.PI * 2.2)) * clamp(1 - k / 3.6); warn.intensity = 30 * p; qs.background.copy(BG).lerp(new THREE.Color('#5a1a16'), 0.6 * p); qs.fog.color.copy(qs.background); hemi.intensity = 1.0; }
  return qs;
}
function teamAngle(t) { return lerp(-0.55, 0.5, ease(t / 9)); }
function teamCam(a) { return [80 + Math.sin(a) * 11.5, 7.4, Math.cos(a) * 11.5]; }
function shotTeam(t) { // 33〜42：円卓を回り込む。字幕のあとに役割が順番に出る
  reset(); aim(80); lift(240);
  TEAM.forEach(p => { p.rotation.y = p.userData.face; });
  ROLE_TAG.forEach((f, i) => f((t - (6.6 + i * 0.32)) / 0.35));
  const c = teamCam(teamAngle(t)); look(c[0], c[1], c[2], 80, 0.9, 0, 46);
  return qs;
}
function turnToLeader(k) {
  TEAM.forEach((p, i) => { if (!i) return; let r = p.userData.face; const lk = Math.atan2(leader.position.x - p.position.x, leader.position.z - p.position.z); let d = lk - r; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; p.rotation.y = r + d * k; });
}
const DARK = new THREE.Color('#06070a');
function shotTwist(t) { // 42〜49：照明が落ちてリーダーだけ赤く
  reset(); aim(80); lift(200);
  const d = ease(t / 1.3);
  hemi.intensity = lerp(1.25, 0.12, d); key.intensity = lerp(1.5, 0, d); spot.intensity = lerp(0, 60, ease((t - 0.8) / 1.0));
  qs.background.copy(BG).lerp(DARK, d); qs.fog.color.copy(qs.background);
  turnToLeader(ease((t - 1.4) / 1.4));
  const k = ease(t / 6.5), s = teamCam(0.5);
  const lp = leader.position;
  look(lerp(s[0], 80, k), lerp(s[1], 2.25, k), lerp(s[2], 1.6, k), lerp(80, lp.x, k), lerp(0.9, 1.85, k), lerp(0, lp.z, k), lerp(46, 40, k));
  return qs;
}
function shotQuiz(t) { // 49〜56：この作品わかった？ 3・2・1
  reset(); aim(80); lift(200);
  hemi.intensity = 0.12; key.intensity = 0; spot.intensity = 60; qs.background.copy(DARK); qs.fog.color.copy(DARK);
  turnToLeader(1);
  const k = ease(t / 7), lp = leader.position;
  look(80, lerp(2.25, 9.5, k), lerp(1.6, 8.5, k), lerp(lp.x, 80, k), lerp(1.85, 0.6, k), lerp(lp.z, 0, k), lerp(40, 46, k));
  const c = t - 3.0;
  if (c >= 0 && c < 3) setTop('答えはこのあと', String(3 - Math.floor(c)), 1, '#e6b450');
  else if (c >= 3) setTop('答えはこのあと', '？', fadeIn(c - 3), '#e6b450');
  return qs;
}
const fadeIn = (u) => clamp(u / 0.2);

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotLand(t, T) },
  { a: 9, b: 17, f: shotFake },
  { a: 17, b: 25, f: shotDocs },
  { a: 25, b: 33, f: shotTarget },
  { a: 33, b: 42, f: shotTeam },
  { a: 42, b: 49, f: shotTwist },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];

// 字幕（ナレーションもこの文を字幕の時刻から読む）。56秒からの2行はまとめカードの下に隠れて、声だけになる
const SUBS = [
  [2.5, 5.4, '持ち主じゃない人間が'],
  [5.4, 9.0, '100億円の土地を<br>売った。'],
  [9.2, 13.3, '本物の地主に<br>そっくりな人を用意する。'],
  [13.3, 17.0, 'その名も、<br>なりすまし役。'],
  [17.2, 20.9, 'パスポートも、<br>印鑑証明も'],
  [20.9, 25.0, '全部ニセモノ。'],
  [25.2, 29.0, '狙うのは、<br>大手デベロッパー。'],
  [29.0, 33.0, 'ひとつのミスで、<br>全員終わる。'],
  [33.2, 37.4, '詐欺のプロが、<br>チームを組む。'],
  [37.4, 39.6, '役割は完全分業。'],
  [42.2, 45.4, 'でも本当に<br>怖いのは'],
  [45.4, 49.0, 'だまされる側<br>じゃない。'],
  [49.2, 52.0, 'この作品、<br>わかった？'],
  [52.0, 55.8, 'わかった人は、<br>コメントで答えて。'],
  [56.4, 59.6, '答えは、地面師たち。'],
  [59.6, 63.6, '観た人は感想を、<br>まだの人は保存して。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotFake || f === shotDocs,
  meta: {
    id: 'q001', v2: true,
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 101,
    hits: [5.6, 20.9, 56.4], risers: [52.0],
    impacts: [0.35, 5.6, 21.0, 56.4],
    sfx: [[9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.1, 'alarm'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '地面師': 'じめんし', '100億円': 'ひゃくおくえん', 'なりすまし役': 'なりすましやく', '印鑑証明': 'いんかんしょうめい' },
    caption: 'このドラマのタイトル、わかる？\n持ち主じゃない人間が、100億円の土地を売った。本物の地主にそっくりな人を立てて、書類は全部ニセモノ。狙うのは大手デベロッパー。\n\n答えは動画の最後で。わかった人はコメントで答えて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'ドラマ紹介', 'どんでん返し'],
  },
});

// ---------- このアカウント用にロゴとまとめカードを差し替える（エンジン共通部分はそのまま） ----------
{
  const nm = document.querySelector('#logo .nm'); if (nm) nm.textContent = 'タイトル当てクイズ';
  const mk = document.querySelector('#logo .mk'); if (mk) mk.style.display = 'none';
  const end = document.getElementById('end');
  end.querySelector('.t').innerHTML = '<span style="display:block;font-size:44px;letter-spacing:14px;color:#cfd6df;margin-bottom:26px">答え</span><span style="color:#e6b450;font-size:128px;line-height:1.15">地面師たち</span>';
  end.querySelector('.s').innerHTML = '<span style="display:inline-block;padding:10px 34px;border:3px solid rgba(255,255,255,.5);border-radius:999px;font-size:40px;font-weight:900;color:#fff">Netflix｜全7話</span>';
  end.querySelector('.ask').innerHTML = '観た人はコメントで感想を<small>まだの人は保存して今夜観て</small>'; end.querySelector('.ask').style.color = '#e6b450';
  end.querySelector('.nx').innerHTML = '';
  end.querySelector('.lg').innerHTML = '<div style="font-family:\'M PLUS Rounded 1c\',sans-serif;font-size:46px;font-weight:800;letter-spacing:6px">タイトル当てクイズ</div><div style="font-size:24px;letter-spacing:6px;color:#8a94a3;margin-top:10px">フォローして次の問題を待ってて</div>';
  end.querySelector('.src').innerHTML = '作品の映像・画像は使っていません';
}
