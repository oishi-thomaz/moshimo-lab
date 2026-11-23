import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box, poseWalk, comma } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeOji, makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeBench } from '../scenes/home.js';

// もしも週2日だけ、8,000歩歩いたら？（人体の限界・台本 S131）
// 2026/11/22 ゆうと承認（投稿サーバーで ok）。毎日1万歩が自慢の健康おじさんが、カレンダーの5日が 歩かない日 になって固まる回
// 数字（一次資料で確認・2026/11/23）：Inoue ほか JAMA Network Open 2023年（PMC10051082・京都大学のリポジトリ）。アメリカの成人3,101人（NHANES 2005〜2006年）を10年追跡。
//  1日8,000歩以上の日が週0日の人と比べた、10年の全死因死亡のリスクの差（調整後）：週1〜2日 −14.9%・週3〜7日 −16.5%
//  画面は 研究の調整後の差 と出す。1万歩の根拠の話・日本人の歩数は使わない。おじさんは笑う程度（体や年齢をばかにしない）

const GOLD = '#ffd27a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#b8d4ec', ground: '#8a9078' }); hemi.intensity = 1.3;
const OJI = makeOji(rng(131), { shirt: '#e86a3a' }); S.add(OJI); const sweatO = makeSweat(); OJI.userData.head.add(sweatO);
const BAND = box(0.16, 0.08, 0.17, mat('#1a1a20')); BAND.position.set(0, -0.5, 0.0); OJI.userData.arms[1].add(BAND);
const ME = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }); S.add(ME); const sweatM = makeSweat(); ME.userData.head.add(sweatM);
const BAG = box(0.34, 0.36, 0.14, mat('#f2c94c')); BAG.position.set(0, -0.75, 0.05); ME.userData.arms[0].add(BAG);

// ---------- A：大きなカレンダーの壁（原点） ----------
room({ x: 0, w: 10, d: 7, h: 3.4, wall: '#efe8da', floor: '#b8a080' });
const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const CAL = (() => { const c = document.createElement('canvas'); c.width = 1400; c.height = 520; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.3), new THREE.MeshBasicMaterial({ map: tex })); let key = '';
  m.userData.draw = (k, walk = [1, 1, 1, 1, 1, 1, 1]) => { const kk = k.toFixed(2) + walk.join(''); if (kk === key) return; key = kk; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1400, 520); g.fillStyle = '#3a6ab2'; g.fillRect(0, 0, 1400, 110); g.fillStyle = '#fff'; g.font = '900 70px "Noto Sans CJK JP"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('今週の歩く日', 700, 58);
    DAYS.forEach((d, i) => { const x = 20 + i * 196, y = 130; const off = walk[i] === 0 && k > i / 7 * 0; const gray = walk[i] === 0 ? clamp(k) : 0; g.fillStyle = gray > 0.5 ? '#9aa0aa' : (i >= 5 ? '#fff1d8' : '#eef4fb'); g.fillRect(x, y, 180, 370); g.fillStyle = i === 6 ? '#d23a3a' : i === 5 ? '#3a6ab2' : '#333'; g.font = '900 80px "Noto Sans CJK JP"'; g.fillText(d, x + 90, y + 70);
      g.font = '900 64px "Noto Sans CJK JP"'; if (gray > 0.5) { g.fillStyle = '#fff'; g.fillText('歩か', x + 90, y + 190); g.fillText('ない', x + 90, y + 270); } else { g.fillStyle = '#3a8a5a'; g.fillText('歩く', x + 90, y + 230); } });
    tex.needsUpdate = true; };
  return m; })();
CAL.position.set(0, 2.05, -3.4); S.add(CAL);
const sparkA = makeSparkles(160, 0.1, 0xffffff); S.add(sparkA.points); sparkA.init([[-1.0, 2.0, -3.2]], 1.2, 0.6);
const STEP = label('10,000歩', { w: 640, size: 110, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.75 }); S.add(STEP);
const katamaru = label('…', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.42 }); S.add(katamaru);
const jiman = label('健康おじさんの 自慢', { w: 1024, size: 92, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.25 }); S.add(jiman);

