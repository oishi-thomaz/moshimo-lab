import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { makeMan, makeWoman, label, pop } from '../satire-kit.js';
import { makeSuit, makeSweat, makeDeskIsland, poseSit } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet, makeSteam } from '../scenes/home.js';

// もしも毎朝、最後の30秒を冷水シャワーにするのを1か月続けたら？（人体の限界・台本 S94）
// 2026/11/16 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/16 の解析の種（0671 湯船のバズの反対側のシャワー派）
// 数字（一次資料で確認・2026/11/17。DOAJ の抄録）：Buijze GA ほか PLoS One 2016 The Effect of Cold Showering on Health and Work: A Randomized Controlled Trial
//  オランダ・3,018人。温かいシャワーの最後に冷水30・60・90秒を30日。病気による欠勤が対照より29%少ない（IRR 0.71）、体調を崩した日数は差なし。重い有害事象なし
//  心臓に持病のある人・高齢者・寒い日の注意を札とキャプションで出す。裸の絵は出さない（肩から上・湯気）

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#d8e4ea', ground: '#9aa8b0' }); hemi.intensity = 1.3;
const KAISHA = makeMan({ shirt: '#9ab8d0', hair: '#2c2421' }); S.add(KAISHA); // 寒がりの会社員（肩から上で見せる）
const sweat = makeSweat(); KAISHA.userData.head.add(sweat);
const BLUE_FACE = box(0.41, 0.43, 0.39, new THREE.MeshBasicMaterial({ color: '#3a7fd0', transparent: true, opacity: 0, depthWrite: false })); BLUE_FACE.position.y = 0.24; KAISHA.userData.head.add(BLUE_FACE);
function blueFace(k) { BLUE_FACE.material.opacity = 0.45 * k; BLUE_FACE.visible = k > 0.01; }
const MOUTH = box(0.12, 0.08, 0.02, mat('#3a1a1a')); MOUTH.position.set(0, 0.12, 0.2); KAISHA.userData.head.add(MOUTH);

// ---------- A：シャワー室（原点） ----------
function tileTex() { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#e8f0f4'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#b8c8d0'; g.lineWidth = 4; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); t.colorSpace = THREE.SRGBColorSpace; return t; }
const WALL = new THREE.Mesh(new THREE.BoxGeometry(5, 3.2, 0.1), new THREE.MeshLambertMaterial({ map: tileTex() })); WALL.position.set(0, 1.6, -1.6); S.add(WALL);
const FLOOR = box(5, 0.1, 4, mat('#c8d4da')); FLOOR.position.set(0, -0.05, 0); S.add(FLOOR);
const PIPE = box(0.06, 1.0, 0.06, mat('#b8bec6')); PIPE.position.set(0, 2.2, -1.5); S.add(PIPE);
const HEAD = new THREE.Group(); { const arm = box(0.06, 0.06, 0.6, mat('#b8bec6')); arm.position.z = 0.3; HEAD.add(arm); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.08, 16), mat('#d8dde4')); h.position.set(0, -0.03, 0.6); HEAD.add(h); } HEAD.position.set(0, 2.7, -1.5); S.add(HEAD);
const DROPS = []; { for (let i = 0; i < 70; i++) { const d = box(0.02, 0.14, 0.02, new THREE.MeshBasicMaterial({ color: '#ffb080', transparent: true, opacity: 0.8 })); S.add(d); d.userData.o = [(i * 0.618 % 1 - 0.5) * 0.32, (i * 0.37) % 1, (i * 0.73 % 1 - 0.5) * 0.32]; DROPS.push(d); } }
function rain(t, k, cold) { DROPS.forEach(d => { d.visible = k > 0; const [x, ph, z] = d.userData.o; const u = (t * 2.2 + ph) % 1; d.position.set(x * (1 + u * 1.6), 2.6 - u * 2.4, -0.9 + z * (1 + u * 1.6)); d.material.color.set(cold ? '#4aa8f0' : '#ffb080'); }); }
const STEAM = makeSteam(16, { w: 1.4, d: 0.8, h: 1.6 }); STEAM.position.set(0, 1.0, -0.9); S.add(STEAM);
const reisui = label('最後の30秒 冷水', { w: 900, size: 100, color: '#fff', bg: 'rgba(40,120,220,.98)', sx: 1.2 }); S.add(reisui);
const hiee = label('ひっ…', { w: 384, size: 120, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.45 }); S.add(hiee);
const warui = label('冷水は 体に悪い', { w: 768, size: 110, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.0 }); S.add(warui);
const TIMER = label('0:30', { w: 512, size: 140, color: '#fff', bg: 'rgba(30,34,44,.96)', sx: 0.6 }); S.add(TIMER);
const sanpun = label('3分に 感じる', { w: 768, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.9 }); S.add(sanpun);
const shinkokyu = label('深呼吸 3回', { w: 768, size: 110, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.9 }); S.add(shinkokyu);

