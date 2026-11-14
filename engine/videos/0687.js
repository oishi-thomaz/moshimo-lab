import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, fade, mat, box } from '../lib.js';
import { cam, lift, look, runStory, endCard, makeSparkles, setTop, setHud, el } from '../story.js';
import { label, pop } from '../satire-kit.js';
import { makeMeetingRoom, makeDeskIsland, makeSuit, poseClear, poseSit, makeSweat, TABLE_Y } from '../scenes/office.js';
import { planTimes } from '../scenes/fitness.js';
import { makeSet } from '../scenes/home.js';

// もしも1か月コーヒーをやめたら？（人体の限界・台本 S82）
// 2026/11/14 ゆうと承認（投稿サーバーで ok）。元ネタ：2026/11/12 の解析の種（1か月やめたら の型の3本目）
// 数字（一次資料で確認・2026/11/14。PubMed の抄録）：Juliano LM, Griffiths RR. Psychopharmacology 2004;176(1):1-29（カフェイン離脱のレビュー）
//  実験研究で頭痛の出た割合 50%／症状はやめて12〜24時間で始まり、20〜51時間でピーク、2〜9日続く
//  棒グラフの形は上の範囲を絵にしたイメージ（画面に イメージ と出す）。体調の変化には個人差 と出す

const GOLD = '#ffd27a', RED = '#ff8a7a', GREEN = '#9be86a', BLUE = '#7fc8ff';
const { S, flat, room, hemi } = makeSet({ bg: '#c8d0dc', ground: '#8a8f99' }); hemi.intensity = 1.3;
const ME = makeSuit({ jacket: '#3a4256', tie: '#8a5a32' }); S.add(ME); // コーヒーがないと仕事にならない会社員
const sweatM = makeSweat(); ME.userData.head.add(sweatM);
const LIDS = [-1, 1].map(s => { const l = box(0.075, 0.05, 0.02, mat('#f1c9a5')); l.position.set(s * 0.085, 0.3, 0.2); ME.userData.head.add(l); return l; }); // まぶた
function lids(k) { LIDS.forEach(l => { l.scale.y = 0.2 + k * 1.8; l.position.y = 0.32 - k * 0.04; l.visible = k > 0.02; }); }
const MUG = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.22, 18, 1, true), new THREE.MeshLambertMaterial({ color: '#f4f4f2', side: THREE.DoubleSide })); c.position.y = 0.11; MUG.add(c); const b = new THREE.Mesh(new THREE.CircleGeometry(0.1, 18), mat('#f4f4f2')); b.rotation.x = -Math.PI / 2; b.position.y = 0.005; MUG.add(b); const h = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 12, Math.PI), mat('#f4f4f2')); h.rotation.z = -Math.PI / 2; h.position.set(0.11, 0.11, 0); MUG.add(h); }
const COFFEE = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.095, 0.18, 18), mat('#4a2a18')); MUG.add(COFFEE);
function coffee(k) { COFFEE.visible = k > 0.01; COFFEE.scale.y = Math.max(0.01, k); COFFEE.position.y = 0.01 + 0.09 * k; }
const STEAM = makeSparkles(40, 0.08, 0xffffff); S.add(STEAM.points);

