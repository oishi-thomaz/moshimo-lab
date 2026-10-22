import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade, comma } from '../lib.js';
import { lineScene, setLine, setLineEnv, markers, kmPosts, lineSky, strip, SPACING } from '../scenes/line.js';
import { japan, ll, CITY, setMapEnv, LAND_Y } from '../scenes/japan.js';
import { space, earth, latLon, faceLon, setEarthNight } from '../scenes/earth.js';
import { cam, lift, look, runStory, endCard, setTop, setHud, el, textSprite } from '../story.js';

// もしも日本人1億2千万人が一列に並んだら？
// 数字：総人口 1億2,265万人（総務省 人口推計 2026年9月1日現在 概算値、2026年9月24日公表）
//       1人あたり 50cm は仮定（肩幅＋すき間）。列の長さはすべて 人数×0.5m の計算（推計）
//       全員 1億2,265万人×0.5m＝61,325km（推計）
//       地球の赤道1周 約40,075km（GRS80楕円体の長半径 6,378,137m：国土地理院 日本の測地系 → 2π×6,378.137km の計算）
//       61,325÷40,075≒1.53周（推計）
//       世界人口 82億人（2024年、国連 World Population Prospects 2024）→ 82億×0.5m＝410万km、約102周 → 約100周（推計）
const POP = 122650000, LEN_KM = POP * SPACING / 1000, EQ_KM = 40075, LAPS = LEN_KM / EQ_KM; // 61,325km, 1.53

// ---------- earth: the line as a spiral around a great circle through Tokyo ----------
const p0 = latLon(35.68, 139.7, 1).normalize();
const east = latLon(35.68, 139.8, 1).normalize().sub(p0).normalize();
const north = latLon(35.78, 139.7, 1).normalize().sub(p0).normalize();
const t0 = east.clone().multiplyScalar(Math.cos(0.45)).add(north.clone().multiplyScalar(Math.sin(0.45))).normalize();
const TH = Math.PI * 2 * LAPS;
const NRM = new THREE.Vector3().crossVectors(p0, t0).normalize(); // 列がつくる大円の向き（結果で正面に向ける）
const ePts = []; for (let i = 0; i <= 600; i++) { const th = TH * i / 600; const r = 10 * (1.012 + 0.018 * th / (Math.PI * 2)); ePts.push(p0.clone().multiplyScalar(Math.cos(th)).add(t0.clone().multiplyScalar(Math.sin(th))).multiplyScalar(r)); }
const eCurve = new THREE.CatmullRomCurve3(ePts);
const SEG = 900, RAD = 6;
const eTube = new THREE.Mesh(new THREE.TubeGeometry(eCurve, SEG, 0.11, RAD, false), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
earth.add(eTube);
const eHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); earth.add(eHead);
const eStart = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff5b4f })); eStart.position.copy(p0.clone().multiplyScalar(10.12)); earth.add(eStart);
function earthLine(km) { // reveal km of the line (spiral parameter is proportional to length along the circle)
  const u = clamp(km / LEN_KM);
  eTube.geometry.setDrawRange(0, Math.floor(SEG * u) * RAD * 6);
  eTube.visible = u > 0; eHead.visible = u > 0 && u < 1;
  eHead.position.copy(eCurve.getPointAt(Math.max(0.0005, u)));
}
const eqRing = new THREE.Mesh(new THREE.TorusGeometry(10.05, 0.03, 6, 160), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.0 }));
eqRing.rotation.x = Math.PI / 2; earth.add(eqRing);

