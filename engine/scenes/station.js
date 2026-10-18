import * as THREE from 'three';
import { rng, mat, box, canvasTex, windowTextures, makeSky, randPerson, poseWalk, clamp, lerp, mergeGeometries } from '../lib.js';

// =====================================================
// STATION: 島式ホーム（架空の駅 もしも台）・2本の線路・屋根・発車標・駅名標・架線柱・まわりのビル・電車・ホームの人
// 座標：ホームは x 方向に長い（x -60..60, z -3.6..3.6, 床の高さ PH=1.1）。線路は z = +TZ と -TZ（TZ=5.3）。
// API
//   station (Scene), setStationEnv('day'|'dusk'|'night')
//   PH（ホーム床の高さ）, TZ（線路の中心 z）
//   makeTrain({ cars, side, color, band, freight }) -> { g, setX(x), setDoors(k 0..1), setLights(on 0..1), len }  side: +1 / -1（どちらの線路か）。freight:true で機関車＋コンテナ車
//     setX(x) は編成の中央を x に置く
//   setBoard(rows, opt) 発車標：rows = [['普通','7:42','もしも台方面'], ...]  opt.stop = '運転見合わせ' で赤い全面表示、opt.blink = 0..1
//   board（発車標の Group。位置を動かしてよい。z をずらすと柱にかぶらない）, nameSign（駅名標）
//   makeRiders(n, seed, { x0, x1, z0, z1 }) -> { people, set(k, t, opt) }  ホームに立つ人。k 人だけ表示。opt.look（ランダムに首を振る）, opt.board（0..1 で電車側へ歩いて消える）
//   makeQs(n) -> { set(k, people, t) }  ？吹き出し
// 実在の鉄道会社の配色・ロゴは使わない（車体は銀＋もしもラボ系のティール帯）
// =====================================================
const station = new THREE.Scene();
const sky = makeSky(); station.add(sky);
station.fog = new THREE.Fog(0xd6e8f4, 60, 260);
const hemi = new THREE.HemisphereLight(0xffffff, 0x555a66, 1.1); station.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); sun.shadow.bias = -0.0006;
sun.position.set(30, 50, 25); station.add(sun); station.add(sun.target);
const roofLights = []; // canopy lights for dusk / night
const PH = 1.1, TZ = 5.3;

// ---- static batching ----
const ST = new Map();
function sb(w, h, d, m, x, y, z) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); if (!ST.has(m)) ST.set(m, []); ST.get(m).push(g); }
function flush() { for (const [m, gs] of ST) { const me = new THREE.Mesh(mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g)), m); me.castShadow = true; me.receiveShadow = true; station.add(me); } ST.clear(); }

