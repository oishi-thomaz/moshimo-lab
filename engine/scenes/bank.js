import * as THREE from 'three';
import { rng, mat, box, makeSky, randPerson, poseWalk, canvasTex, makeQ } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// BANK：架空の「もしも銀行」の支店（2階建て・ATMコーナーのガラス張り・入口）と歩道・道路、ATMの行列、札束
// 建物の正面は z=0（+z 向き）、横幅 x -8..8。歩道 z 0..4、道路 z 4..11。ATMは中の x=-3.6/-2.4/-1.2, z=-1.3
// API
//   bank (Scene), setBankEnv('day'|'dusk'|'night')
//   setATM(i, mode)      … mode: 'ok'（いらっしゃいませ）/ 'empty'（お取り扱いできません・赤）/ 'off'
//   makeQueue(n, seed)   … 行列。q.set(k, t, { look, qs }) で先頭から k 人を表示（ATMの入口 x=-1.0 から +x へ歩道に並ぶ）
//                          q.people[i]、qs=true で？吹き出し
//   setShutter(k)        … 入口とATMコーナーのシャッターを k 0..1 で下ろす
//   makeBills(n)         … 札束の山（架空の紙幣色。100万円＝1束）。b.setN(k) で k 束だけ表示。Group を返す
//   ATMS（ATMの Group 配列）、bankSign（看板の Group）
// =====================================================
const bank = new THREE.Scene();
const sky = makeSky(); bank.add(sky);
bank.fog = new THREE.Fog(0xdfe8f2, 45, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x50545a, 1.1); bank.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(18, 30, 22); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 }); bank.add(sun);
const inner = new THREE.PointLight(0xfff2dc, 6, 12, 1.4); inner.position.set(-2.4, 2.6, -2.2); bank.add(inner);

const groundM = mat('#8a9098');
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; bank.add(ground);
const walk = box(200, 0.14, 4, mat('#c9c4bb')); walk.position.set(0, 0.07, 2); walk.castShadow = false; bank.add(walk);
const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 7), mat('#4d525a')); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 7.5); road.receiveShadow = true; bank.add(road);
for (let x = -96; x < 96; x += 6) { const l = box(2.6, 0.02, 0.18, mat('#e9ecef')); l.position.set(x, 0.04, 7.5); l.castShadow = false; bank.add(l); }
const curb = box(200, 0.2, 0.25, mat('#a7a39c')); curb.position.set(0, 0.1, 4); bank.add(curb);

