// タイトル当てクイズ：次に書き出す回を出す。plan/quiz-queue.txt の順で、state/quiz-rendered.txt に無く engine/videos/<id>.js がある回
//   node tools/quiz-next.mjs 5   → 最大5本をスペース区切りで出す（在庫の残りは /tmp/quiz_left に書く）
import fs from 'node:fs';
const n = Math.max(1, Number(process.argv[2] || 1));
const read = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').split(/\r?\n/).map(s => s.trim()).filter(s => /^q\d{3}$/.test(s));
const done = new Set(read('state/quiz-rendered.txt'));
const left = read('plan/quiz-queue.txt').filter(id => !done.has(id) && fs.existsSync(`engine/videos/${id}.js`));
process.stdout.write(left.slice(0, n).join(' '));
fs.writeFileSync('/tmp/quiz_left', String(Math.max(0, left.length - n)));
