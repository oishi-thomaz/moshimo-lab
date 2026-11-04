// クイズの投稿サーバー用の説明ファイル out/NNNN.json を作る（out/qNNN.json＝render.mjs --meta の出力から）
// - title の頭に答えを付ける（LINE のカードで見分けるため。インスタのキャプションは caption を使うので見る人には出ない）
// - ttCaption：TikTok のキャプション。答えは絶対に入れない（2026/11/03 ゆうと：TikTok の下書きのキャプションに答えが出ていたのを直す）
//   1行目 この映画／ドラマのタイトルは？🎬（曲の回は この曲のタイトルは？🎵）、2行目 caption の本文の最初の1〜2文（ぼかしたヒント）、3行目 呼びかけ、4行目 答えにつながらないハッシュタグ5つ
// 使い方：node tools/quiz-meta.mjs qNNN   （out/qNNN.json を読んで out/NNNN.json を書く）
import fs from 'node:fs';
const ID = process.argv[2];
if (!/^q\d{3}$/.test(ID || '')) { console.error('usage: node tools/quiz-meta.mjs qNNN'); process.exit(1); }
const N = String(5000 + Number(ID.slice(1)));
const m = JSON.parse(fs.readFileSync(`out/${ID}.json`, 'utf8'));
const q = String(m.title || 'この映画のタイトルは？');
const kind = /ドラマ/.test(q) ? 'ドラマ' : /曲/.test(q) ? '曲' : '映画';
// 本文の2行目（1行目は この〇〇のタイトル、わかる？）から、最初の1〜2文（45文字まで）
const body = String(m.caption || '').split('\n').filter(Boolean)[1] || '';
let hook = '';
for (const s of body.split(/(?<=。)/)) { if (!s) continue; if ((hook + s).length > 45 && hook) break; hook += s; }
// 答え（とその一部）が紛れこんでいたら使わない
const ans = String(m.answer || '').replace(/[\s・／/！!？?、。]/g, '');
const flat = hook.replace(/[\s・／/！!？?、。]/g, '');
if (ans && (flat.includes(ans) || (ans.length >= 4 && [...Array(ans.length - 3).keys()].some(i => flat.includes(ans.slice(i, i + 4)))))) hook = '';
const SERVICES = ['ネトフリ', 'Netflix', 'アマプラ', 'PrimeVideo', 'U-NEXT', 'UNEXT', 'Hulu', 'DisneyPlus', 'ディズニープラス', 'FOD', 'DMMTV'];
const svc = (m.hashtags || []).filter(h => SERVICES.includes(String(h).replace(/\s/g, ''))).slice(0, 2);
// 曲の回（2026/11/04〜）：配信サービスのタグはなく、曲当て用のタグ。絵文字は 🎵
const tags = kind === '曲' ? ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', 'カラオケ']
  : ['タイトル当てクイズ', `${kind}クイズ`, ...svc, `おすすめ${kind}`].slice(0, 5);
m.ttCaption = [`${q}${kind === '曲' ? '🎵' : '🎬'}`, hook, '何秒で、どこでわかった？コメントで教えて👇', tags.map(t => '#' + t).join(' ')].filter(Boolean).join('\n');
m.id = N; m.quizId = ID;
if (m.answer) m.title = m.answer + '｜' + q;
fs.writeFileSync(`out/${N}.json`, JSON.stringify(m, null, 2));
console.log(`meta ${ID} -> out/${N}.json\n${m.ttCaption}`);
