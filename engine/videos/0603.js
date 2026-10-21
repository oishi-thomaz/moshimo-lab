import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, fade, mat, box, canvasTex, makePerson } from '../lib.js';
import { stage, makeBar, makeCoins, makeCrowd, makeLabel } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, el } from '../story.js';

// もしもドパガキが消えたら、この世界はどうなる？
// ことば
//   ドパガキ：「ドーパミン中毒のガキ」の略。刺激の強いコンテンツをやめられない人を指すネットスラング。自虐で使われることが多い。医学用語ではない。
//   女子高生ラボ（株式会社with t）「2026年夏の流行語7選」（2026年6月19日発表・現役女子高生60人）。説明に「ドライヤー中や入浴中にもTikTokをやめられない」。
//   この動画での「消える」＝ドパガキが全員ふつうのガキに戻ること（人がいなくなる意味ではない）。
// 数字
//   総務省 情報通信政策研究所「令和6年度 情報通信メディアの利用時間と情報行動に関する調査」：10代 動画投稿・共有サービスを見る 平日116.0分
//   NTTドコモ モバイル社会研究所（2024年10月21日発表・2024年2月調査・15〜79歳5,719人）：スマホで動画を1日6時間以上見る人は10代男女で約3割
//     → この動画ではドパガキ＝「1日6時間以上動画を見る人」とし、10代の約3割とする
//   クロス・マーケティング「動画の倍速視聴に関する調査（2024年）」：倍速視聴経験あり 47.0%（20〜69歳）
//   YouTube CEO ニール・モーハン（2025年6月 カンヌライオンズ）：YouTubeショートは世界で1日平均2,000億回再生
//   CARTA HOLDINGS・電通ほか「2025年 日本の広告費 インターネット広告媒体費 詳細分析」：ビデオ（動画）広告 1兆275億円（2025年）
//   文部科学省「令和6年度 全国学力・学習状況調査」（nippon.com）：中3数学、スマホ等4時間以上と30分未満で平均正答率の差18.5ポイント（相関。原因とは言わない）
// 試算（仮定を字幕で言う）：視聴の3割が消えたと仮定 → 2,000億×0.3＝600億回/日、1兆275億円×0.3＝3,082.5億円 ≒ 約3,083億円/年

const GOLD = '#ffe08a', RED = '#ff8a7a', GREEN = '#7ff0c8', BLUE = '#7fd4ff', PINK = '#ff7ab8';

