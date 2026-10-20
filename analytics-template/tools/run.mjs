// 解析タスク（Claude のクラウド環境）から vps ワークフローを動かして、終わるまで待つ
//   node tools/run.mjs collect
//   node tools/run.mjs report reports/outbox/2026-10-21.json   ← 先に commit & push しておく
//   node tools/run.mjs control reports/outbox/control-2026-10-21.json
import { execFileSync } from 'node:child_process';
const REPO = 'oishi-thomaz/moshimo-analytics';
const [action, file = ''] = process.argv.slice(2);
const gh = (...a) => execFileSync('gh', ['api', ...a], { encoding: 'utf8' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const latest = () => JSON.parse(gh(`repos/${REPO}/actions/workflows/vps.yml/runs?per_page=1&event=workflow_dispatch`)).workflow_runs[0];
const before = (latest() || {}).id || 0;
gh('-X', 'POST', `repos/${REPO}/actions/workflows/vps.yml/dispatches`, '-f', 'ref=main', '-f', `inputs[action]=${action}`, '-f', `inputs[file]=${file}`);
let run;
for (let i = 0; i < 60; i++) { await sleep(5000); const r = latest(); if (r && r.id !== before) { run = r; break; } }
if (!run) { console.error('ワークフローが始まらない'); process.exit(1); }
for (let i = 0; i < 90 && run.status !== 'completed'; i++) { await sleep(10000); run = JSON.parse(gh(`repos/${REPO}/actions/runs/${run.id}`)); }
console.log(`${action}: ${run.status} ${run.conclusion} ${run.html_url}`);
if (run.conclusion !== 'success') {
  const jobs = JSON.parse(gh(`repos/${REPO}/actions/runs/${run.id}/jobs`)).jobs || [];
  for (const j of jobs) { try { console.log(gh(`repos/${REPO}/actions/jobs/${j.id}/logs`).split('\n').slice(-40).join('\n')); } catch {} }
  process.exit(1);
}
if (action === 'collect') execFileSync('git', ['pull', '-q', '--rebase'], { stdio: 'inherit' });
