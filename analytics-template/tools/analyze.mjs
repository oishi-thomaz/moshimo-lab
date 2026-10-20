// 集計（毎朝の解析タスクが最初に動かす）
//   node tools/analyze.mjs ../moshimo-lab
// data/ に貯まった毎時の数字から、直近24時間・7日の増減、媒体別の人気動画、伸び方の比較、
// フックの型・ジャンル・投稿時間ごとの傾向を出して analysis/YYYY-MM-DD.md と .json に書く。
// 数字の計算はここで全部やる（Claude は解釈と次の手に集中する）。
import fs from 'node:fs';
import path from 'node:path';

const LAB = process.argv[2] || '../moshimo-lab';
const JST = 9 * 3600e3, H = 3600e3, D = 86400e3;
const PLATS = { ig: 'インスタ', yt: 'YouTube', tt: 'TikTok' };
const FOLLOW = { ig: 'followers', yt: 'subs', tt: 'followers' };
const jst = t => new Date(t + JST);
const ymd = t => jst(t).toISOString().slice(0, 10);
const hm = t => jst(t).toISOString().slice(11, 16);
const md = t => `${jst(t).getUTCMonth() + 1}/${jst(t).getUTCDate()} ${hm(t)}`;
const n = v => (v == null || isNaN(v) ? '-' : Math.round(v).toLocaleString('ja-JP'));
const pct = v => (v == null || !isFinite(v) ? '-' : `${(v * 100).toFixed(1)}%`);
const sgn = v => (v == null ? '-' : `${v >= 0 ? '+' : ''}${n(v)}`);
const med = a => { const s = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const avg = a => { const s = a.filter(x => x != null && isFinite(x)); return s.length ? s.reduce((x, y) => x + y, 0) / s.length : null; };
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const readLines = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);

// ---------- データ ----------
const snapDir = 'data/snaps';
const snaps = (fs.existsSync(snapDir) ? fs.readdirSync(snapDir).filter(f => f.endsWith('.jsonl')).sort() : []).flatMap(f => readLines(path.join(snapDir, f))).sort((a, b) => a.t - b.t);
const st = readJson('data/state.json', {});
const igDays = readJson('data/ig-days.json', {});
const ytDays = readJson('data/yt-days.json', {});
const blueprint = readJson(path.join(LAB, 'plan/blueprint.json'), []);
const bp = Object.fromEntries(blueprint.filter(b => b.made).map(b => [b.made, b]));
const readIds = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => /^\d{4}$/.test(s)) : []);
const rendered = new Set(readIds(path.join(LAB, 'state/rendered.txt')));
const queue = readIds(path.join(LAB, 'plan/queue.txt'));
const items = st.items || {};
fs.mkdirSync('analysis', { recursive: true });

if (!snaps.length) {
  const msg = `# 集計 ${ymd(Date.now())}\n\nまだ数字がない。VPS の更新・MOSHIMO_AN の登録・collect の実行を確認する。\n`;
  fs.writeFileSync(`analysis/${ymd(Date.now())}.md`, msg); console.log(msg); process.exit(0);
}
const T = snaps.at(-1).t;

// ---------- 時系列 ----------
const series = { ig: {}, yt: {}, tt: {} }, acct = { ig: [], yt: [], tt: [] }, created = { ig: {}, yt: {}, tt: {} }, lastRec = { ig: {}, yt: {}, tt: {} };
for (const s of snaps) for (const p of Object.keys(PLATS)) {
  const x = s[p]; if (!x || x.error) continue;
  if (x[FOLLOW[p]] != null) acct[p].push([s.t, x[FOLLOW[p]]]);
  for (const [k, r] of Object.entries(x.media || {})) { (series[p][k] = series[p][k] || []).push([s.t, r]); if (r.t) created[p][k] = r.t; lastRec[p][k] = { ...(lastRec[p][k] || {}), ...Object.fromEntries(Object.entries(r).filter(([, v]) => v != null)) }; }
}
// 指標が取れていない媒体（インスタのインサイト権限がない間など）は再生の代わりにいいねで比べる
const metricOf = p => (Object.values(lastRec[p]).some(r => r.views != null) ? 'views' : 'likes');
const valAt = (p, k, time, field) => {
  const s = series[p][k]; if (!s) return null;
  if (created[p][k] && created[p][k] > time) return 0;
  let v = null; for (const [t, r] of s) { if (t > time) break; if (r[field] != null) v = r[field]; }
  return v;
};
const acctAt = (p, time) => { let v = null; for (const [t, f] of acct[p]) { if (t > time) break; v = f; } return v; };
const firstT = snaps[0].t;

