import * as THREE from 'three';
import { rng, mat, box } from '../lib.js';

// =====================================================
// BEAR：ローポリのツキノワグマと、クマの回で使う小物（山の背景・ゴミ置き場・注意看板）
// API
//   makeBear()            … 体長約1.5m、+x 向き。g.userData.anim(t, { walk, head })：walk 0..1 で歩き、head で首の上下（-0.6 下を向く〜0.3 上）
//                           g.userData.stand(k)：k 0..1 で後ろ足で立ち上がる
//   addMountains(scene, { z, color, snow }) … 遠くの山並み（町や畑の奥に置く）。返り値 Group
//   makeGarbage()         … ゴミ置き場（金網のかご＋ゴミ袋）。g.userData.scatter(k) で袋が外に散らばる
//   makeBearSign(text)    … 黄色い注意看板（柱つき）。高さ約2.2m
// =====================================================
const furM = mat('#1d1c1f'), furM2 = mat('#2a282c'), muzM = mat('#8a6a4f'), whiteM = mat('#efe9dc'), noseM = mat('#0b0b0c'), eyeM = new THREE.MeshBasicMaterial({ color: 0x050505 }), hiM = new THREE.MeshBasicMaterial({ color: 0xffffff });

function makeBear() {
  const g = new THREE.Group();
  const root = new THREE.Group(); g.add(root);
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), furM); body.scale.set(1.45, 0.82, 0.82); body.position.set(0, 0.72, 0); body.castShadow = true; root.add(body);
  const hump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), furM2); hump.position.set(0.32, 0.92, 0); hump.castShadow = true; root.add(hump);
  // 胸の月の輪（白いV字）
  const moon = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 4, 12, Math.PI), whiteM); moon.rotation.set(0, Math.PI / 2, Math.PI); moon.position.set(0.66, 0.78, 0); moon.scale.set(1, 0.8, 1); root.add(moon);
  // 頭
  const head = new THREE.Group(); head.position.set(0.7, 0.98, 0); root.add(head);
  const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), furM); hd.scale.set(1.05, 0.95, 1.05); hd.position.set(0.14, 0, 0); hd.castShadow = true; head.add(hd);
  const muz = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.22, 7), muzM); muz.rotation.z = -Math.PI / 2; muz.position.set(0.4, -0.05, 0); head.add(muz);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), noseM); nose.position.set(0.52, -0.03, 0); head.add(nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), furM); ear.scale.set(0.6, 1, 1); ear.position.set(0.08, 0.22, s * 0.18); head.add(ear);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), eyeM); e.position.set(0.33, 0.07, s * 0.12); head.add(e);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 3), hiM); h.position.set(0.355, 0.085, s * 0.12 + 0.01); head.add(h);
  }
  // 足（腰の位置を支点に回す）
  const legs = [];
  for (const [x, z] of [[0.45, 0.22], [0.45, -0.22], [-0.45, 0.22], [-0.45, -0.22]]) {
    const p = new THREE.Group(); p.position.set(x, 0.6, z); root.add(p);
    const l = box(0.2, 0.6, 0.22, furM); l.position.y = -0.3; p.add(l);
    const paw = box(0.26, 0.08, 0.24, furM2); paw.position.set(0.04, -0.58, 0); p.add(paw);
    legs.push(p);
  }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), furM); tail.position.set(-0.74, 0.8, 0); root.add(tail);
  let standK = 0;
  g.userData.anim = (t, { walk = 1, head: hy = 0 } = {}) => {
    const ph = t * 5.2;
    legs.forEach((p, i) => { const s = (i === 0 || i === 3) ? 1 : -1; p.rotation.z = Math.sin(ph) * 0.45 * walk * s * (1 - standK); });
    root.position.y = Math.abs(Math.sin(ph)) * 0.03 * walk * (1 - standK);
    head.rotation.z = hy + Math.sin(t * 2.1) * 0.06 + Math.sin(ph) * 0.04 * walk;
    head.rotation.y = Math.sin(t * 0.9) * 0.15 * (1 - walk);
  };
  g.userData.stand = (k) => {
    standK = k;
    root.rotation.z = k * 1.15; root.position.x = -k * 0.35;
    legs[2].rotation.z = legs[3].rotation.z = -k * 1.1; legs[0].rotation.z = legs[1].rotation.z = -k * 0.5;
  };
  g.userData.head = head;
  return g;
}

