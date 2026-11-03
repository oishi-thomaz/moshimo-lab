import * as THREE from 'three';
import { clamp, ease, easeOut, mat, box } from '../lib.js';

// =====================================================
// 判子と書類（どのシーンにも置ける。2026/11/03 0639〜0642 で作成）
//  makeHanko({face, handle})   ：大きな判子（原点＝印面の中心。下向きに押す）
//  hankoSlam(h, [x,y,z], t, t0, {from, up})：t0 の瞬間に [x,y,z] へドンと押して、少し持ち上がる。押した後は true
//  makeMark(text, {color, ring, sx}) ：押した跡（赤い丸枠に文字）のスプライト。userData.size(k)。手前に描く
//  makeDoc({title, rows, head, w, h}) ：書類（見出しの帯・項目と記入欄）。userData.fill(i, 文字) で欄に書き込む
// =====================================================
const FONT = (px) => `900 ${px}px "Noto Sans CJK JP", sans-serif`;

function makeHanko({ face = '#c8242c', handle = '#8a5a32', r = 0.55 } = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.28, 32), mat(face)); base.position.y = 0.14; g.add(base);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.62, 0.5, 24), mat(handle)); neck.position.y = 0.53; g.add(neck);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(r * 0.62, 24, 16), mat(handle)); knob.position.y = 1.0; knob.scale.y = 0.8; g.add(knob);
  return g;
}
// t0 で押す。from：押す前の高さ、up：押した後に上がる高さ
function hankoSlam(h, [x, y, z], t, t0, { from = 3.0, up = 1.4, dur = 0.28 } = {}) {
  let dy;
  if (t < t0 - dur) dy = from;
  else if (t < t0) dy = from * (1 - ease((t - (t0 - dur)) / dur));
  else if (t < t0 + 0.12) dy = 0;
  else dy = up * easeOut((t - t0 - 0.12) / 0.4);
  h.position.set(x, y + dy, z);
  return t >= t0;
}
function makeMark(text, { color = '#e0262f', ring = true, sx = 1.4, sub = '' } = {}) {
  const W = 512, c = document.createElement('canvas'); c.width = W; c.height = W;
  const g = c.getContext('2d'); g.strokeStyle = color; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 14, 0, Math.PI * 2); g.fill(); g.fillStyle = color;
  if (ring) { g.lineWidth = 30; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 30, 0, Math.PI * 2); g.stroke(); g.lineWidth = 8; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 62, 0, Math.PI * 2); g.stroke(); }
  let px = text.length <= 2 ? 190 : text.length === 3 ? 140 : 110; g.font = FONT(px);
  while (g.measureText(text).width > W * 0.68 && px > 40) { px -= 6; g.font = FONT(px); }
  g.fillText(text, W / 2, W / 2 + (sub ? -30 : 6));
  if (sub) { g.font = FONT(64); g.fillText(sub, W / 2, W / 2 + 110); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); sp.renderOrder = 7;
  sp.material.rotation = -0.18;
  sp.scale.set(sx, sx, 1); sp.userData.sx = sx; sp.userData.fit = 1; sp.userData.ar = 1;
  sp.userData.size = (k) => sp.scale.set(k, k, 1);
  return sp;
}
function makeDoc({ title = '届出書', rows = ['氏名', '住所', '金額'], head = '#c8242c', w = 2.0, h = 2.6, cw = 512 } = {}) {
  const ch = Math.round(cw * h / w);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const vals = rows.map(() => '');
  function draw() {
    const g = c.getContext('2d'); g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, cw, ch);
    g.fillStyle = head; g.fillRect(0, 0, cw, 104); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = 58; g.font = FONT(px); while (g.measureText(title).width > cw - 40) { px -= 4; g.font = FONT(px); } g.fillText(title, cw / 2, 54);
    const rh = Math.min(120, (ch - 150) / rows.length);
    rows.forEach((r, i) => {
      const y = 140 + i * rh; g.textAlign = 'left'; g.fillStyle = '#333'; g.font = FONT(36); g.fillText(r, 28, y + rh * 0.42);
      g.strokeStyle = '#9a9a9a'; g.lineWidth = 3; g.strokeRect(190, y + 6, cw - 218, rh - 22);
      if (vals[i]) { g.fillStyle = '#1a2a6a'; let p = 44; g.font = FONT(p); while (g.measureText(vals[i]).width > cw - 240 && p > 18) { p -= 3; g.font = FONT(p); } g.fillText(vals[i], 204, y + rh * 0.42); }
    });
    tex.needsUpdate = true;
  }
  draw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  m.userData.fill = (i, s) => { if (vals[i] !== s) { vals[i] = s; draw(); } };
  return m;
}

export { makeHanko, hankoSlam, makeMark, makeDoc };