// ---------- A：オフィスの机（原点） ----------
const roomA = room({ x: 0, w: 9, d: 6, h: 3.2, wall: '#e6e9ee', floor: '#7d8798' });
for (let i = 0; i < 3; i++) { const w = box(1.8, 1.2, 0.05, new THREE.MeshBasicMaterial({ color: '#9fc6e8' })); w.position.set(-3 + i * 3, 2.0, -2.9); S.add(w); }
const DESK = box(1.5, 0.06, 0.8, mat('#e8e4dc')); DESK.position.set(0, TABLE_Y, -0.9); S.add(DESK);
const DLEG = box(1.4, TABLE_Y, 0.05, mat('#9aa0aa')); DLEG.position.set(0, TABLE_Y / 2, -1.25); S.add(DLEG);
const MON = box(0.62, 0.4, 0.04, mat('#22252c')); MON.position.set(-0.3, TABLE_Y + 0.28, -1.15); S.add(MON);
S.add(MUG);
const sparkA = makeSparkles(120, 0.1, 0xfff2c0); S.add(sparkA.points);
const nidomi = label('！？', { w: 384, h: 192, size: 140, color: '#222', bg: 'rgba(255,255,255,.95)', sx: 0.38 }); S.add(nidomi);
const asa = label('朝の1杯がないと 頭が起きない', { w: 1100, size: 88, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 1.6 }); S.add(asa);
const iraira = label('イラッ', { w: 384, size: 120, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.5 }); S.add(iraira);
const hitokoto = label('これ、急ぎで', { w: 640, size: 100, color: '#2a1a00', bg: 'rgba(255,255,255,.96)', sx: 0.75 }); S.add(hitokoto);
const COL = makeSuit({ woman: true, jacket: '#5a4a6a', hair: '#3a2620' }); S.add(COL);
const shakkin = label('昨日のコーヒーの 借金返し', { w: 1100, size: 88, color: '#fff', bg: 'rgba(110,70,40,.97)', sx: 1.6 }); S.add(shakkin);
const heiki = label('コーヒーなしで 平気', { w: 900, size: 100, color: '#fff', bg: 'rgba(60,140,90,.96)', sx: 1.3 }); S.add(heiki);

// ---------- B：会議室（x=60） ----------
const BX = 60;
const MR = makeMeetingRoom(); MR.position.set(BX, 0, 0); S.add(MR);
const MEET = [0, 1].map(i => { const p = makeSuit({ woman: i === 1, jacket: ['#56504a', '#5a4a6a'][i], hair: i === 1 ? '#3a2620' : undefined }); S.add(p); return p; });
const zzz = label('Zzz', { w: 384, size: 120, color: '#fff', bg: 'rgba(90,138,232,.96)', sx: 0.45 }); S.add(zzz);

// ---------- C：頭痛（オフィスを使う）：ズキズキ ----------
const zuki = label('ズキズキ', { w: 512, size: 110, color: '#fff', bg: 'rgba(214,30,40,.98)', sx: 0.65 }); S.add(zuki);
const PAIN = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.34, 24), new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, depthWrite: false })); S.add(PAIN);

// ---------- D：グラフ（x=120） ----------
const DX = 120;
flat(14, 10, '#2a3040', DX, 0);
const dwall = box(14, 6, 0.2, mat('#323a4e')); dwall.position.set(DX, 3, -2.4); S.add(dwall);
const BASE = box(4.0, 0.06, 0.6, mat('#9aa0aa')); BASE.position.set(DX, 1.2, -1.0); S.add(BASE);
const DAYS = 10; const SHAPE = [0.05, 0.75, 1.0, 0.8, 0.55, 0.35, 0.22, 0.12, 0.05, 0.0]; // 0日〜9日（イメージ）
const BARS = SHAPE.map((h, i) => { const b = box(0.28, 1, 0.4, new THREE.MeshLambertMaterial({ color: '#ff6a5a' })); b.position.set(DX - 1.71 + i * 0.38, 1.2, -1.0); S.add(b); return b; });
const DLAB = SHAPE.map((h, i) => { const l = label(i === 0 ? 'やめた日' : i + '日', { w: 384, size: 90, color: '#fff', sx: 0.42 }); l.position.set(DX - 1.71 + i * 0.38, 1.0, -0.7); S.add(l); return l; });
const image = label('イメージ', { w: 384, size: 90, color: '#2a1a00', bg: 'rgba(255,255,255,.95)', sx: 0.55 }); image.position.set(DX + 1.2, 3.4, -1.0); S.add(image);
const kojin = label('個人差あり', { w: 512, size: 90, color: '#2a1a00', bg: 'rgba(255,210,122,.97)', sx: 0.7 }); kojin.position.set(DX - 1.0, 3.4, -1.0); S.add(kojin);
const PEOPLE2 = [0, 1].map(i => { const p = makeSuit({ woman: i === 1, jacket: ['#3a4256', '#5a4a6a'][i], hair: i === 1 ? '#3a2620' : undefined }); S.add(p); return p; });
const RING2 = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.34, 24), new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, depthWrite: false })); S.add(RING2);