function addMountains(scene, { z = -150, color = '#4d6b4a', far = '#6f8aa0', snow = false, span = 260 } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const r = rng(91);
  for (let i = 0; i < 9; i++) {
    const h = 40 + r() * 35, w = 60 + r() * 40;
    const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 6), mat(far, { flatShading: true })); m.position.set(-span / 2 + i * span / 8 + (r() - .5) * 20, h / 2 - 4, z - 50 - r() * 20); g.add(m);
  }
  for (let i = 0; i < 11; i++) {
    const h = 22 + r() * 20, w = 34 + r() * 22;
    const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 7), mat(color, { flatShading: true })); m.position.set(-span / 2 + i * span / 10 + (r() - .5) * 12, h / 2 - 3, z + (r() - .5) * 14); g.add(m);
    if (snow) { const c = new THREE.Mesh(new THREE.ConeGeometry(w * 0.22, h * 0.22, 7), mat('#f2f4f6', { flatShading: true })); c.position.set(m.position.x, h - 3 - h * 0.11, m.position.z); g.add(c); }
  }
  // 山すその杉林
  const treeM = mat('#2f5a3a', { flatShading: true });
  for (let i = 0; i < 70; i++) { const h = 6 + r() * 5; const c = new THREE.Mesh(new THREE.ConeGeometry(1.8 + r(), h, 6), treeM); c.position.set(-span / 2 + r() * span, h / 2, z + 26 + r() * 12); g.add(c); }
  return g;
}

function makeGarbage() {
  const g = new THREE.Group();
  const netM = mat('#5d7a8c'), bagM = mat('#e8edf0', { transparent: true, opacity: 0.95 }), bag2 = mat('#d7e2ea');
  const base = box(2.0, 0.08, 1.1, mat('#9aa0a6')); base.position.y = 0.04; g.add(base);
  for (const [x, z, w, d] of [[0, -0.52, 2.0, 0.04], [-0.98, 0, 0.04, 1.1], [0.98, 0, 0.04, 1.1]]) { const p = box(w, 0.9, d, netM); p.position.set(x, 0.49, z); p.material = new THREE.MeshLambertMaterial({ color: '#5d7a8c', transparent: true, opacity: 0.55 }); g.add(p); }
  const lid = box(2.0, 0.05, 1.1, mat('#4f6a7a')); lid.position.set(0, 0.96, 0); g.add(lid);
  const r = rng(5); const bags = [];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), i % 2 ? bagM : bag2); b.scale.set(1, 0.85, 1);
    const hx = -0.7 + (i % 5) * 0.35, hz = -0.2 + Math.floor(i / 5) * 0.35, hy = 0.28 + Math.floor(i / 5) * 0.25;
    const ox = -0.2 + r() * 2.6, oz = 0.8 + r() * 1.4;
    b.position.set(hx, hy, hz); b.castShadow = true; g.add(b); bags.push({ b, hx, hy, hz, ox, oz, rot: r() * 3 });
  }
  g.userData.scatter = (k) => { bags.forEach((x, i) => { const u = Math.min(1, Math.max(0, k * 1.6 - i * 0.07)); x.b.position.set(x.hx + (x.ox - x.hx) * u, x.hy * (1 - u) + 0.2 * u + Math.sin(u * Math.PI) * 0.5, x.hz + (x.oz - x.hz) * u); x.b.rotation.z = x.rot * u; }); lid.rotation.x = -k * 1.2; lid.position.z = -k * 0.45; lid.position.y = 0.96 + k * 0.35; };
  return g;
}

function makeBearSign(textSpriteFn, text = 'クマ出没注意') {
  const g = new THREE.Group();
  const pole = box(0.09, 2.2, 0.09, mat('#8a8f96')); pole.position.y = 1.1; g.add(pole);
  const board = box(1.25, 1.0, 0.05, mat('#f3c623')); board.position.set(0, 1.85, 0.06); g.add(board);
  const edge = box(1.35, 1.1, 0.03, mat('#1d1c1f')); edge.position.set(0, 1.85, 0.03); g.add(edge);
  const sp = textSpriteFn(text, { w: 512, h: 128, size: 76, color: '#1d1c1f' }); const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.27), new THREE.MeshBasicMaterial({ map: sp.material.map, transparent: true })); lab.position.set(0, 2.1, 0.095); g.add(lab);
  // クマの横顔マーク
  const mk = new THREE.Mesh(new THREE.CircleGeometry(0.16, 10), mat('#1d1c1f')); mk.position.set(0, 1.66, 0.09); g.add(mk);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), mat('#1d1c1f')); e.position.set(s * 0.12, 1.8, 0.09); g.add(e); }
  return g;
}

export { makeBear, addMountains, makeGarbage, makeBearSign };
