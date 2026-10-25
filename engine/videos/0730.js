import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, makePerson, SKIN, HAIR, makeQ } from '../lib.js';
import { room, setRoom, setLight, setClock, setScreen, props, lamp } from '../scenes/room.js';
import { lab, setLabLight, setMice, researcher } from '../scenes/mouselab.js';
import { lift, look, runStory, endCard, countUp, makeSparkles, setTop, setHud, el } from '../story.js';

// もしも11日間眠らなかったら？（blueprint no 730・人体の限界シリーズ）
// 方針：実在の記録の本人の名前は出さない。あなた視点。真似しないでの字幕を入れる。11日目の計算テストの話（二次資料のみ）は使わない。
// 数字：
//  起きて17〜19時間で、成績が血中アルコール0.05%（50mg/dl）と同じかそれ以下・反応は最大50%遅い
//    （Williamson & Feyer 2000, Occupational and Environmental Medicine 57:649-55／ScienceDaily 2000年9月19日 https://www.sciencedaily.com/releases/2000/09/000919080457.htm）
//  24〜48時間で知覚のゆがみ・不安・イライラ・時間の感覚の乱れ、3日目に目・耳・体の3つの感覚すべてで幻覚、21研究のレビュー
//    （Waters et al. 2018, Frontiers in Psychiatry 9:303 https://frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2018.00303/full）
//  1964年の記録 264時間（11日）。4日目に幻覚・妄想・きわめて短い注意力。分析力・知覚・やる気・記憶・体の動きが落ちた。
//  ギネスは断眠の危険から1997年に記録の受付をやめた（Guinness World Records 2023年1月17日 https://www.guinnessworldrecords.com/news/2023/1/whats-the-limit-to-how-long-a-human-can-stay-awake-733188）
//  ネズミを眠らせ続けると、11〜32日で全匹が死亡または瀕死。エサを多く食べてもやせ、消費エネルギーは平均で元の2倍超
//    （Everson, Bergmann, Rechtschaffen 1989, Sleep 12:13-21「Sleep deprivation in the rat: III. Total sleep deprivation」 https://pesquisa.bvsalud.org/ses/resource/pt/mdl-2928622）

const hero = makePerson({ skin: SKIN[2], hair: HAIR[1], shirt: '#5f8fbf', pants: '#3b3f4a', scale: 1 }); room.add(hero);
const H = hero.userData;
const head = H.head;
const eyes = head.children.filter(c => c.geometry && c.geometry.parameters && c.geometry.parameters.width === 0.055);
const eyeM = new THREE.MeshLambertMaterial({ color: '#121212' }); eyes.forEach(e => e.material = eyeM);
const bags = [];
for (const s of [-1, 1]) { const b = box(0.08, 0.025, 0.02, mat('#6a4a7a', { transparent: true, opacity: 0 })); b.position.set(s * 0.085, 0.215, 0.2); head.add(b); bags.push(b); }
function tired(k) { eyeM.color.setRGB(0.07 + 0.5 * k, 0.07, 0.07); bags.forEach(b => b.material.opacity = clamp(k * 1.2)); eyes.forEach(e => e.scale.y = 1 - 0.5 * k); }
function reset() { hero.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0); H.legs.forEach(l => l.rotation.set(0, 0, 0)); H.arms.forEach(a => a.rotation.set(0, 0, 0)); }
function sitDesk(t) { reset(); hero.position.set(-2.6, -0.34, -2.15); hero.rotation.y = Math.PI; H.legs.forEach(l => l.rotation.x = -Math.PI / 2); H.arms.forEach(a => a.rotation.x = -1.1); head.rotation.x = 0.05 + Math.sin(t * 0.7) * 0.03; }
function sitBed(t, sway = 0) { reset(); hero.position.set(1.6, -0.2, -2.6); H.legs.forEach(l => l.rotation.x = -Math.PI / 2); H.arms.forEach((a, i) => { a.rotation.x = -0.25; a.rotation.z = (i ? -1 : 1) * 0.12; }); head.rotation.set(Math.sin(t * 0.9) * 0.08 * sway, Math.sin(t * 0.6) * 0.5 * sway, Math.sin(t * 0.5) * 0.12 * sway); }
function standWake() { reset(); hero.position.set(0.3, 0, -1.2); hero.rotation.y = 0.2; H.arms[0].rotation.set(-0.3, 0, 0.2); H.arms[1].rotation.set(-2.8, 0, -0.2); head.rotation.x = -0.15; }
function standSlump(t) { reset(); hero.position.set(0.2, 0, -1.4); hero.rotation.y = 0.15; H.arms.forEach((a, i) => { a.rotation.x = 0.1; a.rotation.z = (i ? -1 : 1) * 0.05; }); head.rotation.set(0.35 + Math.sin(t * 0.8) * 0.1, Math.sin(t * 0.4) * 0.2, Math.sin(t * 0.6) * 0.15); hero.rotation.z = Math.sin(t * 0.7) * 0.04; }

