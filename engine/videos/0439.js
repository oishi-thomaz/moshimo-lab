import * as THREE from 'three';
import { rng, clamp, lerp, ease, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { plaza, setPlazaEnv, makePigeon, makeFlock, makeDroppings, makePlazaPeople, LEDGE, station } from '../scenes/plaza.js';
import { farm, setFarmEnv, setVeg, FIELD, makeFarmer, farmerWork } from '../scenes/farm.js';
import { room, setRoom, setLight } from '../scenes/room.js';
import { lift, look, runStory, endCard, hudTime, countUp, makeSparkles, textSprite, setTop, setHud, el } from '../story.js';

// もしも日本中のハトが消えたら？（blueprint no 439・絶滅ボタンシリーズ）
// 数字：
//  ドバトの捕獲数 54,288羽（2021年度＝令和3年度、都道府県知事の許可による 生活環境・農林水産業・生態系の被害防止の捕獲。
//    環境省 鳥獣関係統計 表12-6 https://www.env.go.jp/nature/choju/docs/docs2/r03/R3-12-06.xlsx）
//  ハトによる農作物被害 8,900万円（2023年度＝令和5年度、農林水産省「全国の野生鳥獣による農作物被害状況」別添2 鳥獣種類別
//    https://www.maff.go.jp/j/seisan/tyozyu/higai/hogai_zyoukyou/h_zyokyo2/attach/pdf/r5_higai-7.pdf）
//  大豆は子葉を2枚食害されると収量がおおよそ半減（農研機構 鳥獣害研究室「鳥種別生態と防除の概要：ハト」2001年
//    https://www.naro.go.jp/org/nilgs/choju/wildlife/doves.pdf）
//  クリプトコックス属の真菌はハトなど鳥類の堆積糞で増殖。播種性クリプトコックス症の届出 2014年第39週〜2023年第48週で1,400例、
//    届出時点の死亡185例（13.2%）（国立健康危機管理研究機構 IASR 45(2) 2024「播種性クリプトコックス症の疫学」
//    https://id-info.jihs.go.jp/surveillance/iasr/pathogens/vol45/528/528r02.html）
//  カワラバト（ドバト）は人からえさをもらうことで数を増やしている（堺市「ドバト（カワラバト）」
//    https://www.city.sakai.lg.jp/kurashi/gomi/kankyo_hozen/yaseichoju/komaru/dobato.html）

// ---------- plaza: button, hand, pigeons ----------
const BTN = new THREE.Vector3(0.6, 0.6, 2.2); // v2：台を低くして、ボタンとハトを1枚目に一緒に収める
const ped = box(0.7, 0.55, 0.7, mat('#3a3f48')); ped.position.set(BTN.x, 0.275, BTN.z); plaza.add(ped);
const btnBase = box(0.42, 0.1, 0.42, mat('#2a2d33')); btnBase.position.set(BTN.x, BTN.y + 0.05, BTN.z); plaza.add(btnBase);
const btnCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.09, 20), mat('#e0352b', { emissive: 0x5a0a06, emissiveIntensity: 0.5 })); btnCap.castShadow = true; plaza.add(btnCap);
function setButton(k) { btnCap.position.set(BTN.x, BTN.y + 0.145 - 0.05 * k, BTN.z); }
const hand = new THREE.Group(); plaza.add(hand);
{ const sl = box(0.16, 0.7, 0.16, mat('#4fa3d1')); sl.position.y = 0.45; hand.add(sl); const h = box(0.13, 0.16, 0.15, mat(SKIN[0])); h.position.y = 0.05; hand.add(h); const f = box(0.04, 0.09, 0.04, mat(SKIN[0])); f.position.y = -0.06; hand.add(f); }
hand.rotation.z = -0.35;
function setHand(k) { hand.visible = k > 0.01; hand.position.set(BTN.x + 0.05 + (1 - k) * 0.45, BTN.y + 0.24 + (1 - k) * 0.9, BTN.z + 0.02); }
const btnLab = textSprite('ハト絶滅ボタン', { w: 768, h: 128, size: 66, bg: 'rgba(20,22,28,.85)', sx: 1.0 }); btnLab.position.set(BTN.x, BTN.y + 0.5, BTN.z); plaza.add(btnLab);

