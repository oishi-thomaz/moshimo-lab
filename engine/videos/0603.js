import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, canvasTex, makePerson } from '../lib.js';
import { stage, makeBar, makeCoins, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, el } from '../story.js';

// もしもドパガキが消えたら、この世界はどうなる？
// ことば
//   ドパガキ：「ドーパミン中毒のガキ」の略。刺激の強いコンテンツをやめられない人を指すネットスラング。自虐で使われることが多い。医学用語ではない。
//   女子高生ラボ（株式会社with t）「2026年夏の流行語7選」（2026年6月19日発表・現役女子高生60人アンケート）に入った。
// 数字
//   総務省 情報通信政策研究所「令和6年度 情報通信メディアの利用時間と情報行動に関する調査」概要（2025年）
//     10代 動画投稿・共有サービスを見る：平日116.0分 / 休日165.4分。10代 テレビ（リアルタイム）視聴：平日39.7分
//   クロス・マーケティング「動画の倍速視聴に関する調査（2024年）」20〜69歳1,100人：倍速視聴経験あり 47.0%
//   CARTA HOLDINGS・電通ほか「2025年 日本の広告費 インターネット広告媒体費 詳細分析」：ビデオ（動画）広告 1兆275億円（2025年）
//   スターミュージック・エンタテインメント「ショート動画白書 vol.8」（2026年3月・15〜69歳1,203人）：ショート動画をきっかけに購買や行動をした人 49.6%（過去半年）
//   文部科学省「令和6年度 全国学力・学習状況調査」（nippon.com 2024年報道）：中3数学、平日のスマホ等の利用4時間以上と30分未満で平均正答率の差18.5ポイント
//     ※相関であり、スマホが原因と決まったわけではない → 「差がある」とだけ言う
// 方針：ドパガキの人数は統計がないので数えない。消えたら起きることは、上の数字から言えることだけ。

const GOLD = '#ffe08a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff', PINK = '#ff7ab8';

