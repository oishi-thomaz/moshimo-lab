// 台本（声の長さ）からタイムラインを組み、ショット・字幕・効果音・BGMを1本にまとめる
import { W, H, clamp, inv, ease, text, fillRR, rr, FONT, SERIF, line, finish } from './core.js';

const MAX = 178.5; // ショート動画の上限（3分）に収める

export async function loadTiming() {
  const q = new URLSearchParams(location.search);
  const p = q.get('tts');
  if (!p) return {};
  try { const r = await fetch(p); if (r.ok) return await r.json(); } catch {}
  return {};
}
const plain = s => String(s || '').replace(/\[\[[a-z]+:([^\]]*)\]\]/g, '$1').replace(/／/g, '');

export function buildTimeline(LINES, timing, { lead = 0.3, defGap = 0.28 } = {}) {
  const items = LINES.map(L => ({ ...L }));
  for (const it of items) {
    if (it.beat) { it.dur0 = it.dur; continue; }
    const tm = timing[it.id];
    const txt = (it.read || plain(it.text));
    it.dur0 = tm ? tm.dur : Math.max(0.6, txt.length * 0.128 + 0.15);
    it.gap0 = it.gap ?? defGap;
  }
  const speech = items.filter(i => !i.beat).reduce((a, i) => a + i.dur0, 0);
  const beats = items.filter(i => i.beat).reduce((a, i) => a + i.dur0, 0);
  const gaps = items.filter(i => !i.beat).reduce((a, i) => a + i.gap0, 0);
  let tempo = 1, gapK = 1;
  const total0 = lead + speech + beats + gaps;
  if (total0 > MAX) {
    // まず声を少しだけ速め（最大1.08倍）、それでも長ければ間を詰める（最大40%）
    tempo = Math.min(1.08, speech / Math.max(1, MAX - lead - beats - gaps));
    if (tempo < 1) tempo = 1;
    const rest = lead + beats + speech / tempo;
    if (rest + gaps > MAX) gapK = Math.max(0.6, (MAX - rest) / gaps);
  }
  let t = lead;
  for (const it of items) {
    it.t0 = t;
    if (it.beat) { it.t1 = t + it.dur0; t = it.t1; continue; }
    it.dur = it.dur0 / tempo; it.t1 = t + it.dur; it.gap = it.gap0 * gapK; t = it.t1 + it.gap;
  }
  const byId = {}; items.forEach(it => { byId[it.id || it.beat] = it; });
  return { items, byId, duration: t, tempo };
}

// 字幕のかたまり（／で区切る）。各かたまりの表示時間は文字数で割り振る
export function subChunks(TL) {
  const out = [];
  for (const it of TL.items) {
    if (it.beat || !it.text) continue;
    const parts = it.text.split('／');
    const lens = parts.map(p => Math.max(1, plain(p).length));
    const sum = lens.reduce((a, b) => a + b, 0);
    let t = it.t0;
    parts.forEach((p, i) => {
      const d = it.dur * lens[i] / sum;
      out.push({ t0: t, t1: i === parts.length - 1 ? it.t1 + Math.min(0.35, it.gap) : t + d, text: p, who: it.who });
      t += d;
    });
  }
  return out;
}