// ---------- phone ----------
const feedCols = ['#ff4f7b', '#ffd23f', '#3fd0ff', '#8a5bff', '#41e08a', '#ff8f3f'];
const feedCanvas = document.createElement('canvas'); feedCanvas.width = 128; feedCanvas.height = 224;
const feedTex = new THREE.CanvasTexture(feedCanvas); feedTex.colorSpace = THREE.SRGBColorSpace;
function drawFeed(T, speed = 260) {
  const g = feedCanvas.getContext('2d'); g.fillStyle = '#0d0f14'; g.fillRect(0, 0, 128, 224);
  const off = (T * speed) % 112;
  for (let k = -1; k < 3; k++) {
    const idx = Math.floor(T * speed / 112) + k; const y = k * 112 - off + 112;
    g.fillStyle = feedCols[((idx % 6) + 6) % 6]; g.fillRect(6, y + 4, 116, 104);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(14, y + 84, 60, 8); g.fillRect(14, y + 96, 40, 6);
  }
  feedTex.needsUpdate = true;
}
function makePhone(scale = 1) {
  const g = new THREE.Group();
  g.add(box(0.3, 0.52, 0.04, mat('#1b1d22')));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.46), new THREE.MeshBasicMaterial({ map: feedTex })); scr.position.z = 0.022; g.add(scr);
  g.scale.setScalar(scale); return g;
}
function addPhone(p, scale = 1) { const ph = makePhone(scale); ph.position.set(0, 1.12, 0.46); ph.rotation.x = -0.55; p.add(ph); p.userData.phone = ph; return ph; }
function pose(p, scroll, T = 0) {
  const { arms, head, phone } = p.userData;
  arms[0].rotation.set(lerp(0, -1.15, scroll), 0, lerp(0, 0.35, scroll)); arms[1].rotation.set(lerp(0, -1.15, scroll), 0, lerp(0, -0.35, scroll));
  head.rotation.x = lerp(-0.1, 0.45, scroll) + Math.sin(T * 9) * 0.012 * scroll;
  if (phone) { phone.visible = scroll > 0.05; phone.position.y = lerp(0.6, 1.12, scroll); }
}
// ---------- kids ----------
const dopa = makePerson({ skin: '#f1c7a3', hair: '#2a1d16', shirt: '#7a5cff', pants: '#2d3446' }); stage.add(dopa); addPhone(dopa);
const glow = new THREE.PointLight(0x9fd0ff, 0, 3); glow.position.set(0, 1.3, 0.6); dopa.add(glow);
const futsu = makePerson({ skin: '#e8b98f', hair: '#3a2a1a', shirt: '#41b07a', pants: '#2d3446' }); stage.add(futsu);
const dryer = new THREE.Group(); { const b = box(0.36, 0.22, 0.2, mat('#f2f2f2')); dryer.add(b); const n = box(0.16, 0.16, 0.16, mat('#d9d9d9')); n.position.x = -0.24; dryer.add(n); const h = box(0.1, 0.32, 0.12, mat('#f2f2f2')); h.position.set(0.08, -0.22, 0); dryer.add(h); }
const dryers = [dryer, dryer.clone()]; dryers.forEach(d => stage.add(d));
// ---------- floating likes / comments ----------
const heartTex = canvasTex(128, 128, (g) => { g.fillStyle = '#ff4f7b'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(-10, 60, 20, 2, 64, 38); g.bezierCurveTo(108, 2, 138, 60, 64, 112); g.fill(); });
const bubTex = canvasTex(128, 128, (g) => { g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(10, 16, 108, 76, 26); g.fill(); g.beginPath(); g.moveTo(34, 88); g.lineTo(26, 116); g.lineTo(58, 90); g.fill(); g.fillStyle = '#3a4258'; for (const x of [40, 64, 88]) { g.beginPath(); g.arc(x, 54, 8, 0, 7); g.fill(); } });
const icons = Array.from({ length: 18 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: i % 3 === 2 ? bubTex : heartTex, transparent: true, depthWrite: false })); stage.add(s); return s; });
function iconsAt(cx, cz, amount, T, spread = 1.4, y0 = 1.9) {
  icons.forEach((s, i) => {
    const ph = (T * 0.45 + i * 0.137) % 1; const on = i < icons.length * amount;
    s.visible = on; if (!on) return;
    s.position.set(cx + Math.sin(i * 2.3) * spread, y0 + ph * 3.0, cz + Math.cos(i * 1.7) * 0.6);
    const k = 0.32 + 0.12 * Math.sin(i); s.scale.set(k, k, 1); s.material.opacity = Math.min(1, ph * 5) * (1 - ph);
  });
}
// ---------- word ----------
const wDopa = makeLabel('ドーパミン', { sx: 2.4, size: 70, color: BLUE, stroke: 8 }); stage.add(wDopa);
const wPlus = makeLabel('＋', { sx: 0.8, size: 80, stroke: 8, w: 256 }); stage.add(wPlus);
const wGaki = makeLabel('ガキ', { sx: 1.5, size: 80, color: PINK, stroke: 8, w: 384 }); stage.add(wGaki);
const wWord = makeLabel('ドパガキ', { sx: 3.4, size: 96, color: GOLD, stroke: 10 }); stage.add(wWord);
const wTrend = makeLabel('女子高生が選ぶ 2026夏の流行語', { sx: 4.0, size: 50, bg: 'rgba(255,122,184,.92)', w: 1024, h: 128 }); stage.add(wTrend);
// ---------- versus ----------
const nameL = makeLabel('ふつうのガキ', { sx: 2.2, size: 56, bg: 'rgba(65,176,122,.92)' }); stage.add(nameL);
const nameR = makeLabel('ドパガキ', { sx: 2.2, size: 60, bg: 'rgba(122,92,255,.92)' }); stage.add(nameR);
const vsLab = makeLabel('VS', { sx: 1.2, size: 90, color: GOLD, stroke: 10, w: 256 }); stage.add(vsLab);
const valL = makeLabel('', { sx: 2.6, size: 70, color: '#ffffff', stroke: 8 }); stage.add(valL);
const valR = makeLabel('', { sx: 2.6, size: 70, color: PINK, stroke: 8 }); stage.add(valR);
const HV = 2.6 / 360;
const barL = makeBar({ color: '#41b07a', x: -2.4, z: 0.2, w: 0.6, d: 0.6 });
const barR = makeBar({ color: '#e0457a', x: 2.4, z: 0.2, w: 0.6, d: 0.6 });
// ---------- crowd ----------
const crowd = makeCrowd(30, 33, { w: 7, d: 3.6, x: 0, z: 0 });
const HEAVY = [1, 4, 8, 11, 13, 17, 20, 24, 27];
crowd.people.forEach((p, i) => { if (HEAVY.includes(i)) addPhone(p, 0.8); });
const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 24), new THREE.MeshBasicMaterial({ color: 0xff7ab8, transparent: true, opacity: 0.9 }));
ring.rotation.x = -Math.PI / 2;
const rings = HEAVY.map(i => { const r = ring.clone(); r.material = ring.material; crowd.g.add(r); r.position.copy(crowd.people[i].position); r.position.y = 0.02; return r; });
const pctLab = makeLabel('10代の約3割', { sx: 3.2, size: 76, color: PINK, stroke: 8 }); stage.add(pctLab);
const poof = makeSparkles(300, 0.2, 0xffd6f0); stage.add(poof.points);
const downView = makeLabel('再生 ▼', { sx: 2.4, size: 76, color: RED, stroke: 8 }); stage.add(downView);
const downCom = makeLabel('コメント ▼', { sx: 3.0, size: 76, color: RED, stroke: 8 }); stage.add(downCom);
// ---------- shorts wall ----------
const wall = new THREE.Group(); stage.add(wall);
const tiles = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { const t = makePhone(1.3); t.position.set(-2.7 + c * 0.6, 0.9 + r * 0.78, -0.5); wall.add(t); tiles.push(t); }
const TORDER = tiles.map((_, i) => i).sort((a, b) => ((a * 37) % 60) - ((b * 37) % 60));
const wallLab = makeLabel('1日 2,000億回再生', { sx: 4.2, size: 70, color: GOLD, stroke: 8, w: 768, h: 128 }); wallLab.position.set(0, 6.0, 0); stage.add(wallLab);
const minusLab = makeLabel('−600億回', { sx: 3.4, size: 96, color: RED, stroke: 10 }); minusLab.position.set(0, 3.0, 1.0); stage.add(minusLab);
// ---------- growth chart: should-have vs actual ----------
const GROW = [0.3, 0.5, 0.8, 1.2, 1.7, 2.3, 3.0, 3.8];
const ghost = GROW.map((h, i) => { const b = box(0.5, 1, 0.5, mat('#ffffff', { transparent: true, opacity: 0.16 })); b.geometry.translate(0, 0.5, 0); b.position.set(-2.45 + i * 0.7, 0.3, 0); stage.add(b); return b; });
const real = GROW.map((h, i) => { const b = box(0.5, 1, 0.5, mat('#e0457a')); b.geometry.translate(0, 0.5, 0); b.position.set(-2.45 + i * 0.7, 0.3, 0); stage.add(b); return b; });
const ghostLab = makeLabel('伸びるはずだった', { sx: 3.0, size: 56, color: '#ffffff', stroke: 6, w: 768, h: 128 }); ghostLab.position.set(0.6, 4.6, 0); stage.add(ghostLab);
const realLab = makeLabel('実際', { sx: 1.4, size: 60, color: PINK, stroke: 6, w: 256 }); realLab.position.set(1.9, 1.9, 0.5); stage.add(realLab);
// ---------- ad money ----------
const PILES = []; for (let i = 0; i < 8; i++) PILES.push(makeCoins(-2.6 + (i % 4) * 1.75, -0.6 + Math.floor(i / 4) * 1.4, 26));
const adLab = makeLabel('動画広告 1年で1兆275億円', { sx: 4.6, size: 54, color: GOLD, stroke: 6, w: 1024, h: 128 }); adLab.position.set(0, 4.4, 0); stage.add(adLab);
const lossLab = makeLabel('−約3,083億円', { sx: 3.8, size: 90, color: RED, stroke: 10, w: 768, h: 128 }); lossLab.position.set(0, 2.2, 2.0); lossLab.material.depthTest = false; lossLab.renderOrder = 8; stage.add(lossLab);
// ---------- time back ----------
const clockLab = makeLabel('＋6時間', { sx: 3.0, size: 100, color: GREEN, stroke: 10 }); clockLab.position.set(0, 3.3, 0); stage.add(clockLab);
const freeSpark = makeSparkles(300, 0.18, 0xc8ffe8); stage.add(freeSpark.points);
// ---------- study gap ----------
const heavy = makePerson({ skin: '#f1c7a3', hair: '#1c1c1c', shirt: '#3c4a6b', pants: '#2d3446' }); heavy.position.set(-1.7, 0.3, 0); stage.add(heavy); addPhone(heavy, 0.8); pose(heavy, 1);
const light = makePerson({ skin: '#e8b98f', hair: '#3a2a1a', shirt: '#3c4a6b', pants: '#2d3446' }); light.position.set(1.7, 0.3, 0); stage.add(light);
const hLab = makeLabel('1日4時間以上', { sx: 2.0, size: 56, bg: 'rgba(20,24,34,.85)' }); hLab.position.set(-1.7, 2.4, 0.3); stage.add(hLab);
const lLab = makeLabel('30分未満', { sx: 2.0, size: 56, bg: 'rgba(20,24,34,.85)' }); lLab.position.set(1.7, 2.4, 0.3); stage.add(lLab);
const gapBar = makeBar({ color: '#e0b04a', x: 0, z: -0.8, w: 1.0, d: 1.0 });
const gapLab = makeLabel('中3数学の正答率の差', { sx: 3.6, size: 52, stroke: 6, w: 768, h: 128 }); gapLab.position.set(0, 5.0, -0.8); stage.add(gapLab);
// ---------- twist ----------
const swipeLab = makeLabel('スワイプ ↑', { sx: 3.0, size: 80, color: '#ffffff', stroke: 8 }); swipeLab.position.set(0, 3.6, 0); stage.add(swipeLab);

