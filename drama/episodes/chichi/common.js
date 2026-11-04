// 父のスマホ の共通部品：人物・表紙（第◯話を大きく）・エンドカード・見出しチップ・よく使う画面
import { W, H, clamp, lerp, inv, ease, easeOut, back, noise1, rr, fillRR, circ, vgrad, glow, rgba, text, poly, FONT, SERIF, cam } from '../../engine/core.js';
import { C, close } from '../../engine/noir.js';
import { phoneFrame } from '../../engine/sns.js';
import { Y, danchiRoom, lock } from '../../engine/chichisets.js';

// この作品の差し色（通知と送金の黄）
C.red = Y.amber;

export const P = {
  natsuki: { hair: 'long2', hairC: '#2a1e1a', top: '#2a2a32', top2: '#22222a', bottom: '#2a2a30', shoes: '#ddd', tall: 0.96, female: true },
  kazumi: { hair: 'bob2', grey: true, hairC: '#3a2c26', top: '#7a6a5e', top2: '#6a5a50', bottom: '#4a4450', shoes: '#ccc', tall: 0.93, female: true, cardigan: true },
  ryo: { hair: 'messy', hairC: '#1a1618', top: '#5a3a3a', top2: '#4a2e2e', hood: true, bottom: '#24262e', shoes: '#ddd', tall: 1.03 },
  taeko: { hair: 'bun2', grey: true, hairC: '#5a5050', top: '#7a7a8e', top2: '#66667a', bottom: '#4a4550', shoes: '#ccc', tall: 0.93, female: true, cardigan: true },
  dad: { hair: 'parted', hairC: '#9a958e', top: '#6a6458', top2: '#5a5448', bottom: '#3a3a44', shoes: '#2a2018', tall: 1.0, glasses: true },
  dadYoung: { hair: 'parted', hairC: '#2a2420', top: '#5a6a7a', top2: '#4a5a6a', bottom: '#3a3a44', shoes: '#2a2018', tall: 1.0, glasses: true },
  momYoung: { hair: 'bob2', hairC: '#2a1e1a', top: '#a08a78', top2: '#8a7666', bottom: '#4a4550', shoes: '#ccc', tall: 0.94, female: true },
  natsukiKid: { hair: 'pony2', hairC: '#2a1e1a', top: '#c95a5a', top2: '#b04a4a', bottom: '#3a4a6a', shoes: '#eee', tall: 0.62, female: true },
  ryoKid: { hair: 'messy', hairC: '#1a1618', top: '#4a7ab0', top2: '#3a6aa0', bottom: '#2a2e3a', shoes: '#eee', tall: 0.62 },
  shin: { hair: 'messy', hairC: '#1a1a1a', top: '#3a4a5a', top2: '#2e3a48', bottom: '#2a2e38', shoes: '#ddd', tall: 1.02 },
};
// 写真の中の人たち（3号棟の入口の前）
export const FAMILY = { dad: P.dadYoung, child: P.natsukiKid, mom: P.momYoung };
export const RYOPHOTO = { dad: P.dad, child: P.ryoKid };
P.family = FAMILY; // 部屋の壁の家族写真

export const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.3 + 0.7 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
export const bg = (g, a = '#0e1018', b = '#161a24') => vgrad(g, -300, -300, W + 600, H + 600, [[0, a], [1, b]]);
export const slow = (lt, D, a = 1, b = 1.08) => lerp(a, b, ease(clamp(lt / Math.max(D, 0.1))));
export function chip(g, s, a) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.font = `800 40px ${FONT}`; const w = g.measureText(s).width + 70;
  fillRR(g, 540 - w / 2, 210, w, 80, 40, 'rgba(10,12,18,.88)'); g.lineWidth = 3; g.strokeStyle = rgba(Y.amber, 0.85); rr(g, 540 - w / 2, 210, w, 80, 40); g.stroke();
  text(g, s, 540, 252, { size: 40, color: '#f1f3f8' }); g.restore();
}
export const heads = list => (g, t, { at }) => { for (const [id, s, d] of list) { const t0 = at(id); chip(g, s, Math.min(inv(t0, t0 + 0.3, t), 1 - inv(t0 + d, t0 + d + 0.4, t))); } };
// 字幕の下地（寄りの画面で字幕が絵と重なるとき）
export const subBand = (g, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha = a; vgrad(g, 0, 1140, W, 330, [[0, 'rgba(8,9,14,0)'], [0.2, 'rgba(8,9,14,.9)'], [0.75, 'rgba(8,9,14,.9)'], [1, 'rgba(8,9,14,0)']]); g.restore(); };

