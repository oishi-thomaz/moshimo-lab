// 投稿サーバーに渡す説明ファイル（NNNN.json）を作る
//   node drama/publish/meta.mjs kakusan 2 out/drama/kakusan_ep02.mp4 > out/drama/kakusan_ep02.post.json
//   PART=1|2 で前編・後編（番号は ID_BASE＋10×話数＋PART。置き配 第1話 前編＝4011）。
//   キャプションは captions.js の PART_CAPTIONS[話数][PART] があればそれ、なければ CAPTIONS の1行目に 前編／後編 を足す
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [series, noArg, mp4] = process.argv.slice(2);
const no = Number(noArg), nn = String(no).padStart(2, '0');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sc = await import(pathToFileURL(`${root}/drama/episodes/${series}/ep${nn}.script.js`).href);
const cp = await import(pathToFileURL(`${root}/drama/episodes/${series}/captions.js`).href);
const part = Number(process.env.PART || 0);
if (part && part !== 1 && part !== 2) throw new Error(`PART は 1 か 2：${process.env.PART}`);
const pname = part ? (part === 1 ? '前編' : '後編') : '';
let cap = part && cp.PART_CAPTIONS?.[no]?.[part];
if (!cap) {
  cap = cp.CAPTIONS[no]; if (!cap) throw new Error(`キャプションがない：${series} ${no}`);
  if (part) {
    const ls = cap.split('\n');
    ls[0] = ls[0].replace(/(第\d+話) /, `$1 ${pname} `);
    if (part === 1) ls[ls.length - 1] = `▶ 第${no}話 後編 に続く`;
    cap = ls.join('\n');
  }
}
const sec = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
const len = `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const { SERIES, EPISODE } = sc;
const tags = cp.TAGS.map(t => '#' + t).join(' ');
const caption = `${cap}\n\n${tags}`;
const label = (EPISODE.no === SERIES.total ? '最終話' : `第${EPISODE.no}話`) + (pname ? ' ' + pname : '');
const out = {
  id: String(cp.ID_BASE + (part ? 10 * no + part : no)),
  title: `${SERIES.title} ${label} ${EPISODE.title}`,
  caption, hashtags: [], ttCaption: caption, len, ask: EPISODE.ask,
  yt: { title: `${SERIES.title} ${label}「${EPISODE.title}」全${SERIES.total}話 #shorts #ショートドラマ`, desc: `${EPISODE.ask}\n\n${caption}`, tags: [...cp.TAGS, 'shorts'] },
};
process.stdout.write(JSON.stringify(out, null, 1));
