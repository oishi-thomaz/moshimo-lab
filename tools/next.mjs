// Prints the next video id to render: first id in plan/queue.txt that is not in state/rendered.txt
// and whose engine/videos/<id>.js exists. Prints nothing if the queue is empty.
import fs from 'node:fs';
const read = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').split(/\r?\n/).map(s => s.trim()).filter(s => /^\d{4}$/.test(s));
const done = new Set(read('state/rendered.txt'));
const ok = id => !done.has(id) && fs.existsSync(`engine/videos/${id}.js`);
const isV2 = id => /v2:\s*true/.test(fs.readFileSync(`engine/videos/${id}.js`, 'utf8'));
// 2026/10/28〜：新しい冒頭（META.v2）に作り替えた回を先に出す。v2 の在庫がないときだけ古い作りの回を出す
const next = read('plan/queue.txt').find(id => ok(id) && isV2(id)) || read('plan/queue.txt').find(ok);
if (next) process.stdout.write(next);
const left = read('plan/queue.txt').filter(id => !done.has(id) && fs.existsSync(`engine/videos/${id}.js`)).length;
fs.writeFileSync('/tmp/queue_left', String(Math.max(0, left - (next ? 1 : 0))));
