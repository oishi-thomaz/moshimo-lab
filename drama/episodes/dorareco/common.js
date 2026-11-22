// ドラレコ の共通部品：人物・表紙（第◯話を大きく）・エンドカード・見出しチップ・よく使う画面
import { W, H, clamp, lerp, inv, ease, easeOut, back, noise1, rr, fillRR, circ, vgrad, glow, rgba, text, poly, FONT, SERIF, cam } from '../../engine/core.js';
import { C, close } from '../../engine/noir.js';
import { phoneFrame } from '../../engine/sns.js';
import { D, camView, driver, rearSeat } from '../../engine/dorasets.js';

// この作品の差し色（車内カメラの REC の赤）
C.red = D.rec;

export const P = {
  shoji: { hair: 'parted', hairC: '#3a3632', top: '#26324a', top2: '#1e283c', bottom: '#2a2e38', shoes: '#111', tall: 1.0 },
  yuki: { hair: 'long2', hairC: '#1c1618', top: '#2e2a2e', top2: '#242026', bottom: '#2a2a30', shoes: '#ddd', tall: 0.95, female: true },
  haruna: { hair: 'bob2', hairC: '#4a3226', top: '#d9c8b4', top2: '#c4b29c', bottom: '#4a4a58', shoes: '#ddd', tall: 0.93, female: true },
};

export const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
export const bg = (g, a = '#0a0b10', b = '#121419') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
export const slow = (lt, D0, a = 1, b = 1.08) => lerp(a, b, ease(clamp(lt / Math.max(D0, 0.1))));
export function chip(g, s, a) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 70;
  fillRR(g, 540 - w / 2, 210, w, 80, 40, 'rgba(10,12,18,.88)'); g.lineWidth = 3; g.strokeStyle = rgba(D.rec, 0.85); rr(g, 540 - w / 2, 210, w, 80, 40); g.stroke();
  text(g, s, 540, 252, { size: 40, color: '#f1f3f8' }); g.restore();
}
export const heads = list => (g, t, { at }) => { for (const [id, s, d] of list) { const t0 = at(id); chip(g, s, Math.min(inv(t0, t0 + 0.3, t), 1 - inv(t0 + d, t0 + d + 0.4, t))); } };
// 字幕の下地（寄りの画面で字幕が絵と重なるとき）
export const subBand = (g, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha = a; vgrad(g, 0, 1140, W, 330, [[0, 'rgba(8,9,14,0)'], [0.2, 'rgba(8,9,14,.9)'], [0.75, 'rgba(8,9,14,.9)'], [1, 'rgba(8,9,14,0)']]); g.restore(); };

// スマホの画面
export const phone = (g, lt, D0, draw, o = {}) => { bg(g); g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D0, o.z0 ?? 1.0, o.z1 ?? 1.04) }); phoneFrame(g, 140, 80, 800, 1000, draw, { rot: o.rot || 0 }); g.restore(); };
// 車内カメラの画面いっぱい（字幕より上）
export const camS = (g, lt, D0, o = {}) => {
  bg(g, '#040506', '#08090b');
  g.save(); cam(g, { x: o.cx ?? 540, y: o.cy ?? 960, z: slow(lt, D0, o.z0 ?? 1.0, o.z1 ?? 1.05) });
  camView(g, 40, 80, 1000, 1100, { t: lt + (o.t0 || 0), P, ...o });
  g.restore();
};
// 運転席の横顔
export const shojiS = (g, lt, D0, S, ids = [], o = {}) => {
  const tk = ids.length ? talking(lt, S, ids) : 0;
  g.save(); cam(g, { x: 540, y: 820, z: slow(lt, D0, o.z0 ?? 1.0, o.z1 ?? 1.05) }); driver(g, P.shoji, { t: lt + (o.t0 || 0), talk: tk * 0.5, eyes: 'narrow', mouth: 'line', ...o }); g.restore();
};
// 後ろの席のユキ（振り返って）
export const yukiS = (g, lt, D0, S, ids = [], o = {}) => {
  const tk = ids.length ? talking(lt, S, ids) : 0;
  g.save(); cam(g, { x: o.cx ?? 640, y: o.cy ?? 760, z: slow(lt, D0, o.z0 ?? 1.1, o.z1 ?? 1.16) }); rearSeat(g, { t: lt, who: P.yuki, o: { eyes: 'normal', brow: -0.3, mouth: 'line', look: -0.6, talk: tk * 0.5, ...o } }); g.restore();
};

