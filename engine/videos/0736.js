import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade, mat, box, canvasTex, makePerson, SKIN, HAIR } from '../lib.js';
import { makeDog, dogPose, dogIdle } from '../scenes/dog.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// 人を一番殺している生き物は？（ヤバい順シリーズ・v2）
// 1年に人を死なせている数を、少ない順（5位→1位）にメーターで見せる。メーターは1位（61万人）を1とした実数の比（直線）。
// 数字：
//  サメ：2025年の世界の死亡12人、うち挑発なし（unprovoked）の死亡9人。挑発なしのかみつき65件（Florida Museum / International Shark Attack File「The ISAF 2025 shark attack report」）
//   https://www.floridamuseum.ufl.edu/shark-attacks/yearly-worldwide-summary/
//  イヌ（狂犬病）：狂犬病の死者 年44,203人（WHO Global Health Estimates 2021）。人の狂犬病の最大99%はイヌからうつる（WHO ファクトシート Rabies）
//   https://www.who.int/news-room/fact-sheets/detail/rabies
//  ヘビ：ヘビにかまれて死ぬ人 年81,410〜137,880人（WHO ファクトシート Snakebite envenoming）
//   https://www.who.int/news-room/fact-sheets/detail/snakebite-envenoming
//  人間（殺人）：2021年の殺人の犠牲者 45万8,000人、1時間に52人（UNODC Global Study on Homicide 2023・2023年12月の発表）
//   https://www.unodc.org/unodc/en/press/releases/2023/December/fifty-two-people-lost-their-lives-to-homicide-globally-every-hour-in-2021--says-new-report-from-unodc.html
//  蚊：マラリアの死者 2024年 約61万人（WHO World Malaria Report 2025）。蚊がうつす他の病気（デング熱など）は数えていない
//   https://www.who.int/teams/global-malaria-programme/reports/world-malaria-report-2025
//  61万÷9＝約6.8万 → サメの6万倍以上（単純計算）
// ワニは一次資料の年間死者数が見つからないので入れていない。

const GREEN = '#7ff0c8', RED = '#ff5a4f', GOLD = '#ffe08a', BLUE = '#7fd4ff';

