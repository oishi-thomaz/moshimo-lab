import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #067 不適切にもほどがある！（ドラマ・日本・2024年・TBS 金曜ドラマ・全10話。U-NEXT・Netflix・Prime Video・Hulu・Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/bu-shi-qie-nimohodogaaru で2026/11/10確認。Filmarks 4.1・レビュー41,215件 filmarks.com/dramas/14376/19611）
// 確かめた事実（ja.wikipedia.org/wiki/不適切にもほどがある!。2026/11/10）：
//   ・2024年1月26日〜3月29日、TBS系 金曜ドラマ。脚本は宮藤官九郎のオリジナル、主演は阿部サダヲ。最終回は第10話
//   ・主人公は1986年の中学の体育教師で野球部の顧問。スパルタ教育と荒々しい言動。妻に先立たれ、高校2年の娘と暮らすシングルファーザー
//   ・学校帰りに乗った路線バスが、38年後の2024年にタイムスリップ。2024年でスマートフォンに出会う。バスは自動操縦のタイムマシン
//   ・2024年の居酒屋で隣の客の会話から、言動への意識が1986年よりかなり厳しくなっていることを知る
//   ・彼の言動は令和ではコンプライアンスにひっかかる不適切なものばかり。だがそれが「本当に大切なことは何なのか」を令和の人々へ問いかけていく
//   ・注意を喚起する注釈テロップが1話につき何度も入る。毎回終盤にミュージカルシーン
//   ・略称「ふてほど」が2024 ユーキャン新語・流行語大賞の年間大賞
// 構成（ヒント6段）：1 帰りのバスを降りたら、みんな光る板をのぞきこんでいる → 2 口が悪くて厳しい体育教師、娘と2人暮らし
//   → 3 居酒屋の隣の客は言っちゃダメなことの話、どこもルールだらけ → 4 38年をバスで行ったり来たり、彼の言葉が今の人に問いかける
//   → 5 1986年と2024年を行き来する、2024年の日本のドラマ・全10話のコメディ → 6 決め手：毎回の注意書きとミュージカル、略した4文字がその年の流行語大賞
// 人物名・学校名・店の名前・地名・テロップの文言そのものは出さない。結末は言わない。俳優の顔・ロゴ・有名な場面の構図は使わない。たばこは出さない。人は汎用の3D

const S = quizStage({ bg: '#1c2030', floor: '#2a2e36', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(6767);

const TEACH = { skin: '#e8b98f', hair: '#1a1614', shirt: '#c8302a', pants: '#c8302a' }; // 赤いジャージ
const DAUGHTER = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#2a2e48', pants: '#2a2e48', long: true, skirt: true };
const NOW = (i) => ({ skin: ['#f1c9a5', '#f5d3b5', '#e8b98f'][i % 3], hair: ['#1d1a19', '#6b4a33', '#2c2421', '#9a8a70'][i % 4], shirt: ['#e9e4da', '#4fa3d1', '#59606e', '#8e6bbf', '#3f8f6b'][i % 5], pants: ['#2b3346', '#6b7a8f', '#3b3f4a'][i % 3], long: i % 2 === 1, skirt: i % 4 === 1 });

function makeBus() { const g = new THREE.Group(); const body = box(2.4, 2.4, 8, mat('#e8e4d8')); body.position.y = 1.5; g.add(body); const band = box(2.44, 0.5, 8.02, mat('#3a7ad8')); band.position.y = 0.9; g.add(band);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const w = box(0.02, 0.8, 1.0, mat('#2a3a48')); w.position.set(s * 1.21, 2.0, -3 + i * 1.2); g.add(w); }
  const fw = box(2.2, 1.0, 0.02, mat('#2a3a48')); fw.position.set(0, 2.0, 4.01); g.add(fw);
  for (const s of [-1, 1]) for (const z of [-2.8, 2.8]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16), mat('#1a1a1a')); wh.rotation.z = Math.PI / 2; wh.position.set(s * 1.15, 0.45, z); g.add(wh); }
  return g; }
function phoneGlow() { const p = box(0.12, 0.2, 0.02, new THREE.MeshBasicMaterial({ color: '#d8f0ff' })); return p; }