const GROUPS = {
  dopa: [dopa], futsu: [futsu], dryer: dryers, word: [wDopa, wPlus, wGaki, wWord, wTrend], vs: [nameL, nameR, vsLab, valL, valR], vbars: [barL.g, barR.g],
  crowd: [crowd.g, pctLab, downView, downCom], wall: [wall, wallLab, minusLab], chart: [...ghost, ...real, ghostLab, realLab], ads: [...PILES.map(p => p.g), adLab, lossLab],
  clock: [clockLab], gap: [heavy, light, hLab, lLab, gapBar.g, gapLab], swipe: [swipeLab],
};
function mode(...ms) { for (const k in GROUPS) GROUPS[k].forEach(o => { o.visible = ms.includes(k); }); icons.forEach(s => { s.visible = false; }); glow.intensity = 0; freeSpark.set(0); poof.set(0); }
function pop(s, t0, t, sx, sy) { const k = easeBack(clamp((t - t0) / 0.5)); s.scale.set(sx * k, sy * k, 1); s.visible = k > 0.01; }

// ---------- subtitles ----------
const SUBS = [
  [4.2, 8.0, 'ドパガキとは、<br>ドーパミン中毒のガキ。'],
  [8.1, 12.0, '刺激をやめられない人のこと。<br>2026年夏の流行語にも入った。'],
  [12.1, 16.0, 'ふつうのガキとドパガキ、<br>何がちがう？'],
  [16.1, 20.0, '動画を見る時間、<br>10代の平均は1日116分。'],
  [20.1, 24.0, 'ドパガキは、<br>1日6時間以上。'],
  [24.1, 28.0, '映画は、ふつうは等速。<br>ドパガキは倍速。'],
  [28.1, 32.0, 'ドライヤー中も、<br>ドパガキはTikTok。'],
  [32.1, 36.0, '1日6時間以上見る10代は、<br>約3割もいる。'],
  [36.1, 40.0, 'もしドパガキが全員、<br>ふつうのガキに戻ったら…'],
  [40.1, 44.0, 'まず、再生とコメントが<br>一気に減る。'],
  [44.1, 48.0, 'YouTubeショートは、<br>世界で1日2,000億回再生。'],
  [48.1, 52.0, '仮に3割消えたら、<br>1日600億回が消える。'],
  [52.1, 55.0, '伸びるはずだった動画が、<br>伸びなくなる。'],
  [55.1, 60.0, '動画広告は、日本だけで<br>1年1兆275億円。'],
  [60.1, 64.0, '3割なら、約3,083億円が<br>回らなくなる計算。'],
  [64.1, 67.6, 'でもドパガキは、<br>1日6時間を取り戻す。'],
  [67.7, 72.0, 'スマホ4時間以上と30分未満、<br>中3数学は18.5ポイント差。'],
  [72.1, 80.2, '結果：広告は年約3,083億円減。<br>でも10代の3割に6時間が戻る。'],
  [80.3, 82.9, 'ちなみに本物のドパガキは、<br>ここまで見てない。'],
  [83.0, 86.6, 'あなたはドパガキ？<br>1日何時間見てるか教えて。'],
];

