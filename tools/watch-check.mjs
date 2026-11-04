// 書き出しの確認（毎日の定期タスクの tools/today.mjs が呼ぶ。ops/render-fix.md）。今日5:00（日本時間）以降のワークフローを見て、直すものがあるかだけを出す。
// 書き出しは render-chain.yml（5:20・17:20）が自動で動かし、落ちた回も1回やり直す。声の1日の上限で落ちた回は 上限待ち（17:20 の回が続きをやる）。
//   node tools/watch-check.mjs
// 出力の最後の行：異常なし／実行中／要対応。終了コード 0＝異常なし、2＝実行中だけ、1＝要対応（上に中身）
// 何もなければ手順書を読まずにそのまま終わってよい（トークンを使わないため）。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const REPO = 'oishi-thomaz/moshimo-lab';
const gh = p => JSON.parse(execFileSync('gh', ['api', p], { encoding: 'utf8', maxBuffer: 64 << 20 }));
const ghText = p => { try { return execFileSync('gh', ['api', p], { encoding: 'utf8', maxBuffer: 64 << 20 }); } catch { return ''; } };
const since = (() => { const d = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); return Date.parse(`${d}T05:00:00+09:00`); })();

const runs = [];
for (let page = 1; page <= 3; page++) {
  const r = gh(`repos/${REPO}/actions/runs?per_page=100&page=${page}`).workflow_runs || [];
  runs.push(...r.filter(x => Date.parse(x.created_at) >= since));
  if (!r.length || Date.parse(r.at(-1).created_at) < since) break;
}
const logsOf = id => (gh(`repos/${REPO}/actions/runs/${id}/jobs`).jobs || []).map(j => ghText(`repos/${REPO}/actions/jobs/${j.id}/logs`)).join('\n');
const readSet = f => new Set(fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split(/\s+/).filter(Boolean) : []);
const rendered = readSet('state/rendered.txt');
const quizRendered = readSet('state/quiz-rendered.txt');

const todo = [], report = [], running = [];
const RENDER = new Set(['daily-render', 'quiz-render', 'preflight', 'render-chain']);
const LIMIT_RE = /今日の上限に達した/;
for (const r of runs) if (r.status !== 'completed' && RENDER.has(r.name)) running.push(`${r.name} ${r.id}`);

// daily-render：落ちた番号が state/rendered.txt に入っていなければ未解決
for (const r of runs.filter(x => x.name === 'daily-render' && x.status === 'completed' && x.conclusion !== 'success')) {
  const L = logsOf(r.id);
  const m = L.match(/video: (\w+)/);
  const id = m ? m[1] : null;
  if (id === 'none') continue;
  if (id && rendered.has(id)) continue;
  const later = runs.some(x => x.name === 'daily-render' && Date.parse(x.created_at) > Date.parse(r.created_at) && x.status !== 'completed');
  if (r.conclusion === 'cancelled' && later) continue;
  if (LIMIT_RE.test(L)) { report.push(`上限待ち：daily-render video ${id || '不明'} は声の1日の上限（17:20 の render-chain が続きをやる。run ${r.id}）`); continue; }
  todo.push(`daily-render ${r.conclusion}：video ${id || '不明'}（run ${r.id}）`);
}
// quiz-render：ログに 書き出しに失敗 と出た回が state/quiz-rendered.txt になければ未解決
for (const r of runs.filter(x => x.name === 'quiz-render' && x.status === 'completed')) {
  const L = logsOf(r.id);
  const failed = new Set([...L.matchAll(/クイズ (q\d+) の書き出しに失敗/g)].map(m => m[1]));
  if (LIMIT_RE.test(L)) { for (const q of failed) if (!quizRendered.has(q)) report.push(`上限待ち：quiz-render ${q} は声の1日の上限（17:20 の render-chain が続きをやる。run ${r.id}）`); continue; }
  for (const q of failed) if (!quizRendered.has(q)) todo.push(`quiz-render：${q} の書き出しに失敗（run ${r.id}）`);
  if (r.conclusion === 'failure' && !failed.size) todo.push(`quiz-render failure（run ${r.id}）`);
}
// preflight：最新が failure なら未解決
const pf = runs.filter(x => x.name === 'preflight' && x.status === 'completed').sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
if (pf && pf.conclusion === 'failure') todo.push(`preflight の最新が failure（run ${pf.id}：${pf.display_title.slice(0, 40)}）`);
// 報告だけ（直さない）
for (const r of runs.filter(x => ['drama-tts', 'drama-publish', 'quiz-cdn'].includes(x.name) && x.status === 'completed' && x.conclusion === 'failure')) {
  const later = runs.some(x => x.name === r.name && x.conclusion === 'success' && Date.parse(x.created_at) > Date.parse(r.created_at));
  if (!later) report.push(`${r.name} failure（run ${r.id}）`);
}

for (const t of todo) console.log(`要対応：${t}`);
for (const t of report) console.log(`報告だけ：${t}`);
for (const t of running) console.log(`実行中：${t}`);
if (todo.length) { console.log('要対応'); process.exit(1); }
if (running.length) { console.log('実行中'); process.exit(2); }
console.log('異常なし');
