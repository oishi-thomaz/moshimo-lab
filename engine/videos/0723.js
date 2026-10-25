import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, fade, mat, makePerson } from '../lib.js';
import { stage, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, textSprite, makeSparkles, setTop, setHud, el } from '../story.js';

// 一晩寝なかったら、体で一番ヤバくなる場所は？（blueprint no 723・派生 ヤバい順×人体の限界）
// 順位の決め方：一晩（約24〜35時間）眠らなかったあと、ふだんと比べてどれだけ変わったか（変化の大きさ）で並べた。
// 数字：
//  5位 脳のゴミ：約31時間起きたあと、アルツハイマー病に関わるアミロイドβが視床・海馬で約5%増（20人。Shokri-Kojori ほか PNAS 2018／NIH 発表 2018年4月13日 https://www.nih.gov/node/36986）
//  4位 記憶：約35時間起きたあとに覚えた写真は、2日後（寝て回復した後）でも平均19%思い出せなかった（Yoo ほか Nature Neuroscience 2007／Harvard Gazette 2007年2月 https://news.harvard.edu/gazette/story/2007/02/study-shows-importance-of-sleep-for-optimal-memory-functioning）
//  3位 免疫：A型肝炎ワクチンを打った夜に眠らなかった人は、4週間後の抗体が、眠った人の約半分（眠った人が約2倍）（19人。Lange ほか Psychosomatic Medicine 2003 https://research.uni-luebeck.de/en/publications/sleep-enhances-the-human-antibody-response-to-hepatitis-a-vaccina/）
//  2位 心（感情）：35時間起き続けると、不安や怒りに関わる脳（扁桃体）の反応が60%以上強くなった（26人。Yoo ほか Current Biology 2007／UC Berkeley 発表 2007年10月22日 https://newsarchive.berkeley.edu/news/media/releases/2007/10/22_sleeploss.shtml）
//  1位 痛み：一晩眠らないと、痛みを感じる脳（体性感覚野）の反応が126%増。痛いと感じる温度は約111°F（約44℃）→約107°F（約42℃）（25人。Krause ほか Journal of Neuroscience 2019／UC Berkeley 発表 2019年1月28日 https://news.berkeley.edu/2019/01/28/sleep-pain-connection）

setStageColor('#101a30');
const GREEN = '#7ff0c8', RED = '#ff5a4f', GOLD = '#ffe08a', BLUE = '#9fc8ff';
const S = 3;
const body = makePerson({ skin: '#d9dee7', hair: '#8f9bb0', shirt: '#9fb0c8', pants: '#6f7f99', scale: S }); body.position.set(0, 0.3, 0); stage.add(body);
const B = body.userData;
B.arms[1].rotation.z = 0.35; B.arms[0].rotation.z = -0.12;
// markers (world positions)
const NAMES = ['脳のゴミ', '記憶', '免疫', '心', '痛み'];
const POS = [[0, 6.75, 0.2], [-0.95, 5.75, 0.4], [-0.5, 4.2, 0.55], [0.95, 5.75, 0.4], [1.2, 3.95, 0.45]];
const COL = [BLUE, GOLD, GREEN, '#ff9ad5', RED];
const MK = POS.map((p, i) => {
  const g = new THREE.Group(); g.position.set(...p); stage.add(g);
  const m = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true });
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), m); g.add(s);
  const rm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.4, 32), rm); g.add(ring);
  const lab = textSprite('？', { w: 512, h: 128, size: 66, bg: 'rgba(16,22,36,.86)', sx: 1.55, depthTest: false }); lab.renderOrder = 6;
  lab.position.set(p[0] < -0.1 ? -1.2 : 1.2, p[0] === 0 ? 0.25 : 0.0, 0.2); g.add(lab);
  return { g, m, rm, ring, lab, s };
});
// state: k = 0 unknown(white), 1 revealed(color), hot = pulsing focus
function markers(T, revealed, focus = -1, solo = false) {
  MK.forEach((o, i) => {
    const rev = i < revealed;
    const c = rev ? COL[i] : '#ffffff';
    o.m.color.set(c); o.rm.color.set(c);
    const pulse = 1 + Math.sin(T * 5 + i) * 0.12 + (i === focus ? 0.35 + Math.sin(T * 8) * 0.2 : 0);
    o.s.scale.setScalar(pulse);
    o.ring.scale.setScalar(1 + ((T * 0.9 + i * 0.2) % 1) * (i === focus ? 0.9 : 0.5));
    o.rm.opacity = 1 - ((T * 0.9 + i * 0.2) % 1);
    o.lab.userData.set(rev ? `${5 - i}位 ${NAMES[i]}` : '？');
    o.lab.material.opacity = focus >= 0 && i !== focus && !rev ? 0.4 : 1;
    o.lab.visible = !(solo && i !== focus);
  });
}
// ranking panel (left)
const PANEL = new THREE.Group(); PANEL.visible = false; stage.add(PANEL);
const ROWS = [0, 1, 2, 3, 4].map(r => { const sp = textSprite('', { w: 640, h: 128, size: 60, bg: 'rgba(16,22,36,.9)', sx: 3.0, depthTest: false }); sp.renderOrder = 6; sp.position.set(0, 7.1 - r * 0.85, 0); PANEL.add(sp); return sp; });
function panel(revealed) { // row r shows rank r+1; item index = 4 - r
  ROWS.forEach((sp, r) => { const i = 4 - r; sp.userData.set(i < revealed ? `${r + 1}位　${NAMES[i]}` : `${r + 1}位　？`); });
}
const spark = makeSparkles(160, 0.14, 0xffd0d0); stage.add(spark.points);

