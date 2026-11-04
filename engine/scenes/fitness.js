import * as THREE from 'three';
import { clamp, lerp, mat, box, makePerson } from '../lib.js';

// =====================================================
// fitness：道具なしの運動の回（0652 空気椅子・0653 1分全力・0654 片足立ち から）
//  addKnees(p)：makePerson / makeSuit の人の脚を ひざで曲がる2段（太もも＋すね）に作り替える
//  fitReset(p)、poseWallSit(p, k, shake, t)、poseOneLeg(p, k, {side, wobble, t, arms})、poseRun(p, ph, amp)、poseStepUp(p, ph)
//  setThighHeat(p, k)：太ももが赤く燃える（0..1）
//  makeTimer({w, h})：デジタルのタイマー（userData.set(文字, 色)）
//  makeStairs({n, rise, run, w})：駅の階段（手すり・踏み面の黄色い線）。stairAt(s) で s段目の [y, z]
//  makeEscalator({n, rise, run, w})：となりのエスカレーター（ステップが流れる。userData.flow(t)）
//  makeWallSet({w, h, color})：もたれる壁と床（巾木つき）
//  makeSink()：洗面台と鏡。makeToothbrush()：歯ブラシ
//  makeBPMonitor()：家庭用の血圧計（画面は userData.set(上, 下)）
//  makeDayStrip({w})：1日の帯（朝〜夜）に全力の山を立てる（userData.set(山の数, k)）
// =====================================================