// ---------- 1段目. 夜のバス停（x=0）。バスを降りた男。まわりの人はみんな光る板を見ている ----------
{ const road = box(16, 0.04, 30, mat('#3a3c42')); road.position.set(-3.5, 0.02, -8); qs.add(road);
  const walk = box(5, 0.14, 30, mat('#8a8680')); walk.position.set(3, 0.07, -8); qs.add(walk);
  for (let i = 0; i < 6; i++) { const w = 4, h = 8 + R() * 10; const wt = windowTextures(800 + i, ['#4a5468', '#5a6274'][i % 2]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.6 })); b.position.set(8, h / 2, 2 - i * 5); qs.add(b); }
  const pole = box(0.08, 2.4, 0.08, mat('#8a8e98')); pole.position.set(0.3, 1.2, -1.6); qs.add(pole);
  const sign = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), mat('#3a7ad8')); sign.position.set(0.3, 2.5, -1.55); qs.add(sign); }
const BUS1 = makeBus(); BUS1.position.set(-0.4, 0, -3.5); qs.add(BUS1);
const teach1 = makePerson(TEACH); teach1.position.set(1.4, 0.14, -0.6); qs.add(teach1);
const CROWD = []; for (let i = 0; i < 6; i++) { const p = makePerson(NOW(i)); p.position.set(2.6 + (i % 3) * 0.9, 0.14, -0.2 - Math.floor(i / 3) * 1.6); p.rotation.y = -0.4 + (i % 3) * 0.3; p.userData.arms[1].rotation.x = -1.3; p.userData.head.rotation.x = 0.45; const ph = phoneGlow(); ph.position.set(0.32, 1.0, 0.35); ph.rotation.x = -0.6; p.add(ph); qs.add(p); CROWD.push(p); }
const tBus = tag('バスを降りたら', { size: 66, w: 520, bg: '#14161c', sx: 2.2 }); tBus.position.set(1.9, 2.75, 0.4); qs.add(tBus);
const tPanel = tag('みんな、光る板を見ている', { size: 54, w: 720, bg: '#3a7ad8', sx: 2.8 }); tPanel.position.set(2.3, 2.75, 0.4); qs.add(tPanel);

// ---------- 2段目. 中学の校庭（x=40）。赤いジャージの体育教師と、長いスカートの娘 ----------
const AX = 40;
{ const gr = box(24, 0.06, 20, mat('#b89a70')); gr.position.set(AX, 0.03, -4); qs.add(gr);
  const sch = box(16, 6, 3, mat('#e0dccc')); sch.position.set(AX, 3, -12); qs.add(sch);
  for (let f = 0; f < 3; f++) for (let i = 0; i < 10; i++) { const w = box(1.0, 0.9, 0.05, mat('#7a9ab8')); w.position.set(AX - 6.8 + i * 1.5, 1.2 + f * 1.8, -10.47); qs.add(w); }
  const net = box(0.1, 3, 0.1, mat('#5a5a5a')); net.position.set(AX - 6, 1.5, -6); qs.add(net); }
const teach2 = makePerson(TEACH); teach2.position.set(AX - 0.4, 0, -0.4); qs.add(teach2);
const WHISTLE = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 10), mat('#d8d8dc')); WHISTLE.rotation.z = Math.PI / 2; qs.add(WHISTLE);
const STU = []; for (let i = 0; i < 5; i++) { const p = makePerson({ skin: '#f1c9a5', hair: '#1d1a19', shirt: '#f4f4f0', pants: '#2a2e48' }); p.scale.setScalar(0.85); p.position.set(AX - 2.6 + i * 1.3, 0, -4); qs.add(p); STU.push(p); }
const girl2 = makePerson(DAUGHTER); girl2.position.set(AX + 1.3, 0, -0.8); girl2.rotation.y = -0.5; qs.add(girl2);
{ const sk = box(0.54, 0.7, 0.36, mat('#2a2e48')); sk.position.set(0, 0.42, 0); girl2.add(sk); } // くるぶしまでの長いスカート
const tStrict = tag('厳しすぎる体育教師', { size: 60, w: 640, bg: '#14161c', sx: 2.5 }); tStrict.position.set(AX + 0.2, 2.8, -0.2); qs.add(tStrict);
const tDad = tag('娘と2人暮らし', { size: 68, w: 520, bg: '#e6b450', color: '#14161c', sx: 2.2 }); tDad.position.set(AX + 0.4, 2.8, -0.2); qs.add(tDad);