// 作品タイトル「ドラレコ」（前に赤い REC の点）
export function seriesTitle(g, x, y, size, alpha = 1, gl = 0) {
  g.save(); g.globalAlpha = alpha; g.font = `900 ${size}px "Noto Sans CJK JP", sans-serif`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const s = 'ドラレコ', w = g.measureText(s).width, dot = size * 0.2, x0 = x - (w + dot * 2.6) / 2 + dot * 2.6;
  circ(g, x0 - dot * 1.6, y, dot, D.rec); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x0 - dot * 1.6, y, dot * 4, 'rgba(255,60,60,1)', 0.6 * alpha); g.restore();
  g.textAlign = 'left'; g.lineWidth = size * 0.13; g.strokeStyle = '#05060a'; g.strokeText(s, x0, y);
  if (gl) { g.fillStyle = rgba(D.rec, 0.6); g.fillText(s, x0 - gl, y); }
  g.fillStyle = '#f4f6f8'; g.fillText(s, x0 + gl, y);
  g.restore();
}
// 表紙。back=背景、face=中央の顔
export function cover(g, lt, { no, title, back: drawBack, face: drawFace }) {
  const k = easeOut(inv(0, 0.3, lt)), gl = lt < 0.35 ? noise1(lt * 60, 3) * 14 : 0;
  drawBack(g);
  vgrad(g, 0, 0, W, H, [[0, 'rgba(4,5,8,.92)'], [0.3, 'rgba(4,5,8,.5)'], [0.6, 'rgba(4,5,8,.35)'], [1, 'rgba(4,5,8,.93)']]);
  glow(g, 540, 820, 760, 'rgba(255,80,70,1)', 0.12 * k);
  g.save(); g.globalAlpha = k; drawFace(g); g.restore();
  vgrad(g, 0, 1250, W, 200, [[0, 'rgba(4,5,8,.6)'], [1, 'rgba(4,5,8,0)']]);
  seriesTitle(g, 540, 560, 170, k, gl);
  const b = easeOut(inv(0.15, 0.5, lt)), sc = lerp(1.3, 1, back(b)), label = no === 5 ? '最終話' : `第${no}話`;
  g.save(); g.translate(540, 840); g.scale(sc, sc); g.globalAlpha = b;
  g.font = `900 ${no === 5 ? 270 : 300}px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 30; g.strokeStyle = '#05060a'; g.strokeText(label, 0, 0); g.fillStyle = D.rec; g.fillText(label, 0, 0); g.restore();
  const c = easeOut(inv(0.35, 0.7, lt));
  g.save(); g.globalAlpha = c; g.font = `800 82px ${FONT}`; const tw = Math.max(640, g.measureText(title).width + 120);
  fillRR(g, 540 - tw / 2, 1030, tw, 116, 14, '#f4f6f8'); text(g, title, 540, 1090, { size: 82, color: '#0a0a0e', weight: 800 });
  const pl = no === 5 ? '第5話 ／ 全5話' : '全5話'; g.font = `800 32px ${FONT}`; const pw = g.measureText(pl).width + 70;
  fillRR(g, 540 - pw / 2, 1166, pw, 52, 26, D.rec); text(g, pl, 540, 1193, { size: 32, color: '#fff', weight: 800, spacing: 4 }); g.restore();
}
// 表紙の背景（車内カメラ：足もとの女）と顔（ショウジ）
export const coverBack = (o = {}) => g2 => { camView(g2, -60, 1180, 1200, 760, { t: 3, P, woman: 'floor', ...o }); };
export const coverFace = (o = {}) => g2 => close(g2, P.shoji, { y: 1500, s: 2.6, eyes: 'wide', brow: -0.5, mouth: 'line', lightFrom: 'right', ...o });

// エンドカード（次回予告）
export function endCard(g, lt, { SERIES, EPISODE }) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#06070a'], [1, '#0e1016']]);
  const a = easeOut(inv(0.1, 0.5, lt));
  if (!EPISODE.next) {
    seriesTitle(g, 540, 560, 120, a);
    const b = easeOut(inv(0.6, 1.1, lt));
    poly(g, [[300, 660], [780, 640], [782, 650], [302, 672]], rgba(D.rec, b));
    text(g, '完', 540, 820, { size: 180, color: '#f4f6f8', weight: 900, alpha: b, font: SERIF });
    const c = easeOut(inv(1.5, 2.0, lt));
    g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 990, w, 90, 45, D.rec); text(g, EPISODE.ask, 540, 1036, { size: 38, color: '#fff' }); g.restore();
    const d = easeOut(inv(2.2, 2.6, lt));
    text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f6f8', alpha: d, spacing: 8 });
    text(g, '全5話　ご覧いただきありがとうございました', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
    return;
  }
  seriesTitle(g, 540, 470, 80, a * 0.85);
  text(g, `第${EPISODE.no}話「${EPISODE.title}」終`, 540, 570, { size: 42, color: '#c9ccd6', alpha: a });
  const b = easeOut(inv(0.6, 1.1, lt));
  poly(g, [[300, 650], [780, 630], [782, 640], [302, 662]], rgba(D.rec, b));
  const nx = EPISODE.no + 1;
  text(g, nx === 5 ? '次回　最終話' : '次回', 540, 730, { size: 40, color: D.rec2, alpha: b });
  text(g, `第${nx}話　${EPISODE.next}`, 540, 840, { size: EPISODE.next.length > 5 ? 80 : 92, color: '#f4f6f8', weight: 900, alpha: b, spacing: 4 });
  const c = easeOut(inv(1.5, 2.0, lt));
  g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 960, w, 90, 45, D.rec); text(g, EPISODE.ask, 540, 1006, { size: 38, color: '#fff' }); g.restore();
  const d = easeOut(inv(2.2, 2.6, lt));
  text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f6f8', alpha: d, spacing: 8 });
  text(g, 'フォローして続きを待ってて', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
}