const flock = makeFlock(34, 7, { x0: -6, x1: 7, z0: -6, z1: 5 });
const near = makeFlock(8, 11, { x0: BTN.x - 1.7, x1: BTN.x + 1.7, z0: BTN.z - 0.3, z1: BTN.z + 0.6 }); // v2：1枚目でタイトルとチップの間に収まるよう、手前に出すぎない
const ledge = []; { const r = rng(4); for (let i = 0; i < 14; i++) { const b = makePigeon({ coat: ['#8c95a6', '#7d8697', '#9aa1ae'][i % 3] }); b.position.set(LEDGE.x0 + (i + r() * 0.5) * ((LEDGE.x1 - LEDGE.x0) / 14), LEDGE.y, LEDGE.z + (r() - 0.5) * 0.4); b.rotation.y = -Math.PI / 2 + (r() - 0.5) * 1.4; b.scale.setScalar(1.1); plaza.add(b); ledge.push(b); } }
function ledgeOn(v, t = 0) { ledge.forEach((b, i) => { b.visible = v; if (v) b.userData.anim(t + i, { peck: i % 3 === 0 ? 1 : 0 }); }); }
const people = makePlazaPeople(12, 5);
const drop = makeDroppings(90, 3, { x0: -8.4, x1: -5.6, z0: -3.3, z1: -2.7, y: 0.54 });
const drop2 = makeDroppings(120, 8, { x0: -9, x1: -4.6, z0: -4.5, z1: -1.6, y: 0.0 });
const pSpark = makeSparkles(500, 0.14); plaza.add(pSpark.points);
const dSpark = makeSparkles(200, 0.1); plaza.add(dSpark.points);

// ---------- farm: sprouts + pigeons ----------
const fBirds = []; { const r = rng(12); for (let i = 0; i < 12; i++) { const b = makePigeon({ coat: ['#8c95a6', '#9aa1ae', '#7d8697'][i % 3] }); b.scale.setScalar(1.6); farm.add(b); fBirds.push({ b, x: FIELD.x - FIELD.w * 0.35 + r() * FIELD.w * 0.7, z: FIELD.z - FIELD.d * 0.35 + r() * FIELD.d * 0.7, ph: r() * 9, ry: r() * 6.28 }); } }
function farmBirds(t, v) { fBirds.forEach((d, i) => { d.b.visible = v; if (!v) return; d.b.position.set(d.x + Math.sin(t * 0.4 + d.ph) * 0.5, 0.05, d.z); d.b.rotation.y = d.ry + Math.sin(t * 0.3 + d.ph) * 0.6; d.b.userData.anim(t + d.ph, { peck: (i % 2) ? 1 : 0, walk: (i % 2) ? 0 : 1 }); }); }
const fSpark = makeSparkles(300, 0.25); farm.add(fSpark.points);
const farmer = makeFarmer(rng(3)); farmer.position.set(FIELD.x - FIELD.w / 2 - 1.2, 0, FIELD.z + 1); farmer.rotation.y = Math.PI / 2; farm.add(farmer);
const fw = (x, y, z) => [FIELD.x + x, y, FIELD.z + z];

// ---------- ward ----------
const W = new THREE.Group(); room.add(W);
const patients = [];
for (let i = 0; i < 3; i++) { const p = makePerson({ skin: SKIN[i % 3], hair: HAIR[(i + 1) % 4], shirt: '#cfe3f2', pants: '#cfe3f2', scale: 0.9 }); p.rotation.x = -Math.PI / 2; p.position.set(-2.6 + i * 2.6, 0.76, -2.95); W.add(p); patients.push(p); }
const doc = makePerson({ skin: SKIN[1], hair: HAIR[0], shirt: '#ffffff', pants: '#3b4250', scale: 1 }); doc.position.set(-1.3, 0, -0.9); doc.rotation.y = Math.PI * 0.85; W.add(doc);
function ward() { setRoom({ sets: ['ward'] }); setLight('day', { ceil: 6 }); W.visible = true; }