// ---------- models ----------
function makeShark() { // +x が頭
  const g = new THREE.Group();
  const gray = mat('#6f8597'), dark = mat('#4f6475'), belly = mat('#e9eef2');
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), gray); body.scale.set(1.9, 0.62, 0.62); g.add(body);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.29, 14, 10), belly); bel.scale.set(1.75, 0.5, 0.56); bel.position.y = -0.05; g.add(bel);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.32, 10), gray); snout.rotation.z = -Math.PI / 2; snout.scale.set(1, 1, 0.85); snout.position.set(0.62, 0.0, 0); g.add(snout);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.36, 4), dark); fin.scale.set(1, 1, 0.25); fin.position.set(-0.02, 0.29, 0); fin.rotation.z = 0.35; g.add(fin);
  const tail = new THREE.Group(); tail.position.set(-0.55, 0, 0); g.add(tail);
  const stem = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 8), gray); stem.rotation.z = Math.PI / 2; stem.position.x = -0.12; tail.add(stem);
  const t1 = box(0.1, 0.38, 0.04, dark); t1.position.set(-0.3, 0.14, 0); t1.rotation.z = -0.55; tail.add(t1);
  const t2 = box(0.08, 0.24, 0.04, dark); t2.position.set(-0.27, -0.1, 0); t2.rotation.z = 0.6; tail.add(t2);
  for (const s of [-1, 1]) {
    const p = box(0.26, 0.03, 0.18, dark); p.position.set(0.15, -0.12, s * 0.2); p.rotation.set(s * 0.45, 0.3 * s, 0.3); g.add(p);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), mat('#111')); e.position.set(0.55, 0.06, s * 0.12); g.add(e);
    for (let k = 0; k < 3; k++) { const gl = box(0.012, 0.11, 0.01, dark); gl.position.set(0.32 - k * 0.05, 0.0, s * 0.175); g.add(gl); }
  }
  const mouth = box(0.16, 0.02, 0.2, mat('#3a2a2e')); mouth.position.set(0.56, -0.1, 0); g.add(mouth);
  g.userData.anim = (t) => { tail.rotation.y = Math.sin(t * 4) * 0.35; g.position.y = (g.userData.y0 ?? g.position.y) + Math.sin(t * 1.6) * 0.03; };
  return g;
}
function makeSnake() { // とぐろ＋鎌首
  const g = new THREE.Group();
  const green = mat('#5f9a3a'), dark = mat('#3d6a24'), pale = mat('#d9d48a');
  [[0.32, 0.075, 0.07], [0.25, 0.07, 0.2], [0.17, 0.065, 0.32]].forEach(([r, tube, y], i) => {
    const c = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 22), i % 2 ? dark : green); c.rotation.x = Math.PI / 2; c.position.y = y; g.add(c);
  });
  const neck = new THREE.Group(); neck.position.set(0.05, 0.36, 0.05); g.add(neck);
  const n1 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.36, 8), green); n1.position.y = 0.18; n1.rotation.z = -0.2; neck.add(n1);
  const head = new THREE.Group(); head.position.set(0.08, 0.4, 0); neck.add(head);
  const hd = box(0.2, 0.09, 0.14, green); hd.position.x = 0.06; head.add(hd);
  const chin = box(0.17, 0.03, 0.11, pale); chin.position.set(0.06, -0.05, 0); head.add(chin);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), mat('#f2d23a')); e.position.set(0.1, 0.035, s * 0.07); head.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.011, 5, 4), mat('#111')); p.position.set(0.112, 0.036, s * 0.083); head.add(p); }
  const tongue = new THREE.Group(); tongue.position.set(0.16, -0.02, 0); head.add(tongue);
  for (const s of [-1, 1]) { const tg = box(0.12, 0.01, 0.01, mat('#d8344a')); tg.position.set(0.06, 0, s * 0.012); tg.rotation.y = s * 0.25; tongue.add(tg); }
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const d = box(0.05, 0.02, 0.05, dark); d.position.set(Math.cos(a) * 0.32, 0.14, Math.sin(a) * 0.32); g.add(d); }
  g.userData.anim = (t) => { neck.rotation.z = Math.sin(t * 1.3) * 0.12; head.rotation.z = Math.sin(t * 1.3 + 1) * 0.1; tongue.scale.x = Math.max(0.05, Math.sin(t * 9)); };
  return g;
}

function makeMosquito() { // +x が頭。細い体・しま模様のおなか・長い脚・針のような口
  const g = new THREE.Group();
  const dk = mat('#5a4a3c'), st = mat('#efe6d6'); // 暗い背景でも形が分かるように明るめの茶色と白のしま
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), dk); thorax.scale.set(1.2, 1, 0.9); g.add(thorax);
  const abd = new THREE.Group(); abd.position.set(-0.1, -0.01, 0); abd.rotation.z = 0.25; g.add(abd);
  for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.05 - i * 0.004, 0.05 - i * 0.004, 0.06, 8), i % 2 ? st : dk); seg.rotation.z = Math.PI / 2; seg.position.x = -0.03 - i * 0.055; abd.add(seg); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), dk); head.position.set(0.12, 0.02, 0); g.add(head);
  for (const s2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat('#5a1f1f')); e.position.set(0.14, 0.03, s2 * 0.035); g.add(e); }
  const pro = box(0.24, 0.012, 0.012, dk); pro.position.set(0.27, -0.03, 0); pro.rotation.z = -0.25; g.add(pro);
  for (const s2 of [-1, 1]) { const an = box(0.14, 0.008, 0.008, dk); an.position.set(0.2, 0.05, s2 * 0.03); an.rotation.set(0, s2 * -0.4, 0.5); g.add(an); }
  for (const s2 of [-1, 1]) for (const x of [-0.05, 0.0, 0.05]) {
    const up = box(0.012, 0.2, 0.012, dk); up.geometry.translate(0, -0.1, 0); up.position.set(x, -0.03, s2 * 0.05); up.rotation.set(s2 * 0.9, 0, x * 4); g.add(up);
    const lo = box(0.01, 0.26, 0.01, dk); lo.geometry.translate(0, -0.13, 0); lo.position.set(x + x * 1.5, -0.16, s2 * 0.2); lo.rotation.set(s2 * -0.15, 0, x * 3); g.add(lo);
  }
  const wingM = new THREE.MeshBasicMaterial({ color: 0xbfd4ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
  const wings = [];
  for (const s2 of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.09), wingM); w.geometry.translate(-0.13, 0, 0); const pv = new THREE.Group(); pv.position.set(-0.02, 0.07, s2 * 0.03); pv.rotation.y = s2 * 0.35; pv.add(w); w.rotation.x = Math.PI / 2; g.add(pv); wings.push(pv); }
  g.userData.flap = (t) => { const a = Math.sin(t * 60) * 0.6; wings[0].rotation.x = a; wings[1].rotation.x = -a; };
  return g;
}

