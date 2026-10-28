// 女性の髪（二人の息子から）：ヘルメットっぽく見えないよう、毛先を細く、前髪は流して、つやと毛の筋を入れる
// P.hair = 'bob2' | 'long2' | 'bun2' | 'pony2'
import { ell, circ } from './core.js';

const lighten = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = s => Math.round(((n >> s) & 255) + (255 - ((n >> s) & 255)) * k); return `rgb(${c(16)},${c(8)},${c(0)})`; };
const darken = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = s => Math.round(((n >> s) & 255) * (1 - k)); return `rgb(${c(16)},${c(8)},${c(0)})`; };
export const isHair2 = P => /2$/.test(P.hair || '');

// 後ろ髪（顔より先に描く）
export function hairBack2(g, x, y, r, P, t = 0) {
  const c = darken(P.hairC, 0.18), h = P.hair, sw = Math.sin(t * 1.3) * r * 0.03;
  g.fillStyle = c; g.beginPath();
  if (h === 'bob2') {
    // あごの少し下で内に入る丸み
    g.moveTo(x - r * 0.9, y - r * 0.9);
    g.bezierCurveTo(x - r * 1.35, y - r * 0.2, x - r * 1.3, y + r * 0.75, x - r * 1.02, y + r * 1.02);
    g.quadraticCurveTo(x - r * 0.85, y + r * 1.12, x - r * 0.7, y + r * 0.98);
    g.lineTo(x + r * 0.7, y + r * 0.98);
    g.quadraticCurveTo(x + r * 0.85, y + r * 1.12, x + r * 1.02, y + r * 1.02);
    g.bezierCurveTo(x + r * 1.3, y + r * 0.75, x + r * 1.35, y - r * 0.2, x + r * 0.9, y - r * 0.9);
    g.closePath(); g.fill();
  } else if (h === 'long2') {
    // 胸まで。毛先は細く、少し波打つ
    g.moveTo(x - r * 0.9, y - r * 0.9);
    g.bezierCurveTo(x - r * 1.35, y - r * 0.1, x - r * 1.25 + sw, y + r * 1.4, x - r * 1.2 + sw, y + r * 2.2);
    g.lineTo(x - r * 1.1 + sw, y + r * 2.15); g.lineTo(x - r * 0.95 + sw, y + r * 2.4); g.lineTo(x - r * 0.8, y + r * 2.1);
    g.lineTo(x + r * 0.8, y + r * 2.1); g.lineTo(x + r * 0.95 - sw, y + r * 2.4); g.lineTo(x + r * 1.1 - sw, y + r * 2.15);
    g.lineTo(x + r * 1.2 - sw, y + r * 2.2);
    g.bezierCurveTo(x + r * 1.25 - sw, y + r * 1.4, x + r * 1.35, y - r * 0.1, x + r * 0.9, y - r * 0.9);
    g.closePath(); g.fill();
  } else if (h === 'bun2') {
    // 低い位置のおだんご（横から少しのぞく）
    g.closePath(); circ(g, x + r * 0.95, y - r * 0.15, r * 0.36, c); ell(g, x + r * 0.95, y - r * 0.15, r * 0.36, r * 0.08, darken(P.hairC, 0.35));
  } else if (h === 'pony2') {
    g.closePath();
    g.save(); g.translate(x + r * 0.85, y - r * 0.75); g.rotate(0.45 + Math.sin(t * 2) * 0.06);
    g.beginPath(); g.moveTo(-r * 0.18, 0); g.bezierCurveTo(-r * 0.35, r * 0.6, -r * 0.1, r * 1.2, r * 0.05, r * 1.5); g.bezierCurveTo(r * 0.25, r * 1.1, r * 0.3, r * 0.5, r * 0.18, 0); g.closePath(); g.fillStyle = c; g.fill();
    g.restore();
  }
}