// ---------- B：会社（x=60）：平日はムリ ----------
const BX = 60;
room({ x: BX, w: 10, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#2a3a5a' })); w.position.set(BX - 3.2 + i * 3.2, 2.0, -3.4); S.add(w); }
const ISL = makeDeskIsland(2); ISL.position.set(BX, 0, -1.6); S.add(ISL);
const muri = label('平日は ムリ', { w: 640, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.85 }); S.add(muri);
const ARUKE = label('毎日歩け', { w: 512, size: 110, color: '#2a1a00', bg: 'rgba(255,255,255,.97)', sx: 0.7 }); S.add(ARUKE);

// ---------- C：まち（x=120）：家と会社の往復・土曜の買い物・日曜の公園 ----------
const CX = 120;
flat(40, 6, '#9a9a9e', CX, 0.2); flat(40, 2, '#c8c0b0', CX, 2.2, -0.75);
const HOUSE = new THREE.Group(); { const b = box(2.2, 2.0, 2.0, mat('#e8d8c0')); b.position.y = 1.0; HOUSE.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.0, 4), mat('#8a4a3a')); r.rotation.y = Math.PI / 4; r.position.y = 2.5; HOUSE.add(r); const d = box(0.6, 1.1, 0.05, mat('#6a4a30')); d.position.set(0, 0.55, 1.02); HOUSE.add(d); } HOUSE.position.set(CX - 4.0, 0, -2.2); S.add(HOUSE);
const OFFICE = new THREE.Group(); { const b = box(2.4, 4.4, 2.0, mat('#a8b4c4')); b.position.y = 2.2; OFFICE.add(b); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const w = box(0.5, 0.5, 0.05, new THREE.MeshBasicMaterial({ color: '#cfe4f4' })); w.position.set(-0.7 + j * 0.7, 1.0 + i * 0.9, 1.02); OFFICE.add(w); } } OFFICE.position.set(CX + 4.0, 0, -2.2); S.add(OFFICE);
const SHOP = new THREE.Group(); { const b = box(3.0, 2.6, 2.0, mat('#d8e8d0')); b.position.y = 1.3; SHOP.add(b); const aw = box(3.2, 0.2, 0.6, mat('#3a8a5a')); aw.position.set(0, 2.2, 1.2); SHOP.add(aw); const d = box(1.2, 1.6, 0.05, new THREE.MeshBasicMaterial({ color: '#fff4c8' })); d.position.set(0, 0.8, 1.02); SHOP.add(d); } SHOP.position.set(CX + 30, 0, -2.2); S.add(SHOP);
flat(40, 6, '#9a9a9e', CX + 30, 0.2);
const PARKG = flat(30, 12, '#7aa86a', CX + 60, -1.0);
const PTREES = []; { const r = rng(31); for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const tr = box(0.2, 1.4, 0.2, mat('#7a5a3a')); tr.position.y = 0.7; g.add(tr); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.9 + r() * 0.3, 10, 8), mat(['#5a9a5a', '#6aa86a', '#4a8a4a'][i % 3])); lf.position.y = 1.9; g.add(lf); g.position.set(CX + 52 + i * 2.2, 0, -3.5 - r() * 1.5); S.add(g); PTREES.push(g); } }
const COUNT = label('0歩', { w: 640, size: 120, color: '#fff', bg: 'rgba(60,140,90,.97)', sx: 0.8 }); S.add(COUNT);
const oufuku = label('往復だけ', { w: 512, size: 110, color: '#fff', bg: 'rgba(110,116,128,.96)', sx: 0.7 }); S.add(oufuku);