function addKnees(p) {
  const U = p.userData; if (U.knees) return p;
  p.rotation.order = 'YXZ';
  const pantsM = U.legs[0].children[0].material; const shoeM = mat('#24262b');
  U.thighs = [];
  U.knees = U.legs.map(l => {
    l.children.forEach(c => { c.visible = false; });
    const th = box(0.17, 0.42, 0.2, pantsM.clone()); th.position.y = -0.21; l.add(th); U.thighs.push(th);
    const kn = new THREE.Group(); kn.position.y = -0.42; l.add(kn);
    const sh = box(0.16, 0.38, 0.19, pantsM); sh.position.y = -0.19; kn.add(sh);
    const sho = box(0.19, 0.1, 0.3, shoeM); sho.position.set(0, -0.39, 0.05); kn.add(sho);
    return kn;
  });
  U.thighBase = new THREE.Color().copy(pantsM.color);
  return p;
}
const HOT = new THREE.Color('#ff3a1a');
function setThighHeat(p, k) {
  const U = p.userData; if (!U.thighs) return;
  U.thighs.forEach(th => { th.material.color.copy(U.thighBase).lerp(HOT, clamp(k)); th.material.emissive && th.material.emissive.setRGB(0.5 * clamp(k), 0.08 * clamp(k), 0); });
}
function fitReset(p) {
  const U = p.userData; p.rotation.set(0, 0, 0); p.position.y = U.y0 || 0;
  U.legs.forEach(l => l.rotation.set(0, 0, 0)); (U.knees || []).forEach(k => k.rotation.set(0, 0, 0));
  U.arms.forEach(a => a.rotation.set(0, 0, 0)); U.head.rotation.set(0, 0, 0); setThighHeat(p, 0);
}
// 空気椅子：k 0 = 壁にもたれて立つ … 1 = 太ももが床と平行。背中は壁のまま、足が前に出る。shake で太ももがぷるぷる
function poseWallSit(p, k, shake = 0, t = 0) {
  const U = p.userData; const s = p.scale.y;
  const th = (Math.PI / 2) * k + Math.sin(t * 47) * 0.035 * shake;
  U.legs.forEach((l, i) => { l.rotation.x = -th + (i ? 1 : -1) * Math.sin(t * 53 + i) * 0.012 * shake; });
  U.knees.forEach(n => { n.rotation.x = th; });
  p.position.y = (U.y0 || 0) - 0.42 * (1 - Math.cos(th)) * s;
  U.arms.forEach((a, i) => { a.rotation.set(-0.35 * k, 0, (i ? -1 : 1) * 0.12); });
  U.head.rotation.x = 0;
}
// 片足立ち：side の足（0 左・1 右）を少しだけ上げる。wobble でぐらつく。arms：'out'（横に広げる）/'brush'（歯みがき）/'desk'（前の机に手をつく）
function poseOneLeg(p, k, { side = 1, wobble = 0, t = 0, arms = 'out', lift = 0.45 } = {}) {
  const U = p.userData;
  U.legs[side].rotation.x = -lift * k; U.knees[side].rotation.x = 1.5 * lift * k * 1.6;
  U.legs[1 - side].rotation.z = (side ? -1 : 1) * 0.04 * k;
  const w = Math.sin(t * 5.3) * 0.06 * wobble + Math.sin(t * 9.1 + 1) * 0.03 * wobble;
  p.rotation.z = w; p.rotation.x = Math.sin(t * 4.1) * 0.025 * wobble;
  if (arms === 'out') { U.arms[0].rotation.set(0, 0, -0.5 * k - w * 4); U.arms[1].rotation.set(0, 0, 0.5 * k - w * 4); }
  else if (arms === 'brush') { U.arms[1].rotation.set(-2.2, 0, 0.55 + Math.sin(t * 14) * 0.05); U.arms[0].rotation.set(0, 0, -0.35 * wobble - w * 3); }
  else if (arms === 'desk') { U.arms[0].rotation.set(-1.05, 0, 0); U.arms[1].rotation.set(-1.05, 0, 0); }
}
// 走る（階段も同じ脚の動き。amp 1 で全力）
function poseRun(p, ph, amp = 1) {
  const U = p.userData; const s = Math.sin(ph);
  U.legs[0].rotation.x = s * 0.8 * amp - 0.25 * amp; U.legs[1].rotation.x = -s * 0.8 * amp - 0.25 * amp;
  U.knees[0].rotation.x = (0.3 + Math.max(0, Math.sin(ph + 1.3)) * 1.3) * amp;
  U.knees[1].rotation.x = (0.3 + Math.max(0, Math.sin(ph + 1.3 + Math.PI)) * 1.3) * amp;
  U.arms[0].rotation.set(-s * 1.0 * amp, 0, 0.08); U.arms[1].rotation.set(s * 1.0 * amp, 0, -0.08);
  p.rotation.x = 0.18 * amp;
}
// 速く歩く（早歩き）
function poseFastWalk(p, ph) {
  const U = p.userData; const s = Math.sin(ph);
  U.legs[0].rotation.x = s * 0.55; U.legs[1].rotation.x = -s * 0.55;
  U.knees[0].rotation.x = Math.max(0, Math.sin(ph + 1.2)) * 0.7; U.knees[1].rotation.x = Math.max(0, Math.sin(ph + 1.2 + Math.PI)) * 0.7;
  U.arms[0].rotation.x = -s * 0.75; U.arms[1].rotation.x = s * 0.75; p.rotation.x = 0.06;
}

