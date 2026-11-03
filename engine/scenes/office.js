import * as THREE from 'three';
import { clamp, mat, box, makePerson } from '../lib.js';

// =====================================================
// OFFICE：会社のオフィスの部品（皮肉回 0635・0637 から。どのシーンにも置ける Group を返す）
//   makeMeetingRoom()  会議室（床・奥の壁・左の窓・長机・椅子6脚・ホワイトボード）。原点が部屋の中央の床。
//                      userData：table（天板の高さ TABLE_Y）、seats[i]（椅子の位置 {x,z,ry}）、board.set(行の配列, {color, bg})
//   makeDeskIsland(n)  向かい合わせの事務机 n×2（モニター・椅子つき）。userData.seats[i] = {x,z,ry}、monitors[i]
//   makeSuit(opt)      スーツの会社員（上着・ネクタイ。opt.old で白髪まじり・はげ、opt.woman で女性）
//   ポーズ（毎コマ呼ぶ。最初に poseClear）：poseClear(p)、poseSit(p)、poseBelly(p, k, t, {stand})（お腹を押さえてうずくまる 0..1。stand で立ったまま前かがみ）、
//            poseSlump(p, k)（座ったまま机に突っ伏す）、poseCheer(p, t)（両手を上げて喜ぶ）、posePoint(p, k)（右手で指さす）
//   makeSweat()        冷や汗の粒（頭の横に付ける。userData.set(k, t)）
// =====================================================
const TABLE_Y = 0.74;
function boardCanvas(w = 1024, h = 512) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, t }; }

function makeChair(color = '#30343e') {
  const g = new THREE.Group();
  const seat = box(0.5, 0.08, 0.5, mat(color)); seat.position.y = 0.47; g.add(seat);
  const back = box(0.5, 0.6, 0.07, mat(color)); back.position.set(0, 0.8, -0.24); g.add(back);
  const post = box(0.06, 0.42, 0.06, mat('#8a8f99')); post.position.y = 0.22; g.add(post);
  const foot = box(0.5, 0.04, 0.5, mat('#8a8f99')); foot.position.y = 0.02; g.add(foot);
  return g;
}

function makeMeetingRoom({ wall = '#e6e9ee', floor = '#7d8798', w = 9, d = 7 } = {}) {
  const g = new THREE.Group();
  const fl = box(w + 6, 0.1, d + 10, mat(floor)); fl.position.set(0, -0.05, 5); g.add(fl); // 手前に長く（引きの画で床の端が見えないように）
  const bw = box(w, 3.2, 0.12, mat(wall)); bw.position.set(0, 1.6, -d / 2); g.add(bw);
  const lw = box(0.12, 3.2, d, mat(wall)); lw.position.set(-w / 2, 1.6, 0); g.add(lw);
  // 左の窓（外はビルの夕方の色）
  const win = box(0.04, 1.6, 3.6, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); win.position.set(-w / 2 + 0.08, 1.75, -0.6); g.add(win);
  for (let i = 0; i < 4; i++) { const b = box(0.05, 0.6 + (i % 2) * 0.5, 0.6, new THREE.MeshBasicMaterial({ color: '#6f8aa8' })); b.position.set(-w / 2 + 0.1, 0.95 + (0.3 + (i % 2) * 0.25), -2.0 + i * 0.95); g.add(b); }
  for (const z of [-2.4, -0.6, 1.2]) { const f = box(0.08, 1.7, 0.08, mat('#d8dce2')); f.position.set(-w / 2 + 0.1, 1.75, z); g.add(f); }
  // 長机と椅子
  const top = box(4.2, 0.08, 1.5, mat('#c9a77a')); top.position.set(0, TABLE_Y, -0.6); g.add(top);
  for (const [x, z] of [[-1.8, -1.1], [1.8, -1.1], [-1.8, -0.1], [1.8, -0.1]]) { const l = box(0.08, TABLE_Y, 0.08, mat('#6a5a48')); l.position.set(x, TABLE_Y / 2, z - 0.0); g.add(l); }
  const seats = [];
  [-1.3, 0, 1.3].forEach(x => { seats.push({ x, z: -1.75, ry: 0 }); seats.push({ x, z: 0.55, ry: Math.PI }); });
  const chairs = seats.map(s => { const c = makeChair(); c.position.set(s.x, 0, s.z); c.rotation.y = s.ry + Math.PI; g.add(c); return c; });
  // ホワイトボード
  const frame = box(3.4, 1.4, 0.06, mat('#b8bec8')); frame.position.set(0.6, 2.2, -d / 2 + 0.1); g.add(frame);
  const { c, t } = boardCanvas(1024, 400);
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.25), new THREE.MeshBasicMaterial({ map: t })); bd.position.set(0.6, 2.2, -d / 2 + 0.14); g.add(bd);
  let key = null;
  const board = {
    mesh: bd,
    set(lines = [], { color = '#1a2a6a', bg = '#fbfcfd', size = 120 } = {}) {
      const k = lines.join('|') + color + bg; if (k === key) return; key = k;
      const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
      const n = lines.length || 1; let px = Math.min(size, Math.floor(340 / n));
      lines.forEach((s, i) => { let p = px; x.font = `900 ${p}px "Noto Sans CJK JP", sans-serif`; while (x.measureText(s).width > 940 && p > 30) { p -= 6; x.font = `900 ${p}px "Noto Sans CJK JP", sans-serif`; } x.fillText(s, 512, 200 + (i - (n - 1) / 2) * px * 1.2); });
      t.needsUpdate = true;
    },
  };
  board.set([]);
  g.userData = { table: top, seats, chairs, board, w, d };
  return g;
}

