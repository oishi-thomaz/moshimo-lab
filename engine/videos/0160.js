import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, comma, randPerson } from '../lib.js';
import { town, setTownEnv, setVacant } from '../scenes/town.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { stage, makeBar, makeLabel, setStageColor } from '../scenes/stage.js';
import { cam, lift, look, runStory, endCard, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも世界中の人が同時に叫んだら？（blueprint no 160・日本人全員でシリーズ・v2）
// 数字：
//  ・世界人口 82億3,200万人（2025年。UNFPA World Population Dashboard https://www.unfpa.org/fr/data/world-population/WORLD）
//  ・叫び声の大きさ：男性 89dB・女性 82dB（1m先・A特性・無響室で測定。Pearsons, Bennett, Fidell「Speech Levels in Various Noise
//    Environments」EPA-600/1-77-025, 1977年 Table I https://www.nonoise.org/epa/Roll2/roll2doc16.pdf）
//  ・点音源は距離が2倍になると音圧レベルが6dB小さくなる（日本建設業連合会 音環境専門部会「用語集 距離減衰」
//    https://nikkenren.com/kenchiku/sound/pdf/glossary/ka-0500.pdf）
//    → 10倍で20dB：1m 89 → 10m 69 → 100m 49 → 1km 29dB（単純計算。空気の吸収・建物・風は考えない）
//  ・騒音の目安：90dB 大声の合唱・騒々しい工場の中／30dB 郊外の深夜・ささやき声（秋田市「騒音・振動の例」
//    https://www.city.akita.lg.jp/kurashi/recycle/1006072/1009933/1006282.html）
//  ・音の速さ：1秒でおよそ340m（気象庁 キッズ https://www.jma.go.jp/jma/kids/kids/faq/a3_16.html）→ 1km は約2.9秒（単純計算）
//  ・音は空気などの媒体を振動させて伝わる。媒体がないと聞こえない（立命館大学 情報理工学部 西浦研究室の解説
//    https://www.ritsumei.ac.jp/tanq/332256）→ 宇宙（真空）には伝わらない

const GOLD = '#ffd27a', BLUE = '#7fd4ff', RED = '#ff8a7a', GREEN = '#7ff0c8';

// ---------- 町の人（交差点に集まって叫ぶ） ----------
const PEOPLE = [];
{
  const r = rng(160);
  const spots = [[0, 0.6], [-1.1, -0.2], [1.1, -0.3], [-0.5, -1.4], [0.7, -1.6], [-2.1, -1.1], [2.0, -1.2], [-1.6, 0.9], [1.7, 0.8], [-0.1, -2.6], [-2.8, 0.1], [2.9, -0.1], [1.4, -2.7], [-1.5, -2.7]];
  for (const [x, z] of spots) { const p = randPerson(r); p.position.set(x, 0, z); p.rotation.y = (r() - .5) * 0.5; town.add(p); PEOPLE.push({ p, ph: r() * 6 }); }
}
const yell = textSprite('ワーッ！', { w: 768, h: 256, size: 190, color: '#fff3a8', stroke: 22, strokeColor: '#5a2a10' }); town.add(yell);
// 音の輪（地面に水平）
const RM = new THREE.MeshBasicMaterial({ color: '#fff2a8', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
const RINGS = []; const RINGW = new THREE.RingGeometry(0.97, 1, 160);
for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 96), RM.clone()); m.rotation.x = -Math.PI / 2; m.position.y = 0.6; town.add(m); RINGS.push(m); }
// 1km の目印（距離の輪）
const distLab = textSprite('', { w: 640, h: 160, size: 80, color: '#fff', bg: 'rgba(10,14,22,.78)', depthTest: false }); distLab.renderOrder = 20; town.add(distLab);
const bigGround = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), mat('#7aa866')); bigGround.rotation.x = -Math.PI / 2; bigGround.position.y = -0.6; bigGround.visible = false; town.add(bigGround);
const kmRing = new THREE.Mesh(new THREE.RingGeometry(985, 1015, 160), new THREE.MeshBasicMaterial({ color: '#ff8a7a', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, depthTest: false })); kmRing.rotation.x = -Math.PI / 2; kmRing.position.y = 1; kmRing.visible = false; town.add(kmRing);
function people(k, t) { // k: 叫び 0..1
  PEOPLE.forEach(({ p, ph }) => {
    const a = p.userData.arms; const up = easeOut(clamp(k)) * (2.7 + Math.sin(t * 9 + ph) * 0.12);
    a[0].rotation.x = -up; a[1].rotation.x = -up; a[0].rotation.z = -0.25 * k; a[1].rotation.z = 0.25 * k;
    p.userData.head.rotation.x = -0.35 * k; p.position.y = k > 0 ? Math.abs(Math.sin(t * 10 + ph)) * 0.05 : 0;
  });
}
function rings(on, r0, speed, maxR, t, op = 0.9) {
  RINGS.forEach((m, i) => {
    m.visible = on; if (!on) return;
    const R = r0 + ((t * speed + i * maxR / RINGS.length) % maxR);
    m.scale.set(R, R, 1); m.material.opacity = op * (1 - R / maxR);
  });
}
function townBase(env = 'day') { bigGround.visible = false; kmRing.visible = false; setTownEnv(env); setVacant(0); town.fog.near = 70; town.fog.far = 220; yell.visible = false; distLab.visible = false; rings(false); }

