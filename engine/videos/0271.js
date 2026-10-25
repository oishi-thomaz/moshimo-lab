import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, randPerson, SKIN, HAIR, makeQ } from '../lib.js';
import { room, setRoom, setLight, setClock, setScreen, props, lamp } from '../scenes/room.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも寝る前1時間スマホをやめたら？（blueprint no 271・人体の限界シリーズ）
// 数字：
//  寝る前4時間（18〜22時）に光る画面（iPad）で5夜続けて読書 vs 紙の本、大人12人。画面のほうが眠るまで約10分長くかかり、
//  夢を見る眠り（レム睡眠）が少なく、翌朝の目覚めが悪かった（ペンシルベニア州立大学 2014年12月 https://www.psu.edu/news/research/story/light-emitting-e-readers-detrimentally-shift-circadian-clock）
//  体内時計（メラトニンのリズム）が1時間以上遅れた（Brigham and Women's Hospital の発表／Neuroscience News https://neurosciencenews.com/ebook-light-circadian-rhythm-1652/）
//  論文：Chang, Aeschbach, Duffy, Czeisler, PNAS 112(4):1232-37, 2015（DOI 10.1073/pnas.1418490112）
//  大人は6時間以上の睡眠を確保。寝る前や深夜のスマホ使用は避ける（厚生労働省「健康づくりのための睡眠ガイド2023」 https://www.mhlw.go.jp/content/10904750/001222161.pdf）
//  睡眠6時間未満の人は7〜9時間の人より死亡リスク13%高い。日本は睡眠不足で年最大1,380億ドル（GDPの2.92%）・約60万日分の労働日を失う
//    （RAND Corporation「Why Sleep Matters」2016年11月30日 https://www.rand.org/news/press/2016/11/30.html）
//  寝る前1時間×30日＝30時間（単純計算）

const hero = makePerson({ skin: SKIN[1], hair: HAIR[3], shirt: '#c77b8f', pants: '#4a4f5c', long: true, scale: 1 }); room.add(hero);
const H = hero.userData, head = H.head;
const eyes = head.children.filter(c => c.geometry && c.geometry.parameters && c.geometry.parameters.width === 0.055);
function sleepy(k) { eyes.forEach(e => e.scale.y = 1 - 0.7 * k); }
function reset() { hero.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0); H.legs.forEach(l => l.rotation.set(0, 0, 0)); H.arms.forEach(a => a.rotation.set(0, 0, 0)); }
// phone in hand
const phoneScrM = new THREE.MeshBasicMaterial({ color: '#cfe6ff' });
const hphone = new THREE.Group(); { const b = box(0.13, 0.25, 0.02, mat('#1b1d22')); hphone.add(b); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.22), phoneScrM); s.position.z = -0.012; s.rotation.y = Math.PI; hphone.add(s); } room.add(hphone);
const pLight = new THREE.PointLight(0xbcd8ff, 0, 2.2, 1.5); room.add(pLight);
function sitPhone(t, on) { // sitting up in bed, holding the phone in front of the face
  reset(); hero.position.set(1.6, -0.2, -2.6); H.legs.forEach(l => l.rotation.x = -Math.PI / 2);
  H.arms.forEach((a, i) => { a.rotation.x = -1.25; a.rotation.z = (i ? 1 : -1) * 0.18; });
  head.rotation.x = 0.28 + Math.sin(t * 0.6) * 0.02;
  hphone.visible = true; hphone.position.set(1.6, 1.12, -2.0); hphone.rotation.set(0.9, 0, 0);
  phoneScrM.color.set(on ? '#cfe6ff' : '#0b0c10'); pLight.intensity = on ? 2.6 : 0; pLight.position.set(1.6, 1.4, -1.95);
}
function sitRead(t) { // reading a paper book instead
  reset(); hero.position.set(1.6, -0.2, -2.6); H.legs.forEach(l => l.rotation.x = -Math.PI / 2);
  H.arms.forEach((a, i) => { a.rotation.x = -1.15; a.rotation.z = (i ? 1 : -1) * 0.22; });
  head.rotation.x = 0.35; hphone.visible = false; pLight.intensity = 0;
  book.visible = true; book.position.set(1.6, 1.1, -2.0); book.rotation.set(-0.7, 0, 0);
}
const book = new THREE.Group(); { const c = box(0.42, 0.3, 0.04, mat('#3f7a5a')); book.add(c); const pg = box(0.38, 0.27, 0.02, mat('#fbf6e8')); pg.position.z = 0.025; book.add(pg); } room.add(book);
// calendar
const calC = document.createElement('canvas'); calC.width = 256; calC.height = 300;
const calTex = new THREE.CanvasTexture(calC); calTex.colorSpace = THREE.SRGBColorSpace; let calCur = '';
function setCal(s) { if (s === calCur) return; calCur = s; const g = calC.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 300); g.fillStyle = '#2f7fd1'; g.fillRect(0, 0, 256, 70); g.fillStyle = '#fff'; g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('スマホ断ち', 128, 38); g.fillStyle = '#2f7fd1'; g.font = `900 ${s.length > 2 ? 96 : 150}px "Noto Sans CJK JP", sans-serif`; g.fillText(s, 128, 175); g.fillStyle = '#333'; g.font = '900 42px "Noto Sans CJK JP", sans-serif'; g.fillText('日目', 128, 268); calTex.needsUpdate = true; }
const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72), new THREE.MeshBasicMaterial({ map: calTex })); cal.position.set(0.6, 1.5, -3.44); room.add(cal); setCal('1');
const zzz = makeSparkles(60, 0.08, 0xbfd8ff); room.add(zzz.points);
// office coworkers (for the money beat)
const cow = []; { const r = rng(27); for (const [x, z] of [[-2.6, -2.25], [2.6, -2.25], [-2.6, -0.35], [2.6, -0.35]]) { const p = randPerson(r); p.position.set(x, -0.38, z); p.rotation.y = Math.PI; p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2); p.userData.arms.forEach(a => a.rotation.x = -1.1); room.add(p); cow.push(p); } }
const yq = makeQ(); yq.visible = false; room.add(yq);