const LABELS = [nidomi, asa, iraira, hitokoto, shakkin, heiki, zzz, zuki, ...DLAB, image, kojin];
function reset() {
  [ME, COL, ...MEET, ...PEOPLE2].forEach(p => { poseClear(p); p.rotation.set(0, 0, 0); p.visible = false; });
  LABELS.forEach(l => l.visible = false); sparkA.set(0); STEAM.set(0); el.flash.style.opacity = 0; sweatM.userData.set(0); lids(0);
  ME.visible = true; ME.position.set(0.1, 0, -1.65); poseSit(ME); ME.userData.arms.forEach(a => a.rotation.set(-0.9, 0, 0));
  MUG.visible = true; MUG.position.set(0.45, TABLE_Y + 0.03, -0.75); coffee(1);
  BARS.forEach(b => b.visible = false); PAIN.visible = false; RING2.visible = false;
}
function say(l, t, t0, x, y, z, sx) { l.position.set(x, y, z); pop(l, t, t0, 0.25, sx); }
const TP = 0.3;
function deskCam(u = 0) { look(lerp(0.55, 0.5, u), lerp(1.75, 1.7, u), lerp(0.75, 0.6, u), 0.3, lerp(1.3, 1.28, u), -1.2, 50); }
function shot0(t) { // 0秒＝サムネ：机のマグカップのコーヒーが、パッと空になる
  reset(); lift(0); const k = clamp((t - TP) / 0.2); coffee(1 - k);
  if (t < TP) { STEAM.init([[0.45, TABLE_Y + 0.35, -0.75]], 0.1, 0.4); STEAM.set(0.4 + t); }
  if (t >= TP) { sparkA.init([[0.45, TABLE_Y + 0.3, -0.75]], 0.2, 0.6); sparkA.set(clamp((t - TP) / 1.0)); el.flash.style.opacity = t < TP + 0.1 ? 0.25 : 0; }
  ME.userData.arms[1].rotation.set(-1.25, 0, -0.35);
  deskCam(ease(clamp(t / 3)) * 0.3);
  return S;
}
function sNidomi(t, d) { // コーヒーがないと仕事にならない会社員が、空のマグを二度見
  reset(); lift(120); coffee(0); const n = (t > 0.4 && t < 0.8) || t > 1.3; ME.userData.head.rotation.y = n ? -0.55 : 0; ME.userData.arms[1].rotation.set(-1.25, 0, -0.35); ME.userData.head.rotation.x = n ? 0.3 : 0;
  if (t > 1.3) say(nidomi, t, 1.3, 0.35, 1.8, -1.65, 0.32);
  look(0.6, 1.6, 0.9, 0.25, 1.2, -1.3, 50);
  return S;
}
function sIibun(t, d) { // 本人の言い分から。朝の1杯がないと、頭が起きない
  reset(); lift(120); coffee(0); ME.userData.arms[1].rotation.set(-2.2, 0, 0.3); lids(0.5);
  if (t > 0.4) say(asa, t, 0.4, 0.15, 1.95, -1.5, 1.05);
  look(0.3, 1.65, 1.2, 0.1, 1.35, -1.5, 50);
  return S;
}
function sMeet(t, d) { // 1日目の午後。会議中、まぶたが勝手に閉じる
  reset(); lift(120); MUG.visible = false; const st = MR.userData.seats;
  ME.position.set(BX + st[2].x, 0, st[2].z); ME.rotation.y = st[2].ry; poseSit(ME);
  MEET.forEach((p, i) => { const s = st[[0, 4][i]]; p.visible = true; p.position.set(BX + s.x, 0, s.z); p.rotation.y = s.ry; poseSit(p); });
  MR.userData.board.set(['午後の会議']);
  const k = clamp((t - 0.3) / (d * 0.5)); lids(k); ME.userData.head.rotation.x = k * 0.45 + Math.sin(t * 2) * 0.05 * k;
  if (t > d * 0.55) say(zzz, t, d * 0.55, ME.position.x + 0.3, 1.85, ME.position.z, 0.4);
  setHud('コーヒーをやめて', '1日目の午後', 1);
  ME.updateMatrixWorld(); const f = new THREE.Vector3(1.0, 0, 2.7); ME.localToWorld(f);
  look(f.x, 1.85, f.z, ME.position.x, 1.15, ME.position.z, 50);
  return S;
}
function sZuki(t, d) { // 2日目。頭の奥が、ズキズキ痛む
  reset(); lift(120); coffee(0); ME.userData.arms.forEach((a, i) => a.rotation.set(-2.6, 0, i ? 0.55 : -0.55)); ME.userData.head.rotation.x = 0.25; sweatM.userData.set(1, t);
  PAIN.visible = true; const pulse = 0.5 + 0.5 * Math.sin(t * 9); ME.updateMatrixWorld(); const v = new THREE.Vector3(0, 1.85, 0.3); ME.localToWorld(v); PAIN.position.copy(v); PAIN.scale.setScalar(1 + pulse * 0.4); PAIN.material.opacity = 0.4 + 0.6 * pulse; PAIN.lookAt(cam.position);
  if (t > d * 0.35) say(zuki, t, d * 0.35, 0.65, 2.0, -1.5, 0.55);
  setHud('コーヒーをやめて', '2日目', 1);
  look(0.45, 1.7, 0.9, 0.15, 1.45, -1.6, 50);
  return S;
}
function sIra(t, d) { // 3日目。同僚の一言に、なぜかイライラ
  reset(); lift(120); coffee(0); COL.visible = true; COL.position.set(1.0, 0, -1.2); COL.rotation.y = -1.2; COL.userData.arms[1].rotation.set(-1.3, 0, 0);
  ME.userData.head.rotation.y = -0.6; say(hitokoto, t, 0.3, 0.75, 2.0, -1.2, 0.55);
  if (t > d * 0.45) { say(iraira, t, d * 0.45, 0.0, 1.95, -1.6, 0.45); ME.userData.head.rotation.x = -0.1 + Math.sin(t * 30) * 0.03; }
  setHud('コーヒーをやめて', '3日目', 1);
  look(0.6, 1.65, 1.5, 0.5, 1.3, -1.4, 50);
  return S;
}
function graphCam(u = 0) { look(DX + lerp(0.3, 0, u), 2.4, lerp(7.9, 7.5, u), DX, 2.1, -1.0, 50); }
function bars(n, hi = -1) { BARS.forEach((b, i) => { b.visible = i < n; const h = Math.max(0.03, SHAPE[i] * 1.9); b.scale.y = h; b.position.y = 1.23 + h / 2; b.material.color.set(i === hi ? '#ffd27a' : '#ff6a5a'); }); DLAB.forEach((l, i) => { l.visible = i < n; l.userData.size(0.42); }); }
function sSign(t, d) { // でもこれは、体がカフェインに慣れきっていたサイン
  reset(); lift(330); ME.visible = false; MUG.visible = false; bars(Math.min(DAYS, Math.floor(clamp(t / (d * 0.7)) * DAYS) + 1));
  image.visible = true; image.userData.size(0.55); kojin.visible = true; kojin.userData.size(0.7);
  setHud('カフェイン離脱', 'イメージ', 1);
  graphCam(ease(clamp(t / d)));
  return S;
}
function sData(i) {
  return (t, d) => {
    reset(); lift(330); ME.visible = false; MUG.visible = false; image.visible = true; image.userData.size(0.55); kojin.visible = true; kojin.userData.size(0.7);
    if (i === 0) { bars(DAYS, 1); setTop('症状が出始める（2004年のレビュー）', 'やめて12〜24時間', fade(t, 0.3, d, 0.25), GOLD); }
    if (i === 1) { bars(DAYS);  setTop('頭痛が出た人（実験研究）', '2人に1人（50%）', fade(t, 0.3, d, 0.25), RED); }
    if (i === 2) { bars(DAYS, 2); setTop('いちばんつらい時（2004年のレビュー）', '20〜51時間後', fade(t, 0.3, d, 0.25), RED); }
    if (i === 3) { bars(DAYS, 9); setTop('症状が続くのは（2004年のレビュー）', '2〜9日', fade(t, 0.3, d, 0.25), GREEN); }
    setHud('Juliano ほか', '2004年', 1);
    graphCam(1);
    return S;
  };
}
function sKekka(t, d) { // 結果：コーヒーがないと仕事にならない は、最初の9日だけだった
  reset(); lift(120); coffee(0); ME.userData.head.rotation.x = -0.1; ME.userData.arms.forEach(a => a.rotation.set(-1.0 - 0.15 * Math.sin(t * 10), 0, 0));
  if (t > d * 0.55) say(heiki, t, d * 0.55, 0.1, 2.05, -1.5, 1.2);
  setTop('結果', '最初の9日だけ', fade(t, 0.3, d, 0.25), GOLD);
  const u = ease(clamp(t / d)); look(lerp(0.5, 0.9, u), lerp(1.7, 1.9, u), lerp(1.0, 1.6, u), 0.2, 1.3, -1.3, 50);
  return S;
}
function sShakkin(t, d) { // 朝の1杯は目覚ましじゃなく、昨日のコーヒーの借金返しだったのかもしれない
  reset(); lift(120); coffee(1); STEAM.init([[0.45, TABLE_Y + 0.35, -0.75]], 0.1, 0.4); STEAM.set((t * 0.3) % 1);
  if (t > d * 0.5) say(shakkin, t, d * 0.5, 0.35, 1.75, -1.0, 1.25);
  look(0.6, 1.4, 0.3, 0.42, 1.0, -0.8, 50);
  return S;
}
function sAsk(t) { reset(); lift(0); coffee(0); ME.userData.arms[1].rotation.set(-1.25, 0, -0.35); deskCam(0); return S; }

