// なにこれ通信：カルーセルの画像（render.py の <id>_1.jpg …）から、ナレーションつきのリール（1080x1920）を作る（2026/11/10〜 見本）
//   GEMINI_API_KEY=... node tools/news/reel.mjs out/news/<id>
// できるもの：out/news/<id>/<id>_reel.mp4（と <id>_reel_cover.jpg）
// 声：落ち着いた女性（2026/11/10 ゆうと）。NEWS_VOICE で変えられる（既定 Kore）。Gemini の声が作れなければ止める（声なしのリールは作らない）
// 画面は tools/news/reel_compose.py（上に見出し・真ん中に写真・下に字幕。文字だけの画面は作らない）
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = process.argv[2];
if (!dir) { console.error('使い方：node tools/news/reel.mjs out/news/<id>'); process.exit(1); }
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
const id = meta.id;
const KEY = process.env.GEMINI_API_KEY || '';
const MOCK = process.env.NEWS_MOCK === '1'; // 手元の確認用：声の代わりに文字数ぶんの無音
if (!KEY && !MOCK) { console.error('GEMINI_API_KEY がない'); process.exit(2); }
const MODEL = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
const VOICE = process.env.NEWS_VOICE || 'Kore';
const STYLE = 'Calm Japanese female news anchor. Warm, clear and natural, slightly brisk. No exaggeration.';
const imgs = fs.readdirSync(dir).filter(f => new RegExp(`^${id}_\\d+\\.jpg$`).test(f)).sort((a, b) => Number(a.match(/_(\d+)\.jpg$/)[1]) - Number(b.match(/_(\d+)\.jpg$/)[1]));
if (imgs.length < 2) { console.error('スライドの画像がない（先に render.py）'); process.exit(1); }

// ---------- 読む文：1枚目は見出し、そのあとはスライドの文、最後はオチと問いかけ ----------
const clean = s => String(s || '').replace(/[「」『』]/g, '').replace(/…/g, '、').replace(/〜/g, 'から').trim();
const end = s => /[。！？!?]$/.test(s) ? s : s + '。';
const texts = [end(clean((meta.title || []).join(''))), ...(meta.pages || []).map(s => end(clean(s)))];
if (imgs.length > texts.length) texts.push([meta.punch, meta.ask].map(clean).filter(Boolean).map(end).join(''));
const n = Math.min(imgs.length, texts.length);

// ---------- 声 ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
function wavFromPcm(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
function findAudio(o) {
  if (!o || typeof o !== 'object') return null;
  if (typeof o.data === 'string' && /audio|pcm|wav/i.test(o.mimeType || o.mime_type || '')) return o;
  for (const v of Object.values(o)) { const r = findAudio(v); if (r) return r; }
  return null;
}
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
  const txt = await res.text();
  if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`); e.status = res.status; throw e; }
  return JSON.parse(txt);
}
async function tts(text) {
  const base = 'https://generativelanguage.googleapis.com/v1beta';
  try {
    const j = await post(`${base}/interactions`, {
      model: MODEL,
      input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: STYLE }] }] }],
      response_format: { type: 'audio' }, generation_config: { speech_config: [{ voice: VOICE }] },
    });
    const a = findAudio(j); if (!a) throw new Error('no audio');
    const buf = Buffer.from(a.data, 'base64'); return buf.slice(0, 4).toString() === 'RIFF' ? buf : wavFromPcm(buf);
  } catch (e) {
    if (e.status === 429 || e.status >= 500) throw e;
    const j = await post(`${base}/models/${MODEL}:generateContent`, {
      contents: [{ parts: [{ text: `${STYLE}\n\n${text}` }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
    });
    const a = findAudio(j); if (!a) throw new Error('no audio: ' + JSON.stringify(j).slice(0, 200));
    const buf = Buffer.from(a.data, 'base64'); return buf.slice(0, 4).toString() === 'RIFF' ? buf : wavFromPcm(buf);
  }
}
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const ff = a => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: ['ignore', 'inherit', 'inherit'] });

const work = path.join(dir, 'reel'); fs.mkdirSync(work, { recursive: true });
const voice = [];
for (let i = 0; i < n; i++) {
  const raw = path.join(work, `v${i}.wav`), trim = path.join(work, `v${i}_t.wav`);
  const limit = 2.5 + 0.22 * texts[i].replace(/[、。！？\s]/g, '').length; // 指示文まで読んだ事故は作り直す
  for (let k = 0; ; k++) {
    try {
      if (MOCK) execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=330:duration=${(0.16 * texts[i].length).toFixed(2)}`, '-af', 'volume=0.2', raw]);
      else fs.writeFileSync(raw, await tts(texts[i]));
    }
    catch (e) { if (k >= 4) throw e; console.log(`  声 retry ${k + 1}（${e.message.slice(0, 80)}）`); await sleep(15000 * (k + 1)); continue; }
    ff(['-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', trim]);
    const d = dur(trim);
    if (d <= limit || k >= 3) { voice.push({ wav: trim, d }); console.log(`  ${i + 1}/${n} ${d.toFixed(2)}秒 ${texts[i].slice(0, 30)}`); break; }
    console.log(`  ${i + 1} 長すぎる声 ${d.toFixed(1)}秒（上限 ${limit.toFixed(1)}）→ 作り直し`);
  }
}

