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

export { $, el, lastSub, setSub, setTop, setHud, roll };