// ---------- 地球：あちこちで叫び ----------
const EP = []; {
  const r = rng(7);
  const land = [[35.7, 139.7], [34.7, 135.5], [31.2, 121.5], [39.9, 116.4], [28.6, 77.2], [19.0, 72.8], [23.1, 113.3], [-6.2, 106.8], [14.6, 121.0], [13.7, 100.5], [37.5, 127.0], [30.0, 31.2], [6.5, 3.4], [-1.3, 36.8], [48.9, 2.3], [51.5, -0.1], [52.5, 13.4], [55.7, 37.6], [41.0, 29.0], [40.7, -74.0], [34.0, -118.2], [41.9, -87.6], [19.4, -99.1], [-23.5, -46.6], [-34.6, -58.4], [-33.9, 151.2], [24.9, 67.0], [23.8, 90.4], [33.7, 73.0], [-26.2, 28.0]];
  const geo = new THREE.RingGeometry(0.8, 1, 40);
  for (let i = 0; i < 90; i++) {
    const [la, lo] = land[i % land.length]; const p = latLon(la + (r() - .5) * 6, lo + (r() - .5) * 8, 10.08);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffe58a', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2)); earth.add(m); EP.push({ m, ph: r() });
  }
}
function earthRings(on, t, size = 0.9) { EP.forEach(({ m, ph }) => { m.visible = on; if (!on) return; const u = (t * 0.8 + ph) % 1; m.scale.setScalar(0.05 + u * size); m.material.opacity = 0.95 * (1 - u); }); }

// ---------- ステージ：距離と大きさ（dB） ----------
setStageColor('#14213a');
const DB = [['1m', 89], ['10m', 69], ['100m', 49], ['1km', 29]];
const bars = DB.map(([d, v], i) => makeBar({ color: i === 3 ? '#7fd4ff' : '#e0a24a', w: 1.7, d: 1.5, label: d + '先', x: -4.8 + i * 3.2, z: 0 }));
const whisperM = new THREE.MeshBasicMaterial({ color: '#7ff0c8', transparent: true, opacity: 0.85 });
const whisper = new THREE.Mesh(new THREE.BoxGeometry(14, 0.06, 0.06), whisperM); stage.add(whisper);
const whisperLab = makeLabel('ささやき声 30dB', { sx: 4.2, size: 64, color: GREEN, w: 768, h: 128 }); stage.add(whisperLab);
const ruleLab = makeLabel('距離2倍で −6dB', { sx: 7, size: 110, color: GOLD, stroke: 10, w: 1024, h: 192 }); ruleLab.position.set(0, 7.8, 0); stage.add(ruleLab);
const HS = 0.075; // 1dB の高さ
function setBars(k, n = 4) { bars.forEach((b, i) => { const v = DB[i][1]; const kk = i < n ? clamp(k * 1.5 - i * 0.18) : 0; b.g.visible = i < n; b.setH(v * HS * ease(kk), kk > 0.05 ? Math.round(v * ease(kk)) + 'dB' : ''); }); }
function stageMode(bar, rule, wh) { bars.forEach(b => b.g.visible = bar); ruleLab.visible = rule; whisper.visible = wh; whisperLab.visible = wh; const y = 0.3 + 30 * HS; whisper.position.set(0, y, 0.9); whisperLab.position.set(1.6, y + 0.5, 1.2); }

