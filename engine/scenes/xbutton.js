import * as THREE from 'three';
import { mat, box, SKIN } from '../lib.js';
import { textSprite } from '../story.js';

// =====================================================
// XBUTTON：絶滅ボタンシリーズ共通の「赤い絶滅ボタン」（台・赤いキャップ・名札・押す手）
// どのシーンにも置ける。原点が台の底（ボタンの上面は y≈0.19）。大きさは scale で。
// API
//   makeXButton({ label: 'ハエ絶滅ボタン', sleeve: '#4fa3d1' }) → Group
//     .userData.press(k)   0..1 でキャップが沈む
//     .userData.hand(k)    0 = 手が画面外の上、1 = 押している
//     .userData.labelOn(on) 名札の表示
//     .userData.top        ボタン上面のローカル座標（Vector3）
//   xCountdown(left) → '0:01.40' 形式の文字（setHud の mono 表示用）
//   xHook(t, TP)         { press, hand } … TP 秒に押す標準のタイミング（押す0.35秒前から手が下りる）
// =====================================================
function makeXButton({ label = '絶滅ボタン', sleeve = '#4fa3d1' } = {}) {
  const g = new THREE.Group();
  const base = box(0.42, 0.1, 0.42, mat('#2a2d33')); base.position.y = 0.05; g.add(base);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.03, 24), mat('#f2c230')); ring.position.y = 0.112; g.add(ring);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.09, 24), mat('#e0352b', { emissive: 0x5a0a06, emissiveIntensity: 0.55 })); cap.castShadow = true; g.add(cap);
  const lab = textSprite(label, { w: 768, h: 128, size: 64, bg: 'rgba(20,22,28,.85)', sx: 0.95 }); lab.position.set(0, 0.5, 0); g.add(lab);
  const hand = new THREE.Group(); g.add(hand);
  { const sl = box(0.16, 0.7, 0.16, mat(sleeve)); sl.position.y = 0.45; hand.add(sl); const h = box(0.13, 0.16, 0.15, mat(SKIN[0])); h.position.y = 0.05; hand.add(h); const f = box(0.04, 0.09, 0.04, mat(SKIN[0])); f.position.y = -0.06; hand.add(f); }
  hand.rotation.z = -0.35;
  g.userData.press = (k) => { cap.position.y = 0.145 - 0.05 * k; };
  g.userData.hand = (k) => { hand.visible = k > 0.01; hand.position.set(0.05 + (1 - k) * 0.45, 0.24 + (1 - k) * 0.9, 0.02); };
  g.userData.labelOn = (on) => { lab.visible = on; };
  g.userData.top = new THREE.Vector3(0, 0.19, 0);
  g.userData.press(0); g.userData.hand(0);
  return g;
}
const xCountdown = (left) => { left = Math.max(0, left) + 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
function xHook(t, TP) {
  const c = (x) => Math.max(0, Math.min(1, x));
  const p = c((t - (TP - 0.35)) / 0.35);
  const e = p * p * (3 - 2 * p);
  return { press: t < TP ? p : c(1 - (t - TP - 0.2) / 0.3), hand: t < TP ? e : c(1 - (t - TP - 0.25) / 0.5) };
}

export { makeXButton, xCountdown, xHook };