const groundM = mat('#77736b'), ballastM = mat('#8b857b'), sleeperM = mat('#5b544c'), railM = mat('#b9bec6'), platM = mat('#c9cbcf'), edgeM = mat('#f0f1f2'), tactM = mat('#f2c14e'),
  roofM = mat('#dfe3e8'), roofUnderM = mat('#c4cbd4', { emissive: '#7a828e' }), colM = mat('#8e97a3'), poleM = mat('#7c8591'), benchM = mat('#4f6d8f'), wireM = new THREE.LineBasicMaterial({ color: 0x3a3f47 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; station.add(ground);
// tracks
for (const s of [-1, 1]) {
  const z = s * TZ;
  sb(400, 0.22, 3.4, ballastM, 0, 0.11, z);
  for (let x = -200; x <= 200; x += 0.7) sb(0.24, 0.12, 2.5, sleeperM, x, 0.28, z);
  for (const r of [-0.72, 0.72]) sb(400, 0.16, 0.1, railM, 0, 0.42, z + r);
}
// platform
sb(124, PH, 7.2, platM, 0, PH / 2, 0);
for (const s of [-1, 1]) { sb(124, 0.03, 0.18, edgeM, 0, PH + 0.015, s * 3.48); sb(124, 0.03, 0.32, tactM, 0, PH + 0.016, s * 2.85); }
// canopy (x -50..50) with columns on the center line
sb(100, 0.25, 6.4, roofM, 0, 4.85, 0); sb(100, 0.1, 6.0, roofUnderM, 0, 4.7, 0);
for (let x = -45; x <= 45; x += 10) { sb(0.3, 3.6, 0.3, colM, x, PH + 1.8, 0); sb(0.25, 0.25, 5.8, colM, x, 4.6, 0); }
// benches
for (const x of [-34, -20, 30, 44]) { sb(2.2, 0.08, 0.6, benchM, x, PH + 0.45, 0.8); sb(2.2, 0.5, 0.08, benchM, x, PH + 0.7, 1.1); sb(0.08, 0.45, 0.5, colM, x - 1, PH + 0.22, 0.8); sb(0.08, 0.45, 0.5, colM, x + 1, PH + 0.22, 0.8); }
// catenary poles + wires
for (let x = -190; x <= 190; x += 25) for (const s of [-1, 1]) { sb(0.3, 7, 0.3, poleM, x, 3.5, s * (TZ + 2.4)); sb(0.2, 0.2, 2.6, poleM, x, 6.6, s * (TZ + 1.2)); }
{
  const pts = []; for (const s of [-1, 1]) { pts.push(-200, 6.3, s * TZ, 200, 6.3, s * TZ, -200, 6.6, s * (TZ + 0.1), 200, 6.6, s * (TZ + 0.1)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); station.add(new THREE.LineSegments(g, wireM));
}
// buildings around the station
const BWALLS = ['#c9cfd9', '#b9c3d1', '#d8d2c8', '#aeb9c8', '#cfd6dc'];
const bMats = BWALLS.map((wc, i) => { const { map, emi } = windowTextures(500 + i * 31, wc); return new THREE.MeshLambertMaterial({ map, emissiveMap: emi, emissive: 0xffffff, emissiveIntensity: 0 }); });
{
  const r = rng(321); const byMat = new Map();
  for (const s of [-1, 1]) for (let x = -180; x < 180; x += 14 + r() * 8) {
    const w = 10 + r() * 6, d = 10 + r() * 10, h = 8 + r() * 34, z = s * (16 + r() * 10 + d / 2);
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv; for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; if (f === 2 || f === 3) { uv.setXY(i, 0.003, 0.997); continue; } const len = f < 2 ? d : w; uv.setXY(i, uv.getX(i) * len / 24, uv.getY(i) * h / 24); }
    g.translate(x, h / 2, z); const m = bMats[Math.floor(r() * bMats.length)]; if (!byMat.has(m)) byMat.set(m, []); byMat.get(m).push(g);
  }
  for (const t of bMats) t.map.wrapS = t.map.wrapT = THREE.RepeatWrapping;
  for (const [m, gs] of byMat) { const me = new THREE.Mesh(mergeGeometries(gs.map(g => g.toNonIndexed())), m); me.receiveShadow = true; station.add(me); }
}
flush();
// canopy lights (emissive strips)
const lampM = new THREE.MeshBasicMaterial({ color: 0xfff6dc });
for (let x = -45; x <= 45; x += 5) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.18), lampM); l.position.set(x + 2.5, 4.63, 0); station.add(l); }
for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xfff0d0, 0, 26, 1.3); l.position.set(-10 + i * 12, 4.2, 0); station.add(l); roofLights.push(l); }

