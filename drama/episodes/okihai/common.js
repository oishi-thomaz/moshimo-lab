// 置き配 の共通部品：人物・表紙（第◯話を大きく）・エンドカード・見出しチップ
import { W, H, clamp, lerp, inv, ease, easeOut, back, noise1, rr, fillRR, circ, vgrad, glow, rgba, text, poly, FONT, SERIF, cam } from '../../engine/core.js';
import { C, close, speedLines } from '../../engine/noir.js';
import { phoneFrame } from '../../engine/sns.js';
import { O, OP, cardboard, topPhoto, print, waybill } from '../../engine/okihaisets.js';

// この作品の差し色（伝票の赤）
C.red = O.red;

export const P = OP;

export const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
export const bg = (g, a = '#0c1424', b = '#141c2e') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
export const slow = (lt, D, a = 1, b = 1.08) => lerp(a, b, ease(clamp(lt / Math.max(D, 0.1))));
// 字幕の下地（明るい絵の上で字幕を読みやすく）
export const subBand = (g, a = 1) => { if (a <= 0) return; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; vgrad(g, 0, 1130, W, 340, [[0, 'rgba(6,8,14,0)'], [0.22, 'rgba(6,8,14,.86)'], [0.78, 'rgba(6,8,14,.86)'], [1, 'rgba(6,8,14,0)']]); g.restore(); };
export function chip(g, s, a) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 70;
  fillRR(g, 540 - w / 2, 120, w, 80, 40, 'rgba(10,12,18,.88)'); g.lineWidth = 3; g.strokeStyle = rgba(O.red, 0.9); rr(g, 540 - w / 2, 120, w, 80, 40); g.stroke();
  text(g, s, 540, 162, { size: 40, color: '#f1f3f8' }); g.restore();
}
export const heads = list => (g, t, { at }) => { for (const [id, s, d] of list) { const t0 = at(id); chip(g, s, Math.min(inv(t0, t0 + 0.3, t), 1 - inv(t0 + d, t0 + d + 0.4, t))); } };