const SUBS = [
  [2.6, 6.0, 'いつもは、寝る直前まで<br>スマホを見ていた。'],
  [6.2, 10.1, '今夜から、寝る前1時間は<br>スマホを置く。'],
  [10.1, 14, '国の睡眠ガイドも、寝る前の<br>スマホは避けてと言う。'],
  [14.2, 18.1, '光る画面で読んだ夜は、<br>眠るまで約10分遅かった。'],
  [18.1, 22, '紙の本にすれば、<br>そのぶん早く眠れる。'],
  [22.2, 26.1, '画面の夜が5日続くと、<br>体内時計は1時間以上ずれた。'],
  [26.1, 30, '夢を見る眠りも減り、<br>朝はぼんやりしていた。'],
  [30.2, 34.6, 'スマホを置いた夜は、<br>このずれが起きない。'],
  [34.6, 39, '1か月で取り戻す夜は、<br>30時間ぶん。'],
  [39.2, 43.6, '6時間未満しか寝ない人は、<br>死亡リスクが13%高い。'],
  [43.6, 47.8, '日本は睡眠不足で、<br>年最大1,380億ドルを失う。'],
  [48.1, 53.8, '結果：スマホを置いた1時間で、<br>朝の頭がシャキッと戻った。'],
  [53.9, 56.1, '夜の1時間は、朝の頭。'],
  [56.2, 59.4, '次に試してほしい<br>生活習慣は？'],
];

