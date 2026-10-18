import * as THREE from 'three';
import { LOGOS } from '../logos.js';
import { W, H, RW, RH, canvas, renderer, rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, canvasTex, windowTextures, makeSky, SKIN, HAIR, SHIRT, PANTS, makePerson, poseWalk, randPerson, walkAlong, qTex, makeQ } from '../lib.js';
import { RX0, RZ0, cam, city, ghost, ghostFill, ghostM, ghostScr, look, parked, setBurst, setEnv, setStore, setStoreLights, storeGlows, updateCars } from '../city.js';
import { market, mLight, shelfItems, queues } from '../market.js';
import { setupCards, $, el, lastSub, setSub, setTop, setHud, roll } from '../overlay.js';

// ---------- crowds ----------
function group() { const g = new THREE.Group(); city.add(g); g.visible = false; return g; }
// S0 aerial pedestrians crossing
const gAerial = group(); const aerialPeds = [];
{
  const r = rng(21);
  for (let i = 0; i < 46; i++) {
    const p = randPerson(r); gAerial.add(p);
    const kind = Math.floor(r() * 4);
    let a, b;
    const off = (r() - .5) * 3;
    if (kind === 0) { a = [RZ0 - 7 + off, 8.5 + r() * 8]; b = [RZ0 + 7 + off, a[1]]; a = [RZ0 - 6, RX0 - 6 + r() * 12]; b = [RZ0 + 6, a[1]]; }
    if (kind === 1) { a = [RZ0 - 5 + r() * 10, RX0 - 6.5]; b = [a[0], RX0 + 6.5]; }
    if (kind === 2) { a = [-14 + r() * 4, 7.5]; b = [16, 7.5 + (r() - .5)]; }
    if (kind === 3) { a = [RZ0 - 8, RX0 - 6 - r() * 10]; b = [RZ0 - 8 + (r() - .5), RX0 + 10 + r() * 6]; }
    if (r() < .5) [a, b] = [b, a];
    aerialPeds.push({ p, a, b, s: 0.15 + r() * 0.12, o: r() });
  }
}
// S1 storefront passersby
const gFront = group(); const frontPeds = [];
{
  const r = rng(31);
  const specs = [
    { a: [-12, 7.2], b: [12, 7.2], s: 1.3, o: 0.0 },
    { a: [10, 6.4], b: [-12, 6.4], s: 1.25, o: 0.3 },
    { a: [-9, 6.8], b: [14, 6.8], s: 1.1, o: 0.55 },
    { a: [-2, 1.4], b: [-1.2, 0.9], s: 0, o: 0, stand: true, ry: Math.PI },
    { a: [2.5, 2.2], b: [2.5, 2.2], s: 0, o: 0, stand: true, ry: Math.PI * 0.9 },
    { a: [4.2, 1.2], b: [4.2, 1.2], s: 0, o: 0, stand: true, ry: -Math.PI * 0.8 },
  ];
  for (const sp of specs) { const p = randPerson(r); gFront.add(p); frontPeds.push({ p, ...sp }); }
}
// S2 confused gatherers
const gGather = group(); const gatherPeds = [];
{
  const r = rng(77);
  const targets = [[-3.5, 1.6], [-1.2, 2.4], [1.0, 1.2], [3.4, 2.0], [-4.8, 3.4], [2.4, 3.6], [0, 4.4], [5.0, 3.0]];
  targets.forEach((tg, i) => {
    const p = randPerson(r); gGather.add(p);
    const fromLeft = i % 2 === 0;
    const start = [fromLeft ? -11 - r() * 3 : 11 + r() * 3, 7.0 + (r() - .5) * 1.2];
    const mid = [tg[0] + (fromLeft ? -3 : 3), 6.6];
    const t0 = i * 0.3 - 1.2, t1 = t0 + 2.2 + r() * .5, t2 = t1 + 1.1;
    const q = makeQ(); gGather.add(q);
    gatherPeds.push({ p, q, pts: [[start[0], start[1], t0], [mid[0], mid[1], t1], [tg[0], tg[1], t2]], t2, ph: r() * 6 });
  });
}
// S3 ATM man
const gAtm = group();
const atmMan = makePerson({ skin: SKIN[0], hair: HAIR[0], shirt: '#27324a', pants: '#27324a', tie: true, scale: 1.0 });
gAtm.add(atmMan); atmMan.position.set(-0.5, 0, 0.5);
const card = box(0.02, 0.14, 0.22, mat('#f7c948')); card.position.set(0, -0.62, 0.14); atmMan.userData.arms[1].add(card);
const atmQ = makeQ(); gAtm.add(atmQ);
// S4 night walker
const gNight = group();
const nightW = makePerson({ skin: SKIN[3], hair: '#2a1f1b', shirt: '#c9b8a6', pants: '#3a3f4f', long: true, skirt: true, scale: 0.97 });
gNight.add(nightW);
const bag = box(0.12, 0.3, 0.36, mat('#6b3f3f')); bag.position.set(0.05, -0.62, 0); nightW.userData.arms[0].add(bag);
// S6 returners
const gReturn = group(); const returnPeds = [];
{
  const r = rng(303);
  const specs = [
    { pts: [[-12, 7.2, 0.9], [-1.0, 7.0, 4.4], [-0.6, 2.6, 5.8], [-0.4, 0.4, 6.6]] },
    { pts: [[12, 6.8, 1.4], [1.2, 6.6, 4.9], [0.6, 2.4, 6.2], [0.3, 0.4, 7.2]] },
    { pts: [[-14, 6.4, 2.0], [-4, 6.4, 5.0], [-2.0, 3.6, 6.4], [-1.0, 1.4, 7.6]] },
    { pts: [[14, 7.4, 0.2], [-14, 7.4, 8.5]] },
  ];
  for (const s of specs) { const p = randPerson(r); gReturn.add(p); returnPeds.push({ p, ...s }); }
}

