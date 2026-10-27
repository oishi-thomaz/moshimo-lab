#!/usr/bin/env node
// 前の話の声をそのまま使う行（台本の reuse: 'white_ep02/f4' など）を、tts/<name>/ にコピーして index.json に足す
//   node drama/tools/reuse.mjs --script drama/episodes/white/ep03.script.js --tts tts/white_ep03
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1]]]) : a), []));
const mod = await import(pathToFileURL(path.resolve(args.script)).href);
const idxPath = path.join(args.tts, 'index.json');
const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
let n = 0;
for (const L of mod.LINES) {
  if (!L.reuse) continue;
  const [name, id] = L.reuse.split('/');
  const src = path.join('tts', name), si = JSON.parse(fs.readFileSync(path.join(src, 'index.json'), 'utf8'));
  if (!si[id]) throw new Error(`reuse 元が無い: ${L.reuse}`);
  fs.copyFileSync(path.join(src, `${id}.wav`), path.join(args.tts, `${L.id}.wav`));
  idx[L.id] = { ...si[id], reuse: L.reuse }; n++;
}
fs.writeFileSync(idxPath, JSON.stringify(idx, null, 1));
console.log('reuse ->', args.tts, n, 'lines');