const SUBS = [
  [2.6, 6.0, '一晩寝ないで、変化が<br>大きい順にランキング。'],
  [6.2, 10.1, '5位は、<br>脳にたまるゴミ。'],
  [10.1, 14, '認知症に関わる物質が、<br>一晩で約5%増えた。'],
  [14.2, 18.1, '4位は記憶。<br>新しいことが入らない。'],
  [18.1, 22, '覚えたことを、平均19%<br>思い出せなかった。'],
  [22.2, 26.1, '3位は免疫。ワクチンを<br>打った夜に寝ないと…'],
  [26.1, 30, '4週間後の抗体は、<br>寝た人の約半分。'],
  [30.2, 34.6, '2位は心。不安や怒りが<br>止まらなくなる。'],
  [34.6, 39, '感情の脳の反応は、<br>60%以上強くなった。'],
  [39.2, 43.6, '1位は痛み。同じ熱さでも<br>痛く感じる。'],
  [43.6, 47.8, '痛みを感じる脳の反応は、<br>126%アップ。'],
  [48.1, 53.8, '結果：一番ヤバいのは痛み。<br>一晩で反応が2倍以上に。'],
  [53.9, 56.1, '※徹夜は真似しないで。'],
  [56.2, 59.4, 'あなたが一番ヤバいと<br>思ったのはどれ？'],
];