// ---- departure board (発車標) hanging under the canopy ----
const boardCv = document.createElement('canvas'); boardCv.width = 1024; boardCv.height = 384;
const boardTex = new THREE.CanvasTexture(boardCv); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 4;
const boardFace = new THREE.MeshBasicMaterial({ map: boardTex });
const boardCase = mat('#2a2e35');
const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.35, 3.6), [boardFace, boardFace, boardCase, boardCase, boardCase, boardCase]);
const board = new THREE.Group(); board.add(boardMesh); board.position.set(6, 3.55, 0); station.add(board);
for (const s of [-1, 1]) { const h = box(0.05, 0.9, 0.05, colM); h.position.set(0, 0.95, s * 1.3); board.add(h); }
let boardKey = '';
function setBoard(rows = [], opt = {}) {
  const key = JSON.stringify([rows, opt.stop || '', Math.round((opt.blink ?? 1) * 4)]);
  if (key === boardKey) return; boardKey = key;
  const g = boardCv.getContext('2d'), w = 1024, h = 384;
  g.fillStyle = '#0b0d10'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1c2026'; g.fillRect(0, 0, w, 64);
  g.fillStyle = '#cfd6df'; g.font = '700 38px "Noto Sans CJK JP", sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('発車案内', 24, 34);
  g.textAlign = 'right'; g.fillText('もしも台駅', w - 24, 34);
  if (opt.stop) {
    const a = opt.blink ?? 1;
    g.fillStyle = `rgba(255,70,60,${0.25 + 0.75 * a})`; g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText(opt.stop, w / 2, 222);
    g.fillStyle = 'rgba(255,170,60,.9)'; g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.fillText('全線で運転を見合わせています', w / 2, 330);
  } else {
    rows.slice(0, 2).forEach((r, i) => {
      const y = 140 + i * 130;
      g.fillStyle = i ? '#7ff0a8' : '#ffb02e'; g.font = '900 80px "Noto Sans CJK JP", sans-serif';
      g.textAlign = 'left'; g.fillText(r[0], 28, y); g.fillText(r[1], 260, y);
      g.textAlign = 'right'; g.fillText(r[2], w - 28, y);
    });
  }
  boardTex.needsUpdate = true;
}
setBoard([['普通', '7:42', 'もしも台方面'], ['快速', '7:45', 'みらい港方面']]);

// ---- station name sign (駅名標) ----
const nameTex = canvasTex(1024, 320, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1fb3a1'; g.fillRect(0, 196, w, 26);
  g.fillStyle = '#1b2430'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 120px "Noto Sans CJK JP", sans-serif'; g.fillText('もしも台', w / 2, 100);
  g.font = '700 38px "Noto Sans CJK JP", sans-serif'; g.fillText('MOSHIMODAI', w / 2, 168);
  g.font = '700 40px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText('← みらい港', 30, 270); g.textAlign = 'right'; g.fillText('ひかり野 →', w - 30, 270);
});
const nameM = new THREE.MeshLambertMaterial({ map: nameTex });
const nameSign = new THREE.Group();
{ const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 3.2), [nameM, nameM, mat('#9aa3ad'), mat('#9aa3ad'), mat('#9aa3ad'), mat('#9aa3ad')]); p.position.y = PH + 2.0; nameSign.add(p);
  for (const s of [-1, 1]) { const l = box(0.1, 1.6, 0.1, colM); l.position.set(0, PH + 0.8, s * 1.4); nameSign.add(l); } }
nameSign.position.set(-18, 0, 0); station.add(nameSign);