// ---------- 尺：1枚＝声の長さ＋間 ----------
const LEAD = 0.3, GAP = 0.4, FPS = 30;
const files = meta.srcFiles || [];
const order = meta.srcOrder || files.map((_, k) => k + 1);
const fileOf = k => { const at = order.indexOf(Number(k)); return at >= 0 ? at : -1; }; // 投稿の imgs の番号 → 取れた写真の番号
const segs = []; let acc = 0, cyc = 0;
for (let i = 0; i < n; i++) {
  const d = voice[i].d + GAP + (i === 0 ? LEAD : 0) + (i === n - 1 ? 1.0 : 0);
  let photo = i === 0 ? fileOf(meta.coverImg || 1) : (i - 1 < (meta.pageImg || []).length && meta.pageImg[i - 1] > 0 ? fileOf(meta.pageImg[i - 1]) : -1);
  if (photo < 0) photo = (i === 0 ? 0 : (cyc++ + 1)) % files.length;
  const last = i === n - 1;
  segs.push({ start: acc, dur: d, vstart: acc + (i === 0 ? LEAD : 0.08), vdur: voice[i].d, photo, move: i % 2 ? 'out' : 'in', pan: ['C', 'L', 'R'][i % 3],
    text: last && n > (meta.pages || []).length + 1 ? clean(meta.punch || texts[i]) : texts[i], big: last && n > (meta.pages || []).length + 1, sub: i === 0 ? false : true });
  acc += d;
}
const total = acc;
const tlp = path.join(work, 'timeline.json');
fs.writeFileSync(tlp, JSON.stringify({ title: meta.title, brand: meta.brand || 'なにこれ通信', photos: files, total, segs }, null, 1));
const vid = path.join(work, 'video.mp4');
execFileSync('python3', [path.join(path.dirname(new URL(import.meta.url).pathname), 'reel_compose.py'), dir, tlp, vid], { stdio: 'inherit' });

// ---------- 音：声を置いて、BGM を小さく敷く ----------
// 声の頭：そのスライドの頭（前のスライドまでの合計）＋1枚目だけ LEAD、ほかは0.08秒
const st = segs.map(x => x.vstart);
const bgm = path.join(work, 'bgm.wav');
let hasBgm = false;
try { execFileSync('python3', [path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'bgm.py'), '--mood', 'calm', '--seed', String(parseInt(id.slice(-4), 10) || 7), '--duration', total.toFixed(2), '--out', bgm], { stdio: 'ignore' }); hasBgm = true; } catch (e) { console.log('  BGM なし', e.message.slice(0, 80)); }
const ins = voice.flatMap(v => ['-i', v.wav]);
let af = voice.map((v, i) => `[${i}]adelay=${Math.round(st[i] * 1000)}|${Math.round(st[i] * 1000)}[a${i}];`).join('');
af += voice.map((v, i) => `[a${i}]`).join('') + `amix=inputs=${n}:normalize=0[vo];`;
if (hasBgm) af += `[${n}]volume=0.16,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[bg];[vo][bg]amix=inputs=2:normalize=0[mx];[mx]`;
else af += `[vo]`;
af += `loudnorm=I=-14:TP=-1.5:LRA=11,apad,atrim=0:${total.toFixed(3)}[a]`;
const audio = path.join(work, 'audio.wav');
ff([...ins, ...(hasBgm ? ['-i', bgm] : []), '-filter_complex', af, '-map', '[a]', '-ar', '44100', audio]);
const mp4 = path.join(dir, `${id}_reel.mp4`);
ff(['-i', vid, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4]);
fs.copyFileSync(path.join(dir, imgs[0]), path.join(dir, `${id}_reel_cover.jpg`));
console.log(`リール ${mp4}（${total.toFixed(1)}秒・${n}枚・声 ${VOICE}）`);
