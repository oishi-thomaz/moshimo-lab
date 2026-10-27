// ホワイト案件 第3話からの共通部品：表紙（第◯話を大きく）・エンドカード・見出しチップ・よく使う動き
import { W, H, clamp, lerp, inv, ease, easeOut, back, noise1, rr, fillRR, circ, vgrad, glow, rgba, text, poly, FONT, SERIF } from '../../engine/core.js';
import { C, crowIcon } from '../../engine/noir.js';

export const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
export const bg = (g, a = '#06070c', b = '#0d1120') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
export const slow = (lt, D, a = 1, b = 1.08) => lerp(a, b, ease(clamp(lt / Math.max(D, 0.1))));
export function chip(g, s, a) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 70;
  fillRR(g, 540 - w / 2, 210, w, 80, 40, 'rgba(10,10,16,.85)'); g.lineWidth = 3; g.strokeStyle = rgba(C.red, 0.8); rr(g, 540 - w / 2, 210, w, 80, 40); g.stroke();
  text(g, s, 540, 252, { size: 40, color: '#f1f3f8' }); g.restore();
}
// 見出し：[[id, 文字, 秒]] を post で出す
export const heads = list => (g, t, { at }) => { for (const [id, s, d] of list) { const t0 = at(id); chip(g, s, Math.min(inv(t0, t0 + 0.3, t), 1 - inv(t0 + d, t0 + d + 0.4, t))); } };

// 表紙。back=背景を描く関数、face=下の顔を描く関数、pill={icon:'crow'|'?'|文字, text}
export function cover(g, lt, { no, title, back: drawBack, face, pill }) {
  const k = easeOut(inv(0, 0.3, lt)), gl = lt < 0.35 ? noise1(lt * 60, 3) * 16 : 0;
  drawBack(g);
  vgrad(g, 0, 0, W, H, [[0, 'rgba(3,3,6,.9)'], [0.3, 'rgba(3,3,6,.45)'], [0.6, 'rgba(3,3,6,.35)'], [1, 'rgba(3,3,6,.9)']]);
  glow(g, 540, 820, 760, 'rgba(220,20,40,1)', 0.28 * k);
  g.save(); g.globalAlpha = k; face(g); g.restore();
  vgrad(g, 0, 1250, W, 200, [[0, 'rgba(3,3,6,.6)'], [1, 'rgba(3,3,6,0)']]);
  if (pill) {
    g.save(); g.globalAlpha = k; g.font = `800 42px ${FONT}`; const tw = g.measureText(pill.text).width; const w = Math.max(560, tw + 160), x0 = 540 - w / 2;
    fillRR(g, x0, 330, w, 110, 34, 'rgba(24,26,36,.95)'); g.lineWidth = 4; g.strokeStyle = C.red; rr(g, x0, 330, w, 110, 34); g.stroke();
    if (pill.icon === 'crow') crowIcon(g, x0 + 65, 385, 34); else { circ(g, x0 + 65, 385, 34, '#2a2e3a'); text(g, pill.icon || '？', x0 + 65, 387, { size: 36, color: '#fff' }); }
    text(g, pill.text, x0 + 125, 387, { size: 42, color: '#fff', align: 'left' }); g.restore();
  }
  const ts = (gx, col) => { g.save(); g.font = `700 160px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.letterSpacing = '4px'; g.globalAlpha = k; g.lineWidth = 18; g.strokeStyle = '#05060a'; g.strokeText('ホワイト案件', gx, 600); g.fillStyle = col; g.fillText('ホワイト案件', gx, 600); g.restore(); };
  if (gl) ts(540 - gl, rgba('#ff2a40', 0.6));
  ts(540 + gl, '#f4f1ea');
  const b = easeOut(inv(0.15, 0.5, lt)), sc = lerp(1.3, 1, back(b));
  const label = no === 5 ? '最終話' : `第${no}話`;
  g.save(); g.translate(540, 870); g.scale(sc, sc); g.globalAlpha = b;
  g.font = `900 ${no === 5 ? 270 : 300}px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 30; g.strokeStyle = '#05060a'; g.strokeText(label, 0, 0); g.fillStyle = C.red; g.fillText(label, 0, 0); g.restore();
  const c = easeOut(inv(0.35, 0.7, lt));
  g.save(); g.globalAlpha = c; g.font = `800 82px ${FONT}`; const tw = Math.max(640, g.measureText(title).width + 120);
  fillRR(g, 540 - tw / 2, 1060, tw, 116, 14, '#f4f1ea'); text(g, title, 540, 1120, { size: 82, color: '#0a0a0e', weight: 800 });
  const pl = no === 5 ? '第5話 ／ 全5話' : '全5話'; g.font = `800 32px ${FONT}`; const pw = g.measureText(pl).width + 70;
  fillRR(g, 540 - pw / 2, 1196, pw, 52, 26, C.red); text(g, pl, 540, 1223, { size: 32, color: '#fff', weight: 800, spacing: 4 }); g.restore();
}

// エンドカード（次回予告）
export function endCard(g, lt, { SERIES, EPISODE }) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#030305'], [1, '#08090e']]);
  const a = easeOut(inv(0.1, 0.5, lt));
  text(g, 'ホワイト案件', 540, 470, { size: 64, color: '#8a8f9c', font: SERIF, weight: 700, alpha: a, spacing: 4 });
  text(g, `第${EPISODE.no}話「${EPISODE.title}」終`, 540, 560, { size: 42, color: '#c9ccd6', alpha: a });
  const b = easeOut(inv(0.6, 1.1, lt));
  poly(g, [[300, 650], [780, 630], [782, 640], [302, 662]], rgba(C.red, b));
  const nx = EPISODE.no + 1;
  text(g, nx === 5 ? '次回　最終話' : '次回', 540, 730, { size: 40, color: C.red, alpha: b });
  text(g, `第${nx}話　${EPISODE.next}`, 540, 840, { size: 92, color: '#f4f1ea', font: SERIF, weight: 700, alpha: b, spacing: 4 });
  const c = easeOut(inv(1.5, 2.0, lt));
  g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 960, w, 90, 45, C.red); text(g, EPISODE.ask, 540, 1006, { size: 38, color: '#fff' }); g.restore();
  const d = easeOut(inv(2.2, 2.6, lt));
  text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f1ea', alpha: d, spacing: 8 });
  text(g, 'フォローして続きを待ってて', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
}
