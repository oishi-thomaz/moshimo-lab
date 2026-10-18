import * as THREE from 'three';
import { rng, mat, box, canvasTex, makePerson, SKIN, HAIR } from '../lib.js';

// =====================================================
// ROOM: one indoor set that can be dressed as
//   bedroom / living / kitchen / office / ward (hospital) / toilet / showa (tatami room)
// Room interior: x -4..4, z -3.5..3.5 (back wall at z=-3.5), height 3.2. Camera usually at z 5..8.
// API
//   setRoom({ floor:'wood'|'tatami'|'tile'|'carpet', wall:'#hex', sets:['bed','desk',...] })
//   setLight('day'|'evening'|'night'|'dark')
//   setClock('3:00') / setClockColor('#f55')    — digital clock on the nightstand + wall clock text
//   setScreen(fn(g,w,h))                        — draw on TV/monitor/phone screen texture
//   props: { bed, sleeper, phone, monitor, tv, fridge, toiletLever, ... }
// =====================================================
const room = new THREE.Scene();
room.background = new THREE.Color('#1a1d24');
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7c6a, 1.1); room.add(hemi);
const winLight = new THREE.DirectionalLight(0xfff1dc, 1.2); winLight.position.set(-2, 5, -8); winLight.castShadow = true;
winLight.shadow.mapSize.set(1024, 1024); Object.assign(winLight.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 });
room.add(winLight); room.add(winLight.target);
const ceil = new THREE.PointLight(0xfff3dd, 12, 14, 1.3); ceil.position.set(0, 3.0, 0.5); room.add(ceil);
const lamp = new THREE.PointLight(0xffc98a, 0, 6, 1.5); lamp.position.set(2.6, 1.4, -2.4); room.add(lamp);
const glow = new THREE.PointLight(0x9fd0ff, 0, 4, 1.6); room.add(glow); // phone / screen glow

// ---- textures
const floorTex = {
  wood: canvasTex(512, 512, (g, w, h) => { const r = rng(4); for (let i = 0; i < 8; i++) { const c = 150 + r() * 25; g.fillStyle = `rgb(${c + 30},${c},${c - 40})`; g.fillRect(0, i * 64, w, 62); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, i * 64 + 62, w, 2); g.fillRect(Math.floor(r() * w), i * 64, 2, 62); } }),
  tatami: canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#c9c48a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,80,40,.25)'; for (let y = 0; y < h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#3d4a3a'; g.fillRect(0, 0, 14, h); g.fillRect(w / 2 - 7, 0, 14, h); g.fillRect(0, h / 2 - 7, w / 2, 14); }),
  tile: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#cdd2d8'; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }),
  carpet: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#7d8798'; g.fillRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * .06})`; g.fillRect(r() * w, r() * h, 2, 2); } }),
};
for (const k in floorTex) { floorTex[k].wrapS = floorTex[k].wrapT = THREE.RepeatWrapping; floorTex[k].repeat.set(4, 4); }
floorTex.tatami.repeat.set(3, 3);
const floorM = new THREE.MeshLambertMaterial({ map: floorTex.wood });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 15), floorM); floor.rotation.x = -Math.PI / 2; floor.position.z = 3.8; floor.receiveShadow = true; room.add(floor);
const wallM = mat('#e9e3d8');
const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.4, 3.4, 0.2), wallM); backWall.position.set(0, 1.7, -3.6); backWall.receiveShadow = true; room.add(backWall);
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 15), wallM); leftWall.position.set(-4.1, 1.7, 3.8); leftWall.receiveShadow = true; room.add(leftWall);
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 15), wallM); rightWall.position.set(4.1, 1.7, 3.8); rightWall.receiveShadow = true; room.add(rightWall);
const ceiling = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.2, 15), mat('#f4f1ea')); ceiling.position.set(0, 3.45, 3.8); room.add(ceiling);
const skirting = box(8, 0.1, 0.04, mat('#b8ab98')); skirting.position.set(0, 0.05, -3.48); room.add(skirting);