// ---------- japan map: the line from Tokyo to the west (map unit ≈ 11.1km) ----------
const route = [[139.7, 35.68], [139.25, 35.32], [138.7, 35.08], [138.38, 34.98], [137.75, 34.72], [137.2, 34.8], [136.9, 35.18], [136.4, 34.95], [135.95, 34.85], [135.5, 34.69], [135.0, 34.72], [134.4, 34.78], [133.9, 34.66], [133.2, 34.5], [132.46, 34.4], [131.8, 34.1]];
const jCurve = new THREE.CatmullRomCurve3(route.map(([lo, la]) => ll(lo, la, LAND_Y + 0.35)), false, 'centripetal');
const kmPerUnit = 111.2 / 10;
const jLenKm = jCurve.getLength() * kmPerUnit;
const JSEG = 400;
const jTube = new THREE.Mesh(new THREE.TubeGeometry(jCurve, JSEG, 0.45, 6, false), new THREE.MeshLambertMaterial({ color: '#ff8a5c', emissive: '#ff6a3c', emissiveIntensity: 0.4 }));
japan.add(jTube);
const jHead = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); japan.add(jHead);
const jStart = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 16), new THREE.MeshBasicMaterial({ color: 0xff5b4f })); { const v = ll(...CITY.tokyo); jStart.position.set(v.x, LAND_Y + 0.4, v.z); } japan.add(jStart);
function mapLine(km) {
  const u = clamp(km / jLenKm);
  jTube.geometry.setDrawRange(0, Math.floor(JSEG * u) * 6 * 6); jTube.visible = u > 0;
  jHead.position.copy(jCurve.getPointAt(Math.max(0.001, u)));
}

const headTag = textSprite('先頭', { size: 80, sx: 700, bg: '#e05a4f', w: 384, h: 128, depthTest: false }); headTag.renderOrder = 7; headTag.position.set(650, 40, 250); headTag.visible = false; lineScene.add(headTag);

const SUBS = [
  [2.6, 6.0, '人気の店の行列。<br>ふつうは数十人。'],
  [6.2, 10.0, '1人50cm（仮定）で、<br>日本人全員が並ぶ。'],
  [10.1, 13.9, '100人で、もう50m。'],
  [14.1, 18.0, '1万人で、5km。'],
  [18.0, 21.9, '先頭はもう、<br>見えない。'],
  [22.1, 26.0, '100万人で、500km。'],
  [26.0, 29.9, '東京から西へ、<br>列はまだ続く。'],
  [30.1, 34.5, '1,000万人で、5,000km。'],
  [34.5, 38.9, '列は日本を出て、<br>海の上へ。'],
  [39.1, 43.4, '全員並ぶと、<br>約6万1,325km（推計）'],
  [43.4, 47.8, '地球の赤道は、<br>1周約4万km。'],
  [48.1, 52.6, '結果：日本人の列は、<br>地球を約1.5周した。'],
  [52.6, 55.4, '世界の82億人なら、<br>約100周（推計）'],
  [55.6, 59.4, '行列、何分までなら<br>並べる？'],
];

const numPeople = n => n >= 1e8 ? `${Math.floor(n / 1e8)}億${comma(Math.floor((n % 1e8) / 1e4))}万人` : n >= 1e4 ? `${comma(Math.floor(n / 1e4))}万人` : `${comma(n)}人`;
const people = (n, op = 1) => setHud('並んだ人数', numPeople(Math.round(n)), op, { mono: true });
const SKYH = () => { lineSky.position.copy(cam.position); };
function camNear(near = 0.05, far = 4000) { cam.near = near; cam.far = far; }