// ---------- 小物 ----------
const FONT = (px) => `900 ${px}px "Noto Sans CJK JP", sans-serif`;
function makeTimer({ w = 1.6, h = 0.7, cw = 640, frame = '#1b1e26', bg = '#0d0f14' } = {}) {
  const ch = Math.round(cw * h / w);
  const g = new THREE.Group();
  const body = box(w + 0.1, h + 0.1, 0.1, mat(frame)); body.position.z = -0.06; g.add(body);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })); g.add(scr);
  let key = '';
  g.userData.set = (s, col = '#7dff8a') => {
    const k = s + col; if (k === key) return; key = k; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, cw, ch);
    let px = Math.round(ch * 0.82); x.font = FONT(px); while (x.measureText(s).width > cw * 0.9 && px > 20) { px -= 4; x.font = FONT(px); }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 18; x.fillText(s, cw / 2, ch / 2 + px * 0.05);
    tex.needsUpdate = true;
  };
  g.userData.set('0:00');
  return g;
}
const fmtMS = (sec) => { const s = Math.max(0, Math.round(sec)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function makeStairs({ n = 14, rise = 0.17, run = 0.3, w = 2.4, color = '#b9bcc4', side = '#8a8e98' } = {}) {
  const g = new THREE.Group(); const m = mat(color), sm = mat(side), nose = mat('#e8c23a'), rm = mat('#d8dbe0');
  for (let i = 0; i < n; i++) {
    const st = box(w, rise * (i + 1), run, m); st.position.set(0, rise * (i + 1) / 2, -i * run - run / 2); g.add(st);
    const ln = box(w, 0.012, 0.05, nose); ln.position.set(0, rise * (i + 1) + 0.006, -i * run - 0.04); g.add(ln);
  }
  const L = n * run, H = n * rise, len = Math.hypot(L, H), a = Math.atan2(H, L);
  for (const sx of [-1, 1]) {
    // 横の低い壁（坂に沿った板）と手すり
    const wall = box(0.12, 0.32, len, sm); wall.rotation.x = a; wall.position.set(sx * (w / 2 + 0.06), H / 2 + 0.02, -L / 2); g.add(wall);
    for (let k = 0; k <= 4; k++) { const u = k / 4; const post = box(0.05, 0.85, 0.05, rm); post.position.set(sx * (w / 2 + 0.06), H * u + 0.42, -L * u); g.add(post); }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len + 0.3, 8), rm); rail.rotation.x = -Math.atan2(L, H); rail.position.set(sx * (w / 2 + 0.06), H / 2 + 0.85, -L / 2); g.add(rail);
  }
  g.userData = { n, rise, run, w, L, H, at: (s) => [rise * clamp(s, 0, n), -run * clamp(s, 0, n)] };
  return g;
}
function makeEscalator({ n = 14, rise = 0.17, run = 0.3, w = 1.1 } = {}) {
  const g = new THREE.Group(); const L = n * run, H = n * rise, len = Math.hypot(L, H), a = Math.atan2(H, L);
  const steps = []; const sm = mat('#6e737e'), ym = mat('#e8c23a');
  const N = n + 6;
  for (let i = 0; i < N; i++) { const s = new THREE.Group(); const b = box(w, 0.06, run * 0.94, sm); s.add(b); const y = box(w, 0.012, 0.03, ym); y.position.set(0, 0.035, run * 0.45); s.add(y); g.add(s); steps.push(s); }
  const base = box(w + 0.1, 0.3, len, mat('#3a3e46')); base.rotation.x = a; base.position.set(0, H / 2 - 0.2, -L / 2); g.add(base);
  for (const sx of [-1, 1]) {
    const side = box(0.08, 0.85, len + 1.2, new THREE.MeshLambertMaterial({ color: '#c9d6e0', transparent: true, opacity: 0.55 })); side.rotation.x = a; side.position.set(sx * (w / 2 + 0.05), H / 2 + 0.5, -L / 2); g.add(side);
    const belt = box(0.1, 0.08, len + 1.2, mat('#1d1f24')); belt.rotation.x = a; belt.position.set(sx * (w / 2 + 0.05), H / 2 + 0.96, -L / 2); g.add(belt);
  }
  g.userData.flow = (t) => {
    steps.forEach((s, i) => {
      const u = ((i / N) + t * 0.05) % 1; const d = u * (L + 1.6) - 0.8;
      const y = d < 0 ? 0 : d > L ? H : d * H / L; s.position.set(0, y + 0.03, -d);
    });
  };
  g.userData.flow(0);
  return g;
}
function makeWallSet({ w = 8, h = 3.2, color = '#e9e2d4', floor = '#b48a5e' } = {}) {
  const g = new THREE.Group();
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, 6), mat(floor, { depthWrite: false })); fl.rotation.x = -Math.PI / 2; fl.position.z = 3; fl.renderOrder = -0.9; g.add(fl);
  const wl = box(w, h, 0.14, mat(color)); wl.position.set(0, h / 2, -0.07); g.add(wl);
  const bb = box(w, 0.1, 0.03, mat('#8a6a48')); bb.position.set(0, 0.05, 0.015); g.add(bb);
  return g;
}
function makeSink() {
  const g = new THREE.Group();
  const cab = box(1.2, 0.8, 0.55, mat('#f0eee8')); cab.position.set(0, 0.4, 0); g.add(cab);
  const top = box(1.26, 0.06, 0.6, mat('#fafafa')); top.position.set(0, 0.83, 0); g.add(top);
  const bowl = box(0.6, 0.04, 0.36, mat('#dfe6ee')); bowl.position.set(0, 0.865, 0.04); g.add(bowl);
  const tap = box(0.05, 0.22, 0.05, mat('#c8ccd4')); tap.position.set(0, 0.97, -0.2); g.add(tap);
  const sp = box(0.05, 0.04, 0.16, mat('#c8ccd4')); sp.position.set(0, 1.07, -0.13); g.add(sp);
  const mf = box(1.0, 1.0, 0.04, mat('#c9ccd2')); mf.position.set(0, 1.75, -0.27); g.add(mf);
  const mr = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), new THREE.MeshBasicMaterial({ color: '#a9c4d6' })); mr.position.set(0, 1.75, -0.245); g.add(mr);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.12, 10), mat('#7fc0e8')); cup.position.set(0.45, 0.92, -0.12); g.add(cup);
  return g;
}
function makeToothbrush() {
  const g = new THREE.Group(); const h = box(0.025, 0.2, 0.025, mat('#4aa8ff')); h.position.y = 0.06; g.add(h);
  const br = box(0.03, 0.05, 0.035, mat('#ffffff')); br.position.set(0, 0.17, 0.02); g.add(br); return g;
}
function makeBPMonitor() {
  const g = new THREE.Group();
  const b = box(1.3, 0.95, 0.5, mat('#f2f3f5')); b.position.y = 0.475; g.add(b);
  const c = document.createElement('canvas'); c.width = 512; c.height = 300; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.58), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 0.55, 0.255); g.add(scr);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 14), mat('#3480e6')); btn.rotation.x = Math.PI / 2; btn.position.set(0.45, 0.14, 0.26); g.add(btn);
  const cuff = box(0.9, 0.35, 0.3, mat('#3a4a6a')); cuff.position.set(-1.0, 0.18, 0.2); g.add(cuff);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), mat('#2a2e36')); tube.rotation.z = Math.PI / 2; tube.position.set(-0.6, 0.3, 0.2); g.add(tube);
  let key = '';
  g.userData.set = (a, b2 = '', col = '#1a2a3a') => {
    const k = a + '|' + b2 + col; if (k === key) return; key = k; const x = c.getContext('2d');
    x.fillStyle = '#c9e2d0'; x.fillRect(0, 0, 512, 300); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = FONT(44); x.fillText('上の血圧', 256, 52); x.font = FONT(150); x.fillText(a, 256, 175);
    if (b2) { x.font = FONT(42); x.fillText(b2, 256, 270); }
    tex.needsUpdate = true;
  };
  g.userData.set('—');
  return g;
}
// 1日の帯：朝〜夜の横長の帯に、全力の山を n 本立てる
function makeDayStrip({ w = 5, h = 1.4 } = {}) {
  const g = new THREE.Group(); const cw = 1024, ch = Math.round(cw * h / w);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); g.add(pl);
  const X = [0.24, 0.5, 0.8]; let key = '';
  g.userData.set = (n, k = 1) => {
    const kk = n + ':' + k.toFixed(2); if (kk === key) return; key = kk; const x = c.getContext('2d');
    x.clearRect(0, 0, cw, ch); x.fillStyle = 'rgba(20,24,34,.92)'; x.beginPath(); x.roundRect(4, 4, cw - 8, ch - 8, 28); x.fill();
    const base = ch * 0.78; x.strokeStyle = '#5a6070'; x.lineWidth = 6; x.beginPath(); x.moveTo(40, base); x.lineTo(cw - 40, base); x.stroke();
    x.fillStyle = '#9aa0ae'; x.font = FONT(40); x.textAlign = 'center'; x.textBaseline = 'middle';
    [['朝', 0.1], ['昼', 0.5], ['夜', 0.9]].forEach(([s, u]) => x.fillText(s, cw * u, ch * 0.9));
    x.fillStyle = '#4a5060'; for (let i = 0; i < 60; i++) { const u = 0.06 + i * 0.0148; const hh = 6 + ((i * 37) % 11); x.fillRect(cw * u, base - hh, 8, hh); }
    for (let i = 0; i < n; i++) { const kk2 = i < n - 1 ? 1 : k; const hh = ch * 0.6 * kk2; x.fillStyle = '#ff6a3a'; x.fillRect(cw * X[i] - 22, base - hh, 44, hh); x.fillStyle = '#ffd27a'; x.font = FONT(38); if (kk2 > 0.9) x.fillText('1分', cw * X[i], base - hh - 28); }
    tex.needsUpdate = true;
  };
  g.userData.set(0);
  return g;
}

