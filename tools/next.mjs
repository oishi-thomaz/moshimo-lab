// Prints the next video id to render: first id in plan/queue.txt that is not in state/rendered.txt
// and whose engine/videos/<id>.js exists. Prints nothing if the queue is empty.
import fs from 'node:fs';
const read = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').split(/\r?\n/).map(s => s.trim()).filter(s => /^\d{4}$/.test(s));
const done = new Set(read('state/rendered.txt'));
const next = read('plan/queue.txt').find(id => !done.has(id) && fs.existsSync(`engine/videos/${id}.js`));
if (next) process.stdout.write(next);
const left = read('plan/queue.txt').filter(id => !done.has(id) && fs.existsSync(`engine/videos/${id}.js`)).length;
fs.writeFileSync('/tmp/queue_left', String(Math.max(0, left - (next ? 1 : 0))));
