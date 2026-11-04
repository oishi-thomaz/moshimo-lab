// 書き出しの自動運転（.github/workflows/render-chain.yml から。Claude は使わない）
//   node tools/render-chain.mjs moshimo   … daily-render を1本ずつ順番に、今日の本数になるまで動かす
//   node tools/render-chain.mjs quiz      … quiz-render を残りの本数で1回動かす
//   --dry を付けると、動かさずに何をするかだけ出す（手元の確認用）
// 本数は ops/render.json（date が今日の日付のときだけ使う。違えば もしもラボ4・クイズ5）。毎日の定期タスクの tools/today.mjs が翌朝の分を書く。
// 今日（日本時間 5:00 以降）すでに書き出せた本数は state/rendered.txt・state/quiz-rendered.txt を更新した bot の commit から数えるので、
// 何回動いても二重には書き出さない（17:20 の回は朝の残りだけ）。
// 落ちたら同じ番号で1回だけやり直す（書き出せなかった回は記録されないので、番号なしでもう一度動かすと同じ番号が選ばれる）。
// 声の1日の上限（ログに 今日の上限に達した）で落ちたときはやり直さずに止め、17:20 の回（上限が戻った後）が続きをやる。
// 2回続けて落ちたら止める（直すのは毎日の定期タスクの Claude。tools/watch-check.mjs が 要対応 で出す）。
// 在庫が空なら動かさない（空のまま動かすと 在庫切れ の知らせが出るため）。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const acct = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!['moshimo', 'quiz'].includes(acct)) { console.error('使い方: node tools/render-chain.mjs moshimo|quiz [--dry]'); process.exit(1); }
const REPO = process.env.GITHUB_REPOSITORY || 'oishi-thomaz/moshimo-lab';
const WF = acct === 'quiz' ? 'quiz-render.yml' : 'daily-render.yml';
const DEFAULT = { moshimo: 4, quiz: 5 };
const CAP = { moshimo: 6, quiz: 5 }; // 声の1日の上限（1キー100回。もしもラボ1本約15回・クイズ1本約17回）
const LIMIT_RE = /今日の上限に達した/;
const JST = 9 * 3600e3;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const gh = (...a) => execFileSync('gh', ['api', ...a], { encoding: 'utf8', maxBuffer: 64 << 20 });
const ghj = p => JSON.parse(gh(p));
const log = s => console.log(`[${new Date(Date.now() + JST).toISOString().slice(11, 19)}] ${s}`);

const today = new Date(Date.now() + JST).toISOString().slice(0, 10);
const since = Date.parse(`${today}T05:00:00+09:00`);
const sinceIso = new Date(since).toISOString();
const evening = new Date(Date.now() + JST).getUTCHours() >= 12;

