#!/usr/bin/env node
// ナレーション（Gemini TTS）を作って、動画と同じ長さの音声トラック1本にする
//   GEMINI_API_KEY=... node tools/narrate.mjs --meta out/0001.json --out out/0001_narr.wav
// 読む文：冒頭のタイトル（0.2秒〜）＋ 字幕（META.subs）を字幕の出る時刻から。
// 1行ずつ声を作り、字幕の時間に収まらないときは少し速める（最大1.35倍）。前の行と重なりそうなら後ろへずらす。
// 読み方の調整：下の READ（全動画共通）と META.narr（{ 字幕の文字: 読む文字 }、動画ごと）。（）の中は読まない。
// GEMINI_API_KEY が無いときは何もせず終了コード 2（build.sh はナレーションなしで続ける）。
// MOCK_TTS=1 のときはAPIを呼ばず、文字数に合わせた長さのダミー音で作る（つなぎ方の確認用）。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1]]]) : a), []));
const KEY = process.env.GEMINI_API_KEY || '';
const MOCK = process.env.MOCK_TTS === '1';
if (!KEY && !MOCK) { console.log('narrate: GEMINI_API_KEY が無いのでナレーションなし'); process.exit(2); }
let MODEL = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
const FALLBACK = ['gemini-3.8-flash-lite-tts']; // 1日の上限に当たったら、別枠のこのモデルで最初から作り直す
const VOICE = process.env.TTS_VOICE || 'Charon';
const meta = JSON.parse(fs.readFileSync(args.meta, 'utf8'));
const DUR = Number(meta.duration);
// 作った声はここに残して使い回す（GitHub Actions のキャッシュで次の書き出しにも引き継ぐ）。30日使ってない声は消す
const work = process.env.NARR_CACHE || path.join(path.dirname(args.out), '..', 'cache', 'narr');
fs.mkdirSync(work, { recursive: true });
for (const f of fs.readdirSync(work)) { try { const st = fs.statSync(path.join(work, f)); if (Date.now() - st.atimeMs > 30 * 86400e3 && Date.now() - st.mtimeMs > 30 * 86400e3) fs.rmSync(path.join(work, f)); } catch {} }

// ---------- 読む文を作る ----------
const READ = [
  [/HYROX/g, 'ハイロックス'], [/SkiErg/g, 'スキーエルグ'], [/m³/g, '立方メートル'], [/Wi-Fi/g, 'ワイファイ'],
  [/(\d)〜(\d)/g, '$1から$2'], [/〜/g, 'から'], [/…/g, '、'], [/結果：/g, '結果。'], [/：/g, '、'],
];
function speak(html) {
  let s = String(html).replace(/<br\s*\/?>/g, '').replace(/<[^>]+>/g, '');
  for (const [k, v] of Object.entries(meta.narr || {})) s = s.split(k).join(v);
  s = s.replace(/（[^）]*）/g, '');
  for (const [re, v] of READ) s = s.replace(re, v);
  return s.trim();
}
const STYLE = 'Calm Japanese documentary narrator. Clear, natural pacing, slightly brisk, no exaggeration.';
const lines = [];
const subs = meta.subs || [];
const firstSub = subs.length ? subs[0][0] : 2.5;
lines.push({ t: 0.2, end: firstSub - 0.05, text: speak(meta.titleHtml || meta.title || ''), style: 'Calm Japanese documentary narrator asking an intriguing question, quietly.' });
subs.forEach(([a, b, txt], i) => {
  const s = String(txt);
  const style = s.startsWith('結果') ? 'Calm Japanese documentary narrator. Take a short beat, then state the result clearly and firmly.'
    : i === subs.length - 1 ? 'Calm Japanese documentary narrator, speaking directly to the viewer with a light, inviting question.' : STYLE;
  lines.push({ t: a, end: (subs[i + 1] ? subs[i + 1][0] : b + 0.3) - 0.05, text: speak(s), style });
});

