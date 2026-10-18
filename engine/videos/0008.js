import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, randPerson, poseWalk, makeQ, canvasTex } from '../lib.js';
import { market, shelfItems, queues } from '../market.js';
import { city, cam as cityCam, setEnv, setStore, setStoreLights, updateCars, parked, setBurst, ghost, ghostScr, ghostFill } from '../city.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { stage, makeCrowd } from '../scenes/stage.js';
import { lift, look, cam, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも1ドル300円になったら？（試算・投資助言ではありません）
// 数字：1ドル 約164円（日本銀行 外国為替市況 2026年7月24日 163.66〜163.95円）→ 300円で約1.8倍（計算）
//       原油の輸入依存度 99.7%・中東依存度 95.9%（資源エネルギー庁 エネルギー動向2026年版、2024年度）
//       食料自給率 カロリーベース 37%（農林水産省、令和7年度）、エネルギー自給率 16.3%（資源エネルギー庁、2024年度確報）
//       訪日外客数 42,683,301人（JNTO、2025年確定値）、1949〜1971年は1ドル＝360円（国立公文書館）

// all shots render through one camera
function L(...a) { look(...a); cityCam.position.copy(cam.position); cityCam.quaternion.copy(cam.quaternion); cityCam.fov = cam.fov; cityCam.updateProjectionMatrix(); }

// ---------- exchange board on the stage ----------
const boardC = document.createElement('canvas'); boardC.width = 1024; boardC.height = 640;
const boardT = new THREE.CanvasTexture(boardC); boardT.colorSpace = THREE.SRGBColorSpace;
let boardVal = null;
function drawBoard(v, color) {
  const key = v.toFixed(2) + color; if (key === boardVal) return; boardVal = key;
  const g = boardC.getContext('2d'); g.fillStyle = '#0b1220'; g.fillRect(0, 0, 1024, 640);
  g.strokeStyle = '#2a3a5a'; g.lineWidth = 16; g.strokeRect(8, 8, 1008, 624);
  g.fillStyle = '#9fb3d1'; g.font = '700 80px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('1ドル ＝', 512, 170);
  g.fillStyle = color; g.font = '900 250px "Noto Sans CJK JP", sans-serif'; g.fillText(v.toFixed(0) + '円', 512, 460);
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 0; y < 640; y += 8) g.fillRect(0, y, 1024, 2);
  boardT.needsUpdate = true;
}
const board = new THREE.Mesh(new THREE.BoxGeometry(5, 3.1, 0.3), [mat('#1a2236'), mat('#1a2236'), mat('#1a2236'), mat('#1a2236'), new THREE.MeshBasicMaterial({ map: boardT }), mat('#1a2236')]);
board.position.set(0, 5.0, -4); stage.add(board);
const poleL = box(0.3, 4, 0.3, mat('#2a3550')); poleL.position.set(-1.8, 2, -4); stage.add(poleL);
const poleR = poleL.clone(); poleR.position.x = 1.8; stage.add(poleR);
const crowd = makeCrowd(24, 3, { w: 10, d: 3, x: 0, z: 3.5 });
crowd.people.forEach(p => { p.rotation.y = Math.PI + (p.rotation.y); });
const qs = crowd.people.slice(0, 6).map(p => { const q = makeQ(); stage.add(q); return { q, p }; });
// ---------- tanker route on the globe ----------
const ROUTE = [[26.5, 56.5], [22, 62], [12, 72], [6, 82], [5.5, 95], [2, 103], [8, 108], [18, 115], [24, 122], [30, 130], [34.5, 137]];
const routeDots = [];
{ const dm = new THREE.SphereGeometry(0.07, 6, 4); for (let i = 0; i < ROUTE.length - 1; i++) for (let k = 0; k < 6; k++) { const a = ROUTE[i], b = ROUTE[i + 1], u = k / 6; const m = new THREE.Mesh(dm, new THREE.MeshBasicMaterial({ color: 0xffd34d })); m.position.copy(latLon(lerp(a[0], b[0], u), lerp(a[1], b[1], u), 10.06)); earth.add(m); routeDots.push(m); } }
const tanker = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff6b4a })); earth.add(tanker);
function tankerAt(u) { const f = u * (ROUTE.length - 1), i = Math.min(ROUTE.length - 2, Math.floor(f)), k = f - i; const a = ROUTE[i], b = ROUTE[i + 1]; tanker.position.copy(latLon(lerp(a[0], b[0], k), lerp(a[1], b[1], k), 10.1)); }
// ---------- price tags in the market ----------
const tags = [];
{ const r = rng(3); for (let i = 0; i < 6; i++) { const t = textSprite('¥300', { w: 256, h: 128, size: 70, bg: '#ffe066', color: '#c0262d', sx: 1.0 }); t.position.set(-15 + i * 6 + 1.05, 2.7, -4 - r() * 4); market.add(t); tags.push(t); } }
function tagPrice(k) { tags.forEach((t, i) => { const base = [198, 298, 158, 248, 398, 128][i]; t.userData.set('¥' + comma(Math.round(base * lerp(1, 300 / 164, k)))); }); }
// ---------- tourists in the city ----------
function group() { const g = new THREE.Group(); city.add(g); g.visible = false; return g; }
const gTour = group(); const tourists = [];
{ const r = rng(77); for (let i = 0; i < 24; i++) { const p = randPerson(r); gTour.add(p); const suit = box(0.4, 0.6, 0.25, mat(['#e05a4f', '#4fa3d1', '#f2c14e', '#3f8f6b'][i % 4])); suit.position.set(0.15, -0.55, -0.35); p.userData.arms[0].add(suit); const dir = i % 2 ? 1 : -1; tourists.push({ p, z: 5.6 + r() * 2.6, x0: dir * (-10 + r() * 14), dir, s: 0.9 + r() * 0.4, ph: r() * 6 }); } }
function tourWalk(t) { for (const w of tourists) { let x = w.x0 + w.dir * t * w.s * 1.1; x = ((x + 16) % 32 + 32) % 32 - 16; w.p.position.set(x, 0, w.z); w.p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2; poseWalk(w.p, t * 7 + w.ph); } }
function cityBase(env) { setEnv(env, new THREE.Vector3(0, 0, 2)); setStore(1); setStoreLights(env === 'day' ? 0.3 : 1); setBurst(0); ghost.visible = ghostScr.visible = ghostFill.visible = false; parked[0].visible = parked[1].visible = true; }