// ---------- 3段目. 居酒屋のカウンター（x=80）。隣の客たちの話は、言っちゃダメなことばかり ----------
const BX = 80;
{ const fl = box(14, 0.04, 10, mat('#4a3426')); fl.position.set(BX, 0.02, -1); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#6a4a32')); wl.position.set(BX, 3, -3.4); qs.add(wl);
  const ctr = box(7, 0.12, 0.9, mat('#c89a62')); ctr.position.set(BX, 1.05, -1.4); qs.add(ctr);
  const cf = box(7, 1.0, 0.1, mat('#7a5232')); cf.position.set(BX, 0.5, -0.98); qs.add(cf);
  for (let i = 0; i < 4; i++) { const ln = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshBasicMaterial({ color: '#e2483c' })); ln.scale.y = 1.3; ln.position.set(BX - 2.6 + i * 1.75, 3.2, -2.6); qs.add(ln); }
  for (let i = 0; i < 8; i++) { const m = box(0.7, 0.4, 0.02, mat('#f4ead0')); m.position.set(BX - 3 + i * 0.85, 2.2, -3.28); qs.add(m); }
  for (let i = 0; i < 5; i++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.2, 10), new THREE.MeshPhongMaterial({ color: '#f2c14e', transparent: true, opacity: 0.85 })); j.position.set(BX - 2 + i * 1.0, 1.21, -1.3); qs.add(j); } }
const teach3 = makePerson({ ...TEACH, shirt: '#5a4a3a', pants: '#3a3a40' }); teach3.position.set(BX - 2.4, 0, -0.4); qs.add(teach3);
const GUESTS = []; for (let i = 0; i < 3; i++) { const p = makePerson(NOW(i + 1)); p.position.set(BX - 0.6 + i * 1.0, 0, -0.4); qs.add(p); GUESTS.push(p); }
const BUBBLES = []; for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 58, 52, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(50, 100); g.lineTo(60, 124); g.lineTo(78, 102); g.fill(); g.strokeStyle = '#e2483c'; g.lineWidth = 14; g.beginPath(); g.moveTo(38, 32); g.lineTo(90, 84); g.moveTo(90, 32); g.lineTo(38, 84); g.stroke(); }), transparent: true, depthWrite: false })); b.position.set(BX - 0.6 + i * 1.0, 2.35, -0.3); qs.add(b); BUBBLES.push(b); }
const tTalk = tag('言っちゃダメなこと', { size: 62, w: 600, bg: '#14161c', sx: 1.8 }); tTalk.position.set(BX - 1.0, 2.75, -0.2); qs.add(tTalk);
const tRules = tag('どこもルールだらけ', { size: 62, w: 600, bg: '#e2483c', sx: 1.8 }); tRules.position.set(BX - 1.0, 2.95, -0.2); qs.add(tRules);

// ---------- 4段目. 2つの時代の道（x=120）。左は古いセピアの街、右は今の街。そのあいだをバスが行ったり来たり ----------
const CX = 120;
{ const rd = box(30, 0.04, 4, mat('#3a3c42')); rd.position.set(CX, 0.02, -1); qs.add(rd);
  const old = box(15, 0.03, 16, mat('#a08a68')); old.position.set(CX - 7.5, 0.01, -6); qs.add(old);
  const nw = box(15, 0.03, 16, mat('#7a8290')); nw.position.set(CX + 7.5, 0.01, -6); qs.add(nw);
  for (let i = 0; i < 5; i++) { const h = 2 + R() * 1.5; const sh = box(2.2, h, 2, mat(['#a07850', '#b08a60', '#8a6a48'][i % 3])); sh.position.set(CX - 13 + i * 2.6, h / 2, -5); qs.add(sh); const rf = box(2.5, 0.25, 2.3, mat('#5a4030')); rf.position.set(sh.position.x, h + 0.12, -5); qs.add(rf); }
  for (let i = 0; i < 5; i++) { const w = 2.4, h = 6 + R() * 6; const wt = windowTextures(900 + i, '#6a7284'); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.3 })); b.position.set(CX + 2.5 + i * 2.7, h / 2, -5.5); qs.add(b); } }