// 前髪・頭頂（顔のあとに描く）
function frontPath(g, x, y, r, h, tt) {
  g.beginPath(); g.moveTo(x - r * 1.0, y - r * 0.05);
  g.bezierCurveTo(x - r * 1.12, y - r * 1.05, x - r * 0.5 + tt, y - r * 1.32, x + tt, y - r * 1.3);
  g.bezierCurveTo(x + r * 0.5 + tt, y - r * 1.32, x + r * 1.12, y - r * 1.05, x + r * 1.0, y - r * 0.05);
  if (h === 'bun2') {
    // 前髪なし。真ん中分けでなでつけ、生え際は額の上
    g.quadraticCurveTo(x + r * 0.9, y - r * 0.45, x + r * 0.62, y - r * 0.6);
    g.quadraticCurveTo(x + r * 0.3 + tt, y - r * 0.7, x + r * 0.08 + tt, y - r * 0.66);
    g.lineTo(x - r * 0.02 + tt, y - r * 0.74);
    g.quadraticCurveTo(x - r * 0.35 + tt, y - r * 0.7, x - r * 0.62, y - r * 0.6);
    g.quadraticCurveTo(x - r * 0.9, y - r * 0.45, x - r * 1.0, y - r * 0.05);
  } else {
    // 流した前髪：分け目は少し右。右は短く、左へ2房
    const px = x + r * 0.3 + tt;
    g.quadraticCurveTo(x + r * 0.98, y - r * 0.35, x + r * 0.82, y - r * 0.42);
    g.quadraticCurveTo(px + r * 0.35, y - r * 0.5, px + r * 0.05, y - r * 0.62); // 右の短い房
    g.lineTo(px - r * 0.05, y - r * 0.7); // 分け目
    g.quadraticCurveTo(px - r * 0.3, y - r * 0.45, px - r * 0.5, y - r * 0.26); // 1房目の毛先
    g.quadraticCurveTo(px - r * 0.56, y - r * 0.42, px - r * 0.7, y - r * 0.45);
    g.quadraticCurveTo(px - r * 0.86, y - r * 0.33, px - r * 0.98, y - r * 0.16); // 2房目の毛先
    g.quadraticCurveTo(px - r * 1.08, y - r * 0.32, x - r * 0.98, y - r * 0.3);
    g.quadraticCurveTo(x - r * 1.02, y - r * 0.2, x - r * 1.0, y - r * 0.05);
  }
  g.closePath();
}
export function hairFront2(g, x, y, r, P, turn = 0) {
  const c = P.hairC, h = P.hair, tt = turn * r * 0.25;
  const hi = lighten(c, 0.22), dk = darken(c, 0.3);
  g.save();
  frontPath(g, x, y, r, h, tt); g.fillStyle = c; g.fill();
  // つや・毛の筋・白髪は髪の形の中だけ
  g.save(); frontPath(g, x, y, r, h, tt); g.clip();
  g.lineWidth = r * 0.09; g.strokeStyle = hi; g.globalAlpha = 0.5; g.lineCap = 'round';
  g.beginPath(); g.arc(x - r * 0.1 + tt, y - r * 0.3, r * 0.82, Math.PI * 1.2, Math.PI * 1.42); g.stroke();
  g.globalAlpha = 0.3; g.lineWidth = r * 0.022; g.strokeStyle = dk;
  for (const [a, b] of [[-0.5, -0.75], [-0.15, -0.35], [0.6, 0.8], [0.8, 0.95]]) { g.beginPath(); g.moveTo(x + a * r + tt, y - r * 1.22); g.quadraticCurveTo(x + (a + b) * 0.5 * r + tt, y - r * 0.95, x + b * r + tt, y - r * 0.6); g.stroke(); }
  if (P.grey) { g.globalAlpha = 0.45; g.lineWidth = r * 0.022; g.strokeStyle = '#bdb6af'; for (const a of [-0.7, -0.38, 0.32, 0.62]) { g.beginPath(); g.moveTo(x + a * 0.3 * r + tt, y - r * 1.25); g.quadraticCurveTo(x + a * 0.8 * r, y - r * 0.95, x + a * 1.25 * r, y - r * 0.5); g.stroke(); } }
  g.restore();
  // 顔の横の髪
  if (h === 'bun2') {
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * r * 0.95, y - r * 0.3); g.quadraticCurveTo(x + s * r * 1.04, y - r * 0.05, x + s * r * 0.97, y + r * 0.1); g.quadraticCurveTo(x + s * r * 0.92, y - r * 0.08, x + s * r * 0.86, y - r * 0.2); g.closePath(); g.fillStyle = c; g.fill(); }
  } else {
    const len = h === 'pony2' ? 0.35 : h === 'bob2' ? 0.85 : 1.15;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(x + s * r * 1.0, y - r * 0.35);
      g.bezierCurveTo(x + s * r * 1.08, y + r * 0.1, x + s * r * 1.02, y + r * (len - 0.2), x + s * r * 0.88, y + r * len);
      g.bezierCurveTo(x + s * r * 0.9, y + r * (len - 0.35), x + s * r * 0.88, y - r * 0.05, x + s * r * 0.84, y - r * 0.3);
      g.closePath(); g.fillStyle = c; g.fill();
    }
  }
  g.restore();
}