function makeDeskIsland(n = 3, { color = '#e8e4dc' } = {}) {
  const g = new THREE.Group(); const seats = [], monitors = [];
  for (let i = 0; i < n; i++) for (const side of [-1, 1]) {
    const x = (i - (n - 1) / 2) * 1.5, z = side * 0.45;
    const d = box(1.4, 0.06, 0.85, mat(color)); d.position.set(x, TABLE_Y, z); g.add(d);
    const leg = box(1.3, TABLE_Y, 0.05, mat('#9aa0aa')); leg.position.set(x, TABLE_Y / 2, z + side * 0.38); g.add(leg);
    const mon = new THREE.Group(); const sc = box(0.62, 0.4, 0.04, mat('#22252c')); sc.position.y = 0.26; mon.add(sc);
    const gl = box(0.56, 0.34, 0.01, new THREE.MeshBasicMaterial({ color: '#6aa8e8' })); gl.position.set(0, 0.26, -0.025); mon.add(gl);
    const st = box(0.06, 0.08, 0.06, mat('#22252c')); st.position.y = 0.04; mon.add(st);
    mon.position.set(x, TABLE_Y + 0.03, z - side * 0.25); mon.rotation.y = side > 0 ? 0 : Math.PI; mon.userData.glass = gl; g.add(mon); monitors.push(mon);
    const ch = makeChair(); ch.position.set(x, 0, z + side * 0.85); ch.rotation.y = side > 0 ? 0 : Math.PI; g.add(ch);
    seats.push({ x, z: z + side * 0.7, ry: side > 0 ? Math.PI : 0 });
  }
  g.userData = { seats, monitors };
  return g;
}