// ---------- lineup: 5 pedestals with death meters (5位→1位) ----------
const stage = new THREE.Scene();
stage.background = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1324'); gr.addColorStop(0.6, '#1a1f3b'); gr.addColorStop(1, '#0b1120'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x1a2238, 1.1); stage.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(3, 8, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); stage.add(key);
const redLight = new THREE.PointLight(0xff4a3a, 0, 9, 1.4); redLight.position.set(1.1, 3.2, 1.6); stage.add(redLight);
const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), mat('#1b2846')); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; stage.add(floor);

const NAMES = ['サメ', 'イヌ', 'ヘビ', '人間', '蚊'];
const RANK = ['5位', '4位', '3位', '2位', '1位'];
const WORDS = ['9人', '4.4万人', '8.1〜13.8万人', '45.8万人', '61万人'];
const LEVEL = [9 / 610000, 44203 / 610000, 109645 / 610000, 458000 / 610000, 1.0]; // ヘビは 8.1〜13.8万の真ん中
const SX = [-2.2, -1.1, 0, 1.1, 2.2];
const MH = 2.0;
function makeHero(i) {
  if (i === 0) { const s = makeShark(); s.scale.setScalar(0.95); s.position.y = 0.78; s.userData.y0 = 0.78; s.rotation.y = -0.55; return s; }
  if (i === 1) { const d = makeDog({ kind: 'shiba' }); dogPose(d, 'stand'); d.scale.setScalar(1.15); d.position.y = 0.32; d.rotation.y = -0.6; d.userData.anim = (t) => dogIdle(d, t); return d; }
  if (i === 2) { const s = makeSnake(); s.scale.setScalar(1.15); s.position.y = 0.32; s.rotation.y = -0.9; return s; }
  if (i === 3) { const p = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#3a4f7a', pants: '#2b2f3a', scale: 0.58 }); p.position.y = 0.32; p.rotation.y = -0.25; p.userData.anim = () => {}; return p; }
  const m = makeMosquito(); m.scale.setScalar(2.3); m.position.y = 1.05; m.rotation.y = -0.15; m.userData.anim = (t) => { m.userData.flap(t); m.position.y = 1.05 + Math.sin(t * 2.2) * 0.05; m.position.x = Math.sin(t * 1.3) * 0.05; }; return m;
}
const SLOTS = NAMES.map((name, i) => {
  const g = new THREE.Group(); g.position.set(SX[i], 0, 0); stage.add(g);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.32, 28), mat('#2c3b5e')); ped.position.y = 0.16; ped.receiveShadow = true; ped.castShadow = true; g.add(ped);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 6, 32), mat('#7fd4ff', { emissive: 0x245a78, emissiveIntensity: 0.6 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.33; g.add(rim);
  const tube = new THREE.Mesh(new THREE.BoxGeometry(0.34, MH, 0.12), new THREE.MeshLambertMaterial({ color: '#9fb4d6', transparent: true, opacity: 0.16 })); tube.position.set(0, 1.1 + MH / 2, -0.75); g.add(tube);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, MH, 0.12)), new THREE.LineBasicMaterial({ color: '#9fb4d6', transparent: true, opacity: 0.5 })); frame.position.copy(tube.position); g.add(frame);
  const fillM = new THREE.MeshLambertMaterial({ color: '#7ff0c8', emissive: 0x1a4a3a, emissiveIntensity: 0.8 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.1), fillM); fill.geometry.translate(0, 0.5, 0); fill.position.set(0, 1.1, -0.75); fill.scale.y = 0.001; g.add(fill);
  const lab = textSprite('', { size: 60, sx: 1.0, w: 640, h: 128, stroke: 8 }); lab.position.set(0, 0.06, 0.78); lab.material.depthTest = false; lab.renderOrder = 5; g.add(lab);
  const word = textSprite('', { size: 64, sx: 1.05, w: 640, h: 128, stroke: 8, color: '#fff' }); word.visible = false; word.material.depthTest = false; word.renderOrder = 6; g.add(word);
  const q = textSprite('？', { w: 256, h: 256, size: 190, sx: 0.8, stroke: 10, color: '#cfd8ea' }); q.position.set(0, 0.85, 0); g.add(q);
  const hero = makeHero(i); hero.userData.s0 = hero.scale.x;
  hero.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.add(hero);
  return { g, rim, fill, fillM, word, lab, q, hero, curLab: '', curWord: '' };
});
const COLD = new THREE.Color('#7ff0c8'), MID = new THREE.Color('#ffd166'), HOT = new THREE.Color('#ff5a4f');
const REVEAL = [-5, 12.7, 23.9, 35.0, 45.7]; // 出来上がりの秒：？が生き物に変わる
const RISE = [0.35, 13.0, 24.2, 35.3, 46.0];    // メーターが上がり始める
const lineSpark = makeSparkles(260, 0.22); stage.add(lineSpark.points);
function slotState(T, labs) {
  SLOTS.forEach((s, i) => {
    const r = T - REVEAL[i];
    const shown = r >= 0;
    const pop = shown ? easeOut(clamp(r / 0.35)) : 0;
    s.hero.visible = shown; s.hero.scale.setScalar(s.hero.userData.s0 * Math.max(0.001, pop) * (1 + 0.25 * Math.max(0, Math.sin(clamp(r / 0.45) * Math.PI))));
    s.q.visible = !shown; s.q.position.y = 0.85 + Math.sin(T * 2 + i) * 0.04;
    if (shown) s.hero.userData.anim(T + i);
    if (i === 0) { const b = T - RISE[0]; s.hero.position.y = 0.78 + (b > 0 && b < 0.6 ? Math.sin(b / 0.6 * Math.PI) * 0.2 : 0) + Math.sin(T * 1.6) * 0.03; s.hero.rotation.z = b > 0 && b < 0.6 ? Math.sin(b / 0.6 * Math.PI) * 0.3 : 0; }
    s.lab.visible = labs;
    const labTxt = shown ? `${RANK[i]} ${NAMES[i]}` : RANK[i];
    if (labTxt !== s.curLab) { s.lab.userData.set(labTxt); s.curLab = labTxt; }
    const k = easeOut(clamp((T - RISE[i]) / (i === 4 ? 1.8 : i === 3 ? 1.5 : 0.9)));
    const m = Math.max(0.006, LEVEL[i]) * k; // サメはほぼゼロでも細い線だけ見せる
    s.fill.scale.y = Math.max(0.001, m) * MH;
    const c = m < 0.5 ? COLD.clone().lerp(MID, m / 0.5) : MID.clone().lerp(HOT, Math.min(1, (m - 0.5) / 0.5));
    s.fillM.color.copy(c); s.fillM.emissive.copy(c).multiplyScalar(0.35 + (i === 4 && k > 0.9 ? 0.5 * (0.5 + 0.5 * Math.sin(T * 14)) : 0));
    const w = k > 0.6 ? WORDS[i] : '';
    if (w !== s.curWord) { s.word.userData.set(w); s.curWord = w; }
    s.word.visible = !!w; s.word.position.set(0, 1.1 + Math.max(0.04, m) * MH + 0.3, -0.75);
    s.rim.material.emissiveIntensity = 0.5 + 0.2 * Math.sin(T * 2 + i) + (shown && r < 1 ? 1.2 * (1 - r) : 0);
  });
}
function sparkAt(T) { // 出てくる瞬間の光
  let best = -1; REVEAL.forEach((v, i) => { if (T >= v && T - v < 1.0) best = i; });
  if (best < 0) { lineSpark.set(0); return; }
  if (lineSpark.cur !== best) { lineSpark.init([[SX[best], 0.9, 0]], 0.5, 1.4); lineSpark.cur = best; }
  lineSpark.set((T - REVEAL[best]) / 1.0);
}
function scene(T, red = 0, labs = false) { slotState(T, labs); sparkAt(T); redLight.intensity = red; hemi.intensity = 1.1 - red * 0.25; return stage; }