const NARR = { '会社員': 'かいしゃいん', '二度見': 'にどみ', '本人': 'ほんにん', '言い分': 'いいぶん', '朝の1杯': 'あさのいっぱい', '1日目': 'いちにちめ', '午後': 'ごご', '会議中': 'かいぎちゅう', '2日目': 'ふつかめ', '頭の奥': 'あたまのおく', '3日目': 'みっかめ', '同僚': 'どうりょう', '一言': 'ひとこと', '12〜24時間': 'じゅうにからにじゅうよじかん', '頭痛': 'ずつう', '2人に1人': 'ふたりにひとり', '20〜51時間後': 'にじゅうからごじゅういちじかんご', '2〜9日': 'ふつかからここのか', '結果：': '結果、', '最初の9日': 'さいしょのここのか', '目覚まし': 'めざまし', '昨日': 'きのう', '借金返し': 'しゃっきんがえし', '1日何杯': 'いちにちなんばい' };
const P = planTimes([
  ['コーヒーがないと<br>仕事にならない会社員が、', (t, d) => sNidomi(t, 2 * d)],
  ['空のマグを二度見。', (t, d) => sNidomi(t + d, 2 * d)],
  ['本人の言い分から。朝の1杯が<br>ないと、頭が起きない。', sIibun],
  ['1日目の午後。会議中、<br>まぶたが勝手に閉じる。', sMeet],
  ['2日目。頭の奥が、<br>ズキズキ痛む。', sZuki],
  ['3日目。同僚の一言に、<br>なぜかイライラ。', sIra],
  ['でもこれは、体がカフェインに<br>慣れきっていたサイン。', sSign],
  ['研究では、やめて12〜24時間で<br>症状が出始める。', sData(0)],
  ['頭痛が出たのは、<br>およそ2人に1人。', sData(1)],
  ['いちばんつらいのは、<br>20〜51時間後。', sData(2)],
  ['そして2〜9日で、<br>おさまっていった。', sData(3)],
  ['結果：コーヒーがないと<br>仕事にならない は、', (t, d) => sKekka(t, 2 * d)],
  ['最初の9日だけだった。', (t, d) => sKekka(t + d, 2 * d)],
  ['朝の1杯は目覚ましじゃなく、', (t, d) => sShakkin(t, 2 * d)],
  ['昨日のコーヒーの借金返し<br>だったのかもしれない。', (t, d) => sShakkin(t + d, 2 * d)],
  ['コーヒー、<br>1日何杯飲んでる？', sAsk],
], { shot0, endCard, start: 2.8, end: 61.6, narr: NARR });

