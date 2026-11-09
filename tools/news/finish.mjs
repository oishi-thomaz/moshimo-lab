// ニュースアカウント：送り終わった投稿を news-data ブランチの queue/ から片づける（news-build.yml の最後）
//   node tools/news/finish.mjs <news-data のフォルダ> out/news
// 送れた回：queue/ から消して done.txt に「日時 番号 元記事URL」を足す
// 写真が取れない・形が違う回：failed/ に移して理由を書く（同じネタで書き直さない）。サーバーに送れなかった回は queue/ に残して次の回にもう一度
import fs from 'node:fs';
import path from 'node:path';
const DATA = process.argv[2] || 'news-data', OUT = process.argv[3] || 'out/news';
const rd = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
const b = rd(path.join(OUT, '.build.json')), s = rd(path.join(OUT, '.sent.json'));
const now = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
fs.mkdirSync(path.join(DATA, 'failed'), { recursive: true });
for (const [f, id, url] of s.sent || []) {
  const q = path.join(DATA, 'queue', f); if (fs.existsSync(q)) fs.rmSync(q);
  fs.appendFileSync(path.join(DATA, 'done.txt'), `${now} ${id} ${url}\n`);
}
for (const [f, why] of [...(b.ng || []), ...(s.bad || [])]) {
  const q = path.join(DATA, 'queue', f.endsWith('.json') ? f : `${f}.json`);
  if (!fs.existsSync(q)) continue;
  const j = rd(q); j.failed = { at: now, why };
  fs.writeFileSync(path.join(DATA, 'failed', path.basename(q)), JSON.stringify(j, null, 1)); fs.rmSync(q);
}
console.log(`片づけ：送れた ${(s.sent || []).length}本・だめ ${(b.ng || []).length + (s.bad || []).length}本`);
