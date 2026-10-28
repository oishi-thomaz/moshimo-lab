// 二人の息子 の共通部品：人物・表紙（第◯話を大きく）・エンドカード・見出しチップ
import { W, H, clamp, lerp, inv, ease, easeOut, back, noise1, rr, fillRR, circ, vgrad, glow, rgba, text, poly, FONT, SERIF, cam } from '../../engine/core.js';
import { C, close } from '../../engine/noir.js';
import { F } from '../../engine/futarisets.js';

// この作品の差し色（字幕の傍線なども着信の緑に）
C.red = F.green;

export const P = {
  sawako: { hair: 'bun2', grey: true, hairC: '#4a3a34', top: '#8a7f86', top2: '#74697a', bottom: '#4a4550', shoes: '#ccc', tall: 0.95, female: true, cardigan: true },
  haruto: { hair: 'messy', hairC: '#1c1a1c', top: '#3c4656', top2: '#2e3644', hood: true, bottom: '#22262f', shoes: '#ddd', tall: 1.02 },
  takagi: { hair: 'police', hairC: '#1b1b1f', top: '#1e2a44', top2: '#162036', bottom: '#1e2a44', shoes: '#111', tall: 1.04 },
  kuroda: { hair: 'buzz', hairC: '#121214', top: '#15161a', top2: '#0e0f12', bottom: '#1a1b20', shoes: '#111', tall: 1.06 },
};

export const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
export const bg = (g, a = '#0c110f', b = '#141a17') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
export const slow = (lt, D, a = 1, b = 1.08) => lerp(a, b, ease(clamp(lt / Math.max(D, 0.1))));
export function chip(g, s, a) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 70;
  fillRR(g, 540 - w / 2, 210, w, 80, 40, 'rgba(8,12,10,.88)'); g.lineWidth = 3; g.strokeStyle = rgba(F.green, 0.85); rr(g, 540 - w / 2, 210, w, 80, 40); g.stroke();
  text(g, s, 540, 252, { size: 40, color: '#f1f3f8' }); g.restore();
}
export const heads = list => (g, t, { at }) => { for (const [id, s, d] of list) { const t0 = at(id); chip(g, s, Math.min(inv(t0, t0 + 0.3, t), 1 - inv(t0 + d, t0 + d + 0.4, t))); } };