function makeSuit(opt = {}) {
  const jacket = opt.jacket || (opt.woman ? '#3a3f4e' : '#2e3442');
  const p = makePerson({ skin: opt.skin || '#f1c9a5', hair: opt.hair || (opt.old ? '#8a8a8a' : '#1d1a19'), shirt: jacket, pants: opt.pants || '#252a36', long: !!opt.woman, skirt: !!opt.skirt, bald: !!opt.bald, scale: opt.scale || (opt.woman ? 0.95 : 1) });
  if (!opt.woman) {
    const shirt = box(0.2, 0.5, 0.02, mat('#f4f4f2')); shirt.position.set(0, 1.22, 0.142); p.add(shirt);
    const tie = box(0.07, 0.42, 0.02, mat(opt.tie || '#b23a3a')); tie.position.set(0, 1.22, 0.152); p.add(tie);
  } else { const bl = box(0.18, 0.3, 0.02, mat('#f4f4f2')); bl.position.set(0, 1.32, 0.142); p.add(bl); }
  if (opt.old) { const belly = box(0.46, 0.3, 0.14, mat(jacket)); belly.position.set(0, 1.02, 0.16); p.add(belly); }
  if (opt.glasses) { const gm = mat('#222'); for (const s of [-1, 1]) { const l = box(0.12, 0.08, 0.02, gm); l.position.set(s * 0.085, 0.27, 0.205); p.userData.head.add(l); } }
  return p;
}

function poseClear(p) { const u = p.userData; u.arms.forEach(a => a.rotation.set(0, 0, 0)); u.legs.forEach(l => l.rotation.set(0, 0, 0)); u.head.rotation.set(0, 0, 0); p.rotation.x = 0; p.rotation.z = 0; p.position.y = 0; }
function poseSit(p) { p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.position.y = -0.39 * p.scale.y; }
// お腹を押さえてうずくまる（k 0..1。t を渡すと小さく震える）
function poseBelly(p, k, t = 0, { stand = false } = {}) {
  const u = p.userData, s = p.scale.y;
  if (stand) { // 立ったまま、ひざを寄せて前かがみ（行列・売り場用）
    u.arms[0].rotation.set(-0.75 * k, 0, 0.55 * k); u.arms[1].rotation.set(-0.75 * k, 0, -0.55 * k);
    u.legs[0].rotation.set(0, 0, -0.08 * k); u.legs[1].rotation.set(0, 0, 0.08 * k);
    p.rotation.x = 0.22 * k + Math.sin(t * 40) * 0.01 * k; u.head.rotation.x = 0.3 * k; return;
  }
  u.arms[0].rotation.set(-0.75 * k, 0, 0.55 * k); u.arms[1].rotation.set(-0.75 * k, 0, -0.55 * k);
  u.legs.forEach(l => l.rotation.x = -1.25 * k);
  p.position.y = -0.5 * k * s; p.rotation.x = 0.42 * k + Math.sin(t * 40) * 0.015 * k;
  u.head.rotation.x = 0.35 * k;
}
function poseSlump(p, k) { const u = p.userData; poseSit(p); p.rotation.x = 0.55 * k; u.head.rotation.x = 0.35 * k; u.arms.forEach(a => a.rotation.x = -1.2 * k); }
function poseCheer(p, t) { const u = p.userData; u.arms[0].rotation.set(0, 0, -2.6 + Math.sin(t * 9) * 0.25); u.arms[1].rotation.set(0, 0, 2.6 - Math.sin(t * 9) * 0.25); p.position.y = Math.abs(Math.sin(t * 6)) * 0.14 * p.scale.y; }
function posePoint(p, k) { p.userData.arms[1].rotation.set(-1.5 * k, 0, 0); }

function makeSweat() {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#7fd0ff', transparent: true });
  const drops = [[0.24, 0.32, 0.12], [-0.24, 0.26, 0.1], [0.27, 0.12, 0.05]].map(([x, y, z]) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), m); d.scale.y = 1.5; d.position.set(x, y, z); d.userData.y0 = y; g.add(d); return d; });
  g.userData.set = (k, t = 0) => { g.visible = k > 0.01; m.opacity = clamp(k); drops.forEach((d, i) => { d.position.y = d.userData.y0 - ((t * 0.5 + i * 0.33) % 1) * 0.18; }); };
  return g;
}

export { TABLE_Y, makeChair, makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, poseBelly, poseSlump, poseCheer, posePoint, makeSweat };
