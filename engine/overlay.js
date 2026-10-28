import { clamp, fade, easeOut } from './lib.js';

// =====================================================
// overlay
// =====================================================
const $ = (s) => document.querySelector(s);
const el = {
  title: $('#title'), top: $('#topstat'), topLab: $('#topstat .lab'), topVal: $('#topstat .val'),
  hud: $('#hud'), hudLab: $('#hud .lab'), hudVal: $('#hud .val'), sub: $('#sub'), flash: $('#flash'), end: $('#end'), logo: $('#logo')
};
// 文字の見た目の中心を画面の中心にそろえる（全動画共通）
// 行末の 。、 はぶら下げ、行頭・行末のかっこや ？！ は字の中の空きの分だけ詰める
const hang = (html) => String(html).split(/<br\s*\/?>/).map(l => l
  .replace(/([。、])\s*$/, '<span class="hp">$1</span>')
  .replace(/([）」』】])\s*$/, '<span class="he">$1</span>')
  .replace(/([？！])\s*$/, '<span class="hq">$1</span>')
  .replace(/^(\s*(?:<[^>]+>)*)([（「『【])/, '$1<span class="hs">$2</span>')).join('<br>');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
let lastSub = '';
function setSub(t, SUBS) {
  let s = null, op = 0;
  for (const [a, b, txt] of SUBS) if (t >= a && t < b) { s = txt; op = fade(t, a, b, 0.15); }
  if (s !== lastSub) { el.sub.innerHTML = s ? hang(s) : ''; lastSub = s; }
  el.sub.style.opacity = op;
  // タイトルの後ろの暗い帯はタイトルと同じ濃さで出す（setSub は毎フレーム、ショットのあとに呼ばれる）
  const ts = document.getElementById('tscrim'); if (ts) ts.style.opacity = el.title.style.opacity || 0;
}
let lastTopLab = null;
function setTop(lab, val, op, color = '#fff') { if (lab !== lastTopLab) { el.topLab.innerHTML = hang(esc(lab)); lastTopLab = lab; } el.topVal.textContent = val; el.top.style.opacity = op; el.topVal.style.color = color; }
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
  // meta.series：柱シリーズ名（plan/STRATEGY.md）。表紙にバッジ、まとめカードにフォローの一言を出す
  const badge = meta.series ? `<div class="badge sans">${esc(meta.series)}シリーズ</div>` : '';
  // v2：タイトルはインスタ・TikTok の一覧（縦3:4に切り抜かれる）でも切れない位置に大きく。シリーズのバッジはタイトルの下
  if (meta.v2) document.body.classList.add('v2');
  document.getElementById('title').innerHTML = meta.v2 ? hang(meta.titleHtml || meta.title || '') + badge : badge + hang(meta.titleHtml || meta.title || '');
  document.querySelector('#end .t').innerHTML = hang(meta.titleHtml || meta.title || '');
  document.querySelector('#end .s').innerHTML = hang((meta.endStats || []).map(([l, v, y]) => `${esc(l)}<b>${esc(v)}</b>${y ? '（' + esc(y) + '）' : ''}`).join('<br>'));
  document.querySelector('#end .ask').innerHTML = meta.ask ? hang(esc(meta.ask)) + '<small>コメントで教えて</small>' : '';
  const nx = document.querySelector('#end .nx');
  if (nx) nx.innerHTML = meta.series ? `${esc(meta.series)}シリーズは続く<small>フォローして次の回を待ってて</small>` : '';
  document.querySelector('#end .src').innerHTML = hang(meta.sources || '');
}

export { hang, setupCards, $, el, lastSub, setSub, setTop, setHud, roll };