const BUS4 = makeBus(); BUS4.rotation.y = Math.PI / 2; BUS4.scale.setScalar(0.9); BUS4.position.set(CX, 0, -0.6); qs.add(BUS4);
const tYears = tag('38年を、行ったり来たり', { size: 58, w: 720, bg: '#14161c', sx: 3.4 }); tYears.position.set(CX, 3.6, 0.6); qs.add(tYears);
const tAsk = tag('大切なことを、問いかける', { size: 56, w: 740, bg: '#3f8f6b', sx: 3.4 }); tAsk.position.set(CX, 3.6, 0.6); qs.add(tAsk);

// ---------- 5段目. テレビの前（x=160）。1986年と2024年、日本のドラマ、全10話のコメディ ----------
const TX = 160;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e2230' })); bg.position.set(TX, 4, -3); qs.add(bg);
  const fr = box(4.7, 2.8, 0.1, mat('#141418')); fr.position.set(TX, 2.6, -1.88); qs.add(fr); const st = box(1.2, 0.08, 0.5, mat('#141418')); st.position.set(TX, 1.2, -1.8); qs.add(st); }
const TV = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(512, 290, (g, w, h) => { g.fillStyle = '#c89a62'; g.fillRect(0, 0, w / 2, h); g.fillStyle = '#5a7ab0'; g.fillRect(w / 2, 0, w / 2, h); g.fillStyle = '#ffffff'; g.font = '900 64px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1986', w / 4, h / 2); g.fillText('2024', w * 3 / 4, h / 2); g.font = '900 60px "Noto Sans CJK JP", sans-serif'; g.fillText('⇄', w / 2, h / 2); }) })); TV.position.set(TX, 2.6, -1.8); qs.add(TV);
const tJP = tag('2024年 日本のドラマ', { size: 62, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.2 }); tJP.position.set(TX, 4.6, -1.2); qs.add(tJP);
const t10 = tag('全10話のコメディ', { size: 64, w: 600, bg: '#e2483c', sx: 3.0 }); t10.position.set(TX, 4.6, -1.2); qs.add(t10);

