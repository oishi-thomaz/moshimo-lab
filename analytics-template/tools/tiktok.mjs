// TikTok の数字を、公開されているプロフィールの埋め込み用ページから読む（GitHub Actions の中で動く・VPS の取得の予備）
//   node tools/tiktok.mjs moshimo__lab
// フォロワー数と動画ごとの再生数を data/tiktok/YYYY-MM.jsonl に1行追加する（大きい数は TikTok 側で丸められている）。
// TikTok の公式APIは法人の審査が要るので、この方式にしている。
import fs from 'node:fs';
const USER = (process.argv[2] || 'moshimo__lab').replace(/^@/, '');
const num = v => (v == null || isNaN(Number(v)) ? null : Number(v));
const snap = { t: Date.now(), src: 'embed-actions', media: {} };
try {
  const r = await fetch(`https://www.tiktok.com/embed/@${USER}`, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'accept-language': 'ja,en;q=0.8' } });
  const html = await r.text();
  const m = html.match(/<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`埋め込みページが読めない（${r.status}）`);
  let u = null; const vids = [];
  const walk = o => { if (!o || typeof o !== 'object') return; if (o.id && /^\d{15,}$/.test(String(o.id)) && o.playCount != null) vids.push(o); if (o.followerCount != null && o.uniqueId) u = o; for (const v of Object.values(o)) walk(v); };
  walk(JSON.parse(m[1]));
  if (u) Object.assign(snap, { followers: num(u.followerCount), follows: num(u.followingCount), hearts: num(u.heartCount) });
  for (const v of vids) if (!v.privateItem) snap.media[v.id] = { t: Number(BigInt(v.id) >> 32n) * 1000, id: null, views: num(v.playCount), cap: String(v.desc || '').split('\n').join(' ').slice(0, 160) };
} catch (e) { snap.error = String(e.message || e).slice(0, 200); }
fs.mkdirSync('data/tiktok', { recursive: true });
fs.appendFileSync(`data/tiktok/${new Date(snap.t + 9 * 3600e3).toISOString().slice(0, 7)}.jsonl`, JSON.stringify(snap) + '\n');
console.log(`TikTok: followers ${snap.followers ?? '-'} / videos ${Object.keys(snap.media).length}${snap.error ? ` / ${snap.error}` : ''}`);