// ---------- camera ----------
function hookCam(t, d) { const u = ease(t / d); look(lerp(-1.75, -1.65, u), lerp(1.7, 1.65, u), lerp(5.6, 5.2, u), -1.35, 1.0, -0.3, 50); }
function wideCam(t, d) { const u = ease(t / d); look(lerp(-0.2, 0.0, u), lerp(2.6, 2.5, u), lerp(9.6, 9.0, u), 0, 1.45, -0.3, 50); }
function slotCam(t, d, i, top = 1.55) { const x = SX[i], u = ease(t / d); look(lerp(x * 0.75 - 0.3, x * 0.6, u), lerp(2.2, 2.1, u), lerp(5.6, 5.0, u), x, top, -0.4, 50); }
function panCam(t, d, i, j) { const u = ease(t / d); const x = lerp(SX[i], SX[j], u); look(x * 0.65, 2.3, lerp(5.6, 6.2, Math.sin(u * Math.PI)), x, 1.55, -0.4, 50); }

const SUBS = [
  [2.7, 5.6, '5位はサメ。<br>2025年は世界で9人。'],
  [5.7, 9.0, '1位は、その<br>6万倍以上。'],
  [9.1, 12.6, '4位は、あなたの家にも<br>いるかもしれない動物。'],
  [12.7, 16.4, 'イヌ。狂犬病で、<br>年約4.4万人が死ぬ。'],
  [16.5, 20.2, '狂犬病の最大99%は、<br>イヌからうつる。'],
  [20.3, 23.8, '3位は、草むらに<br>ひそむあいつ。'],
  [23.9, 27.6, 'ヘビ。かまれて死ぬ人は<br>年8.1万〜13.8万人。'],
  [27.7, 31.2, 'ここまでは、<br>まだ動物の話。'],
  [31.3, 34.9, 'でも2位で、<br>空気が変わる。'],
  [35.0, 38.7, '2位は人間。殺人の<br>犠牲者は年45.8万人。'],
  [38.8, 42.4, '1時間に約52人が、<br>人の手で殺されている。'],
  [42.5, 45.6, 'でも1位は、<br>もっとずっと小さい。'],
  [45.7, 48.0, '1位は、蚊。'],
  [48.1, 53.8, '結果：1位は蚊。マラリア<br>だけで年61万人が死ぬ。'],
  [53.9, 56.1, 'サメの6万倍以上。'],
  [56.2, 59.4, '一番意外だったのは<br>何位？'],
];