const SUBS = [
  [2.6, 6.1, '地球が震える爆音に？<br>答えは、かなり意外。'],
  [6.2, 10.1, '叫んだのは、<br>約82億人。'],
  [10.2, 14.1, '1人の叫び声は、<br>1m先で約89デシベル。'],
  [14.2, 18.1, '騒々しい工場の中と、<br>ほぼ同じうるささ。'],
  [18.2, 22.1, 'でも本当にヤバいのは、<br>ここから。'],
  [22.2, 26.1, '距離が2倍になるたび、<br>6デシベル小さくなる。'],
  [26.2, 30.1, '10m先で約69、<br>100m先で約49。'],
  [30.2, 34.1, '1km先では約29デシベル。<br>ささやき声くらい。'],
  [34.2, 38.1, 'しかも音は、1秒に<br>約340mしか進まない。'],
  [38.2, 42.6, '1km先の叫びは、<br>約3秒おくれて小さく届く。'],
  [42.7, 47.8, 'そして宇宙には空気がない。<br>音は1ミリも出ていけない。'],
  [48.1, 53.8, '結果：82億人が叫んでも、<br>聞こえるのは近所の声だけ。'],
  [53.9, 56.1, '地球の外は、静かなまま。'],
  [56.2, 59.4, '次に全人類で<br>やってほしいことは？'],
];