// hallucination shapes
const ghosts = [];
{
  const r = rng(30); const cols = ['#ff7ad9', '#7af0ff', '#ffe36e', '#9b7dff', '#7dff9b'];
  for (let i = 0; i < 20; i++) {
    const g = new THREE.Mesh(r() < .5 ? new THREE.IcosahedronGeometry(0.16 + r() * 0.22, 0) : new THREE.TorusGeometry(0.18 + r() * 0.2, 0.05, 6, 12), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], transparent: true, opacity: 0, depthWrite: false }));
    room.add(g); ghosts.push({ g, o: [2.2 + r() * 1.7, 0.6 + r() * 2.1, -3.3 + r() * 1.4], ph: r() * 6, s: 0.3 + r() * 0.6 });
  }
}
function hallu(t, k, ox = 0) { for (const h of ghosts) { h.g.visible = k > 0; h.g.material.opacity = 0.75 * k; h.g.position.set(h.o[0] + ox + Math.sin(t * h.s + h.ph) * 0.5, h.o[1] + Math.sin(t * h.s * 1.3 + h.ph) * 0.3, h.o[2] + Math.cos(t * h.s + h.ph) * 0.4); h.g.rotation.set(t * h.s, t * h.s * 0.7, 0); } }
// calendar on the wall: day counter
const calC = document.createElement('canvas'); calC.width = 256; calC.height = 300;
const calTex = new THREE.CanvasTexture(calC); calTex.colorSpace = THREE.SRGBColorSpace;
let calCur = -1;
function setCal(d) { if (d === calCur) return; calCur = d; const g = calC.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 300); g.fillStyle = '#c0262d'; g.fillRect(0, 0, 256, 70); g.fillStyle = '#fff'; g.font = '900 46px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('眠らず', 128, 38); g.fillStyle = '#c0262d'; g.font = '900 150px "Noto Sans CJK JP", sans-serif'; g.fillText(String(d), 128, 175); g.fillStyle = '#333'; g.font = '900 42px "Noto Sans CJK JP", sans-serif'; g.fillText('日目', 128, 268); calTex.needsUpdate = true; }
const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72), new THREE.MeshBasicMaterial({ map: calTex })); cal.position.set(0.6, 1.5, -3.44); room.add(cal);
setCal(1);
const q = makeQ(); q.visible = false; room.add(q);

function screenCode(g, w, h) { g.fillStyle = '#10151f'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 12; i++) { g.fillStyle = ['#7ff0c8', '#f2c14e', '#7aa8ff'][i % 3]; g.fillRect(14 + (i % 2) * 20, 12 + i * 12, 60 + r() * 150, 6); } }
const fmtDay = (d) => { const D = Math.floor(d), h = Math.floor((d - D) * 24); return `${D}日 ${String(h).padStart(2, '0')}時間`; };