// ---------- shots ----------
function shot0(t, T) { // v2 hook：0秒目サムネ（サメ＋？が4つ）。0.35秒でサメのメーターに 9人 がドン
  lift(260); scene(T); hookCam(t, 2.6);
  el.flash.style.opacity = t >= RISE[0] ? 0.22 * Math.max(0, 1 - (t - RISE[0]) / 0.3) : 0;
  setHud('サメに殺された人（2025年・世界）', t < RISE[0] ? '？人' : '9人', 1, { color: t < RISE[0] ? '#fff' : '#ff8a7a' });
  return stage;
}
function shotShark(t, T) {
  lift(260); scene(T);
  if (t < 3.1) slotCam(t, 3.1, 0, 1.3); else panCam(t - 3.1, 3.3, 0, 4);
  if (t < 3.1) setTop('サメに殺された人（2025年・世界・ISAF）', '9人', fade(t, 0.1, 3.1, 0.2), GREEN);
  else setTop('1位は（サメと比べて・単純計算）', '6万倍以上', fade(t, 3.1, 6.4, 0.2), RED);
  return stage;
}
function shotDog(t, T) { // 9.0〜20.2
  lift(260); scene(T); slotCam(t, 11.2, 1);
  if (t < 3.7) setTop('4位のヒント', '家にもいる動物', fade(t, 0.1, 3.7, 0.2), GOLD);
  else if (t < 7.5) setTop('狂犬病の死者（1年・WHO 2021年推計）', '約' + (countUp(t - 3.7, 44, 0.3, 1.0) / 10).toFixed(1) + '万人', fade(t, 3.7, 7.5, 0.2), GOLD);
  else setTop('狂犬病をうつした動物（WHO）', '最大99%がイヌ', fade(t, 7.5, 11.2, 0.2), GOLD);
  return stage;
}
function shotSnake(t, T) { // 20.2〜27.7
  lift(260); scene(T); slotCam(t, 7.5, 2);
  if (t < 3.7) setTop('3位のヒント', '草むらにひそむ', fade(t, 0.1, 3.7, 0.2), GOLD);
  else setTop('ヘビにかまれて死ぬ人（1年・WHO）', '8.1万〜13.8万人', fade(t, 3.7, 7.5, 0.2), GOLD);
  return stage;
}
function shotSoFar(t, T) { // 27.7〜31.2：ここまでを引きで
  lift(200); scene(T, 0, true); wideCam(t + 1, 4.5);
  setTop('5位〜3位', 'サメ・イヌ・ヘビ', fade(t, 0.1, 3.5, 0.2), GREEN);
  return stage;
}
function shotHuman(t, T) { // 31.2〜42.4
  const red = t < 3.8 ? 0.5 * ease(clamp(t / 1.2)) : 1.6 * ease(clamp((t - 3.8) / 0.6));
  lift(260); scene(T, red); slotCam(t, 11.2, 3, 1.75);
  if (t < 3.8) setTop('2位', '？？？', fade(t, 0.1, 3.8, 0.2), RED);
  else if (t < 7.6) setTop('殺人の犠牲者（2021年・UNODC）', '年' + (countUp(t - 3.8, 458, 0.3, 1.2) / 10).toFixed(1) + '万人', fade(t, 3.8, 7.6, 0.2), RED);
  else setTop('殺人の犠牲者（2021年・UNODC）', '1時間に約52人', fade(t, 7.6, 11.2, 0.2), RED);
  return stage;
}
function shotMosq(t, T) { // 42.4〜48.0
  lift(300); scene(T, 0.4); slotCam(t, 5.6, 4, 1.9);
  if (t < 3.3) setTop('1位', '？？？', fade(t, 0.1, 3.3, 0.2), RED);
  else setTop('1位', '蚊', fade(t, 3.3, 5.6, 0.2), RED);
  return stage;
}
function shotResult(t, T) { // 48.0〜55.9
  lift(200); scene(T, 0.4, true); wideCam(t, 7.9);
  if (t < 3.7) setTop('マラリアの死者（2024年・WHO）', '年約61万人', fade(t, 0.1, 3.7, 0.2), RED);
  else setTop('サメ（9人）と比べると（単純計算）', '6万倍以上', fade(t, 3.7, 7.9, 0.2), RED);
  return stage;
}
function shotLoop(t, T) { lift(200); scene(T, 0.4, true); wideCam(t * 0.5, 2.6); return stage; } // 冒頭と同じ構図（結果のまま）