const cd = (left) => `0:${String(Math.floor(Math.max(0, left))).padStart(2, '0')}.${String(Math.floor((Math.max(0, left) % 1) * 100)).padStart(2, '0')}`;
const TP = 0.5;
function hookCam(t) { const u = ease(clamp(t / 2.6)); look(lerp(0.4, 0.2, u), lerp(2.3, 2.6, u), lerp(7.2, 7.8, u), 0, 1.9, -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：交差点の人たち。0.5秒で全員が叫ぶ
  townBase('day'); lift(170);
  const k = t - TP; people(k > 0 ? clamp(k / 0.15) : 0, t);
  yell.visible = k > 0; yell.position.set(0, 2.2 + easeOut(clamp(k / 0.4)) * 0.1, -0.9); const s = 2.0 * easeBack(clamp(k / 0.3)); yell.scale.set(s, s / 3, 1);
  rings(k > 0, 0.3, 6, 14, k);
  el.flash.style.opacity = k > 0 ? 0.4 * Math.max(0, 1 - k / 0.25) : 0;
  hookCam(t); if (k > 0 && k < 0.7) { cam.position.x += Math.sin(t * 80) * 0.05; cam.position.y += Math.cos(t * 70) * 0.04; }
  setHud('全員で叫ぶまで', cd(TP - t), 1, { mono: true, color: t < TP ? '#fff' : '#ffd27a' });
  return town;
}
function shot1(t) { // 引いて：町じゅうに音の輪
  townBase('day'); lift(140); people(1, t + 3); rings(true, 0.5, 9, 40, t + 2, 0.8);
  const u = ease(clamp(t / 3.6)); look(lerp(3, 10, u), lerp(6, 34, u), lerp(14, 40, u), 0, 0, -2, 50);
  return town;
}
function shot2(t) { // 82億人：地球のあちこちで叫び
  setEarthNight(0); earth.rotation.y = faceLon(100) + t * 0.05; earth.rotation.x = 0.35; earthRings(true, t);
  lift(120); const u = ease(clamp(t / 4)); look(0, lerp(4, 2, u), lerp(36, 33, u), 0, 0.5, 0, 50);
  setHud('叫んだ人', '82億3,200万人', 1, { color: GOLD });
  setTop('世界の人口（2025年）', '約' + countUp(t, 82) + '億人', fade(t, 0.15, 3.9, 0.25), GOLD);
  return space;
}
function shot3(t) { // 1人の叫び：1m先で89dB
  townBase('day'); lift(170); people(1, t + 5); rings(true, 0.2, 2.2, 3.4, t, 0.9);
  const u = ease(clamp(t / 8)); look(lerp(1.6, 1.0, u), lerp(1.9, 2.0, u), lerp(5.2, 4.6, u), 0, 1.6, 0.2, 50);
  if (t < 4) setTop('叫び声（男性・1m先・1977年の測定）', '約' + countUp(t, 89) + 'dB', fade(t, 0.15, 3.9, 0.25), RED);
  else setTop('騒々しい工場の中・大声の合唱', '約90dB', fade(t, 4.0, 7.9, 0.25), RED);
  return town;
}
function shot4(t) { // ここから：カメラが一気に離れる
  townBase('day'); lift(140); people(1, t + 9); rings(true, 0.3, 8, 30, t, 0.75);
  const u = easeOut(clamp(t / 3.5)); look(lerp(1.2, 14, u), lerp(2.0, 30, u), lerp(4.8, 55, u), 0, 0.8, 0, 50);
  setTop('本当にヤバいのは', '距離', fade(t, 0.15, 3.9, 0.25), GOLD);
  return town;
}
function shot5(t) { // ステージ：距離とdB
  lift(260);
  if (t < 4) { stageMode(false, true, false); ruleLab.position.y = 4.4 + Math.sin(t * 3) * 0.08; look(0, 4.6, 16, 0, 4.2, 0, 50); setTop('点音源の距離減衰', '2倍で−6dB', fade(t, 0.15, 3.9, 0.25), GOLD); return stage; }
  stageMode(true, false, t > 8); const n = t < 8 ? 3 : 4; setBars(t < 8 ? clamp((t - 4) / 2.5) : 1, n);
  if (t >= 8) { bars[3].setH(29 * HS * ease(clamp((t - 8) / 1.2)), t > 8.2 ? Math.round(29 * ease(clamp((t - 8) / 1.2))) + 'dB' : ''); }
  const u = ease(clamp((t - 4) / 8)); look(lerp(-0.6, 0.4, u), 4.6, lerp(28, 26.5, u), 0, 3.4, 0, 50);
  if (t < 8) setTop('叫び声の大きさ（単純計算）', '100m先で約49dB', fade(t, 4.0, 7.9, 0.25), GOLD);
  else setTop('1km先（単純計算）', '約29dB', fade(t, 8.0, 12, 0.25), BLUE);
  return stage;
}
function shot6(t) { // 音の輪が1秒に340mで広がる（約3秒を8.5秒で）
  townBase('day'); people(1, t); lift(120); town.fog.near = 400; town.fog.far = 1200;
  const sec = clamp(t / 8.5) * 3.0; const R = Math.max(0.5, 340 * sec);
  RINGS.forEach((m, i) => { m.visible = i === 0; }); RINGS[0].scale.set(R, R, 1); RINGS[0].material.opacity = 0.95; RINGS[0].position.y = 1.5;
  bigGround.visible = true; kmRing.visible = true; RINGS[0].geometry = RINGW;
  const H = lerp(120, 2900, ease(clamp(t / 4.5))); look(0, H, H * 0.35, 0, 0, -H * 0.02, 50); town.fog.near = H * 1.5; town.fog.far = H * 4;
  distLab.visible = true; distLab.userData.set('1km'); distLab.position.set(0, 30, -1180); distLab.scale.set(H * 0.2, H * 0.05, 1);
  setHud('叫んでから', `${sec.toFixed(1)}秒`, 1, { mono: true, color: GOLD });
  if (t < 4) setTop('音の速さ', '1秒に約340m', fade(t, 0.15, 3.9, 0.25), GOLD);
  else setTop('1km先に届くまで（単純計算）', '約2.9秒', fade(t, 4.0, 8.4, 0.25), GOLD);
  return town;
}
function shot7(t) { // 宇宙：音は出ていけない
  setEarthNight(0.15); earth.rotation.y = faceLon(130) + t * 0.03; earth.rotation.x = 0.3; earthRings(true, t, 0.6);
  lift(120); const u = ease(clamp(t / 5.3)); look(0, lerp(2, 3, u), lerp(32, 40, u), 0, 0.5, 0, 50);
  setTop('宇宙（空気がない）に伝わる音', '0', fade(t, 0.15, 5.2, 0.25), BLUE);
  return space;
}
function shot8(t) { // 結果：町の上から。輪は近所で消える
  townBase('dusk'); lift(140); people(1, t); rings(true, 0.5, 7, 22, t, 0.85);
  const u = ease(clamp(t / 7.4)); look(lerp(-8, 6, u), 26, 30, 0, 0, -3, 50);
  if (t < 3.7) setTop('1km先の叫び声（単純計算）', 'ささやき声くらい', fade(t, 0.15, 3.7, 0.25), GREEN);
  else setTop('宇宙に伝わる音', '0', fade(t, 3.7, 7.4, 0.25), BLUE);
  return town;
}
function shot9(t) { // ループ：冒頭と同じ。0:00.50
  townBase('day'); lift(170); people(0, t); hookCam(0);
  setHud('全員で叫ぶまで', cd(TP), 1, { mono: true });
  return town;
}

const shots = [
  { a: 0, b: 2.6, f: shot0 }, { a: 2.6, b: 6.2, f: shot1 }, { a: 6.2, b: 10.2, f: shot2 }, { a: 10.2, b: 18.2, f: shot3 },
  { a: 18.2, b: 22.2, f: shot4 }, { a: 22.2, b: 34.2, f: shot5 }, { a: 34.2, b: 42.7, f: shot6 }, { a: 42.7, b: 48.0, f: shot7 },
  { a: 48.0, b: 55.4, f: shot8 }, { a: 55.4, b: 59.6, f: shot9 }, { a: 59.6, b: 64.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.6, camera: cam,
  meta: {
    id: '0160',
    v2: true,
    hookLine: '全人類が、同時に叫んだ。',
    series: '日本人全員で',
    hookType: 'H1',
    cat: '全員が同時に・極端な数字',
    title: '世界中の人が同時に叫んだら？',
    titleHtml: '世界中の人が<br>同時に叫んだら？',
    mood: 'mystery', seed: 160, hits: [0.5, 48.1], risers: [18.2], impacts: [6.4, 10.6, 30.4, 42.9],
    sfx: [[0.5, 'whoosh'], [18.3, 'whoosh'], [34.3, 'meter', 0.4]],
    narr: { '82億人': 'はちじゅうにおくにん', '89デシベル': 'はちじゅうきゅうデシベル', '6デシベル': 'ろくデシベル', '10m先で約69、': 'じゅうメートル先で、やくろくじゅうきゅう、', '100m先で約49。': 'ひゃくメートル先で、やくよんじゅうきゅう。', '1km先': 'いちキロ先', '29デシベル': 'にじゅうきゅうデシベル', '340m': 'さんびゃくよんじゅうメートル', '1m先': 'いちメートル先' },
    ask: '次に全人類でやってほしいことは？',
    caption: 'もしも世界中の約82億人が、同時に叫んだら？\n\n1人の叫び声は、1m先で約89デシベル（男性）。騒々しい工場の中と同じくらいのうるささ。\nでも音は、距離が2倍になるたびに6デシベルずつ小さくなる。10m先で約69、100m先で約49、1km先では約29デシベル。ささやき声くらい。\nしかも音は1秒に約340mしか進まないから、1km先の叫びは約3秒おくれて届く。\nそして宇宙には空気がないので、音は1ミリも出ていけない。\n\n結果：82億人が叫んでも、聞こえるのは近所の声だけ。地球の外は静かなまま。\n\n次に全人類でやってほしいことは？ コメントで教えて。\n\n※距離の計算は、空気の吸収や建物・風を考えない単純計算\n出典：UNFPA（2025年）、米国環境保護庁 EPA 報告書（1977年）、日本建設業連合会、秋田市、気象庁、立命館大学',
    hashtags: ['もしもラボ', '全人類', '叫ぶ', '音の科学', '雑学'],
    endStats: [['叫んだ人', '約82億人', '2025年'], ['叫び声（1m先）', '約89dB', '1977年の測定'], ['1km先（単純計算）', '約29dB', 'ささやき声くらい'], ['1km先に届くまで', '約2.9秒', '音速 約340m/秒'], ['宇宙に伝わる音', '0', '空気がない']],
    sources: '出典：UNFPA、米EPA（1977年）、日本建設業連合会、<br>秋田市、気象庁、立命館大学',
  },
});