// ---------- 1行ずつ声を作る ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
function wavFromPcm(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
// レスポンスの中から音声データ（base64）を探す（Interactions API / generateContent の両方に対応）
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
  if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`); e.status = res.status; throw e; }
  return JSON.parse(txt);
}
async function tts(text, style) {
  const base = 'https://generativelanguage.googleapis.com/v1beta';
  try { // Interactions API（今の公式の書き方）
    const j = await post(`${base}/interactions`, {
      model: MODEL,
      input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style }] }] }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice: VOICE }] },
    });
    const a = findAudio(j); if (!a) throw new Error('no audio in response');
    const buf = Buffer.from(a.data, 'base64');
    return buf.slice(0, 4).toString() === 'RIFF' ? buf : wavFromPcm(buf);
  } catch (e) {
    if (e.status === 429 || e.status >= 500) throw e;
    // 予備：generateContent の書き方
    const j = await post(`${base}/models/${MODEL}:generateContent`, {
      contents: [{ parts: [{ text: `${style}\n\n${text}` }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
    });
    const a = findAudio(j); if (!a) throw new Error('no audio in response: ' + JSON.stringify(j).slice(0, 200));
    const buf = Buffer.from(a.data, 'base64');
    return buf.slice(0, 4).toString() === 'RIFF' ? buf : wavFromPcm(buf);
  }
}
const isDaily = e => e.status === 429 && /per day|requests per day|PerDay/i.test(e.message);
async function ttsRetry(text, style) {
  for (let k = 0; ; k++) {
    try { return await tts(text, style); }
    catch (e) {
      if (isDaily(e)) throw e; // 1日の上限：待っても無駄なので上へ
      if (k >= 5 || !(e.status === 429 || e.status >= 500)) throw e;
      const w = 15000 * (k + 1); console.log(`  retry in ${w / 1000}s (${e.message.slice(0, 80)})`); await sleep(w);
    }
  }
}
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

async function makeAll() {
for (const [i, L] of lines.entries()) {
    if (!L.text) continue;
    const h = crypto.createHash('md5').update([MODEL, VOICE, L.style, L.text, MOCK].join('|')).digest('hex').slice(0, 16);
    L.raw = path.join(work, `${h}.wav`);
    if (fs.existsSync(L.raw)) { const now = new Date(); fs.utimesSync(L.raw, now, now); }
    if (!fs.existsSync(L.raw)) {
      if (MOCK) execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=${300 + i * 40}:sample_rate=24000:duration=${(L.text.length * 0.14).toFixed(2)}`, '-ac', '1', L.raw]);
      else { fs.writeFileSync(L.raw, await ttsRetry(L.text, L.style)); await sleep(6500); } // 無料枠は1分あたりの回数に上限があるので間をあける
    }
    // 前後の無音を削る
    L.wav = path.join(path.dirname(args.out), `${meta.id}_${String(i).padStart(2, '0')}_trim.wav`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', L.raw, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '48000', '-ac', '1', L.wav]);
    L.len = dur(L.wav);
    console.log(`${L.t.toFixed(1)}s  ${L.len.toFixed(2)}s  ${L.text}`);
  }
  
  }
for (;;) {
  try { await makeAll(); break; }
  catch (e) {
    if (!isDaily(e)) throw e;
    console.log(`narrate: 1日の上限エラー（${MODEL}）: ${String(e.message).slice(0, 400)}`);
    const next = FALLBACK.shift();
    if (!next || MOCK) { console.log('narrate: 今日の上限に達したのでナレーションなしで作る'); process.exit(2); }
    console.log(`narrate: ${MODEL} が今日の上限。${next} で作り直す`); MODEL = next;
  }
}
// ---------- 時間に合わせて並べる ----------
let prevEnd = 0; const parts = [];
for (const L of lines) {
  if (!L.wav) continue;
  const start = Math.max(L.t, prevEnd + 0.08);
  const room = Math.max(0.5, L.end - start);
  const tempo = Math.min(1.35, Math.max(1, L.len / room));
  const len = L.len / tempo;
  if (L.len / room > 1.35) console.log(`  ! 字幕の時間より長い（${L.len.toFixed(2)}s / ${room.toFixed(2)}s）: ${L.text}`);
  parts.push({ file: L.wav, start, tempo }); prevEnd = start + len;
}
const inputs = parts.flatMap(p => ['-i', p.file]);
const chains = parts.map((p, i) => `[${i}:a]${p.tempo > 1.001 ? `atempo=${p.tempo.toFixed(3)},` : ''}adelay=${Math.round(p.start * 1000)}:all=1[n${i}]`);
const mix = `${parts.map((_, i) => `[n${i}]`).join('')}amix=inputs=${parts.length}:normalize=0:dropout_transition=0,apad=whole_dur=${DUR},atrim=0:${DUR}[out]`;
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', [...chains, mix].join(';'), '-map', '[out]', '-ar', '48000', '-ac', '1', args.out]);
console.log('narration ->', args.out);