// ---- window (back wall, left of center)
const winSky = { day: null, evening: null, night: null, dark: null };
function skyTex(top, bot, night) {
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(12);
    if (night) { for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; g.fillRect(r() * w, r() * h * 0.6, 2, 2); } g.fillStyle = '#f4f1d8'; g.beginPath(); g.arc(190, 60, 18, 0, 7); g.fill(); }
    // skyline silhouette
    g.fillStyle = night ? '#0b1020' : 'rgba(90,110,140,.55)';
    let x = 0; while (x < w) { const bw = 18 + r() * 30, bh = 30 + r() * 70; g.fillRect(x, h - bh, bw, bh); if (night) { g.fillStyle = '#ffd98a'; for (let k = 0; k < 6; k++) if (r() < .5) g.fillRect(x + 3 + r() * (bw - 8), h - bh + 6 + r() * (bh - 10), 3, 3); g.fillStyle = '#0b1020'; } x += bw + 2; }
  });
}
winSky.day = skyTex('#7fb6ea', '#d8ecfb', false);
winSky.evening = skyTex('#4f6fa8', '#f4b98f', false);
winSky.night = skyTex('#040a1a', '#1a2850', true);
winSky.dark = winSky.night;
const winM = new THREE.MeshBasicMaterial({ map: winSky.day });
const winGroup = new THREE.Group(); room.add(winGroup);
{
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), winM); pane.position.set(0, 0, 0); winGroup.add(pane);
  const fm = mat('#f7f5f0');
  for (const [w, h, x, y] of [[2.4, 0.1, 0, 0.8], [2.4, 0.1, 0, -0.8], [0.1, 1.7, -1.15, 0], [0.1, 1.7, 1.15, 0], [0.06, 1.5, 0, 0]]) { const b = box(w, h, 0.12, fm); b.position.set(x, y, 0.04); winGroup.add(b); }
  const sill = box(2.6, 0.08, 0.3, fm); sill.position.set(0, -0.86, 0.12); winGroup.add(sill);
  const curtM = mat('#9ab0c8');
  for (const s of [-1, 1]) { const c = box(0.5, 2.0, 0.08, curtM); c.position.set(s * 1.45, 0.05, 0.16); winGroup.add(c); }
}
winGroup.position.set(-1.6, 1.85, -3.48);