const SUBS = [
  [2.6, 6.0, 'いつものスーパー。<br>輸入品もたくさん並ぶ。'],
  [6.2, 10.1, '1ドル約164円が、<br>300円に。'],
  [10.1, 14, 'ドルで買う物は、円で<br>約1.8倍の値段になる。'],
  [14.2, 18.1, 'ガソリン代が上がり始める。'],
  [18.1, 22, '原油はほぼ全部が輸入。<br>9割以上が中東から。'],
  [22.2, 26.1, '輸入の食べ物が高くなる。'],
  [26.1, 30, 'カロリーで見ると、<br>6割以上が海外から。'],
  [30.2, 34.6, '電気代もじわじわ上がる。'],
  [34.6, 39, 'エネルギーの8割以上を、<br>海外に頼っている。'],
  [39.2, 43.6, '外国人旅行者が街にあふれる。'],
  [43.6, 47.8, 'ドルを持つ人には、<br>日本は大バーゲン。'],
  [48.1, 52.6, '結果：輸入の食べ物と<br>エネルギーが軒並み値上がり。'],
  [52.6, 55.4, '実は1971年まで、<br>1ドルは360円だった。'],
  [55.6, 59.4, 'あなたの買い物も、<br>この数字で値段が変わる。'],
];

function stageShot(v, color, t, cam0) {
  drawBoard(v, color); board.visible = true; crowd.g.visible = true;
  crowd.people.forEach((p, i) => p.userData.head.rotation.x = -0.25);
  L(...cam0);
}
function shot0(t, T) { // hook: 164 -> 300
  lift(230);
  const tv = 1.0; const v = t < tv ? 164 : lerp(164, 300, easeOut((t - tv) / 0.5));
  qs.forEach(({ q, p }) => { q.visible = t > tv + 0.4; q.position.set(p.position.x, 2.45, p.position.z); q.scale.setScalar(0.6 * easeBack(clamp((t - tv - 0.4) / 0.3))); });
  el.flash.style.opacity = t >= tv ? 0.4 * Math.max(0, 1 - (t - tv) / 0.3) : 0;
  const u = ease(t / 2.6);
  stageShot(v, t < tv ? '#7ff0c8' : '#ff6b6b', t, [0, 5.15, lerp(12.5, 12, u), 0, 5.15, -4, 50]);
  el.title.style.opacity = 1;
  return stage;
}
function shot1(t, T) { // everyday market
  tagPrice(0); for (const q of queues) q.p.visible = false; for (const s of shelfItems) s.it.visible = true;
  const u = ease(t / 3.5);
  L(lerp(-4, -3, u), lerp(4.5, 4.2, u), lerp(8, 6.5, u), -10, 1.6, -10, 50);
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  return market;
}
function shot2(t, T) { // +1day board
  lift(230);
  qs.forEach(({ q }) => q.visible = false);
  const v = lerp(164, 300, easeOut(clamp((t - 0.4) / 1.4)));
  const u = ease(t / 8);
  stageShot(v, v > 165 ? '#ff6b6b' : '#7ff0c8', t, [lerp(-1, 1, u), 5.15, lerp(12.5, 11.8, u), 0, 5.15, -4, 50]);
  hudTime('+1日');
  setTop('1ドルの値段（2026年7月）', '約' + countUp(t, 164) + '円', fade(t, 0.15, 8, 0.25));
  return stage;
}
function shot3(t, T) { // +1week tanker route
  setEarthNight(0); earth.rotation.y = faceLon(98) + 0.1 - t * 0.02; tankerAt(clamp(t / 7.5));
  const u = ease(t / 8);
  L(0, lerp(9, 7, u), lerp(32, 30, u), 0, 3.0, 0, 45);
  hudTime('+1週間');
  setTop('原油の輸入依存度（2024年度）', (countUp(t, 997) / 10).toFixed(1) + '%', fade(t, 0.15, 8, 0.25));
  return space;
}
function shot4(t, T) { // +1month prices up in the market
  tagPrice(clamp((t - 1) / 3)); for (const q of queues) q.p.visible = false; for (const s of shelfItems) s.it.visible = true;
  const u = ease(t / 8);
  L(lerp(-12, -10.5, u), lerp(3.2, 3.0, u), lerp(1.5, 0.5, u), -13.9, 2.4, -6, 50);
  hudTime('+1か月');
  setTop('食料自給率（カロリー・2025年度）', countUp(t, 37) + '%', fade(t, 0.15, 8, 0.25));
  return market;
}
function shot5(t, T) { // +3months night city, electricity
  gTour.visible = false; cityBase('night'); updateCars(T, true);
  const u = ease(t / 9);
  L(lerp(20, 30, u), lerp(40, 55, u), lerp(45, 60, u), 0, 0, -10, 55);
  hudTime('+3か月');
  setTop('エネルギー自給率（2024年度）', (countUp(t, 163) / 10).toFixed(1) + '%', fade(t, 0.15, 9, 0.25));
  return city;
}
function shot6(t, T) { // +half year tourists
  gTour.visible = true; cityBase('day'); updateCars(T, true); tourWalk(t); parked[0].visible = parked[1].visible = false; updateCars(T, false);
  const u = ease(t / 8.6);
  L(lerp(-3, 3, u), lerp(2.4, 2.6, u), lerp(19, 18, u), 0, 3.2, 3, 55);
  hudTime('+半年');
  setTop('日本を訪れた外国人（2025年）', comma(countUp(t, 4268)) + '万人', fade(t, 0.15, 8.6, 0.25));
  return city;
}
function shot7(t, T) { // result: board at 300, crowd
  lift(230);
  const u = ease(t / 7.5);
  stageShot(300, '#ff6b6b', t, [0, lerp(5.15, 5.6, u), lerp(12, 15, u), 0, lerp(5.15, 5.4, u), -4, 50]);
  setTop('円で払う輸入品の値段（計算）', '約' + (countUp(t, 18, 0.2, 1.2) / 10).toFixed(1) + '倍', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return stage;
}
function shot8(t, T) { // loop: back to 164
  lift(230);
  qs.forEach(({ q }) => q.visible = false);
  const u = ease(t / 4);
  stageShot(164, '#7ff0c8', t, [0, 5.15, lerp(12.8, 12.5, u), 0, 5.15, -4, 50]);
  return stage;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5, camera: cityCam, dim: f => f === shot1 || f === shot4,
  meta: {
    id: '0008',
    title: '1ドル300円になったら？',
    titleHtml: '1ドル300円に<br>なったら？',
    mood: 'tension', seed: 9, hits: [1.0, 48.1], risers: [1.0],
    caption: 'もしも1ドル300円の超円安になったら、暮らしはどうなる？\n原油の99.7%、カロリーの6割以上を輸入に頼る日本。公式統計をもとにした試算です（投資助言ではありません）。\n\n出典：日本銀行 外国為替市況（2026年7月）、資源エネルギー庁 エネルギー動向（2026年版）・エネルギー需給実績（2024年度確報）、農林水産省 食料自給率（令和7年度）、JNTO 訪日外客数（2025年）、国立公文書館',
    hashtags: ['もしもラボ', '円安', '為替', '物価', '雑学'],
    endStats: [['1ドルの値段', '約164円', '2026年7月'], ['原油の輸入依存度', '99.7%', '2024年度'], ['食料自給率（カロリー）', '37%', '2025年度'], ['エネルギー自給率', '16.3%', '2024年度']],
    sources: '出典：日本銀行、資源エネルギー庁（エネルギー動向2026年版・需給実績）、<br>農林水産省、JNTO、国立公文書館',
  },
});
