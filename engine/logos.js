// Logo candidates for もしもラボ. Each returns an SVG string (viewBox 0 0 512 512).
export const LOGOS = {
  // A: 分岐 — 道が二つに分かれる。現実とifの世界
  branch: () => `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16213a"/><stop offset="1" stop-color="#0b111f"/></linearGradient>
    <linearGradient id="gA" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#21c7b2"/><stop offset="1" stop-color="#f7c948"/></linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bgA)"/>
  <path d="M196 430 V250" stroke="#fff" stroke-width="44" stroke-linecap="round" fill="none"/>
  <path d="M196 250 V96" stroke="#fff" stroke-width="44" stroke-linecap="round" fill="none" opacity=".28"/>
  <path d="M196 262 C196 170 330 190 330 96" stroke="url(#gA)" stroke-width="44" stroke-linecap="round" fill="none"/>
  <circle cx="196" cy="258" r="40" fill="#0b111f" stroke="#fff" stroke-width="18"/>
  <circle cx="330" cy="92" r="30" fill="#f7c948"/>
</svg>`,

  // B: フラスコ — ラボ×if。液体の中に if
  flask: () => `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16213a"/><stop offset="1" stop-color="#0b111f"/></linearGradient>
    <linearGradient id="lqB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#21c7b2"/><stop offset="1" stop-color="#f7c948"/></linearGradient>
    <clipPath id="fcB"><path d="M214 92 H298 V196 L398 380 Q414 420 372 420 H140 Q98 420 114 380 L214 196 Z"/></clipPath>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bgB)"/>
  <g clip-path="url(#fcB)">
    <path d="M60 268 Q160 236 256 268 T452 268 V460 H60 Z" fill="url(#lqB)"/>
  </g>
  <path d="M214 92 H298 V196 L398 380 Q414 420 372 420 H140 Q98 420 114 380 L214 196 Z" fill="none" stroke="#fff" stroke-width="22" stroke-linejoin="round"/>
  <path d="M196 92 H316" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
  <circle cx="220" cy="350" r="20" fill="#fff" opacity=".55"/>
  <circle cx="292" cy="318" r="13" fill="#fff" opacity=".55"/>
  <circle cx="258" cy="382" r="9" fill="#fff" opacity=".45"/>
  <circle cx="276" cy="232" r="12" fill="#fff" opacity=".85"/>
  <circle cx="246" cy="172" r="8" fill="#fff" opacity=".6"/>
</svg>`,

  // C: if — iの点が光る（ひらめき・月）
  ifdot: () => `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1fb3a1"/><stop offset="1" stop-color="#2a3f86"/></linearGradient>
    <radialGradient id="glC"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#f7c948"/><stop offset="1" stop-color="#f7c948" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bgC)"/>
  <circle cx="240" cy="172" r="70" fill="url(#glC)" opacity=".9"/>
  <circle cx="240" cy="172" r="27" fill="#fff6c8"/>
  <text x="268" y="398" text-anchor="middle" font-family="DM Serif Display" font-style="italic" font-size="280" fill="#fff">ıf</text>
</svg>`,

  // D: パラレル — 現実の円と、点線のもしもの円が重なる
  parallel: () => `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16213a"/><stop offset="1" stop-color="#0b111f"/></linearGradient>
    <clipPath id="cD"><circle cx="206" cy="256" r="126"/></clipPath>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bgD)"/>
  <circle cx="306" cy="256" r="126" fill="#f7c948" clip-path="url(#cD)"/>
  <circle cx="206" cy="256" r="126" fill="none" stroke="#fff" stroke-width="22"/>
  <circle cx="306" cy="256" r="126" fill="none" stroke="#21c7b2" stroke-width="22" stroke-dasharray="30 22" stroke-linecap="round"/>
  <text x="254" y="290" text-anchor="middle" font-family="DM Serif Display" font-style="italic" font-size="96" fill="#0b111f">if</text>
</svg>`,
};
