import * as THREE from 'three';
import { clamp, mat, box } from '../lib.js';

// =====================================================
// yokocho：夜の飲み屋横丁と、お会計の小物（0711 から）
//  makeNomiya({w, h, d, body, noren, word, lantern})：小さな店（引き戸の明かり・のれん・赤ちょうちん）。
//    userData.setNoren(k)（0 でのれんが消える）・light(k)（戸の明かりとちょうちん）・door（戸の面）
//  makeYokocho(S, {x, z, n, words, seed})：店が並ぶ夜の横丁（道・店・街灯）。userData.shops で店の一覧
//  makeRegister()：お会計の台（レジ・トレー）。userData.topY が台の上
//  makeSlip({w, h, title, rows})：伝票（白い紙に 御会計 と行）。userData.fill(文字) で金額欄
//  makeWallet(色)：二つ折りの財布。makeCard()：カード
//  makeRamen()：どんぶりのラーメン（湯気は home.js の makeSteam）
//  setYokochoEnv(hemi, 'night' | 'evening')：夜の明るさ（暗くしすぎない）
// =====================================================

function cvTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const FONT = (px, wt = 900) => `${wt} ${px}px "Noto Sans CJK JP", sans-serif`;

function makeNomiya({ w = 3.2, h = 3.0, d = 2.6, body = '#6a4a34', noren = '#24304a', word = '酒', lantern = true, nText = '#ffffff' } = {}) {
  const g = new THREE.Group();
  const b = box(w, h, d, mat(body)); b.position.y = h / 2; g.add(b);
  const roof = box(w + 0.3, 0.16, d + 0.5, mat('#2e2a2a')); roof.position.y = h + 0.08; g.add(roof);
  const eave = box(w + 0.2, 0.08, 0.7, mat('#3a3434')); eave.position.set(0, 2.35, d / 2 + 0.3); g.add(eave);
  // 引き戸（明かり）
  const doorM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0') });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.62, 1.95), doorM); door.position.set(0, 1.0, d / 2 + 0.012); g.add(door);
  for (let i = 1; i < 4; i++) { const f = box(0.04, 1.95, 0.03, mat('#3a2a1e')); f.position.set(-w * 0.31 + i * w * 0.62 / 4, 1.0, d / 2 + 0.03); g.add(f); }
  const fr = box(w * 0.66, 0.06, 0.04, mat('#3a2a1e')); fr.position.set(0, 1.98, d / 2 + 0.03); g.add(fr);
  // のれん（4枚の布と文字）
  const NG = new THREE.Group(); NG.position.set(0, 2.3, d / 2 + 0.2); g.add(NG);
  const nw = w * 0.66, nh = 0.72;
  const tex = cvTex(512, 256, (x, W, H) => { x.fillStyle = noren; x.fillRect(0, 0, W, H); x.fillStyle = nText; x.font = FONT(150); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(word, W / 2, H / 2 + 8); });
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.PlaneGeometry(nw / 4 - 0.03, nh); const uv = geo.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / 4);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })); m.position.set(-nw / 2 + (i + 0.5) * nw / 4, -nh / 2, 0); NG.add(m);
  }
  const bar = box(nw + 0.1, 0.05, 0.05, mat('#8a6a4a')); NG.add(bar);
  // 赤ちょうちん
  const LM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff5a3a') });
  const lan = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), LM); lan.scale.y = 1.35; lan.position.set(w / 2 - 0.25, 2.05, d / 2 + 0.35); lan.visible = lantern; g.add(lan);
  const PL = new THREE.PointLight(0xffb070, 6, 7, 1.4); PL.position.set(0, 1.6, d / 2 + 1.4); g.add(PL);
  g.userData = {
    door, noren: NG, lantern: lan, w, d, h,
    setNoren(k) { const kk = clamp(k); NG.visible = kk > 0.01; NG.scale.set(1, Math.max(0.01, kk), 1); },
    light(k) { const kk = clamp(k); doorM.color.set('#3a3430').lerp(new THREE.Color('#ffd9a0'), kk); LM.color.set('#4a2a26').lerp(new THREE.Color('#ff5a3a'), kk); PL.intensity = 6 * kk; },
  };
  return g;
}