// ---- train ----
const winTex = canvasTex(512, 64, (g, w, h) => { g.fillStyle = '#2a3646'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(160,200,230,.35)'; for (let i = 0; i < 8; i++) g.fillRect(i * 64 + 6, 6, 52, 18); });
function makeTrain({ cars = 6, side = 1, color = '#d9dde2', band = '#1fb3a1', freight = false } = {}) {
  const g = new THREE.Group(); station.add(g);
  const L = 20, Wd = 2.9, Hh = 3.4, y0 = 0.95;
  const bodyM = mat(color), bandM = mat(band), winM = new THREE.MeshLambertMaterial({ map: winTex }), doorM = mat('#b8bec6'), gapM = mat('#20252c'), bogM = mat('#2a2d33'), roofCM = mat('#a9b0b9');
  const hlM = new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), cabM = mat('#27303b');
  const doors = [];
  const CONT = ['#5d7fa6', '#a6735d', '#8a8f98', '#6e9a7a', '#9a8a5c'];
  for (let c = 0; c < cars; c++) {
    const cx = c * (L + 0.5);
    if (freight) { // 機関車（先頭）＋コンテナ車
      if (c === 0) {
        const b = box(L - 2, Hh - 0.2, Wd, bodyM); b.position.set(cx, y0 + (Hh - 0.2) / 2, 0); g.add(b);
        for (const s of [-1, 1]) { const bd = box(L - 2.2, 0.18, 0.04, bandM); bd.position.set(cx, y0 + 1.0, s * (Wd / 2 + 0.01)); g.add(bd); }
        for (const ex of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, Wd - 0.6), winM); w.position.set(cx + ex * (L / 2 - 0.98), y0 + 2.4, 0); g.add(w); }
      } else {
        const fl = box(L, 0.35, Wd - 0.3, bogM); fl.position.set(cx, y0 + 0.2, 0); g.add(fl);
        for (let k = 0; k < 3; k++) { const ct = box(6.0, 2.5, 2.45, mat(CONT[(c * 3 + k) % CONT.length])); ct.position.set(cx - 6.4 + k * 6.4, y0 + 1.65, 0); g.add(ct); }
      }
      for (const bx of [-6.5, 6.5]) { const bg = box(2.6, 0.6, 2.2, bogM); bg.position.set(cx + bx, 0.75, 0); g.add(bg); }
      continue;
    }
    const b = box(L, Hh, Wd, bodyM); b.position.set(cx, y0 + Hh / 2, 0); g.add(b);
    const rf = box(L - 0.4, 0.25, Wd - 0.5, roofCM); rf.position.set(cx, y0 + Hh + 0.12, 0); g.add(rf);
    for (const s of [-1, 1]) {
      const bd = box(L - 0.2, 0.22, 0.04, bandM); bd.position.set(cx, y0 + 1.2, s * (Wd / 2 + 0.01)); g.add(bd);
      const wn = new THREE.Mesh(new THREE.BoxGeometry(L - 1, 0.85, 0.04), winM); wn.position.set(cx, y0 + 2.2, s * (Wd / 2 + 0.015)); g.add(wn);
      for (const dx of [-7.5, -2.5, 2.5, 7.5]) {
        const gap = box(1.36, 2.0, 0.03, gapM); gap.position.set(cx + dx, y0 + 1.05, s * (Wd / 2 + 0.005)); g.add(gap);
        const pair = [];
        for (const k of [-1, 1]) { const d = box(0.66, 1.96, 0.05, doorM); d.position.set(cx + dx + k * 0.34, y0 + 1.05, s * (Wd / 2 + 0.03)); g.add(d); pair.push([d, cx + dx + k * 0.34, k]); }
        doors.push(...pair);
      }
    }
    for (const bx of [-6.5, 6.5]) { const bg = box(2.6, 0.6, 2.2, bogM); bg.position.set(cx + bx, 0.75, 0); g.add(bg); }
  }
  // cab faces at both ends
  const ends = [[-L / 2 - 0.02, -1], [(cars - 1) * (L + 0.5) + L / 2 + 0.02, 1]];
  for (const [ex, s] of (freight ? ends.slice(0, 1) : ends)) {
    const f = box(0.05, 1.2, Wd - 0.4, cabM); f.position.set(ex, y0 + 2.3, 0); g.add(f);
    for (const z of [-0.95, 0.95]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.4), hlM); l.position.set(ex + s * 0.01, y0 + 0.75, z); g.add(l); }
  }
  g.position.set(0, 0, side * TZ);
  const len = cars * (L + 0.5);
  return {
    g, len,
    setX(x) { g.position.x = x - len / 2 + L / 2; },
    setDoors(k) { for (const [d, x0, kk] of doors) d.position.x = x0 + kk * 0.62 * clamp(k); },
    setLights(on) { hlM.color.setRGB(on ? 1 : 0.25, on ? 0.96 : 0.25, on ? 0.82 : 0.25); },
  };
}