export { addKnees, setThighHeat, fitReset, poseWallSit, poseOneLeg, poseRun, poseFastWalk, makeTimer, fmtMS, makeStairs, makeEscalator, makeWallSet, makeSink, makeToothbrush, makeBPMonitor, makeDayStrip };

// 字幕の時間割：plan = [[字幕, ショット関数(t, 長さ)], ...] を start〜end に、字数に合わせて並べる（1字0.148秒＋0.15秒が目安）
// 返り値 { subs, shots, at(i, dt) }。shot0 は 0〜最初の字幕、last は最後の字幕のあと（まとめカードの前まで）
function planTimes(plan, { start = 3.0, end = 61.6, gap = 0.1, shot0, card = 65.0, endCard, narr = {} } = {}) {
  // 読みの長さで重みをつける（META.narr の読みに置きかえて、漢字0.2秒・かなと記号0.115秒）
  const keys = Object.keys(narr).sort((a, b) => b.length - a.length);
  const cost = (s0) => { let s = s0.replace(/<br>/g, '').replace(/（[^）]*）/g, ''); for (const k of keys) s = s.split(k).join(narr[k]); let c = 0.15; for (const ch of s) c += /[\u4e00-\u9fff]/.test(ch) ? 0.2 : /[、。・，]/.test(ch) ? 0.16 : 0.115; return c; };
  const raw = plan.map(([s]) => Math.max(2.2, cost(s)));
  const k = (end - start - gap * (plan.length - 1)) / raw.reduce((a, b) => a + b, 0);
  const subs = [], shots = [{ a: 0, b: start, f: shot0 }]; let t = start;
  plan.forEach(([s, f], i) => {
    const last = i === plan.length - 1;
    const a = Math.round(t * 10) / 10, b = last ? end : Math.round((t + raw[i] * k) * 10) / 10;
    subs.push([a, b, s]); const nb = last ? end + 0.2 : Math.round((t + raw[i] * k + gap) * 10) / 10;
    const d = nb - a; shots.push({ a, b: nb, f: (tt) => f(tt, d) }); t = nb;
  });
  shots.push({ a: end + 0.2, b: card, f: endCard });
  return { subs, shots, k, at: (i, dt = 0) => Math.round((subs[i][0] + dt) * 100) / 100 };
}
export { planTimes };
