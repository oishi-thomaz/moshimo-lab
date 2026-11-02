import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeWoman, makeMan, label, pop, makeRoom, makePhone } from '../satire-kit.js';

// もしも年収条件が自分にも来たら？（皮肉回・台本 S02）
// 2026/11/02 ゆうと承認。元ネタ：ガルちゃん「35歳で年収700万の男を希望するのは高望みじゃないはず」
// 数字：年収700万円超の女性は約6.3%（女性2,229.4万人のうち140.3万人）。男性は約26.8%
//  国税庁「令和7年分 民間給与実態統計調査」第16表（2026年9月29日公表）

const GOLD = '#ffd27a', PINK = '#ff7ab8', RED = '#ff5a5a', BLUE = '#7fd4ff', GREEN = '#9be86a';

const S = new THREE.Scene();
S.background = new THREE.Color('#2a2232'); S.fog = new THREE.Fog(0x2a2232, 40, 160);
const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3040, 1.1); S.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(8, 18, 12); S.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat('#2a2632', { depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.renderOrder = -0.9; S.add(ground);

// ---------- 部屋（原点）：婚活中の女性と大きなスマホ ----------
const room = makeRoom({ w: 10, d: 8, wall: '#f3e6ef', floor: '#c9a27a' }); room.userData.rw.visible = false; S.add(room);
const HER = makeWoman({ shirt: '#f2a0b8', hair: '#3a2620' }); HER.position.set(-1.0, 0, 0.8); HER.rotation.y = 0.4; S.add(HER);
const big = makePhone({ w: 2.6, h: 5.2 }); big.g.position.set(1.0, 2.8, -0.4); big.g.rotation.y = -0.3; S.add(big.g);
const glow = new THREE.PointLight(0xffd0e8, 10, 8, 1.5); glow.position.set(0.5, 2.8, 1.4); S.add(glow);
function form(mode, t = 0) {
  big.draw(mode + Math.floor(t * 3), (g, w, h) => {
    g.fillStyle = '#fff4f8'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff5f9e'; g.fillRect(0, 0, w, 120);
    g.fillStyle = '#fff'; g.font = '900 50px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('プロフィール', w / 2, 62);
    const row = (y, a, b, col = '#333', bg = '#ffffff') => { g.fillStyle = bg; g.fillRect(30, y, w - 60, 130); g.fillStyle = '#888'; g.font = '700 34px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText(a, 56, y + 40); g.fillStyle = col; g.font = '900 54px "Noto Sans CJK JP", sans-serif'; g.fillText(b, 56, y + 92); };
    const wish = mode === 'a' || mode === 'a0' || mode === 'err' ? '700万円以上' : mode === 'b' ? ['600万円以上', '500万円以上', 'こだわりません'][Math.min(2, Math.floor(t * 1.1))] : 'こだわりません';
    row(170, '相手に求める年収', wish, mode === 'err' ? '#d23a3a' : '#333');
    if (mode !== 'a0') row(330, 'あなたの年収', mode === 'a' ? '' : '320万円', '#333', mode === 'err' ? '#ffe4e4' : '#ffffff');
    if (mode === 'err') { g.fillStyle = '#d23a3a'; g.fillRect(30, 520, w - 60, 150); g.fillStyle = '#fff'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('エラー', w / 2, 570); g.font = '700 32px "Noto Sans CJK JP", sans-serif'; g.fillText('自分の年収が足りません', w / 2, 630); }
    g.fillStyle = mode === 'err' ? '#bbb' : '#ff3b6b'; g.fillRect(60, h - 190, w - 120, 120); g.fillStyle = '#fff'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.fillText('保存する', w / 2, h - 130);
  });
}
const errFx = makeSparkles(200, 0.25, 0xff5a5a); S.add(errFx.points); errFx.init([[1.0, 2.8, -0.2]], 1.6, 2);

// ---------- 大勢の書き換え（x=50）：女性たちが一斉にスマホ ----------
const MX = 50;
const mfloor = new THREE.Mesh(new THREE.CircleGeometry(9, 40), mat('#3a3044', { depthWrite: false })); mfloor.rotation.x = -Math.PI / 2; mfloor.position.set(MX, 0.02, 0); mfloor.renderOrder = -0.8; S.add(mfloor);
const CROWD = []; const PH = [];
{ const r = rng(30); for (let i = 0; i < 15; i++) { const p = makeWoman({ shirt: ['#f2a0b8', '#c9a8d8', '#9fc7a8', '#e9e4da', '#9fc7e8'][i % 5], hair: ['#3a2620', '#1d1a19', '#6b4a33'][i % 3] }); p.position.set(MX - 2.9 + (i % 5) * 1.45 + (Math.floor(i / 5) % 2) * 0.72 - 0.36, 0, -2.4 + Math.floor(i / 5) * 2.4); p.rotation.y = (r() - .5) * 0.6; p.userData.arms[1].rotation.x = -1.3; p.userData.head.rotation.x = 0.35; S.add(p); CROWD.push(p);
  const ph = makePhone({ w: 0.3, h: 0.6, cw: 180, ch: 360 }); S.add(ph.g); PH.push(ph); } }
const NUMS = ['700万', '600万', '500万', 'こだわらない'];
const numLabs = CROWD.map((p, i) => { const l = label('700万', { w: 360, h: 150, size: 100, color: '#fff', bg: 'rgba(40,40,50,.88)', sx: 0.62 }); S.add(l); return l; });

// ---------- 結婚相談所（x=100） ----------
const KX = 100;
const kroom = makeRoom({ w: 9, d: 7, wall: '#e6e8ee', floor: '#b8a890' }); kroom.position.set(KX, 0, 0); kroom.userData.rw.visible = false; S.add(kroom);
const kdesk = box(2.6, 0.8, 1.2, mat('#ffffff')); kdesk.position.set(KX, 0.4, -0.4); S.add(kdesk);
const COUN = makeWoman({ shirt: '#4f6a8f', hair: '#6a5a50' }); COUN.position.set(KX, 0, -1.6); S.add(COUN);
const CLIENT = makeWoman({ shirt: '#f2a0b8', hair: '#3a2620' }); CLIENT.position.set(KX, 0, 0.9); CLIENT.rotation.y = Math.PI; S.add(CLIENT);
const unazuki = label('その条件なら、すぐ会えますよ', { w: 1024, size: 70, color: '#fff', bg: 'rgba(60,150,90,.92)', sx: 2.6 }); S.add(unazuki);

// ---------- 年収の高い女性と申し込み（x=150） ----------
const HX = 150;
const hfloor = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#2a2640', { depthWrite: false })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(HX, 0.02, 0); hfloor.renderOrder = -0.8; S.add(hfloor);
const RICH = makeWoman({ shirt: '#2b3346', hair: '#1d1a19' }); RICH.position.set(HX, 0, 0); S.add(RICH);
const bag = box(0.4, 0.3, 0.12, mat('#7a5a3a')); bag.position.set(HX + 0.4, 0.9, 0.2); S.add(bag);
const MEN = []; { for (let i = 0; i < 8; i++) { const p = makeMan({ shirt: ['#4f6a8f', '#59606e', '#ffffff', '#6b7a5a'][i % 4], hair: ['#1d1a19', '#3a2620'][i % 2] }); S.add(p); MEN.push(p); } }
const MAILS = []; for (let i = 0; i < 14; i++) { const m = box(0.36, 0.24, 0.02, mat('#ff9ec7')); S.add(m); MAILS.push(m); }
const satto = label('申し込み 殺到', { w: 1024, size: 100, color: '#fff', bg: 'rgba(255,95,158,.92)', sx: 2.4 }); satto.position.set(HX, 3.0, 0.2); S.add(satto);
const manPhone = makePhone({ w: 2.4, h: 4.8 }); manPhone.g.position.set(HX + 40, 2.8, -0.4); S.add(manPhone.g);
const MAN1 = makeMan({ shirt: '#59606e' }); MAN1.position.set(HX + 38.2, 0, 0.8); MAN1.rotation.y = 0.4; S.add(MAN1);
function manForm() { manPhone.draw('m', (g, w, h) => { g.fillStyle = '#f0f6ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#3f7fd0'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff'; g.font = '900 50px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('男性の希望条件', w / 2, 62);
  g.fillStyle = '#fff'; g.fillRect(30, 170, w - 60, 140); g.fillStyle = '#888'; g.font = '700 34px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.fillText('相手に求める年収', 56, 210); g.fillStyle = '#333'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.fillText('600万円以上', 56, 270); }); }
// 結果：プロフィールの掲示板
const BX = 240;
const bwall = box(9, 5, 0.2, mat('#3a3448')); bwall.position.set(BX, 2.5, -2); S.add(bwall);
const CARDS = []; for (let i = 0; i < 6; i++) { const l = label(['こだわりません', '普通の人', '優しい人', 'こだわりません', 'こだわりません', '普通の人'][i], { w: 768, size: 96, color: '#333', bg: 'rgba(255,255,255,.95)', sx: 1.7 }); l.position.set(BX - 1.2 + (i % 2) * 2.4, 4.5 - Math.floor(i / 2) * 1.0, -1.8); S.add(l); CARDS.push(l); }
const normal = label('普通の人でいい', { w: 1024, size: 110, color: '#fff', bg: 'rgba(30,110,170,.95)', sx: 3.2 }); normal.position.set(BX, 5.45, -1.6); S.add(normal);

function reset() {
  form('a', 0); errFx.set(0); HER.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); HER.userData.head.rotation.set(0, 0, 0); HER.userData.arms[1].rotation.x = -1.2;
  numLabs.forEach(l => l.visible = false); PH.forEach(p => p.g.visible = false); unazuki.visible = false; satto.visible = false; MAILS.forEach(m => m.visible = false); MEN.forEach(p => p.position.set(HX, -50, 0));
  CARDS.forEach(c => c.visible = false); normal.visible = false;
  hemi.intensity = 1.1; S.background.set('#2a2232'); el.flash.style.opacity = 0; setHud('', '', 0);
}
const TP = 0.5;
function roomCam(t, d = 0) { look(lerp(0.4, 0.2, d), lerp(3.4, 3.5, d), lerp(6.6, 7.2, d), 0.3, 3.3, -0.2, 54); }
function shot0(t) { // 0秒＝サムネ：希望年収700万の入力。0.5秒で「あなたの年収」の欄が出る
  reset(); lift(60); form(t < TP ? 'a0' : 'a', t); const k = t - TP; el.flash.style.opacity = k > 0 ? 0.3 * Math.max(0, 1 - k / 0.25) : 0;
  roomCam(t, ease(clamp(t / 3.2)));
  return S;
}
function shot1(t) { // 婚活に新ルール。求める年収は、自分も稼ぐこと
  reset(); lift(60); form('a', t); roomCam(t, 1);
  setTop('婚活の新ルール', '自分も稼ぐ', fade(t, 0.15, 3.2, 0.25), GOLD);
  return S;
}
function shot2(t) { // 希望年収700万円。保存しようとすると、エラー
  reset(); lift(60); form(t < 1.2 ? 'a' : 'err', t); errFx.set(t > 1.2 ? clamp((t - 1.2) / 1.5) : 0); if (t > 1.2 && t < 1.4) el.flash.style.opacity = 0.25;
  HER.userData.head.rotation.x = t > 1.4 ? -0.2 : 0;
  look(1.0, 2.9, 5.8, 1.0, 2.8, -0.4, 52);
  return S;
}
function shot3(t) { // 年収700万円を超える女性は、約6%しかいない
  reset(); lift(110); CROWD.forEach((p, i) => { p.visible = true; p.userData.arms[1].rotation.x = -1.3; });
  CROWD.forEach((p, i) => { const on = i === 7; numLabs[i].visible = on && t > 0.6; if (on) { numLabs[i].userData.set('700万超'); numLabs[i].userData.size(1.1); numLabs[i].position.set(p.position.x, 2.7, p.position.z); } });
  look(MX, 7, 10, MX, 0.8, 0, 50);
  setTop('年収700万円を超える女性（2025年）', '約6.3%', fade(t, 0.15, 3.3, 0.25), PINK);
  return S;
}
function phonesUp(t) { CROWD.forEach((p, i) => { p.updateMatrixWorld(true); const v = new THREE.Vector3(0, -0.62, 0.1); p.userData.arms[1].localToWorld(v); PH[i].g.visible = true; PH[i].g.position.copy(v); PH[i].g.rotation.set(-0.6, p.rotation.y, 0); PH[i].draw('x', (g, w, h) => { g.fillStyle = '#ff9ec7'; g.fillRect(0, 0, w, h); }); }); }
function shot4(t) { // 一晩で、希望年収の欄が一斉に書き換わる
  reset(); lift(110); phonesUp(t);
  CROWD.forEach((p, i) => { numLabs[i].visible = true; numLabs[i].userData.size(0.62); numLabs[i].position.set(p.position.x, 2.45, p.position.z); const k = Math.min(3, Math.floor(clamp((t - 0.4 - (i % 5) * 0.12) / 2.6) * 3.99)); numLabs[i].userData.set(NUMS[Math.max(0, k)] + (k < 3 ? '' : '')); });
  look(MX, 5.4, 11.8, MX, 1.4, 0, 50);
  return S;
}
function shot5(t) { // 700万が600万、500万、そして、こだわりません
  reset(); lift(60); form('b', t); HER.userData.arms[1].rotation.x = -1.3 + Math.sin(t * 8) * 0.08;
  look(1.0, 2.9, 5.8, 1.0, 2.8, -0.4, 52);
  return S;
}
function shot6(t) { // 結婚相談所のカウンセラーが、初めて大きくうなずく
  reset(); lift(110); hemi.intensity = 1.2; S.background.set('#e6e8ee'); COUN.userData.head.rotation.x = Math.max(0, Math.sin(t * 5)) * 0.45;
  unazuki.position.set(KX, 2.6, -1.4); pop(unazuki, t, 0.8, 0.35, 1.9);
  look(KX + 1.4, 2.4, 4.2, KX, 1.6, -1.0, 52);
  return S;
}
function shot7(t) { // 一方、年収の高い女性には、申し込みが殺到する
  reset(); lift(110); S.background.set('#1a1830');
  MEN.forEach((p, i) => { const a = i / 8 * Math.PI * 2; const r = lerp(6, 2.2, ease(clamp(t / 2.2))); p.position.set(HX + Math.cos(a) * r, 0, Math.sin(a) * r); p.lookAt(HX, 0, 0); const s = Math.sin(t * 8 + i) * 0.5; p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s; p.userData.arms[1].rotation.x = -1.5; });
  MAILS.forEach((m, i) => { const u = ((t * 0.35 + i / 14) % 1); m.visible = true; const a = i * 2.4; m.position.set(HX + Math.cos(a) * 3 * (1 - u), 1.5 + Math.sin(u * Math.PI) * 1.5, Math.sin(a) * 3 * (1 - u)); m.rotation.y = a; });
  pop(satto, t, 0.8, 0.35, 2.2);
  look(HX + 0.6, 4.2, 8, HX, 1.2, 0, 50);
  setTop('年収の高い女性', '申し込み殺到', fade(t, 0.15, 3.5, 0.25), PINK);
  return S;
}
function shot8(t) { // 今度は男性が、女性の年収で選び始める
  reset(); lift(110); S.background.set('#1a1830');
  MEN.forEach((p, i) => { p.position.set(HX - 4 + i * 1.1, 0, 2.2); p.rotation.y = Math.PI; p.userData.arms[1].rotation.x = -1.3; p.userData.head.rotation.x = 0.3; });
  look(HX, 3.2, 7.6, HX, 1.4, 1.0, 50);
  setTop('男性の選び方', '女性の年収で選ぶ', fade(t, 0.15, 3.5, 0.25), BLUE);
  return S;
}
function shot9(t) { // 男性の希望欄にも、年収600万以上の文字
  reset(); lift(60); manForm(); MAN1.userData.arms[1].rotation.x = -1.2;
  look(HX + 41, 2.9, 5.8, HX + 40, 2.8, -0.4, 52);
  return S;
}
function shot10(t) { // 高望みと言われていた条件は、自分に返った瞬間に消えた
  reset(); lift(110); phonesUp(t); CROWD.forEach((p, i) => { numLabs[i].visible = true; numLabs[i].userData.size(0.62); numLabs[i].position.set(p.position.x, 2.45, p.position.z); numLabs[i].userData.set('こだわらない'); });
  const u = ease(clamp(t / 3.6)); look(MX + lerp(-1, 1, u), 5.4, 11.8, MX, 1.4, 0, 50);
  setTop('高望みの条件', '一晩で消えた', fade(t, 0.15, 3.5, 0.25), GOLD);
  return S;
}
function shot11(t) { // プロフィールの年収欄は、どんどん空白になる
  reset(); lift(60); form('c', t); HER.userData.head.rotation.x = 0.15;
  look(1.0, 2.9, 5.8, 1.0, 2.8, -0.4, 52);
  setTop('年収の欄', 'こだわりません', fade(t, 0.15, 3.5, 0.25), GREEN);
  return S;
}
function shot12(t) { // 結果：婚活市場から、高望みが消えた
  reset(); lift(80); CARDS.forEach((c, i) => { pop(c, t, 0.2 + i * 0.18, 0.25, 1.9); });
  const u = ease(clamp(t / 6)); look(BX, 3.0, lerp(8.0, 7.4, u), BX, 3.0, -1.8, 52);
  setTop('結果', '高望みが消えた', fade(t, 0.15, 5.8, 0.25), GOLD);
  return S;
}
function shot13(t) { // 普通の人でいい、という言葉が初めて本当の意味で使われる
  reset(); lift(80); CARDS.forEach(c => { c.visible = true; c.userData.size(1.9); }); pop(normal, t, 0.5, 0.35, 2.4);
  look(BX, 3.4, 8.4, BX, 3.4, -1.8, 52);
  setTop('婚活の合言葉', '普通の人でいい', fade(t, 0.3, 5.8, 0.25), BLUE);
  return S;
}
function shot14(t) { // 質問。最後は冒頭と同じ構図（希望年収は「こだわりません」のまま）
  reset(); lift(60); form('c', 0);
  roomCam(0, 0);
  return S;
}

const SUBS = [
  [3.2, 6.5, '婚活に新ルール。<br>求めた年収は、自分も稼ぐ。'],
  [6.6, 9.9, '希望年収700万円。<br>保存しようとすると、エラー。'],
  [10.0, 13.4, '年収700万円を超える女性は、<br>約6%しかいない。'],
  [13.5, 17.0, '一晩で、希望年収の欄が<br>一斉に書き換わる。'],
  [17.1, 20.6, '700万が500万、<br>そして、こだわりません。'],
  [20.7, 24.2, '結婚相談所のカウンセラーが、<br>初めて大きくうなずく。'],
  [24.3, 27.9, '一方、年収の高い女性には、<br>申し込みが殺到する。'],
  [28.0, 31.6, '今度は男性が、<br>女性の年収で選び始める。'],
  [31.7, 35.3, '男性の希望欄にも、<br>年収600万以上の文字。'],
  [35.4, 39.0, '高望みと言われた条件は、<br>自分に返った瞬間に消えた。'],
  [39.1, 42.8, 'プロフィールの年収欄は、<br>こだわりませんだらけ。'],
  [42.9, 48.8, '結果：婚活市場から、<br>高望みが消えた。'],
  [48.9, 55.0, '普通の人でいいという言葉が、<br>初めて本当の意味で使われる。'],
  [55.1, 61.3, '相手に求める年収、<br>自分も稼ぐべき？'],
];
const shots = [
  { a: 0, b: 3.2, f: shot0 }, { a: 3.2, b: 6.6, f: shot1 }, { a: 6.6, b: 10.0, f: shot2 }, { a: 10.0, b: 13.5, f: shot3 },
  { a: 13.5, b: 17.1, f: shot4 }, { a: 17.1, b: 20.7, f: shot5 }, { a: 20.7, b: 24.3, f: shot6 }, { a: 24.3, b: 28.0, f: shot7 },
  { a: 28.0, b: 31.7, f: shot8 }, { a: 31.7, b: 35.4, f: shot9 }, { a: 35.4, b: 39.1, f: shot10 }, { a: 39.1, b: 42.9, f: shot11 },
  { a: 42.9, b: 48.9, f: shot12 }, { a: 48.9, b: 55.1, f: shot13 }, { a: 55.1, b: 61.6, f: shot14 }, { a: 61.6, b: 65.6, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 65.6, camera: cam,
  meta: {
    id: '0630',
    v2: true,
    hookLine: '求める年収は、自分も稼ぐこと。',
    series: '',  // 消えたら回ではないのでバッジなし（皮肉回の柱名は未定）
    hookType: 'H2',
    cat: 'お金・経済',
    title: 'もしも年収条件が自分にも来たら？',
    titleHtml: 'もしも年収条件が<br>自分にも来たら？',
    mood: 'mystery', seed: 630, hits: [0.5, 42.9, 48.9], risers: [39.1], impacts: [6.6, 10.0, 13.5, 24.3, 28.0, 35.4, 42.9, 48.9],
    sfx: [[0.5, 'bubble'], [7.8, 'alarm'], [10.4, 'buzz'], [14.0, 'whoosh'], [24.8, 'bubble'], [32.0, 'buzz'], [49.2, 'whoosh']],
    narr: { '700万円': 'ななひゃくまんえん', '700万': 'ななひゃくまん', '600万': 'ろっぴゃくまん', '500万': 'ごひゃくまん', '約6%': 'やくろくパーセント', '結果：': '結果、' },
    ask: '相手に求める年収、自分も稼ぐべき？',
    caption: 'もしも婚活で、相手に求める年収を自分も稼がないといけなかったら？\n\n希望年収700万円。保存しようとすると、エラー。年収700万円を超える女性は約6%しかいない。\n一晩で希望年収の欄が一斉に書き換わる。700万が600万、500万、そして、こだわりません。\n一方、年収の高い女性には申し込みが殺到。今度は男性が女性の年収で選び始める。\n\n結果：婚活市場から、高望みが消えた。\n普通の人でいい、という言葉が初めて本当の意味で使われる。\n\n相手に求める年収、自分も稼ぐべき？ コメントで教えて。\n\n※風刺ネタです\n出典：国税庁「令和7年分 民間給与実態統計調査」（年収700万円超の女性 約6.3%・男性 約26.8%）',
    hashtags: ['もしもラボ', 'もしも', '婚活', '年収', '高望み'],
    endStats: [['年収700万円超の女性', '約6.3%', '国税庁 2025年分'], ['年収700万円超の男性', '約26.8%', '同上'], ['婚活市場', '高望みが消えた', 'かもしれない']],
    sources: '出典：国税庁「令和7年分 民間給与実態統計調査」第16表',
  },
});