function frontShot(t, n, cx = 0) { // close to the head of the line
  strip.scale.x = 1; headTag.visible = false;
  setLineEnv('day', { fogNear: 40, fogFar: 260 }); markers(false); kmPosts(false); camNear();
  look(lerp(-3.0, -3.4, cx), lerp(2.6, 2.8, cx), lerp(-10.4, -11.2, cx), 0.4, 1.0, 5, 40);
  SKYH();
}
function shot0(t, T) { // hook: people pop in behind the first person
  lift(270);
  const n = 1 + Math.pow(clamp((t - 0.25) / 2.25), 1.6) * 39;
  setLine(n, { pop: true });
  frontShot(t, n, ease(t / 6));
  el.title.style.opacity = 1;
  people(n);
  return lineScene;
}
function shot1(t, T) { // ordinary line
  lift(270);
  const n = 40 + 20 * ease(clamp(t / 3.5));
  setLine(n, { pop: true });
  frontShot(t, n, ease(T / 6));
  el.title.style.opacity = clamp(1 - (t - 2.8) / 0.5);
  people(n);
  return lineScene;
}
function shot2(t, T) { // 100 people = 50m
  lift(260);
  const n = t < 4 ? 60 + 40 * easeOut(clamp((t - 0.3) / 3.4)) : 100;
  setLine(n, { pop: true }); strip.scale.x = 1; headTag.visible = false;
  setLineEnv('day', { fogNear: 80, fogFar: 500 }); markers(true); kmPosts(false); camNear();
  const u = ease(t / 8);
  look(lerp(-9, -11, u), lerp(7, 9, u), lerp(-6, -4, u), -3, 0.8, lerp(20, 24, u), 50);
  SKYH();
  people(n);
  if (t < 3.9) setTop('日本の総人口（2026年9月）', '1億2,265万人', fade(t, 0.15, 3.9, 0.2));
  else setTop('100人の列の長さ（1人50cm・仮定）', Math.round(50 * easeOut(clamp((t - 3.9) / 1.2))) + 'm', fade(t, 3.9, 8, 0.2));
  return lineScene;
}
function shot3(t, T) { // 10,000 people = 5km, aerial
  lift(380); headTag.visible = true;
  const n = 100 + (10000 - 100) * easeOut(clamp((t - 0.2) / 3.0));
  setLine(n);
  strip.visible = true; strip.position.set(0, 0, 0); strip.scale.set(70, 1, n * SPACING); // 空撮用の太い帯（列の位置と長さ）
  setLineEnv('day', { fogNear: 20000, fogFar: 40000 }); markers(false); kmPosts(true, 700); camNear(5, 40000);
  const u = ease(t / 8);
  look(lerp(-1400, -1700, u), lerp(8000, 9000, u), lerp(-1400, -1700, u), 0, 0, lerp(1900, 2000, u), 50);
  SKYH();
  people(n);
  setTop('1万人の列の長さ（推計）', (Math.round(n * SPACING / 100) / 10).toFixed(1) + 'km', fade(t, 0.15, 8, 0.25));
  return lineScene;
}
function shot4(t, T) { // 1,000,000 = 500km on the map
  lift(380); headTag.visible = true; camNear();
  setMapEnv('day');
  const km = 5 + 495 * easeOut(clamp((t - 0.3) / 3.6));
  mapLine(km);
  const tk = ll(136.6, 35.0); const u = ease(t / 8);
  look(tk.x + lerp(4, 0, u), lerp(115, 125, u), tk.z + lerp(70, 78, u), tk.x, 0, tk.z - 8, 50);
  people(1e4 + (1e6 - 1e4) * easeOut(clamp((t - 0.3) / 3.6)));
  setTop('100万人の列の長さ（推計）', comma(km) + 'km', fade(t, 0.15, 8, 0.25));
  return japan;
}
function shot5(t, T) { // 10,000,000 = 5,000km on the globe
  lift(250); camNear();
  setEarthNight(0); eqRing.material.opacity = 0;
  earth.rotation.set(0.35, faceLon(160) + t * 0.02, 0);
  const km = 500 + 4500 * easeOut(clamp((t - 0.3) / 4));
  earthLine(km);
  const u = ease(t / 9);
  look(0, lerp(4, 5, u), lerp(24, 27, u), 0, 1.5, 0, 45);
  people(1e6 + 9e6 * easeOut(clamp((t - 0.3) / 4)));
  setTop('1,000万人の列の長さ（推計）', comma(km) + 'km', fade(t, 0.15, 9, 0.25));
  return space;
}
function shot6(t, T) { // everyone: 61,325km
  lift(lerp(250, 440, ease(t / 9))); camNear();
  setEarthNight(0);
  earth.rotation.set(0.35, faceLon(160) + 0.18 + t * 0.22, 0);
  const km = 5000 + (LEN_KM - 5000) * easeOut(clamp((t - 0.3) / 4.0));
  earthLine(km);
  eqRing.material.opacity = t > 4.3 ? 0.8 * clamp((t - 4.3) / 0.6) : 0;
  const u = ease(t / 9);
  look(0, lerp(5, 6, u), lerp(30, 52, u), 0, 1.5, 0, 45);
  people(1e7 + (POP - 1e7) * easeOut(clamp((t - 0.3) / 4.0)));
  if (t < 4.3) setTop('全員の列の長さ（2026年の人口で推計）', comma(km) + 'km', fade(t, 0.15, 4.3, 0.2));
  else setTop('地球の赤道1周（GRS80から計算）', comma(Math.round(EQ_KM * easeOut(clamp((t - 4.5) / 1.2)))) + 'km', fade(t, 4.3, 8.8, 0.2), '#7fd4ff');
  return space;
}
function shot7(t, T) { // result
  lift(380); camNear();
  setEarthNight(0); eqRing.material.opacity = 0;
  const qa = new THREE.Quaternion().setFromUnitVectors(NRM, new THREE.Vector3(0, 0.42, 0.91).normalize());
  earth.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0.42, 0.91).normalize(), -t * 0.15).multiply(qa));
  earthLine(LEN_KM);
  const u = ease(t / 7.4);
  look(0, 6, lerp(56, 60, u), 0, 1.5, 0, 45);
  people(POP);
  if (t < 4.5) setTop('地球を回った数（2026年の人口で推計）', '約' + (Math.round(15 * easeOut(clamp((t - 0.2) / 1.2))) / 10).toFixed(1) + '周', fade(t, 0.15, 4.5, 0.2));
  else setTop('世界人口82億人（2024年）なら（推計）', '約' + Math.round(100 * easeOut(clamp((t - 4.7) / 1.0))) + '周', fade(t, 4.5, 7.4, 0.2), '#ffd98a');
  return space;
}
function shot8(t, T) { // loop: head of the line, everyone lined up
  lift(270);
  setLine(1e9);
  frontShot(t, 1e9, 0.1 + ease(t / 4) * 0.2);
  people(POP);
  return lineScene;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39, f: shot5 }, { a: 39, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0024',
    series: '日本人全員で',
    title: '日本人1億2千万人が一列に並んだら？',
    titleHtml: '日本人1億2千万人が<br>一列に並んだら？',
    mood: 'calm', seed: 24, hits: [10.1, 39.1, 48.1], risers: [30.1],
    ask: '行列、何分までなら並べる？',
    narr: { '1億2千万人': '1億2千万にん', '50cm': '50センチ', '50m': '50メートル', '5,000km': '5000キロ', '500km': '500キロ', '5km': '5キロ', '6万1,325km': '6万1325キロ', '4万km': '4万キロ', '1,000万人': '1000万人', '1.5周': '1.5しゅう' },
    caption: 'もしも日本人1億2,265万人が、1人50cmで一列に並んだら？\n100人で50m、1万人で5km、100万人で500km。全員だと約6万1,325km。地球の赤道1周は約4万kmなので、日本人の列は地球を約1.5周する（推計）。世界の82億人なら約100周。\n\n行列、何分までなら並べる？ コメントで教えて。\n\n出典：総務省 人口推計（2026年9月1日現在 概算値）、国土地理院 日本の測地系（GRS80楕円体）、国連 World Population Prospects 2024',
    hashtags: ['もしもラボ', '一列に並んだら', '地球何周', '人口', '雑学'],
    endStats: [['日本の総人口', '1億2,265万人', '2026年9月'], ['1人50cm（仮定）で並ぶと', '約6万1,325km', '推計'], ['地球の赤道1周', '約40,075km', 'GRS80から計算'], ['世界の82億人なら', '約100周', '2024年・推計']],
    sources: '出典：総務省 人口推計（2026年9月概算値）、<br>国土地理院 日本の測地系、国連 World Population Prospects 2024',
  },
});