runStory({
  shots: P.shots, subs: P.subs, duration: 65.0, camera: cam,
  meta: {
    id: '0687',
    v2: true,
    tt: 'main',
    hookLine: '机のマグカップのコーヒーが、パッと空になる。',
    series: '人体の限界',
    hookType: 'H2',
    cat: '体・健康',
    title: 'もしも1か月コーヒーをやめたら？',
    titleHtml: 'もしも1か月<br>コーヒーを<br>やめたら？',
    mood: 'hopeful', seed: 687, hits: [TP, P.at(11), P.at(14)], risers: [P.at(6)], impacts: [P.at(7, 0.3), P.at(8, 0.3), P.at(9, 0.3), P.at(10, 0.3)],
    sfx: [[TP, 'poof'], [P.at(1, 0.3), 'whoosh'], [P.at(3, 1.5), 'drone'], [P.at(4, 0.4), 'meter', 0.4], [P.at(5, 1.2), 'alarm']],
    narr: NARR,
    ask: 'コーヒー、1日何杯飲んでる？',
    caption: 'もしも1か月コーヒーをやめたら？\n\nコーヒーがないと仕事にならない会社員が、空のマグを二度見。\n本人の言い分から。朝の1杯がないと、頭が起きない。\n1日目の午後。会議中、まぶたが勝手に閉じる。\n2日目。頭の奥が、ズキズキ痛む。\n3日目。同僚の一言に、なぜかイライラ。\nでもこれは、体がカフェインに慣れきっていたサイン。\n研究では、やめて12〜24時間で症状が出始める。\n頭痛が出たのは、およそ2人に1人。\nいちばんつらいのは、20〜51時間後。\nそして2〜9日で、おさまっていった（体調の変化には個人差があります）。\n\n結果：コーヒーがないと仕事にならない は、最初の9日だけだった。\n朝の1杯は目覚ましじゃなく、昨日のコーヒーの借金返しだったのかもしれない。\n\nコーヒー、1日何杯飲んでる？ コメントで教えて。\n\n出典：Juliano・Griffiths Psychopharmacology（2004年）カフェイン離脱のレビュー',
    hashtags: ['もしもラボ', 'もしも', 'コーヒー', 'カフェイン', '人体の限界'],
    endStats: [['症状が出始める', 'やめて12〜24時間', '2004年のレビュー'], ['頭痛が出た人', '2人に1人', '実験研究'], ['症状が続くのは', '2〜9日', '個人差あり']],
    sources: '出典：Juliano・Griffiths Psychopharmacology（2004年）',
  },
});