// 作品タイトル「二人の息子」（「二人」だけ緑）
export function seriesTitle(g, x, y, size, alpha = 1, gl = 0) {
  g.save(); g.globalAlpha = alpha; g.font = `900 ${size}px "Noto Sans CJK JP", sans-serif`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const a = '二人', b = 'の息子', wa = g.measureText(a).width, wb = g.measureText(b).width, x0 = x - (wa + wb) / 2;
  g.textAlign = 'left'; g.lineWidth = size * 0.13; g.strokeStyle = '#05060a';
  g.strokeText(a, x0, y); g.strokeText(b, x0 + wa, y);
  if (gl) { g.fillStyle = rgba(F.green, 0.6); g.fillText(a, x0 - gl, y); }
  g.fillStyle = F.green; g.fillText(a, x0 + gl, y); g.fillStyle = '#f4f6f8'; g.fillText(b, x0 + wa, y);
  g.restore();
}
// 表紙の両脇に置く「ハルト」の着信画面（同じ名前が2つ）
function miniCall(g, x, y, rot, label, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40; fillRR(g, -150, -270, 300, 540, 40, '#0e0f14'); g.shadowColor = 'transparent';
  fillRR(g, -138, -258, 276, 516, 30, '#10261b');
  circ(g, 0, -120, 66, '#2f4a3c'); text(g, 'ハ', 0, -116, { size: 62, color: '#d6f5e3', weight: 900 });
  text(g, 'ハルト', 0, 0, { size: 52, color: '#fff' }); text(g, label, 0, 56, { size: 28, color: col, weight: 700 });
  circ(g, 0, 170, 46, F.green); g.restore();
  glow(g, x, y, 360, 'rgba(80,230,150,1)', 0.22);
}
// 表紙。back=背景、face=中央の顔
export function cover(g, lt, { no, title, back: drawBack, face }) {
  const k = easeOut(inv(0, 0.3, lt)), gl = lt < 0.35 ? noise1(lt * 60, 3) * 14 : 0;
  drawBack(g);
  vgrad(g, 0, 0, W, H, [[0, 'rgba(3,5,4,.92)'], [0.3, 'rgba(3,5,4,.5)'], [0.6, 'rgba(3,5,4,.35)'], [1, 'rgba(3,5,4,.93)']]);
  g.save(); g.globalAlpha = k; miniCall(g, 190, 1500, -0.12, '着信', F.green2); miniCall(g, 890, 1500, 0.12, '通話中', F.amber); g.restore();
  glow(g, 540, 820, 760, 'rgba(54,210,127,1)', 0.2 * k);
  g.save(); g.globalAlpha = k; face(g); g.restore();
  vgrad(g, 0, 1250, W, 200, [[0, 'rgba(3,5,4,.6)'], [1, 'rgba(3,5,4,0)']]);
  seriesTitle(g, 540, 560, 170, k, gl);
  const b = easeOut(inv(0.15, 0.5, lt)), sc = lerp(1.3, 1, back(b)), label = no === 5 ? '最終話' : `第${no}話`;
  g.save(); g.translate(540, 840); g.scale(sc, sc); g.globalAlpha = b;
  g.font = `900 ${no === 5 ? 270 : 300}px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 30; g.strokeStyle = '#05060a'; g.strokeText(label, 0, 0); g.fillStyle = F.green; g.fillText(label, 0, 0); g.restore();
  const c = easeOut(inv(0.35, 0.7, lt));
  g.save(); g.globalAlpha = c; g.font = `800 82px ${FONT}`; const tw = Math.max(640, g.measureText(title).width + 120);
  fillRR(g, 540 - tw / 2, 1030, tw, 116, 14, '#f4f6f8'); text(g, title, 540, 1090, { size: 82, color: '#0a0a0e', weight: 800 });
  const pl = no === 5 ? '第5話 ／ 全5話' : '全5話'; g.font = `800 32px ${FONT}`; const pw = g.measureText(pl).width + 70;
  fillRR(g, 540 - pw / 2, 1166, pw, 52, 26, F.green); text(g, pl, 540, 1193, { size: 32, color: '#05140c', weight: 800, spacing: 4 }); g.restore();
}
// エンドカード（次回予告）
export function endCard(g, lt, { SERIES, EPISODE }) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#040705'], [1, '#0a100d']]);
  const a = easeOut(inv(0.1, 0.5, lt));
  if (!EPISODE.next) {
    seriesTitle(g, 540, 560, 120, a);
    const b = easeOut(inv(0.6, 1.1, lt));
    poly(g, [[300, 660], [780, 640], [782, 650], [302, 672]], rgba(F.green, b));
    text(g, '完', 540, 820, { size: 180, color: '#f4f6f8', weight: 900, alpha: b, font: SERIF });
    const c = easeOut(inv(1.5, 2.0, lt));
    g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 990, w, 90, 45, F.green); text(g, EPISODE.ask, 540, 1036, { size: 38, color: '#05140c' }); g.restore();
    const d = easeOut(inv(2.2, 2.6, lt));
    text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f6f8', alpha: d, spacing: 8 });
    text(g, '全5話　ご覧いただきありがとうございました', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
    return;
  }
  seriesTitle(g, 540, 470, 80, a * 0.85);
  text(g, `第${EPISODE.no}話「${EPISODE.title}」終`, 540, 570, { size: 42, color: '#c9ccd6', alpha: a });
  const b = easeOut(inv(0.6, 1.1, lt));
  poly(g, [[300, 650], [780, 630], [782, 640], [302, 662]], rgba(F.green, b));
  const nx = EPISODE.no + 1;
  text(g, nx === 5 ? '次回　最終話' : '次回', 540, 730, { size: 40, color: F.green, alpha: b });
  text(g, `第${nx}話　${EPISODE.next}`, 540, 840, { size: 92, color: '#f4f6f8', weight: 900, alpha: b, spacing: 4 });
  const c = easeOut(inv(1.5, 2.0, lt));
  g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 960, w, 90, 45, F.green); text(g, EPISODE.ask, 540, 1006, { size: 38, color: '#05140c' }); g.restore();
  const d = easeOut(inv(2.2, 2.6, lt));
  text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f6f8', alpha: d, spacing: 8 });
  text(g, 'フォローして続きを待ってて', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
}