// ---------- B：朝の会社（x=60） ----------
const BX = 60;
room({ x: BX, w: 9, d: 7, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
const ISL = makeDeskIsland(2); ISL.position.set(BX, 0, -0.8); S.add(ISL);
const SUIT = makeSuit({ jacket: '#3a4256', tie: '#3a6ab2' }); S.add(SUIT);
const MASK = box(0.3, 0.16, 0.04, mat('#f4f4f2')); MASK.position.set(0, 0.14, 0.2); SUIT.userData.head.add(MASK);
const sweatS = makeSweat(); SUIT.userData.head.add(sweatS);
const shakitto = label('しゃきっ', { w: 512, size: 120, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 0.6 }); S.add(shakitto);
const sparkB = makeSparkles(70, 0.06, 0xffffff); S.add(sparkB.points); sparkB.init([[BX, 1.9, -0.8]], 0.4, 0.4);
const kaze = label('風邪でも 出社', { w: 768, size: 110, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.0 }); S.add(kaze);

// ---------- C：研究（x=120） ----------
const CX = 120;
flat(30, 20, '#3a3448', CX, -2);
const BACKC = box(16, 7, 0.2, mat('#2c2838')); BACKC.position.set(CX, 3.5, -10); S.add(BACKC);
const CROWD = []; { const r = rng(21); for (let i = 0; i < 48; i++) { const p = r() < 0.5 ? makeWoman({ shirt: ['#e05a4f', '#4fa3d1', '#f2c14e', '#8e6bbf', '#e9e4da'][i % 5], hair: ['#3a2620', '#6b4a33', '#c8a060'][i % 3] }) : makeMan({ shirt: ['#2f4a7a', '#3f8f6b', '#d97a3a', '#59606e', '#c94f7c'][i % 5], hair: ['#1d1a19', '#4a3426', '#c8a060'][i % 3] }); p.position.set(CX - 5.5 + (i % 8) * 1.55 + (r() - 0.5) * 0.3, 0, -1 - Math.floor(i / 8) * 1.5); p.rotation.y = (r() - 0.5) * 0.5; S.add(p); CROWD.push(p); } }
const BARS = []; [['お湯だけ', '#9aa0aa'], ['最後に冷水', '#4aa8f0']].forEach(([n, c]) => { const b = box(0.6, 1, 0.4, mat(c)); S.add(b); const l = label(n, { w: 512, size: 96, color: '#fff', bg: 'rgba(30,34,44,.92)', sx: 0.6 }); S.add(l); BARS.push({ b, l }); });
const BLAB = label('病気で休んだ日', { w: 900, size: 96, color: '#fff', bg: 'rgba(70,76,92,.96)', sx: 1.1 }); S.add(BLAB);
const jibyou = label('持病・高齢の人は 医師に相談', { w: 1100, size: 80, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 1.7 }); S.add(jibyou);
const switchL = label('気持ちの スイッチ', { w: 900, size: 100, color: '#fff', bg: 'rgba(40,120,220,.98)', sx: 1.2 }); S.add(switchL);
const SW = new THREE.Group(); { const p = box(0.5, 0.8, 0.06, mat('#f4f4f2')); SW.add(p); const k = box(0.18, 0.32, 0.08, mat('#d8dde4')); k.position.z = 0.06; SW.add(k); SW.userData.k = k; } S.add(SW);

const LABELS = [reisui, hiee, warui, TIMER, sanpun, shinkokyu, shakitto, kaze, BLAB, jibyou, switchL, ...BARS.map(x => x.l)];
function reset() {
  const p = KAISHA; p.userData.arms.forEach(a => a.rotation.set(0, 0, 0)); p.userData.legs.forEach(l => l.rotation.set(0, 0, 0)); p.userData.head.rotation.set(0, 0, 0); p.rotation.set(0, 0, 0); p.position.set(0, 0, -0.9); p.scale.set(1, 1, 1); p.visible = true;
  LABELS.forEach(l => l.visible = false); el.flash.style.opacity = 0; sweat.userData.set(0); sweatS.userData.set(0); blueFace(0); MOUTH.scale.set(1, 1, 1); STEAM.userData.set(0); rain(0, 0, false); sparkB.set(0);
  SUIT.visible = false; CROWD.forEach(c => c.visible = false); BARS.forEach(x => x.b.visible = false); SW.visible = false; MASK.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function showerCam(u = 0) { look(lerp(0.15, 0.1, u), 1.95, lerp(2.0, 1.8, u), 0, 2.05, -0.9, 50); }
function shot0(t) { // 0秒＝サムネ：熱いシャワーが、最後の30秒だけ冷水に変わって頭から降る
  reset(); lift(0); const cold = t > TP; rain(t, 1, cold); STEAM.userData.set(cold ? clamp(1 - (t - TP) / 0.6) : 1, t);
  if (cold) { blueFace(clamp((t - TP) / 0.3)); el.flash.style.opacity = t < TP + 0.08 ? 0.25 : 0; KAISHA.userData.head.rotation.x = -0.1; MOUTH.scale.set(1, 2.2, 1); say(reisui, t, TP, 0, 1.25, -0.4, 0.85); }
  showerCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sHimei(t, d) { // 寒がりの会社員が、悲鳴をのみこんで固まる
  reset(); lift(120); rain(t, 1, true); blueFace(0.8); KAISHA.userData.arms.forEach((a, i) => a.rotation.set(-0.6, 0, i ? 0.9 : -0.9)); KAISHA.position.x = Math.sin(t * 40) * 0.01;
  if (t > d * 0.3) say(hiee, t, d * 0.3, 0.45, 2.4, -0.8, 0.4); MOUTH.scale.set(1, t > d * 0.5 ? 0.4 : 2.2, 1);
  look(0.2, 1.9, 2.3, 0, 1.75, -0.9, 50);
  return S;
}
function sWarui(t, d) { // 本人の言い分から。冷水なんて、体に悪いに決まってる
  reset(); lift(120); STEAM.userData.set(1, t); rain(t, 1, false); KAISHA.userData.arms[1].rotation.set(-2.0, 0, 0.3);
  if (t > 0.4) say(warui, t, 0.4, 0, 2.45, -0.9, 0.85);
  look(0.2, 1.9, 2.3, 0, 1.75, -0.9, 50);
  return S;
}
function sSanpun(t, d) { // 1日目。30秒が、3分に感じる
  reset(); lift(120); rain(t, 1, true); blueFace(0.9); KAISHA.userData.arms.forEach((a, i) => a.rotation.set(-0.6, 0, i ? 0.9 : -0.9)); KAISHA.position.x = Math.sin(t * 40) * 0.012;
  const k = clamp(t / (d * 0.8)); const s0 = 30 - Math.floor(k * 3); TIMER.visible = true; TIMER.userData.set('0:' + String(s0).padStart(2, '0')); TIMER.position.set(0.42, 2.5, -1.4); TIMER.userData.size(0.45);
  if (t > d * 0.5) say(sanpun, t, d * 0.5, -0.4, 2.45, -0.9, 0.75);
  setHud('冷水シャワー', '1日目', 1);
  showerCam(0.5);
  return S;
}
function sShinkokyu(t, d) { // 1週間後。冷水の前に、深呼吸を3回する
  reset(); lift(120); STEAM.userData.set(1, t); rain(t, 1, false); const b = Math.max(0, Math.sin(t * 3)); KAISHA.scale.set(1 + b * 0.05, 1, 1 + b * 0.08); KAISHA.userData.head.rotation.x = -0.15 * b;
  if (t > d * 0.35) say(shinkokyu, t, d * 0.35, 0, 2.45, -0.9, 0.75);
  setHud('冷水シャワー', '1週間後', 1);
  showerCam(0.6);
  return S;
}
function deskSet(face = 0) { const st = ISL.userData.seats[1]; SUIT.visible = true; SUIT.position.set(BX + st.x, 0, -0.8 + st.z); SUIT.rotation.y = 0; poseSit(SUIT); SUIT.userData.arms.forEach(a => a.rotation.set(-1.2, 0, 0)); return st; }
function sShakitto(t, d) { // 1か月後。冷水を浴びたあと、なぜか目がしゃきっと覚める
  reset(); lift(120); KAISHA.visible = false; const st = deskSet(); sparkB.set(clamp((t - d * 0.4) / 0.6));
  if (t > d * 0.45) say(shakitto, t, d * 0.45, BX + st.x + 0.4, 2.1, -0.8 + st.z, 0.5);
  setHud('冷水シャワー', '1か月後', 1);
  look(BX + st.x + 0.4, 1.7, -0.8 + st.z + 2.2, BX + st.x, 1.3, -0.8 + st.z, 50);
  return S;
}
function sHontou(t, d) { // でも、本当に体にいいのか
  reset(); lift(120); rain(t, 1, true); blueFace(0.4);
  const u = ease(clamp(t / d)); look(lerp(0.2, 0.6, u), lerp(1.9, 2.3, u), lerp(2.3, 3.6, u), 0, 1.6, -0.9, 50);
  return S;
}
function crowdCam(u = 0) { look(CX + lerp(0.5, 0.0, u), lerp(4.2, 3.6, u), lerp(7.5, 6.5, u), CX, 0.8, -3.5, 50); }
function sStudy(t, d) { // オランダの約3,000人で確かめた研究がある
  reset(); lift(160); KAISHA.visible = false; CROWD.forEach((p, i) => { p.visible = t > 0.2 + (i % 8) * 0.06; });
  setTop('冷水シャワーの研究（2016年）', '約' + Math.round(3000 * easeOut(clamp((t - 0.3) / 1.4))).toLocaleString('ja-JP') + '人', fade(t, 0.3, d, 0.25), BLUE); setHud('オランダ・18〜65歳', 'くじで2組に', 1);
  crowdCam(ease(clamp(t / d)));
  return S;
}
function sJouken(t, d) { // 熱いシャワーの最後に、30〜90秒の冷水を30日
  reset(); lift(120); rain(t, 1, t > d * 0.35); STEAM.userData.set(t > d * 0.35 ? 0 : 1, t); blueFace(t > d * 0.35 ? 0.5 : 0);
  TIMER.visible = true; TIMER.userData.set(t > d * 0.35 ? '30〜90秒' : 'お湯'); TIMER.position.set(0.0, 2.55, -1.4); TIMER.userData.size(0.55);
  setHud('30日間', '毎朝', 1); say(jibyou, t, 0.3, 0, 1.3, -0.3, 0.8);
  showerCam(0.7);
  return S;
}
function barCam() { look(CX + 0.1, 1.3, 6.2, CX, 0.45, 0.6, 50); }
function bars(h1, h2) { [h1, h2].forEach((h, i) => { const x = BARS[i]; x.b.visible = true; x.b.scale.y = Math.max(0.01, h); x.b.position.set(CX - 0.55 + i * 1.1, h / 2, 0.6); x.l.visible = true; x.l.position.set(CX - 0.55 + i * 1.1, h + 0.25, 0.7); x.l.userData.size(0.5); }); }
function sYasumi(t, d) { // 病気で仕事を休んだ日は、29%少なかった
  reset(); lift(120); KAISHA.visible = false; const k = easeOut(clamp((t - 0.3) / 1.2)); bars(1.6, lerp(1.6, 1.6 * 0.71, k));
  BLAB.visible = true; BLAB.position.set(CX, 2.3, 0.6); BLAB.userData.set('病気で休んだ日'); BLAB.userData.size(0.9);
  setTop('冷水の組の 病気で休んだ日（2016年）', '−' + Math.round(29 * k) + '%', fade(t, 0.3, d, 0.25), GREEN); setHud('Buijze ほか', 'PLoS One 2016年', 1);
  barCam();
  return S;
}
function sKawaranai(t, d) { // でも、体調を崩した日の数は、変わらなかった
  reset(); lift(120); KAISHA.visible = false; bars(1.4, 1.4);
  BLAB.visible = true; BLAB.position.set(CX, 2.3, 0.6); BLAB.userData.set('体調を崩した日'); BLAB.userData.size(0.9);
  setTop('冷水の組の 体調を崩した日（2016年）', '差なし', fade(t, 0.3, d, 0.25), GOLD); setHud('Buijze ほか', 'PLoS One 2016年', 1);
  barCam();
  return S;
}
function sKekka(t, d) { // 結果：冷水シャワーで、風邪はひいていた。それでも、休まずに会社へ行けていた
  reset(); lift(120); KAISHA.visible = false; const st = deskSet(); MASK.visible = true; sweatS.userData.set(0.6, t);
  if (t > d * 0.5) say(kaze, t, d * 0.5, BX + st.x, 2.05, -0.8 + st.z, 0.75);
  setTop('結果', '休まず 出社できた', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(BX + st.x + lerp(0.4, 0.8, u), lerp(1.7, 2.0, u), -0.8 + st.z + lerp(2.8, 3.6, u), BX + st.x, 1.3, -0.8 + st.z, 50);
  return S;
}
function sSwitch(t, d) { // 冷水30秒は、体を強くするスイッチじゃなく、気持ちを先に起こすスイッチだったのかもしれない
  reset(); lift(120); rain(t, 1, true); blueFace(0.2); SW.visible = true; SW.position.set(-0.9, 1.6, -1.53); const k = clamp((t - d * 0.4) / 0.2); SW.userData.k.rotation.x = lerp(0.5, -0.5, k);
  if (k > 0.5) { say(switchL, t, d * 0.4 + 0.1, -0.3, 2.45, -1.0, 0.95); el.flash.style.opacity = t < d * 0.4 + 0.25 ? 0.15 : 0; }
  look(-0.2, 1.9, 2.4, -0.3, 1.7, -1.0, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); rain(t, 1, true); blueFace(1); MOUTH.scale.set(1, 2.2, 1); KAISHA.userData.head.rotation.x = -0.1; reisui.visible = true; reisui.position.set(0, 1.25, -0.4); reisui.userData.size(0.85); showerCam(0); return S; }

const NARR = { '寒がり': 'さむがり', '会社員': 'かいしゃいん', '悲鳴': 'ひめい', '固まる': 'かたまる', '本人': 'ほんにん', '言い分': 'いいぶん', '冷水': 'れいすい', '体': 'からだ', '悪い': 'わるい', '決まってる': 'きまってる', '1日目': 'いちにちめ', '30秒': 'さんじゅうびょう', '3分': 'さんぷん', '感じる': 'かんじる', '1週間後': 'いっしゅうかんご', '深呼吸': 'しんこきゅう', '3回': 'さんかい', '1か月後': 'いっかげつご', '浴びた': 'あびた', '目': 'め', '覚める': 'さめる', '本当に': 'ほんとうに', '約3,000人': 'やくさんぜんにん', '確かめた': 'たしかめた', '研究': 'けんきゅう', '熱い': 'あつい', '最後': 'さいご', '30〜90秒': 'さんじゅうからきゅうじゅうびょう', '30日': 'さんじゅうにち', '病気': 'びょうき', '仕事': 'しごと', '休んだ日': 'やすんだひ', '29%': '29パーセント', '少なかった': 'すくなかった', '体調': 'たいちょう', '崩した日': 'くずしたひ', '数': 'かず', '変わらなかった': 'かわらなかった', '結果：': '結果、', '風邪': 'かぜ', '休まずに': 'やすまずに', '会社': 'かいしゃ', '行けていた': 'いけていた', '強くする': 'つよくする', '気持ち': 'きもち', '先に': 'さきに', '起こす': 'おこす', '何秒': 'なんびょう' };
const P = planTimes([
  ['寒がりの会社員が、<br>悲鳴をのみこんで固まる。', sHimei],
  ['本人の言い分から。冷水なんて、<br>体に悪いに決まってる。', sWarui],
  ['1日目。30秒が、<br>3分に感じる。', sSanpun],
  ['1週間後。冷水の前に、<br>深呼吸を3回する。', sShinkokyu],
  ['1か月後。冷水を浴びたあと、<br>なぜか目がしゃきっと覚める。', sShakitto],
  ['でも、本当に体にいいのか。', sHontou],
  ['オランダの約3,000人で<br>確かめた研究がある。', sStudy],
  ['熱いシャワーの最後に、<br>30〜90秒の冷水を30日。', sJouken],
  ['病気で仕事を休んだ日は、<br>29%少なかった。', sYasumi],
  ['でも、体調を崩した日の数は、<br>変わらなかった。', sKawaranai],
  ['結果：冷水シャワーで、<br>風邪はひいていた。', (t, d) => sKekka(t, 2 * d)],
  ['それでも、休まずに<br>会社へ行けていた。', (t, d) => sKekka(t + d, 2 * d)],
  ['冷水30秒は、体を強くする<br>スイッチじゃなく、', (t, d) => sSwitch(t, 2 * d)],
  ['気持ちを先に起こすスイッチ<br>だったのかもしれない。', (t, d) => sSwitch(t + d, 2 * d)],
  ['冷水シャワー、<br>何秒いける？', sAsk],
], { shot0, endCard, start: 3.4, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0697',
    v2: true,
    tt: 'main',
    hookLine: '熱いシャワーが、最後の30秒だけ冷水に変わって頭から降る。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも毎朝、最後の30秒を冷水シャワーにするのを1か月続けたら？',
    titleHtml: 'もしも毎朝、<br>最後の30秒を冷水<br>シャワーにするのを<br>1か月続けたら？',
    mood: 'hopeful', seed: 697, hits: [TP, P.at(10), P.at(13)], risers: [P.at(5)], impacts: [P.at(6, 1.0), P.at(8, 0.4), P.at(9, 0.4)],
    sfx: [[0.05, 'bubble'], [TP, 'alarm'], [P.at(2, 0.4), 'meter', 0.4], [P.at(4, 1.0), 'poof'], [P.at(13, 0.3), 'whoosh']],
    narr: NARR,
    ask: '冷水シャワー、何秒いける？',
    caption: 'もしも毎朝、最後の30秒を冷水シャワーにするのを1か月続けたら？\n\n寒がりの会社員が、悲鳴をのみこんで固まる。\n本人の言い分から。冷水なんて、体に悪いに決まってる。\n1日目。30秒が、3分に感じる。\n1週間後。冷水の前に、深呼吸を3回する。\n1か月後。冷水を浴びたあと、なぜか目がしゃきっと覚める。\nでも、本当に体にいいのか。\nオランダの約3,000人で確かめた研究がある。\n熱いシャワーの最後に、30〜90秒の冷水を30日。\n病気で仕事を休んだ日は、29%少なかった。\nでも、体調を崩した日の数は、変わらなかった。\n\n結果：冷水シャワーで、風邪はひいていた。それでも、休まずに会社へ行けていた。\n冷水30秒は、体を強くするスイッチじゃなく、気持ちを先に起こすスイッチだったのかもしれない。\n\n※心臓に持病のある人・高齢の人は、試す前に医師に相談を。寒い日は無理をしないで。\n\n冷水シャワー、何秒いける？ コメントで教えて。\n\n出典：Buijze ほか PLoS One（2016年）オランダ 3,018人のランダム化比較試験（病気による欠勤 −29%、体調を崩した日数は差なし）',
    hashtags: ['もしもラボ', 'もしも', '冷水シャワー', '朝活', '人体の限界'],
    endStats: [['冷水シャワーの研究', '約3,000人', 'オランダ・2016年'], ['病気で休んだ日', '−29%', '冷水30〜90秒・30日'], ['体調を崩した日', '差なし', '同じ研究']],
    sources: '出典：Buijze ほか PLoS One（2016年）',
  },
});