const fmt = (hrs) => { const h = Math.floor(hrs), m = Math.floor((hrs - h) * 60), s = Math.floor(((hrs - h) * 60 - m) * 60); return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
function overCam(t, d, z0 = 13.5, z1 = 12.8) { const u = ease(t / d); look(lerp(-0.3, 0.3, u), 5.0, lerp(z0, z1, u), 0, 4.6, 0, 50); }
function focusCam(i, t, d) { const p = POS[i], u = ease(t / d); const side = p[0] < -0.1 ? -1 : 1; look(p[0] + side * lerp(1.3, 1.0, u), p[1] - 0.2, p[2] + lerp(7.6, 7.0, u), p[0] + side * 0.5, p[1] - 1.0, p[2], 50); }
function shot0(t, T) { // hook: awake timer races, 5 white markers blink
  markers(T, 0); panel(0); spark.set(0);
  overCam(t, 2.5);
  el.title.style.opacity = 1;
  setHud('起きてから', fmt(Math.min(24, t * 10)), 1, { mono: true, color: t * 10 > 20 ? '#ff8a7a' : '#fff' });
  return stage;
}
function shot1(t, T) {
  markers(T, 0); panel(0); overCam(t + 2.5, 6);
  el.title.style.opacity = clamp(1 - (t - 0.2) / 0.5);
  setHud('起きてから', '24:00:00', 1, { mono: true, color: '#ff8a7a' });
  return stage;
}
const TOP = [
  (t) => setTop('アミロイドβ（約31時間起きて・2018年）', '約' + countUp(t, 5) + '%増', fade(t, 0.15, 8, 0.25), BLUE),
  (t) => setTop('思い出せなかった写真（2007年）', '平均' + countUp(t, 19) + '%', fade(t, 0.15, 8, 0.25), GOLD),
  (t) => setTop('4週間後の抗体（寝た人と比べて・2003年）', '約半分', fade(t, 0.15, 8, 0.25), GREEN),
  (t) => setTop('不安・怒りの脳の反応（35時間起きて・2007年）', countUp(t, 60) + '%以上強い', fade(t, 0.15, 9.2, 0.25), '#ff9ad5'),
  (t) => t < 4.4 ? setTop('痛いと感じる温度（2019年）', '約44℃→約42℃', fade(t, 0.15, 4.4, 0.25), RED) : setTop('痛みを感じる脳の反応（一晩寝ないで・2019年）', countUp(t - 4.4, 126) + '%アップ', fade(t, 4.4, 8.8, 0.25), RED),
];
function rankShot(i) {
  return function (t, T) {
    markers(T, i + 1, i, true); panel(i + 1);
    if (i === 4 && !spark.ok) { spark.init([POS[4]], 0.5, 1.6); spark.ok = true; }
    spark.set(i === 4 ? clamp(t / 2) : 0);
    focusCam(i, t, 8);
    setHud('ランキング', `${5 - i}位`, 1, { color: COL[i] });
    TOP[i](t);
    return stage;
  };
}
function shot7(t, T) { // result: all revealed, pain marker hot, panel complete
  lift(170); markers(T, 5, 4); panel(5); spark.set(0);
  overCam(t, 7.5, 12.5, 13.5);
  setHud('1位', '痛み', 1, { color: RED });
  setTop('痛みを感じる脳の反応（一晩寝ないで・2019年）', '2倍以上（126%増）', fade(t, 0.15, 7.5, 0.25), RED);
  return stage;
}
function shot8(t, T) { // loop: like the hook, timer at 0
  markers(T, 0); panel(0); overCam(t, 4, 13.3, 13.5);
  setHud('起きてから', fmt(t * 0.5), 1, { mono: true });
  return stage;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: rankShot(0) }, { a: 14, b: 22, f: rankShot(1) },
  { a: 22, b: 30, f: rankShot(2) }, { a: 30, b: 39.2, f: rankShot(3) }, { a: 39.2, b: 48, f: rankShot(4) }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0723',
    hookType: 'H1',
    cat: '体・健康',
    title: '一晩寝なかったら、体で一番ヤバくなる場所は？',
    titleHtml: '一晩寝なかったら、<br>体で一番ヤバい場所は？',
    mood: 'tension', seed: 723, hits: [6.2, 14.2, 22.2, 30.2, 39.2, 48.1], risers: [39.2],
    impacts: [11.0, 19.0, 27.0, 35.5, 44.6],
    sfx: [[2.4, 'alarm']],
    narr: { '5%': '5パーセント', '19%': '19パーセント', '60%': '60パーセント', '126%': '126パーセント', '※徹夜は真似しないで。': '徹夜は真似しないで。' },
    ask: 'あなたが一番ヤバいと思ったのはどれ？',
    caption: '一晩寝ないで朝を迎えたら、体のどこが一番ヤバくなる？ ふだんと比べた変化の大きさでランキング。\n5位 脳のゴミ：アルツハイマー病に関わるアミロイドβが、約31時間起きただけで約5%増（2018年）。\n4位 記憶：寝不足で覚えた写真は、平均19%思い出せなかった（2007年）。\n3位 免疫：ワクチンを打った夜に寝なかった人は、4週間後の抗体が寝た人の約半分（2003年）。\n2位 心：不安や怒りに関わる脳の反応が60%以上強くなった（2007年）。\n1位 痛み：痛みを感じる脳の反応が126%アップ。痛いと感じる温度も約44℃から約42℃に下がった（2019年）。\n結果、一番ヤバいのは痛み。一晩で、痛みへの反応が2倍以上になった。\n※徹夜は真似しないでください\n\nあなたが一番ヤバいと思ったのはどれ？ コメントで教えて。\n\n出典：Shokri-Kojori ほか PNAS（2018年）／米国立衛生研究所、Yoo ほか Nature Neuroscience（2007年）、Lange ほか Psychosomatic Medicine（2003年）、Yoo ほか Current Biology（2007年）、Krause ほか Journal of Neuroscience（2019年）',
    hashtags: ['もしもラボ', '徹夜', '睡眠不足', 'ランキング', '雑学'],
    endStats: [['5位 脳のゴミ', '約5%増', '2018年'], ['4位 記憶', '平均19%思い出せない', '2007年'], ['3位 免疫', '抗体が約半分', '2003年'], ['2位 心', '反応が60%以上強い', '2007年'], ['1位 痛み', '反応が126%アップ', '2019年']],
    sources: '出典：PNAS（2018年）、Nature Neuroscience（2007年）、<br>Psychosom Med（2003年）、Curr Biol（2007年）、J Neurosci（2019年）',
  },
});
