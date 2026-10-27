#!/usr/bin/env node
// ドラマの声を1行ずつ作る（Gemini TTS）。台本の LINES と CAST から、役ごとの声・演技指示で生成する。
//   GEMINI_API_KEY=... node drama/tools/tts.mjs --script drama/episodes/tower/ep01.script.js --out out/drama/ep01_tts
//   --test 1 : 声の候補を聞き比べる用（ナレーター候補ほか）
// 出力：<out>/<id>.wav（前後の無音を削った 48kHz mono・役の効果は付けない生の声）と <out>/index.json
// 同じ文・声・演技なら cache/drama-tts に残した声を使い回す。MOCK_TTS=1 で文字数に合わせたダミー音。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1]]]) : a), []));
const KEY = process.env.GEMINI_API_KEY || '';
const MOCK = process.env.MOCK_TTS === '1';
if (!KEY && !MOCK) { console.error('GEMINI_API_KEY が無い'); process.exit(2); }
let MODEL = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
const FALLBACK = ['gemini-3.8-flash-lite-tts', 'gemini-2.5-pro-preview-tts', 'gemini-2.5-flash-preview-tts'];
const OUT = args.out; fs.mkdirSync(OUT, { recursive: true });
const CACHE = process.env.TTS_CACHE || 'cache/drama-tts'; fs.mkdirSync(CACHE, { recursive: true });

// ---------- モデル一覧（--models 1） ----------
if (args.models) {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': KEY } });
  const j = await r.json(); const names = (j.models || []).map(m => m.name).filter(n => /tts|audio|speech/i.test(n));
  console.log('TTS MODELS:', names.join(' '));
  fs.writeFileSync(path.join(OUT, 'models.txt'), names.join('\n')); fs.writeFileSync(path.join(OUT, 'index.json'), '{}'); process.exit(0);
}
// ---------- 読む行を集める ----------
const jobs = [];
const plain = s => String(s || '').replace(/\[\[[a-z]+:([^\]]*)\]\]/g, '$1').replace(/／/g, '').replace(/<[^>]+>/g, '');
if (args.test) {
  const T = 'もし大地震が起きた時、あなたがタワマンの、さんじゅうに階にいたら。絶対に、トイレを流すな。';
  const NS = 'Japanese drama narrator for a suspense survival story. Low, calm, serious, slightly tense. Clear diction, measured pace, short dramatic pauses at commas.';
  for (const v of ['Charon', 'Algenib', 'Iapetus', 'Orus', 'Rasalgethi']) jobs.push({ id: `nar_${v}`, voice: v, style: NS, text: T });
  const M = '待って！流しちゃダメ！…明日に、してください。';
  for (const v of ['Kore', 'Aoede', 'Leda', 'Despina']) jobs.push({ id: `mio_${v}`, voice: v, style: 'Japanese woman, 29, inside a dark apartment after an earthquake. Natural, tense, real drama acting.', text: M });
  jobs.push({ id: 'koto_Leda', voice: 'Leda', style: 'A shy 6-year-old Japanese girl, small and sleepy voice, speaking softly to her dad.', text: 'パパ、おトイレ行きたい…' });
  jobs.push({ id: 'koto_Achernar', voice: 'Achernar', style: 'A shy 6-year-old Japanese girl, small and sleepy voice, speaking softly to her dad.', text: 'パパ、おトイレ行きたい…' });
} else {
  const mod = await import(pathToFileURL(path.resolve(args.script)).href);
  if (Array.isArray(mod.TTS_FALLBACK)) FALLBACK.splice(0, FALLBACK.length, ...mod.TTS_FALLBACK);
  for (const L of mod.LINES) {
    if (!L.id || L.reuse) continue; // reuse の行は前の話の声を使う（build 時に reuse.mjs がコピー）
    const c = mod.CAST[L.who];
    const text = (L.read || plain(L.text)).trim();
    if (!text) continue;
    jobs.push({ id: L.id, voice: c.voice, style: L.style || c.style, text, model: L.model || c.model, take: L.take });
  }
}