const SUBS = [
  [0.3, 2.9, '平日の夜7時。<br>いつものコンビニ。'],
  [2.9, 5.5, '今から、全部消える。'],
  [5.6, 8.45, '日本中のコンビニ<br>56,054店が。'],
  [8.6, 12, '消えた。'],
  [12.2, 16.1, '毎日、約4,477万人が<br>来ていた。'],
  [16.1, 20, '日本人の、<br>約3人に1人分だ。'],
  [20.2, 23.9, 'お金が、おろせない。'],
  [23.9, 28, 'セブン銀行のATMだけで、<br>1日約316万件。'],
  [28.2, 32.4, '深夜0時。<br>開いている店がない。'],
  [32.4, 37, 'コンビニは、<br>駆け込める場所でもあった。'],
  [37.2, 41, 'スーパーに行列。<br>棚が空になる。'],
  [41, 45, '年間12兆円分の買い物が、<br>行き場をなくした。'],
  [45.2, 49.2, '夜になっても、<br>行く場所がない。'],
  [49.3, 53.5, '結果：のべ約13億人が、<br>行き場をなくした。'],
  [53.7, 59.8, 'あなたが今日寄った店も、<br>その56,054店のひとつ。'],
];
// =====================================================
// shots
// =====================================================
const SHOTS = [
  { a: 0, b: 5.5, f: shot0 }, { a: 5.5, b: 12, f: shot1 }, { a: 12, b: 20, f: shot2 }, { a: 20, b: 28, f: shot3 },
  { a: 28, b: 37, f: shot4 }, { a: 37, b: 45, f: shot5 }, { a: 45, b: 53.5, f: shot6 }, { a: 53.5, b: 60, f: shot7 }, { a: 60, b: 65, f: shotEnd },
];
export const DURATION = 65;
const cityGroups = [gAerial, gFront, gGather, gAtm, gNight, gReturn];
function only(g) { for (const x of cityGroups) x.visible = (x === g); }
function resetCity() { parked[1].visible = true; ghost.visible = ghostScr.visible = ghostFill.visible = false; setBurst(0); for (const s of storeGlows) { s.gm.emissiveIntensity = 0; s.band.emissiveIntensity = 0; s.sp.material.opacity = 0; } }

function hudTime(lab, op = 1) { setHud('経過時間', lab, op); }