// ---------- shots ----------
function hook(t, T) { mode('dopa'); dopa.position.set(0, 0.3, 0); dopa.rotation.y = 0; pose(dopa, 1, T); drawFeed(T); glow.intensity = 3; iconsAt(0, 0, 1, T); }
function shot0(t, T) { lift(300); hook(t, T); const u = ease(t / 4); look(lerp(0.5, 0.2, u), lerp(3.0, 2.8, u), lerp(6.6, 6.0, u), 0, 2.1, 0, 50); el.title.style.opacity = 1; return stage; }
function shotWord(t, T) {
  lift(240); mode('dopa', 'word'); dopa.position.set(0, 0.3, 0); pose(dopa, 1, T); drawFeed(T); glow.intensity = 3; iconsAt(0, 0, 0.6, T, 1.6);
  const a = easeBack(clamp((t - 0.2) / 0.6)), b = easeBack(clamp((t - 0.9) / 0.6)), m = ease(clamp((t - 2.4) / 0.8));
  wDopa.position.set(lerp(-1.5, 0, m), 3.7, 0); wDopa.scale.set(2.4 * a * (1 - m), 0.6 * a * (1 - m), 1);
  wGaki.position.set(lerp(1.7, 0, m), 3.7, 0); wGaki.scale.set(1.5 * b * (1 - m), 0.5 * b * (1 - m), 1);
  wPlus.position.set(0.45, 3.7, 0); wPlus.scale.set(0.8 * a * (1 - m), 0.4 * a * (1 - m), 1);
  wWord.position.set(0, 3.8, 0); pop(wWord, 2.9, t, 3.4, 0.85);
  wTrend.position.set(0, 2.9, 0.6); pop(wTrend, 5.6, t, 4.0, 0.5);
  const u = ease(t / 8); look(lerp(0.3, 0, u), lerp(2.8, 3.0, u), lerp(10, 10.6, u), 0, 2.3, 0, 50);
  if (t < 3.9) setTop('ネットスラング', 'ドパガキ', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('女子高生ラボ（2026年6月）', '2026夏の流行語7選', fade(t, 3.9, 7.9, 0.2), PINK);
  return stage;
}
function shotVs(t, T) {
  lift(240);
  const seg = t < 4 ? 0 : t < 12 ? 1 : t < 16 ? 2 : 3; // 0 intro, 1 time, 2 movie, 3 dryer
  mode('dopa', 'futsu', 'vs', ...(seg === 1 ? ['vbars'] : []), ...(seg === 3 ? ['dryer'] : []));
  futsu.position.set(-1.4, 0.3, 0.6); futsu.rotation.y = 0.15; dopa.position.set(1.4, 0.3, 0.6); dopa.rotation.y = -0.15;
  pose(futsu, 0, T); pose(dopa, 1, T); drawFeed(T, seg === 2 ? 520 : 260); glow.intensity = 3; iconsAt(1.4, 0.6, 0.5, T, 0.8);
  nameL.position.set(-1.4, 2.45, 0.9); nameR.position.set(1.4, 2.45, 0.9); pop(nameL, 0.2, t, 1.9, 0.475); pop(nameR, 0.5, t, 1.9, 0.475);
  vsLab.position.set(0, 1.5, 1.0); pop(vsLab, 0.9, t, 1.0, 0.5); vsLab.material.rotation = Math.sin(T * 4) * 0.08;
  valL.position.set(-1.4, 3.5, 0.6); valR.position.set(1.4, 3.5, 0.6);
  if (seg === 1) {
    const g1 = easeOut(clamp((t - 4.2) / 1.2)), g2 = easeOut(clamp((t - 8.2) / 1.4));
    barL.setH(116 * HV * g1 + 0.001, ''); barR.setH(360 * HV * g2 + 0.001, '');
    valL.userData.set(`${Math.round(116 * g1)}分`); pop(valL, 4.2, t, 2.6, 0.65);
    valR.userData.set('6時間以上'); pop(valR, 8.4, t, 2.6, 0.65);
  } else if (seg === 2) { valL.userData.set('▶ 1.0x'); valR.userData.set('▶▶ 2.0x'); pop(valL, 12.2, t, 2.6, 0.65); pop(valR, 12.8, t, 2.6, 0.65); }
  else if (seg === 3) {
    valL.userData.set('ぼーっと'); valR.userData.set('TikTok'); pop(valL, 16.2, t, 2.6, 0.65); pop(valR, 16.8, t, 2.6, 0.65);
    dryers[0].position.set(-1.4 + 0.45, 2.1, 0.7); dryers[1].position.set(1.4 + 0.45, 2.1, 0.7); dryers.forEach((d, i) => { d.rotation.z = 0.5 + Math.sin(T * 6 + i) * 0.15; });
  } else { valL.visible = false; valR.visible = false; }
  const u = ease(t / 20); look(lerp(0, 0.2, u), lerp(3.2, 3.4, u), lerp(11, 11.5, u), 0, 2.2, 0, 50);
  if (seg === 0) setTop('くらべてみた', 'ふつう VS ドパガキ', fade(t, 0.15, 4, 0.2), GOLD);
  else if (seg === 1 && t < 8) setTop('10代の動画視聴（平日・総務省）', '平均116分', fade(t, 4, 8, 0.2), GREEN);
  else if (seg === 1) setTop('この動画でのドパガキ', '1日6時間以上', fade(t, 8, 12, 0.2), PINK);
  else if (seg === 2) setTop('倍速で見たことがある人（2024年）', '47.0%', fade(t, 12, 16, 0.2), PINK);
  else setTop('女子高生ラボの説明より', 'ドライヤー中もTikTok', fade(t, 16, 20, 0.2), PINK);
  return stage;
}
function crowdBase(T) { crowd.people.forEach((p, i) => { pose(p, HEAVY.includes(i) ? 1 : 0, T); }); drawFeed(T); }
function shotThree(t, T) {
  lift(240); mode('crowd'); downView.visible = downCom.visible = false; crowdBase(T);
  rings.forEach((r, j) => { r.visible = t > 0.6 + j * 0.12; r.scale.setScalar(1 + Math.sin(T * 6) * 0.08); });
  pctLab.position.set(0, 3.9, 0); pop(pctLab, 1.4, t, 3.2, 0.8);
  iconsAt(0, 0, 0.8, T, 2.6);
  look(0, 5.6, 13, 0, 1.6, 0, 50);
  setTop('スマホで動画1日6時間以上（10代・2024年）', '約3割', fade(t, 0.15, 3.9, 0.2), PINK);
  return stage;
}
function shotBack(t, T) {
  lift(240); mode('crowd'); pctLab.visible = false;
  const v = clamp((t - 1.0) / 1.6);
  crowd.people.forEach((p, i) => { const h = HEAVY.includes(i); pose(p, h ? 1 - ease(v) : 0, T); if (h && p.userData.phone) p.userData.phone.visible = v < 0.6; });
  rings.forEach(r => { r.visible = v < 1; r.material.opacity = 0.9 * (1 - v); });
  if (t > 0.9 && t < 4) { poof.init(HEAVY.map(i => { const p = crowd.people[i]; return [p.position.x, 1.5, p.position.z]; }), 0.4, 1.6); poof.set(clamp((t - 1.0) / 2.4)); } else poof.set(0);
  drawFeed(T); iconsAt(0, 0, 0.8 * (1 - clamp((t - 4) / 2)), T, 2.6);
  downView.position.set(-1.5, 3.7, 0.8); downCom.position.set(1.5, 2.8, 0.8); pop(downView, 4.3, t, 2.4, 0.6); pop(downCom, 4.9, t, 3.0, 0.75);
  const u = ease(t / 8); look(lerp(0, 0.3, u), lerp(5.6, 5.8, u), lerp(13, 13.6, u), 0, 1.8, 0, 50);
  if (t < 3.9) setTop('もしも', '全員ふつうのガキに', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('SNSで起きること', '再生・コメント ▼', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotWall(t, T) {
  lift(240); mode('wall'); drawFeed(T);
  const off = clamp((t - 4.4) / 1.8);
  tiles.forEach((tl, j) => { const k = TORDER.indexOf(j); const gone = k < 18 && off > k / 18; tl.scale.setScalar(gone ? Math.max(0.001, 1.3 * (1 - clamp((off - k / 18) * 4))) : 1.3); tl.visible = tl.scale.x > 0.01; });
  pop(wallLab, 0.3, t, 4.2, 0.7); pop(minusLab, 4.6, t, 3.4, 0.85);
  const u = ease(t / 8); look(0, lerp(3.6, 3.9, u), lerp(11, 11.8, u), 0, 3.3, 0, 50);
  if (t < 3.9) setTop('YouTubeショート（世界・2025年）', '1日2,000億回', fade(t, 0.15, 3.9, 0.2), GOLD);
  else setTop('仮に3割消えたら（試算）', '1日600億回', fade(t, 3.9, 7.9, 0.2), RED);
  return stage;
}
function shotChart(t, T) {
  lift(240); mode('chart');
  GROW.forEach((h, i) => {
    const k = easeOut(clamp((t - 0.2 - i * 0.18) / 0.6));
    ghost[i].scale.y = Math.max(0.001, h * k); real[i].scale.y = Math.max(0.001, (i < 3 ? h : GROW[2] * (1 - (i - 2) * 0.06)) * k);
  });
  ghostLab.visible = t > 1.8; realLab.visible = t > 2.2;
  look(0, 3.2, 11.5, 0, 2.4, 0, 50);
  setTop('ドパガキがいないと', '伸びない', fade(t, 0.15, 2.9, 0.2), RED);
  return stage;
}
function shotAds(t, T) {
  lift(240); mode('ads');
  const grow = easeOut(clamp((t - 0.2) / 1.6)), shrink = ease(clamp((t - 5.3) / 1.6));
  PILES.forEach((p, i) => { p.g.position.z = i < 4 ? -0.6 : 0.8; p.setN(Math.round(26 * grow * (1 - shrink * 0.3))); });
  pop(adLab, 0.3, t, 4.6, 0.575); pop(lossLab, 5.4, t, 3.8, 0.63);
  const u = ease(t / 9); look(lerp(0, 0.3, u), lerp(6.0, 5.6, u), lerp(14.5, 13.8, u), 0, 2.2, 0, 50);
  if (t < 5.0) setTop('動画広告（日本・2025年）', '1兆275億円', fade(t, 0.15, 5.0, 0.2), GOLD);
  else setTop('3割なら（試算）', '約3,083億円', fade(t, 5.0, 8.9, 0.2), RED);
  return stage;
}
function shotTime(t, T) {
  lift(260); mode('dopa', 'clock'); dopa.position.set(0, 0.3, 0); dopa.rotation.y = 0;
  const down = ease(clamp((t - 0.3) / 1.2)); pose(dopa, 1 - down, T); drawFeed(T);
  pop(clockLab, 1.3, t, 3.0, 0.75);
  freeSpark.init([[0, 2.2, 0]], 1.2, 2.4); freeSpark.set(clamp((t - 1.3) / 2.4));
  look(0.2, 2.9, 8.6, 0, 2.2, 0, 50);
  setTop('ドパガキが取り戻す時間', '1日6時間', fade(t, 0.15, 3.5, 0.2), GREEN);
  return stage;
}
function shotGap(t, T) {
  lift(240); mode('gap'); drawFeed(T);
  const k = easeOut(clamp((t - 1.0) / 1.4)); gapBar.setH(18.5 * 0.16 * k, k > 0.01 ? `${(18.5 * k).toFixed(1)}pt` : '');
  look(0.2, 3.4, 10.6, 0, 2.2, 0, 50);
  setTop('中3数学の正答率の差（2024年度）', '18.5ポイント', fade(t, 0.15, 4.3, 0.2), GOLD);
  return stage;
}
function shotResult(t, T) {
  lift(260); mode('ads', 'dopa', 'clock'); adLab.visible = false; lossLab.visible = false;
  PILES.forEach((p, i) => { p.setN(18); p.g.position.z = (i < 4 ? -0.6 : 0.8) - 3.2; });
  dopa.position.set(0, 0.3, 1.6); pose(dopa, 0, T);
  clockLab.position.set(0, 3.6, 1.6); clockLab.scale.set(3.0, 0.75, 1);
  const u = ease(t / 7.5); look(lerp(0.4, 0, u), lerp(3.6, 4.2, u), lerp(10.5, 12, u), 0, 2.0, 0, 50);
  if (t < 3.6) setTop('動画広告（試算）', '年約3,083億円減', fade(t, 0.15, 3.6, 0.2), RED);
  else setTop('かわりに10代の3割に', '1日6時間', fade(t, 3.6, 8.1, 0.2), GREEN);
  return stage;
}
function shotTwist(t, T) {
  lift(240); mode('dopa', 'swipe'); dopa.position.set(0, 0.3, 0); dopa.rotation.y = 0; pose(dopa, 1, T); drawFeed(T, 900); glow.intensity = 4; iconsAt(0, 0, 1, T);
  swipeLab.position.set(0, 3.0 + ((T * 1.5) % 1) * 0.4, 0.5); pop(swipeLab, 0.2, t, 3.0, 0.75);
  look(0.3, 2.9, 7.6, 0, 2.2, 0, 50);
  setTop('ちなみに本物のドパガキは', 'ここまで見てない', fade(t, 0.15, 2.6, 0.2), PINK);
  return stage;
}
function shotLoop(t, T) { lift(300); hook(t, T); const u = ease(t / 3.4); look(lerp(0.5, 0.3, u), lerp(3.0, 2.9, u), lerp(6.6, 6.3, u), 0, 2.1, 0, 50); return stage; }

const shots = [
  { a: 0, b: 4.1, f: shot0 }, { a: 4.1, b: 12.0, f: shotWord }, { a: 12.0, b: 32.0, f: shotVs }, { a: 32.0, b: 36.0, f: shotThree },
  { a: 36.0, b: 44.0, f: shotBack }, { a: 44.0, b: 52.0, f: shotWall }, { a: 52.0, b: 55.0, f: shotChart }, { a: 55.0, b: 64.0, f: shotAds },
  { a: 64.0, b: 67.6, f: shotTime }, { a: 67.6, b: 72.0, f: shotGap }, { a: 72.0, b: 80.2, f: shotResult }, { a: 80.2, b: 82.9, f: shotTwist },
  { a: 82.9, b: 86.8, f: shotLoop }, { a: 86.8, b: 90.8, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 90.8,
  meta: {
    id: '0603',
    title: 'ドパガキが消えたら、この世界はどうなる？',
    titleHtml: 'ドパガキが消えたら、<br>この世界はどうなる？',
    mood: 'mystery', seed: 603, hits: [36.1, 72.1], risers: [36.0, 72.0],
    impacts: [16.1, 20.1, 32.1, 44.1, 48.1, 60.1, 64.1, 67.7, 72.1, 80.3],
    sfx: [[0.3, 'bubble'], [4.4, 'whoosh'], [7.0, 'poof'], [12.3, 'whoosh'], [16.3, 'meter', 0.35], [20.3, 'meter', 1.0], [24.3, 'whoosh'], [28.3, 'buzz'], [33.5, 'bubble'], [37.0, 'poof'], [40.4, 'drone'], [48.5, 'poof'], [52.3, 'drone'], [60.5, 'alarm'], [65.3, 'whoosh'], [68.6, 'meter', 0.5], [80.4, 'whoosh']],
    ask: 'あなたはドパガキ？ 1日何時間見てるか教えて。',
    narr: { 'TikTok': 'ティックトック', 'YouTubeショート': 'ユーチューブショート', '2,000億回': '2000億回', '3,083億円': '3083億円', '1兆275億円': '1兆275億円', '中3': 'ちゅうさん', '等速': 'とうそく' },
    caption: 'ドパガキが消えたら、この世界はどうなる？\n\nドパガキ＝「ドーパミン中毒のガキ」。ショート動画などの刺激をやめられない人を指すネットスラング（自虐で使う人も多い。医学用語ではない）。女子高生ラボの「2026年夏の流行語7選」にも入った。\n\nふつうのガキ VS ドパガキ\n・動画を見る時間：10代の平均は平日116分／ドパガキは1日6時間以上\n・映画：等速／倍速（倍速で見たことがある人は47.0%）\n・ドライヤー中：ぼーっと／TikTok\n1日6時間以上スマホで動画を見る10代は約3割。\n\nもしドパガキが全員、ふつうのガキに戻ったら…\n・再生とコメントが一気に減る\n・YouTubeショートは世界で1日2,000億回再生。仮に3割消えたら1日600億回\n・伸びるはずだった動画が伸びなくなる\n・動画広告は日本で1年1兆275億円（2025年）。3割なら約3,083億円が回らなくなる計算\n・でもドパガキは1日6時間を取り戻す\n・中3数学の正答率は、スマホ等を1日4時間以上使う子と30分未満の子で18.5ポイント差（スマホが原因と決まったわけではない）\n\n結果：広告は年約3,083億円減。でも10代の3割に、1日6時間が戻る。\nちなみに本物のドパガキは、ここまで読んでない。\n\nあなたはドパガキ？ 1日何時間見てるかコメントで教えて。\n\n※「3割消えたら」は、10代の約3割が1日6時間以上見ていることをもとにした仮定の試算です。\n\n出典：総務省 情報通信政策研究所「令和6年度 情報通信メディアの利用時間と情報行動に関する調査」、NTTドコモ モバイル社会研究所（2024年10月）、クロス・マーケティング「動画の倍速視聴に関する調査（2024年）」、YouTube CEO ニール・モーハン氏（2025年6月 カンヌライオンズ）、CARTA HOLDINGS・電通ほか「2025年 日本の広告費 インターネット広告媒体費 詳細分析」、文部科学省「令和6年度 全国学力・学習状況調査」、女子高生ラボ（2026年6月）',
    hashtags: ['もしもラボ', 'ドパガキ', 'ショート動画', 'SNS', '雑学'],
    endStats: [['ドパガキ（1日6時間以上）', '10代の約3割', '2024年'], ['10代の動画視聴', '平日116分', '総務省'], ['YouTubeショート', '1日2,000億回', '世界・2025年'], ['動画広告 3割なら', '約3,083億円', '試算'], ['取り戻す時間', '1日6時間', 'ドパガキ1人あたり']],
    sources: '出典：総務省、モバイル社会研究所、クロス・マーケティング、<br>YouTube（2025年）、電通ほか、文部科学省、女子高生ラボ',
  },
});
