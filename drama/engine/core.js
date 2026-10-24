// いつわ劇場 — 2Dイラスト描画の共通部品
export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export const easeOut = k => 1 - Math.pow(1 - k, 3);
export const easeIn = k => k * k * k;
export const back = k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const ss = (a, b, x) => { const k = inv(a, b, x); return k * k * (3 - 2 * k); };
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export function noise1(t, seed = 0) { // なめらかな1次元ノイズ（-1..1）
  const f = Math.floor(t), k = t - f, h = n => { const x = Math.sin((n + seed * 101.3) * 127.1) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
  const u = k * k * (3 - 2 * k); return lerp(h(f), h(f + 1), u);
}

export function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function fillRR(g, x, y, w, h, r, c) { rr(g, x, y, w, h, r); g.fillStyle = c; g.fill(); }
export function circ(g, x, y, r, c) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); g.fillStyle = c; g.fill(); }
export function ell(g, x, y, rx, ry, c, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); g.fillStyle = c; g.fill(); }
export function poly(g, pts, c) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = c; g.fill(); }
export function line(g, x1, y1, x2, y2, w, c, cap = 'round') { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineWidth = w; g.strokeStyle = c; g.lineCap = cap; g.stroke(); }
export function vgrad(g, x, y, w, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(x, y, w, h); }
export function glow(g, x, y, r, color, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
export function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
export function mix(h1, h2, k) { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const c = s => Math.round(lerp((a >> s) & 255, (b >> s) & 255, k)); return `rgb(${c(16)},${c(8)},${c(0)})`; }

// カメラ：画面中央を基準に寄る・パン・回す
export function cam(g, { x = 540, y = 960, z = 1, r = 0, sx = 0, sy = 0 } = {}) {
  g.translate(540 + sx, 960 + sy); g.rotate(r); g.scale(z, z); g.translate(-x, -y);
}
export function shake(t, amp, seed = 3) { return { sx: noise1(t * 9, seed) * amp, sy: noise1(t * 11, seed + 7) * amp * 0.7, r: noise1(t * 5, seed + 3) * amp * 0.0009 }; }

// 暗がり＋光：dark（0..1）の暗い層を重ね、lights で穴をあけて色を足す
const off = document.createElement('canvas'); off.width = W; off.height = H; const og = off.getContext('2d');
export function darkness(g, alpha, color = '#05070d', lights = []) {
  og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, W, H);
  og.globalAlpha = 1; og.fillStyle = color; og.fillRect(0, 0, W, H);
  og.globalCompositeOperation = 'destination-out';
  for (const L of lights) {
    const gr = og.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
    gr.addColorStop(0, `rgba(0,0,0,${L.a ?? 1})`); gr.addColorStop(L.core ?? 0.35, `rgba(0,0,0,${(L.a ?? 1) * 0.8})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    og.fillStyle = gr;
    if (L.cone) { og.save(); og.beginPath(); og.moveTo(L.cx, L.cy); og.arc(L.cx, L.cy, L.r * 2.2, L.ang - L.cone, L.ang + L.cone); og.closePath(); og.clip(); og.fillRect(0, 0, W, H); og.restore(); }
    else og.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alpha; g.drawImage(off, 0, 0); g.restore();
  for (const L of lights) if (L.color) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); glow(g, L.x, L.y, L.r * 0.9, L.color, (L.glow ?? 0.35) * alpha); g.restore(); }
}

// 紙の質感（全画面に薄く重ねる）
const grain = document.createElement('canvas'); grain.width = 540; grain.height = 960;
{ const gg = grain.getContext('2d'); const im = gg.createImageData(540, 960); const R = rng(7); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (R() - 0.5) * 90; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } gg.putImageData(im, 0, 0); }
export function finish(g, { vignette = 0.42, grainA = 0.07, tint = null } = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  g.globalAlpha = grainA; g.globalCompositeOperation = 'overlay'; g.drawImage(grain, 0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const gr = g.createRadialGradient(540, 900, 380, 540, 960, 1250); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${vignette})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
}

// 文字（日本語・丸ゴシック）
export const FONT = '"M PLUS Rounded 1c", "Noto Sans CJK JP", sans-serif';
export const SERIF = '"Noto Serif CJK JP", serif';
export function text(g, s, x, y, { size = 40, color = '#fff', weight = 800, align = 'center', font = FONT, stroke = null, sw = 8, base = 'middle', alpha = 1, spacing = 0 } = {}) {
  g.save(); g.globalAlpha *= alpha; g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.textBaseline = base;
  if (spacing) g.letterSpacing = `${spacing}px`;
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = sw; g.strokeStyle = stroke; g.strokeText(s, x, y); }
  g.fillStyle = color; g.fillText(s, x, y); g.restore();
}
// 小さなラベル（図解・名札用）
export function tag(g, s, x, y, { size = 34, bg = '#f6efe2', color = '#2a2a33', pad = 18, alpha = 1, r = 999 } = {}) {
  g.save(); g.globalAlpha *= alpha; g.font = `800 ${size}px ${FONT}`; const w = g.measureText(s).width + pad * 2, h = size + pad * 1.1;
  g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 12; g.shadowOffsetY = 4;
  fillRR(g, x - w / 2, y - h / 2, w, h, Math.min(r, h / 2), bg); g.shadowColor = 'transparent';
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y + 1); g.restore();
  return w;
}