const SUBS = [
  [2.6, 6.0, '時間を少し戻そう。<br>いつもの駅前広場。'],
  [6.2, 10.1, '駅前はきれいになる。<br>でも怖いのはフンの中身。'],
  [10.1, 14, '被害を防ぐため、毎年<br>5万羽以上が捕まっていた。'],
  [14.2, 18.1, '消えたのは、<br>街のハトだけじゃない。'],
  [18.1, 22, '畑では、まいたばかりの<br>豆の芽を食べていた。'],
  [22.2, 26.1, 'ハトの農作物の被害は、<br>1年で8,900万円。'],
  [26.1, 30, 'その分の豆が農家に残った。<br>でも本題はここからだ。'],
  [30.2, 34.6, '駅や公園には、<br>ハトのフンがたまっていた。'],
  [34.6, 39, 'フンで増えるカビの仲間が、<br>人の体に入ることもある。'],
  [39.2, 43.6, 'その重い感染症は、<br>9年で1,400人が届け出。'],
  [43.6, 47.8, '185人が、届け出の<br>時点で亡くなっていた。'],
  [48.1, 53.8, '結果：畑の8,900万円が守られ、<br>フンの菌の心配も減った。'],
  [53.9, 56.1, '増やしたのは、人のエサだった。'],
  [56.2, 59.4, '次に絶滅ボタンを<br>押したい生き物は？'],
];