function target() {
  let plan = {};
  try { plan = JSON.parse(fs.readFileSync('ops/render.json', 'utf8')); } catch {}
  const v = plan.date === today && Number.isFinite(plan[acct]) ? plan[acct] : DEFAULT[acct];
  return Math.max(0, Math.min(CAP[acct], v));
}
// 今日書き出せた本数（bot の commit：rendered NNNN／quiz rendered qNNN qNNN …）
function doneToday() {
  const file = acct === 'quiz' ? 'state/quiz-rendered.txt' : 'state/rendered.txt';
  const commits = ghj(`repos/${REPO}/commits?path=${file}&since=${sinceIso}&per_page=100`);
  let n = 0;
  for (const c of commits) {
    const m = c.commit.message.split('\n')[0];
    if (acct === 'moshimo' && /^rendered \d{4}\b/.test(m)) n++;
    if (acct === 'quiz') { const q = m.match(/^quiz rendered (.*)$/); if (q) n += (q[1].match(/q\d{3}/g) || []).length; }
  }
  return n;
}
const runsToday = () => (ghj(`repos/${REPO}/actions/workflows/${WF}/runs?per_page=50&created=>=${sinceIso}`).workflow_runs || []);
const logsOf = id => (ghj(`repos/${REPO}/actions/runs/${id}/jobs`).jobs || []).map(j => { try { return gh(`repos/${REPO}/actions/jobs/${j.id}/logs`); } catch { return ''; } }).join('\n');
function stock(n) {
  // 在庫は必ず最新の main で数える（古いままだと書き出し済みの回をもう一度選んでしまう）。取れなければ例外で止める
  if (process.env.CI) { execFileSync('git', ['fetch', '-q', '--depth=1', 'origin', 'main']); execFileSync('git', ['reset', '-q', '--hard', 'origin/main']); }
  const out = execFileSync('node', [acct === 'quiz' ? 'tools/quiz-next.mjs' : 'tools/next.mjs', String(n)], { encoding: 'utf8' }).trim();
  return out ? out.split(/\s+/) : [];
}
async function waitIdle() {
  for (let i = 0; i < 180; i++) {
    const busy = runsToday().filter(r => r.status !== 'completed');
    if (!busy.length) return;
    if (i === 0) log(`${WF} が動いているので終わるまで待つ（${busy.map(r => r.id).join(' ')}）`);
    await sleep(60e3);
  }
  throw new Error('前の書き出しが3時間たっても終わらない');
}
async function dispatchAndWait(inputs) {
  const before = new Set(runsToday().map(r => r.id));
  const args = ['-X', 'POST', `repos/${REPO}/actions/workflows/${WF}/dispatches`, '-f', 'ref=main'];
  for (const [k, v] of Object.entries(inputs)) args.push('-f', `inputs[${k}]=${v}`);
  gh(...args);
  let run;
  for (let i = 0; i < 60 && !run; i++) { await sleep(10e3); run = runsToday().find(r => !before.has(r.id) && r.event === 'workflow_dispatch'); }
  if (!run) throw new Error(`${WF} が始まらない`);
  log(`${WF} run ${run.id} を開始`);
  for (let i = 0; i < 300 && run.status !== 'completed'; i++) { await sleep(30e3); run = ghj(`repos/${REPO}/actions/runs/${run.id}`); }
  log(`${WF} run ${run.id}：${run.conclusion}`);
  return run;
}

const want = target();
let done = doneToday();
const runs = runsToday();
log(`${acct}：今日の本数 ${want}、書き出し済み ${done}${evening ? '（夕方の回）' : ''}`);
if (done >= want) { log('今日の分は済み'); process.exit(0); }
if (evening && runs.length) {
  // 夕方は、朝が声の上限で止まった続きだけ（ほかの理由で止まったものは Claude が直す）
  const failed = runs.filter(r => r.status === 'completed' && r.conclusion !== 'success').concat(acct === 'quiz' ? runs.filter(r => r.conclusion === 'success') : []);
  const limited = failed.some(r => LIMIT_RE.test(logsOf(r.id)));
  if (!limited) { log('朝の書き出しが声の上限で止まった形跡がないので、夕方はやらない'); process.exit(0); }
  log('朝は声の上限で止まった。上限が戻ったので続きをやる');
}
if (DRY) { log(`（dry）在庫の次：${stock(want - done).join(' ') || 'なし'}。ここで ${WF} を動かす`); process.exit(0); }

await waitIdle();
const tries = {};
while (true) {
  done = doneToday();
  const need = want - done;
  if (need <= 0) { log(`今日の ${want} 本が済んだ`); break; }
  const all = stock(acct === 'quiz' ? need + 5 : 1);
  const ids = all.filter(id => (tries[id] || 0) < 2).slice(0, acct === 'quiz' ? need : 1);
  if (!all.length) { log('在庫が空なので止める（台本・動画の制作は毎日の定期タスク）'); break; }
  if (!ids.length) { log(`${all[0]} が2回続けて落ちたので止める（Claude が直す）`); process.exitCode = 1; break; }
  for (const id of ids) tries[id] = (tries[id] || 0) + 1;
  log(`次：${ids.join(' ')}（あと ${need} 本${ids.some(id => tries[id] > 1) ? '・やり直しあり' : ''}）`);
  // もしもラボは番号なし（書き出せた回だけ rendered.txt に記録されるので、落ちた回は次も同じ番号が選ばれる）。クイズは番号を指定（記録もされる）
  const run = await dispatchAndWait(acct === 'quiz' ? { id: ids.join(' ') } : {});
  await sleep(15e3); // bot の commit が API に出るまで
  const got = doneToday() - done;
  if (run.conclusion === 'success' && got >= (acct === 'quiz' ? ids.length : 1)) continue;
  if (LIMIT_RE.test(logsOf(run.id))) { log('声の1日の上限で止まった。17:20 の回で続きをやる'); break; }
  log(acct === 'quiz' ? `書き出せたのは ${got} 本。落ちた回は1回だけやり直す` : '落ちたので同じ番号でもう1回だけやる');
}