// ---- sets
const sets = {};
const props = {};
function set(name) { const g = new THREE.Group(); room.add(g); sets[name] = g; g.visible = false; return g; }
// screens (shared texture, redrawable)
const screenCanvas = document.createElement('canvas'); screenCanvas.width = 256; screenCanvas.height = 160;
const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace;
const screenM = new THREE.MeshBasicMaterial({ map: screenTex });
function setScreen(fn) { const g = screenCanvas.getContext('2d'); fn(g, 256, 160); screenTex.needsUpdate = true; }
setScreen((g, w, h) => { g.fillStyle = '#2b4f7a'; g.fillRect(0, 0, w, h); });
// clock
const clockCanvas = document.createElement('canvas'); clockCanvas.width = 256; clockCanvas.height = 96;
const clockTex = new THREE.CanvasTexture(clockCanvas); clockTex.colorSpace = THREE.SRGBColorSpace;
let clockText = '', clockColor = '#ff5b4f';
function drawClock() { const g = clockCanvas.getContext('2d'); g.fillStyle = '#111317'; g.fillRect(0, 0, 256, 96); g.fillStyle = clockColor; g.font = '700 74px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(clockText, 128, 52); clockTex.needsUpdate = true; }
function setClock(s, color) { if (s === clockText && (!color || color === clockColor)) return; clockText = s; if (color) clockColor = color; drawClock(); }
setClock('7:00');

// BEDROOM: bed against back-right, nightstand with clock and phone
{
  const g = set('bed');
  const frame = box(2.2, 0.4, 3.0, mat('#8a6a4c')); frame.position.set(1.6, 0.2, -1.9); g.add(frame);
  const head = box(2.2, 1.1, 0.12, mat('#7a5c40')); head.position.set(1.6, 0.6, -3.4); g.add(head);
  const matt = box(2.05, 0.26, 2.85, mat('#f3f1ec')); matt.position.set(1.6, 0.53, -1.9); g.add(matt);
  const pillow = box(1.2, 0.18, 0.5, mat('#ffffff')); pillow.position.set(1.6, 0.74, -3.0); g.add(pillow);
  const blanket = box(2.1, 0.14, 1.9, mat('#5d7fb3')); blanket.position.set(1.6, 0.86, -1.3); g.add(blanket); props.blanket = blanket;
  const ns = box(0.7, 0.6, 0.6, mat('#a07e5c')); ns.position.set(0.05, 0.3, -3.05); g.add(ns);
  const clock = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.14), [mat('#222'), mat('#222'), mat('#222'), mat('#222'), new THREE.MeshBasicMaterial({ map: clockTex }), mat('#222')]);
  clock.position.set(-0.05, 0.69, -2.95); clock.rotation.y = 0.35; g.add(clock); props.clock = clock;
  const phone = new THREE.Group();
  const pb = box(0.16, 0.02, 0.3, mat('#1b1d22')); phone.add(pb);
  const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.27), screenM); ps.rotation.x = -Math.PI / 2; ps.position.y = 0.012; phone.add(ps);
  phone.position.set(0.18, 0.61, -3.0); g.add(phone); props.phone = phone;
  const sleeper = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#8fa3b8', pants: '#5d6b80', scale: 1 });
  sleeper.rotation.x = -Math.PI / 2; sleeper.position.set(1.6, 0.74, -1.0); g.add(sleeper); props.sleeper = sleeper;
  // rug
  const rug = box(2.4, 0.02, 1.6, mat('#c9b79c')); rug.position.set(-1.2, 0.01, 0.6); g.add(rug);
}
// DESK (home): desk by left wall with monitor + chair
{
  const g = set('desk');
  const top = box(1.8, 0.06, 0.8, mat('#d9c7a8')); top.position.set(-2.6, 0.75, -2.9); g.add(top);
  for (const [x, z] of [[-3.4, -3.2], [-1.8, -3.2], [-3.4, -2.6], [-1.8, -2.6]]) { const l = box(0.06, 0.75, 0.06, mat('#555')); l.position.set(x, 0.375, z); g.add(l); }
  const mon = box(0.9, 0.55, 0.05, mat('#1c1e24')); mon.position.set(-2.6, 1.15, -3.15); g.add(mon);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.48), screenM); scr.position.set(-2.6, 1.15, -3.12); g.add(scr); props.monitor = scr;
  const st = box(0.08, 0.25, 0.08, mat('#333')); st.position.set(-2.6, 0.88, -3.15); g.add(st);
  const ch = box(0.6, 0.08, 0.6, mat('#3c4a5e')); ch.position.set(-2.6, 0.5, -2.1); g.add(ch);
  const cb = box(0.6, 0.7, 0.08, mat('#3c4a5e')); cb.position.set(-2.6, 0.9, -1.8); g.add(cb);
  const cl = box(0.08, 0.45, 0.08, mat('#333')); cl.position.set(-2.6, 0.25, -2.1); g.add(cl);
  const lampBody = box(0.12, 0.5, 0.12, mat('#e0b347')); lampBody.position.set(-1.9, 1.03, -3.1); g.add(lampBody);
}
// LIVING: sofa facing TV on the right wall... sofa center front, TV on back wall right
{
  const g = set('living');
  const sm = mat('#6f8f7a');
  const seat = box(2.6, 0.45, 0.95, sm); seat.position.set(0.6, 0.23, 0.6); g.add(seat);
  const back = box(2.6, 0.6, 0.25, sm); back.position.set(0.6, 0.75, 1.0); g.add(back);
  for (const s of [-1, 1]) { const a = box(0.25, 0.55, 0.95, sm); a.position.set(0.6 + s * 1.3, 0.5, 0.6); g.add(a); }
  const tvStand = box(2.0, 0.45, 0.45, mat('#5a4636')); tvStand.position.set(1.4, 0.23, -3.2); g.add(tvStand);
  const tv = box(1.7, 1.0, 0.07, mat('#16181d')); tv.position.set(1.4, 1.05, -3.25); g.add(tv);
  const tvs = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), screenM); tvs.position.set(1.4, 1.05, -3.21); g.add(tvs); props.tv = tvs;
  const table = box(1.3, 0.35, 0.7, mat('#b08a63')); table.position.set(0.6, 0.18, -0.9); g.add(table);
  const mug = box(0.12, 0.14, 0.12, mat('#e46a5b')); mug.position.set(0.3, 0.42, -0.9); g.add(mug);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), mat('#5f9a58', { flatShading: true })); plant.position.set(-3.4, 1.0, -3.0); g.add(plant);
  const pot = box(0.4, 0.5, 0.4, mat('#c8b49a')); pot.position.set(-3.4, 0.25, -3.0); g.add(pot);
}
// KITCHEN: counter along back wall, fridge right
{
  const g = set('kitchen');
  const cnt = box(4.4, 0.9, 0.7, mat('#e9e6e0')); cnt.position.set(-0.6, 0.45, -3.1); g.add(cnt);
  const topk = box(4.4, 0.05, 0.72, mat('#9aa0a8')); topk.position.set(-0.6, 0.92, -3.1); g.add(topk);
  const sink = box(0.8, 0.04, 0.45, mat('#c0c6cc')); sink.position.set(-1.2, 0.95, -3.1); g.add(sink);
  const tap = box(0.05, 0.35, 0.05, mat('#b8bec6')); tap.position.set(-1.2, 1.12, -3.35); g.add(tap);
  const stove = box(0.8, 0.03, 0.5, mat('#22252b')); stove.position.set(0.6, 0.95, -3.1); g.add(stove);
  const pan = box(0.4, 0.1, 0.4, mat('#3b3f47')); pan.position.set(0.5, 1.02, -3.05); g.add(pan);
  for (let i = 0; i < 3; i++) { const d = box(1.4, 0.04, 0.05, mat('#b8ab98')); d.position.set(-2.0 + i * 1.45, 0.6, -2.74); g.add(d); }
  const fr = box(1.0, 2.1, 0.8, mat('#f3f4f6')); fr.position.set(2.6, 1.05, -3.0); g.add(fr); props.fridge = fr;
  const frLine = box(1.0, 0.03, 0.02, mat('#c9cdd3')); frLine.position.set(2.6, 1.35, -2.59); g.add(frLine);
  const frH = box(0.05, 0.4, 0.05, mat('#b8bec6')); frH.position.set(2.2, 1.65, -2.57); g.add(frH);
  const upper = box(3.4, 0.7, 0.4, mat('#e9e6e0')); upper.position.set(-1.1, 2.4, -3.3); g.add(upper);
}
// OFFICE: rows of desks with monitors
{
  const g = set('office');
  for (let row = 0; row < 3; row++) for (let c = 0; c < 3; c++) {
    const x = -2.6 + c * 2.6, z = -2.8 + row * 1.9;
    const top = box(1.8, 0.05, 0.8, mat('#e8e6e1')); top.position.set(x, 0.74, z); g.add(top);
    const leg = box(1.7, 0.7, 0.05, mat('#a9adb3')); leg.position.set(x, 0.36, z - 0.35); g.add(leg);
    const mon = box(0.8, 0.5, 0.04, mat('#1c1e24')); mon.position.set(x, 1.08, z - 0.25); g.add(mon);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.44), mat('#5d8fc2', { emissive: 0x2b4f7a, emissiveIntensity: 0.6 })); scr.position.set(x, 1.08, z - 0.225); g.add(scr);
    const ch = box(0.5, 0.08, 0.5, mat('#2f3846')); ch.position.set(x, 0.48, z + 0.55); g.add(ch);
  }
}
// WARD: hospital, 3 beds with curtains and monitors
{
  const g = set('ward');
  for (let i = 0; i < 3; i++) {
    const x = -2.6 + i * 2.6;
    const fr = box(1.1, 0.55, 2.1, mat('#d7dde3')); fr.position.set(x, 0.3, -2.3); g.add(fr);
    const mt = box(1.0, 0.16, 2.0, mat('#ffffff')); mt.position.set(x, 0.65, -2.3); g.add(mt);
    const bl = box(1.04, 0.1, 1.2, mat('#a9cbe0')); bl.position.set(x, 0.76, -1.9); g.add(bl);
    const hb = box(1.1, 0.9, 0.08, mat('#bcc6cf')); hb.position.set(x, 0.75, -3.35); g.add(hb);
    const pole = box(0.04, 1.9, 0.04, mat('#aab2ba')); pole.position.set(x + 0.75, 0.95, -3.0); g.add(pole);
    const bag = box(0.18, 0.28, 0.06, mat('#dff1ff', { transparent: true, opacity: 0.85 })); bag.position.set(x + 0.75, 1.75, -3.0); g.add(bag);
    const mon = box(0.4, 0.3, 0.1, mat('#2b2f36')); mon.position.set(x - 0.75, 1.5, -3.3); g.add(mon);
    const ms = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.25), new THREE.MeshBasicMaterial({ color: 0x46d39a })); ms.position.set(x - 0.75, 1.5, -3.24); g.add(ms);
    if (i < 2) { const cu = box(0.05, 2.2, 2.0, mat('#cfe3dc')); cu.position.set(x + 1.3, 1.35, -2.4); g.add(cu); }
  }
}
// TOILET: a small toilet room look (bowl + tank + lever). Uses narrow framing.
{
  const g = set('toilet');
  const wm = mat('#dfe7ea');
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.42, 20), mat('#ffffff')); pan.position.set(0, 0.21, -3.0); pan.scale.z = 1.35; g.add(pan);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 24), mat('#f4f4f4')); seat.rotation.x = Math.PI / 2; seat.scale.y = 1.35; seat.position.set(0, 0.45, -2.95); g.add(seat);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), mat('#8fd0ee', { emissive: 0x2a6f8f, emissiveIntensity: 0.3 })); water.rotation.x = -Math.PI / 2; water.scale.y = 1.35; water.position.set(0, 0.38, -2.95); g.add(water); props.toiletWater = water;
  const lid = box(0.5, 0.04, 0.12, mat('#f4f4f4')); lid.position.set(0, 0.75, -3.3); g.add(lid);
  const tank = box(0.6, 0.55, 0.22, mat('#ffffff')); tank.position.set(0, 0.75, -3.4); g.add(tank);
  const lever = new THREE.Group(); const lb = box(0.16, 0.035, 0.035, mat('#c0c6cc')); lb.position.x = 0.08; lever.add(lb); lever.position.set(0.22, 0.95, -3.28); g.add(lever); props.toiletLever = lever;
  const holder = box(0.18, 0.12, 0.12, mat('#c0c6cc')); holder.position.set(-0.75, 0.75, -2.7); g.add(holder);
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), mat('#ffffff')); paper.rotation.z = Math.PI / 2; paper.position.set(-0.75, 0.68, -2.62); g.add(paper);
  const mat2 = box(1.2, 0.02, 0.9, mat('#9fc2b6')); mat2.position.set(0, 0.01, -2.2); g.add(mat2);
  const tl = box(0.04, 3.4, 4, wm); tl.position.set(-0.95, 1.7, -1.5); g.add(tl);
  const tr = box(0.04, 3.4, 4, wm); tr.position.set(0.95, 1.7, -1.5); g.add(tr);
}
// SHOWA: tatami room, chabudai, CRT TV, black dial phone, fusuma
{
  const g = set('showa');
  const fus = canvasTex(256, 256, (gg, w, h) => { gg.fillStyle = '#efe6cf'; gg.fillRect(0, 0, w, h); gg.strokeStyle = '#6b4a2f'; gg.lineWidth = 10; gg.strokeRect(0, 0, w, h); gg.fillStyle = 'rgba(120,150,120,.35)'; for (let i = 0; i < 5; i++) { gg.beginPath(); gg.arc(60 + i * 40, 170 - i * 18, 26, 0, 7); gg.fill(); } gg.fillStyle = '#6b4a2f'; gg.beginPath(); gg.arc(220, 128, 8, 0, 7); gg.fill(); });
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), new THREE.MeshLambertMaterial({ map: fus })); f.position.set(1.0 + i * 0.75 - 0.2, 0.95, -3.47 + (i % 2) * 0.02); g.add(f); }
  const chab = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 28), mat('#7a4e2c')); chab.position.set(0.2, 0.36, -0.6); chab.castShadow = true; g.add(chab);
  for (const [x, z] of [[-0.3, -1.1], [0.7, -1.1], [-0.3, -0.1], [0.7, -0.1]]) { const l = box(0.06, 0.33, 0.06, mat('#5c3a20')); l.position.set(x, 0.17, z); g.add(l); }
  const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 10), mat('#3f6d55')); tea.position.set(0.0, 0.44, -0.5); g.add(tea);
  const mikan = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat('#f08a2b', { flatShading: true })); mikan.position.set(0.4, 0.45, -0.7); g.add(mikan);
  // CRT on legs
  const crt = box(0.95, 0.8, 0.7, mat('#6b4a2f')); crt.position.set(-2.4, 0.85, -2.9); g.add(crt);
  const crtS = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), screenM); crtS.position.set(-2.52, 0.88, -2.54); g.add(crtS); props.crt = crtS;
  for (let i = 0; i < 2; i++) { const k = box(0.06, 0.06, 0.04, mat('#c9c9c9')); k.position.set(-2.05, 1.0 - i * 0.18, -2.54); g.add(k); }
  for (const s of [-1, 1]) { const l = box(0.05, 0.45, 0.05, mat('#3b2a1b')); l.position.set(-2.4 + s * 0.38, 0.22, -2.9); g.add(l); }
  const ant = box(0.02, 0.5, 0.02, mat('#c9c9c9')); ant.position.set(-2.3, 1.48, -2.9); ant.rotation.z = 0.5; g.add(ant);
  const ant2 = ant.clone(); ant2.rotation.z = -0.5; ant2.position.x = -2.5; g.add(ant2);
  // phone stand + black phone
  const stand = box(0.7, 0.75, 0.45, mat('#7a4e2c')); stand.position.set(-3.4, 0.38, -1.2); g.add(stand);
  const ph = new THREE.Group();
  const pbase = box(0.32, 0.12, 0.3, mat('#121315')); pbase.position.y = 0.06; ph.add(pbase);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), mat('#d8d8d8')); dial.rotation.x = 0.45; dial.position.set(0, 0.14, 0.06); ph.add(dial);
  const hand = box(0.36, 0.06, 0.08, mat('#121315')); hand.position.set(0, 0.17, -0.08); ph.add(hand); props.receiver = hand;
  ph.position.set(-3.4, 0.76, -1.2); g.add(ph); props.blackPhone = ph;
  // round ceiling lamp with pull string
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.25, 20, 1, true), new THREE.MeshLambertMaterial({ color: 0xf5f2e8, side: THREE.DoubleSide, emissive: 0xfff3d0, emissiveIntensity: 0.4 })); shade.position.set(0, 2.75, -0.6); g.add(shade);
  const str = box(0.01, 0.6, 0.01, mat('#ddd')); str.position.set(0.1, 2.35, -0.6); g.add(str);
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), mat('#f8f8f2')); cal.position.set(-1.6, 1.9, -3.47); g.add(cal); props.calendar = cal;
}

