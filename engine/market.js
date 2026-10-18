import * as THREE from 'three';
import { W, H, RW, RH, canvas, renderer, rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, canvasTex, windowTextures, makeSky, SKIN, HAIR, SHIRT, PANTS, makePerson, poseWalk, randPerson, walkAlong, qTex, makeQ } from './lib.js';

// =====================================================
// SUPERMARKET
// =====================================================
const market = new THREE.Scene();
market.background = new THREE.Color('#e9edf1');
market.fog = new THREE.Fog(0xe9edf1, 30, 70);
market.add(new THREE.HemisphereLight(0xffffff, 0x9aa3ad, 1.6));
const mLight = new THREE.DirectionalLight(0xffffff, 1.2); mLight.position.set(10, 25, 12); mLight.castShadow = true; mLight.shadow.mapSize.set(1024, 1024);
Object.assign(mLight.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 }); market.add(mLight);
const shelfItems = [];
{
  const floorTex = canvasTex(256, 256, (g) => { g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#d9dad6'; g.lineWidth = 4; g.strokeRect(0, 0, 128, 128); g.strokeRect(128, 128, 128, 128); g.strokeRect(128, 0, 128, 128); g.strokeRect(0, 128, 128, 128); });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(20, 20);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ map: floorTex })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; market.add(fl);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(80, 8, 0.5), mat('#dfe3e8')); wall.position.set(0, 4, -22); market.add(wall);
  const r = rng(55);
  const cols = ['#e46a5b', '#f2c14e', '#5fb38a', '#4f8fd1', '#c47ad1', '#f08a4b', '#e9e4da', '#7cc6c0'];
  for (let s = 0; s < 6; s++) {
    const x = -15 + s * 6;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 14), mat('#f7f7f5')); sh.position.set(x, 1.1, -10); sh.castShadow = true; sh.receiveShadow = true; market.add(sh);
    for (const side of [-1, 1]) for (let lv = 0; lv < 3; lv++) {
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 14), mat('#cfd3d8')); ledge.position.set(x + side * 1.05, 0.45 + lv * 0.7, -10); market.add(ledge);
      for (let k = 0; k < 18; k++) {
        const it = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4 + r() * 0.15, 0.55), mat(cols[Math.floor(r() * cols.length)]));
        it.position.set(x + side * 1.05, 0.7 + lv * 0.7, -16.4 + k * 0.75); it.castShadow = true;
        market.add(it); shelfItems.push({ it, k: r() });
      }
    }
  }
  // registers
  for (let i = 0; i < 4; i++) {
    const x = -10 + i * 6.5;
    const c = box(1, 1, 3, mat('#b9c0c8')); c.position.set(x, 0.5, 1); market.add(c);
    const m = box(0.5, 0.5, 0.4, mat('#3b4250')); m.position.set(x, 1.25, 0.2); market.add(m);
    const sign = box(1.4, 0.5, 0.1, mat('#1fb3a1')); sign.position.set(x, 3.0, 1); market.add(sign);
  }
}
const queues = [];
{
  const r = rng(808);
  for (let q = 0; q < 4; q++) {
    const x = -10 + q * 6.5 + 1.4;
    for (let n = 0; n < 16; n++) {
      const p = randPerson(r); market.add(p);
      p.position.set(x + (r() - .5) * 0.3, 0, 1.5 + n * 1.05 + (r() - .5) * 0.2);
      p.rotation.y = Math.PI + (r() - .5) * 0.4;
      queues.push({ p, n, ph: r() * 6 });
    }
  }
}


export { market, mLight, shelfItems, queues };