// building
const wallM = mat('#d8d2c6'), trimM = mat('#6d5a44'), glassM = new THREE.MeshLambertMaterial({ color: '#9fc4d6', transparent: true, opacity: 0.28 }), frameM = mat('#3b3f47');
const B = new THREE.Group(); bank.add(B);
{
  const back = box(16, 7, 0.3, wallM); back.position.set(0, 3.5, -10); B.add(back);
  for (const x of [-8, 8]) { const s = box(0.3, 7, 10, wallM); s.position.set(x, 3.5, -5); B.add(s); }
  const roof = box(16.4, 0.4, 10.4, trimM); roof.position.set(0, 7.2, -5); B.add(roof);
  const upper = box(16, 3.4, 0.3, wallM); upper.position.set(0, 5.3, 0); B.add(upper);
  // 2階の窓
  for (let i = 0; i < 6; i++) { const w = box(1.6, 1.2, 0.05, mat('#46566a')); w.position.set(-6 + i * 2.4, 5.4, 0.18); B.add(w); }
  // 1階：左がATMコーナー（ガラス）、右が入口と壁
  const pillarL = box(0.5, 3.6, 0.4, wallM); pillarL.position.set(-7.75, 1.8, 0); B.add(pillarL);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.0), glassM); glass.position.set(-5.0, 1.65, 0.02); B.add(glass);
  for (const x of [-7.3, -5.0, -2.7]) { const f = box(0.08, 3.0, 0.08, frameM); f.position.set(x, 1.65, 0.05); B.add(f); }
  const ftop = box(4.7, 0.1, 0.1, frameM); ftop.position.set(-5.0, 3.15, 0.05); B.add(ftop);
  const atmDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.0), glassM); atmDoor.position.set(-1.5, 1.65, 0.02); B.add(atmDoor);
  for (const x of [-2.6, -0.4]) { const f = box(0.1, 3.0, 0.1, frameM); f.position.set(x, 1.65, 0.05); B.add(f); }
  const mid = box(1.2, 3.6, 0.3, wallM); mid.position.set(0.2, 1.8, 0); B.add(mid);
  const right = box(4.2, 3.6, 0.3, wallM); right.position.set(5.9, 1.8, 0); B.add(right);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.0), glassM); door.position.set(2.2, 1.65, 0.02); B.add(door);
  for (const x of [0.8, 3.6]) { const f = box(0.1, 3.0, 0.1, frameM); f.position.set(x, 1.65, 0.05); B.add(f); }
  // 中の床と奥のカウンター
  const fl = box(15.6, 0.05, 9.6, mat('#e8e2d6')); fl.position.set(0, 0.03, -5); B.add(fl);
  const counter = box(7, 1.1, 0.8, mat('#8a6d4f')); counter.position.set(3.6, 0.55, -5.5); B.add(counter);
  const part = box(0.12, 3.6, 4, wallM); part.position.set(-0.4, 1.8, -2); B.add(part);
}
// 看板（架空：もしも銀行）
const bankSign = new THREE.Group(); bankSign.position.set(0, 4.2, 0.25); B.add(bankSign);
{
  const bd = box(7.2, 1.1, 0.12, mat('#5b4a7a')); bankSign.add(bd);
  const sp = textSprite('もしも銀行', { w: 1024, h: 160, size: 120, color: '#f7f1e3' });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.0), new THREE.MeshBasicMaterial({ map: sp.material.map, transparent: true })); lab.position.z = 0.07; bankSign.add(lab);
  const atmSp = textSprite('ATM', { w: 256, h: 128, size: 90, color: '#ffffff', bg: '#5b4a7a', radius: 14 });
  const atmLab = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: atmSp.material.map, transparent: true })); atmLab.position.set(-1.5, 3.45, 0.12); B.add(atmLab);
}
// ATMs (in the glass corner, facing +z)
const ATMS = [], screens = [];
const scrCols = { ok: ['#2b6fb3', 'いらっしゃいませ', '#ffffff'], empty: ['#b3322b', 'お取り扱い<br>できません', '#ffffff'], off: ['#15181d', '', '#fff'] };
for (let i = 0; i < 3; i++) {
  const g = new THREE.Group(); g.position.set(-6.4 + i * 1.4, 0, -0.9); bank.add(g);
  const body = box(0.9, 1.4, 0.7, mat('#c7ccd2')); body.position.y = 0.7; g.add(body);
  const top = box(0.9, 0.5, 0.35, mat('#b5bbc2')); top.position.set(0, 1.65, -0.17); g.add(top);
  const c = document.createElement('canvas'); c.width = 256; c.height = 180; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 1.45, 0.06); scr.rotation.x = -0.55; g.add(scr);
  const slot = box(0.3, 0.04, 0.05, mat('#2a2d33')); slot.position.set(0.2, 1.62, 0.02); g.add(slot);
  ATMS.push(g); screens.push({ c, tex, mode: '' });
}
function setATM(i, mode) {
  const s = screens[i]; if (s.mode === mode) return; s.mode = mode;
  const [bg, txt, fg] = scrCols[mode]; const g = s.c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 180);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 30px "Noto Sans CJK JP", sans-serif';
  const lines = txt.split('<br>'); lines.forEach((l, k) => g.fillText(l, 128, 90 + (k - (lines.length - 1) / 2) * 40));
  s.tex.needsUpdate = true;
}
[0, 1, 2].forEach(i => setATM(i, 'ok'));