// 字幕を描く（[[r:..]] 赤 / [[y:..]] 黄）。1行に収まらなければ自動で2行に
const COL = { r: '#ff5a4f', y: '#ffd451', b: '#8fd3ff' };
function runs(s) { const out = []; const re = /\[\[([a-z]):([^\]]*)\]\]/g; let i = 0, m; while ((m = re.exec(s))) { if (m.index > i) out.push([s.slice(i, m.index), '#ffffff']); out.push([m[2], COL[m[1]] || '#fff']); i = re.lastIndex; } if (i < s.length) out.push([s.slice(i), '#ffffff']); return out; }
export function drawSub(g, s, { y = 1262, size = 66, alpha = 1, who = null, names = {} } = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alpha;
  g.font = `800 ${size}px ${FONT}`; g.textBaseline = 'middle';
  // 文字ごとに分けて折り返す
  const chars = []; for (const [str, c] of runs(s)) for (const ch of str) chars.push([ch, c]);
  const maxW = 940;
  const widths = chars.map(([ch]) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let lines = [chars.map((c, i) => [c[0], c[1], widths[i]])];
  if (total > maxW) {
    // 2行に分ける：真ん中に近い「、」→ 助詞のあと → かなと漢字の切れ目 の順で切る
    const n = chars.length; let best = -1, bestScore = -1e9; let acc = 0;
    const s2 = chars.map(c => c[0]).join('');
    for (let i = 1; i < n - 1; i++) {
      acc += widths[i - 1];
      const prev = s2[i - 1], cur = s2[i];
      if ('、。！？…ーっゃゅょぁぃぅぇぉャュョッ」）'.includes(cur)) continue;
      let sc = -Math.abs(acc - total / 2) / 40;
      if ('、。！？'.includes(prev)) sc += 12;
      else if ('はがをにでのとへもや'.includes(prev) && !/[ぁ-ん]/.test(cur) ) sc += 7;
      else if ('はがをにでのとへもや'.includes(prev)) sc += 4;
      else if (/[ぁ-ん]/.test(prev) && /[一-龯ァ-ヴ0-9]/.test(cur)) sc += 3;
      else sc -= 6;
      if (acc > maxW || total - acc > maxW) sc -= 50;
      if (sc > bestScore) { bestScore = sc; best = i; }
    }
    const all = lines[0]; lines = [all.slice(0, best), all.slice(best)];
  }
  const lh = size * 1.32, y0 = y - (lines.length - 1) * lh / 2;
  if (who && names[who]) {
    const nm = names[who]; g.font = `800 34px ${FONT}`; const nw = g.measureText(nm).width + 40;
    fillRR(g, 540 - nw / 2, y0 - lh / 2 - 58, nw, 48, 24, 'rgba(15,18,28,.72)');
    g.fillStyle = '#e8e2d4'; g.textAlign = 'center'; g.fillText(nm, 540, y0 - lh / 2 - 33); g.font = `800 ${size}px ${FONT}`;
  }
  g.textAlign = 'left'; g.lineJoin = 'round';
  lines.forEach((ln, li) => {
    const lw = ln.reduce((a, c) => a + c[2], 0); let x = 540 - lw / 2; const yy = y0 + li * lh;
    // 縁取り→本体
    for (const pass of [0, 1, 2]) {
      let xx = x;
      for (const [ch, c, cw] of ln) {
        if (pass === 0) { g.lineWidth = 16; g.strokeStyle = 'rgba(10,12,20,.55)'; g.strokeText(ch, xx, yy + 4); }
        else if (pass === 1) { g.lineWidth = 11; g.strokeStyle = '#141824'; g.strokeText(ch, xx, yy); }
        else { g.fillStyle = c; g.fillText(ch, xx, yy); }
        xx += cw;
      }
    }
  });
  g.restore();
}

// 時刻のチップ（字幕のすぐ上）
export function drawChip(g, label, val, alpha) {
  if (alpha <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alpha;
  g.font = `800 34px ${FONT}`; const lw = label ? g.measureText(label).width + 22 : 0; g.font = `800 52px ${FONT}`; const vw = g.measureText(val).width;
  const w = lw + vw + 60, x = 540 - w / 2, y = 1085;
  fillRR(g, x, y - 38, w, 76, 38, 'rgba(14,16,26,.78)');
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,212,81,.8)'; rr(g, x, y - 38, w, 76, 38); g.stroke();
  g.textBaseline = 'middle'; g.textAlign = 'left';
  if (label) { g.font = `800 34px ${FONT}`; g.fillStyle = '#ffd451'; g.fillText(label, x + 30, y + 2); }
  g.font = `800 52px ${FONT}`; g.fillStyle = '#fff'; g.fillText(val, x + 30 + lw, y + 2);
  g.restore();
}

// まとめて走らせる
export async function runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX = [], MUSIC = [], CHIPS = [], post }) {
  const c = document.getElementById('c'); const g = c.getContext('2d');
  await document.fonts.load(`800 60px "M PLUS Rounded 1c"`, 'あ漢字'); await document.fonts.load(`500 40px "M PLUS Rounded 1c"`, 'あ'); await document.fonts.ready;
  const timing = await loadTiming();
  const TL = buildTimeline(LINES, timing);
  const at = (ref) => { const [id, edge] = String(ref).split(':'); const it = TL.byId[id]; if (!it) throw new Error('no line ' + id); return edge === 'end' ? it.t1 : it.t0; };
  const shots = SHOTS.map(s => ({ ...s, start: at(s.at) + (s.off || 0) })).sort((a, b) => a.start - b.start);
  shots.forEach((s, i) => { s.end = i < shots.length - 1 ? shots[i + 1].start : TL.duration; });
  const subs = subChunks(TL);
  const names = Object.fromEntries(Object.entries(CAST).filter(([k]) => k !== 'N' && k !== 'scream').map(([k, v]) => [k, v.name]));
  const chips = CHIPS.map(ch => ({ ...ch, t0: at(ch.at) + (ch.off || 0) }));
  window.DURATION = TL.duration;
  window.META = {
    series: SERIES, episode: EPISODE, duration: TL.duration, tempo: TL.tempo,
    lines: TL.items.filter(i => !i.beat && (i.read || i.text)).map(i => ({ id: i.id, who: i.who, t0: +i.t0.toFixed(3), t1: +i.t1.toFixed(3), fx: CAST[i.who].fx || null })),
    sfx: SFX.map(e => ({ ...e, t: +(at(e.at) + (e.off || 0)).toFixed(3) })),
    music: MUSIC.map(m => ({ ...m, t: +(at(m.at) + (m.off || 0)).toFixed(3) })),
  };
  window.renderAt = (t) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const S = shots.find(s => t >= s.start && t < s.end) || shots[shots.length - 1];
    const lt = t - S.start, D = S.end - S.start;
    const L = id => at(id) - S.start; // ショット内でのその行の開始時刻
    const Le = id => at(id + ':end') - S.start;
    g.save(); S.draw(g, lt, D, { L, Le, t, k: clamp(lt / D) }); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    if (!S.noFinish) finish(g, S.finish || {});
    // チップ
    for (const ch of chips) { const a = Math.min(inv(ch.t0, ch.t0 + 0.25, t), 1 - inv(ch.t0 + (ch.dur || 2.8), ch.t0 + (ch.dur || 2.8) + 0.3, t)); if (a > 0) drawChip(g, ch.label, ch.val, a); }
    // 字幕
    if (!S.noSubs) { const sb = subs.find(x => t >= x.t0 && t < x.t1); if (sb) drawSub(g, sb.text, { alpha: Math.min(1, (t - sb.t0) / 0.08), who: sb.who, names }); }
    if (post) post(g, t);
  };
  window.TL = TL; window.SHOTS_T = shots.map(s => [s.at, +s.start.toFixed(2), +s.end.toFixed(2)]);
  window.renderAt(0);
  window.READY = true;
}
