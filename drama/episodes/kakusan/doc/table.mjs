// node table.mjs 02 → 第2話の脚本表（markdown）。時間は out/drama/kakusan_ep02.json、画面の説明は k2.json
import fs from 'node:fs';
const ep = process.argv[2], n = Number(ep);
const root = '/home/claude/moshimo-lab';
const m = await import(`${root}/drama/episodes/kakusan/ep${ep}.script.js`);
const meta = JSON.parse(fs.readFileSync(`${root}/out/drama/kakusan_ep${ep}.json`));
const V = JSON.parse(fs.readFileSync(`${root}/drama/episodes/kakusan/doc/k${n}.json`));
const T = {}; for (const l of meta.lines) T[l.id] = l.t0; for (const s of meta.shots) T[s[0]] ??= s[1];
const name = { A: 'アカリ（心の声）', AS: 'アカリ', S: 'ミサキ', O: '鬼塚', OL: '鬼塚', M: '真壁（刑事）', ML: '真壁（刑事）', K: '健人', KL: '健人', X: '投稿' };
const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const plain = s => String(s || '').replace(/\[\[[a-z]:([^\]]*)\]\]/g, '$1').replace(/／/g, '');
// 読み上げ用のひらがなを、画面の表記に戻す
const fix = s => s.replace(/にじゅうさんじ、じゅうにふん/g, '23時12分').replace(/まるまるハイツ、にーまるさん号室/g, '〇〇ハイツ 203号室').replace(/けんと/g, '健人').replace(/^次回。/, '次回。');
const rows = ['| 時間 | 声 | セリフ | 画面・音 |', '|---|---|---|---|'];
for (const L of m.LINES) {
  if (L.beat === 'title') { rows.push(`| ${fmt(T.title)} | ― | ― | タイトル（表紙） |`); continue; }
  if (L.beat) { if (V[L.beat]) rows.push(`| ${fmt(T[L.beat])} | ― | ― | ${V[L.beat]} |`); continue; }
  const who = L.who === 'X' ? (L.id === 'x1' ? 'ナレーション' : '投稿・メッセージ') : name[L.who];
  const txt = L.text ? plain(L.text) : fix(L.read || '');
  rows.push(`| ${fmt(T[L.id] ?? 0)} | ${who} | ${txt} | ${V[L.id] || ''} |`);
}
console.log(rows.join('\n'));