// shutters
const shutM = mat('#9aa1a9');
const shutters = [[-5.0, 4.6], [-1.5, 2.2], [2.2, 2.8]].map(([x, w]) => { const s = box(w, 3.0, 0.06, shutM); s.position.set(x, 3.15, 0.12); s.geometry.translate(0, -1.5, 0); s.scale.y = 0.001; bank.add(s); return s; });
function setShutter(k) { shutters.forEach(s => { s.scale.y = Math.max(0.001, k); }); }

// queue
function makeQueue(n, seed = 3) {
  const r = rng(seed); const people = [], qs = [];
  for (let i = 0; i < n; i++) {
    const p = randPerson(r); bank.add(p); p.visible = false;
    const row = i % 2;
    p.userData.slot = { x: -1.0 + Math.floor(i / 2) * 0.62 + row * 0.25, z: 1.2 + row * 0.75 + (r() - .5) * 0.15, ph: r() * 6, look: (r() - .5) * 0.8 };
    const q = makeQ(); q.visible = false; bank.add(q); qs.push(q);
    people.push(p);
  }
  return {
    people, qs,
    set(k, t, { look = 0, qsOn = false, arrive = 1 } = {}) {
      people.forEach((p, i) => {
        p.visible = i < k; qs[i].visible = false; if (!p.visible) return;
        const s = p.userData.slot; const ar = Math.min(1, Math.max(0, arrive * 1.4 - i / n * 0.6));
        p.position.set(s.x + (1 - ar) * 9, 0.14, s.z);
        p.rotation.y = -Math.PI / 2 + s.look * look * 0.4 + (ar < 1 ? 0.3 : 0);
        if (ar < 1) poseWalk(p, t * 7 + s.ph, 1); else { poseWalk(p, 0, 0); p.position.y = 0.14; p.userData.head.rotation.y = Math.sin(t * 0.8 + s.ph) * 0.3 * look; }
        if (qsOn && i % 3 === 0 && i < 30) { qs[i].visible = true; qs[i].position.set(p.position.x, p.position.y + 2.15, p.position.z); }
      });
    },
  };
}

// bills: generic bundles (not real notes): cream paper with a gray band
const billM = mat('#e9dfc4'), bandM = mat('#7d8a99'), billEdge = mat('#d8cba8');
function makeBills(n, { cols = 10, w = 0.32, h = 0.14 } = {}) {
  const g = new THREE.Group(); const bs = [];
  for (let i = 0; i < n; i++) {
    const b = new THREE.Group();
    const p = box(w, h * 0.9, w * 0.47, billM); b.add(p);
    const e = box(w * 1.002, h * 0.9, w * 0.2, billEdge); e.position.z = 0; e.scale.set(1, 1.001, 0.5); b.add(e);
    const band = box(w * 0.18, h * 0.92, w * 0.48, bandM); b.add(band);
    const c = i % cols, layer = Math.floor(i / (cols * 2)), row = Math.floor(i / cols) % 2;
    b.position.set((c - (cols - 1) / 2) * w * 1.04, h / 2 + layer * h, (row - 0.5) * w * 0.5);
    g.add(b); bs.push(b);
  }
  g.userData.setN = (k) => bs.forEach((b, i) => b.visible = i < k);
  return g;
}

const ENV = {
  day: { top: '#5c9fe0', bot: '#e4f1fa', fog: '#dfe8f2', hi: 1.1, si: 1.4, sc: '#fff4e0', inner: 4 },
  dusk: { top: '#4f6fa8', bot: '#f2b98f', fog: '#d9b49c', hi: 0.95, si: 1.0, sc: '#ffc89a', inner: 8 },
  night: { top: '#0a1430', bot: '#2a3a66', fog: '#18223e', hi: 0.7, si: 0.35, sc: '#a9bcff', inner: 12 },
};
function setBankEnv(e) {
  const E = ENV[e]; sky.material.uniforms.top.value.set(E.top); sky.material.uniforms.bot.value.set(E.bot);
  bank.fog.color.set(E.fog); hemi.intensity = E.hi; sun.intensity = E.si; sun.color.set(E.sc); inner.intensity = E.inner;
}
setBankEnv('day');

export { bank, setBankEnv, setATM, makeQueue, setShutter, makeBills, ATMS, bankSign };