// ---------- D：研究（x=240） ----------
const DX = 240;
flat(30, 20, '#3a3448', DX, -2); const BACKD = box(16, 7, 0.2, mat('#2c2838')); BACKD.position.set(DX, 3.5, -10); S.add(BACKD);
const CROWD = []; { const r = rng(9); for (let i = 0; i < 48; i++) { const w = r() < 0.5; const p = w ? makeWoman({ shirt: ['#a87ab0', '#7a9ac0', '#c8a070', '#8ab08a'][i % 4], hair: ['#3a2620', '#9a6a3a', '#1d1a19'][i % 3] }) : makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#8a7a5a', '#59606e'][i % 4], hair: ['#1d1a19', '#9a9a9a', '#6a4a2a'][i % 3], bald: r() < 0.2 }); p.position.set(DX - 5.5 + (i % 8) * 1.55 + (r() - 0.5) * 0.3, 0, -1 - Math.floor(i / 8) * 1.5); p.rotation.y = (r() - 0.5) * 0.5; S.add(p); CROWD.push(p); } }
const BARS = []; [['週0日', '#9aa0aa', 1.6], ['週1〜2日', '#5ab07a', 1.2], ['週3〜7日', '#3a8a5a', 1.15]].forEach(([n, c, h]) => { const b = box(0.7, 1, 0.4, mat(c)); S.add(b); const l = label(n, { w: 640, size: 100, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.6 }); S.add(l); const v = label('', { w: 512, size: 110, color: '#fff', bg: 'rgba(60,140,90,.97)', sx: 0.55 }); S.add(v); BARS.push({ b, l, v, h }); });
const hobo = label('ほとんど 変わらない', { w: 900, size: 100, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.1 }); S.add(hobo);
const imi = label('週2日で 意味ある？', { w: 900, size: 100, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.1 }); S.add(imi);

const PEOPLE = [OJI, ME];
const LABELS = [STEP, katamaru, jiman, muri, ARUKE, COUNT, oufuku, hobo, imi, ...BARS.flatMap(x => [x.l, x.v])];
function reset() {
  PEOPLE.forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.position.set(0, -50, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); el.flash.style.opacity = 0; sweatO.userData.set(0); sweatM.userData.set(0); BAG.visible = false;
  CROWD.forEach(c => c.visible = false); BARS.forEach(x => x.b.visible = false); hemi.intensity = 1.3;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
function stand(p, x, z, ry = 0) { p.visible = true; p.position.set(x, 0, z); p.rotation.y = ry; }
const TP = 0.3;
const WALK5 = [0, 0, 0, 0, 0, 1, 1];
function ojiBase() { stand(OJI, 1.0, 0.2, -0.5); OJI.userData.arms[1].rotation.set(-1.7, 0, 0.5); OJI.userData.head.rotation.x = 0.3; OJI.userData.head.rotation.y = 0.3; }
function calCam(u = 0) { look(lerp(0.15, 0.1, u), lerp(2.0, 1.95, u), lerp(5.4, 5.0, u), 0.1, 1.95, -1.6, 50); }
function shot0(t) { // 0秒＝サムネ：カレンダーの7日のうち、5日がパッと 歩かない日 に変わる
  reset(); lift(0); ojiBase(); const k = t < TP ? 0 : 1; CAL.userData.draw(k, WALK5);
  if (t >= TP) { sparkA.set(clamp((t - TP) / 1.2)); el.flash.style.opacity = t < TP + 0.08 ? 0.22 : 0; }
  STEP.visible = true; STEP.position.set(0.25, 1.45, 0.5); STEP.userData.size(0.7);
  calCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sKatamaru(t, d) { // 毎日1万歩が自慢の健康おじさんが、歩数計を見たまま固まる
  reset(); lift(140); ojiBase(); CAL.userData.draw(1, WALK5); sweatO.userData.set(1, t);
  STEP.visible = true; STEP.position.set(0.35, 1.45, 0.5); STEP.userData.size(0.6);
  if (t > d * 0.45) say(katamaru, t, d * 0.45, 1.0, 2.25, 0.2, 0.38);
  const u = ease(clamp(t / d)); look(lerp(0.85, 0.75, u), 1.95, lerp(4.6, 4.2, u), 0.8, 1.6, -0.4, 50);
  return S;
}
function sFuman(t, d) { // 忙しい人たちの不満から。毎日歩けと言われても、平日はムリ
  reset(); lift(140); hemi.intensity = 1.0; const s = ISL.userData.seats[0]; stand(ME, BX + s.x, -1.6 + s.z, s.ry); poseSit(ME); ME.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0)); sweatM.userData.set(t > d * 0.5 ? 1 : 0, t);
  say(ARUKE, t, 0.3, BX + s.x + 0.9, 2.2, -1.6 + s.z, 0.6); if (t > d * 0.5) say(muri, t, d * 0.5, BX + s.x - 0.2, 2.35, -1.6 + s.z, 0.75);
  look(BX + s.x + 0.6, 2.1, -1.6 + s.z + 4.4, BX + s.x + 0.4, 1.5, -1.6 + s.z, 50);
  return S;
}
function walker(x, z, ry, t, bag = false) { stand(ME, x, z, ry); poseWalk(ME, t * 7, 0.9); BAG.visible = bag; }
function sWeekday(t, d) { // 月曜から金曜。家と会社の往復だけ
  reset(); lift(140); const k = (t / d * 2) % 2; const x = CX - 3.2 + (k < 1 ? k : 2 - k) * 6.4; walker(x, 0.3, k < 1 ? Math.PI / 2 : -Math.PI / 2, t);
  if (t > d * 0.4) say(oufuku, t, d * 0.4, x, 2.4, 0.3, 0.7);
  setHud('8,000歩の日', '月〜金', 1);
  look(x * 0.85 + CX * 0.15, 2.2, 6.4, x * 0.85 + CX * 0.15, 1.5, -1.0, 50);
  return S;
}
function stepCount(t, d, x, z) { const n = Math.round(lerp(0, 8000, easeOut(clamp((t - 0.2) / (d * 0.75))))); COUNT.userData.set(comma(n) + '歩'); say(COUNT, t, 0.1, x, 2.4, z, 0.8); }
function sSat(t, d) { // 土曜。買い物ついでに、8,000歩
  reset(); lift(140); const x = CX + 30 + lerp(-3, 1.5, clamp(t / d)); walker(x, 0.3, Math.PI / 2, t, true); stepCount(t, d, x, 0.3);
  setHud('8,000歩の日', '土曜', 1);
  look(x + 0.6, 1.9, 5.4, x + 0.6, 1.4, -0.5, 50);
  return S;
}
function sSun(t, d) { // 日曜。公園まで歩いて、8,000歩
  reset(); lift(140); const x = CX + 60 + lerp(-3, 1.5, clamp(t / d)); walker(x, -0.6, Math.PI / 2, t); stepCount(t, d, x, -0.6);
  setHud('8,000歩の日', '日曜', 1);
  look(x + 0.6, 1.9, 4.8, x + 0.6, 1.4, -1.2, 50);
  return S;
}
function sImi(t, d) { // でも、週2日で、本当に意味があるのか
  reset(); lift(140); CAL.userData.draw(1, WALK5); stand(OJI, -0.3, -1.4, 0.2); OJI.userData.arms[0].rotation.set(0, 0, -0.5); OJI.userData.arms[1].rotation.set(0, 0, 0.5); OJI.userData.head.rotation.z = 0.15;
  if (t > d * 0.3) say(imi, t, d * 0.3, -0.2, 2.45, -1.3, 1.0);
  calCam(0.8);
  return S;
}
function crowdCam(u = 0) { look(DX + lerp(0.5, 0.0, u), lerp(4.2, 3.6, u), lerp(7.5, 6.5, u), DX, 0.8, -3.5, 50); }
function sStudy(t, d) { // アメリカの大人3,101人を10年追った研究がある（2023年・京都大学ほか）
  reset(); lift(160); CROWD.forEach((p, i) => { p.visible = t > 0.2 + (i % 8) * 0.06; });
  setTop('歩数の研究（2023年）', comma(Math.round(3101 * easeOut(clamp((t - 0.3) / 1.4)))) + '人', fade(t, 0.3, d, 0.25), BLUE); setHud('アメリカの大人', '10年', 1);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function barCam() { look(DX + 0.1, 1.6, 7.8, DX, 0.8, 0.6, 50); }
function bars(show, vals) { BARS.forEach((x, i) => { if (i >= show) return; x.b.visible = true; x.b.scale.y = x.h; x.b.position.set(DX - 1.2 + i * 1.2, x.h / 2, 0.6); x.l.visible = true; x.l.position.set(DX - 1.2 + i * 1.2, -0.25 + 0.0, 1.0); x.l.position.y = 0.3; x.l.userData.size(0.5); if (vals[i]) { x.v.visible = true; x.v.userData.set(vals[i]); x.v.position.set(DX - 1.2 + i * 1.2, x.h + 0.3, 0.7); x.v.userData.size(0.5); } }); }
function sRisk(t, d) { // 8,000歩以上の日が週0日の人と比べて、週1〜2日の人は、10年の死亡リスクが14.9%低かった
  reset(); lift(140); const ph = t / d; bars(ph < 0.35 ? 1 : 2, ['基準', ph > 0.68 ? '−14.9%' : '']);
  setHud('10年の死亡リスク', '研究の調整後の差', 1);
  if (ph > 0.68) setTop('週1〜2日の人（2023年）', '14.9%低い', fade(t, d * 0.68, d, 0.25), GREEN);
  barCam();
  return S;
}
function sRisk2(t, d) { // 週3〜7日の人は、16.5%低かった
  reset(); lift(140); bars(3, ['基準', '−14.9%', t > d * 0.3 ? '−16.5%' : '']);
  setHud('10年の死亡リスク', '研究の調整後の差', 1);
  setTop('週3〜7日の人（2023年）', '16.5%低い', fade(t, d * 0.3, d, 0.25), GREEN);
  barCam();
  return S;
}
function sHobo(t, d) { // 毎日のように歩いた人と、ほとんど変わらない
  reset(); lift(140); bars(3, ['基準', '−14.9%', '−16.5%']);
  if (t > d * 0.3) say(hobo, t, d * 0.3, DX + 0.6, 2.35, 0.6, 1.0);
  setHud('10年の死亡リスク', '研究の調整後の差', 1);
  barCam();
  return S;
}
function sKekka(t, d) { // 結果：週2日の8,000歩で、10年の死亡リスクは14.9%低かった。毎日歩く人とほぼ同じだった
  reset(); lift(140); const x = CX + 60 + 0.5; walker(x, -0.6, Math.PI / 2 + 0.6, t);
  setTop('結果', '週2日で 14.9%低い', fade(t, 0.3, d, 0.25), GOLD); setHud('10年の死亡リスク', '研究の調整後の差', 1);
  const u = ease(clamp(t / d)); look(x + lerp(0.6, 0.2, u), lerp(1.8, 2.3, u), lerp(3.6, 5.0, u), x, 1.3, -1.0, 50);
  return S;
}
function sJiman(t, d) { // 毎日1万歩は、体のためというより、健康おじさんの、自慢のためだったのかもしれない
  reset(); lift(140); stand(OJI, -0.2, -1.2, 0.1); OJI.userData.arms[1].rotation.set(-1.9, 0, 0.3); CAL.userData.draw(1, WALK5);
  STEP.visible = true; STEP.position.set(0.25, 2.0, -1.0); STEP.userData.size(0.5);
  if (t > d * 0.45) say(jiman, t, d * 0.45, -0.1, 2.6, -1.2, 1.2);
  const u = ease(clamp(t / d)); look(lerp(0.3, 0.1, u), 1.8, lerp(3.2, 2.8, u), -0.1, 1.6, -1.2, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); ojiBase(); CAL.userData.draw(1, WALK5); STEP.visible = true; STEP.position.set(0.25, 1.55, -0.9); STEP.userData.size(0.55); calCam(0); return S; }

const NARR = { '毎日1万歩': 'まいにちいちまんぽ', '自慢': 'じまん', '健康おじさん': 'けんこうおじさん', '歩数計': 'ほすうけい', '見た': 'みた', '固まる': 'かたまる', '忙しい': 'いそがしい', '不満': 'ふまん', '毎日歩け': 'まいにちあるけ', '言われても': 'いわれても', '平日': 'へいじつ', '月曜から金曜': 'げつようからきんよう', '家と会社': 'いえとかいしゃ', '往復': 'おうふく', '土曜': 'どよう', '買い物': 'かいもの', '8,000歩': 'はっせんぽ', '日曜': 'にちよう', '公園': 'こうえん', '歩いて': 'あるいて', '週2日': 'しゅうふつか', '本当に': 'ほんとうに', '意味': 'いみ', '大人': 'おとな', '3,101人': 'さんぜんひゃくいちにん', '10年': 'じゅうねん', '追った': 'おった', '研究': 'けんきゅう', '8,000歩以上の日': 'はっせんぽいじょうのひ', '週0日': 'しゅうぜろにち', '比べて': 'くらべて', '週1〜2日': 'しゅういちからふつか', '死亡リスク': 'しぼうリスク', '14.9%': 'じゅうよんてんきゅうパーセント', '低かった': 'ひくかった', '週3〜7日': 'しゅうみっかからなのか', '16.5%': 'じゅうろくてんごパーセント', '歩いた': 'あるいた', '変わらない': 'かわらない', '結果：': '結果、', '歩く': 'あるく', '同じ': 'おなじ', '体のため': 'からだのため', '昨日': 'きのう', '何歩': 'なんぽ' };
const P = planTimes([
  ['毎日1万歩が自慢の<br>健康おじさんが、', (t, d) => sKatamaru(t, 2 * d)],
  ['歩数計を見たまま固まる。', (t, d) => sKatamaru(t + d, 2 * d)],
  ['忙しい人たちの不満から。', (t, d) => sFuman(t, 2 * d)],
  ['毎日歩けと言われても、<br>平日はムリ。', (t, d) => sFuman(t + d, 2 * d)],
  ['月曜から金曜。<br>家と会社の往復だけ。', sWeekday],
  ['土曜。買い物ついでに、<br>8,000歩。', sSat],
  ['日曜。公園まで歩いて、<br>8,000歩。', sSun],
  ['でも、週2日で、<br>本当に意味があるのか。', sImi],
  ['アメリカの大人3,101人を<br>10年追った研究がある。', sStudy],
  ['8,000歩以上の日が<br>週0日の人と比べて、', (t, d) => sRisk(t, 3 * d)],
  ['週1〜2日の人は、<br>10年の死亡リスクが', (t, d) => sRisk(t + d, 3 * d)],
  ['14.9%低かった。', (t, d) => sRisk(t + 2 * d, 3 * d)],
  ['週3〜7日の人は、<br>16.5%低かった。', sRisk2],
  ['毎日のように歩いた人と、<br>ほとんど変わらない。', sHobo],
  ['結果：週2日の8,000歩で、<br>10年の死亡リスクは', (t, d) => sKekka(t, 3 * d)],
  ['14.9%低かった。', (t, d) => sKekka(t + d, 3 * d)],
  ['毎日歩く人とほぼ同じだった。', (t, d) => sKekka(t + 2 * d, 3 * d)],
  ['毎日1万歩は、<br>体のためというより、', (t, d) => sJiman(t, 2 * d)],
  ['健康おじさんの、自慢のため<br>だったのかもしれない。', (t, d) => sJiman(t + d, 2 * d)],
  ['昨日、何歩歩いた？', sAsk],
], { shot0, endCard, start: 3.2, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0741',
    v2: true,
    tt: 'main',
    hookLine: 'カレンダーの7日のうち、5日がパッと 歩かない日 に変わる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも週2日だけ、8,000歩歩いたら？',
    titleHtml: 'もしも週2日だけ、<br>8,000歩<br>歩いたら？',
    mood: 'hopeful', seed: 741, hits: [TP, P.at(11, 0.1), P.at(12, 0.6), P.at(15)], risers: [P.at(7)], impacts: [P.at(8, 1.6), P.at(11, 0.1)],
    sfx: [[TP, 'whoosh'], [P.at(0, 0.6), 'meter', 0.2], [P.at(4, 0.6), 'whoosh'], [P.at(5, 0.5), 'bubble'], [P.at(6, 0.5), 'bubble'], [P.at(13, 0.4), 'alarm']],
    narr: NARR,
    ask: '昨日、何歩歩いた？',
    caption: 'もしも週2日だけ、8,000歩歩いたら？\n\n毎日1万歩が自慢の健康おじさんが、歩数計を見たまま固まる。\n忙しい人たちの不満から。毎日歩けと言われても、平日はムリ。\n月曜から金曜。家と会社の往復だけ。\n土曜。買い物ついでに、8,000歩。\n日曜。公園まで歩いて、8,000歩。\nでも、週2日で、本当に意味があるのか。\nアメリカの大人3,101人を10年追った研究がある（2023年・京都大学ほか）。\n8,000歩以上の日が週0日の人と比べて、週1〜2日の人は、10年の死亡リスクが14.9%低かった。\n週3〜7日の人は、16.5%低かった。\n毎日のように歩いた人と、ほとんど変わらない。\n\n結果：週2日の8,000歩で、10年の死亡リスクは14.9%低かった。毎日歩く人とほぼ同じだった。\n毎日1万歩は、体のためというより、健康おじさんの、自慢のためだったのかもしれない。\n\n昨日、何歩歩いた？ コメントで教えて。\n\n※数字は研究の調整後の差（観察研究）です。登場する人物は架空です\n出典：Inoue ほか JAMA Network Open 2023年（アメリカの成人3,101人・10年追跡。8,000歩以上の日が週0日と比べた10年の死亡リスクの差 週1〜2日 −14.9%・週3〜7日 −16.5%）',
    hashtags: ['もしもラボ', 'もしも', 'ウォーキング', '歩数', '人体の限界'],
    endStats: [['週1〜2日 8,000歩の人', '−14.9%', '10年の死亡リスク・調整後の差'], ['週3〜7日の人', '−16.5%', '2023年・JAMA Netw Open'], ['毎日1万歩の正体', '健康おじさんの自慢', 'かもしれない']],
    sources: '出典：Inoue ほか JAMA Network Open 2023（京都大学ほか）<br>※研究の調整後の差',
  },
});