function makeYokocho(S, { x = 0, z = 0, n = 5, words = ['酒', 'やきとり', 'おでん', '酒場', 'らーめん'], seed = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(n * 3.6 + 10, 9), mat('#4a4846', { depthWrite: false })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.012, 1.5); road.renderOrder = -0.8; g.add(road);
  const bodies = ['#6a4a34', '#5a4a40', '#7a5a3a', '#4e4440', '#6a5444'], norens = ['#24304a', '#7a2a2a', '#2a4a3a', '#3a2a4a', '#8a6a2a'];
  const shops = [];
  for (let i = 0; i < n; i++) { const s = makeNomiya({ w: 3.3, body: bodies[(i + seed) % 5], noren: norens[(i + seed * 2) % 5], word: words[i % words.length] }); s.position.set((i - (n - 1) / 2) * 3.6, 0, -2.4); g.add(s); shops.push(s); }
  for (const sx of [-1, 1]) { const px = sx * (n * 1.8 + 1.2); const p = box(0.1, 3.6, 0.1, mat('#3a3a40')); p.position.set(px, 1.8, -0.6); g.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff2d0' })); l.position.set(px, 3.6, -0.6); g.add(l); }
  const PL = new THREE.PointLight(0xfff0d0, 10, 16, 1.2); PL.position.set(0, 4, 4); g.add(PL);
  g.userData = { shops };
  return g;
}

function makeRegister() {
  const g = new THREE.Group();
  const c = box(1.5, 1.0, 0.7, mat('#8a6a4c')); c.position.y = 0.5; g.add(c);
  const top = box(1.6, 0.05, 0.8, mat('#b08a63')); top.position.y = 1.02; g.add(top);
  const r = box(0.42, 0.22, 0.36, mat('#30343e')); r.position.set(-0.4, 1.16, -0.1); g.add(r);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.14), new THREE.MeshBasicMaterial({ color: '#7fe0a0' })); sc.position.set(-0.4, 1.36, 0.02); sc.rotation.x = -0.3; g.add(sc);
  const scb = box(0.34, 0.18, 0.04, mat('#30343e')); scb.position.set(-0.4, 1.36, 0.0); scb.rotation.x = -0.3; g.add(scb);
  const tray = box(0.4, 0.03, 0.3, mat('#2a2a2e')); tray.position.set(0.3, 1.06, 0.1); g.add(tray);
  g.userData = { topY: 1.05 };
  return g;
}

function makeSlip({ w = 0.3, h = 0.5, title = '御会計', rows = 5 } = {}) {
  const c = document.createElement('canvas'); c.width = 240; c.height = 400;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  let cur = null;
  function fill(s = '') {
    if (s === cur) return; cur = s; const x = c.getContext('2d');
    x.fillStyle = '#fbfaf4'; x.fillRect(0, 0, 240, 400); x.fillStyle = '#c8242c'; x.fillRect(0, 0, 240, 64);
    x.fillStyle = '#fff'; x.font = FONT(40); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 120, 34);
    x.strokeStyle = '#b8b2a4'; x.lineWidth = 3; for (let i = 0; i < rows; i++) { const y = 110 + i * 46; x.beginPath(); x.moveTo(20, y); x.lineTo(220, y); x.stroke(); }
    x.fillStyle = '#9a948a'; for (let i = 0; i < rows - 1; i++) x.fillRect(26, 90 + i * 46, 90 + (i * 37) % 60, 10);
    if (s) { x.fillStyle = '#2a2220'; x.font = FONT(s.length > 4 ? 44 : 60); x.fillText(s, 120, 352); }
    tex.needsUpdate = true;
  }
  fill('');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  m.userData.fill = fill;
  return m;
}

function makeWallet(color = '#5a3a22') {
  const g = new THREE.Group();
  const a = box(0.22, 0.12, 0.035, mat(color)); g.add(a);
  const s = box(0.22, 0.012, 0.037, mat('#3a2414')); s.position.y = 0.02; g.add(s);
  return g;
}
function makeCard(color = '#d8b04a') { const g = box(0.17, 0.11, 0.008, mat(color)); return g; }

function makeRamen() {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.16, 20), mat('#e8e2d6')); bowl.position.y = 0.08; g.add(bowl);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.025, 20), mat('#c8242c')); rim.position.y = 0.155; g.add(rim);
  const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 20), mat('#d8a060')); soup.position.y = 0.15; g.add(soup);
  const nori = box(0.08, 0.1, 0.01, mat('#1f2a1e')); nori.position.set(-0.1, 0.19, -0.1); nori.rotation.x = -0.3; g.add(nori);
  const cha = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 14), mat('#c88a6a')); cha.position.set(0.06, 0.162, 0.03); g.add(cha);
  const egg = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat('#f4ead8')); egg.scale.y = 0.6; egg.position.set(-0.04, 0.165, 0.09); g.add(egg);
  const ne = box(0.05, 0.012, 0.05, mat('#6ab04a')); ne.position.set(0.08, 0.162, -0.08); g.add(ne);
  return g;
}

function setYokochoEnv(S, hemi, mode = 'night') {
  if (mode === 'night') { S.background.set('#1c2338'); S.fog.color.set('#1c2338'); hemi.intensity = 0.95; }
  else { S.background.set('#c88a6a'); S.fog.color.set('#c88a6a'); hemi.intensity = 1.2; }
}

export { makeNomiya, makeYokocho, makeRegister, makeSlip, makeWallet, makeCard, makeRamen, setYokochoEnv };