function shot0(t, T) {
  only(gAerial); resetCity(); setStore(1); setStoreLights(0.8); setEnv('dusk', new THREE.Vector3(-6, 0, 2)); updateCars(T + 3);
  for (const a of aerialPeds) {
    const u = ((T * a.s + a.o) % 1);
    a.p.position.set(lerp(a.a[0], a.b[0], u), 0, lerp(a.a[1], a.b[1], u));
    a.p.rotation.y = Math.atan2(a.b[0] - a.a[0], a.b[1] - a.a[1]); poseWalk(a.p, T * 7 + a.o * 10);
  }
  const ang = -0.5 + t * 0.035;
  const R = 22, cx = -7, cz = 6;
  look(cx + Math.sin(ang) * R, 44 - t * 1.2, cz + Math.cos(ang) * R, cx, 0, cz - 1, 55);
  el.title.style.opacity = 1;
  const left = Math.max(0, 8.5 - T);
  setHud('コンビニが消えるまで', `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 1000)).padStart(3, '0')}`, 1, { mono: true });
  setTop('', '', 0);
  return city;
}
function shot1(t, T) {
  only(gFront); resetCity(); setEnv('dusk', new THREE.Vector3(0, 0, 0)); updateCars(T + 3, false);
  const tv = 3.0; // vanish moment (T = 8.5)
  const k = t < tv ? 1 : 1 - easeOut((t - tv) / 0.35);
  setStore(k); setStoreLights(k);
  setBurst(t >= tv ? (t - tv) / 1.4 : 0);
  el.flash.style.opacity = t >= tv ? 0.75 * Math.max(0, 1 - (t - tv) / 0.35) : 0;
  for (const f of frontPeds) {
    if (f.stand) {
      f.p.position.set(f.a[0], 0, f.a[1]); f.p.rotation.y = f.ry; poseWalk(f.p, 0, 0);
      f.p.userData.head.rotation.y = t > tv + 0.4 ? Math.sin((t - tv) * 2.2 + f.a[0]) * 0.7 : 0;
      if (t > tv + 0.6) f.p.rotation.y = f.ry + Math.PI * easeOut((t - tv - 0.6) / 0.8) * (f.a[0] > 0 ? 1 : -1) * 0.9;
    } else {
      const u = clamp((t * f.s / 24) + f.o);
      f.p.position.set(lerp(f.a[0], f.b[0], u), 0, lerp(f.a[1], f.b[1], u));
      f.p.rotation.y = Math.atan2(f.b[0] - f.a[0], f.b[1] - f.a[1]); poseWalk(f.p, t * 7.5 + f.o * 9);
    }
  }
  const push = ease(t / 6.5);
  look(0.0, 1.8 + push * 0.4, 16.4 - push * 2.0, 0, 2.5, -1, 60);
  el.title.style.opacity = t < tv ? 1 : Math.max(0, 1 - (t - tv) / 0.3);
  if (t < tv) setHud('全国のコンビニ', '56,054店', 1);
  else setHud('全国のコンビニ', comma(56054 * (1 - easeOut((t - tv) / 1.2))) + '店', 1, { color: '#ff6b6b' });
  setTop('', '', 0);
  return city;
}
function shot2(t, T) {
  only(gGather); resetCity(); parked[1].visible = false; setStore(0); setStoreLights(0); setEnv('dusk', new THREE.Vector3(0, 0, 0)); updateCars(T + 3);
  el.flash.style.opacity = 0; el.title.style.opacity = 0;
  for (const g of gatherPeds) {
    const moving = walkAlong(g.p, g.pts, t);
    if (!moving && t > g.t2) {
      g.p.rotation.y = Math.PI + Math.sin(g.ph) * 0.4;
      g.p.userData.head.rotation.y = Math.sin((t - g.t2) * 1.8 + g.ph) * 0.6;
    } else g.p.userData.head.rotation.y = 0;
    const qa = clamp((t - g.t2 - 0.2) / 0.3);
    g.q.visible = qa > 0; g.q.position.set(g.p.position.x, 2.45 + Math.sin(t * 3 + g.ph) * 0.05, g.p.position.z);
    g.q.scale.setScalar(0.6 * easeBack(qa));
  }
  const u = ease(t / 8);
  look(lerp(8, 6, u), 2.1, lerp(13.5, 12, u), -0.5, 2.6, lerp(0, 1.0, u), 55);
  hudTime('+1分');
  setTop('1日あたりの来店客数（2025年）', '約' + comma(roll(clamp((t - 0.3) / 1.4), 4477)) + '万人', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot3(t, T) {
  only(gAtm); resetCity(); setStore(0); setStoreLights(0); setEnv('night', new THREE.Vector3(0, 0, 2)); updateCars(T + 3);
  // man looks for ATM
  atmMan.rotation.y = 0.35;
  const arms = atmMan.userData.arms; arms[1].rotation.x = -0.9; arms[1].rotation.z = 0.1;
  poseWalk(atmMan, 0, 0); arms[1].rotation.x = -0.9;
  atmMan.userData.head.rotation.y = t > 2.5 ? Math.sin((t - 2.5) * 1.6) * 0.8 : 0;
  const flick = (Math.sin(t * 9) > 0.2 ? 1 : 0.25) * clamp(1 - (t - 3.5) / 2.0);
  ghost.visible = ghostScr.visible = ghostFill.visible = flick > 0.02; ghostM.opacity = 0.95 * flick; ghostFill.material.opacity = 0.28 * flick;
  atmQ.visible = t > 3.2; atmQ.position.set(atmMan.position.x + 0.1, 2.25, atmMan.position.z); atmQ.scale.setScalar(0.6 * easeBack(clamp((t - 3.2) / 0.3)));
  const u = ease(t / 8);
  look(lerp(1.4, 0.9, u), 1.7, lerp(5.0, 4.2, u), -1.05, 1.75, -0.4, 50);
  hudTime('+1時間');
  setTop('セブン銀行ATMの1日の利用件数（2026年6月・推計）', '約' + comma(roll(clamp((t - 0.3) / 1.4), 316)) + '万件', fade(t, 0.15, 8, 0.25));
  return city;
}
function shot4(t, T) {
  only(gNight); resetCity(); setStore(0); setStoreLights(0);
  const x = lerp(12.5, -10, t / 9);
  setEnv('dark', new THREE.Vector3(x, 0, 6)); updateCars(0, false);
  nightW.position.set(x, 0, 7.0); nightW.rotation.y = -Math.PI / 2; poseWalk(nightW, t * 6.5, 0.9);
  nightW.userData.head.rotation.y = (t > 4.6 && t < 6.6) ? Math.sin((t - 4.6) / 2 * Math.PI) * 1.1 : 0;
  look(x - 2.4, 1.7, 13.4, x + 0.9, 1.75, 6, 50);
  hudTime('+5時間');
  setTop('女性・子どもの駆け込みに対応した店舗（2024年）', comma(roll(clamp((t - 0.3) / 1.4), 6000)) + '店以上', fade(t, 0.15, 9, 0.25));
  return city;
}
function shot5(t, T) {
  for (const s of shelfItems) s.it.visible = s.k > t / 7.2;
  for (const q of queues) { poseWalk(q.p, 0, 0); q.p.userData.head.rotation.y = Math.sin(t * 1.3 + q.ph) * 0.35; q.p.position.y = 0; }
  const u = ease(t / 8);
  look(lerp(14, 11, u), lerp(11, 9.5, u), lerp(24, 21, u), -1, 0.5, lerp(5, 4, u), 50);
  hudTime('+1週間');
  const v = Math.round(roll(clamp((t - 0.3) / 1.6), 120583));
  setTop('コンビニの年間売上高（2025年）', `${Math.floor(v / 10000)}兆${comma(v % 10000)}億円`, fade(t, 0.15, 8, 0.25));
  return market;
}
function shot6(t, T) {
  // 結果：1か月後の夜。店のあった場所に、行き場をなくした人たちが立ち尽くす
  only(gGather); resetCity(); parked[1].visible = false; setStore(0); setStoreLights(0); setEnv('night', new THREE.Vector3(0, 0, 2)); updateCars(T, false);
  for (const g of gatherPeds) {
    walkAlong(g.p, g.pts, g.t2 + 1);
    g.p.rotation.y = Math.PI + Math.sin(g.ph) * 0.4;
    g.p.userData.head.rotation.y = Math.sin(t * 1.1 + g.ph) * 0.5;
    g.q.visible = true; g.q.position.set(g.p.position.x, 2.45 + Math.sin(t * 3 + g.ph) * 0.05, g.p.position.z);
    g.q.scale.setScalar(0.6 * easeBack(clamp((t - 0.3 - (g.ph % 1) * 0.6) / 0.3)));
  }
  const u = ease(t / 8.5);
  look(lerp(4.5, 2.8, u), lerp(5.2, 5.8, u), lerp(12.5, 13.2, u), -0.3, 0.2, 1.4, 50);
  hudTime('+1か月');
  const v = roll(clamp((t - 0.4) / 2.6), 13);
  setTop('行き場をなくした来店（1か月・推計）', 'のべ約' + Math.round(v) + '億人', fade(t, 0.15, 8.5, 0.25), t > 4.3 ? '#ff8a7a' : '#fff');
  return city;
}
function shot7(t, T) {
  // 冒頭と同じ俯瞰に戻る。ただし夜で、コンビニはないまま（ループ）
  only(null); resetCity(); parked[1].visible = false; setStore(0); setStoreLights(0); setEnv('night', new THREE.Vector3(-6, 0, 2)); updateCars(T, true);
  el.flash.style.opacity = 0;
  const ang = -0.5 + (6.5 - t) * 0.035 * 0.6;
  const R = 22, cx = -7, cz = 6;
  const h = lerp(52, 44, ease(t / 6.5));
  look(cx + Math.sin(ang) * R, h, cz + Math.cos(ang) * R, cx, 0, cz - 1, 55);
  setTop('全国のコンビニ（2025年末）', comma(roll(clamp((t - 0.3) / 1.6), 56054)) + '店', fade(t, 0.15, 6.5, 0.25));
  return city;
}
function shotEnd(t) {
  el.end.style.opacity = clamp(t / 0.5);
  setHud('', '', 0); setTop('', '', 0);
  return null;
}

let lastScene = null;
window.renderAt = function (T) {
  let s = SHOTS.find(x => T >= x.a && T < x.b) || SHOTS[SHOTS.length - 1];
  el.end.style.opacity = 0; el.title.style.opacity = 0; el.flash.style.opacity = 0;
  document.getElementById('dim').style.opacity = s.f === shot5 ? 1 : 0;
  const scn = s.f(T - s.a, T);
  if (s.f !== shot0 && s.f !== shot1) el.title.style.opacity = 0;
  if (s.f !== shot1 && s.f !== shot6) el.flash.style.opacity = 0;
  setSub(T, SUBS);
  // logo visibility follows hud area; keep logo even when hud empty except end
  el.logo.style.visibility = 'visible';
  if (scn) renderer.render(scn, cam);
  return true;
};
window.META = {
  id: '0001',
  title: '日本中のコンビニが消えたら？',
  mood: 'tension', seed: 3, hits: [8.5, 49.3], risers: [8.5, 49.3],
  caption: '日本中のコンビニ56,054店が一瞬で消えたら、私たちの暮らしはどうなる？\n1日約4,477万人が立ち寄る場所が消えたあとの1か月を、実際のデータでシミュレーション。\n\n出典：日本フランチャイズチェーン協会 コンビニエンスストア統計調査（2025年）、セブン銀行 月次ATM情報（2026年6月）、JFAセーフティステーション活動',
  hashtags: ['もしもラボ', 'もしもシリーズ', 'コンビニ', '雑学', 'シミュレーション'],
  titleHtml: '日本中のコンビニが<br>消えたら？',
  endStats: [['全国のコンビニ店舗数', '56,054店', '2025年末'], ['1日あたりの来店客数', '約4,477万人', '2025年'], ['コンビニの年間売上高', '12兆583億円', '2025年'], ['駆け込みに対応した店舗', '6,000店以上', '2024年'], ['1か月で行き場をなくした来店', 'のべ約13億人', '推計']],
  sources: '出典：日本フランチャイズチェーン協会 コンビニエンスストア統計調査・<br>セーフティステーション活動、セブン銀行 月次ATM情報（2026年6月）',
};
setupCards(window.META);
window.DURATION = DURATION;
document.querySelectorAll('.mk').forEach((m, i) => { m.innerHTML = LOGOS.flask().replace(/id="(\w+)"/g, `id="$1${i}"`).replace(/url\(#(\w+)\)/g, `url(#$1${i})`); });
Promise.all([document.fonts.load('800 40px "M PLUS Rounded 1c"', 'もしもラボ'), document.fonts.load('600 20px Inter', 'MOSHIMO LAB')]).then(() => document.fonts.ready).then(() => { window.renderAt(0); window.READY = true; });