// lab
const lq = makeQ(); lq.visible = false; lab.add(lq);
const labSpark = makeSparkles(160, 0.05, 0xbfd8ff); lab.add(labSpark.points);
labSpark.init([-2.55, -1.5, -0.45, -2.05, -1.0, 0.05].map(x => [x, 1.05, -1.2]), 0.5, 0.3);

const SUBS = [
  [2.6, 6.0, 'あなたは今日から、<br>11日間眠らない。'],
  [6.2, 10.1, '※絶対に真似しないで。<br>本当に危険です。'],
  [10.1, 14, '起きて17〜19時間で、<br>頭はお酒を飲んだ状態。'],
  [14.2, 18.1, '2日目。イライラと不安、<br>物がゆがんで見える。'],
  [18.1, 22, '時間の感覚も、<br>ずれていく。'],
  [22.2, 26.1, '3日目。ないものが<br>見えて、聞こえる。'],
  [26.1, 30, '目・耳・体、3つの<br>感覚すべてで幻覚。'],
  [30.2, 34.6, '4日目。本当ではないことを<br>信じ込み始める。'],
  [34.6, 39, '注意は、ほんの一瞬しか<br>続かない。'],
  [39.2, 43.6, 'この先は、人では<br>確かめられない。'],
  [43.6, 47.8, 'ネズミは食べてもやせて、<br>11〜32日で力尽きた。'],
  [48.1, 53.8, '結果：11日目、記憶も<br>体の動きも落ちていた。'],
  [53.9, 56.1, 'ギネスは危険と受付停止。'],
  [56.2, 59.4, '次に試してほしい<br>体の限界は？'],
];