function bed(light, opt, clock) { setRoom({ sets: ['bed', 'desk'] }); setLight(light, opt); setClock(clock); props.sleeper.visible = false; props.phone.visible = false; hero.visible = true; book.visible = false; hphone.visible = false; pLight.intensity = 0; zzz.set(0); cow.forEach(c => c.visible = false); yq.visible = false; }
const nightOpt = { ceil: 0, hemi: 0.75, lamp: 1.4 };
function bedCam(t, d, z0 = 2.9, z1 = 2.5) { const u = ease(t / d); look(lerp(0.7, 0.8, u), 2.0, lerp(z0, z1, u), 0.85, 1.5, -2.8, 50); }
function shot0(t) { // hook: phone glowing in bed, 1.2s the screen goes black
  lift(300); bed('dark', { ceil: 0, hemi: 0.55, lamp: 0 }, '0:30'); setCal('1');
  sitPhone(t, t < 1.2); sleepy(0);
  bedCam(t, 2.5);
  el.flash.style.opacity = t >= 1.2 ? 0.3 * Math.max(0, 1 - (t - 1.2) / 0.3) : 0;
  el.title.style.opacity = 1;
  return room;
}
function shot1(t) { // every night: scrolling until late
  lift(300); bed('dark', { ceil: 0, hemi: 0.55, lamp: 0 }, '1:15'); setCal('0');
  sitPhone(t + 3, true); sleepy(0.2 + 0.2 * Math.sin(t));
  const u = ease(t / 3.5); look(lerp(-0.5, -0.3, u), 2.1, lerp(0.5, 0.2, u), 1.45, 1.25, -2.5, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  setHud('いつもの夜', '1:15', 1, { mono: true });
  return room;
}
function shot2(t) { // day 1: phone placed on nightstand, lamp on
  lift(300); bed('night', nightOpt, '22:30'); lamp.position.set(0.3, 1.2, -2.6); setCal('1');
  sitRead(t); props.phone.visible = true; setScreen((g, w, h) => { g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h); });
  bedCam(t, 8);
  setHud('スマホを置いて', '1日目', 1);
  if (t > 4.1) setTop('大人に必要な睡眠（国の睡眠ガイド・2023年）', countUp(t - 4.1, 6) + '時間以上', fade(t, 4.1, 8, 0.25), '#7ff0c8');
  return room;
}
function shot3(t) { // falling asleep: sleeper appears
  lift(260); bed('night', { ceil: 0, hemi: 0.7, lamp: 0.6 }, '23:10'); lamp.position.set(0.3, 1.2, -2.6); setCal('1');
  props.phone.visible = true;
  const asleep = t > 3.6; hero.visible = !asleep; props.sleeper.visible = asleep; if (!asleep) sitRead(t); else { book.visible = true; book.position.set(0.15, 0.62, -2.9); book.rotation.set(-Math.PI / 2, 0, 0.3); }
  if (asleep) { if (!zzz.ok) { zzz.init([[1.6, 1.3, -2.8]], 0.2, 1.4); zzz.ok = true; } zzz.set(((t - 3.6) % 2.4) / 2.4); }
  const u = ease(t / 8); look(lerp(3.2, 3.4, u), lerp(2.1, 2.3, u), lerp(1.6, 2.0, u), 1.3, 0.95, -2.4, 50);
  setHud('スマホを置いて', '1日目', 1);
  setTop('眠りにつくまで（画面で読んだ夜・2014年）', '約' + countUp(t, 10) + '分遅い', fade(t, 0.15, 8, 0.25), '#ffd27a');
  return room;
}
function shot4(t) { // 5 days: comparison — screen night (blue light) drifts the body clock
  lift(300); bed('dark', { ceil: 0, hemi: 0.55, lamp: 0 }, '1:40'); setCal('5');
  sitPhone(t, true); sleepy(0.45);
  const u = ease(t / 8); look(lerp(-0.5, -0.3, u), 2.1, lerp(0.5, 0.2, u), 1.45, 1.25, -2.5, 50);
  setHud('画面の夜が', '5日', 1, { color: '#9fc8ff' });
  setTop('体内時計のずれ（画面で5夜・2014年）', countUp(t, 1) + '時間以上', fade(t, 0.15, 8, 0.25), '#9fc8ff');
  return room;
}
function shot5(t) { // a month: morning, wakes up fresh, calendar 30
  lift(260); bed('day', { ceil: 0, hemi: 1.1 }, '7:00'); setCal('30'); props.phone.visible = true;
  reset(); hero.position.set(0.3, 0, -1.2); hero.rotation.y = 0.2; H.arms[0].rotation.set(-0.3, 0, 0.2); H.arms[1].rotation.set(-2.8, 0, -0.2); head.rotation.x = -0.15; sleepy(0);
  const u = ease(t / 8.8); look(lerp(2.6, 2.3, u), 1.9, lerp(3.4, 3.0, u), 0.4, 1.45, -1.6, 50);
  setHud('スマホを置いて', '30日目', 1);
  if (t < 4.4) setTop('ずれた体内時計（画面で5夜・2014年）', 'ずれない', fade(t, 0.15, 4.4, 0.25), '#7ff0c8');
  else setTop('寝る前1時間×30日（単純計算）', countUp(t - 4.4, 30) + '時間', fade(t, 4.4, 8.8, 0.25), '#7ff0c8');
  return room;
}
function shot6(t) { // office: tired workers (cost of sleep loss)
  lift(120);
  setRoom({ sets: ['office'] }); setLight('day', { ceil: 4, hemi: 1.0 }); props.sleeper.visible = false; hphone.visible = false; book.visible = false; pLight.intensity = 0; zzz.set(0);
  hero.visible = false; cow.forEach((c, i) => { c.visible = true; c.userData.head.rotation.x = 0.25 + Math.max(0, Math.sin(t * 0.9 + i * 1.7)) * 0.5; });
  yq.visible = t > 5; yq.position.set(-2.6, 2.05 + Math.sin(t * 3) * 0.04, -2.25);
  const u = ease(t / 8.8); look(lerp(-0.4, -0.7, u), 2.0, lerp(1.4, 1.0, u), -2.6, 1.0, -1.3, 52);
  setHud('寝不足のまま', '1年', 1, { color: '#ffb08a' });
  if (t < 4.4) setTop('6時間未満で寝る人の死亡リスク（2016年）', '13%高い', fade(t, 0.15, 4.4, 0.25), '#ff8a7a');
  else setTop('睡眠不足による日本の損失（2016年）', '年最大' + (countUp(t - 4.4, 1380)).toLocaleString('en-US') + '億ドル', fade(t, 4.4, 8.8, 0.25), '#ff8a7a');
  return room;
}
function shot7(t) { // result: bright morning, stretching, phone still dark on nightstand
  lift(260); bed('day', { ceil: 0, hemi: 1.15 }, '6:45'); setCal('30'); props.phone.visible = true;
  reset(); hero.position.set(0.6, 0, -1.3); hero.rotation.y = 0.3; H.arms[0].rotation.set(-2.9, 0, 0.25); H.arms[1].rotation.set(-2.9, 0, -0.25); head.rotation.x = -0.2; sleepy(0);
  const u = ease(t / 7.5); look(lerp(2.4, 2.8, u), lerp(1.9, 2.1, u), lerp(2.6, 3.4, u), 0.6, 1.4, -1.6, 50);
  setHud('スマホを置いて', '30日目', 1);
  if (t < 3.8) setTop('早く眠れた（紙の本の夜・2014年）', '約10分', fade(t, 0.15, 3.8, 0.25), '#7ff0c8');
  else setTop('取り戻した夜（1か月・単純計算）', '30時間', fade(t, 3.8, 7.5, 0.25), '#7ff0c8');
  return room;
}
function shot8(t) { // loop: dark bed, phone off like the hook
  lift(300); bed('dark', { ceil: 0, hemi: 0.55, lamp: 0 }, '0:30'); setCal('30');
  sitPhone(t + 2, false); sleepy(0);
  bedCam(t, 4, 2.5, 2.7);
  return room;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0271',
    series: '人体の限界',
    hookType: 'H4',
    cat: '体・健康',
    title: '寝る前1時間スマホをやめたら？',
    titleHtml: '寝る前1時間<br>スマホをやめたら？',
    mood: 'calm', seed: 271, hits: [1.2, 14.2, 22.2, 48.1], risers: [39.2],
    impacts: [14.6, 45.0],
    sfx: [[1.2, 'whoosh']],
    narr: { '1,380億ドル': '1380億ドル', '13%': '13パーセント', '30日目': '30日目' },
    ask: '次に試してほしい生活習慣は？',
    caption: 'もしも寝る前の1時間、スマホをやめたら？\n寝る前に光る画面で読書した夜は、紙の本の夜より眠るまで約10分長くかかり、5夜続けると体内時計（メラトニンのリズム）が1時間以上ずれた。夢を見る眠りも減り、翌朝の目覚めも悪かった（2014年・大人12人の実験）。\n国の睡眠ガイド2023でも、大人は6時間以上の睡眠、寝る前や深夜のスマホは避けることがすすめられている。\n6時間未満しか寝ない人は、7〜9時間の人より死亡リスクが13%高く、日本は睡眠不足で年最大1,380億ドル（GDPの2.92%）を失っている（2016年）。\n寝る前1時間×30日で、1か月に30時間（単純計算）。\n\n次に試してほしい生活習慣は？ コメントで教えて。\n\n出典：Chang ほか PNAS（2015年）／ペンシルベニア州立大学・ブリガム＆ウィメンズ病院の発表（2014年）、厚生労働省 健康づくりのための睡眠ガイド2023、RAND Corporation「Why Sleep Matters」（2016年）',
    hashtags: ['もしもラボ', '寝る前スマホ', '睡眠', '寝つき', '雑学'],
    endStats: [['眠るまで（画面の夜）', '約10分遅い', '2014年'], ['体内時計のずれ（5夜）', '1時間以上', '2014年'], ['大人に必要な睡眠', '6時間以上', '2023年'], ['6時間未満の死亡リスク', '13%高い', '2016年'], ['日本の損失', '年最大1,380億ドル', '2016年']],
    sources: '出典：Chang ほか PNAS（2015年）、厚生労働省 睡眠ガイド2023、<br>RAND Corporation（2016年）',
  },
});