// ---------- 6段目. 舞台（x=200）。画面の下に注意書きの帯。急に始まるミュージカル。4文字の札 ----------
const DX = 200;
{ const st = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.2, 0.4, 40), mat('#3a2a4a')); st.position.set(DX, 0.2, -1.5); qs.add(st);
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), new THREE.MeshBasicMaterial({ color: '#1a1028' })); bk.position.set(DX, 4, -6); qs.add(bk); }
const DANCE = []; for (let i = 0; i < 5; i++) { const p = makePerson(i === 2 ? TEACH : NOW(i)); p.position.set(DX - 2 + i, 0.4, -1.5 - Math.abs(i - 2) * 0.3); qs.add(p); DANCE.push(p); }
const NOTES = []; for (let i = 0; i < 6; i++) { const n = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#e6b450'; g.font = '900 56px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', w / 2, h / 2 + 4); }), transparent: true, depthWrite: false })); n.userData.p = R() * 6; n.position.set(DX, 3, -1.5); qs.add(n); NOTES.push(n); }
const NOTICE = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(560, 70, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = '700 30px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('※ 注意書き', 18, h / 2 + 2); g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 3; i++) g.fillRect(200 + i * 120, 30, 100, 10); }), transparent: true, depthWrite: false })); NOTICE.position.set(DX, 2.85, -0.5); NOTICE.scale.setScalar(0.75); qs.add(NOTICE);
const tNote = tag('毎回、注意書きと歌', { size: 62, w: 620, bg: '#14161c', sx: 2.6 }); tNote.position.set(DX, 3.75, -0.6); qs.add(tNote);
const tWord = tag('略して4文字が流行語大賞', { size: 54, w: 760, bg: '#e2483c', sx: 3.1 }); tWord.position.set(DX, 3.75, -0.6); qs.add(tWord);

// ---------- shots ----------
const ALL = [tBus, tPanel, tStrict, tDad, tTalk, tRules, tYears, tAsk, tJP, t10, tNote, tWord];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotStop(t, quiz = 0) { // 1段目 0〜9：帰りのバスを降りたら、みんな光る板をのぞきこんでいる（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.45, '#05060a');
  teach1.rotation.y = lerp(0.2, -1.0, ease(clamp((t - 4.4) / 1.0))); teach1.userData.head.rotation.x = 0;
  if (t > 5.4 || quiz) { teach1.userData.arms[0].rotation.x = -0.4; teach1.userData.arms[0].rotation.z = 0.5; }
  CROWD.forEach((p, i) => { p.userData.head.rotation.x = 0.45 + Math.sin(t * 0.8 + i) * 0.05; });
  if (!quiz) { tBus.userData.pop(1); if (t > 4.4) tBus.visible = false; tPanel.userData.pop((t - 4.6) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.6, 1.2, u), lerp(2.2, 2.0, u), lerp(5.6, 4.8, u), 2.0, 1.2, -1.0, 58);
  return qs;
}
function shotGym(t) { // 2段目 9〜17：口が悪くて厳しい中学の体育教師。娘と2人暮らし
  base(); S.aim(AX, -2); lift(0); S.hemi.intensity = 1.3;
  const blow = Math.sin(t * 3) > 0.6;
  teach2.userData.arms[1].rotation.x = blow ? -2.6 : -0.3; WHISTLE.position.set(teach2.position.x + 0.05, 1.68, teach2.position.z + 0.3); WHISTLE.visible = blow;
  teach2.userData.arms[0].rotation.x = 0; teach2.userData.arms[0].rotation.z = 0.6;
  STU.forEach((p, i) => { poseWalk(p, t * 9 + i, 1.0); p.position.x = AX - 2.6 + i * 1.3 + Math.sin(t * 2 + i) * 0.1; });
  girl2.visible = t > 4.2;
  tStrict.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStrict.visible = false; tDad.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.8, 0.6, u), lerp(1.9, 1.8, u), lerp(4.8, 4.2, u), AX + 0.3, 1.3, -1.2, 58);
  return qs;
}
function shotBar(t) { // 3段目 17〜25：居酒屋の隣の客は、言っちゃダメなことの話。どこもルールだらけ
  base(); S.aim(BX, -1); lift(0); S.hemi.intensity = 0.9; S.darken(0.3, '#1a0e08');
  GUESTS.forEach((p, i) => { p.rotation.y = i === 0 ? 0.6 : i === 2 ? -0.6 : 0; p.userData.arms[1].rotation.x = -0.6 - Math.abs(Math.sin(t * 3 + i)) * 0.6; });
  teach3.rotation.y = lerp(0, 0.9, ease(clamp((t - 2) / 1))); teach3.userData.head.rotation.z = t > 4.6 ? 0.2 : 0;
  BUBBLES.forEach((b, i) => { const k = ease(clamp((t - 4.4 - i * 0.3) / 0.3)); b.scale.setScalar(Math.max(1e-4, k)); b.visible = k > 0.01; });
  tTalk.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTalk.visible = false; tRules.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-1.4, -1.0, u), lerp(2.0, 1.9, u), lerp(4.4, 3.8, u), BX - 0.6, 1.5, -1.2, 58);
  return qs;
}
function shotEras(t) { // 4段目 25〜33：38年を、バスで行ったり来たり。彼の言葉が今の人に問いかける
  base(); S.aim(CX, -2); lift(160); S.hemi.intensity = 1.2;
  BUS4.position.x = CX + Math.sin(t * 1.2) * 2.4;
  tYears.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tYears.visible = false; tAsk.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX, lerp(3.6, 3.3, u), lerp(8.6, 7.8, u), CX, 1.6, -2.5, 60);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：1986年と2024年を行き来する、2024年の日本のドラマ。全10話のコメディ
  base(); S.aim(TX, 0); lift(0); S.hemi.intensity = 1.1;
  tJP.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJP.visible = false; t10.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.4, 2.8, lerp(8.0, 7.2, u), TX + 0.4, 2.7, -1.5, 56);
  return qs;
}
function shotMusical(t) { // 6段目 42〜49（決め手）：毎回の注意書きとミュージカル。略した4文字がその年の流行語大賞
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.8; S.darken(0.4, '#0a0614');
  S.spot.color.set(0xfff0c0); S.spot.position.set(DX, 6, 1); S.spot.target.position.set(DX, 0.4, -1.5); S.spot.intensity = 60;
  DANCE.forEach((p, i) => { const ph = t * 5 + i * 0.6; p.userData.arms[0].rotation.x = -2.4 + Math.sin(ph) * 0.4; p.userData.arms[1].rotation.x = -2.4 - Math.sin(ph) * 0.4; p.position.y = 0.4 + Math.abs(Math.sin(ph)) * 0.15; p.rotation.y = Math.sin(t * 2 + i) * 0.3; });
  NOTES.forEach((n, i) => { const a = n.userData.p + t * 1.2; n.position.set(DX - 2.5 + (i % 6) * 1.0, 2.4 + ((t * 0.6 + i * 0.3) % 1.2), -1.3); n.material.opacity = 1; });
  NOTICE.visible = t > 0.4;
  tNote.userData.pop((t - 0.3) / 0.35); if (t > 3.2) tNote.visible = false; tWord.userData.pop((t - 3.4) / 0.3);
  const u = ease(t / 7);
  look(DX, lerp(2.4, 2.3, u), lerp(6.8, 6.0, u), DX, 1.6, -1.4, 58);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜のバス停。バスのライトだけ）
  shotStop(8.0, 1);
  ALL.forEach(x => x.visible = false);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.8, 0.35, d);
  S.spot.color.set(0xffe8c0); S.spot.position.set(1.4, 5, 1.5); S.spot.target.position.set(1.4, 1, -0.6); S.spot.intensity = lerp(0, 40, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(lerp(1.2, 1.4, k), lerp(2.0, 1.9, k), lerp(4.8, 4.0, k), 1.8, 1.2, -1.0, 58);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStop(t, 0) },
  { a: 9, b: 17, f: shotGym },
  { a: 17, b: 25, f: shotBar },
  { a: 25, b: 33, f: shotEras },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotMusical },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'いつもの帰りのバスを<br>降りたら、'],
  [5.6, 9.0, 'みんな、小さな光る板を<br>のぞきこんでいた。'],
  [9.2, 13.2, '主人公は、口が悪くて<br>厳しい中学の体育教師。'],
  [13.2, 17.0, '娘と2人で暮らす、<br>シングルファーザー。'],
  [17.2, 21.0, '居酒屋の隣の客は、<br>言っちゃダメなことの話。'],
  [21.0, 25.0, 'どこもかしこも、<br>ルールだらけ。'],
  [25.2, 29.0, '38年の時を、<br>バスで行ったり来たり。'],
  [29.0, 33.0, '彼の言葉が、今の人たちに<br>大切なことを問いかける。'],
  [33.2, 37.4, '1986年と2024年を<br>行き来する、日本のドラマ。'],
  [37.4, 41.8, '2024年に放送された、<br>全10話のコメディ。'],
  [42.2, 45.4, '毎回、画面に注意書きが出て、<br>なぜか歌が始まる。'],
  [45.4, 49.0, '略した4文字は、<br>その年の流行語大賞。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、不適切にも<br>ほどがある！'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q067', v2: true, answer: '不適切にもほどがある！',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 6767,
    hits: [5.6, 13.2, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '帰り': 'かえり', '降りたら': 'おりたら', '小さな': 'ちいさな', '光る板': 'ひかるいた', '主人公': 'しゅじんこう', '口が悪くて': 'くちがわるくて', '厳しい': 'きびしい', '中学': 'ちゅうがく', '体育教師': 'たいいくきょうし', '娘': 'むすめ', '2人': 'ふたり', '暮らす': 'くらす', '居酒屋': 'いざかや', '隣の客': 'となりのきゃく', '言っちゃダメ': 'いっちゃダメ', '話': 'はなし', '38年': 'さんじゅうはちねん', '時を': 'ときを', '行ったり来たり': 'いったりきたり', '彼の言葉': 'かれのことば', '今の人': 'いまのひと', '大切': 'たいせつ', '問いかける': 'といかける', '1986年': 'せんきゅうひゃくはちじゅうろくねん', '2024年': 'にせんにじゅうよねん', '行き来': 'いきき', '日本': 'にほん', '放送': 'ほうそう', '全10話': 'ぜんじゅうわ', '毎回': 'まいかい', '画面': 'がめん', '注意書き': 'ちゅういがき', '出て': 'でて', '歌が始まる': 'うたがはじまる', '略した': 'りゃくした', '4文字': 'よんもじ', '流行語大賞': 'りゅうこうごたいしょう', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '不適切': 'ふてきせつ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nいつもの帰りのバスを降りたら、みんな、小さな光る板をのぞきこんでいた。主人公は、口が悪くて厳しい中学の体育教師。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'ネトフリ', 'ドラマ好き', 'コメディ'],
  },
});
applyQuizCards({ answer: '不適切にも<br>ほどがある！', info: 'U-NEXT・Netflix｜日本のドラマ・全10話', answerSize: 112 });