const FLOOR_SETS = { bed: 'wood', desk: 'wood', living: 'wood', kitchen: 'tile', office: 'carpet', ward: 'tile', toilet: 'tile', showa: 'tatami' };
function setRoom(opt = {}) {
  const want = opt.sets || ['bed'];
  for (const k in sets) sets[k].visible = want.includes(k);
  const fl = opt.floor || FLOOR_SETS[want[0]] || 'wood';
  floorM.map = floorTex[fl]; floorM.needsUpdate = true;
  wallM.color.set(opt.wall || (want.includes('ward') ? '#f2f5f7' : want.includes('office') ? '#e6e9ed' : want.includes('showa') ? '#d9c9a3' : want.includes('toilet') ? '#dfe7ea' : '#e9e3d8'));
  winGroup.visible = opt.window ?? !(want.includes('toilet') || want.includes('showa'));
  if (opt.windowPos) winGroup.position.set(...opt.windowPos);
}
const LIGHT = {
  day: { sky: 'day', hi: 1.15, wi: 1.4, ci: 6, bg: '#cfd8e2' },
  evening: { sky: 'evening', hi: 0.8, wi: 0.9, ci: 10, bg: '#8a7a70' },
  night: { sky: 'night', hi: 0.42, wi: 0.15, ci: 12, bg: '#0d1220' },
  dark: { sky: 'dark', hi: 0.3, wi: 0.12, ci: 0, bg: '#05070c' },
};
function setLight(mode, opt = {}) {
  const L = LIGHT[mode];
  winM.map = winSky[L.sky]; winM.needsUpdate = true;
  hemi.intensity = opt.hemi ?? L.hi; winLight.intensity = L.wi; ceil.intensity = opt.ceil ?? L.ci; room.background.set(L.bg);
  hemi.color.set(mode === 'night' || mode === 'dark' ? '#8ea2d8' : '#ffffff');
  winLight.color.set(mode === 'night' || mode === 'dark' ? '#9fb4ff' : mode === 'evening' ? '#ffc89a' : '#fff1dc');
  lamp.intensity = opt.lamp ?? 0; glow.intensity = opt.glow ?? 0; if (opt.glowPos) glow.position.set(...opt.glowPos);
}
setRoom(); setLight('day');

export { room, setRoom, setLight, setClock, setScreen, props, sets, glow, lamp, ceil };