// ---------- 動画の番号をそろえる（TikTok は手動投稿なのでタイトルで照合） ----------
const norm = s => String(s || '').replace(/#\S+/g, '').replace(/[\s　？?！!、。,.「」『』…・〜~]/g, '').toLowerCase();
const titles = Object.entries(items).map(([id, i]) => [id, norm(i.title)]).filter(([, t]) => t.length >= 4);
const idOf = (p, k) => {
  const r = lastRec[p][k] || {}; if (r.id) return r.id;
  const c = norm(r.cap); if (c.length < 4) return null;
  const hit = titles.find(([, t]) => c.includes(t.slice(0, Math.min(t.length, 10))) || t.includes(c.slice(0, Math.min(c.length, 10))));
  return hit ? hit[0] : null;
};
// blueprint にない番号（0031〜など個別に作った回）は、動画ファイルの META.hookType / META.cat があればそれを使う
const fileMeta = {};
const metaOf = id => { if (!(id in fileMeta)) { let m = {}; try { const src = fs.readFileSync(path.join(LAB, `engine/videos/${id}.js`), 'utf8'); const g = k => (src.match(new RegExp(`${k}:\\s*'([^']*)'`)) || [])[1]; m = { title: g('title'), hook_type: g('hookType'), cat: g('cat'), mood: g('mood') }; } catch {} fileMeta[id] = m; } return fileMeta[id]; };
const info = id => { const b = { ...metaOf(id), ...Object.fromEntries(Object.entries(bp[id] || {}).filter(([, v]) => v)) }; const i = items[id] || {}; return { title: i.title || b.title || '', hook: b.hook_type || '', cat: b.cat || '', mood: b.mood || '', virality: b.virality || '', slot: i.publishedAt ? hm(i.publishedAt) : '' }; };

// ---------- 窓ごとの集計 ----------
function windowStats(p, from, to) {
  const metric = metricOf(p); const vids = [];
  for (const k of Object.keys(series[p])) {
    const v1 = valAt(p, k, to, metric), v0 = valAt(p, k, from, metric);
    if (v1 == null) continue;
    const gain = v0 == null ? null : v1 - v0;
    vids.push({ k, id: idOf(p, k), gain, total: v1 });
  }
  const f1 = acctAt(p, to), f0 = acctAt(p, from);
  return { metric, followers: f1, followersDelta: f1 != null && f0 != null ? f1 - f0 : null, total: vids.reduce((a, v) => a + (v.gain || 0), 0), vids: vids.sort((a, b) => (b.gain || 0) - (a.gain || 0)) };
}
const w24 = {}, w7 = {}, wPrev = {};
for (const p of Object.keys(PLATS)) { w24[p] = windowStats(p, T - D, T); w7[p] = windowStats(p, T - 7 * D, T); wPrev[p] = windowStats(p, T - 2 * D, T - D); }
const covered = (T - firstT) / H;

// ---------- 伸び方（投稿から何時間で何回か） ----------
const CHECK = [1, 3, 6, 24, 72];
const curves = {};
for (const p of Object.keys(PLATS)) {
  const metric = metricOf(p); curves[p] = {};
  for (const k of Object.keys(series[p])) {
    const c = created[p][k]; if (!c || c < firstT - H) continue; // 記録を始める前の投稿は伸び方を比べられない
    curves[p][k] = Object.fromEntries(CHECK.filter(h => T >= c + h * H).map(h => [h, valAt(p, k, c + h * H, metric)]));
  }
}
const curveBase = Object.fromEntries(Object.keys(PLATS).map(p => [p, Object.fromEntries(CHECK.map(h => [h, med(Object.values(curves[p]).map(c => c[h]))]))]));

// ---------- 動画ごとの詳細 ----------
function detail(p, k) {
  const r = lastRec[p][k] || {}; const id = idOf(p, k); const i = id ? info(id) : {};
  const views = r.views ?? null;
  const d = { p, k, id, title: (i.title || r.cap || '').slice(0, 30), hook: i.hook || '', cat: i.cat || '', slot: i.slot || (created[p][k] ? hm(created[p][k]) : ''), ageH: created[p][k] ? Math.round((T - created[p][k]) / H) : null,
    views, likes: r.likes ?? null, comments: r.comments ?? null, saves: r.saved ?? null, shares: r.shares ?? null, reach: r.reach ?? null,
    watchSec: r.ig_reels_avg_watch_time != null ? r.ig_reels_avg_watch_time / 1000 : null, skip: r.reels_skip_rate ?? null,
    gain24: (w24[p].vids.find(v => v.k === k) || {}).gain ?? null, curve: curves[p][k] || null };
  if (views) Object.assign(d, { likeRate: d.likes != null ? d.likes / views : null, commentRate: d.comments != null ? d.comments / views : null, saveRate: d.saves != null ? d.saves / views : null, shareRate: d.shares != null ? d.shares / views : null });
  const c = d.curve, b = curveBase[p];
  if (c) for (const h of [...CHECK].reverse()) if (c[h] != null && b[h]) { d.vsAvg = { h, x: c[h] / b[h] }; break; }
  return d;
}
const details = Object.fromEntries(Object.keys(PLATS).map(p => [p, Object.keys(series[p]).map(k => detail(p, k))]));

// ---------- 傾向（フックの型・ジャンル・投稿時間・ムード） ----------
// 主の物差しは投稿から24時間の再生（なければ最新の累計）。媒体ごとに分けて出す
function trends(p) {
  const rows = details[p].filter(d => d.id && d.ageH != null && d.ageH >= 24).map(d => ({ ...d, v24: d.curve && d.curve[24] != null ? d.curve[24] : d.views ?? d.likes }));
  const by = key => { const g = {}; for (const r of rows) { const k2 = r[key] || '不明'; (g[k2] = g[k2] || []).push(r.v24); } return Object.entries(g).map(([k2, a]) => ({ key: k2, n: a.length, med: med(a), avg: avg(a) })).sort((x, y) => (y.med || 0) - (x.med || 0)); };
  const i2 = id => info(id);
  rows.forEach(r => { const x = i2(r.id); r.mood = x.mood; });
  return { n: rows.length, hook: by('hook'), cat: by('cat'), slot: by('slot'), mood: by('mood') };
}
const trend = Object.fromEntries(Object.keys(PLATS).map(p => [p, trends(p)]));

// ---------- 在庫と TikTok ----------
const upcoming = queue.filter(id => !rendered.has(id) && fs.existsSync(path.join(LAB, `engine/videos/${id}.js`)));
const ttMatched = new Set(Object.keys(series.tt).map(k => idOf('tt', k)).filter(Boolean));
const ttTodo = Object.entries(items).filter(([, i]) => i.status === 'published').sort((a, b) => (a[1].publishedAt || 0) - (b[1].publishedAt || 0)).map(([id]) => id).filter(id => !ttMatched.has(id));
const latest = snaps.at(-1);
const errors = Object.keys(PLATS).map(p => latest[p] && latest[p].error ? `${PLATS[p]}：${latest[p].error}` : '').filter(Boolean);
const alerts24 = (st.alerts || []).filter(a => a.t > T - D);

// ---------- 書き出し ----------
const out = [];
out.push(`# 集計 ${ymd(T)}（${md(T - D)} → ${md(T)}）`);
out.push(`記録の期間：${md(firstT)}〜（${Math.round(covered)}時間分）${covered < 24 ? '　※まだ24時間たってないので前日比は出せる範囲だけ' : ''}`);
out.push('');
out.push('## 接続の状態');
const f = st.flags || {};
out.push(`- インスタ：${f.igInsights === 'ok' ? '再生・保存・視聴時間まで取れてる' : f.igInsights === 'no_permission' ? 'インサイト権限なし（再生数が取れない。いいねで代用）' : '確認中'}`);
out.push(`- YouTube：${f.yt ? (f.ytScope ? '接続済み（アナリティクスも可）' : '接続済み（アナリティクス権限なし。LINEで YouTube再接続 が必要）') : '未接続'}${st.ytAnalyticsError ? ` ／アナリティクスのエラー：${st.ytAnalyticsError.slice(0, 120)}` : ''}`);
out.push(`- TikTok：${f.tt === 'api' ? 'API接続済み（動画ごとの再生まで）' : '公開ページから（フォロワー・いいね・投稿数だけ）'}`);
if (st.line) out.push(`- LINEの送信数：今月 ${n(st.line.used)} / ${st.line.limit == null ? '上限なし' : n(st.line.limit)}`);
if (errors.length) out.push(`- 直近の取得エラー：${errors.join(' ／ ')}`);
out.push('');
out.push('## 全体（直近24時間）');
out.push('| 媒体 | フォロワー | 24h増減 | 前日の増減 | 24h再生（指標） | 前日の再生 | 7日の再生 |');
out.push('|---|---|---|---|---|---|---|');
for (const p of Object.keys(PLATS)) { const a = w24[p], b = wPrev[p]; out.push(`| ${PLATS[p]} | ${n(a.followers)} | ${sgn(a.followersDelta)} | ${sgn(b.followersDelta)} | ${n(a.total)}（${a.metric}） | ${n(b.total)} | ${n(w7[p].total)} |`); }
out.push('');
for (const p of Object.keys(PLATS)) {
  const ds = details[p]; if (!ds.length) continue;
  out.push(`## ${PLATS[p]} の動画（24時間で伸びた順）`);
  out.push('| 番号 | タイトル | 型 | ジャンル | 投稿 | 経過h | 24h増 | 累計 | 平均比 | いいね率 | コメ率 | 保存率 | シェア率 | 平均視聴秒 |');
  out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const d of [...ds].sort((a, b) => (b.gain24 || 0) - (a.gain24 || 0)).slice(0, 15)) {
    out.push(`| ${d.id || '-'} | ${d.title} | ${d.hook} | ${d.cat} | ${d.slot} | ${n(d.ageH)} | ${sgn(d.gain24)} | ${n(d.views ?? d.likes)} | ${d.vsAvg ? `${d.vsAvg.x.toFixed(1)}倍(${d.vsAvg.h}h)` : '-'} | ${pct(d.likeRate)} | ${pct(d.commentRate)} | ${pct(d.saveRate)} | ${pct(d.shareRate)} | ${d.watchSec == null ? '-' : d.watchSec.toFixed(1)} |`);
  }
  out.push(`平均的な伸び（中央値）：${CHECK.map(h => `${h}h ${n(curveBase[p][h])}`).join(' ／ ')}`);
  out.push('');
}
out.push('## 傾向（投稿から24時間の再生の中央値。本数が少ないうちは参考程度）');
for (const p of Object.keys(PLATS)) {
  const t = trend[p]; if (!t.n) continue;
  out.push(`### ${PLATS[p]}（${t.n}本）`);
  for (const [name, list] of [['フックの型', t.hook], ['ジャンル', t.cat], ['投稿時間', t.slot], ['ムード', t.mood]]) out.push(`- ${name}：${list.map(x => `${x.key} ${n(x.med)}（${x.n}本）`).join('、')}`);
}
out.push('');
const igd = Object.entries(igDays).sort().slice(-7);
if (igd.length) {
  out.push('## インスタ アカウント全体（日別・最大48時間遅れ）');
  out.push('| 日 | 閲覧 | リーチ | 反応した人 | 反応 | 保存 | シェア | フォロー増減 | リンクタップ |'); out.push('|---|---|---|---|---|---|---|---|---|');
  for (const [d, v] of igd) out.push(`| ${d} | ${n(v.views)} | ${n(v.reach)} | ${n(v.accounts_engaged)} | ${n(v.total_interactions)} | ${n(v.saves)} | ${n(v.shares)} | ${n(v.follows_and_unfollows)} | ${n(v.profile_links_taps)} |`);
  out.push('');
}
const ytd = Object.entries(ytDays).sort().slice(-7);
if (ytd.length) {
  out.push('## YouTube アナリティクス（日別・2〜3日遅れ）');
  out.push('| 日 | 再生 | 平均視聴秒 | 平均視聴率 | 登録+ | 登録- | 高評価 | コメ | 共有 |'); out.push('|---|---|---|---|---|---|---|---|---|');
  for (const [d, v] of ytd) out.push(`| ${d} | ${n(v.views)} | ${n(v.averageViewDuration)} | ${v.averageViewPercentage == null ? '-' : v.averageViewPercentage.toFixed(1) + '%'} | ${n(v.subscribersGained)} | ${n(v.subscribersLost)} | ${n(v.likes)} | ${n(v.comments)} | ${n(v.shares)} |`);
  const v7 = (st.ytAnalytics && st.ytAnalytics.videos7d) || [];
  if (v7.length) { out.push(''); out.push('動画別（7日）：' + v7.slice(0, 10).map(v => { const k = v.video; const id = idOf('yt', k); return `${id || k} 再生${n(v.views)} 視聴率${v.averageViewPercentage == null ? '-' : v.averageViewPercentage.toFixed(0) + '%'} 登録+${n(v.subscribersGained)}`; }).join(' ／ ')); }
  out.push('');
}
if (alerts24.length) { out.push('## 24時間以内の急上昇の通知'); for (const a of alerts24) out.push(`- ${md(a.t)} ${PLATS[a.p]} ${a.title || ''} ${a.kind} +${n(a.gain)} 累計${n(a.total)}`); out.push(''); }
out.push(`## これから書き出す在庫（${upcoming.length}本・上から順）`);
for (const id of upcoming.slice(0, 15)) { const b = { ...metaOf(id), ...(bp[id] || {}) }; out.push(`- ${id} ${b.title || ''}（${b.hook_type || '-'} ／ ${b.cat || '-'} ／ ${b.virality || '-'}）`); }
out.push('');
out.push(`投稿時間：今日 ${(st.postTimesToday || []).join('、')}（通常 ${(st.postTimesDefault || []).join('、')}）`);
if (f.tt === 'api') out.push(`TikTok にまだ上がってない投稿済み動画（古い順）：${ttTodo.join('、') || 'なし'}`);
else out.push(`TikTok に上がってるかは公開ページからは判定できない（API接続後に出る）。インスタ投稿済み：${ttTodo.slice(-6).join('、')}`);

const date = ymd(T);
fs.writeFileSync(`analysis/${date}.md`, out.join('\n') + '\n');
fs.writeFileSync(`analysis/${date}.json`, JSON.stringify({ T, covered, w24, wPrev, w7: Object.fromEntries(Object.entries(w7).map(([p, w]) => [p, { ...w, vids: w.vids.slice(0, 20) }])), details, curveBase, trend, upcoming, ttTodo, alerts24, flags: f, line: st.line }, null, 1));
console.log(out.join('\n'));