// ---------- Gemini TTS ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
function wavFromPcm(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
function findAudio(o) {
  if (!o || typeof o !== 'object') return null;
  const mime = o.mime_type || o.mimeType || '';
  if (typeof o.data === 'string' && o.data.length > 100 && (!mime || /audio|wav|l16|pcm/i.test(mime))) return { data: o.data, mime };
  for (const v of Object.values(o)) { const r = findAudio(v); if (r) return r; }
  return null;
}
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
  const txt = await res.text();
  if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${txt.slice(0, 3000)}`); e.status = res.status; throw e; }
  return JSON.parse(txt);
}
const toWav = a => { const b = Buffer.from(a.data, 'base64'); return b.slice(0, 4).toString() === 'RIFF' ? b : wavFromPcm(b); };
async function tts(text, style, voice, model = MODEL) {
  const base = 'https://generativelanguage.googleapis.com/v1beta';
  try {
    const j = await post(`${base}/interactions`, {
      model,
      input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style }] }] }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice }] },
    });
    const a = findAudio(j); if (!a) throw new Error('no audio in response');
    return toWav(a);
  } catch (e) {
    if (e.status === 429 || e.status >= 500) throw e;
    const j = await post(`${base}/models/${model}:generateContent`, {
      contents: [{ parts: [{ text: `${style}\n\nRead this aloud in Japanese:\n${text}` }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    });
    const a = findAudio(j); if (!a) throw new Error('no audio in response: ' + JSON.stringify(j).slice(0, 200));
    return toWav(a);
  }
}
const isDaily = e => e.daily || (e.status === 429 && /per.?day|PerDay|daily|RPD/i.test(e.message));
const isModel = e => e.status === 404 || (e.status === 400 && /model/i.test(e.message));
async function ttsRetry(text, style, voice, model) {
  for (let k = 0; ; k++) {
    try { return await tts(text, style, voice, model); }
    catch (e) {
      if (isDaily(e) || isModel(e)) throw e;
      if (e.status === 429 && k >= 2 && /quota/i.test(e.message)) throw Object.assign(e, { daily: true });
      if (k >= 5 || !(e.status === 429 || e.status >= 500)) throw e;
      const w = 15000 * (k + 1); console.log(`  retry in ${w / 1000}s (${e.message.slice(0, 100)})`); await sleep(w);
    }
  }
}
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

const index = {}; const DEAD = {};
for (const J of jobs) {
  for (;;) {
    let M = J.model || MODEL; while (DEAD[M]) M = DEAD[M];
    const h = crypto.createHash('md5').update([M, J.voice, J.style, J.text, MOCK].join('|') + (J.take ? `|take${J.take}` : '')).digest('hex').slice(0, 16);
    const raw = path.join(CACHE, `${h}.wav`);
    try {
      if (!fs.existsSync(raw)) {
        if (MOCK) execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=330:sample_rate=24000:duration=${(J.text.length * 0.13).toFixed(2)}`, '-ac', '1', raw]);
        else { fs.writeFileSync(raw, await ttsRetry(J.text, J.style, J.voice, M)); await sleep(6500); }
      }
    } catch (e) {
      if ((isDaily(e) || isModel(e)) && FALLBACK.length && !MOCK) { const nx = FALLBACK.shift(); console.log(`${M} が使えない（${e.message.slice(0, 160)}）→ ${nx}`); DEAD[M] = nx; continue; }
      console.log(`止めた：${e.message.slice(0, 1500)}`); throw e;
    }
    const out = path.join(OUT, `${J.id}.wav`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '48000', '-ac', '1', out]);
    index[J.id] = { dur: Number(dur(out).toFixed(3)), voice: J.voice, text: J.text, model: M };
    console.log(`${J.id.padEnd(14)} ${index[J.id].dur.toFixed(2)}s  ${J.voice.padEnd(10)} ${J.text}`);
    break;
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log('tts ->', OUT, Object.keys(index).length, 'lines');