function base(light, opt) { setRoom({ sets: ['bed', 'desk'] }); setLight(light, opt); props.sleeper.visible = false; props.phone.visible = true; hallu(0, 0); hero.visible = true; q.visible = false; }
function shot0(t) { // hook: night, the awake counter races through the days
  lift(300); base('night', { ceil: 0, hemi: 0.8, lamp: 2.2 }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:00'); sitBed(t, 0.5);
  const d = Math.min(11, t * 4.6); tired(clamp(d / 11)); setCal(Math.max(1, Math.ceil(d)));
  const u = ease(t / 2.6);
  look(lerp(0.7, 0.8, u), 2.0, lerp(2.9, 2.5, u), 0.85, 1.5, -2.8, 50);
  el.title.style.opacity = 1;
  setHud('起きてから', d >= 11 ? '11日' : fmtDay(d), 1, { mono: true, color: d > 9 ? '#ff8a7a' : '#fff' });
  return room;
}
function shot1(t) { // morning, wake up
  base('day', { ceil: 0, hemi: 1.1 }); setClock('7:00', '#ff5b4f'); standWake(); tired(0); setCal(1);
  const u = ease(t / 3.5);
  look(lerp(2.6, 2.3, u), 1.9, lerp(3.4, 3.0, u), 0.3, 1.45, -1.4, 50);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  setHud('起きてから', '0日', 1);
  return room;
}
function shot2(t) { // +1日 desk at midnight
  base('night', { ceil: 0, hemi: 0.75, glow: 3, glowPos: [-2.6, 1.3, -2.6] }); setClock('0:00'); setCal(1);
  setScreen((g, w, h) => screenCode(g, w, h)); sitDesk(t); tired(0.3);
  head.rotation.x = 0.1 + Math.max(0, Math.sin(t * 0.8)) * 0.25;
  const u = ease(t / 8);
  look(lerp(-0.6, -1.0, u), lerp(1.95, 1.85, u), lerp(-0.1, -0.7, u), -2.75, 1.45, -2.45, 50);
  setHud('起きてから', '1日目', 1);
  if (t > 4.1) setTop('起きて17〜19時間の頭（お酒にすると・2000年）', (countUp(t - 4.1, 5) / 100).toFixed(2) + '%相当', fade(t, 4.1, 8, 0.25));
  return room;
}
function shot3(t) { // +2日 evening, restless on the bed
  lift(300); base('evening', { ceil: 4, hemi: 0.9 }); setClock('19:00'); setCal(2); sitBed(t, 1); tired(0.5);
  const u = ease(t / 8);
  look(lerp(0.5, 0.3, u), 2.0, lerp(1.6, 1.1, u), 1.0, 1.6, -2.7, 50);
  setHud('起きてから', '2日目', 1);
  setTop('知覚のゆがみ・イライラが出るまで（2018年）', countUp(t, 24) + '〜' + countUp(t, 48) + '時間', fade(t, 0.15, 8, 0.25));
  return room;
}
function shot4(t) { // +3日 hallucinations
  lift(300); base('night', { ceil: 0, hemi: 0.8, lamp: 2.4 }); lamp.position.set(0.3, 1.2, -2.6); setClock('3:00'); setCal(3); sitBed(t, 1.5); tired(0.7);
  hallu(t, clamp((t - 0.8) / 2.5) * 0.85);
  const u = ease(t / 8);
  look(lerp(0.5, 0.8, u), 1.95, lerp(1.4, 0.8, u), 1.5, 1.7, -2.6, 52);
  setHud('起きてから', '3日目', 1);
  setTop('3日目の幻覚（21研究のまとめ・2018年）', '目・耳・体の' + countUp(t, 3) + '種類', fade(t, 0.15, 8, 0.25), '#ffb3e6');
  return room;
}
function shot5(t) { // +4日 delusions: standing slumped, ? above head
  base('dark', { ceil: 0, hemi: 0.75, lamp: 2.2 }); lamp.position.set(0.6, 1.5, -1.8); setClock('4:44', '#ff5b4f'); setCal(4); standSlump(t); tired(0.85);
  hallu(t * 1.4, 0.9, -1.6);
  q.visible = t > 1.2; q.position.set(hero.position.x, 2.35 + Math.sin(t * 3) * 0.05, hero.position.z);
  const u = ease(t / 9.2);
  look(lerp(1.6, 1.2, u), lerp(1.8, 1.7, u), lerp(2.6, 1.9, u), 0.1, 1.45, -1.5, 50);
  setHud('起きてから', '4日目', 1, { color: '#ffb08a' });
  setTop('幻覚と妄想が出た日（1964年の記録）', countUp(t, 4) + '日目', fade(t, 0.15, 9.2, 0.25), '#ff8a7a');
  return room;
}
function shot6(t) { // rats in the lab (1989 experiment); cages empty out
  lift(160);
  setLabLight('night'); researcher.position.set(0.75, 0, -0.15); researcher.rotation.y = Math.PI + 0.35;
  const k = t < 4.6 ? 1 : 1 - clamp((t - 4.6) / 2.6);
  setMice(k, t);
  labSpark.set(t > 4.6 ? (t - 4.6) / 3.4 : 0);
  researcher.userData.head.rotation.y = t > 5 ? Math.sin(t * 1.5) * 0.4 : 0;
  lq.visible = t > 6.5; lq.position.set(researcher.position.x, 2.35 + Math.sin(t * 3) * 0.04, researcher.position.z);
  const u = ease(t / 8.8);
  look(lerp(-1.6, -1.1, u), lerp(2.0, 1.85, u), lerp(2.4, 2.0, u), -1.2, 0.95, -1.2, 50);
  setHud('ネズミの実験', '1989年', 1);
  if (t < 4.4) setTop('眠らせないネズミの消費エネルギー（1989年）', '元の2倍超', fade(t, 0.15, 4.4, 0.25), '#ffd27a');
  else setTop('全匹が死ぬか瀕死になるまで（1989年）', countUp(t - 4.4, 11, 0.1, 0.8) + '〜' + countUp(t - 4.4, 32, 0.1, 1.2) + '日', fade(t, 4.4, 8.8, 0.25), '#ff8a7a');
  return lab;
}
function shot7(t) { // result: day 11, slumped at the desk at dawn, calendar 11
  base('evening', { ceil: 2, hemi: 0.8 }); setClock('5:00', '#ff5b4f'); setCal(11);
  setScreen((g, w, h) => { g.fillStyle = '#10151f'; g.fillRect(0, 0, w, h); });
  sitDesk(t); tired(1); head.rotation.x = 0.55 + Math.sin(t * 0.5) * 0.08; head.rotation.z = 0.2;
  hallu(t, 0.35, -2.4);
  const u = ease(t / 7.5);
  lift(200);
  look(lerp(-0.7, -0.5, u), lerp(1.9, 2.0, u), lerp(-0.9, -0.6, u), -2.6, 1.25, -2.3, 50);
  setHud('起きてから', '11日目', 1, { color: '#ff8a7a' });
  setTop('記録が残る最長（1964年）', countUp(t, 264) + '時間', fade(t, 0.15, 7.5, 0.25), '#ff8a7a');
  return room;
}
function shot8(t) { // loop: night bed like the hook
  lift(300); base('night', { ceil: 0, hemi: 0.8, lamp: 2.2 }); lamp.position.set(0.3, 1.2, -2.6); setClock('2:00'); sitBed(t + 2, 0.5); tired(1); setCal(11);
  const u = ease(t / 4);
  look(lerp(0.8, 0.75, u), 2.0, lerp(2.5, 2.7, u), 0.85, 1.5, -2.8, 50);
  setHud('起きてから', '11日', 1, { mono: true, color: '#ff8a7a' });
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
    id: '0730',
    series: '人体の限界',
    hookType: 'H1',
    cat: '体・健康',
    title: '11日間眠らなかったら？',
    titleHtml: '11日間<br>眠らなかったら？',
    mood: 'tension', seed: 730, hits: [6.2, 22.2, 30.2, 48.1], risers: [39.2],
    impacts: [10.5, 48.4],
    sfx: [[22.6, 'meter', 0.6], [30.6, 'meter', 0.8], [44.8, 'poof']],
    narr: { '17〜19時間': '17から19時間', '11〜32日': '11日から32日', '3つ': 'みっつ', '※絶対に真似しないで。': '絶対に真似しないで。' },
    ask: '次に試してほしい体の限界は？',
    caption: 'もしも11日間、一睡もしなかったら体と頭はどうなる？\n起きて17〜19時間で、頭の働きはお酒（血中アルコール0.05%）を飲んだ人と同じレベルに（2000年の研究）。\n3日目には目・耳・体の3つの感覚すべてで幻覚が報告されている（21研究のまとめ・2018年）。\n1964年に記録された最長264時間（11日）の断眠では、4日目に幻覚と妄想が出て、最後は記憶・体の動き・やる気まで落ちていた。\nネズミを眠らせ続けた実験では、たくさん食べてもやせ、11〜32日で全匹が死ぬか瀕死になった（1989年）。\nギネスは危険だとして、1997年に眠らない記録の受付をやめている。\n※絶対に真似しないでください\n\n次に試してほしい体の限界は？ コメントで教えて。\n\n出典：Williamson & Feyer（2000）Occupational and Environmental Medicine、Waters ほか（2018）Frontiers in Psychiatry、ギネス世界記録 公式記事（2023年）、Everson ほか（1989）Sleep',
    hashtags: ['もしもラボ', '徹夜', '睡眠不足', '人体', '雑学'],
    endStats: [['起きて17〜19時間', 'お酒0.05%相当', '2000年'], ['3日目の幻覚', '目・耳・体の3種類', '2018年'], ['幻覚と妄想', '4日目', '1964年の記録'], ['記録が残る最長', '264時間（11日）', '1964年'], ['眠らせないネズミ', '11〜32日で力尽きた', '1989年']],
    sources: '出典：Williamson & Feyer（2000）、Waters ほか（2018）、<br>ギネス世界記録（2023年）、Everson ほか（1989）',
  },
});