// 作品タイトル「置き配」（「配」だけ伝票の赤）
export function seriesTitle(g, x, y, size, alpha = 1, gl = 0) {
  g.save(); g.globalAlpha = alpha; g.font = `900 ${size}px "Noto Sans CJK JP", sans-serif`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const a = '置き', b = '配', wa = g.measureText(a).width, wb = g.measureText(b).width, x0 = x - (wa + wb) / 2;
  g.textAlign = 'left'; g.lineWidth = size * 0.13; g.strokeStyle = '#05060a';
  g.strokeText(a, x0, y); g.strokeText(b, x0 + wa, y);
  g.fillStyle = '#f4f2ee'; g.fillText(a, x0, y);
  if (gl) { g.fillStyle = rgba(O.red, 0.6); g.fillText(b, x0 + wa - gl, y); }
  g.fillStyle = O.red2; g.fillText(b, x0 + wa + gl, y);
  g.restore();
}
// 表紙。back=背景、face=中央の顔
export function cover(g, lt, { no, title, back: drawBack, face }) {
  const k = easeOut(inv(0, 0.3, lt)), gl = lt < 0.35 ? noise1(lt * 60, 3) * 14 : 0;
  drawBack(g);
  vgrad(g, 0, 0, W, H, [[0, 'rgba(4,5,9,.92)'], [0.3, 'rgba(4,5,9,.5)'], [0.6, 'rgba(4,5,9,.35)'], [1, 'rgba(4,5,9,.93)']]);
  // 両脇：段ボールと寝顔の写真
  g.save(); g.globalAlpha = k;
  cardboard(g, 210, 1720, 0.85, { tilt: -0.06, to: '相沢ミオ 様' });
  print(g, 860, 1520, 300, 225, (q, w, h) => topPhoto(q, w, h, { stamp: true }), { rot: 0.12 });
  g.restore();
  glow(g, 540, 820, 760, 'rgba(216,52,63,1)', 0.16 * k);
  g.save(); g.globalAlpha = k; face(g); g.restore();
  vgrad(g, 0, 1250, W, 200, [[0, 'rgba(4,5,9,.6)'], [1, 'rgba(4,5,9,0)']]);
  seriesTitle(g, 540, 560, 190, k, gl);
  const b = easeOut(inv(0.15, 0.5, lt)), sc = lerp(1.3, 1, back(b)), label = no === 5 ? '最終話' : `第${no}話`;
  g.save(); g.translate(540, 840); g.scale(sc, sc); g.globalAlpha = b;
  g.font = `900 ${no === 5 ? 270 : 300}px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 30; g.strokeStyle = '#05060a'; g.strokeText(label, 0, 0); g.fillStyle = O.red2; g.fillText(label, 0, 0); g.restore();
  const c = easeOut(inv(0.35, 0.7, lt));
  g.save(); g.globalAlpha = c; g.font = `800 82px ${FONT}`; const tw = Math.max(640, g.measureText(title).width + 120);
  fillRR(g, 540 - tw / 2, 1030, tw, 116, 14, '#f4f2ee'); text(g, title, 540, 1090, { size: 82, color: '#0a0a0e', weight: 800 });
  const pl = no === 5 ? '第5話 ／ 全5話' : '全5話'; g.font = `800 32px ${FONT}`; const pw = g.measureText(pl).width + 70;
  fillRR(g, 540 - pw / 2, 1166, pw, 52, 26, O.red); text(g, pl, 540, 1193, { size: 32, color: '#fff', weight: 800, spacing: 4 }); g.restore();
}
// エンドカード（次回予告）
export function endCard(g, lt, { SERIES, EPISODE }) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#06070b'], [1, '#0d1018']]);
  const a = easeOut(inv(0.1, 0.5, lt));
  if (!EPISODE.next) {
    seriesTitle(g, 540, 560, 130, a);
    const b = easeOut(inv(0.6, 1.1, lt));
    poly(g, [[300, 670], [780, 650], [782, 660], [302, 682]], rgba(O.red, b));
    text(g, '完', 540, 820, { size: 180, color: '#f4f2ee', weight: 900, alpha: b, font: SERIF });
    const c = easeOut(inv(1.5, 2.0, lt));
    g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 990, w, 90, 45, O.red); text(g, EPISODE.ask, 540, 1036, { size: 38, color: '#fff' }); g.restore();
    const d = easeOut(inv(2.2, 2.6, lt));
    text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f2ee', alpha: d, spacing: 8 });
    text(g, '全5話　ご覧いただきありがとうございました', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
    return;
  }
  seriesTitle(g, 540, 470, 90, a * 0.9);
  text(g, `第${EPISODE.no}話「${EPISODE.title}」終`, 540, 580, { size: 42, color: '#c9ccd6', alpha: a });
  const b = easeOut(inv(0.6, 1.1, lt));
  poly(g, [[300, 650], [780, 630], [782, 640], [302, 662]], rgba(O.red, b));
  const nx = EPISODE.no + 1;
  text(g, nx === 5 ? '次回　最終話' : '次回', 540, 730, { size: 40, color: O.red2, alpha: b });
  text(g, `第${nx}話　${EPISODE.next}`, 540, 840, { size: 92, color: '#f4f2ee', weight: 900, alpha: b, spacing: 4 });
  const c = easeOut(inv(1.5, 2.0, lt));
  g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 960, w, 90, 45, O.red); text(g, EPISODE.ask, 540, 1006, { size: 38, color: '#fff' }); g.restore();
  const d = easeOut(inv(2.2, 2.6, lt));
  text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f2ee', alpha: d, spacing: 8 });
  text(g, 'フォローして続きを待ってて', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
}

// ===== 各話で使うショットの型 =====
// ミオの顔のアップ。night=1 夜（下からスマホの光）、0 朝（窓の光）。back＝背景を差しかえる
export function mioFace(g, lt, D, S, ids = [], o = {}) {
  const night = o.night ?? 1;
  if (o.back) o.back(g); else if (night) bg(g, '#141c30', '#0a0f1c'); else bg(g, '#aaa69d', '#7d796f');
  if (!o.back) glow(g, 880, 470, 560, night ? 'rgba(120,150,230,1)' : 'rgba(255,246,226,1)', night ? 0.16 : 0.4);
  const tk = talking(lt, S, ids);
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06), sx: o.sx || 0 });
  close(g, P.mio, { y: 630, s: 4.0, talk: tk * 0.5, lightFrom: night ? 'left' : 'right', phoneLight: night && o.phoneLight !== false, ...o });
  g.restore();
}
export function mioShock(g, lt, D, o = {}) {
  const night = o.night ?? 1;
  night ? bg(g, '#121a2c', '#070b14') : bg(g, '#9a968d', '#6d695f');
  speedLines(g, 540, 760, { inner: 470, t: lt, color: night ? 'rgba(220,230,255,.14)' : 'rgba(255,255,255,.3)' });
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, 1.0, 1.1) });
  close(g, P.mio, { y: 680, s: 4.0, eyes: 'wide', brow: -0.6, mouth: 'line', lightFrom: night ? 'left' : 'right', phoneLight: !!night, ...o });
  g.restore();
}
// 人物の顔のアップ（ほかの人）。who＝P のキー
export function faceOf(g, lt, D, S, who, ids = [], o = {}) {
  if (o.back) o.back(g); else bg(g, o.a || '#b4b2ac', o.b || '#86847e');
  const tk = talking(lt, S, ids);
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  close(g, P[who], { y: 640, s: 3.8, talk: tk * 0.5, lightFrom: 'right', ...o });
  g.restore();
}
// スマホの画面
export const phoneShot = (g, lt, D, draw, o = {}) => { bg(g, '#0c0f18', '#06080d'); g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.04) }); phoneFrame(g, 140, 80, 800, 1100, draw, { rot: o.rot || 0 }); g.restore(); };
// 写真（紙焼き）の寄り。p＝topPhoto の設定。fx,fy＝寄る先
export function photoShot(g, lt, D, p = {}, o = {}) {
  bg(g, '#14110e', '#0a0908');
  g.save(); cam(g, { x: o.fx ?? 540, y: o.fy ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06), r: o.r || 0 });
  print(g, 540, 640, 960, 720, (q, w, h) => topPhoto(q, w, h, { t: lt, ...p }), { rot: o.rot ?? -0.02 });
  g.restore();
}
// 伝票の寄り
export function billShot(g, lt, D, b = {}, o = {}) {
  bg(g, '#2a1e14', '#140e0a');
  g.save(); cam(g, { x: o.fx ?? 540, y: o.fy ?? 900, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.08) });
  g.save(); g.translate(40, 250); waybill(g, 1000, 700, b); g.restore();
  g.restore();
}
// 段ボールの寄り（玄関の床）
export function boxShot(g, lt, D, o = {}) {
  bg(g, o.night ? '#141a26' : '#6e6a64', o.night ? '#0a0d14' : '#45423d');
  vgrad(g, -300, 1200, W + 600, 900, [[0, o.night ? '#1c2230' : '#8a867e'], [1, o.night ? '#0c0f16' : '#5a5650']]);
  g.save(); cam(g, { x: 540, y: o.cy ?? 900, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.08) });
  cardboard(g, 540, 1180, 2.3, { open: o.open ?? 0, to: o.to ?? '相沢ミオ 様' });
  g.restore();
}
