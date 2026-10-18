import { clamp, fade, easeOut } from './lib.js';

// =====================================================
// overlay
// =====================================================
const $ = (s) => document.querySelector(s);
const el = {
  title: $('#title'), top: $('#topstat'), topLab: $('#topstat .lab'), topVal: $('#topstat .val'),
  hud: $('#hud'), hudLab: $('#hud .lab'), hudVal: $('#hud .val'), sub: $('#sub'), flash: $('#flash'), end: $('#end'), logo: $('#logo')
};
let lastSub = '';
function setSub(t, SUBS) {
  let s = null, op = 0;
  for (const [a, b, txt] of SUBS) if (t >= a && t < b) { s = txt; op = fade(t, a, b, 0.15); }
  if (s !== lastSub) { el.sub.innerHTML = s || ''; lastSub = s; }
  el.sub.style.opacity = op;
}
function setTop(lab, val, op, color = '#fff') { el.topLab.textContent = lab; el.topVal.textContent = val; el.top.style.opacity = op; el.topVal.style.color = color; }
function setHud(lab, val, op, opts = {}) {
  el.hudLab.textContent = lab; el.hudVal.textContent = val; el.hud.style.opacity = op;
  el.hudVal.className = 'val ' + (opts.mono ? 'mono' : 'serif');
  el.hudVal.style.color = opts.color || '#fff';
}
const roll = (u, target) => target * easeOut(u);

// Fills the per-video text: the opening title, and the closing card (stats + sources).
// meta.titleHtml: '日本中のコンビニが<br>消えたら？'
// meta.endStats: [['全国のコンビニ店舗数', '56,054店', '2025年末'], ...]
// meta.sources: '出典：...'（<br>可）
function setupCards(meta) {
  document.getElementById('title').innerHTML = meta.titleHtml || meta.title || '';
  document.querySelector('#end .t').innerHTML = meta.titleHtml || meta.title || '';
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  document.querySelector('#end .s').innerHTML = (meta.endStats || []).map(([l, v, y]) => `${esc(l)}<b>${esc(v)}</b>${y ? '（' + esc(y) + '）' : ''}`).join('<br>');
  document.querySelector('#end .src').innerHTML = meta.sources || '';
}

export { setupCards, $, el, lastSub, setSub, setTop, setHud, roll };