const cd = (left) => { left += 1e-6; return `0:${String(Math.floor(left)).padStart(2, '0')}.${String(Math.floor((left % 1) * 100)).padStart(2, '0')}`; };
const TP = 0.5; // v2：0.5秒で押す（冒頭で待たせない）
function plazaReset() { setPlazaEnv('day'); setHand(0); setButton(0); btnLab.visible = false; ped.visible = btnBase.visible = btnCap.visible = true; drop.userData.setK(0); drop2.userData.setK(0); dSpark.set(0); station.userData.sign.visible = true; }
function hookCam(t, d = 2.5) { const u = ease(t / d); look(BTN.x + lerp(-2.4, -2.2, u), lerp(2.9, 2.8, u), BTN.z + lerp(4.0, 3.8, u), BTN.x + 0.15, 0.7, BTN.z - 0.1, 40); } // v2：少し上から寄って、ボタンとハトをタイトルの下に
function shot0(t) { // hook: red button among pigeons; press at 1.4 -> pigeons vanish
  plazaReset(); flock.set(0, t); ledgeOn(false); people.set(0, t);
  const press = clamp((t - (TP - 0.35)) / 0.35);
  setHand(t < TP ? ease(press) : clamp(1 - (t - TP - 0.25) / 0.5)); setButton(t < TP ? press : clamp(1 - (t - TP - 0.2) / 0.3));
  near.set(t < TP ? 8 : 0, t + 3);
  if (t >= TP && !pSpark.r0) { pSpark.init(near.birds.map(d => d.b.position.toArray()), 0.25, 0.7); pSpark.r0 = true; }
  pSpark.set(t >= TP ? (t - TP) / 0.9 : 0);
  el.flash.style.opacity = t >= TP ? 0.55 * Math.max(0, 1 - (t - TP) / 0.3) : 0;
  lift(270); hookCam(t);
  setHud('絶滅ボタンを押すまで', cd(Math.max(0, TP - t)), 1, { mono: true, color: t < TP ? '#fff' : '#ff6b6b' });
  return plaza;
}
function shot1(t) { // everyday: plaza full of pigeons and people
  lift(200);
  plazaReset(); near.set(0, t); pSpark.set(0); ped.visible = btnBase.visible = btnCap.visible = false;
  flock.set(34, t + 4); ledgeOn(true, t); people.set(12, t, { look: true }); drop2.userData.setK(1);
  const u = ease(t / 3.5);
  look(lerp(2, 1, u), lerp(5.5, 5.2, u), lerp(15, 14, u), 0, 1.6, -3, 52);
  return plaza;
}
function shot2(t) { // +1秒: all pigeons vanish (ledge + ground)
  lift(200);
  plazaReset(); near.set(0, t); ped.visible = btnBase.visible = btnCap.visible = false; people.set(12, t + 3.5, { look: true });
  const tv = 0; // v2：冒頭で押した直後からつながるので、広場のハトももう消えている（消えた跡の光だけ）
  flock.set(t < tv ? 34 : 0, t + 7.5); ledgeOn(t < tv, t);
  if (t >= tv && !pSpark.r1) { pSpark.init([...flock.birds.map(d => [d.x, 0.2, d.z]), ...ledge.map(b => b.position.toArray())], 0.3, 1.0); pSpark.r1 = true; }
  pSpark.set(t >= tv ? (t - tv) / 1.4 : 0);
  const u = ease(t / 8);
  look(lerp(1, -1, u), lerp(5.2, 4.2, u), lerp(14, 6, u), 0, lerp(1.6, 3.6, u), lerp(-3, -10, u), 52);
  hudTime('+1秒');
  setTop('ハトの捕獲数（2021年度）', comma(countUp(t, 54288, 3.95, 1.3)) + '羽', fade(t, 3.9, 8, 0.25));
  return plaza;
}
function farmEnv() { setFarmEnv('day'); }
function shot3(t) { // +1日: field sprouts with pigeons pecking -> vanish
  lift(300);
  farmEnv(); setVeg(0.25);
  const tv = 1.0;
  farmBirds(t, t < tv);
  if (t >= tv && !fSpark.r) { fSpark.init(fBirds.map(d => d.b.position.toArray()), 0.3, 1.0); fSpark.r = true; }
  fSpark.set(t >= tv ? (t - tv) / 1.5 : 0);
  farmer.visible = false;
  const u = ease(t / 8);
  look(...fw(lerp(-7, -5, u), lerp(4.5, 5.5, u), lerp(10, 11, u)), ...fw(0, 0.3, 0), 50);
  hudTime('+1日');
  setTop('芽を2枚食べられた大豆（2001年）', '収穫が約' + countUp(t, 50, 4.15, 1.0) + '%に', fade(t, 4.1, 8, 0.25), '#ffd27a');
  return farm;
}
function shot4(t) { // +1か月: field grown, farmer working
  lift(300);
  farmEnv(); farmBirds(0, false); fSpark.set(0);
  setVeg(lerp(0.35, 1, clamp(t / 5)));
  farmer.visible = true; farmerWork(farmer, t);
  const u = ease(t / 8);
  look(...fw(lerp(8, 5, u), lerp(8, 10, u), lerp(12, 14, u)), ...fw(-1, 0, -1), 50);
  hudTime('+1か月');
  setTop('ハトによる農作物被害（2023年度）', comma(countUp(t, 8900, 0.25, 1.4)) + '万円', fade(t, 0.2, 8, 0.25), '#ffd27a');
  return farm;
}
function shot5(t) { // +半年: bench & ground droppings disappear
  lift(220);
  plazaReset(); ped.visible = btnBase.visible = btnCap.visible = false; flock.set(0, t); ledgeOn(false); near.set(0, t); pSpark.set(0); people.set(4, t + 9);
  const tv = 4.4;
  drop.userData.setK(t < tv ? 1 : 0); drop2.userData.setK(t < tv ? 1 : 0);
  if (t >= tv && !dSpark.r) { dSpark.init([[-7, 0.6, -3], [-6.8, 0.1, -2.5], [-7.6, 0.1, -3.6]], 1.5, 0.6); dSpark.r = true; }
  dSpark.set(t >= tv ? (t - tv) / 1.3 : 0);
  const u = ease(t / 9.2);
  look(lerp(-4.4, -4.0, u), lerp(2.6, 2.3, u), lerp(1.8, 1.0, u), -7, 0.35, -3, 50);
  hudTime('+半年');
  setTop('ハトのフンで増える菌（IASR 2024年）', 'クリプトコックス', fade(t, 0.2, 9.2, 0.25), '#ff8a7a');
  return plaza;
}
function shot6(t) { // +1年: hospital ward
  lift(140);
  ward();
  doc.userData.head.rotation.y = Math.sin(t * 0.8) * 0.4;
  const u = ease(t / 8.8);
  look(lerp(1.6, 0.8, u), lerp(2.6, 2.3, u), lerp(3.6, 2.8, u), -1, 0.8, -2.5, 50);
  hudTime('+1年');
  if (t < 4.4) setTop('播種性クリプトコックス症の届出（2014〜2023年）', comma(countUp(t, 1400, 0.25, 1.3)) + '人', fade(t, 0.2, 4.4, 0.2), '#ff8a7a');
  else setTop('うち届出時点で死亡（2014〜2023年）', countUp(t - 4.4, 185, 0.05, 1.2) + '人', fade(t, 4.4, 8.8, 0.2), '#ff8a7a');
  return room;
}
function shot7(t) { // result: clean plaza, people, no pigeons
  lift(200);
  plazaReset(); ped.visible = btnBase.visible = btnCap.visible = false; flock.set(0, t); ledgeOn(false); near.set(0, t); pSpark.set(0); people.set(12, t + 20, { look: true });
  setPlazaEnv('dusk');
  const u = ease(t / 7.5);
  look(lerp(0, 2, u), lerp(5, 7, u), lerp(13, 17, u), 0, 2, -4, 52);
  const a = t < 3.6;
  setTop(a ? 'ハトによる農作物被害（2023年度）' : '播種性クリプトコックス症の届出（2014〜2023年）', a ? '8,900万円' : '1,400人', fade(t, 0.15, 7.5, 0.25), a ? '#ffd27a' : '#ff8a7a');
  return plaza;
}
function shot8(t) { // loop: same button, already pressed, no pigeons
  plazaReset(); flock.set(0, t); ledgeOn(false); near.set(0, t); pSpark.set(0); people.set(0, t);
  lift(270); hookCam(t + 0.4, 4.5);
  setHud('絶滅ボタンを押すまで', cd(0), 1, { mono: true, color: '#ff6b6b' });
  return plaza;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  cut: [[2.5, 6.0]], // v2：いつもの駅前広場（元の2.5〜6秒）を抜いて、押した直後から本題へ
  meta: {
    id: '0439',
    v2: true,
    hookLine: '日本中のハトが、一斉に消えた。',
    series: '絶滅ボタン',
    hookType: 'H5',
    cat: '生き物・動物',
    title: '日本中のハトが消えたら？',
    titleHtml: '日本中のハトが<br>消えたら？',
    mood: 'mystery', seed: 439, hits: [0.5, 48.1], risers: [6.0], impacts: [22.4, 39.4],
    sfx: [[0.5, 'poof'], [15.0, 'poof'], [34.6, 'poof']],
    narr: { '5万羽': 'ごまんわ', '8,900万円': '8900万円', '1,400人': '1400人', '185人': 'ひゃくはちじゅうごにん' },
    ask: '次に絶滅ボタンを押したい生き物は？',
    caption: 'もしも日本中のハトが一瞬で消えたら？\n駅前や公園のハト（ドバト）は、被害を防ぐために年5万4,288羽が捕獲されていた（2021年度）。\n畑では、まいたばかりの豆の芽を食べる。大豆は芽の葉を2枚食べられると収穫がおよそ半分になる。ハトによる農作物の被害は年8,900万円（2023年度）。\nフンにはクリプトコックスというカビの仲間がよく増える。この菌の重い感染症（播種性クリプトコックス症）は、2014〜2023年の9年あまりで1,400人が届け出され、185人が届け出の時点で亡くなっていた（すべてがハトのせいではない）。\n結果、畑の8,900万円は守られ、フンの菌の心配も減る。\nでも、ハトを街で増やしたのは、人があげるエサだった。\n\n次に絶滅ボタンを押したい生き物は？ コメントで教えて。\n\n出典：環境省 鳥獣関係統計（2021年度）、農林水産省 野生鳥獣による農作物被害状況（2023年度）、農研機構「鳥種別生態と防除の概要：ハト」（2001年）、国立健康危機管理研究機構 IASR 45(2)（2024年）、堺市「ドバト（カワラバト）」',
    hashtags: ['もしもラボ', 'ハト', '絶滅ボタン', '生き物', '雑学'],
    endStats: [['ハトの捕獲数', '54,288羽', '2021年度'], ['ハトの農作物被害', '8,900万円', '2023年度'], ['芽を食べられた大豆', '収穫が約半分', '2001年'], ['クリプトコックス症の届出', '1,400人', '2014〜2023年'], ['うち届出時に死亡', '185人', '2014〜2023年']],
    sources: '出典：環境省 鳥獣関係統計（2021年度）、農林水産省（2023年度）、<br>農研機構（2001年）、IASR 45(2)（2024年）、堺市',
  },
});