// ---------- phone ----------
const feedCols = ['#ff4f7b', '#ffd23f', '#3fd0ff', '#8a5bff', '#41e08a', '#ff8f3f'];
const feedCanvas = document.createElement('canvas'); feedCanvas.width = 128; feedCanvas.height = 224;
const feedTex = new THREE.CanvasTexture(feedCanvas); feedTex.colorSpace = THREE.SRGBColorSpace;
function drawFeed(T) {
  const g = feedCanvas.getContext('2d'); g.fillStyle = '#0d0f14'; g.fillRect(0, 0, 128, 224);
  const off = (T * 260) % 112;
  for (let k = -1; k < 3; k++) {
    const idx = Math.floor(T * 260 / 112) + k; const y = k * 112 - off + 112;
    g.fillStyle = feedCols[((idx % 6) + 6) % 6]; g.fillRect(6, y + 4, 116, 104);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(14, y + 84, 60, 8); g.fillRect(14, y + 96, 40, 6);
  }
  feedTex.needsUpdate = true;
}
function makePhone(scale = 1) {
  const g = new THREE.Group();
  const body = box(0.3, 0.52, 0.04, mat('#1b1d22')); g.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.46), new THREE.MeshBasicMaterial({ map: feedTex })); scr.position.z = 0.022; g.add(scr);
  g.scale.setScalar(scale); return g;
}
// ---------- kid ----------
const kid = makePerson({ skin: '#f1c7a3', hair: '#2a1d16', shirt: '#7a5cff', pants: '#2d3446' });
kid.position.set(0, 0.3, 0); stage.add(kid);
const phone = makePhone(1); phone.position.set(0, 1.12, 0.46); phone.rotation.x = -0.55; kid.add(phone);
const phoneGlow = new THREE.PointLight(0x9fd0ff, 0, 3); phoneGlow.position.set(0, 1.3, 0.6); kid.add(phoneGlow);
function kidPose(scroll, T) {
  const { arms, head } = kid.userData;
  arms[0].rotation.set(lerp(0, -1.15, scroll), 0, lerp(0, 0.35, scroll)); arms[1].rotation.set(lerp(0, -1.15, scroll), 0, lerp(0, -0.35, scroll));
  head.rotation.x = lerp(-0.1, 0.45, scroll) + Math.sin(T * 9) * 0.01 * scroll;
  phone.visible = scroll > 0.05; phone.position.y = lerp(0.6, 1.12, scroll); phoneGlow.intensity = 3 * scroll;
}
// ---------- floating likes / comments ----------
const heartTex = canvasTex(128, 128, (g) => { g.fillStyle = '#ff4f7b'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(-10, 60, 20, 2, 64, 38); g.bezierCurveTo(108, 2, 138, 60, 64, 112); g.fill(); });
const bubTex = canvasTex(128, 128, (g) => { g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(10, 16, 108, 76, 26); g.fill(); g.beginPath(); g.moveTo(34, 88); g.lineTo(26, 116); g.lineTo(58, 90); g.fill(); g.fillStyle = '#3a4258'; for (const x of [40, 64, 88]) { g.beginPath(); g.arc(x, 54, 8, 0, 7); g.fill(); } });
const icons = Array.from({ length: 16 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: i % 3 === 2 ? bubTex : heartTex, transparent: true, depthWrite: false })); stage.add(s); return s; });
function iconsAt(cx, cz, amount, T, spread = 1.6) {
  icons.forEach((s, i) => {
    const ph = (T * 0.45 + i * 0.137) % 1; const on = i < icons.length * amount;
    s.visible = on; if (!on) return;
    s.position.set(cx + Math.sin(i * 2.3) * spread, 1.9 + ph * 3.2, cz + Math.cos(i * 1.7) * 0.6);
    const k = 0.35 + 0.15 * Math.sin(i); s.scale.set(k, k, 1); s.material.opacity = Math.min(1, ph * 5) * (1 - ph);
  });
}
// ---------- word ----------
const wDopa = makeLabel('ドーパミン', { sx: 3.0, size: 70, color: BLUE, stroke: 8 }); stage.add(wDopa);
const wPlus = makeLabel('＋', { sx: 1.2, size: 80, stroke: 8, w: 256 }); stage.add(wPlus);
const wGaki = makeLabel('ガキ', { sx: 2.0, size: 80, color: PINK, stroke: 8, w: 384 }); stage.add(wGaki);
const wWord = makeLabel('ドパガキ', { sx: 4.0, size: 96, color: GOLD, stroke: 10 }); stage.add(wWord);
const wTrend = makeLabel('女子高生が選ぶ 2026夏の流行語', { sx: 4.6, size: 50, bg: 'rgba(255,122,184,.92)', w: 1024, h: 128 }); stage.add(wTrend);
// ---------- bars: video vs tv ----------
const HB = 4.6 / 165.4;
const bVid = makeBar({ color: '#e0457a', label: '動画を見る', x: -1.5, w: 1.8, d: 1.8, nameTop: true });
const bTV = makeBar({ color: '#4f8fd9', label: 'テレビ', x: 1.5, w: 1.8, d: 1.8, nameTop: true });
// ---------- meter ----------
const meter = new THREE.Group(); stage.add(meter); meter.position.set(0, 2.2, 0);
const track = box(4.4, 0.7, 0.4, mat('#2b3a5c')); meter.add(track);
const fillM = mat('#ff7ab8'); const fill = box(4.4, 0.7, 0.42, fillM); fill.geometry.translate(2.2, 0, 0); fill.position.x = -2.2; meter.add(fill);
const meterLab = makeLabel('', { sx: 4.6, size: 52, stroke: 6, w: 1024, h: 128 }); meterLab.position.set(0, 1.1, 0); meter.add(meterLab);
const meterVal = makeLabel('', { sx: 3.2, size: 90, color: GOLD, stroke: 10 }); meterVal.position.set(0, -1.1, 0.3); meter.add(meterVal);
const speedLab = makeLabel('×2', { sx: 2.2, size: 110, color: '#ffffff', stroke: 10, w: 384 }); speedLab.position.set(0, 4.3, 0); stage.add(speedLab);
const bag = new THREE.Group(); stage.add(bag); { const b = box(1.2, 1.3, 0.6, mat('#e9a64a')); b.position.y = 0.95; bag.add(b); for (const s of [-1, 1]) { const h = box(0.06, 0.5, 0.06, mat('#7a4a1a')); h.position.set(s * 0.3, 1.75, 0); bag.add(h); } const hb = box(0.66, 0.06, 0.06, mat('#7a4a1a')); hb.position.y = 2.0; bag.add(hb); bag.position.set(0, 0.3, 0); }
// ---------- crowd ----------
const crowd = makeCrowd(36, 21, { w: 8, d: 4, x: 0, z: 0 });
const crowdPh = crowd.people.map(p => { const ph = makePhone(0.8); ph.position.set(0, 1.1, 0.38); ph.rotation.x = -0.5; p.add(ph); const { arms, head } = p.userData; arms[0].rotation.set(-1.1, 0, 0.3); arms[1].rotation.set(-1.1, 0, -0.3); head.rotation.x = 0.4; return ph; });
const VORDER = crowd.people.map((_, i) => i).sort((a, b) => ((a * 7919) % 36) - ((b * 7919) % 36));
const poof = makeSparkles(400, 0.2, 0xffd6f0); stage.add(poof.points);
const downView = makeLabel('再生数 ▼', { sx: 3.0, size: 70, color: RED, stroke: 8 }); stage.add(downView);
const downCom = makeLabel('コメント ▼', { sx: 3.2, size: 70, color: RED, stroke: 8 }); stage.add(downCom);
// ---------- ad money ----------
const PILES = []; for (let i = 0; i < 8; i++) PILES.push(makeCoins(-2.6 + (i % 4) * 1.75, -0.6 + Math.floor(i / 4) * 1.4, 26));
const adLab = makeLabel('動画広告 1年で1兆275億円', { sx: 4.8, size: 54, color: GOLD, stroke: 6, w: 1024, h: 128 }); adLab.position.set(0, 4.3, 0); stage.add(adLab);
// ---------- movie ----------
const movie = new THREE.Group(); stage.add(movie);
const mvCanvas = document.createElement('canvas'); mvCanvas.width = 512; mvCanvas.height = 288;
{ const g = mvCanvas.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 288); gr.addColorStop(0, '#2a4f8f'); gr.addColorStop(1, '#0f1a33'); g.fillStyle = gr; g.fillRect(0, 0, 512, 288); g.fillStyle = '#ffd77a'; g.beginPath(); g.arc(380, 90, 40, 0, 7); g.fill(); g.fillStyle = '#16233f'; g.beginPath(); g.moveTo(0, 288); g.lineTo(140, 150); g.lineTo(260, 240); g.lineTo(380, 170); g.lineTo(512, 288); g.fill(); g.fillStyle = '#fff'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText('▶ 1.0x', 24, 56); }
const mvTex = new THREE.CanvasTexture(mvCanvas); mvTex.colorSpace = THREE.SRGBColorSpace;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.6), new THREE.MeshBasicMaterial({ map: mvTex })); screen.position.set(0, 3.0, -3); movie.add(screen);
const frame = box(6.7, 3.9, 0.15, mat('#0b0d12')); frame.position.set(0, 3.0, -3.1); movie.add(frame);
// ---------- study gap ----------
const heavy = makePerson({ skin: '#f1c7a3', hair: '#1c1c1c', shirt: '#3c4a6b', pants: '#2d3446' }); heavy.position.set(-1.7, 0.3, 0); stage.add(heavy);
const light = makePerson({ skin: '#e8b98f', hair: '#3a2a1a', shirt: '#3c4a6b', pants: '#2d3446' }); light.position.set(1.7, 0.3, 0); stage.add(light);
{ const ph = makePhone(0.8); ph.position.set(0, 1.1, 0.38); ph.rotation.x = -0.5; heavy.add(ph); const { arms, head } = heavy.userData; arms[0].rotation.set(-1.1, 0, 0.3); arms[1].rotation.set(-1.1, 0, -0.3); head.rotation.x = 0.4; }
const hLab = makeLabel('1日4時間以上', { sx: 2.0, size: 56, bg: 'rgba(20,24,34,.85)' }); hLab.position.set(-1.7, 2.4, 0.3); stage.add(hLab);
const lLab = makeLabel('30分未満', { sx: 2.0, size: 56, bg: 'rgba(20,24,34,.85)' }); lLab.position.set(1.7, 2.4, 0.3); stage.add(lLab);
const gapBar = makeBar({ color: '#e0b04a', x: 0, z: -0.8, w: 1.0, d: 1.0 });
const gapLab = makeLabel('中3数学の正答率の差', { sx: 3.6, size: 52, stroke: 6, w: 768, h: 128 }); gapLab.position.set(0, 5.0, -0.8); stage.add(gapLab);
// ---------- result: free time ----------
const clockLab = makeLabel('＋116分', { sx: 3.4, size: 100, color: GREEN, stroke: 10 }); clockLab.position.set(0, 3.3, 0); stage.add(clockLab);
const freeSpark = makeSparkles(300, 0.18, 0xc8ffe8); stage.add(freeSpark.points);
// ---------- twist: big phone ----------
const bigPhone = new THREE.Group(); stage.add(bigPhone);
{ const b = box(2.4, 4.2, 0.25, mat('#1b1d22')); bigPhone.add(b);
  const c = document.createElement('canvas'); c.width = 256; c.height = 448; const g = c.getContext('2d'); g.fillStyle = '#0d0f14'; g.fillRect(0, 0, 256, 448); g.fillStyle = '#26385e'; g.fillRect(16, 40, 224, 300);
  g.fillStyle = '#fff'; g.font = '900 30px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('もしもラボ', 128, 190); g.fillStyle = '#ff8a7a'; g.font = '900 44px "Noto Sans CJK JP", sans-serif'; g.fillText('0回再生', 128, 400);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Mesh(new THREE.PlaneGeometry(2.16, 3.78), new THREE.MeshBasicMaterial({ map: t })); s.position.z = 0.13; bigPhone.add(s); }
bigPhone.position.set(0, 3.0, 0);

const GROUPS = {
  kid: [kid], word: [wDopa, wPlus, wGaki, wWord, wTrend], bars: [bVid.g, bTV.g], meter: [meter], speed: [speedLab], bag: [bag],
  crowd: [crowd.g, downView, downCom], ads: [...PILES.map(p => p.g), adLab], movie: [movie], gap: [heavy, light, hLab, lLab, gapBar.g, gapLab], clock: [clockLab], big: [bigPhone],
};
function mode(...ms) { for (const k in GROUPS) GROUPS[k].forEach(o => { o.visible = ms.includes(k); }); icons.forEach(s => { s.visible = false; }); }

// ---------- subtitles ----------
const SUBS = [
  [4.2, 8.0, 'ドパガキとは、<br>ドーパミン中毒のガキ。'],
  [8.1, 12.0, 'ショート動画などの刺激を、<br>やめられない人のこと。'],
  [12.1, 16.0, '女子高生が選ぶ<br>2026年夏の流行語にも入った。'],
  [16.1, 20.0, '10代が動画を見る時間は、<br>平日1日116分。'],
  [20.1, 24.0, 'テレビは40分。<br>動画の約3分の1。'],
  [24.1, 28.0, '休日の動画は、<br>165分。'],
  [28.1, 32.0, '動画を倍速で見たことが<br>ある人は、47%。'],
  [32.1, 36.0, 'もし今日、ドパガキが<br>全員消えたら…'],
  [36.1, 40.0, 'まず、再生数とコメントが<br>一気に減る。'],
  [40.1, 44.0, '動画広告は、1年で<br>1兆275億円。'],
  [44.1, 48.0, '見る人が減れば、<br>クリエイターの収入も減る。'],
  [48.1, 52.0, 'ショート動画を見て、買い物や<br>行動をした人は49.6%。'],
  [52.1, 56.0, 'お店の売れ行きにも<br>ひびく。'],
  [56.1, 60.0, 'いいこともある。<br>映画を等速で見られる。'],
  [60.1, 64.0, 'スマホを1日4時間以上使う中3と、<br>30分未満の中3。'],
  [64.1, 68.0, '数学の正答率には、<br>18.5ポイントの差がある。'],
  [68.1, 75.6, '結果：再生もコメントも激減。<br>かわりに1日116分が戻る。'],
  [75.7, 78.3, 'ただし、この動画も<br>誰にも見られない。'],
  [78.4, 81.8, 'あなたはドパガキ？<br>それともバカにする側？'],
];

// ---------- shots ----------
function hookScene(t, T, scroll = 1) {
  mode('kid'); kidPose(scroll, T); drawFeed(T); iconsAt(0, 0, scroll, T, 1.4);
}
function shot0(t, T) { lift(300); hookScene(t, T); const u = ease(t / 4); look(lerp(0.5, 0.2, u), lerp(3.0, 2.8, u), lerp(6.6, 6.0, u), 0, 2.1, 0, 50); el.title.style.opacity = 1; return stage; }
function shotWord(t, T) {
  lift(240); mode('kid', 'word'); kidPose(1, T); drawFeed(T); iconsAt(0, 0, 0.6, T, 1.6);
  const a = easeBack(clamp((t - 0.2) / 0.6)), b = easeBack(clamp((t - 0.9) / 0.6)), m = ease(clamp((t - 2.4) / 0.8));
  wDopa.position.set(lerp(-1.5, 0, m), 3.7, 0); wDopa.scale.set(2.4 * a * (1 - m), 0.6 * a * (1 - m), 1);
  wGaki.position.set(lerp(1.7, 0, m), 3.7, 0); wGaki.scale.set(1.5 * b * (1 - m), 0.5 * b * (1 - m), 1);
  wPlus.position.set(0.45, 3.7, 0); wPlus.scale.set(0.8 * a * (1 - m), 0.4 * a * (1 - m), 1);
  const w = easeBack(clamp((t - 2.9) / 0.6)); wWord.position.set(0, 3.8, 0); wWord.scale.set(3.4 * w, 0.85 * w, 1); wWord.visible = w > 0.01;
  const tr = easeBack(clamp((t - 8.0) / 0.6)); wTrend.position.set(0, 2.9, 0.6); wTrend.scale.set(4.0 * tr, 0.5 * tr, 1); wTrend.visible = tr > 0.01;
  const u = ease(t / 11.9); look(lerp(0.3, 0, u), lerp(2.8, 3.0, u), lerp(10, 10.6, u), 0, 2.3, 0, 50);
  if (t < 3.9) setTop('ネットスラング', 'ドパガキ', fade(t, 0.15, 3.9, 0.2), GOLD);
  else if (t < 7.9) setTop('意味', '刺激をやめられない人', fade(t, 3.9, 7.9, 0.2), PINK);
  else setTop('女子高生ラボ（2026年6月）', '2026夏の流行語7選', fade(t, 7.9, 11.9, 0.2), PINK);
  return stage;
}
function shotBars(t, T) {
  lift(240); mode('bars');
  const g1 = easeOut(clamp((t - 0.2) / 1.4)), g2 = easeOut(clamp((t - 4.1) / 1.2)), g3 = easeOut(clamp((t - 8.1) / 1.2));
  const vid = lerp(116.0, 165.4, g3);
  bVid.setH(vid * HB * g1, g3 > 0.01 ? `${countUp(t - 8.0, 165, 0.1, 1.2)}分` : `${Math.round(116 * g1)}分`);
  bTV.setH(39.7 * HB * g2, g2 > 0.01 && g3 < 0.01 ? '40分' : ''); if (bTV.label) bTV.label.visible = g2 > 0.05;
  bTV.g.visible = g3 < 0.5; bVid.g.position.x = lerp(-1.5, 0, ease(g3));
  if (bVid.label) bVid.label.userData.set?.(g3 > 0.5 ? '休日の動画' : '平日の動画');
  const u = ease(t / 11.9); look(lerp(0, 0.3, u), lerp(4.2, 4.6, u), lerp(14.5, 14.0, u), 0, 3.0, 0, 50);
  if (t < 3.9) setTop('10代 動画を見る時間（平日・総務省）', `${Math.round(116 * g1)}分`, fade(t, 0.15, 3.9, 0.2), PINK);
  else if (t < 7.9) setTop('10代 テレビ（リアルタイム・平日）', '39.7分', fade(t, 3.9, 7.9, 0.2), BLUE);
  else setTop('10代 動画を見る時間（休日・総務省）', '165.4分', fade(t, 7.9, 11.9, 0.2), PINK);
  return stage;
}
function setMeter(frac, lab, val, col) { fill.scale.x = Math.max(0.001, frac); fillM.color.set(col); meterLab.userData.set(lab); meterVal.userData.set(val); }
function shotSpeed(t, T) {
  lift(240); mode('meter', 'speed');
  const k = easeOut(clamp((t - 0.4) / 1.6)); setMeter(0.47 * k, '動画を倍速で見たことがある', `${(47.0 * k).toFixed(1)}%`, '#ff7ab8');
  const s = 1 + Math.sin(T * 10) * 0.05; speedLab.scale.set(2.2 * s, 1.1 * s, 1); speedLab.material.rotation = Math.sin(T * 3) * 0.1;
  meter.position.set(0, 2.2, 0); look(0, 3.2, 11, 0, 2.9, 0, 50);
  setTop('倍速視聴の経験（2024年・20〜69歳）', '47.0%', fade(t, 0.15, 3.9, 0.2), PINK);
  return stage;
}
function shotVanish(t, T) {
  lift(240); mode('crowd'); drawFeed(T);
  const v = clamp((t - 1.6) / 2.6);
  crowd.people.forEach((p, j) => { const i = VORDER.indexOf(j); const k = clamp(v * 1.4 - (i / 36) * 0.4); const s = 1 - easeOut(k); p.scale.setScalar(Math.max(0.001, s)); p.visible = s > 0.01; });
  if (t > 1.5 && t < 6) { poof.init(crowd.people.map(p => [p.position.x, 1.3, p.position.z]), 0.6, 1.8); poof.set(clamp((t - 1.6) / 3.2)); } else poof.set(0);
  iconsAt(0, 0, 1 - v, T, 3.2);
  const d1 = easeBack(clamp((t - 4.3) / 0.5)), d2 = easeBack(clamp((t - 5.0) / 0.5));
  downView.position.set(-1.7, 3.6, 0.5); downView.scale.set(3.0 * d1, 0.75 * d1, 1); downView.visible = d1 > 0.01;
  downCom.position.set(1.7, 2.6, 0.5); downCom.scale.set(3.2 * d2, 0.8 * d2, 1); downCom.visible = d2 > 0.01;
  const u = ease(t / 7.9); look(lerp(0, 0.4, u), lerp(4.6, 5.4, u), lerp(11, 12.5, u), 0, 1.6, 0, 50);
  if (t < 3.9) setTop('もしも', 'ドパガキ全員消滅', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('SNSで起きること', '再生数・コメント ▼', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotAds(t, T) {
  lift(240); mode('ads');
  const grow = easeOut(clamp((t - 0.2) / 1.6)), shrink = ease(clamp((t - 4.4) / 2.4));
  PILES.forEach((p, i) => p.setN(Math.round(26 * grow * (1 - shrink * (0.35 + (i % 3) * 0.1)))));
  const u = ease(t / 7.9); look(lerp(0, 0.3, u), lerp(6.0, 5.6, u), lerp(14.5, 13.8, u), 0, 2.2, 0, 50);
  if (t < 3.9) setTop('動画広告（2025年・電通ほか）', '1兆275億円', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('見る人が減ると', 'クリエイターの収入 ▼', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotShop(t, T) {
  lift(240); mode('meter', 'bag');
  const k = easeOut(clamp((t - 0.4) / 1.6)); setMeter(0.496 * k, 'ショート動画を見て買った・行動した', `${(49.6 * k).toFixed(1)}%`, '#e9a64a');
  meter.position.set(0, 4.2, 0); bag.position.set(0, 0.3, 0); bag.rotation.y = Math.sin(T * 1.5) * 0.3;
  const sad = ease(clamp((t - 4.2) / 1.2)); bag.scale.setScalar(1 - sad * 0.4);
  look(0, 3.6, 12, 0, 2.6, 0, 50);
  if (t < 3.9) setTop('ショート動画白書（2026年3月）', '49.6%', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('お店にも', '売れ行き ▼', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotMovie(t, T) {
  lift(240); mode('kid', 'movie'); kidPose(0, T);
  kid.position.set(0, 0.3, 2.2); kid.rotation.y = Math.PI;
  const u = ease(t / 3.9); look(lerp(1.2, 0.6, u), lerp(3.6, 3.6, u), lerp(9.5, 9.0, u), 0, 2.6, -2, 50);
  setTop('いいこと①', '映画を等速で見られる', fade(t, 0.15, 3.9, 0.2), GREEN);
  return stage;
}
function shotGap(t, T) {
  lift(240); mode('gap'); drawFeed(T);
  const k = easeOut(clamp((t - 4.4) / 1.4)); gapBar.setH(18.5 * 0.16 * k, k > 0.01 ? `${(18.5 * k).toFixed(1)}pt` : '');
  gapLab.visible = t > 4.0;
  const u = ease(t / 7.9); look(lerp(0, 0.2, u), lerp(3.2, 3.6, u), lerp(10, 10.8, u), 0, 2.2, 0, 50);
  if (t < 3.9) setTop('全国学力・学習状況調査（2024年度）', '中3', fade(t, 0.15, 3.9, 0.2));
  else setTop('中3数学 正答率の差（4時間以上と30分未満）', '18.5ポイント', fade(t, 3.9, 7.9, 0.2), GOLD);
  return stage;
}
function shotResult(t, T) {
  lift(260); mode('kid', 'clock');
  kid.position.set(0, 0.3, 0); kid.rotation.y = 0;
  const down = ease(clamp((t - 0.4) / 1.4)); kidPose(1 - down, T); drawFeed(T);
  const c = easeBack(clamp((t - 1.6) / 0.6)); clockLab.scale.set(3.4 * c, 0.85 * c, 1); clockLab.visible = c > 0.01;
  freeSpark.init([[0, 2.2, 0]], 1.2, 2.4); freeSpark.set(clamp((t - 1.6) / 2.4));
  const u = ease(t / 7.5); look(lerp(0.4, 0.1, u), lerp(2.8, 3.0, u), lerp(8.5, 9.2, u), 0, 2.2, 0, 50);
  if (t < 3.6) setTop('SNSは', '再生もコメントも激減', fade(t, 0.15, 3.6, 0.2), RED);
  else setTop('かわりに戻る時間（10代・平日）', '1日116分', fade(t, 3.6, 7.5, 0.2), GREEN);
  return stage;
}
function shotTwist(t, T) {
  lift(240); mode('big');
  bigPhone.rotation.y = Math.sin(T * 0.8) * 0.15; bigPhone.rotation.z = Math.sin(T * 0.5) * 0.04;
  look(0, 3.4, 9.0, 0, 2.6, 0, 50);
  setTop('ただし', 'この動画も 0回再生', fade(t, 0.15, 2.6, 0.2), RED);
  return stage;
}
function shotLoop(t, T) { lift(300); kid.position.set(0, 0.3, 0); kid.rotation.y = 0; hookScene(t, T); const u = ease(t / 3.4); look(lerp(0.5, 0.3, u), lerp(3.0, 2.9, u), lerp(6.6, 6.3, u), 0, 2.1, 0, 50); return stage; }

const shots = [
  { a: 0, b: 4.1, f: shot0 }, { a: 4.1, b: 16.0, f: shotWord }, { a: 16.0, b: 28.0, f: shotBars }, { a: 28.0, b: 32.0, f: shotSpeed },
  { a: 32.0, b: 40.0, f: shotVanish }, { a: 40.0, b: 48.0, f: shotAds }, { a: 48.0, b: 56.0, f: shotShop }, { a: 56.0, b: 60.0, f: shotMovie },
  { a: 60.0, b: 68.0, f: shotGap }, { a: 68.0, b: 75.6, f: shotResult }, { a: 75.6, b: 78.3, f: shotTwist }, { a: 78.3, b: 82.0, f: shotLoop },
  { a: 82.0, b: 86.0, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 86.0,
  meta: {
    id: '0603',
    title: 'ドパガキが消えたら、この世界はどうなる？',
    titleHtml: 'ドパガキが消えたら、<br>この世界はどうなる？',
    mood: 'mystery', seed: 603, hits: [33.6, 68.1], risers: [32.0, 68.0],
    impacts: [16.1, 24.1, 28.1, 40.1, 48.1, 64.1, 68.1, 75.7],
    sfx: [[0.3, 'bubble'], [4.4, 'whoosh'], [7.0, 'poof'], [12.1, 'bubble'], [16.3, 'meter', 0.7], [24.2, 'meter', 1.0], [28.4, 'whoosh'], [33.6, 'poof'], [36.1, 'buzz'], [44.5, 'drone'], [64.5, 'meter', 0.5], [69.7, 'whoosh'], [75.8, 'buzz']],
    ask: 'あなたはドパガキ？ それともバカにする側？',
    narr: { 'ドパガキ': 'ドパガキ', '1兆275億円': '1兆275億円', '49.6%': '49.6パーセント', '47%': '47パーセント', '18.5ポイント': '18.5ポイント', '中3': 'ちゅうさん', '1日116分': '1日116分', '等速': 'とうそく' },
    caption: 'ドパガキが消えたら、この世界はどうなる？\n\nドパガキ＝「ドーパミン中毒のガキ」。ショート動画などの刺激をやめられない人を指すネットスラング（自虐で使う人も多い。医学用語ではない）。女子高生ラボの「2026年夏の流行語7選」にも入った。\n\n10代が動画を見る時間は平日1日116分、休日165分。テレビ（リアルタイム）は平日40分。\n動画を倍速で見たことがある人は47.0%。\n\nもしドパガキが全員消えたら…\n・再生数とコメントが一気に減る\n・動画広告は1年で1兆275億円（2025年）。見る人が減ればクリエイターの収入も減る\n・ショート動画を見て買い物や行動をした人は49.6%。お店の売れ行きにもひびく\n\nいいこともある\n・映画を等速で見られる\n・中3数学の正答率は、スマホ等を1日4時間以上使う子と30分未満の子で18.5ポイントの差（スマホが原因と決まったわけではない）\n\n結果：SNSは再生もコメントも激減。そのかわり、10代なら1日116分が戻ってくる。\nただし、この動画も誰にも見られない。\n\nあなたはドパガキ？ それともバカにする側？ コメントで教えて。\n\n出典：総務省 情報通信政策研究所「令和6年度 情報通信メディアの利用時間と情報行動に関する調査」、クロス・マーケティング「動画の倍速視聴に関する調査（2024年）」、CARTA HOLDINGS・電通ほか「2025年 日本の広告費 インターネット広告媒体費 詳細分析」、スターミュージック・エンタテインメント「ショート動画白書 vol.8」、文部科学省「令和6年度 全国学力・学習状況調査」、女子高生ラボ（2026年6月）',
    hashtags: ['もしもラボ', 'ドパガキ', 'ショート動画', 'SNS', '雑学'],
    endStats: [['10代 動画を見る時間', '116分', '平日1日・総務省'], ['倍速視聴の経験', '47.0%', '2024年'], ['動画広告', '1兆275億円', '2025年'], ['ショート動画で購買・行動', '49.6%', '2026年3月調査'], ['中3数学 正答率の差', '18.5pt', '4時間以上と30分未満']],
    sources: '出典：総務省 令和6年度 情報通信メディアの利用時間調査、<br>クロス・マーケティング、電通ほか、ショート動画白書vol.8、文部科学省',
  },
});