// ---- riders on the platform ----
function makeRiders(n, seed = 3, { x0 = -30, x1 = 30, z0 = -2.6, z1 = 2.6 } = {}) {
  const r = rng(seed); const g = new THREE.Group(); station.add(g);
  const people = [];
  for (let i = 0; i < n; i++) {
    const p = randPerson(r, { tie: r() < 0.3 }); const x = lerp(x0, x1, r()), z = lerp(z0, z1, r());
    p.position.set(x, PH, z); p.rotation.y = (r() - 0.5) * 1.2 + (r() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    p.userData.base = { x, z, ry: p.rotation.y, ph: r() * 6.28, sp: 0.6 + r() * 0.8 };
    g.add(p); people.push(p);
  }
  function set(k, t, opt = {}) {
    people.forEach((p, i) => {
      const b = p.userData.base; p.visible = i < k;
      if (!p.visible) return;
      p.position.set(b.x, PH, b.z); p.rotation.y = b.ry; poseWalk(p, 0, 0); p.position.y = PH;
      if (opt.look) p.userData.head.rotation.y = Math.sin(t * b.sp + b.ph) * 0.7;
      else p.userData.head.rotation.y = 0;
      if (opt.board != null) { // walk to the train side and disappear
        const u = clamp(opt.board * 1.6 - (i % 7) * 0.08);
        const tz = (opt.side || 1) * 3.9;
        p.position.z = lerp(b.z, tz, u); p.rotation.y = (opt.side || 1) > 0 ? 0 : Math.PI;
        if (u > 0 && u < 1) poseWalk(p, t * 8 + b.ph, 1); p.position.y = PH;
        p.visible = u < 0.98;
      }
    });
  }
  return { g, people, set };
}
const qTexS = canvasTex(128, 128, (g) => {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 58, 50, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(50, 100); g.lineTo(64, 124); g.lineTo(76, 100); g.fill();
  g.fillStyle = '#e04848'; g.font = '900 72px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 62);
});
function makeQs(n) {
  const qs = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: qTexS, transparent: true, depthTest: true })); s.scale.set(0.6, 0.6, 1); s.renderOrder = 10; s.visible = false; station.add(s); qs.push(s); }
  return { set(k, people, t) { qs.forEach((q, i) => { const p = people[i * 3]; q.visible = i < k && p && p.visible; if (q.visible) { q.position.set(p.position.x, p.position.y + 2.35 + Math.sin(t * 3 + i) * 0.05, p.position.z); q.material.opacity = 1; } }); } };
}

const SENV = {
  day: { top: '#5c9fe0', bot: '#dff0fb', fog: '#d6e8f4', hs: '#ffffff', hg: '#555a66', hi: 1.1, sc: '#fff4e0', si: 1.5, sp: [30, 50, 25], win: 0, lamp: 0.0 },
  dusk: { top: '#4f6fa8', bot: '#f4b98f', fog: '#d9b49c', hs: '#ffe2c8', hg: '#4a4f5c', hi: 1.05, sc: '#ffc89a', si: 1.3, sp: [60, 20, 30], win: 0.3, lamp: 6 },
  night: { top: '#06102a', bot: '#22345e', fog: '#16223e', hs: '#90a4d8', hg: '#1a1e28', hi: 0.75, sc: '#a9bcff', si: 0.45, sp: [-40, 40, 20], win: 1.0, lamp: 18 },
};
function setStationEnv(e) {
  const E = SENV[e];
  sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  station.fog.color.set(E.fog); hemi.color.set(E.hs); hemi.groundColor.set(E.hg); hemi.intensity = E.hi;
  sun.color.set(E.sc); sun.intensity = E.si; sun.position.set(E.sp[0], E.sp[1], E.sp[2]);
  for (const m of bMats) m.emissiveIntensity = E.win;
  roofLights.forEach(l => l.intensity = E.lamp);
}
setStationEnv('day');

export { station, setStationEnv, PH, TZ, makeTrain, setBoard, board, nameSign, makeRiders, makeQs };
