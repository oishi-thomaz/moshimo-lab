// 投稿サーバーに渡す説明ファイル（NNNN.json）を作る
//   node drama/publish/meta.mjs kakusan 2 out/drama/kakusan_ep02.mp4 > out/drama/kakusan_ep02.post.json
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [series, noArg, mp4] = process.argv.slice(2);
const no = Number(noArg), nn = String(no).padStart(2, '0');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sc = await import(pathToFileURL(`${root}/drama/episodes/${series}/ep${nn}.script.js`).href);
const cp = await import(pathToFileURL(`${root}/drama/episodes/${series}/captions.js`).href);
const cap = cp.CAPTIONS[no]; if (!cap) throw new Error(`キャプションがない：${series} ${no}`);
const sec = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
const len = `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const { SERIES, EPISODE } = sc;
const tags = cp.TAGS.map(t => '#' + t).join(' ');
const caption = `${cap}\n\n${tags}`;
const label = EPISODE.no === SERIES.total ? '最終話' : `第${EPISODE.no}話`;
const out = {
  id: String(cp.ID_BASE + no),
  title: `${SERIES.title} ${label} ${EPISODE.title}`,
  caption, hashtags: [], ttCaption: caption, len, ask: EPISODE.ask,
  yt: { title: `${SERIES.title} ${label}「${EPISODE.title}」全${SERIES.total}話 #shorts #ショートドラマ`, desc: `${EPISODE.ask}\n\n${caption}`, tags: [...cp.TAGS, 'shorts'] },
};
process.stdout.write(JSON.stringify(out, null, 1));