// よく使う画面
export const phone = (g, lt, D, draw, o = {}) => { bg(g); g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.04) }); phoneFrame(g, 140, 80, 800, 1000, draw, { rot: o.rot || 0 }); g.restore(); };
export const room = (g, lt, D, o = {}) => { g.save(); cam(g, { x: o.x ?? 540, y: o.y ?? 960, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.05) }); danchiRoom(g, { t: lt, P, ...o.set }); g.restore(); };
// 顔のアップ。who＝P のキー。ids＝口が動く行
export const face = (g, lt, D, S, who, ids = [], o = {}) => {
  if (o.back) o.back(g, lt); else bg(g, '#1a1914', '#0c0c0a');
  const tk = ids.length ? talking(lt, S, ids) : 0;
  g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.06) });
  close(g, P[who], { y: o.y ?? 640, x: o.x ?? 540, s: o.s ?? 4.0, talk: tk * 0.5, lightFrom: 'left', ...o });
  g.restore();
};
// ロック画面（父のスマホ）
export const lockS = (g, lt, D, o = {}) => { g.save(); cam(g, { x: 540, y: 800, z: slow(lt, D, o.z0 ?? 1.0, o.z1 ?? 1.04) }); lock(g, { t: lt, ...o }); g.restore(); };

// 作品タイトル「父のスマホ」（「スマホ」だけ黄）
export function seriesTitle(g, x, y, size, alpha = 1, gl = 0) {
  g.save(); g.globalAlpha = alpha; g.font = `900 ${size}px "Noto Sans CJK JP", sans-serif`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const a = '父の', b = 'スマホ', wa = g.measureText(a).width, wb = g.measureText(b).width, x0 = x - (wa + wb) / 2;
  g.textAlign = 'left'; g.lineWidth = size * 0.13; g.strokeStyle = '#05060a';
  g.strokeText(a, x0, y); g.strokeText(b, x0 + wa, y);
  if (gl) { g.fillStyle = rgba(Y.amber, 0.6); g.fillText(b, x0 + wa - gl, y); }
  g.fillStyle = '#f4f6f8'; g.fillText(a, x0, y); g.fillStyle = Y.amber; g.fillText(b, x0 + wa + gl, y);
  g.restore();
}
// 表紙の両脇に置く「7:00 カズミ おはよう、あなた」のロック画面
function miniLock(g, x, y, rot, line2) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40; fillRR(g, -150, -270, 300, 540, 40, '#0e0f14'); g.shadowColor = 'transparent';
  fillRR(g, -138, -258, 276, 516, 30, '#121a30');
  text(g, '7:00', 0, -170, { size: 76, color: '#f4f6fa', weight: 500 });
  fillRR(g, -124, -90, 248, 150, 22, 'rgba(236,240,250,.18)');
  circ(g, -84, -46, 24, '#7a6250'); text(g, 'カ', -84, -44, { size: 24, color: '#fff', weight: 900 });
  text(g, 'カズミ', -48, -50, { size: 26, color: '#fff', align: 'left' });
  text(g, line2, -104, 10, { size: 22, color: 'rgba(255,255,255,.92)', align: 'left', weight: 700 });
  g.restore();
  glow(g, x, y, 360, 'rgba(255,214,120,1)', 0.16);
}
// 表紙。back=背景、face=中央の顔
export function cover(g, lt, { no, title, back: drawBack, face: drawFace }) {
  const k = easeOut(inv(0, 0.3, lt)), gl = lt < 0.35 ? noise1(lt * 60, 3) * 14 : 0;
  drawBack(g);
  vgrad(g, 0, 0, W, H, [[0, 'rgba(4,5,8,.92)'], [0.3, 'rgba(4,5,8,.5)'], [0.6, 'rgba(4,5,8,.35)'], [1, 'rgba(4,5,8,.93)']]);
  g.save(); g.globalAlpha = k; miniLock(g, 190, 1500, -0.12, 'おはよう、あなた'); miniLock(g, 890, 1500, 0.12, 'おはよう、あなた'); g.restore();
  glow(g, 540, 820, 760, 'rgba(242,193,78,1)', 0.16 * k);
  g.save(); g.globalAlpha = k; drawFace(g); g.restore();
  vgrad(g, 0, 1250, W, 200, [[0, 'rgba(4,5,8,.6)'], [1, 'rgba(4,5,8,0)']]);
  seriesTitle(g, 540, 560, 170, k, gl);
  const b = easeOut(inv(0.15, 0.5, lt)), sc = lerp(1.3, 1, back(b)), label = no === 5 ? '最終話' : `第${no}話`;
  g.save(); g.translate(540, 840); g.scale(sc, sc); g.globalAlpha = b;
  g.font = `900 ${no === 5 ? 270 : 300}px "Noto Sans CJK JP", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 30; g.strokeStyle = '#05060a'; g.strokeText(label, 0, 0); g.fillStyle = Y.amber; g.fillText(label, 0, 0); g.restore();
  const c = easeOut(inv(0.35, 0.7, lt));
  g.save(); g.globalAlpha = c; g.font = `800 82px ${FONT}`; const tw = Math.max(640, g.measureText(title).width + 120);
  fillRR(g, 540 - tw / 2, 1030, tw, 116, 14, '#f4f6f8'); text(g, title, 540, 1090, { size: 82, color: '#0a0a0e', weight: 800 });
  const pl = no === 5 ? '第5話 ／ 全5話' : '全5話'; g.font = `800 32px ${FONT}`; const pw = g.measureText(pl).width + 70;
  fillRR(g, 540 - pw / 2, 1166, pw, 52, 26, Y.amber); text(g, pl, 540, 1193, { size: 32, color: '#1a1406', weight: 800, spacing: 4 }); g.restore();
}
// 表紙の背景（団地の部屋・祭壇のスマホが光る）と顔（ナツキ）
export const coverBack = (set = {}) => g2 => { g2.save(); cam(g2, { x: 540, y: 1000, z: 1.1 }); danchiRoom(g2, { t: 3, P, lamp: 0.25, notify: 1, ...set }); g2.restore(); };
export const coverFace = (o = {}) => g2 => close(g2, P.natsuki, { y: 1500, s: 3.0, eyes: 'wide', brow: -0.4, mouth: 'line', lightFrom: 'right', phoneLight: true, ...o });

// エンドカード（次回予告）
export function endCard(g, lt, { SERIES, EPISODE }) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#06070a'], [1, '#0e1016']]);
  const a = easeOut(inv(0.1, 0.5, lt));
  if (!EPISODE.next) {
    seriesTitle(g, 540, 560, 120, a);
    const b = easeOut(inv(0.6, 1.1, lt));
    poly(g, [[300, 660], [780, 640], [782, 650], [302, 672]], rgba(Y.amber, b));
    text(g, '完', 540, 820, { size: 180, color: '#f4f6f8', weight: 900, alpha: b, font: SERIF });
    const c = easeOut(inv(1.5, 2.0, lt));
    g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 990, w, 90, 45, Y.amber); text(g, EPISODE.ask, 540, 1036, { size: 38, color: '#1a1406' }); g.restore();
    const d = easeOut(inv(2.2, 2.6, lt));
    text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f6f8', alpha: d, spacing: 8 });
    text(g, '全5話　ご覧いただきありがとうございました', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
    return;
  }
  seriesTitle(g, 540, 470, 80, a * 0.85);
  text(g, `第${EPISODE.no}話「${EPISODE.title}」終`, 540, 570, { size: 42, color: '#c9ccd6', alpha: a });
  const b = easeOut(inv(0.6, 1.1, lt));
  poly(g, [[300, 650], [780, 630], [782, 640], [302, 662]], rgba(Y.amber, b));
  const nx = EPISODE.no + 1;
  text(g, nx === 5 ? '次回　最終話' : '次回', 540, 730, { size: 40, color: Y.amber, alpha: b });
  text(g, `第${nx}話　${EPISODE.next}`, 540, 840, { size: EPISODE.next.length > 5 ? 80 : 92, color: '#f4f6f8', weight: 900, alpha: b, spacing: 4 });
  const c = easeOut(inv(1.5, 2.0, lt));
  g.save(); g.globalAlpha = c; g.font = `800 38px ${FONT}`; const w = g.measureText(EPISODE.ask).width + 90; fillRR(g, 540 - w / 2, 960, w, 90, 45, Y.amber); text(g, EPISODE.ask, 540, 1006, { size: 38, color: '#1a1406' }); g.restore();
  const d = easeOut(inv(2.2, 2.6, lt));
  text(g, SERIES.account, 540, 1210, { size: 56, color: '#f4f6f8', alpha: d, spacing: 8 });
  text(g, 'フォローして続きを待ってて', 540, 1280, { size: 30, color: '#8a8f9c', alpha: d, weight: 500 });
}