const shots = [
  { a: 0, b: 2.6, f: shot0 }, { a: 2.6, b: 9.0, f: shotShark }, { a: 9.0, b: 20.2, f: shotDog },
  { a: 20.2, b: 27.7, f: shotSnake }, { a: 27.7, b: 31.2, f: shotSoFar }, { a: 31.2, b: 42.4, f: shotHuman },
  { a: 42.4, b: 48.0, f: shotMosq }, { a: 48.0, b: 55.9, f: shotResult }, { a: 55.9, b: 59.5, f: shotLoop },
  { a: 59.5, b: 63.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 63.5,
  meta: {
    id: '0736',
    v2: true,
    hookLine: 'サメに殺される人は、1年でたった9人。',
    series: 'ヤバい順',
    hookType: 'H3',
    cat: '生き物・動物',
    title: '人を一番殺している生き物は？',
    titleHtml: '人を一番殺している<br>生き物は？',
    mood: 'tension', seed: 736, hits: [0.35, 45.7, 48.1], risers: [42.4], impacts: [5.7, 35.3, 46.0],
    sfx: [[0.35, 'meter', 0.05], [12.7, 'poof'], [13.0, 'meter', 0.15], [23.9, 'poof'], [24.2, 'meter', 0.3], [31.3, 'drone'], [35.0, 'poof'], [35.3, 'meter', 0.75], [43.0, 'buzz'], [45.7, 'poof'], [46.0, 'meter', 1.0]],
    narr: { '9人': '9にん', '6万倍以上': '6まんばい以上', '4.4万人': '4.4まんにん', '99%': '99パーセント', '8.1万〜13.8万人': '8.1まんから13.8まんにん', '45.8万人': '45.8まんにん', '52人': '52にん', '61万人': '61まんにん', '何位': 'なんい' },
    ask: '一番意外だったのは何位？',
    caption: '世界で一番人を殺している生き物ランキング。1年に死なせている人の数を、少ない順に並べた。\n\n5位 サメ：2025年に世界でサメに殺された人は9人（挑発なしの事故）。\n4位 イヌ：狂犬病の死者は年約4.4万人。人の狂犬病の最大99%はイヌからうつる。\n3位 ヘビ：かまれて死ぬ人は年8.1万〜13.8万人。\n2位 人間：殺人の犠牲者は年45.8万人（2021年）。1時間に約52人。\n1位 蚊：マラリアだけで年約61万人が亡くなる（2024年）。サメの6万倍以上（単純計算）。\n※蚊はデング熱などもうつすが、ここではマラリアの死者だけで数えています。\n\n一番意外だったのは何位？ コメントで教えて。\n\n出典：Florida Museum International Shark Attack File（2025年）、WHO ファクトシート Rabies（2021年推計）、WHO ファクトシート Snakebite envenoming、UNODC Global Study on Homicide 2023（2021年）、WHO World Malaria Report 2025（2024年）',
    hashtags: ['もしもラボ', 'もしも', '雑学', '生き物', '蚊'],
    endStats: [['5位 サメ', '9人', '2025年・挑発なし'], ['4位 イヌ（狂犬病）', '約4.4万人', '2021年推計'], ['3位 ヘビ', '8.1万〜13.8万人', '1年'], ['2位 人間（殺人）', '45.8万人', '2021年'], ['1位 蚊（マラリア）', '約61万人', '2024年']],
    sources: '出典：ISAF（2025年）、WHO（狂犬病・ヘビ咬傷）、<br>UNODC（2021年）、WHO 世界マラリア報告書 2025',
  },
});
